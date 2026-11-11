"""Quarto elenco: soldado (farda verde-oliva e capacete de aço, sem insígnia de país) e aviador/cadete de pré-voo (gorro e jaqueta de couro, óculos na testa)."""
import math
import numpy as np
import esq as E
import cabeca as C
import corpo as Cp
import cabelo as H
import tecidos as T
import personagens as P0
from personagens import paleta_rosto, finalizar, base_personagem, alinhar_hem
from forma import Superficie, loft, tubo, elipsoide, osso, nos, caminho, unit, X_, Y_, Z_


def _capacete_aco(S, cab, e, mat, mat_borda, mat_tira):
    """capacete de aço redondo: cúpula, aba larga e tira no queixo"""
    wc = osso(e.nb, e.idx, Cabeca=1)
    us = np.linspace(0.585, 1.0, 14)
    CC, RX, RZ = [], [], []
    for u in us:
        rx, rz, cz = cab.perfil(u)
        CC.append((0.0, cab.chin + u * cab.h + 0.030 * (u > 0.70) + 0.010 * (u > 0.9), cz + 0.002))
        RX.append(rx + 0.020 + 0.010 * (u > 0.65))
        RZ.append(rz + 0.020 + 0.010 * (u > 0.65))
    loft(S, np.array(CC), np.array(RX), np.array(RZ), us, wc, mat, nseg=52, sub=3, frame=(X_, Z_), fecha=(False, True))
    rx, rz, cz = cab.perfil(0.60)
    elipsoide(S, np.array([0.0, cab.chin + 0.612 * cab.h, cz]), X_, Y_, Z_, rx + 0.050, 0.0055, rz + 0.056, wc, mat_borda, aneis=6, nseg=40, n=2.6)        # aba redonda
    for sg in (1.0, -1.0):                                                                                                                       # tira do queixo
        a, _ = cab.couro(0.58, sg * 1.45, 0.012)
        b = np.array([sg * 0.030, cab.chin - 0.012, cz + rz * 0.78])
        tubo(S, [a, (a + b) / 2 + np.array([sg * 0.012, 0.0, 0.01]), b], 0.0036, wc, mat_tira, nseg=6, sub=3, fecha=(True, True))
    tubo(S, [np.array([-0.030, cab.chin - 0.012, cz + rz * 0.78]), np.array([0.0, cab.chin - 0.020, cz + rz * 0.86]), np.array([0.030, cab.chin - 0.012, cz + rz * 0.78])], 0.0036, wc, mat_tira, nseg=6, sub=3, fecha=(True, True))


def soldado():
    e, cab, cp, S, _ = base_personagem(
        dict(perna=1.02, tronco=1.02, braco=1.03, pescoco=1.06, cabeca=1.0, ombros=1.04, quadril=0.98, pe=1.03),
        dict(res=2.0, sx=1.03, sz=1.03, mand=0.006, queixo=0.003, olho_r=0.0124, olho_fundo=0.75, olho_x=0.0314, lid_aberta=26, iris=0.52, nariz_comp=0.0195, nariz_larg=0.0104,
             nariz_ponta=0.0090, boca_larg=0.0280, labio=0.0036, sobr_esp=0.0068, sobr_larg=0.038, barba=0.22, rugas_nariz=0.2, dentes=6),
        dict(k_braco=1.06, k_perna=1.04, k_peito=1.08, k_ombro=1.08, k_quad=1.04, k_mao=1.06))
    pal = paleta_rosto('#cf9f7c', iris='#3a2a1a', sobr='#1d140d')
    pal.update({'cabelo': ('#1d1712', .8), 'farda': ('#5a5f3b', .92), 'farda_cos': ('#4a4f31', .94), 'calca': ('#575b3b', .92), 'cinto': ('#3a3326', .6, .1), 'fivela': ('#b79a49', .35, .8),
                'bota': ('#2b1d12', .6), 'sola': ('#0d0a07', .85), 'bota_det': ('#3b2a1a', .6), 'capacete': ('#4f5634', .55, .25), 'capacete_borda': ('#3f4529', .6, .2), 'tira': ('#3a3322', .8),
                'correia': ('#6b6546', .85), 'mochila': ('#5d5a3e', .88), 'mochila_det': ('#4b4932', .88)})
    yh, yf = alinhar_hem(cp, -0.30, 0.08)
    cp.casca_torso(S, -0.30, 0.98, 1.17, 0.012, lambda t: 'calca' if t < -0.10 else ('farda_cos' if t > 0.95 else 'farda'), n_an=50, y_hem_seguir=(yh, yf), gola=(0.026, 0.016),
                   flare=lambda t: (0.010 * max(0.0, 1 - abs(t - 0.02) / 0.10),) * 2)
    cp.casca_torso(S, -0.12, 0.00, 1.19, 0.020, 'cinto', n_an=6)
    c, rx, rz = cp.torso(-0.06)
    elipsoide(S, c + np.array([0.0, 0.0, rz * 1.19 + 0.022]), X_, Y_, Z_, 0.026, 0.020, 0.006, osso(e.nb, e.idx, Quadril=1), 'fivela', aneis=6, nseg=12, n=2.2)
    H.suspensorios(S, e, cp, 'correia', ease=1.19, off=0.016, largura=0.026)
    H.mochila(S, e, cp, 'mochila', 'mochila_det', tam=0.95)
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 2.04, 1.19, 0.012, 'farda', n_an=22)
        cp.mao(S, lado)
        cp.membro(S, 'perna', lado, -0.12, 2.10, 1.16, 0.010, 'calca', n_an=18)
        cp.sapato(S, lado, 'bota', 'bota', 'sola', 'bota_det')
    H.touca(S, cab, 'cabelo', borda=lambda th: 0.55 - 0.08 * (abs(th) > 1.4), grossura=0.0045)
    _capacete_aco(S, cab, e, 'capacete', 'capacete_borda', 'tira')
    return e, S, pal, finalizar(cab, {'nome': 'Soldado', 'papel': 'soldado', 'idade': 24}, {
        'parado': {'T': 4.0, 'sway': 0.008, 'inquieto': 0.4}, 'andar': {'lean': 0.05, 'braco_amp': 0.28, 'quica': 0.9, 'v': 1.25}, 'correr': {'lean': 0.30, 'braco_amp': 0.5}, 'fugir': None, 'assustado': {'agacha': 0.03}})


def aviador():
    e, cab, cp, S, _ = base_personagem(
        dict(perna=1.0, tronco=1.0, braco=1.0, pescoco=1.02, cabeca=1.0, ombros=1.0, quadril=0.97, pe=1.0),
        dict(res=2.0, sx=1.02, sz=1.02, mand=0.004, bochecha=0.003, olho_r=0.0126, olho_fundo=0.70, olho_x=0.0312, lid_aberta=28, iris=0.54, nariz_comp=0.0185, nariz_larg=0.0100,
             nariz_ponta=0.0088, boca_larg=0.0275, labio=0.0040, sobr_esp=0.0062, sobr_larg=0.036, barba=0.10, dentes=6),
        dict(k_braco=1.0, k_perna=1.0, k_peito=1.04, k_ombro=1.03, k_quad=1.02, k_mao=1.03))
    pal = paleta_rosto('#e0b08c', iris='#3a4a5a', sobr='#2a1d12')
    pal.update({'cabelo': ('#2a1d12', .8), 'jaqueta': ('#6a4326', .55, .08), 'jaq_barra': ('#4a2f1a', .8), 'la': ('#e2d8bf', .95), 'calca': ('#a99a74', .9), 'bota': ('#3a2616', .6), 'sola': ('#120c08', .85),
                'bota_det': ('#4a3220', .6), 'cap': ('#6b4a2c', .5, .06), 'cap_forro': ('#e2d8bf', .95), 'goggle_banda': ('#2a2a2a', .7), 'goggle_aro': ('#b79a49', .35, .8), 'goggle_vidro': ('#a9bcc4', .15, .4),
                'tira': ('#3a2a1a', .8)})
    yh, yf = alinhar_hem(cp, -0.30, 0.08)
    cp.casca_torso(S, -0.30, 0.98, 1.16, 0.012, lambda t: 'calca' if t < -0.10 else ('jaq_barra' if t < -0.04 else ('la' if t > 0.93 else 'jaqueta')), n_an=50, y_hem_seguir=(yh, yf), gola=(0.040, 0.030),
                   flare=lambda t: (0.010 * max(0.0, 1 - abs(t + 0.06) / 0.07),) * 2)
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 2.04, 1.18, 0.012, lambda s: 'jaq_barra' if s >= 1.86 else 'jaqueta', n_an=22)
        cp.mao(S, lado)
        cp.membro(S, 'perna', lado, -0.12, 2.10, 1.14, 0.008, 'calca', n_an=18)
        cp.sapato(S, lado, 'bota', 'bota', 'sola', 'bota_det')
    H.touca(S, cab, 'cabelo', borda=lambda th: 0.56 - 0.10 * (abs(th) > 1.3), grossura=0.0045)
    wc = osso(e.nb, e.idx, Cabeca=1)
    us = np.linspace(0.54, 1.0, 12)
    CC, RX, RZ = [], [], []
    for u in us:
        rx, rz, cz = cab.perfil(u)
        CC.append((0.0, cab.chin + u * cab.h + 0.012 * (u > 0.8), cz + 0.002))
        RX.append(rx + 0.016)
        RZ.append(rz + 0.016)
    loft(S, np.array(CC), np.array(RX), np.array(RZ), us, wc, 'cap', nseg=48, sub=3, frame=(X_, Z_), fecha=(False, True))
    rx0, rz0, cz0 = cab.perfil(0.56)
    for sg in (1.0, -1.0):                                                                                                                    # abas das orelhas, forradas de lã
        p, _ = cab.couro(0.50, sg * 1.50, 0.016)
        elipsoide(S, p + np.array([sg * 0.008, -0.048, 0.0]), X_, Y_, Z_, 0.012, 0.058, 0.044, wc, 'cap', aneis=6, nseg=14, n=2.2)
        elipsoide(S, p + np.array([sg * 0.001, -0.046, 0.0]), X_, Y_, Z_, 0.008, 0.052, 0.038, wc, 'cap_forro', aneis=5, nseg=12, n=2.2)
        b = np.array([sg * 0.026, cab.chin - 0.010, cz0 + rz0 * 0.80])
        tubo(S, [p + np.array([sg * 0.006, -0.090, 0.0]), (p + b) / 2 + np.array([sg * 0.006, -0.04, 0.02]), b], 0.0032, wc, 'tira', nseg=6, sub=3, fecha=(True, True))
    K = 48
    th = 2 * np.pi * np.arange(K) / K
    yb = cab.chin + 0.64 * cab.h
    rxb, rzb, czb = cab.perfil(0.64)
    pts = np.array([(math.sin(t) * (rxb + 0.020), yb, czb + 0.002 + math.cos(t) * (rzb + 0.020)) for t in th])
    loft(S, pts, np.full(K, 0.0060), np.full(K, 0.0060), np.zeros(K), lambda s_: wc, 'goggle_banda', sub=1, nseg=8, frame='toro', fechado=True)                    # tira dos óculos em volta do gorro
    for sg in (1.0, -1.0):
        c = np.array([sg * 0.034, yb + 0.002, czb + rzb + 0.030])
        elipsoide(S, c, X_, Y_, Z_, 0.031, 0.027, 0.014, wc, 'goggle_aro', aneis=7, nseg=18, n=2.4)
        elipsoide(S, c + np.array([0.0, 0.0, 0.006]), X_, Y_, Z_, 0.025, 0.021, 0.010, wc, 'goggle_vidro', aneis=6, nseg=16, n=2.2)
    return e, S, pal, finalizar(cab, {'nome': 'Aviador', 'papel': 'cadete', 'idade': 22}, {
        'parado': {'T': 4.2, 'sway': 0.008, 'inquieto': 0.4}, 'andar': {'lean': 0.04, 'braco_amp': 0.26, 'quica': 0.9, 'v': 1.2}, 'correr': {'lean': 0.28}, 'fugir': None, 'assustado': {'agacha': 0.03}})
