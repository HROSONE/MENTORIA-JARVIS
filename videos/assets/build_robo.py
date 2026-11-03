import base64, os
b=lambda p: base64.b64encode(open(p,'rb').read()).decode()
s=open('robo_head.html').read()+open('../stick/stick_core2.js').read()+open('robo_tail.html').read()
s=s.replace('<!--SKIN-->','<script>window.SKIN='+open('../stick/skin2.json').read()+';</script>')
s=s.replace('<!--GLB-->','<script>window.ROBOT_B64="'+b('RobotExpressive.glb')+'";window.GLB_B64="'+b('../teen/teen.glb')+'";window.TEEN_META='+open('../teen/teen.json').read()+';</script>')
if os.path.exists('robo_sfx.mp3'):
    s=s.replace('<!--AUDIO-->','<script>window.AUDIO_SRC="data:audio/mpeg;base64,'+b('robo_sfx.mp3')+'";</script>')
open('robo.html','w').write(s)
