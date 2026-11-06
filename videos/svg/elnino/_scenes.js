/* ===================== Super El Niño: o que é e como se proteger ===================== */
const SH = N.s.map(x => [x.k, x.a, x.b]);
const shotAt = t => SH.find(s => t >= s[1] && t < s[2]) || SH[SH.length - 1];
const loc = (t, id) => { const s = SH.find(x => x[0] === id); return { L: t - s[1], d: s[2] - s[1], k: (t - s[1]) / (s[2] - s[1]) }; };
const GRAINV = t => { const j = Math.floor(t * 24); return `<rect x="-200" y="-200" width="1480" height="2320" fill="url(#noiseP)" opacity=".05" transform="translate(${(j * 37) % 200 - 100},${(j * 53) % 200 - 100})"/>`; };
const HH = (t, k = 1) => [3 * k * noise1(t * 1.3, 1), 3 * k * noise1(t * 1.1, 4)];
const GND = 1500;
const BIG = (n, label, y = 230, pop = 1) => `<g transform="translate(540,${y}) scale(${f1(pop * 100) / 100})"><rect x="-320" y="-118" width="640" height="226" rx="34" fill="#0A0806" opacity=".6"/><rect x="-320" y="-118" width="640" height="226" rx="34" fill="none" stroke="#FFE2A8" stroke-width="4" opacity=".6"/><text x="0" y="40" text-anchor="middle" font-family="'DejaVu Sans Mono',monospace" font-weight="700" font-size="140" fill="#FFF3D6">${n}</text><text x="0" y="92" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="38" letter-spacing="8" fill="#FFD27A">${label}</text></g>`;
// número de dica (1 a 6) no canto, como um selo
const TIP = (n, t0, t) => { const p = backOut(range(t, t0, t0 + .35)); return `<g transform="translate(150,200) scale(${f1(p * 100) / 100})"><circle r="92" fill="#FFC83A" stroke="${OUTL}" stroke-width="6"/><text y="34" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="100" fill="${OUTL}">${n}</text></g>`; };

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
/* ---------- mapas ---------- */
const PB = (lon, lat) => [f1((lon + 76) * 31), f1((7 - lat) * 33)];
const BRASIL = [[-51.6, 4.2], [-50.4, 1.8], [-49.8, 1.0], [-48.5, -1.0], [-46.5, -1.0], [-44.3, -2.5], [-41.5, -2.9], [-38.5, -3.7], [-35.2, -5.4], [-34.8, -7.5], [-35.3, -9.4], [-37.1, -11.0], [-38.9, -13.3], [-39.0, -17.5], [-40.0, -19.8], [-41.0, -22.0], [-43.2, -22.9], [-45.4, -23.8], [-48.0, -25.4], [-48.6, -27.5], [-49.4, -28.6], [-50.3, -30.3], [-51.4, -31.6], [-53.4, -33.7], [-53.5, -32.5], [-55.0, -31.3], [-57.6, -30.2], [-56.0, -28.0], [-53.7, -26.2], [-54.6, -25.6], [-54.3, -24.0], [-55.6, -22.6], [-57.9, -22.0], [-58.2, -20.1], [-57.5, -18.2], [-58.3, -16.3], [-60.2, -15.1], [-60.6, -13.7], [-62.3, -12.4], [-64.4, -12.5], [-65.3, -11.1], [-66.6, -9.9], [-68.6, -11.1], [-70.6, -11.0], [-70.6, -9.5], [-72.4, -10.0], [-73.9, -7.3], [-72.9, -5.2], [-70.0, -4.4], [-69.9, -1.0], [-69.5, 1.0], [-67.0, 2.0], [-64.0, 1.6], [-63.4, 3.9], [-60.7, 5.2], [-59.9, 2.4], [-56.5, 1.9], [-54.0, 2.2]];
const brPath = () => `M${BRASIL.map(p => PB(...p).join(' ')).join(' L')}Z`;
function oceanTex(t, col = '#1E5A8A') {
  let s = `<rect x="-900" y="-900" width="2900" height="3800" fill="${col}"/><rect x="-900" y="-900" width="2900" height="3800" fill="url(#waveP)" opacity=".5"/>`;
  for (let i = -6; i < 14; i++) s += `<line x1="-900" y1="${i * 200}" x2="2000" y2="${i * 200}" stroke="#BFE0FF" stroke-width="2" opacity=".18"/><line x1="${i * 200}" y1="-900" x2="${i * 200}" y2="2900" stroke="#BFE0FF" stroke-width="2" opacity=".18"/>`;
  return s;
}
function brasilTex() {
  const p = brPath();
  let s = `<path d="${p}" fill="#2A5A80" opacity=".6" transform="translate(14,18)" filter="url(#b12)"/><path d="${p}" fill="none" stroke="#8AD0FF" stroke-width="22" opacity=".35" filter="url(#b12)"/>`;
  s += `<clipPath id="brc"><path d="${p}"/></clipPath><path d="${p}" fill="#E8D8A8"/><g clip-path="url(#brc)"><rect x="-200" y="-200" width="1600" height="1600" fill="url(#dotP)" opacity=".5"/>`;
  s += `<ellipse cx="${PB(-62, -5)[0]}" cy="${PB(-62, -5)[1]}" rx="320" ry="200" fill="#9AC07A" opacity=".55"/><ellipse cx="${PB(-45, -20)[0]}" cy="${PB(-45, -20)[1]}" rx="140" ry="200" fill="#C8A878" opacity=".5"/>`;
  for (let i = 0; i < 9; i++) s += `<path d="M${200 + i * 120} ${300 + (i % 3) * 200} q60 -40 120 0 t120 0" stroke="#7A9A5A" stroke-width="5" fill="none" opacity=".45"/>`;
  s += `</g><path d="${p}" fill="none" stroke="${OUTL}" stroke-width="7" stroke-linejoin="round"/>`;
  return s;
}
function compass(x, y, s) { return `<g transform="translate(${x},${y}) scale(${s})"><circle r="90" fill="#F4ECD8" stroke="${OUTL}" stroke-width="5"/><path d="M0 -120 L22 0 L0 120 L-22 0Z" fill="#C83A2A" stroke="${OUTL}" stroke-width="4"/><path d="M-120 0 L0 -22 L120 0 L0 22Z" fill="#3A3A44" stroke="${OUTL}" stroke-width="4"/><circle r="12" fill="#F4ECD8" stroke="${OUTL}" stroke-width="4"/></g>`; }
// Pacífico esquemático: Ásia/Austrália à esquerda, América do Sul à direita
function pacific(t, warm) {
  let s = oceanTex(t);
  for (let i = 0; i < 26; i++) s += `<path d="M${-600 + (i * 211) % 2300} ${-400 + (i * 157) % 2800} q40 -10 80 0" stroke="#5A9ACA" stroke-width="4" fill="none" opacity=".4"/>`;
  // água quente se espalhando de oeste para leste sobre o equador
  const reach = lerp(120, 980, warm);
  s += `<ellipse cx="${f1((120 + reach) / 2)}" cy="980" rx="${f1((reach - 120) / 2 + 160)}" ry="${f1(150 + 60 * warm)}" fill="url(#gHot)" opacity="${op(.4 + .5 * warm)}"/>`;
  s += `<path d="M-600 980 L1700 980" stroke="#FFFFFF" stroke-width="3" stroke-dasharray="20 14" opacity=".5"/>`;
  s += `<path d="M-600 300 Q-200 280 0 420 Q80 600 -60 760 L-600 760Z" fill="#6A9A5A" stroke="${OUTL}" stroke-width="5"/><path d="M-600 1300 Q-200 1240 40 1360 Q120 1560 -100 1700 L-600 1700Z" fill="#B89A5A" stroke="${OUTL}" stroke-width="5"/>`;
  s += `<path d="M1700 400 L1180 520 Q1080 700 1120 900 Q1000 1100 1060 1400 Q1120 1700 1200 1900 L1700 1900Z" fill="#7AAA5A" stroke="${OUTL}" stroke-width="5"/><path d="M1700 400 L1180 520 Q1080 700 1120 900 Q1000 1100 1060 1400 Q1120 1700 1200 1900 L1700 1900Z" fill="url(#dotP)" opacity=".4"/><path d="M1300 600 L1240 900 L1290 1200 L1250 1600" stroke="#C8B89A" stroke-width="30" fill="none" stroke-linecap="round" opacity=".6"/>`;
  // ventos (setas) que enfraquecem
  const wind = 1 - warm;
  for (let i = 0; i < 4; i++) { const x = ((t * 160 * wind + i * 300) % 1200) + 100; s += `<g transform="translate(${f1(1100 - x)},${880 + (i % 2) * 200}) scale(${f1(.4 + .6 * wind)})" opacity="${op(.3 + .6 * wind)}"><path d="M60 0 L-60 0 M-60 0 l30 -24 M-60 0 l30 24" stroke="#fff" stroke-width="12" stroke-linecap="round" fill="none"/></g>`; }
  // nuvens de chuva acompanhando a água quente
  const cx = lerp(200, reach - 60, 1);
  s += `<g transform="translate(${f1(cx)},${f1(820 - 40 * warm)})"><ellipse cx="0" cy="0" rx="150" ry="60" fill="#E8EEF4"/><ellipse cx="-70" cy="-30" rx="80" ry="54" fill="#F4F8FC"/><ellipse cx="60" cy="-40" rx="90" ry="64" fill="#FFFFFF"/>${Array.from({ length: 8 }, (_, i) => { const p = (t * 2 + i * .13) % 1; return `<line x1="${-100 + i * 28}" y1="${f1(40 + p * 140)}" x2="${-110 + i * 28}" y2="${f1(70 + p * 140)}" stroke="#BFE0FF" stroke-width="5"/>`; }).join('')}</g>`;
  return s;
}
function globe(t, heat) {
  let s = `<circle cx="540" cy="1060" r="420" fill="#1E5A8A" stroke="${OUTL}" stroke-width="8"/>`;
  s += `<clipPath id="gc"><circle cx="540" cy="1060" r="420"/></clipPath><g clip-path="url(#gc)">`;
  const rot = (t * 30) % 900;
  s += `<g transform="translate(${f1(-rot * .2)},0)"><path d="M820 760 Q760 880 790 1000 Q740 1140 800 1300 Q850 1420 900 1480 L1200 1480 L1200 700Z" fill="#7AAA5A" stroke="${OUTL}" stroke-width="5"/><path d="M80 760 Q160 700 260 780 Q300 900 220 960 L80 960Z" fill="#6A9A5A" stroke="${OUTL}" stroke-width="5"/>`;
  s += `<ellipse cx="560" cy="1060" rx="${f1(160 + 140 * heat)}" ry="${f1(70 + 40 * heat)}" fill="url(#gHot)" opacity="${op(.3 + .7 * heat)}"/></g>`;
  for (let i = 0; i < 7; i++) { const cx = ((i * 190 + t * 40) % 1100) - 20; s += `<path d="M${f1(cx)} ${760 + i * 90} q60 -30 120 0 q50 20 100 -10" stroke="#fff" stroke-width="${14 + i % 3 * 6}" fill="none" opacity=".55" stroke-linecap="round"/>`; }
  s += `<rect x="0" y="600" width="1100" height="900" fill="url(#dotP)" opacity=".25"/><ellipse cx="880" cy="1140" rx="380" ry="520" fill="#000814" opacity=".45" filter="url(#b30)"/><ellipse cx="420" cy="900" rx="220" ry="140" fill="#fff" opacity=".12"/></g><circle cx="540" cy="1060" r="440" fill="none" stroke="#8AC8FF" stroke-width="20" opacity=".25"/>`;
  return s;
}
function thermo(x, y, s, k) {
  return `<g transform="translate(${x},${y}) scale(${s})"><rect x="-40" y="-420" width="80" height="420" rx="40" fill="#F4F4F0" stroke="${OUTL}" stroke-width="6"/><rect x="-22" y="${f1(-400 * k - 10)}" width="44" height="${f1(400 * k + 10)}" rx="22" fill="#E8302A"/><circle cx="0" cy="40" r="70" fill="#E8302A" stroke="${OUTL}" stroke-width="6"/><path d="M-26 -400 L-26 -20" stroke="#fff" stroke-width="10" opacity=".55" stroke-linecap="round"/><circle cx="-24" cy="20" r="16" fill="#fff" opacity=".5"/>${[0, 1, 2, 3, 4].map(i => `<line x1="40" y1="${-60 - i * 80}" x2="64" y2="${-60 - i * 80}" stroke="${OUTL}" stroke-width="5"/>`).join('')}</g>`;
}
/* ---------- objetos ---------- */
function phone(x, y, s, screen) { return `<g transform="translate(${x},${y}) scale(${s})"><rect x="-150" y="-300" width="300" height="600" rx="40" fill="#1A1A20" stroke="${OUTL}" stroke-width="6"/><rect x="-130" y="-260" width="260" height="500" rx="16" fill="#F2F4F8"/>${screen}<rect x="-40" y="-284" width="80" height="10" rx="5" fill="#3A3A44"/><path d="M-130 -260 L20 -260 L-130 40Z" fill="#fff" opacity=".12"/></g>`; }
function street(t, water = 0) {
  let s = `<rect x="-900" y="-900" width="2900" height="3800" fill="#7A8A9E"/>`;
  s += [[-500, 820, '#D8C8A8'], [-50, 760, '#C8A898'], [420, 860, '#A8C0C8'], [880, 780, '#D8B888'], [1320, 840, '#B8C8A8']].map(([x, h, c], i) => `<g transform="translate(${x},${GND - 40})"><rect x="0" y="${-h}" width="420" height="${h}" fill="${c}" stroke="${OUTL}" stroke-width="5"/><rect x="0" y="${-h}" width="420" height="${h}" fill="url(#brickP)" opacity=".35"/><rect x="-10" y="${-h - 30}" width="440" height="36" fill="${mix(c, '#000000', .25)}" stroke="${OUTL}" stroke-width="4"/>${[1, 2].map(r => `<rect x="30" y="${-h + 60 + r * 230}" width="170" height="16" fill="#5A5A60" stroke="${OUTL}" stroke-width="3"/>`).join('')}<rect x="300" y="${-h + 330}" width="80" height="56" fill="#E8E8E4" stroke="${OUTL}" stroke-width="3"/><path d="M140 -230 L280 -230 L300 -190 L120 -190Z" fill="${['#C83A3A', '#3A6AC8', '#3AA86A', '#E8A040', '#8A5AC8'][i]}" stroke="${OUTL}" stroke-width="3"/>${[0, 1, 2].map(r => [0, 1].map(cc => `<rect x="${60 + cc * 190}" y="${-h + 80 + r * 230}" width="110" height="140" fill="#3A4A5A" stroke="${OUTL}" stroke-width="4"/>`).join('')).join('')}<rect x="160" y="-200" width="100" height="200" fill="#5A4030" stroke="${OUTL}" stroke-width="4"/></g>`).join('');
  s += `<rect x="-900" y="${GND - 40}" width="2900" height="60" fill="#9A9AA0" stroke="${OUTL}" stroke-width="4"/>${Array.from({ length: 30 }, (_, i) => `<line x1="${-900 + i * 100}" y1="${GND - 40}" x2="${-900 + i * 100}" y2="${GND + 20}" stroke="${OUTL}" stroke-width="2" opacity=".4"/>`).join('')}<rect x="-900" y="${GND + 20}" width="2900" height="900" fill="#4A4A50"/><rect x="-900" y="${GND + 20}" width="2900" height="900" fill="url(#dotP)" opacity=".3"/><g transform="translate(80,${GND - 40})"><rect x="-8" y="-520" width="16" height="520" fill="#3A3A40"/><rect x="-90" y="-560" width="180" height="60" rx="6" fill="#2A7A4A" stroke="#fff" stroke-width="4"/></g>`;
  if (water > 0) { const wy = GND + 20 - water; s += `<rect x="-900" y="${f1(wy)}" width="2900" height="${f1(900 + water)}" fill="#6A5A3A" opacity=".85"/>${Array.from({ length: 22 }, (_, i) => `<path d="M${-900 + i * 140 + ((t * 80) % 140)} ${f1(wy + 20 + (i % 3) * 40)} q35 -14 70 0" stroke="#A8946A" stroke-width="5" fill="none"/>`).join('')}<rect x="-900" y="${f1(wy)}" width="2900" height="8" fill="#B8A478" opacity=".8"/>${[-500, -50, 420, 880, 1320].map((x, i) => `<rect x="${x + 60}" y="${f1(wy + 10)}" width="300" height="${f1(Math.min(220, water * 1.3))}" fill="#fff" opacity=".08"/>`).join('')}${Array.from({ length: 14 }, (_, i) => { const p = (t * 1.4 + i * .17) % 1; return `<ellipse cx="${-700 + (i * 197) % 2500}" cy="${f1(wy + 30 + (i % 4) * 40)}" rx="${f1(10 + 60 * p)}" ry="${f1(3 + 12 * p)}" fill="none" stroke="#D8C8A0" stroke-width="3" opacity="${op(1 - p)}"/>`; }).join('')}`; }
  for (let i = 0; i < 70; i++) { const p = (t * 1.6 + i * .137) % 1; s += `<line x1="${f1(-200 + (i * 97) % 1500 - p * 60)}" y1="${f1(-100 + p * 2100)}" x2="${f1(-212 + (i * 97) % 1500 - p * 60)}" y2="${f1(-40 + p * 2100)}" stroke="#D8E4F0" stroke-width="3" opacity=".5"/>`; }
  return s;
}
function car(x, y, rot = 0) { return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)})"><path d="M-260 -40 L-200 -150 L120 -150 L200 -60 L270 -50 L270 40 L-260 40Z" fill="#C83A3A" stroke="${OUTL}" stroke-width="6"/><path d="M-180 -136 L-130 -66 L20 -66 L20 -136Z M40 -136 L40 -66 L170 -66 L110 -136Z" fill="#BFD8EA" stroke="${OUTL}" stroke-width="4"/><circle cx="-150" cy="44" r="56" fill="#1A1A1E" stroke="${OUTL}" stroke-width="5"/><circle cx="160" cy="44" r="56" fill="#1A1A1E" stroke="${OUTL}" stroke-width="5"/></g>`; }
function backpack(x, y, s, open) { return `<g transform="translate(${x},${y}) scale(${s})"><path d="M-220 -360 Q-240 -420 -170 -430 L170 -430 Q240 -420 220 -360 L230 60 Q230 110 180 110 L-180 110 Q-230 110 -230 60Z" fill="#2E6A5A" stroke="${OUTL}" stroke-width="6"/><rect x="-160" y="-120" width="320" height="170" rx="24" fill="#24564A" stroke="${OUTL}" stroke-width="5"/><path d="M-140 -60 L140 -60" stroke="#C8C8C0" stroke-width="6"/><path d="M-200 -340 Q-210 0 -200 80 M200 -340 Q210 0 200 80 M-140 -100 L140 -100 M-140 40 L140 40" stroke="#8AC8B0" stroke-width="3" stroke-dasharray="10 8" fill="none" opacity=".7"/><rect x="110" y="-76" width="20" height="34" rx="4" fill="#C8C8C0" stroke="${OUTL}" stroke-width="2"/><path d="M-120 -430 Q-160 -540 -60 -540 L60 -540 Q160 -540 120 -430" stroke="#24564A" stroke-width="30" fill="none"/><path d="M-150 -300 Q-160 -100 -120 40" stroke="#fff" stroke-width="8" opacity=".12" fill="none"/>${open ? `<path d="M-200 -380 Q0 ${f1(-380 - 160 * open)} 200 -380" fill="#1A3A32" stroke="${OUTL}" stroke-width="5"/>` : `<path d="M-200 -380 L200 -380" stroke="#C8C8C0" stroke-width="7"/>`}</g>`; }
const ITEMS = [
  `<g><rect x="-80" y="-100" width="160" height="200" rx="10" fill="#DCEBF6" opacity=".7" stroke="${OUTL}" stroke-width="4"/><rect x="-60" y="-80" width="120" height="150" fill="#F4E8C8" stroke="${OUTL}" stroke-width="3"/><rect x="-44" y="-60" width="50" height="60" fill="#8AA0B8"/><path d="M-40 20 L40 20 M-40 40 L30 40" stroke="#6A6A70" stroke-width="5"/></g>`,
  `<g><rect x="-34" y="-120" width="68" height="220" rx="24" fill="#8AC8F0" stroke="${OUTL}" stroke-width="4" opacity=".9"/><rect x="-22" y="-150" width="44" height="34" rx="6" fill="#2A6AC8" stroke="${OUTL}" stroke-width="4"/><path d="M-20 -90 L-20 80" stroke="#fff" stroke-width="7" opacity=".5"/></g>`,
  `<g><rect x="-30" y="-90" width="60" height="170" rx="12" fill="#3A3A44" stroke="${OUTL}" stroke-width="4"/><path d="M-50 -90 L50 -90 L40 -140 L-40 -140Z" fill="#F2C832" stroke="${OUTL}" stroke-width="4"/></g>`,
  `<g><rect x="-70" y="-50" width="140" height="100" rx="14" fill="#F4F4F0" stroke="${OUTL}" stroke-width="4"/><path d="M-70 0 L70 0" stroke="${OUTL}" stroke-width="3"/><rect x="-20" y="-36" width="40" height="72" fill="#E8302A" opacity=".85"/><rect x="-36" y="-20" width="72" height="40" fill="#E8302A" opacity=".85"/></g>`,
  `<g><rect x="-40" y="-60" width="80" height="80" rx="10" fill="#F4F4F0" stroke="${OUTL}" stroke-width="4"/><path d="M0 20 Q10 80 -40 110 Q-80 130 -60 170" stroke="#F4F4F0" stroke-width="12" fill="none"/><path d="M-14 -60 L-14 -90 M14 -60 L14 -90" stroke="#C8C8C0" stroke-width="10"/></g>`];
function mosquito(x, y, s, t) { const w = Math.sin(t * 60) * 30; return `<g transform="translate(${f1(x)},${f1(y)}) scale(${s})"><ellipse cx="0" cy="0" rx="60" ry="18" fill="#2A2A30"/>${[-30, -10, 10, 30].map(i => `<rect x="${i - 3}" y="-14" width="6" height="28" fill="#F4F4F0"/>`).join('')}<circle cx="-70" cy="-4" r="20" fill="#2A2A30"/><path d="M-88 -2 L-150 6" stroke="#2A2A30" stroke-width="4"/><g opacity=".55"><ellipse cx="10" cy="-30" rx="50" ry="16" fill="#E8F2FF" transform="rotate(${f1(-20 + w)} 10 -10)"/><ellipse cx="20" cy="-26" rx="46" ry="14" fill="#E8F2FF" transform="rotate(${f1(-40 - w)} 20 -10)"/></g>${[-40, -10, 20].map(i => `<path d="M${i} 14 l-20 50 l-10 30" stroke="#2A2A30" stroke-width="5" fill="none"/><path d="M${i} 14 l-20 50 l-10 30" stroke="#F4F4F0" stroke-width="5" stroke-dasharray="6 10" fill="none"/>`).join('')}</g>`; }
const redX = (x, y, s, p) => `<g transform="translate(${x},${y}) scale(${f1(s * backOut(p) * 100) / 100})"><circle r="150" fill="none" stroke="#E8302A" stroke-width="26"/><path d="M-100 -100 L100 100" stroke="#E8302A" stroke-width="26" stroke-linecap="round"/></g>`;
const check = (x, y, s, p) => `<g transform="translate(${x},${y}) scale(${f1(s * backOut(p) * 100) / 100})"><circle r="130" fill="#2AAA5A" stroke="${OUTL}" stroke-width="8"/><path d="M-60 0 L-15 50 L70 -50" stroke="#fff" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>`;
function room(t, warm = 0) {
  const wall = mix('#E8E0D0', '#F2C8A0', warm), wallD = mix('#D8CCB4', '#E2B48A', warm);
  let r = `<rect x="-900" y="-900" width="2900" height="3800" fill="${wall}"/><rect x="-900" y="-900" width="2900" height="3800" fill="url(#wallP)" opacity=".55"/>`;
  r += `<g transform="translate(-180,420)"><rect x="-40" y="-40" width="560" height="660" fill="#6A5038" stroke="${OUTL}" stroke-width="6"/><rect x="0" y="0" width="480" height="580" fill="${mix('#9CC8EC', '#FFD08A', warm)}"/><path d="M0 420 Q120 340 240 400 Q360 330 480 390 L480 580 L0 580Z" fill="${mix('#7AA86A', '#C8A060', warm)}"/><path d="M240 0 L240 580 M0 290 L480 290" stroke="#6A5038" stroke-width="14"/><path d="M-60 -60 Q60 300 -40 700 L-120 700 L-120 -60Z" fill="#C85A4A" stroke="${OUTL}" stroke-width="4"/><path d="M540 -60 Q420 300 520 700 L600 700 L600 -60Z" fill="#C85A4A" stroke="${OUTL}" stroke-width="4"/><path d="M-90 -40 Q-40 300 -90 690 M570 -40 Q520 300 570 690" stroke="#A84A3A" stroke-width="6" fill="none"/></g>`;
  r += `<path d="M300 1000 L900 1000 L1300 ${GND} L500 ${GND}Z" fill="#FFF4D8" opacity=".18"/>`;
  r += `<g transform="translate(980,520)"><rect x="-130" y="-100" width="260" height="200" fill="#8A6A4A" stroke="${OUTL}" stroke-width="5"/><rect x="-108" y="-78" width="216" height="156" fill="#F4ECD8"/><circle cx="-40" cy="-20" r="30" fill="#E8A040"/><path d="M-108 78 L-40 0 L20 50 L60 10 L108 78Z" fill="#6A9A5A"/></g><rect x="1200" y="1060" width="50" height="80" rx="6" fill="#F4F4F0" stroke="${OUTL}" stroke-width="3"/>`;
  r += `<rect x="-900" y="${GND}" width="2900" height="1400" fill="${mix('#B89A78', '#C89A70', warm)}"/><rect x="-900" y="${GND}" width="2900" height="1400" fill="url(#woodP)" opacity=".6"/><rect x="-900" y="${GND - 60}" width="2900" height="60" fill="${wallD}" stroke="${OUTL}" stroke-width="3"/><rect x="-900" y="${GND}" width="2900" height="14" fill="#000" opacity=".2"/>`;
  r += `<g transform="translate(1180,${GND})"><path d="M-70 0 L-50 -150 L50 -150 L70 0Z" fill="#C86A3A" stroke="${OUTL}" stroke-width="4"/>${[-40, -10, 20, 50].map((x, i) => `<path d="M0 -150 Q${x} ${-280 - i * 20} ${x * 2.4} ${-380 + i * 10}" stroke="#3A8A3A" stroke-width="10" fill="none"/><ellipse cx="${x * 2.4}" cy="${-380 + i * 10}" rx="40" ry="18" fill="#4A9A4A" stroke="${OUTL}" stroke-width="3" transform="rotate(${x} ${x * 2.4} ${-380 + i * 10})"/>`).join('')}</g>`;
  return r;
}

/* ---------- 1. gancho: o planeta esquentando, termômetro subindo ---------- */
function s1(t) {
  const { L, d, k } = loc(t, 'n1'), [hx, hy] = HH(t);
  setCam(540 + hx, lerp(1000, 980, k) + hy, lerp(1.25, 1.0, easeOut(range(L, 0, 1.6))), 0, [540, 1000, 1]);
  const heat = easeInOut(range(L, .2, 4.2));
  let s = lay(.2, `<rect x="-900" y="-900" width="2900" height="3800" fill="${mix('#0A1428', '#3A0A10', heat)}"/>` + STARS.slice(0, 90).map(q => `<circle cx="${f1(q.x * .6 + 300)}" cy="${f1(q.y * .9)}" r="${q.r}" fill="#fff" opacity=".5"/>`).join(''));
  s += lay(.6, `<circle cx="540" cy="1060" r="620" fill="url(#gHot)" opacity="${op(.5 * heat)}"/>`) + lay(1, globe(t, heat) + thermo(920, 1620, .9, heat));
  const n = (heat * 2.5).toFixed(1).replace('.', ',');
  return s + VIG(.8) + BIG('+' + n + '°C', 'ÁGUA DO PACÍFICO', 250, L > 4.2 ? 1 + .15 * Math.sin(range(L, 4.2, 4.5) * Math.PI) : 1) + GRAINV(t) + (L < .1 ? `<rect width="1080" height="1920" fill="#fff" opacity="${op(.3 * (1 - L / .1))}"/>` : '');
}
/* ---------- 2. o que é: a água quente se espalha no Pacífico ---------- */
function s2(t) {
  const { L, d, k } = loc(t, 'n2'), [hx, hy] = HH(t);
  setCam(lerp(540, 620, k) + hx, 1000 + hy, lerp(.9, 1.0, k), 0, [540, 1000, 1]);
  return lay(1, pacific(t, easeInOut(range(L, .3, d - .4)))) + VIG(.7) + GRAINV(t);
}
/* ---------- 3. no Brasil: chuva no Sul, seca no Norte/Nordeste, calor ---------- */
function s3(t) {
  const { L, d, k } = loc(t, 'n3'), [hx, hy] = HH(t);
  const focus = L < 2.0 ? [PB(-52, -28), 1.6] : L < 3.8 ? [PB(-50, -5), 1.5] : [PB(-52, -14), .95];
  const fk = easeInOut(range(L % 2 < 2 ? (L < 2 ? L : L < 3.8 ? L - 2 : L - 3.8) : 0, 0, .8));
  setCam(+focus[0][0] + hx, +focus[0][1] + hy, focus[1], 0, [540, 960, 1]);
  let s = lay(1, oceanTex(t) + brasilTex() + compass(1250, 1100, .9));
  // Sul: nuvem de chuva + enchente
  const [sx, sy] = PB(-52, -28).map(Number);
  let south = `<g transform="translate(${sx},${sy - 120})"><ellipse cx="0" cy="0" rx="140" ry="54" fill="#5A6A80"/><ellipse cx="-60" cy="-26" rx="80" ry="54" fill="#6A7A90"/><ellipse cx="50" cy="-34" rx="90" ry="60" fill="#7A8AA0"/>${Array.from({ length: 10 }, (_, i) => { const p = (t * 2.4 + i * .11) % 1; return `<line x1="${-110 + i * 24}" y1="${f1(40 + p * 140)}" x2="${-120 + i * 24}" y2="${f1(70 + p * 140)}" stroke="#8AC8FF" stroke-width="6"/>`; }).join('')}</g><g transform="translate(${sx},${sy + 90})">${[0, 1, 2].map(i => `<path d="M-120 ${i * 26} q30 -16 60 0 t60 0 t60 0 t60 0" stroke="#3A8ADA" stroke-width="10" fill="none" transform="translate(${f1(Math.sin(t * 3 + i) * 12)},0)"/>`).join('')}</g>`;
  // Norte/Nordeste: sol + chão rachado
  const [nx, ny] = PB(-48, -6).map(Number);
  let north = `<g transform="translate(${nx},${ny - 40})"><circle r="${f1(90 + 8 * Math.sin(t * 4))}" fill="#FFC832" stroke="${OUTL}" stroke-width="5"/>${Array.from({ length: 10 }, (_, i) => `<path d="M0 -120 L0 -160" stroke="#FFC832" stroke-width="12" stroke-linecap="round" transform="rotate(${i * 36 + t * 30})"/>`).join('')}</g><g transform="translate(${nx + 200},${ny + 140})"><path d="M-90 0 L-30 20 L0 -10 L40 30 L90 0 M-30 20 L-50 60 M40 30 L30 70" stroke="#8A5A2A" stroke-width="7" fill="none"/></g>`;
  // Centro: termômetro vermelho
  const [cx, cy] = PB(-53, -15).map(Number);
  s += lay(1, south + north + thermo(cx, cy + 120, .5, .9));
  if (L > 3.8) s += lay(1, `<g opacity="${op(range(L, 3.8, 4.3))}"><circle cx="${cx}" cy="${cy}" r="${f1(500 + 50 * Math.sin(t * 3))}" fill="url(#gHot)" opacity=".35"/></g>`);
  return s + VIG(.7) + GRAINV(t);
}
/* ---------- 4. dica 1: SMS com CEP para 40199 ---------- */
function s4(t) {
  const { L, d, k } = loc(t, 'n4'), [hx, hy] = HH(t);
  setCam(lerp(600, 560, k) + hx, lerp(1060, 980, k) + hy, lerp(.95, 1.25, easeInOut(range(L, .4, 2.0))), 0, [540, 1000, 1]);
  let s = lay(.8, room(t));
  const typed = '90010-000'.slice(0, Math.floor(range(L, 1.0, 2.6) * 9));
  const sent = L > 2.8, alertP = range(L, 3.4, 3.8);
  let scr = `<rect x="-130" y="-260" width="260" height="70" fill="#2A6AC8"/><text x="0" y="-214" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="40" fill="#fff">40199</text>`;
  scr += `<rect x="${sent ? -10 : -110}" y="${sent ? -150 : 120}" width="130" height="56" rx="20" fill="${sent ? '#2AAA5A' : '#E4E8EE'}" stroke="${OUTL}" stroke-width="2"/><text x="${sent ? 55 : -45}" y="${sent ? -112 : 158}" text-anchor="middle" font-family="'DejaVu Sans Mono',monospace" font-size="26" fill="${sent ? '#fff' : '#1A1A20'}">${typed}</text>`;
  if (alertP > 0) scr += `<g transform="translate(0,${f1(-40 + (1 - alertP) * 60)})" opacity="${op(alertP)}"><rect x="-120" y="-30" width="240" height="120" rx="14" fill="#E8302A"/><path d="M-90 40 L-60 -10 L-30 40Z" fill="#FFC832" stroke="#fff" stroke-width="3"/><rect x="-14" y="0" width="110" height="12" rx="6" fill="#fff"/><rect x="-14" y="26" width="90" height="12" rx="6" fill="#fff" opacity=".8"/></g>`;
  s += lay(1, man({ x: 330, y: GND, s: 1.05, kind: 'civil', armF: [55, 75], armB: [45, 80], held: `<g transform="rotate(-90)"><rect x="-28" y="-50" width="56" height="100" rx="10" fill="#1A1A20" stroke="${OUTL}" stroke-width="3"/><rect x="-22" y="-42" width="44" height="80" rx="4" fill="#BFE0FF"/></g>` }) + phone(720, 900, 1.4, scr));
  if (alertP > 0) s += lay(1, `<circle cx="720" cy="900" r="${f1(300 + 200 * alertP)}" fill="none" stroke="#E8302A" stroke-width="10" opacity="${op(1 - alertP)}"/>`);
  return s + VIG(.7) + TIP(1, SH[3][1], t) + GRAINV(t);
}
/* ---------- 5. dica 2: rua alagada, não atravesse ---------- */
function s5(t) {
  const { L, d, k } = loc(t, 'n5'), [hx, hy] = HH(t);
  setCam(lerp(420, 640, k) + hx, 1200 + hy, .8, 0, [540, 1200, 1]);
  const water = lerp(0, 160, easeOut(range(L, 0, 2.5)));
  let s = lay(1, street(t, water));
  // carro boiando e sendo arrastado
  const drift = easeIn(range(L, 1.6, d)) * 700;
  s += lay(1, car(1000 + drift, GND - water + 30 + Math.sin(t * 3) * 10, Math.sin(t * 2) * 5 + drift * .01));
  // pessoa chega, para na beira, recua
  const walk = L < 1.6, back = range(L, 2.2, 3.2);
  const px = walk ? lerp(-200, 220, L / 1.6) : 220 - back * 160;
  s += lay(1, man({ x: px, y: GND - 30, s: 1.0, kind: 'civil', flip: back > 0 ? -1 : 1, ...walkPose(L * 9, walk || (back > 0 && back < 1) ? 1 : 0), armF: L > 1.6 && L < 2.4 ? [150, 10] : [10, 10] }));
  if (L > 2.3) s += lay(1, redX(560, 900, .9, range(L, 2.3, 2.7)));
  return s + VIG(.7) + TIP(2, SH[4][1], t) + GRAINV(t);
}
/* ---------- 6. dica 3: mochila de emergência ---------- */
function s6(t) {
  const { L, d, k } = loc(t, 'n6'), [hx, hy] = HH(t);
  setCam(540 + hx, lerp(1080, 1040, k) + hy, lerp(1.0, 1.12, k), 0, [540, 1000, 1]);
  let s = lay(.8, room(t, .1) + `<rect x="-900" y="1300" width="2900" height="40" fill="#8A6A4A" stroke="${OUTL}" stroke-width="4"/>`);
  s += lay(1, backpack(540, 1300, 1.0, L < d - .5 ? 1 : 0));
  ITEMS.forEach((it, i) => { const t0 = .3 + i * .85, p = easeIn(range(L, t0, t0 + .55)); if (p >= 1) return; const sx = [160, 900, 200, 880, 540][i], sy = [600, 620, 1700, 1720, 420][i]; s += lay(1, `<g transform="translate(${f1(lerp(sx, 540, p))},${f1(lerp(sy, 960, p))}) rotate(${f1((1 - p) * (i % 2 ? 20 : -20))}) scale(${f1(lerp(1.4, .6, p) * 100) / 100})">${it}</g>`); });
  if (L > d - .5) s += lay(1, check(820, 760, .8, range(L, d - .5, d - .2)));
  return s + VIG(.7) + TIP(3, SH[5][1], t) + GRAINV(t);
}
/* ---------- 7. dica 4: calor — água, sol forte, idosos/crianças/animais ---------- */
function dog(x, y, s, t) { return `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="-80" rx="130" ry="60" fill="#C88A4A" stroke="${OUTL}" stroke-width="5"/><circle cx="-140" cy="-110" r="54" fill="#C88A4A" stroke="${OUTL}" stroke-width="5"/><path d="M-170 -150 Q-190 -90 -160 -80" fill="#8A5A2A" stroke="${OUTL}" stroke-width="4"/><circle cx="-160" cy="-120" r="7" fill="${OUTL}"/><ellipse cx="-196" cy="-100" rx="12" ry="9" fill="${OUTL}"/>${[-90, -40, 50, 100].map(lx => `<rect x="${lx}" y="-40" width="24" height="44" fill="#C88A4A" stroke="${OUTL}" stroke-width="4"/>`).join('')}<path d="M120 -110 q40 ${f1(-30 + 10 * Math.sin(t * 12))} 60 -60" stroke="#C88A4A" stroke-width="18" fill="none" stroke-linecap="round"/></g>`; }
function s7(t) {
  const { L, d, k } = loc(t, 'n7'), [hx, hy] = HH(t);
  const part = L < 1.8 ? 0 : L < 3.6 ? 1 : 2;
  let s = '';
  if (part === 0) {   // bebendo água
    setCam(560 + hx, 1000 + hy, lerp(1.0, 1.2, L / 1.8), 0, [540, 1000, 1]);
    s += lay(.8, room(t, 1) + `<circle cx="900" cy="300" r="260" fill="#FFC832" opacity=".5" filter="url(#b30)"/>`) + lay(.8, thermo(900, 900, .8, .95));
    const sip = easeInOut(range(L, .3, .8));
    s += lay(1, man({ x: 450, y: GND, s: 1.15, kind: 'civil', armF: [lerp(30, 115, sip), lerp(20, 100, sip)], held: `<g transform="rotate(${f1(lerp(0, 150, sip))}) scale(.8)">${ITEMS[1]}</g>` }));
    for (let i = 0; i < 3; i++) { const p = (L * .8 + i * .33) % 1; s += lay(1, `<path d="M${560 + i * 30} ${f1(560 + p * 160)} q8 14 0 22 q-8 -8 0 -22Z" fill="#9AD0FF" opacity="${op(1 - p)}"/>`); }
  } else if (part === 1) {   // relógio: evite o sol forte (10h–16h)
    const L2 = L - 1.8;
    setCam(540 + hx, 1000 + hy, 1.05, 0, [540, 1000, 1]);
    s += `<rect width="1080" height="1920" fill="#FFB060"/><circle cx="540" cy="760" r="${f1(330 + 20 * Math.sin(t * 4))}" fill="#FFD84A" stroke="${OUTL}" stroke-width="8"/>`;
    s += `<g transform="translate(540,760)"><circle r="230" fill="#FFF8E8" stroke="${OUTL}" stroke-width="8"/><path d="M0 0 L${f1(Math.sin(rad(300)) * 0)} 0" /><path d="M0 0 A230 230 0 0 1 ${f1(Math.sin(rad(120)) * 230)} ${f1(-Math.cos(rad(120)) * 230)} L0 0Z" transform="rotate(-60)" fill="#E8302A" opacity=".5"/>${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="-200" x2="0" y2="-176" stroke="${OUTL}" stroke-width="6" transform="rotate(${i * 30})"/>`).join('')}<line x1="0" y1="0" x2="0" y2="-170" stroke="${OUTL}" stroke-width="10" stroke-linecap="round" transform="rotate(${f1(lerp(-60, 120, L2 / 1.8))})"/><circle r="14" fill="${OUTL}"/></g>`;
    s += man({ x: 540, y: 1780, s: .7, kind: 'civil', flip: -1, ...walkPose(L2 * 9, 1), armF: [170, -20], held: `<path d="M-80 -20 Q0 -100 80 -20Z" fill="#3A6AC8" stroke="${OUTL}" stroke-width="4"/>` });
  } else {   // idoso, criança, cachorro com água
    const L2 = L - 3.6;
    setCam(560 + hx, 1080 + hy, .85, 0, [540, 1100, 1]);
    s += lay(.8, room(t, .6));
    s += lay(1, `<g transform="translate(260,${GND})"><rect x="-150" y="-300" width="300" height="300" rx="30" fill="#8A5A3A" stroke="${OUTL}" stroke-width="5"/></g>` + man({ x: 260, y: GND - 40, s: .95, kind: 'idoso', drop: 200, legF: [85, -80], legB: [80, -80], armF: [60, 40], held: ITEMS[1] }) + `<g transform="translate(560,1280) rotate(${f1(Math.sin(t * 20) * 6)})"><circle r="90" fill="none" stroke="#5A5A66" stroke-width="10"/>${[0, 1, 2].map(i => `<ellipse rx="70" ry="22" fill="#9AD0FF" transform="rotate(${i * 60 + t * 900})"/>`).join('')}</g><rect x="550" y="1280" width="20" height="220" fill="#5A5A66"/>`);
    s += lay(1, man({ x: 760, y: GND, s: .62, kind: 'civil2', armF: [80, 30], held: ITEMS[1] }) + dog(930, GND, .7, t) + `<ellipse cx="760" cy="${GND - 10}" rx="70" ry="22" fill="#3A8ADA" stroke="${OUTL}" stroke-width="4"/>`);
  }
  return s + VIG(.7) + TIP(4, SH[6][1], t) + GRAINV(t);
}
/* ---------- 8. dica 5: seca — economize, guarde com tampa, nada de queimada ---------- */
function s8(t) {
  const { L, d, k } = loc(t, 'n8'), [hx, hy] = HH(t);
  setCam(lerp(520, 600, k) + hx, 1080 + hy, .85, 0, [540, 1100, 1]);
  let s = lay(.05, `<rect x="-900" y="-900" width="2900" height="3800" fill="#F2C890"/><circle cx="880" cy="320" r="160" fill="#FFE08A"/>`);
  s += lay(.3, `<path d="M-900 ${GND - 80} Q-300 ${GND - 260} 300 ${GND - 120} Q900 ${GND - 300} 2000 ${GND - 100} L2000 ${GND} L-900 ${GND}Z" fill="#C8905A" opacity=".7"/>`) + lay(.6, `<rect x="-900" y="${GND}" width="2900" height="1400" fill="#C89A60"/><rect x="-900" y="${GND}" width="2900" height="1400" fill="url(#crackP)"/>${Array.from({ length: 22 }, (_, i) => `<g transform="translate(${-800 + (i * 211) % 2600},${GND + 20 + (i * 67) % 200})">${[-12, -4, 4, 12].map((dx, j) => `<path d="M${dx} 0 Q${dx + 6} -20 ${dx * 1.6 + 8} ${-30 - j * 6}" stroke="#A8844A" stroke-width="4" fill="none"/>`).join('')}</g>`).join('')}${Array.from({ length: 12 }, (_, i) => { const p = (t * .4 + i * .083) % 1; return `<circle cx="${f1(-400 + (i * 263) % 1800 + p * 200)}" cy="${f1(GND - p * 400)}" r="${f1(20 + p * 50)}" fill="#E8C890" opacity="${op((1 - p) * .35)}"/>`; }).join('')}`);
  const lid = easeInOut(range(L, .8, 1.5)), tap = L > .2;
  s += lay(1, `<g transform="translate(200,${GND})"><rect x="-130" y="-300" width="260" height="300" rx="20" fill="#3A8ADA" stroke="${OUTL}" stroke-width="6"/><ellipse cx="0" cy="-300" rx="130" ry="30" fill="#2A6AAA" stroke="${OUTL}" stroke-width="5"/><g transform="translate(${f1(lerp(260, 0, lid))},${f1(lerp(-200, -310, lid))})"><ellipse rx="140" ry="32" fill="#2A5A8A" stroke="${OUTL}" stroke-width="5"/><rect x="-24" y="-40" width="48" height="24" rx="8" fill="#2A5A8A" stroke="${OUTL}" stroke-width="4"/></g></g>`);
  s += lay(1, man({ x: 460, y: GND, s: 1.0, kind: 'civil', flip: -1, armF: lid < 1 ? [100, 20] : [10, 10], armB: [10, 10] }));
  // queimada: monte de folhas, fósforo se aproxima e é cancelado
  const fireP = range(L, 2.2, 3.0);
  s += lay(1, `<g transform="translate(860,${GND})"><path d="M-160 0 Q-120 -110 0 -120 Q120 -110 160 0Z" fill="#8A6A2A" stroke="${OUTL}" stroke-width="5"/>${fireP > 0 && fireP < .6 ? `<path d="M-30 -120 Q0 -220 30 -120Z" fill="#FF7A2A" opacity="${op(fireP * 2)}"/>` : ''}</g>`);
  if (L > 2.8) s += lay(1, redX(860, 1340, .9, range(L, 2.8, 3.2)));
  return s + VIG(.7) + TIP(5, SH[7][1], t) + GRAINV(t);
}
/* ---------- 9. dica 6: dengue — tirar água parada ---------- */
function s9(t) {
  const { L, d, k } = loc(t, 'n9'), [hx, hy] = HH(t);
  setCam(560 + hx, 1100 + hy, lerp(.9, 1.0, k), 0, [540, 1100, 1]);
  let s = lay(.8, `<rect x="-900" y="-900" width="2900" height="3800" fill="#BFE0C8"/>${Array.from({ length: 30 }, (_, i) => `<rect x="${-900 + i * 100}" y="${GND - 420}" width="70" height="420" fill="#E8DCC0" stroke="${OUTL}" stroke-width="3"/><path d="M${-900 + i * 100} ${GND - 420} l35 -40 l35 40" fill="#E8DCC0" stroke="${OUTL}" stroke-width="3"/>`).join('')}<rect x="-900" y="${GND - 300}" width="2900" height="20" fill="#C8B898"/><rect x="-900" y="${GND}" width="2900" height="1400" fill="#8AAA6A"/><rect x="-900" y="${GND}" width="2900" height="1400" fill="url(#dotP)" opacity=".35"/>${Array.from({ length: 14 }, (_, i) => `<g transform="translate(${-700 + i * 190},${GND - 10})"><path d="M0 0 L0 -90" stroke="#3A7A3A" stroke-width="6"/><circle cx="0" cy="-96" r="18" fill="${['#E8584A', '#F2C832', '#E87AC8', '#FFFFFF'][i % 4]}" stroke="${OUTL}" stroke-width="3"/><circle cx="0" cy="-96" r="7" fill="#F2A832"/></g>`).join('')}`);
  const empty = easeInOut(range(L, 1.0, 1.8));
  s += lay(1, `<g transform="translate(560,${GND})"><path d="M-110 -180 L110 -180 L80 0 L-80 0Z" fill="#C86A3A" stroke="${OUTL}" stroke-width="5"/><path d="M0 -180 Q-40 -320 -90 -360 M0 -180 Q30 -330 90 -380 M0 -180 L0 -400" stroke="#3A8A3A" stroke-width="12" fill="none"/><g transform="rotate(${f1(-50 * empty)} 150 0)"><ellipse cx="0" cy="10" rx="160" ry="28" fill="#A85A2A" stroke="${OUTL}" stroke-width="5"/><ellipse cx="0" cy="4" rx="${f1(130 * (1 - empty))}" ry="${f1(14 * (1 - empty))}" fill="#6AA8D8"/></g></g>`);
  if (empty > 0 && empty < 1) for (let i = 0; i < 6; i++) s += lay(1, `<circle cx="${700 + i * 20}" cy="${f1(GND + 10 + (empty * 200 + i * 20) % 80)}" r="9" fill="#6AA8D8"/>`);
  s += lay(1, man({ x: 860, y: GND, s: .95, kind: 'civil', flip: -1, drop: 160 * Math.sin(empty * Math.PI), lean: 30 * Math.sin(empty * Math.PI), armF: [lerp(20, 110, Math.sin(empty * Math.PI)), 10] }));
  const mfly = L < 1.8 ? [560 + Math.sin(t * 5) * 80, GND - 120 + Math.cos(t * 7) * 40] : [560 + (L - 1.8) * 900, GND - 200 - (L - 1.8) * 500];
  s += lay(1, mosquito(mfly[0], mfly[1], .9, t));
  if (L > 2.4) s += lay(1, check(540, 760, .8, range(L, 2.4, 2.8)));
  return s + VIG(.7) + TIP(6, SH[8][1], t) + GRAINV(t);
}
/* ---------- 10. compartilhe ---------- */
function s10(t) {
  const { L, d, k } = loc(t, 'n10'), [hx, hy] = HH(t);
  setCam(540 + hx, 1000 + hy, lerp(1.0, 1.1, k), 0, [540, 1000, 1]);
  let s = lay(.8, room(t, .2));
  s += lay(1, man({ x: 330, y: GND, s: 1.05, kind: 'civil', armF: [55, 75], armB: [45, 80], held: `<g transform="rotate(-90)"><rect x="-28" y="-50" width="56" height="100" rx="10" fill="#1A1A20" stroke="${OUTL}" stroke-width="3"/><rect x="-22" y="-42" width="44" height="80" rx="4" fill="#BFE0FF"/></g>` }) + phone(720, 900, 1.3, `<circle cx="0" cy="-40" r="90" fill="#2AAA5A"/><path d="M-30 -80 L40 -40 L-30 0Z" fill="#fff"/>${[0, 1, 2].map(i => `<circle cx="${-80 + i * 80}" cy="140" r="34" fill="${['#E8643A', '#B8A0C8', '#3AA88A'][i]}" stroke="${OUTL}" stroke-width="3"/>`).join('')}`));
  for (let i = 0; i < 8; i++) { const p = (L * .7 + i * .125) % 1; s += lay(1, `<path d="M${f1(720 + Math.sin(i * 2) * 200)} ${f1(800 - p * 600)} c-20 -30 -60 -10 -40 20 l40 40 l40 -40 c20 -30 -20 -50 -40 -20Z" fill="#E8302A" opacity="${op(1 - p)}"/>`); }
  return s + VIG(.7) + GRAINV(t);
}
const FN = { n1: s1, n2: s2, n3: s3, n4: s4, n5: s5, n6: s6, n7: s7, n8: s8, n9: s9, n10: s10 };
function frame(t) {
  D = []; uid = 0;
  const sh = shotAt(t);
  let body = FN[sh[0]](t);
  for (const c of SH.slice(1)) if (t >= c[1] && t < c[1] + .08) body += `<rect width="1080" height="1920" fill="#fff" opacity="${op(.2 * (1 - (t - c[1]) / .08))}"/>`;
  defsEl.innerHTML = STATIC + objDefs() + `<filter id="manVol" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feOffset in="SourceAlpha" dx="-16" dy="8" result="o1"/><feComposite in="SourceAlpha" in2="o1" operator="out" result="e1"/><feGaussianBlur in="e1" stdDeviation="7" result="b1"/><feComposite in="b1" in2="SourceAlpha" operator="in" result="s1"/><feFlood flood-color="#1A1028" flood-opacity=".38"/><feComposite in2="s1" operator="in" result="sh"/><feOffset in="SourceAlpha" dx="7" dy="-7" result="o2"/><feComposite in="SourceAlpha" in2="o2" operator="out" result="e2"/><feGaussianBlur in="e2" stdDeviation="2.5" result="b2"/><feComposite in="b2" in2="SourceAlpha" operator="in" result="r1"/><feFlood flood-color="#FFF0D0" flood-opacity=".55"/><feComposite in2="r1" operator="in" result="rim"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="sh"/><feMergeNode in="rim"/></feMerge></filter><radialGradient id="gHot"><stop offset="0" stop-color="#FF3A1A" stop-opacity=".95"/><stop offset=".5" stop-color="#FF7A2A" stop-opacity=".6"/><stop offset="1" stop-color="#FFB03A" stop-opacity="0"/></radialGradient><filter id="bl6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
<pattern id="paperP" width="512" height="512" patternUnits="userSpaceOnUse"><image href="${PAPER}" width="512" height="512"/></pattern>
<pattern id="waveP" width="160" height="90" patternUnits="userSpaceOnUse"><path d="M10 30 q20 -14 40 0 t40 0 M90 70 q20 -14 40 0" stroke="#8AC0E8" stroke-width="3" fill="none"/></pattern>
<pattern id="dotP" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2" fill="#000" opacity=".25"/><circle cx="13" cy="12" r="1.5" fill="#000" opacity=".18"/></pattern>
<pattern id="wallP" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M60 10 L80 60 L60 110 L40 60Z" fill="none" stroke="#B8A888" stroke-width="3"/><circle cx="0" cy="0" r="8" fill="#C8B898"/><circle cx="120" cy="120" r="8" fill="#C8B898"/><circle cx="60" cy="60" r="5" fill="#C8B898"/></pattern>
<pattern id="woodP" width="300" height="70" patternUnits="userSpaceOnUse"><rect width="300" height="70" fill="none" stroke="#6A4A2A" stroke-width="3"/><path d="M10 25 q60 -8 120 0 t140 2 M20 50 q80 6 160 -2" stroke="#8A6A4A" stroke-width="2" fill="none"/></pattern>
<pattern id="brickP" width="80" height="40" patternUnits="userSpaceOnUse"><path d="M0 0 H80 M0 20 H80 M0 0 V20 M40 20 V40" stroke="#5A4A3A" stroke-width="3" fill="none"/></pattern>
<pattern id="crackP" width="260" height="200" patternUnits="userSpaceOnUse"><path d="M0 60 L70 40 L120 90 L200 60 L260 80 M70 40 L60 0 M120 90 L100 200 M200 60 L230 0 M120 90 L180 150 L260 140 M0 160 L60 150 L100 200" stroke="#7A4A20" stroke-width="5" fill="none"/></pattern>` + D.join('');
  root.innerHTML = body + TEXTURE;
}
