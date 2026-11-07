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
def crack(g=.8):   # estalo seco do raio
    d = .5; t = T(d); return (hp(noise(d), 1500) * np.exp(-t * 25) + lp(noise(d), 400) * np.exp(-t * 6) * .8) * g
def strike(t0, big=1.0, thunder='3113'):
    add(crack(.9 * big), t0); add(kick(.7 * big), t0)
    add(hp(bsb('0950', 1, .5, .02), 900), t0 + .02, .35 * big)   # zumbido elétrico
    add(bsb(thunder, 0, 4.0, .02), t0 + .05, .9 * big)
    add(ding(1980, .07), t0 + .25); add(ding(2640, .05), t0 + .32)   # ouvido zunindo
def sizzle(t0, d, g=.12): add(hp(noise(d), 3000) * env(int(d * SR), .05, .4) * g, t0)
def rainbed(a, d, g=.45, muff=0):
    x = bsb('0740', 20, d, .01) * env(int(d * SR), .25, .25)
    add(lp(x, 900) if muff else x, a, g)
def walk(a, d, rate=.42, g=.3):
    k = 0
    while k * rate < d: add(step(g), a + k * rate, 1, .2 * (k % 2 - .5)); k += 1
def counter(t0): add(tick(.35), t0); add(ding(1560, .12), t0 + .03)
for x in NR['s'][1:]: add(whoosh(.25, 4000, 600, .1), x['a'] - .14, 1.0)
# 1 gancho
a, b = A['n1']; rainbed(a, b - a, .5); add(bsb('3114', 3, 2.0), a, .25)
strike(a + .35, 1.2); counter(a + .55); sizzle(a + .6, 1.6, .1)
add(whoosh(.6, 600, 2400, .15), a + .45); add(whoosh(.5, 2400, 500, .12), a + 2.6); add(ken('impactSoft_medium', 1), a + 3.25, .5); add(ding(1760, .1), a + 2.2)
# 2 parque → torre 1942 → bota
a, b = A['n2']; bedL('0100', 5, a, 3.3, .45); walk(a, 1.6, .4, .28)
rainbed(a + 3.2, 3.5, .5); add(bsb('3115', 0, 3.0), a + 3.3, .3)
strike(a + 3.2 + 1.9, 1.0, '3179'); counter(a + 3.2 + 2.1)
sizzle(a + 6.6, 2.2, .1); add(ding(3400, .15), a + 6.6 + .3); add(tick(.3), a + 6.6 + 1.55); add(whoosh(.5, 900, 3000, .08), a + 6.6 + .3)
# 3 1969 caminhão
a, b = A['n3']; rainbed(a, b - a, .4); bedL('1145', 4, a, 4.6, .4)
for k in range(10): add(tick(.18), a + .1 + k * .14)
strike(a + 3.5, 1.0, '3113'); counter(a + 3.7)
add(lp(bsb('0987', 3, 2.2), 3000), a + 4.6 + .35, .35); sizzle(a + 4.6 + .4, 1.5, .12)
# 4 1970 quintal
a, b = A['n4']; rainbed(a, b - a, .45); add(bsb('3114', 0, 1.2), a, .2)
strike(a + 1.4, 1.0, '3115'); counter(a + 1.6); sizzle(a + 1.6, 2, .09)
# 5 1972 posto
a, b = A['n5']; rainbed(a, 4.4, .45, 1); add(lp(noise(4.4), 300) * .03, a)
strike(a + 1.9, 1.0, '3179'); counter(a + 2.1)
add(bsb('0987', 1, 2.2), a + 2.0, .55)
for k in range(8): add(lp(noise(.08), 900) * np.exp(-T(.08) * 40) * .5, a + 2.3 + k * .2)
add(ken('impactSoft_medium', 2), a + 4.4 + .1, .4)
add(bsb('1526', 0, 1.2), a + 4.5, .5); walk(a + 4.7, 1.5, .4, .25); add(ken('impactPlate_light', 1), a + 4.4 + 1.8, .4); add(ding(1320, .14), a + 4.4 + 1.9)
# 6 1973 nuvem segue o carro
a, b = A['n6']; bedL('0100', 15, a, b - a, .35); bedL('1145', 10, a, 2.9, .45)
add(bsb('3114', 2, 3.0), a + .5, .3)
add(bsb('1526', 0, 1.0), a + 2.9, .5); walk(a + 3.0, .8, .4, .25)
strike(a + 3.9, 1.1, '3113'); counter(a + 4.1)
add(bsb('0987', 4, 1.6), a + 4.0, .5)
add(bsb('3313', 0, 2.0), a + 4.9, .7); sizzle(a + 4.95, 1.6, .2)
# 7 1976 correndo
a, b = A['n7']; rainbed(a, b - a, .4); bedL('1843', 2, a, 3.0, .6); add(bsb('3115', 0, 2.5), a + .2, .25)
strike(a + 2.9, 1.0, '3179'); counter(a + 3.1)
add(kick(.5), a + 3.25); add(ken('impactSoft_heavy', 1), a + 3.3, .6)
# 8 1977 pescando + urso
a, b = A['n8']; bedL('3222', 10, a, b - a, .35); rainbed(a, 2.7, .35)
add(ken('impactSoft_medium', 0), a + .4, .2)
strike(a + 1.2, 1.3, '3115'); counter(a + 1.4); add(ding(990, .12), a + 1.45); add(ding(1480, .1), a + 1.55)
walk(a + 2.7, 1.8, .42, .26)
add(pitch(bsb('2107', 0, 3.0), .62), a + 2.7 + 1.9, .6); add(ding(2100, .1), a + 2.7 + 1.95)
add(whoosh(.35, 600, 3000, .35), a + 2.7 + 3.7); add(ken('impactWood_heavy', 1), a + 2.7 + 4.0, .7)
add(pitch(bsb('2107', 3, 2.0), .55), a + 2.7 + 4.05, .7)
for k in range(10): add(kick(.25), a + 2.7 + 4.2 + k * .16)
# 9 ninguém perto na chuva / museu / volta
a, b = A['n9']; bedL('2679', 2, a, 3.6, .45); walk(a, 1.2, .42, .25)
for k in range(14): add(step(.2), a + 1.6 + k * .14, 1, .5)
add(whoosh(.6, 400, 1600, .12), a + 1.5)
add(lp(noise(4.0), 180) * env(int(4 * SR), .5, .5) * .05, a + 3.6); add(ding(880, .12), a + 3.7); add(ding(1320, .08), a + 3.9)
rainbed(a + 7.6, b - a - 7.6, .45); strike(a + 7.6 + 1.6, .9, '3113')
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .85 / max(1e-6, np.abs(mx).max())
with wave.open(os.path.join(HERE, 'raio_sfx.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok', TOTAL)
