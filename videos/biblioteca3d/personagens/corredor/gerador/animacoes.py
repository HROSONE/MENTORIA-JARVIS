"""Animações do Corredor, geradas por código (sem captura de movimento).

* Andar e Correr: ciclo de marcha com IK de duas juntas nas pernas. O pé que está no chão fica PARADO no mundo (o corpo avança sobre ele),
  rolando calcanhar -> pé chato -> bola do pé; no balanço o pé segue uma curva de Hermite com as mesmas velocidades das pontas do apoio.
  O pé sobe sozinho no fim do apoio quando a perna não alcança. Braços contrabalançam as pernas, o tronco gira contra a pelve e a cabeça se estabiliza.
* Parado: respiração, troca de peso, olhar.
* Pular: agachar, impulso, voo balístico com as pernas recolhidas, aterrissagem amortecida.
* O cachecol é simulado (cadeia de partículas com vento relativo) e fundido para repetir sem emenda.
Todos os clipes são "no lugar": o objeto inteiro é quem se desloca (veja `velocidade` em cada clipe)."""
import math
from types import SimpleNamespace
import numpy as np
from base import (ID, qmul, qconj, qeixo, QX, QY, QZ, qeuler, qrot, qarco, qslerp, qmat, qnorm, suave, suave5, lerp, hermite, fk, ik2,
                  REPOUSO, LOCAL, PAI, OSSOS, INDICE, comprimento, NOS_CACHECOL, SEG_CACHECOL, PE_CALCANHAR, PE_JUNTA_DEDOS)

L1 = comprimento('CoxaE', 'CanelaE')
L2 = comprimento('CanelaE', 'PeE')
ALCANCE = (L1 + L2) * 0.9995
JP = (float(PE_JUNTA_DEDOS[2]), float(PE_JUNTA_DEDOS[1]))        # (z, y) da junta da ponteira em relação ao tornozelo, no sistema do pé
HP = (float(PE_CALCANHAR[2]), float(PE_CALCANHAR[1]))            # (z, y) do ponto do calcanhar
Z_CALC_TORN = -HP[0]                                             # o tornozelo fica 0,085 m à frente do calcanhar
Z_JUNTA_TORN = JP[0]
Y_TORN = -HP[1]                                                  # altura do tornozelo com o pé chato (0,10)
Y_JUNTA = Y_TORN + JP[1]                                         # altura da junta da ponteira com o pé chato (0,035)
G = 9.81
D0 = {}
for _l in 'ED':
    v = REPOUSO['Canela' + _l] - REPOUSO['Coxa' + _l]
    w = REPOUSO['Pe' + _l] - REPOUSO['Canela' + _l]
    D0[_l] = (v / np.linalg.norm(v), w / np.linalg.norm(w))
SG = {'E': 1.0, 'D': -1.0}


def giro_zy(zy, th):
    """gira um vetor (z, y) do plano sagital pelo ângulo th em torno de X (th>0 = ponta do pé para baixo)"""
    z, y = zy
    return (y * math.sin(th) + z * math.cos(th), y * math.cos(th) - z * math.sin(th))


def desl(dz, dy, yaw):
    """vetor (dz à frente, dy para cima) do sistema do pé, levado para o mundo pelo giro `yaw` do pé em torno de Y"""
    return np.array([dz * math.sin(yaw), dy, dz * math.cos(yaw)])


def sola_min_y(th, dedos):
    """altura do ponto mais baixo da sola em relação ao tornozelo (m, negativo), para o pé inclinado de `th` e a ponteira dobrada de `dedos`"""
    jz, jy = JP
    pts = [HP]
    dz, dy = giro_zy((0.0, -0.035), dedos)
    pts.append((jz + dz, jy + dy))
    dz, dy = giro_zy((0.100, -0.035), dedos)
    pts.append((jz + dz, jy + dy))
    return min(giro_zy(p, th)[1] for p in pts)


def smax(a, b, eps=0.05):
    return 0.5 * (a + b + math.sqrt((a - b) ** 2 + eps * eps))


def spline(chaves):
    """curva C1 que passa pelas chaves [(t, valor)], tangentes por diferenças finitas (nulas nas pontas); vale para escalares e vetores"""
    ts = np.array([c[0] for c in chaves], dtype=float)
    vs = np.array([c[1] for c in chaves], dtype=float)
    n = len(ts)
    m = np.zeros_like(vs)
    for i in range(1, n - 1):
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


# ====================================================================== pose completa a partir de parâmetros
def montar_pose(p):
    """p: dict com 'quad_pos', 'quad_rot' (rx, ry, rz), 'espinha' [3 x (rx,ry,rz)], 'cabeca_mundo' (quaternion desejado),
    'pe' {lado: {'tornozelo','pitch','yaw','dedos','torcao'}}, 'braco' {lado: {...}}. Devolve (rotações locais, posição do Quadril)."""
    R = {}
    quad_pos = np.asarray(p['quad_pos'], dtype=float)
    Qp = qeuler(*p['quad_rot'])
    R['Quadril'] = Qp
    Qc = Qp
    for nome, e in zip(('Coluna', 'Coluna2', 'Peito'), p['espinha']):
        R[nome] = qeuler(*e)
        Qc = qmul(Qc, R[nome])
    # pescoço e cabeça: compensam o tronco para a cabeça ficar estável
    Rt = qmul(qconj(Qc), p['cabeca_mundo'])
    R['Pescoco'] = qslerp(ID, Rt, 0.4)
    R['Cabeca'] = qmul(qconj(R['Pescoco']), Rt)
    # clavículas e braços (FK)
    for lado in 'ED':
        b = p['braco'][lado]
        R['Ombro' + lado] = qeuler(*b['ombro'])
        R['Braco' + lado] = qeuler(*b['braco'])
        R['Antebraco' + lado] = qeuler(*b['antebraco'])
        R['Mao' + lado] = qeuler(*b['mao'])
    # pernas por IK
    for lado in 'ED':
        pe = p['pe'][lado]
        quadril = quad_pos + qrot(Qp, LOCAL['Coxa' + lado])
        polo = np.array([SG[lado] * 0.10, 0.0, 1.0])
        joelho, torn, folga = ik2(quadril, pe['tornozelo'], L1, L2, polo)
        d0, s0 = D0[lado]
        d1 = (joelho - quadril) / np.linalg.norm(joelho - quadril)
        s1 = (torn - joelho) / np.linalg.norm(torn - joelho)
        tw = pe.get('torcao', SG[lado] * 0.07)
        Qt = qmul(qeixo(d1, tw), qarco(d0, d1))
        Qs = qmul(qeixo(s1, tw), qarco(s0, s1))
        R['Coxa' + lado] = qmul(qconj(Qp), Qt)
        R['Canela' + lado] = qmul(qconj(Qt), Qs)
        Qf = qeuler(pe['pitch'], pe['yaw'], 0.0)
        R['Pe' + lado] = qmul(qconj(Qs), Qf)
        R['Ponteira' + lado] = QX(pe['dedos'])
        pe['_folga'] = folga
    return R, quad_pos


# ====================================================================== marcha
ANDAR = SimpleNamespace(
    nome='Andar', T=1.0, v=1.25, beta=0.62, zh0=0.20, x_pe=0.095, u_flat=0.12, u_ho=0.46, th_hs=-0.18, th_to=1.00, th_lim=1.05,
    y0=0.960, quica=0.020, quica_fase=0.30, sway=0.028, yaw_pelve=0.075, roll_pelve=0.045, pitch_pelve=0.04,
    lean=0.06, yaw_ombro=0.17, roll_tronco=0.5,
    balanco_h=0.07, pico=0.45, kick=0.0, passo_abre=0.0,
    braco_amp=0.42, braco_bias=0.05, cotovelo=0.02, cotovelo_var=0.34, braco_adu=0.10, braco_fase=0.0, ombro_sobe=0.0, cabeca_segue=0.25,
)
CORRER = SimpleNamespace(
    nome='Correr', T=0.72, v=3.2, beta=0.34, zh0=0.14, x_pe=0.075, u_flat=0.10, u_ho=0.40, th_hs=-0.12, th_to=0.95, th_lim=1.05,
    y0=0.900, quica=0.034, quica_fase=None, sway=0.016, yaw_pelve=0.10, roll_pelve=0.06, pitch_pelve=0.10,
    lean=0.20, yaw_ombro=0.28, roll_tronco=0.6,
    balanco_h=0.32, pico=0.42, kick=0.9, passo_abre=0.0,
    braco_amp=0.55, braco_bias=0.0, cotovelo=1.30, cotovelo_var=0.30, braco_adu=0.30, braco_fase=0.06, ombro_sobe=0.0, cabeca_segue=0.30,
)


class Marcha:
    def __init__(self, par):
        self.p = par

    # --- pelve (fase global phi: 0 = calcanhar esquerdo toca o chão)
    def quad(self, phi):
        p = self.p
        c = 2 * math.pi
        if p.quica_fase is None:                       # corrida: mais baixa no meio do apoio, mais alta no meio do voo
            y = p.y0 - p.quica * math.cos(2 * c * (phi - p.beta / 2))
        else:                                          # caminhada: mais alta no meio do apoio (pêndulo invertido)
            y = p.y0 + p.quica * math.cos(2 * c * (phi - p.quica_fase))
        x = p.sway * math.sin(c * phi)
        rot = (p.pitch_pelve, -p.yaw_pelve * math.cos(c * phi), p.roll_pelve * math.sin(c * phi))
        return np.array([x, y, 0.0]), rot

    def quadril_mundo(self, phi, lado):
        pos, rot = self.quad(phi)
        return pos + qrot(qeuler(*rot), LOCAL['Coxa' + lado])

    # --- pé em apoio: u em [0,1] (0 = calcanhar toca, 1 = decola); phi_g = fase global desse instante (para a pelve)
    def apoio(self, u, phi_g, lado):
        """tornozelo, inclinação do pé e dobra da ponteira no apoio; o calcanhar (e depois a junta da ponteira) fica parado no mundo"""
        p = self.p
        t = u * p.beta * p.T
        yaw = SG[lado] * 0.10
        H = np.array([SG[lado] * p.x_pe, 0.0, p.zh0 - p.v * t])       # calcanhar plantado (o corpo avança sobre ele)
        dedos = 0.0
        if u < p.u_flat:
            th = p.th_hs * (1 - suave5(u / p.u_flat))
            dz, dy = giro_zy(HP, th)
            torn = H - desl(dz, dy, yaw)
        elif u < p.u_ho:
            th = 0.0
            torn = H + desl(Z_CALC_TORN, Y_TORN, yaw)
        else:
            q = (u - p.u_ho) / (1 - p.u_ho)
            th_nom = p.th_to * q ** 1.6
            J = H + desl(Z_CALC_TORN + Z_JUNTA_TORN, Y_JUNTA, yaw)     # junta da ponteira: fica parada enquanto o calcanhar sobe
            quad = self.quadril_mundo(phi_g, lado)
            melhor = None
            th_alc = 0.0
            for k in range(0, 71):                                     # menor inclinação em que a perna alcança
                thk = k * math.radians(1.0)
                dz, dy = giro_zy(JP, thk)
                tk = J - desl(dz, dy, yaw)
                dd = np.linalg.norm(tk - quad)
                if dd <= ALCANCE:
                    th_alc, melhor = thk, tk
                    break
                if melhor is None or dd < np.linalg.norm(melhor - quad):
                    melhor, th_alc = tk, thk
            th = min(p.th_lim, smax(th_nom, th_alc, 0.06)) if q > 0 else 0.0
            dz, dy = giro_zy(JP, th)
            torn = J - desl(dz, dy, yaw)
            dedos = -th                                                # ponteira chata no chão: dobra para cima em relação ao pé
        return torn, th, dedos

    def pe(self, phi, lado):
        """estado do pé (tornozelo no mundo, inclinação, giro, dedos) na fase global phi"""
        p = self.p
        off = 0.0 if lado == 'E' else 0.5
        pf = (phi - off) % 1.0
        yaw = SG[lado] * 0.10
        if pf < p.beta:
            u = pf / p.beta
            torn, th, dedos = self.apoio(u, phi, lado)
            return {'tornozelo': torn, 'pitch': th, 'yaw': yaw, 'dedos': dedos, 'apoio': True}
        # balanço: Hermite entre a decolagem e o próximo toque, com as velocidades das pontas do apoio
        s = (pf - p.beta) / (1 - p.beta)
        Tsw = (1 - p.beta) * p.T
        phi_to = (phi - (pf - p.beta)) % 1.0
        phi_hs = (phi + (1 - pf)) % 1.0
        eps = 0.004
        a0, th0, d0 = self.apoio(1.0, phi_to, lado)
        a0b, th0b, _ = self.apoio(1.0 - eps / p.T / p.beta * p.T, (phi_to - eps / p.T) % 1.0, lado)
        a1, th1, d1 = self.apoio(0.0, phi_hs, lado)
        a1b, th1b, _ = self.apoio(eps / p.T / p.beta * p.T, (phi_hs + eps / p.T) % 1.0, lado)
        dt = eps
        v0 = (a0 - a0b) / dt
        v1 = (a1b - a1) / dt
        om0 = (th0 - th0b) / dt
        om1 = (th1b - th1) / dt
        pos = np.array([a0[0], 0.0, 0.0])
        for k in (1, 2):
            pos[k] = hermite(a0[k], a1[k], v0[k] * Tsw, v1[k] * Tsw, s)
        kk = math.log(0.5) / math.log(p.pico)
        lev = math.sin(math.pi * (s ** kk)) ** 2
        pos[1] += p.balanco_h * lev
        # inclinação: a ponta do pé sobe rápido depois da decolagem (senão a ponteira raspa no chão); no fim se prepara para o calcanhar
        th = th1 + (th0 - th1) * (1 - suave5(s / 0.55)) + p.kick * lev
        dedos = lerp(d0, 0.0, suave(s * 2.5))
        folga = 0.012 * suave(s / 0.15) * (1 - suave((s - 0.85) / 0.15))
        pos[1] = smax(pos[1], folga - sola_min_y(th, dedos), 0.012)
        return {'tornozelo': pos, 'pitch': th, 'yaw': yaw, 'dedos': dedos, 'apoio': False}

    # --- tronco, cabeça e braços
    def corpo(self, phi):
        p = self.p
        c = 2 * math.pi
        _, qrot_ = self.quad(phi)
        pit_p, yaw_p, roll_p = qrot_
        yaw_o = p.yaw_ombro * math.cos(c * phi)
        dy = yaw_o - yaw_p                                       # giro total que a coluna precisa fazer em relação à pelve
        dr = -p.roll_tronco * roll_p
        dp = p.lean - pit_p
        fr = (0.22, 0.33, 0.45)
        fy = (0.22, 0.33, 0.45)
        esp = [(dp * f, dy * g, dr * f) for f, g in zip(fr, fy)]
        return esp

    def bracos(self, phi, quicando):
        p = self.p
        c = 2 * math.pi
        out = {}
        for lado in 'ED':
            sg = SG[lado]
            ph = (phi + (0.0 if lado == 'E' else 0.5) + p.braco_fase) % 1.0
            f = p.braco_amp * math.cos(c * (ph - 0.5)) - p.braco_bias        # >0 = braço à frente
            ombro_rx = -f
            cot = p.cotovelo + p.cotovelo_var * max(0.0, math.cos(c * (ph - 0.5))) * (1.0 if p.cotovelo < 1.0 else 0.0) + \
                (p.cotovelo_var * 0.5 * math.cos(c * (ph - 0.5)) if p.cotovelo >= 1.0 else 0.0)
            out[lado] = {'ombro': (0.0, 0.0, sg * 0.0),
                         'braco': (ombro_rx - 0.6 * p.lean, sg * (0.0), -sg * p.braco_adu),
                         'antebraco': (-cot, 0.0, 0.0),
                         'mao': (-0.12, 0.0, 0.0)}
        return out

    def pose(self, phi):
        p = self.p
        pos, rot = self.quad(phi)
        pes = {l: self.pe(phi, l) for l in 'ED'}
        # a pelve nunca sobe além do que as pernas alcançam
        for _ in range(3):
            falta = 0.0
            for l in 'ED':
                quadril = pos + qrot(qeuler(*rot), LOCAL['Coxa' + l])
                d = np.linalg.norm(pes[l]['tornozelo'] - quadril)
                if pes[l]['apoio']:
                    falta = max(falta, d - ALCANCE)
            if falta <= 0:
                break
            pos[1] -= falta * 1.05
        esp = self.corpo(phi)
        Qc = qeuler(*rot)
        for e in esp:
            Qc = qmul(Qc, qeuler(*e))
        cabeca = qslerp(ID, Qc, p.cabeca_segue)
        return {'quad_pos': pos, 'quad_rot': rot, 'espinha': esp, 'cabeca_mundo': cabeca, 'pe': pes, 'braco': self.bracos(phi, True)}


# ====================================================================== parado (respiração, troca de peso, olhar)
class Parado:
    nome = 'Parado'
    T = 4.0
    v = 0.0

    def pose(self, t):
        c = 2 * math.pi / self.T
        s1, s2 = math.sin(c * t), math.sin(2 * c * t)
        resp = 0.5 - 0.5 * math.cos(c * t)                       # uma respiração por ciclo
        pos = np.array([0.010 * s1, 0.976 + 0.003 * resp, 0.0])
        rot = (0.03, 0.025 * math.sin(c * t + 1.0), 0.020 * s1)
        esp = [(-0.004 * resp + 0.02, 0.0, -0.4 * rot[2]), (-0.014 * resp + 0.02, 0.0, -0.3 * rot[2]), (-0.024 * resp + 0.01, 0.0, -0.3 * rot[2])]
        pes = {}
        for l in 'ED':
            pes[l] = {'tornozelo': np.array([SG[l] * 0.100, Y_TORN, -0.010]), 'pitch': 0.0, 'yaw': SG[l] * 0.09, 'dedos': 0.0}
        br = {}
        for l in 'ED':
            ph = 0.0 if l == 'E' else 1.3
            br[l] = {'ombro': (0.0, 0.0, SG[l] * 0.012 * resp), 'braco': (0.035 * math.sin(c * t + ph), 0.0, -SG[l] * 0.02),
                     'antebraco': (-0.03 + 0.03 * math.sin(c * t + ph + 0.8), 0.0, 0.0), 'mao': (-0.08, 0.0, 0.0)}
        cab = qeuler(0.05 * s2 + 0.02, 0.17 * math.sin(c * t + 0.5), 0.02 * math.sin(c * t + 2.0))
        return {'quad_pos': pos, 'quad_rot': rot, 'espinha': esp, 'cabeca_mundo': cab, 'pe': pes, 'braco': br}


# ====================================================================== pulo
class Pulo:
    nome = 'Pular'
    T = 1.75
    v = 0.0
    t_agacha, t_calc, t_dec, t_apice, t_pouso, t_rola = 0.42, 0.50, 0.60, 0.86, 1.12, 0.09
    TH_DEC, TH_POUSO = 0.95, 0.30
    X_PE, Z_PE = 0.100, -0.010

    def __init__(self):
        Tf = self.t_pouso - self.t_dec
        a_dec = self._ank_bola(self.TH_DEC, 'E')
        a_pou = self._ank_bola(self.TH_POUSO, 'E')
        self.y_dec = self._altura_quadril(a_dec, 0.995) + 0.02
        self.y_pou = self._altura_quadril(a_pou, 0.985) + 0.02
        self.vy = (self.y_pou - self.y_dec) / Tf + G * Tf / 2
        # curva da subida (do fundo do agachamento até a decolagem) com velocidade vy na ponta
        h = self.t_dec - self.t_agacha
        self._sobe = lambda t: hermite(0.70, self.y_dec, 0.0, self.vy * h, (t - self.t_agacha) / h)
        v_pouso = self.vy - G * Tf
        h2 = 0.19
        self._amorte = lambda t: hermite(self.y_pou, 0.74, v_pouso * h2, 0.0, (t - self.t_pouso) / h2)
        self._baixo_ini = spline([(0.0, 0.976), (0.10, 0.976), (self.t_agacha, 0.70)])
        self._levanta = spline([(self.t_pouso + h2, 0.74), (1.52, 0.955), (self.T, 0.976)])
        self._z = spline([(0.0, 0.0), (0.10, 0.0), (self.t_agacha, -0.12), (self.t_dec, -0.01), (self.t_pouso, 0.0), (self.t_pouso + 0.19, -0.10), (self.T, 0.0)])
        self._lean = spline([(0.0, 0.04), (0.10, 0.06), (self.t_agacha, 0.60), (self.t_dec, 0.12), (self.t_apice, 0.22), (self.t_pouso, 0.16),
                             (self.t_pouso + 0.19, 0.56), (self.T, 0.04)])
        self._ombro = spline([(0.0, 0.0), (0.10, 0.25), (self.t_agacha, 1.05), (self.t_dec, -2.55), (self.t_apice, -2.75), (self.t_pouso, -2.05),
                              (self.t_pouso + 0.19, -0.80), (1.50, -0.15), (self.T, 0.0)])
        self._cot = spline([(0.0, 0.0), (self.t_agacha, 0.45), (self.t_dec, 0.15), (self.t_apice, 0.35), (self.t_pouso, 0.45), (self.t_pouso + 0.19, 0.75), (self.T, 0.0)])
        self._abre = spline([(0.0, 0.0), (self.t_agacha, 0.0), (self.t_dec, 0.28), (self.t_apice, 0.45), (self.t_pouso, 0.30), (self.t_pouso + 0.2, 0.05), (self.T, 0.0)])
        self._sobe_ombro = spline([(0.0, 0.0), (self.t_agacha, 0.0), (self.t_dec, 0.20), (self.t_apice, 0.28), (self.t_pouso, 0.18), (self.t_pouso + 0.25, 0.0), (self.T, 0.0)])
        self._pit_pelve = spline([(0.0, 0.03), (self.t_agacha, 0.42), (self.t_dec, 0.06), (self.t_pouso, 0.08), (self.t_pouso + 0.19, 0.40), (self.T, 0.03)])
        # cabeça: olha para frente (nível) e um pouco para cima na subida
        self._cab = spline([(0.0, 0.0), (self.t_agacha, -0.18), (self.t_dec, -0.05), (self.t_apice, -0.10), (self.t_pouso + 0.19, -0.12), (self.T, 0.0)])

    def _ank_bola(self, th, lado):
        yaw = SG[lado] * 0.09
        plano = np.array([SG[lado] * self.X_PE, Y_TORN, self.Z_PE])               # tornozelo com o pé chato
        H = plano - desl(Z_CALC_TORN, Y_TORN, yaw)                                  # calcanhar no chão
        J = H + desl(Z_CALC_TORN + Z_JUNTA_TORN, Y_JUNTA, yaw)                      # junta da ponteira (pivô do impulso e do pouso)
        dz, dy = giro_zy(JP, th)
        return J - desl(dz, dy, yaw)

    def _altura_quadril(self, ank, fr):
        dx = abs(SG['E'] * 0.09 - ank[0])
        dz = abs(0.0 - ank[2])
        return ank[1] + math.sqrt((fr * ALCANCE) ** 2 - dx * dx - dz * dz)

    def quad(self, t):
        if t < self.t_agacha:
            y = self._baixo_ini(t)
        elif t < self.t_dec:
            y = self._sobe(t)
        elif t < self.t_pouso:
            u = t - self.t_dec
            y = self.y_dec + self.vy * u - 0.5 * G * u * u
        elif t < self.t_pouso + 0.19:
            y = self._amorte(t)
        else:
            y = self._levanta(t)
        pit = float(self._pit_pelve(t))
        return np.array([0.0, y, float(self._z(t))]), (pit, 0.0, 0.0)

    def hip(self, t, lado):
        pos, rot = self.quad(t)
        return pos + qrot(qeuler(*rot), LOCAL['Coxa' + lado])

    def pe(self, t, lado):
        sg = SG[lado]
        yaw = sg * 0.09
        if t < self.t_calc:
            return {'tornozelo': np.array([sg * self.X_PE, Y_TORN, self.Z_PE]), 'pitch': 0.0, 'yaw': yaw, 'dedos': 0.0}
        if t < self.t_dec:
            th = self.TH_DEC * suave((t - self.t_calc) / (self.t_dec - self.t_calc))
            return {'tornozelo': self._ank_bola(th, lado), 'pitch': th, 'yaw': yaw, 'dedos': -th}
        if t < self.t_pouso:
            a0 = self._ank_bola(self.TH_DEC, lado) - self.hip(self.t_dec, lado)
            a1 = self._ank_bola(self.TH_POUSO, lado) - self.hip(self.t_pouso, lado)
            tuck = np.array([sg * 0.11 - sg * 0.09, -0.52, 0.15])
            off = spline([(self.t_dec, a0), (self.t_apice, tuck), (self.t_pouso, a1)])(t)
            th = float(spline([(self.t_dec, self.TH_DEC), (self.t_apice, 0.55), (self.t_pouso, self.TH_POUSO)])(t))
            dedos = float(spline([(self.t_dec, -self.TH_DEC), (self.t_apice, -0.15), (self.t_pouso, -self.TH_POUSO)])(t))
            return {'tornozelo': self.hip(t, lado) + off, 'pitch': th, 'yaw': yaw, 'dedos': dedos}
        if t < self.t_pouso + self.t_rola:
            th = self.TH_POUSO * (1 - suave((t - self.t_pouso) / self.t_rola))
            return {'tornozelo': self._ank_bola(th, lado), 'pitch': th, 'yaw': yaw, 'dedos': -th}
        return {'tornozelo': np.array([sg * self.X_PE, Y_TORN, self.Z_PE]), 'pitch': 0.0, 'yaw': yaw, 'dedos': 0.0}

    def pose(self, t):
        pos, rot = self.quad(t)
        pes = {l: self.pe(t, l) for l in 'ED'}
        lean = float(self._lean(t))
        tot = lean - rot[0]
        esp = [(tot * 0.22, 0.0, 0.0), (tot * 0.33, 0.0, 0.0), (tot * 0.45, 0.0, 0.0)]
        br = {}
        for l in 'ED':
            sg = SG[l]
            br[l] = {'ombro': (0.0, 0.0, sg * float(self._sobe_ombro(t))),
                     'braco': (float(self._ombro(t)), 0.0, sg * float(self._abre(t))),
                     'antebraco': (-float(self._cot(t)), 0.0, 0.0), 'mao': (-0.10, 0.0, 0.0)}
        cab = qeuler(float(self._cab(t)), 0.0, 0.0)
        return {'quad_pos': pos, 'quad_rot': rot, 'espinha': esp, 'cabeca_mundo': cab, 'pe': pes, 'braco': br}


# ====================================================================== cachecol (simulação)
def simular_cachecol(frames, fps, vento_z, ciclos=6, sub=4, gust=0.0, T=None, laco=True):
    """cadeia de partículas presa ao pescoço, com gravidade, arrasto quadrático do ar relativo (o corpo anda a `vento_z` contra o ar),
    rigidez de dobra e colisão com as costas. Devolve, por frame do ciclo, a rotação local de cada osso Cachecol1..N (fundida para repetir sem emenda)."""
    n = len(frames) - 1
    N = NOS_CACHECOL
    A, QN, QC, PC = [], [], [], []
    for R, qp in frames[:n]:
        P, Q = fk(R, qp)
        A.append(P['Pescoco'] + qrot(Q['Pescoco'], LOCAL['Cachecol1']))
        QN.append(Q['Pescoco'])
        QC.append(Q['Peito'])
        PC.append(P['Peito'])
    A = np.array(A)
    dt = 1.0 / (fps * sub)
    x = np.array([A[0] + np.array([0.0, -SEG_CACHECOL * i, 0.0]) for i in range(N + 1)])
    xp = x.copy()
    saida = []
    total = ciclos * n * sub + 1
    kq, damp, rig = 2.6, 0.985, 0.05
    for st in range(total):
        fpos = (st / sub)
        k0 = int(fpos) % n
        k1 = (k0 + 1) % n
        a = fpos - int(fpos)
        raiz = A[k0] * (1 - a) + A[k1] * a
        tt = fpos / fps
        wind = np.array([gust * math.sin(2 * math.pi * 3.0 * tt / (T or 1.0)), 0.0, vento_z])
        for i in range(1, N + 1):
            vel = (x[i] - xp[i]) / dt
            rel = wind - vel
            acc = np.array([0.0, -G, 0.0]) + kq * np.linalg.norm(rel) * rel
            nx = x[i] + (x[i] - xp[i]) * damp + acc * dt * dt
            xp[i] = x[i]
            x[i] = nx
        x[0] = raiz
        xp[0] = raiz
        Qc, Pc = QC[k0], PC[k0]
        for _ in range(4):
            for i in range(1, N + 1):
                d = x[i] - x[i - 1]
                ln = np.linalg.norm(d)
                dirn = d / max(ln, 1e-9)
                if i >= 2:                                         # rigidez: puxa para a continuação do segmento anterior
                    prev = x[i - 1] - x[i - 2]
                    prev = prev / max(np.linalg.norm(prev), 1e-9)
                    alvo = x[i - 1] + prev * SEG_CACHECOL
                    x[i] = x[i] + (alvo - x[i]) * rig
                    d = x[i] - x[i - 1]
                    dirn = d / max(np.linalg.norm(d), 1e-9)
                x[i] = x[i - 1] + dirn * SEG_CACHECOL
                # costas: não atravessa o tronco (plano atrás do peito, no sistema do Peito)
                loc = qrot(qconj(Qc), x[i] - Pc)
                if -0.50 < loc[1] < 0.18 and abs(loc[0]) < 0.19 and loc[2] > -0.122:
                    loc[2] = -0.122
                    x[i] = Pc + qrot(Qc, loc)
        if st % sub == 0 and st >= (ciclos - 2) * n * sub:
            saida.append(x.copy())
    saida = np.array(saida)                                      # (2n+1, N+1, 3): dois últimos ciclos e o primeiro quadro do seguinte
    # funde os dois ciclos: no quadro 0 vale o início do ciclo seguinte, no quadro n vale o fim do ciclo anterior (são o mesmo instante)
    res = []
    for k in range(n + 1):
        w = suave(k / n)
        res.append(saida[k + n] * (1 - w) + saida[k] * w)
    res = np.array(res)
    if laco:                                                     # suaviza o tremor da simulação (média de 5 quadros, cíclica)
        ext = np.concatenate([res[-3:-1], res[:-1], res[1:3]])
        suav = sum(ext[i:i + n] * wt for i, wt in enumerate((0.1, 0.2, 0.4, 0.2, 0.1)))
        res = np.concatenate([suav, suav[:1]])
    else:
        res = np.concatenate([res[:1], (res[:-2] + 2 * res[1:-1] + res[2:]) / 4, res[-1:]])
    # posições -> rotações locais dos ossos
    rest_dir = np.array([0.0, -1.0, 0.0])
    rots = []
    for k, pos in enumerate(res):
        R, qp = frames[k]
        P, Q = fk(R, qp)
        Qpai = Q['Pescoco']
        out = {}
        for i in range(1, N + 1):
            d = pos[i] - pos[i - 1]
            Qw = qarco(rest_dir, d / np.linalg.norm(d))
            out['Cachecol%d' % i] = qmul(qconj(Qpai), Qw)
            Qpai = Qw
        rots.append(out)
    return rots


# ====================================================================== amostragem dos clipes
def amostrar(fn_pose, T, fps, laco=True):
    """fn_pose(t) -> dict de pose; devolve a lista de (rotações locais, posição do Quadril) em t = 0, 1/fps, ..., T"""
    n = int(round(T * fps))
    frames = []
    for k in range(n + 1):
        t = (k % n) / fps if laco else k / fps
        R, qp = montar_pose(fn_pose(t))
        frames.append((R, qp))
    return frames


def com_cachecol(frames, fps, vento, T, gust):
    cs = simular_cachecol(frames, fps, -vento, T=T, gust=gust)
    for (R, qp), c in zip(frames, cs):
        R.update(c)
    return frames


def clipe_marcha(par, fps=60):
    m = Marcha(par)
    fr = amostrar(lambda t: m.pose((t / par.T) % 1.0), par.T, fps)
    fr = com_cachecol(fr, fps, par.v, par.T, gust=0.35 if par.v > 2 else 0.12)
    return {'nome': par.nome, 'T': par.T, 'fps': fps, 'frames': fr,
            'info': {'duracao': par.T, 'laco': True, 'velocidade': par.v, 'passada_m': par.v * par.T, 'passos_por_s': 2.0 / par.T}}


def clipe_parado(fps=30):
    c = Parado()
    fr = amostrar(c.pose, c.T, fps)
    fr = com_cachecol(fr, fps, 0.0, c.T, gust=0.0)
    return {'nome': c.nome, 'T': c.T, 'fps': fps, 'frames': fr, 'info': {'duracao': c.T, 'laco': True, 'velocidade': 0.0}}


def clipe_pulo(fps=60):
    c = Pulo()
    fr = amostrar(c.pose, c.T, fps, laco=False)
    # o pulo não repete sozinho, mas começa e termina de pé: o cachecol é simulado com o pulo repetido
    n = len(fr) - 1
    cs = simular_cachecol(fr, fps, 0.0, T=c.T, laco=False)
    for (R, qp), cc in zip(fr, cs):
        R.update(cc)
    return {'nome': c.nome, 'T': c.T, 'fps': fps, 'frames': fr,
            'info': {'duracao': c.T, 'laco': False, 'velocidade': 0.0, 'altura_m': float(c.vy ** 2 / (2 * G)), 'decolagem_s': c.t_dec, 'pouso_s': c.t_pouso}}


def todos_os_clipes():
    return [clipe_parado(), clipe_marcha(ANDAR), clipe_marcha(CORRER), clipe_pulo()]
