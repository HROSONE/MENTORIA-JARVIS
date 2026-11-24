# Simplifica (decimação) um modelo glTF do Poly Haven no Blender para usar muitas cópias em cena (vegetação, pedras ao longe).
# uso: blender -b --python decimar.py -- <entrada.gltf> <saida.glb> <proporção 0..1>
import bpy, sys
a = sys.argv[sys.argv.index('--') + 1:]
ent, sai, prop = a[0], a[1], float(a[2])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=ent)
antes = depois = 0
for o in bpy.context.scene.objects:
    if o.type != 'MESH': continue
    antes += len(o.data.polygons)
    m = o.modifiers.new('dec', 'DECIMATE'); m.ratio = prop; m.use_collapse_triangulate = True
    bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier=m.name)
    depois += len(o.data.polygons)
bpy.ops.export_scene.gltf(filepath=sai, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=85)
print('DECIMADO', ent, antes, '->', depois)
