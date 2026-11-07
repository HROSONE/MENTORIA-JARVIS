import numpy as np, wave
from scipy.signal import lfilter, butter
SR = 44100
EV = dict(door=.45, out=.9, a2=1.4, a3=2.6, gem=3.2, before=4.4, b2=7.2, sync=7.9, b3=8.8, b4=9.8, ign=9.9, b5=10.6,
          space=12.0, warp=12.9, cockpit=15.0, look=15.8, shrug=17.6, split=19.0, ret=27.0, touch=28.2, watches=29.4, why=31.4,
          clock=32.6, moving=35.2, compare=38.2, einstein=40.2, gps=42.0, final=44.6, pull=46.4, end=48.5)
N = int(SR * EV['end']); L = np.zeros(N); Rr = np.zeros(N); rng = np.random.default_rng(9)
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
    n = int(d * SR); x = noise(d); out = np.zeros(n); seg = 14
    for s in range(seg):
        a, b = s * n // seg, (s + 1) * n // seg; fc = f0 * (f1 / f0) ** ((s + .5) / seg); out[a:b] = lp(x[max(0, a - 2000):b], fc)[-(b - a):]
    return out * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5 * g
def boom(d=1.6, f=42): t = T(d); return osc(f * (1 + .5 * np.exp(-t * 6)), d) * np.exp(-t * 2.5) + lp(noise(d), 180) * np.exp(-t * 4) * .9
def hit():
    b = boom(1.2, 50) * .8; c = bp(noise(.3), 1500, 6000) * np.exp(-T(.3) * 18) * .3; b[:len(c)] += c; return b
def hiss(d): t = T(d); return bp(noise(d), 1500, 7000) * env(len(t), .02, d * .7) * .35
def hum(d, f=60): t = T(d); return (osc(f, d) + .5 * osc(f * 2, d) + .25 * osc(f * 3, d)) * env(len(t), .3, .3) * .06
def step(g=.4): t = T(.09); return lp(noise(.09), 1400) * np.exp(-t * 45) * g
def cane(): t = T(.07); return (bp(noise(.07), 1500, 4500) * .6 + osc(2200, .07) * .2) * np.exp(-t * 70) * .5
def tick(f=4000, g=.35): t = T(.03); return (hp(noise(.03), 2500) * .6 + osc(f, .03) * .4) * np.exp(-t * 150) * g
def beep(f=2400, d=.12): t = T(d); return osc(f, d) * env(len(t), .005, .03) * .25
def wind(d, g=.3): t = T(d); return bp(noise(d), 200, 1200) * (.6 + .4 * np.sin(2 * np.pi * .4 * t)) * env(len(t), .4, .4) * g
def rumble(d, g=1.): t = T(d); return (lp(noise(d), 140) + .4 * bp(noise(d), 200, 900)) * env(len(t), .15, .8) * g
def ping(f=1800, d=.5): t = T(d); return (osc(f, d) * .5 + osc(f * 2.01, d) * .2) * np.exp(-t * 9) * .4
def shimmer(d=1.5): t = T(d); return sum(osc(f, d) * np.exp(-t * 2.5) * (.5 + .5 * np.sin(2 * np.pi * 7 * t + f)) for f in (1760, 2217, 2637, 3520)) * .05
def riser(d, f0=150, f1=1800): t = T(d); f = f0 * (f1 / f0) ** (t / d); return (osc(f, d) * .25 + hp(noise(d), 1500) * .25 * t / d) * env(len(t), .1, .05) * (t / d)
def rewind(d=.6): t = T(d); f = 300 + 2600 * (t / d); return (bp(noise(d), 800, 5000) * .3 + osc(f, d) * .1) * env(len(t), .02, .1)
def sonic(): t = T(1.4); return boom(1.4, 38) + whoosh(1.4, 4000, 200, .8)
def servo(d): t = T(d); fm = 400 * (1 + .2 * np.sin(2 * np.pi * 2 * t)); return bp(np.sign(osc(fm, d)), 300, 2500) * env(len(t), .05, .1) * .08
# ambiente
add(wind(EV['before'] + .2, .25), 0); add(hum(EV['before'], 55), 0, .8)
add(wind(EV['b5'] - EV['before'], .2), EV['before'], 1.0)
add(hum(EV['split'] - EV['cockpit'], 70), EV['cockpit'], 1.3)
add(wind(EV['watches'] - EV['ret'], .25), EV['ret'])
add(wind(EV['end'] - EV['final'], .22), EV['final'])
# 1. gancho
add(hiss(1.2), EV['door'], 1.0); add(servo(.5), EV['door'], 1.0); add(boom(1.0, 60), EV['door'] + .45, .4)
for k in range(5): add(step(.35), EV['out'] + .1 + k * .28, 1.0, -.2)
for k in range(4): add(cane(), EV['a2'] + .15 + k * .32, 1.0, .3); add(step(.25), EV['a2'] + .3 + k * .32, 1.0, .3)
add(whoosh(.5, 300, 1500, .4), EV['a3'] - .2, 1.0)
add(hit(), EV['gem'], 1.0); add(shimmer(1.2), EV['gem'], 1.0)
# 2. 50 anos antes
add(rewind(.7), EV['before'] - .35, 1.0); add(hit(), EV['before'], .6)
for k in range(5): add(tick(), EV['b2'] + .1 + k * .14 * 3, 1.0, -.3); add(tick(3600), EV['b2'] + .2 + k * .14 * 3, 1.0, .3)
add(beep(2600), EV['sync'] - .05, 1.0); add(beep(2600), EV['sync'] + .1, 1.0); add(ping(2000), EV['sync'], 1.0)
t = EV['sync'] + .3
while t < EV['b3']: add(tick(), t, 1.0); t += .5
for k in range(3): add(step(.25), EV['b3'] + .2 + k * .3, 1.0)
add(hiss(1.0), EV['b4'] - .4, .7)
add(rumble(3.0, 1.2), EV['ign'], 1.0); add(boom(2.0, 36), EV['ign'], 1.0); add(whoosh(2.5, 200, 1500, .8), EV['b5'], 1.0)
add(rumble(1.6, .9), EV['b5'] + .8, 1.0)
# 3. espaço
add(whoosh(1.0, 300, 3000, .5), EV['space'], 1.0); add(riser(EV['warp'] - EV['space'], 120, 900), EV['space'], .7)
add(sonic(), EV['warp'], 1.0); add(whoosh(2.0, 3000, 300, .6), EV['warp'] + .1, 1.0)
for k in range(8): add(beep(1800 + 300 * (k % 3), .06), EV['cockpit'] + .3 + k * .45, .5, .4 * ((-1) ** k))
t = EV['look']
while t < EV['shrug']: add(tick(), t, .9); t += .5
add(whoosh(.4, 500, 1500, .3), EV['shrug'], 1.0)
# 4. tela dividida
add(whoosh(.5, 300, 2500, .6), EV['split'], 1.0)
t = EV['split'] + .3; k = 0
while t < EV['ret'] - .3: add(tick(4200, .3), t, 1.0, .6); t += max(.06, .4 - .02 * k); k += 1
t = EV['split'] + .3
while t < EV['ret'] - .3: add(tick(2600, .35), t, 1.0, -.6); t += 1.5
add(riser(EV['ret'] - EV['split'] - .4, 100, 600), EV['split'] + .2, .4)
# 5. volta
add(rumble(1.4, .9), EV['ret'], 1.0); add(whoosh(1.2, 2500, 300, .5), EV['ret'], 1.0)
add(boom(1.4, 45), EV['touch'], 1.0); add(hiss(1.0), EV['touch'] + .35, 1.0)
add(hit(), EV['watches'], .8); add(tick(), EV['watches'] + .2, 1.0); add(tick(), EV['watches'] + 1.2, 1.0)
add(hit(), EV['watches'] + .5, .6)
# 6. por quê / relógio de luz
add(hit(), EV['why'], 1.0)
t = EV['clock']; n = 0
while t < EV['moving']: add(ping(1800 if n % 2 else 2400, .35), t + .55, .7, .2 * ((-1) ** n)); t += .55; n += 1
add(whoosh(1.2, 300, 2500, .4), EV['moving'], 1.0)
t = EV['moving']; n = 0
while t < EV['compare']: add(ping(2000, .3), t + .55, .6, -.6 + 1.2 * (t - EV['moving']) / 3); t += .55; n += 1
t = EV['compare']
while t < EV['einstein']: add(ping(2600, .2), t + .3, .45, -.5); t += .3
t = EV['compare']
while t < EV['einstein']: add(ping(1400, .5), t + 1.2, .7, .5); t += 1.2
add(shimmer(1.8), EV['einstein'], 1.3); add(hit(), EV['einstein'], .6)
for k in range(6): add(beep(1600 + 400 * (k % 2), .08), EV['gps'] + .3 + k * .62, .6)
add(whoosh(.6, 300, 2000, .4), EV['gps'], 1.0)
add(hit(), EV['final'], .5); add(shimmer(2.0), EV['final'] + .2, 1.0)
add(whoosh(2.0, 2000, 300, .4), EV['pull'], 1.0)
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.3) / np.tanh(1.3); mx *= .9 / max(1e-6, np.abs(mx).max())
with wave.open('gemeos_sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok')
