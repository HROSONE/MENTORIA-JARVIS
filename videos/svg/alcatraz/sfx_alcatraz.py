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
B_ = lambda k: TN(k) - .05
SH = [('coat', 0, 1.9), ('island', 1.9, 3.8), ('pile', 3.8, B_('b2')), ('grab', B_('b2'), B_('b2') + 2.4), ('tower', B_('b2') + 2.4, B_('b3')),
  ('pipe', B_('b3'), B_('b3') + 2.0), ('seam', B_('b3') + 2.0, B_('b3') + 3.9), ('raft', B_('b3') + 3.9, B_('b4')), ('hair', B_('b4'), B_('b4') + 2.4), ('head', B_('b4') + 2.4, B_('b5')),
  ('patrol', B_('b5'), B_('b5') + 2.4), ('beds', B_('b5') + 2.4, B_('b6')), ('roof', B_('b6'), B_('b6') + 2.3), ('launch', B_('b6') + 2.3, B_('b6') + 4.5), ('bay', B_('b6') + 4.5, TOTAL)]
A = {n: (a, b) for n, a, b in SH}
def bedL(i, a, t, d, g, fi=.2, fo=.2, pan=0):
    x = bsb(i, 0, None, .01); need = int(d * SR); st = int(a * SR) % max(1, len(x) - 1)
    y = np.concatenate([x[st:]] + [x] * (need // max(1, len(x)) + 1))[:need]; add(y * env(len(y), fi, fo), t, g, pan)
def rubber(d=.3, g=.25):
    t = T(d); f = 500 + 900 * np.sin(np.pi * t / d); return bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .5 + noise(d) * .3, 400, 3000) * np.sin(np.pi * t / d) * g
def snip(g=.3):
    d = .06; t = T(d); return hp(noise(d), 3000) * np.exp(-t * 90) * g + np.sin(2 * np.pi * 4200 * t) * np.exp(-t * 120) * g * .5
# cela / gancho
a, b = A['coat']; bedL('0114', 2, a, b - a, .2); add(rubber(.4, .35), a + .1); add(rubber(.35, .3), a + .7, 1.0, .3); add(ken('impactSoft_heavy', 1), a + 1.45, .7)
# ilha
a, b = A['island']; bedL('1446', 3, a, b - a, .8); bedL('0146', 3, a, b - a, .3); add(lp(bsb('1048', 0, 2.2), 2500), a + .1, .5, -.3)
# pilha de capas
a, b = A['pile']; bedL('0114', 9, a, b - a, .2)
for k in range(10): add(ken('impactSoft_medium', k % 5), a + .1 + k * .17 * (1 - k * .03), .35 + .03 * k, rng.uniform(-.4, .4))
# pegando a capa
a, b = A['grab']; bedL('2968', 30, a, b - a, .12)
for k in range(5): add(lp(ken('footstep_concrete', k % 5), 3000), a + .2 + k * .48, .4, .5)
add(whoosh(.35, 600, 3500, .2), a + 1.0); add(rubber(.3, .3), a + 1.2)
# torre
a, b = A['tower']; bedL('0146', 20, a, b - a, .55); bedL('2118', 0, a, b - a, .1); add(lp(bsb('1048', 0, 2.4), 2500), a + .3, .45, .3)
# cano de vapor
a, b = A['pipe']; bedL('0227', 1, a, b - a, .35); add(lp(ken('impactMetal_light', 1), 1500), a + .3, .3)
for k in range(4): add(lp(bsb('0243', 0, .5, .01), 500), a + .2 + k * .5, .45)
a, b = A['seam']; s_ = hp(noise(b - a), 2500) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 7 * T(b - a)))) * .05; add(s_ * env(len(s_), .1, .2), a)
add(rubber(.5, .4), a + .3); add(rubber(.4, .3), a + 1.1, 1.0, -.3); bedL('0227', 3, a, b - a, .25)
a, b = A['raft']
for k in range(4): add(rubber(.35, .3), a + .1 + k * .45, 1.0, (k % 2 - .5) * .6)
add(bp(noise(1.2), 300, 1800) * env(int(1.2 * SR), .5, .4) * .2, a + .2)
# barbearia + cabeça
a, b = A['hair']; bedL('2968', 50, a, b - a, .15)
for k in range(14): add(snip(.4), a + .1 + k * .16 + .03 * (k % 2), 1.0, .2)
a, b = A['head']
for k in range(10): add(bp(noise(.18), 1500, 6000) * np.sin(np.pi * T(.18) / .18) * .12, a + .2 + k * .27)
add(ken('impactSoft_medium', 2), a + 1.7, .4)
# ronda
a, b = A['patrol']; bedL('0114', 12, a, b - a, .2)
for k in range(5): add(lp(ken('footstep_concrete', (k + 2) % 5), 3500), a + .1 + k * .48, .55, -.3 + k * .15)
add(lp(bsb('0083', 0.3, 1.0), 2500), a + .3, .25, .3); add(bsb('0052', .2, .4), a + .05, .3)
a, b = A['beds']; add(drone(b - a, 44, .12), a)
for k in range(5): add(lp(bsb('0243', 0, .5, .01), 500), a + .2 + k * .55, .5)
for k in range(3): add(lp(ken('footstep_concrete', k), 2000), a + 1.8 + k * .5, .3 - k * .08, .6)
# telhado, margem, baía
a, b = A['roof']; bedL('0146', 40, a, b - a, .6); add(lp(bsb('1048', 0, 2.2), 2500), a + .4, .4, .4)
for k in range(9): add(lp(bsb('3216', 3 + (k % 5) * .4, .25, .01), 3000), a + .1 + k * .24, .5, -.4 + k * .1)
a, b = A['launch']; bedL('1448', 5, a, b - a, .8); add(lp(noise(.6), 900) * np.exp(-T(.6) * 6) * .5, a + .5); add(rubber(.4, .3), a + .3)
for k in range(4): add(lp(noise(.25), 1500) * np.exp(-T(.25) * 10) * .3, a + .9 + k * .3, 1.0, .2)
a, b = A['bay']; bedL('1446', 20, a, b - a, .7, .2, .02); bedL('0146', 50, a, b - a, .4, .2, .02); add(lp(bsb('1048', 0, 2.6), 2200), a + .2, .6)
for n, a, b in SH[1:]: add(whoosh(.22, 4200, 500, .12), a - .12, 1.0)
for p in [x['t0'] for x in NR['s']]: add(lp(noise(.3), 120) * np.exp(-T(.3) * 12) * .5, p + .05, 1.0)   # "punch" grave nas batidas

mx = np.stack([L, Rr], 1)
mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .85 / max(1e-6, np.abs(mx).max())
with wave.open(os.path.join(HERE, 'alcatraz_sfx.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok', TOTAL)
