# Liga a GPU no Cycles (OptiX na T4; CUDA se OptiX não estiver disponível). O Blender não guarda isso no .blend:
# use em todo render:  blender -b cena.blend -P gpu.py -a
import bpy
p = bpy.context.preferences.addons['cycles'].preferences
for tipo in ('OPTIX', 'CUDA'):
    try:
        p.compute_device_type = tipo; p.get_devices()
        dev = [d for d in p.devices if d.type == tipo]
        if dev:
            for d in p.devices: d.use = d.type == tipo
            print('GPU:', tipo, [d.name for d in dev]); break
    except Exception as e: print('sem', tipo, e)
c = bpy.context.scene.cycles; c.device = 'GPU'
c.denoiser = 'OPTIX' if p.compute_device_type == 'OPTIX' else 'OPENIMAGEDENOISE'
