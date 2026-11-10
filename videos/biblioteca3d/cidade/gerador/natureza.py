"""Natureza: árvores (copas facetadas, estilo low poly), arbustos e gramados.
Origem no pé (y = 0); sobre a grama do kit coloque em y = 0,15. Os gramados são ladrilhos de 12 x 12 m com o topo em y = 0,15
(o mesmo nível do `chao-grama` e das calçadas) e as bordas lisas, então encaixam na grade sem emendas."""
import math
import random
import numpy as np
from glb import Material
from malha import Malha, T, Ry, Rx, V
from paleta import *
import ruas

CH = ruas.CH
LH = ruas.LH


# ---------------------------------------------------------------- árvores
def tronco(m, mat, h, r0, r1, segs=8):
    """tronco de cone com a base alargada (raízes)"""
    m.revolve(mat, [(0, 0), (r0 * 1.5, 0), (r0 * 1.25, 0.16), (r0, 0.5), (r1, h)], segs, smooth=True, hard_deg=40)


def galho(m, mat, p0, p1, r0, r1):
    m.tubo(mat, p0, p1, r0, r1, 7)
    m.esfera(mat, p1, r1 * 1.05, 7, 4)


def copa(m, folhas, blobs, rng, nivel=1, jitter=0.14):
    """copa feita de esferas facetadas. blobs = [(x, y, z, r)] ou com achatamento (x, y, z, r, ey).
    O material vem de `folhas` (do mais escuro ao mais claro) conforme a altura relativa do blob: embaixo escuro, em cima claro."""
    ys = [b[1] for b in blobs]
    y0, y1 = min(ys), max(ys)
    for b in blobs:
        x, y, z, r = b[:4]
        ey = b[4] if len(b) > 4 else 1.0
        t = 0.0 if y1 == y0 else (y - y0) / (y1 - y0)
        k = min(len(folhas) - 1, int(t * len(folhas) + rng.random() * 0.6))
        m.ico(folhas[k], (x, y, z), r, nivel, jitter, rng, esc=(1.0, ey, 1.0))


def arvore_redonda(semente=3, folhas=(FOLHA_4, FOLHA_2, FOLHA_1, FOLHA_3), altura=6.0, raio=2.1):
    rng = random.Random(semente)
    t, c = Malha(), Malha()
    tronco(t, TRONCO, altura * 0.46, 0.22, 0.15)
    cy = altura * 0.66
    blobs = [(0, cy, 0, raio), (raio * 0.55, cy - 0.35, raio * 0.25, raio * 0.68), (-raio * 0.5, cy - 0.3, -raio * 0.2, raio * 0.7),
             (raio * 0.1, cy + raio * 0.62, raio * 0.05, raio * 0.62), (-raio * 0.2, cy - 0.5, raio * 0.55, raio * 0.58), (raio * 0.25, cy - 0.45, -raio * 0.55, raio * 0.55)]
    copa(c, list(folhas), blobs, rng)
    galho(t, TRONCO, (0, altura * 0.38, 0), (raio * 0.45, altura * 0.6, raio * 0.15), 0.08, 0.05)
    galho(t, TRONCO, (0, altura * 0.4, 0), (-raio * 0.4, altura * 0.58, -raio * 0.1), 0.07, 0.045)
    return [('Tronco', t), ('Copa', c)]


def arvore_frondosa():
    """árvore grande de sombra (mangueira): tronco grosso, dois galhos mestres e copa larga"""
    rng = random.Random(11)
    t, c = Malha(), Malha()
    tronco(t, TRONCO, 3.6, 0.42, 0.28)
    galho(t, TRONCO, (0, 3.0, 0), (1.9, 5.1, 0.5), 0.2, 0.12)
    galho(t, TRONCO, (0, 3.2, 0), (-1.8, 5.3, -0.6), 0.19, 0.11)
    galho(t, TRONCO, (0, 3.4, 0), (0.2, 5.8, 1.7), 0.17, 0.1)
    blobs = [(0, 7.2, 0, 2.5, 0.85), (2.6, 6.5, 0.6, 2.0, 0.85), (-2.6, 6.7, -0.5, 2.1, 0.85), (0.3, 6.3, 2.7, 1.9, 0.85), (-0.4, 6.5, -2.7, 2.0, 0.85),
             (1.6, 8.2, -0.8, 1.7), (-1.5, 8.3, 1.0, 1.7), (3.5, 5.9, -1.6, 1.4, 0.85), (-3.4, 6.0, 1.9, 1.5, 0.85), (0.2, 8.9, 0.2, 1.3)]
    copa(c, [FOLHA_4, FOLHA_2, FOLHA_1, FOLHA_3], blobs, rng, nivel=1, jitter=0.15)
    return [('Tronco', t), ('Copa', c)]


def arvore_pinheiro():
    t, c = Malha(), Malha()
    tronco(t, TRONCO, 2.4, 0.2, 0.12)
    for k in range(6):
        rb = 2.15 * (1 - k * 0.145)
        y0 = 1.3 + k * 1.22
        c.facetado(FOLHA_PINHO_1 if k % 2 == 0 else FOLHA_PINHO_2, [(rb, y0), (rb * 0.45, y0 + 1.15), (0.0, y0 + 2.05)], 8, giro=k * 0.4)
        c.poly(FOLHA_PINHO_1, [(rb * math.cos(k * 0.4 + 2 * math.pi * i / 8), y0, rb * math.sin(k * 0.4 + 2 * math.pi * i / 8)) for i in range(8)], (0, -1, 0))
    return [('Tronco', t), ('Copa', c)]


def arvore_cipreste():
    rng = random.Random(5)
    t, c = Malha(), Malha()
    tronco(t, TRONCO, 1.4, 0.16, 0.1)
    blobs = [(0, 2.3 + i * 1.15, 0, 1.0 - abs(i - 2) * 0.12, 1.25) for i in range(5)]
    for i, (x, y, z, r, ey) in enumerate(blobs):
        c.ico(FOLHA_PINHO_1 if i % 2 == 0 else FOLHA_PINHO_2, (x, y, z), r * 0.95, 1, 0.1, rng, esc=(0.8, ey, 0.8))
    c.ico(FOLHA_PINHO_2, (0, 7.2, 0), 0.6, 1, 0.08, rng, esc=(0.7, 1.5, 0.7))
    return [('Tronco', t), ('Copa', c)]


def arvore_ipe(amarelo=True):
    """ipê em flor: copa irregular e baixa, toda amarela ou rosa"""
    folhas = (FOLHA_IPE_2, FOLHA_IPE_1, FOLHA_IPE_3) if amarelo else (FOLHA_ROSA_2, FOLHA_ROSA_1, FOLHA_ROSA_3)
    rng = random.Random(21 if amarelo else 22)
    t, c = Malha(), Malha()
    tronco(t, TRONCO, 2.5, 0.2, 0.13)
    galho(t, TRONCO, (0, 2.1, 0), (1.3, 3.7, 0.3), 0.09, 0.05)
    galho(t, TRONCO, (0, 2.2, 0), (-1.2, 3.8, -0.4), 0.09, 0.05)
    galho(t, TRONCO, (0, 2.4, 0), (0.1, 4.0, 1.1), 0.08, 0.05)
    blobs = [(0, 4.5, 0, 1.9, 0.8), (1.9, 4.1, 0.4, 1.3, 0.8), (-1.8, 4.2, -0.3, 1.4, 0.8), (0.2, 5.4, 0.1, 1.2), (-0.3, 4.0, 1.7, 1.2, 0.8), (0.5, 4.0, -1.7, 1.2, 0.8),
             (1.2, 5.0, -1.0, 1.0), (-1.1, 5.1, 1.0, 1.0)]
    copa(c, list(folhas), blobs, rng, nivel=1, jitter=0.17)
    return [('Tronco', t), ('Copa', c)]


def arvore_palmeira():
    rng = random.Random(8)
    t, f, co = Malha(), Malha(), Malha()
    # tronco levemente curvo, com anéis
    pts = [(0.0, 0.0), (0.12, 1.2), (0.28, 2.5), (0.34, 3.8), (0.25, 5.2), (0.05, 6.6), (-0.22, 7.9)]
    for i in range(len(pts) - 1):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        r0, r1 = 0.2 - i * 0.012, 0.2 - (i + 1) * 0.012
        t.tubo(TRONCO_CLARO, (x0, y0, 0), (x1, y1, 0), r0, r1, 8)
        for k in range(1, 5):
            s = k / 5
            t.cyl(TRONCO, x0 + (x1 - x0) * s, y0 + (y1 - y0) * s - 0.03, 0, r0 + (r1 - r0) * s + 0.025, 0.06, 8, caps=False)
    t.cyl(TRONCO, 0, 0, 0, 0.3, 0.1, 8)
    topo = np.array([-0.22, 7.95, 0.0])
    # folhas: cada uma é uma fita curva em duas metades (nervura no meio) que cai com o peso
    for k in range(10):
        a = 2 * math.pi * k / 10 + rng.uniform(-0.12, 0.12)
        L = 3.5 + rng.uniform(-0.3, 0.4)
        sobe = rng.uniform(0.9, 1.5)
        dirv = np.array([math.cos(a), 0, math.sin(a)])
        lat = np.array([-math.sin(a), 0, math.cos(a)])
        mat = FOLHA_PALMA_1 if k % 2 == 0 else FOLHA_PALMA_2
        N = 8
        pos = []
        for i in range(N + 1):
            s = i / N
            p = topo + dirv * (L * s) + V(0, sobe * math.sin(math.pi * s * 0.75) - 1.35 * s * s * 1.2, 0)
            w = 0.62 * math.sin(math.pi * min(1, s * 1.05)) ** 0.7 + 0.03
            pos.append((p, w))
        for i in range(N):
            (p0, w0), (p1, w1) = pos[i], pos[i + 1]
            for lado in (1, -1):
                a0 = p0 + lat * w0 * lado + V(0, -0.22 * w0, 0)
                a1 = p1 + lat * w1 * lado + V(0, -0.22 * w1, 0)
                f.quad(mat, p0, p1, a1, a0, (0, 1, 0))
    for (x, y, z) in ((0.05, 7.55, 0.2), (-0.35, 7.5, -0.15), (0.0, 7.45, -0.3)):
        co.ico(COCO, (x - 0.22, y, z), 0.17, 1, 0.05, rng)
    return [('Tronco', t), ('Folhas', f), ('Cocos', co)]


def arbusto(flores=None, semente=2):
    """arbusto baixo de 1,1 m; com `flores` (material) ganha bolinhas de flor"""
    rng = random.Random(semente)
    c, fl = Malha(), Malha()
    blobs = [(0, 0.55, 0, 0.62, 0.85), (0.5, 0.42, 0.18, 0.46, 0.85), (-0.48, 0.44, -0.12, 0.48, 0.85), (0.05, 0.52, 0.5, 0.4, 0.85), (-0.1, 0.5, -0.5, 0.42, 0.85), (0.1, 0.85, 0.0, 0.34)]
    copa(c, [FOLHA_4, FOLHA_2, FOLHA_1], blobs, rng, nivel=1, jitter=0.12)
    if flores is not None:
        for i in range(22):
            a = rng.uniform(0, 2 * math.pi)
            h = rng.uniform(0.3, 1.0)
            r = 0.72 * math.sqrt(max(0.0, 1 - ((h - 0.55) / 0.55) ** 2)) * 0.97
            fl.ico(flores, (r * math.cos(a), h, r * math.sin(a)), 0.07, 0, 0.0, rng)
    return [('Folhas', c)] + ([('Flores', fl)] if flores is not None else [])


# ---------------------------------------------------------------- gramados (ladrilhos de 12 x 12 m)
def malha_gramado(rng, n=8, amp=0.035, pesos=(0.42, 0.34, 0.24)):
    """chão facetado: grade n x n de células com vértices internos levemente irregulares (as bordas ficam em y = 0,15, lisas)
    e três tons de verde sorteados por célula."""
    g = Malha()
    mats = [GRAMA_A, GRAMA_B, GRAMA_C]
    p = 2 * LH / n
    H = [[CH + (0 if i in (0, n) or j in (0, n) else rng.uniform(-amp, amp)) for j in range(n + 1)] for i in range(n + 1)]
    P = lambda i, j: (-LH + i * p, H[i][j], -LH + j * p)
    for i in range(n):
        for j in range(n):
            m = rng.choices(mats, weights=pesos)[0]
            a, b, c, d = P(i, j), P(i, j + 1), P(i + 1, j + 1), P(i + 1, j)
            if (i + j) % 2:
                g.tri(m, a, b, c); g.tri(m, a, c, d)
            else:
                g.tri(m, a, b, d); g.tri(m, b, c, d)
    return g


def tufos(rng, n=330, dmin=0.46, lim=5.75):
    """tufos de capim (5 lâminas de um triângulo cada, material de dupla face), espalhados sem encostar uns nos outros"""
    t = Malha()
    pontos = []
    tent = 0
    while len(pontos) < n and tent < n * 60:
        tent += 1
        x, z = rng.uniform(-lim, lim), rng.uniform(-lim, lim)
        if all((x - px) ** 2 + (z - pz) ** 2 > dmin * dmin for px, pz in pontos):
            pontos.append((x, z))
    for x, z in pontos:
        mat = TUFO_A if rng.random() < 0.55 else TUFO_B
        h0 = rng.uniform(0.14, 0.3)
        for k in range(5):
            a = rng.uniform(0, 2 * math.pi)
            d = V(math.cos(a), 0, math.sin(a))
            lado = V(-math.sin(a), 0, math.cos(a))
            base = V(x, CH, z) + d * rng.uniform(0.0, 0.06) + lado * rng.uniform(-0.04, 0.04)
            h = h0 * rng.uniform(0.7, 1.15)
            ponta = base + d * (h * rng.uniform(0.25, 0.6)) + V(0, h, 0)
            w = rng.uniform(0.035, 0.06)
            t.tri(mat, base - lado * w, base + lado * w, ponta)
    return t


def flores(rng, n=70, lim=5.6, dmin=0.7, tipos=(FLOR_BRANCA, FLOR_AMARELA, FLOR_ROSA, FLOR_ROXA, FLOR_VERMELHA)):
    """florzinhas: haste fina e uma cabeça de 8 faces"""
    f, h = Malha(), Malha()
    pontos = []
    tent = 0
    while len(pontos) < n and tent < n * 80:
        tent += 1
        x, z = rng.uniform(-lim, lim), rng.uniform(-lim, lim)
        if all((x - px) ** 2 + (z - pz) ** 2 > dmin * dmin for px, pz in pontos):
            pontos.append((x, z))
    for x, z in pontos:
        alt = rng.uniform(0.18, 0.32)
        a = rng.uniform(0, 2 * math.pi)
        topo = V(x + math.cos(a) * 0.03, CH + alt, z + math.sin(a) * 0.03)
        base = V(x, CH, z)
        lado = V(-math.sin(a), 0, math.cos(a))
        h.tri(TUFO_B, base - lado * 0.012, base + lado * 0.012, topo)
        cab = rng.choice(tipos)
        r = rng.uniform(0.045, 0.07)
        f.ico(cab, topo + V(0, r * 0.4, 0), r, 0, 0.0, rng)
    return f, h


def gramado_detalhado(com_flores=False, semente=7):
    rng = random.Random(semente)
    nos = [('Gramado', malha_gramado(rng)), ('Tufos', tufos(rng))]
    if com_flores:
        f, h = flores(rng)
        nos += [('Flores', f), ('Hastes', h)]
    return nos


def gramado_listrado(faixas=6, semente=3):
    """gramado de campo/jardim com faixas de corte alternadas (claro e escuro), liso"""
    g, g2 = Malha(), Malha()
    w = 2 * LH / faixas
    for i in range(faixas):
        (g if i % 2 == 0 else g2).top(GRAMA_B if i % 2 == 0 else GRAMA_C, -LH + i * w, -LH + (i + 1) * w, -LH, LH, CH)
    return [('FaixasClaras', g), ('FaixasEscuras', g2)]


def tufos_avulsos():
    """punhado de capim e flores soltos (1 m de raio) para espalhar à mão: bordas de canteiro, pés de árvore"""
    rng = random.Random(4)
    t = Malha()
    for k in range(9):
        a = rng.uniform(0, 2 * math.pi); r = 0.45 * math.sqrt(rng.random())
        x, z = r * math.cos(a), r * math.sin(a)
        mat = TUFO_A if k % 2 else TUFO_B
        for j in range(6):
            b = rng.uniform(0, 2 * math.pi)
            d = V(math.cos(b), 0, math.sin(b)); lado = V(-math.sin(b), 0, math.cos(b))
            base = V(x, 0, z) + d * rng.uniform(0, 0.05)
            h = rng.uniform(0.2, 0.42)
            t.tri(mat, base - lado * 0.05, base + lado * 0.05, base + d * (h * 0.4) + V(0, h, 0))
    f, hh = flores(rng, n=6, lim=0.45, dmin=0.2)
    f2, h2 = Malha(), Malha()
    f2.add(f, T(0, -CH, 0)); h2.add(hh, T(0, -CH, 0))
    return [('Capim', t), ('Flores', f2), ('Hastes', h2)]


PECAS = {
    'arvore-redonda': (arvore_redonda, 'Árvore redonda de 6 m (copa facetada em quatro tons de verde)', {'tipo': 'arvore', 'altura': 6.0}),
    'arvore-frondosa': (arvore_frondosa, 'Árvore grande de sombra (mangueira) de 10 m, copa de 9 m de largura', {'tipo': 'arvore', 'altura': 10.0}),
    'arvore-pinheiro': (arvore_pinheiro, 'Pinheiro de 8,5 m em seis andares de cone', {'tipo': 'arvore', 'altura': 8.5}),
    'arvore-cipreste': (arvore_cipreste, 'Cipreste alto e estreito de 8 m', {'tipo': 'arvore', 'altura': 8.0}),
    'arvore-ipe-amarelo': (lambda: arvore_ipe(True), 'Ipê amarelo em flor, 6 m', {'tipo': 'arvore', 'altura': 6.0}),
    'arvore-ipe-rosa': (lambda: arvore_ipe(False), 'Ipê rosa em flor, 6 m', {'tipo': 'arvore', 'altura': 6.0}),
    'arvore-palmeira': (arvore_palmeira, 'Palmeira de coco de 9 m com folhas caídas e cocos', {'tipo': 'arvore', 'altura': 9.0}),
    'arbusto': (lambda: arbusto(None), 'Arbusto baixo de 1,1 m', {'tipo': 'arbusto', 'altura': 1.1}),
    'arbusto-flores': (lambda: arbusto(FLOR_ROSA, 6), 'Arbusto de 1,1 m com flores cor-de-rosa', {'tipo': 'arbusto', 'altura': 1.1}),
    'tufos-capim': (tufos_avulsos, 'Punhado de capim e flores soltos (1 m) para espalhar à mão; pé em y = 0', {'tipo': 'arbusto', 'altura': 0.5}),
}

GRAMADOS = {
    'gramado-detalhado': (lambda: gramado_detalhado(False), 'Gramado de 12 x 12 m: chão facetado em três tons de verde e 330 tufos de capim; topo em y = 0,15'),
    'gramado-flores': (lambda: gramado_detalhado(True), 'Gramado detalhado com cerca de 70 flores brancas, amarelas, rosas, roxas e vermelhas'),
    'gramado-listrado': (gramado_listrado, 'Gramado liso de 12 x 12 m com faixas de corte claras e escuras (jardim, campo)'),
}
