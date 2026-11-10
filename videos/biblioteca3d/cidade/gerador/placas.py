"""Placas de trânsito: poste de aço + chapa com a face desenhada (textura PNG embutida no .glb).
Origem no pé do poste; a face da placa aponta para +Z (gire 180° em Y para quem anda para +Z ler a placa).
O centro da chapa fica a 2,25 m do chão (padrão urbano)."""
import math
import numpy as np
from glb import Material
from malha import Malha
from paleta import METAL, PLACA_COSTAS, METAL_ESCURO
import texturas as T

POSTE_H = 2.6
CENTRO_Y = 2.25
ESPESSURA = 0.03


def poligono_chapa(forma, w, h):
    """vértices (x, y) da chapa, centrada na origem, y para cima"""
    if forma == 'octogono':
        r = w / 2 / math.cos(math.pi / 8)
        return [(r * math.cos(math.pi / 8 + i * math.pi / 4), r * math.sin(math.pi / 8 + i * math.pi / 4)) for i in range(8)]
    if forma == 'circulo':
        n = 28
        return [(w / 2 * math.cos(2 * math.pi * i / n), w / 2 * math.sin(2 * math.pi * i / n)) for i in range(n)]
    if forma == 'triangulo-invertido':
        return [(-w / 2, h / 2), (w / 2, h / 2), (0, -h / 2)]
    if forma == 'losango':
        return [(0, h / 2), (w / 2, 0), (0, -h / 2), (-w / 2, 0)]
    if forma == 'retangulo':
        return [(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)]
    raise ValueError(forma)


def chapa(forma, w, h, png_bytes, rough=0.45):
    """chapa de 3 cm: frente com textura em +Z, costas e bordas em metal"""
    frente = Material('Placa_' + forma, '#ffffff', rough=rough, texture=png_bytes)
    pts = poligono_chapa(forma, w, h)
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    uv = [((x - x0) / (x1 - x0), 1 - (y - y0) / (y1 - y0)) for x, y in pts]
    m = Malha()
    m.poly(frente, [(x, y, ESPESSURA) for x, y in pts], (0, 0, 1), uvs=uv)
    m.poly(PLACA_COSTAS, [(x, y, 0.0) for x, y in pts], (0, 0, -1))
    n = len(pts)
    for i in range(n):
        a, b = pts[i], pts[(i + 1) % n]
        mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        m.quad(PLACA_COSTAS, (a[0], a[1], 0), (b[0], b[1], 0), (b[0], b[1], ESPESSURA), (a[0], a[1], ESPESSURA), (mid[0], mid[1], 0))
    return m


def poste(altura=POSTE_H):
    m = Malha()
    m.cyl(METAL, 0, 0, -0.07, 0.04, altura, 10)
    m.cyl(METAL_ESCURO, 0, 0, -0.07, 0.06, 0.05, 10)            # sapata
    m.cyl(METAL_ESCURO, 0, altura, -0.07, 0.045, 0.03, 10)     # tampa
    return m


def suportes(cy, meio_h):
    m = Malha()
    for dy in (-meio_h * 0.55, meio_h * 0.55):
        m.box(METAL_ESCURO, 0, cy + dy, -0.035, 0.12, 0.035, 0.07)
    return m


def placa(forma, w, h, png_bytes, cy=CENTRO_Y, altura=POSTE_H):
    c = chapa(forma, w, h, png_bytes)
    c2 = Malha(); c2.add(c, __import__('malha').T(0, cy, 0))
    return [('Poste', poste(altura)), ('Suportes', suportes(cy, h / 2)), ('Placa', c2)]


def p_pare():
    return placa('octogono', 0.80, 0.80, T.face_pare())


def p_preferencia():
    return placa('triangulo-invertido', 0.95, 0.83, T.face_preferencia())


def p_vel(v):
    return lambda: placa('circulo', 0.75, 0.75, T.face_velocidade(v))


def p_sentido_proibido():
    return placa('circulo', 0.75, 0.75, T.face_sentido_proibido())


def p_proibido_estacionar():
    return placa('circulo', 0.75, 0.75, T.face_proibido_estacionar())


def p_pedestres():
    return placa('losango', 0.90, 0.90, T.face_pedestres())


def p_sentido_obrigatorio():
    return placa('circulo', 0.75, 0.75, T.face_sentido_obrigatorio())


def p_rua(texto, cor=T.VERDE):
    return lambda: placa('retangulo', 1.10, 0.275, T.face_rua(texto, cor), cy=2.45, altura=2.6)


PECAS = {
    'placa-pare': (p_pare, 'Placa PARE (R-1): octógono vermelho'),
    'placa-de-a-preferencia': (p_preferencia, 'Placa Dê a preferência (R-2): triângulo invertido'),
    'placa-velocidade-40': (p_vel(40), 'Velocidade máxima 40 km/h (R-19)'),
    'placa-velocidade-60': (p_vel(60), 'Velocidade máxima 60 km/h (R-19)'),
    'placa-sentido-proibido': (p_sentido_proibido, 'Sentido proibido (R-3): círculo vermelho com barra branca'),
    'placa-proibido-estacionar': (p_proibido_estacionar, 'Proibido estacionar (R-6a)'),
    'placa-pedestres': (p_pedestres, 'Passagem de pedestres (A-32b): losango amarelo'),
    'placa-sentido-obrigatorio': (p_sentido_obrigatorio, 'Siga em frente (sentido obrigatório): círculo azul com seta'),
    'placa-rua': (p_rua('RUA EXEMPLO'), 'Placa de nome de rua (verde, texto "RUA EXEMPLO"; troque o texto em placas.p_rua)'),
    'placa-rua-hryz': (p_rua('RUA HRYZ', T.AZUL), 'Placa de rua azul com "RUA HRYZ" (marca do canal dentro do cenário)'),
}
