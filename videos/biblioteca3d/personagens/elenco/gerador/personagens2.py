"""Segundo elenco: adolescentes de 16 anos, adultos (homem, mãe, pai de terno, policial) e a Dona Lurdes de luto.
Mesma estrutura de personagens.py: cada função devolve (esqueleto, superfície, paleta, extras). Rostos genéricos (nenhum se parece com pessoa real)."""
import math
import numpy as np
import esq as E
import cabeca as C
import corpo as Cp
import cabelo as H
import tecidos as T
import personagens as P0
from personagens import paleta_rosto, finalizar, base_personagem, zipper, bolso, gola_redonda, alinhar_hem, sujo
from forma import Superficie, loft, tubo, elipsoide, osso, nos, caminho, ruido3, unit, X_, Y_, Z_

# adolescente de 16 anos: ~1,70 m, ombros e tronco ainda estreitos, cabeça quase de adulto
TEEN = dict(perna=0.93, tronco=0.93, braco=0.94, pescoco=0.96, cabeca=0.99, ombros=0.90, quadril=0.90, pe=0.97)
TEEN_CORPO = dict(k_braco=0.86, k_perna=0.88, k_peito=0.94, k_ombro=0.93, k_cintura=0.96, k_mao=0.98)
FACE_TEEN = dict(res=2.0, sx=1.08, sz=1.04, olho_r=0.0138, olho_fundo=0.52, olho_x=0.0322, lid_aberta=32, iris=0.58, rubor=0.18, nariz_comp=0.0125, nariz_larg=0.0088, nariz_ponta=0.0078,
                 boca_larg=0.0250, labio=0.0042, sorriso0=0.003, sobr_esp=0.0052, dente_tam=0.95, dentes=6, bochecha=0.004)


def lin(h):
    """cor sRGB (#rrggbb) -> linear (para pintar por vértice, como o glTF exige)"""
    c = np.array([int(h.lstrip('#')[i:i + 2], 16) / 255.0 for i in (0, 2, 4)])
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def cor_terno(cp, jaqueta, camisa, gravata, t_v=0.50):
    """pinta no tronco de terno o V da camisa e a gravata (a malha da jaqueta é fechada; o material-base é branco)"""
    J, Cm, G = lin(jaqueta), lin(camisa), lin(gravata)

    def f(P, N, s):
        sm = lambda a, b, x: np.clip((x - a) / (b - a), 0, 1) ** 2 * (3 - 2 * np.clip((x - a) / (b - a), 0, 1))
        out = np.tile(J, (len(P), 1))
        frente = sm(0.15, 0.55, N[:, 2])
        hw = 0.052 * np.clip((s - t_v) / (0.98 - t_v), 0, 1.15) + 0.0005
        v = (1 - sm(hw * 0.8, hw * 1.15 + 0.004, np.abs(P[:, 0]))) * frente * (s > t_v - 0.02)
        out = out * (1 - v[:, None]) + Cm * v[:, None]
        gv = (1 - sm(0.007, 0.012, np.abs(P[:, 0]))) * frente * (s > t_v - 0.12) * (s < 0.93)
        gv *= 1 - sm(0.90, 0.94, s) * 0.0
        out = out * (1 - gv[:, None]) + G * gv[:, None]
        return out
    return f


# ---------------------------------------------------------------------------------------------------- Jovem A (moletom verde-azulado)
def jovem_a():
    e, cab, cp, S, _ = base_personagem(TEEN, dict(FACE_TEEN, nariz_comp=0.0135, sobr_esp=0.0056, olheira=0.05), TEEN_CORPO)
    pal = paleta_rosto('#d6a07a', iris='#3a2412', sobr='#1b120b')
    pal.update({'cabelo': ('#15110e', .8), 'moletom': ('#2a8c86', .9), 'mol_barra': ('#1f716c', .92), 'mol_bolso': ('#257d78', .92), 'cordao': ('#eeeeee', .8),
                'jeans': dict(cor='#ffffff', rug=.9, textura=T.jeans((66, 94, 140)), repete=True), 'jeans_punho': ('#4a6892', .9),
                'tenis': ('#f2f2f2', .7), 'sola': ('#e6e6e6', .7), 'tenis_det': ('#1b1b1f', .7)})
    yh, yf = alinhar_hem(cp, -0.30, 0.08)
    cp.casca_torso(S, -0.30, 0.98, 1.17, 0.011, lambda t: 'mol_barra' if t < -0.20 else 'moletom', n_an=26, y_hem_seguir=(yh, yf), gola=(0.022, 0.016),
                   flare=lambda t: (0.006, 0.006) if t < -0.2 else (0, 0))
    cp.capuz(S, 'moletom', tam=1.0)
    bolso(S, e, cp, 'mol_bolso', t=0.06, larg=0.060, alt=0.026, off=0.012)
    c, rx, rz = cp.torso(0.96)
    for sg in (-1.0, 1.0):
        pts = [c + np.array([sg * 0.030, 0.0, rz * 1.17 + 0.011 + 0.006]), c + np.array([sg * 0.034, -0.05, rz * 1.17 + 0.014]), c + np.array([sg * 0.036, -0.12, rz * 1.17 + 0.010])]
        tubo(S, pts, 0.0034, osso(e.nb, e.idx, Peito=1), 'cordao', nseg=6, sub=3, fecha=(True, True))
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 2.04, 1.20, 0.010, lambda s: 'mol_barra' if s >= 1.86 else 'moletom', n_an=18)
        cp.mao(S, lado)
        cp.membro(S, 'perna', lado, -0.12, 2.12, 1.14, 0.007, lambda s: 'jeans_punho' if 1.93 <= s < 2.06 else 'jeans', uv=(0.12, 0.12), n_an=18)
        cp.sapato(S, lado, 'tenis', 'tenis', 'sola', 'tenis_det')
    hl = lambda th: 0.78 - 0.16 * (1 - math.exp(-(th / 1.2) ** 2)) - 0.12 * (abs(th) > 2.2)
    H.touca(S, cab, 'cabelo', borda=hl, grossura=0.007)
    H.tufos_aleatorios(S, cab, 'cabelo', 60, (0.74, 0.99), (-3.1, 3.1), (0.011, 0.022), 0.0088, up=0.6, lado=0.4, sementes=61, evitar_frente=0.0, u_min_fn=lambda th: hl(th) + 0.015)
    H.tufos_aleatorios(S, cab, 'cabelo', 14, (0.86, 0.95), (-0.8, 0.8), (0.022, 0.034), 0.0092, up=0.8, lado=0.0, sementes=62)       # topete
    return e, S, pal, finalizar(cab, {'nome': 'Jovem A', 'papel': 'adolescente', 'idade': 16}, {'parado': {'T': 3.4, 'inquieto': 1.2, 'sway': 0.012}, 'andar': {'quica': 1.2}})


# ---------------------------------------------------------------------------------------------------- Jovem B (jaqueta vermelha de time)
def jovem_b():
    e, cab, cp, S, _ = base_personagem(TEEN, dict(FACE_TEEN, sx=1.05, nariz_comp=0.0125, nariz_larg=0.0086, boca_larg=0.0262, rubor=0.28, sobr_esp=0.0048),
                                       dict(TEEN_CORPO, k_peito=0.96, k_ombro=0.95))
    pal = paleta_rosto('#f0c9ab', labio='#c27971', iris='#4d6b4a', sobr='#4a2f1b')
    pal.update({'cabelo': ('#4b2e1a', .85), 'jaqueta': ('#bb3430', .75), 'jaq_barra': ('#f0f0f0', .85), 'jaq_gola': ('#f0f0f0', .85), 'jaq_faixa': ('#f0f0f0', .8), 'zip': ('#c9ced6', .35, .6),
                'jeans': dict(cor='#ffffff', rug=.9, textura=T.jeans((38, 40, 50)), repete=True), 'jeans_punho': ('#2a2c35', .9),
                'tenis': ('#f6f6f6', .7), 'sola': ('#bb3430', .7), 'tenis_det': ('#bb3430', .7)})
    yh = cp.torso(-0.30)[0][1]
    yf = cp.torso(0.08)[0][1]
    cp.casca_torso(S, -0.30, 0.98, 1.15, 0.010, lambda t: 'jaq_barra' if t < -0.20 else 'jaqueta', n_an=26, y_hem_seguir=(yh, yf), gola=(0.026, 0.012),
                   flare=lambda t: (0.012 * max(0.0, (-0.05 - t) / 0.25), 0.008 * max(0.0, (-0.05 - t) / 0.25)))
    zipper(S, e, cp, 'zip', -0.28, 0.99, 1.15, 0.010)
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 2.04, 1.17, 0.008, lambda s: 'jaq_barra' if s >= 1.84 else ('jaq_faixa' if 0.60 <= s <= 0.74 else 'jaqueta'), n_an=18)
        cp.mao(S, lado)
        cp.membro(S, 'perna', lado, -0.12, 2.12, 1.10, 0.006, lambda s: 'jeans_punho' if 1.93 <= s < 2.06 else 'jeans', uv=(0.12, 0.12), n_an=18)
        cp.sapato(S, lado, 'tenis', 'tenis', 'sola', 'tenis_det')
    H.touca(S, cab, 'cabelo', borda=lambda th: 0.80 - 0.20 * (1 - math.exp(-(th / 1.2) ** 2)) - 0.1 * (abs(th) > 2.3), grossura=0.006)
    H.afro(S, cab, 'cabelo', n=74, tam=(0.013, 0.021), sementes=9, raio_extra=0.011, achata=0.95)
    return e, S, pal, finalizar(cab, {'nome': 'Jovem B', 'papel': 'adolescente', 'idade': 16}, {'parado': {'T': 3.7, 'inquieto': 1.0, 'sway': 0.014}, 'andar': {'quica': 1.15}})


# ---------------------------------------------------------------------------------------------------- Jovem C (jaqueta azul-marinho, óculos)
def jovem_c():
    e, cab, cp, S, _ = base_personagem(dict(TEEN, tronco=0.94, ombros=0.92), dict(FACE_TEEN, sx=1.08, sz=1.05, mand=0.003, olho_r=0.0132, nariz_comp=0.0150, nariz_larg=0.0098, nariz_ponta=0.0086,
                                                                              boca_larg=0.0268, labio=0.0050, rubor=0.10, sobr_esp=0.0060, sobr_larg=0.038),
                                       dict(TEEN_CORPO, k_peito=1.0, k_ombro=0.96))
    pal = paleta_rosto('#8b5a3b', labio='#7d453d', iris='#2c1a0e', sobr='#140e09')
    pal.update({'cabelo': ('#0f0c0a', .6), 'puffer': ('#27375f', .75), 'puffer_sulco': ('#1a2646', .8), 'puffer_gola': ('#1a2646', .85), 'zip': ('#e0e3ea', .4, .5),
                'jogger': ('#70747d', .85), 'tenis': ('#d9cfbd', .7), 'sola': ('#f4f1ea', .7), 'tenis_det': ('#2b2b30', .7), 'aro': ('#17171b', .45, .2)})
    yh, yf = alinhar_hem(cp, -0.30, 0.08)
    seg = lambda t: 0.5 + 0.5 * math.cos((t + 0.30) / 1.28 * 2 * math.pi * 4.0)
    cp.casca_torso(S, -0.30, 0.98, 1.20, 0.013, lambda t: 'puffer_sulco' if seg(t) > 0.93 else 'puffer', n_an=44, y_hem_seguir=(yh, yf), gola=(0.026, 0.016),
                   perfil_extra=lambda t: 1 + 0.030 * (1 - seg(t)), flare=None)
    zipper(S, e, cp, 'zip', -0.28, 0.99, 1.20, 0.013)
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 2.04, 1.22, 0.011, lambda s: 'puffer_sulco' if (abs(((s - 0.1) % 0.42) - 0.0) < 0.05 or s >= 1.86) else 'puffer', n_an=26,
                  extra=lambda ss: 1 + 0.045 * (0.5 + 0.5 * np.cos((ss - 0.1) / 0.42 * 2 * np.pi)))
        cp.mao(S, lado)
        cp.membro(S, 'perna', lado, -0.12, 2.12, 1.10, 0.006, 'jogger', n_an=16)
        cp.sapato(S, lado, 'tenis', 'tenis', 'sola', 'tenis_det')
    hl = lambda th: 0.80 - 0.14 * (1 - math.exp(-(th / 1.1) ** 2)) - 0.10 * (abs(th) > 2.3)
    H.touca(S, cab, 'cabelo', borda=hl, grossura=0.0045)
    H.tufos_aleatorios(S, cab, 'cabelo', 90, (0.74, 0.99), (-3.1, 3.1), (0.006, 0.011), 0.0050, up=0.4, lado=0.3, sementes=91, evitar_frente=0.0, u_min_fn=lambda th: hl(th) + 0.02)
    H.oculos(S, cab, 'aro', raio=0.0172, espessura=0.0022)
    return e, S, pal, finalizar(cab, {'nome': 'Jovem C', 'papel': 'adolescente', 'idade': 16}, {'parado': {'T': 3.9, 'inquieto': 0.9, 'sway': 0.010}, 'andar': {'quica': 1.05}})


# ---------------------------------------------------------------------------------------------------- Homem (adulto de meia-idade, reconstituição genérica)
def homem():
    e, cab, cp, S, _ = base_personagem(
        dict(perna=0.99, tronco=1.0, braco=1.0, pescoco=1.04, cabeca=1.0, ombros=1.0, quadril=1.0, pe=1.0, curva=0.05),
        dict(res=2.0, sx=1.0, sz=1.02, mand=0.004, bochecha=0.003, queixo=0.002, olho_r=0.0124, olho_fundo=0.72, olho_x=0.0312, lid_aberta=28, iris=0.52, nariz_comp=0.021, nariz_larg=0.0108,
             nariz_ponta=0.0092, boca_larg=0.0285, labio=0.0036, sobr_esp=0.0070, sobr_larg=0.038, dentes=6, barba=0.55, olheira=0.35, rugas_testa=1, rugas_olho=1, rugas_nariz=0.7),
        dict(k_braco=0.98, k_perna=0.98, k_peito=1.02, k_ombro=1.0, k_quad=1.06, k_barriga=0.030, k_mao=1.04))
    pal = paleta_rosto('#c69a74', labio='#8f5a52', iris='#2a1a10', sobr='#17110c')
    pal.update({'cabelo': ('#17120f', .6), 'jeans_plano': ('#2c3550', .9), 'camisa': ('#6d7280', .9), 'camisa_gola': ('#5f6471', .9), 'camisa_manga': ('#666b79', .9),
                'jeans': dict(cor='#ffffff', rug=.9, textura=T.jeans((44, 54, 78)), repete=True), 'jeans_punho': ('#323a52', .9),
                'tenis': ('#2a2b30', .7), 'sola': ('#d9d9d9', .7), 'tenis_det': ('#9a9aa2', .7)})
    yh, yf = alinhar_hem(cp, -0.30, 0.08)
    cp.casca_torso(S, -0.30, 0.98, 1.11, 0.007, lambda t: 'camisa_gola' if t > 0.95 else ('camisa' if t > -0.02 else 'jeans_plano'), n_an=40, y_hem_seguir=(yh, yf), gola=(0.020, 0.012))
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 1.12, 1.14, 0.007, lambda s: 'camisa_manga' if s > 1.0 else 'camisa', n_an=14, extra=lambda ss: 1 + 0.06 * np.clip((ss - 1.0) / 0.06, 0, 1) * np.clip((1.12 - ss) / 0.06, 0, 1))
        cp.membro(S, 'braco', lado, 1.06, 2.06, 1.0, 0.0, 'pele', n_an=12, fecha=(False, False))
        cp.mao(S, lado)
        cp.membro(S, 'perna', lado, -0.12, 2.12, 1.15, 0.007, lambda s: 'jeans_punho' if 1.94 <= s < 2.06 else 'jeans', uv=(0.12, 0.12), n_an=18)
        cp.sapato(S, lado, 'tenis', 'tenis', 'sola', 'tenis_det')
    H.touca(S, cab, 'cabelo', borda=lambda th: 0.84 - 0.30 * (1 - math.exp(-(th / 0.95) ** 2)) - 0.10 * (abs(th) > 2.3), grossura=0.0055)
    H.tufos_aleatorios(S, cab, 'cabelo', 46, (0.55, 0.97), (-3.1, 3.1), (0.012, 0.024), 0.0075, up=0.6, lado=0.45, sementes=71, evitar_frente=0.0,
                       u_min_fn=lambda th: 0.84 - 0.30 * (1 - math.exp(-(th / 0.95) ** 2)) + 0.03)
    return e, S, pal, finalizar(cab, {'nome': 'Homem', 'papel': 'adulto', 'idade': 45}, {
        'parado': {'T': 4.4, 'sway': 0.012, 'inquieto': 0.8},
        'andar': {'lean': 0.06, 'braco_amp': 0.30, 'quica': 0.9},
        'correr': {'lean': 0.30, 'braco_amp': 0.56, 'cab_pitch': 0.06},
        'fugir': None, 'assustado': {'agacha': 0.03}})


# ---------------------------------------------------------------------------------------------------- Mãe (vestido preto, colar de pérolas)
def mae():
    def extras(e, cab, cp):
        pts = [cab.couro(0.58, math.pi, 0.004)[0]]
        for t in (0.96, 0.84, 0.70, 0.56):
            c, rx, rz = cp.torso(t)
            pts.append(c + np.array([0.0, 0.0, -(rz * 1.15 + 0.012) - 0.020]))
        pts.append(pts[-1] + np.array([0.0, -0.085, -0.004]))
        return e.add_cadeia('CabM', 'Cabeca', pts)
    e, cab, cp, cn, S = None, None, None, None, None
    e, cab, cp, S, cn = base_personagem(
        dict(perna=0.92, tronco=0.91, braco=0.91, pescoco=0.92, cabeca=0.97, ombros=0.86, quadril=0.96, pe=0.92),
        dict(res=2.0, sx=1.02, sz=1.01, olho_r=0.0136, olho_fundo=0.55, olho_x=0.0314, lid_aberta=30, iris=0.58, nariz_comp=0.0140, nariz_larg=0.0088, nariz_ponta=0.0080, boca_larg=0.0255, labio=0.0052,
             sobr_esp=0.0042, sobr_larg=0.034, rubor=0.34, olheira=0.40, rugas_olho=1, dentes=6),
        dict(k_braco=0.82, k_perna=0.86, k_peito=1.0, k_ombro=0.90, k_cintura=0.92, k_quad=1.04, k_mao=0.90), ossos_extra=extras)
    pal = paleta_rosto('#d8a785', labio='#b05d5b', iris='#3b2515', sobr='#2a1a10')
    pal.update({'cabelo': ('#2a1a12', .7), 'vestido': ('#18181d', .9), 'vestido_barra': ('#111116', .9), 'meia': ('#1d1d22', .8), 'sapato': ('#0f0f12', .55), 'sola': ('#050506', .85), 'sapato_det': ('#202026', .6),
                'perola': ('#f6efe6', .25, .1)})
    yh, yf = alinhar_hem(cp, -0.30, 0.08)
    cp.casca_torso(S, 0.04, 0.98, 1.10, 0.006, 'vestido', n_an=24, gola=(0.018, 0.012), fecha=(True, False))
    y_topo = cp.torso(0.06)[0][1]
    y_barra = e.rep['CanelaE'][1] - 0.06
    cp.saia(S, y_topo, y_barra, 0.075, 'vestido', n_an=16, seguir=0.50, ease_topo=1.10, off_topo=0.008)
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 1.98, 1.12, 0.006, 'vestido', n_an=18)
        cp.mao(S, lado)
        cp.membro(S, 'perna', lado, 0.6, 2.12, 1.0, 0.003, 'meia', n_an=14, fecha=(True, False))
        cp.sapato(S, lado, 'sapatinho', 'sapato', 'sola', 'sapato_det')
    H.touca(S, cab, 'cabelo', borda=lambda th: 0.56 if abs(th) > 1.0 else (0.74 + 0.06 * (1 - math.exp(-(th / 0.7) ** 2))), grossura=0.0085)
    pts = e.cadeias['CabM']['pontos']
    rads = [(0.046, 0.022), (0.056, 0.030), (0.060, 0.032), (0.056, 0.030), (0.046, 0.022), (0.0, 0.0)]
    H.mecha_cadeia(S, e, cn, pts, rads, 'cabelo', nseg=22, n=3.0, fecha=(False, True))
    H.colar_perolas(S, e, 'perola')
    e.cadeias['CabM']['par'] = dict(rig=0.30, kq=1.6, torcao=0.25, damp=0.98, gust=0.14)
    return e, S, pal, finalizar(cab, {'nome': 'Mãe', 'papel': 'adulta', 'idade': 44, 'cadeias': {'CabM': cn}}, {'parado': {'T': 4.4, 'inquieto': 0.7, 'sway': 0.010}, 'andar': {'quica': 0.9}, 'fugir': None})


# ---------------------------------------------------------------------------------------------------- Pai (terno preto)
def pai():
    e, cab, cp, S, _ = base_personagem(
        dict(perna=1.02, tronco=1.02, braco=1.02, pescoco=1.04, cabeca=1.0, ombros=1.0, quadril=0.98, pe=1.02, curva=0.04),
        dict(res=2.0, sx=1.02, sz=1.03, mand=0.003, bochecha=0.002, olho_r=0.0123, olho_fundo=0.72, olho_x=0.0314, lid_aberta=26, iris=0.52, nariz_comp=0.0215, nariz_larg=0.0112, nariz_ponta=0.0094,
             boca_larg=0.0295, labio=0.0036, sobr_esp=0.0072, sobr_larg=0.040, barba=0.60, olheira=0.45, rugas_testa=2, rugas_olho=1, rugas_nariz=0.8, dentes=6),
        dict(k_braco=1.0, k_perna=1.0, k_peito=1.02, k_ombro=1.02, k_quad=1.02, k_barriga=0.016, k_mao=1.04))
    pal = paleta_rosto('#e1b595', iris='#3a2616', sobr='#2a2118')
    pal.update({'cabelo': ('#3a342f', .7), 'terno': ('#ffffff', .8), 'terno_manga': ('#17181d', .85), 'calca': ('#131418', .85), 'camisa_pulso': ('#f2f2f4', .8), 'gola_camisa': ('#f2f2f4', .8),
                'sapato': ('#0c0c0e', .5), 'sola': ('#050506', .85), 'sapato_det': ('#1d1d21', .6), 'aro': ('#2b2b30', .4, .3)})
    yh, yf = alinhar_hem(cp, -0.30, 0.08)
    cp.casca_torso(S, -0.30, 0.98, 1.13, 0.010, 'terno', n_an=52, nseg=72, y_hem_seguir=(yh, yf), gola=(0.026, 0.016), cor=cor_terno(cp, '#17181d', '#f2f2f4', '#0e0e12'),
                   flare=lambda t: (0.010, 0.008) if t < -0.12 else (0, 0))
    gola_redonda(S, e, cp, 'gola_camisa', t=0.985, folga=0.016, tub=0.0062)
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 2.0, 1.17, 0.010, 'terno_manga', n_an=18)
        cp.membro(S, 'braco', lado, 1.90, 2.06, 1.0, 0.0, 'camisa_pulso', n_an=3, fecha=(True, False))
        cp.mao(S, lado)
        cp.membro(S, 'perna', lado, -0.12, 2.12, 1.14, 0.008, 'calca', n_an=18)
        cp.sapato(S, lado, 'bota', 'sapato', 'sola', 'sapato_det', cano=False)
    H.touca(S, cab, 'cabelo', borda=lambda th: 0.80 - 0.26 * (1 - math.exp(-(th / 1.0) ** 2)) - 0.1 * (abs(th) > 2.3), grossura=0.0050)
    H.oculos(S, cab, 'aro', raio=0.0178, espessura=0.0018)
    return e, S, pal, finalizar(cab, {'nome': 'Pai', 'papel': 'adulto', 'idade': 48}, {
        'parado': {'T': 4.6, 'sway': 0.010, 'inquieto': 0.5, 'cab_pitch': 0.06},
        'andar': {'lean': 0.03, 'braco_amp': 0.22, 'quica': 0.8, 'v': 1.1}, 'correr': {'lean': 0.2}, 'fugir': None})


# ---------------------------------------------------------------------------------------------------- Policial
def policial():
    e, cab, cp, S, _ = base_personagem(
        dict(perna=1.02, tronco=1.02, braco=1.03, pescoco=1.06, cabeca=1.0, ombros=1.04, quadril=0.98, pe=1.03),
        dict(res=2.0, sx=1.03, sz=1.03, mand=0.007, queixo=0.003, olho_r=0.0122, olho_fundo=0.78, olho_x=0.0314, lid_aberta=26, iris=0.50, nariz_comp=0.0205, nariz_larg=0.0108, nariz_ponta=0.0092,
             boca_larg=0.0285, labio=0.0034, sobr_esp=0.0076, sobr_larg=0.040, sobr_incl=0.10, barba=0.25, rugas_testa=1, rugas_nariz=0.5, dentes=6),
        dict(k_braco=1.06, k_perna=1.02, k_peito=1.08, k_ombro=1.08, k_quad=1.04, k_mao=1.06))
    pal = paleta_rosto('#d7a47f', iris='#34261a', sobr='#1a130d')
    pal.update({'cabelo': ('#1a1410', .7), 'camisa': ('#1f2d4d', .8), 'camisa_gola': ('#192541', .8), 'calca': ('#1a2238', .85), 'cinto': ('#0a0a0c', .5, .1), 'coldre': ('#101012', .5), 'distintivo': ('#d9b24a', .3, .8),
                'bone': ('#141b2e', .75), 'bone_aba': ('#07080c', .35, .2), 'bone_faixa': ('#d9b24a', .4, .7), 'bota': ('#09090b', .5), 'sola': ('#030304', .85), 'bota_det': ('#18181c', .5), 'radio': ('#0d0d10', .5)})
    yh, yf = alinhar_hem(cp, -0.30, 0.08)
    cp.casca_torso(S, -0.30, 0.98, 1.13, 0.008, lambda t: 'camisa_gola' if t > 0.95 else 'camisa', n_an=30, y_hem_seguir=(yh, yf), gola=(0.022, 0.014))
    cp.casca_torso(S, -0.14, 0.04, 1.15, 0.016, 'cinto', n_an=6)                                              # cinto de utilidades
    c, rx, rz = cp.torso(-0.04)
    wq = osso(e.nb, e.idx, Quadril=1)
    elipsoide(S, c + np.array([-(rx * 1.15 + 0.014), -0.02, 0.01]), X_, Y_, Z_, 0.032, 0.085, 0.052, wq, 'coldre', aneis=8, nseg=16, n=2.4)       # coldre (lado direito)
    elipsoide(S, c + np.array([(rx * 1.15 + 0.012), -0.01, 0.0]), X_, Y_, Z_, 0.026, 0.05, 0.034, wq, 'coldre', aneis=7, nseg=14, n=2.4)          # porta-algemas
    c2, rx2, rz2 = cp.torso(0.62)
    elipsoide(S, c2 + np.array([0.060, 0.0, rz2 * 1.13 + 0.010]), X_, Y_, Z_, 0.017, 0.020, 0.004, osso(e.nb, e.idx, Peito=1), 'distintivo', aneis=6, nseg=12, n=2.2)  # distintivo
    c3, rx3, rz3 = cp.torso(0.86)
    elipsoide(S, c3 + np.array([0.075, 0.0, rz3 * 1.13 + 0.012]), X_, Y_, Z_, 0.020, 0.030, 0.012, osso(e.nb, e.idx, Peito=1), 'radio', aneis=6, nseg=12, n=2.4)          # rádio no peito
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 2.04, 1.19, 0.008, lambda s: 'camisa', n_an=18)
        cp.mao(S, lado)
        cp.membro(S, 'perna', lado, -0.12, 2.12, 1.16, 0.008, 'calca', n_an=18)
        cp.sapato(S, lado, 'bota', 'bota', 'sola', 'bota_det', cano=False)
    H.touca(S, cab, 'cabelo', borda=lambda th: 0.68 - 0.10 * (abs(th) > 1.0) - 0.1 * (abs(th) > 2.3), grossura=0.0035)
    # quepe: copa, faixa dourada e aba
    wc = osso(e.nb, e.idx, Cabeca=1)
    us = np.linspace(0.55, 1.0, 12)
    CC, RX, RZ = [], [], []
    for u in us:
        rx, rz, cz = cab.perfil(u)
        CC.append((0.0, cab.chin + u * cab.h + 0.014 * (u > 0.8), cz + 0.004))
        RX.append(rx + 0.017)
        RZ.append(rz + 0.017)
    loft(S, np.array(CC), np.array(RX), np.array(RZ), us, wc, 'bone', nseg=48, sub=3, frame=(X_, Z_), fecha=(False, True))
    rx, rz, cz = cab.perfil(0.58)
    K = 48
    th = 2 * np.pi * np.arange(K) / K
    pts = np.array([(math.sin(t) * (rx + 0.020), cab.chin + 0.58 * cab.h, cz + 0.004 + math.cos(t) * (rz + 0.020)) for t in th])
    loft(S, pts, np.full(K, 0.0075), np.full(K, 0.0075), np.zeros(K), lambda s_: wc, 'bone_faixa', sub=1, nseg=8, frame='toro', fechado=True)
    rx, rz, cz = cab.perfil(0.62)
    elipsoide(S, np.array([0.0, cab.chin + 0.60 * cab.h, cz + rz + 0.052]), X_, Y_, Z_, 0.066, 0.0060, 0.058, wc, 'bone_aba', aneis=6, nseg=18, n=2.6)
    return e, S, pal, finalizar(cab, {'nome': 'Policial', 'papel': 'policial', 'idade': 38}, {
        'parado': {'T': 4.4, 'sway': 0.010, 'inquieto': 0.5},
        'andar': {'lean': 0.04, 'braco_amp': 0.26, 'quica': 0.9, 'v': 1.2}, 'correr': {'lean': 0.26}, 'fugir': None})


# ---------------------------------------------------------------------------------------------------- Dona Lurdes de luto (mesmo modelo, roupa escura)
def velha_luto():
    e, S, pal, ex = P0.velha()
    pal['cardiga'] = dict(cor='#ffffff', rug=.95, textura=T.trico((36, 36, 42)), repete=True)
    pal['cardiga_barra'] = ('#222228', .95)
    pal['blusa'] = ('#e8e3d9', .85)
    pal['saia'] = ('#1c1c21', .9)
    pal['saia_barra'] = ('#16161a', .9)
    pal['botao'] = ('#35353c', .4)
    ex = dict(ex, nome='Dona Lurdes (luto)')
    return e, S, pal, ex
