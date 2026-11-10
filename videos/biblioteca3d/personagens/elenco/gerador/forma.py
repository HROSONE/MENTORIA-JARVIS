"""Ferramentas de malha do elenco: superfícies por seções (lofts de superelipses) com pesos de pele por vértice, UV, cor por vértice,
elipsoides, tubos e ruído. A malha é construída na pose de repouso do esqueleto.
Anel com ru=rv=0 vira polo (ponta arredondada); `fecha` põe tampa nas pontas abertas."""
import math
import numpy as np

X_, Y_, Z_ = np.array([1.0, 0, 0]), np.array([0, 1.0, 0]), np.array([0, 0, 1.0])


def suave(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def unit(v):
    v = np.asarray(v, dtype=float)
    return v / np.linalg.norm(v)


def catmull(P, sub):
    """interpolação Catmull-Rom uniforme que passa pelos pontos de controle (P: (K,d))"""
    P = np.asarray(P, dtype=float)
    if P.ndim == 1:
        P = P[:, None]
    if sub == 1:
        return P
    ext = np.vstack([2 * P[0] - P[1], P, 2 * P[-1] - P[-2]])
    out = []
    for i in range(len(P) - 1):
        p0, p1, p2, p3 = ext[i], ext[i + 1], ext[i + 2], ext[i + 3]
        for k in range(sub):
            t = k / sub
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-1])
    return np.array(out)


def caminho(pontos, s_nos, s):
    """posição numa polilinha cujos pontos têm parâmetros s_nos; fora do intervalo prolonga o primeiro/último trecho"""
    pontos = [np.asarray(p, dtype=float) for p in pontos]
    if s <= s_nos[0]:
        return pontos[0] + (pontos[1] - pontos[0]) * (s - s_nos[0]) / (s_nos[1] - s_nos[0])
    if s >= s_nos[-1]:
        return pontos[-1] + (pontos[-1] - pontos[-2]) * (s - s_nos[-1]) / (s_nos[-1] - s_nos[-2])
    i = int(np.searchsorted(s_nos, s, side='right')) - 1
    t = (s - s_nos[i]) / (s_nos[i + 1] - s_nos[i])
    return pontos[i] * (1 - t) + pontos[i + 1] * t


def aneis_sobre(pontos, s_nos, tabela):
    """tabela: (s, ru, rv[, n]) -> arrays (centros sobre a polilinha, ru, rv, s, n)"""
    c, ru, rv, n, ss = [], [], [], [], []
    for linha in tabela:
        c.append(caminho(pontos, s_nos, linha[0]))
        ru.append(linha[1])
        rv.append(linha[2])
        n.append(linha[3] if len(linha) > 3 else 2.0)
        ss.append(linha[0])
    return np.array(c), np.array(ru), np.array(rv), np.array(ss), np.array(n)


def _hash3(ix, iy, iz, seed):
    h = np.sin(ix * 127.1 + iy * 311.7 + iz * 74.7 + seed * 19.19) * 43758.5453
    return h - np.floor(h)


def ruido3(P, f, seed=0):
    """ruído de valor 3D suave em [0,1] (P: (n,3))"""
    Q = np.asarray(P, dtype=float) * f
    i = np.floor(Q)
    fr = Q - i
    u = fr * fr * (3 - 2 * fr)
    out = 0
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (u[:, 0] if dx else 1 - u[:, 0]) * (u[:, 1] if dy else 1 - u[:, 1]) * (u[:, 2] if dz else 1 - u[:, 2])
                out = out + w * _hash3(i[:, 0] + dx, i[:, 1] + dy, i[:, 2] + dz, seed)
    return out


# ------------------------------------------------------------------ contêiner
class Superficie:
    """acumula vértices (posição, normal, pesos completos por osso, UV, cor) e triângulos com chave de material"""

    def __init__(self, nb):
        self.nb = nb
        self.P, self.N, self.W, self.UV, self.COR, self.T, self.M = [], [], [], [], [], [], []
        self.n = 0

    def add(self, P, N, W, UV, COR, T, mats):
        self.P.append(P)
        self.N.append(N)
        self.W.append(W)
        self.UV.append(UV)
        self.COR.append(COR)
        self.T.append(np.asarray(T, dtype=np.int64) + self.n)
        self.M.extend(mats)
        self.n += len(P)

    def contagem_tris(self):
        return int(sum(len(t) for t in self.T))

    def prims(self, materiais):
        """agrupa por material -> lista de (chave, positions, normals, indices, joints, weights, uvs|None, colors|None)"""
        P, N, W, UV, COR = np.vstack(self.P), np.vstack(self.N), np.vstack(self.W), np.vstack(self.UV), np.vstack(self.COR)
        T = np.vstack(self.T)
        M = np.array(self.M)
        top = np.argsort(-W, axis=1)[:, :4]
        Wt = np.take_along_axis(W, top, axis=1)
        Wt = np.where(Wt < 1e-4, 0.0, Wt)
        Wt = Wt / np.maximum(Wt.sum(axis=1, keepdims=True), 1e-9)
        J = np.where(Wt > 0, top, 0).astype('<u2')
        saida = []
        for chave in dict.fromkeys(self.M):
            sel = T[M == chave]
            usados, inv = np.unique(sel.reshape(-1), return_inverse=True)
            m = materiais[chave]
            uv = UV[usados] if getattr(m, 'texture', None) is not None else None
            cor = np.clip(COR[usados], 0.0, 1.0)                                  # COLOR_0 deve ficar em 0..1
            cor = None if np.allclose(cor, 1.0, atol=1e-3) else cor
            saida.append((chave, P[usados], N[usados], inv.reshape(-1, 3), J[usados], Wt[usados].astype('<f4'), uv, cor))
        return saida


def nos(nb, indice, *ks):
    """função de pesos a partir de nós (s, {osso: peso}); entre dois nós a mistura usa smoothstep"""
    ks = sorted(ks, key=lambda k: k[0])
    vec = []
    for s, d in ks:
        w = np.zeros(nb)
        for nome, p in d.items():
            w[indice[nome]] = p
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


def osso(nb, indice, **kw):
    w = np.zeros(nb)
    for k, v in kw.items():
        w[indice[k]] = v
    return w / w.sum()


# ------------------------------------------------------------------ loft
def loft(S, c, ru, rv, s, pesos, mat, n=2.0, nseg=32, sub=4, frame='auto', fecha=(True, True), fechado=False, ajuste=None, uv=None, cor=None, recorte=None):
    """superfície de anéis. c:(K,3) centros, ru/rv:(K,) semieixos, s:(K,) parâmetro da cadeia (pesos e material),
    pesos: f(s)->vetor (nb,) | vetor, mat: chave fixa ou f(s)->chave, frame: 'auto' | (u,v) fixos | 'toro',
    uv: (tile_u, tile_v) em metros (gera coordenadas de textura repetidas), cor: f(P, N, s_anel)->(n,3) multiplicador de cor por vértice,
    recorte: f(centroides)->máscara de triângulos a descartar (buracos)."""
    c = np.asarray(c, dtype=float)
    K = len(c)
    n = np.broadcast_to(np.asarray(n, dtype=float), (K,)).copy()
    base = np.column_stack([c, np.broadcast_to(ru, (K,)), np.broadcast_to(rv, (K,)), n, s])
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
    V = C[:, None, :] + Uu[:, None, :] * (RU[:, None] * px)[:, :, None] + Vv[:, None, :] * (RV[:, None] * py)[:, :, None]     # (R, nseg, 3)
    # normais por diferenças finitas (suaves, sem depender da triangulação)
    t1 = np.roll(V, -1, axis=1) - np.roll(V, 1, axis=1)
    if fechado:
        t2 = np.roll(V, -1, axis=0) - np.roll(V, 1, axis=0)
    else:
        t2 = np.gradient(V, axis=0)
    Nv = np.cross(t1, t2)
    ln = np.linalg.norm(Nv, axis=2, keepdims=True)
    fallback = (V - C[:, None, :])
    fallback /= np.maximum(np.linalg.norm(fallback, axis=2, keepdims=True), 1e-9)
    Nv = np.where(ln > 1e-12, Nv / np.maximum(ln, 1e-12), fallback)
    if float(np.einsum('ijk,ijk->', Nv, V - C[:, None, :])) < 0:                 # normais para fora
        Nv = -Nv
    polo = [(RU[0] < 1e-6 and RV[0] < 1e-6), (RU[-1] < 1e-6 and RV[-1] < 1e-6)]
    if not fechado:
        if polo[0]:
            Nv[0] = -d[0]
        if polo[1]:
            Nv[-1] = d[-1]
    # vértices expandidos (coluna extra repete a emenda para as coordenadas de textura)
    cols = np.arange(nseg + 1) % nseg
    Pe = V[:, cols].reshape(-1, 3)
    Ne = Nv[:, cols].reshape(-1, 3)
    nc = nseg + 1
    nr = R if fechado else R - 1
    i = np.arange(nr)[:, None]
    j = np.arange(nseg)[None, :]
    i2 = (i + 1) % R
    a, b, c_, d_ = i * nc + j, i * nc + j + 1, i2 * nc + j + 1, i2 * nc + j
    tri = np.stack([np.stack([a, b, c_], -1), np.stack([a, c_, d_], -1)], axis=2).reshape(-1, 3)
    ms = np.repeat(np.arange(nr), nseg * 2)
    fn = np.cross(Pe[tri[:, 1]] - Pe[tri[:, 0]], Pe[tri[:, 2]] - Pe[tri[:, 0]])
    if float(np.einsum('ij,ij->i', fn, Ne[tri[:, 0]]).sum()) < 0:                # faces voltadas como as normais
        tri = tri[:, [0, 2, 1]]
    if recorte is not None:                                                      # buraco (boca): descarta os triângulos que `recorte(centroide)` marcar
        manter = ~np.asarray(recorte(Pe[tri].mean(axis=1)), dtype=bool)
        tri, ms = tri[manter], ms[manter]
    Pall, Nall = Pe, Ne
    ring_idx = np.repeat(np.arange(R), nc)
    # coordenadas de textura
    UVv = np.zeros((len(Pe), 2))
    if uv is not None:
        per = 2 * np.pi * 0.5 * (RU + RV)
        arc = np.cumsum(np.concatenate([[0.0], np.linalg.norm(np.diff(C, axis=0), axis=1)]))
        UVv = np.column_stack([(np.tile(np.arange(nc) / nseg, R) * np.repeat(per, nc)) / uv[0], np.repeat(arc, nc) / uv[1]])
    # tampas das pontas abertas
    tri_extra, ms_extra, caps = [], [], []
    if not fechado:
        for fim_, anel, sentido in ((0, 0, -1.0), (1, R - 1, 1.0)):
            if polo[fim_] or not fecha[fim_]:
                continue
            ci = len(Pall)
            Pall = np.vstack([Pall, C[anel][None, :]])
            Nall = np.vstack([Nall, (sentido * d[anel])[None, :]])
            UVv = np.vstack([UVv, UVv[anel * nc:(anel + 1) * nc].mean(axis=0, keepdims=True)])
            ring_idx = np.concatenate([ring_idx, [anel]])
            dirn = sentido * d[anel]
            for jj in range(nseg):
                p0, p1 = Pall[anel * nc + jj], Pall[anel * nc + jj + 1]
                t = (ci, anel * nc + jj, anel * nc + jj + 1)
                if float(np.dot(np.cross(p0 - C[anel], p1 - C[anel]), dirn)) < 0:
                    t = (t[0], t[2], t[1])
                tri_extra.append(t)
                ms_extra.append(max(anel - (1 if sentido > 0 else 0), 0))
            caps.append(anel)
    if tri_extra:
        tri = np.vstack([tri, np.array(tri_extra, dtype=np.int64)])
        ms = np.concatenate([ms, np.array(ms_extra)])
    Wr = np.array([pesos(float(SS[k])) if callable(pesos) else pesos for k in range(R)])
    Wv = Wr[ring_idx]
    if ajuste is not None:
        ajuste(Pall, Wv)
    CORv = np.ones((len(Pall), 3))
    if cor is not None:
        CORv = np.asarray(cor(Pall, Nall, SS[ring_idx]), dtype=float)
    chaves = []
    for m in ms:
        s_m = 0.5 * (SS[int(m)] + SS[min(int(m) + 1, R - 1)])
        chaves.append(mat if isinstance(mat, str) else mat(float(s_m)))
    S.add(Pall, Nall, Wv, UVv, CORv, tri, chaves)
    return Pall


def elipsoide(S, centro, eixo_u, eixo_v, eixo_a, ru, rv, ra, pesos, mat, aneis=9, nseg=20, cor=None, n=2.0):
    """elipsoide com polos ao longo do eixo `a`; ru/rv são os semieixos nos eixos u e v"""
    centro = np.asarray(centro, dtype=float)
    ph = np.linspace(0, np.pi, aneis)
    c = np.array([centro + np.asarray(eixo_a, dtype=float) * (-ra * math.cos(p)) for p in ph])
    return loft(S, c, np.array([ru * math.sin(p) for p in ph]), np.array([rv * math.sin(p) for p in ph]), np.zeros(aneis), lambda s: pesos, mat, n=n,
                nseg=nseg, sub=1, frame=(eixo_u, eixo_v), fecha=(False, False), cor=cor)


def tubo(S, pts, raios, pesos, mat, nseg=10, sub=2, fecha=(True, True), n=2.0, cor=None, achatamento=1.0, frame='auto'):
    """tubo ao longo de uma polilinha; raios por ponto (ou um valor); `achatamento` escala o semieixo v"""
    pts = np.asarray(pts, dtype=float)
    K = len(pts)
    r = np.broadcast_to(np.asarray(raios, dtype=float), (K,))
    return loft(S, pts, r, r * achatamento, np.arange(K, dtype=float), pesos, mat, n=n, nseg=nseg, sub=sub, fecha=fecha, cor=cor, frame=frame)
