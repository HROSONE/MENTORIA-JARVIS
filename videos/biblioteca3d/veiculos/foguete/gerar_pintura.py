"""Pintura do foguete HRYZ (textura do corpo), feita com Pillow.
Mapa: u = ângulo em volta do corpo (u = 0,75 é a frente, onde fica a escotilha), v = altura de z = 2,0 m (base da saia) a z = 23,2 m (ponta).
Desenha em escala real (362 px por metro, pixel quadrado na circunferência de r = 1,8 m) e reduz para 4096×2048 no fim:
a textura esticada volta à proporção certa no corpo, então as letras não saem achatadas.
Uso: python3 gerar_pintura.py  → gerado/pintura.png e gerado/relevo.png (linhas de painel, para as prévias)"""
import os, math
from PIL import Image, ImageDraw, ImageFont
R_CORPO, Z0, Z1 = 1.8, 2.0, 23.2
CIRC = 2 * math.pi * R_CORPO; PXM = 4096 / CIRC; W, H = 4096, int((Z1 - Z0) * PXM)
os.makedirs('gerado', exist_ok=True)
fonte = lambda m: ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Black.otf', int(m * PXM / 0.73))   # altura da maiúscula em metros
fonteB = lambda m: ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf', int(m * PXM / 0.73))
X = lambda u: u * W
Y = lambda z: (Z1 - z) * PXM
img = Image.new('RGB', (W, H), (236, 238, 240)); d = ImageDraw.Draw(img)
rel = Image.new('L', (W, H), 128); dr = ImageDraw.Draw(rel)
PRETO, LARANJA = (22, 23, 26), (255, 106, 26)
def texto(u, z, s, f, cor=PRETO, girar=0):
    """texto centrado em (u, z); girar = 90 escreve de baixo para cima"""
    bb = f.getbbox(s); t = Image.new('RGBA', (bb[2] + 10, bb[3] + 10), (0, 0, 0, 0)); ImageDraw.Draw(t).text((5, 5 - bb[1] + bb[1]), s, font=f, fill=cor + (255,))
    t = t.crop(t.getbbox())
    if girar: t = t.rotate(girar, expand=True)
    img.paste(t, (int(X(u) - t.width / 2), int(Y(z) - t.height / 2)), t)
# padrão de rolagem (quadrantes) na base e saia de metal escuro
for k in range(4):
    z0, z1 = (2.6, 4.4) if k % 2 == 0 else (4.4, 6.2)
    d.rectangle([int(k / 4 * W), Y(z1), int((k + 1) / 4 * W), Y(z0)], fill=PRETO)
d.rectangle([0, Y(2.6), W, H], fill=(58, 60, 64))
d.rectangle([0, Y(16.75), W, Y(16.35)], fill=PRETO)                 # anel entre o corpo e a cápsula
for z in (6.45, 15.95): d.rectangle([0, Y(z + 0.14), W, Y(z)], fill=LARANJA)
# HRYZ na vertical (letra por letra) na frente e atrás; ANIMATION ao lado, de baixo para cima
for uc in (0.75, 0.25):
    for i, ch in enumerate('HRYZ'): texto(uc, 14.75 - i * 1.95, ch, fonte(1.45))
    texto(uc + 0.115, 11.85, 'ANIMATION', fonteB(0.42), girar=90)
for uc in (0.5, 0.0, 1.0): texto(uc, 17.55, 'HRYZ-1 · LUNAR', fonteB(0.30))
texto(0.75, 5.35, 'ESCOTILHA DA TRIPULAÇÃO', fonteB(0.09), (70, 70, 70))
for uc in (0.625, 0.875, 0.375, 0.125): texto(uc, 7.2, 'NÃO PISE · PERNA DE POUSO', fonteB(0.07), (70, 70, 70))
texto(0.5, 7.6, 'PERIGO · PROPELENTE', fonteB(0.1), (150, 30, 20))
d.rounded_rectangle([X(0.75) - 0.62 * PXM, Y(4.85), X(0.75) + 0.62 * PXM, Y(2.98)], radius=int(0.12 * PXM), outline=(30, 30, 30), width=10)
# linhas de painel e rebites (relevo): anéis a cada 1,6 m e costuras a cada 30°
for z in [2.6 + 1.6 * k for k in range(9)] + [17.6, 19.0, 20.6]:
    d.line([0, Y(z), W, Y(z)], fill=(196, 198, 202), width=4); dr.line([0, Y(z), W, Y(z)], fill=70, width=8)
for k in range(12):
    x = X(k / 12 + 1 / 24); d.line([x, Y(16.35), x, Y(2.6)], fill=(205, 207, 210), width=3); dr.line([x, Y(16.35), x, Y(2.6)], fill=80, width=6)
    for j in range(46):
        z = 2.7 + 0.3 * j; dr.ellipse([x - 12, Y(z) - 4, x - 4, Y(z) + 4], fill=170); dr.ellipse([x + 4, Y(z) - 4, x + 12, Y(z) + 4], fill=170)
img.resize((4096, 2048), Image.LANCZOS).save('gerado/pintura.png'); rel.resize((4096, 2048), Image.LANCZOS).save('gerado/relevo.png'); print('ok', W, H)
