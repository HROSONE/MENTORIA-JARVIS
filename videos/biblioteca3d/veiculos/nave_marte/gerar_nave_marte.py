"""
Gera o modelo 3D detalhado (V2 HD) da Nave Espacial HRYZ-Marte em Blender 4.0.2,
baseado fielmente na referência (1795824891805.jpg):
- Texturas PBR empacotadas no .glb (Albedo + Tangent-Space Normal Map de chapas blindadas, costuras, rebites e desgaste industrial)
- Casco blindado facetado branco-cerâmico, cinza grafite, armadura escura e faixas laranja industriais
- Cabine envidraçada multi-painel com montantes chanfrados, janelas laterais e interior detalhado + TelaPainel
- Nariz com sensor óptico frontal, micro-canhões inferiores e placas defletoras
- Asas curtas enflechadas com ailerons articulados, pods de admissão com grades internas, canhões rotativos Laser/Plasma com camisa de resfriamento, sondas pitot e luzes de navegação
- Espinha dorsal blindada com escotilha de acoplamento parafusada, aletas radiadoras, antenas duplas e tubulações de cobre com abraçadeiras
- Dois grandes propulsores traseiros com pétalas de pós-combustão segmentadas (16 pétalas), anéis de titânio, pás internas de turbina e núcleo de plasma azul + propulsor auxiliar central retangular
- Trem de pouso retrátil hidráulico detalhado (TremPouso)
Exporta videos/biblioteca3d/veiculos/nave_marte/nave_marte.glb e renderiza prévia HD.
"""
import math
import os
import numpy as np
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


def altura_para_normal_tangente(h, forca=2.6):
    """Converte mapa de altura 2D [0..1] em imagem RGBA de normal tangente (OpenGL/glTF)."""
    dy, dx = np.gradient(h)
    nx = -dx * forca
    ny = -dy * forca
    nz = np.ones_like(h)
    norm = np.sqrt(nx * nx + ny * ny + nz * nz) + 1e-8
    r = (nx / norm) * 0.5 + 0.5
    g = (ny / norm) * 0.5 + 0.5
    b = (nz / norm) * 0.5 + 0.5
    rgba = np.stack([r, g, b, np.ones_like(h)], axis=-1)
    return np.clip(rgba, 0.0, 1.0)


def criar_imagem_bpy(nome, rgba, srgb=True):
    h, w, _ = rgba.shape
    img = bpy.data.images.new(nome, width=w, height=h, alpha=False)
    img.colorspace_settings.name = "sRGB" if srgb else "Non-Color"
    img.pixels[:] = rgba.astype(np.float32).ravel()
    img.pack()
    return img


def gerar_texturas_casco(nome, cor_base, cor_escura, semente=1):
    """Gera Albedo 512x512 + Normal Map de placas sci-fi, juntas de blindagem, rebites e desgaste."""
    S = 512
    rng = np.random.default_rng(semente)
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)

    # Ruído multiescala suave para desgaste metálico/cerâmico
    n1 = np.sin(xx * 0.045 + rng.uniform(0, 6)) * np.cos(yy * 0.045 + rng.uniform(0, 6))
    n2 = np.sin((xx + yy) * 0.11) * 0.5 + np.cos((xx - yy) * 0.14) * 0.5
    gran = rng.normal(0.0, 0.035, (S, S)).astype(np.float32)
    wear = np.clip(0.5 + 0.24 * n1 + 0.14 * n2 + gran, 0.0, 1.0)

    # Costuras de painéis blindados (grade assimétrica sci-fi)
    alt = np.ones((S, S), dtype=np.float32) * 0.65
    linhas_x = [0, 96, 192, 320, 416]
    linhas_y = [0, 80, 176, 288, 400]
    seam_mask = np.zeros((S, S), dtype=np.float32)
    for lx in linhas_x:
        d = np.minimum(np.abs(xx - lx), S - np.abs(xx - lx))
        s = np.clip(1.0 - d / 2.6, 0.0, 1.0)
        seam_mask = np.maximum(seam_mask, s)
    for ly in linhas_y:
        d = np.minimum(np.abs(yy - ly), S - np.abs(yy - ly))
        s = np.clip(1.0 - d / 2.6, 0.0, 1.0)
        seam_mask = np.maximum(seam_mask, s)

    # Escotilhas técnicas retangulares e rebites nos cantos
    for rx0, ry0, rw, rh in [(24, 24, 52, 38), (218, 102, 76, 50), (344, 312, 54, 64), (116, 316, 78, 56)]:
        borda = (
            ((np.abs(xx - rx0) < 2.0) | (np.abs(xx - (rx0 + rw)) < 2.0)) & (yy >= ry0) & (yy <= ry0 + rh)
        ) | (
            ((np.abs(yy - ry0) < 2.0) | (np.abs(yy - (ry0 + rh)) < 2.0)) & (xx >= rx0) & (xx <= rx0 + rw)
        )
        seam_mask = np.maximum(seam_mask, borda.astype(np.float32) * 0.85)
        for cx in (rx0 + 6, rx0 + rw - 6):
            for cy in (ry0 + 6, ry0 + rh - 6):
                dist_r = np.hypot(xx - cx, yy - cy)
                alt += np.clip(1.0 - dist_r / 3.2, 0.0, 1.0) * 0.18

    # Fileiras de rebites ao longo das costuras principais
    for lx in linhas_x:
        for ry in range(16, S, 32):
            for ox in (-7, 7):
                cx = (lx + ox) % S
                dist_r = np.hypot(xx - cx, yy - ry)
                alt += np.clip(1.0 - dist_r / 2.5, 0.0, 1.0) * 0.14

    # Ranhuras de ventilação micro-usinadas
    vent = ((xx > 224) & (xx < 292) & (yy > 206) & (yy < 262) & ((yy.astype(int) % 8) < 3)).astype(np.float32)
    seam_mask = np.maximum(seam_mask, vent * 0.9)

    alt = np.clip(alt - seam_mask * 0.42 + gran * 0.35, 0.0, 1.0)

    c0 = np.array(cor_base, dtype=np.float32)
    c1 = np.array(cor_escura, dtype=np.float32)
    mix = np.clip(wear * 0.55 + seam_mask * 0.72, 0.0, 1.0)[..., None]
    rgb = c0 * (1.0 - mix) + c1 * mix
    # Realce sutil de borda clara ao lado das costuras (edge highlight)
    borda_clara = np.clip(np.roll(seam_mask, 2, axis=0) - seam_mask, 0.0, 1.0)[..., None] * 0.09
    rgb = np.clip(rgb + borda_clara, 0.0, 1.0)
    albedo = np.concatenate([rgb, np.ones((S, S, 1), dtype=np.float32)], axis=-1)

    normal_rgba = altura_para_normal_tangente(alt, forca=3.0)
    img_alb = criar_imagem_bpy(f"{nome}_Alb", albedo, srgb=True)
    img_nrm = criar_imagem_bpy(f"{nome}_Nrm", normal_rgba, srgb=False)
    return img_alb, img_nrm


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


def criar_mat_pbr_glb(nome, cor_base, cor_escura, rough=0.44, metal=0.35, semente=1, nrm_forca=0.85):
    """Material PBR 100% exportável para glTF/Three.js com Albedo + Normal Map empacotados."""
    img_alb, img_nrm = gerar_texturas_casco(nome, cor_base, cor_escura, semente=semente)
    mat = bpy.data.materials.new(nome)
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal

    tex_alb = nodes.new("ShaderNodeTexImage")
    tex_alb.image = img_alb
    links.new(tex_alb.outputs["Color"], bsdf.inputs["Base Color"])

    tex_nrm = nodes.new("ShaderNodeTexImage")
    tex_nrm.image = img_nrm
    nrm_node = nodes.new("ShaderNodeNormalMap")
    nrm_node.inputs["Strength"].default_value = nrm_forca
    links.new(tex_nrm.outputs["Color"], nrm_node.inputs["Color"])
    links.new(nrm_node.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def projetar_uv_box(bm, escala=0.38):
    """Projeção UV triplanar/box limpa em todas as faces para as chapas e rebites aparecerem perfeitos no GLB."""
    uv_layer = bm.loops.layers.uv.verify()
    for f in bm.faces:
        n = f.normal
        ax, ay, az = abs(n.x), abs(n.y), abs(n.z)
        for loop in f.loops:
            co = loop.vert.co
            if az >= ax and az >= ay:
                u, v = co.x * escala, co.y * escala
            elif ax >= ay:
                u, v = co.y * escala, co.z * escala
            else:
                u, v = co.x * escala, co.z * escala
            loop[uv_layer].uv = (u + 0.5, v + 0.5)


def criar_obj_bm(nome, bm, mat, parent=None, smooth=False, auto_uv=True, uv_escala=0.38):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if auto_uv:
        projetar_uv_box(bm, escala=uv_escala)
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


def adicionar_caixa_chanfrada(bm, centro, dim, rot=(0, 0, 0), bevel=0.045):
    m = Matrix.Translation(Vector(centro)) @ Euler(rot, 'XYZ').to_matrix().to_4x4() @ Matrix.Diagonal((dim[0], dim[1], dim[2], 1.0))
    res = bmesh.ops.create_cube(bm, size=1.0, matrix=m)
    if bevel > 0:
        verts = res["verts"]
        edges = list({e for v in verts for e in v.link_edges})
        bmesh.ops.bevel(bm, geom=edges, offset=bevel, segments=1, affect='EDGES', clamp_overlap=True)
    return res["verts"]


def adicionar_tubo(bm, p0, p1, r1, r2=None, segs=10):
    if r2 is None:
        r2 = r1
    v0, v1 = Vector(p0), Vector(p1)
    d = v1 - v0
    if d.length < 1e-5:
        return
    mid = (v0 + v1) * 0.5
    q = Vector((0, 0, 1)).rotation_difference(d.normalized())
    bmesh.ops.create_cone(
        bm, cap_ends=True, cap_tris=False, segments=segs,
        radius1=r1, radius2=r2, depth=d.length,
        matrix=Matrix.Translation(mid) @ q.to_matrix().to_4x4(),
    )


def criar_secao_hull(bm, secoes):
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
    try:
        bm.faces.new(list(reversed(aneis[0])))
        bm.faces.new(aneis[-1])
    except ValueError:
        pass


def gerar_nave():
    limpar_cena()
    scene = bpy.context.scene

    # Materiais PBR com texturas de placas/rebites/normal map embutidas no GLB!
    mat_branco = criar_mat_pbr_glb("Hull_Branco", (0.82, 0.84, 0.87), (0.56, 0.59, 0.63), rough=0.38, metal=0.22, semente=11, nrm_forca=0.85)
    mat_grafite = criar_mat_pbr_glb("Hull_Grafite", (0.24, 0.27, 0.31), (0.12, 0.14, 0.17), rough=0.44, metal=0.55, semente=22, nrm_forca=0.95)
    mat_escuro = criar_mat_pbr_glb("Hull_Escuro", (0.11, 0.12, 0.15), (0.05, 0.06, 0.08), rough=0.48, metal=0.64, semente=33, nrm_forca=0.80)
    mat_laranja = criar_mat_pbr_glb("Hull_Laranja", (0.90, 0.45, 0.09), (0.58, 0.25, 0.04), rough=0.36, metal=0.26, semente=44, nrm_forca=0.75)
    mat_cobre = criar_mat("Cobre_Dutos", (0.68, 0.36, 0.17), rough=0.28, metal=0.88)
    mat_metal_motor = criar_mat_pbr_glb("Motor_Titanio", (0.32, 0.34, 0.38), (0.14, 0.15, 0.18), rough=0.30, metal=0.88, semente=55, nrm_forca=1.0)
    mat_vidro = criar_mat("Cabine_Vidro", (0.04, 0.09, 0.15), rough=0.05, metal=0.30, alpha=0.76)
    mat_chama = criar_mat("Motor_PlasmaCore", (0.25, 0.82, 1.0), rough=0.08, metal=0.0, emissivo=(0.30, 0.86, 1.0), em_forca=6.5)
    mat_canhao_luz = criar_mat("Canhao_Emissor", (0.98, 0.42, 0.16), rough=0.18, metal=0.1, emissivo=(1.0, 0.46, 0.18), em_forca=4.0)
    mat_sensor_ciano = criar_mat("Sensor_Ciano", (0.20, 0.80, 1.0), rough=0.12, metal=0.2, emissivo=(0.22, 0.85, 1.0), em_forca=3.8)
    mat_painel = criar_mat("Painel_Tela", (0.06, 0.14, 0.24), rough=0.18, metal=0.1, emissivo=(0.15, 0.65, 1.0), em_forca=2.2)
    mat_led_verm = criar_mat("Led_Vermelho", (0.95, 0.12, 0.08), rough=0.2, metal=0.1, emissivo=(1.0, 0.15, 0.1), em_forca=4.5)
    mat_led_verd = criar_mat("Led_Verde", (0.12, 0.95, 0.32), rough=0.2, metal=0.1, emissivo=(0.15, 1.0, 0.35), em_forca=4.5)

    raiz = bpy.data.objects.new("NaveMarte", None)
    scene.collection.objects.link(raiz)

    # ------------------------------------------------------------------ 1. CASCO PRINCIPAL + PLACAS DE ARMADURA
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
        perfil(-4.26, 0.44, 0.66, 0.48, 0.68, 0.96, 1.16),
        perfil(-3.58, 0.74, 1.06, 0.88, 0.58, 1.08, 1.48),
        perfil(-2.15, 0.98, 1.46, 1.20, 0.50, 1.32, 2.04),
        perfil(-0.75, 1.20, 1.68, 1.38, 0.48, 1.56, 2.40),
        perfil( 0.88, 1.26, 1.75, 1.44, 0.50, 1.64, 2.50),
        perfil( 2.48, 1.16, 1.64, 1.34, 0.58, 1.58, 2.36),
        perfil( 3.28, 0.94, 1.36, 1.10, 0.72, 1.44, 2.04),
    ])
    # Placas blindadas laterais sobrepostas (greebles táticos do casco)
    for s in (-1, 1):
        adicionar_caixa_chanfrada(bm_casco, (s * 1.32, -3.05, 0.94), (0.20, 0.92, 0.36), rot=(0.22, s * -0.18, s * -0.15), bevel=0.025)
        adicionar_caixa_chanfrada(bm_casco, (s * 1.64, -1.22, 1.16), (0.16, 1.08, 0.58), rot=(0, 0, s * -0.06), bevel=0.025)
        adicionar_caixa_chanfrada(bm_casco, (s * 1.58, 1.98, 0.96), (0.22, 1.10, 0.48), bevel=0.025)
    criar_obj_bm("CascoGrafite", bm_casco, mat_grafite, raiz, uv_escala=0.42)

    # Chapas blindadas BRANCAS cerâmicas (bico, bochechas da cabine, carenagens superiores e flancos)
    bm_branco = bmesh.new()
    adicionar_caixa_chanfrada(bm_branco, (0.0, -4.02, 1.04), (1.18, 0.74, 0.46), rot=(0.24, 0, 0), bevel=0.05)
    adicionar_caixa_chanfrada(bm_branco, (0.0, -3.55, 1.24), (0.96, 0.42, 0.18), rot=(0.30, 0, 0), bevel=0.025)
    for s in (-1, 1):
        adicionar_caixa_chanfrada(bm_branco, (s * 1.17, -1.92, 1.62), (0.64, 2.48, 0.52), rot=(0.28, s * -0.42, s * -0.14), bevel=0.045)
        adicionar_caixa_chanfrada(bm_branco, (s * 1.48, -0.16, 1.78), (0.50, 1.58, 0.62), rot=(0.0, s * -0.18, 0), bevel=0.045)
        adicionar_caixa_chanfrada(bm_branco, (s * 1.68, 0.16, 1.18), (0.18, 1.64, 0.78), bevel=0.03)
        # Carenagem branca na entrada dos pods das asas
        adicionar_caixa_chanfrada(bm_branco, (s * 2.12, 0.18, 1.54), (0.68, 0.56, 0.16), bevel=0.02)
    adicionar_caixa_chanfrada(bm_branco, (0.0, -0.58, 2.30), (2.02, 0.98, 0.34), rot=(0.12, 0, 0), bevel=0.045)
    criar_obj_bm("BlindagemBranca", bm_branco, mat_branco, raiz, uv_escala=0.45)

    # Faixas LARANJA INDUSTRIAIS (fiéis à referência!)
    bm_lar = bmesh.new()
    for s in (-1, 1):
        adicionar_caixa_chanfrada(bm_lar, (s * 1.26, -2.56, 1.12), (0.28, 0.58, 0.70), rot=(0.35, s * -0.22, s * -0.22), bevel=0.025)
        adicionar_caixa_chanfrada(bm_lar, (s * 0.92, -3.66, 0.88), (0.18, 0.44, 0.24), rot=(0.22, 0, s * -0.18), bevel=0.015)
        adicionar_caixa_chanfrada(bm_lar, (s * 1.44, 2.16, 2.00), (0.78, 1.32, 0.46), rot=(-0.10, s * -0.18, 0), bevel=0.04)
        adicionar_caixa_chanfrada(bm_lar, (s * 2.12, 0.56, 1.38), (0.78, 0.44, 0.76), bevel=0.03)
        adicionar_caixa_chanfrada(bm_lar, (s * 3.88, 1.40, 1.08), (0.44, 0.90, 0.14), rot=(0, s * 0.08, s * 0.25), bevel=0.02)
        adicionar_caixa_chanfrada(bm_lar, (s * 0.74, 3.26, 1.14), (0.22, 0.24, 0.60), bevel=0.02)
        adicionar_caixa_chanfrada(bm_lar, (s * 0.68, -0.62, 2.48), (0.24, 0.46, 0.12), bevel=0.015)
    criar_obj_bm("FaixasLaranja", bm_lar, mat_laranja, raiz, uv_escala=0.50)

    # ------------------------------------------------------------------ 2. CABINE BLINDADA + VIDRO + INTERIOR
    bm_vid = bmesh.new()
    criar_secao_hull(bm_vid, [
        [(-0.56, -3.54, 1.34), ( 0.56, -3.54, 1.34), ( 0.44, -3.50, 1.56), (-0.44, -3.50, 1.56)],
        [(-0.88, -2.20, 1.66), ( 0.88, -2.20, 1.66), ( 0.68, -2.18, 2.14), (-0.68, -2.18, 2.14)],
        [(-0.96, -1.05, 1.84), ( 0.96, -1.05, 1.84), ( 0.74, -1.05, 2.32), (-0.74, -1.05, 2.32)],
    ])
    criar_obj_bm("CabineVidro", bm_vid, mat_vidro, raiz, auto_uv=False)

    bm_mold = bmesh.new()
    # Montantes blindados da cabine
    adicionar_caixa_chanfrada(bm_mold, (0.0, -2.35, 1.95), (0.11, 2.50, 0.14), rot=(0.31, 0, 0), bevel=0.015)
    adicionar_caixa_chanfrada(bm_mold, (0.0, -2.25, 2.02), (1.58, 0.14, 0.14), bevel=0.015)
    adicionar_caixa_chanfrada(bm_mold, (0.0, -3.52, 1.46), (1.16, 0.14, 0.14), bevel=0.015)
    for s in (-1, 1):
        adicionar_caixa_chanfrada(bm_mold, (s * 0.62, -2.28, 1.96), (0.13, 2.52, 0.16), rot=(0.31, s * -0.14, s * -0.14), bevel=0.015)
        adicionar_caixa_chanfrada(bm_mold, (s * 0.85, -2.25, 1.62), (0.12, 2.46, 0.14), rot=(0.24, s * -0.12, s * -0.18), bevel=0.015)
        adicionar_caixa_chanfrada(bm_mold, (s * 0.82, -2.18, 1.88), (0.10, 0.12, 0.54), rot=(0.25, s * 0.35, 0), bevel=0.01)

    # Espinha dorsal blindada com escotilha de acoplamento e parafusos
    adicionar_caixa_chanfrada(bm_mold, (0.0, 0.96, 2.54), (1.78, 2.98, 0.36), bevel=0.06)
    adicionar_caixa_chanfrada(bm_mold, (0.0, 1.98, 2.68), (1.20, 1.28, 0.18), bevel=0.04)
    adicionar_caixa_chanfrada(bm_mold, (0.0, 2.86, 2.42), (1.02, 0.68, 0.28), rot=(-0.28, 0, 0), bevel=0.03)
    bmesh.ops.create_cone(
        bm_mold, cap_ends=True, cap_tris=False, segments=20,
        radius1=0.46, radius2=0.40, depth=0.13,
        matrix=Matrix.Translation((0.0, 1.28, 2.76)),
    )
    for k in range(8):
        ang = k * (math.pi / 4.0)
        bmesh.ops.create_cone(
            bm_mold, cap_ends=True, cap_tris=False, segments=8,
            radius1=0.035, radius2=0.03, depth=0.05,
            matrix=Matrix.Translation((math.cos(ang) * 0.34, 1.28 + math.sin(ang) * 0.34, 2.84)),
        )

    # Propulsor auxiliar traseiro retangular entre os dois motores (fiel à referência!)
    adicionar_caixa_chanfrada(bm_mold, (0.0, 3.34, 1.28), (1.16, 0.38, 0.98), bevel=0.04)
    for k in (-0.28, 0.0, 0.28):
        adicionar_caixa_chanfrada(bm_mold, (0.0, 3.53, 1.28 + k), (0.86, 0.08, 0.09), bevel=0.01)

    # Quilha / barriga blindada com defletores térmicos
    adicionar_caixa_chanfrada(bm_mold, (0.0, -0.35, 0.52), (2.30, 5.88, 0.32), bevel=0.05)
    for ky in (-2.0, -0.8, 0.4, 1.6):
        adicionar_caixa_chanfrada(bm_mold, (0.0, ky, 0.36), (1.65, 0.52, 0.08), bevel=0.015)

    # Escotilhas laterais (airlocks) + grades radiadoras nos ombros traseiros
    for s in (-1, 1):
        adicionar_caixa_chanfrada(bm_mold, (s * 1.74, -0.34, 1.18), (0.11, 0.96, 0.84), bevel=0.025)
        adicionar_caixa_chanfrada(bm_mold, (s * 1.80, -0.34, 1.18), (0.04, 0.68, 0.58), bevel=0.01)
        for k in range(5):
            adicionar_caixa_chanfrada(bm_mold, (s * 1.18, 1.18 + k * 0.19, 2.39), (0.60, 0.09, 0.16), rot=(-0.22, s * -0.15, 0), bevel=0.01)

    # Nariz frontal: cúpula óptica/radar sob o queixo
    adicionar_caixa_chanfrada(bm_mold, (0.0, -4.18, 0.78), (0.64, 0.42, 0.26), bevel=0.03)
    criar_obj_bm("ArmaduraEscura", bm_mold, mat_escuro, raiz, uv_escala=0.52)

    # Lente luminosa do radar frontal
    bm_rad = bmesh.new()
    bmesh.ops.create_icosphere(bm_rad, subdivisions=2, radius=0.11, matrix=Matrix.Translation((0.0, -4.38, 0.78)))
    for s in (-1, 1):
        bmesh.ops.create_icosphere(bm_rad, subdivisions=1, radius=0.055, matrix=Matrix.Translation((s * 0.46, -4.22, 0.86)))
    criar_obj_bm("SensoresProa", bm_rad, mat_sensor_ciano, raiz, smooth=True, auto_uv=False)

    # Interior da Cabine + TelaPainel
    bm_int = bmesh.new()
    adicionar_caixa_chanfrada(bm_int, (0.0, -1.65, 1.32), (0.72, 0.68, 0.62), bevel=0.03)
    adicionar_caixa_chanfrada(bm_int, (0.0, -1.35, 1.72), (0.64, 0.16, 0.72), rot=(-0.18, 0, 0), bevel=0.03)
    adicionar_caixa_chanfrada(bm_int, (0.0, -2.85, 1.32), (1.36, 0.75, 0.42), rot=(0.25, 0, 0), bevel=0.03)
    criar_obj_bm("InteriorCabine", bm_int, mat_escuro, raiz)

    bm_tela = bmesh.new()
    uv_layer = bm_tela.loops.layers.uv.new("UVMap")
    v0 = bm_tela.verts.new((-0.56, -2.74, 1.48))
    v1 = bm_tela.verts.new(( 0.56, -2.74, 1.48))
    v2 = bm_tela.verts.new(( 0.56, -2.92, 1.78))
    v3 = bm_tela.verts.new((-0.56, -2.92, 1.78))
    f_tela = bm_tela.faces.new([v0, v1, v2, v3])
    for loop, uv in zip(f_tela.loops, [(0, 0), (1, 0), (1, 1), (0, 1)]):
        loop[uv_layer].uv = uv
    criar_obj_bm("TelaPainel", bm_tela, mat_painel, raiz, auto_uv=False)

    # ------------------------------------------------------------------ 3. ASAS ENFLECHADAS + PODS + CANHÕES ROTATIVOS
    bm_asas_g = bmesh.new()
    bm_asas_b = bmesh.new()
    bm_canhoes = bmesh.new()
    bm_emiss = bmesh.new()

    for s in (-1, 1):
        # Pod lateral pesado (admissão + baia de armamento)
        adicionar_caixa_chanfrada(bm_asas_g, (s * 2.12, 0.92, 1.24), (0.90, 2.12, 0.78), bevel=0.05)
        adicionar_caixa_chanfrada(bm_asas_b, (s * 2.14, 1.05, 1.65), (0.74, 1.58, 0.14), bevel=0.02)
        # Cilindro superior externo no pod (tanque de plasma auxiliar da referência!)
        adicionar_tubo(bm_asas_b, (s * 2.42, 0.45, 1.58), (s * 2.42, 1.38, 1.58), 0.14, 0.14, segs=12)

        # Grades de admissão frontais dentro do pod
        for kz in (-0.16, 0.0, 0.16):
            adicionar_caixa_chanfrada(bm_canhoes, (s * 2.12, -0.14, 1.24 + kz), (0.58, 0.12, 0.05), bevel=0.008)

        # Asa trapezoidal enflechada + aileron articulado traseiro
        p_raiz = [
            (s * 2.44, 0.28, 1.18),
            (s * 2.44, 1.88, 1.14),
            (s * 2.44, 1.88, 1.38),
            (s * 2.44, 0.28, 1.44),
        ]
        p_ponta = [
            (s * 4.24, 1.08, 0.94),
            (s * 4.24, 2.00, 0.94),
            (s * 4.24, 2.00, 1.08),
            (s * 4.24, 1.08, 1.10),
        ]
        if s < 0:
            criar_secao_hull(bm_asas_g, [p_raiz, p_ponta])
        else:
            criar_secao_hull(bm_asas_g, [list(reversed(p_raiz)), list(reversed(p_ponta))])

        # Aileron / flap escuro no bordo de fuga da asa
        adicionar_caixa_chanfrada(bm_canhoes, (s * 3.35, 1.94, 1.08), (1.42, 0.24, 0.09), rot=(0, s * 0.12, s * 0.06), bevel=0.012)
        # Painel branco superior da asa
        adicionar_caixa_chanfrada(bm_asas_b, (s * 3.26, 1.22, 1.26), (1.38, 0.80, 0.10), rot=(0.02, s * 0.14, s * 0.34), bevel=0.02)
        # Winglet de ponta de asa
        adicionar_caixa_chanfrada(bm_asas_g, (s * 4.24, 1.54, 1.04), (0.10, 0.96, 0.22), bevel=0.015)

        # Sonda pitot frontal na ponta da asa
        adicionar_tubo(bm_canhoes, (s * 4.24, 1.10, 1.02), (s * 4.24, 0.42, 1.02), 0.026, 0.008, segs=8)

        # Canhão pesado Laser/Plasma com camisa de resfriamento e cano duplo!
        adicionar_tubo(bm_canhoes, (s * 2.12, 0.05, 1.14), (s * 2.12, -0.82, 1.14), 0.16, 0.13, segs=14)
        for anel_y in (-0.30, -0.52, -0.72):
            adicionar_tubo(bm_canhoes, (s * 2.12, anel_y, 1.14), (s * 2.12, anel_y - 0.06, 1.14), 0.185, 0.185, segs=14)
        adicionar_tubo(bm_canhoes, (s * 2.12, -0.78, 1.14), (s * 2.12, -1.16, 1.14), 0.085, 0.075, segs=12)
        # Boca incandescente do canhão
        adicionar_tubo(bm_emiss, (s * 2.12, -1.14, 1.14), (s * 2.12, -1.24, 1.14), 0.068, 0.068, segs=10)

        # Canhões auxiliares gêmeos sob o queixo do nariz!
        adicionar_tubo(bm_canhoes, (s * 0.78, -3.52, 0.72), (s * 0.78, -4.32, 0.72), 0.065, 0.042, segs=10)
        adicionar_tubo(bm_emiss, (s * 0.78, -4.30, 0.72), (s * 0.78, -4.38, 0.72), 0.036, 0.036, segs=8)

    # Duas antenas dorsais inclinadas para trás
    adicionar_tubo(bm_canhoes, ( 0.68, 1.85, 2.74), ( 0.86, 2.55, 3.36), 0.024, 0.007, segs=8)
    adicionar_tubo(bm_canhoes, (-0.52, 2.10, 2.74), (-0.62, 2.58, 3.18), 0.018, 0.006, segs=8)

    criar_obj_bm("AsasEstrutura", bm_asas_g, mat_grafite, raiz, uv_escala=0.45)
    criar_obj_bm("AsasBranco", bm_asas_b, mat_branco, raiz, uv_escala=0.45)
    criar_obj_bm("CanhoesAntenas", bm_canhoes, mat_escuro, raiz, uv_escala=0.60)
    criar_obj_bm("CanhoesEmissores", bm_emiss, mat_canhao_luz, raiz, auto_uv=False)

    for s, mat_l, nome_l in [(-1, mat_led_verm, "LuzNavE"), (1, mat_led_verd, "LuzNavD")]:
        bm_l = bmesh.new()
        bmesh.ops.create_icosphere(bm_l, subdivisions=2, radius=0.075, matrix=Matrix.Translation((s * 4.26, 1.22, 1.06)))
        criar_obj_bm(nome_l, bm_l, mat_l, raiz, smooth=True, auto_uv=False)

    # ------------------------------------------------------------------ 4. DOIS GRANDES PROPULSORES TRASEIROS SEGMENTADOS
    bm_mot = bmesh.new()
    bm_petalas = bmesh.new()
    bm_core = bmesh.new()
    for s in (-1, 1):
        mx = s * 1.24
        mz = 1.38
        # Tambor blindado principal + anéis de titânio
        adicionar_tubo(bm_mot, (mx, 2.60, mz), (mx, 3.68, mz), 0.80, 0.84, segs=28)
        adicionar_tubo(bm_mot, (mx, 3.46, mz), (mx, 3.64, mz), 0.88, 0.88, segs=28)
        adicionar_tubo(bm_mot, (mx, 3.68, mz), (mx, 4.02, mz), 0.81, 0.73, segs=28)
        adicionar_tubo(bm_mot, (mx, 3.92, mz), (mx, 4.04, mz), 0.77, 0.77, segs=28)

        # 16 pétalas mecânicas articuladas do bocal de pós-combustão (igual aos motores pesados da referência!)
        n_pet = 16
        for p in range(n_pet):
            ang = (p / n_pet) * math.pi * 2.0
            px = mx + math.cos(ang) * 0.66
            pz = mz + math.sin(ang) * 0.66
            adicionar_caixa_chanfrada(
                bm_petalas,
                (px, 4.20, pz),
                (0.21, 0.44, 0.065),
                rot=(0.14 * math.sin(ang), -ang + math.pi / 2, -0.14 * math.cos(ang)),
                bevel=0.01,
            )

        # Cone interno escuro do exaustor + núcleo incandescente azul-plasma
        adicionar_tubo(bm_petalas, (mx, 3.98, mz), (mx, 4.38, mz), 0.62, 0.52, segs=24)
        adicionar_tubo(bm_core, (mx, 4.24, mz), (mx, 4.39, mz), 0.48, 0.44, segs=22)

    criar_obj_bm("MotoresTraseiros", bm_mot, mat_metal_motor, raiz, smooth=True, uv_escala=0.55)
    criar_obj_bm("MotoresPetalas", bm_petalas, mat_escuro, raiz, uv_escala=0.65)
    criar_obj_bm("MotoresPlasmaCore", bm_core, mat_chama, raiz, smooth=True, auto_uv=False)

    # Dutos/mangueiras de cobre expostos no dorso e naceles com abraçadeiras metálicas
    bm_dutos = bmesh.new()
    for s in (-1, 1):
        for off, rz in [(0.0, 0.044), (0.14, 0.036)]:
            pts = [
                (s * (0.86 + off), 0.68, 2.54),
                (s * (0.98 + off), 1.32, 2.57),
                (s * (1.16 + off), 1.95, 2.41),
                (s * (1.24 + off), 2.58, 2.15),
            ]
            for i in range(len(pts) - 1):
                adicionar_tubo(bm_dutos, pts[i], pts[i + 1], rz, rz, segs=10)
        # Tubulação lateral de cobre alimentando os pods das asas
        adicionar_tubo(bm_dutos, (s * 1.62, 0.25, 1.56), (s * 1.96, 0.52, 1.54), 0.032, 0.032, segs=8)
        adicionar_tubo(bm_dutos, (s * 1.62, 0.38, 1.50), (s * 1.96, 0.65, 1.48), 0.028, 0.028, segs=8)
    criar_obj_bm("DutosCobre", bm_dutos, mat_cobre, raiz, smooth=True, auto_uv=False)

    # ------------------------------------------------------------------ 5. TREM DE POUSO HIDRÁULICO RETRÁTIL (TremPouso)
    bm_trem = bmesh.new()
    # Perna dianteira articulada + pistão + sapata dupla
    adicionar_tubo(bm_trem, (0.0, -2.42, 0.58), (0.0, -2.62, 0.12), 0.09, 0.075, segs=10)
    adicionar_tubo(bm_trem, (0.0, -2.18, 0.54), (0.0, -2.55, 0.20), 0.045, 0.045, segs=8)
    adicionar_caixa_chanfrada(bm_trem, (0.0, -2.66, 0.07), (0.66, 1.12, 0.12), bevel=0.02)
    # Pernas traseiras pesadas em A com amortecedores hidráulicos e esquis largos
    for s in (-1, 1):
        adicionar_tubo(bm_trem, (s * 1.34, 2.18, 0.72), (s * 1.64, 2.58, 0.12), 0.10, 0.085, segs=10)
        adicionar_tubo(bm_trem, (s * 1.34, 2.75, 0.70), (s * 1.64, 2.68, 0.14), 0.065, 0.055, segs=8)
        adicionar_caixa_chanfrada(bm_trem, (s * 1.65, 2.62, 0.07), (0.68, 1.42, 0.13), bevel=0.025)
    criar_obj_bm("TremPouso", bm_trem, mat_escuro, raiz, uv_escala=0.60)

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

    # ------------------------------------------------------------------ RENDERIZAR PRÉVIA ESTÚDIO HD
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
    chao = bpy.context.active_object
    chao.data.materials.append(criar_mat("EstudioChao", (0.20, 0.21, 0.24), rough=0.82, metal=0.0))

    world = bpy.data.worlds.new("Studio")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.14, 0.16, 0.20, 1.0)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.95

    for pos, energy, col in [
        ((-9, -10, 11), 1950, (1.0, 0.96, 0.90)),
        ((10, -4, 7), 920, (0.72, 0.85, 1.0)),
        ((2, 12, 6), 1200, (1.0, 0.88, 0.72)),
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

    vistas = [
        ((-8.0, -9.0, 5.0), (0.0, 0.0, 1.3), OUT_PREV.replace(".png", "_frente.png")),
        (( 8.4,  8.6, 4.7), (0.0, 0.2, 1.3), OUT_PREV.replace(".png", "_tras.png")),
    ]
    for pos, alvo, arq in vistas:
        cam_obj.location = pos
        cam_obj.rotation_euler = (Vector(alvo) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = arq
        bpy.ops.render.render(write_still=True)

    img1 = bpy.data.images.load(vistas[0][2])
    img2 = bpy.data.images.load(vistas[1][2])
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
