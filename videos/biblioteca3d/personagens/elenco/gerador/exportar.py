"""Monta o GLB de um personagem: esqueleto (nós), malha com pele, materiais (cor, textura) e animações."""
import os
import sys
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.normpath(os.path.join(AQUI, '..', '..', '..', 'cidade', 'gerador')))
from glb import Material, Prim, Node, Skin, Animacao, write_glb        # noqa: E402
from mat3 import ID                                                    # noqa: E402


def material(chave, d):
    """d: (cor, rugosidade, metal) ou dict(cor, rug, metal, emissivo, textura, repete, dupla)"""
    if isinstance(d, tuple):
        d = dict(cor=d[0], rug=d[1], metal=d[2] if len(d) > 2 else 0.0)
    m = Material(d.get('nome', 'M_' + chave), d['cor'], rough=d.get('rug', 0.8), metal=d.get('metal', 0.0), emissive=d.get('emissivo'),
                    texture=d.get('textura'), double_sided=d.get('dupla', False), repeat=d.get('repete', False))
    if d.get('opacidade') is not None:                                   # vidro (viseira do astronauta): mistura com o fundo
        m.opacidade = d['opacidade']
        m.alpha = 'BLEND'
    return m


def animacoes_nos(nos, esq, clipes):
    anims = []
    for c in clipes:
        n = len(c['frames'])
        tempos = np.arange(n) / c['fps']
        canais = []
        for osso in esq.ossos:
            if osso == 'Raiz':
                continue
            q = np.array([f[0].get(osso, ID) for f in c['frames']], dtype=float)
            for k in range(1, n):
                if np.dot(q[k], q[k - 1]) < 0:
                    q[k] = -q[k]
            if np.allclose(q, ID, atol=1e-7):
                continue
            canais.append((nos[osso], 'rotation', tempos, q))
        canais.append((nos['Quadril'], 'translation', tempos, np.array([f[1] for f in c['frames']], dtype=float)))
        anims.append(Animacao(c['nome'], canais))
    return anims


def gravar(caminho, esq, S, paleta, clipes=None, extras=None, nome_gerador='Hryz Animation - elenco'):
    mats = {k: material(k, v) for k, v in paleta.items()}
    uniq = {}
    for k, m in mats.items():                      # materiais idênticos viram um só
        sig = (m.name, tuple(m.color), m.rough, m.metal, id(m.texture))
        uniq.setdefault(sig, m)
        mats[k] = uniq[sig]
    nos = {n: Node(n, translation=tuple(float(x) for x in esq.loc[n])) for n in esq.ossos}
    for n in esq.ossos:
        if esq.pai[n] is not None:
            nos[esq.pai[n]].children.append(nos[n])
    ibms = []
    for n in esq.ossos:
        m = np.eye(4)
        m[:3, 3] = -esq.rep[n]
        ibms.append(m)
    skin = Skin([nos[n] for n in esq.ossos], ibms, nome='Esqueleto', raiz=nos['Raiz'])
    prims = [Prim(mats[ch], P, N, idx.reshape(-1), uvs=UV, joints=J, weights=W, colors=COR) for ch, P, N, idx, J, W, UV, COR in S.prims(mats)]
    corpo = Node('Corpo', prims=prims, skin=skin)
    ex = dict(extras or {})
    ex['triangulos'] = S.contagem_tris()
    if clipes:
        ex['clipes'] = {c['nome']: c['info'] for c in clipes}
    nos['Raiz'].extras = ex
    anims = animacoes_nos(nos, esq, clipes) if clipes else None
    return write_glb(caminho, [nos['Raiz'], corpo], generator=nome_gerador, animations=anims)
