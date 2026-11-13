"""Monta cafe.html: biblioteca do gemeos + arte + cenas + render + narração (+ áudio)."""
import base64, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
g = open('../gemeos.html').read()
lib = g[g.index('/* ---------------- utilidades'):g.index('/* ---------------- cenas')]
s = open('cafe_src.html').read().replace('/*LIB*/', lib).replace('/*ARTE*/', open('_arte.js').read()).replace('/*CENAS*/', open('_cenas.js').read()).replace('/*RENDER*/', open('_render.js').read())
s = s.replace('<!--NARR-->', '<script>window.NARR=' + open('narr.json').read() + ';</script>')
if os.path.exists('cafe_sfx.mp3'):
    s = s.replace('<!--AUDIO-->', '<script>window.AUDIO_SRC="data:audio/mpeg;base64,' + base64.b64encode(open('cafe_sfx.mp3', 'rb').read()).decode() + '";</script>')
open('cafe.html', 'w').write(s)
print('cafe.html', len(s) // 1024, 'KB')
