"""
Gera em Blender 4.0.2 os modelos 3D realistas da Missão Marte:
1) Planeta Marte cinematográfico (marte.glb): esfera 96x64 com textura equiretangular 2048x1024
   (desertos ferrugem-ocre, planícies basálticas escuras, Valles Marineris, Olympus Mons,
   crateras orgânicas, nuvens tênues de poeira/gelo e calotas polares brancas) + Normal Map
   em espaço tangente REAL (compatível 100% com glTF 2.0 e Three.js!).
2) 3 Asteroides espaciais esculpidos em alta definição (asteroide_1/2/3.glb) com crateras
   profundas, textura rochosa de basalto/ferro 512x512 + Normal Map tangente empacotado.
Renderiza prévia de estúdio em marte_asteroides_previa.png.
"""
import math
import os
import bpy
import bmesh
import numpy as np
from mathutils import Vector

ROOT = "/home/antigravity/HROSONE/MENTORIA-JARVIS"
OUT_DIR = os.path.join(ROOT, "videos/biblioteca3d/cenarios/marte")
OUT_PREV = "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/3f0a27bc-cfc6-4516-9690-dfa0fef93d50/marte_asteroides_previa.png"
os.makedirs(OUT_DIR, exist_ok=True)


def limpar_cena():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def fbm_esferico(x, y, z, oitavas=6, seed=17):
    """Ruído 3D contínuo na esfera (sem costuras) com alta riqueza de detalhes."""
    rng = np.random.default_rng(seed)
    acc = np.zeros_like(x, dtype=np.float32)
    amp = 0.55
    freq = 1.9
    for _ in range(oitavas):
        dirs = rng.normal(size=(6, 3)).astype(np.float32)
        dirs /= np.linalg.norm(dirs, axis=1, keepdims=True)
        fases = rng.uniform(0, 2 * np.pi, size=6).astype(np.float32)
        camada = np.zeros_like(x, dtype=np.float32)
        for d, ph in zip(dirs, fases):
            camada += np.sin((x * d[0] + y * d[1] + z * d[2]) * freq + ph)
        acc += (camada / 6.0) * amp
        freq *= 2.12
        amp *= 0.53
    return acc


def altura_para_normal_tangente(alt, forca=3.2):
    """Converte mapa de altura 2D (H, W) em Normal Map RGB em espaço tangente (Z azul=255)."""
    # Gradientes com wrap horizontal (planeta contínuo)
    gx = (np.roll(alt, -1, axis=1) - np.roll(alt, 1, axis=1)) * 0.5 * forca
    gy = (np.roll(alt, -1, axis=0) - np.roll(alt, 1, axis=0)) * 0.5 * forca
    nx = -gx
    ny = -gy
    nz = np.ones_like(alt, dtype=np.float32)
    norm = np.sqrt(nx * nx + ny * ny + nz * nz) + 1e-6
    out = np.ones((*alt.shape, 4), dtype=np.float32)
    out[..., 0] = np.clip(nx / norm * 0.5 + 0.5, 0.0, 1.0)
    out[..., 1] = np.clip(ny / norm * 0.5 + 0.5, 0.0, 1.0)
    out[..., 2] = np.clip(nz / norm * 0.5 + 0.5, 0.0, 1.0)
    return out


def salvar_img(nome, rgba, caminho, srgb=True):
    h, w, _ = rgba.shape
    img = bpy.data.images.new(nome, width=w, height=h, alpha=False)
    img.colorspace_settings.name = 'sRGB' if srgb else 'Non-Color'
    img.pixels[:] = rgba.ravel()
    img.filepath_raw = caminho
    img.file_format = 'PNG'
    img.save()
    return caminho


def gerar_texturas_marte():
    """Gera Albedo 2048x1024 fotorealista + Normal Map tangente de Marte."""
    W, H = 2048, 1024
    u = np.linspace(0.0, 1.0, W, endpoint=False, dtype=np.float32)
    v = np.linspace(0.0, 1.0, H, endpoint=False, dtype=np.float32)
    uu, vv = np.meshgrid(u, v)
    lon = (uu - 0.5) * 2.0 * np.pi
    lat = (vv - 0.5) * np.pi
    clat = np.cos(lat)
    sx = clat * np.cos(lon)
    sy = np.sin(lat)
    sz = clat * np.sin(lon)

    # 1. Macro-geologia marciana (terras altas ocre x mares basálticos escuros + micro-granulação)
    macro = fbm_esferico(sx, sy, sz, oitavas=6, seed=42)
    medio = fbm_esferico(sx * 3.4, sy * 3.4, sz * 3.4, oitavas=5, seed=108)
    fino = fbm_esferico(sx * 12.5, sy * 12.5, sz * 12.5, oitavas=4, seed=303)
    poeira = fbm_esferico(sx * 2.2 + 0.5, sy * 2.2, sz * 2.2 - 0.4, oitavas=5, seed=555)

    alt = np.clip(0.50 + macro * 0.40 + medio * 0.16 + fino * 0.07, 0.0, 1.0)

    # 2. Valles Marineris: cânion equatorial orgânico com ramificações sutis
    c_lat = -0.13 + 0.055 * np.sin(lon * 3.8) + 0.045 * medio
    d_canion = np.abs(lat - c_lat)
    masc_lon = np.exp(-((lon - 0.05) / 0.56) ** 4)
    canyon = np.exp(-((d_canion / (0.026 + 0.014 * np.clip(fino + 0.5, 0, 1))) ** 2)) * masc_lon
    alt = np.clip(alt - canyon * 0.34, 0.0, 1.0)

    # 3. Olympus Mons + cadeia vulcânica de Tharsis
    for (vlon, vlat, vr, vh) in [(-1.18, 0.28, 0.13, 0.24), (-0.82, 0.06, 0.09, 0.17), (-0.68, -0.10, 0.08, 0.15)]:
        dv = np.sqrt(((lon - vlon) * clat) ** 2 + (lat - vlat) ** 2)
        cone = np.clip(1.0 - dv / vr, 0.0, 1.0) ** 1.7
        caldeira = np.exp(-((dv / (vr * 0.15)) ** 2)) * 0.09
        alt = np.clip(alt + cone * vh - caldeira, 0.0, 1.0)

    # 4. Crateras naturais sutis (mais fortes no relevo normal que no albedo!)
    alt_crateras = np.zeros_like(alt)
    rng = np.random.default_rng(777)
    for _ in range(160):
        p = rng.normal(size=3).astype(np.float32)
        p /= np.linalg.norm(p)
        ang = np.arccos(np.clip(sx * p[0] + sy * p[1] + sz * p[2], -1.0, 1.0))
        rc = rng.uniform(0.012, 0.052)
        d = ang / rc
        dep = np.where(d < 1.0, -(1.0 - d * d) * 0.10, 0.0)
        borda = np.exp(-((d - 1.03) / 0.14) ** 2) * 0.048
        alt_crateras += dep + borda
    alt_relevo = np.clip(alt + alt_crateras * 0.85, 0.0, 1.0)
    alt_cor = np.clip(alt + alt_crateras * 0.30, 0.0, 1.0)

    # 5. Paleta NASA real de Marte (basalto escuro -> ferrugem rico -> ocre dourado -> planaltos poeirentos)
    c_basalto = np.array([0.28, 0.12, 0.07], dtype=np.float32)
    c_ferrugem = np.array([0.65, 0.24, 0.11], dtype=np.float32)
    c_ocre = np.array([0.84, 0.44, 0.21], dtype=np.float32)
    c_areia = np.array([0.93, 0.64, 0.42], dtype=np.float32)

    t1 = np.clip((alt_cor - 0.20) / 0.28, 0.0, 1.0)[..., None]
    t2 = np.clip((alt_cor - 0.44) / 0.26, 0.0, 1.0)[..., None]
    t3 = np.clip((alt_cor - 0.68) / 0.24, 0.0, 1.0)[..., None]

    rgb = c_basalto * (1 - t1) + c_ferrugem * t1
    rgb = rgb * (1 - t2) + c_ocre * t2
    rgb = rgb * (1 - t3) + c_areia * t3

    # Sombreamento orgânico do Valles Marineris + variação de poeira eólica
    rgb *= (1.0 - canyon[..., None] * 0.44)
    rgb *= (0.90 + 0.16 * np.clip(poeira + 0.5, 0.0, 1.0)[..., None])

    # 6. Nuvens cirrus tênues de gelo/poeira marciana (dão vida e escala planetária!)
    nuvem = np.clip((fbm_esferico(sx * 2.5, sy * 4.2, sz * 2.5, oitavas=4, seed=909) - 0.28) / 0.35, 0.0, 1.0)
    nuvem *= (0.35 + 0.65 * np.abs(np.sin(lat * 1.4))) * 0.26
    rgb = rgb * (1.0 - nuvem[..., None]) + np.array([0.98, 0.88, 0.78], dtype=np.float32) * nuvem[..., None]

    # 7. Calotas polares brancas (menores e bem orgânicas como fotos reais de Marte!)
    polo_n = np.clip((lat - (1.35 + 0.06 * medio)) / 0.055, 0.0, 1.0)
    polo_s = np.clip((-lat - (1.40 + 0.05 * medio)) / 0.045, 0.0, 1.0)
    gelo = np.clip(polo_n + polo_s, 0.0, 1.0)[..., None]
    rgb = rgb * (1.0 - gelo) + np.array([0.95, 0.96, 0.98], dtype=np.float32) * gelo

    rgba_a = np.ones((H, W, 4), dtype=np.float32)
    rgba_a[..., :3] = np.clip(rgb, 0.0, 1.0)
    alb_path = salvar_img("MarteAlbedo", rgba_a, os.path.join(OUT_DIR, "marte_albedo.png"), srgb=True)

    rgba_n = altura_para_normal_tangente(alt_relevo, forca=5.5)
    norm_path = salvar_img("MarteNormal", rgba_n, os.path.join(OUT_DIR, "marte_normal.png"), srgb=False)
    return alb_path, norm_path


def gerar_marte_glb(alb_path, norm_path):
    limpar_cena()
    bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=64, radius=1.0, location=(0, 0, 0))
    marte = bpy.context.active_object
    marte.name = "PlanetaMarte"
    for p in marte.data.polygons:
        p.use_smooth = True

    mat = bpy.data.materials.new("Mat_Marte")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes, links = nt.nodes, nt.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = 0.88
    bsdf.inputs["Metallic"].default_value = 0.0

    tex_a = nodes.new("ShaderNodeTexImage")
    tex_a.image = bpy.data.images.load(alb_path)
    tex_a.image.colorspace_settings.name = 'sRGB'

    tex_n = nodes.new("ShaderNodeTexImage")
    tex_n.image = bpy.data.images.load(norm_path)
    tex_n.image.colorspace_settings.name = 'Non-Color'

    nmap = nodes.new("ShaderNodeNormalMap")
    nmap.inputs["Strength"].default_value = 0.75

    links.new(tex_a.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(tex_n.outputs["Color"], nmap.inputs["Color"])
    links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])

    marte.data.materials.append(mat)
    out_glb = os.path.join(OUT_DIR, "marte.glb")
    bpy.ops.export_scene.gltf(
        filepath=out_glb,
        export_format='GLB',
        export_yup=True,
        export_materials='EXPORT',
        export_image_format='JPEG',
        export_jpeg_quality=90,
    )
    print(f"GLB Marte exportado: {out_glb} ({os.path.getsize(out_glb) / 1024:.1f} KB)")
    return out_glb


def gerar_texturas_asteroide(idx, seed, cor_esc, cor_clara, cor_ferro):
    W, H = 512, 256
    u = np.linspace(0.0, 1.0, W, endpoint=False, dtype=np.float32)
    v = np.linspace(0.0, 1.0, H, endpoint=False, dtype=np.float32)
    uu, vv = np.meshgrid(u, v)
    lon = (uu - 0.5) * 2.0 * np.pi
    lat = (vv - 0.5) * np.pi
    clat = np.cos(lat)
    sx, sy, sz = clat * np.cos(lon), np.sin(lat), clat * np.sin(lon)

    ruido = fbm_esferico(sx * 2.8, sy * 2.8, sz * 2.8, oitavas=5, seed=seed)
    grit = fbm_esferico(sx * 11.0, sy * 11.0, sz * 11.0, oitavas=3, seed=seed + 55)
    alt = np.clip(0.5 + ruido * 0.38 + grit * 0.14, 0.0, 1.0)

    t = np.clip((alt - 0.22) / 0.58, 0.0, 1.0)[..., None]
    veio = np.clip((fbm_esferico(sx * 5.0, sy * 5.0, sz * 5.0, oitavas=3, seed=seed + 99) - 0.15) / 0.45, 0.0, 1.0)[..., None]

    rgb = np.array(cor_esc, dtype=np.float32) * (1 - t) + np.array(cor_clara, dtype=np.float32) * t
    rgb = rgb * (1 - veio * 0.45) + np.array(cor_ferro, dtype=np.float32) * (veio * 0.45)

    rgba_a = np.ones((H, W, 4), dtype=np.float32)
    rgba_a[..., :3] = np.clip(rgb, 0.0, 1.0)
    alb = salvar_img(f"AstAlb{idx}", rgba_a, os.path.join(OUT_DIR, f"ast_{idx}_alb.png"), srgb=True)
    nrm = salvar_img(f"AstNrm{idx}", altura_para_normal_tangente(alt, forca=4.5), os.path.join(OUT_DIR, f"ast_{idx}_nrm.png"), srgb=False)
    return alb, nrm


def gerar_asteroide(idx, seed, escala_xyz, cor_esc, cor_clara, cor_ferro):
    limpar_cena()
    alb_path, nrm_path = gerar_texturas_asteroide(idx, seed, cor_esc, cor_clara, cor_ferro)
    rng = np.random.default_rng(seed)

    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=4, radius=1.0)

    crateras = []
    for _ in range(12):
        d = rng.normal(size=3)
        d /= np.linalg.norm(d)
        crateras.append((Vector(d), rng.uniform(0.24, 0.54), rng.uniform(0.11, 0.22)))

    ondas = []
    for _ in range(9):
        d = rng.normal(size=3)
        d /= np.linalg.norm(d)
        ondas.append((Vector(d), rng.uniform(1.8, 5.8), rng.uniform(0, 6.28), rng.uniform(0.04, 0.13)))

    uv_layer = bm.loops.layers.uv.new("UVMap")
    for v in bm.verts:
        n = v.co.normalized()
        r = 1.0
        for d, freq, ph, amp in ondas:
            r += math.sin(n.dot(d) * freq + ph) * amp
        r += 0.045 * abs(math.sin(n.x * 8.1 + seed) * math.cos(n.y * 7.3 - seed))
        for cdir, cr, depth in crateras:
            ang = math.acos(max(-1.0, min(1.0, n.dot(cdir))))
            t = ang / cr
            if t < 1.0:
                r -= (1.0 - t * t) * depth
            elif t < 1.24:
                r += math.sin(((t - 1.0) / 0.24) * math.pi) * depth * 0.25
        v.co = Vector((n.x * r * escala_xyz[0], n.y * r * escala_xyz[1], n.z * r * escala_xyz[2]))

    # UVs esféricas limpas para a textura rochosa + normal map
    for f in bm.faces:
        for loop in f.loops:
            n = loop.vert.co.normalized()
            uu = math.atan2(n.z, n.x) / (2.0 * math.pi) + 0.5
            vv = math.asin(max(-1.0, min(1.0, n.y))) / math.pi + 0.5
            loop[uv_layer].uv = (uu, vv)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(f"Asteroide_{idx}")
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new(f"Asteroide_{idx}", mesh)
    bpy.context.scene.collection.objects.link(obj)

    mat = bpy.data.materials.new(f"Mat_Asteroide_{idx}")
    mat.use_nodes = True
    nt = mat.node_tree
    nodes, links = nt.nodes, nt.links
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = 0.88
    bsdf.inputs["Metallic"].default_value = 0.16

    ta = nodes.new("ShaderNodeTexImage"); ta.image = bpy.data.images.load(alb_path); ta.image.colorspace_settings.name = 'sRGB'
    tn = nodes.new("ShaderNodeTexImage"); tn.image = bpy.data.images.load(nrm_path); tn.image.colorspace_settings.name = 'Non-Color'
    nm = nodes.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = 0.9
    links.new(ta.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(tn.outputs["Color"], nm.inputs["Color"])
    links.new(nm.outputs["Normal"], bsdf.inputs["Normal"])
    obj.data.materials.append(mat)

    out_glb = os.path.join(OUT_DIR, f"asteroide_{idx}.glb")
    bpy.ops.export_scene.gltf(
        filepath=out_glb,
        export_format='GLB',
        export_yup=True,
        export_materials='EXPORT',
        export_image_format='JPEG',
        export_jpeg_quality=85,
    )
    # Remove PNGs intermediários dos asteroides (já empacotados dentro do GLB!)
    for p in (alb_path, nrm_path):
        try:
            os.remove(p)
        except OSError:
            pass
    print(f"GLB Asteroide {idx} exportado: {out_glb} ({os.path.getsize(out_glb) / 1024:.1f} KB)")
    return out_glb


def renderizar_previa(marte_glb, ast_glbs):
    limpar_cena()
    scene = bpy.context.scene
    world = bpy.data.worlds.new("Espaco")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.004, 0.006, 0.014, 1.0)
    world.node_tree.nodes["Background"].inputs[1].default_value = 1.0

    bpy.ops.import_scene.gltf(filepath=marte_glb)
    marte = [o for o in bpy.context.selected_objects if o.type == 'MESH'][0]
    marte.location = (1.55, 1.8, 0.1)
    marte.scale = (2.35, 2.35, 2.35)
    marte.rotation_euler = (0.18, 0.08, -0.45)

    pos_ast = [(-2.4, -1.6, 0.85, 0.56), (-1.5, -2.0, -0.58, 0.46), (-3.0, -0.9, -0.82, 0.52)]
    for glb, (ax, ay, az, sc) in zip(ast_glbs, pos_ast):
        bpy.ops.import_scene.gltf(filepath=glb)
        a = [o for o in bpy.context.selected_objects if o.type == 'MESH'][0]
        a.location = (ax, ay, az)
        a.scale = (sc, sc, sc)

    # Sol espacial quente iluminando o hemisfério frontal-esquerdo de Marte e os asteroides!
    sdata = bpy.data.lights.new("Sol", type='SUN')
    sdata.energy = 4.6
    sdata.color = (1.0, 0.94, 0.86)
    sobj = bpy.data.objects.new("Sol", sdata)
    scene.collection.objects.link(sobj)
    sobj.rotation_euler = (1.15, 0.25, -0.65)

    fdata = bpy.data.lights.new("Fill", type='AREA')
    fdata.energy = 140
    fdata.color = (0.45, 0.65, 1.0)
    fobj = bpy.data.objects.new("Fill", fdata)
    scene.collection.objects.link(fobj)
    fobj.location = (-6, -6, 3)

    cam_d = bpy.data.cameras.new("Cam")
    cam_d.lens = 38
    cam = bpy.data.objects.new("Cam", cam_d)
    scene.collection.objects.link(cam)
    cam.location = (-0.4, -7.2, 0.35)
    cam.rotation_euler = (Vector((0.0, 0.0, 0.0)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam

    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 28
    scene.cycles.use_denoising = False
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.filepath = OUT_PREV
    bpy.ops.render.render(write_still=True)
    print("Prévia Marte + Asteroides salva:", OUT_PREV)


if __name__ == "__main__":
    alb, nrm = gerar_texturas_marte()
    m_glb = gerar_marte_glb(alb, nrm)
    # Remove PNGs grandes de Marte fora do GLB (já empacotados em JPEG dentro de marte.glb!)
    for p in (alb, nrm):
        try:
            os.remove(p)
        except OSError:
            pass
    a1 = gerar_asteroide(1, 101, (1.16, 0.88, 0.94), (0.14, 0.12, 0.11), (0.38, 0.33, 0.29), (0.58, 0.28, 0.14))
    a2 = gerar_asteroide(2, 202, (1.36, 0.78, 0.82), (0.12, 0.12, 0.14), (0.34, 0.32, 0.33), (0.48, 0.32, 0.20))
    a3 = gerar_asteroide(3, 303, (0.94, 1.18, 0.86), (0.16, 0.12, 0.10), (0.42, 0.33, 0.26), (0.64, 0.30, 0.14))
    renderizar_previa(m_glb, [a1, a2, a3])
