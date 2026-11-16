#!/usr/bin/env python3
# Texturas do Lucas (Python comum com PIL; o Blender só carrega o resultado): pele pálida com sardas e olheiras pintadas no lugar certo do UV,
# olho castanho (textura polar para a esfera), roupa recolorida (camiseta cáqui e bermuda cinza, ou camiseta azul e jeans) e cabelo castanho.
# uso: python3 texturas_lucas.py --dados <mpfbdata/data> --assets <mhdata> --saida <pasta> [--idade 12 --magreza 1 --roupa casa|carro]
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mh import corpo_lucas, centro, ler_mhclo, encaixar, recortar_roupa, ler_obj

def arg(n, d=None): return sys.argv[sys.argv.index('--' + n) + 1] if '--' + n in sys.argv else d
DADOS, ASSETS, OUT = arg('dados'), arg('assets'), arg('saida'); IDADE, MAGREZA, ROUPA = float(arg('idade', 12)), float(arg('magreza', 1)), arg('roupa', 'casa')
os.makedirs(OUT, exist_ok=True)
V, VT, F, G, grupos = corpo_lucas(DADOS, IDADE, MAGREZA)
from mh import cabelo_procedural
_, _, _, (RAIZ_CAB, _, FACES_ESC) = cabelo_procedural(V, grupos, F, G, n=10)

# ---- pele
im = Image.open(os.path.join(ASSETS, 'skins/textures/young_lightskinned_male_diffuse.png')).convert('RGB'); WI, HI = im.size
arr = np.asarray(im, np.float32) / 255; lum = arr.mean(axis=2, keepdims=True)
palidez = 0.22 * MAGREZA
arr = (lum + (arr - lum) * (1 - palidez)) * np.array([1.02, 0.985, 0.975]) + 0.03 * MAGREZA
im = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8))
uv_vert = {}
for (vs, ts), g in zip(F, G):
    if g != 'body': continue
    for vi, ti in zip(vs, ts):
        if ti >= 0: uv_vert[vi] = VT[ti]
corpo_idx = np.array(sorted(uv_vert)); corpo_P = V[corpo_idx]
def uv_perto(p, raio):
    sel = corpo_idx[np.linalg.norm(corpo_P - p, axis=1) < raio]
    return np.array([uv_vert[i] for i in sel]) if len(sel) else np.zeros((0, 2))
pix = lambda uv: (uv[0] * WI, (1 - uv[1]) * HI)
cam = Image.new('RGBA', im.size, (0, 0, 0, 0)); dr = ImageDraw.Draw(cam)
olhoE, olhoD = centro(V, grupos, 'helper-l-eye'), centro(V, grupos, 'helper-r-eye'); dist_olhos = np.linalg.norm(olhoE - olhoD)
for olho in (olhoE, olhoD):                                                   # olheiras arroxeadas logo abaixo dos olhos
    for uv in uv_perto(olho + np.array([0, -0.13, 0.05]) * dist_olhos / 0.6, 0.11 * dist_olhos / 0.6):
        x, y = pix(uv); dr.ellipse([x - 8, y - 5, x + 8, y + 5], fill=(74, 36, 58, int(70 * MAGREZA + 10)))
rng = np.random.default_rng(12); nariz = (olhoE + olhoD) / 2 + np.array([0, -0.42, 0.22]) * dist_olhos / 0.6
for _ in range(700):                                                          # sardas no nariz e nas bochechas
    p = nariz + np.array([rng.normal(0, 0.50), rng.normal(0.0, 0.10), 0]) * dist_olhos / 0.6
    u = uv_perto(p, 0.05 * dist_olhos / 0.6)
    if len(u): x, y = pix(u[rng.integers(len(u))]); r = rng.uniform(0.6, 1.6); dr.ellipse([x - r, y - r, x + r, y + r], fill=(122, 70, 44, int(rng.uniform(50, 120))))
cam = cam.filter(ImageFilter.GaussianBlur(1.2)); im.paste(cam, (0, 0), cam)
couro = Image.new('RGBA', im.size, (0, 0, 0, 0)); dc = ImageDraw.Draw(couro)
for k in FACES_ESC:
    dc.polygon([pix(VT[t]) for t in F[k][1]], fill=(62, 41, 26, 235))
couro = couro.filter(ImageFilter.GaussianBlur(6)); im.paste(couro, (0, 0), couro)
im.save(os.path.join(OUT, 'pele.jpg'), quality=92)
# mechas: 4 colunas de fios ondulados castanhos com alfa (pontas finas)
M = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0)); dmc = ImageDraw.Draw(M); rr = np.random.default_rng(21)
for col in range(4):
    for _ in range(70):
        x0 = col * 256 + 10 + rr.random() * 236; amp = rr.uniform(1, 6); fase = rr.uniform(0, 6.28); comp = rr.uniform(0.7, 1.0)
        tom = rr.uniform(0.75, 1.25); cor = (int(min(255, 74 * tom)), int(min(255, 52 * tom)), int(min(255, 34 * tom)))
        pts = [(x0 + amp * np.sin(fase + y / 90) + (y / 1024) * rr.normal(0, 8), y) for y in range(0, int(1024 * comp), 16)]
        for (xa, ya), (xb, yb) in zip(pts, pts[1:]):
            a = int(255 * (1 - (ya / 1024 / comp) ** 2.5)); dmc.line([(xa, ya), (xb, yb)], fill=(*cor, a), width=int(rr.integers(2, 5)))
M.save(os.path.join(OUT, 'mecha.png'))
print('olhos (dm):', olhoE.round(3), olhoD.round(3), 'distância', round(dist_olhos, 3))

# ---- olho: textura polar (linha de cima = polo da frente = pupila)
W_, H_ = 512, 256; o = Image.new('RGB', (W_, H_), (236, 232, 226)); d = ImageDraw.Draw(o)
for y in range(H_):
    v = y / H_
    if v < 0.040: c = (10, 7, 5)
    elif v < 0.118: k = (v - 0.040) / 0.078; c = (int(66 + 72 * k), int(40 + 42 * k), int(18 + 18 * k))
    elif v < 0.132: c = (38, 25, 17)
    else: c = (236, 230, 224) if v < 0.5 else (224, 212, 206)
    d.line([(0, y), (W_, y)], fill=c)
r2 = np.random.default_rng(3)
for _ in range(600): x = r2.uniform(0, W_); y0 = r2.uniform(0.045, 0.11) * H_; d.line([(x, y0), (x + r2.normal(0, 2), y0 + r2.uniform(3, 9))], fill=(int(r2.uniform(90, 170)), int(r2.uniform(60, 110)), 30), width=1)
for _ in range(50): x = r2.uniform(0, W_); y0 = r2.uniform(0.3, 0.6) * H_; d.line([(x, y0), (x + r2.normal(0, 8), y0 - r2.uniform(10, 30))], fill=(205, 125, 125), width=1)
o.save(os.path.join(OUT, 'olho.jpg'), quality=92)

# ---- roupa (male_casualsuit02): cada face é pintada pela classe (camiseta ou calça), com as dobras do mapa de AO original
SUIT = 'male_casualsuit02'; src = os.path.join(ASSETS, f'clothes/{SUIT}'); N = 2048
info = ler_mhclo(f'{src}/{SUIT}.mhclo'); Pv, _, _ = encaixar(info, V); Vp, VTp, Fp, _ = ler_obj(f'{src}/{SUIT}.obj')
mant, cls, _ = recortar_roupa(V, grupos, Pv, [f[0] for f in Fp], info['delete'], ROUPA, uvs=[[VTp[t] for t in f[1]] for f in Fp])
cor = {'casa': {'camisa': (0.60, 0.55, 0.42), 'calca': (0.18, 0.18, 0.19)}, 'carro': {'camisa': (0.20, 0.33, 0.56), 'calca': (0.22, 0.29, 0.40)}}[ROUPA]
mapa = Image.new('RGB', (N, N), tuple(int(255 * c) for c in cor['camisa'])); dm = ImageDraw.Draw(mapa)
for k, c in zip(mant, cls):
    pts = [(VTp[t][0] * N, (1 - VTp[t][1]) * N) for t in Fp[k][1]]
    dm.polygon(pts, fill=tuple(int(255 * x) for x in cor[c]), outline=tuple(int(255 * x) for x in cor[c]))
mapa = mapa.filter(ImageFilter.MaxFilter(5)) if False else mapa
base = np.asarray(mapa, np.float32) / 255
ao = np.asarray(Image.open(f'{src}/{SUIT}_ao.png').convert('L').resize((N, N)), np.float32) / 255
fio = np.random.default_rng(5).normal(0, 0.03, (N, N)); fio = (fio + np.roll(fio, 1, 0) + np.roll(fio, 1, 1) + np.roll(fio, 2, 1)) / 4
out = base * (0.50 + 0.50 * ao[..., None]) * (1 + fio[..., None])
Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, f'roupa_{ROUPA}.jpg'), quality=92)

# ---- cabelo, sobrancelhas, cílios: castanho, mantendo o alfa
def recolorir(src, cor, nome):
    a = np.asarray(Image.open(src).convert('RGBA'), np.float32) / 255; l = a[..., :3].mean(axis=2, keepdims=True)
    rgb = np.array(cor)[None, None] * (0.45 + 1.1 * l); Image.fromarray((np.concatenate([np.clip(rgb, 0, 1), a[..., 3:4]], 2) * 255).astype(np.uint8)).save(os.path.join(OUT, nome))
for cab in ['short01', 'short02', 'short03', 'short04']:
    c = os.path.join(ASSETS, f'hair/{cab}/{cab}_diffuse.png')
    if os.path.exists(c): recolorir(c, (0.30, 0.20, 0.12), f'cabelo_{cab}.png')
recolorir(os.path.join(ASSETS, 'eyebrows/eyebrow001/eyebrow001.png'), (0.22, 0.15, 0.10), 'sobrancelha.png')
recolorir(os.path.join(ASSETS, 'eyelashes/eyelashes01/eyelashes01.png'), (0.08, 0.06, 0.05), 'cilios.png')
print('texturas em', OUT)
