"""Postes de luz: de braço único (urbano, 8 m), de braço duplo e de pedestre com globo (4,4 m).
Origem no pé do poste; o braço aponta para +Z (gire para a pista). O nó `Luz` é a lente emissiva (ligada ou apagada);
`extras.luzes` informa onde pôr luzes reais do Three.js (posição, direção, cor)."""
import math
from glb import Material
from malha import Malha, T, Ry
from paleta import POSTE, POSTE_BASE, LUMINARIA

COR_LUZ = '#ffd98a'


def lente(ligada):
    if ligada:
        return Material('Luz_ligada', '#fff2cc', rough=0.3, emissive=COR_LUZ)
    return Material('Luz_apagada', '#cdd3d8', rough=0.25)


def base_e_coluna():
    m = Malha()
    m.revolve(POSTE_BASE, [(0, 0), (0.20, 0), (0.20, 0.06), (0.17, 0.10), (0.14, 0.22), (0.14, 0.85), (0.12, 0.95), (0.105, 1.0)], 14, smooth=True, hard_deg=30)
    m.cyl(POSTE, 0, 1.0, 0, 0.105, 6.3, 14, r_top=0.065, caps=False)
    m.esfera(POSTE, (0, 7.30, 0), 0.07, 10, 5)
    return m


def braco_e_luminaria(ligada):
    """braço curvo (davit) saindo do topo para +Z e a luminária de 1 m na ponta"""
    braco = Malha()
    pts = [(0, 7.28, 0.0), (0, 7.55, 0.06), (0, 7.80, 0.28), (0, 7.95, 0.62), (0, 8.02, 1.05), (0, 8.03, 1.45)]
    raios = [0.065, 0.060, 0.055, 0.050, 0.045, 0.042]
    for i in range(len(pts) - 1):
        braco.tubo(POSTE, pts[i], pts[i + 1], raios[i], raios[i + 1], 10)
    for p, r in zip(pts[1:-1], raios[1:-1]):
        braco.esfera(POSTE, p, r, 10, 5)
    lum = Malha()
    plano = [(-0.16, 1.35), (0.16, 1.35), (0.16, 2.15), (0.09, 2.38), (-0.09, 2.38), (-0.16, 2.15)]
    lum.prism(LUMINARIA, LUMINARIA, plano, 7.90, 8.10)
    lum.box(LUMINARIA, 0, 8.00, 1.32, 0.20, 0.16, 0.06)                     # tampa traseira
    luz = Malha()
    ln = [(-0.12, 1.45), (0.12, 1.45), (0.12, 2.12), (0.06, 2.30), (-0.06, 2.30), (-0.12, 2.12)]
    luz.poly(lente(ligada), [(x, 7.895, z) for x, z in ln], (0, -1, 0))     # lente voltada para baixo
    return braco, lum, luz


def poste_luz(ligada=True, duplo=False):
    coluna = base_e_coluna()
    braco, lum, luz = braco_e_luminaria(ligada)
    if duplo:
        for peca in (braco, lum, luz):
            copia = Malha(); copia.add(peca, Ry(math.pi)); peca.add(copia)
    luzes = [{'pos': [0, 7.88, 1.85], 'dir': [0, -1, 0], 'cor': COR_LUZ, 'alcance': 16}]
    if duplo:
        luzes.append({'pos': [0, 7.88, -1.85], 'dir': [0, -1, 0], 'cor': COR_LUZ, 'alcance': 16})
    return [('Poste', coluna), ('Braco', braco), ('Luminaria', lum), ('Luz', luz)], {'luzes': luzes, 'ligada': ligada}


def poste_pedestre(ligada=True):
    """poste ornamental de 4,4 m com globo (calçadas, praças, parques)"""
    c = Malha()
    c.revolve(POSTE_BASE, [(0, 0), (0.22, 0), (0.22, 0.08), (0.17, 0.14), (0.12, 0.30), (0.085, 0.46)], 12, smooth=True, hard_deg=30)
    c.cyl(POSTE, 0, 0.46, 0, 0.085, 3.10, 12, r_top=0.055, caps=False)
    c.cyl(POSTE_BASE, 0, 3.52, 0, 0.115, 0.07, 12)
    c.cyl(POSTE_BASE, 0, 3.59, 0, 0.14, 0.10, 12)
    topo = Malha()
    topo.revolve(LUMINARIA, [(0.31, 4.22), (0.29, 4.27), (0.0, 4.46)], 14, smooth=False)
    topo.esfera(LUMINARIA, (0, 4.48, 0), 0.04, 8, 4)
    luz = Malha()
    luz.esfera(lente(ligada), (0, 3.99, 0), 0.27, 14, 8)
    return [('Poste', c), ('Topo', topo), ('Luz', luz)], {'luzes': [{'pos': [0, 3.99, 0], 'dir': [0, -1, 0], 'cor': COR_LUZ, 'alcance': 9}], 'ligada': ligada}


PECAS = {
    'poste-luz': (lambda: poste_luz(True), 'Poste de luz urbano de 8 m, braço único, lâmpada acesa'),
    'poste-luz-apagado': (lambda: poste_luz(False), 'Poste de luz urbano de 8 m, braço único, lâmpada apagada'),
    'poste-luz-duplo': (lambda: poste_luz(True, True), 'Poste de luz de 8 m com dois braços opostos (canteiro central), acesa'),
    'poste-luz-pedestre': (lambda: poste_pedestre(True), 'Poste ornamental de pedestre (4,4 m) com globo aceso, para calçadas e praças'),
}
