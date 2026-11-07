"""Pele contínua do stickman (pose A), gerada por SDF + marching cubes. Exporta skin.json (base64)."""
import sys, json, base64
sys.path.insert(0, '../teen')
import numpy as np
from skimage import measure
import trimesh, fast_simplification
from teen_model import V, sphere, ellipsoid, capsule, smin, smax, sstep, length

A = np.radians(45)
HIP_Y, SPINE, CHEST_OFF = .95, .28, .05
CH = V(0, HIP_Y + SPINE, 0)
def arm(s):
    S = CH + V(s * .2, .05, 0)
    d = V(s * np.sin(A), -np.cos(A), 0)
    E = S + .3 * d; W = E + .27 * d; Hc = W + .045 * d
    return S, E, W, Hc, d
def leg(s):
    Hp = V(s * .1, HIP_Y - .02, 0); K = Hp + V(0, -.42, 0); An = K + V(0, -.42, 0)
    return Hp, K, An
NECK = CH + V(0, .05, 0); HEADJ = NECK + V(0, .07, 0); HEADC = HEADJ + V(0, .15, .005)

def torso(P):
    d = ellipsoid(P, CH + V(0, -.03, 0), V(.185, .16, .13))          # peito
    d = smin(d, ellipsoid(P, V(0, HIP_Y + .12, .006), V(.175, .17, .135)), .08)   # barriga
    d = smin(d, ellipsoid(P, V(0, HIP_Y - .02, 0), V(.17, .12, .125)), .08)        # quadril
    d = smin(d, capsule(P, NECK - V(0, .06, 0), HEADJ + V(0, .05, 0), .062), .06)  # pescoço grosso
    d = smin(d, ellipsoid(P, HEADC, V(.165, .16, .15)), .06)                       # cabeção
    return d

def body(P):
    x, y, z = P[..., 0], P[..., 1], P[..., 2]
    t = torso(P)
    parts = []
    for s in (1, -1):
        S, E, W, Hc, dd = arm(s)
        a = capsule(P, S, E, .07, .062)
        a = smin(a, capsule(P, E, W, .062, .054), .05)
        a = smin(a, ellipsoid(P, Hc + .012 * dd, V(.06, .062, .052)), .035)            # mão (luvinha redonda)
        parts.append(smin(t, a, .045))
        Hp, K, An = leg(s)
        l = capsule(P, Hp + V(0, .03, 0), K, .088, .074)
        l = smin(l, capsule(P, K, An, .074, .064), .05)
        foot = ellipsoid(P, An + V(0, -.03, .04), V(.07, .055, .1))
        foot = smax(foot, -y, .01)
        l = smin(l, foot, .04)
        parts.append(smin(t, l, .05))
    return np.minimum.reduce(parts)

h = .0055
lo, hi = np.array([-.84, -.01, -.2]), np.array([.84, 1.75, .26])
n = np.ceil((hi - lo) / h).astype(int) + 1
xs = [np.linspace(lo[i], lo[i] + (n[i] - 1) * h, n[i]) for i in range(3)]
G = np.stack(np.meshgrid(*xs, indexing='ij'), -1)
vol = np.concatenate([body(G[i:i + 20]) for i in range(0, G.shape[0], 20)]).astype(np.float32)
v, f, _, _ = measure.marching_cubes(vol, 0, spacing=(h, h, h)); v += lo
m = trimesh.Trimesh(v, f, process=True)
if m.volume < 0: m.invert()
trimesh.smoothing.filter_taubin(m, lamb=.5, nu=-.53, iterations=8)
print('watertight', m.is_watertight, 'bodies', len(m.split(only_watertight=False)))
print('tris', len(m.faces), 'bounds', m.bounds.round(3).tolist())
out = {'pos': base64.b64encode(m.vertices.astype(np.float32).tobytes()).decode(),
       'idx': base64.b64encode(m.faces.astype(np.uint32).tobytes()).decode()}
json.dump(out, open(sys.argv[1] if len(sys.argv) > 1 else 'skin.json', 'w'))
