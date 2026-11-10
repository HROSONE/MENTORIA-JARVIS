"""Corpo do elenco: envelopes do tronco, braços e pernas (nus), cascas de roupa (camisa, jaqueta, calça, saia, capuz), pescoço, mãos com dedos e sapatos.
Tudo é construído em torno do esqueleto `Esq` e escalonado por ele; as roupas são cascas um pouco maiores que o corpo."""
import math
import numpy as np
from forma import loft, elipsoide, tubo, caminho, nos, osso, suave, unit, X_, Y_, Z_

# envelopes do corpo de um adulto de referência (raios em metros)
T_TAB = np.array([(-0.28, .118, .088, -.004), (-0.12, .143, .096, -.007), (0.00, .147, .097, -.006), (0.17, .130, .087, .000), (0.44, .141, .092, .006),
                  (0.73, .158, .102, .010), (0.90, .150, .094, .004), (0.96, .118, .082, -.002), (1.00, .078, .068, -.006)])
BRACO_TAB = np.array([(-0.20, 0.0, 0.0), (-0.14, .036, .040), (-0.06, .054, .058), (0.04, .060, .063), (0.20, .054, .058), (0.45, .047, .050), (0.75, .042, .045),
                      (0.95, .038, .041), (1.0, .037, .041), (1.10, .040, .044), (1.35, .040, .042), (1.65, .032, .034), (1.82, .027, .029), (2.0, .025, .027), (2.06, .024, .026)])
PERNA_TAB = np.array([(-0.12, .066, .070), (0.0, .076, .080), (0.15, .082, .086), (0.40, .082, .086), (0.70, .068, .073), (0.92, .056, .061), (1.0, .054, .060),
                      (1.10, .054, .062), (1.35, .053, .064), (1.65, .045, .052), (1.86, .035, .041), (2.0, .033, .038), (2.12, .031, .036)])


class Corpo:
    def __init__(self, esq, k_ombro=1.0, k_quad=1.0, k_peito=1.0, k_cintura=1.0, k_barriga=0.0, k_braco=1.0, k_perna=1.0, k_pesc=1.0, k_mao=None):
        self.e = esq
        self.k = dict(ombro=k_ombro, quad=k_quad, peito=k_peito, cintura=k_cintura, barriga=k_barriga, braco=k_braco, perna=k_perna, pesc=k_pesc)
        self.k_mao = k_mao if k_mao is not None else k_braco
        r = esq.rep
        self.espinha = [r['Quadril'], r['Coluna'], r['Coluna2'], r['Peito'], r['Pescoco']]
        self.s_nos = [0.0, 0.173, 0.442, 0.731, 1.0]

    # ---- tronco
    def torso(self, t):
        e = self.e
        rx = np.interp(t, T_TAB[:, 0], T_TAB[:, 1])
        rz = np.interp(t, T_TAB[:, 0], T_TAB[:, 2])
        cz = np.interp(t, T_TAB[:, 0], T_TAB[:, 3])
        sup = suave((t - 0.45) / 0.35)
        inf = suave((0.12 - t) / 0.30)
        cint = math.exp(-((t - 0.17) / 0.14) ** 2)
        rx = rx * (1 + sup * (self.k['ombro'] * e.par['ombros'] - 1) + inf * (self.k['quad'] * e.par['quadril'] - 1) - cint * (1 - self.k['cintura']))
        rx *= (0.55 + 0.45 * e.par['tronco']) if False else 1.0
        rz = rz * (self.k['peito'] * (0.5 + 0.5 * e.par['tronco'])) + self.k['barriga'] * math.exp(-((t - 0.12) / 0.2) ** 2)
        return caminho(self.espinha, self.s_nos, t) + np.array([0.0, 0.0, cz * e.par['tronco']]), float(rx), float(rz)

    # ---- pesos
    def pesos_torso(self):
        e = self.e
        return nos(e.nb, e.idx, (-0.4, {'Quadril': 1}), (0.0, {'Quadril': 1}), (0.173, {'Coluna': 1}), (0.442, {'Coluna2': 1}), (0.731, {'Peito': 1}), (0.93, {'Peito': 1}),
                   (1.0, {'Peito': .55, 'Pescoco': .45}))

    def ajuste_torso(self, y_hem=None, y_fim=None, seguir=0.65):
        """trapézio/ombros seguem a clavícula; a barra da roupa (abaixo de `y_hem`+) acompanha a coxa que levanta"""
        e = self.e
        ombro_y = e.rep['Peito'][1]

        def f(P, W):
            for lado, sg in (('E', 1), ('D', -1)):
                m = np.clip((sg * P[:, 0] - 0.07 * e.par['ombros']) / 0.09, 0, 1) * np.clip((P[:, 1] - (ombro_y - 0.01)) / (0.08 * e.par['tronco']), 0, 1) * 0.5
                k = e.idx['Ombro' + lado]
                W[:, k] += m * (1 - W[:, k])
                W[:, :k] *= (1 - m)[:, None]
                W[:, k + 1:] *= (1 - m)[:, None]
            if y_hem is not None:
                for lado, sg in (('E', 1), ('D', -1)):
                    frente = np.clip((P[:, 2] + 0.02) / 0.10, 0, 1)
                    lado_ok = np.clip((sg * P[:, 0] + 0.02) / 0.06, 0, 1)
                    m = seguir * frente * lado_ok * np.clip((y_fim - P[:, 1]) / (y_fim - y_hem), 0, 1)
                    k = e.idx['Coxa' + lado]
                    W[:, k] += m * (1 - W[:, k])
                    W[:, :k] *= (1 - m)[:, None]
                    W[:, k + 1:] *= (1 - m)[:, None]
            W /= W.sum(axis=1, keepdims=True)
        return f

    # ---- cascas
    def raio_pescoco(self):
        return self.k['pesc'] * 0.052 * (0.5 + 0.5 * self.e.par['pescoco']) * (0.8 + 0.2 * self.e.par['cabeca'])

    def casca_torso(self, S, t0, t1, ease, off, mat, n_an=26, flare=None, uv=None, cor=None, y_hem_seguir=None, n=2.4, nseg=36, fecha=(True, False), perfil_extra=None, gola=None, recorte=None):
        """casca do tronco entre os parâmetros t0 e t1 (t = 0 é a cintura baixa, 1 é a base do pescoço); `flare(t)` -> (extra rx, extra rz)"""
        ts = np.linspace(t0, t1, n_an)
        C, RX, RZ = [], [], []
        for t in ts:
            c, rx, rz = self.torso(t)
            fx, fz = flare(t) if flare else (0.0, 0.0)
            ex = perfil_extra(t) if perfil_extra else 1.0
            C.append(c)
            RX.append(rx * ease * ex + off + fx)
            RZ.append(rz * ease * ex + off + fz)
        ts = list(ts)
        if gola is not None:                                                     # gola: rolo que fecha em volta do pescoço (altura, folga)
            alt, folga = gola
            rn = self.raio_pescoco() + folga
            cima = unit(self.e.rep['Cabeca'] - self.e.rep['Pescoco'])
            base_c, base_x, base_z = C[-1], RX[-1], RZ[-1]
            for fr, mix in ((0.35, 0.92), (0.7, 0.55), (0.92, 0.12), (1.0, 0.0)):
                a = suave(mix) if False else mix
                C.append(base_c + cima * alt * fr)
                RX.append(rn + (base_x - rn) * a)
                RZ.append(rn * 1.04 + (base_z - rn * 1.04) * a)
                ts.append(t1 + 0.02 + 0.03 * fr)
        aj = self.ajuste_torso(*(y_hem_seguir if y_hem_seguir else (None, None)))
        return loft(S, np.array(C), np.array(RX), np.array(RZ), np.array(ts), self.pesos_torso(), mat, n=n, nseg=nseg, sub=2, fecha=fecha, ajuste=aj, uv=uv, cor=cor, recorte=recorte)

    def _pontos(self, kind, lado):
        r = self.e.rep
        if kind == 'braco':
            return [r['Braco' + lado], r['Antebraco' + lado], r['Mao' + lado]]
        return [r['Coxa' + lado], r['Canela' + lado], r['Pe' + lado]]

    def membro(self, S, kind, lado, s0, s1, ease, off, mat, n_an=16, uv=None, cor=None, fecha=(True, False), nseg=24, pesos=None, extra=None, n=2.0, recorte=None):
        """casca (ou pele) de um braço/perna entre os parâmetros s0 e s1 (0 = ombro/quadril, 1 = cotovelo/joelho, 2 = punho/tornozelo)"""
        e = self.e
        pts = self._pontos(kind, lado)
        tab = BRACO_TAB if kind == 'braco' else PERNA_TAB
        k = self.k['braco'] if kind == 'braco' else self.k['perna']
        ss = np.linspace(s0, s1, n_an)
        c = np.array([caminho(pts, [0.0, 1.0, 2.0], s) for s in ss])
        ru = np.interp(ss, tab[:, 0], tab[:, 1]) * k * ease + off
        rv = np.interp(ss, tab[:, 0], tab[:, 2]) * k * ease + off
        if extra is not None:
            m = extra(ss)
            ru, rv = ru * m + 0 * m, rv * m
        if kind == 'perna':
            c = c.copy()
            for i, s_ in enumerate(ss):
                if 1.1 <= s_ <= 1.7:
                    c[i][2] -= 0.007 * k * math.sin(math.pi * (s_ - 1.1) / 0.6)
        if pesos is None:
            pesos = self.pesos_braco(lado) if kind == 'braco' else self.pesos_perna(lado)
        return loft(S, c, ru, rv, ss, pesos, mat, n=n, nseg=nseg, sub=2, fecha=fecha, uv=uv, cor=cor, recorte=recorte)

    def pesos_braco(self, lado):
        e = self.e
        return nos(e.nb, e.idx, (-0.20, {'Peito': .55, 'Ombro' + lado: .45}), (-0.08, {'Peito': .30, 'Ombro' + lado: .40, 'Braco' + lado: .30}), (0.08, {'Ombro' + lado: .20, 'Braco' + lado: .80}),
                   (0.30, {'Braco' + lado: 1}), (0.82, {'Braco' + lado: 1}), (1.0, {'Braco' + lado: .5, 'Antebraco' + lado: .5}), (1.18, {'Antebraco' + lado: 1}),
                   (1.80, {'Antebraco' + lado: 1}), (2.0, {'Antebraco' + lado: .8, 'Mao' + lado: .2}), (2.2, {'Mao' + lado: 1}))

    def pesos_perna(self, lado):
        e = self.e
        return nos(e.nb, e.idx, (-0.12, {'Quadril': .6, 'Coxa' + lado: .4}), (0.0, {'Quadril': .3, 'Coxa' + lado: .7}), (0.18, {'Coxa' + lado: 1}), (0.80, {'Coxa' + lado: 1}),
                   (1.0, {'Coxa' + lado: .5, 'Canela' + lado: .5}), (1.22, {'Canela' + lado: 1}), (1.82, {'Canela' + lado: 1}), (2.0, {'Canela' + lado: .5, 'Pe' + lado: .5}), (2.12, {'Pe' + lado: 1}))

    # ---- pescoço
    def pescoco(self, S, mat='pele', cor=None, topo=None):
        e = self.e
        r = e.rep
        a, b = r['Peito'] + (r['Pescoco'] - r['Peito']) * 0.55, r['Cabeca'] + np.array([0.0, 0.025, 0.0])
        K = 7
        pts = np.array([a + (b - a) * t for t in np.linspace(0, 1, K)])
        rad = self.k['pesc'] * 0.052 * (0.5 + 0.5 * e.par['pescoco']) * np.array([1.12, 1.04, 1.0, 0.98, 0.98, 1.0, 1.02]) * (0.8 + 0.2 * e.par['cabeca'])
        pesos = nos(e.nb, e.idx, (0.0, {'Peito': .7, 'Pescoco': .3}), (0.5, {'Pescoco': 1}), (1.0, {'Pescoco': .3, 'Cabeca': .7}))
        return loft(S, pts, rad, rad * 1.05, np.linspace(0, 1, K), pesos, mat, nseg=24, sub=2, frame=(X_, Z_), fecha=(False, False), cor=cor)

    # ---- mão com dedos (relaxada, meio fechada)
    def mao(self, S, lado, mat='pele', unhas=None, cor=None, comp=1.0):
        e = self.e
        sg = 1.0 if lado == 'E' else -1.0
        W = e.rep['Mao' + lado]
        f = unit(W - e.rep['Antebraco' + lado])
        p = unit(np.array([-sg, 0.0, 0.0]) - f * (np.array([-sg, 0.0, 0.0]) @ f))             # normal da palma: aponta para o corpo
        w = unit(np.cross(f, p))
        if w[2] < 0:
            w = -w
        k = self.k_mao * comp
        wm = osso(e.nb, e.idx, **{'Mao' + lado: 1})
        Lp = 0.092 * k
        tab = [(-0.25, .021, .027), (0.0, .0215, .0315), (0.28, .0195, .0385), (0.65, .0185, .0405), (1.0, .0170, .0400)]
        c = np.array([W + f * Lp * t for t, a, b in tab])
        pw = nos(e.nb, e.idx, (-0.3, {'Antebraco' + lado: .8, 'Mao' + lado: .2}), (0.1, {'Mao' + lado: 1}))
        loft(S, c, np.array([x[1] * k for x in tab]), np.array([x[2] * k for x in tab]), np.array([x[0] for x in tab]), pw, mat, nseg=16, sub=2, frame=(p, w), fecha=(False, True), cor=cor)
        base = W + f * Lp
        dedos = [(0.0165, 1.00, 0.020), (0.0055, 1.10, 0.026), (-0.0055, 1.02, 0.030), (-0.0160, 0.82, 0.036)]
        for xw, comp_d, curl0 in dedos:
            xw *= k
            pos = base + w * xw - p * 0.001
            seg = [0.031 * k * comp_d, 0.020 * k * comp_d, 0.016 * k * comp_d]
            ang = [math.radians(a_) for a_ in (28 + curl0 * 600, 52, 38)]
            pts, d = [pos.copy()], f.copy()
            acum = 0.0
            for L_, a_ in zip(seg, ang):
                acum += a_
                d = unit(f * math.cos(acum) + p * math.sin(acum))
                pos = pos + d * L_
                pts.append(pos.copy())
            rr = [0.0080 * k, 0.0072 * k, 0.0064 * k, 0.0050 * k]
            tubo(S, pts, rr, wm, mat, nseg=10, sub=2, fecha=(False, True), frame='auto', cor=cor)
        # polegar
        pos = W + f * Lp * 0.18 + w * 0.027 * k + p * 0.004 * k
        d0 = unit(f * 0.55 + w * 0.60 + p * 0.45)
        pts = [pos, pos + d0 * 0.030 * k, pos + unit(d0 * 0.7 + p * 0.5) * 0.050 * k + d0 * 0.0]
        tubo(S, pts, [0.0112 * k, 0.0098 * k, 0.0078 * k], wm, mat, nseg=10, sub=2, fecha=(False, True), cor=cor)

    # ---- sapatos
    def sapato(self, S, lado, estilo, mat_c, mat_sola, mat_det, cano=True, cor=None):
        """estilo: 'tenis' | 'sapatinho' | 'bota' | 'ortopedico'. Medidas do adulto de referência, escalonadas pelo tamanho do pé."""
        e = self.e
        k = e.pe_k
        A = e.rep['Pe' + lado]
        z0 = A[2]
        wp = osso(e.nb, e.idx, **{'Pe' + lado: 1})
        peso = nos(e.nb, e.idx, (-0.1, {'Pe' + lado: 1}), (0.085 * k, {'Pe' + lado: 1}), (0.145 * k, {'Ponteira' + lado: 1}), (0.22 * k, {'Ponteira' + lado: 1}))
        alt = {'tenis': 1.0, 'sapatinho': 0.62, 'bota': 1.05, 'ortopedico': 0.8}[estilo]
        larg = {'tenis': 1.0, 'sapatinho': 0.92, 'bota': 1.05, 'ortopedico': 1.12}[estilo]
        ponta = {'tenis': 1.0, 'sapatinho': 1.0, 'bota': 0.97, 'ortopedico': 0.9}[estilo]
        # (z, topo relativo ao tornozelo, semilargura)
        Up = [(-0.088, -0.040, 0.0), (-0.081, -0.012, 0.030), (-0.068, 0.030, 0.038), (-0.045, 0.041, 0.043), (-0.010, 0.037, 0.0435), (0.025, 0.008, 0.046), (0.060, -0.022, 0.049),
              (0.100, -0.038, 0.052), (0.140, -0.047, 0.0525), (0.180, -0.054, 0.047), (0.205, -0.059, 0.036), (0.216, -0.064, 0.0)]
        base_y = -0.078 * k
        c, ru, rv, ss = [], [], [], []
        for z, top, hw in Up:
            top = top * k * (alt if top > -0.04 else (1 + (alt - 1) * 0.4))
            if estilo == 'sapatinho' and z < 0.01:
                top = min(top, 0.012 * k)
            cy = A[1] + (top + base_y) / 2
            c.append((A[0], cy, z0 + z * k))
            ru.append(hw * k * larg)
            rv.append(max((top - base_y) / 2, 0.0 if hw == 0 else 0.004))
            ss.append(z * k)
        loft(S, np.array(c), np.array(ru), np.array(rv), np.array(ss), peso, mat_c, n=3.0, sub=3, frame=(X_, Y_), fecha=(False, False), cor=cor)
        So = [(-0.088, 0.0), (-0.083, 0.030), (-0.070, 0.039), (-0.045, 0.044), (-0.010, 0.0455), (0.025, 0.048), (0.060, 0.051), (0.100, 0.0545), (0.140, 0.055), (0.180, 0.0505), (0.205, 0.040), (0.217, 0.0)]
        c, ru, rv, ss = [], [], [], []
        espessura = {'tenis': 0.031, 'sapatinho': 0.020, 'bota': 0.034, 'ortopedico': 0.030}[estilo] * k
        for z, hw in So:
            mola = 0.010 * k * max(0.0, (z - 0.15) / 0.065) ** 2
            bot, top = -0.100 * k + mola, -0.100 * k + espessura + mola * 0.6 + (0.006 * k if (estilo in ('bota', 'ortopedico', 'sapatinho') and z < -0.02) else 0)
            c.append((A[0], A[1] + (bot + top) / 2, z0 + z * k))
            ru.append((hw + 0.003) * k * larg if hw else 0.0)
            rv.append(max((top - bot) / 2, 0.0 if hw == 0 else 0.004))
            ss.append(z * k)
        loft(S, np.array(c), np.array(ru), np.array(rv), np.array(ss), peso, mat_sola, n=3.6, sub=3, frame=(X_, Y_), fecha=(False, False), cor=cor)
        if estilo == 'tenis':                                                   # língua e cadarços
            zs = np.arange(-0.012, 0.106, 0.014) * k
            tops = np.interp(zs, [u[0] * k for u in Up], [u[1] * k for u in Up])
            ct = np.array([(A[0], A[1] + tp + 0.0016, z0 + z) for z, tp in zip(zs, tops)])
            rr = np.full(len(zs), .0058 * k)
            rr[0] = rr[-1] = .003 * k
            loft(S, ct, rr, np.full(len(zs), .0034 * k), zs, nos(e.nb, e.idx, (-0.1, {'Pe' + lado: 1}), (0.2, {'Pe' + lado: 1})), mat_det, n=2.4, sub=2, nseg=10, frame=(X_, Y_), fecha=(True, True))
        if estilo in ('sapatinho', 'ortopedico'):                              # tira sobre o peito do pé
            zt = 0.045 * k
            ytop = np.interp(zt, [u[0] * k for u in Up], [u[1] * k for u in Up])
            hw = 0.047 * k * larg
            pts = [(A[0] + hw * u, A[1] + ytop + (0.002 if abs(u) < 0.7 else -0.012) * k, z0 + zt) for u in (-1, -0.65, 0, 0.65, 1)]
            tubo(S, pts, 0.0048 * k, wp, mat_det, nseg=8, sub=3, fecha=(True, True), achatamento=0.7)
        if estilo in ('bota',) and cano:                                         # cano da bota
            P = self._pontos('perna', lado)
            ss2 = np.linspace(1.50, 2.06, 10)
            cc = np.array([caminho(P, [0.0, 1.0, 2.0], s) for s in ss2])
            ru2 = np.interp(ss2, PERNA_TAB[:, 0], PERNA_TAB[:, 1]) * self.k['perna'] * 1.30 + 0.008
            rv2 = np.interp(ss2, PERNA_TAB[:, 0], PERNA_TAB[:, 2]) * self.k['perna'] * 1.30 + 0.008
            loft(S, cc, ru2, rv2, ss2, self.pesos_perna(lado), mat_c, n=2.2, sub=2, fecha=(True, False), nseg=24)
            ss3 = np.linspace(1.43, 1.55, 3)
            cc = np.array([caminho(P, [0.0, 1.0, 2.0], s) for s in ss3])
            loft(S, cc, np.interp(ss3, PERNA_TAB[:, 0], PERNA_TAB[:, 1]) * self.k['perna'] * 1.30 + np.array([0.008, 0.013, 0.010]), np.interp(ss3, PERNA_TAB[:, 0], PERNA_TAB[:, 2]) * self.k['perna'] * 1.30 + np.array([0.008, 0.013, 0.010]),
                 ss3, self.pesos_perna(lado), mat_det, n=2.2, sub=2, fecha=(True, True), nseg=24)

    # ---- saia / vestido (casca evasê da cintura até a barra)
    def saia(self, S, y_topo, y_barra, abre, mat, uv=None, cor=None, n_an=16, seguir=0.55, ease_topo=1.06, off_topo=0.004, barra_cor=None, ruf=0.0):
        e = self.e
        r = e.rep['Quadril'] + np.array([0.0, 0.0, 0.0])
        ys = np.linspace(y_topo, y_barra, n_an)
        c = np.array([[0.0, y, -0.004] for y in ys])
        tt = (ys - y_barra) / (y_topo - y_barra + 1e-9)                       # 1 no topo, 0 na barra
        t_ref = 0.02
        _, rx0, rz0 = self.torso(t_ref)
        rx = np.array([rx0 * ease_topo + off_topo + abre * (1 - t_) ** 1.3 for t_ in tt])
        rz = np.array([rz0 * ease_topo + off_topo + abre * 0.82 * (1 - t_) ** 1.3 for t_ in tt])
        if ruf:
            ang = np.linspace(0, 1, n_an)
            rx = rx * (1 + ruf * np.sin(ang * 14))
        pesos = nos(e.nb, e.idx, (y_barra, {'Quadril': 1}), (y_topo, {'Quadril': 1}), (y_topo + 0.05, {'Quadril': 1}))

        def ajuste(P, W):
            for lado, sg in (('E', 1), ('D', -1)):
                lado_ok = np.clip((sg * P[:, 0] + 0.02) / 0.07, 0, 1)
                fb = np.clip(1 - np.abs(P[:, 2]) / 0.20, 0.4, 1.0)
                m = seguir * lado_ok * fb * np.clip((y_topo - P[:, 1]) / max(y_topo - y_barra, 1e-6), 0, 1) ** 0.9
                k = e.idx['Coxa' + lado]
                W[:, k] += m * (1 - W[:, k])
                W[:, :k] *= (1 - m)[:, None]
                W[:, k + 1:] *= (1 - m)[:, None]
            W /= W.sum(axis=1, keepdims=True)
        # y decresce com o índice: o loft vai da cintura para baixo
        return loft(S, c, rx, rz, ys[::-1][::-1], pesos, mat, n=2.3, sub=2, nseg=40, frame=(X_, Z_), fecha=(True, False), ajuste=ajuste, uv=uv, cor=cor)

    # ---- capuz arriado em volta do pescoço
    def capuz(self, S, mat, tam=1.0, cor=None):
        e = self.e
        r = e.rep
        yc = r['Pescoco'][1] + 0.012
        zc = r['Pescoco'][2] - 0.02
        K = 28
        th = 2 * np.pi * np.arange(K) / K
        R_maj = 0.074 * (0.5 + 0.5 * e.par['pescoco']) * tam
        c, tub = [], []
        for t in th:
            tras = 0.5 - 0.5 * math.sin(t)                                        # 1 atrás (t = -90°), 0 na frente
            tub.append((0.020 + 0.034 * tras) * tam)
            c.append((R_maj * math.cos(t) * 1.05, yc - 0.012 * tras - 0.015 * (1 - tras), zc + R_maj * math.sin(t) * 1.02 - 0.012 * tras))
        pesos = nos(e.nb, e.idx, (0.0, {'Peito': .6, 'Pescoco': .4}))
        return loft(S, np.array(c), np.array(tub), np.array(tub) * 0.95, np.zeros(K), pesos, mat, sub=1, nseg=16, frame='toro', fechado=True, cor=cor)
