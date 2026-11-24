# Texturas pintadas por script para a caixa de munição de morteiro 60 mm (EUA, 2ª Guerra): madeira pintada de verde-oliva com lascas,
# madeira crua, estêncil amarelo (decalques com transparência), tubo de fibra preto e o corpo da granada com as marcas.
# uso: python3 texturas.py  (gera tex/*.png)
import os, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
AQUI = os.path.dirname(os.path.abspath(__file__)); T = os.path.join(AQUI, 'tex'); os.makedirs(T, exist_ok=True)
R = np.random.default_rng(7)
FONTE = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

def ruido(h, w, escalas=(4, 16, 64), pesos=(.5, .3, .2), sem=0):
    r = np.random.default_rng(sem); out = np.zeros((h, w))
    for e, p in zip(escalas, pesos):
        g = r.random((e + 1, e + 1)); im = Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        out += p * np.asarray(im) / 255
    return out

def veios(h, w, sem=0):
    """veios de madeira ao longo de x (u): linhas onduladas"""
    r = np.random.default_rng(sem); y = np.arange(h)[:, None] / h; x = np.arange(w)[None, :] / w
    onda = ruido(h, w, (3, 9), (.7, .3), sem + 1) * 0.08
    v = np.sin((y + onda) * 2 * np.pi * (34 + r.random() * 10)) * 0.5 + 0.5
    nos = np.zeros((h, w))
    for _ in range(3):
        cx, cy, rr = r.random(), r.random(), 0.02 + r.random() * 0.03
        d = np.sqrt(((x - cx) * 3) ** 2 + (y - cy) ** 2); nos += np.exp(-(d / rr) ** 2)
    return np.clip(v ** 3 * 0.7 + nos * 0.8, 0, 1)

def madeira(nome, base, escuro, pintada=True, sem=0, N=1024):
    v = veios(N, N, sem); n = ruido(N, N, (8, 32, 128), (.4, .35, .25), sem + 5)
    crua = np.array([128, 104, 76]) * (0.85 + 0.25 * n[..., None]) - 40 * v[..., None]
    if not pintada: img = crua
    else:
        tinta = np.array(base) * (0.9 + 0.18 * n[..., None]) - np.array(escuro) * v[..., None] * 0.25
        lasca = ruido(N, N, (12, 48, 160), (.35, .4, .25), sem + 9); borda = np.zeros((N, N))
        borda[:, :40] = 1; borda[:, -40:] = 1; borda[:40, :] = .6; borda[-40:, :] = .6
        borda = np.asarray(Image.fromarray((borda * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(30))) / 255
        m = (lasca + borda * 0.22) > 0.80
        img = np.where(m[..., None], crua * 0.9, tinta)
        suj = ruido(N, N, (6, 24), (.6, .4), sem + 13)
        img = img * (0.82 + 0.25 * suj[..., None])
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(os.path.join(T, nome))

def estencil(nome, linhas, w, h, tam, cor=(222, 200, 110)):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    y = (h - sum(t for _, t in zip(linhas, tam)) * 1.25) / 2
    for txt, t in zip(linhas, tam):
        f = ImageFont.truetype(FONTE, t); bw = d.textlength(txt, font=f)
        d.text(((w - bw) / 2, y), txt, font=f, fill=cor + (255,)); y += t * 1.25
    a = np.asarray(im).astype(float)
    # pontes de estêncil: cortes verticais finos nas letras + borrifo nas bordas + falhas da tinta
    falha = ruido(h, w, (10, 40, 160), (.3, .4, .3), 21)
    a[..., 3] *= np.clip((falha - 0.28) * 4, 0, 1)
    al = Image.fromarray(a[..., 3].astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    out = Image.fromarray(a.astype(np.uint8)); out.putalpha(al); out.save(os.path.join(T, nome))

madeira('madeira_od.png', (84, 90, 52), (40, 40, 20), True, 1)
madeira('madeira_od2.png', (78, 86, 48), (40, 40, 20), True, 2)
madeira('madeira_crua.png', 0, 0, False, 3)
estencil('estencil_frente.png', ['10 CARTRIDGES', '60MM, HE, M49A2', 'W/FUZE, P.D., M52', 'LOT KC-4-27', 'WT. 49 LBS.  CU. 0.9'], 2048, 1024, [150, 150, 110, 90, 80])
estencil('estencil_tampa.png', ['60MM', 'HE', 'M49A2'], 1024, 1024, [230, 200, 130])
estencil('estencil_ponta.png', ['10 RDS.', 'OCT. 1944'], 1024, 512, [130, 100])

# tubo de fibra (u = volta, v = comprimento): preto fosco, fita amarela perto da tampa, etiqueta
N = 1024; n = ruido(N, N, (8, 64), (.5, .5), 31)
tubo = np.zeros((N, N, 3)) + np.array([28, 27, 25]) * (0.85 + 0.3 * n[..., None])
for y0, y1 in [(40, 90), (930, 980)]: tubo[y0:y1] = np.array([186, 160, 70]) * (0.85 + 0.2 * n[y0:y1, :, None])
im = Image.fromarray(np.clip(tubo, 0, 255).astype(np.uint8)); d = ImageDraw.Draw(im); f = ImageFont.truetype(FONTE, 46)
for k in range(2): d.text((60 + k * 512, 460), 'CTG 60MM HE M49A2', font=f, fill=(200, 190, 150))
im.save(os.path.join(T, 'tubo.png'))

# corpo da granada (u = volta, v = altura 0..1 do perfil inteiro): verde-oliva com marcas amarelas
W2, H2 = 2048, 1024; n = ruido(H2, W2, (8, 64, 200), (.4, .4, .2), 41)
g = np.zeros((H2, W2, 3)) + np.array([72, 78, 44]) * (0.9 + 0.2 * n[..., None])
im = Image.fromarray(np.clip(g, 0, 255).astype(np.uint8)); d = ImageDraw.Draw(im); f = ImageFont.truetype(FONTE, 54)
# v = z / 0.247 (o PNG tem v=1 em cima)
for k in range(2):
    d.text((80 + k * 1024, int(H2 * (1 - 0.68))), '60MM  M49A2', font=f, fill=(214, 190, 70))
    d.text((80 + k * 1024, int(H2 * (1 - 0.61))), 'HE  TNT', font=f, fill=(214, 190, 70))
    d.text((80 + k * 1024, int(H2 * (1 - 0.54))), 'LOT KC-4-27', font=ImageFont.truetype(FONTE, 40), fill=(214, 190, 70))
im.save(os.path.join(T, 'granada.png'))
print('ok')
