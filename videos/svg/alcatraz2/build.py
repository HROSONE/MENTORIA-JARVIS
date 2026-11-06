import base64, os, re
g = open('../svg/gemeos.html').read()
lib = g[g.index('/* ---------------- utilidades'):g.index('/* ---------------- cenas')]
head = open('_head.html').read()
render = open('_render.js').read()
a = render.index('function frame(t) {'); b = render.index('\n}\n', a) + 3
render = render[:a] + render[b:]
body = '/*LIB*/' + head.split('/*LIB*/', 1)[1]
html = head.split('/*LIB*/', 1)[0] + lib + body.replace('/*LIB*/', '').replace('/*SHARED*/', open('_shared.js').read()) + open('_helpers.js').read() + open('_scenes.js').read() + render + '\n</script>\n</body>\n</html>\n'
html = html.replace('<!--NARR-->', '<script>window.NARR=' + open('narr.json').read() + ';window.MAOS=' + open('maos.json').read() + ';window.OBJ=' + open('obj.json').read() + ';</script>')
if os.path.exists('alca3_sfx.mp3'):
    html = html.replace('<!--AUDIO-->', '<script>window.AUDIO_SRC="data:audio/mpeg;base64,' + base64.b64encode(open('alca3_sfx.mp3', 'rb').read()).decode() + '";</script>')
open('alca3.html', 'w').write(html)
