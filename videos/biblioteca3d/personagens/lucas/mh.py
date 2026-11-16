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

def corpo_lucas(dados, idade=12, magreza=1.0):
    """devolve V (espaço OBJ do MakeHuman: decímetros, y para cima), VT, F, G, grupos"""
    V, VT, F, G = ler_obj(os.path.join(dados, '3dobjs/base.obj'))
    v_idade = 0.1875 + (idade - 11) / 14 * 0.3125 if idade >= 11 else idade / 11 * 0.1875
    PI, PM, PP = pesos_idade(v_idade), pesos_3(0.5 - 0.20 * magreza, ['minmuscle', 'averagemuscle', 'maxmuscle']), pesos_3(0.5 - 0.30 * magreza, ['minweight', 'averageweight', 'maxweight'])
    MD, T = os.path.join(dados, 'targets/macrodetails'), os.path.join(dados, 'targets')
    for ida, pi in PI.items():
        aplicar(V, f'{MD}/caucasian-male-{ida}.target.gz', pi)
        for mu, pm in PM.items():
            for pe, pp in PP.items(): aplicar(V, f'{MD}/universal-male-{ida}-{mu}-{pe}.target.gz', pi * pm * pp)
    for l in 'lr':                                    # atrofia: braços e pernas finos, rosto magro com olheiras
        for parte in ['upperarm', 'lowerarm', 'upperleg', 'lowerleg']:
            for eixo in ['depth', 'horiz']: aplicar(V, f'{T}/{"arms" if "arm" in parte else "legs"}/{l}-{parte}-scale-{eixo}-decr.target.gz', 0.55 * magreza)
        aplicar(V, f'{T}/cheek/{l}-cheek-volume-decr.target.gz', 0.5 * magreza)
        aplicar(V, f'{T}/cheek/{l}-cheek-bones-incr.target.gz', 0.25 * magreza)
        aplicar(V, f'{T}/eyes/{l}-eye-bag-incr.target.gz', 0.6 * magreza)
        aplicar(V, f'{T}/eyes/{l}-eye-bag-height-incr.target.gz', 0.4 * magreza)
    aplicar(V, f'{T}/neck/neck-scale-horiz-decr.target.gz', 0.3 * magreza)
    aplicar(V, f'{T}/neck/neck-scale-depth-decr.target.gz', 0.3 * magreza)
    grupos = {}
    for (vs, _), g in zip(F, G): grupos.setdefault(g, set()).update(vs)
    return V, VT, F, G, grupos

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

def recortar_roupa(V, grupos, Pv, faces, delete, roupa, uvs=None):
    """roupa 'casa': camiseta de manga curta e bermuda acima do joelho; 'carro': camiseta de manga curta e calça comprida.
    devolve (faces mantidas: lista de índices das faces, classe de cada uma: 'camisa'|'calca', vértices do corpo a esconder)"""
    quadril = (centro(V, grupos, 'joint-l-upper-leg')[1] + centro(V, grupos, 'joint-pelvis')[1]) / 2
    ombro, cotovelo = abs(centro(V, grupos, 'joint-l-shoulder')[0]), abs(centro(V, grupos, 'joint-l-elbow')[0])
    corte_manga = ombro + 0.42 * (cotovelo - ombro)
    joelho = (centro(V, grupos, 'joint-l-knee')[1] + centro(V, grupos, 'joint-r-knee')[1]) / 2
    corte_perna = joelho + 0.55 if roupa == 'casa' else -1e9
    pai = list(range(len(Pv)))                                                  # componentes conexos (peças: camiseta, calça)
    def raiz_(a):
        while pai[a] != a: pai[a] = pai[pai[a]]; a = pai[a]
        return a
    for vs in faces:
        for v in vs[1:]: pai[raiz_(v)] = raiz_(vs[0])
    comp = {}
    for vs in faces: comp.setdefault(raiz_(vs[0]), []).append(vs)
    peca_camisa = {r for r, fs in comp.items() if np.mean([Pv[vs].mean(axis=0)[1] for vs in fs]) > quadril + 0.35}
    mant, cls = [], []
    for k, vs in enumerate(faces):
        c = Pv[vs].mean(axis=0)
        camisa = raiz_(vs[0]) in peca_camisa
        if camisa and abs(c[0]) > corte_manga: continue
        if not camisa and c[1] < corte_perna: continue
        mant.append(k); cls.append('camisa' if camisa else 'calca')
    esconder = {i for i in delete if not ((V[i][1] > quadril + 0.35 and abs(V[i][0]) > corte_manga - 0.15) or (V[i][1] <= quadril + 0.35 and V[i][1] < corte_perna + 0.25))}
    return mant, cls, esconder

# ------------------------------------------------------------------------------------------------ cabelo procedural (mechas em fitas com alfa), bagunçado com franja
def cabelo_procedural(V, grupos, F=None, G=None, n=3600, semente=7):
    """mechas em fitas presas à pele do couro cabeludo (vértices do corpo acima da linha do cabelo), penteadas rente ao crânio:
    franja caindo na testa, coroa para a frente e para os lados, laterais e nuca para baixo. Espaço OBJ (dm)."""
    rng = np.random.default_rng(semente)
    oE, oD = centro(V, grupos, 'helper-l-eye'), centro(V, grupos, 'helper-r-eye'); olhos = (oE + oD) / 2; dist_o = np.linalg.norm(oE - oD)
    Ch = olhos + np.array([0, 0.40, -0.62]) * dist_o / 0.55                       # centro aproximado do crânio
    def escalpo(P):
        Nn = P - Ch; dist = np.linalg.norm(Nn, axis=-1); Nn = Nn / dist[..., None]
        linha_testa = olhos[1] + 0.58 * dist_o / 0.55
        return (dist < 1.6 * dist_o / 0.55) & (Nn[..., 1] > -0.15) & ~((Nn[..., 2] > 0.30) & (P[..., 1] < linha_testa)) & ~((np.abs(Nn[..., 0]) > 0.75) & (P[..., 1] < olhos[1] + 0.25))
    faces_esc, tris = [], []
    for k, ((vs, _), g) in enumerate(zip(F, G)):
        if g == 'body' and escalpo(V[vs]).all():
            faces_esc.append(k)
            for a in range(1, len(vs) - 1): tris.append((vs[0], vs[a], vs[a + 1]))
    tris = np.array(tris); A_, B_, C_ = V[tris[:, 0]], V[tris[:, 1]], V[tris[:, 2]]
    area = np.linalg.norm(np.cross(B_ - A_, C_ - A_), axis=1); prob = area / area.sum()
    def amostra():
        t = rng.choice(len(tris), p=prob); u, v = rng.random(), rng.random()
        if u + v > 1: u, v = 1 - u, 1 - v
        return A_[t] + u * (B_[t] - A_[t]) + v * (C_[t] - A_[t])
    raiz = np.array([amostra() for _ in range(400)])
    Vs, F_, UV = [], [], []; S = 8
    for k in range(n):
        p = amostra(); nrm = (p - Ch) / np.linalg.norm(p - Ch)
        cima, frente = nrm[1], nrm[2]
        if frente > 0.15 and cima > 0.2:   flow = np.array([0.75 + rng.normal(0, 0.35), -0.8, 0.7]); L = rng.uniform(0.7, 1.35)      # franja, varrida para um lado
        elif cima > 0.6:                    flow = np.array([rng.normal(0, 0.6), -0.2, 1.0 + rng.normal(0, 0.3)]); L = rng.uniform(0.8, 1.15) # coroa
        else:                               flow = np.array([0.15 * np.sign(nrm[0]), -1.0, -0.2]); L = rng.uniform(0.55, 0.85) * (1.2 if frente < -0.3 else 1)
        pos = p + nrm * 0.015; pts = [pos.copy()]; camada = 0.025 + 0.06 * rng.random() ** 1.5; corte_franja = rng.uniform(0.18, 0.75) * dist_o / 0.55
        for s_ in range(S):
            q = pos - Ch; nq = q / np.linalg.norm(q)
            d = flow - nq * flow.dot(nq) + nq * 0.10 + rng.normal(0, 0.18, 3); d /= np.linalg.norm(d)
            pos = pos + d * L / S
            q = pos - Ch; dq = np.linalg.norm(q); alvo = np.linalg.norm(p - Ch) + camada * (1 + 0.6 * s_ / S)
            pos = Ch + q / dq * max(dq, alvo) if dq < alvo else Ch + q / dq * min(dq, alvo + 0.05)
            if frente > 0.15 and pos[1] < olhos[1] + corte_franja: break                                  # a franja para em alturas desencontradas
            pts.append(pos.copy())
        if len(pts) < 3: continue
        pts = np.array(pts); m = len(pts) - 1; w0 = rng.uniform(0.10, 0.18); col = rng.integers(4); base = len(Vs)
        for s_ in range(m + 1):
            t = s_ / m; tang = pts[min(s_ + 1, m)] - pts[max(s_ - 1, 0)]; tang /= np.linalg.norm(tang) + 1e-9
            out = pts[s_] - Ch; out /= np.linalg.norm(out); lat = np.cross(tang, out); lat /= (np.linalg.norm(lat) + 1e-9)
            w = w0 * (1 - 0.6 * t ** 1.5); Vs += [pts[s_] - lat * w / 2, pts[s_] + lat * w / 2]
        for s_ in range(m):
            a = base + 2 * s_; F_.append([a, a + 1, a + 3, a + 2]); u0, u1 = col / 4 + 0.01, (col + 1) / 4 - 0.01
            UV.append([(u0, 1 - s_ / m), (u1, 1 - s_ / m), (u1, 1 - (s_ + 1) / m), (u0, 1 - (s_ + 1) / m)])
    return np.array(Vs), F_, UV, (raiz, Ch, faces_esc)
