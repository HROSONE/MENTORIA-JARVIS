"""Efeitos sonoros do Short "Por Que as Cabras Escalam Tudo?", todos sintetizados em Python (sem música, sem voz).
Os tempos seguem narr.json e os cortes de _cenas.js (mastigação 1,7 Hz, pedrinha em 2,05 s, casco pousa em 4,32 s, corte em 7,0 s,
microscópio em 10,35 s, salto em 13,55 s, lobo em 16,95 s, sal em 19,1 s, arganeira em 20,35 s, volta ao close em ~26 s).
O som termina como começa (vento + mastigação) para o loop emendar. Saída: cabra_sfx.mp3.
Uso:  python3 sfx_cabra.py   (precisa de numpy, scipy e ffmpeg)"""
import json
import os
import subprocess
import numpy as np
from scipy.signal import butter, sosfilt

AQUI = os.path.dirname(os.path.abspath(__file__))
SR = 44100
NR = json.load(open(os.path.join(AQUI, 'narr.json')))
TOTAL = NR['total']
N = int(SR * TOTAL)
L, R = np.zeros(N), np.zeros(N)
rng = np.random.default_rng(5150)
CH_F = 1.7


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


def add(t, x, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i + len(x) <= 0:
        return
    x = x[max(0, -i):]
    i = max(0, i)
    x = x[:N - i]
    L[i:i + len(x)] += x * g * (1 - max(0, pan))
    R[i:i + len(x)] += x * g * (1 + min(0, pan))


def norm(x): return x / (np.abs(x).max() + 1e-9)


# ---------------------------------------------------------------- sons
def vento(d, nivel=1.0, f1=140, f2=1400, lento=.35):
    """vento: ruído filtrado com ondulações lentas; estéreo descorrelacionado"""
    out = []
    for _ in range(2):
        x = bp(ruido(d), f1, f2)
        t = tt(d)
        m = 1 + .45 * np.sin(2 * np.pi * lento * t + rng.uniform(0, 6)) + .25 * np.sin(2 * np.pi * lento * 2.7 * t + rng.uniform(0, 6))
        out.append(x * m * nivel)
    return out


def crunch(d=.11, gr=1.0):
    """mastigar folha/fruto: estalinhos de ruído médio-agudo + corpo úmido grave"""
    n = int(d * SR)
    x = np.zeros(n)
    for k, (dt, g) in enumerate([(0, 1.0), (.018, .7), (.041, .5)]):
        i = int(dt * SR)
        c = bp(ruido(.05), 1600 + 500 * k, 6500) * env(int(.05 * SR), .0006, .012)
        x[i:i + len(c)] += c[:max(0, n - i)] * g if i + len(c) <= n else c[:n - i] * g
    x += lp(ruido(d), 520) * env(n, .003, .035) * .8
    return norm(x) * gr


def whoosh(d, f0, f1, curva=1.0, q=.6):
    """varredura de ruído: centro do filtro vai de f0 a f1; amplitude sobe e desce"""
    t = tt(d)
    n = len(t)
    base = ruido(d)
    out = np.zeros(n)
    passos = 40
    for k in range(passos):
        a, b = int(n * k / passos), int(n * (k + 1) / passos)
        u = (k + .5) / passos
        fc = f0 * (f1 / f0) ** (u ** curva)
        seg = bp(base, fc * (1 - q * .5), fc * (1 + q))[a:b]
        out[a:b] = seg
    return norm(out * np.sin(np.pi * t / d) ** 1.4)


def tique(f=2400, d=.05):
    t = tt(d)
    x = np.sin(2 * np.pi * f * t) * env(len(t), .0004, .009) + hp(ruido(d), 2500) * env(len(t), .0003, .004) * .6
    return norm(x)


def toc(f=180, d=.14, brilho=2200):
    """casco batendo na rocha: baque grave seco + clique agudo"""
    t = tt(d)
    fr = f * (1 + 1.8 * np.exp(-t / .02))
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(len(t), .001, .04) + hp(ruido(d), brilho) * env(len(t), .0004, .008) * .9 + lp(ruido(d), 500) * env(len(t), .002, .03) * .5
    return norm(x)


def raspa(d, grao=380, brilho=900):
    """arrastar de dedo na pedra: ruído áspero modulado em grãos"""
    n = int(d * SR)
    t = tt(d)
    g = (rng.random(int(d * grao) + 2) ** 2.2)
    mod = np.interp(t * grao, np.arange(len(g)), g)
    x = hp(ruido(d), brilho) * mod * jan(n, .04, .12)
    x += lp(ruido(d), 260) * .2 * jan(n, .05, .1)
    return norm(x)


def poeira(d=.7):
    return norm(bp(ruido(d), 2000, 7000) * env(int(d * SR), .05, d / 3)) * .45


def squish(d, f=130):
    """sola macia se amoldando: grave úmido que balança e vai ficando mais cheio"""
    t = tt(d)
    x = lp(ruido(d), f * 3) * (.6 + .4 * np.sin(2 * np.pi * 7.5 * t)) * jan(len(t), .06, .15)
    x += np.sin(2 * np.pi * f * t * (1 + .3 * t / d)) * .3 * jan(len(t), .05, .2)
    return norm(x)


def ping(f=1760, d=.5, dur=1.0):
    t = tt(d)
    x = (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 2.01 * t) + .25 * np.sin(2 * np.pi * f * 3.02 * t)) * env(len(t), .002, d / 4)
    return norm(x) * dur


def zumbido(d, f=60):
    """vácuo/elétron do microscópio: zumbido de 60 Hz + harmônicos + assobio fino, com leve tremor"""
    t = tt(d)
    x = sum(np.sin(2 * np.pi * f * k * t + rng.uniform(0, 6)) / k for k in (1, 2, 3, 5)) * (1 + .08 * np.sin(2 * np.pi * 6.5 * t))
    x += np.sin(2 * np.pi * (6800 + 250 * np.sin(2 * np.pi * .4 * t)) * t) * .06 + bp(ruido(d), 3000, 9000) * .02
    return norm(x * jan(len(t), .3, .3))


def balido(f0=380, d=.75, formantes=(760, 1250, 2500), tremor=28, rouco=.25):
    """balido de cabra: serra com vibrato rápido (tremor) passada por formantes, ataque suave e queda de tom"""
    t = tt(d)
    f = f0 * (1.12 - .22 * (t / d) + .03 * np.sin(2 * np.pi * 5 * t)) * (1 + .035 * np.sin(2 * np.pi * tremor * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(ph * k) / k for k in range(1, 18))
    x = x * (1 + rouco * rng.standard_normal(len(t)) * .4)
    y = sum(bp(x, fm * .85, fm * 1.2) * g for fm, g in zip(formantes, (1.0, .8, .35)))
    return norm(y * jan(len(t), .06, .22) * (.75 + .25 * np.sin(2 * np.pi * 3 * t)))


def rosnado(d=1.2, f=62):
    t = tt(d)
    x = (np.sign(np.sin(2 * np.pi * f * t * (1 + .06 * np.sin(2 * np.pi * 3 * t)))) * .6 + lp(ruido(d), 500) * .8) * (1 + .6 * np.sin(2 * np.pi * 24 * t))
    return norm(lp(x, 900) * jan(len(t), .25, .4))


def respiro(d=.5):
    return norm(bp(ruido(d), 500, 3500) * jan(int(d * SR), .12, .25)) * .5


def arranhao(d=.5):
    """garras raspando na rocha: pulsos de ruído agudo em sequência irregular"""
    n = int(d * SR)
    x = np.zeros(n)
    for _ in range(int(d * 22)):
        i = int(rng.uniform(0, d - .05) * SR)
        c = hp(ruido(.04), 2400) * env(int(.04 * SR), .0005, .01)
        x[i:i + len(c)] += c * rng.uniform(.4, 1)
    return norm(x * jan(n, .02, .1))


def lambida(d=.42):
    """língua raspando no sal: chiado úmido que sobe e desce + estalinho final"""
    n = int(d * SR)
    t = tt(d)
    x = bp(ruido(d), 900, 4200) * (.5 + .5 * np.sin(2 * np.pi * 38 * t)) * np.sin(np.pi * t / d) ** .8
    x[-int(.03 * SR):] += hp(ruido(.03), 2000) * np.linspace(1, 0, int(.03 * SR)) * .8
    return norm(x)


def folhas(d, nivel=1.0):
    """farfalhar de folhas: ruído agudo em rajadas"""
    out = []
    for _ in range(2):
        x = bp(ruido(d), 2200, 8000)
        t = tt(d)
        m = np.abs(np.sin(2 * np.pi * .9 * t + rng.uniform(0, 6))) ** 2.5 * (.5 + .5 * np.sin(2 * np.pi * .37 * t + rng.uniform(0, 6)))
        out.append(x * m * nivel)
    return out


def grilos(d, nivel=1.0):
    t = tt(d)
    x = np.zeros(len(t))
    for k, f in enumerate((3300, 3900, 4400)):
        gate = (np.sin(2 * np.pi * (5.2 + k * .6) * t + k) > .35).astype(float)
        gate = lp(gate, 30)
        x += np.sin(2 * np.pi * f * t) * gate * (.5 + .5 * np.sin(2 * np.pi * (.21 + .07 * k) * t))
    return norm(x) * nivel


# ---------------------------------------------------------------- linha do tempo
def mix():
    # --- camas contínuas (vento por trecho) ---
    def cama(t0, t1, nivel, f1=140, f2=1400, lento=.35, fade=.4):
        d = t1 - t0
        v = vento(d, nivel, f1, f2, lento)
        j = jan(len(v[0]), fade, fade)
        add(t0, v[0] * j, 1, -.4)
        add(t0, v[1] * j, 1, .4)
    cama(0, 3.5, .5, 120, 1300)                   # penhasco ventoso
    cama(3.0, 7.4, .24, 160, 1100)                # vento fraco perto do chão
    cama(13.3, 16.8, .42, 150, 1500, .5)          # salto
    cama(16.3, 20.6, .55, 130, 1400, .3)          # paredão / alto
    cama(24.6, TOTAL + .05, .5, 120, 1300, .35)   # volta ao penhasco (emenda com o começo)
    # arganeira: vento morno + folhas + grilos
    f = folhas(4.9, .26)
    add(20.2, f[0] * jan(len(f[0]), .4, .4), 1, -.5)
    add(20.2, f[1] * jan(len(f[1]), .4, .4), 1, .5)
    add(20.3, grilos(4.7, .05) * jan(int(4.7 * SR), .6, .5), 1, 0)
    cama(20.3, 24.9, .22, 200, 1000, .3)

    # --- plano 1: close da cabra, afastar, precipício ---
    for k in range(0, 6):                         # mordidas (1,7 Hz): fecha a mandíbula quando sen = -1
        tc = (.75 + k) / CH_F
        if tc < 3.2:
            add(tc, crunch(.11, 1.0 - .08 * k), .5 if tc < 1.3 else .32, 0.05)
    add(.12, whoosh(1.9, 300, 4200, 1.6, .9), .55, 0)                      # câmera recuando rápido
    add(.9, whoosh(2.2, 150, 1200, 1.0, .8), .22, 0)                        # ar abrindo (abismo)
    for te in (.85, 2.35):
        add(te, respiro(.12) * .4, .25, -.3)                                # orelha batendo
    for tq, g in zip((2.303, 2.925, 3.651), (.5, .36, .2)):                 # pedrinha quicando e caindo
        add(tq, tique(2600 - 500 * (tq - 2.3), .06), g, .15)
        add(tq + .09, tique(1500, .08), g * .3, .15)
    add(2.2, poeira(.5), .18, .2)
    add(2.65, whoosh(1.2, 900, 300, 1.0, .5), .08, .2)                       # queda longa (pitch descendente)

    # --- plano 2: casco pousa, abre, agarra ---
    add(3.08, whoosh(.5, 1800, 300, 1.2, .8), .5, 0)                        # corte (whip)
    add(3.3, whoosh(1.0, 400, 1400, .8, .9), .18, 0)                        # perna descendo
    add(4.32, toc(150, .17), .95, 0)                                        # casco bate na quina
    add(4.34, raspa(.18, 300, 1500), .55, 0)
    add(4.34, poeira(.9), .5, 0)
    add(4.38, raspa(1.1, 220, 600), .5, 0)                                  # dedos deslizando e abrindo
    add(4.5, lp(ruido(.8), 400) * jan(int(.8 * SR), .2, .3), .15, 0)
    add(5.7, toc(110, .22), .75, -.1)                                       # aperta/agarra
    add(5.7, raspa(.4, 520, 1100), .6, 0)
    add(5.72, poeira(.8), .4, 0)
    add(5.95, lp(ruido(.6), 220) * jan(int(.6 * SR), .1, .35), .22, 0)      # peso do corpo

    # --- plano 3: corte lateral ---
    add(6.95, whoosh(.5, 600, 5500, .7, 1.0), .42, 0)                       # varredura do scanner
    add(7.43, toc(420, .09, 3500), .7, 0)                                   # DURA: batida seca/metálica
    add(7.45, ping(1480, .35), .22, .1)
    add(8.56, ping(780, .6), .3, -.1)                                       # MACIA: som macio
    add(8.6, squish(.5, 110), .4, 0)
    add(8.7, squish(1.4, 120), .55, 0)                                      # a sola se amolda aos relevos
    for tc, g in ((9.0, .28), (9.45, .25), (9.9, .22)):
        add(tc, lp(ruido(.12), 1200) * env(int(.12 * SR), .002, .03), g, 0)
    add(10.0, ping(520, .8), .12, 0)

    # --- plano 4: microscópio ---
    add(10.3, zumbido(3.4, 60), .22, 0)
    add(10.35, whoosh(.45, 3000, 800, 1.0, .4), .3, 0)                      # lente abrindo
    # mergulho (zoom): varredura contínua que sobe de tom
    add(10.5, whoosh(3.0, 200, 5200, 1.4, .5), .42, 0)
    # tiques da barra de escala (muda quando passa de 500->200->100->50...), calculados como no _cenas.js
    um = 1.5
    def smooth_(x): x = min(1, max(0, x)); return x * x * (3 - 2 * x)
    def ease_(x):
        x = min(1, max(0, x)); return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
    ult = None
    for i in range(0, 330):
        Lx = i / 100.0
        if Lx > 3.2:
            break
        u = ease_((Lx - .2) / (3.2 - .05 - .2))
        z = np.exp(np.log(.42) + (np.log(15) - np.log(.42)) * u)
        raw = 150 / z * um
        pot = 10 ** np.floor(np.log10(raw))
        nice = max(v for v in (1 * pot, 2 * pot, 5 * pot, 10 * pot) if v <= raw)
        if ult is not None and nice != ult and Lx > .4:
            add(10.35 + Lx, tique(2100 + 120 * np.log10(1 / nice), .06), .38, .1)
        ult = nice
    add(11.52, ping(1900, .3), .22, .2)                                     # rótulo TUBOS
    add(12.82, ping(1500, .5), .26, .2)                                     # rótulo QUERATINA
    add(12.9, bp(ruido(.9), 4000, 9000) * env(int(.9 * SR), .05, .5), .05, 0)

    # --- plano 5: salto ---
    add(13.62, raspa(.3, 300, 900), .28, -.3)                               # pega impulso
    add(14.08, toc(95, .2), .9, -.2)                                        # empurra com as patas de trás
    add(14.08, poeira(.6), .3, -.2)
    add(14.1, whoosh(1.4, 300, 1200, .9, .6), .26, 0)                       # ar passando (câmera lenta)
    add(14.6, lp(ruido(1.4), 300) * jan(int(1.4 * SR), .5, .6), .1, 0)      # corpo no ar
    for tp, g, pan in ((15.53, .85, .1), (15.57, .7, .15), (15.68, .7, -.1), (15.72, .62, -.15)):
        add(tp, toc(130 + 20 * (tp - 15.5), .14), g, pan)                   # quatro cascos na pedra
    add(15.55, poeira(.8), .3, 0)
    for tp, g in ((15.95, .22), (16.15, .16)):
        add(tp, raspa(.12, 450, 1300), g, 0)                                # ajustes de equilíbrio

    # --- plano 6: lobo, subida, sal ---
    add(16.55, rosnado(1.3), .32, -.3)
    add(16.6, respiro(.5), .3, -.3)
    add(16.95, whoosh(.5, 500, 1800, 1.0, .8), .3, -.2)
    add(17.1, arranhao(.5), .6, -.2)                                        # garras na parede
    add(17.57, toc(85, .24), .85, -.2)                                      # volta ao chão
    add(17.58, poeira(1.0), .5, -.2)
    add(17.3, whoosh(1.7, 200, 2600, 1.3, .6), .38, 0)                      # subida da câmera
    add(18.15, balido(430, .7, (820, 1350, 2700)), .22, -.3)                # cabra
    add(18.75, balido(230, 1.0, (600, 1000, 2100), 22, .3), .3, .3)         # bode (mais grave)
    add(19.02, whoosh(.35, 1500, 300, 1.0, .6), .3, 0)
    for tl in (19.5, 20.17):                                                # lambidas no sal
        add(tl - .12, lambida(.42), .5, 0)
    add(19.35, tique(5200, .05), .12, .3)
    for tq in np.arange(19.2, 20.3, .09):
        add(tq, tique(float(rng.uniform(4200, 7500)), .03), .05, float(rng.uniform(-.5, .5)))

    # --- plano 7: arganeira ---
    add(20.7, whoosh(1.8, 250, 1500, 1.0, .6), .2, 0)                       # câmera subindo na árvore
    add(21.4, balido(400, .65, (780, 1300, 2600)), .16, -.5)
    add(22.15, balido(340, .7, (720, 1200, 2400)), .15, .5)
    for tc in (21.0, 21.7, 22.9):
        add(tc, toc(210, .08, 1800), .22, float(rng.uniform(-.4, .4)))      # casco no galho
    add(22.5, lp(ruido(.7), 400) * env(int(.7 * SR), .02, .25), .2, .3)     # galho estalando
    add(23.4, tique(1200, .08), .2, .4)                                     # fruto caindo
    ts = []                                                                 # a heroína mastigando fruto (mesma fase do _cenas.js)
    k0 = int(np.ceil(20.35 * CH_F - .75))
    while True:
        tc = (.75 + k0) / CH_F
        if tc >= 24.85:
            break
        ts.append(tc)
        k0 += 1
    for tc in ts:
        if tc > 22.4:
            add(tc, crunch(.12, 1.0), .42, .1)

    # --- plano 8: volta ao close; mastigando; push-in até o quadro 0 ---
    kk = 0
    while True:
        tc = TOTAL - .147 - kk * (1 / CH_F)                                 # fase = a do _cenas.js em S8 (anim = t - TOTAL)
        if tc < 24.9:
            break
        add(tc, crunch(.11, 1.0), .4 if tc < 26 else .5, .05)
        kk += 1
    add(26.0, whoosh(1.7, 250, 2400, 1.5, .8), .5, 0)                       # câmera entra rápido no close
    add(24.92, whoosh(.5, 1500, 250, 1.0, .5), .25, 0)                      # corte da árvore para o penhasco


mix()
# --- finalização: filtro de DC, limitador suave, normalização ---
for x in (L, R):
    x -= x.mean()
S = np.tanh(np.stack([L, R], 1) * 1.15)
S /= np.abs(S).max()
S *= .72
sai = os.path.join(AQUI, 'cabra_sfx.mp3')
tmp = os.path.join(AQUI, '_sfx_tmp.wav')
import wave
with wave.open(tmp, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((S * 32767).astype(np.int16).tobytes())
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-b:a', '160k', sai], check=True)
os.remove(tmp)
print('ok', sai, 'dur', TOTAL, 's  pico', float(np.abs(S).max()))
