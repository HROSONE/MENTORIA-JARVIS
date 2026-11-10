"""Animações do elenco, geradas por código a partir do esqueleto de cada personagem (mesmo método do Corredor, generalizado).

* Andar / Correr / Fugir: ciclo de marcha com IK de duas juntas; o pé de apoio fica PARADO no chão (calcanhar -> pé chato -> junta da ponteira).
  Distâncias, tempos e velocidades escalam com o comprimento da perna (semelhança de Froude); cada personagem tem seu estilo (inclinação,
  balanço dos braços, cabeça, passada).
* Parado: respiração, troca de peso, olhar. Assustado: encolhido e tremendo. Pular: agacha, voo balístico, aterrissa.
* Bengala (velha): a mão direita é IK e a ponta da bengala fica plantada no chão, andando junto com o corpo.
* Cabelos e fitas com ossos (maria-chiquinha, cabelo comprido) são simulados (partículas com vento relativo) e fundidos para repetir sem emenda.
Os ossos do rosto não entram nos clipes: o rosto é comandado à parte (elenco.js)."""
import math
from types import SimpleNamespace
import numpy as np
from mat3 import (ID, qmul, qconj, qeixo, QX, qeuler, qrot, qarco, qslerp, suave, suave5, lerp, hermite, spline, ik2)

G = 9.81
SG = {'E': 1.0, 'D': -1.0}
REF_PERNA = 0.8708                                   # perna (quadril -> tornozelo) do adulto de referência


class Ctx:
    """medidas do esqueleto usadas pelas animações"""

    def __init__(self, esq, cane=False):
        e = self.e = esq
        self.L1, self.L2, self.LB1, self.LB2 = e.L1, e.L2, e.LB1, e.LB2
        self.ALC = (self.L1 + self.L2) * 0.9995
        self.kL = (self.L1 + self.L2) / REF_PERNA
        self.quad_y = float(e.rep['Quadril'][1])
        self.hip_x = float(e.rep['CoxaE'][0])
        self.HP = (float(e.PE_CALC[2]), float(e.PE_CALC[1]))                 # (z, y) do calcanhar em relação ao tornozelo
        self.JP = (float(e.PE_JUNTA[2]), float(e.PE_JUNTA[1]))               # junta da ponteira
        self.Z_CALC = -self.HP[0]
        self.Z_JUNTA = self.JP[0]
        self.Y_TORN = -self.HP[1]
        self.Y_JUNTA = self.Y_TORN + self.JP[1]
        self.cane = cane
        if cane:
            w = e.rep['MaoD']
            self.cane_d = np.array([-0.012, -float(w[1]), 0.0])              # da mão (repouso) até a ponta da bengala
        self.cadeias = e.cadeias


def giro_zy(zy, th):
    z, y = zy
    return (y * math.sin(th) + z * math.cos(th), y * math.cos(th) - z * math.sin(th))


def desl(dz, dy, yaw):
    return np.array([dz * math.sin(yaw), dy, dz * math.cos(yaw)])


def smax(a, b, eps=0.05):
    return 0.5 * (a + b + math.sqrt((a - b) ** 2 + eps * eps))


def sola_min_y(ctx, th, dedos):
    jz, jy = ctx.JP
    pts = [ctx.HP]
    dz, dy = giro_zy((0.0, -0.035 * ctx.e.pe_k), dedos)
    pts.append((jz + dz, jy + dy))
    dz, dy = giro_zy((0.100 * ctx.e.pe_k, -0.035 * ctx.e.pe_k), dedos)
    pts.append((jz + dz, jy + dy))
    return min(giro_zy(p, th)[1] for p in pts)


# ====================================================================== pose completa a partir de parâmetros
def montar_pose(ctx, p):
    """p: 'quad_pos', 'quad_rot', 'espinha' [3 x (rx,ry,rz)], 'cabeca_mundo' (quaternion), 'pe' {lado: ...}, 'braco' {lado: {...}} (FK) ou
    {'ik': {'pulso': ponto}} (bengala). Devolve (rotações locais, posição do Quadril)."""
    e = ctx.e
    R = {}
    quad_pos = np.asarray(p['quad_pos'], dtype=float)
    Qp = qeuler(*p['quad_rot'])
    R['Quadril'] = Qp
    Qc = Qp
    for nome, v in zip(('Coluna', 'Coluna2', 'Peito'), p['espinha']):
        R[nome] = qeuler(*v)
        Qc = qmul(Qc, R[nome])
    Rt = qmul(qconj(Qc), p['cabeca_mundo'])
    R['Pescoco'] = qslerp(ID, Rt, 0.4)
    R['Cabeca'] = qmul(qconj(R['Pescoco']), Rt)
    for lado in 'ED':
        R['Ombro' + lado] = qeuler(*p['braco'][lado].get('ombro', (0, 0, 0)))
    # pernas por IK
    for lado in 'ED':
        pe = p['pe'][lado]
        quadril = quad_pos + qrot(Qp, e.loc['Coxa' + lado])
        polo = np.array([SG[lado] * 0.10, 0.0, 1.0])
        joelho, torn, _ = ik2(quadril, pe['tornozelo'], ctx.L1, ctx.L2, polo)
        d0, s0 = e.D0[lado]
        d1 = (joelho - quadril) / np.linalg.norm(joelho - quadril)
        s1 = (torn - joelho) / np.linalg.norm(torn - joelho)
        tw = pe.get('torcao', SG[lado] * 0.07)
        Qt = qmul(qeixo(d1, tw), qarco(d0, d1))
        Qs = qmul(qeixo(s1, tw), qarco(s0, s1))
        R['Coxa' + lado] = qmul(qconj(Qp), Qt)
        R['Canela' + lado] = qmul(qconj(Qt), Qs)
        R['Pe' + lado] = qmul(qconj(Qs), qeuler(pe['pitch'], pe['yaw'], 0.0))
        R['Ponteira' + lado] = QX(pe['dedos'])
    # braços: FK ou IK
    precisa = any('ik' in p['braco'][l] for l in 'ED')
    if precisa:
        P, Q = e.fk(R, quad_pos)
    for lado in 'ED':
        b = p['braco'][lado]
        if 'ik' in b:
            sh = P['Braco' + lado]
            polo = np.array([SG[lado] * 0.45, 0.10, -1.0])
            cot, pul, _ = ik2(sh, b['ik']['pulso'], ctx.LB1, ctx.LB2, polo)
            u0 = e.rep['Antebraco' + lado] - e.rep['Braco' + lado]
            f0 = e.rep['Mao' + lado] - e.rep['Antebraco' + lado]
            u1, f1 = cot - sh, pul - cot
            Qu = qarco(u0, u1)
            Qf = qarco(f0, f1)
            Qparent = Q['Ombro' + lado]
            R['Braco' + lado] = qmul(qconj(Qparent), Qu)
            R['Antebraco' + lado] = qmul(qconj(Qu), Qf)
            R['Mao' + lado] = qmul(qconj(Qf), b['ik'].get('mao_mundo', ID))
        else:
            R['Braco' + lado] = qeuler(*b['braco'])
            R['Antebraco' + lado] = qeuler(*b['antebraco'])
            R['Mao' + lado] = qeuler(*b['mao'])
    if ctx.cane and 'ik' not in p['braco']['D']:                   # braço da bengala em FK (pular, assustado): a bengala continua pendurada na vertical
        P, Q = e.fk(R, quad_pos)
        R['MaoD'] = qconj(Q['AntebracoD'])
    return R, quad_pos


# ====================================================================== marcha
BASE_ANDAR = SimpleNamespace(
    nome='Andar', T=1.0, v=1.25, beta=0.62, zh0=0.20, x_pe=0.095, u_flat=0.12, u_ho=0.46, th_hs=-0.18, th_to=1.00, th_lim=1.05,
    off_y=0.03, quica=0.020, quica_fase=0.30, sway=0.028, yaw_pelve=0.075, roll_pelve=0.045, pitch_pelve=0.04,
    lean=0.06, yaw_ombro=0.17, roll_tronco=0.5, balanco_h=0.07, pico=0.45, kick=0.0,
    braco_amp=0.42, braco_bias=0.05, cotovelo=0.02, cotovelo_var=0.34, cotovelo_oscila=False, braco_adu=0.10, braco_fase=0.0, cabeca_segue=0.25,
    cab_roll=0.0, cab_yaw_amp=0.0, cab_pitch=0.0, cab_fixa_yaw=None, cane=False, cane_beta=0.60, cane_z0=0.24, cane_lift=0.06)
BASE_CORRER = SimpleNamespace(
    nome='Correr', T=0.72, v=3.2, beta=0.34, zh0=0.14, x_pe=0.075, u_flat=0.10, u_ho=0.40, th_hs=-0.12, th_to=0.95, th_lim=1.05,
    off_y=0.09, quica=0.034, quica_fase=None, sway=0.016, yaw_pelve=0.10, roll_pelve=0.06, pitch_pelve=0.10,
    lean=0.20, yaw_ombro=0.28, roll_tronco=0.6, balanco_h=0.32, pico=0.42, kick=0.9,
    braco_amp=0.55, braco_bias=0.0, cotovelo=1.30, cotovelo_var=0.30, cotovelo_oscila=True, braco_adu=0.30, braco_fase=0.06, cabeca_segue=0.30,
    cab_roll=0.0, cab_yaw_amp=0.0, cab_pitch=0.0, cab_fixa_yaw=None, cane=False, cane_beta=0.45, cane_z0=0.24, cane_lift=0.10)


def par_marcha(base, ctx, over=None):
    """escala a marcha de referência (adulto) para o esqueleto: tempos e velocidades por sqrt(perna), distâncias pela perna"""
    k, sq = ctx.kL, math.sqrt(ctx.kL)
    p = SimpleNamespace(**vars(base))
    p.T, p.v = base.T * sq, base.v * sq
    for nome in ('zh0', 'balanco_h', 'quica', 'sway'):
        setattr(p, nome, getattr(base, nome) * k)
    p.x_pe = ctx.hip_x * base.x_pe / 0.09
    p.y0 = ctx.quad_y - base.off_y * k
    for a, b in (over or {}).items():
        if a in ('T', 'v'):
            setattr(p, a, getattr(p, a) * b)                    # fatores sobre o valor escalado
        elif a in ('zh0', 'balanco_h', 'quica', 'sway', 'off_y'):
            setattr(p, a, getattr(p, a) * b)
        else:
            setattr(p, a, b)
    if 'off_y' in (over or {}):
        p.y0 = ctx.quad_y - base.off_y * (over['off_y']) * k
    return p


class Marcha:
    def __init__(self, ctx, par):
        self.c, self.p = ctx, par

    def quad(self, phi):
        p, c = self.p, 2 * math.pi
        if p.quica_fase is None:
            y = p.y0 - p.quica * math.cos(2 * c * (phi - p.beta / 2))
        else:
            y = p.y0 + p.quica * math.cos(2 * c * (phi - p.quica_fase))
        x = p.sway * math.sin(c * phi)
        rot = (p.pitch_pelve, -p.yaw_pelve * math.cos(c * phi), p.roll_pelve * math.sin(c * phi))
        return np.array([x, y, 0.0]), rot

    def quadril_mundo(self, phi, lado):
        pos, rot = self.quad(phi)
        return pos + qrot(qeuler(*rot), self.c.e.loc['Coxa' + lado])

    def apoio(self, u, phi_g, lado):
        p, c = self.p, self.c
        t = u * p.beta * p.T
        yaw = SG[lado] * 0.10
        H = np.array([SG[lado] * p.x_pe, 0.0, p.zh0 - p.v * t])
        dedos = 0.0
        if u < p.u_flat:
            th = p.th_hs * (1 - suave5(u / p.u_flat))
            dz, dy = giro_zy(c.HP, th)
            torn = H - desl(dz, dy, yaw)
        elif u < p.u_ho:
            th = 0.0
            torn = H + desl(c.Z_CALC, c.Y_TORN, yaw)
        else:
            q = (u - p.u_ho) / (1 - p.u_ho)
            th_nom = p.th_to * q ** 1.6
            J = H + desl(c.Z_CALC + c.Z_JUNTA, c.Y_JUNTA, yaw)
            quad = self.quadril_mundo(phi_g, lado)
            melhor, th_alc = None, 0.0
            for k in range(0, 71):
                thk = k * math.radians(1.0)
                dz, dy = giro_zy(c.JP, thk)
                tk = J - desl(dz, dy, yaw)
                dd = np.linalg.norm(tk - quad)
                if dd <= c.ALC:
                    th_alc, melhor = thk, tk
                    break
                if melhor is None or dd < np.linalg.norm(melhor - quad):
                    melhor, th_alc = tk, thk
            th = min(p.th_lim, smax(th_nom, th_alc, 0.06)) if q > 0 else 0.0
            dz, dy = giro_zy(c.JP, th)
            torn = J - desl(dz, dy, yaw)
            dedos = -th
        return torn, th, dedos

    def pe(self, phi, lado):
        p, c = self.p, self.c
        off = 0.0 if lado == 'E' else 0.5
        pf = (phi - off) % 1.0
        yaw = SG[lado] * 0.10
        if pf < p.beta:
            torn, th, dedos = self.apoio(pf / p.beta, phi, lado)
            return {'tornozelo': torn, 'pitch': th, 'yaw': yaw, 'dedos': dedos, 'apoio': True}
        s = (pf - p.beta) / (1 - p.beta)
        Tsw = (1 - p.beta) * p.T
        phi_to = (phi - (pf - p.beta)) % 1.0
        phi_hs = (phi + (1 - pf)) % 1.0
        eps = 0.004
        a0, th0, d0 = self.apoio(1.0, phi_to, lado)
        a0b, _, _ = self.apoio(1.0 - eps / p.beta, (phi_to - eps / p.T) % 1.0, lado)
        a1, th1, _ = self.apoio(0.0, phi_hs, lado)
        a1b, _, _ = self.apoio(eps / p.beta, (phi_hs + eps / p.T) % 1.0, lado)
        v0, v1 = (a0 - a0b) / eps, (a1b - a1) / eps
        pos = np.array([a0[0], 0.0, 0.0])
        for k in (1, 2):
            pos[k] = hermite(a0[k], a1[k], v0[k] * Tsw, v1[k] * Tsw, s)
        kk = math.log(0.5) / math.log(p.pico)
        lev = math.sin(math.pi * (s ** kk)) ** 2
        pos[1] += p.balanco_h * lev
        th = th1 + (th0 - th1) * (1 - suave5(s / 0.55)) + p.kick * lev
        dedos = lerp(d0, 0.0, suave(s * 2.5))
        folga = 0.012 * c.e.pe_k * suave(s / 0.15) * (1 - suave((s - 0.85) / 0.15))
        pos[1] = smax(pos[1], folga - sola_min_y(c, th, dedos), 0.012)
        return {'tornozelo': pos, 'pitch': th, 'yaw': yaw, 'dedos': dedos, 'apoio': False}

    def corpo(self, phi):
        p, c = self.p, 2 * math.pi
        pit_p, yaw_p, roll_p = self.quad(phi)[1]
        dy = p.yaw_ombro * math.cos(c * phi) - yaw_p
        dr = -p.roll_tronco * roll_p
        dp = p.lean - pit_p
        fr = (0.22, 0.33, 0.45)
        return [(dp * f, dy * f, dr * f) for f in fr]

    def bracos(self, phi):
        p, c = self.p, 2 * math.pi
        out = {}
        for lado in 'ED':
            sg = SG[lado]
            ph = (phi + (0.0 if lado == 'E' else 0.5) + p.braco_fase) % 1.0
            f = p.braco_amp * math.cos(c * (ph - 0.5)) - p.braco_bias
            avanco = math.cos(c * (ph - 0.5))
            cot = p.cotovelo + p.cotovelo_var * (0.5 * avanco if p.cotovelo_oscila else max(0.0, avanco))
            out[lado] = {'ombro': (0.0, 0.0, 0.0), 'braco': (-f - 0.6 * p.lean, 0.0, -sg * p.braco_adu), 'antebraco': (-cot, 0.0, 0.0), 'mao': (-0.12, 0.0, 0.0)}
        return out

    def ponta_bengala(self, phi):
        """ponta da bengala (referencial do corpo): plantada no chão e andando para trás; avança junto com o pé esquerdo"""
        p, c = self.p, self.c
        x = float(c.e.rep['MaoD'][0]) - 0.07
        beta = p.cane_beta
        z0 = p.cane_z0 * c.kL
        pf = phi % 1.0
        if pf < beta:
            return np.array([x, 0.0, z0 - p.v * pf * p.T])
        s = (pf - beta) / (1 - beta)
        Tsw = (1 - beta) * p.T
        z1 = z0 - p.v * beta * p.T
        z = hermite(z1, z0, -p.v * Tsw, -p.v * Tsw, s)
        y = p.cane_lift * c.kL * math.sin(math.pi * s) ** 2
        return np.array([x, y, z])

    def pose(self, phi):
        p, c = self.p, self.c
        e = c.e
        pos, rot = self.quad(phi)
        pes = {l: self.pe(phi, l) for l in 'ED'}
        for _ in range(3):
            falta = 0.0
            for l in 'ED':
                quadril = pos + qrot(qeuler(*rot), e.loc['Coxa' + l])
                if pes[l]['apoio']:
                    falta = max(falta, np.linalg.norm(pes[l]['tornozelo'] - quadril) - c.ALC)
            if falta <= 0:
                break
            pos[1] -= falta * 1.05
        esp = self.corpo(phi)
        Qc = qeuler(*rot)
        for v in esp:
            Qc = qmul(Qc, qeuler(*v))
        cab = qslerp(ID, Qc, p.cabeca_segue)
        yaw_h = (p.cab_fixa_yaw if p.cab_fixa_yaw is not None else 0.0) + p.cab_yaw_amp * math.sin(2 * math.pi * phi + 0.7)
        cab = qmul(qeuler(p.cab_pitch, yaw_h, p.cab_roll * math.sin(2 * math.pi * phi * 0 + 0.0) + p.cab_roll), cab)
        br = self.bracos(phi)
        if p.cane:
            br['D'] = {'ombro': (0.0, 0.0, 0.0), 'ik': {'pulso': self.ponta_bengala(phi) - c.cane_d}}
        return {'quad_pos': pos, 'quad_rot': rot, 'espinha': esp, 'cabeca_mundo': cab, 'pe': pes, 'braco': br}


# ====================================================================== parado
def _pes_parados(ctx, afasta=1.11, z=-0.010, yaw=0.09):
    return {l: {'tornozelo': np.array([SG[l] * ctx.hip_x * afasta, ctx.Y_TORN, z * ctx.kL]), 'pitch': 0.0, 'yaw': SG[l] * yaw, 'dedos': 0.0} for l in 'ED'}


class Parado:
    nome = 'Parado'

    def __init__(self, ctx, est=None):
        self.c = ctx
        self.est = SimpleNamespace(T=4.0, sway=0.010, roll=0.020, resp=1.0, cab_yaw=0.17, cab_pitch=0.05, cab_roll=0.02, lean=0.0, joelho=0.014, braco_x=0.035,
                                   cotovelo=0.03, ombro_cai=0.0, cane=False, inquieto=1.0)
        for k, v in (est or {}).items():
            setattr(self.est, k, v)
        self.T = self.est.T
        self.v = 0.0

    def pose(self, t):
        c, s = self.c, self.est
        w = 2 * math.pi / self.T
        s1, s2 = math.sin(w * t), math.sin(2 * w * t)
        resp = 0.5 - 0.5 * math.cos(w * t)
        pos = np.array([s.sway * c.kL * s1, c.quad_y - s.joelho * c.kL + 0.003 * c.kL * resp, 0.0])
        rot = (0.03 + 0.3 * s.lean, 0.025 * s.inquieto * math.sin(w * t + 1.0), s.roll * s1)
        tot = s.lean * 0.7
        esp = [(-0.004 * resp + 0.02 + tot * 0.22, 0.0, -0.4 * rot[2]), (-0.014 * resp + 0.02 + tot * 0.33, 0.0, -0.3 * rot[2]), (-0.024 * resp + 0.01 + tot * 0.45, 0.0, -0.3 * rot[2])]
        br = {}
        for l in 'ED':
            ph = 0.0 if l == 'E' else 1.3
            br[l] = {'ombro': (0.0, 0.0, SG[l] * (0.012 * resp - s.ombro_cai)), 'braco': (s.braco_x * math.sin(w * t + ph), 0.0, -SG[l] * 0.02),
                     'antebraco': (-s.cotovelo + 0.03 * math.sin(w * t + ph + 0.8), 0.0, 0.0), 'mao': (-0.08, 0.0, 0.0)}
        if s.cane:
            tip = np.array([float(c.e.rep['MaoD'][0]) - 0.07, 0.0, float(c.e.rep['MaoD'][2]) + 0.02])
            br['D'] = {'ombro': (0.0, 0.0, 0.0), 'ik': {'pulso': tip - c.cane_d}}
        cab = qeuler(s.cab_pitch * s2 + 0.02, s.cab_yaw * math.sin(w * t + 0.5), s.cab_roll * math.sin(w * t + 2.0) + 0.0)
        return {'quad_pos': pos, 'quad_rot': rot, 'espinha': esp, 'cabeca_mundo': cab, 'pe': _pes_parados(c), 'braco': br}


class Assustado:
    nome = 'Assustado'

    def __init__(self, ctx, est=None):
        self.c = ctx
        self.est = SimpleNamespace(T=1.2, agacha=0.07, tremor=1.0)
        for k, v in (est or {}).items():
            setattr(self.est, k, v)
        self.T = self.est.T
        self.v = 0.0

    def pose(self, t):
        c, s = self.c, self.est
        w = 2 * math.pi / self.T
        tr = lambda f, a, ph=0.0: s.tremor * a * math.sin(2 * math.pi * f * t / self.T + ph)
        pos = np.array([tr(10, 0.004 * c.kL, 0.3), c.quad_y - s.agacha * c.kL + tr(5, 0.002 * c.kL), -0.035 * c.kL])
        rot = (0.20 + tr(10, 0.02, 1.0), tr(5, 0.04), tr(10, 0.03, 2.0))
        esp = [(-0.10 + tr(10, 0.02, 0.5), 0.0, tr(10, 0.02)), (-0.14 + tr(10, 0.02, 1.5), 0.0, 0.0), (-0.12, 0.0, 0.0)]
        br = {}
        for l in 'ED':
            sg = SG[l]
            ph = 0.0 if l == 'E' else 1.7
            br[l] = {'ombro': (0.0, 0.0, sg * 0.14), 'braco': (-0.95 + tr(10, 0.05, ph), 0.0, -sg * 0.42 + tr(10, 0.04, ph)), 'antebraco': (-1.95 + tr(10, 0.06, ph + 1), 0.0, 0.0), 'mao': (-0.25, 0.0, 0.0)}
        cab = qeuler(-0.20 + tr(10, 0.02), 0.35 * math.sin(w * t * 2) + tr(10, 0.03, 0.7), 0.10 + tr(10, 0.02, 1.2))
        pes = _pes_parados(c, afasta=0.95, z=-0.01, yaw=-0.12)
        return {'quad_pos': pos, 'quad_rot': rot, 'espinha': esp, 'cabeca_mundo': cab, 'pe': pes, 'braco': br}


# ====================================================================== pulo
class Pulo:
    nome = 'Pular'

    def __init__(self, ctx, escala=1.0):
        self.c = ctx
        e = ctx.e
        ts = math.sqrt(ctx.kL) * escala
        k = ctx.kL
        self.v = 0.0
        self.T = 1.75 * ts
        self.t_agacha, self.t_calc, self.t_dec, self.t_apice, self.t_pouso, self.t_rola = (x * ts for x in (0.42, 0.50, 0.60, 0.86, 1.12, 0.09))
        self.TH_DEC, self.TH_POUSO = 0.95, 0.30
        self.X_PE, self.Z_PE = ctx.hip_x * 1.11, -0.010 * k
        self.off_q = float(e.rep['Quadril'][1] - e.rep['CoxaE'][1])
        Tf = self.t_pouso - self.t_dec
        self.y_dec = self._altura_quadril(self._ank_bola(self.TH_DEC, 'E'), 0.995) + self.off_q
        self.y_pou = self._altura_quadril(self._ank_bola(self.TH_POUSO, 'E'), 0.985) + self.off_q
        self.vy = (self.y_pou - self.y_dec) / Tf + G * Tf / 2
        qy = ctx.quad_y
        y_stand, y_baixo, y_amort, y_alto = qy - 0.014 * k, qy - 0.29 * k, qy - 0.25 * k, qy - 0.035 * k
        h = self.t_dec - self.t_agacha
        self._sobe = lambda t: hermite(y_baixo, self.y_dec, 0.0, self.vy * h, (t - self.t_agacha) / h)
        v_pouso = self.vy - G * Tf
        h2 = 0.19 * ts
        self.h2 = h2
        self._amorte = lambda t: hermite(self.y_pou, y_amort, v_pouso * h2, 0.0, (t - self.t_pouso) / h2)
        self._baixo_ini = spline([(0.0, y_stand), (0.10 * ts, y_stand), (self.t_agacha, y_baixo)])
        self._levanta = spline([(self.t_pouso + h2, y_amort), (1.52 * ts, y_alto), (self.T, y_stand)])
        T_, a, d, ap, po = self.T, self.t_agacha, self.t_dec, self.t_apice, self.t_pouso
        sp = lambda *ks: spline([(t * ts if isinstance(t, tuple) else t, v) for t, v in ks])
        self._z = spline([(0.0, 0.0), (0.10 * ts, 0.0), (a, -0.12 * k), (d, -0.01 * k), (po, 0.0), (po + h2, -0.10 * k), (T_, 0.0)])
        self._lean = spline([(0.0, 0.04), (0.10 * ts, 0.06), (a, 0.60), (d, 0.12), (ap, 0.22), (po, 0.16), (po + h2, 0.56), (T_, 0.04)])
        self._ombro = spline([(0.0, 0.0), (0.10 * ts, 0.25), (a, 1.05), (d, -2.55), (ap, -2.75), (po, -2.05), (po + h2, -0.80), (1.50 * ts, -0.15), (T_, 0.0)])
        self._cot = spline([(0.0, 0.0), (a, 0.45), (d, 0.15), (ap, 0.35), (po, 0.45), (po + h2, 0.75), (T_, 0.0)])
        self._abre = spline([(0.0, 0.0), (a, 0.0), (d, 0.28), (ap, 0.45), (po, 0.30), (po + 0.2 * ts, 0.05), (T_, 0.0)])
        self._sobe_ombro = spline([(0.0, 0.0), (a, 0.0), (d, 0.20), (ap, 0.28), (po, 0.18), (po + 0.25 * ts, 0.0), (T_, 0.0)])
        self._pit_pelve = spline([(0.0, 0.03), (a, 0.42), (d, 0.06), (po, 0.08), (po + h2, 0.40), (T_, 0.03)])
        self._cab = spline([(0.0, 0.0), (a, -0.18), (d, -0.05), (ap, -0.10), (po + h2, -0.12), (T_, 0.0)])

    def _ank_bola(self, th, lado):
        c = self.c
        yaw = SG[lado] * 0.09
        plano = np.array([SG[lado] * self.X_PE, c.Y_TORN, self.Z_PE])
        H = plano - desl(c.Z_CALC, c.Y_TORN, yaw)
        J = H + desl(c.Z_CALC + c.Z_JUNTA, c.Y_JUNTA, yaw)
        dz, dy = giro_zy(c.JP, th)
        return J - desl(dz, dy, yaw)

    def _altura_quadril(self, ank, fr):
        dx = abs(self.c.hip_x - ank[0])
        dz = abs(ank[2])
        return ank[1] + math.sqrt((fr * self.c.ALC) ** 2 - dx * dx - dz * dz)

    def quad(self, t):
        if t < self.t_agacha:
            y = self._baixo_ini(t)
        elif t < self.t_dec:
            y = self._sobe(t)
        elif t < self.t_pouso:
            u = t - self.t_dec
            y = self.y_dec + self.vy * u - 0.5 * G * u * u
        elif t < self.t_pouso + self.h2:
            y = self._amorte(t)
        else:
            y = self._levanta(t)
        return np.array([0.0, y, float(self._z(t))]), (float(self._pit_pelve(t)), 0.0, 0.0)

    def hip(self, t, lado):
        pos, rot = self.quad(t)
        return pos + qrot(qeuler(*rot), self.c.e.loc['Coxa' + lado])

    def pe(self, t, lado):
        c = self.c
        sg = SG[lado]
        yaw = sg * 0.09
        if t < self.t_calc:
            return {'tornozelo': np.array([sg * self.X_PE, c.Y_TORN, self.Z_PE]), 'pitch': 0.0, 'yaw': yaw, 'dedos': 0.0}
        if t < self.t_dec:
            th = self.TH_DEC * suave((t - self.t_calc) / (self.t_dec - self.t_calc))
            return {'tornozelo': self._ank_bola(th, lado), 'pitch': th, 'yaw': yaw, 'dedos': -th}
        if t < self.t_pouso:
            a0 = self._ank_bola(self.TH_DEC, lado) - self.hip(self.t_dec, lado)
            a1 = self._ank_bola(self.TH_POUSO, lado) - self.hip(self.t_pouso, lado)
            tuck = np.array([sg * 0.02 * c.kL, -0.52 * c.kL, 0.15 * c.kL])
            off = spline([(self.t_dec, a0), (self.t_apice, tuck), (self.t_pouso, a1)])(t)
            th = float(spline([(self.t_dec, self.TH_DEC), (self.t_apice, 0.55), (self.t_pouso, self.TH_POUSO)])(t))
            dedos = float(spline([(self.t_dec, -self.TH_DEC), (self.t_apice, -0.15), (self.t_pouso, -self.TH_POUSO)])(t))
            return {'tornozelo': self.hip(t, lado) + off, 'pitch': th, 'yaw': yaw, 'dedos': dedos}
        if t < self.t_pouso + self.t_rola:
            th = self.TH_POUSO * (1 - suave((t - self.t_pouso) / self.t_rola))
            return {'tornozelo': self._ank_bola(th, lado), 'pitch': th, 'yaw': yaw, 'dedos': -th}
        return {'tornozelo': np.array([sg * self.X_PE, c.Y_TORN, self.Z_PE]), 'pitch': 0.0, 'yaw': yaw, 'dedos': 0.0}

    def pose(self, t):
        pos, rot = self.quad(t)
        pes = {l: self.pe(t, l) for l in 'ED'}
        lean = float(self._lean(t))
        tot = lean - rot[0]
        esp = [(tot * 0.22, 0.0, 0.0), (tot * 0.33, 0.0, 0.0), (tot * 0.45, 0.0, 0.0)]
        br = {l: {'ombro': (0.0, 0.0, SG[l] * float(self._sobe_ombro(t))), 'braco': (float(self._ombro(t)), 0.0, SG[l] * float(self._abre(t))),
                  'antebraco': (-float(self._cot(t)), 0.0, 0.0), 'mao': (-0.10, 0.0, 0.0)} for l in 'ED'}
        return {'quad_pos': pos, 'quad_rot': rot, 'espinha': esp, 'cabeca_mundo': qeuler(float(self._cab(t)), 0.0, 0.0), 'pe': pes, 'braco': br}


# ====================================================================== cadeias de cabelo / fita (simulação)
def simular_cadeia(ctx, frames, fps, nome, vento_z, T, laco=True, ciclos=6, sub=4):
    e = ctx.e
    ch = e.cadeias[nome]
    par = dict(rig=0.12, kq=1.8, damp=0.985, torcao=0.0, grav=1.0, gust=0.2)
    par.update(ch.get('par', {}))
    ossos, pts0, pai = ch['ossos'], ch['pontos'], ch['pai']
    M = len(ossos)
    segs = np.linalg.norm(np.diff(pts0, axis=0), axis=1)
    n = len(frames) - 1
    A, QP, PC, QC, PH, QH = [], [], [], [], [], []
    for R, qp in frames[:n]:
        P, Q = e.fk(R, qp)
        A.append(P[ossos[0]])
        QP.append(Q[pai])
        PC.append(P['Peito']); QC.append(Q['Peito'])
        PH.append(P['Cabeca']); QH.append(Q['Cabeca'])
    A = np.array(A)
    k_e = e.par
    elip = [(PC, QC, np.array([0.0, 0.0, 0.0]), np.array([0.17 * k_e['ombros'] + 0.05, 0.30 * k_e['tronco'] + 0.05, 0.115 * (0.6 + 0.4 * k_e['tronco']) + 0.04]))]
    dt = 1.0 / (fps * sub)
    x = np.array([A[0] + (pts0[i] - pts0[0]) for i in range(M + 1)])
    xp = x.copy()
    saida = []
    total = ciclos * n * sub + 1
    for st in range(total):
        fpos = st / sub
        k0 = int(fpos) % n
        k1 = (k0 + 1) % n
        a = fpos - int(fpos)
        raiz = A[k0] * (1 - a) + A[k1] * a
        tt = fpos / fps
        wind = np.array([par['gust'] * math.sin(2 * math.pi * 3.0 * tt / T), 0.0, vento_z])
        for i in range(1, M + 1):
            vel = (x[i] - xp[i]) / dt
            rel = wind - vel
            acc = np.array([0.0, -G * par['grav'], 0.0]) + par['kq'] * np.linalg.norm(rel) * rel
            nx = x[i] + (x[i] - xp[i]) * par['damp'] + acc * dt * dt
            xp[i] = x[i]
            x[i] = nx
        x[0] = raiz
        xp[0] = raiz
        for _ in range(4):
            for i in range(1, M + 1):
                d = x[i] - x[i - 1]
                dirn = d / max(np.linalg.norm(d), 1e-9)
                if i >= 2:
                    prev = x[i - 1] - x[i - 2]
                    prev = prev / max(np.linalg.norm(prev), 1e-9)
                    x[i] = x[i] + ((x[i - 1] + prev * segs[i - 1]) - x[i]) * par['rig']
                    d = x[i] - x[i - 1]
                    dirn = d / max(np.linalg.norm(d), 1e-9)
                elif par['rig'] > 0:                                       # o primeiro segmento acompanha a raiz do cabelo (rigidez maior)
                    ref = qrot(QP[k0], (pts0[1] - pts0[0]) / max(np.linalg.norm(pts0[1] - pts0[0]), 1e-9))
                    dirn = (dirn + ref * par['rig'] * 2.5)
                    dirn = dirn / np.linalg.norm(dirn)
                x[i] = x[i - 1] + dirn * segs[i - 1]
                for (PCs, QCs, c0, rad) in elip:
                    loc = qrot(qconj(QCs[k0]), x[i] - PCs[k0]) - c0
                    kk = math.sqrt((loc[0] / rad[0]) ** 2 + (loc[1] / rad[1]) ** 2 + (loc[2] / rad[2]) ** 2)
                    if kk < 1.0:
                        loc = loc / max(kk, 1e-6)
                        x[i] = PCs[k0] + qrot(QCs[k0], loc + c0)
                loc = qrot(qconj(QH[k0]), x[i] - PH[k0]) - np.array([0.0, 0.05, 0.0])
                rh = np.array([0.10 * e.par['cabeca'], 0.12 * e.par['cabeca'], 0.11 * e.par['cabeca']])
                kk = math.sqrt((loc[0] / rh[0]) ** 2 + (loc[1] / rh[1]) ** 2 + (loc[2] / rh[2]) ** 2)
                if kk < 1.0:
                    loc = loc / max(kk, 1e-6)
                    x[i] = PH[k0] + qrot(QH[k0], loc + np.array([0.0, 0.05, 0.0]))
        if st % sub == 0 and st >= (ciclos - 2) * n * sub:
            saida.append(x.copy())
    saida = np.array(saida)
    res = np.array([saida[k + n] * (1 - suave(k / n)) + saida[k] * suave(k / n) for k in range(n + 1)])
    if laco:
        ext = np.concatenate([res[-3:-1], res[:-1], res[1:3]])
        suav = sum(ext[i:i + n] * wt for i, wt in enumerate((0.1, 0.2, 0.4, 0.2, 0.1)))
        res = np.concatenate([suav, suav[:1]])
    else:
        ext = np.concatenate([res[:1], res[:1], res, res[-1:], res[-1:]])
        res = sum(ext[i:i + len(res)] * wt for i, wt in enumerate((0.1, 0.2, 0.4, 0.2, 0.1)))
    rots = []
    for k, pos in enumerate(res):
        R, qp = frames[k]
        P, Q = e.fk(R, qp)
        Qpai = Q[pai]
        tw = par['torcao']
        out = {}
        for j in range(M):
            rest = (pts0[j + 1] - pts0[j]) / np.linalg.norm(pts0[j + 1] - pts0[j])
            d = pos[j + 1] - pos[j]
            dn = d / np.linalg.norm(d)
            giro = tw * (0.45 * j + 0.9 * math.sin(2 * math.pi * 2 * (k % n) / fps / T - 1.1 * j)) if tw else 0.0
            Qw = qmul(qeixo(dn, giro), qarco(rest, dn))
            out[ossos[j]] = qmul(qconj(Qpai), Qw)
            Qpai = Qw
        rots.append(out)
    return rots


# ====================================================================== clipes
def amostrar(ctx, fn_pose, T, fps, laco=True):
    n = int(round(T * fps))
    frames = []
    for k in range(n + 1):
        t = (k % n) / fps if laco else k / fps
        frames.append(montar_pose(ctx, fn_pose(t)))
    return frames


def com_cadeias(ctx, frames, fps, vento, T, laco=True):
    for nome in ctx.cadeias:
        cs = simular_cadeia(ctx, frames, fps, nome, -vento, T, laco=laco)
        for (R, _), c in zip(frames, cs):
            R.update(c)
    return frames


def clipe_marcha(ctx, base, nome, over=None, fps=60):
    par = par_marcha(base, ctx, over)
    par.T = round(par.T * fps) / fps                      # ciclo com número inteiro de quadros: o laço fecha sem salto de fase
    m = Marcha(ctx, par)
    fr = amostrar(ctx, lambda t: m.pose((t / par.T) % 1.0), par.T, fps)
    fr = com_cadeias(ctx, fr, fps, par.v, par.T)
    return {'nome': nome, 'T': par.T, 'fps': fps, 'frames': fr,
            'info': {'duracao': par.T, 'laco': True, 'velocidade': par.v, 'passada_m': par.v * par.T, 'passos_por_s': 2.0 / par.T}}


def clipe_estatico(ctx, obj, fps=30, laco=True, vento=0.0):
    fr = amostrar(ctx, obj.pose, obj.T, fps, laco=laco)
    fr = com_cadeias(ctx, fr, fps, vento, obj.T, laco=laco)
    return {'nome': obj.nome, 'T': obj.T, 'fps': fps, 'frames': fr, 'info': {'duracao': obj.T, 'laco': laco, 'velocidade': 0.0}}


def todos_os_clipes(e, estilo=None):
    est = estilo or {}
    ctx = Ctx(e, cane=bool(est.get('cane')))
    cane = {'cane': True} if est.get('cane') else {}
    clipes = [clipe_estatico(ctx, Parado(ctx, dict(est.get('parado', {}), cane=bool(est.get('cane')))), 30)]
    clipes.append(clipe_marcha(ctx, BASE_ANDAR, 'Andar', dict(est.get('andar', {}), **cane)))
    clipes.append(clipe_marcha(ctx, BASE_CORRER, 'Correr', dict(est.get('correr', {}), **cane)))
    if est.get('fugir', True) is not None:
        clipes.append(clipe_marcha(ctx, BASE_CORRER, 'Fugir', dict(FUGIR, **est.get('fugir', {}), **cane)))
    pulo = Pulo(ctx, est.get('pulo', 1.0))
    fr = amostrar(ctx, pulo.pose, pulo.T, 60, laco=False)
    fr = com_cadeias(ctx, fr, 60, 0.0, pulo.T, laco=False)
    clipes.append({'nome': 'Pular', 'T': pulo.T, 'fps': 60, 'frames': fr,
                   'info': {'duracao': pulo.T, 'laco': False, 'velocidade': 0.0, 'altura_m': float(pulo.vy ** 2 / (2 * G)), 'decolagem_s': pulo.t_dec, 'pouso_s': pulo.t_pouso}})
    clipes.append(clipe_estatico(ctx, Assustado(ctx, est.get('assustado', {})), 30))
    return clipes


FUGIR = {'braco_amp': 0.95, 'cotovelo': 0.85, 'cotovelo_var': 0.22, 'lean': 0.30, 'cab_fixa_yaw': 1.15, 'cabeca_segue': 0.10, 'v': 1.18, 'balanco_h': 1.15, 'braco_adu': 0.12,
         'yaw_ombro': 0.40, 'pitch_pelve': 0.14}
