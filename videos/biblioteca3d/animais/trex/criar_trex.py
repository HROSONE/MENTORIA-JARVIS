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
SAIDA, PREVIA, ETAPA, HDRI, HUMANO = arg('saida'), arg('previa'), arg('etapa', 'tudo'), arg('hdri'), arg('humano')

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
CORPO = [
    [-6.50, 0, 2.10, 0.04, 0.04, 0.04, 0.5, 0.25], [-6.00, 0, 2.25, 0.12, 0.13, 0.15, 0.5, 0.25], [-5.20, 0, 2.52, 0.22, 0.24, 0.28, 0.5, 0.25],
    [-4.30, 0, 2.80, 0.32, 0.34, 0.42, 0.5, 0.25], [-3.40, 0, 3.05, 0.42, 0.42, 0.55, 0.5, 0.25], [-2.50, 0, 3.25, 0.50, 0.48, 0.66, 0.5, 0.25],
    [-1.70, 0, 3.40, 0.58, 0.52, 0.74, 0.42, 0.22], [-0.90, 0, 3.47, 0.64, 0.55, 0.82, 0.42, 0.22], [-0.20, 0, 3.47, 0.68, 0.56, 0.92, 0.42, 0.22],
    [0.50, 0, 3.42, 0.72, 0.53, 1.06, 0.36, 0.22], [1.20, 0, 3.36, 0.76, 0.50, 1.20, 0.36, 0.22], [1.80, 0, 3.30, 0.74, 0.48, 1.20, 0.36, 0.22],
    [2.30, 0, 3.26, 0.68, 0.47, 1.06, 0.36, 0.22], [2.70, 0, 3.28, 0.58, 0.45, 0.90, 0.3, 0.12], [3.05, 0, 3.36, 0.50, 0.42, 0.72, 0.3, 0.12],
    [3.40, 0, 3.47, 0.43, 0.39, 0.58, 0.3, 0.12], [3.70, 0, 3.55, 0.38, 0.36, 0.48, 0.3, 0.12], [3.95, 0, 3.58, 0.33, 0.31, 0.38, 0.3, 0.12],
]
corpo = loft('corpo', CORPO, N=48, expo=2.3)

# crânio (maxila): linha da boca de (3.95, 3.44) a (5.43, 3.38); seção com fundo quase reto (o céu da boca)
def linha_boca(x): return 3.44 - 0.045 * (x - 3.95) - 0.02 * max(0.0, x - 5.1) * 3
CRANIO = [[x, 0, linha_boca(x), w, top, 0.06, 0.28 + 0.30 * min(1, max(0, (x - 4.2) / 0.8)), 0.0] for x, w, top in [
    (3.80, 0.43, 0.52), (4.02, 0.50, 0.60), (4.25, 0.46, 0.60), (4.45, 0.34, 0.55), (4.70, 0.245, 0.48),
    (4.95, 0.20, 0.42), (5.18, 0.172, 0.37), (5.34, 0.150, 0.32), (5.44, 0.12, 0.26), (5.49, 0.055, 0.17)]]
cranio = loft('cranio', CRANIO, N=44, expo=3.1)                       # crânio de T. rex é 'caixa': laterais quase retas
# mandíbula: funda atrás (onde fecham os músculos), afina para a ponta
MAND = [[x, 0, linha_boca(x) - 0.01, w, 0.05, d, 0.0, 0.32] for x, w, d in [
    (3.80, 0.44, 0.55), (4.05, 0.48, 0.58), (4.35, 0.37, 0.48), (4.70, 0.25, 0.38), (5.05, 0.19, 0.31),
    (5.30, 0.155, 0.25), (5.42, 0.12, 0.21), (5.47, 0.055, 0.12)]]
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

relevos = []
for l, s_ in (('l', 1), ('r', -1)):
    relevos.append(esfera('bochecha_' + l, (4.00, 0.40 * s_, 3.64), 0.22, esc=(1.25, 0.75, 1.0)))       # músculo adutor atrás do olho
    relevos.append(esfera('lacrimal_' + l, (4.43, 0.19 * s_, 3.98), 0.10, esc=(1.5, 0.8, 0.55)))          # 'chifre' na frente do olho
    relevos.append(esfera('posorbital_' + l, (4.20, 0.29 * s_, 3.97), 0.085, esc=(1.1, 0.9, 0.7)))      # bossa acima e atrás do olho
    relevos.append(esfera('sobrolho_' + l, (4.32, 0.31 * s_, 3.945), 0.07, esc=(1.5, 0.75, 0.42)))       # sobrancelha óssea que sombreia o olho
    relevos.append(esfera('palpsup_' + l, (4.315, 0.345 * s_, 3.905), 0.050, esc=(1.25, 0.55, 0.40)))     # pálpebra de cima
    relevos.append(esfera('palpinf_' + l, (4.31, 0.343 * s_, 3.852), 0.050, esc=(1.25, 0.55, 0.35)))      # pálpebra de baixo
partes = [corpo, cranio] + relevos + perna('l') + perna('r') + braco('l') + braco('r')

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
pele = unir(partes, 'trex')
mand = unir([mandibula], 'trex_mandibula', voxel=0.016, suave=4)
olhos = [esfera('olho_' + l, (4.315, 0.335 * s, 3.878), 0.048) for l, s in (('l', 1), ('r', -1))]     # pequeno e afundado entre as pálpebras
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
    pesc = suave(2.6, 3.0, x) * (1 - suave(3.7, 3.95, x))                                   # dobras transversais no pescoço (de lado e embaixo)
    d += pesc * (0.4 + 0.6 * np.clip(-Nn[:, 2] + lateral, 0, 1)) * 0.010 * np.sin(2 * np.pi * (x + 0.04 * fbm3(V, 6, 2, 3)) / 0.11)
    for (cx, cz, r) in ((0.52, 1.83, 0.35), (0.05, 0.77, 0.22), (0.44, 0.20, 0.18), (2.66, 2.36, 0.12)):      # dobras no joelho, tornozelo, pé, cotovelo
        m = np.exp(-((x - cx) ** 2 + (z - cz) ** 2) / r ** 2) * (np.abs(y) > 0.3)
        d += m * 0.008 * np.sin(2 * np.pi * z / 0.07 + 3 * fbm3(V, 5, 2, 4))
    barriga = np.clip(-Nn[:, 2], 0, 1) * suave(0.0, 0.6, x) * (1 - suave(2.4, 2.9, x))                # sulcos da barriga (gastrália)
    d += barriga * 0.006 * np.sin(2 * np.pi * x / 0.16)
    if cabeca:
        cab = suave(3.85, 4.1, x)
        rug = cab * (0.010 * fbm3(V, 9, 3, 7) + 0.008 * np.clip(fbm3(V, 4, 2, 8), 0, 1))                # focinho e crânio rugosos (como nos fósseis)
        topo = np.clip(Nn[:, 2], 0, 1) * suave(4.5, 4.8, x)                                             # crista nasal irregular
        d += rug + topo * 0.012 * np.clip(fbm3(V, 14, 2, 9), -0.2, 1)
        for s_ in (1, -1):
            q = ((x - 4.66) / 0.20) ** 2 + ((z - 3.74) / 0.10) ** 2; d -= 0.022 * np.exp(-q) * (np.abs(y) > 0.15) * (y * s_ > 0)     # depressão anteorbital
            q = ((x - 4.18) / 0.22) ** 2 + ((z - 3.64) / 0.05) ** 2; d += 0.016 * np.exp(-q) * (y * s_ > 0.25)                    # crista jugal (abaixo do olho)
        labio = suave(4.0, 4.2, x) * np.exp(-((z - (3.44 - 0.045 * (x - 3.95)) - 0.035) / 0.018) ** 2) * (np.abs(Nn[:, 1]) > 0.5)
        d -= 0.012 * labio                                                                               # sulco que marca a borda do lábio
        for s_ in (1, -1):                                                                              # narinas alongadas no alto da ponta do focinho
            q = ((x - 5.33) / 0.07) ** 2 + ((y - 0.115 * s_) / 0.035) ** 2 + ((z - 3.66) / 0.05) ** 2
            d -= 0.035 * np.exp(-q * 1.6)
    V += Nn * d[:, None]
    for i, v in enumerate(me.vertices): v.co = V[i]
    me.update()
relevo(pele); relevo(mand)

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
    esc = no('ShaderNodeTexVoronoi', feature='DISTANCE_TO_EDGE', in_Scale=55.0); L_.new(tc.outputs['Object'], esc.inputs['Vector'])        # escamas ~1,8 cm
    escG = no('ShaderNodeTexVoronoi', feature='DISTANCE_TO_EDGE', in_Scale=16.0); L_.new(tc.outputs['Object'], escG.inputs['Vector'])      # escamas grandes ~6 cm
    rug = no('ShaderNodeTexNoise', in_Scale=6.0, in_Detail=8.0); L_.new(tc.outputs['Object'], rug.inputs['Vector'])
    sep = no('ShaderNodeSeparateXYZ'); L_.new(geo.outputs['Normal'], sep.inputs['Vector'])
    dorso = no('ShaderNodeMapRange', in_From_Min=-0.75, in_From_Max=0.75); L_.new(sep.outputs['Z'], dorso.inputs['Value'])              # 1 no dorso, ~0,5 no flanco, 0 na barriga
    # altura: sulcos entre escamas (pequenas em todo lugar, grandes no dorso) + rugas
    h1 = no('ShaderNodeMath', operation='POWER', in_1=0.5); L_.new(esc.outputs['Distance'], h1.inputs[0])
    h2 = no('ShaderNodeMath', operation='POWER', in_1=0.6); L_.new(escG.outputs['Distance'], h2.inputs[0])
    h2m = no('ShaderNodeMath', operation='MULTIPLY'); L_.new(h2.outputs[0], h2m.inputs[0]); L_.new(dorso.outputs[0], h2m.inputs[1])
    alt = no('ShaderNodeMath', operation='ADD'); L_.new(h1.outputs[0], alt.inputs[0]); L_.new(h2m.outputs[0], alt.inputs[1])
    alt2 = no('ShaderNodeMath', operation='MULTIPLY_ADD', in_1=0.35); L_.new(rug.outputs['Fac'], alt2.inputs[0]); L_.new(alt.outputs[0], alt2.inputs[2])
    bump = no('ShaderNodeBump', in_Strength=0.55, in_Distance=0.012); L_.new(alt2.outputs[0], bump.inputs['Height']); L_.new(bump.outputs['Normal'], b.inputs['Normal'])
    # cor: dorso oliva-escuro, flanco castanho, barriga areia; manchas largas e sujeira nos sulcos
    rampa = no('ShaderNodeValToRGB'); cr = rampa.color_ramp
    cr.elements[0].position = 0.12; cr.elements[0].color = (0.15, 0.115, 0.075, 1); cr.elements[1].position = 0.95; cr.elements[1].color = (0.020, 0.019, 0.013, 1)
    e = cr.elements.new(0.42); e.color = (0.050, 0.038, 0.025, 1); e = cr.elements.new(0.62); e.color = (0.034, 0.029, 0.019, 1)
    L_.new(dorso.outputs[0], rampa.inputs['Fac'])
    manchas = no('ShaderNodeTexNoise', in_Scale=1.2, in_Detail=3.0); L_.new(tc.outputs['Object'], manchas.inputs['Vector'])
    mR = no('ShaderNodeMapRange', in_From_Min=0.5, in_From_Max=0.62, in_To_Min=1.0, in_To_Max=0.62); L_.new(manchas.outputs['Fac'], mR.inputs['Value'])
    c1 = no('ShaderNodeMix', data_type='RGBA', blend_type='MULTIPLY', in_Factor=1.0); L_.new(rampa.outputs['Color'], c1.inputs[6]); L_.new(mR.outputs[0], c1.inputs[7])
    c1.inputs[7].default_value = (1, 1, 1, 1)
    faixa = no('ShaderNodeTexWave', wave_type='BANDS', bands_direction='X', in_Scale=1.6, in_Distortion=6.0, in_Detail=2.0); L_.new(tc.outputs['Object'], faixa.inputs['Vector'])
    fR = no('ShaderNodeMapRange', in_From_Min=0.55, in_From_Max=0.85, in_To_Min=1.0, in_To_Max=0.72); L_.new(faixa.outputs['Fac'], fR.inputs['Value'])
    fD = no('ShaderNodeMapRange', in_From_Min=0.55, in_From_Max=0.9, in_To_Min=1.0, in_To_Max=0.0); L_.new(sep.outputs['Z'], fD.inputs['Value'])
    fM = no('ShaderNodeMix', data_type='FLOAT'); L_.new(fD.outputs[0], fM.inputs[0]); L_.new(fR.outputs[0], fM.inputs[2]); fM.inputs[3].default_value = 1.0   # faixas só no dorso
    c0 = no('ShaderNodeMix', data_type='RGBA', blend_type='MULTIPLY', in_Factor=1.0); L_.new(c1.outputs[2], c0.inputs[6]); L_.new(fM.outputs[0], c0.inputs[7]); c1 = c0
    vale = no('ShaderNodeMapRange', in_From_Min=0.0, in_From_Max=0.25, in_To_Min=0.55, in_To_Max=1.0); L_.new(esc.outputs['Distance'], vale.inputs['Value'])
    c2 = no('ShaderNodeMix', data_type='RGBA', blend_type='MULTIPLY', in_Factor=1.0); L_.new(c1.outputs[2], c2.inputs[6]); L_.new(vale.outputs[0], c2.inputs[7])
    L_.new(c2.outputs[2], b.inputs['Base Color'])
    rgh = no('ShaderNodeMapRange', in_To_Min=0.82, in_To_Max=0.55); L_.new(esc.outputs['Distance'], rgh.inputs['Value']); L_.new(rgh.outputs[0], b.inputs['Roughness'])
    b.inputs['Specular IOR Level'].default_value = 0.35; b.inputs['Subsurface Weight'].default_value = 0.03
    return m

def material_olho():
    m = bpy.data.materials.new('olho'); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.32, 0.17, 0.02, 1); b.inputs['Roughness'].default_value = 0.08; b.inputs['Coat Weight'].default_value = 1.0; return m

mp = material_pele(); pele.data.materials.append(mp); mand.data.materials.append(mp)
mo = material_olho(); mpup = bpy.data.materials.new('pupila'); mpup.use_nodes = True; mpup.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.01, 0.01, 0.01, 1)
for o, s_ in zip(olhos, (1, -1)):
    o.data.materials.append(mo)
    dvec = Vector((0.55, 0.83 * s_, 0.05)).normalized(); c = Vector(o.location) if o.location.length > 0 else Vector((4.31, 0.375 * s_, 3.88))
    pu = esfera('pupila_' + ('l' if s_ > 0 else 'r'), tuple(Vector((4.315, 0.335 * s_, 3.878)) + dvec * 0.043), 0.014, esc=(1, 1, 1.5)); pu.data.materials.append(mpup)
def argila(cor):
    m = bpy.data.materials.new('argila'); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*cor, 1); b.inputs['Roughness'].default_value = 0.8; return m

# ------------------------------------------------------------------------------------------------ prévias
if PREVIA:
    if HUMANO:                                                                  # pessoa de 1,75 m ao lado, para conferir a escala
        bpy.ops.import_scene.gltf(filepath=HUMANO)
        for o in bpy.context.selected_objects:
            if o.parent is None: o.location.x += 1.6; o.location.y += 2.6
    cena.render.engine = 'CYCLES'; cena.cycles.samples = 32; cena.cycles.use_denoising = True; cena.cycles.device = 'CPU'
    cena.render.resolution_x, cena.render.resolution_y = 1000, 700
    w = bpy.data.worlds.new('mundo'); cena.world = w; w.use_nodes = True
    if HDRI:
        nt = w.node_tree; env = nt.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(HDRI); nt.links.new(env.outputs['Color'], nt.nodes['Background'].inputs['Color'])
        nt.nodes['Background'].inputs['Strength'].default_value = 1.0
    else: w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.55, 0.62, 0.72, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35
    sol = bpy.data.lights.new('sol', 'SUN'); sol.energy = 4.5; sol.angle = math.radians(2); so = bpy.data.objects.new('sol', sol); so.rotation_euler = (math.radians(50), 0, math.radians(35)); cena.collection.objects.link(so)
    chao = bpy.data.meshes.new('chao'); oc = bpy.data.objects.new('chao', chao); cena.collection.objects.link(oc)
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=40); bm.to_mesh(chao); bm.free(); oc.data.materials.append(argila((0.5, 0.48, 0.44)))
    for nome, loc, alvo, lente in [('lado', (-0.5, -17, 3.0), (-0.6, 0, 2.6), 35), ('tresq', (8.5, -9.5, 4.2), (0.8, 0, 2.6), 35), ('tras', (-11, 8, 5.5), (0, 0, 2.6), 35),
                                   ('frente', (11, 0.01, 3.3), (0.5, 0, 2.6), 38), ('cabeca', (6.6, -2.4, 4.2), (4.6, 0, 3.6), 45), ('cima', (0.0, -0.01, 18), (-0.6, 0, 2.5), 40)]:
        cd = bpy.data.cameras.new(nome); cd.lens = lente; oc2 = bpy.data.objects.new(nome, cd); oc2.location = loc; cena.collection.objects.link(oc2)
        al = bpy.data.objects.new('alvo_' + nome, None); al.location = alvo; cena.collection.objects.link(al)
        c = oc2.constraints.new('TRACK_TO'); c.target = al; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
        cena.camera = oc2; cena.render.filepath = PREVIA.replace('.png', f'_{nome}.png'); bpy.ops.render.render(write_still=True)

if SAIDA and ETAPA == 'tudo':
    bpy.ops.export_scene.gltf(filepath=SAIDA, export_format='GLB')
