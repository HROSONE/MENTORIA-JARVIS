"""Cercas, muros e portões. Cada peça é um trecho de 12 m ao longo de X (de -6 a +6), com a origem no centro, no chão (y = 0).
A face de fora aponta para +Z. Os trechos se emendam pelas pontas: os postes das extremidades ficam em x = -6 e x = +6
(dois trechos seguidos sobrepõem o mesmo poste, idêntico, sem problema)."""
import io
import math
import random
from PIL import Image, ImageDraw
from glb import Material
from malha import Malha, T, Ry, V
from paleta import *

L = 12.0
M2 = L / 2


def picket(m, mat, x, z, w, h, y0=0.05, esp=0.025, ponta=0.06):
    """ripa com a ponta em V"""
    yt = y0 + h
    pts = [(x - w / 2, y0), (x + w / 2, y0), (x + w / 2, yt - ponta), (x, yt), (x - w / 2, yt - ponta)]
    m.poly(mat, [(px, py, z + esp / 2) for px, py in pts], (0, 0, 1))
    m.poly(mat, [(px, py, z - esp / 2) for px, py in pts], (0, 0, -1))
    n = len(pts)
    for i in range(n):
        a, b = pts[i], pts[(i + 1) % n]
        mid = ((a[0] + b[0]) / 2 - x, (a[1] + b[1]) / 2 - (y0 + h / 2))
        m.quad(mat, (a[0], a[1], z - esp / 2), (b[0], b[1], z - esp / 2), (b[0], b[1], z + esp / 2), (a[0], a[1], z + esp / 2), (mid[0], mid[1], 0))


def poste_quadrado(m, mat, mat_topo, x, z, s, h, topo='piramide'):
    m.caixa(mat, x - s / 2, x + s / 2, 0, h, z - s / 2, z + s / 2)
    if topo == 'piramide':
        a = s / 2 * 1.15
        c = (x, h + s * 0.45, z)
        base = [(x - a, h, z - a), (x + a, h, z - a), (x + a, h, z + a), (x - a, h, z + a)]
        for i in range(4):
            m.poly(mat_topo, [base[i], base[(i + 1) % 4], c], (base[i][0] + base[(i + 1) % 4][0] - 2 * x, 1.0, base[i][2] + base[(i + 1) % 4][2] - 2 * z))
        m.poly(mat_topo, base, (0, -1, 0))
    elif topo == 'tampa':
        a = s / 2 * 1.3
        m.caixa(mat_topo, x - a, x + a, h, h + 0.06, z - a, z + a, '+x-x+y+z-z-y')


# ---------------------------------------------------------------- cerca de madeira (ripas brancas)
def cerca_madeira(portao=False):
    m, postes = Malha(), Malha()
    abertura = (-1.8, 1.8) if portao else None
    for x in (-6, -4, -2, 0, 2, 4, 6):
        if abertura and abertura[0] < x < abertura[1]:
            continue
        poste_quadrado(postes, BRANCO_PURO, BRANCO_PURO, x, 0, 0.12, 1.2)
    trilhos = Malha()
    for y in (0.3, 0.78):
        if abertura:
            trilhos.caixa(MOLDURA_BRANCA, -M2, abertura[0], y, y + 0.06, -0.075, -0.015)
            trilhos.caixa(MOLDURA_BRANCA, abertura[1], M2, y, y + 0.06, -0.075, -0.015)
        else:
            trilhos.caixa(MOLDURA_BRANCA, -M2, M2, y, y + 0.06, -0.075, -0.015)
    n = int(L / 0.15)
    for i in range(n):
        x = -M2 + 0.075 + i * (L / n)
        if abertura and abertura[0] - 0.12 < x < abertura[1] + 0.12:
            continue
        if any(abs(x - px) < 0.1 for px in (-6, -4, -2, 0, 2, 4, 6)) and not abertura:
            continue
        picket(m, BRANCO_PURO, x, 0.04, 0.09, 1.0)
    nos = [('Postes', postes), ('Trilhos', trilhos), ('Ripas', m)]
    if portao:
        g = Malha()
        for px in (-1.8, 1.8):
            poste_quadrado(postes, BRANCO_PURO, BRANCO_PURO, px, 0, 0.16, 1.45, 'tampa')
        for lado in (-1, 1):
            x0, x1 = (0.04, 1.72) if lado > 0 else (-1.72, -0.04)
            g.caixa(MOLDURA_BRANCA, x0, x1, 0.18, 0.24, 0.0, 0.05)
            g.caixa(MOLDURA_BRANCA, x0, x1, 1.05, 1.11, 0.0, 0.05)
            xs = [x0 + 0.04 + i * (x1 - x0 - 0.08) / 10 for i in range(11)]
            for x in xs:
                picket(g, BRANCO_PURO, x, 0.052, 0.09, 1.0, y0=0.1)
            # travessa em diagonal
            g.tubo(MOLDURA_BRANCA, (x0 + 0.05, 0.22, 0.062), (x1 - 0.05, 1.08, 0.062), 0.025, 0.025, 4)
        nos.append(('Portao', g))
    return nos


# ---------------------------------------------------------------- cerca rural
def cerca_rural():
    p, t = Malha(), Malha()
    for x in (-6, -3, 0, 3, 6):
        p.caixa(MADEIRA_ESCURA, x - 0.08, x + 0.08, 0, 1.3, -0.08, 0.08)
        p.caixa(MADEIRA_ESCURA, x - 0.09, x + 0.09, 1.3, 1.34, -0.09, 0.09)
    for y in (0.35, 0.72, 1.08):
        for a in range(4):
            x0 = -M2 + a * 3.0 + (0.04 if a else 0)
            t.caixa(MADEIRA, x0, x0 + 3.0 - 0.04, y, y + 0.13, 0.08, 0.13)
    return [('Postes', p), ('Tabuas', t)]


# ---------------------------------------------------------------- alambrado
def textura_tela():
    S, N = 8, 64
    img = Image.new('RGBA', (N * S, N * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c, w = N * S / 2, 4.2 * S / 2
    pts = [(0, c), (c, 0), (2 * c, c), (c, 2 * c)]
    for i in range(4):
        d.line([pts[i], pts[(i + 1) % 4]], fill=(172, 180, 186, 255), width=int(w * 2))
    for p in pts:
        d.ellipse([p[0] - w, p[1] - w, p[0] + w, p[1] + w], fill=(172, 180, 186, 255))
    img = img.resize((N, N), Image.LANCZOS)
    b = io.BytesIO(); img.save(b, 'PNG', optimize=True)
    return b.getvalue()


def alambrado():
    p, tr, tela = Malha(), Malha(), Malha()
    H = 2.4
    for x in (-6, -3, 0, 3, 6):
        p.cyl(METAL, x, 0, 0, 0.045, H + 0.05, 10)
        p.cyl(METAL_ESCURO, x, 0, 0, 0.08, 0.04, 10)
        p.esfera(METAL, (x, H + 0.06, 0), 0.05, 8, 4)
    tr.tubo(METAL, (-M2, H - 0.03, 0), (M2, H - 0.03, 0), 0.03, 0.03, 8)
    tr.tubo(METAL, (-M2, 0.12, 0), (M2, 0.12, 0), 0.025, 0.025, 8)
    mat = Material('TelaAlambrado', '#ffffff', rough=0.6, texture=textura_tela(), alpha='BLEND', double_sided=True, repeat=True)
    k = 0.095
    vb = (H - 0.15) / k                       # o v cresce para baixo na imagem: topo = 0, base = altura / lado do losango
    tela.quad(mat, (-M2, 0.12, 0.012), (M2, 0.12, 0.012), (M2, H - 0.03, 0.012), (-M2, H - 0.03, 0.012), (0, 0, 1),
              uvs=[(0, vb), (L / k, vb), (L / k, 0.0), (0, 0.0)])
    return [('Postes', p), ('Travessas', tr), ('Tela', tela)]


# ---------------------------------------------------------------- muros
def muro(portao=False, cor=PAREDE_BRANCA, cor_pilar=PAREDE_CONCRETO):
    pil, par, topo = Malha(), Malha(), Malha()
    xs = [-6, -3, 0, 3, 6]
    aberto = (-2.0, 2.0) if portao else None
    for x in xs:
        if aberto and aberto[0] < x < aberto[1]:
            continue
        pil.caixa(cor_pilar, x - 0.22, x + 0.22, 0, 1.65, -0.22, 0.22)
        topo.caixa(CONCRETO_CLARO, x - 0.29, x + 0.29, 1.65, 1.72, -0.29, 0.29)
        topo.caixa(CONCRETO_CLARO, x - 0.2, x + 0.2, 1.72, 1.78, -0.2, 0.2)
    trechos = [(-6, 6)] if not aberto else [(-6, aberto[0]), (aberto[1], 6)]
    for a, b in trechos:
        par.caixa(cor, a, b, 0, 1.3, -0.1, 0.1)
        par.caixa(CONCRETO_CLARO, a, b, 1.3, 1.36, -0.15, 0.15)
        par.caixa(RODAPE, a, b, 0, 0.22, -0.12, 0.12)
    nos = [('Pilares', pil), ('Muro', par), ('Capeamento', topo)]
    if portao:
        pil2 = Malha()
        for px in (-2.0, 2.0):
            pil2.caixa(cor_pilar, px - 0.28, px + 0.28, 0, 2.05, -0.28, 0.28)
            topo.caixa(CONCRETO_CLARO, px - 0.36, px + 0.36, 2.05, 2.12, -0.36, 0.36)
            topo.caixa(CONCRETO_CLARO, px - 0.25, px + 0.25, 2.12, 2.2, -0.25, 0.25)
            topo.esfera(CONCRETO_CLARO, (px, 2.32, 0), 0.14, 8, 4)
        g = Malha()
        for lado in (-1, 1):
            x0, x1 = (0.04, 1.72) if lado > 0 else (-1.72, -0.04)
            g.caixa(PRETO, x0, x1, 0.2, 0.26, -0.03, 0.03)
            g.caixa(PRETO, x0, x1, 1.55, 1.61, -0.03, 0.03)
            g.caixa(PRETO, x0, x0 + 0.05, 0.2, 1.61, -0.03, 0.03)
            g.caixa(PRETO, x1 - 0.05, x1, 0.2, 1.61, -0.03, 0.03)
            n = 11
            for i in range(n):
                x = x0 + 0.06 + i * (x1 - x0 - 0.12) / (n - 1)
                g.caixa(PRETO, x - 0.012, x + 0.012, 0.12, 1.62, -0.012, 0.012)
                g.poly(PRETO, [(x - 0.022, 1.62, -0.022), (x + 0.022, 1.62, -0.022), (x + 0.022, 1.62, 0.022), (x - 0.022, 1.62, 0.022)], (0, -1, 0))
                g.poly(PRETO, [(x - 0.022, 1.62, -0.022), (x + 0.022, 1.62, -0.022), (x, 1.78, 0)], (0, 0, -1))
                g.poly(PRETO, [(x + 0.022, 1.62, 0.022), (x - 0.022, 1.62, 0.022), (x, 1.78, 0)], (0, 0, 1))
                g.poly(PRETO, [(x - 0.022, 1.62, 0.022), (x - 0.022, 1.62, -0.022), (x, 1.78, 0)], (-1, 0, 0))
                g.poly(PRETO, [(x + 0.022, 1.62, -0.022), (x + 0.022, 1.62, 0.022), (x, 1.78, 0)], (1, 0, 0))
        nos = [('Pilares', pil), ('PilaresPortao', pil2), ('Muro', par), ('Capeamento', topo), ('Portao', g)]
    return nos


# ---------------------------------------------------------------- cerca viva
def cerca_viva(semente=5):
    rng = random.Random(semente)
    m, m2 = Malha(), Malha()
    n = 16
    w = L / n
    for i in range(n):
        x0 = -M2 + i * w
        h = 1.12 + rng.uniform(-0.07, 0.07)
        ch = 0.2
        alvo = m if i % 2 == 0 else m2
        mat = FOLHA_2 if i % 2 == 0 else FOLHA_4
        # perfil em z: base de 0,95, ombro e topo plano
        pts = [(-0.48, 0), (0.48, 0), (0.48, h - ch), (0.3, h), (-0.3, h), (-0.48, h - ch)]
        topo_mat = FOLHA_1 if i % 2 == 0 else FOLHA_3
        a = [(x0, py, pz) for pz, py in pts]
        b = [(x0 + w, py, pz) for pz, py in pts]
        for k in range(len(pts)):
            k2 = (k + 1) % len(pts)
            if k == 0:
                continue                       # base
            mid = ((pts[k][0] + pts[k2][0]) / 2, (pts[k][1] + pts[k2][1]) / 2 - h / 2)
            alvo.quad(topo_mat if k in (2, 3, 4) else mat, a[k], b[k], b[k2], a[k2], (0, mid[1], mid[0]))
        alvo.poly(mat, [a[0], a[5], a[4], a[3], a[2], a[1]], (-1, 0, 0))
        alvo.poly(mat, [b[0], b[1], b[2], b[3], b[4], b[5]], (1, 0, 0))
    return [('Sebe', m), ('SebeClara', m2)]


# ---------------------------------------------------------------- grade de ferro
def grade_ferro():
    p, b, tr = Malha(), Malha(), Malha()
    for x in (-6, -3, 0, 3, 6):
        p.caixa(PAREDE_CONCRETO, x - 0.16, x + 0.16, 0, 2.15, -0.16, 0.16)
        p.caixa(CONCRETO_CLARO, x - 0.21, x + 0.21, 2.15, 2.22, -0.21, 0.21)
        p.esfera(CONCRETO_CLARO, (x, 2.36, 0), 0.13, 8, 4)
    for y in (0.3, 1.65):
        tr.caixa(PRETO, -M2, M2, y, y + 0.05, -0.02, 0.02)
    n = 80
    for i in range(n):
        x = -M2 + 0.08 + i * (L - 0.16) / (n - 1)
        if any(abs(x - px) < 0.2 for px in (-6, -3, 0, 3, 6)):
            continue
        b.caixa(PRETO, x - 0.012, x + 0.012, 0.05, 1.82, -0.012, 0.012)
        a = 0.022
        pts = [(x - a, 1.82, -a), (x + a, 1.82, -a), (x + a, 1.82, a), (x - a, 1.82, a)]
        c = (x, 1.97, 0)
        for k in range(4):
            q0, q1 = pts[k], pts[(k + 1) % 4]
            b.poly(PRETO, [q0, q1, c], ((q0[0] + q1[0]) / 2 - x, 0.4, (q0[2] + q1[2]) / 2))
        b.poly(PRETO, pts, (0, -1, 0))
    return [('Pilares', p), ('Grade', b), ('Travessas', tr)]


PECAS = {
    'cerca-madeira': (lambda: cerca_madeira(False), 'Cerca de ripas brancas de 1,2 m, trecho de 12 m ao longo de X, frente +Z'),
    'cerca-madeira-portao': (lambda: cerca_madeira(True), 'Cerca de ripas brancas com portão de duas folhas de 3,6 m no meio'),
    'cerca-rural': (cerca_rural, 'Cerca de fazenda: postes de madeira e três tábuas, 1,3 m'),
    'alambrado': (alambrado, 'Alambrado de 2,4 m (postes de metal e tela de losangos translúcida) para quadras, campos e terrenos'),
    'muro': (lambda: muro(False), 'Muro de 1,3 m com pilares de 1,65 m a cada 3 m e capeamento'),
    'muro-portao': (lambda: muro(True), 'Muro com portão de ferro de duas folhas de 4 m e pilares altos'),
    'cerca-viva': (cerca_viva, 'Cerca viva (sebe) de 1,1 m de altura e 1 m de largura'),
    'grade-ferro': (grade_ferro, 'Grade de ferro de 1,9 m com lanças e pilares de concreto (hospital, delegacia, praça)'),
}
