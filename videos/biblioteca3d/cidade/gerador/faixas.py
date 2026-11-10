"""Faixas pintadas avulsas (decalques planos, 0,012 m acima do asfalto), prontas para colar sobre qualquer trecho de rua.
Todas apontam para +Z como a frente dos carros; gire 90° em Y para usar em ruas na direção X."""
import math
from malha import Malha
from paleta import FAIXA_BRANCA, FAIXA_AMARELA
import ruas
from ruas import H, YF, LH, BORDA


def central_tracejada():
    m = Malha(); ruas.tracejado_central(m, ruas.Reto(), 0, ruas.TILE)
    return m


def central_dupla():
    m = Malha()
    for x in (-0.13, 0.13):
        m.top(FAIXA_AMARELA, x - 0.06, x + 0.06, -LH, LH, YF)
    return m


def borda():
    m = Malha(); ruas.linhas_de_borda(m, ruas.Reto(), 0, ruas.TILE)
    return m


def faixa_pedestres():
    """zebra de 7 listras (largura total = pista de 7 m), 3 m de comprimento ao longo de Z"""
    m = Malha()
    for c in range(-3, 4):
        m.top(FAIXA_BRANCA, c - 0.25, c + 0.25, -1.5, 1.5, YF)
    return m


def linha_retencao():
    """linha de retenção (0,4 m) na faixa da direita de quem anda para -Z (lado +X); gire 180° para o sentido oposto"""
    m = Malha(); m.top(FAIXA_BRANCA, 0.15, H - 0.15, -0.2, 0.2, YF)
    return m


def seta_frente():
    """seta de 3 m apontando para +Z; coloque no centro de uma faixa (x = ±1,75)"""
    m = Malha()
    m.top(FAIXA_BRANCA, -0.15, 0.15, -1.5, 0.1, YF)
    m.poly(FAIXA_BRANCA, [(-0.45, YF, 0.1), (0.45, YF, 0.1), (0.0, YF, 1.5)], (0, 1, 0))
    return m


PECAS = {
    'faixa-central-tracejada': (central_tracejada, 'Linha central amarela tracejada (3 m de traço, 3 m de vão), 12 m'),
    'faixa-central-dupla': (central_dupla, 'Linha central amarela dupla contínua (proibido ultrapassar), 12 m'),
    'faixa-borda': (borda, 'Linhas de borda brancas dos dois lados da pista, 12 m'),
    'faixa-pedestres': (faixa_pedestres, 'Faixa de pedestres (zebra) de 7 m x 3 m'),
    'linha-retencao': (linha_retencao, 'Linha de retenção (PARE) de uma faixa'),
    'seta-frente': (seta_frente, 'Seta de seguir em frente, 3 m, aponta para +Z'),
}
