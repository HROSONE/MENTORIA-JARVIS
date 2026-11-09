import sys, json, re, textwrap, subprocess
from PIL import Image, ImageDraw, ImageFont
src, title, out = sys.argv[1], sys.argv[2], sys.argv[3]
js = open('/home/user/MENTORIA-JARVIS/videos/svg/terminal/shots.js').read()
shots = []
for m in re.finditer(r"\{ n: (\d+), t: '([^']*)', cam: '([^']*)', acao: '((?:[^'\\]|\\.)*)', fala: '((?:[^'\\]|\\.)*)', som: '([^']*)' \}", js):
    shots.append(dict(n=int(m[1]), t=m[2], cam=m[3], acao=m[4].replace("\\'", "'"), fala=m[5].replace("\\'", "'"), som=m[6]))
assert len(shots) == 18, len(shots)
F = lambda s, b=False: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
FW, FH, CAP, M, HEAD = 450, 800, 215, 24, 90
cols, rows = 3, 2
for pg in range(3):
    W = M + cols * (FW + M); H = HEAD + rows * (FH + CAP + M) + M
    im = Image.new('RGB', (W, H), '#f4f0e8'); d = ImageDraw.Draw(im)
    d.text((M, 26), f'{title} — página {pg+1}/3', font=F(34, True), fill='#1b2240')
    d.text((W - M, 34), 'Hryz Animation · O homem que morou 18 anos no aeroporto', font=F(20), fill='#777', anchor='ra')
    for i in range(6):
        s = shots[pg * 6 + i]; x = M + (i % cols) * (FW + M); y = HEAD + (i // cols) * (FH + CAP + M)
        fr = Image.open(f'{src}/s{s["n"]:02d}.png').convert('RGB').resize((FW, FH), Image.LANCZOS); im.paste(fr, (x, y))
        d.rectangle([x, y, x + FW - 1, y + FH - 1], outline='#1b2240', width=3)
        d.rectangle([x, y, x + 64, y + 50], fill='#1b2240'); d.text((x + 32, y + 25), str(s['n']), font=F(30, True), fill='#ffd54a', anchor='mm')
        yy = y + FH + 8
        d.text((x, yy), f'{s["t"]} s', font=F(22, True), fill='#c62828'); d.text((x + FW, yy + 2), 'câmera: ' + s['cam'], font=F(17), fill='#555', anchor='ra'); yy += 32
        for ln in textwrap.wrap(s["acao"], 42): d.text((x, yy), ln, font=F(18, True), fill='#222'); yy += 23
        yy += 4
        for ln in textwrap.wrap(s["fala"], 46): d.text((x, yy), ln, font=F(18), fill='#16327a'); yy += 23
        yy += 4
        for ln in textwrap.wrap('som: ' + s['som'], 52): d.text((x, yy), ln, font=F(16), fill='#777'); yy += 20
    im.save(f'{out}_{pg+1}.jpg', quality=88)
