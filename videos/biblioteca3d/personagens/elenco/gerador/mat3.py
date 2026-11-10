"""Quaternions (x, y, z, w), curvas e IK de duas juntas (iguais às do Corredor).
Convenções: metros, Y para cima, o personagem olha para +Z, o lado ESQUERDO dele é +X. Rotações de repouso = identidade.
  - X positivo: inclina para frente o que aponta para cima (tronco) e joga para trás o que pende (perna, braço);
  - Y positivo: vira o que olha para +Z em direção a +X; - Z positivo: levanta o lado +X."""
import math
import numpy as np

ID = np.array([0.0, 0.0, 0.0, 1.0])


def qmul(a, b):
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return np.array([aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx,
                     aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz])


def qconj(q):
    return np.array([-q[0], -q[1], -q[2], q[3]])


def qeixo(eixo, ang):
    e = np.asarray(eixo, dtype=float)
    e = e / np.linalg.norm(e)
    s = math.sin(ang / 2)
    return np.array([e[0] * s, e[1] * s, e[2] * s, math.cos(ang / 2)])


def QX(a):
    return np.array([math.sin(a / 2), 0.0, 0.0, math.cos(a / 2)])


def QY(a):
    return np.array([0.0, math.sin(a / 2), 0.0, math.cos(a / 2)])


def QZ(a):
    return np.array([0.0, 0.0, math.sin(a / 2), math.cos(a / 2)])


def qeuler(rx=0.0, ry=0.0, rz=0.0):
    """ordem Y·X·Z (o vetor sofre Z primeiro, depois X, depois Y)"""
    return qmul(QY(ry), qmul(QX(rx), QZ(rz)))


def qrot(q, v):
    v = np.asarray(v, dtype=float)
    u = q[:3]
    t = 2.0 * np.cross(u, v)
    return v + q[3] * t + np.cross(u, t)


def qarco(a, b):
    """menor rotação que leva a direção `a` na direção `b`"""
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    a = a / np.linalg.norm(a)
    b = b / np.linalg.norm(b)
    d = float(np.dot(a, b))
    if d > 0.999999999:
        return ID.copy()
    if d < -0.999999999:
        perp = np.cross(a, [1.0, 0.0, 0.0])
        if np.linalg.norm(perp) < 1e-6:
            perp = np.cross(a, [0.0, 1.0, 0.0])
        return qeixo(perp, math.pi)
    c = np.cross(a, b)
    q = np.array([c[0], c[1], c[2], 1.0 + d])
    return q / np.linalg.norm(q)


def qslerp(a, b, t):
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    d = float(np.dot(a, b))
    if d < 0:
        b = -b
        d = -d
    if d > 0.9995:
        r = a + (b - a) * t
        return r / np.linalg.norm(r)
    th = math.acos(min(1.0, d))
    return (a * math.sin((1 - t) * th) + b * math.sin(t * th)) / math.sin(th)


def suave(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def suave5(t):
    t = min(1.0, max(0.0, t))
    return t * t * t * (t * (6 * t - 15) + 10)


def lerp(a, b, t):
    return a + (b - a) * t


def hermite(p0, p1, m0, m1, u):
    u2, u3 = u * u, u * u * u
    return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1


def spline(chaves):
    """curva C1 que passa pelas chaves [(t, valor)], tangentes por diferenças finitas (nulas nas pontas)"""
    ts = np.array([c[0] for c in chaves], dtype=float)
    vs = np.array([c[1] for c in chaves], dtype=float)
    m = np.zeros_like(vs)
    for i in range(1, len(ts) - 1):
        m[i] = (vs[i + 1] - vs[i - 1]) / (ts[i + 1] - ts[i - 1])

    def f(t):
        if t <= ts[0]:
            return vs[0]
        if t >= ts[-1]:
            return vs[-1]
        i = int(np.searchsorted(ts, t, side='right')) - 1
        h = ts[i + 1] - ts[i]
        return hermite(vs[i], vs[i + 1], m[i] * h, m[i + 1] * h, (t - ts[i]) / h)
    return f


def ik2(base, alvo, l1, l2, polo):
    """IK analítica de duas juntas. Devolve (junta do meio, ponta, folga); folga < 0 quando o alvo está além do alcance."""
    base = np.asarray(base, dtype=float)
    d = np.asarray(alvo, dtype=float) - base
    dist = float(np.linalg.norm(d))
    alcance = (l1 + l2) * 0.9995
    folga = alcance - dist
    dist_c = min(max(dist, abs(l1 - l2) + 1e-4), alcance)
    ed = d / max(dist, 1e-9)
    p = np.asarray(polo, dtype=float)
    p = p - ed * float(np.dot(p, ed))
    if np.linalg.norm(p) < 1e-6:
        p = np.array([0.0, 0.0, 1.0]) - ed * ed[2]
    p = p / np.linalg.norm(p)
    cosa = (l1 * l1 + dist_c * dist_c - l2 * l2) / (2 * l1 * dist_c)
    a = math.acos(max(-1.0, min(1.0, cosa)))
    return base + l1 * (math.cos(a) * ed + math.sin(a) * p), base + ed * dist_c, folga
