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

def nadadeira(nome, bordo, fuga, span, comp, ponta=0.12, enflech=0.3, falc=0.25, esp=0.11, min_esp=0.03, n_sec=16, n_c=20, arredonda=0.35):
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
X_COM = 3.98                                                                     # canto da boca (a foto: fica por volta da metade da cabeça, bem antes das guelras)
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
    (3.95, 0.01, 0.335, 0.350, 0.290, 0.08, 0.10),   # cabeça funda: a mandíbula faz o fundo e o lábio de cima desce pela lateral até a linha da boca
    (4.10, 0.02, 0.265, 0.272, 0.250, 0.06, 0.12),
    (4.25, 0.03, 0.175, 0.185, 0.180, 0.05, 0.12),
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
nad.append(nadadeira('dorsal1', (2.94, 0, 0.36), (2.26, 0, 0.36), (-0.16, 0, 1), 0.68, ponta=0.10, enflech=0.30, falc=0.30, esp=0.10))     # alta e em pé
for s_, l in ((1, 'l'), (-1, 'r')):
    nad.append(nadadeira('peitoral_' + l, (3.36, 0.27 * s_, -0.22), (2.80, 0.25 * s_, -0.26), (-0.40, 0.62 * s_, -0.68), 1.08, ponta=0.10, enflech=0.28, falc=0.28, esp=0.12))   # grandes, caídas para baixo e para trás
    nad.append(nadadeira('pelvica_' + l, (1.86, 0.10 * s_, -0.22), (1.60, 0.08 * s_, -0.22), (-0.45, 0.55 * s_, -0.70), 0.32, ponta=0.18, enflech=0.35, falc=0.20, esp=0.10))
    nad.append(nadadeira('quilha_' + l, (1.10, 0.08 * s_, 0.0), (0.78, 0.07 * s_, 0.0), (-0.05, 1.0 * s_, 0.0), 0.05, ponta=0.6, enflech=0.0, falc=0.0, esp=0.18, arredonda=0.6))
nad.append(nadadeira('dorsal2', (1.13, 0, 0.08), (0.99, 0, 0.08), (-0.30, 0, 1), 0.12, ponta=0.25, enflech=0.4, falc=0.25))
nad.append(nadadeira('anal', (1.09, 0, -0.07), (0.97, 0, -0.07), (-0.30, 0, -1), 0.11, ponta=0.25, enflech=0.4, falc=0.25))
nad.append(nadadeira('caudal_sup', (0.95, 0, 0.03), (0.58, 0, 0.03), (-0.58, 0, 0.81), 1.00, ponta=0.12, enflech=0.22, falc=0.30, esp=0.10))      # lóbulos largos
nad.append(nadadeira('caudal_inf', (0.93, 0, -0.02), (0.60, 0, 0.0), (-0.52, 0, -0.85), 0.90, ponta=0.12, enflech=0.22, falc=0.30, esp=0.10))
pele = unir([corpo, mand] + nad, 'tubarao', voxel=0.0070)
print('CORPO faces', len(pele.data.polygons))

def raio(o, origem, direcao):
    inv = o.matrix_world.inverted(); ok, loc, nrm, _ = o.ray_cast(inv @ Vector(origem), (inv.to_3x3() @ Vector(direcao)).normalized())
    return (o.matrix_world @ loc, (o.matrix_world.to_3x3() @ nrm).normalized()) if ok else (None, None)
OLHOS = {s_: raio(pele, (4.20, 0.6 * s_, 0.05), (0, -s_, 0)) for s_ in (1, -1)}          # onde fica cada olho (medido antes de esculpir a órbita)

# ------------------------------------------------------------------------------------------------ escultura: fendas branquiais, sulco da boca, narinas, quilha
def esculpir(o, fn):
    me = o.data; V = np.array([v.co[:] for v in me.vertices]); N = np.array([v.normal[:] for v in me.vertices])
    d = fn(V, N); V2 = V + N * d[:, None]
    for i, v in enumerate(me.vertices): v.co = V2[i]
    me.update()
FENDAS = [(3.66, 0.37, 0.17), (3.60, 0.39, 0.18), (3.54, 0.40, 0.18), (3.48, 0.38, 0.17), (3.42, 0.30, 0.12)]   # (x no meio, altura, topo z)
def fendas(V, N):
    d = np.zeros(len(V)); lado = np.abs(V[:, 1]) > 0.18
    for xm, alt, topo in FENDAS:
        z0 = topo - alt; t = np.clip((V[:, 2] - z0) / alt, 0, 1); dentro = (V[:, 2] > z0 - 0.02) & (V[:, 2] < topo + 0.02)
        xl = xm + 0.034 * (0.5 - t) + 0.014 * np.sin(np.pi * t)                    # inclinada para trás em cima e convexa para a frente
        dx = V[:, 0] - xl; pont = np.sin(np.pi * t) ** 0.5
        sulco = -0.021 * np.exp(-((dx + 0.001) / 0.0042) ** 2) * pont              # fenda fina
        aba = 0.0065 * np.exp(-((dx - 0.012) / 0.0085) ** 2) * pont                # a aba da guelra da frente cobre a fenda de trás
        d += np.where(lado & dentro, sulco + aba, 0)
    return d
esculpir(pele, fendas)
def detalhes_cabeca(V, N):
    d = np.zeros(len(V))
    # narinas: duas fendas oblíquas embaixo do focinho
    for s_ in (1, -1):
        p = np.array([4.33, 0.085 * s_, -0.070]); q = V - p; u = q[:, 0] * 0.85 + q[:, 2] * 0.53; w_ = -q[:, 0] * 0.53 + q[:, 2] * 0.85
        d += -0.012 * np.exp(-(u / 0.022) ** 2 - (w_ / 0.006) ** 2 - (q[:, 1] / 0.04) ** 2)
    # sulco labial: dobra na comissura da boca
    for s_ in (1, -1):
        p = np.array([X_COM + 0.02, 0.31 * s_, linha_boca(X_COM + 0.02)]); q = V - p
        d += -0.010 * np.exp(-(q[:, 0] / 0.05) ** 2 - (q[:, 2] / 0.012) ** 2) * (np.abs(V[:, 1]) > 0.2)
    # órbita dos olhos: o olho fica afundado, com borda (pálpebra) e uma leve sobrancelha por cima
    for s_ in (1, -1):
        p = OLHOS[s_][0]
        if p is None: continue
        q = V - np.array(p[:]); r = np.linalg.norm(q, axis=1); lado_ = (np.sign(V[:, 1]) == s_)
        d += lado_ * (-0.008 * np.exp(-(r / 0.038) ** 2) + 0.0028 * np.exp(-((r - 0.056) / 0.014) ** 2))
        d += lado_ * 0.0040 * np.exp(-((q[:, 2] - 0.045) / 0.017) ** 2 - (q[:, 0] / 0.055) ** 2)
    # textura grossa da pele (ondulações musculares leves) e "poros" de Lorenzini no focinho
    d += 0.0016 * fbm3(V, 6.0, 3, sem=4)
    focinho = suave(4.05, 4.25, V[:, 0])
    d += -0.0007 * focinho * (ruido3(V, 90.0, sem=9) > 0.55)
    return d
esculpir(pele, detalhes_cabeca)

# fenda da boca: placa fina na linha da boca, da comissura (x 3,84) até passar da ponta, mais larga que a cabeça (corta os lábios dos lados
# e na frente); atrás de x 3,84 a pele continua inteira: são os cantos da boca, que esticam quando a mandíbula abre
FENDA_Z = 0.0045                                                                  # o meio da fenda fica 4,5 mm abaixo da linha da boca
def fenda_boca():
    xs = np.linspace(X_COM, FRENTE_BOCA + 0.16, 60); ys = np.linspace(-0.52, 0.52, 41); V, F = [], []
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
    piso = (V[:, 0] > X_COM - 0.01) & (np.abs(V[:, 2] - (zl - 0.0045)) < 0.0012)
    P = V[piso][:, :2]; P = P[P[:, 1] >= 0]
    ang = np.arctan2(P[:, 1], P[:, 0] - 3.80); r = np.hypot(P[:, 0] - 3.80, P[:, 1])
    bins = np.linspace(0, ang.max(), 70); pts = []
    for a0, a1 in zip(bins, bins[1:]):
        m_ = (ang >= a0) & (ang < a1)
        if m_.any(): k = np.argmax(r * m_ - (~m_) * 9); pts.append(P[k])
    pts = np.array(pts); pts = pts[pts[:, 0] > X_COM + 0.01]                               # até a comissura
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
    if np.dot(nrm, np.array([X_COM + 0.07, 0]) - p) < 0: nrm = -nrm
    q = p + nrm * dentro; return np.array([q[0], q[1] * s_]), np.array([-nrm[0], -nrm[1] * s_])
print('CONTORNO da boca', len(CONT), 'pontos, comprimento', round(float(CONT_S[-1]), 3))

# escultura da boca por dentro: a borda fica como crista (onde os dentes nascem), o meio afunda (assoalho e céu da boca), língua no fundo
me = pele.data; V = np.array([v.co[:] for v in me.vertices]); zl = np.array([linha_boca(min(x, FRENTE_BOCA)) - FENDA_Z for x in V[:, 0]])
piso = (V[:, 0] > X_COM - 0.01) & (np.abs(V[:, 2] - (zl - 0.0045)) < 0.0012); teto = (V[:, 0] > X_COM - 0.01) & (np.abs(V[:, 2] - (zl + 0.0045)) < 0.0012)
d = np.zeros(len(V)); sel = piso | teto; d[sel] = dist_contorno(V[sel][:, :2])
fundo = suave(0.020, 0.075, d) * (0.65 + 0.35 * suave(4.26, X_COM + 0.07, V[:, 0])) * suave(FRENTE_BOCA, FRENTE_BOCA - 0.09, V[:, 0])
lingua = 0.030 * np.exp(-((V[:, 0] - (X_COM + 0.10)) / 0.07) ** 2 - (V[:, 1] / 0.10) ** 2)
dz = np.where(piso, -0.070 * fundo + lingua * fundo, 0.0) + np.where(teto, 0.050 * fundo, 0.0)
# lábios: a pele de fora, logo abaixo e logo acima da fenda, recolhe ~1,5 cm (a crista de gengiva com os dentes fica saliente sobre o lábio;
# com a boca fechada as pontas dos dentes de baixo aparecem, como no tubarão-branco). Só a pele perto do contorno da boca.
fora_ = ~sel & (V[:, 0] > X_COM + 0.02) & (np.abs(V[:, 2] - zl) < 0.05)
dfc = np.full(len(V), 9.0); dfc[fora_] = dist_contorno(V[fora_][:, :2])
perto = fora_ & (dfc < 0.03)
abaixo = np.clip((zl - V[:, 2]), 0, None); acima = np.clip((V[:, 2] - zl), 0, None)
dz += np.where(perto & (V[:, 2] < zl), -0.006 * np.exp(-(abaixo / 0.014) ** 2), 0.0)
dz += np.where(perto & (V[:, 2] > zl), 0.005 * np.exp(-(acima / 0.012) ** 2), 0.0)
sel = sel | perto
for i in np.nonzero(sel)[0]: me.vertices[i].co.z += dz[i]
me.update()
dentro_ = piso | teto
DIST_BOCA = dict(zip(np.nonzero(dentro_)[0].tolist(), d[dentro_].tolist()))

# ------------------------------------------------------------------------------------------------ cor: contra-sombreamento com divisa rasgada, ventre branco, nadadeiras escuras, pontas pretas
def colorir(o):
    me = o.data; V = np.array([v.co[:] for v in me.vertices]); N = np.array([v.normal[:] for v in me.vertices])
    # divisa irregular como na foto: linha base + lobos grandes (cinza que desce, branco que sobe) + serrilhado fino
    base = -0.04 + 0.05 * np.tanh((V[:, 0] - 3.2) * 2) - 0.05 * suave(3.6, 4.2, V[:, 0])
    lobos = 0.095 * fbm3(V * np.array([1.0, 0.35, 0.35]), 1.8, 3, sem=11) + 0.042 * fbm3(V * np.array([1.0, 1.0, 1.6]), 6.5, 3, sem=12) + 0.020 * fbm3(V, 19.0, 2, sem=13)
    divisa = base + lobos
    dorso = suave(-0.022, 0.022, V[:, 2] - divisa)
    perto = np.exp(-((V[:, 2] - divisa) / 0.10) ** 2)                                                           # perto da divisa
    parche = suave(0.20, 0.40, fbm3(V * np.array([1.0, 1.0, 1.4]), 4.0, 3, sem=21)); lingua = suave(0.20, 0.40, fbm3(V * np.array([1.0, 1.0, 1.4]), 4.0, 3, sem=22))
    dorso = np.where(V[:, 2] > divisa, dorso * (1 - 0.7 * parche * perto), 1 - (1 - dorso) * (1 - 0.6 * lingua * perto))   # manchas brancas sobem, línguas cinza descem
    larg = np.interp(V[:, 0], [c[0] for c in CORPO], [c[2] for c in CORPO]); alto_x = np.interp(V[:, 0], [c[0] for c in CORPO], [c[1] + c[3] for c in CORPO])
    wpe = suave(larg, larg + 0.06, np.abs(V[:, 1])) * suave(0.05, -0.05, V[:, 2]) * suave(2.2, 2.5, V[:, 0]) * suave(3.7, 3.45, V[:, 0])    # peitorais (peso suave, sem corte serrilhado)
    dorso = dorso * (1 - wpe) + wpe * suave(-0.25, 0.25, N[:, 2])                                              # em cima cinza, embaixo branco
    dorso = np.where((V[:, 2] > alto_x + 0.025) & (np.abs(V[:, 1]) < 0.12), 1.0, dorso)                          # dorsais: cinza escuro
    dorso = np.where((V[:, 0] < 0.98) & ((np.abs(V[:, 2]) > 0.13) | (V[:, 0] < 0.78)), np.maximum(dorso, 0.93), dorso)   # cauda escura
    ponta = np.zeros(len(V))
    for s_ in (1, -1):                                                                                          # ponta preta embaixo da peitoral
        q = V - np.array([2.62, 0.27 * s_ + 0.84 * s_ * 0.95, -0.20 - 0.40 * 0.95]); ponta = np.maximum(ponta, suave(0.32, 0.12, np.linalg.norm(q, axis=1)) * (N[:, 2] < 0.2))
    ponta = np.maximum(ponta, suave(0.75, 0.68, V[:, 0]) * 0.55)                                                # bordo da cauda mais escuro
    for s_ in (1, -1):                                                                                          # mancha preta na axila
        q = V - np.array([2.98, 0.34 * s_, -0.30]); ponta = np.maximum(ponta, suave(0.10, 0.04, np.linalg.norm(q, axis=1)) * (N[:, 2] < 0.3))
    marcas = 0.30 + 0.70 * suave(2.6, 4.2, V[:, 0])                                                             # cicatrizes: mais na cabeça
    um = np.ones(len(V))
    for nome, arr in (('dorso', dorso), ('ponta', ponta), ('perto', perto), ('marcas', marcas)):
        at = me.color_attributes.new(nome, 'FLOAT_COLOR', 'POINT'); at.data.foreach_set('color', np.stack([arr, arr, arr, um], 1).ravel())
colorir(pele)

def material_pele():
    m = bpy.data.materials.new('pele_tubarao'); m.use_nodes = True; nt = m.node_tree; Nn = nt.nodes; L = nt.links; b = Nn['Principled BSDF']
    def no(tipo, **kw):
        n = Nn.new(tipo)
        for k, v in kw.items():
            if k.startswith('in_'):
                nm = k[3:].replace('_', ' '); n.inputs[int(nm) if nm.isdigit() else nm].default_value = v
            else: setattr(n, k, v)
        return n
    def lig(saida, entrada): L.new(saida, entrada)
    def mapa(valor, a0, a1, b0=0.0, b1=1.0):
        n = no('ShaderNodeMapRange', in_From_Min=a0, in_From_Max=a1, in_To_Min=b0, in_To_Max=b1); lig(valor, n.inputs['Value']); return n.outputs[0]
    def conta(op, a, b_):
        n = no('ShaderNodeMath', operation=op)
        for i, x in enumerate((a, b_)):
            if isinstance(x, (int, float)): n.inputs[i].default_value = x
            else: lig(x, n.inputs[i])
        return n.outputs[0]
    def mistura(fator, a, b_, tipo='MIX'):
        n = no('ShaderNodeMix', data_type='RGBA', blend_type=tipo)
        if isinstance(fator, (int, float)): n.inputs[0].default_value = fator
        else: lig(fator, n.inputs[0])
        lig(a, n.inputs[6])
        if isinstance(b_, tuple): n.inputs[7].default_value = b_
        else: lig(b_, n.inputs[7])
        return n.outputs[2]
    tc = no('ShaderNodeTexCoord'); obj = tc.outputs['Object']
    at = no('ShaderNodeAttribute', attribute_name='dorso'); ap = no('ShaderNodeAttribute', attribute_name='ponta')
    apr = no('ShaderNodeAttribute', attribute_name='perto'); am = no('ShaderNodeAttribute', attribute_name='marcas')
    dorso = at.outputs['Fac']
    # base: branco -> cinza -> cinza-marrom escuro, com manchas largas e um tom que vai do azulado ao bronze
    rampa = no('ShaderNodeValToRGB'); cr = rampa.color_ramp
    cr.elements[0].position = 0.0; cr.elements[0].color = (0.80, 0.81, 0.79, 1); cr.elements[1].position = 1.0; cr.elements[1].color = (0.038, 0.037, 0.034, 1)
    e = cr.elements.new(0.5); e.color = (0.15, 0.15, 0.14, 1)
    lig(dorso, rampa.inputs['Fac'])
    mancha = no('ShaderNodeTexNoise', in_Scale=2.6, in_Detail=6.0); lig(obj, mancha.inputs['Vector'])
    cor = mistura(1.0, rampa.outputs['Color'], mapa(mancha.outputs['Fac'], 0.35, 0.65, 0.78, 1.10), 'MULTIPLY')
    tom = no('ShaderNodeTexNoise', in_Scale=0.9, in_Detail=3.0); lig(obj, tom.inputs['Vector'])
    tomR = no('ShaderNodeValToRGB'); tomR.color_ramp.elements[0].color = (0.90, 0.98, 1.08, 1); tomR.color_ramp.elements[1].color = (1.22, 1.06, 0.86, 1); lig(tom.outputs['Fac'], tomR.inputs['Fac'])
    cor = mistura(conta('MULTIPLY', dorso, 0.75), cor, tomR.outputs['Color'], 'MULTIPLY')
    # riscos: linhas finas onde um ruído esticado cruza 0.5 (esticado em direções diferentes), só em manchas escolhidas por outro ruído
    def riscos(esc, rot, w, sel_esc, sel_a, sel_b, dist=0.0):
        mp = no('ShaderNodeMapping', in_Scale=esc, in_Rotation=rot); lig(obj, mp.inputs['Vector'])
        n = no('ShaderNodeTexNoise', in_Scale=3.0, in_Detail=0.0, in_Distortion=dist); lig(mp.outputs['Vector'], n.inputs['Vector'])
        lin = conta('MINIMUM', mapa(n.outputs['Fac'], 0.5 - w, 0.5), mapa(n.outputs['Fac'], 0.5, 0.5 + w, 1.0, 0.0))
        sel = no('ShaderNodeTexNoise', in_Scale=sel_esc, in_Detail=2.0); lig(obj, sel.inputs['Vector'])
        return conta('MULTIPLY', lin, mapa(sel.outputs['Fac'], sel_a, sel_b))
    r1 = riscos((1.2, 14.0, 14.0), (0.3, 0.0, 0.5), 0.010, 2.0, 0.55, 0.61)                  # compridos, ao longo do corpo
    r2 = riscos((10.0, 10.0, 1.6), (0.9, 0.2, 0.4), 0.012, 3.0, 0.57, 0.63, dist=0.7)         # curtos e tortos (cabeça)
    r3 = riscos((1.8, 13.0, 13.0), (0.0, 0.7, 1.2), 0.010, 2.4, 0.56, 0.62)                  # diagonais
    escuras = conta('MAXIMUM', conta('MULTIPLY', r1, 0.80), conta('MAXIMUM', conta('MULTIPLY', r2, am.outputs['Fac']), conta('MULTIPLY', r3, 0.70)))
    escuras = conta('MULTIPLY', escuras, conta('ADD', conta('MULTIPLY', dorso, 0.80), 0.20))                # no branco só 20% das marcas
    cor = mistura(escuras, cor, (0.018, 0.017, 0.017, 1.0))
    p1 = riscos((3.5, 20.0, 20.0), (0.5, 0.3, 0.2), 0.004, 1.8, 0.58, 0.66)                  # cicatrizes claras, só no dorso
    cor = mistura(conta('MULTIPLY', conta('MULTIPLY', p1, dorso), 0.5), cor, (0.46, 0.47, 0.47, 1.0))
    # sardas escuras perto da divisa
    sar = no('ShaderNodeTexVoronoi', in_Scale=26.0); lig(obj, sar.inputs['Vector'])
    sel2 = no('ShaderNodeTexNoise', in_Scale=5.0); lig(obj, sel2.inputs['Vector'])
    sardas = conta('MULTIPLY', conta('MULTIPLY', mapa(sar.outputs['Distance'], 0.10, 0.17, 1.0, 0.0), mapa(sel2.outputs['Fac'], 0.50, 0.58)), apr.outputs['Fac'])
    cor = mistura(conta('MULTIPLY', sardas, 0.8), cor, (0.020, 0.021, 0.024, 1.0))
    cor = mistura(ap.outputs['Fac'], cor, (0.012, 0.013, 0.015, 1.0))                        # pontas pretas
    # poros (ampolas de Lorenzini) no focinho
    cab = no('ShaderNodeSeparateXYZ'); lig(obj, cab.inputs['Vector'])
    por = no('ShaderNodeTexVoronoi', in_Scale=75.0); lig(obj, por.inputs['Vector'])
    poros = conta('MULTIPLY', mapa(por.outputs['Distance'], 0.09, 0.14, 1.0, 0.0), mapa(cab.outputs['X'], 4.05, 4.28))
    cor = mistura(conta('MULTIPLY', poros, 0.55), cor, (0.03, 0.03, 0.032, 1.0))
    lig(cor, b.inputs['Base Color'])
    # relevo: dentículos (lixa fina) + ondulações; as cicatrizes escuras viram sulcos
    den = no('ShaderNodeTexVoronoi', in_Scale=900.0); lig(obj, den.inputs['Vector'])
    ond = no('ShaderNodeTexNoise', in_Scale=14.0, in_Detail=4.0); lig(obj, ond.inputs['Vector'])
    alt = no('ShaderNodeMath', operation='MULTIPLY_ADD', in_1=0.25); lig(den.outputs['Distance'], alt.inputs[0]); lig(ond.outputs['Fac'], alt.inputs[2])
    bump = no('ShaderNodeBump', in_Strength=0.18, in_Distance=0.004); lig(conta('SUBTRACT', alt.outputs[0], conta('MULTIPLY', escuras, 0.5)), bump.inputs['Height']); lig(bump.outputs['Normal'], b.inputs['Normal'])
    lig(mapa(ond.outputs['Fac'], 0.0, 1.0, 0.42, 0.30), b.inputs['Roughness'])
    b.inputs['Specular IOR Level'].default_value = 0.5; b.inputs['Coat Weight'].default_value = 0.28; b.inputs['Coat Roughness'].default_value = 0.16
    gota = no('ShaderNodeTexNoise', in_Scale=60.0, in_Detail=2.0); lig(obj, gota.inputs['Vector'])
    bc = no('ShaderNodeBump', in_Strength=0.08, in_Distance=0.002); lig(gota.outputs['Fac'], bc.inputs['Height']); lig(bc.outputs['Normal'], b.inputs['Coat Normal'])
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
m_olho = material_simples('olho', (0.004, 0.004, 0.005), rug=0.02, coat=1.0)
olhos = []
for s_, l in ((1, 'l'), (-1, 'r')):
    p, n = raio(pele, (4.20, 0.6 * s_, 0.05), (0, -s_, 0))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.0245, location=p - n * 0.012); o = bpy.context.object; o.name = 'olho_' + l
    o.scale = (1.0, 0.8, 1.0); o.data.materials.append(m_olho); bpy.ops.object.shade_smooth(); olhos.append(o)

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
        n_ = (12, 11, 9)[fila]
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
    if c.x > X_COM - 0.22:                                                                # boca: abaixo da fenda manda a mandíbula
        zl = linha_boca(min(c.x, FRENTE_BOCA)) - FENDA_Z
        km = 0.0 if c.z > zl else float(suave(X_COM - 0.14, X_COM + 0.06, c.x)) * (float(suave(zl + 0.002, zl - 0.03, c.z)) if c.x < X_COM + 0.02 else 1.0)
        km *= float(suave(FRENTE_BOCA + 0.17, FRENTE_BOCA + 0.12, c.x))
        if km > 0: w = {k: x * (1 - km) for k, x in w.items()}; w['mandibula'] = km
    for k, x in w.items():
        if x > 1e-4: grupos[k].add([v.index], x, 'REPLACE')
# cabeça rígida na frente (o focinho não dobra); peças presas a ossos
def prender(o, nome_osso):
    mw = o.matrix_world.copy(); o.parent = arm; o.parent_type = 'BONE'; o.parent_bone = nome_osso
    bpy.context.view_layer.update(); o.matrix_world = mw
for d_ in dentes_inf: prender(d_, 'mandibula')
for d_ in dentes_sup + olhos: prender(d_, 'cabeca')
m_garg = material_simples('garganta', (0.035, 0.006, 0.008), rug=0.5, coat=0.2, sss=0.1)
def boca_interna():
    bm = bmesh.new(); cima, baixo = [], []
    xs = np.linspace(X_COM + 0.02, 4.24, 9); mx, mw = [m[0] for m in MAND], [m[2] for m in MAND]
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

# ------------------------------------------------------------------------------------------------ GLB para o Three.js
# uso: blender -b --python criar_tubarao.py -- --glb tubarao.glb [--res 4096] [--res_normal 2048] [--tris 140000] [--suavizar 10] [--texdir pasta]
# Pose de repouso (boca fechada, corpo reto), com o esqueleto e os pesos do rig acima: raiz, cabeca, coluna1-8, mandibula, peitoral_l/r.
# O glTF não leva os nós procedurais do material: a pele detalhada (voxel de 7 mm) é copiada, simplificada e desdobrada, e recebe a cor (inclui o
# interior da boca) e o relevo (guelras, órbita, lábios, ondulações) assados da detalhada. Dentes juntos por osso (dentes_sup na cabeça, dentes_inf
# na mandíbula), olhos presos à cabeça e interior da boca com os pesos cabeça/mandíbula (a membrana estica quando a boca abre).
if GLB:
    import tempfile
    RES, ALVO = int(arg('res', 4096)), float(arg('tris', 140000)); RES_N = int(arg('res_normal', 2048))                # cor em 4096 (~0,8 mm por texel), relevo em 2048 (quase liso)
    TEXD = arg('texdir') or tempfile.mkdtemp(prefix='tubarao_tex_')
    os.makedirs(TEXD, exist_ok=True)
    def ativo(o, *sel):
        for x in list(bpy.context.selected_objects): x.select_set(False)
        for x in sel: x.select_set(True)
        o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.context.view_layer.update()
    alta = pele
    # cópia leve: sem modificadores, sem atributos de cor (só servem à pele procedural), sem material; mantém os grupos de vértices (pesos dos ossos)
    baixa = alta.copy(); baixa.data = alta.data.copy(); baixa.name = 'tubarao_pele'; cena.collection.objects.link(baixa)
    for m_ in list(baixa.modifiers): baixa.modifiers.remove(m_)
    baixa.parent = None
    for nm_ in [a_.name for a_ in baixa.data.color_attributes]: baixa.data.color_attributes.remove(baixa.data.color_attributes[nm_])     # por nome: as referências antigas ficam inválidas a cada remoção
    baixa.data.materials.clear()
    tris0 = sum(len(p.vertices) - 2 for p in baixa.data.polygons)
    ativo(baixa); d_ = baixa.modifiers.new('dec', 'DECIMATE'); d_.ratio = min(1.0, ALVO / tris0); d_.use_collapse_triangulate = True; bpy.ops.object.modifier_apply(modifier=d_.name)
    bpy.ops.object.shade_smooth()
    tris1 = sum(len(p.vertices) - 2 for p in baixa.data.polygons); print('DECIMADO', tris0, '->', tris1, 'triângulos')
    # a simplificação deixa os vértices com ruído de ~0,1 mm que o brilho do verniz revela como faixas no corpo: suaviza a malha leve, menos onde há
    # relevo de verdade (guelras, lábios e fenda da boca, órbitas, narinas), que continua como está (o relevo fino volta pelo mapa normal)
    V0 = np.array([v.co[:] for v in baixa.data.vertices]); x0, y0, z0 = V0[:, 0], V0[:, 1], V0[:, 2]; prot = np.zeros(len(V0))
    for xm, alt_, topo_ in FENDAS:
        prot = np.maximum(prot, suave(xm - 0.08, xm - 0.04, x0) * suave(xm + 0.10, xm + 0.06, x0) * suave(topo_ - alt_ - 0.05, topo_ - alt_, z0) * suave(topo_ + 0.05, topo_, z0) * suave(0.12, 0.18, np.abs(y0)))
    zl_ = -0.215 + 0.36 * np.maximum(0.0, np.minimum(x0, FRENTE_BOCA) - 3.88) ** 1.25                          # linha da boca em cada vértice
    prot = np.maximum(prot, suave(3.70, 3.85, x0) * suave(zl_ + 0.10, zl_ + 0.05, z0) * suave(zl_ - 0.25, zl_ - 0.15, z0))
    for s_ in (1, -1):
        for c_, r_ in (((OLHOS[s_][0][:] if OLHOS[s_][0] is not None else (9, 9, 9)), 0.12), ((4.33, 0.085 * s_, -0.070), 0.09)):
            prot = np.maximum(prot, suave(r_, r_ * 0.6, np.linalg.norm(V0 - np.array(c_), axis=1)))
    vg_ = baixa.vertex_groups.new(name='suave')
    for i_, w_ in enumerate(1.0 - prot): vg_.add([i_], float(w_), 'REPLACE')
    sm_ = baixa.modifiers.new('suave', 'SMOOTH'); sm_.factor = 0.5; sm_.iterations = int(arg('suavizar', 10)); sm_.vertex_group = 'suave'; bpy.ops.object.modifier_apply(modifier=sm_.name)
    baixa.vertex_groups.remove(baixa.vertex_groups['suave']); print('SUAVIZADO; vértices protegidos', int((prot > 0.5).sum()), 'de', len(V0))        # por nome: a referência antiga fica inválida
    ativo(baixa); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=0.0002); bpy.ops.mesh.dissolve_degenerate(threshold=0.0005)               # tira vértices colados e faces degeneradas da simplificação
    bpy.ops.uv.smart_project(angle_limit=math.radians(72), margin_method='FRACTION', island_margin=0.002)
    bpy.ops.uv.select_all(action='SELECT'); bpy.ops.uv.pack_islands(rotate=True, rotate_method='ANY', margin_method='FRACTION', margin=0.002, shape_method='CONCAVE')       # ilhas grandes e diagonais: empacotar girando melhora o aproveitamento
    bpy.ops.object.mode_set(mode='OBJECT')
    # assa a cor e o relevo da detalhada para a leve (a cor aproveita os atributos e as coordenadas de objeto da detalhada)
    tmp = bpy.data.materials.new('_assar'); tmp.use_nodes = True; baixa.data.materials.append(tmp); imgs = {}
    cena.render.engine = 'CYCLES'; cena.cycles.samples = int(arg('amostras_assar', 24)); cena.cycles.device = 'CPU'; cena.cycles.use_denoising = False
    for tipo, sufixo, cor_ in (('DIFFUSE', 'cor', True), ('NORMAL', 'normal', False)):
        if tipo == 'NORMAL':                                                       # dentículos (voronoi de 0,9 mm) não cabem em textura de 2 mm: ficam só as ondulações e as cicatrizes
            for n_ in mp.node_tree.nodes:
                if n_.type == 'TEX_VORONOI' and abs(n_.inputs['Scale'].default_value - 900.0) < 1e-3:
                    for o_ in n_.outputs:
                        for l_ in list(o_.links): mp.node_tree.links.remove(l_)
        res_ = RES if cor_ else RES_N
        img = bpy.data.images.new(f'tubarao_{sufixo}', res_, res_, alpha=False)
        if not cor_: img.colorspace_settings.name = 'Non-Color'
        n = tmp.node_tree.nodes.new('ShaderNodeTexImage'); n.image = img; tmp.node_tree.nodes.active = n
        ativo(baixa, alta)
        bpy.ops.object.bake(type=tipo, pass_filter={'COLOR'} if tipo == 'DIFFUSE' else set(), use_selected_to_active=True, cage_extrusion=0.02, max_ray_distance=0.06, margin=12 * res_ // 2048, margin_type='ADJACENT_FACES', normal_space='TANGENT')           # (faces minúsculas não têm texel: a borda vem das faces vizinhas na malha, não do texel mais próximo no atlas)
        img.filepath_raw = os.path.join(TEXD, f'tubarao_{sufixo}.png'); img.file_format = 'PNG'; img.save(); imgs[sufixo] = img
        tmp.node_tree.nodes.remove(n); print('ASSADO', sufixo, img.filepath_raw)
    mg = bpy.data.materials.new('pele_tubarao_glb'); mg.use_nodes = True; nt_ = mg.node_tree; b_ = nt_.nodes['Principled BSDF']
    tc_ = nt_.nodes.new('ShaderNodeTexImage'); tc_.image = imgs['cor']; nt_.links.new(tc_.outputs['Color'], b_.inputs['Base Color'])
    tn_ = nt_.nodes.new('ShaderNodeTexImage'); tn_.image = imgs['normal']; nm_ = nt_.nodes.new('ShaderNodeNormalMap'); nt_.links.new(tn_.outputs['Color'], nm_.inputs['Color']); nt_.links.new(nm_.outputs['Normal'], b_.inputs['Normal'])
    b_.inputs['Roughness'].default_value = 0.46; b_.inputs['Specular IOR Level'].default_value = 0.5; b_.inputs['Coat Weight'].default_value = 0.10; b_.inputs['Coat Roughness'].default_value = 0.30     # pele úmida sem aspecto de plástico
    baixa.data.materials.clear(); baixa.data.materials.append(mg)
    bpy.data.objects.remove(alta, do_unlink=True)                                    # a detalhada não vai no arquivo
    baixa.parent = arm; ma_ = baixa.modifiers.new('arm', 'ARMATURE'); ma_.object = arm
    # dentes: um objeto por mandíbula (200+ peças viravam 200+ desenhos no Three.js)
    def juntar(lista, nome):
        for x in list(bpy.context.selected_objects): x.select_set(False)
        for o in lista: o.select_set(True)
        bpy.context.view_layer.objects.active = lista[0]; bpy.ops.object.join(); o = bpy.context.view_layer.objects.active; o.name = nome; o.data.name = nome; return o
    bpy.context.view_layer.update()
    d_cima, d_baixo = juntar(dentes_sup, 'dentes_sup'), juntar(dentes_inf, 'dentes_inf')
    # interior da boca: aplica a subdivisão (o glTF não leva modificadores) e volta o esqueleto
    ativo(boca); boca.modifiers.remove(boca.modifiers['arm']); bpy.ops.object.modifier_apply(modifier='sub')
    mb_ = boca.modifiers.new('arm', 'ARMATURE'); mb_.object = arm
    for x in bpy.context.view_layer.objects: x.select_set(False)
    arm.select_set(True)
    for o in arm.children_recursive: o.select_set(True)
    bpy.context.view_layer.objects.active = arm
    print('EXPORTA', sorted(o.name for o in arm.children_recursive), 'ossos', len(ad.bones))
    bpy.ops.export_scene.gltf(filepath=os.path.abspath(GLB), export_format='GLB', use_selection=True, export_image_format='JPEG', export_jpeg_quality=88, export_skins=True, export_animations=False)
    print('GLB', os.path.abspath(GLB), 'ossos', len(ad.bones), 'triângulos da pele', tris1, 'MB', round(os.path.getsize(GLB) / 1e6, 2))
    sys.exit(0)

# ------------------------------------------------------------------------------------------------ prévias (debaixo d'água)
def padrao_luz(sp, escalas, larguras, fundo, uniao=False):
    # projetor com padrão de linhas (rede de células distorcida por ruído): cada linha vira uma cortina de luz que desce na água
    sp.use_nodes = True; ln = sp.node_tree; nc = ln.nodes.new('ShaderNodeTexCoord')
    rd = ln.nodes.new('ShaderNodeTexNoise'); rd.inputs['Scale'].default_value = 2.5; rd.inputs['Detail'].default_value = 3.0; ln.links.new(nc.outputs['Normal'], rd.inputs['Vector'])
    desl = ln.nodes.new('ShaderNodeVectorMath'); desl.operation = 'MULTIPLY_ADD'; desl.inputs[1].default_value = (0.45, 0.45, 0.45)
    ln.links.new(rd.outputs['Color'], desl.inputs[0]); ln.links.new(nc.outputs['Normal'], desl.inputs[2])
    em = ln.nodes['Emission']; saidas = []
    for esc_, larg_ in zip(escalas, larguras):
        v = ln.nodes.new('ShaderNodeTexVoronoi'); v.feature = 'DISTANCE_TO_EDGE'; v.inputs['Scale'].default_value = esc_; ln.links.new(desl.outputs[0], v.inputs['Vector'])
        vr = ln.nodes.new('ShaderNodeMapRange'); vr.inputs['From Min'].default_value = 0.0; vr.inputs['From Max'].default_value = larg_; vr.inputs['To Min'].default_value = 1.0; vr.inputs['To Max'].default_value = fundo
        ln.links.new(v.outputs['Distance'], vr.inputs['Value']); saidas.append(vr.outputs[0])
    mul = ln.nodes.new('ShaderNodeMath'); mul.operation = 'MAXIMUM' if uniao else 'MULTIPLY'; ln.links.new(saidas[0], mul.inputs[0]); ln.links.new(saidas[1], mul.inputs[1])
    ln.links.new(mul.outputs[0], em.inputs['Strength'])

RAIOS_W = float(arg('raios', 150000))
def mundo_agua():
    w = bpy.data.worlds.new('agua'); cena.world = w; w.use_nodes = True; nt = w.node_tree; Nn = nt.nodes; L = nt.links
    tc = Nn.new('ShaderNodeTexCoord'); sep = Nn.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Generated'], sep.inputs['Vector'])
    rampa = Nn.new('ShaderNodeValToRGB'); cr = rampa.color_ramp
    cr.elements[0].position = 0.30; cr.elements[0].color = (0.004, 0.030, 0.032, 1); cr.elements[1].position = 0.80; cr.elements[1].color = (0.10, 0.36, 0.34, 1)
    L.new(sep.outputs['Z'], rampa.inputs['Fac']); L.new(rampa.outputs['Color'], Nn['Background'].inputs['Color']); Nn['Background'].inputs['Strength'].default_value = 0.62
    sd = bpy.data.lights.new('sol', 'SUN'); sd.energy = 1.8; sd.color = (0.80, 0.95, 1.0); sd.angle = math.radians(6)
    so = bpy.data.objects.new('sol', sd); cena.collection.objects.link(so); so.rotation_euler = (math.radians(12), math.radians(-8), 0)
    # cáusticas sobre o tubarão: manchas de luz moderadas (como as da foto no dorso)
    sp = bpy.data.lights.new('causticas', 'SPOT'); sp.energy = 4500; sp.spot_size = math.radians(55); sp.color = (0.80, 1.0, 0.95)
    padrao_luz(sp, (9.0, 17.0), (0.035, 0.025), 0.85)
    spo = bpy.data.objects.new('causticas', sp); cena.collection.objects.link(spo); spo.location = (1.6, 1.5, 7.0); spo.rotation_euler = (math.radians(-12), math.radians(-8), 0)
    # segundo projetor de manchas, de outro ângulo: as duas redes se cruzam e quebram as faixas paralelas (como a luz na superfície do mar)
    sp2 = bpy.data.lights.new('causticas2', 'SPOT'); sp2.energy = 4000; sp2.spot_size = math.radians(55); sp2.color = (0.80, 1.0, 0.95)
    padrao_luz(sp2, (6.0, 12.0), (0.040, 0.030), 0.85)
    spo2 = bpy.data.objects.new('causticas2', sp2); cena.collection.objects.link(spo2); spo2.location = (4.6, -2.2, 6.5); spo2.rotation_euler = (math.radians(16), math.radians(24), math.radians(35))
    # água: volume verde-azulado (profundidade e perda de contraste com a distância)
    bpy.ops.mesh.primitive_cube_add(size=60, location=(2.5, 0, 0)); cubo = bpy.context.object; cubo.name = 'agua'
    mv = bpy.data.materials.new('agua'); mv.use_nodes = True; nt2 = mv.node_tree; nt2.nodes.remove(nt2.nodes['Principled BSDF'])
    vol = nt2.nodes.new('ShaderNodeVolumePrincipled'); vol.inputs['Color'].default_value = (0.24, 0.56, 0.50, 1); vol.inputs['Density'].default_value = 0.030; vol.inputs['Anisotropy'].default_value = 0.6
    vol.inputs['Absorption Color'].default_value = (0.55, 0.88, 0.82, 1)
    nt2.links.new(vol.outputs['Volume'], nt2.nodes['Material Output'].inputs['Volume']); cubo.data.materials.append(mv)
    # raios de sol: outro projetor, bem forte, de cima, que só ilumina o volume da água (light linking): aparecem as cortinas de luz
    # na água sem estourar a pele do tubarão (que continua com a luz do sol e das cáusticas)
    sr = bpy.data.lights.new('raios', 'SPOT'); sr.energy = RAIOS_W; sr.spot_size = math.radians(54); sr.spot_blend = 0.8; sr.color = (0.85, 1.0, 0.92); sr.shadow_soft_size = 0.2
    padrao_luz(sr, (3.2, 7.5), (0.085, 0.060), 0.0, uniao=True)
    globals()['RAIOS_LUZ'] = sr
    sro = bpy.data.objects.new('raios', sr); cena.collection.objects.link(sro); sro.location = (2.2, 1.0, 9.0); sro.rotation_euler = (math.radians(-8), math.radians(-6), 0)
    col_a = bpy.data.collections.new('so_agua'); cena.collection.children.link(col_a); col_a.objects.link(cubo)
    try: sro.light_linking.receiver_collection = col_a; print('LIGHT LINKING ok: os raios só iluminam a água')
    except Exception as e_: print('AVISO: light linking indisponível:', e_)
    # partículas em suspensão (neve marinha): pequenas e de tamanhos variados (esferas suaves, não poliedros)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.0035); grao = bpy.context.object; grao.name = 'grao'
    mg = material_simples('grao', (0.8, 0.9, 0.9), rug=0.6); grao.data.materials.append(mg)
    rng = np.random.default_rng(3)
    CAMS_PREVIAS = [(3.55, 4.15, -1.05), (5.35, -2.05, 0.30), (3.05, -3.1, 0.15), (6.6, -1.9, -0.35), (5.35, -1.15, -0.32), (2.4, -6.6, 0.25), (3.2, -2.6, -3.6), (2.25, 0, 7.5)]
    n_ok = 0
    while n_ok < 900:
        pos_ = (rng.uniform(-1, 7), rng.uniform(-6, 6), rng.uniform(-2.8, 3.5))
        if min(math.dist(pos_, c_) for c_ in CAMS_PREVIAS) < 1.3: continue
        g_ = grao.copy(); g_.location = pos_; k_ = 0.6 + rng.lognormal(-0.3, 0.35); g_.scale = (k_,) * 3; cena.collection.objects.link(g_); n_ok += 1
    grao.hide_render = True

def render(nome, cam_pos, alvo, lente=45, larg=LARG, alt=None, dof=None, fill=None):
    alt = alt or int(larg * 0.62)
    cd = bpy.data.cameras.new('cam_' + nome); cd.lens = lente; co = bpy.data.objects.new('cam_' + nome, cd); cena.collection.objects.link(co)
    co.location = cam_pos; d = Vector(alvo) - Vector(cam_pos); co.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    if dof: cd.dof.use_dof = True; cd.dof.focus_distance = d.length; cd.dof.aperture_fstop = dof
    cena.camera = co; r = cena.render; r.engine = 'CYCLES'; r.resolution_x, r.resolution_y = larg, alt
    cena.cycles.samples = AMOSTRAS; cena.cycles.use_denoising = True; cena.cycles.device = 'CPU'
    cena.cycles.volume_step_rate = 4.0; cena.cycles.volume_max_steps = 256
    cena.view_settings.exposure = -0.45
    try: cena.view_settings.view_transform = 'AgX'; cena.view_settings.look = 'AgX - Medium High Contrast'
    except Exception: pass
    luzes = []
    for pos, watts, raio_ in (fill or []):
        ld = bpy.data.lights.new('apoio_' + nome, 'POINT'); ld.energy = watts; ld.shadow_soft_size = raio_; ld.color = (1.0, 0.93, 0.86)
        lo = bpy.data.objects.new('apoio_' + nome, ld); cena.collection.objects.link(lo); lo.location = pos; luzes.append(lo)
    r.filepath = os.path.join(PREVIA, f'tubarao_{nome}.png'); bpy.ops.render.render(write_still=True); print('PREVIA', nome)
    for lo in luzes: bpy.data.objects.remove(lo, do_unlink=True)

if PREVIA:
    os.makedirs(PREVIA, exist_ok=True); mundo_agua()
    if 'lado' in VISTAS:
        posar(fase=0.8, amp=0.6, abre=0); render('lado', (2.4, -6.6, 0.25), (2.3, 0, 0.05), lente=35, dof=None)
    if 'ataque' in VISTAS:
        posar(fase=1.6, amp=0.8, abre=ABRE or 32, vira=0.6); render('ataque', (6.6, -1.9, -0.35), (3.6, 0.1, -0.05), lente=40, dof=4.0)
    if 'foto' in VISTAS:
        posar(fase=2.3, amp=0.55, abre=2.5, vira=-0.3); render('foto', (3.55, 4.15, -1.05), (2.30, 0.0, -0.05), lente=26, larg=LARG, alt=int(LARG * 0.75))
    if 'raios' in VISTAS:                                                         # teste de intensidade dos raios: mesma vista da foto, várias potências
        for w_ in [float(x) for x in arg('raios_lista', '120000,240000,480000').split(',')]:
            RAIOS_LUZ.energy = w_; posar(fase=2.3, amp=0.55, abre=2.5, vira=-0.3)
            render(f'raios_{int(w_ / 1000)}k', (3.55, 4.15, -1.05), (2.30, 0.0, -0.05), lente=26, larg=LARG, alt=int(LARG * 0.75))
    if 'nado' in VISTAS:                                                         # 4 fases da onda do corpo, vista de cima (para ver o movimento do nado)
        for k_, fase_ in enumerate((0.0, 1.57, 3.14, 4.71)):
            posar(fase=fase_, amp=1.0, abre=0); render(f'nado_{k_}', (2.3, -1.5, 6.6), (2.3, 0.0, 0.0), lente=30, larg=int(LARG * 0.6), alt=int(LARG * 0.4))
    if 'cabeca' in VISTAS:
        posar(fase=1.2, amp=0.3, abre=3, vira=0.1); render('cabeca', (5.35, -2.05, 0.30), (3.95, 0.0, 0.0), lente=48, larg=LARG, alt=int(LARG * 0.75))
    if 'flanco' in VISTAS:
        posar(fase=0.8, amp=0.3, abre=0); render('flanco', (3.05, -3.1, 0.15), (3.05, 0.0, 0.0), lente=45, larg=LARG, alt=int(LARG * 0.75))
    if 'boca' in VISTAS:
        posar(fase=1.6, amp=0.4, abre=ABRE or 32, vira=0.2); render('boca', (5.35, -1.15, -0.32), (4.05, 0.0, -0.16), lente=42, dof=2.8, fill=[((4.95, -0.55, -0.10), 9, 0.12)])
    if 'baixo' in VISTAS:
        posar(fase=0.3, amp=0.5, abre=0); render('baixo', (3.2, -2.6, -3.6), (2.2, 0, -0.1), lente=28)
    if 'topo' in VISTAS:
        posar(fase=0.0, amp=0.0, abre=0); render('topo', (2.25, 0, 7.5), (2.25, 0, 0), lente=35)
if BLEND: bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(BLEND))
print('PRONTO')
