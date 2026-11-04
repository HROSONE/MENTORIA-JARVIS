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

EV = dict(hook=0, call=10.5, answer=13.0, title=18.0, sp=22.0, maps=34.0, fam=46.0, calf=58.0, male=68.0, musth=78.0, mem=90.0, drought=100.0, lion=126.0, com=138.0, ground=150.0, names=160.0, mind=180.0, bones=194.0, burial=208.0, eng=222.0, forest=236.0, poach=252.0, tusk=268.0, conflict=282.0, bees=292.0, habitat=302.0, zoo=318.0, life=334.0, happy=346.0, tour=358.0, breed=376.0, sanct=390.0, kenya=402.0, todo=412.0, close=422.0, end=436.0)
N = int(SR * EV['end']); L = np.zeros(N); Rr = np.zeros(N)
def drone(d, f, g=.08):
    t = T(d); x = sum(osc(f * m, d) * a for m, a in [(1, 1), (1.5, .35), (2, .45), (3, .12)])
    return lp(x, 800) * env(len(t), 1.5, 1.5) * g
def savamb(d, night=False):
    t = T(d); out = bp(noise(d), 200, 1500) * .05 * (.7 + .3 * np.sin(2 * np.pi * .1 * t)) * env(len(t), 1, 1)
    if night:
        c = osc(4300, .06) * np.sin(np.pi * T(.06) / .06) * .04
        for k in np.arange(0, d - .3, .5):
            for j in range(3):
                i = int((k + j * .07) * SR); n = min(len(c), len(out) - i)
                if n > 0: out[i:i + n] += c[:n]
    else:
        for k in np.arange(rng.random() * 2, d - 1, 2.3 + rng.random() * 2):
            dd = .25; tt = T(dd); f = 2600 + 900 * np.sin(2 * np.pi * 6 * tt)
            b = osc(f, dd) * np.sin(np.pi * tt / dd) * .03; i = int(k * SR); n = min(len(b), len(out) - i)
            if n > 0: out[i:i + n] += b[:n]
    return out
def erumble(d=2.0, f=38, g=.6):
    t = T(d); fm = f * (1 + .06 * np.sin(2 * np.pi * 3 * t)); x = np.sign(osc(fm, d)) * .4 + osc(fm, d) + .3 * osc(fm * 2, d)
    return lp(x, 220) * env(len(t), .25, .6) * (.7 + .3 * np.sin(2 * np.pi * 4 * t)) * g
def trumpet(d=1.1, g=.5):
    t = T(d); f = (380 + 320 * np.sin(np.pi * np.clip(t / d * 1.3, 0, 1))) * (1 + .02 * np.sin(2 * np.pi * 9 * t))
    saw = sum(osc(f * h, d) / h for h in range(1, 9))
    v = bp(saw, 450, 2600) + bp(noise(d), 1500, 4000) * .25
    return v * env(len(t), .06, .35) * g
def thud(g=.4): t = T(.3); return lp(noise(.3), 180) * np.exp(-t * 18) * g + osc(55, .3) * np.exp(-t * 14) * g
def splash(): t = T(.8); return bp(noise(.8), 600, 5000) * np.exp(-t * 4) * .25
def chain(): t = T(.15); return sum(osc(f, .15) for f in (2400, 3100, 4100)) * np.exp(-t * 30) * .05 + hp(noise(.15), 3000) * np.exp(-t * 40) * .08
def buzz(d): t = T(d); return bp(np.sign(osc(220 * (1 + .03 * np.sin(2 * np.pi * 13 * t)), d)), 180, 1200) * env(len(t), .3, .3) * .06
def soft_hit():
    a = boom(1.5, 45) * .35; b = shimmer(1.2) * .5; a[:len(b)] += b; return a
add(savamb(EV['sp']), 0, 1.0)
add(drone(EV['fam'] - EV['sp'], 55, .06), EV['sp'])
add(savamb(EV['mem'] - EV['fam']), EV['fam'])
add(savamb(EV['drought'] - EV['mem']), EV['mem']); add(wind(EV['lion'] - EV['drought'], .25), EV['drought'])
add(savamb(EV['com'] - EV['lion']), EV['lion'])
add(savamb(EV['mind'] - EV['com']), EV['com'], .8)
add(drone(14, 49, .07), EV['mind']); add(savamb(14), EV['bones']); add(savamb(14, True), EV['burial'])
add(savamb(14), EV['eng']); add(bp(noise(16), 300, 3000) * .03, EV['forest'])
add(savamb(8, True), EV['poach']); add(drone(8, 41, .1), EV['poach'] + 8)
add(savamb(14), EV['tusk']); add(savamb(20, True), EV['conflict']); add(wind(16, .2), EV['habitat'])
add(hum(EV['life'] - EV['zoo'], 60), EV['zoo'], 1.2); add(drone(12, 55, .07), EV['life']); add(hum(12, 50), EV['happy'], 1.0)
add(savamb(9), EV['tour']); add(drone(9, 44, .1), EV['tour'] + 9); add(hum(14, 60), EV['breed'])
add(savamb(EV['todo'] - EV['sanct']), EV['sanct']); add(drone(10, 65, .05), EV['todo']); add(savamb(EV['end'] - EV['close']), EV['close'])
for c in ['sp', 'fam', 'mem', 'com', 'mind', 'eng', 'poach', 'zoo', 'sanct', 'close']: add(soft_hit(), EV[c], .8); add(whoosh(.7, 300, 2200, .4), EV[c] - .4, 1.0)
for k in np.arange(.4, EV['call'] - .6, .46): add(thud(.25), k, 1.0, rng.uniform(-.4, .4))
add(erumble(2.5, 34, .9), EV['call'] + .2, 1.0)
add(trumpet(1.0, .35), EV['answer'] + .4, 1.0, -.5); add(erumble(1.8, 40, .5), EV['answer'] + .8, 1.0, -.3)
for k in np.arange(EV['answer'] + 1, EV['title'] + 3, .45): add(thud(.2), k, 1.0, rng.uniform(-.4, .4))
add(boom(2.5, 36), EV['title'], .7); add(shimmer(2.5), EV['title'], .8)
for i in range(3): add(boom(1.2, 60), EV['sp'] + i * .8, .4); add(trumpet(.7, .2), EV['sp'] + 1 + i * 1.6, 1.0, -.5 + i * .5)
for i in range(4): add(ping(900 + 200 * i, .6), EV['maps'] + .6 + i, .5)
for i in range(3): add(beep(700, .2), EV['maps'] + 4 + i * .8, .6)
add(splash(), EV['fam'] + 1, 1.0); add(splash(), EV['fam'] + 6, .8, .3)
for i in range(4): add(ping(1200, .4), EV['fam'] + 2 + i * .8, .4)
add(erumble(1.5, 46, .4), EV['calf'] + 3, 1.0); add(trumpet(.5, .15), EV['calf'] + 1.5, 1.0, .3)
for k in np.arange(EV['male'] + 1, EV['musth'] - .5, .5): add(thud(.18), k, 1.0, .4)
add(erumble(3.0, 30, .9), EV['musth'] + .5, 1.0); add(trumpet(1.2, .4), EV['musth'] + 4, 1.0); add(wind(6, .2), EV['musth'] + 4)
add(drone(10, 55, .08), EV['mem']); add(erumble(2, 38, .4), EV['mem'] + 4, 1.0)
for i in range(3): add(ping(700, .8), EV['drought'] + 9 + i * 3, .5, -.5 + i * .5)
add(soft_hit(), EV['drought'] + 20, 1.0)
add(lp(noise(1.6), 500) * env(int(1.6 * SR), .1, .8) * .7, EV['lion'] + 1, 1.0, .6)
add(trumpet(.9, .4), EV['lion'] + 3.2, 1.0, -.2); add(erumble(2, 42, .5), EV['lion'] + 3.4, 1.0)
for i in range(5): add(erumble(1.6, 32, .6), EV['com'] + .5 + i * 2.6, 1.0)
for i in range(6): add(erumble(1.2, 28, .5), EV['ground'] + i * 1.6, 1.0, -.6 + i * .2)
for i in range(4):
    ph = EV['names'] + i * 4.5; add(erumble(1.2, 44, .5), ph + .2, 1.0, .7); add(trumpet(.5, .15), ph + 2.2, 1.0, -.3 + .3 * (i % 3))
add(shimmer(2.0), EV['mind'] + 2.2, 1.0); add(ping(1500, .8), EV['mind'] + 8, .6)
add(drone(12, 46, .08), EV['bones']); add(erumble(2.0, 34, .4), EV['bones'] + 3, 1.0)
add(drone(12, 41, .08), EV['burial'])
for k in np.arange(EV['eng'] + .3, EV['eng'] + 6, .5): add(thud(.25), k, 1.0)
add(splash(), EV['eng'] + 4, 1.0); add(splash(), EV['eng'] + 9, .7, .5)
for i in range(4): add(ping(1400 + 200 * i, .5), EV['forest'] + 4 + i * 2, .5)
add(riser(2.5, 100, 600), EV['poach'], .4); add(boom(1.2, 70), EV['poach'] + 2.4, .8); add(trumpet(1.0, .5), EV['poach'] + 2.7, 1.0)
for k in np.arange(EV['poach'] + 2.6, EV['poach'] + 7.5, .3): add(thud(.3), k, 1.0, rng.uniform(-.6, .6))
add(soft_hit(), EV['poach'] + 8, 1.0); add(boom(1.5, 40), EV['poach'] + 9, .6)
for i in range(2): add(tick(2000, .4), EV['tusk'] + 2 + i * 1.2, 1.0)
for k in np.arange(EV['conflict'] + .3, EV['bees'], .55): add(thud(.2), k, 1.0)
add(buzz(9), EV['bees'], 1.0); add(trumpet(.8, .35), EV['bees'] + 2.2, 1.0, -.4)
add(whoosh(10, 200, 1200, .2), EV['habitat'], 1.0)
for k in np.arange(EV['zoo'] + .5, EV['life'] - .5, 1.3): add(chain(), k, 1.0); add(thud(.12), k + .4, 1.0)
for i in range(4): add(tick(2500, .4), EV['life'] + .6 + i * .5, 1.0)
add(boom(1.2, 60), EV['happy'] + 5.2, .7)
for k in np.arange(EV['tour'] + .5, EV['tour'] + 9, .9): add(chain(), k, .8)
add(drone(6, 38, .1), EV['tour'] + 9); add(trumpet(.6, .2), EV['tour'] + 11, 1.0)
add(trumpet(.4, .12), EV['breed'] + 3, 1.0, .4)
add(trumpet(1.0, .3), EV['sanct'] + 2, 1.0); add(shimmer(2.5), EV['sanct'] + .5, .8)
t = EV['kenya'] + .5
while t < EV['kenya'] + 4: add(tick(3000, .2), t, 1.0); t += .12
add(soft_hit(), EV['kenya'] + 5, .8)
for i in range(4): add(ping(1000 + 250 * i, .6), EV['todo'] + .6 + i * 1.4, .6)
add(erumble(3.0, 34, .6), EV['close'] + 1, 1.0); add(trumpet(1.4, .35), EV['close'] + 5, 1.0, .4); add(shimmer(3.0), EV['close'] + 8.5, .8)
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.3) / np.tanh(1.3); mx *= .9 / max(1e-6, np.abs(mx).max())
with wave.open('elef_sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok')
