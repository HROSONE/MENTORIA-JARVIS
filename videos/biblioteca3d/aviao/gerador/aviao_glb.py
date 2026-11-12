"""Converte o Jetliner.obj (NuclearOsmosis, CC0; o original não traz cores nem coordenadas de textura) num GLB em metros
com a pintura da companhia "Hryz Animation": fuselagem branca, faixa azul-marinho e laranja que sobe para a cauda,
janelas, portas, cabine, "HRYZ ANIMATION" dos dois lados (lendo certo nos dois) e o logo na cauda.

A textura é aplicada por projeção lateral: cada lado do avião tem a sua metade da imagem, então o texto nunca fica espelhado.
Saída: ../jato-hryz.glb (nariz para +Z, origem no centro, eixo da fuselagem em y = 0) e ../previews/pintura.webp
Uso:   python3 aviao_glb.py"""
import io
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
AVIAO = os.path.dirname(AQUI)
sys.path.insert(0, os.path.join(AVIAO, '..', 'cidade', 'gerador'))
from glb import Material, Node, Prim, write_glb     # noqa: E402

ESCALA = 2.4              # 16,7 unidades -> 40 m de comprimento, 34 m de envergadura (porte de um jato médio de dois motores)
MARINHO, LARANJA, BRANCO, BARRIGA = (27, 42, 74), (224, 122, 44), (246, 247, 249), (196, 202, 210)
TW, TH = 4096, 1024       # cada lado da fuselagem; a imagem final tem os dois lados empilhados (4096 x 2048)


def fonte(tam):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/Library/Fonts/Arial Bold.ttf', 'C:/Windows/Fonts/arialbd.ttf'):
        if os.path.exists(f):
            return ImageFont.truetype(f, tam)
    return ImageFont.load_default()


def ler_obj(caminho):
    """objetos do OBJ: nome -> (posições, normais) de triângulos soltos"""
    V, VN, obj, cur = [], [], {}, None
    for linha in open(caminho):
        c = linha.split()
        if not c:
            continue
        if c[0] == 'v':
            V.append([float(x) for x in c[1:4]])
        elif c[0] == 'vn':
            VN.append([float(x) for x in c[1:4]])
        elif c[0] == 'o':
            cur = c[1].split('_')[0]
            obj[cur] = ([], [])
        elif c[0] == 'f':
            idx = [[int(x) - 1 if x else -1 for x in (t.split('/') + ['', ''])[:3]] for t in c[1:]]
            for k in range(1, len(idx) - 1):
                for i in (idx[0], idx[k], idx[k + 1]):
                    obj[cur][0].append(V[i[0]])
                    obj[cur][1].append(VN[i[2]])
    return {k: (np.array(p), np.array(n)) for k, (p, n) in obj.items()}


def texto(caixa_px, msg, cor, m_por_px):
    """renderiza o texto com a proporção física certa e estica para a caixa (a textura tem pixels não quadrados)"""
    w, h = caixa_px
    f = fonte(200)
    tmp = Image.new('L', (1, 1))
    bb = ImageDraw.Draw(tmp).textbbox((0, 0), msg, font=f)
    im = Image.new('RGBA', (bb[2] - bb[0] + 20, bb[3] - bb[1] + 20), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((10 - bb[0], 10 - bb[1]), msg, font=f, fill=cor)
    # largura física desejada: a altura física da caixa x proporção do texto
    alt_m = h * m_por_px[1]
    larg_m = alt_m * im.width / im.height
    larg_px = int(min(w, larg_m / m_por_px[0]))
    return im.resize((larg_px, h), Image.LANCZOS)


def pintura_fuselagem(L, H, com_texto=True):
    """um lado da fuselagem, com o nariz à ESQUERDA da imagem. x = fração do comprimento (0 nariz, 1 cauda), y = fração da altura (0 topo)"""
    im = Image.new('RGB', (TW, TH), BRANCO)
    d = ImageDraw.Draw(im)
    X = lambda t: t * TW
    Y = lambda h: h * TH
    mpp = (L / TW, H / TH)
    d.rectangle((0, Y(0.74), TW, TH), fill=BARRIGA)                                   # barriga cinza
    # faixa azul-marinho com filete laranja, subindo para a cauda
    base, sobe = 0.58, 0.82
    faixa = [(X(0.05), Y(base)), (X(sobe), Y(base)), (X(0.97), Y(0.10)), (X(1.0), Y(0.10)), (X(1.0), Y(0.30)), (X(sobe + 0.05), Y(base + 0.10)), (X(0.05), Y(base + 0.10))]
    d.polygon(faixa, fill=MARINHO)
    d.polygon([(X(0.05), Y(base + 0.10)), (X(sobe + 0.05), Y(base + 0.10)), (X(1.0), Y(0.30)), (X(1.0), Y(0.36)), (X(sobe + 0.06), Y(base + 0.14)), (X(0.05), Y(base + 0.14))], fill=LARANJA)
    # janelas da cabine de passageiros (com folga nas portas)
    portas = [0.10, 0.47, 0.86]
    t = 0.13
    while t < 0.84:
        if all(abs(t - p) > 0.025 for p in portas):
            x = X(t)
            d.rounded_rectangle((x - 0.13 / mpp[0], Y(0.37), x + 0.13 / mpp[0], Y(0.37) + 0.36 / mpp[1]), radius=10, fill=(40, 48, 60))
        t += 0.52 / L
    for p in portas:                                                                     # portas: contorno cinza com janelinha
        x = X(p)
        d.rounded_rectangle((x - 0.45 / mpp[0], Y(0.30), x + 0.45 / mpp[0], Y(0.30) + 1.85 / mpp[1]), radius=14, outline=(150, 156, 166), width=5)
        d.rounded_rectangle((x - 0.13 / mpp[0], Y(0.37), x + 0.13 / mpp[0], Y(0.37) + 0.30 / mpp[1]), radius=8, fill=(40, 48, 60))
    # janelas da cabine de comando
    for a, b in ((0.012, 0.024), (0.025, 0.036), (0.037, 0.046)):
        d.polygon([(X(a), Y(0.36)), (X(b), Y(0.33)), (X(b), Y(0.42)), (X(a), Y(0.43))], fill=(30, 36, 46))
    # nome da companhia, acima das janelas
    if com_texto:
        tx = texto((int(X(0.40)), int(Y(0.15))), 'HRYZ ANIMATION', MARINHO + (255,), mpp)
        im.paste(tx, (int(X(0.17)), int(Y(0.13))), tx)
    return im


def pintura_cauda():
    """um lado da deriva (cauda), com o nariz à ESQUERDA: azul-marinho, faixa laranja e o "H" do canal num círculo"""
    W, Hh = 1024, 1024
    im = Image.new('RGB', (W, Hh), MARINHO)
    d = ImageDraw.Draw(im)
    d.polygon([(0, Hh * 0.95), (W, Hh * 0.35), (W, Hh * 0.50), (0, Hh * 1.10)], fill=LARANJA)
    cx, cy, r = W * 0.58, Hh * 0.40, Hh * 0.20
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=BRANCO)
    f = fonte(int(r * 1.45))
    bb = d.textbbox((0, 0), 'H', font=f)
    d.text((cx - (bb[2] + bb[0]) / 2, cy - (bb[3] + bb[1]) / 2), 'H', font=f, fill=MARINHO)
    return im


def projetar(P, lo, hi):
    """UV por projeção lateral: lado +X usa a metade de cima (nariz à esquerda de quem olha desse lado), lado -X a de baixo"""
    tri = P.reshape(-1, 3, 3)
    lado = np.repeat(np.sign(tri[:, :, 0].mean(axis=1) + 1e-9), 3)
    u_nariz = (hi[2] - P[:, 2]) / (hi[2] - lo[2])            # 0 no nariz, 1 na cauda
    v = (hi[1] - P[:, 1]) / (hi[1] - lo[1])                  # 0 no topo
    u = np.where(lado > 0, u_nariz, 1.0 - u_nariz)
    v = np.where(lado > 0, 0.5 * v, 0.5 + 0.5 * v)
    return np.column_stack([u, v])


def jpg(im, q=88):
    b = io.BytesIO()
    im.convert('RGB').save(b, 'JPEG', quality=q)
    return b.getvalue()


def main():
    partes = ler_obj(os.path.join(AVIAO, 'Jetliner.obj'))
    todos = np.concatenate([p for p, _ in partes.values()]) * ESCALA
    fp = partes['Fusalage'][0] * ESCALA
    centro = np.array([(todos[:, 0].min() + todos[:, 0].max()) / 2, (fp[:, 1].min() + fp[:, 1].max()) / 2, (todos[:, 2].min() + todos[:, 2].max()) / 2])
    P = {k: p * ESCALA - centro for k, (p, _) in partes.items()}
    N = {k: n for k, (_, n) in partes.items()}
    lo, hi = P['Fusalage'].min(axis=0), P['Fusalage'].max(axis=0)
    L, H = hi[2] - lo[2], hi[1] - lo[1]

    # pintura da fuselagem: o lado de baixo do atlas é a mesma arte com o nariz à direita; o texto é redesenhado para não espelhar
    a = pintura_fuselagem(L, H)
    lado_b = espelho_com_texto(L, H)
    fus = Image.new('RGB', (TW, 2 * TH))
    fus.paste(a, (0, 0))
    fus.paste(lado_b, (0, TH))

    tl, th_ = P['Tail'].min(axis=0), P['Tail'].max(axis=0)
    c = pintura_cauda()
    cauda = Image.new('RGB', (c.width, 2 * c.height))
    cauda.paste(c, (0, 0))
    cauda.paste(c.transpose(Image.FLIP_LEFT_RIGHT), (0, c.height))

    m_fus = Material('Fuselagem', '#ffffff', rough=0.35, metal=0.1, texture=jpg(fus))
    m_cauda = Material('Cauda', '#ffffff', rough=0.35, metal=0.1, texture=jpg(cauda))
    m_asa = Material('Asas', '#c9ced6', rough=0.4, metal=0.35)
    m_motor = Material('Motores', '#1b2a4a', rough=0.35, metal=0.4)
    nos = [
        Node('Fuselagem', [Prim(m_fus, P['Fusalage'], N['Fusalage'], np.arange(len(P['Fusalage'])), projetar(P['Fusalage'], lo, hi))]),
        Node('Cauda', [Prim(m_cauda, P['Tail'], N['Tail'], np.arange(len(P['Tail'])), projetar(P['Tail'], tl, th_))]),
        Node('Asas', [Prim(m_asa, P['Wings'], N['Wings'], np.arange(len(P['Wings'])))]),
        Node('Motores', [Prim(m_motor, P['TurboFans'], N['TurboFans'], np.arange(len(P['TurboFans'])))]),
    ]
    tam_m = np.concatenate(list(P.values()))
    t0, t1 = tam_m.min(axis=0), tam_m.max(axis=0)
    raiz = Node('jato-hryz', children=nos, extras={'origem': 'Jetliner.obj (NuclearOsmosis, CC0)', 'marca': 'Hryz Animation', 'nariz': '+Z',
                                                    'comprimento_m': round(float(t1[2] - t0[2]), 1), 'envergadura_m': round(float(t1[0] - t0[0]), 1)})
    tam = write_glb(os.path.join(AVIAO, 'jato-hryz.glb'), [raiz], generator='Hryz Animation - aviao')
    os.makedirs(os.path.join(AVIAO, 'previews'), exist_ok=True)
    fus.resize((2048, 1024), Image.LANCZOS).save(os.path.join(AVIAO, 'previews', 'pintura.webp'), quality=85)
    print(f'jato-hryz.glb  {tam // 1024} KB  comprimento {t1[2] - t0[2]:.1f} m, envergadura {t1[0] - t0[0]:.1f} m, altura {t1[1] - t0[1]:.1f} m')


def espelho_com_texto(L, H):
    """o lado -X: a mesma pintura com o nariz à direita. Espelha a arte inteira e redesenha o nome no lugar espelhado, lendo certo"""
    a = pintura_fuselagem(L, H, com_texto=False)
    a = a.transpose(Image.FLIP_LEFT_RIGHT)
    mpp = (L / TW, H / TH)
    tx = texto((int(0.40 * TW), int(0.15 * TH)), 'HRYZ ANIMATION', MARINHO + (255,), mpp)
    x_dir = int((1 - 0.17) * TW)                              # a borda do nome que fica perto do nariz
    a.paste(tx, (x_dir - tx.width, int(0.13 * TH)), tx)
    return a


if __name__ == '__main__':
    main()
