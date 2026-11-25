"""Sétimo elenco: herói protagonista em estilo anime (inspirado nos traços de mangá de luta dos anos 80/90, mas ORIGINAL).
Kael, uns 19 anos. O que vem da referência é só a linguagem: corpo de herói (ombros largos, cintura fina), olhos grandes e angulosos,
sobrancelhas grossas e decididas, cabelo em mechas sólidas e pontudas. O desenho é próprio:
  - cabelo: crista varrida para trás e para a esquerda (como se ele tivesse corrido contra o vento), com UMA mecha longa que cai
    em diagonal sobre a testa e para à direita, pontas laterais para trás e nuca em pontas curtas;
  - roupa: quimono de treino sem mangas azul-marinho, gola em V transpassada com debrum carmim, faixa carmim com o nó do lado,
    calça larga areia presa no cano da bota, munhequeiras carmim;
  - cores: azul-marinho + carmim + areia (nada de laranja/azul).
No jogo ele usa material de desenho (toon) e contorno preto (ver README)."""
import math
import numpy as np
import cabelo as H
from personagens import paleta_rosto, finalizar, base_personagem, alinhar_hem
from forma import loft, tubo, elipsoide, osso, unit, X_, Y_, Z_


def _espeto(S, cab, mat, u, th, comp, dire, raio, dobra=(0.0, 0.0, 0.0), achat=0.62, n_pts=6, saida=0.5, fundo=-0.008):
    """mecha sólida e pontuda de anime: nasce no couro (u, th), sai na direção (normal*saida + dire), curva aos poucos para `dobra`"""
    wc = osso(cab.e.nb, cab.e.idx, Cabeca=1)
    p0, nrm = cab.couro(u, th, fundo)
    d = unit(nrm * saida + np.asarray(dire, float))
    dob = np.asarray(dobra, float)
    seg = comp / (n_pts - 1)
    pts, cur = [p0], p0.copy()
    for k in range(1, n_pts):
        d = unit(d + dob / (n_pts - 1))
        cur = cur + d * seg
        pts.append(cur.copy())
    tt = np.linspace(0, 1, n_pts)
    rr = raio * (1 - tt) ** 1.05 * (1 + 0.22 * np.sin(np.pi * tt)) + 0.0006
    tubo(S, np.array(pts), rr, wc, mat, nseg=10, sub=3, fecha=(True, True), achatamento=achat, n=2.2)


def _mecha_pontos(S, cab, mat, pts, raios, achat=0.55):
    tubo(S, np.array(pts), np.array(raios), osso(cab.e.nb, cab.e.idx, Cabeca=1), mat, nseg=10, sub=4, fecha=(True, True), achatamento=achat, n=2.2)


def cabelo_crista(S, cab, mat):
    """cabelo próprio do Kael: volume base + crista varrida para trás/esquerda + mecha da testa + laterais e nuca"""
    H.touca(S, cab, mat, borda=lambda th: 0.70 - 0.16 * min(1.0, abs(th) / 1.6) - 0.12 * max(0.0, (abs(th) - 2.2) / 0.9), grossura=0.0065)
    # crista: pontas grandes saindo do alto, todas puxadas para trás (-z), para cima e um pouco para a esquerda (+x)
    crista = [  # (u, th, comp, raio, dire, dobra)
        (0.95, 0.20, 0.150, 0.036, (0.25, 0.55, -0.80), (0.10, 0.30, -0.25)),
        (0.92, 0.80, 0.140, 0.034, (0.60, 0.45, -0.75), (0.20, 0.20, -0.20)),
        (0.93, -0.50, 0.130, 0.034, (0.05, 0.55, -0.85), (0.15, 0.25, -0.20)),
        (0.88, 1.35, 0.120, 0.030, (0.75, 0.45, -0.60), (0.15, 0.10, -0.25)),
        (0.88, -1.25, 0.110, 0.030, (-0.45, 0.65, -0.70), (0.20, 0.15, -0.25)),
        (0.90, 2.05, 0.120, 0.031, (0.55, 0.40, -0.85), (0.05, 0.05, -0.20)),
        (0.90, -2.05, 0.115, 0.031, (-0.30, 0.45, -0.90), (0.15, 0.05, -0.20)),
        (0.88, 2.75, 0.125, 0.032, (0.20, 0.35, -1.00), (0.05, 0.12, -0.10)),
        (0.86, -2.70, 0.115, 0.031, (-0.10, 0.30, -1.00), (0.10, 0.12, -0.10)),
        (0.80, 3.14, 0.105, 0.030, (0.05, 0.10, -1.00), (0.0, 0.10, -0.05)),
    ]
    for u, th, comp, r, dire, dob in crista:
        _espeto(S, cab, mat, u, th, comp, dire, r, dob)
    # laterais (acima das orelhas) e nuca: pontas curtas para trás e para baixo
    for s in (1, -1):
        for u, th, comp, r in ((0.72, 1.45, 0.045, 0.016), (0.66, 1.95, 0.050, 0.017), (0.68, 2.40, 0.055, 0.018)):
            _espeto(S, cab, mat, u, s * th, comp, (s * 0.55, -0.35, -0.75), r, (0.0, -0.15, -0.10), saida=0.35)
    for th, comp in ((2.85, 0.075), (-2.85, 0.070), (3.14, 0.085)):
        _espeto(S, cab, mat, 0.50, th, comp, (0.0, -0.75, -0.55), 0.022, (0.0, -0.1, 0.1), saida=0.35)
    # mecha longa da testa: nasce no alto à esquerda, cai em diagonal sobre a testa e termina sobre a sobrancelha direita
    pts = [cab.couro(0.90, 0.40, 0.004)[0], cab.couro(0.82, 0.22, 0.018)[0], cab.couro(0.74, -0.02, 0.022)[0],
           cab.couro(0.68, -0.22, 0.020)[0], cab.couro(0.63, -0.36, 0.024)[0] + np.array([0.0, 0.0, 0.004])]
    _mecha_pontos(S, cab, mat, pts, [0.022, 0.020, 0.016, 0.010, 0.0012])
    # duas franjas curtas que fecham a linha do cabelo
    for th, u, comp, dire in ((0.62, 0.80, 0.055, (0.35, -0.70, 0.30)), (-0.62, 0.80, 0.060, (-0.30, -0.70, 0.30)), (1.00, 0.74, 0.050, (0.45, -0.75, 0.15)),
                              (-1.00, 0.74, 0.052, (-0.45, -0.75, 0.15)), (0.30, 0.84, 0.045, (0.15, -0.70, 0.40))):
        _espeto(S, cab, mat, u, th, comp, dire, 0.017, (0.0, -0.25, 0.0), saida=0.40)


def _delineado(S, cab, e, mat):
    """traço grosso de anime na borda da pálpebra de cima (vai junto com a pálpebra quando pisca), com a ponta de fora puxada para trás"""
    p = cab.p
    for lado, sg in (('E', 1.0), ('D', -1.0)):
        r = cab.r_olho * (p['olhos_assim'] if lado == 'E' else 1.0)
        xo = sg * cab.ex
        c = np.array([xo, cab.y_olho, cab.zf(xo, cab.y_olho) - p['olho_fundo'] * r])
        psi = math.radians(p['lid_aberta'])
        ang = math.radians(150.0) - psi
        pol = psi + ang / 2
        dirp = np.array([0.0, math.sin(pol), math.cos(pol)])
        vp = np.cross(dirp, X_)
        rl = r * 1.16
        fis = np.linspace(-1.25, 1.25, 15)
        pts = [c + rl * (math.cos(ang / 2) * dirp + math.sin(ang / 2) * (math.sin(f) * X_ * sg + math.cos(f) * unit(vp) * np.sign(np.dot(vp, Z_) or 1))) for f in fis]
        pts = np.array(pts)
        pts = pts[np.argsort(pts[:, 0] * sg)]                        # de dentro (nariz) para fora
        fora = pts[-1] + np.array([sg * 0.0065, 0.0022, -0.004])     # rabinho do traço
        pts = np.vstack([pts, fora])
        k = len(pts)
        tt = np.linspace(0, 1, k)
        rr = 0.0009 + 0.0020 * np.sin(np.pi * np.clip(tt * 0.85 + 0.08, 0, 1)) ** 0.6
        rr[-1] = 0.0005
        tubo(S, pts, rr, osso(e.nb, e.idx, **{'Palpebra' + lado: 1}), mat, nseg=8, sub=3, fecha=(True, True), achatamento=0.55)


def kael():
    """herói protagonista: Kael, 19 anos, quimono de treino sem mangas azul-marinho com debrum carmim, faixa carmim, calça areia, botas"""
    e, cab, cp, S, _ = base_personagem(
        dict(perna=1.24, tronco=0.72, braco=0.93, pescoco=0.92, cabeca=1.12, ombros=1.06, quadril=1.02, pe=1.08, abre_braco=10.0),
        dict(res=2.0, sx=0.98, sz=1.0, mand=-0.002, queixo=0.002, bochecha=-0.008, olho_r=0.0168, olho_fundo=0.80, olho_x=0.0340, lid_aberta=17,
             iris=0.62, pupila=0.24, nariz_comp=0.0075, nariz_larg=0.0040, nariz_ponta=0.0042, narina=0.0008, nariz_ponte=0.45, boca_larg=0.0170, labio=0.0018,
             sobr_esp=0.0110, sobr_larg=0.044, sobr_incl=2.3, sobr_u=0.090, barba=0.0, rubor=0.10, dentes=6),
        dict(k_braco=1.14, k_perna=1.10, k_peito=1.36, k_ombro=1.08, k_cintura=0.92, k_quad=0.80, k_mao=1.20, k_pesc=1.22))
    pal = paleta_rosto('#e9b993', iris='#1c6d86', sobr='#141526')
    pal.update({'cabelo': ('#1a1d33', .55), 'gi': ('#1f2c4d', .85), 'debrum': ('#b0202c', .7), 'faixa': ('#a51d29', .75), 'calca': ('#1f2c4d', .85), 'camiseta': ('#9e1e2a', .8), 'cordao': ('#d6b25a', .6),
                'munheq': ('#b0202c', .8), 'bota': ('#1c2340', .6), 'sola': ('#9e1e2a', .85), 'bota_det': ('#9e1e2a', .65), 'delineado': ('#111322', .6)})
    pal['labio'] = ('#c4876f', .6)
    yh, yf = alinhar_hem(cp, -0.30, 0.08)
    afina = lambda t: (0.80 + 0.20 * min(1.0, max(0.0, (t + 0.05) / 0.65)) ** 0.8) if t > -0.06 else 0.80 + 0.55 * min(0.22, -0.06 - t)   # V em cima; abaixo da faixa a calça abre no quadril

    # gola em V: recorte na frente do quimono (abre do peito até o pescoço) mostrando o peito
    yv0, ytop = cp.torso(0.50)[0][1], cp.torso(0.99)[0][1]
    zc = cp.torso(0.75)[0][2]
    larg_v = lambda y: 0.078 * max(0.0, (y - yv0) / (ytop - yv0))
    recorte_v = lambda cen: (cen[:, 2] > zc) & (np.abs(cen[:, 0]) < np.array([larg_v(y) for y in cen[:, 1]]))
    cp.casca_torso(S, 0.40, 0.985, 1.04, 0.004, 'camiseta', n_an=20)                 # camiseta carmim por baixo do V
    cp.casca_torso(S, -0.30, 0.97, 1.14, 0.010, lambda t: 'calca' if t < -0.06 else 'gi', n_an=48, nseg=132, y_hem_seguir=(yh, yf), recorte=recorte_v, perfil_extra=afina,
                   flare=lambda t: (0.010 * max(0.0, (-0.04 - t) / 0.26), 0.010 * max(0.0, (-0.04 - t) / 0.26)))
    # gola atrás do pescoço: fita carmim que liga as duas pontas do V passando pela nuca
    c, rx, rz = cp.torso(0.955)
    R_x, R_z = rx * 1.14 + 0.010, rz * 1.14 + 0.010
    th0 = math.asin(min(1.0, larg_v(c[1]) / R_x))
    ths = np.linspace(th0, 2 * math.pi - th0, 40)
    pts = np.array([(R_x * math.sin(t) * (abs(math.sin(t)) ** (2 / 2.4 - 1) if abs(math.sin(t)) > 1e-6 else 0.0) * 0 + R_x * np.sign(math.sin(t)) * abs(math.sin(t)) ** (2 / 2.4),
                     c[1] - 0.004, c[2] + R_z * np.sign(math.cos(t)) * abs(math.cos(t)) ** (2 / 2.4)) for t in ths])
    loft(S, pts, np.full(len(ths), 0.0085), np.full(len(ths), 0.0060), np.linspace(0.97, 0.97, len(ths)), cp.pesos_torso(), 'debrum', n=2.4, sub=2, nseg=8, frame='auto', fecha=(True, True))
    # debrum carmim ao longo das duas bordas do V (fita que desce até a faixa, transpassada)
    for s in (1, -1):
        ts = np.linspace(0.50, 0.965, 14)
        pts = []
        for t in ts:
            c, rx, rz = cp.torso(t)
            R_x, R_z = rx * 1.14 * afina(t) + 0.010, rz * 1.14 * afina(t) + 0.010
            x = s * larg_v(c[1])
            z = c[2] + R_z * max(0.0, 1 - abs(x / R_x) ** 2.4) ** (1 / 2.4)
            pts.append((x, c[1], z + 0.002))
        loft(S, np.array(pts), np.full(len(ts), 0.0065), np.full(len(ts), 0.0030), ts, cp.pesos_torso(), 'debrum', n=2.4, sub=2, nseg=8,
             frame='auto', fecha=(True, True))
    # transpasse: a borda do lado esquerdo continua cruzando até a faixa (o painel de cima do quimono)
    ts = np.linspace(0.06, 0.50, 10)
    pts = []
    for i, t in enumerate(ts):
        c, rx, rz = cp.torso(t)
        R_x, R_z = rx * 1.14 * afina(t) + 0.010, rz * 1.14 * afina(t) + 0.010
        x = -0.065 + (0.0 - (-0.065)) * (i / (len(ts) - 1))
        z = c[2] + R_z * max(0.0, 1 - abs(x / R_x) ** 2.4) ** (1 / 2.4)
        pts.append((x, c[1], z + 0.002))
    loft(S, np.array(pts), np.full(len(ts), 0.0065), np.full(len(ts), 0.0030), ts, cp.pesos_torso(), 'debrum', n=2.4, sub=2, nseg=8, frame='auto', fecha=(True, True))
    # faixa na cintura com o nó do lado esquerdo e as duas pontas caindo
    cp.casca_torso(S, -0.12, 0.09, 1.30, 0.022, 'faixa', n_an=14, perfil_extra=lambda t: 0.98, fecha=(True, True))
    for tv in (-0.07, 0.0, 0.065):                                                                 # voltas da faixa (relevo leve)
        cp.casca_torso(S, tv - 0.012, tv + 0.012, 1.315, 0.022, 'faixa', n_an=4, perfil_extra=lambda t: 0.98, fecha=(True, True))   # faixa grossa de várias voltas
    c, rx, rz = cp.torso(-0.02)
    wq = osso(e.nb, e.idx, Quadril=1)
    ang = 0.75
    pn = c + np.array([(rx * 1.33 * 0.98 + 0.022) * math.sin(ang), 0.0, (rz * 1.33 * 0.98 + 0.022) * math.cos(ang)])
    elipsoide(S, pn, X_, Y_, Z_, 0.026, 0.022, 0.016, wq, 'faixa', aneis=8, nseg=14, n=2.2)
    for k, (dx, comp) in enumerate(((0.012, 0.20), (-0.010, 0.16))):
        p = [pn + np.array([dx, -0.01, 0.006]), pn + np.array([dx * 1.8 + 0.008, -comp * 0.5, 0.012]), pn + np.array([dx * 2.4 + 0.018, -comp, 0.008])]
        tubo(S, np.array(p), np.array([0.020, 0.022, 0.024]), wq, 'faixa', nseg=10, sub=3, fecha=(True, True), achatamento=0.22, n=2.6)

    musc = lambda ss: (1.0 + 0.24 * np.exp(-((ss - 0.50) / 0.24) ** 2) + 0.06 * np.exp(-((ss + 0.02) / 0.12) ** 2) + 0.36 * np.exp(-((ss - 1.22) / 0.24) ** 2) + 0.05 * np.clip((ss - 1.75) / 0.2, 0, 1))
    for lado in 'ED':
        cp.membro(S, 'braco', lado, -0.2, 2.04, 1.0, 0.0, 'pele', n_an=30, extra=musc)                    # braços musculosos (bíceps e antebraço)
        cp.membro(S, 'braco', lado, -0.2, 0.34, 1.10, 0.010, 'gi', n_an=10, extra=lambda ss: 1.0 + 0.04 * np.clip((ss - 0.05) / 0.25, 0, 1))  # manguinha do quimono
        cp.membro(S, 'braco', lado, 0.30, 0.35, 1.16, 0.011, 'debrum', n_an=3)
        cp.membro(S, 'braco', lado, 1.70, 1.97, 1.18, 0.006, 'munheq', n_an=8)                          # munhequeira
        cp.mao(S, lado)
        # calça larga que estufa na canela e entra no cano da bota
        cp.membro(S, 'perna', lado, -0.12, 1.36, 1.32, 0.014, 'calca', n_an=26,
                  extra=lambda ss: 0.80 + 0.20 * np.clip((ss - 0.02) / 0.30, 0, 1) + 0.30 * np.clip((ss - 0.7) / 0.55, 0, 1) - 0.30 * np.clip((ss - 1.24) / 0.12, 0, 1) + 0.03 * np.sin(ss * 14))   # calça bem larga que embola
        cp.sapato(S, lado, 'bota', 'bota', 'sola', 'bota_det', cano=False)
        cp.membro(S, 'perna', lado, 1.22, 1.98, 1.12, 0.010, 'bota', n_an=14)                            # cano alto da bota
        cp.membro(S, 'perna', lado, 1.40, 1.45, 1.17, 0.010, 'cordao', n_an=3)                           # cordão amarrado no cano
    cabelo_crista(S, cab, 'cabelo')
    _delineado(S, cab, e, 'delineado')
    return e, S, pal, finalizar(cab, {'nome': 'Kael', 'papel': 'heroi', 'idade': 19, 'estilo': 'anime'}, {
        'parado': {'T': 3.6, 'sway': 0.008, 'inquieto': 0.3}, 'andar': {'lean': 0.05, 'braco_amp': 0.30, 'quica': 1.0, 'v': 1.35},
        'correr': {'lean': 0.34, 'braco_amp': 0.6}, 'fugir': None})
