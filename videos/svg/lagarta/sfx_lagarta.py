"""Efeitos sonoros do Short "A lagarta vira sopa", todos sintetizados em Python (sem música, sem voz).
Os tempos seguem narr.json e os cortes de _cenas.js. Saída: lagarta_sfx.mp3 (estéreo, 44,1 kHz).
Uso:  python3 sfx_lagarta.py   (precisa de numpy, scipy e ffmpeg)"""
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
rng = np.random.default_rng(2611)

# inícios dos planos (iguais aos de _cenas.js)
SH = {'pendura': 0, 'troca': 2.3, 'sopa': T['b2'] - .1, 'discos': T['b3'] - .1, 'cresce': T['b4'] - .1, 'transp': T['b5'] - .1, 'sai': T['b6'] - .1, 'voa': 23.0}


def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def ruido(d): return rng.standard_normal(int(d * SR))
def env(n, a=.005, r=.1, forma=1.0):
    t = np.arange(n) / SR
    return (np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(r, 1e-4))) ** forma
def jan(n, a=.05, b=.1):   # entra em a s, sai em b s
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


def varredura(d, f_ini, f_fim, vidro=True):   # sopro subindo ou descendo (íris da lupa)
    x = ruido(d)
    t = np.linspace(0, 1, len(x))
    y = np.zeros(len(x))
    for k in range(10):
        f = f_ini * (f_fim / f_ini) ** (k / 9)
        c = k / 9
        y += bp(x, f, f * 1.25) * np.exp(-((t - c) / .16) ** 2)
    y = y / np.abs(y).max() * np.sin(np.pi * t) ** .8
    if vidro:
        tt = np.arange(len(x)) / SR
        fs = f_ini * (f_fim / f_ini) ** t
        y += .25 * np.sin(np.cumsum(2 * np.pi * fs * 1.5 / SR)) * np.sin(np.pi * t)
    return y


def sino(f, d=1.4):
    t = np.arange(int(d * SR)) / SR
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / (d * .35)) + .35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / (d * .18)) + .15 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / (d * .1))
    return y * np.minimum(1, t / .004)


def tic(f=1700):
    d = .07
    t = np.arange(int(d * SR)) / SR
    return np.sin(2 * np.pi * f * t) * np.exp(-t / .012) + hp(ruido(d), 2500) * env(int(d * SR), .0005, .006) * .4


def squish(d=.3):
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
        i = int(rng.uniform(0, max(.01, d - .1)) * SR)
        y[i:i + len(b)] += b[:len(y) - i] * rng.uniform(.3, 1)
    return y


def chiado(d):     # enzimas efervescendo
    x = hp(ruido(d), 4000)
    t = np.arange(len(x)) / SR
    return x * (.5 + .5 * rng.random(len(x)) ** 6) * np.minimum(1, t / .2) * np.minimum(1, (d - t) / .3) * .5


def rasgar(d=.7):      # pele escorregando e rasgando
    x = bp(ruido(d), 600, 4500)
    t = np.arange(len(x)) / SR
    gate = lp((np.sin(2 * np.pi * (11 + 6 * t / d) * t) > -.2).astype(float), 200)
    return x * gate * np.sin(np.pi * t / d) ** .6 * 1.2


def seda(d=.6):        # rangido suave da seda
    t = np.arange(int(d * SR)) / SR
    f = 1500 + 400 * np.sin(2 * np.pi * 3 * t)
    return np.sin(np.cumsum(2 * np.pi * f / SR)) * .12 * np.sin(np.pi * t / d) ** 2 + bp(ruido(d), 1200, 3200) * .08 * np.sin(np.pi * t / d)


def estalo(g=1.0):     # casca rachando
    d = .3
    n = int(d * SR)
    y = hp(ruido(d), 2000) * env(n, .0005, .02) + bp(ruido(d), 800, 6000) * env(n, .001, .05) * .4
    for k in range(7):
        i = int(rng.uniform(.02, .24) * SR)
        c = hp(ruido(.01), 3000) * env(int(.01 * SR), .0003, .003)
        y[i:i + len(c)] += c[:n - i] * rng.uniform(.3, .8)
    return y * g


def pop(f=700):
    d = .09
    t = np.arange(int(d * SR)) / SR
    return np.sin(np.cumsum(2 * np.pi * (f * np.exp(-t * 30) + 200) / SR)) * env(len(t), .001, .02)


def inchar(d=.7):      # asa se abrindo: papel molhado
    x = hp(ruido(d), 1800)
    t = np.arange(len(x)) / SR
    return x * (.3 + .7 * (rng.random(len(x)) > .93)) * np.sin(np.pi * t / d) * .5 + lp(ruido(d), 300) * np.sin(np.pi * t / d) * .3


def bater(d, f=13, g=1.0):   # batida de asas
    x = bp(ruido(d), 250, 1400)
    t = np.arange(len(x)) / SR
    return x * (.5 + .5 * np.sin(2 * np.pi * f * t)) ** 1.5 * jan(len(x), .05, .1) * g


def passaros(d, g=.12):
    y = np.zeros(int(d * SR))
    for k in range(int(d * 3)):
        n = int(rng.uniform(.06, .14) * SR)
        tt = np.arange(n) / SR
        f = rng.uniform(2800, 4200) + 900 * np.sin(2 * np.pi * rng.uniform(15, 30) * tt)
        c = np.sin(np.cumsum(2 * np.pi * f / SR)) * np.sin(np.pi * tt / tt[-1])
        i = int(rng.uniform(0, max(.01, d - .2)) * SR)
        y[i:i + n] += c * g
    return y


def brisa(d, g=.15):
    return lp(ruido(d), 500) * g * (.7 + .3 * np.sin(2 * np.pi * .3 * np.arange(int(d * SR)) / SR))


def drone(d, f=55, g=.12):
    t = np.arange(int(d * SR)) / SR
    return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 1.5 * t)) * jan(len(t), .3, .3) * g


def batimento(d, bpm=60):   # dentro da casca
    y = np.zeros(int(d * SR))
    for k in range(int(d * bpm / 60)):
        for dt, g in ((0, 1), (.22, .6)):
            b = lp(ruido(.15), 90) * env(int(.15 * SR), .005, .04) * g
            i = int((k * 60 / bpm + dt) * SR)
            if i < len(y):
                y[i:i + len(b)] += b[:len(y) - i]
    return y


def queda_de_tom(d=.6, f0=220, f1=55):
    t = np.arange(int(d * SR)) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    return np.sin(np.cumsum(2 * np.pi * f / SR)) * env(len(t), .01, d * .5)


# ---------------------------------------------------------------- linha do tempo
CORTES = [SH['troca'], SH['discos'], SH['cresce'], SH['sai'], SH['voa']]
for c in CORTES:
    add(c - .25, whoosh(), .3)

# ambiente de fora: brisa e pássaros da alvorada (planos 1-2 e 6-8); dentro: zumbido grave e batimento
add(0, brisa(SH['sopa'], .8), 1)
add(0, passaros(SH['sopa'] - .4, .1), 1, .3)
add(SH['transp'] - .3, brisa(TOTAL - SH['transp'] + .3, .8), 1)
add(SH['transp'] + 1.6, passaros(TOTAL - SH['transp'] - 1.8, .13), 1, -.3)
add(SH['sopa'] + .3, drone(SH['transp'] - SH['sopa'] - .2, 58, .18), 1)
add(SH['sopa'] + .3, batimento(SH['transp'] - SH['sopa'] - .6, 58), .2)

# 1. pende: seda rangendo, folhas, o corpo pulsando
s = SH['pendura']
add(s + .15, seda(.7), .8, .2)
add(s + 1.1, seda(.5), .6, .2)
add(s + .4, hp(ruido(.5), 3000) * jan(int(.5 * SR), .1, .2) * .05, 1, -.4)
for k in range(5):
    add(s + .3 + k * .42, lp(ruido(.18), 300) * env(int(.18 * SR), .01, .05) * .5, 1)
# 2. troca de pele: tensão, pele subindo, pop da crisálida, queda, brilhos
s = SH['troca']
add(s, seda(.9), .9)
add(s + .65, rasgar(.9), .9)
add(s + .9, squish(.5), .7)
add(s + 1.25, pop(500) * 1.1, .8)
add(s + 1.5, queda_de_tom(.4, 160, 60), .6)
add(s + 1.55, whoosh(.35, 180), .5)
add(s + 1.7, squish(.25), .5)
for k, f in enumerate((2637, 3136, 3951)):
    add(s + 1.78 + k * .25, sino(f, 1.0), .22 - k * .03, -.3 + k * .3)
# 3. a lupa e a sopa: íris, enzimas chiando, corpo derretendo
s = SH['sopa']
add(s - .1, varredura(.7, 300, 2800), .55)
add(s, queda_de_tom(.7, 140, 50), .6)
add(s + .35, chiado(3.3), .26)
add(s, gorgolejo(SH['discos'] - s, 12, 160, 500), .26)
for k in range(8):
    add(s + 1.0 + k * .38, squish(.35), .38, (-1) ** k * .3)
add(s + 3.9, squish(.7), .7)
# 4. a luz apaga e os discos acendem, um por vez
s = SH['discos']
add(s, queda_de_tom(.7, 200, 45), .8)
for k, (f, t0) in enumerate(zip((523, 659, 784, 988, 1175, 1319, 1568, 1760, 2093, 2349), (.35, .6, .85, 1.1, 1.4, 1.6, 1.85, 2.05, 2.3, 2.5))):
    add(s + t0, sino(f, 1.6), .22, -.5 + .11 * k)
    add(s + t0, hp(ruido(.12), 4000) * env(int(.12 * SR), .001, .03) * .15, 1)
add(s + .55, tic(1100), .5)
add(s, drone(SH['cresce'] - s, 90, .08), 1)
# 5. as partes crescem: contador de dias (tique a cada 0,5 s), pops, vibração, asas
s = SH['cresce']
for k in range(10):
    add(12.8 + k * .5 - (0 if k else 0), tic(1900 if k % 2 else 1400), .4)
add(s + .45, pop(800), .8)
add(s + .6, pop(900), .7)
add(s + 1.0, sino(1568, 1.0), .25, .3)
for k in range(3):
    add(s + 1.3 + k * .2, tic(2400 - 150 * k), .4, -.3 + .3 * k)
add(s + 1.3, varredura(1.8, 200, 1200, False), .3)
add(s + 1.9, queda_de_tom(.5, 120, 60), .6)
add(s, gorgolejo(2.5, 8, 150, 400) * np.linspace(1, 0, int(2.5 * SR)), .22)
add(s + 3.2, varredura(.7, 2800, 300), .5)
# 6. transparente: céu em time-lapse, brilho de vidro, tremor, estalos
s = SH['transp']
for k in range(3):
    add(s + .475 * k, lp(ruido(.5), 600) * jan(int(.5 * SR), .2, .2) * .35, 1)
t_vidro = np.arange(int(2.0 * SR)) / SR
vid = sum(np.sin(2 * np.pi * f * t_vidro) for f in (1318, 1760, 2093)) * jan(len(t_vidro), 1.2, .6) * .05
add(s + 1.6, vid, 1)
for k in range(14):
    add(s + 3.2 + k * .075 + rng.uniform(0, .04), tic(rng.uniform(900, 1400)) * (.3 + .06 * k), .5, rng.uniform(-.3, .3))
for dt in (3.95, 4.1, 4.22, 4.34):
    add(s + dt, estalo(.5 + (dt - 3.95)), .7)
# 7. a casca racha, a cabeça empurra para fora
s = SH['sai']
add(s + .02, estalo(1.1), .9)
add(s + .15, estalo(.7), .6, -.2)
add(s + .3, estalo(.6), .5, .2)
for k in range(6):
    add(s + .6 + k * .24, squish(.3), .55, (-1) ** k * .2)
add(s + 1.0, tic(1500), .5, -.3)
add(s + 1.3, tic(1300), .5, .3)
add(s + 1.6, tic(1100), .5, -.2)
add(s + 1.0, hp(ruido(.5), 5000) * jan(int(.5 * SR), .1, .3) * .08, 1)
add(s + 1.75, squish(.45), .7)
# 8. a borboleta incha as asas, abre, bate e voa
s = SH['voa']
for k in range(4):
    add(s + .1 + k * .26, queda_de_tom(.25, 90, 55), .45)
add(s, inchar(1.1), .8)
add(s + .2, squish(.5), .5)
for dt in (.15, .55, .85):
    add(s + dt, lp(ruido(.1), 1500) * env(int(.1 * SR), .001, .02) * .5, 1)    # pingos
add(s + 1.0, lp(ruido(.25), 700) * env(int(.25 * SR), .01, .06) * .6, 1)      # abrir as asas
add(s + 1.5, bater(.9, 7, .55), 1, 0)
add(s + 2.1, bater(.7, 13, .5) * np.linspace(1, .3, int(.7 * SR)), 1, .6)
for k, f in enumerate((1568, 2093, 2637)):
    add(s + 1.6 + k * .2, sino(f, 1.2), .15, .3 + .2 * k)
add(s + 1.7, varredura(1.1, 400, 3000, False), .3, .5)
add(TOTAL - .8, lp(ruido(.5), 200) * jan(int(.5 * SR), .2, .2) * .25, 1)       # casca balançando

mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.1)
mix = mix / max(1e-6, np.abs(mix).max()) * .8
fade = int(.03 * SR)
mix[:fade] *= np.linspace(0, 1, fade)[:, None]
mix[-int(.2 * SR):] *= np.linspace(1, 0, int(.2 * SR))[:, None]
pcm = (mix * 32767).astype('<i2').tobytes()
saida = os.path.join(AQUI, 'lagarta_sfx.mp3')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '160k', saida], input=pcm, check=True)
print('lagarta_sfx.mp3', round(TOTAL, 2), 's')
