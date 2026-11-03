s=open('altura_head.html').read()+open('stick_core.js').read()+open('altura_tail.html').read()
s=s.replace('<!--SKIN-->','<script>window.SKIN='+open('skin.json').read()+';</script>')
open('altura.html','w').write(s)
