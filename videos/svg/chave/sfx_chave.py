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
night = lambda a, d, g=.35: bedL('0110', 3 + a, a, d, g, .2, .2)
# 1
a, b = A['n1']; night(a, b - a); bedL('0425', 0, a, b - a, .12)
add(bsb('2414', 0, 1.2), a + .2, .5); add(tick(.4), a + .75); add(tick(.3), a + .82); add(beep(1200, .08, .15), a + .9)
for k in range(5): add(lp(ken('footstep_concrete', k), 2600), a + 1.4 + k * .4, .3)
add(bsb('3205', .2, 1.0), a + 3.3, .2, .5); add(bp(noise(.6), 300, 1500) * env(int(.6 * SR), .1, .3) * .1, a + 2.7, 1.0, -.6)
# 2
a, b = A['n2']; night(a, b - a)
for k in range(5): add(lp(ken('footstep_concrete', k), 2000), a + .1 + k * .4, .25, -.4 + k * .1)
add(scrape(.4, .15), a + 2.9); add(whoosh(.3, 800, 3000, .1), a + 3.5)
for k in range(4): add(scrape(.12, .2), a + 4.4 + k * .15)
# 3
a, b = A['n3']; add(drone(b - a, 50, .1), a); add(whoosh(.5, 400, 2500, .14), a + .2)
for k in range(3): add(scrape(.15, .2), a + 1.3 + k * .18)
add(whoosh(.3, 4500, 500, .2), a + 1.8); add(ken('forceField', 1), a + 2.5, .25)
# 4
a, b = A['n4']; add(drone(b - a, 46, .08), a)
for k in range(5): add(tick(.2), a + 1.6 + k * .35)
for k in range(10): add(lp(ken('impactMetal_light', k % 5), 2500), a + 3.9 + k * .17, .3)
add(beep(220, .3, .2), a + 4.0); add(beep(220, .3, .2), a + 4.9)
# 5
a, b = A['n5']; add(drone(b - a, 60, .06), a); add(ken('forceField', 2), a + .2, .2)
for i in range(16): add(tick(.18), a + .4 + i * .2)
add(ding(1568, .3), a + 3.7); add(ding(2093, .2), a + 3.8); add(whoosh(1.2, 500, 2500, .08), a + 4.6)
# 6
a, b = A['n6']; add(drone(b - a, 44, .08), a)
s_ = scrape(b - a, .08); add(s_, a)
for k in range(4): add(ding(1200 + k * 200, .18), a + .4 + (k + 1) * .95)
for k in range(14): add(tick(.2), a + .5 + k * .27)
for k in range(5): add(lp(bsb('0243', 0, .5, .01), 500), a + 3.6 + k * .3, .5)
# 7
a, b = A['n7']; night(a, b - a)
for k in range(14): add(tick(.18), a + .1 + k * .25)
for k in range(6): add(lp(bsb('0243', 0, .5, .01), 500), a + .1 + k * .5, .4)
for k in range(5): add(lp(ken('footstep_concrete', k), 2600), a + .5 + k * .45, .25, .6)
add(whoosh(.4, 600, 2000, .1), a + 2.8)
# 8
a, b = A['n8']; add(whoosh(.35, 500, 3000, .3), a + .2)
add(ken('impactWood_heavy', 2), a + .55, 1.0); add(ken('impactPunch_heavy', 0), a + .56, .8); add(boing(.45), a + .6)
for k in range(5): add(ding(2600 + k * 300, .06), a + .7 + k * .12)
add(lp(noise(.5), 300) * np.exp(-T(.5) * 8) * .6, a + 1.65)
# 9
a, b = A['n9']; add(lp(ken('footstep_concrete', 1), 2500), a + 1.4, .4); add(siren(b - a, .12) * env(int((b - a) * SR), .5, .3), a); night(a, b - a, .2)
add(lp(noise(.6), 200) * np.exp(-T(.6) * 5) * .4, a + 1.2)
add(lp(ken('impactMetal_light', 1), 4000), a + 2.4, .6); add(lp(ken('impactMetal_light', 3), 4000), a + 2.55, .5)
add(ding(1760, .2), a + 3.6)
for x in NR['s'][1:]: add(whoosh(.25, 4000, 600, .1), x['a'] - .14, 1.0)
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .85 / max(1e-6, np.abs(mx).max())
with wave.open(os.path.join(HERE, 'chave_sfx.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok', TOTAL)
