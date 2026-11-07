z = open('zepto_src.html').read()
g = open('gemeos.html').read()
defs = z[z.index('<defs>'):z.index('</defs>') + 7]
lib = g[g.index('/* ---------------- utilidades'):g.index('/* ---------------- cenas')]
body = open('thumb_body.js').read()
html = '''<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#000}svg{display:block}</style></head><body>
<svg id="s" width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">''' + defs + '''<defs id="fdefs"></defs><g id="w"></g></svg>
<script>''' + lib + body + '''</script></body></html>'''
open('thumb.html', 'w').write(html)
