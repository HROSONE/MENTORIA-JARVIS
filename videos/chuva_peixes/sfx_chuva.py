"""Som do Short "Chuva de Peixes" (44,6 s). Regras do canal (DIRETRIZES.md, seção 4, depois do "Mestres da Gravidade"):
 - NADA de cama de ruído sintetizada e NADA de música; síntese só para impactos curtos, um por ação visível, volume contido;
 - o único "ambiente" é uma gravação real de chuva (OpenGameArt, "Rain (loopable)" de Ylmir, licença CC0), bem baixa, sem graves nem agudos;
 - nas cenas sem chuva (manhã em Yoro, mar) só os impactos; a narração é gravada pelo dono (este arquivo não tem voz).
Os tempos vêm da mesma linha do tempo de js/planos.js (relógio da física em câmera lenta) e de eventos_som.json (gerado por eventos_som.js).
Saída: chuva_sfx.mp3 (+ relatório de verificação no terminal).   Uso: python3 sfx_chuva.py <pasta com 3.mp3 da chuva>   (precisa de numpy, scipy e ffmpeg)"""
import os, sys, json, subprocess
import numpy as np
from scipy.signal import butter, sosfilt

AQUI = os.path.dirname(os.path.abspath(__file__))
SR = 44100
TOTAL = 44.6
N = int(SR * TOTAL)
L, R = np.zeros(N), np.zeros(N)
rng = np.random.default_rng(1511)
EV = json.load(open(os.path.join(AQUI, 'eventos_som.json')))
CHUVA = sys.argv[1] if len(sys.argv) > 1 else '/tmp/chuvasom/chuva_ogacc0/mp3/3.mp3'

def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def ruido(d): return rng.standard_normal(int(d * SR))
def tt(d): return np.arange(int(d * SR)) / SR
def env(n, a=.003, r=.05):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(r, 1e-4))
def add(t, x, g=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N or i + len(x) <= 0: return
    x = x[max(0, -i):]; i = max(0, i); x = x[:N - i]
    L[i:i + len(x)] += x * g * (1 - max(0, pan)); R[i:i + len(x)] += x * g * (1 + min(0, pan))
def db(x): return 10 ** (x / 20)

# ------------------------------------------------------------------------------------------ linha do tempo (igual a planos.js)
def suave(u): u = min(1, max(0, u)); return u * u * (3 - 2 * u)
T_PULO = 0.017
def rate_a(t): return 0.025 if t < 1.8 else (0.025 + 0.975 * suave((t - 1.8) / 1.8) if t < 3.6 else 1.0)
dt = 1 / 2000; _ta = [T_PULO]
for i in range(int(12 / dt)): _ta.append(_ta[-1] + rate_a(i * dt) * dt)
_ta = np.array(_ta)
def t_de_tau_a(tau): return float(np.searchsorted(_ta, tau)) * dt                     # tempo de filme em que a física chega a tau (abertura)
def rate_f(tf): return 1.0 if tf < 3.2 else (1 + (0.025 - 1) * suave((tf - 3.2) / 2.0) if tf < 5.2 else 0.025)
_tf = np.zeros(int(6 / dt) + 2)
for i in range(len(_tf) - 2, -1, -1): _tf[i] = _tf[i + 1] + rate_f(i * dt) * dt
_tf = T_PULO - _tf + _tf[int(6 / dt)]                                                   # tau do fecho: termina em T_PULO
def t_de_tau_f(tau): return float(np.searchsorted(_tf, tau)) * dt

# ------------------------------------------------------------------------------------------ sons (impactos curtos)
def rasgo(g=1.0):                                    # tecido que rasga: estalo curto de ruído em banda média + um "pop" seco
    d = .16; n = int(d * SR); x = bp(ruido(d), 1400, 6500) * env(n, .002, .045)
    x += .7 * bp(ruido(d), 500, 1800) * env(n, .004, .07); t = tt(d); x += .5 * np.sin(2 * np.pi * (260 - 400 * t) * t) * env(n, .002, .03)
    return x / np.abs(x).max() * g
def splat(g=1.0, grave=1.0):                        # peixe molhado batendo no chão: baque curto + ruído molhado + 3 a 5 respingos
    d = .22; n = int(d * SR); t = tt(d)
    x = grave * np.sin(2 * np.pi * (150 - 700 * t) * t) * env(n, .002, .05)
    x += lp(ruido(d), 1800) * env(n, .002, .06) * .8 + bp(ruido(d), 2500, 6000) * env(n, .001, .02) * .35
    for _ in range(int(rng.integers(3, 6))):
        i = int(rng.uniform(.02, .17) * SR); k = int(.004 * SR)
        x[i:i + k] += hp(ruido(.004), 2500)[:k] * env(k, .0005, .0015) * rng.uniform(.15, .35)
    return x / np.abs(x).max() * g
def tap(g=1.0):                                      # peixe pequeno batendo em laje/asfalto molhado
    d = .09; n = int(d * SR); t = tt(d)
    x = np.sin(2 * np.pi * (240 - 900 * t) * t) * env(n, .001, .022) * .6 + bp(ruido(d), 900, 4200) * env(n, .001, .018)
    return x / np.abs(x).max() * g
def passo(g=1.0):                                    # passo na rua molhada: baque + respingo
    d = .2; n = int(d * SR); t = tt(d)
    x = np.sin(2 * np.pi * (110 - 300 * t) * t) * env(n, .003, .05) + lp(ruido(d), 1400) * env(n, .003, .05) * .9 + bp(ruido(d), 2200, 5200) * env(n, .008, .035) * .35
    return x / np.abs(x).max() * g
def trovao(g=1.0):                                   # estrondo grave curto (sem agudos): onda de 45 a 60 Hz e ruído passa-baixa, cai em ~1,2 s
    d = 1.3; n = int(d * SR); t = tt(d)
    x = np.sin(2 * np.pi * (58 - 9 * t) * t) * env(n, .03, .35) + lp(ruido(d), 160) * env(n, .05, .45) * 1.2 + lp(ruido(d), 420) * env(n, .015, .12) * .5
    return lp(x, 380) / np.abs(x).max() * g

# ------------------------------------------------------------------------------------------ eventos
log = []
def ev(nome, t, x, g, pan=0.0): add(t, x, g, pan); log.append((round(t, 2), nome, round(20 * np.log10(g + 1e-9), 1)))

# abertura (0 a 7,6 s): o rasgo já no quadro 0 (o peixe fura o tecido) e o pouso em câmera lenta que acelera; depois ele se debate
ev('rasgo do tecido (quadro 0)', 0.0, rasgo(), db(-10))
tg = EV['tg']; dur = [0.36 * 0.78 ** i for i in range(9)]; acc = 0.0
for k in range(7):
    tau = tg + acc; tk = t_de_tau_a(tau)
    ev('peixe bate no chão' if k == 0 else f'peixe quica ({k})', tk, splat(1.0, 1.0 if k == 0 else .7), db(-9 if k == 0 else -15 - 2.2 * k), pan=0.2)
    acc += dur[k]
# manhã em Yoro (7,6 a 16,6 s): peixes que se debatem perto da câmera (poucos por segundo, bem baixos)
def zcam(tl): return np.interp(tl, [0, 3, 6, 9], [-9.5, -3.2, 0.7, 2.5])
taps = []
for f in EV['yoro']:
    if not f['fl'] or abs(f['x']) > 4.6: continue
    for k in range(-1, 40):
        tl = (np.pi + 2 * np.pi * k - f['fase']) * f['per'] / (2 * np.pi)
        if 0.3 < tl < 8.7 and zcam(tl) + 1.5 < f['z'] < zcam(tl) + 9: taps.append((tl, f))
taps.sort(key=lambda a: a[0]); ultimo = -1
for tl, f in taps:
    if tl - ultimo < 0.22: continue
    ultimo = tl; dist = max(1.0, f['z'] - zcam(tl)); ev('peixe se debate na rua', 7.6 + tl, tap(), db(-21 - 2.5 * np.log2(dist)), pan=float(np.clip(f['x'] / 5, -.8, .8)))
# lenda (16,6 a 25,6 s): dois trovões nos relâmpagos e peixes batendo na laje molhada
for tl in (2.35, 6.1): ev('trovão', 16.6 + tl + 0.35, trovao(), db(-13))
pous = sorted(EV['pousosL']); ultimo = -1
for k, p in enumerate(pous):
    if rng.random() > .30 or p - ultimo < 0.07: continue
    ultimo = p; ev('peixe cai na praça', 16.6 + p, tap() if rng.random() < .7 else splat(1.0, .5), db(rng.uniform(-24, -18)), pan=float(rng.uniform(-.7, .7)))
# corte do chão (32,1 a 38,6 s): peixes cuspidos pelo poço e batendo na rua
for i in range(16):
    sai = 3.7 + 0.17 * i; vy = 5.0 + 1.2 * ((i * 0.53) % 1); u = (vy + np.sqrt(vy * vy + 4 * 4.9 * 0.02)) / 9.8
    if sai < 6.4: ev('peixe sai do poço', 32.1 + sai, tap(), db(-22), pan=.15)
    if sai + u < 6.45: ev('peixe bate na rua', 32.1 + sai + u, splat(1.0, .6), db(-17.5), pan=float(0.5 if i % 2 else -0.5))
# fecho (38,6 a 44,6 s): passos da mulher na rua molhada (só enquanto a câmera lenta ainda não começou) e, depois do corte do loop, o rasgo do quadro 0
dp = 0.9667
for n in range(-12, 4):
    for c0 in (0.954, 0.473):
        tau = (c0 + n * dp) / 0.55
        if tau < _tf[0] + .05 or tau > 0.0: continue
        tf = t_de_tau_f(tau)
        if tf < 5.0: ev('passo', 38.6 + tf, passo(), db(-19), pan=-.1)

# ------------------------------------------------------------------------------------------ chuva de gravação real (CC0), bem baixa e filtrada, só onde há chuva na imagem
def ler(f):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)
chuva = ler(CHUVA)
chuva = hp(chuva, 150); chuva = lp(chuva, 4800)                                         # sem trovões de chão e sem chiado
rms = np.sqrt(np.mean(chuva ** 2)); chuva = np.tanh(chuva / (3.2 * rms)) * 3.2 * rms    # segura as gotas isoladas mais altas
chuva *= db(-36) / np.sqrt(np.mean(chuva ** 2))                                          # média de -36 dBFS (cama bem baixa)
zonas = [(0.0, 7.6, 0.0), (16.6, 25.6, 9.0), (32.1, 44.6, 20.0)]                         # (início no vídeo, fim, ponto de início na gravação)
cama = np.zeros(N)
for a, b, off in zonas:
    n = int((b - a) * SR); i0 = int(off * SR); seg = chuva[i0:i0 + n]
    f = np.ones(len(seg)); fi = int(.35 * SR); f[:fi] = np.linspace(0, 1, fi) if a > 0 else 1; f[-fi:] = np.linspace(1, 0, fi) if b < TOTAL - .01 else 1
    cama[int(a * SR):int(a * SR) + len(seg)] += seg * f
# o rasgo e os impactos entram por cima; a mixagem é estéreo (a gravação da chuva é a mesma nos dois lados)
L += cama; R += cama

# ------------------------------------------------------------------------------------------ mixagem final, verificação e MP3
mix = np.stack([L, R], 1); mix = np.tanh(mix * 1.2) / 1.2                                # limitador suave
pico = np.abs(mix).max()
if pico > db(-3): mix *= db(-3) / pico
wav = os.path.join(AQUI, 'chuva_sfx.wav')
import wave
with wave.open(wav, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '160k', os.path.join(AQUI, 'chuva_sfx.mp3')], check=True)
os.remove(wav)
# relatório: média, pico, energia por faixa (chiado) e lista de eventos
m = mix.mean(1); rmsg = 20 * np.log10(np.sqrt(np.mean(m ** 2)) + 1e-12); pk = 20 * np.log10(np.abs(m).max() + 1e-12)
Nf = 16384; P = np.mean([np.abs(np.fft.rfft(m[i:i + Nf] * np.hanning(Nf))) ** 2 for i in range(0, len(m) - Nf, Nf)], axis=0); fr = np.fft.rfftfreq(Nf, 1 / SR)
faixas = [(0, 150), (150, 800), (800, 2500), (2500, 5000), (5000, 9000), (9000, 22050)]; tot = P.sum()
print(f'média {rmsg:.1f} dBFS (limite -18), pico {pk:.1f} dBFS; eventos: {len(log)}')
print('energia por faixa (%):', {f'{a}-{b}': round(100 * P[(fr >= a) & (fr < b)].sum() / tot, 1) for a, b in faixas})
import collections
resumo = collections.Counter(n.split(' (')[0] for _, n, _ in log); print('eventos por tipo:', dict(resumo))
for t, nome, g in sorted(log):
    if nome.startswith(('rasgo', 'peixe bate', 'peixe quica', 'trovão', 'passo', 'peixe sai', 'peixe bate na rua')): print(f'  {t:6.2f} s  {nome}  ({g} dB)')
