import subprocess, glob, os, numpy as np, wave
from scipy.signal import butter, sosfilt

SR = 44100
import json
NR = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'narr.json')))
TOTAL = NR['total']
N = int(SR * TOTAL)
L = np.zeros(N); Rr = np.zeros(N)
HERE = os.path.dirname(os.path.abspath(__file__))
SONS = os.path.join(HERE, '..', '..', 'sons')
rng = np.random.default_rng(3)
_c = {}

def load(path):
    if path in _c: return _c[path]
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.float32).astype(float); x = x / max(1e-6, np.abs(x).max()); _c[path] = x; return x
def bsb(i, a=0, d=None, fade=.05):
    x = load(os.path.join(SONS, 'bsb', f'{i}.ogg'))
    x = x[int(a * SR):] if d is None else x[int(a * SR):int((a + d) * SR)]
    x = x.copy(); n = min(len(x) // 2, int(fade * SR))
    if n > 0: x[:n] *= np.linspace(0, 1, n); x[-n:] *= np.linspace(1, 0, n)
    return x
def ken(name, i=0):
    f = sorted(glob.glob(os.path.join(SONS, '**', f'{name}_{i:03d}.ogg'), recursive=True))[0]
    return load(f)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def pitch(x, r): idx = np.arange(0, len(x) - 1, r); return np.interp(idx, np.arange(len(x)), x)
def T(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
def env(n, a, r):
    e = np.ones(n); na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] = np.linspace(1, 0, nr)
    return e
def add(x, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N: return
    x = x[:N - i] * g
    L[i:i + len(x)] += x * np.sqrt((1 - pan) / 2) * 1.414; Rr[i:i + len(x)] += x * np.sqrt((1 + pan) / 2) * 1.414
def bed(i, a, t, d, g, fi=.4, fo=.4, pan=0):
    x = bsb(i, a, d, .01); x = x * env(len(x), fi, fo); add(x, t, g, pan)
def whoosh(d, f0, f1_, g=.3):
    t = T(d); x = noise(d); out = np.zeros_like(x); seg = int(SR * .02)
    for k in range(0, len(x), seg):
        f = f0 + (f1_ - f0) * (k / len(x)); out[k:k + seg] = bp(x[max(0, k - 2000):k + seg], max(60, f * .6), min(15000, f * 1.6))[-len(x[k:k + seg]):]
    return out * np.sin(np.pi * t / d) ** 2 * g
def step(g=.35):  # passo na terra
    d = .14; t = T(d); return (bp(noise(d), 300, 3000) * np.exp(-t * 40) + lp(noise(d), 200) * np.exp(-t * 30) * .6) * g
def tap(g=.2):  # passinho de galinha
    d = .05; t = T(d); return bp(noise(d), 1500, 6000) * np.exp(-t * 120) * g
def drone(d, f, g=.12):
    t = T(d); x = sum(np.sin(2 * np.pi * f * k * t + k) / k for k in (1, 2, 3)) * (.7 + .3 * np.sin(2 * np.pi * .2 * t))
    return lp(x, 900) * env(len(t), 1.0, 1.0) * g
def ring(d=1.6, f=3100, g=.12):
    t = T(d); return np.sin(2 * np.pi * f * t) * np.exp(-t * 2) * g



S = {x['k']: x for x in NR['s']}
TN = lambda k: S[k]['t0']
SH = [('coffee', 0, TN('b2') - .1), ('yard', TN('b2') - .1, TN('b3') - .1), ('drop', TN('b3') - .1, TN('b4') - .1), ('swap', TN('b4') - .1, TN('b5') - .1),
      ('mate', TN('b5') - .1, TN('b6') - .1), ('lights', TN('b6') - .1, TN('b6') + 4.6), ('door', TN('b6') + 4.6, TN('b6') + 7.3), ('rain', TN('b6') + 7.3, TOTAL)]
A = {n: (a, b) for n, a, b in SH}
def bedL(i, a, t, d, g, fi=.3, fo=.3, pan=0):
    x = bsb(i, 0, None, .01); need = int(d * SR); st = int(a * SR) % max(1, len(x) - 1)
    y = np.concatenate([x[st:]] + [x] * (need // max(1, len(x)) + 1))[:need]; add(y * env(len(y), fi, fo), t, g, pan)
def plop(g=.5):
    d = .35; t = T(d); return (np.sin(2 * np.pi * (300 + 900 * np.exp(-t * 18)) * t) * np.exp(-t * 14) + lp(noise(d), 1500) * np.exp(-t * 25) * .6) * g
# 1. café
a, b = A['coffee']; add(drone(b - a + .2, 55, .08), a); bedL('0114', 3, a, b - a, .15, .02, .3)
for c in range(3):
    t0 = a + c * 3.3
    if t0 + .99 < b: add(plop(.7), t0 + .99); add(hp(bsb('1384', 4.42, .35, .01), 300), t0 + .99, .5)
    for i in range(3):
        if t0 + 1.9 + i * .35 < b: add(hp(bsb('1384', [0.12, 3.0, 5.8][i], .3, .01), 600), t0 + 1.95 + i * .4, .3, .1)
for k in range(8): add(lp(ken('footstep_concrete', k % 5), 2500), a + 1.3 + k * .5, .25, -.6 + k * .17)
add(lp(ken('impactMetal_medium', 2), 1500), a + .2, .25, .7)
# 2. pátio
a, b = A['yard']; bedL('0155', 5, a, b - a, .35); bedL('2968', 20, a, b - a, .12)
for k, tt in enumerate([.6, 1.6, 2.5, 3.9, 4.8]): add(ken('impactWood_light', k % 5), a + tt, .45, .1)
add(bp(noise(2.0), 300, 1500) * env(int(2 * SR), .8, .8) * .08, a + 3.2, 1.0)   # "cheiro"
# 3. o rei cai
a, b = A['drop']; bedL('0155', 15, a, b - a, .3); bedL('2968', 40, a, b - a, .1); add(whoosh(1.0, 2000, 300, .15), a + .6)
land = a + .6 + .75 * 1.5
add(ken('impactWood_light', 2), land, .9); add(ken('impactWood_light', 4), land + .32, .45); add(ken('impactWood_light', 1), land + .55, .2)
for k in range(3): add(lp(bsb('0243', 0, .5, .01), 500), a + .3 + k * .7, .5)
# 4. a troca
a, b = A['swap']; add(drone(b - a, 48, .07), a)
for k in range(6): add(lp(bsb('0243', 0, .5, .01), 500), a + .2 + k * .42, .35)
add(bsb('0083', 0.3, 1.0), a + 1.5, .55, .3); add(whoosh(.4, 600, 4000, .2), a + 1.4)
add(lp(bsb('0083', 2.5, .8), 1800), a + 3.0, .35, -.2); add(whoosh(.4, 4000, 600, .2), a + 2.6)
# 5. xeque-mate
a, b = A['mate']; bedL('0155', 25, a, b - a, .3); bedL('2968', 70, a, b - a, .12); add(ken('impactWood_medium', 1), a + 1.4, .8); add(ken('impactWood_light', 3), a + 1.75, .6)
add(ken('impactPunch_medium', 1), a + 1.42, .25)
for k in range(5): add(lp(bsb('0166', .2 + (k % 4) * .5, .35, .01), 3000), a + 3.4 + k * .5, .45 - k * .05, -.4)
add(lp(bsb('0083', 0.3, 1.0), 900), a + 3.2, .15, -.3)
add(bsb('0083', 5, 1.0), a + 3.7, .25, .4)
# 6. luzes apagam, cães
a, b = A['lights']
for i in range(6): add(lp(bsb('3061' if i % 2 else '3063', .1, .5, .01), 4000), a + .2 + i * .22, .45 - i * .04, (i - 2.5) * .1)
add(drone(b - a, 40, .1), a + 1.4)
for k in range(10): add(lp(bsb('3216', 3 + (k % 5) * .4, .3, .01), 2500), a + 1.7 + k * .3, .3)
for k in range(9): add(bp(noise(.09), 800, 4000) * np.exp(-T(.09) * 30) * .25, a + 1.9 + k * .27 + .05 * (k % 2), 1.0, .2)   # farejando
add(lp(bsb('2955', 0, 1.0), 1200), a + 3.4, .15, .5)
# 7. a porta
a, b = A['door']; add(bsb('2416', 0, 2.0), a + .3, .8); add(ken('impactMetal_medium', 3), a + 1.4, .55)
add(bsb('0303'), a + 1.8, .55); bedL('0124', 5, a + 1.8, b - a - 1.8, .5, .6, .01)
# 8. chuva
a, b = A['rain']; bedL('0124', 7, a, b - a, .85, .02, .02)
for k in range(5): add(lp(noise(.18), 1500) * np.exp(-T(.18) * 20) * .3, a + .3 + k * .44, 1.0, .1)
# transições
for n, a, b in SH[1:]:
    if n not in ('rain',): add(whoosh(.35, 3500, 400, .07), a - .2, 1.0)

mx = np.stack([L, Rr], 1)
mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .85 / max(1e-6, np.abs(mx).max())
with wave.open(os.path.join(HERE, 'xadrez_sfx.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok', TOTAL)
