"""Texturas de carne bovina crua (procedurais, sem foto): face de corte (feixes de fibras separados pelo perimísio, marmoreio,
cor de carne oxigenada que escurece em manchas) e lateral (grão das fibras ao longo do músculo). Gera cor, relevo (normal) e rugosidade.
Uma textura cobre 0,20 m de carne. Uso: python3 gerar_texturas.py [--res 2048]"""
import sys, os
import numpy as np
from PIL import Image
from scipy.spatial import cKDTree
from scipy.ndimage import gaussian_filter

AQUI = os.path.dirname(os.path.abspath(__file__))
RES = int(sys.argv[sys.argv.index('--res') + 1]) if '--res' in sys.argv else 2048
R = np.random.default_rng(42)

def fbm(n, oitavas=5, base=4, sem=0):
    """ruído fractal periódico (soma de ruído de valor interpolado), 0..1"""
    rng = np.random.default_rng(sem); acc = np.zeros((n, n)); amp = 1.0; tot = 0
    for o in range(oitavas):
        f = base * 2 ** o; g = rng.random((f, f))
        g = np.tile(g, (3, 3)); im = Image.fromarray((g * 255).astype(np.uint8)).resize((n * 3, n * 3), Image.BICUBIC)
        acc += amp * np.asarray(im, float)[n:2 * n, n:2 * n] / 255; tot += amp; amp *= 0.5
    return acc / tot

def voronoi(n, celulas, jit=0.9, warp=None, sem=1):
    """distâncias ao 1º e 2º ponto (tileável) e o id da célula; celulas = pontos por lado"""
    rng = np.random.default_rng(sem)
    g = (np.stack(np.meshgrid(np.arange(celulas), np.arange(celulas)), -1).reshape(-1, 2) + 0.5 + (rng.random((celulas * celulas, 2)) - 0.5) * jit) / celulas
    pts = np.concatenate([g + [dx, dy] for dx in (-1, 0, 1) for dy in (-1, 0, 1)])
    ids = np.tile(np.arange(len(g)), 9)
    y, x = np.mgrid[0:n, 0:n] / n
    if warp is not None: x = x + warp[0]; y = y + warp[1]
    d, i = cKDTree(pts).query(np.stack([x.ravel(), y.ravel()], 1), k=2)
    return d[:, 0].reshape(n, n) * celulas, d[:, 1].reshape(n, n) * celulas, ids[i[:, 0]].reshape(n, n), rng.random(len(g))

def salvar(arr, nome, srgb=True):
    a = np.clip(arr, 0, 1)
    if srgb: a = np.where(a <= 0.0031308, 12.92 * a, 1.055 * a ** (1 / 2.4) - 0.055)
    Image.fromarray((a * 255).astype(np.uint8)).save(os.path.join(AQUI, nome), quality=90)
    print('ok', nome)

def normal_de(h, forca):
    gy, gx = np.gradient(h); n = np.stack([-gx * forca, -gy * forca, np.ones_like(h)], -1); n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return n * 0.5 + 0.5

n = RES
# ---------------------------------------------------------------- face de corte
w1 = (fbm(n, 4, 3, 10) - 0.5) + 0.35 * (fbm(n, 3, 12, 12) - 0.5); w2 = (fbm(n, 4, 3, 11) - 0.5) + 0.35 * (fbm(n, 3, 12, 13) - 0.5)   # deformação em duas escalas (bordas curvas, não retas)
d1, d2, idc, rc = voronoi(n, 54, warp=(0.03 * w1, 0.03 * w2), sem=3)          # fascículos (~3,7 mm)
D1, D2, IDC, RC = voronoi(n, 11, warp=(0.09 * w1, 0.09 * w2), sem=4)            # feixes grandes (~15 mm)
borda = d2 - d1; bordaG = D2 - D1
var = fbm(n, 5, 4, 20)
linhas = np.exp(-borda / (0.045 + 0.04 * var)) * (0.35 + 0.65 * fbm(n, 3, 8, 21))                 # perimísio fino, irregular
linhasG = np.exp(-bordaG / (0.035 + 0.05 * var))                                                 # perimísio dos feixes grandes
mm = fbm(n, 5, 5, 22)
rv = 1 - np.abs(2 * fbm(n, 5, 4, 24) - 1)                                                       # ruído 'crista': veios finos que se ramificam
gordura = np.clip((rv - 0.94) * 22, 0, 1) * (fbm(n, 3, 3, 25) > 0.42) + np.clip((mm - 0.76) * 16, 0, 1) * 0.7
gordura = np.clip(gordura, 0, 1)
gordura = gaussian_filter(gordura, 0.8)
tom = np.clip(0.78 * fbm(n, 5, 2, 30) + 0.08 * rc[idc] + 0.14 * RC[IDC], 0, 1) ** 0.8
escuro, vivo = np.array([0.15, 0.008, 0.016]), np.array([0.56, 0.045, 0.045])
cor = escuro + (vivo - escuro) * np.clip(tom, 0, 1)[..., None]
cor *= (0.90 + 0.14 * fbm(n, 2, 160, 31))[..., None]                                            # granulado: as pontas das fibras cortadas
cor = cor * (1 - 0.10 * linhas[..., None]) + np.array([0.55, 0.30, 0.30]) * 0.10 * linhas[..., None]   # tecido conjuntivo, bem discreto
cor = cor * (1 - 0.20 * linhasG[..., None]) + np.array([0.66, 0.44, 0.42]) * 0.20 * linhasG[..., None]
gc = np.array([0.90, 0.80, 0.62]) * (0.9 + 0.1 * fbm(n, 3, 16, 32))[..., None]
cor = cor * (1 - gordura[..., None]) + gc * gordura[..., None]
salvar(cor, 'carne_corte_cor.jpg')
h = (1 - np.clip(d1, 0, 1)) * 0.12 - linhas * 0.2 - linhasG * 0.5 + gordura * 0.25 + 0.35 * fbm(n, 2, 160, 33) + 0.3 * fbm(n, 3, 6, 35)
salvar(normal_de(gaussian_filter(h, 1.0), n / 160), 'carne_corte_normal.jpg', srgb=False)
salvar(np.repeat((0.30 + 0.30 * linhas + 0.25 * gordura + 0.08 * fbm(n, 3, 32, 34))[..., None], 3, -1), 'carne_corte_rug.jpg', srgb=False)
# ---------------------------------------------------------------- lateral: grão das fibras (estrias ao longo do eixo u)
m = n // 2
x = np.linspace(0, 1, n, endpoint=False)
estr = np.zeros((m, n))
for k, (freq, amp) in enumerate([(220, 0.5), (90, 0.3), (40, 0.2)]):
    fase = fbm(n, 3, 4, 40 + k)[:m] * 6.0
    v = np.linspace(0, 1, m, endpoint=False)[:, None]
    estr += amp * (0.5 + 0.5 * np.sin(2 * np.pi * freq * v + fase))
grao = np.clip(estr, 0, 1)
tomL = 0.5 * fbm(n, 4, 3, 50)[:m] + 0.5 * grao
corL = escuro + (vivo - escuro) * tomL[..., None] * 0.95
fasc = np.clip((fbm(n, 5, 12, 51)[:m] - 0.68) * 5, 0, 1) * 0.6                                     # fáscia prateada em manchas finas
corL = corL * (1 - 0.7 * fasc[..., None]) + np.array([0.78, 0.74, 0.78]) * 0.7 * fasc[..., None]
salvar(corL, 'carne_lado_cor.jpg')
salvar(normal_de(gaussian_filter(grao * 0.8 + fasc * 0.3, 0.8), m / 120), 'carne_lado_normal.jpg', srgb=False)
# ---------------------------------------------------------------- gordura de cobertura (capa)
cg = np.array([0.93, 0.85, 0.68]) * (0.86 + 0.16 * fbm(n, 5, 6, 60))[..., None] * (1 - 0.12 * np.clip((fbm(n, 3, 3, 61) - 0.5) * 3, 0, 1))[..., None]
salvar(cg[:m], 'gordura_cor.jpg')
