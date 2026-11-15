/* =====================================================================================
   POR QUE A PIPOCA ESTOURA? 🍿 — arte em SVG
   Panela em corte lateral (chamas, fundo de aço, óleo, bolhas), grão de milho (por fora e em corte),
   vapor, setas de pressão, espuma de amido, pipoca, instrumentos (termômetro e manômetro) e medidor de som.
   Mundo: o grão-herói fica em K; coordenadas locais do grão (KP) vão de -190 a 190 em x e de -222 a 227 em y.
   Tudo é determinístico (nada de R() dentro de quadro).
   ===================================================================================== */
const hh = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const VIG = (k = 1) => `<rect width="1080" height="1920" fill="url(#vig)" opacity="${k}"/>`;
const GRAINV = t => { const j = Math.floor(t * 24); return `<rect x="-200" y="-200" width="1480" height="2320" fill="url(#noiseP)" opacity=".045" transform="translate(${(j * 37) % 200 - 100},${(j * 53) % 200 - 100})"/>`; };
const blur = (px, c) => { const id = 'bl' + String(px).replace('.', '_'); if (!D.some(d => d.includes(`id="${id}"`))) def(`<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${px}"/></filter>`); return `<g filter="url(#${id})">${c}</g>`; };
const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; };

const KS = 1.7, K = { x: 540, y: 930 }, OIL = 1185, FLOOR = 1322;
const KP = 'M-70 -214 C-30 -222 30 -222 70 -214 C150 -200 196 -150 190 -70 C186 0 160 80 108 150 C80 188 46 216 0 228 C-46 216 -80 188 -108 150 C-160 80 -186 0 -190 -70 C-196 -150 -150 -200 -70 -214Z';

const EXTRA = `
<radialGradient id="gGrao" cx=".36" cy=".3" r=".9"><stop offset="0" stop-color="#FFE48E"/><stop offset=".45" stop-color="#F6B21F"/><stop offset="1" stop-color="#C46E0E"/></radialGradient>
<linearGradient id="gSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7A3E04" stop-opacity=".5"/><stop offset=".28" stop-color="#7A3E04" stop-opacity="0"/><stop offset=".72" stop-color="#7A3E04" stop-opacity="0"/><stop offset="1" stop-color="#7A3E04" stop-opacity=".55"/></linearGradient>
<linearGradient id="gHull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4B83C"/><stop offset="1" stop-color="#D78612"/></linearGradient>
<radialGradient id="gAmido" cx=".5" cy=".42" r=".7"><stop offset="0" stop-color="#FFFBEA"/><stop offset=".7" stop-color="#FFEEBE"/><stop offset="1" stop-color="#FAD98C"/></radialGradient>
<radialGradient id="gGota" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#E4F8FF"/><stop offset=".5" stop-color="#7FD0FA"/><stop offset="1" stop-color="#2F8FD6"/></radialGradient>
<linearGradient id="gOleo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC24A" stop-opacity=".6"/><stop offset="1" stop-color="#D8730C" stop-opacity=".78"/></linearGradient>
<linearGradient id="gAco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8A8F9A"/><stop offset=".1" stop-color="#3C3F48"/><stop offset="1" stop-color="#16171C"/></linearGradient>
<radialGradient id="gEspuma" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#FFFFFA"/><stop offset=".6" stop-color="#FFF6DC"/><stop offset="1" stop-color="#F4DDA6"/></radialGradient>
<radialGradient id="bolhaG" cx=".36" cy=".3" r=".72"><stop offset="0" stop-color="#fff" stop-opacity=".05"/><stop offset=".72" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity=".62"/></radialGradient>
<linearGradient id="gFlame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2C6BFF" stop-opacity=".95"/><stop offset=".28" stop-color="#FF8A1A"/><stop offset=".7" stop-color="#FFD24A"/><stop offset="1" stop-color="#FFF0A8" stop-opacity=".3"/></linearGradient>
<radialGradient id="gRing"><stop offset=".86" stop-color="#7FE8FF" stop-opacity="0"/><stop offset=".95" stop-color="#7FE8FF" stop-opacity=".9"/><stop offset="1" stop-color="#7FE8FF" stop-opacity="0"/></radialGradient>
<radialGradient id="gOleoTopo" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#8A4A14"/><stop offset=".6" stop-color="#4E280F"/><stop offset="1" stop-color="#22110A"/></radialGradient>
<linearGradient id="gLado" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A3C44"/><stop offset=".6" stop-color="#1C1D22"/><stop offset="1" stop-color="#B8561A"/></linearGradient>
<clipPath id="kpClip"><path d="${KP}"/></clipPath>
`;

/* ===================== fundo, chamas, aço, óleo ===================== */
function fundo(t, heat) {
  const id = nid('fd');
  def(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="-300" x2="0" y2="1500"><stop offset="0" stop-color="#190703"/><stop offset=".5" stop-color="#7C2407"/><stop offset="1" stop-color="#E8761E"/></linearGradient>`);
  return `<rect x="-900" y="-1400" width="2900" height="4600" fill="url(#${id})"/><circle cx="540" cy="960" r="${f1(900 + 80 * heat)}" fill="url(#gWarm)" opacity="${op(.4 + .4 * heat)}"/>`;
}
function bokeh(n, x0, y0, w, h, cols, r0, r1, t, seed = 0, a = .35) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + hh(i, seed) * w + Math.sin(t * .3 + i) * 10, y = y0 + hh(i, seed + 1) * h + Math.cos(t * .25 + i * 1.7) * 8;
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(lerp(r0, r1, hh(i, seed + 2)))}" fill="${cols[Math.floor(hh(i, seed + 3) * cols.length)]}" opacity="${f1(a * (.45 + .55 * hh(i, seed + 4)))}"/>`;
  }
  return s;
}
function ondas(t, k) {   // ar tremendo de calor
  let s = '';
  for (let i = 0; i < 7; i++) { const y = 200 + i * 190 - (t * 40 * (.5 + hh(i)) % 190); s += `<path d="M-300 ${f1(y)} q100 ${f1(-26 * k)} 200 0 t200 0 t200 0 t200 0 t200 0 t200 0 t200 0" stroke="#FFD9A0" stroke-width="34" fill="none" opacity="${f1(.07 * k)}" transform="translate(${f1(Math.sin(t * .9 + i) * 60)},0)"/>`; }
  return blur(10, s);
}
function chamas(t, heat) {
  let s = `<ellipse cx="540" cy="1600" rx="900" ry="230" fill="url(#gWarm)" opacity="${op(.65 + .35 * heat)}"/>`, f = '';
  for (let i = 0; i < 9; i++) {
    const x = -120 + i * 150 + Math.sin(t * 4 + i * 1.7) * 14, h = 340 + 110 * heat + 70 * Math.sin(t * 7 + i * 2.1) + 50 * hh(i, 1), y0 = 1815, sw = Math.sin(t * 5 + i * 2.3) * 26, w = 80 + 14 * hh(i, 2);
    const fl = (k, fill, o) => `<path d="M${f1(x - w * k)} ${y0} C${f1(x - w * k * 1.15)} ${f1(y0 - h * k * .35)} ${f1(x - w * k * .5 + sw * .3)} ${f1(y0 - h * k * .72)} ${f1(x + sw * k)} ${f1(y0 - h * k)} C${f1(x + w * k * .5 + sw * .3)} ${f1(y0 - h * k * .72)} ${f1(x + w * k * 1.15)} ${f1(y0 - h * k * .35)} ${f1(x + w * k)} ${y0}Z" fill="${fill}" opacity="${o}"/>`;
    f += fl(1, 'url(#gFlame)', 1) + fl(.55, '#9CC4FF', .7) + fl(.28, '#fff', .55);
  }
  s += blur(3, f);
  return s + `<rect x="-700" y="1815" width="2500" height="1700" fill="#120C0A"/><rect x="-700" y="1815" width="2500" height="8" fill="#6A4426"/>`;
}
function aco() {   // fundo da panela em corte
  return `<rect x="-700" y="${FLOOR}" width="2500" height="110" fill="url(#gAco)"/><rect x="-700" y="${FLOOR}" width="2500" height="6" fill="#DADFE8" opacity=".75"/><rect x="-700" y="${FLOOR + 104}" width="2500" height="6" fill="#FF9A2A" opacity=".55"/>`
    + blur(8, `<ellipse cx="260" cy="${FLOOR + 70}" rx="260" ry="14" fill="#FFB060" opacity=".5"/><ellipse cx="820" cy="${FLOOR + 80}" rx="300" ry="12" fill="#FFB060" opacity=".45"/>`);
}
function oleo(t) {
  const pts = [];
  for (let x = -700; x <= 1800; x += 20) { let y = OIL + 4 * Math.sin(x / 38 + t * 2.6) + 3 * Math.sin(x / 17 - t * 3.4); for (const sg of [-1, 1]) y -= 11 * Math.exp(-(((x - (K.x + sg * 262)) / 30) ** 2)); pts.push(`${x} ${f1(y)}`); }
  let s = `<path d="M${pts.join(' L')} L1800 ${FLOOR} L-700 ${FLOOR}Z" fill="url(#gOleo)"/>`;
  s += `<path d="M${pts.join(' L')}" stroke="#FFF0B0" stroke-width="4" fill="none" opacity=".85" stroke-linecap="round"/>`;
  for (let i = 0; i < 8; i++) { const x = -300 + i * 270 + Math.sin(t + i) * 30; s += `<path d="M${f1(x)} ${OIL + 18} l${f1(70 + 40 * hh(i))} 0" stroke="#FFF6C8" stroke-width="3" opacity=".35" stroke-linecap="round"/>`; }
  return s;
}
function bolhasOleo(t, heat) {
  const n = Math.floor(14 + 30 * heat); let s = '';
  for (let i = 0; i < n; i++) {
    const ph = (t * (.3 + .45 * hh(i, 1)) + hh(i, 2)) % 1, y = lerp(FLOOR - 8, OIL + 3, ph), side = i % 2 ? 1 : -1;
    const x = K.x + side * (120 + 250 * hh(i, 3)) * (i % 5 === 0 ? .6 : 1) + Math.sin(t * 2 + i) * 7, r = (4 + 11 * hh(i, 4)) * (.5 + .5 * ph);
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="url(#bolhaG)" stroke="#fff" stroke-width="1.2" stroke-opacity=".6"/><circle cx="${f1(x - r * .3)}" cy="${f1(y - r * .32)}" r="${f1(r * .22)}" fill="#fff" opacity=".85"/>`;
    if (ph > .93) s += `<ellipse cx="${f1(x)}" cy="${OIL}" rx="${f1(r * 2.2)}" ry="${f1(r * .6)}" fill="none" stroke="#FFF0B0" stroke-width="2" opacity="${op((1 - ph) * 12)}"/>`;
  }
  return s;
}

/* ===================== o grão ===================== */
function grao(t, o = {}) {
  const glow = o.glow || 0, crack = o.crack || 0;
  let s = `<path d="${KP}" fill="url(#gGrao)"/><path d="${KP}" fill="url(#gSide)"/>`;
  s += `<path d="M-52 -172 Q-72 -92 -54 -16 M0 -152 Q8 -72 0 12 M52 -172 Q74 -92 56 -16 M-116 -120 Q-150 -20 -100 110 M116 -120 Q150 -20 102 110" stroke="#B3700E" stroke-width="3.4" fill="none" opacity=".38" stroke-linecap="round"/>`;
  s += `<path d="M-84 -192 Q0 -146 84 -192" stroke="#9A5A08" stroke-width="7" fill="none" opacity=".5" stroke-linecap="round"/><path d="M-74 -176 Q0 -132 74 -176" stroke="#FFEAA4" stroke-width="5" fill="none" opacity=".55" stroke-linecap="round"/>`;
  for (let i = 0; i < 14; i++) { const a2 = hh(i, 1) * 6.28, d = Math.sqrt(hh(i, 2)) * .8; s += `<circle cx="${f1(Math.cos(a2) * 160 * d)}" cy="${f1(Math.sin(a2) * 190 * d - 10)}" r="${f1(1.4 + 2 * hh(i, 3))}" fill="#A8620C" opacity=".22"/>`; }
  s += `<path d="M-44 196 Q0 244 44 196 Q0 214 -44 196Z" fill="#F2DA9C" opacity=".95"/>`;
  s += `<path d="M-130 -150 Q-164 -80 -150 0" stroke="#FFF6D2" stroke-width="18" fill="none" stroke-linecap="round" opacity=".5"/><ellipse cx="-96" cy="-150" rx="30" ry="14" fill="#fff" opacity=".75" transform="rotate(-30 -96 -150)"/>`;
  s += `<path d="M70 -212 C150 -198 192 -150 188 -70" stroke="#FFF3C0" stroke-width="9" fill="none" opacity=".55" stroke-linecap="round"/>`;
  s += `<path d="${KP}" fill="none" stroke="#8A4E08" stroke-width="5" opacity=".65"/>`;
  if (glow > 0) s += `<g filter="url(#b12)"><path d="${KP}" fill="none" stroke="#FF4A12" stroke-width="24" opacity="${op(glow)}"/></g>`;
  if (crack > 0) for (const [d, ln] of [['M52 -218 L70 -192 L50 -170 L74 -140 L58 -112', 130], ['M188 -40 L162 -18 L178 14 L150 42', 100], ['M-120 -196 L-96 -170 L-118 -146 L-90 -118', 110]]) s += `<path d="${d}" stroke="#FF7A22" stroke-width="12" fill="none" stroke-dasharray="${f1(ln * crack)} 400" stroke-linecap="round" stroke-linejoin="round" opacity=".6" filter="url(#b4)"/><path d="${d}" stroke="#FFF4C8" stroke-width="4" fill="none" stroke-dasharray="${f1(ln * crack)} 400" stroke-linecap="round" stroke-linejoin="round"/>`;
  return s;
}
function vapor(t, n, rx, ry, spd = 1, rr = 7) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = hh(i, 1) * 6.28, w1 = (.8 + hh(i, 2) * 1.6) * spd, w2 = (.7 + hh(i, 3) * 1.8) * spd;
    const x = Math.sin(t * w1 + a) * rx * (.45 + .55 * hh(i, 4)), y = Math.cos(t * w2 + a * 1.7) * ry * (.45 + .55 * hh(i, 5)), r = rr * (.6 + .8 * hh(i, 6));
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 1.9)}" fill="#BDEBFF" opacity=".18"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="#EAF9FF" stroke="#7CCBF0" stroke-width="1.6" opacity=".95"/>`;
  }
  return s;
}
// o grão cortado ao meio: casca, amido duro, bolsa de amido mole com a gota de água, vapor, setas de pressão
function graoCorte(t, o = {}) {
  const gota = o.gota ?? 1, vap = o.vapor ?? 0, pres = o.pres ?? 0, gel = o.gel ?? 0, heat = o.heat ?? 0, crack = o.crack ?? 0;
  const sh = pres > .45 ? Math.sin(t * 52) * (pres - .45) * 4 : 0, pb = 1 + .03 * pres, pr = 1 + .1 * vap;
  let s = `<g transform="translate(${f1(sh)},0) scale(${f1(pb * 1000) / 1000})"><path d="${KP}" fill="url(#gHull)"/><path d="${KP}" fill="#FF4A12" opacity="${op(pres * .5 + heat * .12)}"/><path d="${KP}" transform="scale(.9)" fill="url(#gAmido)"/>`;
  if (gel > 0) { s += `<path d="${KP}" transform="scale(.9)" fill="#FFD25A" opacity="${op(gel * .5)}"/>`; for (let i = 0; i < 5; i++) s += `<path d="M${-120 + i * 55} ${-150 + (i % 2) * 40} q${f1(20 + 10 * Math.sin(t * 2 + i))} 60 -10 130" stroke="#fff" stroke-width="6" fill="none" opacity="${op(gel * .35)}" stroke-linecap="round"/>`; }
  for (let i = 0; i < 40; i++) { const a = hh(i, 5) * 6.28, d = .45 + .5 * hh(i, 6); s += `<circle cx="${f1(Math.cos(a) * 160 * d)}" cy="${f1(Math.sin(a) * 190 * d - 10)}" r="${f1(2 + 2.4 * hh(i, 7))}" fill="${gel > .3 ? '#F2C24E' : '#F3D690'}" opacity=".6"/>`; }
  s += `<ellipse cx="-64" cy="138" rx="42" ry="27" fill="#F2BE48" stroke="#C98F20" stroke-width="3" transform="rotate(-28 -64 138)"/>`;
  s += `<ellipse cx="0" cy="-10" rx="${f1(116 * pr)}" ry="${f1(148 * pr)}" fill="#FFFDF2" stroke="#F0D27E" stroke-width="3" opacity=".96"/>`;
  if (gota > .02) { const r = 36 * gota; s += `<g transform="translate(${f1(Math.sin(t * 2.6) * 3)},${f1(-20 + Math.cos(t * 2.2) * 3)})"><circle r="${f1(r * 1.35)}" fill="#BDEBFF" opacity=".25"/><circle r="${f1(r)}" fill="url(#gGota)" stroke="#2F8FD6" stroke-width="2"/><ellipse cx="${f1(-r * .3)}" cy="${f1(-r * .35)}" rx="${f1(r * .26)}" ry="${f1(r * .16)}" fill="#fff" opacity=".85" transform="rotate(-30 ${f1(-r * .3)} ${f1(-r * .35)})"/></g>`; }
  s += `<g clip-path="url(#kpClip)">`;
  if (vap > 0) s += `<g transform="translate(0,-10)">${vapor(t, Math.floor(70 * vap), 100 * pr, 128 * pr, 1 + 2.2 * pres + .8 * heat, 7)}</g>`;
  if (pres > .2) for (let k = 0; k < 14; k++) { const an = k * 2 * Math.PI / 14 + .2, L = (16 + 40 * pres) * (.75 + .25 * Math.sin(t * 9 + k)), r0 = 132 * pr, x = Math.cos(an) * r0, y = Math.sin(an) * r0 * 1.28 - 10; s += `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(an * 57.3 + (an > 0 ? 0 : 0))}) scale(${f1(L / 30)})" opacity="${op(.3 + pres)}"><path d="M0 -10 L28 0 L0 10 L8 0Z" fill="#FFE7A8" stroke="#E4872A" stroke-width="2.5"/></g>`; }
  s += `</g><path d="${KP}" fill="none" stroke="#7A4206" stroke-width="6" opacity=".7"/>`;
  if (crack > 0) for (const [d, ln] of [['M52 -220 L70 -192 L50 -170 L74 -140 L58 -112', 130], ['M184 -30 L160 -10 L176 20 L150 46', 100]]) s += `<path d="${d}" stroke="#FF7A22" stroke-width="12" fill="none" stroke-dasharray="${f1(ln * crack)} 400" stroke-linecap="round" stroke-linejoin="round" opacity=".6" filter="url(#b4)"/><path d="${d}" stroke="#FFF4C8" stroke-width="4" fill="none" stroke-dasharray="${f1(ln * crack)} 400" stroke-linecap="round" stroke-linejoin="round"/>`;
  return s + `</g>`;
}

/* ===================== espuma de amido e pipoca ===================== */
const FOAM = Array.from({ length: 34 }, (_, i) => { const a = hh(i, 1) * 6.283, d = Math.sqrt(hh(i, 2)); return { a, d, r: 70 + 90 * hh(i, 3) * (1 - d * .45), h: hh(i, 4), y: Math.sin(a) * d }; }).sort((p, q) => p.y - q.y);
function espuma(k, t) {        // k = 0..1 (1 = pipoca pronta); origem no centro do grão
  if (k <= 0) return '';
  let s = '';
  const R = 250 * k;
  FOAM.forEach((b, i) => {
    const x = Math.cos(b.a) * b.d * R, y = Math.sin(b.a) * b.d * R * .85 - 30 * k, r = b.r * k * .9 * (1 + .03 * Math.sin(t * 3 + i));
    s += `<ellipse cx="${f1(x + 4)}" cy="${f1(y + 9)}" rx="${f1(r)}" ry="${f1(r * .96)}" fill="#E7C47E" opacity=".85"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="url(#gEspuma)"/><path d="M${f1(x - r * .55)} ${f1(y - r * .3)} q${f1(r * .1)} ${f1(-r * .45)} ${f1(r * .5)} ${f1(-r * .52)}" stroke="#fff" stroke-width="${f1(Math.max(2, r * .07))}" fill="none" opacity=".7" stroke-linecap="round"/>`;
  });
  for (const [x, y, a] of [[-60, 150, -20], [46, 172, 18], [112, 118, 40]]) s += `<g transform="translate(${f1(x * k)},${f1(y * k)}) rotate(${a}) scale(${f1(k)})"><path d="M-34 0 Q0 -26 34 0 Q0 -10 -34 0Z" fill="#E39A1C" stroke="#9A5A0C" stroke-width="3"/></g>`;
  return s;
}
function metade(sg, q) {       // meia casca do grão voando para o lado
  const dx = sg * (20 + 190 * easeOut(q * 2)), dy = 40 * q + 220 * q * q, rot = sg * (8 + 40 * easeOut(q * 1.5));
  return `<g transform="translate(${f1(dx)},${f1(dy)}) rotate(${f1(rot)})" opacity="${op(1 - range(q, .7, 1))}"><clipPath id="mt${sg > 0 ? 'd' : 'e'}"><rect x="${sg > 0 ? 0 : -300}" y="-300" width="300" height="700"/></clipPath><g clip-path="url(#mt${sg > 0 ? 'd' : 'e'})"><path d="${KP}" fill="none" stroke="#E39A1C" stroke-width="26"/><path d="${KP}" fill="none" stroke="#8A4E08" stroke-width="4" transform="scale(1.07)"/><path d="${KP}" fill="none" stroke="#8A4E08" stroke-width="4" transform="scale(.93)"/></g></g>`;
}

/* ===================== instrumentos (em tela) ===================== */
function termometro(temp, t, k = 1, x = 860, y = 390) {      // termômetro digital do óleo, com a marca do canal na caixa
  const c = temp >= 175 ? '#FF5A3C' : temp >= 160 ? '#FFB020' : '#B6FF5A';
  return `<g opacity="${op(k)}" transform="translate(${x},${y})"><rect x="-165" y="-62" width="330" height="170" rx="22" fill="#000" opacity=".35" transform="translate(5,8)"/><rect x="-165" y="-62" width="330" height="170" rx="22" fill="#1B1C21" stroke="#5A5E68" stroke-width="4"/><rect x="-149" y="-46" width="298" height="92" rx="12" fill="#1C2B20"/><text x="-137" y="-24" font-size="16" fill="#6FA070">ÓLEO</text><text x="136" y="34" font-size="64" fill="${c}" text-anchor="end">${Math.floor(temp)}°C</text><rect x="-149" y="-46" width="298" height="38" rx="12" fill="#fff" opacity=".05"/><path d="M-149 58 L149 58" stroke="#3A3D46" stroke-width="3"/><text x="0" y="92" text-anchor="middle"><tspan fill="#FFB347" font-size="34">HRYZ</tspan><tspan fill="#EDEDED" font-size="26" dx="10">Animation</tspan></text></g>`;
}
function manometro(val, t, k = 1, cx = 235, cy = 440, r = 150) {
  const ang = v => (135 + 270 * clamp(v / 11)) * Math.PI / 180, P = (v, rr) => [cx + Math.cos(ang(v)) * rr, cy + Math.sin(ang(v)) * rr];
  let s = `<g opacity="${op(k)}"><circle cx="${cx + 5}" cy="${cy + 8}" r="${r}" fill="#000" opacity=".3"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#2A2C32" stroke="#9097A3" stroke-width="5"/><circle cx="${cx}" cy="${cy}" r="${f1(r * .9)}" fill="#F6F1E2"/>`;
  const [ax, ay] = P(8.5, r * .74), [bx, by] = P(11, r * .74);
  s += `<path d="M${f1(ax)} ${f1(ay)} A${f1(r * .74)} ${f1(r * .74)} 0 0 1 ${f1(bx)} ${f1(by)}" stroke="#D8302A" stroke-width="${f1(r * .1)}" fill="none"/>`;
  for (let v = 0; v <= 11; v++) { const [x1, y1] = P(v, r * .84), [x2, y2] = P(v, r * .7); s += `<path d="M${f1(x1)} ${f1(y1)} L${f1(x2)} ${f1(y2)}" stroke="#2A2C32" stroke-width="${v % 2 ? 3 : 5}"/>`; }
  for (const v of [0, 2, 4, 6, 8, 10]) { const [x, y] = P(v, r * .53); s += `<text x="${f1(x)}" y="${f1(y + 8)}" font-size="${f1(r * .17)}" fill="#2A2C32" text-anchor="middle">${v}</text>`; }
  s += `<text x="${cx}" y="${f1(cy + r * .44)}" font-size="${f1(r * .13)}" fill="#7A6A5A" text-anchor="middle">PRESSÃO</text>`;
  const jit = val > 6 ? Math.sin(t * 47) * (val - 6) * .06 : 0, [nx, ny] = P(val + jit, r * .72);
  s += `<path d="M${cx} ${cy} L${f1(nx)} ${f1(ny)}" stroke="#D8201F" stroke-width="6" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="${f1(r * .09)}" fill="#2A2C32"/>`;
  return s + `<path d="M${f1(cx - r * .7)} ${f1(cy - r * .35)} A${f1(r * .8)} ${f1(r * .8)} 0 0 1 ${f1(cx + r * .1)} ${f1(cy - r * .78)}" stroke="#fff" stroke-width="7" fill="none" opacity=".35" stroke-linecap="round"/></g>`;
}
function medidorSom(level, t, x = 540, y = 1400, sc = 1) {
  let s = `<g transform="translate(${x},${y}) scale(${sc})"><rect x="-300" y="-230" width="600" height="260" rx="24" fill="#071016" opacity=".78" stroke="#3A5A68" stroke-width="3"/><text x="-270" y="-190" font-size="26" fill="#7FB0C0">SOM</text>`;
  const fr = Math.floor(t * 14);
  for (let i = 0; i < 12; i++) { const h = Math.max(8, 190 * level * (.35 + .65 * hh(i + fr * 3, 9)) + 8 * hh(i, 2)), c = i < 7 ? '#5AE88A' : i < 10 ? '#FFD84A' : '#FF5A4A'; s += `<rect x="${-258 + i * 44}" y="${f1(10 - h)}" width="32" height="${f1(h)}" rx="6" fill="${c}"/>`; }
  return s + `</g>`;
}
function etiquetaTexto(txt, x, y, k, w = 300) {
  return `<g opacity="${op(k)}" transform="translate(${f1(x)},${f1(y)}) scale(${f1(.92 + .08 * k)})"><rect x="${-w / 2}" y="-34" width="${w}" height="68" rx="34" fill="#08150F" opacity=".8" stroke="#FFD27A" stroke-width="3"/><text x="0" y="11" font-size="32" fill="#FFF1C8" text-anchor="middle">${txt}</text></g>`;
}
const proj = (wx, wy, p = 1) => { const z = CAM.z0 * (1 + (CAM.z / CAM.z0 - 1) * p), x = CAM.x0 + (CAM.x - CAM.x0) * p, y = CAM.y0 + (CAM.y - CAM.y0) * p, r = CAM.r * Math.PI / 180, dx = (wx - x) * z, dy = (wy - y) * z; return [540 + dx * Math.cos(r) - dy * Math.sin(r), 960 + dx * Math.sin(r) + dy * Math.cos(r)]; };

/* ===================== a cena da panela (visão lateral) ===================== */
function panela(t, heat, subject = '', fg = true) {
  let s = lay(.1, fundo(t, heat));
  s += lay(.3, blur(3, bokeh(26, -200, -300, 1500, 1500, ['#FFD27A', '#FF9A3A', '#FFE9B0'], 14, 60, t, 3, .4)));
  s += lay(.5, ondas(t, .6 + .8 * heat));
  s += lay(1, chamas(t, heat) + aco() + subject);
  if (fg) s += lay(1.3, blur(16, `<g transform="translate(-30,1400) scale(1.4) rotate(20)">${grao(t)}</g><g transform="translate(1140,1450) scale(1.2) rotate(-24)">${grao(t)}</g>`));
  return s;
}
// a panela vista de cima, com vários grãos no óleo (plano geral)
const GRAOS_TOPO = [[540, 1040, .55, 0], [330, 960, .36, 40], [720, 950, .38, -30], [260, 1090, .34, 70], [820, 1100, .36, -60], [450, 1170, .37, 20], [650, 1180, .35, -20], [420, 880, .33, 100], [650, 870, .34, -90], [560, 1230, .32, 60], [200, 1000, .3, 10], [880, 1010, .31, 160]];   // [x, y, escala, rotação]; o primeiro é o grão-herói
const POPS_CORO = [25.12, 25.28, 25.45, 25.6, 25.78, 25.95, 26.12, 26.3, 26.5, 26.65, 26.82];   // quando cada um dos outros estoura (os mesmos tempos estão em sfx_pipoca.py)
function panelaTopo(t, heat, tremor, crack = 0, custom = null) {
  let s = `<rect x="-900" y="-1400" width="2900" height="4600" fill="#1A0A05"/>`;
  s += `<ellipse cx="540" cy="1250" rx="900" ry="380" fill="url(#gWarm)" opacity="${op(.55 + .4 * heat)}"/>`;
  s += blur(6, `<ellipse cx="540" cy="1190" rx="680" ry="380" fill="#FF7A1A" opacity="${op(.35 + .4 * heat)}"/>`);
  s += `<path d="M-20 1040 L-20 1260 A560 345 0 0 0 1100 1260 L1100 1040Z" fill="url(#gLado)"/><ellipse cx="540" cy="1040" rx="560" ry="345" fill="#2B2D33" stroke="#9AA0AC" stroke-width="10"/><ellipse cx="540" cy="1030" rx="520" ry="318" fill="#17181C"/>`;
  s += `<ellipse cx="540" cy="1040" rx="500" ry="300" fill="url(#gOleoTopo)"/>`;
  s += `<ellipse cx="400" cy="900" rx="170" ry="46" fill="#fff" opacity=".16" transform="rotate(-12 400 900)"/><ellipse cx="720" cy="1180" rx="120" ry="26" fill="#FFD9A0" opacity=".2"/>`;
  const ks = GRAOS_TOPO;
  if (custom !== null) s += custom;
  else ks.forEach(([x, y, sc, rot], i) => {
    const tr = Math.sin(t * (28 + 18 * hh(i, 1)) + i) * tremor * (i ? .5 : 1), tr2 = Math.cos(t * (31 + 14 * hh(i, 2))) * tremor * (i ? .5 : 1);
    s += `<ellipse cx="${x}" cy="${y + 120 * sc}" rx="${f1(190 * sc)}" ry="${f1(54 * sc)}" fill="#000" opacity=".4"/>`;
    s += `<g transform="translate(${f1(x + tr)},${f1(y + tr2)}) scale(${f1(sc * 1000) / 1000},${f1(sc * .86 * 1000) / 1000}) rotate(${rot})">${grao(t, { glow: i ? heat * .25 : heat * .9, crack: i ? 0 : crack })}</g>`;
    for (let j = 0; j < 5; j++) { const a = hh(i * 5 + j, 3) * 6.28, rr = (150 + 80 * hh(i * 5 + j, 4)) * sc; s += `<circle cx="${f1(x + Math.cos(a) * rr * 1.2)}" cy="${f1(y + Math.sin(a) * rr * .8 + 70 * sc)}" r="${f1(5 + 6 * hh(i * 5 + j, 5))}" fill="url(#bolhaG)" stroke="#fff" stroke-width="1" stroke-opacity=".5"/>`; }
  });
  for (let i = 0; i < 7; i++) { const y = 700 - ((t * 80 * (.4 + hh(i)) + hh(i, 1) * 400) % 520), x = 300 + 460 * hh(i, 2) + Math.sin(t + i) * 40; s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(70 + 40 * hh(i, 3))}" ry="${f1(40 + 30 * hh(i, 4))}" fill="#fff" opacity="${f1(.12 * heat + .04)}" filter="url(#b30)"/>`; }
  return s;
}

// o coro: a grandona já é pipoca no centro e os outros grãos estouram um atrás do outro e pulam (vista de cima)
function coroPipocas(t) {
  const L = [];
  L.push({ y: 1040, s: `<ellipse cx="540" cy="1110" rx="240" ry="64" fill="#000" opacity=".35"/><g transform="translate(540,1004) scale(${f1(.58 * (1 + .01 * Math.sin(t * 2)) * 1000) / 1000},${f1(.58 * .9 * 1000) / 1000})">${espuma(1, t)}</g>` });
  for (let i = 1; i < GRAOS_TOPO.length; i++) {
    const [x, y, sc, rot] = GRAOS_TOPO[i], tp = POPS_CORO[i - 1], dt = t - tp, pk = range(dt, -.6, 0), q = range(dt, .08, .93), arc = 4 * q * (1 - q), H = 150 + 130 * hh(i, 1);
    let s = `<ellipse cx="${x + (dt >= 0 ? f1((hh(i, 2) - .5) * 120 * q) : 0)}" cy="${f1(y + 120 * sc)}" rx="${f1(190 * sc * (dt >= 0 ? 1.8 * (1 - .3 * arc) : 1))}" ry="${f1(54 * sc * (dt >= 0 ? 1.8 * (1 - .3 * arc) : 1))}" fill="#000" opacity="${f1(.4 * (1 - .5 * arc))}"/>`;
    if (dt < .1) {
      const jx = Math.sin(t * (50 + 10 * i)) * (1 + 6 * pk), jy = Math.cos(t * (43 + 7 * i)) * (.5 + 3 * pk);
      s += `<g opacity="${op(1 - range(dt, 0, .1))}"><g transform="translate(${f1(x + jx)},${f1(y + jy)}) scale(${f1(sc * 1000) / 1000},${f1(sc * .86 * 1000) / 1000}) rotate(${rot})">${grao(t, { glow: .25 + .7 * pk, crack: pk > .5 ? range(pk, .5, 1) : 0 })}</g></g>`;
    }
    if (dt >= 0) {
      const fk = 1 - Math.pow(1 - range(dt, 0, .6), 4), px = x + (hh(i, 2) - .5) * 120 * q, py = y - H * arc, scl = 1.06 * sc * (1 + .3 * arc);
      const rp = rot + (hh(i, 3) > .5 ? 1 : -1) * (160 + 200 * hh(i, 4)) * q, land = dt - .93, sq = land > 0 ? 1 - .1 * Math.exp(-land * 7) * Math.cos(land * 24) : 1;
      s += `<g transform="translate(${f1(px)},${f1(py)}) rotate(${f1(rp)}) scale(${f1(scl * 1000) / 1000},${f1(scl * .9 * sq * 1000) / 1000})">${espuma(fk, t)}</g>`;
      const rk = easeOut(range(dt, 0, .3));
      if (rk < 1) s += `<ellipse cx="${x}" cy="${y}" rx="${f1(50 + 760 * sc * rk)}" ry="${f1((50 + 760 * sc * rk) * .62)}" fill="none" stroke="#FFF6DC" stroke-width="${f1(10 * (1 - rk) + 1)}" opacity="${op((1 - rk) * .85)}"/>`;
      for (let j = 0; j < 7; j++) { const an = hh(i * 7 + j, 5) * 6.28, rr = (30 + 190 * sc * 2.2 * easeOut(range(dt, 0, .5))) * (.6 + .6 * hh(i * 7 + j, 6)); s += gota(x + Math.cos(an) * rr, y + Math.sin(an) * rr * .6 - 40 * Math.sin(range(dt, 0, .5) * Math.PI), 5 + 4 * hh(i * 7 + j, 7), 1 - range(dt, .3, .7)); }
    }
    L.push({ y, s });
  }
  return L.sort((p, q2) => p.y - q2.y).map(p => p.s).join('');
}
