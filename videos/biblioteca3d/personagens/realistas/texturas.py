#!/usr/bin/env python3
# Texturas de um personagem realista a partir da FICHA (fichas/<nome>.json), em Python comum com PIL (o Blender só carrega o resultado):
# pele (tom, palidez, sardas, olheiras pintadas no lugar certo do UV, couro cabeludo sob o cabelo), olho (cor da íris, textura polar),
# roupa (cada peça pintada com a cor da ficha, dobras do mapa de AO original, listras opcionais), cabelo/sobrancelhas/cílios recoloridos, sapatos.
# uso: python3 texturas.py fichas/lucas12.json --dados <mpfb/data> --assets <mhdata> --saida <pasta>
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mh import corpo, centro, ler_mhclo, encaixar, recortar_roupa, ler_obj, cabelo_procedural

def arg(n, d=None): return sys.argv[sys.argv.index('--' + n) + 1] if '--' + n in sys.argv else d
FICHA = json.load(open(sys.argv[1])); DADOS, ASSETS, OUT = arg('dados'), arg('assets'), arg('saida')
os.makedirs(OUT, exist_ok=True)
V, VT, F, G, grupos = corpo(DADOS, FICHA['corpo'])
P_ = FICHA.get('pele', {}); CAB = FICHA.get('cabelo', {'tipo': 'mechas', 'cor': [0.3, 0.2, 0.12]})

# ---- pele
im = Image.open(os.path.join(ASSETS, f"skins/textures/{P_.get('textura', 'young_lightskinned_male_diffuse')}.png")).convert('RGB'); WI, HI = im.size
arr = np.asarray(im, np.float32) / 255; lum = arr.mean(axis=2, keepdims=True)
arr = (lum + (arr - lum) * (1 - P_.get('palidez', 0))) * np.array(P_.get('tom', [1, 1, 1])) + P_.get('clarear', 0)
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
olhoE, olhoD = centro(V, grupos, 'helper-l-eye'), centro(V, grupos, 'helper-r-eye'); k_ = np.linalg.norm(olhoE - olhoD) / 0.6
if P_.get('olheiras', 0):
    for olho in (olhoE, olhoD):
        for uv in uv_perto(olho + np.array([0, -0.13, 0.05]) * k_, 0.11 * k_):
            x, y = pix(uv); dr.ellipse([x - 8, y - 5, x + 8, y + 5], fill=(74, 36, 58, int(70 * P_['olheiras'] + 10)))
rng = np.random.default_rng(12); nariz = (olhoE + olhoD) / 2 + np.array([0, -0.42, 0.22]) * k_
for _ in range(int(P_.get('sardas', 0))):
    p = nariz + np.array([rng.normal(0, 0.50), rng.normal(0.0, 0.10), 0]) * k_
    u = uv_perto(p, 0.05 * k_)
    if len(u): x, y = pix(u[rng.integers(len(u))]); r = rng.uniform(0.6, 1.6); dr.ellipse([x - r, y - r, x + r, y + r], fill=(122, 70, 44, int(rng.uniform(50, 120))))
if P_.get('barba', 0):                                                         # sombra de barba por fazer (adultos)
    queixo = (olhoE + olhoD) / 2 + np.array([0, -0.95, 0.05]) * k_
    for _ in range(4000):
        p = queixo + np.array([rng.normal(0, 0.42), rng.normal(0, 0.28), 0]) * k_
        u = uv_perto(p, 0.04 * k_)
        if len(u): x, y = pix(u[rng.integers(len(u))]); dr.point((x, y), fill=(40, 30, 25, int(90 * P_['barba'])))
cam = cam.filter(ImageFilter.GaussianBlur(1.2)); im.paste(cam, (0, 0), cam)
if CAB.get('tipo') == 'mechas':                                               # couro cabeludo escuro sob as mechas
    _, _, _, (_, _, FACES_ESC) = cabelo_procedural(V, grupos, F, G, n=10)
    couro = Image.new('RGBA', im.size, (0, 0, 0, 0)); dc = ImageDraw.Draw(couro); cc = tuple(int(255 * c * 0.6) for c in CAB['cor'])
    for k in FACES_ESC: dc.polygon([pix(VT[t]) for t in F[k][1]], fill=(*cc, 245))
    couro = couro.filter(ImageFilter.GaussianBlur(5))
    # textura de fio por cima (no cabelo curto ela É o cabelo; no comprido some sob as mechas e evita falha clara)
    fios = Image.new('RGBA', im.size, (0, 0, 0, 0)); df = ImageDraw.Draw(fios); rf = np.random.default_rng(5); cb_ = np.array(CAB['cor']) * 255
    for k in FACES_ESC:
        pts_ = np.array([pix(VT[t]) for t in F[k][1]], float)
        for _ in range(26):
            w_ = rf.dirichlet(np.ones(len(pts_))); x, y = (w_[:, None] * pts_).sum(0); ang = rf.normal(1.57, 0.35); l_ = rf.uniform(3, 8)
            tom = rf.uniform(0.55, 1.15); c_ = tuple(int(min(255, v * tom)) for v in cb_)
            df.line([(x, y), (x + l_ * np.cos(ang), y + l_ * np.sin(ang))], fill=(*c_, 200), width=1)
    couro.alpha_composite(fios.filter(ImageFilter.GaussianBlur(0.4)))
    im.paste(couro, (0, 0), couro)
im.save(os.path.join(OUT, 'pele.jpg'), quality=92)

# ---- mechas (cabelo procedural): 4 colunas de fios ondulados com alfa
M = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0)); dmc = ImageDraw.Draw(M); rr = np.random.default_rng(21); cb = np.array(CAB.get('cor', [0.3, 0.2, 0.12])) * 255
for col in range(4):
    for _ in range(130):                                                     # 70 fios: o fundo aparecia (grisalho); 190: lascas opacas. Meio-termo com bordas suaves
        x0 = col * 256 + 8 + rr.random() * 240; borda = 1 - abs((x0 - col * 256 - 128) / 128) ** 3; amp = rr.uniform(1, 6); fase = rr.uniform(0, 6.28); comp = rr.uniform(0.7, 1.0)
        tom = rr.uniform(0.75, 1.25); cor = tuple(int(min(255, c * tom)) for c in cb)
        pts = [(x0 + amp * np.sin(fase + y / 90) + (y / 1024) * rr.normal(0, 8), y) for y in range(0, int(1024 * comp), 16)]
        for (xa, ya), (xb, yb) in zip(pts, pts[1:]):
            a = int(235 * borda * (1 - (ya / 1024 / comp) ** 1.8)); dmc.line([(xa, ya), (xb, yb)], fill=(*cor, a), width=int(rr.integers(2, 6)))
M.save(os.path.join(OUT, 'mecha.png'))

# ---- olho: textura polar (linha de cima = polo da frente = pupila); cor da íris na ficha
ir = np.array(FICHA.get('olhos', [0.42, 0.26, 0.12])) * 255
W_, H_ = 512, 256; o = Image.new('RGB', (W_, H_), (236, 232, 226)); d = ImageDraw.Draw(o)
for y in range(H_):
    v = y / H_
    if v < 0.040: c = (10, 7, 5)
    elif v < 0.118: k = (v - 0.040) / 0.078; c = tuple(int(x * (0.55 + 0.6 * k)) for x in ir)
    elif v < 0.132: c = tuple(int(x * 0.35) for x in ir)
    else: c = (236, 230, 224) if v < 0.5 else (224, 212, 206)
    d.line([(0, y), (W_, y)], fill=c)
r2 = np.random.default_rng(3)
for _ in range(600): x = r2.uniform(0, W_); y0 = r2.uniform(0.045, 0.11) * H_; d.line([(x, y0), (x + r2.normal(0, 2), y0 + r2.uniform(3, 9))], fill=tuple(int(min(255, c * r2.uniform(0.8, 1.5))) for c in ir), width=1)
for _ in range(50): x = r2.uniform(0, W_); y0 = r2.uniform(0.3, 0.6) * H_; d.line([(x, y0), (x + r2.normal(0, 8), y0 - r2.uniform(10, 30))], fill=(205, 125, 125), width=1)
o.save(os.path.join(OUT, 'olho.jpg'), quality=92)

# ---- roupa: cada peça com a cor da ficha (cima / baixo), dobras do AO original, listras opcionais
R_ = FICHA['roupa']; SUIT = R_['suit']; src = os.path.join(ASSETS, f'clothes/{SUIT}'); N = 2048
info = ler_mhclo(f'{src}/{SUIT}.mhclo'); Pv, _, _ = encaixar(info, V); Vp, VTp, Fp, _ = ler_obj(f'{src}/{SUIT}.obj')
mant, cls, _, _ = recortar_roupa(V, grupos, Pv, [f[0] for f in Fp], info['delete'], None, uvs=[[VTp[t] for t in f[1]] for f in Fp], manga=R_.get('manga', 'curta'), perna=R_.get('perna', 'longa'))
cor = {'camisa': R_['cores']['cima'], 'calca': R_['cores']['baixo']}
mapa = Image.new('RGB', (N, N), tuple(int(255 * c) for c in cor['camisa'])); dm = ImageDraw.Draw(mapa)
for k, c in zip(mant, cls):
    pts = [(VTp[t][0] * N, (1 - VTp[t][1]) * N) for t in Fp[k][1]]; dm.polygon(pts, fill=tuple(int(255 * x) for x in cor[c]))
base = np.asarray(mapa, np.float32) / 255
ao_c = f'{src}/{SUIT}_ao.png'
ao = np.asarray(Image.open(ao_c).convert('L').resize((N, N)), np.float32) / 255 if os.path.exists(ao_c) else np.ones((N, N), np.float32)
fio = np.random.default_rng(5).normal(0, 0.03, (N, N)); fio = (fio + np.roll(fio, 1, 0) + np.roll(fio, 1, 1) + np.roll(fio, 2, 1)) / 4
out = base * (0.50 + 0.50 * ao[..., None]) * (1 + fio[..., None])
Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, 'roupa.jpg'), quality=92)

# ---- cabelo (proxy do MakeHuman), sobrancelhas, cílios, sapatos: recoloridos mantendo o alfa
def recolorir(src, cor, nome, ganho=1.1):
    a = np.asarray(Image.open(src).convert('RGBA'), np.float32) / 255; l = a[..., :3].mean(axis=2, keepdims=True)
    rgb = np.array(cor)[None, None] * (0.45 + ganho * l); Image.fromarray((np.concatenate([np.clip(rgb, 0, 1), a[..., 3:4]], 2) * 255).astype(np.uint8)).save(os.path.join(OUT, nome))
if CAB.get('tipo') != 'mechas':
    t = CAB['tipo']; recolorir(os.path.join(ASSETS, f'hair/{t}/{t}_diffuse.png'), CAB['cor'], 'cabelo.png')
sb = FICHA.get('sobrancelha', 'eyebrow001'); recolorir(os.path.join(ASSETS, f'eyebrows/{sb}/{sb}.png'), np.array(CAB.get('cor', [0.3, 0.2, 0.12])) * 0.75, 'sobrancelha.png')
recolorir(os.path.join(ASSETS, 'eyelashes/eyelashes01/eyelashes01.png'), (0.08, 0.06, 0.05), 'cilios.png')
S_ = FICHA.get('sapatos')
if S_:
    s = S_['tipo']; c = f'{ASSETS}/clothes/{s}/{s}_diffuse.png'
    if os.path.exists(c): recolorir(c, S_.get('cor', [0.1, 0.1, 0.1]), 'sapatos.png', 0.9)
print('texturas em', OUT)
