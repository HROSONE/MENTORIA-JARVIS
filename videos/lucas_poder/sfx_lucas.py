# Trilha de efeitos do Short "Ele podia voar" (50 s): só gravações reais CC0 do BigSoundBank (biblioteca3d/sons/bsb) mais
# impactos curtos sintetizados. Sem música e sem cama sintetizada. Gera WAV estéreo 48 kHz e confere o nível médio (alvo <= -18 dB).
# uso: python3 sfx_lucas.py saida.wav
import subprocess, sys, os
import numpy as np

SR = 48000; DUR = 50.0
BSB = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'biblioteca3d', 'sons', 'bsb')
_cache = {}

def ler(i, ini=0.0, dur=None, vel=1.0):
    """decodifica um .ogg (estéreo, 48 kHz); vel != 1 muda tempo e tom juntos (como fita)"""
    k = (i, ini, dur, vel)
    if k in _cache: return _cache[k]
    cmd = ['ffmpeg', '-v', 'error', '-ss', str(ini)] + (['-t', str(dur)] if dur else []) + ['-i', os.path.join(BSB, f'{i}.ogg'), '-ac', '2', '-ar', str(int(SR / vel)), '-f', 'f32le', '-']
    a = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).copy()
    _cache[k] = a          # reamostrado para SR/vel e lido como SR: tempo e tom multiplicados por vel
    return a

mix = np.zeros((int(SR * DUR), 2), np.float32)

def env(n, ataque=0.02, soltura=0.2):
    e = np.ones(n, np.float32); a = int(ataque * SR); r = int(soltura * SR)
    if a: e[:min(a, n)] = np.linspace(0, 1, min(a, n))
    if r: e[max(0, n - r):] *= np.linspace(1, 0, n - max(0, n - r))
    return e[:, None]

def por(a, t, db=0.0, ataque=0.01, soltura=0.1, pan=0.0, ate=None):
    """coloca o som `a` no instante t (s), com ganho em dB, rampas e pan (-1 esq .. 1 dir); `ate` corta no instante dado"""
    i0 = int(t * SR); a = a.copy()
    if ate is not None: a = a[:max(0, int((ate - t) * SR))]
    if i0 < 0: a = a[-i0:]; i0 = 0
    a = a[:max(0, len(mix) - i0)]
    if not len(a): return
    a *= env(len(a), ataque, soltura) * (10 ** (db / 20))
    if pan: a[:, 0] *= min(1, 1 - pan); a[:, 1] *= min(1, 1 + pan)
    mix[i0:i0 + len(a)] += a

def laco(i, t0, t1, db, ini=0.0, ataque=0.3, soltura=0.3, vel=1.0):
    """leito contínuo de t0 a t1 a partir de uma gravação longa (sem repetição se couber)"""
    a = ler(i, ini, (t1 - t0) * vel + 0.5, vel)
    while len(a) < (t1 - t0) * SR: a = np.concatenate([a, a])
    por(a[:int((t1 - t0) * SR)], t0, db, ataque, soltura)

def baque(f0=55, dur=0.5, queda=7.0):
    """impacto curto sintetizado: seno grave que cai de tom com decaimento rápido (só como reforço de um som real)"""
    t = np.arange(int(dur * SR)) / SR; f = f0 * (1 + 1.5 * np.exp(-t * 25))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * queda)
    return np.stack([s, s], 1).astype(np.float32)

# ---------------------------------------------------------------- 0-4 s  GANCHO: tempestade no quarto, lata e gibi caem, trovão
laco('0740', 0, 4.0, 4, ini=20, ataque=0.05, soltura=0.15)
por(ler('0246', 0.0, 0.9), 0.33, -4, 0.002, 0.2, pan=0.3)             # lata batendo no chão
por(ler('0576', 0.0, 0.6), 0.45, -12, 0.002, 0.2, pan=-0.2)           # gibi caindo
por(ler('3115', 0.0, 3.0), 1.55, -3, 0.01, 0.8)                       # trovão com o relâmpago
rw = ler('1796')[::-1].copy(); por(rw, 4.0 - len(rw) / SR, -6, 0.02, 0.01)   # sopro ao contrário: rebobina para dois anos antes

# ---------------------------------------------------------------- 4-19 s  A VIATURA
laco('0291', 4.0, 8.0, -14, ataque=0.15, soltura=0.2)                 # P2 drone: motor de fora
laco('1284', 4.0, 8.0, -10, ataque=0.15, soltura=0.2)                 #            pneus no cascalho
laco('0146', 4.0, 8.0, -14, ini=10, ataque=0.3, soltura=0.2)          #            vento do vale
laco('3099', 8.0, 17.5, -4, ini=30, ataque=0.08, soltura=0.1)         # P3-P6 interior: rodagem
por(ler('1394', 0.0, 1.3), 14.2, -14, 0.05, 0.2, pan=0.2)             # P5b garrafas tremendo na caixa
por(ler('1394', 1.2, 1.4), 15.4, -16, 0.05, 0.3, pan=0.2)
ronco = ler('3113', 0.0, 5.0, vel=0.5); por(ronco[:int(3.6 * SR)], 15.5, -2, 0.8, 0.3)   # P6 ronco grave crescendo (trovão real a meia velocidade)
laco('0291', 17.5, 19.0, -10, ataque=0.05, soltura=0.05)              # P7 de fora: a lataria range e treme
por(ler('0322', 0.0, 1.5), 17.6, -6, 0.01, 0.2); por(ler('1394', 0.3, 1.4), 17.8, -10, 0.02, 0.2)

# ---------------------------------------------------------------- 19-29 s  A QUEDA
ex = ler('1023', 0.0, 4.5, vel=0.55)                                    # explosão real, em câmera lenta
por(ex, 19.0, 2, 0.002, 1.0)
por(ler('1808', 0.0, 0.33), 19.0, -6, 0.0, 0.05); por(ler('0148', 0.0, 1.9), 19.03, -10, 0.0, 0.4)   # estalo + vidro estourando
por(baque(42, 1.2, 3.0), 19.0, -8, 0.002, 0.3)                          # reforço grave curto
por(ler('1388', 2.0, 9.0), 19.4, -20, 0.5, 1.5, ate=29.0)               # zumbido no ouvido depois do estouro
laco('0155', 20.8, 23.3, -8, ini=5, ataque=0.25, soltura=0.15)          # Q2 vento assobiando na queda
laco('0146', 20.8, 23.3, -6, ini=40, ataque=0.25, soltura=0.15)
for tb, db in [(23.45, -6), (25.35, -8), (25.75, -9)]:                  # as bolhas se formam: "whump" (sopro real grave)
    por(ler('1800', vel=0.45), tb, db, 0.01, 0.3); por(baque(70, 0.45, 9.0), tb, -16, 0.002, 0.2)
laco('0146', 23.2, 27.6, -18, ini=60, ataque=0.4, soltura=0.4)          # vento leve no vale
laco('1341', 25.5, 29.0, -12, ini=4, ataque=0.8, soltura=0.4)           # Q4-Q5 os destroços queimando lá longe

# ---------------------------------------------------------------- 29-34 s  A DELEGACIA (noite)
laco('0146', 29.0, 31.5, -10, ini=20, ataque=0.3, soltura=0.2)          # D1 voo noturno: vento
por(ler('1796', vel=0.8), 29.3, -8, 0.02, 0.2)
laco('1880', 29.0, 34.0, -8, ini=40, ataque=1.0, soltura=0.4)           # grilos da cidade pequena
laco('0425', 31.5, 34.0, -18, ataque=0.3, soltura=0.3)
por(ler('1796', vel=0.7), 33.0, -8, 0.02, 0.3)   # D2 sobe e some no céu

# ---------------------------------------------------------------- 34-44 s  OS PODERES (dia)
laco('1286', 34.0, 40.0, -8, ini=5, ataque=0.3, soltura=0.4)           # rua de dia
por(ler('0616', 3.0, 2.4), 34.3, -10, 0.1, 0.4)                          # M1 a lataria rangendo ao subir
por(ler('0322', 0.0, 1.8), 35.2, -12, 0.05, 0.3, pan=-0.2)
laco('1072', 36.5, 44.0, -12, ini=60, ataque=0.5, soltura=0.3)          # M2 pátio da escola (longe; abafa na sala)
por(ler('1800', vel=0.9), 37.0, -12, 0.02, 0.2, pan=-0.3)              # a mochila passa
por(ler('0541', 2.0, 3.4), 40.3, 4, 0.02, 0.2)                          # M3 giz na lousa

# ---------------------------------------------------------------- 44-50 s  O PREÇO: chuva, a luz acaba, ele pisa e desaba
laco('0740', 44.0, 50.0, 4, ini=60, ataque=0.3, soltura=0.05)
por(ler('0026', 0.0, 0.5), 45.5, -4, 0.001, 0.1)                         # a luz pisca e cai (estalo elétrico)
por(ler('3115', 6.0, 3.0), 45.55, -6, 0.01, 0.8)                         # trovões
por(ler('3113', 0.0, 3.1), 46.9, -4, 0.01, 0.8)
por(ler('2452', 0.0, 0.8), 47.5, -14, 0.002, 0.2)                        # os pés tocam o chão
por(ler('2452', 0.0, 1.5), 49.25, -3, 0.002, 0.3); por(baque(60, 0.5, 8.0), 49.25, -14, 0.002, 0.2)   # o corpo cai

# ---------------------------------------------------------------- remendos de corte (silêncio curto antes do estouro, para dar peso)
i0, i1 = int(18.9 * SR), int(19.0 * SR); mix[i0:i1] *= np.linspace(1, 0.15, i1 - i0, dtype=np.float32)[:, None]

# nível: leva o médio a -23 dB (fica por baixo da narração) e segura os picos (explosão, trovões) num limitador suave
rms = 20 * np.log10(np.sqrt((mix ** 2).mean()) + 1e-12); mix *= 10 ** ((-23.0 - rms) / 20)
lim = 0.45; a = np.abs(mix); acima = a > lim
mix[acima] = np.sign(mix[acima]) * (lim + (1 - lim) * np.tanh((a[acima] - lim) / (1 - lim)))
mix *= 10 ** (-1.0 / 20) / max(np.abs(mix).max(), 1e-9) if np.abs(mix).max() > 10 ** (-1.0 / 20) else 1.0
rms = 20 * np.log10(np.sqrt((mix ** 2).mean()) + 1e-12)
assert rms <= -18.0, rms
saida = sys.argv[1] if len(sys.argv) > 1 else 'sfx_lucas.wav'
pcm = (np.clip(mix, -1, 1) * 32767).astype('<i2')
import wave
with wave.open(saida, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok', saida, f'rms {rms:.1f} dB', f'pico {20*np.log10(np.abs(mix).max()):.1f} dB')
