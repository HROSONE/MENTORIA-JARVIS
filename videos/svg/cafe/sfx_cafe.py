"""Efeitos sonoros do Short "Por que o café te acorda?", todos sintetizados em Python (sem música, sem voz).
Os tempos seguem narr.json e os cortes de _cenas.js (encaixes em 0,95 s, cafeína em 13,2 s, baque em 22,1 s, bocejo em 25,1 s).
Saída: cafe_sfx.mp3.   Uso:  python3 sfx_cafe.py   (precisa de numpy, scipy e ffmpeg)"""
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
rng = np.random.default_rng(2024)

SH = {'sono': 0, 'acumula': 2.4, 'encaixe': T['b2'] - .1, 'cafe': T['b3'] - .1, 'bloqueio': T['b4'] - .1, 'tapa': T['b5'] - .1, 'baque': T['b6'] - .1, 'bocejo': 24.0}
T_BAQUE = 22.0


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


def borbulha(f=300):
    d = .09
    t = np.arange(int(d * SR)) / SR
    return np.sin(np.cumsum(2 * np.pi * (f + 2500 * t) / SR)) * env(len(t), .003, .025)


def clack(f=900, g=1.0):          # a chave entrando na fechadura: estalo seco + anel
    d = .5
    n = int(d * SR)
    t = np.arange(n) / SR
    y = bp(ruido(d), 1200, 5000) * env(n, .0005, .012) * 1.1 + np.sin(2 * np.pi * f * t) * np.exp(-t / .05) * .8 + np.sin(2 * np.pi * f * 2.4 * t) * np.exp(-t / .09) * .35
    return y * g


def bonk(f=260):                  # a adenosina batendo na cafeína e voltando
    d = .4
    n = int(d * SR)
    t = np.arange(n) / SR
    return np.sin(np.cumsum(2 * np.pi * (f * np.exp(-t * 14) + 90) / SR)) * env(n, .002, .09) * 1.2 + bp(ruido(d), 500, 2500) * env(n, .0008, .01) * .5


def pong(f=600):                  # anel de sonar que entra na célula
    d = 1.2
    t = np.arange(int(d * SR)) / SR
    return np.sin(2 * np.pi * f * t * (1 - .15 * t)) * np.exp(-t / .35) * .6


def queda_de_tom(d=.6, f0=220, f1=55):
    t = np.arange(int(d * SR)) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    return np.sin(np.cumsum(2 * np.pi * f / SR)) * env(len(t), .01, d * .5)


def subida(d, f0, f1):
    n = int(d * SR)
    t = np.linspace(0, 1, n)
    f = f0 * (f1 / f0) ** t
    return np.sin(np.cumsum(2 * np.pi * f / SR)) * t ** 1.3 * jan(n, .05, .08)


def bocejo(d=1.5):                # "haaa" sintetizado: sopro com formantes que descem e um tom grave que cai
    n = int(d * SR)
    t = np.linspace(0, 1, n)
    x = ruido(d)
    y = np.zeros(n)
    for f0, f1, g in ((700, 450, 1.0), (1100, 800, .6), (2500, 2000, .25)):
        f = f0 + (f1 - f0) * t
        for k in range(8):
            c = int(k * n / 8)
            seg = slice(c, min(n, c + n // 8 + 200))
            ff = float(f[min(n - 1, c)])
            y[seg] += bp(x[seg], ff * .85, ff * 1.15) * g * 1.6
    amp = np.sin(np.pi * t) ** .7 * (1 - .3 * t)
    voz = np.sin(np.cumsum(2 * np.pi * (140 - 50 * t) / SR)) * .35
    return (y * .5 + voz * lp(x, 400) * 0 + voz) * amp


def sizzle(d, k0, k1):
    n = int(d * SR)
    y = np.zeros(n)
    t = 0.0
    while t < d:
        k = k0 + (k1 - k0) * t / d
        t += rng.exponential(1 / (40 + 220 * max(k, .02)))
        i = int(t * SR)
        c = hp(ruido(.006), 2500) * env(int(.006 * SR), .0003, .0018) * rng.uniform(.2, 1)
        if i + len(c) < n:
            y[i:i + len(c)] += c
    return y


def hora_at(t):
    if t < 4.8: return 420 + 480 * (1 - (1 - t / 4.8) ** 3)
    return 900 + 0 * t


def cruz_horas(a, b):
    out, t, ult = [], a, int(hora_at(a) // 60)
    while t < b:
        v = int(hora_at(t) // 60)
        if v != ult:
            out.append(t)
            ult = v
        t += .01
    return out


# ---------------------------------------------------------------- linha do tempo
for c in (SH['acumula'], SH['encaixe'], SH['cafe'], SH['bloqueio'], SH['tapa'], SH['baque']):
    add(c - .25, whoosh(), .22)

# ambiente: zumbido de dentro da célula, borbulhas e brilhos (exceto na cena da caneca)
add(0, lp(ruido(TOTAL), 160) * jan(N, .5, .8) * .2, 1)
for k in range(70):
    t = rng.uniform(0, TOTAL)
    if SH['cafe'] < t < SH['cafe'] + 1.7:
        continue
    add(t, borbulha(rng.uniform(220, 520)) * .4, 1, rng.uniform(-.7, .7))
for k in range(36):
    t = rng.uniform(0, 24)
    add(t, sino(rng.uniform(2600, 5200), .3), rng.uniform(.012, .035), rng.uniform(-.8, .8))

# 1. a adenosina encaixa (três chaves) e o relógio marca as horas
for dt, f in ((.95, 900), (1.7, 840), (2.4, 960)):
    add(dt, clack(f), .7, rng.uniform(-.5, .5))
    add(dt + .05, pong(620 + 40 * (f - 900) / 60), .16, 0)
for t in cruz_horas(0, 4.8):
    add(t, beep(2000, .05), .1)
# 2. as outras fechaduras se enchem (uma a cada .3 s)
s = SH['acumula']
for i in range(7):
    add(s + .3 + i * .3, clack(860 + 25 * i), .5, -.7 + i * .22)
add(s, varredura(2.4, 300, 2200), .12)
# 3. a chave desce devagar, encaixa, a alavanca gira e o aviso entra na célula
s = SH['encaixe']
add(s + .3, subida(2.4, 140, 380), .14)
add(s + 2.7, clack(700), .95)
add(s + 2.7, queda_de_tom(.7, 160, 55), .55)
add(s + 3.0, bonk(420), .45)
for i, dt in enumerate((2.95, 3.4, 3.85)):
    add(s + dt, pong(560 - 60 * i), .3, -.3 + .3 * i)
add(s + 3.3, queda_de_tom(1.4, 520, 260), .12)
# 4. a caneca, a cafeína sobe do café, as duas peças lado a lado
s = SH['cafe']
add(s, tic(1300), .5)
add(s, sino(2200, .5), .2)
add(s, lp(ruido(1.7), 900) * jan(int(1.7 * SR), .3, .3) * .12, 1)
add(s + .1, hp(ruido(1.6), 4000) * jan(int(1.6 * SR), .3, .4) * .06, 1)
for i in range(6):
    add(s + .55 + i * .2, sino(1200 + 150 * i, .5), .14, .4 - .15 * i)
add(s + 1.5, varredura(.5, 400, 2400), .25)
add(s + 1.7, sino(1568, .8), .14, -.3)
add(s + 1.9, sino(1175, .8), .14, .3)
add(s + 2.2, sino(2093, 1.0), .12)
# 5. a cafeína ocupa as fechaduras primeiro (batida mais seca e grave); a adenosina bate e volta
s = SH['bloqueio']
for dt in (.8, 1.3, 1.8):
    add(s + dt, clack(520, .9), .7, rng.uniform(-.4, .4))
add(s + .6, subida(1.9, 200, 900), .16)
for dt in (2.66, 3.06, 3.46, 3.76):
    add(s + dt, bonk(240 + rng.uniform(-30, 30)), .7, rng.uniform(-.6, .6))
# 6. a adenosina se acumula do lado de fora; o relógio dispara; o sono real sobe
s = SH['tapa']
add(s, sizzle(4.0, .05, .9) * .6, .5)
add(s, varredura(4.0, 200, 3000), .12)
add(s + .2, beep(1500, .08), .2)
add(s + .2, subida(4.0, 220, 640), .1)
for t in np.linspace(s + .4, s + 4.0, 22):
    add(t, tic(rng.uniform(1600, 2600)), .1, rng.uniform(-.5, .5))
# 7. a cafeína sai; tudo encaixa de uma vez; o neurônio apaga
s = SH['baque']
add(s + .3, whoosh(1.0, 400), .3)
add(s + .5, queda_de_tom(1.4, 300, 80), .18)
add(T_BAQUE - .7, varredura(.9, 300, 2500), .35)
for dt, f in ((0, 760), (.15, 820), (.3, 700)):
    add(T_BAQUE + dt, clack(f), .95, -.4 + dt * 2.5)
add(T_BAQUE, queda_de_tom(.9, 170, 45), .9)
add(T_BAQUE + .05, lp(ruido(.8), 600) * env(int(.8 * SR), .01, .25) * 1.0, 1)
for i, dt in enumerate((.3, .6, .9)):
    add(T_BAQUE + dt, pong(540 - 50 * i), .3, -.3 + .3 * i)
add(T_BAQUE + .2, queda_de_tom(1.8, 360, 70), .35)
# 8. zoom-out até a cabeça e o bocejo
s = SH['bocejo']
add(s - .05, varredura(1.4, 2400, 220), .35)
add(s + 1.1, bocejo(1.6), .55)
add(s + 1.3, lp(ruido(1.2), 500) * jan(int(1.2 * SR), .3, .4) * .05, 1)
t_z = np.arange(int(.6 * SR)) / SR
for i in range(3):
    add(s + 1.45 + i * .12, np.sin(2 * np.pi * (700 - 90 * i) * t_z) * np.exp(-t_z / .2) * .12, 1, .3)
add(TOTAL - .45, tic(1100), .18, .5)
add(TOTAL - .45, sino(1318, .5), .05, .5)

mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.1)
mix = mix / max(1e-6, np.abs(mix).max()) * .74
fade = int(.02 * SR)
mix[:fade] *= np.linspace(0, 1, fade)[:, None]
mix[-int(.15 * SR):] *= np.linspace(1, 0, int(.15 * SR))[:, None]
pcm = (mix * 32767).astype('<i2').tobytes()
saida = os.path.join(AQUI, 'cafe_sfx.mp3')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '160k', saida], input=pcm, check=True)
print('cafe_sfx.mp3', round(TOTAL, 2), 's')
