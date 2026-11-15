"""Efeitos sonoros do Short "Como nasce um terremoto", todos sintetizados em Python (sem música, sem voz).
Os tempos seguem narr.json e os cortes de _cenas.js (estalo em 0,12 s, foco em 14,35 s, ruptura em 17,0 s, S na cidade em ~19,8 s).
O som termina na tensão máxima do último plano, para o loop emendar direto no estalo do começo.
Saída: terremoto_sfx.mp3.   Uso:  python3 sfx_terremoto.py   (precisa de numpy, scipy e ffmpeg)"""
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
rng = np.random.default_rng(7777)

T_SNAP, T_FOCO, V_FOCO, T_RUP = .12, 14.35, 300.0, 17.0
D_TOWN = float(np.hypot(1020, -60))
TP, TS = T_RUP + D_TOWN / 600, T_RUP + D_TOWN / 360


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


# ---------------------------------------------------------------- sons
def crack(d=.09, brilho=1500):
    """estalo seco de rocha: ruído agudo que morre rápido + um clique"""
    x = hp(ruido(d), brilho) * env(int(d * SR), .0008, d / 5)
    x[:40] += np.linspace(1, 0, 40) * 2.2
    return x / np.abs(x).max()


def boom(d=1.6, f0=42, queda=2.2):
    """pancada grave: seno que desce de f0*queda para f0 + ruído grave"""
    t = tt(d)
    f = f0 * (1 + (queda - 1) * np.exp(-t / .09))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * env(len(t), .004, d / 3.2) + lp(ruido(d), 160) * env(len(t), .004, d / 4) * .9
    return x / np.abs(x).max()


def ronco(d, f=110, a=.3, r=None):
    """rumor grave contínuo"""
    x = lp(ruido(d), f)
    t = tt(d)
    x *= (1 + .35 * np.sin(2 * np.pi * 2.6 * t + rng.uniform(0, 6)))
    return x / np.abs(x).max() * jan(len(t), a, r if r else d * .4)


def trituracao(d, lo=160, hi=900, mod=19):
    """rocha raspando: ruído de banda média com tremor rápido"""
    x = bp(ruido(d), lo, hi)
    t = tt(d)
    x *= np.clip(.55 + .45 * np.sin(2 * np.pi * mod * t + 3 * np.sin(2 * np.pi * 1.7 * t)), 0, 1)
    return x / np.abs(x).max()


def rangido(d, f0=330, vib=7):
    """ranger de rocha/metal sob tensão (stick-slip): tom com vibrato irregular e ruído"""
    t = tt(d)
    jit = lp(ruido(d), 14) * 14
    f = f0 * (1 + .06 * np.sin(2 * np.pi * vib * t) + .02 * jit)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sin(ph) + .5 * np.sin(2 * ph + 1) + .25 * np.sin(3 * ph)) * (.6 + .4 * np.sin(2 * np.pi * 3.1 * t + 1.3))
    x += .25 * bp(ruido(d), 500, 1800)
    return x / np.abs(x).max() * jan(len(t), d * .2, d * .35)


def tique(f=1700, d=.03):
    t = tt(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t / (d / 4))


def beep(f=1200, d=.14):
    t = tt(d)
    return np.sin(2 * np.pi * f * t) * jan(len(t), .006, .06) * (1 + .3 * np.sin(2 * np.pi * 2 * f * t) * .3)


def sino(f=900, d=.9):
    t = tt(d)
    return sum(a * np.sin(2 * np.pi * f * k * t + k) * np.exp(-t / (d / (1.8 + k))) for k, a in ((1, 1), (2.4, .45), (3.9, .22))) / 1.7


def sonar(d=.7, f0=95):
    t = tt(d)
    f = f0 * (1 - .35 * t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .01, d / 3)


def whoosh(d=.4, f0=250):
    x = ruido(d)
    t = np.linspace(0, 1, len(x))
    y = sum(bp(x, f * f0 / 250, f * f0 / 250 * 1.6) * np.exp(-((t - c) / .22) ** 2) for f, c in ((250, .45), (700, .55), (1800, .6)))
    return y / np.abs(y).max()


def varredura(d, f_ini, f_fim):
    t = tt(d)
    f = f_ini * (f_fim / f_ini) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def poeira(d, g=1.0):
    return hp(ruido(d), 2500) * jan(int(d * SR), d * .15, d * .7)


def chocalho(d, dens=60, f=(900, 3200)):
    """casas e objetos sacudindo: muitos cliques curtos aleatórios"""
    x = np.zeros(int(d * SR))
    for _ in range(int(d * dens)):
        i = int(rng.uniform(0, d - .02) * SR)
        c = bp(ruido(.012), f[0], f[1]) * np.exp(-np.arange(int(.012 * SR)) / (SR * .003)) * rng.uniform(.2, 1)
        x[i:i + len(c)] += c
    return x / max(1e-9, np.abs(x).max())


def ratchet(t, g=.5, f=1500):
    add(t, tique(f, .022), g * .8, rng.uniform(-.15, .15))


# ---------------------------------------------------------------- linha do tempo dos anos (igual a _cenas.js)
def e_in_out(x): x = min(1, max(0, x)); return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2
def e_in(x): return min(1, max(0, x)) ** 3
def rg(t, a, b): return min(1, max(0, (t - a) / (b - a)))
def ano_at(t):
    if t < 3.3: return 0
    if t < 6.7: return 60 * rg(t, 3.3, 6.7)
    if t < 10.6: return 60 + 50 * e_in_out(rg(t, 6.7, 10.6))
    if t < 13.0: return 110 + 90 * e_in(rg(t, 10.6, 13.0))
    return 200
def ano_ciclo(t): return 200 * e_in(rg(t, 22.8, TOTAL - .05))


def ticks_ano(fn, t0, t1, passo=5, g=.28, f=1600):
    """um tique a cada 'passo' anos do contador, acelerando junto com ele"""
    ult = int(fn(t0) // passo)
    for t in np.arange(t0, t1, .001):
        k = int(fn(t) // passo)
        if k != ult:
            ult = k
            add(t, tique(f * (1 + .15 * (k % 3)), .026), g, rng.uniform(-.2, .2))


# =============================================================== 1. a estrada arrebenta (0 – 2,6)
add(0.0, rangido(.14, 280, 9), .32)                                    # a tensão geme um instante antes do estalo
add(0.0, lp(ruido(.14), 90) * jan(int(.14 * SR), .03, .05), .35)
add(T_SNAP, crack(.12, 1200), 1.0)
add(T_SNAP, crack(.07, 3000), .6)
add(T_SNAP, boom(2.2, 40, 2.6), 1.0)
add(T_SNAP + .01, ronco(2.6, 120, .02, 1.6), .9)
add(T_SNAP + .02, trituracao(1.3, 180, 900, 21) * jan(int(1.3 * SR), .01, 1.1), .55)
add(T_SNAP + .03, chocalho(1.0, 90), .55)
for k in range(14):                                                   # pedaços de asfalto e pedra caindo
    add(T_SNAP + .12 + rng.uniform(0, 1.1) ** 1.4, tique(rng.uniform(500, 1400), .04), rng.uniform(.1, .28), rng.uniform(-.5, .5))
add(T_SNAP + .08, sonar(.8, 90), .55)
add(T_SNAP + .22, sonar(.9, 70), .4)
add(T_SNAP + .02, whoosh(.5, 180), .38)                               # sopro da onda de choque
add(T_SNAP + .1, poeira(1.5), .22)
add(.74, tique(2400, .03), .5); add(.86, tique(2400, .03), .45); add(.98, sino(1100, .5), .22)   # cota "6 m"
add(1.4, lp(ruido(1.2), 400) * jan(int(1.2 * SR), .3, .8), .12)

# =============================================================== 2. rebobina (2,6 – 3,3)
d = .75
add(2.58, varredura(d, 2400, 300) * jan(int(d * SR), .02, .15) * (1 + .5 * np.sin(2 * np.pi * 26 * tt(d))), .26)
add(2.6, bp(ruido(d), 800, 5000) * jan(int(d * SR), .25, .05), .22)
for t in np.arange(2.62, 3.28, .016):
    ratchet(t, .22, 1100)
add(2.6, whoosh(.6, 400), .3)
add(3.25, tique(900, .06), .35)

# =============================================================== 3. duas placas se arrastam (3,3 – 6,7)
add(3.3, ronco(3.6, 90, .3, 1.0), .5)
add(3.3, trituracao(3.6, 90, 380, 5.5) * jan(int(3.6 * SR), .5, .9), .28)
add(3.4, rangido(1.4, 190, 5), .1)
add(5.3, rangido(1.2, 230, 6), .1)
ticks_ano(ano_at, 3.3, 6.7, 5, .26)
add(4.18, beep(1250, .12), .28); add(4.3, beep(1700, .1), .22)         # etiqueta "3 cm/ano"

# =============================================================== 4. a falha trava e a rocha estica (6,7 – 10,6)
add(6.7, ronco(3.9, 100, .2, 1.2), .4)
add(7.36, boom(.6, 90, 1.6), .75)                                    # a falha "trava": batida seca de travamento
add(7.36, crack(.05, 800), .5)
add(7.37, bp(ruido(.18), 300, 1100) * env(int(.18 * SR), .001, .06), .45)
add(7.68, beep(900, .16), .3)                                         # etiqueta TRAVADA
add(7.5, rangido(2.2, 300, 7), .22)
add(8.9, rangido(1.8, 380, 8), .24)
for t in np.arange(7.6, 9.0, .09):                                    # atrito: pequenas faíscas estalando
    add(t + rng.uniform(0, .05), tique(rng.uniform(1800, 3800), .012), rng.uniform(.08, .2), rng.uniform(-.4, .4))
add(8.6, whoosh(.8, 220), .26)                                        # pull-out
add(9.6, rangido(1.0, 440, 9), .2)
ticks_ano(ano_at, 6.7, 10.6, 5, .26)

# =============================================================== 5. séculos de energia (10,6 – 13,1)
add(10.6, ronco(2.4, 100, .3, .5), .45)
d = 2.5
add(10.6, varredura(d, 110, 1150) * jan(int(d * SR), .5, .1) * (.7 + .3 * np.sin(2 * np.pi * 8 * tt(d))), .22)   # tensão subindo
add(11.0, rangido(1.8, 480, 11), .26)
add(11.9, rangido(1.0, 640, 14), .24)
for t in np.arange(11.0, 12.9, .07):                                  # microfissuras
    add(t + rng.uniform(0, .04), crack(.025, 2500) * rng.uniform(.3, 1), (t - 10.8) / 2.1 * .28, rng.uniform(-.5, .5))
ticks_ano(ano_at, 10.6, 13.0, 5, .3, 1900)
add(12.55, whoosh(.65, 120), .5)                                      # mergulho na fenda
add(12.5, boom(.7, 55, 1.4) * np.linspace(0, 1, int(.7 * SR)), .55)

# =============================================================== 6. o foco (13,1 – 17,0)
add(13.1, ronco(4.0, 70, .8, 1.2), .3)
add(13.12, bp(ruido(3.6), 40, 90) * jan(int(3.6 * SR), .6, 1.0), .25)
for i, t in enumerate((13.55, 13.95, 14.2, 14.3)):                    # pulsos antes do clarão (o coração da falha)
    add(t, boom(.32, 52, 1.5), .55 + .07 * i)
add(T_FOCO, boom(2.4, 38, 3.0), 1.0)                                   # a rocha cede
add(T_FOCO, crack(.14, 900), .95)
add(T_FOCO, crack(.08, 3200), .65)
add(T_FOCO + .02, hp(ruido(1.4), 3000) * env(int(1.4 * SR), .002, .5), .35)   # brilho do clarão
add(T_FOCO + .04, sonar(1.0, 80), .6)
add(T_FOCO + .04, whoosh(.9, 200), .35)
add(14.5, beep(980, .14), .24)                                        # etiqueta FOCO
d = 2.45
ruptura_x = lp(ruido(d), 260) * np.linspace(.2, 1, int(d * SR)) ** 1.5
add(T_FOCO + .1, ruptura_x / np.abs(ruptura_x).max(), .7)
add(T_FOCO + .1, trituracao(d, 140, 1200, 24) * np.linspace(.15, 1, int(d * SR)) ** 1.4, .35)
for k in range(46):                                                    # a ruptura estalando, cada vez mais denso
    u = rng.uniform(0, 1) ** .6
    add(T_FOCO + .2 + u * 2.3, crack(.03, 1800 + 1400 * u) * rng.uniform(.3, 1), .22 + .3 * u, rng.uniform(-.6, .6))
add(16.5, beep(1120, .14), .22)                                       # etiqueta EPICENTRO
add(T_FOCO + 745 / V_FOCO - .03, crack(.16, 1100), .85)               # chega à superfície
add(T_FOCO + 745 / V_FOCO - .03, boom(1.0, 60, 1.8), .75)

# =============================================================== 7. a ruptura corre pela falha (17,0 – 19,0)
add(T_RUP - .01, boom(2.8, 36, 2.8), 1.0)
add(T_RUP - .01, crack(.12, 1000), .85)
add(T_RUP, ronco(4.5, 130, .02, 3.0), .95)
add(T_RUP, trituracao(1.7, 150, 1100, 17) * jan(int(1.7 * SR), .02, 1.3), .5)
for yl in (0, -400, 410, 860, -860, 1500, -1500):                     # cada linha que a frente cruza estala
    add(T_RUP + abs(yl) / 1500 * 1.0, crack(.05, 1400) * (1 if yl == 0 else .75), .55, rng.uniform(-.4, .4))
for k in range(40):
    add(T_RUP + rng.uniform(0, 1.5), tique(rng.uniform(450, 1500), .04), rng.uniform(.1, .26), rng.uniform(-.6, .6))
add(T_RUP + .02, sonar(1.0, 85), .5)
add(T_RUP, poeira(1.9), .26)
add(T_RUP, chocalho(1.6, 70), .4)
add(TP, boom(.55, 70, 1.6), .45)                                      # a onda P chega à cidade: pancada seca
add(TP + .02, chocalho(.7, 55), .35)

# =============================================================== 8. as ondas P e S (19,0 – 22,6)
add(19.0, ronco(3.6, 100, .3, 1.8), .55)
add(TS - .05, boom(2.6, 34, 1.7) * np.hanning(int(2.6 * SR)) ** .5, .75)   # a onda S chega: o balanço grande
add(TS, ronco(3.2, 80, .25, 2.0) * (1 + .5 * np.sin(2 * np.pi * 2.2 * tt(3.2))), .7)
add(TS - .05, chocalho(2.5, 120), .55)                                  # as casas balançando
add(TS + .2, chocalho(1.8, 80, (400, 1800)), .35)
add(19.0, hp(ruido(3.4), 4500) * jan(int(3.4 * SR), .5, .6) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 3.2 * tt(3.4)))), .07)   # a pena do sismógrafo
add(19.0, beep(2100, .08), .22)
add(22.38, whoosh(.45, 450), .5)                                        # whip pan para o plano 9

# =============================================================== 9. o ciclo recomeça (22,6 – 25,4)
add(22.6, lp(ruido(2.8), 700) * jan(int(2.8 * SR), .3, .4), .1)        # vento leve
add(22.8, ronco(2.5, 70, .3, .3), .25)
ticks_ano(ano_ciclo, 22.8, TOTAL - .05, 5, .26, 1700)
d = TOTAL - 23.4
add(23.4, varredura(d, 90, 1500) * jan(int(d * SR), .6, .01) * (.65 + .35 * np.sin(2 * np.pi * 9 * tt(d))), .26)   # a tensão sobe até o estalo do loop
add(23.9, rangido(1.4, 420, 10), .22)
add(24.6, rangido(.8, 700, 15), .22)
for t in np.arange(23.8, TOTAL - .06, .08):
    add(t + rng.uniform(0, .04), crack(.02, 2800) * rng.uniform(.3, 1), .06 + (t - 23.8) / 1.6 * .2, rng.uniform(-.5, .5))

# =============================================================== mix final
mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.25) / np.tanh(1.25)
pico = np.abs(mix).max()
mix = mix / pico * .72
fade = np.ones(N)
fade[:int(.004 * SR)] = np.linspace(0, 1, int(.004 * SR))
mix *= fade[:, None]
raw = os.path.join(AQUI, '_tmp_sfx.f32')
mix.astype(np.float32).tofile(raw)
saida = os.path.join(AQUI, 'terremoto_sfx.mp3')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', raw, '-c:a', 'libmp3lame', '-b:a', '160k', saida], check=True)
os.remove(raw)
print('ok', saida, round(TOTAL, 1), 's')
