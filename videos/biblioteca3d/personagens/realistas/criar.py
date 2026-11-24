# Gera o LUCAS realista no Blender a partir dos DADOS do MakeHuman (malha base hm08, alvos de forma, esqueleto "game_engine", roupas/cabelo como proxies),
# sem executar código de terceiros: só lê arquivos (.obj, .target.gz, .mhclo, .json, texturas) e monta tudo com bpy. Exporta GLB com esqueleto,
# pesos, alvos de expressão (morph targets) e texturas, para o Three.js do canal.
#
# uso: python3 texturas_lucas.py ... --saida <tex>   e depois
#      blender -b --python criar_lucas.py -- --dados <mpfbdata/data> --assets <mhdata> --texturas <tex> --saida lucas12.glb [--idade 12 --magreza 1.0 --roupa casa|carro --previa previa.png]
#
# Licenças: malha base, alvos e assets do MakeHuman: modelos exportados são CC0 (makehumancommunity.org/content/license_explanation.html).
import bpy, bmesh, gzip, json, math, os, sys
import numpy as np

A = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(n, d=None): return A[A.index('--' + n) + 1] if '--' + n in A else d
DADOS, ASSETS, SAIDA, PREVIA, TEX = arg('dados'), arg('assets'), arg('saida'), arg('previa'), arg('texturas')
FICHA = json.load(open(arg('ficha'))); CAB = FICHA.get('cabelo', {'tipo': 'mechas'}); CABELO = CAB['tipo']; R_ = FICHA['roupa']

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mh import ler_obj, ler_alvo, corpo, centro as _centro, ler_mhclo, encaixar, recortar_roupa, cabelo_procedural, medidas_quepe, queda_quepe, borda_quepe, medidas_cabeca
V, base_VT, base_F, base_G, grupos = corpo(DADOS, FICHA['corpo'])
T = os.path.join(DADOS, 'targets')
def centro(g): return _centro(V, grupos, g)
para_b = lambda P: np.stack([P[..., 0] * 0.1, -P[..., 2] * 0.1, P[..., 1] * 0.1], axis=-1)   # OBJ (dm, y para cima) -> Blender (m, z para cima)

# ------------------------------------------------------------------------------------------------ cena
bpy.ops.wm.read_factory_settings(use_empty=True)
cena = bpy.context.scene

# esqueleto "game_engine" (nomes estilo Unreal: pelvis, spine_01..03, neck_01, head, clavicle/upperarm/lowerarm/hand, thigh/calf/foot/ball)
rig = json.load(open(os.path.join(DADOS, 'rigs/standard/rig.game_engine.json')))
pesos = json.load(open(os.path.join(DADOS, 'rigs/standard/weights.game_engine.json')))['weights']
def ponto(spec):
    if spec['strategy'] == 'CUBE': return para_b(centro(spec['cube_name']))
    return para_b(V[spec['vertex_indices']].mean(axis=0))
arm_dados = bpy.data.armatures.new(FICHA['nome'] + '_rig'); arm = bpy.data.objects.new(FICHA['nome'], arm_dados); cena.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
for nome, b in rig.items():
    eb = arm_dados.edit_bones.new(nome); eb.head = ponto(b['head']); eb.tail = ponto(b['tail']); eb.roll = b.get('roll', 0)
    if (eb.tail - eb.head).length < 1e-4: eb.tail = eb.head + np.array([0, 0, 0.02])
for nome, b in rig.items():
    if b.get('parent'): arm_dados.edit_bones[nome].parent = arm_dados.edit_bones[b['parent']]; arm_dados.edit_bones[nome].use_connect = False
bpy.ops.object.mode_set(mode='OBJECT')

# pesos por vértice da malha base (lista bone -> [(vi, w)])
W = {}
for osso, lst in pesos.items():
    for vi, w in lst: W.setdefault(vi, []).append((osso, w))

# alvos de expressão (morph targets) caucasianos
EXPR = ['eye-left-closure', 'eye-right-closure', 'eyebrows-left-inner-up', 'eyebrows-right-inner-up', 'eyebrows-left-down', 'eyebrows-right-down',
        'mouth-open', 'mouth-depression', 'mouth-compression', 'mouth-corner-puller', 'mouth-pursing', 'mouth-elevation', 'eye-left-slit', 'eye-right-slit',
        'nose-left-dilatation', 'nose-right-dilatation', 'mouth-retraction', 'mouth-parling']
DELTAS = {}
for e in EXPR:
    c = f'{T}/expression/units/caucasian/{e}.target.gz'
    if os.path.exists(c): i, d = ler_alvo(c); D = np.zeros_like(V); D[i] = d; DELTAS[e] = D

def criar_malha(nome, Vb_obj, faces, uvs_por_face, refs=None, mat=None, apagar_faces=None, so_osso=None):
    """Vb_obj: vértices no espaço OBJ; faces: listas de índices; uvs_por_face: listas de (u,v); refs: (idx Nx3, w Nx3) para herdar pesos/expressões da base."""
    me = bpy.data.meshes.new(nome); P = para_b(Vb_obj)
    me.from_pydata(P.tolist(), [], faces); me.update()
    uv = me.uv_layers.new(name='UV')
    k = 0
    for poly, fu in zip(me.polygons, uvs_por_face):
        for li, (u, v) in zip(poly.loop_indices, fu): uv.data[li].uv = (u, v)
    ob = bpy.data.objects.new(nome, me); cena.collection.objects.link(ob); ob.parent = arm
    mod = ob.modifiers.new('rig', 'ARMATURE'); mod.object = arm
    for osso in rig: ob.vertex_groups.new(name=osso)
    n = len(Vb_obj)
    for vi in range(n):
        if so_osso: lst = [(so_osso, 1.0)]
        elif refs is None: lst = W.get(vi, [])
        else:
            acc = {}
            for bi, bw in zip(refs[0][vi], refs[1][vi]):
                for osso, w in W.get(int(bi), []): acc[osso] = acc.get(osso, 0) + w * bw
            lst = list(acc.items())
        tot = sum(w for _, w in lst) or 1
        for osso, w in sorted(lst, key=lambda x: -x[1])[:4]: ob.vertex_groups[osso].add([vi], w / tot, 'REPLACE')
    if DELTAS and not so_osso:
        ob.shape_key_add(name='Basis')
        for e, D in DELTAS.items():
            sk = ob.shape_key_add(name=e)
            Dp = D[:n] if refs is None else (D[refs[0]] * refs[1][..., None]).sum(axis=1)
            if np.abs(Dp).max() < 1e-6: ob.shape_key_remove(sk); continue
            Pk = para_b(Vb_obj + Dp); sk.data.foreach_set('co', Pk.ravel())
    if mat: ob.data.materials.append(mat)
    for p in ob.data.polygons: p.use_smooth = True
    return ob

# ------------------------------------------------------------------------------------------------ materiais
def img(caminho): return bpy.data.images.load(caminho, check_existing=True)
def mat_pbr(nome, cor=None, tex=None, normal=None, rug=0.6, alfa=None, sss=0.0, brilho_esp=0.5, dupla=False):
    m = bpy.data.materials.new(nome); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value = rug; b.inputs['Specular IOR Level'].default_value = brilho_esp
    if cor: b.inputs['Base Color'].default_value = (*cor, 1)
    if tex:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = img(tex); nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
        if alfa: nt.links.new(t.outputs['Alpha'], b.inputs['Alpha']); m.blend_method = 'HASHED'
    if normal and os.path.exists(normal):
        tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = img(normal); tn.image.colorspace_settings.name = 'Non-Color'
        nm = nt.nodes.new('ShaderNodeNormalMap'); nt.links.new(tn.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    if sss: b.inputs['Subsurface Weight'].default_value = sss; b.inputs['Subsurface Radius'].default_value = (1.0, 0.35, 0.2); b.inputs['Subsurface Scale'].default_value = 0.012
    m.use_backface_culling = not dupla
    return m

m_pele = mat_pbr('pele', tex=os.path.join(TEX, 'pele.jpg'), rug=FICHA.get('pele', {}).get('rugosidade', 0.52), sss=0.25, brilho_esp=0.45)
m_olho = mat_pbr('olho', tex=os.path.join(TEX, 'olho.jpg'), rug=0.08, brilho_esp=0.8)
SUIT = R_['suit']
m_roupa = mat_pbr('roupa', tex=os.path.join(TEX, 'roupa.jpg'), normal=os.path.join(ASSETS, f'clothes/{SUIT}/{SUIT}_normal.png'), rug=0.9, brilho_esp=0.2, dupla=True)
m_cabelo = mat_pbr('cabelo', tex=os.path.join(TEX, 'mecha.png' if CABELO == 'mechas' else 'cabelo.png'), normal=os.path.join(ASSETS, f'hair/{CABELO}/{CABELO}_normal.png'), rug=0.55, alfa=True, dupla=True, brilho_esp=0.3)
m_sobr = mat_pbr('sobrancelha', tex=os.path.join(TEX, 'sobrancelha.png'), rug=0.7, alfa=True, dupla=True)
m_cilio = mat_pbr('cilios', tex=os.path.join(TEX, 'cilios.png'), rug=0.7, alfa=True, dupla=True)
m_dente = mat_pbr('dentes', cor=(0.88, 0.85, 0.78), rug=0.3)
m_lingua = mat_pbr('lingua', cor=(0.62, 0.30, 0.30), rug=0.4)

# ------------------------------------------------------------------------------------------------ montagem: proxies primeiro (eles dizem o que apagar do corpo)
apagar = set(); ENCAIXADOS = {}
def proxy(caminho_mhclo, nome, mat, roupa=None, corte=None):
    """corte(P) -> máscara dos vértices que podem ficar (ex.: cabelo abaixo da borda do quepe); faces só com vértices cortados saem"""
    info = ler_mhclo(caminho_mhclo); Pv, idx, w = encaixar(info, V)
    Vp, VTp, Fp, _ = ler_obj(os.path.join(os.path.dirname(caminho_mhclo), info['obj']))
    if corte is not None: fica = corte(Pv); Fp = [f for f in Fp if fica[f[0]].any()]
    ENCAIXADOS[nome] = (Pv, sorted(set(i for f in Fp for i in f[0])))
    if roupa:
        mant, _, esconder, Pn = recortar_roupa(V, grupos, Pv, [f[0] for f in Fp], info['delete'], None, uvs=[[VTp[t] for t in f[1]] for f in Fp], manga=roupa.get('manga', 'curta'), perna=roupa.get('perna', 'longa')); Fp = [Fp[k] for k in mant]
        mud = np.where(np.linalg.norm(Pn - Pv, axis=1) > 1e-6)[0]                 # vértices trazidos para a barra: pesos do vértice do corpo mais próximo
        if len(mud):
            cb = np.array(sorted(set(i for (vs, _), g in zip(base_F, base_G) if g == 'body' for i in vs))); idx = idx.copy(); w = np.array(w, float).copy()
            for i in mud: j = cb[np.argmin(np.linalg.norm(V[cb] - Pn[i], axis=1))]; idx[i] = [j, j, j]; w[i] = [1, 0, 0]
        Pv = Pn
    else: esconder = info['delete']
    apagar.update(esconder)
    return criar_malha(nome, Pv, [vs for vs, _ in Fp], [[VTp[t] for t in ts] for _, ts in Fp], refs=(idx, w), mat=mat)
proxy(os.path.join(ASSETS, f'clothes/{SUIT}/{SUIT}.mhclo'), 'roupa', m_roupa, roupa=R_)
if CABELO == 'mechas':
    QP = medidas_quepe(V, grupos, base_F, base_G) if 'quepe' in FICHA.get('extras', []) else None                  # com quepe: cabelo só abaixo da faixa
    Vh, Fh, UVh, _ = cabelo_procedural(V, grupos, base_F, base_G, n=int(CAB.get('n', 3600)), comp=CAB.get('comp', 1.0), franja=CAB.get('franja', True), quepe=QP, curto=CAB.get('curto', False)); criar_malha('cabelo', Vh, Fh, UVh, refs=None, mat=m_cabelo, so_osso='head')
else:
    QP = medidas_quepe(V, grupos, base_F, base_G) if 'quepe' in FICHA.get('extras', []) else None
    corte = (lambda P: P[:, 1] < borda_quepe(QP, P[:, 0], P[:, 2]) + 0.04 * QP['k']) if QP else None      # sob o quepe: só o que aparece abaixo da faixa
    proxy(os.path.join(ASSETS, f'hair/{CABELO}/{CABELO}.mhclo'), 'cabelo', m_cabelo, corte=corte)
SB = FICHA.get('sobrancelha', 'eyebrow001'); proxy(os.path.join(ASSETS, f'eyebrows/{SB}/{SB}.mhclo'), 'sobrancelhas', m_sobr)
if FICHA.get('sapatos'):
    SP_ = FICHA['sapatos']['tipo']; proxy(os.path.join(ASSETS, f'clothes/{SP_}/{SP_}.mhclo'), 'sapatos', mat_pbr('sapatos', tex=os.path.join(TEX, 'sapatos.png'), normal=os.path.join(ASSETS, f'clothes/{SP_}/{SP_}_normal.png'), rug=0.45, brilho_esp=0.5))
proxy(os.path.join(ASSETS, 'eyelashes/eyelashes01/eyelashes01.mhclo'), 'cilios', m_cilio)
proxy(os.path.join(ASSETS, 'teeth/teeth_base/teeth_base.mhclo'), 'dentes', m_dente)
proxy(os.path.join(ASSETS, 'tongue/tongue01/tongue01.mhclo'), 'lingua', m_lingua)

# corpo: só as faces "body" (sem auxiliares), sem as faces cobertas pela roupa
faces, uvs, usados = [], [], set()
for (vs, ts), g in zip(base_F, base_G):
    if g != 'body' or any(i in apagar for i in vs): continue
    faces.append(vs); uvs.append([base_VT[t] for t in ts]); usados.update(vs)
mapa = {o: n for n, o in enumerate(sorted(usados))}; inv = np.array(sorted(usados))
corpo = criar_malha('corpo', V[inv], [[mapa[i] for i in f] for f in faces], uvs, refs=(np.stack([inv, inv, inv], 1), np.tile([1.0, 0, 0], (len(inv), 1))), mat=m_pele)

# olhos: esferas UV no centro de cada olho auxiliar (polo da frente = pupila), presas 100% ao osso da cabeça
def esfera(c, r, nseg=32, nan=24):
    Vs, F, UV = [], [], []
    for j in range(nan + 1):
        th = math.pi * j / nan                                       # 0 = polo da frente (+z no OBJ)
        for i in range(nseg + 1):
            ph = 2 * math.pi * i / nseg
            Vs.append([c[0] + r * math.sin(th) * math.cos(ph), c[1] + r * math.sin(th) * math.sin(ph), c[2] + r * math.cos(th)])
    for j in range(nan):
        for i in range(nseg):
            a = j * (nseg + 1) + i; F.append([a, a + nseg + 1, a + nseg + 2, a + 1])
            UV.append([(i / nseg, 1 - j / nan), (i / nseg, 1 - (j + 1) / nan), ((i + 1) / nseg, 1 - (j + 1) / nan), ((i + 1) / nseg, 1 - j / nan)])
    return np.array(Vs), F, UV
for lado, g in (('E', 'helper-l-eye'), ('D', 'helper-r-eye')):
    pts = V[sorted(grupos[g])]; c = pts.mean(axis=0); r = np.abs(pts - c).max(axis=0).mean() * 0.97
    Ve, Fe, UVe = esfera(c, r)
    ob = criar_malha('olho' + lado, Ve, Fe, UVe, refs=None, mat=m_olho, so_osso='head')

# extras: quepe de polícia (copa, faixa, aba e distintivo), preso à cabeça
if 'quepe' in FICHA.get('extras', []):
    Q_ = medidas_quepe(V, grupos, base_F, base_G); yb, k_, cx, cz, rx, rz = Q_['yb'], Q_['k'], Q_['cx'], Q_['cz'], Q_['rx'], Q_['rz']
    # quepe MOLDADO na cabeça (e no cabelo): para cada ângulo, o raio real da cabeça na altura da faixa + folga; copa acima do topo do crânio
    olhos_, _, _, orelhas_ = medidas_cabeca(V, grupos, base_F, base_G)
    cab_idx = sorted(set(i for (vs, _), g in zip(base_F, base_G) if g == 'body' for i in vs)); Hd = V[cab_idx]
    Hd = Hd[(Hd[:, 1] > olhos_[1] - 0.25 * k_) & np.all([np.linalg.norm(Hd - o, axis=1) > 0.32 * k_ for o in orelhas_], axis=0)]
    if 'cabelo' in ENCAIXADOS: Pc, ic = ENCAIXADOS['cabelo']; Hd = np.vstack([Hd, Pc[ic]])
    ang_v = np.arctan2(Hd[:, 0] - cx, Hd[:, 2] - cz); rad_v = np.hypot(Hd[:, 0] - cx, Hd[:, 2] - cz)
    NS = 48; angs = 2 * np.pi * np.arange(NS) / NS
    def raio_em(a, y0, y1):
        d = np.abs((ang_v - a + np.pi) % (2 * np.pi) - np.pi); m = (d < 0.20) & (Hd[:, 1] > y0) & (Hd[:, 1] < y1)
        return rad_v[m].max() if m.any() else None
    Rb = []
    for a in angs:
        yq = yb + float(queda_quepe(Q_, a)); r = raio_em(a, yq - 0.02 * k_, yq + 0.32 * k_); Rb.append(r if r is not None else (rx + rz) / 2)
    Rb = np.array(Rb); Rb = np.array([np.mean(np.take(Rb, range(i - 2, i + 3), mode='wrap')) for i in range(NS)]) + 0.03    # suaviza e dá folga de 3 mm
    # perfil de quepe policial: faixa reta (até 0,30), copa que abre ~30% e tampo achatado (mais alto na frente pelo termo `sobe`)
    PERFIL = [(-0.01, 1.00, 0), (0.30, 1.01, 0), (0.36, 1.08, 0.5), (0.45, 1.21, 1), (0.52, 1.29, 1), (0.55, 1.26, 1), (0.57, 1.00, 1), (0.585, 0.0, 1)]
    def montar(sobra):
        P_ = []
        for jr, (hh, esc, sobe) in enumerate(PERFIL):
            for i, a in enumerate(angs):
                h2 = hh if hh <= 0.30 else hh + sobra; fr = max(0.0, math.cos(a)) * min(1.0, sobe)
                P_.append([cx + Rb[i] * esc * math.sin(a), yb + float(queda_quepe(Q_, a)) + h2 * k_ + 0.12 * k_ * fr ** 2, cz + Rb[i] * esc * math.cos(a)])
        P_ = np.array(P_).reshape(len(PERFIL), NS, 3); P_[-1, :, 1] = P_[-2, :, 1].mean() + 0.015 * k_      # tampo: ponto central numa altura só
        return P_.reshape(-1, 3)
    idx_a = np.round((ang_v % (2 * np.pi)) / (2 * np.pi) * NS).astype(int) % NS
    def superficie(Pq, rv, ia):
        """altura do quepe acima de um ponto (raio rv no ângulo ia): interpola entre os anéis da copa pelo raio"""
        R_ = np.hypot(Pq[:, ia, 0] - cx, Pq[:, ia, 2] - cz); Y_ = Pq[:, ia, 1]
        if rv >= R_.max(): return 1e9                                             # fora da largura do quepe (rosto, orelha): não conta
        for j in range(len(PERFIL) - 1, 0, -1):
            if R_[j - 1] >= rv and R_[j] <= rv:                                   # entre o anel j-1 (mais largo) e o j (mais estreito, mais alto)
                t = (R_[j - 1] - rv) / max(R_[j - 1] - R_[j], 1e-6); return Y_[j - 1] + t * (Y_[j] - Y_[j - 1])
        return Y_[-1] if rv <= R_[-1] else -1e9
    sobra = 0.0
    for _ in range(15):                                                       # levanta a copa só o necessário para nada da cabeça/cabelo atravessar
        Pq = montar(sobra).reshape(len(PERFIL), NS, 3)
        acima = Hd[:, 1] > yb - 0.3 * k_
        viol = [Hd[v, 1] - (superficie(Pq, rad_v[v], idx_a[v]) - 0.035) for v in np.where(acima)[0]]          # todos os pontos (1 em 3 deixava o topo do crânio furar o tampo)
        fora = max(viol) if viol else 0.0
        if fora <= 0: break
        sobra += fora / k_ + 0.005
    print('QUEPE: folga extra da copa', round(sobra, 3), 'k')
    Vq = montar(sobra).tolist(); Fq, UVq = [], []
    for j in range(len(PERFIL) - 1):
        for i in range(NS):
            a, b = j * NS + i, j * NS + (i + 1) % NS; Fq.append([a, b, b + NS, a + NS]); UVq.append([(i / NS, j / 7), ((i + 1) / NS, j / 7), ((i + 1) / NS, (j + 1) / 7), (i / NS, (j + 1) / 7)])
    Rf = float(Rb[0])                                                         # raio da faixa na frente (aba e distintivo)
    criar_malha('quepe', np.array(Vq), Fq, UVq, mat=mat_pbr('quepe', cor=(0.018, 0.026, 0.060), rug=0.75, brilho_esp=0.3, dupla=True), so_osso='head')   # dupla: o tampo não some visto de cima
    Va, Fa, UVa = [], [], []                                                      # aba: meia elipse na frente, inclinada para baixo
    for j in range(6):
        for i in range(21):
            a = math.pi * (i / 20 - 0.5) * 0.95; r_ = 1.0 + 0.55 * j / 5
            ri_ = float(np.interp(a % (2 * np.pi), np.append(angs, 2 * np.pi), np.append(Rb, Rb[0])))
            Va.append([cx + ri_ * 0.99 * r_ * math.sin(a), yb + float(queda_quepe(Q_, a)) + 0.02 - 0.13 * k_ * (j / 5) ** 1.3, cz + ri_ * 0.99 * (1 + 0.62 * j / 5) * math.cos(a)])
    for j in range(5):
        for i in range(20):
            a = j * 21 + i; Fa.append([a, a + 1, a + 22, a + 21]); UVa.append([(0, 0), (1, 0), (1, 1), (0, 1)])
    criar_malha('aba', np.array(Va), Fa, UVa, mat=mat_pbr('aba', cor=(0.008, 0.008, 0.010), rug=0.55, brilho_esp=0.25, dupla=True), so_osso='head')
    Pf = np.array(Vq).reshape(len(PERFIL), NS, 3)[:, 0]                       # perfil da copa na frente (ângulo 0)
    c0 = (Pf[2] + Pf[3]) / 2; nrm_ = np.array([0.0, -(Pf[3][2] - Pf[2][2]), Pf[3][1] - Pf[2][1]]); nrm_ /= np.linalg.norm(nrm_) + 1e-9
    if nrm_[2] < 0: nrm_ = -nrm_
    up_ = np.cross(nrm_, [1.0, 0, 0]); up_ = -up_ if up_[1] < 0 else up_; c0 = c0 + nrm_ * 0.012          # distintivo dourado colado na frente da copa
    Vd, Fd, UVd = [list(c0 + nrm_ * 0.004)], [], []
    for i in range(16): a = 2 * math.pi * i / 16; Vd.append(list(c0 + np.array([1.0, 0, 0]) * 0.065 * k_ * math.sin(a) + up_ * 0.075 * k_ * math.cos(a)))
    for i in range(16): Fd.append([0, 1 + i, 1 + (i + 1) % 16]); UVd.append([(0.5, 0.5), (0, 0), (1, 0)])
    criar_malha('distintivo', np.array(Vd), Fd, UVd, mat=mat_pbr('distintivo', cor=(0.80, 0.58, 0.18), rug=0.25), so_osso='head')

# chão em z = 0: desloca o esqueleto (e tudo o que é filho)
CORPO_IDX = sorted(set(i for (vs, _), g in zip(base_F, base_G) if g == 'body' for i in vs))
zmin = float(para_b(V[CORPO_IDX])[:, 2].min())                                   # sola dos pés (mesmo com sapato cobrindo o pé)
arm.location.z = -zmin
bpy.context.view_layer.update()

# ------------------------------------------------------------------------------------------------ prévia (Cycles) e exportação
if PREVIA:
    cena.render.engine = 'CYCLES'; cena.cycles.samples = 48; cena.cycles.use_denoising = True; cena.cycles.device = 'CPU'
    cena.render.resolution_x, cena.render.resolution_y = 900, 1200; cena.render.film_transparent = False
    w = bpy.data.worlds.new('mundo'); cena.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.62, 0.64, 0.68, 1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
    altura = max((corpo.matrix_world @ v.co).z for v in corpo.data.vertices)
    def luz(nome, tipo, loc, en, tam=1.0):
        l = bpy.data.lights.new(nome, tipo); l.energy = en
        if tipo == 'AREA': l.size = tam
        o = bpy.data.objects.new(nome, l); o.location = loc; cena.collection.objects.link(o)
        c = o.constraints.new('TRACK_TO'); c.target = arm; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'; return o
    luz('chave', 'AREA', (1.4, -2.2, altura * 1.1), 260, 1.5); luz('recorte', 'AREA', (-1.6, 1.4, altura * 1.2), 180, 1.0); luz('enche', 'AREA', (-2.0, -1.8, altura * 0.6), 60, 2.0)
    chao = bpy.data.meshes.new('chao'); oc = bpy.data.objects.new('chao', chao); cena.collection.objects.link(oc)
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=6); bm.to_mesh(chao); bm.free(); oc.data.materials.append(mat_pbr('chao', cor=(0.55, 0.56, 0.58), rug=0.8))
    for nome_c, loc, alvo_z, lente in [('frente', (0.0, -2.2, altura * 0.62), altura * 0.55, 50), ('rosto', (0.18, -0.75, altura * 0.93), altura * 0.92, 85), ('nuca', (-0.45, 0.62, altura * 0.95), altura * 0.90, 70), ('lado', (-0.70, 0.02, altura * 0.92), altura * 0.915, 85), ('topo', (0.25, 0.30, altura * 1.18), altura * 0.93, 70), ('tresq', (0.62, -0.95, altura * 0.97), altura * 0.93, 60)]:   # nuca, orelha e topo: conferir cabelo, orelha e quepe
        cd = bpy.data.cameras.new(nome_c); cd.lens = lente; oc2 = bpy.data.objects.new(nome_c, cd); oc2.location = loc; cena.collection.objects.link(oc2)
        alvo = bpy.data.objects.new('alvo_' + nome_c, None); alvo.location = (0, 0, alvo_z); cena.collection.objects.link(alvo)
        c = oc2.constraints.new('TRACK_TO'); c.target = alvo; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
        cena.camera = oc2; cena.render.filepath = PREVIA.replace('.png', f'_{nome_c}.png'); bpy.ops.render.render(write_still=True)

bpy.ops.object.select_all(action='DESELECT')
for o in cena.objects:
    if o == arm or o.parent == arm: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=SAIDA, export_format='GLB', use_selection=True, export_skins=True, export_morph=True, export_apply=False, export_image_format='JPEG', export_jpeg_quality=88, export_yup=True, export_animations=False)
print('PRONTO', SAIDA, 'altura', round(float(para_b(V[CORPO_IDX])[:, 2].max()) - zmin, 3))
