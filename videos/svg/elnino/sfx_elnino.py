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



A = {x['k']: (x['a'], x['b']) for x in NR['s']}
def ding(f=1320, g=.25): d = .9; t = T(d); return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.01 * t)) * np.exp(-t * 5) * g
def beep(f=880, d=.12, g=.2): t = T(d); return np.sign(np.sin(2 * np.pi * f * t)) * env(len(t), .005, .02) * g * .5
def click(g=.25): d = .03; t = T(d); return hp(noise(d), 2500) * np.exp(-t * 200) * g
def riser(d, f0, f1_, g=.15): t = T(d); f = f0 + (f1_ - f0) * (t / d) ** 2; return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .3, .2) * g
def buzz(d, g=.12): t = T(d); return np.sin(2 * np.pi * (520 + 30 * np.sin(2 * np.pi * 7 * t)) * t) * (.6 + .4 * np.sin(2 * np.pi * 31 * t)) * g
# 1. planeta esquentando
a, b = A['n1']; add(lp(noise(.5), 140) * np.exp(-T(.5) * 7) * .8, a); add(drone(b - a, 40, .12), a); add(riser(4.2, 80, 260, .12), a + .2)
for k in range(10): add(click(.2), a + .3 + k * .4)
add(ken('impactPunch_heavy', 1), a + 4.25, .5)
# 2. Pacífico
a, b = A['n2']; bedL('1446', 10, a, b - a, .6); bedL('0146', 3, a, b - a, .25, .3, .3); add(whoosh(1.2, 2000, 300, .1), a + .4)
bedL('0124', 5, a + 2.0, b - a - 2.0, .3, .5, .2)
# 3. Brasil: chuva/trovão, sol forte, calor
a, b = A['n3']; bedL('0124', 15, a, 2.1, .6, .1, .2); add(bsb('3113', 0, 2.0), a + .3, .5, -.3)
bedL('0425', 0, a + 2.0, 1.9, .35, .2, .2); add(riser(1.8, 300, 120, .06), a + 2.0)
add(whoosh(.6, 300, 1500, .1), a + 3.8); add(drone(2.2, 55, .08), a + 3.8)
# 4. SMS 40199 → alerta
a, b = A['n4']; bedL('0114', 2, a, b - a, .12)
for k in range(9): add(click(.35), a + 1.0 + k * .18)
add(whoosh(.3, 1200, 4000, .15), a + 2.8)
for k in range(3): add(beep(1050, .12, .3), a + 3.4 + k * .2)
add(beep(700, .25, .25), a + 4.05)
# 5. rua alagada
a, b = A['n5']; bedL('0124', 25, a, b - a, .7); bedL('1448', 20, a, b - a, .35, .8, .2)
for k in range(4): add(lp(ken('footstep_concrete', k), 2500), a + .1 + k * .38, .4)
add(lp(noise(1.0), 700) * np.exp(-T(1.0) * 2) * .4, a + 1.6); add(ken('impactMetal_medium', 2), a + 1.7, .25)
add(ken('impactPunch_medium', 0), a + 2.35, .4); add(beep(330, .3, .2), a + 2.35)
# 6. mochila
a, b = A['n6']; bedL('0114', 6, a, b - a, .12)
for i in range(5): add(whoosh(.35, 1500, 500, .1), a + .3 + i * .85); add(ken('impactSoft_medium', i), a + .85 + i * .85, .6)
z = bp(noise(.6), 1500, 6000) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 60 * T(.6)))) * env(int(.6 * SR), .05, .1) * .15; add(z, b - .7)
add(ding(1568, .3), b - .5)
# 7. calor
a, b = A['n7']; bedL('0425', 4, a, b - a, .2)
for k in range(3): add(bp(noise(.25), 200, 900) * np.sin(np.pi * T(.25) / .25) * .3, a + .6 + k * .32)   # goles
for k in range(8): add(hp(bsb('1372', 2.0, .1, .005), 900), a + 1.85 + k * .22, .35)
fan = bp(noise(1.8), 200, 1200) * .06; add(fan * env(len(fan), .2, .2), a + 3.6)
# 8. seca
a, b = A['n8']; bedL('0155', 10, a, b - a, .3)
add(ken('impactMetal_light', 2), a + 1.5, .5); add(hp(noise(.12), 3000) * np.exp(-T(.12) * 30) * .3, a + 2.2)
fire = bp(noise(.6), 800, 5000) * (np.abs(noise(.6)) > 1.8) * .3; add(fire, a + 2.3); add(beep(330, .3, .2), a + 2.85)
# 9. dengue
a, b = A['n9']; add(buzz(1.9, .14), a); add(buzz(1.0, .1) * np.linspace(1, 0, int(SR)), a + 1.9)
add(hp(bsb('1385', 0, .8, .02), 400), a + 1.2, .5); add(ding(1320, .3), a + 2.45)
# 10. compartilhe
a, b = A['n10']; add(whoosh(.4, 900, 3600, .15), a + .3)
for k in range(5): add(ding(1800 + k * 200, .08), a + .6 + k * .25)
for x in NR['s'][1:]: add(whoosh(.25, 4000, 600, .12), x['a'] - .14, 1.0)
for x in NR['s'][3:9]: add(ken('impactPunch_medium', 1), x['a'] + .05, .25)   # selo da dica
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .85 / max(1e-6, np.abs(mx).max())
with wave.open(os.path.join(HERE, 'elnino_sfx.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok', TOTAL)
