import subprocess, os, numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; TOTAL = 12.0; N = int(SR * TOTAL)
L = np.zeros(N); R = np.zeros(N); rng = np.random.default_rng(5)
HERE = os.path.dirname(os.path.abspath(__file__)); SONS = os.path.join(HERE, '..', 'sons')
def load(p):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.float32).astype(float); return x / max(1e-6, np.abs(x).max())
def bsb(i, a=0, d=None): x = load(os.path.join(SONS, 'bsb', f'{i}.ogg')); x = x[int(a * SR):]; return x if d is None else x[:int(d * SR)]
lp = lambda x, f: sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
hp = lambda x, f: sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
bp = lambda x, a, b: sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
T = lambda d: np.arange(int(d * SR)) / SR
noise = lambda d: rng.standard_normal(int(d * SR))
def env(n, a, r): e = np.ones(n); na, nr = int(a * SR), int(r * SR); e[:na] = np.linspace(0, 1, na) if na else 1; e[n - nr:] = np.linspace(1, 0, nr) if nr else e[n - nr:]; return e
def add(x, t, g=1, pan=0):
    i = int(t * SR); x = x[:max(0, N - i)] * g; L[i:i + len(x)] += x * np.sqrt((1 - pan) / 2) * 1.414; R[i:i + len(x)] += x * np.sqrt((1 + pan) / 2) * 1.414
# 1. vento contínuo com rajadas (pan móvel)
d = TOTAL; w = bp(noise(d), 150, 1400); g = .5 + .5 * np.abs(np.sin(2 * np.pi * .35 * T(d)) * np.sin(2 * np.pi * .13 * T(d) + 1))
add(w * g * .25, 0, 1, -.3); add(bp(noise(d), 1500, 5000) * g * .06, 0, 1, .4)
# 2. turbina do jato: rugido grave + assobio que sobe (Doppler na passagem)
d = 5.2; t = T(d); rumble = lp(noise(d), 300) * (.6 + .4 * np.sin(np.pi * t / d))
whine = np.sin(2 * np.pi * np.cumsum(2400 + 900 * np.tanh((t - 2.6) * 2)) / SR) * .12
add((rumble * .9 + hp(noise(d), 3000) * .15 + whine) * env(len(t), .4, .8), 0, .9)
for k in range(5): add(np.sin(2 * np.pi * (52 + k * 3) * t) * .06 * env(len(t), .4, .8), 0)
# 3. riser eletrizante antes do zoom
d = 1.4; t = T(d); f = 180 + 2200 * (t / d) ** 2.2
rs = (np.sin(2 * np.pi * np.cumsum(f) / SR) + .5 * np.sign(np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR))) * (t / d) ** 1.5
add(rs * .18 + hp(noise(d), 2000) * (t / d) ** 3 * .25, 3.6)
# 4. whoosh do zoom rápido + impacto (boom)
d = .9; t = T(d); out = np.zeros(len(t)); seg = int(SR * .02)
nz = noise(d)
for k in range(0, len(t), seg): fc = 300 + 6000 * (1 - k / len(t)) ** 2; out[k:k + seg] = bp(nz[max(0, k - 2000):k + seg], max(80, fc * .6), min(16000, fc * 1.5))[-len(out[k:k + seg]):]
add(out * np.sin(np.pi * t / d) ** 1.5 * .9, 4.2, 1, .2)
t = T(1.4); boom = np.sin(2 * np.pi * (45 + 120 * np.exp(-t * 18)) * t) * np.exp(-t * 3.5)
add(boom * 1.1 + lp(noise(1.4), 250) * np.exp(-t * 4) * .6, 4.95)
add(hp(noise(.25), 3000) * np.exp(-T(.25) * 20) * .6, 4.95)
# 5. balões rangendo, cabos vibrando com o vento
for k in range(10):
    tt = 5.4 + k * .6 + rng.random() * .2; d = .3; t = T(d)
    add(np.sin(2 * np.pi * (700 + 400 * np.sin(2 * np.pi * 6 * t)) * t) * env(len(t), .03, .15) * .05, tt, 1, rng.uniform(-.6, .6))
t = T(6.6); add(np.sin(2 * np.pi * 180 * t) * (.5 + .5 * np.sin(2 * np.pi * 7 * t)) * bp(noise(6.6), 120, 400) * .0 + bp(noise(6.6), 600, 1600) * (.3 + .7 * np.abs(np.sin(2 * np.pi * .7 * t))) * .05, 5.4)
# 6. Larry: lata de cerveja (clink), risada leve sintetizada
add(bsb('0019', 0, 0) [:0] if False else np.zeros(1), 0)
t = T(.15); add(np.sin(2 * np.pi * 2800 * t) * np.exp(-t * 30) * .2, 6.3)
# 7. segundo avião passando ao fundo
d = 4.0; t = T(d); add(lp(noise(d), 400) * np.sin(np.pi * t / d) ** 2 * .45 + np.sin(2 * np.pi * np.cumsum(2000 - 400 * (t / d)) / SR) * np.sin(np.pi * t / d) ** 2 * .05, 7.6, 1, -.5)
# 8. final: pulso grave eletrizante
t = T(1.2); add(np.sin(2 * np.pi * 55 * t) * np.exp(-t * 2) * .7, 10.8)
mx = np.stack([L, R], 1); mx = np.tanh(mx * 1.3) / np.tanh(1.3); mx *= .9 / max(1e-6, np.abs(mx).max())
with wave.open(os.path.join(HERE, 'voo3d_sfx.wav'), 'wb') as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok')
