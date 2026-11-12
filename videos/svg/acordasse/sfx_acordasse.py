"""Efeitos sonoros do Short "E se você acordasse com 2 cm", todos sintetizados em Python (sem música, sem voz).
Os tempos seguem narr.json e os cortes de acordasse_src.html. Saída: acordasse_sfx.mp3 (estéreo, 44,1 kHz).
Uso:  python3 sfx_acordasse.py   (precisa de numpy, scipy e ffmpeg)"""
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
rng = np.random.default_rng(2)


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
def whoosh(d=.45):
    x = ruido(d)
    t = np.linspace(0, 1, len(x))
    y = sum(bp(x, f0, f0 * 1.6) * np.exp(-((t - c) / .22) ** 2) for f0, c in ((300, .45), (900, .55), (2200, .6)))
    return y / np.abs(y).max()


def clique_metal():
    return parciais(.12, [2400, 3700, 5200], [.02, .015, .01], [1, .6, .4]) + hp(ruido(.12), 3000) * env(int(.12 * SR), .001, .01) * .5


def madeira_toc(f=900):   # madeira batendo (claque oco)
    return parciais(.18, [f, f * 2.3, f * 3.9], [.05, .03, .02], [1, .5, .3]) + bp(ruido(.18), 600, 2500) * env(int(.18 * SR), .001, .015) * .6


def raspar(d=.32):        # lâmina entalhando madeira
    x = bp(ruido(d), 1800, 6000)
    t = np.arange(len(x)) / SR
    grao = 1 + .6 * np.sign(np.sin(2 * np.pi * 38 * t))
    return x * grao * np.sin(np.pi * t / d) ** .7


def pincel(d=.5):
    x = bp(ruido(d), 500, 3500)
    t = np.arange(len(x)) / SR
    return x * np.sin(np.pi * t / d) ** 1.5 * .7


def clang(d=1.6):         # grade de ferro batendo
    f0 = 180
    y = parciais(d, [f0, f0 * 2.76, f0 * 5.4, f0 * 8.93, f0 * 13.3], [.9, .6, .4, .25, .15], [1, .7, .5, .35, .2])
    return y + lp(ruido(d), 500) * env(int(d * SR), .002, .05) * .8


def rolar_grade(d=.7):    # porta de cela correndo no trilho
    x = lp(ruido(d), 900)
    t = np.arange(len(x)) / SR
    return x * (1 + .5 * np.sin(2 * np.pi * 22 * t)) * np.minimum(1, t / .08) * .7


def passo():
    return lp(ruido(.16), 380) * env(int(.16 * SR), .004, .035) * 1.4 + bp(ruido(.16), 1500, 4000) * env(int(.16 * SR), .001, .01) * .3


def chacoalho_metal(d=.5):
    y = np.zeros(int(d * SR))
    for k in range(9):
        c = clique_metal() * rng.uniform(.3, .8)
        i = int(rng.uniform(0, d - .12) * SR)
        y[i:i + len(c)] += c[:len(y) - i]
    return y


def motor(d, rpm0=700, rpm1=2600):
    t = np.arange(int(d * SR)) / SR
    rpm = rpm0 + (rpm1 - rpm0) * (t / d) ** 1.4
    fase = np.cumsum(rpm / 60 * 4 / SR) * 2 * np.pi        # 8 cilindros: 4 explosões por volta
    y = np.sign(np.sin(fase)) * .5 + np.sin(fase * .5) * .5
    y = lp(y, 900) + lp(ruido(d), 300) * .3
    return y


def partida():
    y = np.zeros(int(1.1 * SR))
    for k in range(5):
        c = lp(ruido(.12), 600) * env(int(.12 * SR), .01, .04) * (.7 + .3 * (k % 2))
        i = int(k * .14 * SR)
        y[i:i + len(c)] += c
    return y


def carimbo():
    y = lp(ruido(.3), 220) * env(int(.3 * SR), .002, .06) * 2
    m = madeira_toc(420) * .8
    y[:len(m)] += m
    return y


def papel(d=.4):
    return hp(ruido(d), 2500) * np.sin(np.pi * np.arange(int(d * SR)) / SR / d) * .35


def flash():   # lâmpada de flash dos anos 30: estalo + chiado
    return hp(ruido(.25), 1500) * env(int(.25 * SR), .001, .04) + parciais(.25, [5200], [.03], [.4])


def grilos(d):
    t = np.arange(int(d * SR)) / SR
    return np.sin(2 * np.pi * 4300 * t) * (np.sin(2 * np.pi * 28 * t) > .6) * (np.sin(2 * np.pi * .9 * t) > 0) * .05


def passaros(d):
    y = np.zeros(int(d * SR))
    for k in range(int(d * 3)):
        n = int(rng.uniform(.06, .14) * SR)
        tt = np.arange(n) / SR
        f = rng.uniform(2800, 4200) + 900 * np.sin(2 * np.pi * rng.uniform(15, 30) * tt)
        c = np.sin(np.cumsum(2 * np.pi * f / SR)) * np.sin(np.pi * tt / tt[-1])
        i = int(rng.uniform(0, d - .2) * SR)
        y[i:i + n] += c * .12
    return y


def zumbido(d, f=60):
    t = np.arange(int(d * SR)) / SR
    return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 3 * t)) * .05


def drone(d, f=55):
    t = np.arange(int(d * SR)) / SR
    return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 1.5 * t)) * np.sin(np.pi * t / d) * .12


def impacto():
    return lp(ruido(.8), 120) * env(int(.8 * SR), .002, .25) * 2.5



# ---------------------------------------------------------------- sons do mundo gigante
def ronrono(d, f=26):
    t = np.arange(int(d * SR)) / SR
    am = (.55 + .45 * np.sin(2 * np.pi * f * t)) * (.6 + .4 * np.sin(2 * np.pi * .45 * t) ** 2)
    return lp(ruido(d), 260) * am * 1.6


def fungada():
    x = bp(ruido(.35), 1200, 5000)
    return x * np.sin(np.pi * np.arange(len(x)) / len(x)) * .8


def baque_fofo():
    return lp(ruido(.5), 160) * env(int(.5 * SR), .01, .12) * 2.2


def passinho():
    return bp(ruido(.05), 3000, 9000) * env(int(.05 * SR), .001, .01) * .8


def vento(d):
    x = bp(ruido(d), 300, 1600)
    t = np.arange(len(x)) / SR
    return x * (.6 + .4 * np.sin(2 * np.pi * .7 * t)) * np.minimum(1, t / .3) * np.minimum(1, (d - t) / .3)


def puf():
    return lp(ruido(.3), 400) * env(int(.3 * SR), .004, .06) * 1.5


def guincho():
    t = np.arange(int(.18 * SR)) / SR
    f = 3800 + 900 * np.sin(2 * np.pi * 9 * t)
    return np.sin(np.cumsum(2 * np.pi * f / SR)) * np.sin(np.pi * t / t[-1]) * .5


def plic(f=900):
    t = np.arange(int(.25 * SR)) / SR
    fr = f * (1 + 1.5 * np.exp(-t / .03))
    return np.sin(np.cumsum(2 * np.pi * fr / SR)) * np.exp(-t / .06)


def gluglu(d):
    y = np.zeros(int(d * SR))
    for k in range(int(d * 9)):
        p = plic(rng.uniform(300, 700)) * rng.uniform(.2, .6)
        i = int(rng.uniform(0, d - .26) * SR)
        y[i:i + len(p)] += p
    return y + lp(ruido(d), 500) * .15


def dentes(d):
    y = np.zeros(int(d * SR))
    for k in range(int(d * 14)):
        c = bp(ruido(.02), 2500, 7000) * env(int(.02 * SR), .001, .004)
        i = int(k / 14 * SR)
        y[i:i + len(c)] += c[:len(y) - i] * rng.uniform(.4, 1)
    return y


def barriga(d=1.2):
    t = np.arange(int(d * SR)) / SR
    f = 90 + 40 * np.sin(2 * np.pi * 1.3 * t) + 25 * np.sin(2 * np.pi * 7 * t)
    return lp(np.sin(np.cumsum(2 * np.pi * f / SR)) * (1 + .5 * ruido(d) * .2), 400) * np.sin(np.pi * t / d) * .9


def bipe(f=2400, d=.12):
    t = np.arange(int(d * SR)) / SR
    return np.sin(2 * np.pi * f * t) * np.minimum(1, (d - t) / .01) * .5


def arrasto(d):
    x = bp(ruido(d), 400, 2500)
    t = np.arange(len(x)) / SR
    return x * (.6 + .4 * np.abs(np.sin(2 * np.pi * 1.6 * t)))


cortes = [T['b2'] - .1, T['b3'] - .1, T['b4'] - .1, T['b5'] - .1, T['b6'] - .1, T['b7'] - .1, T['b8'] - .1, T['b8'] + 3.1]
for c in cortes:
    add(c - .3, whoosh(), .3)
# 1. gancho: ronronado alto, fungada, tremidinha
s = 0
add(s, ronrono(T['b2'] - .1), .9)
add(s + 1.2, fungada(), .5, .2)
add(s + .4, dentes(1.0), .25, -.3)
# 2. a pata: fungada, passinhos fugindo, baque fofo no travesseiro
s = T['b2'] - .1
add(s, ronrono(T['b3'] - .1 - s) * np.linspace(1, .4, int((T['b3'] - .1 - s) * SR)), .6)
add(s + .6, fungada(), .5)
for k in range(9):
    add(s + 1.6 + k * .08, passinho(), .5, -.3)
add(s + 2.0, baque_fofo(), 1.0)
# 3. corre e pula da cama
s = T['b3'] - .1
for k in range(22):
    add(s + .3 + k * .085, passinho(), .5, .2)
add(s + 2.2, whoosh(.6), .5)
# 4. a queda: vento, guincho do rato, puf no tapete, rato saindo correndo
s = T['b4'] - .1
add(s, vento(4.5), .7)
add(s + 1.0, guincho(), .5, .4)
add(s + 4.3, puf(), 1.0)
add(s + 4.35, puf() * .5, .6, .4)
add(s + 5.1, guincho(), .6, .5)
for k in range(10):
    add(s + 5.3 + k * .07, passinho() * .6, .5, .6)
# 5. a gota: pingo caindo, plic, a água subindo e puxando
s = T['b5'] - .1
add(s + .9, plic(1100), .9)
add(s + 1.7, plic(600), .6)
add(s + 2.2, gluglu(3.4), .7)
# 6. frio e fome: bipe da balança, dentes batendo, barriga roncando
s = T['b6'] - .1
add(s + .3, bipe(), .7)
add(s + .45, bipe(), .7)
add(s + .6, dentes(5.2), .45)
add(s + 3.4, barriga(), 1.0)
# 7. a migalha: arrasto, passinhos, formiga
s = T['b7'] - .1
add(s + .2, arrasto(T['b8'] - .3 - s), .45)
for k in range(30):
    add(s + .3 + k * .14, passinho(), .4, -.2)
# 8. o ronronado chega por trás e a volta ao gancho
s = T['b8'] - .1
x = ronrono(TOTAL - s)
add(s, x * np.minimum(1, np.linspace(0, 2.2, len(x))), 1.0)
add(s + 2.2, whoosh(.4), .4)
add(s + 3.4, fungada(), .5)

mix = np.stack([L, R], 1)
mix = mix / max(1e-6, np.abs(mix).max()) * .89
fade = int(.03 * SR)
mix[:fade] *= np.linspace(0, 1, fade)[:, None]
pcm = (mix * 32767).astype('<i2').tobytes()
saida = os.path.join(AQUI, 'acordasse_sfx.mp3')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '160k', saida], input=pcm, check=True)
print('acordasse_sfx.mp3', round(TOTAL, 2), 's')
