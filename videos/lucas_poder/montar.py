# Montagem final do Short "Ele podia voar": quadros renderizados (720x1280, 30 fps) -> MP4 1080x1920 com acabamento
# (ampliação lanczos, cor, vinheta, grão de filme), o "rebobinar" no corte gancho -> viatura e a trilha de efeitos.
# uso: python3 montar.py <pasta_quadros> <sfx.wav ou -> <saida.mp4> [--ate N]
import os, subprocess, sys, tempfile

FPS = 30
pasta, sfx, saida = sys.argv[1], sys.argv[2], sys.argv[3]
ate = int(sys.argv[sys.argv.index('--ate') + 1]) if '--ate' in sys.argv else None
quadros = sorted(f for f in os.listdir(pasta) if f.startswith('f') and f.endswith('.jpg'))
if ate: quadros = quadros[:ate]
N = len(quadros)

# rebobinar: os últimos 10 quadros do gancho (3,67 a 4,0 s) viram o gancho inteiro passando de trás para frente, rápido
seq = list(range(N))
R0, R1 = 110, 120
if N > R1:
    for k, i in enumerate(range(R0, R1)): seq[i] = int(R0 * (1 - (k + 1) / (R1 - R0 + 1)))

lista = tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False)
for i in seq: lista.write(f"file '{os.path.abspath(os.path.join(pasta, quadros[i]))}'\nduration {1 / FPS:.6f}\n")
lista.write(f"file '{os.path.abspath(os.path.join(pasta, quadros[seq[-1]]))}'\n"); lista.close()

r0, r1 = R0 / FPS, R1 / FPS
filtro = ','.join([
    'scale=1080:1920:flags=lanczos',
    'eq=contrast=1.04:saturation=1.06:gamma=0.98',
    'vignette=angle=PI/5:mode=forward',
    f"rgbashift=rh=-8:bh=8:enable='between(t,{r0:.3f},{r1:.3f})'",              # aberração no rebobinar
    f"gblur=sigma=2.5:steps=1:enable='between(t,{r0:.3f},{r1:.3f})'",
    'unsharp=5:5:0.35',
    'noise=alls=5:allf=t',                                                         # grão de filme leve
    'format=yuv420p',
])
cmd = ['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', lista.name]
if sfx != '-': cmd += ['-i', sfx]
cmd += ['-vf', filtro, '-r', str(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-maxrate', '2500k', '-bufsize', '5000k', '-movflags', '+faststart']
if sfx != '-': cmd += ['-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '160k', '-shortest']
cmd += [saida]
subprocess.run(cmd, check=True)
os.unlink(lista.name)
mb = os.path.getsize(saida) / 1e6
print(f'ok {saida} {N} quadros {N / FPS:.1f} s {mb:.1f} MB')
if mb > 20: print('ATENÇÃO: passou de 20 MB')
