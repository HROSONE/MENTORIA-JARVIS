# SELVA COM LAGO E ROCHAS para o T. rex (Blender + Cycles), toda feita com assets CC0 do Poly Haven (biblioteca3d/polyhaven, LISTA.md):
# terreno com clareira e bacia do lago, margem de lama, água turva com reflexo, paredão de rocha do outro lado, árvores grandes em volta,
# sub-bosque denso (samambaias gigantes, antúrios, calatheas, arbustos), rochas com musgo, troncos e raízes; céu de floresta (HDRI) e névoa leve.
# O T. rex vem pronto de animais/trex/criar_trex.py --blend (fica na origem, olhando para +X).
#
# uso: blender -b --python criar_selva.py -- --trex trex.blend --previa selva.png [--cams ataque,lago,aerea] [--amostras 64] [--larg 1200] [--nevoa 0.006]
import bpy, bmesh, math, os, sys
import numpy as np
from mathutils import Vector

A = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(n, d=None): return A[A.index('--' + n) + 1] if '--' + n in A else d
PH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'polyhaven')
TREX, PREVIA, CAMS = arg('trex'), arg('previa'), arg('cams', 'ataque,lago,aerea')
AMOSTRAS, LARG, NEVOA = int(arg('amostras', 64)), int(arg('larg', 1200)), float(arg('nevoa', 0.006))
rng = np.random.default_rng(int(arg('semente', 11)))

bpy.ops.wm.read_factory_settings(use_empty=True)
cena = bpy.context.scene

# ------------------------------------------------------------------------------------------------ terreno
LAGO_C, LAGO_R = np.array([1.0, 14.0]), np.array([13.0, 8.5])          # elipse do lago (centro e raios em x, y)
NIVEL_AGUA = -0.35
def _hash(ix, iy, sem):
    h = (ix * 73856093) ^ (iy * 19349663) ^ (sem * 83492791); h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) & 0xFFFF) / 65535.0
def ruido2(x, y, f, sem):
    X, Y = x * f, y * f; i, j = np.floor(X).astype(np.int64), np.floor(Y).astype(np.int64); u, v = X - i, Y - j; u, v = u * u * (3 - 2 * u), v * v * (3 - 2 * v)
    return ((_hash(i, j, sem) * (1 - u) + _hash(i + 1, j, sem) * u) * (1 - v) + (_hash(i, j + 1, sem) * (1 - u) + _hash(i + 1, j + 1, sem) * u) * v) * 2 - 1
def fbm2(x, y, f, oit=4, sem=0): return sum(ruido2(x, y, f * 2 ** k, sem + k) / 2 ** k for k in range(oit)) / sum(1 / 2 ** k for k in range(oit))
def suave(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def r_lago(x, y): return np.sqrt(((x - LAGO_C[0]) / LAGO_R[0]) ** 2 + ((y - LAGO_C[1]) / LAGO_R[1]) ** 2)
def altura(x, y):
    x, y = np.asarray(x, float), np.asarray(y, float); d0 = np.hypot(x, y); r = r_lago(x, y) + 0.08 * fbm2(x, y, 0.15, 3, 5)
    h = 0.45 * fbm2(x, y, 0.07, 4, 1) * suave(6, 14, d0)                                  # chão ondulado, plano na clareira do T. rex
    h += -2.6 * (1 - suave(0.55, 1.0, r)) - 0.35 * (1 - suave(1.0, 1.15, r))                 # bacia do lago e margem baixa
    h += suave(32, 60, d0) * (4 + 6 * fbm2(x, y, 0.03, 3, 2))                                 # encostas da mata ao longe
    h += suave(34, 44, y) * 6.0                                                               # encosta do paredão, além do lago
    return h
T = 70; PASSO = 0.5
xs = np.arange(-T, T + 1e-6, PASSO); ys = np.arange(-T, T + 1e-6, PASSO); XX, YY = np.meshgrid(xs, ys); ZZ = altura(XX, YY)
bm = bmesh.new(); nx = len(xs); vs = [bm.verts.new((XX.flat[k], YY.flat[k], ZZ.flat[k])) for k in range(XX.size)]
for j in range(len(ys) - 1):
    for i in range(nx - 1): a = j * nx + i; bm.faces.new((vs[a], vs[a + 1], vs[a + nx + 1], vs[a + nx]))
me = bpy.data.meshes.new('terreno'); bm.to_mesh(me); bm.free(); terreno = bpy.data.objects.new('terreno', me); cena.collection.objects.link(terreno)
for p in me.polygons: p.use_smooth = True
at = me.color_attributes.new('lago', 'FLOAT_COLOR', 'POINT')                              # 0 dentro do lago, 1 longe (lama na margem)
RL = r_lago(XX.ravel(), YY.ravel())
for k in range(len(RL)): v = float(np.clip((RL[k] - 0.8) / 0.5, 0, 1)); at.data[k].color = (v, v, v, 1)

def tex(nt, nome, mapa, coord, cor=True):
    n = nt.nodes.new('ShaderNodeTexImage'); f = os.path.join(PH, 'textura', nome, f'{nome}_{mapa}_2k.jpg'); n.image = bpy.data.images.load(f, check_existing=True)
    if not cor: n.image.colorspace_settings.name = 'Non-Color'
    nt.links.new(coord, n.inputs['Vector']); return n
def material_terreno():
    m = bpy.data.materials.new('terreno'); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']; L = nt.links.new
    tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (0.3, 0.3, 0.3); L(tc.outputs['Object'], mp.inputs['Vector'])
    folhas, lama, rocha = tex(nt, 'forest_leaves_02', 'diff', mp.outputs[0]), tex(nt, 'brown_mud_03', 'diff', mp.outputs[0]), tex(nt, 'mossy_rock', 'diff', mp.outputs[0])
    nF, nL, nR = tex(nt, 'forest_leaves_02', 'nor_gl', mp.outputs[0], False), tex(nt, 'brown_mud_03', 'nor_gl', mp.outputs[0], False), tex(nt, 'mossy_rock', 'nor_gl', mp.outputs[0], False)
    atl = nt.nodes.new('ShaderNodeAttribute'); atl.attribute_name = 'lago'
    geo = nt.nodes.new('ShaderNodeNewGeometry'); sp = nt.nodes.new('ShaderNodeSeparateXYZ'); L(geo.outputs['Normal'], sp.inputs['Vector'])
    ing = nt.nodes.new('ShaderNodeMapRange'); ing.inputs['From Min'].default_value = 0.85; ing.inputs['From Max'].default_value = 0.65; L(sp.outputs['Z'], ing.inputs['Value'])   # 1 onde é íngreme
    def mix(fa, a, b_, tipo='RGBA'):
        n = nt.nodes.new('ShaderNodeMix'); n.data_type = tipo; L(fa, n.inputs[0]); L(a, n.inputs[6] if tipo == 'RGBA' else n.inputs[4]); L(b_, n.inputs[7] if tipo == 'RGBA' else n.inputs[5]); return n.outputs[2] if tipo == 'RGBA' else n.outputs[1]
    c = mix(atl.outputs['Fac'], lama.outputs['Color'], folhas.outputs['Color']); c = mix(ing.outputs[0], c, rocha.outputs['Color'])
    nrm = mix(atl.outputs['Fac'], nL.outputs['Color'], nF.outputs['Color'], 'VECTOR'); nrm = mix(ing.outputs[0], nrm, nR.outputs['Color'], 'VECTOR')
    nm = nt.nodes.new('ShaderNodeNormalMap'); L(nrm, nm.inputs['Color']); L(nm.outputs['Normal'], b.inputs['Normal'])
    esc = nt.nodes.new('ShaderNodeMix'); esc.data_type = 'RGBA'; esc.blend_type = 'MULTIPLY'; esc.inputs[0].default_value = 1.0; L(c, esc.inputs[6]); esc.inputs[7].default_value = (0.75, 0.75, 0.7, 1)
    L(esc.outputs[2], b.inputs['Base Color'])
    rg = nt.nodes.new('ShaderNodeMapRange'); rg.inputs['To Min'].default_value = 0.35; rg.inputs['To Max'].default_value = 0.9; L(atl.outputs['Fac'], rg.inputs['Value']); L(rg.outputs[0], b.inputs['Roughness'])   # lama molhada brilha
    return m
terreno.data.materials.append(material_terreno())

# água: caixa (para a absorção turva) com ondulação fina
bpy.ops.mesh.primitive_cube_add(size=1, location=(LAGO_C[0], LAGO_C[1], NIVEL_AGUA - 1.5)); agua = bpy.context.object; agua.name = 'agua'; agua.scale = (LAGO_R[0] * 2.5, LAGO_R[1] * 2.5, 3.0)
ma = bpy.data.materials.new('agua'); ma.use_nodes = True; nt = ma.node_tree; b = nt.nodes['Principled BSDF']; L = nt.links.new
b.inputs['Base Color'].default_value = (0.05, 0.08, 0.06, 1); b.inputs['Roughness'].default_value = 0.03; b.inputs['Transmission Weight'].default_value = 1.0; b.inputs['IOR'].default_value = 1.333
tc = nt.nodes.new('ShaderNodeTexCoord'); nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.8; nz.inputs['Detail'].default_value = 6.0; L(tc.outputs['Object'], nz.inputs['Vector'])
bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.06; L(nz.outputs['Fac'], bp.inputs['Height']); L(bp.outputs['Normal'], b.inputs['Normal'])
va = nt.nodes.new('ShaderNodeVolumeAbsorption'); va.inputs['Color'].default_value = (0.30, 0.40, 0.25, 1); va.inputs['Density'].default_value = 1.6; L(va.outputs[0], nt.nodes['Material Output'].inputs['Volume'])
agua.data.materials.append(ma)

# ------------------------------------------------------------------------------------------------ assets do Poly Haven (cada um importado uma vez, usado por instância)
fonte = bpy.data.collections.new('_assets'); cena.collection.children.link(fonte)
def asset(nome):
    col = bpy.data.collections.new(nome); fonte.children.link(col)
    antes = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=os.path.join(PH, 'modelo', nome, f'{nome}_1k.gltf'))
    for o in set(bpy.data.objects) - antes:
        for c in list(o.users_collection): c.objects.unlink(o)
        col.objects.link(o)
    return col
def por(col, x, y, esc=1.0, giro=None, afunda=0.0, inclina=0.0):
    o = bpy.data.objects.new(col.name + '_i', None); o.instance_type = 'COLLECTION'; o.instance_collection = col
    o.location = (x, y, float(altura(x, y)) - afunda * esc); o.rotation_euler = (inclina * rng.normal(), inclina * rng.normal(), rng.uniform(0, 6.283) if giro is None else giro); o.scale = (esc,) * 3
    cena.collection.objects.link(o); return o

ARV = [asset(n) for n in ('jacaranda_tree', 'island_tree_01', 'island_tree_03', 'tree_small_02')]
SUB = {n: asset(n) for n in ('fern_02', 'anthurium_botany_01', 'calathea_orbifolia_01', 'pachira_aquatica_01', 'shrub_01', 'shrub_04')}
PED = [asset(n) for n in ('rock_moss_set_01', 'rock_moss_set_02', 'boulder_01', 'rock_07')]
PAREDE = [asset(n) for n in ('rock_face_01', 'mountainside')]
TRONCO = [asset(n) for n in ('dead_tree_trunk_02', 'root_cluster_01')]
bpy.context.view_layer.layer_collection.children['_assets'].exclude = True          # as fontes não aparecem, só as instâncias

CAM_ATAQUE = np.array([7.9, -3.9])
CAMS_VISTA = [((7.9, -3.9), (3.7, 0.0)), ((1.5, 19.0), (1.5, 0.0)), ((18.0, -16.0), (0.0, 5.0))]   # (câmera, alvo) no plano
def na_frente_da_camera(x, y):
    """nada nasce num cone de 40° à frente de cada câmera até 14 m (senão tapa o quadro)"""
    for c, a in CAMS_VISTA:
        v, d = np.array([x - c[0], y - c[1]]), np.array([a[0] - c[0], a[1] - c[1]]); dist = np.linalg.norm(v)
        if dist < 7: return True                                                          # nada em cima ou em volta da câmera
        if dist < 14 and dist > 0 and np.dot(v, d) / (dist * np.linalg.norm(d)) > math.cos(math.radians(40)): return True
    return False
def livre(x, y, folga_trex=3.5, folga_lago=1.12):
    """fora do lago, longe dos pés do T. rex e fora do corredor entre a câmera de ataque e o bicho"""
    if r_lago(x, y) < folga_lago: return False
    if abs(y) < 1.6 and -7.5 < x < 6.5: return False                                        # o próprio corpo
    if math.hypot(x - 0.4, y) < folga_trex: return False
    if math.hypot(x - 4.4, y + 0.6) < 3.2: return False                                    # a cabeça (virada na pose de ataque)
    if na_frente_da_camera(x, y): return False
    p, a, b_ = np.array([x, y]), CAM_ATAQUE, np.array([3.0, 0.0]); t = np.clip(np.dot(p - a, b_ - a) / np.dot(b_ - a, b_ - a), 0, 1)
    return np.linalg.norm(p - (a + t * (b_ - a))) > 2.6
def espalhar(cols, n, rmin, rmax, esc, tent=40, **kw):
    feitos = 0
    for _ in range(n * tent):
        if feitos >= n: break
        ang, r = rng.uniform(0, 6.283), math.sqrt(rng.uniform(rmin ** 2, rmax ** 2)); x, y = r * math.cos(ang), r * math.sin(ang)
        if not livre(x, y): continue
        por(cols[rng.integers(len(cols))], x, y, rng.uniform(*esc), **kw); feitos += 1
    return feitos

print('árvores', espalhar(ARV, 55, 10, 62, (0.9, 1.6)))
print('samambaias', espalhar([SUB['fern_02']], 320, 4, 45, (1.8, 3.2)))                     # samambaias gigantes (era dos dinossauros)
print('folhagens', espalhar([SUB[k] for k in ('anthurium_botany_01', 'calathea_orbifolia_01', 'pachira_aquatica_01')], 160, 4, 40, (1.4, 2.6)))
print('arbustos', espalhar([SUB['shrub_01'], SUB['shrub_04']], 120, 6, 50, (1.0, 2.2)))
# margem do lago: rochas com musgo, algumas meio dentro d'água
for k in range(46):
    t = rng.uniform(0, 6.283); f = rng.uniform(0.92, 1.12); x = LAGO_C[0] + LAGO_R[0] * f * math.cos(t); y = LAGO_C[1] + LAGO_R[1] * f * math.sin(t)
    if math.hypot(x - 0.4, y) < 4.0 or na_frente_da_camera(x, y): continue
    por(PED[rng.integers(len(PED))], x, y, rng.uniform(0.8, 2.6), afunda=0.15, inclina=0.12)
# paredão do outro lado do lago e troncos
for k, x in enumerate(np.linspace(-26, 22, 7)): por(PAREDE[0], x + rng.normal(0, 2), 40 + rng.normal(0, 2), rng.uniform(3.0, 4.2), giro=math.pi + rng.normal(0, 0.3), afunda=0.1)   # paredão ao fundo, além do lago
for _ in range(10):
    t = rng.uniform(0, 6.283); x, y = 9 * math.cos(t) + rng.normal(0, 3), 9 * math.sin(t) + rng.normal(0, 3)
    if livre(x, y) and not na_frente_da_camera(x, y): por(TRONCO[rng.integers(2)], x, y, rng.uniform(1.0, 1.8))

# ------------------------------------------------------------------------------------------------ o T. rex
if TREX:
    with bpy.data.libraries.load(TREX, link=False) as (de, para): para.objects = [n for n in de.objects]
    for o in para.objects:
        if o is not None and o.type in ('MESH', 'EMPTY'): cena.collection.objects.link(o)

# ------------------------------------------------------------------------------------------------ luz, névoa, câmeras
w = bpy.data.worlds.new('mundo'); cena.world = w; w.use_nodes = True; nt = w.node_tree
env = nt.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(os.path.join(PH, 'hdri', 'mossy_forest_2k.hdr')); nt.links.new(env.outputs['Color'], nt.nodes['Background'].inputs['Color'])
nt.nodes['Background'].inputs['Strength'].default_value = float(arg('ceu', 1.5))
sol = bpy.data.lights.new('sol', 'SUN'); sol.energy = float(arg('sol', 6.0)); sol.angle = math.radians(1.5); sol.color = (1.0, 0.88, 0.70)
so = bpy.data.objects.new('sol', sol); so.rotation_euler = (math.radians(58), 0, math.radians(-150)); cena.collection.objects.link(so)   # sol de trás/lado: contorno e fachos
chave = bpy.data.lights.new('chave', 'AREA'); chave.energy = float(arg('chave', 1800)); chave.size = 4.0; ch = bpy.data.objects.new('chave', chave); ch.location = (10, -6, 8); cena.collection.objects.link(ch)
cc = ch.constraints.new('TRACK_TO'); alc = bpy.data.objects.new('alvo_chave', None); alc.location = (4.0, 0, 3.4); cena.collection.objects.link(alc); cc.target = alc; cc.track_axis = 'TRACK_NEGATIVE_Z'; cc.up_axis = 'UP_Y'
if NEVOA > 0:                                                                                # névoa leve: profundidade e raios de sol
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 8, 10)); nv = bpy.context.object; nv.name = 'nevoa'; nv.scale = (110, 110, 22)
    mn = bpy.data.materials.new('nevoa'); mn.use_nodes = True; nn = mn.node_tree; nn.nodes.remove(nn.nodes['Principled BSDF'])
    pv = nn.nodes.new('ShaderNodeVolumePrincipled'); pv.inputs['Density'].default_value = NEVOA; pv.inputs['Anisotropy'].default_value = 0.55; pv.inputs['Color'].default_value = (0.85, 0.90, 0.82, 1)
    nn.links.new(pv.outputs[0], nn.nodes['Material Output'].inputs['Volume']); nv.data.materials.append(mn)
cena.render.engine = 'CYCLES'; cena.cycles.samples = AMOSTRAS; cena.cycles.use_denoising = True; cena.cycles.device = 'CPU'; cena.cycles.volume_step_rate = 4.0
cena.render.resolution_x, cena.render.resolution_y = LARG, int(LARG * 0.62)
cena.view_settings.look = 'AgX - Medium High Contrast' if 'AgX' in cena.view_settings.view_transform else 'None'
CAMERAS = {'ataque': ((7.9, -3.9, 3.05), (3.7, 0, 3.35), 38), 'lago': ((1.5, 19.0, 0.55), (1.5, 0.0, 3.0), 28), 'aerea': ((18, -16, 12), (0, 5, 1), 28),
           'lado': ((2.0, -16.0, 2.6), (1.0, 4.0, 3.0), 30)}
for nome, (loc, alvo, lente) in CAMERAS.items():
    if nome not in CAMS.split(','): continue
    cd = bpy.data.cameras.new(nome); cd.lens = lente; cd.clip_end = 400; oc = bpy.data.objects.new(nome, cd); oc.location = loc; cena.collection.objects.link(oc)
    al = bpy.data.objects.new('alvo_' + nome, None); al.location = alvo; cena.collection.objects.link(al)
    c = oc.constraints.new('TRACK_TO'); c.target = al; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
    if PREVIA: cena.camera = oc; cena.render.filepath = PREVIA.replace('.png', f'_{nome}.png'); bpy.ops.render.render(write_still=True)
if arg('blend'): bpy.ops.wm.save_as_mainfile(filepath=arg('blend'))
