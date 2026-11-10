"""Confere os GLB do Corredor lendo o ARQUIVO (não o gerador): estrutura, pesos, e as animações por cinemática direta.
Uso:  python3 validar.py [corredor.glb ...]      (padrão: os dois GLB da pasta acima)
Checa: pesos somam 1 e juntas válidas; quaternions unitários; início = fim nos clipes em laço; pés sem atravessar o chão;
pontos da sola que tocam o chão NÃO escorregam (corpo avança na velocidade do clipe); limites de joelho e cotovelo; picos de velocidade angular."""
import json
import math
import os
import struct
import sys
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import base as B                                   # noqa: E402

CHAO = 0.003                                       # um ponto da sola até 3 mm do chão conta como apoiado


def ler_glb(caminho):
    d = open(caminho, 'rb').read()
    jl = struct.unpack('<I', d[12:16])[0]
    doc = json.loads(d[20:20 + jl])
    off = 20 + jl
    bl = struct.unpack('<I', d[off:off + 4])[0]
    binario = d[off + 8:off + 8 + bl]
    return doc, binario


def acessor(doc, binario, i):
    a = doc['accessors'][i]
    v = doc['bufferViews'][a['bufferView']]
    comp = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}[a['componentType']]
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[a['type']]
    arr = np.frombuffer(binario, dtype=comp, count=a['count'] * n, offset=v.get('byteOffset', 0) + a.get('byteOffset', 0))
    return arr.reshape(a['count'], n) if n > 1 else arr


def quat_mul(a, b):
    return B.qmul(a, b)


def fk_frame(rots, trans_quad, rest):
    P, Q = {}, {}
    for n in B.OSSOS:
        pai = B.PAI[n]
        r = rots.get(n, B.ID)
        if pai is None:
            Q[n], P[n] = r, rest[n].copy()
        else:
            Q[n] = B.qmul(Q[pai], r)
            loc = trans_quad if n == 'Quadril' else rest[n]
            P[n] = P[pai] + B.qrot(Q[pai], loc)
    return P, Q


def validar(caminho):
    erros, avisos = [], []
    doc, binario = ler_glb(caminho)
    nomes = [n['name'] for n in doc['nodes']]
    print('\n==', os.path.basename(caminho), '·', round(os.path.getsize(caminho) / 1024), 'KB')
    # --- esqueleto e malha
    skin = doc['skins'][0]
    juntas = [nomes[j] for j in skin['joints']]
    if juntas != B.OSSOS:
        erros.append('ordem das juntas diferente do esqueleto de base.py')
    rest = {}
    for n in doc['nodes']:
        if n['name'] in B.PAI:
            rest[n['name']] = np.array(n.get('translation', [0, 0, 0]), dtype=float)
    ntris, nvert = 0, 0
    for m in doc['meshes']:
        for pr in m['primitives']:
            at = pr['attributes']
            j = acessor(doc, binario, at['JOINTS_0']).astype(int)
            w = acessor(doc, binario, at['WEIGHTS_0']).astype(float)
            if j.max() >= len(juntas):
                erros.append('JOINTS_0 fora do esqueleto')
            if not np.allclose(w.sum(axis=1), 1, atol=1e-3):
                erros.append('pesos não somam 1 (%s)' % m['name'])
            ntris += doc['accessors'][pr['indices']]['count'] // 3
            nvert += doc['accessors'][at['POSITION']]['count']
            if doc['accessors'][at['POSITION']]['count'] >= 65535:
                avisos.append('primitiva com mais de 65534 vértices')
    print('malha: %d triângulos, %d vértices, %d materiais, %d ossos' % (ntris, nvert, len(doc['materials']), len(juntas)))
    # --- animações
    for an in doc.get('animations', []):
        nome = an['name']
        tem = {}
        tempos = None
        for ch in an['channels']:
            s = an['samplers'][ch['sampler']]
            t = acessor(doc, binario, s['input'])
            v = acessor(doc, binario, s['output'])
            no = nomes[ch['target']['node']]
            tem[(no, ch['target']['path'])] = v
            tempos = t if tempos is None else tempos
            if len(t) != len(tempos) or not np.allclose(t, tempos):
                erros.append('%s: canais com tempos diferentes' % nome)
        n = len(tempos)
        fps = round((n - 1) / float(tempos[-1]))
        dur = float(tempos[-1])
        info = (doc['nodes'][nomes.index('Raiz')].get('extras', {}).get('clipes', {}) or {}).get(nome, {})
        v_corpo = float(info.get('velocidade', 0.0))
        laco = bool(info.get('laco', True))
        frames = []
        for k in range(n):
            rots = {}
            for (no, path), v in tem.items():
                if path == 'rotation':
                    rots[no] = v[k].astype(float)
            tq = tem[('Quadril', 'translation')][k].astype(float)
            frames.append((rots, tq))
        # quaternions unitários
        pior = max(abs(np.linalg.norm(q) - 1) for r, _ in frames for q in r.values())
        if pior > 1e-3:
            erros.append('%s: quaternion não unitário (%.1e)' % (nome, pior))
        # início = fim
        if laco:
            dif = max(float(np.linalg.norm(frames[0][0].get(o, B.ID) - frames[-1][0].get(o, B.ID))) for o in B.OSSOS)
            dif = max(dif, float(np.linalg.norm(frames[0][1] - frames[-1][1])))
            if dif > 1e-4:
                erros.append('%s: início e fim diferentes (%.2e)' % (nome, dif))
        # cinemática direta
        pts = {}
        P_all, Q_all = [], []
        for rots, tq in frames:
            P, Q = fk_frame(rots, tq, rest)
            P_all.append(P)
            Q_all.append(Q)
        minimo, slip_max, slip_n, apoio_frames = 9.0, 0.0, 0, 0
        onde_min, onde_slip = '', ''
        for lado in 'ED':
            pontos = []
            for k in range(n):
                P, Q = P_all[k], Q_all[k]
                calc = P['Pe' + lado] + B.qrot(Q['Pe' + lado], B.PE_CALCANHAR)
                bola = P['Ponteira' + lado] + B.qrot(Q['Ponteira' + lado], np.array([0.0, -0.035, 0.0]))
                ponta = P['Ponteira' + lado] + B.qrot(Q['Ponteira' + lado], np.array([0.0, -0.035, 0.100]))
                pontos.append((calc, bola, ponta))
                for nome_p, pp in (('calcanhar', calc), ('bola', bola), ('ponta', ponta)):
                    if pp[1] < minimo:
                        minimo, onde_min = pp[1], '%s %s t=%.2fs' % (nome_p, lado, k / fps)
            for idx in range(3):
                for k in range(1, n):
                    a, b = pontos[k - 1][idx], pontos[k][idx]
                    if a[1] < CHAO and b[1] < CHAO:
                        apoio_frames += 1
                        mundo_a = np.array([a[0], a[2] + v_corpo * (k - 1) / fps])
                        mundo_b = np.array([b[0], b[2] + v_corpo * k / fps])
                        d = float(np.linalg.norm(mundo_b - mundo_a))
                        if d > slip_max:
                            slip_max, onde_slip = d, '%s %s t=%.2fs' % (('calcanhar', 'bola', 'ponta')[idx], lado, k / fps)
        # joelho e cotovelo
        joe, cot = [9, -9], [9, -9]
        for k in range(n):
            for lado in 'ED':
                q = frames[k][0].get('Canela' + lado, B.ID)
                ang = 2 * math.atan2(q[0], q[3])                      # rotação em X (positivo = joelho dobrado)
                joe = [min(joe[0], ang), max(joe[1], ang)]
                q = frames[k][0].get('Antebraco' + lado, B.ID)
                ang = -2 * math.atan2(q[0], q[3])                     # flexão do cotovelo (positivo = dobrado)
                cot = [min(cot[0], ang), max(cot[1], ang)]
        # velocidades angulares
        vmax, vosso = 0.0, ''
        for o in B.OSSOS:
            for k in range(1, n):
                a, b = frames[k - 1][0].get(o, B.ID), frames[k][0].get(o, B.ID)
                d = abs(float(np.dot(a, b)))
                ang = 2 * math.acos(min(1.0, d))
                if ang * fps > vmax:
                    vmax, vosso = ang * fps, o
        altura_y = [P['Quadril'][1] for P in P_all]
        print('%-7s %5.2f s · %d fps · pés: ponto mais baixo %+0.1f mm · escorregão máx %0.2f mm/quadro (%d medidas) · joelho %0.0f°..%0.0f° · cotovelo %0.0f°..%0.0f° · '
              'pelve y %0.3f..%0.3f · pico angular %0.0f rad/s (%s)' % (nome, dur, fps, minimo * 1000, slip_max * 1000, apoio_frames, math.degrees(joe[0]), math.degrees(joe[1]),
                                                                        math.degrees(cot[0]), math.degrees(cot[1]), min(altura_y), max(altura_y), vmax, vosso))
        if minimo < -0.008:
            erros.append('%s: pé atravessa o chão (%.1f mm: %s)' % (nome, minimo * 1000, onde_min))
        if slip_max > 0.002:
            erros.append('%s: pé apoiado escorrega %.2f mm por quadro (%s)' % (nome, slip_max * 1000, onde_slip))
        if math.degrees(joe[0]) < -3:
            erros.append('%s: joelho hiperestendido (%.0f°)' % (nome, math.degrees(joe[0])))
        if math.degrees(joe[1]) > 150:
            erros.append('%s: joelho dobra demais (%.0f°)' % (nome, math.degrees(joe[1])))
        if math.degrees(cot[0]) < -8 or math.degrees(cot[1]) > 155:
            erros.append('%s: cotovelo fora do limite' % nome)
        if vmax > 60:
            avisos.append('%s: pico de velocidade angular alto (%s %.0f rad/s)' % (nome, vosso, vmax))
    for a in avisos:
        print('  aviso:', a)
    for e in erros:
        print('  ERRO:', e)
    if not erros:
        print('  ok')
    return not erros


if __name__ == '__main__':
    arqs = sys.argv[1:] or [os.path.join(AQUI, '..', 'corredor.glb'), os.path.join(AQUI, '..', 'corredor-colorido.glb')]
    ok = all([validar(a) for a in arqs])
    sys.exit(0 if ok else 1)
