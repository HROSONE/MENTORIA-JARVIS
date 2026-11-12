"""Rodovia, aeroporto e condomínio: as peças que faltavam para montar uma cidade inteira.

Rodovia (categoria `rodovias`): pista dupla de 3 faixas por sentido, 36 m de largura (3 ladrilhos) por 12 m, ao longo de Z.
  Canteiro central de grama com mureta de concreto; acostamentos; mão direita como as ruas (quem anda para +Z usa o lado x < 0).
  `rodovia-acesso` tem a saída para uma rua comum no lado +X (x = +18 m). Asfalto em y = 0 (como as ruas), grama em y = 0,15.
Aeroporto (categoria `aeroporto`): pista de pouso de 45 m (peças de 48 x 48 m), cabeceira com número, pista de táxi, pátio,
  terminal com três fingers, torre de controle, hangar e biruta. Pavimentos com o topo em y = 0,16 (logo acima da grama).
Condomínio (categoria `condominio`): portaria com guarita, cancelas e letreiro (vai em cima de um ladrilho `rua-reta`) e piscina com deque."""
import math
from glb import Material
from edificio import Obra
from malha import Malha, T, Ry
from paleta import *
import texturas as TX

ASF_RODOVIA = Material('AsfaltoRodovia', '#3a3d42', rough=0.95)
ASF_PISTA = Material('AsfaltoPista', '#45484d', rough=0.95)
ACOSTAMENTO = Material('Acostamento', '#55585d', rough=0.95)
CONCRETO_PATIO = Material('ConcretoPatio', '#bdbbb4', rough=0.95)
JUNTA = Material('Junta', '#a3a19a', rough=0.95)
MURETA = Material('Mureta', '#cfccc4', rough=0.9)
TINTA_BRANCA = Material('TintaBranca', '#f4f3ee', rough=0.7)
TINTA_AMARELA = Material('TintaAmarela', '#f2b50c', rough=0.7)
VERDE_PLACA = Material('VerdePlaca', '#1c6b45', rough=0.6)
LUZ_PISTA = Material('LuzPista', '#fff6d8', rough=0.3, emissive='#fff0c0')
LUZ_VERDE = Material('LuzVerde', '#7dffa8', rough=0.3, emissive='#2cd36a')
LUZ_VERMELHA = Material('LuzVermelha', '#ff7a6e', rough=0.3, emissive='#e0302a')
LUZ_AZUL = Material('LuzAzul', '#8fb5ff', rough=0.3, emissive='#3a6be0')
AGUA = Material('Agua', '#3fb4dc', rough=0.05, metal=0.1)
AZULEJO = Material('Azulejo', '#9ad7ea', rough=0.4)
TECIDO_LARANJA = Material('TecidoLaranja', '#e07a2c', rough=0.8, double_sided=True)
TECIDO_BRANCO = Material('TecidoBranco', '#f7f5ef', rough=0.8, double_sided=True)
MARINHO = Material('MarinhoHryz', '#1b2a4a', rough=0.6)
LARANJA = Material('LaranjaHryz', '#e07a2c', rough=0.6)
CH = 0.15
YP = 0.16                     # topo dos pavimentos do aeroporto
YT = 0.012                    # espessura da tinta


def luz(pos, alcance=14, cor='#ffd98a'):
    return {'pos': [round(float(v), 3) for v in pos], 'dir': [0, -1, 0], 'cor': cor, 'alcance': alcance}


def _png_texto(linhas, w, h, fundo, cor='#ffffff', borda=None, px=None):
    img = TX.tela(w, h, fundo)
    if borda:
        from PIL import ImageDraw
        d = ImageDraw.Draw(img)
        e = int(min(w, h) * 0.05)
        d.rounded_rectangle([e * TX.SS, e * TX.SS, (w - e) * TX.SS, (h - e) * TX.SS], radius=e * TX.SS, outline=borda, width=int(e * 0.5) * TX.SS)
    n = len(linhas)
    for i, (txt, k) in enumerate(linhas):
        tam = px or h / (n + 0.6) * 0.75 * k
        while TX.fonte(tam * TX.SS).getlength(txt) > w * 0.86 * TX.SS:
            tam *= 0.95
        TX.texto(img, txt, w / 2, h * (i + 0.8) / (n + 0.6), tam, cor)
    return TX.png(img)


def _quad_tex(m, mat, x0, x1, z0, z1, y, ler_de='+Z'):
    """retângulo deitado com textura, lido por quem olha de +Z (ou de -Z)"""
    uv = [(0, 1), (1, 1), (1, 0), (0, 0)] if ler_de == '+Z' else [(1, 0), (0, 0), (0, 1), (1, 1)]
    m.quad(mat, (x0, y, z1), (x1, y, z1), (x1, y, z0), (x0, y, z0), (0, 1, 0), uvs=uv)


# ======================================================================== rodovia (36 x 12 m)
MED, ACI, FAIXAS, ACE, VERGE = 3.0, 4.0, 14.5, 17.0, 18.0          # |x| do canteiro, acostamento interno, faixas, acostamento externo, fim


def _rodovia(acesso):
    a, g, t, d = Malha(), Malha(), Malha(), Malha()
    a.top(ASF_RODOVIA, -FAIXAS, -ACI, -6, 6, 0.0)
    a.top(ASF_RODOVIA, ACI, FAIXAS, -6, 6, 0.0)
    for s in (-1, 1):
        a.top(ACOSTAMENTO, *sorted((s * MED, s * ACI)), -6, 6, 0.0)
        a.top(ACOSTAMENTO, *sorted((s * FAIXAS, s * ACE)), -6, 6, 0.0)
    g.top(GRAMA, -MED, MED, -6, 6, CH)                                      # canteiro central
    for s in (-1, 1):
        g.wall(MEIOFIO, (s * MED, -6), (s * MED, 6), 0, CH, (s, 0))
    # mureta de concreto (tipo New Jersey) no meio do canteiro
    perfil = [(-0.30, CH), (-0.24, CH + 0.08), (-0.09, CH + 0.33), (-0.08, CH + 0.81), (0.08, CH + 0.81), (0.09, CH + 0.33), (0.24, CH + 0.08), (0.30, CH)]
    for i in range(len(perfil) - 1):
        (x0, y0), (x1, y1) = perfil[i], perfil[i + 1]
        d.quad(MURETA, (x0, y0, -6), (x1, y1, -6), (x1, y1, 6), (x0, y0, 6), ((y1 - y0), -(x1 - x0), 0) if True else (0, 1, 0))
    # bordas externas: grama de 1 m no nível da calçada (com meio-fio), menos na boca do acesso
    for s in (-1, 1):
        if acesso and s > 0:
            for z0, z1 in ((-6, -3.5), (3.5, 6)):
                g.top(GRAMA, ACE, VERGE, z0, z1, CH)
            g.wall(MEIOFIO, (ACE, -6), (ACE, -3.5), 0, CH, (-1, 0))
            g.wall(MEIOFIO, (ACE, 3.5), (ACE, 6), 0, CH, (-1, 0))
            g.wall(MEIOFIO, (ACE, -3.5), (VERGE, -3.5), 0, CH, (0, 1))
            g.wall(MEIOFIO, (ACE, 3.5), (VERGE, 3.5), 0, CH, (0, -1))
            a.top(ACOSTAMENTO, ACE, VERGE, -3.5, 3.5, 0.0)
        else:
            g.top(GRAMA, *sorted((s * ACE, s * VERGE)), -6, 6, CH)
            g.wall(MEIOFIO, (s * ACE, -6), (s * ACE, 6), 0, CH, (-s, 0))
    # tinta: linhas de borda (amarela por dentro, branca por fora) e tracejado das faixas (4 m pintados, 8 m vazios)
    for s in (-1, 1):
        xi = s * (ACI + 0.15)
        t.caixa(TINTA_AMARELA, xi - 0.08, xi + 0.08, 0, YT, -6, 6, '+y')
        xo = s * (FAIXAS - 0.15)
        if acesso and s > 0:
            for z0, z1 in ((-6, -5), (5, 6)):
                t.caixa(TINTA_BRANCA, xo - 0.1, xo + 0.1, 0, YT, z0, z1, '+y')
            for z in (-3.0, 0.0, 3.0):
                t.caixa(TINTA_BRANCA, xo - 0.1, xo + 0.1, 0, YT, z - 0.9, z + 0.9, '+y')
            for k in range(4):                                             # zebrado no acostamento, antes e depois da boca
                for zc in (-5.0, 5.0):
                    x = ACE - 0.4 - k * 0.65
                    t.poly(TINTA_BRANCA, [(x - 0.12, YT, zc - 0.6), (x + 0.12, YT, zc - 0.6), (x - 0.25, YT, zc + 0.6), (x - 0.49, YT, zc + 0.6)], (0, 1, 0))
        else:
            t.caixa(TINTA_BRANCA, xo - 0.1, xo + 0.1, 0, YT, -6, 6, '+y')
        for k in (1, 2):
            x = s * (ACI + 3.5 * k)
            t.caixa(TINTA_BRANCA, x - 0.08, x + 0.08, 0, YT, -2, 2, '+y')
    con = [{'lado': 'N', 'pos': [0, 0, -6], 'dir': [0, 0, -1], 'perfil': 'rodovia-6-faixas'}, {'lado': 'S', 'pos': [0, 0, 6], 'dir': [0, 0, 1], 'perfil': 'rodovia-6-faixas'}]
    if acesso:
        con.append({'lado': 'E', 'pos': [18, 0, 0], 'dir': [1, 0, 0], 'perfil': 'rua-2-faixas'})
    return [('Asfalto', a), ('Grama', g), ('Faixas', t), ('Mureta', d)], {'conexoes': con, 'pegada': [36.0, 12.0], 'tile': 12.0, 'tipo': 'rodovia',
                                                                         'faixas_x': [-12.75, -9.25, -5.75, 5.75, 9.25, 12.75]}


def rodovia_reta():
    return _rodovia(False)


def rodovia_acesso():
    return _rodovia(True)


def poste_rodovia():
    """poste de 12 m para o canteiro central, com dois braços (para +X e -X)"""
    o = Obra(5)
    o.tubo(POSTE, (0, 0, 0), (0, 12.0, 0), 0.16, 10, r1=0.10)
    o.cilindro(POSTE_BASE, 0, 0, 0, 0.26, 0.6, 12)
    luzes = []
    for s in (-1, 1):
        o.tubo(POSTE, (0, 11.6, 0), (s * 1.2, 12.2, 0), 0.07, 8)
        o.tubo(POSTE, (s * 1.2, 12.2, 0), (s * 3.2, 12.3, 0), 0.07, 8)
        o.caixa(LUMINARIA, s * 3.2 - 0.6, s * 3.2 + 0.6, 12.1, 12.4, -0.28, 0.28, 'Detalhes')
        o.n['Luz'].caixa(LAMPADA, s * 3.2 - 0.5, s * 3.2 + 0.5, 12.06, 12.1, -0.2, 0.2, '-y')
        luzes.append(luz((s * 3.2, 12.0, 0), 26))
    return o.nos(), {'luzes': luzes, 'tipo': 'poste-luz', 'origem': 'pé do poste (y = 0); no canteiro, y = 0,15', 'frente': 'braços em +X e -X'}


def _placa_verde(linhas):
    """placa de rodovia 6 x 3 m em dois postes, face em +Z"""
    m, f, L = Malha(), Malha(), Malha()
    png = _png_texto(linhas, 1200, 600, '#1c6b45', borda='#ffffff')
    mat = Material('PlacaVerde' + str(abs(hash(linhas[0][0])) % 1000), '#ffffff', rough=0.5, texture=png)
    W, H, Y0 = 6.0, 3.0, 2.6
    for x in (-2.2, 2.2):
        m.tubo(METAL, (x, 0, -0.08), (x, Y0 + H, -0.08), 0.09, None, 10)
    m.caixa(PLACA_COSTAS, -W / 2, W / 2, Y0, Y0 + H, -0.04, 0.0)
    f.quad(mat, (-W / 2, Y0, 0.005), (W / 2, Y0, 0.005), (W / 2, Y0 + H, 0.005), (-W / 2, Y0 + H, 0.005), (0, 0, 1), uvs=[(0, 1), (1, 1), (1, 0), (0, 0)])
    return [('Poste', m), ('Letreiro', f)], {'tipo': 'placa', 'frente': '+Z', 'origem': 'pé dos postes (y = 0)'}


def placa_rodovia_saida():
    return _placa_verde([('SAÍDA  ↗', 0.8), ('CENTRO', 1.15)])


def placa_rodovia_aeroporto():
    return _placa_verde([('✈  AEROPORTO', 1.0), ('PRÓXIMA SAÍDA', 0.7)])


def placa_rodovia_cidade():
    return _placa_verde([('HRYZ', 1.25), ('BEM-VINDO', 0.75)])


# ======================================================================== aeroporto
def _luzes_borda(o, xs, zs, mat):
    for x in xs:
        for z in zs:
            o.n['Detalhes'].cyl(METAL_ESCURO, x, YP, z, 0.10, 0.25, 8)
            o.n['Luz'].cyl(mat, x, YP + 0.25, z, 0.12, 0.10, 8)


def pista_reta():
    """trecho de 48 x 48 m da pista de pouso (45 m de pavimento), ao longo de Z: bordas brancas, eixo tracejado e luzes de borda"""
    o = Obra(1)
    a = o.n['Paredes']
    a.top(ASF_PISTA, -22.5, 22.5, -24, 24, YP)
    a.top(ACOSTAMENTO, -24, -22.5, -24, 24, YP)
    a.top(ACOSTAMENTO, 22.5, 24, -24, 24, YP)
    t = o.n['Molduras']
    for s in (-1, 1):
        t.caixa(TINTA_BRANCA, s * 21.6 - 0.45, s * 21.6 + 0.45, YP, YP + YT, -24, 24, '+y')
    t.caixa(TINTA_BRANCA, -0.45, 0.45, YP, YP + YT, -15, 15, '+y')                            # eixo: 30 m pintados, 18 m vazios
    _luzes_borda(o, (-23.4, 23.4), (-12, 12), LUZ_PISTA)
    return o.nos(), {'tipo': 'aeroporto', 'pegada': [48.0, 48.0], 'tile': 48.0, 'origem': 'centro; coloque em y = 0', 'frente': 'pista ao longo de Z'}


def pista_cabeceira():
    """cabeceira (fim da pista no lado -Z): barras de cabeceira, número 09 lido por quem chega de -Z, luzes verdes e vermelhas"""
    o = Obra(2)
    a = o.n['Paredes']
    a.top(ASF_PISTA, -22.5, 22.5, -24, 24, YP)
    a.top(ACOSTAMENTO, -24, -22.5, -24, 24, YP)
    a.top(ACOSTAMENTO, 22.5, 24, -24, 24, YP)
    t = o.n['Molduras']
    for s in (-1, 1):
        t.caixa(TINTA_BRANCA, s * 21.6 - 0.45, s * 21.6 + 0.45, YP, YP + YT, -24, 24, '+y')
        for k in range(8):                                                                      # barras ("teclas de piano")
            x = s * (2.6 + k * 2.4)
            t.caixa(TINTA_BRANCA, x - 0.9, x + 0.9, YP, YP + YT, -21, 9, '+y')
    t.caixa(TINTA_BRANCA, -22, 22, YP, YP + YT, -23.0, -22.2, '+y')                              # linha da cabeceira
    png = _png_texto([('09', 1.0)], 512, 1024, '#45484d', px=520)
    mat = Material('NumeroPista', '#ffffff', rough=0.7, texture=png)
    _quad_tex(o.n['Letreiro'], mat, -4.5, 4.5, 10.5, 22.5, YP + YT, ler_de='-Z')
    _luzes_borda(o, [(-21 + 3 * k) for k in range(15)], (-23.7,), LUZ_VERDE)
    _luzes_borda(o, (-23.4, 23.4), (-12, 12), LUZ_PISTA)
    return o.nos(), {'tipo': 'aeroporto', 'pegada': [48.0, 48.0], 'tile': 48.0, 'origem': 'centro; coloque em y = 0', 'frente': 'o fim da pista fica em -Z; o número lê de quem chega de -Z'}


def pista_taxi():
    """pista de táxi de 24 x 12 m ao longo de Z: 18 m de pavimento, eixo amarelo, bordas amarelas e luzes azuis"""
    o = Obra(3)
    a = o.n['Paredes']
    a.top(ASF_PISTA, -9, 9, -6, 6, YP)
    a.top(ACOSTAMENTO, -12, -9, -6, 6, YP)
    a.top(ACOSTAMENTO, 9, 12, -6, 6, YP)
    t = o.n['Molduras']
    t.caixa(TINTA_AMARELA, -0.1, 0.1, YP, YP + YT, -6, 6, '+y')
    for s in (-1, 1):
        for dx in (0.0, 0.35):
            x = s * (8.6 - dx)
            t.caixa(TINTA_AMARELA, x - 0.08, x + 0.08, YP, YP + YT, -6, 6, '+y')
    _luzes_borda(o, (-10.5, 10.5), (0,), LUZ_AZUL)
    return o.nos(), {'tipo': 'aeroporto', 'pegada': [24.0, 12.0], 'tile': 12.0, 'origem': 'centro; coloque em y = 0', 'frente': 'ao longo de Z'}


def patio():
    """pátio de concreto de 24 x 24 m com juntas a cada 6 m (emenda com outros pátios e com as pistas)"""
    o = Obra(4)
    o.n['Paredes'].top(CONCRETO_PATIO, -12, 12, -12, 12, YP)
    for k in range(-1, 2):
        o.n['Molduras'].caixa(JUNTA, k * 6 - 0.05, k * 6 + 0.05, YP, YP + 0.004, -12, 12, '+y')
        o.n['Molduras'].caixa(JUNTA, -12, 12, YP, YP + 0.004, k * 6 - 0.05, k * 6 + 0.05, '+y')
    return o.nos(), {'tipo': 'aeroporto', 'pegada': [24.0, 24.0], 'tile': 24.0, 'origem': 'centro; coloque em y = 0'}


def patio_posicao():
    """posição de estacionamento de avião, 48 x 48 m: concreto, linha de entrada amarela ao longo de Z, barra de parada e número"""
    o = Obra(6)
    o.n['Paredes'].top(CONCRETO_PATIO, -24, 24, -24, 24, YP)
    t = o.n['Molduras']
    for k in range(-3, 4):
        t.caixa(JUNTA, k * 6 - 0.05, k * 6 + 0.05, YP, YP + 0.004, -24, 24, '+y')
        t.caixa(JUNTA, -24, 24, YP, YP + 0.004, k * 6 - 0.05, k * 6 + 0.05, '+y')
    t.caixa(TINTA_AMARELA, -0.12, 0.12, YP, YP + YT, -12, 24, '+y')                           # linha de entrada
    t.caixa(TINTA_AMARELA, -2.5, 2.5, YP, YP + YT, -12.3, -11.7, '+y')                         # barra de parada (o nariz para aqui)
    for s in (-1, 1):                                                                         # limites da posição (asas)
        t.caixa(Material('VermelhoPatio', '#c9382f', rough=0.7), s * 23.4 - 0.12, s * 23.4 + 0.12, YP, YP + YT, -24, 24, '+y')
    return o.nos(), {'tipo': 'aeroporto', 'pegada': [48.0, 48.0], 'tile': 48.0, 'origem': 'centro; coloque em y = 0',
                     'frente': 'o avião entra de +Z andando para -Z e para com o nariz em z = -12; com o terminal 51 m ao norte (-Z), a porta esquerda encosta no finger'}


def terminal_aeroporto():
    """terminal de passageiros de 120 x 36 m: dois andares de vidro, marquise de embarque na frente (+Z), letreiro e três fingers nos fundos (-Z)"""
    o = Obra(41, p_luz=0.6)
    C = (-60, 60, -18, 18)
    H1, H2 = 6.0, 13.0
    o.caixa(PAREDE_BRANCA, -60, 60, 0, H2, -18, 18)
    o.laje_plana(C, H2, mat=LAJE, platibanda=1.4, esp=0.3, mat_platibanda=BRANCO_PURO, avanco=1.5)
    for face in ('+z', '-z'):
        for u in range(-54, 55, 12):
            o.painel_vidro(face, C, u, 0.3, 11.2, H1 - 0.8, escura=True)
            o.painel_vidro(face, C, u, H1 + 0.4, 11.2, H2 - H1 - 1.6, escura=False)
    for face in ('+x', '-x'):
        for u in (-10, 0, 10):
            o.painel_vidro(face, C, u, H1 + 0.4, 8.0, H2 - H1 - 1.6, escura=False)
    o.caixa(MARINHO, -60.05, 60.05, H1 - 0.5, H1 + 0.2, -18.05, 18.05, 'Detalhes', '+x-x+z-z')
    for u in (-30, 0, 30):
        o.porta('+z', C, u, 6.0, 3.2, vidro=True, acesa=True, mold=MOLDURA_ESCURA)
    o.marquise('+z', C, 0, 110, 9.0, 7.5, mat=BRANCO_PURO, colunas=True, mat_coluna=BRANCO_PURO)
    for x in range(-48, 49, 24):
        o.lampada(x, 7.4, 22, 0.25)
        o.luzes.append(luz((x, 7.2, 22), 16))
    png = _png_texto([('AEROPORTO HRYZ', 1.0)], 2400, 300, '#1b2a4a', borda='#e07a2c')
    o.letreiro(png, '+z', C, 0, H2 + 0.1, 40, 5.0, d=0.2)
    png2 = _png_texto([('HRYZ', 1.0)], 800, 300, '#1b2a4a', borda='#e07a2c')
    o.letreiro(png2, '-z', C, 0, H2 + 0.1, 16, 6.0, d=0.2)
    # fingers (pontes de embarque) nos fundos: corredor envidraçado sobre colunas, até z = -36; um para cada posição de avião
    # (as posições ficam a x = -48, 0, 48 dos fundos; o finger fica 5,5 m ao lado da linha, na porta esquerda do avião)
    for x in (53.5, 5.5, -42.5):
        o.caixa(PAREDE_CINZA, x - 1.6, x + 1.6, 4.0, 7.0, -34, -18, 'Detalhes')
        o.caixa(VIDRO_ESCURO, x - 1.62, x + 1.62, 5.0, 6.4, -33.5, -18.5, 'Vidro', '+x-x')
        o.caixa(PRETO_FOSCO, x - 2.0, x + 2.0, 3.6, 7.4, -36, -34, 'Detalhes')                       # sanfona da porta do avião
        for z in (-24, -32):
            o.coluna(x, z, 0, 4.0, 0.25, mat=PAREDE_CINZA, quadrada=True)
    # equipamentos no telhado
    for x in (-40, -20, 20, 40):
        o.ar_condicionado(x, H2 + 0.3, -8, 3.0, 1.6, 2.0)
    o.antena(50, H2 + 0.3, 10, 8.0)
    return o.nos(), {'tipo': 'edificio', 'pegada': [120.0, 36.0], 'frente': '+Z (embarque, para a rua); fundos -Z (pátio, fingers até z = -36)',
                     'origem': 'centro da pegada, no chão; sobre a grama ou a calçada, y = 0,15', 'luzes': o.luzes}


def torre_controle():
    """torre de controle de 38 m: prédio de base, fuste, cabine de vidro escuro, sacada, antenas e luz vermelha"""
    o = Obra(43, p_luz=0.7)
    B = (-5, 5, -5, 5)
    o.caixa(PAREDE_BRANCA, -5, 5, 0, 6, -5, 5)
    o.laje_plana(B, 6, mat=LAJE, platibanda=0.6)
    o.porta('+z', B, 0, 1.8, 2.4, vidro=True, mold=MOLDURA_ESCURA)
    for face in ('+x', '-x', '-z'):
        for u in (-2.5, 2.5):
            o.janela(face, B, u, 2.4, 1.6, 1.4)
    o.cilindro(PAREDE_BRANCA, 0, 6, 0, 2.6, 26, 20, 'Paredes')
    o.cilindro(MARINHO, 0, 30, 0, 3.4, 1.2, 20, 'Detalhes', r_top=4.4)
    o.n['VidroLuz'].cyl(VIDRO_ESCURO, 0, 31.2, 0, 4.4, 3.4, 10, caps=False, r_top=4.9)
    for k in range(10):
        a = 2 * math.pi * k / 10
        o.tubo(MARINHO, (4.4 * math.cos(a), 31.2, 4.4 * math.sin(a)), (4.9 * math.cos(a), 34.6, 4.9 * math.sin(a)), 0.08, 6)
    o.cilindro(MARINHO, 0, 34.6, 0, 5.3, 0.6, 20, 'Detalhes')
    o.cilindro(LAJE, 0, 35.2, 0, 3.0, 0.6, 16, 'Detalhes')
    o.cilindro(PAREDE_BRANCA, 0, 26.5, 0, 4.4, 0.3, 20, 'Detalhes')                                   # sacada
    for k in range(20):
        a = 2 * math.pi * k / 20
        o.tubo(METAL, (4.3 * math.cos(a), 26.8, 4.3 * math.sin(a)), (4.3 * math.cos(a), 27.8, 4.3 * math.sin(a)), 0.03, 4)
    o.antena(1.0, 35.8, 0.0, 3.5)
    o.antena(-1.4, 35.8, 0.8, 2.0)
    o.n['Luz'].ico(LUZ_VERMELHA, (1.0, 39.4, 0.0), 0.18, 1)
    o.luzes.append(luz((1.0, 39.3, 0.0), 10, '#ff4a3a'))
    return o.nos(), {'tipo': 'edificio', 'pegada': [12.0, 12.0], 'frente': '+Z', 'origem': 'centro da pegada, no chão; sobre a grama, y = 0,15', 'luzes': o.luzes}


def hangar():
    """hangar de 48 x 36 m com teto em arco, portão grande na frente (+Z) e letreiro"""
    o = Obra(44)
    W, D, HP, HA = 24.0, 18.0, 5.0, 11.0
    n = 18
    pts = [(W * math.cos(math.pi * k / n), HP + (HA - HP) * math.sin(math.pi * k / n)) for k in range(n + 1)]
    teto = o.n['Telhado']
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        teto.quad(TELHA_CINZA, (x0, y0, -D), (x1, y1, -D), (x1, y1, D), (x0, y0, D), ((x0 + x1) / 2, (y0 + y1) / 2 - HP, 0))
    o.caixa(PAREDE_CINZA, -W, W, 0, HP, -D, D, 'Paredes', '+x-x-z')
    for z, f in ((D, 1), (-D, -1)):                                                                   # oitões em arco
        poly = [(x, y, z) for x, y in pts]
        for (x0, y0, _), (x1, y1, _) in zip(poly, poly[1:]):
            o.n['Paredes'].poly(PAREDE_CINZA, [(x0, HP, z), (x1, HP, z), (x1, y1, z), (x0, y0, z)], (0, 0, f))
    o.caixa(PAREDE_CINZA, -W, -17, 0, HP, D - 0.3, D, 'Paredes', '+z+x')
    o.caixa(PAREDE_CINZA, 17, W, 0, HP, D - 0.3, D, 'Paredes', '+z-x')
    for k in range(6):                                                                               # portão de folhas metálicas
        x0 = -17 + k * 34 / 6
        o.caixa(METAL if k % 2 else METAL_ESCURO, x0 + 0.05, x0 + 34 / 6 - 0.05, 0, HP + 2.0, D - 0.25, D - 0.1, 'Portas', '+z')
    o.caixa(MARINHO, -17.2, 17.2, HP + 2.0, HP + 2.5, D - 0.3, D, 'Detalhes')
    png = _png_texto([('HANGAR  HRYZ', 1.0)], 1600, 280, '#1b2a4a', borda='#e07a2c')
    o.letreiro(png, '+z', (-W, W, -D, D), 0, HP + 2.7, 16, 2.8, d=0.15)
    for x in (-14, 0, 14):
        o.lampada(x, HP + 2.0, D + 0.4, 0.15)
        o.luzes.append(luz((x, HP + 1.8, D + 1), 14))
    return o.nos(), {'tipo': 'edificio', 'pegada': [48.0, 36.0], 'frente': '+Z', 'origem': 'centro da pegada, no chão; sobre o pátio, y = 0,16', 'luzes': o.luzes}


def biruta():
    """biruta: mastro de 6 m e cone listrado laranja e branco apontando para +X"""
    o = Obra(45)
    o.tubo(METAL, (0, 0, 0), (0, 6.2, 0), 0.07, 8)
    o.tubo(METAL, (0, 6.0, 0), (0.6, 6.0, 0), 0.04, 6)
    for k in range(5):
        x0 = 0.6 + k * 0.7
        r0, r1 = 0.45 - k * 0.06, 0.45 - (k + 1) * 0.06
        m = Malha()
        m.cyl(TECIDO_LARANJA if k % 2 == 0 else TECIDO_BRANCO, 0, 0, 0, r0, 0.7, 14, axis='x', caps=False, r_top=r1)
        o.n['Detalhes'].add(m, T(x0, 6.0 - 0.06 * k, 0))
    return o.nos(), {'tipo': 'prop', 'origem': 'pé do mastro', 'frente': 'o cone aponta para +X (o vento sopra para +X)'}


# ======================================================================== condomínio
def guarita():
    """portaria de condomínio para pôr em cima de um ladrilho rua-reta (rua ao longo de Z): cobertura de 12 m sobre a rua,
    guarita de vidro na calçada +X, cancelas nas duas faixas e letreiro na frente (+Z) e atrás"""
    o = Obra(51, p_luz=1.0)
    CV = (-6.0, 6.0, -2.5, 2.5)
    o.caixa(BRANCO_PURO, -6.0, 6.0, 5.2, 5.8, -2.5, 2.5, 'Telhado', '+x-x+y+z-z-y')
    for x in (-5.5, 5.5):
        for z in (-2.0, 2.0):
            o.coluna(x, z, 0.15, 5.2, 0.18, mat=PAREDE_CINZA, quadrada=True)
    o.caixa(PAREDE_BRANCA, 3.7, 5.9, 0.15, 3.0, -1.4, 1.4, 'Paredes')                                 # guarita
    G = (3.7, 5.9, -1.4, 1.4)
    for face in ('-x', '+z', '-z'):
        o.painel_vidro(face, G, 0, 1.1, 1.8 if face != '-x' else 2.4, 1.5, acesa=True, escura=False)
    o.caixa(LAJE, 3.5, 6.0, 3.0, 3.25, -1.6, 1.6, 'Telhado')
    o.caixa(CONCRETO_CLARO, -0.6, 0.6, 0.0, CH, -3.0, 3.0, 'Detalhes')                                  # ilha entre as faixas
    for s in (-1, 1):                                                                                   # cancelas
        bx = s * 0.35
        o.caixa(AMARELO_VIVO, bx - 0.2, bx + 0.2, CH, CH + 1.0, -s * 0.9 - 0.2, -s * 0.9 + 0.2, 'Detalhes')
        for k in range(6):
            x0 = bx + s * (0.15 + k * 0.55)
            o.caixa(VERMELHO_VIVO if k % 2 == 0 else BRANCO_PURO, min(x0, x0 + s * 0.55), max(x0, x0 + s * 0.55), CH + 0.88, CH + 1.0, -s * 0.9 - 0.05, -s * 0.9 + 0.05, 'Detalhes')
    png = _png_texto([('CONDOMÍNIO', 0.6), ('JARDIM HRYZ', 1.0)], 1600, 400, '#1b2a4a', borda='#e07a2c')
    o.letreiro(png, '+z', CV, 0, 5.85, 8.0, 2.0, d=0.12)
    o.letreiro(png, '-z', CV, 0, 5.85, 8.0, 2.0, d=0.12)
    for x in (-3, 3):
        o.lampada(x, 5.12, 0, 0.18)
        o.luzes.append(luz((x, 5.0, 0), 12))
    return o.nos(), {'tipo': 'prop', 'pegada': [12.0, 12.0], 'frente': '+Z (letreiro dos dois lados)', 'luzes': o.luzes,
                     'origem': 'centro do ladrilho; ponha em y = 0 em cima de um rua-reta (rua ao longo de Z)'}


def piscina():
    """área de piscina de 24 x 12 m: deque de pedra, piscina de 14 x 6 m, espreguiçadeiras e guarda-sóis"""
    o = Obra(52)
    d = o.n['Paredes']
    X0, X1, Z0, Z1 = -7.0, 7.0, -3.0, 3.0
    Y = 0.6                                       # deque elevado: a água fica acima do chão (o chão do mapa não tem buraco)
    for (a, b, c, e) in ((-12, 12, -6, Z0), (-12, 12, Z1, 6), (-12, X0, Z0, Z1), (X1, 12, Z0, Z1)):
        d.top(CALCADA, a, b, c, e, Y)
    for s in (-1, 1):
        d.wall(CALCADA, (-12, s * 6), (12, s * 6), 0, Y, (0, s))
        d.wall(CALCADA, (s * 12, -6), (s * 12, 6), 0, Y, (s, 0))
    for (a, b, c, e) in ((X0 - 0.4, X1 + 0.4, Z0 - 0.4, Z0), (X0 - 0.4, X1 + 0.4, Z1, Z1 + 0.4), (X0 - 0.4, X0, Z0, Z1), (X1, X1 + 0.4, Z0, Z1)):
        o.caixa(BRANCO_PURO, a, b, Y, Y + 0.06, c, e, 'Detalhes', '+y+x-x+z-z')                         # borda
    p = o.n['Molduras']
    fundo = Y - 0.55
    p.top(AZULEJO, X0, X1, Z0, Z1, fundo)
    p.wall(AZULEJO, (X0, Z0), (X1, Z0), fundo, Y, (0, 1))
    p.wall(AZULEJO, (X0, Z1), (X1, Z1), fundo, Y, (0, -1))
    p.wall(AZULEJO, (X0, Z0), (X0, Z1), fundo, Y, (1, 0))
    p.wall(AZULEJO, (X1, Z0), (X1, Z1), fundo, Y, (-1, 0))
    o.n['Vidro'].top(AGUA, X0, X1, Z0, Z1, Y - 0.10)
    for z in (-6.0, 6.0):                                                                                 # degraus para subir no deque
        o.caixa(CALCADA, -1.5, 1.5, 0.0, 0.3, z - 0.4 if z > 0 else z, z if z > 0 else z + 0.4, 'Paredes')
    for z in (-0.5, 0.5):                                                                                 # escadinha
        o.tubo(METAL, (X1 - 0.3, Y - 0.6, z), (X1 - 0.3, Y + 0.7, z), 0.03, 6)
        o.tubo(METAL, (X1 - 0.3, Y + 0.7, z), (X1 + 0.3, Y + 0.7, z), 0.03, 6)
    for k, x in enumerate((-6, -2.5, 1, 4.5)):                                                           # espreguiçadeiras
        z = 4.6
        o.caixa(BRANCO_PURO, x - 0.35, x + 0.35, Y + 0.3, Y + 0.38, z - 0.9, z + 0.9, 'Detalhes')
        o.n['Detalhes'].poly(BRANCO_PURO, [(x - 0.35, Y + 0.38, z - 0.9), (x + 0.35, Y + 0.38, z - 0.9), (x + 0.35, Y + 0.95, z - 1.3), (x - 0.35, Y + 0.95, z - 1.3)], (0, 0.6, 1))
        for dx in (-0.3, 0.3):
            for dz in (-0.8, 0.8):
                o.tubo(METAL, (x + dx, Y, z + dz), (x + dx, Y + 0.3, z + dz), 0.02, 4)
    for x in (-4.3, 2.8):                                                                                # guarda-sóis
        o.tubo(METAL, (x, Y, 4.0), (x, Y + 2.4, 4.0), 0.03, 6)
        m = Malha()
        m.cyl(LARANJA if x < 0 else MARINHO, 0, 0, 0, 1.5, 0.45, 10, caps=False, r_top=0.05)
        o.n['Detalhes'].add(m, T(x, Y + 2.0, 4.0))
    return o.nos(), {'tipo': 'prop', 'pegada': [24.0, 12.0], 'origem': 'centro, no chão; sobre a grama, y = 0,15', 'frente': '+Z (espreguiçadeiras do lado +Z)'}


RODOVIAS = {
    'rodovia-reta': (rodovia_reta, 'Rodovia de 36 x 12 m ao longo de Z: 3 faixas por sentido, acostamentos, canteiro de grama com mureta de concreto'),
    'rodovia-acesso': (rodovia_acesso, 'Rodovia com a saída para uma rua comum no lado +X (encaixa num ladrilho de rua em x = +18 m), com zebrado no acostamento'),
    'poste-rodovia': (poste_rodovia, 'Poste de 12 m para o canteiro central, com dois braços e duas luminárias'),
    'placa-rodovia-saida': (placa_rodovia_saida, 'Placa verde de rodovia (6 x 3 m em dois postes): SAÍDA / CENTRO'),
    'placa-rodovia-aeroporto': (placa_rodovia_aeroporto, 'Placa verde de rodovia: AEROPORTO / PRÓXIMA SAÍDA'),
    'placa-rodovia-cidade': (placa_rodovia_cidade, 'Placa verde de rodovia: HRYZ / BEM-VINDO'),
}
AEROPORTO = {
    'pista-reta': (pista_reta, 'Trecho de 48 x 48 m da pista de pouso (45 m de pavimento): bordas brancas, eixo tracejado e luzes de borda'),
    'pista-cabeceira': (pista_cabeceira, 'Cabeceira da pista (48 x 48 m): barras brancas, número 09, linha e luzes verdes no fim (-Z)'),
    'pista-taxi': (pista_taxi, 'Pista de táxi de 24 x 12 m: eixo e bordas amarelas, luzes azuis'),
    'patio': (patio, 'Pátio de concreto de 24 x 24 m com juntas a cada 6 m'),
    'patio-posicao': (patio_posicao, 'Posição de estacionamento de avião (48 x 48 m): linha de entrada amarela, barra de parada e limites das asas'),
    'terminal-aeroporto': (terminal_aeroporto, 'Terminal de 120 x 36 m: dois andares de vidro, marquise de embarque, letreiro AEROPORTO HRYZ e três fingers nos fundos (posições de avião a x = -48, 0, 48, centro 51 m atrás)'),
    'torre-controle': (torre_controle, 'Torre de controle de 39 m: prédio de base, fuste, cabine de vidro escuro com sacada, antenas e luz vermelha'),
    'hangar': (hangar, 'Hangar de 48 x 36 m com teto em arco, portão de folhas metálicas e letreiro HANGAR HRYZ'),
    'biruta': (biruta, 'Biruta de 6 m: cone listrado laranja e branco apontando para +X'),
}
CONDOMINIO = {
    'guarita': (guarita, 'Portaria de condomínio para um ladrilho de rua: cobertura, guarita de vidro, ilha, duas cancelas e letreiro CONDOMÍNIO JARDIM HRYZ'),
    'piscina': (piscina, 'Área de piscina de 24 x 12 m: deque, piscina de 14 x 6 m com escada, quatro espreguiçadeiras e dois guarda-sóis'),
}
