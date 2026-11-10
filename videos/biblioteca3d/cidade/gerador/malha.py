"""Construtor de malhas triangulares (numpy): caixas, polígonos convexos, prismas, sólidos de revolução.
Convenções: metros, Y para cima. A orientação das faces é corrigida automaticamente pela direção `facing`."""
import math
import numpy as np
from glb import Prim


def V(*a):
    return np.array(a, dtype=float)


def newell(pts):
    n = np.zeros(3)
    for i in range(len(pts)):
        a, b = pts[i], pts[(i + 1) % len(pts)]
        n += V((a[1] - b[1]) * (a[2] + b[2]), (a[2] - b[2]) * (a[0] + b[0]), (a[0] - b[0]) * (a[1] + b[1]))
    ln = np.linalg.norm(n)
    return n / ln if ln > 1e-12 else V(0, 1, 0)


def T(x=0, y=0, z=0):
    m = np.eye(4); m[:3, 3] = (x, y, z); return m


def Ry(a):
    c, s = math.cos(a), math.sin(a)
    m = np.eye(4); m[0, 0], m[0, 2], m[2, 0], m[2, 2] = c, s, -s, c; return m


def Rx(a):
    c, s = math.cos(a), math.sin(a)
    m = np.eye(4); m[1, 1], m[1, 2], m[2, 1], m[2, 2] = c, -s, s, c; return m


def Rz(a):
    c, s = math.cos(a), math.sin(a)
    m = np.eye(4); m[0, 0], m[0, 1], m[1, 0], m[1, 1] = c, -s, s, c; return m


class Malha:
    def __init__(self):
        self.g = {}          # id(material) -> [material, pos[], nrm[], uv[], idx[]]
        self.n_tris = 0

    def _grp(self, mat):
        if id(mat) not in self.g:
            self.g[id(mat)] = [mat, [], [], [], []]
        return self.g[id(mat)]

    def tri(self, mat, a, b, c, n=None, uvs=None):
        a, b, c = V(*a), V(*b), V(*c)
        cr = np.cross(b - a, c - a)
        if np.linalg.norm(cr) < 1e-12:
            return                                  # triângulo degenerado
        n = cr / np.linalg.norm(cr) if n is None else n
        g = self._grp(mat)
        base = len(g[1])
        g[1].extend([a, b, c])
        g[2].extend([n, n, n] if np.ndim(n) == 1 else list(n))
        if uvs is not None:
            g[3].extend(uvs)
        g[4].extend([base, base + 1, base + 2])
        self.n_tris += 1

    def poly(self, mat, pts, facing, uvs=None):
        """polígono convexo em leque; vira para o lado de `facing`."""
        pts = [V(*p) for p in pts]
        uvs = None if uvs is None else [tuple(u) for u in uvs]
        n = newell(pts)
        if np.dot(n, V(*facing)) < 0:
            pts = [pts[0]] + pts[:0:-1]                 # inverte o sentido mantendo o 1º vértice como ápice do leque
            uvs = None if uvs is None else [uvs[0]] + uvs[:0:-1]
            n = -n
        for i in range(1, len(pts) - 1):
            self.tri(mat, pts[0], pts[i], pts[i + 1], n, None if uvs is None else [uvs[0], uvs[i], uvs[i + 1]])

    def quad(self, mat, a, b, c, d, facing, uvs=None):
        self.poly(mat, [a, b, c, d], facing, uvs)

    # ---------- formas ----------
    def top(self, mat, x0, x1, z0, z1, y):
        """retângulo horizontal virado para cima"""
        self.quad(mat, (x0, y, z0), (x0, y, z1), (x1, y, z1), (x1, y, z0), (0, 1, 0))

    def wall(self, mat, p0, p1, y0, y1, facing):
        """parede vertical entre dois pontos (x,z), virada para `facing` (x,z)"""
        self.quad(mat, (p0[0], y0, p0[1]), (p1[0], y0, p1[1]), (p1[0], y1, p1[1]), (p0[0], y1, p0[1]), (facing[0], 0, facing[1]))

    def box(self, mat, cx, cy, cz, sx, sy, sz, mats=None):
        x0, x1, y0, y1, z0, z1 = cx - sx / 2, cx + sx / 2, cy - sy / 2, cy + sy / 2, cz - sz / 2, cz + sz / 2
        m = mats or {}
        f = lambda k: m.get(k, mat)
        self.quad(f('+y'), (x0, y1, z0), (x0, y1, z1), (x1, y1, z1), (x1, y1, z0), (0, 1, 0))
        self.quad(f('-y'), (x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1), (0, -1, 0))
        self.quad(f('+x'), (x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1), (1, 0, 0))
        self.quad(f('-x'), (x0, y0, z0), (x0, y0, z1), (x0, y1, z1), (x0, y1, z0), (-1, 0, 0))
        self.quad(f('+z'), (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1), (0, 0, 1))
        self.quad(f('-z'), (x0, y0, z0), (x0, y1, z0), (x1, y1, z0), (x1, y0, z0), (0, 0, -1))

    def prism(self, mat_top, mat_side, poly_xz, y0, y1, walls=None, bottom=False):
        """prisma de polígono convexo (x,z): tampa em y1, paredes em cada aresta (máscara `walls`)"""
        pts = [V(x, y1, z) for x, z in poly_xz]
        self.poly(mat_top, pts, (0, 1, 0))
        cen = np.mean(np.array(poly_xz), axis=0)
        n = len(poly_xz)
        for i in range(n):
            if walls is not None and not walls[i]:
                continue
            p0, p1 = poly_xz[i], poly_xz[(i + 1) % n]
            mid = ((p0[0] + p1[0]) / 2 - cen[0], (p0[1] + p1[1]) / 2 - cen[1])
            self.wall(mat_side, p0, p1, y0, y1, mid)
        if bottom:
            self.poly(mat_side, [V(x, y0, z) for x, z in poly_xz], (0, -1, 0))

    def revolve(self, mat, profile, segs=16, smooth=True, hard_deg=35, cap_center=True):
        """sólido de revolução em torno do eixo Y. `profile`: [(r, y)] de baixo para cima."""
        P = [(float(r), float(y)) for r, y in profile]
        sn = []                                                # normal 2D (r,y) de cada segmento
        for (r0, y0), (r1, y1) in zip(P, P[1:]):
            dr, dy = r1 - r0, y1 - y0
            l = math.hypot(dr, dy)
            sn.append((dy / l, -dr / l) if l > 1e-12 else (0.0, 1.0))
        thr = math.cos(math.radians(hard_deg))
        ang = [2 * math.pi * i / segs for i in range(segs + 1)]
        for k, ((r0, y0), (r1, y1)) in enumerate(zip(P, P[1:])):
            if math.hypot(r1 - r0, y1 - y0) < 1e-12:
                continue

            def end_n(idx_pt, own, nb):
                if smooth and nb is not None and own[0] * nb[0] + own[1] * nb[1] > thr:
                    s = (own[0] + nb[0], own[1] + nb[1]); l = math.hypot(*s); return (s[0] / l, s[1] / l)
                return own
            n0 = end_n(k, sn[k], sn[k - 1] if k > 0 else None)
            n1 = end_n(k + 1, sn[k], sn[k + 1] if k + 1 < len(sn) else None)
            for i in range(segs):
                a0, a1 = ang[i], ang[i + 1]
                q = []
                for (r, y, nn, a) in ((r0, y0, n0, a0), (r0, y0, n0, a1), (r1, y1, n1, a1), (r1, y1, n1, a0)):
                    q.append((V(r * math.cos(a), y, r * math.sin(a)), V(nn[0] * math.cos(a), nn[1], nn[0] * math.sin(a))))
                # dois triângulos; ordem escolhida para a normal apontar para fora
                for tri in ((0, 2, 1), (0, 3, 2)) if True else ():
                    pa, pb, pc = (q[j][0] for j in tri)
                    na, nb_, nc = (q[j][1] for j in tri)
                    cr = np.cross(pb - pa, pc - pa)
                    if np.linalg.norm(cr) < 1e-12:
                        continue
                    if np.dot(cr, na + nb_ + nc) < 0:
                        tri = (tri[0], tri[2], tri[1])
                        pa, pb, pc = (q[j][0] for j in tri); na, nb_, nc = (q[j][1] for j in tri)
                    g = self._grp(mat)
                    base = len(g[1])
                    g[1].extend([pa, pb, pc]); g[2].extend([na, nb_, nc]); g[4].extend([base, base + 1, base + 2]); self.n_tris += 1

    def cyl(self, mat, cx, cy, cz, r, h, segs=12, axis='y', caps=True, r_top=None):
        """cilindro (ou cone truncado) com base em (cx,cy,cz); `axis` x, y ou z"""
        rt = r if r_top is None else r_top
        prof = [(0, 0), (r, 0), (rt, h)] + ([(0, h)] if caps else [])
        if not caps:
            prof = [(r, 0), (rt, h)]
        m = Malha(); m.revolve(mat, prof, segs, smooth=True, hard_deg=40)
        M = {'y': np.eye(4), 'x': Rz(-math.pi / 2), 'z': Rx(math.pi / 2)}[axis]
        self.add(m, T(cx, cy, cz) @ M)

    def add(self, other, M=None):
        """copia outra malha aplicando a matriz 4x4 M"""
        M = np.eye(4) if M is None else M
        R = M[:3, :3]
        for key, (mat, pos, nrm, uv, idx) in other.g.items():
            g = self._grp(mat)
            base = len(g[1])
            g[1].extend([R @ p + M[:3, 3] for p in pos])
            nn = []
            for n in nrm:
                v = R @ n; l = np.linalg.norm(v); nn.append(v / l if l > 1e-12 else v)
            g[2].extend(nn)
            g[3].extend(uv)
            g[4].extend([i + base for i in idx])
        self.n_tris += other.n_tris

    def prims(self):
        out = []
        for mat, pos, nrm, uv, idx in self.g.values():
            if not pos:
                continue
            out.append(Prim(mat, np.array(pos), np.array(nrm), np.array(idx), np.array(uv) if len(uv) == len(pos) and uv else None))
        return out

    def bbox(self):
        pts = [p for g in self.g.values() for p in g[1]]
        a = np.array(pts)
        return a.min(axis=0), a.max(axis=0)
