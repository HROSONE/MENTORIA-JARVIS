"""Efeitos sonoros do Short "E se todo mundo pulasse?" (numpy, sem música), sincronizados por planos.json.
Uso: python3 sfx_pulo.py [saida.wav]  (gera também <saida>_para_voz.wav)"""
import json
import os
import sys
import wave
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
SR = 44100
rng = np.random.default_rng(11)
J = json.load(open(os.path.join(AQUI, 'planos.json')))
TOTAL = J['total']
P = {p['id']: p for p in J['planos']}
N = int((TOTAL + 1.0) * SR)
L = np.zeros(N)
R = np.zeros(N)


def t0(id, off=0.0):
    return P[id]['t0'] + off


# ------------------------------------------------------------------ utilidades
def T(d):
    return np.arange(int(d * SR)) / SR


def ruido(d):
    return rng.standard_normal(int(d * SR))


def filtro(x, lo=None, hi=None, ordem=2):
    """filtro de magnitude (fase zero) por FFT: passa-alta em `lo`, passa-baixa em `hi`"""
    n = len(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    H = np.ones_like(f)
    if hi:
        H = H / np.sqrt(1 + (f / hi) ** (2 * ordem))
    if lo:
        H = H / np.sqrt(1 + (lo / np.maximum(f, 1e-6)) ** (2 * ordem))
    return np.fft.irfft(np.fft.rfft(x) * H, n)


def banda(x, f1, f2, ordem=2):
    return filtro(x, lo=f1, hi=f2, ordem=ordem)


def ad(n, a=0.005, d=0.2, forma=3.0):
    """envelope: ataque `a`, decaimento exponencial com constante `d`"""
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-6), np.exp(-(t - a) / max(d, 1e-6)))
    return e


def add(sig, t, g=1.0, pan=0.0):
    i = int(max(t, 0) * SR)
    if i >= N:
        return
    sig = sig[:max(0, N - i)] * g
    pl, pr = np.sqrt((1 - pan) / 2) * 1.4142, np.sqrt((1 + pan) / 2) * 1.4142
    L[i:i + len(sig)] += sig * pl
    R[i:i + len(sig)] += sig * pr


def addst(sl, sr_, t, g=1.0):
    i = int(max(t, 0) * SR)
    if i >= N:
        return
    n = min(len(sl), N - i)
    L[i:i + n] += sl[:n] * g
    R[i:i + n] += sr_[:n] * g


def somar(*xs):
    n = max(len(x) for x in xs)
    out = np.zeros(n)
    for x in xs:
        out[:len(x)] += x
    return out


def norm(x, pico=1.0):
    m = np.abs(x).max()
    return x * (pico / m) if m > 1e-9 else x


# ------------------------------------------------------------------ sons básicos
def tom(f, d, parciais=((1, 1.0),), decai=1.0, ataque=0.003):
    t = T(d)
    s = sum(a * np.sin(2 * np.pi * f * k * t + rng.uniform(0, 6.28)) * np.exp(-t / (decai / (1 + 0.6 * (k - 1)))) for k, a in parciais)
    return s * np.minimum(t / ataque, 1.0)


def batida_grave(f0=70, f1=38, d=0.5, decai=0.18):
    t = T(d)
    fr = f1 + (f0 - f1) * np.exp(-t * 14)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / decai)


def passo(sup='grama', forca=1.0):
    if sup == 'grama':
        x = filtro(ruido(0.14), hi=900) * ad(int(0.14 * SR), 0.006, 0.035)
        return somar(x, 0.5 * batida_grave(110, 60, 0.12, 0.04)) * forca
    if sup == 'concreto':
        x = banda(ruido(0.1), 700, 4200) * ad(int(0.1 * SR), 0.002, 0.018)
        return somar(x, 0.4 * batida_grave(150, 70, 0.1, 0.03)) * forca
    if sup == 'madeira':
        return somar(batida_grave(130, 55, 0.2, 0.07), 0.4 * banda(ruido(0.12), 200, 1500) * ad(int(0.12 * SR), 0.003, 0.03)) * forca
    if sup == 'cascalho':
        n = int(0.18 * SR)
        x = np.zeros(n)
        for k in range(rng.integers(5, 9)):
            i = int(rng.uniform(0, 0.12) * SR)
            m = min(int(0.02 * SR), n - i)
            x[i:i + m] += banda(ruido(0.02), 1500, 7000)[:m] * np.exp(-np.arange(m) / (0.006 * SR)) * rng.uniform(0.4, 1)
        return somar(x, 0.35 * batida_grave(120, 70, 0.14, 0.05)) * forca
    raise ValueError(sup)


def whoosh(d, f0=300, f1=3000, curva=1.0):
    t = T(d)
    x = ruido(d)
    # varre a banda: soma de duas bandas cruzadas
    a = banda(x, f0, f0 * 2.2)
    b = banda(x, f1 * 0.5, f1)
    k = (t / d) ** curva
    s = a * (1 - k) + b * k
    return s * np.sin(np.pi * t / d) ** 1.5


def porta_batendo():
    return somar(batida_grave(95, 48, 0.4, 0.09) * 0.9, banda(ruido(0.5), 500, 3500) * ad(int(0.5 * SR), 0.002, 0.03) * 0.8, tom(1800, 0.3, ((1, 0.3), (2.7, 0.2)), 0.05) * 0.5)


def vidro(d=0.9):
    n = int(d * SR)
    x = np.zeros(n)
    for k in range(70):
        i = int(abs(rng.exponential(0.18)) * SR)
        if i >= n - 400:
            continue
        m = int(rng.uniform(0.004, 0.02) * SR)
        x[i:i + m] += banda(ruido(0.02), 2500, 12000)[:m] * np.exp(-np.arange(m) / (0.003 * SR)) * rng.uniform(0.2, 1.0)
    return x


def metal_amassando(d=0.5, forca=1.0):
    n = int(d * SR)
    x = np.zeros(n)
    for k in range(18):
        i = int(abs(rng.exponential(0.07)) * SR)
        if i >= n - 2000:
            continue
        m = int(rng.uniform(0.02, 0.09) * SR)
        f = rng.uniform(400, 3600)
        seg = banda(ruido(0.1), f, f * 1.6)[:m]
        x[i:i + m] += seg * np.exp(-np.arange(m) / (0.02 * SR)) * rng.uniform(0.3, 1)
    x += tom(rng.uniform(200, 300), d, ((1, 0.5), (2.3, 0.3), (3.9, 0.2)), 0.18) * 0.5
    return x * forca


def impacto(forca=1.0, d=1.6):
    """colisão grande: estrondo grave + metal amassando + vidro + cacos caindo"""
    n = int(d * SR)
    x = np.zeros(n)
    x[:int(0.8 * SR)] += batida_grave(78, 32, 0.8, 0.28) * 1.0
    x += filtro(ruido(d), hi=600) * ad(n, 0.003, 0.22) * 0.6
    mm = metal_amassando(0.7, 1.1); x[:len(mm)] += mm * 0.9
    gl = vidro(1.0); x[int(0.03 * SR):int(0.03 * SR) + len(gl)] += gl[:n - int(0.03 * SR)] * 0.7
    # peças batendo no chão depois
    for k in range(12):
        i = int((0.3 + rng.uniform(0, 1.1)) * SR)
        if i < n - 3000:
            m = 2600
            x[i:i + m] += (banda(ruido(0.06), 300, 3000)[:m] * np.exp(-np.arange(m) / (0.012 * SR))) * rng.uniform(0.08, 0.3)
    return x * forca


def toque_leve():
    n = int(0.6 * SR)
    x = batida_grave(110, 60, 0.3, 0.07) * 0.8
    x = np.concatenate([x, np.zeros(n - len(x))])
    mm = metal_amassando(0.35, 0.5)
    x[:len(mm)] += mm
    x[:int(0.25 * SR)] += banda(ruido(0.25), 3000, 9000)[:int(0.25 * SR)] * ad(int(0.25 * SR), 0.003, 0.05) * 0.35
    return x


def chiado_pneu(d, f=1500, g=1.0, tremor=18.0):
    t = T(d)
    r = banda(ruido(d), f * 0.6, f * 1.8, 3)
    tonal = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.04 * np.sin(2 * np.pi * tremor * t))) / SR) * 0.35
    env = np.minimum(t / 0.05, 1) * np.minimum((d - t) / 0.12, 1)
    return (r * 0.8 + tonal) * env * g


def motor(d, rpm, gtur=0.0, brilho=1.0, grave=1.0, cilindros=4):
    """síntese de motor: `rpm` é função do tempo (array); harmônicas da frequência de ignição + rugido de admissão + assobio de turbo"""
    t = T(d)
    r = rpm(t) if callable(rpm) else np.full_like(t, rpm)
    f = r / 60.0 * (cilindros / 2.0)
    ph = np.cumsum(f) / SR * 2 * np.pi
    s = np.zeros_like(t)
    for k in range(1, 15):
        a = (1.0 / k ** 1.15) * (1.0 + 0.7 * np.sin(ph * 0.5 + k)) * (0.35 if k % 2 == 0 else 1.0) * (1.0 if k * f.mean() < 4000 else 0.0)
        s += a * np.sin(k * ph + 0.3 * k * k)
    s *= grave
    ar = filtro(ruido(d), hi=700 + 2.5 * f.mean()) * (0.30 + 0.35 * (r / max(r.max(), 1)))
    tur = np.sin(2 * np.pi * np.cumsum(2600 + 2200 * (r - r.min()) / max(r.max() - r.min(), 1)) / SR) * gtur * 0.05
    out = (s * 0.30 + ar * 0.55 * brilho + tur)
    return out


def sirene(d, base=0.0):
    t = T(d)
    f = 900 + 450 * np.sin(2 * np.pi * (t + base) / 3.4 - 1.4)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.35 * np.sin(2 * 2 * np.pi * np.cumsum(f) / SR) + 0.15 * np.sin(3 * 2 * np.pi * np.cumsum(f) / SR)
    return np.tanh(x * 1.6) * 0.5


def sino(f0=196.0, d=7.0):
    t = T(d)
    parc = [(0.5, 0.55, 5.5), (1.0, 1.0, 4.2), (1.2, 0.55, 3.0), (1.5, 0.5, 3.4), (2.0, 0.7, 2.6), (2.5, 0.28, 1.9), (3.0, 0.22, 1.5), (4.1, 0.14, 1.0)]
    x = sum(a * np.sin(2 * np.pi * f0 * k * t + rng.uniform(0, 6.28)) * np.exp(-t / dd) for k, a, dd in parc)
    x += banda(ruido(d), 800, 3500) * np.exp(-t / 0.06) * 0.25
    return x * np.minimum(t / 0.004, 1) / 2.4


def campainha():
    d1 = tom(784, 1.5, ((1, 1.0), (2, 0.35), (3, 0.18), (4.2, 0.1)), 0.55)
    d2 = tom(622, 1.9, ((1, 1.0), (2, 0.35), (3, 0.18), (4.2, 0.1)), 0.75)
    return d1, d2


def batimento(bpm=90, g=1.0):
    p = 60.0 / bpm
    n = int(p * SR)
    x = np.zeros(n)
    a = batida_grave(62, 44, 0.22, 0.07) * 1.0
    b = batida_grave(54, 40, 0.2, 0.06) * 0.75
    x[:len(a)] += a
    j = int(0.17 * SR)
    x[j:j + len(b)] += b
    return x * g


def respiracao(d, g=1.0):
    t = T(d)
    x = banda(ruido(d), 400, 3800)
    ciclo = np.maximum(0, np.sin(2 * np.pi * t / 0.9)) ** 1.4
    return x * ciclo * g * 0.35


def soluco(d=0.9, f0=240.0):
    t = T(d)
    pulso = np.maximum(0, np.sin(2 * np.pi * (t * 3.4 - 0.15))) ** 2.5
    f = f0 * (1 - 0.25 * (t / d)) * (1 + 0.04 * np.sin(2 * np.pi * 5.5 * t))
    ph = np.cumsum(f) / SR * 2 * np.pi
    voz = sum(np.sin(k * ph) / k for k in range(1, 12)) * 0.5
    voz = banda(voz, 250, 3000)
    resp = banda(ruido(d), 500, 4500) * 0.45
    return (voz * 0.8 + resp) * pulso * np.minimum(t / 0.05, 1) * np.minimum((d - t) / 0.2, 1)


def grito(d=0.55, f0=620.0):
    t = T(d)
    f = f0 * (1 + 0.55 * np.minimum(t / 0.2, 1)) * (1 + 0.03 * np.sin(2 * np.pi * 7 * t)) * (1 - 0.15 * t / d)
    ph = np.cumsum(f) / SR * 2 * np.pi
    v = sum(np.sin(k * ph + 0.2 * k) / (k ** 0.8) for k in range(1, 22))
    a = banda(v, 500, 1200) + 0.8 * banda(v, 1100, 1700) + 0.5 * banda(v, 2400, 3300)
    a += banda(ruido(d), 1500, 6000) * 0.25
    return np.tanh(a * 0.7) * np.minimum(t / 0.03, 1) * np.minimum((d - t) / 0.12, 1) * 0.6


def tinido(d=4.0, f=4300.0):
    t = T(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t / (d * 0.45)) * 0.35 + np.sin(2 * np.pi * f * 1.5 * t) * np.exp(-t / (d * 0.3)) * 0.04


def radio(d=1.4):
    t = T(d)
    x = banda(ruido(d), 500, 3200) * (np.sin(2 * np.pi * 6 * t) > -0.2) * 0.4
    x[:int(0.04 * SR)] *= 2.2
    bip = tom(1500, 0.12, ((1, 1),), 0.2)
    x[:len(bip)] += bip * 0.3
    return x * np.minimum((d - t) / 0.1, 1)


def algemas_fecham():
    n = int(0.9 * SR)
    x = np.zeros(n)
    for i, g in zip((0.0, 0.07, 0.13, 0.18, 0.35), (0.8, 0.7, 0.8, 0.9, 1.2)):
        j = int(i * SR)
        m = int(0.04 * SR)
        seg = banda(ruido(0.04), 2500, 9000)[:m] * np.exp(-np.arange(m) / (0.006 * SR))
        x[j:j + m] += seg * g
        ring = tom(3200 + rng.uniform(-200, 200), 0.5, ((1, 0.3), (1.6, 0.25), (2.7, 0.2)), 0.18)
        x[j:j + len(ring)] += ring[:n - j] * 0.35 * g
    return x


def chaves_tilintando(d=0.7):
    n = int(d * SR)
    x = np.zeros(n)
    for k in range(16):
        i = int(abs(rng.uniform(0, d * 0.8)) * SR)
        f = rng.uniform(3000, 6500)
        m = min(int(0.25 * SR), n - i)
        x[i:i + m] += tom(f, 0.25, ((1, 0.4), (2.4, 0.25)), 0.06)[:m] * rng.uniform(0.2, 0.7)
    return x * 0.5


def martelo():
    n = int(2.6 * SR)
    x = np.zeros(n)
    bat = somar(tom(330, 0.5, ((1, 1.0), (2.2, 0.5), (3.7, 0.3)), 0.09), 0.7 * batida_grave(180, 90, 0.3, 0.05))
    cli = banda(ruido(0.03), 1500, 9000) * ad(int(0.03 * SR), 0.0008, 0.006)
    x[:len(bat)] += bat
    x[:len(cli)] += cli * 0.9
    # reverberação de tribunal
    ir = ruido(1.8) * np.exp(-T(1.8) / 0.45)
    ir = filtro(ir, hi=4000)
    ir[:int(0.03 * SR)] = 0
    rev = np.fft.irfft(np.fft.rfft(x, n + len(ir)) * np.fft.rfft(ir, n + len(ir)), n + len(ir))[:n]
    return x + norm(rev, 1.0) * np.abs(x).max() * 0.55


def vento(d, g=1.0, cor=420.0):
    t = T(d)
    x = filtro(ruido(d), hi=cor, ordem=2)
    lfo = 0.55 + 0.45 * np.sin(2 * np.pi * t / 5.3 + rng.uniform(0, 6)) * np.sin(2 * np.pi * t / 11.0 + rng.uniform(0, 6))
    return x * lfo * g


def grilos(d, g=1.0):
    t = T(d)
    out = np.zeros_like(t)
    for v in range(3):
        f = 4300 + 380 * v + rng.uniform(-60, 60)
        pulso = (np.sin(2 * np.pi * (3.2 + 0.4 * v) * t + rng.uniform(0, 6)) > 0.2) * (np.sin(2 * np.pi * (28 + 3 * v) * t) > 0)
        out += np.sin(2 * np.pi * f * t) * pulso * 0.04
    return out * g




# ================================================================== v2: ACÚSTICA, VOZES, FOLEY E AMBIENTES
def fit(x, n):
    return x[:n] if len(x) >= n else np.concatenate([x, np.zeros(n - len(x))])


def hann(n):
    return np.sin(np.pi * np.arange(n) / max(n - 1, 1)) ** 2


def lento(d, hi=2.0):
    """ruído lento normalizado (para modulações)"""
    x = filtro(ruido(d), hi=hi)
    return x / (np.abs(x).max() + 1e-9)


# ---- barramentos de reverb (um por espaço): cabine, sala/corredor, casa vazia (grande) e rua
BUS = {k: [np.zeros(N), np.zeros(N)] for k in ('campo', 'guarita', 'sala', 'quarto', 'lago')}


def add(sig, t, g=1.0, pan=0.0, rv=None, w=0.3):
    i = int(max(t, 0) * SR)
    if i >= N or len(sig) == 0:
        return
    sig = sig[:max(0, N - i)] * g
    pl, pr = np.sqrt((1 - pan) / 2) * 1.4142, np.sqrt((1 + pan) / 2) * 1.4142
    L[i:i + len(sig)] += sig * pl
    R[i:i + len(sig)] += sig * pr
    if rv:
        BUS[rv][0][i:i + len(sig)] += sig * pl * w
        BUS[rv][1][i:i + len(sig)] += sig * pr * w


def addpan(sig, t, g, p0, p1, rv=None, w=0.3):
    """pan que varre de p0 a p1 durante o som (passagens de carro, sirene)"""
    i = int(max(t, 0) * SR)
    if i >= N:
        return
    sig = sig[:max(0, N - i)] * g
    p = np.linspace(p0, p1, len(sig))
    pl, pr = np.sqrt((1 - p) / 2) * 1.4142, np.sqrt((1 + p) / 2) * 1.4142
    L[i:i + len(sig)] += sig * pl
    R[i:i + len(sig)] += sig * pr
    if rv:
        BUS[rv][0][i:i + len(sig)] += sig * pl * w
        BUS[rv][1][i:i + len(sig)] += sig * pr * w


def fftconv(x, h):
    n = len(x) + len(h) - 1
    m = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(h, m), m)[:len(x)]


def construir_ir(rt, hi, pre, taps, seed, lo=90):
    r = np.random.default_rng(seed)
    n = int((rt * 1.6 + pre + 0.1) * SR)
    h = r.standard_normal(n) * np.exp(-np.arange(n) / SR / (rt / 6.9))
    h = filtro(h, hi=hi, lo=lo)
    h[:int(pre * SR)] = 0
    pico = np.abs(h).max()
    for tt, a in taps:
        j = int(tt * SR)
        if j < n:
            h[j] += a * pico * 2.5
    return h / np.sqrt((h ** 2).sum() + 1e-12)


IRPAR = {'campo': (1.6, 4300, 0.030, [(0.09, .5), (0.17, .4), (0.30, .25)], 55),
         'guarita': (0.45, 6500, 0.006, [(0.010, .6), (0.021, .45)], 80),
         'sala': (0.85, 7000, 0.012, [(0.018, .5), (0.031, .4), (0.052, .3)], 90),
         'quarto': (0.30, 5500, 0.004, [(0.007, .5), (0.013, .35)], 60),
         'lago': (2.4, 3300, 0.050, [(0.20, .35), (0.36, .25)], 50)}
GANHO_RV = {'campo': 0.9, 'guarita': 0.9, 'sala': 0.9, 'quarto': 0.9, 'lago': 0.9}


def aplicar_reverbs():
    for nome, (rt, hi, pre, taps, lo) in IRPAR.items():
        for c, (sinal, saida) in enumerate(((BUS[nome][0], L), (BUS[nome][1], R))):
            if np.abs(sinal).max() < 1e-9:
                continue
            h = construir_ir(rt, hi, pre, taps, 100 + 7 * c + len(nome), lo)
            saida += fftconv(sinal, h) * GANHO_RV[nome] * 1.0


# ---- vozes (síntese aditiva com formantes): vogais, choro, arfada, grito
FORM = {'a': (850, 1220, 2810), 'o': (500, 920, 2650), 'e': (600, 1700, 2600), 'i': (330, 2700, 3300), 'u': (380, 950, 2600), 'ae': (720, 1500, 2700)}


def voz(d, f0, vogal='a', resp=0.15, tens=0.5, vib=0.0, jit=0.012):
    n = int(d * SR)
    t = np.arange(n) / SR
    f0t = (f0(t) if callable(f0) else np.full(n, float(f0)))
    f0t = f0t * (1 + jit * lento(d, 30) * 3.0 + vib * np.sin(2 * np.pi * 5.4 * t))
    ph = np.cumsum(f0t) / SR * 2 * np.pi
    F = FORM[vogal]
    bw = (110, 160, 220)
    out = np.zeros(n)
    kmax = int(5200 / max(np.mean(f0t), 60)) + 1
    for k in range(1, kmax):
        fk = k * f0t
        a = sum(g_ * np.exp(-0.5 * ((fk - F[i_] * (1 + 0.04 * tens)) / bw[i_]) ** 2) for i_, g_ in ((0, 1.0), (1, 0.6), (2, 0.28)))
        a = a + 0.04
        out += a * k ** (-0.55 + 0.35 * (1 - tens)) * np.sin(k * ph + 0.3 * k)
    out = out / (np.abs(out).max() + 1e-9)
    asp = banda(ruido(d), 900, 6500) * resp
    return (out + asp) * np.minimum(t / 0.02, 1) * np.minimum((d - t) / 0.05, 1)


def choro(d, f0=270.0, forca=1.0, vogal='ae', seed=0):
    n = int(d * SR)
    x = np.zeros(n)
    t = 0.0
    while t < d - 0.35:
        dur = rng.uniform(0.28, 0.42)
        f_ = f0 * rng.uniform(0.94, 1.08)
        v = voz(dur, lambda tt, f_=f_, dur=dur: f_ * (1.12 - 0.30 * tt / dur), vogal, resp=0.28, tens=0.30, jit=0.03)
        v = v * hann(len(v)) ** 0.7
        i = int(t * SR)
        x[i:i + len(v)] += fit(v, max(0, n - i))[:len(v)] if i < n else 0
        ins = banda(ruido(0.17), 500, 3800) * hann(int(0.17 * SR)) ** 1.2 * 0.55
        j = int((t + dur + 0.04) * SR)
        if j < n:
            x[j:j + len(ins)] += ins[:n - j]
        t += dur + 0.04 + 0.17 + rng.uniform(0.04, 0.22)
    return x * forca


def arfada(forca=1.0):
    ins = banda(ruido(0.28), 450, 4200) * hann(int(0.28 * SR)) ** 1.1 * 0.8
    v = voz(0.22, lambda tt: 300 - 90 * tt / 0.22, 'a', resp=0.3, tens=0.5, jit=0.03) * 0.5
    return np.concatenate([ins, v * hann(len(v)) ** 0.6]) * forca


def respirar(d, ritmo=0.9, g=1.0, medo=0.3):
    """respiração pelo nariz/boca: inspira (ruído que sobe) e expira (mais grave, com um fio de voz)"""
    n = int(d * SR)
    x = np.zeros(n)
    p = 1.0 / ritmo
    k = 0
    while k * p < d - 0.2:
        t0_ = k * p + rng.uniform(-0.03, 0.03) * p
        li = int(p * 0.38 * SR)
        ins = banda(ruido(p * 0.38), 600, 4600) * hann(li) ** 1.4 * (0.55 + 0.35 * medo)
        ins += np.sin(2 * np.pi * np.cumsum(np.linspace(780, 1020, li)) / SR) * hann(li) * 0.03 * medo       # fio de assobio nasal
        le = int(p * 0.42 * SR)
        exp_ = banda(ruido(p * 0.42), 300, 2600) * hann(le) ** 1.2 * 0.5
        j = max(0, int(t0_ * SR))
        if j + li < n:
            x[j:j + li] += ins
        j2 = j + int(p * 0.46 * SR)
        if j2 + le < n:
            x[j2:j2 + le] += exp_
        k += 1
    return x * g


def grito2(d=0.7, f0=620.0, g=1.0):
    t = T(d)
    v = voz(d, lambda tt: f0 * (0.9 + 0.55 * np.minimum(tt / 0.25, 1)) * (1 - 0.12 * tt / d), 'a', resp=0.35, tens=0.95, vib=0.02, jit=0.04)
    v = np.tanh(v * 2.2) * 0.6 + banda(ruido(d), 1800, 7000) * 0.12 * np.minimum(t / 0.05, 1)
    return v * np.minimum((d - t) / 0.14, 1) * g


# ---- metal e mecânica da cabine
def metal_bate(f0=900.0, d=0.9, g=1.0):
    """pancada em latão/aço: modos inarmônicos com decaimentos diferentes + transitório de ruído"""
    t = T(d)
    x = sum(a * np.sin(2 * np.pi * f0 * m * t + rng.uniform(0, 6.28)) * np.exp(-t / dd) for m, a, dd in ((1.0, 1.0, 0.30), (2.32, 0.7, 0.20), (4.25, 0.5, 0.13), (6.63, 0.35, 0.09), (9.38, 0.2, 0.06)))
    tr = banda(ruido(0.03), 1500, 9000)
    x[:len(tr)] += tr * np.exp(-np.arange(len(tr)) / (0.004 * SR)) * 1.2
    return x * g * 0.5


def rattle(d, g=1.0, dens=70, f=(2200, 7000)):
    n = int(d * SR)
    x = np.zeros(n)
    for k in range(max(1, int(d * dens))):
        i = int(rng.uniform(0, max(d - 0.05, 0.01)) * SR)
        m = min(int(rng.uniform(0.015, 0.06) * SR), n - i)
        if m <= 0:
            continue
        ff = rng.uniform(*f)
        x[i:i + m] += fit(tom(ff, m / SR + 0.002, ((1, 0.6), (2.3, 0.3), (3.8, 0.15)), 0.012), m) * rng.uniform(0.15, 0.8)
    return x * g


def grade_desliza2(d, g=1.0):
    """grade pantográfica: rumor do trilho + estalos dos segmentos + tremor das hastes"""
    t = T(d)
    n = len(t)
    rail = banda(ruido(d), 160, 900) * (0.4 + 0.6 * np.abs(lento(d, 9))) * 0.35
    cl = rattle(d, 1.0, 85, (1800, 6500)) * 0.7
    ts = np.zeros(n)
    for k in range(int(d * 14)):
        i = int(rng.uniform(0, max(d - 0.05, 0.01)) * SR)
        m = min(int(0.05 * SR), n - i)
        ts[i:i + m] += banda(ruido(0.05), 700, 5000)[:m] * np.exp(-np.arange(m) / (0.008 * SR)) * rng.uniform(0.2, 0.9)
    return (rail + cl + ts * 0.5) * np.sin(np.pi * np.arange(n) / n) ** 0.5 * g


def motor_elev2(d, f0=46.0, f1=94.0, g=1.0):
    t = T(d)
    k = np.clip(t / d, 0, 1)
    f = f0 + (f1 - f0) * k ** 1.2
    ph = np.cumsum(f) / SR * 2 * np.pi
    hum = sum(a * np.sin(m * ph + 0.4 * m) for m, a in ((1, 1.0), (2, .6), (3, .45), (4, .3), (5, .2), (6, .14), (8, .08)))
    inv = np.sin(2 * np.pi * np.cumsum(1800 + 2600 * k ** 1.3) / SR) * 0.07 + np.sin(2 * np.pi * np.cumsum(3600 + 5200 * k ** 1.3) / SR) * 0.025
    cabo = banda(ruido(d), 900, 3500) * 0.08 * k
    rod = filtro(ruido(d), lo=30, hi=240) * 0.28
    ar = banda(ruido(d), 150, 900) * 0.13 * np.minimum(k * 3, 1)
    return (hum * 0.18 + inv + cabo + rod + ar) * np.minimum(t / 0.10, 1) * g


def queima_motor(d=1.0, g=1.0):
    """o motor de içamento morrendo: sobe o assobio, distorce, cai; arco elétrico e estalo"""
    t = T(d)
    f = 2400 + 3800 * np.minimum(t / 0.25, 1) - 3200 * np.clip((t - 0.25) / 0.6, 0, 1)
    w = np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * 3.0) * np.exp(-t / 0.35) * 0.3
    arco = crepitar(d, 1.0, 140) * np.exp(-t / 0.4) * 0.8
    zzt = banda(ruido(d), 1200, 8000) * np.exp(-t / 0.12) * 0.6
    pop = np.zeros_like(t)
    j = int(0.30 * SR)
    pop[j:j + int(0.05 * SR)] = banda(ruido(0.05), 300, 5000)[:int(0.05 * SR)] * np.exp(-np.arange(int(0.05 * SR)) / (0.008 * SR)) * 1.4
    return (w + arco + zzt + pop) * g


def buzz_lampada(d, padrao, passo=1 / 24.0, g=1.0):
    """zumbido da lâmpada defeituosa seguindo o padrão de piscadas (1 = acesa)"""
    t = T(d)
    idx = np.minimum((t / passo).astype(int), len(padrao) - 1)
    amp = np.array(padrao)[idx]
    x = sum(np.sin(2 * np.pi * 120 * m * t + m) / m for m in range(1, 9)) * 0.25
    return (x * amp + crepitar(d, 0.3, 90) * (1 - amp)) * g


def parada_v2():
    n = int(3.0 * SR)
    x = np.zeros(n)
    sub = batida_grave(60, 24, 1.2, 0.30) * 1.3
    x[:len(sub)] += sub
    cl = somar(banda(ruido(0.25), 120, 3200) * ad(int(0.25 * SR), 0.001, 0.07) * 1.1, metal_bate(430, 0.9, 1.0), metal_bate(1180, 0.6, 0.7))
    x[:len(cl)] += cl
    sq = np.sin(2 * np.pi * np.cumsum(np.linspace(1900, 1250, int(0.30 * SR))) / SR) * hann(int(0.30 * SR)) * 0.25 + banda(ruido(0.30), 1500, 6000) * hann(int(0.30 * SR)) * 0.2
    x[int(0.02 * SR):int(0.02 * SR) + len(sq)] += sq
    t = T(2.4)
    rope = filtro(ruido(2.4), lo=16, hi=75) * (1 + 0.9 * np.sin(2 * np.pi * 2.8 * t)) * np.exp(-t / 0.75) * 2.0
    x[:len(rope)] += rope
    for off, f0_, f1_ in ((0.25, 150, 85), (0.95, 120, 70), (1.7, 95, 60)):
        rg = rangido(0.9, f0_, f1_, 1.0)
        i = int(off * SR)
        x[i:i + len(rg)] += rg[:n - i] * 0.7
    qm = queima_motor(1.0, 1.0)
    x[:len(qm)] += qm
    pad = [1, .15, 1, .05, .6, 0.0, .9, .1, 1, .25, .85, .5, 1, .2, 1, 1]
    lb = buzz_lampada(int(1.1 * SR) / SR, pad, 1 / 22.0, 0.55)
    x[int(0.08 * SR):int(0.08 * SR) + len(lb)] += lb
    for k in range(7):
        i = int(rng.uniform(0.15, 1.2) * SR)
        x[i:i + int(0.12 * SR)] += tom(rng.uniform(4200, 9000), 0.12, ((1, 0.5), (2.2, 0.2)), 0.03)[:int(0.12 * SR)] * rng.uniform(0.08, 0.2)
    return x


def clique2(g=1.0, tipo='botao'):
    """botão de elevador: estalo do contato + sobretom plástico + relé"""
    x = somar(banda(ruido(0.03), 1800, 7000) * ad(int(0.03 * SR), 0.0004, 0.005) * 0.9,
              tom(2150, 0.06, ((1, 0.4),), 0.010) * 0.25,
              0.35 * batida_grave(300, 160, 0.05, 0.010))
    if tipo == 'botao':
        r = somar(banda(ruido(0.02), 900, 4000) * ad(int(0.02 * SR), 0.0004, 0.004) * 0.5)
        x = np.concatenate([x, np.zeros(int(0.02 * SR))]); x[int(0.03 * SR):int(0.03 * SR) + len(r)] += r[:len(x) - int(0.03 * SR)]
    return x * g


def bipe(f=1568.0, d=0.12, g=1.0):
    t = T(d)
    return np.tanh(np.sin(2 * np.pi * f * t) * 1.5) * np.minimum(t / 0.004, 1) * np.minimum((d - t) / 0.02, 1) * 0.25 * g


def zumbido2(d, g=1.0, f=60.0):
    """transformador + reator da lâmpada: 60 Hz com batimento, harmônicas e um fio agudo"""
    t = T(d)
    x = sum(a * np.sin(2 * np.pi * (f + 0.35 * np.sin(m)) * m * t + rng.uniform(0, 6.28)) for m, a in ((1, 1.0), (2, 0.6), (3, 0.3), (4, 0.18), (6, 0.08)))
    x *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.27 * t)
    fio = np.sin(2 * np.pi * 7800 * t) * 0.012 * (0.6 + 0.4 * lento(d, 3))
    ar = banda(ruido(d), 180, 520) * 0.03 * (0.5 + 0.5 * np.abs(lento(d, 0.6)))
    return (x * 0.10 + fio + ar) * g


# ---- ambientes
def vento2(d, g=1.0, cor=520.0):
    t = T(d)
    x = banda(ruido(d), 120, cor * 2.0)
    rajada = 0.35 + 0.65 * np.abs(lento(d, 0.5)) ** 1.3
    uivo = np.sin(2 * np.pi * np.cumsum(480 + 260 * lento(d, 0.35)) / SR) * 0.02 * rajada ** 2
    return (x * rajada * 0.5 + uivo) * g


def passagem_carro(g=1.0, vel=1.0, dur=2.2):
    n = int(dur * SR)
    eng = motor(dur, lambda t: 1250 + 260 * np.sin(t * 2.0), 0.0, 0.8, 1.2, 4) * 0.5
    pneu = chiado_pneu(dur, 900, 0.5, 14)
    base = eng + pneu
    t = np.arange(n) / SR
    tp = dur * 0.5
    rate = 1.0 + 0.11 * np.tanh(-(t - tp) * 2.6) * vel
    idx = np.clip(np.cumsum(rate) - rate[0], 0, n - 1)
    y = np.interp(idx, np.arange(n), base)
    env = 1.0 / (1 + ((t - tp) / (0.42 / max(vel, 0.4))) ** 2) ** 1.2
    return y * env * g


def buzina_taxi(g=1.0):
    t = T(0.35)
    x = (np.sin(2 * np.pi * 410 * t) + 0.5 * np.sin(2 * np.pi * 2 * 410 * t) + np.sin(2 * np.pi * 515 * t) + 0.4 * np.sin(2 * np.pi * 2 * 515 * t))
    return np.tanh(x * 0.8) * np.minimum(t / 0.01, 1) * np.minimum((0.35 - t) / 0.05, 1) * 0.3 * g


def cidade(d, intens=1.0, noite=False, dens=1.0):
    t = T(d)
    n = len(t)
    rumor = filtro(ruido(d), lo=26, hi=150) * (0.55 + 0.45 * np.abs(lento(d, 0.3))) * 0.9
    lavagem = banda(ruido(d), 180, 1500) * (0.10 + 0.08 * np.abs(lento(d, 0.4)))
    hv = np.sin(2 * np.pi * 100 * t) * 0.02 + np.sin(2 * np.pi * 200.3 * t) * 0.012
    x = rumor + lavagem + hv
    for k in range(int(d / (2.6 if not noite else 4.5) * dens)):
        tt = rng.uniform(0, max(d - 1.0, 0.1))
        p = passagem_carro(rng.uniform(0.18, 0.45) * (0.6 if noite else 1.0), rng.uniform(0.7, 1.4))
        i = int(tt * SR)
        m = min(len(p), n - i)
        if m > 0:
            x[i:i + m] += p[:m]
    for k in range(int(d / 9.0 * dens)):
        tt = rng.uniform(0, max(d - 0.5, 0.1))
        i = int(tt * SR)
        b = buzina_taxi(0.35)
        m = min(len(b), n - i)
        if m > 0:
            x[i:i + m] += b[:m]
    return x * intens


def pardal(g=1.0):
    d = rng.uniform(0.25, 0.6)
    n = int(d * SR)
    x = np.zeros(n)
    t = 0.0
    while t < d - 0.06:
        du = rng.uniform(0.03, 0.07)
        tt = T(du)
        f = rng.uniform(2800, 4600) + rng.uniform(-1400, 1400) * tt / du
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / du) ** 1.3
        i = int(t * SR)
        x[i:i + len(s)] += s[:n - i] * 0.6
        t += du + rng.uniform(0.02, 0.07)
    return x * g


def passaros2(d, g=1.0, dens=1.0):
    n = int(d * SR)
    x = np.zeros(n)
    for k in range(int(d * 2.4 * dens)):
        i = int(rng.uniform(0, max(d - 0.7, 0.01)) * SR)
        p = pardal(rng.uniform(0.04, 0.09))
        m = min(len(p), n - i)
        if m > 0:
            x[i:i + m] += p[:m]
    return x * g


def pombo(g=1.0):
    d = 1.1
    t = T(d)
    f = 420 + 80 * np.sin(2 * np.pi * 3.0 * t) * np.exp(-t / 0.7) - 60 * t
    gate = (np.sin(2 * np.pi * 2.6 * t) > -0.2) * np.minimum(t / 0.05, 1) * np.minimum((d - t) / 0.2, 1)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * 1.4) * gate * 0.08 * g


def sala_vazia(d, g=1.0):
    t = T(d)
    n = len(t)
    x = banda(ruido(d), 90, 700) * 0.025 * (0.6 + 0.4 * np.abs(lento(d, 0.5)))
    x += np.sin(2 * np.pi * 50 * t) * 0.012 + np.sin(2 * np.pi * 100.2 * t) * 0.006 + filtro(ruido(d), hi=60) * 0.06
    for k in range(int(d / 1.4)):
        i = int(rng.uniform(0, max(d - 0.9, 0.05)) * SR)
        r = rangido(rng.uniform(0.35, 0.9), rng.uniform(70, 160), rng.uniform(50, 110), 0.5)
        m = min(len(r), n - i)
        if m > 0:
            x[i:i + m] += r[:m] * 0.5
    for k in range(int(d / 2.0)):
        i = int(rng.uniform(0, max(d - 0.1, 0.05)) * SR)
        m = min(int(0.04 * SR), n - i)
        if m > 0:
            x[i:i + m] += banda(ruido(0.04), 200, 2400)[:m] * np.exp(-np.arange(m) / (0.008 * SR)) * 0.25
    return x * g


# ---- foley
def passo2(sup='concreto', forca=1.0, calc='tenis'):
    if sup == 'madeira':
        base = somar(batida_grave(115, 52, 0.22, 0.08) * 0.9, banda(ruido(0.12), 160, 1800) * ad(int(0.12 * SR), 0.002, 0.03) * 0.6)
        if rng.random() < 0.28:
            base = somar(base, rangido(0.28, rng.uniform(110, 190), rng.uniform(80, 130), 0.5) * 0.6)
        return base * forca
    if sup == 'concreto':
        s = passo('concreto', 1.0)
        if calc == 'bota':
            s = somar(s, 0.5 * batida_grave(95, 48, 0.14, 0.04), banda(ruido(0.05), 1500, 6000) * ad(int(0.05 * SR), 0.0006, 0.008) * 0.5)
        return s * forca
    return passo(sup, forca)


def roupa(d, g=1.0, dens=1.0):
    n = int(d * SR)
    x = banda(ruido(d), 500, 5200) * (0.15 + 0.85 * np.abs(lento(d, 7.0)) ** 1.5) * 0.18
    for k in range(int(d * 4 * dens)):
        i = int(rng.uniform(0, max(d - 0.2, 0.01)) * SR)
        m = min(int(rng.uniform(0.05, 0.16) * SR), n - i)
        if m > 0:
            x[i:i + m] += banda(ruido(0.2), 800, 6500)[:m] * hann(m) * rng.uniform(0.15, 0.5)
    return x * g


def papelao(d, g=1.0):
    n = int(d * SR)
    x = banda(ruido(d), 250, 2400) * (0.2 + 0.8 * np.abs(lento(d, 8))) * 0.22
    x += crepitar(d, 0.18, 30)
    return x * g


def luva(g=1.0):
    d = 0.18
    t = T(d)
    f = 1800 + 1300 * t / d
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.35 + banda(ruido(d), 1500, 6000) * 0.25) * hann(len(t)) * g


def amassa_manta2(d, g=1.0):
    n = int(d * SR)
    x = np.zeros(n)
    rate = 55
    for k in range(int(d * rate)):
        i = int(rng.uniform(0, max(d - 0.05, 0.01)) * SR)
        m = int(rng.uniform(0.006, 0.04) * SR)
        if i + m < n:
            x[i:i + m] += banda(ruido(0.04), 2500, 13000)[:m] * np.exp(-np.arange(m) / (0.007 * SR)) * rng.uniform(0.2, 1.0)
    x += banda(ruido(d), 1200, 6000) * 0.04 * (0.4 + 0.6 * np.abs(lento(d, 9)))
    return x * g


def equipamento(d, g=1.0):
    """capacete, machado e fivelas batendo na correria"""
    n = int(d * SR)
    x = np.zeros(n)
    for k in range(max(2, int(d * 9))):
        i = int(rng.uniform(0, max(d - 0.1, 0.01)) * SR)
        m = min(int(0.1 * SR), n - i)
        if m > 0:
            x[i:i + m] += tom(rng.uniform(900, 3200), 0.1, ((1, 0.5), (2.6, 0.3)), 0.02)[:m] * rng.uniform(0.15, 0.6)
    return x * g


def radio2(d=1.4, g=1.0):
    t = T(d)
    n = len(t)
    f0 = rng.uniform(110, 190)
    ph = np.cumsum(f0 * (1 + 0.12 * np.sin(2 * np.pi * 1.1 * t))) / SR * 2 * np.pi
    gl = sum(np.sin(k * ph) / k for k in range(1, 16))
    sil = np.maximum(0, np.sin(2 * np.pi * 4.2 * t)) ** 1.2
    v = banda(banda(gl, 500, 900) + 0.6 * banda(gl, 1300, 1800) + 0.3 * banda(gl, 2400, 3000), 400, 3000) * sil
    chiado = banda(ruido(d), 500, 3200) * 0.15
    x = np.tanh((v * 0.5 + chiado) * 2.0) * 0.4
    sq = banda(ruido(0.06), 800, 3500) * ad(int(0.06 * SR), 0.001, 0.015)
    x[:len(sq)] += sq * 0.8
    bip = tom(1500, 0.1, ((1, 1),), 0.15)
    x[-len(bip) - int(0.02 * SR):-int(0.02 * SR)] += bip * 0.25
    return x * np.minimum(t / 0.01, 1) * np.minimum((d - t) / 0.06, 1) * g


def murmurio2(d, g=1.0, vozes=2):
    t = T(d)
    out = np.zeros_like(t)
    for v in range(vozes):
        f0 = rng.uniform(95, 215)
        f = f0 * (1 + 0.10 * np.sin(2 * np.pi * rng.uniform(0.6, 1.5) * t + v) + 0.03 * np.sin(2 * np.pi * 5.7 * t))
        ph = np.cumsum(f) / SR * 2 * np.pi
        gl = sum(np.sin(k * ph) / k ** 1.05 for k in range(1, 18))
        sil = np.maximum(0, np.sin(2 * np.pi * rng.uniform(3.0, 5.2) * t + rng.uniform(0, 6))) ** 1.2 * (0.45 + 0.55 * np.abs(np.sin(2 * np.pi * rng.uniform(0.35, 0.9) * t + rng.uniform(0, 6))))
        vog = np.sin(2 * np.pi * rng.uniform(0.9, 2.0) * t) > 0
        fa, fb = (700, 1200) if rng.random() < 0.5 else (450, 1800)
        form = banda(gl, fa * 0.8, fa * 1.2) + 0.7 * banda(gl, fb * 0.85, fb * 1.15) + 0.3 * banda(gl, 2400, 3200)
        out += form * sil
    return out * g * 0.3


def grito_homem(d=0.7, g=1.0):
    return voz(d, lambda tt: 190 * (1 + 0.35 * np.minimum(tt / 0.2, 1)), 'o', resp=0.25, tens=0.9, jit=0.03) * np.minimum((d - T(d)) / 0.1, 1) * 0.7 * g


# ---- sirenes, diesel, impactos, risers
def sirene2(d, tpico, base=0.0, g=1.0, yelp=False):
    t = T(d)
    per = 1.1 if yelp else 3.4
    k = 1.07 - 0.14 / (1 + np.exp(-(t - tpico) * 4.5))
    f = (900 + 450 * np.sin(2 * np.pi * (t + base) / per - 1.4)) * k
    ph = np.cumsum(f) / SR * 2 * np.pi
    x = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
    env = 1.0 / (1 + ((t - tpico) / 1.4) ** 2)
    return np.tanh(x * 1.6) * 0.5 * env * np.minimum(t / 0.1, 1) * g


def diesel2(d, g=1.0, rpm=760):
    t = T(d)
    base = motor(d, lambda tt: rpm + 40 * np.sin(2 * np.pi * 1.6 * tt), 0.0, 0.4, 1.9, 6)
    base = filtro(base, hi=850)
    pulso = (0.8 + 0.2 * np.sin(2 * np.pi * rpm / 60 * 3 * t))
    return base * pulso * g


def freio_ar2(g=1.0):
    sq = np.sin(2 * np.pi * np.cumsum(np.linspace(2200, 1400, int(0.45 * SR))) / SR) * hann(int(0.45 * SR)) * 0.15 + banda(ruido(0.45), 1800, 7000) * hann(int(0.45 * SR)) * 0.2
    pss = banda(ruido(1.0), 2500, 9500) * ad(int(1.0 * SR), 0.02, 0.35) * 0.55 + banda(ruido(1.0), 400, 2200) * ad(int(1.0 * SR), 0.02, 0.25) * 0.25
    x = np.concatenate([sq, np.zeros(int(0.1 * SR))])
    out = np.zeros(int(1.6 * SR))
    out[:len(x)] += x
    out[int(0.35 * SR):int(0.35 * SR) + len(pss)] += pss
    return out * g


def sub_boom(f0=60.0, f1=26.0, d=1.6, g=1.0):
    t = T(d)
    fr = f1 + (f0 - f1) * np.exp(-t * 6)
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / (d * 0.30))
    x += filtro(ruido(d), hi=300) * np.exp(-t / 0.25) * 0.5
    return x * g


def riser(d, f0=200.0, f1=5000.0, g=1.0, tom_=0.3):
    t = T(d)
    k = (t / d) ** 2
    c = f0 * (f1 / f0) ** (t / d)
    r = np.zeros_like(t)
    seg = 32
    for s in range(seg):
        a, b = int(len(t) * s / seg), int(len(t) * (s + 1) / seg)
        fc = c[(a + b) // 2]
        r[a:b] = banda(ruido(d), fc * 0.7, fc * 1.4)[a:b]
    tone = np.sin(2 * np.pi * np.cumsum(c * 0.5) / SR) * tom_ * 0.12
    return (r * 0.35 + tone) * k * np.minimum((d - t) / 0.02, 1) * g


def swell_ar(d, g=1.0, lo=2500.0):
    t = T(d)
    return banda(ruido(d), lo, 10000) * np.sin(np.pi * t / d) ** 2 * g * 0.5


def sino2(f0=131.0, d=6.0, g=1.0):
    t = T(d)
    parc = ((0.5, 0.5, 4.5), (1.0, 1.0, 3.8), (1.19, 0.6, 2.8), (1.56, 0.45, 2.6), (2.0, 0.55, 2.2), (2.5, 0.3, 1.7), (3.0, 0.22, 1.3), (4.2, 0.12, 0.9))
    x = sum(a * np.sin(2 * np.pi * f0 * k * t + rng.uniform(0, 6.28)) * np.exp(-t / dd) for k, a, dd in parc)
    x += banda(ruido(d), 500, 3000) * np.exp(-t / 0.05) * 0.3
    return x * np.minimum(t / 0.004, 1) / 2.2 * g


def tictac2(n_ticks, gap, g=1.0, acelera=0.0):
    """relógio de pé com caixa de madeira ressoando; `acelera` encurta o intervalo a cada tique"""
    ts = []
    tt = 0.0
    gp = gap
    for k in range(n_ticks):
        ts.append(tt)
        tt += gp
        gp = max(0.05, gp * (1 - acelera))
    d = ts[-1] + 0.4
    x = np.zeros(int(d * SR))
    for k, tt in enumerate(ts):
        f = 1750 if k % 2 == 0 else 1280
        s = somar(banda(ruido(0.05), 900, 5200) * ad(int(0.05 * SR), 0.0005, 0.007) * 0.8, tom(f, 0.1, ((1, 0.5), (2.2, 0.3)), 0.022) * 0.55, 0.5 * batida_grave(250, 120, 0.09, 0.02), tom(185, 0.25, ((1, 0.5), (1.9, 0.2)), 0.07) * 0.3)
        i = int(tt * SR)
        x[i:i + len(s)] += s[:len(x) - i]
    return x * g


# ---- peças da v1 que continuam úteis
def crepitar(d, g=1.0, dens=60):
    n = int(d * SR)
    x = np.zeros(n)
    for k in range(int(d * dens)):
        i = int(rng.uniform(0, max(d - 0.02, 0.005)) * SR)
        m = int(rng.uniform(0.001, 0.008) * SR)
        m = min(m, n - i)
        if m > 0:
            x[i:i + m] += banda(ruido(0.01), 1500, 9000)[:m] * np.exp(-np.arange(m) / (0.0018 * SR)) * rng.uniform(0.2, 1.0)
    return x * g


def rangido(d, f0=140.0, f1=90.0, g=1.0):
    t = T(d)
    f = (f0 + (f1 - f0) * t / d) * (1 + filtro(ruido(d), hi=22) * 9.0)
    ph = np.cumsum(f) / SR * 2 * np.pi
    s = sum(np.sin(k * ph) / k for k in range(1, 10))
    return filtro(s, lo=110, hi=2400) * np.sin(np.pi * t / d) ** 0.7 * g * 0.35


def clack(g=1.0):
    return somar(banda(ruido(0.1), 1200, 6000) * ad(int(0.1 * SR), 0.001, 0.02) * 0.9, tom(900, 0.2, ((1, 0.6), (2.6, 0.3)), 0.04) * 0.5, 0.5 * batida_grave(160, 80, 0.12, 0.03)) * g


def ding(f=1318.0, g=1.0):
    return tom(f, 1.3, ((1, 1.0), (2, 0.3), (3, 0.12)), 0.4) * g


def toc(g=1.0):
    return somar(tom(190, 0.2, ((1, 1.0), (2.1, 0.4)), 0.05), 0.6 * banda(ruido(0.1), 300, 1800) * ad(int(0.1 * SR), 0.001, 0.02)) * g


def buzina_ar(d=0.9, g=1.0):
    t = T(d)
    x = sum(np.sin(2 * np.pi * f * k * t) / k for f in (370.0, 466.0) for k in range(1, 6))
    return np.tanh(x * 0.6) * np.minimum(t / 0.03, 1) * np.minimum((d - t) / 0.08, 1) * g * 0.5


def madeira_estalo(g=1.0):
    n = int(0.9 * SR)
    x = np.zeros(n)
    m0 = int(0.05 * SR)
    x[:m0] += banda(ruido(0.05), 400, 6000)[:m0] * ad(m0, 0.0005, 0.01) * 1.2
    x[:int(0.5 * SR)] += batida_grave(120, 55, 0.5, 0.12) * 0.8
    for k in range(18):
        i = int(rng.uniform(0.02, 0.45) * SR); m = int(0.012 * SR)
        x[i:i + m] += banda(ruido(0.012), 1000, 7000)[:m] * np.exp(-np.arange(m) / (0.003 * SR)) * rng.uniform(0.2, 0.8)
    return x * g


def raspa_metal(d, g=1.0):
    t = T(d)
    x = banda(ruido(d), 700, 4500) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t))
    x += np.sin(2 * np.pi * np.cumsum(900 + 500 * t / d) / SR) * 0.08
    return x * np.sin(np.pi * t / d) ** 0.6 * g * 0.5


def abafar(x, hi=700):
    return filtro(x, hi=hi, ordem=2) * 1.25


def seg(id, extra=0.0):
    return P[id]['t0'], P[id]['dur'] + extra


def cama(id, fn, g=1.0, pan=0.0, rv=None, w=0.3, fade=0.1):
    """cama sonora do plano `id`: fn(d) gera d segundos; entra 0,1 s antes e sai 0,1 s depois, com fusão suave"""
    a, d = seg(id)
    dd = d + 2 * fade
    x = fit(fn(dd), int(dd * SR))
    n = len(x)
    env = np.minimum(1, np.minimum(np.arange(n) / (fade * SR), (n - np.arange(n)) / (fade * SR)))
    add(x * env, a - fade, g, pan, rv, w)


import math
CORTES = []
JANELAS_VOZ = [(0.1, 41.5)]

def silencio_corte(t, nivel, dur):
    CORTES.append((t, nivel, dur))


def curva_cortes(n):
    g = np.ones(n)
    for t_, nivel, dur in CORTES:
        i0 = int(t_ * SR)
        i1 = min(n, i0 + int(dur * SR))
        if i0 >= n:
            continue
        ra = int(0.02 * SR)
        rb = int(0.25 * SR)
        meio = max(0, i1 - i0 - ra - rb)
        rampa = np.concatenate([np.linspace(1, nivel, ra), np.full(meio, nivel), np.linspace(nivel, 1, rb)])
        m = min(len(rampa), n - i0)
        g[i0:i0 + m] = np.minimum(g[i0:i0 + m], rampa[:m])
    return g


def curva_voz(n, duck=0.55):
    g = np.ones(n)
    for a_, b_ in JANELAS_VOZ:
        g[int(a_ * SR):int(b_ * SR)] = duck
    k = int(0.15 * SR)
    return np.convolve(g, np.ones(k) / k, 'same')



def alarme(d, g=1.0):
    t = T(d); x = np.zeros(len(t))
    for k in range(int(d * 4)):
        i = int(k * 0.25 * SR); b = tom(1568 if k % 2 else 1175, 0.16, ((1, 1), (2, .3)), 0.1) * 0.6; m = min(len(b), len(x) - i)
        if m > 0: x[i:i + m] += b[:m]
    return x * g


def multidao_som(d, g=1.0):
    return somar(murmurio2(d, 1.0, 5), filtro(ruido(d), lo=100, hi=900) * 0.25) * g


def passos_corrida(d, g=1.0):
    n = int(d * SR); x = np.zeros(n)
    for ti in np.arange(0, d - 0.1, 0.19):
        s = passo2('concreto', 0.8, 'tenis'); i = int(ti * SR); m = min(len(s), n - i)
        if m > 0: x[i:i + m] += s[:m]
    return x * g


def espaco_ar(d, g=1.0):
    return somar(filtro(ruido(d), lo=30, hi=120) * 0.5 * (0.7 + 0.3 * lento(d, 0.4)), filtro(ruido(d), lo=3000, hi=9000) * 0.02) * g


def cintilar(d, g=1.0):
    t = T(d); x = np.zeros(len(t))
    for k in range(int(d * 14)):
        i = int(rng.uniform(0, d - 0.2) * SR); b = tom(rng.uniform(2500, 7000), 0.18, ((1, 1), (2.7, .3)), 0.05) * rng.uniform(0.1, 0.5); m = min(len(b), len(x) - i)
        if m > 0: x[i:i + m] += b[:m]
    return x * g


def zumbido_ouvido(d, f=4300.0, g=1.0):
    t = T(d)
    return (np.sin(2 * np.pi * f * t) * 0.30) * np.minimum(t / 0.3, 1) * np.minimum((d - t) / 0.4, 1) * g


def montar():
    a, d = seg('abertura')
    add(multidao_som(d, 1.0), a, 0.35, 0, 'campo', 0.4); add(batida_grave(70, 36, 0.8, 0.3) * 1.0, a + 0.95, 1.0, 0, 'campo', 0.5)
    add(sub_boom(40, 22, 3.0, 1.0), a + 1.4, 0.9, 0, 'campo', 0.5); add(rattle(2.0, 0.6, 80, (400, 3000)), a + 1.5, 0.4, 0, 'campo', 0.4)
    add(whoosh(d, 200, 2500), a, 0.2, 0, 'campo', 0.2)
    a, d = seg('reinicia')
    add(whoosh(d, 4000, 150, 1.2), a, 0.5, 0, 'campo', 0.3); add(riser(d, 6000, 200, 0.6, 0.3), a, 0.25, 0, 'campo', 0.2); add(multidao_som(d, 1.0)[::-1], a, 0.3, 0, 'campo', 0.3)
    add(sub_boom(55, 28, 1.6, 1.0), a, 0.4, 0, 'campo', 0.3)
    a, d = seg('terra')
    cama('terra', lambda dd: espaco_ar(dd, 1.0), 0.9, 0, None); add(riser(d, 150, 2500, 0.6, 0.2), a, 0.18, 0, 'campo', 0.3)
    add(whoosh(1.4, 200, 2500), a + d - 0.4, 0.2, 0, 'campo', 0.2)
    a, d = seg('empurrada')
    add(whoosh(d + 0.4, 100, 4000, 1.6), a, 0.35, 0.3, 'campo', 0.3); add(sub_boom(55, 28, 2.4, 1.0), a + 0.1, 0.5, 0, 'campo', 0.4)
    cama('empurrada', lambda dd: espaco_ar(dd, 1.0), 0.6, 0, None)
    a, d = seg('amassada')
    add(sub_boom(60, 24, 2.6, 1.0), a + 0.2, 0.7, 0, 'campo', 0.5)
    add(rattle(2.0, 0.5, 60, (800, 4000)), a + 0.7, 0.4, 0, 'campo', 0.3); add(somar(metal_bate(300, 1.2, 0.6), metal_bate(220, 1.2, 0.5)), a + 0.5, 0.5, 0, 'campo', 0.4)
    add(whoosh(0.6, 3000, 300), a + d - 0.4, 0.2, 0, 'campo', 0.2)
    a, d = seg('alerta')
    add(alarme(d, 1.0), a + 0.1, 0.55, 0, 'quarto', 0.3); add(vibra := zumbido2(d, 0.5, 90.0), a, 0.25, 0, 'quarto', 0.2)
    add(clique2(0.7, 'botao'), a + 3.2, 0.3, 0, 'quarto', 0.2)
    a, d = seg('saem')
    add(passos_corrida(d - 0.5, 1.0), a, 0.45, 0, 'campo', 0.3); add(clack(0.8), a, 0.4, 0, 'campo', 0.2)
    cama('saem', lambda dd: multidao_som(dd, 1.0) * np.linspace(0.1, 1, int(dd * SR)), 0.7, 0, 'campo', 0.4)
    add(whoosh(2.5, 200, 2500, 1.0), a + 2.5, 0.2, 0, 'campo', 0.2)
    a, d = seg('meiodia')
    cama('meiodia', lambda dd: multidao_som(dd, 1.0) * np.linspace(1, 0.3, int(dd * SR)), 0.6, 0, 'campo', 0.4)
    add(tictac2(int(d / 0.5), 0.5, 0.6, 0.0), a, 0.3, 0, 'campo', 0.3); add(riser(3.6, 200, 3000, 0.6, 0.3), a, 0.25, 0, 'campo', 0.2)
    add(ding(1318, 1.0), a + 3.6, 0.5, 0, 'campo', 0.4); add(sub_boom(48, 30, 1.6, 1.0), a + 3.6, 0.4, 0, 'campo', 0.3)
    silencio_corte(a + 3.6, 0.05, 0.35)
    a, d = seg('pulo')
    add(batida_grave(70, 36, 0.8, 0.3) * 1.0, a + 1.45, 1.0, 0, 'campo', 0.5); add(sub_boom(36, 20, 3.4, 1.0), a + 1.5, 1.0, 0, 'campo', 0.5)
    add(rattle(2.4, 0.6, 80, (400, 3000)), a + 1.6, 0.4, 0, 'campo', 0.4); add(whoosh(d, 200, 2500), a, 0.2, 0.2, 'campo', 0.2)
    add(multidao_som(d, 1.0), a, 0.3, 0, 'campo', 0.4)
    a, d = seg('real')
    silencio_corte(a, 0.2, 0.9)
    cama('real', lambda dd: espaco_ar(dd, 1.0), 0.9, 0, None); add(zumbido_ouvido(d, 3600, 0.08), a, 1.0, 0, None)
    add(ding(880, 1.0), a + 0.1, 0.25, 0, 'campo', 0.4)
    a, d = seg('atomo')
    add(whoosh(d, 200, 5000, 1.5), a, 0.3, 0, 'campo', 0.3); add(cintilar(d, 1.0), a, 0.5, 0, 'campo', 0.3)
    add(riser(d, 300, 6000, 0.6, 0.0), a, 0.2, 0, 'campo', 0.2); add(ding(1760, 1.0), a + d - 0.3, 0.3, 0, 'campo', 0.4)
    a, d = seg('fim')
    cama('fim', lambda dd: espaco_ar(dd, 1.0), 0.9, 0, None); add(whoosh(2.2, 200, 2000), a, 0.2, 0, 'campo', 0.2)
    add(sub_boom(50, 30, 1.6, 1.0), a + 1.6, 0.25, 0, 'campo', 0.4); add(toc(0.7), a + 1.7, 0.25, 0, 'campo', 0.2)


def finalizar(saida, para_voz=False):
    for c in (L, R):
        c[:] = 0
    for b in BUS.values():
        b[0][:] = 0
        b[1][:] = 0
    CORTES.clear()
    montar()
    gc = curva_cortes(N)
    for c in (L, R):
        c *= gc
    for b in BUS.values():
        b[0] *= gc
        b[1] *= gc
    aplicar_reverbs()
    st = np.stack([L, R], 1)
    pico = max(np.abs(st).max(), 1e-6)
    st = st * (0.92 / pico)
    env = np.sqrt(np.convolve((st ** 2).mean(1), np.ones(int(0.04 * SR)) / int(0.04 * SR), 'same') + 1e-9)       # compressor suave (RMS de 40 ms, razão 3:1)
    thr = 0.07
    g = np.where(env > thr, (env / thr) ** (-(1 - 1 / 3.0)), 1.0)
    g = np.convolve(g, np.ones(int(0.02 * SR)) / int(0.02 * SR), 'same')
    st = st * g[:, None]
    st *= 0.92 / max(np.abs(st).max(), 1e-6)
    st = np.tanh(st * 1.15) / np.tanh(1.15)
    st = st[:int((TOTAL + 0.3) * SR)]
    for c in range(2):
        st[:, c] = filtro(st[:, c], lo=25, ordem=2)
    if para_voz:
        st = st * curva_voz(len(st))[:, None]
    st *= 0.89 / max(np.abs(st).max(), 1e-6)
    fim = int(0.9 * SR)
    st[-fim:] *= np.linspace(1, 0, fim)[:, None]
    with wave.open(saida, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())
    print('ok', saida, '%.2f s' % (len(st) / SR), 'pico %.2f rms %.3f' % (np.abs(st).max(), np.sqrt((st ** 2).mean())))


if __name__ == '__main__':
    saida = sys.argv[1] if len(sys.argv) > 1 else os.path.join(AQUI, 'pulo_sfx.wav')
    finalizar(saida, para_voz=False)
    base, ext = os.path.splitext(saida)
    rng = np.random.default_rng(11)                                               # mesmas "sementes" na segunda passada
    finalizar(base + '_para_voz' + ext, para_voz=True)
