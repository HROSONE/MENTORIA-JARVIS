"""Base do personagem Corredor: quaternions, esqueleto de repouso, cinemática direta (FK) e IK de duas juntas.

Convenções (iguais às do kit da cidade): metros, Y para cima, o personagem olha para +Z, o lado ESQUERDO dele é +X.
Todos os ossos têm rotação de repouso igual à identidade (eixos alinhados ao mundo); a posição de repouso de cada osso é
a da sua junta. Assim a rotação local de um osso é a rotação "a partir do repouso" e a animação fica fácil de ler:
  - girar em X por um ângulo POSITIVO inclina para frente o que aponta para cima (tronco) e joga para trás o que pende (perna, braço);
  - girar em Y por um ângulo positivo vira o que olha para +Z em direção a +X (para a esquerda do personagem);
  - girar em Z por um ângulo positivo levanta o lado +X (esquerdo)."""
import math
import numpy as np

# ------------------------------------------------------------------ quaternions (x, y, z, w)
ID = np.array([0.0, 0.0, 0.0, 1.0])


def qmul(a, b):
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return np.array([aw * bx + ax * bw + ay * bz - az * by,
                     aw * by - ax * bz + ay * bw + az * bx,
                     aw * bz + ax * by - ay * bx + az * bw,
                     aw * bw - ax * bx - ay * by - az * bz])


def qconj(q):
    return np.array([-q[0], -q[1], -q[2], q[3]])


def qnorm(q):
    return q / np.linalg.norm(q)


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
    """ordem Y·X·Z (o vetor sofre Z primeiro, depois X, depois Y): yaw por fora, depois inclinação, depois rolagem"""
    return qmul(QY(ry), qmul(QX(rx), QZ(rz)))


def qrot(q, v):
    v = np.asarray(v, dtype=float)
    u = q[:3]
    w = q[3]
    t = 2.0 * np.cross(u, v)
    return v + w * t + np.cross(u, t)


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
    return qnorm(np.array([c[0], c[1], c[2], 1.0 + d]))


def qslerp(a, b, t):
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    d = float(np.dot(a, b))
    if d < 0:
        b = -b
        d = -d
    if d > 0.9995:
        return qnorm(a + (b - a) * t)
    th = math.acos(min(1.0, d))
    return (a * math.sin((1 - t) * th) + b * math.sin(t * th)) / math.sin(th)


def qmat(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                     [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                     [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def qangulo(q):
    """ângulo (rad) da rotação"""
    return 2.0 * math.acos(min(1.0, abs(q[3])))


def suave(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def suave5(t):
    t = min(1.0, max(0.0, t))
    return t * t * t * (t * (6 * t - 15) + 10)


def lerp(a, b, t):
    return a + (b - a) * t


def hermite(p0, p1, m0, m1, u):
    """cúbica de Hermite em u∈[0,1]; m0 e m1 já vêm multiplicadas pela duração do trecho"""
    u2, u3 = u * u, u * u * u
    return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1


# ------------------------------------------------------------------ esqueleto de repouso (pose em A, braços relaxados)
ALTURA = 1.82            # com gorro
COMP_COXA, COMP_CANELA = 0.44, 0.43
COMP_BRACO, COMP_ANTEBRACO = 0.33, 0.26
NOS_CACHECOL = 6          # ossos do rabo do cachecol
SEG_CACHECOL = 0.085      # comprimento de cada segmento do cachecol
PE_CALCANHAR = np.array([0.0, -0.10, -0.085])    # ponto de contato do calcanhar, relativo ao tornozelo (no sistema do pé)
PE_BOLA = np.array([0.0, -0.10, 0.115])          # ponto de contato sob a bola do pé
PE_JUNTA_DEDOS = np.array([0.0, -0.065, 0.115])  # junta da ponteira (bola do pé), relativa ao tornozelo


def _braco(lado):
    s = 1.0 if lado == 'E' else -1.0
    ombro = np.array([s * 0.195, 1.435, 0.0])
    u = np.array([s * math.sin(math.radians(18)), -math.cos(math.radians(18)), math.sin(math.radians(3))])
    u /= np.linalg.norm(u)
    cotovelo = ombro + COMP_BRACO * u
    flex, abd = math.radians(25), math.radians(8)
    f = np.array([s * math.sin(abd) * math.cos(flex), -math.cos(abd) * math.cos(flex), math.sin(flex)])
    f /= np.linalg.norm(f)
    punho = cotovelo + COMP_ANTEBRACO * f
    return ombro, cotovelo, punho


def _repouso():
    P = {}
    P['Raiz'] = (0.0, 0.0, 0.0)
    P['Quadril'] = (0.0, 0.99, 0.0)
    P['Coluna'] = (0.0, 1.08, 0.0)
    P['Coluna2'] = (0.0, 1.22, 0.0)
    P['Peito'] = (0.0, 1.37, 0.0)
    P['Pescoco'] = (0.0, 1.51, -0.012)
    P['Cabeca'] = (0.0, 1.60, -0.005)
    for lado in 'ED':
        s = 1.0 if lado == 'E' else -1.0
        ombro, cotovelo, punho = _braco(lado)
        P['Ombro' + lado] = (s * 0.045, 1.47, -0.005)
        P['Braco' + lado] = tuple(ombro)
        P['Antebraco' + lado] = tuple(cotovelo)
        P['Mao' + lado] = tuple(punho)
        P['Coxa' + lado] = (s * 0.09, 0.97, 0.0)
        P['Canela' + lado] = (s * 0.095, 0.53, 0.012)
        P['Pe' + lado] = (s * 0.095, 0.10, -0.012)
        P['Ponteira' + lado] = (s * 0.095, 0.10 + PE_JUNTA_DEDOS[1], -0.012 + PE_JUNTA_DEDOS[2])
    for k in range(NOS_CACHECOL):
        P['Cachecol%d' % (k + 1)] = (0.035, 1.50 - SEG_CACHECOL * k, -0.128)
    return {k: np.array(v, dtype=float) for k, v in P.items()}


REPOUSO = _repouso()
PAI = {'Raiz': None, 'Quadril': 'Raiz', 'Coluna': 'Quadril', 'Coluna2': 'Coluna', 'Peito': 'Coluna2', 'Pescoco': 'Peito', 'Cabeca': 'Pescoco',
       'OmbroE': 'Peito', 'BracoE': 'OmbroE', 'AntebracoE': 'BracoE', 'MaoE': 'AntebracoE',
       'OmbroD': 'Peito', 'BracoD': 'OmbroD', 'AntebracoD': 'BracoD', 'MaoD': 'AntebracoD',
       'CoxaE': 'Quadril', 'CanelaE': 'CoxaE', 'PeE': 'CanelaE', 'PonteiraE': 'PeE',
       'CoxaD': 'Quadril', 'CanelaD': 'CoxaD', 'PeD': 'CanelaD', 'PonteiraD': 'PeD'}
for _k in range(NOS_CACHECOL):
    PAI['Cachecol%d' % (_k + 1)] = 'Pescoco' if _k == 0 else 'Cachecol%d' % _k
OSSOS = list(PAI.keys())                      # ordem topológica (pai antes do filho) = ordem dos índices JOINTS_0
INDICE = {n: i for i, n in enumerate(OSSOS)}
LOCAL = {n: (REPOUSO[n] if PAI[n] is None else REPOUSO[n] - REPOUSO[PAI[n]]) for n in OSSOS}


def comprimento(a, b):
    return float(np.linalg.norm(REPOUSO[b] - REPOUSO[a]))


def fk(rots, quadril_pos=None):
    """cinemática direta. `rots`: nome -> quaternion local (o que faltar é identidade). `quadril_pos`: posição do osso Quadril no
    mundo (padrão: a de repouso). Devolve (posições, rotações) de mundo de cada osso."""
    P, Q = {}, {}
    for n in OSSOS:
        pai = PAI[n]
        r = rots.get(n, ID)
        if pai is None:
            Q[n] = r
            P[n] = LOCAL[n].copy()
        else:
            Q[n] = qmul(Q[pai], r)
            loc = LOCAL[n] if (n != 'Quadril' or quadril_pos is None) else np.asarray(quadril_pos, dtype=float)
            P[n] = P[pai] + qrot(Q[pai], loc)
    return P, Q


def ik2(base, alvo, l1, l2, polo):
    """IK analítica de duas juntas (perna ou braço). `base`: junta de origem (quadril); `alvo`: onde o tornozelo deve chegar;
    `polo`: direção para onde o joelho aponta. Devolve (posição do joelho, posição final do tornozelo, folga):
    folga < 0 quando o alvo está além do alcance (a perna fica esticada na direção dele)."""
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
    joelho = base + l1 * (math.cos(a) * ed + math.sin(a) * p)
    tornozelo = base + ed * dist_c
    return joelho, tornozelo, folga
