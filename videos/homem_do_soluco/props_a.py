import math, random
from hu import *
from cats import fur_path, L

def wrap2(body, idx, extra='', total=10, vig=True, defs='', vig_op=None):
    d = DEFS.replace('</defs>', defs + '</defs>')
    v = f'<rect width="{W}" height="{H}" fill="url(#vig)"/>' if vig else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{d}{body}{v}{extra}{progress(idx, total)}</svg>'

def burst(cx, cy, r, text, fill='#ffd23f', stroke='#c1272d', rot=-8, fs=150, spikes=14, seed=1, tcol=None):
    rnd = random.Random(seed); pts = []
    for i in range(spikes*2):
        a = math.pi*i/spikes + rnd.uniform(-.05, .05)
        rr = r*(1 if i % 2 == 0 else .62)*rnd.uniform(.92, 1.06)
        pts.append(f'{cx+rr*math.cos(a):.0f},{cy+rr*math.sin(a):.0f}')
    p = ' '.join(pts)
    g = f'<g transform="rotate({rot} {cx} {cy})"><polygon points="{p}" fill="#000" opacity=".35" transform="translate(10 14)"/>'
    g += f'<polygon points="{p}" fill="{fill}" stroke="{stroke}" stroke-width="12" stroke-linejoin="round"/>'
    g += f'<text x="{cx}" y="{cy+fs*.34:.0f}" text-anchor="middle" font-family="{SANS}" font-weight="900" font-style="italic" font-size="{fs}" fill="{tcol or stroke}" stroke="#fff" stroke-width="10" paint-order="stroke" stroke-linejoin="round">{text}</text></g>'
    return g

# ------------------------------------------------------------------ farm props
FARM_DEFS = '''<linearGradient id="pig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c2b6"/><stop offset=".55" stop-color="#e8a196"/><stop offset="1" stop-color="#b9695f"/></linearGradient>
<linearGradient id="silo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7d8a96"/><stop offset=".45" stop-color="#b4bfc8"/><stop offset="1" stop-color="#5f6b78"/></linearGradient>
<linearGradient id="roofg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a3a30"/><stop offset="1" stop-color="#3e2220"/></linearGradient>
<linearGradient id="dirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b78c58"/><stop offset="1" stop-color="#5c4128"/></linearGradient>'''

def barn(x, y, s=1.0, seed=2):
    r = random.Random(seed)
    g = f'<g transform="translate({x},{y}) scale({s})">'
    g += '<polygon points="-34,-372 60,-474 172,-572 348,-572 460,-474 554,-372" fill="url(#roofg)"/>'
    def edge(pts, y):
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            if y1 <= y <= y0: return x0 + (x1-x0)*(y-y0)/(y1-y0)
        return pts[-1][0]
    L_ = [(-34, -372), (60, -474), (172, -572)]; R_ = [(554, -372), (460, -474), (348, -572)]
    for k in range(1, 10):
        yy = -372 - k*20
        g += f'<path d="M{edge(L_, yy):.0f} {yy} L{edge(R_, yy):.0f} {yy}" stroke="#2a1614" stroke-width="3" opacity=".5"/>'
    g += '<rect x="0" y="-380" width="520" height="380" fill="#a03427"/>'
    for i in range(0, 520, 26):
        g += f'<line x1="{i}" y1="-380" x2="{i}" y2="0" stroke="#6c1d16" stroke-width="2" opacity=".55"/>'
    for _ in range(26):
        xx = r.uniform(4, 516); yy = r.uniform(-380, -120)
        g += f'<path d="M{xx:.0f} {yy:.0f} l{r.uniform(-3,3):.0f} {r.uniform(40,150):.0f}" stroke="{r.choice(["#7d2218","#b9473a"])}" stroke-width="{r.choice([3,5,7])}" opacity=".28" stroke-linecap="round"/>'
    g += '<rect x="-8" y="-382" width="16" height="382" fill="#efe6d2"/><rect x="512" y="-382" width="16" height="382" fill="#efe6d2"/><rect x="-8" y="-390" width="536" height="14" fill="#efe6d2"/>'
    g += '<rect x="170" y="-300" width="180" height="300" fill="#8a2a20"/><rect x="170" y="-300" width="180" height="300" fill="none" stroke="#efe6d2" stroke-width="11"/>'
    g += '<line x1="170" y1="-300" x2="350" y2="0" stroke="#efe6d2" stroke-width="9"/><line x1="350" y1="-300" x2="170" y2="0" stroke="#efe6d2" stroke-width="9"/>'
    g += '<rect x="212" y="-478" width="96" height="112" fill="#241210"/><rect x="212" y="-478" width="96" height="112" fill="none" stroke="#efe6d2" stroke-width="9"/>'
    for _ in range(26):
        xx = r.uniform(216, 304); g += f'<path d="M{xx:.0f} -368 l{r.uniform(-12,12):.0f} {r.uniform(10,30):.0f}" stroke="#e0c070" stroke-width="3" stroke-linecap="round"/>'
    return g + '</g>'

def silo(x, y, s=1.0):
    g = f'<g transform="translate({x},{y}) scale({s})">'
    g += '<rect x="0" y="-640" width="120" height="640" fill="url(#silo)"/>'
    for k in range(10): g += f'<line x1="0" y1="{-600+k*60}" x2="120" y2="{-600+k*60}" stroke="#4a5560" stroke-width="3" opacity=".55"/>'
    g += '<path d="M-6 -640 Q60 -740 126 -640Z" fill="#6a7682"/><path d="M-6 -640 Q60 -740 126 -640" fill="none" stroke="#9aa6b2" stroke-width="3"/>'
    return g + '</g>'

def fence(x0, x1, y, s=1.0, seed=3):
    r = random.Random(seed); g = ''
    for yy in (y-120*s, y-70*s):
        g += f'<rect x="{x0}" y="{yy:.0f}" width="{x1-x0}" height="{16*s:.0f}" rx="4" fill="#7a5a3a"/><rect x="{x0}" y="{yy:.0f}" width="{x1-x0}" height="{5*s:.0f}" fill="#a98558" opacity=".6"/>'
    xx = x0
    while xx < x1:
        g += f'<rect x="{xx}" y="{y-150*s:.0f}" width="{22*s:.0f}" height="{150*s:.0f}" rx="5" fill="#6a4a2c"/><rect x="{xx}" y="{y-150*s:.0f}" width="{7*s:.0f}" height="{150*s:.0f}" fill="#9a7448" opacity=".6"/>'
        xx += 170*s
    return g

def ground(y0, y1, seed=4):
    r = random.Random(seed)
    g = f'<rect x="0" y="{y0}" width="{W}" height="{y1-y0}" fill="url(#dirt)"/>'
    st = ''.join(f'M{r.uniform(0,W):.0f} {r.uniform(y0+20,y1):.0f}l{r.uniform(-30,30):.0f} {r.uniform(-5,5):.0f}' for _ in range(420))
    g += f'<path d="{st}" stroke="#e0c27a" stroke-width="3" stroke-linecap="round" opacity=".5"/>'
    pb = ''.join(f'<ellipse cx="{r.uniform(0,W):.0f}" cy="{r.uniform(y0+30,y1):.0f}" rx="{r.uniform(6,18):.0f}" ry="{r.uniform(4,9):.0f}" fill="#6a4c2e" opacity=".5"/>' for _ in range(50))
    return g + pb

def dust(cx, cy, n=14, spread=260, seed=5, col='#ead3a6'):
    r = random.Random(seed); g = ''
    for _ in range(n):
        g += f'<ellipse cx="{cx+r.uniform(-spread,spread):.0f}" cy="{cy+r.uniform(-spread*.35,spread*.35):.0f}" rx="{r.uniform(50,110):.0f}" ry="{r.uniform(30,70):.0f}" fill="{col}" opacity="{r.uniform(.35,.65):.2f}" filter="url(#b20)"/>'
    return g

def hog(x, y, s=1.0, flip=False, seed=3, startled=False):
    sx = -s if flip else s
    r = random.Random(seed)
    g = f'<g transform="translate({x},{y}) scale({sx},{s})">'
    g += '<ellipse cx="0" cy="2" rx="290" ry="26" fill="#000" opacity=".32"/>'
    for lx in (-160, 118):
        g += f'<rect x="{lx}" y="-130" width="46" height="126" rx="18" fill="#c98780"/><path d="M{lx-3} -14 h52 v16 q-26 6 -52 0z" fill="#2e211b"/>'
    g += '<path d="M-250 -235 c-42 -22 -22 -62 -54 -52 c-32 10 -8 44 -30 32" fill="none" stroke="#cf847b" stroke-width="15" stroke-linecap="round"/>'
    g += '<g filter="url(#fuzz2)"><ellipse cx="0" cy="-205" rx="256" ry="146" fill="url(#pig)"/></g>'
    g += '<ellipse cx="-10" cy="-100" rx="210" ry="38" fill="#f9d0c6" opacity=".6" filter="url(#b8)"/>'
    for c, w, op, n in (('#fbdcd3', 1.8, .7, 520), ('#b8665c', 1.6, .55, 420), ('#f4b0a4', 1.8, .6, 380)):
        g += L(c, w, op, fur_path(0, -205, 244, 134, n, seed+int(w*10)+n, (7, 14), 'vec', vec=(-.9, .45)))
    for lx in (-205, 78):
        g += f'<rect x="{lx}" y="-136" width="52" height="136" rx="20" fill="#dc968c"/><path d="M{lx-3} -16 h58 v18 q-29 6 -58 0z" fill="#2e211b"/><path d="M{lx+8} -120 l0 90" stroke="#fbd0c6" stroke-width="5" opacity=".5" stroke-linecap="round"/>'
    g += '<g filter="url(#fuzz2)"><ellipse cx="262" cy="-196" rx="118" ry="100" fill="url(#pig)"/></g>'
    g += L('#fbdcd3', 1.6, .6, fur_path(262, -196, 108, 90, 200, seed+9, (6, 12), 'out', anchor=(240, -190)))
    g += '<ellipse cx="372" cy="-170" rx="62" ry="50" fill="#eaa097"/><ellipse cx="372" cy="-170" rx="62" ry="50" fill="none" stroke="#b8665c" stroke-width="5"/><ellipse cx="392" cy="-182" rx="9" ry="14" fill="#5a2a26"/><ellipse cx="380" cy="-150" rx="9" ry="13" fill="#5a2a26"/>'
    g += '<ellipse cx="354" cy="-190" rx="18" ry="10" fill="#fff" opacity=".35"/>'
    g += '<path d="M270 -128 Q340 -112 394 -132" fill="none" stroke="#7a3a34" stroke-width="5" stroke-linecap="round"/>'
    g += '<path d="M214 -282 C252 -318 318 -296 326 -232 C292 -250 246 -246 214 -282Z" fill="#d9857c"/><path d="M226 -280 C256 -300 300 -286 308 -250" fill="none" stroke="#b8665c" stroke-width="4" opacity=".7"/>'
    if startled:
        g += '<ellipse cx="322" cy="-216" rx="18" ry="20" fill="#fff"/><circle cx="326" cy="-216" r="9" fill="#111"/>'
    else:
        g += '<ellipse cx="322" cy="-214" rx="12" ry="12" fill="#fff"/><circle cx="324" cy="-214" r="7" fill="#111"/><circle cx="327" cy="-217" r="2.4" fill="#fff"/>'
    g += '<path d="M302 -234 Q322 -246 342 -232" fill="none" stroke="#6a3a34" stroke-width="4" stroke-linecap="round"/>'
    return g + '</g>'

def plat_scale(x, y, w=640, reading=350):
    g = f'<g transform="translate({x},{y})">'
    g += f'<rect x="-8" y="-88" width="{w+16}" height="22" rx="4" fill="#b08a58" stroke="#3a2412" stroke-width="5"/>'
    for k in range(1, 7): g += f'<line x1="{k*w/7:.0f}" y1="-88" x2="{k*w/7:.0f}" y2="-66" stroke="#5a3a1c" stroke-width="3"/>'
    g += f'<rect x="20" y="-66" width="{w-40}" height="56" fill="url(#wood)" stroke="#2a1a10" stroke-width="5"/><rect x="20" y="-14" width="{w-40}" height="14" fill="#2e2e32"/>'
    for k in range(5): g += f'<rect x="{50+k*(w-100)/4:.0f}" y="-60" width="20" height="44" fill="#2e2e32" opacity=".6"/>'
    px = w + 40
    g += f'<rect x="{px-14}" y="-560" width="28" height="560" fill="#3a3a40"/><rect x="{px-14}" y="-560" width="9" height="560" fill="#7a7a84" opacity=".6"/>'
    g += f'<rect x="{px-26}" y="-36" width="52" height="36" rx="6" fill="#2a2a30"/>'
    g += f'<circle cx="{px}" cy="-560" r="92" fill="#b8902e" stroke="#5a4210" stroke-width="8"/><circle cx="{px}" cy="-560" r="78" fill="#f4efe0" stroke="#2a2a2a" stroke-width="3"/>'
    for k in range(0, 41):
        a = math.radians(-225 + k*6.75); r1 = 78 if k % 5 == 0 else 84
        g += f'<line x1="{px+r1*math.cos(a)*0.84:.1f}" y1="{-560+r1*math.sin(a)*0.84:.1f}" x2="{px+78*math.cos(a):.1f}" y2="{-560+78*math.sin(a):.1f}" stroke="#222" stroke-width="{3 if k%5==0 else 1.5}"/>'
    ang = -225 + 33*6.75
    g += f'<g class="needle" data-cx="{px}" data-cy="-560" transform="rotate({ang} {px} -560)"><line x1="{px}" y1="-560" x2="{px+64}" y2="-560" stroke="#c1272d" stroke-width="5" stroke-linecap="round"/></g>'
    g += f'<circle cx="{px}" cy="-560" r="7" fill="#222"/><text x="{px}" y="-530" text-anchor="middle" font-family="{SERIF}" font-weight="700" font-size="22" fill="#2a2a2a">{reading} lb</text>'
    g += f'<path d="M{w-20} -40 L{px-14} -520" stroke="#2e2e32" stroke-width="6" opacity=".6"/>'
    return g + '</g>'

def ik2(sx, sy, tx, ty, l1, l2, bend=1):
    dx, dy = tx-sx, ty-sy; d = math.hypot(dx, dy); d = max(1e-3, min(d, l1+l2-1e-3))
    a = (l1*l1 - l2*l2 + d*d)/(2*d); h = math.sqrt(max(l1*l1 - a*a, 0)); ux, uy = dx/math.hypot(dx, dy), dy/math.hypot(dx, dy)
    px, py = sx+ux*a, sy+uy*a
    return px - bend*uy*h, py + bend*ux*h, (sx+ux*d, sy+uy*d)

SKINY = '#d99a74'
PROFILE = ('M -80 -40 C -80 -110 -20 -140 40 -118 C 62 -108 70 -80 68 -62 C 70 -52 78 -48 80 -36 '
           'C 82 -20 96 4 102 16 C 100 24 90 26 78 28 C 80 36 82 42 78 48 C 82 54 80 60 76 64 '
           'C 78 74 76 88 66 98 C 50 112 20 118 -10 108 C -50 96 -80 60 -80 -40 Z')

def hat_profile(x, y, rot=0, s=1.0):
    g = f'<g transform="translate({x},{y}) rotate({rot}) scale({s})">'
    g += '<ellipse cx="6" cy="-4" rx="150" ry="26" fill="url(#straw)"/><path d="M-144 -2 Q6 30 156 -2 Q6 44 -144 -2Z" fill="#8a6a30" opacity=".5"/>'
    g += '<path d="M-78 -10 C-84 -88 -30 -114 24 -112 C80 -110 102 -82 98 -10 Q10 12 -78 -10Z" fill="url(#straw)"/>'
    g += '<path d="M-78 -24 Q10 0 98 -24 L98 -42 Q10 -18 -78 -42Z" fill="#5a3a24"/>'
    r = random.Random(8)
    st = ''.join(f'M{r.uniform(-140,140):.0f} {r.uniform(-14,12):.0f}l{r.uniform(-12,12):.0f} {r.uniform(-3,4):.0f}' for _ in range(90))
    g += f'<path d="{st}" stroke="#a8843e" stroke-width="2" stroke-linecap="round" opacity=".55"/><ellipse cx="-20" cy="-84" rx="42" ry="14" fill="#fff" opacity=".3" filter="url(#b8)"/>'
    return g + '</g>'

def head_profile(strain=True, hat=True, expr='grit'):
    g = '<path d="M -80 -40 C -86 -100 -30 -140 20 -126 L 0 -80 L -40 -20 Z" fill="#4a2f1c"/>'
    g += f'<ellipse cx="-14" cy="6" rx="17" ry="30" fill="{SKINY}"/><ellipse cx="-14" cy="6" rx="8" ry="18" fill="#b8704e" opacity=".6"/>'
    g += f'<path d="{PROFILE}" fill="url(#skinY)"/>'
    if strain: g += f'<path d="{PROFILE}" fill="#e0463a" opacity=".22"/><ellipse cx="34" cy="44" rx="30" ry="20" fill="#e0463a" opacity=".35" filter="url(#b8)"/>'
    r = random.Random(4)
    g += '<path d="' + ''.join(f'M{r.uniform(-20,70):.0f} {r.uniform(60,104):.0f}h1.6' for _ in range(90)) + '" stroke="#4a3022" stroke-width="2.2" stroke-linecap="round" opacity=".3"/>'
    g += '<path d="M 36 -32 Q 56 -52 80 -34 Q 58 -17 36 -32 Z" fill="#f7f1e8" stroke="#6a3a28" stroke-width="2"/>'
    g += '<circle cx="63" cy="-33" r="9.5" fill="#4d7894"/><circle cx="64" cy="-33" r="4.4" fill="#0b0b0e"/><circle cx="67" cy="-37" r="2.6" fill="#fff"/>'
    g += '<path d="M 34 -34 Q 56 -56 82 -34" fill="none" stroke="#3a2418" stroke-width="5" stroke-linecap="round"/>'
    g += '<path d="M 28 -62 L 86 -48" stroke="#3a2312" stroke-width="10" stroke-linecap="round"/>' if strain else '<path d="M 28 -56 Q 56 -66 84 -54" stroke="#3a2312" stroke-width="8" stroke-linecap="round" fill="none"/>'
    g += '<path d="M 90 8 Q 100 18 80 28" fill="none" stroke="#9a5a42" stroke-width="4" opacity=".55"/>'
    if expr == 'grit':
        g += '<path d="M 40 54 Q 62 46 84 52 L 82 66 Q 62 72 42 66 Z" fill="#f4efe6"/><path d="M 42 54 Q 62 46 84 52" fill="none" stroke="#7e342e" stroke-width="4"/><path d="M 42 66 Q 62 74 84 66" fill="none" stroke="#c0645a" stroke-width="6" stroke-linecap="round"/><path d="M 52 52 L 52 68 M 62 50 L 62 70 M 72 51 L 72 69" stroke="#9a948a" stroke-width="1.6" opacity=".7"/>'
    else:
        g += '<ellipse cx="72" cy="58" rx="12" ry="16" fill="#3f1613"/><ellipse cx="72" cy="58" rx="12" ry="16" fill="none" stroke="#c0645a" stroke-width="6"/>'
    g += '<path d="M -4 -70 L -60 -40" stroke="none"/>'
    return g

def farmer_profile(x, y, s, theta, legs, hands, head_rot=0, strain=True, hat=True, expr='grit', bend_far=-1, bend_near=-1, flip=False):
    th = math.radians(theta)
    def tor(lx, ly): return (math.cos(th)*lx - math.sin(th)*ly, -420 + math.sin(th)*lx + math.cos(th)*ly)
    sh = tor(6, -268)
    sx = -s if flip else s
    g = f'<g transform="translate({x},{y}) scale({sx},{s})">'
    g += '<ellipse cx="10" cy="4" rx="200" ry="22" fill="#000" opacity=".33"/>'
    def leg(pts, dark=False):
        (hx, hy), (kx, ky), (ax, ay) = pts
        col = '#3a557f' if dark else '#4a6ca0'
        o = f'<line x1="{hx}" y1="{hy}" x2="{kx}" y2="{ky}" stroke="{col}" stroke-width="80" stroke-linecap="round"/><line x1="{kx}" y1="{ky}" x2="{ax}" y2="{ay}" stroke="{col}" stroke-width="64" stroke-linecap="round"/>'
        o += f'<line x1="{hx+10}" y1="{hy+20}" x2="{kx+8}" y2="{ky}" stroke="#86a8d8" stroke-width="3" stroke-dasharray="9 7" opacity=".6"/><line x1="{kx+6}" y1="{ky}" x2="{ax+6}" y2="{ay-10}" stroke="#86a8d8" stroke-width="3" stroke-dasharray="9 7" opacity=".6"/>'
        o += f'<line x1="{kx}" y1="{ky}" x2="{ax}" y2="{ay}" stroke="#000" stroke-width="64" stroke-linecap="round" opacity="{.18 if dark else 0}"/>'
        o += f'<path d="M{ax-32} {ay-30} L{ax+30} {ay-30} L{ax+36} {ay+8} L{ax+98} {ay+20} Q{ax+116} {ay+28} {ax+110} {ay+44} L{ax-40} {ay+44} Z" fill="{"#38220f" if dark else "#4a2e1c"}"/><path d="M{ax-40} {ay+36} L{ax+112} {ay+36}" stroke="#1c120a" stroke-width="10" stroke-linecap="round"/><path d="M{ax-22} {ay-24} L{ax+24} {ay-24}" stroke="#7a5030" stroke-width="5" opacity=".7"/>'
        return o
    g += leg(legs[0], True) + leg(legs[1], False)
    # far arm
    ex, ey, hp = ik2(sh[0]+8, sh[1]-4, hands[1][0], hands[1][1], 170, 165, bend_far)
    def arm(shx, shy, ex, ey, hp, dark):
        o = f'<line x1="{shx}" y1="{shy}" x2="{ex}" y2="{ey}" stroke="url(#plaid)" stroke-width="44" stroke-linecap="round"/><line x1="{ex}" y1="{ey}" x2="{hp[0]}" y2="{hp[1]}" stroke="{SKINY}" stroke-width="32" stroke-linecap="round"/>'
        o += f'<circle cx="{ex}" cy="{ey}" r="26" fill="url(#plaid)"/><line x1="{ex}" y1="{ey}" x2="{ex+(hp[0]-ex)*.28:.0f}" y2="{ey+(hp[1]-ey)*.28:.0f}" stroke="#7a1f1c" stroke-width="40" stroke-linecap="round"/>'
        o += f'<circle cx="{hp[0]}" cy="{hp[1]}" r="27" fill="{SKINY}"/><path d="M{hp[0]-10} {hp[1]-12} l22 6 M{hp[0]-12} {hp[1]-2} l24 4 M{hp[0]-10} {hp[1]+9} l22 2" stroke="#a8683f" stroke-width="3" stroke-linecap="round" opacity=".7"/>'
        if dark: o += f'<line x1="{shx}" y1="{shy}" x2="{ex}" y2="{ey}" stroke="#000" stroke-width="44" stroke-linecap="round" opacity=".22"/><line x1="{ex}" y1="{ey}" x2="{hp[0]}" y2="{hp[1]}" stroke="#000" stroke-width="32" stroke-linecap="round" opacity=".22"/>'
        return o
    g += arm(sh[0]+8, sh[1]-4, ex, ey, hp, True)
    # torso
    g += f'<g transform="translate(0,-420) rotate({theta})">'
    g += '<path d="M -60 10 C -68 -80 -64 -190 -44 -258 Q -28 -292 18 -292 Q 66 -288 76 -224 C 86 -150 74 -60 60 10 Z" fill="url(#plaid)"/>'
    g += '<path d="M -60 10 C -64 -50 -62 -100 -56 -140 L 74 -140 C 76 -90 72 -40 60 10 Z" fill="#4a6ca0"/><path d="M 14 -140 L 20 -236 Q 46 -246 72 -232 L 74 -140 Z" fill="#587db0"/>'
    g += '<path d="M 30 -240 Q -10 -296 -42 -268" fill="none" stroke="#3a557f" stroke-width="18" stroke-linecap="round"/><circle cx="48" cy="-230" r="9" fill="#d6b04a" stroke="#6a5014" stroke-width="2"/><rect x="30" y="-206" width="38" height="34" rx="4" fill="none" stroke="#2f4a73" stroke-width="3"/>'
    g += f'<path d="M -2 -286 L 30 -286 L 32 -318 L 0 -320 Z" fill="{SKINY}"/>'
    g += '</g>'
    hx, hy = tor(14, -385)
    g += f'<g transform="translate({hx:.0f},{hy:.0f}) rotate({theta*.55+head_rot}) scale(.74)">{head_profile(strain, hat, expr)}'
    if hat:
        g += '<g transform="translate(0,-118)">' + hat_profile(0, 0, 0, 1.0)[hat_profile(0, 0, 0, 1.0).index('>')+1:-4] + '</g>'
    g += '</g>'
    # near arm
    ex2, ey2, hp2 = ik2(sh[0]+8, sh[1]-4, hands[0][0], hands[0][1], 170, 165, bend_near)
    g += arm(sh[0]+8, sh[1]-4, ex2, ey2, hp2, False)
    return g + '</g>'
