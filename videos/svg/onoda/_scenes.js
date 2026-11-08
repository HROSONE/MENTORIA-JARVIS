const SH = N.s.map(x => [x.k, x.a, x.b]);
const shotAt = t => SH.find(s => t >= s[1] && t < s[2]) || SH[SH.length - 1];
const loc = (t, id) => { const s = SH.find(x => x[0] === id); return { L: t - s[1], d: s[2] - s[1], k: (t - s[1]) / (s[2] - s[1]) }; };
const HH = (t, k = 1) => [3 * k * noise1(t * 1.3, 1), 3 * k * noise1(t * 1.1, 4)];
const GND = 1500;
/* ---------- texturas ---------- */
let PAPER = '', HATCH = '';
(function () {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); const im = x.createImageData(512, 512);
  const r = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };
  const vn = (u, v, s) => { const i = Math.floor(u / s), j = Math.floor(v / s), fu = u / s - i, fv = v / s - j, a = r(i % (512 / s), j % (512 / s)), b = r((i + 1) % (512 / s), j % (512 / s)), cc = r(i % (512 / s), (j + 1) % (512 / s)), d = r((i + 1) % (512 / s), (j + 1) % (512 / s)), su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv); return a + (b - a) * su + (cc - a) * sv + (a - b - cc + d) * su * sv; };
  for (let j = 0; j < 512; j++) for (let i = 0; i < 512; i++) { const n = vn(i, j, 64) * .45 + vn(i, j, 16) * .3 + vn(i, j, 4) * .15 + Math.random() * .1, k = (j * 512 + i) * 4, g = Math.floor(170 + n * 85); im.data[k] = g; im.data[k + 1] = Math.floor(g * .97); im.data[k + 2] = Math.floor(g * .9); im.data[k + 3] = 255; }
  x.putImageData(im, 0, 0);
  for (let f = 0; f < 260; f++) { x.strokeStyle = `rgba(90,70,50,${.05 + Math.random() * .08})`; x.lineWidth = .6 + Math.random(); x.beginPath(); const a = Math.random() * 512, b = Math.random() * 512, an = Math.random() * 6.3, l = 8 + Math.random() * 30; x.moveTo(a, b); x.quadraticCurveTo(a + Math.cos(an) * l / 2 + 4, b + Math.sin(an) * l / 2, a + Math.cos(an) * l, b + Math.sin(an) * l); x.stroke(); }
  PAPER = c.toDataURL('image/jpeg', .85);
})();
const TEXTURE = `<rect x="-100" y="-100" width="1280" height="2120" fill="url(#paperP)" style="mix-blend-mode:multiply" opacity=".55"/><rect x="-100" y="-100" width="1280" height="2120" fill="url(#paperP)" style="mix-blend-mode:soft-light" opacity=".5"/>`;


/* ---------- rua à noite ---------- */
/* ===================== Onoda: 29 anos numa guerra que já tinha acabado ===================== */
const bump = x => x < 0 || x > 1 ? 0 : Math.sin(x * Math.PI);
const OLN = '#1A1220', SK = '#E8BC94', SKD = '#C89A72';
const AT = k => S[k].a;
const CUTS = ['n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9'].map(AT);
function limb(x0, y0, x1, y1, w0, w1, fill, sw = 6) {
  const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a), bx = (x0 + x1) / 2, by = (y0 + y1) / 2, wm = (w0 + w1) / 2 * 1.05;
  return `<path d="M${f1(x0 + nx * w0)} ${f1(y0 + ny * w0)} Q${f1(bx + nx * wm)} ${f1(by + ny * wm)} ${f1(x1 + nx * w1)} ${f1(y1 + ny * w1)} A${w1} ${w1} 0 0 0 ${f1(x1 - nx * w1)} ${f1(y1 - ny * w1)} Q${f1(bx - nx * wm)} ${f1(by - ny * wm)} ${f1(x0 - nx * w0)} ${f1(y0 - ny * w0)} A${w0} ${w0} 0 0 0 ${f1(x0 + nx * w0)} ${f1(y0 + ny * w0)}Z" fill="${fill}" stroke="${OLN}" stroke-width="${sw}" stroke-linejoin="round"/>`;
}
function fist(x, y, rot, item = '', sk = SK) { return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(.82)">${item}<rect x="-34" y="-30" width="68" height="62" rx="26" fill="${sk}" stroke="${OLN}" stroke-width="6"/><path d="M-20 -6 V22 M0 -8 V24 M20 -6 V22" stroke="${SKD}" stroke-width="5"/><ellipse cx="-30" cy="-6" rx="14" ry="22" fill="${sk}" stroke="${OLN}" stroke-width="5"/></g>`; }
const TAG = (x, y, txt, s = 1, col = '#FFE04A') => `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(s * 100) / 100})"><rect x="${-txt.length * 15 - 20}" y="-38" width="${txt.length * 30 + 40}" height="64" rx="14" fill="#0A0806" opacity=".8"/><text x="0" y="12" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="44" fill="${col}">${txt}</text></g>`;
/* ---------- personagens (busto, espaço da cabeça; cabeça anime) ---------- */
// Onoda: cabelo preto curto, depois cabelo e barba crescidos; quepe de campanha; uniforme cáqui (rasgado com os anos)
const ON = (age) => ({ skin: SK, hair: '#1A1410', hairStyle: age > .4 ? 'grande' : 'curto', iris: '#3A2A1A', eyeStyle: 'sharp', eyeH: 46, browW: 13, browA: 14, nose: 'sombra', mouth: 'reto', chin: 1.08, faceW: 1.05, stache: age > .5 ? 1 : 0 });
const MAJ = { skin: '#E8C0A0', hair: '#E8E8E8', hairStyle: 'curto', iris: '#3A2A1A', eyeStyle: 'narrow', eyeH: 40, glasses: 1, browW: 10, browC: '#E8E8E8', stache: 1, mouth: 'leve' };
const MAJY = { skin: '#E8C0A0', hair: '#1A1410', hairStyle: 'curto', iris: '#3A2A1A', eyeStyle: 'narrow', eyeH: 44, browW: 10, mouth: 'reto', stache: 1 };
const SUZ = { skin: '#F0C8A0', hair: '#2A1A12', hairStyle: 'baguncado', iris: '#4A3020', eyeH: 58, mouth: 'grande', emo: 'feliz' };
function capKepi(col = '#6A6A3A') { return `<g transform="translate(0,-112)"><path d="M-112 30 Q-118 -70 0 -76 Q118 -70 112 30Z" fill="${col}" stroke="${OLN}" stroke-width="6"/><path d="M-20 30 L150 46 L140 66 L-20 54Z" fill="${mix(col, '#000000', .35)}" stroke="${OLN}" stroke-width="5"/><circle cx="0" cy="-20" r="16" fill="#E8C040" stroke="${OLN}" stroke-width="4"/></g>`; }
function bustP(t, o) {
  const F = o.face, uni = o.uni || '#7A7A48', ud = mix(uni, '#000000', .25), torn = o.torn || 0;
  let g = '';
  g += `<path d="M-52 228 Q-190 236 -222 300 Q-236 330 -232 420 L-200 1100 L200 1100 L232 420 Q236 330 222 300 Q190 236 52 228Z" fill="${uni}" stroke="${OLN}" stroke-width="7"/>`;
  g += `<path d="M-64 230 L0 330 L64 230 L44 226 L0 296 L-44 226Z" fill="${ud}" stroke="${OLN}" stroke-width="5"/><path d="M0 330 V1100" stroke="${ud}" stroke-width="6"/>${[420, 560, 700].map(y => `<circle cx="14" cy="${y}" r="9" fill="#C8A040" stroke="${OLN}" stroke-width="3"/>`).join('')}<rect x="-170" y="400" width="100" height="76" rx="8" fill="none" stroke="${ud}" stroke-width="6"/><rect x="70" y="400" width="100" height="76" rx="8" fill="none" stroke="${ud}" stroke-width="6"/>`;
  if (o.rank) g += `<rect x="-220" y="300" width="60" height="26" fill="#C8282E" stroke="${OLN}" stroke-width="4"/><circle cx="-230" cy="315" r="6" fill="#E8C040"/><circle cx="-205" cy="315" r="6" fill="#E8C040"/>`;
  if (torn > 0) g += `<path d="M-260 600 l40 30 l-20 30 l50 20 M180 760 l40 -20 l10 40 l30 -10 M-120 900 l30 40 l-30 30" stroke="${OLN}" stroke-width="5" fill="none" opacity="${op(torn)}"/><path d="M-220 640 l40 20 l-30 40Z M200 800 l30 10 l-10 30Z" fill="#3A2A18" opacity="${op(torn)}"/><path d="M-280 1000 Q-200 860 -100 980 Q0 860 100 980 Q200 860 280 1000 L290 1100 L-290 1100Z" fill="#000" opacity="${op(torn * .15)}"/>`;
  const hh = ANI.head(Object.assign({}, F, { emo: o.emo || F.emo || 'neutro', mouth: o.mouth || F.mouth, look: o.look || 0 }, o.blink ? { eyeStyle: 'line', emo: 'feliz2' } : {})); def(ANI.flush());
  g += `<g transform="translate(${f1(o.hx || 0)},${f1((o.hy || 0) + 20)}) rotate(${f1(o.tilt || 0)}) scale(1.1)">${hh}${o.beard ? `<path d="M-74 92 Q-80 200 0 230 Q80 200 74 92 Q40 140 0 140 Q-40 140 -74 92Z" fill="#1A1410" stroke="${OLN}" stroke-width="5" opacity="${op(o.beard)}"/>` : ''}${o.dirt ? `<ellipse cx="-50" cy="60" rx="30" ry="18" fill="#5A4030" opacity="${op(o.dirt * .35)}"/><ellipse cx="60" cy="-20" rx="24" ry="14" fill="#5A4030" opacity="${op(o.dirt * .3)}"/>` : ''}${o.cap ? capKepi(o.capCol) : ''}${o.tear ? `<path d="M${-40} 50 Q-46 110 -40 150" stroke="#8AD0FF" stroke-width="12" fill="none" stroke-linecap="round" opacity="${op(o.tear)}"/><path d="M40 50 Q46 110 40 150" stroke="#8AD0FF" stroke-width="12" fill="none" stroke-linecap="round" opacity="${op(o.tear)}"/>` : ''}</g>`;
  if (o.over) g += o.over;
  const hL = o.handL || [-230, 800], hR = o.handR || [230, 800], eL = o.elbowL || [-262, 560], eR = o.elbowR || [262, 560];
  g += limb(-200, 300, eL[0], eL[1], 40, 34, uni) + limb(eL[0], eL[1], hL[0], hL[1], 34, 29, uni) + fist(hL[0], hL[1], o.rotL || 0, o.itemL || '');
  g += limb(200, 300, eR[0], eR[1], 40, 34, ud) + limb(eR[0], eR[1], hR[0], hR[1], 34, 29, ud) + fist(hR[0], hR[1], o.rotR || 0, o.itemR || '');
  if (o.front) g += o.front;
  return g;
}
const RIFLE = `<g transform="rotate(-6)"><rect x="-14" y="-700" width="28" height="640" rx="6" fill="#5A3A20" stroke="${OLN}" stroke-width="5"/><rect x="-8" y="-880" width="16" height="200" fill="#3A3A40" stroke="${OLN}" stroke-width="4"/><path d="M-14 -60 L-40 120 L30 140 L14 -60Z" fill="#6A4428" stroke="${OLN}" stroke-width="5"/><rect x="10" y="-420" width="26" height="60" fill="#2A2A30" stroke="${OLN}" stroke-width="3"/></g>`;
const SWORD = `<g><rect x="-10" y="-90" width="20" height="120" rx="6" fill="#2A1A10" stroke="${OLN}" stroke-width="4"/><path d="M-26 -96 H26" stroke="#C8A040" stroke-width="12"/><path d="M-8 -100 L-8 -560 Q8 -580 10 -560 L10 -100Z" fill="#DCE0E8" stroke="${OLN}" stroke-width="4"/></g>`;
const LEAF = (s = 1, rot = 0) => `<g transform="rotate(${rot}) scale(${s})"><rect x="-120" y="-80" width="240" height="160" fill="#F4ECD8" stroke="${OLN}" stroke-width="5"/><text x="0" y="-26" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="30" fill="#C8282E">A GUERRA</text><text x="0" y="14" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="30" fill="#C8282E">ACABOU</text><text x="0" y="52" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-size="20" fill="#3A2A10">15 · AGO · 1945</text></g>`;
/* ---------- selva ---------- */
function jungle(t, o = {}) {
  const night = o.night || 0, sky1 = mix('#9ACBE0', '#0A1420', night), sky2 = mix('#D8ECD0', '#1A2A2A', night);
  const id = nid('js'); def(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky1}"/><stop offset="1" stop-color="${sky2}"/></linearGradient>`);
  let s = `<rect x="-3000" y="-3000" width="8000" height="8000" fill="url(#${id})"/>`;
  const L = (dark, n, y0, sz, seed) => { let r = ''; for (let i = 0; i < n; i++) { const x = -1400 + ((i * 397 + seed * 131) % 4000), y = y0 + ((i * 211 + seed) % 300), sw = Math.sin(t * 1.2 + i) * 6; r += `<g transform="translate(${x},${y}) rotate(${f1(sw)})">${[0, 1, 2, 3, 4].map(k => `<path d="M0 0 Q${f1((k - 2) * sz * .5)} ${f1(-sz * .8)} ${f1((k - 2) * sz * .9)} ${f1(-sz * .2)}" stroke="${dark}" stroke-width="${f1(sz * .22)}" fill="none" stroke-linecap="round"/>`).join('')}</g>`; } return r; };
  s += `<g opacity="${op(1 - night * .4)}">${L(mix('#5A8A5A', '#0E1A14', night), 24, 600, 260, 1)}</g>`;
  s += Array.from({ length: 10 }, (_, i) => { const x = -1200 + i * 420 + (i % 3) * 60; return `<path d="M${x} 2600 Q${x + 30} 1200 ${x - 20} 200" stroke="${mix('#4A3A28', '#0A0A08', night)}" stroke-width="${60 + (i % 3) * 20}" fill="none"/>`; }).join('');
  s += L(mix('#2E6A3A', '#08140E', night), 30, 900, 340, 7);
  s += `<rect x="-3000" y="1500" width="8000" height="3000" fill="${mix('#3A5A2A', '#0A100A', night)}"/>`;
  s += L(mix('#1E4A2A', '#050A08', night), 26, 1650, 420, 13);
  if (night > 0) s += Array.from({ length: 30 }, (_, i) => `<circle cx="${-800 + (i * 173) % 2600}" cy="${200 + (i * 97) % 1200}" r="3" fill="#E8F06A" opacity="${op(night * (.3 + .7 * Math.max(0, Math.sin(t * 3 + i))))}"/>`).join('');
  return s;
}
// calendário diegético (pregado na árvore)
function calendar(x, y, year, s = 1, flip = 0) { return `<g transform="translate(${x},${y}) scale(${s}) rotate(${f1(-4 + flip * 8)})"><rect x="-110" y="-120" width="220" height="230" rx="10" fill="#F4ECD8" stroke="${OLN}" stroke-width="6"/><rect x="-110" y="-120" width="220" height="60" rx="10" fill="#7A1A1A" stroke="${OLN}" stroke-width="6"/><circle cx="-60" cy="-120" r="10" fill="#3A3A40"/><circle cx="60" cy="-120" r="10" fill="#3A3A40"/><text x="0" y="40" text-anchor="middle" font-family="'DejaVu Sans Mono',monospace" font-weight="700" font-size="72" fill="${OLN}">${year}</text></g>`; }
const TIGHT = (t, k, zx = 540, zy = 1000, z = 1) => { const [hx, hy] = HH(t, .7); setCam(zx + hx + 16 * Math.sin(t * .7), zy + hy, z + .04 * Math.sin(t * .5), .5 * Math.sin(t * .4), [540, 960, 1]); };
/* ====================== CENAS ====================== */
// n1: gancho — ele de rifle, encostado na árvore, o calendário vira de 1945 até 1974
function s1(t) {
  const { L, d, k } = loc(t, 'n1'); TIGHT(t, k, 560, lerp(1080, 980, k), lerp(1.0, 1.15, easeInOut(k)));
  const yr = Math.round(lerp(1945, 1974, easeInOut(range(L, .2, 4.4)))), age = (yr - 1945) / 29;
  let s = lay(.5, jungle(t, { night: .6 }));
  s += lay(.8, `<path d="M840 2600 Q870 1200 820 0" stroke="#2A1E14" stroke-width="150" fill="none"/>` + calendar(820, 720, yr, 1.15, (yr % 2)));
  s += lay(1, `<g transform="translate(380,1060) scale(1.0)">${bustP(t, { face: ON(age), cap: 1, emo: 'neutro', torn: age, beard: age > .6 ? (age - .6) * 2.5 : 0, dirt: age, handR: [190, 700], elbowR: [320, 560], itemR: RIFLE, rotR: 0, look: .4 * Math.sin(L * 2) })}</g>`);
  if (L > 4.3) s += `<g transform="translate(540,300)">${TAG(0, 0, '29 ANOS', 1.6 + .2 * bump(range(L, 4.3, 4.7)), '#FF6A3A')}</g>`;
  return s + VIG(.95);
}
// n2: dezembro de 1944, o major dá a ordem: NUNCA SE RENDA
function s2(t) {
  const { L, d, k } = loc(t, 'n2'), [hx, hy] = HH(t, .5);
  const pan = easeInOut(range(L, 3.6, 4.6));
  setCam(lerp(420, 700, pan) + hx, 1060 + hy, lerp(.82, .78, k), 0, [540, 960, 1]);
  let s = `<rect x="-2000" y="-2000" width="6000" height="6000" fill="#3A2E24"/>` + lay(1, `<rect x="-600" y="200" width="2400" height="1200" fill="#5A4636"/><rect x="-300" y="300" width="560" height="380" fill="#E8DCC0" stroke="${OLN}" stroke-width="6"/><path d="M-260 360 q120 -40 240 20 t220 10 M-240 480 q160 40 300 -20 M-200 600 h300" stroke="#3A6A3A" stroke-width="8" fill="none"/><circle cx="60" cy="520" r="20" fill="#C8282E"/><text x="-20" y="660" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="30" fill="#5A3A20">LUBANG · FILIPINAS</text>`);
  s += lay(1, calendar(-200, 1050, 1944, .8));
  s += lay(1, `<g transform="translate(1000,1050)">${bustP(t, { face: MAJY, cap: 1, capCol: '#4A4A2A', uni: '#5A5A3A', rank: 1, mouth: L > 4.6 && Math.floor(L * 7) % 2 ? 'grande' : 'reto', handR: [120, 520], elbowR: [280, 480], rotR: -20, itemR: `<rect x="-6" y="-130" width="16" height="110" rx="8" fill="${SK}" stroke="${OLN}" stroke-width="5"/>` })}</g>`);
  s += lay(1, `<g transform="translate(260,1100)">${bustP(t, { face: ON(0), cap: 1, emo: 'neutro', handR: [120, 300], elbowR: [300, 380], rotR: -40 })}</g>`);
  if (L > 5) s += `<g transform="translate(540,330)">${TAG(0, 0, 'NUNCA SE RENDA', 1.3 + .2 * bump(range(L, 5, 5.4)), '#FF6A3A')}</g>`;
  return s + VIG(.9);
}
// n3: panfletos caem do céu; ele lê e rasga
function s3(t) {
  const { L, d, k } = loc(t, 'n3'); TIGHT(t, k, 540, lerp(900, 1050, easeInOut(range(L, 0, 3))), lerp(.85, 1.15, easeInOut(range(L, 2, 4))));
  let s = lay(.5, jungle(t, { night: 0 }));
  s += lay(.9, Array.from({ length: 14 }, (_, i) => { const p = (L * .35 + i * .13) % 1, x = -200 + (i * 173) % 1400 + 80 * Math.sin(L * 2 + i), y = -200 + p * 2000; return `<g transform="translate(${f1(x)},${f1(y)})">${LEAF(.6, f1(30 * Math.sin(L * 3 + i)))}</g>`; }).join(''));
  const read = range(L, 2.0, 2.4), rip = range(L, 4.6, 5.1);
  let item = '';
  if (L > 2.0 && L < 4.6) item = `<g transform="translate(150,-200)">${LEAF(1.1, -6)}</g>`;
  if (rip > 0) item = `<g transform="translate(${f1(150 - 200 * rip)},${f1(-200 + 200 * rip)}) rotate(${f1(-40 * rip)})"><g transform="translate(-60,0)">${LEAF(1.1, -6).replace('<rect x="-120"', '<rect clip-path="none" x="-120"')}</g></g><g transform="translate(${f1(150 + 200 * rip)},${f1(-200 + 260 * rip)}) rotate(${f1(50 * rip)})"><rect x="0" y="-80" width="120" height="160" fill="#F4ECD8" stroke="${OLN}" stroke-width="5"/></g>`;
  s += lay(1, `<g transform="translate(400,1100)">${bustP(t, { face: ON(0), cap: 1, emo: 'neutro', mouth: rip > 0 || L > 3.4 ? 'reto' : 'reto', browA: 22, look: L < 2 ? -.6 : 0, handR: L > 2 ? [150, 330] : [200, 760], elbowR: L > 2 ? [300, 460] : [310, 560], handL: L > 2 ? [-90, 330] : [-200, 760], elbowL: L > 2 ? [-300, 480] : [-310, 560], over: item })}</g>`);
  if (L > 3.6 && L < 4.6) s += `<g transform="translate(540,330)">${TAG(0, 0, 'MENTIRA!', 1.4, '#FF6A3A')}</g>`;
  return s + VIG(.85);
}
// n4: anos passando; companheiros somem um a um; fica sozinho
function s4(t) {
  const { L, d, k } = loc(t, 'n4'); TIGHT(t, k, 560, 1000, lerp(.8, .95, k));
  const yr = Math.round(lerp(1946, 1972, easeInOut(range(L, 0, 7)))), night = .5 + .5 * Math.sin(L * 2.4);
  let s = lay(.5, jungle(t, { night: night * .7 }));
  // fogueira
  const fire = `<g transform="translate(540,1620)"><ellipse rx="160" ry="30" fill="#2A1A10"/>${[0, 1, 2, 3].map(i => { const f = 1 + .25 * Math.sin(t * 16 + i), x = -45 + i * 30; return `<path d="M${x - 24} 0 Q${x - 28} ${f1(-70 * f)} ${x} ${f1(-130 * f)} Q${x + 28} ${f1(-70 * f)} ${x + 24} 0Z" fill="#FF8A2A" stroke="#C83A10" stroke-width="3"/>`; }).join('')}<circle cy="-60" r="220" fill="#FFB060" opacity=".18" filter="url(#b12)"/></g>`;
  s += lay(1, fire + calendar(900, 760, yr, 1));
  const comp = [[150, 1420, 1950, 'rendeu'], [350, 1440, 1954, 'morto'], [760, 1430, 1972, 'morto']];
  comp.forEach(([x, y, gone]) => { const vis = 1 - range(yr, gone - 1, gone); if (vis > 0) s += lay(1, `<g opacity="${op(vis)}">${man({ x, y: y + 200, s: .5, kind: 'alemao', drop: 230, legF: [88, -88], legB: [80, -84], armF: [40, 30], flip: x > 540 ? -1 : 1 })}</g>`); });
  s += lay(1, `<g transform="translate(540,1200) scale(.6)">${bustP(t, { face: ON(.3 + .4 * k), cap: 1, emo: yr >= 1972 ? 'triste' : 'neutro', torn: .3 + .5 * k, beard: k * .6, dirt: k, handR: [140, 720], elbowR: [290, 560], handL: [-140, 720], elbowL: [-290, 560] })}</g>`);
  s += `<g transform="translate(540,300)">${TAG(0, 0, yr >= 1972 ? 'SOZINHO' : (3 - comp.filter(c => yr < c[2]).length === 0 ? '4 SOLDADOS' : (4 - comp.filter(c => yr >= c[2]).length) + ' SOLDADOS'), 1.2, '#FFE04A')}</g>`;
  return s + VIG(.95);
}
// n5: o lado sombrio — fumaça sobre a vila, plantações; sem mostrar violência
function s5(t) {
  const { L, d, k } = loc(t, 'n5'), [hx, hy] = HH(t, .4);
  setCam(lerp(500, 600, k) + hx, 1000 + hy, lerp(.9, 1.0, k), 0, [540, 960, 1]);
  let s = `<rect x="-2000" y="-2000" width="6000" height="6000" fill="#3A2420"/>`;
  s += lay(.6, `<rect x="-2000" y="1100" width="6000" height="3000" fill="#4A5A2A"/>` + Array.from({ length: 7 }, (_, i) => `<g transform="translate(${-100 + i * 220},${1140 + (i % 2) * 30})"><rect x="-70" y="-110" width="140" height="110" fill="#8A6A4A" stroke="${OLN}" stroke-width="5"/><path d="M-90 -110 L0 -190 L90 -110Z" fill="#B8A060" stroke="${OLN}" stroke-width="5"/></g>`).join('') + Array.from({ length: 10 }, (_, i) => { const p = (L * .25 + i * .1) % 1; return `<circle cx="${f1(200 + (i % 4) * 180 + p * 120)}" cy="${f1(1000 - p * 900)}" r="${f1(60 + p * 160)}" fill="#2A2020" opacity="${op((1 - p) * .55)}" filter="url(#b12)"/>`; }).join(''));
  s += lay(1, `<rect x="-2000" y="1500" width="6000" height="3000" fill="#1A1410"/>` + Array.from({ length: 16 }, (_, i) => `<path d="M${-600 + i * 140} 1520 l30 -${80 + (i % 3) * 40} l20 ${80 + (i % 3) * 40}" fill="#0A0806"/>`).join(''));
  s += lay(1.1, `<g transform="translate(860,1220) scale(.8)">${bustP(t, { face: ON(.8), cap: 1, emo: 'neutro', torn: .9, beard: .8, dirt: 1, uni: '#3A3A24', handR: [190, 700], elbowR: [320, 560], itemR: RIFLE })}</g><rect x="560" y="0" width="900" height="3000" fill="#000" opacity=".35"/>`);
  if (L > 3.4) s += `<g transform="translate(540,330)">${TAG(0, 0, 'ATÉ 30 MORTOS', 1.3, '#FF6A3A')}</g>`;
  return s + VIG(1);
}
// n6: 1974 — o aventureiro com a placa: ONODA? PANDA? ABOMINÁVEL?
function s6(t) {
  const { L, d, k } = loc(t, 'n6'); TIGHT(t, k, 560, 1020, lerp(.95, 1.1, k));
  let s = lay(.5, jungle(t, { night: 0 }));
  s += lay(.8, `<g transform="translate(900,1450)"><path d="M-260 0 L0 -300 L260 0Z" fill="#E8762A" stroke="${OLN}" stroke-width="7"/><path d="M0 -300 L0 0" stroke="${OLN}" stroke-width="5"/><path d="M-30 0 L0 -140 L30 0Z" fill="#3A2A20"/><text x="0" y="-60" text-anchor="middle" font-family="'DejaVu Serif',serif" font-style="italic" font-weight="700" font-size="24" fill="#FFF3D6" transform="rotate(0)">Hryz Animation</text></g>` + calendar(140, 760, 1974, .9));
  const items = [['ONODA', 1.2], ['PANDA', 3.3], ['ABOMINÁVEL', 5.6]];
  let board = `<rect x="-200" y="-260" width="400" height="300" rx="10" fill="#F4ECD8" stroke="${OLN}" stroke-width="6"/><text x="0" y="-200" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="30" fill="#7A1A1A">PROCURO:</text>`;
  items.forEach(([n, tt], i) => { if (L > tt) board += `<text x="-170" y="${-130 + i * 70}" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="${n.length > 6 ? 28 : 40}" fill="${OLN}">${i + 1}. ${n}${i === 0 ? '' : ''}</text>${i === 1 ? `<g transform="translate(150,${-140 + i * 70}) scale(.35)"><circle r="60" fill="#fff" stroke="${OLN}" stroke-width="8"/><circle cx="-50" cy="-50" r="26" fill="${OLN}"/><circle cx="50" cy="-50" r="26" fill="${OLN}"/><ellipse cx="-22" cy="-6" rx="16" ry="20" fill="${OLN}"/><ellipse cx="22" cy="-6" rx="16" ry="20" fill="${OLN}"/></g>` : ''}${i === 2 ? `<g transform="translate(150,${-140 + i * 70}) scale(.32)"><ellipse rx="60" ry="80" fill="#F4F8FC" stroke="${OLN}" stroke-width="8"/><circle cx="-20" cy="-30" r="8" fill="${OLN}"/><circle cx="20" cy="-30" r="8" fill="${OLN}"/></g>` : ''}`; });
  s += lay(1, `<g transform="translate(380,1080)">${bustP(t, { face: SUZ, uni: '#C8462A', mouth: Math.floor(L * 6) % 2 ? 'grande' : 'leve', emo: 'feliz', handR: [150, 330], elbowR: [300, 470], handL: [-150, 330], elbowL: [-300, 470], over: `<g transform="translate(0,480)">${board}</g>`, capCol: '#3A6A8A' })}</g>`);
  return s + VIG(.8);
}
// n7: encontro — o aventureiro acha o primeiro; Onoda recusa: só com ordem do comandante
function s7(t) {
  const { L, d, k } = loc(t, 'n7'), [hx, hy] = HH(t, .6);
  const shift = easeInOut(range(L, 1.8, 2.6));
  setCam(lerp(520, 640, shift) + hx, 1080 + hy, .74 + .04 * Math.sin(L) + .12 * shift, 0, [540, 960, 1]);
  let s = lay(.5, jungle(t, { night: .2 }));
  s += lay(1, `<g transform="translate(200,1080)">${bustP(t, { face: SUZ, uni: '#C8462A', emo: L < 1.6 ? 'choque' : 'feliz', mouth: 'grande', handR: [180, 330], elbowR: [320, 470] })}</g>`);
  s += lay(1, `<g transform="translate(980,1080)">${bustP(t, { face: ON(.9), cap: 1, emo: 'neutro', torn: 1, beard: .9, dirt: 1, uni: '#4A4A2C', mouth: L > 2.6 && Math.floor(L * 7) % 2 ? 'grande' : 'reto', handR: [190, 700], elbowR: [320, 560], itemR: RIFLE, handL: [-180, 420], elbowL: [-320, 520], rotL: 20, itemL: L > 2.6 ? `<rect x="-6" y="-130" width="16" height="110" rx="8" fill="${SK}" stroke="${OLN}" stroke-width="5"/>` : '' })}</g>`);
  if (L > 3.0) s += `<g transform="translate(540,330)">${TAG(0, 0, 'SÓ COM ORDEM', 1.3 + .15 * bump(range(L, 3, 3.4)), '#FFE04A')}</g>`;
  return s + VIG(.85);
}
// n8: o antigo comandante, já velho, lê a ordem; Onoda bate continência e chora
function s8(t) {
  const { L, d, k } = loc(t, 'n8'), [hx, hy] = HH(t, .4);
  const tw = easeInOut(range(L, 4.0, 5.0));
  setCam(lerp(560, 860, easeInOut(range(L, 5.0, 6.4))) + hx, lerp(1080, 980, easeInOut(range(L, 5.0, 6.4))) + hy, lerp(.74, 1.25, easeInOut(range(L, 5.0, 6.4))), 0, [540, 960, 1]);
  let s = lay(.5, jungle(t, { night: .1 }));
  const order = `<g transform="translate(60,-70)"><rect x="-150" y="-110" width="300" height="200" fill="#F4ECD8" stroke="${OLN}" stroke-width="6"/><text x="0" y="-60" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="30" fill="#7A1A1A">ORDEM</text><text x="0" y="-10" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="26" fill="${OLN}">A GUERRA</text><text x="0" y="30" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="26" fill="${OLN}">ACABOU.</text><text x="0" y="70" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-size="20" fill="${OLN}">9 · MAR · 1974</text></g>`;
  s += lay(1, `<g transform="translate(200,1080)">${bustP(t, { face: MAJ, uni: '#8A8A8A', mouth: L > .6 && L < 4 && Math.floor(L * 6) % 2 ? 'grande' : 'leve', handR: [140, 380], elbowR: [300, 480], handL: [-40, 380], elbowL: [-280, 480], over: `<g transform="translate(40,330)">${order}</g>` })}</g>`);
  const sal = easeOut(range(L, 4.6, 5.2));
  s += lay(1, `<g transform="translate(980,1080)">${bustP(t, { face: ON(.95), cap: 1, emo: L > 5.4 ? 'choro' : 'choque', tear: range(L, 5.4, 6), torn: 1, beard: 1, dirt: 1, uni: '#4A4A2C', mouth: 'reto', handR: sal > 0 ? [lerp(200, 70, sal), lerp(700, -70, sal)] : [200, 700], elbowR: sal > 0 ? [lerp(320, 260, sal), lerp(560, 140, sal)] : [320, 560], rotR: lerp(0, -130, sal) })}</g>`);
  return s + VIG(.85);
}
// n9: entrega a espada e o fuzil; volta ao calendário (loop)
function s9(t) {
  const { L, d, k } = loc(t, 'n9'), [hx, hy] = HH(t, .5);
  let s;
  if (L < 5.2) {
    setCam(560 + hx, lerp(1080, 1040, k) + hy, lerp(1.1, 1.0, range(L, 0, 5)), 0, [540, 960, 1]);
    s = lay(.5, jungle(t, { night: 0 }));
    const give = easeInOut(range(L, .3, 1.6));
    s += lay(1, `<g transform="translate(560,1080)">${bustP(t, { face: ON(.95), cap: 1, emo: 'triste', torn: 1, beard: 1, dirt: 1, uni: '#4A4A2C', handR: [lerp(200, 120, give), lerp(700, 500, give)], elbowR: [320, 560], rotR: lerp(0, -70, give), itemR: SWORD, handL: [lerp(-200, -140, give), lerp(760, 560, give)], elbowL: [-320, 600], rotL: lerp(0, 70, give), itemL: RIFLE })}</g>`);
    if (L > 2.2) s += `<g transform="translate(540,330)">${TAG(0, 0, 'FUNCIONANDO', 1.2, '#FFE04A')}</g>`;
  } else {
    // volta ao começo: o calendário corre ao contrário até 1945 e ele, jovem, de pé com o rifle
    const L2 = L - 5.2; TIGHT(t, k, 560, 1080, 1.0 + .1 * range(L2, 0, d - 5.2));
    const yr = Math.round(lerp(1974, 1945, easeInOut(range(L2, 0, 2.6)))), age = (yr - 1945) / 29;
    s = lay(.5, jungle(t, { night: .6 }));
    s += lay(.8, `<path d="M840 2600 Q870 1200 820 0" stroke="#2A1E14" stroke-width="150" fill="none"/>` + calendar(820, 720, yr, 1.15));
    s += lay(1, `<g transform="translate(380,1060)">${bustP(t, { face: ON(age), cap: 1, emo: 'neutro', torn: age, beard: age > .6 ? (age - .6) * 2.5 : 0, dirt: age, handR: [190, 700], elbowR: [320, 560], itemR: RIFLE })}</g>`);
    s += `<g transform="translate(540,300)">${TAG(0, 0, '29 ANOS', 1.5, '#FF6A3A')}</g>`;
  }
  return s + VIG(.9);
}
const FN = { n1: s1, n2: s2, n3: s3, n4: s4, n5: s5, n6: s6, n7: s7, n8: s8, n9: s9 };

function frame(t) {
  D = []; uid = 0;
  const sh = shotAt(t);
  let body = FN[sh[0]](t);
  for (const c of CUTS.map(x => [0, x])) if (t >= c[1] && t < c[1] + .08) body += `<rect width="1080" height="1920" fill="#fff" opacity="${op(.2 * (1 - (t - c[1]) / .08))}"/>`;
  defsEl.innerHTML = STATIC + objDefs() + `<filter id="sil_lotito" x="-25%" y="-25%" width="150%" height="150%"><feFlood flood-color="#151925" result="c"/><feComposite in="c" in2="SourceAlpha" operator="in" result="s"/><feOffset in="SourceAlpha" dx="-9" dy="7" result="o"/><feComposite in="SourceAlpha" in2="o" operator="out" result="e"/><feGaussianBlur in="e" stdDeviation="2.2" result="eb"/><feFlood flood-color="#FFC27A" flood-opacity=".85"/><feComposite in2="eb" operator="in" result="rim"/><feMerge><feMergeNode in="s"/><feMergeNode in="rim"/></feMerge></filter><filter id="sil_medico" x="-25%" y="-25%" width="150%" height="150%"><feFlood flood-color="#B8642A" result="c"/><feComposite in="c" in2="SourceAlpha" operator="in" result="s"/><feOffset in="SourceAlpha" dx="-9" dy="7" result="o"/><feComposite in="SourceAlpha" in2="o" operator="out" result="e"/><feGaussianBlur in="e" stdDeviation="2.2" result="eb"/><feFlood flood-color="#FFE0B0" flood-opacity=".85"/><feComposite in2="eb" operator="in" result="rim"/><feMerge><feMergeNode in="s"/><feMergeNode in="rim"/></feMerge></filter><filter id="zapF" x="-30%" y="-30%" width="160%" height="160%"><feFlood flood-color="#F2F8FF"/><feComposite in2="SourceAlpha" operator="in" result="w"/><feGaussianBlur in="w" stdDeviation="14" result="g"/><feFlood flood-color="#6AB0FF"/><feComposite in2="g" operator="in" result="gb"/><feMerge><feMergeNode in="gb"/><feMergeNode in="w"/></feMerge></filter><filter id="manVol" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feOffset in="SourceAlpha" dx="-16" dy="8" result="o1"/><feComposite in="SourceAlpha" in2="o1" operator="out" result="e1"/><feGaussianBlur in="e1" stdDeviation="7" result="b1"/><feComposite in="b1" in2="SourceAlpha" operator="in" result="s1"/><feFlood flood-color="#1A1028" flood-opacity=".38"/><feComposite in2="s1" operator="in" result="sh"/><feOffset in="SourceAlpha" dx="7" dy="-7" result="o2"/><feComposite in="SourceAlpha" in2="o2" operator="out" result="e2"/><feGaussianBlur in="e2" stdDeviation="2.5" result="b2"/><feComposite in="b2" in2="SourceAlpha" operator="in" result="r1"/><feFlood flood-color="#FFF0D0" flood-opacity=".55"/><feComposite in2="r1" operator="in" result="rim"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="sh"/><feMergeNode in="rim"/></feMerge></filter><radialGradient id="gHot"><stop offset="0" stop-color="#FF3A1A" stop-opacity=".95"/><stop offset=".5" stop-color="#FF7A2A" stop-opacity=".6"/><stop offset="1" stop-color="#FFB03A" stop-opacity="0"/></radialGradient><filter id="bl6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
<linearGradient id="beamW2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF0C0" stop-opacity=".6"/><stop offset="1" stop-color="#FFF0C0" stop-opacity="0"/></linearGradient><pattern id="gridP" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0 L0 0 0 60" stroke="#2A4A6A" stroke-width="2" fill="none"/></pattern><pattern id="paperP" width="512" height="512" patternUnits="userSpaceOnUse"><image href="${PAPER}" width="512" height="512"/></pattern>
<pattern id="waveP" width="160" height="90" patternUnits="userSpaceOnUse"><path d="M10 30 q20 -14 40 0 t40 0 M90 70 q20 -14 40 0" stroke="#8AC0E8" stroke-width="3" fill="none"/></pattern>
<pattern id="dotP" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2" fill="#000" opacity=".25"/><circle cx="13" cy="12" r="1.5" fill="#000" opacity=".18"/></pattern>
<pattern id="wallP" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M60 10 L80 60 L60 110 L40 60Z" fill="none" stroke="#B8A888" stroke-width="3"/><circle cx="0" cy="0" r="8" fill="#C8B898"/><circle cx="120" cy="120" r="8" fill="#C8B898"/><circle cx="60" cy="60" r="5" fill="#C8B898"/></pattern>
<pattern id="woodP" width="300" height="70" patternUnits="userSpaceOnUse"><rect width="300" height="70" fill="none" stroke="#6A4A2A" stroke-width="3"/><path d="M10 25 q60 -8 120 0 t140 2 M20 50 q80 6 160 -2" stroke="#8A6A4A" stroke-width="2" fill="none"/></pattern>
<pattern id="brickP" width="80" height="40" patternUnits="userSpaceOnUse"><path d="M0 0 H80 M0 20 H80 M0 0 V20 M40 20 V40" stroke="#5A4A3A" stroke-width="3" fill="none"/></pattern>
<pattern id="crackP" width="260" height="200" patternUnits="userSpaceOnUse"><path d="M0 60 L70 40 L120 90 L200 60 L260 80 M70 40 L60 0 M120 90 L100 200 M200 60 L230 0 M120 90 L180 150 L260 140 M0 160 L60 150 L100 200" stroke="#7A4A20" stroke-width="5" fill="none"/></pattern>` + D.join('');
  root.innerHTML = body + TEXTURE;
}
