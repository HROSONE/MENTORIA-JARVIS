"""Trilha de efeitos sonoros + música leve do vídeo do Halloween (tudo sintetizado)."""
import numpy as np, wave, sys
from scipy.signal import lfilter, butter
SR = 44100
EV = dict(howl=1.0, walk0=2.8, walk1=7.0, knock=7.4, creak=9.0, peek=10.2, giggle=10.5, hopIn=11.3, floor=12.6, fall=13.5, flash1=14.6,
          celt=15.0, sheet=21.5, sweets=24.5, tRun=28.0, flash2=30.6, med=31.0, knockMed=33.5, blend=37.0, wink=41.0, tRun2=42.0, flash3=44.6,
          church=45.0, name1=48.0, name2=50.0, name3=52.0, flash4=54.6, farm=55.0, carve=57.0, candle=61.0, compare=62.5, hug=65.5, flash5=68.6,
          home=69.0, candy=71.0, end=78.0)
N = int(SR * EV['end']); L = np.zeros(N); Rr = np.zeros(N)
rng = np.random.default_rng(7)
def add(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if j <= i or i < 0: return
    s = sig[:j - i] * gain; L[i:j] += s * np.sqrt(.5 * (1 - pan)); Rr[i:j] += s * np.sqrt(.5 * (1 + pan))
def T(d): return np.arange(int(d * SR)) / SR
def env(n, a, r): e = np.ones(n); A, B = int(a * SR), int(r * SR); e[:A] = np.linspace(0, 1, A) if A else e[:A]; e[n - B:] *= np.linspace(1, 0, B) if B else 1; return e
def lp(x, fc): b, a = butter(2, min(fc, SR / 2.2) / (SR / 2)); return lfilter(b, a, x)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def hp(x, fc): b, a = butter(2, fc / (SR / 2), 'high'); return lfilter(b, a, x)
def noise(d): return rng.standard_normal(int(d * SR))
def osc(freq, d, kind='sin'):
    f = np.broadcast_to(freq, (int(d * SR),)); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) if kind == 'sin' else (2 * ((ph / (2 * np.pi)) % 1) - 1)

# ---------- efeitos ----------
def howl(d=2.6):
    t = T(d); k = t / d
    f = 380 + 300 * np.sin(np.pi * np.clip(k * 1.3, 0, 1)) - 120 * k + 8 * np.sin(2 * np.pi * 5.5 * t)
    s = osc(f, d) + .45 * osc(f * 2, d) + .2 * osc(f * 3, d)
    s = lp(s, 2500) * env(len(t), .35, 1.0)
    rev = np.zeros(len(s) + SR); rev[:len(s)] += s
    for dl, g in [(.11, .4), (.23, .3), (.37, .2), (.55, .12)]: rev[int(dl * SR):int(dl * SR) + len(s)] += s * g
    return rev * .35
def step():
    t = T(.12); return lp(noise(.12), 900) * np.exp(-t * 45) * .5 + osc(90, .12) * np.exp(-t * 40) * .3
def knock():
    t = T(.25); return (osc(140, .25) * np.exp(-t * 30) * .9 + bp(noise(.25), 800, 3000) * np.exp(-t * 60) * .6)
def creak(d=1.3):
    t = T(d); f = 220 + 140 * np.sin(np.pi * t / d) + 30 * np.sin(2 * np.pi * 13 * t) + 20 * rng.standard_normal(len(t)).cumsum() / 200
    s = osc(f, d, 'saw'); s = bp(s, 300, 2600) * (.6 + .4 * np.abs(np.sin(2 * np.pi * 23 * t)))
    return s * env(len(t), .05, .3) * .45
def giggle(base=1050, n=4):
    out = []
    for i in range(n):
        d = .11; t = T(d); f = base * (1.05 - .06 * i) * (1 + .25 * np.sin(np.pi * t / d))
        out.append(np.concatenate([(osc(f, d) + .3 * osc(f * 2, d)) * np.sin(np.pi * t / d) ** 1.5, np.zeros(int(.035 * SR))]))
    return np.concatenate(out) * .32
def boing(f0=330):
    d = .28; t = T(d); f = f0 * (1 + .9 * np.sin(np.pi * t / d)) * (1 + .03 * np.sin(2 * np.pi * 30 * t))
    return osc(f, d) * np.exp(-t * 7) * .32
def chime(f=1320, d=1.0, g=.5):
    t = T(d); return sum(osc(f * m, d) * np.exp(-t * (3 + 2 * m)) * a for m, a in [(1, .5), (2.01, .25), (3.02, .12)]) * g
def shimmer(d=1.0):
    out = np.zeros(int((d + .2) * SR))
    for i in range(10): c = chime(1500 + rng.random() * 1800, .6, .18); j = int(rng.random() * (d - .6) * SR); out[j:j + len(c)] += c
    return out
def whoosh(d, f0, f1, g=1.0):
    n = int(d * SR); k = np.linspace(0, 1, n); out = np.zeros(n); x = noise(d)
    seg = 8;
    for s_ in range(seg):
        a, b = s_ * n // seg, (s_ + 1) * n // seg; fc = f0 * (f1 / f0) ** ((s_ + .5) / seg); out[a:b] = lp(x[max(0, a - 2000):b], fc)[-(b - a):]
    return out * np.sin(np.pi * k) ** 1.5 * g
def portal_open(d=1.2):
    t = T(d); k = t / d; f = 140 + 520 * k ** .6
    s = osc(f, d) * .35 + osc(f * 1.5, d) * .15 + whoosh(d, 300, 4000, .5) + chime(990, d, .5)
    return s * env(len(t), .02, .4)
def rush(d):
    t = T(d); return lp(noise(d), 1400) * .6 * (.7 + .3 * np.sin(2 * np.pi * 3 * t)) * env(len(t), .2, .3) + osc(60 + 20 * np.sin(2 * np.pi * 1.5 * t), d) * .25
def thud(): t = T(.3); return (osc(65, .3) * np.exp(-t * 16) + lp(noise(.3), 500) * np.exp(-t * 25) * .5) * .8
def crackle(d):
    out = lp(noise(d), 300) * .25
    n = int(d * 40)
    for _ in range(n):
        j = int(rng.random() * (d - .05) * SR); c = hp(noise(.03), 1500) * np.exp(-T(.03) * 150) * (.3 + .7 * rng.random()); out[j:j + len(c)] += c
    return out * .55
def drum(): t = T(.5); return (osc(75 * (1 + .4 * np.exp(-t * 30)), .5) * np.exp(-t * 7) + lp(noise(.5), 400) * np.exp(-t * 20) * .3) * .55
def cloth(): return whoosh(.45, 600, 2500, .5) + hp(noise(.45), 3000) * np.exp(-T(.45) * 8) * .08
def ghost_oo(d=1.6):
    t = T(d); f = 320 + 40 * np.sin(2 * np.pi * .7 * t) + 6 * np.sin(2 * np.pi * 5 * t)
    return lp(osc(f, d) + .3 * osc(f * 2, d), 1200) * env(len(t), .4, .6) * .22
def clink(): t = T(.4); return sum(osc(f, .4) * np.exp(-t * 18) for f in (2600, 3900, 5200)) * .12
def candy(d=1.2):
    out = np.zeros(int((d + .5) * SR))
    for _ in range(26): j = int(rng.random() * d * SR); c = clink() * (.3 + .7 * rng.random()); out[j:j + len(c)] += c
    return out
def bell(f=330, d=3.5):
    t = T(d); return sum(osc(f * m, d) * np.exp(-t * dcy) * a for m, a, dcy in [(1, .6, 1.2), (2.0, .3, 1.8), (2.76, .25, 2.5), (5.4, .1, 4), (.5, .3, .9)]) * .45
def crowd(d):
    out = np.zeros(int(d * SR))
    for _ in range(int(d * 6)):
        dd = .3 + rng.random() * .5; t = T(dd); f = 140 + rng.random() * 120
        v = bp(osc(f * (1 + .1 * np.sin(2 * np.pi * 4 * t)), dd, 'saw'), 300, 1800) * np.sin(np.pi * t / dd) * .05
        j = int(rng.random() * (d - dd) * SR); out[j:j + len(v)] += v
    return out
def scrape(): d = .35; t = T(d); return bp(noise(d), 1500, 5000) * np.sin(np.pi * t / d) * .22
def fwip(): return whoosh(.3, 2000, 300, .6) + osc(200 * np.exp(-T(.3) * 4) + 80, .3) * np.exp(-T(.3) * 8) * .3
def harp_gliss(f0=262, n=12, gap=.06):
    scale = [0, 2, 4, 7, 9]; out = np.zeros(int((n * gap + 1.4) * SR))
    for i in range(n):
        f = f0 * 2 ** ((scale[i % 5] + 12 * (i // 5)) / 12); d = 1.4; t = T(d)
        s = (osc(f, d) + .4 * osc(2 * f, d)) * np.exp(-t * 3.5) * .16; j = int(i * gap * SR); out[j:j + len(s)] += s
    return out
def crickets(d):
    t = T(d); chirp = (np.sin(2 * np.pi * 30 * t) > .6) * (np.sin(2 * np.pi * .9 * t) > .2)
    return osc(4300, d) * lp(chirp.astype(float), 60) * .05
def owl():
    out = []
    for dd, f in [(.25, 420), (.15, 0), (.5, 400)]:
        t = T(dd); out.append(lp(osc(f, dd) if f else np.zeros(len(t)), 900) * np.sin(np.pi * t / dd) * .28)
    return np.concatenate(out)
def flap(): t = T(.5); return lp(noise(.5), 700) * (np.abs(np.sin(2 * np.pi * 9 * t)) ** 3) * env(len(t), .05, .2) * .3

# ---------- música (caixinha de suspense, leve e brincalhona) ----------
def pluck(f, d=.45):
    n = int(d * SR); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n): out[i] = buf[i % p]; buf[i % p] = .5 * (buf[i % p] + buf[(i + 1) % p]) * .996
    return out
def music():
    out = np.zeros(N); bpm = 112; beat = 60 / bpm
    notes = {'A2': 110, 'C3': 130.8, 'D3': 146.8, 'E3': 164.8, 'G3': 196, 'A3': 220, 'B3': 246.9, 'C4': 261.6, 'D4': 293.7, 'E4': 329.6, 'F4': 349.2, 'G4': 392, 'A4': 440}
    bass = ['A2', 'A2', 'E3', 'E3', 'D3', 'D3', 'E3', 'E3']
    mel = ['A3', 'C4', 'E4', 'C4', 'A3', 'C4', 'E4', 'F4', 'E4', 'D4', 'C4', 'B3', 'C4', 'B3', 'G3', 'B3']
    cache = {}
    def pl(nm, d=.5):
        if (nm, d) not in cache: cache[(nm, d)] = pluck(notes[nm], d)
        return cache[(nm, d)]
    i = 0; t = 0.0
    while t < EV['end'] - .5:
        b = pl(bass[(i // 2) % len(bass)], .9) * .32 if i % 2 == 0 else None
        if b is not None: j = int(t * SR); out[j:j + len(b)] += b[:max(0, N - j)]
        m = pl(mel[i % len(mel)], .45) * .16; j = int(t * SR); out[j:j + len(m)] += m[:max(0, N - j)]
        t += beat / 2; i += 1
    # mais baixo nas cenas com diálogo visual, sobe no fim
    k = np.ones(N); tt = np.arange(N) / SR
    k *= .55 + .45 * np.clip((tt - 73) / 3, 0, 1)
    return lp(out, 3500) * k
add(music(), 0, .55)

# ---------- ambiente por cena ----------
add(lp(noise(EV['fall']), 400) * .1, 0, 1)                                     # vento da cidade
add(crickets(EV['fall']), 0, .8, .3)
add(howl(), EV['howl'], .9, -.4)
for i in range(3): add(flap(), .4 + i * 1.6, .7, -.3)
k = 0; t = EV['walk0']
while t < EV['walk1']: add(step(), t, .7, -.1 if k % 2 else .1); add(step(), t + .17, .55, .2); t += .35; k += 1
for i in range(3): add(knock(), EV['knock'] + i * .4, 1.0)
add(creak(), EV['creak'], 1.0)
add(boing(500), EV['peek'], .6); add(giggle(), EV['giggle'], 1.0)
for i in range(2): add(boing(380), EV['hopIn'] + i * .4, .8)
add(portal_open(), EV['floor'] - .05, 1.0)
add(whoosh(.8, 300, 3000, .8), EV['floor'] + .5, 1.0)
add(rush(EV['flash1'] - EV['fall'] + .4), EV['fall'], 1.0)
for f in ['flash1', 'flash2', 'flash3', 'flash4', 'flash5']: add(shimmer(1.0), EV[f] - .4, .9); add(whoosh(.9, 2500, 300, .6), EV[f] - .3, .9)
# celtas
add(crackle(EV['flash2'] - EV['celt']), EV['celt'], 1.0)
add(lp(noise(16), 300) * .08, EV['celt'], 1.0)
for i in range(2): add(thud(), EV['celt'] + .35 + i * .12, .8)
t = EV['celt'] + 1.0
while t < EV['flash2'] - .5: add(drum(), t, .6, -.2); add(drum(), t + .54, .35, .2); t += 1.07
add(cloth(), EV['sheet'], 1.0); add(ghost_oo(), EV['sheet'] + 1.0, 1.0)
add(clink(), EV['sweets'] + .65, 1.0); add(candy(.4), EV['sweets'] + .62, .6)
add(boing(560), EV['sweets'] + 1.55, .6); add(giggle(1150), EV['sweets'] + 1.8, 1.0)
for i in range(5): add(boing(360 + 20 * i), EV['tRun'] + i * .52, .7)
# idade média
add(crowd(EV['flash3'] - EV['med']), EV['med'], 1.0)
add(lp(noise(14), 350) * .07, EV['med'], 1.0)
for v in range(3):
    for i in range(3): add(knock(), EV['knockMed'] + v * .5 + i * .26 + .1, .55, -.4 + .4 * v)
add(chime(1760, .8, .5), EV['wink'], 1.0); add(giggle(1200), EV['wink'] + .2, 1.0)
for i in range(4): add(boing(400), EV['wink'] + .65 + i * .58, .7)
# o nome
add(bell(262), EV['church'] + .2, .9); add(bell(262), EV['church'] + 2.2, .7)
for nm in ['name1', 'name2', 'name3']: add(whoosh(.5, 800, 4000, .5), EV[nm] - .15, .8); add(chime(1320 if nm != 'name3' else 1760, 1.0, .6), EV[nm], 1.0)
for i in range(3): add(boing(420), EV['name3'] + i * .8, .7)
# fazenda
add(crickets(EV['flash5'] - EV['farm']), EV['farm'], 1.2, -.3)
add(owl(), EV['farm'] + .8, .9, .5)
for i in range(4): add(boing(350), EV['farm'] + .4 + i * .5, .6)
t = EV['carve']
while t < EV['candle'] - .2: add(scrape(), t, 1.0, .2); t += .9
add(fwip(), EV['candle'], 1.0); add(chime(1040, 1.2, .5), EV['candle'] + .05, 1.0)
add(thud(), EV['compare'] + 1.5, .5)
add(harp_gliss(), EV['compare'] + 1.3, 1.0)
add(shimmer(1.4), EV['hug'], .8); add(giggle(980, 5), EV['hug'] + .4, .9)
# de volta para casa
add(lp(noise(9), 400) * .1, EV['home'], 1.0); add(crickets(9), EV['home'], .8, .3)
add(candy(1.2), EV['candy'] + .4, 1.0); add(chime(1568, 1.0, .5), EV['candy'] + .8, 1.0)
add(giggle(1100, 5), EV['candy'] + 2.0, .9)
add(howl(2.0), EV['end'] - 3.2, .5, .5)

mx = np.stack([L, Rr], 1); mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .9 / max(1e-6, np.abs(mx).max())
out = sys.argv[1] if len(sys.argv) > 1 else 'hw_sfx.wav'
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok', out)
