# Caixa de munição de morteiro 60 mm dos EUA (2ª Guerra): caixote de madeira pintado de verde-oliva com alças de corda, tampa aberta,
# 10 granadas M49A2 (espoleta M52), cada uma no seu tubo de fibra preto (2 camadas de 5). Algumas fora da caixa para mostrar a granada.
# Fontes: caixote datado de 1944 marcado "10 RDS" (IMA), FM 23-90 apêndice A (cada granada vem num tubo de fibra).
# uso: blender -b -P criar_caixa.py -- [--render saida.png] [--glb caixa.glb] [--blend caixa.blend] [--cam heroi|detalhe] [--amostras 96]
import bpy, bmesh, math, os, sys, random
from mathutils import Vector, Matrix
AQUI = os.path.dirname(os.path.abspath(__file__)); TEX = os.path.join(AQUI, 'tex')
PH = os.path.join(AQUI, '..', '..', 'polyhaven')
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
arg = lambda n, d=None: argv[argv.index('--' + n) + 1] if '--' + n in argv else d
random.seed(4)

bpy.ops.wm.read_factory_settings(use_empty=True)
cena = bpy.context.scene

# ---------------------------------------------------------------- materiais
def img(nome):
    p = os.path.join(TEX, nome)
    return bpy.data.images.load(p, check_existing=True)
def mat_tex(nome, arquivo, rough=0.8, metal=0.0, alfa=False):
    m = bpy.data.materials.new(nome); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = img(arquivo); nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if alfa:
        nt.links.new(t.outputs['Alpha'], b.inputs['Alpha']); m.blend_method = 'BLEND' if hasattr(m, 'blend_method') else None
    return m
def mat_cor(nome, cor, rough=0.5, metal=0.0):
    m = bpy.data.materials.new(nome); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*cor, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    return m
M = {
    'od': mat_tex('madeira_od', 'madeira_od.png', 0.85), 'od2': mat_tex('madeira_od2', 'madeira_od2.png', 0.85), 'crua': mat_tex('madeira_crua', 'madeira_crua.png', 0.9),
    'frente': mat_tex('estencil_frente', 'estencil_frente.png', 0.8, alfa=True), 'tampa': mat_tex('estencil_tampa', 'estencil_tampa.png', 0.8, alfa=True),
    'ponta': mat_tex('estencil_ponta', 'estencil_ponta.png', 0.8, alfa=True),
    'tubo': mat_tex('tubo_fibra', 'tubo.png', 0.75), 'granada': mat_tex('granada_corpo', 'granada.png', 0.55),
    'tampaTubo': mat_cor('tampa_tubo', (0.035, 0.034, 0.03), 0.4, 0.6),
    'aluminio': mat_cor('espoleta', (0.72, 0.72, 0.70), 0.32, 1.0), 'latao': mat_cor('latao', (0.78, 0.56, 0.26), 0.3, 1.0),
    'aco': mat_cor('aco', (0.35, 0.35, 0.33), 0.45, 1.0), 'cauda': mat_cor('cauda', (0.20, 0.22, 0.12), 0.6, 0.2), 'ferro': mat_cor('ferragem', (0.12, 0.12, 0.11), 0.55, 0.8),
    'corda': mat_cor('corda', (0.20, 0.15, 0.08), 0.95), 'carga': mat_cor('carga', (0.78, 0.72, 0.55), 0.8),
}

def objeto(nome, bm, mats):
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(nome, me); cena.collection.objects.link(o)
    for m in mats: me.materials.append(m)
    return o

def uv_caixa(bm, esc=1.6, off=(0, 0)):
    """UV por projeção na face dominante; o veio (u) corre ao longo do eixo mais comprido da peça"""
    uv = bm.loops.layers.uv.verify(); xs = [v.co for v in bm.verts]
    tam = [max(c[i] for c in xs) - min(c[i] for c in xs) for i in range(3)]
    for f in bm.faces:
        n = f.normal; ax = max(range(3), key=lambda i: abs(n[i])); outros = [i for i in range(3) if i != ax]
        outros.sort(key=lambda i: -tam[i])
        for l in f.loops: l[uv].uv = (l.vert.co[outros[0]] * esc + off[0], l.vert.co[outros[1]] * esc + off[1])

def tabua(nome, x0, x1, y0, y1, z0, z1, mat, chanfro=0.0015):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co = Vector(((x0 + x1) / 2 + v.co.x * (x1 - x0), (y0 + y1) / 2 + v.co.y * (y1 - y0), (z0 + z1) / 2 + v.co.z * (z1 - z0)))
    bmesh.ops.bevel(bm, geom=bm.edges[:], offset=chanfro, segments=1, affect='EDGES')
    uv_caixa(bm, 1.6, (random.random(), random.random()))
    return objeto(nome, bm, [mat])

def decal(nome, cx, cy, cz, w, h, normal, mat):
    """plano com a figura (estêncil) encostado numa face: normal = '-y' | '+x' | '+z' ..."""
    bm = bmesh.new(); vs = [bm.verts.new(p) for p in [(-w / 2, -h / 2, 0), (w / 2, -h / 2, 0), (w / 2, h / 2, 0), (-w / 2, h / 2, 0)]]
    f = bm.faces.new(vs); uv = bm.loops.layers.uv.verify()
    for l, c in zip(f.loops, [(0, 0), (1, 0), (1, 1), (0, 1)]): l[uv].uv = c
    o = objeto(nome, bm, [mat])
    rot = {'-y': (math.pi / 2, 0, 0), '+y': (math.pi / 2, 0, math.pi), '+x': (math.pi / 2, 0, math.pi / 2), '-x': (math.pi / 2, 0, -math.pi / 2), '+z': (0, 0, 0)}[normal]
    o.rotation_euler = rot; o.location = (cx, cy, cz); return o

# ---------------------------------------------------------------- a granada M49A2 (cauda em z = 0, ponta em z = 0,247)
PERFIL = [(0.0, 0.0), (0.0105, 0.0), (0.0105, 0.004), (0.0098, 0.006), (0.0098, 0.092), (0.0125, 0.098), (0.016, 0.104), (0.021, 0.115), (0.0265, 0.131),
          (0.0295, 0.146), (0.0300, 0.152), (0.0300, 0.168), (0.0292, 0.176), (0.0262, 0.188), (0.0215, 0.199), (0.0160, 0.207), (0.0128, 0.2115),
          (0.0130, 0.2125), (0.0130, 0.227), (0.0118, 0.231), (0.0090, 0.237), (0.0058, 0.242), (0.0030, 0.2455), (0.0, 0.247)]
def granada(nome):
    bm = bmesh.new(); S = 48; aneis = []
    for r, z in PERFIL:
        aneis.append([bm.verts.new((r * math.cos(2 * math.pi * k / S), r * math.sin(2 * math.pi * k / S), z)) for k in range(S)])
    uv = bm.loops.layers.uv.verify()
    for i in range(len(aneis) - 1):
        zc = (PERFIL[i][1] + PERFIL[i + 1][1]) / 2; mi = 1 if zc < 0.096 else (2 if zc > 0.2122 else 0)
        for k in range(S):
            f = bm.faces.new((aneis[i][k], aneis[i][(k + 1) % S], aneis[i + 1][(k + 1) % S], aneis[i + 1][k])); f.material_index = mi; f.smooth = True
            for l in f.loops:
                kk = aneis[i].index(l.vert) if l.vert in aneis[i] else aneis[i + 1].index(l.vert)
                u = kk / S if not (kk == 0 and (k == S - 1)) else 1.0
                l[uv].uv = (u, l.vert.co.z / 0.247)
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-6)
    # aletas (6), com o anel de reforço, e as cargas de pólvora presas entre elas
    for k in range(6):
        a = 2 * math.pi * k / 6; c = Vector((math.cos(a), math.sin(a), 0)); tng = Vector((-math.sin(a), math.cos(a), 0))
        g = bmesh.ops.create_cube(bm, size=1.0)['verts']
        for v in g:
            p = v.co; v.co = c * (0.0098 + (p.x + 0.5) * 0.022) + tng * (p.y * 0.0016) + Vector((0, 0, 0.004 + (p.z + 0.5) * 0.046 - (p.x + 0.5) * 0.008 * (p.z > 0)))
        for f in {f for v in g for f in v.link_faces}: f.material_index = 1
    o = objeto(nome, bm, [M['granada'], M['cauda'], M['aluminio'], M['carga']])
    return o

def tubo_fibra(nome, comp=0.30, r=0.036, tampas=(True, True)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=r, depth=comp, location=(0, 0, 0)); o = bpy.context.object; o.name = nome
    o.data.materials.append(M['tubo']); bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
    for i, z in enumerate([-comp / 2, comp / 2]):
        if not tampas[i]: continue
        bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=r * 1.04, depth=0.03, location=(0, 0, z - 0.012 if z > 0 else z + 0.012)); t = bpy.context.object
        t.data.materials.append(M['tampaTubo']); bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40)); t.parent = o
    return o

# ---------------------------------------------------------------- a caixa
E = 0.018                  # espessura da tábua
CX, CY, CZ = 0.345, 0.41, 0.17       # medidas de fora (x = comprimento dos tubos, y = 5 tubos, z = 2 camadas)
pai = bpy.data.objects.new('CaixaMorteiro60mm', None); cena.collection.objects.link(pai)
def p(o): o.parent = pai; return o
x0, x1, y0, y1 = -CX / 2, CX / 2, -CY / 2, CY / 2
p(tabua('fundo', x0, x1, y0, y1, 0, E, M['od']))
for i, (ya, yb) in enumerate([(y0, y0 + E), (y1 - E, y1)]):          # laterais compridas em 2 tábuas cada
    p(tabua(f'lado{i}a', x0, x1, ya, yb, E, E + 0.075, M['od' if i else 'od2'])); p(tabua(f'lado{i}b', x0, x1, ya, yb, E + 0.075, CZ, M['od2' if i else 'od']))
for i, (xa, xb) in enumerate([(x0, x0 + E), (x1 - E, x1)]):          # cabeceiras + travessas (cleats) por fora
    p(tabua(f'cab{i}', xa, xb, y0 + E, y1 - E, E, CZ, M['od']))
    s = -1 if i == 0 else 1; xo = (xa if i == 0 else xb)
    for ya, yb in [(y0, y0 + 0.05), (y1 - 0.05, y1)]: p(tabua(f'trav{i}_{ya:.2f}', xo - (0.016 if s < 0 else 0), xo + (0.016 if s > 0 else 0), ya, yb, 0, CZ, M['od2']))
    p(tabua(f'travH{i}', xo - (0.016 if s < 0 else 0), xo + (0.016 if s > 0 else 0), y0 + 0.05, y1 - 0.05, CZ - 0.045, CZ - 0.005, M['od2']))
    # alça de corda: sai de dois furos na travessa horizontal e pende
    cv = bpy.data.curves.new(f'corda{i}', 'CURVE'); cv.dimensions = '3D'; cv.bevel_depth = 0.0065; cv.bevel_resolution = 4
    sp = cv.splines.new('BEZIER'); sp.bezier_points.add(2)
    xc = xo + s * 0.020
    for bp, co in zip(sp.bezier_points, [(xc, -0.07, CZ - 0.025), (xc + s * 0.012, 0.0, CZ - 0.085), (xc, 0.07, CZ - 0.025)]):
        bp.co = co; bp.handle_left_type = bp.handle_right_type = 'AUTO'
    oc = bpy.data.objects.new(f'corda{i}', cv); cena.collection.objects.link(oc); cv.materials.append(M['corda']); p(oc)
    for yy in (-0.07, 0.07):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.013, location=(xc, yy, CZ - 0.025), segments=16, ring_count=8); nn = bpy.context.object; nn.scale = (0.8, 1, 1.15)
        nn.data.materials.append(M['corda']); bpy.ops.object.shade_smooth(); p(nn)
# estênceis
p(decal('marca_frente', 0, y0 - 0.0008, CZ * 0.40, 0.27, 0.135, '-y', M['frente']))
p(decal('marca_ponta', x1 + 0.0168, 0, CZ * 0.40, 0.28, 0.14, '+x', M['ponta']))
# a tampa (dobradiça atrás, aberta ~112°)
tampa = bpy.data.objects.new('tampa', None); cena.collection.objects.link(tampa); p(tampa); tampa.location = (0, y1, CZ)
for k in range(3):
    ya, yb = -CY + k * CY / 3 + 0.001, -CY + (k + 1) * CY / 3 - 0.001
    t = tabua(f'tampa{k}', x0, x1, ya, yb, 0, E, M['od' if k % 2 else 'od2']); t.parent = tampa
for xa in (x0 + 0.02, x1 - 0.045):
    t = tabua(f'tampaTrav{xa:.2f}', xa, xa + 0.025, -CY + 0.03, -0.03, -0.016, 0, M['od']); t.parent = tampa
dm = decal('marca_tampa', 0, -CY / 2, E + 0.0008, 0.2, 0.2, '+z', M['tampa']); dm.parent = tampa
tampa.rotation_euler = (math.radians(-112), 0, 0)
# dobradiças e trinco
for xa in (-0.11, 0.08):
    p(tabua(f'dobr{xa}', xa, xa + 0.03, y1, y1 + 0.003, CZ - 0.06, CZ, M['ferro'], 0.0005))
p(tabua('trinco', -0.015, 0.015, y0 - 0.003, y0, CZ - 0.05, CZ - 0.01, M['aco'], 0.0005))

# ---------------------------------------------------------------- os tubos e as granadas
R = 0.036; PASSO = 0.074; xs_tubo = 0.0
def no_lugar(o, x, y, z, rot):
    o.location = (x, y, z); o.rotation_euler = rot; return o
ys = [y0 + E + 0.037 + i * PASSO for i in range(5)]
for camada in range(2):
    zc = E + R + 0.001 + camada * (2 * R + 0.001)
    for i, yy in enumerate(ys):
        if camada == 1 and i >= 2: continue                         # três tubos de cima já saíram
        p(no_lugar(tubo_fibra(f'tubo{camada}{i}'), 0, yy, zc, (0, math.pi / 2, 0)))
# um tubo aberto, deitado em cima, com a granada saindo
ta = p(no_lugar(tubo_fibra('tubo_aberto', tampas=(True, False)), 0.03, ys[3], E + 3 * R + 0.06, (0, math.pi / 2, 0)))
g1 = p(no_lugar(granada('granada_saindo'), 0.10, ys[3], E + 3 * R + 0.06, (0, math.pi / 2, 0)))
tp = p(no_lugar(tubo_fibra('tampa_solta', comp=0.03, tampas=(False, False)), 0.33, -0.33, 0.036 * 1.04, (math.pi / 2, 0, 0.6)))
tp.data.materials[0] = M['tampaTubo']
# granadas fora da caixa: duas deitadas no chão e uma em pé na aleta
p(no_lugar(granada('granada_chao1'), 0.0, -0.36, 0.030, (math.radians(-90), 0, math.radians(100))))
p(no_lugar(granada('granada_chao2'), 0.17, -0.30, 0.030, (math.radians(-90), 0, math.radians(68))))
p(no_lugar(granada('granada_em_pe'), -0.29, -0.14, 0.0, (0, 0, math.radians(30))))
p(no_lugar(tubo_fibra('tubo_vazio', tampas=(True, False)), -0.32, 0.10, R, (math.pi / 2, 0, math.radians(-12))))

# ---------------------------------------------------------------- render (chão, céu, câmera) — fora do GLB
def render(saida, cam='heroi', amostras=96):
    chao_dir = os.path.join(PH, 'textura', 'dry_ground_rocks')
    bpy.ops.mesh.primitive_plane_add(size=4, location=(0, 0, 0)); ch = bpy.context.object; ch.name = 'chao_render'
    m = bpy.data.materials.new('chao'); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (2.5, 2.5, 2.5); nt.links.new(tc.outputs['UV'], mp.inputs['Vector'])
    for arq, ent, col in [('diff', 'Base Color', True), ('rough', 'Roughness', False)]:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(os.path.join(chao_dir, f'dry_ground_rocks_{arq}_2k.jpg'))
        if not col: t.image.colorspace_settings.name = 'Non-Color'
        nt.links.new(mp.outputs['Vector'], t.inputs['Vector']); nt.links.new(t.outputs['Color'], b.inputs[ent])
    tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = bpy.data.images.load(os.path.join(chao_dir, 'dry_ground_rocks_nor_gl_2k.jpg')); tn.image.colorspace_settings.name = 'Non-Color'
    nm = nt.nodes.new('ShaderNodeNormalMap'); nt.links.new(mp.outputs['Vector'], tn.inputs['Vector']); nt.links.new(tn.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    ch.data.materials.append(m)
    w = bpy.data.worlds.new('mundo'); cena.world = w; w.use_nodes = True; wn = w.node_tree
    env = wn.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(os.path.join(PH, 'hdri', 'mossy_forest_2k.hdr'))
    wn.links.new(env.outputs['Color'], wn.nodes['Background'].inputs['Color']); wn.nodes['Background'].inputs['Strength'].default_value = 0.9
    bpy.ops.object.light_add(type='SUN', location=(1, -1, 2)); sol = bpy.context.object; sol.data.energy = 3.2; sol.data.angle = math.radians(3)
    sol.rotation_euler = (math.radians(50), 0, math.radians(35)); sol.data.color = (1.0, 0.93, 0.82)
    if cam == 'heroi': pos, alvo, lente = (0.62, -1.02, 0.62), (0.02, -0.06, 0.08), 50
    else: pos, alvo, lente = (0.78, -0.62, 0.34), (0.27, -0.06, 0.15), 60
    cd = bpy.data.cameras.new('cam'); cd.lens = lente; cd.dof.use_dof = True; cd.dof.aperture_fstop = 5.6 if cam == 'heroi' else 3.2
    c = bpy.data.objects.new('cam', cd); cena.collection.objects.link(c); c.location = pos
    d = Vector(alvo) - Vector(pos); c.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); cd.dof.focus_distance = d.length; cena.camera = c
    cena.render.engine = 'CYCLES'; cena.cycles.device = 'CPU'; cena.cycles.samples = amostras; cena.cycles.use_denoising = True
    cena.render.resolution_x, cena.render.resolution_y = 1600, 1200; cena.render.filepath = saida
    cena.view_settings.view_transform = 'AgX'; cena.view_settings.look = 'AgX - Medium High Contrast'
    cena.render.threads_mode = 'FIXED'; cena.render.threads = os.cpu_count()
    bpy.ops.render.render(write_still=True)

if arg('glb'):
    bpy.ops.export_scene.gltf(filepath=arg('glb'), export_format='GLB', export_image_format='AUTO', export_apply=True)
if arg('blend'):
    bpy.ops.file.pack_all(); bpy.ops.wm.save_as_mainfile(filepath=arg('blend'))
if arg('render'):
    render(arg('render'), arg('cam', 'heroi'), int(arg('amostras', '96')))
print('pronto')
