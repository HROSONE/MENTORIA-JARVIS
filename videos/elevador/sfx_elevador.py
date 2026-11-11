"""Efeitos sonoros do Short "O elevador" (sem música): tudo sintetizado com numpy a partir dos tempos dos planos (planos.json, gerado por exportar_planos.js).
Uso:  python3 sfx_elevador.py [saida.wav]
Camadas: zumbido da cabine, motor e parada seca, grade de latão, botões, telefone mudo, batidas, relógio de pé, tempo-lapso (dia/noite), campainha e eco,
sirene e buzina, pé-de-cabra, madeira estalando, manta térmica, rua. Respirações, soluços e gritos são sintéticos (vozes de apoio): a locução é do dono do canal."""
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




# ------------------------------------------------------------------ sons novos deste Short
def reverb(x, rt=1.2, molhado=0.5, hi=4500, atraso=0.012):
    n = len(x)
    ir = ruido(rt * 1.4) * np.exp(-T(rt * 1.4) / (rt * 0.33))
    ir = filtro(ir, hi=hi)
    ir[:int(atraso * SR)] = 0
    rev = np.fft.irfft(np.fft.rfft(x, n + len(ir)) * np.fft.rfft(ir, n + len(ir)), n + len(ir))[:n]
    return x + norm(rev, 1.0) * np.abs(x).max() * molhado


def zumbido(d, f=60.0, g=1.0):
    """zumbido elétrico da cabine/casa: fundamental e harmônicas com leve oscilação"""
    t = T(d)
    x = sum(a * np.sin(2 * np.pi * f * k * t + rng.uniform(0, 6.28)) for k, a in ((1, 1.0), (2, 0.5), (3, 0.28), (5, 0.12), (7, 0.06)))
    x *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.31 * t + rng.uniform(0, 6))
    return x * g * 0.12


def rangido(d, f0=140.0, f1=90.0, g=1.0):
    t = T(d)
    f = (f0 + (f1 - f0) * t / d) * (1 + filtro(ruido(d), hi=22) * 9.0)
    ph = np.cumsum(f) / SR * 2 * np.pi
    s = sum(np.sin(k * ph) / k for k in range(1, 10))
    return filtro(s, lo=110, hi=2400) * np.sin(np.pi * t / d) ** 0.7 * g * 0.35


def crepitar(d, g=1.0, dens=60):
    n = int(d * SR)
    x = np.zeros(n)
    for k in range(int(d * dens)):
        i = int(rng.uniform(0, d - 0.02) * SR)
        m = int(rng.uniform(0.001, 0.008) * SR)
        x[i:i + m] += banda(ruido(0.01), 1500, 9000)[:m] * np.exp(-np.arange(m) / (0.0018 * SR)) * rng.uniform(0.2, 1.0)
    return x * g


def motor_elev(d, f0=48.0, f1=92.0, g=1.0):
    t = T(d)
    f = f0 + (f1 - f0) * np.clip(t / d, 0, 1) ** 1.2
    ph = np.cumsum(f) / SR * 2 * np.pi
    x = sum(a * np.sin(k * ph + 0.4 * k) for k, a in ((1, 1.0), (2, 0.55), (3, 0.4), (4, 0.25), (6, 0.16)))
    wh = np.sin(2 * np.pi * np.cumsum(1500 + 1800 * np.clip(t / d, 0, 1)) / SR) * 0.10
    ar = filtro(ruido(d), lo=180, hi=1100) * 0.18
    return (x * 0.20 + wh + ar) * np.minimum(t / 0.12, 1) * g


def clique(g=1.0):
    return somar(banda(ruido(0.03), 1500, 6500) * ad(int(0.03 * SR), 0.0005, 0.006), tom(2300, 0.05, ((1, 0.4),), 0.012) * 0.3) * g


def clack(g=1.0):
    return somar(banda(ruido(0.1), 1200, 6000) * ad(int(0.1 * SR), 0.001, 0.02) * 0.9, tom(900, 0.2, ((1, 0.6), (2.6, 0.3)), 0.04) * 0.5, 0.5 * batida_grave(160, 80, 0.12, 0.03)) * g


def grade_desliza(d, g=1.0):
    n = int(d * SR)
    x = np.zeros(n)
    for k in range(int(d * 90)):
        i = int(rng.uniform(0, max(d - 0.03, 0.01)) * SR)
        f = rng.uniform(2200, 6500)
        m = min(int(0.03 * SR), n - i)
        x[i:i + m] += tom(f, 0.03, ((1, 0.5), (2.1, 0.25)), 0.012)[:m] * rng.uniform(0.2, 0.8)
    x += banda(ruido(d), 600, 3500) * 0.16 * np.sin(np.pi * np.arange(n) / n)
    return x * g * 0.5


def ding(f=1318.0, g=1.0):
    return tom(f, 1.3, ((1, 1.0), (2, 0.3), (3, 0.12)), 0.4) * g


def parada_seca():
    n = int(2.0 * SR)
    x = np.zeros(n)
    cl = somar(batida_grave(72, 32, 0.8, 0.22) * 1.0, banda(ruido(0.5), 140, 1300) * ad(int(0.5 * SR), 0.002, 0.10) * 0.9)
    x[:len(cl)] += cl
    mm = metal_amassando(0.5, 0.7); x[:len(mm)] += mm * 0.6
    rg = rangido(1.0, 150, 70, 1.0); x[int(0.05 * SR):int(0.05 * SR) + len(rg)] += rg
    cr = crepitar(0.9, 0.8, 70); x[int(0.10 * SR):int(0.10 * SR) + len(cr)] += cr
    x[:int(0.4 * SR)] += tom(1800, 0.4, ((1, 0.3), (2.7, 0.2)), 0.07) * 0.25
    return x


def tique_taque(n_ticks, gap, g=1.0):
    """relógio de pé: tique agudo e taque grave alternados"""
    d = n_ticks * gap + 0.3
    x = np.zeros(int(d * SR))
    for k in range(n_ticks):
        i = int(k * gap * SR)
        f = 1700 if k % 2 == 0 else 1250
        s = somar(banda(ruido(0.04), 900, 5000) * ad(int(0.04 * SR), 0.0006, 0.007), tom(f, 0.08, ((1, 0.5), (2.2, 0.3)), 0.02) * 0.6, 0.4 * batida_grave(260, 130, 0.06, 0.012))
        x[i:i + len(s)] += s[:len(x) - i]
    return x * g


def toc(g=1.0):
    return somar(tom(190, 0.2, ((1, 1.0), (2.1, 0.4)), 0.05), 0.6 * banda(ruido(0.1), 300, 1800) * ad(int(0.1 * SR), 0.001, 0.02)) * g


def buzina_ar(d=0.9, g=1.0):
    t = T(d)
    x = sum(np.sin(2 * np.pi * f * k * t) / k for f in (370.0, 466.0) for k in range(1, 6))
    return np.tanh(x * 0.6) * np.minimum(t / 0.03, 1) * np.minimum((d - t) / 0.08, 1) * g * 0.5


def sirene_doppler(d, tpico, base=0.0, g=1.0):
    t = T(d)
    k = 1.07 - 0.14 / (1 + np.exp(-(t - tpico) * 5.0))
    f = (900 + 450 * np.sin(2 * np.pi * (t + base) / 3.4 - 1.4)) * k
    ph = np.cumsum(f) / SR * 2 * np.pi
    x = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
    env = 1.0 / (1 + ((t - tpico) / 1.3) ** 2)
    return np.tanh(x * 1.6) * 0.5 * env * np.minimum(t / 0.1, 1) * g


def diesel(d, g=1.0):
    m = motor(d, lambda t: 760 + 40 * np.sin(2 * np.pi * 1.7 * t), 0.0, 0.5, 1.8, 6)
    return filtro(m, hi=900) * g


def freio_ar(d=0.9, g=1.0):
    n = int(d * SR)
    x = banda(ruido(d), 2500, 9000) * ad(n, 0.01, d * 0.35) * 0.6
    x += banda(ruido(d), 400, 2000) * ad(n, 0.01, d * 0.2) * 0.3
    return x * g


def amassa_manta(d, g=1.0):
    n = int(d * SR)
    x = np.zeros(n)
    for k in range(int(d * 38)):
        i = int(rng.uniform(0, max(d - 0.06, 0.01)) * SR)
        m = int(rng.uniform(0.01, 0.05) * SR)
        x[i:i + m] += banda(ruido(0.06), 3000, 12000)[:m] * np.exp(-np.arange(m) / (0.010 * SR)) * rng.uniform(0.2, 1.0)
    return x * g


def madeira_estalo(g=1.0):
    n = int(0.9 * SR)
    x = np.zeros(n)
    m0 = int(0.05 * SR)
    x[:m0] += banda(ruido(0.05), 400, 6000)[:m0] * ad(m0, 0.0005, 0.01) * 1.2
    x[:int(0.5 * SR)] += batida_grave(120, 55, 0.5, 0.12) * 0.8
    for k in range(16):
        i = int(rng.uniform(0.02, 0.45) * SR); m = int(0.012 * SR)
        x[i:i + m] += banda(ruido(0.012), 1000, 7000)[:m] * np.exp(-np.arange(m) / (0.003 * SR)) * rng.uniform(0.2, 0.8)
    return x * g


def raspa_metal(d, g=1.0):
    t = T(d)
    x = banda(ruido(d), 700, 4500) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t))
    x += np.sin(2 * np.pi * np.cumsum(900 + 500 * t / d) / SR) * 0.08
    return x * np.sin(np.pi * t / d) ** 0.6 * g * 0.5


def murmurio(d, g=1.0, vozes=2):
    """vozes ao longe, sem palavras: pulsos silábicos com formantes"""
    t = T(d)
    out = np.zeros_like(t)
    for v in range(vozes):
        f0 = rng.uniform(95, 210)
        f = f0 * (1 + 0.08 * np.sin(2 * np.pi * rng.uniform(0.7, 1.4) * t) + 0.03 * np.sin(2 * np.pi * 5.5 * t))
        ph = np.cumsum(f) / SR * 2 * np.pi
        gl = sum(np.sin(k * ph) / k ** 1.1 for k in range(1, 18))
        sil = np.maximum(0, np.sin(2 * np.pi * rng.uniform(3.2, 5.0) * t + rng.uniform(0, 6))) ** 1.3 * (0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(0.4, 0.9) * t + rng.uniform(0, 6)))
        form = banda(gl, 500, 900) + 0.6 * banda(gl, 1200, 1800) + 0.3 * banda(gl, 2400, 3200)
        out += form * sil
    return out * g * 0.3


def trafego(d, g=1.0):
    t = T(d)
    x = filtro(ruido(d), lo=40, hi=260) * (0.6 + 0.4 * np.sin(2 * np.pi * t / 7.3 + rng.uniform(0, 6)))
    for k in range(int(d / 3.5)):
        i = int(rng.uniform(0, d) * SR)
        m = int(1.6 * SR)
        j = min(m, len(x) - i)
        if j > 0:
            x[i:i + j] += filtro(ruido(1.6), lo=60, hi=900)[:j] * np.sin(np.pi * np.arange(j) / m) ** 2 * rng.uniform(0.15, 0.4)
    return x * g


def passaros(d, g=1.0):
    n = int(d * SR)
    x = np.zeros(n)
    for k in range(int(d * 3.2)):
        i = int(rng.uniform(0, max(d - 0.4, 0.01)) * SR)
        for j in range(rng.integers(2, 6)):
            dur = rng.uniform(0.04, 0.09)
            tt = T(dur)
            f = rng.uniform(2600, 4800) + rng.uniform(-900, 900) * tt / dur
            s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / dur) ** 1.2
            ii = i + int(j * (dur + 0.045) * SR)
            if ii + len(s) < n:
                x[ii:ii + len(s)] += s * 0.05
    return x * g


def abafar(x, hi=700):
    return filtro(x, hi=hi, ordem=2) * 1.25


def seg(id, extra=0.0):
    return P[id]['t0'], P[id]['dur'] + extra


# ------------------------------------------------------------------ roteiro sonoro
def cama(id, sinal, g=1.0, pan=0.0, extra=0.0, fade=0.12):
    """coloca uma cama sonora cobrindo o plano `id` (com entrada/saída suaves)"""
    a, d = seg(id, extra)
    n = len(sinal)
    env = np.minimum(1, np.minimum(np.arange(n) / (fade * SR), (n - np.arange(n)) / (fade * SR)))
    add(sinal * env, a, g, pan)


def montar():
    # ---------- ATO 1 ----------
    # 0: gancho, a cabine: zumbido, ar do poço, respiração rápida; a lâmpada crepita no fim e corta
    a, d = seg('grade')
    add(zumbido(d, 60, 0.9), a, 0.6); add(vento(d, 0.05, 260), a, 1.0); add(respiracao(d, 0.7), a, 0.34, 0.05)
    add(rangido(1.2, 95, 72, 0.6), a + 0.3, 0.18, -0.2)
    add(crepitar(0.45, 1.0, 130), a + 1.22, 0.55, 0.0)
    # 1: a casa de bonecas, entardecer: um estrondo grave no corte e a cidade ao longe
    a, d = seg('casa')
    add(batida_grave(62, 30, 1.4, 0.5) * 1.0, a, 0.7); add(banda(ruido(0.5), 60, 500) * ad(int(0.5 * SR), 0.004, 0.18), a, 0.25)
    cama('casa', trafego(d, 0.8) + vento(d, 0.12, 300), 0.5); cama('casa', zumbido(d, 50, 0.6), 0.45)
    add(sirene_doppler(d, d * 0.8, 0.0, 0.5), a, 0.05, 0.3)
    # 2: fachada, rua ao entardecer
    a, d = seg('fachada')
    cama('fachada', trafego(d, 1.0) + vento(d, 0.14, 380), 0.55)
    add(motor(1.6, lambda t: 1500 + 700 * np.clip(t / 1.6, 0, 1)), a + 0.1, 0.07, -0.4); add(whoosh(0.9, 220, 1500), a + 0.55, 0.12, 0.3)
    add(sirene_doppler(2.2, 1.6, 0.9, 0.5), a, 0.04, -0.4)
    # 3: faxina: sala vazia, relógio de pé, passos de madeira, cesto de plástico rangendo
    a, d = seg('faxina')
    cama('faxina', zumbido(d, 50, 0.5) + filtro(ruido(d), lo=120, hi=900) * 0.02, 0.5)
    add(tique_taque(int(d / 0.5), 0.5, 0.7), a, 0.28, 0.25)
    for k in range(int(d / 0.52)):
        add(passo('madeira', 1.0), a + 0.2 + k * 0.52, 0.20, 0.1)
    for k in range(3):
        add(rangido(0.25, 900, 700, 0.5) * 0.8, a + 0.3 + k * 0.7, 0.07, 0.1)
    # 4: o SUV dos donos dá a partida e sai; luzes vermelhas, rua vazia
    a, d = seg('donos')
    cama('donos', trafego(d, 0.9) + vento(d, 0.12, 380), 0.5)
    add(motor(d + 0.2, lambda t: 850 + 3200 * np.clip((t - 0.1) / 1.7, 0, 1) ** 1.3, 0.0, 1.0, 1.3, 6) * np.minimum(1, (d + 0.2 - T(d + 0.2)) / 0.5), a - 0.05, 0.30, 0.2)
    add(chiado_pneu(0.6, 1300, 0.6), a + 0.9, 0.15, 0.3); add(whoosh(0.8, 300, 1800), a + 0.7, 0.16, 0.3)
    # 5: ela fecha a grade de latão e aperta o botão
    a, d = seg('porta_grade')
    cama('porta_grade', zumbido(d, 55, 0.7) + filtro(ruido(d), lo=100, hi=700) * 0.015, 0.45)
    add(grade_desliza(1.0, 1.0), a + 0.2, 0.55, -0.1); add(clack(1.0), a + 1.10, 0.8, -0.1)
    a, d = seg('botao')
    cama('botao', zumbido(d, 55, 0.6), 0.45)
    add(clique(1.0), a + 0.30, 0.55, -0.2); add(tom(1046, 0.18, ((1, 0.6), (2, 0.2)), 0.07), a + 0.31, 0.12, -0.2)
    add(clack(0.6), a + 0.62, 0.35, 0.1)                                          # trava da porta do poço
    # 6: a subida: motor de elevador subindo e a PARADA SECA (a lâmpada pisca, o motor morre)
    a, d = seg('sobe')
    tstop = a + 1.3275
    add(motor_elev(tstop - (a - 0.15), 46, 94, 1.0), a - 0.15, 0.50, 0.0)
    add(rangido(0.7, 130, 110, 0.5), a + 0.4, 0.10, 0.2)
    add(parada_seca(), tstop - 0.01, 1.0, 0.0)
    add(respiracao(0.5, 1.0) * 1.8, tstop + 0.30, 0.30, 0.05)
    cama('sobe', zumbido(d, 55, 0.5) * np.concatenate([np.zeros(int(1.3 * SR)), np.ones(int(d * SR) - int(1.3 * SR))]), 0.4)
    # 7: parado entre os andares: silêncio, rangidos de cabo, o zumbido da lâmpada
    a, d = seg('parado')
    cama('parado', zumbido(d, 60, 0.9) + vento(d, 0.07, 260), 0.45)
    add(rangido(1.3, 105, 80, 0.7), a + 0.5, 0.20, 0.2)
    for k, off in enumerate((0.25, 0.95, 1.55, 2.05)):
        add(somar(tom(rng.uniform(900, 2600), 0.08, ((1, 0.5), (2.4, 0.2)), 0.015), banda(ruido(0.04), 800, 3000) * ad(int(0.04 * SR), 0.001, 0.01)), a + off, 0.07 + 0.03 * k, rng.uniform(-0.5, 0.5))
    add(respiracao(d, 0.8), a, 0.22, 0.0)
    add(crepitar(0.35, 0.5, 60), a + 1.35, 0.20)
    # 8: botões: ela aperta e aperta, nada responde
    a, d = seg('botoes')
    cama('botoes', zumbido(d, 55, 0.7), 0.4)
    for i in range(6):
        add(clique(1.0), a + 0.10 + i * 0.19, 0.50 + 0.04 * i, rng.uniform(-0.3, 0.1))
    add(respiracao(d, 1.1), a, 0.30, 0.0)
    # 9: telefone mudo: o monofone sai do gancho; só chiado; ela bate no gancho; recoloca
    a, d = seg('telefone')
    cama('telefone', zumbido(d, 55, 0.7), 0.4)
    add(clack(0.7), a + 0.10, 0.55, 0.0)
    add(banda(ruido(0.8), 900, 4200) * 0.025 * np.minimum(T(0.8) / 0.1, 1) * np.minimum((0.8 - T(0.8)) / 0.2, 1), a + 0.30, 1.0, -0.2)
    add(clique(1.0), a + 1.05, 0.5); add(clique(1.0), a + 1.20, 0.5); add(clack(0.6), a + 1.50, 0.45)
    add(soluco(0.45, 300), a + 0.62, 0.22, 0.0); add(respiracao(d, 0.7), a, 0.22, 0.0)
    # 10: ela bate na grade e grita (ninguém ouve): batidas, chacoalhar de latão, voz sintética abafada
    a, d = seg('bate')
    cama('bate', zumbido(d, 55, 0.6), 0.35)
    for k in range(5):
        tt = a + 0.12 + k * 0.2856
        add(toc(1.0), tt, 0.75, 0.15); add(grade_desliza(0.14, 1.0), tt, 0.5, 0.0)
    add(reverb(grito(0.55, 560), 0.8, 0.5), a + 0.15, 0.20, 0.0); add(reverb(grito(0.50, 520), 0.8, 0.5), a + 0.75, 0.18, 0.0)
    add(soluco(d, 280), a, 0.30, 0.0)
    # 11: silêncio: a casa toda à noite (tom agudo, cidade ao longe, coração lento)
    a, d = seg('silencio')
    cama('silencio', abafar(trafego(d, 0.7), 400) + zumbido(d, 50, 0.3), 0.40)
    add(tinido(d + 0.3, 3900) * np.minimum(T(d + 0.3) / 0.6, 1), a, 0.10, 0.0)
    for tt in np.arange(a + 0.2, a + d, 1.0):
        add(batimento(60, 1.0)[: int(0.6 * SR)], tt, 0.16, 0.0)
    add(soluco(0.9, 260), a + 0.85, 0.16, 0.0)
    # 12: relógio de pé: o tique-taque acelera; no fim, uma badalada grave
    a, d = seg('relogio')
    tt, gap, k = a, 0.5, 0
    while tt < a + d - 0.05:
        add(tique_taque(2, gap * 0.5, 0.8)[: int(0.25 * SR)], tt, 0.34, 0.3)
        tt += gap; gap = max(0.07, gap * 0.80); k += 1
    add(sino(131.0, 5.0), a + d - 0.12, 0.34, 0.0)

    # ---------- ATO 2: tempo-lapso (sexta -> segunda), 8 s ----------
    a0 = P['tempo_1']['t0']; dTL = P['tempo_3']['t0'] + P['tempo_3']['dur'] - a0
    tt_ = T(dTL)
    Hh = 24.0 + 7.0 * tt_
    dia = np.clip(np.sin((Hh - 6.0) / 12.0 * np.pi), 0, 1)
    bed = dia * (trafego(dTL, 0.9) + passaros(dTL, 1.4)) + (1 - dia) * (vento(dTL, 0.22, 300) + grilos(dTL, 1.2) + trafego(dTL, 0.3))
    tl = bed * 0.5 + zumbido(dTL, 50, 0.4) * 0.3
    dentro = np.zeros_like(tt_)
    for id_ in ('dentro_1', 'dentro_2'):
        s0, dd = seg(id_)
        dentro += np.clip(np.minimum((tt_ - (s0 - a0)) / 0.06, (s0 + dd - a0 - tt_) / 0.06), 0, 1)
    dentro = np.clip(dentro, 0, 1)
    tl = tl * (1 - dentro) + abafar(tl, 600) * dentro * 0.8
    add(tl, a0, 1.0, 0.0)
    add(tique_taque(int(dTL / 0.11), 0.11, 0.55), a0, 0.16, 0.2)
    for H0, up in ((30, 1), (42, 0), (54, 1), (66, 0), (78, 1)):
        tw = a0 + (H0 - 24.0) / 7.0
        if 0 < tw - a0 < dTL - 0.5:
            add(whoosh(0.9, 300, 2600) if up else whoosh(0.9, 2600, 300), tw - 0.45, 0.20, 0.0)
    # dentro da cabine, nos dois cortes: respiração lenta e o choro dela
    for id_, f0 in (('dentro_1', 250), ('dentro_2', 270)):
        s0, dd = seg(id_)
        add(soluco(dd + 0.2, f0), s0 - 0.05, 0.42, 0.0); add(respiracao(dd, 0.9), s0, 0.18, 0.0)

    # ---------- ATO 3: segunda de manhã ----------
    a, d = seg('segunda_cab')
    cama('segunda_cab', abafar(passaros(d, 1.0) + trafego(d, 0.8), 1400), 0.5)
    add(zumbido(d, 55, 0.5), a, 0.2)
    add(respiracao(d, 0.9), a + 0.1, 0.28, 0.0); add(soluco(0.6, 255), a + 0.45, 0.18, 0.0)
    # entregador: passos nos degraus, caixa, o dedo no botão, o gongo da campainha lá dentro
    a, d = seg('campainha')
    cama('campainha', trafego(d, 0.9) + passaros(d, 1.0) + vento(d, 0.08, 420), 0.5)
    for k, off in enumerate((0.20, 0.62, 1.00, 1.18)):
        add(passo('concreto', 1.0), a + off, 0.30, 0.2)
    add(banda(ruido(0.15), 600, 3800) * ad(int(0.15 * SR), 0.01, 0.05) * 0.6, a + 0.35, 0.10)
    tp = a + 1.30
    add(clique(1.0), tp, 0.55, 0.3)
    add(abafar(ding(1318.0, 1.0), 1800), tp + 0.01, 0.35, 0.0)
    a, d = seg('eco')
    cama('eco', abafar(passaros(d, 0.9) + trafego(d, 0.7), 1300) + zumbido(d, 55, 0.4), 0.4)
    add(reverb(abafar(tom(987.8, 1.8, ((1, 1.0), (2, 0.3), (3, 0.12)), 0.6), 1400), 1.8, 0.8), a + 0.05, 0.38, 0.0)
    add(respiracao(0.5, 1.0) * 2.0, a + 0.15, 0.28, 0.0); add(soluco(0.7, 260), a + 0.35, 0.28, 0.0)
    a, d = seg('entregador')
    cama('entregador', trafego(d, 0.9) + passaros(d, 0.9) + vento(d, 0.06, 420), 0.5)
    for off in (0.38, 0.72, 1.06):
        add(toc(1.0), a + off, 0.38, 0.0)
    add(murmurio(1.0, 1.0, 1), a + 0.75, 0.22, 0.2)
    add(passo('concreto', 0.6), a + 0.1, 0.12, 0.0); add(passo('concreto', 0.6), a + 0.55, 0.12, 0.0)
    # chegada dos bombeiros: sirene com Doppler, buzina de ar, diesel, freio, passos correndo, rádio
    a, d = seg('chegam')
    cama('chegam', trafego(d, 0.8) + passaros(d, 0.6), 0.4)
    add(sirene_doppler(3.0, 2.0, 0.0, 1.0), a - 0.7, 0.30, -0.3)
    add(buzina_ar(0.8), a + 0.65, 0.34, -0.2)
    add(diesel(1.6, 1.0), a + 0.55, 0.30, -0.1); add(freio_ar(0.9), a + 0.80, 0.30, 0.0)
    for k in range(3):
        for s in range(3):
            add(passo('concreto', 1.2), a + 0.95 + k * 0.10 + s * 0.28, 0.20, rng.uniform(-0.4, 0.4))
    add(radio(1.0), a + 1.2, 0.16, 0.3)
    # corredor do 3º andar: botas, pé-de-cabra na fresta, a madeira cede
    a, d = seg('forcam')
    cama('forcam', filtro(ruido(d), lo=120, hi=800) * 0.02 + zumbido(d, 50, 0.3), 0.4)
    for off in (0.05, 0.40, 0.75):
        add(passo('madeira', 1.4), a + off, 0.28, rng.uniform(-0.3, 0.3))
    add(raspa_metal(0.4), a + 0.36, 0.45, 0.0)
    add(rangido(0.9, 230, 150, 0.9), a + 0.55, 0.30, 0.0)
    add(madeira_estalo(1.0), a + 1.20, 0.80, 0.0)
    add(radio(0.8), a + 0.2, 0.12, 0.4)
    # a luz: a porta desliza, muito ar e luz, vozes, o coração dela
    a, d = seg('luz')
    cama('luz', abafar(filtro(ruido(d), lo=150, hi=1500) * 0.03, 1200), 0.4)
    add(grade_desliza(0.6, 1.0) * 0.6, a - 0.05, 0.45, 0.2)
    add(whoosh(1.1, 200, 5000), a - 0.1, 0.30, 0.0)
    add(banda(ruido(1.2), 2500, 9000) * np.exp(-T(1.2) / 0.45) * 0.20, a, 0.30, 0.0)
    add(murmurio(1.3, 1.0, 2), a + 0.1, 0.30, 0.3); add(radio(0.8), a + 0.5, 0.13, 0.4)
    add(respiracao(0.6, 1.0) * 2.0, a + 0.2, 0.30, 0.0)
    for tt in np.arange(a, a + d, 60 / 86):
        add(batimento(86, 1.0)[: int(0.6 * SR)], tt, 0.22, 0.0)
    # mão: a grade de latão desliza, vozes calmas, o choro de alívio
    a, d = seg('mao')
    cama('mao', filtro(ruido(d), lo=150, hi=1500) * 0.025, 0.4)
    add(grade_desliza(0.6, 1.0), a + 0.40, 0.6, 0.0)
    add(murmurio(1.0, 1.0, 1), a + 0.25, 0.28, 0.3)
    add(soluco(d + 0.2, 275), a - 0.05, 0.55, 0.0); add(respiracao(d, 1.0), a, 0.24, 0.0)
    # tira: botas, tecido, a manta térmica que amassa
    a, d = seg('tira')
    cama('tira', filtro(ruido(d), lo=150, hi=1500) * 0.025, 0.4)
    for k in range(4):
        add(passo('madeira', 1.2), a + 0.20 + k * 0.42, 0.20, rng.uniform(-0.4, 0.4))
    add(banda(ruido(d), 400, 3000) * 0.05 * (0.5 + 0.5 * np.sin(2 * np.pi * 4 * T(d))), a, 0.5, 0.0)
    add(amassa_manta(d - 0.5, 1.0), a + 0.55, 0.40, 0.0)
    add(murmurio(1.2, 1.0, 2), a + 0.2, 0.22, 0.3); add(soluco(1.0, 270), a + 0.1, 0.30, 0.0)
    # rua: a porta abre (dobradiça), a cidade, o diesel parado, rádios, a manta
    a, d = seg('rua_final')
    cama('rua_final', trafego(d, 0.9) + passaros(d, 0.8) + vento(d, 0.07, 420), 0.5)
    add(rangido(0.6, 320, 210, 0.9), a + 0.0, 0.26, 0.0)
    add(diesel(d, 0.8), a, 0.16, -0.3)
    for k in range(5):
        add(passo('concreto', 1.0), a + 0.55 + k * 0.45, 0.22, 0.2)
    add(amassa_manta(d - 0.4, 1.0), a + 0.4, 0.35, 0.0)
    add(radio(0.9), a + 0.9, 0.14, 0.4); add(murmurio(d, 0.8, 2), a, 0.20, 0.3)
    # rosto final: calmaria, pássaros, o suspiro dela
    a, d = seg('rosto_final')
    cama('rosto_final', passaros(d, 1.0) + trafego(d, 0.4) + vento(d, 0.05, 420), 0.5)
    add(diesel(d, 0.5), a, 0.08, -0.3)
    add(soluco(d, 265), a - 0.05, 0.34, 0.0); add(respiracao(d, 0.9), a, 0.18, 0.0)
    # cartela: o som some devagar
    a, d = seg('cartela')
    n = int(d * SR)
    add(zumbido(d, 55, 0.5) * np.exp(-T(d) / 1.1), a, 0.20)
    add(passaros(d, 0.8) * np.exp(-T(d) / 0.9), a, 0.18)


def finalizar(saida):
    montar()
    pico = max(np.abs(L).max(), np.abs(R).max(), 1e-6)
    ganho = 0.92 / pico
    for c in (L, R):
        c *= ganho
    st = np.stack([L, R], 1)
    env = np.sqrt(np.convolve((st ** 2).mean(1), np.ones(int(0.04 * SR)) / int(0.04 * SR), 'same') + 1e-9)
    thr = 0.07
    g = np.where(env > thr, (env / thr) ** (-(1 - 1 / 3.0)), 1.0)
    g = np.convolve(g, np.ones(int(0.02 * SR)) / int(0.02 * SR), 'same')
    st = st * g[:, None]
    st *= 0.92 / max(np.abs(st).max(), 1e-6)
    st = np.tanh(st * 1.15) / np.tanh(1.15)
    st = st[:int((TOTAL + 0.3) * SR)]
    for c in range(2):
        st[:, c] = filtro(st[:, c], lo=25, ordem=2)
    st *= 0.89 / max(np.abs(st).max(), 1e-6)
    fim = int(0.9 * SR)                                                         # fade-out final
    st[-fim:] *= np.linspace(1, 0, fim)[:, None]
    with wave.open(saida, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())
    rms = np.sqrt((st ** 2).mean())
    print('ok', saida, '%.2f s' % (len(st) / SR), 'pico %.2f rms %.3f' % (np.abs(st).max(), rms))


if __name__ == '__main__':
    finalizar(sys.argv[1] if len(sys.argv) > 1 else os.path.join(AQUI, 'elevador_sfx.wav'))
