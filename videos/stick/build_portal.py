import base64, os
s=open('portal_head.html').read()+open('stick_core2.js').read()+open('portal_tail.html').read()
s=s.replace('<!--SKIN-->','<script>window.SKIN='+open('skin2.json').read()+';</script>')
if os.path.exists('portal_sfx.mp3'):
    s=s.replace('<!--AUDIO-->','<script>window.AUDIO_SRC="data:audio/mpeg;base64,'+base64.b64encode(open('portal_sfx.mp3','rb').read()).decode()+'";</script>')
open('portal.html','w').write(s)
