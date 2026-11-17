# TUBARÃO-BRANCO (Carcharodon carcharias) realista para a biblioteca do canal, modelado no Blender.
# Adulto de 4,5 m (maturidade ~4,5-5 m; máximo registrado ~6,4 m, discutido: FishBase sp. 751). Forma clássica: focinho cônico, corpo
# fusiforme robusto (altura máxima ~21% do comprimento), 1ª dorsal triangular, peitorais longas e falcadas, cauda em meia-lua quase
# simétrica com quilha lateral no pedúnculo, 5 fendas branquiais longas, olho preto, dorso cinza e ventre branco com divisa irregular,
# ponta preta embaixo das peitorais (Florida Museum, "White shark"). Proporções das nadadeiras aproximadas de ilustrações científicas
# da espécie (não há tabela única publicada); a caudal cresce menos que o corpo nos adultos (Lingham-Soliar 2005).
#
# Corpo por seções (loft) ao longo de X; nadadeiras com perfil de asa (NACA 00xx) e mandíbula unidas ao corpo por remesh de voxel; a fenda
# da boca é cortada na pele (os cantos ficam ligados) e o osso da mandíbula abre esticando a pele, como num rig de cinema; dentes triangulares em fileiras; guelras e sulcos esculpidos na malha; cor por atributo (contra-sombreamento) + shader de pele.
# Unidades: metros. Olha para +X, Z para cima, esquerda = +Y. x = 0 na ponta da cauda, x = 4,5 na ponta do focinho.
#
# uso: blender -b --python criar_tubarao.py -- [--previa pasta] [--abre 0..40] [--glb tubarao.glb] [--blend tubarao.blend]
#      [--amostras 48] [--larg 1100] [--vistas lado,ataque,baixo,topo]
import bpy, bmesh, math, sys, os
import numpy as np
from mathutils import Vector, Matrix

A = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(n, d=None): return A[A.index('--' + n) + 1] if '--' + n in A else d
PREVIA, ABRE, GLB, BLEND = arg('previa'), float(arg('abre', 0)), arg('glb'), arg('blend')
AMOSTRAS, LARG, VISTAS = int(arg('amostras', 48)), int(arg('larg', 1100)), arg('vistas', 'lado,ataque,baixo,topo').split(',')
bpy.ops.wm.read_factory_settings(use_empty=True)
cena = bpy.context.scene

# ------------------------------------------------------------------------------------------------ ferramentas
def catmull(P, n_por_seg=6):
    P = [np.array(p, float) for p in P]; out = []
    for i in range(len(P) - 1):
        p0, p1, p2, p3 = P[max(i - 1, 0)], P[i], P[i + 1], P[min(i + 2, len(P) - 1)]
        for k in range(n_por_seg):
            t = k / n_por_seg
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-1]); return np.array(out)

def malha(nome, V, F):
    me = bpy.data.meshes.new(nome); me.from_pydata([tuple(v) for v in V], [], [tuple(f) for f in F]); me.validate(); me.update()
    ob = bpy.data.objects.new(nome, me); cena.collection.objects.link(ob); return ob

def loft(nome, estacoes, N=56, expo=2.25, n_por_seg=6):
    """estações [x, zc, meia_largura, alto, baixo, afina_cima, afina_baixo] ao longo de X; anel em superelipse (centro em zc)"""
    E = catmull(estacoes, n_por_seg); V, F = [], []
    for e in E:
        x, zc, w, hT, hB = e[:5]; afT = e[5] if len(e) > 5 else 0; afB = e[6] if len(e) > 6 else 0
        for j in range(N):
            th = 2 * math.pi * j / N; c, s = math.cos(th), math.sin(th)
            y = w * math.copysign(abs(c) ** (2 / expo), c); z = (hT if s > 0 else hB) * math.copysign(abs(s) ** (2 / expo), s)
            y *= 1 - (afT * s if s > 0 else -afB * s)
            V.append((x, y, zc + z))
    R = len(E)
    for i in range(R - 1):
        for j in range(N): F.append((i * N + j, i * N + (j + 1) % N, (i + 1) * N + (j + 1) % N, (i + 1) * N + j))
    for i0, inv in ((0, True), (R - 1, False)):
        c = np.mean([V[i0 * N + j] for j in range(N)], 0); V.append(tuple(c)); k = len(V) - 1
        for j in range(N): F.append((k, i0 * N + (j + 1) % N, i0 * N + j) if not inv else (k, i0 * N + j, i0 * N + (j + 1) % N))
    ob = malha(nome, V, F); return ob

def nadadeira(nome, bordo, fuga, span, comp, ponta=0.12, enflech=0.3, falc=0.25, esp=0.11, min_esp=0.02, n_sec=16, n_c=20, arredonda=0.35):
    """nadadeira com perfil de asa: raiz do bordo de ataque (bordo) ao bordo de fuga (fuga), saindo na direção span por comp metros;
    enflech: recuo do bordo de ataque (rad); falc: quanto o bordo de fuga é côncavo (forma de foice); ponta: corda na ponta / corda na raiz"""
    a, b, s = np.array(bordo, float), np.array(fuga, float), np.array(span, float); s /= np.linalg.norm(s)
    c0 = np.linalg.norm(b - a); tras = (b - a) / c0; nrm = np.cross(tras, s); nrm /= np.linalg.norm(nrm)
    tras = np.cross(s, nrm); tras /= np.linalg.norm(tras)                          # corda perpendicular ao span, no plano da nadadeira
    us = 0.5 - 0.5 * np.cos(np.linspace(0, math.pi, n_c))                           # mais pontos perto dos bordos
    V, F, aneis = [], [], []
    for k in range(n_sec + 1):
        v = k / n_sec
        le = a + s * comp * v + tras * comp * v * math.tan(enflech)
        ck = c0 * (ponta + (1 - ponta) * (1 - v) ** 1.15)
        ck -= falc * c0 * math.sin(math.pi * min(1, v * 1.15)) * 0.45                # bordo de fuga côncavo
        if v > 1 - arredonda: ck *= math.sqrt(max(0.0, 1 - ((v - (1 - arredonda)) / arredonda) ** 2)) * 0.85 + 0.15   # ponta arredondada
        ck = max(ck, 0.012)
        tk = max(esp * ck, min_esp * (1 - 0.5 * v))
        yt = 5 * tk * (0.2969 * np.sqrt(us) - 0.1260 * us - 0.3516 * us ** 2 + 0.2843 * us ** 3 - 0.1036 * us ** 4)
        cima = [le + tras * ck * u + nrm * y for u, y in zip(us, yt)]
        baixo = [le + tras * ck * u - nrm * y for u, y in zip(us[1:-1][::-1], yt[1:-1][::-1])]
        anel = cima + baixo; base = len(V); V += [tuple(p) for p in anel]; aneis.append((base, len(anel)))
    for (b0, n0), (b1, n1) in zip(aneis, aneis[1:]):
        for j in range(n0): F.append((b0 + j, b0 + (j + 1) % n0, b1 + (j + 1) % n0, b1 + j))
    for (b0, n0), inv in ((aneis[0], True), (aneis[-1], False)):
        c = np.mean([V[b0 + j] for j in range(n0)], 0); V.append(tuple(c)); kc = len(V) - 1
        for j in range(n0): F.append((kc, b0 + j, b0 + (j + 1) % n0) if inv else (kc, b0 + (j + 1) % n0, b0 + j))
    o = malha(nome, V, F)
    bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(o.data); bm.free()
    return o

def unir(objs, nome, voxel=0.009, suave=5):
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join(); o = bpy.context.object; o.name = nome
    m = o.modifiers.new('rm', 'REMESH'); m.mode = 'VOXEL'; m.voxel_size = voxel; m.use_smooth_shade = True; bpy.ops.object.modifier_apply(modifier=m.name)
    s = o.modifiers.new('sv', 'CORRECTIVE_SMOOTH'); s.iterations = suave; s.use_only_smooth = True; bpy.ops.object.modifier_apply(modifier=s.name)
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

# ------------------------------------------------------------------------------------------------ corpo
# boca: a cabeça termina embaixo na linha da boca (x >= 3,86) e a mandíbula (separada) completa o queixo
FRENTE_BOCA = 4.27                                                               # a boca termina bem atrás da ponta do focinho (4,50)
def linha_boca(x): return -0.215 + 0.36 * max(0.0, x - 3.88) ** 1.25            # da comissura (x 3,88) sobe até a frente da boca
CORPO = [   # x, zc, meia-largura, alto, baixo, afina em cima, afina embaixo
    (0.74, 0.02, 0.050, 0.120, 0.110, 0.2, 0.2),
    (0.86, 0.01, 0.105, 0.085, 0.085, 0.0, 0.0),     # pedúnculo achatado (quilha lateral)
    (1.00, 0.00, 0.125, 0.105, 0.100, 0.1, 0.0),
    (1.20, 0.00, 0.175, 0.185, 0.155, 0.2, 0.0),
    (1.55, 0.00, 0.270, 0.300, 0.240, 0.25, 0.05),
    (1.95, 0.00, 0.380, 0.420, 0.380, 0.25, 0.05),   # robusto como o animal real: a barriga desce e o dorso sobe na 1ª dorsal
    (2.35, 0.00, 0.460, 0.500, 0.470, 0.22, 0.04),
    (2.75, 0.00, 0.495, 0.530, 0.515, 0.2, 0.04),
    (3.15, 0.00, 0.485, 0.505, 0.490, 0.15, 0.04),
    (3.50, 0.00, 0.450, 0.450, 0.420, 0.12, 0.05),
    (3.80, 0.00, 0.400, 0.405, 0.300, 0.10, 0.05),   # cabeça mais alta (no animal real a cabeça é grande)
    (3.95, 0.01, 0.335, 0.350, 0.215, 0.08, 0.10),   # daqui para a frente o "baixo" é a linha da boca; focinho cônico
    (4.10, 0.02, 0.260, 0.272, 0.185, 0.06, 0.12),
    (4.25, 0.03, 0.170, 0.185, 0.135, 0.05, 0.12),
    (4.38, 0.015, 0.094, 0.100, 0.095, 0.0, 0.05),   # focinho cônico cheio por baixo também (não "bico de pato")
    (4.46, 0.010, 0.058, 0.060, 0.058, 0.0, 0.0),    # ponta arredondada
    (4.50, 0.008, 0.020, 0.022, 0.020, 0.0, 0.0),
]
MAND = [    # mandíbula (x, zc, meia-largura, alto, baixo): o topo encosta na linha da boca, o queixo arredondado embaixo
    (3.84, -0.235, 0.290, 0.060, 0.065),             # o fundo atrás coincide com a garganta (sem "queixo duplo"); espessa o bastante
    (3.95, -0.228, 0.272, 0.058, 0.062),             # para não parecer um aro quando abre
    (4.08, -0.198, 0.210, 0.050, 0.055),             # a frente da mandíbula afina e recua (boca em arco, não uma caixa)
    (4.18, -0.160, 0.135, 0.036, 0.042),
    (4.24, -0.128, 0.068, 0.026, 0.030),
    (4.275, -0.115, 0.020, 0.016, 0.018),
]
corpo = loft('corpo', CORPO, N=64)
mand = loft('mandibula', [(x, zc, w, hT, hB, 0, 0) for x, zc, w, hT, hB in MAND], N=48, expo=2.4)

# nadadeiras
nad = []
nad.append(nadadeira('dorsal1', (2.94, 0, 0.36), (2.26, 0, 0.36), (-0.16, 0, 1), 0.74, ponta=0.10, enflech=0.30, falc=0.30, esp=0.10))     # alta e em pé
for s_, l in ((1, 'l'), (-1, 'r')):
    nad.append(nadadeira('peitoral_' + l, (3.36, 0.27 * s_, -0.22), (2.80, 0.25 * s_, -0.26), (-0.40, 0.62 * s_, -0.68), 1.08, ponta=0.10, enflech=0.28, falc=0.28, esp=0.12))   # grandes, caídas para baixo e para trás
    nad.append(nadadeira('pelvica_' + l, (1.86, 0.10 * s_, -0.22), (1.60, 0.08 * s_, -0.22), (-0.45, 0.55 * s_, -0.70), 0.32, ponta=0.18, enflech=0.35, falc=0.20, esp=0.10))
    nad.append(nadadeira('quilha_' + l, (1.10, 0.08 * s_, 0.0), (0.78, 0.07 * s_, 0.0), (-0.05, 1.0 * s_, 0.0), 0.05, ponta=0.6, enflech=0.0, falc=0.0, esp=0.18, arredonda=0.6))
nad.append(nadadeira('dorsal2', (1.13, 0, 0.08), (0.99, 0, 0.08), (-0.30, 0, 1), 0.12, ponta=0.25, enflech=0.4, falc=0.25))
nad.append(nadadeira('anal', (1.09, 0, -0.07), (0.97, 0, -0.07), (-0.30, 0, -1), 0.11, ponta=0.25, enflech=0.4, falc=0.25))
nad.append(nadadeira('caudal_sup', (0.95, 0, 0.03), (0.58, 0, 0.03), (-0.58, 0, 0.81), 1.00, ponta=0.12, enflech=0.22, falc=0.30, esp=0.10))      # lóbulos largos
nad.append(nadadeira('caudal_inf', (0.93, 0, -0.02), (0.60, 0, 0.0), (-0.52, 0, -0.85), 0.90, ponta=0.12, enflech=0.22, falc=0.30, esp=0.10))
pele = unir([corpo, mand] + nad, 'tubarao', voxel=0.0085)
print('CORPO faces', len(pele.data.polygons))

# ------------------------------------------------------------------------------------------------ escultura: fendas branquiais, sulco da boca, narinas, quilha
def esculpir(o, fn):
    me = o.data; V = np.array([v.co[:] for v in me.vertices]); N = np.array([v.normal[:] for v in me.vertices])
    d = fn(V, N); V2 = V + N * d[:, None]
    for i, v in enumerate(me.vertices): v.co = V2[i]
    me.update()
FENDAS = [(3.72, 0.34, 0.15), (3.62, 0.36, 0.16), (3.52, 0.37, 0.16), (3.42, 0.36, 0.15), (3.31, 0.32, 0.13)]   # (x no meio, altura, topo z)
def fendas(V, N):
    d = np.zeros(len(V)); lado = np.abs(V[:, 1]) > 0.18
    for xm, alt, topo in FENDAS:
        z0 = topo - alt; t = np.clip((V[:, 2] - z0) / alt, 0, 1); dentro = (V[:, 2] > z0 - 0.02) & (V[:, 2] < topo + 0.02)
        xl = xm + 0.035 * (t - 0.5) - 0.05 * (t - 0.5) ** 2                     # a fenda curva levemente para trás nas pontas
        dx = V[:, 0] - xl; pont = np.sin(np.pi * t) ** 0.6
        sulco = -0.026 * np.exp(-(dx / 0.0075) ** 2) * pont
        aba = 0.0045 * np.exp(-((dx + 0.018) / 0.014) ** 2) * pont                # a borda de trás da fenda fica um pouco saliente
        d += np.where(lado & dentro, sulco + aba, 0)
    return d
esculpir(pele, fendas)
def detalhes_cabeca(V, N):
    d = np.zeros(len(V))
    # narinas: duas fendas oblíquas embaixo do focinho
    for s_ in (1, -1):
        p = np.array([4.36, 0.075 * s_, -0.035]); q = V - p; u = q[:, 0] * 0.8 + q[:, 1] * 0.6 * s_; w_ = -q[:, 0] * 0.6 + q[:, 1] * 0.8 * s_
        d += -0.012 * np.exp(-(u / 0.022) ** 2 - (w_ / 0.006) ** 2 - (q[:, 2] / 0.03) ** 2)
    # sulco labial: dobra na comissura da boca
    for s_ in (1, -1):
        p = np.array([3.90, 0.30 * s_, -0.215]); q = V - p
        d += -0.010 * np.exp(-(q[:, 0] / 0.05) ** 2 - (q[:, 2] / 0.012) ** 2) * (np.abs(V[:, 1]) > 0.2)
    # textura grossa da pele (ondulações musculares leves) e "poros" de Lorenzini no focinho
    d += 0.0016 * fbm3(V, 6.0, 3, sem=4)
    focinho = suave(4.05, 4.25, V[:, 0])
    d += -0.0016 * focinho * (ruido3(V, 90.0, sem=9) > 0.55)
    return d
esculpir(pele, detalhes_cabeca)

# fenda da boca: placa fina na linha da boca, da comissura (x 3,84) até passar da ponta, mais larga que a cabeça (corta os lábios dos lados
# e na frente); atrás de x 3,84 a pele continua inteira: são os cantos da boca, que esticam quando a mandíbula abre
FENDA_Z = 0.0045                                                                  # o meio da fenda fica 4,5 mm abaixo da linha da boca
def fenda_boca():
    xs = np.linspace(3.84, FRENTE_BOCA + 0.035, 40); ys = np.linspace(-0.52, 0.52, 41); V, F = [], []
    for z_off in (+0.0045, -0.0045):
        for x in xs:
            for y in ys: V.append((x, y, linha_boca(min(x, FRENTE_BOCA)) - FENDA_Z + z_off))
    nx, ny = len(xs), len(ys); idx = lambda c, i, j: c * nx * ny + i * ny + j
    for i in range(nx - 1):
        for j in range(ny - 1):
            F.append((idx(0, i, j), idx(0, i + 1, j), idx(0, i + 1, j + 1), idx(0, i, j + 1)))          # cima
            F.append((idx(1, i, j), idx(1, i, j + 1), idx(1, i + 1, j + 1), idx(1, i + 1, j)))          # baixo
    for i in range(nx - 1):
        for j in (0, ny - 1):
            F.append((idx(0, i, j), idx(1, i, j), idx(1, i + 1, j), idx(0, i + 1, j)))
    for j in range(ny - 1):
        for i in (0, nx - 1):
            F.append((idx(0, i, j), idx(0, i, j + 1), idx(1, i, j + 1), idx(1, i, j)))
    o = malha('fenda', V, F); bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(o.data); bm.free()
    return o
fenda = fenda_boca()
bo = pele.modifiers.new('fenda', 'BOOLEAN'); bo.operation = 'DIFFERENCE'; bo.object = fenda; bo.solver = 'EXACT'
for o in bpy.context.view_layer.objects: o.select_set(False)
bpy.context.view_layer.objects.active = pele; pele.select_set(True); bpy.ops.object.modifier_apply(modifier='fenda')
bpy.data.objects.remove(fenda, do_unlink=True)
print('FENDA da boca cortada; faces', len(pele.data.polygons))

# contorno real da boca no plano (onde o corte encontra a pele): pontos do lado +y, da frente (meio) até a comissura
def medir_contorno():
    V = np.array([v.co[:] for v in pele.data.vertices]); zl = np.array([linha_boca(min(x, FRENTE_BOCA)) - FENDA_Z for x in V[:, 0]])
    piso = (V[:, 0] > 3.83) & (np.abs(V[:, 2] - (zl - 0.0045)) < 0.0012)
    P = V[piso][:, :2]; P = P[P[:, 1] >= 0]
    ang = np.arctan2(P[:, 1], P[:, 0] - 3.80); r = np.hypot(P[:, 0] - 3.80, P[:, 1])
    bins = np.linspace(0, ang.max(), 70); pts = []
    for a0, a1 in zip(bins, bins[1:]):
        m_ = (ang >= a0) & (ang < a1)
        if m_.any(): k = np.argmax(r * m_ - (~m_) * 9); pts.append(P[k])
    pts = np.array(pts); pts = pts[pts[:, 0] > 3.88]                               # até a comissura
    pts[0, 1] = 0.0
    seg = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
    return pts, seg
CONT, CONT_S = medir_contorno()
def dist_contorno(xy):
    """distância (no plano) de cada ponto até o contorno da boca (dos dois lados)"""
    C = np.vstack([CONT, CONT * np.array([1, -1])]); d = np.linalg.norm(xy[:, None, :] - C[None, :, :], axis=2); return d.min(1)
def ponto_contorno(t, s_, dentro):
    """ponto do contorno a uma fração t do comprimento (0 = meio da frente, 1 = comissura), recuado `dentro` m para o interior"""
    L = CONT_S[-1] * t; i = min(np.searchsorted(CONT_S, L), len(CONT) - 1); i0 = max(i - 1, 0)
    a_ = (L - CONT_S[i0]) / max(CONT_S[i] - CONT_S[i0], 1e-6); p = CONT[i0] * (1 - a_) + CONT[i] * a_
    tg = CONT[min(i + 1, len(CONT) - 1)] - CONT[max(i - 1, 0)]; tg /= np.linalg.norm(tg) + 1e-9
    nrm = np.array([tg[1], -tg[0]])                                                # para dentro da boca
    if np.dot(nrm, np.array([3.95, 0]) - p) < 0: nrm = -nrm
    q = p + nrm * dentro; return np.array([q[0], q[1] * s_]), np.array([-nrm[0], -nrm[1] * s_])
print('CONTORNO da boca', len(CONT), 'pontos, comprimento', round(float(CONT_S[-1]), 3))

# escultura da boca por dentro: a borda fica como crista (onde os dentes nascem), o meio afunda (assoalho e céu da boca), língua no fundo
me = pele.data; V = np.array([v.co[:] for v in me.vertices]); zl = np.array([linha_boca(min(x, FRENTE_BOCA)) - FENDA_Z for x in V[:, 0]])
piso = (V[:, 0] > 3.83) & (np.abs(V[:, 2] - (zl - 0.0045)) < 0.0012); teto = (V[:, 0] > 3.83) & (np.abs(V[:, 2] - (zl + 0.0045)) < 0.0012)
d = np.zeros(len(V)); sel = piso | teto; d[sel] = dist_contorno(V[sel][:, :2])
fundo = suave(0.020, 0.075, d) * (0.65 + 0.35 * suave(4.26, 3.95, V[:, 0])) * suave(FRENTE_BOCA, FRENTE_BOCA - 0.09, V[:, 0])
lingua = 0.030 * np.exp(-((V[:, 0] - 3.98) / 0.09) ** 2 - (V[:, 1] / 0.10) ** 2)
dz = np.where(piso, -0.070 * fundo + lingua * fundo, 0.0) + np.where(teto, 0.050 * fundo, 0.0)
# lábios: a pele de fora, logo abaixo e logo acima da fenda, recolhe ~1,5 cm (a crista de gengiva com os dentes fica saliente sobre o lábio;
# com a boca fechada as pontas dos dentes de baixo aparecem, como no tubarão-branco). Só a pele perto do contorno da boca.
fora_ = ~sel & (V[:, 0] > 3.86) & (np.abs(V[:, 2] - zl) < 0.05)
dfc = np.full(len(V), 9.0); dfc[fora_] = dist_contorno(V[fora_][:, :2])
perto = fora_ & (dfc < 0.03)
abaixo = np.clip((zl - V[:, 2]), 0, None); acima = np.clip((V[:, 2] - zl), 0, None)
dz += np.where(perto & (V[:, 2] < zl), -0.015 * np.exp(-(abaixo / 0.014) ** 2), 0.0)
dz += np.where(perto & (V[:, 2] > zl), 0.010 * np.exp(-(acima / 0.012) ** 2), 0.0)
sel = sel | perto
for i in np.nonzero(sel)[0]: me.vertices[i].co.z += dz[i]
me.update()
dentro_ = piso | teto
DIST_BOCA = dict(zip(np.nonzero(dentro_)[0].tolist(), d[dentro_].tolist()))

# ------------------------------------------------------------------------------------------------ cor: contra-sombreamento com divisa irregular, ventre branco, pontas pretas nas peitorais
def colorir(o, mandibula=False):
    me = o.data; V = np.array([v.co[:] for v in me.vertices]); N = np.array([v.normal[:] for v in me.vertices])
    divisa = -0.04 + 0.05 * np.tanh((V[:, 0] - 3.2) * 2) + 0.06 * fbm3(V * np.array([1, 0.2, 0.2]), 2.2, 3, sem=11) + 0.025 * fbm3(V, 9.0, 2, sem=12)
    divisa += 0.10 * suave(3.6, 4.2, V[:, 0])                                     # na cabeça o branco sobe até a boca/olho
    dorso = suave(-0.006, 0.006, V[:, 2] - divisa)
    larg = np.interp(V[:, 0], [c[0] for c in CORPO], [c[2] for c in CORPO])
    pe = (np.abs(V[:, 1]) > larg + 0.03) & (V[:, 2] < 0.0) & (V[:, 0] > 2.3) & (V[:, 0] < 3.6)              # peitorais
    dorso = np.where(pe, suave(-0.15, 0.15, N[:, 2]), dorso)                                                  # em cima cinza, embaixo branco
    vert = (np.abs(V[:, 1]) < 0.06) & ((V[:, 2] > 0.30) | (V[:, 0] < 1.2))                                    # dorsais e cauda: cinza
    dorso = np.where(vert & (V[:, 0] < 1.0), np.maximum(dorso, 0.85), dorso)
    if mandibula: dorso = np.zeros(len(V))
    ponta = np.zeros(len(V))
    for s_ in (1, -1):                                                                                          # ponta preta embaixo da peitoral
        q = V - np.array([2.62, 0.27 * s_ + 0.84 * s_ * 0.95, -0.20 - 0.40 * 0.95]); ponta = np.maximum(ponta, suave(0.32, 0.12, np.linalg.norm(q, axis=1)) * (N[:, 2] < 0.2))
    ponta = np.maximum(ponta, suave(0.75, 0.68, V[:, 0]) * 0.55)                                                # bordo da cauda mais escuro
    for s_ in (1, -1):                                                                                          # mancha preta na axila
        q = V - np.array([2.98, 0.34 * s_, -0.30]); ponta = np.maximum(ponta, suave(0.10, 0.04, np.linalg.norm(q, axis=1)) * (N[:, 2] < 0.3))
    at = me.color_attributes.new('dorso', 'FLOAT_COLOR', 'POINT'); ap = me.color_attributes.new('ponta', 'FLOAT_COLOR', 'POINT')
    for i in range(len(V)): at.data[i].color = (dorso[i],) * 3 + (1,); ap.data[i].color = (ponta[i],) * 3 + (1,)
colorir(pele)

def material_pele():
    m = bpy.data.materials.new('pele_tubarao'); m.use_nodes = True; nt = m.node_tree; Nn = nt.nodes; L = nt.links; b = Nn['Principled BSDF']
    tc = Nn.new('ShaderNodeTexCoord'); at = Nn.new('ShaderNodeAttribute'); at.attribute_name = 'dorso'; ap = Nn.new('ShaderNodeAttribute'); ap.attribute_name = 'ponta'
    rampa = Nn.new('ShaderNodeValToRGB'); cr = rampa.color_ramp
    cr.elements[0].position = 0.0; cr.elements[0].color = (0.78, 0.79, 0.77, 1); cr.elements[1].position = 1.0; cr.elements[1].color = (0.058, 0.060, 0.060, 1)
    e = cr.elements.new(0.5); e.color = (0.16, 0.165, 0.165, 1)
    L.new(at.outputs['Fac'], rampa.inputs['Fac'])
    mancha = Nn.new('ShaderNodeTexNoise'); mancha.inputs['Scale'].default_value = 3.0; mancha.inputs['Detail'].default_value = 6.0; L.new(tc.outputs['Object'], mancha.inputs['Vector'])
    mR = Nn.new('ShaderNodeMapRange'); mR.inputs['From Min'].default_value = 0.35; mR.inputs['From Max'].default_value = 0.65; mR.inputs['To Min'].default_value = 0.82; mR.inputs['To Max'].default_value = 1.08
    L.new(mancha.outputs['Fac'], mR.inputs['Value'])
    c1 = Nn.new('ShaderNodeMix'); c1.data_type = 'RGBA'; c1.blend_type = 'MULTIPLY'; c1.inputs[0].default_value = 1.0; L.new(rampa.outputs['Color'], c1.inputs[6]); L.new(mR.outputs[0], c1.inputs[7])
    # cicatrizes claras (arranhões finos) só no dorso
    cic = Nn.new('ShaderNodeTexWave'); cic.wave_type = 'BANDS'; cic.bands_direction = 'DIAGONAL'; cic.inputs['Scale'].default_value = 7.0; cic.inputs['Distortion'].default_value = 3.0
    L.new(tc.outputs['Object'], cic.inputs['Vector'])
    cicR = Nn.new('ShaderNodeMapRange'); cicR.inputs['From Min'].default_value = 0.994; cicR.inputs['From Max'].default_value = 1.0; L.new(cic.outputs['Fac'], cicR.inputs['Value'])
    cicM = Nn.new('ShaderNodeTexNoise'); cicM.inputs['Scale'].default_value = 1.4; L.new(tc.outputs['Object'], cicM.inputs['Vector'])
    cicMR = Nn.new('ShaderNodeMapRange'); cicMR.inputs['From Min'].default_value = 0.64; cicMR.inputs['From Max'].default_value = 0.70; L.new(cicM.outputs['Fac'], cicMR.inputs['Value'])
    cicF = Nn.new('ShaderNodeMath'); cicF.operation = 'MULTIPLY'; L.new(cicR.outputs[0], cicF.inputs[0]); L.new(cicMR.outputs[0], cicF.inputs[1])
    cicF2 = Nn.new('ShaderNodeMath'); cicF2.operation = 'MULTIPLY'; L.new(cicF.outputs[0], cicF2.inputs[0]); L.new(at.outputs['Fac'], cicF2.inputs[1])
    cicF3 = Nn.new('ShaderNodeMath'); cicF3.operation = 'MULTIPLY'; cicF3.inputs[1].default_value = 0.5; L.new(cicF2.outputs[0], cicF3.inputs[0])
    c2 = Nn.new('ShaderNodeMix'); c2.data_type = 'RGBA'; L.new(cicF3.outputs[0], c2.inputs[0]); L.new(c1.outputs[2], c2.inputs[6]); c2.inputs[7].default_value = (0.55, 0.57, 0.58, 1)
    c3 = Nn.new('ShaderNodeMix'); c3.data_type = 'RGBA'; L.new(ap.outputs['Fac'], c3.inputs[0]); L.new(c2.outputs[2], c3.inputs[6]); c3.inputs[7].default_value = (0.012, 0.013, 0.015, 1)
    # tom: cinza-chumbo puxando para o bronze em manchas largas (pigmento irregular, como nos animais vivos)
    tom = Nn.new('ShaderNodeTexNoise'); tom.inputs['Scale'].default_value = 0.9; tom.inputs['Detail'].default_value = 3.0; L.new(tc.outputs['Object'], tom.inputs['Vector'])
    tomR = Nn.new('ShaderNodeValToRGB'); tomR.color_ramp.elements[0].color = (0.92, 1.0, 1.08, 1); tomR.color_ramp.elements[1].color = (1.18, 1.05, 0.88, 1); L.new(tom.outputs['Fac'], tomR.inputs['Fac'])
    tomF = Nn.new('ShaderNodeMath'); tomF.operation = 'MULTIPLY'; tomF.inputs[1].default_value = 0.7; L.new(at.outputs['Fac'], tomF.inputs[0])
    c4 = Nn.new('ShaderNodeMix'); c4.data_type = 'RGBA'; c4.blend_type = 'MULTIPLY'; L.new(tomF.outputs[0], c4.inputs[0]); L.new(c3.outputs[2], c4.inputs[6]); L.new(tomR.outputs['Color'], c4.inputs[7])
    # sardas escuras perto da divisa (onde o branco encontra o cinza)
    sar = Nn.new('ShaderNodeTexVoronoi'); sar.inputs['Scale'].default_value = 22.0; sar.inputs['Randomness'].default_value = 1.0; L.new(tc.outputs['Object'], sar.inputs['Vector'])
    sarR = Nn.new('ShaderNodeMapRange'); sarR.inputs['From Min'].default_value = 0.10; sarR.inputs['From Max'].default_value = 0.16; sarR.inputs['To Min'].default_value = 1.0; sarR.inputs['To Max'].default_value = 0.0
    L.new(sar.outputs['Distance'], sarR.inputs['Value'])
    faixaD = Nn.new('ShaderNodeMath'); faixaD.operation = 'PINGPONG'; faixaD.inputs[1].default_value = 0.5; L.new(at.outputs['Fac'], faixaD.inputs[0])
    sarSel = Nn.new('ShaderNodeTexNoise'); sarSel.inputs['Scale'].default_value = 5.0; L.new(tc.outputs['Object'], sarSel.inputs['Vector'])
    sarSR = Nn.new('ShaderNodeMapRange'); sarSR.inputs['From Min'].default_value = 0.55; sarSR.inputs['From Max'].default_value = 0.62; L.new(sarSel.outputs['Fac'], sarSR.inputs['Value'])
    sarM = Nn.new('ShaderNodeMath'); sarM.operation = 'MULTIPLY'; L.new(sarR.outputs[0], sarM.inputs[0]); L.new(sarSR.outputs[0], sarM.inputs[1])
    sarM2 = Nn.new('ShaderNodeMath'); sarM2.operation = 'MULTIPLY'; sarM2.inputs[1].default_value = 0.8; L.new(sarM.outputs[0], sarM2.inputs[0])
    lado = Nn.new('ShaderNodeMapRange'); lado.inputs['From Min'].default_value = 0.0; lado.inputs['From Max'].default_value = 0.25; L.new(faixaD.outputs[0], lado.inputs['Value'])
    sarM3 = Nn.new('ShaderNodeMath'); sarM3.operation = 'MULTIPLY'; L.new(sarM2.outputs[0], sarM3.inputs[0]); L.new(at.outputs['Fac'], sarM3.inputs[1])
    c5 = Nn.new('ShaderNodeMix'); c5.data_type = 'RGBA'; L.new(sarM3.outputs[0], c5.inputs[0]); L.new(c4.outputs[2], c5.inputs[6]); c5.inputs[7].default_value = (0.02, 0.022, 0.026, 1)
    # arranhões finos e claros (marcas de briga e de presas): ruído esticado vira riscos
    mp_ = Nn.new('ShaderNodeMapping'); mp_.inputs['Scale'].default_value = (2.0, 26.0, 26.0); mp_.inputs['Rotation'].default_value = (0.3, 0.0, 0.5); L.new(tc.outputs['Object'], mp_.inputs['Vector'])
    ris = Nn.new('ShaderNodeTexNoise'); ris.inputs['Scale'].default_value = 3.0; ris.inputs['Detail'].default_value = 0.0; L.new(mp_.outputs['Vector'], ris.inputs['Vector'])
    risR = Nn.new('ShaderNodeMapRange'); risR.inputs['From Min'].default_value = 0.495; risR.inputs['From Max'].default_value = 0.5; risR.inputs['To Min'].default_value = 0.0; risR.inputs['To Max'].default_value = 1.0
    risR2 = Nn.new('ShaderNodeMapRange'); risR2.inputs['From Min'].default_value = 0.5; risR2.inputs['From Max'].default_value = 0.505; risR2.inputs['To Min'].default_value = 1.0; risR2.inputs['To Max'].default_value = 0.0
    L.new(ris.outputs['Fac'], risR.inputs['Value']); L.new(ris.outputs['Fac'], risR2.inputs['Value'])
    risM = Nn.new('ShaderNodeMath'); risM.operation = 'MINIMUM'; L.new(risR.outputs[0], risM.inputs[0]); L.new(risR2.outputs[0], risM.inputs[1])
    risSel = Nn.new('ShaderNodeTexNoise'); risSel.inputs['Scale'].default_value = 2.2; L.new(tc.outputs['Object'], risSel.inputs['Vector'])
    risSR = Nn.new('ShaderNodeMapRange'); risSR.inputs['From Min'].default_value = 0.50; risSR.inputs['From Max'].default_value = 0.58; L.new(risSel.outputs['Fac'], risSR.inputs['Value'])
    risF = Nn.new('ShaderNodeMath'); risF.operation = 'MULTIPLY'; L.new(risM.outputs[0], risF.inputs[0]); L.new(risSR.outputs[0], risF.inputs[1])
    risF2 = Nn.new('ShaderNodeMath'); risF2.operation = 'MULTIPLY'; risF2.inputs[1].default_value = 0.85; L.new(risF.outputs[0], risF2.inputs[0])
    c6 = Nn.new('ShaderNodeMix'); c6.data_type = 'RGBA'; L.new(risF2.outputs[0], c6.inputs[0]); L.new(c5.outputs[2], c6.inputs[6]); c6.inputs[7].default_value = (0.025, 0.026, 0.028, 1)
    L.new(c6.outputs[2], b.inputs['Base Color'])
    # dentículos dérmicos (lixa fina) + ondulações; pele molhada (verniz leve)
    den = Nn.new('ShaderNodeTexVoronoi'); den.inputs['Scale'].default_value = 900.0; L.new(tc.outputs['Object'], den.inputs['Vector'])
    ond = Nn.new('ShaderNodeTexNoise'); ond.inputs['Scale'].default_value = 14.0; ond.inputs['Detail'].default_value = 4.0; L.new(tc.outputs['Object'], ond.inputs['Vector'])
    alt = Nn.new('ShaderNodeMath'); alt.operation = 'MULTIPLY_ADD'; alt.inputs[1].default_value = 0.25; L.new(den.outputs['Distance'], alt.inputs[0]); L.new(ond.outputs['Fac'], alt.inputs[2])
    bump = Nn.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.18; bump.inputs['Distance'].default_value = 0.004; L.new(alt.outputs[0], bump.inputs['Height']); L.new(bump.outputs['Normal'], b.inputs['Normal'])
    rg = Nn.new('ShaderNodeMapRange'); rg.inputs['To Min'].default_value = 0.42; rg.inputs['To Max'].default_value = 0.30; L.new(ond.outputs['Fac'], rg.inputs['Value']); L.new(rg.outputs[0], b.inputs['Roughness'])
    b.inputs['Specular IOR Level'].default_value = 0.5; b.inputs['Coat Weight'].default_value = 0.45; b.inputs['Coat Roughness'].default_value = 0.10
    gota = Nn.new('ShaderNodeTexNoise'); gota.inputs['Scale'].default_value = 60.0; gota.inputs['Detail'].default_value = 2.0; L.new(tc.outputs['Object'], gota.inputs['Vector'])
    bc = Nn.new('ShaderNodeBump'); bc.inputs['Strength'].default_value = 0.08; bc.inputs['Distance'].default_value = 0.002; L.new(gota.outputs['Fac'], bc.inputs['Height']); L.new(bc.outputs['Normal'], b.inputs['Coat Normal'])
    b.inputs['Subsurface Weight'].default_value = 0.02
    return m
mp = material_pele(); pele.data.materials.append(mp)

# interior da boca (céu da boca e língua avermelhados) pintado nas faces voltadas para dentro da boca
def material_simples(nome, cor, rug=0.4, coat=0.0, sss=0.0):
    m = bpy.data.materials.new(nome); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*cor, 1); b.inputs['Roughness'].default_value = rug; b.inputs['Coat Weight'].default_value = coat
    b.inputs['Subsurface Weight'].default_value = sss; return m
m_boca = material_simples('boca', (0.42, 0.085, 0.09), rug=0.35, coat=0.4, sss=0.25)
m_gengiva = material_simples('gengiva', (0.74, 0.30, 0.30), rug=0.3, coat=0.5, sss=0.4)
def pintar_boca(o, cima):
    if 'boca' not in [m.name for m in o.data.materials]: o.data.materials.append(m_boca); o.data.materials.append(m_gengiva)
    idx = [m.name for m in o.data.materials].index('boca'); idg = [m.name for m in o.data.materials].index('gengiva')
    for p in o.data.polygons:
        vs = [DIST_BOCA.get(i) for i in p.vertices]
        if any(v is None for v in vs): continue
        n = p.normal; dm = sum(vs) / len(vs)
        if (cima and n.z < 0.2) or (not cima and n.z > -0.2):
            p.material_index = idg if dm < 0.055 else idx                                     # gengiva na crista e na encosta, fundo escuro
pintar_boca(pele, True); pintar_boca(pele, False)

# ------------------------------------------------------------------------------------------------ olhos, dentes, gengiva
def raio(o, origem, direcao):
    inv = o.matrix_world.inverted(); ok, loc, nrm, _ = o.ray_cast(inv @ Vector(origem), (inv.to_3x3() @ Vector(direcao)).normalized())
    return (o.matrix_world @ loc, (o.matrix_world.to_3x3() @ nrm).normalized()) if ok else (None, None)
m_olho = material_simples('olho', (0.004, 0.004, 0.005), rug=0.02, coat=1.0)
olhos = []
for s_, l in ((1, 'l'), (-1, 'r')):
    p, n = raio(pele, (4.13, 0.6 * s_, 0.10), (0, -s_, 0))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.031, location=p - n * 0.014); o = bpy.context.object; o.name = 'olho_' + l
    o.scale = (1.0, 0.75, 0.85); o.data.materials.append(m_olho); bpy.ops.object.shade_smooth(); olhos.append(o)

m_dente = material_simples('dente', (0.86, 0.83, 0.74), rug=0.22, coat=0.3, sss=0.1)
def dente(nome, base, cima, frente, larg, alt, esp=0.006, curva=0.25):
    """dente triangular achatado (serrilhado na borda): base no ponto, apontando para `cima`, com face larga voltada para `frente`"""
    c_, f_ = Vector(cima).normalized(), Vector(frente).normalized(); l_ = c_.cross(f_).normalized(); f_ = l_.cross(c_).normalized()
    V, F = [], []
    nser = 7
    borda = []
    for k in range(nser + 1):                                                     # borda esquerda subindo, com serrilha
        t = k / nser; w = larg / 2 * (1 - t); sx = 0.08 * larg * (k % 2) * (1 - t)
        borda.append((-w - sx, alt * t))
    for k in range(nser - 1, -1, -1):
        t = k / nser; w = larg / 2 * (1 - t); sx = 0.08 * larg * (k % 2) * (1 - t)
        borda.append((w + sx, alt * t))
    for lado in (1, -1):
        for (u, v) in borda:
            t = v / alt; dobra = -curva * alt * t * t                              # ponta dobrada para dentro da boca
            p = Vector(base) + l_ * u + c_ * v + f_ * (dobra + lado * esp * (1 - t) * 0.5)
            V.append(tuple(p))
    n = len(borda)
    F.append(tuple(range(n))); F.append(tuple(range(2 * n - 1, n - 1, -1)))
    for i in range(n): F.append((i, (i + 1) % n, n + (i + 1) % n, n + i))
    o = malha(nome, V, F); o.data.materials.append(m_dente); return o

dentes_sup, dentes_inf = [], []
for s_ in (1, -1):
    for fila, recua, inclina in ((0, 0.016, 0.0), (1, 0.036, 0.75), (2, 0.054, 1.35)):        # 3ª fileira deitada: dentes de reposição
        n_ = (13, 12, 10)[fila]
        for k in range(n_):
            t = (k + 0.5) / n_ * 0.97; (x, y), fora = ponto_contorno(t, s_, recua)
            tam = (1.0 - 0.55 * t ** 1.4) * (1.0, 0.82, 0.62)[fila]
            fora3 = Vector((fora[0], fora[1], 0)).normalized(); dentro = -fora3
            z0 = linha_boca(min(x, FRENTE_BOCA)) - FENDA_Z
            p, nrm = raio(pele, (x, y, z0), (0, 0, 1))                                    # crista de cima (raio de dentro da fenda)
            if p is not None:
                cima_d = (Vector((0, 0, -1)) + dentro * inclina).normalized()
                dentes_sup.append(dente(f'dente_sup{fila}_{k}_{s_}', p + Vector((0, 0, 0.008)), cima_d, fora3, 0.054 * tam, 0.062 * tam))
            p, nrm = raio(pele, (x - 0.008, y, z0), (0, 0, -1))                           # crista de baixo
            if p is not None:
                cima_d = (Vector((0, 0, 1)) + dentro * (inclina + 0.12)).normalized()
                dentes_inf.append(dente(f'dente_inf{fila}_{k}_{s_}', p - Vector((0, 0, 0.008)), cima_d, fora3, 0.036 * tam, 0.068 * tam, curva=0.1))
print('DENTES', len(dentes_sup), len(dentes_inf))

# ------------------------------------------------------------------------------------------------ esqueleto (nadar, abrir a boca, peitorais)
ad = bpy.data.armatures.new('esqueleto'); arm = bpy.data.objects.new('tubarao_esqueleto', ad); cena.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
def osso(nome, a, b, pai=None, liga=True):
    e = ad.edit_bones.new(nome); e.head = a; e.tail = b
    if pai: e.parent = ad.edit_bones[pai]; e.use_connect = liga and (Vector(a) - ad.edit_bones[pai].tail).length < 1e-4
    return e
osso('raiz', (3.0, 0, 0), (3.0, 0, 0.3))
COLUNA = [3.60, 3.05, 2.55, 2.05, 1.60, 1.20, 0.92, 0.62, 0.20]
osso('cabeca', (3.60, 0, 0.02), (4.45, 0, 0.04), 'raiz', False)
prev = 'raiz'
for i in range(len(COLUNA) - 1):
    nome = f'coluna{i + 1}'; osso(nome, (COLUNA[i], 0, 0.0), (COLUNA[i + 1], 0, 0.0), prev, i > 0); prev = nome
osso('mandibula', (3.86, 0, -0.22), (4.30, 0, -0.15), 'cabeca', False)
for s_, l in ((1, 'l'), (-1, 'r')):
    osso('peitoral_' + l, (3.05, 0.30 * s_, -0.22), (2.75, 1.10 * s_, -0.62), 'coluna1', False)
bpy.ops.object.mode_set(mode='OBJECT')
for o in bpy.context.view_layer.objects: o.select_set(False)
pele.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm; bpy.ops.object.parent_set(type='ARMATURE_NAME')
# pesos por posição ao longo da coluna (o cálculo automático falha com a fenda da boca e rasgava o corpo): cada vértebra pesa como um
# "chapéu" centrado no seu meio, misturando com as vizinhas; peitorais pelo quanto o ponto sai do corpo; cabeça e mandíbula pela fenda
grupos = {b.name: pele.vertex_groups.get(b.name) or pele.vertex_groups.new(name=b.name) for b in ad.bones}
meios = [(f'coluna{i + 1}', (COLUNA[i] + COLUNA[i + 1]) / 2, (COLUNA[i] - COLUNA[i + 1])) for i in range(len(COLUNA) - 1)]
larg_x = lambda x: float(np.interp(x, [c[0] for c in CORPO], [c[2] for c in CORPO]))
for v in pele.data.vertices:
    c = v.co; w = {}
    for nome, m, L in meios:
        h = max(0.0, 1 - abs(c.x - m) / L)
        if h > 0: w[nome] = h
    kc = float(suave(3.40, 3.85, c.x))                                                     # a cabeça assume na frente das guelras
    tot = sum(w.values()) or 1.0; w = {k: x / tot * (1 - kc) for k, x in w.items()}
    if kc > 0: w['cabeca'] = kc
    if 2.2 < c.x < 3.7 and c.z < 0.10:                                                    # peitorais (janela com bordas suaves: sem vinco)
        kp = float(suave(larg_x(c.x) - 0.02, larg_x(c.x) + 0.14, abs(c.y))) * float(suave(2.2, 2.45, c.x) * suave(3.7, 3.45, c.x) * suave(0.10, -0.05, c.z))
        if kp > 0: w = {k: x * (1 - kp) for k, x in w.items()}; w['peitoral_' + ('l' if c.y > 0 else 'r')] = kp
    if c.x > 3.62:                                                                        # boca: abaixo da fenda manda a mandíbula
        zl = linha_boca(min(c.x, FRENTE_BOCA)) - FENDA_Z
        km = 0.0 if c.z > zl else float(suave(3.70, 3.90, c.x)) * (float(suave(zl + 0.002, zl - 0.03, c.z)) if c.x < 3.86 else 1.0)
        if km > 0: w = {k: x * (1 - km) for k, x in w.items()}; w['mandibula'] = km
    for k, x in w.items():
        if x > 1e-4: grupos[k].add([v.index], x, 'REPLACE')
# cabeça rígida na frente (o focinho não dobra); peças presas a ossos
def prender(o, nome_osso):
    mw = o.matrix_world.copy(); o.parent = arm; o.parent_type = 'BONE'; o.parent_bone = nome_osso
    bpy.context.view_layer.update(); o.matrix_world = mw
for d_ in dentes_inf: prender(d_, 'mandibula')
for d_ in dentes_sup + olhos: prender(d_, 'cabeca')
m_garg = material_simples('garganta', (0.11, 0.018, 0.022), rug=0.45, coat=0.3, sss=0.2)
def boca_interna():
    bm = bmesh.new(); cima, baixo = [], []
    xs = np.linspace(3.86, 4.24, 9); mx, mw = [m[0] for m in MAND], [m[2] for m in MAND]
    topo_mand = lambda x: float(np.interp(x, mx, [m[1] + m[3] for m in MAND]))
    for x in xs:
        w = float(np.interp(x, mx, mw))
        cima.append([bm.verts.new((x, s_ * w * 0.86, linha_boca(x) + 0.01)) for s_ in (1, -1)])
        baixo.append([bm.verts.new((x, s_ * w * 0.84, topo_mand(x) - 0.01)) for s_ in (1, -1)])
    for i in range(len(xs) - 1):
        for k in (0, 1): bm.faces.new((cima[i][k], cima[i + 1][k], baixo[i + 1][k], baixo[i][k]))     # bochechas por dentro
    bm.faces.new((cima[0][0], baixo[0][0], baixo[0][1], cima[0][1]))                                    # fundo da garganta
    me = bpy.data.meshes.new('boca_interna'); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new('boca_interna', me); cena.collection.objects.link(o)
    o.data.materials.append(m_garg); gC, gM = o.vertex_groups.new(name='cabeca'), o.vertex_groups.new(name='mandibula')
    for v in o.data.vertices: (gC if (v.index // 2) % 2 == 0 else gM).add([v.index], 1.0, 'REPLACE')
    sub = o.modifiers.new('sub', 'SUBSURF'); sub.levels = 2; sub.render_levels = 2
    o.parent = arm; md = o.modifiers.new('arm', 'ARMATURE'); md.object = arm
    for m_ in (o.modifiers['arm'], o.modifiers['sub']): pass
    bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_move_to_index(modifier='arm', index=0)
    bpy.ops.object.shade_smooth(); return o
boca = boca_interna()
print('RIG ok')

def posar(fase=0.0, amp=1.0, abre=0.0, vira=0.0):
    """nado: onda lateral que cresce para a cauda (nado tunniforme: a frente quase parada); abre em graus; vira = curva do corpo"""
    pb = arm.pose.bones
    for i in range(len(COLUNA) - 1):
        k = (i + 1) / (len(COLUNA) - 1)
        ang = amp * (0.02 + 0.30 * k ** 2.2) * math.sin(fase - 2.4 * k) + vira * 0.10
        pb[f'coluna{i + 1}'].rotation_mode = 'XYZ'; pb[f'coluna{i + 1}'].rotation_euler = (0, 0, ang)
    c_ = pb['cabeca']; c_.rotation_mode = 'QUATERNION'
    eixoY = (c_.bone.matrix_local.to_3x3().inverted() @ Vector((0, 1, 0))).normalized(); eixoZ = (c_.bone.matrix_local.to_3x3().inverted() @ Vector((0, 0, 1))).normalized()
    from mathutils import Quaternion as Q_
    c_.rotation_quaternion = Q_(eixoY, -math.radians(0.28 * abre)) @ Q_(eixoZ, -amp * 0.03 * math.sin(fase) - vira * 0.15)
    # a mandíbula abre girando em torno do eixo lateral (y do mundo), escrito no eixo próprio do osso
    m_ = pb['mandibula']; m_.rotation_mode = 'AXIS_ANGLE'
    eixo_local = (m_.bone.matrix_local.to_3x3().inverted() @ Vector((0, 1, 0))).normalized()
    m_.rotation_axis_angle = (math.radians(abre), *eixo_local)
    bpy.context.view_layer.update()

# ------------------------------------------------------------------------------------------------ prévias (debaixo d'água)
def mundo_agua():
    w = bpy.data.worlds.new('agua'); cena.world = w; w.use_nodes = True; nt = w.node_tree; Nn = nt.nodes; L = nt.links
    tc = Nn.new('ShaderNodeTexCoord'); sep = Nn.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Generated'], sep.inputs['Vector'])
    rampa = Nn.new('ShaderNodeValToRGB'); cr = rampa.color_ramp
    cr.elements[0].position = 0.30; cr.elements[0].color = (0.004, 0.030, 0.032, 1); cr.elements[1].position = 0.80; cr.elements[1].color = (0.10, 0.36, 0.34, 1)
    L.new(sep.outputs['Z'], rampa.inputs['Fac']); L.new(rampa.outputs['Color'], Nn['Background'].inputs['Color']); Nn['Background'].inputs['Strength'].default_value = 0.95
    sd = bpy.data.lights.new('sol', 'SUN'); sd.energy = 2.6; sd.color = (0.80, 0.95, 1.0); sd.angle = math.radians(6)
    so = bpy.data.objects.new('sol', sd); cena.collection.objects.link(so); so.rotation_euler = (math.radians(12), math.radians(-8), 0)
    # cáusticas: projetor de manchas de luz (padrão de ondas) vindo de cima
    sp = bpy.data.lights.new('causticas', 'SPOT'); sp.energy = 11000; sp.spot_size = math.radians(55); sp.color = (0.80, 1.0, 0.95); sp.use_nodes = True
    # duas redes de células DISTORCIDAS por ruído (a superfície ondulando): linhas de luz finas e irregulares, não uma grade de hexágonos
    ln = sp.node_tree; nc = ln.nodes.new('ShaderNodeTexCoord')
    rd = ln.nodes.new('ShaderNodeTexNoise'); rd.inputs['Scale'].default_value = 2.5; rd.inputs['Detail'].default_value = 3.0; ln.links.new(nc.outputs['Normal'], rd.inputs['Vector'])
    desl = ln.nodes.new('ShaderNodeVectorMath'); desl.operation = 'MULTIPLY_ADD'; desl.inputs[1].default_value = (0.45, 0.45, 0.45)
    ln.links.new(rd.outputs['Color'], desl.inputs[0]); ln.links.new(nc.outputs['Normal'], desl.inputs[2])
    em = ln.nodes['Emission']; saidas = []
    for esc_, larg_ in ((9.0, 0.035), (17.0, 0.025)):
        v = ln.nodes.new('ShaderNodeTexVoronoi'); v.feature = 'DISTANCE_TO_EDGE'; v.inputs['Scale'].default_value = esc_; ln.links.new(desl.outputs[0], v.inputs['Vector'])
        vr = ln.nodes.new('ShaderNodeMapRange'); vr.inputs['From Min'].default_value = 0.0; vr.inputs['From Max'].default_value = larg_; vr.inputs['To Min'].default_value = 1.18; vr.inputs['To Max'].default_value = 0.85
        ln.links.new(v.outputs['Distance'], vr.inputs['Value']); saidas.append(vr.outputs[0])
    mul = ln.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; ln.links.new(saidas[0], mul.inputs[0]); ln.links.new(saidas[1], mul.inputs[1])
    ln.links.new(mul.outputs[0], em.inputs['Strength'])
    spo = bpy.data.objects.new('causticas', sp); cena.collection.objects.link(spo); spo.location = (1.6, 1.5, 7.0); spo.rotation_euler = (math.radians(-12), math.radians(-8), 0)   # raios descendo em diagonal
    # água: volume azulado leve (profundidade e perda de contraste com a distância)
    bpy.ops.mesh.primitive_cube_add(size=60, location=(2.5, 0, 0)); cubo = bpy.context.object; cubo.name = 'agua'
    mv = bpy.data.materials.new('agua'); mv.use_nodes = True; nt2 = mv.node_tree; nt2.nodes.remove(nt2.nodes['Principled BSDF'])
    vol = nt2.nodes.new('ShaderNodeVolumePrincipled'); vol.inputs['Color'].default_value = (0.24, 0.56, 0.50, 1); vol.inputs['Density'].default_value = 0.030; vol.inputs['Anisotropy'].default_value = 0.6
    vol.inputs['Absorption Color'].default_value = (0.55, 0.88, 0.82, 1)
    nt2.links.new(vol.outputs['Volume'], nt2.nodes['Material Output'].inputs['Volume']); cubo.data.materials.append(mv)
    # partículas em suspensão (plâncton/sujeira) perto da câmera
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.004); grao = bpy.context.object; grao.name = 'grao'
    mg = material_simples('grao', (0.8, 0.9, 0.9), rug=0.6); grao.data.materials.append(mg)
    rng = np.random.default_rng(3)
    for i in range(500):
        g_ = grao.copy(); g_.location = (rng.uniform(-1, 7), rng.uniform(-6, 6), rng.uniform(-2.5, 2.5)); g_.scale = (1 + rng.random() * 1.5,) * 3; cena.collection.objects.link(g_)
    grao.hide_render = True

def render(nome, cam_pos, alvo, lente=45, larg=LARG, alt=None, dof=None):
    alt = alt or int(larg * 0.62)
    cd = bpy.data.cameras.new('cam_' + nome); cd.lens = lente; co = bpy.data.objects.new('cam_' + nome, cd); cena.collection.objects.link(co)
    co.location = cam_pos; d = Vector(alvo) - Vector(cam_pos); co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    if dof: cd.dof.use_dof = True; cd.dof.focus_distance = d.length; cd.dof.aperture_fstop = dof
    cena.camera = co; r = cena.render; r.engine = 'CYCLES'; r.resolution_x, r.resolution_y = larg, alt
    cena.cycles.samples = AMOSTRAS; cena.cycles.use_denoising = True; cena.cycles.device = 'CPU'
    cena.cycles.volume_step_rate = 4.0; cena.cycles.volume_max_steps = 256
    cena.view_settings.exposure = -0.35
    try: cena.view_settings.view_transform = 'AgX'; cena.view_settings.look = 'AgX - Medium High Contrast'
    except Exception: pass
    r.filepath = os.path.join(PREVIA, f'tubarao_{nome}.png'); bpy.ops.render.render(write_still=True); print('PREVIA', nome)

if PREVIA:
    os.makedirs(PREVIA, exist_ok=True); mundo_agua()
    if 'lado' in VISTAS:
        posar(fase=0.8, amp=0.6, abre=0); render('lado', (2.4, -6.6, 0.25), (2.3, 0, 0.05), lente=35, dof=None)
    if 'ataque' in VISTAS:
        posar(fase=1.6, amp=0.8, abre=ABRE or 32, vira=0.6); render('ataque', (6.6, -1.9, -0.35), (3.6, 0.1, -0.05), lente=40, dof=4.0)
    if 'foto' in VISTAS:
        posar(fase=2.3, amp=0.55, abre=2.5, vira=-0.3); render('foto', (3.55, 4.15, -1.05), (2.30, 0.0, -0.05), lente=26, larg=LARG, alt=int(LARG * 0.75))
    if 'boca' in VISTAS:
        posar(fase=1.6, amp=0.4, abre=ABRE or 32, vira=0.2); render('boca', (5.35, -1.15, -0.32), (4.05, 0.0, -0.16), lente=42, dof=2.8)
    if 'baixo' in VISTAS:
        posar(fase=0.3, amp=0.5, abre=0); render('baixo', (3.2, -2.6, -3.6), (2.2, 0, -0.1), lente=28)
    if 'topo' in VISTAS:
        posar(fase=0.0, amp=0.0, abre=0); render('topo', (2.25, 0, 7.5), (2.25, 0, 0), lente=35)
if BLEND: bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(BLEND))
print('PRONTO')
