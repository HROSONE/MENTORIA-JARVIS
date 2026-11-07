import numpy as np, wave
from scipy.signal import lfilter, butter
SR = 44100
EV0 = dict(door=.45, out=.9, a2=1.4, a3=2.6, gem=3.2, before=4.4, b2=7.2, sync=7.9, b3=8.8, b4=9.8, ign=9.9, b5=10.6,
          space=12.0, warp=12.9, cockpit=15.0, look=15.8, shrug=17.6, split=19.0, ret=27.0, touch=28.2, watches=29.4, why=31.4,
          clock=32.6, moving=35.2, compare=38.2, einstein=40.2, gps=42.0, final=44.6, pull=46.4, end=48.5)
EV = dict(macro=4.0, glitch=7.0, title=9.8, dive=12.0, earth=56.0, bus=58.6, galaxy=61.5, gzoom=63.2, waves=67.5, lhc=75.0, tunnel=80.0, collide=83.2, fcc=86.5, years=90.5, echo=97.0, kaon=105.0, kslow=109.4, kdecay=112.0, cards=116.0, seven=138.0, bang=144.0, annih=146.0, left=151.0, gal2=153.5, back=157.0, beach2=160.5, endcard=165.0, end=171.0)
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

def drone(d, f, g=.08, wob=.15):
    t = T(d); x = sum(osc(f * m * (1 + .003 * np.sin(2 * np.pi * wob * t + m)), d) * a for m, a in [(1, 1), (1.5, .4), (2, .5), (3, .15)])
    return lp(x, 900) * env(len(t), 1.2, 1.2) * g
def waves_sea(d): t = T(d); return lp(noise(d), 700) * (.5 + .5 * np.sin(2 * np.pi * .12 * t) ** 2) * env(len(t), .5, .8) * .25
def gull(): t = T(.5); f = 1800 - 900 * t / .5; return bp(np.sign(osc(f, .5)), 900, 3000) * env(len(t), .03, .2) * .05
def sparkle(): t = T(.6); return sum(osc(f, .6) * np.exp(-t * 8) for f in (2637, 3520, 4186)) * .06
def glitch(d=.15): return (np.sign(osc(rng.choice([120, 180, 240, 60]), d)) * .15 + hp(noise(d), 2500) * .2) * (rng.random(int(d * SR)) > .35)
def bubble():
    d = .1; t = T(d); return osc(500 + 1500 * t / d, d) * np.sin(np.pi * t / d) * .08
def sonar(): t = T(1.8); return (osc(1200, 1.8) * np.exp(-t * 2.2) * .3 + osc(1200, 1.8) * np.exp(-((t - .9) / .3) ** 2) * .06)
def zap(): t = T(.25); return (osc(2000 * np.exp(-t * 8) + 200, .25) * .3 + hp(noise(.25), 3000) * .2) * np.exp(-t * 12)
def anni(): t = T(.18); return (osc(900 + 600 * rng.random(), .18) * .2 + hp(noise(.18), 3000) * .15) * np.exp(-t * 25)
# ---- praia
add(waves_sea(EV['macro'] + .6), 0, 1.2); add(wind(EV['macro'] + .5, .15), 0)
for k in range(3): add(gull(), .6 + k * 1.1, 1.0, .5)
add(sparkle(), 1.6, 1.0, .3); add(sparkle(), 3.0, 1.0, .3)
add(whoosh(1.0, 300, 3000, .5), EV['macro'] - .6, 1.0); add(hit(), EV['macro'], .4)
add(drone(3.0, 110, .06), EV['macro'], 1.0); add(shimmer(2.5), EV['macro'] + .8, 1.0)
add(whoosh(.7, 400, 5000, .6), EV['glitch'] - .5, 1.0)
for k in range(10): add(glitch(.12), EV['glitch'] + k * .27 + rng.random() * .1, 1.0, rng.uniform(-.6, .6))
add(drone(EV['dive'] - EV['glitch'], 55, .1), EV['glitch'], 1.0)
add(hit(), EV['title'], 1.0); add(boom(2.0, 34), EV['title'], .8)
# ---- mergulho: drone que desce de tom + whoosh a cada transição
add(drone(EV['earth'] - EV['dive'] + .5, 82, .07, .05), EV['dive'], 1.0)
KEYS = [12.0, 13.5, 16.5, 18.5, 21.5, 23.5, 26.0, 27.5, 31.5, 35.0, 37.5, 39.0, 42.5, 45.0, 47.0, 48.5, 50.5, 53.0]
for i in range(0, len(KEYS) - 1):
    a, b = KEYS[i], KEYS[i + 1]
    if b - a <= 2.6 and i % 2 == 0 or i in (8, 12, 16):
        add(whoosh(b - a + .3, 200, 2600, .5), a - .1, 1.0)
for a in [13.5, 18.8, 23.6, 27.6, 29.4, 35.2, 39.2, 45.2, 48.6, 53.0]: add(ping(1500 if a < 48 else 900, .5), a, .5)
add(drone(4.0, 40, .12), 31.5, 1.0)
for k in range(10): add(bubble(), 35.2 + k * .2, .8, rng.uniform(-.5, .5))
add(boom(3.0, 30), 53.0, .9); add(shimmer(3.0), 53.2, .8)
# ---- comparações
add(whoosh(.6, 400, 2500, .5), EV['earth'] - .2, 1.0); add(hit(), EV['bus'], .5)
add(beep(800, .3), EV['bus'] + .5, .8)
add(whoosh(1.4, 4000, 150, .8), EV['gzoom'] - .2, 1.0); add(boom(2.0, 40), EV['gzoom'] + .2, .7); add(drone(4.0, 65, .08), EV['gzoom'], 1.0)
# ---- ondas
add(drone(3.4, 55, .2, .4), EV['waves'] + .1, 1.0); add(drone(3.6, 440, .05, 3), EV['waves'] + 3.4, 1.0); add(ping(2200, .6), EV['waves'] + 5.6, 1.0)
# ---- LHC
add(wind(EV['tunnel'] - EV['lhc'], .2), EV['lhc']); add(drone(5.0, 98, .07), EV['lhc'], 1.0)
add(hum(EV['collide'] - EV['tunnel'], 50), EV['tunnel'], 3.0); add(riser(EV['collide'] - EV['tunnel'], 200, 2400), EV['tunnel'], .6)
for k in range(10): add(whoosh(.3, 800, 3000, .3), EV['tunnel'] + .3 + k * .3, 1.0, .6)
add(boom(2.0, 36), EV['collide'], 1.2); add(hit(), EV['collide'], 1.0)
for k in range(14): add(zap(), EV['collide'] + .05 + k * .05, .5, rng.uniform(-.8, .8))
add(whoosh(1.5, 3000, 300, .5), EV['fcc'], 1.0); add(drone(4.0, 73, .07), EV['fcc'], 1.0)
t = EV['years'] + .4; k = 0
while t < EV['years'] + 3.2: add(tick(3000, .3), t, 1.0); t += max(.05, .18 - .006 * k); k += 1
add(hit(), EV['years'] + 3.3, .8)
# ---- ecos
add(lp(noise(EV['kaon'] - EV['echo']), 300) * .15, EV['echo'], 1.0)
for i in range(4): add(sonar(), EV['echo'] + .3 + i * 1.6, .8)
for k in range(12): add(bubble(), EV['echo'] + rng.random() * 7, .6, rng.uniform(-.6, .6))
# ---- kaons
add(riser(EV['kslow'] - EV['kaon'], 150, 1500), EV['kaon'], .5)
t = EV['kaon']; k = 0
while t < EV['kslow']: add(tick(2500, .2), t, 1.0, rng.uniform(-.5, .5)); t += max(.03, .25 - .012 * k); k += 1
add(whoosh(1.0, 3000, 200, .6), EV['kslow'], 1.0); add(drone(2.6, 60, .14, 1.5), EV['kslow'], 1.0)
add(shimmer(1.6), EV['kslow'] + .6, 1.0)
add(boom(1.6, 45), EV['kdecay'], .9); add(zap(), EV['kdecay'], 1.0); add(whoosh(1.0, 300, 2500, .4), EV['kdecay'], 1.0)
# ---- descobertas
for i in range(4):
    a = EV['cards'] + i * 5.5
    add(whoosh(.5, 300, 2500, .5), a - .15, 1.0); add(hit(), a + .05, .45); add(ping(1200 + 300 * i, .5), a + 1.0, .7)
add(beep(500, .4), EV['cards'] + 3 * 5.5 + 1.0, .8)
add(drone(EV['seven'] - EV['cards'], 73, .05), EV['cards'], 1.0)
# ---- 7 magníficos
for i in range(7): add(ping(1046 * 2 ** (i / 7), .9), EV['seven'] + .3 + i * .42, .7, -.6 + i * .2)
add(drone(6.0, 55, .08), EV['seven'], 1.0)
# ---- big bang
add(boom(3.5, 28), EV['bang'], 1.4); add(whoosh(2.5, 200, 4000, .8), EV['bang'], 1.0)
for k in range(60): add(anni(), EV['annih'] + rng.random() * 4.8, .7, rng.uniform(-.9, .9))
add(drone(6.0, 49, .1), EV['left'], 1.0); add(shimmer(3.0), EV['gal2'], 1.0)
# ---- volta
add(whoosh(3.5, 200, 4000, .6), EV['back'], 1.0); add(riser(3.4, 200, 1800), EV['back'], .5)
add(hit(), EV['beach2'], .6); add(waves_sea(EV['endcard'] - EV['beach2']), EV['beach2'], 1.2); add(gull(), EV['beach2'] + 1.0, 1.0, .5)
add(sparkle(), EV['beach2'] + 1.6, 1.0); add(whoosh(.5, 600, 2000, .3), EV['endcard'] - 1.0, 1.0)
add(hit(), EV['endcard'] + 1.0, .5); add(shimmer(3.0), EV['endcard'] + 1.0, 1.0); add(drone(5.0, 55, .07), EV['endcard'], 1.0)
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.3) / np.tanh(1.3); mx *= .9 / max(1e-6, np.abs(mx).max())
with wave.open('zepto_sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok')
