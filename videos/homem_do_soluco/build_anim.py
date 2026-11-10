import json, math, sys
import hu
from hu import DEFS, progress, W, H
import scenes_a, scenes2_a

CAP = {}
def capture(body, idx, extra='', total=10, vig=True, defs='', vig_op=None):
    return dict(body=body, idx=idx, extra=extra, defs=defs)
for m in (scenes_a, scenes2_a): m.wrap2 = capture
import props_a; props_a.wrap2 = capture
sc = scenes_a.build_all()          # dict 1..10 -> dict(body, extra, defs, idx)

D = {1: 4.6, 2: 7.5, 3: 6.5, 4: 7.0, 5: 8.0, 6: 10.5, 7: 7.0, 8: 8.0, 9: 8.5, 10: 7.5}
CUES = {
    1: dict(H=[.7, 1.65, 2.5, 3.3]),
    2: dict(G=[.9, 2.5, 4.1, 5.7], O=[1.6, 4.9], N0=1.2, N1=5.2),
    3: dict(TF=.9, H=[3.2, 4.6, 5.8]),
    4: dict(H=[1.2, 2.6, 4.0, 5.4]),
    5: dict(H=[1.0, 2.6, 4.2, 5.8], bx=[760, 860, 930, 790], by=[790, 680, 540, 600]),
    6: dict(TS=5.0, TA=.3, TB=3.2, TC=6.2, TSTAMP=8.3, WHISTLE=1.0),
    7: dict(H=[1.6, 3.3, 5.0], B0=2.4, B1=6.2),
    8: dict(H=[2.4, 4.6, 6.4]),
    9: dict(H=[.9], TREL=5.6),
    10: dict(T1=1.4, T2=2.4),
}
json.dump(dict(D=D, CUES=CUES), open('cues.json', 'w'))

COMMON = r'''
const P=__P__; const D=P.D;
const cl=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const seg=(t,a,b)=>cl((t-a)/(b-a));
const E=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
const EO=x=>1-Math.pow(1-x,3);
const $=id=>document.getElementById(id);
const TR=(id,v)=>{const e=$(id); if(e) e.setAttribute('transform',v);};
const OP=(id,v)=>{const e=$(id); if(e) e.setAttribute('opacity',v);};
const jolt=(t,t0,k=7,w=14)=>{const x=t-t0; if(x<0) return 0; return Math.exp(-x*k)*Math.cos(x*w)*(1-Math.exp(-x*80));};
const rnd=k=>{const x=Math.sin(k*127.1+311.7)*43758.5453;return x-Math.floor(x);};
function camset(s,cx,cy,dx,dy){TR('cam',`translate(${cx+dx} ${cy+dy}) scale(${s}) translate(${-cx} ${-cy})`);}
function common(t){OP('fade',Math.max(1-seg(t,0,P.fin),seg(t,D-P.fout,D)));}
'''

JS = {}
JS[1] = r'''
function scene(t){
  let j=0,bp=0,fl=0;
  P.H.forEach(h=>{j+=jolt(t,h,6,12);const x=t-h;if(x>=0&&x<.6){bp=Math.max(bp,x<.12?x/.12:1-(x-.12)/.48);} if(x>=0&&x<.22){fl=Math.max(fl,1-x/.22);}});
  TR('f1',`translate(0 ${-34*j}) translate(540 800) rotate(${4*j}) scale(${1+.045*j}) translate(-540 -800)`);
  const bs=.4+.95*bp; TR('burst1',`translate(850 330) scale(${bs}) rotate(${-8*bp}) translate(-850 -330)`); OP('burst1',Math.min(1,bp*3));
  OP('bolts1',Math.min(1,fl*1.3));
  OP('rays1',.7+.3*Math.sin(t*31));
  const a68=EO(seg(t,2.2,2.7)); TR('n68',`translate(540 1450) scale(${.35+.65*a68+.12*Math.sin(Math.PI*seg(t,2.2,2.85))}) translate(-540 -1450)`); OP('n68',a68);
  OP('anos',EO(seg(t,2.7,3.1))); OP('sub1',EO(seg(t,3.15,3.55)));
  camset(1+.10*E(t/D),540,800,0,0);
}'''
JS[2] = r'''
function scene(t){
  const push=Math.max(0,Math.sin(t*3.2));
  TR('fm2',`translate(${7*push} 0) translate(250 1500) rotate(${1.8*push}) translate(-250 -1500)`);
  TR('hog2',`translate(${4*push} ${-3*push})`);
  document.querySelectorAll('.sw').forEach(e=>{const k=+e.dataset.k;const ph=((t*.8+k*.33)%1);e.setAttribute('transform',`translate(${-8*ph} ${ph*95})`);e.setAttribute('opacity',Math.sin(Math.PI*Math.min(1,ph))*.9);});
  document.querySelectorAll('.needle').forEach(e=>{const cx=+e.dataset.cx,cy=+e.dataset.cy;const u=seg(t,P.N0,P.N1);const back=1+.05*Math.sin(Math.PI*seg(t,P.N1,P.N1+.9));e.setAttribute('transform',`rotate(${-225+222.75*EO(u)*back} ${cx} ${cy})`);});
  TR('clouds',`translate(${-18*t} 0)`); TR('birds',`translate(${40*t} ${5*Math.sin(t*2)})`); OP('sun',.9+.1*Math.sin(t*1.3));
  camset(1+.22*E(t/D),520,1180,0,0);
}'''
JS[3] = r'''
function scene(t){
  const TF=P.TF, k=t-TF;
  const push=Math.max(0,Math.sin(t*3.2));
  OP('fa3',t<TF?1:0); OP('fb3',t<TF?0:1);
  TR('fa3',`translate(${6*push} 0) translate(290 1500) rotate(${1.5*push}) translate(-290 -1500)`);
  if(k>=0){const sink=E(seg(k,.7,5.6)); TR('fb3',`translate(${100} ${34*sink}) translate(290 1500) rotate(${-5*sink-14*Math.exp(-k*6)}) translate(-290 -1500) translate(${46*Math.exp(-k*8)} ${-34*Math.exp(-k*6)})`);}
  if(k<0){OP('hat3',0);} else {
    const x0=500,y0=880,vx=-170,vy=-780,g=1500,gr=1450;
    let x=x0+vx*k, y=y0+vy*k+.5*g*k*k, rot=-32+k*420;
    const disc=vy*vy-2*g*(y0-gr), tl=(-vy+Math.sqrt(disc))/g;
    if(k>tl){const t2=k-tl; x=x0+vx*tl+vx*.12*(1-Math.exp(-3*t2)); y=gr; const rl=-32+tl*420; rot=-8+(rl+8)*Math.exp(-5*t2);}
    OP('hat3',1); TR('hat3',`translate(${x} ${y}) rotate(${rot})`);
  }
  OP('dust3',k<0?0:(1-seg(k,.6,2.6))); TR('dust3',`translate(330 1480) scale(${.3+1.0*EO(seg(k,0,1.4))}) translate(-330 -1480)`);
  TR('hog3',`translate(${3*Math.sin(t*40)*Math.exp(-Math.max(0,k)*3)} ${k<0?0:-52*Math.max(0,Math.sin(Math.PI*cl(k/.55)))})`);
  let bp=0; [TF+.12].concat(P.H).forEach((h,i)=>{const x=t-h;if(x>=0&&x<.62){const v=x<.14?x/.14:1-(x-.14)/.48;bp=Math.max(bp,v*(i==0?1:.72));}});
  TR('burst3',`translate(790 470) scale(${.35+.85*bp}) rotate(${-6*bp}) translate(-790 -470)`); OP('burst3',Math.min(1,bp*2.5));
  document.querySelectorAll('.needle').forEach(e=>{const cx=+e.dataset.cx,cy=+e.dataset.cy;e.setAttribute('transform',`rotate(${-2.25+45*jolt(t,TF,5,25)} ${cx} ${cy})`);});
  const rot=-6*EO(seg(t,TF-.05,TF+.4)); const sh=k>0?7*Math.sin(t*85)*Math.exp(-k*6):0;
  TR('tilt3',`translate(${540+sh} 960) rotate(${rot}) scale(1.04) translate(-540 -960)`);
  TR('clouds',`translate(${-14*t} 0)`); TR('birds',`translate(${34*t} 0)`);
  camset(1+.08*E(t/D),500,1150,0,0);
}'''
JS[4] = r'''
function scene(t){
  let pu=0; P.H.forEach(h=>{const x=t-h; if(x>=0&&x<1){pu=Math.max(pu,Math.exp(-x*5)*(1-Math.exp(-x*60)));}});
  TR('dot4',`translate(-14 6) scale(${1+.9*pu}) translate(14 -6)`);
  const r4=$('ring4'); r4.setAttribute('stroke-dashoffset',-t*30); r4.setAttribute('transform',`translate(${P.dx} ${P.dy}) scale(${1+.3*pu}) translate(${-P.dx} ${-P.dy})`); r4.setAttribute('opacity',.55+.45*pu);
  TR('scan4',`translate(0 ${(t*280)%1930})`);
  TR('mag4',`translate(${4*Math.sin(t*1.1)} ${6*Math.sin(t*1.3)})`);
  document.querySelectorAll('.dr').forEach(e=>{const k=+e.dataset.k,a=+e.dataset.a,d=+e.dataset.d;const ph=((t*.7+k*.13)%1);const rr=d*(.2+.8*ph);e.setAttribute('cx',P.mx+15+rr*Math.cos(a));e.setAttribute('cy',P.my+10+rr*Math.sin(a));e.setAttribute('opacity',1-ph);});
  TR('doc4',`translate(${-7*pu} ${5*pu})`);
  TR('head4',`translate(0 ${-6*pu})`);
  OP('title4',t<.7?(.4+.6*(Math.sin(t*60)>0?1:0)):1);
  camset(1+.12*E(t/D),600,1000,0,0);
}'''
JS[5] = r'''
function scene(t){
  let j=0; P.H.forEach(h=>{j+=jolt(t,h,6,12);});
  TR('man5',`translate(0 ${-16*j})`);
  document.querySelectorAll('.hb').forEach(e=>{const k=+e.dataset.k;const h=P.H[k];if(h===undefined||t<h){e.setAttribute('opacity',0);return;}
    const x=t-h,u=cl(x/.25),rise=cl(x/2.4),bx=P.bx[k],by=P.by[k];
    e.setAttribute('opacity',Math.min(1,u*2)*(1-seg(x,1.7,2.6)));
    e.setAttribute('transform',`translate(${-12*rise} ${-90*rise}) translate(${bx} ${by}) scale(${.4+.6*EO(u)}) translate(${-bx} ${-by})`);});
  TR('mh5',`rotate(${t*14} 970 1142)`);
  TR('ecg5',`translate(${-((t*200)%120)} 0)`);
  TR('moon5',`translate(${3*t} ${t})`);
  OP('beam5',.85+.15*Math.sin(t*2.1));
  camset(1+.16*E(t/D),540,900,0,0);
}'''
JS[6] = r'''
function slide(id,t0,fx){const u=EO(seg(t,t0,t0+.7));TR(id,`translate(${fx*(1-u)} 0)`);OP(id,cl(u*3,0,1));}
let t=0;
function scene(tt){
  t=tt;
  slide('paw',P.TA,-1200); slide('pbw',P.TB,1200); slide('pcw',P.TC,-1200);
  document.querySelectorAll('.wh').forEach(e=>{const cx=+e.dataset.cx,cy=+e.dataset.cy;e.setAttribute('transform',`rotate(${t*420} ${cx} ${cy})`);});
  TR('poles6',`translate(${-((t*220)%360)} 0)`);
  TR('steam6',`translate(${10*Math.sin(t*2.4)} ${-12*((t*1.1)%1)})`);
  const x=t-P.TS;
  OP('fc6',x<0?1:0); OP('fj6',x<0?0:1);
  TR('fj6',`translate(0 ${-(x<0?0:Math.sin(Math.PI*cl(x/.9))*95)})`);
  OP('hat6',x<0?0:1); const hx=Math.max(0,x); TR('hat6',`translate(${-70*hx} ${-250*hx+340*hx*hx}) translate(250 70) rotate(${hx*320}) translate(-250 -70)`);
  const bp=x<0?0:(x<.12?x/.12:Math.max(0,1-(x-.12)/.9));
  OP('bang6',Math.min(1,bp*3)); TR('bang6',`translate(650 110) scale(${.5+.7*bp}) translate(-650 -110)`); OP('flash6',bp);
  const rc=x<0?0:Math.exp(-x*8); TR('gun6',`translate(${22*rc} ${14*rc})`);
  document.querySelectorAll('.env').forEach(e=>{const k=+e.dataset.k;const u=EO(seg(t,P.TC+.35+k*.07,P.TC+1.1+k*.07));e.setAttribute('transform',`translate(${8*Math.sin(t*1.3+k)} ${10*Math.sin(t*1.7+k*1.3)-330*(1-u)})`);e.setAttribute('opacity',u>0?1:0);});
  const su=seg(t,P.TSTAMP,P.TSTAMP+.22); OP('stamp6',su>0?1:0); TR('stamp6',`translate(480 385) scale(${1+1.4*(1-EO(su))}) translate(-480 -385)`);
  camset(1+.03*E(t/D),540,960,0,0);
}
window.__scene=scene;'''
JS[7] = r'''
function scene(t){
  let j=0; P.H.forEach(h=>{j+=jolt(t,h,7,14);});
  TR('man7',`translate(0 ${-12*j})`);
  let bp=0; P.H.forEach(h=>{const x=t-h;if(x>=0&&x<1.3){bp=Math.max(bp,Math.min(1,x/.2)*(1-seg(x,.8,1.3)));}});
  OP('hb7',bp); TR('hb7',`translate(0 ${-24*bp})`);
  document.querySelectorAll('.pf').forEach(e=>{const k=+e.dataset.k;const u=EO(seg(t,.5+k*.28,.8+k*.28));const cx=470+(k%4)*150+56,cy=(k<4?330:530)+70;e.setAttribute('opacity',u);e.setAttribute('transform',`translate(${cx} ${cy}) scale(${.6+.4*u+.1*Math.sin(Math.PI*u)}) translate(${-cx} ${-cy})`);});
  const run=(t>P.B0&&t<P.B1)?1:0; TR('bl7',`translate(${run*1.8*Math.sin(t*90)} ${run*1.3*Math.sin(t*113)})`);
  camset(1+.14*E(t/D),540,1000,0,0);
}'''
JS[8] = r'''
function scene(t){
  const st=t<.45?1-t/.45:0;
  TR('scan8',`translate(0 ${(t*30)%7})`);
  OP('stu8',st>0?(.45+.5*rnd(Math.floor(t*60))):(.94+.06*Math.sin(t*55)));
  let j=0,lg=0,bp=0; P.H.forEach(h=>{j+=jolt(t,h,8,16);const x=t-h;if(x>=.15&&x<1.6)lg=Math.max(lg,Math.sin(Math.PI*cl((x-.15)/1.45)));if(x>=0&&x<1.3)bp=Math.max(bp,Math.min(1,x/.15)*(1-seg(x,.8,1.3)));});
  TR('guest8',`translate(0 ${-14*j})`);
  OP('hbs8',bp); TR('hbs8',`translate(0 ${-18*bp})`);
  document.querySelectorAll('.au').forEach(e=>{const k=+e.dataset.k;e.setAttribute('transform',`translate(0 ${-10*lg*Math.abs(Math.sin(t*14+k*1.7))-1.5*Math.sin(t*3+k)})`);});
  TR('ant8',`rotate(${1.6*Math.sin(t*1.7)} 540 420)`);
  OP('sign8',.85+.15*Math.sin(t*9)); OP('tvglow',.2+.05*Math.sin(t*7));
  document.querySelectorAll('.rw').forEach(e=>{const k=+e.dataset.k;e.setAttribute('opacity',.25+.6*Math.max(0,Math.sin(t*5-k*1.1)));});
  camset(1+.24*E(t/D),520,800,0,0);
}'''
JS[9] = r'''
function scene(t){
  const j=jolt(t,.9,7,14);
  TR('man9',`translate(0 ${-14*j})`);
  const x=t-.9; OP('hb9',x<0?0:Math.min(1,x/.15)*(1-seg(x,.7,1.2))); TR('hb9',`translate(0 ${-26*cl(x/1.2)})`);
  const pc=EO(seg(t,1.4,1.9)); TR('cal9',`translate(-50 0) translate(885 400) scale(${1+.12*Math.sin(Math.PI*pc)}) translate(-885 -400)`);
  OP('bub9',EO(seg(t,3.0,3.3)));
  document.querySelectorAll('.dt').forEach(e=>{const k=+e.dataset.k;const cx=[-48,0,48][k];const u=EO(seg(t,3.2+k*.55,3.5+k*.55));e.setAttribute('opacity',u);e.setAttribute('transform',`translate(${cx} 0) scale(${.3+.7*u}) translate(${-cx} 0)`);});
  document.querySelectorAll('.mt').forEach(e=>{const k=+e.dataset.k;e.setAttribute('transform',`translate(${12*Math.sin(t*.6+k)} ${-18*((t*.3+k*.07)%1)})`);});
  OP('beam9',.7+.3*seg(t,2.5,6));
  OP('flare9',.38*Math.pow(Math.sin(Math.PI*seg(t,P.TREL,D-.2)),2));
  camset(1+.17*E(t/D),540,1000,0,0);
}'''
JS[10] = r'''
function scene(t){
  TR('sun10',`translate(0 ${60*E(t/D)})`);
  TR('hat10',`rotate(${3.2*Math.sin(t*1.4)+1.2*Math.sin(t*3.1)} 560 1000)`);
  TR('birds10',`translate(${70*t-60} ${-10*t})`);
  TR('grass10',`translate(${6*Math.sin(t*1.2)} 0)`);
  TR('clouds10',`translate(${-16*t} 0)`);
  OP('t10a',EO(seg(t,P.T1,P.T1+.8))); OP('t10b',EO(seg(t,P.T2,P.T2+.8)));
  camset(1.07-.07*E(t/D),540,1100,0,0);
}'''

for k in range(1, 11):
    d = sc[k]
    P = dict(D=D[k], fin=.4, fout=.4 if k < 10 else 1.6); P.update(CUES.get(k, {}))
    if k == 4:
        P.update(dx=470 - 14*3.1, dy=740 + 6*3.1, mx=760, my=1300)
    defs = DEFS.replace('</defs>', d['defs'] + '</defs>')
    svg = (f'<svg id="s" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{defs}<g id="cam">{d["body"]}</g>'
           f'<rect width="{W}" height="{H}" fill="url(#vig)"/>{d["extra"]}{progress(d["idx"], 10)}<rect id="fade" width="{W}" height="{H}" fill="#000" opacity="1"/></svg>')
    script = COMMON.replace('__P__', json.dumps(P)) + JS[k] + '\nwindow.setT=function(t){common(t);scene(t);};setT(0);'
    open(f'a{k}.html', 'w').write(f'<!doctype html><html><body style="margin:0;background:#000;overflow:hidden">{svg}<script>{script}</script></body></html>')
json.dump([[f'a{k}', D[k]] for k in range(1, 11)], open('order.json', 'w'))
print('built', sum(D.values()), 's', round(sum(D.values())*24), 'frames')
