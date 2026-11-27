#!/usr/bin/env python3
"""
Gera 4 raças completas de cães 3D riggados no Blender 4.0 para a Biblioteca 3D e para o modo
"Vida de Cachorro" do Hryz City:
  1. caramelo.glb  — Vira-Lata Caramelo brasileiro (orelha meia-caída, rabo alegre, coleira turquesa)
  2. pastor.glb    — Pastor Alemão atlético (orelhas eretas, manto preto + patas douradas, coleira vermelha)
  3. dalmata.glb   — Dálmata esguio (branco com pintas pretas 3D orgânicas, orelhas caídas, coleira rubi)
  4. pug.glb       — Pug compacto fofo (focinho curto escuro, orelhinhas dobradas, rabinho caracol, coleira verde)

Referencial (compatível 100% direto com jogo/jogo.js sem rotação extra!):
  - Blender: frente em -Y, traseira em +Y, Z para cima, +X esquerda, patas apoiadas em Z = 0.
  - glTF (export_yup=True): frente em +Z, traseira em -Z, Y para cima, +X esquerda, patas em Y = 0.

Esqueleto unificado (22 ossos articulados):
  Quadril -> Coluna -> Peito -> Pescoco -> Cabeca -> (Mandibula, OrelhaE, OrelhaD)
  Quadril -> Rabo1 -> Rabo2 -> Rabo3
  Peito   -> PataFE1 -> PataFE2 -> PataFE3 | PataFD1 -> PataFD2 -> PataFD3
  Quadril -> PataTE1 -> PataTE2 -> PataTE3 | PataTD1 -> PataTD2 -> PataTD3
"""
import math
import os
import sys
import numpy as np
import bpy
import bmesh
from mathutils import Vector, Matrix

DIR = os.path.dirname(os.path.abspath(__file__))
ARGV = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(nome, padrao=None):
    return ARGV[ARGV.index('--' + nome) + 1] if ('--' + nome) in ARGV else padrao

OUT_LINEUP = arg('lineup', os.path.join(DIR, 'caes_matilha_previa.png'))
MINI_DIR = arg('miniaturas', None)


def srgb_lin(c):
    return tuple(((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c)


def catmull(P, n_por_seg=6):
    P = [np.array(p, dtype=float) for p in P]
    out = []
    for i in range(len(P) - 1):
        p0, p1, p2, p3 = P[max(i - 1, 0)], P[i], P[i + 1], P[min(i + 2, len(P) - 1)]
        for k in range(n_por_seg):
            t = k / n_por_seg
            out.append(0.5 * (
                (2 * p1)
                + (-p0 + p2) * t
                + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t
            ))
    out.append(P[-1])
    return np.array(out)


def loft(nome, estacoes, N=28, expo=2.1, ref=(0, 0, 1), fechar=True, n_por_seg=5):
    """estacoes: [cx, cy, cz, meia_largura, alto, baixo]"""
    E = catmull(estacoes, n_por_seg)
    C = E[:, :3]
    bm = bmesh.new()
    aneis = []
    ref_v = np.array(ref, dtype=float)
    for i, e in enumerate(E):
        t = C[min(i + 1, len(C) - 1)] - C[max(i - 1, 0)]
        t /= np.linalg.norm(t) + 1e-9
        lado = np.cross(t, ref_v)
        if np.linalg.norm(lado) < 1e-5:
            lado = np.cross(t, np.array([1.0, 0.0, 0.0]))
        lado /= np.linalg.norm(lado) + 1e-9
        cima = np.cross(lado, t)
        w, hT, hB = e[3], e[4], e[5]
        anel = []
        for j in range(N):
            th = 2.0 * math.pi * j / N
            c, s = math.cos(th), math.sin(th)
            x_loc = w * math.copysign(abs(c) ** (2.0 / expo), c)
            z_loc = (hT if s > 0 else hB) * math.copysign(abs(s) ** (2.0 / expo), s)
            anel.append(bm.verts.new(tuple(C[i] + lado * x_loc + cima * z_loc)))
        aneis.append(anel)

    for a, b in zip(aneis, aneis[1:]):
        for j in range(N):
            bm.faces.new((a[j], a[(j + 1) % N], b[(j + 1) % N], b[j]))
    if fechar:
        for anel, centro, inv in ((aneis[0], C[0], True), (aneis[-1], C[-1], False)):
            v0 = bm.verts.new(tuple(centro))
            for j in range(N):
                bm.faces.new((v0, anel[(j + 1) % N], anel[j]) if inv else (v0, anel[j], anel[(j + 1) % N]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(nome, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def esfera(nome, c, r, esc=(1, 1, 1), rot=(0, 0, 0), seg=18, ring=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=ring, radius=r, location=c, rotation=rot)
    o = bpy.context.active_object
    o.name = nome
    o.scale = esc
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return o


def _hash(ix, iy, iz, sem):
    h = (ix * 73856093) ^ (iy * 19349663) ^ (iz * 83492791) ^ (sem * 2654435761)
    h = (h ^ (h >> 13)) * 1274126177
    return ((h ^ (h >> 16)) & 0xFFFF) / 65535.0


def ruido3(P, freq, sem=0):
    Q = P * freq
    i = np.floor(Q).astype(np.int64)
    f = Q - i
    u = f * f * (3.0 - 2.0 * f)
    r = np.zeros(len(P), dtype=np.float64)
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (u[:, 0] if dx else 1.0 - u[:, 0]) * (u[:, 1] if dy else 1.0 - u[:, 1]) * (u[:, 2] if dz else 1.0 - u[:, 2])
                r += w * _hash(i[:, 0] + dx, i[:, 1] + dy, i[:, 2] + dz, sem)
    return r * 2.0 - 1.0


def suave(a, b, x):
    x = np.clip((x - a) / (b - a), 0.0, 1.0)
    return x * x * (3.0 - 2.0 * x)


# ==============================================================================
# DEFINIÇÃO ANATÔMICA DAS 4 RAÇAS
# ==============================================================================
RACAS = {
    'caramelo': {
        'nome': 'Vira-Lata Caramelo',
        'escala': (1.0, 1.0, 1.0),
        'focinho_len': 0.115,
        'focinho_r': 0.040,
        'orelha_tipo': 'semi',     # base erguida + ponta dobrada charmosa!
        'rabo_curva': 0.55,        # rabo curvado alegre p/ cima
        'cor_coleira': (0.08, 0.62, 0.78),
        'cor_base': (0.76, 0.45, 0.17),
        'cor_dorso': (0.58, 0.31, 0.10),
        'cor_barriga': (0.93, 0.78, 0.56),
        'cor_focinho': (0.28, 0.18, 0.11),
        'padrao': 'caramelo',
    },
    'pastor': {
        'nome': 'Pastor Alemão',
        'escala': (1.06, 1.15, 1.16),
        'focinho_len': 0.135,
        'focinho_r': 0.041,
        'orelha_tipo': 'ereta',    # orelhas triangulares altas em pé!
        'rabo_curva': -0.22,       # rabo longo em sabre
        'cor_coleira': (0.76, 0.11, 0.12),
        'cor_base': (0.72, 0.48, 0.22),
        'cor_dorso': (0.09, 0.08, 0.08),
        'cor_barriga': (0.82, 0.62, 0.34),
        'cor_focinho': (0.10, 0.09, 0.09),
        'padrao': 'pastor',
    },
    'dalmata': {
        'nome': 'Dálmata',
        'escala': (0.95, 1.12, 1.10),
        'focinho_len': 0.125,
        'focinho_r': 0.039,
        'orelha_tipo': 'caida',    # orelhas longas caídas
        'rabo_curva': 0.18,
        'cor_coleira': (0.82, 0.12, 0.22),
        'cor_base': (0.94, 0.94, 0.92),
        'cor_dorso': (0.07, 0.07, 0.08),
        'cor_barriga': (0.96, 0.96, 0.95),
        'cor_focinho': (0.92, 0.92, 0.90),
        'padrao': 'dalmata',
    },
    'pug': {
        'nome': 'Pug',
        'escala': (0.94, 0.74, 0.70),
        'focinho_len': 0.048,      # focinho curtinho achatado!
        'focinho_r': 0.050,
        'orelha_tipo': 'dobrada',  # orelhinhas pequenas dobradas pretas
        'rabo_curva': 1.25,        # rabinho enrolado em caracol!
        'cor_coleira': (0.20, 0.74, 0.28),
        'cor_base': (0.85, 0.73, 0.56),
        'cor_dorso': (0.72, 0.59, 0.43),
        'cor_barriga': (0.91, 0.83, 0.70),
        'cor_focinho': (0.09, 0.08, 0.08),
        'padrao': 'pug',
    },
}


def criar_material_simples(nome, cor_srgb, rough=0.55, metal=0.0, coat=0.0):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*srgb_lin(cor_srgb), 1.0)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if coat > 0 and 'Coat Weight' in b.inputs:
        b.inputs['Coat Weight'].default_value = coat
        b.inputs['Coat Roughness'].default_value = 0.08
    return m


def criar_material_pelagem(nome):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value = 0.78
    b.inputs['Specular IOR Level'].default_value = 0.35
    vc = nt.nodes.new('ShaderNodeVertexColor')
    vc.layer_name = 'Pelagem'
    nt.links.new(vc.outputs['Color'], b.inputs['Base Color'])
    return m


def pintar_pelagem(ob, cfg):
    """Pinta cada vértice da pelagem com padrões orgânicos realistas da raça (sRGB -> Linear Vertex Color)."""
    me = ob.data
    n = len(me.vertices)
    P = np.empty(n * 3, dtype=np.float64)
    me.vertices.foreach_get('co', P)
    P = P.reshape(-1, 3)

    sx, sy, sz = cfg['escala']
    # Coordenadas normalizadas na escala base do cão (y < 0 = frente, y > 0 = trás, z = altura)
    xn = P[:, 0] / sx
    yn = P[:, 1] / sy
    zn = P[:, 2] / sz

    base = np.array(cfg['cor_base'], dtype=np.float64)
    dorso = np.array(cfg['cor_dorso'], dtype=np.float64)
    barriga = np.array(cfg['cor_barriga'], dtype=np.float64)
    foc = np.array(cfg['cor_focinho'], dtype=np.float64)

    micro = ruido3(P, 26.0, sem=11) * 0.045 + ruido3(P, 9.0, sem=27) * 0.035
    col = np.tile(base, (n, 1))

    pad = cfg['padrao']
    if pad == 'caramelo':
        # Dorso e topo da cabeça caramelo queimado; barriga, peito e patas creme; ponta do focinho escura
        k_dorso = suave(0.42, 0.56, zn) * suave(-0.42, 0.25, yn)
        k_barriga = (1.0 - suave(0.28, 0.44, zn)) * suave(0.18, -0.30, yn) * (1.0 - suave(0.06, 0.13, np.abs(xn)))
        k_patas = (1.0 - suave(0.06, 0.16, zn)) * 0.55
        k_foc = suave(-0.46, -0.57, yn) * suave(0.40, 0.52, zn)
        k_orelha = suave(0.57, 0.68, zn) * suave(0.05, 0.11, np.abs(xn)) * 0.55
        col = col * (1.0 - k_dorso[:, None]) + dorso * k_dorso[:, None]
        col = col * (1.0 - k_barriga[:, None]) + barriga * k_barriga[:, None]
        col = col * (1.0 - k_patas[:, None]) + barriga * k_patas[:, None]
        col = col * (1.0 - k_foc[:, None]) + foc * k_foc[:, None]
        col = col * (1.0 - k_orelha[:, None]) + dorso * k_orelha[:, None]

    elif pad == 'pastor':
        # Manto preto cobrindo costas, parte superior das laterais, dorso do rabo e máscara facial escura!
        manto = suave(0.37, 0.49, zn) * suave(-0.22, -0.02, yn) * suave(0.45, 0.22, yn)
        rabo_topo = suave(0.32, 0.50, yn) * suave(0.34, 0.44, zn) * 0.85
        cabeca_topo = suave(-0.44, -0.32, yn) * suave(0.56, 0.66, zn) * 0.78
        mascara = suave(-0.46, -0.57, yn) * suave(0.40, 0.58, zn)
        peito = suave(-0.26, -0.38, yn) * (1.0 - suave(0.34, 0.46, zn)) * 0.7
        k_esc = np.clip(manto + rabo_topo + cabeca_topo + mascara, 0.0, 1.0)
        col = col * (1.0 - k_esc[:, None]) + dorso * k_esc[:, None]
        col = col * (1.0 - peito[:, None]) + barriga * peito[:, None]

    elif pad == 'dalmata':
        # Pintas pretas arredondadas orgânicas (esferas 3D determinísticas espalhadas pelo corpo!)
        rng = np.random.RandomState(42)
        centros = np.column_stack([
            rng.uniform(-0.14, 0.14, 85) * sx,
            rng.uniform(-0.56, 0.52, 85) * sy,
            rng.uniform(0.02, 0.68, 85) * sz,
        ])
        raios = rng.uniform(0.020, 0.044, 85) * min(sx, sz)
        k_p = np.zeros(n, dtype=np.float64)
        for c_pt, rr in zip(centros, raios):
            d = np.linalg.norm(P - c_pt, axis=1)
            k_p = np.maximum(k_p, suave(rr * 1.15, rr * 0.72, d))
        orelha_p = suave(0.46, 0.62, zn) * suave(0.06, 0.11, np.abs(xn)) * suave(-0.46, -0.30, yn) * 0.55
        k_p = np.clip(k_p + orelha_p, 0.0, 1.0)
        col = col * (1.0 - k_p[:, None]) + dorso * k_p[:, None]

    elif pad == 'pug':
        k_masc = suave(-0.34, -0.45, yn) * suave(0.38, 0.58, zn)
        k_orelha = suave(0.50, 0.66, zn) * suave(0.055, 0.105, np.abs(xn)) * suave(-0.43, -0.26, yn)
        k_dorso = suave(0.43, 0.53, zn) * suave(-0.20, 0.25, yn) * 0.45
        k_esc = np.clip(k_masc + k_orelha, 0.0, 1.0)
        col = col * (1.0 - k_dorso[:, None]) + dorso * k_dorso[:, None]
        col = col * (1.0 - k_esc[:, None]) + foc * k_esc[:, None]

    # Região anal/perineal discreta e natural logo abaixo da raiz da cauda (+Y, sob o rabo!)
    r_anus = np.hypot(xn / 0.020, (zn - 0.398) / 0.018)
    k_anus = suave(1.25, 0.45, r_anus) * suave(0.28, 0.35, yn)
    cor_perineo = np.array([0.38, 0.24, 0.22])
    col = col * (1.0 - k_anus[:, None] * 0.68) + cor_perineo * (k_anus[:, None] * 0.68)

    col = np.clip(col + micro[:, None], 0.02, 0.98)

    # Converte sRGB -> Linear p/ Blender Color Attribute
    lin = np.where(col <= 0.04045, col / 12.92, ((col + 0.055) / 1.055) ** 2.4)

    attr = me.color_attributes.new(name='Pelagem', type='BYTE_COLOR', domain='CORNER')
    n_loops = len(me.loops)
    v_idx = np.empty(n_loops, dtype=np.int32)
    me.loops.foreach_get('vertex_index', v_idx)
    rgba = np.ones((n_loops, 4), dtype=np.float32)
    rgba[:, :3] = lin[v_idx]
    attr.data.foreach_set('color', rgba.ravel())


def construir_cao(chave_raca, exportar_glb=True, manter_na_cena=False):
    cfg = RACAS[chave_raca]
    sx, sy, sz = cfg['escala']

    def S(x, y, z):
        return (x * sx, y * sy, z * sz)

    def SR(w, hT, hB):
        return (w * sx, hT * sz, hB * sz)

    pecas_corpo = []

    # 1) TRONCO + PESCOÇO + CRÂNIO REDONDO COM "STOP" NA TESTA + FOCINHO ESCULPIDO
    fl = cfg['focinho_len']
    fr = cfg['focinho_r']
    est_tronco = [
        (*S(0.0,  0.345, 0.430), *SR(0.036, 0.030, 0.032)),  # ponta traseira da garupa
        (*S(0.0,  0.275, 0.448), *SR(0.102, 0.078, 0.088)),  # quadris/glúteos cheios
        (*S(0.0,  0.145, 0.440), *SR(0.098, 0.075, 0.074)),  # lombar atlética
        (*S(0.0, -0.015, 0.435), *SR(0.108, 0.088, 0.116)),  # costelas
        (*S(0.0, -0.180, 0.436), *SR(0.118, 0.096, 0.136)),  # tórax profundo
        (*S(0.0, -0.275, 0.478), *SR(0.082, 0.074, 0.086)),  # base do pescoço
        (*S(0.0, -0.338, 0.542), *SR(0.066, 0.062, 0.064)),  # pescoço
        (*S(0.0, -0.388, 0.585), *SR(0.078, 0.082, 0.066)),  # crânio arredondado (testa alta!)
        (*S(0.0, -0.445, 0.578), *SR(0.072, 0.074, 0.056)),  # bochechas + arco supraorbital
        (*S(0.0, -0.475, 0.538), *SR(fr * 1.15, fr * 0.92, fr * 0.72)),  # "stop" nasal (degrau entre testa e focinho!)
        (*S(0.0, -0.485 - fl * 0.50, 0.530), *SR(fr * 1.02, fr * 0.78, fr * 0.62)),
        (*S(0.0, -0.490 - fl,        0.526), *SR(fr * 0.78, fr * 0.58, fr * 0.48)),  # ponta do focinho
    ]
    pecas_corpo.append(loft('Tronco', est_tronco, N=26, expo=2.1, ref=(0, 0, 1), n_por_seg=4))
    # Bochechas/lábios superiores suaves p/ rosto simpático de cachorro!
    for sgn in (1.0, -1.0):
        pecas_corpo.append(esfera(f'Bochecha_{sgn}', S(sgn * 0.036, -0.468 - fl * 0.30, 0.520), 0.032 * min(sx, sz), esc=(1.0, 1.35, 0.95)))

    # 2) RABO CHEIO E LONGO EM 3 SEGMENTOS (nasce dentro da garupa +Y p/ emenda invisível!)
    rc = cfg['rabo_curva']
    if rc > 0.9:
        est_rabo = [
            (*S(0.0, 0.28, 0.468), *SR(0.030, 0.030, 0.030)),
            (*S(0.0, 0.37, 0.535), *SR(0.025, 0.025, 0.025)),
            (*S(0.0, 0.36, 0.620), *SR(0.021, 0.021, 0.021)),
            (*S(0.0, 0.28, 0.618), *SR(0.017, 0.017, 0.017)),
            (*S(0.0, 0.27, 0.560), *SR(0.011, 0.011, 0.011)),
        ]
    else:
        est_rabo = [
            (*S(0.0, 0.280, 0.468), *SR(0.032, 0.032, 0.032)),
            (*S(0.0, 0.395, 0.478 + rc * 0.06), *SR(0.028, 0.028, 0.028)),
            (*S(0.0, 0.515, 0.500 + rc * 0.16), *SR(0.024, 0.024, 0.024)),
            (*S(0.0, 0.615 - max(0, rc) * 0.06, 0.545 + rc * 0.27), *SR(0.012, 0.012, 0.012)),
        ]
    pecas_corpo.append(loft('Rabo', est_rabo, N=14, expo=2.0, ref=(0, 0, 1), n_por_seg=4))

    # 3) ORELHAS (embutidas dentro do crânio na base!)
    ot = cfg['orelha_tipo']
    for sgn, suf in ((1.0, 'E'), (-1.0, 'D')):
        if ot == 'ereta':
            est_o = [
                (*S(sgn * 0.045, -0.392, 0.625), *SR(0.032, 0.020, 0.020)),
                (*S(sgn * 0.064, -0.402, 0.708), *SR(0.025, 0.013, 0.013)),
                (*S(sgn * 0.068, -0.410, 0.780), *SR(0.008, 0.007, 0.007)),
            ]
        elif ot == 'semi':
            est_o = [
                (*S(sgn * 0.048, -0.395, 0.628), *SR(0.030, 0.018, 0.018)),
                (*S(sgn * 0.086, -0.405, 0.680), *SR(0.028, 0.014, 0.014)),
                (*S(sgn * 0.118, -0.428, 0.642), *SR(0.022, 0.011, 0.011)),
                (*S(sgn * 0.124, -0.445, 0.592), *SR(0.011, 0.007, 0.007)),
            ]
        elif ot == 'caida':
            est_o = [
                (*S(sgn * 0.056, -0.395, 0.622), *SR(0.028, 0.018, 0.018)),
                (*S(sgn * 0.092, -0.408, 0.568), *SR(0.030, 0.014, 0.014)),
                (*S(sgn * 0.095, -0.422, 0.495), *SR(0.026, 0.011, 0.011)),
                (*S(sgn * 0.090, -0.428, 0.448), *SR(0.015, 0.008, 0.008)),
            ]
        else:  # dobrada (Pug)
            est_o = [
                (*S(sgn * 0.052, -0.388, 0.628), *SR(0.026, 0.017, 0.017)),
                (*S(sgn * 0.090, -0.416, 0.596), *SR(0.025, 0.013, 0.013)),
                (*S(sgn * 0.084, -0.442, 0.542), *SR(0.015, 0.009, 0.009)),
            ]
        pecas_corpo.append(loft(f'Orelha{suf}', est_o, N=12, expo=2.0, ref=(0, -1, 0), n_por_seg=3))

    # 4) QUATRO PATAS COM TRANSIÇÃO ANATÔMICA SUAVE (ombro/coxa embutidos no tronco + patinhas arredondadas!)
    for sgn, suf in ((1.0, 'E'), (-1.0, 'D')):
        # Pata Dianteira: nasce dentro do peito (x=0.045, z=0.445) p/ ZERO degrau!
        est_f = [
            (*S(sgn * 0.045, -0.175, 0.455), *SR(0.042, 0.052, 0.052)),
            (*S(sgn * 0.082, -0.180, 0.375), *SR(0.042, 0.046, 0.046)),
            (*S(sgn * 0.086, -0.168, 0.245), *SR(0.031, 0.034, 0.034)),
            (*S(sgn * 0.084, -0.182, 0.105), *SR(0.024, 0.025, 0.025)),
            (*S(sgn * 0.084, -0.194, 0.032), *SR(0.027, 0.026, 0.020)),
        ]
        pecas_corpo.append(loft(f'PataF{suf}', est_f, N=14, expo=2.0, ref=(1, 0, 0), n_por_seg=3))
        pecas_corpo.append(esfera(f'PeF{suf}', S(sgn * 0.084, -0.215, 0.025), 0.030 * min(sx, sz), esc=(1.05, 1.38, 0.72)))

        # Pata Traseira: nasce dentro da bacia (x=0.048, z=0.455) p/ coxa redonda natural!
        est_t = [
            (*S(sgn * 0.048,  0.235, 0.460), *SR(0.048, 0.062, 0.062)),
            (*S(sgn * 0.084,  0.232, 0.382), *SR(0.050, 0.058, 0.058)),
            (*S(sgn * 0.086,  0.206, 0.258), *SR(0.037, 0.042, 0.042)),
            (*S(sgn * 0.084,  0.272, 0.140), *SR(0.025, 0.027, 0.027)),
            (*S(sgn * 0.084,  0.244, 0.032), *SR(0.027, 0.026, 0.020)),
        ]
        pecas_corpo.append(loft(f'PataT{suf}', est_t, N=14, expo=2.0, ref=(1, 0, 0), n_por_seg=3))
        pecas_corpo.append(esfera(f'PeT{suf}', S(sgn * 0.084,  0.218, 0.025), 0.030 * min(sx, sz), esc=(1.05, 1.38, 0.72)))

    # Une tudo por Voxel Remesh contínuo + Corrective Smooth + Decimate limpo (~7.000 faces p/ pintas nítidas e 60 FPS!)
    bpy.ops.object.select_all(action='DESELECT')
    for o in pecas_corpo:
        o.select_set(True)
    bpy.context.view_layer.objects.active = pecas_corpo[0]
    bpy.ops.object.join()
    corpo = bpy.context.active_object
    corpo.name = f'Corpo_{chave_raca}'

    rm = corpo.modifiers.new('RM', 'REMESH')
    rm.mode = 'VOXEL'
    rm.voxel_size = 0.0080 * min(sx, sz)
    rm.use_smooth_shade = True
    bpy.ops.object.modifier_apply(modifier='RM')

    sm = corpo.modifiers.new('SM', 'CORRECTIVE_SMOOTH')
    sm.iterations = 8
    sm.use_only_smooth = True
    bpy.ops.object.modifier_apply(modifier='SM')

    alvo_faces = 7400 if cfg['padrao'] == 'dalmata' else 5800
    if len(corpo.data.polygons) > alvo_faces + 200:
        dec = corpo.modifiers.new('Dec', 'DECIMATE')
        dec.ratio = float(alvo_faces) / len(corpo.data.polygons)
        bpy.ops.object.modifier_apply(modifier='Dec')

    # Limpa possíveis faces degeneradas antes de exportar glTF
    bm_clean = bmesh.new()
    bm_clean.from_mesh(corpo.data)
    bmesh.ops.dissolve_degenerate(bm_clean, dist=0.0002, edges=bm_clean.edges)
    bmesh.ops.recalc_face_normals(bm_clean, faces=bm_clean.faces)
    bm_clean.to_mesh(corpo.data)
    bm_clean.free()

    min_z = min(v.co.z for v in corpo.data.vertices)
    for v in corpo.data.vertices:
        v.co.z -= min_z
    corpo.data.update()
    for p in corpo.data.polygons:
        p.use_smooth = True

    pintar_pelagem(corpo, cfg)
    mat_pelo = criar_material_pelagem(f'MatPelo_{chave_raca}')
    corpo.data.materials.clear()
    corpo.data.materials.append(mat_pelo)

    # 5) PEÇAS DE DETALHE (Focinho preto brilhante, Olhos grandes expressivos c/ brilho branco, Mandíbula + Língua, Coleira justa)
    mat_preto_umido = criar_material_simples(f'MatFocinho_{chave_raca}', (0.030, 0.028, 0.028), rough=0.14, coat=0.88)
    mat_olho = criar_material_simples(f'MatOlho_{chave_raca}', (0.040, 0.022, 0.012), rough=0.04, coat=1.0)
    mat_brilho = criar_material_simples(f'MatBrilho_{chave_raca}', (0.98, 0.99, 1.00), rough=0.05)
    mat_lingua = criar_material_simples(f'MatLingua_{chave_raca}', (0.92, 0.36, 0.44), rough=0.28, coat=0.35)
    mat_coleira = criar_material_simples(f'MatColeira_{chave_raca}', cfg['cor_coleira'], rough=0.38, metal=0.12)
    mat_ouro = criar_material_simples(f'MatMedalha_{chave_raca}', (0.96, 0.78, 0.22), rough=0.20, metal=0.90)

    def z_adj(z):
        return z * sz - min_z

    # Trufa / Nariz úmido
    y_nariz = (-0.494 - fl) * sy
    ob_nariz = esfera(f'Nariz_{chave_raca}', (0.0, y_nariz, z_adj(0.534)), 0.021 * min(sx, sz), esc=(1.28, 0.85, 0.90))
    ob_nariz.data.materials.append(mat_preto_umido)

    # Olhos expressivos bem posicionados na superfície da testa/bochecha + pontinho de brilho vivo!
    olhos = []
    for sgn, suf in ((1.0, 'E'), (-1.0, 'D')):
        r_olho = (0.021 if chave_raca == 'pug' else 0.018) * min(sx, sz)
        pos_o = (sgn * 0.050 * sx, -0.474 * sy, z_adj(0.586))
        oe = esfera(f'Olho{suf}_{chave_raca}', pos_o, r_olho)
        oe.data.materials.append(mat_olho)
        olhos.append(oe)
        br = esfera(
            f'Brilho{suf}_{chave_raca}',
            (pos_o[0] + sgn * r_olho * 0.32, pos_o[1] - r_olho * 0.78, pos_o[2] + r_olho * 0.36),
            r_olho * 0.30,
            seg=10, ring=8,
        )
        br.data.materials.append(mat_brilho)
        olhos.append(br)

    # Mandíbula inferior encaixada sob o focinho + Língua rosa fofa
    est_mand = [
        (0.0, -0.452 * sy, z_adj(0.498), 0.032 * sx, 0.013 * sz, 0.015 * sz),
        (0.0, (-0.478 - fl * 0.72) * sy, z_adj(0.494), fr * 0.64 * sx, 0.011 * sz, 0.012 * sz),
    ]
    ob_mand = loft(f'Mandibula_{chave_raca}', est_mand, N=14, expo=2.0, n_por_seg=3)
    ob_mand.data.materials.append(criar_material_simples(f'MatMand_{chave_raca}', cfg['cor_focinho'], rough=0.72))
    for p in ob_mand.data.polygons:
        p.use_smooth = True

    ob_lingua = esfera(
        f'Lingua_{chave_raca}',
        (0.0, (-0.476 - fl * 0.56) * sy, z_adj(0.497)),
        0.017 * min(sx, sz),
        esc=(0.95, 1.70, 0.34),
        rot=(math.radians(20), 0, 0),
    )
    ob_lingua.data.materials.append(mat_lingua)

    # Coleira justa abraçando o pescoço + Medalhinha dourada!
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.072 * sx,
        minor_radius=0.0125 * min(sx, sz),
        major_segments=28,
        minor_segments=10,
        location=(0.0, -0.318 * sy, z_adj(0.512)),
        rotation=(math.radians(40), 0, 0),
    )
    ob_col = bpy.context.active_object
    ob_col.name = f'Coleira_{chave_raca}'
    ob_col.data.materials.append(mat_coleira)
    for p in ob_col.data.polygons:
        p.use_smooth = True

    ob_med = esfera(f'Medalha_{chave_raca}', (0.0, -0.376 * sy, z_adj(0.452)), 0.015 * min(sx, sz), esc=(1.0, 0.30, 1.0))
    ob_med.data.materials.append(mat_ouro)

    # 6) ESQUELETO CANINO UNIFICADO (22 OSSOS) + PESOS AUTOMÁTICOS LIMPOS
    arm_data = bpy.data.armatures.new(f'Rig_{chave_raca}')
    arm = bpy.data.objects.new(f'Cao_{chave_raca}', arm_data)
    bpy.context.scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')

    def P(x, y, z):
        return Vector((x * sx, y * sy, max(0.0, z * sz - min_z)))

    def osso(nome, head, tail, pai=None, conectado=False):
        b = arm_data.edit_bones.new(nome)
        b.head = head
        b.tail = tail
        if pai:
            b.parent = arm_data.edit_bones[pai]
            b.use_connect = conectado
        return b

    osso('Quadril',   P(0.0,  0.22, 0.44), P(0.0,  0.08, 0.44))
    osso('Coluna',    P(0.0,  0.08, 0.44), P(0.0, -0.08, 0.44), 'Quadril', True)
    osso('Peito',     P(0.0, -0.08, 0.44), P(0.0, -0.25, 0.46), 'Coluna', True)
    osso('Pescoco',   P(0.0, -0.25, 0.46), P(0.0, -0.37, 0.56), 'Peito', True)
    osso('Cabeca',    P(0.0, -0.37, 0.56), P(0.0, -0.50 - fl * 0.7, 0.54), 'Pescoco', True)
    osso('Mandibula', P(0.0, -0.44, 0.51), P(0.0, -0.50 - fl * 0.8, 0.49), 'Cabeca')

    for sgn, suf in ((1.0, 'E'), (-1.0, 'D')):
        osso(f'Orelha{suf}', P(sgn * 0.052, -0.395, 0.625), P(sgn * 0.095, -0.415, 0.680 if ot == 'ereta' else 0.540), 'Cabeca')

    osso('Rabo1', P(0.0, 0.30, 0.47), P(0.0, 0.41, 0.48 + max(0, rc) * 0.05), 'Quadril')
    osso('Rabo2', P(0.0, 0.41, 0.48 + max(0, rc) * 0.05), P(0.0, 0.51, 0.50 + max(0, rc) * 0.12), 'Rabo1', True)
    osso('Rabo3', P(0.0, 0.51, 0.50 + max(0, rc) * 0.12), P(0.0, 0.60, 0.54 + max(0, rc) * 0.18), 'Rabo2', True)

    for sgn, suf in ((1.0, 'E'), (-1.0, 'D')):
        osso(f'PataF{suf}1', P(sgn * 0.082, -0.180, 0.400), P(sgn * 0.086, -0.168, 0.245), 'Peito')
        osso(f'PataF{suf}2', P(sgn * 0.086, -0.168, 0.245), P(sgn * 0.084, -0.185, 0.042), f'PataF{suf}1', True)
        osso(f'PataF{suf}3', P(sgn * 0.084, -0.185, 0.042), P(sgn * 0.084, -0.235, 0.022), f'PataF{suf}2', True)

        osso(f'PataT{suf}1', P(sgn * 0.084,  0.232, 0.405), P(sgn * 0.086,  0.208, 0.258), 'Quadril')
        osso(f'PataT{suf}2', P(sgn * 0.086,  0.208, 0.258), P(sgn * 0.084,  0.252, 0.042), f'PataT{suf}1', True)
        osso(f'PataT{suf}3', P(sgn * 0.084,  0.252, 0.042), P(sgn * 0.084,  0.200, 0.022), f'PataT{suf}2', True)

    bpy.ops.object.mode_set(mode='OBJECT')

    bpy.ops.object.select_all(action='DESELECT')
    corpo.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')

    def prender_osso(ob, nome_osso):
        ob.parent = arm
        ob.matrix_parent_inverse = arm.matrix_world.inverted()
        vg = ob.vertex_groups.new(name=nome_osso)
        vg.add(list(range(len(ob.data.vertices))), 1.0, 'REPLACE')
        m = ob.modifiers.new('Armature', 'ARMATURE')
        m.object = arm

    prender_osso(ob_nariz, 'Cabeca')
    for oe in olhos:
        prender_osso(oe, 'Cabeca')
    prender_osso(ob_mand, 'Mandibula')
    prender_osso(ob_lingua, 'Mandibula')
    prender_osso(ob_col, 'Pescoco')
    prender_osso(ob_med, 'Pescoco')

    pecas_cao = [arm, corpo, ob_nariz, *olhos, ob_mand, ob_lingua, ob_col, ob_med]

    if exportar_glb:
        out_glb = os.path.join(DIR, f'{chave_raca}.glb')
        bpy.ops.object.select_all(action='DESELECT')
        for o in pecas_cao:
            o.select_set(True)
        bpy.ops.export_scene.gltf(
            filepath=out_glb,
            use_selection=True,
            export_format='GLB',
            export_yup=True,
            export_skins=True,
            export_morph=False,
            export_lights=False,
            export_cameras=False,
        )
        print(f'Exportado {chave_raca}.glb ({os.path.getsize(out_glb) // 1024} KB)')

    if not manter_na_cena:
        for o in pecas_cao:
            bpy.data.objects.remove(o, do_unlink=True)
        return None
    return arm


def renderizar_previas():
    """Monta cena limpa com os 4 cães lado a lado + miniaturas individuais para a Sala do Hryz City!"""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 24
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.025
    scene.cycles.use_denoising = False
    scene.view_settings.view_transform = 'AgX' if 'AgX' in [x.identifier for x in scene.view_settings.bl_rna.properties['view_transform'].enum_items] else 'Filmic'
    scene.view_settings.look = 'Medium High Contrast'

    world = bpy.data.worlds.new('EstudioCaes')
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (*srgb_lin((0.20, 0.25, 0.34)), 1.0)
    bg.inputs['Strength'].default_value = 0.95

    bpy.ops.mesh.primitive_plane_add(size=18.0, location=(0, 0, 0))
    piso = bpy.context.active_object
    piso.data.materials.append(criar_material_simples('MatPiso', (0.22, 0.26, 0.32), rough=0.62))

    def luz(nome, loc, rot, ene, sx, sy, cor=(1, 1, 1)):
        ld = bpy.data.lights.new(nome, type='AREA')
        ld.energy = ene; ld.shape = 'RECTANGLE'; ld.size = sx; ld.size_y = sy; ld.color = cor
        lo = bpy.data.objects.new(nome, ld)
        scene.collection.objects.link(lo)
        lo.location = loc
        lo.rotation_euler = tuple(math.radians(a) for a in rot)

    luz('Key', (-1.5, -3.2, 2.6), (52, 0, -25), 290, 3.6, 2.4, (1.0, 0.97, 0.92))
    luz('Fill', (1.8, -2.8, 1.5), (72, 0, 30), 145, 3.2, 2.0, (0.86, 0.94, 1.0))
    luz('Rim', (0.0, 2.5, 2.1), (62, 0, 180), 220, 4.4, 1.6, (0.90, 0.95, 1.0))

    cam_d = bpy.data.cameras.new('Cam')
    cam = bpy.data.objects.new('Cam', cam_d)
    scene.collection.objects.link(cam)
    scene.camera = cam

    arms = {}
    ordem = ['caramelo', 'pastor', 'dalmata', 'pug']
    for raca in ordem:
        arms[raca] = construir_cao(raca, exportar_glb=True, manter_na_cena=True)

    # Miniaturas individuais 320x240 para a Sala do Hryz City
    if MINI_DIR:
        os.makedirs(MINI_DIR, exist_ok=True)
        cam_d.lens = 54.0
        scene.render.resolution_x = 320
        scene.render.resolution_y = 240
        scene.cycles.samples = 16
        for raca in ordem:
            for k, a in arms.items():
                vis = (k == raca)
                a.hide_render = not vis
                for ch in a.children:
                    ch.hide_render = not vis
            a = arms[raca]
            a.location = (0.0, 0.0, 0.0)
            a.rotation_euler = (0.0, 0.0, math.radians(-38))
            sz = RACAS[raca]['escala'][2]
            cam.location = (0.0, -1.72 * (0.72 + 0.28 * sz), 0.50 * sz + 0.14)
            cam.rotation_euler = (math.radians(82), 0, 0)
            png_tmp = os.path.join(MINI_DIR, f'pers-{raca}.png')
            scene.render.filepath = png_tmp
            bpy.ops.render.render(write_still=True)

    # Lineup completo dos 4 cães lado a lado em estúdio (todos 100% no quadro!)
    xs = [-1.18, -0.36, 0.44, 1.12]
    rots = [-34, -26, 26, 36]
    for raca, x, rot in zip(ordem, xs, rots):
        a = arms[raca]
        a.hide_render = False
        for ch in a.children:
            ch.hide_render = False
        a.location = (x, 0.0, 0.0)
        a.rotation_euler = (0.0, 0.0, math.radians(rot))

    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(DIR, 'caes_matilha.blend'))

    cam_d.lens = 48.0
    cam.location = (0.0, -4.65, 0.76)
    cam.rotation_euler = (math.radians(84), 0, 0)
    scene.render.resolution_x = 1360
    scene.render.resolution_y = 680
    scene.cycles.samples = 24
    scene.render.filepath = OUT_LINEUP
    bpy.ops.render.render(write_still=True)
    print('Lineup dos 4 cães salvo em:', OUT_LINEUP)


if __name__ == '__main__':
    renderizar_previas()
