"""Hospital, delegacia, supermercado, cinema e um ladrilho de estacionamento.
Os edifícios têm origem no centro da pegada (múltiplos de 12 m), pé em y = 0 (coloque em y = 0,15 sobre a calçada ou a grama do kit;
o piso fica rente à calçada) e a frente é +Z. O estacionamento é um ladrilho (coloque em y = 0, como as ruas e calçadas).
Os letreiros e as janelas sorteadas acendem à noite (kit.luzEstado); `extras.luzes` indica onde pôr luzes reais."""
import math
from glb import Material
from edificio import Obra, matriz
from malha import Malha, T, Ry
from paleta import *
import letreiros

EX = {'tipo': 'edificio', 'frente': '+Z', 'origem': 'centro da pegada, no chão (y = 0); sobre a calçada ou a grama do kit, y = 0,15'}


def luz(pos, alcance=14, cor='#ffd98a'):
    return {'pos': [round(float(v), 3) for v in pos], 'dir': [0, -1, 0], 'cor': cor, 'alcance': alcance}


# ---------------------------------------------------------------- hospital (36 x 24 m)
def hospital():
    o = Obra(31, p_luz=0.5)
    TW = (-6, 6, -9, 3)                       # torre central
    AL = (-17.9, -6, -8, 2)                   # ala esquerda
    AR = (6, 17.9, -8, 2)                     # ala direita
    H0, HP, N = 4.6, 3.4, 6
    topo_t = H0 + N * HP                      # 25
    HA0, NA = 4.2, 3
    topo_a = HA0 + NA * HP                    # 14,4
    o.caixa(PAREDE_BRANCA, TW[0], TW[1], 0, topo_t - 0.05, TW[2], TW[3])
    for ala in (AL, AR):
        o.caixa(PAREDE_BRANCA, ala[0], ala[1], 0, topo_a - 0.05, ala[2], ala[3])
        o.caixa(PAREDE_AZUL, ala[0] - 0.06, ala[1] + 0.06, topo_a - 1.0, topo_a - 0.12, ala[2] - 0.06, ala[3] + 0.06, 'Detalhes', '+x-x+z-z')
        o.caixa(PAREDE_AZUL, ala[0] - 0.06, ala[1] + 0.06, 0.0, 0.5, ala[2] - 0.06, ala[3] + 0.06, 'Detalhes', '+x-x+z-z')
        o.laje_plana(ala, topo_a - 0.05, mat=LAJE, platibanda=0.8, esp=0.25, mat_platibanda=CONCRETO_CLARO)
        for k in range(3):
            o.ar_condicionado(ala[0] + 2.0 + k * 3.2, topo_a + 0.2, ala[2] + 2.0, 1.2, 0.9, 0.7)
        o.caixa(PAREDE_CINZA, (ala[0] + ala[1]) / 2 - 1.2, (ala[0] + ala[1]) / 2 + 1.2, topo_a + 0.2, topo_a + 2.7, ala[3] - 3.4, ala[3] - 1.4, 'Detalhes')
    o.caixa(PAREDE_AZUL, TW[0] - 0.06, TW[1] + 0.06, topo_t - 1.0, topo_t - 0.12, TW[2] - 0.06, TW[3] + 0.06, 'Detalhes', '+x-x+z-z')
    # janelas das alas (a frente, as laterais externas e os fundos)
    ys = [1.0] + [HA0 + HP * f + 0.9 for f in range(NA)]
    for ala in (AL, AR):
        for y in ys:
            for u in (-4.2, -1.4, 1.4, 4.2):
                o.janela('+z', ala, u, y, 1.6, 1.5, trav=False)
                o.janela('-z', ala, u, y, 1.6, 1.5, trav=False)
            for u in (-3.0, 0.0, 3.0):
                o.janela('-x' if ala is AL else '+x', ala, u, y, 1.5, 1.5, trav=False)
    # torre: átrio de vidro no meio e janelas dos lados; o último andar fica liso para o letreiro
    for f in range(N):
        y = H0 + HP * f
        if f < N - 1:
            o.painel_vidro('+z', TW, 0.0, y + 0.1, 3.4, HP - 0.2, escura=True)
            for u in (-3.9, 3.9):
                o.janela('+z', TW, u, y + 0.9, 1.5, 1.5, trav=False)
            for face in ('+x', '-x'):
                for u in (-3.6, -1.2, 1.2, 3.6):
                    o.janela(face, TW, u, y + 0.9, 1.4, 1.5, trav=False)
        for u in (-3.9, -1.3, 1.3, 3.9):
            o.janela('-z', TW, u, y + 0.9, 1.5, 1.5, trav=False)
    for face in ('+x', '-x'):
        for u in (-3.6, -1.2, 1.2, 3.6):
            o.janela(face, TW, u, 1.0, 1.4, 1.8, trav=False)
    # térreo da torre: portas de vidro sob a cobertura de emergência
    o.porta('+z', TW, 0.0, 3.6, 3.0, y=0.0, vidro=True, acesa=True, mold=MOLDURA_ESCURA)
    for u in (-4.2, 4.2):
        o.painel_vidro('+z', TW, u, 0.4, 2.4, 3.0, acesa=True, escura=False)
    CAN = (-7.5, 7.5, 3, 10.5)
    o.caixa(CONCRETO_CLARO, CAN[0], CAN[1], 4.5, 5.0, CAN[2], CAN[3], 'Detalhes', '+x-x+y+z-z-y')
    o.caixa(VERMELHO_VIVO, CAN[0] - 0.05, CAN[1] + 0.05, 5.0, 5.3, CAN[2], CAN[3] + 0.05, 'Detalhes', '+x-x+y+z')
    for x in (-7.0, -2.4, 2.4, 7.0):
        o.cilindro(BRANCO_PURO, x, 0.0, 9.9, 0.2, 4.5, 14, 'Detalhes', caps=False)
    o.letreiro(letreiros.placa_emergencia(), '+z', CAN, 0.0, 5.35, 5.6, 1.4, d=0.12)
    for x in (-5.0, 0.0, 5.0):
        o.lampada(x, 4.42, 9.6, 0.12)
    # letreiro HOSPITAL, cruzes e helipoliporto
    o.letreiro(letreiros.placa_hospital(), '+z', TW, 0.0, 21.7, 9.6, 2.4, d=0.15)
    for face in ('+x', '-x'):
        o.letreiro(letreiros.placa_cruz(), face, TW, 0.0, 21.5, 2.8, 2.8, d=0.12)
    o.laje_plana(TW, topo_t - 0.05, mat=LAJE, platibanda=0.9, esp=0.25, mat_platibanda=CONCRETO_CLARO)
    o.plano_letreiro(letreiros.helipad(), 0.0, topo_t + 0.27, -3.0, 7.0, 7.0)
    for ang in range(8):
        a = ang * math.pi / 4
        o.lampada(3.7 * math.cos(a) * 1.0, topo_t + 0.4, -3.0 + 3.7 * math.sin(a), 0.09)
    o.caixa(PAREDE_CINZA, 3.0, 5.4, topo_t + 0.25, topo_t + 2.6, -8.4, -6.2, 'Detalhes')
    o.antena(-4.6, topo_t + 0.25, -8.0, 5.0)
    return o.nos(), {'pegada': [36.0, 24.0], 'luzes': [luz((0, 4.2, 8.0), 16), luz((-9, 3.0, 4.5), 12), luz((9, 3.0, 4.5), 12)]}


# ---------------------------------------------------------------- delegacia (24 x 12 m)
def delegacia():
    o = Obra(32)
    C = (-10, 10, -5.9, 1.6)
    Y0, H0, H1 = 0.35, 4.0, 3.6
    topo = Y0 + H0 + H1
    o.piso(C, 0, Y0)
    o.caixa(PAREDE_CINZA, C[0], C[1], Y0, topo - 0.05, C[2], C[3])
    o.caixa(PAREDE_AZUL_ESCURO, C[0] - 0.06, C[1] + 0.06, Y0, Y0 + 1.2, C[2] - 0.06, C[3] + 0.06, 'Detalhes', '+x-x+z-z')
    o.caixa(PAREDE_AZUL_ESCURO, C[0] - 0.08, C[1] + 0.08, Y0 + H0 - 0.45, Y0 + H0 + 0.45, C[2] - 0.08, C[3] + 0.08, 'Detalhes', '+x-x+z-z')
    o.laje_plana(C, topo - 0.05, mat=LAJE, platibanda=1.15, esp=0.25, mat_platibanda=PAREDE_AZUL_ESCURO)
    # fachada: duas janelas de cada lado do pórtico, em dois andares
    for y in (Y0 + 1.15, Y0 + H0 + 0.7):
        for u in (-8.2, -5.6, 5.6, 8.2):
            o.janela('+z', C, u, y, 1.5, 1.6, mold=MOLDURA_BRANCA)
        for face in ('+x', '-x'):
            for u in (-2.0, 1.6):
                o.janela(face, C, u, y, 1.4, 1.6)
        for u in (-8.2, -5.5, -2.8, 0.0, 2.8, 5.5, 8.2):
            o.janela('-z', C, u, y, 1.4, 1.6)
    # pórtico com quatro colunas, escada de três degraus, portas de vidro, frontão e brasão
    P = (-4.4, 4.4, 1.6, 4.2)
    o.caixa(CONCRETO_CLARO, P[0], P[1], 0.0, Y0, P[2], P[3] + 0.4, 'Detalhes', '+x-x+y+z')
    o.degraus('+z', P, 0.0, 6.0, 3, y_topo=Y0, z0=0.4)
    for x in (-3.8, -1.3, 1.3, 3.8):
        o.coluna(x, 3.8, Y0, Y0 + 5.3, 0.27, mat=BRANCO_PURO, quadrada=True)
    o.caixa(BRANCO_PURO, P[0], P[1], Y0 + 5.3, Y0 + 6.1, P[2], P[3])
    o.telhado_duas_aguas(P, Y0 + 6.1, 1.5, beiral=0.15, eixo='z', mat=PAREDE_AZUL_ESCURO, mat_oitao=BRANCO_PURO)
    o.porta('+z', C, 0.0, 2.8, 3.0, y=Y0, vidro=True, acesa=True, mold=MOLDURA_ESCURA)
    o.letreiro(letreiros.placa_policia(), '+z', P, 0.0, Y0 + 5.38, 3.6, 0.72, d=0.1)
    o.letreiro(letreiros.brasao_policia(), '+z', P, 0.0, Y0 + 6.3, 1.25, 1.25, d=0.2, chapa=False)
    o.letreiro(letreiros.placa_delegacia(), '+z', C, 0.0, topo + 0.05, 9.0, 1.0, d=0.09)
    # sirenes sobre a cumeeira do pórtico e bandeiras de cada lado
    sirene_az = Material('SireneAzul', '#2a6bff', rough=0.3, emissive='#1d5cff')
    sirene_vm = Material('SireneVermelha', '#ff3b30', rough=0.3, emissive='#ff2a22')
    by = Y0 + 6.1 + 1.5 - 0.3
    o.caixa(PRETO_FOSCO, -0.9, 0.9, by, by + 0.12, 2.2, 3.4, 'Detalhes')
    o.caixa(sirene_az, -0.9, -0.02, by + 0.12, by + 0.4, 2.2, 3.4, 'Detalhes')
    o.caixa(sirene_vm, 0.02, 0.9, by + 0.12, by + 0.4, 2.2, 3.4, 'Detalhes')
    for x in (-8.5, 8.5):
        o.bandeira(x, 0.0, 4.4, 8.0, cor='#1b4fa3' if x < 0 else '#f6c500', larg=1.8, alt=1.1)
    for x in (-6.2, 6.2):
        o.lampada(x, 3.4, C[3] + 0.1, 0.1)
    return o.nos(), {'pegada': [24.0, 12.0], 'luzes': [luz((0, 4.8, 3.6), 12), luz((-6.2, 3.3, 2.4), 9), luz((6.2, 3.3, 2.4), 9)]}


# ---------------------------------------------------------------- supermercado (36 x 24 m)
def carrinho(m, x, z, giro=0.0):
    """carrinho de compras de 0,6 x 1,0 m"""
    c = Malha()
    c.caixa(METAL, -0.28, 0.28, 0.5, 0.95, -0.4, 0.4, '+x-x+z-z')
    c.caixa(METAL_ESCURO, -0.28, 0.28, 0.5, 0.52, -0.4, 0.4, '+y-y')
    c.caixa(METAL_ESCURO, -0.26, 0.26, 0.28, 0.32, -0.34, 0.34, '+x-x+y+z-z-y')
    c.tubo(METAL_ESCURO, (-0.26, 0.9, 0.42), (0.26, 0.9, 0.42), 0.02, 0.02, 6)
    c.tubo(METAL_ESCURO, (-0.24, 0.9, 0.42), (-0.24, 0.32, 0.34), 0.016, 0.016, 5)
    c.tubo(METAL_ESCURO, (0.24, 0.9, 0.42), (0.24, 0.32, 0.34), 0.016, 0.016, 5)
    for sx in (-1, 1):
        for sz in (-1, 1):
            c.cyl(PRETO, sx * 0.22, 0.03, sz * 0.3, 0.05, 0.05, 8)
    m.add(c, T(x, 0, z) @ Ry(giro))


def supermercado():
    o = Obra(33, p_luz=0.0)
    C = (-17, 17, -11, 3)
    H = 7.0
    o.caixa(PAREDE_BRANCA, C[0], C[1], 0.0, H, C[2], C[3])
    o.caixa(PAREDE_VERMELHA, C[0] - 0.05, C[1] + 0.05, 4.0, H, C[2] - 0.05, C[3] + 0.05, 'Detalhes', '+x-x+z-z')
    o.laje_plana(C, H, mat=LAJE, platibanda=1.2, esp=0.25, mat_platibanda=PAREDE_VERMELHA)
    # vitrine corrida na frente (vidro aceso por dentro) com pilares a cada 6 m
    for k in range(17):
        u = -16.0 + k * 2.0
        if abs(u) < 4.2:
            continue
        o.painel_vidro('+z', C, u, 0.35, 1.9, 3.4, acesa=(k % 5 != 2), escura=False)
    for u in (-12.0, -6.0, 6.0, 12.0):
        o.caixa(PAREDE_CINZA, u - 0.3, u + 0.3, 0.0, 4.0, C[3], C[3] + 0.12, 'Detalhes', '+x-x+z')
    o.caixa(PAREDE_CINZA, C[0], C[1], 3.85, 4.1, C[3], C[3] + 0.1, 'Detalhes', '+y-y+z')
    # entrada: vestíbulo de vidro com portas de correr
    V = (-4.5, 4.5, 3, 7)
    o.caixa(PAREDE_CINZA, V[0] - 0.1, V[1] + 0.1, 4.3, 4.7, V[2], V[3] + 0.1, 'Detalhes', '+x-x+y+z-z-y')
    for u in (-3.6, 3.6):
        o.painel_vidro('+z', V, u, 0.2, 1.7, 4.0, acesa=True, escura=False)
    for face in ('+x', '-x'):
        for k in range(3):
            o.painel_vidro(face, V, -1.3 + k * 1.3, 0.2, 1.2, 4.0, acesa=True, escura=False)
    o.porta('+z', V, -1.15, 2.2, 2.7, y=0.0, vidro=True, acesa=True, mold=MOLDURA_ESCURA)
    o.porta('+z', V, 1.15, 2.2, 2.7, y=0.0, vidro=True, acesa=True, mold=MOLDURA_ESCURA)
    for x in (-4.4, 4.4):
        o.coluna(x, 6.9, 0.0, 4.3, 0.15, mat=PAREDE_CINZA, quadrada=True)
    for x in (-3.0, 0.0, 3.0):
        o.lampada(x, 4.22, 6.4, 0.1)
    # letreiros: SUPERMERCADO grande na frente e nas laterais
    o.letreiro(letreiros.placa_super(), '+z', C, 0.0, 4.5, 19.0, 2.97, d=0.2)
    for face in ('+x', '-x'):
        o.letreiro(letreiros.placa_super(), face, C, 0.0, 4.8, 8.0, 1.25, d=0.2)
    # totem de placa com SUPER HRYZ
    PL = (-16.5, -13.5, 9.0, 9.6)
    o.caixa(PAREDE_CINZA, -15.4, -14.6, 0.0, 6.0, 9.15, 9.45, 'Detalhes')
    o.caixa(PAREDE_AZUL_ESCURO, PL[0], PL[1], 6.0, 11.2, PL[2], PL[3], 'Detalhes')
    for face in ('+z', '-z'):
        o.letreiro(letreiros.placa_super_pilar(), face, PL, 0.0, 6.2, 2.6, 5.0, d=0.05, chapa=False)
    # abrigos de carrinhos com os carrinhos
    for cx in (-11.0, 11.0):
        for sx in (-1, 1):
            for sz in (-1, 1):
                o.coluna(cx + sx * 1.6, 6.8 + sz * 0.7, 0.0, 2.3, 0.05, mat=METAL_ESCURO)
        o.caixa(PAREDE_VERMELHA, cx - 1.8, cx + 1.8, 2.3, 2.42, 5.9, 7.7, 'Detalhes', '+x-x+y+z-z-y')
        for k in range(4):
            carrinho(o.n['Detalhes'], cx - 1.05 + k * 0.7, 6.8, 0.0)
    # fundos: portões de carga
    for u in (-8.0, 0.0, 8.0):
        o.caixa(PRETO_FOSCO, u - 1.6, u + 1.6, 0.0, 3.6, C[2] - 0.02, C[2] + 0.0, 'Detalhes', '-z')
        o.caixa(METAL, u - 1.7, u + 1.7, 3.6, 3.8, C[2] - 0.12, C[2], 'Detalhes', '+x-x+y-z')
    for k in range(7):
        o.ar_condicionado(-14 + k * 4.4, H + 0.25, -7.0, 1.6, 1.1, 1.3)
    o.caixa(PAREDE_CINZA, 9.0, 12.5, H + 0.25, H + 2.4, -2.0, 0.8, 'Detalhes')
    return o.nos(), {'pegada': [36.0, 24.0], 'luzes': [luz((0, 4.0, 8.5), 16), luz((-10, 3.0, 5.2), 11), luz((10, 3.0, 5.2), 11), luz((-15, 6.0, 10.2), 9)]}


# ---------------------------------------------------------------- cinema (24 x 24 m)
def cinema():
    o = Obra(34, p_luz=0.0)
    FR = (-10, 10, -1, 6)
    AU = (-9, 9, -11, -1)
    HF, HA = 9.4, 13.4
    o.caixa(PAREDE_GRAFITE, FR[0], FR[1], 0.0, HF - 0.05, FR[2], FR[3])
    o.caixa(PAREDE_VERMELHA, FR[0] - 0.06, FR[1] + 0.06, HF - 2.2, HF - 0.1, FR[2] - 0.06, FR[3] + 0.06, 'Detalhes', '+x-x+z-z')
    o.laje_plana(FR, HF - 0.05, mat=LAJE, platibanda=0.7, esp=0.25, mat_platibanda=PAREDE_VERMELHA)
    o.caixa(PAREDE_CINZA, AU[0], AU[1], 0.0, HA - 0.05, AU[2], AU[3])
    o.caixa(PAREDE_GRAFITE, AU[0] - 0.05, AU[1] + 0.05, 0.0, 1.2, AU[2] - 0.05, AU[3] + 0.05, 'Detalhes', '+x-x+z-z')
    o.laje_plana(AU, HA - 0.05, mat=LAJE, platibanda=0.7, esp=0.25, mat_platibanda=PAREDE_CINZA)
    # nervuras verticais nas paredes do auditório
    for face, comp in (('+x', 10.0), ('-x', 10.0), ('-z', 18.0)):
        n = int(comp / 1.6)
        for k in range(n + 1):
            u = -comp / 2 + k * comp / n
            m = Malha()
            m.caixa(PAREDE_CONCRETO, u - 0.1, u + 0.1, 1.2, HA - 0.1, 0.0, 0.14, '+z+x-x')
            o.n['Detalhes'].add(m, matriz(face, AU, 0.0, 0.0))
    for u in (-5.0, 5.0):
        o.porta('-z', AU, u, 1.6, 2.4, y=0.0, mat=METAL_ESCURO, mold=MOLDURA_ESCURA)
    o.porta('+x', AU, 0.0, 1.6, 2.4, y=0.0, mat=METAL_ESCURO, mold=MOLDURA_ESCURA)
    o.porta('-x', AU, 0.0, 1.6, 2.4, y=0.0, mat=METAL_ESCURO, mold=MOLDURA_ESCURA)
    # entrada: três portas de vidro, bilheteria, cartazes e marquise com lâmpadas
    for u in (-2.3, 0.0, 2.3):
        o.porta('+z', FR, u, 1.8, 2.6, y=0.0, vidro=True, acesa=True, mold=MOLDURA_ESCURA)
    for u in (-6.2, 6.2):
        o.painel_vidro('+z', FR, u, 0.4, 2.2, 3.0, acesa=True, escura=False)
    MQ = (-8, 8, 6, 8.8)
    o.caixa(PAREDE_VERMELHA, MQ[0], MQ[1], 3.8, 4.7, MQ[2], MQ[3], 'Detalhes', '+x-x+y+z-z-y')
    o.caixa(AMARELO_VIVO, MQ[0] - 0.02, MQ[1] + 0.02, 4.7, 4.85, MQ[2], MQ[3] + 0.02, 'Detalhes', '+x-x+y+z')
    for x in (-7.4, 7.4):
        o.coluna(x, 8.4, 0.0, 3.8, 0.14, mat=PAREDE_CINZA)
    for k in range(27):
        x = -7.8 + k * 0.6
        o.lampada(x, 3.74, 8.65, 0.075)
    for z in (6.4, 7.2, 8.0):
        for x in (-7.9, 7.9):
            o.lampada(x, 3.74, z, 0.075)
    o.letreiro(letreiros.placa_cinema(), '+z', FR, 0.0, 5.3, 12.6, 2.36, d=0.18)
    posters = [('NOITE FELINA', '#2a1a55', '#7b3fa8', 'gato'), ('O SOL DE 68', '#e0742a', '#f7c56a', 'sol'), ('VOO 18', '#1d5fa8', '#7ec4f5', 'aviao'), ('LUA CHEIA', '#10172e', '#35508f', 'lua')]
    for (t, c1, c2, mo), u in zip(posters, (-7.9, -5.5, 5.5, 7.9)):
        o.letreiro(letreiros.cartaz(t, c1, c2, mo), '+z', FR, u, 1.0, 1.7, 2.55, d=0.1, moldura=MOLDURA_ESCURA)
    # bilheteria
    o.caixa(PAREDE_VERMELHA, 8.0, 9.8, 0.0, 2.6, 6.2, 7.6, 'Detalhes')
    o.caixa(PAREDE_GRAFITE, 7.9, 9.9, 2.6, 2.75, 6.1, 7.7, 'Detalhes')
    o.painel_vidro('+z', (8.0, 9.8, 6.2, 7.6), 0.0, 0.9, 1.2, 1.0, acesa=True, escura=False)
    # placa vertical (empena) no canto esquerdo
    BL = (-10.55, -10.05, 5.1, 5.9)
    o.caixa(PAREDE_GRAFITE, BL[0] - 0.03, BL[1] + 0.03, 2.4, 10.1, BL[2] - 0.0, BL[3] + 0.0, 'Detalhes')
    for face in ('+x', '-x'):
        o.letreiro(letreiros.placa_cinema_vertical(), face, (BL[0], BL[1], 5.1, 5.9), 0.0, 2.6, 1.8, 7.2, d=0.06, chapa=False)
    for k in range(4):
        o.ar_condicionado(-6 + k * 4, HA + 0.25, -8.0, 1.5, 1.0, 1.2)
    return o.nos(), {'pegada': [24.0, 24.0], 'luzes': [luz((0, 3.6, 8.2), 14, '#ffc866'), luz((-9, 3.0, 8.0), 9), luz((9, 3.0, 8.0), 9)]}


# ---------------------------------------------------------------- estacionamento (ladrilho de 12 x 12 m, topo em y = 0,15)
def estacionamento():
    a, l, b = Malha(), Malha(), Malha()
    CH, YF = 0.15, 0.012
    a.top(ASFALTO, -6, 6, -6, 6, CH)
    for x in (-6, -3, 0, 3, 6):
        xa, xb = max(x - 0.05, -6.0), min(x + 0.05, 6.0)                 # as linhas das bordas ficam inteiras dentro do ladrilho
        l.caixa(FAIXA_BRANCA, xa, xb, CH, CH + YF, -6.0, -1.0, '+y')
    l.caixa(FAIXA_BRANCA, -6, 6, CH, CH + YF, -1.05, -0.95, '+y')
    for k in range(4):
        x = -4.5 + 3 * k
        b.caixa(CONCRETO_CLARO, x - 0.9, x + 0.9, CH, CH + 0.12, -5.6, -5.4)
    return [('Asfalto', a), ('Faixas', l), ('Calcos', b)], {'pegada': [12.0, 12.0], 'tile': 12.0}


PECAS = {
    'hospital': (hospital, 'Hospital de 36 x 24 m: torre de 7 andares com átrio de vidro, duas alas de 4 andares, cobertura de emergência, cruzes e helipoliporto'),
    'delegacia': (delegacia, 'Delegacia de polícia de 24 x 12 m: dois andares azul e cinza, pórtico de colunas com escada, sirenes e bandeiras'),
    'supermercado': (supermercado, 'Supermercado de 36 x 24 m: vitrine corrida, entrada de vidro, letreiro SUPERMERCADO, totem, abrigos com carrinhos e portões de carga'),
    'cinema': (cinema, 'Cinema de 24 x 24 m: marquise com lâmpadas, letreiro CINEMA, cartazes, bilheteria, placa vertical e sala alta nos fundos'),
    'estacionamento': (estacionamento, 'Ladrilho de estacionamento de 12 x 12 m (topo em y = 0,15): quatro vagas de 3 x 5 m com calços e corredor de 7 m; emenda lado a lado'),
}
