"""Monta chiclete.html: biblioteca do gemeos + personagens e render do xadrez + cenas + narração (+ áudio)."""
import base64, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
g = open('../gemeos.html').read()
lib = g[g.index('/* ---------------- utilidades'):g.index('/* ---------------- cenas')]
s = open('chiclete_src.html').read().replace('/*LIB*/', lib).replace('/*SHARED*/', open('_shared.js').read()).replace('/*CENAS*/', open('_cenas.js').read()).replace('/*RENDER*/', open('_render.js').read())
s = s.replace('<!--NARR-->', '<script>window.NARR=' + open('narr.json').read() + ';</script>')
if os.path.exists('chiclete_sfx.mp3'):
    s = s.replace('<!--AUDIO-->', '<script>window.AUDIO_SRC="data:audio/mpeg;base64,' + base64.b64encode(open('chiclete_sfx.mp3', 'rb').read()).decode() + '";</script>')
open('chiclete.html', 'w').write(s)
print('chiclete.html', len(s) // 1024, 'KB')
