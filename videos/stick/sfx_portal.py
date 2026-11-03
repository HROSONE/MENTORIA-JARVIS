"""Gera a trilha de efeitos sonoros do vídeo do portal (sintetizada, sem amostras externas)."""
import numpy as np, wave, sys
SR = 44100
EV = dict(jump=2.4, look=3.2, sign1=4.8, sign2=5.4, sign3=6.0, portalG=6.4, enter=7.4, closeG=7.8, turn=8.6,
          portalV=9.6, exit=10.3, catch=11.0, closeV=11.3, turnBack=11.4, pet=12.6, meow2=15.4, end=18.0)
N = int(SR * EV['end']); L = np.zeros(N); Rr = np.zeros(N)
rng = np.random.default_rng(4)
t_all = np.arange(N) / SR

def add(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if j <= i: return
    s = sig[:j - i] * gain
    L[i:j] += s * np.sqrt(.5 * (1 - pan)); Rr[i:j] += s * np.sqrt(.5 * (1 + pan))
def env(n, a, r, sustain=None):
    e = np.ones(n); A = int(a * SR); Rl = int(r * SR)
    if A: e[:A] = np.linspace(0, 1, A)
    if Rl: e[-Rl:] *= np.linspace(1, 0, Rl)
    return e
def lowpass(x, cutoff):
    # filtro de 1 polo com corte variável
    cut = np.broadcast_to(cutoff, x.shape)
    a = np.exp(-2 * np.pi * cut / SR); y = np.zeros_like(x); prev = 0.0
    for i in range(len(x)): prev = (1 - a[i]) * x[i] + a[i] * prev; y[i] = prev
    return y
def noise(d): return rng.standard_normal(int(d * SR))

def meow(dur=.75, f0=520):
    n = int(dur * SR); t = np.arange(n) / SR; k = t / dur
    f = f0 * (1 + .45 * np.sin(np.pi * np.clip(k * 1.15, 0, 1))) * (1 - .25 * k)   # "mi-aaau"
    ph = 2 * np.pi * np.cumsum(f) / SR
    vib = 1 + .02 * np.sin(2 * np.pi * 6 * t)
    s = sum(np.sin(h * ph * vib) * a for h, a in [(1, 1), (2, .55), (3, .4), (4, .22), (5, .12), (6, .06)])
    bright = .3 + .7 * np.sin(np.pi * np.clip(k * 1.1, 0, 1))
    s = s * (.6 + .4 * bright) + .25 * bright * np.sin(7 * ph)
    return s * env(n, .04, .25) * .28
def whoosh(dur, f_from, f_to, gain=1.0):
    n = int(dur * SR); k = np.linspace(0, 1, n)
    cut = f_from * (f_to / f_from) ** k
    return lowpass(noise(dur), cut) * np.sin(np.pi * k) ** 1.5 * gain
def clap():
    n = int(.25 * SR); t = np.arange(n) / SR
    s = noise(.25) * np.exp(-t * 38) * .6 + np.sin(2 * np.pi * 95 * t) * np.exp(-t * 22) * .8
    return s
def chime(f=1320, dur=.9):
    n = int(dur * SR); t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * m * t) * np.exp(-t * (4 + 2 * m)) * a for m, a in [(1, .5), (2.01, .25), (3.02, .12)])
def portal_open(dur=1.2):
    n = int(dur * SR); t = np.arange(n) / SR; k = t / dur
    f = 140 + 520 * k ** .6
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * .35 + np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * .15
    s += whoosh(dur, 300, 4000) * .5
    s += chime(990, dur) * .5
    return s * env(n, .02, .4)
def portal_hum(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * 70 * t) * .4 + np.sin(2 * np.pi * 105 * t) * .2) * (.7 + .3 * np.sin(2 * np.pi * 4 * t))
    s += lowpass(noise(dur), 900) * .15 * (.6 + .4 * np.sin(2 * np.pi * 3 * t))
    return s * env(n, .15, .3)
def portal_close(dur=.6):
    n = int(dur * SR); t = np.arange(n) / SR; k = t / dur
    f = 700 * (1 - k) ** 1.5 + 60
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * .4 + whoosh(dur, 3000, 200) * .4
    return s * env(n, .01, .15)
def bloop():
    n = int(.35 * SR); t = np.arange(n) / SR
    f = 600 * np.exp(-t * 9) + 120
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * .6
def thud():
    n = int(.3 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 70 * t) * np.exp(-t * 18) + lowpass(noise(.3), 600) * np.exp(-t * 25) * .5) * .8
def purr(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    am = np.clip(np.sin(2 * np.pi * 25 * t), 0, 1) ** 2 * (.6 + .4 * np.sin(2 * np.pi * .55 * t) ** 2)
    s = lowpass(noise(dur), 260) * am * 2.2 + np.sin(2 * np.pi * 50 * t) * am * .25
    return s * env(n, .6, .8)
def fall_wind(dur):
    n = int(dur * SR); k = np.linspace(0, 1, n)
    return lowpass(noise(dur), 300 + 1600 * k) * (k ** .5) * env(n, .3, .3) * .9

# ---- ambiente da cidade
amb = lowpass(rng.standard_normal(N), 350) * .12
add(amb, 0, 1.0)
# ---- eventos
add(meow(.7, 560), 1.85, .9, -.2)                      # miau no telhado
add(whoosh(.5, 400, 2500, .5), EV['jump'] - .05, .9)    # pulo
add(fall_wind(EV['enter'] - EV['jump']), EV['jump'] + .1, .8)
add(meow(.5, 680), EV['jump'] + .55, .6, -.1)           # miau assustado caindo
add(whoosh(.35, 800, 3000, .4), EV['look'], .7, .2)     # stickman vira a cabeça
for k, nm in enumerate(['sign1', 'sign2', 'sign3']):
    add(clap(), EV[nm] - .02, .9 + .1 * k)
    add(chime(1100 + 220 * k, .5), EV[nm], .35)
add(portal_open(), EV['portalG'] - .1, 1.0)
add(portal_hum(EV['closeG'] - EV['portalG'] + .4), EV['portalG'] + .2, .7)
add(bloop(), EV['enter'], 1.0)
add(portal_close(), EV['closeG'], .9)
add(whoosh(.8, 300, 1200, .4), EV['turn'], .7)          # vira de costas
add(portal_open(), EV['portalV'] - .1, 1.0, .1)
add(portal_hum(EV['closeV'] - EV['portalV'] + .3), EV['portalV'] + .2, .7)
add(whoosh(.7, 600, 4000, .7), EV['exit'] - .05, 1.0)  # gato sai voando
add(meow(.45, 700), EV['exit'] + .1, .55)
add(thud(), EV['catch'], 1.0)
add(portal_close(), EV['closeV'], .9)
add(purr(EV['end'] - EV['pet'] + .1), EV['pet'] - .1, .9)
add(meow(.9, 470), EV['meow2'], .75, .1)                # miau feliz
add(chime(1760, 1.2), 13.0, .25)                        # brilho do "inscreva-se"
# ---- mix final
mx = np.stack([L, Rr], 1)
mx = np.tanh(mx * 1.3) / np.tanh(1.3)
mx *= .9 / max(1e-6, np.abs(mx).max())
out = sys.argv[1] if len(sys.argv) > 1 else 'portal_sfx.wav'
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mx * 32767).astype(np.int16).tobytes())
print('ok', out, round(N / SR, 2), 's')
