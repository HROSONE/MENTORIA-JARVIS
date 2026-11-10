"""Rotatórias (mão direita: o anel gira no sentido anti-horário visto de cima).
  - rotatoria: 36 x 36 m (3 x 3 ladrilhos; o centro cai no centro de um ladrilho). Ilha central de 6,5 m de raio, anel de 5,5 m
    de largura, quatro braços de mão dupla com ilha separadora, faixa de pedestres e linha de "dê a preferência".
    Conexões N, S, E e W a 18 m do centro, com o mesmo perfil das ruas (asfalto de 7 m, calçada de 2,5 m).
    Os quatro cantos são de grama (no nível das calçadas), então a peça cobre os 36 x 36 m inteiros e encaixa na grade sem buracos.
  - rotatoria-mini: cabe em 1 ladrilho (12 x 12 m): cruzamento com uma ilha central de 1,7 m de raio.
Origem no centro. Topo do asfalto em y = 0; ilhas e calçadas em y = 0,15."""
import math
import numpy as np
from malha import Malha
from paleta import ASFALTO, MEIOFIO, CALCADA, GRAMA, FAIXA_BRANCA
import ruas
from ruas import H, CB, CH, YF, LH, conexoes, novas

A = 18.0                     # do centro até a borda da peça grande
R_ILHA = 6.5                 # raio da ilha central (até o meio-fio)
R_GRAMA = 5.2                # a grama vai até aqui; daí até 6,3 há um calçamento (para caminhões)
R_ANEL = 12.0                # raio externo do asfalto do anel
R_CAL = 14.5                 # raio externo da calçada em volta
LAT = H + ruas.S             # 6,0: limite externo da calçada dos braços
FAIXA_Y = YF


def r90(p, k):
    """gira o ponto (x, z) em k quartos de volta em torno de Y (S -> E -> N -> W)"""
    x, z = p
    for _ in range(k % 4):
        x, z = z, -x
    return (x, z)


def polar(R, t):
    return (R * math.cos(t), R * math.sin(t))


def anel_plano(m, mat, r0, r1, y, n, face=(0, 1, 0)):
    for i in range(n):
        a0, a1 = 2 * math.pi * i / n, 2 * math.pi * (i + 1) / n
        p = lambda r, a: (r * math.cos(a), y, r * math.sin(a))
        m.quad(mat, p(r0, a0), p(r0, a1), p(r1, a1), p(r1, a0), face)


def parede_circular(m, mat, r, y0, y1, n, para_fora=True):
    for i in range(n):
        a0, a1 = 2 * math.pi * i / n, 2 * math.pi * (i + 1) / n
        mid = polar(r, (a0 + a1) / 2)
        m.wall(mat, polar(r, a0), polar(r, a1), y0, y1, mid if para_fora else (-mid[0], -mid[1]))


def seta_anel(m, r, theta, comp=2.2, larg=0.24):
    """seta de tinta tangente ao anel, no sentido anti-horário visto de cima (ângulo theta medido de +X para +Z)"""
    c = np.array(polar(r, theta))
    t = np.array([math.sin(theta), -math.cos(theta)])                 # tangente anti-horária
    n = np.array([math.cos(theta), math.sin(theta)])
    P = lambda u, v: (*(c + u * t + v * n)[:1], FAIXA_Y, (c + u * t + v * n)[1])
    m.quad(FAIXA_BRANCA, P(-comp / 2, -larg / 2), P(comp * 0.15, -larg / 2), P(comp * 0.15, larg / 2), P(-comp / 2, larg / 2), (0, 1, 0))
    m.poly(FAIXA_BRANCA, [P(comp * 0.15, -larg * 1.9), P(comp / 2, 0), P(comp * 0.15, larg * 1.9)], (0, 1, 0))


# ---------------------------------------------------------------- rotatória grande
def bloco_quadrante(mal, k, N=14):
    """calçada em volta do anel entre dois braços (quadrante x > 0, z > 0, girado em k quartos de volta)"""
    f = lambda p: r90(p, k)
    P3 = lambda p, y: (f(p)[0], y, f(p)[1])
    Ro, Rs = R_ANEL, R_CAL
    x1 = math.sqrt(Ro ** 2 - H ** 2)
    x1q = math.sqrt((Ro + CB) ** 2 - (H + CB) ** 2)
    zs = math.sqrt(Rs ** 2 - LAT ** 2)
    tp1, tp2 = math.atan2(H, x1), math.atan2(x1, H)
    tq1, tq2 = math.atan2(H + CB, x1q), math.atan2(x1q, H + CB)
    arcP = [polar(Ro, tp1 + (tp2 - tp1) * i / N) for i in range(N + 1)]
    arcQ = [polar(Ro + CB, tq1 + (tq2 - tq1) * i / N) for i in range(N + 1)]
    ta, tb = math.atan2(zs, LAT), math.atan2(LAT, zs)
    arcR = [polar(Rs, ta + (tb - ta) * i / N) for i in range(N + 1)]
    mf, ca = mal['meiofio'], mal['calcada']
    # faixa clara do meio-fio: trecho reto do braço +X, arco do anel, trecho reto do braço +Z
    mf.quad(MEIOFIO, P3((A, H), CH), P3(arcP[0], CH), P3(arcQ[0], CH), P3((A, H + CB), CH), (0, 1, 0))
    for i in range(N):
        mf.quad(MEIOFIO, P3(arcP[i], CH), P3(arcP[i + 1], CH), P3(arcQ[i + 1], CH), P3(arcQ[i], CH), (0, 1, 0))
    mf.quad(MEIOFIO, P3(arcP[-1], CH), P3((H, A), CH), P3((H + CB, A), CH), P3(arcQ[-1], CH), (0, 1, 0))
    # degraus voltados para a pista
    mf.wall(MEIOFIO, f((A, H)), f(arcP[0]), 0.0, CH, f((0, -1)))
    for i in range(N):
        mid = ((arcP[i][0] + arcP[i + 1][0]) / 2, (arcP[i][1] + arcP[i + 1][1]) / 2)
        mf.wall(MEIOFIO, f(arcP[i]), f(arcP[i + 1]), 0.0, CH, f((-mid[0], -mid[1])))
    mf.wall(MEIOFIO, f(arcP[-1]), f((H, A)), 0.0, CH, f((-1, 0)))
    # topo da calçada: do braço +X, pelo arco interno, braço +Z, volta pela borda externa
    poli = [(A, H + CB)] + arcQ + [(H + CB, A), (LAT, A)] + arcR + [(A, LAT)]
    ca.plano(CALCADA, [f(p) for p in poli], CH)
    # grama do canto, fora da calçada: usa os mesmos vértices do arco externo (sem frestas e sem sobrepor a calçada),
    # no mesmo nível do chao-grama (y = 0,15), para a peça cobrir os 36 x 36 m inteiros e encaixar na grade
    mal['grama'].plano(GRAMA, [f(p) for p in [(LAT, A), (A, A), (A, LAT)] + arcR[::-1]], CH)


def rotatoria():
    mal = {k: Malha() for k in ('asfalto', 'ilha', 'meiofio', 'calcada', 'faixas', 'grama')}
    # asfalto: anel (invade 0,3 m por baixo da ilha e da calçada, sem frestas) + 4 braços
    anel_plano(mal['asfalto'], ASFALTO, R_ILHA - 0.3, R_ANEL + 0.25, 0.0, 72)
    for k in range(4):
        pts = [r90(p, k) for p in ((-H, 11.0), (H, 11.0), (H, A), (-H, A))]
        mal['asfalto'].poly(ASFALTO, [(x, 0.0, z) for x, z in pts], (0, 1, 0))
    # ilha central: grama, calçamento de apoio e meio-fio
    g = [polar(R_GRAMA, 2 * math.pi * i / 48) for i in range(48)]
    mal['ilha'].poly(GRAMA, [(x, CH, z) for x, z in g], (0, 1, 0))
    anel_plano(mal['calcada'], CALCADA, R_GRAMA, R_ILHA - CB, CH, 48)
    anel_plano(mal['meiofio'], MEIOFIO, R_ILHA - CB, R_ILHA, CH, 48)
    parede_circular(mal['meiofio'], MEIOFIO, R_ILHA, 0.0, CH, 48)
    for k in range(4):
        bloco_quadrante(mal, k)
        # ilha separadora de cada braço
        ilha = [r90(p, k) for p in ((-0.7, 12.4), (0.7, 12.4), (0.3, 15.4), (-0.3, 15.4))]
        mal['calcada'].prism(CALCADA, MEIOFIO, ilha, 0.0, CH)
    # tinta: faixa de pedestres, "dê a preferência" tracejado e setas do anel
    F = mal['faixas']
    for k in range(4):
        d = r90((0, 1), k)                       # direção do braço
        lat = (d[1], -d[0])                      # direita de quem chega
        for c in range(-3, 4):
            ruas.retangulo_uv(F, FAIXA_BRANCA, (0, 0), d, lat, 15.7, 17.3, c - 0.25, c + 0.25)
        for v0, v1 in ((0.95, 1.55), (1.75, 2.35), (2.55, 3.15)):
            ruas.retangulo_uv(F, FAIXA_BRANCA, (0, 0), d, lat, 12.25, 12.55, v0, v1)
        seta_anel(F, (R_ILHA + R_ANEL) / 2, math.radians(45 + 90 * k))
    return mal, conexoes('NESW', d=A)


# ---------------------------------------------------------------- mini-rotatória (1 ladrilho)
def rotatoria_mini():
    mal = novas()
    mal['ilha'] = Malha()
    mal['asfalto'].top(ASFALTO, -H, H, -H, H, 0)
    mal['asfalto'].top(ASFALTO, -H, H, H, LH, 0); mal['asfalto'].top(ASFALTO, -H, H, -LH, -H, 0)
    mal['asfalto'].top(ASFALTO, H, LH, -H, H, 0); mal['asfalto'].top(ASFALTO, -LH, -H, -H, H, 0)
    for sx in (1, -1):
        for sz in (1, -1):
            ruas.canto(mal, sx, sz)
    r = 1.7
    mal['calcada'].poly(CALCADA, [(*polar(r - CB, 2 * math.pi * i / 32)[:1], CH, polar(r - CB, 2 * math.pi * i / 32)[1]) for i in range(32)], (0, 1, 0))
    anel_plano(mal['meiofio'], MEIOFIO, r - CB, r, CH, 32)
    parede_circular(mal['meiofio'], MEIOFIO, r, 0.0, CH, 32)
    F = mal['faixas']
    for lado in 'NESW':
        d3 = ruas.LADOS[lado][1]
        d = np.array([d3[0], d3[2]]); lat = (d[1], -d[0])
        for c in range(-3, 4):
            ruas.retangulo_uv(F, FAIXA_BRANCA, (0, 0), d, lat, H + 0.15, H + 1.7, c - 0.25, c + 0.25)
        for v0, v1 in ((0.2, 0.8), (1.0, 1.6), (1.8, 2.4), (2.6, 3.2)):
            ruas.retangulo_uv(F, FAIXA_BRANCA, (0, 0), d, lat, LH - 0.55, LH - 0.25, v0, v1)
    for k in range(4):
        seta_anel(F, 2.75, math.radians(45 + 90 * k), comp=1.1, larg=0.18)
    return mal, conexoes('NESW')


PECAS = {
    'rotatoria': (rotatoria, 'Rotatória de 36 x 36 m (3 x 3 ladrilhos): ilha central, anel de mão única anti-horário, 4 braços de mão dupla e cantos de grama'),
    'rotatoria-mini': (rotatoria_mini, 'Mini-rotatória de 12 x 12 m (1 ladrilho): cruzamento com ilha central e setas'),
}
