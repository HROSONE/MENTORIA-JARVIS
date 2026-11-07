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
/* ===================== Bananeira até a Ferrari (Hryz Animation) ===================== */
const bump = x => x < 0 || x > 1 ? 0 : Math.sin(x * Math.PI);
function boltPath(x0, y0, x1, y1, seed, n = 14, amp = 70) {
  let r = seed * 9301 + 49297; const rn = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const pts = []; for (let i = 0; i <= n; i++) { const k = i / n, j = i === 0 || i === n ? 0 : (rn() - .5) * amp * (1 - k * .5); pts.push([x0 + (x1 - x0) * k + j, y0 + (y1 - y0) * k + (rn() - .5) * 20]); }
  let d = 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join(' L'), br = '';
  for (let b = 0; b < 3; b++) { const i = 2 + Math.floor(rn() * (n - 5)), [bx, by] = pts[i]; let x = bx, y = by; br += `M${f1(x)} ${f1(y)}`; const dir = rn() < .5 ? -1 : 1; for (let k = 0; k < 4; k++) { x += dir * (30 + rn() * 50); y += 40 + rn() * 60; br += ` L${f1(x)} ${f1(y)}`; } }
  return [d, br];
}
function bolt(x0, y0, x1, y1, seed, a = 1, w = 1) {
  if (a <= 0) return '';
  const [d, br] = boltPath(x0, y0, x1, y1, seed);
  return `<g opacity="${op(a)}"><path d="${d}" stroke="#7AB8FF" stroke-width="${60 * w}" fill="none" opacity=".45" filter="url(#b12)"/><path d="${br}" stroke="#BFE0FF" stroke-width="${6 * w}" fill="none"/><path d="${d}" stroke="#CFE8FF" stroke-width="${16 * w}" fill="none" stroke-linejoin="round"/><path d="${d}" stroke="#FFFFFF" stroke-width="${6 * w}" fill="none" stroke-linejoin="round"/></g>`;
}
// relâmpagos de fundo: lista de instantes globais
const FL_T = [0.55, 2.2, 5.1, 9.6, 14.2, 19.4, 27.6, 34.4, 40.3, 42.2];
function flashAt(t) { let k = 0; FL_T.forEach(f => { const u = t - f; if (u >= -.08 && u < .6) k = Math.max(k, u < 0 ? .4 : (u < .08 ? 1 : u < .14 ? .3 : u < .2 ? .9 : Math.max(0, 1 - (u - .2) / .4) * .7)); }); return k; }
const FLASH = k => k > 0 ? `<rect width="1080" height="1920" fill="#DDE8FF" opacity="${op(k * .12)}"/>` : '';
const RAIN = () => '';
const CURB = 300, CURBY = 1412, GR = 1500, WAT = 1425, CARX = 800, MS = .45;
/* ---------- cenário lateral: cidade, calçada, rua alagada ---------- */
function cityBack(t, fl) {
  const id = nid('sk');
  def(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070A14"/><stop offset="1" stop-color="#1E2638"/></linearGradient>`);
  let s = `<rect x="-3000" y="-2000" width="8000" height="6000" fill="url(#${id})"/>`;
  if (fl > 0) s += `<rect x="-3000" y="-2000" width="8000" height="6000" fill="#9AB4E8" opacity="${op(fl * .5)}"/>`;
  for (let i = 0; i < 16; i++) { const x = -1600 + i * 300, h = 600 + ((i * 137) % 5) * 120, y = 1412 - h; s += `<rect x="${x}" y="${y}" width="270" height="${h}" fill="${mix('#12161F', '#3A4256', fl * .6)}"/>`; for (let r = 0; r < Math.floor(h / 110); r++) for (let c = 0; c < 3; c++) { const on = ((i * 7 + r * 3 + c) % 5) < 2; s += `<rect x="${x + 30 + c * 80}" y="${y + 40 + r * 110}" width="46" height="60" fill="${on ? '#FFD88A' : '#1E2430'}" opacity="${on ? .8 : 1}"/>`; } }
  return s;
}
function sidewalk(t) {
  return `<rect x="-3000" y="${CURBY}" width="${3000 + CURB}" height="${GR - CURBY}" fill="#6A6A70"/><rect x="-3000" y="${CURBY}" width="${3000 + CURB}" height="16" fill="#8A8A90"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${CURB - 120 - i * 240} ${CURBY} V${GR}" stroke="#55555A" stroke-width="4"/>`).join('')}<rect x="${CURB - 24}" y="${CURBY}" width="24" height="${GR - CURBY}" fill="#9A9AA0" stroke="#3A3A40" stroke-width="3"/>
  <path d="M-200 ${CURBY} V600" stroke="#2A2A30" stroke-width="16"/><path d="M-200 600 Q-200 560 -140 560 L-60 560" stroke="#2A2A30" stroke-width="12" fill="none"/><path d="M-90 560 L-30 560 L-40 590 L-80 590Z" fill="#3A3A40"/><path d="M-60 590 L-180 ${CURBY} L60 ${CURBY}Z" fill="#FFE6A0" opacity=".1"/><circle cx="-60" cy="596" r="14" fill="#FFF0C0"/><circle cx="-60" cy="600" r="70" fill="#FFE6A0" opacity=".25" filter="url(#b12)"/>`;
}
function road() { return `<rect x="-3000" y="${GR}" width="9000" height="1200" fill="#14151A"/><rect x="${CURB}" y="${GR - 6}" width="6000" height="14" fill="#2A2C34"/>${Array.from({ length: 30 }, (_, i) => `<circle cx="${-2000 + i * 230}" cy="${GR + 60 + (i % 4) * 70}" r="${10 + i % 3 * 6}" fill="#22242C"/>`).join('')}`; }
function water(t, x0 = CURB, x1 = 6000, fl = 0) {
  let w = '';
  let d = `M${x0} ${WAT}`; for (let x = x0; x <= x1; x += 40) d += ` L${x} ${f1(WAT + 4 * Math.sin(x / 60 + t * 4) + 3 * Math.sin(x / 23 - t * 6))}`; d += ` L${x1} ${GR} L${x0} ${GR}Z`;
  w += `<path d="${d}" fill="${mix('#2A4A6A', '#6A8AB8', fl)}" opacity=".62"/>`;
  w += `<path d="${d.split(' L' + x1 + ' ' + GR)[0]}" stroke="#A8C8E8" stroke-width="4" fill="none" opacity=".7"/>`;
  for (let i = 0; i < 8; i++) { const p = (t * .5 + i * .37) % 1, x = x0 + ((i * 373) % 2200); w += `<path d="M${f1(x + p * 120)} ${WAT + 18} h${f1(60 + 40 * Math.sin(i))}" stroke="#A8C8E8" stroke-width="3" opacity="${op(bump(p) * .5)}"/>`; }
  return w;
}
/* ---------- a Ferrari vermelha "Hryz Animation" (lateral, frente à direita) ---------- */
function car(x, y, t, o = {}) {
  const wr = o.wheel || 0;
  const body = `M0 -60 L5 -190 Q10 -240 70 -252 L300 -270 Q420 -314 560 -306 Q660 -300 760 -238 L960 -202 Q1090 -178 1120 -122 L1125 -72 Q1120 -55 1100 -55 L1020 -55 A95 95 0 0 0 830 -55 L295 -55 A95 95 0 0 0 105 -55Z`;
  let g = `<g transform="translate(${f1(x)},${f1(y)})">`;
  g += `<ellipse cx="560" cy="4" rx="600" ry="26" fill="#000" opacity=".4" filter="url(#b12)"/>`;
  if (o.door > 0) g += `<path d="M335 -240 L735 -240 L720 -92 L345 -92Z" fill="#141418"/><path d="M420 -230 Q520 -250 600 -200 L620 -110 L430 -110Z" fill="#7A1414" stroke="#0A0A0E" stroke-width="4"/><path d="M630 -210 L700 -160" stroke="#2A2A30" stroke-width="16" stroke-linecap="round"/>`;
  if (o.inside) g += o.inside;
  const doorPath = `M335 -240 L735 -240 L720 -92 L345 -92Z`;
  const id = nid('cb');
  def(`<clipPath id="${id}"><path d="${body}"/></clipPath>`);
  let paint = `<path fill-rule="evenodd" d="${body}${o.door > 0 ? ' ' + doorPath : ''}" fill="#C8141E" stroke="#16110E" stroke-width="6" stroke-linejoin="round"/>`;
  paint += `<g clip-path="url(#${id})" ${o.door > 0 ? 'opacity=".0"' : ''}><path d="M-20 -150 Q560 -190 1140 -120 L1140 -40 L-20 -40Z" fill="#8A0A12" opacity=".55"/><path d="M60 -244 Q560 -280 940 -206" stroke="#FF8A8A" stroke-width="10" fill="none" opacity=".55"/><path d="M200 -170 Q600 -196 1000 -160" stroke="#FFFFFF" stroke-width="4" fill="none" opacity=".35"/></g>`;
  paint += `<path d="M330 -262 Q430 -298 560 -294 Q640 -290 730 -242 L330 -242Z" fill="#1A2230" stroke="#16110E" stroke-width="5"/><path d="M380 -262 L420 -248 M600 -288 L650 -250" stroke="#8AB0D8" stroke-width="6" opacity=".5"/><path d="M540 -294 L545 -242" stroke="#16110E" stroke-width="10"/>`;
  if (!(o.door > 0)) paint += `<path d="${doorPath}" fill="none" stroke="#6A0A10" stroke-width="5"/><rect x="620" y="-206" width="50" height="10" rx="5" fill="#E8E8EE" stroke="#16110E" stroke-width="2"/>`;
  paint += `<path d="M230 -200 L310 -200 L300 -150 L240 -150Z" fill="#1A1010" stroke="#16110E" stroke-width="4"/><path d="M240 -190 H302 M242 -176 H300 M244 -162 H298" stroke="#3A2A2A" stroke-width="3"/>`;
  paint += `<path d="M1060 -170 Q1100 -166 1116 -140 L1070 -146Z" fill="#FFF4D0" stroke="#16110E" stroke-width="3"/><path d="M6 -214 L40 -218 L42 -196 L8 -192Z" fill="#FF2A2A" stroke="#16110E" stroke-width="3"/>`;
  paint += `<path d="M762 -238 L758 -255 L790 -258 L794 -236" fill="#1A1A1E"/>`;
  if (!(o.door > 0) && !o.refl) paint += `<text x="520" y="-112" text-anchor="middle" font-family="'DejaVu Serif',serif" font-style="italic" font-weight="700" font-size="30" fill="#FFE6A0" letter-spacing="1">Hryz Animation</text>`;
  if (!o.refl) paint += `<g transform="translate(1012,-178)"><path d="M-16 -20 L16 -20 L16 4 Q16 20 0 26 Q-16 20 -16 4Z" fill="#FFD23A" stroke="#16110E" stroke-width="3"/><text x="0" y="8" text-anchor="middle" font-family="'DejaVu Serif',serif" font-weight="700" font-size="22" fill="#16110E">H</text></g>`;
  g += paint;
  if (o.door > 0) { const w = 400 * (1 - .75 * o.door), sk = 60 * o.door; g += `<path d="M735 -240 L${f1(735 - w)} ${f1(-240 + sk * .3)} L${f1(735 - w + 10)} ${f1(-92 + sk)} L720 -92Z" fill="#B0101A" stroke="#16110E" stroke-width="5"/><path d="M${f1(735 - w * .9)} -200 L${f1(735 - w * .7)} -200" stroke="#E8E8EE" stroke-width="8"/>`; }
  if (o.ws) g += `<g transform="translate(655,-282) rotate(22)">${jacketFly(0, 0, .95, 0, .5)}</g><path d="M700 -246 Q712 -200 700 -170 L722 -168 Q730 -204 720 -246Z" fill="#262C40" stroke="#16110E" stroke-width="5"/>`;
  [200, 925].forEach(wx => g += `<g transform="translate(${wx},-85) rotate(${f1(wr)})"><circle r="84" fill="#141416" stroke="#16110E" stroke-width="5"/><circle r="58" fill="#B8BCC4" stroke="#16110E" stroke-width="4"/>${[0, 72, 144, 216, 288].map(a => `<path d="M0 0 L${f1(52 * Math.cos(a * Math.PI / 180))} ${f1(52 * Math.sin(a * Math.PI / 180))}" stroke="#5A5E66" stroke-width="12" stroke-linecap="round"/>`).join('')}<circle r="14" fill="#2A2A30"/><path d="M-30 -40 A50 50 0 0 1 30 -40" stroke="#FFD23A" stroke-width="12" fill="none"/></g>`);
  return g + '</g>';
}
// reflexo do carro na água
const carRefl = (x, t, o) => { def(`<clipPath id="wclip"><rect x="${CURB}" y="${WAT}" width="8000" height="${GR - WAT}"/></clipPath>`); return `<g clip-path="url(#wclip)"><g opacity=".3" transform="translate(0,${2 * WAT}) scale(1,-1)">${car(x, WAT, t, Object.assign({}, o, { refl: 1 }))}</g></g>`; };
/* ---------- casaco solto ---------- */
function jacketFly(x, y, s, rot, spread = 0) { const w = 1 + spread * .6; return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${f1(s * w * 100) / 100},${f1(s * (1 - spread * .25) * 100) / 100})"><path d="M-80 -20 Q-96 -54 -60 -64 Q-40 -96 -6 -80 Q20 -104 52 -78 Q90 -76 88 -40 Q112 -14 86 14 Q92 50 54 56 Q30 80 -4 62 Q-36 82 -62 56 Q-100 52 -92 18 Q-112 0 -80 -20Z" fill="#262C40" stroke="#16110E" stroke-width="6" stroke-linejoin="round"/><path d="M-60 -30 Q-20 -50 20 -36 M-50 10 Q0 -6 50 14 M-20 40 Q10 30 40 44 M30 -60 Q50 -30 40 0" stroke="#1A1E2E" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M-50 -48 Q-10 -66 30 -56" stroke="#4A5472" stroke-width="6" fill="none" stroke-linecap="round"/></g>`; }
// homem de cabeça para baixo (bananeira). hx = ponto das mãos no chão
function handstand(hx, hy, o = {}) {
  const s = o.s || MS, a = o.walk || 0;
  return `<g transform="translate(${f1(hx)},${f1(hy)}) rotate(180)">${man(Object.assign({ x: 0, y: 1130 * s, s, kind: 'camisa', flip: -1, armF: [180 + 12 * a, 0], armB: [180 - 12 * a, 0], legF: [8, -14], legB: [-6, -10], rollF: 1, rollB: 1, shadow: 0 }, o.p || {}))}</g>`;
}
/* ====================== CENAS ====================== */
// 1. de frente, de baixo para cima; o clarão reflete nele
function frontMan(fl) {
  const B = '#262C40', BD = '#1C2132', SK = '#D8A07A';
  let f = '';
  f += `<path d="M370 1920 L400 1290 L530 1290 L520 1920Z" fill="${BD}"/><path d="M560 1920 L550 1290 L680 1290 L710 1920Z" fill="${B}"/>`;
  f += `<path d="M330 1940 L350 1880 L530 1880 L540 1940Z" fill="#4A2C18"/><path d="M550 1940 L560 1880 L730 1880 L750 1940Z" fill="#4A2C18"/>`;
  f += `<path d="M350 930 Q540 880 730 930 L760 1380 Q540 1420 320 1380Z" fill="${B}" stroke="#0A0C12" stroke-width="5"/>`;
  f += `<path d="M480 920 L540 1210 L600 920Z" fill="#ECEBE4"/><path d="M528 930 L552 930 L566 1150 L540 1190 L514 1150Z" fill="#9A1A22"/><path d="M470 916 L540 1230 L440 1100Z" fill="${BD}" stroke="#0A0C12" stroke-width="4"/><path d="M610 916 L540 1230 L640 1100Z" fill="${BD}" stroke="#0A0C12" stroke-width="4"/><circle cx="560" cy="1290" r="9" fill="#C8A040"/><path d="M620 1010 l40 -6" stroke="#ECEBE4" stroke-width="10"/>`;
  f += `<path d="M352 940 Q300 960 290 1060 L270 1360 L340 1366 L364 1080Z" fill="${BD}" stroke="#0A0C12" stroke-width="5"/><path d="M728 940 Q780 960 790 1060 L810 1360 L740 1366 L716 1080Z" fill="${BD}" stroke="#0A0C12" stroke-width="5"/>`;
  f += `<ellipse cx="305" cy="1395" rx="36" ry="44" fill="${SK}" stroke="#0A0C12" stroke-width="4"/><ellipse cx="775" cy="1395" rx="36" ry="44" fill="${SK}" stroke="#0A0C12" stroke-width="4"/>`;
  f += `<rect x="500" y="840" width="80" height="90" rx="20" fill="${SK}"/><path d="M500 900 Q540 930 580 900" stroke="#B8805A" stroke-width="10" fill="none"/>`;
  f += `<ellipse cx="540" cy="770" rx="88" ry="104" fill="${SK}" stroke="#0A0C12" stroke-width="5"/><ellipse cx="452" cy="780" rx="14" ry="26" fill="#C8906A" stroke="#0A0C12" stroke-width="3"/><ellipse cx="628" cy="780" rx="14" ry="26" fill="#C8906A" stroke="#0A0C12" stroke-width="3"/><path d="M450 750 Q440 650 540 646 Q640 650 630 750 Q610 690 540 692 Q470 690 450 750Z" fill="#16100C"/><path d="M490 860 Q540 880 590 860" stroke="#B8805A" stroke-width="8" fill="none" opacity=".6"/>`;
  return f;
}
function s1(t) {
  const { L, d, k } = loc(t, 'n1'), [hx, hy] = HH(t, .6), fl = flashAt(t);
  const step = easeInOut(range(L, .2, d)), bob = Math.abs(Math.sin(L * 5)) * 10 * (L > .2 ? 1 : 0);
  setCam(540 + hx, 960 + hy - bob * .5, lerp(1.0, 1.18, step), 0, [540, 960, 1]);
  let s = '';
  // céu com nuvens carregadas e relâmpagos distantes (sem chuva)
  let sky = `<rect x="-600" y="-600" width="2300" height="1700" fill="${mix('#0A0E1A', '#3A4A6A', fl * .6)}"/>`;
  for (let i = 0; i < 9; i++) { const x = -300 + i * 200 + (t * 8) % 200, y = 140 + (i % 3) * 70; sky += `<ellipse cx="${x}" cy="${y}" rx="190" ry="80" fill="${mix('#141A28', '#7A8AB0', fl * (i % 2 ? .8 : .4))}"/>`; }
  if (fl > .5) sky += bolt(820, 120, 760, 460, 13, fl, .6);
  s += lay(.15, sky);
  // prédios do outro lado da rua
  let bd = ''; for (let i = 0; i < 8; i++) { const x = -200 + i * 190, h = 380 + (i * 97) % 220; bd += `<rect x="${x}" y="${740 - h}" width="170" height="${h}" fill="#12161F"/>`; for (let r = 0; r < 4; r++) for (let c2 = 0; c2 < 3; c2++) if ((i + r + c2) % 3) bd += `<rect x="${x + 18 + c2 * 50}" y="${760 - h + 30 + r * 80}" width="26" height="36" fill="#FFD88A" opacity=".55"/>`; }
  s += lay(.35, bd);
  // rua alagada e a Ferrari à frente (de lado)
  let st = `<rect x="-600" y="740" width="2300" height="420" fill="#1A2638"/><rect x="-600" y="740" width="2300" height="14" fill="#6A6A70"/>`;
  for (let i = 0; i < 10; i++) st += `<path d="M${-400 + i * 180 + (t * 20) % 180} ${820 + (i % 3) * 30} h90" stroke="#8AB0D8" stroke-width="3" opacity=".35"/>`;
  st += `<g transform="translate(250,1000) scale(.56)">${car(0, 0, t, {})}</g>`;
  st += `<g opacity=".25" transform="translate(250,1000) scale(.56,-.36)">${car(0, 0, t, { refl: 1 })}</g>`;
  st += `<rect x="-600" y="1120" width="2300" height="60" fill="#8A8A90"/><rect x="-600" y="1176" width="2300" height="900" fill="#5A5A62"/>`;
  st += `<path d="M300 1180 L60 1920 L1020 1920 L780 1180Z" fill="#FFD9A0" opacity=".18"/><ellipse cx="700" cy="1500" rx="220" ry="40" fill="#8AB0D8" opacity=".25"/>`;
  s += lay(.7, st);
  // batente da porta do estabelecimento (luz quente vindo de dentro)
  s += lay(1, `<rect x="-200" y="-400" width="230" height="3000" fill="#2A1A10"/><rect x="1050" y="-400" width="230" height="3000" fill="#2A1A10"/><rect x="-200" y="-400" width="1500" height="260" fill="#2A1A10"/><rect x="20" y="-140" width="16" height="3000" fill="#FFB060" opacity=".5"/><rect x="1044" y="-140" width="16" height="3000" fill="#FFB060" opacity=".5"/>`);
  // ombro e nuca dele em primeiro plano (sem rosto)
  const fx = lerp(-40, 40, step), fy = lerp(0, 40, step) + bob;
  s += lay(1.25, `<g transform="translate(${f1(fx)},${f1(fy)})"><path d="M-200 1920 L-160 1560 Q-120 1420 80 1400 L300 1390 Q480 1400 560 1500 Q600 1600 610 1920Z" fill="#262C40" stroke="#0A0C12" stroke-width="6"/><path d="M80 1400 Q200 1500 300 1390" stroke="#1C2132" stroke-width="10" fill="none"/><path d="M180 1405 L190 1340 L300 1340 L320 1400Z" fill="#ECEBE4"/><rect x="190" y="1250" width="120" height="120" rx="30" fill="#C8906A"/><ellipse cx="250" cy="1150" rx="125" ry="150" fill="#16100C" stroke="#0A0806" stroke-width="5"/><ellipse cx="128" cy="1180" rx="18" ry="34" fill="#C8906A"/><path d="M140 1060 Q250 1010 360 1070" stroke="#3A2A20" stroke-width="8" fill="none" opacity=".6"/><path d="M-160 1560 Q-120 1420 80 1400" stroke="#FFB060" stroke-width="8" fill="none" opacity=".5"/></g>`);
  return s + VIG(.95) + FLASH(fl);
}
// cena de rua (lado): base comum
function street(t, fl, carO = {}, after = '') {
  return lay(.25, cityBack(t, fl)) + lay(1, sidewalk(t) + road() + car(CARX, GR, t, carO) + carRefl(CARX, t, carO) + after + water(t, CURB, 4000, fl));
}
// 2. a Ferrari está longe da calçada: linha de 2 m
function s2(t) {
  const { L, d, k } = loc(t, 'n2'), [hx, hy] = HH(t, .6), fl = flashAt(t);
  setCam(lerp(760, 700, easeInOut(k)) + hx, lerp(700, 780, k) + hy, lerp(.64, .72, easeInOut(k)), 0, [540, 1200, 1]);
  let s = street(t, fl);
  const look = range(L, .2, .8), dl = easeInOut(range(L, 1.0, 2.2));
  s += lay(1, man({ x: 140, y: CURBY, s: MS, kind: 'terno', flip: 1, lean: 4 * look, armF: [lerp(10, 80, look), lerp(10, -10, look)], legF: [0, 0] }));
  if (dl > 0) { const x1 = CURB + 500 * dl, y = 1250; s += lay(1, `<path d="M${CURB} ${y - 40} V${CURBY}" stroke="#FFE04A" stroke-width="5" stroke-dasharray="14 10"/><path d="M${CARX} ${y - 40} V${GR - 120}" stroke="#FFE04A" stroke-width="5" stroke-dasharray="14 10" opacity="${op(dl)}"/><path d="M${CURB} ${y} L${f1(x1)} ${y}" stroke="#FFE04A" stroke-width="8"/><path d="M${CURB + 26} ${y - 18} L${CURB} ${y} L${CURB + 26} ${y + 18}" stroke="#FFE04A" stroke-width="8" fill="none"/>${dl > .95 ? `<path d="M${CARX - 26} ${y - 18} L${CARX} ${y} L${CARX - 26} ${y + 18}" stroke="#FFE04A" stroke-width="8" fill="none"/>` : ''}<g transform="translate(${(CURB + CARX) / 2},${y - 50}) scale(${f1((1 + .3 * bump(range(L, 2.1, 2.5))) * 100) / 100})" opacity="${op(range(L, 1.9, 2.2))}"><rect x="-80" y="-44" width="160" height="70" rx="14" fill="#0A0806" opacity=".75"/><text x="0" y="12" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="52" fill="#FFE04A">2 m</text></g>`); }
  s += RAIN(t, .8);
  return s + VIG(.85) + FLASH(fl);
}
// 3. rua alagada: régua de 30 cm
function s3(t) {
  const { L, d, k } = loc(t, 'n3'), [hx, hy] = HH(t, .5), fl = flashAt(t);
  const z = lerp(.72, 2.4, easeInOut(range(L, .4, 2.4)));
  setCam(lerp(700, 420, easeInOut(range(L, .4, 2.4))) + hx, lerp(720, 1360, easeInOut(range(L, .4, 2.4))) + hy, z, 0, [540, 1200, 1]);
  let s = street(t, fl);
  s += lay(1, man({ x: 140, y: CURBY, s: MS, kind: 'terno', armF: [10, 10] }));
  // patinho de borracha passando (lúdico)
  const dx = lerp(1300, 300, range(L, 0, d)), bob = 4 * Math.sin(t * 3);
  s += lay(1, `<g transform="translate(${f1(dx)},${f1(WAT - 4 + bob)}) scale(.9)"><ellipse cx="0" cy="0" rx="30" ry="18" fill="#FFD23A" stroke="#16110E" stroke-width="3"/><circle cx="-20" cy="-22" r="14" fill="#FFD23A" stroke="#16110E" stroke-width="3"/><path d="M-34 -22 L-46 -18 L-34 -14Z" fill="#FF8A2A"/><circle cx="-24" cy="-25" r="2.5" fill="#16110E"/></g>`);
  const r = easeOut(range(L, 1.6, 2.6));
  if (r > 0) { const top = GR - 75 * r; s += lay(1, `<rect x="${CURB + 14}" y="${f1(top - 8)}" width="34" height="${f1(GR - top + 8)}" fill="#FFF3D6" stroke="#16110E" stroke-width="3"/>${Array.from({ length: Math.floor(30 * r) + 1 }, (_, i) => `<path d="M${CURB + 14} ${f1(GR - i * 2.5)} h${i % 5 === 0 ? 18 : 9}" stroke="#16110E" stroke-width="${i % 5 === 0 ? 1.6 : .9}"/>`).join('')}<path d="M${CURB + 58} ${GR} V${f1(top)}" stroke="#FFE04A" stroke-width="3"/><path d="M${CURB + 50} ${f1(top + 8)} L${CURB + 58} ${f1(top)} L${CURB + 66} ${f1(top + 8)} M${CURB + 50} ${GR - 8} L${CURB + 58} ${GR} L${CURB + 66} ${GR - 8}" stroke="#FFE04A" stroke-width="3" fill="none"/>` + (r > .9 ? `<g transform="translate(${CURB + 112},${WAT + 36}) scale(${f1((1 + .3 * bump(range(L, 2.5, 2.9))) * 40) / 100})"><rect x="-90" y="-44" width="180" height="70" rx="14" fill="#0A0806" opacity=".75"/><text x="0" y="12" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="48" fill="#FFE04A">30 cm</text></g>` : '')); }
  s += RAIN(t, .8);
  return s + VIG(.85) + FLASH(fl);
}
// 4. tira o casaco num golpe de kung fu
function s4(t) {
  const { L, d, k } = loc(t, 'n4'), [hx, hy] = HH(t, .5), fl = flashAt(t);
  const T0 = 2.9, rip = range(L, T0, T0 + .22), punch = bump(range(L, T0, T0 + .5));
  setCam(lerp(380, 230, easeInOut(range(L, 0, 2.6))) + hx + punch * 10 * Math.sin(L * 90), lerp(1250, 1180, k) + hy, lerp(.9, 1.35, easeInOut(range(L, 0, 2.6))) + punch * .15, punch * -3, [540, 1200, 1]);
  let s = street(t, fl);
  const think = range(L, .4, .8) - range(L, 2.5, 2.8);
  let p;
  if (rip <= 0) p = { kind: 'terno', armF: [lerp(10, 60, think), lerp(10, 110, think)], armB: [-6, 10], held: '' };
  else p = { kind: 'camisa', armF: [lerp(-40, 150, easeOut(rip)), lerp(60, -10, rip)], armB: [lerp(30, -60, rip), 20], lean: -6 * punch, legF: [20 * punch, 0], legB: [-20 * punch, 0], held: `<g transform="rotate(${f1(-20 + 30 * Math.sin(L * 7))})">${jacketFly(20, 120, 1.9, 0)}</g>` };
  s += lay(1, man(Object.assign({ x: 140, y: CURBY, s: MS }, p)));
  if (punch > 0) s += lay(1, Array.from({ length: 7 }, (_, i) => `<path d="M${-60 + i * 18} ${880 + i * 40} q${80 + i * 10} -60 ${200} -40" stroke="#FFFFFF" stroke-width="6" fill="none" opacity="${op(punch * .8)}"/>`).join('') + `<g transform="translate(260,880) scale(${f1(punch)})"><path d="M0 -70 L18 -20 L70 -30 L30 6 L54 56 L4 26 L-40 60 L-26 10 L-74 -14 L-20 -22Z" fill="#FFE04A" stroke="#16110E" stroke-width="5"/></g>`);
  if (think > .5 && rip <= 0) s += lay(1, `<g transform="translate(200,840)" opacity="${op(think)}"><circle r="34" fill="#FFF3D6" stroke="#16110E" stroke-width="4"/><text x="0" y="16" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="46" fill="#16110E">?</text></g>`);
  s += RAIN(t, .8);
  return s + VIG(.85) + FLASH(fl);
}
// 5. pose de karatê e o casaco voa e trava no para-brisa
function s5(t) {
  const { L, d, k } = loc(t, 'n5'), [hx, hy] = HH(t, .5), fl = flashAt(t);
  const TH = 1.9, fly = range(L, TH, TH + 1.0), land = fly >= 1;
  const crane = range(L, .1, .5) - range(L, TH - .1, TH + .1);
  setCam(lerp(300, 1200, easeInOut(range(L, TH, TH + 1.3))) + hx, lerp(1180, 980, easeInOut(range(L, TH, TH + 1.3))) + hy, lerp(1.0, .9, k), 0, [540, 1200, 1]);
  let s = street(t, fl, { ws: land });
  const throwA = range(L, TH - .15, TH + .15);
  const p = { kind: 'camisa', legF: [lerp(0, 90, crane), lerp(0, -110, crane)], armF: L < TH ? [lerp(10, 135, crane), lerp(10, -40, crane)] : [lerp(140, 70, throwA), 0], armB: L < TH ? [lerp(-6, 120, crane), lerp(10, 40, crane)] : [-30, 20], held: L < TH ? jacketFly(10, 60, 1.9, 160) : '', lean: L < TH ? 0 : 8 * bump(throwA) };
  s += lay(1, man(Object.assign({ x: 140, y: CURBY, s: MS }, p)));
  if (crane > .6 && L < TH) s += lay(1, `<circle cx="140" cy="${CURBY - 260}" r="${f1(260 + 20 * Math.sin(t * 6))}" fill="#FFE6A0" opacity=".08"/>`);
  if (fly > 0 && !land) { const x0 = 210, y0 = 1060, x1 = CARX + 650, y1 = GR - 276; const x = lerp(x0, x1, fly), y = lerp(y0, y1, fly) - Math.sin(fly * Math.PI) * 420; s += lay(1, Array.from({ length: 4 }, (_, i) => { const q = Math.max(0, fly - (i + 1) * .05); return `<g opacity="${.15 * (4 - i) / 4}">${jacketFly(lerp(x0, x1, q), lerp(y0, y1, q) - Math.sin(q * Math.PI) * 420, .9, q * 500, bump(q))}</g>`; }).join('') + jacketFly(x, y, .9, fly * 500, bump(fly))); }
  if (land) { const b = bump(range(L, TH + 1.0, TH + 1.35)); s += lay(1, `<g transform="translate(${CARX + 650},${GR - 276}) scale(${f1(1 + .5 * b)})" opacity="${op(b)}"><path d="M0 -80 L18 -24 L76 -30 L30 6 L50 64 L0 30 L-50 64 L-30 6 L-76 -30 L-18 -24Z" fill="#FFE04A" opacity=".85"/></g>`); }
  s += RAIN(t, .8);
  return s + VIG(.85) + FLASH(fl);
}
// 6. arregaça as mangas até o cotovelo
function s6(t) {
  const { L, d, k } = loc(t, 'n6'), [hx, hy] = HH(t, .5), fl = flashAt(t);
  setCam(170 + hx, lerp(1110, 1090, k) + hy, lerp(2.3, 2.5, k), 0, [540, 1200, 1]);
  let s = street(t, fl, { ws: 1 });
  const rf = easeInOut(range(L, .2, 1.1)), rb = easeInOut(range(L, 1.2, 2.1));
  s += lay(1, man({ x: 140, y: CURBY, s: MS, kind: 'camisa', armF: [lerp(40, 60, rb), 85 + 10 * Math.sin(L * 12) * (1 - rf) * (rf > 0 ? 1 : 0)], armB: [lerp(30, 70, rf), 85], rollF: rf, rollB: rb }));
  s += RAIN(t, .6);
  return s + VIG(.85) + FLASH(fl);
}
// 7. plantando bananeira: vira de cabeça para baixo e a câmera vai para cima
function s7(t) {
  const { L, d, k } = loc(t, 'n7'), [hx, hy] = HH(t, .5), fl = flashAt(t);
  let s = '';
  if (L < 1.0) {
    const fp = easeInOut(range(L, .1, .7)), cx = lerp(140, 360, fp), cy = lerp(CURBY, GR, fp) - 565 * MS;
    setCam(cx + 80 + hx, 1020 + hy, 1.0, 0, [540, 1200, 1]);
    s += street(t, fl, { ws: 1 }, '');
    s += lay(1, `<g transform="translate(${f1(cx)},${f1(cy)}) rotate(${f1(fp * 180)})">${man({ x: 0, y: 565 * MS, s: MS, kind: 'camisa', armF: [lerp(10, 180, Math.min(1, fp * 3)), 0], armB: [lerp(-6, 180, Math.min(1, fp * 3)), 0], rollF: 1, rollB: 1, shadow: 0 })}</g>` + water(t, CURB, 4000, fl));
    if (fp > .9) s += lay(1, [cx - 60, cx + 60].map(x => `<ellipse cx="${f1(x)}" cy="${WAT}" rx="${f1(40 + 80 * range(L, .7, 1))}" ry="12" fill="none" stroke="#DCEAF8" stroke-width="5" opacity="${op(1 - range(L, .7, 1))}"/>`).join(''));
    s += RAIN(t, .8);
    return s + VIG(.85) + FLASH(fl);
  }
  // vista de cima: solas das botas para a câmera, água mexendo
  const L2 = L - 1.0, ph = L2 * 7;
  setCam(540 + hx, 960 + hy, lerp(1.05, 1.15, range(L2, 0, d - 1)), lerp(-6, 6, range(L2, 0, d - 1)), [540, 960, 1]);
  const flow = L2 * 260;
  let w = `<rect x="-600" y="-600" width="2400" height="3200" fill="${mix('#1E3A56', '#5A7AA8', fl)}"/>`;
  for (let i = 0; i < 22; i++) { const y = ((i * 120 + flow) % 2640) - 360; w += `<path d="M-600 ${f1(y)} q150 ${f1(20 * Math.sin(t * 2 + i))} 300 0 t300 0 t300 0 t300 0 t300 0 t300 0 t300 0 t300 0" stroke="#8AB0D8" stroke-width="5" fill="none" opacity=".35"/>`; }
  // reflexo das luzes da cidade na água
  for (let i = 0; i < 6; i++) w += `<ellipse cx="${100 + i * 180}" cy="${f1(((i * 300 + flow) % 2200) - 100)}" rx="30" ry="120" fill="#FFD88A" opacity=".12" filter="url(#b12)"/>`;
  s += lay(.6, w);
  // mãos na água (longe, pequenas) com ondinhas alternadas
  const hands = [[400, 1180, Math.sin(ph)], [680, 1180, Math.sin(ph + Math.PI)]];
  let b = '';
  hands.forEach(([x, y, a]) => { const up = Math.max(0, a); b += `<ellipse cx="${x}" cy="${f1(y + up * 30)}" rx="${f1(70 + 60 * (1 - up))}" ry="${f1(36 + 30 * (1 - up))}" fill="none" stroke="#E8F2FF" stroke-width="5" opacity="${op(.7 * (1 - up))}"/><ellipse cx="${x}" cy="${f1(y + up * 30)}" rx="34" ry="24" fill="#B8805A" stroke="#16110E" stroke-width="4"/>`; });
  b += `<path d="M400 1180 L470 1030 M680 1180 L610 1030" stroke="#B8805A" stroke-width="40" stroke-linecap="round"/><path d="M400 1180 L470 1030 M680 1180 L610 1030" stroke="#16110E" stroke-width="48" stroke-linecap="round" opacity=".0"/>`;
  b += `<path d="M450 1060 L470 1000 L610 1000 L630 1060Z" fill="#CDCBC2" stroke="#16110E" stroke-width="4"/>`;
  // costas (camisa), cintura, pernas em escorço e solas grandes
  b += `<ellipse cx="540" cy="960" rx="150" ry="110" fill="#ECEBE4" stroke="#16110E" stroke-width="6"/><path d="M540 860 L540 1060" stroke="#CDCBC2" stroke-width="6"/><ellipse cx="540" cy="900" rx="130" ry="70" fill="#262C40" stroke="#16110E" stroke-width="6"/>`;
  const sway = 12 * Math.sin(ph * .5);
  [[440 + sway, -1], [640 + sway, 1]].forEach(([x, sd], i) => { const bob = 10 * Math.sin(ph + i * Math.PI); b += `<ellipse cx="${f1(x)}" cy="${f1(820 + bob)}" rx="95" ry="80" fill="#1C2132" stroke="#16110E" stroke-width="6"/><g transform="translate(${f1(x)},${f1(760 + bob)}) rotate(${sd * 8})"><path d="M-70 -170 Q-80 -260 0 -270 Q80 -260 70 -170 L74 60 Q70 140 0 150 Q-70 140 -74 60Z" fill="#3A2214" stroke="#16110E" stroke-width="8"/><path d="M-56 -160 Q-62 -244 0 -252 Q62 -244 56 -160 L58 50 Q54 124 0 132 Q-54 124 -58 50Z" fill="#2A1A0E"/>${Array.from({ length: 9 }, (_, j) => `<path d="M-46 ${-220 + j * 34} L46 ${-210 + j * 34}" stroke="#4A3020" stroke-width="10" stroke-linecap="round"/>`).join('')}<rect x="-60" y="-40" width="120" height="30" fill="#16110E" opacity=".6"/></g>`; });
  s += lay(1, b);
  return s + VIG(.95) + FLASH(fl);
}
// 8. anda de bananeira até a porta; segura com uma mão e abre com a outra
function s8(t) {
  const { L, d, k } = loc(t, 'n8'), [hx, hy] = HH(t, .5), fl = flashAt(t);
  const wk = easeInOut(range(L, 0, 1.6)), hxw = lerp(520, 1080, wk), reach = range(L, 1.7, 2.2), open = easeOut(range(L, 2.2, 3.0));
  setCam(lerp(700, 1060, easeInOut(range(L, 0, 2))) + hx, lerp(980, 1080, k) + hy, lerp(.9, 1.15, k), 0, [540, 1200, 1]);
  const handX = CARX + 645;
  let s = street(t, fl, { ws: 1, door: open });
  const walking = wk > 0 && wk < 1 ? Math.sin(L * 12) : 0;
  const pA = { p: { armB: reach > 0 ? [lerp(180, 130, reach), lerp(0, -20, reach)] : [180 - 12 * walking, 0], armF: [180 + 12 * walking, 0] } };
  s += lay(1, handstand(hxw, GR, pA));
  s += lay(1, water(t, CURB, 4000, fl) + (wk > 0 && wk < 1 ? [hxw - 30, hxw + 30].map((x, i) => `<ellipse cx="${f1(x)}" cy="${WAT}" rx="${f1(30 + 30 * Math.abs(Math.sin(L * 12 + i)))}" ry="9" fill="none" stroke="#E8F2FF" stroke-width="4" opacity=".7"/>`).join('') : ''));
  if (open > 0 && open < 1) s += lay(1, `<path d="M${handX + 30} ${GR - 220} q40 -30 60 -10" stroke="#FFE04A" stroke-width="6" fill="none" opacity="${op(1 - open)}"/>`);
  s += RAIN(t, .8);
  return s + VIG(.85) + FLASH(fl);
}
// 9. entra, pega o casaco de volta pela janela e vai embora
function s9(t) {
  const { L, d, k } = loc(t, 'n9'), [hx, hy] = HH(t, .5), fl = flashAt(t);
  const inP = easeInOut(range(L, 0, 1.0)), close = range(L, 1.1, 1.4), grab = range(L, 1.6, 2.7), go = easeIn(range(L, 3.0, d));
  const cx = CARX + go * 2600;
  setCam(lerp(1150, 1400, k) + go * 800 + hx, lerp(1020, 920, k) + hy, lerp(1.0, .85, k), 0, [540, 1200, 1]);
  const door = close > 0 ? 1 - close : 1;
  let inside = '';
  if (L < 1.15) { const id = 'dc'; def(`<clipPath id="${id}"><path d="M335 -240 L735 -240 L720 -92 L345 -92Z"/></clipPath>`); inside = `<g clip-path="url(#${id})"><g transform="translate(${f1(lerp(640, 520, inP))},${f1(lerp(0, -120, inP))}) rotate(${f1(lerp(180, 300, inP))})">${man({ x: 0, y: 1130 * MS, s: MS, kind: 'camisa', flip: -1, armF: [180, 0], armB: [180, 0], rollF: 1, rollB: 1, shadow: 0 })}</g></g>`; }
  const wsOn = grab < .5;
  let s = lay(.25, cityBack(t, fl)) + lay(1, sidewalk(t) + road());
  // janela abre e a mão puxa o casaco
  let arm = '';
  if (grab > 0 && grab < 1) { const ex = cx + 600 + 60 * bump(grab), ey = GR - 250; arm = `<path d="M${cx + 560} ${GR - 230} L${f1(ex + 40 * Math.sin(grab * 3))} ${f1(ey - 20)}" stroke="#ECEBE4" stroke-width="26" stroke-linecap="round"/><circle cx="${f1(ex + 40 * Math.sin(grab * 3))}" cy="${f1(ey - 20)}" r="15" fill="#D8A07A" stroke="#16110E" stroke-width="3"/>` + (grab > .5 ? jacketFly(lerp(cx + 650, cx + 560, (grab - .5) * 2), lerp(GR - 290, GR - 230, (grab - .5) * 2), lerp(.85, .4, (grab - .5) * 2), 20) : ''); }
  const wheel = go * 3000;
  s += lay(1, car(cx, GR, t, { ws: wsOn, door: L < 1.4 ? door : 0, inside, wheel }) + carRefl(cx, t, { ws: wsOn, wheel }) + arm + water(t, CURB, 6000, fl));
  if (go > 0) { const sp = Math.min(1, go * 4); s += lay(1, [cx + 200, cx + 925].map(wx => `<path d="M${wx - 100} ${WAT} q-120 -${f1(140 * sp)} -260 -${f1(40 * sp)}" stroke="#DCEAF8" stroke-width="${f1(16 * sp)}" fill="none" opacity=".75"/>` + Array.from({ length: 8 }, (_, i) => `<circle cx="${f1(wx - 120 - i * 34 - (t * 300 + i * 40) % 80)}" cy="${f1(WAT - 40 * sp - Math.sin(i) * 60 * sp)}" r="${f1(6 + i % 3 * 3)}" fill="#DCEAF8" opacity="${op(.7 * sp)}"/>`).join('')).join('') + `<path d="M${cx - 40} ${WAT + 10} L${cx - 600 * sp} ${WAT + 20} L${cx - 40} ${WAT + 30}Z" fill="#DCEAF8" opacity=".25"/>`); }
  s += RAIN(t, .8);
  return s + VIG(.85) + FLASH(fl);
}
// 10. de trás: ele vai embora pela rua alagada (marca na traseira)
function rearCar(x, y, s, t) {
  return `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(s * 1000) / 1000})"><ellipse cx="0" cy="6" rx="380" ry="30" fill="#000" opacity=".45" filter="url(#b12)"/><rect x="-330" y="-90" width="110" height="100" rx="20" fill="#141416"/><rect x="220" y="-90" width="110" height="100" rx="20" fill="#141416"/><path d="M-360 -60 L-350 -200 Q-300 -250 -200 -258 L200 -258 Q300 -250 350 -200 L360 -60 Q360 -30 330 -30 L-330 -30 Q-360 -30 -360 -60Z" fill="#C8141E" stroke="#16110E" stroke-width="6"/><path d="M-220 -258 Q-180 -360 0 -366 Q180 -360 220 -258Z" fill="#B0101A" stroke="#16110E" stroke-width="6"/><path d="M-170 -268 Q-140 -340 0 -344 Q140 -340 170 -268Z" fill="#1A2230" stroke="#16110E" stroke-width="4"/><path d="M-330 -190 L-200 -190 L-210 -150 L-326 -150Z M330 -190 L200 -190 L210 -150 L326 -150Z" fill="#FF2A2A" stroke="#16110E" stroke-width="4"/><ellipse cx="-265" cy="-170" rx="120" ry="50" fill="#FF3A2A" opacity=".45" filter="url(#b12)"/><ellipse cx="265" cy="-170" rx="120" ry="50" fill="#FF3A2A" opacity=".45" filter="url(#b12)"/><rect x="-130" y="-130" width="260" height="56" rx="8" fill="#F2EEE0" stroke="#16110E" stroke-width="4"/><text x="0" y="-92" text-anchor="middle" font-family="'DejaVu Serif',serif" font-style="italic" font-weight="700" font-size="25" fill="#C8141E">Hryz Animation</text><path d="M-300 -60 L300 -60" stroke="#1A0A0C" stroke-width="10"/><circle cx="-120" cy="-46" r="16" fill="#3A3A40" stroke="#16110E" stroke-width="3"/><circle cx="120" cy="-46" r="16" fill="#3A3A40" stroke="#16110E" stroke-width="3"/></g>`;
}
function s10(t) {
  const { L, d, k } = loc(t, 'n10'), [hx, hy] = HH(t, .5), fl = flashAt(t);
  const up = easeInOut(range(L, 2.0, d - .4));
  setCam(540 + hx, lerp(1150, -1250, up) + hy, lerp(1.0, .85, up), 0, [540, 1100, 1]);
  const vy = 900;   // horizonte
  let sk = `<rect x="-1200" y="-3000" width="3500" height="${vy + 3000}" fill="#070A14"/>`;
  const CL = [[200, -1400, 360, 150], [720, -1250, 420, 170], [420, -1050, 380, 140], [900, -1600, 340, 130], [-60, -1150, 300, 120], [560, -1700, 380, 150], [80, -1750, 300, 120], [980, -1000, 300, 110], [300, -600, 360, 120], [800, -500, 300, 100], [-100, -800, 340, 130], [1100, -1350, 320, 120], [450, -1450, 300, 110], [650, -880, 360, 130], [150, -2000, 380, 140], [850, -2050, 360, 140], [500, -2250, 400, 150], [-150, -1500, 300, 120], [1150, -1800, 320, 120]];
  const glow = i => { const ph = (L * 1.7 + i * .37) % 1; return ph < .12 && (i * 7 + Math.floor(L * 1.7)) % 3 === 0 ? 1 - ph / .12 : 0; };
  CL.forEach(([x, y, rx, ry], i) => { const g = glow(i); sk += `<ellipse cx="${x}" cy="${y + 30}" rx="${rx}" ry="${ry}" fill="#05070E"/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${mix('#161C2C', '#9AB4E8', g)}"/><ellipse cx="${x + 40}" cy="${y - 30}" rx="${rx * .55}" ry="${ry * .5}" fill="${mix('#222A3E', '#DCE8FF', g)}"/>` + (g > 0 ? `<ellipse cx="${x}" cy="${y}" rx="${rx * 1.3}" ry="${ry * 1.6}" fill="#9AC8FF" opacity="${op(g * .35)}" filter="url(#b12)"/>` : ''); });
  [[0, 1, 2.1], [1, 5, 2.9], [3, 2, 3.6], [6, 7, 4.3], [2, 9, 5.0], [14, 16, 4.7], [11, 12, 5.4], [17, 18, 5.8]].forEach(([a, b, tt], i) => { const u = L - tt; if (u > 0 && u < .35) sk += bolt(CL[a][0], CL[a][1] + 60, CL[b][0], CL[b][1] + 40, 30 + i, u < .06 || (u > .12 && u < .2) ? 1 : .4, .9); });
  let s = lay(.85, sk);
  let c = '';
  for (let i = 0; i < 7; i++) { const side = i % 2 ? 1 : -1, z = 1 / (1 + i * .6), bx = 540 + side * (560 * z + 120), bw = 420 * z, bh = 1100 * z; c += `<rect x="${f1(side > 0 ? bx : bx - bw)}" y="${f1(vy - bh * .8)}" width="${f1(bw)}" height="${f1(bh)}" fill="${mix('#12161F', '#3A4256', fl * .6)}"/>`; for (let r = 0; r < 5; r++) c += `<rect x="${f1((side > 0 ? bx : bx - bw) + bw * .2)}" y="${f1(vy - bh * .7 + r * bh * .15)}" width="${f1(bw * .2)}" height="${f1(bh * .08)}" fill="#FFD88A" opacity=".6"/>`; }
  c += `<path d="M-800 2400 L520 ${vy} L560 ${vy} L1900 2400Z" fill="${mix('#20324A', '#5A7AA8', fl)}"/><path d="M-800 2400 L520 ${vy} L-800 ${vy}Z" fill="#4A4A52"/><path d="M1900 2400 L560 ${vy} L1900 ${vy}Z" fill="#4A4A52"/>`;
  for (let i = 0; i < 14; i++) { const p = ((i / 14) + L * .25) % 1, y = vy + Math.pow(p, 2.2) * 1500; c += `<path d="M${f1(540 - 900 * Math.pow(p, 2.2))} ${f1(y)} L${f1(540 + 900 * Math.pow(p, 2.2))} ${f1(y)}" stroke="#8AB0D8" stroke-width="${f1(1 + 4 * p)}" opacity=".35"/>`; }
  const dist = easeIn(range(L, 0, d)), sc = lerp(1.1, .12, Math.pow(dist, .6)), cy = lerp(1650, vy + 20, Math.pow(dist, .6));
  c += `<ellipse cx="540" cy="${f1(cy + 200 * sc)}" rx="${f1(220 * sc)}" ry="${f1(400 * sc)}" fill="#FF3A2A" opacity=".18" filter="url(#b12)"/>`;
  c += rearCar(540, cy, sc, t);
  c += `<path d="M${f1(540 - 330 * sc)} ${f1(cy)} q-${f1(200 * sc)} -${f1(150 * sc)} -${f1(420 * sc)} -${f1(40 * sc)} M${f1(540 + 330 * sc)} ${f1(cy)} q${f1(200 * sc)} -${f1(150 * sc)} ${f1(420 * sc)} -${f1(40 * sc)}" stroke="#DCEAF8" stroke-width="${f1(20 * sc)}" fill="none" opacity=".7"/>`;
  s += lay(1, c);
  s += RAIN(t, .9);
  return s + VIG(.95) + FLASH(fl) + FADE(range(L, d - .5, d));
}
const FN = { n1: s1, n2: s2, n3: s3, n4: s4, n5: s5, n6: s6, n7: s7, n8: s8, n9: s9, n10: s10 };

function frame(t) {
  D = []; uid = 0;
  const sh = shotAt(t);
  let body = FN[sh[0]](t);
  for (const c of SH.slice(1)) if (t >= c[1] && t < c[1] + .08) body += `<rect width="1080" height="1920" fill="#fff" opacity="${op(.2 * (1 - (t - c[1]) / .08))}"/>`;
  defsEl.innerHTML = STATIC + objDefs() + `<filter id="zapF" x="-30%" y="-30%" width="160%" height="160%"><feFlood flood-color="#F2F8FF"/><feComposite in2="SourceAlpha" operator="in" result="w"/><feGaussianBlur in="w" stdDeviation="14" result="g"/><feFlood flood-color="#6AB0FF"/><feComposite in2="g" operator="in" result="gb"/><feMerge><feMergeNode in="gb"/><feMergeNode in="w"/></feMerge></filter><filter id="manVol" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feOffset in="SourceAlpha" dx="-16" dy="8" result="o1"/><feComposite in="SourceAlpha" in2="o1" operator="out" result="e1"/><feGaussianBlur in="e1" stdDeviation="7" result="b1"/><feComposite in="b1" in2="SourceAlpha" operator="in" result="s1"/><feFlood flood-color="#1A1028" flood-opacity=".38"/><feComposite in2="s1" operator="in" result="sh"/><feOffset in="SourceAlpha" dx="7" dy="-7" result="o2"/><feComposite in="SourceAlpha" in2="o2" operator="out" result="e2"/><feGaussianBlur in="e2" stdDeviation="2.5" result="b2"/><feComposite in="b2" in2="SourceAlpha" operator="in" result="r1"/><feFlood flood-color="#FFF0D0" flood-opacity=".55"/><feComposite in2="r1" operator="in" result="rim"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="sh"/><feMergeNode in="rim"/></feMerge></filter><radialGradient id="gHot"><stop offset="0" stop-color="#FF3A1A" stop-opacity=".95"/><stop offset=".5" stop-color="#FF7A2A" stop-opacity=".6"/><stop offset="1" stop-color="#FFB03A" stop-opacity="0"/></radialGradient><filter id="bl6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
<linearGradient id="beamW2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF0C0" stop-opacity=".6"/><stop offset="1" stop-color="#FFF0C0" stop-opacity="0"/></linearGradient><pattern id="gridP" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0 L0 0 0 60" stroke="#2A4A6A" stroke-width="2" fill="none"/></pattern><pattern id="paperP" width="512" height="512" patternUnits="userSpaceOnUse"><image href="${PAPER}" width="512" height="512"/></pattern>
<pattern id="waveP" width="160" height="90" patternUnits="userSpaceOnUse"><path d="M10 30 q20 -14 40 0 t40 0 M90 70 q20 -14 40 0" stroke="#8AC0E8" stroke-width="3" fill="none"/></pattern>
<pattern id="dotP" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2" fill="#000" opacity=".25"/><circle cx="13" cy="12" r="1.5" fill="#000" opacity=".18"/></pattern>
<pattern id="wallP" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M60 10 L80 60 L60 110 L40 60Z" fill="none" stroke="#B8A888" stroke-width="3"/><circle cx="0" cy="0" r="8" fill="#C8B898"/><circle cx="120" cy="120" r="8" fill="#C8B898"/><circle cx="60" cy="60" r="5" fill="#C8B898"/></pattern>
<pattern id="woodP" width="300" height="70" patternUnits="userSpaceOnUse"><rect width="300" height="70" fill="none" stroke="#6A4A2A" stroke-width="3"/><path d="M10 25 q60 -8 120 0 t140 2 M20 50 q80 6 160 -2" stroke="#8A6A4A" stroke-width="2" fill="none"/></pattern>
<pattern id="brickP" width="80" height="40" patternUnits="userSpaceOnUse"><path d="M0 0 H80 M0 20 H80 M0 0 V20 M40 20 V40" stroke="#5A4A3A" stroke-width="3" fill="none"/></pattern>
<pattern id="crackP" width="260" height="200" patternUnits="userSpaceOnUse"><path d="M0 60 L70 40 L120 90 L200 60 L260 80 M70 40 L60 0 M120 90 L100 200 M200 60 L230 0 M120 90 L180 150 L260 140 M0 160 L60 150 L100 200" stroke="#7A4A20" stroke-width="5" fill="none"/></pattern>` + D.join('');
  root.innerHTML = body + TEXTURE;
}
