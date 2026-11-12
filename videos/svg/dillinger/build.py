"""Monta dillinger.html: biblioteca do gemeos + personagens e render do xadrez + cenas + narração (+ áudio, se existir)."""
import base64, os
AQUI = os.path.dirname(os.path.abspath(__file__))
os.chdir(AQUI)
g = open('../gemeos.html').read()
lib = g[g.index('/* ---------------- utilidades'):g.index('/* ---------------- cenas')]
s = open('dillinger_src.html').read().replace('/*LIB*/', lib).replace('/*SHARED*/', open('_shared.js').read()).replace('/*RENDER*/', open('_render.js').read())
s = s.replace('<!--NARR-->', '<script>window.NARR=' + open('narr.json').read() + ';</script>')
if os.path.exists('dillinger_sfx.mp3'):
    s = s.replace('<!--AUDIO-->', '<script>window.AUDIO_SRC="data:audio/mpeg;base64,' + base64.b64encode(open('dillinger_sfx.mp3', 'rb').read()).decode() + '";</script>')
open('dillinger.html', 'w').write(s)
print('dillinger.html', len(s) // 1024, 'KB')
