import json, math, random, re
from helpers import person, progress, SANS, SERIF, W, H
from cats import *

durs = json.load(open('durs.json'))
src = open('tts.py').read()
N = eval(re.search(r"N = (\[.*?\n\])", src, re.S).group(1))
LEAD = [1.3, .6, .6, .6, .6, .6, .6, .6]
TAIL = [.5, .8, .8, .8, .8, .8, .8, 1.8]
D = [LEAD[i] + durs[i] + TAIL[i] for i in range(8)]
START = [sum(D[:i]) for i in range(8)]
json.dump(dict(D=D, START=START, LEAD=LEAD, durs=durs), open('timeline.json', 'w'))

def tp(i, phrase):
    n = N[i-1]; k = n.index(phrase)
    return round(LEAD[i-1] + k / len(n) * durs[i-1], 2)

DEFS = f'''<defs>
<filter id="b20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>
<filter id="b8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="b50" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="50"/></filter>
<radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".8"/></radialGradient>
<linearGradient id="warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd48a"/><stop offset="1" stop-color="#7a4a1c"/></linearGradient>
{FUZZ}</defs>'''

def cap(lines, times, y0=1480, size=78, step=100, gold_last=True):
    g = ''
    for k, t in enumerate(lines):
        fill = "#ffc931" if (gold_last and k == len(lines)-1) else "#fff"
        g += (f'<text class="cap" display="none" data-t="{times[k]}" x="540" y="{y0+k*step}" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="{size}" fill="{fill}" stroke="#000" stroke-width="16" paint-order="stroke" stroke-linejoin="round" opacity="0">{t}</text>')
    return g

def lamp(gid, x=935, y=1000, op=.35):
    g = f'<ellipse id="{gid}" cx="{x}" cy="{y}" rx="340" ry="340" fill="#ffb347" opacity="{op}" filter="url(#b50)"/>'
    g += f'<rect x="{x-60}" y="{y+110}" width="120" height="150" rx="8" fill="#2a2018"/><rect x="{x-8}" y="{y+40}" width="16" height="75" fill="#3a2d22"/>'
    g += f'<polygon id="{gid}s" points="{x-70},{y+45} {x+70},{y+45} {x+42},{y-30} {x-42},{y-30}" fill="#ffd48a"/>'
    return g

def bed(patient=True, y=1150):
    g = f'<rect x="0" y="{y}" width="{W}" height="{H-y}" fill="#14141c"/>'
    g += f'<rect x="60" y="{y-310}" width="64" height="330" rx="14" fill="#4a3426"/><rect x="100" y="{y-95}" width="880" height="90" rx="18" fill="#d8d4c8"/>'
    g += f'<rect x="130" y="{y-5}" width="24" height="70" fill="#4a3426"/><rect x="930" y="{y-5}" width="24" height="70" fill="#4a3426"/>'
    if patient:
        g += f'<ellipse cx="230" cy="{y-112}" rx="105" ry="38" fill="#e9e6df"/><circle cx="232" cy="{y-150}" r="50" fill="#d8b9a0"/><path d="M182 {y-158} Q232 {y-215} 282 {y-158} Q250 {y-185} 182 {y-158}" fill="#d9dce2"/>'
        g += f'<g id="blanket"><path d="M290 {y-20} C 310 {y-135} 480 {y-165} 640 {y-130} C 820 {y-105} 940 {y-70} 985 {y-20} Z" fill="#5a6f8f"/><path d="M290 {y-20} C 310 {y-135} 480 {y-165} 640 {y-130}" fill="none" stroke="#7a90b0" stroke-width="5"/></g>'
    else:
        g += f'<ellipse cx="230" cy="{y-112}" rx="105" ry="38" fill="#cfcbbf"/><path d="M260 {y-20} C 300 {y-95} 520 {y-100} 700 {y-85} C 840 {y-75} 940 {y-60} 985 {y-20} Z" fill="#4a5a75"/>'
    return g

COMMON_JS = r'''
const P=__P__;
const D=P.D;
const cl=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const seg=(t,a,b)=>cl((t-a)/(b-a));
const E=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
const EO=x=>1-Math.pow(1-x,3);
const $=id=>document.getElementById(id);
const TR=(id,v)=>{const e=$(id); if(e) e.setAttribute('transform',v);};
const OP=(id,v)=>{const e=$(id); if(e) e.setAttribute('opacity',v);};
function blinkf(t,off){const ph=((t+off)%3.7+3.7)%3.7; return ph<.2? 1-.96*Math.sin(Math.PI*ph/.2):1;}
function eyes(t,open){document.querySelectorAll('.eye').forEach((e,k)=>{const cx=+e.dataset.cx,cy=+e.dataset.cy;const b=Math.max(.04,open*blinkf(t,k*0+1.1));e.setAttribute('transform',`translate(${cx} ${cy}) scale(1 ${b}) translate(${-cx} ${-cy})`);});}
function camset(s,cx,cy,dx,dy){TR('cam',`translate(${cx+dx} ${cy+dy}) scale(${s}) translate(${-cx} ${-cy})`);}
function common(t){
  document.querySelectorAll('.cap').forEach(e=>{const a=EO(seg(t,+e.dataset.t,+e.dataset.t+.35));e.setAttribute('opacity',a);const y=(1-a)*28;e.setAttribute('transform',`translate(0 ${y})`);});
  const f=Math.max(1-seg(t,0,P.fin), seg(t,D-P.fout,D));
  OP('fade',f);
}
function breathe(id,t,x,yb,amp,per){const b=1+amp*Math.sin(2*Math.PI*t/per);TR(id,`translate(${x} ${yb}) scale(1 ${b}) translate(${-x} ${-yb})`);}
'''

POS = {1: 1, 2: 2, 3: 3, 4: 4, 5: 6, 6: 9, 7: 11, 8: 12}
def progress12(idx, total=12):
    g = ''
    w = (980 - (total-1)*8) / total
    for k in range(total):
        x = 50 + k*(w+8)
        on = k < idx
        g += f'<rect x="{x:.1f}" y="64" width="{w:.1f}" height="9" rx="4.5" fill="{"#ffc931" if on else "#ffffff"}" opacity="{1 if on else .25}"/>'
    return g

def page_any(pos, dur, body, js, extra_defs='', fin=.4, fout=.4):
    P = dict(D=dur, fin=fin, fout=fout)
    svg = (f'<svg id="s" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{DEFS.replace("</defs>", extra_defs + "</defs>")}<g id="cam">{body}</g>'
           f'<rect width="{W}" height="{H}" fill="url(#vig)"/>{progress12(pos)}<rect id="fade" width="{W}" height="{H}" fill="#000" opacity="1"/></svg>')
    script = COMMON_JS.replace('__P__', json.dumps(P)) + js + '\nwindow.setT=function(t){common(t);scene(t);};setT(0);'
    return f'<!doctype html><html><body style="margin:0;background:#000;overflow:hidden">{svg}<script>{script}</script></body></html>'

def page(i, body, caption, js, extra=None):
    P = dict(D=D[i-1], fin=.4, fout=.4 if i < 8 else 1.4)
    if extra: P.update(extra)
    svg = (f'<svg id="s" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{DEFS}<g id="cam">{body}</g>'
           f'<rect width="{W}" height="{H}" fill="url(#vig)"/>{progress12(POS[i])}{caption}<rect id="fade" width="{W}" height="{H}" fill="#000" opacity="1"/></svg>')
    script = COMMON_JS.replace('__P__', json.dumps(P)) + js + '\nwindow.setT=function(t){common(t);scene(t);};setT(0);'
    return f'<!doctype html><html><body style="margin:0;background:#000;overflow:hidden">{svg}<script>{script}</script></body></html>'

pages = []

# ---------- 1
b = '<rect width="1080" height="1920" fill="#050507"/>'
b += '<g id="doorlight"><polygon points="240,1350 840,1350 1080,1920 0,1920" fill="#ffb347" opacity=".2"/>'
b += '<rect x="250" y="280" width="580" height="1060" fill="url(#warm)" opacity=".5"/>'
b += '<ellipse cx="540" cy="1000" rx="300" ry="520" fill="#ffb347" opacity=".2" filter="url(#b50)"/></g>'
b += '<rect x="230" y="260" width="620" height="1100" fill="none" stroke="#2a2118" stroke-width="22"/>'
b += '<polygon points="250,280 250,1340 120,1380 120,240" fill="#16110c" stroke="#2a2118" stroke-width="6"/>'
b += front_cat(540, 830, 1.85, DARK, glow=True, pupil=6, seed=5, dark=True, cid='c1')
js = '''
function scene(t){
  const open=E(seg(t,.2,1.0));
  eyes(t,open);
  const ramp=seg(t,.9,2.2);
  const fl=1+.07*Math.sin(t*37)*Math.sin(t*5.3);
  OP('doorlight',ramp*fl);
  OP('fade',Math.max(1-seg(t,0,.4)*1, seg(t,D-.4,D)));
  const s=1+.38*E(t/D);
  camset(s,540,740,0,-30*E(t/D));
  breathe('c1',t,540,1245,.006,3.2);
}
'''
pages.append(page(1, b, cap(["ESTE GATO SABIA", "QUEM IA MORRER"], [LEAD[0]+.0, LEAD[0]+.9]), js))

# ---------- 2
random.seed(7)
b = '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050818"/><stop offset="1" stop-color="#1b2450"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#sky)"/>'
for k in range(70):
    b += f'<circle class="star" data-k="{k}" cx="{random.randint(10,1070)}" cy="{random.randint(100,620)}" r="{random.choice([1.5,2,2.5,3])}" fill="#fff" opacity=".7"/>'
b += '<circle cx="840" cy="250" r="95" fill="#f1ecd4" opacity=".25" filter="url(#b20)"/><circle cx="840" cy="250" r="70" fill="#f4efd8"/><circle cx="815" cy="235" r="14" fill="#d9d3b8"/><circle cx="865" cy="275" r="10" fill="#d9d3b8"/>'
b += '<rect x="0" y="1380" width="1080" height="540" fill="#0b0f1d"/><polygon points="110,660 540,500 970,660" fill="#151b2e"/><rect x="140" y="660" width="800" height="740" fill="#1b2236"/>'
lit = {(2,2),(2,4),(1,1),(0,4),(0,0)}
for row, wy in enumerate((1210, 1010, 810)):
    for col in range(6):
        wx = 180 + col*120; on = (row, col) in lit
        if row == 2 and col == 3: continue
        b += f'<rect x="{wx}" y="{wy}" width="80" height="110" rx="6" fill="{"#ffcf7a" if on else "#0e1424"}" opacity="{.85 if on else 1}"/>'
b += '<ellipse id="wglow" cx="540" cy="865" rx="170" ry="170" fill="#ffb347" opacity=".45" filter="url(#b50)"/>'
b += '<rect x="500" y="810" width="80" height="110" rx="6" fill="#ffd48a"/>'
b += '<g><clipPath id="wclip"><rect x="500" y="810" width="80" height="110"/></clipPath><g clip-path="url(#wclip)">' + front_cat(540, 884, .15, NORMAL, seed=3, cid='c2') + '</g></g>'
b += '<circle id="ring" cx="540" cy="865" r="92" fill="none" stroke="#ffc931" stroke-width="6" stroke-dasharray="14 12"/>'
b += '<text x="540" y="745" text-anchor="middle" font-family="DejaVu Sans" font-size="38" font-weight="700" fill="#ffc931">3º ANDAR</text>'
b += '<rect x="360" y="1290" width="360" height="86" rx="10" fill="#0b0f1d" stroke="#ffc931" stroke-width="3"/>'
b += f'<text x="540" y="1335" text-anchor="middle" font-family="{SERIF}" font-size="38" font-weight="700" fill="#ffc931">STEERE HOUSE</text><text x="540" y="1364" text-anchor="middle" font-family="{SANS}" font-size="20" fill="#cfd5ee" letter-spacing="4">PROVIDENCE · RHODE ISLAND</text>'
b += '<rect x="480" y="1220" width="120" height="70" fill="#0e1424"/>'
for tx in (40, 1010):
    b += f'<rect x="{tx-12}" y="1180" width="24" height="220" fill="#06090f"/><circle cx="{tx}" cy="1130" r="110" fill="#06090f"/><circle cx="{tx+(50 if tx<500 else -50)}" cy="1200" r="80" fill="#06090f"/>'
js = '''
function scene(t){
  document.querySelectorAll('.star').forEach(e=>{const k=+e.dataset.k;e.setAttribute('opacity',.35+.65*Math.abs(Math.sin(t*1.6+k*1.7)));});
  $('ring').setAttribute('stroke-dashoffset',-t*26);
  OP('wglow',.4+.12*Math.sin(t*2.2));
  const u=E(t/D);
  const s=1+.95*u; camset(s,540,865,0,0);
  eyes(t,1);
}
'''
pages.append(page(2, b, cap(["PROVIDENCE, 2005"], [tp(2, "Providence")+.1]), js))

# ---------- 3
b = '<rect width="1080" height="1920" fill="#06070c"/>'
b += '<polygon points="0,0 1080,0 620,700 460,700" fill="#121624"/><polygon points="0,0 460,700 460,880 0,1920" fill="#1a2030"/><polygon points="1080,0 620,700 620,880 1080,1920" fill="#171c2b"/><polygon points="0,1920 1080,1920 620,880 460,880" fill="#2a2634"/>'
b += '<rect x="460" y="700" width="160" height="180" fill="#dfe8ff"/><rect x="460" y="700" width="160" height="180" fill="#9fc0ff" opacity=".5" filter="url(#b8)"/>'
def door(x1, x2, left=True, open_=False):
    top = lambda x: 700*x/460; bot = lambda x: 1920-1040*x/460
    def pts(xa, xb):
        h1 = bot(xa)-top(xa); h2 = bot(xb)-top(xb)
        Pp = [(xa, bot(xa)-.64*h1), (xb, bot(xb)-.64*h2), (xb, bot(xb)), (xa, bot(xa))]
        if not left: Pp = [(1080-px, py) for px, py in Pp]
        return " ".join(f"{px:.0f},{py:.0f}" for px, py in Pp)
    col = "url(#warm)" if open_ else "#0d111c"
    return f'<polygon points="{pts(x1,x2)}" fill="{col}" stroke="#2c3550" stroke-width="5"/>'
for (x1, x2) in ((20,140),(180,262),(300,362),(392,424)):
    b += door(x1, x2, True, open_=(x1 == 180)) + door(x1, x2, False)
b += '<ellipse id="dglow" cx="300" cy="1330" rx="170" ry="330" fill="#ffb347" opacity=".28" filter="url(#b50)"/>'
for k, (ly, lw) in enumerate(((100,230),(330,150),(500,90),(620,50))):
    b += f'<g class="clight" data-k="{k}"><rect x="{540-lw/2}" y="{ly}" width="{lw}" height="{lw*.14}" rx="4" fill="#e6ecff"/><ellipse cx="540" cy="{ly+lw*.07}" rx="{lw*.9}" ry="{lw*.35}" fill="#cfe0ff" opacity=".18" filter="url(#b20)"/></g>'
b += '<g id="walkshadow"><ellipse cx="0" cy="0" rx="210" ry="26" fill="#000" opacity=".5"/></g>'
b += side_cat(0, 1395, 1.0, False, NORMAL, seed=21, cid='walker')
js = '''
function scene(t){
  const u=seg(t,.2,D-.3);
  const x=210+330*u;
  const ph=2*Math.PI*1.25*t;
  const bob=-5*Math.abs(Math.sin(ph));
  TR('walker',`translate(${x} ${bob})`);
  TR('walkshadow',`translate(${x+10} 1405)`);
  document.querySelectorAll('.leg').forEach(e=>{const n=e.dataset.name;const sgn=(n==='bn'||n==='ff')?1:-1;const a=24*Math.sin(ph)*sgn;e.setAttribute('transform',`rotate(${a} ${e.dataset.px} ${e.dataset.py})`);});
  document.querySelectorAll('.tail').forEach(e=>{e.setAttribute('transform',`rotate(${7*Math.sin(t*2.1)} ${e.dataset.px} ${e.dataset.py})`);});
  eyes(t,1);
  document.querySelectorAll('.clight').forEach(e=>{const k=+e.dataset.k;const fl=(k===1&&t>3.1&&t<3.5)?(.3+.7*(Math.sin(t*60)>0?1:0)):1;e.setAttribute('opacity',fl);});
  OP('dglow',.26+.08*Math.sin(t*3));
  camset(1+.10*E(t/D),540,1000,0,0);
}
'''
pages.append(page(3, b, cap(["ELE FAZIA A RONDA", "SOZINHO"], [tp(3,"Fazia"), tp(3,"como um")], size=72), js))

# ---------- 4
b = '<defs><linearGradient id="rm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1426"/><stop offset="1" stop-color="#1a2038"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#rm)"/><rect x="0" y="840" width="1080" height="40" fill="#0d1120"/>'
b += lamp('lg4') + bed(True)
b += '<g id="catw">' + front_cat(640, 1040-225*.66, .66, NORMAL, glow=True, pupil=7, seed=31, cid='c4') + '</g>'
cx, cy = 540, 400
b += f'<circle id="clk" cx="{cx}" cy="{cy}" r="165" fill="#e0342f" opacity=".35" filter="url(#b50)"/><circle cx="{cx}" cy="{cy}" r="150" fill="#14080b" stroke="#e0342f" stroke-width="14"/>'
for k in range(12):
    a = math.radians(k*30)
    b += f'<line x1="{cx+118*math.sin(a):.1f}" y1="{cy-118*math.cos(a):.1f}" x2="{cx+138*math.sin(a):.1f}" y2="{cy-138*math.cos(a):.1f}" stroke="#ff6f66" stroke-width="{7 if k%3==0 else 4}" stroke-linecap="round"/>'
b += f'<g id="hh" transform="rotate(-60 {cx} {cy})"><line x1="{cx}" y1="{cy}" x2="{cx}" y2="{cy-70}" stroke="#ffd6d2" stroke-width="12" stroke-linecap="round"/></g>'
b += f'<g id="hm" transform="rotate(150 {cx} {cy})"><line x1="{cx}" y1="{cy}" x2="{cx}" y2="{cy-105}" stroke="#ffd6d2" stroke-width="8" stroke-linecap="round"/></g>'
b += f'<g id="hs"><line x1="{cx}" y1="{cy+25}" x2="{cx}" y2="{cy-125}" stroke="#ff3a30" stroke-width="4" stroke-linecap="round"/></g><circle cx="{cx}" cy="{cy}" r="10" fill="#e0342f"/>'
b += f'<text id="hrs" x="540" y="650" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="58" fill="#ff5a52" letter-spacing="3" opacity="0">≈ 2 HORAS</text>'
t4 = [tp(4, "ele parava"), tp(4, "Entrava"), tp(4, "E se deitava")]
js = f'''
const T4={t4};
function scene(t){{
  const hb=1.0-.25*seg(t,0,D);
  const pulse=Math.pow(Math.max(0,Math.sin(Math.PI*((t/hb)%1))),6);
  OP('clk',.28+.4*pulse);
  TR('hs',`rotate(${{Math.floor(t)*6+ (t%1<.12? 4*Math.sin((t%1)/.12*Math.PI):0)}} 540 400)`);
  TR('hm',`rotate(${{150+t*3}} 540 400)`);
  TR('hh',`rotate(${{-60+t*.25}} 540 400)`);
  const ent=EO(seg(t,T4[1]-.2,T4[1]+1.1));
  const jump=Math.sin(Math.PI*seg(t,T4[1]-.2,T4[1]+1.1));
  const op=seg(t,T4[1]-.3,T4[1]+.2);
  TR('catw',`translate(${{(1-ent)*330}} ${{-jump*90}})`);
  OP('catw',op);
  breathe('c4',t,640,1040,.012,3.4);
  breathe('blanket',t,640,1130,.012,3.4);
  OP('hrs',EO(seg(t,tp4h,tp4h+.5))*(.75+.25*pulse));
  OP('lg4',.34+.06*Math.sin(t*5.3)*Math.sin(t*1.7));
  eyes(t,1);
  camset(1+.07*E(t/D),540,900,0,0);
}}
'''.replace('tp4h', str(tp(4, "Poucas horas")))
pages.append(page(4, b, cap(["ELE PARAVA.", "ENTRAVA.", "SE DEITAVA."], t4, y0=1440, step=98), js))

# ---------- 5
b = '<rect width="1080" height="1920" fill="#0b1018"/><rect x="0" y="180" width="1080" height="880" fill="#1b2a3a"/>'
b += '<rect x="640" y="260" width="300" height="360" rx="10" fill="#0c1424" stroke="#31465e" stroke-width="8"/><line x1="790" y1="260" x2="790" y2="620" stroke="#31465e" stroke-width="6"/><circle cx="720" cy="360" r="38" fill="#f1ecd4" opacity=".8"/>'
b += '<g id="nurse" transform="translate(400,980) scale(1.9)"><rect x="-34" y="-125" width="68" height="125" rx="26" fill="#2f8f9c"/><circle cx="0" cy="-158" r="31" fill="#d8b08c"/><path d="M-32 -170 Q0 -214 32 -170 Q0 -180 -32 -170Z" fill="#fff"/><path d="M-30 -158 Q-36 -118 -12 -108" fill="#3a2a1e" stroke="#3a2a1e" stroke-width="10" stroke-linecap="round"/><polyline points="22,-98 52,-130 38,-150" fill="none" stroke="#2f8f9c" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/><rect x="26" y="-182" width="14" height="46" rx="7" fill="#111" transform="rotate(14 33 -160)"/></g>'
b += '<rect x="120" y="945" width="640" height="120" rx="10" fill="#3b2a20"/><rect x="120" y="945" width="640" height="16" fill="#5a4030"/>'
b += '<g id="waves" fill="none" stroke="#ffc931" stroke-width="7" stroke-linecap="round"><path class="w" d="M505 500 q-26 -22 0 -44"/><path class="w" d="M485 515 q-44 -37 0 -74"/><path class="w" d="M465 530 q-62 -52 0 -104"/></g>'
b += '<g id="bubble"><rect x="560" y="370" width="420" height="150" rx="34" fill="#f4f1e8"/><polygon points="610,520 590,600 660,520" fill="#f4f1e8"/>'
b += f'<text x="770" y="462" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="52" fill="#1b2230">Venha agora.</text></g>'
b += '<rect x="0" y="1060" width="1080" height="400" fill="#241d2b"/><rect x="0" y="1060" width="1080" height="16" fill="#3a3045"/>'
b += '<rect x="840" y="1000" width="200" height="440" fill="url(#warm)" opacity=".9" rx="8"/><ellipse id="dg5" cx="930" cy="1250" rx="320" ry="260" fill="#ffb347" opacity=".35" filter="url(#b50)"/>'
for k, (px, sc) in enumerate(((140, 1.0), (360, 1.0), (560, .68))):
    b += f'<g id="fam{k}">'
    for j in range(3):
        b += f'<line x1="{px-130-j*45}" y1="{1260+j*34-30}" x2="{px-60-j*45}" y2="{1260+j*34-30}" stroke="#7d6a96" stroke-width="6" stroke-linecap="round" opacity=".5"/>'
    b += person(px+60, 1440, sc, color="#07070c") + '</g>'
t5b = tp(5, "a equipe passou"); t5f = tp(5, "Para dar tempo")
js = f'''
const TB={t5b},TF={t5f};
function scene(t){{
  const ring=(t*1.6)%1;
  document.querySelectorAll('.w').forEach((e,k)=>{{e.setAttribute('opacity',(t<TB+2.5)?Math.max(.15,Math.sin((t*5-k*.7))*.5+.5):.15);}});
  TR('nurse',`translate(400 ${{980+2*Math.sin(t*2)}}) scale(1.9)`);
  const pb=EO(seg(t,TB,TB+.4));const sc=.6+.4*pb+(pb>=1?0:0);
  TR('bubble',`translate(770 520) scale(${{sc}}) translate(-770 -520)`);OP('bubble',pb);
  for(let k=0;k<3;k++){{
    const u=EO(seg(t,TF+k*.25,TF+k*.25+2.6));
    const bob=Math.abs(Math.sin(t*9+k))*-14*(u<1?1:0);
    TR('fam'+k,`translate(${{-620*(1-u)}} ${{bob}})`);
    OP('fam'+k,seg(t,TF+k*.25-.1,TF+k*.25+.2));
  }}
  OP('dg5',.3+.12*Math.sin(t*3));
  camset(1+.06*E(t/D),540,1000,0,0);
}}
'''
pages.append(page(5, b, cap(["A FAMÍLIA ERA", "AVISADA A TEMPO"], [tp(5,"Depois"), tp(5,"para as famílias")], y0=1560), js))

# ---------- 6
b = '<defs><linearGradient id="nv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1330"/><stop offset="1" stop-color="#050816"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#nv)"/><ellipse cx="540" cy="760" rx="520" ry="480" fill="#2b4a9a" opacity=".25" filter="url(#b50)"/>'
b += '<g id="jr"><g transform="rotate(-6)"><rect x="-250" y="-310" width="500" height="620" rx="10" fill="#000" opacity=".5" transform="translate(14,18)"/><rect x="-250" y="-310" width="500" height="620" rx="8" fill="#eceadf"/>'
b += f'<text x="0" y="-250" text-anchor="middle" font-family="{SERIF}" font-weight="700" font-size="31" fill="#1a1a1a">The New England</text><text x="0" y="-212" text-anchor="middle" font-family="{SERIF}" font-weight="700" font-size="31" fill="#1a1a1a">Journal of Medicine</text><rect x="-210" y="-190" width="420" height="5" fill="#8b1a1a"/>'
b += f'<text x="0" y="-130" text-anchor="middle" font-family="{SERIF}" font-weight="700" font-size="40" fill="#111">A Day in the Life</text><text x="0" y="-80" text-anchor="middle" font-family="{SERIF}" font-weight="700" font-size="40" fill="#111">of Oscar the Cat</text><text x="0" y="-30" text-anchor="middle" font-family="{SERIF}" font-style="italic" font-size="26" fill="#555">David Dosa, M.D. · julho de 2007</text>'
for k in range(11):
    b += f'<rect x="-210" y="{20+k*26}" width="{420 if k%4!=3 else 280}" height="9" rx="4" fill="#b9b6aa"/>'
b += '</g></g>'
b += '<g id="bk"><g transform="rotate(6)"><rect x="-175" y="-245" width="350" height="490" rx="8" fill="#000" opacity=".5" transform="translate(12,16)"/><rect x="-175" y="-245" width="350" height="490" rx="8" fill="#1d3557"/><rect x="-175" y="-245" width="14" height="490" fill="#14263f"/>'
b += f'<text x="8" y="-170" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="40" fill="#f3e9cf">MAKING</text><text x="8" y="-124" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="40" fill="#f3e9cf">ROUNDS</text><text x="8" y="-78" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="40" fill="#ffc931">WITH OSCAR</text>'
b += front_cat(8, 38, .42, NORMAL, seed=41) + f'<text x="8" y="215" text-anchor="middle" font-family="{SANS}" font-size="28" fill="#f3e9cf" letter-spacing="3">DAVID DOSA</text></g></g>'
b += f'<g id="cnt" font-family="{SANS}" font-weight="700" font-size="112" fill="#ffc931" stroke="#000" stroke-width="12" paint-order="stroke" text-anchor="middle"><text id="n25" x="250" y="1290" opacity="0">25</text><text id="ar1" x="395" y="1290" opacity="0">→</text><text id="n50" x="540" y="1290" opacity="0">50</text><text id="ar2" x="690" y="1290" opacity="0">→</text><text id="n100" x="850" y="1290" opacity="0">100</text></g>'
b += f'<text id="sub" x="540" y="1348" text-anchor="middle" font-family="{SANS}" font-size="36" fill="#aab4d6" opacity="0">mortes previstas · estimativas da equipe</text>'
tj, tb_, t50, t100 = tp(6, "Em dois"), tp(6, "Virou livro"), tp(6, "cinquenta"), tp(6, "Algumas")
js = f'''
const TJ={tj},TBK={tb_},T50={t50},T100={t100};
function pop(id,t,t0){{const u=EO(seg(t,t0,t0+.35));const e=$(id);const x=+e.getAttribute('x'),y=+e.getAttribute('y');e.setAttribute('opacity',u);e.setAttribute('transform',`translate(${{x}} ${{y-50}}) scale(${{.6+.4*u}}) translate(${{-x}} ${{-(y-50)}})`);}}
function scene(t){{
  const a=EO(seg(t,TJ,TJ+.9));TR('jr',`translate(${{380-(1-a)*800}} ${{560}}) rotate(${{(1-a)*-14}})`);OP('jr',cl(a*2,0,1));
  const c=EO(seg(t,TBK,TBK+.9));TR('bk',`translate(${{730+(1-c)*800}} ${{980}}) rotate(${{(1-c)*16}})`);OP('bk',cl(c*2,0,1));
  pop('n25',t,TJ+.8);pop('ar1',t,T50-.3);pop('n50',t,T50);pop('ar2',t,T100-.3);pop('n100',t,T100);OP('sub',EO(seg(t,TJ+1.2,TJ+1.8)));
  camset(1+.07*E(t/D),540,900,0,0);
}}
'''
pages.append(page(6, b, cap(["O MUNDO", "DESCOBRIU"], [tj, tb_], y0=1500), js))

# ---------- 7
b = '<defs><radialGradient id="pu" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#3a2466"/><stop offset="1" stop-color="#090514"/></radialGradient></defs><rect width="1080" height="1920" fill="url(#pu)"/>'
for k, (qx, qy, qs, qr) in enumerate(((130,420,260,-14),(880,360,200,12),(940,960,280,10),(110,1000,220,-10),(500,280,150,4))):
    b += f'<text class="q" data-k="{k}" x="{qx}" y="{qy}" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="{qs}" fill="#b79cff" opacity="0" transform="rotate({qr} {qx} {qy})">?</text>'
def molecule(mid, x, y, s, col):
    pts = [(0,0),(60,-30),(110,20),(60,70),(-50,60)]
    g = f'<g id="{mid}"><g transform="translate({x},{y}) scale({s})">'
    for (a, c) in ((0,1),(1,2),(2,3),(0,4),(0,3)):
        g += f'<line x1="{pts[a][0]}" y1="{pts[a][1]}" x2="{pts[c][0]}" y2="{pts[c][1]}" stroke="{col}" stroke-width="5" opacity=".8"/>'
    for k, (px, py) in enumerate(pts):
        g += f'<circle cx="{px}" cy="{py}" r="{16 if k==0 else 11}" fill="{col}"/><circle cx="{px}" cy="{py}" r="{28 if k==0 else 20}" fill="{col}" opacity=".25" filter="url(#b8)"/>'
    return g + '</g></g>'
mols = [(150,640,1.2),(760,560,1.1),(830,1150,1.3),(110,1230,1.0),(470,1330,.9)]
for k, (mx, my, ms) in enumerate(mols):
    b += molecule(f'm{k}', mx, my, ms, "#5ef2d6")
for (mx, my, ms) in mols[:3]:
    b += f'<path class="dash" d="M540 725 Q{(540+mx)/2} {(725+my)/2-90} {mx+30} {my}" fill="none" stroke="#5ef2d6" stroke-width="4" stroke-dasharray="4 16" stroke-linecap="round" opacity="0"/>'
b += '<ellipse cx="540" cy="860" rx="330" ry="420" fill="#9b6bff" opacity=".28" filter="url(#b50)"/>'
b += front_cat(540, 780, 1.7, PURPLE, glow=True, pupil=6, seed=51, dark=True, cid='c7')
tm, tn = tp(7, "Talvez"), tp(7, "Ninguém")
js = f'''
const TM={tm},TN={tn};
function scene(t){{
  for(let k=0;k<5;k++){{
    const a=EO(seg(t,TM+k*.22,TM+k*.22+.8));
    TR('m'+k,`translate(${{12*Math.sin(t*.9+k)}} ${{16*Math.cos(t*.7+k*2)-(1-a)*60}})`);OP('m'+k,a);
  }}
  document.querySelectorAll('.dash').forEach((e,k)=>{{e.setAttribute('stroke-dashoffset',-t*40);e.setAttribute('opacity',.7*EO(seg(t,TM+.8,TM+1.6)));}});
  document.querySelectorAll('.q').forEach(e=>{{const k=+e.dataset.k;const a=EO(seg(t,TN+k*.25,TN+k*.25+.6));e.setAttribute('opacity',.24*a*(.8+.2*Math.sin(t*2+k)));}});
  breathe('c7',t,540,1005,.008,3.6);
  eyes(t,1);
  camset(1+.10*E(t/D),540,800,0,0);
}}
'''
pages.append(page(7, b, cap(["COMO ELE SABIA?"], [tp(7, "Como")], y0=1520), js))

# ---------- 8
b = '<defs><linearGradient id="n8" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070a16"/><stop offset="1" stop-color="#121a33"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#n8)"/>'
b += '<rect x="330" y="230" width="420" height="520" fill="#0a1228" stroke="#2b3556" stroke-width="16"/><line x1="540" y1="230" x2="540" y2="750" stroke="#2b3556" stroke-width="10"/><line x1="330" y1="490" x2="750" y2="490" stroke="#2b3556" stroke-width="10"/>'
b += '<g id="moon"><circle cx="540" cy="420" r="150" fill="#f1ecd4" opacity=".18" filter="url(#b20)"/><circle cx="540" cy="420" r="105" fill="#f4efd8" opacity=".9"/><circle cx="508" cy="395" r="18" fill="#d9d3b8"/><circle cx="575" cy="450" r="12" fill="#d9d3b8"/></g>'
b += lamp('lg8', op=.28) + bed(False)
b += '<ellipse cx="600" cy="1055" rx="140" ry="12" fill="#000" opacity=".35"/>'
b += front_cat(600, 1040-225*.7+8, .7, NORMAL, glow=False, pupil=9, seed=61, cid='c8')
cta = f'<text id="cta" x="540" y="1790" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="44" fill="#fff" stroke="#000" stroke-width="10" paint-order="stroke" opacity="0">Siga para mais histórias</text>'
t8a, t8b = tp(8, "Segundo"), tp(8, "Mas, nas")
js = f'''
const T8B={t8b};
function scene(t){{
  const dim=seg(t,T8B,D-.6);
  OP('lg8',.30*(1-.85*E(dim)));
  const sh=$('lg8s'); if(sh) sh.setAttribute('fill', dim>0? `rgb(${{Math.round(255-130*E(dim))}},${{Math.round(212-120*E(dim))}},${{Math.round(138-90*E(dim))}})`:'#ffd48a');
  breathe('c8',t,600,1048,.012,3.8);
  eyes(t,1-.55*E(seg(t,T8B,D-.8)));
  OP('moon',.85+.15*Math.sin(t));
  OP('cta',EO(seg(t,D-3.2,D-2.5)));
  camset(1+.06*E(t/D),540,1050,0,0);
}}
'''
pages.append(page(8, b, cap(["OSCAR", "2005 – 2022"], [t8a+1.0, t8a+1.9], y0=1540) + cta, js))

for i, p in enumerate(pages, 1):
    open(f'scene{i}.html', 'w').write(p)
print('scenes', len(pages), [round(d, 1) for d in D], round(sum(D), 1))
