"""Efeitos sonoros do Short "Por que a pipoca estoura?", todos sintetizados em Python (sem música, sem voz).
Os tempos seguem narr.json e os cortes de _cenas.js (estouro em 13,85 s; vapor escapa em 19,7 s). Saída: pipoca_sfx.mp3.
Uso:  python3 sfx_pipoca.py   (precisa de numpy, scipy e ffmpeg)"""
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
rng = np.random.default_rng(1985)

SH = {'grao': 0, 'corte': 2.2, 'pressao': T['b2'] - .1, 'calor': T['b3'] - .1, 'estouro': T['b4'] - .1, 'estalo': T['b5'] - .1, 'pula': 21.6, 'pouso': 24.0, 'coro': 25.0}
POPS_CORO = [25.12, 25.28, 25.45, 25.6, 25.78, 25.95, 26.12, 26.3, 26.5, 26.65, 26.82]   # iguais aos de _arte.js
XS_CORO = [330, 720, 260, 820, 450, 650, 420, 650, 560, 200, 880]
POP = 13.85
VAPOR = SH['estalo'] + 2.2


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
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * jan(n, .004, .03)


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


def sizzle(d, k0, k1):      # óleo chiando: estalinhos de ritmo crescente
    n = int(d * SR)
    y = np.zeros(n)
    t = 0.0
    while t < d:
        k = k0 + (k1 - k0) * t / d
        t += rng.exponential(1 / (40 + 220 * k))
        i = int(t * SR)
        c = hp(ruido(.006), 2500) * env(int(.006 * SR), .0003, .0018) * rng.uniform(.2, 1)
        if i + len(c) < n:
            y[i:i + len(c)] += c
    return y + hp(ruido(d), 5000) * (.02 + .04 * k1)


def popsom(f=900, d=.25):   # estalo de pipoca
    n = int(d * SR)
    t = np.arange(n) / SR
    thump = np.sin(np.cumsum(2 * np.pi * (f * .12 + f * .5 * np.exp(-t * 60)) / SR)) * env(n, .001, .05)
    return thump * .9 + bp(ruido(d), 700, 5000) * env(n, .0008, .018) * 1.2 + lp(ruido(d), 1800) * env(n, .001, .06) * .5


def grande_pop():           # o estouro do grão-herói
    d = 1.8
    n = int(d * SR)
    t = np.arange(n) / SR
    boom = np.sin(np.cumsum(2 * np.pi * (55 + 140 * np.exp(-t * 14)) / SR)) * env(n, .002, .22) * 1.6
    crack = bp(ruido(d), 500, 7000) * env(n, .0005, .03) * 1.6
    rush = bp(ruido(d), 250, 3000) * env(n, .01, .45) * .9
    tail = lp(ruido(d), 500) * env(n, .05, .5) * .4
    return boom + crack + rush + tail


def jato(d=1.2):            # vapor escapando: sibilo + estalo
    n = int(d * SR)
    t = np.arange(n) / SR
    hiss = bp(ruido(d), 1800, 9000) * env(n, .01, .55) * 1.0
    p = popsom(1100, .3) * 1.4
    hiss[:len(p)] += p
    return hiss


def riser(d, f0, f1):
    n = int(d * SR)
    t = np.linspace(0, 1, n)
    f = f0 * (f1 / f0) ** t
    am = .6 + .4 * np.sin(2 * np.pi * (4 + 22 * t ** 2) * np.arange(n) / SR)
    return (np.sin(np.cumsum(2 * np.pi * f / SR)) * am + bp(ruido(d), 800, 4000) * .15) * t ** 1.5


def rangido(d=.7, f=140):   # casca rangendo
    n = int(d * SR)
    t = np.arange(n) / SR
    ft = f * (1 + .35 * np.sin(2 * np.pi * 3.3 * t))
    y = np.sign(np.sin(np.cumsum(2 * np.pi * ft / SR))) * .3 + bp(ruido(d), 300, 1400) * .5
    return lp(y, 1200) * jan(n, .1, .2)


def pulso(f=70):
    d = .22
    n = int(d * SR)
    return np.sin(2 * np.pi * f * np.arange(n) / SR) * env(n, .004, .07) * 1.3


def queda_de_tom(d=.6, f0=220, f1=55):
    t = np.arange(int(d * SR)) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    return np.sin(np.cumsum(2 * np.pi * f / SR)) * env(len(t), .01, d * .5)


def temp_at(t):
    if t < 8.5: return 105 + 41 * t / 8.5
    if t < 10:
        x = (t - 8.5) / 1.5
        return 146 + 34 * (1 - (1 - x) ** 3)
    return 180


def pres_at(t):
    def ease(x): x = min(1, max(0, x)); return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
    if t < 4.3: return 1 + .5 * min(1, max(0, (t - 2.2) / 2.1))
    if t < 8.5: return 1.5 + 5 * ease((t - 4.3) / 4.2)
    if t < 11.8: return 6.5 + 3.7 * ease((t - 8.5) / 3.3)
    return 10.2


def cruzamentos(fn, a, b, passo, dt=.01):
    out, t, ult = [], a, int(fn(a) / passo)
    while t < b:
        v = int(fn(t) / passo)
        if v != ult:
            out.append(t)
            ult = v
        t += dt
    return out


# ---------------------------------------------------------------- linha do tempo
for c in (SH['corte'], SH['pressao'], SH['calor'], SH['estalo'], SH['pula'], SH['coro']):
    add(c - .25, whoosh(), .28)

# ambiente: chama (rumor grave) e óleo chiando, mais forte conforme esquenta
add(0, lp(ruido(TOTAL), 220) * jan(N, .5, .5) * .35, 1)
add(0, sizzle(POP, .1, 1.0), .55, .1)
add(POP, sizzle(TOTAL - POP, 1.0, .6), .6, -.1)
for k in range(10):
    add(.4 + k * rng.uniform(.6, 1.4), borbulha(rng.uniform(220, 520)) * .5, 1, rng.uniform(-.4, .4))

# 1. o grão no óleo e o termômetro
for t in cruzamentos(temp_at, 0, 10, 5):
    add(t, beep(2100, .05), .18)
# 2. a varredura abre o grão; a gota vira vapor
s = SH['corte']
add(s - .05, varredura(.7, 400, 3600), .5)
add(s + .6, sino(1568, 1.0), .22, .2)
for k in range(8):
    add(s + .9 + k * .17, hp(ruido(.18), 3500) * env(int(.18 * SR), .01, .06) * .22, 1, rng.uniform(-.5, .5))
# 3. o vapor bate na casca e a pressão sobe
s = SH['pressao']
for k in range(90):
    u = rng.uniform(0, 1)
    t = s + u * (SH['calor'] - s)
    dens = .3 + .7 * u
    if rng.random() < dens:
        add(t, sino(rng.uniform(2200, 3600) * (1 + .5 * u), .25), .06 + .08 * u, rng.uniform(-.7, .7))
for t in cruzamentos(pres_at, 2.2, 11.9, 1):
    add(t, tic(900 + 120 * pres_at(t)), .5)
add(s, riser(SH['calor'] - s, 60, 130), .22)
add(s + 2.7, rangido(.8, 120), .35)
add(s + 3.6, rangido(.8, 135), .4)
# 4. 180 graus, pressão no vermelho, tensão
s = SH['calor']
for t in cruzamentos(temp_at, 8.5, 10.05, 5):
    add(t, beep(2300, .06), .22)
add(10.0, beep(1300, .35), .3)
add(11.8, beep(1000, .3), .28)
add(s, riser(POP - .45 - s, 180, 1600), .38)
tp = s
while tp < POP - .5:
    add(tp, pulso(66 + 6 * (tp - s)), .5)
    tp += max(.16, .85 - .15 * (tp - s))
for dt in (10.9, 11.9, 12.5):
    add(dt, rangido(.9, 100), .4)
# o suspiro antes do estouro: tudo recua e só fica um fio agudo
t_sil = np.arange(int(.4 * SR)) / SR
add(POP - .42, np.sin(2 * np.pi * 3100 * t_sil) * jan(len(t_sil), .1, .05) * .09, 1)
for dt in (13.15, 13.35, 13.55, 13.72):
    add(dt, tic(3300) * .7, .35, rng.uniform(-.4, .4))
# 5. O ESTOURO
add(POP, grande_pop(), 1.0)
add(POP + .05, hp(ruido(.8), 4000) * env(int(.8 * SR), .002, .2) * .3, 1)
for k in range(10):
    add(POP + .25 + k * .06 + rng.uniform(0, .05), sino(rng.uniform(2000, 4200), .35), .09, rng.uniform(-.8, .8))
add(POP, queda_de_tom(.7, 380, 50), .3)
add(POP + .3, whoosh(.9, 160), .35)
# o coro de pipocas ao fundo, cada vez mais denso
t = POP + .6
while t < SH['coro'] - .15:
    if not (VAPOR - .15 < t < VAPOR + .15):
        add(t, popsom(rng.uniform(600, 1400), .22), rng.uniform(.18, .35), rng.uniform(-.9, .9))
    t += rng.exponential(1.0 / (3 + 5 * min(1, (t - POP) / 5)))
# 6. a casca racha em silêncio; o vapor escapa
s = SH['estalo']
for dt in (.7, 1.3, 1.8):
    add(s + dt, tic(2800) * .5, .12)
add(VAPOR - .02, jato(1.4), .95)
for i in range(10):
    add(VAPOR + .24 * i, sino(520 - 20 * i, .6), .13 * (1 - i / 12), .4)
# 7. a perna de amido empurra e o grão pula
s = SH['pula']
add(s + .15, queda_de_tom(.35, 260, 90), .45)
add(s + .3, whoosh(.6, 400), .5, 0)
add(s + .35, sino(880, .5), .12)
add(s + 1.0, varredura(1.2, 500, 1800), .16, .3)
# queda: assobio descendente e pouso
tt = np.arange(int(1.2 * SR)) / SR
add(s + 1.2, np.sin(np.cumsum(2 * np.pi * (1400 - 700 * tt / 1.2) / SR)) * jan(len(tt), .2, .3) * .05, 1)
add(SH['pouso'], lp(ruido(.35), 400) * env(int(.35 * SR), .004, .09) * 1.2, .8)
add(SH['pouso'] + .02, popsom(300, .2), .35)
# 8. assenta
add(SH['pouso'] + .15, sizzle(.8, .8, .4), .5)
for k in range(3):
    add(SH['pouso'] + .3 + k * .22, borbulha(rng.uniform(250, 500)) * .6, 1, rng.uniform(-.3, .3))
# 9. o coro: as outras pipocas estouram e pulam, cada uma no seu tempo e no seu lado do quadro
for tp, x in zip(POPS_CORO, XS_CORO):
    pan = (x - 540) / 540
    add(tp, popsom(rng.uniform(650, 1250), .22), .62, pan)
    add(tp + .03, lp(ruido(.35), 1600) * env(int(.35 * SR), .004, .1) * .5, 1, pan)
    add(tp + .93, lp(ruido(.18), 500) * env(int(.18 * SR), .003, .05) * 1.1, .28, pan)

mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.1)
mix = mix / max(1e-6, np.abs(mix).max()) * .72
fade = int(.03 * SR)
mix[:fade] *= np.linspace(0, 1, fade)[:, None]
mix[-int(.2 * SR):] *= np.linspace(1, 0, int(.2 * SR))[:, None]
pcm = (mix * 32767).astype('<i2').tobytes()
saida = os.path.join(AQUI, 'pipoca_sfx.mp3')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '160k', saida], input=pcm, check=True)
print('pipoca_sfx.mp3', round(TOTAL, 2), 's')
