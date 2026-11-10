"""Confere os GLB do elenco lendo o ARQUIVO: estrutura, pesos de pele e as animações por cinemática direta (pés no chão, escorregão, laços, limites).
Uso:  python3 validar.py [arquivo.glb ...]   (padrão: todos os .glb da pasta acima)"""
import glob
import json
import math
import os
import struct
import sys
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
from mat3 import ID, qmul, qrot                                           # noqa: E402

CHAO = 0.003


def ler_glb(caminho):
    d = open(caminho, 'rb').read()
    jl = struct.unpack('<I', d[12:16])[0]
    doc = json.loads(d[20:20 + jl])
    off = 20 + jl
    bl = struct.unpack('<I', d[off:off + 4])[0]
    return doc, d[off + 8:off + 8 + bl]


def acessor(doc, binario, i):
    a = doc['accessors'][i]
    v = doc['bufferViews'][a['bufferView']]
    comp = {5121: np.uint8, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}[a['componentType']]
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[a['type']]
    arr = np.frombuffer(binario, dtype=comp, count=a['count'] * n, offset=v.get('byteOffset', 0) + a.get('byteOffset', 0))
    return arr.reshape(a['count'], n) if n > 1 else arr


def validar(caminho):
    erros, avisos = [], []
    doc, binario = ler_glb(caminho)
    nodes = doc['nodes']
    nomes = [n['name'] for n in nodes]
    pai = {}
    for i, n in enumerate(nodes):
        for c in n.get('children', []):
            pai[nomes[c]] = nomes[i]
    juntas = [nomes[j] for j in doc['skins'][0]['joints']]
    rest = {n['name']: np.array(n.get('translation', [0, 0, 0]), dtype=float) for n in nodes if n['name'] in juntas}
    ex = nodes[nomes.index('Raiz')].get('extras', {})
    k_pe = ex['pe']['bola'][2] / 0.115
    calc = np.array(ex['pe']['calcanhar'])
    print('\n==', os.path.basename(caminho), '·', round(os.path.getsize(caminho) / 1024), 'KB ·', ex.get('nome'), '·', ex.get('altura_m'), 'm')
    ntris = nvert = 0
    for m in doc['meshes']:
        for pr in m['primitives']:
            at = pr['attributes']
            j = acessor(doc, binario, at['JOINTS_0']).astype(int)
            w = acessor(doc, binario, at['WEIGHTS_0']).astype(float)
            if j.max() >= len(juntas):
                erros.append('JOINTS_0 fora do esqueleto')
            if not np.allclose(w.sum(axis=1), 1, atol=1e-3):
                erros.append('pesos não somam 1')
            if ((w == 0) & (j != 0)).any():
                erros.append('junta com peso zero e índice diferente de 0')
            ntris += doc['accessors'][pr['indices']]['count'] // 3
            nvert += doc['accessors'][at['POSITION']]['count']
            if doc['accessors'][at['POSITION']]['count'] >= 65535:
                erros.append('primitiva com vértices demais para índice de 16 bits')
    print('malha: %d triângulos, %d vértices, %d materiais, %d ossos' % (ntris, nvert, len(doc['materials']), len(juntas)))

    def fk(rots, tq):
        P, Q = {}, {}
        for n in juntas:
            p = pai.get(n)
            r = rots.get(n, ID)
            if p is None or p not in juntas:
                Q[n], P[n] = r, rest[n].copy()
            else:
                Q[n] = qmul(Q[p], r)
                P[n] = P[p] + qrot(Q[p], tq if n == 'Quadril' else rest[n])
        return P, Q
    for an in doc.get('animations', []):
        nome = an['name']
        tem, tempos = {}, None
        for ch in an['channels']:
            s = an['samplers'][ch['sampler']]
            t = acessor(doc, binario, s['input'])
            tem[(nomes[ch['target']['node']], ch['target']['path'])] = acessor(doc, binario, s['output'])
            tempos = t if tempos is None else tempos
        n = len(tempos)
        fps = round((n - 1) / float(tempos[-1]))
        info = ex.get('clipes', {}).get(nome, {})
        vc, laco = float(info.get('velocidade', 0.0)), bool(info.get('laco', True))
        frames = [({no: v[k].astype(float) for (no, p), v in tem.items() if p == 'rotation'}, tem[('Quadril', 'translation')][k].astype(float)) for k in range(n)]
        pior = max(abs(np.linalg.norm(q) - 1) for r, _ in frames for q in r.values())
        if pior > 1e-3:
            erros.append('%s: quaternion não unitário' % nome)
        if laco:
            dif = max(float(np.linalg.norm(frames[0][0].get(o, ID) - frames[-1][0].get(o, ID))) for o in juntas)
            dif = max(dif, float(np.linalg.norm(frames[0][1] - frames[-1][1])))
            if dif > 1e-4:
                erros.append('%s: início e fim diferentes (%.2e)' % (nome, dif))
        PQ = [fk(r, tq) for r, tq in frames]
        minimo, slip, onde_min, onde_slip, medidas = 9.0, 0.0, '', '', 0
        for lado in 'ED':
            pts = []
            for k in range(n):
                P, Q = PQ[k]
                c = P['Pe' + lado] + qrot(Q['Pe' + lado], calc)
                b = P['Ponteira' + lado] + qrot(Q['Ponteira' + lado], np.array([0.0, -0.035 * k_pe, 0.0]))
                pt = P['Ponteira' + lado] + qrot(Q['Ponteira' + lado], np.array([0.0, -0.035 * k_pe, 0.100 * k_pe]))
                pts.append((c, b, pt))
                for nm, pp in (('calcanhar', c), ('bola', b), ('ponta', pt)):
                    if pp[1] < minimo:
                        minimo, onde_min = pp[1], '%s %s t=%.2fs' % (nm, lado, k / fps)
            for idx in range(3):
                for k in range(1, n):
                    a, b = pts[k - 1][idx], pts[k][idx]
                    if a[1] < CHAO and b[1] < CHAO:
                        medidas += 1
                        d = float(np.linalg.norm(np.array([b[0], b[2] + vc * k / fps]) - np.array([a[0], a[2] + vc * (k - 1) / fps])))
                        if d > slip:
                            slip, onde_slip = d, '%s %s t=%.2fs' % (('calcanhar', 'bola', 'ponta')[idx], lado, k / fps)
        joe, cot = [9, -9], [9, -9]
        for k in range(n):
            for lado in 'ED':
                q = frames[k][0].get('Canela' + lado, ID)
                a_ = 2 * math.atan2(q[0], q[3])
                joe = [min(joe[0], a_), max(joe[1], a_)]
                P, Q = PQ[k]
                u = P['Antebraco' + lado] - P['Braco' + lado]
                f = P['Mao' + lado] - P['Antebraco' + lado]
                a_ = math.acos(max(-1.0, min(1.0, float(np.dot(u, f) / (np.linalg.norm(u) * np.linalg.norm(f))))))       # 0 = braço esticado
                cot = [min(cot[0], a_), max(cot[1], a_)]
        vmax, vosso = 0.0, ''
        for o in juntas:
            for k in range(1, n):
                d = abs(float(np.dot(frames[k - 1][0].get(o, ID), frames[k][0].get(o, ID))))
                a_ = 2 * math.acos(min(1.0, d))
                if a_ * fps > vmax:
                    vmax, vosso = a_ * fps, o
        ys = [P['Quadril'][1] for P, _ in PQ]
        print('%-9s %5.2f s · %d fps · sola mais baixa %+0.1f mm · escorregão %0.2f mm/quadro (%d med.) · joelho %0.0f°..%0.0f° · cotovelo %0.0f°..%0.0f° · pelve y %0.2f..%0.2f · pico %0.0f rad/s (%s)'
              % (nome, float(tempos[-1]), fps, minimo * 1000, slip * 1000, medidas, math.degrees(joe[0]), math.degrees(joe[1]), math.degrees(cot[0]), math.degrees(cot[1]), min(ys), max(ys), vmax, vosso))
        if minimo < -0.008:
            erros.append('%s: pé atravessa o chão (%.1f mm: %s)' % (nome, minimo * 1000, onde_min))
        if slip > 0.0025:
            erros.append('%s: pé apoiado escorrega %.2f mm por quadro (%s)' % (nome, slip * 1000, onde_slip))
        if math.degrees(joe[0]) < -3:
            erros.append('%s: joelho hiperestendido (%.0f°)' % (nome, math.degrees(joe[0])))
        if math.degrees(joe[1]) > 150:
            erros.append('%s: joelho dobra demais' % nome)
        if math.degrees(cot[1]) > 165:
            erros.append('%s: cotovelo fora do limite (%.0f°..%.0f°)' % (nome, math.degrees(cot[0]), math.degrees(cot[1])))
        if vmax > 70:
            avisos.append('%s: pico de velocidade angular alto (%s %.0f rad/s)' % (nome, vosso, vmax))
    for a in avisos:
        print('  aviso:', a)
    for er in erros:
        print('  ERRO:', er)
    if not erros:
        print('  ok')
    return not erros


if __name__ == '__main__':
    arqs = sys.argv[1:] or sorted(glob.glob(os.path.join(AQUI, '..', '*.glb')))
    ok = all([validar(a) for a in arqs])
    sys.exit(0 if ok else 1)
