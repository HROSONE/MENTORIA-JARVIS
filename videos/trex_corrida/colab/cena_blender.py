# Monta no Blender a cena do Short "Você fugiria de um T. rex?" com a MESMA animação e as MESMAS câmeras da versão em Three.js
# (exportadas por colab/exportar.js em colab/dados/) e deixa pronta para renderizar no Cycles: luz global, sombras suaves, desfoque de
# movimento, profundidade de campo, modelos do Poly Haven em resolução cheia e a névoa da mata.
#
# uso:  blender -b -P cena_blender.py -- --dados colab/dados --ph <pasta com modelo/, textura/, hdri/ do Poly Haven> --saida cena.blend
#              [--qualidade cinema|rapido] [--larg 1080 --alt 1920] [--gpu] [--quadros pasta_de_saida] [--renderizar "0,300,600"]
#   --renderizar: renderiza só esses quadros (teste); sem ele, só salva o .blend (o render do filme inteiro é feito com: blender -b cena.blend -a)
import bpy, json, math, os, sys
from mathutils import Matrix, Quaternion, Vector

A = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(n, d=None):
    return A[A.index('--' + n) + 1] if '--' + n in A else d
DADOS, PH, SAIDA = os.path.abspath(arg('dados')), os.path.abspath(arg('ph')), arg('saida', 'cena.blend')      # (absolutos: o .blend salvo em outra pasta continua achando as imagens)
QUAL, LARG, ALT, GPU = arg('qualidade', 'cinema'), int(arg('larg', 1080)), int(arg('alt', 1920)), '--gpu' in A
QUADROS = arg('quadros', os.path.join(os.path.dirname(os.path.abspath(SAIDA)), 'quadros'))
FPS = 30

bpy.ops.wm.read_factory_settings(use_empty=True)
cena = bpy.context.scene; cena.render.fps = FPS
cam_json = json.load(open(os.path.join(DADOS, 'camera.json'))); amb = json.load(open(os.path.join(DADOS, 'ambiente.json')))
N = cam_json['quadros']

def colecao(nome, pai=None):
    c = bpy.data.collections.new(nome); (pai or cena.collection).children.link(c); return c
def importar_gltf(caminho, col):
    antes = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=caminho)
    novos = [o for o in bpy.data.objects if o not in antes]
    for o in novos:
        for c in list(o.users_collection): c.objects.unlink(o)
        col.objects.link(o)
    return novos
def srgb_lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]

# ------------------------------------------------------------------ materiais do Poly Haven (chão, estrada, paredes da fenda)
def material_ph(info):
    pid, rep, res = info['id'], list(info.get('rep', [1, 1])), info.get('res', '2k')
    nome = f'ph_{pid}_{rep[0]}x{rep[1]}'
    if nome in bpy.data.materials: return bpy.data.materials[nome]
    m = bpy.data.materials.new(nome); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    uv = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (rep[0], rep[1], 1)
    nt.links.new(uv.outputs['UV'], mp.inputs['Vector'])
    def img(tipo, cor):
        for r_ in (res, '2k', '1k', '4k'):
            f = os.path.join(PH, 'textura', pid, f'{pid}_{tipo}_{r_}.jpg')
            if os.path.exists(f):
                n = nt.nodes.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(f, check_existing=True)
                if not cor: n.image.colorspace_settings.name = 'Non-Color'
                nt.links.new(mp.outputs['Vector'], n.inputs['Vector']); return n
        print('FALTA textura', pid, tipo); return None
    d = img('diff', True); r = img('rough', False); nr = img('nor_gl', False)
    if d: nt.links.new(d.outputs['Color'], b.inputs['Base Color'])
    if r: nt.links.new(r.outputs['Color'], b.inputs['Roughness'])
    if nr:
        nm = nt.nodes.new('ShaderNodeNormalMap'); nt.links.new(nr.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    b.inputs['Specular IOR Level'].default_value = 0.3
    return m

# ------------------------------------------------------------------ cenário fixo (chão, estrada, paredes) com as texturas originais
col_cen = colecao('cenario')
for o in importar_gltf(os.path.join(DADOS, 'cenario.glb'), col_cen):
    if o.type != 'MESH': continue
    for i, ms in enumerate(o.material_slots):
        info = ms.material.get('ph') if ms.material else None
        if info: o.material_slots[i].material = material_ph(info.to_dict() if hasattr(info, 'to_dict') else dict(info))

# ------------------------------------------------------------------ vegetação e pedras: cada modelo do Poly Haven uma vez, as cópias como instâncias
col_fonte = colecao('modelos_ph'); col_inst = colecao('mata')
inst = json.load(open(os.path.join(DADOS, 'instancias.json'))); total = 0
for pid, mats in inst.items():
    f = os.path.join(PH, 'modelo', pid, f'{pid}_1k.gltf')
    if not os.path.exists(f): print('FALTA modelo', pid); continue
    cf = colecao('ph_' + pid, col_fonte)
    for o in importar_gltf(f, cf): o.location = o.location                     # (no lugar original do arquivo)
    for k, e in enumerate(mats):
        M = Matrix([[e[0], e[4], e[8], e[12]], [e[1], e[5], e[9], e[13]], [e[2], e[6], e[10], e[14]], [e[3], e[7], e[11], e[15]]])
        ob = bpy.data.objects.new(f'{pid}_{k}', None); ob.instance_type = 'COLLECTION'; ob.instance_collection = cf; ob.matrix_world = M
        col_inst.objects.link(ob); total += 1
lc = bpy.context.view_layer.layer_collection.children['modelos_ph']; lc.exclude = True     # (as fontes não aparecem; só as cópias)
print('INSTANCIAS', total)

# ------------------------------------------------------------------ atores animados (a animação vem dentro dos GLB, amostrada a 30 qps)
col_at = colecao('atores')
for n in ('trex', 'trilheiro', 'maratonista', 'tenis'):
    importar_gltf(os.path.join(DADOS, f'{n}_anim.glb'), col_at)
# onde a animação importada começa (o importador põe t = 0 no quadro 0 ou 1, conforme a versão): a câmera segue o mesmo início
inicio = min((a.frame_range[0] for a in bpy.data.actions), default=0); inicio = int(round(inicio))
for a in bpy.data.actions:
    for fc in a.fcurves:
        for k in fc.keyframe_points: k.interpolation = 'LINEAR'
for o in col_at.all_objects:                                                    # garante a ação ativa (importadores antigos deixam só no NLA)
    if o.animation_data and not o.animation_data.action and o.animation_data.nla_tracks:
        st = o.animation_data.nla_tracks[0].strips; o.animation_data.action = st[0].action if st else None
        for tr in list(o.animation_data.nla_tracks): o.animation_data.nla_tracks.remove(tr)
    sk = getattr(o.data, 'shape_keys', None) if o.type == 'MESH' else None
    if sk and sk.animation_data and not sk.animation_data.action and sk.animation_data.nla_tracks:
        st = sk.animation_data.nla_tracks[0].strips; sk.animation_data.action = st[0].action if st else None
        for tr in list(sk.animation_data.nla_tracks): sk.animation_data.nla_tracks.remove(tr)

# ------------------------------------------------------------------ câmera (mesmo campo de visão vertical, foco e abertura)
cd = bpy.data.cameras.new('camera'); cd.sensor_fit = 'VERTICAL'; cd.sensor_height = 24.0; cd.clip_start = 0.05; cd.clip_end = 900
camo = bpy.data.objects.new('camera', cd); cena.collection.objects.link(camo); cena.camera = camo; camo.rotation_mode = 'QUATERNION'
cd.dof.use_dof = True
for i, q in enumerate(cam_json['por_quadro']):
    f = i + inicio; c = q['cam']
    camo.location = c['pos']; camo.rotation_quaternion = Quaternion(c['quat'])
    camo.keyframe_insert('location', frame=f); camo.keyframe_insert('rotation_quaternion', frame=f)
    cd.lens = 12.0 / math.tan(math.radians(c['fov']) / 2); cd.keyframe_insert('lens', frame=f)
    cd.dof.focus_distance = max(0.2, c['foco']); cd.dof.aperture_fstop = min(22.0, max(1.4, 0.028 / c['abertura'])) if c['abertura'] > 0 else 22.0
    cd.dof.keyframe_insert('focus_distance', frame=f); cd.dof.keyframe_insert('aperture_fstop', frame=f)

# ------------------------------------------------------------------ cortes: nos cortes tudo pula de uma vez (o desfoque de movimento não mistura dois planos)
cortes, ant = [], None
pq = cam_json['por_quadro']
for i in range(1, N):
    p0, p1 = Vector(pq[i - 1]['cam']['pos']), Vector(pq[i]['cam']['pos'])
    a0, a1 = Quaternion(pq[i - 1]['cam']['quat']), Quaternion(pq[i]['cam']['quat'])
    if pq[i]['plano'] != pq[i - 1]['plano'] or (p1 - p0).length > 0.9 or a0.rotation_difference(a1).angle > math.radians(20): cortes.append(i + inicio)
for a in bpy.data.actions:
    for fc in a.fcurves:
        for k in fc.keyframe_points: k.interpolation = 'LINEAR'
        for c in cortes:
            v = fc.evaluate(c)
            fc.keyframe_points.insert(c - 0.5, v, options={'FAST'})
        fc.update()
        for k in fc.keyframe_points:
            if any(abs(k.co.x - (c - 1)) < 1e-3 for c in cortes): k.interpolation = 'CONSTANT'
print('CORTES', len(cortes))

# ------------------------------------------------------------------ céu, sol e névoa
w = bpy.data.worlds.new('mata'); cena.world = w; w.use_nodes = True; wn = w.node_tree
hd = os.path.join(PH, 'hdri', f"{amb['hdri']}_2k.hdr")
if not os.path.exists(hd): hd = os.path.join(PH, 'hdri', f"{amb['hdri']}_1k.hdr")
et = wn.nodes.new('ShaderNodeTexEnvironment'); et.image = bpy.data.images.load(hd); wn.links.new(et.outputs['Color'], wn.nodes['Background'].inputs['Color'])
wn.nodes['Background'].inputs['Strength'].default_value = 1.0
sd = bpy.data.lights.new('sol', 'SUN'); sd.energy = 4.0 * amb['sol']['intensidade'] / 3.4; sd.color = srgb_lin(amb['sol']['cor']); sd.angle = math.radians(2.5)
so = bpy.data.objects.new('sol', sd); cena.collection.objects.link(so)
s0 = pq[0]['sol']; d = (Vector(s0['alvo']) - Vector(s0['pos'])).normalized(); so.rotation_mode = 'QUATERNION'; so.rotation_quaternion = d.to_track_quat('-Z', 'Y')
# névoa igual à da página (exp ao quadrado, mesma cor e densidade), pela passagem de névoa (mist) no compositor; o céu fica limpo
cena.view_layers[0].use_pass_mist = True; w.mist_settings.start = 0; w.mist_settings.depth = 300; w.mist_settings.falloff = 'LINEAR'
cena.use_nodes = True; ct = cena.node_tree
for n in list(ct.nodes): ct.nodes.remove(n)
rl = ct.nodes.new('CompositorNodeRLayers'); out = ct.nodes.new('CompositorNodeComposite')
def mat(op, a, b=None, v=None):
    n = ct.nodes.new('CompositorNodeMath'); n.operation = op
    ct.links.new(a, n.inputs[0])
    if b is not None: ct.links.new(b, n.inputs[1])
    elif v is not None: n.inputs[1].default_value = v
    return n.outputs[0]
dens = amb['nevoa']['densidade'] * 300
x = mat('MULTIPLY', rl.outputs['Mist'], v=dens); x = mat('POWER', x, v=2.0); x = mat('MULTIPLY', x, v=-1.0); x = mat('EXPONENT', x)   # exp(-(dens*d)^2)
um = ct.nodes.new('CompositorNodeValue'); um.outputs[0].default_value = 1.0
fn = ct.nodes.new('CompositorNodeMath'); fn.operation = 'SUBTRACT'; ct.links.new(um.outputs[0], fn.inputs[0]); ct.links.new(x, fn.inputs[1])
# o céu (névoa = 1, sem objeto) fica sem névoa: máscara 0 a partir de 98% da profundidade
mc = ct.nodes.new('CompositorNodeMath'); mc.operation = 'SUBTRACT'; mc.inputs[0].default_value = 0.98; ct.links.new(rl.outputs['Mist'], mc.inputs[1])
mc2 = mat('MULTIPLY', mc.outputs[0], v=50.0); mc2n = ct.nodes.new('CompositorNodeMath'); mc2n.operation = 'MINIMUM'; mc2n.use_clamp = True; ct.links.new(mc2, mc2n.inputs[0]); mc2n.inputs[1].default_value = 1.0
# o céu é uma foto de floresta: recebe 65% da névoa (sem isso as moitas enevoadas ficavam recortadas contra um fundo escuro e nítido)
mascara = mat('ADD', mat('MULTIPLY', mc2n.outputs[0], v=0.35), v=0.65)
fator = mat('MULTIPLY', fn.outputs[0], mascara)
mix = ct.nodes.new('CompositorNodeMixRGB'); ct.links.new(fator, mix.inputs[0]); ct.links.new(rl.outputs['Image'], mix.inputs[1])
mix.inputs[2].default_value = (*srgb_lin(amb['nevoa']['cor']), 1.0)
ct.links.new(mix.outputs[0], out.inputs['Image'])

# ------------------------------------------------------------------ render
r = cena.render; r.engine = 'CYCLES'; r.resolution_x, r.resolution_y, r.resolution_percentage = LARG, ALT, 100
cena.frame_start, cena.frame_end = inicio, inicio + N - 1
cy = cena.cycles; cy.device = 'GPU' if GPU else 'CPU'
cy.samples = 96 if QUAL == 'cinema' else 32; cy.adaptive_threshold = 0.015 if QUAL == 'cinema' else 0.04
cy.use_denoising = True; cy.denoiser = 'OPTIX' if GPU else 'OPENIMAGEDENOISE'
cy.max_bounces, cy.diffuse_bounces, cy.glossy_bounces, cy.transmission_bounces, cy.volume_bounces, cy.transparent_max_bounces = 6, 3, 3, 6, 0, 32
cy.caustics_reflective = cy.caustics_refractive = False; cy.sample_clamp_indirect = 8.0; cy.blur_glossy = 1.0
r.use_motion_blur = True; r.motion_blur_shutter = 0.5
r.use_persistent_data = True                                                          # (o cenário fica na memória entre um quadro e outro)
try:
    cena.view_settings.view_transform = 'AgX'; cena.view_settings.look = 'AgX - Medium High Contrast'
except Exception as e: print('cor:', e)
cena.view_settings.exposure = 0.0
r.image_settings.file_format = 'JPEG'; r.image_settings.quality = 94
r.filepath = os.path.join(QUADROS, 'f#####'); r.use_file_extension = True; r.use_overwrite = False; r.use_placeholder = True   # (retoma de onde parou)
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(SAIDA))
print('PRONTO', SAIDA, 'quadros', inicio, '..', inicio + N - 1, 'cortes', len(cortes))

teste = arg('renderizar')
if teste:
    os.makedirs(QUADROS, exist_ok=True)
    for q in [int(x) for x in teste.split(',')]:
        cena.frame_set(q + inicio); r.filepath = os.path.join(QUADROS, f'teste_{q:05d}.jpg'); bpy.ops.render.render(write_still=True); print('TESTE', q)
