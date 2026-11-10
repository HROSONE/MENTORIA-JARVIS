"""Prédios: residencial de 6 andares, residencial de 12 andares, comercial de vidro de 10 andares e loja de 3 andares.
Origem no centro da pegada, pé em y = 0 (coloque em y = 0,15 sobre a grama ou a calçada); a frente é +Z.
Cerca de 45 % das janelas ficam em VidroLuz e acendem à noite (kit.luzEstado)."""
import math
from edificio import Obra, matriz
from malha import Malha
from paleta import *
import letreiros

EX12 = {'tipo': 'predio', 'frente': '+Z', 'origem': 'centro da pegada, no chão (y = 0); sobre a grama do kit, y = 0,15', 'pegada': [12.0, 12.0]}
EX24 = dict(EX12, pegada=[24.0, 12.0])


def cantos(o, c, y0, y1, mat, largura=0.8, saliencia=0.1):
    """pilastras de canto de cima a baixo, salientes dos dois lados"""
    x0, x1, z0, z1 = c
    s = saliencia
    for sx, xa in ((-1, x0), (1, x1)):
        for sz, za in ((-1, z0), (1, z1)):
            xs = (xa, xa + sx * -largura) if sx < 0 else (xa - largura, xa)
            zs = (za, za + sz * -largura) if sz < 0 else (za - largura, za)
            o.caixa(mat, min(xs) - (s if sx < 0 else 0), max(xs) + (s if sx > 0 else 0), y0, y1, min(zs) - (s if sz < 0 else 0), max(zs) + (s if sz > 0 else 0), 'Detalhes', '+x-x+y+z-z')


def cobertura(o, c, y, tanque=True, antena=False, maquinas=True):
    o.laje_plana(c, y, mat=LAJE, platibanda=0.9, esp=0.25, mat_platibanda=CONCRETO_CLARO)
    yy = y + 0.25
    x0, x1, z0, z1 = c
    if maquinas:
        o.caixa(PAREDE_CINZA, x0 + 1.0, x0 + 3.6, yy, yy + 2.6, z0 + 1.0, z0 + 3.2, 'Detalhes')
        o.caixa(MOLDURA_ESCURA, x0 + 1.0, x0 + 3.6, yy + 2.6, yy + 2.72, z0 + 0.9, z0 + 3.3, 'Detalhes', '+x-x+y+z-z')
        o.porta('+x', (x0 + 1.0, x0 + 3.6, z0 + 1.0, z0 + 3.2), 0.0, 0.9, 1.9, y=yy, mat=METAL_ESCURO)
    if tanque:
        o.caixa_dagua((x0 + x1) / 2 + 1.6, yy, z1 - 2.2, r=1.15, h=1.6)
    if antena:
        o.antena(x1 - 1.2, yy, z0 + 1.4, 7.0)
    for k in range(3):
        o.ar_condicionado(x0 + 1.4 + k * 1.3, yy, z1 - 1.0, 0.9, 0.7, 0.55)


def residencial_6():
    o = Obra(21)
    Z0, Z1 = -5.0, 4.2                                   # 9,2 m de fundo: a marquise e as sacadas cabem em 12 m
    c = (-5, 5, Z0, Z1)
    Y0, HT, HP, N = 0.35, 3.6, 3.0, 5
    topo = Y0 + HT + N * HP
    o.piso(c, 0, Y0)
    o.caixa(PAREDE_AMARELA, -5, 5, Y0, topo - 0.05, Z0, Z1)
    cantos(o, c, Y0, topo - 0.05, PAREDE_TIJOLO)
    # térreo: portaria de vidro com marquise e duas vitrines
    o.porta('+z', c, 0.0, 2.2, 2.7, y=Y0, vidro=True, acesa=True)
    o.marquise('+z', c, 0.0, 4.2, 1.8, 3.15, esp=0.2)
    for u in (-3.0, 3.0):
        o.janela('+z', c, u, Y0 + 0.8, 1.9, 2.0, trav=True)
    for face, us in (('+x', (-2.4, 2.4)), ('-x', (-2.4, 2.4)), ('-z', (-3.0, 0.0, 3.0))):
        for u in us:
            o.janela(face, c, u, Y0 + 0.8, 1.4, 1.6)
    for f in range(N):
        y = Y0 + HT + f * HP
        o.caixa(LAJE, -5.04, 5.04, y - 0.1, y + 0.1, Z0 - 0.04, Z1 + 0.04, 'Molduras', '+x-x+z-z')               # cinta da laje
        for u in (-3.2, 3.2):
            o.janela('+z', c, u, y + 0.85, 1.4, 1.4)
        o.porta('+z', c, 0.0, 1.9, 2.1, y=y + 0.18, vidro=True, acesa=(o.rng.random() < 0.45))
        o.sacada('+z', c, 0.0, y + 0.18, 3.3, prof=1.0, alt=1.0)
        for face, us in (('+x', (-2.5, 2.5)), ('-x', (-2.5, 2.5))):
            for u in us:
                o.janela(face, c, u, y + 0.85, 1.4, 1.4)
        for u in (-3.0, 0.0, 3.0):
            o.janela('-z', c, u, y + 0.85, 1.4, 1.4)
    cobertura(o, c, topo)
    return o.nos()


def residencial_12():
    o = Obra(22)
    Z0, Z1 = -5.0, 4.2                                   # 9,2 m de fundo: a marquise e as sacadas cabem em 12 m
    c = (-5, 5, Z0, Z1)
    Y0, HT, HP, N = 0.35, 3.8, 3.0, 9
    topo = Y0 + HT + N * HP
    o.piso(c, 0, Y0)
    o.caixa(PAREDE_CINZA, -5, 5, Y0, topo - 0.05, Z0, Z1)
    cantos(o, c, Y0, topo - 0.05, PAREDE_AZUL_ESCURO, 0.7, 0.08)
    o.porta('+z', c, 0.0, 2.4, 2.8, y=Y0, vidro=True, acesa=True)
    o.marquise('+z', c, 0.0, 4.4, 1.7, 3.2, esp=0.2)
    for u in (-3.0, 3.0):
        o.janela('+z', c, u, Y0 + 0.8, 1.9, 2.0)
    for face, us in (('+x', (-2.4, 2.4)), ('-x', (-2.4, 2.4)), ('-z', (-3.0, 0.0, 3.0))):
        for u in us:
            o.janela(face, c, u, Y0 + 0.8, 1.4, 1.6)
    for f in range(N):
        y = Y0 + HT + f * HP
        for u in (-3.0, 0.0, 3.0):
            o.janela('+z', c, u, y + 0.85, 1.4, 1.5, trav=False)
        for face, us in (('+x', (-2.5, 2.5)), ('-x', (-2.5, 2.5))):
            for u in us:
                o.janela(face, c, u, y + 0.85, 1.4, 1.5, trav=False)
        for u in (-3.0, 0.0, 3.0):
            o.janela('-z', c, u, y + 0.85, 1.4, 1.5, trav=False)
    # as duas últimas coberturas recuam: terraço de cobertura com sacadas
    o.laje_plana(c, topo - 0.05, mat=LAJE, platibanda=0.0, esp=0.3, avanco=0.12)
    cr = (-4.0, 4.0, Z0 + 1.0, Z1 - 1.0)
    for f in range(2):
        y = topo + 0.25 + f * HP
        o.caixa(PAREDE_BRANCA, cr[0], cr[1], y, y + HP - 0.05, cr[2], cr[3])
        for u in (-2.0, 2.0):
            o.janela('+z', cr, u, y + 0.85, 1.6, 1.6, trav=False)
        for face in ('+x', '-x'):
            o.janela(face, cr, 0.0, y + 0.85, 1.8, 1.6, trav=False)
        for u in (-2.0, 2.0):
            o.janela('-z', cr, u, y + 0.85, 1.6, 1.6, trav=False)
    cobertura(o, cr, topo + 0.25 + 2 * HP - 0.05 + 0.0, tanque=True, antena=True, maquinas=False)
    return o.nos()


def comercial_10():
    o = Obra(23, p_luz=0.5)
    Z0, Z1 = -5.5, 3.5
    c = (-10, 10, Z0, Z1)
    Y0, H0, HP, N = 0.35, 5.0, 3.6, 10
    topo = Y0 + H0 + N * HP
    o.piso(c, 0, Y0, mat=CONCRETO_CLARO)
    o.caixa(PAREDE_GRAFITE, -10, 10, Y0, topo, Z0, Z1)
    # lobby de dois andares todo em vidro, com portas no meio e marquise
    larg = 20.0
    for k in range(10):
        u = -larg / 2 + 1.0 + k * 2.0
        o.painel_vidro('+z', c, u, Y0 + 0.2, 1.9, H0 - 0.3, acesa=True, escura=False)
    for k in range(4):
        u = -4.5 + 1.0 + k * 2.0
        for face in ('+x', '-x'):
            o.painel_vidro(face, c, u, Y0 + 0.2, 1.9, H0 - 0.3, acesa=None, escura=False)
    for k in range(10):
        u = -larg / 2 + 1.0 + k * 2.0
        o.painel_vidro('-z', c, u, Y0 + 0.2, 1.9, H0 - 0.3, acesa=None, escura=False)
    o.porta('+z', c, 0.0, 2.6, 2.6, y=Y0, vidro=True, acesa=True, mold=MOLDURA_ESCURA)
    o.marquise('+z', c, 0.0, 6.0, 2.4, 3.3, esp=0.25, mat=PAREDE_GRAFITE)
    # torre de vidro: faixas de parapeito escuro e painéis de vidro por andar
    for f in range(N):
        y = Y0 + H0 + f * HP
        for face, n in (('+z', 10), ('-z', 10), ('+x', 4), ('-x', 4)):
            comp = 20.0 if face in ('+z', '-z') else 9.0
            for k in range(n):
                u = -comp / 2 + comp / n / 2 + k * comp / n
                o.painel_vidro(face, c, u, y + 0.85, comp / n - 0.12, HP - 0.85, escura=True, recuo=0.06)
        o.caixa(PAREDE_CINZA, -10.1, 10.1, y, y + 0.85, Z0 - 0.1, Z1 + 0.1, 'Molduras', '+x-x+z-z')
    # montantes verticais escuros
    for face, n, comp in (('+z', 10, 20.0), ('-z', 10, 20.0), ('+x', 4, 9.0), ('-x', 4, 9.0)):
        for k in range(n + 1):
            u = -comp / 2 + k * comp / n
            m = Malha()
            m.caixa(MOLDURA_ESCURA, u - 0.06, u + 0.06, Y0 + H0, topo, 0.0, 0.12, '+z+x-x')
            o.n['Molduras'].add(m, matriz(face, c, 0.0, 0.0))
    cobertura(o, c, topo, tanque=False, antena=True, maquinas=False)
    for k in range(4):
        o.caixa(PAREDE_CINZA, -8 + k * 4.4, -6 + k * 4.4, topo + 0.25, topo + 2.0, Z0 + 1.5, Z0 + 4.0, 'Detalhes')
    return o.nos()


def loja_3():
    o = Obra(24)
    Z0, Z1 = -5.0, 4.0
    c = (-5.5, 5.5, Z0, Z1)
    Y0, H0, HP, N = 0.35, 4.2, 3.0, 2
    topo = Y0 + H0 + N * HP
    o.piso(c, 0, Y0)
    o.caixa(PAREDE_ROSA, -5.5, 5.5, Y0, topo - 0.05, Z0, Z1)
    cantos(o, c, Y0, topo - 0.05, PAREDE_BRANCA, 0.5, 0.08)
    # loja: duas vitrines, porta de vidro, toldo listrado e letreiro
    for u in (-3.3, 3.3):
        o.painel_vidro('+z', c, u, Y0 + 0.6, 3.0, 2.7, acesa=True, escura=False)
        o.caixa(MOLDURA_BRANCA, u - 1.55, u + 1.55, Y0, Y0 + 0.6, Z1, Z1 + 0.08, 'Molduras', '+z+x-x+y')
        for k in range(1, 3):
            o.caixa(MOLDURA_BRANCA, u - 1.5 + k * 1.0 - 0.02, u - 1.5 + k * 1.0 + 0.02, Y0 + 0.6, Y0 + 3.3, Z1, Z1 + 0.07, 'Molduras', '+z')
    o.porta('+z', c, 0.0, 1.7, 2.5, y=Y0, vidro=True, acesa=True)
    for k in range(12):
        xa, xb = -5.4 + k * 0.9, -5.4 + (k + 1) * 0.9
        mat = PAREDE_VERMELHA if k % 2 == 0 else BRANCO_PURO
        a = Malha()
        a.poly(mat, [(xa, 3.7, 0.0), (xb, 3.7, 0.0), (xb, 3.25, 1.4), (xa, 3.25, 1.4)], (0, 1, 0.5))
        a.poly(mat, [(xa, 3.7, 0.0), (xa, 3.25, 1.4), (xb, 3.25, 1.4), (xb, 3.7, 0.0)], (0, -1, -0.5))
        o.n['Detalhes'].add(a, matriz('+z', c, 0.0, 0.0))
    o.letreiro(letreiros.placa_loja(), '+z', c, 0.0, Y0 + H0 - 0.55, 5.4, 0.9, d=0.14)
    # andares de cima: janelas com pequenas sacadas de ferro
    for f in range(N):
        y = Y0 + H0 + f * HP
        o.caixa(BRANCO_PURO, -5.58, 5.58, y - 0.08, y + 0.08, Z0 - 0.08, Z1 + 0.08, 'Molduras', '+x-x+z-z')
        for u in (-3.3, 0.0, 3.3):
            o.janela('+z', c, u, y + 0.35, 1.2, 1.9, peitoril=False)
            o.sacada('+z', c, u, y + 0.35, 1.9, prof=0.6, alt=1.0, grade=PRETO_FOSCO, vidro=False)
        for face, us in (('+x', (-2.5, 2.5)), ('-x', (-2.5, 2.5))):
            for u in us:
                o.janela(face, c, u, y + 0.8, 1.2, 1.5, peitoril=True)
        for u in (-3.3, 0.0, 3.3):
            o.janela('-z', c, u, y + 0.8, 1.2, 1.5, peitoril=True)
    for face, us in (('+x', (-2.5, 2.5)), ('-x', (-2.5, 2.5)), ('-z', (-3.3, 0.0, 3.3))):
        for u in us:
            o.janela(face, c, u, Y0 + 0.9, 1.4, 1.8)
    # cornija e cobertura
    o.caixa(BRANCO_PURO, -5.75, 5.75, topo - 0.35, topo - 0.05, Z0 - 0.25, Z1 + 0.25, 'Molduras', '+x-x+y+z-z-y')
    o.laje_plana(c, topo - 0.05, mat=LAJE, platibanda=0.6, esp=0.25, mat_platibanda=BRANCO_PURO)
    o.caixa_dagua(2.0, topo + 0.2, -2.5, r=0.9, h=1.3)
    return o.nos()


PECAS = {
    'predio-residencial-6': (residencial_6, 'Prédio residencial de 6 andares (cantos de tijolo, sacadas de vidro, portaria com marquise e caixa-d\'água)', EX12),
    'predio-residencial-12': (residencial_12, 'Prédio residencial de 12 andares com duas coberturas recuadas, caixa-d\'água e antena', EX12),
    'predio-comercial-10': (comercial_10, 'Torre comercial de vidro de 10 andares (24 x 12 m) com lobby de dois andares e marquise', EX24),
    'predio-loja-3': (loja_3, 'Prédio de 3 andares com loja no térreo (vitrines, toldo listrado, letreiro) e apartamentos com sacadinhas de ferro', EX12),
}
