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
/* ===================== O homem que (disse que) comeu um avião ===================== */
const bump = x => x < 0 || x > 1 ? 0 : Math.sin(x * Math.PI);
const LOT = o => man(Object.assign({ kind: 'lotito' }, o));
const SIT = { drop: 230, legF: [88, -88], legB: [80, -84] };
// talheres (no espaço do boneco)
const FORK = `<g transform="rotate(-30)"><rect x="-5" y="-150" width="10" height="150" rx="4" fill="#C8CCD4" stroke="#16110E" stroke-width="3"/><path d="M-14 -150 L-14 -200 M-5 -150 L-5 -205 M5 -150 L5 -205 M14 -150 L14 -200" stroke="#C8CCD4" stroke-width="6" stroke-linecap="round"/></g>`;
const KNIFE = `<g transform="rotate(40)"><rect x="-6" y="-60" width="12" height="70" rx="4" fill="#3A2A20"/><path d="M-6 -60 L-6 -210 Q10 -200 8 -60Z" fill="#DCE0E8" stroke="#16110E" stroke-width="3"/></g>`;
// contador de avião comido (barra diegética, estilo placar)
function planeBar(pct, pop = 1, label = 'AVIÃO COMIDO') {
  const w = 420 * Math.max(0, Math.min(1, pct));
  return `<g transform="translate(540,190) scale(${f1(pop * 100) / 100})"><rect x="-260" y="-90" width="520" height="180" rx="28" fill="#0A0806" opacity=".62"/><rect x="-260" y="-90" width="520" height="180" rx="28" fill="none" stroke="#FFE2A8" stroke-width="4" opacity=".7"/><g transform="translate(-200,-30) scale(.42)">${miniPlane()}</g><text x="60" y="-8" text-anchor="middle" font-family="'DejaVu Sans Mono',monospace" font-weight="700" font-size="70" fill="#FFF3D6">${Math.round(pct * 100)}%</text><rect x="-210" y="30" width="420" height="28" rx="14" fill="#2A2420"/><rect x="-210" y="30" width="${f1(w)}" height="28" rx="14" fill="#FFB43A"/><text x="0" y="82" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="22" letter-spacing="6" fill="#FFD27A">${label}</text></g>`;
}
function miniPlane() { return `<path d="M-120 0 Q-60 -20 60 -16 L110 -10 Q120 0 110 10 L-100 12Z" fill="#F4F4F0" stroke="#16110E" stroke-width="5"/><rect x="-40" y="-34" width="120" height="14" rx="6" fill="#C8282E" stroke="#16110E" stroke-width="4"/><path d="M-120 0 L-150 -50 L-120 -50 L-90 -4Z" fill="#C8282E" stroke="#16110E" stroke-width="4"/>`; }
// placa/etiqueta diegética
const TAG = (x, y, txt, s = 1, col = '#FFE04A') => `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(s * 100) / 100})"><rect x="${-txt.length * 15 - 20}" y="-38" width="${txt.length * 30 + 40}" height="64" rx="14" fill="#0A0806" opacity=".78"/><text x="0" y="12" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="44" fill="${col}">${txt}</text></g>`;
/* ---------- o avião Cessna 150 (lateral, asa alta, frente à direita) ---------- */
// bites: lista de [x, y, r] (em coordenadas do avião) que já foram comidos
function cessna(x, y, s, t, eaten = 0, o = {}) {
  const id = nid('pm'), xc = -600 + eaten * 1010;
  let bm = ''; for (let k = 0; k < 9; k++) { const yy = -380 + k * 46, r = 30 + (k * 37 % 3) * 8; bm += `<circle cx="${f1(xc + (k % 2 ? 10 : -8))}" cy="${yy}" r="${r}" fill="#000"/>`; }
  def(`<mask id="${id}" maskUnits="userSpaceOnUse" x="-900" y="-700" width="1900" height="1000"><rect x="${f1(xc)}" y="-700" width="2000" height="1000" fill="#fff"/>${eaten > 0 ? bm : ''}</mask>`);
  const pr = (o.prop || 0);
  let g = `<g transform="translate(${f1(x)},${f1(y)}) scale(${s})"><ellipse cx="0" cy="8" rx="520" ry="30" fill="#000" opacity=".3" filter="url(#b12)"/><g mask="url(#${id})">`;
  g += `<path d="M-40 -330 L-40 -310 L-300 -230 L-300 -214 L-40 -300" stroke="#9A9EA6" stroke-width="10" fill="none"/><path d="M-30 -330 L-120 -250" stroke="#9A9EA6" stroke-width="12"/>`;
  g += `<path d="M120 -170 L80 -40 M220 -170 L250 -40" stroke="#3A3A40" stroke-width="12"/><circle cx="80" cy="-34" r="34" fill="#1A1A1E" stroke="#16110E" stroke-width="4"/><circle cx="80" cy="-34" r="12" fill="#B8BCC4"/><circle cx="250" cy="-34" r="34" fill="#1A1A1E" stroke="#16110E" stroke-width="4"/><circle cx="250" cy="-34" r="12" fill="#B8BCC4"/><path d="M-420 -150 L-440 -60" stroke="#3A3A40" stroke-width="8"/><circle cx="-440" cy="-50" r="16" fill="#1A1A1E"/>`;
  g += `<path d="M-500 -190 L-540 -360 L-470 -360 L-380 -210Z" fill="#F4F4F0" stroke="#16110E" stroke-width="6" stroke-linejoin="round"/><path d="M-528 -330 L-480 -330 L-430 -250 L-508 -250Z" fill="#C8282E"/><path d="M-560 -196 L-380 -200 L-380 -184 L-560 -182Z" fill="#E8E8E4" stroke="#16110E" stroke-width="5"/>`;
  g += `<path d="M-520 -200 Q-300 -240 -60 -260 L100 -290 Q240 -280 300 -230 L360 -200 Q380 -160 360 -130 L200 -110 Q-100 -130 -520 -176Z" fill="#F4F4F0" stroke="#16110E" stroke-width="6" stroke-linejoin="round"/>`;
  g += `<path d="M-500 -186 Q-200 -210 360 -165" stroke="#C8282E" stroke-width="16" fill="none"/><path d="M-470 -178 Q-200 -196 340 -150" stroke="#2A4A8A" stroke-width="6" fill="none"/>`;
  g += `<path d="M20 -280 L110 -286 L190 -230 L30 -226Z" fill="#7AA8D0" stroke="#16110E" stroke-width="5"/><path d="M110 -286 L112 -228" stroke="#16110E" stroke-width="5"/><path d="M40 -272 L70 -240" stroke="#fff" stroke-width="6" opacity=".6"/><path d="M-60 -250 L-10 -258 L-10 -226 L-60 -224Z" fill="#7AA8D0" stroke="#16110E" stroke-width="4"/>`;
  g += `<rect x="-140" y="-332" width="420" height="34" rx="12" fill="#F4F4F0" stroke="#16110E" stroke-width="6"/><rect x="200" y="-330" width="70" height="30" rx="10" fill="#C8282E"/><text x="210" y="-128" text-anchor="middle" font-family="'DejaVu Serif',serif" font-style="italic" font-weight="700" font-size="30" fill="#2A4A8A">Hryz Animation</text>`;
  g += `<path d="M360 -200 Q392 -184 360 -134Z" fill="#C8282E" stroke="#16110E" stroke-width="5"/><g transform="translate(386,-168) scale(1,${f1(Math.cos(pr) * 100) / 100})"><path d="M-8 -120 Q8 -60 6 0 Q8 60 -8 120 L-2 120 Q14 60 12 0 Q14 -60 -2 -120Z" fill="#3A3A40" stroke="#16110E" stroke-width="3"/></g>`;
  g += `</g>`;
  if (eaten > 0 && eaten < 1) g += Array.from({ length: 7 }, (_, k) => `<rect x="${f1(xc - 30 - (k * 23) % 40)}" y="${-30 + (k % 2) * 8}" width="${10 + k % 3 * 6}" height="7" fill="#C8CCD4" stroke="#16110E" stroke-width="2" transform="rotate(${k * 37} ${f1(xc - 30)} -30)"/>`).join('');

  return g + '</g>';
}
// lista de mordidas em ordem (da cauda para o nariz)
const BITES = (() => { const b = []; let sd = 7; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 60; i++) { const x = -560 + i * 16 + r() * 30, y = -360 + r() * 330; b.push([f1(x), f1(y), 46 + r() * 40]); } return b; })();
const bitesUpTo = p => BITES.slice(0, Math.round(p * BITES.length));
/* ---------- cenários ---------- */
function daySky(t) { return `<rect x="-2000" y="-2000" width="6000" height="6000" fill="#8EC4EC"/><circle cx="900" cy="380" r="80" fill="#FFF4C8"/>` + [0, 1, 2, 3].map(i => `<g transform="translate(${f1(((i * 420 + t * 18) % 2200) - 500)},${300 + (i % 2) * 120})"><ellipse rx="150" ry="46" fill="#F4F8FC"/><ellipse cx="60" cy="-26" rx="90" ry="40" fill="#FFFFFF"/></g>`).join(''); }
function airfield(y) { return `<rect x="-2000" y="${y}" width="6000" height="2000" fill="#7AAE4A"/><rect x="-2000" y="${y}" width="6000" height="14" fill="#5A8E3A"/><rect x="-2000" y="${y + 60}" width="6000" height="120" fill="#7A7E86"/><path d="M-2000 ${y + 120} H4000" stroke="#F4F4F0" stroke-width="8" stroke-dasharray="80 60"/>` + Array.from({ length: 40 }, (_, i) => `<path d="M${-1500 + i * 120} ${y + 260 + (i % 4) * 40} l6 -22 l6 22" stroke="#5A8E3A" stroke-width="4" fill="none"/>`).join('') + `<path d="M-800 ${y} L-800 ${y - 380} L-300 ${y - 380} L-300 ${y}Z" fill="#B8BCC4" stroke="#16110E" stroke-width="5"/><path d="M-820 ${y - 380} Q-550 ${y - 520} -280 ${y - 380}Z" fill="#9AA0A8" stroke="#16110E" stroke-width="5"/>`; }
function table(x, y, w = 520) { return `<rect x="${x - w / 2 + 30}" y="${y}" width="16" height="200" fill="#5A3E28"/><rect x="${x + w / 2 - 46}" y="${y}" width="16" height="200" fill="#5A3E28"/><path d="M${x - w / 2} ${y - 20} L${x + w / 2} ${y - 20} L${x + w / 2 + 20} ${y + 90} L${x - w / 2 - 20} ${y + 90}Z" fill="#FFFFFF" stroke="#16110E" stroke-width="5"/><path d="M${x - w / 2 + 40} ${y - 20} L${x - w / 2 + 20} ${y + 90} M${x + w / 2 - 40} ${y - 20} L${x + w / 2 - 20} ${y + 90}" stroke="#E0DCD4" stroke-width="4"/>` + Array.from({ length: 6 }, (_, i) => `<path d="M${x - w / 2 + i * w / 5} ${y - 20} L${x - w / 2 + i * w / 5 - 6} ${y + 90}" stroke="#C83A3A" stroke-width="3" opacity=".3"/>`).join(''); }
function plate(x, y, food = '') { return `<ellipse cx="${x}" cy="${y}" rx="110" ry="24" fill="#E8E8EC" stroke="#16110E" stroke-width="4"/><ellipse cx="${x}" cy="${y - 2}" rx="76" ry="14" fill="#F8F8FC"/>` + food; }
function chair(x, y) { return `<rect x="${x - 70}" y="${y - 250}" width="150" height="20" fill="#7A4A2A" stroke="#16110E" stroke-width="4"/><rect x="${x - 70}" y="${y - 520}" width="20" height="290" fill="#7A4A2A" stroke="#16110E" stroke-width="4"/><path d="M${x - 60} ${y - 230} V${y} M${x + 70} ${y - 230} V${y}" stroke="#5A3418" stroke-width="12"/>`; }
// pedaço de avião no prato (hélice / chapa)
const PROPPIECE = (x, y, rot = 0) => `<g transform="translate(${x},${y}) rotate(${rot})"><path d="M-70 -6 Q0 -16 70 -6 L70 6 Q0 14 -70 6Z" fill="#3A3A40" stroke="#16110E" stroke-width="3"/><circle r="10" fill="#C8282E" stroke="#16110E" stroke-width="3"/></g>`;
const SHEET = (x, y, rot = 0, s = 1) => `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})"><path d="M-40 -12 L36 -18 L44 8 L-30 16Z" fill="#E8E8E4" stroke="#16110E" stroke-width="3"/><path d="M-30 -2 L34 -6" stroke="#C8282E" stroke-width="6"/><circle cx="-24" cy="6" r="3" fill="#8A8E96"/><circle cx="26" cy="2" r="3" fill="#8A8E96"/></g>`;
function crunch(x, y, t, k = 1) { if (k <= 0) return ''; return Array.from({ length: 6 }, (_, i) => { const p = (t * 3 + i / 6) % 1; return `<path d="M${f1(x + Math.cos(i) * 30 * p * 3)} ${f1(y - 20 * p + Math.sin(i * 2) * 30 * p * 2)} l8 -6 l-4 10Z" fill="#B8BCC4" opacity="${op((1 - p) * k)}"/>`; }).join(''); }
// pose comendo sentado à mesa (ciclo)
function eatPose(L, sp = 1.6) {
  const c = (L * sp) % 1, up = c < .5 ? easeInOut(c * 2) : 1 - easeInOut((c - .5) * 2);
  return { up, armF: [lerp(70, 150, up), lerp(-40, -125, up)], armB: [lerp(60, 50, up), lerp(-50, -60, up) + 8 * Math.sin(L * 18) * (1 - up)], mouth: up > .85 ? .7 : (.15 + .15 * Math.sin(L * 20)) * (1 - up), held: FORK, heldB: KNIFE };
}
/* ====================== CENAS ====================== */
// 1. gancho: ele almoçando o avião (de garfo e faca) — a barra mostra quanto já foi comido
function s1(t) {
  const { L, d, k } = loc(t, 'n1'), [hx, hy] = HH(t, .6);
  setCam(lerp(650, 630, k) + hx, lerp(1250, 1260, k) + hy, lerp(.93, 1.0, easeOut(k)), 0, [540, 1100, 1]);
  let s = lay(.2, daySky(t)) + lay(.5, airfield(1380));
  const pct = lerp(.4, .42, k);
  s += lay(1, cessna(900, 1460, .8, t, pct));
  s += lay(1, chair(250, 1600) + table(470, 1340));
  const e = eatPose(L);
  s += lay(1, LOT({ x: 260, y: 1600, s: .62, ...SIT, ...e }));
  s += lay(1, plate(500, 1318, PROPPIECE(500, 1306, 8) + SHEET(470, 1300, -10, .8)) + `<rect x="620" y="1230" width="34" height="90" rx="6" fill="#BFE4FF" opacity=".7" stroke="#16110E" stroke-width="3"/><rect x="380" y="1290" width="20" height="30" fill="#E8E0D0"/>`);
  if (e.up > .85) s += lay(1, crunch(420, 1600 - .62 * 1150, t));
  s += planeBar(pct, 1 + .25 * bump(range(L, 0, .35)));
  return s + VIG(.7);
}
// 2. quem é: Michel Lotito, França; vidro e metal; pica
function s2(t) {
  const { L, d } = loc(t, 'n2'), [hx, hy] = HH(t, .6);
  let s = '';
  if (L < 5.2) {   // cartaz de palco "MONSIEUR MANGETOUT" + ele comendo um copo
    const k = L / 5.2;
    setCam(lerp(560, 520, k) + hx, lerp(1060, 1000, k) + hy, lerp(.95, 1.08, k), 0, [540, 1000, 1]);
    s += lay(.6, `<rect x="-800" y="-800" width="2700" height="3600" fill="#3A1418"/>` + Array.from({ length: 14 }, (_, i) => `<path d="M${-600 + i * 180} -800 Q${-560 + i * 180} 600 ${-600 + i * 180} 2400" stroke="#5A2028" stroke-width="60" fill="none"/>`).join(''));
    s += lay(.9, `<g transform="translate(540,560) rotate(-3)"><rect x="-330" y="-260" width="660" height="430" rx="10" fill="#F2E2B8" stroke="#16110E" stroke-width="8"/><text x="0" y="-170" text-anchor="middle" font-family="'DejaVu Serif',serif" font-weight="700" font-size="54" fill="#C8282E">MONSIEUR</text><text x="0" y="-100" text-anchor="middle" font-family="'DejaVu Serif',serif" font-weight="700" font-size="64" fill="#16110E">MANGETOUT</text><text x="0" y="-50" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-size="30" fill="#5A3A20">"o senhor come-tudo"</text><g transform="translate(-160,70) scale(.9)">${bikeIcon()}</g><g transform="translate(20,80) scale(.6)">${tvIcon(0)}</g><g transform="translate(200,60) scale(.32)">${miniPlane()}</g><text x="0" y="150" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="28" fill="#16110E">FRANÇA · MICHEL LOTITO</text><text x="0" y="-222" text-anchor="middle" font-family="'DejaVu Serif',serif" font-style="italic" font-size="24" fill="#5A3A20">Hryz Animation apresenta</text></g>`);
    s += lay(1, `<rect x="-400" y="1500" width="1900" height="600" fill="#5A3A22"/><rect x="-400" y="1500" width="1900" height="600" fill="url(#woodP)" opacity=".5"/><path d="M200 -200 L60 1500 L560 1500 L360 -200Z" fill="url(#beamW2)" opacity=".5"/>`);
    const bite = range(L, 2.0, 2.4), chew = L > 2.4 ? .3 + .3 * Math.sin(L * 20) : 0;
    s += lay(1, LOT({ x: 300, y: 1500, s: .66, napkin: 0, armF: [lerp(60, 150, bite), lerp(-30, -120, bite)], mouth: bite > .5 && bite < 1 ? .8 : chew, held: `<g transform="translate(0,-40)"><path d="M-30 -60 L30 -60 L22 30 L-22 30Z" fill="#CFEFFF" fill-opacity=".55" stroke="#16110E" stroke-width="4"/>${bite >= 1 ? `<path d="M10 -60 l10 18 l12 -10 l-2 -8Z" fill="#3A1418"/>` : ''}</g>` }));
    if (L > 2.4) s += lay(1, crunch(380, 1500 - .66 * 1150, t, 1 - range(L, 4, 5)));
    s += lay(1, `<g transform="translate(720,1400)"><path d="M0 -40 L30 0 L0 40 L-30 0Z" fill="#9AC8E8" stroke="#16110E" stroke-width="3"/><circle cx="60" cy="10" r="14" fill="#8A8E96" stroke="#16110E" stroke-width="3"/><rect x="90" y="-20" width="40" height="12" fill="#8A8E96" stroke="#16110E" stroke-width="3"/></g>`);
    return s + VIG(.8);
  }
  // médico com a prancheta: PICA
  const L2 = L - 5.2, k = L2 / (d - 5.2);
  setCam(lerp(560, 600, k) + hx, lerp(1080, 1040, k) + hy, lerp(1.0, 1.12, k), 0, [540, 1000, 1]);
  s += lay(1, `<rect x="-600" y="-600" width="2400" height="3200" fill="#DCE8EC"/><rect x="-600" y="1500" width="2400" height="900" fill="#A8B8C0"/><rect x="620" y="420" width="300" height="360" fill="#F4F8FA" stroke="#16110E" stroke-width="5"/><path d="M660 480 h220 M660 530 h180 M660 580 h200" stroke="#9AA8B0" stroke-width="8"/><path d="M770 640 v80 M730 680 h80" stroke="#C8282E" stroke-width="16"/>`);
  s += lay(1, man({ x: 760, y: 1500, s: .7, kind: 'medico', flip: -1, armF: [70, -60], held: `<g transform="translate(-20,-80) rotate(-10) scale(-1,1)"><rect x="-70" y="-90" width="150" height="190" rx="10" fill="#C89A5A" stroke="#16110E" stroke-width="5"/><rect x="-56" y="-70" width="122" height="156" fill="#FFFFFF"/><text x="5" y="-20" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="38" fill="#C8282E">PICA</text><path d="M-40 10 h90 M-40 40 h70 M-40 70 h80" stroke="#9AA8B0" stroke-width="6"/></g>` }));
  s += lay(1, LOT({ x: 300, y: 1500, s: .66, napkin: 0, look: 0, mouth: 0, armF: [20, 30] }) + `<g transform="translate(300,${1500 - .66 * 1250})" opacity="${op(range(L2, .5, 1))}"><circle r="40" fill="#FFF3D6" stroke="#16110E" stroke-width="4"/><text y="16" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="50" fill="#16110E">?</text></g>`);
  return s + VIG(.7);
}
// ícones de objetos
function bikeIcon() { return `<circle cx="-60" cy="0" r="46" fill="none" stroke="#16110E" stroke-width="8"/><circle cx="60" cy="0" r="46" fill="none" stroke="#16110E" stroke-width="8"/><path d="M-60 0 L-10 -60 L40 -60 L60 0 M-10 -60 L0 0 L40 -60 M-20 -76 L4 -76 M40 -60 L34 -84 L54 -86" stroke="#C8282E" stroke-width="8" fill="none" stroke-linejoin="round"/>`; }
function cartIcon() { return `<path d="M-90 -80 L-60 -80 L-40 20 L70 20 L90 -50 L-50 -50" fill="none" stroke="#5A5E66" stroke-width="9" stroke-linejoin="round"/>${[-30, 0, 30, 60].map(x => `<path d="M${x - 10} -50 L${x - 6} 20" stroke="#5A5E66" stroke-width="4"/>`).join('')}<path d="M-46 -16 L78 -16" stroke="#5A5E66" stroke-width="4"/><circle cx="-30" cy="44" r="14" fill="#16110E"/><circle cx="60" cy="44" r="14" fill="#16110E"/>`; }
function tvIcon(t) { return `<rect x="-90" y="-70" width="180" height="130" rx="18" fill="#6A4A30" stroke="#16110E" stroke-width="6"/><rect x="-72" y="-54" width="110" height="96" rx="14" fill="#9AC8C0" stroke="#16110E" stroke-width="4"/><circle cx="62" cy="-30" r="8" fill="#16110E"/><circle cx="62" cy="0" r="8" fill="#16110E"/><path d="M-30 -70 L-60 -120 M10 -70 L40 -120" stroke="#16110E" stroke-width="5"/>`; }
function lampIcon() { return `<path d="M0 -140 V-80" stroke="#C8A040" stroke-width="6"/><path d="M-100 -60 Q0 -110 100 -60 L80 -40 L-80 -40Z" fill="#E8C060" stroke="#16110E" stroke-width="5"/>${[-70, -35, 0, 35, 70].map(x => `<path d="M${x} -40 L${x} 0" stroke="#C8A040" stroke-width="4"/><path d="M${x} 0 l-8 18 l8 14 l8 -14Z" fill="#CFEFFF" stroke="#16110E" stroke-width="3"/>`).join('')}`; }
function bedIcon() { return `<rect x="-120" y="-30" width="240" height="40" fill="#8A5A3A" stroke="#16110E" stroke-width="5"/><rect x="-120" y="-80" width="24" height="120" fill="#6A4028" stroke="#16110E" stroke-width="5"/><rect x="96" y="-56" width="24" height="96" fill="#6A4028" stroke="#16110E" stroke-width="5"/><rect x="-96" y="-56" width="70" height="26" rx="10" fill="#FFFFFF" stroke="#16110E" stroke-width="4"/><rect x="-26" y="-50" width="122" height="22" fill="#4A7AC8" stroke="#16110E" stroke-width="4"/>`; }
function coffinIcon() { return `<path d="M-130 0 L-90 -50 L120 -44 L140 0 L120 44 L-90 50Z" fill="#6A3A22" stroke="#16110E" stroke-width="6" stroke-linejoin="round"/><path d="M-80 -30 L110 -26 M-80 30 L110 26" stroke="#4A2614" stroke-width="5"/>${[-40, 20, 80].map(x => `<rect x="${x - 14}" y="44" width="28" height="12" rx="5" fill="#E8C060" stroke="#16110E" stroke-width="3"/>`).join('')}`; }
// 3. no palco: corta em pedacinhos, óleo mineral, água, engole; ~1 kg por dia
function s3(t) {
  const { L, d, k } = loc(t, 'n3'), [hx, hy] = HH(t, .6);
  setCam(lerp(500, 600, k) + hx, lerp(1080, 1120, k) + hy, lerp(.9, 1.05, k), 0, [540, 1100, 1]);
  let s = lay(.6, `<rect x="-800" y="-800" width="2700" height="3600" fill="#3A1418"/>` + Array.from({ length: 14 }, (_, i) => `<path d="M${-600 + i * 180} -800 Q${-560 + i * 180} 600 ${-600 + i * 180} 2400" stroke="#5A2028" stroke-width="60" fill="none"/>`).join(''));
  s += lay(1, `<rect x="-400" y="1500" width="1900" height="600" fill="#5A3A22"/><rect x="-400" y="1500" width="1900" height="600" fill="url(#woodP)" opacity=".5"/><path d="M260 -200 L-40 1500 L760 1500 L460 -200Z" fill="url(#beamW2)" opacity=".55"/>`);
  const ph = L < 2.2 ? 0 : L < 3.6 ? 1 : L < 5.2 ? 2 : 3;
  // bicicleta sendo serrada
  if (ph === 0) { const sw = Math.sin(L * 16); s += lay(1, `<g transform="translate(700,1440) scale(1.3)">${bikeIcon()}</g>` + LOT({ x: 380, y: 1500, s: .66, napkin: 0, armF: [80 + 6 * sw, -40], armB: [70 + 6 * sw, -30], held: `<g transform="translate(${f1(20 * sw)},0)"><rect x="-10" y="-10" width="200" height="16" fill="#C8CCD4" stroke="#16110E" stroke-width="3"/><path d="M0 -10 L200 -10" stroke="#16110E" stroke-width="2" stroke-dasharray="4 4"/><rect x="-60" y="-24" width="60" height="40" rx="10" fill="#C8282E" stroke="#16110E" stroke-width="3"/></g>` }) + Array.from({ length: 8 }, (_, i) => { const p = (t * 4 + i / 8) % 1; return `<circle cx="${f1(640 + Math.cos(i * 2) * 60 * p)}" cy="${f1(1400 + p * 90)}" r="4" fill="#FFE04A" opacity="${op(1 - p)}"/>`; }).join('')); }
  // pedacinhos + óleo + água
  if (ph >= 1) s += lay(1, table(560, 1340, 460) + plate(560, 1318, Array.from({ length: 9 }, (_, i) => `<rect x="${500 + (i % 5) * 26}" y="${1296 + Math.floor(i / 5) * 12}" width="18" height="10" fill="#8A8E96" stroke="#16110E" stroke-width="2" transform="rotate(${i * 20} ${510 + (i % 5) * 26} ${1300 + Math.floor(i / 5) * 12})"/>`).join('')) + `<g transform="translate(720,1250)"><rect x="-26" y="-60" width="52" height="80" rx="8" fill="#FFE8A0" opacity=".8" stroke="#16110E" stroke-width="3"/><text x="0" y="-12" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="15" fill="#5A3A10">ÓLEO</text></g><g transform="translate(400,1240)"><rect x="-30" y="-70" width="60" height="90" rx="6" fill="#BFE4FF" opacity=".7" stroke="#16110E" stroke-width="3"/></g>`);
  if (ph >= 1) { const drink = ph === 1 ? bump(range(L, 2.4, 3.4)) : ph === 2 ? bump(range(L, 3.8, 4.9)) : 0; const swallow = ph === 3 ? bump(range(L, 5.4, 6.2)) : 0; s += lay(1, LOT({ x: 250, y: 1600, s: .62, ...SIT, napkin: 1, armF: [lerp(60, 150, drink), lerp(-40, -125, drink)], held: drink > 0 ? `<rect x="-24" y="-60" width="48" height="70" rx="6" fill="${ph === 1 ? '#FFE8A0' : '#BFE4FF'}" opacity=".85" stroke="#16110E" stroke-width="3"/>` : '', mouth: swallow > .3 ? .5 : 0, eyes: swallow > .5 ? 0 : 1 })); }
  if (ph === 3) s += lay(1, `<g transform="translate(860,1080)">${['#FFE04A'].map(() => '').join('')}<rect x="-110" y="0" width="220" height="40" rx="10" fill="#C8CCD4" stroke="#16110E" stroke-width="5"/><rect x="-80" y="40" width="160" height="90" rx="12" fill="#E8E8EC" stroke="#16110E" stroke-width="5"/><circle cx="0" cy="85" r="34" fill="#FFFFFF" stroke="#16110E" stroke-width="4"/><path d="M0 85 L${f1(26 * Math.cos(-1.4 + range(L, 5.4, 6.4) * 2.4))} ${f1(85 + 26 * Math.sin(-1.4 + range(L, 5.4, 6.4) * 2.4))}" stroke="#C8282E" stroke-width="5"/><rect x="-60" y="-30" width="120" height="30" fill="#8A8E96" stroke="#16110E" stroke-width="3"/></g>` + TAG(860, 960, '≈ 1 kg / dia', .9 + .2 * bump(range(L, 6.3, 6.7))));
  return s + VIG(.8);
}
// 4. a lista: cada objeto entra com seu número
function s4(t) {
  const { L, d, k } = loc(t, 'n4'), [hx, hy] = HH(t, .8);
  const IT = [[0, 'bike', 18], [1.3, 'cart', 15], [2.8, 'tv', 7], [3.9, 'lamp', 6], [5.0, 'bed', 2], [6.7, 'coffin', 1]];
  const cur = IT.filter(x => L >= x[0]).length - 1, it = IT[Math.max(0, cur)], u = L - it[0];
  setCam(540 + hx + 40 * Math.sin(L * 1.3), 1000 + hy, 1.0 + .06 * bump(range(u, 0, .4)), 2 * Math.sin(L * 2), [540, 1000, 1]);
  let s = `<rect width="1080" height="1920" fill="${['#F2C24A', '#5AB4D8', '#E86A4A', '#8A6AD0', '#5AC88A', '#3A2A2A'][Math.max(0, cur)]}"/>` + Array.from({ length: 12 }, (_, i) => `<path d="M540 960 L${f1(540 + 2000 * Math.cos(i * Math.PI / 6 + L * .3))} ${f1(960 + 2000 * Math.sin(i * Math.PI / 6 + L * .3))} L${f1(540 + 2000 * Math.cos(i * Math.PI / 6 + .26 + L * .3))} ${f1(960 + 2000 * Math.sin(i * Math.PI / 6 + .26 + L * .3))}Z" fill="#FFFFFF" opacity=".12"/>`).join('');
  const n = it[2], shown = Math.max(1, Math.min(n, Math.ceil(n * easeOut(range(u, 0, .9)))));
  const ico = { bike: bikeIcon(), cart: cartIcon(), tv: tvIcon(t), lamp: lampIcon(), bed: bedIcon(), coffin: coffinIcon() }[it[1]];
  // pilha de cópias atrás, o objeto principal na frente
  let pile = ''; for (let i = 0; i < Math.min(shown, 8); i++) pile += `<g transform="translate(${540 + (i % 4 - 1.5) * 130},${1220 - Math.floor(i / 4) * 110}) scale(.9)" opacity=".55">${ico}</g>`;
  s += lay(1, pile + `<g transform="translate(540,${f1(1100 - 300 * (1 - easeOut(range(u, 0, .35))))}) scale(${f1((2.4 + .3 * bump(range(u, .3, .6))) * 100) / 100}) rotate(${f1(4 * Math.sin(L * 3))})">${ico}</g>`);
  s += `<g transform="translate(540,560) scale(${f1((1 + .35 * bump(range(u, 0, .3))) * 100) / 100})"><text x="0" y="40" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="200" fill="#16110E" opacity=".25" transform="translate(8,8)">×${shown}</text><text x="0" y="40" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="200" fill="#FFFFFF" stroke="#16110E" stroke-width="8">×${shown}</text></g>`;
  if (it[1] === 'coffin' && u > .9) s += `<g transform="translate(540,1380)">${TAG(0, 0, 'COM AS ALÇAS!', 1 + .2 * bump(range(u, .9, 1.3)), '#FFE04A')}</g>`;
  // ele no canto mastigando
  s += lay(1, `<g transform="translate(150,1880) scale(.8)">${LOT({ x: 0, y: 0, s: .6, napkin: 1, mouth: .2 + .3 * Math.abs(Math.sin(L * 9)), armF: [60, -30] })}</g>`);
  return s + VIG(.6);
}
// 5. 1978: o Cessna 150; pedaço por pedaço, uns dois anos
function s5(t) {
  const { L, d, k } = loc(t, 'n5'), [hx, hy] = HH(t, .6);
  setCam(lerp(560, 520, k) + hx, lerp(1180, 1150, k) + hy, lerp(.62, .74, easeInOut(k)), 0, [540, 1100, 1]);
  const eat = easeInOut(range(L, 2.0, d - .3));
  let s = lay(.2, daySky(t)) + lay(.5, airfield(1380));
  s += lay(1, cessna(560, 1460, 1, t, eat, { prop: L < 1.5 ? t * 30 : 0 }));
  const sw = Math.sin(L * 16);
  s += lay(1, LOT({ x: lerp(-60, 60 + 640 * eat, range(L, .6, 2)), y: 1500, s: .55, napkin: 1, ...(L < 2 ? walkPose(L * 6, .6) : {}), armF: L >= 2 ? [80 + 6 * sw, -40] : [10, 10], held: L >= 2 ? `<g transform="translate(${f1(20 * sw)},0)"><rect x="-10" y="-10" width="200" height="16" fill="#C8CCD4" stroke="#16110E" stroke-width="3"/><rect x="-60" y="-24" width="60" height="40" rx="10" fill="#C8282E" stroke="#16110E" stroke-width="3"/></g>` : '' }));
  // calendário 1978 → 1980
  const yr = 1978 + Math.min(2, Math.floor(eat * 2.999)), mon = Math.floor((eat * 24) % 12);
  const MES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  s += `<g transform="translate(860,480) rotate(4)"><rect x="-120" y="-110" width="240" height="230" rx="14" fill="#FFFFFF" stroke="#16110E" stroke-width="6"/><rect x="-120" y="-110" width="240" height="64" rx="14" fill="#C8282E" stroke="#16110E" stroke-width="6"/><text x="0" y="-62" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="40" fill="#fff">${eat > 0 ? MES[mon] : 'JAN'}</text><text x="0" y="60" text-anchor="middle" font-family="'DejaVu Sans Mono',monospace" font-weight="700" font-size="74" fill="#16110E">${eat > 0 ? yr : 1978}</text></g>`;
  s += planeBar(eat, 1);
  return s + VIG(.7);
}
// 6. raio-x: parede grossa no estômago; banana dá azia
function s6(t) {
  const { L, d } = loc(t, 'n6'), [hx, hy] = HH(t, .6);
  let s = '';
  const k = L / d;
  setCam(540 + hx, lerp(1000, 960, k) + hy, lerp(1.0, 1.08, k), 0, [540, 1000, 1]);
  s += `<rect width="1080" height="1920" fill="#0A1A24"/>` + Array.from({ length: 20 }, (_, i) => `<path d="M0 ${i * 100} H1080" stroke="#1A3A4A" stroke-width="2"/>`).join('');
  const ban = range(L, 4.6, 5.3), burn = range(L, 5.6, 6.2);
  // silhueta em raio-x
  s += lay(1, `<g opacity=".95"><ellipse cx="540" cy="520" rx="150" ry="180" fill="#2A5A6A" stroke="#8AE0F0" stroke-width="5"/><rect x="480" y="680" width="120" height="110" fill="#2A5A6A" stroke="#8AE0F0" stroke-width="5"/><path d="M300 800 Q540 740 780 800 L840 1620 Q540 1700 240 1620Z" fill="#1E4A58" stroke="#8AE0F0" stroke-width="6"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${380 - i * 6} ${880 + i * 50} Q540 ${850 + i * 50} ${700 + i * 6} ${880 + i * 50}" stroke="#BFF4FF" stroke-width="8" fill="none" opacity=".45"/>`).join('')}<path d="M540 800 V1600" stroke="#BFF4FF" stroke-width="14" opacity=".4"/></g>`);
  // estômago com parede grossa e metal dentro
  const thick = 26 + 8 * bump(range(L, 1.5, 2.5));
  s += lay(1, `<path d="M480 1120 Q400 1180 430 1300 Q470 1400 600 1380 Q700 1360 690 1260 Q680 1180 620 1170 Q580 1160 560 1120Z" fill="#D86A6A" stroke="#FFB4A8" stroke-width="${f1(thick)}" stroke-linejoin="round"/><path d="M480 1120 Q400 1180 430 1300 Q470 1400 600 1380 Q700 1360 690 1260 Q680 1180 620 1170 Q580 1160 560 1120Z" fill="none" stroke="#8A2A2A" stroke-width="4"/>` + [[520, 1250, 20], [580, 1300, -30], [620, 1240, 50], [500, 1320, 80]].map(([x, y, r]) => `<rect x="${x - 20}" y="${y - 8}" width="40" height="16" fill="#C8CCD4" stroke="#16110E" stroke-width="3" transform="rotate(${r} ${x} ${y})"/>`).join('') + `<path d="M440 1390 Q400 1480 480 1520 Q600 1560 640 1500" stroke="#E08A7A" stroke-width="${f1(thick * .8)}" fill="none"/>`);
  if (L > 1.2 && L < 4.4) s += `<g transform="translate(820,1260)">${TAG(0, 0, 'PAREDE GROSSA', .8)}</g><path d="M700 1260 L740 1260" stroke="#FFE04A" stroke-width="6"/>`;
  // banana entra e azia
  if (ban > 0) { const bx = lerp(900, 560, easeIn(ban)), by = lerp(300, 1240, easeIn(ban)); if (ban < 1) s += lay(1, `<g transform="translate(${f1(bx)},${f1(by)}) rotate(${f1(ban * 200)})"><path d="M-70 -10 Q0 60 70 -10 Q0 30 -70 -10Z" fill="#FFE04A" stroke="#16110E" stroke-width="5"/><path d="M70 -10 l12 -10" stroke="#5A3A10" stroke-width="8"/></g>`); }
  if (burn > 0) s += lay(1, Array.from({ length: 5 }, (_, i) => { const f = 1 + .25 * Math.sin(t * 18 + i), x = 470 + i * 50; return `<path d="M${x - 20} 1180 Q${x - 24} ${f1(1180 - 60 * f * burn)} ${x} ${f1(1180 - 110 * f * burn)} Q${x + 24} ${f1(1180 - 60 * f * burn)} ${x + 20} 1180Z" fill="#FF7A1A" stroke="#C83A10" stroke-width="3"/>`; }).join('') + `<path d="M540 1100 Q520 900 540 700" stroke="#FF7A1A" stroke-width="${f1(20 * burn)}" fill="none" opacity=".7"/>` + `<g transform="translate(540,300)">${TAG(0, 0, 'AZIA!', 1.2 + .3 * bump(range(L, 5.6, 6)), '#FF8A4A')}</g>`);
  return s + VIG(.8);
}
// 7. Guinness: recorde de dieta mais estranha; ele come a placa
function s7(t) {
  const { L, d, k } = loc(t, 'n7'), [hx, hy] = HH(t, .6);
  setCam(lerp(520, 460, k) + hx, lerp(1080, 1040, k) + hy, lerp(.95, 1.25, easeInOut(range(L, 3.2, 5))), 0, [540, 1000, 1]);
  let s = lay(.5, `<rect x="-800" y="-800" width="2700" height="3600" fill="#1A2A4A"/>` + Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 137) % 1300 - 100}" cy="${(i * 211) % 1500 - 200}" r="${3 + i % 3 * 2}" fill="#FFE6A0" opacity="${op(.3 + .4 * Math.sin(t * 3 + i))}"/>`).join(''));
  s += lay(1, `<rect x="-400" y="1500" width="1900" height="600" fill="#6A1A22"/><rect x="-400" y="1480" width="1900" height="30" fill="#8A2A32"/><path d="M380 -200 L120 1500 L780 1500 L560 -200Z" fill="url(#beamW2)" opacity=".5"/>`);
  const give = easeOut(range(L, .4, 1.4)), bite = range(L, 4.6, 5.0), chew = L > 5.0 ? .3 + .3 * Math.sin(L * 20) : 0;
  const plaque = (bit) => `<g><rect x="-110" y="-150" width="220" height="150" rx="10" fill="#C89A3A" stroke="#16110E" stroke-width="5"/><rect x="-94" y="-134" width="188" height="118" rx="6" fill="#E8C060" stroke="#8A6A20" stroke-width="3"/><text x="0" y="-96" text-anchor="middle" font-family="'DejaVu Serif',serif" font-weight="700" font-size="20" fill="#5A3A10">RECORDE</text><text x="0" y="-68" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="17" fill="#5A3A10">DIETA MAIS</text><text x="0" y="-44" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="17" fill="#5A3A10">ESTRANHA</text>${bit ? `<path d="M110 -150 L110 -60 Q80 -70 86 -90 Q60 -96 70 -118 Q50 -130 64 -150Z" fill="#1A2A4A"/>` : ''}</g>`;
  if (L < 1.4) s += lay(1, man({ x: lerp(900, 640, give), y: 1500, s: .66, kind: 'medico', flip: -1, ...walkPose(L * 6, give < 1 ? .6 : 0), armF: [80, -40], held: `<g transform="translate(20,-20) scale(-1.6,1.6)">${plaque(0)}</g>` }));
  else s += lay(1, man({ x: 640, y: 1500, s: .66, kind: 'medico', flip: -1, armF: [10, 10], mouth: L > 4.6 ? .8 : 0 }));
  s += lay(1, LOT({ x: 300, y: 1500, s: .66, napkin: 1, armF: L >= 1.4 ? [lerp(80, 150, bite), lerp(-40, -110, bite)] : [20, 20], mouth: bite > .5 && bite < 1 ? .8 : chew, held: L >= 1.4 ? `<g transform="translate(30,-30) scale(1.6)">${plaque(bite >= 1)}</g>` : '' }));
  if (L > 5.0) s += lay(1, crunch(370, 1500 - .66 * 1150, t, 1 - range(L, 6.2, 7)));
  if (L > 1.6 && L < 4.4) s += `<g transform="translate(540,300)">${TAG(0, 0, 'GUINNESS', 1.1)}</g>`;
  return s + VIG(.8);
}
// 8. ninguém provou o avião inteiro; não tenta em casa; volta pro almoço
function s8(t) {
  const { L, d, k } = loc(t, 'n8'), [hx, hy] = HH(t, .6);
  let s = '';
  if (L < 3.4) {
    setCam(560 + hx, 1150 + hy, lerp(.7, .8, L / 3.4), 0, [540, 1100, 1]);
    s += lay(.2, daySky(t)) + lay(.5, airfield(1380)) + lay(1, cessna(560, 1460, 1, t, .66));
    const q = 1 + .15 * Math.sin(L * 4);
    s += `<g transform="translate(540,560) scale(${f1(q * 100) / 100})"><circle r="150" fill="#FFF3D6" stroke="#16110E" stroke-width="8"/><text y="80" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="230" fill="#C8282E">?</text></g>`;
    return s + VIG(.7);
  }
  if (L < 6.0) {   // dedo balançando: não tenta
    const L2 = L - 3.4;
    setCam(380 + hx, 1000 + hy, 1.25, 0, [540, 1000, 1]);
    s += lay(1, `<rect x="-600" y="-600" width="2400" height="3200" fill="#F2C24A"/>` + Array.from({ length: 12 }, (_, i) => `<path d="M380 1000 L${f1(380 + 2000 * Math.cos(i * Math.PI / 6 + L * .3))} ${f1(1000 + 2000 * Math.sin(i * Math.PI / 6 + L * .3))} L${f1(380 + 2000 * Math.cos(i * Math.PI / 6 + .26 + L * .3))} ${f1(1000 + 2000 * Math.sin(i * Math.PI / 6 + .26 + L * .3))}Z" fill="#FFFFFF" opacity=".15"/>`).join(''));
    const wag = Math.sin(L2 * 14);
    s += lay(1, LOT({ x: 300, y: 1560, s: .66, napkin: 1, armF: [150, -60 + 18 * wag], held: `<rect x="-6" y="-70" width="16" height="60" rx="8" fill="#E2AE8A" stroke="#16110E" stroke-width="3"/>`, mouth: .3 }));
    s += `<g transform="translate(540,420)">${TAG(0, 0, 'NÃO TENTE!', 1.3 + .1 * bump(range(L2, 0, .4)), '#FF4A3A')}</g>`;
    return s + VIG(.6);
  }
  // volta pro almoço (fecha o loop com o começo)
  const L3 = L - 6.0;
  setCam(650 + hx, 1250 + hy, lerp(1.1, .93, range(L3, 0, d - 6)), 0, [540, 1100, 1]);
  s += lay(.2, daySky(t)) + lay(.5, airfield(1380)) + lay(1, cessna(900, 1460, .8, t, .4));
  s += lay(1, chair(250, 1600) + table(470, 1340));
  const e = eatPose(L3 + .3);
  s += lay(1, LOT({ x: 260, y: 1600, s: .62, ...SIT, ...e }) + plate(500, 1318, PROPPIECE(500, 1306, 8) + SHEET(470, 1300, -10, .8)));
  s += planeBar(.4, 1);
  return s + VIG(.7);
}
const FN = { n1: s1, n2: s2, n3: s3, n4: s4, n5: s5, n6: s6, n7: s7, n8: s8 };

function frame(t) {
  D = []; uid = 0;
  const sh = shotAt(t);
  let body = FN[sh[0]](t);
  for (const c of SH.slice(1)) if (t >= c[1] && t < c[1] + .08) body += `<rect width="1080" height="1920" fill="#fff" opacity="${op(.2 * (1 - (t - c[1]) / .08))}"/>`;
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
