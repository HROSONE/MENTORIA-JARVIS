"""Letreiros, cartazes e marcações desenhados com Pillow (textura PNG embutida no .glb) para os edifícios.
Todos usam a fonte DejaVu Sans Bold e supersampling, como as placas de trânsito."""
import math
from PIL import Image, ImageDraw
import texturas as T

SS = T.SS
BRANCO, VERMELHO, AZUL, AMARELO, PRETO, VERDE = T.BRANCO, T.VERMELHO, T.AZUL, T.AMARELO, T.PRETO, T.VERDE
AZUL_ESC = '#1c2f52'
CINZA_ESC = '#2a2e35'
OURO = '#ffcf4a'


def _ret(d, w, h, x0, y0, x1, y1, raio, **kw):
    d.rounded_rectangle([x0 * w * SS, y0 * h * SS, x1 * w * SS, y1 * h * SS], radius=raio * SS, **kw)


def _cabe(img, txt, w, largura, px0):
    px = px0
    while px > 20 and T.fonte(px * SS).getlength(txt) > largura * w * SS:
        px -= 4
    return px


def cruz(d, cx, cy, r, cor, w, h):
    """cruz de espessura 0,36 r a partir do centro (cx, cy) em pixels de saída"""
    t = r * 0.36
    d.rectangle([(cx - t) * SS, (cy - r) * SS, (cx + t) * SS, (cy + r) * SS], fill=cor)
    d.rectangle([(cx - r) * SS, (cy - t) * SS, (cx + r) * SS, (cy + t) * SS], fill=cor)


def placa_loja(txt='LOJA', cor='#c9382f'):
    w, h = 1024, 192
    img = T.tela(w, h, cor)
    d = ImageDraw.Draw(img)
    _ret(d, w, h, 0.012, 0.06, 0.988, 0.94, 14, outline=BRANCO, width=6 * SS)
    px = _cabe(img, txt, w, 0.8, 150)
    T.texto(img, txt, w / 2, h / 2 + 6, px, BRANCO)
    return T.png(img)


def placa_hospital():
    w, h = 1536, 384
    img = T.tela(w, h, BRANCO)
    d = ImageDraw.Draw(img)
    _ret(d, w, h, 0.008, 0.03, 0.992, 0.97, 22, outline=AZUL, width=12 * SS)
    d.ellipse([(0.045 * w) * SS, (0.12 * h) * SS, (0.045 * w + 0.76 * h) * SS, (0.12 * h + 0.76 * h) * SS], fill=VERMELHO)
    cruz(d, 0.045 * w + 0.38 * h, 0.5 * h, 0.27 * h, BRANCO, w, h)
    T.texto(img, 'HOSPITAL', 0.57 * w, 0.43 * h, _cabe(img, 'HOSPITAL', w, 0.62, 230), AZUL)
    T.texto(img, 'ATENDIMENTO 24 HORAS', 0.57 * w, 0.8 * h, _cabe(img, 'ATENDIMENTO 24 HORAS', w, 0.62, 58), '#5a6572')
    return T.png(img)


def placa_emergencia():
    w, h = 1024, 256
    img = T.tela(w, h, VERMELHO)
    d = ImageDraw.Draw(img)
    _ret(d, w, h, 0.012, 0.05, 0.988, 0.95, 16, outline=BRANCO, width=7 * SS)
    cruz(d, 0.1 * w, 0.5 * h, 0.27 * h, BRANCO, w, h)
    T.texto(img, 'EMERGÊNCIA', 0.56 * w, 0.52 * h, _cabe(img, 'EMERGÊNCIA', w, 0.74, 140), BRANCO)
    return T.png(img)


def helipad():
    n = 512
    img = T.tela(n, n, '#565b62')
    d = ImageDraw.Draw(img)
    _ret(d, n, n, 0.02, 0.02, 0.98, 0.98, 10, outline=AMARELO, width=8 * SS)
    d.ellipse([0.1 * n * SS, 0.1 * n * SS, 0.9 * n * SS, 0.9 * n * SS], outline=AMARELO, width=14 * SS)
    T.texto(img, 'H', n / 2, n / 2 + 10, 330, BRANCO)
    return T.png(img)


def placa_delegacia():
    w, h = 1536, 256
    img = T.tela(w, h, AZUL_ESC)
    d = ImageDraw.Draw(img)
    _ret(d, w, h, 0.008, 0.06, 0.992, 0.94, 14, outline=BRANCO, width=7 * SS)
    T.texto(img, 'DELEGACIA DE POLÍCIA', w / 2, h / 2 + 6, _cabe(img, 'DELEGACIA DE POLÍCIA', w, 0.9, 150), BRANCO)
    return T.png(img)


def placa_policia():
    w, h = 1024, 256
    img = T.tela(w, h, AZUL_ESC)
    d = ImageDraw.Draw(img)
    _ret(d, w, h, 0.012, 0.06, 0.988, 0.94, 14, outline=AMARELO, width=7 * SS)
    T.texto(img, 'POLÍCIA', w / 2, h / 2 + 6, _cabe(img, 'POLÍCIA', w, 0.82, 170), AMARELO)
    return T.png(img)


def estrela(d, cx, cy, r, cor):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * 0.42
        pts.append(((cx + rr * math.cos(a)) * SS, (cy + rr * math.sin(a)) * SS))
    d.polygon(pts, fill=cor)


def brasao_policia():
    n = 512
    img = T.tela(n, n, BRANCO)
    d = ImageDraw.Draw(img)
    d.ellipse([0.02 * n * SS, 0.02 * n * SS, 0.98 * n * SS, 0.98 * n * SS], fill=AZUL_ESC)
    d.ellipse([0.08 * n * SS, 0.08 * n * SS, 0.92 * n * SS, 0.92 * n * SS], outline=AMARELO, width=10 * SS)
    estrela(d, n / 2, n * 0.42, n * 0.27, AMARELO)
    T.texto(img, 'POLÍCIA', n / 2, n * 0.8, 74, BRANCO)
    return T.png(img)


def placa_super():
    w, h = 2048, 320
    img = T.tela(w, h, '#d3202a')
    d = ImageDraw.Draw(img)
    _ret(d, w, h, 0.006, 0.05, 0.994, 0.95, 18, outline=AMARELO, width=12 * SS)
    T.texto(img, 'SUPERMERCADO', w / 2, h / 2 + 8, _cabe(img, 'SUPERMERCADO', w, 0.86, 230), BRANCO)
    return T.png(img)


def placa_super_pilar():
    w, h = 512, 1024
    img = T.tela(w, h, AZUL_ESC)
    d = ImageDraw.Draw(img)
    _ret(d, w, h, 0.02, 0.01, 0.98, 0.99, 26, outline=BRANCO, width=10 * SS)
    d.rectangle([0.04 * w * SS, 0.06 * h * SS, 0.96 * w * SS, 0.52 * h * SS], fill='#d3202a')
    T.texto(img, 'SUPER', w / 2, 0.29 * h, _cabe(img, 'SUPER', w, 0.82, 170), BRANCO)
    T.texto(img, 'HRYZ', w / 2, 0.68 * h, _cabe(img, 'HRYZ', w, 0.82, 190), AMARELO)
    T.texto(img, 'OFERTAS TODO DIA', w / 2, 0.88 * h, _cabe(img, 'OFERTAS TODO DIA', w, 0.84, 52), BRANCO)
    return T.png(img)


def placa_cinema():
    w, h = 2048, 384
    img = T.tela(w, h, '#14161c')
    d = ImageDraw.Draw(img)
    _ret(d, w, h, 0.006, 0.05, 0.994, 0.95, 22, outline=OURO, width=12 * SS)
    px = _cabe(img, 'CINEMA', w, 0.7, 290)
    for off, cor in ((7, '#7a1d12'), (0, '#ffe58a')):
        T.texto(img, 'CINEMA', w / 2 + off * 0.3, h / 2 + 10 + off * 0.3, px, cor)
    for i in range(36):
        x = (0.03 + i * 0.94 / 35) * w
        for y in (0.1 * h, 0.9 * h):
            d.ellipse([(x - 7) * SS, (y - 7) * SS, (x + 7) * SS, (y + 7) * SS], fill=OURO)
    return T.png(img)


def placa_cinema_vertical():
    w, h = 384, 1536
    img = T.tela(w, h, '#14161c')
    d = ImageDraw.Draw(img)
    _ret(d, w, h, 0.03, 0.006, 0.97, 0.994, 22, outline='#e8452c', width=12 * SS)
    letras = 'CINEMA'
    for i, ch in enumerate(letras):
        y = h * (0.09 + i * 0.155)
        T.texto(img, ch, w / 2 + 3, y + 3, 190, '#7a1d12')
        T.texto(img, ch, w / 2, y, 190, '#ff6a4d')
    return T.png(img)


def cartaz(titulo, c1, c2, motivo):
    w, h = 512, 768
    img = Image.new('RGBA', (w * SS, h * SS), c1)
    d = ImageDraw.Draw(img)
    # degradê vertical
    a = tuple(int(c1[i:i + 2], 16) for i in (1, 3, 5))
    b = tuple(int(c2[i:i + 2], 16) for i in (1, 3, 5))
    for y in range(h * SS):
        t = y / (h * SS)
        d.line([(0, y), (w * SS, y)], fill=tuple(int(a[k] + (b[k] - a[k]) * t) for k in range(3)))
    cx, cy = w / 2, h * 0.38
    if motivo == 'lua':
        d.ellipse([(cx - 120) * SS, (cy - 120) * SS, (cx + 120) * SS, (cy + 120) * SS], fill='#fff3c4')
        d.ellipse([(cx - 60) * SS, (cy - 150) * SS, (cx + 150) * SS, (cy + 60) * SS], fill=c1)
        for k in range(3):
            d.polygon([((60 + k * 180) * SS, h * 0.72 * SS), ((130 + k * 180) * SS, h * 0.5 * SS), ((220 + k * 180) * SS, h * 0.72 * SS)], fill='#0d1020')
    elif motivo == 'gato':
        d.ellipse([(cx - 105) * SS, (cy - 80) * SS, (cx + 105) * SS, (cy + 120) * SS], fill='#10121a')
        d.polygon([((cx - 100) * SS, (cy - 40) * SS), ((cx - 80) * SS, (cy - 150) * SS), ((cx - 20) * SS, (cy - 80) * SS)], fill='#10121a')
        d.polygon([((cx + 100) * SS, (cy - 40) * SS), ((cx + 80) * SS, (cy - 150) * SS), ((cx + 20) * SS, (cy - 80) * SS)], fill='#10121a')
        for sx in (-1, 1):
            d.ellipse([(cx + sx * 45 - 20) * SS, (cy - 5) * SS, (cx + sx * 45 + 20) * SS, (cy + 35) * SS], fill='#9dff6a')
            d.ellipse([(cx + sx * 45 - 5) * SS, (cy + 2) * SS, (cx + sx * 45 + 5) * SS, (cy + 28) * SS], fill='#10121a')
    elif motivo == 'aviao':
        d.polygon([((cx - 190) * SS, (cy + 30) * SS), ((cx + 190) * SS, (cy - 20) * SS), ((cx + 200) * SS, (cy - 5) * SS), ((cx - 160) * SS, (cy + 60) * SS)], fill=BRANCO)
        d.polygon([((cx - 20) * SS, (cy + 20) * SS), ((cx + 60) * SS, (cy - 120) * SS), ((cx + 90) * SS, (cy - 115) * SS), ((cx + 50) * SS, (cy + 10) * SS)], fill='#dfe6ee')
        d.polygon([((cx - 20) * SS, (cy + 35) * SS), ((cx + 40) * SS, (cy + 150) * SS), ((cx + 75) * SS, (cy + 140) * SS), ((cx + 40) * SS, (cy + 20) * SS)], fill='#dfe6ee')
        d.ellipse([(cx - 250) * SS, (h * 0.62) * SS, (cx - 130) * SS, (h * 0.68) * SS], fill='#cfe0f5')
    elif motivo == 'sol':
        d.ellipse([(cx - 130) * SS, (cy - 130) * SS, (cx + 130) * SS, (cy + 130) * SS], fill='#ffd24a')
        for k in range(12):
            ang = k * math.pi / 6
            d.line([((cx + math.cos(ang) * 150) * SS, (cy + math.sin(ang) * 150) * SS), ((cx + math.cos(ang) * 200) * SS, (cy + math.sin(ang) * 200) * SS)], fill='#ffd24a', width=14 * SS)
        T.texto(img, '?', cx, cy + 6, 220, '#c9382f')
    d.rectangle([0, int(h * 0.78) * SS, w * SS, h * SS], fill='#0b0c10')
    px = _cabe(img, titulo, w, 0.86, 74)
    T.texto(img, titulo, w / 2, h * 0.865, px, OURO)
    T.texto(img, 'EM CARTAZ', w / 2, h * 0.945, 36, BRANCO)
    return T.png(img)


def placar():
    w, h = 1024, 384
    img = T.tela(w, h, '#0e1116')
    d = ImageDraw.Draw(img)
    _ret(d, w, h, 0.01, 0.03, 0.99, 0.97, 18, outline='#4c5560', width=10 * SS)
    T.texto(img, 'CASA', 0.2 * w, 0.2 * h, 64, BRANCO)
    T.texto(img, 'VISITANTE', 0.78 * w, 0.2 * h, 64, BRANCO)
    T.texto(img, '2', 0.2 * w, 0.58 * h, 200, '#ffd24a')
    T.texto(img, '1', 0.78 * w, 0.58 * h, 200, '#ffd24a')
    T.texto(img, 'X', 0.49 * w, 0.58 * h, 110, '#8b95a3')
    T.texto(img, '63:21', 0.49 * w, 0.2 * h, 70, '#6bff7a')
    return T.png(img)


def placa_estadio():
    w, h = 2048, 320
    img = T.tela(w, h, '#14306b')
    d = ImageDraw.Draw(img)
    _ret(d, w, h, 0.006, 0.05, 0.994, 0.95, 18, outline=BRANCO, width=12 * SS)
    T.texto(img, 'ESTÁDIO HRYZ', w / 2, h / 2 + 8, _cabe(img, 'ESTÁDIO HRYZ', w, 0.86, 230), BRANCO)
    return T.png(img)


def placa_cruz():
    n = 256
    img = T.tela(n, n, BRANCO)
    d = ImageDraw.Draw(img)
    _ret(d, n, n, 0.03, 0.03, 0.97, 0.97, 14, outline=VERMELHO, width=8 * SS)
    cruz(d, n / 2, n / 2, n * 0.32, VERMELHO, n, n)
    return T.png(img)
