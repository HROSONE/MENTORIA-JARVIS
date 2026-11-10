import math, random
_u = [0]
def uid():
    _u[0] += 1
    return _u[0]

NORMAL = dict(base='#8f9299', dark='#2f3137', mid='#6c6f77', light='#c6c9cf', white='#f3f1ec', pink='#dfa0a2', shade='#4d5058')
DARK   = dict(base='#16171c', dark='#060608', mid='#0f1014', light='#444856', white='#2c2e38', pink='#4a2f33', shade='#0c0c10')
PURPLE = dict(base='#3d3560', dark='#14102a', mid='#2d2650', light='#8a7fc4', white='#a49cd0', pink='#7a5a82', shade='#1f1a3a')

FUZZ = '''<filter id="fuzz" x="-12%" y="-12%" width="124%" height="124%"><feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="10" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="fuzz2" x="-12%" y="-12%" width="124%" height="124%"><feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="2" seed="8" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"/></filter>'''

def fur_path(cx, cy, rx, ry, n, seed, length, mode='out', anchor=None, jit=.4, vec=(-0.9, 0.5)):
    r = random.Random(seed); d = []
    ax, ay = anchor if anchor else (cx, cy)
    for _ in range(n):
        a = r.random() * math.tau; rr = math.sqrt(r.random())
        px = cx + rx * rr * math.cos(a); py = cy + ry * rr * math.sin(a)
        if mode == 'out': vx, vy = px - ax, py - ay
        elif mode == 'down': vx, vy = (px - cx) / rx * 0.5, 1.0
        else: vx, vy = vec
        m = math.hypot(vx, vy) or 1; vx /= m; vy /= m
        th = math.atan2(vy, vx) + r.uniform(-jit, jit)
        vx, vy = math.cos(th), math.sin(th)
        L = r.uniform(*length)
        ex, ey = px + vx * L, py + vy * L
        mx = (px + ex) / 2 - vy * L * .18 * r.uniform(-1, 1); my = (py + ey) / 2 + vx * L * .18 * r.uniform(-1, 1)
        d.append(f"M{px:.0f} {py:.0f}Q{mx:.0f} {my:.0f} {ex:.0f} {ey:.0f}")
    return "".join(d)

def L(color, w, op, p):
    return f'<path d="{p}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" opacity="{op}"/>'

def fur_block(cx, cy, rx, ry, pal, seed, k=1.0, length=(9, 20), mode='out', anchor=None, vec=(-0.9, .5)):
    n = int(math.pi * rx * ry / 24 * k)
    g = ''
    g += L(pal['dark'], 2.4, .55, fur_path(cx, cy, rx, ry, int(n*.35), seed, length, mode, anchor, vec=vec))
    g += L(pal['mid'], 2.4, .6, fur_path(cx, cy, rx, ry, int(n*.5), seed+1, length, mode, anchor, vec=vec))
    g += L(pal['light'], 1.8, .6, fur_path(cx, cy, rx, ry, int(n*.6), seed+2, length, mode, anchor, vec=vec))
    g += L(pal['white'], 1.2, .35, fur_path(cx, cy, rx, ry, int(n*.18), seed+3, length, mode, anchor, vec=vec))
    return g

def eye(ex, ey, pal, glow=False, pupil=5.5, w=31, h=25, tag=''):
    i = uid(); o = -1 if ex < 0 else 1
    ox, oy = ex + o * w, ey - 6; ix, iy = ex - o * w, ey + 7
    path = f"M{ix} {iy}Q{ex} {ey-h-10} {ox} {oy}Q{ex} {ey+h-3} {ix} {iy}Z"
    g = f'<g class="eye" data-cx="{ex}" data-cy="{ey}">'
    if glow:
        g += f'<ellipse cx="{ex}" cy="{ey}" rx="52" ry="52" fill="#ffc931" opacity=".28" filter="url(#b20)"/>'
    g += f'<clipPath id="ec{i}"><path d="{path}"/></clipPath>'
    g += f'<radialGradient id="ir{i}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fbe86a"/><stop offset=".55" stop-color="#e0a71c"/><stop offset=".9" stop-color="#8a5a08"/><stop offset="1" stop-color="#3a2504"/></radialGradient>'
    g += f'<path d="{path}" fill="#150e06"/><g clip-path="url(#ec{i})">'
    g += f'<circle cx="{ex}" cy="{ey}" r="{h+3}" fill="url(#ir{i})"/>'
    for k in range(18):
        a = k * math.tau / 18
        g += f'<line x1="{ex+math.cos(a)*7:.1f}" y1="{ey+math.sin(a)*7:.1f}" x2="{ex+math.cos(a)*(h+2):.1f}" y2="{ey+math.sin(a)*(h+2):.1f}" stroke="#fff2a0" stroke-width="1.4" opacity=".35"/>'
    g += f'<ellipse cx="{ex}" cy="{ey}" rx="{pupil}" ry="{h+2}" fill="#050505"/>'
    g += f'<rect x="{ex-w-4}" y="{ey-h-12}" width="{2*w+8}" height="{h*.8}" fill="#000" opacity=".38"/>'
    g += f'<circle cx="{ex+o*-5+5}" cy="{ey-9}" r="5.2" fill="#fff" opacity=".92"/><circle cx="{ex-6}" cy="{ey+8}" r="2.4" fill="#fff" opacity=".6"/></g>'
    g += f'<path d="{path}" fill="none" stroke="#080808" stroke-width="3.6" stroke-linejoin="round"/>'
    g += f'<ellipse cx="{ix}" cy="{iy}" rx="4" ry="2.6" fill="{pal["pink"]}" opacity=".85"/>'
    g += '</g>'
    return g

def whiskers(pal, dark=False):
    c = '#d9dce3' if not dark else '#6a7080'
    g = ''
    for sg in (-1, 1):
        for k, (dy, ang) in enumerate(((-34, -30), (-27, -12), (-20, 6), (-14, 22))):
            x1, y1 = sg * 34, dy
            x2, y2 = sg * 150, dy + ang
            g += f'<path d="M{x1} {y1}Q{sg*95} {dy+ang*.2-8} {x2} {y2}" fill="none" stroke="{c}" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>'
    return g

def front_cat(x, y, s=1, pal=NORMAL, glow=False, pupil=5.5, seed=11, dark=False, cid=''):
    p = pal
    g = f'<g id="{cid}"><g transform="translate({x},{y}) scale({s})">'
    i = uid()
    g += f'<radialGradient id="bgd{i}" cx="45%" cy="30%" r="80%"><stop offset="0" stop-color="{p["light"]}"/><stop offset=".45" stop-color="{p["base"]}"/><stop offset="1" stop-color="{p["shade"]}"/></radialGradient>'
    g += f'<radialGradient id="hgd{i}" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="{p["light"]}"/><stop offset=".5" stop-color="{p["base"]}"/><stop offset="1" stop-color="{p["shade"]}"/></radialGradient>'
    # tail
    g += f'<g class="tail"><path d="M95 205 C 215 210 238 92 182 38" fill="none" stroke="{p["shade"]}" stroke-width="34" stroke-linecap="round" filter="url(#fuzz2)"/>'
    g += f'<path d="M95 205 C 215 210 238 92 182 38" fill="none" stroke="{p["base"]}" stroke-width="27" stroke-linecap="round" filter="url(#fuzz2)"/>'
    g += f'<path d="M95 205 C 215 210 238 92 182 38" fill="none" stroke="{p["dark"]}" stroke-width="29" stroke-dasharray="14 34" opacity=".8" filter="url(#fuzz2)"/></g>'
    # body
    g += f'<g filter="url(#fuzz)"><ellipse cx="0" cy="95" rx="112" ry="135" fill="url(#bgd{i})"/></g>'
    g += fur_block(0, 95, 108, 130, p, seed, 1.0, (10, 24), 'down')
    # body stripes
    g += f'<clipPath id="fb{i}"><ellipse cx="0" cy="95" rx="106" ry="128"/></clipPath><g clip-path="url(#fb{i})">'
    for sg in (-1, 1):
        for k in range(5):
            yy = 10 + k * 46
            g += f'<path d="M{sg*125} {yy} Q{sg*85} {yy+22} {sg*58} {yy+4}" fill="none" stroke="{p["dark"]}" stroke-width="12" stroke-linecap="round" opacity=".72" filter="url(#fuzz2)"/>'
    g += '</g>'
    # chest white
    g += f'<g filter="url(#fuzz2)"><ellipse cx="0" cy="130" rx="54" ry="92" fill="{p["white"]}"/></g>'
    g += L(p['light'], 1.6, .55, fur_path(0, 130, 52, 88, 150, seed+9, (10, 20), 'down'))
    g += L(p['shade'], 1.2, .22, fur_path(0, 130, 52, 88, 80, seed+10, (8, 16), 'down'))
    # front legs
    for sg in (-1, 1):
        lx = sg * 46
        g += f'<g filter="url(#fuzz2)"><rect x="{lx-23}" y="120" width="46" height="100" rx="22" fill="{p["base"]}"/><ellipse cx="{lx}" cy="212" rx="30" ry="17" fill="{p["white"]}"/></g>'
        g += L(p['dark'], 2, .5, fur_path(lx, 160, 20, 50, 40, seed+20+sg, (8, 16), 'down'))
        g += L(p['white'], 1.5, .5, fur_path(lx, 210, 26, 12, 30, seed+30+sg, (5, 10), 'down'))
        for tx in (-10, 0, 10):
            g += f'<path d="M{lx+tx} 218 L{lx+tx} 228" stroke="{p["shade"]}" stroke-width="2" opacity=".6" stroke-linecap="round"/>'
    # ears
    for sg in (-1, 1):
        g += f'<g filter="url(#fuzz2)"><path d="M{sg*92} -96 Q{sg*100} -190 {sg*86} -232 Q{sg*40} -200 {sg*14} -146 Z" fill="url(#hgd{i})"/></g>'
        g += L(p['mid'], 2, .6, fur_path(sg*60, -170, 22, 42, 40, seed+40+sg, (8, 15), 'out', anchor=(sg*40, -110)))
        g += f'<path d="M{sg*76} -118 Q{sg*80} -184 {sg*72} -208 Q{sg*44} -186 {sg*28} -146 Z" fill="{p["pink"]}" opacity=".85"/>'
        g += L(p['white'], 2.2, .75, fur_path(sg*58, -168, 14, 34, 22, seed+50+sg, (10, 20), 'out', anchor=(sg*50, -120)))
        g += f'<path d="M{sg*92} -96 Q{sg*100} -190 {sg*86} -232" fill="none" stroke="{p["dark"]}" stroke-width="5" opacity=".6" filter="url(#fuzz2)"/>'
    # head
    g += f'<g filter="url(#fuzz)"><ellipse cx="0" cy="-62" rx="104" ry="90" fill="url(#hgd{i})"/></g>'
    g += fur_block(0, -62, 100, 86, p, seed+60, 1.0, (8, 18), 'out', anchor=(0, -35))
    # forehead M + cheek stripes
    for dx, a in ((-24, -6), (0, 0), (24, 6)):
        g += f'<path d="M{dx} -146 Q{dx+a*.5} -132 {dx+a*.8} -118" fill="none" stroke="{p["dark"]}" stroke-width="8" stroke-linecap="round" opacity=".78" filter="url(#fuzz2)"/>'
    for sg in (-1, 1):
        for k in range(3):
            g += f'<path d="M{sg*100} {-70+k*20} Q{sg*84} {-62+k*20} {sg*66} {-62+k*20}" fill="none" stroke="{p["dark"]}" stroke-width="7" stroke-linecap="round" opacity=".7" filter="url(#fuzz2)"/>'
    # muzzle
    g += f'<g filter="url(#fuzz2)"><ellipse cx="-20" cy="-22" rx="30" ry="25" fill="{p["white"]}"/><ellipse cx="20" cy="-22" rx="30" ry="25" fill="{p["white"]}"/><ellipse cx="0" cy="-8" rx="26" ry="20" fill="{p["white"]}"/></g>'
    g += L(p['light'], 1.4, .5, fur_path(0, -22, 46, 28, 90, seed+70, (7, 13), 'out', anchor=(0, -40)))
    # nose
    g += f'<path d="M-13 -48 Q0 -54 13 -48 Q10 -34 0 -30 Q-10 -34 -13 -48Z" fill="{p["pink"]}"/><path d="M-9 -47 Q0 -51 6 -47" fill="none" stroke="#fff" stroke-width="2.4" opacity=".5" stroke-linecap="round"/>'
    g += f'<path d="M0 -30 L0 -18 M0 -18 Q-9 -8 -22 -13 M0 -18 Q9 -8 22 -13" fill="none" stroke="{p["dark"]}" stroke-width="3" stroke-linecap="round" opacity=".85"/>'
    r = random.Random(seed)
    for sg in (-1, 1):
        for rr in range(3):
            for cc in range(3):
                g += f'<circle cx="{sg*(22+cc*10)}" cy="{-24+rr*8}" r="1.5" fill="{p["dark"]}" opacity=".55"/>'
    # eyes
    g += eye(-42, -74, p, glow, pupil) + eye(42, -74, p, glow, pupil)
    g += whiskers(p, dark)
    g += '</g></g>'
    return g

def side_cat(x, y, s=1, flip=False, pal=NORMAL, seed=21, cid='', pupil=7):
    p = pal; i = uid()
    sx = -s if flip else s
    g = f'<g id="{cid}"><g transform="translate({x},{y}) scale({sx},{s})">'
    g += f'<radialGradient id="sb{i}" cx="50%" cy="25%" r="85%"><stop offset="0" stop-color="{p["light"]}"/><stop offset=".5" stop-color="{p["base"]}"/><stop offset="1" stop-color="{p["shade"]}"/></radialGradient>'
    # tail
    tp = "M-140 -125 C -235 -130 -248 -238 -192 -290"
    g += f'<g class="tail" data-px="-140" data-py="-125"><path d="{tp}" fill="none" stroke="{p["shade"]}" stroke-width="30" stroke-linecap="round" filter="url(#fuzz2)"/><path d="{tp}" fill="none" stroke="{p["base"]}" stroke-width="23" stroke-linecap="round" filter="url(#fuzz2)"/><path d="{tp}" fill="none" stroke="{p["dark"]}" stroke-width="25" stroke-dasharray="12 30" opacity=".8" filter="url(#fuzz2)"/></g>'
    def leg(lx, name, far=False):
        col = p['mid'] if far else p['base']
        out = f'<g class="leg" data-name="{name}" data-px="{lx+16}" data-py="-88">'
        out += f'<g filter="url(#fuzz2)"><rect x="{lx}" y="-92" width="32" height="92" rx="15" fill="{col}"/><ellipse cx="{lx+16}" cy="-2" rx="24" ry="11" fill="{p["white"]}"/></g>'
        out += L(p['dark'], 2, .5, fur_path(lx+16, -48, 12, 40, 30, seed+hash(name)%50, (7, 14), 'down'))
        out += L(p['white'], 1.5, .55, fur_path(lx+16, -4, 20, 8, 22, seed+7+hash(name)%50, (5, 9), 'down'))
        return out + '</g>'
    g += leg(-104, 'bf', True) + leg(86, 'ff', True)
    g += f'<g filter="url(#fuzz)"><ellipse cx="0" cy="-112" rx="154" ry="66" fill="url(#sb{i})"/></g>'
    g += f'<clipPath id="bc{i}"><ellipse cx="0" cy="-112" rx="150" ry="62"/></clipPath>'
    g += fur_block(0, -112, 150, 62, p, seed, 1.1, (10, 22), 'dir', vec=(-0.9, 0.45))
    g += f'<g clip-path="url(#bc{i})">'
    for k in range(7):
        xx = -110 + k * 36
        g += f'<path d="M{xx} -178 Q{xx+16} -130 {xx-6} -52" fill="none" stroke="{p["dark"]}" stroke-width="11" stroke-linecap="round" opacity=".72" filter="url(#fuzz2)"/>'
    g += '</g>'
    g += f'<g filter="url(#fuzz2)"><ellipse cx="112" cy="-100" rx="36" ry="46" fill="{p["white"]}"/></g>'
    g += L(p['light'], 1.6, .55, fur_path(112, -100, 34, 44, 90, seed+3, (8, 14), 'down'))
    g += f'<g filter="url(#fuzz2)"><ellipse cx="-112" cy="-92" rx="50" ry="56" fill="{p["base"]}"/><ellipse cx="108" cy="-92" rx="38" ry="50" fill="{p["base"]}"/></g>'
    g += L(p['dark'], 2, .45, fur_path(-112, -92, 46, 52, 70, seed+60, (8, 16), 'down'))
    g += leg(-132, 'bn') + leg(112, 'fn')
    # head
    for ex, ey2, ex2, ey3 in ((128, -192, 132, -262), (170, -204, 200, -262)):
        pass
    g += f'<g filter="url(#fuzz2)"><path d="M124 -190 Q126 -240 132 -266 Q160 -236 170 -202 Z" fill="{p["base"]}"/><path d="M166 -206 Q184 -244 204 -262 Q212 -222 206 -184 Z" fill="{p["mid"]}"/></g>'
    g += f'<path d="M134 -206 Q136 -234 138 -248 Q154 -230 160 -208 Z" fill="{p["pink"]}" opacity=".8"/>'
    g += f'<g filter="url(#fuzz)"><ellipse cx="166" cy="-146" rx="60" ry="54" fill="url(#sb{i})"/></g>'
    g += fur_block(166, -146, 56, 50, p, seed+5, 1.0, (8, 15), 'out', anchor=(150, -140))
    for k in range(3):
        g += f'<path d="M{128+k*14} -190 Q{136+k*14} -176 {134+k*14} -162" fill="none" stroke="{p["dark"]}" stroke-width="6" stroke-linecap="round" opacity=".75" filter="url(#fuzz2)"/>'
        g += f'<path d="M{128+k*8} {-134+k*12} Q{146+k*6} {-126+k*12} {160+k*4} {-128+k*12}" fill="none" stroke="{p["dark"]}" stroke-width="6" stroke-linecap="round" opacity=".65" filter="url(#fuzz2)"/>'
    g += f'<g filter="url(#fuzz2)"><ellipse cx="204" cy="-132" rx="28" ry="22" fill="{p["white"]}"/></g>'
    g += f'<path d="M220 -146 Q226 -150 230 -144 Q228 -136 222 -136Z" fill="{p["pink"]}"/>'
    g += f'<path d="M224 -136 L222 -124 Q214 -116 206 -122" fill="none" stroke="{p["dark"]}" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>'
    g += eye(178, -158, p, False, pupil, 20, 16)
    for dy, ang in ((-134, -26), (-128, -8), (-122, 12)):
        g += f'<path d="M218 {dy}Q258 {dy-6+ang*.3} 290 {dy+ang}" fill="none" stroke="#d9dce3" stroke-width="2" stroke-linecap="round" opacity=".8"/>'
    g += '</g></g>'
    return g
