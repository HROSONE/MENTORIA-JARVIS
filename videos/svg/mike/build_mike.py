import json, base64, os
s = open('mike.html').read().replace('<!--NARR-->', '<script>window.NARR=' + open('narr.json').read() + ';</script>').replace('<!--GAL-->', '<script>window.GAL=' + open('galinha_svg.json').read() + ';</script>')
if os.path.exists('mike_mix.mp3'):
    s = s.replace('<!--AUDIO-->', '<script>window.AUDIO_SRC="data:audio/mpeg;base64,' + base64.b64encode(open('mike_mix.mp3', 'rb').read()).decode() + '";</script>')
open('mike_build.html', 'w').write(s)
