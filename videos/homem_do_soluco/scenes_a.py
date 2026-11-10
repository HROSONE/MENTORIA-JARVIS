import math, random
from props_a import *

FD = FARM_DEFS + '<linearGradient id="skyF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b3f58"/><stop offset=".45" stop-color="#d9784a"/><stop offset="1" stop-color="#fbd08a"/></linearGradient>'

def farm_bg():
    b = '<rect width="1080" height="1920" fill="url(#skyF)"/>'
    b += '<g id="sun"><circle cx="860" cy="930" r="330" fill="#ffe3a0" opacity=".55" filter="url(#b50)"/><circle cx="860" cy="940" r="95" fill="#fff4cf"/></g>'
    b += '<g id="clouds">'
    for (cx, cy, rx, ry, op) in ((250, 420, 330, 36, .5), (760, 560, 380, 30, .45), (480, 700, 300, 26, .4), (1100, 500, 300, 30, .45)):
        b += f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#f6b784" opacity="{op}" filter="url(#b20)"/>'
    b += '</g><g id="birds">' + ''.join(f'<path d="M{x} {y} q10 -12 20 0 q10 -12 20 0" fill="none" stroke="#3a2230" stroke-width="3.5" stroke-linecap="round"/>' for x, y in ((120, 330), (190, 360), (260, 318), (330, 352), (400, 330))) + '</g>'
    b += '<path d="M0 960 Q220 880 480 940 T1080 900 L1080 1100 L0 1100Z" fill="#7a4a48"/><path d="M0 1010 Q300 960 620 1010 T1080 990 L1080 1120 L0 1120Z" fill="#5a3a30"/>'
    b += silo(-30, 1060, .8) + barn(60, 1090, 1.0)
    b += ground(1090, 1920) + fence(0, 1080, 1130, 1.0)
    return b

def sign1922():
    return ('<g transform="rotate(-3 200 300)"><line x1="120" y1="150" x2="140" y2="250" stroke="#3a2a1c" stroke-width="5"/><line x1="300" y1="150" x2="280" y2="250" stroke="#3a2a1c" stroke-width="5"/>'
            '<rect x="70" y="240" width="260" height="120" rx="10" fill="url(#wood)" stroke="#2a1a10" stroke-width="6"/>'
            + ''.join(f'<line x1="70" y1="{240+k*30}" x2="330" y2="{240+k*30}" stroke="#2a1a10" stroke-width="2" opacity=".6"/>' for k in range(1, 4)) +
            f'<text x="200" y="334" text-anchor="middle" font-family="{SERIF}" font-weight="700" font-size="84" fill="#f1e2bd" stroke="#2a1a10" stroke-width="3" paint-order="stroke">1922</text></g>')

def s2():
    b = farm_bg()
    b += plat_scale(330, 1450, 560, 350)
    b += '<g id="hog2">' + hog(650, 1362, .78, False) + '</g>'
    b += '<g id="fm2">' + farmer_profile(250, 1500, .82, 36, (((-20, -420), (-92, -232), (-150, -44)), ((16, -420), (70, -215), (70, -44))), ((340, -330), (330, -300)), head_rot=6) + '</g>'
    for k, (dx, dy) in enumerate(((505, 872), (470, 900), (528, 912))):
        b += f'<g class="sw" data-k="{k}" opacity="0"><path transform="translate({dx} {dy})" d="M0 -16 C12 0 14 10 0 16 C-14 10 -12 0 0 -16Z" fill="#cfeaff" stroke="#6aa8d0" stroke-width="2.5"/></g>'
    b += sign1922()
    return wrap2(b, 2, grain(.5), defs=FD)

def s3():
    b = '<g id="tilt3" transform="translate(540 960) rotate(-6) scale(1.14) translate(-540 -960)">'
    b += '<rect x="-500" y="0" width="2080" height="1920" fill="url(#skyF)"/><rect x="-500" y="1090" width="2080" height="830" fill="url(#dirt)"/>' + farm_bg() + '<g id="dust3">' + dust(330, 1480, 16, 300) + '</g>'
    b += plat_scale(330, 1450, 560, 350)
    b += '<g id="hog3">' + hog(670, 1362, .78, False, startled=True) + '</g>'
    b += '<g id="fa3">' + farmer_profile(290, 1500, .82, 36, (((-20, -420), (-92, -232), (-150, -44)), ((16, -420), (70, -215), (70, -44))), ((380, -330), (370, -300)), head_rot=6, expr='grit') + '</g>'
    b += '<g id="fb3" opacity="0">' + farmer_profile(290, 1500, .82, -38, (((-20, -420), (-70, -240), (-120, -44)), ((16, -420), (120, -330), (160, -250))), ((10, -880), (-90, -930)), head_rot=-10, expr='o', hat=False, bend_near=1, bend_far=1) + '</g>'
    b += '<g id="hat3">' + hat_profile(0, 0, 0, .9) + '</g></g>'
    return wrap2(b, 3, grain(.5) + '<g id="burst3">' + burst(790, 470, 260, 'HIC!', fs=190) + '</g>', defs=FD)

# ----------------------------------------------------------------- S1 hook
S1D = '<radialGradient id="bg1" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="#8a2430"/><stop offset=".55" stop-color="#3a0f1a"/><stop offset="1" stop-color="#10050a"/></radialGradient><linearGradient id="fadeB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".88"/></linearGradient>'
def s1():
    r = random.Random(5)
    b = '<rect width="1080" height="1920" fill="url(#bg1)"/>'
    b += '<g id="rays1">'
    for k in range(70):
        a = r.uniform(0, math.tau); r1 = r.uniform(380, 520); r2 = r.uniform(900, 1400)
        b += f'<line x1="{540+r1*math.cos(a):.0f}" y1="{800+r1*math.sin(a):.0f}" x2="{540+r2*math.cos(a):.0f}" y2="{800+r2*math.sin(a):.0f}" stroke="#ffd9a0" stroke-width="{r.choice([3,5,8])}" opacity="{r.choice([.08,.14,.2])}"/>'
    b += '</g><polygon points="430,0 650,0 1000,1100 80,1100" fill="#fff4d8" opacity=".07" filter="url(#b8)"/>'
    b += '<g id="f1">' + face(540, 800, 2.3, 'old', 'wide', tilt=-4) + '</g>'
    b += '<g id="bolts1" opacity="0">'
    for sd in (-1, 1):
        for k, (dx, dy) in enumerate(((0, 0), (30, 90), (-10, 180))):
            x0 = 540 + sd*(470+dx); y0 = 520 + dy
            b += f'<polyline points="{x0},{y0} {x0+sd*40},{y0-34} {x0+sd*10},{y0-20} {x0+sd*58},{y0-64}" fill="none" stroke="#ffd23f" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>'
    b += '</g><g id="burst1" opacity="0">' + burst(850, 330, 215, 'HIC!', fs=156) + '</g>'
    b += '<rect x="0" y="1200" width="1080" height="720" fill="url(#fadeB)"/>'
    b += f'<g id="n68" opacity="0"><text x="540" y="1590" text-anchor="middle" font-family="{SANS}" font-weight="900" font-size="360" fill="#ffd23f" stroke="#7a1520" stroke-width="22" paint-order="stroke" stroke-linejoin="round">68</text></g>'
    b += f'<g id="anos" opacity="0"><text x="540" y="1720" text-anchor="middle" font-family="{SANS}" font-weight="900" font-size="120" letter-spacing="14" fill="#fff" stroke="#000" stroke-width="14" paint-order="stroke" stroke-linejoin="round">ANOS</text></g>'
    b += f'<g id="sub1" opacity="0"><text x="540" y="1790" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="40" letter-spacing="8" fill="#ffd9a0">DE SOLUÇO SEM PARAR</text></g>'
    return wrap2(b, 1, grain(.25), defs=S1D)

# ----------------------------------------------------------------- S4 brain
S4D = '''<linearGradient id="bg4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04202c"/><stop offset="1" stop-color="#0a3d50"/></linearGradient>
<radialGradient id="brain" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#f3b6c4"/><stop offset=".6" stop-color="#d8849c"/><stop offset="1" stop-color="#9a4a68"/></radialGradient>
<radialGradient id="redglow"><stop offset="0" stop-color="#ff5a4a" stop-opacity="1"/><stop offset="1" stop-color="#ff5a4a" stop-opacity="0"/></radialGradient>'''
def s4():
    r = random.Random(11)
    b = '<rect width="1080" height="1920" fill="url(#bg4)"/>'
    for x in range(0, 1081, 60): b += f'<line x1="{x}" y1="0" x2="{x}" y2="1920" stroke="#2ec4d8" stroke-width="1.5" opacity=".13"/>'
    for y in range(0, 1921, 60): b += f'<line x1="0" y1="{y}" x2="1080" y2="{y}" stroke="#2ec4d8" stroke-width="1.5" opacity=".13"/>'
    b += '<rect id="scan4" x="0" y="-10" width="1080" height="10" fill="#7de6f4" opacity=".28"/>'
    hx, hy, hs = 470, 740, 3.1
    g = f'<g transform="translate({hx},{hy}) scale({hs})">'
    g += f'<path d="{PROFILE}" fill="rgba(110,220,240,.10)" stroke="#7de6f4" stroke-width="2.4"/><path d="{PROFILE}" fill="none" stroke="#7de6f4" stroke-width="5" opacity=".35" filter="url(#b3)"/>'
    g += '<path d="M -44 100 L -56 190 L 24 190 L 36 106" fill="rgba(110,220,240,.10)" stroke="#7de6f4" stroke-width="2.4"/>'
    g += '<ellipse cx="-14" cy="6" rx="17" ry="30" fill="none" stroke="#7de6f4" stroke-width="2" opacity=".6"/>'
    # brain
    bc = (-10, -60)
    lobes = ''
    for k in range(34):
        a = k*math.tau/34; rr = 1 + .06*math.sin(k*2.3)
        lobes += f'<circle cx="{bc[0]+56*rr*math.cos(a):.1f}" cy="{bc[1]+44*rr*math.sin(a):.1f}" r="{r.uniform(11,15):.1f}"/>'
    g += f'<g fill="url(#brain)" stroke="#8a3a58" stroke-width="1.2"><ellipse cx="{bc[0]}" cy="{bc[1]}" rx="56" ry="44"/>{lobes}</g>'
    g += f'<clipPath id="bclip"><ellipse cx="{bc[0]}" cy="{bc[1]}" rx="64" ry="52"/></clipPath><g clip-path="url(#bclip)" fill="none" stroke="#8a3a58" stroke-width="2.2" stroke-linecap="round" opacity=".75">'
    for k in range(16):
        x0 = bc[0]-62 + r.uniform(0, 14); y0 = bc[1]-44 + k*6.2
        pts = ' '.join(f'{x0 + j*16:.0f},{y0 + 5*math.sin(j*1.7+k):.1f}' for j in range(8))
        g += f'<polyline points="{pts}" stroke-linejoin="round"/>'
    g += '</g>'
    g += '<g fill="#c06a86" stroke="#8a3a58" stroke-width="1.2"><ellipse cx="-46" cy="-6" rx="26" ry="16"/></g>' + ''.join(f'<path d="M{-76} {-6+k*4.5} Q{-50} {-2+k*4.5} {-24} {-6+k*4.5}" fill="none" stroke="#8a3a58" stroke-width="1" opacity=".7"/>' for k in range(5))
    g += '<path d="M -26 -14 C -22 14 -20 50 -14 96 L 6 96 C 2 50 0 14 -6 -16 Z" fill="#c9788f" stroke="#8a3a58" stroke-width="1.2"/>'
    g += '<g id="dot4"><circle cx="-14" cy="6" r="22" fill="url(#redglow)"/><circle cx="-14" cy="6" r="4.2" fill="#ff3b30"/></g>'
    g += '</g>'
    b += '<g id="head4">' + g + '</g>'
    dx, dy = hx - 14*hs, hy + 6*hs
    b += f'<circle id="ring4" cx="{dx:.0f}" cy="{dy:.0f}" r="46" fill="none" stroke="#ff6a5a" stroke-width="5" stroke-dasharray="14 10"/>'
    mx, my, mr = 760, 1300, 250
    b += f'<line x1="{dx+34:.0f}" y1="{dy+30:.0f}" x2="{mx-mr*.72:.0f}" y2="{my-mr*.6:.0f}" stroke="#ff6a5a" stroke-width="4" stroke-dasharray="10 9"/>'
    b += '<g id="mag4">'
    b += f'<clipPath id="mclip"><circle cx="{mx}" cy="{my}" r="{mr}"/></clipPath><g clip-path="url(#mclip)"><rect x="{mx-mr}" y="{my-mr}" width="{2*mr}" height="{2*mr}" fill="#5a1a26"/>'
    for _ in range(46):
        cxx, cyy = mx + r.uniform(-mr, mr), my + r.uniform(-mr, mr); rr = r.uniform(18, 46)
        b += f'<circle cx="{cxx:.0f}" cy="{cyy:.0f}" r="{rr:.0f}" fill="#8a2c3e" opacity="{r.uniform(.25,.55):.2f}"/><circle cx="{cxx:.0f}" cy="{cyy:.0f}" r="{rr*.35:.0f}" fill="#b94a5c" opacity=".5"/>'
    b += f'<path d="M{mx-mr-20} {my+40} Q{mx-120} {my+20} {mx-30} {my+34}" fill="none" stroke="#a8202c" stroke-width="86" stroke-linecap="round"/><path d="M{mx-mr-20} {my+40} Q{mx-120} {my+20} {mx-30} {my+34}" fill="none" stroke="#e8505a" stroke-width="44" stroke-linecap="round" opacity=".8"/>'
    b += f'<path d="M{mx+mr+20} {my-10} Q{mx+120} {my+10} {mx+60} {my-8}" fill="none" stroke="#a8202c" stroke-width="86" stroke-linecap="round"/><path d="M{mx+mr+20} {my-10} Q{mx+120} {my+10} {mx+60} {my-8}" fill="none" stroke="#e8505a" stroke-width="44" stroke-linecap="round" opacity=".8"/>'
    for k in range(18):
        a = r.uniform(-math.pi, 0); d = r.uniform(30, 150)
        b += f'<circle class="dr" data-k="{k}" data-a="{a:.3f}" data-d="{d:.0f}" cx="{mx+15+d*math.cos(a):.0f}" cy="{my+10+d*math.sin(a):.0f}" r="{r.uniform(6,18):.0f}" fill="#ff4a3c"/>'
    b += f'<circle cx="{mx+15}" cy="{my+10}" r="70" fill="#ff3b30" opacity=".35" filter="url(#b20)"/></g>'
    b += f'<circle cx="{mx}" cy="{my}" r="{mr}" fill="none" stroke="#d6a93a" stroke-width="22"/><circle cx="{mx}" cy="{my}" r="{mr+13}" fill="none" stroke="#8a6a1c" stroke-width="4"/>'
    b += f'<g transform="rotate(48 {mx} {my})"><rect x="{mx+mr+10}" y="{my-22}" width="230" height="44" rx="20" fill="#4a2e1c"/><rect x="{mx+mr+10}" y="{my-22}" width="230" height="14" rx="7" fill="#7a5030" opacity=".7"/></g>'
    b += f'<path d="M{mx-mr*.8:.0f} {my-mr*.55:.0f} A{mr} {mr} 0 0 1 {mx-mr*.2:.0f} {my-mr*.97:.0f}" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".28"/>'
    b += '</g>'
    b += '<g id="doc4">'
    # doctor hand with pointer
    b += f'<line x1="250" y1="1010" x2="{dx-10:.0f}" y2="{dy+16:.0f}" stroke="#d8b878" stroke-width="10" stroke-linecap="round"/><circle cx="{dx-10:.0f}" cy="{dy+16:.0f}" r="7" fill="#ff6a5a"/>'
    b += '<g transform="rotate(-24 120 1230)"><rect x="-60" y="1176" width="320" height="120" rx="20" fill="#eef1f5"/><rect x="226" y="1170" width="46" height="132" rx="10" fill="#ffffff"/><circle cx="249" cy="1210" r="9" fill="#d6a93a"/><rect x="-60" y="1176" width="320" height="30" fill="#dfe4ea"/></g>'
    b += '<g transform="translate(262 1060) rotate(-24)"><ellipse cx="0" cy="40" rx="62" ry="40" fill="#e8b996"/><ellipse cx="16" cy="6" rx="30" ry="14" fill="#e8b996" transform="rotate(-20)"/><path d="M-30 20 q10 -12 30 -10 M-20 40 q14 -10 40 -6" stroke="#b9794f" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="10" y="10" width="42" height="18" rx="9" fill="#e8b996" transform="rotate(-8 30 20)"/></g>'
    b += '</g>'
    b += f'<g id="title4"><text x="540" y="260" text-anchor="middle" font-family="{SANS}" font-weight="900" font-size="128" letter-spacing="10" fill="#ffd23f" stroke="#04202c" stroke-width="16" paint-order="stroke">HIPÓTESE</text></g>'
    b += f'<text x="540" y="330" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="40" letter-spacing="6" fill="#7de6f4">TRONCO CEREBRAL</text>'
    return wrap2(b, 4, '', defs=S4D)

def build_all():
    from scenes2_a import s5, s6, s7, s8, s9, s10
    out = {1: s1(), 2: s2(), 3: s3(), 4: s4(), 5: s5(), 6: s6(), 7: s7(), 8: s8(), 9: s9(), 10: s10()}
    return out

if __name__ == '__main__':
    for k, v in build_all().items():
        open(f'sc{k}.svg', 'w').write(v)
