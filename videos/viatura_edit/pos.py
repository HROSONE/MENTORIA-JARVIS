#!/usr/bin/env python3
"""Pós-processamento do edit (estilo "edit" de carros): sobe 720x1280 -> 1080x1920 e aplica, na batida:
brilho (bloom) nas luzes, clarões, escurecida antes da queda, aberração cromática, soco de zoom, borrão de varrida nos cortes, glitch curto, cor (teal/laranja), vinheta e grão.
uso: python3 pos.py <quadros_720> <saida_1080> [--w 1080 --h 1920 --proc 4]"""
import sys, os, math, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, uniform_filter1d
from multiprocessing import Pool

BPM = 143; B = 60 / BPM; FPS = 30
W = int(sys.argv[sys.argv.index('--w') + 1]) if '--w' in sys.argv else 1080
H = int(sys.argv[sys.argv.index('--h') + 1]) if '--h' in sys.argv else 1920
NPROC = int(sys.argv[sys.argv.index('--proc') + 1]) if '--proc' in sys.argv else 4
ENT, SAI = sys.argv[1], sys.argv[2]

# cortes (início de cada plano, em batidas) — espelha js/planos.js
CORTES = [0, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 17.5, 19.5, 20.5, 22, 24, 25, 26, 28, 29, 30, 32, 34, 36, 36.5, 37, 37.5, 38, 38.5, 39, 39.5, 40, 44, 47]
VARRIDAS = {8: 1, 10: 1, 12: 1, 14: 1, 17.5: 1, 19.5: 1, 20.5: 1, 22: 1, 25: 1, 26: 1, 28: 1, 29: 1, 30: 1, 32: 1, 34: 1, 44: 1, 47: 1}     # cortes com borrão de varrida (direção alterna)
CLARAO = [(16, 1.0, 5.5), (24, 0.8, 9), (26, 0.45, 10), (32, 0.4, 10), (36, 0.85, 8), (40, 0.55, 8), (17.5, 0.35, 14), (20.5, 0.3, 14), (22, 0.35, 14), (28, 0.3, 14), (30, 0.25, 14), (47, 0.3, 10)]   # (batida, força, decaimento 1/s)
GLITCH = {16, 24, 36}                                                                  # quadros de glitch nessas batidas (3 quadros)

def pulso(x, k): return math.exp(-k * x) if x >= 0 else 0.0

def params(i):
    t = i / FPS; bt = t / B; ph = bt - math.floor(bt); quente = 16 <= bt < 40
    clarao = sum(f * pulso(t - b * B, k) for b, f, k in CLARAO)
    pre = 0.0
    if 15.45 <= bt < 16: pre = min(1.0, (bt - 15.45) / 0.38)                           # escurece antes da queda e fica preto até o clarão
    ca = 1.0 + (3.5 * pulso(ph, 10) if bt < 16 else 8.5 * pulso(ph, 9)) + 14 * sum(f * pulso(t - b * B, 14) for b, f, _ in CLARAO)
    zoom = 1.0 + (0.045 if quente else 0.02) * pulso(ph, 9) + 0.07 * pulso(t - 16 * B, 8) + 0.05 * pulso(t - 24 * B, 8) + 0.05 * pulso(t - 36 * B, 8)
    # borrão de varrida: ±2 quadros ao redor dos cortes marcados
    varr = 0.0; sinal = 1
    for k, (c, _) in enumerate(VARRIDAS.items()):
        d = (t - c * B) * FPS
        if -2.2 <= d <= 2.2: varr = max(varr, 1 - abs(d) / 2.4); sinal = 1 if k % 2 == 0 else -1
    gl = 0
    for b in GLITCH:
        d = int(round((t - b * B) * FPS))
        if 0 <= d < 3: gl = 3 - d
    # estroboscópio colorido leve na queda
    cor = np.zeros(3)
    if quente:
        h = bt * 2; p = h - math.floor(h); f = 0.10 * pulso(p, 8); cor = np.array([1.0, 0.12, 0.16]) * f if int(math.floor(h)) % 2 == 0 else np.array([0.15, 0.35, 1.0]) * f
    return dict(clarao=min(1, clarao), pre=pre, ca=ca, zoom=zoom, varr=varr, sinal=sinal, glitch=gl, cor=cor, t=t)

def curva(x):                                                                           # contraste suave e cor: sombras azul-esverdeadas, luzes quentes
    lum = (0.2126 * x[..., 0] + 0.7152 * x[..., 1] + 0.0722 * x[..., 2])[..., None]
    x = 0.5 + (x - 0.5) * 1.10
    x = x + np.array([-0.012, 0.010, 0.026]) * (1 - np.clip(lum * 3, 0, 1)) + np.array([0.030, 0.012, -0.014]) * np.clip(lum - 0.45, 0, 1)
    lum = (0.2126 * x[..., 0] + 0.7152 * x[..., 1] + 0.0722 * x[..., 2])[..., None]
    return lum + (x - lum) * 1.16

def processar(i):
    f = os.path.join(ENT, 'f%05d.jpg' % i)
    if not os.path.exists(f): return
    P = params(i); im = Image.open(f).convert('RGB'); w0, h0 = im.size
    if P['zoom'] > 1.001:                                                                 # soco: recorta o centro e amplia
        cw, chh = w0 / P['zoom'], h0 / P['zoom']; im = im.crop(((w0 - cw) / 2, (h0 - chh) / 2, (w0 + cw) / 2, (h0 + chh) / 2))
    im = im.resize((W, H), Image.LANCZOS); x = np.asarray(im, np.float32) / 255.0
    if P['varr'] > 0.02:                                                                  # borrão de varrida (horizontal)
        L = int(8 + 150 * P['varr']); x = uniform_filter1d(x, L, axis=1, mode='nearest')
    if P['glitch']:                                                                       # fatias deslocadas + separação RGB forte
        r = np.random.default_rng(i * 7 + 3); y = 0
        while y < H:
            hh = int(r.integers(30, 190));
            if r.random() < 0.55: s = int(r.integers(-90, 90)); x[y:y + hh] = np.roll(x[y:y + hh], s, axis=1)
            y += hh
        P['ca'] += 10
    # aberração cromática: R e B deslocados em sentidos opostos
    s = int(round(P['ca']))
    if s > 0: x[..., 0] = np.concatenate([x[:, :s, 0], x[:, :-s, 0]], axis=1); x[..., 2] = np.concatenate([x[:, s:, 2], x[:, -s:, 2]], axis=1)
    # brilho (bloom): realces borrados em duas escalas, calculados em 1/4 de resolução
    hl = np.clip((x - 0.60) / 0.40, 0, 1) * x; pq = Image.fromarray((np.clip(hl, 0, 1) * 255).astype(np.uint8)).resize((W // 4, H // 4), Image.BILINEAR)
    q = np.asarray(pq, np.float32) / 255.0; b1 = gaussian_filter(q, (2.2, 2.2, 0)); b2 = gaussian_filter(q, (8, 8, 0))
    up = lambda a: np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), np.float32) / 255.0
    x = x + 0.95 * up(b1) + 0.75 * up(b2)
    x = curva(np.clip(x, 0, 1.6))
    yy, xx = np.mgrid[0:H, 0:W]; r2 = ((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2; x *= (1 - 0.30 * np.clip(r2, 0, 1.6))[..., None]      # vinheta
    x = x + P['cor'][None, None, :]
    x = x + np.random.default_rng(i).normal(0, 0.016, (H, W, 1)).astype(np.float32)                                                       # grão
    x = np.clip(x, 0, 1)
    x = x * (1 - P['pre'])                                                                                                                  # escurece antes da queda
    x = x + (1 - x) * P['clarao']                                                                                                           # clarão branco na batida
    Image.fromarray((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(SAI, 'f%05d.jpg' % i), quality=94, subsampling=0)

if __name__ == '__main__':
    os.makedirs(SAI, exist_ok=True); n = len([a for a in os.listdir(ENT) if a.endswith('.jpg')]); print('quadros:', n)
    so = [int(v) for v in sys.argv[sys.argv.index('--so') + 1].split(',')] if '--so' in sys.argv else None
    with Pool(NPROC) as p:
        for k, _ in enumerate(p.imap_unordered(processar, so if so else range(n), chunksize=4)):
            if k % 60 == 0: print(k, '/', n, flush=True)
    print('pronto')
