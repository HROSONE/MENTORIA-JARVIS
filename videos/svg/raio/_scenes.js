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
/* ===================== O homem que levou 7 raios (Roy Sullivan) ===================== */
const bump = x => x < 0 || x > 1 ? 0 : Math.sin(x * Math.PI);
const ROY = o => man(Object.assign({ kind: 'ranger' }, o));
// raio: forma fixa por semente, com galhos
function boltPath(x0, y0, x1, y1, seed, n = 14, amp = 70) {
  let r = seed * 9301 + 49297; const rn = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const pts = []; for (let i = 0; i <= n; i++) { const k = i / n, j = i === 0 || i === n ? 0 : (rn() - .5) * amp * (1 - k * .5); pts.push([x0 + (x1 - x0) * k + j, y0 + (y1 - y0) * k + (rn() - .5) * 20]); }
  let d = 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join(' L'), br = '';
  for (let b = 0; b < 3; b++) { const i = 2 + Math.floor(rn() * (n - 5)), [bx, by] = pts[i]; let x = bx, y = by; br += `M${f1(x)} ${f1(y)}`; const dir = rn() < .5 ? -1 : 1; for (let k = 0; k < 4; k++) { x += dir * (30 + rn() * 50); y += 40 + rn() * 60; br += ` L${f1(x)} ${f1(y)}`; } }
  return [d, br];
}
function bolt(x0, y0, x1, y1, seed, a = 1) {
  if (a <= 0) return '';
  const [d, br] = boltPath(x0, y0, x1, y1, seed);
  return `<g opacity="${op(a)}"><path d="${d}" stroke="#7AB8FF" stroke-width="60" fill="none" opacity=".45" filter="url(#b12)"/><path d="${br}" stroke="#BFE0FF" stroke-width="7" fill="none" stroke-linejoin="round"/><path d="${d}" stroke="#CFE8FF" stroke-width="18" fill="none" stroke-linejoin="round"/><path d="${d}" stroke="#FFFFFF" stroke-width="7" fill="none" stroke-linejoin="round"/><circle cx="${x1}" cy="${y1}" r="90" fill="#E8F4FF" opacity=".8" filter="url(#b12)"/></g>`;
}
// estado de um raio que cai no tempo ts (segundos locais)
function hit(L, ts) {
  const u = L - ts;
  return { u, bolt: u > -.06 && u < .3 ? (Math.floor(u * 40) % 3 === 2 ? .35 : 1) : 0, flash: u >= 0 ? Math.max(0, 1 - u / .45) : (u > -.12 ? .3 : 0), zap: u >= 0 && u < .5 && Math.floor(u * 22) % 2 === 0, after: u > .15, shake: u >= 0 && u < .6 ? (1 - u / .6) * 22 : 0 };
}
const zapWrap = (svg, z) => z ? `<g filter="url(#zapF)">${svg}</g>` : svg;
const FLASH = k => k > 0 ? `<rect width="1080" height="1920" fill="#EAF2FF" opacity="${op(k * .85)}"/>` : '';
function smoke(x, y, t, n = 5, k = 1, sz = 1) {
  let o = ''; for (let i = 0; i < n; i++) { const p = (t * .55 + i / n) % 1; o += `<circle cx="${f1(x + Math.sin(t * 2 + i * 2) * 18 * sz + p * 30 * sz)}" cy="${f1(y - p * 200 * sz)}" r="${f1((14 + p * 34) * sz)}" fill="#8A8A90" opacity="${op((1 - p) * .55 * k)}" filter="url(#b4)"/>`; }
  return o;
}
function flames(x, y, t, s = 1, k = 1) {
  if (k <= 0) return '';
  let o = `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(s * k * 100) / 100})"><circle r="70" cy="-40" fill="#FF8A2A" opacity=".35" filter="url(#b12)"/>`;
  [[-40, 1.0, 0], [0, 1.4, 1.3], [40, 1.1, 2.4], [-18, .8, 3.1], [22, .9, 4.2]].forEach(([dx, h, ph]) => { const f = 1 + .25 * Math.sin(t * 19 + ph), hh = 90 * h * f; o += `<path d="M${dx - 26} 0 Q${dx - 30} ${f1(-hh * .5)} ${f1(dx + 6 * Math.sin(t * 13 + ph))} ${f1(-hh)} Q${dx + 30} ${f1(-hh * .5)} ${dx + 26} 0Z" fill="#FF7A1A" stroke="#C83A10" stroke-width="3"/><path d="M${dx - 12} 0 Q${dx - 14} ${f1(-hh * .3)} ${dx} ${f1(-hh * .6)} Q${dx + 14} ${f1(-hh * .3)} ${dx + 12} 0Z" fill="#FFE26A"/>`; });
  return o + '</g>';
}
// contador diegético de raios (estilo placar)
function raioBox(n, pop = 1, year = '', red = 0) {
  const icon = `<path d="M-14 -46 L-40 6 L-10 6 L-24 50 L30 -12 L0 -12 L16 -46Z" fill="#FFE04A" stroke="#1A120C" stroke-width="4" stroke-linejoin="round"/>`;
  let s = `<g transform="translate(540,190) scale(${f1(pop * 100) / 100})"><rect x="-230" y="-86" width="460" height="172" rx="28" fill="#0A0806" opacity=".62"/><rect x="-230" y="-86" width="460" height="172" rx="28" fill="none" stroke="${red ? '#FF6A4A' : '#FFE2A8'}" stroke-width="4" opacity=".7"/><g transform="translate(-130,-6) scale(1.3)">${icon}</g><text x="50" y="34" text-anchor="middle" font-family="'DejaVu Sans Mono',monospace" font-weight="700" font-size="124" fill="${red ? '#FF8A6A' : '#FFF3D6'}">${n}</text><text x="50" y="70" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="26" letter-spacing="8" fill="#FFD27A">${n === 1 ? 'RAIO' : 'RAIOS'}</text></g>`;
  if (year) s += `<g transform="translate(540,330)"><rect x="-90" y="-34" width="180" height="62" rx="14" fill="#0A0806" opacity=".55"/><text x="0" y="12" text-anchor="middle" font-family="'DejaVu Sans Mono',monospace" font-weight="700" font-size="40" fill="#FFF3D6">${year}</text></g>`;
  return s;
}
// céu de tempestade
function stormSky(t, fl = 0, top = '#0C1020', bot = '#3A4258') {
  const id = nid('sg'); def(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient>`);
  let s = `<rect x="-2000" y="-2000" width="6000" height="6000" fill="url(#${id})"/>`;
  for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) { const x = ((i * 330 + r * 140 + t * (12 + r * 8)) % 3300) - 1100, y = -300 + r * 230 + (i % 3) * 40; s += `<ellipse cx="${f1(x)}" cy="${y + 30}" rx="${240 - r * 30}" ry="${110 - r * 15}" fill="#05070E" opacity=".45"/><ellipse cx="${f1(x)}" cy="${y}" rx="${240 - r * 30}" ry="${110 - r * 15}" fill="${mix('#1A2030', '#5A6480', r / 3)}"/><ellipse cx="${f1(x + 30)}" cy="${y - 30}" rx="${130 - r * 15}" ry="${50 - r * 8}" fill="${mix('#2A3248', '#7A84A0', r / 3)}" opacity=".7"/>`; }
  if (fl > 0) s += `<rect x="-2000" y="-2000" width="6000" height="6000" fill="#C8D8FF" opacity="${op(fl * .5)}"/>`;
  return s;
}
// montanhas azuis em camadas (Blue Ridge)
function ridges(y0, lit = 1, t = 0) {
  const C = [['#3A4A6A', '#5A6A8A'], ['#2E3C56', '#4A5A78'], ['#22304A', '#3A4A66']];
  let s = '';
  C.forEach(([a, b], k) => { let d = `M-2000 ${y0 + 600}`; for (let x = -2000; x <= 3000; x += 80) d += ` L${x} ${f1(y0 + k * 110 - 120 * Math.abs(Math.sin(x / (420 - k * 60) + k)) - 40 * Math.sin(x / 130 + k * 2))}`; d += ` L3000 ${y0 + 600}Z`; s += `<path d="${d}" fill="${mix(a, b, lit)}"/>`; });
  return s;
}
function pine(x, y, h, col = '#24402E') { return `<path d="M${x} ${y - h} L${x - h * .3} ${y - h * .45} L${x - h * .18} ${y - h * .45} L${x - h * .38} ${y} L${x + h * .38} ${y} L${x + h * .18} ${y - h * .45} L${x + h * .3} ${y - h * .45}Z" fill="${col}" stroke="${OUTL}" stroke-width="4" stroke-linejoin="round"/><rect x="${x - 8}" y="${y}" width="16" height="${h * .1}" fill="#4A3020"/>`; }
function ground(y, col = '#4A6A34', col2 = '#3A5428') { return `<rect x="-2000" y="${y}" width="6000" height="2000" fill="${col}"/><rect x="-2000" y="${y}" width="6000" height="22" fill="${col2}"/>` + Array.from({ length: 60 }, (_, i) => `<path d="M${-1000 + i * 70} ${y + 40 + (i % 4) * 60} l6 -24 l6 24 l6 -18" stroke="${col2}" stroke-width="4" fill="none"/>`).join(''); }
const RAIN = (t, k = 1) => rain(t, k, 150);
// chapéu de guarda solto (para voar / museu)
function hatAlone(x, y, s, rot = 0, burn = 0) {
  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${s})"><ellipse cx="2" cy="0" rx="128" ry="20" fill="#7A5A30" stroke="${OUTL}" stroke-width="4"/><path d="M-62 -4 L-52 -70 Q-20 -92 0 -110 Q20 -92 52 -70 L62 -4Z" fill="#9A7440" stroke="${OUTL}" stroke-width="4" stroke-linejoin="round"/><path d="M-60 -16 L60 -16" stroke="#4A3018" stroke-width="12"/><path d="M0 -106 L0 -22 M-30 -82 L-22 -26 M30 -82 L22 -26" stroke="#6A4A24" stroke-width="3" opacity=".7"/>${burn ? `<path d="M-20 -70 q10 -14 22 -2 q8 14 -6 22 q-18 4 -16 -20Z" fill="#1A120C"/><path d="M40 -40 q10 -6 14 6 q-4 12 -14 4Z" fill="#1A120C"/><path d="M-90 -6 q12 -8 20 4 q-8 10 -20 -4Z" fill="#2A1A0C"/><ellipse cx="0" cy="-50" rx="60" ry="40" fill="#1A0E06" opacity=".3"/>` : ''}</g>`;
}
// caminhonete de guarda (lado, virada para a direita); o.roy desenha o Roy dirigindo
function truck(x, y, s, t, o = {}) {
  const wh = o.moving ? t * 600 : 0;
  let g = `<g transform="translate(${f1(x)},${f1(y)}) scale(${s})"><ellipse cx="0" cy="8" rx="340" ry="24" fill="#000" opacity=".35" filter="url(#b12)"/>`;
  const id = nid('cab');
  if (o.roy) { def(`<clipPath id="${id}"><rect x="-40" y="-420" width="220" height="300"/></clipPath>`); g += `<g clip-path="url(#${id})">` + ROY({ x: 60, y: 90, s: .38, armF: [70, -30], hat: o.hat, spiky: o.spiky, brow: o.brow, soot: o.soot, shadow: 0 }) + '</g>'; }
  g += `<path fill-rule="evenodd" d="M-320 -60 L-320 -190 L-40 -190 L-30 -300 L120 -300 L170 -200 L300 -180 L320 -110 L320 -60Z M-12 -280 L-14 -200 L150 -200 L112 -280Z" fill="#3E5E3E" stroke="${OUTL}" stroke-width="6" stroke-linejoin="round"/>`;
  g += `<path d="M-12 -280 L-14 -200 L150 -200 L112 -280Z" fill="#9ABCD0" opacity=".28" stroke="${OUTL}" stroke-width="4"/><path d="M10 -270 L40 -210" stroke="#fff" stroke-width="6" opacity=".35"/>`;
  g += `<path d="M-320 -150 L320 -150" stroke="#2E482E" stroke-width="5"/><rect x="-310" y="-200" width="270" height="14" fill="#2E482E"/><rect x="0" y="-180" width="120" height="70" fill="none" stroke="#2E482E" stroke-width="4"/><rect x="20" y="-140" width="80" height="24" rx="4" fill="#E8E2D0" stroke="${OUTL}" stroke-width="3"/><text x="60" y="-122" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="17" fill="#2E482E">RANGER</text><rect x="300" y="-170" width="22" height="24" rx="4" fill="#FFF2B0" stroke="${OUTL}" stroke-width="3"/><rect x="-330" y="-90" width="40" height="22" fill="#B8B8B8" stroke="${OUTL}" stroke-width="3"/><rect x="290" y="-90" width="40" height="22" fill="#B8B8B8" stroke="${OUTL}" stroke-width="3"/><path d="M-300 -180 L280 -170" stroke="#fff" stroke-width="5" opacity=".2"/>`;
  if (o.jug) g += `<g transform="translate(-190,-200)">${jug(0, 0, .8)}</g>`;
  [-190, 190].forEach(wx => g += `<g transform="translate(${wx},-50) rotate(${f1(wh)})"><circle r="66" fill="#1A1A1E" stroke="${OUTL}" stroke-width="5"/><circle r="32" fill="#8A8A90" stroke="${OUTL}" stroke-width="4"/><path d="M-32 0 L32 0 M0 -32 L0 32" stroke="#4A4A50" stroke-width="5"/></g>`);
  if (o.door) g += `<path d="M-14 -290 L${f1(-14 - 150 * o.door)} -280 L${f1(-14 - 150 * o.door)} -70 L-14 -60Z" fill="#355435" stroke="${OUTL}" stroke-width="5"/>`;
  return g + '</g>';
}
// galão de água
function jug(x, y, s, rot = 0) { return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${s})"><path d="M-50 0 L-50 -110 Q-50 -130 -30 -134 L-10 -150 L10 -150 L10 -134 L40 -134 Q50 -130 50 -110 L50 0Z" fill="#E8F0F4" stroke="${OUTL}" stroke-width="5" stroke-linejoin="round"/><rect x="-14" y="-170" width="28" height="22" rx="4" fill="#2A6AD8" stroke="${OUTL}" stroke-width="4"/><path d="M14 -128 Q46 -126 40 -96 Q34 -84 20 -96" stroke="${OUTL}" stroke-width="7" fill="none"/><rect x="-40" y="-90" width="80" height="54" fill="#2A6AD8" opacity=".85"/><text x="0" y="-55" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="24" fill="#fff">ÁGUA</text><rect x="-46" y="-30" width="92" height="26" fill="#8AC8F0" opacity=".45"/><path d="M-36 -120 L-36 -10" stroke="#fff" stroke-width="8" opacity=".6"/></g>`; }
// truta
function trout(x, y, s, rot = 0) { return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${s})"><path d="M-80 0 Q-20 -36 60 -6 L96 -30 L92 0 L96 30 L60 6 Q-20 36 -80 0Z" fill="#8A9A5A" stroke="${OUTL}" stroke-width="4"/><path d="M-60 4 Q0 14 60 2" stroke="#E87A8A" stroke-width="8" fill="none"/><circle cx="-56" cy="-4" r="5" fill="#1A120C"/>${[-30, -10, 10, 30, 45].map((q, i) => `<circle cx="${q}" cy="${-10 + (i % 2) * 6}" r="3" fill="#2A2A1A"/>`).join('')}</g>`; }
// urso (perfil, virado para a direita)
function bear(x, y, s, t, o = {}) {
  const ph = o.run ? t * 14 : t * 3, a = o.run ? 30 : 6;
  const leg = (lx, k, back) => { const ang = Math.sin(ph + k) * a; return `<g transform="translate(${lx},-140) rotate(${f1(ang)})"><rect x="-30" y="0" width="60" height="150" rx="26" fill="${back ? '#1A120C' : '#2A1E14'}" stroke="${OUTL}" stroke-width="5"/><ellipse cx="10" cy="146" rx="40" ry="18" fill="#1A120C" stroke="${OUTL}" stroke-width="4"/></g>`; };
  let g = `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(s * (o.flip || 1) * 100) / 100},${s})"><ellipse cx="0" cy="6" rx="240" ry="26" fill="#000" opacity=".35" filter="url(#b12)"/>`;
  g += leg(-120, Math.PI, 1) + leg(110, 0, 1);
  g += `<path d="M-200 -170 Q-220 -320 -80 -330 Q20 -360 120 -320 Q220 -300 220 -190 Q210 -110 120 -110 L-150 -110 Q-210 -120 -200 -170Z" fill="#2A1E14" stroke="${OUTL}" stroke-width="6"/><path d="M-120 -300 Q0 -340 110 -300" stroke="#5A4030" stroke-width="10" fill="none" opacity=".6"/>`;
  g += leg(-90, 0, 0) + leg(140, Math.PI, 0);
  const hy = -270 + (o.run ? Math.sin(ph * 2) * 8 : 0);
  g += `<g transform="translate(230,${f1(hy)})"><circle cx="-40" cy="-62" r="26" fill="#2A1E14" stroke="${OUTL}" stroke-width="5"/><circle cx="-40" cy="-62" r="12" fill="#5A4030"/><circle cx="0" cy="0" r="80" fill="#2A1E14" stroke="${OUTL}" stroke-width="6"/><ellipse cx="74" cy="20" rx="52" ry="36" fill="#7A5A3A" stroke="${OUTL}" stroke-width="5"/><ellipse cx="118" cy="8" rx="16" ry="12" fill="#0A0806"/><circle cx="20" cy="-20" r="9" fill="#F4E8C8"/><circle cx="22" cy="-19" r="5" fill="#0A0806"/>${o.fish ? trout(60, 70, .8, 80) : ''}${o.roar ? `<path d="M70 40 Q90 70 120 46" fill="#5A1E1A" stroke="${OUTL}" stroke-width="4"/>` : ''}</g>`;
  return g + '</g>';
}
// torre de vigia de incêndio
function tower(x, y, s, lit = 0) {
  let g = `<g transform="translate(${x},${y}) scale(${s})">`;
  g += `<path d="M-160 0 L-90 -800 M160 0 L90 -800 M-100 0 L-60 -800 M100 0 L60 -800" stroke="#5A4630" stroke-width="18"/>`;
  for (let k = 0; k < 4; k++) { const y0 = -k * 200, y1 = -(k + 1) * 200, w0 = 160 - k * 17.5, w1 = 160 - (k + 1) * 17.5; g += `<path d="M${-w0} ${y0} L${w1} ${y1} M${w0} ${y0} L${-w1} ${y1} M${-w1} ${y1} L${w1} ${y1}" stroke="#6A5438" stroke-width="9"/>`; }
  g += `<rect x="-120" y="-820" width="240" height="24" fill="#4A3828" stroke="${OUTL}" stroke-width="5"/><rect x="-110" y="-980" width="220" height="160" fill="#7A5A3A" stroke="${OUTL}" stroke-width="6"/><rect x="-96" y="-960" width="192" height="80" fill="${lit ? '#FFE6A0' : '#9ABCD0'}" stroke="${OUTL}" stroke-width="5"/><path d="M-32 -960 V-880 M32 -960 V-880" stroke="${OUTL}" stroke-width="5"/><path d="M-140 -980 L0 -1070 L140 -980Z" fill="#5A3A2A" stroke="${OUTL}" stroke-width="6"/><path d="M0 -1070 L0 -1120" stroke="#3A3A40" stroke-width="6"/>`;
  return g + '</g>';
}
/* ====================== CENAS ====================== */
// 1. gancho: o raio acerta o Roy, o chapéu voa; contador 7
function s1(t) {
  const { L, d, k } = loc(t, 'n1'), [hx, hy] = HH(t), H = hit(L, .35);
  const sh = H.shake * Math.sin(L * 80);
  setCam(540 + hx + sh, lerp(1080, 1020, k) + hy, lerp(1.25, 1.42, easeOut(k)), 0, [540, 1080, 1]);
  let s = lay(.2, stormSky(t, H.flash)) + lay(.4, ridges(1150, .4)) + lay(.7, [-200, 0, 180, 900, 1100, 1300].map((x, i) => pine(x, 1420, 300 + (i % 3) * 60, '#1A2E22')).join('')) + lay(1, ground(1500, '#34502A', '#26401E'));
  const after = H.after, hatUp = range(L, .4, 1.6), hatDown = range(L, 2.6, 3.3);
  const thumb = range(L, 2.0, 2.4);
  const roy = ROY({ x: 540, y: 1720, s: .95, hat: after && hatDown < 1 ? 0 : 1, spiky: after && hatDown < 1 ? 1 : 0, soot: after ? 1 : 0, eyes: after && L < 1.3 ? 0 : 1, mouth: after && L < 2 ? .5 : 0, armF: after ? [lerp(20, 165, thumb), lerp(20, -30, thumb)] : [10, 10], armB: after && L < 1.8 ? [40, 30] : [-6, 10], held: thumb > .5 ? `<g transform="translate(0,-10)"><rect x="-20" y="-24" width="44" height="40" rx="12" fill="#E2B08E" stroke="${OUTL}" stroke-width="4"/><rect x="-6" y="-70" width="20" height="50" rx="10" fill="#E2B08E" stroke="${OUTL}" stroke-width="4"/></g>` : '' });
  s += lay(1, zapWrap(roy, H.zap));
  const headY = 1720 - .95 * 1000;
  if (after && hatDown < 1) s += lay(1, smoke(560, headY - 40, t, 6, 1.2, 1.4));
  // chapéu voando e voltando
  if (after && hatDown < 1) { const hu = easeOut(hatUp); s += lay(1, hatAlone(540 + 60 * hu, headY - 80 - 600 * hu + 600 * hatDown * hatDown * (hatDown > 0 ? 1 : 0), .95, hu * 380)); }
  s += lay(1, bolt(760, -200, 545, headY - 80, 3, H.bolt));
  s += RAIN(t, .9);
  if (L > .55) s += raioBox(7, 1 + .3 * bump(range(L, .55, .85)), '', 1);
  return s + VIG(.9) + FLASH(H.flash);
}
// 2. guarda-florestal; 1942 torre de vigia; unha do dedão
function s2(t) {
  const { L, d } = loc(t, 'n2'), [hx, hy] = HH(t, .6);
  let s = '';
  if (L < 3.2) {   // dia: o Roy no parque, acenando ao lado da placa
    const k = L / 3.2;
    setCam(lerp(380, 560, k) + hx, 1100 + hy, lerp(.95, 1.05, k), 0, [540, 1100, 1]);
    s += lay(.2, `<rect x="-2000" y="-2000" width="6000" height="6000" fill="#8AB8E0"/><circle cx="880" cy="420" r="90" fill="#FFF2C0"/>` + [0, 1, 2].map(i => `<ellipse cx="${f1(200 + i * 400 + t * 20)}" cy="${300 + i * 60}" rx="160" ry="50" fill="#F4F8FC"/>`).join('')) + lay(.4, ridges(1180, 1)) + lay(.7, [-300, -120, 60, 880, 1060, 1240].map((x, i) => pine(x, 1440, 360 + (i % 3) * 70, '#2E5A3A')).join(''));
    s += lay(1, ground(1500, '#5A8A3C', '#46702E') + `<rect x="140" y="1100" width="20" height="400" fill="#5A3E28" stroke="${OUTL}" stroke-width="4"/><rect x="40" y="1080" width="220" height="130" rx="10" fill="#6A4A30" stroke="${OUTL}" stroke-width="6"/><text x="150" y="1132" text-anchor="middle" font-family="'DejaVu Serif',serif" font-weight="700" font-size="26" fill="#F2E2B8">PARQUE</text><text x="150" y="1168" text-anchor="middle" font-family="'DejaVu Serif',serif" font-weight="700" font-size="26" fill="#F2E2B8">NACIONAL</text><text x="150" y="1196" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-size="17" fill="#F2E2B8">SHENANDOAH</text>`);
    const walk = range(L, 0, 1.6), wave = L > 1.7 ? Math.sin(L * 9) : 0;
    s += lay(1, ROY({ x: lerp(300, 560, easeOut(walk)), y: 1500, s: .62, ...walkPose(L * 6, walk < 1 ? .7 : 0), armF: L > 1.7 ? [160, -20 + 25 * wave] : walkPose(L * 6, walk < 1 ? .7 : 0).armF }));
    s += raioBox(0, 1);
    return s + VIG(.7);
  }
  if (L < 6.6) {   // 1942: torre de vigia na tempestade
    const L2 = L - 3.2, H = hit(L2, 1.9), sh = H.shake * Math.sin(L * 70);
    setCam(540 + hx + sh, lerp(1050, 720, easeInOut(range(L2, 0, 3.4))) + hy, lerp(.62, 1.35, easeInOut(range(L2, 0, 3.4))), 0, [540, 1000, 1]);
    s += lay(.2, stormSky(t, H.flash)) + lay(.45, ridges(1250, .3)) + lay(1, `<path d="M-2000 1500 Q540 1240 3000 1500 L3000 4000 L-2000 4000Z" fill="#26402A"/>` + [-200, 0, 1000, 1200].map((x, i) => pine(x, 1480, 280, '#1A2E20')).join('') + tower(540, 1390, .8, 1));
    // o Roy dentro da cabine (silhueta na janela)
    def(`<clipPath id="twc"><rect x="${540 - .8 * 96}" y="${1390 - .8 * 960}" width="${.8 * 192}" height="${.8 * 80}"/></clipPath>`);
    s += lay(1, `<g clip-path="url(#twc)">${zapWrap(ROY({ x: 530, y: 1390 - .8 * 820, s: .13, flip: 1, shadow: 0 }), H.zap)}</g>`);
    s += lay(1, bolt(700, -400, 540, 1390 - .8 * 1120, 7, H.bolt));
    if (H.after) s += lay(1, smoke(560, 1390 - .8 * 1100, t, 6, 1, 1.2));
    s += RAIN(t, .8) + raioBox(H.u > .2 ? 1 : 0, 1 + .3 * bump(range(H.u, .2, .5)), '1942');
    return s + VIG(.9) + FLASH(H.flash);
  }
  // close na bota: buraco fumegante e a unha voando
  const L3 = L - 6.6, k = L3 / (d - 6.6);
  setCam(560 + hx, 1150 + hy, lerp(1.12, 1.25, k), 0, [540, 1080, 1]);
  s += `<rect width="1080" height="1920" fill="#3A2E24"/><rect width="1080" height="1920" fill="url(#woodP)" opacity=".5"/>`;
  const nail = range(L3, .3, 1.6), nx = 640 + nail * 260, ny = 1000 - 360 * Math.sin(nail * Math.PI) + nail * 200;
  s += lay(1, `<g transform="translate(540,1150)"><ellipse cx="0" cy="190" rx="420" ry="40" fill="#000" opacity=".4" filter="url(#b12)"/><path d="M-360 -260 L-160 -260 L-150 -40 Q60 -40 260 20 Q380 60 380 150 L380 190 L-380 190 L-380 -260Z" fill="#3A2416" stroke="${OUTL}" stroke-width="8" stroke-linejoin="round"/><path d="M-380 150 L380 150" stroke="#1A120C" stroke-width="16"/><path d="M-300 -200 L-200 -200 M-300 -140 L-200 -140 M-300 -80 L-200 -80" stroke="#C8A060" stroke-width="7"/><path d="M-120 -30 Q60 -24 230 30" stroke="#fff" stroke-width="8" opacity=".15" fill="none"/>
    <ellipse cx="250" cy="70" rx="90" ry="62" fill="#1A0E08" stroke="#5A3A1A" stroke-width="6"/><ellipse cx="250" cy="78" rx="66" ry="44" fill="#E2B08E" stroke="${OUTL}" stroke-width="5"/><ellipse cx="270" cy="70" rx="26" ry="20" fill="#F0A090" stroke="${OUTL}" stroke-width="3" opacity="${op(1 - range(L3, .3, .4) * 0)}"/>${range(L3, .3, .4) > 0 ? '' : `<ellipse cx="270" cy="70" rx="26" ry="20" fill="#F4E8DC" stroke="${OUTL}" stroke-width="3"/>`}</g>`);
  s += lay(1, smoke(790, 1200, t, 6, 1, 1.2));
  if (nail > 0 && nail < 1) s += lay(1, `<ellipse cx="${f1(nx)}" cy="${f1(ny)}" rx="26" ry="20" transform="rotate(${f1(nail * 900)} ${f1(nx)} ${f1(ny)})" fill="#F4E8DC" stroke="${OUTL}" stroke-width="4"/>`);
  s += raioBox(1, 1, '1942');
  return s + VIG(.9);
}
// 3. 1969: dirigindo na serra; sobrancelhas queimadas
function s3(t) {
  const { L, d } = loc(t, 'n3'), [hx, hy] = HH(t, .6), H = hit(L, 3.5);
  let s = '';
  const yr = L < 1.6 ? String(Math.round(lerp(1942, 1969, easeInOut(range(L, .1, 1.5))))) : '1969';
  if (L < 4.6) {
    const tx = lerp(-200, 900, L / 4.6), sh = H.shake * Math.sin(L * 70);
    setCam(tx + 120 + hx + sh, 1260 + hy, 1.0, 0, [tx + 120, 1200, 1]);
    s += lay(.15, stormSky(t, H.flash)) + lay(.35, ridges(1150, .35)) + lay(.6, Array.from({ length: 14 }, (_, i) => pine(-600 + i * 220, 1380, 240 + (i % 3) * 50, '#1A2E22')).join(''));
    s += lay(1, `<rect x="-3000" y="1400" width="8000" height="2000" fill="#26402A"/><rect x="-3000" y="1440" width="8000" height="90" fill="#3A3A40"/><path d="M-3000 1485 H5000" stroke="#E8C040" stroke-width="6" stroke-dasharray="60 50"/>`);
    s += lay(1, zapWrap(truck(tx, 1500, 1.0, t, { moving: L < 4.0, roy: 1, brow: 1 }), H.zap));
    s += lay(1, bolt(tx + 200, -300, tx + 40, 1500 - 300, 11, H.bolt));
    if (H.after) s += lay(1, smoke(tx + 40, 1500 - 300, t, 5, 1, 1));
    s += RAIN(t, .8) + raioBox(H.u > .2 ? 2 : 1, 1 + .3 * bump(range(H.u, .2, .5)), yr);
    return s + VIG(.9) + FLASH(H.flash);
  }
  // close no rosto dentro da cabine: as sobrancelhas viram fumaça
  const L2 = L - 4.6, k = L2 / (d - 4.6), burn = range(L2, .4, .7);
  setCam(540 + hx, 1000 + hy, lerp(1, 1.1, k), 0, [540, 1000, 1]);
  s += `<rect width="1080" height="1920" fill="#2A3A2E"/>` + lay(1, `<rect x="-200" y="200" width="1480" height="1400" fill="#5A6A7A"/>` + RAIN(t, .6));
  s += lay(1, ROY({ x: 440, y: 2973, s: 2.3, brow: burn > .5 ? 0 : 1, soot: burn, eyes: L2 > .9 && L2 < 1.1 ? 0 : 1, mouth: burn > .5 ? .4 : 0, armF: [20, 10], shadow: 0 }));
  if (burn > 0) s += lay(1, smoke(440 + 2.3 * 38, 2973 - 2.3 * 940, t, 7, 1.3 - burn * .5, 1.4));
  s += `<path fill-rule="evenodd" d="M0 0 H1080 V1920 H0Z M120 360 L960 360 L1000 1500 L80 1500Z" fill="#2E482E" stroke="${OUTL}" stroke-width="10"/><path d="M120 360 L960 360 L1000 1500 L80 1500Z" fill="#9ABCD0" opacity=".12"/>`;
  s += raioBox(2, 1, '1969');
  return s + VIG(.9);
}
// casinha (quintal)
function house(x, y, s) { return `<g transform="translate(${x},${y}) scale(${s})"><rect x="-300" y="-420" width="600" height="420" fill="#D8CBB0" stroke="${OUTL}" stroke-width="6"/>${Array.from({ length: 10 }, (_, i) => `<path d="M-300 ${-400 + i * 40} H300" stroke="#B8A888" stroke-width="3"/>`).join('')}<path d="M-350 -420 L0 -640 L350 -420Z" fill="#6A3A2A" stroke="${OUTL}" stroke-width="6"/><rect x="-220" y="-330" width="130" height="120" fill="#FFE2A0" stroke="${OUTL}" stroke-width="5"/><path d="M-155 -330 V-210 M-220 -270 H-90" stroke="${OUTL}" stroke-width="4"/><rect x="60" y="-260" width="110" height="260" fill="#6A4A30" stroke="${OUTL}" stroke-width="5"/><circle cx="150" cy="-130" r="8" fill="#C8A040"/><rect x="-340" y="-30" width="680" height="30" fill="#8A6A4A" stroke="${OUTL}" stroke-width="4"/></g>`; }
// 4. 1970: quintal; ombro queimado
function s4(t) {
  const { L, d, k } = loc(t, 'n4'), [hx, hy] = HH(t, .6), H = hit(L, 1.4), sh = H.shake * Math.sin(L * 70);
  setCam(lerp(500, 560, k) + hx + sh, lerp(1180, 1120, k) + hy, lerp(.95, 1.15, k), 0, [540, 1100, 1]);
  let s = lay(.2, stormSky(t, H.flash)) + lay(.4, ridges(1200, .35));
  s += lay(.8, house(250, 1470, .9) + `<path d="M620 1180 L1000 1210" stroke="#E8E2D0" stroke-width="3"/><rect x="${f1(680 + 4 * Math.sin(t * 4))}" y="1186" width="70" height="90" fill="#C83A3A" stroke="${OUTL}" stroke-width="3"/><rect x="${f1(800 + 6 * Math.sin(t * 4 + 1))}" y="1194" width="80" height="70" fill="#3A6AC8" stroke="${OUTL}" stroke-width="3"/><path d="M620 1170 V1470 M1000 1200 V1470" stroke="#5A4030" stroke-width="10"/>`);
  s += lay(1, ground(1480, '#4A6A34', '#3A5428') + Array.from({ length: 12 }, (_, i) => `<path d="M${-100 + i * 110} 1480 V1400 M${-140 + i * 110} 1430 H${-60 + i * 110}" stroke="#E8E2D0" stroke-width="8"/>`).join(''));
  const after = H.after, hold = range(L, 1.8, 2.2);
  const roy = ROY({ x: 560, y: 1560, s: .72, armF: after ? [lerp(10, 120, hold), lerp(10, -150, hold)] : [30, 20], armB: after ? [-30, 20] : [-6, 10], held: !after ? `<g transform="translate(0,-10)"><path d="M-20 -40 L60 -40 L70 60 L-30 60Z" fill="#8A9AA8" stroke="${OUTL}" stroke-width="4"/><path d="M60 -20 L140 -60" stroke="#8A9AA8" stroke-width="12"/></g>` : '', eyes: after && L < 2 ? 0 : 1, mouth: after ? .6 : 0, soot: after ? .6 : 0, lean: after ? -6 : 0 });
  s += lay(1, zapWrap(roy, H.zap));
  const shX = 560 + .72 * 10, shY = 1560 - .72 * 790;
  s += lay(1, bolt(700, -300, shX + 10, shY, 21, H.bolt));
  if (after) s += lay(1, smoke(shX - 10, shY - 10, t, 6, 1, 1.1) + `<circle cx="${shX}" cy="${shY}" r="${f1(30 + 6 * Math.sin(t * 10))}" fill="#FF6A2A" opacity=".35" filter="url(#b12)"/>`);
  s += RAIN(t, .7) + raioBox(H.u > .2 ? 3 : 2, 1 + .3 * bump(range(H.u, .2, .5)), '1970');
  return s + VIG(.9) + FLASH(H.flash);
}
// 5. 1972: posto dos guardas; cabelo pega fogo; galão no carro
function s5(t) {
  const { L, d } = loc(t, 'n5'), [hx, hy] = HH(t, .6);
  let s = '';
  if (L < 4.4) {
    const H = hit(L, 1.9), sh = H.shake * Math.sin(L * 70), k = L / 4.4;
    setCam(lerp(520, 600, k) + hx + sh, lerp(1100, 1000, k) + hy, lerp(.95, 1.18, k), 0, [540, 1100, 1]);
    s += lay(1, `<rect x="-600" y="-200" width="2400" height="2400" fill="#6A4A30"/><rect x="-600" y="-200" width="2400" height="2400" fill="url(#woodP)" opacity=".6"/>`);
    // janela com tempestade
    s += lay(1, `<g><rect x="620" y="420" width="380" height="460" fill="#141A2A" stroke="${OUTL}" stroke-width="10"/>${bolt(820, 380, 760, 900, 31, Math.sin(t * 3) > .97 ? 1 : 0)}<rect x="620" y="420" width="380" height="460" fill="#C8D8FF" opacity="${op(H.flash * .6)}"/><path d="M810 420 V880 M620 650 H1000" stroke="${OUTL}" stroke-width="10"/></g>` + `<rect x="80" y="440" width="300" height="220" fill="#E8DCC0" stroke="${OUTL}" stroke-width="6"/><path d="M110 500 q60 -30 120 10 t120 0 M110 560 q80 30 160 -10 M140 610 h160" stroke="#3A6A3A" stroke-width="6" fill="none"/><text x="230" y="480" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="24" fill="#5A3A20">MAPA DO PARQUE</text>`);
    s += lay(1, `<rect x="-300" y="1500" width="2000" height="600" fill="#4A3220"/><rect x="100" y="1180" width="760" height="40" fill="#7A5434" stroke="${OUTL}" stroke-width="6"/><rect x="140" y="1220" width="30" height="280" fill="#5A3E28"/><rect x="790" y="1220" width="30" height="280" fill="#5A3E28"/><rect x="560" y="1060" width="200" height="120" rx="10" fill="#4A4A50" stroke="${OUTL}" stroke-width="5"/><circle cx="610" cy="1120" r="30" fill="#2A2A30" stroke="#8A8A90" stroke-width="4"/><rect x="660" y="1090" width="80" height="20" fill="#8AE08A" opacity=".8"/><path d="M740 1060 L780 900" stroke="#3A3A40" stroke-width="6"/>` + hatAlone(330, 1170, .7, 0));
    const after = H.after, fire = after ? 1 - range(L, 3.4, 4.1) : 0, pat = after && fire > 0 ? Math.sin(L * 16) : 0;
    const roy = ROY({ x: 420, y: 1500, s: .7, hat: 0, spiky: after ? 1 : 0, soot: after ? 1 : 0, mouth: after ? .8 : 0, armF: after ? [150 + 15 * pat, 40] : [80, -20], armB: after ? [140 - 15 * pat, 60] : [-6, 10], held: after ? `<g transform="rotate(-30)"><rect x="-70" y="-20" width="140" height="50" rx="10" fill="#6A7A9A" stroke="${OUTL}" stroke-width="4"/></g>` : '' });
    s += lay(1, zapWrap(roy, H.zap));
    const hy2 = 1500 - .7 * 990;
    s += lay(1, bolt(1000, 500, 440, hy2, 27, H.bolt) + flames(440, hy2 + 40, t, .9, fire) + (after ? smoke(440, hy2, t, 6, 1 - fire * .5, 1.2) : ''));
    s += raioBox(H.u > .2 ? 4 : 3, 1 + .3 * bump(range(H.u, .2, .5)), '1972');
    return s + VIG(.9) + FLASH(H.flash);
  }
  // o galão de água vai para o banco do carro
  const L2 = L - 4.4, k = L2 / (d - 4.4);
  setCam(lerp(420, 380, k) + hx, lerp(1150, 1240, k) + hy, lerp(.9, 1.35, easeInOut(k)), 0, [540, 1100, 1]);
  s += lay(.3, `<rect x="-2000" y="-2000" width="6000" height="6000" fill="#6A7A8A"/>`) + lay(.5, ridges(1200, .6)) + lay(1, ground(1500, '#4A6A34', '#3A5428'));
  const put = easeInOut(range(L2, .3, 1.8));
  s += lay(1, truck(380, 1500, .95, t, { door: 1 }));
  const jx = lerp(980, 210, put), jy = lerp(1200, 1310, put) - Math.sin(put * Math.PI) * 120;
  s += lay(1, ROY({ x: lerp(1100, 330, put), y: 1500, s: .66, ...walkPose(L2 * 6, put < 1 ? .6 : 0), armF: [80, -10], armB: [70, 0] }));
  s += lay(1, jug(jx, jy, .9));
  if (put >= 1) s += lay(1, `<circle cx="210" cy="1230" r="${f1(110 + 10 * Math.sin(t * 6))}" fill="none" stroke="#FFE04A" stroke-width="8" opacity="${op(.5 + .4 * Math.sin(t * 6))}"/>`);
  s += raioBox(4, 1, '1972');
  return s + VIG(.8);
}
// 6. 1973: a nuvem segue o carro; ele desce; cabelo em chamas; o galão salva
function s6(t) {
  const { L, d } = loc(t, 'n6'), [hx, hy] = HH(t, .6), H = hit(L, 3.9), sh = H.shake * Math.sin(L * 70);
  const drive = easeOut(range(L, 0, 2.8)), tx = lerp(-300, 560, drive);
  const cx = tx + 30 + 20 * Math.sin(t * 1.5);
  const k = L / d;
  setCam(lerp(tx + 100, 560, range(L, 2.4, 3.4)) + hx + sh, lerp(1060, 1120, range(L, 3, 4)) + hy, lerp(.62, .92, easeInOut(range(L, 2.4, 4.2))), 0, [540, 1100, 1]);
  let s = lay(.15, `<rect x="-3000" y="-2000" width="8000" height="6000" fill="#8AB8E0"/><circle cx="900" cy="300" r="80" fill="#FFF2C0"/>`) + lay(.4, ridges(1180, 1)) + lay(.7, Array.from({ length: 12 }, (_, i) => pine(-900 + i * 260, 1400, 260 + (i % 3) * 50, '#2E5A3A')).join(''));
  s += lay(1, `<rect x="-3000" y="1400" width="8000" height="2000" fill="#5A8A3C"/><rect x="-3000" y="1440" width="8000" height="90" fill="#4A4A50"/><path d="M-3000 1485 H5000" stroke="#E8C040" stroke-width="6" stroke-dasharray="60 50"/>`);
  // a nuvem particular dele
  let cl = ''; [[-220, 30, 200, 90], [0, -20, 240, 120], [220, 30, 200, 90], [60, 50, 320, 80]].forEach(([dx, dy, rx, ry]) => cl += `<ellipse cx="${dx}" cy="${dy + 30}" rx="${rx}" ry="${ry}" fill="#0A0C14" opacity=".5"/><ellipse cx="${dx}" cy="${dy}" rx="${rx}" ry="${ry}" fill="#2A3040"/><ellipse cx="${dx + 30}" cy="${dy - 30}" rx="${rx * .5}" ry="${ry * .4}" fill="#4A5266"/>`);
  s += lay(1, `<g transform="translate(${f1(cx)},560)">${cl}</g>` + Array.from({ length: 30 }, (_, i) => { const x = cx - 300 + (i * 37) % 600, y = 640 + ((i * 113 + t * 1500) % 860); return `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x - 8)}" y2="${f1(y + 50)}" stroke="#9AB0D0" stroke-width="3" opacity=".5"/>`; }).join(''));
  const out = range(L, 2.8, 3.6), after = H.after, fire = after ? 1 - range(L, 5.2, 6.2) : 0, pour = range(L, 4.9, 5.4) - range(L, 6.4, 6.8);
  s += lay(1, truck(tx, 1500, .8, t, { moving: L < 2.8, roy: out < .3, door: out > 0 && out < 1 ? bump(out) : 0, jug: !after }));
  if (out > .3) {
    const rx = tx + 160 + 120 * easeOut(out);
    const roy = ROY({ x: rx, y: 1540, s: .62, hat: after ? 0 : 1, spiky: after ? 1 : 0, soot: after ? 1 : 0, mouth: after ? .7 : 0, ...walkPose(L * 6, out < 1 ? .6 : 0), armF: pour > 0 ? [170, -10] : after ? [60, 20] : [10, 10], armB: pour > 0 ? [160, -20] : [-6, 10], held: pour > 0 ? `<g transform="translate(-20,-60)">${jug(0, 0, 1, 150)}</g>` : '' });
    s += lay(1, zapWrap(roy, H.zap));
    const hy2 = 1540 - .62 * 1000;
    if (after) s += lay(1, flames(rx + 10, hy2 + 40, t, .8, fire) + smoke(rx, hy2, t, 6, 1, 1.1));
    if (pour > 0) s += lay(1, Array.from({ length: 12 }, (_, i) => { const p = (t * 3 + i / 12) % 1; return `<circle cx="${f1(rx + 20 + Math.sin(i) * 20)}" cy="${f1(hy2 - 120 + p * 200)}" r="${f1(8 + (i % 3) * 3)}" fill="#8AC8F0" opacity=".8"/>`; }).join('') + `<circle cx="${rx}" cy="${hy2 - 20}" r="70" fill="#E8F0F4" opacity=".35" filter="url(#b12)"/>`);
    s += lay(1, bolt(cx, 620, rx + 10, hy2 - 40, 41, H.bolt));
  }
  s += raioBox(H.u > .2 ? 5 : 4, 1 + .3 * bump(range(H.u, .2, .5)), '1973');
  return s + VIG(.85) + FLASH(H.flash);
}
// 7. 1976: correndo da nuvem; tornozelo
function s7(t) {
  const { L, d } = loc(t, 'n7'), [hx, hy] = HH(t, 1), H = hit(L, 2.9), sh = H.shake * Math.sin(L * 70);
  const run = Math.min(L, 2.9), rx = 200 + run * 340, fall = range(L, 2.95, 3.4);
  setCam(rx + 80 + hx + sh, 1150 + hy, lerp(.8, 1.0, range(L, 2.9, 4)), lerp(-2, 0, range(L, 2.9, 3.5)), [540, 1100, 1]);
  let s = lay(.15, stormSky(t, H.flash, '#1A2238', '#5A6680')) + lay(.35, ridges(1180, .5)) + lay(.7, Array.from({ length: 16 }, (_, i) => pine(-600 + i * 260, 1420, 220 + (i % 3) * 50, '#24402E')).join(''));
  s += lay(1, ground(1480, '#5A7A3C', '#46602E') + Array.from({ length: 40 }, (_, i) => `<circle cx="${-400 + i * 90}" cy="${1520 + (i % 3) * 30}" r="8" fill="${['#F2E04A', '#F4F0F0', '#C88AE0'][i % 3]}"/>`).join(''));
  const cxl = rx - 120 + 40 * Math.sin(t * 2);
  let cl = ''; [[-220, 30, 200, 90], [0, -20, 260, 130], [220, 30, 200, 90]].forEach(([dx, dy, rxx, ry]) => cl += `<ellipse cx="${dx}" cy="${dy}" rx="${rxx}" ry="${ry}" fill="#1A2030"/><ellipse cx="${dx + 30}" cy="${dy - 30}" rx="${rxx * .5}" ry="${ry * .4}" fill="#3A4256"/>`);
  s += lay(1, `<g transform="translate(${f1(cxl)},560)">${cl}<circle cx="-60" cy="0" r="12" fill="#FFE04A"/><circle cx="60" cy="0" r="12" fill="#FFE04A"/></g>`);
  const after = H.after;
  const roy = after ? ROY({ x: rx, y: 1500, s: .62, hat: 0, spiky: 1, soot: 1, drop: 230 * fall, lean: -20 * fall, legF: [90 * fall, -10], legB: [70 * fall, -100 * fall], armF: [110 * fall, 30], armB: [90 * fall, 40], mouth: .6, eyes: L > 3.6 ? 1 : 0 }) : ROY({ x: rx, y: 1500, s: .62, ...walkPose(L * 11, 1.2), lean: 10, look: Math.sin(L * 2) > .6 ? -1 : 0, mouth: .5 });
  s += lay(1, zapWrap(roy, H.zap));
  if (!after && L < 2.9) s += lay(1, hatAlone(rx - 200 - run * 60, 1480 - 30 * Math.abs(Math.sin(L * 5)), .55, L * 200));
  if (after) { const ax = rx + .62 * 200 * fall, ay = 1500 - 40; s += lay(1, smoke(ax, ay, t, 5, 1, 1) + [0, 1, 2].map(i => `<circle cx="${f1(ax)}" cy="${ay}" r="${f1(30 + ((t * 60 + i * 30) % 90))}" fill="none" stroke="#FF4A3A" stroke-width="6" opacity="${op(1 - ((t * 60 + i * 30) % 90) / 90)}"/>`).join('')); }
  s += lay(1, bolt(cxl, 620, rx + 60, 1490, 51, H.bolt));
  s += RAIN(t, .6) + raioBox(H.u > .2 ? 6 : 5, 1 + .3 * bump(range(H.u, .2, .5)), '1976');
  return s + VIG(.9) + FLASH(H.flash);
}
// 8. 1977: pescando, sétimo raio; o urso e as trutas
function s8(t) {
  const { L, d } = loc(t, 'n8'), [hx, hy] = HH(t, .6);
  let s = '';
  if (L < 2.7) {
    const H = hit(L, 1.2), sh = H.shake * Math.sin(L * 70);
    setCam(560 + hx + sh, lerp(1150, 1100, L / 2.7) + hy, lerp(.85, 1.0, L / 2.7), 0, [540, 1100, 1]);
    s += lay(.15, stormSky(t, H.flash)) + lay(.35, ridges(1150, .4)) + lay(.7, Array.from({ length: 12 }, (_, i) => pine(-500 + i * 200, 1380, 240 + (i % 3) * 60, '#1A2E22')).join(''));
    s += lay(1, ground(1400, '#3A5A2E', '#2A4420') + `<path d="M-2000 1560 Q540 1520 3000 1580 L3000 2400 L-2000 2400Z" fill="#3A5A7A"/><rect x="-2000" y="1560" width="6000" height="900" fill="url(#waveP)" opacity=".5"/>` + [[120, 1540], [900, 1550]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="90" ry="40" fill="#7A7A80" stroke="${OUTL}" stroke-width="5"/>`).join(''));
    const after = H.after;
    const roy = ROY({ x: 420, y: 1530, s: .62, hat: after ? 0 : 1, spiky: after ? 1 : 0, soot: after ? 1 : 0, mouth: after ? .6 : 0, eyes: after && L < 1.8 ? 0 : 1, armF: [110, -30], armB: [90, -10], held: `<path d="M0 0 L520 -520" stroke="#5A3A20" stroke-width="12" stroke-linecap="round"/>` });
    s += lay(1, zapWrap(roy, H.zap));
    const tipX = 420 + .62 * (60 + 520), tipY = 1530 - .62 * (720 + 520);
    s += lay(1, `<path d="M${f1(tipX)} ${f1(tipY)} Q${f1(tipX + 60)} ${f1(tipY + 300)} ${f1(tipX + 30)} 1600" stroke="#E8E8E8" stroke-width="2" fill="none"/>` + [0, 1, 2].map(i => trout(330 + i * 40, 1520 + i * 10, .45, 90)).join(''));
    s += lay(1, bolt(800, -300, 430, 1530 - .62 * 1060, 61, H.bolt));
    if (after) s += lay(1, smoke(440, 1530 - .62 * 1000, t, 6, 1, 1.1));
    s += RAIN(t, .8) + raioBox(H.u > .2 ? 7 : 6, 1 + .4 * bump(range(H.u, .2, .55)), '1977', H.u > .2);
    return s + VIG(.9) + FLASH(H.flash);
  }
  // volta ao carro: urso roubando as trutas; espanta com um galho
  const L2 = L - 2.7, k = L2 / (d - 2.7);
  const walk = range(L2, 0, 1.8), swing = range(L2, 3.7, 4.3), flee = range(L2, 4.1, d - 2.7);
  setCam(lerp(420, 640, easeInOut(k)) + hx, 1230 + hy, lerp(.92, 1.0, k), 0, [540, 1100, 1]);
  s += lay(.15, stormSky(t, 0, '#2A3248', '#6A7488')) + lay(.35, ridges(1150, .5)) + lay(.7, Array.from({ length: 12 }, (_, i) => pine(-500 + i * 220, 1380, 240 + (i % 3) * 60, '#1A2E22')).join(''));
  s += lay(1, ground(1420, '#3A5A2E', '#2A4420'));
  s += lay(1, truck(760, 1500, .78, t, {}));
  const bx = 900 + flee * 1400;
  s += lay(1, bear(bx, 1500, .72, t, { run: flee > 0, fish: flee < .6, roar: swing > 0 && flee < .2, flip: 1 }));
  const rx = lerp(-200, 480, easeOut(walk));
  const roy = ROY({ x: rx, y: 1520, s: .62, hat: 0, spiky: 1, soot: 1, ...walkPose(L2 * 6, walk < 1 ? .6 : 0), look: 0, eyes: 1, mouth: L2 > 1.9 && L2 < 3.7 ? .8 : 0, armF: swing > 0 ? [lerp(170, 60, easeOut(swing)), -20] : L2 > 1.9 ? [150, -40] : walkPose(L2 * 6, .6).armF, held: L2 > 1.9 ? `<path d="M0 0 L0 -320 M0 -200 L50 -260 M0 -120 L-40 -170" stroke="#6A4428" stroke-width="16" stroke-linecap="round"/>` : '' });
  s += lay(1, roy + smoke(rx + 10, 1520 - .62 * 1000, t, 4, .6, 1));
  if (L2 > 1.9 && L2 < 3.7) s += lay(1, `<text x="${rx + 40}" y="${1520 - .62 * 1150}" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="90" fill="#FFE04A" stroke="${OUTL}" stroke-width="6">!</text>`);
  if (flee > .1) s += lay(1, [0, 1, 2].map(i => trout(900 + i * 60, 1490, .5, 10 + i * 20)).join(''));
  s += raioBox(7, 1, '1977', 1);
  return s + VIG(.85);
}
// 9. ninguém fica perto dele na chuva; chapéus no museu; volta ao começo
function s9(t) {
  const { L, d } = loc(t, 'n9'), [hx, hy] = HH(t, .6);
  let s = '';
  if (L < 3.6) {
    const k = L / 3.6;
    setCam(lerp(600, 760, k) + hx, 1230 + hy, lerp(1.12, 1.2, k), 0, [540, 1100, 1]);
    s += lay(.2, stormSky(t, 0, '#2A3248', '#6A7488')) + lay(.5, `<rect x="-1000" y="700" width="3000" height="800" fill="#4A4E5A"/>` + Array.from({ length: 8 }, (_, i) => `<rect x="${-600 + i * 330}" y="${500 + (i % 3) * 80}" width="260" height="${900 - (i % 3) * 80}" fill="${['#5A5E6A', '#6A6E7A', '#545864'][i % 3]}"/>` + Array.from({ length: 6 }, (_, j) => `<rect x="${-570 + i * 330 + (j % 2) * 110}" y="${560 + (i % 3) * 80 + Math.floor(j / 2) * 140}" width="70" height="90" fill="#FFE2A0" opacity=".7"/>`).join('')).join(''));
    s += lay(1, `<rect x="-2000" y="1500" width="6000" height="900" fill="#5A5A60"/><rect x="-2000" y="1500" width="6000" height="24" fill="#7A7A80"/><rect x="380" y="1000" width="700" height="30" fill="#3A4A5A" stroke="${OUTL}" stroke-width="5"/><rect x="400" y="1030" width="16" height="470" fill="#3A4A5A"/><rect x="1040" y="1030" width="16" height="470" fill="#3A4A5A"/><rect x="460" y="1340" width="540" height="24" fill="#6A4A30" stroke="${OUTL}" stroke-width="4"/><rect x="430" y="1060" width="120" height="70" rx="8" fill="#2A6AD8" stroke="${OUTL}" stroke-width="4"/><text x="490" y="1108" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="24" fill="#fff">ÔNIBUS</text>`);
    const arrive = easeOut(range(L, 0, 1.2)), scat = range(L, 1.4, 3.4);
    const P = [['civil', 560, '#C83A3A'], ['idosa', 720, '#3A6AC8'], ['civil2', 880, '#E8C040'], ['turista', 1040, '#2A2A30']];
    P.forEach(([kd, x, uc], i) => { const go = easeIn(range(scat, i * .08, .7 + i * .08)), px = x + go * 900, look = scat > 0 && go < .05 ? -1 : 0; s += lay(1, man({ x: px, y: 1500, s: .5, kind: kd, flip: 1, look, ...walkPose(L * 9 + i, go > 0 && go < 1 ? 1 : 0), armF: [120, -100], held: `<g><path d="M0 0 L0 -380" stroke="#2A2A30" stroke-width="10"/><path transform="scale(.62,1)" d="M-260 -360 Q0 -560 260 -360 Q200 -390 130 -360 Q65 -390 0 -360 Q-65 -390 -130 -360 Q-200 -390 -260 -360Z" fill="${uc}" stroke="${OUTL}" stroke-width="6"/></g>`, mouth: go > 0 ? .5 : 0 })); });
    const rx = lerp(-200, 520, arrive);
    s += lay(1, ROY({ x: rx, y: 1500, s: .55, ...walkPose(L * 6, arrive < 1 ? .6 : 0), eyes: 1, mouth: 0 }) + `<g transform="translate(${f1(rx)},${f1(1500 - .55 * 1400)})"><ellipse cx="0" cy="0" rx="120" ry="50" fill="#1A2030"/><ellipse cx="-60" cy="10" rx="70" ry="40" fill="#2A3040"/><ellipse cx="60" cy="10" rx="70" ry="40" fill="#2A3040"/></g>`);
    s += RAIN(t, .7);
    s += raioBox(7, 1, '', 1);
    return s + VIG(.85);
  }
  if (L < 7.6) {   // museu: dois chapéus queimados em vitrines
    const L2 = L - 3.6, k = L2 / 4;
    setCam(lerp(540, 300, easeInOut(k)) + hx, lerp(1050, 1080, k) + hy, lerp(.85, 1.6, easeInOut(k)), 0, [540, 1000, 1]);
    s += lay(1, `<rect x="-1000" y="-500" width="3000" height="3000" fill="#1A1410"/><rect x="-1000" y="1450" width="3000" height="900" fill="#2A1E16"/><rect x="-1000" y="1450" width="3000" height="900" fill="url(#woodP)" opacity=".4"/>`);
    [300, 780].forEach((x, i) => { s += lay(1, `<path d="M${x - 40} 0 L${x - 260} 1450 L${x + 260} 1450 L${x + 40} 0Z" fill="url(#beamW2)" opacity=".5"/><rect x="${x - 150}" y="1050" width="300" height="400" fill="#3A2C22" stroke="${OUTL}" stroke-width="6"/><rect x="${x - 170}" y="1030" width="340" height="30" fill="#5A4430" stroke="${OUTL}" stroke-width="5"/>` + hatAlone(x, 970, .95, i ? 6 : -4, 1) + `<rect x="${x - 170}" y="740" width="340" height="290" fill="#BFE0FF" opacity=".1" stroke="#DDEEFF" stroke-width="4"/><path d="M${x - 140} 760 L${x - 60} 1010" stroke="#fff" stroke-width="8" opacity=".25"/><rect x="${x - 110}" y="1150" width="220" height="90" fill="#C8A060" stroke="${OUTL}" stroke-width="3"/><text x="${x}" y="1190" text-anchor="middle" font-family="'DejaVu Serif',serif" font-weight="700" font-size="22" fill="#2A1A0C">ROY SULLIVAN</text><text x="${x}" y="1224" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="22" fill="#2A1A0C">7 RAIOS</text>`); });
    s += lay(1, dust(t, '#FFE6B0', .6));
    return s + VIG(1);
  }
  // volta ao começo: o Roy na tempestade, acena — de longe
  const L3 = L - 7.6, k = L3 / (d - 7.6), H = hit(L3, 1.6);
  setCam(540 + hx + H.shake * Math.sin(L * 70), lerp(1040, 1100, k) + hy, lerp(1.3, .7, easeInOut(range(L3, 0, 2.2))), 0, [540, 1080, 1]);
  s += lay(.2, stormSky(t, H.flash)) + lay(.4, ridges(1150, .4)) + lay(.7, [-200, 0, 180, 900, 1100, 1300].map((x, i) => pine(x, 1420, 300 + (i % 3) * 60, '#1A2E22')).join('')) + lay(1, ground(1500, '#34502A', '#26401E'));
  s += lay(1, ROY({ x: 540, y: 1720, s: .95, armF: [160, -20 + 25 * Math.sin(L * 9)], mouth: .3 }));
  s += lay(1, bolt(900, -300, 1000, 1500, 71, H.bolt));
  s += RAIN(t, .9);
  s += raioBox(7, 1, '', 1);
  return s + VIG(.9) + FLASH(H.flash * .6) + FADE(range(L, d - .25, d) * 0);
}
const FN = { n1: s1, n2: s2, n3: s3, n4: s4, n5: s5, n6: s6, n7: s7, n8: s8, n9: s9 };

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
