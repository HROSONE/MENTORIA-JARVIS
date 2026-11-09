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
def birds(a, d, g=.25): bedL('0100', 20, a, d, g, .4, .4)
meow = lambda t0, g=.6, r=1.0: add(pitch(bsb('1890', 0, 1.6, .02), r), t0, g)
def beep(t0, f=1500, g=.15): add(ding(f, g), t0)
# n1 parque, orelha mexe, bipe do microfone
birds(0, E2['n1']); add(bp(noise(.15), 3000, 8000) * env(int(.15 * SR), .01, .1) * .2, 1.45); beep(1.9, 1800, .1); beep(2.2, 1800, .1)
add(riser(1.2, 300, 900, .06), 2.6); add(ken('impactMetal_heavy', 1), 3.3, .4); add(kick(.5), 3.3)
# n2 escritório: relógio, máquina de escrever, gato pula, ideia
a = A2['n2']
for j in range(int((E2['n2'] - a) / 1)): add(tick(.08), a + j * 1.0)
add(bsb('2841', 2, 2.5), a + .2, .25); add(whoosh(.5, 600, 2400, .2), a + 2.2); add(ken('impactSoft_medium', 0), a + 3.2, .5); meow(a + 3.5, .55)
add(ding(1320, .16), a + 5.6); add(ding(1980, .12), a + 5.75)
# n3 planta técnica: bipes de monitor, peças encaixando, fio desenhando
a = A2['n3']
for j in range(int((E2['n3'] - a) / .9)): beep(a + j * .9, 1000, .06)
add(whoosh(.8, 2400, 600, .2), a + 1.6); add(click(.4), a + 2.6); add(whoosh(.8, 2400, 600, .2), a + 3.4); add(click(.4), a + 4.4)
add(riser(2.2, 600, 1800, .05), a + 5.4); add(ding(2200, .1), a + 7.6)
# n4 parque: agente fala, gato vê peixe, mia, passos
a = A2['n4']; birds(a, E2['n4'] - a)
add(pitch(bsb('0494', 0, 1, .01), 1.1), a + 2.05, .6); add(ding(1760, .1), a + 2.05)
for j in range(8): add(lp(tap(.25), 4000), a + 2.8 + j * .32)
meow(a + 5.4, .5, .9); add(ken('impactSoft_heavy', 0), a + 4.6, .4)
# n5 dinheiro
a = A2['n5']
for j in range(26): add(bp(noise(.08), 1500, 5000) * np.exp(-T(.08) * 50) * .25, a + .2 + j * .12)
add(ding(2600, .14), a + 3.4); add(ding(3200, .1), a + 3.55)
# n6 furgão: rádio chiando; parque, porta do furgão
a = A2['n6']; add(hp(noise(3.6), 2000) * (.5 + .5 * np.sin(2 * np.pi * 3 * T(3.6))) * .04, a)
for j in range(4): beep(a + .4 + j * .7, 900, .08)
birds(a + 3.6, E2['n6'] - a - 3.6, .3); add(ken('impactMetal_light', 1), a + 3.9, .5); add(bp(noise(.6), 300, 1200) * env(int(.6 * SR), .05, .3) * .2, a + 3.95)
# n7 rua: passos, buzina, freada, corte seco
a = A2['n7']; birds(a, 6.4, .25); add(lp(noise(6.4), 300) * env(int(6.4 * SR), 1.5, .1) * .1, a)
for j in range(10): add(lp(tap(.2), 4000), a + .2 + j * .38)
add(bsb('0258', 0, 1.5), a + 4.6, .7); add(bsb('2371', 0, 1.8), a + 5.4, .8); meow(a + 5.0, .45, 1.3)
add(kick(.6), a + 6.4)
# n8 rebobinar + ronronar
a = A2['n8']; add(riser(1.5, 1800, 200, .1), a); add(hp(noise(1.5), 2000) * .08, a)
n = int((E2['n8'] - a - 1.6) * SR); pr = bsb('0436', 0, 11, .05); add(np.tile(pr, n // len(pr) + 1)[:n] * env(n, .5, .5) * .7, a + 1.6)
for j in range(4): add(bp(noise(.1), 3000, 8000) * np.exp(-T(.1) * 30) * .15, a + 1.9 + j * .25)
# n9 1967: carimbo, gato derruba, plof, loop
a = A2['n9']
for j in range(int((E2['n9'] - a) / 1)): add(tick(.08), a + j * 1.0)
add(bsb('2841', 6, 2.5), a + .1, .2); add(kick(.8), a + 3.4); add(ken('impactWood_heavy', 1), a + 3.4, .7)
add(bp(noise(.3), 1000, 4000) * .1, a + 4.8); add(whoosh(.5, 800, 2000, .25), a + 6.0); add(ken('impactWood_medium', 2), a + 6.9, .8); meow(a + 7.1, .5, 1.1)
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .85 / max(1e-6, np.abs(mx).max())
with wave.open(os.path.join(HERE, 'gato_sfx.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok', TOTAL)
