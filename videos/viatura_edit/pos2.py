#!/usr/bin/env python3
"""Pós-processamento da v2 "Perseguição" (estilo "edit" de carros): sobe 720x1280 -> 1080x1920 e aplica, na batida:
brilho (bloom) nas luzes, clarões, escurecida antes da queda, aberração cromática, soco de zoom, borrão de varrida nos cortes, glitch curto, cor (teal/laranja), vinheta e grão.
Novidade da v2: o trecho "calmo" (o impasse) dessatura, escurece e tira a aberração, para a segunda queda ter contraste.
Os tempos vêm do edl2.json (gerado por exportar2.mjs a partir de js/planos2.js): uma fonte da verdade.
uso: python3 pos2.py <quadros_720> <saida_1080> [--edl edl2.json --w 1080 --h 1920 --proc 4 --so i,j,k]"""
import sys, os, json, math, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, uniform_filter1d
from multiprocessing import Pool

def arg(n, d): return sys.argv[sys.argv.index('--' + n) + 1] if '--' + n in sys.argv else d
W, H, NPROC = int(arg('w', 1080)), int(arg('h', 1920)), int(arg('proc', 4))
ENT, SAI = sys.argv[1], sys.argv[2]
EDL = json.load(open(arg('edl', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'edl2.json'))))
B, FPS, FX = EDL['B'], EDL['FPS'], EDL['FX']
CLARAO, GLITCH, VARRIDAS = FX['clarao'], FX['glitch'], FX['varridas']      # (batida, força, decaimento 1/s)

def pulso(x, k): return math.exp(-k * x) if x >= 0 else 0.0
def rampa(bt, a, b, f=0.25):                                               # 0 fora de [a,b]; sobe e desce suavemente nas bordas (f = fração de cada borda)
    if not (a <= bt < b): return 0.0
    e = max((b - a) * f, 1e-6); x = min((bt - a) / e, (b - bt) / e, 1.0); return x * x * (3 - 2 * x)

def params(i):
    t = i / FPS; bt = t / B; ph = bt - math.floor(bt)
    forte = any(a <= bt < b for a, b in FX['forte']); calmo = max([rampa(bt, a, b) for a, b in FX['calmo']] + [0.0])
    clarao = sum(f * pulso(t - b * B, k) for b, f, k in CLARAO)
    pre = 0.0
    for a, b in FX['preto']:
        if a <= bt < b: pre = min(1.0, (bt - a) / ((b - a) * 0.7))        # escurece antes da queda e fica preto até o clarão
    ca = 1.0 + (3.5 * pulso(ph, 10) if not forte else 8.5 * pulso(ph, 9)) + 14 * sum(f * pulso(t - b * B, 14) for b, f, _ in CLARAO)
    ca = ca * (1 - 0.8 * calmo)
    zoom = 1.0 + (0.045 if forte else 0.02) * pulso(ph, 9) * (1 - calmo) + sum(0.07 * f * pulso(t - b * B, 8) for b, f, _ in CLARAO if f >= 0.55)
    varr = 0.0                                                             # borrão de varrida: ±2 quadros ao redor dos cortes marcados
    for c in VARRIDAS:
        d = (t - c * B) * FPS
        if -2.2 <= d <= 2.2: varr = max(varr, 1 - abs(d) / 2.4)
    gl = 0
    for b in GLITCH:
        d = int(round((t - b * B) * FPS))
        if 0 <= d < 3: gl = 3 - d
    cor = np.zeros(3)                                                      # estroboscópio colorido leve na queda
    if forte:
        h = bt * 2; p = h - math.floor(h); f = 0.10 * pulso(p, 8); cor = np.array([1.0, 0.12, 0.16]) * f if int(math.floor(h)) % 2 == 0 else np.array([0.15, 0.35, 1.0]) * f
    return dict(clarao=min(1, clarao), pre=pre, ca=ca, zoom=zoom, varr=varr, glitch=gl, cor=cor * (1 - calmo), calmo=calmo, t=t)

def curva(x):                                                              # contraste suave e cor: sombras azul-esverdeadas, luzes quentes
    lum = (0.2126 * x[..., 0] + 0.7152 * x[..., 1] + 0.0722 * x[..., 2])[..., None]
    x = 0.5 + (x - 0.5) * 1.10
    x = x + np.array([-0.012, 0.010, 0.026]) * (1 - np.clip(lum * 3, 0, 1)) + np.array([0.030, 0.012, -0.014]) * np.clip(lum - 0.45, 0, 1)
    lum = (0.2126 * x[..., 0] + 0.7152 * x[..., 1] + 0.0722 * x[..., 2])[..., None]
    return lum + (x - lum) * 1.16

def processar(i):
    f = os.path.join(ENT, 'f%05d.jpg' % i)
    if not os.path.exists(f): return
    P = params(i); im = Image.open(f).convert('RGB'); w0, h0 = im.size
    if P['zoom'] > 1.001:                                                  # soco: recorta o centro e amplia
        cw, chh = w0 / P['zoom'], h0 / P['zoom']; im = im.crop(((w0 - cw) / 2, (h0 - chh) / 2, (w0 + cw) / 2, (h0 + chh) / 2))
    im = im.resize((W, H), Image.LANCZOS); x = np.asarray(im, np.float32) / 255.0
    if P['varr'] > 0.02:                                                   # borrão de varrida (horizontal)
        L = int(8 + 150 * P['varr']); x = uniform_filter1d(x, L, axis=1, mode='nearest')
    if P['glitch']:                                                        # fatias deslocadas + separação RGB forte
        r = np.random.default_rng(i * 7 + 3); y = 0
        while y < H:
            hh = int(r.integers(30, 190))
            if r.random() < 0.55: s = int(r.integers(-90, 90)); x[y:y + hh] = np.roll(x[y:y + hh], s, axis=1)
            y += hh
        P['ca'] += 10
    s = int(round(P['ca']))                                                # aberração cromática: R e B deslocados em sentidos opostos
    if s > 0: x[..., 0] = np.concatenate([x[:, :s, 0], x[:, :-s, 0]], axis=1); x[..., 2] = np.concatenate([x[:, s:, 2], x[:, -s:, 2]], axis=1)
    hl = np.clip((x - 0.60) / 0.40, 0, 1) * x; pq = Image.fromarray((np.clip(hl, 0, 1) * 255).astype(np.uint8)).resize((W // 4, H // 4), Image.BILINEAR)    # brilho (bloom) em 1/4 de resolução
    q = np.asarray(pq, np.float32) / 255.0; b1 = gaussian_filter(q, (2.2, 2.2, 0)); b2 = gaussian_filter(q, (8, 8, 0))
    up = lambda a: np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).resize((W, H), Image.BILINEAR), np.float32) / 255.0
    x = x + (1 - 0.4 * P['calmo']) * (0.95 * up(b1) + 0.75 * up(b2))
    x = curva(np.clip(x, 0, 1.6))
    if P['calmo'] > 0.001:                                                 # o impasse: dessatura e escurece
        lum = (0.2126 * x[..., 0] + 0.7152 * x[..., 1] + 0.0722 * x[..., 2])[..., None]; k = P['calmo']
        x = (lum + (x - lum) * (1 - 0.55 * k)) * (1 - 0.18 * k)
    yy, xx = np.mgrid[0:H, 0:W]; r2 = ((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2; x *= (1 - (0.30 + 0.12 * P['calmo']) * np.clip(r2, 0, 1.6))[..., None]      # vinheta
    x = x + P['cor'][None, None, :]
    x = x + np.random.default_rng(i).normal(0, 0.016, (H, W, 1)).astype(np.float32)                                                       # grão
    x = np.clip(x, 0, 1)
    x = x * (1 - P['pre'])                                                 # escurece antes da queda
    x = x + (1 - x) * P['clarao']                                          # clarão branco na batida
    Image.fromarray((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8)).save(os.path.join(SAI, 'f%05d.jpg' % i), quality=94, subsampling=0)

if __name__ == '__main__':
    os.makedirs(SAI, exist_ok=True); n = EDL['N']; print('quadros:', n)
    so = [int(v) for v in arg('so', '').split(',') if v != ''] or None
    with Pool(NPROC) as p:
        for k, _ in enumerate(p.imap_unordered(processar, so if so else range(n), chunksize=4)):
            if k % 60 == 0: print(k, '/', n, flush=True)
    print('pronto')
