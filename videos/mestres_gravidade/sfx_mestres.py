"""Som do Short "Mestres da Gravidade" (30 s), tudo sintetizado em Python: vento grave nas rochas, silêncio tenso e o estalo do casco (0-5 s),
batida grave tipo coração/tambor sincronizada com cada salto e pouso (5-12 s), farfalhar, mastigar e cordas em pizzicato (12-20 s),
vilarejo com latidos distantes e cascos nas telhas (20-26 s) e um único acorde de violoncelo com a aterrissagem seca (26-30 s).
Os tempos seguem planos.js (saltos em 5,3/6,65/6,8/8,15/8,3/9,8/10,0/10,8/10,9; telhado a 1,1 ciclo/s; salto final em 27,65; pouso em 28,8).
Saída: mestres_sfx.mp3.   Uso: python3 sfx_mestres.py   (precisa de numpy, scipy e ffmpeg)"""
import os, subprocess, wave
import numpy as np
from scipy.signal import butter, sosfilt

AQUI = os.path.dirname(os.path.abspath(__file__))
SR = 44100
TOTAL = 30.0
N = int(SR * TOTAL)
L, R = np.zeros(N), np.zeros(N)
rng = np.random.default_rng(2026)

def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def ruido(d): return rng.standard_normal(int(d * SR))
def tt(d): return np.arange(int(d * SR)) / SR
def env(n, a=.005, r=.1):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(r, 1e-4))
def jan(n, a=.05, b=.1):
    t = np.arange(n) / SR; d = n / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.minimum(1, (d - t) / max(b, 1e-4))
def norm(x): return x / (np.abs(x).max() + 1e-9)
def add(t, x, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or i + len(x) <= 0: return
    x = x[max(0, -i):]; i = max(0, i); x = x[:N - i]
    L[i:i + len(x)] += x * g * (1 - max(0, pan)); R[i:i + len(x)] += x * g * (1 + min(0, pan))

# ------------------------------------------------------------ sons
def vento(d, nivel=1.0, f1=90, f2=900, lento=.3):
    out = []
    for _ in range(2):
        x = bp(ruido(d), f1, f2); t = tt(d)
        out.append(x * (1 + .5 * np.sin(2 * np.pi * lento * t + rng.uniform(0, 6)) + .25 * np.sin(2 * np.pi * lento * 2.9 * t + rng.uniform(0, 6))) * nivel)
    return out
def whoosh(d, f0, f1, q=.7):
    t = tt(d); n = len(t); base = ruido(d); out = np.zeros(n); P = 36
    for k in range(P):
        a, b = int(n * k / P), int(n * (k + 1) / P); fc = f0 * (f1 / f0) ** ((k + .5) / P)
        out[a:b] = bp(base, fc * (1 - q * .5), fc * (1 + q))[a:b]
    return norm(out * np.sin(np.pi * t / d) ** 1.3)
def estalo(d=.2):                      # casco seco na pedra
    t = tt(d); x = hp(ruido(d), 1800) * env(len(t), .0004, .012) + np.sin(2 * np.pi * 210 * (1 + 1.5 * np.exp(-t / .015)) * t) * env(len(t), .001, .05) * .8 + lp(ruido(d), 700) * env(len(t), .001, .04) * .5
    x[:30] += np.linspace(2, 0, 30)
    return norm(x)
def pedrinha(f=2600, d=.06):
    t = tt(d); return norm(np.sin(2 * np.pi * f * t) * env(len(t), .0004, .01) + hp(ruido(d), 3000) * env(len(t), .0003, .004) * .6)
def tambor(d=.5, f=95):                # tom grave estilo percussão tribal / batida de coração
    t = tt(d); fr = f * (1 + 1.1 * np.exp(-t / .045)); x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(len(t), .002, .16) + lp(ruido(d), 260) * env(len(t), .001, .05) * .5
    return norm(x)
def coracao(g=1.0):
    a = tambor(.4, 62); b = tambor(.35, 52) * .7; x = np.zeros(int(.7 * SR)); x[:len(a)] += a; i = int(.19 * SR); x[i:i + len(b)] += b[:len(x) - i]; return x * g
def telha(f=1700, d=.09):              # casco na telha de barro: toc oco + estalinho
    t = tt(d); return norm(np.sin(2 * np.pi * f * (1 + .4 * np.exp(-t / .01)) * t) * env(len(t), .0006, .025) + hp(ruido(d), 2500) * env(len(t), .0004, .006) * .7 + bp(ruido(d), 500, 1400) * env(len(t), .001, .02) * .4)
def folhas(d, nivel=1.0):
    out = []
    for _ in range(2):
        x = bp(ruido(d), 2500, 9000); t = tt(d)
        out.append(x * np.abs(np.sin(2 * np.pi * .8 * t + rng.uniform(0, 6))) ** 2.2 * (.5 + .5 * np.sin(2 * np.pi * .31 * t + rng.uniform(0, 6))) * nivel)
    return out
def mastigar(d=.11):
    n = int(d * SR); x = np.zeros(n)
    for dt, g in [(0, 1.0), (.017, .7), (.04, .5)]:
        i = int(dt * SR); c = bp(ruido(.05), 1500, 6500) * env(int(.05 * SR), .0006, .012); x[i:i + len(c)] += (c * g)[:max(0, n - i)]
    x += lp(ruido(d), 500) * env(n, .003, .035) * .8
    return norm(x)
def latido(d=.38, f0=330):             # cachorro ao longe: duas sílabas com formantes
    t = tt(d); f = f0 * (1.15 - .4 * np.minimum(1, t / .14)); ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(np.sin(ph * k) / k for k in range(1, 14)) + .5 * ruido(d) * .5
    y = bp(x, 500, 900) + .8 * bp(x, 1200, 2000)
    return norm(lp(y, 3000) * env(len(t), .01, .12))
def pluck(f, d=.7, brilho=.5):         # pizzicato (Karplus-Strong)
    n = int(d * SR); p = max(2, int(SR / f)); buf = (rng.uniform(-1, 1, p) * brilho + (1 - brilho) * np.sin(np.linspace(0, 6.28, p) * 2)); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]; buf[i % p] = .5 * (buf[i % p] + buf[(i + 1) % p]) * .9955
    return norm(out) * env(n, .001, d / 2.2)
def corda(f, d, vib=5.2):              # violoncelo: serras levemente desafinadas, filtro, vibrato, ataque suave
    t = tt(d); x = np.zeros(len(t))
    for det in (-.0035, 0, .0035):
        fr = f * (1 + det) * (1 + .004 * np.sin(2 * np.pi * vib * t + det * 90)); ph = 2 * np.pi * np.cumsum(fr) / SR; x += (2 * ((ph / (2 * np.pi)) % 1) - 1)
    x = lp(x, 1100) + .15 * bp(ruido(d), 800, 2500)
    return norm(x * np.minimum(1, t / .18) * np.exp(-np.maximum(0, t - .5) / 1.9) * (1 + .06 * np.sin(2 * np.pi * 4.6 * t)))

def mix():
    # -------- vento (camas) --------
    def cama(t0, t1, nivel, f1, f2, lento=.3, fade=.5):
        d = t1 - t0; v = vento(d, nivel, f1, f2, lento); j = jan(len(v[0]), fade, fade); add(t0, v[0] * j, 1, -.4); add(t0, v[1] * j, 1, .4)
    cama(0, 3.6, .9, 70, 700, .25, .1)        # vento grave cortando as rochas
    cama(3.4, 4.6, .12, 70, 500, .2, .5)      # silêncio tenso
    cama(4.4, 12.2, .5, 80, 900, .22)
    cama(11.8, 20.4, .22, 200, 1500, .3)
    cama(20, 26.2, .2, 150, 1200, .25)
    cama(25.6, 29.9, .16, 120, 900, .25)
    # -------- 0-5: zoom + estalo --------
    add(0.0, whoosh(1.4, 120, 1600), .55, 0)
    add(4.72, estalo(.25), 1.0, 0); add(4.74, lp(ruido(.6), 400) * env(int(.6 * SR), .02, .25), .15, 0)
    for tq, g in ((4.95, .5), (5.18, .4), (5.5, .3)): add(tq, pedrinha(2600 - 400 * (tq - 4.9)), g, .2)   # pedrinha cai
    # -------- 5-12: escalada, batida sincronizada --------
    saltos = [(5.3, 6.65), (6.8, 8.15), (8.3, 9.8), (10.0, 10.8), (10.9, None)]
    for dec, pou in saltos:
        add(dec, tambor(.45, 100), .7, -.1); add(dec - .01, estalo(.12), .3, -.2)
        if pou: add(pou, tambor(.5, 78), .95, .1); add(pou, estalo(.16), .55, .1); add(pou + .01, bp(ruido(.5), 2500, 7000) * env(int(.5 * SR), .02, .22), .12, 0)
    for k in range(0, 14): add(5.0 + k * .5, coracao(.35), 1, 0)          # coração que acelera sob tudo
    add(8.6, whoosh(1.0, 400, 1800), .12, 0)
    add(9.8, bp(ruido(.9), 600, 3000) * env(int(.9 * SR), .01, .3), .2, 0)  # casco agarrando a microfissura (rangido de pedra)
    add(10.9, whoosh(1.1, 200, 2400), .35, 0)
    add(11.95, whoosh(.5, 3000, 600), .25, 0)                              # match cut
    # -------- 12-20: arganeira --------
    f = folhas(8, .25); add(12, f[0] * jan(len(f[0]), .5, .5), 1, -.5); add(12, f[1] * jan(len(f[1]), .5, .5), 1, .5)
    for k in range(0, 14):
        tc = .0667 + .588 * k
        while tc < 12.2: tc += .588 * 15
    tc = .0667 + .588 * 21                                                  # (primeira mordida da cabra 3 depois de 12 s)
    while tc < 20:
        g = .15 if tc < 17.5 else .55
        add(tc, mastigar(.11), g, .1); tc += .588
    for i, fq in ((0, 1.5), (1, 1.6), (3, 1.8), (4, 1.9)):                  # as outras mastigando, mais longe
        ph = (i * 2 + np.pi * 1.5) / (2 * np.pi * fq); tc = 12.2 + (ph % (1 / fq))
        while tc < 18: add(tc, mastigar(.1), .11, (-.5 if i % 2 else .5)); tc += 1 / fq
    # pizzicato curioso (D maior pentatônico), 100 bpm em colcheias
    pad = [[293.66, 0, 369.99, 0, 440, 369.99, 329.63, 0], [493.88, 0, 440, 0, 369.99, 440, 587.33, 0], [440, 369.99, 329.63, 293.66, 329.63, 0, 369.99, 0], [293.66, 0, 329.63, 369.99, 440, 0, 0, 0]]
    nota = {}
    for i in range(27):
        fq = pad[(i // 8) % 4][i % 8]
        if fq: nota.setdefault(fq, pluck(fq, .6, .6)); add(12.2 + i * .3, nota[fq], .32, .15 if i % 2 else -.15)
    for i in range(14):
        fq = 146.83 if i % 2 == 0 else 110.0; nota.setdefault(fq, pluck(fq, .8, .35)); add(12.2 + i * .6, nota[fq], .4, 0)
    # -------- 20-26: vilarejo --------
    for tl, fq in ((21.3, 330), (21.72, 300), (22.9, 340), (24.7, 310), (25.1, 330)): add(tl, latido(.3, fq), .22, .4)
    for n in range(0, 6):                                                    # cascos nas telhas: 1,1 ciclo/s, 4 apoios por ciclo
        for off in (0, .5, .75, .25):
            Lc = (n + (1 - off) % 1) / 1.1
            if 0.25 < Lc < 4.05: add(20 + Lc, telha(1500 + 250 * rng.random()), .5, -.1 + .3 * rng.random())
    add(24.1, telha(1400), .45, 0)
    # -------- 26-30: salto final --------
    add(27.55, whoosh(.6, 200, 1200), .2, 0)
    add(27.65, tambor(.4, 90), .75, 0); add(27.65, telha(1300), .6, 0)
    add(28.8, estalo(.2) * .9, .95, 0); add(28.8, tambor(.5, 70), .6, 0)       # aterrissagem seca
    for fq, g in ((73.42, 1.0), (110.0, .8), (146.83, .8), (185.0, .55), (220.0, .45)): add(28.8, corda(fq, 1.25), .3 * g, 0)   # acorde de violoncelo (ré maior)

mix()
for x in (L, R): x -= x.mean()
S = np.tanh(np.stack([L, R], 1) * 1.2); S /= np.abs(S).max(); S *= .72
S[int(29.72 * SR):] *= np.linspace(1, 0.55, len(S) - int(29.72 * SR))[:, None]      # o preto corta a imagem; o acorde ainda soa
tmp = os.path.join(AQUI, '_sfx_tmp.wav'); sai = os.path.join(AQUI, 'mestres_sfx.mp3')
with wave.open(tmp, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((S * 32767).astype(np.int16).tobytes())
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-b:a', '160k', sai], check=True); os.remove(tmp)
print('ok', sai, 'pico', float(np.abs(S).max()))
