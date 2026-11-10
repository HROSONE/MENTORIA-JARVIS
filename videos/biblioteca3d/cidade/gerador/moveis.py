"""Mesas, cadeiras, banco, banqueta e sofá em metros reais. Origem no chão (y = 0), no centro da peça.
A frente (de onde a pessoa senta: o assento das cadeiras, o lado das gavetas da escrivaninha) aponta para +Z."""
import math
from malha import Malha, T, Ry, Rx, V
from paleta import *
from glb import Material

TECIDO = Material('TecidoSofa', '#4d6a8a', rough=1.0)
TECIDO_CLARO = Material('TecidoSofaClaro', '#6384a8', rough=1.0)
PLASTICO = Material('PlasticoBranco', '#f2f2ee', rough=0.45)
COURO = Material('CouroPreto', '#2b2d31', rough=0.55)
ESTOFADO = Material('EstofadoCadeira', '#3d556f', rough=0.95)
TAMPO_BRANCO = Material('TampoBranco', '#ecebe6', rough=0.6)


def perna(m, mat, x, z, s, y0, y1):
    m.caixa(mat, x - s / 2, x + s / 2, y0, y1, z - s / 2, z + s / 2, '+x-x+z-z')


def mesa_madeira(c=1.6, l=0.9, h=0.75):
    tampo, pernas, saia = Malha(), Malha(), Malha()
    tampo.caixa(MADEIRA_CLARA, -c / 2, c / 2, h - 0.04, h, -l / 2, l / 2, '+x-x+y+z-z-y')
    for sx in (-1, 1):
        for sz in (-1, 1):
            perna(pernas, MADEIRA_ESCURA, sx * (c / 2 - 0.08), sz * (l / 2 - 0.08), 0.07, 0, h - 0.04)
    for sz in (-1, 1):
        saia.caixa(MADEIRA, -c / 2 + 0.12, c / 2 - 0.12, h - 0.12, h - 0.04, sz * (l / 2 - 0.1), sz * (l / 2 - 0.075), '+x-x+z-z')
    for sx in (-1, 1):
        saia.caixa(MADEIRA, sx * (c / 2 - 0.1), sx * (c / 2 - 0.075), h - 0.12, h - 0.04, -l / 2 + 0.12, l / 2 - 0.12, '+x-x+z-z')
    return [('Tampo', tampo), ('Pernas', pernas), ('Saia', saia)]


def mesa_redonda():
    tampo, base = Malha(), Malha()
    tampo.cyl(TAMPO_BRANCO, 0, 0.7, 0, 0.4, 0.03, 24)
    tampo.revolve(MADEIRA, [(0.4, 0.7), (0.4, 0.73)], 24, smooth=False)
    base.revolve(METAL_ESCURO, [(0, 0), (0.27, 0), (0.27, 0.025), (0.07, 0.07), (0.04, 0.22), (0.04, 0.68), (0.14, 0.7), (0.0, 0.7)], 16, smooth=True, hard_deg=30)
    return [('Tampo', tampo), ('Base', base)]


def mesa_piquenique():
    t, b, p = Malha(), Malha(), Malha()
    for k in range(5):
        z0 = -0.38 + k * 0.1525
        t.caixa(MADEIRA_CLARA, -0.9, 0.9, 0.74, 0.785, z0 + 0.006, z0 + 0.1465, '+x-x+y+z-z-y')
    for sz in (-1, 1):
        for k in range(2):
            z0 = sz * 0.78 + (-0.14 + k * 0.145)
            b.caixa(MADEIRA_CLARA, -0.9, 0.9, 0.43, 0.47, z0, z0 + 0.135, '+x-x+y+z-z-y')
    for sx in (-0.62, 0.62):
        for sz in (-1, 1):
            p.tubo(MADEIRA_ESCURA, (sx, 0, sz * 0.96), (sx, 0.72, sz * 0.12), 0.045, 0.045, 6)
        p.caixa(MADEIRA_ESCURA, sx - 0.04, sx + 0.04, 0.4, 0.43, -0.93, 0.93, '+x-x+y+z-z-y')
        p.caixa(MADEIRA_ESCURA, sx - 0.04, sx + 0.04, 0.7, 0.74, -0.4, 0.4, '+x-x+y+z-z-y')
    return [('Tampo', t), ('Bancos', b), ('Estrutura', p)]


def mesa_escritorio():
    t, g, f, m = Malha(), Malha(), Malha(), Malha()
    t.caixa(TAMPO_BRANCO, -0.7, 0.7, 0.72, 0.76, -0.35, 0.35, '+x-x+y+z-z-y')
    # módulo de gavetas à esquerda (lado de quem senta)
    g.caixa(MADEIRA, -0.7, -0.3, 0.0, 0.72, -0.31, 0.31, '+x-x+z-z')
    for i in range(3):
        y0 = 0.05 + i * 0.22
        f.caixa(MADEIRA_CLARA, -0.68, -0.32, y0, y0 + 0.2, 0.31, 0.325, '+x-x+y+z-z-y')
        f.caixa(METAL_ESCURO, -0.55, -0.45, y0 + 0.15, y0 + 0.17, 0.325, 0.345)
    # lateral direita e fundo
    m.caixa(MADEIRA, 0.64, 0.68, 0.0, 0.72, -0.31, 0.31, '+x-x+z-z')
    m.caixa(MADEIRA, -0.3, 0.64, 0.3, 0.72, -0.3, -0.27, '+x-x+z-z')
    return [('Tampo', t), ('Gavetas', g), ('Frentes', f), ('Estrutura', m)]


def cadeira_madeira():
    s, p, e = Malha(), Malha(), Malha()
    s.caixa(MADEIRA_CLARA, -0.22, 0.22, 0.42, 0.46, -0.21, 0.21, '+x-x+y+z-z-y')
    for sx in (-1, 1):
        perna(p, MADEIRA, sx * 0.19, 0.18, 0.04, 0, 0.42)
        perna(p, MADEIRA, sx * 0.19, -0.18, 0.04, 0, 0.92)
        e.caixa(MADEIRA, sx * 0.19 - 0.012, sx * 0.19 + 0.012, 0.2, 0.25, -0.18, 0.18, '+x-x+y-y')
    e.caixa(MADEIRA, -0.19, 0.19, 0.2, 0.25, -0.012 + 0.0, 0.012, '+z-z+y-y')
    for y in (0.66, 0.84):
        e.caixa(MADEIRA, -0.19, 0.19, y, y + 0.06, -0.2, -0.17, '+x-x+y+z-z-y')
    for x in (-0.09, 0.0, 0.09):
        e.caixa(MADEIRA, x - 0.02, x + 0.02, 0.5, 0.9, -0.19, -0.175, '+x-x+z-z')
    return [('Assento', s), ('Pernas', p), ('Encosto', e)]


def cadeira_plastica():
    a, p, e = Malha(), Malha(), Malha()
    a.caixa(PLASTICO, -0.23, 0.23, 0.425, 0.46, -0.22, 0.23, '+x-x+y+z-z-y')
    a.caixa(PLASTICO, -0.23, 0.23, 0.46, 0.5, 0.2, 0.23, '+x-x+y+z-z')           # borda frontal
    enc = Malha()
    for k in range(4):
        y = 0.1 + k * 0.095
        enc.caixa(PLASTICO, -0.205, 0.205, y, y + 0.07, -0.015, 0.015, '+x-x+y+z-z-y')
    for sx in (-1, 1):
        enc.caixa(PLASTICO, sx * 0.205 - 0.015, sx * 0.205 + 0.015, 0.0, 0.46, -0.025, 0.025, '+x-x+y+z-z')
    e.add(enc, T(0, 0.46, -0.205) @ Rx(-0.2))
    for sx in (-1, 1):
        for sz in (-1, 1):
            p.tubo(PLASTICO, (sx * 0.2, 0.43, sz * 0.19), (sx * 0.235, 0.0, sz * 0.225), 0.022, 0.016, 8)
        p.caixa(PLASTICO, sx * 0.2 - 0.012, sx * 0.2 + 0.012, 0.22, 0.25, -0.2, 0.2, '+x-x+y-y')
    return [('Assento', a), ('Encosto', e), ('Pernas', p)]


def cadeira_escritorio():
    b, r, a, e = Malha(), Malha(), Malha(), Malha()
    b.cyl(METAL_ESCURO, 0, 0.27, 0, 0.032, 0.17, 10)
    b.cyl(PRETO, 0, 0.4, 0, 0.055, 0.04, 10)
    for k in range(5):
        ang = 2 * math.pi * k / 5
        dx, dz = math.cos(ang), math.sin(ang)
        b.tubo(METAL_ESCURO, (0, 0.14, 0), (dx * 0.3, 0.07, dz * 0.3), 0.022, 0.016, 6)
        r.cyl(PRETO, dx * 0.3, 0.0, dz * 0.3, 0.032, 0.06, 8)
    a.caixa(ESTOFADO, -0.26, 0.26, 0.44, 0.52, -0.24, 0.25, '+x-x+y+z-z-y')
    a.caixa(PRETO, -0.2, 0.2, 0.41, 0.44, -0.2, 0.2, '+x-x+z-z-y')
    enc = Malha()
    enc.caixa(ESTOFADO, -0.24, 0.24, 0.0, 0.48, -0.03, 0.03, '+x-x+y+z-z-y')
    e.add(enc, T(0, 0.55, -0.23) @ Rx(-0.14))
    e.caixa(PRETO, -0.04, 0.04, 0.5, 0.58, -0.25, -0.2, '+x-x+y+z-z-y')
    for sx in (-1, 1):
        e.caixa(PRETO, sx * 0.27 - 0.02, sx * 0.27 + 0.02, 0.52, 0.56, -0.12, 0.14, '+x-x+y+z-z-y')
        e.caixa(PRETO, sx * 0.27 - 0.02, sx * 0.27 + 0.02, 0.46, 0.52, -0.02, 0.02, '+x-x+z-z')
    return [('Base', b), ('Rodinhas', r), ('Assento', a), ('Encosto', e)]


def banqueta():
    a, p, an = Malha(), Malha(), Malha()
    a.cyl(MADEIRA_CLARA, 0, 0.62, 0, 0.18, 0.05, 20)
    for k in range(3):
        ang = 2 * math.pi * k / 3 + 0.5
        p.tubo(METAL_ESCURO, (math.cos(ang) * 0.12, 0.63, math.sin(ang) * 0.12), (math.cos(ang) * 0.23, 0.0, math.sin(ang) * 0.23), 0.017, 0.014, 6)
    an.revolve(METAL_ESCURO, [(0.2, 0.24), (0.2, 0.265), (0.18, 0.265), (0.18, 0.24), (0.2, 0.24)], 18, smooth=False)
    return [('Assento', a), ('Pernas', p), ('Aro', an)]


def banco_praca():
    r, ripas, enc = Malha(), Malha(), Malha()
    for sx in (-0.82, 0.82):
        r.caixa(METAL_ESCURO, sx - 0.025, sx + 0.025, 0.0, 0.43, 0.2, 0.26, '+x-x+z-z')
        r.caixa(METAL_ESCURO, sx - 0.025, sx + 0.025, 0.0, 0.43, -0.22, -0.16, '+x-x+z-z')
        r.caixa(METAL_ESCURO, sx - 0.025, sx + 0.025, 0.41, 0.45, -0.24, 0.26, '+x-x+y+z-z-y')
        r.caixa(METAL_ESCURO, sx - 0.025, sx + 0.025, 0.43, 0.84, -0.3, -0.25, '+x-x+z-z')
        r.caixa(METAL_ESCURO, sx - 0.03, sx + 0.03, 0.62, 0.66, -0.02, 0.28, '+x-x+y+z-z-y')
        r.caixa(METAL_ESCURO, sx - 0.025, sx + 0.025, 0.43, 0.64, 0.24, 0.28, '+x-x+z-z')
    for k in range(4):
        z0 = -0.2 + k * 0.1
        ripas.caixa(MADEIRA, -0.9, 0.9, 0.45, 0.49, z0, z0 + 0.09, '+x-x+y+z-z-y')
    espaldar = Malha()
    for k in range(3):
        y0 = 0.0 + k * 0.13
        espaldar.caixa(MADEIRA, -0.9, 0.9, y0, y0 + 0.11, -0.02, 0.02, '+x-x+y+z-z-y')
    enc.add(espaldar, T(0, 0.52, -0.28) @ Rx(-0.12))
    return [('Estrutura', r), ('Assento', ripas), ('Encosto', enc)]


def sofa():
    base, almof, pes = Malha(), Malha(), Malha()
    base.caixa(TECIDO, -1.0, 1.0, 0.12, 0.42, -0.45, 0.45, '+x-x+y+z-z-y')
    base.caixa(TECIDO, -0.88, 0.88, 0.42, 0.86, -0.45, -0.2, '+x-x+y+z-z')
    for sx in (-1, 1):
        base.caixa(TECIDO, min(sx * 0.88, sx * 1.0), max(sx * 0.88, sx * 1.0), 0.12, 0.64, -0.45, 0.45, '+x-x+y+z-z')
    for i, (a, b) in enumerate(((-0.87, -0.295), (-0.285, 0.285), (0.295, 0.87))):
        almof.caixa(TECIDO_CLARO, a, b, 0.42, 0.53, -0.2, 0.46, '+x-x+y+z-z')
        almof.caixa(TECIDO_CLARO, a, b, 0.53, 0.83, -0.3, -0.17, '+x-x+y+z-z')
    for sx in (-1, 1):
        for sz in (-1, 1):
            pes.cyl(MADEIRA_ESCURA, sx * 0.9, 0.0, sz * 0.36, 0.035, 0.12, 8, r_top=0.03)
    return [('Corpo', base), ('Almofadas', almof), ('Pes', pes)]


def conjunto_jantar():
    nos = {}
    for nome, m in mesa_madeira():
        nos.setdefault(nome, Malha()).add(m)
    for k, (x, z, giro) in enumerate(((-0.38, -0.62, 0.0), (0.38, -0.62, 0.0), (-0.38, 0.62, math.pi), (0.38, 0.62, math.pi))):
        for nome, m in cadeira_madeira():
            nos.setdefault(nome + 'Cadeiras', Malha()).add(m, T(x, 0, z) @ Ry(giro))
    return list(nos.items())


EX = {'tipo': 'movel', 'origem': 'chão (y = 0)', 'frente': '+Z'}
PECAS = {
    'mesa-madeira': (mesa_madeira, 'Mesa de jantar de madeira, 1,6 x 0,9 m, altura 0,75 m', EX),
    'mesa-redonda': (mesa_redonda, 'Mesa redonda de café, 0,8 m de diâmetro, altura 0,73 m', EX),
    'mesa-piquenique': (mesa_piquenique, 'Mesa de piquenique de madeira com dois bancos, 1,8 x 2,3 m', EX),
    'mesa-escritorio': (mesa_escritorio, 'Escrivaninha 1,4 x 0,7 m com três gavetas (o lado das gavetas é +Z)', EX),
    'cadeira-madeira': (cadeira_madeira, 'Cadeira de madeira com encosto de ripas, assento a 0,46 m', EX),
    'cadeira-plastica': (cadeira_plastica, 'Cadeira de plástico branca (monobloco), assento a 0,46 m', EX),
    'cadeira-escritorio': (cadeira_escritorio, 'Cadeira giratória de escritório com rodinhas e braços', EX),
    'banqueta': (banqueta, 'Banqueta redonda de bar, assento a 0,67 m', EX),
    'banco-praca': (banco_praca, 'Banco de praça de ferro e madeira, 1,8 m', EX),
    'sofa': (sofa, 'Sofá de três lugares, 2,0 x 0,9 m', EX),
    'conjunto-jantar': (conjunto_jantar, 'Mesa de jantar com quatro cadeiras (duas de cada lado), 1,6 x 2,2 m', EX),
}
