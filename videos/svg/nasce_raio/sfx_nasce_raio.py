"""Efeitos sonoros do Short "Como nasce um raio", todos sintetizados em Python (sem música, sem voz).
Os tempos seguem narr.json e os cortes de _cenas.js (raio em 19,2 s; trovão em 23,5 s). Saída: nasce_raio_sfx.mp3.
Uso:  python3 sfx_nasce_raio.py   (precisa de numpy, scipy e ffmpeg)"""
import json
import os
import subprocess
import numpy as np
from scipy.signal import butter, sosfilt

AQUI = os.path.dirname(os.path.abspath(__file__))
SR = 44100
NR = json.load(open(os.path.join(AQUI, 'narr.json')))
TOTAL = NR['total']
T = {s['k']: s['t0'] for s in NR['s']}
N = int(SR * TOTAL)
L, R = np.zeros(N), np.zeros(N)
rng = np.random.default_rng(1940)

SH = {'gelo': 0, 'troca': 2.4, 'separa': T['b2'] - .1, 'nuvem': T['b3'] - .1, 'lider': T['b4'] - .1, 'faisca': T['b5'] - .1, 'raio': T['b6'] - .1, 'trovao': T['b7'] - .1, 'ciclo': 25.7}
RAIO, TROVAO = SH['raio'], SH['trovao']


def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def ruido(d): return rng.standard_normal(int(d * SR))
def env(n, a=.005, r=.1, forma=1.0):
    t = np.arange(n) / SR
    return (np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(r, 1e-4))) ** forma
def jan(n, a=.05, b=.1):
    t = np.arange(n) / SR
    d = n / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.minimum(1, (d - t) / max(b, 1e-4))


def add(t, x, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i + len(x) <= 0:
        return
    x = x[max(0, -i):]
    i = max(0, i)
    x = x[:N - i]
    L[i:i + len(x)] += x * g * (1 - max(0, pan))
    R[i:i + len(x)] += x * g * (1 + min(0, pan))


# ---------------------------------------------------------------- sons
def whoosh(d=.4, f0=250):
    x = ruido(d)
    t = np.linspace(0, 1, len(x))
    y = sum(bp(x, f * f0 / 250, f * f0 / 250 * 1.6) * np.exp(-((t - c) / .22) ** 2) for f, c in ((250, .45), (700, .55), (1800, .6)))
    return y / np.abs(y).max()


def varredura(d, f_ini, f_fim):
    x = ruido(d)
    t = np.linspace(0, 1, len(x))
    y = np.zeros(len(x))
    for k in range(10):
        f = f_ini * (f_fim / f_ini) ** (k / 9)
        y += bp(x, f, f * 1.25) * np.exp(-((t - k / 9) / .16) ** 2)
    y = y / np.abs(y).max() * np.sin(np.pi * t) ** .8
    fs = f_ini * (f_fim / f_ini) ** t
    return y + .25 * np.sin(np.cumsum(2 * np.pi * fs * 1.5 / SR)) * np.sin(np.pi * t)


def sino(f, d=1.4):
    t = np.arange(int(d * SR)) / SR
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / (d * .35)) + .35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / (d * .18)) + .15 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / (d * .1))
    return y * np.minimum(1, t / .004)


def tic(f=1700):
    d = .07
    t = np.arange(int(d * SR)) / SR
    return np.sin(2 * np.pi * f * t) * np.exp(-t / .012) + hp(ruido(d), 2500) * env(int(d * SR), .0005, .006) * .4


def beep(f=1500, d=.12):
    n = int(d * SR)
    return np.sin(2 * np.pi * f * np.arange(n) / SR) * jan(n, .004, .03)


def sizzle(d, k0, k1):
    n = int(d * SR)
    y = np.zeros(n)
    t = 0.0
    while t < d:
        k = k0 + (k1 - k0) * t / d
        t += rng.exponential(1 / (40 + 260 * max(k, .02)))
        i = int(t * SR)
        c = hp(ruido(.006), 2500) * env(int(.006 * SR), .0003, .0018) * rng.uniform(.2, 1)
        if i + len(c) < n:
            y[i:i + len(c)] += c
    return y


def zap(d=.35):             # faísca curta
    n = int(d * SR)
    t = np.arange(n) / SR
    return hp(ruido(d), 2500) * env(n, .0006, .05) * 1.2 + np.sin(np.cumsum(2 * np.pi * (5200 * np.exp(-t * 9) + 700) / SR)) * env(n, .002, .12) * .5 + bp(ruido(d), 800, 6000) * env(n, .001, .03) * .6


def estalo_raio():          # o raio caindo
    d = 2.4
    n = int(d * SR)
    t = np.arange(n) / SR
    crack = hp(ruido(d), 1500) * env(n, .0005, .06) * 1.8 + bp(ruido(d), 300, 8000) * env(n, .001, .2) * 1.0
    thump = np.sin(np.cumsum(2 * np.pi * (45 + 120 * np.exp(-t * 20)) / SR)) * env(n, .002, .3) * 1.4
    return crack + thump + sizzle(d, .7, .05) * 1.2


def trovao(d=4.4):
    n = int(d * SR)
    t = np.arange(n) / SR
    boom = np.sin(np.cumsum(2 * np.pi * (38 + 50 * np.exp(-t * 5)) / SR)) * env(n, .01, .9) * 1.6
    rumble = lp(ruido(d), 260) * (.7 + .3 * np.sin(2 * np.pi * 3.1 * t)) * env(n, .03, 1.5) * 2.2
    return boom + rumble + bp(ruido(d), 300, 1400) * env(n, .01, .5) * .8 + hp(ruido(d), 1800) * env(n, .0005, .04) * 1.4


def zip_up(d=.8, f0=700, f1=2600):
    n = int(d * SR)
    t = np.linspace(0, 1, n)
    f = f0 * (f1 / f0) ** t
    return (np.sin(np.cumsum(2 * np.pi * f / SR)) * .6 + bp(ruido(d), 1500, 6000) * .3) * t ** 1.2 * jan(n, .02, .05)


def riser(d, f0, f1):
    n = int(d * SR)
    t = np.linspace(0, 1, n)
    f = f0 * (f1 / f0) ** t
    am = .6 + .4 * np.sin(2 * np.pi * (4 + 20 * t ** 2) * np.arange(n) / SR)
    return (np.sin(np.cumsum(2 * np.pi * f / SR)) * am + bp(ruido(d), 800, 4000) * .12) * t ** 1.5


def zumbido(d, f=60):
    t = np.arange(int(d * SR)) / SR
    return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2 * t) + .3 * np.sin(2 * np.pi * f * 3 * t)) * jan(len(t), .5, .5)


def chuva(d):
    return hp(ruido(d), 3500) * .05 + bp(ruido(d), 1000, 3000) * .04


def pulso(f=60):
    n = int(.25 * SR)
    return np.sin(2 * np.pi * f * np.arange(n) / SR) * env(n, .004, .08) * 1.3


def campo_at(t):
    if t < 7.8: return 0
    if t < 11.7: return 1.2 + 4.8 * (t - 7.8) / 3.9
    if t < 16.3: return 6.0 + 3.6 * ((t - 11.7) / 4.6) ** 3
    return 9.6 + .4 * min(1, (t - 16.3) / (RAIO - 16.3))


def cruz(fn, a, b, limiares, dt=.01):
    out, t, ult = [], a, fn(a)
    while t < b:
        v = fn(t)
        for lim in limiares:
            if ult < lim <= v:
                out.append(t)
        ult = v
        t += dt
    return out


# ---------------------------------------------------------------- linha do tempo
for c in (SH['troca'], SH['separa'], SH['nuvem'], SH['lider'], SH['faisca']):
    add(c - .25, whoosh(), .22)

# ambiente: dentro da nuvem (zumbido que cresce, tilintar de gelo); fora (vento, chuva e rumor distante)
add(0, zumbido(SH['nuvem'], 55) * np.linspace(.4, 1, int(SH['nuvem'] * SR)), .1, 0)
for k in range(46):
    t = rng.uniform(0, SH['nuvem'])
    add(t, sino(rng.uniform(2800, 6200), .3), rng.uniform(.015, .05), rng.uniform(-.8, .8))
add(SH['nuvem'] - .3, lp(ruido(TROVAO + 2.3 - SH['nuvem'] + .3), 500) * .24, 1)
add(SH['nuvem'] - .3, chuva(TROVAO + 2.3 - SH['nuvem'] + .3) * jan(int((TROVAO + 2.3 - SH['nuvem'] + .3) * SR), 1.0, 1.0), 1)
for dt in (8.2, 10.6, 14.0):
    add(dt, lp(ruido(2.6), 160) * env(int(2.6 * SR), .4, 1.0) * .22, 1)       # trovões distantes

# 1. o choque
add(0, zap(), .8)
add(.3, sino(1568, .8), .14, .3)
add(.35, sino(1175, .8), .12, -.3)
add(1.55, zap(), .75, .4)
add(1.85, sino(1568, .8), .14, .3)
# 2. a troca de carga: elétrons saltando e arcos
s = SH['troca']
for k in range(16):
    add(s + .45 + k * .09 + rng.uniform(0, .03), tic(rng.uniform(2200, 3300)), .16, rng.uniform(-.4, .4))
for dt in (.5, .7, .95, 1.2):
    add(s + dt, zap(.25), .4, -.2)
add(s + 2.0, sino(1760, 1.0), .16, .2)
add(s + 2.05, sino(1175, 1.0), .14, -.2)
# 3. leves sobem, pesados descem
s = SH['separa']
add(s + .2, varredura(2.4, 200, 1800), .3, .4)
add(s + .2, varredura(2.4, 1500, 180), .3, -.4)
# 4. o chão responde: o campo sobe (bipes) e as cargas sobem (zumbido eletrostático e corona)
s = SH['nuvem']
for t in cruz(campo_at, 7.8, 11.7, [2, 3, 4, 5]):
    add(t, beep(2000, .05), .14)
n = int(3.4 * SR)
tt = np.arange(n) / SR
add(s + 1.6, np.sin(np.cumsum(2 * np.pi * (90 + 90 * tt / 3.4) / SR)) * jan(n, 1.0, .3) * .16, 1)
add(s + 1.6, sizzle(3.4, .1, .8) * .5, 1, .1)
# 5. o líder desce em degraus
s = SH['lider']
add(s, riser(SH['faisca'] - s - .3, 160, 1100), .22)
for i in range(1, 25):
    t = s + .5 + i * .155
    add(t, zap(.12) * (.35 + .03 * i), .5, rng.uniform(-.3, .3))
    if i in (6, 11, 16, 4):
        add(t + .04, tic(2800) * .6, .25, rng.uniform(-.5, .5))
for t in cruz(campo_at, 11.7, 19.2, [8, 9, 9.5]):
    add(t, beep(1500, .08), .16)
# 6. a faísca sobe e encontra o líder
s = SH['faisca']
add(s + .55, zip_up(.9, 700, 2400), .4, -.2)
add(s + 1.0, zip_up(.8, 900, 3000), .3, .2)
t_whine = np.arange(int(1.3 * SR)) / SR
add(s + 1.3, np.sin(2 * np.pi * (2800 + 900 * t_whine) * t_whine) * jan(len(t_whine), .6, .05) * .07, 1)
add(RAIO - .12, np.zeros(10), 1)
add(RAIO - .45, zap(.2) * .5, .5)
# 7. O RAIO
add(RAIO, estalo_raio(), 1.0)
add(RAIO + .55, zap(.4), .55, .2)
add(RAIO + .1, zumbido(2.6, 120) * np.linspace(1, 0, int(2.6 * SR)), .12)
add(RAIO + 1.6, beep(1000, .1), .18)
add(RAIO + 1.9, beep(1200, .1), .16)
add(RAIO + 2.8, beep(1000, .1), .16)
# 8. O TROVÃO e os anéis
add(TROVAO, trovao(), 1.0)
for i, dt in enumerate((0, .28, .56, .84)):
    add(TROVAO + dt, pulso(58 - 4 * i), .5 - .08 * i)
add(TROVAO + 2.3, lp(ruido(1.8), 300) * env(int(1.8 * SR), .01, .7) * .6, 1)
# 9. o rebobinar até a faísca do quadro 0 (o loop)
add(25.7, zap(.6)[::-1], .8)
add(25.7, varredura(.6, 300, 3200), .3)

mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.1)
mix = mix / max(1e-6, np.abs(mix).max()) * .58
fade = int(.02 * SR)
mix[:fade] *= np.linspace(0, 1, fade)[:, None]
pcm = (mix * 32767).astype('<i2').tobytes()
saida = os.path.join(AQUI, 'nasce_raio_sfx.mp3')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '160k', saida], input=pcm, check=True)
print('nasce_raio_sfx.mp3', round(TOTAL, 2), 's')
