import base64, os, re
g = open('gemeos.html').read()
a = g.index('/* ---------------- utilidades'); b = g.index('/* ---------------- cenas')
lib = g[a:b]
s = open('zepto_src.html').read().replace('/*LIB*/', lib)
if os.path.exists('zepto_sfx.mp3'):
    s = s.replace('<!--AUDIO-->', '<script>window.AUDIO_SRC="data:audio/mpeg;base64,' + base64.b64encode(open('zepto_sfx.mp3', 'rb').read()).decode() + '";</script>')
open('zepto.html', 'w').write(s)
