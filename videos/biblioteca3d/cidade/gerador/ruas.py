"""Peças de rua (ladrilho de 12 x 12 m): reta, curva 90°, T, cruzamento e fim de rua.

Convenções (metros, Y para cima):
  - pista de mão dupla: 2 faixas de 3,5 m = 7 m de asfalto; calçada de 2,5 m de cada lado; 12 m de largura total
  - topo do asfalto em y = 0; topo da calçada em y = 0,15 (meio-fio)
  - a reta corre ao longo de Z (mesma direção da frente dos carros do Kenney)
  - origem no centro do ladrilho; conexões no meio de cada borda (N = -Z, S = +Z, E = +X, W = -X)
"""
import math
import numpy as np
from malha import Malha, V
from paleta import *

TILE = 12.0          # lado do ladrilho
H = 3.5              # meia largura do asfalto (uma faixa)
S = 2.5              # largura da calçada
CH = 0.15            # altura do meio-fio
CB = 0.18            # largura da faixa clara do meio-fio
YF = 0.012           # altura das tintas sobre o asfalto
RC = 2.0             # raio do meio-fio nos cantos dos cruzamentos
BORDA = 0.30         # distância da linha de borda ao meio-fio
LH = TILE / 2

LADOS = {'N': ((0, 0, -LH), (0, 0, -1)), 'S': ((0, 0, LH), (0, 0, 1)), 'E': ((LH, 0, 0), (1, 0, 0)), 'W': ((-LH, 0, 0), (-1, 0, 0))}


def conexoes(lados):
    return [{'lado': l, 'pos': list(LADOS[l][0]), 'dir': list(LADOS[l][1]), 'perfil': 'rua-2-faixas'} for l in lados]


def novas():
    return {k: Malha() for k in ('asfalto', 'meiofio', 'calcada', 'faixas')}


# ---------------------------------------------------------------- caminhos (reto e arco)
class Reto:
    """de s=0 (z=-6) a s=12 (z=+6); `off` é o deslocamento lateral (x)"""
    L = TILE

    def pt(self, s, off):
        return (off, -LH + s)

    def n(self, s0, s1):
        return 1


class Arco:
    """quarto de círculo em torno do canto SE (6,6); centro da pista a 6 m do pivô.
    s=0 está na borda S (z=+6), s=L na borda E (x=+6). `off` > 0 é para fora (longe do pivô)."""
    R = LH
    L = LH * math.pi / 2

    def pt(self, s, off):
        th = s / self.R
        r = self.R + off
        return (LH - r * math.cos(th), LH - r * math.sin(th))

    def n(self, s0, s1):
        return max(2, int(round(16 * (s1 - s0) / self.L)))


def lateral(path, s, off):
    a, b = path.pt(s, off - 0.01), path.pt(s, off + 0.01)
    d = V(b[0] - a[0], b[1] - a[1])
    return d / np.linalg.norm(d)


def extrudar_perfil(mal, path, s0, s1):
    """asfalto + meio-fio + calçada ao longo de um caminho, entre s0 e s1"""
    n = path.n(s0, s1)
    ss = np.linspace(s0, s1, n + 1)
    for i in range(n):
        sa, sb = ss[i], ss[i + 1]
        sm = (sa + sb) / 2

        def faixa_h(m, mat, oa, ob, y):
            m.quad(mat, (*path.pt(sa, oa)[:1], y, path.pt(sa, oa)[1]), (path.pt(sb, oa)[0], y, path.pt(sb, oa)[1]),
                   (path.pt(sb, ob)[0], y, path.pt(sb, ob)[1]), (path.pt(sa, ob)[0], y, path.pt(sa, ob)[1]), (0, 1, 0))

        def parede(m, mat, o, y0, y1, face):
            p0, p1 = path.pt(sa, o), path.pt(sb, o)
            lat = lateral(path, sm, o)
            m.wall(mat, p0, p1, y0, y1, (face * lat[0], face * lat[1]))

        faixa_h(mal['asfalto'], ASFALTO, -H, H, 0.0)
        for side in (1, -1):
            faixa_h(mal['meiofio'], MEIOFIO, side * H, side * (H + CB), CH)
            faixa_h(mal['calcada'], CALCADA, side * (H + CB), side * (H + S), CH)
            parede(mal['meiofio'], MEIOFIO, side * H, 0.0, CH, -side)             # degrau voltado para a pista
            parede(mal['calcada'], CALCADA_LADO, side * (H + S), 0.0, CH, side)   # lateral externa da calçada


def retangulo_uv(m, mat, o, d, lat, u0, u1, v0, v1, y=YF):
    P = lambda u, v: (o[0] + u * d[0] + v * lat[0], y, o[1] + u * d[1] + v * lat[1])
    m.quad(mat, P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1), (0, 1, 0))


def tinta_no_caminho(m, mat, path, s0, s1, oa, ob, passo=0.5, y=YF):
    n = max(1, int(math.ceil((s1 - s0) / passo))) if isinstance(path, Arco) else 1
    ss = np.linspace(s0, s1, n + 1)
    for i in range(n):
        sa, sb = ss[i], ss[i + 1]
        pa0, pb0, pa1, pb1 = path.pt(sa, oa), path.pt(sb, oa), path.pt(sa, ob), path.pt(sb, ob)
        m.quad(mat, (pa0[0], y, pa0[1]), (pb0[0], y, pb0[1]), (pb1[0], y, pb1[1]), (pa1[0], y, pa1[1]), (0, 1, 0))


def tracejado_central(m, path, s0, s1, mat=FAIXA_AMARELA, larg=0.15):
    """tracejado amarelo com trechos de 3 m e vão de 3 m; as bordas do ladrilho caem no meio de um vão"""
    L = path.L
    if isinstance(path, Reto):
        dashes = [(1.5, 4.5), (7.5, 10.5)]
    else:
        d = (L - 3.0 - 3.0) / 2
        dashes = [(1.5, 1.5 + d), (L - 1.5 - d, L - 1.5)]
    for a, b in dashes:
        a, b = max(a, s0), min(b, s1)
        if b - a > 0.05:
            tinta_no_caminho(m, mat, path, a, b, -larg / 2, larg / 2)


def linhas_de_borda(m, path, s0, s1, mat=FAIXA_BRANCA, larg=0.12):
    c = H - BORDA
    for side in (1, -1):
        tinta_no_caminho(m, mat, path, s0, s1, side * (c - larg / 2), side * (c + larg / 2))


# ---------------------------------------------------------------- travessias e linhas de retenção nas bocas dos cruzamentos
def boca(m, lado):
    """faixa de pedestres (zebra) + linha de retenção na boca `lado` de um cruzamento"""
    pos, d3 = LADOS[lado]
    d = V(d3[0], d3[2])
    lat = V(d[1], -d[0])                          # direita de quem chega (mão direita)
    o = V(0, 0)
    for c in range(-3, 4):                        # 7 listras de 0,5 m
        retangulo_uv(m, FAIXA_BRANCA, o, d, lat, H + 0.15, H + 1.7, c - 0.25, c + 0.25)
    retangulo_uv(m, FAIXA_BRANCA, o, d, lat, LH - 0.65, LH - 0.25, 0.15, H - 0.15)   # linha de retenção na faixa de quem chega


# ---------------------------------------------------------------- cantos arredondados (blocos de calçada)
def canto(mal, sx, sz, rr=RC):
    C = V(sx * (H + rr), sz * (H + rr))
    arc = lambda r, k, n: (C[0] - sx * r * math.cos(k * math.pi / 2 / n), C[1] - sz * r * math.sin(k * math.pi / 2 / n))
    N = 8
    # 1) fillet de asfalto entre o canto e o arco
    K = (sx * H, sz * H)
    pts = [(K[0], 0.0, K[1])] + [(arc(rr, k, N)[0], 0.0, arc(rr, k, N)[1]) for k in range(N + 1)]
    mal['asfalto'].poly(ASFALTO, pts, (0, 1, 0))
    # 2) topo da calçada (convexo)
    top = [arc(rr - CB, k, N) for k in range(N + 1)] + [(sx * LH, sz * (H + CB)), (sx * LH, sz * LH), (sx * (H + CB), sz * LH)]
    mal['calcada'].poly(CALCADA, [(x, CH, z) for x, z in top], (0, 1, 0))
    # 3) faixa clara do meio-fio (arco + dois trechos retos)
    for k in range(N):
        a0, a1, b0, b1 = arc(rr, k, N), arc(rr, k + 1, N), arc(rr - CB, k, N), arc(rr - CB, k + 1, N)
        mal['meiofio'].quad(MEIOFIO, (a0[0], CH, a0[1]), (a1[0], CH, a1[1]), (b1[0], CH, b1[1]), (b0[0], CH, b0[1]), (0, 1, 0))
    mal['meiofio'].top(MEIOFIO, min(sx * (H + rr), sx * LH), max(sx * (H + rr), sx * LH), min(sz * H, sz * (H + CB)), max(sz * H, sz * (H + CB)), CH)
    mal['meiofio'].top(MEIOFIO, min(sx * H, sx * (H + CB)), max(sx * H, sx * (H + CB)), min(sz * (H + rr), sz * LH), max(sz * (H + rr), sz * LH), CH)
    # 4) degraus voltados para a pista
    for k in range(N):
        a0, a1 = arc(rr, k, N), arc(rr, k + 1, N)
        mid = ((a0[0] + a1[0]) / 2 - C[0], (a0[1] + a1[1]) / 2 - C[1])
        mal['meiofio'].wall(MEIOFIO, a0, a1, 0.0, CH, mid)
    mal['meiofio'].wall(MEIOFIO, (sx * (H + rr), sz * H), (sx * LH, sz * H), 0.0, CH, (0, -sz))
    mal['meiofio'].wall(MEIOFIO, (sx * H, sz * (H + rr)), (sx * H, sz * LH), 0.0, CH, (-sx, 0))


# ---------------------------------------------------------------- as peças
def rua_reta():
    mal = novas()
    p = Reto()
    extrudar_perfil(mal, p, 0, p.L)
    tracejado_central(mal['faixas'], p, 0, p.L)
    linhas_de_borda(mal['faixas'], p, 0, p.L)
    return mal, conexoes('NS')


def rua_curva():
    mal = novas()
    p = Arco()
    extrudar_perfil(mal, p, 0, p.L)
    tracejado_central(mal['faixas'], p, 0, p.L)
    linhas_de_borda(mal['faixas'], p, 0, p.L)
    return mal, conexoes('SE')


def rua_cruzamento():
    mal = novas()
    A = mal['asfalto']
    A.top(ASFALTO, -H, H, -H, H, 0)
    A.top(ASFALTO, -H, H, H, LH, 0); A.top(ASFALTO, -H, H, -LH, -H, 0)
    A.top(ASFALTO, H, LH, -H, H, 0); A.top(ASFALTO, -LH, -H, -H, H, 0)
    for sx in (1, -1):
        for sz in (1, -1):
            canto(mal, sx, sz)
    for l in 'NESW':
        boca(mal['faixas'], l)
    return mal, conexoes('NESW')


def rua_t():
    """T: braços W, E e S; o lado N é calçada contínua"""
    mal = novas()
    A = mal['asfalto']
    A.top(ASFALTO, -LH, LH, -H, H, 0)                 # barra W-E inteira
    A.top(ASFALTO, -H, H, H, LH, 0)                   # haste para o sul
    for sx in (1, -1):
        canto(mal, sx, 1)
    # calçada contínua ao norte
    mal['calcada'].top(CALCADA, -LH, LH, -LH, -(H + CB), CH)
    mal['meiofio'].top(MEIOFIO, -LH, LH, -(H + CB), -H, CH)
    mal['meiofio'].wall(MEIOFIO, (-LH, -H), (LH, -H), 0.0, CH, (0, 1))
    mal['calcada'].wall(CALCADA_LADO, (-LH, -LH), (LH, -LH), 0.0, CH, (0, -1))
    for l in 'WES':
        boca(mal['faixas'], l)
    return mal, conexoes('WES')


def rua_fim():
    """fim de rua: braço vindo do sul, fechado ao norte por calçada"""
    mal = novas()
    p = Reto()
    s0 = LH - H                                         # começa em z = -3,5
    extrudar_perfil(mal, p, s0, p.L)
    mal['asfalto'].top(ASFALTO, -H, H, -H, H, 0) if False else None
    cap_z0, cap_z1 = -LH, -H
    mal['calcada'].top(CALCADA, -LH, LH, cap_z0, cap_z1 - CB, CH)
    mal['meiofio'].top(MEIOFIO, -H - CB, H + CB, cap_z1 - CB, cap_z1, CH)
    for side in (1, -1):
        a, b = sorted((side * (H + CB), side * LH))
        mal['calcada'].top(CALCADA, a, b, cap_z1 - CB, cap_z1, CH)
    mal['meiofio'].wall(MEIOFIO, (-H, cap_z1), (H, cap_z1), 0.0, CH, (0, 1))
    mal['calcada'].wall(CALCADA_LADO, (-LH, cap_z0), (LH, cap_z0), 0.0, CH, (0, -1))
    for side in (1, -1):
        mal['calcada'].wall(CALCADA_LADO, (side * LH, cap_z0), (side * LH, cap_z1), 0.0, CH, (side, 0))
    # tinta: tracejado e bordas no trecho existente
    tracejado_central(mal['faixas'], p, s0, p.L)
    linhas_de_borda(mal['faixas'], p, s0, p.L)
    return mal, conexoes('S')


PECAS = {
    'rua-reta': (rua_reta, 'Reta de 12 m, mão dupla, com tracejado central e linhas de borda'),
    'rua-curva': (rua_curva, 'Curva de 90° ligando as bordas S e E'),
    'rua-t': (rua_t, 'Entroncamento em T com braços W, E e S, faixas de pedestres e linhas de retenção'),
    'rua-cruzamento': (rua_cruzamento, 'Cruzamento de 4 braços com faixas de pedestres e linhas de retenção'),
    'rua-fim': (rua_fim, 'Fim de rua (sem saída) com braço vindo do sul'),
}
