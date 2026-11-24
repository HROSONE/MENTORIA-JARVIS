# Teste de velocidade do Blender sem placa de vídeo: renderiza a cena padrão (cubo) em 540x960 com o motor pedido.
# uso: blender -b --python teste_render.py -- CYCLES|BLENDER_EEVEE_NEXT saida.png
import bpy, time, sys
a = sys.argv[sys.argv.index('--') + 1:]
s = bpy.context.scene
s.render.engine = a[0]
s.render.resolution_x, s.render.resolution_y, s.render.resolution_percentage = 1080, 1920, 50
if a[0] == 'CYCLES':
    s.cycles.device = 'CPU'; s.cycles.samples = 32; s.cycles.use_denoising = True
s.render.filepath = a[1]
t = time.time(); bpy.ops.render.render(write_still=True); print('TEMPO', a[0], round(time.time() - t, 2))
