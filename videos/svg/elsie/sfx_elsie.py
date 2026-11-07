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

A = {x['k']: (x['a'], x['b']) for x in NR['s']}
def pad(d, f, g=.06):   # tom de ambiente cinematográfico (sem música: só um "drone" grave)
    t = T(d); x = sum(np.sin(2 * np.pi * f * m * t + m) / m for m in (1, 1.5, 2)) * (.7 + .3 * np.sin(2 * np.pi * .1 * t))
    return lp(x, 700) * env(len(t), 2.0, 2.0) * g
def wind_(a, d, g): bedL('0146', 10 + a, a, d, g, 1.0, 1.0)
# c1 drone sobre a pradaria
a, b = A['c1']; wind_(a, b - a, .45); add(pad(b - a, 55, .05), a); add(whoosh(3.0, 200, 900, .07), a + 2); add(whoosh(2.0, 300, 1200, .06), a + 6.5)
bedL('0935', 20, a + 8.0, b - a - 8.0, .35, .8, .3)
# c2 placa + carro passando; porta, passos, xícara
a, b = A['c2']; bedL('0935', 30, a, b - a, .35); add(lp(bsb('1442', 2, 2.0), 3000) * env(int(2 * SR), .3, .6), a + .5, .5)
add(whoosh(.8, 400, 2400, .25), a + 1.2, 1.0, .4); add(bsb('3205', 0, 1.4), a + 3.9, .3); add(lp(ken('footstep_wood', 1), 2500), a + 4.3, .3); add(lp(ken('footstep_wood', 2), 2500), a + 4.8, .3)
# c3 1930 → 2004: vozes, trem, relógio acelerando, vento
a, b = A['c3']; bedL('2968', 20, a, 6.0, .3, .3, 2.0); bedL('2849', 3, a, 3.4, .5, .2, .8); bedL('0146', 30, a + 3, b - a - 3, .35, 1.5, .5)
tk, gap = a + 3.6, .6
while tk < b - 2.6: add(hp(bsb('1372', 2.0, .1, .005), 900), tk, .3); tk += gap; gap = max(.12, gap * .95)
for k in range(7): add(lp(bsb('3211', .2, .8), 1500), a + 5 + k * 2.0, .12, (k % 2 - .5))   # portas batendo/rangendo
add(pad(b - a, 46, .05), a)
# c4 1971 / 2000 / 2004 — chuva, relógio, vela
a, b = A['c4']; bedL('0935', 50, a, 5.6, .3); add(lp(ken('impactWood_light', 1), 2500), a + 1.8, .4)
bedL('0425', 0, a + 5.6, 4.6, .3, .3, .3)
bedL('0124', 3, a + 10.2, b - a - 10.2, .35, 1.0, .5); add(pad(b - a - 10.2, 41, .06), a + 10.2)
for k in range(int(b - a - 10.2)): add(hp(bsb('1372', 2.0, .1, .005), 900), a + 10.4 + k, .15)
# c5 eleição: passos, suspense, caneta, cédula caindo, confete
a, b = A['c5']; add(pad(b - a, 50, .06), a)
for k in range(8): add(lp(ken('footstep_wood', k % 5), 2400), a + .3 + k * .42, .35)
for k in range(5): add(lp(bsb('0243', 0, .5, .01), 500), a + 3.8 + k * .5, .5)
add(bp(noise(.4), 2000, 6000) * env(int(.4 * SR), .05, .1) * .2, a + 6.4); add(bp(noise(.4), 2000, 6000) * env(int(.4 * SR), .05, .1) * .2, a + 6.8)
add(whoosh(.8, 2000, 400, .1), a + 9.8); add(ken('impactSoft_medium', 1), a + 10.6, .5)
add(bsb('2363', 1.0, 3.0), a + 12.3, .35); add(ding(1568, .2), a + 11.3)
# c6 papelada: caneta, cadeira, passos, carimbo
a, b = A['c6']; bedL('0425', 5, a, b - a, .15); add(pad(b - a, 58, .04), a)
for k in range(10): add(bp(noise(.18), 2500, 7000) * env(int(.18 * SR), .02, .05) * .12, a + .4 + k * .45)
add(lp(bsb('3211', .1, .6), 1500), a + 5.3, .2)
for k in range(6): add(lp(ken('footstep_wood', k % 5), 2400), a + 5.6 + k * .45, .3)
add(lp(bsb('3211', .1, .6), 1500), a + 8.3, .2)
for k in range(4): add(bp(noise(.18), 2500, 7000) * env(int(.18 * SR), .02, .05) * .12, a + 9.6 + k * .2)
add(ken('impactPunch_heavy', 0), a + 10.7, .6); add(ding(1760, .15), a + 10.8)
# c7 biblioteca: pássaros fora, tique, livros
a, b = A['c7']; bedL('0935', 70, a, 3.4, .35); bedL('0425', 8, a + 3.4, b - a - 3.4, .1); add(pad(b - a, 62, .04), a)
add(bsb('3205', 0, 1.2), a + 3.2, .2)
for k in range(4): add(lp(ken('footstep_wood', k % 5), 2400), a + 3.5 + k * .4, .3)
add(ken('impactWood_light', 3), a + 6.0, .5); add(bp(noise(.5), 1500, 5000) * env(int(.5 * SR), .05, .3) * .1, a + 5.6)
# c8 carros chegando, taverna cheia: conversa, chapa chiando, risadas, caneta
a, b = A['c8']
for k in range(6): add(lp(bsb('1442', 2 + k, 1.8), 2500) * env(int(1.8 * SR), .3, .6), a + k * .45, .3, (k % 2 - .5) * 1.4)
for k in range(4): add(lp(ken('impactMetal_medium', k), 2000), a + 2.6 + k * .2, .15)
bedL('2479', 3, a + 3.8, b - a - 3.8, .45, .5, .5); bedL('0227', 0, a + 3.8, b - a - 3.8, .15, .5, .5)
for k in range(int((b - a - 3.8) / 1.3)): add(bp(noise(.25), 2500, 7000) * env(int(.25 * SR), .02, .1) * .1, a + 4.3 + k * 1.3)
# c9 noite: grilos, interruptor, porta, passos, drone subindo
a, b = A['c9']; bedL('0110', 30, a, b - a, .5, .5, 1.5); bedL('0425', 0, a, b - a, .2)
for k in range(6): add(lp(ken('footstep_wood', k % 5), 2400), a + 1.1 + k * .42, .25)
add(lp(bsb('0052', .2, .4), 4000), a + 4.4, .5); add(bsb('3205', .6, 1.0), a + 3.6, .2)
add(whoosh(4.0, 150, 700, .08), a + 6.8); add(pad(b - a, 44, .06), a)
for x in NR['s'][1:]: add(whoosh(.5, 2500, 400, .07), x['a'] - .25, 1.0)
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .8 / max(1e-6, np.abs(mx).max())
with wave.open(os.path.join(HERE, 'elsie_sfx.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok', TOTAL)
