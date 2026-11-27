"""LUA no Blender: monta o terreno (alturas e texturas de gerar_terreno.py), o horizonte com montanhas, as rochas,
a Terra no céu e o Sol rasante, exporta os GLB do jogo e renderiza prévias em Cycles.
Uso: blender -b -P criar_lua.py -- [--glb pasta] [--render pasta] [--amostras 64] [--vistas chao,alto,cratera]
Coordenadas: Three (x, y, z) = Blender (x, -y, z) → no glTF a altura é y e o "sul" da imagem (+z) é Blender -y."""
import bpy, bmesh, sys, os, json, math, random
import numpy as np
from mathutils import Vector, noise

AQUI = os.path.dirname(os.path.abspath(__file__)); G = os.path.join(AQUI, 'gerado')
arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def opc(n, p=None): return arg[arg.index('--' + n) + 1] if '--' + n in arg else p
SAIDA_GLB, SAIDA_R, AMOSTRAS = opc('glb', AQUI), opc('render'), int(opc('amostras', 64))
VISTAS = opc('vistas', 'chao,alto,cratera').split(',')
META = json.load(open(os.path.join(G, 'rochas.json'))); L, NJ = META['L'], META['n']
HJ = np.fromfile(os.path.join(G, 'altura_jogo.bin'), dtype=np.float32).reshape(NJ, NJ)

bpy.ops.wm.read_factory_settings(use_empty=True)
cena = bpy.context.scene

def altura(x, z):
    """altura (Three) por bilinear na malha do jogo; fora do quadrado, a da borda"""
    fx = np.clip((np.asarray(x) + L / 2) / L * (NJ - 1), 0, NJ - 1.001); fz = np.clip((np.asarray(z) + L / 2) / L * (NJ - 1), 0, NJ - 1.001)
    j, i = np.floor(fx).astype(int), np.floor(fz).astype(int); a, b = fx - j, fz - i
    return HJ[i, j] * (1 - a) * (1 - b) + HJ[i, j + 1] * a * (1 - b) + HJ[i + 1, j] * (1 - a) * b + HJ[i + 1, j + 1] * a * b

def malha(nome, verts, faces, uvs=None, cores=None):
    me = bpy.data.meshes.new(nome); me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces]); me.update()
    if uvs is not None:
        uv = me.uv_layers.new(name='UVMap'); idx = np.zeros(len(me.loops), dtype=int); me.loops.foreach_get('vertex_index', idx)
        uv.data.foreach_set('uv', uvs[idx].astype(np.float32).ravel())
    if cores is not None:
        ca = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT'); ca.data.foreach_set('color', cores.astype(np.float32).ravel())
    me.shade_smooth() if hasattr(me, 'shade_smooth') else [setattr(p, 'use_smooth', True) for p in me.polygons]
    ob = bpy.data.objects.new(nome, me); cena.collection.objects.link(ob); return ob

def grade_faces(nr, nc, fecha=False):
    f = []
    for i in range(nr - 1):
        for j in range(nc - (0 if fecha else 1)):
            j2 = (j + 1) % nc; a, b, c, d = i * nc + j, i * nc + j2, (i + 1) * nc + j2, (i + 1) * nc + j
            f.append((a, d, c, b))
    return f

def imagem(arq, nao_cor=False):
    im = bpy.data.images.load(os.path.join(G, arq) if not os.path.isabs(arq) else arq)
    if nao_cor: im.colorspace_settings.name = 'Non-Color'
    return im

# ------------------------------------------------------------------------------------------- regolito
def mat_regolito():
    m = bpy.data.materials.new('LuaRegolito'); m.use_nodes = True; nt = m.node_tree; N_ = nt.nodes; Lk = nt.links
    bsdf = N_['Principled BSDF']; bsdf.inputs['Roughness'].default_value = 0.95
    bsdf.inputs['Specular IOR Level'].default_value = 0.15
    tc = N_.new('ShaderNodeTexImage'); tc.image = imagem('albedo.png'); tc.extension = 'MIRROR'; tc.name = 'Albedo'; Lk.new(tc.outputs['Color'], bsdf.inputs['Base Color'])
    tn = N_.new('ShaderNodeTexImage'); tn.image = imagem('normal.png', True); tn.extension = 'MIRROR'; nm_ = tn
    nm = N_.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 1.0
    Lk.new(tn.outputs['Color'], nm.inputs['Color']); Lk.new(nm.outputs['Normal'], bsdf.inputs['Normal']); nm.name = 'NormalTerreno'
    return m
REG = mat_regolito()

# ------------------------------------------------------------------------------------------- terreno jogável (800 m, 2,5 m)
c = np.linspace(-L / 2, L / 2, NJ); XX, ZZ = np.meshgrid(c, c)
V = np.stack([XX.ravel(), -ZZ.ravel(), HJ.ravel()], 1)
UV = np.stack([(XX.ravel() + L / 2) / L, 1 - (ZZ.ravel() + L / 2) / L], 1)
ter = malha('LuaTerreno', V, grade_faces(NJ, NJ), UV); ter.data.materials.append(REG)

# ------------------------------------------------------------------------------------------- horizonte: anel até 6 km com montanhas (terras altas ao longe)
def mont(x, z):
    h = np.zeros_like(x)
    for k, (esc, amp) in enumerate([(1800, 140), (700, 60), (260, 18), (90, 5)]):
        h += amp * np.array([noise.noise(Vector((a / esc + 17 * k, b / esc - 5 * k, 0.3 * k))) for a, b in zip(x, z)])
    return h
NA, NR = 512, 110
rr = 380 + (6000 - 380) * (np.linspace(0, 1, NR) ** 2.2); aa = np.linspace(0, 2 * np.pi, NA, endpoint=False)
RA, AA = np.meshgrid(rr, aa, indexing='ij'); hx, hz = RA * np.cos(AA), RA * np.sin(AA)
k = np.clip((RA - 560) / 1400, 0, 1); k = k * k * (3 - 2 * k)
dentro = (np.abs(hx) < L / 2 - 2) & (np.abs(hz) < L / 2 - 2)
hb = altura(hx, hz)
# perto (até ~1,5 km): continua o chão ondulado; longe: colinas e, no fim, a serra (terras altas) de até ~350 m
km_ = np.clip((RA - 1400) / 3800, 0, 1) ** 1.5
hm = mont(hx.ravel(), hz.ravel()).reshape(hx.shape) * (0.04 + 0.96 * km_) + 260 * km_
hh = hb * (1 - k) + (hb * 0.3 + hm) * k
hh = np.where(dentro, hb - 1.5, hh)                                                  # embaixo do terreno jogável (escondido)
Vh = np.stack([hx.ravel(), -hz.ravel(), hh.ravel()], 1)
alb = 0.13 + 0.03 * np.tanh(hm.ravel() / 60)
cores = np.stack([alb, alb, alb * 0.98, np.ones_like(alb)], 1)
UVh = np.stack([(hx.ravel() + L / 2) / L, 1 - (hz.ravel() + L / 2) / L], 1)
hor = malha('LuaHorizonte', Vh, grade_faces(NR, NA, fecha=True), UVh)
hor.data.materials.append(REG)

# ------------------------------------------------------------------------------------------- rochas (6 formas, ~250 faces cada)
def rocha(i):
    rnd = random.Random(40 + i)
    random.seed(40 + i)
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=3, radius=1.0)
    esc = Vector((rnd.uniform(0.8, 1.3), rnd.uniform(0.7, 1.2), rnd.uniform(0.45, 0.85))); sem = Vector((rnd.random() * 9, rnd.random() * 9, rnd.random() * 9))
    for v in bm.verts:
        p = v.co.copy(); d = 1 + 0.28 * noise.noise(p * 1.3 + sem) + 0.10 * noise.noise(p * 3.7 + sem) + 0.04 * noise.noise(p * 9 + sem)
        d += 0.07 * abs(noise.noise(p * 2.2 + sem * 2))                                  # arestas de lasca (ruído "crista")
        v.co = Vector((p.x * esc.x, p.y * esc.y, p.z * esc.z)) * d
        if v.co.z < -0.25 * esc.z: v.co.z = -0.25 * esc.z                              # base achatada (assenta no chão)
    me = bpy.data.meshes.new(f'Rocha{i}'); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(f'Rocha{i}', me); cena.collection.objects.link(ob)
    dm = ob.modifiers.new('dec', 'DECIMATE'); dm.ratio = 0.5
    bpy.context.view_layer.objects.active = ob; ob.select_set(True); bpy.ops.object.modifier_apply(modifier='dec'); ob.select_set(False)
    for p in me.polygons: p.use_smooth = True
    me.materials.append(mat_rocha); return ob
mat_rocha = bpy.data.materials.new('LuaRocha'); mat_rocha.use_nodes = True
br = mat_rocha.node_tree.nodes['Principled BSDF']; br.inputs['Base Color'].default_value = (0.115, 0.112, 0.108, 1); br.inputs['Roughness'].default_value = 0.9
nz = mat_rocha.node_tree.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 6; nz.inputs['Detail'].default_value = 8
bump = mat_rocha.node_tree.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.35
mat_rocha.node_tree.links.new(nz.outputs['Fac'], bump.inputs['Height']); mat_rocha.node_tree.links.new(bump.outputs['Normal'], br.inputs['Normal'])
ROCHAS = [rocha(i) for i in range(6)]
for i, r in enumerate(ROCHAS): r.location = (i * 3 - 7.5, 0, -200)                     # guardadas longe (só os modelos)

# ------------------------------------------------------------------------------------------- exportar
def exportar(objs, arq):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(SAIDA_GLB, arq), use_selection=True, export_format='GLB', export_image_format='JPEG',
                              export_jpeg_quality=88, export_apply=True, export_yup=True, export_texcoords=True, export_normals=True)
    print('GLB', arq, round(os.path.getsize(os.path.join(SAIDA_GLB, arq)) / 1e6, 2), 'MB')
loc = [r.location.copy() for r in ROCHAS]
for r in ROCHAS: r.location = (0, 0, 0)
exportar(ROCHAS, 'lua_rochas.glb')
for r, l_ in zip(ROCHAS, loc): r.location = l_
exportar([ter, hor], 'lua_terreno.glb')

# ------------------------------------------------------------------------------------------- prévias (Cycles): rochas espalhadas, Terra, Sol rasante, céu preto
if SAIDA_R:
    os.makedirs(SAIDA_R, exist_ok=True)
    nt = REG.node_tree; N_ = nt.nodes
    tco = N_.new('ShaderNodeTexCoord'); mp = N_.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (L / 4, L / 4, 1)
    td = N_.new('ShaderNodeTexImage'); td.image = imagem('detalhe_normal.png', True)
    nd = N_.new('ShaderNodeNormalMap'); nd.inputs['Strength'].default_value = 0.8
    nt.links.new(tco.outputs['UV'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], td.inputs['Vector']); nt.links.new(td.outputs['Color'], nd.inputs['Color'])
    soma = N_.new('ShaderNodeVectorMath'); soma.operation = 'ADD'; un = N_.new('ShaderNodeVectorMath'); un.operation = 'NORMALIZE'
    nt.links.new(N_['NormalTerreno'].outputs['Normal'], soma.inputs[0]); nt.links.new(nd.outputs['Normal'], soma.inputs[1]); nt.links.new(soma.outputs['Vector'], un.inputs[0])
    nt.links.new(un.outputs['Vector'], N_['Principled BSDF'].inputs['Normal'])
    col = bpy.data.collections.new('RochasCena'); cena.collection.children.link(col)
    for x, z, s, rot, var in META['rochas']:
        o = bpy.data.objects.new('r', ROCHAS[var].data); col.objects.link(o)
        o.location = (x, -z, float(altura(x, z)) - 0.12 * s); o.scale = (s, s, s); o.rotation_euler = (0, 0, rot)
    w = bpy.data.worlds.new('Espaco'); cena.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Color'].default_value = (0, 0, 0, 1)
    sol = bpy.data.objects.new('Sol', bpy.data.lights.new('Sol', 'SUN')); cena.collection.objects.link(sol)
    sol.data.energy = 5.0; sol.data.angle = math.radians(0.53); sol.data.color = (1.0, 0.98, 0.95)
    sol.rotation_euler = (math.radians(90 - 18), 0, math.radians(-75))                   # 18° acima do horizonte, de lado: sombras compridas
    # a Terra (~2° no céu), textura da NASA (Blue Marble, domínio público), lado iluminado pelo mesmo Sol
    tm = bpy.data.materials.new('Terra'); tm.use_nodes = True; tb = tm.node_tree.nodes['Principled BSDF']
    ti = tm.node_tree.nodes.new('ShaderNodeTexImage'); ti.image = imagem(os.path.join(AQUI, 'terra.jpg')); tm.node_tree.links.new(ti.outputs['Color'], tb.inputs['Base Color'])
    tb.inputs['Roughness'].default_value = 0.6
    bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=48, radius=85, location=(3400, 3700, 1060)); terra = bpy.context.object
    terra.data.materials.append(tm); terra.rotation_euler = (0.4, 0, 2.2); bpy.ops.object.shade_smooth()
    cena.render.engine = 'CYCLES'; cena.cycles.device = 'CPU'; cena.cycles.samples = AMOSTRAS; cena.cycles.use_denoising = True
    cena.render.resolution_x, cena.render.resolution_y = 1600, 900
    cena.view_settings.view_transform = 'AgX'; cena.view_settings.exposure = 0.4
    cam = bpy.data.objects.new('Cam', bpy.data.cameras.new('Cam')); cena.collection.objects.link(cam); cena.camera = cam
    def olhar(p, a, lente=28):
        cam.location = Vector(p); cam.rotation_euler = (Vector(a) - Vector(p)).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = lente; cam.data.clip_end = 20000
    T = lambda x, y, z: (x, -z, y)                                                       # Three → Blender
    vistas = {
        'chao': (T(-6, float(altura(-6, 12)) + 1.7, 12), T(60, float(altura(60, -60)) + 4, -60), 24),          # olho do astronauta no pouso
        'alto': (T(-260, 160, 260), T(60, -10, -40), 30),                                                    # de cima, a área toda
        'cratera': (T(40, float(altura(40, -20)) + 3, -20), T(140, -15, -100), 20),                           # da borda da cratera grande
    }
    for nome in VISTAS:
        p, a, lente = vistas[nome]; olhar(p, a, lente)
        cena.render.filepath = os.path.join(SAIDA_R, f'lua_{nome}.png'); bpy.ops.render.render(write_still=True); print('render', nome)
    if opc('blend'): bpy.ops.wm.save_as_mainfile(filepath=opc('blend'))
