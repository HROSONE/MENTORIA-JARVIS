import base64, os
g = open('../gemeos.html').read()
lib = g[g.index('/* ---------------- utilidades'):g.index('/* ---------------- cenas')]
s = open('xadrez_src.html').read().replace('/*LIB*/', lib).replace('/*SHARED*/', open('_shared.js').read()).replace('/*RENDER*/', open('_render.js').read())
s = s.replace('<!--NARR-->', '<script>window.NARR=' + open('narr.json').read() + ';</script>')
if os.path.exists('xadrez_sfx.mp3'):
    s = s.replace('<!--AUDIO-->', '<script>window.AUDIO_SRC="data:audio/mpeg;base64,' + base64.b64encode(open('xadrez_sfx.mp3', 'rb').read()).decode() + '";</script>')
open('xadrez.html', 'w').write(s)
