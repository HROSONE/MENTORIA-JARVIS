"""Gera os GLB do elenco (malha + esqueleto + animações).  Uso:  python3 gerar.py [nome ...]   (sem argumentos: todos)"""
import os
import sys
import time
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import exportar as X                                                    # noqa: E402
import personagens as P                                                 # noqa: E402
import animacoes as A                                                   # noqa: E402
import personagens2 as P2                                               # noqa: E402
import personagens3 as P3                                               # noqa: E402

SAIDA = os.path.normpath(os.path.join(AQUI, '..'))
ELENCO = ['davi', 'teo', 'lia', 'nina', 'maniaco', 'velha']
ELENCO2 = ['jovem_a', 'jovem_b', 'jovem_c', 'homem', 'mae', 'pai', 'policial', 'velha_luto', 'terno2', 'terno3']
ELENCO3 = ['faxineira', 'entregador', 'bombeiro']

if __name__ == '__main__':
    nomes = sys.argv[1:] or ELENCO + ELENCO2 + ELENCO3
    for n in nomes:
        t = time.time()
        e, S, pal, ex = (getattr(P, n, None) or getattr(P2, n, None) or getattr(P3, n))()
        clipes = A.todos_os_clipes(e, ex.get('anim'))
        ex['pe'] = {'calcanhar': [float(v) for v in e.PE_CALC], 'bola': [float(v) for v in e.PE_BOLA], 'junta': [float(v) for v in e.PE_JUNTA]}
        ex['altura_m'] = round(e.altura, 3)
        tam = X.gravar(os.path.join(SAIDA, n + '.glb'), e, S, pal, clipes, ex)
        print('%-8s %6d triângulos %5d vértices %4d KB  %2d ossos  %d clipes  %.1fs' % (n, S.contagem_tris(), S.n, tam // 1024, e.nb, len(clipes), time.time() - t))
