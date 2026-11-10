"""Mobiliário urbano: semáforo (de poste e de braço projetado) e hidrante.
Origem no pé do objeto, sobre o chão (y = 0). A frente (lentes do semáforo, bocal do hidrante) aponta para +Z.
Para o semáforo olhar para um carro que anda para +Z, gire 180° em Y."""
import math
from glb import Material
from malha import Malha, T, Rx, Rz
from paleta import *

COR_LUZ = {'vermelho': ('#ff2a22', '#4b1311'), 'amarelo': ('#ffc61a', '#4a3a0a'), 'verde': ('#27e05a', '#0d3a1b')}
ORDEM = ['vermelho', 'amarelo', 'verde']       # de cima para baixo


def lampada(cor, ligada):
    on, off = COR_LUZ[cor]
    return Material('Luz_' + cor.capitalize() + ('_ligada' if ligada else '_apagada'), on if ligada else off, rough=0.3,
                    emissive=on if ligada else None)


def cabeca(estado, y_centro, z_frente):
    """caixa de 3 luzes (vermelho no topo): caixa preta, viseiras e lentes. Frente da caixa em z = z_frente.
    Retorna (caixa, viseiras, {cor: lente})"""
    w, h, d = 0.36, 1.10, 0.30
    caixa = Malha()
    caixa.box(PRETO, 0, y_centro, z_frente - d / 2, w, h, d)
    visor, luzes = Malha(), {}
    for i, cor in enumerate(ORDEM):
        cy = y_centro + (1 - i) * 0.36
        v = Malha(); v.revolve(PRETO, [(0.145, 0), (0.145, 0.17), (0.115, 0.17), (0.115, 0)], 14)      # tubo aberto de 17 cm
        visor.add(v, T(0, cy, z_frente) @ Rx(math.pi / 2))
        lente = Malha(); lente.cyl(lampada(cor, estado == cor), 0, 0, 0, 0.112, 0.024, 16)            # sai 1,4 cm da caixa
        luzes[cor] = Malha(); luzes[cor].add(lente, T(0, cy, z_frente - 0.01) @ Rx(math.pi / 2))
    return caixa, visor, luzes


def semaforo(estado='apagado'):
    """semáforo de poste: coluna de 3,7 m com a cabeça de 3 luzes presa por dois suportes, voltada para +Z"""
    poste = Malha()
    poste.cyl(METAL_ESCURO, 0, 0, 0, 0.17, 0.06, 12)                 # sapata
    poste.cyl(METAL, 0, 0, 0, 0.065, 3.7, 12)
    poste.cyl(METAL_ESCURO, 0, 3.7, 0, 0.075, 0.04, 12)
    suportes = Malha()
    for y in (2.55, 3.35):
        suportes.box(METAL_ESCURO, 0, y, 0.12, 0.09, 0.07, 0.26)
    caixa, visor, luzes = cabeca(estado, 2.95, z_frente=0.52)
    return [('Poste', poste), ('Suportes', suportes), ('Caixa', caixa), ('Viseiras', visor)] + [('Luz_' + c.capitalize(), luzes[c]) for c in ORDEM]


def semaforo_braco(estado='apagado'):
    """semáforo de braço projetado: coluna de 6 m e braço de 5 m (para +X) com duas cabeças penduradas sobre as faixas"""
    poste = Malha()
    poste.cyl(METAL_ESCURO, 0, 0, 0, 0.22, 0.08, 12)
    poste.cyl(METAL, 0, 0, 0, 0.1, 6.0, 12)
    braco = Malha()
    braco.cyl(METAL, 0, 5.6, 0, 0.065, 5.2, 10, axis='x')
    braco.box(METAL_ESCURO, 0.12, 5.3, 0, 0.12, 0.9, 0.1)             # mão-francesa
    caixas, viseiras = Malha(), Malha()
    luzes = {c: Malha() for c in ORDEM}
    for x in (2.1, 4.3):
        cx, vz, lz = cabeca(estado, 4.88, z_frente=0.15)
        caixas.add(cx, T(x, 0, 0)); viseiras.add(vz, T(x, 0, 0))
        caixas.box(METAL_ESCURO, x, 5.51, 0, 0.1, 0.18, 0.1)          # tirante entre braço e cabeça
        for c in ORDEM:
            luzes[c].add(lz[c], T(x, 0, 0))
    return [('Poste', poste), ('Braco', braco), ('Caixas', caixas), ('Viseiras', viseiras)] + [('Luz_' + c.capitalize(), luzes[c]) for c in ORDEM]


def bocal(corpo, escuro, y, r, comp, rotacao):
    """bocal do hidrante: tubo + tampa maior + porca; construído ao longo de +Y e depois girado"""
    b = Malha()
    b.cyl(corpo, 0, 0.09, 0, r, comp, 12)
    b.cyl(escuro, 0, 0.09 + comp, 0, r * 1.28, 0.035, 12)
    b.cyl(escuro, 0, 0.125 + comp, 0, r * 0.55, 0.025, 6)
    m = Malha()
    m.add(b, T(0, y, 0) @ rotacao)
    return m


def hidrante(corpo=VERMELHO_HIDRANTE, escuro=VERMELHO_HIDRANTE_ESCURO):
    """hidrante de coluna (0,8 m): corpo, cúpula com porca pentagonal e três bocais (dois laterais em ±X, um frontal em +Z)"""
    c = Malha()
    perfil = [(0, 0), (0.175, 0), (0.175, 0.045), (0.145, 0.075), (0.118, 0.085), (0.112, 0.50), (0.14, 0.51), (0.14, 0.58),
              (0.118, 0.59), (0.108, 0.64), (0.122, 0.64), (0.118, 0.69), (0.098, 0.73), (0.062, 0.755), (0, 0.765)]
    c.revolve(corpo, perfil, 16, smooth=True, hard_deg=30)
    c.cyl(escuro, 0, 0.765, 0, 0.042, 0.05, 5)
    c.add(bocal(corpo, escuro, 0.40, 0.058, 0.115, Rz(-math.pi / 2)))      # +X
    c.add(bocal(corpo, escuro, 0.40, 0.058, 0.115, Rz(math.pi / 2)))       # -X
    c.add(bocal(corpo, escuro, 0.37, 0.078, 0.12, Rx(math.pi / 2)))        # +Z (bocal de bombeiro, maior)
    return [('Hidrante', c)]


PECAS = {
    'semaforo-apagado': (lambda: semaforo('apagado'), 'Semáforo de poste com as três luzes apagadas'),
    'semaforo-vermelho': (lambda: semaforo('vermelho'), 'Semáforo de poste com a luz vermelha ligada'),
    'semaforo-amarelo': (lambda: semaforo('amarelo'), 'Semáforo de poste com a luz amarela ligada'),
    'semaforo-verde': (lambda: semaforo('verde'), 'Semáforo de poste com a luz verde ligada'),
    'semaforo-braco-vermelho': (lambda: semaforo_braco('vermelho'), 'Semáforo de braço projetado (2 cabeças) com luz vermelha'),
    'semaforo-braco-verde': (lambda: semaforo_braco('verde'), 'Semáforo de braço projetado (2 cabeças) com luz verde'),
    'hidrante': (hidrante, 'Hidrante de coluna vermelho'),
    'hidrante-amarelo': (lambda: hidrante(AMARELO_HIDRANTE, AMARELO_HIDRANTE_ESCURO), 'Hidrante de coluna amarelo'),
}
