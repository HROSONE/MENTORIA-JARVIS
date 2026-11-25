"""Sexto elenco: operador de máquinas de obra (escavadeira, retroescavadeira, pá carregadeira, rolo e basculante).
Rosto genérico; não representa pessoa real. Roupa de segurança do canteiro: capacete branco de aba curta, colete laranja de alta
visibilidade com duas faixas refletivas prateadas (por cima da camisa azul de manga comprida), calça de brim, luvas de raspa e botina."""
import math
import numpy as np
import cabelo as H
from personagens import paleta_rosto, finalizar, base_personagem, alinhar_hem
from forma import loft, elipsoide, osso, X_, Y_, Z_


def _capacete_obra(S, cab, e, mat, mat_aba):
    """capacete de segurança: casco alto com crista central e aba curta só na frente (modelo 'aba frontal')"""
    wc = osso(e.nb, e.idx, Cabeca=1)
    us = np.linspace(0.60, 1.0, 12)
    CC, RX, RZ = [], [], []
    for u in us:
        rx, rz, cz = cab.perfil(u)
        CC.append((0.0, cab.chin + u * cab.h + 0.026 * (u > 0.72), cz + 0.002))
        RX.append(rx + 0.019)
        RZ.append(rz + 0.022)
    loft(S, np.array(CC), np.array(RX), np.array(RZ), us, wc, mat, nseg=48, sub=3, frame=(X_, Z_), fecha=(False, True))
    rx, rz, cz = cab.perfil(0.90)
    elipsoide(S, np.array([0.0, cab.chin + 0.95 * cab.h + 0.020, cz]), X_, Y_, Z_, 0.012, 0.012, rz + 0.012, wc, mat, aneis=6, nseg=14, n=2.2)   # crista
    rx, rz, cz = cab.perfil(0.63)
    a = 0.22
    Yb = np.array([0.0, math.cos(a), math.sin(a)])
    Zb = np.array([0.0, -math.sin(a), math.cos(a)])
    elipsoide(S, np.array([0.0, cab.chin + 0.628 * cab.h, cz + rz + 0.030]), X_, Yb, Zb, 0.074, 0.005, 0.034, wc, mat_aba, aneis=6, nseg=18, n=2.4)   # aba da frente
    elipsoide(S, np.array([0.0, cab.chin + 0.640 * cab.h, cz - rz - 0.012]), X_, Y_, Z_, 0.070, 0.004, 0.016, wc, mat_aba, aneis=5, nseg=16, n=2.4)    # borda de trás


def operador():
    """operador de máquinas, uns 42 anos: capacete branco, colete laranja refletivo sobre camisa azul, calça de brim, luvas e botina"""
    e, cab, cp, S, _ = base_personagem(
        dict(perna=1.0, tronco=1.02, braco=1.02, pescoco=1.04, cabeca=1.0, ombros=1.05, quadril=1.0, pe=1.03),
        dict(res=2.0, sx=1.04, sz=1.03, mand=0.008, queixo=0.002, olho_r=0.0124, olho_fundo=0.72, olho_x=0.0312, lid_aberta=27, iris=0.52, nariz_comp=0.0195, nariz_larg=0.0112,
             nariz_ponta=0.0094, boca_larg=0.0282, labio=0.0036, sobr_esp=0.0072, sobr_larg=0.039, barba=0.55, rugas_testa=1, rugas_olho=1, rugas_nariz=0.4, rubor=0.25, dentes=6),
        dict(k_braco=1.05, k_perna=1.03, k_peito=1.08, k_ombro=1.07, k_cintura=1.04, k_quad=1.04, k_barriga=0.018, k_mao=1.08))
    pal = paleta_rosto('#b9825a', iris='#2b1d12', sobr='#1b140e')
    pal.update({'camisa': ('#2f4f7f', .85), 'camisa_gola': ('#284470', .85), 'colete': ('#ff6a13', .7), 'refl': ('#d9dde3', .35, .35), 'calca': ('#3a4a5e', .9),
                'luva': ('#5d5a4c', .9), 'bota': ('#5a3a22', .7), 'sola': ('#151210', .85), 'bota_det': ('#3e2817', .6),
                'capacete': ('#f4f4f0', .35, .1), 'capacete_aba': ('#e9e9e4', .4), 'cabelo': ('#2a1f17', .7)})
    yh, yf = alinhar_hem(cp, -0.30, 0.08)
    # tronco: colete laranja do quadril ao peito (duas faixas refletivas), camisa azul só na gola e nos ombros; calça abaixo da cintura
    mat_t = lambda t: ('calca' if t < -0.01 else ('camisa_gola' if t > 0.95 else ('camisa' if t > 0.86 else
                       ('refl' if (abs(t - 0.24) < 0.035 or abs(t - 0.52) < 0.035) else 'colete'))))
    bar = lambda t: (0.010 * max(0.0, 1.0 - abs(t - 0.03) / 0.08),) * 2
    cp.casca_torso(S, -0.30, 0.98, 1.17, 0.012, mat_t, n_an=56, y_hem_seguir=(yh, yf), gola=(0.024, 0.014), flare=bar)
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 2.04, 1.16, 0.010, lambda s: 'camisa_gola' if s >= 1.88 else 'camisa', n_an=24)
        cp.mao(S, lado, mat='luva')                                                                  # luva de raspa
        cp.membro(S, 'perna', lado, -0.12, 2.12, 1.14, 0.008, lambda s: 'refl' if abs(s - 1.60) < 0.04 else 'calca', n_an=18)
        cp.sapato(S, lado, 'bota', 'bota', 'sola', 'bota_det', cano=False)
    H.touca(S, cab, 'cabelo', borda=lambda th: 0.64 - 0.10 * min(1.0, max(0.0, (abs(th) - 0.9) / 0.6)), grossura=0.0040)   # na frente fica escondido no capacete; aparece nas têmporas e na nuca
    _capacete_obra(S, cab, e, 'capacete', 'capacete_aba')
    return e, S, pal, finalizar(cab, {'nome': 'Operador de máquinas', 'papel': 'operador', 'idade': 42}, {
        'parado': {'T': 4.2, 'sway': 0.010, 'inquieto': 0.6}, 'andar': {'lean': 0.04, 'braco_amp': 0.27, 'quica': 0.95, 'v': 1.22}, 'correr': {'lean': 0.28, 'braco_amp': 0.5}, 'fugir': None})
