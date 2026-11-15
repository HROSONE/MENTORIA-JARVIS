#!/usr/bin/env python3
"""Efeitos curtos do edit da viatura, sintetizados (numpy), um por ação visível: impactos graves nos cortes fortes e passadas de ar (whoosh) nos giros.
Sem cama de ruído e sem música: a faixa do dono entra por cima (veja com_musica.sh). Saída: sfx_edit.wav (44,1 kHz estéreo).
uso: python3 sfx_edit.py [saida.wav]"""
import sys, numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 44100; BPM = 143; B = 60 / BPM; TOTAL = 50 * B + 0.6
rng = np.random.default_rng(143)
out = np.zeros((int(TOTAL * SR), 2), np.float32)

def mix(t0, x, pan=0.0, g=1.0):
    i = int(t0 * SR); n = min(len(x), len(out) - i)
    if n <= 0 or i < 0: return
    out[i:i + n, 0] += x[:n] * g * (1 - max(pan, 0)); out[i:i + n, 1] += x[:n] * g * (1 + min(pan, 0))

def ruido_filtrado(n, f0, f1, ordem=2):
    b, a = signal.butter(ordem, [f0, f1], btype='band', fs=SR); return signal.lfilter(b, a, rng.standard_normal(n))

def impacto(forca=1.0, f_ini=95, f_fim=36, cauda=0.55):
    n = int(cauda * SR); t = np.arange(n) / SR
    fase = 2 * np.pi * (f_fim * t + (f_ini - f_fim) * (1 - np.exp(-t * 18)) / 18)                    # varredura grave descendente
    sub = np.sin(fase) * np.exp(-t / 0.20)
    estalo = ruido_filtrado(n, 180, 4200) * np.exp(-t / 0.045) * 0.55                                  # ataque curto
    corpo = np.sin(2 * np.pi * 62 * t) * np.exp(-t / 0.12) * 0.35
    x = (sub * 0.95 + estalo + corpo) * forca
    rev = rng.standard_normal(int(0.5 * SR)) * np.exp(-np.arange(int(0.5 * SR)) / SR / 0.11); rev = signal.lfilter(*signal.butter(2, 2500, fs=SR), rev)
    cauda_ = signal.fftconvolve(x, rev * 0.012)[:n]; return np.tanh(x * 1.2 + cauda_) * 0.9

def whoosh(dur=0.5, f_ini=500, f_fim=3800, forca=0.5, sobe=True):
    n = int(dur * SR); t = np.linspace(0, 1, n); x = rng.standard_normal(n); y = np.zeros(n)
    bl = 512
    for k in range(0, n, bl):                                                                             # filtro passa-banda com centro que varre
        u = k / n; c = f_ini * (f_fim / f_ini) ** (u if sobe else 1 - u); w = c * 0.55
        b, a = signal.butter(2, [max(c - w, 60), min(c + w, SR / 2 - 100)], btype='band', fs=SR); y[k:k + bl] = signal.lfilter(b, a, x[k:k + bl])
    env = np.sin(np.pi * t) ** 2.2; return y * env * forca / (np.std(y) + 1e-9) * 0.30

def clique(forca=0.4):
    n = int(0.05 * SR); t = np.arange(n) / SR; return (np.sin(2 * np.pi * 1800 * t) * np.exp(-t / 0.006) + ruido_filtrado(n, 2000, 8000) * np.exp(-t / 0.004) * 0.5) * forca

def succao(dur):                                                                                          # antes da queda: ar sendo puxado, sobe e corta seco
    n = int(dur * SR); t = np.linspace(0, 1, n); x = ruido_filtrado(n, 300, 6000); env = t ** 2.4
    sw = np.sin(2 * np.pi * np.cumsum(180 + 900 * t ** 2) / SR) * 0.18; return (x / (np.std(x) + 1e-9) * 0.18 + sw) * env

# ---- linha do tempo (batidas)
mix(0.0, impacto(0.55, 80, 40, 0.5))                                                                      # quadro 0: batida de motor
for b in (2, 3, 4, 5, 6, 7): mix(b * B - 0.03, whoosh(0.16, 900, 3200, 0.30, True), pan=(-0.4, 0.4)[b % 2])
mix(8 * B - 0.05, whoosh(0.5, 300, 2800, 0.5, True)); mix(10 * B, impacto(0.35, 70, 40, 0.35))
mix(12 * B - 0.05, whoosh(0.4, 400, 3000, 0.45, True)); mix(14 * B - 0.05, whoosh(0.4, 400, 3200, 0.5, True))
mix(15.0 * B, succao(0.93 * B)); mix(16 * B - 0.01, impacto(1.0, 110, 34, 0.9)); mix(16 * B, whoosh(0.5, 3500, 500, 0.5, False))          # a queda
mix(17.5 * B - 0.1, whoosh(0.7, 500, 2600, 0.6, True), pan=-0.5); mix(19.5 * B - 0.05, whoosh(0.35, 700, 3600, 0.5, True), pan=0.3); mix(20.5 * B - 0.05, whoosh(0.45, 400, 3000, 0.5, True))
mix(22 * B - 0.02, impacto(0.55, 90, 38, 0.6)); mix(24 * B - 0.02, impacto(0.85, 100, 36, 0.7)); mix(25 * B - 0.05, whoosh(0.3, 600, 3800, 0.5, True))
mix(25.85 * B, impacto(0.5, 80, 40, 0.4)); mix(26 * B - 0.02, whoosh(0.8, 300, 2200, 0.5, True), pan=0.4); mix(28 * B - 0.03, whoosh(0.3, 700, 3600, 0.45, False))
mix(29 * B - 0.03, whoosh(0.3, 500, 3200, 0.45, True)); mix(30 * B - 0.03, whoosh(0.6, 400, 2800, 0.45, True)); mix(32 * B - 0.05, whoosh(0.7, 300, 2600, 0.55, True), pan=-0.4)
mix(34 * B - 0.03, whoosh(0.5, 400, 3200, 0.5, True)); mix(35.9 * B, impacto(0.7, 90, 38, 0.6))
for k in range(8): mix((36 + k / 2) * B, clique(0.35 + 0.05 * (k % 2)), pan=(-0.3, 0.3)[k % 2])            # os oito detalhes nas colcheias
mix(40 * B - 0.02, impacto(0.55, 85, 38, 0.8)); mix(44 * B - 0.05, whoosh(0.7, 300, 2600, 0.4, True), pan=-0.3); mix(47 * B - 0.1, whoosh(1.2, 250, 3800, 0.55, True))

pico = np.max(np.abs(out)); out /= max(pico, 1e-9); out *= 10 ** (-4 / 20)                              # pico em -4 dBFS
rms = np.sqrt(np.mean(out[out != 0] ** 2)); print('pico %.1f dBFS · RMS (só onde há som) %.1f dBFS' % (20 * np.log10(np.max(np.abs(out))), 20 * np.log10(rms)))
wavfile.write(sys.argv[1] if len(sys.argv) > 1 else 'sfx_edit.wav', SR, (np.clip(out, -1, 1) * 32767).astype(np.int16))
