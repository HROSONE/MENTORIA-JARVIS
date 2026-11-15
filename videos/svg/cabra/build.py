"""Monta <saida>.html: biblioteca do gemeos + módulos de arte + cenas + render + narração (+ áudio).
Uso: python3 build.py            -> cabra.html (cenas = _cenas.js)
     python3 build.py dev        -> dev.html  (cenas = _dev.js, só para testar a arte)"""
import base64, os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
dev = len(sys.argv) > 1 and sys.argv[1] == 'dev'
g = open('../gemeos.html').read()
lib = g[g.index('/* ---------------- utilidades'):g.index('/* ---------------- cenas')]
mods = [m for m in ['_base.js', '_cabra.js', '_cenario.js', '_casco.js', '_salto.js', '_alto.js', '_arganeira.js'] if os.path.exists(m)]
arte = '\n'.join(open(m).read() for m in mods)
cenas = open('_dev.js' if dev else '_cenas.js').read()
s = open('cabra_src.html').read().replace('/*LIB*/', lib).replace('/*ARTE*/', arte).replace('/*CENAS*/', cenas).replace('/*RENDER*/', open('_render.js').read())
s = s.replace('<!--NARR-->', '<script>window.NARR=' + open('narr.json').read() + ';</script>')
if not dev and os.path.exists('cabra_sfx.mp3'):
    s = s.replace('<!--AUDIO-->', '<script>window.AUDIO_SRC="data:audio/mpeg;base64,' + base64.b64encode(open('cabra_sfx.mp3', 'rb').read()).decode() + '";</script>')
out = 'dev.html' if dev else 'cabra.html'
open(out, 'w').write(s)
print(out, len(s) // 1024, 'KB')
