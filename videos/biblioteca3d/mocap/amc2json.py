#!/usr/bin/env python3
"""Captura de movimento CMU (ASF/AMC) -> JSON com as posições das articulações por quadro (30 fps, metros, y para cima), para reaproveitar
em qualquer personagem do canal (o Three.js alinha cada osso com o segmento correspondente: js de retarget em lucas_poder/js/mocap.js).
Dados da CMU Graphics Lab Motion Capture Database (http://mocap.cs.cmu.edu): uso livre, inclusive em produtos comerciais (não revender os dados brutos).
uso: python3 amc2json.py <arquivo.asf> <arquivo.amc> <saida.json> [--de 0 --ate 9999 (quadros na taxa original)] [--fps 120 (taxa da captura: 120 ou 60, ver catalogo_cmu.tsv)]"""
import sys, json, math
import numpy as np

def arg(n, d): return sys.argv[sys.argv.index('--' + n) + 1] if '--' + n in sys.argv else d
ASF, AMC, OUT = sys.argv[1:4]; DE, ATE = int(arg('de', 0)), int(arg('ate', 10 ** 9))
ESC = (1.0 / 0.45) * 0.0254                                    # unidade do ASF -> polegadas -> metros

def rot(eixos, ang):
    R = np.eye(3)
    for e, a in zip(eixos, ang):
        c, s = math.cos(a), math.sin(a)
        M = {'x': np.array([[1, 0, 0], [0, c, -s], [0, s, c]]), 'y': np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]]), 'z': np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])}[e]
        R = M @ R                                              # ordem estática x, depois y, depois z (R = Rz Ry Rx)
    return R

# ---- ASF
ossos, hier, raiz_ordem = {}, {}, []
with open(ASF) as f: linhas = [l.strip() for l in f]
i = 0; secao = None
while i < len(linhas):
    l = linhas[i]
    if l.startswith(':'): secao = l.split()[0];
    if secao == ':root' and l.startswith('order'): raiz_ordem = l.split()[1:]
    if secao == ':bonedata' and l == 'begin':
        b = {'dof': []}; i += 1
        while linhas[i] != 'end':
            p = linhas[i].split()
            if p[0] == 'name': b['nome'] = p[1]
            elif p[0] == 'direction': b['dir'] = np.array([float(x) for x in p[1:4]])
            elif p[0] == 'length': b['comp'] = float(p[1]) * ESC
            elif p[0] == 'axis': b['C'] = rot('xyz', [math.radians(float(x)) for x in p[1:4]])
            elif p[0] == 'dof': b['dof'] = [x.lower() for x in p[1:]]
            i += 1
        ossos[b['nome']] = b
    if secao == ':hierarchy' and l not in ('begin', 'end') and not l.startswith(':'):
        p = l.split(); hier[p[0]] = p[1:]
    i += 1
pai = {f: p for p, fs in hier.items() for f in fs}

# ---- AMC
quadros, atual = [], None
with open(AMC) as f:
    for l in f:
        l = l.strip()
        if not l or l.startswith('#') or l.startswith(':'): continue
        p = l.split()
        if p[0].isdigit() and len(p) == 1: atual = {}; quadros.append(atual); continue
        atual[p[0]] = [float(x) for x in p[1:]]
quadros = quadros[DE:ATE]

def fk(q):
    M, P = {}, {}
    r = q['root']; pos = np.array(r[0:3]) * ESC; ang = [math.radians(x) for x in r[3:6]]
    M['root'] = rot('xyz', ang); P['root'] = pos
    def vai(nome):
        for f in hier.get(nome, []):
            b = ossos[f]; ang = [0.0, 0.0, 0.0]; v = q.get(f, [])
            for k, d in enumerate(b['dof']): ang['xyz'.index(d[1])] = math.radians(v[k]) if k < len(v) else 0
            M[f] = M[nome] @ b['C'] @ rot('xyz', ang) @ b['C'].T
            P[f] = P[nome] + b['comp'] * (M[f] @ b['dir'])
            vai(f)
    vai('root'); return P

JUNTAS = ['root', 'lhipjoint', 'lfemur', 'ltibia', 'lfoot', 'ltoes', 'rhipjoint', 'rfemur', 'rtibia', 'rfoot', 'rtoes', 'lowerback', 'upperback', 'thorax', 'lowerneck', 'upperneck', 'head',
          'lclavicle', 'lhumerus', 'lradius', 'lwrist', 'lhand', 'rclavicle', 'rhumerus', 'rradius', 'rwrist', 'rhand']
saida = {'fps': 30, 'juntas': JUNTAS, 'nota': 'posição do FIM de cada osso CMU (root = quadril), metros, y para cima', 'quadros': []}
for k in range(0, len(quadros), max(1, int(arg('fps', 120)) // 30)):   # 120 (ou 60) -> 30 fps
    P = fk(quadros[k]); saida['quadros'].append([round(float(c), 4) for j in JUNTAS for c in P.get(j, P['root'])])
json.dump(saida, open(OUT, 'w'), separators=(',', ':'))
print(OUT, len(saida['quadros']), 'quadros a 30 fps')
