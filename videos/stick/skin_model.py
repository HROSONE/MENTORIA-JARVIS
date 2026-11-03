"""Pele contínua do stickman (pose A), gerada por SDF + marching cubes. Exporta skin.json (base64)."""
import sys, json, base64
sys.path.insert(0, '../teen')
import numpy as np
from skimage import measure
import trimesh, fast_simplification
from teen_model import V, sphere, ellipsoid, capsule, smin, smax, sstep, length

A = np.radians(35)
HIP_Y, SPINE, CHEST_OFF = .95, .28, .05
CH = V(0, HIP_Y + SPINE, 0)
def arm(s):
    S = CH + V(s * .2, .05, 0)
    d = V(s * np.sin(A), -np.cos(A), 0)
    E = S + .3 * d; W = E + .27 * d; Hc = W + .05 * d
    return S, E, W, Hc, d
def leg(s):
    Hp = V(s * .1, HIP_Y - .02, 0); K = Hp + V(0, -.42, 0); An = K + V(0, -.42, 0)
    return Hp, K, An
NECK = CH + V(0, .05, 0); HEADJ = NECK + V(0, .07, 0); HEADC = HEADJ + V(0, .128, 0)

def body(P):
    x, y, z = P[..., 0], P[..., 1], P[..., 2]
    # tronco: peito, cintura, quadril
    d = ellipsoid(P, CH + V(0, -.02, 0), V(.165, .13, .095))
    d = smin(d, ellipsoid(P, V(0, HIP_Y + .13, 0), V(.12, .12, .08)), .06)
    d = smin(d, ellipsoid(P, V(0, HIP_Y - .01, 0), V(.15, .1, .095)), .06)
    # pescoço e cabeça
    d = smin(d, capsule(P, NECK - V(0, .04, 0), HEADJ + V(0, .04, 0), .04), .04)
    d = smin(d, ellipsoid(P, HEADC, V(.125, .14, .13)), .04)
    for s in (1, -1):
        S, E, W, Hc, dd = arm(s)
        d = smin(d, sphere(P, S, .056), .03)        # ombro
        d = smin(d, capsule(P, S, E, .05, .041), .02)
        d = smin(d, capsule(P, E, W, .042, .032), .02)
        d = smin(d, ellipsoid(P, Hc, V(.034, .055, .022), np.array([[np.cos(A), -s * np.sin(A), 0], [s * np.sin(A), np.cos(A), 0], [0, 0, 1]])), .02)  # mão (luva)
        Hp, K, An = leg(s)
        d = smin(d, capsule(P, Hp, K, .07, .05), .05)
        d = smin(d, capsule(P, K, An, .05, .036), .025)
        foot = capsule(P, An + V(0, -.05, -.03), An + V(0, -.055, .13), .038, .032)
        foot = smax(foot, -y + .0, .008)
        d = smin(d, foot, .03)
    return d

h = .0055
lo, hi = np.array([-.66, -.01, -.15]), np.array([.66, 1.72, .25])
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
json.dump(out, open('skin.json', 'w'))
