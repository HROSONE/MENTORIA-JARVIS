s=open('botoes_head.html').read()+open('stick_core.js').read()+open('botoes_tail.html').read()
s=s.replace('<!--SKIN-->','<script>window.SKIN='+open('skin.json').read()+';</script>')
open('botoes.html','w').write(s)
