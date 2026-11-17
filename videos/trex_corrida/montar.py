# Montagem final do Short "Você fugiria de um T. rex?": quadros renderizados (720x1280, 30 fps) -> MP4 1080x1920 com acabamento
# (ampliação lanczos, cor, vinheta, grão de filme) e o visual de "volta no tempo" nos planos R1 e R2 (a imagem já vem de trás para a frente
# do próprio render; aqui entra a aberração de cor, o desfoque leve, a cor lavada e o grão mais forte). Trilha de efeitos do sfx_trex.py.
# uso: python3 montar.py <pasta_quadros> <sfx.wav ou -> <saida.mp4> [--ate N]
import json, os, subprocess, sys, tempfile

FPS = 30
AQUI = os.path.dirname(os.path.abspath(__file__))
pasta, sfx, saida = sys.argv[1], sys.argv[2], sys.argv[3]
ate = int(sys.argv[sys.argv.index('--ate') + 1]) if '--ate' in sys.argv else None
quadros = sorted(f for f in os.listdir(pasta) if f.startswith('f') and f.endswith('.jpg'))
if ate: quadros = quadros[:ate]
N = len(quadros)
if N == 0: sys.exit(f'Nenhum quadro em {pasta}: o render não gerou imagens (veja a mensagem de erro da célula do render).')

# janelas de volta no tempo: os planos "R..." da linha do tempo (gravados em eventos.json pelo eventos.js)
planos = json.load(open(os.path.join(AQUI, 'eventos.json')))['planos']
volta = [(p['t0'], p['t1']) for p in planos if p['nome'].startswith('R')]
dentro = '+'.join(f'between(t,{a:.3f},{b:.3f})' for a, b in volta) or '0'

lista = tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False)
for q in quadros: lista.write(f"file '{os.path.abspath(os.path.join(pasta, q))}'\nduration {1 / FPS:.6f}\n")
lista.write(f"file '{os.path.abspath(os.path.join(pasta, quadros[-1]))}'\n"); lista.close()

filtro = ','.join([
    'scale=1080:1920:flags=lanczos',
    'eq=contrast=1.05:saturation=1.05:gamma=0.98',
    f"eq=saturation=0.55:contrast=1.12:enable='{dentro}'",                          # volta no tempo: cor lavada
    'vignette=angle=PI/5:mode=forward',
    f"rgbashift=rh=-10:bh=10:enable='{dentro}'",                                     # aberração de cor
    f"gblur=sigma=1.6:steps=1:enable='{dentro}'",
    'unsharp=5:5:0.35',
    'noise=alls=5:allf=t',                                                          # grão de filme leve
    f"noise=alls=14:allf=t:enable='{dentro}'",                                       # e mais forte na volta no tempo
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
