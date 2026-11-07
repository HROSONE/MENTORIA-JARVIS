import base64, json, sys
src = open('viewer_src.html').read()
b64 = base64.b64encode(open('teen.glb', 'rb').read()).decode()
meta = open('teen.json').read()
s = src.replace('<!--GLB-->', f'<script>window.GLB_B64="{b64}";window.TEEN_META={meta};</script>')
open(sys.argv[1] if len(sys.argv) > 1 else 'adolescente.html', 'w').write(s)
