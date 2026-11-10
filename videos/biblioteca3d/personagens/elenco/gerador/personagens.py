"""Definição dos personagens do elenco: cada função devolve (esqueleto, superfície, paleta, extras)."""
import math
import numpy as np
import esq as E
import cabeca as C
import corpo as Cp
import cabelo as H
import tecidos as T
from forma import Superficie, loft, tubo, elipsoide, osso, nos, caminho, ruido3, unit, X_, Y_, Z_

CRIANCA = dict(perna=0.70, tronco=0.70, braco=0.72, pescoco=0.6, cabeca=0.98, ombros=0.82, quadril=0.82, pe=0.80)


def paleta_rosto(pele, labio='#b5655f', iris='#4a2e1c', esclera='#f4f1ea', sobr='#2f2016', dente='#f2ecd8', ruga=None):
    def esc(h, f):
        h = h.lstrip('#')
        return '#%02x%02x%02x' % tuple(int(int(h[i:i + 2], 16) * f) for i in (0, 2, 4))
    return {'pele': (pele, .65), 'labio': (labio, .5), 'olho': (esclera, .22), 'iris': (iris, .3), 'pupila': ('#08080a', .2), 'brilho': ('#ffffff', .1),
            'dente': (dente, .35), 'boca_dentro': ('#2a0c10', .9), 'lingua': ('#c7585c', .6), 'sobrancelha': (sobr, .9), 'ruga': (ruga or esc(pele, 0.74), .7), 'narina': ('#2a1612', .9)}


def finalizar(cab, extras, anim, cadeias=None):
    ex = dict(extras)
    ex['expressoes'] = C.expressoes(cab)
    ex['anim'] = anim
    return ex


def faixa(a, b, t):
    return a <= t < b


def base_personagem(esq_kw, cab_kw, corpo_kw, ossos_extra=None):
    e = E.Esq(**esq_kw)
    cab = C.Cabeca(e, **cab_kw)
    cab.rig()
    cp = Cp.Corpo(e, **corpo_kw)
    extra = ossos_extra(e, cab, cp) if ossos_extra else None
    S = Superficie(e.nb)
    cab.construir(S)
    cp.pescoco(S)
    return e, cab, cp, S, extra


def zipper(S, e, cp, mat, t0, t1, ease, off, esp=0.0042):
    ts = np.linspace(t0, t1, 22)
    pts = []
    for t in ts:
        c, rx, rz = cp.torso(t)
        pts.append(c + np.array([0.0, 0.0, rz * ease + off + 0.0012]))
    r = np.full(len(ts), esp)
    loft(S, np.array(pts), r, r * 0.8, ts, cp.pesos_torso(), mat, n=2.6, sub=1, nseg=10, frame=(X_, Z_), fecha=(True, True))


# ---------------------------------------------------------------------------------------------------- Davi
def davi():
    e, cab, cp, S, _ = base_personagem(
        CRIANCA,
        dict(sx=1.1, sz=1.04, olho_r=0.0176, olho_fundo=0.45, olho_x=0.033, lid_aberta=34, iris=0.6, rubor=0.55, nariz_comp=0.009, nariz_larg=0.0075, nariz_ponta=0.0072,
             boca_larg=0.021, labio=0.0038, sobr_esp=0.0044, dente_tam=0.9, dentes=6),
        dict(k_braco=0.74, k_perna=0.80, k_peito=0.93, k_ombro=0.96, k_mao=0.92))
    pal = paleta_rosto('#e3ae88', iris='#5b3a20', sobr='#33200f')
    pal.update({'cabelo': ('#3b2416', .85), 'jaqueta': ('#2e56a8', .8), 'jaq_barra': ('#1f3a73', .85), 'jaq_gola': ('#1f3a73', .85), 'jaq_faixa': ('#f2f2f2', .8), 'zip': ('#c9ced6', .35, .6),
                'jeans': dict(cor='#ffffff', rug=.9, textura=T.jeans((62, 92, 140)), repete=True), 'jeans_punho': ('#46688f', .9),
                'tenis': ('#f4f4f4', .7), 'sola': ('#d63a2f', .7), 'tenis_det': ('#d63a2f', .7)})
    # tronco: jaqueta de zíper com faixa e gola
    yh = cp.torso(-0.30)[0][1]
    yf = cp.torso(0.08)[0][1]
    cp.casca_torso(S, -0.30, 0.98, 1.14, 0.009, lambda t: 'jaq_barra' if t < -0.12 else 'jaqueta', n_an=26, flare=lambda t: (0.012 * max(0.0, (-0.05 - t) / 0.25), 0.008 * max(0.0, (-0.05 - t) / 0.25)),
                   y_hem_seguir=(yh, yf), gola=(0.026, 0.012))
    zipper(S, e, cp, 'zip', -0.28, 0.99, 1.14, 0.009)
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 2.04, 1.16, 0.007, lambda s: 'jaq_barra' if s >= 1.84 else ('jaq_faixa' if 0.62 <= s <= 0.72 else 'jaqueta'), n_an=18)
        cp.mao(S, lado)
        cp.membro(S, 'perna', lado, -0.12, 2.12, 1.14, 0.006, lambda s: 'jeans_punho' if 1.93 <= s < 2.06 else 'jeans', uv=(0.12, 0.12), n_an=18)
        cp.sapato(S, lado, 'tenis', 'tenis', 'sola', 'tenis_det')
    # cabelo curto castanho, repicado
    H.touca(S, cab, 'cabelo', borda=lambda th: 0.80 - 0.10 * math.exp(-(th / 1.0) ** 2) * 0 - 0.18 * (1 - math.exp(-(th / 1.2) ** 2)) - 0.12 * (abs(th) > 2.2), grossura=0.006)
    H.tufos_aleatorios(S, cab, 'cabelo', 46, (0.74, 0.98), (-3.1, 3.1), (0.025, 0.05), 0.0068, up=0.9, lado=0.5, sementes=11, evitar_frente=0.0)
    H.tufos_aleatorios(S, cab, 'cabelo', 9, (0.80, 0.86), (-0.7, 0.7), (0.030, 0.045), 0.0065, up=-0.25, lado=0.9, sementes=12)      # franja sobre a testa
    return e, S, pal, finalizar(cab, {'nome': 'Davi', 'papel': 'menino', 'idade': 9}, {'parado': {'T': 3.2, 'inquieto': 1.5, 'sway': 0.014}, 'andar': {'quica': 1.3}})


def bolso(S, e, cp, mat, t=0.08, larg=0.07, alt=0.034, ease=1.2, off=0.011):
    c, rx, rz = cp.torso(t)
    p = c + np.array([0.0, 0.0, rz * ease + off + 0.002])
    elipsoide(S, p, X_, Y_, Z_, larg, alt, 0.013, osso(e.nb, e.idx, Coluna=1), mat, aneis=8, nseg=20, n=2.6)


def gola_redonda(S, e, cp, mat, t=0.98, folga=0.012, tub=0.0068):
    c, rx, rz = cp.torso(t)
    K = 26
    th = 2 * np.pi * np.arange(K) / K
    R = cp.raio_pescoco() + folga
    pts = np.array([c + np.array([R * math.cos(a) * 1.08, 0.004, R * math.sin(a) * 1.08 + 0.004]) for a in th])
    loft(S, pts, tub, tub * 0.6, np.zeros(K), osso(e.nb, e.idx, Peito=.6, Pescoco=.4), mat, sub=1, nseg=10, frame='toro', fechado=True)


def laco(S, e, centro, mat, tam=0.03, osso_nome='Cabeca', sentido=1.0):
    w = osso(e.nb, e.idx, **{osso_nome: 1})
    for sg in (-1.0, 1.0):
        elipsoide(S, centro + np.array([sg * tam * 0.85 * sentido, 0.0, 0.0]), X_, Y_, Z_, tam * 0.8, tam * 0.5, tam * 0.35, w, mat, aneis=7, nseg=12)
    elipsoide(S, centro, X_, Y_, Z_, tam * 0.32, tam * 0.32, tam * 0.32, w, mat, aneis=6, nseg=10)


def alinhar_hem(cp, t_hem, t_ref):
    return cp.torso(t_hem)[0][1], cp.torso(t_ref)[0][1]


# ---------------------------------------------------------------------------------------------------- Théo
def teo():
    kid = dict(perna=0.67, tronco=0.68, braco=0.70, pescoco=0.6, cabeca=0.98, ombros=0.82, quadril=0.82, pe=0.77)
    e, cab, cp, S, _ = base_personagem(
        kid, dict(sx=1.12, sz=1.05, olho_r=0.0180, olho_fundo=0.42, olho_x=0.034, lid_aberta=36, iris=0.62, rubor=0.28, nariz_comp=0.009, nariz_larg=0.0088, nariz_ponta=0.0080,
                  boca_larg=0.024, sorriso0=0.003, labio=0.0042, sobr_esp=0.0046, dente_tam=0.95),
        dict(k_braco=0.76, k_perna=0.80, k_peito=0.95, k_ombro=0.96, k_mao=0.92))
    pal = paleta_rosto('#8f5c3b', labio='#8a4a42', iris='#2c1a0e', sobr='#16100b')
    pal.update({'cabelo': ('#15100c', .9), 'moletom': ('#eab61e', .9), 'mol_barra': ('#c99412', .92), 'mol_bolso': ('#d9a617', .92), 'cordao': ('#f1f1f1', .8),
                'bermuda': ('#6d727c', .9), 'bermuda_barra': ('#555a63', .9), 'meia': ('#f4f4f4', .9), 'meia_faixa': ('#c8342b', .85),
                'tenis': ('#c8342b', .7), 'sola': ('#f2f2f2', .7), 'tenis_det': ('#f2f2f2', .7), 'mochila': ('#2f6fb8', .85), 'mochila_det': ('#1d4c85', .85)})
    yh, yf = alinhar_hem(cp, -0.30, 0.08)
    cp.casca_torso(S, -0.30, 0.98, 1.18, 0.011, lambda t: 'mol_barra' if t < -0.20 else 'moletom', n_an=24, y_hem_seguir=(yh, yf), gola=(0.022, 0.016), flare=lambda t: (0.006, 0.006) if t < -0.2 else (0, 0))
    cp.capuz(S, 'moletom', tam=1.0)
    bolso(S, e, cp, 'mol_bolso', t=-0.04)
    c, rx, rz = cp.torso(0.96)
    for sg in (-1.0, 1.0):                                              # cordões do capuz
        pts = [c + np.array([sg * 0.030, 0.0, rz * 1.18 + 0.011 + 0.006]), c + np.array([sg * 0.034, -0.05, rz * 1.18 + 0.014]), c + np.array([sg * 0.036, -0.11, rz * 1.18 + 0.010])]
        tubo(S, pts, 0.0034, osso(e.nb, e.idx, Peito=1), 'cordao', nseg=6, sub=3, fecha=(True, True))
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 2.04, 1.20, 0.010, lambda s: 'mol_barra' if s >= 1.86 else 'moletom', n_an=18)
        cp.mao(S, lado)
        cp.membro(S, 'perna', lado, -0.12, 1.06, 1.26, 0.010, lambda s: 'bermuda_barra' if s >= 0.98 else 'bermuda', n_an=10, nseg=24)           # bermuda
        cp.membro(S, 'perna', lado, 0.95, 1.28, 1.0, 0.0, 'pele', n_an=5, fecha=(False, False))                                                      # joelho (pele)
        cp.membro(S, 'perna', lado, 1.15, 2.0, 1.04, 0.004, lambda s: 'meia_faixa' if 1.34 <= s <= 1.44 or 1.50 <= s <= 1.58 else 'meia', n_an=12, fecha=(True, False))   # meia alta
        cp.sapato(S, lado, 'tenis', 'tenis', 'sola', 'tenis_det')
    H.touca(S, cab, 'cabelo', borda=lambda th: 0.62 + 0.14 * math.exp(-(th / 1.1) ** 2), grossura=0.008)
    H.afro(S, cab, 'cabelo', n=70, tam=(0.020, 0.033), sementes=5, raio_extra=0.020)
    H.mochila(S, e, cp, 'mochila', 'mochila_det', tam=0.92)
    return e, S, pal, finalizar(cab, {'nome': 'Théo', 'papel': 'menino', 'idade': 8}, {'parado': {'T': 3.6, 'inquieto': 1.3, 'sway': 0.016, 'cab_roll': 0.04}, 'andar': {'quica': 1.4, 'v': 0.95}, 'correr': {'quica': 1.15}})


# ---------------------------------------------------------------------------------------------------- Lia
def lia():
    kid = dict(perna=0.69, tronco=0.70, braco=0.71, pescoco=0.6, cabeca=0.98, ombros=0.78, quadril=0.83, pe=0.76)

    def extras(e, cab, cp):
        info = {}
        for lado, sg in (('E', 1.0), ('D', -1.0)):
            p0, n = cab.couro(0.70, sg * 1.35, 0.012)
            nomes = H.cadeia_cabelo(e, 'Chiq' + lado, 'Cabeca', p0, np.array([sg * 0.28, -1.0, -0.12]), 0.215, n_osso=5)
            info[lado] = nomes
        return info
    e, cab, cp, S, ch = base_personagem(
        kid, dict(sx=1.1, sz=1.04, olho_r=0.0182, olho_fundo=0.42, olho_x=0.034, lid_aberta=36, iris=0.62, rubor=0.6, nariz_comp=0.008, nariz_larg=0.0075, nariz_ponta=0.0072,
                  boca_larg=0.0205, labio=0.0040, sobr_esp=0.0036, dente_tam=0.9),
        dict(k_braco=0.74, k_perna=0.80, k_peito=0.90, k_ombro=0.92, k_cintura=0.94, k_mao=0.9), ossos_extra=extras)
    pal = paleta_rosto('#f3cdb0', labio='#c8706a', iris='#2f6b3c', sobr='#8f4318')
    pal.update({'cabelo': ('#b8461a', .85), 'vestido': dict(cor='#ffffff', rug=.9, textura=T.xadrez((196, 40, 52), (30, 40, 90), (240, 235, 225)), repete=True),
                'gola': ('#f7f4ee', .85), 'laco': ('#d4283a', .7), 'meia_listra': dict(cor='#ffffff', rug=.9, textura=T.listras((250, 250, 250), (36, 52, 112), 64, 0.5), repete=True),
                'sapato': ('#a62a2e', .55), 'sola': ('#f2ede4', .7), 'sapato_det': ('#f2ede4', .6), 'barra': ('#f7f4ee', .85)})
    # corpete e saia do vestido xadrez
    t_cint = 0.10
    cp.casca_torso(S, t_cint, 0.98, 1.07, 0.005, 'vestido', n_an=18, uv=(0.12, 0.12), gola=(0.02, 0.018), fecha=(True, False), y_hem_seguir=None)
    y_topo = cp.torso(t_cint)[0][1] + 0.01
    y_barra = e.rep['Canela' + 'E'][1] + 0.11
    cp.saia(S, y_topo, y_barra, 0.115, 'vestido', uv=(0.12, 0.12), n_an=16, seguir=0.5)
    gola_redonda(S, e, cp, 'gola')
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 0.52, 1.30, 0.010, 'vestido', n_an=10, uv=(0.12, 0.12), extra=lambda ss: 1 + 0.12 * np.exp(-((ss - 0.30) / 0.2) ** 2))
        cp.membro(S, 'braco', lado, 0.42, 2.06, 1.0, 0.0, 'pele', n_an=14, fecha=(False, False))
        cp.mao(S, lado)
        cp.membro(S, 'perna', lado, 0.5, 2.12, 1.0, 0.004, 'meia_listra', uv=(0.07, 0.07), n_an=16, fecha=(True, False))
        cp.sapato(S, lado, 'sapatinho', 'sapato', 'sola', 'sapato_det')
    H.touca(S, cab, 'cabelo', borda=lambda th: 0.80 - 0.20 * (1 - math.exp(-(th / 1.1) ** 2)) - 0.1 * (abs(th) > 2.3), grossura=0.006)
    H.tufos_aleatorios(S, cab, 'cabelo', 14, (0.80, 0.88), (-0.9, 0.9), (0.03, 0.05), 0.0050, up=-0.2, lado=0.8, sementes=21)             # franja
    H.tufos_aleatorios(S, cab, 'cabelo', 24, (0.80, 0.99), (-3.1, 3.1), (0.018, 0.035), 0.0055, up=0.6, lado=0.4, sementes=22, evitar_frente=0.0)
    for lado, sg in (('E', 1.0), ('D', -1.0)):
        nomes = ch[lado]
        pts = e.cadeias['Chiq' + lado]['pontos']
        rads = [(0.030, 0.030), (0.034, 0.034), (0.033, 0.033), (0.028, 0.028), (0.019, 0.019), (0.0, 0.0)]
        H.mecha_cadeia(S, e, nomes, pts, rads, 'cabelo', nseg=14, n=2.0, fecha=(False, False))
        laco(S, e, pts[0] + np.array([sg * 0.002, 0.012, 0.004]), 'laco', tam=0.026, sentido=1.0)
    for n in ('ChiqE', 'ChiqD'):
        e.cadeias[n]['par'] = dict(rig=0.16, kq=1.5, torcao=0.0, damp=0.98, gust=0.15)
    return e, S, pal, finalizar(cab, {'nome': 'Lia', 'papel': 'menina', 'idade': 9, 'cadeias': {'ChiqE': ch['E'], 'ChiqD': ch['D']}}, {'parado': {'T': 3.8, 'inquieto': 1.2}, 'andar': {'braco_amp': 0.36, 'quica': 1.2}, 'correr': {'braco_amp': 0.5}})


# ---------------------------------------------------------------------------------------------------- Nina
def nina():
    kid = dict(perna=0.74, tronco=0.73, braco=0.75, pescoco=0.62, cabeca=0.98, ombros=0.83, quadril=0.84, pe=0.82)

    def extras(e, cab, cp):
        _, n = cab.couro(0.72, math.pi, 0.0)
        pts = [cab.couro(0.72, math.pi, 0.004)[0]]
        for t in (0.95, 0.80, 0.62, 0.45):
            c, rx, rz = cp.torso(t)
            pts.append(c + np.array([0.0, 0.0, -(rz * 1.28 + 0.016) - 0.016]))
        pts.append(pts[-1] + np.array([0.0, -0.075, -0.004]))
        nomes = e.add_cadeia('CabN', 'Cabeca', pts)
        return nomes
    e, cab, cp, S, cn = base_personagem(
        kid, dict(sx=1.06, sz=1.03, olho_r=0.0166, olho_fundo=0.45, olho_x=0.033, lid_aberta=33, iris=0.6, rubor=0.4, nariz_comp=0.010, nariz_larg=0.0082, nariz_ponta=0.0078,
                  boca_larg=0.021, labio=0.0040, sobr_esp=0.0044),
        dict(k_braco=0.75, k_perna=0.80, k_peito=0.93, k_ombro=0.95, k_cintura=0.96, k_mao=0.92), ossos_extra=extras)
    pal = paleta_rosto('#bb8760', labio='#9a5648', iris='#3a2416', sobr='#17120f')
    pal.update({'cabelo': ('#14110f', .55), 'puffer': ('#e2699b', .75), 'puffer_sulco': ('#c4457e', .8), 'puffer_gola': ('#c4457e', .85), 'zip': ('#e9e9ee', .4, .5),
                'legging': ('#5b3b8c', .8), 'tenis': ('#f6f6f8', .7), 'sola': ('#5b3b8c', .7), 'tenis_det': ('#5b3b8c', .7), 'aro': ('#1d1d22', .5, .3)})
    yh, yf = alinhar_hem(cp, -0.30, 0.08)
    seg = lambda t: 0.5 + 0.5 * math.cos((t + 0.30) / 1.28 * 2 * math.pi * 4.5)
    cp.casca_torso(S, -0.30, 0.98, 1.20, 0.014, lambda t: 'puffer_sulco' if seg(t) > 0.93 else 'puffer', n_an=44, y_hem_seguir=(yh, yf), gola=(0.026, 0.016),
                   perfil_extra=lambda t: 1 + 0.032 * (1 - seg(t)) - 0.0, flare=None)
    zipper(S, e, cp, 'zip', -0.28, 0.99, 1.20, 0.014)
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 2.04, 1.22, 0.012, lambda s: 'puffer_sulco' if (abs(((s - 0.1) % 0.42) - 0.0) < 0.05 or s >= 1.86) else 'puffer', n_an=26,
                  extra=lambda ss: 1 + 0.045 * (0.5 + 0.5 * np.cos((ss - 0.1) / 0.42 * 2 * np.pi)))
        cp.mao(S, lado)
        cp.membro(S, 'perna', lado, -0.12, 2.12, 1.0, 0.0035, 'legging', n_an=16)
        cp.sapato(S, lado, 'tenis', 'tenis', 'sola', 'tenis_det')
    H.touca(S, cab, 'cabelo', borda=lambda th: 0.30 if abs(th) > 1.0 else (0.80 - 0.1 * (1 - math.exp(-(th / 0.6) ** 2))), grossura=0.008)
    H.tufos_aleatorios(S, cab, 'cabelo', 18, (0.76, 0.86), (-1.0, 1.0), (0.035, 0.055), 0.0055, up=-0.5, lado=0.9, sementes=31)           # franja
    pts = e.cadeias['CabN']['pontos']
    rads = [(0.070, 0.016), (0.090, 0.024), (0.100, 0.026), (0.099, 0.025), (0.092, 0.020), (0.070, 0.010)]
    H.mecha_cadeia(S, e, cn, pts, rads, 'cabelo', nseg=22, n=3.0, fecha=(False, True))
    H.oculos(S, cab, 'aro', raio=0.0185)
    e.cadeias['CabN']['par'] = dict(rig=0.30, kq=1.6, torcao=0.25, damp=0.98, gust=0.12)
    return e, S, pal, finalizar(cab, {'nome': 'Nina', 'papel': 'menina', 'idade': 10, 'cadeias': {'CabN': cn}}, {'parado': {'T': 4.2, 'inquieto': 0.9, 'cab_pitch': 0.03}, 'andar': {'quica': 1.1}})


def sujo(seed=1, forca=1.0, base_chao=0.55):
    """cor por vértice de roupa suja: manchas escuras, sombra irregular e mais sujeira perto do chão"""
    def f(P, N, s):
        n1 = ruido3(P, 14.0, seed)
        mancha = np.clip((ruido3(P, 46.0, seed + 3) - 0.60) * 4.0, 0, 1)
        chao = np.clip((base_chao - P[:, 1]) / 0.5, 0, 1) * 0.28
        v = np.clip(1.0 - forca * (0.26 * n1 + 0.34 * mancha + chao), 0.30, 1.05)
        return np.stack([v, v * 0.985, v * 0.94], axis=1)
    return f


def borda_irregular(y_func, amp, freq, centro):
    """máscara de recorte para barras rasgadas: remove triângulos abaixo de y_func(ângulo) + ruído"""
    def r(cen):
        ang = np.arctan2(cen[:, 0] - centro[0], cen[:, 2] - centro[1])
        jag = amp * (0.5 + 0.5 * np.sin(ang * freq + 1.3) * np.sin(ang * freq * 0.37 + 0.4))
        return cen[:, 1] < np.array([y_func(a) for a in ang]) + jag
    return r


# ---------------------------------------------------------------------------------------------------- Maníaco
def maniaco():
    e, cab, cp, S, _ = base_personagem(
        dict(perna=1.07, tronco=1.04, braco=1.12, pescoco=1.1, cabeca=1.02, ombros=0.90, quadril=0.90, pe=1.08, curva=0.28, cabeca_frente=0.04),
        dict(sx=0.96, sz=1.06, mand=0.004, queixo=0.014, bochecha=-0.014, testa=0.006, cranio=-0.004, olho_r=0.0136, olho_fundo=0.82, olhos_assim=1.10, olho_x=0.0315, lid_aberta=34, iris=0.50, pupila=0.17,
             nariz_comp=0.026, nariz_larg=0.0115, nariz_ponta=0.0096, nariz_gancho=0.010, nariz_u=0.30, boca_larg=0.034, labio=0.0034, sorriso0=0.010, boca_assim=0.004,
             dentes=7, dente_irreg=1.0, dente_falta=((1, 2), (0, 5)), dente_tam=1.05, sobr_esp=0.0088, sobr_incl=-0.45, sobr_assim=1.0, sobr_larg=0.040,
             barba=0.85, olheira=1.0, mancha=0.7, nariz_vermelho=0.5, rugas_testa=2, rugas_olho=2, rugas_nariz=1.1, cicatriz=1, orelha=1.28, orelha_abre=0.45),
        dict(k_braco=0.86, k_perna=0.88, k_peito=0.90, k_ombro=0.97, k_mao=1.12))
    pal = paleta_rosto('#c8b79d', labio='#80504a', iris='#9aa05c', esclera='#efe2d8', sobr='#15110d', dente='#cdbd86')
    pal.update({'cabelo': ('#15110e', .42), 'camisa': ('#ffffff', .95), 'camisa_gola': ('#ffffff', .95), 'camisa_manga': ('#ffffff', .95),
                'suspensorio': ('#33241a', .7), 'calca': ('#ffffff', .95), 'bota': ('#1c1713', .6), 'sola': ('#0d0b09', .85), 'bota_det': ('#2b231c', .6)})
    pal['camisa'] = ('#767c69', .95)
    pal['camisa_gola'] = ('#63695a', .95)
    pal['camisa_manga'] = ('#6a7062', .95)
    pal['calca'] = ('#5a4a39', .95)
    yh, yf = alinhar_hem(cp, -0.30, 0.08)
    c_hem = cp.torso(-0.24)[0][1]
    rasgado = borda_irregular(lambda a: c_hem, 0.045, 7.0, (0.0, e.rep['Quadril'][2]))
    cp.casca_torso(S, -0.30, 0.98, 1.10, 0.007, lambda t: 'camisa_gola' if t > 0.95 else 'camisa', n_an=30, y_hem_seguir=(yh, yf), gola=(0.034, 0.020),
                   cor=sujo(2, 1.0), recorte=rasgado, flare=lambda t: (0.010, 0.008) if t < -0.1 else (0, 0))
    H.suspensorios(S, e, cp, 'suspensorio', ease=1.10, off=0.011)
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 1.30, 1.12, 0.007, lambda s: 'camisa_manga' if s > 1.12 else 'camisa', n_an=14, cor=sujo(4 + (lado == 'D'), 1.0), extra=lambda ss: 1 + 0.10 * np.clip((ss - 1.10) / 0.06, 0, 1) * np.clip((1.30 - ss) / 0.06, 0, 1))
        cp.membro(S, 'braco', lado, 1.24, 2.06, 1.0, 0.0, 'pele', n_an=10, fecha=(False, False), cor=cab.cor_pele)
        cp.mao(S, lado, cor=cab.cor_pele)
        y_cuff = e.rep['Pe' + lado][1] + 0.14
        cp.membro(S, 'perna', lado, -0.12, 2.06, 1.36, 0.012, 'calca', n_an=18, cor=sujo(7 + (lado == 'D'), 1.0), recorte=borda_irregular(lambda a: y_cuff, 0.05, 6.0 + (lado == 'D'), (e.rep['Pe' + lado][0], e.rep['Pe' + lado][2])))
        cp.sapato(S, lado, 'bota', 'bota', 'sola', 'bota_det', cano=False)
    # cabelo selvagem, ralo na frente
    H.touca(S, cab, 'cabelo', borda=lambda th: 0.90 - 0.10 * math.exp(-((abs(th) - 0.55) / 0.35) ** 2) * (-1) - 0.3 * (1 - math.exp(-(th / 1.0) ** 2)) - 0.12 * (abs(th) > 2.2), grossura=0.005, n_an=16)
    linha = lambda th: 0.90 - 0.3 * (1 - math.exp(-(th / 1.0) ** 2)) - 0.12 * (abs(th) > 2.2)
    H.tufos_aleatorios(S, cab, 'cabelo', 110, (0.50, 0.99), (-3.1, 3.1), (0.045, 0.115), 0.0062, up=0.9, lado=0.8, sementes=41, curva=0.9, u_min_fn=lambda th: linha(th) + 0.02)
    H.tufos_aleatorios(S, cab, 'cabelo', 18, (0.34, 0.66), (1.4, 4.9), (0.10, 0.19), 0.0058, up=-0.55, lado=0.7, sementes=42, curva=0.7)           # mechas compridas e oleosas (lados e costas)
    return e, S, pal, finalizar(cab, {'nome': 'Maníaco', 'papel': 'vilao', 'idade': 45}, {
        'parado': {'T': 5.0, 'sway': 0.014, 'cab_roll': 0.15, 'cab_yaw': 0.32, 'cotovelo': 0.40, 'braco_x': 0.02, 'lean': 0.08, 'inquieto': 0.6, 'roll': 0.03},
        'andar': {'lean': 0.14, 'braco_amp': 0.16, 'cotovelo': 0.15, 'cotovelo_var': 0.15, 'yaw_ombro': 0.10, 'sway': 1.5, 'v': 0.82, 'T': 1.12, 'cab_roll': 0.16, 'cab_yaw_amp': 0.22, 'cab_pitch': 0.10, 'cabeca_segue': 0.05, 'braco_adu': 0.02, 'quica': 0.7},
        'correr': {'lean': 0.30, 'braco_amp': 0.50, 'cab_roll': 0.12, 'cab_pitch': 0.10, 'cabeca_segue': 0.15},
        'fugir': None, 'pulo': 1.0, 'assustado': {'agacha': 0.03, 'tremor': 0.4}})


# ---------------------------------------------------------------------------------------------------- Velha
def velha():
    e, cab, cp, S, _ = base_personagem(
        dict(perna=0.88, tronco=0.86, braco=0.88, pescoco=0.9, cabeca=0.94, ombros=0.90, quadril=0.95, pe=0.84, curva=0.34, cabeca_frente=0.02),
        dict(sx=0.98, sz=1.02, bochecha=0.006, mand=0.003, queixo=-0.003, olho_r=0.0112, olho_fundo=0.70, lid_aberta=20, iris=0.55, pupila=0.30, olho_x=0.0295,
             nariz_comp=0.020, nariz_larg=0.0115, nariz_ponta=0.0100, nariz_gancho=0.004, boca_larg=0.0235, labio=0.0030, sorriso0=0.0, dentes=6, orelha=1.15,
             sobr_esp=0.0036, rugas_testa=3, rugas_olho=3, rugas_nariz=1.7, olheira=0.35, mancha=0.45, rubor=0.22),
        dict(k_braco=0.78, k_perna=0.82, k_peito=1.0, k_ombro=0.95, k_barriga=0.022, k_quad=1.05, k_mao=0.86))
    pal = paleta_rosto('#e7c2a5', labio='#b5736c', iris='#6a7e8c', esclera='#f1ece4', sobr='#b8b8bd', dente='#efe9d8')
    pal.update({'cabelo': ('#cfcfd4', .8), 'cardiga': dict(cor='#ffffff', rug=.95, textura=T.trico((143, 119, 181)), repete=True), 'cardiga_barra': ('#7a639c', .95), 'blusa': ('#efe6d2', .85),
                'saia': dict(cor='#ffffff', rug=.9, textura=T.floral((52, 70, 108), [(232, 150, 170), (245, 235, 225), (240, 200, 120)]), repete=True), 'saia_barra': ('#2f3f66', .9),
                'meia': ('#cdb89c', .85), 'sapato': ('#1a1715', .6), 'sola': ('#0c0b0a', .85), 'sapato_det': ('#2d2926', .6), 'aro': ('#c9a24a', .35, .8),
                'perola': ('#f6efe6', .25, .1), 'botao': ('#efe6d2', .4), 'bengala': ('#6a4a2a', .6), 'bengala_cabo': ('#3a2a1c', .5)})
    yh, yf = alinhar_hem(cp, -0.28, 0.08)
    cp.casca_torso(S, -0.28, 0.98, 1.14, 0.008, lambda t: 'cardiga_barra' if t < -0.18 else 'cardiga', n_an=26, uv=(0.10, 0.10), y_hem_seguir=(yh, yf), gola=(0.026, 0.016))
    gola_redonda(S, e, cp, 'blusa', t=0.985, folga=0.012, tub=0.0075)
    for i in range(6):                                                                   # botões do cardigã
        t = -0.15 + i * 0.17
        c, rx, rz = cp.torso(t)
        elipsoide(S, c + np.array([0.0, 0.0, rz * 1.14 + 0.008 + 0.003]), X_, Y_, Z_, 0.0075, 0.0075, 0.0035, osso(e.nb, e.idx, Coluna=1), 'botao', aneis=6, nseg=10)
    y_topo = cp.torso(0.06)[0][1]
    y_barra = e.rep['CanelaE'][1] - 0.075
    cp.saia(S, y_topo, y_barra, 0.14, 'saia', uv=(0.25, 0.25), n_an=18, seguir=0.42, ease_topo=1.14, off_topo=0.012)
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 2.04, 1.15, 0.007, lambda s: 'cardiga_barra' if s >= 1.88 else 'cardiga', uv=(0.10, 0.10), n_an=18)
        cp.mao(S, lado, cor=cab.cor_pele)
        cp.membro(S, 'perna', lado, 0.8, 2.12, 1.0, 0.003, 'meia', n_an=14, fecha=(True, False))
        cp.sapato(S, lado, 'ortopedico', 'sapato', 'sola', 'sapato_det')
    H.touca(S, cab, 'cabelo', borda=lambda th: 0.82 - 0.22 * (1 - math.exp(-(th / 1.2) ** 2)) - 0.1 * (abs(th) > 2.2), grossura=0.004)
    H.afro(S, cab, 'cabelo', n=64, tam=(0.013, 0.021), sementes=8, raio_extra=0.010, achata=0.95)
    H.coque(S, cab, 'cabelo', r=0.040, u=0.80, th=math.pi, deslocar=0.014)
    H.oculos(S, cab, 'aro', raio=0.0170, espessura=0.0014)
    H.colar_perolas(S, e, 'perola')
    H.bengala(S, e, cp, 'bengala', 'bengala_cabo')
    return e, S, pal, finalizar(cab, {'nome': 'Dona Lurdes', 'papel': 'velha', 'idade': 78, 'bengala': True}, {
        'cane': True, 'parado': {'T': 4.5, 'lean': 0.10, 'sway': 0.006, 'inquieto': 0.5, 'cab_roll': 0.03, 'cotovelo': 0.0},
        'andar': {'v': 0.52, 'T': 1.35, 'balanco_h': 0.45, 'beta': 0.70, 'braco_amp': 0.18, 'lean': 0.10, 'quica': 0.7, 'cane_beta': 0.62, 'cane_z0': 0.20},
        'correr': {'v': 0.42, 'T': 0.95, 'beta': 0.56, 'balanco_h': 0.35, 'kick': 0.0, 'lean': 0.16, 'quica': 0.8, 'braco_amp': 0.30, 'cane_beta': 0.5},
        'fugir': {'v': 0.42, 'T': 0.85, 'beta': 0.56, 'balanco_h': 0.35, 'kick': 0.0, 'lean': 0.16, 'braco_amp': 0.35, 'cab_fixa_yaw': 0.9, 'cane_beta': 0.5, 'quica': 0.8},
        'pulo': 0.55, 'assustado': {'agacha': 0.03}})
