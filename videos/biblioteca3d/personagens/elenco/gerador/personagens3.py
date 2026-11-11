"""Terceiro elenco: funcionária doméstica, entregador e bombeiro (cena do elevador). Rostos genéricos; nenhum representa pessoa real."""
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


def faxineira():
    """mulher de 53 anos, baixa, cabelo escuro em coque, túnica curta (até o quadril) azul-acinzentada, calça escura e sapato fechado"""
    e, cab, cp, S, _ = base_personagem(
        dict(perna=0.87, tronco=0.89, braco=0.88, pescoco=0.90, cabeca=0.96, ombros=0.86, quadril=0.98, pe=0.88, curva=0.06),
        dict(res=2.0, sx=1.03, sz=1.02, olho_r=0.0130, olho_fundo=0.60, olho_x=0.0310, lid_aberta=28, iris=0.56, nariz_comp=0.0135, nariz_larg=0.0085, nariz_ponta=0.0078,
             boca_larg=0.0245, labio=0.0062, sobr_esp=0.0040, sobr_larg=0.034, rubor=0.42, olheira=0.40, rugas_testa=0, rugas_olho=1, rugas_nariz=0.0, mancha=0.08, dentes=6),
        dict(k_braco=0.84, k_perna=0.88, k_peito=1.02, k_ombro=0.90, k_cintura=0.96, k_quad=1.08, k_barriga=0.012, k_mao=0.92))
    pal = paleta_rosto('#c9996f', labio='#b04a4c', iris='#3a2414', sobr='#241913')
    pal.update({'cabelo': dict(cor='#ffffff', rug=.88, textura=T.fios((70, 50, 38)), repete=True), 'tunica': ('#7f98ad', .85), 'tunica_gola': ('#6c869b', .85), 'calca': ('#2a2d36', .85), 'sapato': ('#141416', .6), 'sola': ('#060607', .85),
                'sapato_det': ('#232328', .6)})
    yh, yf = alinhar_hem(cp, -0.30, 0.08)
    mat_t = lambda t: 'calca' if t < 0.0 else ('tunica_gola' if t > 0.95 else 'tunica')
    bar = lambda t: (0.013 * max(0.0, 1.0 - abs(t - 0.03) / 0.09),) * 2
    cp.casca_torso(S, -0.30, 0.98, 1.12, 0.007, mat_t, n_an=48, y_hem_seguir=(yh, yf), gola=(0.020, 0.012), flare=bar)
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 1.70, 1.14, 0.006, 'tunica', n_an=16)
        cp.membro(S, 'braco', lado, 1.62, 2.06, 1.0, 0.0, 'pele', n_an=8, fecha=(False, False))
        cp.mao(S, lado)
        cp.membro(S, 'perna', lado, -0.12, 2.12, 1.12, 0.006, 'calca', n_an=18, fecha=(True, False))
        cp.sapato(S, lado, 'sapatinho', 'sapato', 'sola', 'sapato_det')
    H.touca(S, cab, 'cabelo', borda=lambda th: 0.43 + 0.28 * math.exp(-(th / 0.80) ** 2), grossura=0.0050)
    H.coque(S, cab, 'cabelo', r=0.040, u=0.80, th=math.pi, deslocar=0.014)
    return e, S, pal, finalizar(cab, {'nome': 'Funcionária doméstica', 'papel': 'adulta', 'idade': 53}, {
        'parado': {'T': 4.4, 'inquieto': 0.8, 'sway': 0.010}, 'andar': {'quica': 0.9, 'braco_amp': 0.28}, 'fugir': None, 'assustado': {'agacha': 0.03}})


def _bone(S, cab, e, mat_c, mat_aba):
    """boné: copa acima das sobrancelhas (u = 0.585) e aba curta levemente inclinada para baixo"""
    wc = osso(e.nb, e.idx, Cabeca=1)
    us = np.linspace(0.615, 1.0, 12)
    CC, RX, RZ = [], [], []
    for u in us:
        rx, rz, cz = cab.perfil(u)
        CC.append((0.0, cab.chin + u * cab.h + 0.010 * (u > 0.8), cz + 0.002))
        RX.append(rx + 0.014)
        RZ.append(rz + 0.014)
    loft(S, np.array(CC), np.array(RX), np.array(RZ), us, wc, mat_c, nseg=48, sub=3, frame=(X_, Z_), fecha=(False, True))
    rx, rz, cz = cab.perfil(0.64)
    a = 0.16
    Yb = np.array([0.0, math.cos(a), math.sin(a)])
    Zb = np.array([0.0, -math.sin(a), math.cos(a)])
    elipsoide(S, np.array([0.0, cab.chin + 0.625 * cab.h, cz + rz + 0.046]), X_, Yb, Zb, 0.056, 0.0045, 0.050, wc, mat_aba, aneis=6, nseg=18, n=2.4)


def entregador():
    """rapaz de uns 25 anos: boné, jaqueta laranja com faixa refletiva, calça escura, tênis e mochila"""
    e, cab, cp, S, _ = base_personagem(
        dict(perna=0.99, tronco=0.98, braco=0.99, pescoco=1.0, cabeca=0.99, ombros=0.97, quadril=0.95, pe=1.0),
        dict(res=2.0, sx=1.03, sz=1.02, olho_r=0.0128, olho_fundo=0.62, olho_x=0.0312, lid_aberta=30, iris=0.54, nariz_comp=0.0170, nariz_larg=0.0098, nariz_ponta=0.0086,
             boca_larg=0.0270, labio=0.0044, sobr_esp=0.0060, rubor=0.12, barba=0.25, dentes=6),
        dict(k_braco=0.94, k_perna=0.95, k_peito=1.0, k_ombro=1.0, k_mao=1.0))
    pal = paleta_rosto('#9a6a47', iris='#2a1a10', sobr='#17110c')
    pal.update({'cabelo': ('#15110e', .6), 'jaqueta': ('#df7f18', .75), 'jaq_sulco': ('#b8660f', .8), 'refl': ('#dcdcd2', .45, .3), 'calca': ('#23262e', .85), 'tenis': ('#e6e6e6', .7), 'sola': ('#1a1a1c', .7),
                'tenis_det': ('#1a1a1c', .7), 'bone': ('#1d2a46', .75), 'bone_aba': ('#0e1626', .5), 'mochila': ('#1c1c20', .8), 'mochila_det': ('#2e2e34', .8), 'zip': ('#e0e3ea', .4, .5)})
    yh, yf = alinhar_hem(cp, -0.30, 0.08)
    seg = lambda t: 0.5 + 0.5 * math.cos((t + 0.30) / 1.28 * 2 * math.pi * 3.2)
    mat_j = lambda t: 'calca' if t < -0.01 else ('jaq_sulco' if t < 0.07 else ('refl' if abs(t - 0.40) < 0.045 else ('jaq_sulco' if seg(t) > 0.93 else 'jaqueta')))
    bar = lambda t: (0.011 * max(0.0, 1.0 - abs(t - 0.03) / 0.07),) * 2
    cp.casca_torso(S, -0.30, 0.98, 1.17, 0.012, mat_j, n_an=56, y_hem_seguir=(yh, yf), gola=(0.026, 0.016), flare=bar)
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 2.04, 1.19, 0.010, lambda s: 'refl' if abs(s - 1.30) < 0.06 else ('jaq_sulco' if s >= 1.86 else 'jaqueta'), n_an=24)
        cp.mao(S, lado)
        cp.membro(S, 'perna', lado, -0.12, 2.12, 1.10, 0.006, 'calca', n_an=18)
        cp.sapato(S, lado, 'tenis', 'tenis', 'sola', 'tenis_det')
    H.touca(S, cab, 'cabelo', borda=lambda th: 0.60 - 0.12 * (abs(th) > 1.2) - 0.06 * (abs(th) > 2.4), grossura=0.0050)
    _bone(S, cab, e, 'bone', 'bone_aba')
    H.mochila(S, e, cp, 'mochila', 'mochila_det', tam=0.95)
    return e, S, pal, finalizar(cab, {'nome': 'Entregador', 'papel': 'adulto', 'idade': 25}, {
        'parado': {'T': 3.8, 'inquieto': 1.0, 'sway': 0.012}, 'andar': {'quica': 1.1, 'braco_amp': 0.32}, 'correr': {'lean': 0.26, 'braco_amp': 0.52}, 'fugir': None})


def bombeiro():
    """bombeiro: capacete amarelo, casaco escuro com faixas refletivas até a coxa, calça de proteção e botas"""
    e, cab, cp, S, _ = base_personagem(
        dict(perna=1.02, tronco=1.02, braco=1.03, pescoco=1.06, cabeca=1.0, ombros=1.04, quadril=0.98, pe=1.03),
        dict(res=2.0, sx=1.03, sz=1.03, mand=0.007, queixo=0.003, olho_r=0.0122, olho_fundo=0.78, olho_x=0.0314, lid_aberta=26, iris=0.50, nariz_comp=0.0205, nariz_larg=0.0108,
             nariz_ponta=0.0092, boca_larg=0.0285, labio=0.0034, sobr_esp=0.0076, sobr_larg=0.040, barba=0.30, rugas_testa=1, rugas_nariz=0.5, dentes=6),
        dict(k_braco=1.06, k_perna=1.04, k_peito=1.10, k_ombro=1.08, k_quad=1.06, k_mao=1.08))
    pal = paleta_rosto('#d4a07a', iris='#34261a', sobr='#1a130d')
    pal.update({'casaco': ('#2c2b2a', .85), 'casaco_gola': ('#222120', .85), 'refl': ('#e6d548', .45, .25), 'calca': ('#2a2928', .85), 'bota': ('#0c0c0d', .55), 'sola': ('#050505', .85),
                'bota_det': ('#1a1a1c', .5), 'capacete': ('#e8c52a', .45, .2), 'capacete_aba': ('#101010', .5), 'cabelo': ('#1a1410', .7)})
    yh, yf = alinhar_hem(cp, -0.30, 0.08)
    mat_t = lambda t: 'casaco_gola' if t > 0.95 else ('refl' if (abs(t - 0.02) < 0.032 or abs(t - 0.30) < 0.032) else 'casaco')
    cp.casca_torso(S, -0.30, 0.98, 1.20, 0.012, mat_t, n_an=52, y_hem_seguir=(yh, yf), gola=(0.026, 0.016))
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 2.04, 1.22, 0.012, lambda s: 'refl' if (abs(s - 1.25) < 0.05 or abs(s - 1.7) < 0.05) else 'casaco', n_an=24)
        cp.mao(S, lado)
        cp.membro(S, 'perna', lado, -0.12, 2.12, 1.20, 0.012, lambda s: 'refl' if abs(s - 1.55) < 0.05 else 'calca', n_an=18)
        cp.sapato(S, lado, 'bota', 'bota', 'sola', 'bota_det', cano=False)
    wc = osso(e.nb, e.idx, Cabeca=1)
    us = np.linspace(0.60, 1.0, 12)
    CC, RX, RZ = [], [], []
    for u in us:
        rx, rz, cz = cab.perfil(u)
        CC.append((0.0, cab.chin + u * cab.h + 0.020 * (u > 0.75), cz + 0.002))
        RX.append(rx + 0.021)
        RZ.append(rz + 0.021)
    loft(S, np.array(CC), np.array(RX), np.array(RZ), us, wc, 'capacete', nseg=48, sub=3, frame=(X_, Z_), fecha=(False, True))
    rx, rz, cz = cab.perfil(0.64)
    a = 0.10
    Yb = np.array([0.0, math.cos(a), math.sin(a)])
    Zb = np.array([0.0, -math.sin(a), math.cos(a)])
    elipsoide(S, np.array([0.0, cab.chin + 0.640 * cab.h, cz - rz - 0.052]), X_, Y_, Z_, 0.088, 0.006, 0.078, wc, 'capacete_aba', aneis=6, nseg=18, n=2.4)       # aba comprida atrás
    elipsoide(S, np.array([0.0, cab.chin + 0.640 * cab.h, cz + rz + 0.036]), X_, Yb, Zb, 0.066, 0.005, 0.036, wc, 'capacete_aba', aneis=6, nseg=16, n=2.4)       # aba curta na frente
    return e, S, pal, finalizar(cab, {'nome': 'Bombeiro', 'papel': 'bombeiro', 'idade': 35}, {
        'parado': {'T': 4.4, 'sway': 0.010, 'inquieto': 0.5}, 'andar': {'lean': 0.05, 'braco_amp': 0.28, 'quica': 0.9, 'v': 1.25}, 'correr': {'lean': 0.30, 'braco_amp': 0.5}, 'fugir': None})
