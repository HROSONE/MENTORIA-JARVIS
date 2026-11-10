"""Esporte: estádio de futebol (campo 100 x 64 m, quatro arquibancadas cobertas, refletores e placar) e campo de várzea iluminado.
São ladrilhos grandes (como a rotatória): coloque em y = 0; o chão e o gramado ficam em y = 0,15, a altura das calçadas do kit.
Origem no centro do campo; o comprimento do campo corre ao longo de X; as traves ficam em x = +-50 (estádio) e x = +-32 (várzea)."""
import io
import math
from PIL import Image, ImageDraw
from glb import Material
from malha import Malha, T, Ry, V, triangular
from paleta import *
import letreiros

CH = 0.15
YL = CH + 0.012
LINHA = FAIXA_BRANCA
PISTA = Material('PistaConcreto', '#b9b4a8', rough=0.95)
ASSENTO_AZ = Material('AssentoAzul', '#1b4fa3', rough=0.7)
ASSENTO_BR = Material('AssentoBranco', '#eceff3', rough=0.7)
DEGRAU = Material('DegrauConcreto', '#cfccc4', rough=0.95)
ESPELHO = Material('EspelhoConcreto', '#a9a69e', rough=0.95)
COBERTURA = Material('Cobertura', '#e4e6ea', rough=0.7)
FUNDO_COBERTURA = Material('FundoCobertura', '#b8bcc4', rough=0.8)
FAIXA_AZUL = Material('FaixaAzulEstadio', '#1b4fa3', rough=0.6)
TERRA_BATIDA = Material('TerraBatida', '#a98558', rough=1.0)


def textura_rede():
    S, N = 6, 32
    img = Image.new('RGBA', (N * S, N * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    w = 1.6 * S
    d.rectangle([0, 0, N * S, w], fill=(245, 245, 245, 255))
    d.rectangle([0, 0, w, N * S], fill=(245, 245, 245, 255))
    img = img.resize((N, N), Image.LANCZOS)
    b = io.BytesIO(); img.save(b, 'PNG', optimize=True)
    return b.getvalue()


REDE = Material('Rede', '#ffffff', rough=0.8, texture=textura_rede(), alpha='BLEND', double_sided=True, repeat=True)


# ---------------------------------------------------------------- marcações do campo
def faixa_ret(m, x0, x1, z0, z1):
    m.top(LINHA, x0, x1, z0, z1, YL)


def contorno(m, x0, x1, z0, z1, w=0.12):
    faixa_ret(m, x0 - w / 2, x1 + w / 2, z0 - w / 2, z0 + w / 2)
    faixa_ret(m, x0 - w / 2, x1 + w / 2, z1 - w / 2, z1 + w / 2)
    faixa_ret(m, x0 - w / 2, x0 + w / 2, z0 + w / 2, z1 - w / 2)
    faixa_ret(m, x1 - w / 2, x1 + w / 2, z0 + w / 2, z1 - w / 2)


def arco(m, cx, cz, r, a0, a1, w=0.12, n=40):
    """arco de linha entre os ângulos a0 e a1 (rad, de +X para +Z)"""
    for i in range(n):
        t0, t1 = a0 + (a1 - a0) * i / n, a0 + (a1 - a0) * (i + 1) / n
        p = lambda rr, t: (cx + rr * math.cos(t), YL, cz + rr * math.sin(t))
        m.quad(LINHA, p(r - w / 2, t0), p(r + w / 2, t0), p(r + w / 2, t1), p(r - w / 2, t1), (0, 1, 0))


def ponto(m, x, z, r=0.2):
    m.poly(LINHA, [(x + r * math.cos(2 * math.pi * i / 12), YL, z + r * math.sin(2 * math.pi * i / 12)) for i in range(12)], (0, 1, 0))


def linhas_campo(m, c=100.0, l=64.0, pen=(16.5, 40.3), gol=(5.5, 18.32), raio=9.15, pen_ponto=11.0):
    """contorno, linha do meio, círculo central, grandes e pequenas áreas, marcas de pênalti, meias-luas e escanteios"""
    hx, hz = c / 2, l / 2
    contorno(m, -hx, hx, -hz, hz)
    faixa_ret(m, -0.06, 0.06, -hz, hz)
    arco(m, 0, 0, raio, 0, 2 * math.pi, n=64)
    ponto(m, 0, 0)
    for s in (-1, 1):
        x_pen = s * (hx - pen[0])
        contorno(m, min(s * hx, x_pen), max(s * hx, x_pen), -pen[1] / 2, pen[1] / 2)
        x_gol = s * (hx - gol[0])
        contorno(m, min(s * hx, x_gol), max(s * hx, x_gol), -gol[1] / 2, gol[1] / 2)
        ponto(m, s * (hx - pen_ponto), 0)
        cx = s * (hx - pen_ponto)
        a = math.acos(max(-1.0, min(1.0, (pen[0] - pen_ponto) / raio)))        # onde o círculo cruza a linha da grande área
        if s > 0:
            arco(m, cx, 0, raio, math.pi - a, math.pi + a, n=24)
        else:
            arco(m, cx, 0, raio, -a, a, n=24)
    for sx in (-1, 1):
        for sz in (-1, 1):
            a0 = {(1, 1): math.pi, (-1, 1): math.pi * 1.5, (1, -1): math.pi * 0.5, (-1, -1): 0.0}[(sx, sz)]
            arco(m, sx * hx, sz * hz, 1.0, a0, a0 + math.pi / 2, n=8)


# ---------------------------------------------------------------- traves, bandeirinhas e refletores
def trave(larg=7.32, alt=2.44, prof=2.2):
    """trave com rede, boca voltada para +Z, linha de fundo em z = 0 (a rede fica em z < 0)"""
    q, r = Malha(), Malha()
    hw = larg / 2
    for sx in (-1, 1):
        q.cyl(BRANCO_PURO, sx * hw, 0.0, 0.0, 0.06, alt, 10)
        q.tubo(BRANCO_PURO, (sx * hw, alt, 0.0), (sx * hw, alt * 0.66, -prof), 0.04, 0.04, 6)
        q.tubo(BRANCO_PURO, (sx * hw, 0.0, -prof), (sx * hw, alt * 0.66, -prof), 0.04, 0.04, 6)
        q.tubo(BRANCO_PURO, (sx * hw, 0.02, 0.0), (sx * hw, 0.02, -prof), 0.03, 0.03, 6)
    q.tubo(BRANCO_PURO, (-hw, alt, 0.0), (hw, alt, 0.0), 0.06, 0.06, 10)
    q.tubo(BRANCO_PURO, (-hw, alt * 0.66, -prof), (hw, alt * 0.66, -prof), 0.04, 0.04, 6)
    k = 0.12
    yb = alt * 0.66
    topo = [(-hw, alt, 0.0), (hw, alt, 0.0), (hw, yb, -prof), (-hw, yb, -prof)]
    r.quad(REDE, *topo, (0, 1, 0), uvs=[(0, 0), (larg / k, 0), (larg / k, prof / k), (0, prof / k)])
    r.quad(REDE, (-hw, yb, -prof), (hw, yb, -prof), (hw, 0, -prof), (-hw, 0, -prof), (0, 0, 1), uvs=[(0, 0), (larg / k, 0), (larg / k, yb / k), (0, yb / k)])
    for sx in (-1, 1):
        r.quad(REDE, (sx * hw, alt, 0.0), (sx * hw, yb, -prof), (sx * hw, 0, -prof), (sx * hw, 0, 0.0), (sx, 0, 0),
               uvs=[(0, 0), (prof / k, 0), (prof / k, yb / k), (0, alt / k)])
    return q, r


def bandeirinha(m, x, z, cor='#f6c500'):
    m.cyl(BRANCO_PURO, x, 0.0, z, 0.02, 1.5, 6)
    mat = Material('Escanteio_' + cor.lstrip('#'), cor, rough=0.8, double_sided=True)
    m.quad(mat, (x, 1.12, z), (x + 0.35, 1.2, z), (x + 0.35, 1.5, z), (x, 1.5, z), (0, 0, 1))


def refletor(h, ex, ez, alvo=(0.0, 0.0), cols=6, fil=4, larg=0.7):
    """torre de refletores: mastro, quadro e lâmpadas voltados para o centro do campo; devolve (estrutura, lâmpadas, direção)"""
    est, lamp = Malha(), Malha()
    est.cyl(CONCRETO_CLARO, 0.0, 0.0, 0.0, 0.5, h, 10, r_top=0.28)
    quadro = Malha()
    qw, qh = cols * larg + 0.3, fil * larg + 0.3
    quadro.caixa(PRETO_FOSCO, -qw / 2, qw / 2, -qh / 2, qh / 2, -0.35, -0.05, '+x-x+y-y-z+z')
    lm = Malha()
    for i in range(cols):
        for j in range(fil):
            x = -qw / 2 + 0.3 + larg * i
            y = -qh / 2 + 0.3 + larg * j
            lm.caixa(LAMPADA, x - 0.28, x + 0.28, y - 0.28, y + 0.28, -0.05, 0.05, '+z')
    ang = math.atan2(alvo[0] - ex, alvo[1] - ez)
    M = T(0, h + qh / 2 - 0.2, 0.0) @ Ry(ang)
    est.add(quadro, M)
    lamp.add(lm, M)
    dxz = (math.sin(ang), math.cos(ang))
    return est, lamp, (dxz, h + qh / 2 - 0.2)


# ---------------------------------------------------------------- arquibancadas
def arquibancada(comp, comp_cobertura, D=15.5, N=14, d=0.85, subida=0.56, v0=1.0, h_frente=1.3, h_cob=13.2, portoes=(), letreiro=None):
    """arquibancada de `comp` m ao longo de u (centrada em 0), com a frente voltada para o campo em v = 0 e o fundo em v = D.
    Devolve Malhas por material; v e u são coordenadas locais (x = u, z = v)."""
    G = CH
    yf = G + h_frente
    pts = [(0.0, G), (0.0, yf), (v0, yf)]
    y = yf
    for i in range(N):
        vi = v0 + i * d
        y += subida
        pts += [(vi, y), (vi + d, y)]
    y_topo = y
    vfim = v0 + N * d
    pts += [(D, y_topo), (D, G)]
    hl = comp / 2
    out = {k: Malha() for k in ('Degraus', 'Espelhos', 'AssentosAzuis', 'AssentosBrancos', 'Fachada', 'Cobertura', 'Estrutura', 'Portoes')}
    P = lambda u, v, yy: (u, yy, v)
    for (va, ya), (vb, yb) in zip(pts, pts[1:] + pts[:1]):
        if abs(ya - yb) < 1e-9 and abs(va - vb) > 1e-9 and ya > G + 1e-6:
            out['Degraus'].quad(DEGRAU, P(-hl, va, ya), P(hl, va, ya), P(hl, vb, ya), P(-hl, vb, ya), (0, 1, 0))
        elif abs(va - vb) < 1e-9 and abs(ya - yb) > 1e-9:
            frente = (vb == va) and (yb > ya) and va < D - 1e-9
            if va >= D - 1e-9:
                out['Fachada'].quad(PAREDE_CONCRETO, P(-hl, va, ya), P(hl, va, ya), P(hl, va, yb), P(-hl, va, yb), (0, 0, 1))
            elif yb > ya:
                out['Espelhos'].quad(ESPELHO if va > 0 else AZUL_VIVO, P(-hl, va, ya), P(hl, va, ya), P(hl, va, yb), P(-hl, va, yb), (0, 0, -1))
    # faixa branca de publicidade no alto do muro da frente
    out['Espelhos'].quad(BRANCO_PURO, P(-hl, -0.01, yf - 0.55), P(hl, -0.01, yf - 0.55), P(hl, -0.01, yf - 0.2), P(-hl, -0.01, yf - 0.2), (0, 0, -1))
    # tampas laterais (a escada em corte), polígono côncavo triangulado
    pl = [(v, yy) for v, yy in pts]
    for s in (-1, 1):
        for i0, i1, i2 in triangular(pl):
            a, b, c = pl[i0], pl[i1], pl[i2]
            out['Degraus'].poly(DEGRAU, [(s * hl, a[1], a[0]), (s * hl, b[1], b[0]), (s * hl, c[1], c[0])], (s, 0, 0))
    # assentos: blocos de 40 cm na frente de cada degrau, em trechos alternados de azul e branco (diagonais)
    seg = 8.0
    for i in range(N):
        vi = v0 + i * d
        yy = yf + (i + 1) * subida
        off = i * 2.3                                                       # desloca o padrão a cada fila: listras na diagonal
        u = -hl
        while u < hl - 1e-6:
            k = int((u + hl + off) // seg)
            fim = min(hl, -hl + (k + 1) * seg - off)
            if fim <= u + 1e-6:
                fim = min(hl, u + seg)
            alvo = out['AssentosAzuis'] if k % 2 == 0 else out['AssentosBrancos']
            mat = ASSENTO_AZ if k % 2 == 0 else ASSENTO_BR
            alvo.quad(mat, P(u, vi + 0.12, yy + 0.42), P(fim, vi + 0.12, yy + 0.42), P(fim, vi + 0.55, yy + 0.42), P(u, vi + 0.55, yy + 0.42), (0, 1, 0))
            alvo.quad(mat, P(u, vi + 0.12, yy), P(fim, vi + 0.12, yy), P(fim, vi + 0.12, yy + 0.42), P(u, vi + 0.12, yy + 0.42), (0, 0, -1))
            u = fim
    # parede dos fundos até a cobertura, nervuras e portões
    out['Fachada'].caixa(PAREDE_CONCRETO, -hl, hl, y_topo, h_cob, D - 0.4, D, '+x-x+z-z')
    nerv = int(comp / 3.0)
    for k in range(nerv + 1):
        u = -hl + 0.2 + k * (comp - 0.4) / nerv
        if any(abs(u - g) < 2.6 for g in portoes):
            continue
        out['Estrutura'].caixa(PAREDE_CONCRETO, u - 0.18, u + 0.18, G, h_cob, D, D + 0.14, '+z+x-x')
    for g in portoes:
        out['Portoes'].caixa(PRETO_FOSCO, g - 2.0, g + 2.0, G, G + 3.6, D, D + 0.16, '+z')
        out['Estrutura'].caixa(PAREDE_CONCRETO, g - 2.35, g + 2.35, G + 3.6, G + 4.1, D, D + 0.2, '+x-x+y+z-y')
    out['Fachada'].caixa(FAIXA_AZUL, -hl, hl, h_cob - 1.4, h_cob - 0.4, D, D + 0.12, '+z+x-x')
    # cobertura (cantiléver sobre as filas altas) com franja azul e escoras
    hc = comp_cobertura / 2
    out['Cobertura'].caixa(COBERTURA, -hc, hc, h_cob, h_cob + 0.5, 3.0, D + 0.3, '+x-x+y+z-z', {'+y': COBERTURA})
    out['Cobertura'].quad(FUNDO_COBERTURA, P(-hc, 3.0, h_cob), P(hc, 3.0, h_cob), P(hc, D + 0.3, h_cob), P(-hc, D + 0.3, h_cob), (0, -1, 0))
    out['Cobertura'].caixa(FAIXA_AZUL, -hc, hc, h_cob + 0.1, h_cob + 0.5, 2.9, 3.0, '+z+x-x')
    ne = int(comp / 6.0)
    for k in range(ne + 1):
        u = -hl + 0.3 + k * (comp - 0.6) / ne
        out['Estrutura'].tubo(METAL_ESCURO, (u, h_cob - 4.6, D - 0.4), (u, h_cob, 8.2), 0.14, 0.14, 8)
    return out, y_topo, letreiro


def montar_arquibancadas(o, hx_campo, hz_campo, c=100.0, l=64.0):
    """quatro arquibancadas em volta do campo; devolve a cobertura e a altura do topo (para os refletores)"""
    fx, fz = 56.0, 38.0                                                    # frente das arquibancadas
    Lc, Lk = 144.0, 76.0                                                   # compr. das longas (norte, sul) e das curtas (leste, oeste)
    configs = [
        (Lc, Lc, (0, fz), 0.0, (-30.0, 0.0, 30.0)),                        # sul
        (Lc, Lc, (0, -fz), math.pi, (-30.0, 0.0, 30.0)),                   # norte
        (Lk, Lk + 6.0, (fx, 0), math.pi / 2, (0.0,)),                      # leste
        (Lk, Lk + 6.0, (-fx, 0), -math.pi / 2, (0.0,)),                    # oeste
    ]
    topo = None
    for comp, comp_cob, (tx, tz), ang, portoes in configs:
        parte, y_topo, _ = arquibancada(comp, comp_cob, portoes=portoes)
        topo = y_topo
        M = T(tx, 0, tz) @ Ry(ang)
        for nome, m in parte.items():
            o.setdefault(nome, Malha()).add(m, M)
    return topo


# ---------------------------------------------------------------- estádio
def estadio():
    o = {}
    # campo: faixas de corte alternadas, pista de concreto em volta e marcações
    g1, g2, pista, lin = Malha(), Malha(), Malha(), Malha()
    nf = 12
    w = 106.0 / nf
    for i in range(nf):
        (g1 if i % 2 == 0 else g2).top(GRAMA_B if i % 2 == 0 else GRAMA_C, -53 + i * w, -53 + (i + 1) * w, -35, 35, CH)
    pista.top(PISTA, -56, 56, -38, -35, CH); pista.top(PISTA, -56, 56, 35, 38, CH)
    pista.top(PISTA, -56, -53, -35, 35, CH); pista.top(PISTA, 53, 56, -35, 35, CH)
    linhas_campo(lin)
    o['GramadoClaro'], o['GramadoEscuro'], o['Pista'], o['Linhas'] = g1, g2, pista, lin
    # traves, redes e bandeirinhas
    tv, rd, bd = Malha(), Malha(), Malha()
    for s in (-1, 1):
        q, r = trave()
        M = T(s * 50.0, CH, 0.0) @ Ry(-math.pi / 2 if s > 0 else math.pi / 2)
        tv.add(q, M); rd.add(r, M)
    for sx in (-1, 1):
        for sz in (-1, 1):
            bandeirinha(bd, sx * 50.0, sz * 32.0)
    o['Traves'], o['Redes'], o['Bandeirinhas'] = tv, rd, bd
    topo = montar_arquibancadas(o, 53, 35)
    # letreiro na fachada sul e placar sobre a cobertura leste
    ob = _LetreiroEstadio()
    o['Letreiro'], o['Placar'] = ob.m, ob.det
    # refletores nos quatro cantos, sobre a cobertura
    luzes = []
    for sx in (-1, 1):
        for sz in (-1, 1):
            ex, ez = sx * 69.0, sz * 51.0
            est, lamp, (dxz, ytopo) = refletor(24.0, ex, ez)
            o.setdefault('Torres', Malha()).add(est, T(ex, 13.7, ez))
            o.setdefault('Luz', Malha()).add(lamp, T(ex, 13.7, ez))
            luzes.append({'pos': [ex + dxz[0] * 0.6, round(13.7 + ytopo, 2), ez + dxz[1] * 0.6], 'dir': [round(-sx * 0.55, 3), -0.6, round(-sz * 0.4, 3)], 'cor': '#fff6e0', 'alcance': 90})
    return [(k, m) for k, m in o.items() if m.n_tris], {'pegada': [144.0, 108.0], 'tile': 144.0, 'luzes': luzes}


class _LetreiroEstadio:
    """placas com textura do estádio: ESTÁDIO HRYZ nas fachadas norte e sul e o placar sobre a cobertura leste (voltado para o campo)"""

    def __init__(self):
        from edificio import Obra
        o = Obra(1)
        S = (-72.0, 72.0, -53.5, 53.5)
        for face in ('+z', '-z'):
            o.letreiro(letreiros.placa_estadio(), face, S, 0.0, 6.5, 26.0, 4.06, d=0.3, chapa=False)
        o.n['Detalhes'].caixa(PRETO_FOSCO, 59.2, 59.8, 13.7, 19.9, -7.7, 7.7, '+x-x+y+z-z')
        o.letreiro(letreiros.placar(), '-x', (59.2, 59.8, -7.5, 7.5), 0.0, 14.1, 15.0, 5.625, d=0.03, chapa=False)
        self.m = o.n['Letreiro']
        self.det = o.n['Detalhes']


# ---------------------------------------------------------------- campo de várzea (72 x 48 m)
def campo_varzea():
    o = {}
    g1, g2, terra, lin = Malha(), Malha(), Malha(), Malha()
    nf = 8
    w = 72.0 / nf
    for i in range(nf):
        (g1 if i % 2 == 0 else g2).top(GRAMA_A if i % 2 == 0 else GRAMA_C, -36 + i * w, -36 + (i + 1) * w, -24, 24, CH)
    # manchas de terra batida: áreas dos gols, centro e meio de campo
    for s in (-1, 1):
        terra.poly(TERRA_BATIDA, [(s * 29.0 + 3.4 * math.cos(2 * math.pi * i / 16), CH + 0.004, 4.0 * math.sin(2 * math.pi * i / 16)) for i in range(16)], (0, 1, 0))
    terra.poly(TERRA_BATIDA, [(3.0 * math.cos(2 * math.pi * i / 16), CH + 0.004, 3.0 * math.sin(2 * math.pi * i / 16)) for i in range(16)], (0, 1, 0))
    linhas_campo(lin, c=64.0, l=40.0, pen=(11.0, 26.0), gol=(4.0, 12.0), raio=6.0, pen_ponto=8.0)
    o['GramadoClaro'], o['GramadoEscuro'], o['Terra'], o['Linhas'] = g1, g2, terra, lin
    tv, rd, bd = Malha(), Malha(), Malha()
    for s in (-1, 1):
        q, r = trave(5.0, 2.1, 1.6)
        M = T(s * 32.0, CH, 0.0) @ Ry(-math.pi / 2 if s > 0 else math.pi / 2)
        tv.add(q, M); rd.add(r, M)
    for sx in (-1, 1):
        for sz in (-1, 1):
            bandeirinha(bd, sx * 32.0, sz * 20.0)
    o['Traves'], o['Redes'], o['Bandeirinhas'] = tv, rd, bd
    # bancos de reservas e quatro postes de luz nos cantos do campo
    bc, post, luz = Malha(), Malha(), Malha()
    for sz in (-1, 1):
        bc.caixa(MADEIRA, -3.0, 3.0, CH + 0.4, CH + 0.46, sz * 22.4 - 0.3, sz * 22.4 + 0.3, '+x-x+y+z-z-y')
        bc.caixa(MADEIRA, -3.0, 3.0, CH + 0.4, CH + 1.0, sz * 22.7 - 0.03, sz * 22.7 + 0.03, '+x-x+y+z-z')
        for x in (-2.8, 0.0, 2.8):
            bc.caixa(METAL_ESCURO, x - 0.04, x + 0.04, CH, CH + 0.4, sz * 22.4 - 0.04, sz * 22.4 + 0.04, '+x-x+z-z')
    luzes = []
    for sx in (-1, 1):
        for sz in (-1, 1):
            x, z = sx * 33.5, sz * 22.0
            post.cyl(POSTE, x, CH, z, 0.2, 11.0, 10, r_top=0.13)
            ang = math.atan2(-x, -z)
            quadro = Malha()
            quadro.caixa(PRETO_FOSCO, -1.1, 1.1, -0.45, 0.45, -0.3, -0.05, '+x-x+y-y-z+z')
            lm = Malha()
            for i in range(3):
                for j in range(2):
                    lm.caixa(LAMPADA, -0.9 + i * 0.75, -0.9 + i * 0.75 + 0.5, -0.38 + j * 0.45, -0.38 + j * 0.45 + 0.35, -0.05, 0.04, '+z')
            M = T(x, CH + 11.0, z) @ Ry(ang)
            post.add(quadro, M); luz.add(lm, M)
            luzes.append({'pos': [round(x - sx * 0.3, 2), CH + 10.9, round(z - sz * 0.3, 2)], 'dir': [0, -1, 0], 'cor': '#fff6e0', 'alcance': 40})
    o['Bancos'], o['Postes'], o['Luz'] = bc, post, luz
    return [(k, m) for k, m in o.items() if m.n_tris], {'pegada': [72.0, 48.0], 'tile': 72.0, 'luzes': luzes}


PECAS = {
    'estadio-futebol': (estadio, 'Estádio de futebol de 144 x 108 m: campo 100 x 64 m com marcações e traves, quatro arquibancadas cobertas, quatro torres de refletores, placar e letreiro ESTÁDIO HRYZ'),
    'campo-futebol': (campo_varzea, 'Campo de várzea de 72 x 48 m (campo 64 x 40 m): gramado listrado, terra batida nos gols, traves com rede, bancos e quatro postes de luz'),
}
EX = {'tipo': 'ladrilho-grande', 'origem': 'centro do campo, y = 0 (o chão fica em y = 0,15, como as calçadas)', 'comprimento_do_campo': 'ao longo de X'}
