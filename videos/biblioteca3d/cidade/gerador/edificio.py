"""Ferramentas para montar casas e edifícios: paredes, telhados, janelas com vidro que acende à noite, portas, sacadas e letreiros.

Coordenadas locais: origem no centro da pegada, no chão (y = 0); a frente é +Z. Sobre a grama ou a calçada do kit, coloque o
edifício em y = 0,15. As faces se chamam '+z' (frente), '-z' (fundos), '+x' e '-x'; uma "caixa" c = (x0, x1, z0, z1) é o retângulo
da parede onde a janela vai, e `u` mede a posição ao longo da face, a partir do meio dela.

Nós do arquivo: Paredes, Telhado, Molduras, Vidro (janelas apagadas), VidroLuz (janelas que acendem à noite: veja kit.luzEstado),
Portas, Detalhes, Letreiro (placas com textura, também acendem à noite) e Luz (lâmpadas)."""
import math
import random
import numpy as np
from glb import Material
from malha import Malha, T, Ry, V
from paleta import *

TH = {'+z': 0.0, '-z': math.pi, '+x': math.pi / 2, '-x': -math.pi / 2}


def ancora(face, c):
    x0, x1, z0, z1 = c
    return {'+z': ((x0 + x1) / 2, z1), '-z': ((x0 + x1) / 2, z0), '+x': (x1, (z0 + z1) / 2), '-x': (x0, (z0 + z1) / 2)}[face]


def matriz(face, c, u, y, d=0.0):
    """leva as coordenadas locais da face (x = ao longo, y = altura, z = para fora) ao mundo"""
    ax, az = ancora(face, c)
    th = TH[face]
    t = (math.cos(th), -math.sin(th))
    n = (math.sin(th), math.cos(th))
    return T(ax + t[0] * u + n[0] * d, y, az + t[1] * u + n[1] * d) @ Ry(th)


def larg_face(face, c):
    return (c[1] - c[0]) if face in ('+z', '-z') else (c[3] - c[2])


class Obra:
    NOS = ('Paredes', 'Telhado', 'Molduras', 'Vidro', 'VidroLuz', 'Portas', 'Detalhes', 'Letreiro', 'Luz')

    def __init__(self, semente=1, p_luz=0.45):
        self.n = {k: Malha() for k in self.NOS}
        self.rng = random.Random(semente)
        self.p_luz = p_luz
        self._proto = {}
        self._letreiros = {}
        self.luzes = []

    def nos(self):
        return [(k, m) for k, m in self.n.items() if m.n_tris]

    # ------------------------------------------------------------ volumes
    def caixa(self, mat, x0, x1, y0, y1, z0, z1, no='Paredes', faces='+x-x+y+z-z', mats=None):
        self.n[no].caixa(mat, x0, x1, y0, y1, z0, z1, faces, mats)

    def cilindro(self, mat, x, y, z, r, h, segs=14, no='Detalhes', r_top=None, caps=True):
        self.n[no].cyl(mat, x, y, z, r, h, segs, r_top=r_top, caps=caps)

    def tubo(self, mat, p0, p1, r, segs=8, no='Detalhes', r1=None):
        self.n[no].tubo(mat, p0, p1, r, r1, segs)

    def lampada(self, x, y, z, r=0.07, mat=None):
        self.n['Luz'].ico(mat or LAMPADA, (x, y, z), r, 0)

    # ------------------------------------------------------------ janelas e portas
    def _janela_proto(self, w, h, borda, prof, recuo, trav, mold):
        key = ('j', w, h, borda, prof, recuo, trav, id(mold))
        if key in self._proto:
            return self._proto[key]
        m = Malha()
        x0, x1 = -w / 2, w / 2
        for a, b, c, d in ((x0, x0 + borda, 0, h), (x1 - borda, x1, 0, h), (x0 + borda, x1 - borda, h - borda, h), (x0 + borda, x1 - borda, 0, borda)):
            m.quad(mold, (a, c, prof), (b, c, prof), (b, d, prof), (a, d, prof), (0, 0, 1))
        xl, xr, yb, yt = x0 + borda, x1 - borda, borda, h - borda
        m.quad(mold, (xl, yb, recuo), (xl, yb, prof), (xl, yt, prof), (xl, yt, recuo), (1, 0, 0))
        m.quad(mold, (xr, yb, recuo), (xr, yb, prof), (xr, yt, prof), (xr, yt, recuo), (-1, 0, 0))
        m.quad(mold, (xl, yb, recuo), (xr, yb, recuo), (xr, yb, prof), (xl, yb, prof), (0, 1, 0))
        m.quad(mold, (xl, yt, recuo), (xr, yt, recuo), (xr, yt, prof), (xl, yt, prof), (0, -1, 0))
        if trav:
            m.caixa(mold, -0.016, 0.016, yb, yt, recuo, prof - 0.012, '+z+x-x')
            if h > 1.05:
                ym = yb + (yt - yb) * 0.58
                m.caixa(mold, xl, xr, ym - 0.016, ym + 0.016, recuo, prof - 0.012, '+z+y-y')
        self._proto[key] = m
        return m

    def _vidro_proto(self, w, h, borda, recuo, mat):
        key = ('v', w, h, borda, recuo, id(mat))
        if key not in self._proto:
            v = Malha()
            v.quad(mat, (-w / 2 + borda, borda, recuo), (w / 2 - borda, borda, recuo), (w / 2 - borda, h - borda, recuo), (-w / 2 + borda, h - borda, recuo), (0, 0, 1))
            self._proto[key] = v
        return self._proto[key]

    def janela(self, face, c, u, y, w, h, acesa=None, escura=False, mold=MOLDURA_BRANCA, borda=0.07, prof=0.07, recuo=0.02, trav=True, peitoril=False):
        """janela de w x h com a base em `y`, centrada em `u`. `acesa=None` sorteia (p_luz) se acende à noite."""
        if acesa is None:
            acesa = self.rng.random() < self.p_luz
        vidro = (VIDRO_ESCURO_LUZ if acesa else VIDRO_ESCURO) if escura else (VIDRO_LUZ if acesa else VIDRO)
        M = matriz(face, c, u, y)
        self.n['Molduras'].add(self._janela_proto(w, h, borda, prof, recuo, trav, mold), M)
        self.n['VidroLuz' if acesa else 'Vidro'].add(self._vidro_proto(w, h, borda, recuo, vidro), M)
        if peitoril:
            p = Malha()
            p.caixa(MOLDURA_BRANCA, -w / 2 - 0.06, w / 2 + 0.06, -0.05, 0.015, 0.0, prof + 0.07, '+x-x+y+z-z')
            self.n['Molduras'].add(p, M)

    def janelas(self, face, c, ys, us, w, h, **kw):
        """grade de janelas: uma por (u, y) das listas"""
        for y in ys:
            for u in us:
                self.janela(face, c, u, y, w, h, **kw)

    def painel_vidro(self, face, c, u, y, w, h, acesa=None, escura=True, recuo=0.03):
        """painel de vidro liso (fachada de vidro), sem moldura"""
        if acesa is None:
            acesa = self.rng.random() < self.p_luz
        vidro = (VIDRO_ESCURO_LUZ if acesa else VIDRO_ESCURO) if escura else (VIDRO_LUZ if acesa else VIDRO)
        v = Malha()
        v.quad(vidro, (-w / 2, 0, recuo), (w / 2, 0, recuo), (w / 2, h, recuo), (-w / 2, h, recuo), (0, 0, 1))
        self.n['VidroLuz' if acesa else 'Vidro'].add(v, matriz(face, c, u, y))

    def porta(self, face, c, u, w, h, y=0.0, mat=MADEIRA_ESCURA, mold=MOLDURA_BRANCA, vidro=False, acesa=False, prof=0.09, trav=True):
        borda = 0.09
        m, p, d = Malha(), Malha(), Malha()
        x0, x1 = -w / 2, w / 2
        for a, b, c_, d_ in ((x0, x0 + borda, 0, h), (x1 - borda, x1, 0, h), (x0 + borda, x1 - borda, h - borda, h)):
            m.quad(mold, (a, c_, prof), (b, c_, prof), (b, d_, prof), (a, d_, prof), (0, 0, 1))
        xl, xr, yt = x0 + borda, x1 - borda, h - borda
        m.quad(mold, (xl, 0, 0.03), (xl, 0, prof), (xl, yt, prof), (xl, yt, 0.03), (1, 0, 0))
        m.quad(mold, (xr, 0, 0.03), (xr, 0, prof), (xr, yt, prof), (xr, yt, 0.03), (-1, 0, 0))
        m.quad(mold, (xl, yt, 0.03), (xr, yt, 0.03), (xr, yt, prof), (xl, yt, prof), (0, -1, 0))
        M = matriz(face, c, u, y)
        self.n['Molduras'].add(m, M)
        if vidro:
            v = Malha()
            mv = VIDRO_ESCURO_LUZ if acesa else VIDRO_ESCURO
            v.quad(mv, (xl, 0, 0.03), (xr, 0, 0.03), (xr, yt, 0.03), (xl, yt, 0.03), (0, 0, 1))
            self.n['VidroLuz' if acesa else 'Vidro'].add(v, M)
            if trav:
                t = Malha()
                t.caixa(MOLDURA_ESCURA, -0.025, 0.025, 0, yt, 0.03, prof - 0.012, '+z+x-x')
                t.caixa(MOLDURA_ESCURA, xl, xr, 0.95, 1.0, 0.03, prof - 0.012, '+z+y-y')
                self.n['Molduras'].add(t, M)
        else:
            f = Malha()
            f.quad(mat, (xl, 0, 0.04), (xr, 0, 0.04), (xr, yt, 0.04), (xl, yt, 0.04), (0, 0, 1))
            self.n['Portas'].add(f, M)
        d.caixa(METAL, xr - 0.16, xr - 0.1, h * 0.46, h * 0.46 + 0.14, 0.04, 0.12, '+x-x+y+z-z')
        self.n['Detalhes'].add(d, M)

    def degraus(self, face, c, u, w, n=3, prof=0.32, mat=CONCRETO_CLARO, y_topo=0.38, z0=0.0):
        """escada na frente da face, de n degraus de altura igual até y_topo (o último é o piso); o degrau de baixo é o mais largo"""
        for j in range(1, n):
            h = y_topo * j / n
            d = prof * (n - j)
            m = Malha()
            m.caixa(mat, -w / 2 - 0.08 * (n - j), w / 2 + 0.08 * (n - j), 0.0, h, z0, z0 + d + 0.05, '+x-x+y+z')
            self.n['Detalhes'].add(m, matriz(face, c, u, 0.0))

    def alpendre(self, face, c, u, w, prof, y_piso=0.38, y_teto=2.7, n_degraus=3, mat_piso=CONCRETO_CLARO, mat_coluna=BRANCO_PURO, mat_teto=LAJE, esp_teto=0.14):
        """varanda de entrada: piso na altura da casa, cobertura apoiada em duas colunas e escada na frente"""
        m = Malha()
        m.caixa(mat_piso, -w / 2, w / 2, 0.0, y_piso, 0.0, prof, '+x-x+y+z')
        m.caixa(mat_teto, -w / 2 - 0.1, w / 2 + 0.1, y_teto, y_teto + esp_teto, 0.0, prof + 0.15, '+x-x+y+z-z-y')
        for sx in (-1, 1):
            m.cyl(mat_coluna, sx * (w / 2 - 0.2), y_piso, prof - 0.2, 0.1, y_teto - y_piso, 10, caps=False)
        self.n['Detalhes'].add(m, matriz(face, c, u, 0.0))
        self.degraus(face, c, u, max(0.8, w - 0.6), n_degraus, y_topo=y_piso, z0=prof)

    def sacada(self, face, c, u, y, w, prof=1.2, alt=1.0, laje=LAJE, grade=MOLDURA_BRANCA, vidro=True):
        """sacada com laje e guarda-corpo (vidro ou barras) sobre a laje, saindo da parede em y"""
        m, g, v = Malha(), Malha(), Malha()
        m.caixa(laje, -w / 2, w / 2, y - 0.16, y, 0.0, prof, '+x-x+y+z-z-y')
        g.caixa(grade, -w / 2, w / 2, y + alt - 0.05, y + alt, prof - 0.06, prof, '+x-x+y+z-z-y')
        for sx in (-1, 1):
            xa = sx * (w / 2 - 0.03)
            g.caixa(grade, xa - 0.03, xa + 0.03, y, y + alt, prof - 0.06, prof, '+x-x+z-z')
            g.caixa(grade, xa - 0.025, xa + 0.025, y + alt - 0.05, y + alt, 0.0, prof - 0.06, '+x-x+y+z-z')
        zf = prof - 0.03
        if vidro:
            v.quad(VIDRO, (-w / 2 + 0.06, y + 0.05, zf), (w / 2 - 0.06, y + 0.05, zf), (w / 2 - 0.06, y + alt - 0.06, zf), (-w / 2 + 0.06, y + alt - 0.06, zf), (0, 0, 1))
            v.quad(VIDRO, (-w / 2 + 0.06, y + 0.05, zf), (-w / 2 + 0.06, y + alt - 0.06, zf), (w / 2 - 0.06, y + alt - 0.06, zf), (w / 2 - 0.06, y + 0.05, zf), (0, 0, -1))
            for sx in (-1, 1):
                xs = sx * (w / 2 - 0.03)
                v.quad(VIDRO, (xs, y + 0.05, 0.05), (xs, y + 0.05, prof - 0.07), (xs, y + alt - 0.06, prof - 0.07), (xs, y + alt - 0.06, 0.05), (sx, 0, 0))
                v.quad(VIDRO, (xs, y + 0.05, 0.05), (xs, y + alt - 0.06, 0.05), (xs, y + alt - 0.06, prof - 0.07), (xs, y + 0.05, prof - 0.07), (-sx, 0, 0))
        else:
            for k in range(int((w - 0.2) / 0.12) + 1):
                x = -w / 2 + 0.1 + k * 0.12
                g.caixa(grade, x - 0.012, x + 0.012, y, y + alt - 0.05, prof - 0.045, prof - 0.02)
        M = matriz(face, c, u, 0.0)
        self.n['Paredes'].add(m, M)
        self.n['Molduras'].add(g, M)
        self.n['Vidro'].add(v, M)

    def letreiro(self, png, face, c, u, y, w, h, d=0.12, moldura=MOLDURA_ESCURA, borda=0.07, chapa=True):
        """placa com textura (PNG) presa à parede; também acende à noite. A chapa de fundo avança até d - 1 cm."""
        mat = self._letreiros.get(id(png))
        if mat is None:
            mat = Material(f'Letreiro{len(self._letreiros)}', '#ffffff', rough=0.5, texture=png)
            self._letreiros[id(png)] = mat
        q = Malha()
        q.quad(mat, (-w / 2, 0, d), (w / 2, 0, d), (w / 2, h, d), (-w / 2, h, d), (0, 0, 1), uvs=[(0, 1), (1, 1), (1, 0), (0, 0)])
        M = matriz(face, c, u, y)
        self.n['Letreiro'].add(q, M)
        if chapa:
            p = Malha()
            p.caixa(moldura, -w / 2 - borda, w / 2 + borda, -borda, h + borda, 0.0, d - 0.01, '+x-x+y-y+z')
            self.n['Detalhes'].add(p, M)

    def plano_letreiro(self, png, x, y, z, w, d):
        """textura deitada (helipoliporto, faixa no chão): retângulo w (ao longo de X) x d (ao longo de Z) em y, lido de quem olha de +Z"""
        mat = self._letreiros.get(id(png))
        if mat is None:
            mat = Material(f'Letreiro{len(self._letreiros)}', '#ffffff', rough=0.6, texture=png)
            self._letreiros[id(png)] = mat
        q = Malha()
        q.quad(mat, (x - w / 2, y, z + d / 2), (x + w / 2, y, z + d / 2), (x + w / 2, y, z - d / 2), (x - w / 2, y, z - d / 2), (0, 1, 0), uvs=[(0, 1), (1, 1), (1, 0), (0, 0)])
        self.n['Letreiro'].add(q)

    def bandeira(self, x, y, z, altura=7.0, cor='#1b4fa3', larg=1.6, alt=1.0):
        """mastro com uma flâmula lisa de dupla face (sem símbolos)"""
        self.tubo(METAL, (x, y, z), (x, y + altura, z), 0.05, 8, r1=0.035)
        self.n['Detalhes'].esfera(METAL, (x, y + altura + 0.06, z), 0.07, 8, 4)
        mat = Material('Bandeira_' + cor.lstrip('#'), cor, rough=0.8, double_sided=True)
        self.n['Detalhes'].quad(mat, (x, y + altura - alt - 0.2, z), (x + larg, y + altura - alt - 0.12, z), (x + larg, y + altura - 0.12, z), (x, y + altura - 0.2, z), (0, 0, 1))

    # ------------------------------------------------------------ telhados
    def telhado_duas_aguas(self, c, y, altura, beiral=0.5, eixo='x', mat=TELHA, mat_oitao=None):
        """telhado de duas águas sobre a caixa c, com a base das paredes em y e a cumeeira `altura` acima.
        eixo 'x': cumeeira ao longo de X (as águas caem para +Z e -Z); eixo 'z': cumeeira ao longo de Z (frontão para +Z)"""
        x0, x1, z0, z1 = c
        b = beiral
        mat_oitao = mat_oitao or PAREDE_BRANCA
        if eixo == 'z':
            # gira os papéis de x e z
            hd = (x1 - x0) / 2
            xc = (x0 + x1) / 2
            ye = y - b * altura / hd
            a0, a1 = z0 - b, z1 + b
            L, R = x0 - b, x1 + b
            R_y = y + altura
            esq = [(L, ye, a0), (L, ye, a1), (xc, R_y, a1), (xc, R_y, a0)]
            dire = [(R, ye, a0), (R, ye, a1), (xc, R_y, a1), (xc, R_y, a0)]
            self.n['Telhado'].poly(mat, esq, (0, 1, 0))
            self.n['Telhado'].poly(mat, dire, (0, 1, 0))
            self.n['Telhado'].quad(mat, (L, ye, a0), (R, ye, a0), (R, ye, a1), (L, ye, a1), (0, -1, 0))
            self.n['Telhado'].poly(mat_oitao, [(L, ye, a1), (R, ye, a1), (xc, R_y, a1)], (0, 0, 1))
            self.n['Telhado'].poly(mat_oitao, [(L, ye, a0), (R, ye, a0), (xc, R_y, a0)], (0, 0, -1))
        else:
            hd = (z1 - z0) / 2
            zc = (z0 + z1) / 2
            ye = y - b * altura / hd
            a0, a1 = x0 - b, x1 + b
            F, B = z1 + b, z0 - b
            R_y = y + altura
            fr = [(a0, ye, F), (a1, ye, F), (a1, R_y, zc), (a0, R_y, zc)]
            tr = [(a0, ye, B), (a1, ye, B), (a1, R_y, zc), (a0, R_y, zc)]
            self.n['Telhado'].poly(mat, fr, (0, 1, 0))
            self.n['Telhado'].poly(mat, tr, (0, 1, 0))
            self.n['Telhado'].quad(mat, (a0, ye, B), (a1, ye, B), (a1, ye, F), (a0, ye, F), (0, -1, 0))
            self.n['Telhado'].poly(mat_oitao, [(a1, ye, B), (a1, ye, F), (a1, R_y, zc)], (1, 0, 0))
            self.n['Telhado'].poly(mat_oitao, [(a0, ye, B), (a0, ye, F), (a0, R_y, zc)], (-1, 0, 0))

    def telhado_quatro_aguas(self, c, y, altura, beiral=0.5, mat=TELHA):
        """telhado de quatro águas: o mesmo declive nos quatro lados, com a cumeeira ao longo do lado maior"""
        x0, x1, z0, z1 = c
        b = beiral
        hx, hz = (x1 - x0) / 2 + b, (z1 - z0) / 2 + b
        xc, zc = (x0 + x1) / 2, (z0 + z1) / 2
        hd = min(hx, hz) - b
        ye = y - b * altura / hd
        rise = (min(hx, hz)) * altura / hd
        yr = ye + rise
        if hx >= hz:
            rl = hx - hz
            R = [(xc - rl, yr, zc), (xc + rl, yr, zc)]
            pts = {'f': [(xc - hx, ye, zc + hz), (xc + hx, ye, zc + hz), R[1], R[0]], 't': [(xc - hx, ye, zc - hz), (xc + hx, ye, zc - hz), R[1], R[0]],
                   'e': [(xc - hx, ye, zc - hz), (xc - hx, ye, zc + hz), R[0]], 'd': [(xc + hx, ye, zc - hz), (xc + hx, ye, zc + hz), R[1]]}
        else:
            rl = hz - hx
            R = [(xc, yr, zc - rl), (xc, yr, zc + rl)]
            pts = {'f': [(xc - hx, ye, zc + hz), (xc + hx, ye, zc + hz), R[1]], 't': [(xc - hx, ye, zc - hz), (xc + hx, ye, zc - hz), R[0]],
                   'e': [(xc - hx, ye, zc - hz), (xc - hx, ye, zc + hz), R[1], R[0]], 'd': [(xc + hx, ye, zc - hz), (xc + hx, ye, zc + hz), R[1], R[0]]}
        for k in pts.values():
            self.n['Telhado'].poly(mat, k, (0, 1, 0))
        self.n['Telhado'].quad(mat, (xc - hx, ye, zc - hz), (xc + hx, ye, zc - hz), (xc + hx, ye, zc + hz), (xc - hx, ye, zc + hz), (0, -1, 0))

    def laje_plana(self, c, y, mat=LAJE, platibanda=0.9, esp=0.25, mat_platibanda=None, avanco=0.0):
        """cobertura plana com platibanda (muretinha) em volta; `avanco` projeta a laje além das paredes"""
        x0, x1, z0, z1 = c
        x0, x1, z0, z1 = x0 - avanco, x1 + avanco, z0 - avanco, z1 + avanco
        mp = mat_platibanda or mat
        self.n['Telhado'].caixa(mat, x0, x1, y, y + esp, z0, z1, '+x-x+y+z-z-y')
        if platibanda > 0:
            t = 0.22
            yy = y + esp
            self.n['Telhado'].caixa(mp, x0, x1, yy, yy + platibanda, z1 - t, z1)
            self.n['Telhado'].caixa(mp, x0, x1, yy, yy + platibanda, z0, z0 + t)
            self.n['Telhado'].caixa(mp, x0, x0 + t, yy, yy + platibanda, z0 + t, z1 - t, faces='+x-x+y')
            self.n['Telhado'].caixa(mp, x1 - t, x1, yy, yy + platibanda, z0 + t, z1 - t, faces='+x-x+y')

    # ------------------------------------------------------------ detalhes de cobertura e entrada
    def caixa_dagua(self, x, y, z, r=1.1, h=1.5):
        self.cilindro(METAL, x, y + 0.6, z, r, h, 16, 'Detalhes')
        self.cilindro(METAL_ESCURO, x, y + 0.6 + h, z, r * 1.05, 0.12, 16, 'Detalhes')
        for sx in (-1, 1):
            for sz in (-1, 1):
                self.caixa(METAL_ESCURO, x + sx * r * 0.6 - 0.05, x + sx * r * 0.6 + 0.05, y, y + 0.62, z + sz * r * 0.6 - 0.05, z + sz * r * 0.6 + 0.05, 'Detalhes', '+x-x+z-z')

    def ar_condicionado(self, x, y, z, w=1.0, h=0.8, d=0.6):
        self.caixa(PAREDE_CINZA, x - w / 2, x + w / 2, y, y + h, z - d / 2, z + d / 2, 'Detalhes')
        self.cilindro(METAL_ESCURO, x, y + h * 0.5, z + d / 2 + 0.005, 0.26, 0.01, 12, 'Detalhes')

    def antena(self, x, y, z, h=6.0):
        self.tubo(METAL, (x, y, z), (x, y + h, z), 0.04, 6)
        for k in range(4):
            yy = y + h * (0.45 + 0.14 * k)
            self.caixa(METAL, x - 0.6 + 0.1 * k, x + 0.6 - 0.1 * k, yy, yy + 0.03, z - 0.015, z + 0.015, 'Detalhes')

    def coluna(self, x, z, y0, y1, r=0.14, mat=BRANCO_PURO, quadrada=False):
        if quadrada:
            self.caixa(mat, x - r, x + r, y0, y1, z - r, z + r, 'Detalhes', '+x-x+z-z')
        else:
            self.cilindro(mat, x, y0, z, r, y1 - y0, 12, 'Detalhes', caps=False)

    def marquise(self, face, c, u, w, prof, y, esp=0.16, mat=CONCRETO_CLARO, colunas=True, mat_coluna=BRANCO_PURO):
        """cobertura sobre a entrada, com colunas nos cantos da frente"""
        m = Malha()
        m.caixa(mat, -w / 2, w / 2, y, y + esp, 0.0, prof, '+x-x+y+z-z-y')
        self.n['Detalhes'].add(m, matriz(face, c, u, 0.0))
        if colunas:
            for sx in (-1, 1):
                cc = Malha()
                cc.cyl(mat_coluna, sx * (w / 2 - 0.25), 0.0, prof - 0.25, 0.13, y, 12, caps=False)
                self.n['Detalhes'].add(cc, matriz(face, c, u, 0.0))

    def piso(self, c, y0=0.0, y1=0.38, mat=RODAPE, folga=0.06):
        x0, x1, z0, z1 = c
        self.caixa(mat, x0 - folga, x1 + folga, y0, y1, z0 - folga, z1 + folga)
