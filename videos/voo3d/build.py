import json
s=open('voo3d_src.html').read()
s=s.replace('<!--OBJ-->','<script>window.OBJTXT='+json.dumps(open('Jetliner.obj').read())+';</script>')
open('voo3d.html','w').write(s)
