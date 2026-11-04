const V = new URLSearchParams(location.search).get('v') || 'a';
const F = "Montserrat,'DejaVu Sans',sans-serif";
let s = '';
s += `<rect width="1280" height="720" fill="#120A18"/><rect width="1280" height="720" fill="url(#skyBeach)" opacity=".35"/>`;
s += `<g filter="url(#bl16)" style="mix-blend-mode:screen">` + Array.from({length: 26}, (_, i) => { const x = rnd()*1280, y = rnd()*720, r = 20 + rnd()*70; return `<circle cx="${x}" cy="${y}" r="${r}" fill="${['#FFB35C','#B08AFF','#FFD58A','#5EC8FF'][i%4]}" opacity="${.08 + rnd()*.18}"/>`; }).join('') + `</g>`;
const GX = 880, GY = 380, R = 250;
const pts = Array.from({length: 11}, (_, i) => { const a = i/11*Math.PI*2, r = R*(.8 + .25*Math.sin(i*2.7)*Math.cos(i*1.3)); return [GX + Math.cos(a)*r, GY + Math.sin(a)*r*.86]; });
const P = pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
const fc = ['#F4D9A8','#E2B97E','#FBE9C6','#C9975E','#EBCB94','#D9AA72'];
pts.forEach((a, i) => { const b = pts[(i+1)%pts.length]; s += `<path d="M${GX} ${GY} L${a[0]} ${a[1]} L${b[0]} ${b[1]}Z" fill="${fc[i%6]}"/>`; });
const crack = `M${GX-170} ${GY-40} L${GX-90} ${GY-70} L${GX-40} ${GY-20} L${GX+30} ${GY-80} L${GX+110} ${GY-30} L${GX+170} ${GY+20} L${GX+90} ${GY+60} L${GX+20} ${GY+30} L${GX-50} ${GY+90} L${GX-120} ${GY+40}Z`;
def(`<clipPath id="cc"><path d="${crack}"/></clipPath>`);
let cos = `<rect x="${GX-260}" y="${GY-260}" width="520" height="520" fill="#05020F"/><circle cx="${GX}" cy="${GY}" r="200" fill="url(#nebA)"/><circle cx="${GX+60}" cy="${GY+20}" r="160" fill="url(#nebB)"/>`;
for (let i = 0; i < 500; i++) { const arm = i%2, u = Math.pow(rnd(), .7), a = u*4 + arm*Math.PI, r = 6 + u*150; cos += `<circle cx="${(GX + Math.cos(a)*r).toFixed(1)}" cy="${(GY + Math.sin(a)*r*.5).toFixed(1)}" r="${(1 + rnd()*2.2).toFixed(1)}" fill="${rnd()<.5?'#fff':'#9FE8FF'}"/>`; }
cos += `<circle cx="${GX}" cy="${GY}" r="40" fill="url(#glowWarm)"/>`;
for (const [x, y, c] of [[GX-110, GY-30, '#FF4A5A'], [GX+120, GY, '#4AFF8A'], [GX-20, GY+50, '#4A8AFF']]) cos += `<circle cx="${x}" cy="${y}" r="9" fill="${c}"/><circle cx="${x}" cy="${y}" r="26" fill="${c}" opacity=".35" filter="url(#bl8)"/>`;
s += `<g clip-path="url(#cc)">${cos}</g>`;
s += `<path d="${crack}" fill="none" stroke="#00E5FF" stroke-width="6" opacity=".9"/><path d="${crack}" fill="none" stroke="#00E5FF" stroke-width="30" opacity=".4" filter="url(#bl16)" style="mix-blend-mode:screen"/>`;
s += `<path d="M${P}Z" fill="none" stroke="#FFF6E0" stroke-width="5" opacity=".75"/>`;
s += `<g style="mix-blend-mode:screen"><circle cx="${GX}" cy="${GY}" r="380" fill="url(#glowC)" opacity=".35"/><ellipse cx="${GX-130}" cy="${GY-150}" rx="70" ry="18" fill="#fff" opacity=".5" transform="rotate(-25 ${GX-130} ${GY-150})" filter="url(#bl8)"/></g>`;
s += `<path d="M${GX-120} 760 Q${GX-140} ${GY+230} ${GX-60} ${GY+205} Q${GX} ${GY+190} ${GX+20} ${GY+260} L${GX+60} 760Z" fill="#E8B08A"/><path d="M${GX-80} ${GY+215} Q${GX-30} ${GY+200} ${GX} ${GY+225}" stroke="#F6D2B4" stroke-width="10" fill="none" opacity=".7"/>`;
const lit = rig({ amb: '#E6DCEE', k: [-1, 0], sh: '#05040F', shO: .4, shD: 60, rims: [{ k: [1, -.1], c: '#7FF4FF', w: 16, o: 1, glow: 1 }, { k: [-1, -.3], c: '#FFB070', w: 10, o: .6 }] });
s += `<g transform="translate(230,560) scale(1.2)" filter="url(#${lit})">${head({ ex: 'susto', turn: .55, look: [12, -2] })}</g>`;
const T = (x, y, t, sz, fill) => `<text x="${x}" y="${y}" font-family="${F}" font-weight="900" font-size="${sz}" fill="${fill}" stroke="#000" stroke-width="${sz/7}" paint-order="stroke" letter-spacing="-1">${t}</text>`;
if (V === 'a') { s += T(40, 120, 'UM UNIVERSO', 96, '#fff') + T(40, 220, 'AQUI DENTRO?', 96, '#00E5FF'); }
else { s += T(40, 120, 'NINGUÉM', 104, '#fff') + T(40, 225, 'NUNCA VIU', 104, '#00E5FF'); }
s += `<g transform="translate(1110,640)"><rect x="-110" y="-38" width="220" height="62" rx="31" fill="#000" opacity=".6" stroke="#00E5FF" stroke-width="4"/><text y="8" text-anchor="middle" font-family="${F}" font-weight="900" font-size="34" fill="#fff">10⁻²¹ m</text></g>`;
s += `<rect width="1280" height="720" fill="url(#vig)" opacity=".8"/>`;
document.getElementById('fdefs').innerHTML = D.join('');
document.getElementById('w').innerHTML = s;
window.__ready = true;
