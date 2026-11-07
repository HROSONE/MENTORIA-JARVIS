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
def steps(t0, n, gap, g=.4, pan=0, lp_=2600, kind='footstep_concrete'):
    for k in range(n): add(lp(ken(kind, k % 5), lp_), t0 + k * gap, g, pan)
# 1. esconde a capa
a, b = A['n1']; bedL('0114', 2, a, b - a, .25); add(drone(b - a, 50, .06), a)
add(lp(noise(.4), 140) * np.exp(-T(.4) * 9) * .6, a); add(whoosh(.3, 4500, 700, .15), a)
add(lp(bsb('0243', 0, .5, .01), 500), a + .5, .6); add(lp(bsb('0243', 0, .5, .01), 500), a + .95, .6)   # coração ao olhar para trás
add(bp(noise(.5), 300, 1500) * env(int(.5 * SR), .1, .3) * .25, a + 1.15)                              # colchão levantando
add(rubber(.6, .4), a + 1.7); add(ken('impactSoft_medium', 1), a + 3.0, .6); add(ken('impactSoft_heavy', 0), a + 3.45, .4)
# 2. guarda vira; ele pega a capa
a, b = A['n2']; bedL('2968', 30, a, b - a, .12)
add(lp(bsb('0105', .7, .4), 3000), a + 1.0, .25, .7); add(whoosh(.3, 800, 2400, .1), a + 1.0, 1.0, .6)   # barulho que chama o guarda
steps(a + .25, 4, .4, .35, -.5); add(rubber(.4, .4), a + 2.0, 1.0, -.1); add(whoosh(.3, 900, 3000, .14), a + 2.05)
steps(a + 2.65, 4, .38, .35, -.7); add(lp(ken('footstep_concrete', 2), 2500), a + 3.75, .3, .5)
# 3. noites + contador
a, b = A['n3']; bedL('0114', 6, a, b - a, .2)
prev = 0
for i in range(220):
    tt = .02 * i; cyc = min(1, max(0, (tt - .2) / (b - a - .7))); n = 1 + int(cyc ** 1.3 * 49)
    if n > prev and tt < b - a - .4: add(rubber(.1, .1), a + tt, 1.0, ((n * 37) % 100 / 50 - 1) * .5); add(hp(bsb('1372', 2.0, .1, .005), 1000), a + tt, .2); prev = n
for k in range(6): add(whoosh(.5, 300, 1600, .05), a + .2 + k * .62)
add(ken('impactPunch_heavy', 1), b - .5, .35)
# 4. cano quente, capas grudando; bote enchendo (sopro)
a, b = A['n4']; bedL('0227', 0, a, 2.6, .45); add(lp(ken('impactMetal_light', 1), 1500), a + .2, .3)
add(rubber(.8, .4), a + .3); s_ = hp(noise(1.0), 2500) * .06; add(s_ * env(len(s_), .1, .3), a + 1.4); add(ken('forceField', 1), a + 1.45, .2)
for k in range(5): add(bp(noise(.35), 200, 900) * np.sin(np.pi * T(.35) / .35) * .35, a + 2.75 + k * .79)   # sopros
add(bp(noise(2.2), 150, 700) * env(int(2.2 * SR), .3, .4) * .08, a + 2.7)
# 5. barbearia
a, b = A['n5']; bedL('2968', 50, a, b - a, .15)
tt = a
while tt < b - .05: add(snip(.3), tt, 1.0, -.3); tt += np.pi / 9
steps(a + .1, 4, .38, .3, .5); add(bp(noise(.3), 1500, 6000) * np.exp(-T(.3) * 8) * .2, a + 2.3); add(rubber(.2, .2), a + 2.6)
# 6. cabeça falsa → cama → buraco
a, b = A['n6']; bedL('0114', 14, a, b - a, .2)
add(ken('impactSoft_medium', 2), a + .05, .45)
for k in range(6): add(bp(noise(.16), 1500, 6000) * np.sin(np.pi * T(.16) / .16) * .14, a + .75 + k * .12)
add(ken('impactSoft_medium', 3), a + 1.6, .4)
add(ken('impactSoft_heavy', 1), a + 2.9, .4); add(bp(noise(.5), 300, 1500) * env(int(.5 * SR), .1, .3) * .25, a + 3.3)
steps(a + 3.8, 3, .33, .3, -.3); add(lp(ken('impactMetal_medium', 1), 2500), a + 4.0, .5); add(lp(ken('impactMetal_light', 3), 2500), a + 4.4, .4)
for k in range(4): add(bp(noise(.25), 200, 1200) * np.exp(-T(.25) * 8) * .3, a + 4.9 + k * .3, 1.0, -.6)
# 7. ronda
a, b = A['n7']; add(drone(b - a, 44, .1), a)
steps(a + .05, 4, .32, .5, -.4); add(bsb('0052', .2, .4), a + .8, .35)
for k in range(4): add(lp(bsb('0243', 0, .5, .01), 500), a + 1.4 + k * .5, .5)
steps(a + 3.3, 4, .35, .45, .5)
# 8. telhado e baía
a, b = A['n8']; bedL('0146', 40, a, 2.4, .5); add(lp(bsb('1048', 0, 2.2), 2500), a + .2, .35, .4)
for k in range(9): add(lp(bsb('3216', 3 + (k % 5) * .4, .25, .01), 3000), a + .1 + k * .25, .5, -.4 + k * .1)
bedL('1448', 5, a + 2.4, b - a - 2.4, .8, .2, .02); bedL('0146', 50, a + 2.4, b - a - 2.4, .3)
add(lp(noise(.6), 900) * np.exp(-T(.6) * 6) * .4, a + 2.45)
for k in range(5): add(lp(noise(.3), 1300) * np.exp(-T(.3) * 9) * .3, a + 2.7 + k * .55, 1.0, (k % 2 - .5) * .6)
# 9. manhã: cobertor, cabeça rolando, susto, alarme
a, b = A['n9']; bedL('0935', 40, a, 3.8, .35)
steps(a + .1, 3, .3, .4, -.2); add(bp(noise(.5), 600, 4000) * env(int(.5 * SR), .05, .3) * .3, a + .95)
add(ken('impactWood_light', 2), a + 1.75, .8); add(ken('impactWood_light', 4), a + 2.0, .4); add(ken('impactWood_light', 1), a + 2.2, .2)
add(lp(noise(.4), 140) * np.exp(-T(.4) * 9) * .8, a + 2.2); add(whoosh(.3, 3000, 500, .2), a + 2.15)
al = np.sign(np.sin(2 * np.pi * 2 * T(1.5))) * .5 + .5; siren = np.sin(2 * np.pi * (700 + 300 * al) * T(1.5)) * .18; add(lp(siren, 3000) * env(len(siren), .02, .2), a + 2.4)
bedL('1446', 30, a + 3.8, b - a - 3.8, .6, .2, .02); add(lp(bsb('1048', 0, 2.0), 2200), a + 3.9, .5)
for x in NR['s'][1:]: add(whoosh(.25, 4000, 600, .12), x['a'] - .14, 1.0)
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .85 / max(1e-6, np.abs(mx).max())
with wave.open(os.path.join(HERE, 'alca4_sfx.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok', TOTAL)
