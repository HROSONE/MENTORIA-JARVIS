"""FOGUETE HRYZ-1 (lunar, decola e pousa em pé) + plataforma de lançamento, no Blender por script.
Desenho original do canal: corpo branco de 3,6 m de diâmetro e ~23 m de altura, cápsula com 3 janelas no nariz,
1 motor central + 4 em volta, 4 pernas de pouso dobráveis (folha dourada de isolamento nas juntas), escotilha da tripulação,
escada, propulsores de manobra (RCS), antena e luzes de navegação. A pintura vem de gerar_pintura.py.
Peças móveis (nós separados, pivô no lugar):
  Perna0..3  dobradiça na base do corpo; no glTF, girar em torno do eixo local Z (0 = aberta; ~2,45 rad = dobrada junto do corpo)
  Escotilha  dobradiça vertical do lado esquerdo; girar em torno do eixo local Y (0 = fechada; ~-1,7 = aberta)
  Bocal      ponto (vazio) na saída do motor central, para a chama
Frente (escotilha) = +Z no glTF (Blender -Y). Pés das pernas em y = 0.
Uso: blender -b -P criar_foguete.py -- [--glb pasta] [--render pasta --amostras 64 --vistas tq,frente,base,pad]"""
import bpy, bmesh, sys, os, math
import numpy as np
from mathutils import Vector, Matrix, Euler

AQUI = os.path.dirname(os.path.abspath(__file__)); G = os.path.join(AQUI, 'gerado')
arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def opc(n, p=None): return arg[arg.index('--' + n) + 1] if '--' + n in arg else p
SAIDA_GLB, SAIDA_R, AMOSTRAS = opc('glb', AQUI), opc('render'), int(opc('amostras', 64))
VISTAS = opc('vistas', 'tq,frente,base,pad').split(',')
bpy.ops.wm.read_factory_settings(use_empty=True)
cena = bpy.context.scene
R0, Z0, Z1 = 1.8, 2.0, 23.2
FRENTE = -math.pi / 2                                   # ângulo da frente (Blender -Y)

# ------------------------------------------------------------------------------------------- materiais
def mat(nome, cor, rug=0.5, met=0.0, emis=None, coat=0.0, alpha=1.0, trans=0.0):
    m = bpy.data.materials.new(nome); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*cor, 1); b.inputs['Roughness'].default_value = rug; b.inputs['Metallic'].default_value = met
    b.inputs['Coat Weight'].default_value = coat
    if emis: b.inputs['Emission Color'].default_value = (*emis[0], 1); b.inputs['Emission Strength'].default_value = emis[1]
    if trans: b.inputs['Transmission Weight'].default_value = trans
    return m
def img(arq, nc=False):
    i = bpy.data.images.load(os.path.join(G, arq))
    if nc: i.colorspace_settings.name = 'Non-Color'
    return i
PINTURA = mat('FogPintura', (0.9, 0.9, 0.9), 0.32, coat=0.4)
nt = PINTURA.node_tree; tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = img('pintura.png'); nt.links.new(tx.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color'])
BRANCO = mat('FogBranco', (0.86, 0.87, 0.88), 0.35, coat=0.3)
PRETO = mat('FogPreto', (0.025, 0.026, 0.03), 0.4)
GRAFITE = mat('FogGrafite', (0.08, 0.085, 0.09), 0.45, 0.6)
ACO = mat('FogAco', (0.62, 0.63, 0.65), 0.28, 1.0)
BOCAL = mat('FogBocal', (0.11, 0.1, 0.1), 0.38, 0.9)                     # liga de nióbio escura
COBRE = mat('FogCobre', (0.75, 0.38, 0.2), 0.3, 1.0)                     # câmara de cobre por dentro do bocal
OURO = mat('FogOuro', (1.0, 0.72, 0.28), 0.22, 1.0)                      # folha de isolamento (MLI)
VIDRO = mat('FogVidro', (0.02, 0.05, 0.08), 0.03, 0.2, coat=1.0)
LUZ_V = mat('FogLuzVermelha', (1, 0.1, 0.05), 0.3, emis=((1, 0.08, 0.04), 6))
LUZ_G = mat('FogLuzVerde', (0.1, 1, 0.3), 0.3, emis=((0.1, 1, 0.3), 6))
LARANJA = mat('FogLaranja', (1.0, 0.33, 0.06), 0.4)
CONCRETO = mat('PadConcreto', (0.42, 0.41, 0.39), 0.85)
AMARELO = mat('PadAmarelo', (0.95, 0.72, 0.05), 0.5)
VERMELHO_TORRE = mat('PadTorre', (0.55, 0.08, 0.05), 0.55, 0.3)

# ------------------------------------------------------------------------------------------- ajudantes
def obj_de(nome, me, *mats, pai=None):
    o = bpy.data.objects.new(nome, me); cena.collection.objects.link(o)
    for m in mats: me.materials.append(m)
    if pai: o.parent = pai
    return o
def revolucao(nome, perfil, seg=96, uv_z=None, mats=None, pai=None, lisa=True, fecha=False):
    """perfil = [(r, z)] de baixo para cima; uv_z=(z0, z1) mapeia v pela altura e u pelo ângulo (u = 0,75 na frente)"""
    bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap'); anel = []
    for r, z in perfil:
        anel.append([bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for a in (2 * math.pi * k / seg for k in range(seg + 1))])
    for i in range(len(perfil) - 1):
        for k in range(seg):
            vs = [anel[i][k], anel[i][k + 1], anel[i + 1][k + 1], anel[i + 1][k]]
            if len({v.co.to_tuple(5) for v in vs}) < 3: continue
            try: f = bm.faces.new(vs)
            except ValueError: continue
            f.smooth = lisa
            for lp, (kk, ii) in zip(f.loops, ((k, i), (k + 1, i), (k + 1, i + 1), (k, i + 1))):
                zz = perfil[ii][1]; lp[uv].uv = (kk / seg, (zz - uv_z[0]) / (uv_z[1] - uv_z[0]) if uv_z else ii / (len(perfil) - 1))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free()
    o = obj_de(nome, me, *(mats or []), pai=pai)
    return o
def caixa(nome, tam, pos, m, pai=None, rot=(0, 0, 0)):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1); bmesh.ops.scale(bm, vec=tam, verts=bm.verts)
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free(); o = obj_de(nome, me, m, pai=pai); o.location = pos; o.rotation_euler = rot; return o
def cilindro(nome, r, h, pos, m, pai=None, rot=(0, 0, 0), seg=24, r2=None):
    bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=h)
    for f in bm.faces: f.smooth = True
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free(); o = obj_de(nome, me, m, pai=pai); o.location = pos; o.rotation_euler = rot; return o
def tubo(nome, a, b, r, m, pai=None, seg=12):
    a, b = Vector(a), Vector(b); d = b - a
    o = cilindro(nome, r, d.length, (a + b) / 2, m, pai=pai, seg=seg); o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = d.to_track_quat('Z', 'Y'); return o
def vazio(nome, pos, pai=None, rot=(0, 0, 0)):
    o = bpy.data.objects.new(nome, None); cena.collection.objects.link(o); o.location = pos; o.rotation_euler = rot
    if pai: o.parent = pai
    return o
def raio_nariz(z):
    t = min(1, max(0, (z - 16.7) / 6.5)); return R0 * math.cos(math.pi / 2 * t) ** 0.85 if z > 16.7 else R0

FOG = vazio('FoguetaoHRYZ', (0, 0, 0))
# ------------------------------------------------------------------------------------------- corpo + cápsula (uma revolução com a pintura)
perfil = [(0.0, Z0), (1.6, Z0), (1.98, Z0 + 0.02), (2.02, 2.1), (2.02, 2.32), (1.86, 2.6), (R0, 2.62)]
perfil += [(R0, z) for z in np.linspace(2.8, 16.3, 12)] + [(1.825, 16.36), (1.825, 16.72), (R0, 16.74)]
perfil += [(raio_nariz(z), z) for z in np.linspace(16.8, 23.05, 40)] + [(0.12, 23.15), (0.0, 23.2)]
corpo = revolucao('Corpo', perfil, 128, uv_z=(Z0, Z1), mats=[PINTURA], pai=FOG)
# ------------------------------------------------------------------------------------------- motores (central + 4)
def motor(nome, x, y, rt, re, z_g, z_s):
    g = vazio(nome, (x, y, 0), pai=FOG)
    n = 22; per = []
    for k in range(n + 1):
        s = k / n; r = rt + (re - rt) * (1 - (1 - s) ** 1.9); per.append((r, z_g - s * (z_g - z_s)))
    per = per[::-1]
    fora = revolucao(nome + 'Sino', per, 64, mats=[BOCAL], pai=g)
    dentro = revolucao(nome + 'Dentro', [(r * 0.985, z) for r, z in per][::-1], 64, mats=[COBRE], pai=g)
    # anéis de reforço do sino e a câmara/turbobomba em cima
    for s in (0.25, 0.55, 0.85):
        r = rt + (re - rt) * (1 - (1 - s) ** 1.9) + 0.012; zz = z_g - s * (z_g - z_s)
        revolucao(nome + f'Anel{s}', [(r, zz - 0.025), (r + 0.015, zz - 0.012), (r + 0.015, zz + 0.012), (r, zz + 0.025)], 48, mats=[GRAFITE], pai=g)
    cilindro(nome + 'Camara', rt * 1.5, 0.35, (0, 0, z_g + 0.15), GRAFITE, pai=g, seg=32)
    cilindro(nome + 'Cardan', rt * 0.9, 0.2, (0, 0, z_g + 0.4), ACO, pai=g, seg=24)
    return g
motor('MotorC', 0, 0, 0.3, 0.86, 1.95, 0.75)
for k in range(4):
    a = math.pi / 4 + k * math.pi / 2; motor(f'Motor{k}', 1.18 * math.cos(a), 1.18 * math.sin(a), 0.16, 0.42, 1.98, 1.2)
vazio('Bocal', (0, 0, 0.75), pai=FOG)
# escudo térmico (base escura) e folha dourada em volta da baia dos motores
revolucao('Escudo', [(0.0, 1.99), (1.95, 1.99)], 96, mats=[PRETO], pai=FOG)
revolucao('BaiaOuro', [(0.55, 1.99), (0.55, 2.05), (1.6, 2.05), (1.6, 1.99)], 64, mats=[OURO], pai=FOG)

# ------------------------------------------------------------------------------------------- pernas de pouso (dobráveis)
DOBRA = (R0 + 0.06, 3.7)                                   # (r, z) da dobradiça
PE = (4.35, 0.32)                                          # (r, z) da junta do pé, aberta
def perna(k):
    a = math.pi / 4 + k * math.pi / 2
    piv = vazio(f'Perna{k}', (DOBRA[0] * math.cos(a), DOBRA[0] * math.sin(a), DOBRA[1]), pai=FOG, rot=(0, 0, a))
    # no sistema da dobradiça: +X para fora, Z para cima
    dx, dz = PE[0] - DOBRA[0], PE[1] - DOBRA[1]; L = math.hypot(dx, dz); ang = math.atan2(dz, dx)
    viga = caixa(f'Perna{k}Viga', (L, 0.26, 0.22), (dx / 2, 0, dz / 2), BRANCO, pai=piv, rot=(0, -ang, 0))
    caixa(f'Perna{k}Faixa', (L * 0.25, 0.27, 0.23), (dx * 0.62, 0, dz * 0.62), PRETO, pai=piv, rot=(0, -ang, 0))
    # amortecedor (pistão) por baixo da viga com capa dourada
    p0, p1 = Vector((0.15, 0, -0.35)), Vector((dx * 0.7, 0, dz * 0.7 - 0.15))
    tubo(f'Perna{k}Pistao', p0, p0.lerp(p1, 0.6), 0.09, OURO, pai=piv); tubo(f'Perna{k}Haste', p0.lerp(p1, 0.55), p1, 0.05, ACO, pai=piv)
    cilindro(f'Perna{k}Eixo', 0.12, 0.34, (0, 0, 0), ACO, pai=piv, rot=(math.pi / 2, 0, 0), seg=20)
    # pé: disco com junta esférica
    cilindro(f'Perna{k}Pe', 0.55, 0.12, (dx, 0, dz - 0.26), GRAFITE, pai=piv, seg=32, r2=0.42)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.16, location=(0, 0, 0), segments=20, ring_count=12); bola = bpy.context.object; bola.name = f'Perna{k}Junta'
    bola.data.materials.append(ACO); bola.parent = piv; bola.location = (dx, 0, dz - 0.12); bpy.ops.object.shade_smooth()
    # suporte no corpo (fixo)
    caixa(f'Suporte{k}', (0.3, 0.5, 0.6), ((R0 - 0.05) * math.cos(a), (R0 - 0.05) * math.sin(a), DOBRA[1]), GRAFITE, pai=FOG, rot=(0, 0, a))
for k in range(4): perna(k)

# ------------------------------------------------------------------------------------------- escotilha (frente) e escada
ESC_Z0, ESC_Z1, ESC_LARG = 3.02, 4.82, 1.12
meia = ESC_LARG / 2 / R0
def painel_curvo(nome, r, a0, a1, z0, z1, m, pai, seg=16, ref=(0, 0)):
    bm = bmesh.new(); vs = []
    for i, z in enumerate((z0, z1)):
        vs.append([bm.verts.new((r * math.cos(a) - ref[0], r * math.sin(a) - ref[1], z)) for a in np.linspace(a0, a1, seg + 1)])
    for k in range(seg): bm.faces.new([vs[0][k], vs[0][k + 1], vs[1][k + 1], vs[1][k]])
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.06)
    for f in bm.faces: f.smooth = True
    me = bpy.data.meshes.new(nome); bm.to_mesh(me); bm.free(); return obj_de(nome, me, m, pai=pai)
a_dob = FRENTE - meia                                        # dobradiça do lado esquerdo (de quem olha de frente)
dob = (R0 * math.cos(a_dob), R0 * math.sin(a_dob))
esc = vazio('Escotilha', (dob[0], dob[1], 0), pai=FOG)
painel_curvo('EscotilhaPorta', R0 + 0.035, FRENTE - meia, FRENTE + meia, ESC_Z0, ESC_Z1, BRANCO, esc, ref=dob)
jan = cilindro('EscotilhaJanela', 0.17, 0.05, (R0 * math.cos(FRENTE) + 0 - dob[0], R0 * math.sin(FRENTE) - 0.07 - dob[1], 4.25), VIDRO, pai=esc, rot=(math.pi / 2, 0, 0), seg=32)
revolucao('EscotilhaAro', [(0.17, -0.02), (0.22, -0.02), (0.22, 0.02), (0.17, 0.02)], 32, mats=[GRAFITE], pai=jan)
caixa('EscotilhaPuxador', (0.36, 0.06, 0.06), (R0 * math.cos(FRENTE) + 0.3 - dob[0], R0 * math.sin(FRENTE) - 0.12 - dob[1], 3.75), ACO, pai=esc)
painel_curvo('PortalEscuro', R0 + 0.004, FRENTE - meia * 0.92, FRENTE + meia * 0.92, ESC_Z0 + 0.05, ESC_Z1 - 0.05, PRETO, FOG)
# escada: dois trilhos do chão até a escotilha, degraus a cada 0,3 m, presa na saia
yE = -(2.25)
for sx in (-0.28, 0.28):
    tubo(f'EscadaTrilho{sx}', (sx, yE, 0.0), (sx, yE + 0.3, ESC_Z0 + 0.25), 0.03, ACO, pai=FOG)
for i in range(1, 11):
    z = i * 0.3; yy = yE + 0.3 * z / (ESC_Z0 + 0.25)
    tubo(f'EscadaDegrau{i}', (-0.28, yy, z), (0.28, yy, z), 0.022, ACO, pai=FOG)
for sx in (-0.28, 0.28): tubo(f'EscadaBraco{sx}', (sx, yE + 0.21, 2.2), (sx, -2.0, 2.2), 0.025, ACO, pai=FOG)

# ------------------------------------------------------------------------------------------- janelas da cápsula, RCS, antena, luzes
def na_superficie(nome, ang, z, fora=0.0):
    r = raio_nariz(z); dr = (raio_nariz(z + 0.05) - raio_nariz(z - 0.05)) / 0.1
    nrm = Vector((math.cos(ang), math.sin(ang), -dr)).normalized()
    pos = Vector((r * math.cos(ang), r * math.sin(ang), z)) + nrm * fora
    return pos, nrm.to_track_quat('Z', 'Y')
for i, da in enumerate((-0.42, 0.0, 0.42)):
    pos, q = na_superficie('j', FRENTE + da, 19.15, 0.0)
    v = cilindro(f'Janela{i}', 0.3, 0.06, pos, VIDRO, pai=FOG, seg=40); v.rotation_mode = 'QUATERNION'; v.rotation_quaternion = q
    a_ = revolucao(f'JanelaAro{i}', [(0.3, -0.02), (0.38, -0.01), (0.38, 0.05), (0.3, 0.06)], 40, mats=[PRETO], pai=v)
for k in range(4):
    a = k * math.pi / 2
    pos, q = na_superficie('rcs', a, 17.4, 0.05)
    c = caixa(f'RCS{k}', (0.36, 0.36, 0.18), pos, GRAFITE, pai=FOG); c.rotation_mode = 'QUATERNION'; c.rotation_quaternion = q
    for j, (ox, oy) in enumerate(((0.16, 0), (-0.16, 0), (0, 0.16))):
        cilindro(f'RCS{k}b{j}', 0.035, 0.12, (ox * 1.1, oy * 1.1, 0.06), BOCAL, pai=c, rot=(0, math.pi / 2, 0) if oy == 0 else (math.pi / 2, 0, 0), r2=0.055)
pos, q = na_superficie('ant', FRENTE + math.pi, 18.2, 0.0)
mastro = cilindro('AntenaMastro', 0.03, 0.6, pos, ACO, pai=FOG); mastro.rotation_mode = 'QUATERNION'; mastro.rotation_quaternion = q
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.45, location=(0, 0, 0), segments=32, ring_count=16); prato = bpy.context.object; prato.name = 'AntenaPrato'
bm = bmesh.new(); bm.from_mesh(prato.data); bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z > -0.25], context='VERTS'); bm.to_mesh(prato.data); bm.free()
prato.data.materials.append(BRANCO); prato.parent = mastro; prato.location = (0, 0, 0.75); prato.rotation_euler = (math.pi, 0, 0)
mod = prato.modifiers.new('esp', 'SOLIDIFY'); mod.thickness = 0.03
for nome, ang, m in (('LuzBombordo', FRENTE + math.pi / 2, LUZ_V), ('LuzBoreste', FRENTE - math.pi / 2, LUZ_G)):
    pos, q = na_superficie(nome, ang, 16.55, 0.03)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, location=pos, segments=16, ring_count=8); bpy.context.object.name = nome; bpy.context.object.data.materials.append(m); bpy.context.object.parent = FOG

# ------------------------------------------------------------------------------------------- plataforma de lançamento (outro GLB)
PAD = vazio('PlataformaHRYZ', (0, 0, 0))
bm = bmesh.new(); bmesh.ops.create_circle(bm, cap_ends=True, segments=8, radius=11.5)
bmesh.ops.extrude_face_region(bm, geom=bm.faces[:]); 
for v in bm.verts:
    if abs(v.co.z) < 1e-6 and any(abs(v.co.z) < 1e-6 for _ in [0]): pass
top = [v for v in bm.verts][len(bm.verts) // 2:]
for v in top: v.co.z = 0.6
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
me = bpy.data.meshes.new('PadBase'); bm.to_mesh(me); bm.free(); base = obj_de('PadBase', me, CONCRETO, pai=PAD); base.rotation_euler = (0, 0, math.pi / 8)
caixa('PadTrincheira', (3.2, 9.0, 0.05), (0, 6.5, 0.61), PRETO, pai=PAD)           # saída do fogo (canaleta)
for k in range(8):                                                                    # faixas amarelas na borda
    a = k * math.pi / 4 + math.pi / 8
    caixa(f'PadFaixa{k}', (0.5, 8.6, 0.03), (10.6 * math.cos(a), 10.6 * math.sin(a), 0.62), AMARELO, pai=PAD, rot=(0, 0, a))
revolucao('PadCirculo', [(4.6, 0.611), (4.9, 0.611)], 96, mats=[AMARELO], pai=PAD)
# rampa de subida (frente)
caixa('PadRampa', (2.8, 3.2, 0.6), (0, -12.6, 0.3), CONCRETO, pai=PAD, rot=(-math.atan2(0.6, 3.2) * 0 , 0, 0))
# torre de serviço treliçada ao lado (+X), 30 m, com luzes vermelhas e a placa HRYZ
TX, TL, TH = 8.2, 2.4, 30.0
for sx in (-1, 1):
    for sy in (-1, 1): caixa(f'TorreColuna{sx}{sy}', (0.22, 0.22, TH), (TX + sx * TL / 2, sy * TL / 2, 0.6 + TH / 2), VERMELHO_TORRE, pai=PAD)
for i in range(13):
    z = 0.6 + 1.0 + i * 2.3
    for (x0, y0, x1, y1) in ((-1, -1, 1, -1), (1, -1, 1, 1), (1, 1, -1, 1), (-1, 1, -1, -1)):
        tubo(f'TorreTravessa{i}{x0}{y0}', (TX + x0 * TL / 2, y0 * TL / 2, z), (TX + x1 * TL / 2, y1 * TL / 2, z), 0.06, VERMELHO_TORRE, pai=PAD, seg=6)
        if i < 12: tubo(f'TorreDiag{i}{x0}{y0}', (TX + x0 * TL / 2, y0 * TL / 2, z), (TX + x1 * TL / 2, y1 * TL / 2, z + 2.3), 0.045, VERMELHO_TORRE, pai=PAD, seg=6)
caixa('TorreTopo', (TL + 0.6, TL + 0.6, 0.3), (TX, 0, 0.6 + TH + 0.15), GRAFITE, pai=PAD)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.25, location=(TX, 0, 0.6 + TH + 0.55), segments=16, ring_count=8); bpy.context.object.name = 'TorreLuz'; bpy.context.object.data.materials.append(LUZ_V); bpy.context.object.parent = PAD
# braço de acesso no nível da cápsula, recolhido (aponta para o foguete, para longe do corpo)
caixa('TorreBraco', (4.2, 1.4, 0.25), (TX - TL / 2 - 2.1, 0, 0.6 + 18.6), GRAFITE, pai=PAD)
for sy in (-0.65, 0.65): caixa(f'TorreGuarda{sy}', (4.2, 0.05, 1.0), (TX - TL / 2 - 2.1, sy, 0.6 + 19.2), AMARELO, pai=PAD)
# placa
tc = bpy.data.curves.new('PlacaTxt', 'FONT'); tc.body = 'HRYZ ANIMATION'; tc.size = 0.85; tc.align_x = 'CENTER'; tc.extrude = 0.03
try: tc.font = bpy.data.fonts.load('/usr/share/fonts/opentype/inter/Inter-Black.otf')
except Exception: pass
txt = bpy.data.objects.new('PlacaTexto', tc); cena.collection.objects.link(txt); txt.parent = PAD
txt.location = (TX, -TL / 2 - 0.09, 0.6 + 24.0); txt.rotation_euler = (math.pi / 2, 0, 0); tc.materials.append(BRANCO) if hasattr(tc, 'materials') else None
caixa('PlacaFundo', (7.4, 0.05, 1.4), (TX, -TL / 2 - 0.05, 0.6 + 24.3), PRETO, pai=PAD)
FOG.location = (0, 0, 0.6)                                   # no pad, o foguete fica em cima da base (0,6 m)

# ------------------------------------------------------------------------------------------- exportar
def descendentes(o): return [o] + [d for c in o.children for d in descendentes(c)]
def exportar(raiz, arq):
    bpy.ops.object.select_all(action='DESELECT')
    for o in descendentes(raiz): o.select_set(True)
    loc = raiz.location.copy(); raiz.location = (0, 0, 0)
    bpy.ops.export_scene.gltf(filepath=os.path.join(SAIDA_GLB, arq), use_selection=True, export_format='GLB', export_image_format='JPEG',
                              export_jpeg_quality=90, export_apply=True, export_yup=True)
    raiz.location = loc
    tris = sum(len(o.data.polygons) for o in descendentes(raiz) if o.type == 'MESH')
    print('GLB', arq, round(os.path.getsize(os.path.join(SAIDA_GLB, arq)) / 1e6, 2), 'MB', tris, 'faces')
# a placa (texto) vira malha antes de exportar
bpy.context.view_layer.objects.active = txt; txt.select_set(True); bpy.ops.object.convert(target='MESH'); txt = bpy.context.object
exportar(FOG, 'foguete_hryz.glb')
exportar(PAD, 'plataforma_foguete.glb')

# ------------------------------------------------------------------------------------------- prévias
if SAIDA_R:
    os.makedirs(SAIDA_R, exist_ok=True)
    w = bpy.data.worlds.new('Estudio'); cena.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.35, 0.45, 0.6, 1); bg.inputs['Strength'].default_value = 0.6
    chao = bpy.data.objects.new('Chao', bpy.data.meshes.new('Chao')); cena.collection.objects.link(chao)
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=200); bm.to_mesh(chao.data); bm.free(); chao.data.materials.append(mat('Chao', (0.3, 0.3, 0.3), 0.9))
    sol = bpy.data.objects.new('Sol', bpy.data.lights.new('Sol', 'SUN')); cena.collection.objects.link(sol); sol.data.energy = 4.5; sol.data.angle = 0.02
    sol.rotation_euler = (math.radians(50), 0, math.radians(-35))
    cena.render.engine = 'CYCLES'; cena.cycles.device = 'CPU'; cena.cycles.samples = AMOSTRAS; cena.cycles.use_denoising = True
    cena.render.resolution_x, cena.render.resolution_y = 1080, 1350; cena.view_settings.view_transform = 'AgX'
    cam = bpy.data.objects.new('Cam', bpy.data.cameras.new('Cam')); cena.collection.objects.link(cam); cena.camera = cam; cam.data.clip_end = 2000
    def olhar(p, a, lente):
        cam.location = Vector(p); cam.rotation_euler = (Vector(a) - Vector(p)).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = lente
    vistas = {'tq': ((22, -30, 9), (0, 0, 11.5), 40), 'frente': ((0, -14, 3.2), (0, 0, 3.8), 30), 'base': ((7, -8, 0.8), (0, 0, 2.2), 24), 'pad': ((40, -48, 14), (3, 0, 12), 35)}
    PAD.hide_render = True
    for nome in VISTAS:
        PAD.hide_render = nome != 'pad'
        for o in descendentes(PAD): o.hide_render = nome != 'pad'
        p, a, l = vistas[nome]; olhar(p, a, l)
        cena.render.filepath = os.path.join(SAIDA_R, f'foguete_{nome}.png'); bpy.ops.render.render(write_still=True); print('render', nome)
