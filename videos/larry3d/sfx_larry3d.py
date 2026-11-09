import numpy as np, wave, os
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__))
w = wave.open(os.path.join(HERE, '..', 'cadeira', 'cadeira_sfx.wav')); SR = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2).astype(float) / 32767; w.close()
L, R = x[:, 0].copy(), x[:, 1].copy(); rng = np.random.default_rng(2)
T = lambda d: np.arange(int(d * SR)) / SR; noise = lambda d: rng.standard_normal(int(d * SR))
lp = lambda y, f: sosfilt(butter(2, f, 'low', fs=SR, output='sos'), y); hp = lambda y, f: sosfilt(butter(2, f, 'high', fs=SR, output='sos'), y)
def add(y, t, g=1, pan=0): i = int(t * SR); y = y[:max(0, len(L) - i)] * g; L[i:i + len(y)] += y * np.sqrt((1 - pan) / 2) * 1.414; R[i:i + len(y)] += y * np.sqrt((1 + pan) / 2) * 1.414
# abertura: jato passando colado (Doppler) + whoosh do mergulho + impacto grave
d = 1.2; t = T(d); jet = lp(noise(d), 500) * np.sin(np.pi * t / d) ** 1.5 + np.sin(2 * np.pi * np.cumsum(2600 - 1400 * np.tanh((t - .5) * 4)) / SR) * .15 * np.sin(np.pi * t / d)
add(jet * 1.1, 0, 1, -.4); add(hp(noise(.6), 2500) * np.sin(np.pi * T(.6) / .6) * .5, .55, 1, .3)
t = T(.9); add(np.sin(2 * np.pi * (45 + 100 * np.exp(-t * 16)) * t) * np.exp(-t * 4) * .9, .9)
# swoosh do giro 360
d = 2.0; t = T(d); add(sosfilt(butter(2, [300, 2400], 'band', fs=SR, output='sos'), noise(d)) * np.sin(np.pi * t / d) ** 2 * .35, 1.0, 1, 0)
mx = np.stack([L, R], 1); mx = np.tanh(mx * 1.15) / np.tanh(1.15); mx *= .9 / max(1e-6, np.abs(mx).max())
with wave.open(os.path.join(HERE, 'larry3d_sfx.wav'), 'wb') as f: f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok')
