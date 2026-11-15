/* =====================================================================================
   COMO NASCE UM RAIO ⚡ — arte em SVG
   Macro dentro da nuvem (cristais de gelo, granizo, cargas), nuvem de tempestade, paisagem com árvore e casa,
   cargas do chão, líder em degraus com ramos, faísca que sobe, raio de retorno, anéis de choque e instrumentos.
   Mundo vertical: nuvem em cima (y -520 a 330), paisagem embaixo (horizonte ~1650). Tudo é determinístico.
   ===================================================================================== */
const hh = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const VIG = (k = 1) => `<rect width="1080" height="1920" fill="url(#vig)" opacity="${k}"/>`;
const GRAINV = t => { const j = Math.floor(t * 24); return `<rect x="-200" y="-200" width="1480" height="2320" fill="url(#noiseP)" opacity=".045" transform="translate(${(j * 37) % 200 - 100},${(j * 53) % 200 - 100})"/>`; };
const blur = (px, c) => { const id = 'bl' + String(px).replace('.', '_'); if (!D.some(d => d.includes(`id="${id}"`))) def(`<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${px}"/></filter>`); return `<g filter="url(#${id})">${c}</g>`; };

const EXTRA = `
<radialGradient id="gMacro" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#6A50C8"/><stop offset=".55" stop-color="#2E2670"/><stop offset="1" stop-color="#120F3C"/></radialGradient>
<radialGradient id="gGra" cx=".38" cy=".32" r=".85"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#CFDAFF"/><stop offset="1" stop-color="#8C9CE0"/></radialGradient>
<radialGradient id="gHalo"><stop offset="0" stop-color="#DDEBFF" stop-opacity=".7"/><stop offset="1" stop-color="#9AB8FF" stop-opacity="0"/></radialGradient>
<radialGradient id="gDo"><stop offset="0" stop-color="#FFC24A" stop-opacity=".98"/><stop offset=".35" stop-color="#FF9A2E" stop-opacity=".4"/><stop offset="1" stop-color="#FF8A20" stop-opacity="0"/></radialGradient>
<radialGradient id="gDc"><stop offset="0" stop-color="#6FF0FF" stop-opacity=".95"/><stop offset=".35" stop-color="#4FC8FF" stop-opacity=".35"/><stop offset="1" stop-color="#3AA0FF" stop-opacity="0"/></radialGradient>
<radialGradient id="gFlashC"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".35" stop-color="#C9B8FF" stop-opacity=".5"/><stop offset="1" stop-color="#8A6CFF" stop-opacity="0"/></radialGradient>
<radialGradient id="gVio"><stop offset="0" stop-color="#B8A8FF" stop-opacity=".8"/><stop offset="1" stop-color="#6A50FF" stop-opacity="0"/></radialGradient>
`;

/* ===================== macro: dentro da nuvem ===================== */
function fundoMacro(t) {
  let s = `<rect x="-900" y="-1400" width="2900" height="4600" fill="url(#gMacro)"/>`, p = '';
  for (let i = 0; i < 9; i++) { const x = hh(i, 1) * 1300 - 100 + Math.sin(t * .2 + i) * 40, y = hh(i, 2) * 2000 - 200 + Math.cos(t * .17 + i) * 40; p += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(220 + 200 * hh(i, 3))}" ry="${f1(120 + 120 * hh(i, 4))}" fill="#8A78F0" opacity="${f1(.1 + .08 * hh(i, 5))}"/>`; }
  return s + blur(26, p);
}
function neve(t, n, seed, rmin, rmax, op0) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = ((hh(i, seed) * 1500 - 200 + t * (10 + 24 * hh(i, seed + 1)) * (i % 2 ? 1 : -1)) % 1500 + 1500) % 1500 - 200, y = ((hh(i, seed + 2) * 2300 - 300 - t * (14 + 30 * hh(i, seed + 3))) % 2300 + 2300) % 2300 - 300;
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(lerp(rmin, rmax, hh(i, seed + 4)))}" fill="#EAF2FF" opacity="${f1(op0 * (.4 + .6 * hh(i, seed + 5)))}"/>`;
  }
  return s;
}
function cristal(x, y, r, rot, ch) {       // ch: -1 (negativo, ciano) .. 0 neutro .. +1 (positivo, laranja)
  const col = ch > 0 ? '#FFB04A' : ch < 0 ? '#5ED6FF' : '#DDEBFF', a = Math.abs(ch);
  let s = `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)})"><circle r="${f1(r * 1.55)}" fill="url(#${ch > 0 ? 'gDo' : ch < 0 ? 'gDc' : 'gHalo'})" opacity="${f1(.2 + .75 * a)}"/>`;
  for (let k = 0; k < 6; k++) {
    s += `<g transform="rotate(${k * 60})"><path d="M0 0 L${f1(r)} 0" stroke="#EAF4FF" stroke-width="${f1(Math.max(1.6, r * .07))}" stroke-linecap="round"/>`;
    for (const q of [.35, .62]) s += `<path d="M${f1(r * q)} 0 L${f1(r * (q + .2))} ${f1(-r * .2)} M${f1(r * q)} 0 L${f1(r * (q + .2))} ${f1(r * .2)}" stroke="#EAF4FF" stroke-width="${f1(Math.max(1.2, r * .05))}" stroke-linecap="round"/>`;
    s += `<circle cx="${f1(r)}" cy="0" r="${f1(Math.max(1.6, r * .06))}" fill="#fff"/></g>`;
  }
  return s + `<circle r="${f1(r * .13)}" fill="#fff"/><circle r="${f1(r * .13)}" fill="none" stroke="${col}" stroke-width="${f1(Math.max(1.4, r * .05))}" opacity="${f1(.4 + .6 * a)}"/></g>`;
}
function graupel(x, y, r, ch) {
  const a = Math.abs(ch);
  let s = `<g transform="translate(${f1(x)},${f1(y)})"><circle r="${f1(r * 1.55)}" fill="url(#${ch < 0 ? 'gDc' : ch > 0 ? 'gDo' : 'gHalo'})" opacity="${f1(.2 + .7 * a)}"/>`;
  for (let i = 0; i < 16; i++) { const an = i / 16 * 6.283, rr = r * (.88 + .1 * hh(i, 1)); s += `<circle cx="${f1(Math.cos(an) * rr)}" cy="${f1(Math.sin(an) * rr)}" r="${f1(r * (.18 + .1 * hh(i, 2)))}" fill="#E8EEFF"/>`; }
  s += `<circle r="${f1(r)}" fill="url(#gGra)"/>`;
  for (let i = 0; i < 22; i++) { const an = hh(i, 3) * 6.283, d = Math.sqrt(hh(i, 4)) * .85; s += `<circle cx="${f1(Math.cos(an) * r * d)}" cy="${f1(Math.sin(an) * r * d)}" r="${f1(r * (.03 + .05 * hh(i, 5)))}" fill="#fff" opacity=".7"/>`; }
  return s + `<ellipse cx="${f1(-r * .35)}" cy="${f1(-r * .4)}" rx="${f1(r * .3)}" ry="${f1(r * .16)}" fill="#fff" opacity=".6" transform="rotate(-35 ${f1(-r * .35)} ${f1(-r * .4)})"/></g>`;
}
function glifo(x, y, sinal, s, o) {          // selo de carga "+" ou "−"
  if (o <= 0) return '';
  const c = sinal > 0 ? '#FFB04A' : '#5ED6FF', g = sinal > 0 ? 'gDo' : 'gDc';
  return `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(s * 1000) / 1000})" opacity="${op(o)}"><circle r="50" fill="url(#${g})"/><circle r="24" fill="#0E1030" stroke="${c}" stroke-width="5"/><path d="M-12 0 L12 0${sinal > 0 ? ' M0 -12 L0 12' : ''}" stroke="${c}" stroke-width="6" stroke-linecap="round"/></g>`;
}
function impacto(x, y, k, sz = 1) {
  if (k <= 0) return '';
  let s = `<g transform="translate(${f1(x)},${f1(y)}) scale(${sz})" opacity="${op(k)}"><circle r="${f1(130 * (1.3 - k * .5))}" fill="url(#gFlashC)"/>`;
  for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283 + hh(i) * .3, l = (60 + 120 * hh(i, 1)) * (1.6 - k * .6); s += `<path d="M${f1(Math.cos(a) * 20)} ${f1(Math.sin(a) * 20)} L${f1(Math.cos(a) * l)} ${f1(Math.sin(a) * l)}" stroke="#FFF" stroke-width="${f1(3 + 5 * hh(i, 2))}" stroke-linecap="round"/>`; }
  return s + `<circle r="${f1(26 * k + 8)}" fill="#fff"/></g>`;
}
function arco(x0, y0, x1, y1, seed, w = 4) {    // faísca em zigue-zague entre dois pontos
  let d = `M${f1(x0)} ${f1(y0)}`; const n = 7;
  for (let i = 1; i < n; i++) { const f = i / n; d += ` L${f1(lerp(x0, x1, f) + (hh(i, seed) - .5) * 46)} ${f1(lerp(y0, y1, f) + (hh(i, seed + 1) - .5) * 46)}`; }
  d += ` L${f1(x1)} ${f1(y1)}`;
  return `<path d="${d}" stroke="#9CF0FF" stroke-width="${w * 3}" fill="none" opacity=".45" stroke-linecap="round" stroke-linejoin="round" filter="url(#b4)"/><path d="${d}" stroke="#fff" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/* ===================== a nuvem de tempestade e a paisagem ===================== */
const NUV = Array.from({ length: 90 }, (_, i) => { const cx = -380 + 1800 * hh(i, 1), v = Math.pow(hh(i, 2), 1.15), top = -520, base = 330, cy = lerp(base - 30, top + 90, v), rx = 140 + 240 * hh(i, 3); return { cx, cy, rx, ry: rx * (.4 + .22 * hh(i, 4)), v: (cy - top) / (base - top) }; });
function ceuAlto(fl) {
  const id = nid('sk'), c1 = mix('#07091E', '#8A98E8', fl * .7), c2 = mix('#1C1E4E', '#A8B4F0', fl * .7), c3 = mix('#3A3670', '#C8D0FF', fl * .6);
  def(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="-1500" x2="0" y2="1700"><stop offset="0" stop-color="${c1}"/><stop offset=".62" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>`);
  return `<rect x="-900" y="-1800" width="2900" height="4600" fill="url(#${id})"/>`;
}
function nuvem(t, carga, fl) {
  let s = '';
  NUV.forEach((b, i) => { const c = mix(mix('#8A86C8', '#2A2C58', b.v), '#E8EEFF', fl * .5 * (1 - b.v * .4)); s += `<ellipse cx="${f1(b.cx + Math.sin(t * .12 + i) * 14)}" cy="${f1(b.cy)}" rx="${f1(b.rx)}" ry="${f1(b.ry)}" fill="${c}"/>`; });
  let g = blur(16, s);
  g += blur(40, `<ellipse cx="560" cy="-300" rx="720" ry="230" fill="url(#gDo)" opacity="${f1(.65 * carga)}"/><ellipse cx="560" cy="230" rx="800" ry="150" fill="url(#gDc)" opacity="${f1(.8 * carga)}"/>`);
  let b2 = ''; for (let i = 0; i < 16; i++) b2 += `<ellipse cx="${f1(-300 + i * 120 + 30 * Math.sin(i * 2.1 + t * .2))}" cy="${f1(330 + 28 * hh(i, 7))}" rx="${f1(110 + 60 * hh(i, 8))}" ry="${f1(34 + 24 * hh(i, 9))}" fill="${mix('#14152E', '#8A94D8', fl * .6)}"/>`;
  return g + blur(10, b2);
}
function chuva(t, fl) {
  let s = '';
  for (let i = 0; i < 70; i++) {
    const x0 = hh(i, 1) * 1700 - 300, spd = 700 * (.8 + .4 * hh(i, 2)), y = 340 + ((t * spd + hh(i, 3) * 1500) % 1500), len = 38 + 36 * hh(i, 4);
    if (Math.abs(x0 - 650) < 90 && y < 1400) continue;
    s += `<path d="M${f1(x0 + y * .22)} ${f1(y)} l${f1(-len * .22)} ${f1(len)}" stroke="#B8C8FF" stroke-width="2.4" opacity="${f1(.2 + .2 * fl)}" stroke-linecap="round"/>`;
  }
  return s;
}
const TREE = { x: 700, top: 1354, base: 1674 }, HOUSE = { x: 240, base: 1674 };
function paisagem(t, fl) {
  const c0 = mix('#0A0D20', '#5A64A8', fl), c1 = mix('#12173A', '#6C78B8', fl), c2 = mix('#070A1A', '#3A4280', fl);
  let s = `<rect x="-600" y="1500" width="2400" height="1300" fill="${c1}"/><path d="M-500 1650 Q-150 1560 200 1610 T700 1595 T1000 1578 T1600 1640 L1600 2600 L-500 2600Z" fill="${c1}"/>`;
  const hx = HOUSE.x, hb = HOUSE.base, tx = TREE.x;
  s += `<rect x="${hx - 95}" y="${hb - 120}" width="190" height="120" fill="${c2}"/><path d="M${hx - 115} ${hb - 116} L${hx} ${hb - 190} L${hx + 115} ${hb - 116}Z" fill="${c2}"/><rect x="${hx + 50}" y="${hb - 190}" width="22" height="50" fill="${c2}"/>`;
  s += `<ellipse cx="${hx - 38}" cy="${hb - 70}" rx="90" ry="70" fill="url(#gWarm)" opacity=".45"/><rect x="${hx - 60}" y="${hb - 90}" width="44" height="40" fill="#FFC86B"/>`;
  s += `<path d="M${tx - 14} ${TREE.base} L${tx - 12} 1480 Q${tx - 14} 1450 ${tx - 36} 1430 L${tx - 12} 1440 L${tx - 6} 1396 L${tx + 4} 1440 L${tx + 34} 1424 Q${tx + 12} 1450 ${tx + 12} 1480 L${tx + 14} ${TREE.base}Z" fill="${c2}"/>`;
  [[0, 1440, 84], [-60, 1472, 70], [62, 1468, 72], [-28, 1418, 60], [32, 1414, 58], [-88, 1500, 50], [90, 1498, 52]].forEach(([dx, y, r]) => { s += `<circle cx="${tx + dx}" cy="${y}" r="${r}" fill="${c2}"/>`; });
  return s + `<path d="M-500 1712 Q100 1650 500 1696 T1100 1684 T1600 1706 L1600 2600 L-500 2600Z" fill="${c0}"/>`;
}
function cargasChao(t, k) {
  const n = Math.floor(40 * k); let s = '';
  for (let i = 0; i < n; i++) {
    const u = (t * (.18 + .12 * hh(i, 1)) + hh(i, 2)) % 1;
    let x, y;
    if (i % 3) { x = TREE.x + (hh(i, 3) - .5) * (60 + 150 * u); y = lerp(TREE.base - 10, TREE.top + 6, u); }
    else { x = HOUSE.x + (hh(i, 3) - .5) * (130 * (1 - u) + 40); y = lerp(HOUSE.base - 20, 1500, u); }
    s += glifo(x, y, 1, .4 + .2 * hh(i, 4), Math.sin(u * Math.PI) * .95);
  }
  return s;
}

/* ===================== líder, faísca e raio de retorno ===================== */
const LID = (() => {
  const N = 28, main = [];
  for (let k = 0; k <= N; k++) { const f = k / N, zx = k === 0 || k === N ? 0 : (k % 2 ? 1 : -1) * (26 + 22 * hh(k, 1)) * (1 - f * .55); main.push([lerp(640, TREE.x, f) + zx, lerp(335, TREE.top - 2, f)]); }
  const mk = (from, len, dx0, seed) => { const pts = [main[from].slice()]; for (let i = 1; i <= len; i++) { const p = pts[i - 1]; pts.push([p[0] + dx0 * (.6 + .8 * hh(i, seed)) + (i % 2 ? 1 : -1) * 18, p[1] + 34 + 24 * hh(i, seed + 1)]); } return { from, pts }; };
  return { N, main, br: [mk(5, 13, -22, 10), mk(10, 11, 30, 20), mk(15, 8, -18, 30), mk(3, 6, 36, 40)] };
})();
const pathOf = (pts, n) => 'M' + pts.slice(0, n + 1).map(p => `${f1(p[0])} ${f1(p[1])}`).join(' L');
// tip: índice (decimal) da ponta; conn: 0..1 (fecha o vão até a árvore); front: y da frente do raio de retorno; hot: brilho do canal quente
function liderSVG(o) {
  const tip = o.tip ?? 0, conn = o.conn ?? 0, front = o.front ?? 9999, hot = o.hot ?? 0, ti = Math.floor(tip), fr = tip - ti;
  const lines = [{ pts: LID.main, n: conn > 0 ? LID.N : Math.min(LID.N, ti) }].concat(LID.br.map(b => ({ pts: b.pts, n: Math.max(0, Math.min(b.pts.length - 1, ti - b.from)) })));
  let dim = '', core = '', glow = '', hotL = '', newest = '';
  lines.forEach((l, li) => {
    if (l.n < 1) return;
    const d = pathOf(l.pts, l.n);
    dim += `<path d="${d}" stroke="#8A7CFF" stroke-width="${li ? 12 : 16}" fill="none" stroke-linejoin="round" stroke-linecap="round" opacity=".75"/>`;
    core += `<path d="${d}" stroke="#D6CFFF" stroke-width="${li ? 3 : 5}" fill="none" stroke-linejoin="round" stroke-linecap="round" opacity=".92"/>`;
    hotL += `<path d="${d}" stroke="#fff" stroke-width="${li ? 9 : 14}" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
    glow += `<path d="${d}" stroke="#fff" stroke-width="${li ? 24 : 40}" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
    if (conn <= 0 && hot <= 0 && l.n >= 1 && (li === 0 || ti - (li ? LID.br[li - 1].from : 0) < l.pts.length)) { const a = l.pts[l.n - 1], b = l.pts[l.n]; newest += `<path d="M${f1(a[0])} ${f1(a[1])} L${f1(b[0])} ${f1(b[1])}" stroke="#fff" stroke-width="${li ? 6 : 9}" fill="none" stroke-linecap="round" opacity="${f1(1 - fr * .8)}"/><circle cx="${f1(b[0])}" cy="${f1(b[1])}" r="${li ? 30 : 46}" fill="url(#gFlashC)" opacity="${f1(.9 - fr * .6)}"/>`; }
  });
  let s = `<g filter="url(#b12)">${dim}</g>${core}${newest}`;
  if (hot > 0) { const id = nid('hf'); def(`<clipPath id="${id}"><rect x="-900" y="${f1(front)}" width="2900" height="3000"/></clipPath>`); s += `<g clip-path="url(#${id})" opacity="${f1(hot)}"><g filter="url(#b30)" opacity=".85">${glow}</g><g filter="url(#b4)">${hotL}</g>${hotL}</g>`; }
  return s;
}
function streamers(t, g) {          // g: 0..1 — faíscas que sobem da árvore e do telhado
  if (g <= 0) return '';
  let s = '';
  const mk = (x0, y0, len, seed, w, gg) => { let d = `M${f1(x0)} ${f1(y0)}`, last = [x0, y0]; const n = 9, vis = Math.max(1, Math.round(n * gg)); for (let j = 1; j <= vis; j++) { last = [x0 + (j % 2 ? 1 : -1) * (6 + 9 * hh(j, seed)) * (j / n), y0 - j * len / n]; d += ` L${f1(last[0])} ${f1(last[1])}`; } return `<path d="${d}" stroke="#FFB04A" stroke-width="${w * 4}" fill="none" opacity=".5" stroke-linecap="round" stroke-linejoin="round" filter="url(#b4)"/><path d="${d}" stroke="#FFF1D0" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${f1(last[0])}" cy="${f1(last[1])}" r="${w * 5}" fill="url(#gDo)"/>`; };
  s += mk(TREE.x, TREE.top, 110, 50, 4, g);
  s += mk(TREE.x - 56, TREE.top + 40, 90, 60, 3, g * .8) + mk(TREE.x + 60, TREE.top + 44, 80, 70, 3, g * .7) + mk(HOUSE.x + 10, HOUSE.base - 188, 100, 80, 3, g * .75);
  return s;
}
function aneis(L) {                 // anéis de choque do ar em volta do canal
  let s = '';
  for (const [cy, sc] of [[TREE.top - 20, 1], [1050, .8], [700, .7]]) for (let i = 0; i < 4; i++) {
    const tau = L - i * .28 - (sc < 1 ? .05 : 0); if (tau <= 0 || tau > 1.9) continue;
    const e = easeOut(tau / 1.9), rx = (50 + 900 * e) * sc, a = 1 - tau / 1.9;
    s += `<ellipse cx="${TREE.x}" cy="${cy}" rx="${f1(rx)}" ry="${f1(rx * .16)}" fill="none" stroke="#DDE6FF" stroke-width="${f1(10 * a + 1.5)}" opacity="${f1(a * .8)}"/>`;
  }
  return s;
}

/* ===================== instrumentos (em tela) ===================== */
function painel(rot, txt, cor, k, x, y, marca = true, sz = 52) {      // com a marca do canal na caixa
  const h = marca ? 170 : 124;
  let s = `<g opacity="${op(k)}" transform="translate(${x},${y})"><rect x="-165" y="-62" width="330" height="${h}" rx="22" fill="#000" opacity=".35" transform="translate(5,8)"/><rect x="-165" y="-62" width="330" height="${h}" rx="22" fill="#1B1C21" stroke="#5A5E68" stroke-width="4"/><rect x="-149" y="-46" width="298" height="92" rx="12" fill="#1C2B20"/><text x="-137" y="-24" font-size="16" fill="#6FA070">${rot}</text><text x="136" y="32" font-size="${sz}" fill="${cor}" text-anchor="end">${txt}</text><rect x="-149" y="-46" width="298" height="38" rx="12" fill="#fff" opacity=".05"/>`;
  if (marca) s += `<path d="M-149 58 L149 58" stroke="#3A3D46" stroke-width="3"/><text x="0" y="92" text-anchor="middle"><tspan fill="#FFB347" font-size="34">HRYZ</tspan><tspan fill="#EDEDED" font-size="26" dx="10">Animation</tspan></text>`;
  return s + `</g>`;
}
const kvTxt = v => v.toFixed(1).replace('.', ',') + ' kV/m';
const medidorCampo = (v, k) => painel('CAMPO ELÉTRICO', kvTxt(v), v >= 9.5 ? '#FF5A3C' : v >= 7.5 ? '#FFB020' : '#B6FF5A', k, 860, 390);
const painelTemp = (k) => painel('RAIO', '30.000°C', '#FF5A3C', k, 860, 390);
const painelSol = (k) => painel('SUPERFÍCIE DO SOL', '5.500°C', '#FFD060', k, 860, 600, false);
