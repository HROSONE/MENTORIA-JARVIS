#!/usr/bin/env python3
"""Baixa capturas da CMU pelo código (ex.: 79_71 = "sad") e converte para JSON a 30 fps em cmu/, pronto para lucas_poder/js/mocap.js.
Procure o código em catalogo_cmu.tsv (2379 capturas com descrição), ex.: grep -i "sad\\|angry\\|faint" catalogo_cmu.tsv
uso: python3 baixar.py 79_71 91_14 13_27 ..."""
import os, subprocess, sys, urllib.request
AQUI = os.path.dirname(os.path.abspath(__file__)); CMU = os.path.join(AQUI, 'cmu')
fps = {l.split('\t')[0]: l.split('\t')[3].strip() for l in open(os.path.join(AQUI, 'catalogo_cmu.tsv')).read().splitlines()[1:]}
def baixar(rel, dest):
    if os.path.exists(dest): return
    urllib.request.urlretrieve('http://mocap.cs.cmu.edu/subjects/' + rel, dest)
for cod in sys.argv[1:]:
    s = cod.split('_')[0]; s2 = s.zfill(2)
    asf, amc, js = (os.path.join(CMU, f) for f in (f'{s2}.asf', f'{s2}_{cod.split("_")[1]}.amc', f'{s2}_{cod.split("_")[1]}.json'))
    baixar(f'{s2}/{s2}.asf', asf); baixar(f'{s2}/{os.path.basename(amc)}', amc)
    subprocess.run([sys.executable, os.path.join(AQUI, 'amc2json.py'), asf, amc, js, '--fps', fps.get(f'{s2}_{cod.split("_")[1]}', '120')], check=True)
