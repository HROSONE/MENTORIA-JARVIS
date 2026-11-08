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
def slash(t0, g=.5): add(whoosh(.22, 1500, 6000, g), t0); add(hp(ken('impactMetal_light', 1), 2000), t0 + .12, g * .8)
def serve(t0): slash(t0 + .82); add(ding(1760, .1), t0 + .55); add(ding(2200, .08), t0 + .7)
for k in range(5): add(tick(.08), 1.2 + k * .17)
for c in [A2['n2'], A2['n6'], A2['n7'], A2['n9']]: add(whoosh(.3, 3500, 600, .16), c - .16)
bedL('0100', 3, 0, TOTAL, .12, .5, .8)
# n1 / n9: o maluco mordendo a asa (CROC a cada 0,45 s)
for base, dur in ((A2['n1'], A['n1'][1] - A2['n1']), (A2['n9'], A['n9'][1] - A2['n9'])):
    k = 0
    while k / 2.2 + .2 < dur: add(crunch_(.85), base + k / 2.2 + .2); add(kick(.3), base + k / 2.2 + .2); k += 1
# n2: copo e prancheta
a = A2['n2']
for j in range(4): add(step(.15), a + .7 + j * .2)
add(ken('impactGlass_light', 1), a + 2.62, .7); add(ken('impactGlass_light', 3), a + 2.7, .5); chew(a + 2.8, 4, .2)
for j in range(4): add(step(.15), a + 4.3 + j * .2)
add(ding(990, .12), a + 5.0)
# n3: picando metal, óleo, água, engole, balança
a = A2['n3']
for j in range(10): add(hp(ken('impactMetal_light', j % 4), 1500), a + j * .25, .4)
add(bp(noise(.8), 200, 900) * env(int(.8 * SR), .1, .3) * .25, a + 3.4); add(bp(noise(.8), 300, 1400) * env(int(.8 * SR), .1, .3) * .22, a + 4.7)
gulp(a + 5.7, .5); add(ken('impactPlate_light', 0), a + 6.0, .4); add(ding(1560, .14), a + 6.25)
# n4: avião caindo, explosão, sai o garçom, corta e serve
a = A2['n4']; add(riser(1.6, 900, 200, .12), a); add(bsb('1145', 2, 1.7), a, .35)
add(ken('impactMetal_heavy', 0), a + 1.7, 1.0); add(kick(.9), a + 1.7); add(lp(noise(1.2), 400) * np.exp(-T(1.2) * 3) * .5, a + 1.7)
add(ding(660, .1), a + 2.5); slash(a + 2.75, .6); add(whoosh(.5, 2000, 500, .2), a + 3.0)
for j in range(4): add(crunch_(.45), a + 3.6 + j * .7); chew(a + 3.75 + j * .7, 3, .18)
for j in range(16): add(tick(.1), a + 3.6 + j * .18)
# n5: seis apresentações rápidas
a = A2['n5'] + .1
for i, nm in enumerate(['bike', 'cart', 'tv', 'lamp', 'bed', 'coffin']):
    t0 = a + i * 1.4
    if nm == 'bike':
        for j in range(5): add(click(.15), t0 + j * .1); add(bp(noise(.6), 2000, 5000) * env(int(.6 * SR), .05, .3) * .05, t0)
    if nm == 'cart': add(bp(noise(.6), 800, 3000) * (.5 + .5 * np.sin(2 * np.pi * 30 * T(.6))) * .12, t0)
    if nm == 'tv': add(hp(noise(.5), 3000) * .06, t0 + .1)
    if nm == 'lamp':
        for j in range(4): add(ding(2600 + j * 300, .05), t0 + .1 + j * .1)
    if nm == 'bed':
        for j in range(4): add(boing(.25) if 'boing' in globals() else kick(.2), t0 + .1 + j * .12)
    if nm == 'coffin': add(lp(noise(.5), 300) * env(int(.5 * SR), .02, .3) * .2, t0 + .2); add(ding(330, .12), t0 + .35)
    serve(t0); add(crunch_(.5), t0 + 1.25)
# n6: lista (pop a cada objeto)
a = A2['n6']; P6 = (A['n6'][1] - a) / 6
for i in range(6): add(whoosh(.3, 2500, 500, .18), a + i * P6); pop(a + i * P6 + .1, 700 + i * 120)
for j in range(10): add(crunch_(.3), a + .5 + j * .77)
# n7: raio-x, banana, azia
a = A2['n7']; add(riser(.8, 200, 900, .06), a + .6); add(drone(2.4, 90, .05), a + .9)
for j in range(4): add(step(.15), a + 3.6 + j * .2)
add(bp(noise(.2), 800, 3000) * np.exp(-T(.2) * 20) * .3, a + 4.9); add(ken('impactSoft_medium', 1), a + 5.4, .5); add(bsb('0987', 2, 1.8), a + 5.45, .4)
# n8: placa, mordida
a = A2['n8']
for j in range(4): add(step(.15), a + .1 + j * .18)
add(ding(1760, .14), a + .9); add(ding(2200, .1), a + 1.1); add(crunch_(.9), a + 4.4); add(ken('impactMetal_light', 2), a + 4.42, .5); chew(a + 4.55, 6, .25)
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .85 / max(1e-6, np.abs(mx).max())
with wave.open(os.path.join(HERE, 'aviao3_sfx.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok', TOTAL)
