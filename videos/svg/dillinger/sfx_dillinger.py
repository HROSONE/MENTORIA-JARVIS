"""Efeitos sonoros do Short "A arma de madeira", todos sintetizados em Python (sem música, sem voz).
Os tempos seguem narr.json e os cortes de dillinger_src.html. Saída: dillinger_sfx.mp3 (estéreo, 44,1 kHz).
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
rng = np.random.default_rng(1934)


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


# ---------------------------------------------------------------- linha do tempo
cortes = [T['b2'] - .1, T['b3'] - .1, T['b4'] - .1, T['b5'] - .1, T['b5'] + 3.3, T['b6'] - .1, T['b6'] + 2.3, T['b7'] - .1, T['b8'] - .1]
for c in cortes:
    add(c - .3, whoosh(), .35)

# 1. gancho: zumbido das lâmpadas, engatilha, guarda tremendo (chaves), lasca de graxa
s = 0
add(s, zumbido(T['b2'] - .1), .8)
add(s + .15, clique_metal(), .9, .2)
add(s + .9, chacoalho_metal(1.2), .25, -.4)
add(s + 2.75, madeira_toc(1400), .5, .3)
add(s, drone(T['b2'] - .1, 49), .9)
# 2. cadeia por fora: vento, passarinhos, faixa balançando; batida no zoom da janela
s = T['b2'] - .1
add(s, lp(ruido(T['b3'] - s), 400) * .15, 1)
add(s + .3, passaros(T['b3'] - s - .5), 1)
add(s + 4.2, impacto(), .5)
# 3. entalhando e pintando
s = T['b3'] - .1
add(s + .15, madeira_toc(1800) * .4, .8, .5)            # tampa da lata
d3 = T['b4'] - .1 - s
for k in range(7):
    add(s + .2 + k * .45, raspar(.3), .45, -.2 + .05 * k)
for k in range(4):
    add(s + d3 * .6 + k * .5, pincel(.45), .5, .2)
# 4. aponta: clique, impacto no zoom, chaves do guarda tremendo
s = T['b4'] - .1
add(s + .3, clique_metal(), .8, .3)
add(s + 1.0, impacto(), .7)
add(s + 1.2, chacoalho_metal(1.6), .3, -.2)
add(s, zumbido(T['b5'] - s), .6)
# 5. tranca os guardas, larga a arma de madeira, leva as metralhadoras
s = T['b5'] - .1
add(s, rolar_grade(.7), .8)
add(s + .7, clang(), .7)
for k in range(6):
    add(s + 1.0 + k * .38, passo(), .5, -.4 + k * .15)
for k, (dt, g) in enumerate(((1.9, .9), (2.15, .5), (2.32, .3))):
    add(s + dt, madeira_toc(950 - k * 40), g, .1)
add(s + 1.1, chacoalho_metal(.8), .3, .2)
# 6. carro da xerife: partida, motor acelerando
s = T['b5'] + 3.3
add(s + .1, partida(), .6)
add(s + .7, motor(T['b6'] - .1 - s - .5), .45, -.3)
# 7. estrada ao entardecer (motor indo embora, grilos) e o carimbo PROCURADO
s = T['b6'] - .1
x = motor(2.4, 2600, 2300)
add(s, x * np.linspace(1, .1, len(x)), .4)
add(s, grilos(2.4), 1)
add(s + 2.4 + .1, papel(), .8)
add(s + 2.4 + .5, carimbo(), .9)
# 8. cinema: letreiro zumbindo, cidade à noite, flashes e o chapéu caindo
s = T['b7'] - .1
add(s, zumbido(T['b8'] - .1 - s, 120), .7)
add(s, lp(ruido(T['b8'] - .1 - s), 700) * .12, 1)
for k in range(4):
    add(s + .1 + k * .35, passo() * .7, .5)
for ft in (1.25, 1.45, 1.6):
    add(s + ft, flash(), .7, -.5)
add(s + 1.4 + .72, lp(ruido(.25), 500) * env(int(.25 * SR), .003, .05), .6)    # chapéu no chão
# 9. silêncio com o foco de luz; no fim, o mesmo clique do começo (loop)
s = T['b8'] - .1
add(s, drone(TOTAL - s, 41), 1.2)
add(s + .2, madeira_toc(700) * .5, .4)
add(TOTAL - .25, clique_metal(), .5, .2)

mix = np.stack([L, R], 1)
mix = mix / max(1e-6, np.abs(mix).max()) * .89
fade = int(.03 * SR)
mix[:fade] *= np.linspace(0, 1, fade)[:, None]
pcm = (mix * 32767).astype('<i2').tobytes()
saida = os.path.join(AQUI, 'dillinger_sfx.mp3')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '160k', saida], input=pcm, check=True)
print('dillinger_sfx.mp3', round(TOTAL, 2), 's')
