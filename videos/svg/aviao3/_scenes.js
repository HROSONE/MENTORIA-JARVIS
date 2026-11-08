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
const CUTS = [AT('n2'), AT('n6'), AT('n7'), AT('n9')];
// personagem inspirado no Lotito real: cabelo escuro, bigode, boina, guardanapo
const LOT = { skin: '#F0C8A0', hair: '#2A1A12', hairStyle: 'baguncado', iris: '#6A4020', eyeH: 56, eyeW: 52, stache: 1, browW: 9, mouth: 'leve', nose: 'sombra' };
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
  g += `<g transform="translate(${f1(o.hx || 0)},${f1(o.hy || 0)}) rotate(${f1(o.tilt || 0)})">${hh}<g transform="translate(18,-150) rotate(-10)"><ellipse cx="0" cy="0" rx="140" ry="46" fill="#7A1A2A" stroke="${OLN}" stroke-width="6"/><path d="M-120 10 Q0 40 130 6" stroke="#5A0E1A" stroke-width="10" fill="none"/><rect x="-6" y="-66" width="12" height="26" rx="4" fill="#7A1A2A" stroke="${OLN}" stroke-width="4"/><path d="M-90 -20 Q-20 -40 60 -30" stroke="#B8485A" stroke-width="8" fill="none" opacity=".7"/></g>${o.green ? `<ellipse cx="0" cy="40" rx="98" ry="110" fill="#7ACB5A" opacity="${op(o.green * .35)}"/>` : ''}${o.sweat ? `<path d="M118 -40 Q136 -8 126 14 Q110 24 104 4 Q104 -18 118 -40Z" fill="#9AD8FF" stroke="${OLN}" stroke-width="4"/>` : ''}</g>`;
  // raio-x sobre a barriga
  if (o.xray > 0) { def(`<clipPath id="xrC"><rect x="-200" y="420" width="400" height="${f1(420 * o.xray)}" rx="20"/></clipPath>`); const th = 26 + 10 * Math.sin(t * 4); g += `<g clip-path="url(#xrC)"><rect x="-260" y="400" width="520" height="500" fill="#0A2A3A"/>${Array.from({ length: 5 }, (_, i) => `<path d="M-170 ${440 + i * 40} Q0 ${420 + i * 40} 170 ${440 + i * 40}" stroke="#8AE0F0" stroke-width="7" fill="none" opacity=".5"/>`).join('')}<path d="M-40 560 Q-130 620 -100 730 Q-60 830 60 810 Q160 790 150 690 Q140 610 80 600 Q40 590 20 560Z" fill="#D86A6A" stroke="#FFB4A8" stroke-width="${f1(th)}"/>${[[-40, 700, 20], [30, 730, -30], [80, 680, 50], [-60, 760, 80], [10, 660, 10]].map(([x, y, r]) => `<rect x="${x - 26}" y="${y - 10}" width="52" height="20" fill="#C8CCD4" stroke="${OLN}" stroke-width="3" transform="rotate(${r} ${x} ${y})"/>`).join('')}</g><rect x="-200" y="420" width="400" height="${f1(420 * o.xray)}" rx="20" fill="none" stroke="#8AE0F0" stroke-width="8"/>`; }
  // mesa com toalha xadrez
  if (!o.noTable) g += `<path d="M-760 640 L760 640 L800 1000 L-800 1000Z" fill="url(#chkP)" stroke="${OLN}" stroke-width="7"/><path d="M-760 640 L760 640" stroke="#FFFFFF" stroke-width="10"/><path d="M-780 820 L780 820" stroke="#000" stroke-width="80" opacity=".08"/>`;
  // prato
  if (!o.noTable) g += `<ellipse cx="60" cy="676" rx="200" ry="40" fill="#E8E8EC" stroke="${OLN}" stroke-width="6"/><ellipse cx="60" cy="672" rx="140" ry="24" fill="#FAFAFC"/>` + (o.plate || '');
  if (o.table) g += o.table;
  // braço esquerdo (faca/item B) e direito (garfo/item)
  const up = o.up || 0, hL = o.handL || [-190, 640], hR = o.handR || [lerp(170, 40, up), lerp(640, 120, up)];
  const eR = o.elbowR || [lerp(300, 250, up), lerp(560, 430, up)], eL = o.elbowL || [-300, 560];
  g += limb(-200, 300, eL[0], eL[1], 56, 48, '#22325A') + limb(eL[0], eL[1], hL[0], hL[1], 48, 40, '#22325A') + fist(hL[0], hL[1], o.rotL || -10, o.itemB !== undefined ? o.itemB : IT.faca);
  g += limb(200, 300, eR[0], eR[1], 56, 48, '#22325A') + limb(eR[0], eR[1], hR[0], hR[1], 48, 40, '#22325A') + fist(hR[0], hR[1], o.rotR !== undefined ? o.rotR : lerp(10, -20, up), o.item !== undefined ? o.item : IT.garfo(o.bite !== false));
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
/* ====================== v3: o garçom apresenta e serve cada prato ====================== */
const GH = { skin: '#F2C8A6', hair: '#1A1A22', hairStyle: 'penteado', iris: '#3A5A8A', eyeStyle: 'narrow', eyeH: 46, mouth: 'smirk', browA: 10 };
// garçom: corpo de perfil (man) + cabeça anime de frente
function waiter(x, y, s, p = {}, face = {}) {
  let g = man(Object.assign({ x, y, s, kind: 'garcom', noHead: 1, shadow: .25 }, p));
  const hip = -470 + (p.drop || 0) + (p.bob || 0), lean = p.lean || 0;
  const nx = Math.sin((180 - lean) * Math.PI / 180) * 380, ny = hip + Math.cos((180 - lean) * Math.PI / 180) * 380;
  const hs = s * .55, fx = x + nx * s * (p.flip || 1), fy = y + ny * s;
  const hh = ANI.head(Object.assign({}, GH, face)); def(ANI.flush());
  g += `<g transform="translate(${f1(fx)},${f1(fy - 215 * hs)}) scale(${f1(hs * 1000) / 1000}) rotate(${f1(face.tilt || 0)})">${hh}<path d="M-34 236 l-30 -18 l0 36Z M34 236 l30 -18 l0 36Z" fill="#C8282E" stroke="${OLN}" stroke-width="4"/><circle cx="0" cy="236" r="10" fill="#C8282E" stroke="${OLN}" stroke-width="4"/></g>`;
  return g;
}
// golpe de faca (arco branco) e brilho de apresentação
const SLASH = (x, y, k, r = 260) => k <= 0 || k >= 1 ? '' : `<path d="M${f1(x - r)} ${f1(y - r * .6)} Q${x} ${f1(y + r * .2)} ${f1(x + r)} ${f1(y - r * .2)}" stroke="#FFFFFF" stroke-width="${f1(26 * (1 - k))}" fill="none" stroke-linecap="round" opacity="${op(1 - k)}"/><path d="M${f1(x - r)} ${f1(y - r * .6)} Q${x} ${f1(y + r * .2)} ${f1(x + r)} ${f1(y - r * .2)}" stroke="#BFE4FF" stroke-width="${f1(60 * (1 - k))}" fill="none" opacity="${op((1 - k) * .4)}" filter="url(#b12)"/>`;
const SPARK = (x, y, k) => k <= 0 || k >= 1 ? '' : Array.from({ length: 6 }, (_, i) => { const a = i * 1.05, r = 60 + k * 140; return `<path d="M${f1(x + Math.cos(a) * r)} ${f1(y + Math.sin(a) * r)} l0 -22 l6 16 l16 6 l-16 6 l-6 16 l-6 -16 l-16 -6 l16 -6Z" fill="#FFE04A" opacity="${op(1 - k)}"/>`; }).join('');
// pedaços voando até o prato
function piecesFly(x0, y0, x1, y1, k, col) { if (k <= 0 || k >= 1) return ''; return Array.from({ length: 6 }, (_, i) => { const kk = Math.min(1, Math.max(0, k * 1.3 - i * .05)); const x = lerp(x0 + (i - 3) * 40, x1 + (i - 3) * 10, kk), y = lerp(y0, y1, kk) - Math.sin(kk * Math.PI) * 220; return `<rect x="${f1(x - 18)}" y="${f1(y - 8)}" width="36" height="16" fill="${col}" stroke="${OLN}" stroke-width="3" transform="rotate(${f1(i * 60 + k * 400)} ${f1(x)} ${f1(y)})"/>`; }).join(''); }
const PLATEC = (col, n = 4) => Array.from({ length: n }, (_, i) => `<rect x="${-40 + i * 34}" y="${650 + (i % 2) * 10}" width="40" height="16" fill="${col}" stroke="${OLN}" stroke-width="3" transform="rotate(${(i * 37) % 50 - 25} ${-20 + i * 34} ${658 + (i % 2) * 10})"/>`).join('');
// cenário da mesa (restaurante ao ar livre no campo de aviação)
const TB = { BX: 400, BY: 980, BS: .9, FLOOR: 1880 }, WS = .64;
const PLATE_W = [TB.BX + 60 * TB.BS, TB.BY + 660 * TB.BS];
function tableScene(t, o, extraBehind = '', extraFront = '') {
  let s = lay(.3, sky(t)) + lay(.5, field(1450));
  s += lay(1, extraBehind);
  s += lay(1, `<rect x="-1000" y="${TB.FLOOR - 20}" width="3000" height="800" fill="#B89870"/><rect x="-1000" y="${TB.FLOOR - 20}" width="3000" height="16" fill="#8A6A48"/>`);
  s += lay(1, `<g transform="translate(${TB.BX},${TB.BY}) scale(${TB.BS})">${bust(t, o)}${o.crunch !== undefined ? crunchFX(40, 130, o.crunch) : ''}</g>`);
  s += lay(1, extraFront);
  return s;
}
// pose padrão: esperando civilizado (garfo e faca em pé)
const WAIT = (L) => ({ up: 0, item: IT.garfo(false), mouth: 'leve', emo: 'neutro', blink: Math.sin(L * 2.3) > .97, hy: 3 * Math.sin(L * 2) });
// ciclo rápido de comer o que caiu no prato
function chomp(L, col) { const e = eatCycle(L, 1.6); e.plate = PLATEC(col, 4); return e; }
/* ---------- apresentações (L local 0..1.45); x0 = posição do garçom ---------- */
const PX = 860;
function present(kind, L, t) {
  const en = easeOut(range(L, 0, .55)), x = lerp(1400, PX, en), tch = bump(range(L, .5, .85)), sl = range(L, .82, 1.0), fl = range(L, .98, 1.22);
  const gone = L > .95;
  let g = '', col = '#8A8E96';
  const tcha = { armF: [lerp(20, 150, tch), -10], armB: [lerp(-10, 120, tch), 10] };
  if (kind === 'bike') {
    col = '#C8282E'; const ph = L * 18;
    if (!gone) g += `<g transform="translate(${f1(x)},${TB.FLOOR - 120}) scale(2.9)">${bikeIcon()}</g>` + waiter(x - 30, TB.FLOOR - 40, WS * .92, { drop: -40, legF: [55 + 30 * Math.sin(ph), -70 + 30 * Math.cos(ph)], legB: [55 - 30 * Math.sin(ph), -70 - 30 * Math.cos(ph)], armF: [70, 0], armB: [60, 0], flip: -1 });
    else g += waiter(PX, TB.FLOOR, WS, { armF: [40, -100], armB: [10, 10], flip: -1, held: `<g transform="rotate(30)">${IT.faca}</g>` });
  }
  if (kind === 'cart') {
    col = '#8A8E96';
    if (!gone) g += `<g transform="translate(${f1(x - 170)},${TB.FLOOR - 110}) scale(-2.7,2.7)">${cartIcon()}</g>` + waiter(x + 40, TB.FLOOR, WS, Object.assign(walkPose(L * 22, en < 1 ? 1.2 : 0), { armF: [80, -10], armB: [75, -10], lean: 12, flip: -1 }));
    else g += waiter(PX, TB.FLOOR, WS, { armF: [40, -100], flip: -1, held: `<g transform="rotate(30)">${IT.faca}</g>` });
  }
  if (kind === 'tv') {
    col = '#6A4A30';
    if (!gone) g += waiter(x, TB.FLOOR, WS, Object.assign(walkPose(L * 14, en < 1 ? .8 : 0), { armF: [172, 0], armB: [168, 0], flip: -1 })) + `<g transform="translate(${f1(x)},${TB.FLOOR - WS * 1250}) scale(1.6)">${tvIcon()}<rect x="-72" y="-54" width="110" height="96" rx="14" fill="#FFFFFF" opacity="${op(.3 + .3 * Math.sin(t * 40))}"/></g>`;
    else g += waiter(PX, TB.FLOOR, WS, { armF: [40, -100], flip: -1, held: `<g transform="rotate(30)">${IT.faca}</g>` });
  }
  if (kind === 'lamp') {
    col = '#E8C060'; const sw = 18 * Math.sin(L * 8) * (1 - en * .6), cx = lerp(1400, PX, en);
    if (!gone) g += `<g transform="rotate(${f1(sw)} ${f1(cx)} -400)"><path d="M${f1(cx)} -400 V${TB.FLOOR - 820}" stroke="#8A7A50" stroke-width="10" stroke-dasharray="20 8"/><g transform="translate(${f1(cx)},${TB.FLOOR - 760}) scale(2.2)">${lampIcon()}</g>${waiter(cx, TB.FLOOR - 760 + 80 + WS * 1130, WS, { armF: [178, 0], armB: [176, 0], legF: [20, -30], legB: [-10, -20], flip: -1, shadow: 0 })}</g>`;
    else g += waiter(PX, TB.FLOOR, WS, { armF: [40, -100], flip: -1, held: `<g transform="rotate(30)">${IT.faca}</g>` });
  }
  if (kind === 'bed') {
    col = '#8A5A3A'; const bo = Math.abs(Math.sin(L * 9));
    if (!gone) g += `<g transform="translate(${f1(x)},${TB.FLOOR - 70}) scale(2.9)">${bedIcon()}</g>` + waiter(x + 10, TB.FLOOR - 170 - bo * 160, WS * .92, { legF: [bo * 30, -bo * 60], legB: [-bo * 20, -bo * 40], armF: [150, 20], armB: [140, 30], flip: -1 });
    else g += waiter(PX, TB.FLOOR, WS, { armF: [40, -100], flip: -1, held: `<g transform="rotate(30)">${IT.faca}</g>` });
  }
  if (kind === 'coffin') {
    col = '#6A3A22'; const op_ = easeOut(range(L, .3, .55));
    if (!gone) g += `<g transform="translate(${f1(x)},${TB.FLOOR - 330}) rotate(-90) scale(2.9)">${coffinIcon()}</g>` + (op_ > 0 ? `<g opacity="${op(op_)}">${waiter(x + 40 * op_, TB.FLOOR, WS, { armF: [90 + 60 * tch, -80], armB: [80, -60], flip: -1 }, { mouth: 'grande', emo: 'feliz' })}</g>` : '');
    else g += waiter(PX, TB.FLOOR, WS, { armF: [40, -100], flip: -1, held: `<g transform="rotate(30)">${IT.faca}</g>` });
  }
  g += SPARK(PX, TB.FLOOR - 700, tch);
  g += SLASH(PX - 30, TB.FLOOR - 380, sl);
  g += piecesFly(PX - 60, TB.FLOOR - 420, PLATE_W[0], PLATE_W[1], fl, col);
  return { g, col, served: L > 1.2 };
}
/* ====================== n1 / n9: o maluco mordendo o avião com a boca ====================== */
function maniac(t, L, d, tagNo) {
  const [hx, hy] = HH(t, 1.2), sh = Math.sin(L * 24);
  setCam(540 + hx + 10 * sh, 1080 + hy, lerp(1.0, 1.08, L / d), 2 * sh, [540, 960, 1]);
  let s = lay(.3, sky(t)) + lay(.5, field(1450)) + lay(.7, cessna(980, 1420, 1.0, t, .55));
  const bite = (L * 2.2) % 1, open = bite < .45;
  const notch = Math.min(5, Math.floor(L * 2.2));
  let wing = `<path d="M-380 128 L380 118 L390 268 L-390 280Z" fill="#F4F4F0" stroke="${OLN}" stroke-width="8"/><path d="M-384 190 L386 178" stroke="#C8282E" stroke-width="22"/><path d="M-386 240 L388 228" stroke="#2A4A8A" stroke-width="8"/>` + Array.from({ length: 8 }, (_, i) => `<circle cx="${-330 + i * 95}" cy="${146 - i}" r="5" fill="#8A8E96"/>`).join('');
  // mordidas (buracos com dentes)
  wing += `<path d="M${-50 - notch * 12} 124 q${f1(25 + notch * 6)} ${f1(40 + notch * 6)} ${f1(50 + notch * 12)} 0 q${f1(25 + notch * 6)} ${f1(40 + notch * 6)} ${f1(50 + notch * 12)} 0Z" fill="#9ED0F0" stroke="${OLN}" stroke-width="5"/>`;
  const o = { noTable: 1, up: 0, item: '', itemB: '', handL: [-370, 210], handR: [370, 200], elbowL: [-520, 560], elbowR: [520, 550], rotL: 70, rotR: -70, mouth: open ? 'grande' : 'gato', emo: open ? 'bravo' : 'feliz', tilt: 7 * sh, hx: 8 * sh, hy: open ? -6 : 10, table: `<g transform="translate(0,${f1(open ? 0 : 10)}) rotate(${f1(-2 * sh)})">${wing}</g><g transform="translate(${f1(8 * sh)},${open ? 96 : 112})"><path d="M-46 0 Q0 ${open ? -40 : -16} 46 0 L40 14 L30 4 L20 16 L10 4 L0 16 L-10 4 L-20 16 L-30 4 L-40 14Z" fill="#FFFFFF" stroke="${OLN}" stroke-width="4"/><path d="M-30 -6 Q-16 -30 0 -18 Q16 -30 30 -6" fill="#2A1A12" stroke="${OLN}" stroke-width="3"/></g>` };
  s += lay(1, `<g transform="translate(540,1050) scale(1.9)">${bust(t, o)}</g>`);
  const ck = (L * 2.2 + .5) % 1; s += lay(1, crunchFX(540 + (Math.floor(L * 2.2) % 2 ? 260 : -260), 900, ck < .6 ? ck / .6 : -1));
  if (tagNo) { const k = range(L, 2.6, 5.6); if (k > 0 && k < 1) s += `<g transform="translate(540,380)">${TAG(0, 0, 'NÃO TENTE!', 1.6 + .2 * bump(range(L, 2.6, 3)), '#FF4A3A')}</g>`; }
  return s + VIG(.7);
}
function s1(t) { const { L, d } = loc(t, 'n1'); return maniac(t, L, d, 0); }
function s9(t) { const { L, d } = loc(t, 'n9'); return maniac(t, L, d, 1) + FADE(range(L, d - .3, d) * 0); }
/* ====================== n2: civilizado à mesa; o garçom serve vidro; PICA ====================== */
function camTable(t, L, k, zoomIn = 0) { const [hx, hy] = HH(t, .6); setCam(lerp(630, 610, k) + hx + 20 * Math.sin(L * .8) - zoomIn * 120, lerp(1330, 1310, k) + hy - zoomIn * 180, 1.08 + .05 * Math.sin(L * .6) + zoomIn * .35, .6 * Math.sin(L * .5), [540, 960, 1]); }
function s2(t) {
  const { L, d, k } = loc(t, 'n2'); camTable(t, L, k);
  const tray = (item) => `<g transform="translate(40,-10)"><ellipse cx="0" cy="0" rx="110" ry="18" fill="#C8CCD4" stroke="${OLN}" stroke-width="5"/>${item}</g>`;
  let back = '', o = WAIT(L);
  // 1,0–3,6: garçom traz um copo na bandeja; ele morde
  const en = easeOut(range(L, .6, 1.4)), ex = easeIn(range(L, 3.0, 3.6));
  if (L > .6 && L < 3.6) back += waiter(lerp(1400, PX, en) + ex * 700, TB.FLOOR, WS, Object.assign(walkPose(L * 12, en < 1 || ex > 0 ? .9 : 0), { armF: [80, -10], flip: -1, held: L < 2.0 ? tray(`<g transform="translate(0,-4) scale(.9)">${IT.copo(false)}</g>`) : tray('') }), { mouth: 'smirk' });
  if (L > 1.9 && L < 3.4) { const u = bump(range(L, 1.9, 3.3)); o = { up: u * .95, item: IT.copo(L > 2.6), mouth: u > .85 ? 'grande' : 'leve', emo: u > .85 ? 'feliz' : 'neutro', crunch: L > 2.6 && L < 3.1 ? (L - 2.6) / .5 : -1 }; }
  // 4,4–7,6: o garçom apresenta a ficha "PICA"
  const en2 = easeOut(range(L, 4.2, 4.9)), ex2 = easeIn(range(L, 7.2, 7.7));
  if (L > 4.2) back += waiter(lerp(1400, PX, en2) + ex2 * 700, TB.FLOOR, WS, Object.assign(walkPose(L * 12, en2 < 1 || ex2 > 0 ? .9 : 0), { armF: [110, -30], flip: -1, held: `<g transform="translate(0,-60) scale(-1,1)"><rect x="-110" y="-150" width="220" height="150" rx="12" fill="#FFFFFF" stroke="${OLN}" stroke-width="6"/><text x="0" y="-100" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="24" fill="#5A6A7A">DIAGNÓSTICO</text><text x="0" y="-36" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="58" fill="#C8282E">PICA</text></g>` }), { mouth: 'leve' });
  if (L > 5 && L < 7) o.look = .6;
  o.plate = '';
  return tableScene(t, o, '', back) + VIG(.7);
}
/* ====================== n3: o truque — corta em pedacinhos, óleo, água, engole ====================== */
function s3(t) {
  const { L, d, k } = loc(t, 'n3'); camTable(t, L, k);
  let front = '', o = WAIT(L);
  const en = easeOut(range(L, .1, .6));
  // garçom pica uma barra de metal em pedacinhos
  if (L < 2.6) { const sl = (L * 4) % 1; front += waiter(PX, TB.FLOOR, WS, { armF: [lerp(150, 60, sl), -20], armB: [70, -20], flip: -1, held: `<g transform="rotate(${f1(lerp(-40, 40, sl))})">${IT.faca}</g>` }, { mouth: 'smirk' }) + `<g transform="translate(${PX - 230},${TB.FLOOR - 330})">${Array.from({ length: Math.min(6, Math.floor(L * 3) + 1) }, (_, i) => `<rect x="${i * 46}" y="0" width="40" height="22" fill="#8A8E96" stroke="${OLN}" stroke-width="3"/>`).join('')}</g>` + SLASH(PX - 120, TB.FLOOR - 340, sl, 120); }
  else if (L < 3.2) front += piecesFly(PX - 200, TB.FLOOR - 330, PLATE_W[0], PLATE_W[1], range(L, 2.6, 3.2), '#8A8E96') + waiter(PX + easeIn(range(L, 2.8, 3.2)) * 700, TB.FLOOR, WS, { flip: -1 });
  // ele bebe óleo, água, engole
  if (L > 3.0 && L < 4.3) { const u = bump(range(L, 3.0, 4.3)); o = { up: u * .9, item: IT.oleo, rotR: lerp(0, 150, Math.min(1, u * 1.4)), mouth: u > .7 ? 'grande' : 'leve' }; }
  else if (L > 4.3 && L < 5.5) { const u = bump(range(L, 4.3, 5.5)); o = { up: u * .9, item: IT.copo(false), rotR: lerp(0, 150, Math.min(1, u * 1.4)), mouth: u > .7 ? 'grande' : 'leve' }; }
  else if (L >= 5.5) { const g = range(L, 5.5, 6.2); o = { up: 0, mouth: g > 0 && g < 1 ? 'grande' : 'leve', emo: g > .3 && g < 1 ? 'choque' : 'feliz', hy: -18 * bump(g), item: IT.garfo(false) }; }
  o.plate = L > 3.1 && L < 5.5 ? PLATEC('#8A8E96', 5) : '';
  o.table = `<g transform="translate(-430,640)"><rect x="-150" y="-16" width="300" height="30" rx="8" fill="#C8CCD4" stroke="${OLN}" stroke-width="5"/><rect x="-110" y="14" width="220" height="80" rx="12" fill="#E8E8EC" stroke="${OLN}" stroke-width="5"/><circle cx="0" cy="54" r="30" fill="#FFFFFF" stroke="${OLN}" stroke-width="4"/><path d="M0 54 L${f1(24 * Math.cos(-1.4 + range(L, 5.6, 6.3) * 2.4))} ${f1(54 + 24 * Math.sin(-1.4 + range(L, 5.6, 6.3) * 2.4))}" stroke="#C8282E" stroke-width="5"/></g>` + (L > 5.9 ? TAG(-430, 520, '≈ 1 kg / dia', 1.2 + .2 * bump(range(L, 5.9, 6.3))) : '');
  return tableScene(t, o, '', front) + VIG(.7);
}
/* ====================== n4: o garçom chega pilotando o avião, cai, corta e serve ====================== */
function s4(t) {
  const { L, d, k } = loc(t, 'n4'); const [hx, hy] = HH(t, .6);
  const crash = 1.7, sh = L > crash && L < crash + .5 ? (1 - (L - crash) / .5) * 26 * Math.sin(L * 70) : 0;
  setCam(lerp(760, 630, range(L, 1.6, 3)) + hx + sh, lerp(1250, 1330, range(L, 1.6, 3)) + hy, lerp(.8, 1.08, range(L, 1.8, 3.2)), 0, [540, 960, 1]);
  let back = '', front = '', o = WAIT(L);
  if (L < crash) { const p = easeIn(range(L, 0, crash)), px = lerp(1700, 880, p), py = lerp(500, 1880, p), rot = lerp(-8, 32, p); back += `<g transform="translate(${f1(px)},${f1(py)}) rotate(${f1(rot)})">${cessna(0, 0, .75, t, 0)}<g transform="translate(${f1(.75 * 80)},${f1(.75 * -250)}) scale(.2)">${ANI.head(Object.assign({}, GH, { emo: 'choque', mouth: 'grande' }))}</g></g>` + Array.from({ length: 8 }, (_, i) => `<circle cx="${f1(px + 300 + i * 60)}" cy="${f1(py - 120 - i * 34)}" r="${20 + i * 6}" fill="#6A6A70" opacity="${op(.5 - i * .05)}" filter="url(#b4)"/>`).join(''); def(ANI.flush()); }
  else {
    const wreck = L < 3.2;
    if (wreck) front += `<g transform="translate(880,1880) rotate(32)">${cessna(0, 0, .75, t, 0)}</g>` + Array.from({ length: 10 }, (_, i) => { const p = range(L, crash, crash + 1.5); return `<circle cx="${f1(800 + (i - 5) * 70 * (1 + p))}" cy="${f1(1700 - p * 120 - (i % 3) * 30)}" r="${f1(40 + p * 60)}" fill="#C8B898" opacity="${op((1 - p) * .7)}" filter="url(#b4)"/>`; }).join('');
    const out = easeOut(range(L, 2.0, 2.6)), sl = range(L, 2.7, 3.1), fl = range(L, 3.0, 3.5);
    if (L > 2.0) front += waiter(lerp(1000, PX, out), TB.FLOOR, WS, { armF: [lerp(40, 160, bump(range(L, 2.4, 2.9))), -10], armB: [lerp(-10, 150, bump(range(L, 2.4, 2.9))), 10], flip: -1, held: `<g transform="rotate(20)">${IT.faca}</g>`, heldB: `<g transform="rotate(-20)">${IT.garfo(false)}</g>` }, { mouth: L < 2.6 ? 'grande' : 'smirk', emo: L < 2.6 ? 'choque' : 'neutro' });
    front += SLASH(960, 1600, sl, 360) + piecesFly(960, 1600, PLATE_W[0], PLATE_W[1], fl, '#F4F4F0');
    if (L > 3.4) { const e = eatCycle(L * 2.2, 1); o = Object.assign({}, e); o.plate = PLATEC('#F4F4F0', 5); }
  }
  // calendário 1978 → 1980 enquanto ele come
  const tl = range(L, 3.6, d - .3), yr = 1978 + Math.min(2, Math.floor(tl * 2.999)), MES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'], mon = Math.floor((tl * 35.99) % 12);
  o.table = pctCard(tl, 380, 640, .7) + `<g transform="translate(-430,640)"><rect x="-110" y="-230" width="220" height="230" rx="12" fill="#FFFFFF" stroke="${OLN}" stroke-width="6"/><rect x="-110" y="-230" width="220" height="64" rx="12" fill="#C8282E" stroke="${OLN}" stroke-width="6"/><text x="0" y="-184" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="36" fill="#fff">${tl > 0 ? MES[mon] : 'JAN'}</text><text x="0" y="-70" text-anchor="middle" font-family="'DejaVu Sans Mono',monospace" font-weight="700" font-size="70" fill="${OLN}">${tl > 0 ? yr : 1978}</text></g>`;
  return tableScene(t, o, back, front) + VIG(.7);
}
/* ====================== n5: apresentações rápidas (bicicleta, carrinho, TV, lustre, cama, caixão) ====================== */
const MENU = ['bike', 'cart', 'tv', 'lamp', 'bed', 'coffin'];
function s5(t) {
  const { L, d, k } = loc(t, 'n5'); camTable(t, L, k);
  const P = 1.4, i = Math.min(5, Math.floor((L - .1) / P)), Li = L - .1 - i * P;
  let front = '', o = WAIT(L);
  if (L > .1) { const pr = present(MENU[i], Li, t); front += pr.g; if (pr.served) { o = chomp(Li, pr.col); } else if (i > 0) o.plate = ''; }
  return tableScene(t, o, '', front) + VIG(.7);
}
/* ====================== n6: ele grande na tela, o objeto atrás com a quantidade ====================== */
function s6(t) {
  const { L, d } = loc(t, 'n6'); const [hx, hy] = HH(t, .7);
  const LIST = [[bikeIcon, 18, '#F2C24A'], [cartIcon, 15, '#5AB4D8'], [tvIcon, 7, '#E86A4A'], [lampIcon, 6, '#8A6AD0'], [bedIcon, 2, '#5AC88A'], [coffinIcon, 1, '#6A4A4A']];
  const P = d / 6, i = Math.min(5, Math.floor(L / P)), Li = L - i * P;
  setCam(540 + hx, 960 + hy, 1 + .08 * bump(range(Li, 0, .35)), 1.5 * Math.sin(L * 2), [540, 960, 1]);
  const [ic, n, bg] = LIST[i];
  let s = `<rect width="1080" height="1920" fill="${bg}"/>` + Array.from({ length: 12 }, (_, j) => `<path d="M540 700 L${f1(540 + 2400 * Math.cos(j * Math.PI / 6 + L * .3))} ${f1(700 + 2400 * Math.sin(j * Math.PI / 6 + L * .3))} L${f1(540 + 2400 * Math.cos(j * Math.PI / 6 + .26 + L * .3))} ${f1(700 + 2400 * Math.sin(j * Math.PI / 6 + .26 + L * .3))}Z" fill="#FFFFFF" opacity=".14"/>`).join('');
  const pop = easeOut(range(Li, 0, .3));
  s += lay(1, Array.from({ length: Math.min(n, 5) }, (_, j) => `<g transform="translate(${540 + (j - 2) * 190},${560 + (j % 2) * 60}) scale(1.6)" opacity=".5">${ic()}</g>`).join('') + `<g transform="translate(540,${f1(520 - 300 * (1 - pop))}) scale(${f1((3.2 + .3 * bump(range(Li, .2, .5))) * 100) / 100}) rotate(${f1(4 * Math.sin(L * 3))})">${ic()}</g>`);
  s += `<g transform="translate(830,250) scale(${f1((1 + .35 * bump(range(Li, 0, .3))) * 100) / 100})"><text x="0" y="40" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="170" fill="#16110E" opacity=".25" transform="translate(8,8)">×${n}</text><text x="0" y="40" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="170" fill="#FFFFFF" stroke="#16110E" stroke-width="8">×${n}</text></g>`;
  if (i === 5 && Li > .4) s += `<g transform="translate(540,940)">${TAG(0, 0, 'COM AS ALÇAS!', 1.4)}</g>`;
  const e = eatCycle(L, 1.3); e.plate = ''; e.noTable = 1;
  s += lay(1, `<g transform="translate(540,1330) scale(1.3)">${bust(t, Object.assign(e, { noTable: 1 }))}${crunchFX(40, 130, e.crunch)}</g>`);
  return s + VIG(.6);
}
/* ====================== n7: raio-x (parede grossa); o garçom serve banana → azia ====================== */
function s7(t) {
  const { L, d, k } = loc(t, 'n7'); camTable(t, L, k, easeInOut(range(L, 0, 1.2)));
  let front = '', o = WAIT(L);
  const xr = easeInOut(range(L, .6, 1.4)) - easeInOut(range(L, 3.3, 3.8));
  o.xray = xr; if (L > .9 && L < 3.6) o.table = TAG(0, 760, 'PAREDE GROSSA', 1.1);
  const en = easeOut(range(L, 3.6, 4.2)), ex = easeIn(range(L, 4.9, 5.4));
  if (L > 3.6 && L < 5.5) front += waiter(lerp(1400, PX, en) + ex * 700, TB.FLOOR, WS, Object.assign(walkPose(L * 12, en < 1 || ex > 0 ? .9 : 0), { armF: [80, -10], flip: -1, held: L < 4.6 ? `<g transform="translate(40,-10)"><ellipse rx="110" ry="18" fill="#C8CCD4" stroke="${OLN}" stroke-width="5"/><g transform="translate(0,-10) rotate(80) scale(.8)">${IT.banana(false)}</g></g>` : '' }), { mouth: 'smirk' });
  const ban = range(L, 4.5, 5.4), after = L > 5.4;
  if (ban > 0) { o = { up: bump(Math.min(1, ban * 1.2)) * .9, item: IT.banana(ban > .5), mouth: ban > .35 && ban < .6 ? 'grande' : after ? 'grande' : 'leve', emo: after ? 'choque' : 'neutro' }; }
  if (after) { Object.assign(o, { green: range(L, 5.4, 6), sweat: 1, hy: 6 * Math.sin(L * 30), emo: 'choque', mouth: 'grande', item: IT.banana(true), up: 0 }); o.table = TAG(0, -330, 'AZIA!', 1.3 + .2 * bump(range(L, 5.4, 5.9)), '#FF6A3A'); }
  o.plate = '';
  return tableScene(t, o, '', front) + VIG(.7);
}
/* ====================== n8: o garçom apresenta a placa do recorde; ele morde a placa ====================== */
function s8(t) {
  const { L, d, k } = loc(t, 'n8'); camTable(t, L, k, .5);
  let front = '', o = WAIT(L);
  const en = easeOut(range(L, .1, .8)), give = range(L, 2.0, 2.6), ex = easeIn(range(L, 2.6, 3.1));
  if (L < 3.2) front += waiter(lerp(1400, PX, en) + ex * 700, TB.FLOOR, WS, Object.assign(walkPose(L * 12, en < 1 || ex > 0 ? .9 : 0), { armF: L < 2.2 ? [120, -40] : [60, 10], armB: L < 2.2 ? [110, -30] : [10, 10], flip: -1, held: L < 2.2 ? `<g transform="translate(0,-40) scale(-.9,.9)">${IT.placa(false)}</g>` : '' }), { mouth: 'grande', emo: L > .8 && L < 2 ? 'feliz' : 'neutro' });
  front += SPARK(PX, TB.FLOOR - 820, bump(range(L, .8, 1.6)));
  if (L > .9 && L < 2.0) front += `<g transform="translate(560,500)">${TAG(0, 0, 'GUINNESS', 1.3)}</g>`;
  if (L > 2.3) { const bite = range(L, 3.9, 4.4), chew = L > 4.4; o = { up: bite > 0 ? bump(Math.min(1, bite * 1.2)) * .95 : .35, item: IT.placa(bite > .5), rotR: 0, emo: L < 3.8 ? 'feliz' : 'neutro', mouth: bite > .3 && bite < .6 ? 'grande' : chew ? (Math.floor(L * 6.5) % 2 ? 'gato' : 'leve') : 'grande', crunch: L > 4.35 && L < 4.85 ? (L - 4.35) / .5 : -1 }; }
  o.plate = '';
  return tableScene(t, o, '', front) + VIG(.7);
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
