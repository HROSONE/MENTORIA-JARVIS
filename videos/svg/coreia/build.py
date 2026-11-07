import base64, os
g = open('../gemeos.html').read()
lib = g[g.index('/* ---------------- utilidades'):g.index('/* ---------------- cenas')]
s = open('coreia_src.html').read().replace('/*LIB*/', lib).replace('<!--NARR-->', '<script>window.NARR=' + open('narr.json').read() + ';</script>')
if os.path.exists('coreia_sfx.mp3'):
    s = s.replace('<!--AUDIO-->', '<script>window.AUDIO_SRC="data:audio/mpeg;base64,' + base64.b64encode(open('coreia_sfx.mp3', 'rb').read()).decode() + '";</script>')
open('coreia.html', 'w').write(s)
