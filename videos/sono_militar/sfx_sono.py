"""Efeitos sonoros do Short "Dormir em dois minutos" — design de som em camadas (sem música), tudo sintetizado com numpy e sincronizado com a imagem:
os tempos dos planos vêm de planos.json e a agenda de explosões, mísseis, aviões e rastros vem de eventos.json (ambos exportados da própria cena).
Uso:  python3 sfx_sono.py [saida.wav]      (gera também <saida>_para_voz.wav, com o fundo mais baixo sob a locução do dono do canal)
Camadas: guerra (explosões em camadas com distância/atraso/pan, assobio de míssil, passagem de jatos com efeito Doppler, rajadas e estalos de traçante, fogo, vento, sirene),
silêncio dramático e zumbido no ouvido, comprimidos e cantil, giz no quadro, relógio de parede, quarto à noite (grilos, cronômetro, respiração), lago (água, sapos, canoa)."""
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


# ================================================================== SONS NOVOS DESTE SHORT
import math

EV = json.load(open(os.path.join(AQUI, 'eventos.json')))
CORTES = []                                                                       # (instante, nível, duração): quedas bruscas do volume (silêncio dramático)
JANELAS_VOZ = [(0.1, 8.9), (9.4, 17.6), (18.3, 27.9), (28.6, 37.8), (38.3, 52.9), (53.6, 57.2)]


def explosao(tam=2.0, dist=40.0, g=1.0):
    """explosão em camadas: estalo, estrondo grave com queda de tom, corpo, chuva de estilhaços e cauda de rumor; a distância tira os agudos"""
    d = 3.8
    t = T(d)
    n = len(t)
    brilho_ = min(1.0, 1.2 / (1 + dist / 60.0))
    r = np.random.default_rng(int(tam * 977) + int(dist * 13))
    estalo = np.zeros(n)
    m = int(0.14 * SR)
    estalo[:m] = banda(ruido(0.14), 900, 9000)[:m] * ad(m, 0.002, 0.020) * 1.3
    f = 28 + 72 * np.exp(-t * 7.0)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.34 + 0.11 * tam)) * (1 + 0.35 * np.exp(-t * 30))
    corpo = filtro(ruido(d), lo=60, hi=420) * ad(n, 0.004, 0.20 + 0.06 * tam)
    chuva = np.zeros(n)
    for _ in range(int(24 + 12 * tam)):
        ti = 0.12 + r.exponential(0.75)
        if ti > d - 0.2:
            continue
        i = int(ti * SR)
        mm = int(r.uniform(0.006, 0.03) * SR)
        chuva[i:i + mm] += banda(ruido(mm / SR + 0.001), 1200, 6500)[:mm] * np.exp(-np.arange(mm) / (0.004 * SR)) * r.uniform(0.05, 0.30) * np.exp(-ti / 1.6)
    for _ in range(int(2 + tam)):                                              # pedras maiores caindo (baques secos)
        ti = 0.25 + r.exponential(0.6)
        if ti > d - 0.3:
            continue
        i = int(ti * SR)
        b = batida_grave(r.uniform(90, 160), 50, 0.12, 0.03) * r.uniform(0.10, 0.28)
        chuva[i:i + len(b)] += b[:max(0, n - i)][:len(b)]
    cauda = filtro(ruido(d), lo=35, hi=170) * np.exp(-t / 1.35) * np.minimum(t / 0.15, 1) * 0.85
    x = estalo + boom * 1.15 + corpo * 0.75 + chuva + cauda
    x = filtro(x, hi=700 + 9000 * brilho_)
    return x / (np.abs(x).max() + 1e-9) * min(1.0, 0.55 + 0.25 * tam) * g


def assobio_missil(d=0.9, g=1.0):
    """míssil chegando: assobio que sobe e ruído de ar que cresce até o impacto"""
    t = T(d)
    p = t / d
    f = 520 + 1500 * p ** 1.6
    ton = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.20 + np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * 0.07
    ar = banda(ruido(d), 700, 5200) * p ** 1.5 * 0.55
    return (ton * p ** 1.3 + ar) * np.minimum((d - t) / 0.01, 1) * g


def jato(d=2.2, g=1.0):
    """passagem de caça: rugido largo com sino de volume, turbina aguda com efeito Doppler e um fundo grave"""
    t = T(d)
    p = t / d
    dop = 1.0 + 0.20 * np.tanh((0.5 - p) * 8.0)
    amp = (1.0 / (1 + ((p - 0.5) * 6.0) ** 2)) ** 0.9
    ton = np.sin(2 * np.pi * np.cumsum(1350 * dop) / SR) * 0.10 + np.sin(2 * np.pi * np.cumsum(2700 * dop) / SR) * 0.04
    rug = banda(ruido(d), 120, 3200) * 0.55 + filtro(ruido(d), lo=40, hi=240) * 1.1
    return (rug + ton * 2.0) * amp * np.minimum(t / 0.05, 1) * np.minimum((d - t) / 0.12, 1) * g


def estalo_tracante(g=1.0):
    """projétil supersônico passando: estalo seco e um 'zip' que cai de tom"""
    d = 0.22
    t = T(d)
    z = np.sin(2 * np.pi * np.cumsum(5200 - 4200 * (t / d)) / SR) * np.exp(-t / 0.05) * 0.12
    return (banda(ruido(d), 2800, 10000) * ad(int(d * SR), 0.001, 0.008) * 1.0 + z) * g


def tiro(g=1.0, dist=1.0):
    """disparo de fuzil: estalo + baque; `dist` > 1 afasta (menos agudos)"""
    d = 0.5
    t = T(d)
    n = len(t)
    c = np.zeros(n)
    m = int(0.12 * SR)
    c[:m] = banda(ruido(0.12), 600, 7500)[:m] * ad(m, 0.001, 0.022)
    x = c * 1.1 + batida_grave(120, 58, d, 0.07) * 0.8 + filtro(ruido(d), lo=90, hi=900) * ad(n, 0.003, 0.09) * 0.35
    return filtro(x, hi=9000 / (1 + (dist - 1) * 0.6)) * g


def rajada(n=6, passo=0.085, g=1.0, dist=1.0):
    d = n * passo + 0.5
    x = np.zeros(int(d * SR))
    for k in range(n):
        s = tiro(1.0 - 0.06 * k + rng.uniform(-0.06, 0.06), dist)
        i = max(0, int((k * passo + rng.uniform(-0.006, 0.006)) * SR))
        m = min(len(s), len(x) - i)
        if m > 0:
            x[i:i + m] += s[:m]
    return x * g


def queda_corpo(g=1.0):
    """corpo e equipamento caindo na laje: baque grave, tecido, fivelas e cantil"""
    d = 0.9
    n = int(d * SR)
    x = np.zeros(n)
    b = batida_grave(88, 44, 0.28, 0.08)
    x[:len(b)] += b * 1.0
    x += filtro(ruido(d), lo=120, hi=1400) * ad(n, 0.004, 0.09) * 0.55
    q = equipamento(0.7, 0.9)
    x[int(0.04 * SR):int(0.04 * SR) + len(q)] += q[:n - int(0.04 * SR)] * 0.8
    return x * g


def queda_fuzil(g=1.0):
    d = 1.0
    n = int(d * SR)
    x = np.zeros(n)
    for ti, f0, ga in ((0.0, 1800, 0.7), (0.13, 1300, 0.55), (0.30, 2100, 0.35), (0.42, 1500, 0.25)):
        mb = metal_bate(f0, 0.5, ga)
        i = int(ti * SR)
        x[i:i + len(mb)] += mb[:n - i]
    return x * g


def comprimidos_chacoalham(d, g=1.0):
    return rattle(d, 0.55, 95, (3200, 9500)) * g


def tampa_lata(g=1.0):
    return somar(metal_bate(2600, 0.35, 0.55), tom(3300, 0.12, ((1, .6), (2.8, .3)), 0.025) * 0.4) * g


def gole(g=1.0):
    d = 0.5
    x = np.zeros(int(d * SR))
    for ti, f0 in ((0.04, 150), (0.22, 122)):
        i = int(ti * SR)
        m = int(0.14 * SR)
        s = np.sin(2 * np.pi * np.cumsum(np.linspace(f0, f0 * 0.55, m)) / SR) * np.hanning(m) * 0.5
        s += banda(ruido(m / SR), 200, 1400) * np.hanning(m) * 0.35
        x[i:i + m] += s
    return x * g


def agua_cantil(d, g=1.0):
    t = T(d)
    mod = 0.5 + 0.5 * np.sin(2 * np.pi * 17 * t + 1.7 * np.sin(2 * np.pi * 3.1 * t))
    return banda(ruido(d), 450, 3400) * mod * np.sin(np.pi * t / d) ** 0.6 * g * 0.7


def giz(d, g=1.0):
    """giz no quadro: riscos curtos de atrito agudo, com trepidação"""
    n = int(d * SR)
    x = np.zeros(n)
    t = 0.0
    while t < d - 0.05:
        dur = rng.uniform(0.07, 0.20)
        m = int(dur * SR)
        f = rng.uniform(2400, 5200)
        s = banda(ruido(dur), f * 0.6, f * 1.4)[:m] * np.hanning(m) ** 0.7
        s = s * (1 + 0.6 * np.sin(2 * np.pi * rng.uniform(40, 110) * np.arange(m) / SR))
        i = int(t * SR)
        k = min(m, n - i)
        if k > 0:
            x[i:i + k] += s[:k]
        t += dur + rng.uniform(0.02, 0.09)
    return x * g * 0.8


def agua_lago(d, g=1.0):
    n = int(d * SR)
    t = T(d)
    base = filtro(ruido(d), lo=120, hi=800)
    mod = 0.55 + 0.45 * np.sin(2 * np.pi * 0.33 * t + 1.0 + 0.8 * np.sin(2 * np.pi * 0.07 * t))
    x = base * mod * 0.7
    for _ in range(int(d * 0.7)):                                                  # gotas e marolinhas no casco
        i = int(rng.uniform(0, max(d - 0.3, 0.1)) * SR)
        s = tom(rng.uniform(300, 520), 0.22, ((1, 1), (2, .3)), 0.07) * 0.18
        k = min(len(s), n - i)
        if k > 0:
            x[i:i + k] += s[:k]
    return x * g


def sapos(d, g=1.0):
    n = int(d * SR)
    x = np.zeros(n)
    for _ in range(int(d * 1.6)):
        i = int(rng.uniform(0, max(d - 0.4, 0.1)) * SR)
        f = rng.uniform(180, 330)
        for k in range(int(rng.integers(2, 5))):
            s = tom(f * (1 + 0.05 * k), 0.09, ((1, 1), (2, .5), (3, .2)), 0.035) * 0.5
            j = i + int(k * 0.11 * SR)
            m = min(len(s), n - j)
            if m > 0:
                x[j:j + m] += s[:m]
    return filtro(x, lo=120, hi=2200) * g


def cronometro_tique(d, hz=6.0, g=1.0):
    n = int(d * SR)
    x = np.zeros(n)
    for ti in np.arange(0, d - 0.02, 1.0 / hz):
        c = banda(ruido(0.012), 2500, 7500) * ad(int(0.012 * SR), 0.0008, 0.004) * 0.6
        c = somar(c, tom(1900, 0.02, ((1, 1), (2.3, .4)), 0.005) * 0.25)
        i = int(ti * SR)
        m = min(len(c), n - i)
        if m > 0:
            x[i:i + m] += c[:m]
    return x * g


def respirar_dormindo(d, ritmo=0.2, g=1.0, rasp=0.25):
    """respiração de quem dorme: inspira e expira longas, com um leve ronco grave"""
    n = int(d * SR)
    t = T(d)
    base = respirar(d, ritmo, 1.0, 0.0)
    fase = 0.5 + 0.5 * np.sin(2 * np.pi * ritmo * t - 1.2)
    ron = filtro(ruido(d), lo=55, hi=230) * fase ** 2 * rasp
    return (base + ron) * g


def floresta_ar(d, g=1.0):
    """ar da noite no lago: vento fraquinho e um fundo de insetos distantes"""
    return (vento2(d, 0.35, 360) + filtro(grilos(d, 0.35), lo=2500, hi=7000) * 0.5) * g


def mov(sig, i0, i1):
    return sig


def silencio_corte(t, nivel, dur):
    CORTES.append((t, nivel, dur))


def zumbido_ouvido(d, f=4300.0, g=1.0):
    t = T(d)
    return (np.sin(2 * np.pi * f * t) * 0.30 + np.sin(2 * np.pi * f * 1.5 * t) * 0.04) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.4 * t)) * np.minimum(t / 0.3, 1) * np.minimum((d - t) / 0.4, 1) * g


def coracao(t_ini, t_fim, bpm0, g, rv='guarita', bpm1=None):
    """batimentos entre dois instantes; o ritmo muda linearmente de bpm0 para bpm1"""
    bpm1 = bpm0 if bpm1 is None else bpm1
    tt = t_ini
    while tt < t_fim:
        k = (tt - t_ini) / max(t_fim - t_ini, 1e-6)
        bpm = bpm0 + (bpm1 - bpm0) * k
        add(batimento(bpm, 1.0)[:int(0.45 * SR)], tt, g, 0.0, rv, 0.2)
        tt += 60.0 / bpm


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


# ================================================================== ROTEIRO SONORO
def pos_ouvinte(t):
    """onde está o 'ouvido' em cada trecho: guarita (0,0), ninho (150,-1) ou mesa dos comprimidos (-150,0)"""
    if 9.0 <= t < 18.6:
        return 150.0, -1.0
    if 18.6 <= t < 28.4:
        return -150.0, 0.0
    return 0.0, 0.0


def lim(x, a=0.9):
    return max(-a, min(a, x))


def tiroteio_longe(d, g=1.0):
    """disparos esparsos ao longe, em surtos (armas leves dos dois lados)"""
    n = int(d * SR)
    x = np.zeros(n)
    t = rng.uniform(0.0, 0.4)
    while t < d - 0.3:
        surto = int(rng.integers(1, 6))
        for k in range(surto):
            s_ = tiro(rng.uniform(0.04, 0.16), rng.uniform(4.0, 7.0))
            i = int((t + k * rng.uniform(0.07, 0.13)) * SR)
            m = min(len(s_), n - i)
            if m > 0:
                x[i:i + m] += s_[:m]
        t += rng.uniform(0.25, 0.9)
    return x * g


def guerra_bed(d, g=1.0):
    """fundo da guerra: vento, fogo estalando longe, tiroteio esparso e um rumor grave que ondula"""
    return (vento2(d, 0.45, 300) + crepitar(d, 0.30, 40) + tiroteio_longe(d, 1.0) * 0.8 + filtro(ruido(d), lo=30, hi=130) * 0.30 * (0.7 + 0.3 * lento(d, 0.6))) * g


def montar():
    # ---------------------------------------------------------------- 0) AGENDA DE GUERRA (tempos e posições vêm da própria cena)
    for e in EV['eventos']:
        t = e['t']
        Lx, Lz = pos_ouvinte(t)
        dx, dz = e['x'] - Lx, e['z'] - Lz
        dist = max(6.0, math.hypot(dx, dz))
        pan = lim(dx / 55.0)
        gv = (e['tam'] ** 0.55) / (1 + dist / 38.0) * 1.55
        if 18.6 <= t < 28.4:
            gv *= 0.55
        x = explosao(e['tam'], dist, 1.0)
        if t >= 53.0:
            x = abafar(x, 1500)
            gv *= 0.70
        rv = 'guarita' if (dist < 25 and t < 9.0) else 'campo'
        add(x, t + dist / 343.0 * 0.45, gv, pan, rv, 0.30 if rv == 'campo' else 0.4)
        if dist < 45 and e['tam'] > 1.5 and (t < 9.0 or t >= 53.0):                  # estilhaços zunindo
            for kz in range(2):
                add(estalo_tracante(1.0), t + 0.12 + 0.2 * kz + dist / 343.0 * 0.45, 0.16, lim(pan + (kz - 0.5) * 0.6), 'campo', 0.25)
        if dist < 40 and e['tam'] > 1.2 and t < 9.0:                                # poeira caindo do telhado da guarita
            add(banda(ruido(1.1), 3000, 9000) * ad(int(1.1 * SR), 0.05, 0.35) * 0.10, t + 0.15, 1.0, 0.0, 'guarita', 0.3)
    for m in EV['misseis']:
        p0, p1 = lim(m['de'][0] / 80.0), lim(m['para'][0] / 80.0)
        addpan(assobio_missil(m['dur']), m['t'], 0.55 if m['t'] < 53 else 0.35, p0, p1, 'campo', 0.3)
    for a_ in EV['avioes']:
        addpan(jato(a_['dur']), a_['t'], 0.9, lim(a_['de'][0] / 90.0), lim(a_['para'][0] / 90.0), 'campo', 0.4)
    # rastros de traçante: estalos e rajadas ao longe (agrupados por proximidade no tempo)
    rs = sorted([r for r in EV['rastros'] if r['vel'] < 500], key=lambda r: r['t'])
    grupos, cur = [], []
    for r in rs:
        if cur and r['t'] - cur[-1]['t'] > 0.3:
            grupos.append(cur); cur = []
        cur.append(r)
    if cur:
        grupos.append(cur)
    for gr in grupos:
        Lx = pos_ouvinte(gr[0]['t'])[0]
        pan = lim((gr[0]['de'][0] - Lx) / 60.0)
        add(rajada(len(gr) + 4, 0.07, 0.42, 3.0), gr[0]['t'], 1.0, pan, 'campo', 0.45)
        for r in gr:
            add(estalo_tracante(1.0), r['t'] + 0.04, 0.30, lim(pan * 0.6), 'campo', 0.25)

    # ---------------------------------------------------------------- A) GANCHO (0 a 9 s): o soldado dorme e a guerra explode em volta
    for id_, gg in (('olhos', 0.62), ('revela', 0.62), ('ceu', 0.66), ('orbita', 0.62)):
        cama(id_, lambda dd: guerra_bed(dd, 1.0), gg, 0.0, 'campo', 0.3, 0.15)
    a, d = seg('olhos')
    add(respirar_dormindo(2.4, 0.42, 1.0, 0.40), a, 0.46, 0.05, 'guarita', 0.2)                    # respiração de quem dorme, bem perto do rosto
    coracao(a, 4.5, 60, 0.20, 'guarita', 56)
    add(equipamento(1.4, 0.5), 0.3, 0.30, -0.1, 'guarita', 0.3)                                    # fivelas e capacete reagem ao estrondo
    add(whoosh(1.4, 250, 2200), t0('revela', 0.05), 0.14, 0.0, 'guarita', 0.2)                      # a câmera recua
    add(riser(2.2, 120, 2500, 0.6, 0.2), t0('ceu', 0.2), 0.16, 0.0, 'campo', 0.3)
    add(radio2(1.4, 0.5), 2.0, 0.07, 0.4, 'guarita', 0.3); add(radio2(1.4, 0.5), 6.3, 0.07, -0.4, 'guarita', 0.3)
    add(sirene2(9.0, 4.5, 0.0, 0.3), 0.0, 0.07, 0.3, 'campo', 0.6)                                  # sirene antiaérea ao longe
    add(murmurio2(3.0, 0.6, 3), 3.5, 0.06, -0.3, 'campo', 0.5)                                      # gritos distantes
    add(rangido(1.4, 140, 90, 0.5), t0('orbita', 0.2), 0.12, 0.2, 'guarita', 0.4)                   # a lanterna balança no teto de chapa
    add(respirar_dormindo(3.4, 0.30, 1.0, 0.3), t0('orbita', 0.0), 0.18, 0.0, 'guarita', 0.25)

    # ---------------------------------------------------------------- B) O ATIRADOR (9 a 18 s)
    cama('ninho', lambda dd: guerra_bed(dd, 1.0), 0.50, 0.0, 'campo', 0.35, 0.15)
    a, d = seg('ninho')
    add(equipamento(1.6, 0.6), a + 0.2, 0.25, -0.2, 'campo', 0.3)                                   # couro e correias
    add(clack(0.8), a + 1.35, 0.30, 0.1, 'campo', 0.25)                                             # ferrolho
    add(respirar(2.2, 0.55, 0.9, 0.1), a, 0.20, -0.1, 'campo', 0.2)
    add(riser(1.6, 200, 2500, 0.5, 0.2), a + 0.6, 0.10, 0.0, 'campo', 0.3)
    # mira da luneta: som "de túnel" — abafado, coração lento, respiração pesada, zumbido; as pálpebras caem em piscadas cada vez mais longas
    a, d = seg('mira')
    cama('mira', lambda dd: abafar(guerra_bed(dd, 1.0), 900), 0.32, 0.0, 'campo', 0.3, 0.15)
    coracao(a, a + d, 62, 0.42, 'guarita', 46)
    add(respirar_dormindo(d, 0.30, 1.0, 0.2), a, 0.34, 0.0, 'guarita', 0.25)
    add(zumbido_ouvido(d, 3800, 0.10), a, 1.0, 0.0, None)
    add(clique2(0.5, 'botao'), a + 0.35, 0.40, 0.1, 'guarita', 0.2)
    for tc, nv, du in ((11.60, 0.22, 0.34), (12.20, 0.18, 0.46), (12.66, 0.12, 0.60), (13.12, 0.08, 0.45)):
        silencio_corte(tc, nv, du)
    # rosto cansado: respiração, esfregar o olho, bocejo
    a, d = seg('olho')
    cama('olho', lambda dd: guerra_bed(dd, 1.0), 0.40, 0.0, 'campo', 0.3, 0.1)
    add(respirar(d + 0.2, 0.50, 0.9, 0.0), a, 0.34, 0.0, 'guarita', 0.2)
    add(roupa(0.9, 0.9, 1.0), a + 0.45, 0.35, -0.2, 'guarita', 0.2)
    add(banda(ruido(0.8), 500, 3000) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * T(0.8))) * np.hanning(int(0.8 * SR)) * 0.5, a + 0.50, 0.30, -0.1, 'guarita', 0.15)    # pele e luva no olho
    bocejo = voz(0.8, lambda tt: 260 - 110 * tt / 0.8, 'a', resp=0.35, tens=0.2, jit=0.03) * np.hanning(int(0.8 * SR)) ** 0.8
    add(bocejo, a + 0.75, 0.10, 0.0, 'guarita', 0.2)
    # o tiro do atirador inimigo e a tensão até o impacto
    add(tiro(1.0, 4.0), 15.30, 0.62, 0.35, 'campo', 0.55)
    add(riser(1.1, 300, 3500, 0.7, 0.3), 15.32, 0.16, 0.0, 'campo', 0.3)
    add(estalo_tracante(1.0), 16.36, 0.62, 0.1, 'campo', 0.3)
    add(somar(batida_grave(95, 45, 0.35, 0.09) * 1.0, filtro(ruido(0.4), lo=100, hi=2500) * ad(int(0.4 * SR), 0.002, 0.12) * 0.8), 16.40, 0.8, 0.0, 'campo', 0.3)
    add(queda_corpo(1.0), 16.50, 0.60, 0.20, 'campo', 0.3)
    add(queda_corpo(1.0), 16.68, 0.55, -0.25, 'campo', 0.3)
    add(queda_fuzil(1.0), 16.75, 0.50, 0.05, 'campo', 0.3)
    silencio_corte_ = (16.55, 0.10, 1.45)
    silencio_corte(*silencio_corte_)
    add(zumbido_ouvido(2.2, 4200, 0.55), 16.50, 1.0, 0.0, None)
    coracao(16.8, 18.2, 50, 0.32, 'guarita', 46)
    add(whoosh(0.6, 3000, 400), 17.65, 0.12, 0.0, 'campo', 0.2)

    # ---------------------------------------------------------------- C) OS COMPRIMIDOS (18 a 28,2 s)
    for id_, gg in (('lata', 0.30), ('engole', 0.30), ('dias', 0.34), ('olheiras', 0.26)):
        cama(id_, lambda dd: guerra_bed(dd, 1.0), gg, 0.0, 'campo', 0.3, 0.15)
    a, d = seg('lata')
    add(raspa_metal(0.25, 0.5), a + 0.10, 0.30, -0.1, 'guarita', 0.2)
    add(comprimidos_chacoalham(0.7, 1.0), a + 0.30, 0.55, -0.1, 'guarita', 0.2)
    add(comprimidos_chacoalham(0.5, 1.0), a + 1.05, 0.50, -0.1, 'guarita', 0.2)
    add(roupa(2.0, 0.6, 0.6), a, 0.30, 0.1, 'guarita', 0.2)
    add(respirar(2.1, 0.9, 0.5, 0.3), a, 0.20, 0.0, 'guarita', 0.2)
    a, d = seg('engole')
    add(clique2(0.4, 'botao'), a + 0.55, 0.30, 0.0, 'guarita', 0.2)
    add(gole(1.0), a + 0.95, 0.55, 0.0, 'guarita', 0.2)
    add(agua_cantil(0.7, 1.0), a + 1.00, 0.50, 0.15, 'guarita', 0.2)
    add(gole(1.0), a + 1.65, 0.55, 0.0, 'guarita', 0.2)
    add(arfada(0.9), a + 1.88, 0.35, 0.0, 'guarita', 0.2)
    add(metal_bate(1400, 0.3, 0.3), a + 1.95, 0.30, 0.2, 'guarita', 0.2)
    # dias e noites sem dormir: tempo-lapso, risco de giz a cada dia, coração disparando
    a, d = seg('dias')
    for k in range(3):
        tk = a + 1.2 * k
        add(whoosh(1.2, 200, 3500, 1.0), tk, 0.30, (-0.4, 0.4, -0.2)[k], 'campo', 0.2)
        add(passaros2(0.6, 0.8, 1.6), tk, 0.45, -0.1, 'campo', 0.3)
        add(filtro(grilos(0.6, 1.0), lo=1800, hi=7000), tk + 0.6, 0.30, 0.1, 'campo', 0.3)
    for tk in (a + 0.15, a + 1.38, a + 2.58):
        add(giz(0.34, 1.0), tk, 0.50, 0.25, 'guarita', 0.15)
        add(toc(0.6), tk + 0.36, 0.35, 0.25, 'guarita', 0.15)
    add(tictac2(24, 0.15, 0.5), a, 0.18, 0.0, 'campo', 0.2)
    coracao(a, a + d, 108, 0.36, 'guarita', 138)
    add(zumbido_ouvido(d, 4300, 0.10), a, 1.0, 0.0, None)
    add(respirar(d, 1.5, 0.5, 0.6), a, 0.20, 0.0, 'guarita', 0.2)
    a, d = seg('olheiras')
    coracao(a, a + d, 138, 0.52, 'guarita', 152)
    add(zumbido_ouvido(d, 4400, 0.24), a, 1.0, 0.0, None)
    add(zumbido2(d, 0.5, 61.0), a, 0.22, 0.0, 'guarita', 0.2)
    add(riser(d - 0.2, 200, 4000, 0.7, 0.4), a, 0.20, 0.0, 'guarita', 0.2)
    add(respirar(d, 1.7, 0.6, 0.8), a, 0.22, 0.0, 'guarita', 0.2)
    silencio_corte(28.10, 0.0, 0.58)                                                                 # silêncio total antes da sala de aula

    # ---------------------------------------------------------------- D) A ESCOLA DE PRÉ-VOO (28,2 a 38 s): a calma depois do caos
    a0 = P['sala']['t0']
    fim_sala = P['quadro']['t0'] + P['quadro']['dur']
    dd = fim_sala - a0
    add(sala_vazia(dd + 0.2, 0.9), a0 - 0.05, 1.5, 0.0, 'sala', 0.4)
    add(vento2(dd, 0.05, 300), a0, 0.22, 0.0, 'sala', 0.3)
    add(passaros2(dd, 0.45, 0.6), a0, 0.55, -0.6, 'sala', 0.3)                                       # pardais lá fora, pelas janelas
    add(tictac2(int(dd / 1.0), 1.0, 0.6), a0, 0.34, 0.7, 'sala', 0.5)                                # relógio de parede
    for ini, du in ((0.0, 0.8), (1.3, 0.9), (7.6, 0.8), (8.4, 0.7), (9.1, 0.6)):
        add(giz(du, 1.0), a0 + ini, 0.55, -0.1, 'sala', 0.3)
        add(toc(0.6), a0 + ini + du + 0.02, 0.22, -0.1, 'sala', 0.3)
    for tk in (a0 + 8.45, a0 + 8.85):
        add(madeira_estalo(0.6), tk, 0.25, -0.2, 'sala', 0.3)                                        # a ponta do giz/ponteiro bate no 96%
    add(roupa(2.4, 0.5, 0.6), a0 + 0.6, 0.18, 0.2, 'sala', 0.3)
    add(rangido(0.5, 150, 110, 0.4), a0 + 1.8, 0.14, 0.3, 'sala', 0.4)                              # cadeira
    a, d = seg('cadete')
    add(respirar(d, 0.27, 0.6, 0.0), a, 0.30, 0.0, 'sala', 0.25)
    coracao(a, a + d, 72, 0.14, 'sala', 54)
    add(arfada(0.8), a + 1.9, 0.26, 0.0, 'sala', 0.3)
    add(roupa(1.4, 0.6, 0.6), a + 1.2, 0.20, 0.2, 'sala', 0.3)

    # ---------------------------------------------------------------- E) O TESTE NA CAMA (38 a 53,2 s)
    a_c = P['cama']['t0']
    fim_cama = P['cronometro']['t0'] + P['cronometro']['dur']
    dd = fim_cama - a_c
    add(sala_vazia(dd + 0.2, 0.7), a_c - 0.05, 0.85, 0.0, 'quarto', 0.4)
    add(floresta_ar(dd, 1.0), a_c, 0.55, -0.5, 'quarto', 0.3)                                        # a noite lá fora, pela janela
    add(cronometro_tique(dd, 7.0, 1.0), a_c, 0.30, 0.45, 'quarto', 0.3)                              # cronômetro em "câmera acelerada"
    a, d = seg('cama')
    add(respirar(d + 0.3, 0.55, 0.7, 0.1), a, 0.28, 0.0, 'quarto', 0.2)
    add(roupa(1.2, 0.5, 0.8), a + 0.5, 0.20, 0.1, 'quarto', 0.2)
    a, d = seg('rosto')
    add(respirar(d, 0.42, 0.6, 0.0), a, 0.28, 0.0, 'quarto', 0.2)
    add(gole(1.0), a + 0.7, 0.18, 0.0, 'quarto', 0.2)
    add(arfada(1.0), a + 1.5, 0.34, 0.0, 'quarto', 0.2)
    a, d = seg('tronco')
    add(roupa(1.2, 0.8, 1.0), a + 0.2, 0.28, 0.1, 'quarto', 0.2)
    add(rangido(0.9, 80, 55, 0.5), a + 0.6, 0.20, 0.0, 'quarto', 0.3)
    add(respirar_dormindo(2.3, 0.22, 1.0, 0.25), a + 0.1, 0.42, 0.0, 'quarto', 0.2)
    a, d = seg('pernas')
    add(roupa(1.4, 0.8, 1.0), a + 0.2, 0.28, 0.0, 'quarto', 0.2)
    add(rangido(0.8, 70, 50, 0.5), a + 0.6, 0.20, 0.0, 'quarto', 0.3)
    add(batida_grave(70, 45, 0.2, 0.06) * 0.5, a + 1.45, 0.30, 0.0, 'quarto', 0.2)
    add(respirar_dormindo(2.1, 0.18, 1.0, 0.30), a, 0.40, 0.0, 'quarto', 0.2)
    # a imagem mental: canoa no lago (corte "onírico": subgrave suave + cintilação aguda)
    a, d = seg('canoa')
    add(sub_boom(55, 30, 2.2, 1.0), a - 0.05, 0.34, 0.0, 'lago', 0.5)
    add(riser(0.9, 3000, 9000, 0.5, 0.0), a - 0.8, 0.14, 0.0, 'lago', 0.3)
    cama('canoa', lambda dd: agua_lago(dd, 1.0), 0.95, 0.0, 'lago', 0.45, 0.2)
    cama('canoa', lambda dd: sapos(dd, 1.0) + floresta_ar(dd, 1.0), 0.70, -0.2, 'lago', 0.5, 0.2)
    add(rangido(1.2, 90, 70, 0.4), a + 1.0, 0.16, 0.0, 'lago', 0.4)
    add(respirar_dormindo(d, 0.14, 1.0, 0.2), a, 0.22, 0.0, 'lago', 0.3)
    a, d = seg('cronometro')
    add(respirar_dormindo(d + 0.2, 0.20, 1.0, 0.40), a, 0.46, -0.1, 'quarto', 0.2)
    add(cronometro_tique(d, 7.0, 1.0), a, 0.10, 0.45, 'quarto', 0.3)
    add(clique2(1.0, 'botao'), a + d - 0.08, 0.60, 0.45, 'quarto', 0.3)                              # o cronômetro para

    # ---------------------------------------------------------------- F) O FECHO (53,2 a 57,8 s): a guerra volta, mas ele continua dormindo
    for id_, gg in (('volta', 0.48), ('fim', 0.40)):
        cama(id_, lambda dd: abafar(guerra_bed(dd, 1.0), 1700), gg, 0.0, 'campo', 0.3, 0.15)
    a, d = seg('volta')
    add(respirar_dormindo(d + 0.3, 0.30, 1.0, 0.4), a, 0.34, 0.05, 'guarita', 0.2)
    coracao(a, a + d, 58, 0.20, 'guarita', 52)
    add(whoosh(1.6, 300, 2000), a + 0.9, 0.12, 0.0, 'guarita', 0.2)
    a, d = seg('fim')
    add(respirar_dormindo(d + 0.2, 0.28, 1.0, 0.4), a, 0.36, 0.05, 'guarita', 0.2)
    add(sub_boom(50, 30, 1.6, 1.0), a + 0.40, 0.22, 0.0, 'guarita', 0.4)                              # o cartão final assenta
    add(toc(0.7), a + 0.42, 0.22, 0.0, 'guarita', 0.2)


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
    saida = sys.argv[1] if len(sys.argv) > 1 else os.path.join(AQUI, 'sono_sfx.wav')
    finalizar(saida, para_voz=False)
    base, ext = os.path.splitext(saida)
    rng = np.random.default_rng(11)                                               # mesmas "sementes" na segunda passada
    finalizar(base + '_para_voz' + ext, para_voz=True)
