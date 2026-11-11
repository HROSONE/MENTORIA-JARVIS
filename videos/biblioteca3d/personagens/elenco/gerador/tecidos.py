"""Texturas procedurais pequenas (PNG em bytes) para as roupas: xadrez, floral, listras, jeans, tricô."""
import io
import math
import random
from PIL import Image, ImageDraw, ImageFilter


def _png(im):
    b = io.BytesIO()
    im.save(b, 'PNG', optimize=True)
    return b.getvalue()


def xadrez(c1, c2, c3, n=128):
    """xadrez tipo escocês: fundo c1, faixas largas c2, faixas finas c3 (uma repetição = um quadrado do desenho)"""
    im = Image.new('RGB', (n, n), c1)
    d = ImageDraw.Draw(im, 'RGBA')
    L, f = n // 4, n // 16
    for k in range(2):
        for off in ((k * n // 2),):
            d.rectangle((off, 0, off + L, n), fill=c2 + (150,))
            d.rectangle((0, off, n, off + L), fill=c2 + (150,))
    for off in (n // 8, n // 8 + n // 2):
        d.rectangle((off, 0, off + f, n), fill=c3 + (255,))
        d.rectangle((0, off, n, off + f), fill=c3 + (255,))
    return _png(im)


def floral(fundo, flores, n=256, semente=3, miolo=(250, 220, 120)):
    rnd = random.Random(semente)
    im = Image.new('RGB', (n, n), fundo)
    d = ImageDraw.Draw(im)
    for _ in range(26):
        x, y = rnd.randrange(n), rnd.randrange(n)
        r = rnd.randrange(9, 17)
        cor = flores[rnd.randrange(len(flores))]
        for dx in (-n, 0, n):
            for dy in (-n, 0, n):
                for k in range(5):
                    a = 2 * math.pi * k / 5 + rnd.random() * 0.2
                    px, py = x + dx + math.cos(a) * r * 0.9, y + dy + math.sin(a) * r * 0.9
                    d.ellipse((px - r * 0.62, py - r * 0.62, px + r * 0.62, py + r * 0.62), fill=cor)
                d.ellipse((x + dx - r * 0.42, y + dy - r * 0.42, x + dx + r * 0.42, y + dy + r * 0.42), fill=miolo)
        fol = (60, 110, 70)
        for k in range(2):
            a = rnd.random() * 6.28
            d.ellipse((x + math.cos(a) * r * 1.9 - 5, y + math.sin(a) * r * 1.9 - 3, x + math.cos(a) * r * 1.9 + 5, y + math.sin(a) * r * 1.9 + 3), fill=fol)
    return _png(im)


def listras(c1, c2, n=64, grossura=0.5, vertical=False):
    im = Image.new('RGB', (n, n), c1)
    d = ImageDraw.Draw(im)
    h = int(n * grossura)
    if vertical:
        d.rectangle((0, 0, h, n), fill=c2)
    else:
        d.rectangle((0, 0, n, h), fill=c2)
    return _png(im)


def jeans(base, n=128, semente=1):
    rnd = random.Random(semente)
    im = Image.new('RGB', (n, n), base)
    px = im.load()
    for y in range(n):
        for x in range(n):
            v = (x % 3 == 0) * 6 + (y % 2 == 0) * 4 + rnd.randrange(-4, 5)
            px[x, y] = tuple(max(0, min(255, c + v - 5)) for c in base)
    return _png(im.filter(ImageFilter.GaussianBlur(0.4)))


def trico(base, n=128):
    """malha de tricô: coluninhas em V"""
    im = Image.new('RGB', (n, n), base)
    d = ImageDraw.Draw(im)
    esc = tuple(int(c * 0.78) for c in base)
    cla = tuple(min(255, int(c * 1.12)) for c in base)
    for i in range(0, n, 8):
        for j in range(0, n, 8):
            d.line((i, j, i + 4, j + 7), fill=esc, width=2)
            d.line((i + 8, j, i + 4, j + 7), fill=cla, width=2)
    return _png(im)


def fios(cor, n=256, semente=7):
    """fios de cabelo: listras finas verticais (do alto da cabeça para a linha do cabelo) mais claras e mais escuras que `cor`, com um leve brilho"""
    rnd = random.Random(semente)
    im = Image.new('RGB', (n, n), cor)
    d = ImageDraw.Draw(im, 'RGBA')
    for _ in range(n * 2):
        x = rnd.randrange(n)
        v = rnd.randrange(-34, 40)
        c = tuple(max(0, min(255, k + v)) for k in cor)
        w = rnd.choice((1, 1, 2))
        ond = rnd.random() * 6
        pts = [(x + math.sin(y * 0.05 + ond) * 1.6, y) for y in range(0, n + 8, 8)]
        d.line(pts, fill=c + (rnd.randrange(60, 170),), width=w)
    for _ in range(6):
        x = rnd.randrange(n)
        d.rectangle((x, 0, x + 3, n), fill=(255, 245, 235, 22))
    return _png(im.filter(ImageFilter.GaussianBlur(0.4)))
