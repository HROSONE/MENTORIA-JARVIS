"""Esculpe o adolescente com SDFs (campos de distância) e exporta teen.glb.
Cada parte (pele, camisa, calça, tênis, cabelo...) é uma malha contínua gerada por marching cubes."""
import json, sys, time
import numpy as np
from skimage import measure
import trimesh
import fast_simplification

OUT = sys.argv[1] if len(sys.argv) > 1 else 'teen.glb'

# ---------------- primitivas SDF ----------------
def V(*a): return np.array(a, dtype=np.float64)
def length(v): return np.sqrt((v * v).sum(-1))
def norm(v): return v / np.linalg.norm(v)
def sphere(P, c, r): return length(P - c) - r
def ellipsoid(P, c, r, R=None):
    q = P - c
    if R is not None: q = q @ R
    q0 = q / r; k0 = length(q0); k1 = length(q0 / r)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)
def capsule(P, a, b, ra, rb=None):
    rb = ra if rb is None else rb
    pa = P - a; ba = b - a
    h = np.clip((pa @ ba) / (ba @ ba), 0, 1)
    return length(pa - h[..., None] * ba) - (ra + (rb - ra) * h)
def chain(P, pts, radii, k):
    d = None
    for i in range(len(pts) - 1):
        c = capsule(P, pts[i], pts[i + 1], radii[i], radii[i + 1])
        d = c if d is None else smin(d, c, k)
    return d
def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)
def smax(a, b, k): return -smin(-a, -b, k)
def rotx(t): c, s = np.cos(t), np.sin(t); return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
def roty(t): c, s = np.cos(t), np.sin(t); return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
def rotz(t): c, s = np.cos(t), np.sin(t); return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
def sstep(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

# ---------------- medidas (metros; y para cima, z para frente) ----------------
def arm_frames(s):
    S = V(s * .162, 1.342, -.018)
    E = V(s * .19, 1.075, -.05)
    Wr = V(s * .118, .915, .045)
    dA = norm(E - S); dF = norm(Wr - E)
    return S, dA, E, dF, Wr

# ---------------- partes ----------------
HS = 1.12                      # cabeça maior (estilo animação)
PIV = V(0, 1.43, -.015)
def hscale(fn):
    def g(P):
        return fn(PIV + (P - PIV) / HS) * HS
    g.__name__ = fn.__name__
    return g
def hpt(p): return PIV + (np.asarray(p) - PIV) * HS
def unh(v): return PIV + (np.asarray(v) - PIV) / HS

CRANIUM = (V(0, 1.582, -.014), V(.079, .092, .094))

def head_base(P):
    """volumes principais do rosto (sem olhos/boca): cheio e arredondado, estilo animação"""
    d = ellipsoid(P, *CRANIUM)
    d = smin(d, ellipsoid(P, V(0, 1.532, .014), V(.06, .078, .07)), .035)
    for s in (1, -1):
        d = smin(d, ellipsoid(P, V(s * .04, 1.522, .043), V(.028, .023, .027)), .04)       # bochechas
        d = smin(d, capsule(P, V(s * .056, 1.505, -.02), V(s * .016, 1.458, .04), .017, .015), .04)  # mandíbula definida
    d = smin(d, ellipsoid(P, V(0, 1.456, .048), V(.02, .017, .018)), .018)                  # queixo
    d = smin(d, ellipsoid(P, V(0, 1.58, .055), V(.06, .022, .028)), .025)                   # testa / arco
    d = smin(d, ellipsoid(P, V(0, 1.501, .062), V(.026, .02, .016)), .02)                   # volume da boca
    return d

def surf_z(fn, x, y, z0=.15):
    lo, hi = -.05, z0
    for _ in range(40):
        m = (lo + hi) / 2
        if fn(V(x, y, m)[None])[0] < 0: lo = m
        else: hi = m
    return lo

EYE_R0 = .0185
_ez = surf_z(head_base, .031, 1.556)
EYE_L, EYE_R = V(.031, 1.556, _ez - EYE_R0 * .62), V(-.031, 1.556, _ez - EYE_R0 * .62)
_nz = surf_z(head_base, 0, 1.53)

def eye_lids(P, E, s):
    r = EYE_R0 + .0016
    q = P - E
    t = np.clip(q[..., 0] / (EYE_R0 * 1.12), -1, 1)
    xl = q[..., 0] * s
    yu = EYE_R0 * (.5 * (1 - t ** 2) + .12) + .0012 * np.clip(xl / .018, -1, 1)
    yl = -EYE_R0 * (.46 * (1 - t ** 2) + .1)
    opening = np.maximum.reduce([q[..., 1] - yu, yl - q[..., 1], -q[..., 2] + .002, np.abs(q[..., 0]) - EYE_R0 * 1.12])
    shell = smax(sphere(P, E, r), -sphere(P, E, EYE_R0 + .0003), .0003)
    return smax(shell, -opening, .001)

def head_skin(P):
    x, y, z = P[..., 0], P[..., 1], P[..., 2]
    d = head_base(P)
    # olhos: só o espaço do globo + pálpebras finas, sem órbita funda
    for E, s in ((EYE_L, 1), (EYE_R, -1)):
        d = smax(d, -sphere(P, E, EYE_R0 + .0009), .0025)
        d = smin(d, eye_lids(P, E, s), .0025)
    # nariz pequeno e arrebitado
    nz = _nz
    nose = capsule(P, V(0, 1.565, nz - .012), V(0, 1.531, nz + .014), .0058, .0082)
    nose = smin(nose, sphere(P, V(0, 1.5285, nz + .0145), .0094), .007)
    for s in (1, -1): nose = smin(nose, ellipsoid(P, V(s * .0092, 1.5235, nz + .005), V(.0068, .0058, .0068)), .005)
    d = smin(d, nose, .01)
    # boca: sorriso de canto, com bochecha levantando
    mz = surf_z(head_base, 0, 1.495)
    mz = mz + .001
    d = smin(d, ellipsoid(P, V(0, 1.4985, mz - .003), V(.0195, .0032, .0078)), .005)
    d = smin(d, ellipsoid(P, V(0, 1.4905, mz - .0035), V(.016, .0042, .008)), .005)
    mp = [V(-.0245, 1.5015, mz - .0105), V(-.0135, 1.4955, mz - .002), V(0, 1.4943, mz + .0004), V(.0135, 1.496, mz - .002), V(.0255, 1.5035, mz - .011)]
    d = smax(d, -chain(P, mp, [.001, .0009, .0009, .0009, .001], .002), .0012)
    for s in (1, -1):
        R = rotz(s * .12) @ roty(-s * .25)
        ear = ellipsoid(P, V(s * .08, 1.55, -.012), V(.0105, .026, .017), R)
        ear = smax(ear, -sphere(P, V(s * .089, 1.548, -.006), .0078), .004)
        d = smin(d, ear, .006)
    d = smin(d, capsule(P, V(0, 1.37, -.02), V(0, 1.49, -.018), .042), .04)
    return d

def eyebrows(P):
    d = None
    for s in (1, -1):
        pts = []
        for xx, yy in ((.012, 1.5775), (.028, 1.5835), (.046, 1.5805)):
            pts.append(V(s * xx, yy, surf_z(head_base, s * xx, yy) + .0012))
        c = chain(P, pts, [.0044, .0047, .0026], .004)
        d = c if d is None else np.minimum(d, c)
    return d

def skull(u, v, off):
    """ponto na superfície do crânio: u = azimute (0 = frente, +x à esquerda), v = elevação"""
    c, r = CRANIUM
    d = np.array([np.cos(v) * np.sin(u), np.sin(v), np.cos(v) * np.cos(u)])
    p = c + r * d
    n = d / r; n = n / np.linalg.norm(n)
    return p + n * off

def hair_clumps():
    cl = []
    def strand(u0, v0, v1, lift, r, du=.0, n=5, curl=0.0):
        pts, rad = [], []
        for i in range(n):
            t = i / (n - 1)
            u = u0 + du * t
            v = v0 + (v1 - v0) * t
            off = .0018 + lift * np.sin(np.pi * min(1, t * 1.15)) ** .8
            p = skull(u, v, off)
            if curl and t < .45: p = p + V(0, curl * .5 * np.sin(np.pi * t / .45), curl * np.sin(np.pi * t / .45))
            pts.append(p); rad.append(r * (.45 + .55 * np.sin(np.pi * (.08 + .84 * t))))
        cl.append((pts, rad))
    # topete (fileira da frente) — onda mais alta no centro
    for i in range(15):
        k = (i - 7) / 7; h = 1 - .55 * k * k
        strand(k * .72, .46, 1.55, .045 * h, .016, du=-k * .2, n=7, curl=.016 * h)
    # segunda fileira atrás do topete
    for i in range(13):
        k = (i - 6) / 6; h = 1 - .5 * k * k
        strand(k * .78, .62, 1.75, .028 * h, .015, du=-k * .25, n=6)
    # topo
    for i in range(11):
        k = (i - 5) / 5
        strand(k * .85, .85, 2.0, .014, .014, du=-k * .2, n=5)
    # laterais (curtas, rentes) — sobem para trás
    for sgn in (1, -1):
        for j in range(8):
            u = sgn * (.95 + j * .2)
            strand(u, .22 + .03 * j, .95, .0035, .0075, du=sgn * .15, n=4)
            strand(u + sgn * .1, .5, 1.25, .005, .0085, du=sgn * .1, n=4)
    # nuca: sobem até a coroa
    for j in range(14):
        u = np.pi + (j - 6.5) * .17
        strand(u, -.18, .55, .004, .008, n=4)
        strand(u * 1.0, .35, 1.2, .008, .011, n=4)
    return cl
HAIR_CLUMPS = hair_clumps()

SPIKES = []
def _spikes():
    rs = np.random.RandomState(11)
    c, r = CRANIUM
    for i in range(46):
        u = rs.uniform(-.95, .95); v = rs.uniform(.55, 1.45)
        if abs(u) > .75 and v < .85: continue
        base = skull(u, v, .014)
        n = norm((base - c) / r ** 2)
        front = sstep(1.25, .6, v)
        dirv = norm(n * .45 + V(0, 1, 0) * .8 + V(0, 0, .55 * front - .45 * (1 - front)) + V(-np.sin(u) * .2, 0, 0) + rs.uniform(-.22, .22, 3))
        L = rs.uniform(.04, .06) + .03 * front
        bend = V(0, -.004, -.012)
        tip = base + dirv * L + bend
        mid = base + dirv * L * .5
        SPIKES.append(([base - n * .012, mid, tip], [rs.uniform(.017, .022), .0105, .0012]))
_spikes()

def hair(P):
    x, y, z = P[..., 0], P[..., 1], P[..., 2]
    sk = ellipsoid(P, *CRANIUM)
    hl = 1.505 + .07 * sstep(-.088, -.035, z) + .075 * sstep(.025, .068, z)
    t = .0016 + .004 * sstep(1.57, 1.635, y)
    side = smax(sk - t, hl - y, .0025)
    for sgn in (1, -1):
        side = smax(side, -ellipsoid(P, V(sgn * .084, 1.55, -.008), V(.028, .04, .028)), .004)
    top = ellipsoid(P, V(0, 1.656, .008), V(.074, .058, .096))
    top = smax(top, 1.615 - y + .02 * sstep(.05, .095, z), .016)
    d = smin(side, top, .012)
    if np.ndim(P) == 4:
        lo = P.reshape(-1, 3).min(0); hi = P.reshape(-1, 3).max(0)
    for pts, rad in SPIKES:
        d = smin(d, chain(P, pts, rad, .005), .012)
    d = smax(d, -(sk + .0005), .001)
    onTop = sstep(1.63, 1.66, y)
    g = .0011 * np.abs(np.sin(x * 260 + 3 * np.sin(z * 40 + y * 30))) * onTop + .0003 * np.abs(np.sin(z * 260 + y * 70)) * (1 - onTop)
    return d + g

def shirt(P):
    x, y, z = P[..., 0], P[..., 1], P[..., 2]
    d = ellipsoid(P, V(0, 1.235, .004), V(.142, .15, .094))
    d = smin(d, ellipsoid(P, V(0, 1.0, 0), V(.142, .22, .093)), .07)
    d = smin(d, ellipsoid(P, V(0, .935, -.004), V(.156, .06, .104)), .04)
    for s in (1, -1):
        S, dA, E, dF, Wr = arm_frames(s)
        d = smin(d, capsule(P, V(s * .045, 1.37, -.018), S, .05), .055)
        d = smin(d, capsule(P, V(0, 1.396, -.02), V(s * .1, 1.37, -.02), .03), .04)
        end = S + .125 * dA
        sl = capsule(P, S - .02 * dA, end + .02 * dA, .052, .05)
        sl = smax(sl, (P - end) @ dA, .005)
        sl = smax(sl, -capsule(P, end - .02 * dA, end + .05 * dA, .042), .003)
        hem = length((P - end) - ((P - end) @ dA)[..., None] * dA) - .049
        hem = np.sqrt(hem ** 2 + (((P - end) @ dA) + .006) ** 2) - .0045
        d = smin(d, sl, .03); d = smin(d, hem, .003)
    d = smax(d, .878 - y + .005 * np.sin(x * 20), .01)
    neck = capsule(P, V(0, 1.39, -.018), V(0, 1.6, -.018), .05)
    d = smax(d, -neck, .006)
    rib = np.sqrt((length(np.stack([x / 1.0, (z + .018) / .96], -1)) - .054) ** 2 + (y - 1.395 - .012 * sstep(-.02, .05, z) * 0) ** 2) - .0055
    d = smin(d, rib, .004)
    folds = .0016 * np.sin(y * 90 + np.sin(x * 22) * 2) * (1 - sstep(.98, 1.1, y)) + .001 * np.sin(x * 55 + y * 38) * sstep(1.22, 1.32, y)
    return d + folds

def arms_skin(P, s):
    S, dA, E, dF, Wr = arm_frames(s)
    d = capsule(P, S + .03 * dA, E, .04, .032)
    d = smin(d, sphere(P, E - .004 * dA, .031), .012)
    d = smin(d, capsule(P, E, Wr, .033, .024), .014)
    d = smin(d, capsule(P, E + .03 * dF, E + .1 * dF, .035, .031), .02)
    hand = ellipsoid(P, Wr + dF * .045 + V(0, -.004, -.004), V(.018, .038, .03))
    d = smin(d, hand, .012)
    return d

def pants(P):
    x, y, z = P[..., 0], P[..., 1], P[..., 2]
    d = ellipsoid(P, V(0, .925, -.006), V(.152, .1, .1))
    d = smin(d, ellipsoid(P, V(0, .985, -.004), V(.142, .04, .094)), .03)
    for s in (1, -1):
        H, K, A = V(s * .084, .86, -.004), V(s * .09, .47, .012), V(s * .098, .095, -.006)
        leg = smin(capsule(P, H, K, .07, .056), capsule(P, K, A, .055, .054), .03)
        d = smin(d, leg, .045)
        # volume das mãos nos bolsos
        Sx, dAx, Ex, dFx, Wx = arm_frames(s)
        d = smin(d, ellipsoid(P, Wx + dFx * .045 + V(0, -.004, -.004), V(.026, .046, .038)), .025)
        # barra amontoada no tênis
        d = smin(d, capsule(P, V(s * .098, .135, -.012), V(s * .098, .16, -.006), .058), .02)
    d = smax(d, .125 - y + .02 * sstep(-.02, .06, z), .006)
    d = smax(d, y - 1.008, .006)
    q = np.sqrt((x / .143) ** 2 + ((z + .004) / .095) ** 2) - 1
    band = np.sqrt((q * .12) ** 2 + (y - .99) ** 2) - .011
    d = smax(d, y - .965, .006)
    # aberturas dos bolsos da frente (sulco)
    for s in (1, -1):
        pk = capsule(P, V(s * .085, .985, .088), V(s * .14, .905, .06), .0022)
        d = smax(d, -pk, .002)
    # costuras (sulcos leves)
    seam = np.minimum(np.abs(np.abs(x) - .158 + .07 * sstep(.86, .1, y) * 0), 1) 
    knee = np.exp(-((y - .47) / .05) ** 2)
    ank = 1 - sstep(.1, .3, y)
    folds = .0034 * np.sin(y * 140 + x * 25) * ank + .0018 * np.sin(y * 110 - z * 30) * knee + .001 * np.sin(y * 45 + x * 50) * sstep(.5, .8, y)
    return d + folds

def _shoe_top_fn():
    def body(P):
        x0 = .1
        heel, toe = V(x0, .052, -.065), V(x0 + .006, .04, .13)
        up = capsule(P, heel, toe, .046, .031)
        up = smin(up, ellipsoid(P, V(x0, .086, -.03), V(.044, .055, .055)), .02)
        up = smin(up, ellipsoid(P, V(x0 + .003, .066, .045), V(.039, .026, .06), rotx(-.2)), .02)
        tong = ellipsoid(P, V(x0, .108, .0), V(.022, .012, .045), rotx(-.5))
        return smin(up, tong, .006)
    def top(z):
        lo, hi = .02, .2
        for _ in range(30):
            m = (lo + hi) / 2
            if body(V(.1, m, z)[None])[0] < 0: lo = m
            else: hi = m
        return lo
    return top
SHOE_TOP = _shoe_top_fn()

def shoe_parts(P, s):
    x0 = s * .1
    heel, toe = V(x0, .052, -.065), V(x0 + s * .006, .04, .13)
    up = capsule(P, heel, toe, .046, .031)
    up = smin(up, ellipsoid(P, V(x0, .086, -.03), V(.044, .055, .055)), .02)
    up = smin(up, ellipsoid(P, V(x0 + s * .003, .066, .045), V(.039, .026, .06), rotx(-.2)), .02)
    up = smax(up, .03 - P[..., 1], .004)
    up = smax(up, -capsule(P, V(x0, .118, -.042), V(x0, .2, -.042), .033), .005)
    # língua e cadarços
    tong = ellipsoid(P, V(x0, .108, .0), V(.022, .012, .045), rotx(-.5))
    up = smin(up, tong, .006)
    for i in range(5):
        zz = .07 - i * .018; yy = SHOE_TOP(zz) + .001
        lace = capsule(P, V(x0 - .017, yy, zz), V(x0 + .017, yy + .002, zz - .004), .0026)
        up = smin(up, lace, .0012)
        up = smin(up, capsule(P, V(x0 - .017, yy, zz), V(x0 + .017, yy, zz - .014), .0022), .0012)
    sole = capsule(P, heel + V(0, -.016, -.004), toe + V(0, -.012, .006), .049, .036)
    sole = smax(sole, P[..., 1] - .034, .003)
    sole = smax(sole, -P[..., 1], .002)
    sole = sole + .0006 * np.sin(P[..., 2] * 300) * sstep(.005, .02, P[..., 1])
    return up, sole

def eye_whites(P):  # só para referência visual (as esferas reais são feitas no three.js)
    return np.minimum(sphere(P, EYE_L, EYE_R0), sphere(P, EYE_R, EYE_R0))

# ---------------- malha ----------------
TARGET = {}
def mesh_from(fn, lo, hi, h, smooth=6):
    t0 = time.time()
    lo, hi = np.array(lo), np.array(hi)
    n = np.ceil((hi - lo) / h).astype(int) + 1
    xs = [np.linspace(lo[i], lo[i] + (n[i] - 1) * h, n[i]) for i in range(3)]
    G = np.stack(np.meshgrid(*xs, indexing='ij'), -1)
    vol = fn(G).astype(np.float32)
    verts, faces, _, _ = measure.marching_cubes(vol, 0.0, spacing=(h, h, h))
    verts += lo
    m = trimesh.Trimesh(verts, faces, process=True)
    if m.volume < 0: m.invert()
    trimesh.smoothing.filter_taubin(m, lamb=.5, nu=-.53, iterations=smooth)
    if TARGET.get('n') and len(m.faces) > TARGET['n']:
        pv, fv = fast_simplification.simplify(m.vertices.astype(np.float32), m.faces.astype(np.int32), 1 - TARGET['n'] / len(m.faces))
        m = trimesh.Trimesh(pv, fv, process=True)
        if m.volume < 0: m.invert()
    e = m.vertices[m.edges_unique]; el = np.linalg.norm(e[:, 0] - e[:, 1], axis=1)
    bad = el > h * 12
    if bad.any():
        badv = set(m.edges_unique[bad].ravel().tolist())
        keep = ~np.isin(m.faces, list(badv)).any(1)
        m.update_faces(keep); m.remove_unreferenced_vertices()
        print('    removidas', (~keep).sum(), 'faces ruins')
    print(f'  {fn.__name__ if hasattr(fn, "__name__") else "part"}: {len(m.faces)} tris, grid {tuple(n)}, {time.time() - t0:.1f}s', flush=True)
    return m

def colorize(m, fn):
    c = fn(m.vertices)
    c = np.clip(c, 0, 1) ** 2.2  # linear
    m.visual.vertex_colors = np.clip(np.concatenate([c, np.ones((len(c), 1))], 1) * 255, 0, 255).astype(np.uint8)

def skin_color(v, head=False):
    if head: v = unh(v)
    x, y, z = v[:, 0], v[:, 1], v[:, 2]
    base = np.array([.93, .69, .53])
    c = np.tile(base, (len(v), 1))
    blush = np.exp(-(((np.abs(x) - .042) / .02) ** 2 + ((y - 1.516) / .016) ** 2)) * (z > .03) * 2.2
    lips = np.exp(-((x / .018) ** 2 + ((y - 1.4945) / .0055) ** 2)) * (z > .065) * 1.1
    ears = np.exp(-(((np.abs(x) - .085) / .015) ** 2 + ((y - 1.545) / .03) ** 2))
    nose = np.exp(-((x / .015) ** 2 + ((y - 1.527) / .012) ** 2)) * (z > .09)
    knuck = 0
    c = c * (1 - .1 * blush[:, None]) + np.array([.95, .55, .5]) * .1 * blush[:, None]
    c = c * (1 - .55 * lips[:, None]) + np.array([.78, .45, .42]) * .55 * lips[:, None]
    c = c * (1 - .18 * ears[:, None]) + np.array([.93, .6, .52]) * .18 * ears[:, None]
    c = c * (1 - .12 * nose[:, None]) + np.array([.95, .62, .52]) * .12 * nose[:, None]
    if head:
        cr = ((x / .079) ** 2 + ((y - 1.58) / .093) ** 2 + ((z + .012) / .096) ** 2)
        hl = 1.49 + .058 * sstep(-.085, -.02, z)
        zone = np.maximum(sstep(.055, .07, np.abs(x)) * (1 - sstep(.0, .035, z)), 1 - sstep(-.07, -.03, z))
        ear_gap = np.exp(-(((np.abs(x) - .08) / .016) ** 2 + ((y - 1.55) / .028) ** 2))
        fade = 0 * y
        c = c * (1 - .78 * fade[:, None]) + np.array([.22, .15, .1]) * .78 * fade[:, None]
    return c

def shoe_color(v):
    x, y, z = v[:, 0], v[:, 1], v[:, 2]
    c = np.tile([.96, .96, .95], (len(v), 1))
    inner = (y > .095) & (z < -.01)
    c[inner] = [.85, .85, .84]
    return c

def pants_color(v):
    x, y, z = v[:, 0], v[:, 1], v[:, 2]
    c = np.tile([.12, .26, .62], (len(v), 1))
    rs = np.random.RandomState(1); c = c * (1 + .06 * rs.randn(len(v), 1))
    stitch = np.array([.85, .62, .3])
    # costura lateral, entreperna, braguilha, cós, bolsos
    side = np.abs(np.abs(x) - (.155 - .055 * sstep(.86, .1, y) * 0)) < .0035
    a = np.arctan2(x, z)
    outer = (np.abs(np.abs(a) - np.pi / 2) < .03) & (y < .95)
    fly = (np.abs(x - .012) < .0025) & (y > .86) & (y < .975) & (z > 0) | ((np.abs(y - .865) < .0025) & (x > -.0) & (x < .014) & (z > 0))
    band = (np.abs(y - .978) < .0022) | (np.abs(y - 1.0) < .0022)
    pocket = np.zeros(len(v), bool)
    for s in (1, -1):
        t = (x * s - .085) / .055; yy = .985 - t * .08
        pocket |= (t > 0) & (t < 1) & (np.abs(y - yy) < .0035) & (z > 0)
        bx, by = x * s - .075, y - .895
        bp = (z < -.02) & (np.abs(bx) < .042) & (by > -.05) & (by < .035)
        edge = bp & ((np.abs(np.abs(bx) - .04) < .003) | (np.abs(by - .033) < .003) | (np.abs(by + .045 - np.abs(bx) * .2) < .003))
        pocket |= edge
    hem = (y < .2) & (np.abs(y - (.142 + .02 * sstep(-.02, .06, z))) < .003)
    for m in (outer, fly, band, pocket, hem):
        c[m] = c[m] * .3 + stitch * .7
    fade = np.exp(-(((np.abs(x) - .09) / .045) ** 2 + ((y - .66) / .14) ** 2)) * (z > 0)
    c = c * (1 - .3 * fade[:, None]) + np.array([.3, .48, .82]) * .3 * fade[:, None]
    knee = np.exp(-(((np.abs(x) - .092) / .035) ** 2 + ((y - .47) / .05) ** 2)) * (z > .03)
    c = c * (1 - .2 * knee[:, None]) + np.array([.32, .5, .85]) * .2 * knee[:, None]
    return c

if __name__ == '__main__':
    t = time.time(); parts = {}
    print('esculpindo...', flush=True)
    TARGET['n'] = 160000
    m = mesh_from(hscale(head_skin), hpt((-.1, 1.36, -.12)), hpt((.1, 1.68, .13)), .0014); colorize(m, lambda v: skin_color(v, True)); parts['skin_head'] = m
    for s, nm in ((1, 'skin_arm_L'), (-1, 'skin_arm_R')):
        S, dA, E, dF, Wr = arm_frames(s)
        pts = np.array([S, E, Wr, Wr + dF * .1])
        lo, hi = pts.min(0) - .06, pts.max(0) + .06
        f = (lambda P, s=s: arms_skin(P, s)); f.__name__ = nm
        TARGET['n'] = 40000
        m = mesh_from(f, lo, hi, .0017); colorize(m, skin_color); parts[nm] = m
    TARGET['n'] = 0
    m = mesh_from(hscale(eyebrows), hpt((-.07, 1.555, .06)), hpt((.07, 1.6, .1)), .0012, smooth=4); parts['brows'] = m
    TARGET['n'] = 70000
    m = mesh_from(hscale(hair), hpt((-.105, 1.47, -.125)), hpt((.105, 1.79, .16)), .0013, smooth=2); parts['hair'] = m
    TARGET['n'] = 60000
    m = mesh_from(shirt, (-.3, .86, -.13), (.3, 1.46, .13), .0026); parts['shirt'] = m
    TARGET['n'] = 90000
    m = mesh_from(pants, (-.2, .05, -.13), (.2, 1.03, .13), .0026); colorize(m, pants_color); parts['pants'] = m
    for s, nm in ((1, 'shoe_L'), (-1, 'shoe_R')):
        f = (lambda P, s=s: shoe_parts(P, s)[0]); f.__name__ = nm + '_upper'
        TARGET['n'] = 30000
        m = mesh_from(f, (s * .1 - .07, 0, -.13), (s * .1 + .07, .14, .19), .0016); colorize(m, shoe_color); parts[nm + '_upper'] = m
        f = (lambda P, s=s: shoe_parts(P, s)[1]); f.__name__ = nm + '_sole'
        TARGET['n'] = 8000
        m = mesh_from(f, (s * .1 - .07, -.01, -.13), (s * .1 + .07, .04, .19), .0022); parts[nm + '_sole'] = m
    scene = trimesh.Scene()
    for k, m in parts.items(): scene.add_geometry(m, node_name=k, geom_name=k)
    scene.export(OUT)
    meta = {'eyeL': hpt(EYE_L).tolist(), 'eyeR': hpt(EYE_R).tolist(), 'eyeR0': EYE_R0 * HS}
    json.dump(meta, open(OUT.replace('.glb', '.json'), 'w'))
    print('total tris', sum(len(m.faces) for m in parts.values()), f'{time.time() - t:.1f}s')
