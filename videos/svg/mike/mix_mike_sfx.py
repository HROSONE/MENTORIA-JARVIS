import json, subprocess, glob, os, numpy as np, wave
from scipy.signal import resample_poly, butter, lfilter
SR = 44100; rng = np.random.default_rng(3)
J = json.load(open('narr.json')); S = {x['k']: x for x in J['s']}; TOT = J['total']
N = int(SR * TOT); L = np.zeros(N); R = np.zeros(N)
def add(sig, t0, g=1., pan=0.):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if j <= i or i < 0: return
    s = sig[:j - i] * g; L[i:j] += s * np.sqrt(.5 * (1 - pan)); R[i:j] += s * np.sqrt(.5 * (1 + pan))
T = lambda d: np.arange(int(d * SR)) / SR
noise = lambda d: rng.standard_normal(int(d * SR))
def lp(x, f): b, a = butter(2, f / (SR / 2)); return lfilter(b, a, x)
def hp(x, f): b, a = butter(2, f / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi): b, a = butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
def env(n, a, r):
    e = np.ones(n); A, B = int(a * SR), int(r * SR)
    if A: e[:A] = np.linspace(0, 1, A)
    if B: e[n - B:] *= np.linspace(1, 0, B)
    return e
osc = lambda f, d: np.sin(2 * np.pi * np.cumsum(np.broadcast_to(f, (int(d * SR),))) / SR)
SND = '../../sons'
def snd(name, i=0):
    f = sorted(glob.glob(os.path.join(SND, '**', f'{name}_{i:03d}.ogg'), recursive=True))[0]
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(float)
def wind(d, g=.15): t = T(d); return bp(noise(d), 200, 1200) * (.6 + .4 * np.sin(2 * np.pi * .3 * t)) * env(len(t), .5, .5) * g
def birds(d):
    out = np.zeros(int(d * SR))
    for k in np.arange(rng.random(), d - .5, 1.4 + rng.random()):
        dd = .18; tt = T(dd); b = osc(3000 + 1200 * np.sin(2 * np.pi * 9 * tt), dd) * np.sin(np.pi * tt / dd) * .025; i = int(k * SR); out[i:i + len(b)] += b[:len(out) - i]
    return out
def cluck(g=.3):
    d = .16; t = T(d); f = 520 * (1 + .4 * np.exp(-t * 30)); return bp(np.sign(osc(f, d)), 400, 2600) * np.exp(-t * 14) * g
def whoosh(d, g=.4): t = T(d); return bp(noise(d), 300, 3000) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * g
def boom(d=1.2, f=45): t = T(d); return (osc(f * (1 + .5 * np.exp(-t * 8)), d) * np.exp(-t * 3) + lp(noise(d), 160) * np.exp(-t * 5)) * .5
def heart(): t = T(.5); a = osc(55, .5) * np.exp(-t * 18); return lp(a, 180) * .8
def projector(d): t = T(d); return hp(noise(d), 2500) * (np.sin(2 * np.pi * 24 * t) > .6) * .05 * env(len(t), .2, .2)
def drop(): t = T(.3); return osc(900 + 1400 * np.exp(-t * 25), .3) * np.exp(-t * 18) * .25
def crowd(d, g=.12):
    t = T(d); out = sum(bp(np.sign(osc(140 + 40 * k + 10 * np.sin(2 * np.pi * (1 + k * .3) * t), d)), 300, 2000) for k in range(6)) / 6
    return out * env(len(t), .5, .6) * g
def clap(d, dens=30):
    out = np.zeros(int((d + .1) * SR))
    for _ in range(int(d * dens)):
        c = bp(noise(.05), 800, 5000) * np.exp(-T(.05) * 90); j = int(rng.random() * d * SR); out[j:j + len(c)] += c * (.4 + .6 * rng.random())
    return out * env(len(out), .2, .4) * .25
def drone(d, f, g=.08): t = T(d); return lp(osc(f, d) + .5 * osc(f * 1.5, d) + .4 * osc(f * 2, d), 600) * env(len(t), .6, .6) * g
def ping(f=1500, d=.5): t = T(d); return osc(f, d) * np.exp(-t * 9) * .2
t = lambda k: S[k]['t0']
# fazenda e o machado
add(wind(t('s3')), 0); add(birds(t('s3')), 0)
add(cluck(.25), .15, 1, .3); add(cluck(.2), .5, 1, .3)
add(whoosh(.45, .5), t('s2') + .3); add(snd('impactWood_heavy', 0), t('s2') + .74, 1.2); add(boom(1.0, 50), t('s2') + .74, .8)
for k in range(3): add(heart(), t('s2') + 1.2 + k * .5, .7)
# andando sem cabeça
add(wind(4, .1), t('s3')); [add(snd('footstep_grass', k % 5), t('s3') + .1 + k * .32, .35, .2) for k in range(6)]
# 1945: projetor
add(projector(t('s9') - t('s4') + 1.5), t('s4') - .1); add(wind(t('s7') - t('s4'), .1), t('s4'))
[add(snd('footstep_grass', k % 5), t('s6') + .2 + k * .4, .3, -.2) for k in range(9)]
for k in range(5): add(drop(), t('s7') + .5 + k * .9, 1.0)
add(crowd(t('s9') - t('s8') + .3, .1), t('s8')); add(clap(2.2), t('s8') + 1.8, 1.0)
add(drone(3.0, 41, .08), t('s10'))
# explicação
add(drone(t('s13') - t('s11'), 49, .08), t('s11')); add(ping(1800), t('s11') + .5); add(whoosh(.6, .3), t('s11') + 1.2)
add(boom(.8, 70), t('s12') + .2, .6)
add(wind(4, .1), t('s13')); add(birds(4), t('s13'))
add(crowd(t('s15') - t('s14') + .3, .12), t('s14')); add(clap(3.0, 40), t('s14') + .6, 1.0)
add(ping(1318, .9), t('s15'), 1.2); add(cluck(.25), t('s15') + .5, 1, .2)
sfx = np.stack([L, R], 1)
# narração por cima (com SFX abaixados durante a fala)
import soundfile as sf
nv, nsr = sf.read('../../tts/mike_pm_alex.wav'); nv = resample_poly(nv, SR, nsr)[:N]
speech = np.zeros(N); speech[:len(nv)] = nv
envs = np.convolve(np.abs(speech), np.ones(4410) / 4410, 'same'); duck = 1 - .3 * np.clip(envs / (envs.max() * .3 + 1e-9), 0, 1)
mix = sfx * duck[:, None] * .9; mix *= .89 / max(1e-6, np.abs(mix).max())
mix = np.tanh(mix * 1.1) / np.tanh(1.1); mix *= .92 / np.abs(mix).max()
with wave.open('mike_sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('ok', TOT)
