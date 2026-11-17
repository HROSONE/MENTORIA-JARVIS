# T. REX PRONTO + ESQUELETO DO CANAL: põe o esqueleto do nosso T. rex (mesmos nomes de ossos do criar_trex.py, que o trex_corrida/js/trex.js usa)
# no modelo "Tyrant King - Tyrannosaurus" de Marcel Schanz (Sketchfab, licença CC BY 4.0, uso comercial permitido; crédito obrigatório:
# "Tyrant King - Tyrannosaurus" by Marcel Schanz, https://sketchfab.com/3d-models/tyrant-king-tyrannosaurus-6465a297fa784598adc49f6e0042d449).
# O modelo original vem sem esqueleto, olhando para -Y, com 3,31 de comprimento: aqui ele gira para olhar para +X, cresce para 12,3 m (Sue,
# FMNH PR 2081) com os pés em z = 0, ganha os ossos nas articulações medidas no próprio contorno dele e pesos automáticos, com a boca corrigida
# (acima da linha entre as fileiras de dentes = crânio, abaixo = mandíbula). A boca do modelo já vem entreaberta (~20°): é a pose de repouso.
#
# 1) baixar o GLB pela API do Sketchfab (precisa de conta) e converter o material para metal/rugosidade (o Three.js não lê specular-glossiness):
#      npx @gltf-transform/cli metalrough modelo_sketchfab.glb tk.glb
# 2) blender -b --python rigar_tyrant_king.py -- tk.glb trex.glb
import bpy, sys, math
from mathutils import Matrix, Vector

ent, sai = sys.argv[sys.argv.index('--') + 1:][:2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=ent, merge_vertices=True)                    # junta os vértices duplicados nas costuras do UV (senão a malha vira pedaços soltos e os pesos racham)
cena = bpy.context.scene
S = 12.3 / 3.312                                                                 # comprimento do focinho à ponta da cauda: 12,3 m
T = Matrix.Scale(S, 4) @ Matrix.Rotation(math.radians(90), 4, 'Z')              # cabeça de -Y para +X
malhas = [o for o in bpy.data.objects if o.type == 'MESH']
for o in malhas:
    mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = T @ mw
for o in list(bpy.data.objects):
    if o.type == 'EMPTY': bpy.data.objects.remove(o, do_unlink=True)
for o in malhas:
    for x in bpy.context.selected_objects: x.select_set(False)
    o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
pele = next(o for o in malhas if 'Body' in o.name); pele.name = pele.data.name = 'trex_pele'
olho = next(o for o in malhas if 'Eye' in o.name); olho.name = olho.data.name = 'olho'
zmin = min((pele.matrix_world @ v.co).z for v in pele.data.vertices)
for o in malhas:
    for v in o.data.vertices: v.co.z -= zmin

# esqueleto (x frente, z cima, y esquerda): mesmos nomes e hierarquia do criar_trex.py
ad = bpy.data.armatures.new('esqueleto'); arm = bpy.data.objects.new('trex_esqueleto', ad); cena.collection.objects.link(arm)
for x in bpy.context.selected_objects: x.select_set(False)
arm.select_set(True); bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
def osso(nome, a, b, pai=None, liga=True):
    e = ad.edit_bones.new(nome); e.head = a; e.tail = b
    if pai: e.parent = ad.edit_bones[pai]; e.use_connect = liga and (Vector(a) - ad.edit_bones[pai].tail).length < 1e-4
    return e
osso('raiz', (0, 0, 0), (0, 0, 0.5), liga=False)
osso('quadril', (0, 0, 3.0), (0.9, 0, 3.0), 'raiz', False)
osso('coluna1', (0.9, 0, 3.0), (1.8, 0, 3.05), 'quadril'); osso('peito', (1.8, 0, 3.05), (2.7, 0, 3.1), 'coluna1')
osso('pescoco1', (2.7, 0, 3.1), (3.25, 0, 3.3), 'peito'); osso('pescoco2', (3.25, 0, 3.3), (3.85, 0, 3.5), 'pescoco1')
osso('cabeca', (3.85, 0, 3.5), (5.6, 0, 3.35), 'pescoco2'); osso('mandibula', (4.30, 0, 3.06), (5.30, 0, 2.62), 'cabeca', False)
xs_c = [-0.3, -1.1, -1.9, -2.7, -3.5, -4.3, -5.0, -5.8, -6.6]; prev = 'quadril'
for k in range(8):
    osso(f'cauda{k + 1}', (xs_c[k], 0, 3.0 + 0.016 * k), (xs_c[k + 1], 0, 3.0 + 0.016 * (k + 1)), prev, k > 0); prev = f'cauda{k + 1}'
for l, s in (('l', 1), ('r', -1)):
    osso(f'coxa_{l}', (0.0, 0.55 * s, 2.85), (0.55, 0.74 * s, 1.75), 'quadril', False); osso(f'canela_{l}', (0.55, 0.74 * s, 1.75), (-0.30, 0.79 * s, 0.85), f'coxa_{l}')
    osso(f'metatarso_{l}', (-0.30, 0.79 * s, 0.85), (-0.15, 0.80 * s, 0.15), f'canela_{l}'); osso(f'dedos_{l}', (-0.15, 0.80 * s, 0.15), (0.60, 0.85 * s, 0.05), f'metatarso_{l}')
    osso(f'braco_{l}', (2.75, 0.38 * s, 2.50), (3.00, 0.52 * s, 2.20), 'peito', False); osso(f'antebraco_{l}', (3.00, 0.52 * s, 2.20), (3.18, 0.48 * s, 1.95), f'braco_{l}')
    osso(f'mao_{l}', (3.18, 0.48 * s, 1.95), (3.30, 0.45 * s, 1.82), f'antebraco_{l}')
bpy.ops.object.mode_set(mode='OBJECT')

def ativo(o, *sel):
    for x in list(bpy.context.selected_objects): x.select_set(False)
    for x in sel: x.select_set(True)
    o.select_set(True); bpy.context.view_layer.objects.active = o
ativo(arm, pele); bpy.ops.object.parent_set(type='ARMATURE_AUTO')
if not any(len(v.groups) for v in pele.data.vertices[:3000]): ativo(arm, pele); bpy.ops.object.parent_set(type='ARMATURE_ENVELOPE'); print('PESOS: envelope')
# pesos: (1) o cálculo automático falha nas peças soltas da malha (garras, dentes): ficavam paradas no lugar quando o pé andava. Vértice
# sem peso copia os pesos do vértice com peso mais perto. (2) suaviza todos os grupos (a junção quadril/cauda fazia um vinco quando o corpo inclinava).
from mathutils import kdtree
com = [v for v in pele.data.vertices if sum(g.weight for g in v.groups) > 1e-3]
kd = kdtree.KDTree(len(com))
for k, v in enumerate(com): kd.insert(v.co, k)
kd.balance(); sem = 0
for v in pele.data.vertices:
    if sum(g.weight for g in v.groups) < 1e-3:                                  # copia os pesos do vértice com peso mais perto (a garra segue o dedo)
        _, k, _ = kd.find(v.co)
        for g in com[k].groups: pele.vertex_groups[g.group].add([v.index], g.weight, 'REPLACE')
        sem += 1
print('SEM PESO (garras, dentes soltos):', sem)
ativo(pele); bpy.ops.object.mode_set(mode='WEIGHT_PAINT')
bpy.ops.object.vertex_group_smooth(group_select_mode='ALL', factor=0.5, repeat=6, expand=0.0)
bpy.ops.object.vertex_group_normalize_all(lock_active=False); bpy.ops.object.mode_set(mode='OBJECT')
# boca: abaixo da linha entre as fileiras de dentes (da articulação em x 4,30 descendo 15°) é mandíbula, acima é crânio; o resto da cabeça é rígido
gC, gM = pele.vertex_groups['cabeca'], pele.vertex_groups['mandibula']
linha = lambda x: 3.07 - math.tan(math.radians(15)) * (x - 4.30)
for v in pele.data.vertices:
    c = v.co
    if c.x < 3.95: continue
    km = min(1.0, max(0.0, (c.x - 4.05) / 0.25)) if c.z < linha(c.x) else 0.0
    for g in list(v.groups): pele.vertex_groups[g.group].remove([v.index])
    if km < 1: gC.add([v.index], 1 - km, 'REPLACE')
    if km > 0: gM.add([v.index], km, 'REPLACE')
# olho preso ao crânio
bpy.context.view_layer.update(); mw = olho.matrix_world.copy()
ativo(arm, olho); ad.bones.active = ad.bones['cabeca']; bpy.ops.object.parent_set(type='BONE', keep_transform=True)
for x in bpy.context.view_layer.objects: x.select_set(False)
arm.select_set(True); pele.select_set(True); olho.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.export_scene.gltf(filepath=sai, export_format='GLB', use_selection=True, export_skins=True, export_animations=False, export_image_format='AUTO')
print('GLB', sai, 'ossos', len(ad.bones), 'faces', len(pele.data.polygons))
