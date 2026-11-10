"""Rede elétrica: poste de concreto de 9 m (simples e com transformador) e vãos de fio de 12, 24 e 36 m.
Origem no pé do poste; a linha corre ao longo de X e a cruzeta fica ao longo de Z (frente +Z, o lado da rua).
`fio-vao-N` nasce no topo dos isoladores do poste (x = 0) e termina em x = N, onde o poste seguinte tem os isoladores:
ponha postes a cada 12, 24 ou 36 m e um vão do tamanho certo entre eles."""
import math
from malha import Malha, T, V
from paleta import *

H_CRUZETA = 8.45
Y_ISOLADOR = 8.98
Z_FIOS = (-0.85, 0.0, 0.85)
Y_TELECOM = 7.35


def poste_concreto():
    m = Malha()
    m.revolve(CONCRETO_CLARO, [(0, 0), (0.2, 0), (0.2, 0.2), (0.165, 0.25), (0.115, 9.0), (0.0, 9.0)], 12, smooth=True, hard_deg=30)
    return m


def cruzeta():
    c, iso, fer = Malha(), Malha(), Malha()
    c.caixa(MADEIRA_ESCURA, -0.07, 0.07, H_CRUZETA, H_CRUZETA + 0.1, -1.15, 1.15)
    for sg in (-1, 1):
        fer.tubo(METAL_ESCURO, (0, H_CRUZETA - 0.35, 0.12 * sg), (0, H_CRUZETA + 0.02, 0.9 * sg), 0.022, 0.022, 5)      # mão-francesa
    fer.caixa(METAL_ESCURO, -0.1, 0.1, H_CRUZETA - 0.02, H_CRUZETA + 0.12, -0.14, 0.14)
    for z in Z_FIOS:
        iso.cyl(PEDRA, 0, H_CRUZETA + 0.1, z, 0.045, 0.1, 10)
        iso.cyl(BRANCO_PURO, 0, H_CRUZETA + 0.2, z, 0.07, 0.05, 10)
        iso.cyl(PEDRA, 0, H_CRUZETA + 0.25, z, 0.05, 0.1, 10)
        iso.cyl(BRANCO_PURO, 0, H_CRUZETA + 0.35, z, 0.032, 0.05, 10)
    return c, iso, fer


def telecom_e_ferragens():
    m = Malha()
    m.caixa(METAL_ESCURO, -0.02, 0.02, Y_TELECOM - 0.08, Y_TELECOM + 0.08, 0.1, 0.25)
    m.tubo(PRETO, (0, 1.6, 0.17), (0, 6.2, 0.17), 0.012, 0.012, 5)               # descida de fio
    for y in (2.0, 3.2, 4.4, 5.6):
        m.caixa(METAL_ESCURO, -0.12, 0.12, y, y + 0.025, 0.1, 0.17)               # degraus de ferro
    return m


def transformador():
    t, b = Malha(), Malha()
    t.cyl(PAREDE_CINZA, 0.0, 6.95, 0.33, 0.27, 0.78, 14)
    t.cyl(METAL_ESCURO, 0.0, 7.73, 0.33, 0.29, 0.04, 14)
    t.cyl(METAL_ESCURO, 0.0, 6.9, 0.33, 0.29, 0.05, 14)
    for z in (-0.12, 0.0, 0.12):
        b.cyl(PEDRA, -0.1, 7.77, 0.33 + z, 0.035, 0.12, 8)
        b.cyl(BRANCO_PURO, -0.1, 7.89, 0.33 + z, 0.05, 0.04, 8)
    t.caixa(METAL_ESCURO, -0.08, 0.08, 7.0, 7.7, 0.1, 0.17)
    return t, b


def poste_energia(com_transformador=False):
    c, iso, fer = cruzeta()
    nos = [('Poste', poste_concreto()), ('Cruzeta', c), ('Isoladores', iso), ('Ferragens', fer), ('Telecom', telecom_e_ferragens())]
    if com_transformador:
        t, b = transformador()
        nos += [('Transformador', t), ('Buchas', b)]
    return nos


def fio_vao(comp):
    """três fios de força e um cabo de telecomunicações pendurados entre dois postes, com a flecha de uma parábola (1,8 % do vão)"""
    w = Malha()
    seg = max(6, int(comp / 1.5))
    flecha = 0.018 * comp
    for z in Z_FIOS:
        for i in range(seg):
            x0, x1 = comp * i / seg, comp * (i + 1) / seg
            y = lambda x: Y_ISOLADOR + 0.05 - flecha * 4 * (x / comp) * (1 - x / comp)
            w.tubo(PRETO_FOSCO, (x0, y(x0), z), (x1, y(x1), z), 0.013, 0.013, 5)
    fl2 = flecha * 0.8
    for i in range(seg):
        x0, x1 = comp * i / seg, comp * (i + 1) / seg
        y = lambda x: Y_TELECOM - fl2 * 4 * (x / comp) * (1 - x / comp)
        w.tubo(PRETO_FOSCO, (x0, y(x0), 0.2), (x1, y(x1), 0.2), 0.02, 0.02, 5)
    return [('Fios', w)]


PECAS = {
    'poste-energia': (lambda: poste_energia(False), 'Poste de concreto de 9 m com cruzeta, três isoladores e cabo de telefonia; a linha corre ao longo de X', {'tipo': 'poste-energia'}),
    'poste-energia-transformador': (lambda: poste_energia(True), 'Poste de energia com transformador de distribuição', {'tipo': 'poste-energia'}),
    'fio-vao-12': (lambda: fio_vao(12), 'Fios entre dois postes a 12 m (começa no poste em x = 0 e termina em x = 12)', {'tipo': 'fio', 'vao': 12}),
    'fio-vao-24': (lambda: fio_vao(24), 'Fios entre dois postes a 24 m', {'tipo': 'fio', 'vao': 24}),
    'fio-vao-36': (lambda: fio_vao(36), 'Fios entre dois postes a 36 m', {'tipo': 'fio', 'vao': 36}),
}
