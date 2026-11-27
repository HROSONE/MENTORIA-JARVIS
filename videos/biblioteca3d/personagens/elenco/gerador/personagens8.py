"""Oitavo elenco: açougueiro (vídeo do boi). Rosto genérico; não representa pessoa real.
Roupa de açougue/frigorífico: jaleco branco de manga comprida com gola, avental de PVC na frente (do peito ao joelho), calça branca,
botas brancas de borracha de cano alto, touca branca cobrindo o cabelo, luva de malha de aço na mão de apoio (esquerda) e a chaira
(afiador) pendurada no cinto do lado direito."""
import math
import numpy as np
import cabelo as H
from personagens import paleta_rosto, finalizar, base_personagem, alinhar_hem
from forma import elipsoide, osso, X_, Y_, Z_


def acougueiro():
    """açougueiro, uns 50 anos, bigode, corpo forte"""
    e, cab, cp, S, _ = base_personagem(
        dict(perna=0.98, tronco=1.03, braco=1.03, pescoco=0.98, cabeca=1.0, ombros=1.07, quadril=1.04, pe=1.04),
        dict(res=2.0, sx=1.06, sz=1.04, mand=0.010, queixo=0.002, olho_r=0.0122, olho_fundo=0.74, olho_x=0.0314, lid_aberta=26, iris=0.50, nariz_comp=0.0205, nariz_larg=0.0122,
             nariz_ponta=0.0102, boca_larg=0.0290, labio=0.0034, sobr_esp=0.0078, sobr_larg=0.040, barba=0.75, rugas_testa=1, rugas_olho=1, rugas_nariz=0.6, rubor=0.35, dentes=6),
        dict(k_braco=1.10, k_perna=1.05, k_peito=1.10, k_ombro=1.09, k_cintura=1.10, k_quad=1.06, k_barriga=0.030, k_mao=1.10))
    pal = paleta_rosto('#c48a64', iris='#3a2a1a', sobr='#3b3b3b')
    pal.update({'jaleco': ('#f2f3f1', .8), 'jaleco_gola': ('#e9ebe8', .8), 'botao': ('#d8dad6', .4),
                'avental': ('#dfe8ee', .32), 'avental_borda': ('#c9d6df', .35), 'calca': ('#eceeeb', .85),
                'bota': ('#f0f0ec', .30), 'sola': ('#b9bdb8', .6), 'bota_det': ('#e2e3df', .35),
                'malha': ('#a9aeb3', .35, .9), 'chaira': ('#c5c9cd', .22, 1.0), 'cabo': ('#1c1c1e', .5),
                'cinto': ('#2b2622', .6), 'touca': ('#f7f7f5', .9), 'cabelo': ('#4a4643', .7)})
    yh, yf = alinhar_hem(cp, -0.30, 0.08)
    # jaleco: tronco inteiro branco, gola alta, barra um pouco aberta (como jaleco)
    bar = lambda t: (0.016 * max(0.0, (-0.10 - t) / 0.20),) * 2
    cp.casca_torso(S, -0.30, 0.98, 1.14, 0.012, lambda t: 'jaleco_gola' if t > 0.95 else 'jaleco', n_an=44, nseg=56, y_hem_seguir=(yh, yf), gola=(0.030, 0.018), flare=bar)
    # avental de PVC: só a frente do tronco (o recorte tira as costas), do peito à cintura, por cima do jaleco
    c0, _, _ = cp.torso(0.4)
    recorte_costas = lambda cen: cen[:, 2] < c0[2] + 0.02
    cp.casca_torso(S, -0.30, 0.80, 1.17, 0.030, lambda t: 'avental_borda' if t > 0.76 else 'avental', n_an=36, nseg=56, y_hem_seguir=(yh, yf), recorte=recorte_costas)
    # parte de baixo do avental: painel na frente das coxas até o joelho (preso ao quadril)
    c, rx, rz = cp.torso(-0.30)
    wq = osso(e.nb, e.idx, Quadril=1)
    elipsoide(S, np.array([c[0], c[1] - 0.24, c[2] + rz * 1.17 + 0.05]), X_, Z_, Y_, rx * 1.22, 0.010, 0.27, wq, 'avental', aneis=12, nseg=28, n=3.0)
    # cinto e chaira (afiador) pendurada no lado direito
    cp.casca_torso(S, -0.13, -0.03, 1.15, 0.034, 'cinto', n_an=6)
    cc, rxc, rzc = cp.torso(-0.10)
    lado = np.array([-1.0, 0.0, 0.0])
    base = np.array([cc[0] - rxc * 1.2 - 0.02, cc[1] - 0.04, cc[2] - 0.02])
    elipsoide(S, base + np.array([0, -0.20, 0]), X_, Z_, Y_, 0.007, 0.007, 0.16, wq, 'chaira', aneis=8, nseg=12, n=2.0)       # haste de aço
    elipsoide(S, base + np.array([0, 0.03, 0]), X_, Z_, Y_, 0.016, 0.016, 0.06, wq, 'cabo', aneis=8, nseg=14, n=2.4)          # cabo preto
    elipsoide(S, base + np.array([0, -0.025, 0]), X_, Z_, Y_, 0.028, 0.028, 0.006, wq, 'cabo', aneis=6, nseg=14, n=2.0)       # guarda
    for ld in 'ED':
        cp.membro(S, 'braco', ld, -0.2, 2.04, 1.18, 0.012, lambda s: 'jaleco_gola' if s >= 1.86 else 'jaleco', n_an=26)
        cp.membro(S, 'perna', ld, -0.12, 2.12, 1.16, 0.010, 'calca', n_an=20)
        cp.sapato(S, ld, 'bota', 'bota', 'sola', 'bota_det', cano=True)
    cp.mao(S, 'E', mat='malha')                         # luva de malha de aço na mão de apoio
    cp.mao(S, 'D', mat='pele')
    # touca branca cobrindo todo o cabelo (com volume)
    H.touca(S, cab, 'cabelo', borda=lambda th: 0.66 - 0.08 * min(1.0, max(0.0, (abs(th) - 0.9) / 0.6)), grossura=0.0035)
    H.touca(S, cab, 'touca', borda=lambda th: 0.70 - 0.06 * min(1.0, max(0.0, (abs(th) - 1.2) / 0.6)), grossura=0.016)
    return e, S, pal, finalizar(cab, {'nome': 'Açougueiro', 'papel': 'acougueiro', 'idade': 50}, {
        'parado': {'T': 4.4, 'sway': 0.008, 'inquieto': 0.5}, 'andar': {'lean': 0.04, 'braco_amp': 0.24, 'quica': 0.9, 'v': 1.15}, 'correr': {'lean': 0.26, 'braco_amp': 0.45}, 'fugir': None})
