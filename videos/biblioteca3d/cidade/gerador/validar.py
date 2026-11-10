"""Confere os .glb do kit sem depender de nada além de numpy:
  - JSON/BIN coerentes, índices dentro do intervalo, nada de NaN
  - normais com comprimento 1 e sentido das faces (enrolamento) de acordo com as normais
  - ladrilhos de rua dentro de 12 x 12 m e com a altura certa
Uso:  python3 validar.py        (sai com código 1 se achar problema)"""
import json
import os
import struct
import sys

import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)


def ler_glb(caminho):
    d = open(caminho, 'rb').read()
    assert d[:4] == b'glTF', 'não é um GLB'
    n_json = struct.unpack('<I', d[12:16])[0]
    j = json.loads(d[20:20 + n_json])
    ini = 20 + n_json + 8
    return j, d[ini:ini + struct.unpack('<I', d[20 + n_json:24 + n_json])[0]]


def acessor(j, binario, i):
    a = j['accessors'][i]
    v = j['bufferViews'][a['bufferView']]
    tipos = {5126: np.float32, 5123: np.uint16, 5125: np.uint32}
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3}[a['type']]
    arr = np.frombuffer(binario, dtype=tipos[a['componentType']], count=a['count'] * n, offset=v['byteOffset'] + a.get('byteOffset', 0))
    return arr.reshape(-1, n) if n > 1 else arr


def checar(caminho, categoria, tile=12):
    erros = []
    j, b = ler_glb(caminho)
    mn, mx = np.full(3, np.inf), np.full(3, -np.inf)
    tris = 0
    for m in j['meshes']:
        for p in m['primitives']:
            pos = acessor(j, b, p['attributes']['POSITION'])
            nor = acessor(j, b, p['attributes']['NORMAL'])
            idx = acessor(j, b, p['indices']).astype(np.int64)
            if not (np.isfinite(pos).all() and np.isfinite(nor).all()):
                erros.append(f'{m["name"]}: NaN/inf')
            if idx.max() >= len(pos):
                erros.append(f'{m["name"]}: índice fora do intervalo')
            ln = np.linalg.norm(nor, axis=1)
            if np.abs(ln - 1).max() > 1e-3:
                erros.append(f'{m["name"]}: normais não unitárias ({np.abs(ln - 1).max():.4f})')
            t = idx.reshape(-1, 3)
            a, bb, c = pos[t[:, 0]], pos[t[:, 1]], pos[t[:, 2]]
            cr = np.cross(bb - a, c - a)
            area = np.linalg.norm(cr, axis=1)
            ok = area > 1e-9
            nm = nor[t].mean(axis=1)
            if (np.einsum('ij,ij->i', cr[ok], nm[ok]) <= 0).any():
                erros.append(f'{m["name"]}: {(np.einsum("ij,ij->i", cr[ok], nm[ok]) <= 0).sum()} triângulos com a face virada ao contrário')
            if (~ok).any():
                erros.append(f'{m["name"]}: {(~ok).sum()} triângulos degenerados')
            tris += len(t)
            mn, mx = np.minimum(mn, pos.min(axis=0)), np.maximum(mx, pos.max(axis=0))
    if categoria in ('ruas', 'calcadas', 'rotatorias'):
        meio = tile / 2 + 0.001
        if mx[0] > meio or mn[0] < -meio or mx[2] > meio or mn[2] < -meio:
            erros.append(f'passa de {tile:g} x {tile:g} m: x {mn[0]:.2f}..{mx[0]:.2f}  z {mn[2]:.2f}..{mx[2]:.2f}')
        if mx[1] > 0.1501 or mn[1] < -0.0001:
            erros.append(f'altura fora de 0..0,15: {mn[1]:.3f}..{mx[1]:.3f}')
    if categoria == 'faixas' and (mx[1] > 0.0121 or mn[1] < 0.0119):
        erros.append(f'tinta fora de y = 0,012: {mn[1]:.4f}..{mx[1]:.4f}')
    return erros, tris, mn, mx


def main():
    manifest = json.load(open(os.path.join(RAIZ, 'manifest.json'), encoding='utf-8'))
    ruim = 0
    for p in manifest['pecas']:
        erros, tris, mn, mx = checar(os.path.join(RAIZ, p['arquivo']), p['categoria'], p.get('tile', 12))
        estado = 'ok ' if not erros else 'ERRO'
        print(f'{estado} {p["arquivo"]:42s} {tris:5d} tris  {mx[0]-mn[0]:6.2f} x {mx[1]-mn[1]:5.2f} x {mx[2]-mn[2]:6.2f} m')
        for e in erros:
            print('     -', e)
        ruim += bool(erros)
    print(f'\n{len(manifest["pecas"]) - ruim}/{len(manifest["pecas"])} peças sem problema')
    sys.exit(1 if ruim else 0)


if __name__ == '__main__':
    main()
