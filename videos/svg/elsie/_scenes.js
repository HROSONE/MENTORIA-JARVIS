/* ===================== Elsie — Monowi, população: 1 (16:9, cinematográfico) ===================== */
const SH = N.s.map(x => [x.k, x.a, x.b]);
const shotAt = t => SH.find(s => t >= s[1] && t < s[2]) || SH[SH.length - 1];
const loc = (t, id) => { const s = SH.find(x => x[0] === id); return { L: t - s[1], d: s[2] - s[1], k: (t - s[1]) / (s[2] - s[1]) }; };
const HH = (t, k = 1) => [3 * k * noise1(t * 1.1, 1), 2.5 * k * noise1(t * .9, 4)];
const GND = 860;
const FOTOS = window.FOTOS || [];
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
const TEXTURE = `<rect x="-100" y="-100" width="2120" height="1280" fill="url(#paperP)" style="mix-blend-mode:multiply" opacity=".55"/><rect x="-100" y="-100" width="2120" height="1280" fill="url(#paperP)" style="mix-blend-mode:soft-light" opacity=".5"/>`;


/* ---------- céu e pradaria ---------- */
function skyCol(d) {
  const K = [[0, '#060A1C', '#141C3A', '#24284A'], [.2, '#2A2A5A', '#B85A5A', '#F2A060'], [.3, '#6A8AC8', '#F2C08A', '#FFE2B0'], [.5, '#5A8ED8', '#A8CCF0', '#E2EEF8'], [.7, '#6A7AC0', '#F0A870', '#FFD08A'], [.8, '#3A2A5A', '#C85A4A', '#F28A4A'], [.9, '#0E1230', '#2A2448', '#3A2E50'], [1, '#060A1C', '#141C3A', '#24284A']];
  let i = 0; while (i < K.length - 2 && d > K[i + 1][0]) i++;
  const k = smooth((d - K[i][0]) / (K[i + 1][0] - K[i][0])); return [1, 2, 3].map(j => mix(K[i][j], K[i + 1][j], k));
}
const STARS3 = Array.from({ length: 160 }, (_, i) => ({ x: (i * 977) % 4200 - 1100, y: (i * 613) % 900 - 300, r: .8 + (i % 4) * .6, p: i * .37 }));
function sky(d, t) {
  const [a, b, c] = skyCol(d), id = nid('sk');
  def(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".65" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`);
  const night = d < .2 ? 1 - d / .2 : d > .82 ? (d - .82) / .1 : 0;
  let s = `<rect x="-1500" y="-1200" width="5000" height="2200" fill="url(#${id})"/>`;
  if (night > 0) s += STARS3.map(q => `<circle cx="${q.x}" cy="${q.y}" r="${q.r}" fill="#fff" opacity="${op(night * (.4 + .5 * Math.sin(t * 2 + q.p)))}"/>`).join('');
  const sa = (d - .25) * Math.PI * 2, sx = 960 - Math.cos(sa) * 1300, sy = 900 - Math.sin(sa) * 900;
  s += `<circle cx="${f1(sx)}" cy="${f1(sy)}" r="420" fill="url(#gSun)" opacity=".9"/><circle cx="${f1(sx)}" cy="${f1(sy)}" r="70" fill="#FFF4D6"/>`;
  s += `<circle cx="${f1(960 + Math.cos(sa) * 1300)}" cy="${f1(900 + Math.sin(sa) * 900)}" r="50" fill="#EEF2FF" opacity="${op(night)}"/>`;
  for (let i = 0; i < 6; i++) { const x = ((i * 700 + t * (10 + i * 3)) % 4400) - 1200, y = 60 + (i % 3) * 120; s += `<g transform="translate(${f1(x)},${y}) scale(${1 + (i % 3) * .3})" opacity=".85"><ellipse rx="230" ry="34" fill="${mix(c, '#ffffff', .4)}"/><ellipse cx="-70" cy="-22" rx="120" ry="44" fill="${mix(b, '#ffffff', .55)}"/><ellipse cx="60" cy="-30" rx="140" ry="52" fill="${mix(b, '#ffffff', .65)}"/></g>`; }
  return s;
}
const lightK = d => d < .2 || d > .86 ? .25 : d < .28 ? lerp(.25, 1, (d - .2) / .08) : d > .78 ? lerp(1, .25, (d - .78) / .08) : 1;
function prairie(d, t) {
  const lit = lightK(d), g1 = mix('#1A2018', '#B8A060', lit), g2 = mix('#10140E', '#8A7A40', lit), far = mix('#1A2030', '#8A9A70', lit);
  let s = `<path d="M-1500 ${GND - 120} Q-400 ${GND - 170} 600 ${GND - 130} Q1600 ${GND - 180} 3500 ${GND - 120} L3500 ${GND + 40} L-1500 ${GND + 40}Z" fill="${far}"/>`;
  s += `<rect x="-1500" y="${GND - 20}" width="5000" height="1400" fill="${g1}"/><rect x="-1500" y="${GND - 20}" width="5000" height="1400" fill="url(#dotP)" opacity=".25"/>`;
  for (let i = 0; i < 70; i++) { const x = -1400 + (i * 263) % 4800, y = GND + 10 + (i * 37) % 260, k = .6 + (i % 4) * .2, sw = Math.sin(t * 1.4 + i) * 4; s += `<g transform="translate(${x},${y}) scale(${k})">${[-10, -3, 4, 11].map((dx, j) => `<path d="M${dx - 2} 0 Q${dx + sw} -22 ${dx * 1.5 + sw} ${-34 - (j % 2) * 10}" stroke="${j % 2 ? g2 : mix(g1, '#000000', .2)}" stroke-width="4" fill="none"/>`).join('')}</g>`; }
  return s;
}
/* ---------- prédios de Monowi (vista lateral) ---------- */
function house(x, s, lit, ruin = 0, col = '#C8B898', dl = 1) {
  const c = mix(col, '#6A6050', ruin * .6), dk = mix(c, '#000000', .35 + .4 * (1 - dl));
  let g = `<g transform="translate(${x},${GND}) scale(${s})"><rect x="-150" y="-200" width="300" height="200" fill="${mix(c, '#141820', 1 - dl)}" stroke="${OUTL}" stroke-width="5"/>${Array.from({ length: 8 }, (_, i) => `<line x1="-150" y1="${-200 + i * 25}" x2="150" y2="${-200 + i * 25}" stroke="${OUTL}" stroke-width="2" opacity=".25"/>`).join('')}`;
  g += `<path d="M-180 -195 L0 ${ruin > .5 ? -290 : -320} L180 -195Z" fill="${dk}" stroke="${OUTL}" stroke-width="5"/>`;
  [-90, 60].forEach(wx => { g += `<rect x="${wx}" y="-150" width="60" height="70" fill="${lit ? '#FFD88A' : (ruin > .5 ? '#0A0A0E' : '#2A3040')}" stroke="${OUTL}" stroke-width="4"/>${lit ? `<rect x="${wx - 30}" y="-180" width="120" height="130" fill="#FFD88A" opacity=".25" filter="url(#b12)"/>` : ''}${ruin > .5 ? `<path d="M${wx} -150 L${wx + 60} -80" stroke="#5A5048" stroke-width="5"/>` : ''}`; });
  g += `<rect x="-20" y="-100" width="45" height="100" fill="#3A2A20" stroke="${OUTL}" stroke-width="4"/>`;
  return g + '</g>';
}
function tavern(x, s, dl, lit = 1, o = {}) {
  const w = mix('#141820', '#C84A3A', dl), wd = mix('#0E1018', '#8A2E24', dl);
  let g = `<g transform="translate(${x},${GND}) scale(${s})"><rect x="-260" y="-300" width="520" height="300" fill="${w}" stroke="${OUTL}" stroke-width="6"/>${Array.from({ length: 12 }, (_, i) => `<line x1="-260" y1="${-300 + i * 25}" x2="260" y2="${-300 + i * 25}" stroke="${OUTL}" stroke-width="2" opacity=".25"/>`).join('')}`;
  g += `<rect x="-280" y="-330" width="560" height="40" fill="${wd}" stroke="${OUTL}" stroke-width="5"/><rect x="-190" y="-430" width="380" height="90" rx="8" fill="${mix('#1A1A20', '#F2E8D0', dl)}" stroke="${OUTL}" stroke-width="5"/><text x="0" y="-372" text-anchor="middle" font-family="'DejaVu Serif',serif" font-weight="700" font-size="40" fill="${mix('#3A3A44', '#8A2A1E', dl)}">TAVERN</text>`;
  g += `<rect x="-200" y="-220" width="150" height="110" fill="${lit ? '#FFD07A' : '#1A2030'}" stroke="${OUTL}" stroke-width="5"/><rect x="60" y="-220" width="150" height="110" fill="${lit ? '#FFD07A' : '#1A2030'}" stroke="${OUTL}" stroke-width="5"/><rect x="-40" y="-200" width="80" height="200" fill="#3A2418" stroke="${OUTL}" stroke-width="5"/>`;
  if (lit) g += `<rect x="-240" y="-260" width="480" height="200" fill="#FFD07A" opacity=".2" filter="url(#b30)"/>`;
  if (o.beer) g += `<g transform="translate(150,-280)"><circle r="30" fill="${lit ? '#FF4A3A' : '#5A2A2A'}" stroke="${OUTL}" stroke-width="3"/></g>`;
  return g + '</g>';
}
function library(x, s, dl, lit = 0) {
  let g = `<g transform="translate(${x},${GND}) scale(${s})"><rect x="-150" y="-220" width="300" height="220" fill="${mix('#141820', '#E8DCC0', dl)}" stroke="${OUTL}" stroke-width="5"/><path d="M-175 -215 L0 -300 L175 -215Z" fill="${mix('#0E1018', '#3A5A7A', dl)}" stroke="${OUTL}" stroke-width="5"/>`;
  g += `<rect x="-120" y="-200" width="240" height="40" fill="${mix('#1A1A20', '#2A4A6A', dl)}" stroke="${OUTL}" stroke-width="3"/><text x="0" y="-172" text-anchor="middle" font-family="'DejaVu Serif',serif" font-weight="700" font-size="22" fill="#F2E8D0">RUDY'S LIBRARY</text>`;
  g += `<rect x="-100" y="-140" width="70" height="70" fill="${lit ? '#FFD88A' : '#2A3040'}" stroke="${OUTL}" stroke-width="4"/><rect x="20" y="-130" width="60" height="130" fill="#4A3020" stroke="${OUTL}" stroke-width="4"/>`;
  return g + '</g>';
}
function elevator(x, s, dl) { const c = mix('#141820', '#A8A8A0', dl); return `<g transform="translate(${x},${GND}) scale(${s})"><rect x="-90" y="-560" width="180" height="560" fill="${c}" stroke="${OUTL}" stroke-width="6"/><rect x="-110" y="-600" width="220" height="50" fill="${mix(c, '#000000', .2)}" stroke="${OUTL}" stroke-width="5"/>${Array.from({ length: 10 }, (_, i) => `<line x1="-90" y1="${-540 + i * 54}" x2="90" y2="${-540 + i * 54}" stroke="${OUTL}" stroke-width="2" opacity=".3"/>`).join('')}<rect x="90" y="-300" width="160" height="300" fill="${mix(c, '#000000', .15)}" stroke="${OUTL}" stroke-width="5"/></g>`; }
function lamp(x, on, t) { return `<g transform="translate(${x},${GND})"><rect x="-6" y="-360" width="12" height="360" fill="#1A1C24" stroke="${OUTL}" stroke-width="2"/><path d="M0 -360 q0 -30 -50 -30" stroke="#1A1C24" stroke-width="10" fill="none"/><path d="M-80 -396 l60 0 l-12 16 l-36 0Z" fill="#2A2C34"/>${on ? `<path d="M-68 -380 L-32 -380 L40 0 L-140 0Z" fill="url(#beamW2)" opacity=".5"/><circle cx="-50" cy="-382" r="${f1(30 + 3 * Math.sin(t * 3))}" fill="#FFF0C0" opacity=".45" filter="url(#b12)"/>` : ''}</g>`; }
// cidade inteira vista de lado; houses: lista de casas com estado
const HOUSES = [[-900, .9, '#C8B898'], [-560, .8, '#B8C8C8'], [-230, .85, '#D8C0A8'], [1450, .9, '#C8C0A0'], [1780, .8, '#B8B0C8'], [2100, .85, '#C8B8A8'], [2420, .8, '#B0C0A8']];
function townSide(t, d, o = {}) {
  const dl = lightK(d);
  let s = lay(.05, sky(d, t)) + lay(.4, prairie(d, t).split('<rect x="-1500"')[0]) + lay(.6, elevator(-1200, 1, dl));
  let b = '';
  HOUSES.forEach(([x, sc, c], i) => { const st = o.houses ? o.houses[i] : { lit: 0, ruin: 1 }; b += house(x, sc, st.lit, st.ruin, c, dl); });
  b += tavern(560, 1, dl, o.tavernLit ?? (dl < .6), { beer: 1 }) + library(1080, .85, dl, o.libLit) + house(150, .9, o.elsieLit ?? (dl < .6), 0, '#E8D8B8', dl);
  b += lamp(320, dl < .6, t) + lamp(820, dl < .6, t) + lamp(1260, dl < .6 && !o.lampsOff, t);
  s += lay(1, prairie(d, t) + b + (o.extra || ''));
  return s;
}
/* ---------- vista aérea (detalhada, cacheada por luz) ---------- */
const AER = {};
function buildAerial(lit) {
  let sd = 1907; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const C = c => mix('#0C100C', c, .12 + .88 * lit), LT = (c, k = .22) => C(mix(c, '#FFF6E0', k)), DK = (c, k = .3) => C(mix(c, '#000000', k));
  const SHD = `fill="#0A0806" opacity="${f1(.32 * lit + .08) }"`;
  const SX = -16, SY = 7;   // sol nascendo a leste: sombras para oeste
  let df = '', s = '';
  // ---- padrões de lavoura (linhas de plantio) ----
  const rowsP = (id, col, gap, w, a) => df += `<pattern id="${id}" width="${gap}" height="${gap}" patternUnits="userSpaceOnUse" patternTransform="rotate(${a})"><rect width="${gap}" height="${w}" fill="${col}"/></pattern>`;
  const CROPS = [
    { base: '#7A9A3E', row: '#4E7028', gap: 14, w: 6 },   // milho
    { base: '#D2B46A', row: '#B0914A', gap: 10, w: 3 },   // trigo colhido
    { base: '#8A6A44', row: '#6A4C30', gap: 12, w: 5 },   // terra arada
    { base: '#5E8236', row: '#3E5E22', gap: 11, w: 5 },   // soja
    { base: '#A8A45A', row: '#8A8A48', gap: 26, w: 2 },   // pasto
    { base: '#C2A45C', row: '#9C8044', gap: 16, w: 4 }];  // palha
  CROPS.forEach((c, i) => { rowsP(`cr${i}a`, C(c.row), c.gap, c.w, 0); rowsP(`cr${i}b`, C(c.row), c.gap, c.w, 90); });
  df += `<pattern id="mottP" width="220" height="220" patternUnits="userSpaceOnUse"><circle cx="40" cy="50" r="38" fill="#000" opacity=".07"/><circle cx="160" cy="140" r="52" fill="#000" opacity=".06"/><circle cx="120" cy="30" r="22" fill="#fff" opacity=".06"/><circle cx="60" cy="170" r="30" fill="#fff" opacity=".05"/></pattern>`;
  df += `<pattern id="grassP" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="6" cy="8" r="3" fill="#000" opacity=".14"/><circle cx="20" cy="22" r="4" fill="#000" opacity=".1"/><circle cx="24" cy="6" r="2" fill="#fff" opacity=".1"/></pattern>`;
  df += `<pattern id="mowP" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="12" fill="#fff" opacity=".07"/></pattern>`;
  df += `<pattern id="gravP" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="3" cy="4" r="1.4" fill="#000" opacity=".18"/><circle cx="11" cy="12" r="1.2" fill="#fff" opacity=".25"/></pattern>`;
  df += `<radialGradient id="binG" cx=".65" cy=".35" r=".7"><stop offset="0" stop-color="${C('#F2F2EA')}"/><stop offset=".6" stop-color="${C('#A8ACB0')}"/><stop offset="1" stop-color="${C('#6A6E74')}"/></radialGradient>`;
  df += `<radialGradient id="pivG"><stop offset="0" stop-color="${C('#6E9A3A')}"/><stop offset=".85" stop-color="${C('#5A8A30')}"/><stop offset="1" stop-color="${C('#4A7228')}"/></radialGradient>`;
  df += `<radialGradient id="cloudSh"><stop offset="0" stop-color="#0A0C14" stop-opacity=".32"/><stop offset=".6" stop-color="#0A0C14" stop-opacity=".18"/><stop offset="1" stop-color="#0A0C14" stop-opacity="0"/></radialGradient>`;
  // ---- chão base ----
  s += `<rect x="-9000" y="-9000" width="20000" height="20000" fill="${C('#9A9A58')}"/><rect x="-9000" y="-9000" width="20000" height="20000" fill="url(#mottP)"/>`;
  // ---- seções de 1 milha: estradas a cada 1600 ----
  const SEC = 1600, RX = k => 960 + k * SEC, RY = k => 540 + k * SEC;
  const inTown = (x, y, w, h) => x < 1500 && x + w > 420 && y < 960 && y + h > 160;
  const farms = [];
  for (let i = -5; i < 5; i++) for (let j = -4; j < 4; j++) {
    const x0 = RX(i), y0 = RY(j);
    for (let q = 0; q < 4; q++) {
      const fx = x0 + (q % 2) * 800 + 14, fy = y0 + Math.floor(q / 2) * 800 + 14, fw = 772, fh = 772;
      if (inTown(fx, fy, fw, fh)) { s += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${C('#9AA45A')}"/><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="url(#grassP)"/>`; continue; }
      const r = rnd();
      if (r < .2) {   // pivô central irrigado
        s += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${C('#B89E62')}"/><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="url(#cr4a)" opacity=".6"/>`;
        const cx = fx + fw / 2, cy = fy + fh / 2, R = 378;
        s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#pivG)"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#cr${rnd() < .5 ? 0 : 3}a)" opacity=".55"/>`;
        for (let k = 1; k < 8; k++) s += `<circle cx="${cx}" cy="${cy}" r="${k * 48}" fill="none" stroke="${C('#3A5A20')}" stroke-width="3" opacity=".35"/>`;
        const a = rnd() * 6.28, ex = cx + Math.cos(a) * R, ey = cy + Math.sin(a) * R;
        s += `<path d="M${cx} ${cy} L${f1(ex)} ${f1(ey)}" stroke="${C('#D8D8D0')}" stroke-width="5"/>` + [.25, .5, .75, 1].map(k => `<circle cx="${f1(cx + (ex - cx) * k)}" cy="${f1(cy + (ey - cy) * k)}" r="6" fill="${C('#E8E8E0')}" stroke="${OUTL}" stroke-width="1.5"/>`).join('') + `<circle cx="${cx}" cy="${cy}" r="10" fill="${C('#C8C8C0')}" stroke="${OUTL}" stroke-width="2"/>`;
        // trilha de onde a água já passou (mais escuro)
        s += `<path d="M${cx} ${cy} L${f1(ex)} ${f1(ey)} A${R} ${R} 0 0 0 ${f1(cx + Math.cos(a - .9) * R)} ${f1(cy + Math.sin(a - .9) * R)}Z" fill="#0A2A10" opacity=".12"/>`;
      } else if (r < .3) {   // cultivo em faixas
        const vert = rnd() < .5, n = 8;
        for (let k = 0; k < n; k++) { const c = k % 2 ? CROPS[1] : CROPS[2]; s += vert ? `<rect x="${f1(fx + k * fw / n)}" y="${fy}" width="${f1(fw / n + .5)}" height="${fh}" fill="${C(c.base)}"/>` : `<rect x="${fx}" y="${f1(fy + k * fh / n)}" width="${fw}" height="${f1(fh / n + .5)}" fill="${C(c.base)}"/>`; }
        s += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="url(#cr1${vert ? 'b' : 'a'})" opacity=".5"/>`;
      } else {
        const ci = Math.floor(rnd() * 6), c = CROPS[ci], dir = rnd() < .5 ? 'a' : 'b';
        const split = rnd() < .35;   // metade dividida em dois cultivos
        if (split) {
          const c2 = CROPS[(ci + 2) % 6], h2 = fh * (.35 + rnd() * .3);
          s += `<rect x="${fx}" y="${fy}" width="${fw}" height="${f1(h2)}" fill="${C(c.base)}"/><rect x="${fx}" y="${fy}" width="${fw}" height="${f1(h2)}" fill="url(#cr${ci}${dir})"/>`;
          s += `<rect x="${fx}" y="${f1(fy + h2 + 8)}" width="${fw}" height="${f1(fh - h2 - 8)}" fill="${C(c2.base)}"/><rect x="${fx}" y="${f1(fy + h2 + 8)}" width="${fw}" height="${f1(fh - h2 - 8)}" fill="url(#cr${(ci + 2) % 6}${dir === 'a' ? 'b' : 'a'})"/>`;
          s += `<rect x="${fx}" y="${f1(fy + h2)}" width="${fw}" height="8" fill="${C('#7A7A44')}"/>`;
        } else s += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${C(c.base)}"/><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="url(#cr${ci}${dir})"/>`;
        s += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="url(#mottP)"/>`;
        if (ci === 1 && rnd() < .8) for (let b = 0; b < 14; b++) { const bx = fx + 60 + rnd() * (fw - 120), by = fy + 60 + rnd() * (fh - 120); s += `<ellipse cx="${f1(bx + SX * .5)}" cy="${f1(by + SY * .5)}" rx="11" ry="9" ${SHD}/><circle cx="${f1(bx)}" cy="${f1(by)}" r="9" fill="${C('#E2C47A')}" stroke="${C('#8A6A34')}" stroke-width="2"/><circle cx="${f1(bx)}" cy="${f1(by)}" r="4" fill="none" stroke="${C('#A8884A')}" stroke-width="1.5"/>`; }
        if (ci === 2 && rnd() < .5) s += `<path d="M${fx + 40} ${fy + fh - 60} q ${fw * .4} -40 ${fw - 80} -20" stroke="${C('#5A3E24')}" stroke-width="7" fill="none" opacity=".5"/>`;
      }
      s += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="none" stroke="${C('#6A6A3A')}" stroke-width="5" opacity=".55"/>`;
      if (!inTown(fx - 400, fy - 400, fw + 800, fh + 800) && rnd() < .16) farms.push([fx + (rnd() < .5 ? 90 : fw - 90), fy + (rnd() < .5 ? 90 : fh - 90), rnd() < .45]);
    }
  }
  // ---- riacho com mata ciliar ----
  const CK = []; for (let u = -9000; u <= 11000; u += 120) CK.push([u, -760 + .22 * u + 380 * Math.sin(u / 900) + 150 * Math.sin(u / 310 + 1)]);
  const cpath = CK.map((p, i) => i ? `Q${p[0]} ${f1(p[1])} ${f1((p[0] + CK[Math.min(i + 1, CK.length - 1)][0]) / 2)} ${f1((p[1] + CK[Math.min(i + 1, CK.length - 1)][1]) / 2)}` : `M${p[0]} ${f1(p[1])}`).join(' ');
  s += `<path d="${cpath}" stroke="${C('#6E8A44')}" stroke-width="210" fill="none" opacity=".75" stroke-linecap="round"/>`;
  s += `<path d="${cpath}" stroke="${C('#5A7438')}" stroke-width="120" fill="none" opacity=".6"/>`;
  let ctrees = '';
  CK.forEach(([x, y], i) => { for (let k = 0; k < 3; k++) { const ox = (rnd() - .5) * 150, oy = (rnd() - .5) * 150, r = 18 + rnd() * 22; ctrees += tree(x + ox, y + oy, r); } });
  s += `<path d="${cpath}" stroke="${C('#3A4A2E')}" stroke-width="34" fill="none"/><path d="${cpath}" stroke="${C('#5A7A8A')}" stroke-width="24" fill="none"/><path d="${cpath}" stroke="${C('#A8C8D0')}" stroke-width="5" fill="none" opacity=".6" transform="translate(4,-4)"/>`;
  s += ctrees;
  // ---- estradas de cascalho + rodovia ----
  const road = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C('#CDBB94')}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#gravP)"/>`;
  for (let i = -5; i < 6; i++) s += road(RX(i) - 13, -9000, 26, 20000);
  for (let j = -4; j < 5; j++) s += road(-9000, RY(j) - (j === 0 ? 17 : 13), 20000, j === 0 ? 34 : 26);
  // marcas de pneu na estrada principal
  s += `<path d="M-9000 534 H11000 M-9000 546 H11000" stroke="${C('#A8946E')}" stroke-width="3" opacity=".6"/>`;
  const HWX = RX(-2) + 400;   // rodovia asfaltada
  s += `<rect x="${HWX - 30}" y="-9000" width="60" height="20000" fill="${C('#8A8A7A')}"/><rect x="${HWX - 22}" y="-9000" width="44" height="20000" fill="${C('#3A3C40')}"/><path d="M${HWX} -9000 V11000" stroke="${C('#E8C040')}" stroke-width="3" stroke-dasharray="40 30"/><path d="M${HWX - 19} -9000 V11000 M${HWX + 19} -9000 V11000" stroke="${C('#E8E8E0')}" stroke-width="2"/>`;
  // ---- antiga linha de trem (desativada) ----
  s += `<rect x="-9000" y="906" width="20000" height="30" fill="${C('#8A8458')}"/><path d="M-9000 921 H11000" stroke="${C('#6A6040')}" stroke-width="14" stroke-dasharray="6 10" opacity=".55"/>`;
  // ---- fazendas (sede, celeiro, silos, quebra-vento) ----
  farms.forEach(([x, y, aband]) => {
    let f = '';
    for (let k = 0; k < 9; k++) f += tree(x - 110 + k * 26, y - 120, 20 + (k % 3) * 4);
    for (let k = 0; k < 7; k++) f += tree(x - 130, y - 100 + k * 28, 20 + (k % 2) * 5);
    f += `<rect x="${x - 70}" y="${y - 70}" width="160" height="150" fill="${C('#B8A878')}" opacity=".7"/>`;
    f += gable(x - 30, y - 30, 56, 40, aband ? '#7A7470' : '#5A6A7A', 0, aband);
    f += gable(x + 40, y + 20, 70, 50, aband ? '#6A4A40' : '#A8382C', 90, aband);
    [[x + 40, y - 40], [x + 62, y - 40], [x + 84, y - 30]].forEach(([bx, by]) => f += bin(bx, by, 11));
    s += f;
  });
  // ---- a cidade ----
  s += townTop();
  return { df, s };

  function tree(x, y, r) {
    const k = rnd();
    return `<circle cx="${f1(x + SX * r / 18)}" cy="${f1(y + SY * r / 18)}" r="${f1(r)}" ${SHD}/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${C(k < .5 ? '#3E5A2A' : '#4A6A30')}" stroke="${C('#24341A')}" stroke-width="2"/><circle cx="${f1(x + r * .2)}" cy="${f1(y - r * .2)}" r="${f1(r * .62)}" fill="${C('#5E8038')}"/><circle cx="${f1(x + r * .38)}" cy="${f1(y - r * .36)}" r="${f1(r * .3)}" fill="${C('#86A852')}"/>`;
  }
  function bin(x, y, r) { return `<ellipse cx="${x + SX * .9}" cy="${y + SY * .9}" rx="${r + 4}" ry="${r}" ${SHD}/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#binG)" stroke="${OUTL}" stroke-width="1.5"/><circle cx="${x}" cy="${y}" r="${r * .25}" fill="${C('#E8E8E0')}"/>${[0, 1, 2, 3, 4, 5].map(a => `<path d="M${x} ${y} L${f1(x + Math.cos(a) * r)} ${f1(y + Math.sin(a) * r)}" stroke="#000" stroke-width=".8" opacity=".25"/>`).join('')}`; }
  // casa com telhado de duas águas vista de cima
  function gable(x, y, w, h, col, rot = 0, ruin = 0, opt = {}) {
    let g = `<g transform="translate(${x},${y}) rotate(${rot})"><rect x="${-w / 2 + SX * .7}" y="${-h / 2 + SY * .7}" width="${w}" height="${h}" ${SHD}/>`;
    if (opt.porch) g += `<rect x="${-w / 2 + 6}" y="${h / 2 - 2}" width="${w - 12}" height="12" fill="${C('#B8A890')}" stroke="${OUTL}" stroke-width="1.5"/>`;
    g += `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h / 2}" fill="${LT(col, .18)}" stroke="${OUTL}" stroke-width="2"/><rect x="${-w / 2}" y="0" width="${w}" height="${h / 2}" fill="${DK(col, .22)}" stroke="${OUTL}" stroke-width="2"/>`;
    for (let k = 1; k < 5; k++) g += `<path d="M${-w / 2} ${f1(-h / 2 + k * h / 10)} H${w / 2} M${-w / 2} ${f1(k * h / 10)} H${w / 2}" stroke="#000" stroke-width=".8" opacity=".18"/>`;
    g += `<path d="M${-w / 2} 0 H${w / 2}" stroke="${LT(col, .45)}" stroke-width="2.5"/>`;
    if (!ruin) g += `<rect x="${w * .22}" y="${-h * .38}" width="7" height="7" fill="${C('#7A3A2A')}" stroke="${OUTL}" stroke-width="1.2"/>`;
    if (ruin) { g += `<path d="M${-w * .2} ${-h * .4} l${w * .18} ${h * .06} l${-w * .04} ${h * .28} l${-w * .2} ${-h * .1}Z" fill="#14100C"/><path d="M${w * .1} ${h * .05} l${w * .22} ${h * .02} l${-w * .06} ${h * .3} Z" fill="#1A140E" opacity=".9"/>`; g += `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#5A5048" opacity=".25"/>`; }
    return g + '</g>';
  }
  function flat(x, y, w, h, col, opt = {}) {
    let g = `<g transform="translate(${x},${y})"><rect x="${-w / 2 + SX * .8}" y="${-h / 2 + SY * .8}" width="${w}" height="${h}" ${SHD}/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="${C(opt.parapet || '#8A3A2C')}" stroke="${OUTL}" stroke-width="2.5"/><rect x="${-w / 2 + 5}" y="${-h / 2 + 5}" width="${w - 10}" height="${h - 10}" fill="${C(col)}"/><rect x="${-w / 2 + 5}" y="${-h / 2 + 5}" width="${w - 10}" height="${h - 10}" fill="url(#gravP)"/>`;
    if (opt.ac) g += `<rect x="${-w * .3}" y="${-h * .25}" width="16" height="12" fill="${C('#C8CCD0')}" stroke="${OUTL}" stroke-width="1.2"/><rect x="${-w * .3 + SX * .3}" y="${-h * .25 + SY * .3}" width="16" height="12" fill="#000" opacity=".15"/><circle cx="${w * .2}" cy="${-h * .1}" r="5" fill="${C('#9A9EA4')}" stroke="${OUTL}" stroke-width="1"/>`;
    if (opt.awning) g += `<rect x="${-w / 2 + 8}" y="${h / 2}" width="${w - 16}" height="9" fill="${C(opt.awning)}" stroke="${OUTL}" stroke-width="1.5"/>${Array.from({ length: Math.floor((w - 16) / 10) }, (_, k) => `<rect x="${-w / 2 + 8 + k * 10}" y="${h / 2}" width="5" height="9" fill="#fff" opacity=".35"/>`).join('')}`;
    if (opt.caved) g += `<path d="M${-w * .3} ${-h * .3} L${w * .1} ${-h * .35} L${w * .25} ${h * .1} L${-w * .05} ${h * .3} L${-w * .35} ${h * .05}Z" fill="#14100C"/><path d="M${-w * .2} ${-h * .1} L${w * .1} ${h * .15}" stroke="${C('#6A4A2A')}" stroke-width="3"/>`;
    return g + '</g>';
  }
  function car(x, y, rot, col) {
    return `<g transform="translate(${x},${y}) rotate(${rot})"><rect x="${-22 + SX * .3}" y="${-10 + SY * .3}" width="44" height="20" rx="6" ${SHD}/><rect x="-22" y="-10" width="44" height="20" rx="6" fill="${C(col)}" stroke="${OUTL}" stroke-width="1.5"/><rect x="-8" y="-8" width="18" height="16" rx="3" fill="${LT(col, .25)}"/><rect x="8" y="-8" width="5" height="16" fill="${C('#2A3440')}"/><rect x="-12" y="-8" width="4" height="16" fill="${C('#2A3440')}"/></g>`;
  }
  function pickup(x, y, rot, col) {
    return `<g transform="translate(${x},${y}) rotate(${rot})"><rect x="${-26 + SX * .3}" y="${-11 + SY * .3}" width="52" height="22" rx="4" ${SHD}/><rect x="-26" y="-11" width="52" height="22" rx="4" fill="${C(col)}" stroke="${OUTL}" stroke-width="1.5"/><rect x="-24" y="-8" width="24" height="16" fill="${DK(col, .35)}"/><rect x="4" y="-8" width="14" height="16" rx="2" fill="${LT(col, .2)}"/><rect x="18" y="-8" width="4" height="16" fill="${C('#2A3440')}"/></g>`;
  }
  function lot(x, y, w, h, kept) { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C(kept ? '#7EA24A' : '#9AA058')}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${kept ? 'mowP' : 'grassP'})"/>`; }
  function townTop() {
    let t = '';
    // quarteirões: gramado (abandonado = mato alto)
    const BX = [[420, 670], [690, 1030], [1050, 1290], [1310, 1500]], BY = [[180, 350], [370, 523], [557, 710], [730, 890]];
    BX.forEach(([x0, x1]) => BY.forEach(([y0, y1]) => t += lot(x0, y0, x1 - x0, y1 - y0, 0)));
    t += lot(560, 560, 150, 130, 1) + lot(700, 430, 160, 90, 1);   // quintal da Elsie e terreno da taverna
    // ruas internas (cascalho) e calçadas
    [680, 1040, 1300].forEach(x => t += `<rect x="${x - 10}" y="170" width="20" height="730" fill="${C('#C8B890')}"/><rect x="${x - 10}" y="170" width="20" height="730" fill="url(#gravP)"/>`);
    [360, 720].forEach(y => t += `<rect x="410" y="${y - 10}" width="1100" height="20" fill="${C('#C8B890')}"/><rect x="410" y="${y - 10}" width="1100" height="20" fill="url(#gravP)"/>`);
    t += `<rect x="600" y="519" width="760" height="5" fill="${C('#D8D0C0')}"/><rect x="600" y="556" width="760" height="5" fill="${C('#D8D0C0')}"/>`;
    // vielas
    [440, 640].forEach(y => t += `<path d="M420 ${y} H1500" stroke="${C('#B0A27A')}" stroke-width="6" opacity=".6" stroke-dasharray="40 14"/>`);
    // estacionamento da taverna
    t += `<rect x="700" y="526" width="170" height="10" fill="${C('#B8AA88')}"/>`;
    // jardim/horta da Elsie
    t += `<rect x="580" y="640" width="60" height="40" fill="${C('#6A4A2C')}" stroke="${OUTL}" stroke-width="1.5"/>${[0, 1, 2, 3].map(k => `<path d="M584 ${648 + k * 9} H636" stroke="${C('#6A9A3A')}" stroke-width="4" stroke-dasharray="5 3"/>`).join('')}`;
    // cercas
    t += `<rect x="560" y="560" width="150" height="130" fill="none" stroke="${C('#E8E0D0')}" stroke-width="2" stroke-dasharray="6 3"/>`;
    t += `<path d="M1310 730 V890 H1500" fill="none" stroke="${C('#8A7458')}" stroke-width="2" stroke-dasharray="8 6"/>`;
    // árvores de quintal (choupos grandes)
    const TR = [[450, 200, 34], [500, 300, 26], [640, 210, 30], [760, 190, 40], [820, 300, 24], [980, 200, 36], [1010, 320, 22], [1120, 210, 28], [1260, 320, 32], [1380, 200, 30], [1470, 300, 26],
      [450, 400, 30], [640, 400, 24], [990, 410, 26], [1180, 390, 34], [1270, 470, 22], [1450, 470, 30],
      [450, 600, 34], [540, 690, 28], [720, 600, 22], [1000, 690, 30], [1240, 590, 26], [1480, 640, 34],
      [460, 790, 36], [700, 860, 30], [840, 760, 26], [1000, 860, 34], [1230, 800, 30], [1460, 860, 28]];
    TR.forEach(([x, y, r]) => t += tree(x, y, r));
    // mato tomando conta das casas abandonadas
    const brush = (x, y, n) => { let b = ''; for (let k = 0; k < n; k++) b += `<circle cx="${f1(x + (rnd() - .5) * 90)}" cy="${f1(y + (rnd() - .5) * 70)}" r="${f1(6 + rnd() * 9)}" fill="${C(rnd() < .5 ? '#6A7A3A' : '#7E8A44')}" opacity=".9"/>`; return b; };
    // casas (x,y,w,h,cor,rot,ruína)
    const HS = [[560, 270, 62, 46, '#7A7470', 0, 1], [760, 270, 58, 44, '#5A6A7A', 0, 1], [1150, 270, 64, 48, '#6A5A4A', 0, 1], [1400, 270, 56, 44, '#8A8078', 90, 1],
      [560, 455, 60, 46, '#6A6A6A', 0, 1], [1180, 470, 58, 44, '#7A6A5A', 0, 1], [1410, 450, 60, 46, '#5A4A3A', 0, 1],
      [1400, 620, 60, 48, '#7A7470', 0, 1], [560, 800, 58, 44, '#6A5A4A', 0, 1], [780, 800, 62, 46, '#8A8078', 90, 1], [1120, 800, 60, 46, '#5A6A7A', 0, 1], [1400, 800, 58, 44, '#6A6A6A', 0, 1]];
    HS.forEach(([x, y, w, h, c, r, ru]) => { t += brush(x, y, 7) + gable(x, y, w, h, c, r, ru, { porch: 1 }); });
    // casa que desabou: só a fundação
    t += `<rect x="880" y="250" width="60" height="44" fill="none" stroke="${C('#9A9488')}" stroke-width="5"/><path d="M886 258 l20 10 l-6 14 l24 -4 M930 290 l-14 -8" stroke="${C('#6A5A48')}" stroke-width="4"/>` + brush(910, 272, 8);
    // igreja (planta em cruz + torre)
    t += `<g transform="translate(900,630)"><rect x="${-24 + SX}" y="${-60 + SY}" width="48" height="120" ${SHD}/><rect x="${-50 + SX}" y="${-14 + SY}" width="100" height="34" ${SHD}/><rect x="-24" y="-60" width="24" height="120" fill="${LT('#7A6A60', .2)}" stroke="${OUTL}" stroke-width="2"/><rect x="0" y="-60" width="24" height="120" fill="${DK('#7A6A60', .2)}" stroke="${OUTL}" stroke-width="2"/><rect x="-50" y="-14" width="100" height="17" fill="${LT('#7A6A60', .2)}" stroke="${OUTL}" stroke-width="2"/><rect x="-50" y="3" width="100" height="17" fill="${DK('#7A6A60', .2)}" stroke="${OUTL}" stroke-width="2"/><rect x="-14" y="54" width="28" height="28" fill="${C('#E8E0D0')}" stroke="${OUTL}" stroke-width="2"/><path d="M-14 54 L14 82 M14 54 L-14 82" stroke="#000" stroke-width="1.5" opacity=".3"/><rect x="${-14 + SX * 2.4}" y="${54 + SY * 2.4}" width="28" height="28" fill="#000" opacity=".14"/></g>`;
    // escola antiga (abandonada, telhado afundado)
    t += brush(1170, 640, 12) + flat(1170, 640, 140, 90, '#8A8478', { parapet: '#9A6A4A', caved: 1 });
    t += `<rect x="1120" y="690" width="100" height="22" fill="${C('#B0A27A')}"/>`;
    // loja antiga fechada
    t += flat(1110, 482, 90, 64, '#7A7A72', { parapet: '#6A6A62', caved: 1 }) + brush(1110, 500, 5);
    // TAVERNA (centro: 780,490) — telhado plano, toldo, letreiro
    t += flat(780, 485, 120, 76, '#5A5A5E', { parapet: '#A8382C', ac: 1, awning: '#C83A2A' });
    t += `<rect x="740" y="${485 + 38 + 9}" width="80" height="6" fill="${C('#F2E2C0')}" stroke="${OUTL}" stroke-width="1"/>`;
    t += pickup(712, 538, 0, '#3A5A8A') + car(852, 540, 180, '#C84A3A') + pickup(1000, 537, 180, '#6A6A6A');
    // BIBLIOTECA (casinha clara, telhado azul)
    t += gable(940, 478, 64, 50, '#3A5A8A', 0, 0, { porch: 1 }) + `<rect x="925" y="512" width="30" height="6" fill="${C('#F2EEE0')}" stroke="${OUTL}" stroke-width="1"/>`;
    // CASA DA ELSIE (bem cuidada)
    t += gable(640, 600, 70, 52, '#4A6A5A', 0, 0, { porch: 1 });
    t += `<rect x="683" y="625" width="14" height="70" fill="${C('#CDBB94')}" opacity=".9"/>` + car(690, 650, 90, '#E8E2D0');
    // caixa d'água
    t += `<g transform="translate(1460,560)"><ellipse cx="${SX * 6}" cy="${SY * 6}" rx="42" ry="30" ${SHD}/><path d="M-26 -26 L${SX * 6} ${SY * 6} M26 -26 L${SX * 6} ${SY * 6} M-26 26 L${SX * 6} ${SY * 6} M26 26 L${SX * 6} ${SY * 6}" stroke="#000" stroke-width="3" opacity=".25"/><circle r="30" fill="url(#binG)" stroke="${OUTL}" stroke-width="2.5"/><circle r="8" fill="${C('#D8D8D0')}" stroke="${OUTL}" stroke-width="1.5"/></g>`;
    // elevador de grãos junto à linha de trem
    t += `<g transform="translate(1180,880)"><rect x="${-110 + SX * 5}" y="${-30 + SY * 2}" width="220" height="60" ${SHD} opacity=".3"/>${[-90, -54, -18, 18, 54].map(cx => `<circle cx="${cx}" cy="0" r="18" fill="url(#binG)" stroke="${OUTL}" stroke-width="2"/>`).join('')}<rect x="76" y="-26" width="44" height="52" fill="${LT('#B8B4A8', .1)}" stroke="${OUTL}" stroke-width="2"/><rect x="76" y="-26" width="22" height="52" fill="#000" opacity=".12"/><rect x="${-110}" y="-4" width="230" height="8" fill="${C('#8A8A84')}" stroke="${OUTL}" stroke-width="1.5"/></g>`;
    t += bin(1330, 860, 22) + bin(1376, 860, 22) + bin(1353, 900, 18);
    // postes e fios ao longo da rua principal
    let poles = '';
    for (let x = 440; x <= 1480; x += 96) poles += `<circle cx="${x}" cy="566" r="4" fill="${C('#5A4030')}"/><path d="M${x} 566 l${SX * 1.8} ${SY * 1.8}" stroke="#000" stroke-width="3" opacity=".22"/>`;
    t += `<path d="M420 566 H1500" stroke="${C('#2A2420')}" stroke-width="1.2" opacity=".6"/><path d="M${420 + SX * 1.8} ${566 + SY * 1.8} H${1500 + SX * 1.8}" stroke="#000" stroke-width="1.2" opacity=".18"/>` + poles;
    // placa na entrada da cidade
    t += `<g transform="translate(1560,575)"><rect x="-22" y="-6" width="44" height="12" fill="${C('#2E6A3A')}" stroke="${OUTL}" stroke-width="1.5"/><rect x="${-22 + SX}" y="${-6 + SY}" width="44" height="12" fill="#000" opacity=".2"/></g>`;
    return t;
  }
}
function aerial(t, d) {
  const lit = lightK(d), key = Math.round(lit * 100);
  if (!AER[key]) AER[key] = buildAerial(lit);
  def(AER[key].df);
  let s = AER[key].s;
  // elementos vivos: picape levantando poeira na estrada, sombras de nuvem
  const px = 4200 - t * 230;
  if (px > 1600) {
    for (let k = 0; k < 7; k++) s += `<circle cx="${f1(px + 40 + k * 46)}" cy="${f1(540 + Math.sin(k + t) * 6)}" r="${f1(16 + k * 9)}" fill="#D8C8A0" opacity="${op(.4 - k * .05)}" filter="url(#b12)"/>`;
    s += `<g transform="translate(${f1(px)},540)"><rect x="-24" y="-9" width="48" height="20" rx="4" fill="#000" opacity=".25" transform="translate(-10,5)"/><rect x="-24" y="-10" width="48" height="20" rx="4" fill="${mix('#20140C', '#B8382C', lit)}" stroke="${OUTL}" stroke-width="1.5"/><rect x="-20" y="-7" width="14" height="14" rx="2" fill="${mix('#20140C', '#2A3440', lit)}"/><rect x="0" y="-7" width="20" height="14" fill="${mix('#20140C', '#7A2A20', lit)}"/></g>`;
  }
  [[-2600, -1400, 1500, 900], [1800, 2200, 1700, 1000], [-400, 3200, 1200, 800], [4200, -800, 1400, 900]].forEach(([x, y, rx, ry], i) => s += `<ellipse cx="${f1(x + t * 55)}" cy="${f1(y + t * 12)}" rx="${rx}" ry="${ry}" fill="url(#cloudSh)" opacity="${f1(lit)}"/>`);
  return s;
}
/* ---------- retrato (foto real se houver) ---------- */
function photoFrame(x, y, w, h, i, rot = 0, sepia = 1) {
  const id = nid('pf');
  def(`<clipPath id="${id}"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}"/></clipPath>`);
  let g = `<g transform="translate(${x},${y}) rotate(${rot})"><rect x="${-w / 2 - 22}" y="${-h / 2 - 22}" width="${w + 44}" height="${h + 44}" fill="#6A4428" stroke="${OUTL}" stroke-width="5"/><rect x="${-w / 2 - 10}" y="${-h / 2 - 10}" width="${w + 20}" height="${h + 20}" fill="#C8A060"/>`;
  if (FOTOS.length) g += `<image href="${FOTOS[i % FOTOS.length]}" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"${sepia ? ' filter="url(#sepiaF)"' : ''}/>`;
  else g += `<g clip-path="url(#${id})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#D8C8A0"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="url(#paperP)" opacity=".5"/>${man({ x: -w * .18, y: h * .95, s: h / 620, kind: 'elsiej', shadow: 0, armF: [10, 10] })}${man({ x: w * .2, y: h * .95, s: h / 600, kind: 'rudyj', shadow: 0, flip: -1, armF: [10, 10] })}<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" fill="#8A6A3A" opacity=".25"/></g>`;
  g += `<path d="M${-w / 2} ${-h / 2} L${w / 2} ${-h / 2} L${-w / 2} ${h / 2}Z" fill="#fff" opacity=".1"/>`;
  return g + '</g>';
}
const BOX = (n, label, x = 960, y = 200) => `<g transform="translate(${x},${y})"><rect x="-230" y="-80" width="460" height="160" rx="24" fill="#0A0806" opacity=".6"/><rect x="-230" y="-80" width="460" height="160" rx="24" fill="none" stroke="#FFE2A8" stroke-width="3" opacity=".6"/><text x="0" y="22" text-anchor="middle" font-family="'DejaVu Sans Mono',monospace" font-weight="700" font-size="90" fill="#FFF3D6">${n}</text><text x="0" y="62" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="26" letter-spacing="6" fill="#FFD27A">${label}</text></g>`;

/* ========== c1: drone descendo sobre a pradaria até a cidade; amanhecer ========== */
function c1(t) {
  const { L, d } = loc(t, 'c1');
  let s = '';
  if (L < 8.6) {
    const p = easeInOut(range(L, 0, 8.4)), z = .18 * Math.pow(2.6 / .18, p);
    setCam(lerp(960, 960, p), lerp(540, 540, p), z, lerp(-12, 0, p), [960, 540, 1]);
    const a0 = range(L, 8.1, 8.6);
    s += `<g opacity="${op(1 - a0)}">` + lay(1, aerial(t, .3)) + '</g>';
    // atmosfera: neblina de altitude + luz dourada do sol nascendo a leste
    def(`<linearGradient id="sunG" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC27A" stop-opacity=".55"/><stop offset=".5" stop-color="#FFE0B0" stop-opacity=".12"/><stop offset="1" stop-color="#5A6A9A" stop-opacity=".25"/></linearGradient><radialGradient id="flareG" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE6B0" stop-opacity=".55"/><stop offset="1" stop-color="#FFE6B0" stop-opacity="0"/></radialGradient>`);
    s += `<rect width="1920" height="1080" fill="#DCE4EC" opacity="${op(.16 * (1 - p) * (1 - a0))}"/><rect width="1920" height="1080" fill="url(#sunG)" style="mix-blend-mode:soft-light" opacity="${op(1 - a0)}"/><rect width="1920" height="1080" fill="url(#sunG)" opacity="${op(.22 * (1 - a0))}"/><ellipse cx="1900" cy="60" rx="900" ry="600" fill="url(#flareG)" opacity="${op(1 - a0)}"/>`;
    // nuvens passando por baixo da câmera (profundidade): bolos de cúmulo com base sombreada
    for (let i = 0; i < 4; i++) { const pp = range(L, i * 1.3, i * 1.3 + 2.8); if (pp > 0 && pp < 1) { const cx = -500 + i * 470 + pp * 1100, cy = 240 + (i % 3) * 280, sc = .7 + pp * 1.6, a = op(Math.sin(pp * Math.PI) * .42); let cl = ''; [[-260, 30, 260, 120], [-60, -40, 300, 160], [200, 10, 280, 130], [40, 70, 420, 110]].forEach(([dx, dy, rx, ry]) => cl += `<ellipse cx="${dx}" cy="${dy + 26}" rx="${rx}" ry="${ry}" fill="#9AA0B4" opacity=".5"/><ellipse cx="${dx}" cy="${dy}" rx="${rx}" ry="${ry}" fill="#FBF6EE"/><ellipse cx="${dx + 40}" cy="${dy - 30}" rx="${rx * .6}" ry="${ry * .5}" fill="#FFFFFF" opacity=".8"/>`); s += `<g transform="translate(${f1(cx)},${cy}) scale(${f1(sc * 100) / 100})" opacity="${a}" filter="url(#b30)">${cl}</g>`; } }
    // bando de pássaros cruzando abaixo do drone
    const bp = range(L, 2.4, 7.4); if (bp > 0 && bp < 1) for (let k = 0; k < 9; k++) { const bx = lerp(-200, 2100, bp) - Math.abs(k - 4) * 34, by = 760 - bp * 300 + (k - 4) * 22, fl = Math.sin(t * 14 + k) * 7; s += `<path d="M${f1(bx - 12)} ${f1(by - fl)} Q${f1(bx - 5)} ${f1(by - 4)} ${f1(bx)} ${f1(by)} Q${f1(bx + 5)} ${f1(by - 4)} ${f1(bx + 12)} ${f1(by - fl)}" stroke="#1A1A20" stroke-width="2.6" fill="none"/><path d="M${f1(bx - 46)} ${f1(by + 34 - fl)} Q${f1(bx - 39)} ${f1(by + 30)} ${f1(bx - 34)} ${f1(by + 34)} Q${f1(bx - 29)} ${f1(by + 30)} ${f1(bx - 22)} ${f1(by + 34 - fl)}" stroke="#000" stroke-width="2.4" fill="none" opacity=".18"/>`; }
  }
  if (L > 8.1) {
    const a = range(L, 8.1, 8.6), p = easeOut(range(L, 7.6, d));
    setCam(lerp(700, 620, p), lerp(560, 600, p), lerp(.62, .72, p), 0, [700, 560, .62]);
    s += `<g opacity="${op(a)}">${townSide(t, lerp(.24, .29, range(L, 7.6, d)), { houses: HOUSES.map(() => ({ lit: 0, ruin: 1 })), elsieLit: 1, tavernLit: 0 })}</g>`;
  }
  return s;
}
/* ========== c2: placa da estrada; a casa acende; Elsie sai na varanda ========== */
function c2(t) {
  const { L, d } = loc(t, 'c2'), [hx, hy] = HH(t);
  let s = '';
  if (L < 3.6) {
    setCam(lerp(900, 1000, L / 3.6) + hx, 560 + hy, lerp(1.25, 1.35, L / 3.6), 0, [960, 560, 1]);
    s += lay(.05, sky(.3, t)) + lay(.4, prairie(.3, t));
    s += lay(1, `<rect x="-1500" y="${GND + 60}" width="5000" height="400" fill="#4A4A50"/><rect x="-1500" y="${GND + 180}" width="5000" height="10" fill="#E8D890" opacity=".7"/><g transform="translate(960,${GND + 40})"><rect x="-10" y="-300" width="20" height="300" fill="#6A6A70" stroke="${OUTL}" stroke-width="3"/><rect x="-230" y="-460" width="460" height="200" rx="16" fill="#1E6A3A" stroke="#F4F4F0" stroke-width="8"/><text x="0" y="-370" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="74" fill="#F4F4F0">MONOWI</text><text x="0" y="-292" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="46" fill="#F4F4F0">POP. 1</text></g>`);
    const cx = lerp(-1200, 3200, range(L, .6, 2.4));
    if (L > .6 && L < 2.4) s += lay(1.2, `<g transform="translate(${f1(cx)},${GND + 160}) scale(1.2)"><path d="M-260 -40 L-200 -140 L120 -140 L200 -60 L270 -50 L270 40 L-260 40Z" fill="#3A5A8A" stroke="${OUTL}" stroke-width="6"/><circle cx="-150" cy="44" r="56" fill="#1A1A1E"/><circle cx="160" cy="44" r="56" fill="#1A1A1E"/></g>`, 'mblur');
  } else {
    const L2 = L - 3.6, k2 = L2 / (d - 3.6);
    setCam(lerp(250, 230, k2) + hx, lerp(770, 780, k2) + hy, lerp(3.0, 3.6, easeInOut(k2)), 0, [700, 560, 1]);
    const dd = .3;
    s += townSide(t, dd, { houses: HOUSES.map(() => ({ lit: 0, ruin: 1 })), elsieLit: 1, tavernLit: 0 });
    const out = easeOut(range(L2, .3, 2.0));
    s += lay(1, `<rect x="40" y="${GND - 20}" width="260" height="22" fill="#6A4A30" stroke="${OUTL}" stroke-width="3"/>` + man({ x: lerp(160, 250, out), y: GND, s: .1, kind: 'idosa', ...walkPose(L2 * 5, out < 1 ? .6 : 0), armF: out >= 1 ? [20, 60] : [20, 10], held: out >= 1 ? `<g><rect x="-20" y="-10" width="40" height="44" rx="8" fill="#F4F0E8" stroke="${OUTL}" stroke-width="3"/><path d="M20 0 q16 0 16 14 q0 14 -16 14" stroke="#F4F0E8" stroke-width="6" fill="none"/></g>` + steamC(0, -20, t) : '' }));
  }
  return s;
}
const steamC = (x, y, t) => [0, 1].map(i => { const p = (t * .5 + i * .5) % 1; return `<path d="M${x + i * 10} ${f1(y - p * 60)} q10 -12 0 -24" stroke="#fff" stroke-width="5" fill="none" opacity="${op((1 - p) * .6)}"/>`; }).join('');

/* ========== c3: a cidade de 1930 se apagando até 2004 ========== */
function trainArt(x) { let g = `<g transform="translate(${f1(x)},${GND - 30})"><rect x="0" y="-150" width="240" height="120" rx="10" fill="#2A2A30" stroke="${OUTL}" stroke-width="5"/><rect x="180" y="-220" width="50" height="80" fill="#2A2A30" stroke="${OUTL}" stroke-width="4"/><circle cx="60" cy="-20" r="34" fill="#1A1A1E"/><circle cx="180" cy="-20" r="34" fill="#1A1A1E"/>`; for (let c = 1; c < 6; c++) g += `<rect x="${-c * 260}" y="-130" width="240" height="100" rx="8" fill="${['#6A2A22', '#4A4A2A', '#2A4A5A'][c % 3]}" stroke="${OUTL}" stroke-width="4"/><circle cx="${-c * 260 + 50}" cy="-20" r="28" fill="#1A1A1E"/><circle cx="${-c * 260 + 190}" cy="-20" r="28" fill="#1A1A1E"/>`; return g + '</g>'; }
function c3(t) {
  const { L, d } = loc(t, 'c3'), [hx, hy] = HH(t);
  const prog = range(L, 3.5, d - 2.5), year = Math.round(lerp(1930, 2004, prog)), pop = Math.max(2, Math.round(150 * Math.pow(1 - prog, 1.6))) - (prog >= .999 ? 1 : 0);
  const dcy = prog > 0 && prog < 1 ? (.55 + prog * 7.5) % 1 : (prog >= 1 ? .9 : .6);
  setCam(lerp(560, 640, L / d) + hx, lerp(600, 560, L / d) + hy, lerp(.62, .55, L / d), 0, [700, 560, .62]);
  const houses = HOUSES.map((h, i) => { const off = (i + 1) / (HOUSES.length + 1); return { lit: prog < off ? 1 : 0, ruin: clamp((prog - off) * 3) }; });
  let extra = '';
  // pessoas e carroças em 1930
  if (prog < .25) { const a = 1 - prog * 4; for (let i = 0; i < 8; i++) extra += `<g opacity="${op(a)}">${man({ x: ((i * 260 + L * 60 * (i % 2 ? 1 : -1)) % 3400) - 900, y: GND + 20 + (i % 3) * 30, s: .1, kind: ['civil', 'civil2', 'rudyj', 'elsiej', 'turista'][i % 5], ...walkPose(L * 6 + i, 1), flip: i % 2 ? 1 : -1 })}</g>`; }
  // trem passando (cada vez menos)
  const tr = L < 3.2 ? lerp(-1500, 3200, L / 3.2) : null;
  if (tr !== null) extra += `<rect x="-1500" y="${GND - 34}" width="5000" height="10" fill="#4A3A2A"/>` + trainArt(tr) + `<circle cx="${f1(tr + 200)}" cy="${GND - 260}" r="80" fill="#C8C8C8" opacity=".5" filter="url(#b30)"/>`;
  else extra += `<rect x="-1500" y="${GND - 34}" width="5000" height="10" fill="#4A3A2A" opacity="${op(1 - prog)}"/>`;
  let s = townSide(t, dcy, { houses, elsieLit: 1, tavernLit: prog > .55 ? 1 : 0, extra });
  if (prog > 0) s += BOX(year, 'ANO', 700, 190) + BOX(pop, 'MORADORES', 1220, 190);
  return s + `<rect width="1920" height="1080" fill="#3A2A10" opacity="${op(.3 * (1 - prog))}" style="mix-blend-mode:multiply"/>`;
}
/* ========== c4: Elsie e Rudy; a taverna; a cadeira vazia ========== */
function c4(t) {
  const { L, d } = loc(t, 'c4'), [hx, hy] = HH(t);
  let s = '';
  if (L < 5.6) {   // 1971: o casal compra a taverna
    setCam(lerp(520, 600, L / 5.6) + hx, 680 + hy, lerp(1.9, 2.1, L / 5.6), 0, [560, 600, 1]);
    s += lay(.05, sky(.45, t)) + lay(.4, prairie(.45, t).split('<rect x="-1500"')[0]) + lay(1, prairie(.45, t) + tavern(560, 1.1, 1, 0) + `<g transform="translate(860,${GND - 90})"><rect x="-6" y="0" width="12" height="90" fill="#6A4A30"/><rect x="-80" y="-70" width="160" height="80" fill="#F4F0E4" stroke="${OUTL}" stroke-width="4"/><text x="0" y="-18" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="40" fill="#C83A3A" transform="rotate(${f1(-8 * easeOut(range(L, 1.6, 2.2)))})">${L > 1.8 ? 'SOLD' : 'FOR SALE'}</text></g>`);
    s += lay(1, man({ x: 380, y: GND + 30, s: .21, kind: 'rudyj', armF: [L > 2 ? 160 : 20, 10] }) + man({ x: 450, y: GND + 30, s: .2, kind: 'elsiej', armF: [40, 40], armB: [20, 20] }));
    s += `<rect width="1920" height="1080" fill="#C88A3A" opacity=".18" style="mix-blend-mode:multiply"/>` + BOX(1971, 'ANO', 1500, 200);
  } else if (L < 10.2) {   // 2000: os dois na varanda ao pôr do sol
    const L2 = L - 5.6;
    setCam(lerp(220, 260, L2 / 4.6) + hx, 790 + hy, lerp(3.0, 3.3, L2 / 4.6), 0, [560, 600, 1]);
    s += townSide(t, .76, { houses: HOUSES.map(() => ({ lit: 0, ruin: 1 })), elsieLit: 0, tavernLit: 1 });
    s += lay(1, `<rect x="60" y="${GND - 24}" width="300" height="24" fill="#6A4A30"/>` + man({ x: 190, y: GND - 10, s: .09, kind: 'rudy', drop: 200, legF: [85, -80], legB: [80, -80], armF: [40, 40] }) + man({ x: 245, y: GND - 10, s: .088, kind: 'idosa', drop: 200, legF: [85, -80], legB: [80, -80], armF: [40, 40], flip: -1 }));
    s += BOX(2000, 'POPULAÇÃO: 2', 1420, 200);
  } else {   // 2004: a cadeira vazia e o retrato
    const L2 = L - 10.2, k2 = L2 / (d - 10.2);
    setCam(lerp(980, 900, k2) + hx * .5, lerp(560, 520, k2) + hy * .5, lerp(1.0, 1.25, easeInOut(k2)), 0, [960, 540, 1]);
    const rock = Math.sin(t * 1.6) * 6 * (1 - k2);
    let r = `<rect x="-400" y="-400" width="2800" height="1900" fill="#1A1410"/><rect x="-400" y="-400" width="2800" height="1900" fill="url(#wallP)" opacity=".15"/><rect x="-400" y="820" width="2800" height="600" fill="#2A1C12"/><rect x="-400" y="820" width="2800" height="600" fill="url(#woodP)" opacity=".4"/>`;
    r += `<g transform="translate(1500,200)"><rect x="-160" y="-60" width="320" height="380" fill="#3A5A8A"/><path d="M0 -60 L0 320 M-160 130 L160 130" stroke="#2A1C12" stroke-width="16"/>${Array.from({ length: 14 }, (_, i) => { const p = (t * 1.3 + i * .07) % 1; return `<line x1="${-150 + (i * 47) % 300}" y1="${f1(-60 + p * 380)}" x2="${-154 + (i * 47) % 300}" y2="${f1(-30 + p * 380)}" stroke="#BFD4F0" stroke-width="3" opacity=".6"/>`; }).join('')}<rect x="-180" y="-80" width="360" height="420" fill="none" stroke="#2A1C12" stroke-width="20"/></g>`;
    r += `<path d="M1340 140 L1660 140 L1300 1000 L800 1000Z" fill="#9AB4D8" opacity=".08"/>`;
    r += `<g transform="translate(560,820) rotate(${f1(rock)} 0 0)"><path d="M-120 -40 L-120 -360 Q-120 -390 -90 -390 L90 -390 Q120 -390 120 -360 L120 -40" fill="#5A3A22" stroke="${OUTL}" stroke-width="6"/><rect x="-140" y="-60" width="280" height="40" rx="10" fill="#6A4428" stroke="${OUTL}" stroke-width="5"/><path d="M-150 0 Q0 40 150 0" stroke="#4A2E1A" stroke-width="16" fill="none"/><rect x="-110" y="-20" width="14" height="40" fill="#4A2E1A"/><rect x="96" y="-20" width="14" height="40" fill="#4A2E1A"/><path d="M-100 -360 L100 -360 L100 -80 L-100 -80Z" fill="#8A3A2A" opacity=".5"/></g>`;
    r += `<rect x="900" y="560" width="520" height="40" fill="#4A2E1A" stroke="${OUTL}" stroke-width="5"/>` + photoFrame(1160, 430, 200, 240, 0, -3) + `<circle cx="1000" cy="520" r="200" fill="url(#gWarm)" opacity=".6"/><g transform="translate(1010,560)"><rect x="-12" y="-60" width="24" height="60" fill="#F4EEE0"/><path d="M0 -60 Q${f1(8 + 4 * Math.sin(t * 9))} -80 0 -96 Q-8 -80 0 -60Z" fill="#FFC85A"/></g>`;
    s += lay(1, r);
    s += lay(1.2, man({ x: lerp(1900, 1700, easeOut(range(L2, 0, 2.5))), y: 1060, s: .62, kind: 'idosa', flip: -1, ...walkPose(L2 * 4, L2 < 2.5 ? .5 : 0), armF: L2 > 2.5 ? [60, 30] : [20, 10] }), 'b4');
    s += BOX(2004, 'POPULAÇÃO: 1', 520, 200);
  }
  return s;
}
/* ========== c5: a eleição — ela vota nela mesma ========== */
function c5(t) {
  const { L, d } = loc(t, 'c5'), [hx, hy] = HH(t, .6);
  let s = '';
  const room = `<rect x="-400" y="-400" width="2800" height="1900" fill="#2A1C14"/><rect x="-400" y="-400" width="2800" height="1900" fill="url(#woodP)" opacity=".35"/><rect x="-400" y="880" width="2800" height="600" fill="#1E140E"/>`;
  if (L < 5.2) {   // ela entra na cabine, luz dura de cima, suspense
    setCam(lerp(900, 980, L / 5.2) + hx, lerp(560, 520, L / 5.2) + hy, lerp(.9, 1.15, easeInOut(L / 5.2)), 0, [960, 540, 1]);
    let r = room + `<path d="M900 -100 L1060 -100 L1340 900 L620 900Z" fill="url(#beamW2)" opacity=".55"/><rect x="700" y="300" width="520" height="600" fill="#3A5A8A" stroke="${OUTL}" stroke-width="6"/><rect x="700" y="300" width="520" height="70" fill="#C83A3A" stroke="${OUTL}" stroke-width="5"/>${[0, 1, 2, 3, 4].map(i => `<path d="M${740 + i * 100} 316 l10 22 l24 2 l-18 16 l6 24 l-22 -12 l-22 12 l6 -24 l-18 -16 l24 -2Z" fill="#F4F4F0"/>`).join('')}<text x="960" y="470" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="54" fill="#F4F4F0">VOTE</text><path d="M760 900 L760 560 Q760 520 800 520 L1120 520 Q1160 520 1160 560 L1160 900" fill="#2A3A5A"/>`;
    s += lay(1, r);
    const wx = lerp(-200, 900, easeOut(range(L, .3, 3.6)));
    s += lay(1, man({ x: wx, y: 1000, s: .62, kind: 'idosa', ...walkPose(L * 5, L < 3.6 ? .6 : 0), armF: [60, 40], held: `<g transform="rotate(-20)"><rect x="-40" y="-30" width="80" height="60" fill="#F4F0E4" stroke="${OUTL}" stroke-width="3"/></g>` }));
    for (let i = 0; i < 4; i++) s += lay(1, `<circle cx="${f1(960 + Math.sin(t * .3 + i) * 300)}" cy="${f1(200 + ((t * 20 + i * 200) % 700))}" r="3" fill="#FFF0C0" opacity=".6"/>`);
  } else if (L < 9.6) {   // close na cédula: o X ao lado do nome dela
    const L2 = L - 5.2;
    setCam(960 + hx, 540 + hy, lerp(1.0, 1.15, L2 / 4.4), lerp(-2, 1, L2 / 4.4), [960, 540, 1]);
    let r = `<rect x="-400" y="-400" width="2800" height="1900" fill="#3A2A1C"/><rect x="-400" y="-400" width="2800" height="1900" fill="url(#woodP)" opacity=".5"/><g transform="translate(960,540) rotate(-3)"><rect x="-420" y="-300" width="840" height="600" fill="#F4F0E4" stroke="${OUTL}" stroke-width="5"/><rect x="-420" y="-300" width="840" height="80" fill="#2A3A5A"/><text x="0" y="-246" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="40" fill="#F4F0E4">MONOWI · MAYOR</text>`;
    r += `<rect x="-340" y="-140" width="70" height="70" fill="#fff" stroke="${OUTL}" stroke-width="5"/><text x="-240" y="-88" font-family="'DejaVu Serif',serif" font-weight="700" font-size="50" fill="#1A1A22">ELSIE EILER</text>`;
    r += `<rect x="-340" y="20" width="70" height="70" fill="#fff" stroke="${OUTL}" stroke-width="5" opacity=".5"/><path d="M-240 58 L250 58" stroke="#B8B0A0" stroke-width="5" stroke-dasharray="14 10"/>`;
    const xk = range(L2, 1.2, 2.0);
    if (xk > 0) r += `<path d="M-330 -130 L${f1(-330 + 50 * Math.min(1, xk * 2))} ${f1(-130 + 50 * Math.min(1, xk * 2))}" stroke="#1A3A9A" stroke-width="12" stroke-linecap="round"/>${xk > .5 ? `<path d="M-280 -130 L${f1(-280 - 50 * (xk - .5) * 2)} ${f1(-130 + 50 * (xk - .5) * 2)}" stroke="#1A3A9A" stroke-width="12" stroke-linecap="round"/>` : ''}`;
    r += `</g>`;
    s += lay(1, r) + vhand('pinca', lerp(900, 660, range(L2, .4, 1.2)) - (xk > 0 && xk < 1 ? 20 * Math.sin(xk * 20) : 0), lerp(900, 440, range(L2, .4, 1.2)), .55, 10);
  } else {   // urna: uma cédula cai; contagem 1 voto = 100%
    const L2 = L - 9.6, k2 = L2 / (d - 9.6);
    setCam(960 + hx, 560 + hy, lerp(1.1, .95, k2), 0, [960, 540, 1]);
    let r = room + `<path d="M820 -100 L1100 -100 L1300 900 L620 900Z" fill="url(#beamW2)" opacity=".5"/><g transform="translate(960,900)"><path d="M-200 0 L-200 -320 L200 -320 L200 0Z" fill="#8AB0D0" fill-opacity=".45" stroke="#F4F4F0" stroke-width="6"/><rect x="-220" y="-340" width="440" height="30" fill="#2A3A5A" stroke="${OUTL}" stroke-width="4"/><rect x="-60" y="-336" width="120" height="14" fill="#0A0A10"/><path d="M-180 -300 L-180 -20" stroke="#fff" stroke-width="10" opacity=".3"/>`;
    const fall = easeIn(range(L2, .2, 1.0));
    r += `<g transform="translate(${f1(Math.sin(fall * 9) * 20)},${f1(lerp(-500, -40, fall))}) rotate(${f1(fall * 30)})"><rect x="-50" y="-34" width="100" height="68" fill="#F4F0E4" stroke="${OUTL}" stroke-width="3"/></g></g>`;
    s += lay(1, r);
    if (L2 > 1.6) { const pc = Math.round(100 * easeOut(range(L2, 1.6, 2.6))); s += BOX(pc + '%', '1 VOTO', 960, 220); }
    if (L2 > 2.7) for (let i = 0; i < 40; i++) { const p = (L2 - 2.7) * .5 + i * .02, x = (i * 173) % 1920, y = -40 + ((p * 600 + i * 47) % 1200); s += `<rect x="${x}" y="${f1(y)}" width="14" height="22" fill="${['#E84A4A', '#4A7AE8', '#F2C832', '#F4F4F0'][i % 4]}" transform="rotate(${f1(t * 200 + i * 40)} ${x + 7} ${f1(y + 11)})" opacity=".8"/>`; }
  }
  return s;
}
/* ========== c6: a papelada — pede a licença e aprova o próprio pedido ========== */
function c6(t) {
  const { L, d, k } = loc(t, 'c6'), [hx, hy] = HH(t, .5);
  setCam(lerp(900, 1020, k) + hx, lerp(560, 600, k) + hy, lerp(.95, 1.1, k), 0, [960, 540, 1]);
  let r = `<rect x="-400" y="-400" width="2800" height="1900" fill="#14100C"/><rect x="-400" y="-400" width="2800" height="1900" fill="url(#wallP)" opacity=".12"/>`;
  r += `<g transform="translate(1560,300)"><rect x="-150" y="-110" width="300" height="240" fill="#0C1430"/>${[0, 1, 2].map(i => `<g transform="translate(${-90 + i * 90},40)"><rect x="-3" y="-80" width="6" height="80" fill="#2A2C34"/><circle cx="0" cy="-84" r="${f1(10 + 2 * Math.sin(t * 3 + i))}" fill="#FFF0C0"/><circle cx="0" cy="-84" r="40" fill="#FFF0C0" opacity=".2"/></g>`).join('')}<rect x="-160" y="-120" width="320" height="260" fill="none" stroke="#2A1C12" stroke-width="18"/></g>`;
  r += `<rect x="300" y="680" width="1320" height="60" fill="#5A3A22" stroke="${OUTL}" stroke-width="6"/><rect x="340" y="740" width="40" height="400" fill="#4A2E1A"/><rect x="1540" y="740" width="40" height="400" fill="#4A2E1A"/>`;
  r += `<g transform="translate(960,520)"><path d="M-60 160 L-20 0 L20 0 L60 160Z" fill="#2A5A3A"/><path d="M-120 0 Q0 -80 120 0Z" fill="#2A6A4A" stroke="${OUTL}" stroke-width="4"/></g><path d="M840 520 L1080 520 L1300 680 L620 680Z" fill="#FFE8A8" opacity=".25"/>`;
  // dois formulários: PEDIDO (esq.) e APROVAÇÃO (dir.)
  const form = (x, title, filled, stamp) => `<g transform="translate(${x},676)"><path d="M-130 0 L-110 -40 L110 -40 L130 0Z" fill="#F4F0E4" stroke="${OUTL}" stroke-width="3"/><text x="0" y="-14" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="18" fill="#2A2A30">${title}</text>${filled ? `<path d="M-90 -6 q20 -10 40 0 t40 0" stroke="#1A3A9A" stroke-width="3" fill="none"/>` : ''}${stamp > 0 ? `<g transform="translate(60,-26) scale(${f1(backOut(stamp) * 100) / 100}) rotate(-12)"><rect x="-56" y="-16" width="112" height="32" fill="none" stroke="#C83A3A" stroke-width="4"/><text x="0" y="8" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="18" fill="#C83A3A">APROVADO</text></g>` : ''}</g>`;
  const phase = L < 6 ? 0 : 1, stamp = range(L, 10.6, 11.0);
  r += form(760, 'PEDIDO', L > 3, 0) + form(1160, 'APROVAÇÃO', L > 9.5, stamp);
  r += `<g transform="translate(1100,560)"><rect x="-26" y="-60" width="52" height="60" fill="#3A3A40" stroke="${OUTL}" stroke-width="3"/><rect x="-36" y="0" width="72" height="16" fill="#C83A3A"/></g>`;
  // cadeiras dos dois lados da mesa
  r += `<g transform="translate(600,1000)"><rect x="-60" y="-300" width="20" height="300" fill="#4A2E1A"/><rect x="-60" y="-120" width="140" height="24" fill="#5A3A22"/></g><g transform="translate(1320,1000)"><rect x="40" y="-300" width="20" height="300" fill="#4A2E1A"/><rect x="-80" y="-120" width="140" height="24" fill="#5A3A22"/></g>`;
  let s = lay(1, r);
  // ela: escreve do lado esquerdo (como moradora), levanta, dá a volta, senta do lado direito e carimba (como prefeita)
  let ex, sit, fl, arm;
  if (L < 5.2) { ex = 640; sit = 1; fl = 1; arm = [100, -20 + 10 * Math.sin(L * 14)]; }
  else if (L < 8.6) { const w = easeInOut(range(L, 5.4, 8.4)); ex = lerp(640, 1290, w); sit = 1 - range(L, 5.2, 5.6) + range(L, 8.2, 8.6); fl = w < .5 ? 1 : -1; arm = [20, 10]; }
  else { ex = 1290; sit = 1; fl = -1; arm = L > 10.3 && L < 11.2 ? [lerp(120, 60, Math.sin(range(L, 10.3, 11.2) * Math.PI)), -10] : [90, -10 + 10 * Math.sin(L * 14)]; }
  const walkA = L > 5.6 && L < 8.2 ? .6 : 0;
  s += lay(1, man({ x: ex, y: 1000, s: .55, kind: 'idosa', flip: fl, drop: 190 * sit, legF: sit > .5 ? [85, -80] : walkPose(L * 5, walkA).legF, legB: sit > .5 ? [80, -80] : walkPose(L * 5, walkA).legB, armF: arm, held: L < 5.2 || (L > 9 && L < 10.3) ? `<path d="M0 0 l40 30" stroke="#1A1A22" stroke-width="7"/>` : '' }));
  if (stamp > 0 && stamp < 1) s += `<rect width="1920" height="1080" fill="#fff" opacity="${op(.15 * (1 - stamp))}"/>`;
  return s;
}
/* ========== c7: a biblioteca do Rudy ========== */
const BOOKC = ['#8A2A22', '#2A4A7A', '#3A6A3A', '#C8A040', '#5A3A6A', '#A85A2A', '#2A2A30', '#7A7A40'];
function shelf(x, y, w, n, seed) { let s = `<rect x="${x}" y="${y}" width="${w}" height="16" fill="#5A3A22" stroke="${OUTL}" stroke-width="3"/>`; let cx = x + 6; for (let i = 0; i < n && cx < x + w - 20; i++) { const bw = 18 + ((i * 7 + seed) % 5) * 5, bh = 110 + ((i * 13 + seed) % 6) * 12; s += `<rect x="${cx}" y="${y - bh}" width="${bw}" height="${bh}" fill="${BOOKC[(i + seed) % 8]}" stroke="${OUTL}" stroke-width="2"/><line x1="${cx + 3}" y1="${y - bh + 14}" x2="${cx + bw - 3}" y2="${y - bh + 14}" stroke="#E8D8A0" stroke-width="3" opacity=".7"/>`; cx += bw + 2; } return s; }
function c7(t) {
  const { L, d, k } = loc(t, 'c7'), [hx, hy] = HH(t, .6);
  let s = '';
  if (L < 3.4) {
    setCam(lerp(1060, 1090, L / 3.4) + hx, 720 + hy, lerp(2.4, 2.7, L / 3.4), 0, [700, 560, 1]);
    s += townSide(t, .72, { houses: HOUSES.map(() => ({ lit: 0, ruin: 1 })), libLit: 1 });
  } else {
    const L2 = L - 3.4, k2 = L2 / (d - 3.4);
    setCam(lerp(860, 1040, k2) + hx, lerp(560, 520, k2) + hy, lerp(1.0, 1.12, easeInOut(k2)), 0, [960, 540, 1]);
    let r = `<rect x="-400" y="-400" width="2800" height="1900" fill="#3A2A1C"/><rect x="-400" y="900" width="2800" height="600" fill="#2A1C12"/><rect x="-400" y="900" width="2800" height="600" fill="url(#woodP)" opacity=".4"/>`;
    for (let c = 0; c < 4; c++) for (let rr = 0; rr < 5; rr++) r += shelf(80 + c * 460, 220 + rr * 160, 420, 22, c * 5 + rr * 3);
    r += `<path d="M1500 -100 L1760 -100 L1100 1000 L700 1000Z" fill="#FFE2A0" opacity=".14"/>` + dust(t, '#FFE6B0', .8).replace(/1920/g, '1920');
    r += photoFrame(1000, 140, 140, 170, 1, 2);
    s += lay(1, r);
    const reach = easeInOut(range(L2, 1.4, 2.6));
    s += lay(1, man({ x: lerp(1500, 1180, easeOut(range(L2, 0, 1.4))), y: 1040, s: .62, kind: 'idosa', flip: -1, ...walkPose(L2 * 5, L2 < 1.4 ? .6 : 0), armF: [lerp(30, 150, reach), -10], held: reach > 0 && reach < 1 ? `<rect x="-14" y="-40" width="28" height="80" fill="#8A2A22" stroke="${OUTL}" stroke-width="3"/>` : '' }));
  }
  return s;
}
/* ========== c8: a taverna famosa ========== */
function plate(x, y, i) { const c = [['#F4F0E4', '#1A3A8A'], ['#F2D040', '#1A1A22'], ['#E8E8E8', '#C83A3A'], ['#2A5A3A', '#F4F0E4'], ['#F4F0E4', '#2A6A3A']][i % 5]; return `<g transform="translate(${x},${y}) rotate(${(i * 7) % 9 - 4})"><rect x="-60" y="-30" width="120" height="60" rx="6" fill="${c[0]}" stroke="${OUTL}" stroke-width="3"/><rect x="-46" y="-8" width="92" height="16" fill="${c[1]}" opacity=".7"/></g>`; }
function c8(t) {
  const { L, d, k } = loc(t, 'c8'), [hx, hy] = HH(t, .7);
  let s = '';
  if (L < 3.8) {   // carros chegando de todo lado
    setCam(lerp(560, 700, L / 3.8) + hx, 720 + hy, 1.6, 0, [560, 600, 1]);
    s += lay(.05, sky(.5, t)) + lay(.4, prairie(.5, t).split('<rect x="-1500"')[0]) + lay(1, prairie(.5, t) + tavern(560, 1.0, 1, 1, { beer: 1 }) + library(1080, .85, 1));
    for (let i = 0; i < 6; i++) { const p = range(L, i * .45, i * .45 + 2.6), x = lerp(-900 + (i % 2) * 3600, 240 + i * 110, easeOut(p)); s += lay(1, `<g transform="translate(${f1(x)},${GND + 70 + (i % 3) * 30}) scale(${f1((i % 2 ? -1 : 1) * .3 * 100) / 100},.3)"><path d="M-260 -40 L-200 -140 L120 -140 L200 -60 L270 -50 L270 40 L-260 40Z" fill="${['#C83A3A', '#3A6AC8', '#E8C040', '#3A8A5A', '#8A8A90', '#2A2A30'][i]}" stroke="${OUTL}" stroke-width="6"/><circle cx="-150" cy="44" r="56" fill="#1A1A1E"/><circle cx="160" cy="44" r="56" fill="#1A1A1E"/></g>`); }
  } else {   // dentro: chapa, gente, livro de visitas
    const L2 = L - 3.8, k2 = L2 / (d - 3.8);
    setCam(lerp(760, 1120, easeInOut(k2)) + hx, lerp(560, 540, k2) + hy, lerp(.92, 1.05, k2), 0, [960, 540, 1]);
    let r = `<rect x="-400" y="-400" width="2800" height="1900" fill="#4A2C1C"/><rect x="-400" y="-400" width="2800" height="1900" fill="url(#woodP)" opacity=".35"/>`;
    for (let i = 0; i < 18; i++) r += plate(-200 + (i % 9) * 240, 120 + Math.floor(i / 9) * 90, i);
    r += photoFrame(1700, 360, 150, 180, 2, -4) + photoFrame(1880, 380, 130, 160, 3, 5, 0);
    r += `<rect x="-400" y="600" width="2800" height="40" fill="#6A3A22" stroke="${OUTL}" stroke-width="5"/><rect x="-400" y="640" width="2800" height="260" fill="#4A2A18"/><rect x="-400" y="900" width="2800" height="600" fill="#2A1A10"/>`;
    for (let i = 0; i < 8; i++) r += `<g transform="translate(${-200 + i * 300},560)"><circle r="70" fill="#FFD07A" opacity=".18" filter="url(#b12)"/><circle cx="0" cy="-300" r="0"/></g><path d="M${-200 + i * 300} -400 L${-200 + i * 300} 460" stroke="#1A120C" stroke-width="3"/><path d="M${-230 + i * 300} 460 L${-170 + i * 300} 460 L${-180 + i * 300} 490 L${-220 + i * 300} 490Z" fill="#C88A3A"/><circle cx="${-200 + i * 300}" cy="500" r="14" fill="#FFF0C0"/>`;
    // chapa com hambúrgueres e fumaça
    r += `<rect x="420" y="560" width="300" height="40" fill="#2A2A30" stroke="${OUTL}" stroke-width="4"/>${[0, 1, 2].map(i => `<ellipse cx="${480 + i * 90}" cy="556" rx="34" ry="12" fill="#6A3A1A" stroke="${OUTL}" stroke-width="3"/>`).join('')}` + [0, 1, 2, 3].map(i => { const p = (t * .6 + i * .25) % 1; return `<path d="M${470 + i * 70} ${f1(540 - p * 160)} q20 -20 0 -40 q-20 -20 0 -40" stroke="#F4F0E8" stroke-width="10" fill="none" opacity="${op((1 - p) * .4)}" filter="url(#b4)"/>`; }).join('');
    s += lay(1, r);
    // Elsie atrás do balcão virando hambúrguer
    s += lay(1, man({ x: 560, y: 900, s: .5, kind: 'idosa', armF: [100 + 20 * Math.sin(t * 5), -40], held: `<rect x="-6" y="-6" width="70" height="12" fill="#A8ACB4" stroke="${OUTL}" stroke-width="2"/>` }) + `<rect x="-400" y="600" width="2800" height="40" fill="#6A3A22" stroke="${OUTL}" stroke-width="5"/><rect x="-400" y="640" width="2800" height="260" fill="#4A2A18"/>`);
    // visitantes no balcão e livro de visitas
    const V = [['turista', 960], ['civil2', 1200], ['motoq', 1460], ['civil', 1720], ['idoso', 2000]];
    let v = ''; V.forEach(([kd, x], i) => { const laugh = Math.max(0, Math.sin(t * 3 + i * 1.7)); const sip = i % 2 ? Math.max(0, Math.sin(t * 1.3 + i)) : 0; v += man({ x, y: 1120, s: .55, kind: kd, flip: -1, armF: [lerp(40, 120, sip), lerp(-30, 70, sip)], armB: [20, 10], mouth: laugh > .6 ? .6 : 0, lean: -laugh * 4, held: i % 2 ? `<g><rect x="-22" y="-50" width="44" height="62" rx="6" fill="#F2C040" stroke="${OUTL}" stroke-width="3" opacity=".9"/><rect x="-22" y="-56" width="44" height="12" fill="#fff"/></g>` : '' }); });
    s += lay(1.05, `<g transform="translate(1080,606) rotate(-3) scale(.62)"><rect x="-120" y="-20" width="240" height="30" fill="#8A2A22" stroke="${OUTL}" stroke-width="3"/><path d="M-110 -20 L0 -34 L110 -20" fill="#F4F0E4" stroke="${OUTL}" stroke-width="3"/>${Array.from({ length: Math.floor(range(L2, .5, 4) * 6) }, (_, i) => `<path d="M${-90 + (i % 3) * 30} ${-26 + Math.floor(i / 3) * 4} q6 -4 12 0" stroke="#1A3A9A" stroke-width="2" fill="none"/>`).join('')}</g>`);
    s += lay(1.05, v);
  }
  return s;
}
/* ========== c9: noite — ela apaga a última luz; a câmera sobe ========== */
function c9(t) {
  const { L, d } = loc(t, 'c9'), [hx, hy] = HH(t, .5);
  let s = '';
  const off = L > 4.4;
  if (L < 6.8) {
    setCam(lerp(520, 520, L / 6.8) + hx, lerp(760, 640, easeInOut(range(L, 3.6, 6.8))) + hy, lerp(2.6, 1.0, easeInOut(range(L, 3.6, 6.8))), 0, [700, 560, 1]);
    s += townSide(t, .95, { houses: HOUSES.map(() => ({ lit: 0, ruin: 1 })), tavernLit: off ? 0 : 1, elsieLit: 0, lampsOff: 0 });
    const out = easeInOut(range(L, 1.0, 3.6));
    s += lay(1, man({ x: lerp(560, 200, out), y: GND + 6, s: .18, kind: 'idosa', flip: -1, ...walkPose(L * 5, out > 0 && out < 1 ? .55 : 0) }));
    if (L > 4.3 && L < 4.6) s += `<rect width="1920" height="1080" fill="#000" opacity=".25"/>`;
  } else {
    const p = easeInOut(range(L, 6.8, d - .5)), z = 2.2 * Math.pow(.2 / 2.2, p);
    setCam(960, 540, z, lerp(0, 10, p), [960, 540, 1]);
    s += lay(1, aerial(t, .95)) + `<rect width="1920" height="1080" fill="#0A1438" opacity=".6" style="mix-blend-mode:multiply"/>` + STARS3.slice(0, 60).map(q => `<circle cx="${(q.x + 1100) % 1920}" cy="${(q.y + 300) % 1080}" r="${q.r}" fill="#fff" opacity="${op(.3 * p)}"/>`).join('');
    def(`<radialGradient id="homeG"><stop offset="0" stop-color="#FFE2A0" stop-opacity=".95"/><stop offset=".25" stop-color="#FFC060" stop-opacity=".5"/><stop offset="1" stop-color="#FF9A30" stop-opacity="0"/></radialGradient>`);
    s += lay(1, `<circle cx="640" cy="600" r="${f1(70 + 30 / Math.max(z, .3))}" fill="url(#homeG)" style="mix-blend-mode:screen"/><rect x="610" y="585" width="12" height="9" fill="#FFE2A0"/><rect x="652" y="585" width="12" height="9" fill="#FFE2A0"/>`);
    s += `<rect width="1920" height="1080" fill="#000" opacity="${op(range(L, d - 1.5, d))}"/>`;
  }
  return s;
}
const FN = { c1, c2, c3, c4, c5, c6, c7, c8, c9 };

function frame(t) {
  D = []; uid = 0;
  const sh = shotAt(t);
  let body = FN[sh[0]](t);
  for (const c of SH.slice(1)) if (t >= c[1] && t < c[1] + .08) body += `<rect width="1920" height="1080" fill="#fff" opacity="${op(.2 * (1 - (t - c[1]) / .08))}"/>`;
  defsEl.innerHTML = STATIC + objDefs() + `<filter id="manVol" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feOffset in="SourceAlpha" dx="-16" dy="8" result="o1"/><feComposite in="SourceAlpha" in2="o1" operator="out" result="e1"/><feGaussianBlur in="e1" stdDeviation="7" result="b1"/><feComposite in="b1" in2="SourceAlpha" operator="in" result="s1"/><feFlood flood-color="#1A1028" flood-opacity=".38"/><feComposite in2="s1" operator="in" result="sh"/><feOffset in="SourceAlpha" dx="7" dy="-7" result="o2"/><feComposite in="SourceAlpha" in2="o2" operator="out" result="e2"/><feGaussianBlur in="e2" stdDeviation="2.5" result="b2"/><feComposite in="b2" in2="SourceAlpha" operator="in" result="r1"/><feFlood flood-color="#FFF0D0" flood-opacity=".55"/><feComposite in2="r1" operator="in" result="rim"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="sh"/><feMergeNode in="rim"/></feMerge></filter><radialGradient id="gHot"><stop offset="0" stop-color="#FF3A1A" stop-opacity=".95"/><stop offset=".5" stop-color="#FF7A2A" stop-opacity=".6"/><stop offset="1" stop-color="#FFB03A" stop-opacity="0"/></radialGradient><filter id="bl6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
<linearGradient id="beamW2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF0C0" stop-opacity=".6"/><stop offset="1" stop-color="#FFF0C0" stop-opacity="0"/></linearGradient><filter id="mblur" x="-20%" y="-5%" width="140%" height="110%"><feGaussianBlur stdDeviation="30 0"/></filter><filter id="sepiaF" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".39 .77 .19 0 0  .35 .69 .17 0 0  .27 .53 .13 0 0  0 0 0 1 0"/></filter><pattern id="paperP" width="512" height="512" patternUnits="userSpaceOnUse"><image href="${PAPER}" width="512" height="512"/></pattern>
<pattern id="waveP" width="160" height="90" patternUnits="userSpaceOnUse"><path d="M10 30 q20 -14 40 0 t40 0 M90 70 q20 -14 40 0" stroke="#8AC0E8" stroke-width="3" fill="none"/></pattern>
<pattern id="dotP" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2" fill="#000" opacity=".25"/><circle cx="13" cy="12" r="1.5" fill="#000" opacity=".18"/></pattern>
<pattern id="wallP" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M60 10 L80 60 L60 110 L40 60Z" fill="none" stroke="#B8A888" stroke-width="3"/><circle cx="0" cy="0" r="8" fill="#C8B898"/><circle cx="120" cy="120" r="8" fill="#C8B898"/><circle cx="60" cy="60" r="5" fill="#C8B898"/></pattern>
<pattern id="woodP" width="300" height="70" patternUnits="userSpaceOnUse"><rect width="300" height="70" fill="none" stroke="#6A4A2A" stroke-width="3"/><path d="M10 25 q60 -8 120 0 t140 2 M20 50 q80 6 160 -2" stroke="#8A6A4A" stroke-width="2" fill="none"/></pattern>
<pattern id="brickP" width="80" height="40" patternUnits="userSpaceOnUse"><path d="M0 0 H80 M0 20 H80 M0 0 V20 M40 20 V40" stroke="#5A4A3A" stroke-width="3" fill="none"/></pattern>
<pattern id="crackP" width="260" height="200" patternUnits="userSpaceOnUse"><path d="M0 60 L70 40 L120 90 L200 60 L260 80 M70 40 L60 0 M120 90 L100 200 M200 60 L230 0 M120 90 L180 150 L260 140 M0 160 L60 150 L100 200" stroke="#7A4A20" stroke-width="5" fill="none"/></pattern>` + D.join('');
  root.innerHTML = body + TEXTURE + `<rect width="1920" height="1080" fill="url(#vig)" opacity=".8"/><rect x="0" y="0" width="1920" height="92" fill="#000"/><rect x="0" y="988" width="1920" height="92" fill="#000"/>`;
}
