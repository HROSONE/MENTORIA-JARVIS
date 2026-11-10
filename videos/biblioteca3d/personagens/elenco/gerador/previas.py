"""Refaz as imagens de previews/ (WebP) do elenco: grupo, rostos, movimento e a cena de teste.
Precisa de Chromium via Playwright (npm install em videos/) e de Pillow. Sobe sozinho um servidor HTTP em videos/ numa porta livre.
Uso:  python3 previas.py   (a partir desta pasta, depois de rodar gerar.py)"""
import functools
import http.server
import os
import subprocess
import tempfile
import threading
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageDraw, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
ELENCO = os.path.normpath(os.path.join(AQUI, '..'))
VIDEOS = os.path.normpath(os.path.join(AQUI, '..', '..', '..', '..'))
PREV = os.path.join(ELENCO, 'previews')
CAPTURA = os.path.normpath(os.path.join(AQUI, '..', '..', 'corredor', 'gerador', 'captura.js'))
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
ENV = dict(os.environ, BASE='http://127.0.0.1:%d/biblioteca3d/personagens/elenco/' % PORTA)
TMP = tempfile.mkdtemp(prefix='elenco_prev_')
BG = 'fundo=cfd8e0&chao=a9b3bd'
NOMES = [('davi', 'Davi'), ('teo', 'Théo'), ('lia', 'Lia'), ('nina', 'Nina'), ('maniaco', 'Maníaco'), ('velha', 'Dona Lurdes')]
ROSTO = {'davi': (1.17, 0.07, 0.55, 'medo'), 'teo': (1.13, 0.07, 0.55, 'sorriso'), 'lia': (1.16, 0.07, 0.55, 'grito'), 'nina': (1.23, 0.07, 0.56, 'surpresa'),
         'maniaco': (1.74, 0.21, 0.70, 'maldoso'), 'velha': (1.44, 0.19, 0.62, 'raiva')}


def foto(nome, pagina, query, w=800, h=800):
    saida = os.path.join(TMP, nome + '.png')
    r = subprocess.run(['node', CAPTURA, '%s?still=1&%s' % (pagina, query), saida, str(w), str(h)], env=ENV, cwd=VIDEOS, capture_output=True, text=True, timeout=300)
    if not os.path.exists(saida):
        raise RuntimeError(r.stdout + r.stderr)
    return Image.open(saida).convert('RGB')


def sequencia(nome, pagina, query, n, dur, w, h):
    pasta = os.path.join(TMP, nome)
    r = subprocess.run(['node', CAPTURA, '--anim', '%s?still=1&%s' % (pagina, query), pasta, str(n), str(dur), str(w), str(h)], env=ENV, cwd=VIDEOS, capture_output=True, text=True, timeout=1200)
    q = sorted(os.listdir(pasta)) if os.path.isdir(pasta) else []
    if len(q) != n:
        raise RuntimeError(r.stdout + r.stderr)
    return [Image.open(os.path.join(pasta, x)).convert('RGB') for x in q]


def tarefas(lista):
    with ThreadPoolExecutor(max_workers=4) as ex:
        return [f.result() for f in [ex.submit(*t) for t in lista]]


def rotulo(im, texto, xy, tam=22):
    d = ImageDraw.Draw(im)
    f = fonte(tam, True)
    c = d.textbbox(xy, texto, font=f)
    d.rectangle((c[0] - 8, c[1] - 5, c[2] + 8, c[3] + 5), fill=(21, 25, 37))
    d.text(xy, texto, font=f, fill=(244, 239, 230))


def salvar(im, nome, q=82):
    im.save(os.path.join(PREV, nome), quality=q, method=6)
    print(nome, im.size, round(os.path.getsize(os.path.join(PREV, nome)) / 1024), 'KB')


if __name__ == '__main__':
    todos = ','.join(n + '.glb' for n, _ in NOMES)
    # grupo (3/4) e retratos de corpo inteiro
    g = foto('grupo', 'elenco.html', '%s&semgrade=1&f=%s&clip=Parado&t=0.5&esp=0.95&az=18&d=7.2&alvo=0,0.88,0&fov=30' % (BG, todos), 1800, 700)
    salvar(g, 'elenco-grupo.webp')
    # rostos: neutro em cima, expressão em baixo
    jobs = []
    for n, _ in NOMES:
        y, z, d, ex = ROSTO[n]
        jobs.append((foto, 'rn_' + n, 'elenco.html', '%s&semgrade=1&f=%s.glb&clip=Parado&t=0.5&rosto=neutro&az=12&d=%.2f&alvo=0,%.3f,%.3f&fov=28' % (BG, n, d, y, z), 360, 380))
    for n, _ in NOMES:
        y, z, d, ex = ROSTO[n]
        jobs.append((foto, 're_' + n, 'elenco.html', '%s&semgrade=1&f=%s.glb&clip=Parado&t=0.5&rosto=%s:1&az=12&d=%.2f&alvo=0,%.3f,%.3f&fov=28' % (BG, n, d, ex and y, z) if False else
                     '%s&semgrade=1&f=%s.glb&clip=Parado&t=0.5&rosto=%s:1&az=12&d=%.2f&alvo=0,%.3f,%.3f&fov=28' % (BG, n, ex, d, y, z), 360, 380))
    fs = tarefas(jobs)
    folha = Image.new('RGB', (360 * 6, 380 * 2))
    for i, f in enumerate(fs):
        folha.paste(f, ((i % 6) * 360, (i // 6) * 380))
    for i, (n, nome) in enumerate(NOMES):
        rotulo(folha, nome, (i * 360 + 10, 8), 20)
        rotulo(folha, ROSTO[n][3], (i * 360 + 10, 380 + 8), 20)
    salvar(folha.resize((1800, 633), Image.LANCZOS), 'elenco-rostos.webp')
    # movimento: todos no mesmo instante de cada clipe
    mov = [('Andar', 0.22, -70, 7.4, 0.9), ('Correr', 0.14, -70, 7.4, 0.9), ('Fugir', 0.14, -70, 7.4, 0.9), ('Assustado', 0.3, -30, 7.4, 0.9), ('Pular', 0.62, -50, 7.4, 1.0)]
    fs = tarefas([(foto, 'mv_' + c, 'elenco.html', '%s&semgrade=1&f=%s&clip=%s&t=%s&esp=1.05&az=%d&d=%s&alvo=0,%s,0&fov=30' % (BG, todos, c, t, az, d, y), 1800, 560) for c, t, az, d, y in mov])
    folha = Image.new('RGB', (1800, 560 * len(mov)))
    for i, f in enumerate(fs):
        folha.paste(f, (0, i * 560))
        rotulo(folha, mov[i][0], (14, i * 560 + 12), 24)
    salvar(folha.resize((1350, 420 * len(mov)), Image.LANCZOS), 'elenco-movimento.webp')
    # cena de teste: imagem e trecho animado
    salvar(foto('cena', 'cena-susto.html', 't=1.6', 1600, 900), 'cena-susto.webp', 84)
    quadros = sequencia('cena_anim', 'cena-susto.html', 'x=1', 36, 2.4, 800, 450)
    quadros[0].save(os.path.join(PREV, 'cena-susto-anim.webp'), save_all=True, append_images=quadros[1:], duration=67, loop=0, quality=70, method=4)
    print('cena-susto-anim.webp', len(quadros), 'quadros', round(os.path.getsize(os.path.join(PREV, 'cena-susto-anim.webp')) / 1024), 'KB')
