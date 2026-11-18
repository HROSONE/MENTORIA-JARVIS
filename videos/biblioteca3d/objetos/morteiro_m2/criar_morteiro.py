# Morteiro M2 de 60 mm dos EUA (2ª Guerra): tubo de 72,6 cm, placa-base retangular de aço estampado, bipé com mecanismo de elevação (parafuso)
# e de direção (manivela), colar com amortecedores e a mira do lado esquerdo. Feito por script no Blender (metros, z para cima, tiro para +y).
# Fontes: Wikipedia "M2 mortar" (60 mm, 42 lb, elevação 40°–85°), ww2db "M2 Mortar Launcher" (tubo 726 mm; tubo/placa/bipé 12,8/12,8/16,4 lb).
# uso: blender -b -P criar_morteiro.py -- [--glb morteiro_m2.glb] [--blend morteiro_m2.blend] [--render teste.png] [--elev 65]
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
arg = lambda n, d=None: argv[argv.index('--' + n) + 1] if '--' + n in argv else d
AQUI = os.path.dirname(os.path.abspath(__file__)); PH = os.path.join(AQUI, '..', '..', 'polyhaven')
bpy.ops.wm.read_factory_settings(use_empty=True); cena = bpy.context.scene

def mat(nome, cor, rough=0.5, metal=0.6):
    m = bpy.data.materials.new(nome); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*cor, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal; return m
OD = mat('verde_oliva', (0.11, 0.12, 0.065), 0.55, 0.35); PRETO = mat('aco_preto', (0.035, 0.035, 0.033), 0.4, 0.8)
GASTO = mat('aco_gasto', (0.30, 0.30, 0.28), 0.35, 1.0); ALMA = mat('alma', (0.01, 0.01, 0.01), 0.6, 0.5); VIDRO = mat('lente', (0.05, 0.08, 0.06), 0.05, 0.0)

def lig(o, pai=None, m=None):
    if m: o.data.materials.clear(); o.data.materials.append(m)
    if pai: o.parent = pai
    return o
def cil(r, comp, m, n=32, r2=None):
    """cilindro (ou tronco de cone) ao longo de +z, base em z = 0"""
    bpy.ops.mesh.primitive_cone_add(vertices=n, radius1=r, radius2=r if r2 is None else r2, depth=comp, location=(0, 0, comp / 2))
    o = bpy.context.object; bpy.ops.object.transform_apply(location=True); bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35)); return lig(o, None, m)
def caixa(sx, sy, sz, m, bevel=0.002):
    bpy.ops.mesh.primitive_cube_add(size=1); o = bpy.context.object; o.scale = (sx, sy, sz); bpy.ops.object.transform_apply(scale=True)
    if bevel: md = o.modifiers.new('b', 'BEVEL'); md.width = bevel; md.segments = 2; bpy.ops.object.modifier_apply(modifier='b')
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35)); return lig(o, None, m)
def vazio(nome, pai=None, loc=(0, 0, 0)):
    e = bpy.data.objects.new(nome, None); cena.collection.objects.link(e); e.location = loc
    if pai: e.parent = pai
    return e
def entre(o, a, b):
    """põe um objeto feito ao longo de +z (base em 0) indo de a até b"""
    a, b = Vector(a), Vector(b); d = b - a; o.location = a; o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d.normalized()); return o

ELEV = math.radians(float(arg('elev', '65')))
raiz = vazio('MorteiroM2')
# ---------------------------------------------------------------- placa-base retangular (aço estampado) com nervuras e o soquete
pb = vazio('placa_base', raiz)
for o in [caixa(0.42, 0.32, 0.012, OD, 0.004)]: o.location = (0, -0.06, 0.006); lig(o, pb)
for k in range(-2, 3):        # nervuras em leque por baixo/lado
    n = caixa(0.012, 0.28, 0.030, OD, 0.003); n.location = (k * 0.085, -0.06, 0.02); n.rotation_euler = (0, 0, k * 0.18); lig(n, pb)
aba = caixa(0.42, 0.012, 0.05, OD, 0.003); aba.location = (0, -0.215, 0.03); lig(aba, pb)          # aba de trás dobrada
aba2 = caixa(0.42, 0.012, 0.03, OD, 0.003); aba2.location = (0, 0.095, 0.02); lig(aba2, pb)
SOQ = Vector((0, -0.09, 0.055))
s = cil(0.052, 0.045, PRETO, r2=0.044); s.location = (0, -0.09, 0.012); lig(s, pb)
for a in range(4):            # alças de transporte da placa
    h = caixa(0.05, 0.012, 0.012, PRETO, 0.002); h.location = (0.17 * (1 if a % 2 else -1), -0.06 + (0.12 if a > 1 else -0.12), 0.02); lig(h, pb)

# ---------------------------------------------------------------- o tubo (pivô na bola da culatra; o eixo local +z é o cano)
tubo = vazio('Tubo', raiz, SOQ); tubo.rotation_euler = (-(math.pi / 2 - ELEV), 0, 0)
L = 0.726
bola = cil(0.040, 0.06, PRETO, r2=0.035); bola.location = (0, 0, -0.025); lig(bola, tubo)                 # culatra (tampa da base)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.034, segments=24, ring_count=12, location=(0, 0, -0.03)); esf = lig(bpy.context.object, tubo, PRETO); bpy.ops.object.shade_smooth()
cano = cil(0.0365, L - 0.04, OD, n=40); cano.location = (0, 0, 0.03); lig(cano, tubo)
for zz, rr, hh in [(0.03, 0.040, 0.03), (L - 0.035, 0.040, 0.035)]:               # reforço da culatra e anel da boca
    a = cil(rr, hh, PRETO, n=40); a.location = (0, 0, zz); lig(a, tubo)
alma = cil(0.0302, 0.02, ALMA, n=32); alma.location = (0, 0, L - 0.018); lig(alma, tubo)                 # escuro da alma na boca
for k in range(5):            # aletas de resfriamento (anéis) na metade de baixo
    a = cil(0.041, 0.008, OD, n=40); a.location = (0, 0, 0.09 + k * 0.035); lig(a, tubo)
boca = vazio('boca', tubo, (0, 0, L))                                               # referência para o Three.js
COLAR = 0.47
col = cil(0.046, 0.06, PRETO, n=32); col.location = (0, 0, COLAR - 0.03); lig(col, tubo)
for lado in (-1, 1):          # amortecedores (dois cilindros paralelos ao cano, por baixo)
    am = cil(0.013, 0.15, OD, n=20); am.location = (lado * 0.028, -0.048, COLAR - 0.12); lig(am, tubo)
# mira (caixinha com nível e luneta) do lado esquerdo do colar
mira = vazio('mira', tubo, (-0.075, 0, COLAR)); mira.rotation_euler = (math.pi / 2 - ELEV, 0, 0)
for (sx, sy, sz, x, y, z, m) in [(0.03, 0.05, 0.06, 0, 0, 0.0, OD), (0.02, 0.09, 0.02, 0, 0.01, 0.045, PRETO), (0.012, 0.012, 0.012, 0, 0.06, 0.045, VIDRO)]:
    b = caixa(sx, sy, sz, m, 0.002); b.location = (x, y, z); lig(b, mira)
br = caixa(0.04, 0.012, 0.012, PRETO, 0.001); br.location = (-0.04, 0, COLAR); lig(br, tubo)

# ---------------------------------------------------------------- o bipé (no mundo; o topo encosta no colar)
bp = vazio('bipe', raiz); bpy.context.view_layer.update()
topo = tubo.matrix_world @ Vector((0, -0.05, COLAR))                                  # ponto de baixo do colar
mec = topo + Vector((0, 0.01, -0.07))                                                  # caixa do mecanismo de direção
cx = caixa(0.16, 0.05, 0.05, PRETO, 0.004); cx.location = mec; lig(cx, bp)
for lado in (-1, 1):
    m1 = cil(0.022, 0.06, GASTO, n=20); m1.rotation_euler = (0, math.pi / 2, 0); m1.location = mec + Vector((lado * 0.08, 0, 0)); lig(m1, bp)
# manivela de direção (à direita) e de elevação (embaixo do parafuso)
mv = cil(0.035, 0.008, PRETO, n=24); mv.rotation_euler = (0, math.pi / 2, 0); mv.location = mec + Vector((0.13, 0, 0)); lig(mv, bp)
pu = cil(0.006, 0.04, GASTO, n=12); pu.rotation_euler = (0, math.pi / 2, 0); pu.location = mec + Vector((0.135, 0, -0.028)); lig(pu, bp)
base_paraf = mec + Vector((0, 0.05, -0.26))
par = entre(cil(0.022, (mec - base_paraf).length, PRETO, n=24), base_paraf, mec); lig(par, bp)        # caixa do parafuso de elevação
mv2 = entre(cil(0.04, 0.01, PRETO, n=24), base_paraf - (mec - base_paraf).normalized() * 0.01, base_paraf); lig(mv2, bp)
for lado in (-1, 1):          # pernas presas no alto do mecanismo, abertas para a frente e para os lados, com pé de garra
    ini = mec + Vector((lado * 0.05, 0.0, -0.03)); pe = Vector((lado * 0.27, mec.y + 0.16, 0.0))
    perna = entre(cil(0.017, (pe - ini).length, OD, n=20), ini, pe); lig(perna, bp)
    gar = cil(0.03, 0.02, PRETO, n=16, r2=0.005); gar.rotation_euler = (math.pi, 0, 0); gar.location = pe + Vector((0, 0, 0.02)); lig(gar, bp)
    sap = caixa(0.07, 0.04, 0.008, PRETO, 0.002); sap.location = pe + Vector((0, 0, 0.012)); lig(sap, bp)
pm = lambda lado, u: (mec + Vector((lado * 0.05, 0, -0.03))).lerp(Vector((lado * 0.27, mec.y + 0.16, 0.0)), u)
c1, c2 = pm(-1, 0.55), pm(1, 0.55)
for k in range(14):           # corrente que limita a abertura das pernas
    u = (k + 0.5) / 14; p = c1.lerp(c2, u) + Vector((0, 0, -0.04 * math.sin(math.pi * u)))
    bpy.ops.mesh.primitive_torus_add(major_radius=0.008, minor_radius=0.0022, location=p, rotation=(math.pi / 2 * (k % 2), 0, math.pi / 2)); lig(bpy.context.object, bp, GASTO)

if arg('glb'): bpy.ops.export_scene.gltf(filepath=arg('glb'), export_format='GLB', export_apply=True)
if arg('blend'): bpy.ops.wm.save_as_mainfile(filepath=arg('blend'))
if arg('render'):
    bpy.ops.mesh.primitive_plane_add(size=6); ch = bpy.context.object; ch.data.materials.append(mat('chao', (0.35, 0.28, 0.2), 0.95, 0))
    w = bpy.data.worlds.new('m'); cena.world = w; w.use_nodes = True; e = w.node_tree.nodes.new('ShaderNodeTexEnvironment')
    e.image = bpy.data.images.load(os.path.join(PH, 'hdri', 'mossy_forest_2k.hdr')); w.node_tree.links.new(e.outputs['Color'], w.node_tree.nodes['Background'].inputs['Color'])
    bpy.ops.object.light_add(type='SUN'); sol = bpy.context.object; sol.data.energy = 3; sol.rotation_euler = (math.radians(50), 0, math.radians(35))
    cd = bpy.data.cameras.new('c'); cd.lens = 40; c = bpy.data.objects.new('c', cd); cena.collection.objects.link(c)
    c.location = (1.25, 0.2, 0.55); d = Vector((0, 0.08, 0.3)) - c.location; c.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); cena.camera = c
    cena.render.engine = 'CYCLES'; cena.cycles.samples = int(arg('amostras', '24')); cena.cycles.use_denoising = True
    cena.render.resolution_x, cena.render.resolution_y = 1200, 1200; cena.render.filepath = arg('render'); cena.view_settings.view_transform = 'AgX'
    bpy.ops.render.render(write_still=True)
print('pronto')
