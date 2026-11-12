"""Converte as 6 casas do drummyfish (OBJ + textura assada) em GLB com a textura embutida, em metros, e põe a marca do canal:
uma caixa de correio na frente de cada casa com a placa "Hryz Animation".

Saída: ../casa1-a.glb ... ../casa6-c.glb  (6 casas x 3 texturas: a, b, c)
Uso:   python3 casas_glb.py            (precisa de numpy e Pillow; as texturas ficam em ../texturas/*.webp)"""
import io
import json
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
CASAS = os.path.dirname(AQUI)
sys.path.insert(0, os.path.join(CASAS, '..', 'cidade', 'gerador'))
from glb import Material, Node, Prim, write_glb     # noqa: E402
from malha import Malha                             # noqa: E402

ESCALA = 3.0          # o arquivo original está em "unidades de Blender": x3 dá casas de 4,5 a 5,6 m de altura
# lado da frente (porta) de cada casa no arquivo original, conferido nas fotos: vetor (x, z)
FRENTE = {1: (0, 1), 2: (0, 1), 3: (0, 1), 4: (0, 1), 5: (0, 1), 6: (0, 1)}
MARINHO, LARANJA = '#1b2a4a', '#e07a2c'                     # cores do canal (protagonista azul-marinho, coadjuvante laranja)


def fonte(tam):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/Library/Fonts/Arial Bold.ttf', 'C:/Windows/Fonts/arialbd.ttf'):
        if os.path.exists(f):
            return ImageFont.truetype(f, tam)
    return ImageFont.load_default()


def jpg(im, q=90):
    b = io.BytesIO()
    im.convert('RGB').save(b, 'JPEG', quality=q)
    return b.getvalue()


def png(im):
    b = io.BytesIO()
    im.save(b, 'PNG', optimize=True)
    return b.getvalue()


def ler_obj(caminho):
    """OBJ com v/vt/vn em polígonos: devolve triângulos soltos (posição, normal, uv)"""
    V, VT, VN, P, N, U = [], [], [], [], [], []
    for linha in open(caminho):
        c = linha.split()
        if not c:
            continue
        if c[0] == 'v':
            V.append([float(x) for x in c[1:4]])
        elif c[0] == 'vt':
            VT.append([float(x) for x in c[1:3]])
        elif c[0] == 'vn':
            VN.append([float(x) for x in c[1:4]])
        elif c[0] == 'f':
            idx = [[int(x) - 1 if x else -1 for x in (t.split('/') + ['', ''])[:3]] for t in c[1:]]
            for k in range(1, len(idx) - 1):
                for i in (idx[0], idx[k], idx[k + 1]):
                    P.append(V[i[0]])
                    U.append(VT[i[1]] if i[1] >= 0 else (0.0, 0.0))
                    N.append(VN[i[2]] if i[2] >= 0 else (0.0, 1.0, 0.0))
    P, N, U = np.array(P), np.array(N), np.array(U)
    U[:, 1] = 1.0 - U[:, 1]                              # OBJ tem o v de baixo para cima; glTF, de cima para baixo
    return P, N, U


def placa_textura():
    """placa da caixa de correio: fundo azul-marinho, "Hryz" grande e "Animation" embaixo, filete laranja"""
    W, H = 512, 256
    im = Image.new('RGB', (W, H), MARINHO)
    d = ImageDraw.Draw(im)
    d.rectangle((10, 10, W - 11, H - 11), outline=LARANJA, width=8)
    f1, f2 = fonte(120), fonte(46)
    for txt, f, y in (('Hryz', f1, 26), ('Animation', f2, 168)):
        w = d.textlength(txt, font=f)
        d.text(((W - w) / 2, y), txt, font=f, fill='#ffffff')
    return png(im)


PLACA = Material('PlacaHryz', '#ffffff', rough=0.5, texture=placa_textura())
CORREIO = Material('CaixaCorreio', MARINHO, rough=0.45, metal=0.3)
POSTE = Material('PosteCorreio', '#2b2f35', rough=0.6, metal=0.3)
BANDEIRA = Material('BandeiraCorreio', LARANJA, rough=0.5)


def caixa_correio(x, z, giro):
    """caixa de correio americana num poste (1,15 m), porta virada para a rua; placa da marca dos dois lados"""
    m = Malha()
    m.box(POSTE, 0, 0.5, 0, 0.09, 1.0, 0.09)
    m.box(CORREIO, 0, 1.13, 0.0, 0.26, 0.26, 0.50)
    m.cyl(CORREIO, 0, 1.26, -0.25, 0.13, 0.50, segs=14, axis='z')       # teto arredondado
    m.box(BANDEIRA, 0.15, 1.30, -0.235, 0.02, 0.16, 0.03)               # bandeirinha, atrás da placa
    m.box(BANDEIRA, 0.15, 1.36, -0.19, 0.02, 0.05, 0.10)
    for sx in (1, -1):                                                  # placa "Hryz Animation" nas duas laterais
        x0 = sx * 0.142
        pts = [(x0, 1.06, -0.20), (x0, 1.06, 0.20), (x0, 1.26, 0.20), (x0, 1.26, -0.20)]
        uvs = [(1, 1), (0, 1), (0, 0), (1, 0)] if sx > 0 else [(0, 1), (1, 1), (1, 0), (0, 0)]
        m.poly(PLACA, pts, (sx, 0, 0), uvs=uvs)
    c, s = math.cos(giro), math.sin(giro)
    R = np.array([[c, 0, s, x], [0, 1, 0, 0], [-s, 0, c, z], [0, 0, 0, 1.0]])
    out = Malha()
    out.add(m, R)
    return out


def main():
    texturas = {v: jpg(Image.open(os.path.join(CASAS, 'texturas', f'casa_{v}.webp'))) for v in 'abc'}
    info = []
    for i in range(1, 7):
        P, N, U = ler_obj(os.path.join(CASAS, f'house{i}_baked.obj'))
        P = P * ESCALA
        lo, hi = P.min(axis=0), P.max(axis=0)
        P = P - np.array([(lo[0] + hi[0]) / 2, lo[1], (lo[2] + hi[2]) / 2])      # centro da pegada na origem, chão em y = 0
        lo, hi = P.min(axis=0), P.max(axis=0)
        fx, fz = FRENTE[i]
        # caixa de correio 1,5 m à frente da casa, perto do canto direito de quem olha a fachada
        if fz:
            x, z = 0.30 * hi[0] * fz * -1 + 0.0, (hi[2] if fz > 0 else lo[2]) + fz * 1.6
            giro = 0.0 if fz > 0 else math.pi
        else:
            x, z = (hi[0] if fx > 0 else lo[0]) + fx * 1.6, 0.30 * hi[2] * fx
            giro = fx * math.pi / 2
        correio = caixa_correio(x + (hi[0] - lo[0]) * 0.32, z, giro) if fz else caixa_correio(x, z + (hi[2] - lo[2]) * 0.32, giro)
        for v in 'abc':
            mat = Material(f'Casa{i}{v.upper()}', '#ffffff', rough=0.9, texture=texturas[v])
            casa = Node('Casa', [Prim(mat, P, N, np.arange(len(P)), U)])
            caixa = Node('CaixaCorreio', correio.prims())
            nome = f'casa{i}-{v}'
            raiz = Node(nome, children=[casa, caixa], extras={'origem': f'house{i}_baked.obj + house_{v}_bake.png (drummyfish, CC0)', 'marca': 'Hryz Animation',
                                                             'tamanho_m': [round(float(t), 2) for t in hi - lo], 'frente': '+Z' if fz > 0 else ('-Z' if fz < 0 else ('+X' if fx > 0 else '-X'))})
            tam = write_glb(os.path.join(CASAS, nome + '.glb'), [raiz], generator='Hryz Animation - casas')
            print(f'{nome}.glb  {tam // 1024:5d} KB  {hi[0] - lo[0]:.1f} x {hi[1] - lo[1]:.1f} x {hi[2] - lo[2]:.1f} m')
        info.append({'casa': i, 'arquivos': [f'casa{i}-{v}.glb' for v in 'abc'], 'tamanho_m': [round(float(t), 2) for t in hi - lo]})
    json.dump({'escala': ESCALA, 'casas': info}, open(os.path.join(CASAS, 'manifest.json'), 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
