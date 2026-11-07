import subprocess, glob, os, numpy as np, wave
from scipy.signal import butter, sosfilt

SR = 44100
TOTAL = 58.5
N = int(SR * TOTAL)
L = np.zeros(N); Rr = np.zeros(N)
HERE = os.path.dirname(os.path.abspath(__file__))
SONS = os.path.join(HERE, '..', '..', 'sons')
rng = np.random.default_rng(3)
_c = {}

def load(path):
    if path in _c: return _c[path]
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.float32).astype(float); x = x / max(1e-6, np.abs(x).max()); _c[path] = x; return x
def bsb(i, a=0, d=None, fade=.05):
    x = load(os.path.join(SONS, 'bsb', f'{i}.ogg'))
    x = x[int(a * SR):] if d is None else x[int(a * SR):int((a + d) * SR)]
    x = x.copy(); n = min(len(x) // 2, int(fade * SR))
    if n > 0: x[:n] *= np.linspace(0, 1, n); x[-n:] *= np.linspace(1, 0, n)
    return x
def ken(name, i=0):
    f = sorted(glob.glob(os.path.join(SONS, '**', f'{name}_{i:03d}.ogg'), recursive=True))[0]
    return load(f)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def pitch(x, r): idx = np.arange(0, len(x) - 1, r); return np.interp(idx, np.arange(len(x)), x)
def T(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
def env(n, a, r):
    e = np.ones(n); na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] = np.linspace(1, 0, nr)
    return e
def add(x, t, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N: return
    x = x[:N - i] * g
    L[i:i + len(x)] += x * np.sqrt((1 - pan) / 2) * 1.414; Rr[i:i + len(x)] += x * np.sqrt((1 + pan) / 2) * 1.414
def bed(i, a, t, d, g, fi=.4, fo=.4, pan=0):
    x = bsb(i, a, d, .01); x = x * env(len(x), fi, fo); add(x, t, g, pan)
def whoosh(d, f0, f1_, g=.3):
    t = T(d); x = noise(d); out = np.zeros_like(x); seg = int(SR * .02)
    for k in range(0, len(x), seg):
        f = f0 + (f1_ - f0) * (k / len(x)); out[k:k + seg] = bp(x[max(0, k - 2000):k + seg], max(60, f * .6), min(15000, f * 1.6))[-len(x[k:k + seg]):]
    return out * np.sin(np.pi * t / d) ** 2 * g
def step(g=.35):  # passo na terra
    d = .14; t = T(d); return (bp(noise(d), 300, 3000) * np.exp(-t * 40) + lp(noise(d), 200) * np.exp(-t * 30) * .6) * g
def tap(g=.2):  # passinho de galinha
    d = .05; t = T(d); return bp(noise(d), 1500, 6000) * np.exp(-t * 120) * g
def drone(d, f, g=.12):
    t = T(d); x = sum(np.sin(2 * np.pi * f * k * t + k) / k for k in (1, 2, 3)) * (.7 + .3 * np.sin(2 * np.pi * .2 * t))
    return lp(x, 900) * env(len(t), 1.0, 1.0) * g
def ring(d=1.6, f=3100, g=.12):
    t = T(d); return np.sin(2 * np.pi * f * t) * np.exp(-t * 2) * g

# ---------------- 1. gancho: fazenda, dias passando ----------------
bed('0935', 10, 0, 7.6, .6, .05, .3)                      # passarinhos de manhã
bed('0975', 10, 0, 7.6, .9, .05, .3, -.3)                 # galinhas cacarejando
bed('0977', 17, .2, 7.3, .75, .05, .3, .4)
bed('0425', 0, 0, 7.5, .0)                                 # (grilos entram nas noites, abaixo)
cr = bsb('0425', 0, 7.5, .01)
# os grilos aparecem só quando é noite no timelapse
tt = np.arange(len(cr)) / SR; cyc = np.clip((tt - .2) / 6.4, 0, 1); d = (.33 + cyc * 4.0) % 1
night = ((d < .22) | (d > .84)).astype(float); night = np.convolve(night, np.ones(4000) / 4000, 'same')
add(cr * night * (cyc < 1), 0, .35)
# tique-taque acelerando junto com o contador
tick = bsb('1372', 2.0, .12, .005)
tk, gap = .25, .5
while tk < 6.5:
    add(hp(tick, 800), tk, .55, .3 * np.sin(tk * 3)); tk += gap; gap = max(.06, gap * .86)
for k in range(5): add(whoosh(.5, 300, 2400, .14), .6 + k * 1.28, 1.0, -.5 + .25 * k)
add(ken('impactPunch_heavy', 1), 6.6, .7); add(bsb('0105', .7, .4), 6.6, .6)
add(whoosh(.6, 3000, 500, .18), 6.45, 1.0)
for k in range(7): add(tap(.25), .3 + k * .23, 1.0, .1)        # Mike andando
# ---------------- 2. 1945, Lloyd chega ----------------
bed('0898', 5, 7.4, 5.2, .7, .3, .2)
bed('0704', 0.4, 7.6, 2.2, .55, .02, .3, .5)               # galo cantando ao amanhecer
bed('0975', 21, 8.0, 4.4, .7, .2, .3, -.4)
for k in range(7): add(step(.45), 7.7 + k * .75, 1.0, .5)
add(ken('impactMetal_light', 2), 9.9, .15, .5)
# ---------------- 3. o toco ----------------
bed('0898', 30, 12.4, 3.3, .22, .1, .5)
add(drone(3.3, 55, .25), 12.4)
for k, tt_ in enumerate([13.0, 13.7, 14.3, 14.8, 15.2]): add(lp(bsb('0243', 0, .5, .01), 600), tt_, .8)
add(bsb('1795'), 15.15, .8); add(whoosh(.45, 600, 4000, .4), 15.2, 1.0)
add(ken('impactWood_heavy', 2), 15.62, 1.0); add(bsb('0105', .7, .6), 15.62, .9); add(ken('impactPunch_heavy', 0), 15.63, .8)
add(bsb('2891', .4, 1.4), 15.7, .7, -.3); add(bsb('2893'), 15.9, .5, .4)
add(ring(1.4), 15.7, 1.0)
# ---------------- 4. ele levanta ----------------
bed('0898', 40, 17.0, 6.0, .35, .5, .3)
add(bsb('2892'), 17.55, .7); add(bsb('2894'), 18.1, .5, .3)
bed('0976', 2.4, 18.4, 1.0, .9, .02, .3, -.5)              # galinha assustada
bed('0976', 7.9, 18.7, 1.0, .7, .02, .3, .6)
for k in range(14): add(tap(.3), 19.2 + k * .26, 1.0, -.1)
add(ken('impactMetal_medium', 1), 19.98, .7, .5); add(ken('impactWood_medium', 0), 20.0, .8, .5); add(lp(noise(.5), 300) * np.exp(-T(.5) * 8) * .5, 20.0, 1.0, .5)
bed('0977', 23.5, 20.5, 2.6, .5, .3, .4)
# ---------------- 5. celeiro à noite → manhã ----------------
bed('0110', 5, 23.0, 3.4, .55, .6, .4)                     # noite no campo, grilos
for k in range(3): add(lp(ken('impactPlank_medium', k), 900), 23.8 + k * 1.0, .15, .3)  # madeira estalando
add(bsb('3205', 0, 2.2), 26.15, .8, -.4)                  # porta range
bed('0935', 40, 26.3, 1.8, .45, .3, .2)
bed('0441', 8.8, 26.7, 1.5, .5, .05, .2, .5)               # galo
add(bsb('2892'), 27.15, .4)
# ---------------- 6. conta-gotas ----------------
add(drone(5.0, 82, .07), 28.0)
bed('0898', 55, 28.0, 5.0, .1, .5, .5)
for i in range(6):
    t0 = 28 + 1.4 + i * .55 + .32
    add(hp(bsb('1384', [0.12, 3.0, 4.42, 5.8, 7.27, 11.55][i], .35, .01), 300), t0, .8, .05 * i)
add(ken('impactGlass_light', 1), 28.95, .25)
# ---------------- 7. o show ----------------
bed('3515', 20, 33.0, 7.0, .55, .4, .3)                    # plateia
bed('2363', 1.0, 33.4, 4.0, .5, .3, .8)                    # aplausos
for i, f in enumerate([1.0, 1.7, 2.3, 3.1, 3.6, 4.4, 5.0]):
    add(hp(bsb('2821' if i % 2 else '2822', 0, None, .005), 400), 33 + f, 2.5, rng.uniform(-.6, .6))
    add(bp(noise(.25), 2000, 8000) * np.exp(-T(.25) * 18) * .12, 33 + f + .02, 1.0)
bed('0441', 13.6, 35.2, 1.2, .35, .05, .2, .3)
for i in range(7):
    t0 = 38.55 + i * .22
    add(ken('impactMetal_light', i % 5), t0, .5, (i % 3 - 1) * .3); add(ken('impactGlass_light', i % 5), t0 + .01, .3)
# ---------------- 8. raio-X ----------------
add(lp(ken('computerNoise', 1), 3000), 40.0, .12); add(drone(7.5, 46, .09), 40.0)
add(ken('forceField', 0), 40.1, .3)
for k in range(13): add(lp(bsb('0243', 0, .5, .01), 500), 41.2 + k * .48, .4)   # coração continua
add(whoosh(.6, 400, 3000, .2), 41.15, 1.0); add(ken('laserSmall', 2), 42.2, .35); add(ken('laserSmall', 3), 42.6, .3)
add(whoosh(.5, 2000, 400, .2), 43.8, 1.0)
add(ken('impactSoft_heavy', 1), 44.8, .6); add(ken('forceField', 2), 44.85, .25)
# ---------------- 9. seringa esquecida ----------------
add(drone(2.4, 40, .12), 47.4); bed('0425', 3, 47.5, 2.3, .12, .3, .4)
add(hp(bsb('1384', 8.7, .35, .01), 300), 48.3, .5)
# ---------------- 10. motel: engasgo ----------------
bed('2118', 0, 49.8, 5.0, .18, .2, .3)                     # zumbido do neon
bed('0114', 4, 49.8, 5.2, .2, .3, .4)
g = lp(pitch(bsb('1026', 4.9, 1.2, .02), 1.25), 2500)
add(g, 51.2, .8); add(lp(pitch(bsb('1026', 5.0, 1.0, .02), 1.4), 2200), 52.4, .6)
add(bsb('2892'), 51.0, .35); add(bsb('2894', 0, 1.0), 53.0, .3)
for k, tt_ in enumerate([50.0, 50.9, 51.9, 53.0, 54.3]): add(lp(bsb('0243', 0, .5, .01), 500), tt_, .45 - .06 * k)
ecg = bsb('1309', 11.4, 4.1, .02); add(lp(ecg, 3000), 51.2, .13)
# ---------------- 11. final ----------------
bed('0935', 60, 55.0, 3.5, .9, .8, 1.2)
add(whoosh(1.8, 200, 900, .07), 55.4, 1.0)
add(ken('impactPunch_heavy', 1), 55.32, .45)
# transição: um whoosh em cada corte
for c in [7.5, 12.5, 23, 28, 33, 40, 47.5]: add(whoosh(.45, 3500, 400, .12), c - .25, 1.0)

mx = np.stack([L, Rr], 1)
mx = np.tanh(mx * 1.2) / np.tanh(1.2); mx *= .9 / max(1e-6, np.abs(mx).max())
with wave.open(os.path.join(HERE, 'mike2_sfx.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok', TOTAL)
