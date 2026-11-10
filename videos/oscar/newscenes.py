import math, random
from cats import *
W, H = 1080, 1920
SANS = "DejaVu Sans, sans-serif"
DEFS = f'''<defs><filter id="b20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>
<filter id="b8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="b50" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="50"/></filter>
<radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".8"/></radialGradient>
<linearGradient id="warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd48a"/><stop offset="1" stop-color="#7a4a1c"/></linearGradient>{FUZZ}</defs>'''
ORANGE = dict(base='#c98238', dark='#6f3d12', mid='#a8652a', light='#ebae66', white='#f4e6cf', pink='#dfa0a2', shade='#7a4a20')
BLACKC = dict(base='#26272d', dark='#0b0b0e', mid='#1a1b20', light='#5a5d6b', white='#3a3c46', pink='#5a3a3e', shade='#101114')
WHITEC = dict(base='#e4e1da', dark='#9a968c', mid='#c3bfb4', light='#fbfaf6', white='#ffffff', pink='#e5aaa9', shade='#a39f94')
BROWN  = dict(base='#7a5a3e', dark='#2f2012', mid='#5e4229', light='#a98660', white='#e8dcc8', pink='#d79c9c', shade='#3d2a18')

def wrap(body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{DEFS}{body}<rect width="{W}" height="{H}" fill="url(#vig)"/></svg>'

def sil(x, y, s=1, col="#080a12", pose='stand'):
    g = f'<g transform="translate({x},{y}) scale({s})" fill="{col}" stroke="{col}" stroke-linecap="round" stroke-linejoin="round">'
    g += '<circle cx="0" cy="-250" r="34" stroke="none"/>'
    g += '<path d="M-48 -205 Q0 -225 48 -205 L58 -80 L-58 -80Z" stroke-width="6"/>'
    if pose == 'stand':
        g += '<rect x="-48" y="-90" width="40" height="190" rx="14" stroke="none"/><rect x="8" y="-90" width="40" height="190" rx="14" stroke="none"/>'
    return g + '</g>'

# ---------- A: despedida
b = '<defs><linearGradient id="ra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1426"/><stop offset="1" stop-color="#1a2038"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#ra)"/>'
b += '<rect x="330" y="200" width="420" height="440" fill="#0a1228" stroke="#2b3556" stroke-width="16"/><line x1="540" y1="200" x2="540" y2="640" stroke="#2b3556" stroke-width="10"/><circle cx="640" cy="360" r="70" fill="#f4efd8" opacity=".85"/>'
b += '<ellipse cx="935" cy="1050" rx="360" ry="360" fill="#ffb347" opacity=".35" filter="url(#b50)"/>'
y = 1150
b += f'<rect x="0" y="{y}" width="1080" height="770" fill="#14141c"/><rect x="60" y="{y-310}" width="64" height="330" rx="14" fill="#4a3426"/><rect x="100" y="{y-95}" width="880" height="90" rx="18" fill="#d8d4c8"/><rect x="130" y="{y-5}" width="24" height="70" fill="#4a3426"/><rect x="930" y="{y-5}" width="24" height="70" fill="#4a3426"/>'
b += f'<ellipse cx="230" cy="{y-112}" rx="105" ry="38" fill="#e9e6df"/><circle cx="232" cy="{y-150}" r="50" fill="#d8b9a0"/><path d="M182 {y-158} Q232 {y-215} 282 {y-158} Q250 {y-185} 182 {y-158}" fill="#d9dce2"/>'
b += f'<path d="M290 {y-20} C 310 {y-135} 480 {y-165} 640 {y-130} C 820 {y-105} 940 {y-70} 985 {y-20} Z" fill="#5a6f8f"/>'
b += f'<path d="M300 {y-112} Q380 {y-128} 440 {y-100}" fill="none" stroke="#d8b9a0" stroke-width="22" stroke-linecap="round"/>'
b += f'<rect x="880" y="1100" width="100" height="160" rx="8" fill="#2a2018"/><polygon points="870,1060 990,1060 962,990 898,990" fill="#ffd48a"/><rect x="926" y="1060" width="8" height="40" fill="#3a2d22"/>'
b += front_cat(800, 1030-225*.5, .5, NORMAL, seed=71)
# family silhouettes (in front of the bed)
b += '<rect x="330" y="1330" width="150" height="26" rx="10" fill="#1a1c28"/>'
b += '<g fill="#07080e" stroke="#07080e" stroke-linecap="round" stroke-linejoin="round"><circle cx="420" cy="1210" r="38" stroke="none"/><path d="M372 1260 Q420 1245 470 1262 L490 1420 L360 1420Z" stroke-width="6"/><path d="M380 1275 Q350 1190 440 1138" fill="none" stroke-width="30"/></g>'
b += '<g fill="#07080e" stroke="#07080e" stroke-linecap="round" stroke-linejoin="round"><circle cx="600" cy="1040" r="40" stroke="none"/><path d="M548 1095 Q600 1078 654 1098 L672 1500 L530 1500Z" stroke-width="6"/><path d="M566 1110 Q500 1190 480 1270" fill="none" stroke-width="28"/></g>'
b += '<g fill="#07080e" stroke="#07080e" stroke-linecap="round" stroke-linejoin="round"><circle cx="720" cy="1225" r="30" stroke="none"/><path d="M682 1262 Q720 1252 758 1264 L770 1500 L670 1500Z" stroke-width="6"/></g>'
b += '<path d="M455 1105 Q440 1120 436 1140" fill="none" stroke="#ffd48a" stroke-width="3" opacity=".5"/>'
A = wrap(b)

# ---------- C: cemitério
b = '<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3140"/><stop offset=".6" stop-color="#5a6272"/><stop offset="1" stop-color="#8a8f9a"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#sk)"/>'
b += '<ellipse cx="540" cy="900" rx="700" ry="260" fill="#aeb4c0" opacity=".35" filter="url(#b50)"/>'
b += '<path d="M0 1000 Q260 930 540 990 T1080 960 L1080 1920 L0 1920Z" fill="#202733"/><path d="M0 1120 Q300 1060 600 1110 T1080 1090 L1080 1920 L0 1920Z" fill="#161b25"/>'
b += '<path d="M780 1090 L780 640 M780 800 Q840 740 900 700 M780 740 Q720 690 660 660 M780 900 Q850 880 930 880 M780 860 Q710 820 650 820" fill="none" stroke="#0b0e14" stroke-width="18" stroke-linecap="round"/>'
random.seed(4)
for row, (yy, sc, n) in enumerate(((1180, .55, 9), (1340, .8, 7), (1520, 1.15, 5))):
    for k in range(n):
        xx = (k + .5) * 1080 / n + random.randint(-30, 30)
        if row == 2 and 330 < xx < 740: continue
        h = 110 * sc
        b += f'<path d="M{xx-34*sc} {yy} L{xx-34*sc} {yy-h+30*sc} Q{xx} {yy-h-22*sc} {xx+34*sc} {yy-h+30*sc} L{xx+34*sc} {yy}Z" fill="#0a0d13"/>'
b += '<g><rect x="460" y="1330" width="6" height="70" fill="#0b0e14"/><circle cx="463" cy="1325" r="14" fill="#d94b5a"/><circle cx="445" cy="1340" r="12" fill="#e8d36a"/><circle cx="482" cy="1340" r="12" fill="#f0f0f0"/></g>'
def umb(x, y, s, col):
    g = f'<g transform="translate({x},{y}) scale({s})"><path d="M-110 -320 Q0 -430 110 -320 Z" fill="{col}"/><line x1="0" y1="-320" x2="0" y2="-210" stroke="#05060a" stroke-width="5"/>'
    g += '<circle cx="0" cy="-185" r="26" fill="#05060a"/><path d="M-40 -158 Q0 -172 40 -158 L50 0 L-50 0Z" fill="#05060a"/></g>'
    return g
b += umb(430, 1640, 1.0, "#111620") + umb(570, 1665, 1.08, "#0b0f18") + umb(710, 1640, .95, "#141a26")
for k in range(180):
    rx, ry = random.randint(0, 1080), random.randint(0, 1900)
    b += f'<line x1="{rx}" y1="{ry}" x2="{rx-14}" y2="{ry+46}" stroke="#cfd6e6" stroke-width="2" opacity=".28"/>'
C = wrap(b)

# ---------- D: ceticismo
b = '<rect width="1080" height="1920" fill="#10161f"/><rect x="0" y="260" width="1080" height="1000" fill="#1c2634"/><rect x="0" y="1240" width="1080" height="680" fill="#161b24"/>'
b += '<rect x="90" y="330" width="900" height="620" rx="14" fill="#e9ecee" stroke="#3a4352" stroke-width="16"/>'
b += f'<text x="540" y="410" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="46" fill="#27303d">ACERTOS?</text>'
rr = random.Random(2)
for row in range(4):
    for grp in range(5 if row < 3 else 3):
        gx = 150 + grp * 170; gy = 470 + row * 105
        for k in range(4): b += f'<line x1="{gx+k*28}" y1="{gy}" x2="{gx+k*28}" y2="{gy+70}" stroke="#1f2a3a" stroke-width="7" stroke-linecap="round"/>'
        b += f'<line x1="{gx-12}" y1="{gy+55}" x2="{gx+96}" y2="{gy+12}" stroke="#c0392b" stroke-width="7" stroke-linecap="round"/>'
b += f'<text x="900" y="900" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="150" fill="#b79cff" opacity=".7">?</text>'
b += '<ellipse cx="540" cy="1190" rx="420" ry="120" fill="#ffd48a" opacity=".15" filter="url(#b50)"/>'
def doc(x, y, s, arms=True, point=False):
    g = f'<g transform="translate({x},{y}) scale({s})"><circle cx="0" cy="-250" r="38" fill="#d6b494"/><path d="M-42 -262 Q0 -300 42 -262 Q0 -280 -42 -262Z" fill="#3b2d22"/>'
    g += '<path d="M-60 -205 Q0 -230 60 -205 L72 -20 L-72 -20Z" fill="#f2f4f6"/><path d="M-72 -20 L-80 150 L80 150 L72 -20Z" fill="#f2f4f6"/><path d="M-60 -205 L0 -170 L60 -205" fill="none" stroke="#c8ced6" stroke-width="5"/>'
    if arms: g += '<path d="M-64 -170 Q-20 -90 40 -128 M64 -170 Q20 -90 -40 -128" fill="none" stroke="#e1e5e9" stroke-width="30" stroke-linecap="round"/>'
    if point: g += '<path d="M60 -180 Q130 -200 190 -280" fill="none" stroke="#e1e5e9" stroke-width="28" stroke-linecap="round"/><circle cx="196" cy="-290" r="14" fill="#d6b494"/>'
    return g + '</g>'
b += doc(330, 1480, 1.5, arms=True) + doc(760, 1470, 1.5, arms=False, point=True)
b += '<rect x="0" y="1560" width="1080" height="360" fill="#10141c"/><rect x="120" y="1500" width="840" height="40" rx="8" fill="#4a3a2e"/>'
D = wrap(b)

# ---------- E: os outros gatos
def curl_cat(x, y, s, pal, seed, flip=False):
    sx = -s if flip else s
    g = f'<g transform="translate({x},{y}) scale({sx},{s})">'
    i = uid()
    g += f'<radialGradient id="cg{i}" cx="50%" cy="28%" r="80%"><stop offset="0" stop-color="{pal["light"]}"/><stop offset=".5" stop-color="{pal["base"]}"/><stop offset="1" stop-color="{pal["shade"]}"/></radialGradient>'
    g += f'<g filter="url(#fuzz)"><ellipse cx="0" cy="-60" rx="150" ry="62" fill="url(#cg{i})"/></g>'
    g += fur_block(0, -60, 146, 58, pal, seed, 1.0, (9, 20), 'dir', vec=(-0.9, .45))
    g += f'<path d="M-140 -40 C -170 10 -90 20 -30 10 C 10 6 40 -4 60 -10" fill="none" stroke="{pal["shade"]}" stroke-width="34" stroke-linecap="round" filter="url(#fuzz2)"/><path d="M-140 -40 C -170 10 -90 20 -30 10 C 10 6 40 -4 60 -10" fill="none" stroke="{pal["base"]}" stroke-width="26" stroke-linecap="round" filter="url(#fuzz2)"/>'
    g += f'<g filter="url(#fuzz)"><ellipse cx="108" cy="-24" rx="54" ry="46" fill="url(#cg{i})"/></g>'
    g += fur_block(108, -24, 50, 42, pal, seed+4, 1.0, (7, 14), 'out', anchor=(100, -30))
    g += f'<polygon points="78,-58 84,-102 114,-66" fill="{pal["base"]}"/><polygon points="116,-66 140,-100 150,-52" fill="{pal["mid"]}"/><polygon points="86,-64 90,-90 106,-68" fill="{pal["pink"]}" opacity=".7"/>'
    g += f'<path d="M92 -28 Q104 -20 116 -28" fill="none" stroke="#0a0a0a" stroke-width="3.5" stroke-linecap="round"/><path d="M128 -28 Q138 -22 146 -30" fill="none" stroke="#0a0a0a" stroke-width="3.5" stroke-linecap="round"/>'
    g += f'<path d="M142 -12 Q148 -16 152 -10 Q150 -4 144 -5Z" fill="{pal["pink"]}"/>'
    return g + '</g>'
b = '<defs><linearGradient id="re" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1424"/><stop offset="1" stop-color="#2a2030"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#re)"/>'
b += '<rect x="0" y="1380" width="1080" height="540" fill="#1b1520"/><rect x="0" y="1370" width="1080" height="14" fill="#2c2236"/>'
b += '<ellipse cx="380" cy="900" rx="420" ry="360" fill="#ffb347" opacity=".22" filter="url(#b50)"/>'
b += '<rect x="60" y="560" width="440" height="30" rx="8" fill="#4a3426"/><rect x="580" y="720" width="440" height="30" rx="8" fill="#4a3426"/><rect x="100" y="880" width="380" height="26" rx="8" fill="#4a3426"/>'
b += '<rect x="560" y="1020" width="470" height="360" rx="40" fill="#4a3a58"/><rect x="560" y="990" width="470" height="70" rx="30" fill="#5a4870"/><rect x="40" y="1200" width="360" height="180" rx="30" fill="#6a4a3a"/>'
b += '<ellipse cx="620" cy="1400" rx="300" ry="30" fill="#000" opacity=".4"/>'
b += '<path d="M320 120 Q540 30 760 120 L760 300 L320 300Z" fill="none"/>'
b += curl_cat(260, 560, .8, ORANGE, 81) + curl_cat(800, 722, .8, BLACKC, 82, True) + curl_cat(290, 880, .72, WHITEC, 83)
b += curl_cat(790, 1022, .9, BROWN, 84, True) + curl_cat(200, 1205, .85, ORANGE, 85)
b += '<ellipse cx="560" cy="1640" rx="230" ry="36" fill="#000" opacity=".5"/>'
b += side_cat(480, 1640, 1.05, False, NORMAL, seed=91, pupil=9)
b += '<path d="M610 1415 L610 1470" stroke="#ffc931" stroke-width="0"/>'
E = wrap(b)

for n, s in (("A", A), ("C", C), ("D", D), ("E", E)):
    open(f"nova{n}.svg", "w").write(s)
print("ok")
