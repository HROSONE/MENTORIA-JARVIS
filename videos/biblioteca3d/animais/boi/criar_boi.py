# BOI NELORE (touro adulto) para a biblioteca do canal, modelado por script no Blender a partir de medidas típicas da raça:
# altura na cernelha ~1,50 m (cupim até ~1,62 m), corpo ~2,1 m da ponta do ombro à ponta da nádega, peito a ~0,70 m do chão,
# cabeça comprida e estreita de perfil reto, orelhas médias, chifres curtos e grossos, barbela grande e cupim alto sobre a cernelha.
# Pelagem branca/cinza-clara com pescoço, cupim e paleta mais escuros (touro), pele preta nas pontas (focinho, contorno dos olhos,
# cascos, vassoura da cauda).
#
# A forma é feita por seções (loft) ao longo de linhas-guia, como no criar_trex.py, e vira uma pele só (remesh por voxel), com relevo
# (músculos, costelas, dobras da barbela) e cor por vértice. Depois ganha esqueleto com pesos automáticos. Mandíbula, olhos e chifres são
# peças presas aos ossos. As animações (pastar, mastigar, cauda, cair) são feitas no Three.js mexendo os ossos.
# Unidades: metros. Frente para +X, Z para cima (no glTF: frente +X, Y para cima). Origem no chão, no meio do corpo.
#
# uso: blender -b --python criar_boi.py -- --saida boi.glb [--previa previa.png] [--amostras 32] [--tris 90000]
import bpy, bmesh, math, sys, os
import numpy as np
from mathutils import Vector

A = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(n, d=None): return A[A.index('--' + n) + 1] if '--' + n in A else d
SAIDA, PREVIA = arg('saida'), arg('previa')
AMOSTRAS = int(arg('amostras', 24)); TRIS = float(arg('tris', 90000)); VOXEL = float(arg('voxel', 0.011))

bpy.ops.wm.read_factory_settings(use_empty=True)
cena = bpy.context.scene

# ------------------------------------------------------------------------------------------------ ferramentas (as mesmas do T. rex)
def catmull(P, n_por_seg=6):
    P = [np.array(p, float) for p in P]; out = []
    for i in range(len(P) - 1):
        p0, p1, p2, p3 = P[max(i - 1, 0)], P[i], P[i + 1], P[min(i + 2, len(P) - 1)]
        for k in range(n_por_seg):
            t = k / n_por_seg
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-1]); return np.array(out)

def loft(nome, estacoes, N=40, expo=2.2, ref=(0, 0, 1), fechar=True, n_por_seg=6, eixo=None):
    """estacoes: [cx, cy, cz, meia_largura, alto, baixo, (afina_cima), (afina_baixo)]"""
    E = catmull(estacoes, n_por_seg); C = E[:, :3]
    bm = bmesh.new(); aneis = []
    for i, e in enumerate(E):
        t = C[min(i + 1, len(C) - 1)] - C[max(i - 1, 0)]; t /= np.linalg.norm(t) + 1e-9
        if eixo is not None: t = np.array(eixo, float)
        lado = np.cross(t, ref); lado /= np.linalg.norm(lado) + 1e-9; cima = np.cross(lado, t)
        w, hT, hB = e[3], e[4], e[5]; afT = e[6] if len(e) > 6 else 0.0; afB = e[7] if len(e) > 7 else 0.0; anel = []
        for j in range(N):
            th = 2 * math.pi * j / N; c, s = math.cos(th), math.sin(th)
            y = w * math.copysign(abs(c) ** (2 / expo), c); z = (hT if s > 0 else hB) * math.copysign(abs(s) ** (2 / expo), s)
            y *= 1 - (afT * s if s > 0 else -afB * s)
            anel.append(bm.verts.new(C[i] + lado * y + cima * z))
        aneis.append(anel)
    for a, b in zip(aneis, aneis[1:]):
        for j in range(N): bm.faces.new((a[j], a[(j + 1) % N], b[(j + 1) % N], b[j]))
    if fechar:
        for anel, c, inv in ((aneis[0], C[0], True), (aneis[-1], C[-1], False)):
            v0 = bm.verts.new(c)
            for j in range(N): bm.faces.new((v0, anel[(j + 1) % N], anel[j]) if inv else (v0, anel[j], anel[(j + 1) % N]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(nome, me); cena.collection.objects.link(ob); return ob

def membro(nome, juntas, raios, N=24, ref=(1, 0, 0), n_por_seg=8):
    return loft(nome, [[*j, r[0], r[1], r[2]] for j, r in zip(juntas, raios)], N=N, expo=2.0, ref=ref, n_por_seg=n_por_seg)

def esfera(nome, c, r, esc=(1, 1, 1), rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=r, location=c, rotation=rot); o = bpy.context.object; o.name = nome; o.scale = esc
    bpy.ops.object.transform_apply(scale=True, rotation=True); return o

def unir(objs, nome, voxel=0.011, suave=6):
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join(); o = bpy.context.object; o.name = nome
    m = o.modifiers.new('rm', 'REMESH'); m.mode = 'VOXEL'; m.voxel_size = voxel; m.use_smooth_shade = True
    bpy.ops.object.modifier_apply(modifier=m.name)
    s = o.modifiers.new('sv', 'CORRECTIVE_SMOOTH'); s.iterations = suave; s.use_only_smooth = True; bpy.ops.object.modifier_apply(modifier=s.name)
    s = o.modifiers.new('lap', 'LAPLACIANSMOOTH'); s.iterations = 2; s.lambda_factor = 0.6; bpy.ops.object.modifier_apply(modifier=s.name)
    bpy.ops.object.shade_smooth(); return o

def _hash(ix, iy, iz, sem):
    h = (ix * 73856093) ^ (iy * 19349663) ^ (iz * 83492791) ^ (sem * 2654435761)
    h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) & 0xFFFF) / 65535.0
def ruido3(P, freq, sem=0):
    Q = P * freq; i = np.floor(Q).astype(np.int64); f = Q - i; u = f * f * (3 - 2 * f); r = 0.0
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (u[:, 0] if dx else 1 - u[:, 0]) * (u[:, 1] if dy else 1 - u[:, 1]) * (u[:, 2] if dz else 1 - u[:, 2])
                r = r + w * _hash(i[:, 0] + dx, i[:, 1] + dy, i[:, 2] + dz, sem)
    return r * 2 - 1
def fbm3(P, freq, oit=4, sem=0):
    a, t, s_ = 0, 0, 1
    for k in range(oit): a = a + ruido3(P, freq * 2 ** k, sem + k) / s_; t += 1 / s_; s_ *= 2
    return a / t
def suave(a, b, x): x = np.clip((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x)

# cabeça: as medidas abaixo foram escritas para uma cabeça de ~0,65 m; o Nelore tem ~0,53 m da nuca ao focinho.
# hc() aproxima da nuca (1,13; 1,30) todos os pontos da cabeça, da mandíbula, olhos, narinas, cores e ossos.
CK = 0.82
def hc(x, z): return 1.13 + (x - 1.13) * CK, 1.30 + (z - 1.30) * CK
def hcp(p): x, z = hc(p[0], p[2]); return (x, p[1], z)
# ------------------------------------------------------------------------------------------------ corpo: da nádega ao pescoço
# [x, y, z, meia largura, acima, abaixo, afina_cima, afina_baixo]: linha do dorso ~1,42 m, barriga ~0,64 m, peito ~0,70 m
CORPO = [
    [-1.13, 0, 1.17, 0.10, 0.14, 0.22, 0.30, 0.2],
    [-1.06, 0, 1.15, 0.24, 0.25, 0.36, 0.25, 0.2],
    [-0.92, 0, 1.12, 0.29, 0.31, 0.42, 0.22, 0.15],     # ancas
    [-0.70, 0, 1.08, 0.30, 0.34, 0.43, 0.18, 0.10],
    [-0.45, 0, 1.05, 0.31, 0.36, 0.42, 0.15, 0.05],     # barriga
    [-0.15, 0, 1.03, 0.32, 0.38, 0.40, 0.15, 0.05],
    [0.15, 0, 1.04, 0.31, 0.38, 0.37, 0.15, 0.08],
    [0.40, 0, 1.06, 0.28, 0.38, 0.36, 0.18, 0.12],     # costelas / paleta
    [0.60, 0, 1.06, 0.24, 0.37, 0.37, 0.25, 0.18],     # peito (cilha)
    [0.76, 0, 1.08, 0.18, 0.28, 0.32, 0.30, 0.25],
    [0.86, 0, 1.12, 0.14, 0.20, 0.26, 0.30, 0.25],
]
corpo = loft('corpo', CORPO, N=56, expo=2.4, eixo=(1, 0, 0))
# pescoço (sobe para a nuca) e cabeça comprida apontando para a frente e para baixo
PESC = [[0.70, 0, 1.10, 0.20, 0.32, 0.36], [0.88, 0, 1.15, 0.18, 0.27, 0.31], [1.02, 0, 1.21, 0.15, 0.21, 0.24], [1.14, 0, 1.27, 0.125, 0.15, 0.16]]
pescoco = loft('pescoco', PESC, N=40, expo=2.2)
CAB = [  # da nuca ao focinho
    [1.13, 0, 1.30, 0.118, 0.095, 0.13, 0.15, 0.10],
    [1.21, 0, 1.25, 0.128, 0.095, 0.15, 0.20, 0.12],    # testa larga entre os chifres
    [1.30, 0, 1.18, 0.125, 0.090, 0.16, 0.28, 0.15],    # olhos
    [1.38, 0, 1.10, 0.100, 0.080, 0.14, 0.32, 0.18],
    [1.46, 0, 1.025, 0.090, 0.072, 0.118, 0.28, 0.15],
    [1.53, 0, 0.955, 0.098, 0.070, 0.105, 0.15, 0.08],  # focinho largo e chato (boi não tem focinho fino)
    [1.58, 0, 0.905, 0.100, 0.064, 0.090, 0.08, 0.05],
    [1.605, 0, 0.885, 0.092, 0.058, 0.080, 0.05, 0.03],
    [1.618, 0, 0.875, 0.060, 0.040, 0.050, 0.0, 0.0],
]
CAB = [[*hcp(e[:3]), *e[3:]] for e in CAB]
cabeca = loft('cabeca', CAB, N=48, expo=2.9)
# cupim (giba do zebu) sobre a cernelha, um pouco caído para trás
cupim = loft('cupim', [[0.34, 0, 1.38, 0.08, 0.04, 0.05], [0.46, 0, 1.43, 0.13, 0.13, 0.10], [0.58, 0, 1.45, 0.15, 0.16, 0.12], [0.70, 0, 1.40, 0.13, 0.11, 0.12], [0.80, 0, 1.33, 0.08, 0.04, 0.08]], N=32, expo=2.0, eixo=(1, 0, 0))   # cupim do zebu, que sobe do pescoço e cai para trás
# barbela: pele que pende do queixo ao peito
BARB = [[1.14, 0, 1.02, 0.025, 0.05, 0.05], [1.02, 0, 0.92, 0.035, 0.10, 0.12], [0.90, 0, 0.80, 0.045, 0.14, 0.19], [0.78, 0, 0.72, 0.05, 0.14, 0.17], [0.64, 0, 0.68, 0.05, 0.10, 0.08]]
barbela = loft('barbela', BARB, N=24, expo=2.0)
# umbigo / bainha (touro zebu tem a bainha pendente)
bainha = membro('bainha', [(0.05, 0, 0.70), (0.15, 0, 0.60), (0.24, 0, 0.56)], [(0.05, 0.06, 0.06), (0.045, 0.05, 0.05), (0.03, 0.03, 0.03)], N=18)
# pernas: dianteira (ombro, cotovelo, joelho = carpo, boleto, casco) e traseira (anca, soldra à frente, jarrete atrás)
def perna_dianteira(s):
    j = [(0.62, 0.15 * s, 1.08), (0.52, 0.19 * s, 0.80), (0.54, 0.18 * s, 0.68), (0.55, 0.175 * s, 0.42), (0.555, 0.17 * s, 0.30), (0.56, 0.17 * s, 0.13), (0.585, 0.17 * s, 0.06)]
    r = [(0.15, 0.20, 0.18), (0.12, 0.15, 0.13), (0.085, 0.095, 0.085), (0.062, 0.062, 0.056), (0.050, 0.050, 0.050), (0.054, 0.056, 0.054), (0.050, 0.052, 0.047)]
    return membro('dianteira', j, r)
def perna_traseira(s):
    j = [(-0.80, 0.17 * s, 1.15), (-0.66, 0.22 * s, 0.86), (-0.76, 0.20 * s, 0.66), (-0.92, 0.17 * s, 0.47), (-0.90, 0.165 * s, 0.30), (-0.88, 0.165 * s, 0.13), (-0.855, 0.165 * s, 0.06)]
    r = [(0.21, 0.25, 0.27), (0.18, 0.21, 0.24), (0.12, 0.14, 0.15), (0.062, 0.068, 0.072), (0.050, 0.050, 0.050), (0.054, 0.056, 0.054), (0.050, 0.052, 0.047)]
    return membro('traseira', j, r)
def cascos(base, s):
    """casco fendido: dois dedos em cunha + duas unhas de trás"""
    out = []
    for dy in (-0.022, 0.022):
        c = (base[0] + 0.03, base[1] + dy * s, 0.035)
        out.append(esfera('casco', c, 0.04, esc=(1.25, 0.55, 0.95)))
    out.append(esfera('unha', (base[0] - 0.045, base[1], 0.12), 0.015, esc=(1, 1.6, 1)))
    return out
pernas, CASCOS = [], []
for s in (1, -1):
    pernas += [perna_dianteira(s), perna_traseira(s)]
    CASCOS += cascos((0.58, 0.17 * s), s) + cascos((-0.86, 0.165 * s), s)
# cauda: inserção alta, pende até perto do jarrete
CAUDA_P = [(-1.10, 0, 1.36), (-1.17, 0, 1.25), (-1.19, 0, 1.05), (-1.19, 0, 0.82), (-1.18, 0, 0.60)]
cauda = membro('cauda', CAUDA_P, [(0.045, 0.05, 0.05), (0.035, 0.035, 0.035), (0.025, 0.025, 0.025), (0.018, 0.018, 0.018), (0.014, 0.014, 0.014)], N=14, ref=(1, 0, 0))
# orelhas (médias, para o lado e um pouco caídas), saindo atrás dos olhos
ORELHAS = []
for s in (1, -1):
    o = esfera('orelha', (1.17, 0.21 * s, 1.22), 0.11, esc=(0.48, 1.0, 0.15), rot=(math.radians(-38 * s), math.radians(12), math.radians(-20 * s)))
    ORELHAS.append(o)
# narinas e bochechas (relevos), sobrancelha óssea
REL = []
for s in (1, -1):
    REL.append(esfera('bochecha', hcp((1.30, 0.088 * s, 1.08)), 0.07, esc=(1.3, 0.6, 0.9)))
    REL.append(esfera('arcada', hcp((1.29, 0.100 * s, 1.205)), 0.036, esc=(1.5, 0.8, 0.6)))
    REL.append(esfera('paleta', (0.55, 0.20 * s, 1.08), 0.20, esc=(1.1, 0.45, 1.3)))      # paleta (escápula) saliente
    REL.append(esfera('anca', (-0.84, 0.22 * s, 1.27), 0.07, esc=(1.2, 0.7, 0.6)))        # ponta da anca
    REL.append(esfera('narina', hcp((1.60, 0.055 * s, 0.915)), 0.026, esc=(0.8, 1.0, 1.3)))
pele = unir([corpo, pescoco, cabeca, cupim, barbela, bainha, cauda] + pernas + CASCOS + ORELHAS + REL, 'boi', voxel=VOXEL)
print('BOI faces (alta):', len(pele.data.polygons))

# mandíbula separada (abre e mastiga)
MAND = [[1.27, 0, 1.03, 0.07, 0.035, 0.05], [1.38, 0, 0.97, 0.060, 0.03, 0.045], [1.48, 0, 0.90, 0.055, 0.025, 0.035], [1.56, 0, 0.855, 0.050, 0.02, 0.025]]
MAND = [[*hcp(e[:3]), *e[3:]] for e in MAND]
mand = unir([loft('mandibula', MAND, N=28, expo=2.3)], 'boi_mandibula', voxel=0.008, suave=3)
# olhos e chifres
OLHOS = [esfera('olho', hcp((1.300, 0.118 * s, 1.185)), 0.025) for s in (1, -1)]
def chifre(s):
    pts = [(1.17, 0.075 * s, 1.355), (1.15, 0.11 * s, 1.43), (1.12, 0.12 * s, 1.49)]
    return membro('chifre', pts, [(0.038, 0.04, 0.04), (0.026, 0.028, 0.028), (0.006, 0.006, 0.006)], N=16, ref=(1, 0, 0))
CHIFRES = [chifre(s) for s in (1, -1)]
VASSOURA = esfera('vassoura', (-1.18, 0, 0.52), 0.05, esc=(0.8, 0.8, 2.0))          # tufo preto da ponta da cauda

# ------------------------------------------------------------------------------------------------ relevo e cor por vértice
def relevo_e_cor(o):
    me = o.data; V = np.array([v.co[:] for v in me.vertices]); Nn = np.array([v.normal[:] for v in me.vertices]); x, y, z = V[:, 0], V[:, 1], V[:, 2]
    d = 0.010 * fbm3(V, 2.2, 3, 3)                                                       # massas musculares
    tronco = suave(-0.7, -0.5, x) * (1 - suave(0.40, 0.55, x)) * suave(0.80, 0.95, z) * (1 - suave(1.30, 1.40, z)) * np.abs(Nn[:, 1])
    d -= tronco * 0.0015 * np.clip(np.sin(x * 2 * math.pi / 0.11) * 2 - 1, 0, 1) * (0.5 + 0.5 * np.clip(fbm3(V, 4.0, 2, 5) + 0.5, 0, 1))   # costelas quase sumindo sob o couro
    barb = suave(0.6, 0.75, x) * (1 - suave(1.05, 1.15, x)) * (1 - suave(0.95, 1.05, z)) * (np.abs(y) < 0.08)
    d -= barb * 0.006 * np.clip(1 - np.abs(fbm3(V * np.array((1.0, 1.0, 5.0)), 3.0, 2, 9)) * 6, 0, 1)   # dobras da barbela
    pesc = suave(0.75, 0.9, x) * (1 - suave(1.10, 1.2, x))
    d -= pesc * 0.004 * np.clip(1 - np.abs(fbm3(V * np.array((5.0, 1.0, 1.0)), 2.5, 2, 11)) * 6, 0, 1) # vincos do pescoço
    V2 = V + Nn * d[:, None]
    for i, v in enumerate(me.vertices): v.co = V2[i]
    me.update()
    # cor: branco-gelo; pescoço, cupim e paleta cinza-escuro (touro); pele preta no focinho, olhos, cascos e joelhos
    n = fbm3(V, 3.0, 3, 21) * 0.5 + 0.5; n2 = fbm3(V, 14.0, 2, 22) * 0.5 + 0.5
    base = np.array([0.72, 0.71, 0.68])
    escuro = np.array([0.10, 0.10, 0.105])
    k_esc = np.clip(suave(0.25, 0.55, x) * (1 - suave(1.12, 1.24, x)) * suave(0.75, 1.10, z) * 0.75 + suave(0.30, 0.50, x) * (1 - suave(0.90, 1.05, x)) * suave(1.25, 1.42, z) * 0.55, 0, 0.9)   # pescoço, cupim e paleta escuros (touro)
    k_esc += 0.25 * suave(-1.0, -0.85, -x) * 0                                         # (reservado)
    k_esc = np.clip(k_esc * (0.85 + 0.3 * n), 0, 0.95)
    cor = base[None] * (1 - k_esc[:, None]) + escuro[None] * k_esc[:, None]
    cor *= (0.92 + 0.12 * n2)[:, None]
    barriga = (1 - suave(0.62, 0.85, z)) * suave(-0.75, -0.6, x) * (1 - suave(0.45, 0.6, x))
    cor = cor * (1 - 0.15 * barriga[:, None])
    preto = np.array([0.035, 0.032, 0.03])
    fx, fz = hc(1.585, 0.88); fx2, _ = hc(1.605, 0); fx3, _ = hc(1.55, 0)
    focinho = suave(fx, fx2, x) + suave(fx3, fx, x) * (1 - suave(fz - 0.02, fz + 0.02, z)) * 0.8   # espelho do focinho preto (só a ponta e o beiço)
    ox, oz = hc(1.30, 1.185); olhoD = np.minimum(np.linalg.norm(V - np.array([ox, 0.118, oz]), axis=1), np.linalg.norm(V - np.array([ox, -0.118, oz]), axis=1))
    olhos = 1 - suave(0.028, 0.045, olhoD)
    casco = 1 - suave(0.075, 0.10, z)
    joelho = (1 - suave(0.10, 0.16, z)) * suave(0.075, 0.10, z) * 0.6                      # quartela escurecida
    kp = np.clip(focinho + olhos + casco + joelho, 0, 1)
    cor = cor * (1 - kp[:, None]) + preto[None] * kp[:, None]
    # sujeira de pasto nas canelas
    terra = (1 - suave(0.15, 0.45, z)) * (1 - casco) * 0.35
    cor = cor * (1 - terra[:, None]) + np.array([0.33, 0.26, 0.18])[None] * terra[:, None]
    at = me.color_attributes.new('Col', 'BYTE_COLOR', 'POINT')
    for i in range(len(V)): at.data[i].color = (*cor[i], 1)
    return at
relevo_e_cor(pele)
def cor_fixa(o, cor):
    at = o.data.color_attributes.new('Col', 'BYTE_COLOR', 'POINT')
    for i in range(len(o.data.vertices)): at.data[i].color = (*cor, 1)
mand_cor = mand.data.color_attributes.new('Col', 'BYTE_COLOR', 'POINT')
MV = np.array([v.co[:] for v in mand.data.vertices])
for i, p in enumerate(MV):
    k = float(suave(hc(1.53, 0)[0], hc(1.57, 0)[0], p[0])); c = np.array([0.74, 0.73, 0.70]) * (1 - k) + np.array([0.035, 0.032, 0.03]) * k
    mand_cor.data[i].color = (*c, 1)

# ------------------------------------------------------------------------------------------------ materiais (cor por vértice + pelo curto)
def material_pelo():
    m = bpy.data.materials.new('pelo_nelore'); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    ca = nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'Col'; nt.links.new(ca.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.72; b.inputs['Sheen Weight'].default_value = 0.35; b.inputs['Sheen Roughness'].default_value = 0.4
    b.inputs['Specular IOR Level'].default_value = 0.3; return m
def material_simples(nome, cor, rug=0.4, coat=0.0):
    m = bpy.data.materials.new(nome); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*cor, 1); b.inputs['Roughness'].default_value = rug
    if coat: b.inputs['Coat Weight'].default_value = coat
    return m
MP = material_pelo(); pele.data.materials.append(MP); mand.data.materials.append(MP)
mo = material_simples('olho_boi', (0.02, 0.012, 0.008), 0.05, coat=1.0)
for o in OLHOS: o.data.materials.append(mo)
mc = material_simples('chifre', (0.32, 0.30, 0.27), 0.45)
for o in CHIFRES:
    o.data.materials.append(mc)
    me = o.data; V = np.array([v.co[:] for v in me.vertices]); at = me.color_attributes.new('Col', 'BYTE_COLOR', 'POINT')
mcab = material_simples('vassoura', (0.03, 0.028, 0.026), 0.85); VASSOURA.data.materials.append(mcab)
for o in CHIFRES + OLHOS + [VASSOURA]: bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.shade_smooth()

# ------------------------------------------------------------------------------------------------ versão leve + esqueleto
def ativo(o, *sel):
    for x_ in list(bpy.context.selected_objects): x_.select_set(False)
    for x_ in sel: x_.select_set(True)
    o.select_set(True); bpy.context.view_layer.objects.active = o
tris = sum(len(p.vertices) - 2 for p in pele.data.polygons)
ativo(pele); d = pele.modifiers.new('dec', 'DECIMATE'); d.ratio = min(1.0, TRIS / tris); d.use_collapse_triangulate = True; bpy.ops.object.modifier_apply(modifier=d.name)
bpy.ops.object.shade_smooth()
print('BOI faces (leve):', len(pele.data.polygons))

ad = bpy.data.armatures.new('esqueleto_boi'); arm = bpy.data.objects.new('boi_esqueleto', ad); cena.collection.objects.link(arm); ativo(arm); bpy.ops.object.mode_set(mode='EDIT')
def osso(nome, a, b, pai=None, liga=True):
    e = ad.edit_bones.new(nome); e.head = a; e.tail = b
    if pai: e.parent = ad.edit_bones[pai]; e.use_connect = liga and (Vector(a) - ad.edit_bones[pai].tail).length < 1e-4
    return e
osso('raiz', (0, 0, 0), (0, 0, 0.4), liga=False)
osso('quadril', (-0.80, 0, 1.18), (-0.30, 0, 1.12), 'raiz', False)
osso('coluna', (-0.30, 0, 1.12), (0.30, 0, 1.14), 'quadril')
osso('peito', (0.30, 0, 1.14), (0.72, 0, 1.15), 'coluna')
osso('pescoco1', (0.72, 0, 1.15), (0.95, 0, 1.20), 'peito'); osso('pescoco2', (0.95, 0, 1.20), (1.15, 0, 1.28), 'pescoco1')
osso('cabeca', (1.15, 0, 1.28), hcp((1.58, 0, 0.90)), 'pescoco2'); osso('mandibula', hcp((1.27, 0, 1.03)), hcp((1.56, 0, 0.85)), 'cabeca', False)
osso('barbela', (0.95, 0, 0.92), (0.70, 0, 0.72), 'pescoco1', False)
prev = 'quadril'
for k in range(4):
    a, b = CAUDA_P[k], CAUDA_P[k + 1]; osso(f'cauda{k + 1}', a, b, prev, k > 0); prev = f'cauda{k + 1}'
for l, s in (('l', 1), ('r', -1)):
    osso(f'ombro_{l}', (0.62, 0.15 * s, 1.08), (0.52, 0.19 * s, 0.80), 'peito', False)
    osso(f'antebraco_{l}', (0.52, 0.19 * s, 0.80), (0.55, 0.175 * s, 0.42), f'ombro_{l}')
    osso(f'canela_d_{l}', (0.55, 0.175 * s, 0.42), (0.56, 0.17 * s, 0.13), f'antebraco_{l}')
    osso(f'pe_d_{l}', (0.56, 0.17 * s, 0.13), (0.62, 0.17 * s, 0.0), f'canela_d_{l}')
    osso(f'coxa_{l}', (-0.80, 0.17 * s, 1.15), (-0.66, 0.22 * s, 0.86), 'quadril', False)
    osso(f'perna_{l}', (-0.66, 0.22 * s, 0.86), (-0.92, 0.17 * s, 0.47), f'coxa_{l}')
    osso(f'canela_t_{l}', (-0.92, 0.17 * s, 0.47), (-0.88, 0.165 * s, 0.13), f'perna_{l}')
    osso(f'pe_t_{l}', (-0.88, 0.165 * s, 0.13), (-0.83, 0.165 * s, 0.0), f'canela_t_{l}')
    osso(f'orelha_{l}', (1.18, 0.12 * s, 1.26), (1.18, 0.29 * s, 1.20), 'cabeca', False)
bpy.ops.object.mode_set(mode='OBJECT')
ativo(arm, pele); bpy.ops.object.parent_set(type='ARMATURE_AUTO')
if not any(len(v.groups) for v in pele.data.vertices[:3000]): ativo(arm, pele); bpy.ops.object.parent_set(type='ARMATURE_ENVELOPE'); print('PESOS: envelope')
# cabeça: tudo à frente da nuca é 100% cabeça (sem a pele do focinho escorregar para o pescoço); a ponta do queixo de baixo segue a mandíbula
gC = pele.vertex_groups['cabeca']
for v in pele.data.vertices:
    c = v.co
    k = float(suave(1.12, 1.20, c.x)) if c.z > 0.85 else 0.0
    if k <= 0: continue
    for g_ in list(v.groups):
        if pele.vertex_groups[g_.group].name != 'cabeca': pele.vertex_groups[g_.group].add([v.index], g_.weight * (1 - k), 'REPLACE')
    gC.add([v.index], k + (1 - k) * next((g_.weight for g_ in v.groups if pele.vertex_groups[g_.group].name == 'cabeca'), 0), 'REPLACE')
def prender_osso(o, nome_osso):
    bpy.context.view_layer.update(); mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
    ativo(arm, o); ad.bones.active = ad.bones[nome_osso]; bpy.ops.object.parent_set(type='BONE', keep_transform=True)
prender_osso(mand, 'mandibula')
for o in OLHOS + CHIFRES: prender_osso(o, 'cabeca')
prender_osso(VASSOURA, 'cauda4')

# ------------------------------------------------------------------------------------------------ prévia (Cycles) e GLB
if PREVIA:
    cena.render.engine = 'CYCLES'; cena.cycles.samples = AMOSTRAS; cena.cycles.use_denoising = True; cena.cycles.device = 'CPU'
    cena.render.resolution_x, cena.render.resolution_y = 1000, 700
    w = bpy.data.worlds.new('mundo'); cena.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.25, 0.38, 0.62, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
    sol = bpy.data.lights.new('sol', 'SUN'); sol.energy = 3.5; sol.angle = math.radians(3); so = bpy.data.objects.new('sol', sol); so.rotation_euler = (math.radians(45), 0, math.radians(-30)); cena.collection.objects.link(so)
    chao = bpy.data.meshes.new('chao'); oc = bpy.data.objects.new('chao', chao); cena.collection.objects.link(oc)
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=20); bm.to_mesh(chao); bm.free(); oc.data.materials.append(material_simples('chao', (0.25, 0.4, 0.2), 0.9))
    for nome, loc, alvo, lente in [('tresq', (3.2, -3.4, 1.4), (0.2, 0, 0.9), 40), ('lado', (0.2, -5.2, 1.0), (0.1, 0, 0.85), 40), ('cabeca', (2.6, -1.3, 1.25), (1.35, 0, 1.1), 60), ('tras', (-3.6, 2.4, 1.6), (0, 0, 0.9), 40)]:
        cd = bpy.data.cameras.new(nome); cd.lens = lente; c2 = bpy.data.objects.new(nome, cd); c2.location = loc; cena.collection.objects.link(c2)
        al = bpy.data.objects.new('alvo_' + nome, None); al.location = alvo; cena.collection.objects.link(al)
        c = c2.constraints.new('TRACK_TO'); c.target = al; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
        cena.camera = c2; cena.render.filepath = PREVIA.replace('.png', f'_{nome}.png'); bpy.ops.render.render(write_still=True)
if SAIDA:
    for x_ in bpy.context.view_layer.objects: x_.select_set(False)
    arm.select_set(True)
    for o in arm.children_recursive: o.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(filepath=SAIDA, export_format='GLB', use_selection=True, export_skins=True, export_animations=False, export_vertex_color='MATERIAL')
    print('GLB', SAIDA, 'ossos', len(ad.bones), 'faces', len(pele.data.polygons))
