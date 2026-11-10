"""Gera todos os modelos do kit (.glb) e o manifest.json.
Uso:  python3 gerar.py          (precisa de numpy e Pillow)
As peças ficam em ../ruas, ../faixas, ../placas e ../mobiliario."""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
OUT = os.path.dirname(HERE)

import numpy as np
from glb import Node, write_glb
import ruas
import faixas
import placas
import mobiliario
from malha import Malha
from paleta import GRAMA

NOMES_NOS = {'asfalto': 'Asfalto', 'meiofio': 'MeioFio', 'calcada': 'Calcada', 'faixas': 'Faixas'}
MANIFEST = {'pecas': []}


def salvar(categoria, nome, descricao, nos, extras=None, tile=None):
    """nos: lista de (nome_do_no, Malha). Escreve ../<categoria>/<nome>.glb e registra no manifest."""
    pasta = os.path.join(OUT, categoria)
    os.makedirs(pasta, exist_ok=True)
    filhos = [Node(n, m.prims()) for n, m in nos if m.n_tris]
    raiz = Node(nome, children=filhos, extras=extras or None)
    tamanho = write_glb(os.path.join(pasta, nome + '.glb'), [raiz])
    mn = np.min([m.bbox()[0] for _, m in nos if m.n_tris], axis=0)
    mx = np.max([m.bbox()[1] for _, m in nos if m.n_tris], axis=0)
    ent = {'nome': nome, 'categoria': categoria, 'arquivo': f'{categoria}/{nome}.glb', 'descricao': descricao,
           'tris': int(sum(m.n_tris for _, m in nos)), 'kb': round(tamanho / 1024, 1),
           'bbox': {'min': [round(float(x), 3) for x in mn], 'max': [round(float(x), 3) for x in mx]},
           'nos': [n for n, m in nos if m.n_tris]}
    if extras:
        ent.update({k: v for k, v in extras.items()})
    MANIFEST['pecas'].append(ent)
    print(f'  {categoria}/{nome}.glb  {ent["tris"]:5d} tris  {ent["kb"]:6.1f} KB')


def gerar_ruas():
    print('ruas')
    for nome, (fn, desc) in ruas.PECAS.items():
        mal, con = fn()
        salvar('ruas', nome, desc, [(NOMES_NOS[k], m) for k, m in mal.items()], {'conexoes': con, 'tile': ruas.TILE})


def gerar_faixas():
    print('faixas')
    for nome, (fn, desc) in faixas.PECAS.items():
        salvar('faixas', nome, desc, [('Tinta', fn())], {'tipo': 'decalque', 'aponta': '+Z'})


def gerar_placas():
    print('placas')
    for nome, (fn, desc) in placas.PECAS.items():
        nos = fn()
        salvar('placas', nome, desc, nos, {'tipo': 'placa', 'frente': '+Z', 'origem': 'pé do poste'})


def gerar_mobiliario():
    print('mobiliario')
    for nome, (fn, desc) in mobiliario.PECAS.items():
        nos = fn()
        extras = {'tipo': 'semaforo' if 'semaforo' in nome else 'hidrante', 'frente': '+Z', 'origem': 'pé do poste'}
        salvar('mobiliario', nome, desc, nos, extras)


def gerar_chao():
    print('chao')
    m = Malha()
    m.top(GRAMA, -ruas.LH, ruas.LH, -ruas.LH, ruas.LH, ruas.CH)
    salvar('ruas', 'chao-grama', 'Ladrilho de grama 12 x 12 m na altura da calçada (preenche os quarteirões)', [('Grama', m)], {'tile': ruas.TILE, 'tipo': 'chao'})


def escrever_lista():
    """PECAS.md: tabela de todas as peças (gerada, não edite à mão)"""
    nomes = {'ruas': 'Ruas e chão', 'faixas': 'Faixas pintadas (decalques)', 'placas': 'Placas', 'mobiliario': 'Semáforos e hidrantes'}
    linhas = ['# Peças do kit cidade', '', 'Arquivo gerado por `gerador/gerar.py`; não edite à mão. Medidas em metros (largura x altura x profundidade).', '']
    tot_tris, tot_kb = 0, 0.0
    for cat in ('ruas', 'faixas', 'placas', 'mobiliario'):
        linhas += [f'## {nomes[cat]}', '', '| Peça | O que é | Tamanho (m) | Triângulos | KB | Conexões |', '|---|---|---|---|---|---|']
        for p in MANIFEST['pecas']:
            if p['categoria'] != cat:
                continue
            mn, mx = p['bbox']['min'], p['bbox']['max']
            tam = f'{mx[0]-mn[0]:.2f} x {mx[1]-mn[1]:.2f} x {mx[2]-mn[2]:.2f}'
            con = ' '.join(c['lado'] for c in p.get('conexoes', [])) or '—'
            linhas.append(f'| `{p["arquivo"]}` | {p["descricao"]} | {tam} | {p["tris"]} | {p["kb"]} | {con} |')
            tot_tris += p['tris']; tot_kb += p['kb']
        linhas.append('')
    linhas.append(f'Total: {len(MANIFEST["pecas"])} peças, {tot_tris} triângulos, {tot_kb/1024:.1f} MB.')
    open(os.path.join(OUT, 'PECAS.md'), 'w', encoding='utf-8').write('\n'.join(linhas) + '\n')


def main():
    gerar_ruas()
    gerar_chao()
    gerar_faixas()
    gerar_placas()
    gerar_mobiliario()
    MANIFEST.update({
        'versao': 1, 'unidade': 'metro', 'eixo_cima': 'Y', 'tile': ruas.TILE, 'faixa': ruas.H, 'largura_calcada': ruas.S,
        'altura_calcada': ruas.CH, 'altura_tinta': ruas.YF,
        'convencoes': {
            'frente': '+Z (lentes do semáforo, bocal do hidrante, face das placas e frente dos carros do Kenney)',
            'reta': 'a rua reta corre ao longo de Z; gire 90° em Y para a direção X',
            'mao': 'direita: quem anda para +Z usa a faixa x = -1,75; quem anda para -Z usa x = +1,75',
            'altura': 'topo do asfalto em y = 0; topo da calçada em y = 0,15; props nascem no pé (y = 0): coloque-os em y = 0,15 sobre a calçada',
            'rotacao': 'girar 90° em Y leva a conexão S para E, depois N, depois W',
            'escala_veiculo_kenney': 1.7,
        },
    })
    with open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(MANIFEST, f, ensure_ascii=False, indent=1)
    print(f'manifest.json: {len(MANIFEST["pecas"])} peças')
    escrever_lista()


if __name__ == '__main__':
    main()
