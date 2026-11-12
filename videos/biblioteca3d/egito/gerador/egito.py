"""Gera as pirâmides de Gizé e a Grande Esfinge (.glb, estilo low poly do canal) e o planalto completo.
Uso:  python3 egito.py        (precisa só de numpy; reaproveita malha.py e glb.py do kit cidade)

Medidas reais (metros, Y para cima). Cada peça tem a origem no centro da base, pé em y = 0.
  piramide-queops            Grande Pirâmide (Khufu) como está hoje: 230,3 m de base, 138,5 m de altura, degraus de blocos
  piramide-queops-original   a mesma quando ficou pronta (~2560 a.C.): 146,6 m, revestimento liso de calcário branco e ponta dourada
  piramide-quefren           Quéfren (Khafre): 215,3 m de base, 136,4 m hoje, com o revestimento liso que sobrou no topo
  piramide-miquerinos        Miquerinos (Menkaure): 103,4 m de base, 61 m hoje, base revestida de granito vermelho
  piramide-rainha            pirâmide das rainhas (G1-a/b/c): ~46 m de base, ~20 m hoje, arruinada
  esfinge                    Grande Esfinge: 73 m de comprimento, 20 m de altura, rosto (nariz quebrado), nemes listrado e a Estela do Sonho;
                             o rosto olha para +Z
  planalto-gize              tudo montado nas posições reais: norte = -Z, leste = +X, a Esfinge no seu fosso olhando para o leste,
                             templos, calçada de Quéfren, campos de mastabas e dunas"""
import json
import math
import os
import random
import sys

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.dirname(AQUI)
sys.path.insert(0, os.path.join(SAIDA, '..', 'cidade', 'gerador'))

from glb import Material, Node, write_glb          # noqa: E402
from malha import Malha, T, Ry, V                  # noqa: E402

# ------------------------------------------------------------------ paleta (sRGB)
CALC = [Material('Calcario', '#c8a877', rough=0.95), Material('CalcarioB', '#bd9a66', rough=0.95),
        Material('CalcarioC', '#d3b585', rough=0.95), Material('CalcarioD', '#ae8a59', rough=0.95)]
CALC_TOPO = [Material('CalcarioTopo', '#dcc395', rough=0.95), Material('CalcarioTopoB', '#d2b789', rough=0.95)]
REVEST = Material('Revestimento', '#e4d7b6', rough=0.85)                 # calcário fino de Tura que sobrou em Quéfren
REVEST_NOVO = Material('RevestimentoNovo', '#f3ecda', rough=0.55)         # pirâmide recém-terminada, polida
REVEST_LADO = Material('RevestimentoLado', '#cbbb96', rough=0.9)
OURO = Material('Ouro', '#e7b53c', rough=0.3, metal=0.9)
GRANITO = Material('Granito', '#8e5749', rough=0.75)
GRANITO_B = Material('GranitoB', '#8a4c3d', rough=0.75)
GRANITO_ESC = Material('GranitoEscuro', '#5e3a33', rough=0.7)
MADEIRA = Material('Haste', '#6b5137', rough=0.8)

ESF = Material('Esfinge', '#c9a46a', rough=0.95)
ESF_ESC = Material('EsfingeEscura', '#a8834f', rough=0.95)
ESF_CLARA = Material('EsfingeClara', '#dcc28d', rough=0.95)                # blocos de restauração na parte de baixo
ESF_ROSTO = Material('EsfingeRosto', '#d0ab72', rough=0.9)
NEMES_A = Material('NemesA', '#cfae74', rough=0.9)
NEMES_B = Material('NemesB', '#b28b55', rough=0.9)
SOMBRA = Material('Sombra', '#4a3826', rough=1.0)                           # olhos, boca, frestas

AREIA = Material('Areia', '#dcb779', rough=1.0)
AREIA_B = Material('AreiaB', '#d2ab6c', rough=1.0)
ROCHA_CHAO = Material('RochaChao', '#c9a873', rough=1.0)
ROCHA_PAREDE = Material('RochaParede', '#b38f5c', rough=1.0)
PEDRAS = Material('Pedras', '#a98656', rough=1.0)

GERADOR = 'Hryz Animation - kit Egito'

# ------------------------------------------------------------------ utilidades


def lados():
    """4 lados da pirâmide: (normal, tangente) em xz; a ponta f=+1 de um lado é a ponta f=-1 do seguinte"""
    for n in ((0, 1), (-1, 0), (0, -1), (1, 0)):
        yield np.array(n, float), np.array((-n[1], n[0]), float)


def P(n, t, u, off, y):
    """ponto no lado (n, t): `off` metros para fora do centro, `u` metros ao longo do lado, altura y"""
    xz = n * off + t * u
    return (xz[0], y, xz[1])


def cortar_y(poly, y, acima):
    """recorta um polígono convexo (pontos x,y) mantendo o lado acima (ou abaixo) da linha y"""
    out = []
    for i in range(len(poly)):
        p, q = poly[i], poly[(i + 1) % len(poly)]
        dp = p[1] >= y if acima else p[1] <= y
        dq = q[1] >= y if acima else q[1] <= y
        if dp:
            out.append(p)
        if dp != dq:
            k = (y - p[1]) / (q[1] - p[1])
            out.append((p[0] + (q[0] - p[0]) * k, y))
    return out


def extrudar(m, mat, poly, z0, z1, mat_lado=None, pular_y=()):
    """prisma: polígono convexo no plano XY empurrado de z0 a z1 (frente em +Z). Arestas horizontais em `pular_y` não ganham parede."""
    mat_lado = mat_lado or mat
    m.poly(mat, [(x, y, z1) for x, y in poly], (0, 0, 1))
    m.poly(mat, [(x, y, z0) for x, y in poly], (0, 0, -1))
    cx = sum(p[0] for p in poly) / len(poly)
    cy = sum(p[1] for p in poly) / len(poly)
    for i in range(len(poly)):
        a, b = poly[i], poly[(i + 1) % len(poly)]
        if abs(a[1] - b[1]) < 1e-9 and any(abs(a[1] - y) < 1e-6 for y in pular_y):
            continue
        mx, my = (a[0] + b[0]) / 2 - cx, (a[1] + b[1]) / 2 - cy
        m.quad(mat_lado, (a[0], a[1], z0), (b[0], b[1], z0), (b[0], b[1], z1), (a[0], a[1], z1), (mx, my, 0))


def listrado(m, poly, z0, z1, faixas, mats):
    """polígono extrudado e fatiado em faixas horizontais (listras do nemes)"""
    ys = [p[1] for p in poly]
    y0, y1 = min(ys), max(ys)
    cortes = [y0 + (y1 - y0) * k / faixas for k in range(faixas + 1)]
    for k in range(faixas):
        p = cortar_y(cortar_y(poly, cortes[k], True), cortes[k + 1], False)
        if len(p) >= 3:
            internos = [c for c in (cortes[k], cortes[k + 1]) if y0 + 1e-6 < c < y1 - 1e-6]
            extrudar(m, mats[k % len(mats)], p, z0, z1, pular_y=internos)


def loft(m, aneis, mats, fechar=(True, True)):
    """une anéis (listas de pontos 3D com o mesmo tamanho, abertos de chão a chão) com quadriláteros.
    mats[i] é o material da aresta i do anel. As tampas fecham o anel com a aresta do chão."""
    for k in range(len(aneis) - 1):
        A, B = aneis[k], aneis[k + 1]
        cA, cB = np.mean(A, axis=0), np.mean(B, axis=0)
        for i in range(len(A) - 1):
            q = [A[i], A[i + 1], B[i + 1], B[i]]
            c = np.mean(q, axis=0)
            eixo = cA + (cB - cA) * 0.5
            fora = c - eixo
            fora[2] = 0
            m.quad(mats[i % len(mats)], *q, tuple(fora))
    if fechar[0]:
        m.poly(mats[0], aneis[0], (0, 0, float(np.sign(aneis[0][0][2] - aneis[1][0][2]))))
    if fechar[1]:
        m.poly(mats[0], aneis[-1], (0, 0, float(np.sign(aneis[-1][0][2] - aneis[-2][0][2]))))


def secao_leao(z, w, h, cx=0.0, y0=0.0):
    """seção de um corpo deitado: 8 pontos do chão (lado -x) por cima até o chão (lado +x)"""
    pf = [(-1, 0), (-1, 0.55), (-0.78, 0.86), (-0.38, 1.0), (0.38, 1.0), (0.78, 0.86), (1, 0.55), (1, 0)]
    return [V(cx + a * w, y0 + b * h, z) for a, b in pf]


def tronco(m, mat, cx, cz, sx, sz, h, inc, y0=0.0, mat_topo=None, giro=0.0):
    """bloco com paredes inclinadas (mastaba): base sx x sz, recuo `inc` no topo"""
    base = [(-sx / 2, -sz / 2), (sx / 2, -sz / 2), (sx / 2, sz / 2), (-sx / 2, sz / 2)]
    topo = [(x - math.copysign(inc, x), z - math.copysign(inc, z)) for x, z in base]
    c, s = math.cos(giro), math.sin(giro)
    rot = lambda x, z: (cx + c * x + s * z, cz - s * x + c * z)
    B = [V(*(lambda p: (p[0], y0, p[1]))(rot(*p))) for p in base]
    Tp = [V(*(lambda p: (p[0], y0 + h, p[1]))(rot(*p))) for p in topo]
    m.poly(mat_topo or mat, Tp, (0, 1, 0))
    for i in range(4):
        j = (i + 1) % 4
        f = (B[i] + B[j]) / 2 - V(cx, y0, cz)
        m.quad(mat, B[i], B[j], Tp[j], Tp[i], (f[0], 0.3, f[2]))


# ------------------------------------------------------------------ pirâmides


def degraus(base, h_orig, h_ate, curso, rng, bloco=7.0, p_recuo=0.08, fundacao=2.0, tons=CALC, topos=CALC_TOPO):
    """núcleo em degraus: fiadas de altura variável, cada uma com blocos de tons sorteados e alguns blocos faltando"""
    m = Malha()
    hw = lambda y: base / 2 * (1 - y / h_orig)
    n = max(1, round(h_ate / curso))
    hs = np.array([rng.uniform(0.8, 1.25) for _ in range(n)])
    hs *= h_ate / hs.sum()
    ys = np.concatenate([[0.0], np.cumsum(hs)])
    ws = [hw(ys[i + 1]) for i in range(n)]
    for i in range(n):
        y0 = -fundacao if i == 0 else ys[i]
        y1, w = ys[i + 1], ws[i]
        wn = ws[i + 1] if i + 1 < n else 0.0
        prof = (w - wn) * 0.6 if wn > 0 else 0
        for nn, t in lados():
            k = max(2, round(2 * w / bloco))
            us = [-w + 2 * w * j / k for j in range(k + 1)]
            rec = [0 < j < k - 1 and rng.random() < p_recuo * (1 + 1.5 * y1 / h_ate) for j in range(k)]
            for j in range(k):
                u0, u1 = us[j], us[j + 1]
                d = prof if rec[j] else 0.0
                o = w - d
                m.quad(rng.choice(tons), P(nn, t, u0, o, y0), P(nn, t, u1, o, y0), P(nn, t, u1, o, y1), P(nn, t, u0, o, y1), (nn[0], 0, nn[1]))
                cl = lambda u: max(-wn, min(wn, u))
                m.poly(rng.choice(topos), [P(nn, t, u0, o, y1), P(nn, t, u1, o, y1), P(nn, t, cl(u1), wn, y1), P(nn, t, cl(u0), wn, y1)], (0, 1, 0))
                if rec[j]:
                    m.quad(rng.choice(topos), P(nn, t, u0, o, y0), P(nn, t, u1, o, y0), P(nn, t, u1, w, y0), P(nn, t, u0, w, y0), (0, 1, 0))
                    if not rec[j - 1]:
                        m.quad(rng.choice(tons), P(nn, t, u0, o, y0), P(nn, t, u0, w, y0), P(nn, t, u0, w, y1), P(nn, t, u0, o, y1), (t[0], 0, t[1]))
                    if not rec[j + 1]:
                        m.quad(rng.choice(tons), P(nn, t, u1, o, y0), P(nn, t, u1, w, y0), P(nn, t, u1, w, y1), P(nn, t, u1, o, y1), (-t[0], 0, -t[1]))
    return m, ys


def revestimento(base, h_orig, lo, hi, mat, rng, k=14, e=0.6, prof=1.6, h_topo=None, mat_lado=None):
    """revestimento liso por cima dos degraus, com a borda quebrada: lo(rng) e hi(rng) dão a altura de baixo e de cima de cada coluna.
    `h_topo` fecha com um quadrado plano (topo cortado); sem ele a última coluna vai até a ponta."""
    m = Malha()
    mat_lado = mat_lado or REVEST_LADO
    hw = lambda y: base / 2 * (1 - y / h_orig)
    LO = [[lo(rng) for _ in range(k)] for _ in range(4)]
    HI = [[hi(rng) for _ in range(k)] for _ in range(4)]
    for s in range(4):                                  # as colunas do canto são as mesmas nos dois lados
        LO[s][-1] = LO[(s + 1) % 4][0]
        HI[s][-1] = HI[(s + 1) % 4][0]

    def Q(n, t, f, y, off):
        r = hw(y) + off
        xz = n * r + t * f * r
        return (xz[0], y, xz[1])
    topo = h_topo if h_topo is not None else h_orig
    for s, (n, t) in enumerate(lados()):
        fs = [-1 + 2 * j / k for j in range(k + 1)]
        for j in range(k):
            f0, f1, a, b = fs[j], fs[j + 1], LO[s][j], HI[s][j]
            m.poly(mat, [Q(n, t, f0, a, e), Q(n, t, f1, a, e), Q(n, t, f1, b, e), Q(n, t, f0, b, e)], (n[0], 0.6, n[1]))
            if a > 0:
                m.quad(mat_lado, Q(n, t, f0, a, e), Q(n, t, f1, a, e), Q(n, t, f1, a, -prof), Q(n, t, f0, a, -prof), (0, -1, 0))
            if b < topo - 1e-6:
                m.quad(mat_lado, Q(n, t, f0, b, e), Q(n, t, f1, b, e), Q(n, t, f1, b, -prof), Q(n, t, f0, b, -prof), (0, 1, 0))
            if j < k - 1:                               # degrau entre esta coluna e a próxima
                a2, b2 = LO[s][j + 1], HI[s][j + 1]
                for (ya, yb, sinal) in ((a, min(b, a2), 1), (max(a, b2), b, 1), (a2, min(b2, a), -1), (max(a2, b), b2, -1)):
                    if yb - ya > 1e-3:
                        m.quad(mat_lado, Q(n, t, f1, ya, e), Q(n, t, f1, yb, e), Q(n, t, f1, yb, -prof), Q(n, t, f1, ya, -prof), (sinal * t[0], 0, sinal * t[1]))
    if h_topo is not None:
        r = hw(h_topo) + e
        m.poly(REVEST_LADO, [(-r, h_topo, -r), (r, h_topo, -r), (r, h_topo, r), (-r, h_topo, r)], (0, 1, 0))
    return m


def blocos_soltos(m, rng, n, area, y, mats):
    for _ in range(n):
        x, z = rng.uniform(-area, area), rng.uniform(-area, area)
        sx, sy, sz = rng.uniform(1.0, 2.2), rng.uniform(0.7, 1.2), rng.uniform(1.0, 1.8)
        m.box(rng.choice(mats), x, y + sy / 2, z, sx, sy, sz)


def queops():
    rng = random.Random(1)
    m, ys = degraus(230.3, 146.6, 138.5, 1.45, rng)
    b = Malha()
    blocos_soltos(b, rng, 9, 4.0, 138.5, CALC)
    b.tubo(MADEIRA, (0, 138.5, 0), (0, 146.6, 0), 0.18, 0.14, segs=6)       # a haste de madeira marca a altura original
    return [('Degraus', m), ('Topo', b)], {'base_m': 230.3, 'altura_m': 138.5, 'altura_original_m': 146.6}


def queops_original():
    m = Malha()
    B, H, cap = 230.3, 146.6, 3.0
    hw = lambda y: B / 2 * (1 - y / H)
    for n, t in lados():
        m.poly(REVEST_NOVO, [P(n, t, -hw(-1), hw(-1), -1), P(n, t, hw(-1), hw(-1), -1), P(n, t, hw(H - cap), hw(H - cap), H - cap), P(n, t, -hw(H - cap), hw(H - cap), H - cap)], (n[0], 0.6, n[1]))
        m.poly(OURO, [P(n, t, -hw(H - cap), hw(H - cap), H - cap), P(n, t, hw(H - cap), hw(H - cap), H - cap), (0, H, 0)], (n[0], 0.6, n[1]))
    # entrada na face norte (-Z), a 17 m de altura
    e = Malha()
    z = lambda y: -hw(y) - 0.05
    e.poly(SOMBRA, [(-0.55, 16.2, z(16.2)), (0.55, 16.2, z(16.2)), (0.55, 17.4, z(17.4)), (-0.55, 17.4, z(17.4))], (0, 0.6, -1))
    return [('Revestimento', m), ('Entrada', e)], {'base_m': B, 'altura_m': H}


def quefren():
    rng = random.Random(2)
    B, H, Ha = 215.3, 143.5, 136.4
    m, _ = degraus(B, H, 122.0, 1.4, rng)
    r = revestimento(B, H, lambda g: g.uniform(106, 117), lambda g: Ha, REVEST, rng, k=16, h_topo=Ha)
    return [('Degraus', m), ('Revestimento', r)], {'base_m': B, 'altura_m': Ha, 'altura_original_m': H}


def miquerinos():
    rng = random.Random(3)
    B, H, Ha = 103.4, 65.5, 61.0
    m, _ = degraus(B, H, Ha, 1.1, rng, bloco=5.0, p_recuo=0.12)
    g = revestimento(B, H, lambda r: -2.0, lambda r: r.uniform(4.0, 11.0), GRANITO, rng, k=12, e=0.5, prof=1.4, mat_lado=GRANITO_B)
    return [('Degraus', m), ('Granito', g)], {'base_m': B, 'altura_m': Ha, 'altura_original_m': H}


def rainha(seed=4):
    rng = random.Random(seed)
    B, H, Ha = 46.0, 30.0, 20.0
    m, _ = degraus(B, H, Ha, 1.2, rng, bloco=4.0, p_recuo=0.22)
    b = Malha()
    blocos_soltos(b, rng, 6, 5.0, Ha, CALC)
    return [('Degraus', m), ('Topo', b)], {'base_m': B, 'altura_m': Ha, 'altura_original_m': H}


# ------------------------------------------------------------------ esfinge (rosto em +Z)


def esfinge():
    corpo, cabeca, nemes, patas, estela, rosto = Malha(), Malha(), Malha(), Malha(), Malha(), Malha()
    faixa = [ESF_CLARA, ESF, ESF_ESC, ESF, ESF, ESF_ESC, ESF, ESF_CLARA]        # material por aresta do anel (de baixo para cima e de volta)
    # corpo: (z, meia largura, altura)
    S = [(-36.5, 5.0, 7.5), (-35.0, 7.8, 10.5), (-31.0, 9.2, 12.0), (-24.0, 8.8, 12.2), (-14.0, 8.0, 11.4), (-2.0, 7.9, 11.3),
         (8.0, 8.3, 11.8), (15.0, 8.8, 13.2), (19.5, 8.2, 14.0), (22.5, 6.8, 12.4), (23.6, 5.6, 10.8)]
    loft(corpo, [secao_leao(z, w, h) for z, w, h in S], faixa)
    # ancas e patas traseiras dobradas ao lado do corpo
    for sx in (-1, 1):
        corpo.ico(ESF, (sx * 6.6, 5.6, -25.0), 6.0, nivel=1, jitter=0.04, rng=random.Random(7 + sx), esc=(0.6, 0.95, 1.35))
        loft(patas, [secao_leao(z, w, h, cx=sx * 9.4) for z, w, h in ((-31, 1.0, 2.6), (-24, 1.25, 2.9), (-15, 1.2, 2.4), (-12.6, 1.0, 1.9))],
             [ESF_CLARA, ESF, ESF, ESF, ESF, ESF, ESF, ESF_CLARA])
        # patas da frente: antebraço do ombro até a ponta, depois 4 dedos
        loft(patas, [secao_leao(z, w, h, cx=sx * 4.7) for z, w, h in ((14.0, 2.1, 5.2), (20.0, 2.0, 4.0), (28.0, 1.9, 3.1), (34.6, 1.85, 2.6))],
             [ESF_CLARA, ESF, ESF, ESF, ESF, ESF, ESF, ESF_CLARA])
        for d in range(4):
            x = sx * 4.7 + (d - 1.5) * 0.92
            patas.box(ESF, x, 1.05, 35.4, 0.84, 2.1, 1.9)
    # cauda enrolada no quadril direito (+x), por cima da pata traseira
    pts = [(5.5, 3.2, -36.3), (8.4, 3.4, -33.8), (9.9, 3.1, -29.0), (10.4, 2.9, -22.0), (10.3, 2.8, -16.5)]
    for a, b in zip(pts, pts[1:]):
        corpo.tubo(ESF, a, b, 0.55, 0.5, segs=6, caps=True)
    # pescoço
    loft(cabeca, [secao_leao(z, w, h, y0=9.5) for z, w, h in ((15.5, 3.4, 6.0), (19.0, 3.3, 6.2), (22.4, 3.0, 5.0))], [ESF] * 7)
    # rosto: perfil de frente (x, y), em três fatias para chanfrar a frente
    perfil = [(-1.25, 13.5), (1.25, 13.5), (2.15, 14.6), (2.25, 17.9), (-2.25, 17.9), (-2.15, 14.6)]
    an = lambda z, s: [V(x * s, 13.5 + (y - 13.5) * (1 if s == 1 else 0.97), z) for x, y in perfil]
    fat = [an(20.4, 1.0), an(23.5, 1.0), an(24.1, 0.82)]
    for k in range(2):
        A, B = fat[k], fat[k + 1]
        for i in range(len(perfil)):
            j = (i + 1) % len(perfil)
            c = (A[i] + A[j]) / 2 - V(0, 15.7, A[i][2])
            rosto.quad(ESF_ROSTO, A[i], A[j], B[j], B[i], (c[0], c[1], 0.5 * k))
    rosto.poly(ESF_ROSTO, fat[2], (0, 0, 1))
    rosto.box(ESF_ROSTO, 0, 15.95, 24.25, 0.95, 1.3, 0.5)                       # o que sobrou do nariz
    rosto.box(ESF_ROSTO, 0, 14.65, 24.2, 1.6, 0.42, 0.35)                       # lábios
    for sx in (-1, 1):
        rosto.box(ESF_ROSTO, sx * 1.0, 17.15, 24.2, 1.35, 0.36, 0.4)            # sobrancelha
        rosto.poly(SOMBRA, [(sx * 0.45, 16.45, 24.13), (sx * 1.5, 16.45, 24.13), (sx * 1.45, 16.85, 24.13), (sx * 0.5, 16.85, 24.13)], (0, 0, 1))
        rosto.box(ESF_ROSTO, sx * 2.45, 16.3, 22.6, 0.45, 1.7, 0.9)             # orelha
    rosto.poly(SOMBRA, [(-0.75, 14.33, 24.39), (0.75, 14.33, 24.39), (0.75, 14.42, 24.39), (-0.75, 14.42, 24.39)], (0, 0, 1))
    # nemes: faixa da testa, touca, abas listradas e rabicho nas costas
    nemes.box(NEMES_B, 0, 18.15, 22.2, 4.9, 0.5, 3.9)
    touca = [(-2.5, 0.0), (-2.35, 1.15), (-1.5, 1.85), (1.5, 1.85), (2.35, 1.15), (2.5, 0.0)]
    secs = [(24.05, 1.0, 18.4), (21.0, 1.0, 18.4), (18.2, 0.92, 18.3), (16.4, 0.62, 17.6)]
    aneis = [[V(x * s, y0 + y * (0.75 if z < 17 else 1.0), z) for x, y in touca] for z, s, y0 in secs]
    loft(nemes, aneis, [NEMES_A, NEMES_B, NEMES_A, NEMES_B, NEMES_A])
    for sx in (-1, 1):
        asa = [(2.3, 13.0), (4.5, 13.0), (4.5, 15.4), (2.75, 19.1), (2.3, 18.7)]
        aba = [(2.35, 9.6), (3.7, 9.6), (3.7, 13.0), (2.35, 13.0)]
        for poly, z0, z1, n in ((asa, 19.6, 22.9, 9), (aba, 21.6, 22.8, 5)):
            p = [(sx * x, y) for x, y in poly]
            if sx < 0:
                p = p[::-1]
            listrado(nemes, p, z0, z1, n, [NEMES_A, NEMES_B])
    nemes.tubo(NEMES_B, (0, 17.8, 16.6), (0, 13.2, 15.2), 1.15, 0.75, segs=8, caps=True)
    # Estela do Sonho, de granito, entre as patas
    est = [(-1.85, 0.0), (1.85, 0.0), (1.85, 3.0)] + [(1.85 * math.cos(a), 3.0 + 0.7 * math.sin(a)) for a in np.linspace(0.35, math.pi - 0.35, 5)] + [(-1.85, 3.0)]
    extrudar(estela, GRANITO, est, 25.6, 26.2)
    estela.poly(GRANITO_ESC, [(-1.4, 2.6, 26.21), (1.4, 2.6, 26.21), (1.4, 3.3, 26.21), (-1.4, 3.3, 26.21)], (0, 0, 1))
    return ([('Corpo', corpo), ('Patas', patas), ('Cabeca', cabeca), ('Rosto', rosto), ('Nemes', nemes), ('Estela', estela)],
            {'comprimento_m': 73, 'altura_m': 20, 'largura_m': 19, 'frente': '+Z'})


# ------------------------------------------------------------------ planalto

POS = {   # centro das bases, em metros (x = leste, z = sul), a partir de latitude/longitude
    'queops': (0.0, 0.0), 'quefren': (-328.0, 344.0), 'miquerinos': (-588.0, 743.0), 'esfinge': (328.0, 432.0),
    'rainhas-queops': [(180.0, 32.0), (182.0, 88.0), (184.0, 144.0)],
    'rainhas-miquerinos': [(-505.0, 860.0), (-570.0, 860.0), (-632.0, 860.0)],
}
RAMPA = 26.0                      # largura da encosta entre o planalto e o vale
FOSSO = 8.0                       # o fosso da Esfinge e o vale a leste ficam 8 m abaixo do planalto


def planalto():
    rng = random.Random(9)
    sx, sz = POS['esfinge']
    E = sx + 30.0                     # escarpa: a leste dela o chão é 8 m mais baixo
    X0, X1, Z0, Z1 = -5000.0, 5000.0, -5000.0, 5000.0
    pz0, pz1, px0 = sz - 24.0, sz + 24.0, sx - 46.0
    chao = Malha()
    chao.plano(ROCHA_CHAO, [(X0, Z0), (E, Z0), (E, pz0), (px0, pz0), (px0, pz1), (E, pz1), (E, Z1), (X0, Z1)], 0.0)
    E2 = E + RAMPA                    # pé da encosta
    chao.plano(AREIA, [(E2, Z0), (X1, Z0), (X1, Z1), (E2, Z1), (E2, pz1), (px0, pz1), (px0, pz0), (E2, pz0)], -FOSSO)
    for za, zb in ((Z0, pz0), (pz1, Z1)):         # encosta de rocha para o vale
        chao.quad(ROCHA_PAREDE, (E, 0, za), (E, 0, zb), (E2, -FOSSO, zb), (E2, -FOSSO, za), (FOSSO, RAMPA, 0))
    chao.wall(ROCHA_PAREDE, (px0, pz0), (E, pz0), -FOSSO, 0, (0, 1))
    chao.wall(ROCHA_PAREDE, (px0, pz1), (E, pz1), -FOSSO, 0, (0, -1))
    chao.poly(ROCHA_PAREDE, [(E, 0, pz0), (E, -FOSSO, pz0), (E2, -FOSSO, pz0)], (0, 0, 1))
    chao.poly(ROCHA_PAREDE, [(E, 0, pz1), (E, -FOSSO, pz1), (E2, -FOSSO, pz1)], (0, 0, -1))
    chao.wall(ROCHA_PAREDE, (px0, pz0), (px0, pz1), -FOSSO, 0, (1, 0))
    # manchas de areia sobre a rocha e dunas ao longe (oeste e sul)
    for _ in range(70):
        cx, cz = rng.uniform(-1300, E - 60), rng.uniform(-700, 1400)
        if any(math.hypot(cx - a, cz - b) < r for (a, b), r in ((POS['queops'], 190), (POS['quefren'], 180), (POS['miquerinos'], 100), ((sx, sz), 90))):
            continue
        r = rng.uniform(25, 90)
        pts = [(cx + r * rng.uniform(0.6, 1.0) * math.cos(a), cz + r * rng.uniform(0.5, 0.9) * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 9)[:-1]]
        chao.plano(rng.choice([AREIA, AREIA_B]), pts, 0.06)
    dunas = Malha()
    for _ in range(90):
        a = rng.uniform(math.radians(95), math.radians(300))
        d = rng.uniform(1500, 3800)
        cx, cz = -500 + d * math.cos(a), 350 + d * math.sin(a)
        if cx > E - 200:
            continue
        r = rng.uniform(120, 420)
        dunas.ico(rng.choice([AREIA, AREIA_B]), (cx, -r * 0.3, cz), r, nivel=2, jitter=0.05, rng=rng, esc=(1.7, 0.36, 1.0))
    pedras = Malha()
    for _ in range(160):
        x, z = rng.uniform(-1100, E - 10), rng.uniform(-500, 1300)
        if any(math.hypot(x - a, z - b) < r for (a, b), r in ((POS['queops'], 150), (POS['quefren'], 140), (POS['miquerinos'], 70), ((sx, sz), 60))):
            continue
        pedras.ico(rng.choice([PEDRAS, CALC[3]]), (x, 0.2, z), rng.uniform(0.6, 2.4), nivel=0, jitter=0.25, rng=rng, esc=(1.2, 0.6, 1.0))
    # campos de mastabas a oeste e a leste de Quéops
    mast = Malha()
    for (x0, x1, z0, z1) in ((-330, -150, -170, 120), (220, 330, -170, 170)):
        for x in np.arange(x0, x1, 30):
            for z in np.arange(z0, z1, 22):
                if rng.random() < 0.18:
                    continue
                tronco(mast, rng.choice(CALC), x + rng.uniform(-2, 2), z + rng.uniform(-2, 2), rng.uniform(18, 24), rng.uniform(9, 12),
                       rng.uniform(3.5, 6.0), 0.9, y0=-0.5, mat_topo=rng.choice(CALC_TOPO))
    # templos (ruínas maciças) e calçada de Quéfren até o Templo do Vale, ao lado da Esfinge
    templos = Malha()
    qx, qz = POS['quefren']
    tronco(templos, CALC[1], qx + 108 + 30, qz, 56, 100, 6.0, 0.6, y0=-0.5, mat_topo=CALC_TOPO[1])            # templo funerário de Quéfren
    tronco(templos, CALC[0], 108 + 22, 0, 40, 52, 3.0, 0.4, y0=-0.5, mat_topo=CALC_TOPO[0])                   # templo funerário de Quéops
    vx, vz = E + RAMPA + 30.0, sz + 54.0
    for (cx, cz, a, b) in ((vx, vz, 46, 46), (E + RAMPA + 26.0, sz, 40, 40)):                                         # Templo do Vale e Templo da Esfinge
        for (ox, oz, lx, lz) in ((0, -a / 2 + 3, b, 6), (0, a / 2 - 3, b, 6), (-b / 2 + 3, 0, 6, a), (b / 2 - 3, 0, 6, a)):
            templos.box(rng.choice(CALC[:3]), cx + ox, -FOSSO + 2.5, cz + oz, lx, 5.0, lz)
        for i in range(-2, 3):
            templos.box(GRANITO, cx + i * 6.0, -FOSSO + 2.25, cz, 1.4, 4.5, 1.4)
    p0 = np.array([qx + 108 + 58, 0.0, qz + 20])
    p1 = np.array([E, 0.0, vz])                       # termina na beira da encosta, acima do Templo do Vale
    d = p1 - p0
    L = float(np.linalg.norm(d))
    ang = math.atan2(d[0], d[2])
    calc = Malha()
    calc.caixa(CALC[2], -2.7, 2.7, -FOSSO - 1, 1.4, 0, L, faces='+x-x+y+z-z', mats={'+y': CALC_TOPO[0]})
    templos.add(calc, T(*p0) @ Ry(ang))
    # monumentos
    filhos = [Node('Chao', chao.prims()), Node('Dunas', dunas.prims()), Node('Pedras', pedras.prims()),
              Node('Mastabas', mast.prims()), Node('Templos', templos.prims())]

    def mon(nome, nos, x, z, y=0.0, giro=0.0):
        q = (0, math.sin(giro / 2), 0, math.cos(giro / 2))
        filhos.append(Node(nome, children=[Node(f'{nome}-{n}', mm.prims()) for n, mm in nos if mm.n_tris], translation=(x, y, z), rotation=q))
    mon('Queops', queops()[0], *POS['queops'])
    mon('Quefren', quefren()[0], *POS['quefren'])
    mon('Miquerinos', miquerinos()[0], *POS['miquerinos'])
    for i, (x, z) in enumerate(POS['rainhas-queops'] + POS['rainhas-miquerinos']):
        mon(f'Rainha{i + 1}', rainha(10 + i)[0], x, z)
    mon('Esfinge', esfinge()[0], sx, sz, y=-FOSSO, giro=math.pi / 2)       # rosto para o leste (+X)
    return filhos


# ------------------------------------------------------------------ saída


def contar(nos):
    return sum(m.n_tris for _, m in nos)


def salvar(nome, descricao, nos, extras):
    raiz = Node(nome, children=[Node(n, m.prims()) for n, m in nos if m.n_tris], extras={'descricao': descricao, **extras})
    tam = write_glb(os.path.join(SAIDA, nome + '.glb'), [raiz], generator=GERADOR)
    tris = contar(nos)
    pts = np.concatenate([np.array(g[1]) for _, m in nos for g in m.g.values() if g[1]])
    lo, hi = pts.min(axis=0), pts.max(axis=0)
    print(f'{nome:28s} {tris:7d} triângulos  {tam / 1024:7.0f} KB  tamanho {hi[0] - lo[0]:.1f} x {hi[1] - lo[1]:.1f} x {hi[2] - lo[2]:.1f} m')
    return {'nome': nome, 'arquivo': nome + '.glb', 'descricao': descricao, 'triangulos': tris, 'kb': round(tam / 1024),
            'tamanho_m': [round(float(v), 1) for v in hi - lo], **extras}


def main():
    pecas = [
        salvar('piramide-queops', 'Grande Pirâmide de Gizé (Quéops/Khufu) como está hoje', *queops()),
        salvar('piramide-queops-original', 'Grande Pirâmide recém-terminada: revestimento liso de calcário branco e ponta dourada', *queops_original()),
        salvar('piramide-quefren', 'Pirâmide de Quéfren (Khafre), com o revestimento que sobrou no topo', *quefren()),
        salvar('piramide-miquerinos', 'Pirâmide de Miquerinos (Menkaure), com a base de granito vermelho', *miquerinos()),
        salvar('piramide-rainha', 'Pirâmide de rainha (satélite), arruinada', *rainha()),
        salvar('esfinge', 'Grande Esfinge de Gizé, com a Estela do Sonho entre as patas', *esfinge()),
    ]
    filhos = planalto()
    raiz = Node('planalto-gize', children=filhos, extras={'descricao': 'Planalto de Gizé montado', 'norte': '-Z', 'leste': '+X'})
    tam = write_glb(os.path.join(SAIDA, 'planalto-gize.glb'), [raiz], generator=GERADOR)
    print(f'{"planalto-gize":28s} {"":7s}             {tam / 1024:7.0f} KB')
    pecas.append({'nome': 'planalto-gize', 'arquivo': 'planalto-gize.glb', 'kb': round(tam / 1024),
                  'descricao': 'Planalto de Gizé: as três pirâmides, seis pirâmides de rainhas, a Esfinge no fosso, templos, calçada, mastabas e dunas'})
    manifest = {'convencoes': {'unidade': 'metro', 'cima': '+Y', 'norte_no_planalto': '-Z', 'leste_no_planalto': '+X',
                               'origem': 'centro da base, pé em y = 0', 'frente_da_esfinge': '+Z (no planalto, girada para +X)',
                               'fosso_da_esfinge_m': -FOSSO},
                'posicoes_no_planalto': POS, 'pecas': pecas}
    with open(os.path.join(SAIDA, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
