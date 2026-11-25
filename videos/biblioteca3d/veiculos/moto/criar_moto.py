# MOTO ESPORTIVA VERMELHA (classe 600 cc), feita por script no Blender. Genérica e fictícia ("HRYZ"), sem copiar modelo real.
# Proporções típicas das esportivas de 600 cc: entre-eixos ~1,375 m, comprimento ~2,03 m, banco a ~0,83 m, cáster 24° e trail ~97 mm,
# pneus 120/70 ZR17 (Ø ~0,60 m) e 180/55 ZR17 (Ø ~0,63 m), discos dianteiros duplos de 310 mm com pinças radiais de 4 pistões.
# Peças móveis (nós separados para o jogo animar):
#   Direcao      — gira no eixo da coluna (local Z no Blender = Y no glTF): garfo, mesas, semiguidões, manetes, roda e para-lama dianteiros
#   RodaDianteira, RodaTraseira — giram no eixo X; Balanca — gira no eixo X no pivô (leva a roda traseira, a coroa e a pinça de trás)
#   Descanso     — descanso lateral (gira no eixo do pivô)
# Marcadores: Farol, Lanterna, Assento (onde o piloto senta), Pe (pedaleira), Mao (manopla).
# Eixos no Blender: frente para -Y, z para cima, origem no chão entre os eixos. No glTF/Three.js: frente para +Z, y para cima.
# uso: blender -b -P criar_moto.py -- [--glb arquivo.glb] [--render pasta] [--amostras 64]
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix, Euler
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
arg = lambda n, d=None: argv[argv.index('--' + n) + 1] if '--' + n in argv else d
PI = math.pi

# ------------------------------------------------------------------------------------------------ medidas
EE = 1.375                                   # entre-eixos
RF, RT = 0.300, 0.315                        # raio dos pneus (dianteiro, traseiro)
AF = Vector((0, -0.690, RF))                 # eixo dianteiro
AT = Vector((0, 0.685, RT))                  # eixo traseiro
CASTER = math.radians(24)
U = Vector((0, math.sin(CASTER), math.cos(CASTER)))      # eixo da coluna de direção (para cima e para trás)
OFF = 0.034                                  # avanço do garfo (perpendicular à coluna)
G0 = Vector((0, AF.y - 0.097, 0))            # coluna de direção encontra o chão (trail ~97 mm à frente do contato)
COL = lambda z: G0 + U * (z / U.z)           # ponto da coluna na altura z
PIVO = Vector((0, 0.130, 0.420))             # pivô da balança
PINHAO = Vector((0.118, 0.055, 0.395))       # pinhão (lado esquerdo do piloto = +X)


def limpar():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(nome, cor, rough=0.5, metal=0.0, coat=0.0, emis=None, forca=0.0, transm=0.0, alpha=1.0):
    m = bpy.data.materials.new(nome); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*cor, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if coat: b.inputs['Coat Weight'].default_value = coat; b.inputs['Coat Roughness'].default_value = 0.04
    if emis: b.inputs['Emission Color'].default_value = (*emis, 1); b.inputs['Emission Strength'].default_value = forca
    if transm: b.inputs['Transmission Weight'].default_value = transm
    if alpha < 1: b.inputs['Alpha'].default_value = alpha; m.surface_render_method = 'BLENDED'
    return m


def materiais():
    return {
        'pintura': mat('pintura_vermelha', (0.62, 0.012, 0.016), 0.22, 0.35, coat=1.0),
        'branco': mat('grafismo_branco', (0.85, 0.86, 0.87), 0.3, 0.0, coat=1.0),
        'preto': mat('plastico_preto', (0.018, 0.018, 0.02), 0.55, 0.0),
        'fosco': mat('preto_fosco', (0.03, 0.03, 0.032), 0.8, 0.0),
        'carbono': mat('carbono', (0.025, 0.026, 0.03), 0.3, 0.4, coat=0.8),
        'aluminio': mat('aluminio', (0.72, 0.73, 0.75), 0.32, 1.0),
        'quadro': mat('quadro_aluminio_escovado', (0.55, 0.56, 0.58), 0.4, 1.0),
        'cromo': mat('cromo', (0.9, 0.9, 0.92), 0.06, 1.0),
        'dourado': mat('dourado_anodizado', (0.86, 0.58, 0.14), 0.25, 1.0),
        'titanio': mat('titanio', (0.42, 0.4, 0.42), 0.3, 1.0),
        'motor': mat('motor_preto', (0.045, 0.045, 0.05), 0.42, 0.6),
        'disco': mat('disco_aco', (0.6, 0.6, 0.62), 0.35, 1.0),
        'borracha': mat('borracha', (0.022, 0.022, 0.024), 0.88, 0.0),
        'banco': mat('banco', (0.03, 0.03, 0.033), 0.72, 0.0),
        'roda': mat('roda_preta', (0.02, 0.02, 0.022), 0.35, 0.5, coat=0.6),
        'pinca': mat('pinca_vermelha', (0.7, 0.03, 0.02), 0.3, 0.2),
        'mola': mat('mola_amarela', (0.95, 0.72, 0.05), 0.35, 0.2),
        'bolha': mat('bolha_fume', (0.05, 0.05, 0.06), 0.03, 0.0, transm=1.0, alpha=0.55),
        'vidroFarol': mat('vidro_farol', (0.85, 0.88, 0.9), 0.02, 0.0, transm=1.0, alpha=0.35),
        'led': mat('led_branco', (1, 1, 1), 0.2, 0.0, emis=(0.9, 0.95, 1.0), forca=6.0),
        'lanterna': mat('lanterna_vermelha', (0.5, 0.0, 0.0), 0.15, 0.0, emis=(1.0, 0.03, 0.02), forca=4.0),
        'pisca': mat('pisca_ambar', (0.9, 0.45, 0.02), 0.2, 0.0, emis=(1.0, 0.45, 0.0), forca=0.5),
        'tela': mat('tela_painel', (0.02, 0.03, 0.05), 0.1, 0.0, emis=(0.15, 0.4, 0.9), forca=1.2),
        'espelho': mat('espelho', (0.9, 0.92, 0.95), 0.02, 1.0),
        'corrente': mat('corrente', (0.25, 0.22, 0.2), 0.45, 1.0),
        'placa': mat('placa', (0.92, 0.92, 0.9), 0.5, 0.0),
    }


# ------------------------------------------------------------------------------------------------ construtores
def ligar(o, pai):
    bpy.context.view_layer.update(); mw = o.matrix_world.copy(); o.parent = pai; o.matrix_world = mw


def vazio(nome, loc, pai=None, rot=(0, 0, 0)):
    e = bpy.data.objects.new(nome, None); bpy.context.scene.collection.objects.link(e); e.location = loc; e.rotation_euler = rot; e.empty_display_size = 0.05
    if pai: ligar(e, pai)
    return e


def malha(nome, V, F, m, suave=True, subd=0, solido=0.0, bev=0.0, angulo=40, pai=None):
    me = bpy.data.meshes.new(nome); me.from_pydata([tuple(v) for v in V], [], F); me.update()
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(nome, me); bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(m)
    if solido: md = o.modifiers.new('s', 'SOLIDIFY'); md.thickness = solido; md.offset = 0
    if bev: md = o.modifiers.new('b', 'BEVEL'); md.width = bev; md.segments = 2; md.limit_method = 'ANGLE'
    if subd: md = o.modifiers.new('sub', 'SUBSURF'); md.levels = subd; md.render_levels = subd
    for p in me.polygons: p.use_smooth = suave
    if suave and not subd:
        try:
            bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.shade_smooth_by_angle(angle=math.radians(angulo)); o.select_set(False)
        except Exception: pass
    if pai: ligar(o, pai)
    return o


def loft(nome, loops, m, tampa=(True, True), fechado=True, **kw):
    n = len(loops[0]); V = [v for L in loops for v in L]; F = []
    for i in range(len(loops) - 1):
        for j in range(n if fechado else n - 1):
            a = i * n + j; b = i * n + (j + 1) % n; F.append((a, b, b + n, a + n))
    if fechado and tampa[0]: F.append(tuple(range(n))[::-1])
    if fechado and tampa[1]: F.append(tuple(range((len(loops) - 1) * n, len(loops) * n)))
    return malha(nome, V, F, m, **kw)


def sec(y, zc, w, ht, hb=None, n=2.6, k=32, xc=0.0, nb=None):
    """seção superelíptica no plano XZ na estação y (meia-largura w, meia-altura em cima ht e embaixo hb)"""
    hb = ht if hb is None else hb; nb = n if nb is None else nb; pts = []
    for i in range(k):
        t = 2 * PI * i / k; c, s = math.cos(t), math.sin(t); e = n if s >= 0 else nb
        pts.append(Vector((xc + w * math.copysign(abs(c) ** (2 / e), c), y, zc + (ht if s >= 0 else hb) * math.copysign(abs(s) ** (2 / e), s))))
    return pts


def revolucao(nome, perfil, m, seg=72, fechar=False, centro=(0, 0, 0), **kw):
    """superfície de revolução em torno do eixo X; perfil = [(x lateral, raio)]"""
    n = len(perfil); V = []; F = []
    for i in range(seg):
        a = 2 * PI * i / seg
        for (x, r) in perfil: V.append(Vector((centro[0] + x, centro[1] + r * math.cos(a), centro[2] + r * math.sin(a))))
    for i in range(seg):
        for j in range(n if fechar else n - 1):
            a = i * n + j; b = ((i + 1) % seg) * n + j; a2 = i * n + (j + 1) % n; b2 = ((i + 1) % seg) * n + (j + 1) % n
            F.append((a, b, b2, a2))
    return malha(nome, V, F, m, **kw)


def caixa(nome, x0, x1, y0, y1, z0, z1, m, bev=0.002, pai=None):
    c = [Vector((x, y, z)) for z in (z0, z1) for y in (y0, y1) for x in (x0, x1)]
    F = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    return malha(nome, c, F, m, suave=False, bev=bev, pai=pai)


def barra(nome, p0, p1, w0, h0, w1=None, h1=None, m=None, up=(1, 0, 0), bev=0.003, **kw):
    """barra retangular afinando de p0 a p1 (w ao longo de `up`, h na outra direção)"""
    p0, p1 = Vector(p0), Vector(p1); d = (p1 - p0).normalized(); u = Vector(up); u = (u - d * u.dot(d)).normalized(); v = d.cross(u)
    w1 = w0 if w1 is None else w1; h1 = h0 if h1 is None else h1
    ret = lambda p, w, h: [p + u * (sx * w / 2) + v * (sy * h / 2) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    return loft(nome, [ret(p0, w0, h0), ret(p1, w1, h1)], m, suave=False, bev=bev, **kw)


def viga(nome, caminho, larg, alt, m, up=(1, 0, 0), bev=0.004, **kw):
    """viga de seção retangular seguindo um caminho (larguras/alturas podem variar por ponto)"""
    P = [Vector(p) for p in caminho]; L = []
    for i, p in enumerate(P):
        d = (P[min(i + 1, len(P) - 1)] - P[max(i - 1, 0)]).normalized(); u = Vector(up); u = (u - d * u.dot(d)).normalized(); v = d.cross(u)
        w = larg[i] if isinstance(larg, (list, tuple)) else larg; h = alt[i] if isinstance(alt, (list, tuple)) else alt
        L.append([p + u * (sx * w / 2) + v * (sy * h / 2) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
    return loft(nome, L, m, suave=False, bev=bev, **kw)


def cil(nome, p0, p1, r, m, n=28, r2=None, pai=None, angulo=35):
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0
    bpy.ops.mesh.primitive_cone_add(vertices=n, radius1=r, radius2=r if r2 is None else r2, depth=d.length, location=(p0 + p1) / 2)
    o = bpy.context.object; o.name = nome; o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler(); o.data.materials.append(m)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(angulo))
    if pai: ligar(o, pai)
    return o


def esfera(nome, c, r, m, esc=(1, 1, 1), seg=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=r, location=c); o = bpy.context.object; o.name = nome; o.scale = esc
    o.data.materials.append(m); bpy.ops.object.shade_smooth(); return o


def tubo(nome, pts, r, m, raios=None, res=10, perfil=10, tampa=True):
    cu = bpy.data.curves.new(nome, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r; cu.bevel_resolution = max(2, perfil // 4); cu.resolution_u = res; cu.use_fill_caps = tampa
    sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(pts) - 1)
    for i, (bp, p) in enumerate(zip(sp.bezier_points, pts)):
        bp.co = Vector(p); bp.handle_left_type = bp.handle_right_type = 'AUTO'
        if raios: bp.radius = raios[i] / r
    o = bpy.data.objects.new(nome, cu); bpy.context.scene.collection.objects.link(o); o.data.materials.append(m)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.convert(target='MESH'); o = bpy.context.object; bpy.ops.object.shade_smooth()
    return o


def texto(nome, corpo, loc, rot, tam, m, esp=0.0015):
    bpy.ops.object.text_add(location=loc, rotation=rot); o = bpy.context.object; o.name = nome
    o.data.body = corpo; o.data.size = tam; o.data.extrude = esp; o.data.align_x = 'CENTER'; o.data.align_y = 'CENTER'
    try: o.data.font = bpy.data.fonts.load('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')
    except Exception: pass
    o.data.materials.append(m); bpy.ops.object.convert(target='MESH'); return bpy.context.object


def juntar(objs, nome, pai=None):
    objs = [o for o in objs if o]
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True); bpy.context.view_layer.objects.active = o
        for md in list(o.modifiers):
            try: bpy.ops.object.modifier_apply(modifier=md.name)
            except Exception: pass
        o.select_set(False)
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1: bpy.ops.object.join()
    o = bpy.context.object; o.name = nome
    if pai: ligar(o, pai)
    return o


def furar(alvo, furos):
    """furos (lista de objetos) viram buracos no alvo (booleano), e somem"""
    f = juntar(furos, 'furos'); md = alvo.modifiers.new('bool', 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.object = f; md.solver = 'EXACT'
    bpy.context.view_layer.objects.active = alvo; bpy.ops.object.modifier_apply(modifier='bool'); bpy.data.objects.remove(f, do_unlink=True)


def pinca(nome, c, x, r_disco, a0, a1, m, larg=0.05, alt=0.055):
    """pinça de freio abraçando a borda do disco: arco de a0 a a1 (rad, no plano YZ em volta do eixo c), centrada no disco em x"""
    L = []
    for i in range(9):
        a = a0 + (a1 - a0) * i / 8; d = Vector((0, math.cos(a), math.sin(a)))
        rm = r_disco - alt * 0.35; esp = 1 - 0.25 * (2 * i / 8 - 1) ** 4
        L.append([Vector((c[0] + x + sx * larg / 2 * esp, c[1], c[2])) + d * (rm + sy * alt / 2 * esp) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
    return loft(nome, L, m, suave=False, bev=0.006, subd=1)


# ------------------------------------------------------------------------------------------------ rodas
def pneu(nome, r, larg, M, c):
    """pneu com banda arredondada (perfil de esportivo) e um friso na lateral"""
    hs = r - 0.2159                                                   # altura do flanco (aro 17")
    perfil = [(-larg * 0.40, 0.2125), (-larg * 0.47, 0.2159 + hs * 0.25), (-larg * 0.5, 0.2159 + hs * 0.55)] + \
             [(t * larg * 0.48, r - (1 - math.cos(t * 1.2)) * hs * 0.62) for t in [-1 + 2 * i / 18 for i in range(1, 18)]] + \
             [(larg * 0.5, 0.2159 + hs * 0.55), (larg * 0.47, 0.2159 + hs * 0.25), (larg * 0.40, 0.2125)]
    o = revolucao(nome, perfil, M['borracha'], seg=96, centro=c, subd=0)
    friso = revolucao(nome + 'Friso', [(larg * 0.495, 0.2159 + hs * 0.42), (larg * 0.505, 0.2159 + hs * 0.46), (larg * 0.495, 0.2159 + hs * 0.5)], M['fosco'], seg=96, centro=c)
    friso2 = revolucao(nome + 'Friso2', [(-larg * 0.495, 0.2159 + hs * 0.5), (-larg * 0.505, 0.2159 + hs * 0.46), (-larg * 0.495, 0.2159 + hs * 0.42)], M['fosco'], seg=96, centro=c)
    # sulcos da banda (curtos e inclinados, como nos pneus esportivos)
    sulcos = []
    for k in range(18):
        a = 2 * PI * k / 18
        for lado in (1, -1):
            pts = []
            for j in range(5):
                t = j / 4; aa = a + lado * 0.05 + t * 0.16 * lado; x = lado * (larg * 0.12 + t * larg * 0.26)
                rr = r - (1 - math.cos((x / (larg * 0.48)) * 1.2)) * hs * 0.62 + 0.0008
                pts.append((c[0] + x, c[1] + rr * math.cos(aa), c[2] + rr * math.sin(aa)))
            sulcos.append(tubo(nome + f'S{k}{lado}', pts, 0.0028, M['fosco'], res=3, perfil=4))
    return juntar([o, friso, friso2] + sulcos, nome)


def roda(nome, r_pneu, larg_pneu, larg_aro, c, M, discos, lado_coroa=False):
    g = vazio(nome, c)
    pecas = [pneu(nome + 'Pneu', r_pneu, larg_pneu, M, c)]
    ra = 0.2159                                                         # aro de 17"
    aro = revolucao(nome + 'Aro', [(-larg_aro / 2, ra + 0.006), (-larg_aro / 2 + 0.004, ra - 0.012), (-larg_aro / 2 + 0.012, ra - 0.018),
                                   (larg_aro / 2 - 0.012, ra - 0.018), (larg_aro / 2 - 0.004, ra - 0.012), (larg_aro / 2, ra + 0.006),
                                   (larg_aro / 2 - 0.004, ra - 0.004), (-larg_aro / 2 + 0.004, ra - 0.004)], M['roda'], seg=96, fechar=True, centro=c)
    friso = revolucao(nome + 'FrisoVermelho', [(larg_aro / 2 + 0.0005, ra - 0.010), (larg_aro / 2 + 0.0005, ra - 0.004)], M['pinca'], seg=96, centro=c)
    friso2 = revolucao(nome + 'FrisoVermelho2', [(-larg_aro / 2 - 0.0005, ra - 0.004), (-larg_aro / 2 - 0.0005, ra - 0.010)], M['pinca'], seg=96, centro=c)
    cubo = cil(nome + 'Cubo', (c[0] - larg_aro * 0.42, c[1], c[2]), (c[0] + larg_aro * 0.42, c[1], c[2]), 0.045, M['roda'], n=32)
    eixo = cil(nome + 'Eixo', (c[0] - larg_aro * 0.6, c[1], c[2]), (c[0] + larg_aro * 0.6, c[1], c[2]), 0.012, M['aluminio'], n=16)
    raios = []
    for i in range(3):                                                  # 3 pares de raios em Y
        a0 = 2 * PI * i / 3 + PI / 6
        for s in (-1, 1):
            a1 = a0 + s * 0.20
            p0 = Vector((c[0], c[1] + 0.05 * math.cos(a0), c[2] + 0.05 * math.sin(a0)))
            p1 = Vector((c[0], c[1] + (ra - 0.016) * math.cos(a1), c[2] + (ra - 0.016) * math.sin(a1)))
            raios.append(barra(nome + f'Raio{i}{s}', p0, p1, 0.030, 0.026, 0.020, 0.016, M['roda'], up=(1, 0, 0), bev=0.004))
    pecas += [aro, friso, friso2, cubo, eixo] + raios
    for (x, rd) in discos:                                              # discos de freio furados com flange
        d = revolucao(nome + 'Disco', [(x - 0.0025, rd - 0.045), (x - 0.0025, rd), (x + 0.0025, rd), (x + 0.0025, rd - 0.045)], M['disco'], seg=96, fechar=True, centro=c, suave=False)
        furos = []
        for k in range(30):
            a = 2 * PI * k / 30; rr = rd - (0.015 if k % 2 else 0.030)
            furos.append(cil('f', (c[0] + x - 0.01, c[1] + rr * math.cos(a), c[2] + rr * math.sin(a)), (c[0] + x + 0.01, c[1] + rr * math.cos(a), c[2] + rr * math.sin(a)), 0.0035, M['disco'], n=10))
        furar(d, furos)
        flange = revolucao(nome + 'Flange', [(x - 0.004, 0.050), (x - 0.004, rd - 0.043), (x + 0.004, rd - 0.043), (x + 0.004, 0.050)], M['aluminio'], seg=64, fechar=True, centro=c, suave=False)
        furos = [cil('f', (c[0] + x - 0.01, c[1] + 0.085 * math.cos(2 * PI * k / 6), c[2] + 0.085 * math.sin(2 * PI * k / 6)), (c[0] + x + 0.01, c[1] + 0.085 * math.cos(2 * PI * k / 6), c[2] + 0.085 * math.sin(2 * PI * k / 6)), 0.018, M['disco'], n=16) for k in range(6)]
        furar(flange, furos)
        for k in range(10):                                             # botões flutuantes
            a = 2 * PI * k / 10; rr = rd - 0.045
            pecas.append(cil('b', (c[0] + x - 0.006, c[1] + rr * math.cos(a), c[2] + rr * math.sin(a)), (c[0] + x + 0.006, c[1] + rr * math.cos(a), c[2] + rr * math.sin(a)), 0.006, M['aluminio'], n=10))
        pecas += [d, flange]
    if lado_coroa:                                                      # coroa (45 dentes) na roda traseira, lado esquerdo
        perfil = []
        for k in range(90):
            a = 2 * PI * k / 90; rr = 0.106 if k % 2 == 0 else 0.098
            perfil.append(Vector((c[0] + 0.118, c[1] + rr * math.cos(a), c[2] + rr * math.sin(a))))
        dentes = loft(nome + 'Coroa', [[p + Vector((-0.003, 0, 0)) for p in perfil], [p + Vector((0.003, 0, 0)) for p in perfil]], M['aluminio'], suave=False)
        furos = [cil('f', (c[0] + 0.11, c[1] + 0.062 * math.cos(2 * PI * k / 5 + 0.3), c[2] + 0.062 * math.sin(2 * PI * k / 5 + 0.3)), (c[0] + 0.13, c[1] + 0.062 * math.cos(2 * PI * k / 5 + 0.3), c[2] + 0.062 * math.sin(2 * PI * k / 5 + 0.3)), 0.022, M['disco'], n=16) for k in range(5)]
        furar(dentes, furos)
        pecas.append(dentes)
        pecas.append(cil(nome + 'Cubo2', (c[0] + 0.06, c[1], c[2]), (c[0] + 0.115, c[1], c[2]), 0.055, M['aluminio'], n=32))
    o = juntar(pecas, nome + 'Malha'); ligar(o, g)
    return g


# ------------------------------------------------------------------------------------------------ moto
def moto(M):
    raiz = vazio('Moto', (0, 0, 0))
    corpo = []                                                          # peças paradas (juntadas no fim por material)

    # ---------------- quadro de alumínio de dupla viga (twin-spar) + subchassi
    cab = COL(0.86)
    corpo.append(cil('CaixaDirecao', COL(0.79), COL(0.935), 0.035, M['quadro'], n=24))
    for s in (1, -1):
        caminho = [cab + Vector((s * 0.03, 0.02, 0.02)), Vector((s * 0.11, -0.30, 0.84)), Vector((s * 0.165, -0.12, 0.78)), Vector((s * 0.17, 0.05, 0.70)),
                   Vector((s * 0.155, 0.14, 0.58)), Vector((s * 0.15, 0.16, 0.46)), Vector((s * 0.145, 0.15, 0.34))]
        corpo.append(viga(f'Viga{s}', caminho, [0.04, 0.045, 0.05, 0.05, 0.055, 0.06, 0.06], [0.10, 0.13, 0.15, 0.15, 0.12, 0.10, 0.09], M['quadro'], up=(1, 0, 0), bev=0.006))
        corpo.append(viga(f'Berco{s}', [cab + Vector((s * 0.03, 0.0, -0.05)), Vector((s * 0.10, -0.32, 0.62)), Vector((s * 0.12, -0.26, 0.48))], 0.03, 0.05, M['quadro'], bev=0.005))
        corpo.append(tubo(f'Sub{s}', [(s * 0.15, 0.13, 0.70), (s * 0.12, 0.40, 0.80), (s * 0.08, 0.78, 0.88)], 0.012, M['fosco']))
        corpo.append(tubo(f'Sub2{s}', [(s * 0.15, 0.17, 0.52), (s * 0.13, 0.42, 0.66), (s * 0.09, 0.70, 0.84)], 0.010, M['fosco']))
        corpo.append(cil(f'PivoTampa{s}', (s * 0.14, PIVO.y, PIVO.z), (s * 0.19, PIVO.y, PIVO.z), 0.022, M['aluminio'], n=20))
    corpo.append(cil('EixoPivo', (-0.19, PIVO.y, PIVO.z), (0.19, PIVO.y, PIVO.z), 0.009, M['cromo'], n=12))
    corpo.append(barra('TravessaQuadro', (-0.16, -0.05, 0.74), (0.16, -0.05, 0.74), 0.04, 0.03, m=M['quadro'], up=(0, 0, 1)))

    # ---------------- motor 4 cilindros em linha (inclinado 30° para frente), radiador e mangueiras
    corpo.append(loft('Carter', [sec(y, 0.37, w, 0.17, 0.15, n=3.2, k=28) for y, w in ((-0.34, 0.13), (-0.30, 0.19), (0.05, 0.20), (0.16, 0.16), (0.20, 0.10))], M['motor'], subd=1))
    incl = math.radians(30); ax = Vector((0, -math.sin(incl), math.cos(incl)))
    base = Vector((0, -0.20, 0.52))
    def bloco(p0, comp, w, h, nome, m, n=3.5):
        L = []
        for t, ww in ((0, w), (comp, w)):
            L.append([p0 + ax * t + Vector((v.x * ww / 0.19, (v.z) * math.cos(incl) * h / 0.09, (v.z) * math.sin(incl) * h / 0.09)) for v in sec(0, 0, 0.19, 0.09, n=n, k=28)])
        return loft(nome, L, m, bev=0.0, subd=1)
    corpo.append(bloco(base, 0.16, 0.19, 0.085, 'Cilindros', M['motor']))
    for k in range(6):                                                  # linhas de fundição do bloco
        corpo.append(bloco(base + ax * (0.02 + k * 0.022), 0.008, 0.195, 0.088, f'Fris{k}', M['fosco']))
    corpo.append(bloco(base + ax * 0.16, 0.07, 0.185, 0.082, 'Cabecote', M['aluminio']))
    tampa = bloco(base + ax * 0.23, 0.045, 0.175, 0.075, 'TampaComando', M['motor'])
    corpo.append(tampa)
    pc = base + ax * 0.275
    corpo.append(texto('LogoMotor', 'HRYZ', pc + Vector((0, 0.0, 0.002)), (incl, 0, 0), 0.05, M['dourado']))
    for s in (1, -1):                                                   # tampas laterais redondas (embreagem à direita, alternador à esquerda)
        corpo.append(cil(f'TampaLat{s}', (s * 0.19, 0.00, 0.36), (s * 0.225, 0.00, 0.36), 0.105, M['motor'], n=40, r2=0.095))
        corpo.append(cil(f'TampaLatAnel{s}', (s * 0.224, 0.00, 0.36), (s * 0.23, 0.00, 0.36), 0.07, M['aluminio'], n=40, r2=0.064))
        for k in range(6):
            a = 2 * PI * k / 6
            corpo.append(cil('paraf', (s * 0.225, 0.088 * math.cos(a), 0.36 + 0.088 * math.sin(a)), (s * 0.232, 0.088 * math.cos(a), 0.36 + 0.088 * math.sin(a)), 0.006, M['cromo'], n=8))
    corpo.append(cil('TampaPinhao', (0.19, PINHAO.y, PINHAO.z), (0.205, PINHAO.y, PINHAO.z), 0.06, M['motor'], n=28))
    corpo.append(cil('FiltroOleo', (0, -0.33, 0.27), (0, -0.42, 0.24), 0.035, M['preto'], n=24))
    corpo.append(cil('Pinhao', (0.112, PINHAO.y, PINHAO.z), (0.124, PINHAO.y, PINHAO.z), 0.042, M['aco'] if 'aco' in M else M['aluminio'], n=30))
    # radiador curvo na frente do motor
    rad_c = Vector((0, -0.43, 0.62)); inc = math.radians(-14)
    corpo.append(caixa('RadiadorMolde', -0.19, 0.19, -0.46, -0.41, 0.46, 0.79, M['preto'], 0.01))
    for k in range(28):
        corpo.append(caixa(f'Aleta{k}', -0.175, 0.175, -0.462, -0.455, 0.475 + k * 0.011, 0.479 + k * 0.011, M['aluminio'], 0))
    for s in (1, -1):
        corpo.append(tubo(f'Mangueira{s}', [(s * 0.15, -0.41, 0.50), (s * 0.17, -0.33, 0.45), (s * 0.13, -0.25, 0.46)], 0.016, M['preto']))
    corpo.append(tubo('MangueiraSup', [(0.1, -0.41, 0.76), (0.08, -0.36, 0.80), (0.0, -0.30, 0.79)], 0.016, M['preto']))

    # ---------------- escapamento 4-em-1: coletores sob o motor e ponteira curta do lado direito (-X)
    for i, x in enumerate((-0.105, -0.035, 0.035, 0.105)):
        pts = [(x, -0.355, 0.60), (x * 1.05, -0.45, 0.50), (x * 0.9, -0.44, 0.30), (x * 0.6, -0.33, 0.17), (x * 0.25, -0.12, 0.15), (-0.02, 0.0, 0.155)]
        corpo.append(tubo(f'Coletor{i}', pts, 0.019, M['titanio'], res=14))
    corpo.append(tubo('Intermediario', [(-0.02, 0.0, 0.155), (-0.06, 0.12, 0.17), (-0.12, 0.26, 0.24), (-0.16, 0.33, 0.30)], 0.032, M['titanio'], res=12))
    pe0, pe1 = Vector((-0.16, 0.33, 0.30)), Vector((-0.205, 0.68, 0.47))
    d = (pe1 - pe0); n_sec = 8
    corpo.append(loft('Ponteira', [[pe0 + d * t + Vector((v.x, 0, v.z)) for v in sec(0, 0, 0.055 + 0.012 * math.sin(PI * t), 0.068 + 0.01 * math.sin(PI * t), n=3.0, k=24)]
                                   for t in [i / n_sec for i in range(n_sec + 1)]], M['titanio'], subd=1))
    corpo.append(cil('PonteiraBoca', pe1 - d.normalized() * 0.01, pe1 + d.normalized() * 0.03, 0.05, M['carbono'], n=24, r2=0.045))
    corpo.append(cil('PonteiraSaida', pe1 + d.normalized() * 0.025, pe1 + d.normalized() * 0.035, 0.03, M['fosco'], n=20))
    corpo.append(barra('SuportePonteira', (-0.16, 0.52, 0.47), (-0.11, 0.48, 0.66), 0.012, 0.03, m=M['aluminio']))

    # ---------------- tanque (com recortes para os joelhos), tampa do tanque
    corpo.append(loft('Tanque', [sec(y, zc, w, ht, hb, n=n, k=32) for y, zc, w, ht, hb, n in (
        (-0.34, 0.92, 0.10, 0.04, 0.06, 2.6), (-0.30, 0.93, 0.15, 0.07, 0.10, 2.8), (-0.20, 0.925, 0.185, 0.085, 0.12, 3.0), (-0.08, 0.915, 0.19, 0.08, 0.13, 3.0),
        (0.02, 0.90, 0.15, 0.07, 0.12, 2.8), (0.10, 0.88, 0.12, 0.05, 0.10, 2.6), (0.13, 0.87, 0.10, 0.035, 0.08, 2.4))], M['pintura'], subd=2))
    corpo.append(cil('TampaTanque', (0, -0.22, 1.003), (0, -0.22, 1.012), 0.042, M['aluminio'], n=32))
    corpo.append(cil('TampaTanqueC', (0, -0.22, 1.012), (0, -0.22, 1.016), 0.028, M['fosco'], n=24))
    for s in (1, -1):                                                   # protetores de joelho (borracha)
        corpo.append(loft(f'Joelheira{s}', [sec(y, 0.88, 0.006, 0.045, n=4, k=12, xc=s * (0.172 - 0.12 * (y + 0.05) ** 2)) for y in (-0.10, -0.04, 0.02)], M['borracha'], subd=1))
    # ---------------- bancos e rabeta
    corpo.append(loft('Banco', [sec(y, zc, w, 0.035, 0.03, n=3.2, k=28) for y, zc, w in ((0.10, 0.835, 0.11), (0.18, 0.825, 0.15), (0.30, 0.83, 0.14), (0.40, 0.85, 0.10), (0.46, 0.87, 0.07))], M['banco'], subd=2))
    corpo.append(loft('BancoGarupa', [sec(y, zc, w, 0.025, 0.02, n=3.0, k=24) for y, zc, w in ((0.50, 0.905, 0.07), (0.58, 0.925, 0.085), (0.66, 0.945, 0.07))], M['banco'], subd=2))
    corpo.append(loft('Rabeta', [sec(y, zc, w, ht, hb, n=n, k=32) for y, zc, w, ht, hb, n in (
        (0.36, 0.80, 0.13, 0.03, 0.10, 2.4), (0.48, 0.85, 0.13, 0.05, 0.11, 2.6), (0.62, 0.89, 0.12, 0.05, 0.10, 2.6), (0.76, 0.925, 0.09, 0.04, 0.08, 2.4),
        (0.88, 0.95, 0.055, 0.03, 0.05, 2.2), (0.95, 0.965, 0.03, 0.018, 0.03, 2.0))], M['pintura'], subd=2))
    for s in (1, -1):                                                   # entradas de ar da rabeta e faixa branca
        corpo.append(loft(f'FaixaRabeta{s}', [sec(y, zc, 0.004, 0.012, n=4, k=10, xc=s * w) for y, zc, w in ((0.50, 0.86, 0.131), (0.66, 0.895, 0.118), (0.80, 0.925, 0.086))], M['branco'], subd=1))
    corpo.append(loft('Lanterna', [sec(y, 0.955, w, 0.014, 0.010, n=2.4, k=20) for y, w in ((0.925, 0.05), (0.955, 0.034), (0.966, 0.018))], M['lanterna'], subd=1))
    corpo.append(loft('RabetaBaixo', [sec(y, 0.80, w, 0.02, 0.025, n=3, k=20) for y, w in ((0.45, 0.10), (0.65, 0.085), (0.82, 0.05))], M['preto'], subd=1))
    # suporte da placa com piscas e placa
    corpo.append(barra('SuportePlaca', (0, 0.80, 0.78), (0, 1.02, 0.60), 0.14, 0.012, 0.16, 0.012, m=M['preto'], up=(1, 0, 0)))
    corpo.append(caixa('Placa', -0.10, 0.10, 1.018, 1.024, 0.50, 0.63, M['placa'], 0.003))
    corpo.append(texto('PlacaTexto', 'HRY-2O26', (0, 1.0255, 0.565), (PI / 2, 0, PI), 0.035, M['fosco']))
    for s in (1, -1):
        corpo.append(cil(f'HastePisca{s}', (s * 0.07, 0.96, 0.66), (s * 0.15, 0.97, 0.66), 0.006, M['preto'], n=10))
        corpo.append(esfera(f'PiscaT{s}', (s * 0.16, 0.97, 0.66), 0.016, M['pisca'], esc=(1.4, 0.8, 0.8)))

    # ---------------- carenagem: bico com faróis, laterais com saídas de ar, carenagem inferior, bolha
    interp = lambda y, tab: next((a[1] + (b[1] - a[1]) * (y - a[0]) / (b[0] - a[0]) for a, b in zip(tab, tab[1:]) if a[0] <= y <= b[0]), tab[0][1] if y < tab[0][0] else tab[-1][1])
    # carenagem dianteira contínua: em cada estação y, meia seção que sobe pela lateral até o "ombro" e curva por cima até
    # a linha do centro (bico), até a borda da bolha (meio) ou até a borda de cima da lateral (atrás); dois lados espelhados
    ZB = [(-1.0, 0.765), (-0.95, 0.725), (-0.80, 0.695), (-0.64, 0.655), (-0.50, 0.59), (-0.42, 0.50), (-0.37, 0.36), (-0.33, 0.27), (-0.12, 0.25), (0.04, 0.31)]
    W = [(-1.0, 0.035), (-0.97, 0.105), (-0.92, 0.165), (-0.85, 0.200), (-0.75, 0.225), (-0.60, 0.245), (-0.46, 0.255), (-0.20, 0.252), (0.04, 0.236)]
    ZS = [(-1.0, 0.80), (-0.92, 0.835), (-0.80, 0.865), (-0.62, 0.90), (-0.45, 0.90), (-0.33, 0.875), (-0.16, 0.70), (0.04, 0.44)]
    BOLHA = [(-0.90, 0.875, 0.16), (-0.83, 0.93, 0.17), (-0.74, 1.00, 0.17), (-0.64, 1.06, 0.15), (-0.56, 1.09, 0.11)]
    ZT = [(-0.50, 0.985), (-0.46, 0.96), (-0.33, 0.93), (-0.16, 0.72), (0.04, 0.45)]
    bz = lambda y: interp(y, [(a, b) for a, b, c in BOLHA]); bw = lambda y: interp(y, [(a, c) for a, b, c in BOLHA])
    def topo(y):
        if y <= -0.92: return 0.0, interp(y, [(-1.0, 0.82), (-0.95, 0.865), (-0.92, 0.88)])
        if y <= -0.88: t = (y + 0.92) / 0.04; return bw(-0.90) * t * 0.96, 0.88 + (bz(-0.88) - 0.88) * t
        if y <= -0.56: return bw(y) * 0.96, bz(y)
        if y <= -0.50: t = (y + 0.56) / 0.06; return bw(-0.56) * 0.96 * (1 - t) + (interp(-0.50, W) - 0.03) * t, bz(-0.56) * (1 - t) + 0.985 * t
        return interp(y, W) - 0.03, interp(y, ZT)
    def meia(y):
        zb, w, zs = interp(y, ZB), interp(y, W), interp(y, ZS); ex, ez = topo(y); zs = min(zs, ez - 0.012); zs = max(zs, zb + 0.03)
        P = [(w * (1 - 0.10 * ((z - 0.62) / 0.36) ** 2), z) for z in [zb + (zs - zb) * t / 9 for t in range(10)]]
        for i in range(1, 9):
            f = i / 8 * PI / 2; P.append((ex + (P[9][0] - ex) * math.cos(f) ** (2 / 2.6), zs + (ez - zs) * math.sin(f) ** (2 / 2.6)))
        return P
    ys = [-1.0 + 1.04 * i / 44 for i in range(45)]
    for s in (1, -1):
        L = [[Vector((s * x, y, z)) for x, z in meia(y)] for y in ys]
        corpo.append(loft(f'Carenagem{s}', L, M['pintura'], fechado=False, solido=0.004, subd=1))
    xlat = lambda y, z: interp(y, W) * (1 - 0.10 * ((z - 0.62) / 0.36) ** 2)
    # y da frente do bico para uma largura x (para os faróis ficarem rentes)
    yfrente = lambda x: next((a + (b - a) * (x - wa) / (wb - wa) for (a, wa), (b, wb) in zip(W, W[1:]) if wa <= x <= wb), -1.0)
    for s in (1, -1):
        # faixa branca diagonal, nome e saídas de ar
        L = [[Vector((s * (xlat(y, z) + 0.004), y, z)) for z in (zc - 0.016, zc + 0.016)] for y, zc in [(y, 0.80 - (y + 0.74) * 0.36) for y in [-0.74 + 0.66 * i / 10 for i in range(11)]]]
        corpo.append(loft(f'FaixaLat{s}', L, M['branco'], fechado=False, solido=0.002))
        corpo.append(texto(f'Marca{s}', 'HRYZ', (s * (xlat(-0.50, 0.63) + 0.006), -0.50, 0.63), (PI / 2, 0, s * PI / 2), 0.10, M['branco'], esp=0.002))
        corpo.append(texto(f'Modelo{s}', '600 RS', (s * (xlat(-0.24, 0.44) + 0.006), -0.24, 0.44), (PI / 2, 0, s * PI / 2), 0.042, M['fosco'], esp=0.002))
        for k in range(3):
            y0 = -0.36 + k * 0.045
            corpo.append(barra(f'Guelra{s}{k}', (s * (xlat(y0, 0.78) + 0.003), y0, 0.78), (s * (xlat(y0 + 0.06, 0.60) + 0.003), y0 + 0.06, 0.60), 0.004, 0.022, m=M['preto'], up=(1, 0, 0), bev=0.001))
        corpo.append(barra(f'Asa{s}', (s * 0.20, -0.72, 0.74), (s * 0.27, -0.62, 0.72), 0.008, 0.045, 0.004, 0.03, m=M['carbono'], up=(1, 0, 0)))   # winglet
    # bolha fumê curva
    L = []
    for y, zc, w in BOLHA:
        L.append([Vector((x, y, zc + 0.04 * (1 - (x / w) ** 2))) for x in [-w + 2 * w * i / 14 for i in range(15)]])
    corpo.append(loft('Bolha', L, M['bolha'], fechado=False, solido=0.003, subd=1))
    corpo.append(loft('CarenagemInferior', [sec(y, zc, w, 0.06, 0.08, n=2.6, k=28) for y, zc, w in ((-0.38, 0.30, 0.17), (-0.25, 0.22, 0.22), (-0.05, 0.20, 0.23), (0.10, 0.24, 0.18), (0.16, 0.28, 0.12))], M['preto'], subd=2))
    corpo.append(loft('Bolha', [sec(y, zc, w, 0.012, 0.012, n=2.2, k=24) for y, zc, w in ((-0.93, 0.93, 0.15), (-0.86, 0.99, 0.17), (-0.76, 1.05, 0.17), (-0.66, 1.09, 0.14), (-0.60, 1.10, 0.10))], M['bolha'], subd=1))
    # faróis (dois olhos com LED) e entrada de ar central
    for s in (1, -1):
        def placa_frente(nome, x0, x1, z0, z1, recuo, m, curva=0.0):
            V, F = [], []; nx, nz = 10, 4
            for i in range(nx + 1):
                x = x0 + (x1 - x0) * i / nx; zc = curva * (i / nx - 0.5) ** 2
                for j in range(nz + 1):
                    z = z0 + (z1 - z0) * j / nz + zc; V.append(Vector((s * x, yfrente(x) - recuo, z)))
            for i in range(nx):
                for j in range(nz): a = i * (nz + 1) + j; F.append((a, a + nz + 1, a + nz + 2, a + 1))
            return malha(nome, V, F, m, solido=0.002)
        corpo.append(placa_frente(f'Farol{s}', 0.022, 0.150, 0.778, 0.818, 0.004, M['vidroFarol'], curva=-0.03))
        corpo.append(placa_frente(f'LedFarol{s}', 0.040, 0.140, 0.808, 0.815, 0.007, M['led'], curva=-0.03))
        corpo.append(placa_frente(f'Projetor{s}', 0.085, 0.120, 0.782, 0.800, 0.006, M['cromo']))
        corpo.append(esfera(f'PiscaF{s}', (s * 0.215, -0.82, 0.80), 0.014, M['pisca'], esc=(0.6, 1.6, 0.8)))
    corpo.append(loft('EntradaAr', [sec(y, 0.745, w, 0.012, 0.016, n=2.6, k=20) for y, w in ((-0.97, 0.03), (-0.94, 0.035))], M['fosco'], subd=1))
    # painel TFT e retrovisores
    corpo.append(caixa('Painel', -0.08, 0.08, -0.56, -0.53, 0.99, 1.07, M['preto'], 0.006))
    corpo.append(caixa('Tela', -0.07, 0.07, -0.5305, -0.528, 1.0, 1.06, M['tela'], 0))
    for s in (1, -1):
        corpo.append(tubo(f'HasteEspelho{s}', [(s * 0.205, -0.70, 0.93), (s * 0.27, -0.66, 0.99), (s * 0.32, -0.61, 1.03)], 0.007, M['preto']))
        corpo.append(loft(f'Espelho{s}', [sec(y, 1.05, 0.065, 0.032, n=2.4, k=20, xc=s * 0.34) for y in (-0.62, -0.59, -0.575)], M['pintura'], subd=1))
        corpo.append(caixa(f'Vidro{s}', s * 0.34 - 0.055, s * 0.34 + 0.055, -0.5745, -0.573, 1.025, 1.075, M['espelho'], 0.004))

    # ---------------- pedaleiras, pedal de freio/câmbio, alças da garupa
    for s in (1, -1):
        corpo.append(barra(f'PlacaPed{s}', (s * 0.15, 0.10, 0.52), (s * 0.165, 0.24, 0.38), 0.008, 0.06, 0.008, 0.045, m=M['aluminio'], up=(1, 0, 0)))
        corpo.append(cil(f'Pedaleira{s}', (s * 0.165, 0.22, 0.385), (s * 0.24, 0.22, 0.385), 0.011, M['aluminio'], n=16))
        for k in range(5): corpo.append(cil('rib', (s * (0.175 + k * 0.014), 0.22, 0.385), (s * (0.18 + k * 0.014), 0.22, 0.385), 0.013, M['fosco'], n=16))
        corpo.append(barra(f'Pedal{s}', (s * 0.17, 0.21, 0.40), (s * 0.20, 0.03, 0.36), 0.008, 0.012, m=M['aluminio'], up=(1, 0, 0)))
        corpo.append(cil(f'PedalPonta{s}', (s * 0.19, 0.03, 0.36), (s * 0.23, 0.03, 0.36), 0.008, M['aluminio'], n=12))
        corpo.append(barra(f'SupGarupa{s}', (s * 0.13, 0.40, 0.66), (s * 0.18, 0.46, 0.48), 0.008, 0.04, m=M['aluminio'], up=(1, 0, 0)))
        corpo.append(cil(f'PedGarupa{s}', (s * 0.18, 0.46, 0.48), (s * 0.24, 0.46, 0.48), 0.010, M['fosco'], n=14))

    # ---------------- amortecedor traseiro (mono) com mola
    am0, am1 = Vector((0, 0.30, 0.36)), Vector((0, 0.19, 0.70))
    corpo.append(cil('AmortCorpo', am1, am1 + (am0 - am1) * 0.55, 0.024, M['aluminio'], n=20))
    corpo.append(cil('AmortHaste', am0, am1, 0.009, M['cromo'], n=12))
    eixo_a = (am1 - am0).normalized(); pp = eixo_a.orthogonal().normalized(); qq = eixo_a.cross(pp)
    hel = [am0 + eixo_a * (0.06 + 0.18 * t) + (pp * math.cos(t * 2 * PI * 7) + qq * math.sin(t * 2 * PI * 7)) * 0.036 for t in [i / 140 for i in range(141)]]
    corpo.append(tubo('Mola', hel, 0.0055, M['mola'], res=2, perfil=6))
    corpo.append(cil('ReservatorioAmort', (0.05, 0.20, 0.66), (0.05, 0.10, 0.70), 0.018, M['aluminio'], n=16))

    # junta o corpo por material (menos nós no jogo)
    porMat = {}
    for o in corpo:
        if o and o.data and len(o.data.materials): porMat.setdefault(o.data.materials[0].name, []).append(o)
    for nome, objs in porMat.items(): ligar(juntar(objs, 'Corpo_' + nome), raiz)

    # ---------------- DIREÇÃO (gira em torno da coluna): garfo invertido, mesas, semiguidões, roda e para-lama dianteiros
    dire = vazio('Direcao', COL(0.86), raiz, rot=(-CASTER, 0, 0))
    pecasD = []
    perp = Vector((0, -math.cos(CASTER), math.sin(CASTER)))            # para frente, perpendicular à coluna
    for s in (1, -1):
        base_f = AF + Vector((s * 0.105, 0, 0))
        P = lambda t: base_f + U * t
        pecasD.append(cil(f'Bengala{s}', P(0.06), P(0.44), 0.0245, M['cromo'], n=28))          # tubo interno (deslizante)
        pecasD.append(cil(f'Tubo{s}', P(0.38), P(0.725), 0.033, M['dourado'], n=32))            # tubo externo dourado
        pecasD.append(cil(f'Anel{s}', P(0.375), P(0.39), 0.036, M['preto'], n=28))              # retentor
        pecasD.append(cil(f'Tampa{s}', P(0.725), P(0.74), 0.026, M['aluminio'], n=20))
        pecasD.append(barra(f'PonteiraGarfo{s}', P(-0.04), P(0.11), 0.05, 0.07, 0.045, 0.055, m=M['aluminio'], up=(1, 0, 0), bev=0.008))
        pecasD.append(cil(f'Ajuste{s}', P(0.74), P(0.752), 0.012, M['dourado'], n=12))
        # pinça radial de 4 pistões presa na ponteira, atrás do disco
        cx = s * 0.085; pc0 = AF + Vector((cx, 0.13, 0.02)) + U * 0.03
        pecasD.append(pinca(f'Pinca{s}', AF, s * 0.088, 0.155, 0.15, 0.85, M['pinca']))                 # atrás e acima do eixo, presa na ponteira
        pecasD.append(barra(f'SupPinca{s}', P(0.03) + Vector((0, 0.03, 0)), AF + Vector((s * 0.105, 0.155 * math.cos(0.5) - 0.01, 0.155 * math.sin(0.5))), 0.02, 0.03, m=M['aluminio'], up=(1, 0, 0)))
        pl = AF + Vector((s * (0.088 + 0.027), 0.145 * math.cos(0.5), 0.145 * math.sin(0.5)))
        pecasD.append(texto(f'PincaLogo{s}', 'HRYZ', pl, (PI / 2 - 0.5 + PI / 2 - PI / 2, 0, s * PI / 2), 0.02, M['branco'], esp=0.001))
        pc0 = AF + Vector((cx, 0.11, 0.10))
        pecasD.append(tubo(f'Flexivel{s}', [pc0 + Vector((0, -0.01, 0.07)), P(0.30) + Vector((0, 0.06, 0)), COL(0.78) + Vector((s * 0.05, 0.02, 0)), COL(0.93) + Vector((s * 0.10, 0.04, 0.02))], 0.0045, M['preto']))
    # mesas (inferior e superior) e a porca central
    for t, h in ((0.53, 0.04), (0.70, 0.03)):
        c = AF + U * t
        pecasD.append(loft(f'Mesa{t}', [[Vector((x, c.y + yy, c.z + dz)) for x, yy in ((-0.15, 0.03), (0.15, 0.03), (0.15, 0.09), (0.05, 0.13), (-0.05, 0.13), (-0.15, 0.09))]
                                         for dz in (-h / 2, h / 2)], M['aluminio'], bev=0.004, suave=False))
    pecasD.append(cil('PorcaCentral', AF + U * 0.715 + Vector((0, 0.07, 0)), AF + U * 0.735 + Vector((0, 0.07, 0)), 0.02, M['aluminio'], n=16))
    # semiguidões (clip-ons), manoplas, manetes, reservatório de fluido, comandos
    for s in (1, -1):
        c0 = AF + U * 0.66 + Vector((s * 0.105, 0, 0))
        pecasD.append(cil(f'Abraçadeira{s}', c0 - U * 0.02, c0 + U * 0.02, 0.040, M['aluminio'], n=24))
        g1 = c0 + Vector((s * 0.05, 0.02, -0.005)); g2 = c0 + Vector((s * 0.30, 0.09, -0.04))
        pecasD.append(cil(f'Semiguidao{s}', g1, g2, 0.011, M['fosco'], n=16))
        gm = g1 + (g2 - g1) * 0.55
        pecasD.append(cil(f'Manopla{s}', gm, g2 + (g2 - g1).normalized() * 0.01, 0.017, M['borracha'], n=20))
        for k in range(8):
            q = gm + (g2 - gm) * (k / 8)
            pecasD.append(cil('gr', q, q + (g2 - g1).normalized() * 0.005, 0.0185, M['borracha'], n=20))
        pecasD.append(cil(f'Peso{s}', g2 + (g2 - g1).normalized() * 0.01, g2 + (g2 - g1).normalized() * 0.035, 0.016, M['aluminio'], n=20))
        pecasD.append(caixa(f'Comandos{s}', min(g1.x + s * 0.02, g1.x + s * 0.07), max(g1.x + s * 0.02, g1.x + s * 0.07), g1.y + 0.0, g1.y + 0.05, g1.z - 0.03, g1.z + 0.025, M['preto'], 0.008))
        lev0 = g1 + (g2 - g1) * 0.5 + Vector((0, -0.04, 0.0))
        pecasD.append(tubo(f'Manete{s}', [lev0, lev0 + Vector((s * 0.06, -0.035, -0.01)), lev0 + Vector((s * 0.17, -0.03, -0.02))], 0.006, M['aluminio'], res=6))
        if s == -1: pecasD.append(cil('Reservatorio', g1 + Vector((-0.04, 0.02, 0.03)), g1 + Vector((-0.04, 0.03, 0.09)), 0.018, M['fosco'], n=18))
    # para-lama dianteiro (meia casca sobre o pneu)
    L = []
    for a in [math.radians(v) for v in range(25, 136, 10)]:
        p = Vector((0, AF.y - (RF + 0.03) * math.cos(a), AF.z + (RF + 0.03) * math.sin(a)))
        L.append([p + Vector((x, 0, 0)) + Vector((0, -math.cos(a), math.sin(a))) * (0.02 * (1 - (x / 0.075) ** 2)) for x in [-0.075 + 0.15 * i / 8 for i in range(9)]])
    pecasD.append(loft('ParaLama', L, M['pintura'], fechado=False, solido=0.004, subd=1))
    for o in pecasD: ligar(o, dire)
    jd = juntar(pecasD, 'DirecaoMalha'); ligar(jd, dire)
    rd = roda('RodaDianteira', RF, 0.12, 0.09, AF, M, discos=[(0.088, 0.155), (-0.088, 0.155)]); ligar(rd, dire)

    # ---------------- BALANÇA (gira no pivô): braço banana à direita, reto à esquerda, esticadores, roda traseira com coroa e pinça
    bal = vazio('Balanca', PIVO, raiz)
    pecasB = []
    for s in (1, -1):
        meio = (PIVO + AT) / 2 + Vector((s * 0.135, 0, (0.05 if s == -1 else 0.02)))
        caminho = [PIVO + Vector((s * 0.12, 0, 0)), meio, AT + Vector((s * 0.135, -0.02, 0.0)), AT + Vector((s * 0.135, 0.05, 0.0))]
        pecasB.append(viga(f'Braco{s}', caminho, [0.05, 0.05, 0.04, 0.035], [0.08, 0.10, 0.06, 0.05], M['quadro'], bev=0.006))
        pecasB.append(caixa(f'Esticador{s}', s * 0.135 - 0.02, s * 0.135 + 0.02, AT.y + 0.04, AT.y + 0.065, AT.z - 0.02, AT.z + 0.02, M['aluminio'], 0.004))
        pecasB.append(cil(f'Porca{s}', (s * 0.15, AT.y, AT.z), (s * 0.17, AT.y, AT.z), 0.018, M['aluminio'], n=6))
    pecasB.append(barra('TravessaBalanca', PIVO + Vector((-0.12, 0.10, 0)), PIVO + Vector((0.12, 0.10, 0)), 0.05, 0.06, m=M['quadro'], up=(0, 0, 1)))
    pecasB.append(cil('BuchaPivo', PIVO + Vector((-0.14, 0, 0)), PIVO + Vector((0.14, 0, 0)), 0.03, M['quadro'], n=24))
    # pinça traseira (lado direito) e protetor de corrente
    pecasB.append(pinca('PincaTras', AT, -0.085, 0.11, -0.95, -0.45, M['pinca'], larg=0.04, alt=0.045))     # embaixo e atrás do eixo
    pecasB.append(barra('SupPincaTras', AT + Vector((-0.11, 0, 0)), AT + Vector((-0.11, 0.09 * math.cos(-0.7), 0.09 * math.sin(-0.7))), 0.012, 0.035, m=M['aluminio'], up=(1, 0, 0)))
    pecasB.append(loft('ProtCorrente', [sec(y, AT.z + 0.13 - (y - 0.2) * 0.06, 0.012, 0.012, n=3, k=12, xc=0.13) for y in (0.20, 0.35, 0.50, 0.62)], M['carbono'], subd=1))
    # corrente (elos ao longo do circuito pinhão → coroa)
    rp, rc = 0.040, 0.103
    pin, cor = Vector((0, PINHAO.y, PINHAO.z)), Vector((0, AT.y, AT.z))
    d = (cor - pin); L_ = d.length; dn = d / L_; nrm = Vector((0, -dn.z, dn.y))
    ang = math.asin((rc - rp) / L_)
    def ponto_circuito(u):
        """u em metros ao longo do circuito fechado"""
        tang = math.sqrt(L_ ** 2 - (rc - rp) ** 2)
        a_c = PI + 2 * ang; a_p = PI - 2 * ang
        seg = [tang, rc * a_c, tang, rp * a_p]; u = u % sum(seg)
        n_up = (nrm * math.cos(ang) - dn * math.sin(ang)); n_dn = (-nrm * math.cos(ang) - dn * math.sin(ang))
        if u < seg[0]: return pin + n_up * rp + (cor + n_up * rc - pin - n_up * rp).normalized() * u
        u -= seg[0]
        if u < seg[1]:
            a0 = math.atan2(n_up.z, n_up.y); a = a0 - u / rc; return cor + Vector((0, math.cos(a), math.sin(a))) * rc
        u -= seg[1]
        if u < seg[2]: return cor + n_dn * rc + (pin + n_dn * rp - cor - n_dn * rc).normalized() * u
        u -= seg[2]
        a0 = math.atan2(n_dn.z, n_dn.y); a = a0 - u / rp; return pin + Vector((0, math.cos(a), math.sin(a))) * rp
    total = 2 * math.sqrt(L_ ** 2 - (rc - rp) ** 2) + rc * (PI + 2 * ang) + rp * (PI - 2 * ang)
    n_elos = int(total / 0.015875); passo = total / n_elos; elos = []
    for i in range(n_elos):
        a, b = ponto_circuito(i * passo), ponto_circuito(i * passo + passo * 0.92)
        for dx in (-0.0055, 0.0055):
            elos.append(barra('elo', (PINHAO.x + dx, a.y, a.z), (PINHAO.x + dx, b.y, b.z), 0.0016, 0.009, m=M['corrente'], up=(1, 0, 0), bev=0.0))
        elos.append(cil('rolete', (PINHAO.x - 0.005, a.y, a.z), (PINHAO.x + 0.005, a.y, a.z), 0.0035, M['corrente'], n=6))
    corrente = juntar(elos, 'Corrente'); ligar(corrente, raiz)              # a corrente fica no corpo (não gira com a balança)
    for o in pecasB: ligar(o, bal)
    jb = juntar(pecasB, 'BalancaMalha'); ligar(jb, bal)
    rt = roda('RodaTraseira', RT, 0.18, 0.14, AT, M, discos=[(-0.085, 0.11)], lado_coroa=True); ligar(rt, bal)

    # ---------------- descanso lateral (esquerdo)
    desc_p = Vector((0.13, 0.02, 0.30))
    desc = vazio('Descanso', desc_p, raiz)
    d1 = barra('DescansoHaste', desc_p, (0.165, 0.33, 0.24), 0.016, 0.02, 0.014, 0.016, m=M['fosco'], up=(0, 0, 1))                 # recolhido (o jogo baixa)
    d2 = caixa('DescansoPe', 0.15, 0.19, 0.31, 0.37, 0.225, 0.24, M['fosco'], 0.003)
    jd2 = juntar([d1, d2], 'DescansoMalha'); ligar(jd2, desc)

    # ---------------- marcadores
    vazio('Farol', (0, -1.0, 0.80), raiz); vazio('Lanterna', (0, 0.97, 0.955), raiz)
    vazio('Assento', (0, 0.26, 0.87), raiz); vazio('PeD', (-0.20, 0.22, 0.39), raiz); vazio('PeE', (0.20, 0.22, 0.39), raiz)
    vazio('MaoD', AF + U * 0.66 + Vector((-0.33, 0.07, -0.03)), raiz); vazio('MaoE', AF + U * 0.66 + Vector((0.33, 0.07, -0.03)), raiz)
    return raiz


def exportar(raiz, arquivo):
    bpy.ops.object.select_all(action='DESELECT')
    def sel(o):
        o.select_set(True); [sel(c) for c in o.children]
    sel(raiz)
    bpy.ops.export_scene.gltf(filepath=arquivo, export_format='GLB', use_selection=True, export_apply=True)


def render(pasta, amostras):
    os.makedirs(pasta, exist_ok=True)
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0)); ch = bpy.context.object; ch.data.materials.append(mat('chao', (0.32, 0.33, 0.35), 0.55))
    w = bpy.data.worlds.new('w'); bpy.context.scene.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.62, 0.68, 0.78, 1); bg.inputs['Strength'].default_value = 0.45
    for loc, en, tam in (((2.5, -2.5, 3.2), 700, 3.0), ((-3.0, -1.0, 2.0), 260, 2.5), ((0.5, 3.5, 2.5), 300, 2.5)):
        bpy.ops.object.light_add(type='AREA', location=loc); l = bpy.context.object; l.data.energy = en; l.data.size = tam
        l.rotation_euler = (Vector((0, 0, 0.6)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    cd = bpy.data.cameras.new('c'); c = bpy.data.objects.new('c', cd); bpy.context.scene.collection.objects.link(c); bpy.context.scene.camera = c
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = amostras; sc.cycles.use_denoising = True; sc.cycles.device = 'CPU'
    sc.render.resolution_x, sc.render.resolution_y = 1600, 1000; sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
    vistas = {'tres_quartos': ((2.9, -3.3, 1.35), (0, -0.05, 0.55), 50), 'lado': ((4.4, 0.0, 0.75), (0, 0.0, 0.55), 50), 'traseira': ((-2.4, 3.2, 1.5), (0, 0.1, 0.6), 50),
              'frente': ((-0.9, -3.6, 1.1), (0, -0.5, 0.62), 55), 'detalhe': ((1.35, -1.75, 0.75), (0, -0.55, 0.42), 55)}
    sel = (arg('vistas') or ','.join(vistas)).split(',')
    for nome in sel:
        loc, alvo, lente = vistas[nome]
        cd.lens = lente; c.location = loc; c.rotation_euler = (Vector(alvo) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        sc.render.filepath = os.path.join(pasta, f'moto_{nome}.png'); bpy.ops.render.render(write_still=True)


limpar(); M = materiais(); M['aco'] = mat('aco', (0.35, 0.35, 0.37), 0.3, 1.0)
raiz = moto(M)
if arg('glb'): exportar(raiz, arg('glb'))
if arg('blend'): bpy.ops.wm.save_as_mainfile(filepath=arg('blend'))
if arg('render'): render(arg('render'), int(arg('amostras', '64')))
print('pronto')
