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
/* ===================== O homem que (disse que) comeu um avião — v2: close, anime, 4 planos ===================== */
const bump = x => x < 0 || x > 1 ? 0 : Math.sin(x * Math.PI);
const AT = k => S[k].a;   // início de cada fala
const CUTS = [AT('n3'), AT('n5'), AT('n7')];
// personagem inspirado no Lotito real: cabelo escuro, bigode, boina, guardanapo
const LOT = { skin: '#F0C8A0', hair: '#2A1A12', hairStyle: 'grande', iris: '#6A4020', eyeH: 56, eyeW: 52, stache: 1, browW: 9, mouth: 'leve', nose: 'sombra' };
function limb(x0, y0, x1, y1, w0, w1, fill, sw = 6) {
  const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a), bx = (x0 + x1) / 2, by = (y0 + y1) / 2, wm = (w0 + w1) / 2 * 1.05;
  return `<path d="M${f1(x0 + nx * w0)} ${f1(y0 + ny * w0)} Q${f1(bx + nx * wm)} ${f1(by + ny * wm)} ${f1(x1 + nx * w1)} ${f1(y1 + ny * w1)} A${w1} ${w1} 0 0 0 ${f1(x1 - nx * w1)} ${f1(y1 - ny * w1)} Q${f1(bx - nx * wm)} ${f1(by - ny * wm)} ${f1(x0 - nx * w0)} ${f1(y0 - ny * w0)} A${w0} ${w0} 0 0 0 ${f1(x0 + nx * w0)} ${f1(y0 + ny * w0)}Z" fill="${fill}" stroke="#1A1220" stroke-width="${sw}" stroke-linejoin="round"/>`;
}
const SK = '#F0C8A0', SKD = '#D8A47E', OLN = '#1A1220';
// mão (punho) segurando algo; rot em graus
function fist(x, y, rot, item = '') { return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)})">${item}<rect x="-34" y="-30" width="68" height="62" rx="26" fill="${SK}" stroke="${OLN}" stroke-width="6"/><path d="M-20 -6 V22 M0 -8 V24 M20 -6 V22" stroke="${SKD}" stroke-width="5"/><ellipse cx="-30" cy="-6" rx="14" ry="22" fill="${SK}" stroke="${OLN}" stroke-width="5"/></g>`; }
// itens (no espaço da mão; apontando para cima)
const IT = {
  garfo: (bite) => `<g><rect x="-6" y="-200" width="12" height="190" rx="5" fill="#C8CCD4" stroke="${OLN}" stroke-width="4"/><path d="M-20 -200 V-262 M-7 -200 V-268 M7 -200 V-268 M20 -200 V-262" stroke="#C8CCD4" stroke-width="8" stroke-linecap="round"/><path d="M-24 -204 H24" stroke="#C8CCD4" stroke-width="10"/>${bite ? `<g transform="translate(0,-268)"><path d="M-46 -10 L40 -26 L52 6 L-34 22Z" fill="#F4F4F0" stroke="${OLN}" stroke-width="5"/><path d="M-40 4 L46 -10" stroke="#C8282E" stroke-width="10"/><circle cx="-26" cy="12" r="5" fill="#8A8E96"/><circle cx="30" cy="-4" r="5" fill="#8A8E96"/></g>` : ''}</g>`,
  faca: `<g><rect x="-8" y="-60" width="16" height="70" rx="5" fill="#4A2E1E"/><path d="M-8 -60 L-8 -230 Q14 -220 10 -60Z" fill="#DCE0E8" stroke="${OLN}" stroke-width="4"/></g>`,
  copo: (b) => `<g><path d="M-44 -150 L44 -150 L34 0 L-34 0Z" fill="#CFEFFF" fill-opacity=".5" stroke="${OLN}" stroke-width="5"/><path d="M-30 -140 L-24 -10" stroke="#fff" stroke-width="7" opacity=".7"/>${b ? `<path d="M10 -150 l12 26 l14 -12 l8 -14Z" fill="#87CEEB" opacity=".0"/><path d="M8 -152 L18 -128 L30 -140 L38 -122 L46 -150Z" fill="${'#000'}" opacity=".0"/>` : ''}</g>`,
  oleo: `<g><path d="M-36 -180 L36 -180 L40 0 L-40 0Z" fill="#FFE07A" fill-opacity=".85" stroke="${OLN}" stroke-width="5"/><rect x="-16" y="-226" width="32" height="48" fill="#FFE07A" stroke="${OLN}" stroke-width="4"/><rect x="-30" y="-120" width="60" height="44" fill="#F4F0E0" stroke="${OLN}" stroke-width="3"/><text x="0" y="-90" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="17" fill="#6A4A10">ÓLEO</text></g>`,
  banana: (b) => `<g transform="rotate(-20)"><path d="M-14 0 Q-40 -120 ${b ? '-6 -150' : '10 -240'} Q${b ? '10 -150' : '30 -230'} 24 0Z" fill="#FFE04A" stroke="${OLN}" stroke-width="5"/>${b ? '<path d="M-6 -150 l8 -10 l8 10" fill="#F8F0C8" stroke="' + OLN + '" stroke-width="3"/>' : `<path d="M10 -240 l6 -18" stroke="#5A3A10" stroke-width="10"/>`}<path d="M-14 0 Q-40 50 -60 60 M24 0 Q40 50 70 56" stroke="#E8C030" stroke-width="16" fill="none" stroke-linecap="round"/></g>`,
  placa: (b) => `<g transform="translate(0,-120)"><rect x="-150" y="-110" width="300" height="200" rx="12" fill="#C89A3A" stroke="${OLN}" stroke-width="6"/><rect x="-128" y="-90" width="256" height="160" rx="8" fill="#E8C060" stroke="#8A6A20" stroke-width="4"/><text x="0" y="-44" text-anchor="middle" font-family="'DejaVu Serif',serif" font-weight="700" font-size="30" fill="#5A3A10">RECORDE</text><text x="0" y="-4" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="24" fill="#5A3A10">DIETA MAIS</text><text x="0" y="28" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="24" fill="#5A3A10">ESTRANHA</text><text x="0" y="60" text-anchor="middle" font-family="'DejaVu Serif',serif" font-style="italic" font-size="18" fill="#5A3A10">Hryz Animation</text>${b ? `<path d="M150 -110 L150 -10 Q118 -24 122 -48 Q96 -56 104 -80 Q82 -94 98 -110Z" fill="#87C4EC"/>` : ''}</g>`,
  dedo: `<g><rect x="-10" y="-120" width="22" height="100" rx="10" fill="${SK}" stroke="${OLN}" stroke-width="5"/></g>`,
};
/* ---------- o personagem de perto: busto + mesa (espaço da cabeça) ---------- */
// o: { up (0..1 garfo até a boca), item, itemB, emo, mouth, blink, look, x-ray }
function bust(t, o) {
  let g = '';
  // tronco listrado (camisa marinheiro)
  g += `<path d="M-64 230 Q-210 246 -250 340 L-280 1000 L280 1000 L250 340 Q210 246 64 230Z" fill="#F4F2EC" stroke="${OLN}" stroke-width="7"/>`;
  g += `<g clip-path="url(#torsoC)">` + Array.from({ length: 12 }, (_, i) => `<rect x="-300" y="${300 + i * 60}" width="600" height="26" fill="#22325A"/>`).join('') + `</g>`;
  def(`<clipPath id="torsoC"><path d="M-64 230 Q-210 246 -250 340 L-280 1000 L280 1000 L250 340 Q210 246 64 230Z"/></clipPath>`);
  g += `<path d="M230 330 Q256 600 250 1000" stroke="#000" stroke-width="60" opacity=".1" fill="none"/>`;
  // guardanapo xadrez no pescoço
  def(`<pattern id="chkP" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#FFFFFF"/><rect width="20" height="20" fill="#E85A5A" opacity=".8"/><rect x="20" y="20" width="20" height="20" fill="#E85A5A" opacity=".8"/></pattern>`);
  g += `<path d="M-90 236 Q0 270 90 236 L60 470 Q0 520 -60 470Z" fill="url(#chkP)" stroke="${OLN}" stroke-width="6"/><path d="M-40 236 L-70 200 L-20 222 M40 236 L70 200 L20 222" fill="#FFFFFF" stroke="${OLN}" stroke-width="5"/>`;
  // cabeça (anime) + boina
  const hh = ANI.head(Object.assign({}, LOT, { emo: o.emo || 'neutro', mouth: o.mouth || 'leve', look: o.look || 0 }, o.blink ? { eyeStyle: 'line', emo: 'feliz2' } : {}));
  def(ANI.flush());
  g += `<g transform="translate(${f1(o.hx || 0)},${f1(o.hy || 0)}) rotate(${f1(o.tilt || 0)})">${hh}<g transform="translate(18,-150) rotate(-10)"><ellipse cx="0" cy="0" rx="140" ry="46" fill="#7A1A2A" stroke="${OLN}" stroke-width="6"/><path d="M-120 10 Q0 40 130 6" stroke="#5A0E1A" stroke-width="10" fill="none"/><rect x="-6" y="-66" width="12" height="26" rx="4" fill="#7A1A2A" stroke="${OLN}" stroke-width="4"/><path d="M-90 -20 Q-20 -40 60 -30" stroke="#B8485A" stroke-width="8" fill="none" opacity=".7"/></g>${o.green ? `<ellipse cx="0" cy="20" rx="92" ry="120" fill="#7ACB5A" opacity="${op(o.green * .22)}"/>` : ''}${o.sweat ? `<path d="M118 -40 Q136 -8 126 14 Q110 24 104 4 Q104 -18 118 -40Z" fill="#9AD8FF" stroke="${OLN}" stroke-width="4"/>` : ''}</g>`;
  // raio-x sobre a barriga
  if (o.xray > 0) { g += '<g transform="translate(0,-160)">'; def(`<clipPath id="xrC"><rect x="-200" y="420" width="400" height="${f1(420 * o.xray)}" rx="20"/></clipPath>`); const th = 26 + 10 * Math.sin(t * 4); g += `<g clip-path="url(#xrC)"><rect x="-260" y="400" width="520" height="500" fill="#0A2A3A"/>${Array.from({ length: 5 }, (_, i) => `<path d="M-170 ${440 + i * 40} Q0 ${420 + i * 40} 170 ${440 + i * 40}" stroke="#8AE0F0" stroke-width="7" fill="none" opacity=".5"/>`).join('')}<path d="M-40 560 Q-130 620 -100 730 Q-60 830 60 810 Q160 790 150 690 Q140 610 80 600 Q40 590 20 560Z" fill="#D86A6A" stroke="#FFB4A8" stroke-width="${f1(th)}"/>${[[-40, 700, 20], [30, 730, -30], [80, 680, 50], [-60, 760, 80], [10, 660, 10]].map(([x, y, r]) => `<rect x="${x - 26}" y="${y - 10}" width="52" height="20" fill="#C8CCD4" stroke="${OLN}" stroke-width="3" transform="rotate(${r} ${x} ${y})"/>`).join('')}</g><rect x="-200" y="420" width="400" height="${f1(420 * o.xray)}" rx="20" fill="none" stroke="#8AE0F0" stroke-width="8"/></g>`; }
  // mesa com toalha xadrez
  g += `<path d="M-760 640 L760 640 L800 1000 L-800 1000Z" fill="url(#chkP)" stroke="${OLN}" stroke-width="7"/><path d="M-760 640 L760 640" stroke="#FFFFFF" stroke-width="10"/><path d="M-780 820 L780 820" stroke="#000" stroke-width="80" opacity=".08"/>`;
  // prato
  g += `<ellipse cx="60" cy="676" rx="200" ry="40" fill="#E8E8EC" stroke="${OLN}" stroke-width="6"/><ellipse cx="60" cy="672" rx="140" ry="24" fill="#FAFAFC"/>` + (o.plate || '');
  if (o.table) g += o.table;
  // braço esquerdo (faca/item B) e direito (garfo/item)
  const up = o.up || 0, hL = o.handL || [-190, 640], hR = o.handR || [lerp(170, 175, up), lerp(640, 350, up)];
  const eR = o.elbowR || [lerp(300, 310, up), lerp(560, 480, up)], eL = o.elbowL || [-300, 560];
  g += limb(-200, 300, eL[0], eL[1], 56, 48, '#22325A') + limb(eL[0], eL[1], hL[0], hL[1], 48, 40, '#22325A') + fist(hL[0], hL[1], o.rotL || -10, o.itemB !== undefined ? o.itemB : IT.faca);
  g += limb(200, 300, eR[0], eR[1], 56, 48, '#22325A') + limb(eR[0], eR[1], hR[0], hR[1], 48, 40, '#22325A') + fist(hR[0], hR[1], o.rotR !== undefined ? o.rotR : lerp(10, -40, up), o.item !== undefined ? o.item : IT.garfo(o.bite !== false));
  return g;
}
// ciclo de comer: retorna up, mouth, emo, bite (pedaço ainda no garfo?)
function eatCycle(L, sp = .62) {
  const c = (L * sp) % 1;
  const up = c < .32 ? easeInOut(c / .32) : c < .42 ? 1 : 1 - easeInOut((c - .42) / .3);
  const bitten = c >= .38;
  const chewing = c >= .42;
  const mouth = c > .22 && c < .4 ? 'grande' : chewing ? (Math.floor(L * 6.5) % 2 ? 'grande' : 'leve') : 'leve';
  const emo = c > .22 && c < .4 ? 'feliz' : 'neutro';
  return { up, bite: !bitten, mouth: c > .22 && c < .4 ? 'grande' : (chewing && Math.floor(L * 6.5) % 2 ? 'gato' : 'leve'), emo: c > .22 && c < .4 ? 'feliz' : 'neutro', blink: chewing && c > .6 && c < .75, crunch: c >= .38 && c < .55 ? (c - .38) / .17 : -1, c };
}
function crunchFX(x, y, k) { if (k < 0) return ''; return Array.from({ length: 8 }, (_, i) => { const a = i * .8 + 1, r = 30 + k * 160; return `<path d="M${f1(x + Math.cos(a) * r)} ${f1(y + Math.sin(a) * r * .7 - k * 40)} l10 -8 l-4 14Z" fill="${i % 2 ? '#C8CCD4' : '#F4F4F0'}" stroke="${OLN}" stroke-width="2" opacity="${op(1 - k)}"/>`; }).join('') + `<g transform="translate(${x + 120},${y - 90}) scale(${f1((.6 + k * .5) * 100) / 100})" opacity="${op(1 - k)}"><text x="0" y="0" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="70" fill="#FFE04A" stroke="${OLN}" stroke-width="6" transform="rotate(-12)">CROC!</text></g>`; }
/* ---------- avião, céu, campo ---------- */
function cessna(x, y, s, t, eaten = 0) {
  const id = nid('pm'), xc = -600 + eaten * 1010;
  let bm = ''; for (let k = 0; k < 9; k++) { const yy = -380 + k * 46, r = 30 + (k * 37 % 3) * 8; bm += `<circle cx="${f1(xc + (k % 2 ? 10 : -8))}" cy="${yy}" r="${r}" fill="#000"/>`; }
  def(`<mask id="${id}" maskUnits="userSpaceOnUse" x="-900" y="-700" width="1900" height="1000"><rect x="${f1(xc)}" y="-700" width="2000" height="1000" fill="#fff"/>${eaten > 0 ? bm : ''}</mask>`);
  let g = `<g transform="translate(${f1(x)},${f1(y)}) scale(${s})"><ellipse cx="${f1((xc + 400) / 2)}" cy="8" rx="${f1(Math.max(60, (400 - xc) / 2))}" ry="30" fill="#000" opacity=".25" filter="url(#b12)"/><g mask="url(#${id})">`;
  g += `<path d="M120 -170 L80 -40 M220 -170 L250 -40" stroke="#3A3A40" stroke-width="12"/><circle cx="80" cy="-34" r="34" fill="#1A1A1E" stroke="#16110E" stroke-width="4"/><circle cx="250" cy="-34" r="34" fill="#1A1A1E" stroke="#16110E" stroke-width="4"/><path d="M-420 -150 L-440 -60" stroke="#3A3A40" stroke-width="8"/><circle cx="-440" cy="-50" r="16" fill="#1A1A1E"/>`;
  g += `<path d="M-500 -190 L-540 -360 L-470 -360 L-380 -210Z" fill="#F4F4F0" stroke="#16110E" stroke-width="6"/><path d="M-528 -330 L-480 -330 L-430 -250 L-508 -250Z" fill="#C8282E"/><path d="M-560 -196 L-380 -200 L-380 -184 L-560 -182Z" fill="#E8E8E4" stroke="#16110E" stroke-width="5"/>`;
  g += `<path d="M-520 -200 Q-300 -240 -60 -260 L100 -290 Q240 -280 300 -230 L360 -200 Q380 -160 360 -130 L200 -110 Q-100 -130 -520 -176Z" fill="#F4F4F0" stroke="#16110E" stroke-width="6"/><path d="M-500 -186 Q-200 -210 360 -165" stroke="#C8282E" stroke-width="16" fill="none"/>`;
  g += `<path d="M20 -280 L110 -286 L190 -230 L30 -226Z" fill="#7AA8D0" stroke="#16110E" stroke-width="5"/><rect x="-140" y="-332" width="420" height="34" rx="12" fill="#F4F4F0" stroke="#16110E" stroke-width="6"/><rect x="200" y="-330" width="70" height="30" rx="10" fill="#C8282E"/>`;
  g += `<text x="210" y="-128" text-anchor="middle" font-family="'DejaVu Serif',serif" font-style="italic" font-weight="700" font-size="30" fill="#2A4A8A">Hryz Animation</text>`;
  g += `<path d="M360 -200 Q392 -184 360 -134Z" fill="#C8282E" stroke="#16110E" stroke-width="5"/><path d="M380 -290 Q394 -168 380 -46" stroke="#3A3A40" stroke-width="14" fill="none"/></g>`;
  if (eaten > 0 && eaten < 1) g += Array.from({ length: 7 }, (_, k) => `<rect x="${f1(xc - 30 - (k * 23) % 40)}" y="${-30 + (k % 2) * 8}" width="${10 + k % 3 * 6}" height="7" fill="#C8CCD4" stroke="#16110E" stroke-width="2"/>`).join('');
  return g + '</g>';
}
function sky(t, night = 0) { const c1 = mix('#8EC4EC', '#14183A', night), c2 = mix('#CFE8F8', '#2A2A5A', night); const id = nid('sk'); def(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`); return `<rect x="-3000" y="-3000" width="8000" height="8000" fill="url(#${id})"/>` + [0, 1, 2, 3].map(i => `<g transform="translate(${f1(((i * 520 + t * 22) % 2600) - 700)},${200 + (i % 2) * 160})" opacity="${op(1 - night * .7)}"><ellipse rx="170" ry="52" fill="#F4F8FC"/><ellipse cx="70" cy="-30" rx="100" ry="44" fill="#FFFFFF"/></g>`).join(''); }
function field(y) { return `<rect x="-3000" y="${y}" width="8000" height="3000" fill="#7AAE4A"/><rect x="-3000" y="${y}" width="8000" height="16" fill="#5A8E3A"/><rect x="-3000" y="${y + 70}" width="8000" height="130" fill="#7A7E86"/><path d="M-3000 ${y + 135} H5000" stroke="#F4F4F0" stroke-width="8" stroke-dasharray="80 60"/>`; }
// placar diegético (cartão em pé na mesa)
function pctCard(pct, x, y, s = 1) { const w = 300 * Math.max(0, Math.min(1, pct)); return `<g transform="translate(${x},${y}) scale(${s})"><path d="M-170 0 L-150 -170 L150 -170 L170 0Z" fill="#FFF8E8" stroke="${OLN}" stroke-width="6"/><text x="0" y="-118" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="28" fill="#5A3A10">AVIÃO COMIDO</text><text x="0" y="-62" text-anchor="middle" font-family="'DejaVu Sans Mono',monospace" font-weight="700" font-size="54" fill="#C8282E">${Math.round(pct * 100)}%</text><rect x="-150" y="-42" width="300" height="24" rx="12" fill="#E0D8C8" stroke="${OLN}" stroke-width="3"/><rect x="-150" y="-42" width="${f1(w)}" height="24" rx="12" fill="#FFB43A"/></g>`; }
const TAG = (x, y, txt, s = 1, col = '#FFE04A') => `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(s * 100) / 100})"><rect x="${-txt.length * 15 - 20}" y="-38" width="${txt.length * 30 + 40}" height="64" rx="14" fill="#0A0806" opacity=".8"/><text x="0" y="12" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="44" fill="${col}">${txt}</text></g>`;
// ícones da pilha de objetos comidos
function bikeIcon() { return `<circle cx="-60" cy="0" r="46" fill="none" stroke="#16110E" stroke-width="8"/><circle cx="60" cy="0" r="46" fill="none" stroke="#16110E" stroke-width="8"/><path d="M-60 0 L-10 -60 L40 -60 L60 0 M-10 -60 L0 0 L40 -60 M-20 -76 L4 -76 M40 -60 L34 -84 L54 -86" stroke="#C8282E" stroke-width="8" fill="none" stroke-linejoin="round"/>`; }
function cartIcon() { return `<path d="M-90 -80 L-60 -80 L-40 20 L70 20 L90 -50 L-50 -50" fill="none" stroke="#5A5E66" stroke-width="9" stroke-linejoin="round"/>${[-30, 0, 30, 60].map(x => `<path d="M${x - 10} -50 L${x - 6} 20" stroke="#5A5E66" stroke-width="4"/>`).join('')}<circle cx="-30" cy="44" r="14" fill="#16110E"/><circle cx="60" cy="44" r="14" fill="#16110E"/>`; }
function tvIcon() { return `<rect x="-90" y="-70" width="180" height="130" rx="18" fill="#6A4A30" stroke="#16110E" stroke-width="6"/><rect x="-72" y="-54" width="110" height="96" rx="14" fill="#9AC8C0" stroke="#16110E" stroke-width="4"/><circle cx="62" cy="-30" r="8" fill="#16110E"/><path d="M-30 -70 L-60 -120 M10 -70 L40 -120" stroke="#16110E" stroke-width="5"/>`; }
function lampIcon() { return `<path d="M-100 -60 Q0 -110 100 -60 L80 -40 L-80 -40Z" fill="#E8C060" stroke="#16110E" stroke-width="5"/>${[-70, -35, 0, 35, 70].map(x => `<path d="M${x} -40 L${x} 0" stroke="#C8A040" stroke-width="4"/><path d="M${x} 0 l-8 18 l8 14 l8 -14Z" fill="#CFEFFF" stroke="#16110E" stroke-width="3"/>`).join('')}`; }
function bedIcon() { return `<rect x="-120" y="-30" width="240" height="40" fill="#8A5A3A" stroke="#16110E" stroke-width="5"/><rect x="-120" y="-80" width="24" height="120" fill="#6A4028" stroke="#16110E" stroke-width="5"/><rect x="96" y="-56" width="24" height="96" fill="#6A4028" stroke="#16110E" stroke-width="5"/><rect x="-96" y="-56" width="70" height="26" rx="10" fill="#FFFFFF" stroke="#16110E" stroke-width="4"/><rect x="-26" y="-50" width="122" height="22" fill="#4A7AC8" stroke="#16110E" stroke-width="4"/>`; }
function coffinIcon() { return `<path d="M-130 0 L-90 -50 L120 -44 L140 0 L120 44 L-90 50Z" fill="#6A3A22" stroke="#16110E" stroke-width="6" stroke-linejoin="round"/>${[-40, 20, 80].map(x => `<rect x="${x - 14}" y="44" width="28" height="12" rx="5" fill="#E8C060" stroke="#16110E" stroke-width="3"/>`).join('')}`; }
// peças no prato
const PLATE = (n = 3) => [[0, 650, -6], [80, 660, 12], [130, 648, -20]].slice(0, n).map(([x, y, r]) => `<g transform="translate(${x},${y}) rotate(${r})"><path d="M-40 -10 L36 -16 L44 8 L-30 14Z" fill="#F4F4F0" stroke="${OLN}" stroke-width="4"/><path d="M-30 0 L34 -4" stroke="#C8282E" stroke-width="7"/></g>`).join('');
/* ====================== PLANO A (n1 + n2): close comendo → recua e revela o avião ====================== */
function shotA(t) {
  const L = t, [hx, hy] = HH(t, .7), e = eatCycle(L + .42);
  const pull = easeInOut(range(L, 1.6, 6.5));
  // espaço da cabeça escalado: cabeça em (540, 900) da tela no começo
  const BX = 540, BY = 820, BS = lerp(2.5, 1.05, pull);
  setCam(BX + hx + lerp(0, 60, pull), lerp(BY + 120, 1060, pull) + hy, 1, lerp(-2, 1, pull) + .8 * Math.sin(L * .7), [540, 960, 1]);
  let s = lay(.3, sky(t)) + lay(.5, field(1450));
  s += lay(.7, cessna(1080, 1420, .95, t, .4));
  // copo de vidro e prancheta (n2)
  const glassUp = bump(range(L, 8.6, 10.6)), glassBit = L > 9.6;
  const chart = easeOut(range(L, 11.0, 11.6));
  const inGlass = L > 8.4 && L < 10.8;
  const ec = inGlass ? { up: glassUp * .95, bite: false, mouth: glassUp > .85 ? 'grande' : 'leve', emo: glassUp > .85 ? 'feliz' : 'neutro', crunch: L > 9.6 && L < 10.1 ? (L - 9.6) / .5 : -1 } : e;
  const table = `<g transform="translate(-300,640) scale(.9)"><path d="M-90 0 L-80 -230 L80 -230 L90 0Z" fill="#FFF8E8" stroke="${OLN}" stroke-width="6"/><text x="0" y="-182" text-anchor="middle" font-family="'DejaVu Serif',serif" font-weight="700" font-size="26" fill="#C8282E">MENU</text><text x="0" y="-140" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-size="22" fill="#3A2A10">vidro</text><text x="0" y="-108" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-size="22" fill="#3A2A10">metal</text><text x="0" y="-76" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-size="22" fill="#3A2A10">avião</text><text x="0" y="-30" text-anchor="middle" font-family="'DejaVu Serif',serif" font-style="italic" font-size="18" fill="#5A3A20">Hryz Animation</text></g>` + pctCard(.4 + .02 * pull, 350, 640, .72) + (chart > 0 ? `<g transform="translate(-170,${f1(640 + 300 * (1 - chart))}) rotate(-6)"><rect x="-110" y="-250" width="220" height="250" rx="10" fill="#C89A5A" stroke="${OLN}" stroke-width="6"/><rect x="-92" y="-226" width="184" height="210" fill="#FFFFFF"/><text x="0" y="-176" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="22" fill="#5A6A7A">DIAGNÓSTICO</text><text x="0" y="-110" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="56" fill="#C8282E">PICA</text><path d="M-70 -70 h140 M-70 -44 h110" stroke="#9AA8B0" stroke-width="6"/></g>` : '');
  const b = bust(t, { up: ec.up, bite: ec.bite, mouth: ec.mouth, emo: ec.emo, blink: e.blink && !inGlass, item: inGlass ? IT.copo(glassBit) : undefined, plate: PLATE(3), table, look: L > 11.4 && L < 13 ? -.8 : 0 });
  s += lay(1, `<g transform="translate(${BX},${BY}) scale(${f1(BS * 1000) / 1000})">${b}${crunchFX(40, 130, ec.crunch)}</g>`);
  return s + VIG(.75);
}
/* ====================== PLANO B (n3 + n4): óleo, água, engole; câmera sobe e revela a pilha ====================== */
function shotB(t) {
  const L = t - AT('n3'), [hx, hy] = HH(t, .7);
  const LN4 = t - AT('n4');
  const rise = easeInOut(range(LN4, -.4, 1.6));
  const BX = 380, BY = 1000;
  setCam(lerp(470, 820, rise) + hx + 30 * Math.sin(L * .5), lerp(1080, 1020, rise) + hy, lerp(1.25, .7, rise), 0, [540, 960, 1]);
  let s = lay(.3, sky(t)) + lay(.5, field(1500));
  // pilha de tudo que ele comeu (cresce com a lista)
  const ITEMS = [[0, bikeIcon, 18, 980, 1380], [1.3, cartIcon, 15, 1260, 1360], [2.8, tvIcon, 7, 1040, 1130], [3.9, lampIcon, 6, 1270, 1070], [5.0, bedIcon, 2, 1060, 880], [6.6, coffinIcon, 1, 1240, 690]];
  let pile = '';
  ITEMS.forEach(([tt, ic, n, x, y], i) => { const p = easeOut(range(LN4, tt, tt + .45)); if (p <= 0) return; const yy = y - 500 * (1 - p); for (let k = 0; k < Math.min(n, 3); k++) pile += `<g transform="translate(${x + (k - 1) * 90},${f1(yy + k * 30)}) scale(1.9) rotate(${(k - 1) * 8 + i * 3})">${ic()}</g>`; const sc = 1.5 + .4 * bump(range(LN4, tt + .35, tt + .75)); pile += TAG(x + 230, yy - 110, '×' + n, sc); });
  if (LN4 > 7.2) pile += TAG(1180, 560, 'COM AS ALÇAS!', 1.4 + .2 * bump(range(LN4, 7.2, 7.6)));
  s += lay(1, pile);
  // ele bebe óleo, água e engole
  let o;
  if (L < 2.5) { const u = bump(range(L, .2, 2.3)); o = { up: u * .9, item: IT.oleo, rotR: lerp(0, 150, Math.min(1, u * 1.4)), mouth: u > .7 ? 'grande' : 'leve', emo: 'neutro' }; }
  else if (L < 4.8) { const u = bump(range(L, 2.6, 4.6)); o = { up: u * .9, item: IT.copo(0), rotR: lerp(0, 150, Math.min(1, u * 1.4)), mouth: u > .7 ? 'grande' : 'leve' }; }
  else if (L < 6.6) { const g = range(L, 5.0, 5.8); o = { up: 0, mouth: g > 0 && g < 1 ? 'grande' : 'leve', emo: g > .3 && g < 1 ? 'choque' : 'feliz', hy: -18 * bump(g), item: IT.garfo(false) }; }
  else { const e = eatCycle(L); o = Object.assign(e, {}); }
  o.plate = PLATE(L < 4.8 ? 3 : 1);
  o.table = `<g transform="translate(-460,640)"><rect x="-150" y="-16" width="300" height="30" rx="8" fill="#C8CCD4" stroke="${OLN}" stroke-width="5"/><rect x="-110" y="14" width="220" height="80" rx="12" fill="#E8E8EC" stroke="${OLN}" stroke-width="5"/><circle cx="0" cy="54" r="30" fill="#FFFFFF" stroke="${OLN}" stroke-width="4"/><path d="M0 54 L${f1(24 * Math.cos(-1.4 + range(L, 5.4, 6.4) * 2.4))} ${f1(54 + 24 * Math.sin(-1.4 + range(L, 5.4, 6.4) * 2.4))}" stroke="#C8282E" stroke-width="5"/></g>` + (L > 6.2 ? TAG(-460, 520, '≈ 1 kg / dia', 1 + .2 * bump(range(L, 6.2, 6.6))) : '');
  s += lay(1, `<g transform="translate(${BX},${BY}) scale(1.05)">${bust(t, o)}${o.crunch !== undefined ? crunchFX(40, 130, o.crunch) : ''}</g>`);
  return s + VIG(.75);
}
/* ====================== PLANO C (n5 + n6): 1978→1980 o avião some; raio-x; banana ====================== */
function shotC(t) {
  const L = t - AT('n5'), LN6 = t - AT('n6'), [hx, hy] = HH(t, .7);
  const tl = easeInOut(range(L, 1.6, 6.4));   // timelapse
  const push = easeInOut(range(LN6, -.2, 1.4));
  const day = Math.sin(L * 9) * .5 + .5, night = tl > 0 && tl < 1 ? (1 - day) * .8 : 0;
  setCam(lerp(760, 440, push) + hx, lerp(1080, 1140, push) + hy, lerp(.78, 1.3, push), 0, [540, 960, 1]);
  let s = lay(.3, sky(t, night)) + lay(.5, field(1450));
  const eaten = lerp(.4, 1, tl);
  s += lay(.85, cessna(1060, 1400, 1.1, t, eaten));
  const yr = 1978 + Math.min(2, Math.floor(tl * 2.999)), MES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'], mon = Math.floor((tl * 35.99) % 12);
  const cal = `<g transform="translate(480,640)"><rect x="-110" y="-230" width="220" height="230" rx="12" fill="#FFFFFF" stroke="${OLN}" stroke-width="6"/><rect x="-110" y="-230" width="220" height="64" rx="12" fill="#C8282E" stroke="${OLN}" stroke-width="6"/><text x="0" y="-184" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="36" fill="#fff">${tl > 0 ? MES[mon] : 'JAN'}</text><text x="0" y="-70" text-anchor="middle" font-family="'DejaVu Sans Mono',monospace" font-weight="700" font-size="70" fill="${OLN}">${tl > 0 ? yr : 1978}</text></g>`;
  let o;
  if (LN6 < 0) { const e = eatCycle(L * (1 + 2.5 * bump(tl))); o = Object.assign({}, e); }
  else {
    const xr = easeInOut(range(LN6, 1.0, 1.8)) - easeInOut(range(LN6, 3.6, 4.2)), ban = range(LN6, 4.4, 5.4), after = LN6 > 5.4;
    o = { up: ban > 0 ? bump(Math.min(1, ban * 1.2)) * .9 : 0, item: ban > 0 ? IT.banana(ban > .5) : IT.garfo(false), xray: xr, mouth: after ? 'grande' : ban > .35 && ban < .6 ? 'grande' : 'leve', emo: after ? 'choque' : 'neutro', green: after ? range(LN6, 5.4, 6) : 0, sweat: after, hy: after ? 6 * Math.sin(LN6 * 30) : 0 };
    if (LN6 > 1.2 && LN6 < 3.8) o.table = TAG(0, 760, 'PAREDE GROSSA', 1.1);
    if (after) o.table = (o.table || '') + TAG(0, -330, 'AZIA!', 1.3 + .2 * bump(range(LN6, 5.4, 5.9)), '#FF6A3A') + Array.from({ length: 4 }, (_, i) => { const f = 1 + .25 * Math.sin(t * 18 + i), x = -30 + i * 20; return `<path d="M${x - 14} 150 Q${x - 18} ${f1(150 - 60 * f)} ${x} ${f1(150 - 100 * f)} Q${x + 18} ${f1(150 - 60 * f)} ${x + 14} 150Z" fill="#FF7A1A" stroke="#C83A10" stroke-width="3" opacity=".9"/>`; }).join('');
  }
  o.plate = PLATE(2); o.table = (o.table || '') + (LN6 < 0 ? cal + pctCard(eaten, -470, 640, .85) : '');
  s += lay(1, `<g transform="translate(380,1000) scale(1.05)">${bust(t, o)}${o.crunch !== undefined ? crunchFX(40, 130, o.crunch) : ''}</g>`);
  if (night > 0) s += `<rect width="1080" height="1920" fill="#0A1030" opacity="${op(night * .35)}"/>`;
  return s + VIG(.75);
}
/* ====================== PLANO D (n7 + n8): a placa do recorde; ninguém provou; não tenta; volta a comer ====================== */
function shotD(t) {
  const L = t - AT('n7'), LN8 = t - AT('n8'), [hx, hy] = HH(t, .7);
  const back = easeInOut(range(LN8, .1, 1.6)) - easeInOut(range(LN8, 3.2, 4.4));
  const closeEnd = easeInOut(range(LN8, 5.6, 8.3));
  setCam(lerp(lerp(470, 640, back), 420, closeEnd) + hx, lerp(lerp(1060, 1000, back), 1040, closeEnd) + hy, lerp(lerp(1.15, .62, back), 2.0, closeEnd), 0, [540, 960, 1]);
  let s = lay(.3, sky(t)) + lay(.5, field(1450)) + lay(.85, cessna(1000, 1400, 1.1, t, .4));
  let o;
  if (LN8 < 0) {
    const give = easeOut(range(L, .3, 1.3)), bite = range(L, 4.4, 4.9), chew = L > 4.9;
    const hand = `<g transform="translate(${f1(lerp(1100, 330, give))},${f1(lerp(200, 300, give))})">${limb(400, 60, 60, 20, 60, 50, '#5A6A7A')}${fist(40, 20, 90, '')}</g>`;
    if (L < 1.6) o = { up: 0, item: IT.garfo(false), table: `<g transform="translate(0,0)">${hand}<g transform="translate(${f1(lerp(1000, 230, give))},${f1(lerp(150, 260, give))}) rotate(-6)">${IT.placa(false)}</g></g>`, emo: give > .9 ? 'choque' : 'neutro', mouth: give > .9 ? 'grande' : 'leve' };
    else o = { up: bite > 0 ? bump(Math.min(1, bite * 1.2)) * .95 : .35, item: IT.placa(bite > .5), rotR: 0, emo: L < 4.3 ? 'feliz' : 'neutro', mouth: bite > .3 && bite < .6 ? 'grande' : chew ? (Math.floor(L * 6.5) % 2 ? 'gato' : 'leve') : 'grande', crunch: L > 4.85 && L < 5.35 ? (L - 4.85) / .5 : -1, blink: chew && Math.sin(L * 3) > .8 };
    if (L > 1.2 && L < 4.2) o.table = (o.table || '') + TAG(0, -360, 'GUINNESS', 1.05);
  } else if (LN8 < 5.6) {
    const wag = Math.sin(LN8 * 14);
    o = LN8 < 3.4 ? Object.assign(eatCycle(LN8 + 2), {}) : { up: .75, item: IT.dedo, rotR: 15 * wag, emo: 'neutro', mouth: 'leve', blink: LN8 > 4.6 && LN8 < 5 };
    if (LN8 > .6 && LN8 < 3.4) o.table = `<g transform="translate(560,-300)">${TAG(0, 0, '?', 4.5 + .4 * Math.sin(LN8 * 4), '#C8282E')}</g>`;
    if (LN8 > 3.4) o.table = TAG(0, -360, 'NÃO TENTE!', 1.2 + .15 * bump(range(LN8, 3.4, 3.8)), '#FF4A3A');
  } else { o = Object.assign(eatCycle(LN8 - 5.6 + .713), {}); }
  o.plate = PLATE(3);
  o.table = (o.table || '') + (LN8 > 5.6 ? pctCard(.4, 350, 640, .72) : '');
  s += lay(1, `<g transform="translate(380,1000) scale(1.05)">${bust(t, o)}${o.crunch !== undefined ? crunchFX(40, 130, o.crunch) : ''}</g>`);
  return s + VIG(.75);
}
const FN = { n1: shotA, n2: shotA, n3: shotB, n4: shotB, n5: shotC, n6: shotC, n7: shotD, n8: shotD };

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
