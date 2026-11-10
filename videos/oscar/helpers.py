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

