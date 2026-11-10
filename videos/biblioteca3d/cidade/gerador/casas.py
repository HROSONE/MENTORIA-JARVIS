"""Casas: térrea simples, sobrado, moderna e colonial. Origem no centro da pegada (lote de 12 x 12 m), pé em y = 0 (coloque em y = 0,15
sobre a grama); a frente, com a porta, é +Z. Janelas sorteadas ficam acesas à noite (nó VidroLuz)."""
import math
from edificio import Obra
from paleta import *

PEGADA = [12.0, 12.0]
EX = {'tipo': 'casa', 'frente': '+Z', 'origem': 'centro da pegada, no chão (y = 0); sobre a grama do kit, y = 0,15', 'pegada': PEGADA}


def garagem_porta(o, face, c, u, w, h, y=0.38, mat=PAREDE_CINZA):
    """portão de garagem basculante: folha com frisos horizontais"""
    from edificio import matriz
    from malha import Malha
    m, f = Malha(), Malha()
    m.quad(mat, (-w / 2, 0, 0.04), (w / 2, 0, 0.04), (w / 2, h, 0.04), (-w / 2, h, 0.04), (0, 0, 1))
    for k in range(1, 6):
        yy = h * k / 6
        f.caixa(PAREDE_GRAFITE, -w / 2, w / 2, yy - 0.012, yy + 0.012, 0.04, 0.06, '+z+y-y')
    for sx in (-1, 1):
        f.caixa(MOLDURA_BRANCA, sx * (w / 2) - 0.07 if sx > 0 else -w / 2, sx * (w / 2) if sx > 0 else -w / 2 + 0.07, 0, h, 0.0, 0.09, '+z+x-x')
    f.caixa(MOLDURA_BRANCA, -w / 2, w / 2, h - 0.07, h, 0.0, 0.09, '+z+y-y')
    M = matriz(face, c, u, y)
    o.n['Portas'].add(m, M)
    o.n['Molduras'].add(f, M)


def casa_simples():
    o = Obra(11)
    c = (-4, 4, -4.6, 3.4)
    o.piso(c)
    Y0, H = 0.38, 2.8
    top = Y0 + H
    o.caixa(PAREDE_AMARELA, -4, 4, Y0, top - 0.06, -4.6, 3.4)          # o topo fica 6 cm abaixo do telhado (evita faíscas onde se encontram)
    o.janela('+z', c, -2.55, 1.05, 1.4, 1.25, peitoril=True)
    o.janela('+z', c, 2.65, 1.05, 1.4, 1.25, peitoril=True)
    o.porta('+z', c, 0.1, 1.0, 2.1, y=Y0, mat=MADEIRA)
    o.alpendre('+z', c, 0.1, 2.6, 1.3, y_piso=Y0, y_teto=2.65)
    for face, us in (('+x', (-2.4, 0.0, 2.4)), ('-x', (-2.4, 0.0, 2.4)), ('-z', (-2.0, 2.0))):
        for u in us:
            o.janela(face, c, u, 1.05, 1.2, 1.2, peitoril=True)
    o.telhado_duas_aguas(c, top, 1.85, beiral=0.55, eixo='x', mat=TELHA, mat_oitao=PAREDE_AMARELA)
    # chaminé de tijolo no lado do fundo
    o.caixa(PAREDE_TIJOLO, 2.0, 2.7, top + 0.2, top + 2.9, -2.9, -2.2, 'Paredes')
    o.caixa(CONCRETO_CLARO, 1.9, 2.8, top + 2.9, top + 3.02, -3.0, -2.1, 'Paredes', '+x-x+y+z-z')
    return o.nos()


def casa_sobrado():
    o = Obra(12)
    c = (-4.5, 4.5, -4.4, 3.6)
    o.piso(c)
    Y0, H1, H2 = 0.38, 2.95, 2.8
    t1, t2 = Y0 + H1, Y0 + H1 + H2
    o.caixa(PAREDE_BRANCA, -4.5, 4.5, Y0, t2 - 0.06, -4.4, 3.6)
    o.caixa(LAJE, -4.58, 4.58, t1 - 0.12, t1 + 0.12, -4.48, 3.68, 'Molduras')              # cinta entre os pavimentos
    # térreo
    garagem_porta(o, '+z', c, -2.55, 2.7, 2.25)
    o.porta('+z', c, 0.7, 1.0, 2.1, y=Y0, mat=MADEIRA_ESCURA)
    o.janela('+z', c, 3.0, 1.0, 1.3, 1.3, peitoril=True)
    o.alpendre('+z', c, 0.7, 2.0, 0.9, y_piso=Y0, y_teto=2.7)
    # andar de cima: sacada com porta de vidro e duas janelas
    o.porta('+z', c, 0.0, 2.2, 2.15, y=t1 + 0.15, vidro=True, acesa=False)
    o.sacada('+z', c, 0.0, t1 + 0.15, 3.6, prof=1.3, alt=1.0)
    for u in (-3.15, 3.15):
        o.janela('+z', c, u, t1 + 0.85, 1.2, 1.3, peitoril=True)
    for face, us in (('+x', (-2.4, 0.0, 2.4)), ('-x', (-2.4, 0.0, 2.4)), ('-z', (-2.8, 0.0, 2.8))):
        for u in us:
            o.janela(face, c, u, 1.0, 1.2, 1.3)
            o.janela(face, c, u, t1 + 0.85, 1.2, 1.3)
    o.telhado_quatro_aguas(c, t2, 2.0, beiral=0.6, mat=TELHA_MARROM)
    return o.nos()


def casa_moderna():
    o = Obra(13)
    c = (-5, 5, -4, 4)
    o.piso(c, folga=0.04)
    Y0 = 0.38
    # térreo branco, andar de cima em grafite deslocado para a esquerda
    o.caixa(PAREDE_BRANCA, -5, 5, Y0, 3.5, -4, 4)
    cu = (-5.2, 1.0, -4.2, 2.6)
    o.caixa(PAREDE_GRAFITE, cu[0], cu[1], 3.5, 6.5, cu[2], cu[3])
    o.laje_plana(cu, 6.5, mat=LAJE, platibanda=0.0, esp=0.3, avanco=0.35)
    o.laje_plana((-5, 5, -4, 4), 3.5, mat=LAJE, platibanda=0.0, esp=0.25, avanco=0.0)
    # frente do térreo: vidro grande, porta e garagem
    for k in range(3):
        o.painel_vidro('+z', (-5, 5, -4, 4), -3.1 + k * 1.45, 0.55, 1.4, 2.45, escura=True)
    o.porta('+z', (-5, 5, -4, 4), 0.2, 1.1, 2.3, y=Y0, mat=MADEIRA_ESCURA, mold=MOLDURA_ESCURA)
    garagem_porta(o, '+z', (-5, 5, -4, 4), 3.2, 3.0, 2.3, mat=PAREDE_CINZA)
    # andar de cima: faixa de vidro, ripado de madeira e janelas
    o.painel_vidro('+z', cu, -1.25, 3.85, 2.2, 2.2, escura=True)
    o.painel_vidro('+z', cu, 1.25 - 0.1, 3.85, 1.5, 2.2, escura=True)
    o.caixa(MADEIRA, cu[1] - 1.2, cu[1], 3.5, 6.5, cu[3], cu[3] + 0.1, 'Detalhes', '+x-x+z')
    for k in range(10):
        x = cu[1] - 1.15 + k * 0.12
        o.caixa(MADEIRA_ESCURA, x - 0.015, x + 0.015, 3.5, 6.5, cu[3] + 0.1, cu[3] + 0.16, 'Detalhes', '+x-x+z')
    for face, us in (('+x', (-2.0, 1.5)), ('-z', (-3.0, 0.0, 3.0))):
        for u in us:
            o.janela(face, (-5, 5, -4, 4), u, 1.3, 1.4, 1.3, escura=True, mold=MOLDURA_ESCURA)
    for u in (-2.0, 1.2):
        o.janela('+x', cu, u, 4.1, 1.4, 1.3, escura=True, mold=MOLDURA_ESCURA)
    for u in (-3.0, -0.5, 2.0):
        o.janela('-z', cu, u, 4.1, 1.4, 1.3, escura=True, mold=MOLDURA_ESCURA)
    for u in (-2.0, 1.5):
        o.janela('-x', cu, u, 4.1, 1.4, 1.3, escura=True, mold=MOLDURA_ESCURA)
    # guarda-corpo de vidro no terraço sobre a garagem
    o.caixa(MOLDURA_ESCURA, 1.1, 5.0, 3.75, 3.8, 3.9, 4.0, 'Molduras')
    o.n['Vidro'].quad(VIDRO, (1.15, 3.8, 3.97), (4.95, 3.8, 3.97), (4.95, 4.7, 3.97), (1.15, 4.7, 3.97), (0, 0, 1))
    o.n['Vidro'].quad(VIDRO, (1.15, 3.8, 3.97), (1.15, 4.7, 3.97), (4.95, 4.7, 3.97), (4.95, 3.8, 3.97), (0, 0, -1))
    o.caixa(MOLDURA_ESCURA, 1.1, 5.0, 4.7, 4.76, 3.9, 4.0, 'Molduras')
    return o.nos()


def casa_colonial():
    o = Obra(14)
    c = (-5.2, 5.2, -4.0, 3.7)
    o.piso(c)
    Y0, H = 0.45, 3.1
    top = Y0 + H
    o.caixa(PAREDE_AZUL, -5.2, 5.2, Y0, top - 0.06, -4.0, 3.7)
    # varanda coberta ao longo de toda a frente
    o.caixa(CONCRETO_CLARO, -5.5, 5.5, 0.0, Y0, 3.6, 4.9, 'Detalhes', '+x-x+y+z')
    for x in (-4.8, -2.9, -1.0, 1.0, 2.9, 4.8):
        o.coluna(x, 4.7, Y0, top, 0.14)
        o.caixa(BRANCO_PURO, x - 0.2, x + 0.2, top - 0.2, top, 4.5, 4.9, 'Detalhes')
    o.degraus('+z', c, 0.0, 2.2, 3, y_topo=Y0, z0=1.2)
    # frente: porta dupla e quatro janelas com venezianas
    o.porta('+z', c, 0.0, 1.7, 2.5, y=Y0, mat=MADEIRA_ESCURA, mold=MOLDURA_BRANCA)
    for u in (-3.6, -1.9, 1.9, 3.6):
        o.janela('+z', c, u, Y0 + 0.8, 1.0, 1.8, peitoril=True)
        for sx in (-1, 1):
            xs = u + sx * 0.72
            o.caixa(PAREDE_VERDE, xs - 0.22, xs + 0.22, Y0 + 0.8, Y0 + 2.6, 3.7, 3.77, 'Detalhes', '+z+x-x+y')
            for k in range(5):
                yy = Y0 + 0.95 + k * 0.34
                o.caixa(PAREDE_GRAFITE, xs - 0.17, xs + 0.17, yy, yy + 0.02, 3.77, 3.785, 'Detalhes', '+z')
    for face, us in (('+x', (-2.0, 2.0)), ('-x', (-2.0, 2.0)), ('-z', (-3.6, -1.2, 1.2, 3.6))):
        for u in us:
            o.janela(face, c, u, Y0 + 0.8, 1.1, 1.6, peitoril=True)
    o.telhado_quatro_aguas((-5.2, 5.2, -4.0, 4.9), top, 2.2, beiral=0.6, mat=TELHA)
    o.caixa(PAREDE_TIJOLO, 2.8, 3.5, top + 0.3, top + 3.1, -2.4, -1.7, 'Paredes')
    o.caixa(CONCRETO_CLARO, 2.7, 3.6, top + 3.1, top + 3.22, -2.5, -1.6, 'Paredes', '+x-x+y+z-z')
    return o.nos()


PECAS = {
    'casa-simples': (casa_simples, 'Casa térrea amarela de duas águas, com varanda de entrada e chaminé (8 x 8 m)', EX),
    'casa-sobrado': (casa_sobrado, 'Sobrado branco de dois andares com garagem, sacada de vidro e telhado de quatro águas (9 x 8 m)', EX),
    'casa-moderna': (casa_moderna, 'Casa moderna de cubos brancos e grafite, vidro, ripado de madeira, garagem e terraço (10 x 8 m)', EX),
    'casa-colonial': (casa_colonial, 'Casa colonial azul (10,4 x 7,7 m) com varanda de seis colunas, venezianas verdes e telhado de quatro águas', EX),
}
