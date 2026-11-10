import os, random, math
OUT = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1920
SANS = "DejaVu Sans, sans-serif"
SERIF = "DejaVu Serif, serif"

DEFS = '''<defs>
<filter id="b20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>
<filter id="b8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="b50" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="50"/></filter>
<radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".8"/></radialGradient>
<linearGradient id="warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd48a"/><stop offset="1" stop-color="#7a4a1c"/></linearGradient>
</defs>'''

def front_cat(x, y, s=1, body="#7b818c", chest="#e9e6df", eye="#ffc931", ear_in="#c58a8a", glow=False, dark=False):
    stripe = "rgba(255,255,255,.10)" if dark else "rgba(0,0,0,.22)"
    g = f'<g transform="translate({x},{y}) scale({s})">'
    g += f'<path d="M95 200 C 215 205 235 90 180 40" fill="none" stroke="{body}" stroke-width="30" stroke-linecap="round"/>'
    g += f'<ellipse cx="0" cy="95" rx="112" ry="135" fill="{body}"/>'
    g += f'<ellipse cx="0" cy="125" rx="52" ry="85" fill="{chest}"/>'
    g += f'<polygon points="-92,-100 -88,-224 -16,-140" fill="{body}"/><polygon points="92,-100 88,-224 16,-140" fill="{body}"/>'
    g += f'<polygon points="-76,-122 -76,-195 -36,-140" fill="{ear_in}"/><polygon points="76,-122 76,-195 36,-140" fill="{ear_in}"/>'
    g += f'<ellipse cx="0" cy="-62" rx="102" ry="90" fill="{body}"/>'
    for dx in (-22, 0, 22):
        g += f'<path d="M{dx} -150 L{dx*0.7} -120" stroke="{stripe}" stroke-width="7" stroke-linecap="round"/>'
    g += f'<ellipse cx="0" cy="-26" rx="46" ry="32" fill="{chest}"/>'
    if glow:
        for ex in (-40, 40):
            g += f'<ellipse cx="{ex}" cy="-72" rx="46" ry="52" fill="{eye}" opacity=".55" filter="url(#b20)"/>'
    for ex in (-40, 40):
        g += f'<ellipse cx="{ex}" cy="-72" rx="21" ry="25" fill="{eye}"/><ellipse cx="{ex}" cy="-72" rx="5.5" ry="21" fill="#0b0b0b"/><circle cx="{ex+7}" cy="-82" r="4" fill="#fff" opacity=".85"/>'
    g += '<polygon points="-9,-46 9,-46 0,-34" fill="#d98c8c"/>'
    g += '<path d="M0 -34 Q-12 -21 -25 -27 M0 -34 Q12 -21 25 -27" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/>'
    wc = "#cfd2d8" if not dark else "#555a66"
    for sgn in (-1, 1):
        for dy, ang in ((-30, -8), (-24, 0), (-18, 9)):
            g += f'<line x1="{sgn*30}" y1="{dy}" x2="{sgn*(100)}" y2="{dy+ang*2}" stroke="{wc}" stroke-width="2.5" opacity=".8"/>'
    g += f'<ellipse cx="-44" cy="212" rx="34" ry="19" fill="{chest}"/><ellipse cx="44" cy="212" rx="34" ry="19" fill="{chest}"/>'
    g += '</g>'
    return g

def side_cat(x, y, s=1, flip=False, body="#7b818c", chest="#e9e6df", eye="#ffc931"):
    sx = -s if flip else s
    g = f'<g transform="translate({x},{y}) scale({sx},{s})">'
    g += f'<path d="M-145 -125 C -235 -130 -245 -235 -190 -285" fill="none" stroke="{body}" stroke-width="24" stroke-linecap="round"/>'
    for lx in (-100, 85):
        g += f'<rect x="{lx}" y="-85" width="30" height="85" rx="14" fill="#5f656f"/>'
    g += f'<ellipse cx="0" cy="-112" rx="152" ry="64" fill="{body}"/>'
    for lx in (-130, 112):
        g += f'<rect x="{lx}" y="-85" width="32" height="85" rx="14" fill="{body}"/><ellipse cx="{lx+16}" cy="0" rx="22" ry="10" fill="{chest}"/>'
    g += f'<ellipse cx="110" cy="-100" rx="34" ry="42" fill="{chest}"/>'
    g += f'<polygon points="125,-192 128,-258 168,-202" fill="{body}"/><polygon points="168,-200 196,-256 208,-182" fill="{body}"/>'
    g += f'<ellipse cx="165" cy="-148" rx="58" ry="52" fill="{body}"/>'
    g += f'<ellipse cx="196" cy="-134" rx="26" ry="20" fill="{chest}"/>'
    g += f'<ellipse cx="180" cy="-158" rx="11" ry="13" fill="{eye}"/><ellipse cx="180" cy="-158" rx="3" ry="11" fill="#0b0b0b"/>'
    g += '<polygon points="214,-146 224,-146 219,-138" fill="#d98c8c"/>'
    g += '</g>'
    return g

def person(x, y, s=1, color="#101018", run=True, head="#101018"):
    g = f'<g transform="translate({x},{y}) scale({s})" stroke="{color}" fill="{color}" stroke-linecap="round" stroke-linejoin="round">'
    g += f'<circle cx="0" cy="-160" r="30" stroke="none" fill="{head}"/>'
    g += f'<rect x="-30" y="-125" width="60" height="95" rx="26" stroke="none"/>'
    if run:
        g += f'<polyline points="-8,-30 -50,25 -30,75" fill="none" stroke-width="20"/><polyline points="12,-30 50,5 90,25" fill="none" stroke-width="20"/>'
        g += f'<polyline points="-24,-105 -70,-70 -105,-85" fill="none" stroke-width="16"/><polyline points="24,-105 62,-80 90,-120" fill="none" stroke-width="16"/>'
    g += '</g>'
    return g

def progress(i):
    g = ''
    for k in range(8):
        x = 50 + k * 124
        fill = "#ffc931" if k <= i else "#ffffff"
        op = 1 if k <= i else .25
        g += f'<rect x="{x}" y="64" width="112" height="9" rx="4.5" fill="{fill}" opacity="{op}"/>'
    return g

def caption(lines, y0=1480, size=78, gold_last=True, step=100):
    g = ''
    for k, t in enumerate(lines):
        fill = "#ffc931" if (gold_last and k == len(lines) - 1) else "#ffffff"
        g += (f'<text x="540" y="{y0 + k*step}" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="{size}" '
              f'fill="{fill}" stroke="#000" stroke-width="16" paint-order="stroke" stroke-linejoin="round">{t}</text>')
    return g

def wrap(body, i, cap, **kw):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{DEFS}{body}'
            f'<rect width="{W}" height="{H}" fill="url(#vig)"/>{progress(i)}{cap}</svg>')

def bed(patient=True, y=1150):
    g = ''
    g += f'<rect x="0" y="{y}" width="{W}" height="{H-y}" fill="#14141c"/>'
    g += f'<rect x="60" y="{y-310}" width="64" height="330" rx="14" fill="#4a3426"/>'
    g += f'<rect x="100" y="{y-95}" width="880" height="90" rx="18" fill="#d8d4c8"/>'
    g += f'<rect x="130" y="{y-5}" width="24" height="70" fill="#4a3426"/><rect x="930" y="{y-5}" width="24" height="70" fill="#4a3426"/>'
    if patient:
        g += f'<ellipse cx="230" cy="{y-112}" rx="105" ry="38" fill="#e9e6df"/>'
        g += f'<circle cx="232" cy="{y-150}" r="50" fill="#d8b9a0"/><path d="M182 {y-158} Q232 {y-215} 282 {y-158} Q250 {y-185} 182 {y-158}" fill="#d9dce2"/>'
        g += f'<path d="M290 {y-20} C 310 {y-135} 480 {y-165} 640 {y-130} C 820 {y-105} 940 {y-70} 985 {y-20} Z" fill="#5a6f8f"/>'
        g += f'<path d="M290 {y-20} C 310 {y-135} 480 {y-165} 640 {y-130}" fill="none" stroke="#7a90b0" stroke-width="5"/>'
    else:
        g += f'<ellipse cx="230" cy="{y-112}" rx="105" ry="38" fill="#cfcbbf"/>'
        g += f'<path d="M260 {y-20} C 300 {y-95} 520 {y-100} 700 {y-85} C 840 {y-75} 940 {y-60} 985 {y-20} Z" fill="#4a5a75"/>'
    return g

def lamp(glow_op=.35, x=935, y=1000):
    g = f'<ellipse cx="{x}" cy="{y}" rx="340" ry="340" fill="#ffb347" opacity="{glow_op}" filter="url(#b50)"/>'
    g += f'<rect x="{x-60}" y="{y+110}" width="120" height="150" rx="8" fill="#2a2018"/>'
    g += f'<rect x="{x-8}" y="{y+40}" width="16" height="75" fill="#3a2d22"/>'
    g += f'<polygon points="{x-70},{y+45} {x+70},{y+45} {x+42},{y-30} {x-42},{y-30}" fill="#ffd48a"/>'
    return g

scenes = []

# 1 — hook
b = '<rect width="1080" height="1920" fill="#050507"/>'
b += '<polygon points="240,1350 840,1350 1080,1920 0,1920" fill="#ffb347" opacity=".18"/>'
b += '<rect x="230" y="260" width="620" height="1100" fill="#0a0a0d" stroke="#2a2118" stroke-width="22"/>'
b += '<rect x="250" y="280" width="580" height="1060" fill="url(#warm)" opacity=".42"/>'
b += '<polygon points="250,280 250,1340 120,1380 120,240" fill="#16110c" stroke="#2a2118" stroke-width="6"/>'
b += '<ellipse cx="540" cy="1000" rx="300" ry="520" fill="#ffb347" opacity=".18" filter="url(#b50)"/>'
b += front_cat(540, 820, 1.85, body="#0d0d12", chest="#17171d", ear_in="#1d1d24", glow=True, dark=True)
scenes.append(wrap(b, 0, caption(["ESTE GATO SABIA", "QUEM IA MORRER"])))

# 2 — Steere House at night
random.seed(7)
b = '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050818"/><stop offset="1" stop-color="#1b2450"/></linearGradient></defs>'
b += '<rect width="1080" height="1920" fill="url(#sky)"/>'
for _ in range(70):
    b += f'<circle cx="{random.randint(10,1070)}" cy="{random.randint(100,620)}" r="{random.choice([1.5,2,2.5,3])}" fill="#fff" opacity="{random.choice([.4,.6,.9])}"/>'
b += '<circle cx="840" cy="250" r="95" fill="#f1ecd4" opacity=".25" filter="url(#b20)"/><circle cx="840" cy="250" r="70" fill="#f4efd8"/><circle cx="815" cy="235" r="14" fill="#d9d3b8"/><circle cx="865" cy="275" r="10" fill="#d9d3b8"/>'
b += '<rect x="0" y="1380" width="1080" height="540" fill="#0b0f1d"/>'
b += '<polygon points="110,660 540,500 970,660" fill="#151b2e"/><rect x="140" y="660" width="800" height="740" fill="#1b2236"/>'
lit = {(2, 2), (2, 4), (1, 1), (0, 4), (0, 0)}
for row, wy in enumerate((1210, 1010, 810)):
    for col in range(6):
        wx = 180 + col * 120
        on = (row, col) in lit
        if row == 2 and col == 3:
            continue
        b += f'<rect x="{wx}" y="{wy}" width="80" height="110" rx="6" fill="{"#ffcf7a" if on else "#0e1424"}" opacity="{.85 if on else 1}"/>'
b += '<ellipse cx="540" cy="865" rx="170" ry="170" fill="#ffb347" opacity=".45" filter="url(#b50)"/>'
b += '<rect x="500" y="810" width="80" height="110" rx="6" fill="#ffd48a"/><path d="M500 920 Q540 870 580 920 Z" fill="#6b717b"/><ellipse cx="540" cy="900" rx="30" ry="22" fill="#6b717b"/><polygon points="515,882 521,862 531,880" fill="#6b717b"/><polygon points="549,880 559,862 565,882" fill="#6b717b"/>'
b += '<circle cx="540" cy="865" r="92" fill="none" stroke="#ffc931" stroke-width="6" stroke-dasharray="14 12"/>'
b += '<text x="540" y="745" text-anchor="middle" font-family="DejaVu Sans" font-size="38" font-weight="700" fill="#ffc931">3º ANDAR</text>'
b += '<rect x="360" y="1290" width="360" height="86" rx="10" fill="#0b0f1d" stroke="#ffc931" stroke-width="3"/>'
b += f'<text x="540" y="1335" text-anchor="middle" font-family="{SERIF}" font-size="38" font-weight="700" fill="#ffc931">STEERE HOUSE</text><text x="540" y="1364" text-anchor="middle" font-family="{SANS}" font-size="20" fill="#cfd5ee" letter-spacing="4">PROVIDENCE · RHODE ISLAND</text>'
b += '<rect x="480" y="1220" width="120" height="70" fill="#0e1424"/>'
for tx in (40, 1010):
    b += f'<rect x="{tx-12}" y="1180" width="24" height="220" fill="#06090f"/><circle cx="{tx}" cy="1130" r="110" fill="#06090f"/><circle cx="{tx+(50 if tx<500 else -50)}" cy="1200" r="80" fill="#06090f"/>'
scenes.append(wrap(b, 1, caption(["PROVIDENCE, 2005"], gold_last=True)))

# 3 — corridor patrol
b = '<rect width="1080" height="1920" fill="#06070c"/>'
b += '<polygon points="0,0 1080,0 620,700 460,700" fill="#121624"/>'
b += '<polygon points="0,0 460,700 460,880 0,1920" fill="#1a2030"/><polygon points="1080,0 620,700 620,880 1080,1920" fill="#171c2b"/>'
b += '<polygon points="0,1920 1080,1920 620,880 460,880" fill="#2a2634"/>'
b += '<rect x="460" y="700" width="160" height="180" fill="#dfe8ff"/><rect x="460" y="700" width="160" height="180" fill="#9fc0ff" opacity=".5" filter="url(#b8)"/>'
def door(x1, x2, left=True, open_=False):
    def top(x): return 700 * x / 460
    def bot(x): return 1920 - 1040 * x / 460
    def pts(xa, xb):
        h1 = bot(xa) - top(xa); h2 = bot(xb) - top(xb)
        P = [(xa, bot(xa) - .64 * h1), (xb, bot(xb) - .64 * h2), (xb, bot(xb)), (xa, bot(xa))]
        if not left: P = [(1080 - px, py) for px, py in P]
        return " ".join(f"{px:.0f},{py:.0f}" for px, py in P)
    col = "url(#warm)" if open_ else "#0d111c"
    return f'<polygon points="{pts(x1,x2)}" fill="{col}" stroke="#2c3550" stroke-width="5"/>'
for (x1, x2) in ((20, 140), (180, 262), (300, 362), (392, 424)):
    b += door(x1, x2, True, open_=(x1 == 180)) + door(x1, x2, False)
b += '<polygon points="180,1030 262,990 262,1470 180,1500" fill="#ffd48a" opacity=".0"/>'
b += '<ellipse cx="300" cy="1330" rx="170" ry="330" fill="#ffb347" opacity=".28" filter="url(#b50)"/>'
for (ly, lw) in ((100, 230), (330, 150), (500, 90), (620, 50)):
    b += f'<rect x="{540-lw/2}" y="{ly}" width="{lw}" height="{lw*0.14}" rx="4" fill="#e6ecff"/><ellipse cx="540" cy="{ly+lw*.07}" rx="{lw*.9}" ry="{lw*.35}" fill="#cfe0ff" opacity=".18" filter="url(#b20)"/>'
b += '<ellipse cx="560" cy="1405" rx="220" ry="28" fill="#000" opacity=".5"/>'
b += side_cat(590, 1395, 1.0, flip=False)
scenes.append(wrap(b, 2, caption(["ELE FAZIA A RONDA", "SOZINHO"], size=72)))

# 4 — the cat lies down + clock
b = '<defs><linearGradient id="rm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1426"/><stop offset="1" stop-color="#1a2038"/></linearGradient></defs>'
b += '<rect width="1080" height="1920" fill="url(#rm)"/>'
b += '<rect x="0" y="840" width="1080" height="40" fill="#0d1120"/>'
b += lamp(.40)
b += bed(True)
b += front_cat(640, 1040 - 225 * .66, .66, glow=True)
cx, cy = 540, 400
b += f'<circle cx="{cx}" cy="{cy}" r="165" fill="#e0342f" opacity=".35" filter="url(#b50)"/>'
b += f'<circle cx="{cx}" cy="{cy}" r="150" fill="#14080b" stroke="#e0342f" stroke-width="14"/>'
for k in range(12):
    a = math.radians(k * 30)
    r1, r2 = (118, 138)
    b += f'<line x1="{cx+r1*math.sin(a):.1f}" y1="{cy-r1*math.cos(a):.1f}" x2="{cx+r2*math.sin(a):.1f}" y2="{cy-r2*math.cos(a):.1f}" stroke="#ff6f66" stroke-width="{7 if k%3==0 else 4}" stroke-linecap="round"/>'
ah, am = math.radians(-60), math.radians(150)
b += f'<line x1="{cx}" y1="{cy}" x2="{cx+70*math.sin(ah):.1f}" y2="{cy-70*math.cos(ah):.1f}" stroke="#ffd6d2" stroke-width="12" stroke-linecap="round"/>'
b += f'<line x1="{cx}" y1="{cy}" x2="{cx+105*math.sin(am):.1f}" y2="{cy-105*math.cos(am):.1f}" stroke="#ffd6d2" stroke-width="8" stroke-linecap="round"/><circle cx="{cx}" cy="{cy}" r="10" fill="#e0342f"/>'
b += f'<path d="M{cx} {cy-135} A135 135 0 0 1 {cx+117} {cy+68}" fill="none" stroke="#ff4a40" stroke-width="10" stroke-linecap="round" opacity=".9"/>'
b += f'<text x="540" y="650" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="58" fill="#ff5a52" letter-spacing="3">≈ 2 HORAS</text>'
scenes.append(wrap(b, 3, caption(["ELE PARAVA.", "ENTRAVA.", "SE DEITAVA."], y0=1440, step=98)))

# 5 — family called
b = '<rect width="1080" height="1920" fill="#0b1018"/>'
b += '<rect x="0" y="180" width="1080" height="880" fill="#1b2a3a"/>'
b += '<rect x="640" y="260" width="300" height="360" rx="10" fill="#0c1424" stroke="#31465e" stroke-width="8"/><line x1="790" y1="260" x2="790" y2="620" stroke="#31465e" stroke-width="6"/><circle cx="720" cy="360" r="38" fill="#f1ecd4" opacity=".8"/>'
b += '<g transform="translate(400,980) scale(1.9)">'
b += '<rect x="-34" y="-125" width="68" height="125" rx="26" fill="#2f8f9c"/><circle cx="0" cy="-158" r="31" fill="#d8b08c"/><path d="M-32 -170 Q0 -214 32 -170 Q0 -180 -32 -170Z" fill="#fff"/><path d="M-30 -158 Q-36 -118 -12 -108" fill="#3a2a1e" stroke="#3a2a1e" stroke-width="10" stroke-linecap="round"/>'
b += '<polyline points="22,-98 52,-130 38,-150" fill="none" stroke="#2f8f9c" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/><rect x="26" y="-182" width="14" height="46" rx="7" fill="#111" transform="rotate(14 33 -160)"/></g>'
b += '<rect x="120" y="945" width="640" height="120" rx="10" fill="#3b2a20"/><rect x="120" y="945" width="640" height="16" fill="#5a4030"/>'
for k, r in enumerate((26, 42, 58)):
    b += f'<path d="M{510+k*0} {640} a{r} {r} 0 0 1 0 {-r*0.0}" fill="none"/>'
for r in (46, 74, 102):
    b += f'<path d="M520 540 A{r} {r} 0 0 1 520 {540+r*0.0}" fill="none"/>'
b += '<g fill="none" stroke="#ffc931" stroke-width="7" stroke-linecap="round"><path d="M505 500 q-26 -22 0 -44"/><path d="M485 515 q-44 -37 0 -74"/><path d="M465 530 q-62 -52 0 -104"/></g>'
b += '<rect x="560" y="370" width="420" height="150" rx="34" fill="#f4f1e8"/><polygon points="610,520 590,600 660,520" fill="#f4f1e8"/>'
b += f'<text x="770" y="462" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="52" fill="#1b2230">Venha agora.</text>'
b += '<rect x="0" y="1060" width="1080" height="400" fill="#241d2b"/>'
b += '<rect x="0" y="1060" width="1080" height="16" fill="#3a3045"/>'
b += '<rect x="840" y="1000" width="200" height="440" fill="url(#warm)" opacity=".9" rx="8"/><ellipse cx="930" cy="1250" rx="320" ry="260" fill="#ffb347" opacity=".35" filter="url(#b50)"/>'
for (px, sc) in ((140, 1.0), (360, 1.0), (560, .68)):
    for k in range(3):
        b += f'<line x1="{px-130-k*45}" y1="{1260+k*34-30}" x2="{px-60-k*45}" y2="{1260+k*34-30}" stroke="#7d6a96" stroke-width="6" stroke-linecap="round" opacity=".5"/>'
    b += person(px + 60, 1440, sc, color="#07070c")
scenes.append(wrap(b, 4, caption(["A FAMÍLIA ERA", "AVISADA A TEMPO"], y0=1560, step=100)))

# 6 — media
b = '<defs><linearGradient id="nv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1330"/><stop offset="1" stop-color="#050816"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#nv)"/>'
b += '<ellipse cx="540" cy="760" rx="520" ry="480" fill="#2b4a9a" opacity=".25" filter="url(#b50)"/>'
b += '<g transform="translate(360,560) rotate(-6)"><rect x="-250" y="-310" width="500" height="620" rx="10" fill="#000" opacity=".5" transform="translate(14,18)"/><rect x="-250" y="-310" width="500" height="620" rx="8" fill="#eceadf"/>'
b += f'<text x="0" y="-250" text-anchor="middle" font-family="{SERIF}" font-weight="700" font-size="31" fill="#1a1a1a">The New England</text><text x="0" y="-212" text-anchor="middle" font-family="{SERIF}" font-weight="700" font-size="31" fill="#1a1a1a">Journal of Medicine</text>'
b += '<rect x="-210" y="-190" width="420" height="5" fill="#8b1a1a"/>'
b += f'<text x="0" y="-130" text-anchor="middle" font-family="{SERIF}" font-weight="700" font-size="40" fill="#111">A Day in the Life</text><text x="0" y="-80" text-anchor="middle" font-family="{SERIF}" font-weight="700" font-size="40" fill="#111">of Oscar the Cat</text>'
b += f'<text x="0" y="-30" text-anchor="middle" font-family="{SERIF}" font-style="italic" font-size="26" fill="#555">David Dosa, M.D. · julho de 2007</text>'
for k in range(11):
    b += f'<rect x="-210" y="{20+k*26}" width="{420 if k%4!=3 else 280}" height="9" rx="4" fill="#b9b6aa"/>'
b += '</g>'
b += '<g transform="translate(730,980) rotate(6)"><rect x="-175" y="-245" width="350" height="490" rx="8" fill="#000" opacity=".5" transform="translate(12,16)"/><rect x="-175" y="-245" width="350" height="490" rx="8" fill="#1d3557"/><rect x="-175" y="-245" width="14" height="490" fill="#14263f"/>'
b += f'<text x="8" y="-170" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="40" fill="#f3e9cf">MAKING</text><text x="8" y="-124" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="40" fill="#f3e9cf">ROUNDS</text><text x="8" y="-78" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="40" fill="#ffc931">WITH OSCAR</text>'
b += front_cat(8, 38, .42, body="#c9ccd3", chest="#f3e9cf", ear_in="#d9a0a0")
b += f'<text x="8" y="215" text-anchor="middle" font-family="{SANS}" font-size="28" fill="#f3e9cf" letter-spacing="3">DAVID DOSA</text></g>'
b += f'<text x="540" y="1290" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="112" fill="#ffc931" stroke="#000" stroke-width="12" paint-order="stroke">25 → 50 → 100</text>'
b += f'<text x="540" y="1348" text-anchor="middle" font-family="{SANS}" font-size="36" fill="#aab4d6">mortes previstas · estimativas da equipe</text>'
scenes.append(wrap(b, 5, caption(["O MUNDO", "DESCOBRIU"], y0=1500)))

# 7 — the doubt
b = '<defs><radialGradient id="pu" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#3a2466"/><stop offset="1" stop-color="#090514"/></radialGradient></defs><rect width="1080" height="1920" fill="url(#pu)"/>'
for (qx, qy, qs, qr) in ((130, 420, 260, -14), (880, 360, 200, 12), (940, 960, 280, 10), (110, 1000, 220, -10), (500, 280, 150, 4)):
    b += f'<text x="{qx}" y="{qy}" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="{qs}" fill="#b79cff" opacity=".22" transform="rotate({qr} {qx} {qy})">?</text>'
def molecule(x, y, s, col):
    pts = [(0, 0), (60, -30), (110, 20), (60, 70), (-50, 60)]
    g = f'<g transform="translate({x},{y}) scale({s})">'
    for (a, c) in ((0, 1), (1, 2), (2, 3), (0, 4), (0, 3)):
        g += f'<line x1="{pts[a][0]}" y1="{pts[a][1]}" x2="{pts[c][0]}" y2="{pts[c][1]}" stroke="{col}" stroke-width="5" opacity=".8"/>'
    for k, (px, py) in enumerate(pts):
        g += f'<circle cx="{px}" cy="{py}" r="{16 if k==0 else 11}" fill="{col}"/><circle cx="{px}" cy="{py}" r="{28 if k==0 else 20}" fill="{col}" opacity=".25" filter="url(#b8)"/>'
    return g + '</g>'
mols = [(150, 640, 1.2), (760, 560, 1.1), (830, 1150, 1.3), (110, 1230, 1.0), (470, 1330, .9)]
for (mx, my, ms) in mols:
    b += molecule(mx, my, ms, "#5ef2d6")
for (mx, my, ms) in mols[:3]:
    b += f'<path d="M540 725 Q{(540+mx)/2} {(725+my)/2-90} {mx+30} {my}" fill="none" stroke="#5ef2d6" stroke-width="4" stroke-dasharray="4 16" stroke-linecap="round" opacity=".7"/>'
b += '<ellipse cx="540" cy="860" rx="330" ry="420" fill="#9b6bff" opacity=".28" filter="url(#b50)"/>'
b += front_cat(540, 780, 1.7, body="#2b2540", chest="#4a4266", ear_in="#5a4f7e", glow=True, dark=True)
scenes.append(wrap(b, 6, caption(["COMO ELE SABIA?"], gold_last=True, y0=1520)))

# 8 — farewell
b = '<defs><linearGradient id="n8" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070a16"/><stop offset="1" stop-color="#121a33"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#n8)"/>'
b += '<rect x="330" y="230" width="420" height="520" fill="#0a1228" stroke="#2b3556" stroke-width="16"/><line x1="540" y1="230" x2="540" y2="750" stroke="#2b3556" stroke-width="10"/><line x1="330" y1="490" x2="750" y2="490" stroke="#2b3556" stroke-width="10"/>'
b += '<circle cx="540" cy="420" r="150" fill="#f1ecd4" opacity=".18" filter="url(#b20)"/><circle cx="540" cy="420" r="105" fill="#f4efd8" opacity=".9"/><circle cx="508" cy="395" r="18" fill="#d9d3b8"/><circle cx="575" cy="450" r="12" fill="#d9d3b8"/>'
b += lamp(.14)
b += bed(False)
b += front_cat(600, 1040 - 225 * .7 + 8, .7, body="#6a707b", chest="#d6d3cc", glow=False)
b += '<ellipse cx="600" cy="1055" rx="140" ry="12" fill="#000" opacity=".35"/>'
scenes.append(wrap(b, 7, caption(["OSCAR", "2005 – 2022"], y0=1540) + f'<text x="540" y="1790" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="44" fill="#ffffff" stroke="#000" stroke-width="10" paint-order="stroke">Siga para mais histórias</text>'))

for i, s in enumerate(scenes, 1):
    open(os.path.join(OUT, f"cena{i}.svg"), "w").write(s)
print(len(scenes), "svgs")
