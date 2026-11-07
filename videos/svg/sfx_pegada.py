import numpy as np, wave
from scipy.signal import lfilter, butter
SR = 44100
EV = dict(hop=0, stomp=2.5, top=3.0, lift=3.4, line=5.0, num=6.2, numEnd=8.4, walk=9.0, launch=10.4, fly=11.6, home=13.0, door=14.2, back=15.0,
          tl=17.0, age=21.5, go=24.5, land=26.0, look=27.3, find=28.0, trace=29.2, touch=30.5, face=32.0, why=33.0, split=34.2, wave=35.0, mil=37.5, outro=41.0, end=44.5)
N = int(SR * EV['end']); L = np.zeros(N); Rr = np.zeros(N); rng = np.random.default_rng(3)
def add(sig, t0, g=1., pan=0.):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if j <= i or i < 0: return
    s = sig[:j - i] * g; L[i:j] += s * np.sqrt(.5 * (1 - pan)); Rr[i:j] += s * np.sqrt(.5 * (1 + pan))
def T(d): return np.arange(int(d * SR)) / SR
def lp(x, fc): b, a = butter(2, min(fc, SR / 2.2) / (SR / 2)); return lfilter(b, a, x)
def hp(x, fc): b, a = butter(2, fc / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def noise(d): return rng.standard_normal(int(d * SR))
def osc(f, d): f = np.broadcast_to(f, (int(d * SR),)); return np.sin(2 * np.pi * np.cumsum(f) / SR)
def env(n, a, r):
    e = np.ones(n); A, B = int(a * SR), int(r * SR)
    if A: e[:A] = np.linspace(0, 1, A)
    if B: e[n - B:] *= np.linspace(1, 0, B)
    return e
def whoosh(d, f0, f1, g=1.):
    n = int(d * SR); x = noise(d); out = np.zeros(n); seg = 12
    for s in range(seg):
        a, b = s * n // seg, (s + 1) * n // seg; fc = f0 * (f1 / f0) ** ((s + .5) / seg); out[a:b] = lp(x[max(0, a - 2000):b], fc)[-(b - a):]
    return out * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5 * g
def thud(f=60, d=.5, g=1.): t = T(d); return (osc(f * (1 + .6 * np.exp(-t * 25)), d) * np.exp(-t * 9) + lp(noise(d), 300) * np.exp(-t * 20) * .5) * g
def boom(d=1.6): t = T(d); return (osc(42 * (1 + .5 * np.exp(-t * 6)), d) * np.exp(-t * 2.5) + lp(noise(d), 180) * np.exp(-t * 4) * .9)
def scratch(d): t = T(d); return bp(noise(d), 1500, 6000) * (.55 + .45 * np.abs(np.sin(2 * np.pi * 7 * t))) * env(len(t), .03, .08) * .35
def hiss(d): return lp(hp(noise(d), 2000), 7000) * env(int(d * SR), .05, d * .8) * .12
def rumble(d): t = T(d); return lp(noise(d), 160) * env(len(t), .1, .6) * .9 + bp(noise(d), 300, 1200) * env(len(t), .1, .6) * .2
def step(): t = T(.08); return lp(noise(.08), 1500) * np.exp(-t * 50) * .4
def door(): return thud(110, .3, .7) + bp(noise(.3), 200, 900) * np.exp(-T(.3) * 15) * .3
def cricket(d):
    out = np.zeros(int(d * SR)); t = T(.05); ch = osc(4300, .05) * np.sin(np.pi * t / .05) * .05
    k = 0.0
    while k < d - .1:
        for j in range(3): i = int((k + j * .06) * SR); out[i:i + len(ch)] += ch
        k += .45
    return out
def tick(): return hp(noise(.025), 3000) * np.exp(-T(.025) * 160) * .35
def chime(f=1046, g=1.): t = T(1.6); return sum(osc(f * m, 1.6) * np.exp(-t * (3 + i)) * a for i, (m, a) in enumerate([(1, .3), (1.5, .18), (2, .12), (3, .05)])) * g
def shimmer(d=1.2): t = T(d); return sum(osc(f, d) * np.exp(-t * 3) * (.5 + .5 * np.sin(2 * np.pi * 9 * t + f)) for f in (1760, 2217, 2637, 3520)) * .05
def stinger(): t = T(1.4); return sum(osc(f, 1.4) * np.exp(-t * 2.5) for f in (220, 262, 330, 392)) * .16 + lp(noise(1.4), 400) * np.exp(-t * 5) * .5
def wavecrash(d=1.8): t = T(d); return lp(noise(d), 2500) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** .7 * .7 + hp(noise(d), 4000) * np.exp(-((t - .6) / .25) ** 2) * .4
def wind(d): t = T(d); return bp(noise(d), 300, 1400) * (.6 + .4 * np.sin(2 * np.pi * .7 * t)) * env(len(t), .2, .3) * .35
def riser(d, f0=200, f1=1600): t = T(d); f = f0 * (f1 / f0) ** (t / d); return (osc(f, d) * .3 + hp(noise(d), 1500) * .2 * t / d) * env(len(t), .1, .05) * (t / d)
def pad(d, chord):
    t = T(d); out = sum(osc(f, d) * .5 + osc(f * 1.003, d) * .5 for f in chord) / len(chord)
    return lp(out, 1200) * env(len(t), 1.0, 1.0) * .18
def pluck(f, d=.5):
    n = int(d * SR); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n): out[i] = buf[i % p]; buf[i % p] = .5 * (buf[i % p] + buf[(i + 1) % p]) * .996
    return out
# música: pad espacial + notas
C = [[220, 277, 330], [196, 247, 294], [175, 220, 262], [196, 247, 330]]
t = 0.0; i = 0
while t < EV['end'] - 1:
    quiet = EV['why'] - .1 < t < EV['split']
    if not quiet: add(pad(4.2, C[i % 4]), t, 1.0)
    t += 4; i += 1
mel = [880, 660, 740, 554, 660, 494, 554, 440]
cache = {}
def pl(f):
    if f not in cache: cache[f] = pluck(f, .9)
    return cache[f]
t = 3.2; i = 0
while t < EV['end'] - 1:
    if not (EV['find'] - .1 < t < EV['why'] + 1.2 or EV['split'] < t < EV['mil']): add(pl(mel[i % 8]), t, .1, .3 * ((-1) ** i))
    t += .5; i += 1
# 1. pulos + pisão
for k in range(3): add(thud(80, .35, .35), .8 * (k + 1) - .02)
add(whoosh(.5, 300, 1200, .4), EV['stomp'] - .45, 1.0)
add(boom(1.6), EV['stomp'], 1.0); add(thud(55, .6, 1.0), EV['stomp'], 1.0); add(hiss(2.0), EV['stomp'] + .05, 1.0)
# 2. pegada + risco + número
add(whoosh(.4, 2000, 400, .5), EV['top'] - .15, .8); add(thud(70, .4, .5), EV['top'], 1.0)
add(whoosh(1.0, 400, 2400, .5), EV['lift'], .9); add(hiss(1.6), EV['lift'] + .2, 1.0)
add(scratch(1.1), EV['line'], 1.0)
for k in range(5): add(scratch(.36), EV['num'] + k * .44, 1.0, .2)
add(chime(1318, .6), EV['numEnd'] + .1, 1.0)
# 3. volta e decola
for k in range(2): add(thud(80, .3, .3), EV['walk'] + .8 * (k + 1))
add(rumble(1.6), EV['launch'], 1.2); add(boom(1.2), EV['launch'], .6)
add(whoosh(1.4, 300, 3000, .6), EV['fly'], 1.0)
# 4. em casa
for k in range(10): add(step(), EV['home'] + .1 + k * .31, 1.0, -.3 + .06 * k)
add(door(), EV['door'], 1.0); add(cricket(1.6), EV['door'] - .6, 1.0, .4)
add(whoosh(2.2, 300, 4000, .7), EV['back'] - .4, 1.0)
add(thud(60, .5, .7), EV['tl'], 1.0)
# 5. o tempo passa
t = EV['tl'] + .1; k = 0
while t < EV['go'] - .1:
    add(tick(), t, 1.0, .3 * ((-1) ** k)); t += max(.07, .5 - .06 * k); k += 1
add(riser(EV['age'] - EV['tl'], 150, 700), EV['tl'], .4)
add(whoosh(.6, 400, 2000, .5), EV['age'] - .2, .8)
add(riser(3.0, 300, 900), EV['age'], .3)
# 6. volta pra Lua
add(rumble(1.5), EV['go'], .9); add(whoosh(1.4, 300, 2600, .6), EV['go'] + .1, 1.0)
for k in range(2): add(thud(80, .3, .3), EV['land'] + .8 * (k + .6))
add(stinger(), EV['look'], .8); add(chime(1568, .5), EV['look'], 1.0)
# 7. a mesma pegada
add(thud(60, .5, .6), EV['find'], 1.0); add(shimmer(2.0), EV['find'] + .1, 1.0)
add(scratch(1.1), EV['trace'], .6)
add(chime(1046, 1.0), EV['touch'], 1.0); add(shimmer(1.6), EV['touch'], 1.2)
add(pad(1.4, [262, 330, 392, 523]), EV['face'], 1.4)
# 8. por quê + Terra x Lua
add(stinger(), EV['why'], 1.0); add(boom(1.0), EV['why'], .5)
add(whoosh(.5, 300, 2500, .6), EV['split'] - .1, 1.0)
add(wind(EV['mil'] - EV['split']), EV['split'], 1.0, -.3)
add(wavecrash(1.8), EV['wave'], 1.0, -.2)
# 9. milhões de anos
t = EV['mil']; k = 0
while t < EV['outro'] - .3:
    add(tick(), t, .8, .3 * ((-1) ** k)); t += max(.04, .25 - .02 * k); k += 1
add(riser(EV['outro'] - EV['mil'], 200, 1800), EV['mil'], .5)
add(boom(1.4), EV['outro'], .7); add(chime(1046, 1.0), EV['outro'], 1.0); add(shimmer(2.5), EV['outro'] + .2, 1.0)
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .9 / max(1e-6, np.abs(mx).max())
with wave.open('pegada_sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok')
