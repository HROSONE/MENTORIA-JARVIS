"""Desenha as faces das placas de trânsito (Pillow, com supersampling para bordas suaves) e devolve bytes PNG."""
import io
import math
from PIL import Image, ImageDraw, ImageFont

FONTE = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
BRANCO, VERMELHO, AZUL, AMARELO, PRETO, VERDE = '#ffffff', '#d3202a', '#1b4fa3', '#f6c500', '#15171a', '#1c7a4d'
SS = 3                       # fator de supersampling


def fonte(px):
    try:
        return ImageFont.truetype(FONTE, int(px))
    except OSError:
        return ImageFont.load_default()


def tela(w, h, cor=BRANCO):
    return Image.new('RGBA', (w * SS, h * SS), cor)


def poligono_escalado(pts, k, c=None):
    cx, cy = c or (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))
    return [(cx + (x - cx) * k, cy + (y - cy) * k) for x, y in pts]


def texto(img, s, cx, cy, px, cor, anchor='mm'):
    d = ImageDraw.Draw(img)
    d.text((cx * SS, cy * SS), s, fill=cor, font=fonte(px * SS), anchor=anchor)


def png(img):
    w, h = img.size
    img = img.resize((w // SS, h // SS), Image.LANCZOS)
    b = io.BytesIO(); img.save(b, 'PNG', optimize=True)
    return b.getvalue()


def octogono(n=512):
    r = n / 2 / math.cos(math.pi / 8)
    return [(n / 2 + r * math.cos(math.pi / 8 + i * math.pi / 4), n / 2 + r * math.sin(math.pi / 8 + i * math.pi / 4)) for i in range(8)]


def face_pare():
    n = 512
    img = tela(n, n, BRANCO); d = ImageDraw.Draw(img)
    pts = [(x * SS, y * SS) for x, y in poligono_escalado(octogono(n), 0.93, (n / 2, n / 2))]
    d.polygon(pts, fill=VERMELHO)
    texto(img, 'PARE', n / 2, n / 2 + 6, 150, BRANCO)
    return png(img)


def face_preferencia():
    n = 512
    img = tela(n, n, BRANCO); d = ImageDraw.Draw(img)
    tri = [(0, 0), (n, 0), (n / 2, n)]                       # triângulo com a ponta para baixo (ocupa toda a textura)
    d.polygon([(x * SS, y * SS) for x, y in poligono_escalado(tri, 0.94)], fill=VERMELHO)
    d.polygon([(x * SS, y * SS) for x, y in poligono_escalado(tri, 0.60)], fill=BRANCO)
    return png(img)


def face_velocidade(v):
    n = 512
    img = tela(n, n, BRANCO); d = ImageDraw.Draw(img)
    d.ellipse([0.015 * n * SS, 0.015 * n * SS, 0.985 * n * SS, 0.985 * n * SS], fill=VERMELHO)
    d.ellipse([0.13 * n * SS, 0.13 * n * SS, 0.87 * n * SS, 0.87 * n * SS], fill=BRANCO)
    texto(img, str(v), n / 2, n / 2 + 4, 230, PRETO)
    return png(img)


def face_sentido_proibido():
    n = 512
    img = tela(n, n, BRANCO); d = ImageDraw.Draw(img)
    d.ellipse([0.015 * n * SS, 0.015 * n * SS, 0.985 * n * SS, 0.985 * n * SS], fill=VERMELHO)
    d.rounded_rectangle([0.2 * n * SS, 0.43 * n * SS, 0.8 * n * SS, 0.57 * n * SS], radius=8 * SS, fill=BRANCO)
    return png(img)


def face_proibido_estacionar():
    n = 512
    img = tela(n, n, BRANCO); d = ImageDraw.Draw(img)
    d.ellipse([0.015 * n * SS, 0.015 * n * SS, 0.985 * n * SS, 0.985 * n * SS], fill=VERMELHO)
    d.ellipse([0.1 * n * SS, 0.1 * n * SS, 0.9 * n * SS, 0.9 * n * SS], fill=AZUL)
    texto(img, 'E', n / 2, n / 2 + 8, 300, BRANCO)
    # tarja diagonal vermelha (do canto superior esquerdo ao inferior direito)
    a = math.radians(45); w = 0.075 * n; c = n / 2; L = 0.395 * n
    dx, dy = math.cos(a) * L, math.sin(a) * L
    nx, ny = -math.sin(a) * w, math.cos(a) * w
    d.polygon([((c - dx + nx) * SS, (c - dy + ny) * SS), ((c + dx + nx) * SS, (c + dy + ny) * SS),
               ((c + dx - nx) * SS, (c + dy - ny) * SS), ((c - dx - nx) * SS, (c - dy - ny) * SS)], fill=VERMELHO)
    return png(img)


def face_pedestres():
    n = 512
    img = tela(n, n, PRETO); d = ImageDraw.Draw(img)
    rombo = [(n / 2, 0), (n, n / 2), (n / 2, n), (0, n / 2)]
    d.polygon([(x * SS, y * SS) for x, y in poligono_escalado(rombo, 0.90)], fill=AMARELO)

    def L(p, q, w):
        d.line([(p[0] * n * SS, p[1] * n * SS), (q[0] * n * SS, q[1] * n * SS)], fill=PRETO, width=int(w * n * SS), joint='curve')
        for t in (p, q):
            d.ellipse([(t[0] - w / 2) * n * SS, (t[1] - w / 2) * n * SS, (t[0] + w / 2) * n * SS, (t[1] + w / 2) * n * SS], fill=PRETO)
    r = 0.06
    d.ellipse([(0.5 - r) * n * SS, (0.28 - r) * n * SS, (0.5 + r) * n * SS, (0.28 + r) * n * SS], fill=PRETO)
    L((0.5, 0.38), (0.48, 0.58), 0.085)                 # tronco
    L((0.5, 0.42), (0.40, 0.55), 0.045)                 # braço de trás
    L((0.5, 0.42), (0.60, 0.53), 0.045)                 # braço da frente
    L((0.48, 0.58), (0.40, 0.76), 0.055)                # perna de trás
    L((0.48, 0.58), (0.58, 0.72), 0.055)                # perna da frente
    L((0.58, 0.72), (0.62, 0.78), 0.05)
    L((0.40, 0.76), (0.36, 0.78), 0.05)
    return png(img)


def face_sentido_obrigatorio():
    n = 512
    img = tela(n, n, BRANCO); d = ImageDraw.Draw(img)
    d.ellipse([0.015 * n * SS, 0.015 * n * SS, 0.985 * n * SS, 0.985 * n * SS], fill=AZUL)
    d.rounded_rectangle([0.43 * n * SS, 0.42 * n * SS, 0.57 * n * SS, 0.80 * n * SS], radius=6 * SS, fill=BRANCO)
    d.polygon([(0.28 * n * SS, 0.45 * n * SS), (0.72 * n * SS, 0.45 * n * SS), (0.5 * n * SS, 0.17 * n * SS)], fill=BRANCO)
    return png(img)


def face_rua(texto_rua, cor=VERDE, w=1024, h=256):
    img = tela(w, h, BRANCO); d = ImageDraw.Draw(img)
    d.rounded_rectangle([0.012 * w * SS, 0.045 * h * SS, 0.988 * w * SS, 0.955 * h * SS], radius=18 * SS, fill=cor)
    d.rounded_rectangle([0.03 * w * SS, 0.12 * h * SS, 0.97 * w * SS, 0.88 * h * SS], radius=12 * SS, outline=BRANCO, width=5 * SS)
    px = 170
    while px > 40 and fonte(px * SS).getlength(texto_rua) > 0.84 * w * SS:
        px -= 4                                       # reduz até caber com folga
    texto(img, texto_rua, w / 2, h / 2 + 4, px, BRANCO)
    return png(img)
