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


def tique():
    return parciais(.05, [3200, 5100], [.008, .005], [1, .5])


def bipe_alarme(d):
    y = np.zeros(int(d * SR))
    for k in range(int(d / .25)):
        if k % 4 == 3:
            continue
        b = bipe(3100, .09)
        i = int(k * .25 * SR)
        y[i:i + len(b)] += b[:len(y) - i]
    return y


def coracao(d, bpm=150):
    y = np.zeros(int(d * SR))
    for k in range(int(d * bpm / 60)):
        for dt, g in ((0, 1), (.12, .6)):
            c = lp(ruido(.12), 90) * env(int(.12 * SR), .005, .03) * g * 2
            i = int((k * 60 / bpm + dt) * SR)
            y[i:i + len(c)] += c[:len(y) - i] if i < len(y) else 0
    return y


def crocante():
    return bp(ruido(.09), 1500, 6000) * env(int(.09 * SR), .001, .02) * 1.2


def respiro(d):
    t = np.arange(int(d * SR)) / SR
    return lp(ruido(d), 700) * (np.sin(2 * np.pi * .4 * t) ** 2) * .5


# cortes dos planos (iguais a _cenas.js)
CORTES = [1.65, 2.75, T['b2'] - .1, 5.1, 6.5, 7.9, T['b3'] - .1, 11.0, 12.4, T['b4'] - .1, 17.7, T['b5'] - .1, 23.5, T['b6'] - .1, 29.2, T['b7'] - .1, 35.1, T['b8'] - .1, 40.1]
for c in CORTES:
    add(c - .25, whoosh(.4), .22)
# noite: tique-taque e respiração; manhã: passarinhos
for k in range(4):
    add(.1 + k * .5, tique(), .35, .5)
add(0, respiro(1.65), .6)
add(1.65, passaros(1.1), 1)
# acorda: despertador tocando
add(2.75, bipe_alarme(T['b2'] - .1 - 2.75), .7, .4)
# olho do gato, focinho farejando, sombra e pata
s0 = T['b2'] - .1
add(s0, ronrono(1.4), .9)
add(5.1, fungada(), .7)
add(5.6, fungada(), .6)
add(6.5, ronrono(1.4), .6)
add(6.5, impacto() * .4, .5)
add(7.9 + .45, baque_fofo(), 1.1)
add(7.9 + .5, puf() * .6, .5)
for k in range(5):
    add(7.9 + .35 + k * .07, passinho(), .5, -.3)
# corre, beira da cama (vertigem e coração), pulo
for k in range(18):
    add(T['b3'] - .1 + .1 + k * .085, passinho(), .5, .2)
add(11.0, vento(1.4) * .5, .6)
add(11.0, coracao(1.4), .8)
add(12.4 + .25, whoosh(.6), .5)
# queda e pouso
s4 = T['b4'] - .1
add(s4, vento(4.3), .7)
add(s4 + 1.0, guincho(), .5, .4)
add(s4 + 4.25, puf(), 1.0)
add(s4 + 4.3, puf() * .5, .6, .4)
add(s4 + 5.15, guincho(), .6, .5)
for k in range(10):
    add(s4 + 5.3 + k * .07, passinho() * .6, .5, .6)
# sede: pingo na poça, passos, encosta; preso: a água gruda
s5 = T['b5'] - .1
add(s5 + .8, plic(1100), .9)
for k in range(10):
    add(s5 + .35 + k * .16, passinho(), .4)
add(s5 + 1.95, plic(500), .6)
add(s5 + 2.4, gluglu(3.6), .7)
# balança: bipes; frio: dentes e barriga
s6 = T['b6'] - .1
add(s6 + .25, bipe(), .7)
add(s6 + .4, bipe(), .7)
add(29.2, dentes(3.6), .45)
add(29.2 + 1.6, barriga(), 1.0)
# cozinha: correndo; biscoito: arrasto
for k in range(20):
    add(T['b7'] - .1 + .4 + k * .085, passinho(), .45, -.1)
add(35.2, arrasto(T['b8'] - .3 - 35.2), .45)
# sombra2: mastigando o biscoito, o ronronado chegando, susto; gato: de volta
s8 = T['b8'] - .1
for k in range(9):
    add(s8 + .1 + k * .19, crocante(), .6, .1)
x = ronrono(TOTAL - s8)
add(s8, x * np.minimum(1, np.linspace(0, 2.0, len(x))), 1.0)
add(s8 + 1.85, whoosh(.4), .5)
add(40.1 + .4, fungada(), .5)

mix = np.stack([L, R], 1)
mix = mix / max(1e-6, np.abs(mix).max()) * .89
fade = int(.03 * SR)
mix[:fade] *= np.linspace(0, 1, fade)[:, None]
pcm = (mix * 32767).astype('<i2').tobytes()
saida = os.path.join(AQUI, 'acordasse_sfx.mp3')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '160k', saida], input=pcm, check=True)
print('acordasse_sfx.mp3', round(TOTAL, 2), 's')
