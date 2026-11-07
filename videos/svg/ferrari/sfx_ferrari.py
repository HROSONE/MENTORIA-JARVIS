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
FL_T = [0.55, 2.2, 5.1, 9.6, 14.2, 19.4, 27.6, 34.4, 40.3, 42.2]
TH = ['3113', '3114', '3115', '3179']
for i, f in enumerate(FL_T): add(bsb(TH[i % 4], 0, 4.5, .02), f + .15 + (i % 3) * .2, .55 if i else .8, (i % 3 - 1) * .3)
add(lp(noise(TOTAL), 160) * .015, 0)
a0 = 0; bedL('0740', 30, 0, TOTAL, .32, .5, .8)
for x in NR['s'][1:]: add(whoosh(.25, 4000, 600, .08), x['a'] - .14, 1.0)
A2 = {x['k']: x['a'] for x in NR['s']}
# 1: passos dele na calçada molhada
for k in range(5): add(lp(ken('footstep_concrete', k % 5), 3000), .3 + k * .55, .3)
# 2: régua da linha 2 m
a = A2['n2']; add(whoosh(.9, 600, 2600, .12), a + 1.0); add(ding(1320, .14), a + 2.15)
# 3: patinho e régua 30 cm
a = A2['n3']; add(whoosh(.8, 2600, 600, .1), a + .4)
for k in range(8): add(tick(.16), a + 1.6 + k * .12)
add(ding(1560, .14), a + 2.6); add(bsb('1529', 0, 1.5), a + .8, .25)
# 4: golpe de kung fu ao tirar o casaco
a = A2['n4']; add(ding(990, .06), a + .5)
add(whoosh(.28, 300, 4000, .55), a + 2.75); add(ken('impactPunch_heavy', 1), a + 2.95, .9); add(kick(.6), a + 2.95); add(whoosh(.5, 3000, 800, .2), a + 3.1)
add(bp(noise(.4), 800, 3000) * env(int(.4 * SR), .01, .3) * .2, a + 3.0)   # pano estalando
# 5: pose de karatê, arremesso, casaco trava no vidro
a = A2['n5']; add(riser(1.4, 220, 520, .05), a + .2); add(whoosh(.3, 400, 3000, .35), a + 1.75); add(ken('impactPunch_medium', 0), a + 1.8, .6)
add(whoosh(1.0, 1800, 600, .22), a + 1.9); add(ken('impactSoft_heavy', 0), a + 2.9, .8); add(ken('impactGlass_light', 1), a + 2.92, .35); add(ding(1760, .1), a + 3.0)
# 6: mangas arregaçadas
a = A2['n6']
for k in range(4): add(bp(noise(.18), 1200, 5000) * env(int(.18 * SR), .02, .1) * .22, a + .3 + k * .22, 1, -.3)
for k in range(4): add(bp(noise(.18), 1200, 5000) * env(int(.18 * SR), .02, .1) * .22, a + 1.3 + k * .22, 1, .3)
# 7: bananeira: salto e mãos na água
a = A2['n7']; add(whoosh(.6, 500, 2000, .3), a + .1); add(bsb('1521', 0, 1.6), a + .7, .55)
for k in range(9): add(bsb('1531' if k % 2 else '1529', 0, .6), a + 1.1 + k * .3, .4, (k % 2 - .5) * .6)
# 8: anda até a porta e abre
a = A2['n8']
for k in range(6): add(bsb('1531' if k % 2 else '1529', 0, .5), a + .1 + k * .27, .35, (k % 2 - .5) * .6)
add(click(.4), a + 2.1); add(bsb('1524', 0, 1.2), a + 2.2, .6)
# 9: entra, fecha a porta, pega o casaco, motor e vai embora
a = A2['n9']; add(bsb('1521', .2, 1.0), a + .3, .4); add(ken('impactSoft_medium', 1), a + .8, .4); add(bsb('1526', 0, 1.0), a + 1.15, .6)
add(whoosh(.5, 800, 2400, .2), a + 1.7); add(bp(noise(.3), 600, 2500) * .15, a + 2.4)
add(bsb('0534', 0, 4.0, .05), a + 2.4, .75); add(bsb('1521', 0, 2.0), a + 3.1, .5); add(bsb('1519', 0, 2.0) if os.path.exists(os.path.join(SONS, 'bsb', '1519.ogg')) else bsb('1521', .5, 1.5), a + 3.6, .4)
# 10: indo embora
a = A2['n10']; add(lp(bsb('0534', 4, 4.0, .05), 1800), a, .45); add(bp(noise(4), 400, 2500) * env(int(4 * SR), .3, 2) * .06, a)
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .85 / max(1e-6, np.abs(mx).max())
with wave.open(os.path.join(HERE, 'ferrari_sfx.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok', TOTAL)
