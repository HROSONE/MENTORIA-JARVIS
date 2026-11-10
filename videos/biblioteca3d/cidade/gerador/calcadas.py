"""Calçadas e caminhos de pedestres (ladrilhos de 12 x 12 m, topo em y = 0,15, a altura das calçadas das ruas).
  - calcada-lisa: praça/calçadão pavimentado (lajes de 2 m em dois tons)
  - calcada-reta, -curva, -t, -cruzamento, -fim: caminho de 2,5 m (lajes de 1,5 m) cortado na grama, com as mesmas conexões das ruas
O caminho e a grama ficam no mesmo nível, sem sobrepor faces. Conexões no meio das bordas, como nas ruas."""
import math
from malha import Malha
from paleta import CALCADA, CALCADA_B, GRAMA
from ruas import LH, CH, conexoes

LP = 2.5                    # largura do caminho
HP = LP / 2
LAJE = 1.5                  # comprimento aproximado de cada laje


def tom(i):
    return CALCADA if i % 2 == 0 else CALCADA_B


def lajes_reta(m, eixo, a0, a1):
    """trecho reto do caminho ao longo de `eixo` ('z' ou 'x') entre a0 e a1, em lajes que alternam dois tons"""
    n = max(1, round(abs(a1 - a0) / LAJE))
    p = (a1 - a0) / n
    for i in range(n):
        u0, u1 = a0 + i * p, a0 + (i + 1) * p
        if eixo == 'z':
            m.top(tom(i), -HP, HP, min(u0, u1), max(u0, u1), CH)
        else:
            m.top(tom(i), min(u0, u1), max(u0, u1), -HP, HP, CH)


def arco(cx, cz, r, a0, a1, n):
    return [(cx + r * math.cos(a0 + (a1 - a0) * k / n), cz + r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(n + 1)]


def calcada_lisa():
    c = Malha()
    for i in range(6):
        for j in range(6):
            c.top(tom(i + j), -LH + 2 * i, -LH + 2 * i + 2, -LH + 2 * j, -LH + 2 * j + 2, CH)
    return [('Calcada', c)], conexoes('')


def _caminho(lados):
    con = conexoes(lados)
    for c in con:
        c['perfil'] = 'caminho-2,5m'
    return con


def calcada_reta():
    c, g = Malha(), Malha()
    lajes_reta(c, 'z', -LH, LH)
    g.top(GRAMA, -LH, -HP, -LH, LH, CH)
    g.top(GRAMA, HP, LH, -LH, LH, CH)
    return [('Calcada', c), ('Grama', g)], _caminho('NS')


def calcada_curva():
    """90° ligando S e E em torno do canto SE; raio da linha central 6 m. Lajes e grama usam os mesmos vértices (12 passos de 7,5°)."""
    c, g = Malha(), Malha()
    N = 12
    ang = lambda k: math.pi / 2 * k / N
    P = lambda a, r: (LH - r * math.cos(a), LH - r * math.sin(a))
    for k in range(N):
        a, b = P(ang(k), LH - HP), P(ang(k + 1), LH - HP)
        d, e = P(ang(k + 1), LH + HP), P(ang(k), LH + HP)
        c.quad(tom(k // 2), (a[0], CH, a[1]), (b[0], CH, b[1]), (d[0], CH, d[1]), (e[0], CH, e[1]), (0, 1, 0))
    g.plano(GRAMA, [(LH, LH)] + [P(ang(k), LH - HP) for k in range(N + 1)], CH)                      # canto interno (leque a partir do pivô)
    g.plano(GRAMA, [P(ang(k), LH + HP) for k in range(N + 1)] + [(LH, -LH), (-LH, -LH), (-LH, LH)], CH)  # resto do ladrilho
    return [('Calcada', c), ('Grama', g)], _caminho('SE')


def calcada_t():
    """braços W, E e S"""
    c, g = Malha(), Malha()
    c.top(CALCADA, -HP, HP, -HP, HP, CH)
    lajes_reta(c, 'x', -LH, -HP); lajes_reta(c, 'x', HP, LH); lajes_reta(c, 'z', HP, LH)
    g.top(GRAMA, -LH, LH, -LH, -HP, CH)
    g.top(GRAMA, -LH, -HP, HP, LH, CH); g.top(GRAMA, HP, LH, HP, LH, CH)
    return [('Calcada', c), ('Grama', g)], _caminho('WES')


def calcada_cruzamento():
    c, g = Malha(), Malha()
    c.top(CALCADA, -HP, HP, -HP, HP, CH)
    lajes_reta(c, 'x', -LH, -HP); lajes_reta(c, 'x', HP, LH); lajes_reta(c, 'z', -LH, -HP); lajes_reta(c, 'z', HP, LH)
    for sx in (1, -1):
        for sz in (1, -1):
            g.top(GRAMA, min(sx * HP, sx * LH), max(sx * HP, sx * LH), min(sz * HP, sz * LH), max(sz * HP, sz * LH), CH)
    return [('Calcada', c), ('Grama', g)], _caminho('NESW')


def calcada_fim():
    """caminho vindo do sul que termina numa pracinha redonda (raio 2,2 m). A pracinha e a ponta do caminho formam um só
    polígono, e a grama usa os mesmos vértices do círculo (sem frestas nem sobreposição)."""
    c, g = Malha(), Malha()
    zc, rp, N = -1.5, 2.2, 28
    zj = zc + math.sqrt(rp ** 2 - HP ** 2)                      # onde a borda do caminho encontra o círculo
    a0 = math.atan2(zj - zc, HP)                                # ângulo do ponto (+HP, zj)
    varredura = math.pi + 2 * a0                                # volta pelo lado de longe do caminho
    volta = [(rp * math.cos(a0 - varredura * k / N), zc + rp * math.sin(a0 - varredura * k / N)) for k in range(N + 1)]   # (+HP,zj) -> (-HP,zj)
    lajes_reta(c, 'z', 1.0, LH)
    c.plano(CALCADA, [(-HP, 1.0), (HP, 1.0)] + volta, CH)
    g.plano(GRAMA, [(-LH, LH), (-HP, LH), (-HP, zj)] + volta[::-1] + [(HP, zj), (HP, LH), (LH, LH), (LH, -LH), (-LH, -LH)], CH)
    return [('Calcada', c), ('Grama', g)], _caminho('S')


PECAS = {
    'calcada-lisa': (calcada_lisa, 'Praça/calçadão: ladrilho pavimentado com lajes de 2 m em dois tons'),
    'calcada-reta': (calcada_reta, 'Caminho de pedestres reto (2,5 m) sobre grama'),
    'calcada-curva': (calcada_curva, 'Caminho de pedestres em curva de 90° (ligando S e E)'),
    'calcada-t': (calcada_t, 'Caminho de pedestres em T (braços W, E e S)'),
    'calcada-cruzamento': (calcada_cruzamento, 'Cruzamento de caminhos de pedestres (4 braços)'),
    'calcada-fim': (calcada_fim, 'Caminho de pedestres que termina numa pracinha redonda (vindo do sul)'),
}
