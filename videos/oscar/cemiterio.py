import math, random
from cats import FUZZ
W, H = 1080, 1920
r = random.Random(12)
DEFS = f'''<defs><filter id="b20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>
<filter id="b8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="b50" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="50"/></filter>
<radialGradient id="vg" cx="50%" cy="50%" r="80%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".45"/></radialGradient>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070d28"/><stop offset=".45" stop-color="#14245a"/><stop offset=".75" stop-color="#27508a"/><stop offset="1" stop-color="#4d86a0"/></linearGradient>
<linearGradient id="hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c5a3a"/><stop offset=".35" stop-color="#1d4429"/><stop offset="1" stop-color="#0f2a19"/></linearGradient>
<linearGradient id="pit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1c12"/><stop offset="1" stop-color="#050403"/></linearGradient>
<linearGradient id="wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a4a2a"/><stop offset=".5" stop-color="#9a6238"/><stop offset="1" stop-color="#6a3e22"/></linearGradient>
{FUZZ}</defs>'''
b = '<rect width="1080" height="1920" fill="url(#sky)"/>'
for _ in range(110):
    b += f'<circle class="star" data-k="{_}" cx="{r.randint(5,1075)}" cy="{r.randint(30,900)}" r="{r.choice([1.2,1.8,2.4])}" fill="#fff" opacity="{r.choice([.35,.55,.85])}"/>'
b += '<ellipse cx="600" cy="360" rx="330" ry="38" fill="#1b2d63" opacity=".8" filter="url(#b20)"/><ellipse cx="330" cy="480" rx="300" ry="30" fill="#1b2d63" opacity=".7" filter="url(#b20)"/>'
b += '<circle cx="760" cy="330" r="200" fill="#bcd4ff" opacity=".25" filter="url(#b50)"/><circle cx="760" cy="330" r="92" fill="#eef3ff"/><circle cx="730" cy="305" r="16" fill="#cfd8ee"/><circle cx="790" cy="355" r="11" fill="#cfd8ee"/><circle cx="772" cy="290" r="8" fill="#cfd8ee"/>'
# distant hills + tree
b += '<path d="M0 960 Q220 880 480 940 T1080 900 L1080 1100 L0 1100Z" fill="#17365a"/>'
b += '<path d="M120 1010 L120 700 M120 790 Q60 740 20 690 M120 840 Q190 780 250 760 M120 740 Q160 690 210 650 M120 900 Q60 870 10 870" fill="none" stroke="#0a1426" stroke-width="16" stroke-linecap="round"/>'
b += '<ellipse cx="540" cy="1000" rx="700" ry="70" fill="#7fb0c8" opacity=".35" filter="url(#b50)"/>'
# ground
b += '<path d="M0 1000 Q260 960 540 1000 T1080 985 L1080 1920 L0 1920Z" fill="url(#hill)"/>'
# background tombstones
for k in range(9):
    xx = 60 + k * 125 + r.randint(-20, 20); yy = 1040 + r.randint(0, 40); s = .55 + r.random() * .15
    if 330 < xx < 760 and yy < 1130: continue
    b += f'<path d="M{xx-30*s} {yy} L{xx-30*s} {yy-95*s} Q{xx} {yy-140*s} {xx+30*s} {yy-95*s} L{xx+30*s} {yy}Z" fill="#6f7f95"/><path d="M{xx-30*s} {yy} L{xx-30*s} {yy-95*s} Q{xx-18*s} {yy-128*s} {xx-4*s} {yy-132*s}" fill="none" stroke="#b6c4d8" stroke-width="3" opacity=".7"/><rect x="{xx-30*s}" y="{yy-8}" width="{60*s}" height="8" fill="#0f2a19"/>'
# grass blades
pal = [("#0b2415", 1.8), ("#12331e", 2.2), ("#1b4a2a", 2.4), ("#2a6a38", 2.2), ("#3d8a48", 1.8), ("#6ab05a", 1.4)]
bk = {i: [] for i in range(len(pal))}
for _ in range(9000):
    y = r.uniform(990, 1920); x = r.uniform(-10, 1090)
    t = (y - 990) / 930
    L = 12 + 52 * t * r.uniform(.6, 1.2)
    th = -math.pi / 2 + r.uniform(-.42, .42)
    ex, ey = x + math.cos(th) * L, y + math.sin(th) * L
    mx, my = (x + ex) / 2 + r.uniform(-6, 6) * (.4 + t), (y + ey) / 2
    lightn = r.random() * .7 + .3 * (1 - t) + (.15 if r.random() < .08 else 0)
    ci = min(len(pal) - 1, int(lightn * len(pal)))
    bk[ci].append(f"M{x:.0f} {y:.0f}Q{mx:.0f} {my:.0f} {ex:.0f} {ey:.0f}")
for i, (c, w) in enumerate(pal):
    b += f'<path d="{"".join(bk[i])}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" opacity=".9"/>'
# moonlight sheen on grass
b += '<ellipse cx="640" cy="1150" rx="420" ry="120" fill="#9fd0e8" opacity=".12" filter="url(#b50)"/>'
# earth mound right
b += '<g id="mound"><path d="M770 1330 Q820 1180 930 1190 Q1020 1200 1080 1280 L1080 1345 L770 1345Z" fill="#4a3322"/>'
em = ''.join(f"M{r.randint(790,1070)} {r.randint(1205,1335)}l{r.randint(-14,14)} {r.randint(-12,6)}" for _ in range(170))
b += f'<path d="{em}" fill="none" stroke="#6b4c34" stroke-width="3" opacity=".8" stroke-linecap="round"/></g>'
# grave pit
b += '<polygon points="400,1090 680,1090 770,1262 310,1262" fill="url(#pit)"/>'
b += '<polygon points="400,1090 680,1090 690,1104 392,1104" fill="#4a3322"/>'
for k in range(30):
    yy = r.randint(1105, 1255); b += f'<line x1="{410+k*3}" y1="{yy}" x2="{420+k*3}" y2="{yy+6}" stroke="#3a281a" stroke-width="3" opacity=".6"/>'
b += '<g id="cof"><polygon points="430,1155 650,1155 700,1245 380,1245" fill="url(#wood)"/>'
b += '<polygon points="430,1155 650,1155 650,1167 430,1167" fill="#5a3418"/><polygon points="380,1245 700,1245 700,1262 380,1262" fill="#4a2a14"/>'
b += '<path d="M470 1170 L440 1238 M540 1166 L540 1240 M610 1170 L640 1238" stroke="#c9a24a" stroke-width="4" opacity=".7"/><path d="M432 1157 L648 1157" stroke="#d9b062" stroke-width="3" opacity=".7"/>'
for fx in (480, 520, 560, 600):
    b += f'<circle cx="{fx}" cy="{1200+ (fx%3)*4}" r="14" fill="{["#f4f0e6","#d94b5a","#f4f0e6","#e8d36a"][(fx//40)%4]}"/>'
b += '<circle cx="540" cy="1198" r="20" fill="#d94b5a"/><circle cx="540" cy="1198" r="9" fill="#f6c0c6"/>'
b += '<path id="cdirt" d="M395 1243 Q430 1170 520 1160 Q620 1158 685 1243 Z" fill="#4a3322" opacity="0"/></g>'
b += '<line id="rope1" x1="365" y1="1170" x2="425" y2="1160" stroke="#e8dcc0" stroke-width="6" stroke-linecap="round"/><line id="rope2" x1="715" y1="1170" x2="655" y2="1160" stroke="#e8dcc0" stroke-width="6" stroke-linecap="round"/>'
b += '<polygon points="310,1262 770,1262 790,1288 290,1288" fill="#5a3f2a"/>'
b += '<rect x="290" y="1160" width="80" height="14" rx="3" fill="#2a1a10"/><rect x="710" y="1160" width="80" height="14" rx="3" fill="#2a1a10"/>'
b += '<g id="dirtp">' + ''.join(f'<circle class="dp" cx="0" cy="0" r="{r.choice([5,6,7,8])}" fill="#5a3f2a" opacity="0"/>' for _ in range(40)) + '</g>'
# flowers on grass
for fx, fy, c in ((250, 1350, "#d94b5a"), (275, 1362, "#f4f0e6"), (226, 1366, "#e8d36a"), (840, 1338, "#f4f0e6"), (868, 1350, "#d94b5a")):
    b += f'<line x1="{fx}" y1="{fy}" x2="{fx}" y2="{fy+34}" stroke="#2a6a38" stroke-width="4"/><circle cx="{fx}" cy="{fy}" r="13" fill="{c}"/><circle cx="{fx}" cy="{fy}" r="5" fill="#f6e6a0"/>'
# people from behind
def back(x, y, s, coat, hair, skin="#c9a07e", w=1.0, bun=False, gray=False, child=False):
    g = f'<g transform="translate({x},{y}) scale({s})">'
    g += f'<ellipse cx="0" cy="8" rx="{80*w}" ry="14" fill="#000" opacity=".35"/>'
    g += f'<rect x="{-30*w}" y="-90" width="{22*w}" height="94" rx="9" fill="#0c0e14"/><rect x="{8*w}" y="-90" width="{22*w}" height="94" rx="9" fill="#0c0e14"/>'
    g += f'<path d="M{-56*w} -250 Q0 -278 {56*w} -250 L{70*w} -86 L{-70*w} -86Z" fill="{coat}"/>'
    g += f'<path d="M{-56*w} -250 Q{-70*w} -170 {-62*w} -100" fill="none" stroke="{coat}" stroke-width="22" stroke-linecap="round"/><path d="M{56*w} -250 Q{70*w} -170 {62*w} -100" fill="none" stroke="{coat}" stroke-width="22" stroke-linecap="round"/>'
    g += f'<path d="M{-56*w} -250 Q0 -278 {56*w} -250" fill="none" stroke="#9fc0e8" stroke-width="3" opacity=".55"/>'
    g += f'<line x1="0" y1="-262" x2="0" y2="-90" stroke="#000" stroke-width="3" opacity=".25"/>'
    g += f'<rect x="-10" y="-292" width="20" height="26" fill="{skin}"/>'
    g += f'<circle cx="0" cy="-320" r="36" fill="{hair}"/>'
    if bun: g += f'<circle cx="0" cy="-366" r="17" fill="{hair}"/>'
    g += f'<path d="M-32 -332 Q0 -372 32 -332" fill="none" stroke="#9fc0e8" stroke-width="3" opacity="{.35 if not gray else .6}"/>'
    return g + '</g>'
for k, args in enumerate((
    (200, 1790, 1.15, "#1d2740", "#2a1d16", dict(bun=True, w=1.0)),
    (400, 1690, 1.0, "#2a2438", "#d6d6dc", dict(gray=True, w=1.05)),
    (690, 1690, 1.0, "#1f3036", "#15110f", dict(w=1.1)),
    (880, 1790, 1.15, "#2d2a3e", "#4a3220", dict(w=1.0)),
    (548, 1585, .62, "#27344a", "#6a4a2a", dict(w=.85)))):
    x, y, sc, coat, hair, kw = args
    b += f'<g id="pp{k}">' + back(x, y, sc, coat, hair, **kw) + '</g>'
# gravedigger (side view, facing left)
b += '<g id="digger" transform="translate(815,1300) scale(.9)">'
b += '<ellipse cx="0" cy="6" rx="70" ry="12" fill="#000" opacity=".4"/>'
b += '<rect x="-28" y="-95" width="22" height="98" rx="9" fill="#14110e"/><rect x="2" y="-95" width="22" height="98" rx="9" fill="#14110e"/>'
b += '<path d="M-40 -230 Q0 -250 42 -228 L50 -88 L-46 -88Z" fill="#4a3a2a"/><path d="M-40 -230 Q0 -250 42 -228" fill="none" stroke="#9fc0e8" stroke-width="3" opacity=".5"/>'
b += '<circle cx="-4" cy="-282" r="30" fill="#c9a07e"/><path d="M-36 -290 Q-4 -330 28 -290 L-40 -284Z" fill="#2a1f16"/><rect x="-46" y="-292" width="30" height="8" rx="3" fill="#2a1f16"/>'
b += '<path id="arm1" d="M-5 -215 L-5 -120" fill="none" stroke="#3a2c20" stroke-width="20" stroke-linecap="round"/><path id="arm2" d="M15 -215 L-5 -120" fill="none" stroke="#4a3a2a" stroke-width="20" stroke-linecap="round"/>'
b += '<g id="shov" transform="translate(-5 -120)"><line x1="0" y1="-30" x2="0" y2="112" stroke="#8a6a3a" stroke-width="8" stroke-linecap="round"/><polygon points="-21,104 21,104 15,156 -15,156" fill="#9aa4ae"/><polygon points="-21,104 21,104 18,114 -18,114" fill="#c9d2da"/><ellipse id="blade" cx="0" cy="104" rx="19" ry="9" fill="#5a3f2a" opacity="0"/></g>'
b += '</g>'
b += '<rect width="1080" height="1920" fill="url(#vg)"/>'
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{DEFS}{b}</svg>'
open('cem_body.txt','w').write(b)
open('cem_defs.txt','w').write(DEFS.replace('<defs>','').replace('</defs>',''))
print(len(b))
