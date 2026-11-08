import subprocess, glob, os, numpy as np, wave
from scipy.signal import butter, sosfilt

SR = 44100
import json
NR = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'narr.json')))
import json as _j
NR = _j.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'narr.json')))
TOTAL = NR['total']
N = int(SR * TOTAL)
L = np.zeros(N); Rr = np.zeros(N)
HERE = os.path.dirname(os.path.abspath(__file__))
SONS = os.path.join(HERE, '..', 'sons')
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






def rubber(d=.3, g=.25):
    t = T(d); f = 500 + 900 * np.sin(np.pi * t / d); return bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .5 + noise(d) * .3, 400, 3000) * np.sin(np.pi * t / d) * g
def bedL(i, a, t, d, g, fi=.2, fo=.2, pan=0):
    x = bsb(i, 0, None, .01); need = int(d * SR); st = int(a * SR) % max(1, len(x) - 1)
    y = np.concatenate([x[st:]] + [x] * (need // max(1, len(x)) + 1))[:need]; add(y * env(len(y), fi, fo), t, g, pan)
def snip(g=.3):
    d = .07; t = T(d); return hp(noise(d), 3000) * np.exp(-t * 80) * g + np.sin(2 * np.pi * 4200 * t) * np.exp(-t * 110) * g * .5



def ding(f=1320, g=.25): d = .9; t = T(d); return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.01 * t)) * np.exp(-t * 5) * g
def beep(f=880, d=.12, g=.2): t = T(d); return np.sign(np.sin(2 * np.pi * f * t)) * env(len(t), .005, .02) * g * .5
def click(g=.25): d = .03; t = T(d); return hp(noise(d), 2500) * np.exp(-t * 200) * g
def riser(d, f0, f1_, g=.15): t = T(d); f = f0 + (f1_ - f0) * (t / d) ** 2; return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .3, .2) * g
def buzz(d, g=.12): t = T(d); return np.sin(2 * np.pi * (520 + 30 * np.sin(2 * np.pi * 7 * t)) * t) * (.6 + .4 * np.sin(2 * np.pi * 31 * t)) * g

A = {x['k']: (x['a'], x['b']) for x in NR['s']}
def click(g=.25): d = .03; t = T(d); return hp(noise(d), 2500) * np.exp(-t * 200) * g
def tick(g=.3): d = .05; t = T(d); return (np.sin(2 * np.pi * 3200 * t) * .5 + hp(noise(d), 4000)) * np.exp(-t * 120) * g
def boing(g=.4): d = .7; t = T(d); return np.sin(2 * np.pi * (260 + 120 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 3)) * t) * np.exp(-t * 4) * g
def scrape(d, g=.12): t = T(d); return bp(noise(d), 2500, 8000) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 6 * t))) * g
def siren(d, g=.14): t = T(d); return np.sin(2 * np.pi * np.cumsum(700 + 250 * np.sin(2 * np.pi * 1.2 * t)) / SR) * g
def kick(g=.5): d = .35; t = T(d); return np.sin(2 * np.pi * (60 + 80 * np.exp(-t * 30)) * t) * np.exp(-t * 9) * g
def crunch_(g=.5):   # mordida em metal
    x = pitch(ken('impactMetal_light', int(rng.integers(0, 4))), .8 + rng.random() * .4)[:int(.4 * SR)]
    n = len(x); nz = bp(noise(n / SR + .01), 1500, 6000)[:n] * np.exp(-np.arange(n) / SR * 18)
    return (x * .7 + nz * .4) * g
def chew(t0, n, g=.25):
    for k in range(n): add(bp(noise(.09), 800, 4000) * np.exp(-T(.09) * 30) * g, t0 + k * .19, 1, (k % 2 - .5) * .3)
def saw(t0, d, g=.2):
    t = T(d); x = bp(noise(d), 2500, 7000) * (.4 + .6 * np.abs(np.sin(2 * np.pi * 8 * t))); add(x * g, t0)
def gulp(t0, g=.35): t = T(.25); add(np.sin(2 * np.pi * (180 - 120 * t / .25) * t) * np.exp(-t * 12) * g, t0)
def pop(t0, f=880, g=.2): add(ding(f, g * .6), t0); add(kick(g * .8), t0)
A2 = {x['k']: x['a'] for x in NR['s']}
P = 1 / .62
def bites(t0, t1, off, g=.6):
    k = 0
    while True:
        tt = t0 + (.38 + k) * P - off
        if tt >= t1: break
        if tt >= t0: add(crunch_(g), tt); chew(tt + .15, 4, .2)
        k += 1
CUT = [A2['n3'], A2['n5'], A2['n7']]
for c in CUT: add(whoosh(.3, 3500, 600, .14), c - .16)
# ambiente do campo o tempo todo
bedL('0100', 3, 0, TOTAL, .14, .5, .8)
# A: mordidas no avião, copo, prancheta
a = 0; bites(a, a + 8.4, .42)
add(ken('impactGlass_light', 1), a + 9.62, .7); add(ken('impactGlass_light', 3), a + 9.7, .5); chew(a + 9.8, 5, .2)
add(whoosh(.5, 2000, 600, .12), a + 10.9); add(ken('impactPlate_light', 1), a + 11.5, .3)
for k in range(2): add(crunch_(.5), a + 12.2 + k * 1.6); chew(a + 12.4 + k * 1.6, 4)
# B: óleo, água, engole, balança, pilha caindo
a = A2['n3']
for k in range(5): add(bp(noise(.2), 200, 900) * np.exp(-T(.2) * 10) * .3, a + 1.0 + k * .22)
for k in range(5): add(bp(noise(.2), 300, 1400) * np.exp(-T(.2) * 10) * .25, a + 3.4 + k * .22)
gulp(a + 5.3, .5); add(ken('impactPlate_light', 0), a + 6.0, .4); add(ding(1560, .14), a + 6.25)
bites(a, A2['n4'], 0) if False else [ (add(crunch_(.6), a + (.38 + k) * P), chew(a + (.38 + k) * P + .15, 4)) for k in range(12) if 6.6 < (.38 + k) * P < A2['n4'] - a ]
b = A2['n4']
for k, (tt, f) in enumerate([(0, 'impactMetal_medium'), (1.3, 'impactMetal_heavy'), (2.8, 'impactGlass_medium'), (3.9, 'impactGlass_heavy'), (5.0, 'impactWood_heavy'), (6.6, 'impactWood_heavy')]):
    add(whoosh(.35, 2500, 400, .2), b + tt - .05); add(ken(f, k % 3), b + tt + .4, .7); add(kick(.5), b + tt + .42); pop(b + tt + .6, 700 + k * 120)
add(ding(1980, .14), b + 7.3)
# C: timelapse, calendário, raio-x, banana, azia
a = A2['n5']
for k in range(28): add(tick(.12), a + 1.6 + k * .17)
for k in range(5): add(crunch_(.35), a + 1.8 + k * .9)
c6 = A2['n6']; add(riser(.8, 200, 900, .06), c6 + 1.0); add(drone(2.8, 90, .05), c6 + 1.4)
add(bp(noise(.2), 800, 3000) * np.exp(-T(.2) * 20) * .3, c6 + 4.85); chew(c6 + 5.0, 3, .2)
add(ken('impactSoft_medium', 1), c6 + 5.4, .5); add(bsb('0987', 2, 2.2), c6 + 5.45, .4)
# D: placa, mordida na placa, ?, dedo, volta a comer
a = A2['n7']; add(whoosh(.8, 600, 2000, .2), a + .3); add(ding(1760, .14), a + 1.35); add(ding(2200, .1), a + 1.55)
add(crunch_(.9), a + 4.85); add(ken('impactMetal_light', 2), a + 4.87, .5); chew(a + 5.0, 8, .25)
d = A2['n8']; add(riser(1.0, 300, 700, .06), d + .6); add(ding(660, .12), d + 1.5)
for k in range(5): add(click(.2), d + 3.5 + k * .2)
for tt in (7.11,): add(crunch_(.6), d + tt); chew(d + tt + .15, 4)
add(crunch_(.6), TOTAL - .25)
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .85 / max(1e-6, np.abs(mx).max())
with wave.open(os.path.join(HERE, 'aviao2_sfx.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok', TOTAL)
