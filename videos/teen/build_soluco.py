import base64, os
s=open('soluco_head.html').read()+open('../stick/stick_core2.js').read()+open('soluco_tail.html').read()
s=s.replace('<!--SKIN-->','<script>window.SKIN='+open('../stick/skin2.json').read()+';</script>')
s=s.replace('<!--GLB-->','<script>window.GLB_B64="'+base64.b64encode(open('teen.glb','rb').read()).decode()+'";window.TEEN_META='+open('teen.json').read()+';</script>')
if os.path.exists('soluco_sfx.mp3'):
    s=s.replace('<!--AUDIO-->','<script>window.AUDIO_SRC="data:audio/mpeg;base64,'+base64.b64encode(open('soluco_sfx.mp3','rb').read()).decode()+'";</script>')
open('soluco.html','w').write(s)
