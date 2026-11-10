"""Malha do Corredor: superfícies por seções (loft) com pesos de pele por vértice.

Cada parte do corpo é uma sequência de anéis (superelipses) ao longo de um caminho; os anéis de controle são suavizados com
Catmull-Rom, as normais saem da própria malha (suaves) e cada anel ganha pesos de osso por interpolação entre nós.
A malha é construída na pose de repouso do esqueleto de `base.py`."""
import math
import numpy as np
from base import REPOUSO, OSSOS, INDICE, NOS_CACHECOL, SEG_CACHECOL, suave

NB = len(OSSOS)
NSEG = 32
X_, Y_, Z_ = np.array([1.0, 0, 0]), np.array([0, 1.0, 0]), np.array([0, 0, 1.0])


# ------------------------------------------------------------------ contêiner
class Superficie:
    """acumula vértices (posição, normal, pesos completos por osso) e triângulos com chave de material"""

    def __init__(self):
        self.P, self.N, self.W = [], [], []
        self.T, self.M = [], []
        self.n = 0

    def add(self, P, N, W, T, mats):
        self.P.append(P)
        self.N.append(N)
        self.W.append(W)
        self.T.append(np.asarray(T, dtype=np.int64) + self.n)
        self.M.extend(mats)
        self.n += len(P)

    def prims(self, materiais, nome_material=None):
        """agrupa por material -> lista de (chave, positions, normals, indices, joints, weights); pesos reduzidos às 4 maiores influências"""
        P, N, W = np.vstack(self.P), np.vstack(self.N), np.vstack(self.W)
        T = np.vstack(self.T)
        M = np.array(self.M)
        top = np.argsort(-W, axis=1)[:, :4]
        Wt = np.take_along_axis(W, top, axis=1)
        Wt = np.where(Wt < 1e-4, 0.0, Wt)                              # influências desprezíveis somem
        Wt = Wt / np.maximum(Wt.sum(axis=1, keepdims=True), 1e-9)
        J = np.where(Wt > 0, top, 0).astype('<u2')                     # peso zero => junta 0 (exigência da especificação)
        saida = []
        for chave in dict.fromkeys(self.M):
            sel = T[M == chave]
            usados, inv = np.unique(sel.reshape(-1), return_inverse=True)
            saida.append((chave, P[usados], N[usados], inv.reshape(-1, 3), J[usados], Wt[usados].astype('<f4')))
        return saida

    def contagem_tris(self):
        return int(sum(len(t) for t in self.T))


# ------------------------------------------------------------------ utilidades
def catmull(P, sub):
    """interpolação Catmull-Rom uniforme que passa pelos pontos de controle (P: (K,d))"""
    P = np.asarray(P, dtype=float)
    if P.ndim == 1:
        P = P[:, None]
    ext = np.vstack([2 * P[0] - P[1], P, 2 * P[-1] - P[-2]])
    out = []
    for i in range(len(P) - 1):
        p0, p1, p2, p3 = ext[i], ext[i + 1], ext[i + 2], ext[i + 3]
        for k in range(sub):
            t = k / sub
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-1])
    return np.array(out)


def nos(*ks):
    """função de pesos a partir de nós (s, {osso: peso}); entre dois nós a mistura usa smoothstep"""
    ks = sorted(ks, key=lambda k: k[0])
    vec = []
    for s, d in ks:
        w = np.zeros(NB)
        for nome, p in d.items():
            w[INDICE[nome]] = p
        vec.append(w / w.sum())
    ss = [k[0] for k in ks]

    def f(s):
        if s <= ss[0]:
            return vec[0]
        if s >= ss[-1]:
            return vec[-1]
        i = int(np.searchsorted(ss, s, side='right')) - 1
        t = suave((s - ss[i]) / (ss[i + 1] - ss[i]))
        return vec[i] * (1 - t) + vec[i + 1] * t
    return f


def caminho(pontos, s_nos, s):
    """posição em uma polilinha cujos pontos têm parâmetros s_nos; fora do intervalo prolonga na direção do primeiro/último trecho"""
    pontos = [np.asarray(p, dtype=float) for p in pontos]
    if s <= s_nos[0]:
        d = pontos[1] - pontos[0]
        return pontos[0] + d * (s - s_nos[0]) / (s_nos[1] - s_nos[0])
    if s >= s_nos[-1]:
        d = pontos[-1] - pontos[-2]
        return pontos[-1] + d * (s - s_nos[-1]) / (s_nos[-1] - s_nos[-2])
    i = int(np.searchsorted(s_nos, s, side='right')) - 1
    t = (s - s_nos[i]) / (s_nos[i + 1] - s_nos[i])
    return pontos[i] * (1 - t) + pontos[i + 1] * t


def aneis_sobre(pontos, s_nos, tabela):
    """tabela: lista de (s, ru, rv[, n, deslocamento_u, deslocamento_v]) -> arrays de anéis com centros sobre a polilinha"""
    c, ru, rv, n, ss = [], [], [], [], []
    for linha in tabela:
        s, a, b = linha[0], linha[1], linha[2]
        c.append(caminho(pontos, s_nos, s))
        ru.append(a)
        rv.append(b)
        n.append(linha[3] if len(linha) > 3 else 2.0)
        ss.append(s)
    return np.array(c), np.array(ru), np.array(rv), np.array(ss), np.array(n)


# ------------------------------------------------------------------ loft
def loft(S, c, ru, rv, s, pesos, mat, n=2.0, nseg=NSEG, sub=4, frame='auto', fecha=(True, True), fechado=False, ajuste=None):
    """cria uma superfície de anéis. c:(K,3) centros, ru/rv:(K,) semieixos, s:(K,) parâmetro da cadeia (pesos e material),
    pesos: f(s)->vetor (NB,), mat: chave fixa ou f(s)->chave, frame: 'auto' | (u,v) vetores fixos | 'toro'.
    Anel com ru=rv=0 vira polo (ponta arredondada); `fecha` põe tampa nas pontas abertas."""
    c = np.asarray(c, dtype=float)
    K = len(c)
    n = np.broadcast_to(np.asarray(n, dtype=float), (K,)).copy()
    base = np.column_stack([c, ru, rv, n, s])
    if fechado:
        ext = np.vstack([base[-2:], base, base[:2]])
        sm = catmull(ext, sub)[2 * sub: 2 * sub + K * sub]
    else:
        sm = catmull(base, sub)
    C = sm[:, :3]
    RU, RV, NN, SS = np.maximum(sm[:, 3], 0), np.maximum(sm[:, 4], 0), np.clip(sm[:, 5], 1.2, 8.0), sm[:, 6]
    R = len(C)
    d = (np.roll(C, -1, axis=0) - np.roll(C, 1, axis=0)) if fechado else np.gradient(C, axis=0)
    d = d / np.maximum(np.linalg.norm(d, axis=1, keepdims=True), 1e-9)
    if isinstance(frame, tuple):
        Uu = np.tile(np.asarray(frame[0], dtype=float), (R, 1))
        Vv = np.tile(np.asarray(frame[1], dtype=float), (R, 1))
    elif frame == 'toro':
        Vv = np.tile(Y_, (R, 1))
        Uu = np.cross(Vv, d)
        Uu /= np.maximum(np.linalg.norm(Uu, axis=1, keepdims=True), 1e-9)
    else:
        Vv = Z_ - d * (d @ Z_)[:, None]
        ruim = np.linalg.norm(Vv, axis=1) < 1e-4
        Vv[ruim] = X_ - d[ruim] * (d[ruim] @ X_)[:, None]
        Vv /= np.linalg.norm(Vv, axis=1, keepdims=True)
        Uu = np.cross(Vv, d)
    th = 2 * np.pi * np.arange(nseg) / nseg
    cs, sn = np.cos(th), np.sin(th)
    ex = 2.0 / NN
    px = np.sign(cs)[None, :] * np.abs(cs)[None, :] ** ex[:, None]
    py = np.sign(sn)[None, :] * np.abs(sn)[None, :] ** ex[:, None]
    V = C[:, None, :] + Uu[:, None, :] * (RU[:, None] * px)[:, :, None] + Vv[:, None, :] * (RV[:, None] * py)[:, :, None]
    Pv = V.reshape(-1, 3)
    # faixas entre anéis consecutivos (2 triângulos por quadrilátero)
    nr = R if fechado else R - 1
    i = np.arange(nr)[:, None]
    j = np.arange(nseg)[None, :]
    i2, j2 = (i + 1) % R, (j + 1) % nseg
    a, b, c_, d_ = i * nseg + j, i * nseg + j2, i2 * nseg + j2, i2 * nseg + j
    tri = np.stack([np.stack([a, b, c_], -1), np.stack([a, c_, d_], -1)], axis=2).reshape(-1, 3)
    ms = np.repeat(np.arange(nr), nseg * 2)
    fn = np.cross(Pv[tri[:, 1]] - Pv[tri[:, 0]], Pv[tri[:, 2]] - Pv[tri[:, 0]])
    ref = C[np.minimum(ms, R - 1)]
    if float(np.einsum('ij,ij->i', fn, Pv[tri].mean(axis=1) - ref).sum()) < 0:     # faces para fora
        tri = tri[:, [0, 2, 1]]
    polo = [(RU[0] < 1e-6 and RV[0] < 1e-6), (RU[-1] < 1e-6 and RV[-1] < 1e-6)]
    # tampas das pontas abertas
    Pall, tri_extra, ms_extra, w_idx, cap_info = Pv, [], [], [], []
    if not fechado:
        for fim_, anel, sentido in ((0, 0, -1.0), (1, R - 1, 1.0)):
            if polo[fim_] or not fecha[fim_]:
                continue
            ci = len(Pall)
            Pall = np.vstack([Pall, C[anel][None, :]])
            dirn = sentido * d[anel]
            for jj in range(nseg):
                p0, p1 = Pall[anel * nseg + jj], Pall[anel * nseg + (jj + 1) % nseg]
                t = (ci, anel * nseg + jj, anel * nseg + (jj + 1) % nseg)
                if float(np.dot(np.cross(p0 - C[anel], p1 - C[anel]), dirn)) < 0:
                    t = (t[0], t[2], t[1])
                tri_extra.append(t)
                ms_extra.append(max(anel - (1 if sentido > 0 else 0), 0))
            w_idx.append(anel)
            cap_info.append((ci, dirn))
    if tri_extra:
        tri = np.vstack([tri, np.array(tri_extra, dtype=np.int64)])
        ms = np.concatenate([ms, np.array(ms_extra)])
    fn = np.cross(Pall[tri[:, 1]] - Pall[tri[:, 0]], Pall[tri[:, 2]] - Pall[tri[:, 0]])
    Nrm = np.zeros_like(Pall)
    for k in range(3):
        np.add.at(Nrm, tri[:, k], fn)
    ln = np.linalg.norm(Nrm, axis=1, keepdims=True)
    Nrm = np.where(ln > 1e-12, Nrm / np.maximum(ln, 1e-12), np.array([0.0, 1.0, 0.0]))
    if not fechado:
        for fim_, anel, sentido in ((0, 0, -1.0), (1, R - 1, 1.0)):
            if polo[fim_]:
                Nrm[anel * nseg:(anel + 1) * nseg] = sentido * d[anel]
    for ci, dirn in cap_info:
        Nrm[ci] = dirn
    # pesos por vértice
    Wr = np.array([pesos(float(SS[k])) for k in range(R)])
    Wv = np.repeat(Wr, nseg, axis=0)
    if w_idx:
        Wv = np.vstack([Wv, Wr[w_idx]])
    if ajuste is not None:
        ajuste(Pall, Wv)
    chaves = []
    for m in ms:
        s_m = 0.5 * (SS[int(m)] + SS[min(int(m) + 1, R - 1)])
        chaves.append(mat if isinstance(mat, str) else mat(float(s_m)))
    S.add(Pall, Nrm, Wv, tri, chaves)
    return Pall


def elipsoide(S, centro, eixo_u, eixo_v, eixo_a, ru, rv, ra, pesos, mat, aneis=9, nseg=20):
    """elipsoide com polos ao longo do eixo `a`; ru/rv são os semieixos nos eixos u e v"""
    centro = np.asarray(centro, dtype=float)
    ph = np.linspace(0, np.pi, aneis)
    c = np.array([centro + np.asarray(eixo_a, dtype=float) * (-ra * math.cos(p)) for p in ph])
    r_u = np.array([ru * math.sin(p) for p in ph])
    r_v = np.array([rv * math.sin(p) for p in ph])
    return loft(S, c, r_u, r_v, np.zeros(aneis), lambda s: pesos, mat, nseg=nseg, sub=1, frame=(eixo_u, eixo_v), fecha=(False, False))


def _w(**kw):
    w = np.zeros(NB)
    for k, v in kw.items():
        w[INDICE[k]] = v
    return w / w.sum()


# ------------------------------------------------------------------ partes do corpo
def torso(S):
    # y, rx, rz, cz, n  (perfil grosseiro; é suavizado e amostrado de 1,5 em 1,5 cm)
    T = np.array([(0.80, .190, .114, -.003, 2.4), (0.84, .196, .119, -.004, 2.4), (0.88, .195, .121, -.005, 2.4), (0.93, .185, .117, -.007, 2.4),
                  (1.00, .167, .108, -.008, 2.3), (1.06, .150, .100, -.002, 2.3), (1.13, .147, .098, .002, 2.3), (1.20, .151, .100, .005, 2.3), (1.28, .162, .108, .010, 2.4),
                  (1.35, .172, .113, .014, 2.5), (1.41, .176, .112, .012, 2.5), (1.455, .168, .104, .005, 2.4), (1.49, .128, .092, -.006, 2.2),
                  (1.515, .092, .083, -.010, 2.0), (1.538, .082, .081, -.010, 2.0), (1.552, .072, .074, -.009, 2.0), (1.558, .060, .062, -.008, 2.0),
                  (1.560, .050, .052, -.008, 2.0)])
    F = catmull(T, 4)
    y, rx, rz, cz, nn = F[:, 0], F[:, 1].copy(), F[:, 2].copy(), F[:, 3], F[:, 4]
    base_rz = rz.copy()

    def calombo(y, a, b, h):
        return h * np.sin(np.pi * np.clip((y - a) / (b - a), 0, 1)) ** 2 * ((y >= a) & (y <= b))
    for a, b, h in ((0.80, 0.872, 0.003), (1.283, 1.317, 0.0035)):           # barra da jaqueta e faixa no peito: levemente salientes
        rx += calombo(y, a, b, h)
        rz += calombo(y, a, b, h)
    c = np.column_stack([np.zeros_like(y), y, cz])
    pesos = nos((0.80, {'Quadril': 1}), (0.99, {'Quadril': 1}), (1.08, {'Coluna': 1}), (1.22, {'Coluna2': 1}), (1.37, {'Peito': 1}), (1.46, {'Peito': 1}),
                (1.52, {'Peito': .55, 'Pescoco': .45}), (1.56, {'Pescoco': 1}))

    def ajuste(P, W):
        for lado, sg in (('E', 1), ('D', -1)):                  # trapézio e ombros: parte do peso vai para a clavícula
            m = np.clip((sg * P[:, 0] - 0.07) / 0.09, 0, 1) * np.clip((P[:, 1] - 1.36) / 0.08, 0, 1) * 0.5
            k = INDICE['Ombro' + lado]
            W[:, k] += m * (1 - W[:, k])
            W[:, :k] *= (1 - m)[:, None]
            W[:, k + 1:] *= (1 - m)[:, None]
        for lado, sg in (('E', 1), ('D', -1)):                  # barra da jaqueta: a frente acompanha a coxa que levanta (como tecido)
            frente = np.clip((P[:, 2] + 0.02) / 0.10, 0, 1)
            lado_ok = np.clip((sg * P[:, 0] + 0.02) / 0.06, 0, 1)
            m = 0.65 * frente * lado_ok * np.clip((0.97 - P[:, 1]) / 0.14, 0, 1)
            k = INDICE['Coxa' + lado]
            W[:, k] += m * (1 - W[:, k])
            W[:, :k] *= (1 - m)[:, None]
            W[:, k + 1:] *= (1 - m)[:, None]
        W /= W.sum(axis=1, keepdims=True)

    def mat(yy):
        if yy < 0.872:
            return 'jaqueta_barra'
        if 1.282 < yy < 1.318 or yy > 1.545:
            return 'jaqueta_faixa'
        return 'jaqueta'
    loft(S, c, rx, rz, y, pesos, mat, n=nn, sub=1, frame=(X_, Z_), ajuste=ajuste, fecha=(True, False))
    # zíper no centro da frente
    yz = np.arange(0.815, 1.543, 0.016)
    cz_z = np.interp(yz, y, cz) + np.interp(yz, y, base_rz) + 0.0012
    cz_ring = np.column_stack([np.zeros_like(yz), yz, cz_z])
    loft(S, cz_ring, np.full(len(yz), .0042), np.full(len(yz), .0034), yz, pesos, 'jaqueta_faixa', n=2.6, sub=1, nseg=10, frame=(X_, Z_), fecha=(True, True))


def pescoco_cabeca(S):
    # pescoço (pele), que atravessa a gola
    ys = [1.49, 1.52, 1.55, 1.58, 1.61]
    c = np.array([(0, y, -0.009 + 0.003 * (y - 1.49) / 0.12) for y in ys])
    ru = np.array([.056, .054, .053, .053, .054])
    rv = np.array([.058, .057, .056, .056, .058])
    pesos = nos((1.49, {'Peito': .7, 'Pescoco': .3}), (1.53, {'Pescoco': 1}), (1.60, {'Pescoco': .3, 'Cabeca': .7}))
    loft(S, c, ru, rv, np.array(ys), pesos, 'pele', sub=3, frame=(X_, Z_), fecha=(False, False))
    # crânio
    H = [(1.553, 0, 0, .034), (1.562, .026, .038, .036), (1.580, .048, .060, .030), (1.605, .065, .079, .020), (1.640, .074, .091, .010),
         (1.678, .078, .097, .004), (1.715, .077, .097, .000), (1.748, .071, .091, -.003), (1.773, .056, .077, -.008), (1.787, .032, .050, -.012),
         (1.792, 0, 0, -.012)]
    c = np.array([(0, y, cz) for y, _, _, cz in H])
    ru = np.array([h[1] for h in H])
    rv = np.array([h[2] for h in H])
    s = np.array([h[0] for h in H])
    pesos = nos((1.553, {'Cabeca': 1}), (1.60, {'Cabeca': 1}))
    loft(S, c, ru, rv, s, pesos, 'pele', sub=3, frame=(X_, Z_), fecha=(False, False))
    cab = _w(Cabeca=1)
    elipsoide(S, (0, 1.660, 0.094), X_, Y_, Z_, 0.0105, 0.021, 0.021, cab, 'pele', aneis=8, nseg=16)             # nariz
    for sg in (1, -1):
        elipsoide(S, (sg * 0.0765, 1.668, -0.004), Y_, Z_, X_ * sg, 0.026, 0.017, 0.010, cab, 'pele', aneis=8, nseg=16)   # orelhas


def acessorios_cabeca(S):
    cab = nos((0, {'Cabeca': 1}))
    # gorro de lã: calota + barra dobrada
    G = [(1.694, .084, .104, 2.0), (1.704, .088, .108, 2.0), (1.712, .085, .105, 2.0), (1.720, .083, .102, 2.1), (1.745, .079, .098, 2.1),
         (1.768, .068, .087, 2.1), (1.788, .050, .066, 2.1), (1.804, .027, .038, 2.0), (1.811, .0, .0, 2.0)]
    czs = {1.694: .004, 1.704: .003, 1.712: .002, 1.720: .001, 1.745: -.003, 1.768: -.009, 1.788: -.013, 1.804: -.014, 1.811: -.014}
    c = np.array([(0, y, czs[y]) for y, _, _, _ in G])
    ru = np.array([g[1] for g in G])
    rv = np.array([g[2] for g in G])
    nn = np.array([g[3] for g in G])
    s = np.array([g[0] for g in G])
    loft(S, c, ru, rv, s, cab, lambda y: 'gorro_barra' if y < 1.716 else 'gorro', n=nn, sub=3, frame=(X_, Z_), fecha=(True, False))
    # viseira esportiva: faixa em volta da cabeça + lente larga na frente
    c = np.array([(0, 1.666, 0.0), (0, 1.678, 0.0), (0, 1.690, 0.0)])
    loft(S, c, np.array([.0815, .0822, .0815]), np.array([.101, .102, .101]), np.array([0, 1, 2.0]), cab, 'viseira_faixa', sub=3, frame=(X_, Z_), fecha=(False, False), n=2.0)
    elipsoide(S, (0, 1.678, 0.071), X_, Y_, Z_, 0.071, 0.0235, 0.042, _w(Cabeca=1), 'viseira', aneis=11, nseg=28)


def cachecol(S):
    pes = _w(Pescoco=1)
    # voltas em volta do pescoço (dois toros empilhados)
    for y, R_u, R_v, tub in ((1.538, .075, .079, .021), (1.574, .069, .073, .019)):
        K = 24
        th = 2 * np.pi * np.arange(K) / K
        c = np.array([(R_u * math.cos(t), y, -0.010 + R_v * math.sin(t)) for t in th])
        loft(S, c, np.full(K, tub), np.full(K, tub), np.zeros(K), lambda s: pes, 'cachecol', sub=1, nseg=14, frame='toro', fechado=True)
    # rabo: fita larga e grossa que acompanha os ossos Cachecol1..N (s=-1 no pescoço, s=k na junta do osso k+1, s=N na ponta)
    N = NOS_CACHECOL
    juntas = [tuple(REPOUSO['Cachecol%d' % (k + 1)]) for k in range(N)]
    pts = [(0.035, 1.548, -0.090)] + juntas + [(juntas[-1][0], juntas[-1][1] - SEG_CACHECOL, juntas[-1][2])]
    s_nos = [float(k) for k in range(-1, N + 1)]
    ks = [(-1.0, {'Pescoco': 1.0}), (0.0, {'Pescoco': .35, 'Cachecol1': .65})] + [(float(k), {'Cachecol%d' % (k + 1): 1.0}) for k in range(1, N)] + [(float(N), {'Cachecol%d' % N: 1.0})]
    tab = [(-1.0, .040, .013, 3.0), (-0.6, .047, .015, 3.0), (0.0, .050, .0155, 3.0)] + [(float(k), .050, .0155, 3.0) for k in range(1, N)] + \
          [(N - 0.25, .050, .0155, 3.0), (N + 0.0, .049, .0145, 3.0), (N + 0.08, .043, .012, 3.0), (N + 0.12, .0, .0, 3.0)]
    c, ru, rv, ss, nn = aneis_sobre(pts, s_nos, tab)
    loft(S, c, ru, rv, np.minimum(ss, float(N)), nos(*ks), 'cachecol', n=nn, sub=2, frame=(X_, Z_), fecha=(False, True))


def perna(S, lado):
    sg = 1.0 if lado == 'E' else -1.0
    H, K, A = REPOUSO['Coxa' + lado], REPOUSO['Canela' + lado], REPOUSO['Pe' + lado]
    tab = [(-0.12, .064, .068), (0.0, .072, .076), (0.15, .078, .083), (0.28, .082, .087), (0.40, .086, .091), (0.52, .092, .097), (0.70, .079, .084), (0.92, .066, .071), (1.0, .064, .070),
           (1.10, .064, .072), (1.35, .063, .074), (1.65, .054, .061), (1.86, .043, .049), (1.93, .0455, .0505), (2.02, .0455, .0505), (2.10, .040, .045)]
    c, ru, rv, ss, _ = aneis_sobre([H, K, A], [0.0, 1.0, 2.0], tab)
    for i, s_ in enumerate(ss):                                       # volume da panturrilha para trás
        if 1.1 <= s_ <= 1.7:
            c[i][2] -= 0.008 * math.sin(math.pi * (s_ - 1.1) / 0.6)
    pesos = nos((-0.12, {'Quadril': .6, 'Coxa' + lado: .4}), (0.0, {'Quadril': .3, 'Coxa' + lado: .7}), (0.18, {'Coxa' + lado: 1}), (0.80, {'Coxa' + lado: 1}),
                (1.0, {'Coxa' + lado: .5, 'Canela' + lado: .5}), (1.22, {'Canela' + lado: 1}), (1.82, {'Canela' + lado: 1}),
                (2.0, {'Canela' + lado: .5, 'Pe' + lado: .5}), (2.12, {'Pe' + lado: 1}))
    loft(S, c, ru, rv, ss, pesos, lambda s_: 'calca_faixa' if 1.9 <= s_ < 2.06 else 'calca', n=2.1, sub=3, fecha=(True, False))
    # listra lateral (faixa fina de cor que acompanha o lado de fora da perna)
    sel = [i for i, s_ in enumerate(ss) if 0.12 <= s_ <= 1.86]
    cs = np.array([c[i] + sg * X_ * (ru[i] * 0.985) for i in sel])
    k = len(sel)
    rl = np.full(k, .0032)
    rl[0] = rl[-1] = .0016
    loft(S, cs, rl, np.full(k, .0115), ss[sel], pesos, 'detalhe', n=3.0, sub=3, nseg=10, frame='auto', fecha=(True, True))


def sapato(S, lado):
    A = REPOUSO['Pe' + lado]
    z0 = A[2]
    # (z relativo ao tornozelo, topo relativo ao tornozelo, semilargura)
    Up = [(-0.088, -0.040, 0.0), (-0.081, -0.012, 0.030), (-0.068, 0.030, 0.038), (-0.045, 0.041, 0.043), (-0.010, 0.037, 0.0435), (0.025, 0.008, 0.046),
          (0.060, -0.022, 0.049), (0.100, -0.038, 0.052), (0.140, -0.047, 0.0525), (0.180, -0.054, 0.047), (0.205, -0.059, 0.036), (0.216, -0.064, 0.0)]
    base_y = -0.078
    c, ru, rv, ss = [], [], [], []
    for z, top, hw in Up:
        cy = A[1] + (top + base_y) / 2
        c.append((A[0], cy, z0 + z))
        ru.append(hw)
        rv.append(max((top - base_y) / 2, 0.0 if hw == 0 else 0.004))
        ss.append(z)
    loft(S, np.array(c), np.array(ru), np.array(rv), np.array(ss), nos((-0.1, {'Pe' + lado: 1}), (0.085, {'Pe' + lado: 1}), (0.145, {'Ponteira' + lado: 1}), (0.22, {'Ponteira' + lado: 1})),
         'tenis', n=3.0, sub=3, frame=(X_, Y_), fecha=(False, False))
    # sola (faixa branca com a ponta levemente arrebitada)
    So = [(-0.088, 0.0), (-0.083, 0.030), (-0.070, 0.039), (-0.045, 0.044), (-0.010, 0.0455), (0.025, 0.048), (0.060, 0.051), (0.100, 0.0545),
          (0.140, 0.055), (0.180, 0.0505), (0.205, 0.040), (0.217, 0.0)]
    c, ru, rv, ss = [], [], [], []
    for z, hw in So:
        mola = 0.010 * max(0.0, (z - 0.15) / 0.065) ** 2
        bot, top = -0.100 + mola, -0.069 + 0.004 * (1 if z < 0 else 0) + mola * 0.6
        c.append((A[0], A[1] + (bot + top) / 2, z0 + z))
        ru.append(hw)
        rv.append(max((top - bot) / 2, 0.0 if hw == 0 else 0.004))
        ss.append(z)
    loft(S, np.array(c), np.array(ru), np.array(rv), np.array(ss), nos((-0.1, {'Pe' + lado: 1}), (0.085, {'Pe' + lado: 1}), (0.145, {'Ponteira' + lado: 1}), (0.22, {'Ponteira' + lado: 1})),
         'sola', n=3.6, sub=3, frame=(X_, Y_), fecha=(False, False))
    # língua e cadarços: faixa fina sobre o peito do pé
    zs = np.arange(-0.012, 0.106, 0.014)
    tops = np.interp(zs, [u[0] for u in Up], [u[1] for u in Up])
    ct = np.array([(A[0], A[1] + tp + 0.0016, z0 + z) for z, tp in zip(zs, tops)])
    kk = len(zs)
    rr = np.full(kk, .0058)
    rr[0] = rr[-1] = .003
    loft(S, ct, rr, np.full(kk, .0034), zs, nos((-0.1, {'Pe' + lado: 1}), (0.2, {'Pe' + lado: 1})), 'tenis_detalhe', n=2.4, sub=2, nseg=10, frame=(X_, Y_), fecha=(True, True))


def braco(S, lado):
    O, Cv, W = REPOUSO['Braco' + lado], REPOUSO['Antebraco' + lado], REPOUSO['Mao' + lado]
    tab = [(-0.20, 0.0, 0.0), (-0.14, .040, .044), (-0.06, .060, .064), (0.04, .067, .070), (0.20, .062, .066), (0.38, .0575, .0605), (0.50, .0535, .0565),
           (0.53, .0568, .0598), (0.63, .0568, .0598), (0.66, .0525, .0555), (0.75, .050, .053),
           (0.95, .046, .049), (1.0, .045, .049), (1.10, .048, .052), (1.35, .048, .050), (1.65, .040, .042), (1.82, .035, .037), (1.86, .0405, .0425),
           (1.98, .0405, .0425), (2.03, .036, .038)]
    c, ru, rv, ss, _ = aneis_sobre([O, Cv, W], [0.0, 1.0, 2.0], tab)
    pesos = nos((-0.20, {'Peito': .55, 'Ombro' + lado: .45}), (-0.08, {'Peito': .30, 'Ombro' + lado: .40, 'Braco' + lado: .30}), (0.08, {'Ombro' + lado: .20, 'Braco' + lado: .80}),
                (0.30, {'Braco' + lado: 1}), (0.82, {'Braco' + lado: 1}), (1.0, {'Braco' + lado: .5, 'Antebraco' + lado: .5}), (1.18, {'Antebraco' + lado: 1}),
                (1.80, {'Antebraco' + lado: 1}), (2.0, {'Antebraco' + lado: .8, 'Mao' + lado: .2}))
    loft(S, c, ru, rv, ss, pesos, lambda s: 'jaqueta_faixa' if (1.84 <= s or 0.515 <= s <= 0.645) else 'jaqueta', n=2.0, sub=3, fecha=(True, False))
    # luva (mão fechada, relaxada)
    f = (W - Cv) / np.linalg.norm(W - Cv)
    Lh = 0.150
    tab = [(-0.20, .030, .032), (0.0, .029, .034), (0.18, .027, .041), (0.42, .029, .045), (0.65, .031, .041), (0.85, .027, .032), (1.0, 0.0, 0.0)]
    c = np.array([W + f * Lh * t[0] for t in tab])
    ru = np.array([t[1] for t in tab])
    rv = np.array([t[2] for t in tab])
    pw = nos((-0.2, {'Antebraco' + lado: .8, 'Mao' + lado: .2}), (0.1, {'Mao' + lado: 1}))
    loft(S, c, ru, rv, np.array([t[0] for t in tab]), pw, 'luva', n=2.3, sub=3, fecha=(False, False))
    # polegar
    sg = 1.0 if lado == 'E' else -1.0
    base_p = W + f * 0.035 + np.array([-sg * 0.012, 0, 0.030])
    ponta = W + f * 0.085 + np.array([-sg * 0.016, 0, 0.040])
    eixo = (ponta - base_p) / np.linalg.norm(ponta - base_p)
    elipsoide(S, (base_p + ponta) / 2, X_, np.cross(eixo, X_) / max(np.linalg.norm(np.cross(eixo, X_)), 1e-6), eixo, 0.012, 0.0125, 0.035, _w(**{'Mao' + lado: 1}), 'luva', aneis=8, nseg=14)


def construir():
    S = Superficie()
    torso(S)
    pescoco_cabeca(S)
    acessorios_cabeca(S)
    cachecol(S)
    for lado in 'ED':
        perna(S, lado)
        sapato(S, lado)
        braco(S, lado)
    return S
