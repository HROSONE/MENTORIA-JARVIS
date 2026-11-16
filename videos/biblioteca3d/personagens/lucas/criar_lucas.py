# Gera o LUCAS realista no Blender a partir dos DADOS do MakeHuman (malha base hm08, alvos de forma, esqueleto "game_engine", roupas/cabelo como proxies),
# sem executar código de terceiros: só lê arquivos (.obj, .target.gz, .mhclo, .json, texturas) e monta tudo com bpy. Exporta GLB com esqueleto,
# pesos, alvos de expressão (morph targets) e texturas, para o Three.js do canal.
#
# uso: python3 texturas_lucas.py ... --saida <tex>   e depois
#      blender -b --python criar_lucas.py -- --dados <mpfbdata/data> --assets <mhdata> --texturas <tex> --saida lucas12.glb [--idade 12 --magreza 1.0 --roupa casa|carro --previa previa.png]
#
# Licenças: malha base, alvos e assets do MakeHuman: modelos exportados são CC0 (makehumancommunity.org/content/license_explanation.html).
import bpy, bmesh, gzip, json, math, os, sys
import numpy as np

A = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(n, d=None): return A[A.index('--' + n) + 1] if '--' + n in A else d
DADOS, ASSETS, SAIDA = arg('dados'), arg('assets'), arg('saida', 'lucas.glb')
IDADE, MAGREZA, ROUPA, PREVIA, CABELO = float(arg('idade', 12)), float(arg('magreza', 1.0)), arg('roupa', 'casa'), arg('previa'), arg('cabelo', 'mechas')
TEX = arg('texturas')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mh import ler_obj, ler_alvo, corpo_lucas, centro as _centro, ler_mhclo, encaixar, recortar_roupa, cabelo_procedural
V, base_VT, base_F, base_G, grupos = corpo_lucas(DADOS, IDADE, MAGREZA)
T = os.path.join(DADOS, 'targets')
def centro(g): return _centro(V, grupos, g)
para_b = lambda P: np.stack([P[..., 0] * 0.1, -P[..., 2] * 0.1, P[..., 1] * 0.1], axis=-1)   # OBJ (dm, y para cima) -> Blender (m, z para cima)

# ------------------------------------------------------------------------------------------------ cena
bpy.ops.wm.read_factory_settings(use_empty=True)
cena = bpy.context.scene

# esqueleto "game_engine" (nomes estilo Unreal: pelvis, spine_01..03, neck_01, head, clavicle/upperarm/lowerarm/hand, thigh/calf/foot/ball)
rig = json.load(open(os.path.join(DADOS, 'rigs/standard/rig.game_engine.json')))
pesos = json.load(open(os.path.join(DADOS, 'rigs/standard/weights.game_engine.json')))['weights']
def ponto(spec):
    if spec['strategy'] == 'CUBE': return para_b(centro(spec['cube_name']))
    return para_b(V[spec['vertex_indices']].mean(axis=0))
arm_dados = bpy.data.armatures.new('Lucas_rig'); arm = bpy.data.objects.new('Lucas', arm_dados); cena.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
for nome, b in rig.items():
    eb = arm_dados.edit_bones.new(nome); eb.head = ponto(b['head']); eb.tail = ponto(b['tail']); eb.roll = b.get('roll', 0)
    if (eb.tail - eb.head).length < 1e-4: eb.tail = eb.head + np.array([0, 0, 0.02])
for nome, b in rig.items():
    if b.get('parent'): arm_dados.edit_bones[nome].parent = arm_dados.edit_bones[b['parent']]; arm_dados.edit_bones[nome].use_connect = False
bpy.ops.object.mode_set(mode='OBJECT')

# pesos por vértice da malha base (lista bone -> [(vi, w)])
W = {}
for osso, lst in pesos.items():
    for vi, w in lst: W.setdefault(vi, []).append((osso, w))

# alvos de expressão (morph targets) caucasianos
EXPR = ['eye-left-closure', 'eye-right-closure', 'eyebrows-left-inner-up', 'eyebrows-right-inner-up', 'eyebrows-left-down', 'eyebrows-right-down',
        'mouth-open', 'mouth-depression', 'mouth-compression', 'mouth-corner-puller', 'mouth-pursing', 'mouth-elevation', 'eye-left-slit', 'eye-right-slit',
        'nose-left-dilatation', 'nose-right-dilatation', 'mouth-retraction', 'mouth-parling']
DELTAS = {}
for e in EXPR:
    c = f'{T}/expression/units/caucasian/{e}.target.gz'
    if os.path.exists(c): i, d = ler_alvo(c); D = np.zeros_like(V); D[i] = d; DELTAS[e] = D

def criar_malha(nome, Vb_obj, faces, uvs_por_face, refs=None, mat=None, apagar_faces=None, so_osso=None):
    """Vb_obj: vértices no espaço OBJ; faces: listas de índices; uvs_por_face: listas de (u,v); refs: (idx Nx3, w Nx3) para herdar pesos/expressões da base."""
    me = bpy.data.meshes.new(nome); P = para_b(Vb_obj)
    me.from_pydata(P.tolist(), [], faces); me.update()
    uv = me.uv_layers.new(name='UV')
    k = 0
    for poly, fu in zip(me.polygons, uvs_por_face):
        for li, (u, v) in zip(poly.loop_indices, fu): uv.data[li].uv = (u, v)
    ob = bpy.data.objects.new(nome, me); cena.collection.objects.link(ob); ob.parent = arm
    mod = ob.modifiers.new('rig', 'ARMATURE'); mod.object = arm
    for osso in rig: ob.vertex_groups.new(name=osso)
    n = len(Vb_obj)
    for vi in range(n):
        if so_osso: lst = [(so_osso, 1.0)]
        elif refs is None: lst = W.get(vi, [])
        else:
            acc = {}
            for bi, bw in zip(refs[0][vi], refs[1][vi]):
                for osso, w in W.get(int(bi), []): acc[osso] = acc.get(osso, 0) + w * bw
            lst = list(acc.items())
        tot = sum(w for _, w in lst) or 1
        for osso, w in sorted(lst, key=lambda x: -x[1])[:4]: ob.vertex_groups[osso].add([vi], w / tot, 'REPLACE')
    if DELTAS and not so_osso:
        ob.shape_key_add(name='Basis')
        for e, D in DELTAS.items():
            sk = ob.shape_key_add(name=e)
            Dp = D[:n] if refs is None else (D[refs[0]] * refs[1][..., None]).sum(axis=1)
            if np.abs(Dp).max() < 1e-6: ob.shape_key_remove(sk); continue
            Pk = para_b(Vb_obj + Dp); sk.data.foreach_set('co', Pk.ravel())
    if mat: ob.data.materials.append(mat)
    for p in ob.data.polygons: p.use_smooth = True
    return ob

# ------------------------------------------------------------------------------------------------ materiais
def img(caminho): return bpy.data.images.load(caminho, check_existing=True)
def mat_pbr(nome, cor=None, tex=None, normal=None, rug=0.6, alfa=None, sss=0.0, brilho_esp=0.5, dupla=False):
    m = bpy.data.materials.new(nome); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value = rug; b.inputs['Specular IOR Level'].default_value = brilho_esp
    if cor: b.inputs['Base Color'].default_value = (*cor, 1)
    if tex:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = img(tex); nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
        if alfa: nt.links.new(t.outputs['Alpha'], b.inputs['Alpha']); m.blend_method = 'HASHED'
    if normal and os.path.exists(normal):
        tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = img(normal); tn.image.colorspace_settings.name = 'Non-Color'
        nm = nt.nodes.new('ShaderNodeNormalMap'); nt.links.new(tn.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    if sss: b.inputs['Subsurface Weight'].default_value = sss; b.inputs['Subsurface Radius'].default_value = (1.0, 0.35, 0.2); b.inputs['Subsurface Scale'].default_value = 0.012
    m.use_backface_culling = not dupla
    return m

m_pele = mat_pbr('pele', tex=os.path.join(TEX, 'pele.jpg'), rug=0.52, sss=0.25, brilho_esp=0.45)
m_olho = mat_pbr('olho', tex=os.path.join(TEX, 'olho.jpg'), rug=0.08, brilho_esp=0.8)
SUIT = 'male_casualsuit02'
m_roupa = mat_pbr('roupa', tex=os.path.join(TEX, f'roupa_{ROUPA}.jpg'), normal=os.path.join(ASSETS, f'clothes/{SUIT}/{SUIT}_normal.png'), rug=0.9, brilho_esp=0.2, dupla=True)
m_cabelo = mat_pbr('cabelo', tex=os.path.join(TEX, 'mecha.png' if CABELO == 'mechas' else f'cabelo_{CABELO}.png'), normal=os.path.join(ASSETS, f'hair/{CABELO}/{CABELO}_normal.png'), rug=0.55, alfa=True, dupla=True)
m_sobr = mat_pbr('sobrancelha', tex=os.path.join(TEX, 'sobrancelha.png'), rug=0.7, alfa=True, dupla=True)
m_cilio = mat_pbr('cilios', tex=os.path.join(TEX, 'cilios.png'), rug=0.7, alfa=True, dupla=True)
m_dente = mat_pbr('dentes', cor=(0.88, 0.85, 0.78), rug=0.3)
m_lingua = mat_pbr('lingua', cor=(0.62, 0.30, 0.30), rug=0.4)

# ------------------------------------------------------------------------------------------------ montagem: proxies primeiro (eles dizem o que apagar do corpo)
apagar = set()
def proxy(caminho_mhclo, nome, mat, roupa=None):
    info = ler_mhclo(caminho_mhclo); Pv, idx, w = encaixar(info, V)
    Vp, VTp, Fp, _ = ler_obj(os.path.join(os.path.dirname(caminho_mhclo), info['obj']))
    if roupa:
        mant, _, esconder = recortar_roupa(V, grupos, Pv, [f[0] for f in Fp], info['delete'], roupa, uvs=[[VTp[t] for t in f[1]] for f in Fp]); Fp = [Fp[k] for k in mant]
    else: esconder = info['delete']
    apagar.update(esconder)
    return criar_malha(nome, Pv, [vs for vs, _ in Fp], [[VTp[t] for t in ts] for _, ts in Fp], refs=(idx, w), mat=mat)
proxy(os.path.join(ASSETS, f'clothes/{SUIT}/{SUIT}.mhclo'), 'roupa', m_roupa, roupa=ROUPA)
if CABELO == 'mechas':
    Vh, Fh, UVh, _ = cabelo_procedural(V, grupos, base_F, base_G); criar_malha('cabelo', Vh, Fh, UVh, refs=None, mat=m_cabelo, so_osso='head')
else: proxy(os.path.join(ASSETS, f'hair/{CABELO}/{CABELO}.mhclo'), 'cabelo', m_cabelo)
proxy(os.path.join(ASSETS, 'eyebrows/eyebrow001/eyebrow001.mhclo'), 'sobrancelhas', m_sobr)
proxy(os.path.join(ASSETS, 'eyelashes/eyelashes01/eyelashes01.mhclo'), 'cilios', m_cilio)
proxy(os.path.join(ASSETS, 'teeth/teeth_base/teeth_base.mhclo'), 'dentes', m_dente)
proxy(os.path.join(ASSETS, 'tongue/tongue01/tongue01.mhclo'), 'lingua', m_lingua)

# corpo: só as faces "body" (sem auxiliares), sem as faces cobertas pela roupa
faces, uvs, usados = [], [], set()
for (vs, ts), g in zip(base_F, base_G):
    if g != 'body' or any(i in apagar for i in vs): continue
    faces.append(vs); uvs.append([base_VT[t] for t in ts]); usados.update(vs)
mapa = {o: n for n, o in enumerate(sorted(usados))}; inv = np.array(sorted(usados))
corpo = criar_malha('corpo', V[inv], [[mapa[i] for i in f] for f in faces], uvs, refs=(np.stack([inv, inv, inv], 1), np.tile([1.0, 0, 0], (len(inv), 1))), mat=m_pele)

# olhos: esferas UV no centro de cada olho auxiliar (polo da frente = pupila), presas 100% ao osso da cabeça
def esfera(c, r, nseg=32, nan=24):
    Vs, F, UV = [], [], []
    for j in range(nan + 1):
        th = math.pi * j / nan                                       # 0 = polo da frente (+z no OBJ)
        for i in range(nseg + 1):
            ph = 2 * math.pi * i / nseg
            Vs.append([c[0] + r * math.sin(th) * math.cos(ph), c[1] + r * math.sin(th) * math.sin(ph), c[2] + r * math.cos(th)])
    for j in range(nan):
        for i in range(nseg):
            a = j * (nseg + 1) + i; F.append([a, a + nseg + 1, a + nseg + 2, a + 1])
            UV.append([(i / nseg, 1 - j / nan), (i / nseg, 1 - (j + 1) / nan), ((i + 1) / nseg, 1 - (j + 1) / nan), ((i + 1) / nseg, 1 - j / nan)])
    return np.array(Vs), F, UV
for lado, g in (('E', 'helper-l-eye'), ('D', 'helper-r-eye')):
    pts = V[sorted(grupos[g])]; c = pts.mean(axis=0); r = np.abs(pts - c).max(axis=0).mean() * 0.97
    Ve, Fe, UVe = esfera(c, r)
    ob = criar_malha('olho' + lado, Ve, Fe, UVe, refs=None, mat=m_olho, so_osso='head')

# chão em z = 0: desloca o esqueleto (e tudo o que é filho)
zmin = min((corpo.matrix_world @ v.co).z for v in corpo.data.vertices)
arm.location.z = -zmin
bpy.context.view_layer.update()

# ------------------------------------------------------------------------------------------------ prévia (Cycles) e exportação
if PREVIA:
    cena.render.engine = 'CYCLES'; cena.cycles.samples = 48; cena.cycles.use_denoising = True; cena.cycles.device = 'CPU'
    cena.render.resolution_x, cena.render.resolution_y = 900, 1200; cena.render.film_transparent = False
    w = bpy.data.worlds.new('mundo'); cena.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.62, 0.64, 0.68, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
    altura = max((corpo.matrix_world @ v.co).z for v in corpo.data.vertices)
    def luz(nome, tipo, loc, en, tam=1.0):
        l = bpy.data.lights.new(nome, tipo); l.energy = en
        if tipo == 'AREA': l.size = tam
        o = bpy.data.objects.new(nome, l); o.location = loc; cena.collection.objects.link(o)
        c = o.constraints.new('TRACK_TO'); c.target = arm; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'; return o
    luz('chave', 'AREA', (1.4, -2.2, altura * 1.1), 260, 1.5); luz('recorte', 'AREA', (-1.6, 1.4, altura * 1.2), 180, 1.0); luz('enche', 'AREA', (-2.0, -1.8, altura * 0.6), 60, 2.0)
    chao = bpy.data.meshes.new('chao'); oc = bpy.data.objects.new('chao', chao); cena.collection.objects.link(oc)
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=6); bm.to_mesh(chao); bm.free(); oc.data.materials.append(mat_pbr('chao', cor=(0.55, 0.56, 0.58), rug=0.8))
    for nome_c, loc, alvo_z, lente in [('frente', (0.0, -2.2, altura * 0.62), altura * 0.55, 50), ('rosto', (0.18, -0.75, altura * 0.93), altura * 0.92, 85)]:
        cd = bpy.data.cameras.new(nome_c); cd.lens = lente; oc2 = bpy.data.objects.new(nome_c, cd); oc2.location = loc; cena.collection.objects.link(oc2)
        alvo = bpy.data.objects.new('alvo_' + nome_c, None); alvo.location = (0, 0, alvo_z); cena.collection.objects.link(alvo)
        c = oc2.constraints.new('TRACK_TO'); c.target = alvo; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
        cena.camera = oc2; cena.render.filepath = PREVIA.replace('.png', f'_{nome_c}.png'); bpy.ops.render.render(write_still=True)

bpy.ops.object.select_all(action='DESELECT')
for o in cena.objects:
    if o == arm or o.parent == arm: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=SAIDA, export_format='GLB', use_selection=True, export_skins=True, export_morph=True, export_apply=False, export_image_format='JPEG', export_jpeg_quality=88, export_yup=True, export_animations=False)
print('PRONTO', SAIDA, 'altura', round(max((corpo.matrix_world @ v.co).z for v in corpo.data.vertices), 3))
