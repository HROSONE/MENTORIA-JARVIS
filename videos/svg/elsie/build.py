import base64, os, glob
g = open('../svg/gemeos.html').read()
lib = g[g.index('/* ---------------- utilidades'):g.index('/* ---------------- cenas')]
head = open('_head.html').read()
render = open('_render.js').read(); a = render.index('function frame(t) {'); b = render.index('\n}\n', a) + 3; render = render[:a] + render[b:]
body = head.split('/*LIB*/', 1)[1].replace('/*SHARED*/', open('_shared.js').read())
html = head.split('/*LIB*/', 1)[0] + lib + body + open('_helpers.js').read() + open('_man.js').read() + open('_objs.js').read() + open('_scenes.js').read() + render + '\n</script>\n</body>\n</html>\n'
fotos = []
for f in sorted(glob.glob('fotos/*.jpg') + glob.glob('fotos/*.jpeg') + glob.glob('fotos/*.png')):
    mt = 'image/png' if f.endswith('.png') else 'image/jpeg'
    fotos.append(f'"data:{mt};base64,' + base64.b64encode(open(f, 'rb').read()).decode() + '"')
html = html.replace('<!--NARR-->', '<script>window.NARR=' + open('narr.json').read() + ';window.MAOS=' + open('maos.json').read() + ';window.OBJ=' + open('obj.json').read() + ';window.FOTOS=[' + ','.join(fotos) + '];</script>')
if os.path.exists('elsie_sfx.mp3'):
    html = html.replace('<!--AUDIO-->', '<script>window.AUDIO_SRC="data:audio/mpeg;base64,' + base64.b64encode(open('elsie_sfx.mp3', 'rb').read()).decode() + '";</script>')
open('elsie.html', 'w').write(html)
print('fotos', len(fotos))
