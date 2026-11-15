"""Efeitos sonoros das duas cenas do carro em primeira pessoa, todos sintetizados em Python (sem música, sem voz).
  python3 sfx_carro.py cratera   -> cena_cratera_sfx.mp3   (o que NÃO aconteceu: a pista abre e o carro fica preso)
  python3 sfx_carro.py ponte     -> cena_ponte_sfx.mp3     (como acontece: o chão desliza de lado e a ponte quebra)
Os tempos seguem _cratera.js e _ponte.js (estalo, freada, batidas, pedaços caindo). Precisa de numpy, scipy e ffmpeg."""
import json
import math
import os
import subprocess
import sys
import numpy as np
from scipy.signal import butter, sosfilt

AQUI = os.path.dirname(os.path.abspath(__file__))
NOME = sys.argv[1]
SR = 44100
TOTAL = json.load(open(os.path.join(AQUI, f'narr_{NOME}.json')))['total']
N = int(SR * TOTAL)
L, R = np.zeros(N), np.zeros(N)
rng = np.random.default_rng(31337 + len(NOME))


def hh(i, s=0):                                         # o mesmo hash da arte (para sincronizar com os pedaços e torrões)
    x = math.sin(i * 127.1 + s * 311.7 + 17.3) * 43758.5453
    return x - math.floor(x)
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def ruido(d): return rng.standard_normal(int(d * SR))
def tt(d): return np.arange(int(d * SR)) / SR
def env(n, a=.005, r=.1, forma=1.0):
    t = np.arange(n) / SR
    return (np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(r, 1e-4))) ** forma
def jan(n, a=.05, b=.1):
    t = np.arange(n) / SR
    d = n / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.minimum(1, (d - t) / max(b, 1e-4))
def rg(t, a, b): return min(1, max(0, (t - a) / (b - a)))
def e_out(x): return 1 - (1 - min(1, max(0, x))) ** 3


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
def crack(d=.09, brilho=1500):
    x = hp(ruido(d), brilho) * env(int(d * SR), .0008, d / 5)
    x[:40] += np.linspace(1, 0, 40) * 2.2
    return x / np.abs(x).max()
def boom(d=1.6, f0=42, queda=2.2):
    t = tt(d)
    f = f0 * (1 + (queda - 1) * np.exp(-t / .09))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .004, d / 3.2) + lp(ruido(d), 160) * env(len(t), .004, d / 4) * .9
    return x / np.abs(x).max()
def ronco(d, f=110, a=.3, r=None):
    x = lp(ruido(d), f)
    x *= (1 + .35 * np.sin(2 * np.pi * 2.6 * tt(d) + rng.uniform(0, 6)))
    return x / np.abs(x).max() * jan(int(d * SR), a, r if r else d * .4)
def trituracao(d, lo=160, hi=900, mod=19):
    x = bp(ruido(d), lo, hi)
    t = tt(d)
    x *= np.clip(.55 + .45 * np.sin(2 * np.pi * mod * t + 3 * np.sin(2 * np.pi * 1.7 * t)), 0, 1)
    return x / np.abs(x).max()
def rangido(d, f0=330, vib=7):
    t = tt(d)
    jit = lp(ruido(d), 14) * 14
    f = f0 * (1 + .06 * np.sin(2 * np.pi * vib * t) + .02 * jit)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sin(ph) + .5 * np.sin(2 * ph + 1) + .25 * np.sin(3 * ph)) * (.6 + .4 * np.sin(2 * np.pi * 3.1 * t + 1.3)) + .25 * bp(ruido(d), 500, 1800)
    return x / np.abs(x).max() * jan(len(t), d * .2, d * .35)
def tique(f=1700, d=.03):
    t = tt(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t / (d / 4))
def beep(f=1200, d=.14):
    t = tt(d)
    return np.sin(2 * np.pi * f * t) * jan(len(t), .006, .06)
def whoosh(d=.4, f0=250):
    x = ruido(d)
    t = np.linspace(0, 1, len(x))
    y = sum(bp(x, f * f0 / 250, f * f0 / 250 * 1.6) * np.exp(-((t - c) / .22) ** 2) for f, c in ((250, .45), (700, .55), (1800, .6)))
    return y / np.abs(y).max()
def poeira(d):
    return hp(ruido(d), 2500) * jan(int(d * SR), d * .15, d * .7)
def chocalho(d, dens=60, f=(900, 3200)):
    x = np.zeros(int(d * SR))
    for _ in range(int(d * dens)):
        i = int(rng.uniform(0, d - .02) * SR)
        c = bp(ruido(.012), f[0], f[1]) * np.exp(-np.arange(int(.012 * SR)) / (SR * .003)) * rng.uniform(.2, 1)
        x[i:i + len(c)] += c
    return x / max(1e-9, np.abs(x).max())
def metal(d=.5, f=(180, 5000)):                         # amassado de lata: ruído de banda larga com ressonâncias
    x = bp(ruido(d), f[0], f[1]) * env(int(d * SR), .002, d / 4)
    t = tt(d)
    for fr, a in ((310, .6), (520, .4), (880, .3), (1310, .2)):
        x += a * np.sin(2 * np.pi * fr * t * (1 - .1 * t)) * np.exp(-t / (d / 3))
    return x / np.abs(x).max()
def vidro(d=.7):                                        # vidro trincando: estalos agudos e tinidos
    x = hp(ruido(d), 3500) * env(int(d * SR), .001, d / 6)
    t = tt(d)
    for fr in (2900, 4300, 5600):
        x += .25 * np.sin(2 * np.pi * fr * t) * np.exp(-t / (d / 5))
    for _ in range(14):
        i = int(rng.uniform(0, d * .7) * SR)
        c = hp(ruido(.01), 5000) * np.exp(-np.arange(int(.01 * SR)) / (SR * .002))
        x[i:i + len(c)] += c * rng.uniform(.3, 1)
    return x / np.abs(x).max()
def agua(d=.5):
    return bp(ruido(d), 800, 4500) * env(int(d * SR), .005, d / 3)


def curva(fn, t0, t1, passo=.01):
    ts = np.arange(t0, t1, passo)
    return np.interp(np.arange(int((t1 - t0) * SR)) / SR + t0, ts, [fn(t) for t in ts])


def motor(t0, t1, kmh, g=.3, gate=None):
    """motor: harmônicos da frequência de ignição (sobe com a velocidade) + rodagem e vento"""
    v = curva(kmh, t0, t1)
    f = 26 + .85 * v
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(k * ph + k) / k ** 1.1 for k in range(1, 9)) * (.85 + .15 * np.sin(ph / 2 + 1))
    x = lp(x, 1400)
    x = x / np.abs(x).max() * g
    x += lp(ruido(t1 - t0), 400) * (.05 + .0016 * v) + hp(ruido(t1 - t0), 3000) * .0006 * v
    if gate is not None:
        x = x * gate
    return x


def freio(t0, t1, kmh, g=.3):
    """pneus cantando: tom que cai com a velocidade, vibrato, pulsos do ABS e chiado"""
    v = curva(kmh, t0, t1)
    n = len(v)
    t = np.arange(n) / SR + t0
    f = 780 + 16 * v
    ph = 2 * np.pi * np.cumsum(f * (1 + .035 * np.sin(2 * np.pi * 11 * t))) / SR
    x = np.sin(ph) + .5 * np.sin(2 * ph) + .6 * bp(ruido(t1 - t0), 1300, 3600)
    amp = np.clip(v / 40, 0, 1) ** .7 * (.65 + .35 * (np.sin(2 * np.pi * 15 * t) > 0))
    return x / np.abs(x).max() * amp * g * jan(n, .04, .15)


# =============================================================== CENA 1: a pista abre em cratera e o carro fica preso
def cratera():
    T_E, T_W, T_I = 1.6, 2.05, 2.4

    def kmh(t):
        return 3.6 * (20 if t < .5 else 20 - 7.2 * (t - .5)) if t < T_E else 3.6 * (20 - 7.2 * (T_E - .5)) * (1 - e_out(rg(t, T_E, T_I)))

    def shakeW(t):
        a = 6 * rg(t, 0, .3) * (1 - rg(t, 1.9, 2.2)) + 12 * rg(t, .9, 1.4) * (1 - rg(t, 1.9, 2.2))
        if t >= T_W: a += 34 * math.exp(-(t - T_W) / .22)
        if t >= T_I: a += 46 * math.exp(-(t - T_I) / .26)
        return a
    # motor (some quando o carro cai e depois falha e morre)
    gate = np.ones(int((3.4) * SR))
    for i in range(len(gate)):
        t = i / SR
        if t > T_I: gate[i] = max(0, 1 - rg(t, T_I + .1, 1.0)) * (1 if (int(t * 9) % 3) else .25) * (1 - rg(t, 2.9, 3.3))
    add(0, motor(0, 3.4, kmh, .26, gate), 1.0)
    # o chão tremendo: ronco, chacoalhar da lataria, estalos
    add(0, ronco(2.4, 90, .1, 1.0), .7)
    for t in np.arange(0.0, 2.2, .045):
        a = shakeW(t) / 46
        add(t + rng.uniform(0, .02), tique(rng.uniform(700, 2400), .015), a * .55 * rng.uniform(.3, 1), rng.uniform(-.6, .6))
    add(.02, crack(.14, 1200), .85); add(.02, boom(1.6, 44, 2.4), .8)                   # a pista racha à frente
    add(.1, trituracao(1.2, 180, 900, 21) * jan(int(1.2 * SR), .02, 1.0), .3)
    add(.5, whoosh(.5, 180), .18)
    # freada
    add(.5, freio(.5, 1.75, kmh, .34), 1.0)
    add(.5, boom(.3, 70, 1.4), .3)
    # a borda desaba em direção ao carro
    add(.9, boom(1.4, 38, 2.6), .9); add(.9, ronco(1.8, 140, .05, 1.2), .85)
    add(.92, trituracao(1.2, 140, 1100, 17) * jan(int(1.2 * SR), .02, .9), .55); add(.95, chocalho(1.2, 90), .5)
    add(1.0, crack(.1, 1000), .7); add(1.15, crack(.08, 1500), .6)
    add(T_E, whoosh(.5, 120) * np.linspace(1, .2, int(.5 * SR)), .55)                   # passa da borda: o estômago sobe
    add(T_E, ronco(.5, 60, .1, .3) * .0, 0)
    # primeira batida (parede de lá) e segunda (fundo)
    add(T_W, boom(1.4, 40, 2.8), 1.0); add(T_W, metal(.55), .95); add(T_W, crack(.08, 1200), .7); add(T_W + .005, vidro(.8), .8)
    add(T_W, chocalho(.8, 80), .5)
    add(T_I, boom(2.0, 34, 3.0), 1.0); add(T_I, metal(.7, (150, 4500)), 1.0); add(T_I, crack(.1, 900), .8); add(T_I + .01, vidro(.9), .95)
    add(T_I, ronco(2.2, 100, .03, 1.5), .8); add(T_I + .05, chocalho(1.2, 90, (500, 2500)), .5)
    add(T_I, hp(ruido(.5), 2000) * env(int(.5 * SR), .003, .12), .3)
    # depois: poeira, torrões, vapor, rangidos
    add(T_I + .1, poeira(2.4), .22)
    for i in range(30):                                                                 # torrões caindo (mesmos tempos da imagem)
        tb = T_W + .15 + 1.9 * hh(i, 71)
        add(tb + .55, boom(.14, 90 + 40 * hh(i, 72), 1.3) * (.25 + .5 * hh(i, 74)), .4, rng.uniform(-.5, .5))
    add(T_I + .3, hp(ruido(3.0), 3500) * jan(int(3.0 * SR), .5, 1.2), .1)                # vapor
    add(T_I + .3, rangido(1.6, 150, 3), .24); add(3.2, rangido(1.6, 210, 4), .2)
    for t in np.arange(2.6, 5.2, .22):
        add(t + rng.uniform(0, .1), tique(rng.uniform(500, 1500), .03), rng.uniform(.04, .1), rng.uniform(-.5, .5))
    add(3.3, beep(880, .12), .2); add(3.45, beep(660, .12), .2); add(4.1, beep(880, .12), .16); add(4.25, beep(660, .12), .16)
    add(3.6, lp(ruido(2.2), 600) * jan(int(2.2 * SR), .8, .8), .06)


# =============================================================== CENA 2: o chão desliza de lado e a ponte quebra
def ponte():
    T_B, T_STOP = .12, 2.05

    def kmh(t):
        return 3.6 * (12 if t < .45 else max(0, 12 - 7.5 * (t - .45))) if t < T_STOP else 0

    def shakeW(t):
        a = 7 * rg(t, 0, .2) * (1 - rg(t, 1.3, 2.4)) + 20 * math.exp(-abs(t - T_B - .1) / .25)
        return a
    add(0, motor(0, TOTAL, kmh, .24), 1.0)
    add(0, ronco(2.6, 80, .05, 1.2), .65)
    for t in np.arange(0.0, 2.4, .05):
        a = shakeW(t) / 27
        add(t + rng.uniform(0, .02), tique(rng.uniform(600, 2200), .015), a * .5 * rng.uniform(.3, 1), rng.uniform(-.6, .6))
    # a quebra do tabuleiro
    add(T_B, crack(.16, 1000), .9); add(T_B, boom(2.4, 36, 2.8), 1.0); add(T_B + .01, metal(.9, (120, 3500)), .8)
    add(T_B + .05, ronco(2.6, 120, .03, 1.6), .85)
    add(T_B + .1, trituracao(1.4, 140, 1000, 14) * jan(int(1.4 * SR), .02, 1.0), .5); add(T_B + .1, chocalho(1.4, 80), .45)
    add(T_B + .2, rangido(1.4, 420, 6), .3); add(T_B + .5, rangido(1.0, 900, 9), .2)      # guarda-corpos de aço entortando
    add(T_B + .35, crack(.1, 1400), .6); add(.9, crack(.12, 800), .6)
    add(T_B + .05, poeira(2.2), .22)
    # pedaços de concreto caindo e respingos no rio (mesmos tempos da imagem)
    for i in range(22):
        tb = T_B + .1 + 1.8 * hh(i, 301) + (1.4 if i > 14 else 0)
        y0 = .2 - .5 * hh(i, 304)
        add(tb, tique(rng.uniform(600, 1300), .03), .12, rng.uniform(-.5, .5))
        add(tb + math.sqrt((y0 + 6.9) / 4.9), agua(.5) * (.4 + .5 * hh(i, 305)), .28, rng.uniform(-.6, .6))
    # freada
    add(.45, freio(.45, 2.15, kmh, .32), 1.0)
    add(.45, boom(.3, 70, 1.4), .25)
    # parado na beira: a estrutura ainda cede
    add(2.1, ronco(3.0, 70, .5, 1.4), .45)
    add(2.2, rangido(2.2, 130, 2.5), .26); add(3.3, rangido(1.8, 170, 3), .22); add(4.2, rangido(1.0, 260, 5), .16)
    for t in np.arange(2.3, 5.1, .26):
        add(t + rng.uniform(0, .1), tique(rng.uniform(500, 1300), .03), rng.uniform(.04, .1), rng.uniform(-.5, .5))
    add(3.8, boom(.5, 70, 1.6), .35); add(3.8, chocalho(.5, 60), .25)                    # uma lasca grande se solta
    add(2.4, lp(ruido(2.8), 700) * jan(int(2.8 * SR), .8, .8), .07)                      # vento no vale
    for k in range(6):                                                                  # pisca-alerta: tic-tac
        add(2.5 + k * .5, tique(2100, .02), .22); add(2.75 + k * .5, tique(1600, .02), .18)


{'cratera': cratera, 'ponte': ponte}[NOME]()

mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
mix = mix / np.abs(mix).max() * .72
mix[:int(.004 * SR)] *= np.linspace(0, 1, int(.004 * SR))[:, None]
mix[-int(.15 * SR):] *= np.linspace(1, 0, int(.15 * SR))[:, None]
raw = os.path.join(AQUI, '_tmp_sfx.f32')
mix.astype(np.float32).tofile(raw)
saida = os.path.join(AQUI, f'cena_{NOME}_sfx.mp3')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', raw, '-c:a', 'libmp3lame', '-b:a', '160k', saida], check=True)
os.remove(raw)
print('ok', saida, TOTAL, 's')
