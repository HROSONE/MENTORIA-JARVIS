import numpy as np, wave
from scipy.signal import lfilter, butter
SR = 44100
EV = dict(wave0=.2, scream=1.0, flee=1.9, why=3.2, cute=5.6, clap1=6.6, graph=9.4, maskOn=12.6, scream2=13.6, human=17.4, clap2=18.4, mori=21.6,
          rewind=26.0, reveal=27.0, stare=27.2, jerk=30.6, alarm=33.8, off=37.6, thumbs=38.6, end=43.5)
N = int(SR * EV['end']); L = np.zeros(N); Rr = np.zeros(N); rng = np.random.default_rng(7)
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
def boing(f0=300): d = .3; t = T(d); return osc(f0 * (1 + .8 * np.sin(np.pi * t / d)), d) * np.exp(-t * 8) * .3
def tape(d=1.0): t = T(d); f = 300 + 2200 * (t / d) ** .5; return (bp(noise(d), 800, 5000) * .3 + osc(f, d) * .12) * (.7 + .3 * np.sin(2 * np.pi * 30 * t)) * env(len(t), .02, .1)
def pluck(f, d=.4):
    n = int(d * SR); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n): out[i] = buf[i % p]; buf[i % p] = .5 * (buf[i % p] + buf[(i + 1) % p]) * .995
    return out
def env(n, a, r): e = np.ones(n); A, B = int(a * SR), int(r * SR); e[:A] = np.linspace(0, 1, A) if A else e[:A]; e[n - B:] *= np.linspace(1, 0, B) if B else 1; return e
def whoosh(d, f0, f1, g=1.):
    n = int(d * SR); x = noise(d); out = np.zeros(n); seg = 10
    for s in range(seg):
        a, b = s * n // seg, (s + 1) * n // seg; fc = f0 * (f1 / f0) ** ((s + .5) / seg); out[a:b] = lp(x[max(0, a - 2000):b], fc)[-(b - a):]
    return out * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5 * g
def servo(d, f=520):
    t = T(d); fm = f * (1 + .25 * np.sin(2 * np.pi * 3 * t)); x = np.sign(osc(fm, d)) * .5 + osc(fm * 2, d) * .3
    return bp(x, 300, 3000) * env(len(t), .03, .08) * .12
def scream(d=1.3, n=6):
    out = np.zeros(int(d * SR)); t = T(d)
    for k in range(n):
        f0 = 500 + rng.random() * 500; f = f0 * (1 + .25 * t / d) * (1 + .03 * np.sin(2 * np.pi * (6 + rng.random() * 2) * t))
        v = np.sign(osc(f, d)) * .5 + osc(f, d) * .5; v = bp(v, 700, 1600) + bp(v, 2200, 3600) * .5
        out += v * env(len(t), .05 + rng.random() * .05, .3) * (.6 + .4 * rng.random())
    return out / n * 1.4
def clap():
    d = .05; t = T(d); return bp(noise(d), 800, 5000) * np.exp(-t * 90)
def applause(d, dens=45):
    out = np.zeros(int((d + .1) * SR)); n = int(d * dens)
    for _ in range(n):
        j = int(rng.random() * d * SR); c = clap() * (.4 + .6 * rng.random()); out[j:j + len(c)] += c
    return out * env(len(out), .1, .5) * .35
def steps(d, rate=9):
    out = np.zeros(int(d * SR)); k = 0
    while k / rate < d - .05:
        t = T(.06); s = lp(noise(.06), 900) * np.exp(-t * 60) * .5; j = int(k / rate * SR); out[j:j + len(s)] += s; k += 1
    return out
def pop(): t = T(.12); return (osc(900 * np.exp(-t * 20) + 120, .12) * .5 + bp(noise(.12), 1000, 4000) * .3) * np.exp(-t * 35)
def beepboop():
    a = osc(1200, .1) * env(int(.1 * SR), .005, .03); b = osc(1700, .14) * env(int(.14 * SR), .005, .05)
    return np.concatenate([a, np.zeros(int(.04 * SR)), b]) * .18
def boom(d=1.4): t = T(d); return (osc(48 * (1 + .5 * np.exp(-t * 8)), d) * np.exp(-t * 3) + lp(noise(d), 200) * np.exp(-t * 5) * .8) * .9
def stinger(): t = T(1.2); return sum(osc(f, 1.2) * np.exp(-t * 3) for f in (311, 370, 466, 554)) * .18 + lp(noise(1.2), 500) * np.exp(-t * 6) * .6
def scratch(): d = .35; t = T(d); f = 1800 * np.abs(np.sin(2 * np.pi * 4 * t)) + 200; return (bp(noise(d), 600, 4000) * .5 + np.sign(osc(f, d)) * .15) * env(len(t), .01, .1)
def glitch(): d = .12; return (np.sign(osc(rng.choice([180, 240, 330, 90]), d)) * .2 + hp(noise(d), 2000) * .25) * (rng.random(int(d * SR)) > .3)
def drone(d): t = T(d); return (osc(55, d) * .5 + osc(58.3, d) * .5 + osc(110.5, d) * .2) * env(len(t), 1.0, .4) * .25
def heartbeat(): t = T(.5); lub = osc(55, .5) * np.exp(-t * 18); dub = np.zeros(len(t)); j = int(.18 * SR); dub[j:] = osc(62, .5 - .18)[:len(t) - j] * np.exp(-T(.5 - .18)[:len(t) - j] * 22) * .8; return lp(lub + dub, 180) * 1.1
def alarm(d): t = T(d); f = 880 + 220 * np.sign(np.sin(2 * np.pi * 2.2 * t)); return bp(np.sign(osc(f, d)), 500, 3000) * env(len(t), .05, .2) * .13
def ding(): t = T(1.2); return sum(osc(f, 1.2) * np.exp(-t * (4 + i)) * g for i, (f, g) in enumerate([(1046, .3), (1568, .2), (2093, .1)]))
# música leve
notes = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1046, 988, 784, 659, 587]
bass = [131, 131, 165, 165, 175, 175, 147, 147]
beat = 60 / 120; cache = {}
def pl(f, d):
    if (f, d) not in cache: cache[(f, d)] = pluck(f, d)
    return cache[(f, d)]
def music(a, b, g=1.):
    t = a; i = 0
    while t < b: add(pl(notes[i % 16], .35), t, .11 * g); (i % 2 == 0) and add(pl(bass[(i // 2) % 8], .7), t, .2 * g); t += beat / 2; i += 1
music(EV['cute'] + .2, EV['maskOn'] - .1)
music(EV['clap2'] - .4, EV['rewind'] - .1)
music(EV['thumbs'] + .2, EV['end'] - .4)
# 1. abertura
add(servo(.8, 480), EV['wave0'], 1.0, .2); add(beepboop(), .3, .8)
add(scream(1.4, 7), EV['scream'], 1.0); add(stinger(), EV['scream'], .7); add(boom(.8), EV['scream'], .5)
add(steps(1.4, 11), EV['flee'], 1.0, -.2); add(steps(1.3, 9), EV['flee'] + .05, .8, .3); add(whoosh(.7, 400, 2500, .5), EV['flee'], 1.0)
add(stinger(), EV['why'], .9); add(boom(1.2), EV['why'], .5)
# 2. fofo
add(pop(), EV['cute'], 1.0); add(boing(320), EV['cute'] + .05, .7); add(beepboop(), EV['cute'] + .4, 1.0); add(servo(1.2, 600), EV['cute'] + .2, .9)
add(applause(2.6), EV['clap1'], 1.0)
# 3. gráfico
add(whoosh(.6, 300, 3000, .5), EV['graph'], 1.0)
add(lp(pop(), 600), EV['maskOn'], 1.2); add(whoosh(.4, 2000, 300, .4), EV['maskOn'] - .2, .8)
add(scratch(), EV['scream2'] - .05, 1.0); add(scream(1.3, 7), EV['scream2'], 1.0); add(boom(1.0), EV['scream2'], .5)
add(whoosh(.8, 300, 1800, .5), EV['human'], 1.0); add(steps(.8, 6), EV['human'], .7, .4)
add(applause(2.4), EV['clap2'], .9)
add(boom(1.2), EV['mori'], .5); add(ding(), EV['mori'], .6)
# 4. rebobina + revelação
add(tape(1.0), EV['rewind'], 1.0)
add(boom(1.6), EV['reveal'], .9)
add(drone(EV['off'] - EV['reveal']), EV['reveal'], 1.0)
t = EV['stare'] + .3
while t < EV['off'] - .3: add(heartbeat(), t, .8 + .3 * (t > EV['alarm'])); t += .7 if t < EV['alarm'] else .45
t = EV['jerk']
while t < EV['off'] - .1: add(glitch(), t, 1.0, rng.uniform(-.4, .4)); add(servo(.08, 700), t, 1.5); t += .2
add(alarm(EV['off'] - EV['alarm']), EV['alarm'], 1.0)
# 5. tira a máscara
add(pop(), EV['off'], 1.2); add(whoosh(.9, 600, 3000, .6), EV['off'], 1.0); add(boing(260), EV['off'] + .1, .6)
add(ding(), EV['thumbs'], 1.0); add(beepboop(), EV['thumbs'] + .3, 1.0); add(applause(3.0, 35), EV['thumbs'] + .2, .7)
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .9 / max(1e-6, np.abs(mx).max())
with wave.open('robo_sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok')
