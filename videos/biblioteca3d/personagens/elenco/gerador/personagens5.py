"""Quinto elenco: astronauta com o traje de caminhada espacial da Estação Espacial (o EMU, Extravehicular Mobility Unit), genérico:
sem bandeira, sem nome e sem sigla de agência real. Peças e posições conferidas com descrições do traje real (ver README).

  astronauta          bolha transparente e viseira dourada recolhida: o rosto aparece e mexe; faixas vermelhas nas pernas
  astronauta_viseira  viseira dourada abaixada (rosto escondido, silhueta) e sem faixas (o outro astronauta da dupla)

Peças do traje, de dentro para fora:
  touca de comunicação ("Snoopy cap", branca e marrom, com fones e microfones), forro do pescoço
  tronco rígido (HUT) com anel do pescoço, rolamentos dos ombros (scye) e anel de vedação da cintura (BSC) + rolamento da cintura
  braços com rolamento do braço, cotovelo sanfonado, conector do pulso e luvas de cano largo
  pernas com rolamento da coxa, joelho sanfonado, anel do tornozelo e botas
  painel do peito (DCM): tela, válvula de purga vermelha, chave do ventilador, seletor de energia, volume do rádio,
     válvula de temperatura grande no lado direito, atuador de oxigênio no lado esquerdo, barra de ferramentas (mini-workstation) com ganchos
  mangueiras do painel até a mochila, espelho de pulso (braço direito) e caderno de instruções (braço esquerdo)
  carretel do cabo de segurança no quadril direito
  mochila de suporte de vida (PLSS), oxigênio reserva (SOP) embaixo dela e a mochila de resgate a jato (SAFER) com bicos e controle de mão
  capacete: bolha de policarbonato + capa externa (EVVA) com viseira dourada e luzes com câmera dos dois lados"""
import math
import numpy as np
import cabelo as H
from corpo import BRACO_TAB, PERNA_TAB
from personagens import paleta_rosto, finalizar, base_personagem, alinhar_hem
from forma import loft, tubo, elipsoide, osso, caminho, unit, X_, Y_, Z_

E_T, O_T = 1.24, 0.030              # folga do tronco
E_B, O_B = 1.42, 0.022              # folga dos braços
E_P, O_P = 1.30, 0.024              # folga das pernas


def _bandas(s, faixas, padrao):
    for a, b, m in faixas:
        if a <= s < b:
            return m
    return padrao


def _pregas(trechos):
    """multiplicador do raio com sanfonas: trechos = [(s0, s1, n_dobras, profundidade)]"""
    def f(ss):
        ss = np.asarray(ss, dtype=float)
        m = np.ones_like(ss)
        for a, b, n, p in trechos:
            dentro = (ss >= a) & (ss <= b)
            fase = (ss - a) / (b - a) * n
            m += dentro * p * (0.5 - 0.5 * np.cos(2 * np.pi * fase))
        return m
    return f


def _membro_pt(e, cp, kind, lado, s, ease, off):
    """centro, direção e raios (u, v) da casca de um braço/perna no parâmetro s"""
    pts = cp._pontos(kind, lado)
    tab = BRACO_TAB if kind == 'braco' else PERNA_TAB
    k = cp.k['braco'] if kind == 'braco' else cp.k['perna']
    c = caminho(pts, [0.0, 1.0, 2.0], s)
    d = unit(caminho(pts, [0.0, 1.0, 2.0], s + 0.02) - caminho(pts, [0.0, 1.0, 2.0], s - 0.02))
    ru = float(np.interp(s, tab[:, 0], tab[:, 1])) * k * ease + off
    rv = float(np.interp(s, tab[:, 0], tab[:, 2])) * k * ease + off
    return c, d, ru, rv


# ------------------------------------------------------------------------------------------------ capacete

def _capacete(S, e, cab, viseira):
    wp = osso(e.nb, e.idx, Peito=0.35, Pescoco=0.65)                 # o capacete trava no traje: a cabeça mexe dentro dele
    rx0, rz0, cz0 = cab.perfil(0.5)
    R = 0.170                                                         # bolha de policarbonato
    Rs = R + 0.014                                                    # capa externa (EVVA)
    c = np.array([0.0, cab.chin + 0.56 * cab.h, cz0 + 0.012])
    elipsoide(S, c, X_, Y_, Z_, R, R * 1.02, R, wp, 'vidro', aneis=18, nseg=44)

    def janela(P, folga=0.0):                                         # abertura do rosto na capa
        q = P - c
        return (q[:, 2] > -0.10 * Rs) & (np.abs(q[:, 0]) < (0.66 + folga) * Rs) & (q[:, 1] > -1.0 * Rs) & (q[:, 1] < (0.50 + folga) * Rs)
    def esfera(raio, mat, recorte, z1=0.86):                         # malha fina para a borda recortada sair lisa
        zs = np.sin(np.linspace(-np.pi / 2, np.arcsin(z1), 64))
        C = np.array([c + np.array([0.0, 0.0, z * raio]) for z in zs])
        rr = np.sqrt(np.maximum(1 - zs ** 2, 0)) * raio
        loft(S, C, rr, rr * 1.02, zs, wp, mat, nseg=180, sub=1, frame=(X_, Y_), fecha=(True, z1 >= 0.999), recorte=recorte)
    esfera(Rs, 'casco', janela)
    # viseira dourada: abaixada cobre a janela; recolhida aparece só como uma faixa no alto da abertura
    if viseira:
        esfera(Rs - 0.005, 'viseira', lambda P: ~janela(P, 0.03), z1=1.0)
    else:
        esfera(Rs - 0.005, 'viseira', lambda P: ~(janela(P, 0.03) & ((P - c)[:, 1] > 0.36 * Rs)))
    # luzes e câmera dos dois lados: caixa branca com duas lâmpadas; a da esquerda (+X) tem a câmera
    for sg in (1.0, -1.0):
        p = c + np.array([sg * (Rs + 0.018), 0.045, 0.015])
        elipsoide(S, p, X_, Y_, Z_, 0.026, 0.034, 0.068, wp, 'casco_luz', aneis=7, nseg=14, n=4.0)
        elipsoide(S, p + np.array([-sg * 0.018, -0.005, -0.02]), X_, Y_, Z_, 0.012, 0.022, 0.040, wp, 'anel', aneis=5, nseg=10, n=3.0)   # suporte
        for dy in (0.014, -0.014):
            tubo(S, [p + np.array([0.0, dy, 0.060]), p + np.array([0.0, dy, 0.070])], 0.011, wp, 'lampada', nseg=12, sub=1)
        if sg > 0:
            q = p + np.array([sg * 0.030, -0.006, 0.020])
            elipsoide(S, q, X_, Y_, Z_, 0.016, 0.020, 0.040, wp, 'camera', aneis=6, nseg=12, n=3.5)
            tubo(S, [q + np.array([0.0, 0.0, 0.038]), q + np.array([0.0, 0.0, 0.050])], 0.0085, wp, 'lente', nseg=12, sub=1)
    # anel do pescoço (alumínio), onde o capacete trava no tronco rígido
    K = 56
    th = 2 * np.pi * np.arange(K) / K
    yb = e.rep['Pescoco'][1] + 0.004
    ra = 0.112
    pts = np.array([(math.sin(t) * ra, yb, c[2] - 0.012 + math.cos(t) * ra) for t in th])
    loft(S, pts, np.full(K, 0.026), np.full(K, 0.020), np.zeros(K), lambda s_: osso(e.nb, e.idx, Peito=1), 'anel', sub=1, nseg=12, frame='toro', fechado=True)
    for t in np.linspace(0, 2 * np.pi, 7)[:-1] + 0.5:                 # travas do anel
        elipsoide(S, np.array([math.sin(t) * (ra + 0.026), yb, c[2] - 0.012 + math.cos(t) * (ra + 0.026)]), X_, Y_, Z_, 0.010, 0.012, 0.010,
                  osso(e.nb, e.idx, Peito=1), 'anel_escuro', aneis=4, nseg=8, n=3.0)
    # forro escuro em volta do pescoço
    wn = osso(e.nb, e.idx, Pescoco=1)
    tubo(S, [np.array([0.0, yb - 0.03, 0.0]), np.array([0.0, (yb + cab.chin) / 2, 0.004]), np.array([0.0, cab.chin - 0.025, -0.004])], [0.070, 0.062, 0.050], wn, 'forro', nseg=20, sub=2, fecha=(False, False))


def _touca(S, e, cab):
    """touca de comunicação: laterais brancas, topo marrom, fones nas orelhas e duas hastes de microfone"""
    wc = osso(e.nb, e.idx, Cabeca=1)
    H.touca(S, cab, 'touca', borda=lambda th: 0.60 - 0.18 * math.exp(-((abs(th) - 1.57) / 0.5) ** 2), grossura=0.0065)
    us = np.linspace(0.74, 1.0, 9)
    CC, RX, RZ = [], [], []
    for u in us:
        rx, rz, cz = cab.perfil(u)
        CC.append((0.0, cab.chin + u * cab.h + 0.009, cz))
        RX.append(rx + 0.010)
        RZ.append(rz + 0.010)
    loft(S, np.array(CC), np.array(RX), np.array(RZ), us, wc, 'touca_marrom', nseg=44, sub=2, frame=(X_, Z_), fecha=(False, True))
    for sg in (1.0, -1.0):
        p, _ = cab.couro(0.47, sg * 1.57, 0.012)
        elipsoide(S, p, X_, Y_, Z_, 0.017, 0.035, 0.031, wc, 'fone', aneis=6, nseg=14, n=2.4)
        m, _ = cab.couro(0.30, sg * 0.62, 0.030)
        tubo(S, [p + np.array([0.0, -0.020, 0.018]), p + np.array([-sg * 0.004, -0.048, 0.045]), m], 0.0032, wc, 'fone', nseg=6, sub=3)
        elipsoide(S, m, X_, Y_, Z_, 0.0075, 0.0075, 0.0095, wc, 'fone', aneis=5, nseg=8)


# ------------------------------------------------------------------------------------------------ peito, mochila e acessórios

def _painel_peito(S, e, cp):
    wp = osso(e.nb, e.idx, Peito=1)
    cc, rx, rz = cp.torso(0.58)
    pc = np.array([0.0, cc[1], cc[2] + rz * E_T + O_T + 0.040])
    elipsoide(S, pc, X_, Y_, Z_, 0.125, 0.068, 0.044, wp, 'painel', aneis=8, nseg=24, n=5.0)           # caixa do painel
    elipsoide(S, pc + np.array([0.0, -0.004, -0.040]), X_, Y_, Z_, 0.090, 0.050, 0.012, wp, 'anel_escuro', aneis=4, nseg=16, n=4.0)   # suporte
    topo = pc[1] + 0.066
    elipsoide(S, np.array([0.035, topo + 0.002, pc[2] + 0.006]), X_, Y_, Z_, 0.050, 0.004, 0.024, wp, 'tela', aneis=4, nseg=12, n=5.0)     # tela (lida de cima)
    tubo(S, [np.array([-0.088, topo, pc[2] + 0.010]), np.array([-0.088, topo + 0.022, pc[2] + 0.010])], 0.013, wp, 'botao_verm', nseg=12, sub=1)   # purga
    tubo(S, [np.array([-0.050, topo, pc[2] + 0.018]), np.array([-0.050, topo + 0.016, pc[2] + 0.024])], 0.004, wp, 'anel', nseg=6, sub=1)       # chave do ventilador
    tubo(S, [np.array([-0.050, topo, pc[2] - 0.012]), np.array([-0.050, topo + 0.012, pc[2] - 0.012])], 0.011, wp, 'botao_preto', nseg=10, sub=1)  # seletor de energia
    for x in (0.045, 0.085):                                                                                  # volume do rádio, na frente
        tubo(S, [np.array([x, pc[1] - 0.010, pc[2] + 0.042]), np.array([x, pc[1] - 0.010, pc[2] + 0.056])], 0.010, wp, 'botao_preto', nseg=10, sub=1)
    elipsoide(S, np.array([-0.045, pc[1] + 0.012, pc[2] + 0.044]), X_, Y_, Z_, 0.040, 0.020, 0.003, wp, 'tela', aneis=4, nseg=12, n=4.0)        # mostrador da frente
    for i in range(4):
        elipsoide(S, np.array([-0.075 + i * 0.020, pc[1] - 0.030, pc[2] + 0.044]), X_, Y_, Z_, 0.006, 0.004, 0.002, wp, ('led_verde', 'led_verde', 'led_amarelo', 'botao_verm')[i], aneis=4, nseg=8)
    # válvula de temperatura (lado direito do astronauta = -X) e atuador de oxigênio (lado esquerdo = +X)
    tubo(S, [pc + np.array([-0.125, 0.0, 0.0]), pc + np.array([-0.150, 0.0, 0.0])], 0.034, wp, 'botao_az', nseg=16, sub=1)
    for k in range(8):
        a = 2 * np.pi * k / 8
        elipsoide(S, pc + np.array([-0.150, 0.034 * math.cos(a), 0.034 * math.sin(a)]), Y_, Z_, X_, 0.005, 0.005, 0.012, wp, 'botao_az', aneis=4, nseg=6)
    tubo(S, [pc + np.array([0.125, 0.012, 0.0]), pc + np.array([0.145, 0.012, 0.0])], 0.020, wp, 'anel', nseg=12, sub=1)
    # barra de ferramentas (mini-workstation) com dois ganchos
    bar = pc[1] - 0.088
    tubo(S, [np.array([-0.115, bar, pc[2] + 0.010]), np.array([0.115, bar, pc[2] + 0.010])], 0.009, wp, 'anel', nseg=8, sub=1)
    for sg in (1.0, -1.0):
        tubo(S, [np.array([sg * 0.10, pc[1] - 0.06, pc[2]]), np.array([sg * 0.10, bar, pc[2] + 0.010])], 0.007, wp, 'anel', nseg=6, sub=1)
        g0 = np.array([sg * 0.070, bar, pc[2] + 0.018])
        tubo(S, [g0, g0 + np.array([0.0, -0.040, 0.010]), g0 + np.array([sg * 0.010, -0.060, 0.000]), g0 + np.array([sg * 0.018, -0.050, -0.008])], 0.0045, wp, 'gancho', nseg=6, sub=2)
    return pc


def _mochila_vida(S, e, cp, pc):
    """mochila de suporte de vida (grande, branca), oxigênio reserva embaixo e a mochila de resgate a jato no fim, com bicos e o controle de mão"""
    wp = osso(e.nb, e.idx, Peito=1)
    cc, rx, rz = cp.torso(0.62)
    zc = cc[2] - (rz * E_T + O_T)

    def bloco(y0, y1, lx, prof, mat, n=4.6):
        ctr = np.array([0.0, cc[1] + (y0 + y1) / 2, zc - prof])
        h = (y1 - y0) / 2
        ys = np.array([-1.0, -0.92, -0.70, 0.0, 0.70, 0.92, 1.0]) * h
        C = np.array([ctr + np.array([0.0, y, 0.0]) for y in ys])
        ru = np.array([0.0, 0.90, 0.98, 1.0, 0.98, 0.90, 0.0]) * lx
        rv = np.array([0.0, 0.90, 0.98, 1.0, 0.98, 0.90, 0.0]) * prof
        loft(S, C, ru, rv, np.arange(7.0), wp, mat, n=n, sub=3, frame=(X_, Z_), fecha=(True, True), nseg=28)
        return ctr, h
    pl, hp = bloco(-0.16, 0.36, 0.235, 0.110, 'mochila')
    elipsoide(S, pl + np.array([0.0, 0.04, -0.108]), X_, Y_, Z_, 0.175, 0.200, 0.010, wp, 'mochila_det', aneis=6, nseg=20, n=5.0)        # tampa de trás
    for y in (-0.10, -0.03, 0.04, 0.11):
        elipsoide(S, pl + np.array([0.0, y, -0.120]), X_, Y_, Z_, 0.12, 0.006, 0.003, wp, 'anel', aneis=4, nseg=12, n=3.0)
    elipsoide(S, pl + np.array([0.165, 0.20, -0.112]), X_, Y_, Z_, 0.030, 0.020, 0.006, wp, 'anel_escuro', aneis=4, nseg=10, n=4.0)       # rádio
    tubo(S, [pl + np.array([0.20, hp - 0.02, -0.05]), pl + np.array([0.20, hp + 0.09, -0.05])], 0.006, wp, 'anel_escuro', nseg=6, sub=1)   # antena
    bloco(-0.27, -0.165, 0.215, 0.100, 'mochila_det')                                                                                 # oxigênio reserva
    sa, ha = bloco(-0.43, -0.275, 0.250, 0.135, 'safer', n=5.0)                                                                       # mochila de resgate a jato
    for sx in (1.0, -1.0):                                                                                                            # bicos: para trás, para os lados e para baixo
        for sy in (1.0, -1.0):
            b = sa + np.array([sx * 0.215, sy * ha * 0.75, -0.115])
            tubo(S, [b, b + np.array([0.0, 0.0, -0.040])], [0.010, 0.014], wp, 'bico', nseg=8, sub=1)
            b = sa + np.array([sx * 0.245, sy * ha * 0.60, -0.030])
            tubo(S, [b, b + np.array([sx * 0.035, 0.0, 0.0])], [0.010, 0.014], wp, 'bico', nseg=8, sub=1)
        b = sa + np.array([sx * 0.18, -ha, -0.070])
        tubo(S, [b, b + np.array([0.0, -0.035, 0.0])], [0.010, 0.014], wp, 'bico', nseg=8, sub=1)
    hc = sa + np.array([0.268, -0.01, 0.075])                                                                                         # controle de mão, guardado do lado esquerdo
    elipsoide(S, hc, X_, Y_, Z_, 0.028, 0.045, 0.060, wp, 'safer_controle', aneis=6, nseg=12, n=4.0)
    tubo(S, [hc + np.array([0.0, 0.040, 0.030]), hc + np.array([0.0, 0.070, 0.030])], 0.010, wp, 'botao_preto', nseg=8, sub=1)
    # mangueiras: do painel do peito, contornando o tronco, até a mochila
    for sg in (1.0, -1.0):
        a = pc + np.array([sg * 0.110, -0.040, -0.010])
        b = np.array([sg * (rx * E_T + O_T + 0.035), cc[1] - 0.12, cc[2] + 0.06])
        d = pl + np.array([sg * 0.225, -0.13, 0.05])
        tubo(S, [a, a + np.array([sg * 0.05, -0.06, 0.0]), b, (b + d) / 2 + np.array([sg * 0.03, -0.03, 0.0]), d], 0.011, wp, 'mangueira', nseg=10, sub=3)
        for t in np.linspace(0.15, 0.85, 6):                                                                                         # anéis da mangueira corrugada
            p = caminho([a, b, d], [0.0, 1.0, 2.0], t * 2)
            elipsoide(S, p, X_, Y_, Z_, 0.014, 0.014, 0.014, wp, 'mangueira_anel', aneis=4, nseg=8)


def _acessorios_braco(S, e, cp):
    """caderno de instruções no punho esquerdo (+X) e espelho no punho direito (-X), do lado de fora do antebraço"""
    for lado, sg in (('E', 1.0), ('D', -1.0)):
        w = osso(e.nb, e.idx, **{'Antebraco' + lado: 1})
        c, d, ru, rv = _membro_pt(e, cp, 'braco', lado, 1.55 if lado == 'E' else 1.72, E_B, O_B)
        o = unit(np.array([sg, 0.0, 0.0]) - d * d[0] * sg)
        b = unit(np.cross(d, o))
        if lado == 'E':
            centro = c + o * (ru + 0.012)
            elipsoide(S, centro, b, d, o, 0.040, 0.052, 0.010, w, 'papel', aneis=5, nseg=14, n=6.0)
            elipsoide(S, centro + o * 0.010, b, d, o, 0.041, 0.053, 0.002, w, 'capa', aneis=4, nseg=14, n=6.0)
            for k in (-0.025, 0.0, 0.025):                                                                                               # argolas
                tubo(S, [centro + b * k + d * 0.050 - o * 0.008, centro + b * k + d * 0.058, centro + b * k + d * 0.050 + o * 0.012], 0.003, w, 'anel', nseg=6, sub=2)
            alcance = 0.052
        else:
            base = c + o * (ru + 0.006)
            tubo(S, [base, base + o * 0.030 + d * 0.010], 0.006, w, 'anel', nseg=6, sub=1)
            elipsoide(S, base + o * 0.034 + d * 0.012, b, d, o, 0.032, 0.024, 0.006, w, 'espelho_aro', aneis=5, nseg=16, n=2.4)
            elipsoide(S, base + o * 0.040 + d * 0.012, b, d, o, 0.027, 0.020, 0.002, w, 'espelho', aneis=4, nseg=16, n=2.4)
            alcance = 0.030
        for t in (-0.6, 0.6):                                                                                                             # tiras em volta do punho
            p = c + d * alcance * t
            tubo(S, [p + o * (ru + 0.004) + b * 0.04, p + b * (rv + 0.004), p - o * (ru + 0.004), p - b * (rv + 0.004), p + o * (ru + 0.004) - b * 0.04],
                 0.004, w, 'anel_escuro', nseg=6, sub=2, achatamento=0.4)


def _cabo_seguranca(S, e, cp):
    """carretel do cabo de segurança no quadril direito (-X) com o mosquetão"""
    w = osso(e.nb, e.idx, Quadril=1)
    cc, rx, rz = cp.torso(-0.02)
    p = np.array([-(rx * E_T + O_T + 0.022), cc[1], cc[2] + 0.02])
    elipsoide(S, p, Y_, Z_, X_, 0.050, 0.050, 0.020, w, 'carretel', aneis=6, nseg=20, n=2.4)
    elipsoide(S, p + np.array([-0.020, 0.0, 0.0]), Y_, Z_, X_, 0.018, 0.018, 0.006, w, 'anel_escuro', aneis=4, nseg=12)
    q = p + np.array([-0.004, -0.050, 0.020])
    tubo(S, [q, q + np.array([0.0, -0.030, 0.012]), q + np.array([0.0, -0.050, 0.004])], 0.004, w, 'cabo', nseg=6, sub=2)
    g = q + np.array([0.0, -0.055, 0.004])
    tubo(S, [g + np.array([0.0, 0.012, 0.0]), g + np.array([0.0, -0.018, 0.010]), g + np.array([0.0, -0.030, -0.004]), g + np.array([0.0, -0.012, -0.014])],
         0.0045, w, 'gancho', nseg=6, sub=2)


# ------------------------------------------------------------------------------------------------ traje

def _astronauta(viseira):
    e, cab, cp, S, _ = base_personagem(
        dict(perna=1.0, tronco=1.0, braco=1.0, pescoco=1.0, cabeca=1.0, ombros=1.02, quadril=1.0, pe=1.05),
        dict(res=2.0, sx=1.02, sz=1.02, mand=0.004, olho_r=0.0126, olho_fundo=0.70, olho_x=0.0312, lid_aberta=28, iris=0.54, nariz_comp=0.0185, nariz_larg=0.0100,
             nariz_ponta=0.0088, boca_larg=0.0275, labio=0.0040, sobr_esp=0.0060, sobr_larg=0.036, barba=0.08, dentes=6),
        dict(k_braco=1.0, k_perna=1.0, k_peito=1.05, k_ombro=1.04, k_quad=1.04, k_mao=1.30))
    pal = paleta_rosto('#d9a98a', iris='#3a4a5a', sobr='#3a2a1c')
    pal.update({
        'touca': ('#f0ede6', .85), 'touca_marrom': ('#6b4a2e', .85), 'fone': ('#26282c', .6), 'forro': ('#4a4d53', .9),
        'traje': ('#eceae4', .85), 'traje_dobra': ('#d4d1c9', .9), 'anel': ('#b4b9bf', .35, .55), 'anel_escuro': ('#5e636a', .5, .4), 'listra': ('#c8322b', .8),
        'luva': ('#e4e2dc', .8), 'bota': ('#dedcd5', .8), 'sola': ('#3a3d42', .9), 'bota_det': ('#9aa0a7', .7),
        'mochila': ('#eeece6', .8), 'mochila_det': ('#d8d6cf', .85), 'safer': ('#e6e3db', .8), 'safer_controle': ('#cfccc4', .7), 'bico': ('#6f747b', .4, .6),
        'painel': ('#dddbd4', .7), 'tela': ('#1d3326', .2, .1), 'led_verde': dict(cor='#3ad16a', rug=.3, emissivo='#2fbf5c'), 'led_amarelo': dict(cor='#f2c12e', rug=.3, emissivo='#d9a520'),
        'botao_verm': ('#d63a2e', .5), 'botao_az': ('#2c64c4', .5), 'botao_preto': ('#24262a', .5), 'gancho': ('#d9b52c', .35, .7),
        'mangueira': ('#8e949b', .6, .2), 'mangueira_anel': ('#7a8087', .6, .2), 'emblema': ('#24467d', .7), 'emblema_borda': ('#d9b52c', .5, .4),
        'papel': ('#f7f5ee', .9), 'capa': ('#e3e1da', .8), 'espelho': ('#e9eef2', .05, 1.0), 'espelho_aro': ('#8d9399', .4, .6),
        'carretel': ('#9ca2a8', .45, .5), 'cabo': ('#e8e4d8', .8),
        'casco': dict(cor='#f1efe9', rug=.55, dupla=True), 'casco_luz': ('#f1efe9', .55), 'lampada': dict(cor='#fff4d6', rug=.3, emissivo='#fff0c8'),
        'camera': ('#2a2d32', .4, .3), 'lente': ('#10161c', .05, .6),
        'vidro': dict(cor='#cfe6f5', rug=.05, metal=.0, opacidade=0.16, dupla=True),
        'viseira': dict(cor='#e0a83a', rug=.18, metal=.5, dupla=True),
    })
    yh, yf = alinhar_hem(cp, -0.30, 0.08)
    # tronco: rígido em cima (mais quadrado), com o anel de vedação e o rolamento da cintura embaixo
    cp.casca_torso(S, -0.30, 0.97, E_T, O_T, lambda t: _bandas(t, [(-0.10, -0.06, 'anel'), (0.015, 0.06, 'anel')], 'traje'), n_an=56, y_hem_seguir=(yh, yf), gola=(0.02, 0.075),
                   flare=lambda t: (0.014 * max(0.0, 1 - abs(t - 0.035) / 0.035) + 0.010 * max(0.0, 1 - abs(t + 0.08) / 0.03),) * 2, n=3.0)
    listras = [] if viseira else [(0.40, 0.56, 'listra')]
    for lado in 'ED':
        # braço: manga, rolamento do ombro e do braço, cotovelo sanfonado, conector do pulso e luva de cano largo
        cp.membro(S, 'braco', lado, -0.2, 1.86, E_B, O_B, lambda s: _bandas(s, [(0.80, 1.22, 'traje_dobra')], 'traje'), n_an=80,
                  extra=_pregas([(0.80, 1.22, 5, 0.075), (0.42, 0.62, 2, 0.04)]))
        cp.membro(S, 'braco', lado, -0.07, 0.05, E_B * 1.12, O_B + 0.006, 'anel', n_an=5, fecha=(True, True))
        cp.membro(S, 'braco', lado, 0.28, 0.34, E_B * 1.08, O_B + 0.004, 'anel', n_an=4, fecha=(True, True))
        cp.membro(S, 'braco', lado, 1.84, 1.92, E_B * 1.30, O_B + 0.008, 'anel', n_an=4, fecha=(True, True))
        cp.membro(S, 'braco', lado, 1.90, 2.03, E_B * 1.20, O_B + 0.004, 'luva', n_an=6, fecha=(True, True), extra=lambda ss: 1.0 + 0.30 * (1 - (np.asarray(ss) - 1.90) / 0.13))
        cp.mao(S, lado, mat='luva')
        # perna: rolamento da coxa, joelho sanfonado, anel do tornozelo, bota
        cp.membro(S, 'perna', lado, -0.12, 2.04, E_P, O_P, lambda s: _bandas(s, listras + [(0.80, 1.26, 'traje_dobra')], 'traje'), n_an=80,
                  extra=_pregas([(0.80, 1.26, 5, 0.065), (-0.05, 0.10, 2, 0.04)]))
        cp.membro(S, 'perna', lado, 0.14, 0.19, E_P * 1.06, O_P + 0.004, 'anel', n_an=4, fecha=(True, True))
        cp.membro(S, 'perna', lado, 1.80, 1.86, E_P * 1.12, O_P + 0.004, 'anel', n_an=4, fecha=(True, True))
        cp.sapato(S, lado, 'bota', 'bota', 'sola', 'bota_det')
    # emblema redondo no braço esquerdo (azul com aro dourado, sem bandeira)
    wb = osso(e.nb, e.idx, BracoE=1)
    c, d, ru, rv = _membro_pt(e, cp, 'braco', 'E', 0.55, E_B, O_B)
    elipsoide(S, c + np.array([ru + 0.002, 0.0, 0.0]), Y_, Z_, X_, 0.040, 0.040, 0.004, wb, 'emblema_borda', aneis=4, nseg=20)
    elipsoide(S, c + np.array([ru + 0.005, 0.0, 0.0]), Y_, Z_, X_, 0.034, 0.034, 0.003, wb, 'emblema', aneis=4, nseg=20)
    _touca(S, e, cab)
    pc = _painel_peito(S, e, cp)
    _mochila_vida(S, e, cp, pc)
    _acessorios_braco(S, e, cp)
    _cabo_seguranca(S, e, cp)
    _capacete(S, e, cab, viseira)
    nome = 'Astronauta (viseira)' if viseira else 'Astronauta'
    return e, S, pal, finalizar(cab, {'nome': nome, 'papel': 'astronauta', 'idade': 38, 'traje': 'EMU genérico'}, {
        'parado': {'T': 4.6, 'sway': 0.006, 'inquieto': 0.3},
        'andar': {'lean': 0.06, 'braco_amp': 0.16, 'quica': 0.7, 'v': 0.9},
        'correr': {'lean': 0.20, 'braco_amp': 0.30},
        'fugir': None, 'assustado': {'agacha': 0.03}})


def astronauta():
    return _astronauta(False)


def astronauta_viseira():
    return _astronauta(True)
