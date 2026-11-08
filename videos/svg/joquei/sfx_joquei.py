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
def gallop(a, d, g=.6, slow=1.0):
    x = bsb('0611', 0, 12, .05)
    if slow != 1: x = pitch(x, slow)
    n = int(d * SR); y = np.tile(x, int(n / len(x)) + 1)[:n] * env(n, .2, .3); add(y * g, a)
def crowd(a, d, g=.5):
    n = int(d * SR); x = bsb('0019', 0, 25, .05); y = np.tile(x, int(n / len(x)) + 1)[:n] * env(n, .3, .5); add(y * g, a)
def heart(t0, n, g=.4, per=.5):
    for j in range(n): add(lp(kick(g), 200), t0 + j * per); add(lp(kick(g * .6), 200), t0 + j * per + per * .3)
# n1 chegada
gallop(0, E2['n1'], .7); crowd(0, E2['n1'], .55); add(bsb('0237', 0, 3), 2.0, .5); add(ding(1980, .14), 2.0)
# n2 estábulo
a = A2['n2']; add(bsb('0863', 0, 2.5), a + .6, .35)
for j in range(14): add(bp(noise(.12), 2000, 7000) * env(int(.12 * SR), .02, .08) * .12, a + .4 + j * .45)
add(ding(440, .12), a + 3.4)
# n3 apostas e roupa
a = A2['n3']; crowd(a, E2['n3'] - a, .12)
for j in range(6): add(step(.18), a + .8 + j * .3)
add(whoosh(.4, 600, 3000, .25), a + 2.9); add(ding(1560, .14), a + 3.1); add(click(.3), a + 4.6); add(ding(660, .14), a + 4.7)
# n4 balança
a = A2['n4']
for j in range(30): add(tick(.08), a + .6 + j * .12)
add(ken('impactPlate_light', 1), a + 2.4, .4); add(ding(990, .1), a + 4.2)
# n5 corrida, saltos, coração para
a = A2['n5']; d5 = E2['n5'] - a
gallop(a, 5.7, .75); crowd(a, d5, .35)
for j in (1.2, 3.4): add(whoosh(.6, 400, 1600, .3), a + j - .3); add(lp(kick(.7), 300), a + j + .35)
tt = 0; bpm = 120
while tt < 5.6:
    bpm = 120 + 80 * tt / 5.6; add(lp(kick(.5), 220), a + tt); add(lp(kick(.3), 220), a + tt + .12); tt += 60 / bpm
add(sum(np.sin(2 * np.pi * 1000 * T(2.5)) for _ in [0]) * env(int(2.5 * SR), .01, .4) * .1, a + 5.6)
gallop(a + 5.7, d5 - 5.7, .5, .9)
# n6 câmera lenta na chegada
a = A2['n6']; gallop(a, E2['n6'] - a, .5, .55); add(lp(bsb('0019', 0, 6), 900), a, .35)
add(ken('impactMetal_heavy', 1), a + 3.05, .5); add(bsb('0237', 0, 3), a + 3.1, .6); add(ding(1980, .14), a + 3.1)
# n7 parabéns e silêncio
a = A2['n7']; crowd(a, 2.6, .45)
for j in range(6): add(step(.2), a + .2 + j * .33)
add(lp(noise(1.2), 300) * env(int(1.2 * SR), .02, .8) * .3, a + 3.6); add(ken('impactSoft_heavy', 1), a + 4.4, .6); add(drone(2, 55, .08), a + 3.6)
# n8 estábulo vazio + volta
a = A2['n8']; add(bsb('0863', 0, 2.5), a + 1.5, .25); add(ding(523, .1), a + 2.2)
gallop(a + 4.4, E2['n8'] - a - 4.4, .7); crowd(a + 4.4, E2['n8'] - a - 4.4, .5)
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .85 / max(1e-6, np.abs(mx).max())
with wave.open(os.path.join(HERE, 'joquei_sfx.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok', TOTAL)
