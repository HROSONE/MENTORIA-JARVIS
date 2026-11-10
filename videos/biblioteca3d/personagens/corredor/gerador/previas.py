"""Refaz as imagens de previews/ (WebP): vistas, tiras de poses e ciclos animados.
Precisa de Chromium via Playwright (npm install em videos/) e de Pillow. Sobe sozinho um servidor HTTP em videos/ numa porta livre.
Uso:  python3 previas.py            (a partir desta pasta, depois de rodar gerar.py)"""
import functools
import http.server
import os
import subprocess
import tempfile
import threading
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageDraw, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
CORREDOR = os.path.normpath(os.path.join(AQUI, '..'))
VIDEOS = os.path.normpath(os.path.join(AQUI, '..', '..', '..', '..'))
PREV = os.path.join(CORREDOR, 'previews')
os.makedirs(PREV, exist_ok=True)


def fonte(tam, negrito=False):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if negrito else ''), '/Library/Fonts/Arial.ttf', 'C:/Windows/Fonts/arial.ttf'):
        if os.path.exists(f):
            return ImageFont.truetype(f, tam)
    return ImageFont.load_default()


class Silencioso(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Silencioso, directory=VIDEOS))
PORTA = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
ENV = dict(os.environ, BASE='http://127.0.0.1:%d/biblioteca3d/personagens/corredor/' % PORTA)
TMP = tempfile.mkdtemp(prefix='corredor_prev_')
BG = 'fundo=d9dfe6&chao=a9b3bd'


def foto(nome, query, w=800, h=900):
    saida = os.path.join(TMP, nome + '.png')
    r = subprocess.run(['node', os.path.join(AQUI, 'captura.js'), 'corredor.html?still=1&%s&%s' % (BG, query), saida, str(w), str(h)], env=ENV, cwd=VIDEOS,
                       capture_output=True, text=True, timeout=300)
    if not os.path.exists(saida):
        raise RuntimeError(r.stdout + r.stderr)
    return saida


def sequencia(nome, query, n, dur, w=480, h=540):
    pasta = os.path.join(TMP, nome)
    r = subprocess.run(['node', os.path.join(AQUI, 'captura.js'), '--anim', 'corredor.html?still=1&%s&%s' % (BG, query), pasta, str(n), str(dur), str(w), str(h)],
                       env=ENV, cwd=VIDEOS, capture_output=True, text=True, timeout=900)
    quadros = sorted(os.listdir(pasta)) if os.path.isdir(pasta) else []
    if len(quadros) != n:
        raise RuntimeError(r.stdout + r.stderr)
    return [Image.open(os.path.join(pasta, q)).convert('RGB') for q in quadros]


def tarefas(lista):
    with ThreadPoolExecutor(max_workers=4) as ex:
        return [f.result() for f in [ex.submit(*t) for t in lista]]


def rotulo(im, texto, xy=(10, 8), tam=22):
    d = ImageDraw.Draw(im)
    f = fonte(tam, True)
    caixa = d.textbbox(xy, texto, font=f)
    d.rectangle((caixa[0] - 8, caixa[1] - 5, caixa[2] + 8, caixa[3] + 5), fill=(21, 25, 37))
    d.text(xy, texto, font=f, fill=(244, 239, 230))


def salvar(im, nome, q=80):
    im.save(os.path.join(PREV, nome), quality=q, method=6)
    print(nome, im.size, round(os.path.getsize(os.path.join(PREV, nome)) / 1024), 'KB')


def animado(quadros, nome, dur_s, q=72):
    ms = max(20, round(dur_s * 1000 / len(quadros)))
    quadros[0].save(os.path.join(PREV, nome), save_all=True, append_images=quadros[1:], duration=ms, loop=0, quality=q, method=4)
    print(nome, quadros[0].size, len(quadros), 'quadros,', ms, 'ms,', round(os.path.getsize(os.path.join(PREV, nome)) / 1024), 'KB')


if __name__ == '__main__':
    # ---- vistas: linha de cima colorido, linha de baixo silhueta com borda de luz quente
    vistas = [('frente', 0), ('3/4', 40), ('lado', 90), ('costas', 180)]
    jobs = []
    for var, arq in (('c', 'corredor-colorido.glb'), ('s', 'corredor.glb')):
        for nome, az in vistas:
            jobs.append((foto, '%s_%s' % (var, nome.replace('/', '')), 'f=%s&clip=Parado&t=0.5&az=%d&d=4.7&alvo=0,0.93,0&semgrade=1' % (arq, az), 560, 700))
    fotos = tarefas(jobs)
    folha = Image.new('RGB', (560 * 4, 700 * 2), (217, 223, 230))
    for i, f in enumerate(fotos):
        folha.paste(Image.open(f).convert('RGB'), ((i % 4) * 560, (i // 4) * 700))
    for i, (nome, _) in enumerate(vistas):
        rotulo(folha, nome, ((i) * 560 + 12, 10))
    rotulo(folha, 'corredor-colorido.glb', (12, 660), 20)
    rotulo(folha, 'corredor.glb (silhueta)', (12, 700 + 660), 20)
    salvar(folha.resize((1680, 1050), Image.LANCZOS), 'corredor-vistas.webp', 82)

    # ---- tiras de poses (vista lateral) de cada clipe
    tiras = [('Andar', 8, 'esp=0.95&d=4.6', '1,25 m/s · 2 passos por segundo · ciclo de 1,00 s'),
             ('Correr', 8, 'esp=1.15&d=5.1', '3,2 m/s · 2,8 passos por segundo · ciclo de 0,72 s (com fase de voo)'),
             ('Pular', 10, 'esp=1.0&d=5.5', 'salto de 0,31 m · agacha, impulso, voo, aterrissagem amortecida · 1,75 s')]
    fotos = tarefas([(foto, 'tira_' + c, 'f=corredor-colorido.glb&clip=%s&folha=%d&eixo=z&az=-90&alvo=0,%s,0&fov=30&semgrade=1&%s' % (c, n, '1.1' if c == 'Pular' else '0.88', e), 1800, 460)
                     for c, n, e, _ in tiras])
    folha = Image.new('RGB', (1800, 460 * 3), (217, 223, 230))
    for i, f in enumerate(fotos):
        folha.paste(Image.open(f).convert('RGB'), (0, i * 460))
        rotulo(folha, '%s  ·  %s' % (tiras[i][0], tiras[i][3]), (16, i * 460 + 12), 24)
    salvar(folha.resize((1500, 1150), Image.LANCZOS), 'corredor-poses.webp', 82)

    # ---- ciclos animados (câmera 3/4; o chão corre para trás na velocidade do clipe)
    ciclos = [('Andar', 30, 1.0, 'az=-50&d=4.4&alvo=0,0.95,0'), ('Correr', 24, 0.72, 'az=-50&d=4.4&alvo=0,0.9,0'), ('Pular', 42, 1.75, 'az=-50&d=5.8&alvo=0,1.2,0&semgrade=1')]
    seqs = tarefas([(sequencia, 'anim_' + c, 'f=corredor-colorido.glb&clip=%s&%s' % (c, e), n, dur) for c, n, dur, e in ciclos])
    for (c, n, dur, _), q in zip(ciclos, seqs):
        animado(q, 'corredor-%s.webp' % c.lower(), dur)

    # ---- silhueta com borda quente nos três movimentos
    fotos = tarefas([(foto, 'sil_' + c, 'f=corredor.glb&clip=%s&t=%s&az=-55&d=%s&alvo=0,%s,0&semgrade=1' % (c, t, d, y), 600, 800)
                     for c, t, d, y in (('Andar', 0.3, 4.6, 0.95), ('Correr', 0.2, 4.6, 0.9), ('Pular', 0.8, 5.6, 1.2))])
    folha = Image.new('RGB', (1800, 800))
    for i, f in enumerate(fotos):
        folha.paste(Image.open(f).convert('RGB'), (i * 600, 0))
    salvar(folha, 'corredor-silhueta.webp', 82)
