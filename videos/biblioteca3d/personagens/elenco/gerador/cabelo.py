"""Cabelos e acessórios: touca (couro cabeludo com linha do cabelo recortada), tufos selvagens, cachos, afro, maria-chiquinhas e cabelo liso com cadeias de ossos,
coque, óculos, bengala, mochila, colar de pérolas, suspensórios, laços."""
import math
import numpy as np
from forma import loft, elipsoide, tubo, caminho, nos, osso, suave, unit, X_, Y_, Z_


def touca(S, cab, mat, u_ini=0.35, grossura=0.004, borda=None, nseg=72, n_an=26, cor=None):
    """casca sobre o crânio. `borda(th)` -> u mínimo do cabelo em cada ângulo (linha do cabelo): abaixo disso os triângulos são descartados"""
    e = cab.e
    us = np.linspace(u_ini, 1.0, n_an)
    C, RX, RZ = [], [], []
    for u in us:
        rx, rz, cz = cab.perfil(u)
        C.append((0.0, cab.chin + u * cab.h, cz))
        RX.append(rx + grossura)
        RZ.append(rz + grossura)
    wc = osso(e.nb, e.idx, Cabeca=1)

    def recorte(cen):
        if borda is None:
            return np.zeros(len(cen), dtype=bool)
        th = np.arctan2(cen[:, 0], cen[:, 2] - cab.zc)
        u = (cen[:, 1] - cab.chin) / cab.h
        return u < np.array([borda(t) for t in th])
    cap = loft(S, np.array(C), np.array(RX), np.array(RZ), us, wc, mat, nseg=nseg, sub=3, frame=(X_, Z_), fecha=(False, True), recorte=recorte, cor=cor)
    if borda is not None:                                        # fio liso que cobre os degraus do recorte da linha do cabelo
        K = 96
        th = 2 * np.pi * np.arange(K) / K - np.pi
        pts = np.array([cab.couro(float(np.clip(borda(t), 0.2, 0.97)), t, grossura * 0.6)[0] for t in th])
        loft(S, pts, np.full(K, grossura * 1.25), np.full(K, grossura * 1.25), np.zeros(K), lambda s_: wc, mat, sub=1, nseg=8, frame='toro', fechado=True)
    return cap


def tufo(S, cab, mat, u, th, comp, dir_bias, raio=0.006, curva=0.5, rng=None, pontos=4, nseg=7, cor=None):
    """mecha cônica e curva que nasce no couro cabeludo; `dir_bias` (vetor) puxa a direção (para cima, para os lados)"""
    rng = rng or np.random
    p0, n = cab.couro(u, th, -0.003)
    d = unit(n * 0.8 + np.asarray(dir_bias, dtype=float) + rng.normal(0, 0.28, 3))
    pts = [p0]
    cur = p0.copy()
    seg = comp / (pontos - 1)
    lat = unit(np.cross(d, Y_) + 1e-6)
    for k in range(1, pontos):
        d = unit(d + lat * curva * rng.uniform(-0.35, 0.35) + np.array([0.0, -0.06 * k * (1 if comp > 0.09 else 0.2), 0.0]))
        cur = cur + d * seg
        pts.append(cur.copy())
    rr = [raio * (1 - 0.85 * (k / (pontos - 1)) ** 1.2) for k in range(pontos)]
    tubo(S, pts, rr, osso(cab.e.nb, cab.e.idx, Cabeca=1), mat, nseg=nseg, sub=2, fecha=(False, True), cor=cor)


def tufos_aleatorios(S, cab, mat, n, u_faixa, th_faixa, comp, raio, up=0.6, lado=0.4, sementes=1, curva=0.5, cor=None, evitar_frente=None, u_min_fn=None):
    rng = np.random.RandomState(sementes)
    for _ in range(n):
        u = rng.uniform(*u_faixa)
        th = rng.uniform(*th_faixa)
        if evitar_frente is not None and abs(th) < evitar_frente and u < 0.84:
            continue
        th = math.atan2(math.sin(th), math.cos(th))
        if u_min_fn is not None and u < u_min_fn(th):
            continue
        c = rng.uniform(*comp)
        bias = np.array([math.sin(th) * lado, up * rng.uniform(0.4, 1.2), math.cos(th) * lado * 0.7])
        tufo(S, cab, mat, u, th, c, bias, raio * rng.uniform(0.8, 1.25), curva, rng, cor=cor)


def afro(S, cab, mat, n=60, tam=(0.020, 0.032), sementes=4, raio_extra=0.020, u_min=0.50, achata=0.92, cor=None):
    """cabelo cacheado volumoso: nuvem de bolinhas em casca ao redor do crânio"""
    rng = np.random.RandomState(sementes)
    e = cab.e
    wc = osso(e.nb, e.idx, Cabeca=1)
    rx, rz, cz = cab.perfil(0.6)
    ctr = np.array([0.0, cab.chin + 0.56 * cab.h, cab.zc + 0.004])
    for i in range(n):
        # direção na esfera (hemisfério superior e laterais; evita a testa baixa e o rosto)
        u = rng.uniform(0.0, 1.0) ** 0.8
        phi = math.acos(1 - u * (1 - math.cos(math.radians(120))))
        th = rng.uniform(0, 2 * math.pi)
        d = np.array([math.sin(phi) * math.sin(th), math.cos(phi), math.sin(phi) * math.cos(th)])
        if d[2] > 0.25 and d[1] < 0.55:
            continue
        r = rng.uniform(*tam)
        shell = np.array([(rx + raio_extra) * 1.02, (cab.h * 0.5 + raio_extra) * achata, (rz + raio_extra) * 1.03])
        pos = ctr + d * shell
        elipsoide(S, pos, X_, Y_, Z_, r, r * 0.95, r, wc, mat, aneis=7, nseg=10, cor=cor)


def cadeia_cabelo(esq, nome, pai, ponto_ini, direcao, comp, n_osso=5, curva_z=0.0):
    """cria uma cadeia de ossos de cabelo que desce a partir de `ponto_ini`"""
    pts = [np.asarray(ponto_ini, dtype=float)]
    d = unit(direcao)
    for k in range(n_osso):
        pts.append(pts[-1] + d * (comp / n_osso))
        d = unit(d + np.array([0.0, 0.0, curva_z]))
    return esq.add_cadeia(nome, pai, pts)


def mecha_cadeia(S, esq, nomes, pontos, raios, mat, nseg=14, largura=1.0, cor=None, n=2.0, fecha=(False, True)):
    """malha de uma mecha grossa que acompanha uma cadeia de ossos. `pontos`: M+1 pontos (juntas + ponta); raios por ponto (ru, rv)"""
    e = esq
    ks = [(float(k), {nomes[min(k, len(nomes) - 1)]: 1.0}) for k in range(len(nomes))]
    ks.insert(0, (-0.5, {e.pai[nomes[0]]: 1.0}))
    ks[1] = (0.0, {e.pai[nomes[0]]: .5, nomes[0]: .5})
    pw = nos(e.nb, e.idx, *ks)
    P = np.asarray(pontos, dtype=float)
    ru = np.array([r[0] for r in raios])
    rv = np.array([r[1] for r in raios])
    return loft(S, P, ru, rv, np.arange(len(P), dtype=float) - 0.0, pw, mat, nseg=nseg, sub=3, frame=(X_, Z_), fecha=fecha, n=n, cor=cor)


def coque(S, cab, mat, r=0.042, u=0.78, th=math.pi, deslocar=0.02, cor=None):
    p0, nrm = cab.couro(u, th, deslocar + r * 0.5)
    elipsoide(S, p0, X_, Y_, Z_, r, r * 0.92, r, osso(cab.e.nb, cab.e.idx, Cabeca=1), mat, aneis=11, nseg=18, cor=cor)


def oculos(S, cab, mat_aro, ponte=True, raio=0.0185, espessura=0.0016):
    """óculos redondos: dois aros, ponte e hastes até as orelhas"""
    e = cab.e
    wc = osso(e.nb, e.idx, Cabeca=1)
    y = cab.y_olho
    for sg in (1.0, -1.0):
        xo = sg * cab.ex
        K = 24
        th = 2 * np.pi * np.arange(K) / K
        zf = cab.zf(xo, y) + 0.006 + cab.r_olho * 0.5
        c = np.array([(xo + raio * math.cos(t), y + raio * math.sin(t) * 0.95, zf - 0.002 * math.sin(t) ** 2) for t in th])
        loft(S, c, np.full(K, espessura * 1.2), np.full(K, espessura * 1.2), np.zeros(K), lambda s_: wc, mat_aro, nseg=8, sub=1, frame='toro', fechado=True)
        # haste até a orelha
        yo = cab.chin + 0.47 * cab.h
        rx, rz, cz = cab.perfil(cab.u_de(yo))
        pts = [(xo + sg * raio, y + 0.002, zf - 0.003), (sg * (rx + 0.001), y + 0.002, cz + 0.02), (sg * (rx + 0.003), yo + 0.004, cz - 0.012)]
        tubo(S, pts, espessura, wc, mat_aro, nseg=6, sub=3, fecha=(True, True))
    if ponte:
        tubo(S, [(-cab.ex + raio * 0.95, y + 0.003, cab.zf(0, y) + 0.012 + cab.r_olho * 0.4), (0.0, y + 0.006, cab.zf(0, y) + 0.016 + cab.r_olho * 0.4), (cab.ex - raio * 0.95, y + 0.003, cab.zf(0, y) + 0.012 + cab.r_olho * 0.4)],
             espessura * 1.1, wc, mat_aro, nseg=6, sub=3, fecha=(True, True))


def bengala(S, esq, corpo, mat_madeira, mat_cabo, comp=None):
    """bengala presa à mão direita, na vertical a partir da mão até o chão, com cabo curvo"""
    e = esq
    W = e.rep['MaoD'] + np.array([-0.012, -0.022, 0.0])
    base = np.array([W[0], 0.0, W[2]])
    wm = osso(e.nb, e.idx, MaoD=1)
    tubo(S, [base, base + Y_ * (W[1] * 0.4), W], 0.0125, wm, mat_madeira, nseg=10, sub=2, fecha=(True, True))
    topo = W + Y_ * 0.0
    pts = [topo, topo + Y_ * 0.055 + X_ * 0.002, topo + Y_ * 0.085 + X_ * 0.03, topo + Y_ * 0.07 + X_ * 0.065, topo + Y_ * 0.03 + X_ * 0.08]
    tubo(S, pts, [0.0145, 0.0145, 0.0145, 0.0145, 0.0135], wm, mat_cabo, nseg=10, sub=4, fecha=(True, True))
    elipsoide(S, base + Y_ * 0.004, X_, Z_, Y_, 0.0165, 0.0165, 0.012, wm, mat_cabo, aneis=6, nseg=10)


def mochila(S, esq, corpo, mat, mat_det, tam=1.0):
    e = esq
    r = e.rep
    pe = r['Peito']
    k = e.par['tronco']
    wp = osso(e.nb, e.idx, Peito=1)
    ctr = pe + np.array([0.0, -0.045 * k, -0.115 * k])
    ys = np.linspace(-0.15, 0.15, 7) * k * tam
    c = np.array([ctr + np.array([0.0, y, 0.0]) for y in ys])
    ru = np.array([0.0, 0.098, 0.118, 0.122, 0.120, 0.110, 0.0]) * k * tam * 0.96
    rv = np.array([0.0, 0.050, 0.062, 0.066, 0.064, 0.058, 0.0]) * k * tam
    loft(S, c, ru, rv, np.arange(7.0), lambda s: wp, mat, n=3.4, sub=3, frame=(X_, Z_), fecha=(True, True), nseg=24)
    elipsoide(S, ctr + np.array([0.0, -0.065 * k, -0.062 * k]), X_, Y_, Z_, 0.075 * k, 0.050 * k, 0.026 * k, wp, mat_det, aneis=8, nseg=16, n=2.0)
    for lado, sg in (('E', 1.0), ('D', -1.0)):
        a = pe + np.array([sg * 0.075 * k, 0.062 * k, 0.045 * k])
        b = ctr + np.array([sg * 0.085 * k, 0.12 * k, -0.05 * k])
        c2 = pe + np.array([sg * 0.115 * k, -0.04 * k, 0.045 * k])
        d2 = ctr + np.array([sg * 0.095 * k, -0.12 * k, -0.045 * k])
        tubo(S, [b, a + np.array([0, 0.02 * k, -0.01 * k]), a + np.array([0, -0.06 * k, 0.012 * k]), c2 + np.array([0, -0.045 * k, 0.0]), d2], [0.0105 * k, 0.0105 * k, 0.0105 * k, 0.0105 * k, 0.0105 * k],
             wp, mat_det, nseg=8, sub=3, fecha=(True, True), achatamento=0.45)


def colar_perolas(S, esq, mat, n=26, raio=0.0050):
    e = esq
    r = e.rep
    base = r['Pescoco'] + np.array([0.0, 0.012, 0.0])
    wp = osso(e.nb, e.idx, Peito=0.6, Pescoco=0.4)
    for i in range(n):
        t = 2 * math.pi * i / n
        p = base + np.array([math.sin(t) * 0.062 * (0.5 + 0.5 * e.par['pescoco']), -0.020 * (0.5 - 0.5 * math.cos(t)) - 0.01, math.cos(t) * 0.066 * (0.5 + 0.5 * e.par['pescoco'])])
        elipsoide(S, p, X_, Y_, Z_, raio, raio, raio, wp, mat, aneis=5, nseg=8)


def suspensorios(S, esq, corpo, mat, ease=1.12, off=0.010, largura=0.020):
    e = esq
    wp = nos(e.nb, e.idx, (0.0, {'Quadril': 1}), (1.0, {'Coluna2': 1}), (2.0, {'Peito': 1}))
    for sg in (1.0, -1.0):
        pts = []
        for t in np.linspace(0.03, 0.86, 9):
            c, rx, rz = corpo.torso(t)
            frente = np.array([sg * 0.05 * (rx / 0.14), c[1], c[2] + (rz * ease + off) * math.sqrt(max(0, 1 - (0.05 * (rx / 0.14) / (rx * ease + off)) ** 2)) + 0.002])
            pts.append(frente)
        tubo(S, pts, largura * 0.5, wp, mat, nseg=8, sub=2, fecha=(True, True), achatamento=0.25, frame=(X_, Z_))
        cs, rx, rz = corpo.torso(0.90)
        topo = np.array([sg * 0.075 * esq.par['ombros'] / 0.9, cs[1] + 0.012, cs[2] + rz * ease + off])
        costas = [np.array([sg * 0.05, corpo.torso(t)[0][1], corpo.torso(t)[0][2] - (corpo.torso(t)[2] * ease + off) - 0.002]) for t in np.linspace(0.90, 0.05, 6)]
        tubo(S, [topo, topo + np.array([0, 0.012, -0.03]), costas[0] + np.array([0, 0.012, 0.0])] + costas, largura * 0.5, wp, mat, nseg=8, sub=2, fecha=(True, True), achatamento=0.25, frame=(X_, Z_))
