import math, random
from props_a import *

# ------------------------------------------------------------------ shared interior bits
INT_DEFS = '''<pattern id="wpn" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#26274a"/><rect width="26" height="60" fill="#2c2d56"/><circle cx="43" cy="30" r="5" fill="#3a3b6a" opacity=".6"/></pattern>
<pattern id="blk" width="50" height="50" patternUnits="userSpaceOnUse"><rect width="50" height="50" fill="#3f6a5a"/><rect width="25" height="25" fill="#2f5246"/><rect x="25" y="25" width="25" height="25" fill="#2f5246"/></pattern>
<pattern id="check" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#f4ecd8"/><rect width="30" height="30" fill="#c1403a"/><rect x="30" y="30" width="30" height="30" fill="#c1403a"/></pattern>
<pattern id="wpk" width="70" height="70" patternUnits="userSpaceOnUse"><rect width="70" height="70" fill="#e8d29c"/><circle cx="35" cy="35" r="7" fill="#d4b878"/><circle cx="0" cy="0" r="7" fill="#d4b878"/><circle cx="70" cy="70" r="7" fill="#d4b878"/><circle cx="0" cy="70" r="7" fill="#d4b878"/><circle cx="70" cy="0" r="7" fill="#d4b878"/></pattern>
<pattern id="gingham" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#f2ead4"/><rect width="20" height="40" fill="#c1403a" opacity=".55"/><rect width="40" height="20" fill="#c1403a" opacity=".55"/></pattern>
<linearGradient id="beam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bcd4ff" stop-opacity=".30"/><stop offset="1" stop-color="#bcd4ff" stop-opacity="0"/></linearGradient>
<linearGradient id="sunbeam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2c0" stop-opacity=".55"/><stop offset="1" stop-color="#fff2c0" stop-opacity="0"/></linearGradient>
<linearGradient id="brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0cf6a"/><stop offset="1" stop-color="#9a7418"/></linearGradient>'''

def hand_fist(x, y, s=1.0, rot=0):
    return (f'<g transform="translate({x},{y}) rotate({rot}) scale({s})"><ellipse cx="0" cy="0" rx="46" ry="38" fill="#e3ad88"/>'
            + ''.join(f'<ellipse cx="{-30+k*20}" cy="-26" rx="12" ry="14" fill="#e8b996" stroke="#b9794f" stroke-width="2"/>' for k in range(4)) +
            '<ellipse cx="36" cy="6" rx="14" ry="22" fill="#e8b996" stroke="#b9794f" stroke-width="2" transform="rotate(-20 36 6)"/></g>')

def hand_cup(x, y, side=1, s=1.0):
    return (f'<g transform="translate({x},{y}) scale({side*s},{s})"><ellipse cx="0" cy="10" rx="40" ry="52" fill="#e3ad88"/>'
            + ''.join(f'<rect x="{-18+k*2}" y="{-52+k*20}" width="64" height="20" rx="10" fill="#e8b996" stroke="#b9794f" stroke-width="2"/>' for k in range(4)) +
            '<ellipse cx="-30" cy="-10" rx="14" ry="30" fill="#e8b996" stroke="#b9794f" stroke-width="2" transform="rotate(20 -30 -10)"/></g>')

def portrait(x, y, w, h, seed):
    r = random.Random(seed)
    bgc = r.choice(['#d8c9a0', '#b9c9d0', '#d0b0a0', '#c0d0b0']); skin = r.choice(['#f1c9a8', '#e3b08a', '#d99a74'])
    hair = r.choice(['#2a1c12', '#6a4426', '#c9a050', '#8a8a8a', '#3a2a22']); cloth = r.choice(['#3a4a6a', '#7a3a3a', '#4a6a4a', '#6a5a7a'])
    cx = x + w/2
    g = f'<rect x="{x-9}" y="{y-9}" width="{w+18}" height="{h+18}" rx="6" fill="#5a3a22"/><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{bgc}"/>'
    g += f'<path d="M{x+6} {y+h} Q{cx} {y+h*.58} {x+w-6} {y+h}Z" fill="{cloth}"/><circle cx="{cx}" cy="{y+h*.44}" r="{w*.25}" fill="{skin}"/>'
    g += f'<path d="M{cx-w*.27} {y+h*.42} Q{cx} {y+h*.08} {cx+w*.27} {y+h*.42} Q{cx} {y+h*.27} {cx-w*.27} {y+h*.42}Z" fill="{hair}"/>'
    g += f'<circle cx="{cx-w*.09}" cy="{y+h*.44}" r="2.6" fill="#2a1c12"/><circle cx="{cx+w*.09}" cy="{y+h*.44}" r="2.6" fill="#2a1c12"/><path d="M{cx-w*.09} {y+h*.54} Q{cx} {y+h*.6} {cx+w*.09} {y+h*.54}" stroke="#8a3a34" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
    return g

def hic_bubble(x, y, rx, text='hic', fs=40, op=.9, rot=0):
    return (f'<g transform="rotate({rot} {x} {y})" opacity="{op}"><ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{rx*.7:.0f}" fill="#fff" stroke="#2a2a3a" stroke-width="4"/>'
            f'<path d="M{x-rx*.5:.0f} {y+rx*.55:.0f} l-{rx*.35:.0f} {rx*.5:.0f} l{rx*.6:.0f} -{rx*.25:.0f}Z" fill="#fff" stroke="#2a2a3a" stroke-width="4" stroke-linejoin="round"/>'
            f'<text x="{x}" y="{y+fs*.34:.0f}" text-anchor="middle" font-family="{SANS}" font-weight="900" font-style="italic" font-size="{fs}" fill="#2a2a3a">{text}</text></g>')

def blender(x, y, s=1.0, level=.72):
    g = f'<g transform="translate({x},{y}) scale({s})">'
    g += '<ellipse cx="0" cy="6" rx="110" ry="14" fill="#000" opacity=".3"/>'
    g += '<path d="M-80 -6 L-70 -150 L70 -150 L80 -6Z" fill="url(#brass)" opacity="0"/>'
    g += '<rect x="-84" y="-120" width="168" height="120" rx="26" fill="#c9ccd2"/><rect x="-84" y="-120" width="52" height="120" rx="24" fill="#fff" opacity=".35"/><rect x="-60" y="-84" width="120" height="34" rx="14" fill="#6a6e78"/>'
    g += '<circle cx="-30" cy="-67" r="11" fill="#d94b3a"/><circle cx="10" cy="-67" r="11" fill="#e8e8e8"/><circle cx="46" cy="-67" r="8" fill="#e8e8e8"/>'
    g += '<path d="M-62 -122 L-76 -330 L76 -330 L62 -122Z" fill="rgba(210,235,240,.35)" stroke="#9fb8c0" stroke-width="5"/>'
    top = -122 - 208*level
    g += f'<path d="M-62 -122 L{-62-14*level:.0f} {top:.0f} L{62+14*level:.0f} {top:.0f} L62 -122Z" fill="#d9c49c"/><ellipse cx="0" cy="{top:.0f}" rx="{62+14*level:.0f}" ry="10" fill="#ead9b4"/>'
    g += '<path d="M-52 -150 L-58 -310" stroke="#fff" stroke-width="7" opacity=".4" stroke-linecap="round"/>'
    g += '<rect x="-84" y="-342" width="168" height="20" rx="8" fill="#2a2a30"/><path d="M76 -300 q56 4 56 62 q0 40 -48 44" fill="none" stroke="#2a2a30" stroke-width="14" stroke-linecap="round"/>'
    return g + '</g>'

def mug(x, y, s=1.0, steam=True):
    g = f'<g transform="translate({x},{y}) scale({s})"><ellipse cx="0" cy="6" rx="70" ry="12" fill="#000" opacity=".25"/>'
    g += '<rect x="-52" y="-100" width="104" height="100" rx="14" fill="#f2efe6"/><rect x="-52" y="-100" width="30" height="100" rx="12" fill="#fff" opacity=".5"/><ellipse cx="0" cy="-100" rx="52" ry="12" fill="#5a3418"/><ellipse cx="0" cy="-100" rx="52" ry="12" fill="none" stroke="#f2efe6" stroke-width="5"/>'
    g += '<path d="M50 -78 q40 -6 40 28 q0 30 -40 26" fill="none" stroke="#f2efe6" stroke-width="12" stroke-linecap="round"/><rect x="-52" y="-62" width="104" height="14" fill="#c1403a" opacity=".8"/>'
    if steam: g += '<path d="M-14 -118 q-16 -28 0 -50 q16 -22 0 -50 M18 -118 q-16 -28 0 -50 q16 -22 0 -50" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".4"/>'
    return g + '</g>'

def table(ytop=1380, w=1080):
    g = f'<polygon points="-40,{ytop+40} {w+40},{ytop+40} {w+120},{ytop+200} -120,{ytop+200}" fill="url(#check)"/>'
    g += f'<polygon points="-120,{ytop+200} {w+120},{ytop+200} {w+120},1920 -120,1920" fill="#6a4a30"/><rect x="-120" y="{ytop+200}" width="{w+240}" height="16" fill="#8a6440"/>'
    g += f'<polygon points="-40,{ytop+40} {w+40},{ytop+40} {w+40},{ytop+20} -40,{ytop+20}" fill="#9a7048"/><polygon points="-40,{ytop+40} {w+40},{ytop+40} {w+120},{ytop+200} -120,{ytop+200}" fill="#000" opacity=".08"/>'
    return g

def kitchen_bg(mode='evening', frames=True, sun=False):
    sky = ('<linearGradient id="skyK" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2448"/><stop offset="1" stop-color="#d0805a"/></linearGradient>' if mode == 'evening' else
           '<linearGradient id="skyK" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ec8ec"/><stop offset="1" stop-color="#fdf0c4"/></linearGradient>')
    b = f'<defs>{sky}</defs><rect width="1080" height="1920" fill="url(#wpk)"/>'
    b += '<rect x="0" y="1180" width="1080" height="740" fill="#7a5238"/>' + ''.join(f'<line x1="{x}" y1="1180" x2="{x}" y2="1920" stroke="#5a3a24" stroke-width="3" opacity=".6"/>' for x in range(0, 1080, 90))
    b += '<rect x="0" y="1170" width="1080" height="20" fill="#9a6e48"/>'
    # window
    b += '<rect x="60" y="250" width="320" height="440" fill="#f1e8d4"/><rect x="82" y="272" width="276" height="396" fill="url(#skyK)"/>'
    if mode == 'morning':
        b += '<circle cx="250" cy="420" r="70" fill="#fff6d0" opacity=".9"/><circle cx="250" cy="420" r="130" fill="#fff6d0" opacity=".5" filter="url(#b20)"/>'
    else:
        b += '<circle cx="290" cy="360" r="40" fill="#f4efd8" opacity=".9"/>'
    b += '<line x1="220" y1="272" x2="220" y2="668" stroke="#f1e8d4" stroke-width="10"/><line x1="82" y1="470" x2="358" y2="470" stroke="#f1e8d4" stroke-width="10"/>'
    b += '<path d="M40 240 Q70 460 40 700 L130 700 Q150 460 130 240Z" fill="url(#gingham)"/><path d="M400 240 Q370 460 400 700 L310 700 Q290 460 310 240Z" fill="url(#gingham)"/><rect x="30" y="226" width="380" height="18" rx="8" fill="#6a4a30"/>'
    # clock
    b += '<circle cx="560" cy="250" r="62" fill="#3a2a1c"/><circle cx="560" cy="250" r="52" fill="#f6f0e0"/>' + ''.join(f'<line x1="{560+44*math.sin(math.radians(k*30)):.0f}" y1="{250-44*math.cos(math.radians(k*30)):.0f}" x2="{560+50*math.sin(math.radians(k*30)):.0f}" y2="{250-50*math.cos(math.radians(k*30)):.0f}" stroke="#222" stroke-width="3"/>' for k in range(12))
    ah, am = math.radians(-10 if mode == 'morning' else 100), math.radians(0 if mode == 'morning' else 200)
    b += f'<line x1="560" y1="250" x2="{560+28*math.sin(ah):.0f}" y2="{250-28*math.cos(ah):.0f}" stroke="#222" stroke-width="6" stroke-linecap="round"/><line x1="560" y1="250" x2="{560+42*math.sin(am):.0f}" y2="{250-42*math.cos(am):.0f}" stroke="#222" stroke-width="4" stroke-linecap="round"/><circle cx="560" cy="250" r="5" fill="#222"/>'
    if frames:
        k = 0
        for row, yy in enumerate((330, 530)):
            for col in range(4):
                b += f'<g class="pf" data-k="{k}">' + portrait(470 + col*150, yy, 112, 140, 30 + k) + '</g>'; k += 1
    # cabinet shelf at right? skip; lamp glow for evening
    if mode == 'evening':
        b += '<ellipse cx="540" cy="900" rx="560" ry="520" fill="#ffb347" opacity=".18" filter="url(#b50)"/>'
    return b

# ------------------------------------------------------------------ S5 insomnia
def s5():
    b = '<rect width="1080" height="1920" fill="url(#wpn)"/><rect width="1080" height="1920" fill="#080a20" opacity=".35"/>'
    b += '<rect x="70" y="240" width="340" height="480" fill="#1c1c3a" stroke="#3a3a5a" stroke-width="14"/><rect x="88" y="258" width="304" height="444" fill="#0b1236"/>'
    r = random.Random(9)
    for _ in range(24): b += f'<circle cx="{r.randint(100,380)}" cy="{r.randint(270,690)}" r="{r.choice([1.5,2,2.6])}" fill="#fff" opacity=".8"/>'
    b += '<g id="moon5"><circle cx="290" cy="400" r="62" fill="#f4efd8"/><circle cx="268" cy="384" r="12" fill="#d9d3b8"/><circle cx="305" cy="425" r="9" fill="#d9d3b8"/><circle cx="290" cy="400" r="120" fill="#bcd4ff" opacity=".25" filter="url(#b20)"/></g>'
    b += '<line x1="240" y1="258" x2="240" y2="702" stroke="#3a3a5a" stroke-width="10"/><line x1="88" y1="480" x2="392" y2="480" stroke="#3a3a5a" stroke-width="10"/>'
    b += '<path d="M40 226 Q70 470 40 740 L120 740 Q150 470 130 226Z" fill="#5a2434"/><path d="M440 226 Q410 470 440 740 L360 740 Q330 470 350 226Z" fill="#5a2434"/>'
    b += '<polygon id="beam5" points="110,720 400,720 960,1500 520,1560" fill="url(#beam)"/>'
    b += '<rect x="130" y="520" width="820" height="720" rx="60" fill="url(#wood)"/><rect x="130" y="520" width="820" height="720" rx="60" fill="#000" opacity=".25"/>'
    b += '<ellipse cx="340" cy="960" rx="210" ry="140" fill="#dfe5f0"/><ellipse cx="740" cy="960" rx="210" ry="140" fill="#d3dbe8"/>'
    b += '<g id="man5">' + face(540, 930, 1.3, 'old', 'wide', shirt='pajama', tilt=2) + '</g>'
    b += '<path d="M60 1190 C240 1130 420 1170 540 1150 C700 1120 880 1160 1010 1140 L1020 1760 L50 1760 Z" fill="url(#blk)"/><path d="M60 1190 C240 1130 420 1170 540 1150 C700 1120 880 1160 1010 1140" fill="none" stroke="#7fb09a" stroke-width="6" opacity=".6"/>'
    b += '<path d="M60 1300 C300 1260 700 1290 1010 1250" fill="none" stroke="#1c3a30" stroke-width="10" opacity=".35"/>'
    b += hand_fist(330, 1230, .9, -10) + hand_fist(750, 1226, .9, 10)
    # nightstand + clock
    b += '<rect x="860" y="1230" width="220" height="400" rx="12" fill="url(#wood)"/><rect x="880" y="1260" width="180" height="150" rx="8" fill="#4a2e1a"/><circle cx="970" cy="1335" r="12" fill="url(#brass)"/><rect x="860" y="1216" width="220" height="22" rx="8" fill="#a8764a"/>'
    b += '<circle cx="970" cy="1130" r="150" fill="#9dffb0" opacity=".16" filter="url(#b20)"/><circle cx="930" cy="1078" r="22" fill="#b8902e"/><circle cx="1010" cy="1078" r="22" fill="#b8902e"/><circle cx="970" cy="1142" r="76" fill="#cfc8b4"/><circle cx="970" cy="1142" r="62" fill="#111a14"/>'
    b += ''.join(f'<line x1="{970+50*math.sin(math.radians(k*30)):.0f}" y1="{1142-50*math.cos(math.radians(k*30)):.0f}" x2="{970+57*math.sin(math.radians(k*30)):.0f}" y2="{1142-57*math.cos(math.radians(k*30)):.0f}" stroke="#9dffb0" stroke-width="3"/>' for k in range(12))
    b += '<g id="mh5"><line x1="970" y1="1142" x2="970" y2="1100" stroke="#9dffb0" stroke-width="6" stroke-linecap="round"/></g><line x1="970" y1="1142" x2="1000" y2="1142" stroke="#9dffb0" stroke-width="4" stroke-linecap="round"/><circle cx="970" cy="1142" r="5" fill="#9dffb0"/>'
    for k, (bx, by, rx, fs, rot) in enumerate(((760, 790, 62, 38, -6), (860, 680, 76, 46, 5), (930, 540, 92, 56, -4), (790, 600, 70, 42, 6))):
        b += f'<g class="hb" data-k="{k}" opacity="0">' + hic_bubble(bx, by, rx, 'hic', fs, 1, rot) + '</g>'
    # waveform panel
    b += '<rect x="80" y="1560" width="920" height="270" rx="26" fill="#000" opacity=".5" stroke="#ffd23f" stroke-width="3"/>'
    pts = 'M110 1740 '
    x = 110
    while x < 1500:
        pts += f'L{x+50} 1740 L{x+62} 1668 L{x+76} 1790 L{x+90} 1720 L{x+104} 1740 '; x += 120
    b += '<clipPath id="ecgc"><rect x="100" y="1640" width="880" height="170"/></clipPath>'
    b += f'<g clip-path="url(#ecgc)"><g id="ecg5"><path d="{pts}" fill="none" stroke="#ffd23f" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/></g></g>'
    b += f'<text x="110" y="1626" font-family="{SANS}" font-weight="900" font-size="56" fill="#fff">20 a 40 por minuto</text><text x="980" y="1812" text-anchor="end" font-family="{SANS}" font-weight="700" font-size="34" letter-spacing="6" fill="#ffd9a0">DIA E NOITE</text>'
    return wrap2(b, 5, '', defs=INT_DEFS)

# ------------------------------------------------------------------ S6 cures
def panel(x, y, w, h, content, cid):
    g = f'<g id="{cid}w"><rect x="{x-14}" y="{y-14}" width="{w+28}" height="{h+28}" rx="16" fill="#000" opacity=".4" transform="translate(6 10)"/><rect x="{x-14}" y="{y-14}" width="{w+28}" height="{h+28}" rx="16" fill="#efe3c8"/>'
    g += f'<clipPath id="{cid}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8"/></clipPath><g clip-path="url(#{cid})"><g transform="translate({x},{y})">{content}</g>'
    g += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#8a6a30" opacity=".2" style="mix-blend-mode:multiply"/></g></g>'
    return g

def envelope(x, y, rot=0, s=1.0, col='#f6efe0'):
    return (f'<g transform="translate({x},{y}) rotate({rot}) scale({s})"><rect x="-62" y="-40" width="124" height="80" rx="4" fill="{col}" stroke="#bfb396" stroke-width="3"/>'
            '<path d="M-62 -40 L0 8 L62 -40" fill="none" stroke="#bfb396" stroke-width="3"/><rect x="34" y="-34" width="20" height="24" fill="#c1403a" opacity=".85"/><rect x="-62" y="30" width="124" height="10" fill="#3a5a9a" opacity=".5"/><rect x="-62" y="-40" width="124" height="6" fill="#c1403a" opacity=".5"/></g>')

def panel_train():
    g = '<defs><linearGradient id="skyA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ec3d8"/><stop offset="1" stop-color="#f4e3b8"/></linearGradient></defs><rect width="960" height="520" fill="url(#skyA)"/>'
    g += '<path d="M0 330 Q200 250 420 320 T960 290 L960 520 L0 520Z" fill="#8aa07a"/><path d="M0 380 Q300 330 620 380 T960 360 L960 520 L0 520Z" fill="#6a8a5a"/><rect y="400" width="960" height="120" fill="#8a7050"/>'
    g += '<g id="poles6">' + ''.join(f'<rect x="{x}" y="200" width="8" height="220" fill="#4a3322"/><rect x="{x-24}" y="212" width="56" height="8" fill="#4a3322"/>' for x in range(-400, 1500, 360)) + '</g>'
    g += '<line x1="0" y1="446" x2="960" y2="446" stroke="#2a2018" stroke-width="7"/><line x1="0" y1="458" x2="960" y2="458" stroke="#2a2018" stroke-width="5"/>' + ''.join(f'<rect x="{x}" y="452" width="30" height="12" fill="#4a3322"/>' for x in range(0, 960, 52))
    g += '<g transform="translate(60 14)">'
    g += '<g id="steam6">' + ''.join(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#fff" opacity=".85" filter="url(#b8)"/>' for (cx, cy, r) in ((560, 130, 42), (640, 92, 62), (740, 56, 80), (850, 28, 90))) + '</g>'
    g += '<rect x="80" y="160" width="150" height="230" rx="8" fill="#4a362a"/><rect x="66" y="146" width="180" height="22" rx="8" fill="#1a1a1e"/><rect x="104" y="188" width="76" height="76" fill="#1a1a1e"/><rect x="108" y="192" width="68" height="68" fill="#ffd48a" opacity=".5"/>'
    g += '<rect x="200" y="240" width="470" height="120" rx="56" fill="#2a2a2e"/><rect x="200" y="246" width="470" height="30" rx="15" fill="#fff" opacity=".12"/>' + ''.join(f'<rect x="{x}" y="240" width="16" height="120" fill="url(#brass)"/>' for x in (330, 450, 560))
    g += '<path d="M540 240 L550 170 L520 160 L610 160 L580 170 L590 240Z" fill="#1a1a1e"/><ellipse cx="408" cy="236" rx="38" ry="30" fill="url(#brass)"/><polygon points="660,392 760,446 660,446" fill="#2a2a2e"/><circle cx="676" cy="300" r="22" fill="#ffd48a"/><circle cx="676" cy="300" r="40" fill="#ffd48a" opacity=".4" filter="url(#b8)"/>'
    for (cx, cy, r) in ((300, 396, 54), (430, 396, 54), (590, 420, 30)):
        g += f'<g class="wh" data-cx="{cx}" data-cy="{cy}"><circle cx="{cx}" cy="{cy}" r="{r}" fill="#c1272d"/><circle cx="{cx}" cy="{cy}" r="{r-9}" fill="#2a2a2e"/><circle cx="{cx}" cy="{cy}" r="{r*.22:.0f}" fill="#9a9aa0"/>' + ''.join(f'<line x1="{cx}" y1="{cy}" x2="{cx+(r-10)*math.cos(math.radians(k*45)):.0f}" y2="{cy+(r-10)*math.sin(math.radians(k*45)):.0f}" stroke="#9a9aa0" stroke-width="4"/>' for k in range(8)) + '</g>'
    g += '<line x1="300" y1="396" x2="430" y2="396" stroke="#b0b0b8" stroke-width="10" stroke-linecap="round"/></g>'
    g += '<rect x="838" y="270" width="14" height="190" fill="#4a3322"/><rect x="690" y="250" width="240" height="84" rx="8" fill="url(#wood)" stroke="#2a1a10" stroke-width="5"/>'
    g += f'<text x="810" y="308" text-anchor="middle" font-family="{SERIF}" font-weight="700" font-size="46" fill="#f1e2bd" stroke="#2a1a10" stroke-width="2" paint-order="stroke">OMAHA</text>'
    g += f'<circle cx="880" cy="400" r="56" fill="#ffd23f" stroke="#c1272d" stroke-width="8"/><text x="880" y="422" text-anchor="middle" font-family="{SANS}" font-weight="900" font-size="64" fill="#c1272d">×4</text>'
    return g

def farmer_front(x, y, s=1.0, jump=0, calm=False):
    g = f'<g transform="translate({x},{y-jump}) scale({s})">'
    for sd in (-1, 1):
        g += f'<line x1="{sd*40}" y1="-130" x2="{sd*86}" y2="-26" stroke="#4a6ca0" stroke-width="72" stroke-linecap="round"/><path d="M{sd*86-44} -30 L{sd*86+44} -30 L{sd*86+50} 0 L{sd*86-50} 0 Z" fill="#4a2e1c"/>'
    g += '<path d="M-100 -300 Q0 -330 100 -300 L84 -120 L-84 -120Z" fill="url(#plaid)"/><rect x="-60" y="-260" width="120" height="140" rx="12" fill="#4a6ca0"/><path d="M-44 -260 L-84 -306 M44 -260 L84 -306" stroke="#3a557f" stroke-width="20" stroke-linecap="round"/>'
    g += '<circle cx="-38" cy="-246" r="9" fill="#d6b04a"/><circle cx="38" cy="-246" r="9" fill="#d6b04a"/><rect x="-26" y="-224" width="52" height="40" rx="5" fill="none" stroke="#2f4a73" stroke-width="3"/>'
    for sd in (-1, 1):
        if calm:
            g += f'<line x1="{sd*92}" y1="-290" x2="{sd*118}" y2="-195" stroke="url(#plaid)" stroke-width="40" stroke-linecap="round"/><line x1="{sd*118}" y1="-195" x2="{sd*126}" y2="-120" stroke="{SKINY}" stroke-width="30" stroke-linecap="round"/><circle cx="{sd*118}" cy="-195" r="24" fill="#7a1f1c"/><circle cx="{sd*128}" cy="-104" r="26" fill="{SKINY}"/>'
            continue
        g += f'<line x1="{sd*92}" y1="-290" x2="{sd*160}" y2="-400" stroke="url(#plaid)" stroke-width="40" stroke-linecap="round"/><line x1="{sd*160}" y1="-400" x2="{sd*128}" y2="-500" stroke="{SKINY}" stroke-width="30" stroke-linecap="round"/><circle cx="{sd*160}" cy="-400" r="24" fill="#7a1f1c"/><circle cx="{sd*124}" cy="-516" r="26" fill="{SKINY}"/>'
    g += f'<rect x="-26" y="-330" width="52" height="40" fill="{SKINY}"/>'
    g += face(0, -430, .5, 'young', 'closed' if calm else 'wide', bust=False, hat=calm, glasses=False)
    return g + '</g>'

def panel_shot():
    g = '<defs><linearGradient id="skyB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fc2e2"/><stop offset="1" stop-color="#f6e9c0"/></linearGradient></defs><rect width="960" height="520" fill="url(#skyB)"/>'
    g += '<path d="M0 340 Q240 270 500 330 T960 300 L960 520 L0 520Z" fill="#7aa060"/><path d="M0 400 Q300 360 620 400 T960 380 L960 520 L0 520Z" fill="#5a8a48"/>'
    g += '<ellipse cx="380" cy="478" rx="170" ry="22" fill="#000" opacity=".28"/>'
    g += '<g id="fc6">' + farmer_front(380, 470, .72, jump=0, calm=True) + '</g>'
    g += '<g id="fj6" opacity="0">' + farmer_front(380, 470, .72, jump=34) + '</g>'
    g += '<g id="hat6">' + hat_profile(250, 70, 28, .42) + '</g>'
    g += '<g id="gun6"><g transform="rotate(50 880 470)"><rect x="560" y="440" width="360" height="15" rx="4" fill="#3a3a42"/><rect x="560" y="462" width="360" height="15" rx="4" fill="#3a3a42"/><rect x="560" y="440" width="360" height="5" fill="#8a8a96" opacity=".6"/><path d="M560 436 h18 v46 h-18z" fill="#2a2a30"/><path d="M880 430 L960 440 L960 500 L880 480 Z" fill="#6a4426"/></g>'
    g += '<g transform="rotate(-18 940 520)"><rect x="880" y="470" width="200" height="90" rx="20" fill="#3a557f"/></g></g>'
    g += '<g id="flash6" opacity="0"><circle cx="692" cy="214" r="60" fill="#ffd23f" opacity=".7" filter="url(#b8)"/>' + ''.join(f'<circle cx="{650+dx}" cy="{90+dy}" r="{r}" fill="#fff" opacity=".8" filter="url(#b8)"/>' for dx, dy, r in ((40, -20, 24), (80, -50, 30), (-30, 20, 20))) + '</g>'
    g += '<g id="bang6" opacity="0">' + burst(650, 110, 120, 'BANG!', fs=62, rot=-12, seed=5) + '</g>'
    return g

def panel_mail():
    g = '<rect width="960" height="520" fill="#d9c29a"/><rect y="400" width="960" height="120" fill="#8a6a44"/><rect y="394" width="960" height="12" fill="#a8845a"/>'
    r = random.Random(6)
    for k in range(16): g += f'<g class="env" data-k="{k}">' + envelope(r.uniform(80, 880), r.uniform(60, 220), r.uniform(-40, 40), r.uniform(.5, .8)) + '</g>'
    g += '<ellipse cx="480" cy="470" rx="260" ry="26" fill="#000" opacity=".3"/>'
    g += '<path d="M240 460 C220 380 240 290 300 250 L660 250 C720 290 740 380 720 460 Z" fill="#c7b58a"/><path d="M240 460 C220 380 240 290 300 250 L360 250 C300 300 290 390 300 460Z" fill="#e0d2aa" opacity=".6"/>'
    for k in range(9): g += envelope(300 + k*46, 250 - (k % 3)*14, r.uniform(-30, 30), .75)
    g += '<path d="M290 260 Q480 300 670 260" fill="none" stroke="#8a6a3a" stroke-width="12" stroke-linecap="round"/>'
    g += f'<g id="stamp6" opacity="0"><g transform="rotate(-5 480 380)"><rect x="350" y="330" width="260" height="110" rx="10" fill="none" stroke="#c1272d" stroke-width="6" stroke-dasharray="14 8"/><text x="480" y="392" text-anchor="middle" font-family="{SANS}" font-weight="900" font-size="64" fill="#c1272d">4.000</text><text x="480" y="428" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="30" letter-spacing="6" fill="#c1272d">CARTAS</text></g></g>'
    return g

def s6():
    b = '<rect width="1080" height="1920" fill="#2a1f18"/>' + ''.join(f'<rect x="0" y="{y}" width="1080" height="6" fill="#3a2c22" opacity=".6"/>' for y in range(0, 1920, 60))
    b += panel(60, 140, 960, 500, panel_train(), 'pa') + panel(60, 700, 960, 500, panel_shot(), 'pb') + panel(60, 1260, 960, 500, panel_mail(), 'pc')
    return wrap2(b, 6, grain(.35), defs=INT_DEFS + FARM_DEFS)

# ------------------------------------------------------------------ S7 family / blender
def s7():
    b = kitchen_bg('evening', True)
    b += '<g id="man7">' + face(540, 1010, 1.3, 'old', 'smile', tilt=-2) + '</g>'
    b += table(1370)
    b += '<g id="bl7">' + blender(215, 1420, 1.05) + '</g>' + mug(870, 1450, .9, steam=False)
    b += '<g transform="translate(700 1400)"><path d="M-46 0 L-40 -110 L40 -110 L46 0Z" fill="rgba(240,248,255,.55)" stroke="#9fb8c0" stroke-width="4"/><path d="M-43 -20 L-39 -96 L39 -96 L43 -20Z" fill="#f4f1ea"/></g>'
    b += '<g id="hb7" opacity="0">' + hic_bubble(760, 840, 54, 'hic', 34, 1, -6) + '</g>'
    return wrap2(b, 7, grain(.18), defs=INT_DEFS)

# ------------------------------------------------------------------ S8 TV
def studio():
    g = '<defs><linearGradient id="stg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2a6a"/><stop offset="1" stop-color="#4a3a8a"/></linearGradient></defs><rect width="680" height="600" fill="url(#stg)"/>'
    r = random.Random(3)
    sk = ''.join(f'<rect x="{x}" y="{330-h}" width="{w}" height="{h}" fill="#0c1240"/>' for x, w, h in ((20, 60, 150), (90, 40, 210), (140, 70, 120), (220, 50, 190), (280, 80, 140), (370, 46, 220), (426, 70, 130), (506, 56, 180), (570, 80, 120)))
    g += sk + ''.join(f'<rect x="{r.randint(20,640)}" y="{r.randint(150,320)}" width="5" height="7" fill="#ffd48a" opacity=".8"/>' for _ in range(60))
    g += '<path d="M0 0 Q70 200 0 360 L0 0Z M680 0 Q610 200 680 360 L680 0Z" fill="#8a1c2c"/><rect y="330" width="680" height="270" fill="#4a2e1c"/><rect y="330" width="680" height="12" fill="#8a5a34"/>'
    g += '<polygon points="140,0 260,0 330,330 90,330" fill="#fff4d8" opacity=".08"/><polygon points="420,0 540,0 590,330 380,330" fill="#fff4d8" opacity=".08"/>'
    g += '<rect x="30" y="430" width="260" height="170" rx="8" fill="url(#wood)"/><rect x="20" y="420" width="280" height="22" rx="6" fill="#a8764a"/>'
    g += '<g id="host8">' + face(165, 330, .42, 'young', 'smile', glasses=False, shirt='suit', seed=21) + '</g>'
    g += '<rect x="26" y="430" width="272" height="170" fill="#3a2414" opacity="0"/>'
    g += '<rect x="360" y="420" width="260" height="190" rx="30" fill="#6a2a2a"/><rect x="350" y="380" width="280" height="70" rx="30" fill="#7a3434"/>'
    g += '<g id="guest8">' + face(490, 300, .48, 'old', 'smile', shirt='suit', seed=22) + '</g>'
    g += '<g id="hbs8" opacity="0">' + hic_bubble(600, 150, 46, 'hic', 30, 1, 6) + '</g>'
    for k in range(14):
        g += f'<g class="au" data-k="{k}"><ellipse cx="{20+k*50}" cy="590" rx="30" ry="40" fill="#07040e" opacity=".9"/><circle cx="{20+k*50}" cy="535" r="16" fill="#07040e" opacity=".9"/></g>'
    return g

def s8():
    b = '<rect width="1080" height="1920" fill="#150f1c"/><rect y="1380" width="1080" height="540" fill="#24182a"/>'
    b += '<ellipse id="tvglow" cx="540" cy="860" rx="620" ry="640" fill="#7a9cff" opacity=".22" filter="url(#b50)"/>'
    b += '<g id="ant8"><g transform="rotate(-18 540 420)"><rect x="500" y="170" width="12" height="260" rx="6" fill="#9a9aa4"/></g><g transform="rotate(18 540 420)"><rect x="530" y="170" width="12" height="260" rx="6" fill="#9a9aa4"/></g><ellipse cx="540" cy="420" rx="70" ry="22" fill="#2a2a30"/></g>'
    b += '<rect x="90" y="410" width="900" height="840" rx="46" fill="url(#wood)"/><rect x="90" y="410" width="900" height="840" rx="46" fill="none" stroke="#2a1a10" stroke-width="8"/>'
    b += '<rect x="130" y="450" width="700" height="620" rx="64" fill="#0a0a0e"/><clipPath id="scr"><rect x="140" y="460" width="680" height="600" rx="56"/></clipPath><g clip-path="url(#scr)"><g id="stu8"><g transform="translate(140,460)">' + studio() + '</g></g>'
    b += '<rect x="140" y="460" width="680" height="600" fill="#7a9cff" opacity=".1"/>' + '<g id="scan8">' + ''.join(f'<rect x="140" y="{y}" width="680" height="3" fill="#000" opacity=".16"/>' for y in range(455, 1068, 7)) + '</g>'
    b += '<ellipse cx="300" cy="540" rx="220" ry="70" fill="#fff" opacity=".12" filter="url(#b8)"/></g>'
    b += '<rect x="132" y="452" width="696" height="616" rx="62" fill="none" stroke="#1a1010" stroke-width="12"/>'
    b += '<rect x="860" y="470" width="100" height="360" rx="14" fill="#3a2414"/>' + ''.join(f'<line x1="872" y1="{490+k*16}" x2="948" y2="{490+k*16}" stroke="#1a1010" stroke-width="5"/>' for k in range(10))
    for k, yy in enumerate((880, 980, 1080)): b += f'<circle cx="910" cy="{yy}" r="34" fill="url(#brass)" stroke="#5a4210" stroke-width="5"/><line x1="910" y1="{yy}" x2="{910+22*math.cos(k)}" y2="{yy-22*math.sin(k+1)}" stroke="#2a2a2a" stroke-width="5" stroke-linecap="round"/>'
    b += '<rect x="150" y="1250" width="40" height="150" fill="#4a2e1a"/><rect x="890" y="1250" width="40" height="150" fill="#4a2e1a"/>'
    b += '<g id="sign8"><rect x="320" y="150" width="440" height="110" rx="26" fill="#2a0a0e" stroke="#ff4a3a" stroke-width="6"/><rect x="320" y="150" width="440" height="110" rx="26" fill="#ff2a1a" opacity=".28" filter="url(#b8)"/>'
    b += f'<text x="540" y="228" text-anchor="middle" font-family="{SANS}" font-weight="900" font-size="78" letter-spacing="10" fill="#ff5a4a">NO AR</text></g>'
    # radio 1936
    b += '<g transform="translate(150 1640)"><rect x="-100" y="-210" width="300" height="210" rx="22" fill="url(#wood)"/><path d="M-60 -170 A90 90 0 0 1 120 -170 L120 -40 L-60 -40Z" fill="#c9a870"/><circle cx="30" cy="-110" r="42" fill="#efe3c8" stroke="#2a1a10" stroke-width="5"/><line x1="30" y1="-110" x2="56" y2="-132" stroke="#c1272d" stroke-width="5" stroke-linecap="round"/><rect x="150" y="-170" width="36" height="130" rx="8" fill="#4a2e1a"/>'
    b += f'<text x="30" y="-6" text-anchor="middle" font-family="{SERIF}" font-weight="700" font-size="40" fill="#ffd9a0">1936</text>' + ''.join(f'<path class="rw" data-k="{k}" d="M{210+k*34} -150 q{12+k*8} 40 0 80" fill="none" stroke="#ffd9a0" stroke-width="5" stroke-linecap="round" opacity="{.8-k*.2}"/>' for k in range(3)) + '</g>'
    b += f'<text x="880" y="1700" text-anchor="middle" font-family="{SANS}" font-weight="900" font-size="120" fill="#ffd23f" stroke="#000" stroke-width="12" paint-order="stroke" opacity=".0">1982</text>'
    return wrap2(b, 8, grain(.25), defs=INT_DEFS)

# ------------------------------------------------------------------ S9 silence
def s9():
    b = kitchen_bg('morning', False)
    b += '<g id="beam9"><polygon points="60,260 360,260 900,1300 420,1400" fill="url(#sunbeam)"/><polygon points="130,300 300,300 700,1250 500,1300" fill="url(#sunbeam)" opacity=".7"/></g>'
    rr = random.Random(2)
    b += ''.join(f'<circle class="mt" data-k="{_}" cx="{rr.randint(300,800)}" cy="{rr.randint(500,1200)}" r="{rr.choice([2,3,4])}" fill="#fff6d0" opacity="{rr.choice([.4,.7])}"/>' for _ in range(40))
    # calendar
    b += '<g id="cal9"><rect x="760" y="250" width="250" height="300" rx="6" fill="#f6f0e0" stroke="#5a3a22" stroke-width="6"/><rect x="760" y="250" width="250" height="64" fill="#c1403a"/>'
    b += f'<text x="885" y="296" text-anchor="middle" font-family="{SANS}" font-weight="900" font-size="38" fill="#fff" letter-spacing="2">FEV 1990</text>'
    for rw in range(5):
        for cl in range(7):
            b += f'<rect x="{772+cl*33}" y="{330+rw*42}" width="26" height="30" rx="3" fill="#e6dcc0"/>'
    b += '</g>'
    b += '<g id="man9">' + face(540, 1010, 1.3, 'old', 'wide', mouth_expr='o', tilt=0) + '</g>'
    b += table(1370)
    b += mug(540, 1470, 1.1) + hand_cup(420, 1450, 1, 1.0) + hand_cup(660, 1450, -1, 1.0)
    b += '<g id="bub9" opacity="0"><g transform="translate(790 850)"><ellipse cx="0" cy="0" rx="130" ry="84" fill="#fff" stroke="#2a2a3a" stroke-width="5"/><path d="M-60 66 l-34 56 l70 -34Z" fill="#fff" stroke="#2a2a3a" stroke-width="5" stroke-linejoin="round"/>'
    b += '<circle class="dt" data-k="0" cx="-48" cy="0" r="14" fill="#2a2a3a" opacity="0"/><circle class="dt" data-k="1" cx="0" cy="0" r="14" fill="#2a2a3a" opacity="0"/><circle class="dt" data-k="2" cx="48" cy="0" r="14" fill="#2a2a3a" opacity="0"/></g></g>'
    b += '<g id="hb9" opacity="0">' + hic_bubble(720, 840, 60, 'hic', 38, 1, -6) + '</g>'
    b += '<rect id="flare9" width="1080" height="1920" fill="#fff6d0" opacity="0"/>'
    return wrap2(b, 9, grain(.15), defs=INT_DEFS)

# ------------------------------------------------------------------ S10 sunset hat
def s10():
    b = '<defs><linearGradient id="sk10" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2050"/><stop offset=".4" stop-color="#b8466a"/><stop offset=".7" stop-color="#f08a4b"/><stop offset="1" stop-color="#ffd48a"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#sk10)"/>'
    b += '<g id="sun10"><circle cx="540" cy="1090" r="380" fill="#ffd48a" opacity=".5" filter="url(#b50)"/><circle cx="540" cy="1100" r="150" fill="#fff0c0"/></g>'
    b += '<g id="clouds10">'
    for (cx, cy, rx, ry, op) in ((250, 560, 340, 32, .5), (800, 700, 380, 28, .5), (520, 860, 300, 22, .55), (1150, 600, 300, 28, .5)):
        b += f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#ffb4a0" opacity="{op}" filter="url(#b20)"/>'
    b += '</g>'
    r = random.Random(14)
    b += '<g id="birds10">' + ''.join(f'<path d="M{100+k*90+r.randint(-20,20)} {420+r.randint(0,160)} q14 -14 28 0 q14 -14 28 0" fill="none" stroke="#2a1830" stroke-width="4" stroke-linecap="round" opacity=".7"/>' for k in range(7)) + '</g>'
    b += '<path d="M0 1180 Q260 1130 540 1170 T1080 1150 L1080 1920 L0 1920Z" fill="#3a2430"/>'
    b += '<g fill="#1c1018"><rect x="160" y="1060" width="150" height="100"/><polygon points="150,1062 235,1010 320,1062"/><rect x="330" y="980" width="40" height="180" rx="8"/><path d="M326 982 Q350 950 374 982Z"/></g>'
    b += '<path d="M0 1260 Q300 1210 600 1260 T1080 1240 L1080 1920 L0 1920Z" fill="#241520"/>'
    st = ''.join(f'M{r.uniform(0,1080):.0f} {r.uniform(1250,1920):.0f}l{r.uniform(-8,8):.0f} {r.uniform(-40,-14):.0f}' for _ in range(900))
    b += f'<g id="grass10"><path d="{st}" stroke="#4a2c38" stroke-width="3" stroke-linecap="round" opacity=".8"/></g>'
    b += '<rect x="470" y="1040" width="150" height="880" rx="10" fill="#4a3322"/><rect x="470" y="1040" width="44" height="880" fill="#7a5638" opacity=".7"/><rect x="460" y="1030" width="170" height="30" rx="8" fill="#3a2616"/>'
    b += ''.join(f'<path d="M{480+r.randint(0,130)} {1060+k*60} l{r.randint(-6,6)} {r.randint(30,70)}" stroke="#2a1a0e" stroke-width="3" opacity=".6"/>' for k in range(14))
    b += '<path d="M630 1130 Q840 1160 1080 1120" fill="none" stroke="#2a2a30" stroke-width="5"/><path d="M630 1250 Q840 1280 1080 1240" fill="none" stroke="#2a2a30" stroke-width="5"/>'
    b += '<g id="hat10">' + hat_profile(560, 1010, 16, 1.18) + '</g>'
    b += '<ellipse cx="640" cy="1860" rx="420" ry="40" fill="#000" opacity=".35"/>'
    b += f'<g id="t10a" opacity="0"><text x="540" y="360" text-anchor="middle" font-family="{SERIF}" font-weight="700" font-size="124" fill="#ffe9bd" stroke="#4a1828" stroke-width="12" paint-order="stroke">1922 – 1990</text></g>'
    b += f'<g id="t10b" opacity="0"><text x="540" y="450" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="48" letter-spacing="10" fill="#ffd9a0">68 ANOS</text></g>'
    return wrap2(b, 10, grain(.4), defs=INT_DEFS)
