import numpy as np, wave, sys
from scipy.signal import lfilter, butter
SR = 44100
EV = dict(strike=.7, getUp=4.0, walkOn=6.6, hosp=9.6, lapse1=13.2, lich=14.2, fade=18.6, lapse2=19.2, crowd=22.0, crowdUp=25.2,
          heart=28.2, zap=30.4, restart=33.6, rewind=36.2, slow=37.2, freeze=39.6, reveal=40.0, end=47.0, total=52.0)
N = int(SR * EV['total']); L = np.zeros(N); Rr = np.zeros(N); rng = np.random.default_rng(3)
def add(sig, t0, g=1.0, pan=0.0):
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
def thunder(d=4.0, close=True):
    t = T(d); x = lp(noise(d), 180) * 3.2 * np.exp(-t * .9) + lp(noise(d), 900) * np.exp(-t * 2.5) * (1.8 if close else .5)
    rum = np.zeros(len(t))
    for _ in range(9): j = int(rng.random() * (d - .6) * SR); r = lp(noise(.6), 120) * np.exp(-T(.6) * 4) * 2; rum[j:j + len(r)] += r
    crack = hp(noise(.12), 2000) * np.exp(-T(.12) * 30) * 3 if close else np.zeros(1)
    out = x + rum; out[:len(crack)] += crack; return out * .55
def zap(d=.6):
    t = T(d); buzz = np.sign(np.sin(2 * np.pi * 120 * t)) * .5 + np.sign(np.sin(2 * np.pi * 180 * t + 1)) * .3
    crack = hp(noise(d), 1500) * (rng.random(len(t)) > .7)
    return (bp(buzz, 100, 4000) * .6 + crack * .5) * np.exp(-t * 4)
def ring(d=3.0): t = T(d); return osc(5200, d) * env(len(t), .05, 1.5) * .06
def thud(): t = T(.4); return (osc(60, .4) * np.exp(-t * 12) + lp(noise(.4), 400) * np.exp(-t * 20) * .6) * .9
def sizzle(d): t = T(d); return hp(noise(d), 4000) * (.5 + .5 * np.sin(2 * np.pi * 7 * t) ** 2) * env(len(t), .1, .8) * .12
def whoosh(d, f0, f1, g=1.):
    n = int(d * SR); x = noise(d); out = np.zeros(n); seg = 10
    for s in range(seg):
        a, b = s * n // seg, (s + 1) * n // seg; fc = f0 * (f1 / f0) ** ((s + .5) / seg); out[a:b] = lp(x[max(0, a - 2000):b], fc)[-(b - a):]
    return out * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5 * g
def boing(f0=300): d = .3; t = T(d); return osc(f0 * (1 + .8 * np.sin(np.pi * t / d)), d) * np.exp(-t * 8) * .3
def step(): t = T(.12); return lp(noise(.12), 900) * np.exp(-t * 40) * .4 + bp(noise(.12), 2000, 6000) * np.exp(-t * 60) * .15
def beep(f=1000, d=.12): t = T(d); return osc(f, d) * env(len(t), .005, .02) * .25
def heartbeat(): t = T(.5); lub = osc(55, .5) * np.exp(-t * 18) * 1.1; dub = np.zeros(len(t)); j = int(.18 * SR); dub[j:] = osc(65, .5 - .18)[:len(t) - j] * np.exp(-T(.5 - .18)[:len(t) - j] * 22) * .8; return lp(lub + dub, 200)
def flat(d): t = T(d); return osc(1000, d) * env(len(t), .01, .05) * .22
def tick(): t = T(.04); return hp(noise(.04), 3000) * np.exp(-t * 120) * .3
def tape_rewind(d=1.0):
    t = T(d); f = 300 + 2200 * (t / d) ** .5; return (bp(noise(d), 800, 5000) * .3 + osc(f, d) * .12 + osc(f * 1.5, d) * .06) * (.7 + .3 * np.sin(2 * np.pi * 30 * t)) * env(len(t), .02, .1)
def slow_boom(d=2.5): t = T(d); return (lp(noise(d), 90) * 2 + osc(40 * (1 - .3 * t / d), d)) * env(len(t), .4, 1.0) * .45
def riser(d): t = T(d); return (osc(200 * 2 ** (2 * t / d), d) * .15 + hp(noise(d), 3000) * (t / d) * .1) * env(len(t), .05, .02)
def flow(d): t = T(d); return (bp(noise(d), 2000, 9000) * .2 * (.6 + .4 * np.sin(2 * np.pi * 11 * t)) + osc(220 + 30 * np.sin(2 * np.pi * 2 * t), d) * .08) * env(len(t), .3, .5)
def sparkle(): t = T(.5); return sum(osc(f, .5) * np.exp(-t * 10) for f in (2200, 3300, 4400)) * .08 + hp(noise(.5), 5000) * np.exp(-t * 20) * .2
def kick(): t = T(.35); return osc(60 * (1 + 2 * np.exp(-t * 40)), .35) * np.exp(-t * 9) * .7
def hat(): t = T(.06); return hp(noise(.06), 7000) * np.exp(-t * 70) * .18
# chuva (contínua, abaixa no hospital/coração)
rain = (lp(noise(EV['total']), 6000) * .09 + hp(noise(EV['total']), 2500) * .05)
gate = np.ones(N); tt = np.arange(N) / SR
for a, b in [(EV['hosp'], EV['crowd']), (EV['heart'], EV['rewind'])]: gate *= 1 - np.clip((tt - a) / .3, 0, 1) * np.clip((b - tt) / .3, 0, 1)
add(rain * gate, 0)
add(thunder(3, False), 0, .35, -.5)
# o raio
add(riser(.7), 0, .8)
add(zap(.8), EV['strike'], 1.2); add(thunder(4.5), EV['strike'] + .02, 1.3); add(ring(3.0), EV['strike'] + .1, 1.0)
add(thud(), EV['strike'] + 1.0, 1.0); add(sizzle(2.8), EV['strike'] + .3, 1.0)
add(whoosh(.9, 2000, 400, .5), EV['strike'] + .1, .8, .4)
for i in range(3): add(whoosh(.25, 600, 2200, .35), EV['getUp'] + 1.0 + i * .28, .7)  # sacode a poeira
add(boing(250), EV['getUp'] + .3, .7)
t = EV['walkOn']
while t < EV['hosp'] - .2: add(step(), t, .8, .1); t += .35
# hospital
for i in range(8): add(beep(1000), EV['hosp'] + .3 + i * .8, .9, .3)
for a in (EV['lapse1'], EV['lapse2']):
    for i in range(14): add(tick(), a + i * .07, 1.0, -.3)
    add(whoosh(1.0, 300, 3000, .6), a, .9)
add(sparkle(), EV['lich'] + .2, 1.0); add(sizzle(3.0), EV['lich'] + .2, .8)
add(sparkle(), EV['lapse2'] + .8, .8)
# os 10 raios (batida rápida)
for i in range(10):
    h = EV['crowd'] + .25 + i * .26; add(zap(.3), h, .7, -.6 + i * .13); add(thud(), h + .3, .4, -.6 + i * .13)
add(thunder(3.5), EV['crowd'] + .2, .8)
for i in range(10): up = EV['crowdUp'] + (i % 5) * .12 + (i // 5) * .3; add(boing(220 + 25 * i), up, .5, -.5 + i * .1)
# coração
t = EV['heart']
while t < EV['rewind'] - .2:
    if not (EV['zap'] - .2 < t < EV['restart']): add(heartbeat(), t, 1.0); add(beep(1000, .08), t + .05, .8, .3)
    t += .8
add(zap(.6), EV['zap'], 1.2); add(flat(EV['restart'] - EV['zap'] - .3), EV['zap'] + .2, 1.0, .3)
add(thud(), EV['restart'], 1.2); add(zap(.25), EV['restart'] - .05, .6)
# rebobinar + câmera lenta + revelação
add(tape_rewind(1.0), EV['rewind'], 1.0)
add(slow_boom(2.6), EV['slow'], 1.0)
add(lp(zap(1.2), 900), EV['slow'] + 1.6, .8)
add(thud(), EV['freeze'], .6); add(sparkle(), EV['reveal'], 1.0)
add(flow(EV['end'] - EV['reveal']), EV['reveal'], 1.2)
# batida de tensão (some nos momentos-chave)
bpm = 120; beat = 60 / bpm; t = 1.6
while t < EV['total']:
    quiet = (EV['zap'] - .3 < t < EV['restart'] + .3) or (EV['rewind'] - .1 < t < EV['reveal'] + .5) or (EV['getUp'] - .2 < t < EV['getUp'] + .6)
    if not quiet: add(kick(), t, .55); add(hat(), t + beat / 2, .7, .2)
    t += beat
# final
t = EV['end']
while t < EV['total'] - 1: add(step(), t, .7); t += .38
add(zap(.25), EV['end'] + 3.3, .8)
mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.15) / np.tanh(1.15); mx *= .9 / max(1e-6, np.abs(mx).max())
with wave.open('raio_sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok')
