#!/usr/bin/env python3
"""
Monta o Ciber-Herói (traje tático azul-marinho micro-hexagonal, musculatura esculpida,
frisos vermelhos 3D, placas prata escovado, capacete aerodinâmico com asas laterais e
viseira em T azul luminosa) no Blender 4.0.

Exporta:
  - ciber_heroi.blend
  - ciber_heroi.glb  (esqueleto game_engine de 53 ossos + 10 dedos articulados,
                      100% compatível com universal.js e Three.js)
  - Renderizações Cycles de estúdio (turnaround de 3 ângulos igual à referência + close do busto)
"""
import math
import os
import sys
import numpy as np
import bpy
import bmesh
from mathutils import Vector, Matrix, kdtree

DIR = os.path.dirname(os.path.abspath(__file__))
TEX_DIR = os.path.join(DIR, 'tex')
BASE_GLB = os.path.abspath(os.path.join(DIR, '..', 'realistas', 'maratonista.glb'))
OUT_BLEND = os.path.join(DIR, 'ciber_heroi.blend')
OUT_GLB = os.path.join(DIR, 'ciber_heroi.glb')

ARGV = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT_TURN = ARGV[ARGV.index('--turnaround') + 1] if '--turnaround' in ARGV else os.path.join(DIR, 'turnaround_ciber_heroi.png')
OUT_BUSTO = ARGV[ARGV.index('--busto') + 1] if '--busto' in ARGV else os.path.join(DIR, 'busto_ciber_heroi.png')


def srgb_lin(c):
    return tuple(((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c)


# ==============================================================================
# 1. CENA LIMPA E IMPORTAÇÃO DO ESQUELETO DE 53 OSSOS + BASE ANATÔMICA
# ==============================================================================
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

bpy.ops.import_scene.gltf(filepath=BASE_GLB)
bpy.context.view_layer.update()

arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
arm.name = 'ciber_heroi'
arm.data.name = 'ciber_heroi_rig'

src_corpo = bpy.data.objects['corpo']
src_roupa = bpy.data.objects['roupa']
src_sapatos = bpy.data.objects['sapatos']

# Remove malhas que não pertencem ao traje fechado (cabelo, olhos, dentes, cílios, sobrancelhas, icosphere)
for o in list(bpy.data.objects):
    if o not in (arm, src_corpo, src_roupa, src_sapatos):
        bpy.data.objects.remove(o, do_unlink=True)

# Posições de referência dos ossos em coordenadas de mundo (Z para cima, -Y frente, +X esquerda)
BONES_W = {}
for b in arm.data.bones:
    BONES_W[b.name] = (arm.matrix_world @ b.head_local, arm.matrix_world @ b.tail_local)

BONE_NAMES = [b.name for b in arm.data.bones]


# ==============================================================================
# 2. MATERIAIS PBR (Principled BSDF — Cycles + glTF 2.0)
# ==============================================================================
def criar_materiais():
    mats = {}

    # 2.1 Tecido tático micro-hexagonal azul-marinho meia-noite (sem Coat duplo p/ zero ruído no Cycles!)
    m_hex = bpy.data.materials.new('MatTrajeHex')
    m_hex.use_nodes = True
    nt = m_hex.node_tree
    bsdf = nt.nodes['Principled BSDF']
    bsdf.inputs['Metallic'].default_value = 0.18
    bsdf.inputs['Specular IOR Level'].default_value = 0.56

    t_alb = nt.nodes.new('ShaderNodeTexImage')
    t_alb.image = bpy.data.images.load(os.path.join(TEX_DIR, 'hex_albedo.png'), check_existing=True)
    nt.links.new(t_alb.outputs['Color'], bsdf.inputs['Base Color'])

    t_rgh = nt.nodes.new('ShaderNodeTexImage')
    t_rgh.image = bpy.data.images.load(os.path.join(TEX_DIR, 'hex_roughness.png'), check_existing=True)
    t_rgh.image.colorspace_settings.name = 'Non-Color'
    nt.links.new(t_rgh.outputs['Color'], bsdf.inputs['Roughness'])

    t_nrm = nt.nodes.new('ShaderNodeTexImage')
    t_nrm.image = bpy.data.images.load(os.path.join(TEX_DIR, 'hex_height.png'), check_existing=True)
    t_nrm.image.colorspace_settings.name = 'Non-Color'
    bump_node = nt.nodes.new('ShaderNodeBump')
    bump_node.inputs['Strength'].default_value = 0.36
    bump_node.inputs['Distance'].default_value = 0.0020
    nt.links.new(t_nrm.outputs['Color'], bump_node.inputs['Height'])
    nt.links.new(bump_node.outputs['Normal'], bsdf.inputs['Normal'])
    mats['hex'] = m_hex

    # 2.2 Placas rígidas azul-marinho meia-noite acetinado (capacete, joelheiras — visível tanto no Cycles quanto no Three.js!)
    m_cap = bpy.data.materials.new('MatArmaduraAzul')
    m_cap.use_nodes = True
    b = m_cap.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*srgb_lin((0.155, 0.210, 0.320)), 1.0)
    b.inputs['Metallic'].default_value = 0.24
    b.inputs['Roughness'].default_value = 0.26
    if 'Coat Weight' in b.inputs:
        b.inputs['Coat Weight'].default_value = 0.25
        b.inputs['Coat Roughness'].default_value = 0.16
    mats['azul_placa'] = m_cap

    # 2.3 Titânio / Prata escovado (asas do capacete, cinto V, chevron das costas, braceletes, caneleiras)
    m_prata = bpy.data.materials.new('MatPrata')
    m_prata.use_nodes = True
    b = m_prata.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*srgb_lin((0.76, 0.79, 0.85)), 1.0)
    b.inputs['Metallic'].default_value = 0.92
    b.inputs['Roughness'].default_value = 0.23
    mats['prata'] = m_prata

    # 2.4 Vermelho carmesim anodizado (frisos 3D, fivela, detalhes de orelha/costas)
    m_verm = bpy.data.materials.new('MatVermelho')
    m_verm.use_nodes = True
    b = m_verm.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*srgb_lin((0.72, 0.085, 0.115)), 1.0)
    b.inputs['Metallic'].default_value = 0.48
    b.inputs['Roughness'].default_value = 0.26
    mats['vermelho'] = m_verm

    # 2.5 Obsidiana fumê brilhante (escudo T da viseira e detalhes escuros)
    m_obs = bpy.data.materials.new('MatViseiraEscura')
    m_obs.use_nodes = True
    b = m_obs.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*srgb_lin((0.020, 0.026, 0.042)), 1.0)
    b.inputs['Metallic'].default_value = 0.72
    b.inputs['Roughness'].default_value = 0.07
    if 'Coat Weight' in b.inputs:
        b.inputs['Coat Weight'].default_value = 0.92
        b.inputs['Coat Roughness'].default_value = 0.03
    mats['viseira_escura'] = m_obs

    # 2.6 Ópticas / LEDs azul-safira elétrico luminoso
    m_luz = bpy.data.materials.new('MatLuzAzul')
    m_luz.use_nodes = True
    b = m_luz.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*srgb_lin((0.02, 0.34, 0.98)), 1.0)
    b.inputs['Metallic'].default_value = 0.25
    b.inputs['Roughness'].default_value = 0.05
    if 'Coat Weight' in b.inputs:
        b.inputs['Coat Weight'].default_value = 1.0
        b.inputs['Coat Roughness'].default_value = 0.03
    b.inputs['Emission Color'].default_value = (*srgb_lin((0.04, 0.54, 1.00)), 1.0)
    b.inputs['Emission Strength'].default_value = 3.2
    mats['luz_azul'] = m_luz

    # 2.7 Solado tático escuro
    m_sola = bpy.data.materials.new('MatSola')
    m_sola.use_nodes = True
    b = m_sola.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*srgb_lin((0.040, 0.046, 0.062)), 1.0)
    b.inputs['Metallic'].default_value = 0.08
    b.inputs['Roughness'].default_value = 0.68
    mats['sola'] = m_sola

    return mats


MATS = criar_materiais()


# ==============================================================================
# 3. UTILITÁRIOS DE PESOS, UV CONTÍNUO E PARENTING NO RIG
# ==============================================================================
def parentar_no_rig(ob):
    ob.parent = arm
    ob.matrix_parent_inverse = arm.matrix_world.inverted()
    for name in BONE_NAMES:
        if name not in ob.vertex_groups:
            ob.vertex_groups.new(name=name)
    mod = ob.modifiers.get('Armature') or ob.modifiers.new('Armature', 'ARMATURE')
    mod.object = arm
    return ob


def aplicar_uv_triplanar(me, escala=13.5):
    """Projeta UVs suaves por face sem inversão de quiralidade."""
    uv_layer = me.uv_layers.active or me.uv_layers.new(name='UVMap')
    verts = me.vertices
    for poly in me.polygons:
        n = poly.normal
        anx, any_, anz = abs(n.x), abs(n.y), abs(n.z)
        for li in poly.loop_indices:
            co = verts[me.loops[li].vertex_index].co
            if any_ >= anx and any_ >= anz:
                s = 1.0 if n.y < 0 else -1.0
                u, v = co.x * s * escala, co.z * escala
            elif anx >= any_ and anx >= anz:
                s = 1.0 if n.x >= 0 else -1.0
                u, v = co.y * s * escala, co.z * escala
            else:
                s = 1.0 if n.z >= 0 else -1.0
                u, v = co.x * escala, co.y * s * escala
            uv_layer.data[li].uv = (u, v)


def copiar_objeto_mundo(src, nome):
    """Cria cópia da malha já em coordenadas de mundo, sem shape keys nem color attributes residuais."""
    ob = src.copy()
    ob.name = nome
    ob.data = src.data.copy()
    scene.collection.objects.link(ob)
    mw = src.matrix_world.copy()
    ob.parent = None
    ob.modifiers.clear()
    ob.matrix_world = mw
    if ob.data.shape_keys:
        ob.shape_key_clear()
    if hasattr(ob.data, 'color_attributes'):
        while len(ob.data.color_attributes) > 0:
            ob.data.color_attributes.remove(ob.data.color_attributes[0])
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return ob


# ==============================================================================
# 4. EXTRAÇÃO DAS LUVAS ARTICULADAS DE 5 DEDOS (SEM FUNDIR DEDOS!)
# ==============================================================================
def construir_luvas():
    luvas = copiar_objeto_mundo(src_corpo, 'Luvas')
    la_l0, la_l1 = BONES_W['lowerarm_l']
    la_r0, la_r1 = BONES_W['lowerarm_r']
    dir_l = (la_l1 - la_l0).normalized()
    dir_r = (la_r1 - la_r0).normalized()
    len_l = (la_l1 - la_l0).length

    bm = bmesh.new()
    bm.from_mesh(luvas.data)
    bm.verts.ensure_lookup_table()
    bm.normal_update()

    apagar = []
    for v in bm.verts:
        p = v.co
        if p.x >= 0:
            s = (p - la_l0).dot(dir_l) / len_l
        else:
            s = (p - la_r0).dot(dir_r) / len_l
        if s < 0.85 or p.z > 1.32 or abs(p.x) < 0.36:
            apagar.append(v)
        else:
            fator = min(1.0, max(0.0, (s - 0.85) / 0.08))
            v.co = p + v.normal * (0.0016 * fator)

    bmesh.ops.delete(bm, geom=apagar, context='VERTS')
    bm.to_mesh(luvas.data)
    bm.free()
    luvas.data.update()

    luvas.data.materials.clear()
    luvas.data.materials.append(MATS['hex'])
    for p in luvas.data.polygons:
        p.use_smooth = True
    aplicar_uv_triplanar(luvas.data, escala=16.5)
    parentar_no_rig(luvas)
    return luvas


# ==============================================================================
# 5. CORPO MUSCULOSO CONTÍNUO (VOXEL REMESH + ESCULTURA ANATÔMICA DE SUPER-HERÓI)
# ==============================================================================
def construir_traje_corpo():
    c_body = copiar_objeto_mundo(src_corpo, '_tmp_corpo')
    c_roupa = copiar_objeto_mundo(src_roupa, '_tmp_roupa')
    c_sap = copiar_objeto_mundo(src_sapatos, '_tmp_sapatos')

    # Fonte unificada com pesos originais para DataTransfer perfeito depois da escultura!
    fonte_pesos_obs = [
        copiar_objeto_mundo(src_corpo, '_w_corpo'),
        copiar_objeto_mundo(src_roupa, '_w_roupa'),
        copiar_objeto_mundo(src_sapatos, '_w_sapatos'),
    ]
    bpy.ops.object.select_all(action='DESELECT')
    for o in fonte_pesos_obs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = fonte_pesos_obs[0]
    bpy.ops.object.join()
    fonte_pesos = bpy.context.active_object
    fonte_pesos.name = '_FontePesos'

    # 5.1 Corta cabeça na metade do pescoço (z > 1.585) e afunila queixo/garganta para entrar limpo no capacete
    la_l0, la_l1 = BONES_W['lowerarm_l']
    la_r0, la_r1 = BONES_W['lowerarm_r']
    dir_l = (la_l1 - la_l0).normalized()
    dir_r = (la_r1 - la_r0).normalized()
    len_l = (la_l1 - la_l0).length

    bm = bmesh.new()
    bm.from_mesh(c_body.data)
    apagar = []
    for v in bm.verts:
        p = v.co
        if p.z > 1.590:
            apagar.append(v)
            continue
        if p.z > 1.515 and abs(p.x) < 0.14:
            k_neck = min(1.0, (p.z - 1.515) / 0.065)
            cx_n, cy_n = 0.0, -0.026
            dx_n, dy_n = p.x - cx_n, p.y - cy_n
            r_n = math.hypot(dx_n, dy_n)
            if r_n > 0.055:
                esc_n = (0.055 / r_n) * k_neck + (1.0 - k_neck)
                v.co.x = cx_n + dx_n * esc_n
                v.co.y = cy_n + dy_n * esc_n
        if abs(p.x) > 0.36 and p.z < 1.35:
            s = ((p - la_l0).dot(dir_l) if p.x >= 0 else (p - la_r0).dot(dir_r)) / len_l
            if s > 0.89:
                apagar.append(v)
    bmesh.ops.delete(bm, geom=apagar, context='VERTS')
    bm.to_mesh(c_body.data)
    bm.free()

    # 5.2 Cola regata/short no corpo (especialmente cintura e barra da coxa!) p/ silhueta colada a vácuo
    th_l0, th_l1 = BONES_W['thigh_l']
    th_r0, th_r1 = BONES_W['thigh_r']
    for v in c_roupa.data.vertices:
        p = v.co
        if p.z < 0.82:
            a0, a1 = (th_l0, th_l1) if p.x >= 0 else (th_r0, th_r1)
            ab = a1 - a0
            t = max(0.0, min(1.0, (p - a0).dot(ab) / ab.length_squared))
            eixo = a0 + ab * t
            rad = p - eixo
            k_pull = min(1.0, max(0.0, (0.82 - p.z) / 0.16)) * 0.20
            v.co = p - rad * k_pull
        elif 0.96 < p.z < 1.28:
            # Remove volume de camiseta/cós folgado na cintura
            k_w = math.exp(-((p.z - 1.10) / 0.11) ** 2) * 0.11
            v.co.x *= (1.0 - k_w)
            v.co.y *= (1.0 - k_w * 0.85)

    # 5.2b Afunila o tênis de corrida (`c_sap`) p/ virar bota tática aerodinâmica de super-herói (ZERO aba larga!)
    ank_l = BONES_W['foot_l'][0]
    ank_r = BONES_W['foot_r'][0]
    for v in c_sap.data.vertices:
        p = v.co
        p.z = max(0.002, (p.z + 0.018) * 0.93)
        cx_f = ank_l.x if p.x >= 0 else ank_r.x
        cy_f = ank_l.y
        dx_f = p.x - cx_f
        dy_f = p.y - cy_f
        # Enxuga entressola E colarinho superior (z > 0.14) p/ entrar invisível dentro da canela!
        tuck_top = 0.16 * min(1.0, max(0.0, (p.z - 0.13) / 0.08))
        slim = 0.75 - tuck_top
        p.x = cx_f + dx_f * slim
        if p.z > 0.13:
            p.y = cy_f + dy_f * (1.0 - tuck_top * 1.15)
        elif p.y > cy_f + 0.042:
            p.y = cy_f + 0.042 + (p.y - (cy_f + 0.042)) * 0.62

    # 5.3 Solidifica cada casca para dentro e une por Voxel Remesh quad uniforme
    pecas = [c_body, c_roupa, c_sap]
    for ob in pecas:
        bm_s = bmesh.new()
        bm_s.from_mesh(ob.data)
        bmesh.ops.recalc_face_normals(bm_s, faces=bm_s.faces)
        bm_s.to_mesh(ob.data)
        bm_s.free()
        bpy.ops.object.select_all(action='DESELECT')
        bpy.context.view_layer.objects.active = ob
        ob.select_set(True)
        sol = ob.modifiers.new('Sol', 'SOLIDIFY')
        sol.thickness = 0.028 if ob == c_sap else 0.036
        sol.offset = -1.0
        sol.use_rim = True
        bpy.ops.object.modifier_apply(modifier='Sol')

    bpy.ops.object.select_all(action='DESELECT')
    for ob in pecas:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = c_body
    bpy.ops.object.join()
    traje = bpy.context.active_object
    traje.name = 'TrajeCorpo'

    rem = traje.modifiers.new('Rem', 'REMESH')
    rem.mode = 'VOXEL'
    rem.voxel_size = 0.0064
    rem.use_smooth_shade = True
    bpy.ops.object.modifier_apply(modifier='Rem')

    sm = traje.modifiers.new('Sm0', 'SMOOTH')
    sm.factor = 0.65
    sm.iterations = 9
    bpy.ops.object.modifier_apply(modifier='Sm0')

    # 5.4 ESCULTURA ANATÔMICA DE SUPER-HERÓI (Silhueta em V, Peitoral bipartido, 6-Pack profundo, Deltoides, Coxas)
    if hasattr(traje.data, 'calc_normals'):
        traje.data.calc_normals()
    n_v = len(traje.data.vertices)
    P = np.empty(n_v * 3, dtype=np.float64)
    N = np.empty(n_v * 3, dtype=np.float64)
    traje.data.vertices.foreach_get('co', P)
    traje.data.vertices.foreach_get('normal', N)
    P = P.reshape(-1, 3)
    N = N.reshape(-1, 3)

    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    ax = np.abs(x)
    disp = np.zeros(n_v, dtype=np.float64)
    shift_x = np.zeros(n_v, dtype=np.float64)
    shift_y = np.zeros(n_v, dtype=np.float64)

    # Máscara de tronco central (não afeta os braços!)
    m_tronco = np.exp(-((ax / 0.215) ** 6))

    # (A) V-Taper de Super-Herói: dorsais largos + cintura atlética afinada!
    v_lat = np.exp(-((z - 1.37) / 0.12) ** 2) * np.clip((ax - 0.05) / 0.11, 0.0, 1.0) * m_tronco
    waist_cinch = np.exp(-((z - 1.085) / 0.095) ** 2) * m_tronco
    shift_x += np.sign(x) * 0.021 * v_lat - x * 0.165 * waist_cinch
    shift_y -= y * 0.085 * waist_cinch

    rib_front = np.exp(-((z - 1.38) / 0.105) ** 2) * np.clip((-y - 0.03) / 0.09, 0.0, 1.0) * m_tronco
    shift_y -= 0.015 * rib_front
    back_upper = np.exp(-((z - 1.39) / 0.13) ** 2) * np.clip((y - 0.02) / 0.08, 0.0, 1.0) * m_tronco
    erector = np.exp(-((ax - 0.044) / 0.030) ** 2) * np.exp(-((z - 1.25) / 0.18) ** 2) * np.clip((y - 0.03) / 0.06, 0.0, 1.0)
    spine_groove = np.exp(-(ax / 0.013) ** 2) * np.exp(-((z - 1.28) / 0.20) ** 2) * np.clip((y - 0.03) / 0.06, 0.0, 1.0)
    shift_y += 0.012 * back_upper + 0.0075 * erector - 0.0065 * spine_groove

    # (B) Placas Peitorais Esculpidas + Sulco Esternal + Sulco Inframamário nítido!
    frente_mask = np.clip((-y - 0.050) / 0.060, 0.0, 1.0) * m_tronco
    pec_x = np.clip(1.0 - np.abs((ax - 0.082) / 0.068) ** 2.6, 0.0, 1.0) * np.clip((ax - 0.011) / 0.014, 0.0, 1.0)
    pec_z = np.clip(1.0 - np.abs((z - 1.386) / 0.065) ** 2.8, 0.0, 1.0)
    disp += 0.0185 * pec_x * pec_z * frente_mask

    sternum = np.exp(-(ax / 0.011) ** 2) * np.exp(-((z - 1.38) / 0.068) ** 2) * frente_mask
    z_pec_inf = 1.316 + 0.024 * ((ax / 0.14) ** 2.0)
    pec_under_groove = np.exp(-((z - z_pec_inf) / 0.012) ** 2) * np.clip(1.0 - ((ax - 0.075) / 0.078) ** 2, 0.0, 1.0) * frente_mask
    disp -= 0.0068 * sternum + 0.0058 * pec_under_groove

    # (C) Abdômen 6-Pack Esculpido (3 pares de gomos altos + sulcos tendíneos negativos!)
    for z_c, w_x, h_z, amp in (
        (1.270, 0.030, 0.025, 0.0125),
        (1.202, 0.029, 0.025, 0.0130),
        (1.134, 0.027, 0.026, 0.0115),
    ):
        gx = np.clip(1.0 - np.abs((ax - 0.039) / w_x) ** 2.8, 0.0, 1.0) * np.clip((ax - 0.008) / 0.010, 0.0, 1.0)
        gz = np.clip(1.0 - np.abs((z - z_c) / h_z) ** 2.8, 0.0, 1.0)
        disp += amp * gx * gz * frente_mask

    linea_alba = np.exp(-(ax / 0.0085) ** 2) * np.exp(-((z - 1.20) / 0.105) ** 2) * frente_mask
    semilunaris = np.exp(-((ax - 0.070) / 0.009) ** 2) * np.exp(-((z - 1.20) / 0.105) ** 2) * frente_mask
    disp -= (0.0048 * linea_alba + 0.0042 * semilunaris)
    for z_g in (1.236, 1.168, 1.098):
        h_groove = np.exp(-((z - z_g) / 0.008) ** 2) * np.clip(1.0 - (ax / 0.070) ** 2, 0.0, 1.0) * frente_mask
        disp -= 0.0040 * h_groove

    oblique = np.exp(-((ax - 0.102) / 0.028) ** 2) * np.exp(-((z - 1.20) / 0.095) ** 2) * np.clip((-y + 0.01) / 0.08, 0.0, 1.0) * m_tronco
    disp += 0.0080 * oblique

    # (D) Glúteos atléticos definidos (vista traseira)
    glute_mask = np.clip((y - 0.035) / 0.065, 0.0, 1.0) * np.exp(-((ax - 0.076) / 0.058) ** 2) * np.clip((ax - 0.010) / 0.016, 0.0, 1.0)
    glute_z = np.exp(-((z - 0.925) / 0.072) ** 2)
    glute_cleft = np.exp(-(ax / 0.010) ** 2) * np.exp(-((z - 0.92) / 0.075) ** 2) * np.clip((y - 0.04) / 0.06, 0.0, 1.0)
    disp += 0.0135 * glute_mask * glute_z - 0.0055 * glute_cleft

    # (E) Deltoides 3 cabeças + Bíceps/Tríceps + Antebraços + Quadríceps + Panturrilhas
    for side, sgn in (('l', 1.0), ('r', -1.0)):
        ua0, ua1 = BONES_W[f'upperarm_{side}']
        la0, la1 = BONES_W[f'lowerarm_{side}']
        ua_v = np.array(ua1 - ua0)
        ua_len = np.linalg.norm(ua_v)
        ua_u = ua_v / ua_len
        la_v = np.array(la1 - la0)
        la_len = np.linalg.norm(la_v)
        la_u = la_v / la_len

        m_lado = (x * sgn) > 0.08
        d_sh = np.linalg.norm(P - np.array(ua0 + Vector((sgn * 0.016, 0.0, -0.022))), axis=1)
        delt = np.exp(-(d_sh / 0.094) ** 2) * m_lado * (ax > 0.14)
        disp += 0.0185 * delt

        rel_ua = P - np.array(ua0)
        s_ua = (rel_ua @ ua_u) / ua_len
        rad_ua = np.linalg.norm(rel_ua - np.outer(s_ua * ua_len, ua_u), axis=1)
        m_ua = m_lado & (rad_ua < 0.095) & (s_ua > 0.05) & (s_ua < 1.02)
        biceps_bell = np.sin(np.clip((s_ua - 0.05) / 0.95, 0.0, 1.0) * math.pi) ** 0.85
        disp += 0.0130 * biceps_bell * m_ua

        rel_la = P - np.array(la0)
        s_la = (rel_la @ la_u) / la_len
        rad_la = np.linalg.norm(rel_la - np.outer(s_la * la_len, la_u), axis=1)
        m_la = m_lado & (rad_la < 0.085) & (s_la > -0.02) & (s_la < 0.80)
        fore_bell = np.sin(np.clip((s_la + 0.02) / 0.82, 0.0, 1.0) * math.pi) * np.clip(1.0 - s_la / 0.80, 0.0, 1.0) ** 0.45
        disp += 0.0105 * fore_bell * m_la

        th0, th1 = BONES_W[f'thigh_{side}']
        cf0, cf1 = BONES_W[f'calf_{side}']
        th_v = np.array(th1 - th0)
        th_len = np.linalg.norm(th_v)
        th_u = th_v / th_len
        cf_v = np.array(cf1 - cf0)
        cf_len = np.linalg.norm(cf_v)
        cf_u = cf_v / cf_len

        m_perna = (x * sgn) > 0.01
        rel_th = P - np.array(th0)
        s_th = (rel_th @ th_u) / th_len
        rad_th = np.linalg.norm(rel_th - np.outer(s_th * th_len, th_u), axis=1)
        m_th = m_perna & (rad_th < 0.138) & (s_th > 0.02) & (s_th < 0.98)
        quad_bell = np.sin(np.clip((s_th - 0.02) / 0.96, 0.0, 1.0) * math.pi) ** 0.75
        disp += 0.0155 * quad_bell * m_th

        rel_cf = P - np.array(cf0)
        s_cf = (rel_cf @ cf_u) / cf_len
        rad_cf = np.linalg.norm(rel_cf - np.outer(s_cf * cf_len, cf_u), axis=1)
        m_cf = m_perna & (rad_cf < 0.10) & (s_cf > 0.05) & (s_cf < 0.78)
        calf_bell = np.exp(-((s_cf - 0.34) / 0.24) ** 2) * (0.65 + 0.60 * np.clip(y / 0.06, 0.0, 1.0))
        disp += 0.0125 * calf_bell * m_cf

    P[:, 0] += shift_x + N[:, 0] * disp
    P[:, 1] += shift_y + N[:, 1] * disp
    P[:, 2] += N[:, 2] * disp
    P[:, 2] = np.maximum(P[:, 2], 0.0)

    traje.data.vertices.foreach_set('co', P.ravel())
    traje.data.update()

    # Suavização quad uniforme leve para manter os sulcos musculares bem marcados!
    sm2 = traje.modifiers.new('SmMuscle', 'SMOOTH')
    sm2.factor = 0.42
    sm2.iterations = 4
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = traje
    traje.select_set(True)
    bpy.ops.object.modifier_apply(modifier='SmMuscle')

    # Transfere os pesos exatos de todos os 53 ossos da malha original
    for name in BONE_NAMES:
        if name not in traje.vertex_groups:
            traje.vertex_groups.new(name=name)
    dt = traje.modifiers.new('DT', 'DATA_TRANSFER')
    dt.object = fonte_pesos
    dt.use_vert_data = True
    dt.data_types_verts = {'VGROUP_WEIGHTS'}
    dt.vert_mapping = 'POLYINTERP_NEAREST'
    bpy.ops.object.modifier_apply(modifier='DT')
    bpy.ops.object.mode_set(mode='WEIGHT_PAINT')
    bpy.ops.object.vertex_group_smooth(group_select_mode='ALL', factor=0.5, repeat=3)
    bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4)
    bpy.ops.object.mode_set(mode='OBJECT')

    bpy.data.objects.remove(fonte_pesos, do_unlink=True)

    traje.data.materials.clear()
    traje.data.materials.append(MATS['hex'])
    for p in traje.data.polygons:
        p.use_smooth = True
    aplicar_uv_triplanar(traje.data, escala=14.0)
    parentar_no_rig(traje)
    return traje


# ==============================================================================
# 6. PROJETOR DE SUPERFÍCIE (KDTree) P/ PLACAS E FRISOS 3D MOLDADOS AO CORPO
# ==============================================================================
class SuperficieCorpo:
    def __init__(self, ob_corpo):
        if hasattr(ob_corpo.data, 'calc_normals'):
            ob_corpo.data.calc_normals()
        self.ob = ob_corpo
        self.verts = ob_corpo.data.vertices
        n = len(self.verts)
        self.kd = kdtree.KDTree(n)
        for i, v in enumerate(self.verts):
            self.kd.insert(v.co, i)
        self.kd.balance()

        self.pesos = [{} for _ in range(n)]
        vg_names = {vg.index: vg.name for vg in ob_corpo.vertex_groups}
        for i, v in enumerate(self.verts):
            for g in v.groups:
                if g.weight > 1e-4 and g.group in vg_names:
                    self.pesos[i][vg_names[g.group]] = g.weight

    def projetar(self, pt, k=8):
        """Retorna (ponto_na_superficie, normal_suave, pesos_interpolados) para qualquer ponto 3D."""
        hits = self.kd.find_n(Vector(pt), k)
        p_acc = Vector((0.0, 0.0, 0.0))
        n_acc = Vector((0.0, 0.0, 0.0))
        w_sum = 0.0
        pesos_acc = {}
        for co, idx, dist in hits:
            w = 1.0 / (dist + 0.0025) ** 2
            p_acc += co * w
            n_acc += self.verts[idx].normal * w
            w_sum += w
            for bname, bw in self.pesos[idx].items():
                pesos_acc[bname] = pesos_acc.get(bname, 0.0) + bw * w
        p_surf = p_acc / w_sum
        n_surf = n_acc.normalized()
        tot_b = sum(pesos_acc.values()) or 1.0
        pesos_top = sorted(((bn, bw / tot_b) for bn, bw in pesos_acc.items()), key=lambda x: -x[1])[:4]
        return p_surf, n_surf, pesos_top


class ConstrutorArmadura:
    """Acumula tiras 3D chanfradas, cintos, braceletes e placas moldadas sobre SuperficieCorpo."""
    def __init__(self, surf: SuperficieCorpo):
        self.surf = surf
        self.verts = []
        self.faces = []
        self.mat_idx = []
        self.pesos_v = []
        self.mats_ordem = ['vermelho', 'prata', 'azul_placa', 'luz_azul', 'viseira_escura', 'sola']

    def _m_id(self, chave):
        return self.mats_ordem.index(chave)

    def add_friso(self, pontos_guia, largura=0.0042, altura=0.0024, afundar=0.0010, mat='vermelho', fechado=False, subdiv=3, larg_mult=None):
        """Cria um friso 3D chanfrado perfeitamente colado à superfície muscular, sem afundar em curvas convexas!"""
        pts = [Vector(p) for p in pontos_guia]
        if fechado:
            pts = pts + [pts[0]]
        densos = []
        for i in range(len(pts) - 1):
            a, b = pts[i], pts[i + 1]
            steps = max(2, int((b - a).length / 0.007) * subdiv // 2)
            for s in range(steps):
                densos.append(a.lerp(b, s / steps))
        if not fechado:
            densos.append(pts[-1])
        if len(densos) < 3:
            return

        # Suaviza a curva guia
        for _ in range(3):
            novos = list(densos)
            rng = range(len(densos)) if fechado else range(1, len(densos) - 1)
            for i in rng:
                prv = densos[(i - 1) % len(densos)]
                nxt = densos[(i + 1) % len(densos)]
                novos[i] = densos[i] * 0.5 + (prv + nxt) * 0.25
            densos = novos

        # Projeta, suaviza tangencialmente e RE-PROJETA na superfície p/ NUNCA afundar em regiões convexas!
        amostras_0 = [self.surf.projetar(p) for p in densos]
        n_an = len(amostras_0)
        ps_list = [a[0] for a in amostras_0]
        for _ in range(4):
            np_l = list(ps_list)
            rng = range(n_an) if fechado else range(1, n_an - 1)
            for i in rng:
                prv = (i - 1) % n_an
                nxt = (i + 1) % n_an
                np_l[i] = ps_list[i] * 0.5 + (ps_list[prv] + ps_list[nxt]) * 0.25
            ps_list = np_l

        reproj = [self.surf.projetar(p) for p in ps_list]
        ns_list = [r[1] for r in reproj]
        for _ in range(3):
            nn_l = list(ns_list)
            rng = range(n_an) if fechado else range(1, n_an - 1)
            for i in rng:
                nn_l[i] = (ns_list[i] * 0.5 + (ns_list[(i - 1) % n_an] + ns_list[(i + 1) % n_an]) * 0.25).normalized()
            ns_list = nn_l

        amostras = [(reproj[i][0] + ns_list[i] * 0.0010, ns_list[i], reproj[i][2]) for i in range(n_an)]

        # Perfil transversal chanfrado (4 pontos: base esq, topo esq, topo dir, base dir)
        perfil = [(-0.50, -afundar), (-0.30, altura), (0.30, altura), (0.50, -afundar)]
        base_idx = len(self.verts)
        mid = self._m_id(mat)

        for i, (ps, ns, pw) in enumerate(amostras):
            if fechado:
                p_prev = amostras[(i - 1) % n_an][0]
                p_next = amostras[(i + 1) % n_an][0]
            else:
                p_prev = amostras[max(0, i - 1)][0]
                p_next = amostras[min(n_an - 1, i + 1)][0]
            tang = (p_next - p_prev)
            if tang.length < 1e-6:
                tang = Vector((0.0, 0.0, 1.0))
            tang.normalize()
            lat = tang.cross(ns).normalized()
            u_norm = i / max(1, n_an - 1)
            lm = larg_mult(u_norm) if larg_mult else 1.0
            w_atual = largura * lm
            for sx, sy in perfil:
                v_pos = ps + lat * (sx * w_atual) + ns * sy
                self.verts.append(v_pos)
                self.pesos_v.append(pw)

        n_rings = n_an if fechado else (n_an - 1)
        for i in range(n_rings):
            i_next = (i + 1) % n_an
            r0 = base_idx + i * 4
            r1 = base_idx + i_next * 4
            for k in range(3):
                self.faces.append([r0 + k, r0 + k + 1, r1 + k + 1, r1 + k])
                self.mat_idx.append(mid)
            # Fecha fundo interno para solidez
            self.faces.append([r0 + 3, r0 + 0, r1 + 0, r1 + 3])
            self.mat_idx.append(mid)

        if not fechado:
            # Tampas nas duas pontas
            self.faces.append([base_idx + 3, base_idx + 2, base_idx + 1, base_idx + 0])
            self.mat_idx.append(mid)
            ul = base_idx + (n_an - 1) * 4
            self.faces.append([ul + 0, ul + 1, ul + 2, ul + 3])
            self.mat_idx.append(mid)

    def add_placa_grade(self, funcao_uv_ponto, nu=16, nv=12, espessura=0.0048, chanfro=0.0035, afundar=0.0010, mat='prata'):
        """Cria uma placa rígida 3D chanfrada moldada na superfície a partir de uma grade paramétrica (u, v) em [0..1]."""
        mid = self._m_id(mat)
        # Amostra superfície na grade (nu x nv)
        grade_p = [[None] * nv for _ in range(nu)]
        grade_n = [[None] * nv for _ in range(nu)]
        grade_w = [[None] * nv for _ in range(nu)]
        for iu in range(nu):
            u = iu / (nu - 1)
            for iv in range(nv):
                v = iv / (nv - 1)
                ps, ns, pw = self.surf.projetar(funcao_uv_ponto(u, v))
                grade_p[iu][iv] = ps
                grade_n[iu][iv] = ns
                grade_w[iu][iv] = pw

        # Camada base (encostada na superfície) e camada topo (elevada por `espessura`, levemente retraída na borda p/ chanfro!)
        b_top = len(self.verts)
        for iu in range(nu):
            u = iu / (nu - 1)
            du = min(u, 1.0 - u)
            for iv in range(nv):
                v = iv / (nv - 1)
                dv = min(v, 1.0 - v)
                borda = min(du * (nu - 1), dv * (nv - 1))
                h = espessura * (0.35 if borda == 0 else 1.0)
                self.verts.append(grade_p[iu][iv] + grade_n[iu][iv] * h)
                self.pesos_v.append(grade_w[iu][iv])

        b_bot = len(self.verts)
        for iu in range(nu):
            for iv in range(nv):
                self.verts.append(grade_p[iu][iv] - grade_n[iu][iv] * afundar)
                self.pesos_v.append(grade_w[iu][iv])

        # Faces do topo
        for iu in range(nu - 1):
            for iv in range(nv - 1):
                a = b_top + iu * nv + iv
                b = b_top + (iu + 1) * nv + iv
                c = b_top + (iu + 1) * nv + (iv + 1)
                d = b_top + iu * nv + (iv + 1)
                # Garante orientação da normal para fora
                n_quad = (self.verts[b] - self.verts[a]).cross(self.verts[d] - self.verts[a])
                if n_quad.dot(grade_n[iu][iv]) >= 0:
                    self.faces.append([a, b, c, d])
                else:
                    self.faces.append([d, c, b, a])
                self.mat_idx.append(mid)

        # Paredes laterais chanfradas ao redor do perímetro
        perim = (
            [(iu, 0) for iu in range(nu - 1)] +
            [(nu - 1, iv) for iv in range(nv - 1)] +
            [(iu, nv - 1) for iu in range(nu - 1, 0, -1)] +
            [(0, iv) for iv in range(nv - 1, 0, -1)]
        )
        for k in range(len(perim)):
            iu0, iv0 = perim[k]
            iu1, iv1 = perim[(k + 1) % len(perim)]
            t0 = b_top + iu0 * nv + iv0
            t1 = b_top + iu1 * nv + iv1
            g0 = b_bot + iu0 * nv + iv0
            g1 = b_bot + iu1 * nv + iv1
            self.faces.append([g0, g1, t1, t0])
            self.mat_idx.append(mid)

    def finalizar(self, nome='ArmaduraEFrisos'):
        me = bpy.data.meshes.new(nome)
        me.from_pydata([tuple(v) for v in self.verts], [], self.faces)
        me.update()
        # Corrige normais para fora com bmesh
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me)
        bm.free()
        me.update()

        for chave in self.mats_ordem:
            me.materials.append(MATS[chave])
        for poly, m_i in zip(me.polygons, self.mat_idx):
            poly.material_index = m_i
            poly.use_smooth = True

        aplicar_uv_triplanar(me, escala=14.0)
        ob = bpy.data.objects.new(nome, me)
        scene.collection.objects.link(ob)
        parentar_no_rig(ob)

        for vi, pw in enumerate(self.pesos_v):
            for bname, bw in pw:
                if bname in ob.vertex_groups:
                    ob.vertex_groups[bname].add([vi], bw, 'REPLACE')
        return ob


# ==============================================================================
# 7. MONTAGEM DE TODAS AS PLACAS PRATA, CINTO V, JOELHEIRAS, BRACELETES E FRISOS VERMELHOS
# ==============================================================================
def construir_armadura_e_frisos(surf: SuperficieCorpo):
    A = ConstrutorArmadura(surf)

    # ---- 7.1 CINTO TÁTICO EM V 360° (Prata escovado contínuo + Fivela central vermelha frente/costas + bordas vermelhas)
    n_cinto = 72
    anel_cinto = []
    anel_borda_sup = []
    anel_borda_inf = []
    for i in range(n_cinto):
        th = 2.0 * math.pi * i / n_cinto  # 0 = frente (-Y), pi/2 = esq (+X), pi = costas (+Y)
        rx, ry = 0.165, 0.130
        px = math.sin(th) * rx
        py = -math.cos(th) * ry
        frente_v = max(0.0, math.cos(th)) ** 2.1
        costas_v = max(0.0, -math.cos(th)) ** 2.1
        pz = 1.055 - 0.062 * frente_v - 0.028 * costas_v
        anel_cinto.append((px, py, pz))
        anel_borda_sup.append((px, py, pz + 0.014))
        anel_borda_inf.append((px, py, pz - 0.014))

    A.add_friso(anel_cinto, largura=0.028, altura=0.0058, mat='prata', fechado=True, subdiv=2)
    A.add_friso(anel_borda_sup, largura=0.0042, altura=0.0064, mat='vermelho', fechado=True, subdiv=2)
    A.add_friso(anel_borda_inf, largura=0.0042, altura=0.0064, mat='vermelho', fechado=True, subdiv=2)

    # Fivela trapezoidal vermelha central na frente do cinto (com aro prata lateral) + inserto vermelho central nas costas
    A.add_placa_grade(
        lambda u, v: ((u - 0.5) * (0.046 + 0.026 * v), -0.17, 0.976 + v * 0.038),
        nu=10, nv=8, espessura=0.0080, mat='vermelho'
    )
    A.add_placa_grade(
        lambda u, v: ((u - 0.5) * (0.044 + 0.018 * v), 0.14, 1.010 + v * 0.034),
        nu=10, nv=8, espessura=0.0076, mat='vermelho'
    )

    # ---- 7.2 CHEVRONS PRATA + VERMELHO NAS COSTAS E ARCOS DE CLAVÍCULA/OMBRO CONTÍNUOS (igual à referência!)
    for sgn in (1.0, -1.0):
        pts_costas = [
            (sgn * 0.118,  0.012, 1.492),   # nasce exatamente no topo do trapézio (sem sobra solta na frente!)
            (sgn * 0.118,  0.068, 1.474),   # contorna o topo da escápula
            (sgn * 0.090,  0.125, 1.392),   # abre em V imponente nas escápulas
            (sgn * 0.042,  0.120, 1.265),   # converge na coluna média
        ]
        A.add_friso(
            pts_costas, largura=0.036, altura=0.0064, mat='prata', subdiv=3,
            larg_mult=lambda u: 0.72 + 0.48 * math.sin(u * math.pi)
        )
        A.add_friso(
            pts_costas[1:], largura=0.0115, altura=0.0078, mat='vermelho', subdiv=3,
            larg_mult=lambda u: 1.0 - 0.28 * u
        )

        # Arco prata escovado contínuo da clavícula até o deltoide
        pts_ombro_prata = [
            (sgn * 0.078, -0.088, 1.502),
            (sgn * 0.122, -0.078, 1.494),
            (sgn * 0.168, -0.045, 1.472),
            (sgn * 0.192,  0.005, 1.448),
        ]
        A.add_friso(pts_ombro_prata, largura=0.016, altura=0.0048, mat='prata', subdiv=3)

    # ---- 7.3 DOIS MICRO-LEDS AZUL-CIANO NO TÓRAX INFERIOR EXTERNO (detalhe exato da referência!)
    for sgn in (1.0, -1.0):
        A.add_friso(
            [(sgn * 0.106, -0.15, 1.300), (sgn * 0.120, -0.14, 1.291)],
            largura=0.0064, altura=0.0040, mat='luz_azul', subdiv=2
        )

    # ---- 7.4 BRACELETES EM V NOS ANTEBRAÇOS + PUNHOS VERMELHOS
    for side, sgn in (('l', 1.0), ('r', -1.0)):
        la0, la1 = BONES_W[f'lowerarm_{side}']
        eixo = (la1 - la0).normalized()
        up_ref = Vector((0.0, 1.0, 0.0))
        u1 = eixo.cross(up_ref).normalized()
        u2 = u1.cross(eixo).normalized()

        c_brac = la0.lerp(la1, 0.44)
        anel_brac = []
        anel_brac_red = []
        for k in range(28):
            ang = 2.0 * math.pi * k / 28
            v_dip = 0.028 * (max(0.0, math.cos(ang))) ** 1.8
            p = c_brac + eixo * v_dip + (u1 * math.cos(ang) + u2 * math.sin(ang)) * 0.065
            anel_brac.append(p)
            anel_brac_red.append(p + eixo * 0.011)
        A.add_friso(anel_brac, largura=0.019, altura=0.0052, mat='prata', fechado=True, subdiv=2)
        A.add_friso(anel_brac_red, largura=0.0056, altura=0.0056, mat='vermelho', fechado=True, subdiv=2)

        c_punho = la0.lerp(la1, 0.87)
        anel_punho = [
            c_punho + (u1 * math.cos(2.0 * math.pi * k / 24) + u2 * math.sin(2.0 * math.pi * k / 24)) * 0.055
            for k in range(24)
        ]
        A.add_friso(anel_punho, largura=0.0090, altura=0.0040, mat='vermelho', fechado=True, subdiv=2)

    # ---- 7.5 JOELHEIRAS ESCULPIDAS + CANELEIRAS PRATA/VERMELHO EM V + DETALHES DE BOTA
    for side, sgn in (('l', 1.0), ('r', -1.0)):
        kn = BONES_W[f'calf_{side}'][0]
        ank = BONES_W[f'foot_{side}'][0]

        def uv_joelho(u, v, cx=kn.x, cy=kn.y, cz=kn.z):
            uu = (u - 0.5) * 2.0
            vv = (v - 0.5) * 2.0
            afunila = 1.0 - 0.28 * abs(vv)
            return (cx + uu * 0.042 * afunila, cy - 0.095, cz + vv * 0.050)

        A.add_placa_grade(uv_joelho, nu=12, nv=12, espessura=0.0068, mat='azul_placa')
        aro_j = []
        for k in range(24):
            a = 2.0 * math.pi * k / 24
            aro_j.append((kn.x + math.sin(a) * 0.045, kn.y - 0.085 + 0.018 * (1 - abs(math.cos(a))), kn.z + math.cos(a) * 0.054))
        A.add_friso(aro_j, largura=0.0066, altura=0.0052, mat='prata', fechado=True, subdiv=2)

        cz_shin = kn.z - 0.096
        cx_shin = kn.x + sgn * 0.008
        anel_shin = []
        anel_shin_red = []
        for k in range(32):
            th = 2.0 * math.pi * k / 32
            px = cx_shin + math.sin(th) * 0.075
            py = kn.y - math.cos(th) * 0.085
            dip_frente = -0.040 * (max(0.0, math.cos(th))) ** 1.9
            arco_tras = 0.022 * (max(0.0, -math.cos(th))) ** 1.6
            pz = cz_shin + dip_frente + arco_tras
            anel_shin.append((px, py, pz))
            anel_shin_red.append((px, py, pz + 0.011))
        A.add_friso(anel_shin, largura=0.020, altura=0.0054, mat='prata', fechado=True, subdiv=2)
        A.add_friso(anel_shin_red, largura=0.0056, altura=0.0058, mat='vermelho', fechado=True, subdiv=2)

        # Friso prata discreto no calcanhar traseiro da bota
        arco_calc = [
            (ank.x - 0.032, ank.y + 0.025, 0.048),
            (ank.x,         ank.y + 0.062, 0.058),
            (ank.x + 0.032, ank.y + 0.025, 0.048),
        ]
        A.add_friso(arco_calc, largura=0.012, altura=0.0044, mat='prata', subdiv=3)

    # ---- 7.6 REDE COMPLETA DE FRISOS VERMELHOS 3D DO TRAJE (Gola em Y + Peitoral + 6-Pack + Membros)
    anel_gola = []
    for k in range(32):
        th = 2.0 * math.pi * k / 32
        frente_dip = 0.016 * (max(0.0, math.cos(th))) ** 2.0
        anel_gola.append((math.sin(th) * 0.070, -0.018 - math.cos(th) * 0.066, 1.540 - frente_dip))
    A.add_friso(anel_gola, largura=0.0048, altura=0.0028, mat='vermelho', fechado=True, subdiv=2)

    for sgn in (1.0, -1.0):
        A.add_friso(
            [(sgn * 0.066, -0.10, 1.512), (sgn * 0.034, -0.14, 1.472), (0.0, -0.17, 1.442)],
            largura=0.0048, altura=0.0028, mat='vermelho', subdiv=3
        )
    A.add_friso(
        [(0.0, -0.17, 1.444), (0.0, -0.17, 1.380), (0.0, -0.17, 1.318)],
        largura=0.0048, altura=0.0028, mat='vermelho', subdiv=3
    )

    for sgn in (1.0, -1.0):
        A.add_friso([
            (0.0,         -0.17, 1.318),
            (sgn * 0.055, -0.18, 1.310),
            (sgn * 0.118, -0.15, 1.322),
            (sgn * 0.154, -0.11, 1.375),
            (sgn * 0.158, -0.08, 1.445),
            (sgn * 0.115, -0.07, 1.490),
        ], largura=0.0048, altura=0.0028, mat='vermelho', subdiv=3)

        A.add_friso([
            (sgn * 0.070, -0.17, 1.314),
            (sgn * 0.072, -0.17, 1.215),
            (sgn * 0.066, -0.17, 1.115),
            (sgn * 0.056, -0.17, 1.022),
        ], largura=0.0046, altura=0.0026, mat='vermelho', subdiv=3)

        A.add_friso([
            (sgn * 0.145, -0.09, 1.335),
            (sgn * 0.148, -0.04, 1.210),
            (sgn * 0.152, -0.02, 1.058),
        ], largura=0.0042, altura=0.0024, mat='vermelho', subdiv=3)

        side = 'l' if sgn > 0 else 'r'
        ua0, ua1 = BONES_W[f'upperarm_{side}']
        la0, la1 = BONES_W[f'lowerarm_{side}']
        A.add_friso([
            ua0 + Vector((-sgn * 0.02, -0.07, 0.04)),
            ua0 + Vector((sgn * 0.05, -0.08, -0.02)),
            ua0.lerp(ua1, 0.55) + Vector((sgn * 0.05, -0.06, 0.0)),
            ua1 + Vector((sgn * 0.04, -0.05, 0.0)),
            la0.lerp(la1, 0.42) + Vector((sgn * 0.04, -0.04, 0.0)),
            la0.lerp(la1, 0.86) + Vector((sgn * 0.03, -0.03, 0.0)),
        ], largura=0.0044, altura=0.0025, mat='vermelho', subdiv=3)

        kn = BONES_W[f'calf_{side}'][0]
        ank = BONES_W[f'foot_{side}'][0]
        ball = BONES_W[f'ball_{side}'][0]
        toe = BONES_W[f'ball_{side}'][1]

        A.add_friso([
            (sgn * 0.086, -0.15, 1.015),
            (sgn * 0.112, -0.14, 0.840),
            (sgn * 0.132, -0.12, 0.680),
            (kn.x - sgn * 0.022, kn.y - 0.08, kn.z + 0.048),
        ], largura=0.0046, altura=0.0025, mat='vermelho', subdiv=3)

        A.add_friso([
            (sgn * 0.165, -0.03, 1.045),
            (sgn * 0.200, -0.03, 0.840),
            (sgn * 0.200, -0.03, 0.670),
            (kn.x + sgn * 0.042, kn.y - 0.04, kn.z + 0.035),
        ], largura=0.0046, altura=0.0025, mat='vermelho', subdiv=3)

        A.add_friso([
            (kn.x + sgn * 0.008, kn.y - 0.09, kn.z - 0.125),
            (ank.x,              ank.y - 0.08, 0.220),
            (ank.x,              ank.y - 0.09, 0.110),
            (ball.x,             ball.y - 0.02, 0.065),
            (toe.x,              toe.y + 0.02,  0.035),
        ], largura=0.0046, altura=0.0026, mat='vermelho', subdiv=3)

        A.add_friso([
            (sgn * 0.044, 0.11, 1.275),
            (sgn * 0.046, 0.11, 1.150),
            (sgn * 0.050, 0.12, 1.032),
        ], largura=0.0044, altura=0.0024, mat='vermelho', subdiv=3)

        A.add_friso([
            (sgn * 0.112, 0.13, 1.020),
            (sgn * 0.138, 0.13, 0.860),
            (sgn * 0.150, 0.09, 0.680),
            (kn.x + sgn * 0.015, kn.y + 0.07, kn.z - 0.075),
        ], largura=0.0044, altura=0.0024, mat='vermelho', subdiv=3)

        A.add_friso([
            (sgn * 0.056, -0.01, 1.545),
            (sgn * 0.054, -0.02, 1.615),
        ], largura=0.0040, altura=0.0022, mat='vermelho', subdiv=2)

    return A.finalizar('ArmaduraEFrisos')


# ==============================================================================
# 8. CAPACETE AERODINÂMICO DE SUPER-HERÓI (DOMO ESFÉRICO + ESCUDO T FUMÊ + ÓPTICAS AZUIS + ASAS PRATA)
# ==============================================================================
def construir_capacete():
    """Constrói o capacete aerodinâmico de super-herói fiel à referência: crânio arredondado,
    escudo T obsidiana fumê amplo, ópticas safira-azul anguladas, moldura prata e asas laterais."""
    cx, cy = 0.0, -0.044

    def ponto_casco(v, th):
        ct, st = math.cos(th), math.sin(th)
        z_bot = 1.546 + 0.054 * ((1.0 - ct) * 0.5) ** 1.25
        z_eq = 1.684   # equador na altura das têmporas/olhos
        z_top = 1.825  # topo redondo do crânio

        # Abaixo de v=0.46: mandíbula -> têmpora (tangente vertical em v=0.46)
        # Acima de v=0.46: elipsoide anatômico PURO (cos(phi), sin(phi)) -> coroa 100% redonda sem topo reto!
        if v < 0.46:
            u_low = v / 0.46
            domo = 0.58 + 0.42 * math.sin(u_low * math.pi * 0.5)
            pz_base = z_bot + (z_eq - z_bot) * u_low
        else:
            phi = (v - 0.46) / 0.54 * (math.pi * 0.5)
            domo = max(0.0, math.cos(phi))
            pz_base = z_eq + (z_top - z_eq) * math.sin(phi)

        frente_pos = max(0.0, ct)
        afunila_queixo_x = 1.0 - 0.38 * ((1.0 - min(1.0, v / 0.44)) ** 1.30) * (0.30 + 0.70 * frente_pos)
        proj_queixo_y = 0.022 * math.sin(min(1.0, v / 0.50) * math.pi) * (frente_pos ** 1.5)

        rx = 0.100 * domo * afunila_queixo_x
        ry_frente = 0.120 * domo + proj_queixo_y
        ry_tras = 0.118 * domo

        crista = 0.0035 * math.exp(-((th / 0.22) ** 2)) * math.sin(max(0.0, (v - 0.46) / 0.52) * math.pi) if abs(th) < 0.55 and v > 0.46 else 0.0
        brow = 0.0062 * math.exp(-((v - 0.50) / 0.048) ** 2) * max(0.0, math.cos(th * 1.15))

        ry = ry_frente if ct >= 0 else ry_tras
        px = cx + st * rx
        py = cy - ct * (ry + brow)
        pz = pz_base + crista
        return Vector((px, py, pz))

    NV, NT = 56, 96
    bm = bmesh.new()
    mats_cap = ['azul_placa', 'luz_azul', 'viseira_escura', 'prata', 'vermelho']

    grade = [[bm.verts.new(ponto_casco(iv / (NV - 1), -math.pi + 2.0 * math.pi * it / NT)) for it in range(NT)] for iv in range(NV)]
    v_polo = bm.verts.new(Vector((cx, cy, 1.825)))
    v_centro_base = bm.verts.new(Vector((cx, cy + 0.015, 1.570)))

    for iv in range(NV - 1):
        for it in range(NT):
            it2 = (it + 1) % NT
            f = bm.faces.new((grade[iv][it], grade[iv][it2], grade[iv + 1][it2], grade[iv + 1][it]))
            f.material_index = 0
            f.smooth = True

    for it in range(NT):
        it2 = (it + 1) % NT
        f1 = bm.faces.new((grade[NV - 1][it], grade[NV - 1][it2], v_polo))
        f1.material_index = 0; f1.smooth = True
        f2 = bm.faces.new((grade[0][it2], grade[0][it], v_centro_base))
        f2.material_index = 2; f2.smooth = True

    # ---- ASAS AERODINÂMICAS PRATA + CÁPSULAS AURICULARES VERMELHAS RENTES
    for sgn in (1.0, -1.0):
        pod_c = Vector((cx + sgn * 0.092, cy - 0.002, 1.674))
        m_pod = (
            Matrix.Translation(pod_c)
            @ Matrix.Rotation(sgn * -0.10, 4, 'Z')
            @ Matrix.Rotation(0.36, 4, 'X')
            @ Matrix.Diagonal((0.0068, 0.025, 0.027, 1.0))
        )
        ret_pod = bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=14, radius=1.0, matrix=m_pod)
        for v in ret_pod['verts']:
            for f in v.link_faces:
                f.material_index = 4
                f.smooth = True

        estacoes = [
            (Vector((cx + sgn * 0.093, cy - 0.014, 1.670)), 0.0036, 0.016),
            (Vector((cx + sgn * 0.100, cy + 0.012, 1.694)), 0.0032, 0.014),
            (Vector((cx + sgn * 0.107, cy + 0.040, 1.718)), 0.0024, 0.010),
            (Vector((cx + sgn * 0.112, cy + 0.064, 1.740)), 0.0014, 0.0050),
            (Vector((cx + sgn * 0.116, cy + 0.080, 1.754)), 0.0004, 0.0009),
        ]
        eixo_asa = (estacoes[-1][0] - estacoes[0][0]).normalized()
        lat_x = Vector((sgn, 0.0, 0.0))
        perp_asa = lat_x.cross(eixo_asa).normalized()

        aneis_asa = []
        for c_st, tx, tw in estacoes:
            aneis_asa.append([
                bm.verts.new(c_st + perp_asa * tw),
                bm.verts.new(c_st + lat_x * tx),
                bm.verts.new(c_st - perp_asa * tw),
                bm.verts.new(c_st - lat_x * (tx * 0.7)),
            ])

        for k in range(len(aneis_asa) - 1):
            a0, a1 = aneis_asa[k], aneis_asa[k + 1]
            for j in range(4):
                jn = (j + 1) % 4
                f = bm.faces.new((a0[j], a0[jn], a1[jn], a1[j]))
                f.material_index = 3
                f.smooth = False
        bm.faces.new(tuple(reversed(aneis_asa[0]))).material_index = 3
        bm.faces.new(tuple(aneis_asa[-1])).material_index = 3

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me_cap = bpy.data.meshes.new('CapaceteCasco')
    bm.to_mesh(me_cap)
    bm.free()
    me_cap.update()

    for chave in mats_cap:
        me_cap.materials.append(MATS[chave])
    aplicar_uv_triplanar(me_cap, escala=14.0)

    ob_cap = bpy.data.objects.new('Capacete', me_cap)
    scene.collection.objects.link(ob_cap)
    parentar_no_rig(ob_cap)
    ob_cap.vertex_groups['head'].add(list(range(len(me_cap.vertices))), 1.0, 'REPLACE')

    # ---- ESCUDO EM T OBSIDIANA FUMÊ + DUAS ÓPTICAS AZUL-SAFIRA + MOLDURA PRATA ESCULPIDA!
    surf_cap = SuperficieCorpo(ob_cap)
    C = ConstrutorArmadura(surf_cap)

    # 1) Escudo facial escuro fumê amplo em T (cobre toda a barra dos olhos + canal amplo até o queixo!)
    def uv_canal_escuro(u, v):
        larg = 0.022 + 0.015 * (v ** 1.2)
        return ((u - 0.5) * 2.0 * larg, -0.22, 1.560 + v * 0.132)

    def uv_barra_olhos_escura(u, v):
        s = (u - 0.5) * 2.0
        ab = abs(s)
        z_inf = 1.654 + 0.036 * (ab ** 1.35)
        z_sup = 1.698 + 0.030 * (ab ** 1.05) - 0.010 * math.exp(-((s / 0.28) ** 2))
        ang = s * 0.88
        return (math.sin(ang) * 0.115, cy - math.cos(ang) * 0.16, z_inf + v * (z_sup - z_inf))

    C.add_placa_grade(uv_canal_escuro, nu=14, nv=18, espessura=0.0018, mat='viseira_escura')
    C.add_placa_grade(uv_barra_olhos_escura, nu=30, nv=12, espessura=0.0018, mat='viseira_escura')

    # 2) Molduras prata escovado robustas nas bochechas/mandíbula contornando o canal em T (igual à referência!)
    pts_moldura_u = [
        (-0.068, -0.14, 1.678),
        (-0.040, -0.19, 1.654),
        (-0.032, -0.20, 1.608),
        (-0.022, -0.20, 1.562),
        ( 0.000, -0.20, 1.556),
        ( 0.022, -0.20, 1.562),
        ( 0.032, -0.20, 1.608),
        ( 0.040, -0.19, 1.654),
        ( 0.068, -0.14, 1.678),
    ]
    C.add_friso(pts_moldura_u, largura=0.0095, altura=0.0034, mat='prata', subdiv=4)

    # 3) Duas Lentes Ópticas Azul-Safira Luminosas (separadas pela ponte nasal escura, varridas p/ as têmporas!)
    for sgn in (1.0, -1.0):
        def uv_olho_azul(u, v, sg=sgn):
            # u in [0..1] do centro nasal (0.10) até a têmpora (0.94)
            ab = 0.09 + u * 0.85
            afunila = math.sin(u * math.pi) ** 0.45
            z_c = 1.674 + 0.028 * (ab ** 1.18)
            h_meia = (0.0075 + 0.0105 * (u ** 0.65)) * afunila
            z_p = z_c + (v - 0.5) * 2.0 * h_meia
            ang = sg * ab * 0.85
            return (math.sin(ang) * 0.115, cy - math.cos(ang) * 0.16, z_p)

        C.add_placa_grade(uv_olho_azul, nu=18, nv=10, espessura=0.0028, mat='luz_azul')

    # Pestana/sobrancelha esculpida azul-armadura sobre o topo do escudo em T
    pts_brow = []
    for k in range(29):
        s = (k / 28 - 0.5) * 2.0
        ab = abs(s)
        z_b = 1.700 + 0.030 * (ab ** 1.05) - 0.010 * math.exp(-((s / 0.28) ** 2))
        ang = s * 0.90
        pts_brow.append((math.sin(ang) * 0.115, cy - math.cos(ang) * 0.16, z_b))
    C.add_friso(pts_brow, largura=0.0072, altura=0.0040, mat='azul_placa', subdiv=2)

    # 4) Dois frisos vermelhos em V sobre a testa e coroa do capacete + placa occipital traseira prata/vermelha!
    for sgn in (1.0, -1.0):
        C.add_friso([
            (sgn * 0.024, -0.18, 1.704),
            (sgn * 0.040, -0.13, 1.762),
            (sgn * 0.048, -0.04, 1.812),
            (sgn * 0.044,  0.06, 1.786),
            (sgn * 0.038,  0.11, 1.726),
        ], largura=0.0052, altura=0.0024, mat='vermelho', subdiv=3)

    # Placa occipital traseira prata escovado ampla + arcos vermelhos (igual à vista traseira!)
    C.add_placa_grade(
        lambda u, v: ((u - 0.5) * 0.115, 0.12, 1.652 + v * 0.056),
        nu=16, nv=10, espessura=0.0038, mat='prata'
    )
    C.add_friso([(-0.064, 0.10, 1.712), (0.0, 0.12, 1.722), (0.064, 0.10, 1.712)], largura=0.0060, altura=0.0042, mat='vermelho', subdiv=3)
    C.add_friso([(-0.058, 0.10, 1.648), (0.0, 0.12, 1.638), (0.058, 0.10, 1.648)], largura=0.0060, altura=0.0042, mat='vermelho', subdiv=3)

    ob_viseira = C.finalizar('CapaceteDetalhes')
    bpy.ops.object.select_all(action='DESELECT')
    ob_cap.select_set(True)
    ob_viseira.select_set(True)
    bpy.context.view_layer.objects.active = ob_cap
    bpy.ops.object.join()
    ob_cap.vertex_groups['head'].add(list(range(len(ob_cap.data.vertices))), 1.0, 'REPLACE')
    return ob_cap


# ==============================================================================
# 9. EXECUÇÃO DA MONTAGEM COMPLETA + EXPORTAÇÃO GLB EM POSE BASE LIMPA
# ==============================================================================
print('Montando Luvas táticas de 5 dedos...')
ob_luvas = construir_luvas()

print('Esculpindo TrajeCorpo muscular contínuo...')
ob_traje = construir_traje_corpo()

for o in (src_corpo, src_roupa, src_sapatos):
    bpy.data.objects.remove(o, do_unlink=True)

print('Moldando placas prata, cinto V, joelheiras, braceletes e frisos vermelhos 3D...')
surf = SuperficieCorpo(ob_traje)
ob_armadura = construir_armadura_e_frisos(surf)

print('Construindo Capacete aerodinâmico com viseira T luminosa e asas prata...')
ob_capacete = construir_capacete()

bpy.context.view_layer.update()

# Exporta .glb em rest-pose limpa para compatibilidade total com retarget universal.js!
print('Exportando GLB:', OUT_GLB)
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format='GLB',
    export_yup=True,
    export_skins=True,
    export_morph=False,
    export_lights=False,
    export_cameras=False,
)


# ==============================================================================
# 10. POSE HERÓICA DE ESTÚDIO + RENDERIZAÇÃO CYCLES (TURNAROUND 3 VISTAS + BUSTO)
# ==============================================================================
def aplicar_pose_heroica(arm_obj):
    """Coloca braços, mãos articuladas e postura na pose heróica imponente da referência."""
    bpy.context.view_layer.objects.active = arm_obj
    for side, sgn in (('l', 1.0), ('r', -1.0)):
        pb_ua = arm_obj.pose.bones[f'upperarm_{side}']
        b_ua = arm_obj.data.bones[f'upperarm_{side}']
        r_add = (
            Matrix.Translation(b_ua.head_local)
            @ Matrix.Rotation(math.radians(32.5 * sgn), 4, 'Y')
            @ Matrix.Rotation(math.radians(-4.0), 4, 'X')
            @ Matrix.Translation(-b_ua.head_local)
        )
        pb_ua.matrix = r_add @ pb_ua.matrix
        bpy.context.view_layer.update()

        pb_la = arm_obj.pose.bones[f'lowerarm_{side}']
        r_elb = (
            Matrix.Translation(pb_la.head)
            @ Matrix.Rotation(math.radians(-6.0 * sgn), 4, 'Y')
            @ Matrix.Rotation(math.radians(-14.0), 4, 'X')
            @ Matrix.Translation(-pb_la.head)
        )
        pb_la.matrix = r_elb @ pb_la.matrix
        bpy.context.view_layer.update()

        # Curva naturalmente todos os dedos na postura semi-fechada de super-herói!
        for fname in ('index', 'middle', 'ring', 'pinky'):
            for seg, ang_f in (('01', 16.0), ('02', 22.0), ('03', 16.0)):
                bn = f'{fname}_{seg}_{side}'
                if bn in arm_obj.pose.bones:
                    pbf = arm_obj.pose.bones[bn]
                    pbf.rotation_mode = 'XYZ'
                    pbf.rotation_euler.x = math.radians(ang_f)
        for seg, ang_t in (('02', 14.0), ('03', 18.0)):
            bn = f'thumb_{seg}_{side}'
            if bn in arm_obj.pose.bones:
                pbt = arm_obj.pose.bones[bn]
                pbt.rotation_mode = 'XYZ'
                pbt.rotation_euler.z = math.radians(-ang_t * sgn)
        bpy.context.view_layer.update()


arm.rotation_mode = 'XYZ'
aplicar_pose_heroica(arm)

print('Configurando estúdio Cycles sem ruído para Turnaround de 3 vistas + Close do Busto...')
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 24
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.022
scene.cycles.sample_clamp_direct = 5.0
scene.cycles.sample_clamp_indirect = 2.0
scene.cycles.filter_width = 1.35
scene.cycles.use_denoising = False
scene.view_settings.view_transform = 'AgX' if 'AgX' in [x.identifier for x in scene.view_settings.bl_rna.properties['view_transform'].enum_items] else 'Filmic'
scene.view_settings.look = 'Medium High Contrast'

world = bpy.data.worlds.new('Estudio')
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (*srgb_lin((0.145, 0.158, 0.180)), 1.0)
bg.inputs['Strength'].default_value = 0.92

bpy.ops.mesh.primitive_plane_add(size=28.0, location=(0.0, 0.0, 0.0))
piso = bpy.context.active_object
piso.name = 'PisoEstudio'
m_piso = bpy.data.materials.new('MatPisoEstudio')
m_piso.use_nodes = True
bp = m_piso.node_tree.nodes['Principled BSDF']
bp.inputs['Base Color'].default_value = (*srgb_lin((0.125, 0.136, 0.155)), 1.0)
bp.inputs['Roughness'].default_value = 0.56
bp.inputs['Metallic'].default_value = 0.10
piso.data.materials.append(m_piso)

# Salva o .blend do personagem já na pose heróica de vitrine!
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
print('Arquivo .blend salvo em:', OUT_BLEND)


def add_luz_area(nome, loc, rot_deg, energia, tam_x, tam_y, cor=(1.0, 1.0, 1.0)):
    ld = bpy.data.lights.new(nome, type='AREA')
    ld.energy = energia
    ld.shape = 'RECTANGLE'
    ld.size = tam_x
    ld.size_y = tam_y
    ld.color = cor
    lo = bpy.data.objects.new(nome, ld)
    scene.collection.objects.link(lo)
    lo.location = loc
    lo.rotation_euler = tuple(math.radians(a) for a in rot_deg)
    return lo


# Softboxes grandes e próximas -> sombreamento dramático esculpindo peitoral/6-pack e ZERO ruído!
add_luz_area('KeyTopLeft', (-1.2, -3.4, 3.2), (52, 0, -16),  480.0, 5.2, 3.2, (1.00, 0.98, 0.96))
add_luz_area('FillFront',  (1.9,  -3.8, 1.7), (76, 0, 24),   165.0, 4.6, 2.8, (0.86, 0.93, 1.00))
add_luz_area('RimLeft',    (-3.0,  1.5, 2.4), (64, 0, -125), 390.0, 2.4, 3.2, (0.78, 0.89, 1.00))
add_luz_area('RimRight',   (3.0,   1.5, 2.4), (64, 0, 125),  390.0, 2.4, 3.2, (0.78, 0.89, 1.00))

# --- RENDER 1: Close-up do Busto/Capacete/6-Pack (3/4 frente-esquerda: -20°)
arm.rotation_euler = (0.0, 0.0, math.radians(-20.0))
cam_data = bpy.data.cameras.new('CamEstudio')
cam_data.lens = 74.0
cam = bpy.data.objects.new('CamEstudio', cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

cam.location = (0.0, -2.38, 1.42)
cam.rotation_euler = (math.radians(89.5), 0.0, 0.0)
scene.render.resolution_x = 1040
scene.render.resolution_y = 832
scene.render.filepath = OUT_BUSTO
bpy.ops.render.render(write_still=True)
print('Close do busto salvo em:', OUT_BUSTO)

# --- RENDER 2: Turnaround 16:9 CORPO INTEIRO com as 3 vistas lado a lado (igual à imagem enviada pelo usuário!)
# Esquerda: 3/4 frente-direita (+28°) | Centro: 3/4 frente-esquerda (-20°) | Direita: 3/4 costas (+148°)
def clonar_pose(dx, rot_z_deg):
    arm_c = arm.copy()
    arm_c.rotation_mode = 'XYZ'
    arm_c.location = Vector((dx, arm.location.y, arm.location.z))
    arm_c.rotation_euler = (0.0, 0.0, math.radians(rot_z_deg))
    scene.collection.objects.link(arm_c)
    for ch in [ob_luvas, ob_traje, ob_armadura, ob_capacete]:
        c = ch.copy()
        c.parent = arm_c
        c.matrix_parent_inverse = ch.matrix_parent_inverse.copy()
        for m in c.modifiers:
            if m.type == 'ARMATURE':
                m.object = arm_c
        scene.collection.objects.link(c)
    return arm_c


arm.location.x = 0.0
arm.rotation_euler = (0.0, 0.0, math.radians(-20.0))
clonar_pose(-0.96, 28.0)
clonar_pose(0.96, 148.0)

cam_data.lens = 52.0
cam.location = (0.0, -5.50, 0.93)
cam.rotation_euler = (math.radians(90.0), 0.0, 0.0)
scene.render.resolution_x = 1536
scene.render.resolution_y = 864
scene.render.filepath = OUT_TURN
bpy.ops.render.render(write_still=True)
print('Turnaround 3 vistas salvo em:', OUT_TURN)
