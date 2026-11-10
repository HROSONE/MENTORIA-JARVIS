# Efeitos sonoros do vídeo do vulcão (sem música): síntese em numpy + passos do Kenney (CC0).
import numpy as np, wave, os, glob, subprocess, sys
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 54.0; SONS = sys.argv[1] if len(sys.argv) > 1 else '../../../sons'
L = np.zeros(int(DUR * SR)); R = np.zeros(int(DUR * SR)); rng = np.random.default_rng(3); _c = {}
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
def bed(t0, t1, g, lo, hi, mod=.3): d = t1 - t0; t = T(d); y = bp(noise(d), lo, hi) * (1 - mod + mod * np.sin(2 * np.pi * .4 * t) * np.sin(2 * np.pi * 1.1 * t)); add(y * env(d, .3, .3), t0, g, -.2); add(np.roll(y, SR // 4) * env(d, .3, .3), t0, g, .2)
def whoosh(t, d, a, b, g, pan=0): tt = T(d); add(bp(noise(d), a, b) * np.sin(np.pi * tt / d) ** 2, t, g, pan)
def fall(t, d, g=.4): tt = T(d); add(np.sin(2 * np.pi * np.cumsum(1500 - 1100 * tt / d) / SR) * env(d, .05, .1) * .5 + bp(noise(d), 600, 3000) * env(d, .1, .1) * .5, t, g)
def thud(t, g=.8, f=70): tt = T(.5); add(np.sin(2 * np.pi * (f + 90 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 9), t, g)
def boing(t, g=.5, f=180): d = .5; tt = T(d); add(np.sin(2 * np.pi * np.cumsum(f * (1 + 1.2 * tt / d) + 30 * np.sin(2 * np.pi * 18 * tt)) / SR) * np.exp(-tt * 6), t, g)
def pop(t, g=.4, f=700): tt = T(.12); add(np.sin(2 * np.pi * f * (1 + 2 * tt) * tt) * np.exp(-tt * 40), t, g)
def step(t, g=.3, kind='concrete', pan=0): add(ken('footstep_' + kind, int(rng.integers(0, 5))), t, g * rng.uniform(.8, 1), pan)
def steps(t0, t1, per=.5, g=.25, kind='concrete', pan=0):
    t = t0
    while t < t1: step(t, g, kind, pan); t += per * rng.uniform(.94, 1.06)
def ding(t, f=1320, g=.25): tt = T(.7); add((np.sin(2 * np.pi * f * tt) + .4 * np.sin(2 * np.pi * 2.01 * f * tt)) * np.exp(-tt * 6), t, g)
def laugh(t, n=5, f=420, g=.2, pan=0):
    for k in range(n): d = .11; tt = T(d); add(np.sin(2 * np.pi * (f * (1 - .04 * k)) * tt) * (1 + .5 * np.sin(2 * np.pi * 30 * tt)) * env(d, .02, .06), t + k * .16, g, pan)
def bike(t0, t1, g=.2): d = t1 - t0; tt = T(d); add(hp(noise(d), 3000) * (np.sin(2 * np.pi * 9 * tt) > .6) * env(d, .2, .3) * .6 + lp(noise(d), 300) * env(d, .2, .3) * .8, t0, g)
# 1) lava
bed(0, 5.0, .35, 60, 500, .5); fall(0, 1.4, .5)
d = 1.6; tt = T(d); add(bp(noise(d), 200, 3500) * np.exp(-tt * 3.5) + lp(noise(d), 200) * np.exp(-tt * 2) * 1.5, 1.4, .9); thud(1.4, 1.0, 55)
for k in range(8): pop(1.5 + k * .09, .3, 300 + 80 * k)                                  # ossos chacoalhando
d = 2.4; tt = T(d); add(np.sin(2 * np.pi * np.cumsum(520 + 380 * tt / d + 14 * np.sin(2 * np.pi * 5 * tt)) / SR) * env(d, .4, .8) * .5, 2.5, .35); ding(2.7, 1760, .2)   # o espírito sobe
# 2) quarto
bed(5.0, 9.4, .05, 200, 900)
for a in (5.85, 6.7, 7.55): whoosh(a, .3, 800, 4000, .3); thud(a + .38, .35, 150)
d = .5; add(hp(noise(d), 2500) * np.abs(np.sin(2 * np.pi * 40 * T(d))) * env(d, .05, .1), 7.8, .3); whoosh(8.2, .5, 400, 2000, .3); ding(8.95, 1568, .25)
# 3 e 4) bicicleta
bed(9.4, 17.2, .07, 400, 2500); bike(9.4, 13.3); bike(13.6, 17.2, .26)
for a in (9.9, 10.1): ding(a, 2100, .2)
d = .5; add(bp(noise(d), 1500, 5000) * env(d, .05, .3), 12.75, .3); ding(14.1, 2100, .2); ding(14.3, 2100, .2)
# 5) avião
d = 5.0; tt = T(d); jet = lp(noise(d), 600) * (.5 + .5 * np.sin(np.pi * tt / d)) + np.sin(2 * np.pi * np.cumsum(1500 - 500 * tt / d) / SR) * .08; add(jet * env(d, .5, .6), 17.2, .7, .2); bed(17.2, 22.2, .15, 100, 600, .6)
# 6) subida
bed(22.2, 30.4, .12, 300, 1500, .5); steps(22.4, 30.2, .46, .22, 'grass', .1); steps(22.6, 27.6, .46, .16, 'grass', -.3)
d = 2.6; add(hp(noise(d), 2000) * np.abs(np.sin(2 * np.pi * 5.5 * T(d))) * env(d, .2, .3), 27.6, .14)   # esfregando as mãos
for k, fq in enumerate([196, 185, 175]): tt = T(.5); add(np.sin(2 * np.pi * fq * tt) * np.exp(-tt * 5), 28.6 + k * .35, .25)   # "tan-tan-tan" maldoso
# 7) a borda
bed(30.4, 37.0, .16, 200, 1200, .6); steps(30.5, 32.3, .46, .22, 'concrete', .2); steps(31.0, 33.5, .46, .2, 'concrete', -.3)
pop(33.6, .4, 500); pop(33.8, .4, 650); whoosh(34.3, .4, 600, 3000, .3); whoosh(34.95, .25, 500, 4000, .7); thud(35.1, 1.0, 80); fall(35.2, 1.6, .5); laugh(36.4, 5, 300, .22, -.3)
# 8) queda e cama elástica
bed(37.0, 54, .08, 200, 900); fall(37.0, 2.0, .45); boing(39.0, .7, 150); boing(40.35, .5, 190); boing(41.25, .35, 220); thud(41.55, .4, 120)
for k in range(3): ding(41.8 + k * .22, 1900 - 200 * k, .14)
# 9) revelação
d = 12.0; tt = T(d); add(bp(noise(d), 800, 5000) * (.4 + .6 * rng.random(len(tt)) ** 6) * env(d, .5, .5), 42.0, .12, .4)   # fogueira
for k in range(22): whoosh(42.4 + k * .42, .3, 300, 1500, .22, .4)                                                         # pano abanando
laugh(43.4, 5, 520, .2, .5); laugh(44.2, 5, 330, .2, .3); laugh(46.2, 6, 440, .22, -.5); pop(45.9, .35, 400)
ding(48.0, 1320, .3); laugh(48.8, 6, 380, .25, 0); laugh(50.3, 6, 300, .22, 0)
for k in range(6): boing(51.8 + k * .628 * .63 + .3, .4, 170 + 12 * k)
mx = np.stack([L, R], 1); mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .85 / max(1e-6, np.abs(mx).max())
with wave.open('vulcao_sfx.wav', 'wb') as f: f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok')
