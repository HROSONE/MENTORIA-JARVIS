# Efeitos sonoros do vídeo "18 anos no aeroporto" (sem música): síntese em numpy + passos e impactos do Kenney (CC0).
import numpy as np, wave, os, glob, subprocess, sys
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 62.0; SONS = sys.argv[1] if len(sys.argv) > 1 else '../../../sons'
L = np.zeros(int(DUR * SR)); R = np.zeros(int(DUR * SR)); rng = np.random.default_rng(7); _c = {}
T = lambda d: np.arange(int(d * SR)) / SR; noise = lambda d: rng.standard_normal(int(d * SR))
lp = lambda y, f: sosfilt(butter(2, f, 'low', fs=SR, output='sos'), y); hp = lambda y, f: sosfilt(butter(2, f, 'high', fs=SR, output='sos'), y); bp = lambda y, a, b: sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), y)
def load(p):
    if p not in _c:
        raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
        x = np.frombuffer(raw, np.float32).astype(float); _c[p] = x / max(1e-6, np.abs(x).max())
    return _c[p]
def ken(name, i=0): return load(sorted(glob.glob(os.path.join(SONS, '**', f'{name}_{i:03d}.ogg'), recursive=True))[0])
def add(y, t, g=1.0, pan=0.0):
    i = int(t * SR); y = y[:max(0, len(L) - i)] * g; L[i:i + len(y)] += y * np.sqrt((1 - pan) / 2) * 1.414; R[i:i + len(y)] += y * np.sqrt((1 + pan) / 2) * 1.414
env = lambda d, a=.01, r=.1: np.minimum(1, T(d) / a) * np.minimum(1, (d - T(d)) / r)
def amb(t0, t1, g, lo=250, hi=1800):   # murmúrio de saguão: ruído filtrado com "vozes" moduladas
    d = t1 - t0; t = T(d); y = bp(noise(d), lo, hi) * (.6 + .4 * np.sin(2 * np.pi * .23 * t + 1) * np.sin(2 * np.pi * .61 * t)); y += lp(noise(d), 120) * .8
    add(y * env(d, .4, .4), t0, g, -.2); add(np.roll(y, SR // 3) * env(d, .4, .4), t0, g, .2)
def flap(t, n=6, g=.5):               # plaquinhas do painel
    for k in range(n):
        d = .035; y = hp(noise(d), 1800) * np.exp(-T(d) * 120) + np.sin(2 * np.pi * 900 * T(d)) * np.exp(-T(d) * 200) * .4; add(y, t + k * .032 + rng.uniform(0, .008), g * rng.uniform(.6, 1), rng.uniform(-.3, .3))
def chime(t, g=.25):                   # aviso "ding-dong"
    for k, f in enumerate([880, 698.5]): d = 1.2; tt = T(d); add((np.sin(2 * np.pi * f * tt) + .4 * np.sin(2 * np.pi * 2 * f * tt)) * np.exp(-tt * 3.2), t + k * .55, g)
def whoosh(t, d, a, b, g, pan=0): tt = T(d); y = bp(noise(d), a, b) * np.sin(np.pi * tt / d) ** 2; add(y, t, g, pan)
def step(t, g=.35, pan=0, kind='concrete'): add(ken('footstep_' + kind, int(rng.integers(0, 5))), t, g * rng.uniform(.8, 1), pan)
def steps(t0, t1, per=.5, g=.3, pan=0):
    t = t0
    while t < t1: step(t, g, pan); t += per * rng.uniform(.94, 1.06)
def thud(t, g=.8, f=70): tt = T(.5); add(np.sin(2 * np.pi * (f + 90 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 9), t, g)
def rustle(t, d=.35, g=.3): add(hp(noise(d), 2500) * env(d, .03, .2) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 9 * T(d)))), t, g)
def scratch(t0, t1, g=.22):            # caneta no papel
    d = t1 - t0; tt = T(d); add(bp(noise(d), 2500, 7000) * (np.abs(np.sin(2 * np.pi * 5.5 * tt)) ** .6) * env(d, .05, .1), t0, g, .1)
def puff(t, g=.3): d = .9; add(bp(noise(d), 400, 1600) * env(d, .25, .5), t, g)
def creak(t, g=.3): d = .45; tt = T(d); add(np.sin(2 * np.pi * np.cumsum(240 + 160 * np.sin(2 * np.pi * 3 * tt)) / SR) * env(d, .05, .2) * .5 + bp(noise(d), 800, 2000) * env(d, .05, .2) * .3, t, g)
def roll(t0, t1, g=.18, pan=0): d = t1 - t0; tt = T(d); add(lp(noise(d), 500) * (.6 + .4 * np.sin(2 * np.pi * 14 * tt)) * env(d, .2, .3), t0, g, pan)

# --- ambiente
amb(0, 6.7, .16); amb(6.5, 11.2, .12, 150, 900); amb(11.1, 16.1, .09, 300, 1200); amb(18.2, DUR, .16)
chime(.3); chime(19.0); chime(34.6, .18); chime(55.0, .16)
# --- abertura
flap(.05, 8); puff(4.5, .25); puff(5.1, .4); whoosh(5.9, .7, 400, 2500, .25)
flap(6.25, 8, .6)
# --- 1988, estação
d = 4.4; tt = T(d); add(lp(noise(d), 180) * (.6 + .4 * np.sin(2 * np.pi * 2.1 * tt)) * env(d, .3, .5), 6.7, .5)   # trem parado
thud(8.3, .5, 90); rustle(8.9, .25, .2)
for k in range(4): add(np.sin(2 * np.pi * 2400 * T(.02)) * np.exp(-T(.02) * 200), 9.1 + k * .22, .25)   # tic-tac do relógio de pulso
add(bp(noise(.25), 300, 900) * env(.25, .01, .2), 10.15, .6); thud(10.75, .9, 60)                          # o "puf" e o susto
whoosh(10.85, .5, 500, 4000, .6, .3)
# --- Londres
add(ken('footstep_wood', 1), 11.95, .7); rustle(12.5, .4, .25); thud(13.9, .6, 110); steps(15.3, 16.0, .42, .3, -.3); whoosh(15.6, .5, 500, 4000, .5, -.3)
# --- avião
d = 2.6; tt = T(d); jet = lp(noise(d), 700) * np.sin(np.pi * tt / d) ** 1.4 + np.sin(2 * np.pi * np.cumsum(1900 - 900 * np.tanh((tt - 1.3) * 2.5)) / SR) * .12 * np.sin(np.pi * tt / d)
add(jet, 15.9, 1.0, .5); add(jet[::-1].copy(), 15.9, .4, -.5)
# --- chegada ao terminal
steps(18.5, 21.5, .5, .3); roll(18.5, 21.6, .16); creak(22.2); flap(18.3, 6, .4)
# --- os anos passam (um estalo por ano) e as caixas chegam
for k in range(10): flap(23.4 + k * 1.05, 4, .45)
for thr in [.1, .2, .3, .35, .45, .5, .6, .65, .7, .75, .8, .85, .88, .9, .92, .95]: thud(23.6 + thr * 10.2 + .3, .35, 120)
steps(20.0, 24.3, .52, .16, .5); rustle(25.0, .4, .3); steps(25.9, 27.6, .5, .14, .5)                          # toalha
steps(23.3, 27.1, .5, .14, .5); roll(23.3, 27.1, .08, .5); rustle(27.8, .5, .4); rustle(28.3, .3, .3)           # lanche
for k in range(4): add(bp(noise(.09), 500, 2500) * env(.09, .01, .06), 28.6 + k * .22, .3)                      # mordidas
scratch(30.3, 33.5); steps(27.0, 31.5, .5, .13, .4); steps(33.1, 35.5, .5, .13, .4)
# --- 1999
flap(34.2, 6, .55); steps(31.0, 35.2, .5, .15, .5); rustle(36.5, .5, .35); rustle(37.2, .3, .25)
scratch(41.6, 42.15, .32); scratch(42.3, 44.3, .3); scratch(44.5, 44.85, .32); rustle(45.4, .5, .35); thud(46.9, .5, 100)
for k in range(4): flap(45.4 + k * .2, 3, .4)
# --- Hollywood
steps(43.8, 47.8, .5, .15, .5); rustle(48.9, .5, .4)
for f in [1320, 1760]: tt = T(.6); add(np.sin(2 * np.pi * f * tt) * np.exp(-tt * 7), 49.0, .22)                 # caixa registradora
thud(49.7, .4, 140); steps(51.5, 53.5, .5, .14, .5); puff(51.9, .25); puff(52.5, .4)
# --- 2006
flap(53.45, 4, .5); flap(53.7, 6, .6); roll(54.0, 57.3, .22, .4); steps(54.0, 57.3, .55, .2, .4)
# --- 2022
for k in range(15): flap(57.2 + k * .0467, 2, .4)
flap(57.9, 8, .65); steps(57.5, 59.7, .62, .28, .3); creak(60.4); thud(60.3, .35, 110); puff(61.2, .35)
mx = np.stack([L, R], 1); mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .85 / max(1e-6, np.abs(mx).max())
with wave.open('terminal_sfx.wav', 'wb') as f: f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok')
