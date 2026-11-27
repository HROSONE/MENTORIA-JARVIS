"""Terreno da Lua (fase do astronauta), gerado em numpy, para o Blender montar e exportar (criar_lua.py).
Física das crateras (crateras simples, menores que ~15 km, que é o caso de tudo aqui):
  - profundidade ~0,2 do diâmetro e borda ~0,04 do diâmetro quando novas (Pike 1977; Melosh, "Impact Cratering");
  - o material ejetado engrossa a borda e cai com ~(r/R)^-3 para fora (McGetchin et al. 1973);
  - a quantidade segue uma lei de potência: N(>D) ~ D^-2 (crateras pequenas muito mais numerosas);
  - crateras velhas ficam rasas e suaves (erosão por micrometeoritos); as novas são mais claras e têm raios de ejeção.
Saídas (na pasta `gerado/`, fora do git): altura_hd.npy (2048², 0,39 m), albedo.png, normal.png (tangente, OpenGL),
detalhe_normal.png (512², repete a cada 4 m), altura_jogo.bin (Float32 321² = malha do jogo, 2,5 m) e rochas.json.
Uso: python3 gerar_terreno.py"""
import json, os, numpy as np
from PIL import Image

L, N, NJ = 800.0, 2048, 321                     # lado (m), resolução da textura, vértices da malha por lado
DX = L / N
R = np.random.default_rng(1969)
os.makedirs('gerado', exist_ok=True)
xs = (np.arange(N) + 0.5) * DX - L / 2
X, Z = np.meshgrid(xs, xs)                       # linha i = z (de -L/2 a +L/2), coluna j = x

def ruido(n, escalas, rng, periodico=True):
    """fbm por FFT (ruído com espectro 1/f^b), periódico; escalas = [(comprimento_m, amplitude)]"""
    f = np.fft.fftfreq(n, d=DX); FX, FZ = np.meshgrid(f, f); fr = np.hypot(FX, FZ) + 1e-9
    out = np.zeros((n, n))
    for lam, amp in escalas:
        filtro = np.exp(-((np.log(fr * lam)) ** 2) / 0.8)           # banda em volta de 1/lam
        w = np.fft.ifft2(np.fft.fft2(rng.standard_normal((n, n))) * filtro).real
        out += amp * w / (w.std() + 1e-9)
    return out

# ---------------------------------------------------------------------------------------- relevo de base
H = ruido(N, [(300, 3.0), (120, 1.1), (45, 0.3), (15, 0.08)], R)
mare = ruido(N, [(500, 1.0), (200, 0.4)], R); mare = 1 / (1 + np.exp(-(mare + 0.3) * 3))   # 1 = "mar" escuro e liso (basalto)
H *= 1 - 0.45 * mare
H += 6 * (1 - mare)                               # as terras altas ficam mais altas que o mar
alb = 0.105 + 0.055 * (1 - mare) + 0.008 * ruido(N, [(60, 1), (8, 0.6)], R)   # albedo (linear): mar ~0,10, terras altas ~0,16

# ---------------------------------------------------------------------------------------- crateras
crateras = []
def cratera(cx, cz, D, idade, raios=False):
    crateras.append((cx, cz, D, idade))
    Rr = D / 2; ext = Rr * (2.6 if idade < 0.3 else 1.6)
    j0, j1 = max(0, int((cx - ext + L / 2) / DX)), min(N, int((cx + ext + L / 2) / DX) + 1)
    i0, i1 = max(0, int((cz - ext + L / 2) / DX)), min(N, int((cz + ext + L / 2) / DX) + 1)
    if j0 >= j1 or i0 >= i1: return
    x, z = X[i0:i1, j0:j1], Z[i0:i1, j0:j1]
    r = np.hypot(x - cx, z - cz) / Rr
    prof, borda = 0.2 * D * (1 - 0.75 * idade), 0.04 * D * (1 - 0.8 * idade)
    piso = 1 - 0.35 * min(1, D / 120)              # as grandes têm o fundo mais chato
    dentro = borda - (prof + borda) * np.clip(1 - (r / 1.0) ** 2, 0, 1) ** (1.0 + 0.6 * idade)
    chao_ = borda - (prof + borda) * piso; sv = 0.03 * D                     # fundo chato com a transição suave (máximo suave)
    dentro = chao_ + sv * np.logaddexp(0, (dentro - chao_) / sv)
    re = ext / Rr; fade = np.clip((re - r) / (0.35 * re), 0, 1); fade = fade * fade * (3 - 2 * fade)   # some antes da borda do recorte
    fora = borda * np.clip(r, 1, None) ** -3 * fade
    k = np.clip((r - 0.92) / 0.16, 0, 1); k = k * k * (3 - 2 * k)
    perfil = dentro * (1 - k) + fora * k
    # a cratera substitui o terreno por dentro (não só soma): o fundo segue a média local
    w_in = np.clip(1 - r, 0, 1) ** 0.5
    base = H[i0:i1, j0:j1]
    m = base[r < 1.0].mean() if (r < 1.0).any() else base.mean()
    H[i0:i1, j0:j1] = base * (1 - 0.6 * w_in) + m * 0.6 * w_in + perfil
    # cor: crateras novas expõem material claro (paredes e ejeção), velhas somem no fundo
    fresco = max(0.0, 1 - idade / 0.45)
    ang = np.arctan2(z - cz, x - cx)
    ej = np.clip(r, 1, None) ** -2.2 * (r > 0.95)
    if raios:
        rr = np.zeros_like(ang)
        for _ in range(14): a0 = R.uniform(-np.pi, np.pi); rr += np.exp(-((np.angle(np.exp(1j * (ang - a0)))) / R.uniform(0.02, 0.07)) ** 2)
        ej = ej + 0.6 * rr * np.clip(r - 1, 0, None) ** 0.3 * np.exp(-(r - 1) / 4.0) * (r > 1)
    parede = np.exp(-((r - 0.7) / 0.25) ** 2) * (r < 1)
    alb[i0:i1, j0:j1] += fresco * (0.07 * ej * fade + 0.04 * parede)

# heróis: a cratera grande perto do pouso e uma nova com raios
cratera(130, -95, 170, 0.15)
cratera(-160, 150, 110, 0.55)
cratera(60, 210, 46, 0.05, raios=True)
cratera(-90, -70, 34, 0.25)
LIVRE = (0, 0, 28)                                 # área de pouso do foguete: sem crateras maiores que 4 m
def livre(x, z, D):
    return np.hypot(x - LIVRE[0], z - LIVRE[1]) > LIVRE[2] + D * 0.7 or D < 4
def sorteio(n, dmin, dmax, b=2.0):
    """diâmetros pela lei de potência N(>D) ~ D^-b"""
    u = R.random(n); return (dmin ** -b - u * (dmin ** -b - dmax ** -b)) ** (-1 / b)
for D in sorted(sorteio(700, 6, 90), reverse=True):
    x, z = R.uniform(-L / 2, L / 2, 2)
    if livre(x, z, D): cratera(x, z, D, R.beta(1.2, 1.0), raios=(D > 25 and R.random() < 0.12))
for D in sorteio(9000, 1.2, 6):
    x, z = R.uniform(-L / 2, L / 2, 2)
    if livre(x, z, D): cratera(x, z, D, R.beta(1.0, 1.4))
H -= H[N // 2 - 20:N // 2 + 20, N // 2 - 20:N // 2 + 20].mean()      # pouso em y = 0

# ---------------------------------------------------------------------------------------- rochas (blocos ejetados em volta das crateras novas)
rochas = []
for cx, cz, D, idade in crateras:
    if D < 10 or idade > 0.5: continue
    n = int(D * 0.9 * (1 - idade))
    for _ in range(n):
        a, rr = R.uniform(0, 2 * np.pi), D / 2 * (0.75 + R.exponential(0.5))
        s = min(D * 0.03, 3.5) * R.uniform(0.2, 1.0) ** 2 + 0.15
        rochas.append([cx + rr * np.cos(a), cz + rr * np.sin(a), s])
for _ in range(900):
    rochas.append([R.uniform(-L / 2, L / 2), R.uniform(-L / 2, L / 2), 0.12 + 0.6 * R.random() ** 3])
rochas = [r_ for r_ in rochas if abs(r_[0]) < L / 2 - 2 and abs(r_[1]) < L / 2 - 2 and (np.hypot(r_[0], r_[1]) > 14 or r_[2] < 0.3)]
rochas = [[round(x, 2), round(z, 2), round(s, 2), round(float(R.uniform(0, 6.283)), 2), int(R.integers(6))] for x, z, s in rochas]

# ---------------------------------------------------------------------------------------- saídas
np.save('gerado/altura_hd.npy', H.astype(np.float32))
alb = np.clip(alb, 0.04, 0.32)
srgb = np.where(alb <= 0.0031308, 12.92 * alb, 1.055 * alb ** (1 / 2.4) - 0.055)
Image.fromarray((srgb * 255 + 0.5).astype(np.uint8)).save('gerado/albedo.png')
# normal da malha fina (altura HD + grão): dh/dx por colunas, dh/dz por linhas
from scipy.ndimage import gaussian_filter
Hdet = H - gaussian_filter(H, 3.5)                    # só o detalhe que a malha (2,5 m) não tem; o relevo grande já está na geometria
gz, gx = np.gradient(Hdet, DX)
nrm = np.dstack([-gx, gz, np.ones_like(H)]); nrm /= np.linalg.norm(nrm, axis=2, keepdims=True)   # verde = +v (para cima na imagem = -z)
Image.fromarray(((nrm * 0.5 + 0.5) * 255 + 0.5).astype(np.uint8)).save('gerado/normal.png')
# malha do jogo: altura amostrada nos vértices (321², 2,5 m)
idx = np.clip(np.round(np.linspace(0, N - 1, NJ)).astype(int), 0, N - 1)
from scipy.ndimage import gaussian_filter, map_coordinates
Hs = gaussian_filter(H, 1.5)
c = (np.linspace(-L / 2, L / 2, NJ) + L / 2) / DX - 0.5
CI, CJ = np.meshgrid(c, c, indexing='ij')
HJ = map_coordinates(Hs, [CI, CJ], order=1, mode='nearest').astype(np.float32)
HJ.tofile('gerado/altura_jogo.bin')
json.dump({'L': L, 'n': NJ, 'rochas': rochas, 'fonte': 'gerar_terreno.py'}, open('gerado/rochas.json', 'w'))
# detalhe que repete (4 m, 512 px): grão do regolito + microcrateras, periódico
Nd, Ld = 512, 4.0; dd = Ld / Nd
fd = np.fft.fftfreq(Nd, d=dd); FX, FZ = np.meshgrid(fd, fd); fr = np.hypot(FX, FZ) + 1e-9
hd = np.fft.ifft2(np.fft.fft2(R.standard_normal((Nd, Nd))) * fr ** -1.6 * (fr > 0.3)).real; hd = hd / hd.std() * 0.004
yy, xx = np.mgrid[0:Nd, 0:Nd] * dd
for _ in range(160):                                     # microcrateras rasas e gastas (bordas suaves), tamanhos variados
    cx, cz, rr = R.uniform(0, Ld), R.uniform(0, Ld), 0.015 + 0.10 * R.random() ** 3
    dxw = (xx - cx + Ld / 2) % Ld - Ld / 2; dzw = (yy - cz + Ld / 2) % Ld - Ld / 2; r = np.hypot(dxw, dzw) / rr
    hd += -0.07 * rr * R.uniform(0.3, 1.0) * np.exp(-r ** 2 * 1.6) + 0.012 * rr * np.exp(-((r - 1.1) / 0.3) ** 2)
gz, gx = np.gradient(hd, dd)
nd = np.dstack([-gx, gz, np.ones_like(hd)]); nd /= np.linalg.norm(nd, axis=2, keepdims=True)
Image.fromarray(((nd * 0.5 + 0.5) * 255 + 0.5).astype(np.uint8)).save('gerado/detalhe_normal.png')
print('crateras', len(crateras), 'rochas', len(rochas), 'altura', round(float(H.min()), 1), round(float(H.max()), 1))
