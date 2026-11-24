# Gera o modelo "lod" (só geometria, poucos milhares de triângulos) de cada planta/pedra espalhada em cena. A câmera usa o modelo cheio de perto e este
# a mais de ~45 m, onde a névoa já escondeu o detalhe: a mata inteira tinha 58 milhões de triângulos por passe de render e mais de 70% deles estavam longe.
# Só a geometria vai no arquivo (sem texturas): o Three.js reaproveita o material do modelo cheio pelo NOME do material (js/selva3d.js: instanciar).
# uso: blender -b --python gerar_lod.py -- <pasta modelo/> id:fonte:alvo [id:fonte:alvo ...]      fonte = leve (a versão do decimar.py) ou 1k; alvo = nº de triângulos
import bpy, os, sys
a = sys.argv[sys.argv.index('--') + 1:]
pasta = a[0]
for item in a[1:]:
    id_, fonte, alvo = item.split(':'); alvo = int(alvo)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    ent = os.path.join(pasta, id_, f'{id_}_leve.glb' if fonte == 'leve' else f'{id_}_1k.gltf')
    bpy.ops.import_scene.gltf(filepath=ent)
    malhas = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    antes = sum(len(o.data.polygons) for o in malhas)
    prop = min(1.0, alvo / max(antes, 1))
    for o in malhas:
        m = o.modifiers.new('dec', 'DECIMATE'); m.ratio = prop; m.use_collapse_triangulate = True
        bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier=m.name)
    depois = sum(len(o.data.polygons) for o in malhas)
    saida = os.path.join(pasta, id_, f'{id_}_lod.glb')
    bpy.ops.export_scene.gltf(filepath=saida, export_format='GLB', export_image_format='NONE')
    print('LOD', id_, antes, '->', depois, f'({os.path.getsize(saida) // 1024} KB)', flush=True)
