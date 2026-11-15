"""Monta cena_<nome>.html (nome = cratera ou ponte): biblioteca + base + cena + render + narração (+ áudio).
Uso: python3 build.py cratera   |   python3 build.py ponte"""
import base64, os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
nome = sys.argv[1]
g = open('../gemeos.html').read()
lib = g[g.index('/* ---------------- utilidades'):g.index('/* ---------------- cenas')]
s = open('carro_src.html').read().replace('/*LIB*/', lib).replace('/*ARTE*/', open('_base.js').read()).replace('/*CENAS*/', open(f'_{nome}.js').read()).replace('/*RENDER*/', open('_render.js').read())
s = s.replace('<!--NARR-->', '<script>window.NARR=' + open(f'narr_{nome}.json').read() + ';</script>')
mp3 = f'cena_{nome}_sfx.mp3'
if os.path.exists(mp3):
    s = s.replace('<!--AUDIO-->', '<script>window.AUDIO_SRC="data:audio/mpeg;base64,' + base64.b64encode(open(mp3, 'rb').read()).decode() + '";</script>')
open(f'cena_{nome}.html', 'w').write(s)
print(f'cena_{nome}.html', len(s) // 1024, 'KB')
