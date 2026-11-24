#!/usr/bin/env python3
"""Monta a pasta de quadros 720x1280 da v2: os planos reaproveitados vêm da v1 (já renderizada) e os novos de index2.html (links simbólicos).
uso: python3 montar_quadros2.py <edl2.json> <quadros_v1_720> <quadros_novos_720> <saida_720>"""
import json, os, sys
edl, v1, novos, saida = sys.argv[1:5]
d = json.load(open(edl)); os.makedirs(saida, exist_ok=True); falta = []
for i, j in enumerate(d['fonte']):
    src = os.path.join(novos, 'f%05d.jpg' % i) if j < 0 else os.path.join(v1, 'f%05d.jpg' % j)
    if not os.path.exists(src): falta.append(src); continue
    dst = os.path.join(saida, 'f%05d.jpg' % i)
    if os.path.lexists(dst): os.remove(dst)
    os.symlink(os.path.abspath(src), dst)
print('quadros ligados:', d['N'] - len(falta), '/', d['N'])
if falta: print('faltam', len(falta), 'quadros, ex.:', falta[:3]); sys.exit(1)
