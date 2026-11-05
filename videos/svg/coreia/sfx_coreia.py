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
TN = lambda k: S[k]['t0']; EN = lambda k: S[k]['t1']
SH = [('cell', 0, TN('h3') - .15), ('bible', TN('h3') - .15, TN('h4') - .15), ('cell2', TN('h4') - .15, TN('a1') - .4), ('village', TN('a1') - .4, TN('a3') - .3), ('inside', TN('a3') - .3, TN('b1') - .3),
  ('statue', TN('b1') - .3, TN('b4') - .3), ('portraits', TN('b4') - .3, TN('b5') - .2), ('enemy', TN('b5') - .2, TN('c1') - .3), ('net', TN('c1') - .3, TN('c3') - .2), ('tv', TN('c3') - .2, EN('c3') + .25), ('boots', EN('c3') + .25, TN('d1') - .05),
  ('tour', TN('d1') - .05, TN('e1') - .3), ('speaker', TN('e1') - .3, TN('e2') - .2), ('dream', TN('e2') - .2, TN('f1') - .3), ('block', TN('f1') - .3, TN('g1') - .3), ('door', TN('g1') - .3, TN('g2') - .2), ('gens', TN('g2') - .2, TN('g4') - .2), ('truck', TN('g4') - .2, TN('i1') - .3),
  ('camp', TN('i1') - .3, TN('j1') - .3), ('report', TN('j1') - .3, TN('j3') - .3), ('years', TN('j3') - .3, TN('j5') - .2), ('book', TN('j5') - .2, TN('k1') - .4), ('map', TN('k1') - .4, TOTAL)]
A = {n: (a, b) for n, a, b in SH}
def bedL(i, a, t, d, g, fi=.6, fo=.6, pan=0):  # trecho longo, repete se precisar
    x = bsb(i, 0, None, .01); need = int(d * SR); st = int(a * SR) % max(1, len(x) - 1)
    y = np.concatenate([x[st:]] + [x] * (need // max(1, len(x)) + 1))[:need]
    add(y * env(len(y), fi, fo), t, g, pan)
# --- cela (abertura) ---
a, b = A['cell']; bedL('0155', 3, 0, A['cell2'][1], .3, .05, 1.0)
add(drone(A['cell2'][1], 41, .12), 0)
for k, tt in enumerate([1.2, 3.9, 6.0, 12.5, 15.4]): add(hp(bsb('1384', [0.12, 3.0, 4.42, 5.8, 7.27][k], .35, .01), 400), tt, .35)
add(lp(bsb('0360'), 3000), 2.6, .35, .4)
a, b = A['bible']; add(ken('impactSoft_heavy', 0), a + .05, .6); add(whoosh(.5, 2500, 400, .15), a - .2, 1.0)
for k in range(12): add(lp(noise(.08), 1800) * np.exp(-T(.08) * 50) * .05, a + .3 + k * .33 + .1 * np.sin(k), 1.0, .5)   # vela crepitando
a, b = A['cell2']; add(bsb('0303'), a + .9, .35, -.3); add(lp(bsb('0361'), 2500), a + 3.4, .35, .3)
# --- vila e casa ---
a, b = A['village']; bedL('0147', 10, a - .3, b - a + .6, 1.1); add(bsb('2955', 0, 1.6), a + 2.2, .12, -.7)
a, b = A['inside']; bedL('1810', 5, a, b - a, .3, .4, .4, -.4); add(drone(b - a, 70, .05), a); add(bsb('2212'), a + 1.4, .35); add(bsb('0362'), a + 4.3, .3)
for k in range(16): add(lp(noise(.08), 1800) * np.exp(-T(.08) * 50) * .04, a + .2 + k * .4, 1.0, .3)
# --- estátuas, retratos, inimigo ---
a, b = A['statue']; bedL('1633', 4, a, b - a, .9, .5, .4); bedL('2968', 30, a, b - a, .25, 1, .5)
for r in range(4): add(lp(noise(1.0), 1200) * env(int(SR), .3, .6) * .25, a + .9 + r * .15, 1.0)   # roupas se curvando
add(ken('impactBell_heavy', 0), a + .4, .25)
a, b = A['portraits']
for k in range(7): add(bp(noise(.5), 1500, 7000) * np.sin(np.pi * T(.5) / .5) * .14, a + .2 + k * 1.05, 1.0, .2)
a, b = A['enemy']; add(drone(b - a, 36, .1), a)
for k in range(9): add(lp(bsb('0166', .2 + (k % 4) * .5, .35, .01), 2500), a + 1.5 + k * .55, .35 + k * .05, np.sin(k * 1.9) * .7)
for k in range(8): add(lp(bsb('0243', 0, .5, .01), 500), a + 2.2 + k * .62, .32)
# --- internet ---
a, b = A['net']; add(lp(ken('computerNoise', 0), 3000), a, .15); add(drone(b - a, 60, .07), a)
for k in range(16): add(ken('laserSmall', k % 5), a + .8 + k * .2, .05, np.sin(k) * .6)
add(ken('forceField', 1), a + 3.5, .3); add(ken('impactMetal_heavy', 1), a + 4.4, .45)
# --- TV escondida ---
a, b = A['tv']; tv = bp(noise(b - a), 2000, 6000) * .025 + lp(noise(b - a), 300) * .05; add(tv * env(len(tv), .2, .2), a)
for k in range(6): add(bsb('3363', 2 + k * .7, .4, .02), a + 3.6 + k * .45, .35, -.5 + k * .2)
add(bsb('2954', 1, 1.0), a + 5.0, .2, .6)
a, b = A['boots']; add(lp(bsb('0166', .2, .5, .01), 5000), a + .33, 1.0); add(ken('impactPunch_medium', 0), a + .34, .5); add(whoosh(.3, 4000, 600, .1), a + .05, 1.0)
# --- turistas, alto-falante, sonho ---
a, b = A['tour']; bedL('1701', 5, a, b - a, .3, .4, .5, -.3); bedL('3216', 2, a + .5, b - a - .5, .25, .3, .4, .3); bedL('2968', 60, a, b - a, .08)
a, b = A['speaker']
vox = bp(bsb('2968', 90, b - a + .4, .05), 500, 2600); vox = np.tanh(vox * 6) * .5
add(vox * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 2.2 * np.arange(len(vox)) / SR))), a, .45, .2)
for k in range(int((b - a) / .45)): add(lp(bsb('3216', 3 + (k % 5) * .4, .25, .01), 2500), a + k * .45, .3, (k % 2 - .5) * .4)
a, b = A['dream']; bedL('0155', 20, a, b - a, .6, .5, .6)
# --- vizinhos ---
a, b = A['block']; bedL('0147', 40, a, b - a, .5, .5, .5); bedL('0114', 5, a, b - a, .2)
for k in range(6): add(lp(bsb('3205', .3, .6, .02), 3000), a + 1 + k * 1.9, .12, rng.uniform(-.7, .7))   # cortinas/janelas
for k in range(12): add(lp(bsb('3216', 5 + (k % 6) * .4, .3, .01), 3000), a + 7.2 + k * .5, .3, -.3 + k * .05)
# --- prisão ---
a, b = A['door']; bedL('1443', 3, a - .4, 3.6, .5, .6, .4, -.5); bedL('0147', 50, a, b - a, .25)
for k in range(8): add(bsb('3363', 5 + k * .6, .4, .02), a + .3 + k * .4, .45, -.3 + k * .08)
add(ken('impactWood_heavy', 3), a + 3.6, 1.0); add(ken('impactPunch_heavy', 1), a + 3.6, .7); add(bsb('0303'), a + 3.65, .4); add(bsb('1544', 0, 3.0), a + 3.9, .25, .6)
a, b = A['gens']; add(drone(b - a, 44, .16), a); add(lp(bsb('0615', 2, b - a, .3), 4000), a, .25, .3)
for k in range(3): add(ken('impactSoft_medium', k), a + .3 + k * 1.6, .5)
add(bsb('2212'), a + .1, .3)
a, b = A['truck']; bedL('1443', 20, a, b - a - 1.5, .55, .3, 1.2, .3); bedL('0147', 60, a, b - a, .3)
for k in range(8): add(bsb('3363', 12 + k * .6, .4, .02), a + .2 + k * .4, .35, -.4)
add(ken('impactMetal_heavy', 3), a + 3.3, .7); add(bsb('2849', 2, 4.0), b - 4.0, .5, .6)
a, b = A['camp']; bedL('0146', 10, a, b - a, .45, .8, .6); bedL('2118', 0, a, b - a, .08)
add(bsb('2955', 0, 2.0), a + 2.5, .3, .6); add(bsb('2954', 3, 2.0), a + 7.5, .2, -.6); add(bsb('2355', 0, 2.5), a + 5.0, .35)
for k in range(10): add(lp(bsb('0360', 0, .8, .02), 2500), a + 1 + k * 1.2, .08, rng.uniform(-.6, .6))
# --- relatório, anos, livro ---
a, b = A['report']; bedL('1065', 3, a + .3, 4.0, .5, .2, .5); add(drone(b - a, 65, .06), a); add(bsb('0362'), a + .1, .45); add(bsb('2212'), a + 5.5, .35)
for k in range(int((b - a) / 1.0)): add(hp(bsb('1372', 2.0, .12, .005), 800), a + .5 + k, .5)
a, b = A['years']; tk, gap = a + .2, .6
while tk < b - .8: add(hp(bsb('1372', 2.0, .12, .005), 800), tk, .4); tk += gap; gap = max(.07, gap * .9)
for k in range(5): add(whoosh(.6, 300, 2400, .1), a + .6 + k * 1.9, 1.0, -.4 + .2 * k)
add(drone(b - a, 50, .1), a)
a, b = A['book']
for k in range(16): add(lp(noise(.08), 1800) * np.exp(-T(.08) * 50) * .12, a + .2 + k * .35, 1.0, .5)
add(drone(b - a, 55, .06), a)
add(bp(noise(.5), 300, 2500) * np.exp(-T(.5) * 7) * .25, b - 2.2, 1.0, .5)          # sopro que apaga a vela
a, b = A['map']; bedL('0155', 30, a, b - a, .7, 1.0, 2.0); add(boom(3.0, 38) if 'boom' in globals() else lp(noise(3.0), 80) * np.exp(-T(3.0) * 1.5) * .6, a + .3, .7)
# transições
for n, a, b in SH[1:]:
    if n not in ('boots', 'bible'): add(whoosh(.45, 3500, 400, .08), a - .25, 1.0)

mx = np.stack([L, Rr], 1)
mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .85 / max(1e-6, np.abs(mx).max())
with wave.open(os.path.join(HERE, 'coreia_sfx.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok', TOTAL)
