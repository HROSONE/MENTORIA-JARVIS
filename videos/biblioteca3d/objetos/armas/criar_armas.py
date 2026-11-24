# Armas genéricas para o jogo Hryz City, feitas por script no Blender: uma PISTOLA semiautomática (tamanho de uma pistola de serviço,
# ~19 cm) e uma METRALHADORA/carabina automática (~84 cm, no estilo das carabinas de cano curto). Sem marca e sem cópia de modelo real.
# Peças móveis separadas (o jogo anima): Ferrolho (corre para trás no tiro), Gatilho, Carregador (sai na recarga).
# Marcadores (vazios): Boca (saída do cano), Ejecao (janela das cápsulas), Apoio (onde a mão esquerda segura, só na metralhadora).
# Eixos no Blender: cano para -Y, z para cima; origem = onde a mão direita segura (topo do cabo). No glTF/Three.js: cano para +Z, y para cima.
# uso: blender -b -P criar_armas.py -- [--glb pasta] [--render pasta]
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix, Euler
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
arg = lambda n, d=None: argv[argv.index('--' + n) + 1] if '--' + n in argv else d

def limpar():
    bpy.ops.wm.read_factory_settings(use_empty=True)
def mat(nome, cor, rough=0.5, metal=0.0):
    m = bpy.data.materials.get(nome) or bpy.data.materials.new(nome); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*cor, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal; return m
def mats():
    return {
        'polimero': mat('polimero', (0.035, 0.036, 0.038), 0.62, 0.0),
        'metal': mat('metal_oxidado', (0.045, 0.046, 0.05), 0.32, 0.85),
        'aco': mat('aco', (0.30, 0.30, 0.31), 0.25, 1.0),
        'alma': mat('alma', (0.005, 0.005, 0.005), 0.8, 0.2),
        'vermelho': mat('ponto_vermelho', (0.9, 0.05, 0.03), 0.2, 0.0),
        'vidro': mat('lente', (0.05, 0.09, 0.08), 0.02, 0.3),
        'branco': mat('ponto_branco', (0.9, 0.9, 0.85), 0.4, 0.0),
    }

def caixa(nome, x0, x1, y0, y1, z0, z1, m, bevel=0.0015, pai=None, rot=None, piv=None):
    bpy.ops.mesh.primitive_cube_add(size=1); o = bpy.context.object; o.name = nome
    o.scale = (x1 - x0, y1 - y0, z1 - z0); o.location = ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
    bpy.ops.object.transform_apply(location=False, scale=True)
    if bevel > 0:
        md = o.modifiers.new('b', 'BEVEL'); md.width = bevel; md.segments = 2; md.limit_method = 'ANGLE'; bpy.ops.object.modifier_apply(modifier='b')
    if rot is not None:
        pv = Vector(piv if piv else o.location); o.location = pv + Matrix.Rotation(rot[1], 3, rot[0]) @ (o.location - pv); o.rotation_euler = Euler({'X': (rot[1], 0, 0), 'Y': (0, rot[1], 0), 'Z': (0, 0, rot[1])}[rot[0]])
    o.data.materials.append(m); bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
    if pai: o.parent = pai
    return o
def cil(nome, r, y0, y1, x, z, m, n=24, pai=None, r2=None):
    """cilindro ao longo de y"""
    bpy.ops.mesh.primitive_cone_add(vertices=n, radius1=r, radius2=r if r2 is None else r2, depth=abs(y1 - y0), location=(x, (y0 + y1) / 2, z), rotation=(math.pi / 2, 0, 0))
    o = bpy.context.object; o.name = nome; o.data.materials.append(m); bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
    if pai: o.parent = pai
    return o
def vazio(nome, loc, pai=None):
    e = bpy.data.objects.new(nome, None); bpy.context.scene.collection.objects.link(e); e.location = loc; e.empty_display_size = 0.01
    if pai: e.parent = pai
    return e
def ligar(o, pai):
    bpy.context.view_layer.update(); o.parent = pai; o.matrix_parent_inverse = pai.matrix_world.inverted()

def juntar(objs, nome):
    """junta várias malhas numa só (menos objetos no jogo)"""
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join(); objs[0].name = nome; return objs[0]

# ------------------------------------------------------------------------------------------------ PISTOLA
def pistola(M):
    raiz = vazio('Pistola', (0, 0, 0))
    # armação com o cabo inclinado, guarda-mato e trilho
    pecas = [caixa('a', -0.0128, 0.0128, -0.150, 0.030, -0.004, 0.016, M['polimero'], 0.002)]
    pecas.append(caixa('trilho', -0.011, 0.011, -0.140, -0.090, -0.010, -0.002, M['polimero'], 0.001))
    for k in range(3): pecas.append(caixa(f'tr{k}', -0.0115, 0.0115, -0.135 + k * 0.016, -0.128 + k * 0.016, -0.012, -0.008, M['polimero'], 0.0005))
    cabo = caixa('cabo', -0.0150, 0.0150, -0.012, 0.034, -0.112, 0.004, M['polimero'], 0.004, rot=('X', math.radians(-17)), piv=(0, 0.02, 0)); pecas.append(cabo)
    for k in range(9):                                                                                   # textura do cabo (frisos)
        pecas.append(caixa(f'fr{k}', -0.0155, 0.0155, 0.000, 0.026, -0.098 + k * 0.010, -0.095 + k * 0.010, M['polimero'], 0.0005, rot=('X', math.radians(-17)), piv=(0, 0.02, 0)))
    pecas.append(caixa('cauda', -0.012, 0.012, 0.022, 0.044, -0.004, 0.012, M['polimero'], 0.004))      # rabo de castor
    # guarda-mato (aro em volta do gatilho)
    pecas.append(caixa('gm1', -0.006, 0.006, -0.075, -0.068, -0.040, -0.004, M['polimero'], 0.002))
    pecas.append(caixa('gm2', -0.006, 0.006, -0.075, -0.010, -0.044, -0.037, M['polimero'], 0.002))
    armacao = juntar(pecas, 'Armacao'); armacao.parent = raiz
    # ferrolho (slide) com serrilhas, janela de ejeção, miras e o cano
    pf = [caixa('f', -0.0145, 0.0145, -0.152, 0.036, 0.014, 0.046, M['metal'], 0.003)]
    for k in range(7): pf.append(caixa(f's{k}', -0.0152, 0.0152, 0.006 + k * 0.004, 0.0075 + k * 0.004, 0.018, 0.042, M['aco'], 0.0003))
    pf.append(caixa('janela', 0.0105, 0.0150, -0.052, -0.012, 0.034, 0.0465, M['alma'], 0.0005))
    pf.append(caixa('massa', -0.003, 0.003, -0.146, -0.140, 0.046, 0.053, M['metal'], 0.0008))
    pf.append(caixa('alca', -0.008, 0.008, 0.024, 0.032, 0.046, 0.054, M['metal'], 0.0008))
    pf.append(caixa('pto', -0.0012, 0.0012, -0.1445, -0.1415, 0.050, 0.0525, M['branco'], 0))
    ferrolho = juntar(pf, 'Ferrolho'); ferrolho.parent = raiz
    cano = cil('Cano', 0.0068, -0.153, -0.030, 0, 0.032, M['aco']); ligar(cano, ferrolho)
    alma = cil('almaP', 0.0046, -0.1535, -0.140, 0, 0.032, M['alma']); ligar(alma, ferrolho)
    # gatilho e carregador (peças móveis)
    gat = caixa('Gatilho', -0.0035, 0.0035, -0.055, -0.046, -0.030, -0.002, M['polimero'], 0.0015, rot=('X', math.radians(12)), piv=(0, -0.05, -0.002)); gat.parent = raiz
    car = caixa('Carregador', -0.0118, 0.0118, -0.006, 0.026, -0.118, -0.010, M['metal'], 0.002, rot=('X', math.radians(-17)), piv=(0, 0.02, 0))
    base = caixa('base', -0.0145, 0.0145, -0.012, 0.030, -0.126, -0.116, M['polimero'], 0.002, rot=('X', math.radians(-17)), piv=(0, 0.02, 0))
    car = juntar([car, base], 'Carregador'); car.parent = raiz
    vazio('Boca', (0, -0.156, 0.032), raiz); vazio('Ejecao', (0.016, -0.032, 0.044), raiz)
    return raiz

# ------------------------------------------------------------------------------------------------ METRALHADORA (carabina automática)
def metralhadora(M):
    raiz = vazio('Metralhadora', (0, 0, 0))
    zc = 0.045                                                                                           # altura do cano
    pc = [caixa('sup', -0.0130, 0.0130, -0.140, 0.105, 0.025, 0.070, M['metal'], 0.002)]               # caixa da culatra (superior)
    for k in range(14): pc.append(caixa(f'tr{k}', -0.0110, 0.0110, -0.130 + k * 0.017, -0.122 + k * 0.017, 0.070, 0.078, M['metal'], 0.0006))   # trilho
    pc.append(caixa('inf', -0.0140, 0.0140, -0.095, 0.075, -0.008, 0.026, M['metal'], 0.003))          # caixa inferior
    pc.append(caixa('poco', -0.0150, 0.0150, -0.082, -0.030, -0.035, -0.006, M['metal'], 0.003))       # poço do carregador
    pc.append(caixa('janelaM', 0.0125, 0.0140, -0.050, 0.010, 0.032, 0.058, M['alma'], 0.0005))
    # guarda-mão com fendas
    pc.append(cil('gmao', 0.024, -0.440, -0.140, 0, zc, M['polimero'], n=8))
    for k in range(8):
        for s in (1, -1): pc.append(caixa(f'fe{k}{s}', s * 0.0225 - 0.0025, s * 0.0225 + 0.0025, -0.420 + k * 0.034, -0.400 + k * 0.034, zc - 0.006, zc + 0.006, M['alma'], 0.0005))
    pc.append(caixa('trilhoGM', -0.010, 0.010, -0.430, -0.150, zc + 0.022, zc + 0.030, M['metal'], 0.0006))
    # cano, base da massa de mira, quebra-chamas
    pc.append(cil('canoM', 0.0085, -0.540, -0.430, 0, zc, M['metal']))
    pc.append(caixa('basemira', -0.008, 0.008, -0.470, -0.452, zc, zc + 0.058, M['metal'], 0.002))
    pc.append(caixa('massaM', -0.0015, 0.0015, -0.463, -0.459, zc + 0.058, zc + 0.070, M['metal'], 0.0005))
    pc.append(cil('qchama', 0.0110, -0.585, -0.540, 0, zc, M['metal']))
    for k in range(4): pc.append(caixa(f'qf{k}', -0.0115 if k % 2 else -0.002, 0.0115 if k % 2 else 0.002, -0.583, -0.555, zc - (0.002 if k % 2 else 0.0115), zc + (0.002 if k % 2 else 0.0115), M['alma'], 0))
    pc.append(cil('almaM', 0.0050, -0.5855, -0.575, 0, zc, M['alma']))
    # coronha: tubo e coronha retrátil
    pc.append(cil('tubo', 0.016, 0.100, 0.300, 0, zc, M['metal']))
    pc.append(caixa('coronha', -0.017, 0.017, 0.185, 0.305, -0.030, 0.072, M['polimero'], 0.006))
    pc.append(caixa('soleira', -0.019, 0.019, 0.300, 0.316, -0.036, 0.076, M['polimero'], 0.006))
    # cabo (pistol grip) inclinado e guarda-mato
    pc.append(caixa('caboM', -0.0145, 0.0145, -0.010, 0.030, -0.110, 0.002, M['polimero'], 0.005, rot=('X', math.radians(-22)), piv=(0, 0.02, 0)))
    pc.append(caixa('gmM', -0.005, 0.005, -0.075, 0.000, -0.030, -0.024, M['metal'], 0.002))
    # mira holográfica (ponto vermelho) em cima do trilho
    pc.append(caixa('miraC', -0.016, 0.016, -0.060, 0.010, 0.078, 0.112, M['polimero'], 0.004))
    pc.append(caixa('lenteM', -0.012, 0.012, -0.062, -0.058, 0.084, 0.106, M['vidro'], 0.0005))
    corpo = juntar(pc, 'Corpo'); corpo.parent = raiz
    # ferrolho: alavanca de manejo (T) que corre para trás no tiro, e o transportador visível na janela
    fe = [caixa('alav', -0.004, 0.004, 0.060, 0.105, 0.068, 0.076, M['metal'], 0.001), caixa('alavT', -0.016, 0.016, 0.100, 0.110, 0.066, 0.078, M['metal'], 0.002),
          caixa('transp', 0.008, 0.0128, -0.046, 0.006, 0.036, 0.054, M['aco'], 0.001)]
    ferrolho = juntar(fe, 'Ferrolho'); ferrolho.parent = raiz
    gat = caixa('Gatilho', -0.0035, 0.0035, -0.045, -0.037, -0.022, 0.000, M['metal'], 0.0015, rot=('X', math.radians(12)), piv=(0, -0.04, 0)); gat.parent = raiz
    # carregador curvo (seis gomos)
    gomos = []; p = Vector((0, -0.056, -0.030)); ang = 0.0
    for k in range(6):
        o = caixa(f'cg{k}', -0.0125, 0.0125, -0.026, 0.026, -0.030, 0.0, M['metal'], 0.0015); o.rotation_euler = (ang, 0, 0); o.location = p.copy()
        bpy.context.view_layer.update(); gomos.append(o); p = p + Matrix.Rotation(ang, 3, 'X') @ Vector((0, 0, -0.030)); ang += math.radians(5.5)
    for o in gomos:
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o; bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    car = juntar(gomos, 'Carregador'); car.parent = raiz
    vazio('Boca', (0, -0.588, zc), raiz); vazio('Ejecao', (0.014, -0.020, 0.050), raiz); vazio('Apoio', (0, -0.300, zc - 0.010), raiz)
    return raiz

def exportar(raiz, arquivo):
    bpy.ops.object.select_all(action='DESELECT')
    def sel(o):
        o.select_set(True); [sel(c) for c in o.children]
    sel(raiz)
    bpy.ops.export_scene.gltf(filepath=arquivo, export_format='GLB', use_selection=True, export_apply=True)

def render(raiz, arquivo, L):
    bpy.ops.mesh.primitive_plane_add(size=4, location=(0, 0, -0.16)); ch = bpy.context.object; ch.data.materials.append(mat('fundo', (0.55, 0.57, 0.6), 0.8))
    w = bpy.data.worlds.new('w'); bpy.context.scene.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.55, 0.6, 0.68, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35
    bpy.ops.object.light_add(type='AREA', location=(0.3, 0.6, 0.8)); l = bpy.context.object; l.data.energy = 60; l.data.size = 1.0; l.rotation_euler = (math.radians(-40), math.radians(20), 0)
    bpy.ops.object.light_add(type='AREA', location=(0.6, -0.4, 0.3)); l2 = bpy.context.object; l2.data.energy = 25; l2.data.size = 0.6
    cd = bpy.data.cameras.new('c'); cd.lens = 70; c = bpy.data.objects.new('c', cd); bpy.context.scene.collection.objects.link(c)
    c.location = (L * 3.4, -L * 0.55, L * 0.9); alvo = Vector((0, -L * 0.36, -L * 0.08)); c.rotation_euler = (alvo - c.location).to_track_quat('-Z', 'Y').to_euler(); bpy.context.scene.camera = c
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = 48; sc.cycles.use_denoising = True; sc.render.resolution_x, sc.render.resolution_y = 1400, 800
    sc.render.filepath = arquivo; sc.view_settings.view_transform = 'AgX'; bpy.ops.render.render(write_still=True)

for nome, fn, L in [('pistola', pistola, 0.20), ('metralhadora', metralhadora, 0.62)]:
    limpar(); M = mats(); raiz = fn(M)
    if arg('glb'): exportar(raiz, os.path.join(arg('glb'), nome + '.glb'))
    if arg('render'): render(raiz, os.path.join(arg('render'), nome + '.png'), L)
print('pronto')
