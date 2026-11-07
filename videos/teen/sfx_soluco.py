import numpy as np, wave
from scipy.signal import lfilter, butter
SR = 44100
EV = dict(hic1=.45, hic2=1.6, hic3=2.8, title=3.6, xray=7.0, c1=9.0, c2=12.4, glotCam=13.6, c3=15.6, scare=19.0, boo=20.3, h4=22.4, h5=23.9,
          womb=25.5, b1=27.0, b2=28.5, b3=30.0, record=32.5, recEnd=39.6, rewind=40.0, tad=41.0, tp1=42.8, tp2=44.6, side=46.4, sp1=47.6, sp2=49.0, end=50.6, e1=51.0, e2=52.3, total=54.5)
N = int(SR * EV['total']); L = np.zeros(N); Rr = np.zeros(N); rng = np.random.default_rng(5)
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
def env(n, a, r): e = np.ones(n); A, B = int(a * SR), int(r * SR); e[:A] = np.linspace(0, 1, A) if A else e[:A]; e[n - B:] *= np.linspace(1, 0, B) if B else 1; return e
def hic(pitch=1.0):
    d = .14; t = T(d)
    f0 = 260 * pitch * (1 + .5 * np.exp(-t * 40))
    src = np.sign(osc(f0, d)) * .4 + osc(f0, d) * .6
    v = bp(src, 500, 1400) * 1.2 + bp(src, 2000, 3200) * .6 + bp(noise(d), 2500, 6000) * .25
    e = np.clip(t / .006, 0, 1) * (t < .09) + (t >= .09) * np.exp(-(t - .09) * 400)
    click = np.zeros(len(t)); click[int(.09 * SR):int(.09 * SR) + 60] = np.hanning(60) * .8
    return (v * e + click) * .9
def inhale(d=.3): return lp(noise(d), 2500) * env(int(d * SR), .05, .1) * .25
def thump(): t = T(.3); return osc(70 * (1 + .6 * np.exp(-t * 30)), .3) * np.exp(-t * 14) * .7
def whoosh(d, f0, f1, g=1.):
    n = int(d * SR); x = noise(d); out = np.zeros(n); seg = 10
    for s in range(seg):
        a, b = s * n // seg, (s + 1) * n // seg; fc = f0 * (f1 / f0) ** ((s + .5) / seg); out[a:b] = lp(x[max(0, a - 2000):b], fc)[-(b - a):]
    return out * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5 * g
def boing(f0=300): d = .3; t = T(d); return osc(f0 * (1 + .8 * np.sin(np.pi * t / d)), d) * np.exp(-t * 8) * .3
def stinger():
    t = T(1.2); out = sum(osc(f, 1.2) * np.exp(-t * 3) for f in (311, 370, 466, 554)) * .18
    return out + lp(noise(1.2), 500) * np.exp(-t * 6) * .6
def boo_voice():
    d = .6; t = T(d); f = 160 + 60 * np.sin(np.pi * t / d)
    v = bp(np.sign(osc(f, d)), 300, 900) + bp(np.sign(osc(f, d)), 900, 2200) * .4
    return v * env(len(t), .03, .25) * .6
def heartbeat(): t = T(.5); lub = osc(55, .5) * np.exp(-t * 18); dub = np.zeros(len(t)); j = int(.18 * SR); dub[j:] = osc(62, .5 - .18)[:len(t) - j] * np.exp(-T(.5 - .18)[:len(t) - j] * 22) * .8; return lp(lub + dub, 180) * 1.1
def womb(d): t = T(d); return lp(noise(d), 300) * (.6 + .4 * np.sin(2 * np.pi * .6 * t)) * .25
def tick(): t = T(.03); return hp(noise(.03), 3000) * np.exp(-t * 150) * .35
def flip(): return bp(noise(.08), 1500, 6000) * np.exp(-T(.08) * 50) * .25
def tape(d=1.0): t = T(d); f = 300 + 2200 * (t / d) ** .5; return (bp(noise(d), 800, 5000) * .3 + osc(f, d) * .12) * (.7 + .3 * np.sin(2 * np.pi * 30 * t)) * env(len(t), .02, .1)
def bubbles(d):
    out = np.zeros(int((d + .2) * SR))
    for _ in range(int(d * 12)):
        dd = .06 + rng.random() * .06; t = T(dd); f0 = 400 + rng.random() * 900
        b = osc(f0 * (1 + 2 * t / dd), dd) * np.sin(np.pi * t / dd) * .15; j = int(rng.random() * d * SR); out[j:j + len(b)] += b
    return out
def gulp(): d = .25; t = T(d); return osc(180 + 300 * np.sin(np.pi * t / d), d) * np.sin(np.pi * t / d) * .3
def sparkle(): t = T(.5); return sum(osc(f, .5) * np.exp(-t * 10) for f in (2200, 3300, 4400)) * .08
def pluck(f, d=.4):
    n = int(d * SR); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n): out[i] = buf[i % p]; buf[i % p] = .5 * (buf[i % p] + buf[(i + 1) % p]) * .995
    return out
# música leve e boba (pausa nos momentos-chave)
notes = [262, 330, 392, 330, 294, 349, 440, 349, 262, 330, 392, 523, 494, 392, 330, 294]
bass = [131, 131, 147, 147, 175, 175, 147, 147]
beat = 60 / 128; t = 3.8; i = 0; cache = {}
def pl(f, d):
    if (f, d) not in cache: cache[(f, d)] = pluck(f, d)
    return cache[(f, d)]
while t < EV['total'] - .5:
    quiet = (EV['scare'] + 1.0 < t < EV['boo'] + .4) or (EV['womb'] - .2 < t < EV['record']) or (EV['rewind'] - .1 < t < EV['tad'] + .2)
    if not quiet:
        add(pl(notes[i % 16], .4), t, .14)
        if i % 2 == 0: add(pl(bass[(i // 2) % 8], .7), t, .22)
    t += beat / 2; i += 1
# eventos
for k, h in enumerate([EV['hic1'], EV['hic2'], EV['hic3']]): add(inhale(.15), h - .12, .6); add(hic(1 + .08 * k), h, 1.0 + .15 * k); add(thump(), h + .1, .6 + .2 * k); add(boing(220 + 40 * k), h + .05, .5)
add(stinger(), EV['title'], .9)
add(whoosh(.8, 300, 3000, .6), EV['xray'], 1.0); add(sparkle(), EV['xray'] + .3, 1.0)
for h in (EV['c1'], EV['c2'], EV['c3']): add(inhale(.25), h - .02, 1.0); add(thump(), h, .7); add(hic(1.05), h + .12, 1.0)
add(whoosh(.8, 2000, 400, .5), EV['glotCam'], .8)
for i in range(5): add(osc(0, .01), 0)
add(whoosh(.5, 300, 2000, .4), EV['boo'] - .3, .7)
add(boo_voice(), EV['boo'], 1.0); add(stinger(), EV['boo'], .8); add(boing(180), EV['boo'] + .1, .7)
for h in (EV['h4'], EV['h5']): add(hic(1.1), h, 1.0); add(thump(), h + .1, .5)
add(womb(EV['record'] - EV['womb']), EV['womb'], 1.0)
t = EV['womb'] + .3
while t < EV['record'] - .3: add(heartbeat(), t, .9); t += .45
for h in (EV['b1'], EV['b2'], EV['b3']): add(lp(hic(1.6), 1500), h, .6)
t = EV['record'] + .2
while t < EV['recEnd'] - .3: add(tick(), t, 1.0, -.3); add(flip(), t + .04, .8, .3); t += .09
for k in range(7): add(hic(1.0 - .04 * k), EV['record'] + .6 + k * 1.0, .8)
add(tape(1.0), EV['rewind'], 1.0)
add(lp(noise(EV['side'] - EV['tad']), 500) * .15, EV['tad'], 1.0); add(bubbles(EV['side'] - EV['tad']), EV['tad'], 1.0)
for h in (EV['tp1'], EV['tp2']): add(gulp(), h, 1.0); add(sparkle(), h + .1, .8); add(bubbles(.6), h + .1, 1.4)
for h in (EV['sp1'], EV['sp2']): add(gulp(), h, .7, -.3); add(hic(1.05), h + .12, 1.0, .2); add(sparkle(), h + .1, .7)
for h in (EV['e1'], EV['e2']): add(hic(1.1), h, 1.0); add(thump(), h + .1, .7); add(boing(260), h + .05, .5)
add(sparkle(), 51.2, 1.0)
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .9 / max(1e-6, np.abs(mx).max())
with wave.open('soluco_sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok')
