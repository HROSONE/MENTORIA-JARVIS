import base64, os
g = open('gemeos.html').read()
lib = g[g.index('/* ---------------- utilidades'):g.index('/* ---------------- cenas')]
s = open('elef_src.html').read().replace('/*LIB*/', lib)
if os.path.exists('elef_sfx.mp3'):
    s = s.replace('<!--AUDIO-->', '<script>window.AUDIO_SRC="data:audio/mpeg;base64,' + base64.b64encode(open('elef_sfx.mp3', 'rb').read()).decode() + '";</script>')
open('elefantes.html', 'w').write(s)
