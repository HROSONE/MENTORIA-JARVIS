import json, math, random, re
from build import page_any, D as DOLD, front_cat, side_cat, NORMAL, SANS, SERIF, W, H, lamp, bed
from cats import *
from newscenes import curl_cat, ORANGE, BLACKC, WHITEC, BROWN

# ================= D — ceticismo (7.5s)
def doc(gid, x, y, s, arms=True, point=False):
    g = f'<g id="{gid}"><g transform="translate({x},{y}) scale({s})"><circle cx="0" cy="-250" r="38" fill="#d6b494"/><path d="M-42 -262 Q0 -300 42 -262 Q0 -280 -42 -262Z" fill="#3b2d22"/>'
    g += '<path d="M-60 -205 Q0 -230 60 -205 L72 -20 L-72 -20Z" fill="#f2f4f6"/><path d="M-72 -20 L-80 150 L80 150 L72 -20Z" fill="#f2f4f6"/><path d="M-60 -205 L0 -170 L60 -205" fill="none" stroke="#c8ced6" stroke-width="5"/>'
    if arms: g += '<path d="M-64 -170 Q-20 -90 40 -128 M64 -170 Q20 -90 -40 -128" fill="none" stroke="#e1e5e9" stroke-width="30" stroke-linecap="round"/>'
    if point: g += '<g id="armR"><path d="M60 -180 Q130 -200 190 -280" fill="none" stroke="#e1e5e9" stroke-width="28" stroke-linecap="round"/><circle cx="196" cy="-290" r="14" fill="#d6b494"/></g>'
    return g + '</g></g>'
b = '<rect width="1080" height="1920" fill="#10161f"/><rect x="0" y="260" width="1080" height="1000" fill="#1c2634"/><rect x="0" y="1240" width="1080" height="680" fill="#161b24"/>'
b += '<rect x="90" y="330" width="900" height="620" rx="14" fill="#e9ecee" stroke="#3a4352" stroke-width="16"/>'
b += f'<text x="540" y="410" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="46" fill="#27303d">ACERTOS?</text>'
n = 0
for row in range(4):
    for grp in range(5 if row < 3 else 3):
        gx = 150 + grp*170; gy = 470 + row*105
        b += f'<g class="tg" data-k="{n}" opacity="0">'
        for k in range(4): b += f'<line x1="{gx+k*28}" y1="{gy}" x2="{gx+k*28}" y2="{gy+70}" stroke="#1f2a3a" stroke-width="7" stroke-linecap="round"/>'
        b += f'<line x1="{gx-12}" y1="{gy+55}" x2="{gx+96}" y2="{gy+12}" stroke="#c0392b" stroke-width="7" stroke-linecap="round"/></g>'; n += 1
b += f'<text id="qm" x="900" y="900" text-anchor="middle" font-family="{SANS}" font-weight="700" font-size="150" fill="#b79cff" opacity="0">?</text>'
b += '<ellipse cx="540" cy="1190" rx="420" ry="120" fill="#ffd48a" opacity=".15" filter="url(#b50)"/>'
b += doc('docL', 330, 1480, 1.5, True) + doc('docR', 760, 1470, 1.5, False, True)
b += '<rect x="0" y="1560" width="1080" height="360" fill="#10141c"/><rect x="120" y="1500" width="840" height="40" rx="8" fill="#4a3a2e"/>'
jsD = '''
function scene(t){
  document.querySelectorAll('.tg').forEach(e=>{const k=+e.dataset.k;const a=EO(seg(t,.7+k*.2,.7+k*.2+.2));e.setAttribute('opacity',a);const s=1+.12*Math.sin(Math.PI*seg(t,.7+k*.2,.7+k*.2+.2));e.setAttribute('transform',`translate(0 ${(1-a)*-8}) `);});
  OP('qm',EO(seg(t,4.6,5.2))*(.7+.3*Math.sin(t*3)));
  TR('docL',`rotate(${1.6*Math.sin(t*1.3)} 330 1560)`);
  TR('docR',`rotate(${1.2*Math.sin(t*1.7+1)} 760 1560)`);
  TR('armR',`rotate(${9*Math.sin(t*2.6)} 820 1290)`);
  camset(1+.28*E(t/D),540,760,0,0);
}
'''
pD = page_any(5, 7.5, b, jsD)

# ================= A — despedida (8.5s)
b = '<defs><linearGradient id="ra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1426"/><stop offset="1" stop-color="#1a2038"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#ra)"/>'
b += '<rect x="330" y="200" width="420" height="440" fill="#0a1228" stroke="#2b3556" stroke-width="16"/><line x1="540" y1="200" x2="540" y2="640" stroke="#2b3556" stroke-width="10"/><circle cx="640" cy="360" r="70" fill="#f4efd8" opacity=".85"/>'
b += '<ellipse id="lgA" cx="935" cy="1050" rx="360" ry="360" fill="#ffb347" opacity=".35" filter="url(#b50)"/>'
y = 1150
b += f'<rect x="0" y="{y}" width="1080" height="770" fill="#14141c"/><rect x="60" y="{y-310}" width="64" height="330" rx="14" fill="#4a3426"/><rect x="100" y="{y-95}" width="880" height="90" rx="18" fill="#d8d4c8"/><rect x="130" y="{y-5}" width="24" height="70" fill="#4a3426"/><rect x="930" y="{y-5}" width="24" height="70" fill="#4a3426"/>'
b += f'<ellipse cx="230" cy="{y-112}" rx="105" ry="38" fill="#e9e6df"/><circle cx="232" cy="{y-150}" r="50" fill="#d8b9a0"/><path d="M182 {y-158} Q232 {y-215} 282 {y-158} Q250 {y-185} 182 {y-158}" fill="#d9dce2"/>'
b += f'<g id="blA"><path d="M290 {y-20} C 310 {y-135} 480 {y-165} 640 {y-130} C 820 {y-105} 940 {y-70} 985 {y-20} Z" fill="#5a6f8f"/>'
b += f'<path d="M300 {y-112} Q380 {y-128} 440 {y-100}" fill="none" stroke="#d8b9a0" stroke-width="22" stroke-linecap="round"/></g>'
b += '<rect x="880" y="1100" width="100" height="160" rx="8" fill="#2a2018"/><polygon id="shA" points="870,1060 990,1060 962,990 898,990" fill="#ffd48a"/><rect x="926" y="1060" width="8" height="40" fill="#3a2d22"/>'
b += front_cat(800, 1030-225*.5, .5, NORMAL, seed=71, cid='catA')
b += '<rect x="330" y="1330" width="150" height="26" rx="10" fill="#1a1c28"/>'
b += '<g id="seat"><g fill="#07080e" stroke="#07080e" stroke-linecap="round" stroke-linejoin="round"><circle cx="420" cy="1210" r="38" stroke="none"/><path d="M372 1260 Q420 1245 470 1262 L490 1420 L360 1420Z" stroke-width="6"/><path d="M380 1275 Q350 1190 440 1138" fill="none" stroke-width="30"/></g></g>'
b += '<g id="standp"><g fill="#07080e" stroke="#07080e" stroke-linecap="round" stroke-linejoin="round"><circle cx="600" cy="1040" r="40" stroke="none"/><path d="M548 1095 Q600 1078 654 1098 L672 1500 L530 1500Z" stroke-width="6"/><path d="M566 1110 Q500 1190 480 1270" fill="none" stroke-width="28"/></g></g>'
b += '<g id="kid"><g fill="#07080e" stroke="#07080e" stroke-linecap="round" stroke-linejoin="round"><circle cx="720" cy="1225" r="30" stroke="none"/><path d="M682 1262 Q720 1252 758 1264 L770 1500 L670 1500Z" stroke-width="6"/></g></g>'
jsA = '''
function scene(t){
  const fadeB=1-seg(t,D-3.4,D-1.4);
  breathe('blA',t,640,1130,.013*fadeB,3.6+ (1-fadeB)*2);
  breathe('catA',t,800,1030,.012,3.8);
  const dim=E(seg(t,D-3.0,D-.8));
  OP('lgA',.35*(1-.8*dim)+.03*Math.sin(t*6)*Math.sin(t*1.9));
  const sh=$('shA'); sh.setAttribute('fill',`rgb(${Math.round(255-120*dim)},${Math.round(212-110*dim)},${Math.round(138-80*dim)})`);
  TR('seat',`rotate(${-1.5-2.5*E(seg(t,2,D-2))} 420 1420)`);
  TR('standp',`rotate(${.8*Math.sin(t*.9)} 600 1500)`);
  TR('kid',`rotate(${1.2*Math.sin(t*1.1+2)} 720 1500)`);
  eyes(t,1-.5*E(seg(t,D-3.0,D-1.0)));
  camset(1+.42*E(t/D),480,1140,0,0);
}
'''
pA = page_any(7, 8.5, b, jsA)

# ================= E — os outros gatos (7.5s)
b = '<defs><linearGradient id="re" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1424"/><stop offset="1" stop-color="#2a2030"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#re)"/>'
b += '<rect x="0" y="1380" width="1080" height="540" fill="#1b1520"/><rect x="0" y="1370" width="1080" height="14" fill="#2c2236"/>'
b += '<ellipse cx="380" cy="900" rx="420" ry="360" fill="#ffb347" opacity=".22" filter="url(#b50)"/>'
b += '<rect x="60" y="560" width="440" height="30" rx="8" fill="#4a3426"/><rect x="580" y="720" width="440" height="30" rx="8" fill="#4a3426"/><rect x="100" y="880" width="380" height="26" rx="8" fill="#4a3426"/>'
b += '<rect x="560" y="1020" width="470" height="360" rx="40" fill="#4a3a58"/><rect x="560" y="990" width="470" height="70" rx="30" fill="#5a4870"/><rect x="40" y="1200" width="360" height="180" rx="30" fill="#6a4a3a"/>'
cats_ = [(260, 560, .8, ORANGE, 81, False), (800, 722, .8, BLACKC, 82, True), (290, 880, .72, WHITEC, 83, False), (790, 1022, .9, BROWN, 84, True), (200, 1205, .85, ORANGE, 85, False)]
for k, (cx, cy, sc, pal, sd, fl) in enumerate(cats_):
    b += f'<g id="sc{k}">' + curl_cat(cx, cy, sc, pal, sd, fl) + '</g>'
    zx = cx + (-30 if fl else 40)
    for j in range(3):
        b += f'<text class="zz" data-x="{zx}" data-y="{cy-100}" data-k="{k*3+j}" x="{zx}" y="{cy-100}" font-family="{SANS}" font-weight="700" font-size="{40+j*8}" fill="#cfd6ff" opacity="0">z</text>'
b += '<ellipse id="shE" cx="0" cy="0" rx="230" ry="36" fill="#000" opacity=".5"/>'
b += side_cat(0, 1640, 1.05, False, NORMAL, seed=91, pupil=9, cid='walkE')
bases = [(260, 600), (800, 760), (290, 910), (790, 1055), (200, 1230)]
jsE = f'''
const BASES={json.dumps(bases)};
function scene(t){{
  for(let k=0;k<5;k++){{breathe('sc'+k,t+k*.7,BASES[k][0],BASES[k][1],.018,3.0+k*.25);}}
  document.querySelectorAll('.zz').forEach(e=>{{const k=+e.dataset.k;const ph=((t*.5+k*.33)%1);const x=+e.dataset.x,y=+e.dataset.y;e.setAttribute('opacity',Math.sin(Math.PI*ph)*.7);e.setAttribute('transform',`translate(${{ph*30}} ${{-ph*70}})`);}});
  const u=seg(t,.3,D-.6);const x=170+560*u;const ph=2*Math.PI*1.25*t;
  TR('walkE',`translate(${{x}} ${{-5*Math.abs(Math.sin(ph))}})`);
  TR('shE',`translate(${{x+80}} 1650)`);
  document.querySelectorAll('.leg').forEach(e=>{{const n=e.dataset.name;const sg=(n==='bn'||n==='ff')?1:-1;e.setAttribute('transform',`rotate(${{24*Math.sin(ph)*sg}} ${{e.dataset.px}} ${{e.dataset.py}})`);}});
  document.querySelectorAll('.tail').forEach(e=>{{if(e.dataset.px)e.setAttribute('transform',`rotate(${{7*Math.sin(t*2.1)}} ${{e.dataset.px}} ${{e.dataset.py}})`);}});
  eyes(t,1);
  camset(1.04+.05*E(t/D),540,1100,40-80*E(t/D),0);
}}
'''
pE = page_any(8, 7.5, b, jsE)

# ================= C — enterro (10s)
cem = open('cem_body.txt').read()
cdefs = open('cem_defs.txt').read()
keep = ''.join(re.findall(r'<(?:linearGradient|radialGradient) id="(?:sky|hill|pit|wood|vg)".*?</(?:linearGradient|radialGradient)>', cdefs, re.S))
rr = random.Random(5)
jsC = '''
const CYC=2.7, T0=.6;
const HX=815-.9*5, HY=1300-.9*120;
function ang(p){
  if(p<.4) return -50+12*E(p/.4);
  if(p<1.3) return -38+138*E((p-.4)/.9);
  if(p<1.6) return 100-45*E((p-1.3)/.3);
  return 55-105*E((p-1.6)/1.1);
}
function tip(th){const r=th*Math.PI/180;return [HX+.9*(-148*Math.sin(r)),HY+.9*(-0+148*Math.cos(r)+0)];}
const REL=1.45;
function scene(t){
  document.querySelectorAll('.star').forEach(e=>{const k=+e.dataset.k;e.setAttribute('opacity',.35+.65*Math.abs(Math.sin(t*1.4+k*1.9)));});
  // coffin lowering
  const low=E(seg(t,.3,4.2))*34;
  TR('cof',`translate(0 ${low})`);
  const r1=$('rope1'),r2=$('rope2');r1.setAttribute('y2',1160+low);r2.setAttribute('y2',1160+low);
  // digger cycle
  const q=Math.max(0,t-T0);const k=Math.floor(q/CYC);const p=q%CYC;
  const active=(t>T0&&t<D-1.1);
  const th=active?ang(p):-50;
  TR('shov',`translate(-5 -120) rotate(${th})`);
  OP('blade',(active&&p>.3&&p<1.45)?1:0);
  const lean=active?(-4*Math.sin(Math.PI*Math.min(1,p/CYC)*2)):0;
  TR('digger',`translate(815 ${1300+ (active?-3*Math.abs(Math.sin(p*2.3)):0)}) scale(.9)`);
  // arms follow
  const hx=-5,hy=-120, a=th*Math.PI/180;
  const gx=hx-0*Math.sin(a), gy=hy;
  $('arm1').setAttribute('d',`M-5 -215 L${hx} ${hy-6}`);$('arm2').setAttribute('d',`M15 -215 L${hx+4} ${hy+6}`);
  // particles
  const dps=document.querySelectorAll('.dp');let landed=0;
  for(let n=0;n<5;n++){
    const tr=T0+n*CYC+REL;
    for(let j=0;j<8;j++){
      const e=dps[n*8+j]; if(!e) continue;
      const tau=t-(tr+j*.035);
      if(tau<0){e.setAttribute('opacity',0);continue;}
      const th0=72*Math.PI/180;
      const x0=HX+.9*(-148*Math.sin(th0)), y0=HY+.9*(148*Math.cos(th0));
      const vx=-40-30*((j*37%7)/7)+ (j%3)*14, vy=30;
      const x=x0+vx*tau, y=y0+vy*tau+.5*1500*tau*tau;
      const land=1215+low*0.0;
      if(y>land){e.setAttribute('opacity',0);landed++;continue;}
      e.setAttribute('opacity',.95);e.setAttribute('cx',x);e.setAttribute('cy',y);
    }
  }
  OP('cdirt',Math.min(.95,landed/36));
  const prog=Math.min(1,landed/36);
  TR('mound',`translate(0 1345) scale(1 ${1-.22*prog}) translate(0 -1345)`);
  for(let k2=0;k2<5;k2++){breathe('pp'+k2,t+k2,[200,400,690,880,548][k2],[1790,1690,1690,1790,1585][k2],.006,3.4+k2*.2);}
  const z=1+.30*E(t/D);
  camset(z,540,1200,0,-40*E(t/D));
}
'''
pC = page_any(10, 10.0, cem, jsC, extra_defs=keep)

for name, p in (('sceneD', pD), ('sceneA', pA), ('sceneE', pE), ('sceneC', pC)):
    open(name + '.html', 'w').write(p)
order = [('scene1', DOLD[0]), ('scene2', DOLD[1]), ('scene3', DOLD[2]), ('scene4', DOLD[3]), ('sceneD', 7.5), ('scene5', DOLD[4]), ('sceneA', 8.5), ('sceneE', 7.5), ('scene6', DOLD[5]), ('sceneC', 10.0), ('scene7', DOLD[6]), ('scene8', DOLD[7])]
json.dump(order, open('order.json', 'w'))
print(sum(d for _, d in order), 'seconds,', round(sum(d for _, d in order) * 24), 'frames')
