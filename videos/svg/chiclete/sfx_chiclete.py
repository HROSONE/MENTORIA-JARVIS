"""Efeitos sonoros do Short "Se você engolir um chiclete", todos sintetizados em Python (sem música, sem voz).
Os tempos seguem narr.json e os cortes de _cenas.js. Saída: chiclete_sfx.mp3 (estéreo, 44,1 kHz).
Uso:  python3 sfx_dillinger.py   (precisa de numpy, scipy e ffmpeg)"""
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
rng = np.random.default_rng(2026)


def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def ruido(d): return rng.standard_normal(int(d * SR))
def env(n, a=.005, r=.1, forma=1.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(r, 1e-4))
    return e ** forma


def add(t, x, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i + len(x) <= 0:
        return
    x = x[max(0, -i):]
    i = max(0, i)
    x = x[:N - i]
    L[i:i + len(x)] += x * g * (1 - max(0, pan))
    R[i:i + len(x)] += x * g * (1 + min(0, pan))


def parciais(d, fs, decs, amps):
    t = np.arange(int(d * SR)) / SR
    return sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / dc) for f, dc, a in zip(fs, decs, amps))


# ---------------------------------------------------------------- sons
def whoosh(d=.4):
    x = ruido(d)
    t = np.linspace(0, 1, len(x))
    y = sum(bp(x, f0, f0 * 1.6) * np.exp(-((t - c) / .22) ** 2) for f0, c in ((250, .45), (700, .55), (1800, .6)))
    return y / np.abs(y).max()


def gole():        # engolir: estalo molhado descendo de tom
    d = .35
    t = np.arange(int(d * SR)) / SR
    f = 420 * np.exp(-t * 6) + 90
    y = np.sin(np.cumsum(2 * np.pi * f / SR)) * env(len(t), .01, .08)
    return y + bp(ruido(d), 300, 1500) * env(len(t), .002, .03) * .5


def squish(d=.3):  # molhado, carne apertando
    x = bp(ruido(d), 150, 900)
    t = np.arange(len(x)) / SR
    return x * np.sin(np.pi * t / d) ** 2 * (1 + .7 * np.sin(2 * np.pi * 30 * t))


def borbulha(f=300):
    d = .09
    t = np.arange(int(d * SR)) / SR
    return np.sin(np.cumsum(2 * np.pi * (f + 2500 * t) / SR)) * env(len(t), .003, .025)


def gorgolejo(d, dens=14, f0=180, f1=600):
    y = np.zeros(int(d * SR))
    for k in range(int(d * dens)):
        b = borbulha(rng.uniform(f0, f1))
        i = int(rng.uniform(0, d - .1) * SR)
        y[i:i + len(b)] += b * rng.uniform(.3, 1)
    return y


def chiado(d):     # ácido efervescendo
    x = hp(ruido(d), 4000)
    t = np.arange(len(x)) / SR
    return x * (.5 + .5 * rng.random(len(x)) ** 6) * np.minimum(1, t / .2) * np.minimum(1, (d - t) / .3) * .5


def splash(g=1):
    d = .7
    y = bp(ruido(d), 400, 5000) * env(int(d * SR), .003, .12) + lp(ruido(d), 250) * env(int(d * SR), .002, .06) * 1.5
    g = gorgolejo(.6, 30, 400, 1200)
    y[:len(g)] += g * .4
    return y


def plop():
    d = .5
    t = np.arange(int(d * SR)) / SR
    f = 260 + 900 * (1 - np.exp(-t * 25))
    return np.sin(np.cumsum(2 * np.pi * f / SR)) * env(len(t), .002, .06) + bp(ruido(d), 800, 4000) * env(len(t), .001, .02) * .4


def drone(d, f=55):
    t = np.arange(int(d * SR)) / SR
    return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 1.5 * t)) * np.minimum(1, t / .3) * np.minimum(1, (d - t) / .3) * .12


def batimento(d, bpm=70):   # coração ao fundo dentro do corpo
    y = np.zeros(int(d * SR))
    for k in range(int(d * bpm / 60)):
        for dt, g in ((0, 1), (.22, .6)):
            b = lp(ruido(.15), 90) * env(int(.15 * SR), .005, .04) * g
            i = int((k * 60 / bpm + dt) * SR)
            if i < len(y):
                y[i:i + len(b)] += b[:len(y) - i]
    return y


def regua(d=.6):   # fita métrica puxada
    x = bp(ruido(d), 2000, 6000)
    t = np.arange(len(x)) / SR
    return x * (np.sin(2 * np.pi * 40 * t) > .3) * np.minimum(1, (d - t) / .1) * .5


def ding():
    return parciais(1.2, [1320, 2640, 3960], [.5, .3, .2], [1, .3, .15])


# ---------------------------------------------------------------- linha do tempo
SH = {'esofago': 2.4, 'estomago': T['b2'] - .1, 'acido': 7.8, 'amassa': T['b3'] - .1, 'corpo': T['b4'] - .1, 'intestino': 17.7, 'grosso': T['b5'] - .1, 'saida': T['b6'] - .1}
for c in SH.values():
    add(c - .25, whoosh(), .3)
add(0, batimento(TOTAL), .5)
add(0, drone(TOTAL, 46), .8)
# 1. boca: língua (squish) e o gole
add(.3, squish(.4), .6, .2)
add(1.6, gole(), .9)
# 2. esôfago: ondas apertando
s = SH['esofago']
for k in range(6):
    add(s + k * .45, squish(.35), .55, (-1) ** k * .3)
# 3. estômago: queda + splash + gorgolejo
s = SH['estomago']
add(s + .85, splash(), .9)
add(s, gorgolejo(SH['acido'] - s, 10), .5)
# 4. ácido: chiado e bolhas
s = SH['acido']
add(s, chiado(SH['amassa'] - s), .7)
add(s, gorgolejo(SH['amassa'] - s, 22, 500, 1500), .4)
# 5. amassando: squish ritmado
s = SH['amassa']
d5 = SH['corpo'] - s
for k in range(int(d5 / .5)):
    add(s + k * .49, squish(.42), .7, np.sin(k) * .4)
add(s, gorgolejo(d5, 12, 120, 400), .5)
# 6. corpo: ding ao acender, fita métrica
s = SH['corpo']
add(s + .9, ding(), .25)
add(s + 1.2, regua(.8), .6, .4)
# 7. intestino: squish longos
s = SH['intestino']
for k in range(int((SH['grosso'] - s) / .7)):
    add(s + k * .7, squish(.5), .5, -.6 + k * .2)
# 8. grosso: borbulhas graves
s = SH['grosso']
add(s, gorgolejo(SH['saida'] - s, 9, 80, 260), .8)
add(s + 1.5, squish(.6), .5)
# 9. saída: queda no vaso e ondinhas
s = SH['saida']
add(s + 2.15, plop(), 1.0)
add(s + 2.2, gorgolejo(.8, 20, 600, 1600), .3)
mix = np.stack([L, R], 1)
mix = mix / max(1e-6, np.abs(mix).max()) * .89
fade = int(.03 * SR)
mix[:fade] *= np.linspace(0, 1, fade)[:, None]
pcm = (mix * 32767).astype('<i2').tobytes()
saida = os.path.join(AQUI, 'chiclete_sfx.mp3')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '160k', saida], input=pcm, check=True)
print('chiclete_sfx.mp3', round(TOTAL, 2), 's')
