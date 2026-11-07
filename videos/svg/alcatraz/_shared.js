/* ===================== personagens em silhueta ===================== */
// tipos: homem, mulher, crianca, soldado. Origem nos pés. Altura adulta ~ 1000.
function limbP(x, y, ang, l, w0, w1) {
  const c = Math.cos(ang * Math.PI / 180), sn = Math.sin(ang * Math.PI / 180), ex = x - sn * l, ey = y + c * l;
  return { d: `M${f1(x + c * w0)} ${f1(y + sn * w0)} L${f1(ex + c * w1)} ${f1(ey + sn * w1)} Q${f1(ex - sn * w1 * .9)} ${f1(ey + c * w1 * .9)} ${f1(ex - c * w1)} ${f1(ey - sn * w1)} L${f1(x - c * w0)} ${f1(y - sn * w0)} Q${f1(x + sn * w0 * .9)} ${f1(y - c * w0 * .9)} ${f1(x + c * w0)} ${f1(y + sn * w0)}Z`, ex, ey };
}
function sil(o) {
  const P = Object.assign({ x: 0, y: 0, s: 1, flip: 1, kind: 'homem', ph: 0, walk: 0, lean: 0, col: '#0d0a10', rim: null, rimK: [1, -.3], armF: null, armB: null, sit: 0, carry: false, light: false, shadow: .35 }, o);
  const kid = P.kind === 'crianca', sold = P.kind === 'soldado', fem = P.kind === 'mulher';
  const B = P.col, a = Math.sin(P.ph) * P.walk;
  const hip = kid ? 330 : 500, legL1 = kid ? 165 : 255, legL2 = kid ? 150 : 245, sh = kid ? 600 : 860, headR = kid ? 92 : 78;
  let s = '';
  // pernas
  const leg = (ang, sitK) => {
    const a1 = lerp(ang, -85, sitK), th = limbP(0, -hip, a1, legL1, kid ? 30 : 44, kid ? 24 : 34);
    const a2 = lerp(a1 - Math.max(0, -ang) * 1.2 - 4, 5, sitK), shn = limbP(th.ex, th.ey, a2, legL2, kid ? 23 : 33, kid ? 18 : 26);
    const bx = shn.ex, by = shn.ey, bw = kid ? .6 : 1;
    return `<path d="${th.d}" fill="${B}"/><path d="${shn.d}" fill="${B}"/><path d="M${f1(bx + 34 * bw)} ${f1(by - 30 * bw)} L${f1(bx + 34 * bw)} ${f1(by + 14 * bw)} L${f1(bx - 74 * bw)} ${f1(by + 14 * bw)} Q${f1(bx - 80 * bw)} ${f1(by - 12 * bw)} ${f1(bx - 46 * bw)} ${f1(by - 22 * bw)}Z" fill="${B}"/>`;
  };
  const sitY = P.sit * (legL1 * .95);
  let legs = leg(26 * a, P.sit) + leg(-26 * a, P.sit);
  if (fem) legs += `<path d="M-96 ${-hip - 40} L96 ${-hip - 40} L${f1(120 + 20 * Math.abs(a))} ${-hip + 330} L${f1(-120 - 20 * Math.abs(a))} ${-hip + 330}Z" fill="${B}"/>`;
  if (sold) legs += `<path d="M-100 ${-hip - 60} L100 ${-hip - 60} L118 ${-hip + 210} L-118 ${-hip + 210}Z" fill="${B}"/>`;
  // tronco
  const tw = kid ? 82 : 110;
  let up = `<path d="M${-tw * .5} ${-sh} C${-tw - 6} ${-sh + 40} ${-tw} ${-sh + 180} ${-tw * .8} ${-hip + 30} L${tw * .8} ${-hip + 30} C${tw} ${-sh + 180} ${tw + 6} ${-sh + 40} ${tw * .5} ${-sh}Z" fill="${B}"/>`;
  up += `<rect x="-26" y="${-sh - 50}" width="52" height="70" rx="18" fill="${B}"/>`;
  // cabeça
  const hy = -sh - 50 - headR * .85;
  up += `<ellipse cx="0" cy="${f1(hy)}" rx="${headR * .9}" ry="${headR}" fill="${B}"/><path d="M${-headR * .9} ${f1(hy)} L${-headR * 1.12} ${f1(hy + 18)} L${-headR * .85} ${f1(hy + 26)}Z" fill="${B}"/>`;
  if (fem) up += `<circle cx="${headR * .8}" cy="${f1(hy - 10)}" r="${headR * .55}" fill="${B}"/><path d="M${-headR} ${f1(hy - 20)} Q0 ${f1(hy - headR * 1.4)} ${headR} ${f1(hy - 20)}" fill="${B}"/>`;
  if (sold) up += `<path d="M${-headR * 1.35} ${f1(hy - headR * .55)} Q0 ${f1(hy - headR * 1.75)} ${headR * 1.35} ${f1(hy - headR * .55)} L${headR * 1.0} ${f1(hy - headR * .35)} L${-headR * 1.6} ${f1(hy - headR * .2)}Z" fill="${B}"/><rect x="${-headR}" y="${f1(hy - headR * .6)}" width="${headR * 2}" height="${headR * .35}" fill="${B}"/>`;
  if (P.kind === 'homem') up += `<path d="M${-headR * .95} ${f1(hy - 8)} Q${-headR * .7} ${f1(hy - headR * 1.25)} ${headR * .3} ${f1(hy - headR * 1.08)} Q${headR * 1.05} ${f1(hy - headR * .8)} ${headR * .92} ${f1(hy)}Z" fill="${B}"/>`;
  // braços
  const al = kid ? 130 : 185, fl = kid ? 115 : 165, aw = kid ? 22 : 30;
  const arm = (side, A, Bn) => { const u = limbP(side * (tw * .7), -sh + 30, A, al, aw, aw * .8), f = limbP(u.ex, u.ey, A + Bn, fl, aw * .8, aw * .7); return { s: `<path d="${u.d}" fill="${B}"/><path d="${f.d}" fill="${B}"/><circle cx="${f1(f.ex)}" cy="${f1(f.ey)}" r="${aw}" fill="${B}"/>`, x: f.ex, y: f.ey }; };
  const AB = P.armB || [-18 * a + 6, -16], AF = P.armF || (P.carry ? [-60, -70] : [18 * a - 4, 18 * a + 10]);
  const armB = arm(1, AB[0], AB[1]), armF = arm(-1, AF[0], AF[1]);
  let extra = '';
  if (P.carry) extra += `<g transform="translate(${f1(armF.x - 20)},${f1(armF.y + 120)}) scale(.62) rotate(-10)">${sil({ kind: 'crianca', col: B, shadow: 0, sit: .6, armF: [-40, -60], armB: [-40, -50] }).replace(/^<g[^>]*>/, '<g>')}</g>`;
  if (P.light) extra += `<g transform="translate(${f1(armF.x)},${f1(armF.y)})"><rect x="-14" y="-10" width="60" height="22" rx="6" fill="#22202a"/><path d="M46 -12 L1400 -260 L1400 360 L46 14Z" fill="url(#beamF)" opacity=".75"/></g>`;
  const body = `<g transform="translate(0,${f1(sitY)}) rotate(${f1(P.lean)} 0 ${-hip})">${armB.s}${up}${armF.s}${extra}</g>`;
  let rimF = '';
  if (P.rim) rimF = ` filter="url(#${rig({ amb: '#ffffff', k: [-P.rimK[0], -P.rimK[1]], shO: 0, rims: [{ c: P.rim, k: P.rimK, w: 7, o: 1, glow: true }] })})"`;
  return `<g transform="translate(${f1(P.x)},${f1(P.y)}) scale(${f1(P.s * P.flip * 1000) / 1000},${f1(P.s * 1000) / 1000})">${P.shadow ? `<ellipse cx="0" cy="8" rx="${kid ? 110 : 170}" ry="24" fill="#000" opacity="${P.shadow}" filter="url(#b12)"/>` : ''}<g${rimF}>${legs}${body}</g></g>`;
}

function hug(o) {  // sentado no chão abraçando os joelhos, de perfil (virado para a direita)
  const P = Object.assign({ x: 0, y: 0, s: 1, flip: 1, col: '#0b0d14', rim: '#AFC6FF', rimK: [1, -.6], adult: 0, breath: 0, eyes: 0, look: 0 }, o);
  const a = P.adult, B = P.col, hr = lerp(88, 62, a), L = lerp(1, 1.45, a), br = P.breath * 5;
  const sh = [lerp(-30, -50, a), lerp(-250, -340, a) - br], kn = [lerp(95, 150, a), lerp(-205, -290, a)], ft = [lerp(140, 215, a), 0], hip = [-50, -40];
  let s = '';
  s += `<path d="M${hip[0] - 70} 0 Q${hip[0] - 110} ${f1(sh[1] * .5)} ${sh[0] - 40} ${f1(sh[1] + 10)} Q${sh[0] + 20} ${f1(sh[1] - 40)} ${sh[0] + 70} ${f1(sh[1] + 10)} L${kn[0] - 30} ${kn[1] + 40} L${hip[0] + 60} -10 L${hip[0] + 60} 0Z" fill="${B}"/>`; // costas e tronco
  s += `<path d="M${hip[0]} -60 L${kn[0]} ${kn[1] - 28} Q${kn[0] + 36} ${kn[1] - 10} ${kn[0] + 30} ${kn[1] + 30} L${ft[0] - 10} -26 L${ft[0] + 40} -18 Q${ft[0] + 50} 0 ${ft[0] + 30} 4 L${ft[0] - 60} 4 L${hip[0]} 0Z" fill="${B}"/>`; // perna
  s += `<path d="M${sh[0] + 10} ${f1(sh[1] + 20)} Q${kn[0] - 30} ${kn[1] + 30} ${kn[0] + 30} ${kn[1] + 70} L${kn[0] + 34} ${kn[1] + 100} Q${kn[0] - 40} ${kn[1] + 80} ${sh[0] - 20} ${f1(sh[1] + 70)}Z" fill="${B}"/><circle cx="${kn[0] + 30}" cy="${kn[1] + 86}" r="${f1(26 * L * .8)}" fill="${B}"/>`; // braço
  const hx = sh[0] + lerp(70, 60, a) + P.look * 10, hy = sh[1] - hr * .55 + br;
  s += `<ellipse cx="${f1(hx)}" cy="${f1(hy)}" rx="${f1(hr)}" ry="${f1(hr * 1.02)}" fill="${B}"/><path d="M${f1(hx + hr * .92)} ${f1(hy - 4)} L${f1(hx + hr * 1.14)} ${f1(hy + 16)} L${f1(hx + hr * .88)} ${f1(hy + 24)}Z" fill="${B}"/>`;
  s += `<rect x="${f1(hx - 22)}" y="${f1(hy + hr * .6)}" width="44" height="${f1(hr * .7)}" fill="${B}"/>`;
  if (P.eyes) s += `<circle cx="${f1(hx + hr * .62)}" cy="${f1(hy - 4)}" r="${f1(hr * .075)}" fill="#DDE8FF" opacity="${op(P.eyes)}"/>`;
  const id = rig({ amb: '#ffffff', k: [-P.rimK[0], -P.rimK[1]], shO: 0, rims: [{ c: P.rim, k: P.rimK, w: 7, o: 1, glow: true }] });
  return `<g transform="translate(${f1(P.x)},${f1(P.y)}) scale(${f1(P.s * P.flip * 1000) / 1000},${f1(P.s * 1000) / 1000})"><ellipse cx="40" cy="8" rx="230" ry="28" fill="#000" opacity=".4" filter="url(#b12)"/><g filter="url(#${id})">${s}</g></g>`;
}
/* ===================== objetos ===================== */
function bible(x, y, s, open = 0, rot = 0, glow = 0) {
  let o = `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})">`;
  if (glow) o += `<ellipse cx="0" cy="0" rx="420" ry="300" fill="url(#gWarm)" opacity="${op(glow)}"/>`;
  o += `<ellipse cx="10" cy="150" rx="300" ry="40" fill="#000" opacity=".45" filter="url(#b12)"/>`;
  if (open < .5) {
    o += `<path d="M-230 -150 L230 -150 Q250 -150 250 -130 L250 130 Q250 150 230 150 L-230 150Z" fill="#E9DFC6"/><path d="M-230 -150 L230 -150 L230 120 L-230 120Z" fill="#3A1C14"/>`;
    for (let i = 0; i < 6; i++) o += `<line x1="-226" y1="${124 + i * 4}" x2="244" y2="${124 + i * 4}" stroke="#C9A86A" stroke-width="1.5" opacity=".7"/>`;
    o += `<path d="M-238 -158 L238 -158 Q252 -158 252 -144 L252 110 Q252 124 238 124 L-238 124 Q-252 124 -252 110 L-252 -144 Q-252 -158 -238 -158Z" fill="#4A2216" stroke="#2A0E08" stroke-width="5"/>`;
    o += `<path d="M-252 -150 L-210 -150 L-210 118 L-252 118Z" fill="#000" opacity=".25"/><rect x="-200" y="-130" width="420" height="230" rx="6" fill="none" stroke="#B88A3A" stroke-width="4" opacity=".75"/>`;
    o += `<path d="M10 -100 L10 70 M-40 -40 L60 -40" stroke="#D9AE52" stroke-width="12" stroke-linecap="round"/>`;
  } else {
    const k = (open - .5) * 2;
    o += `<path d="M0 -150 Q-120 -175 -300 -150 L-300 140 Q-120 115 0 140Z" fill="#F0E6CC" stroke="#8a7a5a" stroke-width="2"/><path d="M0 -150 Q120 -175 300 -150 L300 140 Q120 115 0 140Z" fill="#F4EBD3" stroke="#8a7a5a" stroke-width="2"/>`;
    for (let i = 0; i < 14; i++) { o += `<line x1="-270" y1="${-120 + i * 17}" x2="-30" y2="${-118 + i * 17}" stroke="#6a5a40" stroke-width="3" opacity=".35"/><line x1="30" y1="${-118 + i * 17}" x2="270" y2="${-120 + i * 17}" stroke="#6a5a40" stroke-width="3" opacity=".35"/>`; }
    o += `<path d="M0 -150 L0 140" stroke="#9a8a6a" stroke-width="4"/>`;
  }
  return o + '</g>';
}
const SNOW = Array.from({ length: 160 }, () => ({ x: R() * 2400 - 240, y: R() * 1300, r: 1.5 + R() * 4.5, s: R() * 6, v: .5 + R() }));
const snow = (t, k = 1, wind = 40) => SNOW.map(q => { const y = (q.y + t * 70 * q.v) % 1300 - 110, x = (q.x + t * wind * q.v + Math.sin(t + q.s) * 25 + 2400) % 2400 - 240; return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${q.r}" fill="#EEF3FF" opacity="${op((.35 + .5 * (q.r / 6)) * k)}"/>`; }).join('');
const DUST = Array.from({ length: 70 }, () => ({ x: R() * 1920, y: R() * 1080, r: 1.2 + R() * 3.5, s: R() * 6 }));
const dust = (t, col = '#FFE6B0', k = 1) => DUST.map(q => `<circle cx="${f1((q.x + Math.sin(t * .4 + q.s) * 40 + t * 6) % 1920)}" cy="${f1((q.y - t * 10 * (.5 + q.s / 6) + 1080 * 6) % 1080)}" r="${q.r}" fill="${col}" opacity="${op((.2 + .3 * Math.sin(t * 2 + q.s)) * k)}"/>`).join('');
const VIG = (k = 1) => `<rect width="1080" height="1920" fill="url(#vig)" opacity="${k}"/>`;
const GRAIN = t => { const j = Math.floor(t * 24); return `<rect x="-200" y="-200" width="1480" height="2320" fill="url(#noiseP)" opacity=".06" transform="translate(${(j * 37) % 200 - 100},${(j * 53) % 200 - 100})"/>`; };
const FADE = (k, c = '#000') => k > 0 ? `<rect width="1080" height="1920" fill="${c}" opacity="${op(k)}"/>` : '';
function bars(x0, x1, y0, y1, n, col = '#1b1d24', hi = '#7D8FB8') {
  let o = ''; const st = (x1 - x0) / (n - 1);
  for (let i = 0; i < n; i++) { const x = x0 + i * st; o += `<rect x="${f1(x - 14)}" y="${y0}" width="28" height="${y1 - y0}" rx="8" fill="${col}"/><rect x="${f1(x - 10)}" y="${y0}" width="6" height="${y1 - y0}" fill="${hi}" opacity=".45"/>`; }
  o += `<rect x="${x0 - 40}" y="${y0 + 40}" width="${x1 - x0 + 80}" height="26" rx="8" fill="${col}"/><rect x="${x0 - 40}" y="${y1 - 140}" width="${x1 - x0 + 80}" height="26" rx="8" fill="${col}"/>`;
  return o;
}
// cela: parede de pedra, janela alta com grade, luz da lua
function cell(t, o = {}) {
  const day = o.day || 0, season = o.season ?? -1, tally = o.tally || 0;
  const wall = mix('#141826', '#3A3A44', day), wallL = mix('#20263A', '#5A5A66', day);
  let s = `<rect x="-600" y="-400" width="3200" height="1900" fill="${wall}"/>`;
  for (let r = 0; r < 14; r++) for (let c = 0; c < 16; c++) { const x = -600 + c * 200 + (r % 2) * 100, y = -400 + r * 100; s += `<rect x="${x + 4}" y="${y + 4}" width="192" height="92" rx="10" fill="${wallL}" opacity="${f1(.25 + ((r * 7 + c * 3) % 5) * .06)}"/>`; }
  // janela
  const wx = 1180, wy = 120, ww = 300, wh = 220;
  const sky = season < 0 ? mix('#3A5A9A', '#BFD8FF', day) : ['#DDE8F8', '#8FC0E8', '#F2B880', '#B8C8D8'][season % 4];
  s += `<rect x="${wx - 20}" y="${wy - 20}" width="${ww + 40}" height="${wh + 40}" fill="#0A0C14"/><rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="${sky}"/>`;
  if (season === 0 || season === 3) s += Array.from({ length: 18 }, (_, i) => `<circle cx="${f1(wx + (i * 53 + t * 30) % ww)}" cy="${f1(wy + (i * 37 + t * 60) % wh)}" r="3" fill="#fff"/>`).join('');
  if (season === 1) s += `<path d="M${wx} ${wy + wh} Q${wx + 80} ${wy + 120} ${wx + 160} ${wy + wh} Q${wx + 230} ${wy + 140} ${wx + ww} ${wy + wh}Z" fill="#4A7A3A"/>`;
  for (let i = 1; i < 5; i++) s += `<rect x="${wx + i * ww / 5 - 7}" y="${wy}" width="14" height="${wh}" fill="#0A0C14"/>`;
  s += `<rect x="${wx}" y="${wy + wh / 2 - 7}" width="${ww}" height="14" fill="#0A0C14"/>`;
  // feixe de luz
  s += `<path d="M${wx} ${wy} L${wx + ww} ${wy} L${wx - 80} 1100 L${wx - 640} 1100Z" fill="url(#beamM)" opacity="${f1(.55 + .25 * day)}"/>`;
  s += `<path d="M${wx} ${wy} L${wx + ww} ${wy} L${wx - 80} 1100 L${wx - 640} 1100Z" fill="url(#bars8)" opacity=".35"/>`;
  // chão
  s += `<rect x="-600" y="900" width="3200" height="700" fill="${mix('#0D1018', '#2A2A30', day)}"/><rect x="-600" y="900" width="3200" height="10" fill="#000" opacity=".4"/>`;
  s += `<path d="M${wx - 640} 1100 L${wx - 80} 1100 L${wx + 20} 900 L${wx - 420} 900Z" fill="#9AB4FF" opacity="${f1(.12 + .08 * day)}"/>`;
  // marcas na parede (contagem dos dias)
  let tm = '';
  for (let i = 0; i < tally; i++) { const g = Math.floor(i / 5), j = i % 5, gx = 260 + (g % 9) * 82, gy = 420 + Math.floor(g / 9) * 90; tm += j < 4 ? `<line x1="${gx + j * 14}" y1="${gy}" x2="${gx + j * 14 + 2}" y2="${gy + 56}" stroke="#C8CCD8" stroke-width="5" stroke-linecap="round" opacity=".6"/>` : `<line x1="${gx - 8}" y1="${gy + 44}" x2="${gx + 56}" y2="${gy + 10}" stroke="#C8CCD8" stroke-width="5" stroke-linecap="round" opacity=".6"/>`; }
  return s + tm;
}
// mapa estilizado da península coreana (lon/lat → px)
const PJ = (lon, lat) => [f1((lon - 119.5) * 300), f1((43.6 - lat) * 370)];
const KOREA = [[124.3, 39.9], [125.5, 40.6], [126.9, 41.7], [128.1, 41.5], [128.9, 42.0], [129.7, 42.45], [130.65, 42.4], [129.9, 41.6], [129.7, 40.9], [128.6, 40.1], [127.6, 39.7], [127.4, 39.2], [128.4, 38.6], [129.0, 37.8], [129.45, 36.8], [129.45, 35.9], [129.3, 35.3], [129.0, 35.05], [128.4, 34.85], [127.5, 34.6], [126.5, 34.4], [126.3, 35.1], [126.6, 35.9], [126.8, 36.7], [126.4, 37.0], [126.6, 37.45], [126.1, 37.75], [125.3, 37.7], [124.75, 38.1], [125.15, 38.65], [125.0, 39.2], [124.7, 39.6]];
const DMZ = [[126.1, 37.75], [126.65, 37.8], [127.1, 38.2], [127.8, 38.3], [128.35, 38.6]];
const CHINA = [[117, 45], [131.5, 45], [131.2, 43.3], [130.65, 42.4], [129.7, 42.45], [128.9, 42.0], [128.1, 41.5], [126.9, 41.7], [125.5, 40.6], [124.3, 39.9], [123.0, 39.6], [121.9, 39.05], [121.2, 38.75], [121.5, 39.4], [122.2, 40.4], [121.0, 40.9], [119.5, 39.9], [118.0, 39.2], [117, 39]];
const JAPAN = [[129.6, 33.2], [130.9, 33.9], [131.9, 34.6], [133.5, 35.5], [135.5, 35.6], [137, 37], [140, 40], [140, 45], [145, 45], [145, 30], [130.2, 30.8], [129.8, 32.6]];
const poly = (pts, attr) => `<path d="M${pts.map(p => PJ(...p).join(' ')).join(' L')}Z" ${attr}/>`;
const NK_CLIP = [...KOREA.slice(0, 12), ...DMZ.slice().reverse().slice(0, 5).reverse().reverse(), ...KOREA.slice(26)];
function nkPoly() { // norte = da fronteira até a DMZ
  const north = [...KOREA.slice(0, 13), ...DMZ.slice().reverse(), ...KOREA.slice(27)];
  return north;
}
const CITIES = [ // lon, lat, peso (luz)
  [126.98, 37.56, 1.0], [129.05, 35.17, .7], [128.6, 35.87, .6], [126.85, 35.16, .45], [127.38, 36.35, .5], [127.15, 37.3, .7], [126.7, 37.45, .7], [127.5, 37.7, .4], [128.9, 37.75, .3], [129.35, 36.0, .35], [126.5, 36.8, .3], [127.9, 36.6, .3], [128.2, 35.2, .35],
  [121.6, 38.92, .8], [123.43, 41.8, .9], [124.4, 40.13, .45], [122.1, 41.1, .4], [125.3, 43.85, .7], [126.6, 45, .5], [130.4, 33.6, .8], [129.9, 33.0, .4], [132.5, 34.4, .6], [118.2, 39.6, .6], [117.2, 39.1, .9], [120.4, 36.1, .9], [119.5, 37.4, .4]];

