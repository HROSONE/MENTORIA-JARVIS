"""Gera os arquivos do Corredor: esqueleto + malha com pesos + animações -> corredor.glb (silhueta escura) e corredor-colorido.glb.
Uso:  python3 gerar.py            (a partir desta pasta; precisa de numpy; o escritor GLB é o do kit: ../../../cidade/gerador/glb.py)"""
import os
import sys
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
sys.path.insert(0, os.path.normpath(os.path.join(AQUI, '..', '..', '..', 'cidade', 'gerador')))
from glb import Material, Prim, Node, Skin, Animacao, write_glb          # noqa: E402
import base as B                                                          # noqa: E402
import modelo as M                                                        # noqa: E402
import animacoes as A                                                     # noqa: E402

SAIDA = os.path.normpath(os.path.join(AQUI, '..'))

# cores (sRGB) dos dois acabamentos
CORES_COLORIDO = {
    'pele': ('#c98f6b', 0.65, 0.0), 'jaqueta': ('#e0762c', 0.78, 0.0), 'jaqueta_faixa': ('#262e4a', 0.8, 0.0), 'jaqueta_barra': ('#bd5a1a', 0.8, 0.0),
    'calca': ('#2b3447', 0.88, 0.0), 'calca_faixa': ('#1b2231', 0.85, 0.0), 'tenis': ('#ece7dc', 0.7, 0.0), 'sola': ('#262e4a', 0.8, 0.0),
    'gorro': ('#262e4a', 0.95, 0.0), 'gorro_barra': ('#e0762c', 0.95, 0.0), 'cachecol': ('#d2362b', 0.95, 0.0), 'luva': ('#1b2231', 0.8, 0.0),
    'viseira': ('#0f1420', 0.18, 0.35), 'viseira_faixa': ('#1b2231', 0.8, 0.0),
    'detalhe': ('#e0762c', 0.78, 0.0), 'tenis_detalhe': ('#262e4a', 0.8, 0.0),
}
COR_SILUETA = '#151925'                                                     # azul-marinho quase preto (o mesmo dos bonecos silhueta do canal)


def materiais(variante):
    out = {}
    for chave, (cor, rug, met) in CORES_COLORIDO.items():
        if variante == 'escuro':
            out[chave] = Material('Silhueta' if chave != 'viseira' else 'SilhuetaBrilho', COR_SILUETA, rough=0.72 if chave != 'viseira' else 0.28, metal=0.0)
        else:
            out[chave] = Material('Corredor_' + chave, cor, rough=rug, metal=met)
    # materiais iguais viram um só (mesma instância) para o arquivo ficar enxuto
    uniq = {}
    for chave, m in out.items():
        uniq.setdefault(m.name, m)
        out[chave] = uniq[m.name]
    return out


def esqueleto_nos():
    nos = {}
    for nome in B.OSSOS:
        nos[nome] = Node(nome, translation=tuple(float(x) for x in B.LOCAL[nome]))
    for nome in B.OSSOS:
        pai = B.PAI[nome]
        if pai is not None:
            nos[pai].children.append(nos[nome])
    return nos


def animacoes_nos(nos, clipes):
    """converte os clipes amostrados em canais glTF (rotação de cada osso + translação do Quadril)"""
    anims = []
    for c in clipes:
        n = len(c['frames'])
        tempos = np.arange(n) / c['fps']
        canais = []
        for osso in B.OSSOS:
            if osso == 'Raiz':
                continue
            q = np.array([f[0].get(osso, B.ID) for f in c['frames']], dtype=float)
            for k in range(1, n):                        # continuidade de sinal: a interpolação linear pega sempre o caminho curto
                if np.dot(q[k], q[k - 1]) < 0:
                    q[k] = -q[k]
            if np.allclose(q, B.ID, atol=1e-7):
                continue
            canais.append((nos[osso], 'rotation', tempos, q))
        canais.append((nos['Quadril'], 'translation', tempos, np.array([f[1] for f in c['frames']], dtype=float)))
        anims.append(Animacao(c['nome'], canais))
    return anims


def construir_glb(variante, caminho, clipes=None, contorno=False):
    S = M.construir()
    mats = materiais(variante)
    nos = esqueleto_nos()
    juntas = [nos[n] for n in B.OSSOS]
    ibms = []
    for n in B.OSSOS:
        m = np.eye(4)
        m[:3, 3] = -B.REPOUSO[n]
        ibms.append(m)
    skin = Skin(juntas, ibms, nome='Esqueleto', raiz=nos['Raiz'])
    prims = []
    for chave, P, N, idx, J, W in S.prims(mats):
        prims.append(Prim(mats[chave], P, N, idx.reshape(-1), joints=J, weights=W))
    corpo = Node('Corpo', prims=prims, skin=skin)
    raizes = [nos['Raiz'], corpo]
    anims = animacoes_nos(nos, clipes) if clipes else None
    extras = {'altura_m': B.ALTURA, 'frente': '+Z', 'lado_esquerdo': '+X', 'variante': variante, 'triangulos': S.contagem_tris()}
    if clipes:
        extras['clipes'] = {c['nome']: c['info'] for c in clipes}
    nos['Raiz'].extras = extras
    total = write_glb(caminho, raizes, generator='Hryz Animation - personagem Corredor', animations=anims)
    return S, total


if __name__ == '__main__':
    clipes = A.todos_os_clipes()
    S, tam = construir_glb('colorido', os.path.join(SAIDA, 'corredor-colorido.glb'), clipes)
    print('colorido', S.contagem_tris(), 'triângulos,', round(tam / 1024), 'KB,', len(clipes), 'clipes')
    S, tam = construir_glb('escuro', os.path.join(SAIDA, 'corredor.glb'), clipes)
    print('escuro', S.contagem_tris(), 'triângulos,', round(tam / 1024), 'KB')
