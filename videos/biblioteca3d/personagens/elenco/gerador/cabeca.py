"""Cabeça e rosto paramétricos: crânio por anéis (com buraco da boca), nariz, lábios, cavidade da boca com dentes e língua, olhos com íris,
pupila e pálpebra superior móvel, sobrancelhas, orelhas, rugas e pintura de rosto por vértice (rubor, olheiras, barba).
Ossos do rosto: Mandibula (abre a boca), OlhoE/D (olhar), PalpebraE/D (piscar), SobrancelhaE/D, BocaE/D (cantos da boca)."""
import math
import numpy as np
from forma import loft, elipsoide, tubo, catmull, nos, osso, suave, ruido3, X_, Y_, Z_

PAD = dict(sx=1.0, sz=1.0, mand=0.0, queixo=0.0, bochecha=0.0, testa=0.0, crista=0.0, cranio=0.0,
           olho_r=0.0125, olho_x=0.031, u_olho=0.50, olho_fundo=0.62, iris=0.52, pupila=0.28, olhos_assim=1.0, olho_inclina=0.0, lid_aberta=26.0,
           nariz_comp=0.016, nariz_larg=0.0105, nariz_ponta=0.0090, nariz_gancho=0.0, nariz_u=0.31, narina=0.0035,
           boca_u=0.255, boca_larg=0.027, labio=0.0040, sorriso0=0.0, boca_assim=0.0,
           orelha=1.0, orelha_abre=0.25,
           sobr_larg=0.036, sobr_esp=0.0055, sobr_u=0.085, sobr_incl=0.0, sobr_assim=0.0, sobr_junta=0.0,
           dentes=6, dente_irreg=0.0, dente_falta=(), dente_tam=1.0,
           rubor=0.0, olheira=0.0, barba=0.0, nariz_vermelho=0.0, mancha=0.0,
           rugas_testa=0, rugas_olho=0, rugas_nariz=0.0, rugas_prof=1.0, cicatriz=0)

# perfil do crânio (adulto): u (0 = queixo, 1 = topo), semilargura, semiprofundidade, deslocamento para frente
BASE = [(0.000, 0.000, 0.000, 0.034), (0.038, .026, .038, .036), (0.113, .048, .060, .030), (0.218, .065, .079, .020), (0.364, .074, .091, .010),
        (0.523, .078, .097, .004), (0.678, .077, .097, .000), (0.816, .071, .091, -.003), (0.921, .056, .077, -.008), (0.979, .032, .050, -.012),
        (1.000, .000, .000, -.012)]


def gauss(u, c, w):
    return np.exp(-((u - c) / w) ** 2)


class Cabeca:
    def __init__(self, esq, **par):
        self.e = esq
        p = self.p = dict(PAD, **par)
        h = self.h = esq.cabeca_h
        self.chin = esq.queixo_y
        self.zc = float(esq.rep['Cabeca'][2])
        sx, sz = p['sx'] * esq.par['cabeca'], p['sz'] * esq.par['cabeca']
        self.sx, self.sz = sx, sz
        tab = np.array(BASE)
        F = catmull(tab, 6)
        U, RX, RZ, CZ = F[:, 0], F[:, 1] * sx, F[:, 2] * sz, F[:, 3] * sz
        RX = RX + p['mand'] * gauss(U, 0.12, 0.10) * sx + p['bochecha'] * gauss(U, 0.38, 0.13) * sx + p['cranio'] * gauss(U, 0.72, 0.2) * sx
        RZ = RZ + p['testa'] * 0.5 * gauss(U, 0.78, 0.13) * sz
        CZ = CZ + p['queixo'] * gauss(U, 0.03, 0.08) * sz + p['testa'] * 0.6 * gauss(U, 0.78, 0.13) * sz - 0.2 * p['bochecha'] * gauss(U, 0.38, 0.13) * 0
        polos = (U < 1e-6) | (U > 1 - 1e-6)
        RX = np.where(polos, 0.0, np.maximum(RX, 0.004))
        RZ = np.where(polos, 0.0, np.maximum(RZ, 0.004))
        self.U, self.RX, self.RZ, self.CZ = U, RX, RZ, CZ + self.zc
        # pontos de referência
        self.u_olho, self.u_boca = p['u_olho'], p['boca_u']
        self.y_olho = self.chin + self.u_olho * h
        self.y_boca = self.chin + self.u_boca * h
        self.ex = p['olho_x'] * sx / 0.078 * 0.078 / 0.078 if False else p['olho_x'] * (0.5 + 0.5 * sx)
        self.r_olho = p['olho_r']
        self.wm = p['boca_larg']
        self.y_nariz_base = self.chin + p['nariz_u'] * h
        self.y_sobr = self.chin + (self.u_olho + p['sobr_u']) * h

    # --- superfície do rosto
    def perfil(self, u):
        return np.interp(u, self.U, self.RX), np.interp(u, self.U, self.RZ), np.interp(u, self.U, self.CZ)

    def u_de(self, y):
        return (y - self.chin) / self.h

    def zf(self, x, y):
        """profundidade (z) da frente do rosto no ponto (x, y)"""
        rx, rz, cz = self.perfil(self.u_de(y))
        return cz + rz * math.sqrt(max(0.0, 1.0 - (x / max(rx, 1e-6)) ** 2))

    def ponto(self, x, y, fora=0.0):
        return np.array([x, y, self.zf(x, y) + fora])

    def couro(self, u, th, off=0.0):
        """ponto do couro cabeludo (u = altura 0..1, th = ângulo a partir da frente, + para a esquerda) e a normal para fora"""
        def pt(uu, tt):
            rx, rz, cz = self.perfil(uu)
            return np.array([rx * math.sin(tt), self.chin + uu * self.h, cz + rz * math.cos(tt)])
        p0 = pt(u, th)
        du, dt = 0.004, 0.01
        n = np.cross(pt(u, th + dt) - pt(u, th - dt), pt(min(u + du, 1.0), th) - pt(max(u - du, 0.0), th))
        n = n / max(np.linalg.norm(n), 1e-9)
        if np.dot(n, p0 - np.array([0.0, p0[1], self.zc])) < 0:
            n = -n
        return p0 + n * off, n

    # --- ossos do rosto
    def rig(self):
        e, p = self.e, self.p
        zj = self.zc - 0.028 * self.sz / 0.097
        yj = self.y_olho - 0.012
        e.add_osso('Mandibula', 'Cabeca', (0.0, yj, zj))
        for lado, sg in (('E', 1.0), ('D', -1.0)):
            ass = p['olhos_assim'] if lado == 'E' else 1.0
            zo = self.zf(sg * self.ex, self.y_olho) - p['olho_fundo'] * self.r_olho * ass
            e.add_osso('Olho' + lado, 'Cabeca', (sg * self.ex, self.y_olho, zo))
            e.add_osso('Palpebra' + lado, 'Cabeca', (sg * self.ex, self.y_olho, zo))
            e.add_osso('Sobrancelha' + lado, 'Cabeca', (sg * self.ex * 0.95, self.y_sobr, self.zf(sg * self.ex * 0.95, self.y_sobr)))
            e.add_osso('Boca' + lado, 'Cabeca', (sg * self.wm, self.y_boca + p['sorriso0'] + (p['boca_assim'] * sg), self.zf(sg * self.wm, self.y_boca)))
        self.zj, self.yj = zj, yj

    # --- pintura de rosto (multiplicador de cor por vértice)
    def cor_pele(self, P, N, s):
        p = self.p
        C = np.ones((len(P), 3))
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        frente = np.clip((z - self.zc) / 0.05, 0, 1)
        C *= (0.97 + 0.06 * ruido3(P, 22.0, 3))[:, None]
        for sg in (1.0, -1.0):
            if p['rubor']:
                d2 = ((x - sg * self.ex * 1.45) ** 2 + (y - (self.y_olho - 0.040)) ** 2) / 0.022 ** 2
                w = np.exp(-d2) * p['rubor'] * frente
                C *= np.stack([1 - 0.04 * w, 1 - 0.30 * w, 1 - 0.26 * w], axis=1)
            if p['olheira']:
                d2 = ((x - sg * self.ex) ** 2 / 0.019 ** 2 + (y - (self.y_olho - self.r_olho * 1.5)) ** 2 / 0.0085 ** 2)
                w = np.exp(-d2) * p['olheira'] * frente
                C *= np.stack([1 - 0.32 * w, 1 - 0.46 * w, 1 - 0.30 * w], axis=1)
        if p['barba']:
            lim = self.y_boca + 0.040
            w = np.clip((lim - y) / 0.03, 0, 1) * frente * np.clip((self.RX.max() * 1.0 - np.abs(x) * 0.2), 0, 1)
            w *= 0.75 + 0.5 * ruido3(P, 45.0, 7)
            w = np.clip(w, 0, 1) * p['barba']
            C *= np.stack([1 - 0.30 * w, 1 - 0.30 * w, 1 - 0.24 * w], axis=1)
        if p['nariz_vermelho']:
            tip = np.array([0.0, self.y_nariz_base + 0.003, self.zf(0, self.y_nariz_base) + p['nariz_comp']])
            w = np.exp(-(((P - tip) ** 2).sum(axis=1)) / 0.016 ** 2) * p['nariz_vermelho']
            C *= np.stack([1 - 0.02 * w, 1 - 0.26 * w, 1 - 0.26 * w], axis=1)
        if p['mancha']:
            w = np.clip(ruido3(P, 70.0, 11) - 0.62, 0, 1) * 3.0 * p['mancha'] * frente
            C *= np.stack([1 - 0.30 * w, 1 - 0.34 * w, 1 - 0.28 * w], axis=1)
        return C

    # --- construção da malha
    def construir(self, S, mats_cor=None):
        e, p = self.e, self.p
        nb, idx = e.nb, e.idx
        U, RX, RZ, CZ = self.U, self.RX, self.RZ, self.CZ
        yw = self.chin + U * self.h
        wm, ym, zc = self.wm, self.y_boca, self.zc

        def pesos_cabeca(u):
            wj = suave((self.u_boca + 0.012 - u) / 0.022)
            return osso(nb, idx, Cabeca=1 - wj + 1e-6, Mandibula=wj + 1e-6)

        def ajuste(P, W):                                   # a mandíbula só move o que está à frente da articulação
            k = idx['Mandibula']
            f = np.clip((P[:, 2] - (self.zj - 0.012)) / 0.045, 0, 1)
            novo = W[:, k] * f
            W[:, idx['Cabeca']] += W[:, k] - novo
            W[:, k] = novo

        def recorte(cen):                                   # buraco da boca
            dentro = ((cen[:, 0] / (0.93 * wm)) ** 2 + ((cen[:, 1] - (ym + 0.0004)) / 0.0072) ** 2) < 1.0
            return dentro & (cen[:, 2] > zc + 0.03)
        loft(S, np.column_stack([np.zeros_like(yw), yw, CZ]), RX, RZ, U, pesos_cabeca, 'pele', n=2.0, nseg=64, sub=1, frame=(X_, Z_),
             fecha=(False, False), ajuste=ajuste, cor=self.cor_pele, recorte=recorte)
        cab = osso(nb, idx, Cabeca=1)
        jaw = osso(nb, idx, Mandibula=1)
        # ---- olhos
        for lado, sg in (('E', 1.0), ('D', -1.0)):
            ass = p['olhos_assim'] if lado == 'E' else 1.0
            r = self.r_olho * ass
            xo = sg * self.ex
            zo = self.zf(xo, self.y_olho) - p['olho_fundo'] * r
            c = np.array([xo, self.y_olho, zo])
            wo = osso(nb, idx, **{'Olho' + lado: 1})
            elipsoide(S, c, X_, Y_, Z_, r, r, r, wo, 'olho', aneis=13, nseg=28)
            ri, rp = r * p['iris'], r * p['iris'] * p['pupila'] / 0.28 * 0.55
            elipsoide(S, c + Z_ * r * 0.90, X_, Y_, Z_, ri, ri, r * 0.14, wo, 'iris', aneis=9, nseg=24)
            elipsoide(S, c + Z_ * r * 0.945, X_, Y_, Z_, rp, rp, r * 0.12, wo, 'pupila', aneis=7, nseg=18)
            elipsoide(S, c + np.array([-sg * 0.22 * r, 0.26 * r, 0.985 * r]), X_, Y_, Z_, r * 0.13, r * 0.13, r * 0.06, wo, 'brilho', aneis=5, nseg=10)
            # pálpebra superior: calota esférica que gira em torno do centro do olho
            wl = osso(nb, idx, **{'Palpebra' + lado: 1})
            psi_e = math.radians(p['lid_aberta'])
            ang = math.radians(150.0) - psi_e
            polo_psi = psi_e + ang / 2
            dirp = np.array([0.0, math.sin(polo_psi), math.cos(polo_psi)])
            vperp = np.cross(dirp, X_)
            rl = r * 1.13
            fs = np.linspace(0, ang / 2, 9)
            cc = np.array([c + dirp * rl * math.cos(f) for f in fs])
            loft(S, cc, rl * np.sin(fs), rl * np.sin(fs), np.zeros(9), lambda s_: wl, 'pele', nseg=28, sub=1, frame=(X_, vperp), fecha=(False, False), cor=self.cor_pele)
            # pálpebra inferior (fixa no crânio)
            dirl = np.array([0.0, -math.sin(math.radians(78)), math.cos(math.radians(78))])
            fs2 = np.linspace(0, math.radians(40), 7)
            vl = np.cross(dirl, X_)
            cc = np.array([c + dirl * rl * math.cos(f) for f in fs2])
            loft(S, cc, rl * np.sin(fs2), rl * np.sin(fs2), np.zeros(7), lambda s_: cab, 'pele', nseg=24, sub=1, frame=(X_, vl), fecha=(False, False), cor=self.cor_pele)
        # ---- orelhas
        for sg in (1.0, -1.0):
            yo = self.chin + 0.44 * self.h
            rx_, rz_, cz_ = self.perfil(self.u_de(yo))
            o = p['orelha']
            ctr = np.array([sg * (rx_ - 0.006), yo, cz_ - 0.004 * self.sz / 0.097])
            ab = p['orelha_abre']
            eixo_u = np.array([sg * math.cos(ab), 0, -math.sin(ab) * -1])
            elipsoide(S, ctr + np.array([sg * 0.006 * o, 0, 0]), np.array([0, 0, 1.0]), Y_, np.array([sg * math.cos(ab), 0, -math.sin(ab)]), 0.017 * o, 0.027 * o, 0.0085 * o, cab,
                      'pele', aneis=9, nseg=18, cor=self.cor_pele)
        # ---- nariz: ponte que nasce dentro do rosto, ponta larga, asas e narinas
        zb = self.zf(0, self.y_nariz_base)
        L = p['nariz_comp']
        y_top = self.y_olho + 0.003
        g = p['nariz_gancho']
        nl, npn = p['nariz_larg'], p['nariz_ponta']
        y_tip = self.y_nariz_base + 0.003 - g
        pts = [(0.0, y_top, self.zf(0, y_top) - 0.007), (0.0, y_top - 0.5 * (y_top - y_tip) + 0.002, self.zf(0, y_top) + (zb + L - self.zf(0, y_top)) * 0.42),
               (0.0, y_tip + 0.004 + 0.3 * g, zb + L * 0.80 + 0.5 * g * 0.0), (0.0, y_tip, zb + L * 0.97)]
        raios = [nl * 0.42, nl * 0.54, npn * 0.68, npn * 0.78]
        tubo(S, pts, raios, cab, 'pele', nseg=16, sub=4, fecha=(True, False), cor=self.cor_pele, frame=(X_, Z_), achatamento=1.35)
        elipsoide(S, np.array([0.0, y_tip - 0.0005, zb + L * 0.90]), X_, Y_, Z_, npn * 0.98, npn * 0.88, npn * 0.94, cab, 'pele', aneis=10, nseg=18, cor=self.cor_pele)
        for sg in (1.0, -1.0):
            elipsoide(S, np.array([sg * nl * 0.92, self.y_nariz_base + 0.0005 - g * 0.6, zb + L * 0.32]), X_, Y_, Z_, nl * 0.56, npn * 0.95, npn * 1.0, cab, 'pele', aneis=9, nseg=14, cor=self.cor_pele)
            elipsoide(S, np.array([sg * nl * 0.46, y_tip - 0.0058, zb + L * 0.80]), X_, Y_, Z_, p['narina'], p['narina'] * 0.85, p['narina'] * 0.7, cab, 'narina', aneis=6, nseg=10)
        # ---- boca: cavidade, dentes, língua, lábios
        zmin = min(self.zf(0, y) for y in np.linspace(ym - 0.045, ym + 0.012, 12))          # frente mais recuada do rosto na altura da boca (queixo recua)
        # interior escuro em três peças: teto (no crânio), assoalho (acompanha a mandíbula sem deformar) e um meio mais fundo que preenche a abertura
        elipsoide(S, np.array([0.0, ym + 0.002, zmin - 0.016]), X_, Y_, Z_, wm * 1.0, 0.012, 0.010, cab, 'boca_dentro', aneis=7, nseg=24)
        elipsoide(S, np.array([0.0, ym - 0.016, zmin - 0.016]), X_, Y_, Z_, wm * 1.0, 0.016, 0.010, jaw, 'boca_dentro', aneis=7, nseg=24)
        elipsoide(S, np.array([0.0, ym - 0.012, zmin - 0.034]), X_, Y_, Z_, wm * 1.15, 0.030, 0.016, osso(nb, idx, Cabeca=0.5, Mandibula=0.5), 'boca_dentro', aneis=9, nseg=24)
        lingua_c = np.array([0.0, ym - 0.012, zmin - 0.010])
        elipsoide(S, lingua_c, X_, Y_, Z_, wm * 0.55, 0.0065, 0.008, jaw, 'lingua', aneis=7, nseg=16)
        nd = int(p['dentes'])
        rng = np.random.RandomState(5)
        for linha, (yy, wd, ymax) in enumerate(((ym + 0.0002, cab, 0.0058), (ym - 0.0048, jaw, 0.0050))):
            for k in range(nd):
                xk = (k - (nd - 1) / 2) * (2 * wm * 0.60 / max(nd - 1, 1)) if nd > 1 else 0.0
                if (linha, k) in p['dente_falta']:
                    continue
                irr = p['dente_irreg']
                dx, dy, dz = (rng.uniform(-1, 1) * 0.0015 * irr, rng.uniform(-1, 1) * 0.0022 * irr, rng.uniform(0, 1) * 0.0018 * irr)
                tam = p['dente_tam'] * (1 - 0.35 * abs(xk) / wm)
                zk = self.zf(xk, ym) - 0.0050 + dz - 0.0004 * (xk / wm) ** 2 * 6
                elipsoide(S, np.array([xk + dx, yy - ymax * 0.2 + dy, zk]), X_, Y_, Z_, 0.0038 * tam, ymax * tam, 0.0026 * tam, wd, 'dente', aneis=7, nseg=12, n=3.4)
        xs = np.linspace(-wm, wm, 11)
        corner = np.abs(xs) / wm
        for lado, (sinal, off, rmul, wlip) in (('sup', (+1, 0.0034, 1.0, 'cabeca')), ('inf', (-1, 0.0040, 1.12, 'mandibula'))):
            ptsl, rads = [], []
            for xk, cn in zip(xs, corner):
                yk = ym + p['sorriso0'] * cn ** 2 + p['boca_assim'] * (xk / wm) + sinal * off * (1 - cn ** 2) * 0.9
                ptsl.append((xk, yk, self.zf(xk, yk) - 0.0004))
                rads.append(p['labio'] * rmul * (1 - 0.50 * cn ** 2))

            def pl(s_, wl=wlip):
                t = s_ / 10.0
                cn = abs(t * 2 - 1)
                lado_ = 'E' if t > 0.5 else 'D'
                wc = suave((cn - 0.55) / 0.45)
                base = Cabeca_w if wl == 'cabeca' else Mand_w
                v = base * (1 - wc)
                canto = osso(nb, idx, **{'Boca' + lado_: 1})
                if wl != 'cabeca':                               # o canto do lábio de baixo acompanha 45% da mandíbula (a boca aberta fica em U, não em linhas retas)
                    canto = canto * 0.55 + osso(nb, idx, Mandibula=1) * 0.45
                v = v + canto * wc
                return v / v.sum()
            Cabeca_w, Mand_w = osso(nb, idx, Cabeca=1), osso(nb, idx, Mandibula=1)
            tubo(S, ptsl, rads, pl, 'labio', nseg=12, sub=3, fecha=(True, True), achatamento=0.8, frame='auto')
        # ---- sobrancelhas
        for lado, sg in (('E', 1.0), ('D', -1.0)):
            wb = osso(nb, idx, **{'Sobrancelha' + lado: 1})
            xi, xo = p['sobr_junta'] * 0.0 + 0.008, p['sobr_larg'] * 0.95
            esp = p['sobr_esp']
            ass = (p['sobr_assim'] * 0.004) * (1 if lado == 'E' else 0)
            pts_b = []
            for t in np.linspace(0, 1, 7):
                xx = sg * (xi + (xo - xi) * t + self.ex * 0.15)
                arco = 0.0035 * math.sin(math.pi * min(1, t * 1.15)) - 0.004 * p['sobr_incl'] * (t - 0.5) * sg * 0 + p['sobr_incl'] * 0.006 * (t - 0.5) * 2
                yy = self.y_sobr + arco + ass
                pts_b.append((xx, yy, self.zf(xx, yy) + 0.0012))
            rb = [esp * (0.7 + 0.5 * math.sin(math.pi * (0.1 + 0.8 * t))) for t in np.linspace(0, 1, 7)]
            tubo(S, pts_b, rb, wb, 'sobrancelha', nseg=8, sub=2, fecha=(True, True), achatamento=0.7, frame=(X_, Z_))
        # ---- rugas (linhas finas sobre a pele)
        self._rugas(S, cab)
        return self

    def _rugas(self, S, cab):
        p, nb, idx = self.p, self.e.nb, self.e.idx
        pr = p['rugas_prof']

        def linha(pts, r=0.0013):
            pts = [self.ponto(x, y, 0.0004) for x, y in pts]
            tubo(S, pts, r * pr, cab, 'ruga', nseg=6, sub=2, fecha=(True, True), achatamento=0.6, frame=(X_, Z_))
        for k in range(int(p['rugas_testa'])):
            y = self.y_sobr + 0.014 + k * 0.0105
            for sg in (-1, 1):
                linha([(sg * 0.002 * (1 if sg > 0 else 1), y + 0.001 * k), (sg * 0.016, y + 0.0015 + 0.0008 * k), (sg * 0.034, y - 0.001)])
        for k in range(int(p['rugas_olho'])):
            for sg in (-1, 1):
                x0 = sg * (self.ex + self.r_olho * 1.5)
                ang = math.radians(-18 + 18 * k)
                linha([(x0, self.y_olho + 0.002 * k - 0.002), (x0 + sg * 0.007 * math.cos(ang), self.y_olho + 0.007 * math.sin(ang) - 0.002)])
        if p['rugas_nariz'] > 0:
            for sg in (-1, 1):
                xa, ya = sg * (p['nariz_larg'] * 1.05), self.y_nariz_base - 0.001
                xb, yb = sg * (self.wm + 0.008), self.y_boca + 0.001
                linha([(xa, ya), (0.5 * (xa + xb) + sg * 0.003, 0.5 * (ya + yb) + 0.001), (xb, yb)], 0.0014 * p['rugas_nariz'])
        if p['cicatriz']:
            linha([(-0.034, self.y_olho - 0.010), (-0.026, self.y_olho - 0.022), (-0.016, self.y_boca + 0.006)], 0.0020)


def expressoes(cab):
    """expressões como deltas dos ossos do rosto: {nome: {osso: {'p': [dx,dy,dz], 'r': [x,y,z,w]}}}. Pálpebra: rx > 0 fecha, rx < 0 arregala.
    Sobrancelha: rz com sinal por lado (sg*γ: ponta de dentro para baixo; -sg*γ: ponta de dentro para cima)."""
    from mat3 import qeuler
    s = cab.sx

    def q(rx=0.0, ry=0.0, rz=0.0):
        return [float(v) for v in qeuler(rx, ry, rz)]

    def lados(f):
        d = {}
        for lado, sg in (('E', 1.0), ('D', -1.0)):
            for osso, val in f(lado, sg).items():
                d[osso + lado] = val
        return d

    def exp(jaw=0.0, brow_y=0.0, brow_in=0.0, lid=0.0, boca_x=0.0, boca_y=0.0, assim=0.0, brow_assim=0.0):
        d = lados(lambda lado, sg: {
            'Sobrancelha': {'p': [0.0, (brow_y + (brow_assim if lado == 'E' else 0.0)) * s, 0.0], 'r': q(0, 0, sg * brow_in)},
            'Palpebra': {'r': q(lid)},
            'Boca': {'p': [sg * boca_x * s, (boca_y + (assim if lado == 'E' else 0.0)) * s, -0.001 * abs(boca_x) / 0.005]}})
        if jaw:
            d['Mandibula'] = {'r': q(jaw)}
        return d
    return {'neutro': {},
            'medo': exp(jaw=0.20, brow_y=0.012, brow_in=-0.32, lid=-0.34, boca_x=0.006, boca_y=-0.008),
            'grito': exp(jaw=0.34, brow_y=0.012, brow_in=-0.28, lid=-0.38, boca_x=0.005, boca_y=-0.012),
            'surpresa': exp(jaw=0.26, brow_y=0.014, brow_in=0.0, lid=-0.34),
            'sorriso': exp(jaw=0.06, brow_y=0.003, lid=0.14, boca_x=0.005, boca_y=0.010),
            'maldoso': exp(jaw=0.17, brow_y=-0.003, brow_in=0.38, lid=-0.22, boca_x=0.009, boca_y=0.012, assim=0.005, brow_assim=0.004),
            'raiva': exp(jaw=0.10, brow_y=-0.007, brow_in=0.46, lid=0.30, boca_x=0.002, boca_y=-0.006),
            'triste': exp(jaw=0.03, brow_y=0.004, brow_in=-0.30, lid=0.22, boca_x=0.0, boca_y=-0.008)}
