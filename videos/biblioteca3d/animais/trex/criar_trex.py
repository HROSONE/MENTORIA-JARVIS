# TIRANOSSAURO REX realista para a biblioteca do canal, modelado no Blender a partir das medidas de um esqueleto real (FMNH PR 2081, "Sue"):
# ~12,3 m de comprimento, topo do quadril a ~4 m, crânio ~1,4 m, fêmur ~1,32 m, tíbia ~1,15 m, metatarso ~0,67 m, úmero ~0,39 m.
# Aparência segundo a pesquisa atual: lábios cobrindo os dentes com a boca fechada (Cullen et al., Science 2023; ainda debatido) e pele de
# escamas pequenas (Bell et al., Biology Letters 2017), sem penas no adulto.
#
# A forma é feita por seções transversais (como as cavernas de um barco) ao longo de linhas-guia: corpo da ponta da cauda ao pescoço,
# crânio, mandíbula (separada, para abrir a boca), pernas e braços. Depois o corpo vira uma pele única (remesh) e recebe material.
# Unidades: metros. Construído olhando para +X, com Z para cima; no fim gira para olhar para -Y (frente do Blender = +Z no glTF).
#
# uso: blender -b --python criar_trex.py -- --saida trex.glb [--previa previa.png] [--etapa forma]
import bpy, bmesh, math, sys, os
import numpy as np
from mathutils import Vector

A = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(n, d=None): return A[A.index('--' + n) + 1] if '--' + n in A else d
SAIDA, PREVIA, ETAPA, HDRI, HUMANO, CAMS, CHAO = arg('saida'), arg('previa'), arg('etapa', 'tudo'), arg('hdri'), arg('humano'), arg('cams'), arg('chao')
AMOSTRAS = int(arg('amostras', 32)); LARG = int(arg('larg', 1000))

bpy.ops.wm.read_factory_settings(use_empty=True)
cena = bpy.context.scene

# ------------------------------------------------------------------------------------------------ ferramentas
def catmull(P, n_por_seg=6):
    """reamostra uma lista de vetores (estações) com Catmull-Rom: transições suaves entre as seções"""
    P = [np.array(p, float) for p in P]; out = []
    for i in range(len(P) - 1):
        p0, p1, p2, p3 = P[max(i - 1, 0)], P[i], P[i + 1], P[min(i + 2, len(P) - 1)]
        for k in range(n_por_seg):
            t = k / n_por_seg
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-1]); return np.array(out)

def loft(nome, estacoes, N=40, expo=2.2, ref=(0, 0, 1), fechar=True, n_por_seg=6):
    """estacoes: [cx, cy, cz, meia_largura, alto, baixo, (afina_cima), (afina_baixo)] ao longo de uma linha; anel em superelipse (expo 2 = elipse, maior = mais quadrado)"""
    E = catmull(estacoes, n_por_seg); C = E[:, :3]
    bm = bmesh.new(); aneis = []
    for i, e in enumerate(E):
        t = C[min(i + 1, len(C) - 1)] - C[max(i - 1, 0)]; t /= np.linalg.norm(t) + 1e-9
        lado = np.cross(t, ref); lado /= np.linalg.norm(lado) + 1e-9; cima = np.cross(lado, t)
        w, hT, hB = e[3], e[4], e[5]; afT = e[6] if len(e) > 6 else 0.0; afB = e[7] if len(e) > 7 else 0.0; anel = []
        for j in range(N):
            th = 2 * math.pi * j / N; c, s = math.cos(th), math.sin(th)
            y = w * math.copysign(abs(c) ** (2 / expo), c); z = (hT if s > 0 else hB) * math.copysign(abs(s) ** (2 / expo), s)
            y *= 1 - (afT * s if s > 0 else -afB * s)                              # afina em cima (quilha do dorso, crista do focinho) e embaixo
            anel.append(bm.verts.new(C[i] + lado * y + cima * z))
        aneis.append(anel)
    for a, b in zip(aneis, aneis[1:]):
        for j in range(N): bm.faces.new((a[j], a[(j + 1) % N], b[(j + 1) % N], b[j]))
    if fechar:
        for anel, c, inv in ((aneis[0], C[0], True), (aneis[-1], C[-1], False)):
            v0 = bm.verts.new(c)
            for j in range(N):
                f = (v0, anel[(j + 1) % N], anel[j]) if inv else (v0, anel[j], anel[(j + 1) % N])
                bm.faces.new(f)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(nome, me); cena.collection.objects.link(ob); return ob

def membro(nome, juntas, raios, N=24, ref=(1, 0, 0)):
    """membro ao longo de uma cadeia de juntas: raios = [(meia_largura_lateral, frente, trás)] por junta (músculo maior atrás, como na coxa)"""
    est = [[*j, r[0], r[1], r[2]] for j, r in zip(juntas, raios)]
    return loft(nome, est, N=N, expo=2.0, ref=ref, n_por_seg=8)

def esfera(nome, c, r, esc=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=r, location=c); o = bpy.context.object; o.name = nome; o.scale = esc
    bpy.ops.object.transform_apply(scale=True); return o

# ------------------------------------------------------------------------------------------------ corpo: ponta da cauda -> pescoço (entra no crânio)
# [x, y, z centro, meia largura, altura acima, altura abaixo]; x = 0 no quadril, frente em +X
# perfil lateral medido na reconstrução científica de referência (ref/r01: topo e base da silhueta a cada coluna, em metros,
# com a altura do quadril levada à postura de pé); tronco mais fundo, pelas medidas da Sue
CORPO = [
    [-6.50, 0, 2.155, 0.035, 0.035, 0.035, 0.5, 0.25], [-6.01, 0, 2.51, 0.08, 0.09, 0.10, 0.5, 0.25], [-5.53, 0, 2.80, 0.12, 0.14, 0.15, 0.5, 0.25],
    [-5.04, 0, 2.97, 0.15, 0.16, 0.18, 0.5, 0.25], [-4.55, 0, 3.10, 0.18, 0.19, 0.22, 0.5, 0.25], [-4.06, 0, 3.17, 0.22, 0.23, 0.26, 0.5, 0.25],
    [-3.58, 0, 3.17, 0.26, 0.26, 0.30, 0.5, 0.25], [-3.09, 0, 3.14, 0.31, 0.30, 0.35, 0.5, 0.25], [-2.60, 0, 3.11, 0.37, 0.34, 0.40, 0.48, 0.25],
    [-2.11, 0, 3.10, 0.45, 0.40, 0.47, 0.46, 0.24], [-1.62, 0, 3.12, 0.53, 0.46, 0.54, 0.44, 0.22], [-1.14, 0, 3.17, 0.59, 0.50, 0.62, 0.42, 0.22],
    [-0.65, 0, 3.26, 0.64, 0.49, 0.72, 0.40, 0.22], [-0.16, 0, 3.28, 0.68, 0.56, 0.88, 0.38, 0.22], [0.33, 0, 3.28, 0.72, 0.66, 0.98, 0.36, 0.22],
    [0.81, 0, 3.28, 0.76, 0.70, 1.08, 0.36, 0.22], [1.40, 0, 3.24, 0.78, 0.69, 1.10, 0.36, 0.22], [2.00, 0, 3.20, 0.74, 0.66, 1.04, 0.34, 0.20],
    [2.47, 0, 3.12, 0.64, 0.69, 0.88, 0.32, 0.16], [2.86, 0, 3.04, 0.56, 0.71, 0.70, 0.30, 0.12], [3.05, 0, 3.11, 0.50, 0.67, 0.65, 0.30, 0.10],
    [3.25, 0, 3.33, 0.46, 0.58, 0.58, 0.30, 0.10], [3.44, 0, 3.44, 0.43, 0.60, 0.58, 0.30, 0.10], [3.64, 0, 3.46, 0.41, 0.56, 0.52, 0.30, 0.10],
    [3.85, 0, 3.44, 0.38, 0.46, 0.46, 0.30, 0.10],
]
corpo = loft('corpo', CORPO, N=56, expo=2.3)

# crânio (maxila) e mandíbula, também medidos na referência: a boca vai da ponta (z 3,07) ao canto sob o olho (z 3,30)
def linha_boca(x): return 3.30 - 0.22 * (x - 4.45) if x > 4.45 else 3.30 + 0.05 * (4.45 - x)
CRANIO = [[x, 0, linha_boca(x), w, topo - linha_boca(x), 0.085, 0.28 + 0.30 * min(1, max(0, (x - 4.2) / 0.8)), 0.0] for x, w, topo in [
    (3.45, 0.40, 4.06), (3.62, 0.42, 4.12), (3.80, 0.45, 4.17), (4.00, 0.50, 4.20), (4.20, 0.48, 4.15), (4.45, 0.37, 3.95), (4.70, 0.27, 3.81), (5.00, 0.21, 3.64),
    (5.20, 0.18, 3.55), (5.35, 0.155, 3.45), (5.45, 0.12, 3.33), (5.52, 0.05, 3.20)]]
cranio = loft('cranio', CRANIO, N=48, expo=3.1)                       # crânio de T. rex é 'caixa': laterais quase retas
MAND = [[x, 0, linha_boca(x) - 0.01, w * 0.93, 0.05, linha_boca(x) - base, 0.0, 0.32] for x, w, base in [        # um pouco mais estreita: o lábio de cima a cobre
    (3.95, 0.36, 3.00), (4.12, 0.42, 2.96), (4.40, 0.37, 2.93), (4.80, 0.26, 2.88), (5.15, 0.20, 2.85),
    (5.35, 0.16, 2.88), (5.47, 0.11, 2.97), (5.51, 0.05, 3.02)]]
mandibula = loft('mandibula', MAND, N=44, expo=3.0)

# pernas (de pé, joelho à frente, tornozelo atrás, metatarso para a frente) e dedos
def perna(lado):
    s = 1 if lado == 'l' else -1
    quadril, joelho, tornozelo, pe = (0.0, 0.55 * s, 3.00), (0.52, 0.64 * s, 1.83), (0.05, 0.57 * s, 0.77), (0.44, 0.53 * s, 0.20)
    coxa = membro('perna_' + lado, [(-0.15, 0.42 * s, 3.55), quadril, (0.26, 0.63 * s, 2.40), joelho, (0.36, 0.62 * s, 1.42), tornozelo, (0.25, 0.55 * s, 0.48), pe],
                  [(0.48, 0.62, 0.85), (0.53, 0.70, 0.92), (0.46, 0.62, 0.76), (0.26, 0.29, 0.30), (0.22, 0.19, 0.33), (0.13, 0.11, 0.15), (0.12, 0.11, 0.11), (0.16, 0.13, 0.13)])
    dedos = []
    for k, (ang, comp) in enumerate([(0.32, 0.58), (0.0, 0.68), (-0.30, 0.56)]):        # três dedos para a frente, abertos
        d0 = np.array(pe) + np.array([0.04, 0.0, -0.06]); d = np.array([math.cos(ang), math.sin(ang) * s, 0.0])
        pts = [d0, d0 + d * comp * 0.45 + [0, 0, -0.07], d0 + d * comp + [0, 0, -0.12]]
        dedos.append(membro(f'dedo{k}_{lado}', [tuple(p) for p in pts], [(0.11, 0.10, 0.09), (0.09, 0.08, 0.07), (0.035, 0.03, 0.025)], N=16, ref=(0, 0, 1)))
    garra = membro('esporao_' + lado, [tuple(np.array(tornozelo) + [-0.02, 0.0, -0.45]), tuple(np.array(tornozelo) + [-0.10, 0, -0.62])], [(0.04, 0.04, 0.04), (0.02, 0.02, 0.02)], N=12)
    return [coxa, garra] + dedos

def braco(lado):
    s = 1 if lado == 'l' else -1
    ombro, cotovelo, pulso = (2.50, 0.50 * s, 2.72), (2.66, 0.58 * s, 2.36), (2.86, 0.56 * s, 2.28)
    b = membro('braco_' + lado, [(2.40, 0.36 * s, 2.95), ombro, cotovelo, pulso], [(0.16, 0.16, 0.18), (0.13, 0.13, 0.15), (0.08, 0.08, 0.09), (0.06, 0.055, 0.055)], N=18)
    dedos = [membro(f'mao{k}_{lado}', [pulso, tuple(np.array(pulso) + [0.10, dy * s, -0.06]), tuple(np.array(pulso) + [0.15, dy * s * 1.3, -0.13])], [(0.035, 0.03, 0.03), (0.025, 0.022, 0.022), (0.01, 0.01, 0.01)], N=12)
             for k, dy in enumerate([0.025, -0.025])]
    return [b] + dedos

def superficie_lado(ob, x, z, s_):
    """y da pele do crânio no ponto (x, z), lançando um raio de fora para dentro pelo lado s_"""
    ok, loc, nrm, _ = ob.ray_cast(Vector((x, 2.0 * s_, z)), Vector((0, -s_, 0)))
    return loc.y if ok else None
def superficie_cima(ob, x, y):
    ok, loc, nrm, _ = ob.ray_cast(Vector((x, y, 6.0)), Vector((0, 0, -1)))
    return loc.z if ok else None
OLHO = (4.40, 3.80)                                                    # x, z do olho (medido na referência: acima do canto da boca)
relevos, POS_OLHO = [], {}
for l, s_ in (('l', 1), ('r', -1)):
    yo = superficie_lado(cranio, OLHO[0], OLHO[1], s_)
    POS_OLHO[l] = Vector((OLHO[0], yo - 0.028 * s_, OLHO[1]))
    relevos.append(esfera('bochecha_' + l, (4.05, superficie_lado(cranio, 4.05, 3.60, s_) - 0.10 * s_, 3.60), 0.22, esc=(1.3, 0.75, 1.0)))   # músculo adutor
    zl = superficie_cima(cranio, 4.56, 0.17 * s_)
    relevos.append(esfera('lacrimal_' + l, (4.56, 0.17 * s_, zl - 0.02), 0.10, esc=(1.5, 0.8, 0.55)))                           # 'chifre' na frente do olho
    zp = superficie_cima(cranio, 4.27, 0.27 * s_)
    relevos.append(esfera('posorbital_' + l, (4.27, 0.27 * s_, zp - 0.03), 0.09, esc=(1.1, 0.9, 0.7)))                          # bossa acima e atrás do olho
    ys = superficie_lado(cranio, 4.40, 3.87, s_)
    relevos.append(esfera('sobrolho_' + l, (4.43, ys - 0.012 * s_, 3.858), 0.088, esc=(1.8, 0.85, 0.46)))      # cai sobre o olho: olhar de raiva                        # sobrancelha óssea
    relevos.append(esfera('palpsup_' + l, (4.40, yo - 0.002 * s_, OLHO[1] + 0.020), 0.052, esc=(1.3, 0.6, 0.42)))            # pálpebra de cima
    relevos.append(esfera('palpinf_' + l, (4.40, yo - 0.008 * s_, OLHO[1] - 0.030), 0.050, esc=(1.25, 0.55, 0.35)))            # pálpebra de baixo
relevos.append(esfera('garganta', (3.72, 0.0, 3.02), 0.30, esc=(1.55, 1.15, 0.62)))
for l, s_ in (('l', 1), ('r', -1)):
    relevos.append(esfera('canto_boca_' + l, (4.00, 0.27 * s_, 3.18), 0.12, esc=(1.9, 0.6, 0.85)))     # dobra de pele no canto da boca            # garganta: linha lisa da mandíbula ao peito
print('OLHOS', {k: tuple(round(c, 3) for c in v) for k, v in POS_OLHO.items()})
partes = [corpo, cranio] + relevos + perna('l') + perna('r') + braco('l') + braco('r')
GARRAS = []
def garra(nome, base, direcao, comp, r):
    d = Vector(direcao).normalized(); bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=r, radius2=0.004, depth=comp, location=Vector(base) + d * comp * 0.5)
    o = bpy.context.object; o.name = nome; o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d)
    sb = o.modifiers.new('sb', 'SIMPLE_DEFORM'); sb.deform_method = 'BEND'; sb.angle = math.radians(-35); sb.deform_axis = 'X'
    GARRAS.append(o); return o
for l, s_ in (('l', 1), ('r', -1)):
    pe = np.array((0.44, 0.53 * s_, 0.20)) + [0.04, 0, -0.06]
    for k, (ang, comp) in enumerate([(0.32, 0.58), (0.0, 0.68), (-0.30, 0.56)]):
        dd = np.array([math.cos(ang), math.sin(ang) * s_, 0.0]); ponta = pe + dd * comp + [0, 0, -0.12]
        garra(f'garra{k}_{l}', tuple(ponta - dd * 0.02 + [0, 0, 0.01]), tuple(dd + [0, 0, -0.35]), 0.16, 0.035)
    pulso = np.array((2.86, 0.56 * s_, 2.28))
    for k, dy in enumerate([0.025, -0.025]):
        ponta = pulso + [0.15, dy * s_ * 1.3, -0.13]; garra(f'garramao{k}_{l}', tuple(ponta), (0.4, 0, -1), 0.07, 0.014)

# pele única: une corpo, crânio e membros (o que se sobrepõe vira uma superfície só), e alisa
def unir(objs, nome, voxel=0.022, suave=6):
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join(); o = bpy.context.object; o.name = nome
    m = o.modifiers.new('rm', 'REMESH'); m.mode = 'VOXEL'; m.voxel_size = voxel; m.use_smooth_shade = True
    bpy.ops.object.modifier_apply(modifier=m.name)
    s = o.modifiers.new('sv', 'CORRECTIVE_SMOOTH'); s.iterations = suave; s.use_only_smooth = True; bpy.ops.object.modifier_apply(modifier=s.name)
    s = o.modifiers.new('lap', 'LAPLACIANSMOOTH'); s.iterations = 2; s.lambda_factor = 0.6; bpy.ops.object.modifier_apply(modifier=s.name)
    bpy.ops.object.shade_smooth(); return o

for o in partes:
    if o.name.startswith(('perna', 'corpo')):
        V_ = np.array([v.co[:] for v in o.data.vertices]); print('DIM', o.name, V_.min(0).round(2), V_.max(0).round(2))
        if o.name.startswith('perna_l'):
            for zz in (3.0, 2.4, 1.8, 1.4):
                m_ = np.abs(V_[:, 2] - zz) < 0.05; print('   z', zz, 'y', V_[m_, 1].min().round(2), V_[m_, 1].max().round(2), 'x', V_[m_, 0].min().round(2), V_[m_, 0].max().round(2))
if ETAPA == 'medir': sys.exit(0)
pele = unir(partes, 'trex', voxel=0.016)
mand = unir([mandibula], 'trex_mandibula', voxel=0.012, suave=4)
olhos = [esfera('olho_' + l, tuple(POS_OLHO[l] + Vector((0, 0.008 * (1 if l == 'l' else -1), 0))), 0.054) for l in ('l', 'r')]
mgarra = bpy.data.materials.new('garra'); mgarra.use_nodes = True; bg_ = mgarra.node_tree.nodes['Principled BSDF']
bg_.inputs['Base Color'].default_value = (0.03, 0.025, 0.02, 1); bg_.inputs['Roughness'].default_value = 0.35
for g in GARRAS: g.data.materials.append(mgarra)     # pequeno e afundado entre as pálpebras
print('TREX faces:', len(pele.data.polygons), 'mandíbula:', len(mand.data.polygons))

# ------------------------------------------------------------------------------------------------ relevo na malha: músculos, dobras e rugosidade
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

def relevo(o, cabeca=True):
    me = o.data; V = np.array([v.co[:] for v in me.vertices]); Nn = np.array([v.normal[:] for v in me.vertices]); x, y, z = V[:, 0], V[:, 1], V[:, 2]
    d = 0.018 * fbm3(V, 1.6, 3, 1)                                                        # massas musculares suaves
    lateral = np.abs(Nn[:, 1])
    def vinco(esc, sem):
        """vincos irregulares: perto dos zeros de um ruído esticado (como pele dobrada), não ondas regulares"""
        n = fbm3(V * np.array(esc), 1.0, 3, sem); return np.clip(1 - np.abs(n) * 7, 0, 1) ** 2
    pesc = suave(2.5, 2.9, x) * (1 - suave(3.8, 4.05, x))                                   # pescoço: vincos fundos e irregulares, de lado e embaixo
    d -= pesc * np.clip(-Nn[:, 2] * 0.7 + lateral * 0.8, 0.15, 1) * (0.026 * vinco((6.5, 1.8, 2.2), 21) + 0.012 * vinco((14, 4, 4), 22))
    garg = suave(3.1, 3.4, x) * (1 - suave(4.1, 4.35, x)) * np.clip(-Nn[:, 2] - 0.1, 0, 1)            # garganta: pregas compridas
    d -= garg * 0.022 * vinco((1.6, 9.0, 2.0), 23)
    corpo_m = 1 - suave(3.9, 4.15, x)
    d -= corpo_m * (0.010 * vinco((2.6, 2.6, 2.6), 24) + 0.005 * vinco((7, 7, 7), 25))              # pele grossa dobrada no corpo todo
    for (cx, cz, r) in ((0.52, 1.83, 0.40), (0.05, 0.77, 0.30), (0.44, 0.20, 0.22), (2.66, 2.36, 0.16), (2.45, 2.75, 0.40), (-0.5, 2.7, 0.55)):   # articulações, axila, virilha
        m = np.exp(-((x - cx) ** 2 + (z - cz) ** 2) / r ** 2) * (np.abs(y) > 0.25)
        d -= m * 0.018 * vinco((2.0, 2.0, 8.0), 26)
    if cabeca:
        cab = suave(3.9, 4.15, x)
        rug = cab * (0.010 * fbm3(V, 9, 3, 7) + 0.008 * np.clip(fbm3(V, 4, 2, 8), 0, 1))                # focinho e crânio rugosos (como nos fósseis)
        topo = np.clip(Nn[:, 2], 0, 1) * suave(4.5, 4.8, x)                                             # crista nasal irregular
        d += rug + topo * 0.012 * np.clip(fbm3(V, 14, 2, 9), -0.2, 1)
        for s_ in (1, -1):                                                                              # duas fileiras de calombos no alto do focinho
            for xc in np.arange(4.62, 5.35, 0.085):
                q = ((x - xc) / 0.035) ** 2 + ((y - s_ * (0.085 - 0.02 * (xc - 4.6))) / 0.035) ** 2
                d += 0.022 * np.exp(-q) * np.clip(Nn[:, 2], 0, 1)
        for s_ in (1, -1):
            q = ((x - 4.78) / 0.22) ** 2 + ((z - 3.55) / 0.10) ** 2; d -= 0.022 * np.exp(-q) * (np.abs(y) > 0.15) * (y * s_ > 0)     # depressão anteorbital
            q = ((x - 4.25) / 0.22) ** 2 + ((z - 3.55) / 0.05) ** 2; d += 0.016 * np.exp(-q) * (y * s_ > 0.25)                    # crista jugal (abaixo do olho)
        lb = np.where(x > 4.45, 3.30 - 0.22 * (x - 4.45), 3.30 + 0.05 * (4.45 - x)); labio = suave(4.25, 4.4, x) * (1 - suave(5.45, 5.52, x)) * np.exp(-((z - lb + 0.005) / 0.016) ** 2) * (np.abs(Nn[:, 1]) > 0.5)
        d -= 0.022 * labio                                                                               # vinco que marca a boca
        for s_ in (1, -1):                                                                              # narinas alongadas no alto da ponta do focinho
            q = ((x - 5.40) / 0.07) ** 2 + ((y - 0.10 * s_) / 0.035) ** 2 + ((z - 3.36) / 0.05) ** 2
            d -= 0.035 * np.exp(-q * 1.6)
    V += Nn * d[:, None]
    for i, v in enumerate(me.vertices): v.co = V[i]
    me.update()
relevo(pele); relevo(mand)

from mathutils import kdtree, Matrix
def tuberculos(o, camadas, sem=1):
    """escamas/tubérculos em relevo: um centro por célula (grade com sorteio), cúpula até o meio do caminho para o vizinho -> sulco entre eles"""
    me = o.data; V = np.array([v.co[:] for v in me.vertices]); Nn = np.array([v.normal[:] for v in me.vertices]); d = np.zeros(len(V)); rng = np.random.default_rng(sem)
    for k, (peso_fn, cel, H, forma) in enumerate(camadas):
        w = peso_fn(V, Nn); idx = np.where(w > 0.03)[0]
        if not len(idx): continue
        perm = rng.permutation(idx); c = np.floor((V[perm] + rng.random(3) * cel) / cel).astype(np.int64)
        chave = (c[:, 0] * 73856093) ^ (c[:, 1] * 19349663) ^ (c[:, 2] * 83492791); _, pri = np.unique(chave, return_index=True); C = V[perm[pri]]
        Hc = H * rng.uniform(0.6, 1.3, len(C))                                             # alturas desiguais, como pele de verdade
        kd = kdtree.KDTree(len(C))
        for i, cc in enumerate(C): kd.insert(cc, i)
        kd.balance()
        for i in idx:
            r = kd.find_n(V[i], 2)
            if len(r) < 2: continue
            t = r[0][2] / max(0.5 * (r[0][2] + r[1][2]), 1e-6)
            d[i] += w[i] * Hc[r[0][1]] * max(0.0, 1 - t * t) ** forma
        print('tubérculos camada', k, 'centros', len(C))
    V += Nn * d[:, None]
    for i, v in enumerate(me.vertices): v.co = V[i]
    me.update()

def g(v, a, b): return suave(a, b, v)
tuberculos(pele, [
    (lambda V, N: g(V[:, 0], 3.85, 4.1), 0.050, 0.013, 0.6),                                                              # cabeça
    (lambda V, N: g(V[:, 0], 4.35, 4.6) * np.clip(N[:, 2], 0, 1) + np.exp(-((V[:, 0] - 4.42) ** 2 + (V[:, 2] - 3.90) ** 2) / 0.012) * (np.abs(V[:, 1]) > 0.15), 0.085, 0.020, 0.5),   # crista do focinho e sobrancelha
    (lambda V, N: np.exp(-(V[:, 1] / 0.13) ** 2) * np.clip(N[:, 2], 0, 1) * g(V[:, 0], -5.5, -4.5) * (1 - g(V[:, 0], 3.6, 3.9)), 0.11, 0.024, 0.5),   # fileira grossa no dorso
    (lambda V, N: 1 - g(V[:, 0], 3.85, 4.1), 0.032, 0.0045, 0.8),                                                         # pele do corpo
], sem=3)
tuberculos(mand, [(lambda V, N: np.ones(len(V)), 0.045, 0.012, 0.6)], sem=5)

# ------------------------------------------------------------------------------------------------ boca: mandíbula num pivô, dentes, gengiva, língua, céu da boca e garganta
ABRE = float(arg('abre', 0))
PIVO = Vector((4.02, 0.0, 3.27))
piv = bpy.data.objects.new('pivo_mandibula', None); piv.location = PIVO; cena.collection.objects.link(piv); bpy.context.view_layer.update()
def prender(o): o.parent = piv; o.matrix_parent_inverse = piv.matrix_world.inverted()
prender(mand)
wc = lambda x: float(np.interp(x, [e[0] for e in CRANIO], [e[3] for e in CRANIO]))
wm = lambda x: float(np.interp(x, [e[0] for e in MAND], [e[3] for e in MAND]))

def material_simples(nome, cor, rug=0.4, sss=0.0, esp=0.5):
    m = bpy.data.materials.new(nome); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*cor, 1); b.inputs['Roughness'].default_value = rug; b.inputs['Specular IOR Level'].default_value = esp
    if sss: b.inputs['Subsurface Weight'].default_value = sss; b.inputs['Subsurface Radius'].default_value = (0.02, 0.006, 0.004)
    return m
M_DENTE = material_simples('dente', (0.55, 0.45, 0.28), 0.32, 0.05, 0.6)
_nt = M_DENTE.node_tree; _gc = _nt.nodes.new('ShaderNodeTexCoord'); _sp = _nt.nodes.new('ShaderNodeSeparateXYZ'); _nt.links.new(_gc.outputs['Generated'], _sp.inputs['Vector'])
_rp = _nt.nodes.new('ShaderNodeValToRGB'); _rp.color_ramp.elements[0].color = (0.16, 0.10, 0.05, 1); _rp.color_ramp.elements[0].position = 0.0
_rp.color_ramp.elements[1].color = (0.62, 0.54, 0.36, 1); _rp.color_ramp.elements[1].position = 0.45; _nt.links.new(_sp.outputs['Z'], _rp.inputs['Fac'])
_nt.links.new(_rp.outputs['Color'], _nt.nodes['Principled BSDF'].inputs['Base Color'])                                   # base escura (gengiva/sujeira), ponta marfim
M_GENG = material_simples('gengiva', (0.20, 0.045, 0.04), 0.40, 0.3)
M_BOCA = material_simples('boca', (0.13, 0.030, 0.026), 0.45, 0.2)
M_LINGUA = material_simples('lingua', (0.24, 0.055, 0.05), 0.30, 0.3)
M_GARG = material_simples('garganta', (0.05, 0.008, 0.008), 0.6)

def dente(nome, base, dirv, comp, r, pai=None):
    """dente cônico achatado dos lados, curvado para trás (como os do T. rex)"""
    bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=r, radius2=r * 0.06, depth=comp, location=(0, 0, 0)); o = bpy.context.object; o.name = nome
    o.data.transform(Matrix.Translation((0, 0, comp / 2))); o.data.transform(Matrix.Diagonal((0.62, 1.0, 1.0, 1.0)))
    sd = o.modifiers.new('cv', 'SIMPLE_DEFORM'); sd.deform_method = 'BEND'; sd.deform_axis = 'X'; sd.angle = math.radians(-28)
    bpy.ops.object.modifier_apply(modifier=sd.name)
    z = Vector(dirv).normalized(); yb = Vector((-1, 0, 0)); yb = (yb - z * yb.dot(z)).normalized(); x = yb.cross(z)
    o.matrix_world = Matrix((list(x) + [0], list(yb) + [0], list(z) + [0], [0, 0, 0, 1])).transposed() @ Matrix.Identity(4)
    o.location = base; o.data.materials.append(M_DENTE); bpy.ops.object.shade_smooth()
    if pai: prender(o)
    return o

def tamanho_dente(t, maior):
    """t: 0 na ponta do focinho, 1 no fundo; pequenos na frente (pré-maxilares), maiores no primeiro terço, menores atrás"""
    return maior * (0.45 + 0.55 * math.exp(-((t - 0.32) / 0.28) ** 2)) * (0.85 + 0.3 * ((hash((round(t, 3), maior)) % 100) / 100))

DENTES = []
for s_ in (1, -1):
    for i in range(11):                                                                        # de cima (maxila): grandes e grossos
        t = i / 10; x = 5.40 - t * (5.40 - 4.36) + 0.012 * math.sin(i * 2.3); zm = linha_boca(x) - 0.075; y = s_ * wc(x) * 0.82
        L = tamanho_dente(t, 0.26); DENTES.append(dente(f'dente_sup{i}_{s_}', (x, y, zm + 0.03), (0.12 + 0.05 * math.sin(i * 1.7), 0.12 * s_, -1), L, L * 0.34))
    for i in range(11):                                                                        # de baixo (dentário): presos à mandíbula
        t = i / 10; x = 5.34 - t * (5.34 - 4.46) + 0.012 * math.sin(i * 1.9); zm = linha_boca(x) + 0.035; y = s_ * wm(x) * 0.80
        L = tamanho_dente(t, 0.21); DENTES.append(dente(f'dente_inf{i}_{s_}', (x, y, zm - 0.03), (0.08 + 0.05 * math.sin(i * 2.1), 0.10 * s_, 1), L, L * 0.34, pai=True))
    # gengivas ao longo das fileiras
    gs = loft(f'gengiva_sup_{s_}', [[x, s_ * wc(x) * 0.82, linha_boca(x) - 0.062, 0.05, 0.03, 0.025] for x in np.linspace(5.44, 4.25, 9)], N=12, expo=2.0); gs.data.materials.append(M_GENG)
    gi = loft(f'gengiva_inf_{s_}', [[x, s_ * wm(x) * 0.80, linha_boca(x) + 0.03, 0.045, 0.025, 0.025] for x in np.linspace(5.40, 4.35, 9)], N=12, expo=2.0); gi.data.materials.append(M_GENG); prender(gi)
lingua = loft('lingua', [[x, 0, linha_boca(x) + 0.05, w, 0.05, 0.03] for x, w in ((4.15, 0.16), (4.5, 0.15), (4.85, 0.11), (5.05, 0.06))], N=24, expo=2.2); lingua.data.materials.append(M_LINGUA); prender(lingua)
# céu da boca e assoalho com a cor da boca
def pintar_boca(o, lado_cima):
    me = o.data; me.materials.append(M_BOCA); im = len(me.materials) - 1
    for f in me.polygons:
        c = f.center; x = c.x
        if x < 4.0: continue
        if lado_cima and f.normal.z < -0.45 and c.z < linha_boca(x) + 0.02 and abs(c.y) < wc(x) * 0.86: f.material_index = im
        if not lado_cima and f.normal.z > 0.45 and abs(c.y) < wm(x) * 0.86: f.material_index = im
# garganta: bloco escuro no fundo da boca, ligando a maxila à mandíbula (aparece quando a boca abre)
def garganta_interna(ang):
    R = Matrix.Rotation(math.radians(ang), 4, 'Y'); pts = []
    for x in np.linspace(3.98, 4.30, 6):
        for s_ in (1, -1):
            pts.append(Vector((x, s_ * wc(x) * 0.74, linha_boca(x) - 0.06)))
            q = Vector((x, s_ * wm(x) * 0.72, linha_boca(x) + 0.02)) - PIVO; pts.append(PIVO + (R @ q))
    bm = bmesh.new(); vs = [bm.verts.new(p) for p in pts]; bmesh.ops.convex_hull(bm, input=vs)
    me = bpy.data.meshes.new('garganta_int'); bm.to_mesh(me); bm.free(); ob = bpy.data.objects.new('garganta_int', me); cena.collection.objects.link(ob); ob.data.materials.append(M_GARG); return ob


def contrassombra(o, passos=60):
    """1 no dorso, 0 na barriga: normal suavizada numa área grande (as saliências pequenas não mudam de cor) + altura relativa no corpo"""
    me = o.data; n = len(me.vertices); Nz = np.array([v.normal.z for v in me.vertices]); Z = np.array([v.co.z for v in me.vertices])
    viz = [[] for _ in range(n)]
    for e in me.edges: a, b = e.vertices; viz[a].append(b); viz[b].append(a)
    ini = np.array([len(v) for v in viz]); idx = np.concatenate([np.array(v, int) for v in viz]); ptr = np.concatenate([[0], np.cumsum(ini)])
    val = Nz.copy()
    for _ in range(passos):
        soma = np.add.reduceat(val[idx], ptr[:-1]) if len(idx) else val; val = 0.5 * val + 0.5 * soma / np.maximum(ini, 1)
    d = np.clip(0.5 + 0.75 * val, 0, 1)
    at = me.color_attributes.new('dorso', 'FLOAT_COLOR', 'POINT')
    for i in range(n): at.data[i].color = (d[i], d[i], d[i], 1)
contrassombra(pele); contrassombra(mand)

# ------------------------------------------------------------------------------------------------ pele: escamas pequenas, escamas maiores no dorso, contra-sombreamento e manchas
def material_pele(nome='pele_trex'):
    m = bpy.data.materials.new(nome); m.use_nodes = True; nt = m.node_tree; N_ = nt.nodes; L_ = nt.links
    b = N_['Principled BSDF']; tc = N_.new('ShaderNodeTexCoord'); geo = N_.new('ShaderNodeNewGeometry')
    def no(tipo, **kw):
        n = N_.new(tipo)
        for k, v in kw.items():
            if k.startswith('in_'): nm = k[3:].replace('_', ' '); n.inputs[int(nm) if nm.isdigit() else nm].default_value = v
            else: setattr(n, k, v)
        return n
    sepO = no('ShaderNodeSeparateXYZ'); L_.new(tc.outputs['Object'], sepO.inputs['Vector'])
    escala = no('ShaderNodeMapRange', in_From_Min=4.0, in_From_Max=4.6, in_To_Min=55.0, in_To_Max=30.0); L_.new(sepO.outputs['X'], escala.inputs['Value'])   # cabeça: escamas maiores
    esc = no('ShaderNodeTexVoronoi', feature='DISTANCE_TO_EDGE', in_Randomness=0.9); L_.new(tc.outputs['Object'], esc.inputs['Vector']); L_.new(escala.outputs[0], esc.inputs['Scale'])   # escamas ~1,8 cm (3,3 cm na cabeça)
    escG = no('ShaderNodeTexVoronoi', feature='DISTANCE_TO_EDGE', in_Scale=16.0); L_.new(tc.outputs['Object'], escG.inputs['Vector'])      # escamas grandes ~6 cm
    rug = no('ShaderNodeTexNoise', in_Scale=6.0, in_Detail=8.0); L_.new(tc.outputs['Object'], rug.inputs['Vector'])
    sep = no('ShaderNodeSeparateXYZ'); L_.new(geo.outputs['Normal'], sep.inputs['Vector'])
    atr = no('ShaderNodeAttribute', attribute_name='dorso')
    dorso = no('ShaderNodeMapRange', in_From_Min=0.05, in_From_Max=0.95); L_.new(atr.outputs['Fac'], dorso.inputs['Value'])             # 1 no dorso, 0 na barriga (suavizado na malha)
    # altura: sulcos entre escamas (pequenas em todo lugar, grandes no dorso) + rugas
    h1 = no('ShaderNodeMath', operation='POWER', in_1=0.5); L_.new(esc.outputs['Distance'], h1.inputs[0])
    h2 = no('ShaderNodeMath', operation='POWER', in_1=0.6); L_.new(escG.outputs['Distance'], h2.inputs[0])
    h2m = no('ShaderNodeMath', operation='MULTIPLY'); L_.new(h2.outputs[0], h2m.inputs[0]); L_.new(dorso.outputs[0], h2m.inputs[1])
    alt = no('ShaderNodeMath', operation='ADD'); L_.new(h1.outputs[0], alt.inputs[0]); L_.new(h2m.outputs[0], alt.inputs[1])
    alt2 = no('ShaderNodeMath', operation='MULTIPLY_ADD', in_1=0.35); L_.new(rug.outputs['Fac'], alt2.inputs[0]); L_.new(alt.outputs[0], alt2.inputs[2])
    bump = no('ShaderNodeBump', in_Strength=0.55, in_Distance=0.012); L_.new(alt2.outputs[0], bump.inputs['Height']); L_.new(bump.outputs['Normal'], b.inputs['Normal'])
    # cor: dorso oliva-escuro, flanco castanho, barriga areia; manchas largas e sujeira nos sulcos
    rampa = no('ShaderNodeValToRGB'); cr = rampa.color_ramp
    cr.elements[0].position = 0.10; cr.elements[0].color = (0.25, 0.20, 0.12, 1); cr.elements[1].position = 0.95; cr.elements[1].color = (0.030, 0.027, 0.014, 1)
    e = cr.elements.new(0.42); e.color = (0.085, 0.070, 0.038, 1); e = cr.elements.new(0.62); e.color = (0.050, 0.043, 0.022, 1)
    L_.new(dorso.outputs[0], rampa.inputs['Fac'])
    manchas = no('ShaderNodeTexNoise', in_Scale=1.2, in_Detail=3.0); L_.new(tc.outputs['Object'], manchas.inputs['Vector'])
    mR = no('ShaderNodeMapRange', in_From_Min=0.48, in_From_Max=0.60, in_To_Min=1.0, in_To_Max=0.55); L_.new(manchas.outputs['Fac'], mR.inputs['Value'])
    c1 = no('ShaderNodeMix', data_type='RGBA', blend_type='MULTIPLY', in_Factor=1.0); L_.new(rampa.outputs['Color'], c1.inputs[6]); L_.new(mR.outputs[0], c1.inputs[7])
    c1.inputs[7].default_value = (1, 1, 1, 1)
    faixa = no('ShaderNodeTexWave', wave_type='BANDS', bands_direction='X', in_Scale=1.6, in_Distortion=6.0, in_Detail=2.0); L_.new(tc.outputs['Object'], faixa.inputs['Vector'])
    fR = no('ShaderNodeMapRange', in_From_Min=0.55, in_From_Max=0.85, in_To_Min=1.0, in_To_Max=0.72); L_.new(faixa.outputs['Fac'], fR.inputs['Value'])
    fD = no('ShaderNodeMapRange', in_From_Min=0.72, in_From_Max=0.92, in_To_Min=1.0, in_To_Max=0.0); L_.new(atr.outputs['Fac'], fD.inputs['Value'])
    fM = no('ShaderNodeMix', data_type='FLOAT'); L_.new(fD.outputs[0], fM.inputs[0]); L_.new(fR.outputs[0], fM.inputs[2]); fM.inputs[3].default_value = 1.0   # faixas só no dorso
    c0 = no('ShaderNodeMix', data_type='RGBA', blend_type='MULTIPLY', in_Factor=1.0); L_.new(c1.outputs[2], c0.inputs[6]); L_.new(fM.outputs[0], c0.inputs[7]); c1 = c0
    tom = no('ShaderNodeTexNoise', in_Scale=0.6, in_Detail=2.0); L_.new(tc.outputs['Object'], tom.inputs['Vector'])
    tomR = no('ShaderNodeValToRGB'); tomR.color_ramp.elements[0].color = (1.0, 0.86, 0.72, 1); tomR.color_ramp.elements[1].color = (0.80, 0.86, 0.80, 1); L_.new(tom.outputs['Fac'], tomR.inputs['Fac'])
    cT = no('ShaderNodeMix', data_type='RGBA', blend_type='MULTIPLY', in_Factor=0.6); L_.new(c1.outputs[2], cT.inputs[6]); L_.new(tomR.outputs['Color'], cT.inputs[7]); c1 = cT
    dO = no('ShaderNodeVectorMath', operation='DISTANCE'); L_.new(tc.outputs['Object'], dO.inputs[0]); dO.inputs[1].default_value = (4.40, 0.26, 3.80)
    dO2 = no('ShaderNodeVectorMath', operation='DISTANCE'); L_.new(tc.outputs['Object'], dO2.inputs[0]); dO2.inputs[1].default_value = (4.40, -0.26, 3.80)
    dMin = no('ShaderNodeMath', operation='MINIMUM'); L_.new(dO.outputs['Value'], dMin.inputs[0]); L_.new(dO2.outputs['Value'], dMin.inputs[1])
    escO = no('ShaderNodeMapRange', in_From_Min=0.05, in_From_Max=0.20, in_To_Min=0.35, in_To_Max=1.0); L_.new(dMin.outputs[0], escO.inputs['Value'])     # mancha escura em volta do olho
    cE = no('ShaderNodeMix', data_type='RGBA', blend_type='MULTIPLY', in_Factor=1.0); L_.new(c1.outputs[2], cE.inputs[6]); L_.new(escO.outputs[0], cE.inputs[7]); c1 = cE
    vale = no('ShaderNodeMapRange', in_From_Min=0.0, in_From_Max=0.25, in_To_Min=0.55, in_To_Max=1.0); L_.new(esc.outputs['Distance'], vale.inputs['Value'])
    c2 = no('ShaderNodeMix', data_type='RGBA', blend_type='MULTIPLY', in_Factor=1.0); L_.new(c1.outputs[2], c2.inputs[6]); L_.new(vale.outputs[0], c2.inputs[7])
    ao = no('ShaderNodeAmbientOcclusion', samples=8, in_Distance=0.05)
    aoR = no('ShaderNodeMapRange', in_From_Min=0.25, in_From_Max=0.95, in_To_Min=0.10, in_To_Max=1.0); L_.new(ao.outputs['AO'], aoR.inputs['Value'])
    pt = no('ShaderNodeMapRange', in_From_Min=0.48, in_From_Max=0.54, in_To_Min=0.75, in_To_Max=1.7); L_.new(geo.outputs['Pointiness'], pt.inputs['Value'])
    mv = no('ShaderNodeTexVoronoi', in_Scale=3.5, in_Randomness=1.0); L_.new(tc.outputs['Object'], mv.inputs['Vector'])
    mvR = no('ShaderNodeMapRange', in_From_Min=0.12, in_From_Max=0.30, in_To_Min=0.62, in_To_Max=1.0); L_.new(mv.outputs['Distance'], mvR.inputs['Value'])
    fator = no('ShaderNodeMath', operation='MULTIPLY'); L_.new(aoR.outputs[0], fator.inputs[0]); L_.new(pt.outputs[0], fator.inputs[1])
    fator2 = no('ShaderNodeMath', operation='MULTIPLY'); L_.new(fator.outputs[0], fator2.inputs[0]); L_.new(mvR.outputs[0], fator2.inputs[1])
    c3 = no('ShaderNodeMix', data_type='RGBA', blend_type='MULTIPLY', in_Factor=1.0); L_.new(c2.outputs[2], c3.inputs[6]); L_.new(fator2.outputs[0], c3.inputs[7])
    L_.new(c3.outputs[2], b.inputs['Base Color'])
    rgh = no('ShaderNodeMapRange', in_To_Min=0.82, in_To_Max=0.55); L_.new(esc.outputs['Distance'], rgh.inputs['Value']); L_.new(rgh.outputs[0], b.inputs['Roughness'])
    b.inputs['Specular IOR Level'].default_value = 0.35; b.inputs['Subsurface Weight'].default_value = 0.03
    return m

def material_olho():
    m = bpy.data.materials.new('olho'); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.55, 0.28, 0.02, 1); b.inputs['Roughness'].default_value = 0.05; b.inputs['Emission Color'].default_value = (0.5, 0.22, 0.02, 1); b.inputs['Emission Strength'].default_value = 0.15; b.inputs['Coat Weight'].default_value = 1.0; return m

mp = material_pele(); pele.data.materials.append(mp); mand.data.materials.append(mp)
pintar_boca(pele, True); pintar_boca(mand, False)
if ABRE: garganta_interna(ABRE); piv.rotation_euler.y = math.radians(ABRE)
mo = material_olho(); mpup = bpy.data.materials.new('pupila'); mpup.use_nodes = True; mpup.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.01, 0.01, 0.01, 1)
for o, s_ in zip(olhos, (1, -1)):
    o.data.materials.append(mo)
    dvec = Vector((0.55, 0.83 * s_, 0.05)).normalized(); c = Vector(o.location) if o.location.length > 0 else Vector((4.31, 0.375 * s_, 3.88))
    pu = esfera('pupila_' + ('l' if s_ > 0 else 'r'), tuple(POS_OLHO['l' if s_ > 0 else 'r'] + dvec * 0.043), 0.014, esc=(1, 1, 1.5)); pu.data.materials.append(mpup)
def argila(cor):
    m = bpy.data.materials.new('argila'); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*cor, 1); b.inputs['Roughness'].default_value = 0.8; return m

# ------------------------------------------------------------------------------------------------ prévias
if PREVIA:
    if HUMANO:                                                                  # pessoa de 1,75 m ao lado, para conferir a escala
        bpy.ops.import_scene.gltf(filepath=HUMANO)
        for o in bpy.context.selected_objects:
            if o.parent is None: o.location.x += 1.6; o.location.y += 2.6
    cena.render.engine = 'CYCLES'; cena.cycles.samples = AMOSTRAS; cena.cycles.use_denoising = True; cena.cycles.device = 'CPU'
    cena.render.resolution_x, cena.render.resolution_y = LARG, int(LARG * 0.7)
    w = bpy.data.worlds.new('mundo'); cena.world = w; w.use_nodes = True
    if HDRI:
        nt = w.node_tree; env = nt.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(HDRI); nt.links.new(env.outputs['Color'], nt.nodes['Background'].inputs['Color'])
        nt.nodes['Background'].inputs['Strength'].default_value = 1.0
    else: w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.55, 0.62, 0.72, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35
    sol = bpy.data.lights.new('sol', 'SUN'); sol.energy = 4.5; sol.angle = math.radians(2); so = bpy.data.objects.new('sol', sol); so.rotation_euler = (math.radians(50), 0, math.radians(35)); cena.collection.objects.link(so)
    chao = bpy.data.meshes.new('chao'); oc = bpy.data.objects.new('chao', chao); cena.collection.objects.link(oc)
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=40); bm.to_mesh(chao); bm.free()
    if CHAO:                                                                    # chão de terra real (Poly Haven), repetido
        oc.data.uv_layers.new(name='UV')
        for li in oc.data.loops: oc.data.uv_layers[0].data[li.index].uv = (oc.data.vertices[li.vertex_index].co.x / 3.0, oc.data.vertices[li.vertex_index].co.y / 3.0)
        mc = bpy.data.materials.new('terra'); mc.use_nodes = True; nt = mc.node_tree; bp = nt.nodes['Principled BSDF']
        td = nt.nodes.new('ShaderNodeTexImage'); td.image = bpy.data.images.load(CHAO + '_diff_2k.jpg'); nt.links.new(td.outputs['Color'], bp.inputs['Base Color'])
        tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = bpy.data.images.load(CHAO + '_nor_gl_2k.jpg'); tn.image.colorspace_settings.name = 'Non-Color'
        nm = nt.nodes.new('ShaderNodeNormalMap'); nt.links.new(tn.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], bp.inputs['Normal']); bp.inputs['Roughness'].default_value = 0.9
        oc.data.materials.append(mc)
    else: oc.data.materials.append(argila((0.5, 0.48, 0.44)))
    for nome, loc, alvo, lente in [('lado', (-0.5, -17, 3.0), (-0.6, 0, 2.6), 35), ('tresq', (8.5, -9.5, 4.2), (0.8, 0, 2.6), 35), ('tras', (-11, 8, 5.5), (0, 0, 2.6), 35),
                                   ('frente', (11, 0.01, 3.3), (0.5, 0, 2.6), 38), ('cabeca', (7.6, -4.6, 4.3), (4.6, 0, 3.55), 70), ('perfil_cab', (4.5, -7.5, 3.6), (4.55, 0, 3.55), 80), ('beleza', (9.0, -6.5, 1.3), (1.6, 0, 2.9), 50), ('beleza_cab', (7.4, -2.9, 3.2), (4.5, 0, 3.55), 85), ('ataque', (7.9, -3.9, 3.05), (3.7, 0, 3.35), 38), ('cima', (0.0, -0.01, 18), (-0.6, 0, 2.5), 40)]:
        if CAMS and nome not in CAMS.split(','): continue
        cd = bpy.data.cameras.new(nome); cd.lens = lente; oc2 = bpy.data.objects.new(nome, cd); oc2.location = loc; cena.collection.objects.link(oc2)
        al = bpy.data.objects.new('alvo_' + nome, None); al.location = alvo; cena.collection.objects.link(al)
        c = oc2.constraints.new('TRACK_TO'); c.target = al; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
        cena.camera = oc2; cena.render.filepath = PREVIA.replace('.png', f'_{nome}.png'); bpy.ops.render.render(write_still=True)

if SAIDA and ETAPA == 'tudo':
    bpy.ops.export_scene.gltf(filepath=SAIDA, export_format='GLB')
