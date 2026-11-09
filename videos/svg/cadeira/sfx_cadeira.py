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
A2 = {x['k']: x['a'] for x in NR['s']}; E2 = {x['k']: x['b'] for x in NR['s']}
for k in list(A2)[1:]: add(whoosh(.3, 3000, 500, .14), A2[k] - .16)
def wind(a, d, g=.12): n = int(d * SR); add(bp(noise(d), 200, 1200) * (.6 + .4 * np.sin(2 * np.pi * .3 * np.arange(n) / SR)) * env(n, .4, .4) * g, a)
def jet(a, d, g=.3): n = int(d * SR); x = lp(noise(d), 500) + bp(noise(d), 2000, 5000) * .3; e = np.sin(np.pi * np.arange(n) / n) ** 2; add(x * e * g, a)
def pop(t0, g=.8): add(hp(noise(.08), 800) * np.exp(-T(.08) * 60) * g + lp(noise(.12), 400)[:int(.08 * SR)] * .3, t0); add(kick(.4), t0)
def squeak(t0, g=.12): t = T(.25); add(np.sin(2 * np.pi * (900 + 500 * np.sin(2 * np.pi * 7 * t)) * t) * env(len(t), .02, .1) * g, t0)
# n1 alturas: vento + avião passando + ele ri
wind(0, E2['n1'], .14); jet(.2, 4.6, .4); add(ding(1980, .1), 2.6)
for j in range(6): squeak(.5 + j * .7, .06)
# n2 caminhão e caixas
a = A2['n2']; add(bsb('1145', 4, 3.0) * 0 + lp(noise(3), 200) * .05, a); add(bsb('0258', 0, 1.0), a + .6, .35)
for j in range(14): add(ken('impactSoft_medium', j % 3), a + 3.6 + j * .25, .25)
# n3 hélio enchendo
a = A2['n3']
for j in range(14): add(hp(noise(.22), 3000) * env(int(.22 * SR), .02, .1) * .12, a + .2 + j * .27); squeak(a + .3 + j * .27, .05)
add(ding(1320, .14), a + 4.4); add(ding(1760, .1), a + 4.55)
# n4 itens no colo (um "pop" cômico cada), clique da arma
a = A2['n4']
for j, tt in enumerate([.4, 1.2, 2.0, 2.9, 3.9, 6.0]): add(ding(880 + j * 150, .12), a + tt + .2); add(ken('impactSoft_medium', j % 3), a + tt + .3, .3)
add(ken('impactMetal_light', 1), a + 6.4, .6); add(ken('impactMetal_light', 3), a + 6.55, .5)
# n5 corda arrebenta e sobe
a = A2['n5']
for j in range(8): add(bp(noise(.1), 300, 1200) * np.exp(-T(.1) * 30) * .2, a + .3 + j * .3)
add(ken('impactWood_heavy', 0), a + 2.6, .8); add(kick(.7), a + 2.6); add(riser(2.2, 200, 1400, .12), a + 2.6); add(whoosh(1.8, 300, 3000, .4), a + 2.7)
# n6 frio, vento forte, dois jatos
a = A2['n6']; wind(a, E2['n6'] - a, .25); jet(a + 2.2, 2.8, .5); jet(a + 4.0, 2.8, .4)
for j in range(5): add(bp(noise(.3), 2000, 6000) * env(int(.3 * SR), .05, .2) * .05, a + 1.6 + j * .4)
# n7 tiros e balões estourando, arma caindo
a = A2['n7']; wind(a, E2['n7'] - a, .14)
for tt in (2.0, 2.7, 3.3, 3.9): add(hp(ken('impactMetal_light', 0), 1500), a + tt, .5); pop(a + tt + .08, .9)
add(whoosh(1.4, 1500, 300, .25), a + 4.6); add(ding(440, .12), a + 4.8)
# n8 descida, fio, faíscas, apagão
a = A2['n8']; wind(a, 2.6, .1)
add(hp(noise(.8), 2000) * (np.random.default_rng(1).random(int(.8 * SR)) > .7) * .3, a + 2.6); add(bsb('0950', 1, .8), a + 2.6, .4); add(kick(.6), a + 3.0); add(riser(.6, 600, 80, .1), a + 3.0)
# n9 sirene, multa (carimbo), loop
a = A2['n9']; add(siren(3.0, .12) * env(int(3 * SR), .3, .6), a + .3); add(kick(.7), a + 2.4); add(ken('impactWood_heavy', 1), a + 2.42, .6)
wind(E2['n9'] - 1.6, 1.6, .14); jet(E2['n9'] - 1.6, 1.6, .3)
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .85 / max(1e-6, np.abs(mx).max())
with wave.open(os.path.join(HERE, 'cadeira_sfx.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok', TOTAL)
