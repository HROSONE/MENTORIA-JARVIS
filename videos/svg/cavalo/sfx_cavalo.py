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
def steps(t0, n, gap, g=.4, pan=0, lp_=2600, kind='footstep_grass'):
    for k in range(n): add(lp(ken(kind, k % 5), lp_), t0 + k * gap, g, pan)
def thump(g=.6): return lp(ken('impactWood_heavy', 1), 1800) * g
def vaults(a, b, rate, off=0, g=.5):   # som de cada salto: corrida, mãos batendo no couro, aterrissagem
    ph0 = off
    for i in range(40):
        tj = a + (i - off) / rate
        if tj < a or tj > b: continue
        t_hit = tj + .45 / rate; t_land = tj + .8 / rate
        if t_hit < b: add(lp(ken('impactSoft_heavy', i % 5), 2200), t_hit, g * .8); add(lp(ken('impactWood_medium', i % 5), 1500), t_hit + .01, g * .4)
        if t_land < b: add(lp(ken('footstep_grass', i % 5), 2500), t_land, g * .6)
# 1. pátio, saltos, guarda
a, b = A['n1']; bedL('0935', 5, a, b - a, .45); bedL('2968', 40, a, b - a, .12)
for j in range(4): vaults(a, b, .62, -j * .25 * 1 / .62 * .62)
add(lp(noise(.4), 140) * np.exp(-T(.4) * 9) * .6, a); add(whoosh(.3, 4500, 700, .15), a)
# 2. carregando o cavalo, bocejo, saltos
a, b = A['n2']; bedL('0935', 25, a, b - a, .4)
add(bsb('3205', 0, 1.6), a + .05, .6, -.4); steps(a + .95, 9, .27, .45, .0); add(lp(ken('impactWood_heavy', 0), 1800), a + 3.35, .6)
for k in range(3): add(bsb('2892'), a + .5 + k * 1.2, .08, .6)
add(bp(noise(1.0), 200, 900) * env(int(SR), .3, .5) * .25, a + 3.6)          # bocejo do guarda
vaults(a + 3.4, b, .8, 0); vaults(a + 3.4, b, .8, .33)
# 3. o corte: alguém lá dentro (tensão)
a, b = A['n3']; bedL('0935', 45, a, b - a, .25); add(drone(b - a, 52, .1), a)
add(whoosh(.5, 300, 2500, .18), a + 1.0); add(ken('impactPunch_heavy', 1), a + 1.3, .5)
for k in range(4): add(lp(bsb('0243', 0, .5, .01), 500), a + 1.6 + k * .55, .55)
vaults(a, b, .7, 0, .35)
# 4. cavando debaixo (abafado), sacos
a, b = A['n4']; add(drone(b - a, 46, .12), a)
for k in range(int((b - a) * 7 / (2 * np.pi)) + 1): add(lp(bp(noise(.25), 300, 2500) * np.exp(-T(.25) * 12), 1800) * .5, a + .3 + k * 2 * np.pi / 7)
vaults(a, b, .75, 0, .5)
for k in range(5): add(ken('impactSoft_medium', k), a + .6 + k * (b - a - 1) / 5, .35)
# 5. tábua, areia, carregar pesado
a, b = A['n5']; bedL('0935', 60, a, b - a, .35)
add(lp(ken('impactWood_medium', 2), 2000), a + .9, .6); add(bp(noise(.9), 1500, 6000) * env(int(.9 * SR), .1, .3) * .12, a + 1.0)
steps(a + 2.3, 10, .32, .5, .0, 2200)
for k in range(4): add(bp(noise(.4), 200, 900) * np.sin(np.pi * T(.4) / .4) * .25, a + 2.5 + k * .7)   # esforço
add(lp(bsb('0360', 0, .8), 2000), a + 2.4, .15)
# 6. os meses passando (contador)
a, b = A['n6']; add(drone(b - a, 50, .07), a)
tt, gap = a + .2, .5
while tt < b - .8: add(hp(bsb('1372', 2.0, .1, .005), 900), tt, .35); tt += gap; gap = max(.06, gap * .88)
for k in range(8): add(whoosh(.4, 300, 1800, .05), a + .3 + k * .45)
add(ken('impactPunch_heavy', 1), b - .7, .45)
# 7. noite da fuga
a, b = A['n7']; bedL('0110', 5, a, b - a, .5); bedL('2118', 0, a, b - a, .06)
for k in range(10): add(lp(bp(noise(.2), 200, 1500) * np.exp(-T(.2) * 10), 1500) * .35, a + .3 + k * .32)   # rastejando
for k in range(3): add(lp(ken('footstep_grass', k), 2500), a + 3.3 + k * .5, .45, .4)
add(lp(bsb('2955', 0, 1.2), 1500), a + 2.0, .15, -.6)
# 8. trem e navio
a, b = A['n8']; bedL('2849', 2, a, 1.9, .55, .1, .2); add(lp(bsb('1048', 0, 2.0), 2400), a + 2.0, .45)
bedL('1448', 9, a + 1.9, b - a - 1.9, .6); add(bsb('2363', 1.0, 1.8), a + 2.4, .25)
# 9. alarme de manhã, cavalo sozinho
a, b = A['n9']
al = np.sign(np.sin(2 * np.pi * 2 * T(3.2))) * .5 + .5; siren = np.sin(2 * np.pi * (650 + 300 * al) * T(3.2)) * .16; add(lp(siren, 3000) * env(len(siren), .05, .4), a)
steps(a + .1, 8, .2, .5, .3, 3000, 'footstep_grass'); bedL('0935', 80, a + 2.4, b - a - 2.4, .5, .5, .3)
for x in NR['s'][1:]: add(whoosh(.25, 4000, 600, .12), x['a'] - .14, 1.0)
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .85 / max(1e-6, np.abs(mx).max())
with wave.open(os.path.join(HERE, 'cavalo_sfx.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok', TOTAL)
