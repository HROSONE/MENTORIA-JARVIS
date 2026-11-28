"""
Gera o modelo 3D game-ready da Nave Espacial HRYZ-Marte em Blender 4.0.2,
baseado fielmente na referência (1795824891805.jpg):
- Casco blindado facetado branco-cerâmico, cinza grafite e faixas laranja industriais
- Cabine de vidro facetada com montantes blindados + interior com painel holográfico (TelaPainel)
- Asas curtas enflechadas com pods laterais de entrada de ar, canhões laser/plasma e antenas
- Dois grandes propulsores traseiros cilíndricos canelados + dutos de cobre + grades de ventilação
- Trem de pouso retrátil (TremPouso) para estacionamento na Lua
Exporta videos/biblioteca3d/veiculos/nave_marte/nave_marte.glb e renderiza prévia 4-vistas.
"""
import math
import os
import bpy
import bmesh
from mathutils import Vector, Matrix, Euler

ROOT = "/home/antigravity/HROSONE/MENTORIA-JARVIS"
OUT_DIR = os.path.join(ROOT, "videos/biblioteca3d/veiculos/nave_marte")
OUT_GLB = os.path.join(OUT_DIR, "nave_marte.glb")
OUT_PREV = "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/3f0a27bc-cfc6-4516-9690-dfa0fef93d50/nave_marte_previa.png"
os.makedirs(OUT_DIR, exist_ok=True)


def limpar_cena():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def criar_mat(nome, cor, rough=0.5, metal=0.2, emissivo=None, em_forca=0.0, alpha=1.0):
    mat = bpy.data.materials.new(nome)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*cor, 1.0)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if emissivo:
        bsdf.inputs["Emission Color"].default_value = (*emissivo, 1.0)
        bsdf.inputs["Emission Strength"].default_value = em_forca
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.blend_method = "BLEND"
    return mat


def criar_mat_texturizado(nome, cor_base, cor_sujeira, rough=0.48, metal=0.25, escala=9.0):
    """PBR com leve variação de desgaste/sujeira procedural para visual industrial realista."""
    mat = bpy.data.materials.new(nome)
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Metallic"].default_value = metal

    tex_coord = nodes.new("ShaderNodeTexCoord")
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = escala
    noise.inputs["Detail"].default_value = 6.0
    noise.inputs["Roughness"].default_value = 0.65

    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.32
    ramp.color_ramp.elements[0].color = (*cor_base, 1.0)
    ramp.color_ramp.elements[1].position = 0.72
    ramp.color_ramp.elements[1].color = (*cor_sujeira, 1.0)

    rough_map = nodes.new("ShaderNodeMapRange")
    rough_map.inputs["From Min"].default_value = 0.2
    rough_map.inputs["From Max"].default_value = 0.8
    rough_map.inputs["To Min"].default_value = max(0.08, rough - 0.12)
    rough_map.inputs["To Max"].default_value = min(0.95, rough + 0.18)

    links.new(tex_coord.outputs["Object"], noise.inputs["Vector"])
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(noise.outputs["Fac"], rough_map.inputs["Value"])
    links.new(rough_map.outputs["Result"], bsdf.inputs["Roughness"])
    return mat


def criar_obj_bm(nome, bm, mat, parent=None, smooth=False):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(nome)
    bm.to_mesh(mesh)
    bm.free()
    if smooth:
        for p in mesh.polygons:
            p.use_smooth = True
    obj = bpy.data.objects.new(nome, mesh)
    bpy.context.scene.collection.objects.link(obj)
    if mat:
        obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    return obj


def adicionar_caixa_chanfrada(bm, centro, dim, rot=(0, 0, 0), bevel=0.05):
    m = Matrix.Translation(Vector(centro)) @ Euler(rot, 'XYZ').to_matrix().to_4x4() @ Matrix.Diagonal((dim[0], dim[1], dim[2], 1.0))
    res = bmesh.ops.create_cube(bm, size=1.0, matrix=m)
    if bevel > 0:
        verts = res["verts"]
        edges = list({e for v in verts for e in v.link_edges})
        bmesh.ops.bevel(bm, geom=edges, offset=bevel, segments=1, affect='EDGES', clamp_overlap=True)
    return res["verts"]


def criar_secao_hull(bm, secoes):
    """Cria um casco lofted limpo a partir de uma lista de anéis de vértices 3D."""
    aneis = []
    for pts in secoes:
        aneis.append([bm.verts.new(Vector(p)) for p in pts])
    for i in range(len(aneis) - 1):
        a, b = aneis[i], aneis[i + 1]
        n = len(a)
        for k in range(n):
            k2 = (k + 1) % n
            try:
                bm.faces.new([a[k], a[k2], b[k2], b[k]])
            except ValueError:
                pass
    # Tampas frontal e traseira
    try:
        bm.faces.new(list(reversed(aneis[0])))
        bm.faces.new(aneis[-1])
    except ValueError:
        pass


def gerar_nave():
    limpar_cena()
    scene = bpy.context.scene

    # Materiais fiéis à imagem de referência (1795824891805.jpg)
    mat_branco = criar_mat_texturizado("Hull_Branco", (0.76, 0.78, 0.80), (0.52, 0.54, 0.57), rough=0.44, metal=0.18, escala=6.0)
    mat_grafite = criar_mat_texturizado("Hull_Grafite", (0.18, 0.20, 0.23), (0.11, 0.12, 0.14), rough=0.46, metal=0.48, escala=7.5)
    mat_escuro = criar_mat_texturizado("Hull_Escuro", (0.09, 0.10, 0.12), (0.05, 0.06, 0.07), rough=0.52, metal=0.55, escala=10.0)
    mat_laranja = criar_mat_texturizado("Hull_Laranja", (0.82, 0.42, 0.08), (0.58, 0.26, 0.04), rough=0.42, metal=0.22, escala=8.0)
    mat_cobre = criar_mat("Cobre_Dutos", (0.56, 0.29, 0.14), rough=0.35, metal=0.82)
    mat_metal_motor = criar_mat_texturizado("Motor_Titanio", (0.24, 0.25, 0.28), (0.12, 0.13, 0.15), rough=0.32, metal=0.85, escala=12.0)
    mat_vidro = criar_mat("Cabine_Vidro", (0.04, 0.07, 0.11), rough=0.06, metal=0.25, alpha=0.72)
    mat_chama = criar_mat("Motor_PlasmaCore", (0.22, 0.78, 1.0), rough=0.1, metal=0.0, emissivo=(0.28, 0.84, 1.0), em_forca=6.0)
    mat_canhao_luz = criar_mat("Canhao_Emissor", (0.95, 0.35, 0.15), rough=0.2, metal=0.1, emissivo=(1.0, 0.42, 0.18), em_forca=3.5)
    mat_painel = criar_mat("Painel_Tela", (0.06, 0.14, 0.24), rough=0.18, metal=0.1, emissivo=(0.15, 0.65, 1.0), em_forca=2.2)
    mat_led_verm = criar_mat("Led_Vermelho", (0.95, 0.12, 0.08), rough=0.2, metal=0.1, emissivo=(1.0, 0.15, 0.1), em_forca=4.0)
    mat_led_verd = criar_mat("Led_Verde", (0.12, 0.95, 0.32), rough=0.2, metal=0.1, emissivo=(0.15, 1.0, 0.35), em_forca=4.0)

    # Raiz da Nave (em Blender: frente = -Y, cima = +Z -> em Three.js glTF: frente = +Z, cima = +Y!)
    raiz = bpy.data.objects.new("NaveMarte", None)
    scene.collection.objects.link(raiz)

    # ------------------------------------------------------------------ 1. CASCO PRINCIPAL (Loft blindado facetado)
    # Nariz em y = -4.25, traseira em y = +3.35 (comprimento ~7.6m + motores = ~8.7m)
    def perfil(y, w_topo, w_meio, w_base, z_base, z_ombro, z_topo):
        return [
            (-w_base, y, z_base),
            ( w_base, y, z_base),
            ( w_meio, y, z_ombro),
            ( w_topo, y, z_topo),
            (-w_topo, y, z_topo),
            (-w_meio, y, z_ombro),
        ]

    bm_casco = bmesh.new()
    criar_secao_hull(bm_casco, [
        perfil(-4.20, 0.46, 0.68, 0.50, 0.68, 0.96, 1.18),   # ponta do nariz blindado
        perfil(-3.55, 0.72, 1.04, 0.86, 0.58, 1.08, 1.48),   # bico da cabine
        perfil(-2.15, 0.96, 1.44, 1.18, 0.52, 1.32, 2.04),   # metade da cabine
        perfil(-0.75, 1.18, 1.66, 1.36, 0.50, 1.56, 2.38),   # trás da cabine / início dorso
        perfil( 0.85, 1.24, 1.72, 1.42, 0.52, 1.62, 2.48),   # corpo central pesado
        perfil( 2.45, 1.14, 1.62, 1.32, 0.60, 1.58, 2.34),   # ombros dos motores
        perfil( 3.25, 0.92, 1.34, 1.08, 0.74, 1.44, 2.02),   # antepara traseira
    ])
    criar_obj_bm("CascoGrafite", bm_casco, mat_grafite, raiz)

    # Chapas blindadas BRANCAS (nariz, ombros superiores ao redor da cabine e carenagem lateral)
    bm_branco = bmesh.new()
    # Capô frontal branco do bico
    adicionar_caixa_chanfrada(bm_branco, (0.0, -3.96, 1.04), (1.16, 0.72, 0.48), rot=(0.24, 0, 0), bevel=0.06)
    # Laterais brancas inclinadas ao lado da cabine (esquerdo/direito)
    for s in (-1, 1):
        adicionar_caixa_chanfrada(bm_branco, (s * 1.16, -1.90, 1.62), (0.62, 2.45, 0.52), rot=(0.28, s * -0.42, s * -0.14), bevel=0.05)
        adicionar_caixa_chanfrada(bm_branco, (s * 1.46, -0.15, 1.76), (0.48, 1.55, 0.62), rot=(0.0, s * -0.18, 0), bevel=0.05)
        # Painel branco lateral do meio do casco
        adicionar_caixa_chanfrada(bm_branco, (s * 1.66, 0.15, 1.18), (0.18, 1.60, 0.76), rot=(0, 0, 0), bevel=0.03)
    # Carenagem superior branca atrás da cabine
    adicionar_caixa_chanfrada(bm_branco, (0.0, -0.58, 2.28), (1.98, 0.96, 0.34), rot=(0.12, 0, 0), bevel=0.05)
    criar_obj_bm("BlindagemBranca", bm_branco, mat_branco, raiz)

    # Faixas LARANJA INDUSTRIAIS (laterais do bico, entradas dos motores e ombros traseiros)
    bm_lar = bmesh.new()
    for s in (-1, 1):
        # Faixa diagonal na bochecha dianteira
        adicionar_caixa_chanfrada(bm_lar, (s * 1.24, -2.55, 1.12), (0.28, 0.56, 0.68), rot=(0.35, s * -0.22, s * -0.22), bevel=0.025)
        # Faixa superior nos ombros dos motores traseiros
        adicionar_caixa_chanfrada(bm_lar, (s * 1.42, 2.15, 1.98), (0.76, 1.28, 0.44), rot=(-0.10, s * -0.18, 0), bevel=0.04)
        # Faixa frontal nas naceles laterais das asas
        adicionar_caixa_chanfrada(bm_lar, (s * 2.12, 0.58, 1.38), (0.74, 0.42, 0.74), rot=(0, 0, 0), bevel=0.03)
        # Detalhe laranja na ponta da asa
        adicionar_caixa_chanfrada(bm_lar, (s * 3.85, 1.38, 1.08), (0.42, 0.88, 0.14), rot=(0, s * 0.08, s * 0.25), bevel=0.02)
        # Detalhe laranja na parte inferior da traseira
        adicionar_caixa_chanfrada(bm_lar, (s * 0.74, 3.22, 1.12), (0.22, 0.24, 0.58), bevel=0.02)
    criar_obj_bm("FaixasLaranja", bm_lar, mat_laranja, raiz)

    # ------------------------------------------------------------------ 2. CABINE BLINDADA + VIDRO + PAINEL INTERIOR
    # Vidro inclinado facetado da cabine
    bm_vid = bmesh.new()
    criar_secao_hull(bm_vid, [
        [(-0.56, -3.52, 1.34), ( 0.56, -3.52, 1.34), ( 0.44, -3.48, 1.56), (-0.44, -3.48, 1.56)],
        [(-0.88, -2.20, 1.66), ( 0.88, -2.20, 1.66), ( 0.68, -2.18, 2.14), (-0.68, -2.18, 2.14)],
        [(-0.96, -1.05, 1.84), ( 0.96, -1.05, 1.84), ( 0.74, -1.05, 2.32), (-0.74, -1.05, 2.32)],
    ])
    criar_obj_bm("CabineVidro", bm_vid, mat_vidro, raiz)

    # Montantes blindados (moldura da cabine igual à referência: barra central + travessa + laterais)
    bm_mold = bmesh.new()
    # Coluna central do para-brisa
    adicionar_caixa_chanfrada(bm_mold, (0.0, -2.35, 1.94), (0.12, 2.48, 0.14), rot=(0.31, 0, 0), bevel=0.015)
    # Travessa horizontal intermediária da cabine
    adicionar_caixa_chanfrada(bm_mold, (0.0, -2.25, 2.02), (1.56, 0.14, 0.14), bevel=0.015)
    # Colunas laterais da cabine
    for s in (-1, 1):
        adicionar_caixa_chanfrada(bm_mold, (s * 0.62, -2.28, 1.96), (0.13, 2.52, 0.16), rot=(0.31, s * -0.14, s * -0.14), bevel=0.015)
        adicionar_caixa_chanfrada(bm_mold, (s * 0.84, -2.25, 1.62), (0.12, 2.46, 0.14), rot=(0.24, s * -0.12, s * -0.18), bevel=0.015)
        # Travessa diagonal lateral
        adicionar_caixa_chanfrada(bm_mold, (s * 0.82, -2.18, 1.88), (0.10, 0.12, 0.54), rot=(0.25, s * 0.35, 0), bevel=0.01)
    # Teto blindado dorsal central (spina com degrau e escotilha)
    adicionar_caixa_chanfrada(bm_mold, (0.0, 0.95, 2.52), (1.76, 2.95, 0.36), bevel=0.06)
    adicionar_caixa_chanfrada(bm_mold, (0.0, 1.95, 2.66), (1.18, 1.25, 0.18), bevel=0.04)
    # Escotilha circular no teto
    bmesh.ops.create_cone(
        bm_mold, cap_ends=True, cap_tris=False, segments=16,
        radius1=0.44, radius2=0.38, depth=0.12,
        matrix=Matrix.Translation((0.0, 1.35, 2.74)),
    )
    # Escotilha/compartimento traseiro retangular entre os dois motores
    adicionar_caixa_chanfrada(bm_mold, (0.0, 3.28, 1.26), (1.18, 0.32, 0.98), bevel=0.04)
    # Quilha / barriga escura blindada
    adicionar_caixa_chanfrada(bm_mold, (0.0, -0.35, 0.54), (2.28, 5.80, 0.32), bevel=0.05)
    # Portas laterais com relevo
    for s in (-1, 1):
        adicionar_caixa_chanfrada(bm_mold, (s * 1.72, -0.32, 1.18), (0.10, 0.92, 0.82), bevel=0.02)
        # Vents/radiadores nos ombros traseiros
        for k in range(4):
            adicionar_caixa_chanfrada(bm_mold, (s * 1.18, 1.30 + k * 0.20, 2.38), (0.58, 0.10, 0.16), rot=(-0.2, s * -0.15, 0), bevel=0.01)
    criar_obj_bm("ArmaduraEscura", bm_mold, mat_escuro, raiz)

    # Interior da Cabine (assento + console + tela do painel para a cutscene!)
    bm_int = bmesh.new()
    adicionar_caixa_chanfrada(bm_int, (0.0, -1.65, 1.32), (0.72, 0.68, 0.62), bevel=0.03)  # banco piloto
    adicionar_caixa_chanfrada(bm_int, (0.0, -1.35, 1.72), (0.64, 0.16, 0.72), rot=(-0.18, 0, 0), bevel=0.03)  # encosto
    adicionar_caixa_chanfrada(bm_int, (0.0, -2.85, 1.32), (1.36, 0.75, 0.42), rot=(0.25, 0, 0), bevel=0.03)   # console painel
    criar_obj_bm("InteriorCabine", bm_int, mat_escuro, raiz)

    # Tela do Painel com UVs limpos (para textura holográfica animada no Three.js!)
    bm_tela = bmesh.new()
    uv_layer = bm_tela.loops.layers.uv.new("UVMap")
    v0 = bm_tela.verts.new((-0.56, -2.74, 1.48))
    v1 = bm_tela.verts.new(( 0.56, -2.74, 1.48))
    v2 = bm_tela.verts.new(( 0.56, -2.92, 1.78))
    v3 = bm_tela.verts.new((-0.56, -2.92, 1.78))
    f_tela = bm_tela.faces.new([v0, v1, v2, v3])
    for loop, uv in zip(f_tela.loops, [(0, 0), (1, 0), (1, 1), (0, 1)]):
        loop[uv_layer].uv = uv
    criar_obj_bm("TelaPainel", bm_tela, mat_painel, raiz)

    # ------------------------------------------------------------------ 3. ASAS ENFLECHADAS + PODS + CANHÕES
    bm_asas_g = bmesh.new()
    bm_asas_b = bmesh.new()
    bm_canhoes = bmesh.new()
    bm_emiss = bmesh.new()

    for s in (-1, 1):
        # Pod lateral (raiz da asa + entrada de ar / canhão interno)
        adicionar_caixa_chanfrada(bm_asas_g, (s * 2.12, 0.92, 1.24), (0.86, 2.05, 0.76), bevel=0.05)
        adicionar_caixa_chanfrada(bm_asas_b, (s * 2.14, 1.05, 1.62), (0.72, 1.55, 0.14), bevel=0.02)

        # Asa trapezoidal enflechada para trás (malha lofted com perfil aerodinâmico!)
        p_raiz = [
            (s * 2.42, 0.30, 1.18),
            (s * 2.42, 1.88, 1.14),
            (s * 2.42, 1.88, 1.38),
            (s * 2.42, 0.30, 1.44),
        ]
        p_ponta = [
            (s * 4.18, 1.08, 0.94),
            (s * 4.18, 1.98, 0.94),
            (s * 4.18, 1.98, 1.08),
            (s * 4.18, 1.08, 1.10),
        ]
        if s < 0:
            criar_secao_hull(bm_asas_g, [p_raiz, p_ponta])
        else:
            criar_secao_hull(bm_asas_g, [list(reversed(p_raiz)), list(reversed(p_ponta))])

        # Faixa branca superior na asa (idêntica à referência!)
        adicionar_caixa_chanfrada(bm_asas_b, (s * 3.24, 1.22, 1.25), (1.35, 0.78, 0.10), rot=(0.02, s * 0.14, s * 0.34), bevel=0.02)

        # Antena / sonda pitot na ponta da asa
        bmesh.ops.create_cone(
            bm_canhoes, cap_ends=True, cap_tris=False, segments=8,
            radius1=0.025, radius2=0.008, depth=0.68,
            matrix=Matrix.Translation((s * 4.18, 0.85, 1.02)) @ Euler((math.pi / 2, 0, s * -0.12), 'XYZ').to_matrix().to_4x4(),
        )

        # Canhão Laser/Plasma embutido na frente do pod lateral
        bmesh.ops.create_cone(
            bm_canhoes, cap_ends=True, cap_tris=False, segments=12,
            radius1=0.14, radius2=0.11, depth=0.88,
            matrix=Matrix.Translation((s * 2.12, -0.35, 1.16)) @ Euler((math.pi / 2, 0, 0), 'XYZ').to_matrix().to_4x4(),
        )
        # Ponta brilhante do canhão
        bmesh.ops.create_cone(
            bm_emiss, cap_ends=True, cap_tris=False, segments=10,
            radius1=0.09, radius2=0.09, depth=0.12,
            matrix=Matrix.Translation((s * 2.12, -0.80, 1.16)) @ Euler((math.pi / 2, 0, 0), 'XYZ').to_matrix().to_4x4(),
        )

        # Micro-canhão / sensor sob o bico (igual à referência!)
        bmesh.ops.create_cone(
            bm_canhoes, cap_ends=True, cap_tris=False, segments=10,
            radius1=0.06, radius2=0.04, depth=0.65,
            matrix=Matrix.Translation((s * 0.78, -3.85, 0.72)) @ Euler((math.pi / 2, 0, 0), 'XYZ').to_matrix().to_4x4(),
        )

    # Antena dorsal traseira inclinada
    bmesh.ops.create_cone(
        bm_canhoes, cap_ends=True, cap_tris=False, segments=8,
        radius1=0.024, radius2=0.008, depth=0.85,
        matrix=Matrix.Translation((0.68, 2.08, 2.95)) @ Euler((-0.42, 0.25, 0), 'XYZ').to_matrix().to_4x4(),
    )

    criar_obj_bm("AsasEstrutura", bm_asas_g, mat_grafite, raiz)
    criar_obj_bm("AsasBranco", bm_asas_b, mat_branco, raiz)
    criar_obj_bm("CanhoesAntenas", bm_canhoes, mat_escuro, raiz)
    criar_obj_bm("CanhoesEmissores", bm_emiss, mat_canhao_luz, raiz)

    # Luzes de navegação nas pontas das asas (vermelha esquerda, verde direita)
    for s, mat_l, nome_l in [(-1, mat_led_verm, "LuzNavE"), (1, mat_led_verd, "LuzNavD")]:
        bm_l = bmesh.new()
        bmesh.ops.create_icosphere(bm_l, subdivisions=2, radius=0.075, matrix=Matrix.Translation((s * 4.16, 1.24, 1.04)))
        criar_obj_bm(nome_l, bm_l, mat_l, raiz, smooth=True)

    # ------------------------------------------------------------------ 4. DOIS GRANDES PROPULSORES TRASEIROS
    bm_mot = bmesh.new()
    bm_core = bmesh.new()
    for s in (-1, 1):
        mx = s * 1.24
        mz = 1.38
        # Tambor principal do motor
        bmesh.ops.create_cone(
            bm_mot, cap_ends=True, cap_tris=False, segments=24,
            radius1=0.78, radius2=0.82, depth=1.05,
            matrix=Matrix.Translation((mx, 3.15, mz)) @ Euler((math.pi / 2, 0, 0), 'XYZ').to_matrix().to_4x4(),
        )
        # Anéis canelados da turbina (3 degraus)
        for idx, (oy, r1, r2, d) in enumerate([
            (3.75, 0.78, 0.70, 0.28),
            (4.02, 0.71, 0.64, 0.28),
            (4.26, 0.65, 0.58, 0.22),
        ]):
            bmesh.ops.create_cone(
                bm_mot, cap_ends=True, cap_tris=False, segments=24,
                radius1=r1, radius2=r2, depth=d,
                matrix=Matrix.Translation((mx, oy, mz)) @ Euler((math.pi / 2, 0, 0), 'XYZ').to_matrix().to_4x4(),
            )
        # Anel de reforço saliente
        bmesh.ops.create_cone(
            bm_mot, cap_ends=True, cap_tris=False, segments=24,
            radius1=0.85, radius2=0.85, depth=0.14,
            matrix=Matrix.Translation((mx, 3.55, mz)) @ Euler((math.pi / 2, 0, 0), 'XYZ').to_matrix().to_4x4(),
        )
        # Núcleo luminoso azul-plasma dentro do bocal!
        bmesh.ops.create_cone(
            bm_core, cap_ends=True, cap_tris=False, segments=20,
            radius1=0.46, radius2=0.42, depth=0.16,
            matrix=Matrix.Translation((mx, 4.30, mz)) @ Euler((math.pi / 2, 0, 0), 'XYZ').to_matrix().to_4x4(),
        )

    criar_obj_bm("MotoresTraseiros", bm_mot, mat_metal_motor, raiz, smooth=True)
    criar_obj_bm("MotoresPlasmaCore", bm_core, mat_chama, raiz, smooth=True)

    # Dutos/mangueiras de cobre expostos no dorso (igual à referência!)
    bm_dutos = bmesh.new()
    for s in (-1, 1):
        for off in (0.0, 0.14):
            pts = [
                (s * (0.86 + off), 0.75, 2.54),
                (s * (0.98 + off), 1.35, 2.56),
                (s * (1.16 + off), 1.95, 2.40),
                (s * (1.22 + off), 2.55, 2.15),
            ]
            for i in range(len(pts) - 1):
                p0, p1 = Vector(pts[i]), Vector(pts[i + 1])
                v = p1 - p0
                mid = (p0 + p1) * 0.5
                q = Vector((0, 0, 1)).rotation_difference(v.normalized())
                bmesh.ops.create_cone(
                    bm_dutos, cap_ends=True, cap_tris=False, segments=8,
                    radius1=0.042, radius2=0.042, depth=v.length,
                    matrix=Matrix.Translation(mid) @ q.to_matrix().to_4x4(),
                )
    criar_obj_bm("DutosCobre", bm_dutos, mat_cobre, raiz, smooth=True)

    # ------------------------------------------------------------------ 5. TREM DE POUSO RETRÁTIL (TremPouso)
    bm_trem = bmesh.new()
    # Esqui frontal sob o nariz
    adicionar_caixa_chanfrada(bm_trem, (0.0, -2.55, 0.30), (0.24, 0.16, 0.44), rot=(0.35, 0, 0), bevel=0.02)
    adicionar_caixa_chanfrada(bm_trem, (0.0, -2.65, 0.08), (0.62, 1.05, 0.12), bevel=0.02)
    # Pernas traseiras articuladas com esquis largos (iguais à referência!)
    for s in (-1, 1):
        adicionar_caixa_chanfrada(bm_trem, (s * 1.48, 2.38, 0.42), (0.22, 0.24, 0.78), rot=(-0.42, s * 0.22, 0), bevel=0.02)
        adicionar_caixa_chanfrada(bm_trem, (s * 1.62, 2.62, 0.08), (0.64, 1.32, 0.12), bevel=0.02)
    criar_obj_bm("TremPouso", bm_trem, mat_escuro, raiz)

    # ------------------------------------------------------------------ EXPORTAR GLB (game-ready)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.data.objects:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format='GLB',
        export_yup=True,
        export_apply=True,
        export_materials='EXPORT',
        export_normals=True,
        export_texcoords=True,
    )
    print(f"GLB exportado: {OUT_GLB} ({os.path.getsize(OUT_GLB) / 1024:.1f} KB)")

    # ------------------------------------------------------------------ RENDERIZAR PRÉVIA 3/4 ESTÚDIO
    # Chão cinza suave + iluminação de estúdio 3 pontos
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
    chao = bpy.context.active_object
    chao.data.materials.append(criar_mat("EstudioChao", (0.22, 0.23, 0.25), rough=0.85, metal=0.0))

    world = bpy.data.worlds.new("Studio")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.14, 0.16, 0.20, 1.0)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.9

    for pos, energy, col in [
        ((-9, -10, 11), 1800, (1.0, 0.96, 0.90)),
        ((10, -4, 7), 850, (0.72, 0.85, 1.0)),
        ((2, 12, 6), 1100, (1.0, 0.88, 0.72)),
    ]:
        ldata = bpy.data.lights.new("L", type='AREA')
        ldata.energy = energy
        ldata.size = 6.0
        ldata.color = col
        lobj = bpy.data.objects.new("L", ldata)
        scene.collection.objects.link(lobj)
        lobj.location = pos
        d = Vector((0, 0, 1.2)) - Vector(pos)
        lobj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = 42
    cam_obj = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 28
    scene.cycles.use_denoising = False
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.image_settings.file_format = 'PNG'

    # Renderiza 2 vistas combinadas (frente 3/4 + traseira 3/4) em uma prévia limpa
    vistas = [
        ((-8.2, -9.2, 5.2), (0.0, 0.0, 1.3), OUT_PREV.replace(".png", "_frente.png")),
        (( 8.6,  8.8, 4.8), (0.0, 0.2, 1.3), OUT_PREV.replace(".png", "_tras.png")),
    ]
    for pos, alvo, arq in vistas:
        cam_obj.location = pos
        cam_obj.rotation_euler = (Vector(alvo) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = arq
        bpy.ops.render.render(write_still=True)

    # Junta lado a lado num PNG final usando NumPy + bpy.data.images
    img1 = bpy.data.images.load(vistas[0][2])
    img2 = bpy.data.images.load(vistas[1][2])
    import numpy as np
    w, h = img1.size
    a1 = np.array(img1.pixels[:], dtype=np.float32).reshape(h, w, 4)
    a2 = np.array(img2.pixels[:], dtype=np.float32).reshape(h, w, 4)
    comb = np.concatenate([a1, a2], axis=1)
    out_img = bpy.data.images.new("PreviaNave", width=w * 2, height=h, alpha=True)
    out_img.pixels[:] = comb.ravel()
    out_img.filepath_raw = OUT_PREV
    out_img.file_format = 'PNG'
    out_img.save()
    for _, _, arq in vistas:
        try:
            os.remove(arq)
        except OSError:
            pass
    print("Prévia salva:", OUT_PREV)


if __name__ == "__main__":
    gerar_nave()
