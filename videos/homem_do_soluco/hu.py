import math, random
from cats import fur_path, L, FUZZ

_u = [100]
def uid():
    _u[0] += 1
    return _u[0]

W, H = 1080, 1920
SANS = "DejaVu Sans, sans-serif"
SERIF = "DejaVu Serif, serif"

DEFS = f'''<defs>
<filter id="b3" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="b8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="b20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>
<filter id="b50" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="50"/></filter>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix type="matrix" values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .4  0 0 0 .55 0"/></filter>
<radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".7"/></radialGradient>
<radialGradient id="skin" cx="42%" cy="32%" r="85%"><stop offset="0" stop-color="#f6d6ba"/><stop offset=".55" stop-color="#e6b08c"/><stop offset="1" stop-color="#b57452"/></radialGradient>
<radialGradient id="skinY" cx="42%" cy="32%" r="85%"><stop offset="0" stop-color="#f0c29e"/><stop offset=".55" stop-color="#d99a74"/><stop offset="1" stop-color="#a8683f"/></radialGradient>
<linearGradient id="straw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0d99a"/><stop offset="1" stop-color="#c29a52"/></linearGradient>
<linearGradient id="denim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3f5f8a"/><stop offset=".5" stop-color="#4f73a3"/><stop offset="1" stop-color="#34507a"/></linearGradient>
<linearGradient id="mustard" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d1a23a"/><stop offset="1" stop-color="#9c7425"/></linearGradient>
<linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a34"/><stop offset="1" stop-color="#5a3a20"/></linearGradient>
<pattern id="plaid" width="44" height="44" patternUnits="userSpaceOnUse"><rect width="44" height="44" fill="#a8302a"/><rect x="0" y="0" width="44" height="10" fill="#7a1f1c" opacity=".7"/><rect x="0" y="0" width="10" height="44" fill="#7a1f1c" opacity=".7"/><rect x="22" y="0" width="3" height="44" fill="#e8d9b8" opacity=".5"/><rect x="0" y="22" width="44" height="3" fill="#e8d9b8" opacity=".5"/></pattern>
<pattern id="knit" width="16" height="14" patternUnits="userSpaceOnUse"><path d="M0 0 L8 10 L16 0" fill="none" stroke="rgba(0,0,0,.2)" stroke-width="2"/></pattern>
{FUZZ}</defs>'''

def grain(op=.35):
    return f'<rect width="{W}" height="{H}" filter="url(#grain)" opacity="{op}" style="mix-blend-mode:multiply"/>'

def progress(idx, total=10):
    g = ''; w = (980 - (total-1)*8) / total
    for k in range(total):
        x = 50 + k*(w+8); on = k < idx
        g += f'<rect x="{x:.1f}" y="64" width="{w:.1f}" height="9" rx="4.5" fill="{"#ffc931" if on else "#fff"}" opacity="{1 if on else .25}"/>'
    return g

def wrap(body, idx, extra='', total=10, vig=True):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{DEFS}{body}'
            f'{"<rect width=%d height=%d fill=url(#vig) />" % (W, H) if vig else ""}{extra}{progress(idx, total)}</svg>').replace('<rect width=1080 height=1920 fill=url(#vig) />', f'<rect width="{W}" height="{H}" fill="url(#vig)"/>')

# ---------------------------------------------------------------- face
def brow(side, dy, tilt, old, seed):
    """bushy eyebrow; side=-1 left, +1 right"""
    cx = side * 58; cy = -90 + dy
    base = '#d8d3cc' if old else '#4a2f1c'
    g = f'<path d="M{cx-side*36} {cy+4+tilt*side*-1} Q{cx} {cy-10} {cx+side*38} {cy+6-tilt*side*-1}" fill="none" stroke="{base}" stroke-width="17" stroke-linecap="round" opacity=".9"/>'
    vec = (side * .8, -.55)
    cols = (('#f4f2ee', 2.4), ('#bdb8b0', 2.2), ('#8c867e', 1.8)) if old else (('#6a4426', 2.4), ('#3a2312', 2.2), ('#8a5a34', 1.8))
    for k, (c, w) in enumerate(cols):
        g += L(c, w+.6, .9, fur_path(cx, cy, 38, 9, 62, seed+k, (12, 24), 'vec', vec=vec, jit=.5))
    return g

def eye(ex, side, expr, old, glasses_tint=False):
    ey = -38
    if expr == 'squeeze':
        g = f'<path d="M{ex-31} {ey-2} Q{ex} {ey+17} {ex+31} {ey-2}" fill="none" stroke="#35200f" stroke-width="5.5" stroke-linecap="round"/>'
        for dx, dy in ((26, -10), (31, 0), (28, 9)):
            g += f'<path d="M{ex+side*dx} {ey+dy} l{side*14} {dy*.9}" stroke="#a5654a" stroke-width="3" stroke-linecap="round" opacity=".7"/>'
        g += f'<path d="M{ex-26} {ey+14} Q{ex} {ey+30} {ex+26} {ey+14}" fill="none" stroke="#b0705a" stroke-width="3" opacity=".45"/>'
        return g
    h, w = (20, 32) if expr != 'wide' else (28, 35)
    i = uid()
    path = f'M{ex-w} {ey+3}Q{ex} {ey-h-6} {ex+w} {ey+3}Q{ex} {ey+h-3} {ex-w} {ey+3}Z'
    iris_off = -side * 3
    g = f'<clipPath id="ec{i}"><path d="{path}"/></clipPath>'
    g += f'<radialGradient id="ir{i}" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#8fb4ca"/><stop offset=".6" stop-color="#4d7894"/><stop offset="1" stop-color="#27465c"/></radialGradient>'
    g += f'<path d="{path}" fill="#f7f1e8" stroke="#7a5040" stroke-width="2"/>'
    g += f'<g clip-path="url(#ec{i})"><circle cx="{ex+iris_off}" cy="{ey+1}" r="{14 if expr!="wide" else 15}" fill="url(#ir{i})"/><circle cx="{ex+iris_off}" cy="{ey+1}" r="6.2" fill="#0b0b0e"/>'
    g += f'<circle cx="{ex+iris_off+5}" cy="{ey-5}" r="3.8" fill="#fff" opacity=".95"/><circle cx="{ex+iris_off-5}" cy="{ey+6}" r="1.8" fill="#fff" opacity=".6"/>'
    g += f'<path d="M{ex-w-2} {ey-h-8} L{ex+w+2} {ey-h-8} L{ex+w+2} {ey-2} Q{ex} {ey-h+4} {ex-w-2} {ey-2}Z" fill="#6a3a28" opacity=".28"/></g>'
    g += f'<path d="M{ex-w-2} {ey+4} Q{ex} {ey-h-8} {ex+w+2} {ey+4}" fill="none" stroke="#3a2418" stroke-width="4.5" stroke-linecap="round"/>'
    g += f'<path d="M{ex-w+2} {ey-6} Q{ex} {ey-h-18} {ex+w-2} {ey-6}" fill="none" stroke="#9a6a50" stroke-width="2.6" opacity=".6"/>'
    g += f'<path d="M{ex-w+4} {ey+9} Q{ex} {ey+h+2} {ex+w-4} {ey+9}" fill="none" stroke="#b57d62" stroke-width="2" opacity=".5"/>'
    if old:
        g += f'<path d="M{ex-30} {ey+22} Q{ex} {ey+42} {ex+30} {ey+22}" fill="none" stroke="#a8644e" stroke-width="3.5" opacity=".38"/>'
        for dy in (-8, 2, 12):
            g += f'<path d="M{ex+side*(w+3)} {ey+dy} l{side*15} {dy*.8}" stroke="#a5654a" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>'
    return g

def mouth(expr, old):
    lip, lipd = '#c0645a', '#7e342e'
    if expr == 'o':
        return (f'<ellipse cx="0" cy="110" rx="22" ry="28" fill="#3f1613"/><ellipse cx="0" cy="124" rx="13" ry="9" fill="#a8483f"/>'
                f'<ellipse cx="0" cy="110" rx="22" ry="28" fill="none" stroke="{lip}" stroke-width="11"/><ellipse cx="0" cy="110" rx="27" ry="33" fill="none" stroke="{lipd}" stroke-width="2" opacity=".5"/>')
    if expr == 'smile':
        return (f'<path d="M-50 96 Q0 134 50 96 Q0 112 -50 96Z" fill="#3f1613"/><path d="M-44 99 Q0 118 44 99 L40 106 Q0 122 -40 106Z" fill="#f4efe6"/>'
                f'<path d="M-54 94 Q0 140 54 94" fill="none" stroke="{lip}" stroke-width="9" stroke-linecap="round"/><path d="M-52 92 Q-60 88 -62 84 M52 92 Q60 88 62 84" stroke="{lipd}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>')
    if expr == 'grit':
        return (f'<path d="M-46 100 Q0 92 46 100 L42 118 Q0 126 -42 118Z" fill="#f4efe6"/><path d="M-46 100 Q0 92 46 100" stroke="{lipd}" stroke-width="4" fill="none"/>'
                f'<path d="M-46 100 Q0 126 46 100" stroke="{lip}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M-30 106 L30 106 M-15 100 L-15 118 M0 100 L0 118 M15 100 L15 118" stroke="#9a948a" stroke-width="1.6" opacity=".7"/>')
    return (f'<path d="M-46 100 Q-22 92 0 98 Q22 92 46 100 Q22 120 0 122 Q-22 120 -46 100Z" fill="{lip}"/>'
            f'<path d="M-46 100 Q0 112 46 100" stroke="{lipd}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-20 108 Q0 114 20 108" stroke="#fff" stroke-width="2.4" fill="none" opacity=".25"/>')

def face(cx, cy, s=1.0, age='old', expr='closed', eyes=None, mouth_expr=None, glasses=True, hat=False, tilt=0, bust=True, seed=7, shirt='mustard'):
    old = age == 'old'
    e = eyes or ('wide' if expr == 'wide' else 'squeeze' if expr == 'squeeze' else 'open')
    m = mouth_expr or ('o' if expr in ('wide', 'squeeze') else 'smile' if expr == 'smile' else 'closed')
    bdy = -14 if expr in ('wide', 'squeeze') else (4 if expr == 'smile' else 0)
    skin = 'url(#skin)' if old else 'url(#skinY)'
    g = f'<g transform="translate({cx},{cy}) rotate({tilt}) scale({s})">'
    if bust:
        # neck and shoulders
        g += f'<path d="M-72 100 L-80 240 L80 240 L72 100Z" fill="{skin}"/><path d="M-76 190 Q0 235 76 190 L80 250 L-80 250Z" fill="#7a4a34" opacity=".5"/>'
        if old and shirt == 'mustard':
            g += ('<path d="M-92 168 C-170 196 -285 214 -336 312 L-356 470 L356 470 L336 312 C285 214 170 196 92 168 Z" fill="url(#mustard)"/>'
                  '<path d="M-92 168 C-170 196 -285 214 -336 312 L-356 470 L356 470 L336 312 C285 214 170 196 92 168 Z" fill="url(#knit)"/>'
                  '<path d="M-70 160 L0 290 L70 160 L50 150 L0 214 L-50 150Z" fill="#cfe3ee"/><path d="M-70 160 L-34 150 L0 214 L-30 260Z M70 160 L34 150 L0 214 L30 260Z" fill="#e9f2f7"/>'
                  '<path d="M0 214 L0 470" stroke="#6a4a18" stroke-width="5"/>'
                  + ''.join(f'<circle cx="0" cy="{300+k*70}" r="13" fill="#5a3a14"/><circle cx="-3" cy="{297+k*70}" r="4" fill="#a8803a"/>' for k in range(3)) +
                  '<path d="M-92 168 C-170 196 -285 214 -336 312" fill="none" stroke="#fff" stroke-width="4" opacity=".18"/>')
        elif shirt == 'pajama':
            g += ('<path d="M-92 168 C-170 196 -285 214 -336 312 L-356 470 L356 470 L336 312 C285 214 170 196 92 168 Z" fill="#a9bfdc"/>'
                  + ''.join(f'<path d="M{x} 150 L{x} 470" stroke="#ffffff" stroke-width="9" opacity=".55"/>' for x in range(-340, 360, 38)) +
                  '<path d="M-70 160 L0 250 L70 160 L50 150 L0 205 L-50 150Z" fill="#e9f0f8"/><path d="M0 205 L0 470" stroke="#6a86ad" stroke-width="4"/>'
                  + ''.join(f'<circle cx="0" cy="{260+k*66}" r="10" fill="#f6f6f2" stroke="#6a86ad" stroke-width="3"/>' for k in range(3)))
        elif shirt == 'suit':
            g += ('<path d="M-92 168 C-170 196 -285 214 -336 312 L-356 470 L356 470 L336 312 C285 214 170 196 92 168 Z" fill="#23283a"/>'
                  '<path d="M-70 160 L0 330 L70 160 L50 150 L0 214 L-50 150Z" fill="#f3f1ec"/>'
                  '<path d="M-70 160 L-120 400 L-40 470 L0 330Z M70 160 L120 400 L40 470 L0 330Z" fill="#1a1e2c"/>'
                  '<path d="M-22 210 L22 210 L14 232 L0 226 L-14 232Z M-12 232 L12 232 L22 420 L0 440 L-22 420Z" fill="#b3282d"/>'
                  '<path d="M-92 168 C-170 196 -285 214 -336 312" fill="none" stroke="#fff" stroke-width="3" opacity=".12"/>')
        else:
            g += ('<path d="M-92 168 C-170 196 -285 214 -336 312 L-356 470 L356 470 L336 312 C285 214 170 196 92 168 Z" fill="url(#plaid)"/>'
                  '<path d="M-70 160 L0 250 L70 160 L50 150 L0 205 L-50 150Z" fill="#7a1f1c"/>')
    # ears
    for sd in (-1, 1):
        g += f'<ellipse cx="{sd*144}" cy="-4" rx="22" ry="40" fill="{skin}"/><path d="M{sd*140} -26 Q{sd*158} -4 {sd*140} 24" fill="none" stroke="#9a5a42" stroke-width="5" opacity=".6"/><ellipse cx="{sd*144}" cy="-4" rx="9" ry="22" fill="#c27c5e" opacity=".55"/>'
    # head
    head = 'M-138 -30 C-140 -140 -82 -192 0 -192 C82 -192 140 -140 138 -30 C136 72 100 152 0 180 C-100 152 -136 72 -138 -30Z'
    g += f'<g filter="url(#fuzz2)"><path d="{head}" fill="{skin}"/></g>'
    g += f'<path d="{head}" fill="{skin}"/>'
    g += '<ellipse cx="-86" cy="52" rx="42" ry="30" fill="#e0786a" opacity=".32" filter="url(#b8)"/><ellipse cx="86" cy="52" rx="42" ry="30" fill="#e0786a" opacity=".32" filter="url(#b8)"/>'
    g += '<ellipse cx="-30" cy="-132" rx="70" ry="34" fill="#fff" opacity=".13" filter="url(#b8)"/>'
    g += '<path d="M-138 -20 C-136 80 -96 150 0 180" fill="none" stroke="#7a4430" stroke-width="12" opacity=".12" filter="url(#b3)"/>'
    if not old:
        r = random.Random(seed)
        pts = ''.join(f'M{r.uniform(-90,90):.0f} {r.uniform(95,165):.0f}h1.6' for _ in range(260))
        g += f'<path d="{pts}" stroke="#4a3022" stroke-width="2.2" stroke-linecap="round" opacity=".28"/>'
    # wrinkles
    if old:
        for k, yy in enumerate((-150, -132, -114)):
            g += f'<path d="M{-62+k*4} {yy} Q0 {yy-9-k} {62-k*4} {yy}" fill="none" stroke="#9a5f45" stroke-width="3" stroke-linecap="round" opacity="{.4-k*.05}"/>'
        for sd in (-1, 1):
            g += f'<path d="M{sd*44} 46 Q{sd*62} 70 {sd*58} 102" fill="none" stroke="#8c533d" stroke-width="4" stroke-linecap="round" opacity=".5"/>'
            g += f'<path d="M{sd*70} 112 Q{sd*60} 140 {sd*34} 156" fill="none" stroke="#8c533d" stroke-width="3" stroke-linecap="round" opacity=".35"/>'
        g += '<path d="M-18 150 Q0 158 18 150" fill="none" stroke="#8c533d" stroke-width="3" opacity=".4"/>'
    # eyes
    for sd in (-1, 1):
        g += eye(sd*56, sd, e, old)
    # nose
    g += ('<path d="M-14 -40 Q-24 0 -30 34" fill="none" stroke="#9a5a42" stroke-width="5" stroke-linecap="round" opacity=".38"/>'
          '<path d="M12 -30 Q20 4 26 34" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".14"/>'
          f'<ellipse cx="0" cy="42" rx="{34 if old else 30}" ry="25" fill="{"#e6a08a" if old else "#d99070"}"/><ellipse cx="-6" cy="34" rx="12" ry="8" fill="#fff" opacity=".22"/>'
          '<ellipse cx="-16" cy="52" rx="8" ry="5.5" fill="#6a2c24"/><ellipse cx="16" cy="52" rx="8" ry="5.5" fill="#6a2c24"/>'
          '<path d="M-34 44 Q-36 62 -16 64 M34 44 Q36 62 16 64" fill="none" stroke="#9a5a42" stroke-width="3.4" stroke-linecap="round" opacity=".5"/>')
    g += mouth(m, old)
    # brows
    g += brow(-1, bdy, 6 if expr in ('wide', 'squeeze') else 0, old, seed) + brow(1, bdy, 6 if expr in ('wide', 'squeeze') else 0, old, seed+9)
    # hair
    if old:
        for sd in (-1, 1):
            g += f'<g filter="url(#fuzz2)"><path d="M{sd*132} -96 C{sd*176} -86 {sd*174} 8 {sd*148} 40 C{sd*150} -4 {sd*146} -52 {sd*120} -112Z" fill="#ece9e4"/></g>'
            g += L('#ffffff', 2.2, .8, fur_path(sd*148, -30, 20, 60, 70, seed+30+sd, (8, 15), 'out', anchor=(sd*100, -30)))
            g += L('#b9b4ae', 1.8, .7, fur_path(sd*146, -30, 18, 56, 50, seed+34+sd, (7, 13), 'out', anchor=(sd*100, -30)))
        g += '<ellipse cx="-22" cy="-168" rx="64" ry="20" fill="#fff" opacity=".35" filter="url(#b8)"/>'
        for k in range(9):
            y0 = -186 + k*2.5
            g += f'<path d="M{-112+k*3} {-110-k*3} Q{-30+k*2} {y0-16} {112-k*3} {-112-k*2}" fill="none" stroke="#f3f1ed" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>'
    else:
        for sd in (-1, 1):
            g += f'<g filter="url(#fuzz2)"><path d="M{sd*134} -100 C{sd*168} -88 {sd*166} 4 {sd*146} 30 C{sd*148} -10 {sd*142} -56 {sd*120} -112Z" fill="#4a2f1c"/></g>'
    if not old and not hat:
        g += '<g filter="url(#fuzz2)"><path d="M-140 -60 C-152 -196 -70 -226 0 -226 C70 -226 152 -196 140 -60 C112 -126 60 -166 0 -160 C-60 -166 -112 -126 -140 -60Z" fill="#4a2f1c"/></g>'
        g += L('#6a4426', 2, .7, fur_path(0, -170, 120, 50, 120, seed+50, (10, 20), 'out', anchor=(0, -60)))
    if glasses and old:
        g += '<g fill="rgba(200,230,250,.12)" stroke="#2c2018" stroke-width="5"><circle cx="-56" cy="-36" r="43"/><circle cx="56" cy="-36" r="43"/></g>'
        g += '<path d="M-14 -42 Q0 -58 14 -42" fill="none" stroke="#2c2018" stroke-width="5"/><path d="M-98 -42 L-148 -38 M98 -42 L148 -38" stroke="#2c2018" stroke-width="5" stroke-linecap="round"/>'
        g += '<path d="M-84 -58 Q-70 -70 -52 -66 M28 -58 Q42 -70 60 -66" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>'
    if hat:
        g += '<ellipse cx="0" cy="-92" rx="170" ry="36" fill="#000" opacity=".28" filter="url(#b8)"/>'
        g += '<ellipse cx="0" cy="-124" rx="240" ry="54" fill="url(#straw)"/>'
        g += '<path d="M-240 -124 Q0 -82 240 -124 Q0 -70 -240 -124Z" fill="#8a6a30" opacity=".5"/>'
        g += '<path d="M-124 -128 C-130 -236 -72 -276 0 -276 C72 -276 130 -236 124 -128 Q0 -100 -124 -128Z" fill="url(#straw)"/>'
        g += '<path d="M-124 -142 Q0 -114 124 -142 L122 -170 Q0 -142 -122 -170Z" fill="#5a3a24"/>'
        r = random.Random(3)
        st = ''.join(f'M{x:.0f} {y:.0f}l{r.uniform(-14,14):.0f} {r.uniform(-4,5):.0f}' for x, y in ((r.uniform(-225, 225), r.uniform(-148, -100)) for _ in range(150)))
        g += f'<path d="{st}" stroke="#a8843e" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>'
        g += '<ellipse cx="-40" cy="-228" rx="60" ry="22" fill="#fff" opacity=".28" filter="url(#b8)"/>'
    return g + '</g>'
