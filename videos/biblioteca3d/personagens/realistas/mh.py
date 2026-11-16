# Leitura dos dados do MakeHuman (só numpy): malha base hm08, alvos de forma (.target.gz), proxies (.mhclo) e o corpo do Lucas
# (idade, gênero, músculo, peso e magreza como os controles "macro" do MakeHuman). Usado pelo script do Blender e pelo de texturas.
import gzip, os
import numpy as np

def ler_obj(caminho):
    V, VT, F, G, g = [], [], [], [], 'default'
    with open(caminho) as f:
        for l in f:
            p = l.split()
            if not p: continue
            if p[0] == 'v': V.append([float(x) for x in p[1:4]])
            elif p[0] == 'vt': VT.append([float(x) for x in p[1:3]])
            elif p[0] == 'g': g = p[1] if len(p) > 1 else 'default'
            elif p[0] == 'f':
                vs, ts = [], []
                for c in p[1:]:
                    q = c.split('/'); vs.append(int(q[0]) - 1); ts.append(int(q[1]) - 1 if len(q) > 1 and q[1] else -1)
                F.append((vs, ts)); G.append(g)
    return np.array(V, float), (np.array(VT, float) if VT else np.zeros((0, 2))), F, G

def ler_alvo(caminho):
    idx, d = [], []
    with gzip.open(caminho, 'rt') as f:
        for l in f:
            p = l.split()
            if len(p) == 4 and not l.startswith('#'): idx.append(int(p[0])); d.append([float(x) for x in p[1:]])
    return np.array(idx, int), np.array(d, float)

def aplicar(V, caminho, peso):
    if abs(peso) < 1e-6 or not os.path.exists(caminho): return
    i, d = ler_alvo(caminho)
    if len(i): V[i] += peso * d

def pesos_idade(v):                                  # 0: 1 ano, 0,1875: 11 anos, 0,5: 25 anos, 1: 90 anos
    if v < 0.1875: return {'baby': 1 - v / 0.1875, 'child': v / 0.1875}
    if v < 0.5: k = (v - 0.1875) / 0.3125; return {'child': 1 - k, 'young': k}
    k = (v - 0.5) / 0.5; return {'young': 1 - k, 'old': k}
def pesos_3(v, nomes):
    if v < 0.5: return {nomes[0]: 1 - v / 0.5, nomes[1]: v / 0.5}
    return {nomes[1]: 1 - (v - 0.5) / 0.5, nomes[2]: (v - 0.5) / 0.5}

def corpo(dados, ficha):
    """corpo a partir da ficha: genero (1 = masculino, 0 = feminino), idade (anos), musculo, peso, altura (0..1, 0,5 = médio),
    magreza (atrofia: braços e pernas finos, rosto magro com olheiras), ajustes {alvo: peso} extras. Devolve V (espaço OBJ: dm, y para cima), VT, F, G, grupos"""
    V, VT, F, G = ler_obj(os.path.join(dados, '3dobjs/base.obj'))
    genero, idade = ficha.get('genero', 1.0), ficha.get('idade', 30)
    magreza = ficha.get('magreza', 0.0)
    v_idade = 0.1875 + (idade - 11) / 14 * 0.3125 if 11 <= idade <= 25 else (idade / 11 * 0.1875 if idade < 11 else 0.5 + (idade - 25) / 65 * 0.5)
    PG = {'male': genero, 'female': 1 - genero}
    PI = pesos_idade(v_idade)
    PM = pesos_3(ficha.get('musculo', 0.5) - 0.20 * magreza, ['minmuscle', 'averagemuscle', 'maxmuscle'])
    PP = pesos_3(ficha.get('peso', 0.5) - 0.30 * magreza, ['minweight', 'averageweight', 'maxweight'])
    alt = ficha.get('altura', 0.5); PA = {'maxheight': (alt - 0.5) * 2} if alt > 0.5 else {'minheight': (0.5 - alt) * 2}
    MD, T = os.path.join(dados, 'targets/macrodetails'), os.path.join(dados, 'targets')
    for ge, pg in PG.items():
        if pg < 1e-6: continue
        for ida, pi in PI.items():
            aplicar(V, f'{MD}/caucasian-{ge}-{ida}.target.gz', pg * pi)
            for mu, pm in PM.items():
                for pe, pp in PP.items():
                    aplicar(V, f'{MD}/universal-{ge}-{ida}-{mu}-{pe}.target.gz', pg * pi * pm * pp)
                    for h, ph in PA.items(): aplicar(V, f'{MD}/height/{ge}-{ida}-{mu}-{pe}-{h}.target.gz', pg * pi * pm * pp * ph)
    if magreza:
        for l in 'lr':
            for parte in ['upperarm', 'lowerarm', 'upperleg', 'lowerleg']:
                for eixo in ['depth', 'horiz']: aplicar(V, f'{T}/{"arms" if "arm" in parte else "legs"}/{l}-{parte}-scale-{eixo}-decr.target.gz', 0.55 * magreza)
            aplicar(V, f'{T}/cheek/{l}-cheek-volume-decr.target.gz', 0.5 * magreza)
            aplicar(V, f'{T}/cheek/{l}-cheek-bones-incr.target.gz', 0.25 * magreza)
            aplicar(V, f'{T}/eyes/{l}-eye-bag-incr.target.gz', 0.6 * magreza)
            aplicar(V, f'{T}/eyes/{l}-eye-bag-height-incr.target.gz', 0.4 * magreza)
        aplicar(V, f'{T}/neck/neck-scale-horiz-decr.target.gz', 0.3 * magreza)
        aplicar(V, f'{T}/neck/neck-scale-depth-decr.target.gz', 0.3 * magreza)
    for alvo, w in ficha.get('ajustes', {}).items(): aplicar(V, f'{T}/{alvo}.target.gz', w)
    grupos = {}
    for (vs, _), g in zip(F, G): grupos.setdefault(g, set()).update(vs)
    return V, VT, F, G, grupos

def corpo_lucas(dados, idade=12, magreza=1.0):
    return corpo(dados, {'genero': 1, 'idade': idade, 'magreza': magreza})

def centro(V, grupos, g): return V[sorted(grupos[g])].mean(axis=0)

# ------------------------------------------------------------------------------------------------ proxies (.mhclo) e recorte da roupa
def ler_mhclo(caminho):
    info = {'refs': [], 'delete': set(), 'escala': {}}; modo = None
    with open(caminho) as f:
        for l in f:
            s = l.strip()
            if not s or s.startswith('#'): continue
            p = s.split()
            if p[0] in ('x_scale', 'y_scale', 'z_scale'): info['escala'][p[0][0]] = (int(p[1]), int(p[2]), float(p[3])); continue
            if p[0] == 'obj_file': info['obj'] = p[1]; continue
            if p[0] == 'verts': modo = 'v'; continue
            if p[0] == 'delete_verts': modo = 'd'; continue
            if not p[0].lstrip('-').replace('.', '', 1).isdigit(): modo = None if modo == 'd' else modo; continue
            if modo == 'v':
                n = [float(x) for x in p]
                info['refs'].append(([int(n[0])] * 3, [1, 0, 0], [0, 0, 0]) if len(n) == 1 else ([int(n[0]), int(n[1]), int(n[2])], n[3:6], n[6:9]))
            elif modo == 'd':
                i = 0
                while i < len(p):
                    if i + 2 < len(p) and p[i + 1] == '-': info['delete'].update(range(int(p[i]), int(p[i + 2]) + 1)); i += 3
                    else: info['delete'].add(int(p[i])); i += 1
    return info

def encaixar(info, Vb):
    esc = np.array([abs(Vb[info['escala'][ax][0], k] - Vb[info['escala'][ax][1], k]) / info['escala'][ax][2] if ax in info['escala'] else 1.0 for k, ax in enumerate('xyz')])
    idx = np.array([r[0] for r in info['refs']]); w = np.array([r[1] for r in info['refs']]); o = np.array([r[2] for r in info['refs']])
    return (Vb[idx] * w[..., None]).sum(axis=1) + o * esc, idx, w

def recortar_roupa(V, grupos, Pv, faces, delete, roupa, uvs=None, manga=None, perna=None):
    """manga 'curta'|'longa', perna 'bermuda'|'longa'. O corte é um PLANO perpendicular ao braço (meio do braço) e à coxa (um palmo acima do joelho):
    faces totalmente além do plano saem e os vértices que passam dele são trazidos de volta para o plano (barra reta, como uma bainha).
    devolve (faces mantidas, classe de cada uma 'camisa'|'calca', vértices do corpo a esconder, posições novas dos vértices da roupa)"""
    if manga is None: manga = 'curta'
    if perna is None: perna = 'bermuda' if roupa == 'casa' else 'longa'
    quadril = (centro(V, grupos, 'joint-l-upper-leg')[1] + centro(V, grupos, 'joint-pelvis')[1]) / 2
    pai = list(range(len(Pv)))
    def raiz_(a):
        while pai[a] != a: pai[a] = pai[pai[a]]; a = pai[a]
        return a
    for vs in faces:
        for v in vs[1:]: pai[raiz_(v)] = raiz_(vs[0])
    comp = {}
    for vs in faces: comp.setdefault(raiz_(vs[0]), []).append(vs)
    peca_camisa = {r for r, fs in comp.items() if np.mean([Pv[vs].mean(axis=0)[1] for vs in fs]) > quadril + 0.35}
    planos = []                                                                  # (ponto, normal apontando para fora, lado: +1 esquerda / -1 direita, classe)
    if manga == 'curta':
        for l, sx in (('l', 1), ('r', -1)):
            S_, E_ = centro(V, grupos, f'joint-{l}-shoulder'), centro(V, grupos, f'joint-{l}-elbow')
            n = (E_ - S_) / np.linalg.norm(E_ - S_); planos.append((S_ + 0.45 * (E_ - S_), n, sx, 'camisa', None))
    if perna == 'bermuda':
        for l, sx in (('l', 1), ('r', -1)):
            H_, K_ = centro(V, grupos, f'joint-{l}-upper-leg'), centro(V, grupos, f'joint-{l}-knee')
            n = (K_ - H_) / np.linalg.norm(K_ - H_); planos.append((K_ + 0.22 * (H_ - K_), n, sx, 'calca', 0.55 * np.linalg.norm(K_ - H_)))
    classe_v = np.array(['camisa' if raiz_(i) in peca_camisa else 'calca' for i in range(len(Pv))])
    Pn = Pv.copy(); fora = np.zeros(len(Pv), bool)
    for c, n, sx, cl, rmax in planos:
        lado = np.sign(Pv[:, 0]) == sx
        d = (Pv - c) @ n; radial = np.linalg.norm((Pv - c) - d[:, None] * n[None, :], axis=1)
        tubo = (np.abs(Pv[:, 0]) > abs(c[0]) - 0.25) if rmax is None else (radial < rmax)   # braço: tudo o que está para fora do ombro; perna: o tubo da coxa (não pega o tronco)
        sel = lado & (classe_v == cl) & (d > 0) & tubo
        fora |= sel; Pn[sel] = Pv[sel] - d[sel, None] * n[None, :] + n[None, :] * 0.0
    mant, cls = [], []
    for k, vs in enumerate(faces):
        if all(fora[v] for v in vs): continue
        mant.append(k); cls.append('camisa' if raiz_(vs[0]) in peca_camisa else 'calca')
    def esconder_v(i):
        p = V[i]
        for c, n, sx, cl, rmax in planos:
            d = (p - c) @ n
            tubo = abs(p[0]) > abs(c[0]) - 0.35 if rmax is None else np.linalg.norm((p - c) - d * n) < rmax
            if np.sign(p[0]) == sx and d > -0.12 and tubo: return False            # pele além da barra (e um pouco antes) fica visível
        return True
    esconder = {i for i in delete if esconder_v(i)}
    return mant, cls, esconder, Pn

# ------------------------------------------------------------------------------------------------ cabelo procedural (mechas em fitas com alfa), bagunçado com franja
def medidas_cabeca(V, grupos, F, G):
    """olhos, escala (distância entre olhos / 0,55), centro do crânio e o centro de cada orelha (vértices mais laterais da cabeça na altura dos olhos)"""
    oE, oD = centro(V, grupos, 'helper-l-eye'), centro(V, grupos, 'helper-r-eye'); olhos = (oE + oD) / 2; k = np.linalg.norm(oE - oD) / 0.55
    Ch = olhos + np.array([0, 0.40, -0.62]) * k
    idx = np.array(sorted(set(i for (vs, _), g in zip(F, G) if g == 'body' for i in vs))); P = V[idx]
    perto = P[(np.abs(P[:, 1] - (olhos[1] - 0.05 * k)) < 0.45 * k) & (P[:, 2] < olhos[2] - 0.2 * k) & (P[:, 2] > olhos[2] - 1.5 * k)]
    orelhas = []
    for s in (1, -1):
        lado = perto[perto[:, 0] * s > 0]; xm = (lado[:, 0] * s).max(); orelhas.append(lado[lado[:, 0] * s > xm - 0.14 * k].mean(axis=0))
    return olhos, k, Ch, orelhas

def medidas_quepe(V, grupos, F, G):
    """faixa do quepe: altura da borda de baixo (yb) e elipse que abraça a cabeça (cx, cz, rx, rz). Usado pelo quepe e pelo cabelo (que fica por baixo)."""
    olhos, k, _, _ = medidas_cabeca(V, grupos, F, G); yb = olhos[1] + 0.24 * k            # faixa logo acima das sobrancelhas
    cab = np.array([v for v in V[sorted(set(i for (vs, _), g in zip(F, G) if g == 'body' for i in vs))] if yb < v[1] < yb + 0.3 * k])
    cz = (cab[:, 2].max() + cab[:, 2].min()) / 2
    return dict(yb=yb, k=k, cx=0.0, cz=cz, rx=(cab[:, 0].max() - cab[:, 0].min()) / 2 + 0.045, rz=(cab[:, 2].max() - cab[:, 2].min()) / 2 + 0.045, inclina=0.22 * k)

def queda_quepe(Q, a):
    """quanto a borda do quepe desce no ângulo a (0 = frente, pi = nuca): quepe usado inclinado, alto na testa e baixo atrás"""
    return -Q['inclina'] * ((1 - np.cos(a)) / 2) ** 1.3

def borda_quepe(Q, x, z):
    """altura da borda de baixo do quepe na direção do ponto (x, z) da cabeça"""
    return Q['yb'] + queda_quepe(Q, np.arctan2(x - Q['cx'], z - Q['cz']))

def cabelo_procedural(V, grupos, F=None, G=None, n=3600, semente=7, comp=1.0, franja=True, quepe=None, curto=False):
    """mechas em fitas presas à pele do couro cabeludo, penteadas rente ao crânio. Penteado CONTÍNUO (sem risca): os fios saem de um redemoinho no
    alto de trás da cabeça, vão para a frente no topo e caem para baixo atrás e dos lados; a franja cai na testa (franja=True) ou o topo é penteado
    para trás (adulto). As orelhas ficam livres. quepe (medidas_quepe): o cabelo só nasce e só existe abaixo da faixa. Espaço OBJ (dm)."""
    rng = np.random.default_rng(semente)
    olhos, k, Ch, orelhas = medidas_cabeca(V, grupos, F, G); dist_o = 0.55 * k
    def longe_orelha(P, r=0.26): return np.all([np.linalg.norm(P - o, axis=-1) > r * k for o in orelhas], axis=0)   # só a orelha fica livre
    def escalpo(P):
        Nn = P - Ch; dist = np.linalg.norm(Nn, axis=-1); Nn = Nn / dist[..., None]
        linha_testa = olhos[1] + 0.58 * k
        topo = (Nn[..., 1] > -0.15) & ~((Nn[..., 2] > 0.30) & (P[..., 1] < linha_testa)) & ~((np.abs(Nn[..., 0]) > 0.75) & (P[..., 1] < olhos[1] - 0.12 * k))   # costeleta desce na frente da orelha
        nuca = (Nn[..., 2] < -0.25) & (np.abs(Nn[..., 0]) < 0.80) & (P[..., 1] > olhos[1] - 0.62 * k)      # até a linha da nuca
        ok = (dist < 1.6 * k) & (topo | nuca) & longe_orelha(P)
        if quepe: ok &= P[..., 1] < borda_quepe(quepe, P[..., 0], P[..., 2]) + 0.05 * k
        return ok
    faces_esc, tris = [], []
    for kf, ((vs, _), g) in enumerate(zip(F, G)):
        if g == 'body' and escalpo(V[vs]).all():
            faces_esc.append(kf)
            for a in range(1, len(vs) - 1): tris.append((vs[0], vs[a], vs[a + 1]))
    tris = np.array(tris); A_, B_, C_ = V[tris[:, 0]], V[tris[:, 1]], V[tris[:, 2]]
    area = np.linalg.norm(np.cross(B_ - A_, C_ - A_), axis=1); prob = area / area.sum()
    def amostra():
        t = rng.choice(len(tris), p=prob); u, v = rng.random(), rng.random()
        if u + v > 1: u, v = 1 - u, 1 - v
        return A_[t] + u * (B_[t] - A_[t]) + v * (C_[t] - A_[t])
    raiz = np.array([amostra() for _ in range(400)])
    # pele da cabeça com normais: o fio acompanha a superfície real (casca esférica afastava o fio na nuca e fazia degraus)
    NV = np.zeros_like(V)
    for (vs, _), g in zip(F, G):
        if g != 'body' or len(vs) < 3: continue
        nf = np.cross(V[vs[1]] - V[vs[0]], V[vs[2]] - V[vs[0]])
        for i in vs: NV[i] += nf
    hi = np.array(sorted(set(i for (vs, _), g in zip(F, G) if g == 'body' for i in vs if V[i][1] > olhos[1] - 1.2 * k)))
    HP, HN = V[hi], NV[hi] / (np.linalg.norm(NV[hi], axis=1, keepdims=True) + 1e-12)
    HN *= np.sign(((HP - Ch) * HN).sum(1, keepdims=True) + 1e-9)                     # normais para fora
    W = Ch + np.array([0.0, 0.80, -0.60]) / np.linalg.norm([0.0, 0.80, -0.60]) * 1.05 * k     # redemoinho (alto de trás)
    baixo, tras = np.array([0.0, -1.0, 0.0]), np.array([0.0, 0.0, -1.0])
    def tangente(v, nq): v = v - nq * v.dot(nq); return v / (np.linalg.norm(v) + 1e-9)
    def fluxo(p):
        """direção do penteado no ponto p (contínua na cabeça toda)"""
        nq = (p - Ch) / np.linalg.norm(p - Ch); cima, frente = nq[1], nq[2]
        sai = tangente(p - W, nq)                                                     # para longe do redemoinho
        if np.linalg.norm(p - W) < 0.35 * k: sai = tangente(np.cross(nq, sai) * 0.7 + sai, nq)   # gira em espiral perto do redemoinho
        if not franja and not quepe: sai = tangente(0.35 * sai + tras * 0.65, nq) if cima > 0.3 else sai   # adulto: topo penteado para trás
        g = tangente(baixo, nq); peso_g = np.clip(0.75 - cima, 0, 1) ** 1.2              # dos lados e atrás a gravidade manda
        d = tangente(sai * (1 - peso_g) + g * peso_g + rng.normal(0, 0.12, 3), nq)
        if franja and frente > 0.15 and cima > 0.15:                                   # franja: cai na testa, varrida para um lado
            d = tangente(d * 0.35 + np.array([0.55, -0.85, 0.35]), nq)
        return d, cima, frente
    Vs, F_, UV = [], [], []; S = 9
    for _ in range(int(n * (2.2 if curto else 1.25))):                                # mais fios, mais finos (fitas largas viravam placas)
        p = amostra(); nrm = (p - Ch) / np.linalg.norm(p - Ch)
        d0, cima, frente = fluxo(p)
        L = rng.uniform(0.75, 1.15) if cima > 0.3 else rng.uniform(0.55, 0.85)
        if franja and frente > 0.15 and cima > 0.15: L = rng.uniform(0.75, 1.30)
        if cima < -0.15: L *= 0.45                                                      # nuca: fios curtos, rente
        if not franja: L *= 0.85
        L *= comp
        if curto: L = rng.uniform(0.10, 0.22) * k                                        # cabelo curto: penugem rente sobre a pele pintada
        pos = p + nrm * 0.012; pts = [pos.copy()]; camada = (0.006 + 0.012 * rng.random()) if curto else (0.020 + 0.05 * rng.random() ** 1.5); corte_franja = rng.uniform(0.18, 0.75) * k
        for s_ in range(S):
            d, _, _ = fluxo(pos) if s_ else (d0, 0, 0)
            pos = pos + d * L / S
            j = np.argmin(((HP - pos) ** 2).sum(1)); dn = (pos - HP[j]).dot(HN[j]); alvo = camada * (1 + 0.5 * s_ / S)
            pos = pos + HN[j] * (np.clip(dn, alvo, alvo + 0.035) - dn)                      # fica rente à pele, a uma altura de camada
            if franja and frente > 0.15 and pos[1] < olhos[1] + corte_franja: break               # a franja para em alturas desencontradas
            if not longe_orelha(pos, 0.20): break                                                    # não cobre a orelha
            if quepe and pos[1] > borda_quepe(quepe, pos[0], pos[2]) - 0.01: break                     # nada aparece por cima da faixa do quepe
            pts.append(pos.copy())
        if len(pts) < 3: continue
        pts = np.array(pts); m = len(pts) - 1; w0 = rng.uniform(0.08, 0.14) * (0.5 if cima < -0.15 else 1.0) * (0.45 if curto else 1.0); col = rng.integers(4); base = len(Vs)
        for s_ in range(m + 1):
            t = s_ / m; tang = pts[min(s_ + 1, m)] - pts[max(s_ - 1, 0)]; tang /= np.linalg.norm(tang) + 1e-9
            out = pts[s_] - Ch; out /= np.linalg.norm(out); lat = np.cross(tang, out); lat /= (np.linalg.norm(lat) + 1e-9)
            w = w0 * (1 - 0.8 * t ** 1.3); Vs += [pts[s_] - lat * w / 2, pts[s_] + lat * w / 2]
        for s_ in range(m):
            a = base + 2 * s_; F_.append([a, a + 1, a + 3, a + 2]); u0, u1 = col / 4 + 0.01, (col + 1) / 4 - 0.01
            UV.append([(u0, 1 - s_ / m), (u1, 1 - s_ / m), (u1, 1 - (s_ + 1) / m), (u0, 1 - (s_ + 1) / m)])
    return np.array(Vs), F_, UV, (raiz, Ch, faces_esc)
