"""Efeitos sonoros do Short (sem música): tudo sintetizado com numpy a partir dos tempos dos planos (planos.json, gerado por exportar_planos.js).
Uso:  python3 sfx_anurag.py [saida.wav]
Camadas: ambiente noturno, campainha, passos, portas, motores, pneus, batidas, vidro, silêncio com zumbido, sirene, rádio, algemas, martelo,
sino, vento, soluços. Os gritos e soluços são sintéticos (vozes de apoio): troque por gravações reais se quiser."""
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


# ------------------------------------------------------------------ roteiro sonoro
def montar():
    # ---- ambiente da noite (atos 1 e 2) e do dia nublado (ato 4)
    fim_noite = t0('silêncio')
    amb = vento(fim_noite, 0.10, 380) + grilos(fim_noite, 1.0)
    fade = np.minimum(1, (fim_noite - T(fim_noite)) / 0.15)
    add(amb * fade, 0.0, 1.0, 0.0)

    # ---- ATO 1
    add(np.zeros(10), 0, 0)
    d1, d2 = campainha()
    add(banda(ruido(0.03), 1500, 6000) * ad(int(0.03 * SR), 0.0005, 0.006), 0.07, 0.6)         # clique do botão
    add(d1, 0.10, 0.85, -0.1); add(d2, 0.58, 0.8, -0.1)
    # correm: cinco pares de tênis no gramado e no concreto
    ini = t0('correm') + 0.05
    for k in range(5):
        for s in range(5):
            tt = ini + 0.12 * k + s * 0.28 + rng.uniform(-0.02, 0.02)
            add(passo('grama', 0.8 + 0.2 * rng.random()), tt, 0.22, rng.uniform(-0.6, 0.6))
    add(whoosh(0.35, 400, 3500), t0('correm') - 0.12, 0.35)
    # a porta abre: puxão, rangido, luz que liga
    ta = t0('porta abre', 0.12)
    add(banda(ruido(0.05), 800, 5000) * ad(int(0.05 * SR), 0.001, 0.012), ta - 0.02, 0.45)                  # trinco
    t = T(0.6)
    cr = np.sin(2 * np.pi * np.cumsum(120 + 90 * (t / 0.6) ** 1.5 + 20 * np.sin(2 * np.pi * 23 * t)) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 31 * t))
    add(filtro(cr, hi=2200) * np.sin(np.pi * t / 0.6) * 0.5, ta, 0.30, -0.2)
    add(passo('madeira', 1.2), t0('porta abre', 0.62), 0.45, -0.1); add(passo('madeira', 1.3), t0('porta abre', 0.98), 0.50, 0.0)
    add(whoosh(0.3, 200, 1600), t0('porta abre') - 0.1, 0.3)
    # olhar dele: batimento cresce
    for b, tt in enumerate(np.arange(t0('olhar dele'), t0('drone'), 60 / 78)):
        add(batimento(78, 1.0)[: int(0.5 * SR)], tt, 0.18 + 0.08 * min(1, (tt - t0('olhar dele')) / 4), 0.0)
    add(whoosh(0.22, 300, 3000), t0('olhar dele') - 0.08, 0.3)
    # carro dos adolescentes dá a partida e sai cantando pneu
    tc = t0('carro foge')
    m = motor(1.4, lambda t: 900 + 4800 * np.clip((t - 0.25) / 0.9, 0, 1) ** 1.2, 0.0, 1.0, 1.0, 4)
    add(m * np.minimum(1, (1.4 - T(1.4)) / 0.4), tc - 0.1, 0.30, 0.2)
    add(chiado_pneu(0.9, 1500, 0.7), tc + 0.35, 0.34, 0.1)
    add(whoosh(0.5, 400, 2500), tc + 0.2, 0.25, 0.4)
    # ele corre para o carro: passos pesados e porta batendo
    ini = t0('ele corre')
    for s in range(6):
        add(passo('grama', 1.5), ini + 0.05 + s * 0.215, 0.32, rng.uniform(-0.3, 0.3))
    add(porta_batendo(), t0('faróis', 0.0) - 0.05, 0.9, 0.0)
    # faróis acendem: partida do motor (grave) e arrancada
    tf = t0('faróis')
    mot = motor(1.5, lambda t: 700 + 5200 * np.clip((t - 0.3) / 0.8, 0, 1) ** 1.3, 1.0, 1.0, 1.6, 6)
    add(mot * np.minimum(1, (1.5 - T(1.5)) / 0.3), tf + 0.02, 0.55, 0.0)
    add(chiado_pneu(0.8, 1200, 0.9), tf + 0.4, 0.40, 0.0)
    add(whoosh(0.4, 300, 2200), tf + 0.35, 0.3)

    # ---- ATO 2: perseguição
    ini, fim = t0('drone'), t0('silêncio')
    dur = fim - ini
    tt = T(dur)
    s_ = lambda x: x
    mT = motor(dur, lambda t: 4300 + 1800 * np.clip((t + 1.5) / 11.0, 0, 1), 0.0, 1.0, 0.8, 4)
    mC = motor(dur, lambda t: 3100 + 2600 * np.clip((t + 1.5) / 10.5, 0, 1) ** 1.2, 1.0, 1.0, 1.5, 6)
    vento_ = filtro(ruido(dur), lo=200, hi=2500) * (0.10 + 0.25 * np.clip(tt / 9, 0, 1))
    rod = filtro(ruido(dur), hi=300) * 0.35
    ext = mT * 0.55 + mC * 0.85 + vento_ + rod
    # cabines: abafado nos planos de interior
    interior = np.zeros_like(tt)
    for nome in ('motorista', 'banco de trás', 'velocímetro', 'rosto Chandra'):
        a, b = t0(nome) - ini, t0(nome) + P[nome]['dur'] - ini
        interior += np.clip(np.minimum((tt - a) / 0.05, (b - tt) / 0.05), 0, 1)
    interior = np.clip(interior, 0, 1)
    abaf = filtro(ext, hi=620, ordem=2) * 1.5
    # passagem rente: buraco no ambiente e dois "whoosh" com Doppler
    pas = np.zeros_like(tt)
    a, b = t0('passando') - ini, t0('passando', P['passando']['dur']) - ini
    pas = np.clip(np.minimum((tt - a) / 0.04, (b - tt) / 0.04), 0, 1)
    mix = (ext * (1 - interior) + abaf * interior) * (1 - 0.8 * pas)
    mix *= np.minimum(1, (dur - tt) / 0.05)
    add(mix, ini, 0.30, 0.0)
    # Doppler: dois carros passando pela câmera no chão (aproxima e afasta)
    def passa(tc, f0, g, pan0):
        d = 1.1
        t = T(d)
        v = 36.0
        x = (t - d / 2) * v
        dist = np.sqrt(x ** 2 + 2.4 ** 2)
        vr = -x / dist * v                                  # velocidade radial (positiva: se afastando)
        fd = f0 * 343.0 / (343.0 + vr)
        ph = np.cumsum(fd) / SR * 2 * np.pi
        s = sum(np.sin(k * ph) / k ** 1.1 for k in range(1, 12))
        env = 1.0 / (1 + (x / 5.0) ** 2) ** 0.9
        ru = filtro(ruido(d), lo=300, hi=3500) * env * 0.5
        out = (s * 0.5 + ru) * env
        pl = np.cumsum(np.ones_like(t)) / len(t)
        return out
    add(passa(0, 140, 1, 0), t0('passando', 0.0), 0.62, -0.4)
    add(passa(0, 105, 1, 0), t0('passando', 0.19), 0.70, -0.2)
    add(whoosh(0.35, 300, 4000), t0('passando', 0.40), 0.3)
    # cortes rápidos: whooshes
    for nome in ('drone', 'motorista', 'banco de trás', 'toque', 'passando', 'velocímetro', 'rosto Chandra', 'batida', 'árvore'):
        add(whoosh(0.2, 400, 4500), t0(nome) - 0.07, 0.22, rng.uniform(-0.5, 0.5))
    # coração acelerado dentro dos carros
    for nome, bpm in (('motorista', 110), ('banco de trás', 130), ('velocímetro', 120), ('rosto Chandra', 100)):
        for tt_ in np.arange(t0(nome), t0(nome) + P[nome]['dur'], 60 / bpm):
            add(batimento(bpm, 1.0)[: int(0.4 * SR)], tt_, 0.22, 0.0)
    # gritos (síntese de apoio) no banco de trás e no motorista
    add(grito(0.5, 560), t0('motorista', 0.55), 0.22, -0.2)
    add(grito(0.45, 760), t0('banco de trás', 0.12), 0.20, 0.3)
    add(grito(0.45, 640), t0('banco de trás', 0.45), 0.20, -0.3)
    add(grito(0.40, 900), t0('banco de trás', 0.72), 0.18, 0.0)
    add(respiracao(0.9, 1.0), t0('rosto Chandra', 0.0), 0.45, 0.0)
    # velocímetro: bips do painel
    for k in range(4):
        add(tom(1900, 0.09, ((1, 1),), 0.03), t0('velocímetro', 0.1 + k * 0.14), 0.12, 0.2)
    # primeiro toque
    add(toque_leve(), t0('toque', 0.85), 0.8, 0.0)
    # batida final e árvore
    add(impacto(1.0, 1.7) * 0.8, t0('batida', 0.714), 0.95, 0.0)
    add(chiado_pneu(0.8, 1700, 0.8), t0('batida', 0.72), 0.45, 0.2)
    add(impacto(1.35, 2.3), t0('árvore', 0.719), 1.05, 0.0)
    add(vidro(1.2), t0('árvore', 0.745), 0.6, 0.3)
    add(tom(60, 1.4, ((1, 1.0), (2, 0.3)), 0.6) * np.minimum(T(1.4) / 0.05, 1), t0('árvore', 0.72), 0.5)

    # ---- silêncio e zumbido
    tz = t0('silêncio')
    add(tinido(3.8, 4300), tz + 0.05, 0.55, 0.0)
    add(batida_grave(50, 34, 1.0, 0.5) * 0.3, tz + 0.1, 0.4)

    # ---- ATO 3
    t3 = t0('destroços')
    amb3 = vento(t0('cemitério') - t3 + 0.5, 0.09, 330) + grilos(t0('cemitério') - t3 + 0.5, 0.8)
    add(amb3, t3, 1.0)
    add(tinido(2.6, 4100) * 0.5, t3, 0.35)
    # estalos elétricos do poste, metal esfriando, vapor
    for k in range(9):
        tt = t3 + 0.1 + rng.uniform(0, 1.4)
        e = banda(ruido(0.09), 2000, 11000) * ad(int(0.09 * SR), 0.001, 0.018)
        add(e, tt, rng.uniform(0.2, 0.5), rng.uniform(-0.5, 0.5))
    for k in range(7):
        add(tom(rng.uniform(900, 1700), 0.35, ((1, 0.5), (2.2, 0.2)), 0.07), t3 + 0.3 + k * 0.23, 0.07, rng.uniform(-0.5, 0.5))
    add(filtro(ruido(2.0), lo=2500, hi=9000) * 0.12, t3 + 0.2, 1.0)
    # carro dele ao longe freando, parado em marcha lenta
    te = t0('ele para')
    add(chiado_pneu(1.0, 1100, 0.7), te - 0.5, 0.25, 0.3)
    add(motor(2.2, 1000, 0.0, 0.5, 1.5, 6) * np.minimum(1, (2.2 - T(2.2)) / 0.4) * 0.5, te - 0.1, 0.22, 0.3)
    add(filtro(ruido(0.7), lo=1500, hi=6000) * np.sin(np.pi * T(0.7) / 0.7) * 0.2, te + 0.6, 0.3, 0.3)
    # meia-volta e passagem lenta pelos destroços
    tm = t0('meia-volta')
    add(chiado_pneu(1.2, 1300, 0.7, 11), tm + 0.1, 0.32, 0.0)
    add(motor(2.6, lambda t: 1800 + 1700 * np.clip((t - 0.4) / 1.8, 0, 1), 1.0, 0.9, 1.4, 6) * np.minimum(1, (2.6 - T(2.6)) / 0.4), tm - 0.1, 0.34, 0.0)
    tp = t0('ele passa')
    d = 1.6; t = T(d); x = (t - 0.8) * 7.0; dist = np.sqrt(x ** 2 + 3.4 ** 2); vr = -x / dist * 7.0
    fd = 90 * 343 / (343 + vr); ph = np.cumsum(fd) / SR * 2 * np.pi
    s = sum(np.sin(k * ph) / k ** 1.2 for k in range(1, 10)); env = 1 / (1 + (x / 4.5) ** 2) ** 0.8
    cas = filtro(ruido(d), lo=500, hi=4500) * 0.35 * env
    add((s * 0.45 + cas) * env, tp, 0.5, -0.1)
    # polícia chega: sirene e pneus
    tpo = t0('polícia chega')
    sir = sirene(P['polícia chega']['dur'] + P['viatura']['dur'] + 1.2)
    ev = np.minimum(1, T(len(sir) / SR) / 0.5) * np.minimum(1, (len(sir) / SR - T(len(sir) / SR)) / 0.6)
    add(sir * ev, tpo - 0.1, 0.20, 0.3)
    add(motor(1.8, lambda t: 3800 - 900 * np.clip(t / 1.8, 0, 1), 0.0, 1.0, 1.0, 6) * np.minimum(1, (1.8 - T(1.8)) / 0.4), tpo, 0.34, 0.2)
    add(chiado_pneu(0.7, 1500, 0.6, 14), tpo + 0.7, 0.25, 0.1)
    # viatura: rádio, passos, chaves
    tv = t0('viatura')
    add(radio(1.2), tv + 0.05, 0.30, 0.4); add(radio(0.8), tv + 0.8, 0.22, 0.4)
    for s in range(3):
        add(passo('concreto', 1.0), tv + 0.15 + s * 0.38, 0.3, rng.uniform(-0.3, 0.3))
    # algemas
    tal = t0('algemas', 0.45)
    add(algemas_fecham(), tal - 0.35, 0.75, 0.0)
    add(chaves_tilintando(0.6), tal + 0.25, 0.35, 0.3)
    add(respiracao(1.1, 1.0), t0('algemas', 0.1), 0.35, 0.0)
    # levado: passos lentos juntos, rádio ao fundo
    tl = t0('levado')
    for s in range(7):
        add(passo('concreto', 1.1), tl + 0.05 + s * 0.42, 0.34, -0.2 + 0.07 * s)
        add(passo('concreto', 1.0), tl + 0.26 + s * 0.42, 0.28, 0.2)
    add(radio(0.9), tl + 0.6, 0.20, 0.5)
    # rosto preso: coração lento
    for tt_ in np.arange(t0('rosto preso'), t0('sentença'), 60 / 56):
        add(batimento(56, 1.0)[: int(0.8 * SR)], tt_, 0.3, 0.0)
    add(respiracao(1.1, 1.0), t0('rosto preso', 0.0), 0.35, 0.0)
    # sentença: martelo
    add(martelo(), t0('sentença', 0.345), 1.0, 0.0)
    add(np.zeros(5), 0, 0)

    # ---- ATO 4: o funeral
    tc4 = t0('cemitério')
    resto = TOTAL + 0.8 - tc4
    amb4 = vento(resto, 0.24, 520) + filtro(ruido(resto), lo=150, hi=900) * 0.035
    amb4 *= np.minimum(1, T(resto) / 0.6)
    add(amb4, tc4, 1.0)
    for k, off in enumerate((0.15, 3.9, 7.8, 11.8)):                              # o sino do cemitério
        add(sino(196.0 if k % 2 == 0 else 185.0, 7.0), tc4 + off, 0.50 - 0.04 * k, -0.2)
    # soluços nos close-ups
    for nome, f0 in (('mãe', 285), ('pai', 150), ('avó', 250), ('irmão', 360)):
        d = P[nome]['dur']
        add(soluco(d + 0.3, f0), t0(nome) - 0.05, 0.50, rng.uniform(-0.2, 0.2))
        add(respiracao(d, 1.0), t0(nome), 0.12, 0.0)
        for s in range(2):
            add(filtro(ruido(0.07), lo=400, hi=2500) * ad(int(0.07 * SR), 0.004, 0.02), t0(nome, 0.25 + s * 0.4), 0.15, 0.0)
    # multidão ao longe e roupas
    add(filtro(ruido(resto), lo=180, hi=700) * (0.5 + 0.5 * np.sin(2 * np.pi * T(resto) / 7.0)) * 0.018, tc4, 1.0)
    # passos do cortejo no cascalho
    tco = t0('alças')
    for s in range(int((P['alto']['t0'] + P['alto']['dur'] - tco) / 0.74)):
        for k in range(4):
            add(passo('cascalho', 1.0), tco + s * 0.74 + k * 0.045 + rng.uniform(0, 0.03), 0.10 + 0.05 * (k == 0), rng.uniform(-0.5, 0.5))
    add(whoosh(0.25, 200, 1500), t0('alças') - 0.05, 0.2)
    # a cartela
    add(sino(196.0, 6.0), t0('cartela') - 0.1, 0.42, 0.0)


def finalizar(saida):
    montar()
    # compressão suave e limite
    pico = max(np.abs(L).max(), np.abs(R).max(), 1e-6)
    ganho = 0.92 / pico
    for c in (L, R):
        c *= ganho
    st = np.stack([L, R], 1)
    # compressor suave (envelope RMS de 40 ms, razão 3:1 acima do limiar) para dar corpo sem perder o impacto das batidas
    env = np.sqrt(np.convolve((st ** 2).mean(1), np.ones(int(0.04 * SR)) / int(0.04 * SR), 'same') + 1e-9)
    thr = 0.07
    g = np.where(env > thr, (env / thr) ** (-(1 - 1 / 3.0)), 1.0)
    g = np.convolve(g, np.ones(int(0.02 * SR)) / int(0.02 * SR), 'same')
    st = st * g[:, None]
    st *= 0.92 / max(np.abs(st).max(), 1e-6)
    st = np.tanh(st * 1.15) / np.tanh(1.15)
    st = st[:int((TOTAL + 0.3) * SR)]
    # passa-alta leve (corta o grave inaudível) via FFT
    for c in range(2):
        st[:, c] = filtro(st[:, c], lo=25, ordem=2)
    st *= 0.89 / max(np.abs(st).max(), 1e-6)
    with wave.open(saida, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())
    rms = np.sqrt((st ** 2).mean())
    print('ok', saida, '%.2f s' % (len(st) / SR), 'pico %.2f rms %.3f' % (np.abs(st).max(), rms))


if __name__ == '__main__':
    finalizar(sys.argv[1] if len(sys.argv) > 1 else os.path.join(AQUI, 'anurag_sfx.wav'))
