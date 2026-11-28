"""
Gera o modelo 3D game-ready da Nave Inimiga Interdimensional (Chefe de Marte) em Blender 4.0.2:
- Casco alienígena/interdimensional de obsidiana metálica com veios de energia púrpura/carmesim e Normal Map tangente
- Mandíbulas frontais duplas predatórias + Olho/Núcleo dimensional incandescente central
- Asas em foice (scythe-wings) superiores e inferiores com 4 canhões pesados de plasma rubro
- Crista dorsal energética + 3 propulsores traseiros de vácuo púrpura
Exporta videos/biblioteca3d/cenarios/marte/nave_inimiga.glb e renderiza prévia.
"""
import math
import os
import numpy as np
import bpy
import bmesh
from mathutils import Vector, Matrix, Euler

ROOT = "/home/antigravity/HROSONE/MENTORIA-JARVIS"
OUT_DIR = os.path.join(ROOT, "videos/biblioteca3d/cenarios/marte")
OUT_GLB = os.path.join(OUT_DIR, "nave_inimiga.glb")
OUT_PREV = "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/3f0a27bc-cfc6-4516-9690-dfa0fef93d50/nave_inimiga_previa.png"
os.makedirs(OUT_DIR, exist_ok=True)


def limpar_cena():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def altura_para_normal_tangente(h, forca=3.0):
    dy, dx = np.gradient(h)
    nx = -dx * forca
    ny = -dy * forca
    nz = np.ones_like(h)
    norm = np.sqrt(nx * nx + ny * ny + nz * nz) + 1e-8
    rgba = np.stack([(nx / norm) * 0.5 + 0.5, (ny / norm) * 0.5 + 0.5, (nz / norm) * 0.5 + 0.5, np.ones_like(h)], axis=-1)
    return np.clip(rgba, 0.0, 1.0)


def criar_img(nome, rgba, srgb=True):
    h, w, _ = rgba.shape
    img = bpy.data.images.new(nome, width=w, height=h, alpha=False)
    img.colorspace_settings.name = "sRGB" if srgb else "Non-Color"
    img.pixels[:] = rgba.astype(np.float32).ravel()
    img.pack()
    return img


def criar_mat_alien(nome, c_base, c_veio, rough=0.32, metal=0.82, semente=7):
    S = 512
    rng = np.random.default_rng(semente)
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)

    # Padrão hexagonal/biomecânico alienígena
    ang1 = xx * 0.075 + np.sin(yy * 0.04) * 1.4
    ang2 = (xx * 0.5 + yy * 0.866) * 0.075
    ang3 = (-xx * 0.5 + yy * 0.866) * 0.075
    rede = np.maximum(np.abs(np.sin(ang1)), np.maximum(np.abs(np.sin(ang2)), np.abs(np.sin(ang3))))
    sulco = np.clip((rede - 0.90) / 0.10, 0.0, 1.0)
    gran = rng.normal(0.0, 0.025, (S, S)).astype(np.float32)

    alt = np.clip(0.70 - sulco * 0.48 + gran, 0.0, 1.0)
    b0 = np.array(c_base, dtype=np.float32)
    b1 = np.array(c_veio, dtype=np.float32)
    mix = (sulco * 0.85)[..., None]
    rgb = np.clip(b0 * (1.0 - mix) + b1 * mix, 0.0, 1.0)
    alb = np.concatenate([rgb, np.ones((S, S, 1), dtype=np.float32)], axis=-1)
    nrm = altura_para_normal_tangente(alt, forca=3.2)

    mat = bpy.data.materials.new(nome)
    mat.use_nodes = True
    nt = mat.node_tree
    nodes, links = nt.nodes, nt.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal

    ta = nodes.new("ShaderNodeTexImage")
    ta.image = criar_img(f"{nome}_A", alb, True)
    links.new(ta.outputs["Color"], bsdf.inputs["Base Color"])

    tn = nodes.new("ShaderNodeTexImage")
    tn.image = criar_img(f"{nome}_N", nrm, False)
    nm = nodes.new("ShaderNodeNormalMap")
    nm.inputs["Strength"].default_value = 1.0
    links.new(tn.outputs["Color"], nm.inputs["Color"])
    links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def criar_mat_emissivo(nome, cor, forca=5.5):
    mat = bpy.data.materials.new(nome)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*cor, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.12
    bsdf.inputs["Emission Color"].default_value = (*cor, 1.0)
    bsdf.inputs["Emission Strength"].default_value = forca
    return mat


def projetar_uv_box(bm, escala=0.22):
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


def criar_obj_bm(nome, bm, mat, parent=None, smooth=False, auto_uv=True):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if auto_uv:
        projetar_uv_box(bm)
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


def caixa(bm, centro, dim, rot=(0, 0, 0), bevel=0.05):
    m = Matrix.Translation(Vector(centro)) @ Euler(rot, 'XYZ').to_matrix().to_4x4() @ Matrix.Diagonal((*dim, 1.0))
    res = bmesh.ops.create_cube(bm, size=1.0, matrix=m)
    if bevel > 0:
        verts = res["verts"]
        edges = list({e for v in verts for e in v.link_edges})
        bmesh.ops.bevel(bm, geom=edges, offset=bevel, segments=1, affect='EDGES', clamp_overlap=True)


def tubo(bm, p0, p1, r1, r2=None, segs=12):
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


def hull_loft(bm, secoes):
    aneis = [[bm.verts.new(Vector(p)) for p in pts] for pts in secoes]
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


def gerar_nave_inimiga():
    limpar_cena()
    scene = bpy.context.scene

    # Frente da nave inimiga em -Y no Blender -> +Z em Three.js (assim lookAt aponta a frente direto para o jogador!)
    mat_obsidiana = criar_mat_alien("Alien_Obsidiana", (0.10, 0.08, 0.16), (0.55, 0.12, 0.72), rough=0.28, metal=0.86, semente=19)
    mat_placa_roxa = criar_mat_alien("Alien_PlacaRoxa", (0.20, 0.12, 0.30), (0.85, 0.18, 0.42), rough=0.34, metal=0.78, semente=29)
    mat_nucleo = criar_mat_emissivo("Alien_NucleoRubro", (1.0, 0.16, 0.32), forca=7.5)
    mat_plasma_roxo = criar_mat_emissivo("Alien_PlasmaRoxo", (0.78, 0.22, 1.0), forca=6.0)

    raiz = bpy.data.objects.new("NaveInimiga", None)
    scene.collection.objects.link(raiz)

    bm_hull = bmesh.new()
    bm_placas = bmesh.new()
    bm_rubro = bmesh.new()
    bm_roxo = bmesh.new()

    # 1. Corpo central fusiforme agressivo
    def sec(y, wx, hz):
        return [(-wx, y, -hz * 0.55), (wx, y, -hz * 0.55), (wx * 1.25, y, 0.0), (wx * 0.85, y, hz), (-wx * 0.85, y, hz), (-wx * 1.25, y, 0.0)]

    hull_loft(bm_hull, [
        sec(-5.2, 0.45, 0.42),
        sec(-3.2, 1.45, 0.95),
        sec(-0.6, 2.25, 1.38),
        sec( 2.2, 2.05, 1.28),
        sec( 4.6, 1.35, 0.88),
    ])

    # 2. Duas mandíbulas frontais afiadas (pinças interdimensionais apontando p/ frente -Y)
    for s in (-1, 1):
        hull_loft(bm_hull, [
            [(s * 0.95, -2.4, -0.35), (s * 1.95, -2.4, -0.25), (s * 1.85, -2.4, 0.55), (s * 0.95, -2.4, 0.45)],
            [(s * 1.15, -5.0, -0.22), (s * 1.72, -5.0, -0.15), (s * 1.62, -5.0, 0.32), (s * 1.12, -5.0, 0.25)],
            [(s * 0.72, -7.2, -0.08), (s * 0.92, -7.2, -0.06), (s * 0.88, -7.2, 0.10), (s * 0.70, -7.2, 0.08)],
        ])
        # Lâmina energética carmesim interna na mandíbula
        caixa(bm_rubro, (s * 1.02, -4.8, 0.08), (0.10, 3.6, 0.16), rot=(0, 0, s * -0.08), bevel=0.02)

    # 3. Olho / Núcleo Dimensional Central incandescente (entre as mandíbulas!)
    bmesh.ops.create_icosphere(bm_rubro, subdivisions=3, radius=0.82, matrix=Matrix.Translation((0.0, -3.55, 0.12)))
    tubo(bm_roxo, (0.0, -3.55, 0.12), (0.0, -3.85, 0.12), 1.05, 0.95, segs=20)

    # 4. Quatro Asas em Foice (X-Scythe Wings) + 4 Canhões Pesados de Plasma
    for s in (-1, 1):
        for vz, ang_z, oz in [(1, 0.32, 0.45), (-1, -0.26, -0.22)]:
            p_in = [
                (s * 1.8, -1.5, oz - 0.16),
                (s * 1.8,  1.8, oz - 0.14),
                (s * 1.8,  1.8, oz + 0.16),
                (s * 1.8, -1.5, oz + 0.18),
            ]
            p_mid = [
                (s * 5.2, -0.8, oz + vz * 1.05 - 0.12),
                (s * 5.2,  2.4, oz + vz * 1.05 - 0.10),
                (s * 5.2,  2.4, oz + vz * 1.05 + 0.12),
                (s * 5.2, -0.8, oz + vz * 1.05 + 0.12),
            ]
            p_tip = [
                (s * 7.6, -2.8, oz + vz * 1.65 - 0.06),
                (s * 7.6, -0.4, oz + vz * 1.65 - 0.06),
                (s * 7.6, -0.4, oz + vz * 1.65 + 0.06),
                (s * 7.6, -2.8, oz + vz * 1.65 + 0.06),
            ]
            seq = [p_in, p_mid, p_tip] if s < 0 else [list(reversed(p_in)), list(reversed(p_mid)), list(reversed(p_tip))]
            hull_loft(bm_placas, seq)

            # Veio energético púrpura ao longo da asa
            caixa(bm_roxo, (s * 4.6, 0.2, oz + vz * 0.85), (4.6, 0.14, 0.22), rot=(0, -s * vz * 0.28, s * -0.18), bevel=0.02)

            # Canhão pesado de plasma na articulação da asa
            cx, cy, cz = s * 4.8, -1.25, oz + vz * 0.95
            tubo(bm_hull, (cx, cy + 0.8, cz), (cx, cy - 1.65, cz), 0.24, 0.16, segs=12)
            bmesh.ops.create_icosphere(bm_rubro, subdivisions=2, radius=0.19, matrix=Matrix.Translation((cx, cy - 1.72, cz)))

    # 5. Crista dorsal blindada + espinhos interdimensionais
    for k, (ky, alt_e) in enumerate([(-1.6, 1.35), (-0.2, 1.75), (1.3, 1.55), (2.7, 1.15)]):
        caixa(bm_placas, (0.0, ky, 1.25 + alt_e * 0.4), (0.36, 1.15, alt_e), rot=(-0.38, 0, 0), bevel=0.04)
        caixa(bm_roxo, (0.0, ky - 0.1, 1.35 + alt_e * 0.48), (0.12, 0.85, alt_e * 0.7), rot=(-0.38, 0, 0), bevel=0.015)

    # 6. Três Propulsores Traseiros de Vácuo
    for tx, tz, r_m in [(0.0, 0.25, 0.86), (-1.45, 0.05, 0.62), (1.45, 0.05, 0.62)]:
        tubo(bm_hull, (tx, 4.1, tz), (tx, 5.35, tz), r_m, r_m * 0.82, segs=20)
        tubo(bm_roxo, (tx, 5.20, tz), (tx, 5.42, tz), r_m * 0.68, r_m * 0.62, segs=18)

    criar_obj_bm("CascoObsidiana", bm_hull, mat_obsidiana, raiz)
    criar_obj_bm("AsasPlacas", bm_placas, mat_placa_roxa, raiz)
    criar_obj_bm("NucleoCanhoesRubro", bm_rubro, mat_nucleo, raiz, smooth=True, auto_uv=False)
    criar_obj_bm("VeiosPropulsorRoxo", bm_roxo, mat_plasma_roxo, raiz, smooth=True, auto_uv=False)

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

    # Prévia rápida Cycles
    world = bpy.data.worlds.new("Void")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.04, 0.03, 0.08, 1.0)

    for pos, energy, col in [((-12, -13, 9), 2600, (1.0, 0.85, 0.95)), ((12, -8, 6), 1400, (0.65, 0.45, 1.0)), ((0, 14, 8), 1600, (1.0, 0.35, 0.55))]:
        ld = bpy.data.lights.new("L", type='AREA')
        ld.energy = energy
        ld.size = 8.0
        ld.color = col
        lo = bpy.data.objects.new("L", ld)
        scene.collection.objects.link(lo)
        lo.location = pos
        lo.rotation_euler = (Vector((0, 0, 0)) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()

    cd = bpy.data.cameras.new("Cam")
    cd.lens = 40
    co = bpy.data.objects.new("Cam", cd)
    scene.collection.objects.link(co)
    scene.camera = co
    co.location = (-11.5, -12.5, 6.2)
    co.rotation_euler = (Vector((0, -0.8, 0.2)) - co.location).to_track_quat('-Z', 'Y').to_euler()

    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 24
    scene.cycles.use_denoising = False
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.filepath = OUT_PREV
    bpy.ops.render.render(write_still=True)
    print("Prévia salva:", OUT_PREV)


if __name__ == "__main__":
    gerar_nave_inimiga()
