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
S = {x['k']: x for x in NR['s']}; TN = lambda k: S[k]['t0']
SH = [('coats', 0, 4.0), ('island', 4.0, TN('b2') - .05), ('steal', TN('b2') - .05, TN('b3') - .05), ('pipe', TN('b3') - .05, TN('b3') + 2.4), ('plan', TN('b3') + 2.4, TN('b4') - .05),
  ('barber', TN('b4') - .05, TN('b4') + 1.9), ('build', TN('b4') + 1.9, TN('b5') - .05), ('patrol', TN('b5') - .05, TN('b5') + 1.8), ('bed', TN('b5') + 1.8, TN('b6') - .05), ('roof', TN('b6') - .05, TN('b6') + 2.6), ('bay', TN('b6') + 2.6, TOTAL)]
A = {n: (a, b) for n, a, b in SH}
# 1. capas aparecendo: um "pendurar" de borracha a cada capa nova (acelera como o contador)
a, b = A['coats']; bedL('0114', 2, a, b - a, .25)
prev = 0
for i in range(400):
    tt = .02 * i; n = 1 + int(min(1, max(0, (tt - .3) / 3.1)) ** 1.5 * 49)
    if n > prev and tt < 3.5: add(rubber(.12, .12 + .02 * (n % 3)), tt, 1.0, ((n * 37) % 100 / 50 - 1) * .6); add(hp(bsb('1372', 2.0, .1, .005), 1000), tt, .25); prev = n
add(ken('impactPunch_heavy', 1), 3.45, .6); add(lp(noise(.4), 140) * np.exp(-T(.4) * 9) * .7, 3.45)
add(lp(noise(.4), 140) * np.exp(-T(.4) * 9) * .6, 0.0); add(whoosh(.3, 4500, 700, .2), 0.0)
# 2. ilha
a, b = A['island']; bedL('1446', 10, a, b - a, .9); bedL('0146', 8, a, b - a, .4); add(lp(bsb('1048', 0, 2.3), 2400), a + .15, .65, .3)
for k in range(2): add(whoosh(.7, 300, 900, .07), a + .2 + k * .9, 1.0, .5)
# 3. roubando capas: passos do guarda + a capa saindo do cabide (4 vezes)
a, b = A['steal']; bedL('2968', 30, a, b - a, .1); bedL('0114', 9, a, b - a, .15)
for k in range(9): add(lp(ken('footstep_concrete', k % 5), 2600), a + .2 + k * .52, .3, -.6 + k * .15)
for c in range(4):
    tc = a + .6 + (c + .3) * (b - a - 1.0) / 4; add(rubber(.35, .32), tc, 1.0, .2); add(whoosh(.3, 700, 2800, .12), tc + .1)
# 4. cano quente: vapor chiando, borracha esticando, coração
a, b = A['pipe']; bedL('0227', 0, a, b - a, .4); add(lp(ken('impactMetal_light', 1), 1500), a + .2, .3)
for k in range(3): add(rubber(.45, .3), a + .3 + k * .7, 1.0, (k % 2 - .5) * .5)
for k in range(4): add(lp(bsb('0243', 0, .5, .01), 500), a + .15 + k * .55, .45)
s_ = hp(noise(b - a), 2500) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 7 * T(b - a)))) * .04; add(s_ * env(len(s_), .1, .2), a)
# 5. o projeto: capas deslizando e se encaixando, o bote aparece
a, b = A['plan']; add(lp(ken('computerNoise', 1), 3000), a, .12); add(drone(b - a, 60, .07), a)
for i in range(10): add(whoosh(.35, 500 + i * 80, 2200, .07), a + .2 + i * .18, 1.0, (i % 2 - .5) * .8); add(ken('impactSoft_medium', i % 5), a + 1.9 + i * .03, .12)
add(ken('forceField', 1), a + 2.2, .3); add(ken('impactSoft_heavy', 1), a + 2.25, .5)
for i in range(2): add(ken('laserSmall', i + 1), a + 2.8 + i * .12, .12)
# 6. barbearia: tesoura cortando no ritmo da animação
a, b = A['barber']; bedL('2968', 50, a, b - a, .15)
tt = a
while tt < b - .05: add(snip(.4), tt, 1.0, .2); tt += np.pi / 9
# 7. a cabeça: pinceladas, depois cabelo sendo colado
a, b = A['build']
for k in range(8): add(bp(noise(.18), 1500, 6000) * np.sin(np.pi * T(.18) / .18) * .12, a + .35 + k * .17)
add(ken('impactSoft_medium', 2), a + 1.85, .4); add(bp(noise(.6), 2000, 7000) * env(int(.6 * SR), .1, .4) * .06, a + 1.9)
# 8-9. a ronda e as camas
a, b = A['patrol']; bedL('0114', 12, a, b - a, .2)
for k in range(4): add(lp(ken('footstep_concrete', (k + 2) % 5), 3500), a + .1 + k * .45, .55, -.5 + k * .3)
add(lp(bsb('0083', 0.3, 1.0), 2500), a + .3, .2, .3); add(bsb('0052', .2, .4), a + .02, .3)
a, b = A['bed']; add(drone(b - a, 44, .12), a)
for k in range(5): add(lp(bsb('0243', 0, .5, .01), 500), a + .2 + k * .6, .5)
for k in range(4): add(lp(ken('footstep_concrete', k), 2000), a + 1.6 + k * .45, .3 - k * .06, .6)
# 10. telhado: vento, corrida, buzina
a, b = A['roof']; bedL('0146', 40, a, b - a, .55); add(lp(bsb('1048', 0, 2.2), 2500), a + .3, .4, .4)
for k in range(10): add(lp(bsb('3216', 3 + (k % 5) * .4, .25, .01), 3000), a + .1 + k * .25, .5, -.4 + k * .1)
# 11. baía: ondas, remadas, buzina longa, vento
a, b = A['bay']; bedL('1448', 5, a, b - a, .8, .2, .02); bedL('0146', 50, a, b - a, .35, .2, .02); add(lp(bsb('1048', 0, 2.6), 2200), a + .6, .55)
for k in range(6): add(lp(noise(.3), 1300) * np.exp(-T(.3) * 9) * .3, a + .3 + k * .62, 1.0, (k % 2 - .5) * .6)
# transições: flash curto + whoosh em cada corte
for n, a, b in SH[1:]: add(whoosh(.25, 4000, 600, .14), a - .14, 1.0)
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .85 / max(1e-6, np.abs(mx).max())
with wave.open(os.path.join(HERE, 'alca3_sfx.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok', TOTAL)
