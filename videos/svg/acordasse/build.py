"""Monta acordasse.html: biblioteca do gemeos + personagens e render do xadrez + gato do Short da CIA + cenas + narração (+ áudio)."""
import base64, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
g = open('../gemeos.html').read()
lib = g[g.index('/* ---------------- utilidades'):g.index('/* ---------------- cenas')]
s = open('acordasse_src.html').read().replace('/*LIB*/', lib).replace('/*SHARED*/', open('_shared.js').read()).replace('/*GATO*/', open('_gato.js').read()).replace('/*RENDER*/', open('_render.js').read())
s = s.replace('<!--NARR-->', '<script>window.NARR=' + open('narr.json').read() + ';</script>')
if os.path.exists('acordasse_sfx.mp3'):
    s = s.replace('<!--AUDIO-->', '<script>window.AUDIO_SRC="data:audio/mpeg;base64,' + base64.b64encode(open('acordasse_sfx.mp3', 'rb').read()).decode() + '";</script>')
open('acordasse.html', 'w').write(s)
print('acordasse.html', len(s) // 1024, 'KB')
