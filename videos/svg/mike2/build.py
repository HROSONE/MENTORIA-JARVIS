import json, base64, os
g = open('../gemeos.html').read()
lib = g[g.index('/* ---------------- utilidades'):g.index('/* ---------------- cenas')]
s = open('mike2_src.html').read().replace('/*LIB*/', lib).replace('<!--GAL-->', '<script>window.GAL=' + open('galinhas.json').read() + ';</script>')
if os.path.exists('mike2_sfx.mp3'):
    s = s.replace('<!--AUDIO-->', '<script>window.AUDIO_SRC="data:audio/mpeg;base64,' + base64.b64encode(open('mike2_sfx.mp3', 'rb').read()).decode() + '";</script>')
open('mike2.html', 'w').write(s)
