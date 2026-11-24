#!/usr/bin/env python3
"""Baixa assets CC0 do Poly Haven (texturas PBR, modelos glTF e céus HDRI) para a biblioteca do canal.
Licença CC0: uso livre, sem crédito obrigatório (https://polyhaven.com/license). Os arquivos baixados ficam fora do git (imagens são ignoradas);
este script e LISTA.md registram o que foi usado, para baixar de novo em qualquer máquina.

uso:
  python3 baixar.py textura wood_floor_worn [--res 2k]       -> textura/<id>/<id>_{diff,nor_gl,rough,ao,disp}_<res>.jpg
  python3 baixar.py modelo old_bed_frame [--res 1k]          -> modelo/<id>/<id>_<res>.gltf (+ .bin e texturas)
  python3 baixar.py hdri kloppenheim_06 [--res 2k]           -> hdri/<id>_<res>.hdr
  python3 baixar.py lista                                    -> baixa tudo o que está em LISTA.md (linhas "tipo id res")
"""
import json, os, sys, urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
API = 'https://api.polyhaven.com/files/'
MAPAS = {'Diffuse': 'diff', 'nor_gl': 'nor_gl', 'Rough': 'rough', 'AO': 'ao', 'Displacement': 'disp', 'arm': 'arm'}

def baixar_arquivo(url, destino):
    if os.path.exists(destino) and os.path.getsize(destino) > 0: return
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    req = urllib.request.Request(url, headers={'User-Agent': 'biblioteca3d-downloader/1.0'})
    with urllib.request.urlopen(req, timeout=120) as r, open(destino + '.part', 'wb') as f: f.write(r.read())
    os.replace(destino + '.part', destino); print('  ', os.path.relpath(destino, AQUI))

def info(id_):
    req = urllib.request.Request(API + id_, headers={'User-Agent': 'biblioteca3d-downloader/1.0'})
    with urllib.request.urlopen(req, timeout=60) as r: return json.load(r)

def textura(id_, res='2k'):
    d = info(id_)
    for chave, nome in MAPAS.items():
        if chave in d and res in d[chave] and 'jpg' in d[chave][res]:
            baixar_arquivo(d[chave][res]['jpg']['url'], os.path.join(AQUI, 'textura', id_, f'{id_}_{nome}_{res}.jpg'))
    cores = sorted(k for k in d if k.startswith('col_'))                   # tecidos com variações de cor: col_1, col_2... (a primeira vira "diff")
    for i, k in enumerate(cores):
        if res in d[k] and 'jpg' in d[k][res]:
            baixar_arquivo(d[k][res]['jpg']['url'], os.path.join(AQUI, 'textura', id_, f'{id_}_{"diff" if i == 0 else k}_{res}.jpg'))

def modelo(id_, res='1k'):
    g = info(id_)['gltf'][res]['gltf']; base = os.path.join(AQUI, 'modelo', id_)
    baixar_arquivo(g['url'], os.path.join(base, os.path.basename(g['url'])))
    for rel, f in g.get('include', {}).items(): baixar_arquivo(f['url'], os.path.join(base, rel))

def hdri(id_, res='2k'):
    baixar_arquivo(info(id_)['hdri'][res]['hdr']['url'], os.path.join(AQUI, 'hdri', f'{id_}_{res}.hdr'))

FUNC = {'textura': textura, 'modelo': modelo, 'hdri': hdri}
if __name__ == '__main__':
    a = sys.argv[1:]; res = a[a.index('--res') + 1] if '--res' in a else None
    if a[0] == 'lista':
        for linha in open(os.path.join(AQUI, 'LISTA.md')):
            p = linha.strip().strip('`').split()
            if len(p) >= 2 and p[0] in FUNC: print(p[0], p[1]); FUNC[p[0]](p[1], *( [p[2]] if len(p) > 2 else []))
    else:
        print(a[0], a[1]); FUNC[a[0]](a[1], *([res] if res else []))
