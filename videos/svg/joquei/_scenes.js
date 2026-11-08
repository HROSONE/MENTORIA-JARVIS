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
/* ===================== O jóquei que ganhou morto (Frank Hayes, 1923) ===================== */
const bump = x => x < 0 || x > 1 ? 0 : Math.sin(x * Math.PI);
const OLN = '#16110E';
const AT = k => S[k].a;
const CUTS = ['n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8'].map(AT);
const TAG = (x, y, txt, s = 1, col = '#FFE04A') => `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(s * 100) / 100})"><rect x="${-txt.length * 15 - 20}" y="-38" width="${txt.length * 30 + 40}" height="64" rx="14" fill="#0A0806" opacity=".8"/><text x="0" y="12" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="44" fill="${col}">${txt}</text></g>`;
function seg2(x, y, a, l) { return [x + Math.sin(a * Math.PI / 180) * l, y + Math.cos(a * Math.PI / 180) * l]; }
function hleg(x, y, a1, a2, col, front) {
  const k = seg2(x, y, a1, 215), f = seg2(k[0], k[1], a1 + a2, 225);
  const w0 = front ? 66 : 84;
  return `<path d="M${f1(x - w0)} ${f1(y)} L${f1(k[0] - 34)} ${f1(k[1])} L${f1(f[0] - 24)} ${f1(f[1])} L${f1(f[0] + 26)} ${f1(f[1])} L${f1(k[0] + 34)} ${f1(k[1])} L${f1(x + w0)} ${f1(y)}Z" fill="${col}" stroke="${OLN}" stroke-width="7" stroke-linejoin="round"/><circle cx="${f1(k[0])}" cy="${f1(k[1])}" r="36" fill="${col}" stroke="${OLN}" stroke-width="6"/><path d="M${f1(f[0] - 32)} ${f1(f[1])} L${f1(f[0] + 36)} ${f1(f[1])} L${f1(f[0] + 32)} ${f1(f[1] + 46)} L${f1(f[0] - 28)} ${f1(f[1] + 46)}Z" fill="#2A1E16" stroke="${OLN}" stroke-width="6"/>`;
}
// égua de perfil virada para a direita; origem no chão; ph = fase do galope; o.jump (0..1) encolhe as pernas
function horse(x, y, s, ph, o = {}) {
  const C = o.col || '#8A4E2A', CD = mix(C, '#000000', .3), gal = o.gal === undefined ? 1 : o.gal, j = o.jump || 0;
  const A = (k) => Math.sin(ph + k) * 38 * gal;
  const lift = Math.abs(Math.sin(ph)) * 30 * gal;
  let g = `<g transform="translate(${f1(x)},${f1(y)}) scale(${s})"><ellipse cx="0" cy="8" rx="460" ry="30" fill="#000" opacity="${.3 * (1 - j)}" filter="url(#b12)"/><g transform="translate(0,${f1(-lift - j * 160)}) rotate(${f1(o.tilt || 0)})">`;
  const legs = (back) => { const c = back ? CD : C, fx = 300, bx = -300, Y = -545; const fa = back ? A(Math.PI) : A(0), ba = back ? A(Math.PI * .6) : A(Math.PI * 1.6); const jf = j * 70, jb = j * 60; return hleg(fx, Y, -fa - jf * .4 - 10, Math.max(0, fa) * 1.2 + jf * 1.4, c, 1) + hleg(bx, Y, -ba + jb, -Math.max(0, -ba) * 1.4 - jb * 1.6, c, 0); };
  g += legs(1);
  // cauda
  g += `<path d="M-420 -720 Q${f1(-620 - 40 * gal)} ${f1(-640 + 30 * Math.sin(ph * 2))} ${f1(-600 - 60 * gal)} ${f1(-420 + 40 * Math.sin(ph * 2))} Q-520 -560 -440 -650Z" fill="#2A1A10" stroke="${OLN}" stroke-width="6"/>`;
  // corpo
  g += `<path d="M-440 -720 Q-460 -860 -260 -870 L240 -880 Q360 -880 400 -800 L460 -900 Q480 -1000 520 -1080 L700 -980 Q720 -940 690 -920 L560 -900 Q520 -820 440 -640 Q420 -540 300 -540 L-300 -540 Q-460 -540 -440 -720Z" fill="${C}" stroke="${OLN}" stroke-width="8" stroke-linejoin="round"/>`;
  g += `<path d="M-400 -600 Q0 -560 400 -600" stroke="${CD}" stroke-width="30" fill="none" opacity=".5"/><path d="M-300 -840 Q0 -860 300 -850" stroke="#FFFFFF" stroke-width="10" fill="none" opacity=".18"/>`;
  // cabeça
  g += `<path d="M500 -1080 Q560 -1160 620 -1120 L780 -1000 Q810 -960 770 -940 L680 -950 L560 -920Z" fill="${C}" stroke="${OLN}" stroke-width="8" stroke-linejoin="round"/><path d="M560 -1150 L580 -1220 L610 -1140Z" fill="${C}" stroke="${OLN}" stroke-width="6"/><circle cx="640" cy="-1060" r="11" fill="${OLN}"/><circle cx="644" cy="-1064" r="4" fill="#fff"/><ellipse cx="760" cy="-962" rx="10" ry="7" fill="${OLN}"/><path d="M700 -1000 L720 -1020" stroke="${OLN}" stroke-width="5"/>`;
  // crina
  g += `<path d="M520 -1090 Q460 -1020 420 -900 Q440 -960 470 -980 Q430 -900 410 -860 L470 -900 Q500 -1000 560 -1100Z" fill="#2A1A10" stroke="${OLN}" stroke-width="5"/>`;
  // sela, número, rédeas
  if (o.saddle !== 0) g += `<path d="M-130 -880 Q0 -930 140 -880 L130 -820 L-120 -820Z" fill="#3A2416" stroke="${OLN}" stroke-width="6"/><rect x="-200" y="-840" width="260" height="190" rx="10" fill="#F4F4F0" stroke="${OLN}" stroke-width="6"/><text x="-70" y="-710" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="110" fill="#2A8A4A">${o.num || 7}</text>`;
  g += legs(0);
  if (o.rider) g += o.rider;
  if (o.reins !== 0) g += `<path d="M680 -960 Q560 -900 ${f1(o.handX || 300)} ${f1(o.handY || -980)}" stroke="#3A2416" stroke-width="7" fill="none"/>`;
  return g + '</g></g>';
}
// jóquei no espaço do cavalo (montado); dead 0..1 tomba pra frente
function rider(ph, o = {}) {
  const d = o.dead || 0, bob = Math.sin(ph * 2) * 10 * (1 - d * .5);
  const lean = lerp(42, 82, d), hand = o.wave ? [150, -20] : [lerp(75, 20, d), lerp(-40, 10, d)];
  return man({ x: 20, y: -820 + 240 + bob, s: 1, kind: 'joquei', drop: 230, legF: [70, -125], legB: [60, -115], lean, armF: hand, armB: [lerp(70, 15, d), lerp(-30, 5, d)], eyes: d > .5 ? 0 : 1, mouth: o.mouth || 0, shadow: 0, look: 0 });
}
/* ---------- pista ---------- */
function track(t, scroll, o = {}) {
  const sky = o.sky || ['#9ACBEA', '#E8F2F8'];
  const id = nid('sk'); def(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>`);
  let s = `<rect x="-3000" y="-3000" width="8000" height="8000" fill="url(#${id})"/>`;
  // arquibancada com público (parallax)
  const sx = -(scroll * .3) % 400;
  let st = `<rect x="-2000" y="760" width="6000" height="420" fill="#C8B8A0" stroke="${OLN}" stroke-width="6"/><path d="M-2000 760 L4000 760 L4000 700 L-2000 700Z" fill="#7A2A2A" stroke="${OLN}" stroke-width="6"/>`;
  for (let r = 0; r < 4; r++) for (let i = 0; i < 40; i++) { const x = -1600 + i * 110 + sx + (r % 2) * 55, y = 820 + r * 90, jump = o.cheer ? Math.max(0, Math.sin(t * 9 + i * 1.3 + r)) * 18 : 0; st += `<circle cx="${f1(x)}" cy="${f1(y - jump)}" r="20" fill="${['#E8B898', '#C8906A', '#8A5A3A', '#F2D0B0'][(i + r) % 4]}" stroke="${OLN}" stroke-width="3"/><rect x="${f1(x - 22)}" y="${f1(y + 16 - jump)}" width="44" height="40" rx="10" fill="${['#3A5A9A', '#C8402A', '#2A7A4A', '#E8C040', '#5A3A8A'][(i * 3 + r) % 5]}"/>${o.cheer && (i + r) % 3 === 0 ? `<path d="M${f1(x + 18)} ${f1(y + 18 - jump)} l18 -40" stroke="${['#E8B898', '#C8906A'][i % 2]}" stroke-width="10" stroke-linecap="round"/>` : ''}`; }
  s += st;
  // grama e pista
  s += `<rect x="-3000" y="1180" width="8000" height="3000" fill="#5A9A3A"/><rect x="-3000" y="1300" width="8000" height="460" fill="#A88A5A"/><rect x="-3000" y="1300" width="8000" height="460" fill="url(#dotP)" opacity=".5"/>`;
  // cerca branca (rápida)
  const fx = -(scroll) % 300;
  let fe = `<path d="M-2000 1250 H4000 M-2000 1290 H4000" stroke="#F4F4F0" stroke-width="16"/>`;
  for (let i = 0; i < 22; i++) fe += `<rect x="${f1(-1200 + i * 300 + fx)}" y="1220" width="20" height="90" fill="#F4F4F0" stroke="${OLN}" stroke-width="3"/>`;
  s += fe;
  return s;
}
// motion lines
const SPEED = (k = 1) => Array.from({ length: 10 }, (_, i) => `<path d="M${-200 + (i * 173) % 1300} ${400 + (i * 137) % 1300} h${f1(220 * k)}" stroke="#FFFFFF" stroke-width="5" opacity="${op(.35 * k)}"/>`).join('');
function finishPost(x) { return `<g transform="translate(${x},0)"><rect x="-14" y="700" width="28" height="1100" fill="#F4F4F0" stroke="${OLN}" stroke-width="5"/><rect x="-220" y="620" width="440" height="110" rx="10" fill="#C8282E" stroke="${OLN}" stroke-width="6"/><text x="0" y="695" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="56" fill="#FFF">CHEGADA</text><path d="M0 1300 V1760" stroke="#F4F4F0" stroke-width="14" stroke-dasharray="30 20"/></g>`; }
function cam(x, y, z, r = 0, k = .7) { const [hx, hy] = HH(T0, k); setCam(x + hx, y + hy, z, r, [540, 960, 1]); }
let T0 = 0;
/* ====================== CENAS ====================== */
// n1: gancho — câmera corre ao lado; a égua cruza a chegada, ele tombado na sela
function s1(t) {
  T0 = t; const { L, d, k } = loc(t, 'n1');
  const ph = t * 9, cross = range(L, 0, 2.0);
  cam(540, lerp(1150, 1200, k), lerp(1.05, 1.15, k), 1.5 * Math.sin(L * 3));
  let s = lay(1, track(t, L * 1800, { cheer: 1 }));
  s += lay(1, finishPost(lerp(1000, -300, cross)));
  const rd = rider(ph, { dead: 1 });
  // outros cavalos atrás
  s += lay(1, horse(lerp(-200, -80, k), 1650, .36, ph + 1.3, { col: '#4A2E1A', num: 3, rider: man({ x: 20, y: -580, s: 1, kind: 'preso', drop: 230, legF: [70, -125], legB: [60, -115], lean: 42, armF: [75, -40], shadow: 0 }) }));
  s += lay(1, horse(560, 1720, .5, ph, { rider: rd, handX: 260, handY: -760 }));
  s += lay(1, SPEED(1));
  if (L > 2.0) s += `<g transform="translate(540,330)">${TAG(0, 0, '1º LUGAR', 1.5 + .2 * bump(range(L, 2, 2.4)))}</g>`;
  return s + VIG(.8);
}
// n2: o estábulo — ele escova a égua; prateleira de troféus vazia
function stable(t) { return `<rect x="-2000" y="-2000" width="6000" height="6000" fill="#6A4428"/><rect x="-2000" y="-2000" width="6000" height="6000" fill="url(#woodP)" opacity=".5"/><rect x="-2000" y="1500" width="6000" height="1200" fill="#C8A060"/>${Array.from({ length: 40 }, (_, i) => `<path d="M${-800 + i * 70} ${1520 + (i % 4) * 40} l40 -10" stroke="#E8C880" stroke-width="5"/>`).join('')}<rect x="-200" y="300" width="1500" height="160" fill="#4A2E18" stroke="${OLN}" stroke-width="6"/>`; }
function s2(t) {
  T0 = t; const { L, d, k } = loc(t, 'n2');
  cam(lerp(500, 620, k), 1080, lerp(1.0, 1.08, k));
  let s = lay(1, stable(t) + `<g transform="translate(860,560)"><rect x="-220" y="-20" width="440" height="24" fill="#3A2416" stroke="${OLN}" stroke-width="5"/><rect x="-200" y="-120" width="400" height="100" fill="none" stroke="#3A2416" stroke-width="4" stroke-dasharray="14 10"/></g>`);
  if (L > 3.4) s += lay(1, `<g transform="translate(860,470)">${TAG(0, 0, '0 VITÓRIAS', 1.1 + .15 * bump(range(L, 3.4, 3.8)))}</g>`);
  s += lay(1, horse(620, 1600, .55, 0, { gal: 0, saddle: 0, reins: 0, tilt: 0 }));
  const br = Math.sin(L * 7);
  s += lay(1, man({ x: 220, y: 1600, s: .62, kind: 'cavalarico', armF: [100 + 20 * br, -20], armB: [40, 30], held: `<g transform="rotate(-10)"><rect x="-10" y="-20" width="70" height="30" rx="8" fill="#8A5A2A" stroke="${OLN}" stroke-width="4"/>${[0, 1, 2, 3, 4].map(i => `<path d="M${i * 12} 10 v14" stroke="#2A1A10" stroke-width="4"/>`).join('')}</g>`, look: 0 }));
  s += lay(1, Array.from({ length: 6 }, (_, i) => { const p = (L * .7 + i / 6) % 1; return `<circle cx="${f1(400 + i * 40)}" cy="${f1(1100 - p * 200)}" r="${f1(4 + p * 6)}" fill="#E8D8B0" opacity="${op((1 - p) * .6)}"/>`; }).join(''));
  return s + VIG(.75);
}
// n3: 1923, Nova York — a dona entrega a roupa de corrida; quadro de apostas 20-1
function s3(t) {
  T0 = t; const { L, d, k } = loc(t, 'n3');
  cam(lerp(560, 640, k), 1060, lerp(.95, 1.05, k));
  let s = lay(1, stable(t));
  const give = easeOut(range(L, .8, 1.8)), dressed = L > 3.2;
  s += lay(1, `<g transform="translate(900,520) rotate(-3)"><rect x="-200" y="-180" width="400" height="320" rx="10" fill="#1A2A1A" stroke="${OLN}" stroke-width="8"/><text x="0" y="-120" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="32" fill="#F4F4F0">APOSTAS</text><text x="-170" y="-60" font-family="'DejaVu Sans Mono',monospace" font-size="30" fill="#E8E8D0">THUNDER   2-1</text><text x="-170" y="-10" font-family="'DejaVu Sans Mono',monospace" font-size="30" fill="#E8E8D0">BIG RED   3-1</text><text x="-170" y="40" font-family="'DejaVu Sans Mono',monospace" font-size="30" fill="#E8E8D0">DUSTY     5-1</text><text x="-170" y="${f1(100)}" font-family="'DejaVu Sans Mono',monospace" font-weight="700" font-size="${L > 4.6 ? 36 : 30}" fill="${L > 4.6 ? '#FFE04A' : '#E8E8D0'}">SWEET KISS 20-1</text></g>` + `<g transform="translate(320,420)"><rect x="-160" y="-60" width="320" height="110" rx="8" fill="#F4ECD8" stroke="${OLN}" stroke-width="5"/><text x="0" y="-10" text-anchor="middle" font-family="'DejaVu Serif',serif" font-weight="700" font-size="34" fill="${OLN}">BELMONT PARK</text><text x="0" y="34" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-size="28" fill="#7A1A1A">NOVA YORK · 1923</text></g>`);
  if (L > 4.6) s += lay(1, `<g transform="translate(900,800)">${TAG(0, 0, '20 PRA 1', 1.2 + .2 * bump(range(L, 4.6, 5)), '#FF8A4A')}</g>`);
  s += lay(1, man({ x: lerp(1100, 760, give), y: 1600, s: .6, kind: 'dona', flip: -1, ...walkPose(L * 6, give > 0 && give < 1 ? .6 : 0), armF: [80, -10], held: give < 1 ? `<g transform="scale(-1,1)"><rect x="-50" y="-60" width="100" height="90" rx="10" fill="#2A8A4A" stroke="${OLN}" stroke-width="4"/><path d="M-50 -20 L50 -30 M-50 10 L50 0" stroke="#F4F4F0" stroke-width="12"/></g>` : '' }));
  s += lay(1, man({ x: 340, y: 1600, s: .62, kind: dressed ? 'joquei' : 'cavalarico', armF: give >= 1 && !dressed ? [90, -20] : [10, 10], mouth: L > 1.8 && L < 3 ? .5 : 0, held: give >= 1 && !dressed ? `<g><rect x="-50" y="-60" width="100" height="90" rx="10" fill="#2A8A4A" stroke="${OLN}" stroke-width="4"/><path d="M-50 -20 L50 -30 M-50 10 L50 0" stroke="#F4F4F0" stroke-width="12"/></g>` : '' }));
  if (L > 2.9 && L < 3.3) s += `<rect width="1080" height="1920" fill="#FFF" opacity="${op(bump(range(L, 2.9, 3.3)) * .8)}"/>`;
  return s + VIG(.75);
}
// n4: a balança — o ponteiro cai; ele recusa o prato
function s4(t) {
  T0 = t; const { L, d, k } = loc(t, 'n4');
  cam(540, lerp(1060, 1000, k), lerp(1.05, 1.25, easeInOut(k)));
  let s = lay(1, stable(t));
  const kg = lerp(64, 59, easeInOut(range(L, .6, 4.2)));
  const ang = -60 + (kg - 55) * 12;
  s += lay(1, `<g transform="translate(560,1600)"><rect x="-200" y="-40" width="400" height="60" rx="12" fill="#8A8E96" stroke="${OLN}" stroke-width="6"/><rect x="140" y="-640" width="40" height="600" fill="#8A8E96" stroke="${OLN}" stroke-width="5"/><circle cx="160" cy="-700" r="120" fill="#F4F4F0" stroke="${OLN}" stroke-width="8"/>${[55, 60, 65].map(v => { const a = (-60 + (v - 55) * 12 - 90) * Math.PI / 180; return `<text x="${f1(160 + Math.cos(a) * 82)}" y="${f1(-690 + Math.sin(a) * 82)}" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="26" fill="${OLN}">${v}</text>`; }).join('')}<path d="M160 -700 L${f1(160 + Math.cos((ang - 90) * Math.PI / 180) * 96)} ${f1(-700 + Math.sin((ang - 90) * Math.PI / 180) * 96)}" stroke="#C8282E" stroke-width="8" stroke-linecap="round"/><circle cx="160" cy="-700" r="12" fill="${OLN}"/></g>`);
  s += lay(1, man({ x: 520, y: 1570, s: .62, kind: 'joquei', armF: L > 2.4 ? [90, -10] : [10, 10], mouth: 0, held: L > 2.4 ? `<g transform="rotate(${f1(-10 + 10 * Math.sin(L * 8))})"><rect x="-6" y="-80" width="14" height="70" rx="6" fill="#F2C8A6" stroke="${OLN}" stroke-width="3"/></g>` : '' }));
  s += lay(1, `<g transform="translate(${f1(lerp(1000, 900, range(L, 2, 2.6)))},1300)"><rect x="-120" y="0" width="240" height="20" fill="#5A3A20"/><ellipse cx="0" cy="-6" rx="110" ry="24" fill="#F4F4F0" stroke="${OLN}" stroke-width="5"/><path d="M-50 -20 Q0 -70 50 -20Z" fill="#C8782A" stroke="${OLN}" stroke-width="4"/></g>`);
  s += `<g transform="translate(540,330)">${TAG(0, 0, f1(kg).toFixed(1).replace('.', ',') + ' kg', 1.4)}</g>`;
  return s + VIG(.75);
}
// n5: a corrida — saltos, ultrapassagens; coração dispara e para
function s5(t) {
  T0 = t; const { L, d, k } = loc(t, 'n5');
  const ph = t * 9, jumpAt = [1.2, 3.4], jumpK = jumpAt.map(j => range(L, j - .35, j + .35)).reduce((a, b) => Math.max(a, bump(b)), 0);
  const stop = range(L, 5.6, 6.2);
  cam(540, 1160 - jumpK * 60, lerp(1.0, 1.1, k) + .08 * stop, 1.2 * Math.sin(L * 3));
  let s = lay(1, track(t, L * 1900, {}));
  // obstáculos (sebes) passando
  jumpAt.forEach(j => { const x = 560 + (j - L) * 1600; if (x > -400 && x < 1600) s += lay(1, `<g transform="translate(${f1(x)},1720)"><path d="M-110 0 Q-120 -230 0 -240 Q120 -230 110 0Z" fill="#3A6A2A" stroke="${OLN}" stroke-width="6"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${-90 + i * 36} 0 l14 -${200 + (i % 2) * 30}" stroke="#2A5A1E" stroke-width="10"/>`).join('')}<rect x="-130" y="-20" width="260" height="20" fill="#F4F4F0" stroke="${OLN}" stroke-width="4"/></g>`); });
  // rivais sendo ultrapassados
  [[3, '#4A2E1A', 0], [5, '#6A6A6A', 1.6], [9, '#2A1A10', 3.2]].forEach(([n, c, tt], i) => { const x = lerp(1400 + i * 200, -900, range(L, tt - 1, tt + 2.2)); if (x > -700 && x < 1700) s += lay(1, horse(x, 1600, .4, ph + i * 1.7, { col: c, num: n, rider: man({ x: 20, y: -580, s: 1, kind: ['preso', 'guarda', 'preso2'][i], drop: 230, legF: [70, -125], legB: [60, -115], lean: 42, armF: [75, -40], shadow: 0 }) })); });
  const dead = range(L, 5.6, 6.6);
  s += lay(1, horse(500, 1720 - jumpK * 120, .5, ph, { jump: jumpK, rider: rider(ph, { dead }), handX: lerp(260, 300, dead), handY: lerp(-760, -700, dead) }));
  s += lay(1, SPEED(1 - stop * .3));
  // monitor de batimentos (pequeno, canto)
  const bpm = L < 5.6 ? lerp(120, 200, L / 5.6) : 0;
  let ecg = ''; for (let i = 0; i < 40; i++) { const x = i * 10, tt = L - (40 - i) * .03; const beat = tt < 5.6 ? ((tt * bpm / 60) % 1) : -1; const y = beat >= 0 && beat < .08 ? -60 * Math.sin(beat / .08 * Math.PI) : 0; ecg += `${i ? 'L' : 'M'}${x} ${f1(y)} `; }
  s += `<g transform="translate(560,300)"><rect x="-230" y="-110" width="460" height="200" rx="20" fill="#0A1A12" stroke="#2A5A3A" stroke-width="6"/><path d="${ecg}" transform="translate(-200,20)" stroke="${L < 5.6 ? '#4AE07A' : '#E84A4A'}" stroke-width="7" fill="none"/><text x="140" y="-60" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="40" fill="${L < 5.6 ? '#4AE07A' : '#E84A4A'}">♥ ${L < 5.6 ? Math.round(bpm) : 0}</text></g>`;
  return s + VIG(.8) + (stop > 0 && stop < 1 ? `<rect width="1080" height="1920" fill="#FFF" opacity="${op(bump(stop) * .5)}"/>` : '');
}
// n6: câmera lenta na chegada — vence por uma cabeça
function s6(t) {
  T0 = t; const { L, d, k } = loc(t, 'n6');
  const sl = .35, ph = t * 9 * sl;
  cam(lerp(620, 760, k), 1220, lerp(1.05, 1.35, easeInOut(k)), 0, .3);
  let s = lay(1, track(t, L * 1900 * sl, { cheer: L > 3 }));
  const fx = lerp(1300, 760, easeOut(range(L, 0, 3.4)));
  s += lay(1, finishPost(fx + 300));
  s += lay(1, horse(lerp(380, 520, range(L, 0, 3.4)) - 40, 1650, .45, ph + 1.1, { col: '#6A6A6A', num: 5, rider: man({ x: 20, y: -580, s: 1, kind: 'guarda', drop: 230, legF: [70, -125], legB: [60, -115], lean: 50, armF: [80, -40], shadow: 0, mouth: .6 }) }));
  s += lay(1, horse(lerp(400, 600, range(L, 0, 3.4)), 1740, .5, ph, { rider: rider(ph, { dead: 1 }), handX: 300, handY: -700 }));
  if (L > 3.1) s += `<g transform="translate(540,330)">${TAG(0, 0, 'POR UMA CABEÇA', 1.2 + .2 * bump(range(L, 3.1, 3.5)))}</g>`;
  if (L > 3.0 && L < 3.15) s += `<rect width="1080" height="1920" fill="#FFF" opacity=".7"/>`;
  return s + VIG(.75);
}
// n7: a dona corre para dar os parabéns; ele escorrega da sela
function s7(t) {
  T0 = t; const { L, d, k } = loc(t, 'n7');
  cam(lerp(600, 560, k), 1150, lerp(1.0, 1.2, easeInOut(range(L, 2.6, 4.6))));
  let s = lay(1, track(t, 0, { cheer: L < 2.6 }));
  const slide = easeIn(range(L, 3.4, 4.4)), walkIn = easeOut(range(L, .2, 2.2));
  const r = man({ x: 20, y: -580 + slide * 300, s: 1, kind: 'joquei', drop: 230, legF: [70, -125], legB: [60, -115], lean: lerp(82, 110, slide), armF: [10, 0], armB: [15, 5], eyes: 0, shadow: 0 });
  s += lay(1, `<g transform="rotate(${f1(slide * 40)} 760 1700)">` + '' + `</g>` + horse(720, 1720, .5, 0, { gal: 0, rider: `<g transform="rotate(${f1(slide * 28)} 0 -700)">${r}</g>`, handX: 300, handY: -700 }));
  s += lay(1, man({ x: lerp(-200, 330, walkIn), y: 1720, s: .55, kind: 'dona', ...walkPose(L * 7, walkIn < 1 ? .8 : 0), armF: L > 2.2 ? [150, -30] : [20, 20], armB: L > 2.2 ? [140, -20] : [-10, 20], mouth: L > 2.2 && L < 3.4 ? .6 : 0, held: '' }));
  if (L > 3.6) s += lay(1, `<g transform="translate(330,${1720 - .55 * 1250})">${TAG(0, 0, '!', 1.4, '#FF4A3A')}</g>`);
  return s + VIG(.8);
}
// n8: a roupa de corrida pendurada; a égua sozinha no estábulo; volta à chegada
function s8(t) {
  T0 = t; const { L, d, k } = loc(t, 'n8');
  if (L < 4.4) {
    cam(lerp(520, 640, k), 1060, lerp(1.0, 1.12, k));
    let s = lay(1, stable(t) + `<g transform="translate(300,700)"><path d="M-80 -60 L0 -100 L80 -60" stroke="#8A8E96" stroke-width="6" fill="none"/><rect x="-110" y="-60" width="220" height="260" rx="20" fill="#2A8A4A" stroke="${OLN}" stroke-width="6"/><path d="M-110 20 L110 0 M-110 110 L110 90" stroke="#F4F4F0" stroke-width="28"/><ellipse cx="0" cy="-130" rx="70" ry="30" fill="#2A8A4A" stroke="${OLN}" stroke-width="5"/></g>`);
    s += lay(1, horse(560, 1600, .55, 0, { gal: 0, saddle: 0, reins: 0 }) + `<g transform="translate(720,560)"><rect x="-200" y="-50" width="400" height="90" rx="8" fill="#C8A060" stroke="${OLN}" stroke-width="5"/><text x="0" y="12" text-anchor="middle" font-family="'DejaVu Serif',serif" font-weight="700" font-size="40" fill="${OLN}">SWEET KISS</text></g>`);
    if (L > 2.2) s += `<g transform="translate(540,330)">${TAG(0, 0, 'NUNCA MAIS CORREU', 1.1)}</g>`;
    return s + VIG(.85);
  }
  // loop: volta para a chegada
  const L2 = L - 4.4, ph = t * 9;
  cam(540, 1180, 1.1);
  let s = lay(1, track(t, L2 * 1800, { cheer: 1 })) + lay(1, finishPost(lerp(1400, 200, range(L2, 0, d - 4.4))));
  s += lay(1, horse(560, 1720, .5, ph, { rider: rider(ph, { dead: 1 }), handX: 260, handY: -760 })) + lay(1, SPEED(1));
  return s + VIG(.8);
}
const FN = { n1: s1, n2: s2, n3: s3, n4: s4, n5: s5, n6: s6, n7: s7, n8: s8 };

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
