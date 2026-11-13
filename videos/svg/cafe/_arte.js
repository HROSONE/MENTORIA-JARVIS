/* =====================================================================================
   POR QUE O CAFÉ TE ACORDA? ☕ — arte em SVG
   Membrana do neurônio com receptores (fechaduras), adenosina (chave laranja com haste) e cafeína (chave marrom com
   bolinhas), caneca com a marca HRYZ Animation, instrumentos (relógio e barras de sono).
   Mundo (micro): a membrana corre em y ~ 1180; acima dela fica o espaço fora da célula, abaixo o citoplasma.
   Tudo é determinístico (nada de R() dentro de quadro).
   ===================================================================================== */
const hh = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const VIG = (k = 1) => `<rect width="1080" height="1920" fill="url(#vig)" opacity="${k}"/>`;
const GRAINV = t => { const j = Math.floor(t * 24); return `<rect x="-200" y="-200" width="1480" height="2320" fill="url(#noiseP)" opacity=".045" transform="translate(${(j * 37) % 200 - 100},${(j * 53) % 200 - 100})"/>`; };
const blur = (px, c) => { const id = 'bl' + String(px).replace('.', '_'); if (!D.some(d => d.includes(`id="${id}"`))) def(`<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${px}"/></filter>`); return `<g filter="url(#${id})">${c}</g>`; };

const EXTRA = `
<radialGradient id="gDo"><stop offset="0" stop-color="#FFC24A" stop-opacity=".98"/><stop offset=".35" stop-color="#FF9A2E" stop-opacity=".4"/><stop offset="1" stop-color="#FF8A20" stop-opacity="0"/></radialGradient>
<radialGradient id="gCaf"><stop offset="0" stop-color="#D9B084" stop-opacity=".85"/><stop offset=".4" stop-color="#A8744A" stop-opacity=".35"/><stop offset="1" stop-color="#7A4A2A" stop-opacity="0"/></radialGradient>
<linearGradient id="gKeyA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD27A"/><stop offset="1" stop-color="#EE7E1C"/></linearGradient>
<linearGradient id="gKeyC" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E0B88C"/><stop offset="1" stop-color="#7A4A2A"/></linearGradient>
<linearGradient id="gRec" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B8A6FF"/><stop offset="1" stop-color="#4C3AB8"/></linearGradient>
<linearGradient id="gMem" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2FA4C8"/><stop offset=".5" stop-color="#1B6A9A"/><stop offset="1" stop-color="#2FA4C8"/></linearGradient>
<radialGradient id="gRosa"><stop offset="0" stop-color="#FF6AB0" stop-opacity=".9"/><stop offset="1" stop-color="#FF6AB0" stop-opacity="0"/></radialGradient>
<radialGradient id="gVerde"><stop offset="0" stop-color="#6FFFB0" stop-opacity=".8"/><stop offset="1" stop-color="#6FFFB0" stop-opacity="0"/></radialGradient>
<linearGradient id="gCeram" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C9CCDA"/><stop offset=".3" stop-color="#FFFFFF"/><stop offset=".7" stop-color="#F0F1F8"/><stop offset="1" stop-color="#B4B8CC"/></linearGradient>
`;

/* ===================== fundo, membrana e citoplasma ===================== */
const MY = 1180, MH = 150;
const mYat = x => MY + 22 * Math.sin(x / 260);
function bokeh(n, x0, y0, w, h, cols, r0, r1, t, seed = 0, a = .35) {
  let s = '';
  for (let i = 0; i < n; i++) { const x = x0 + hh(i, seed) * w + Math.sin(t * .3 + i) * 10, y = y0 + hh(i, seed + 1) * h + Math.cos(t * .25 + i * 1.7) * 8; s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(lerp(r0, r1, hh(i, seed + 2)))}" fill="${cols[Math.floor(hh(i, seed + 3) * cols.length)]}" opacity="${f1(a * (.45 + .55 * hh(i, seed + 4)))}"/>`; }
  return s;
}
function fundoMicro(t) {
  const id = nid('mb');
  def(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="-500" x2="0" y2="1300"><stop offset="0" stop-color="#0A1A3A"/><stop offset=".6" stop-color="#11406A"/><stop offset="1" stop-color="#1A5C86"/></linearGradient>`);
  return `<rect x="-900" y="-1800" width="2900" height="4600" fill="url(#${id})"/>` + blur(10, bokeh(30, -300, -400, 1700, 1600, ['#3FD6E8', '#7A8CFF', '#6FFFC8'], 10, 46, t, 5, .22));
}
function citoplasma(act) {
  const id = nid('ct'), c1 = mix('#3A3F9A', '#C8FF6A', act), c2 = mix('#1B1F5A', '#4FD08A', act), c3 = mix('#0E1240', '#0E6A5A', act);
  def(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${MY + 130}" x2="0" y2="2400"><stop offset="0" stop-color="${c1}"/><stop offset=".35" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>`);
  return `<rect x="-900" y="${MY + 100}" width="2900" height="2400" fill="url(#${id})"/>` + blur(30, `<ellipse cx="540" cy="${MY + 230}" rx="1100" ry="240" fill="${mix('#7A8CFF', '#FFF08A', act)}" opacity="${f1(.18 + .5 * act)}"/>`);
}
function membrana(t, x0 = -400, x1 = 1500) {
  const top = [], bot = [];
  for (let x = x0; x <= x1; x += 40) { top.push(`${x} ${f1(mYat(x))}`); bot.push(`${x} ${f1(mYat(x) + MH)}`); }
  let s = `<path d="M${top.join(' L')} L${bot.slice().reverse().join(' L')}Z" fill="url(#gMem)"/>`;
  for (let x = x0; x <= x1; x += 34) {
    const yT = mYat(x), yB = mYat(x + 17) + MH;
    s += `<path d="M${x} ${f1(yT + 22)} l-3 44 M${x} ${f1(yT + 22)} l4 44 M${x + 17} ${f1(yB - 22)} l3 -44 M${x + 17} ${f1(yB - 22)} l-4 -44" stroke="#8FE8F6" stroke-width="3" opacity=".5" stroke-linecap="round"/>`;
    s += `<circle cx="${x}" cy="${f1(yT + 8)}" r="15" fill="#69E2F0" stroke="#2A9FB8" stroke-width="3"/><circle cx="${x + 17}" cy="${f1(yB - 8)}" r="15" fill="#69E2F0" stroke="#2A9FB8" stroke-width="3"/>`;
  }
  return s;
}

/* ===================== receptor (fechadura) e chaves ===================== */
// luz: 0 (verde, sem sinal) .. 1 (rosa, mandando o aviso); lever: 0..1 (alavanca gira); ring: 0..1 (onda do aviso entrando na célula)
function receptor(x, o = {}) {
  const y = mYat(x), luz = o.luz ?? 0, lever = o.lever ?? 0, ring = o.ring ?? 0, s = o.s ?? 1, bulb = mix('#6FFFB0', '#FF5AA0', luz);
  let g = `<g transform="translate(${f1(x)},${f1(y)}) scale(${s})">`;
  g += `<g transform="translate(0,${MH + 40}) rotate(${f1(-38 * lever)})"><rect x="-9" y="0" width="18" height="86" rx="9" fill="#D6CFFF" stroke="#33267F" stroke-width="3.5"/><circle cy="96" r="22" fill="${bulb}" stroke="#33267F" stroke-width="4"/><circle cx="-7" cy="88" r="6" fill="#fff" opacity=".7"/></g>`;
  g += `<circle cy="${MH + 140}" r="${f1(70 + 60 * luz)}" fill="url(#${luz > .5 ? 'gRosa' : 'gVerde'})" opacity="${f1(.35 + .4 * luz)}"/>`;
  g += `<rect x="-70" y="-10" width="140" height="${MH + 36}" rx="26" fill="url(#gRec)" stroke="#33267F" stroke-width="5"/>`;
  g += `<path d="M-72 10 C-90 -50 -76 -110 -56 -150 Q-42 -172 -30 -152 L-24 -80 Q0 -52 24 -80 L30 -152 Q42 -172 56 -150 C76 -110 90 -50 72 10 Z" fill="url(#gRec)" stroke="#33267F" stroke-width="5" stroke-linejoin="round"/>`;
  g += `<path d="M-48 -120 Q-60 -80 -52 -30" stroke="#fff" stroke-width="7" fill="none" opacity=".4" stroke-linecap="round"/>`;
  if (luz > 0) g += `<ellipse cx="0" cy="-100" rx="40" ry="46" fill="url(#gRosa)" opacity="${f1(luz)}"/>`;
  if (ring > 0 && ring < 1) for (let i = 0; i < 3; i++) { const q = clamp(ring * 1.4 - i * .25); if (q > 0 && q < 1) g += `<circle cy="${MH + 96}" r="${f1(24 + 300 * q)}" fill="none" stroke="#FF8CC8" stroke-width="${f1(10 * (1 - q) + 1)}" opacity="${f1((1 - q) * .8)}"/>`; }
  return g + `</g>`;
}
// a chave tem a origem na base do encaixe; adenosina ('ad') tem haste (manda o aviso); cafeína ('ca') tem bolinhas e não tem haste
function chave(tipo, x, y, rot = 0, s = 1, glow = 1, op0 = 1) {
  const ad = tipo === 'ad', st = ad ? '#7A3A08' : '#3A200E';
  let g = `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${f1(s * 1000) / 1000})" opacity="${f1(op0)}">`;
  if (glow > 0) g += `<circle cy="-60" r="${ad ? 120 : 95}" fill="url(#${ad ? 'gDo' : 'gCaf'})" opacity="${f1(.7 * glow)}"/>`;
  if (ad) g += `<path d="M-10 -78 L-10 -142 Q-10 -154 0 -154 Q10 -154 10 -142 L10 -78Z" fill="#FF9A2E" stroke="${st}" stroke-width="3.5"/><circle cy="-160" r="18" fill="#FFC24A" stroke="${st}" stroke-width="3.5"/><circle cx="-5" cy="-166" r="6" fill="#fff" opacity=".7"/>`;
  g += `<path d="M-26 -70 Q-26 -84 -14 -84 L14 -84 Q26 -84 26 -70 L26 -20 Q26 2 0 8 Q-26 2 -26 -20Z" fill="url(#${ad ? 'gKeyA' : 'gKeyC'})" stroke="${st}" stroke-width="3.5"/>`;
  if (!ad) g += [[-20, -92], [20, -92], [0, -100]].map(([bx, by]) => `<circle cx="${bx}" cy="${by}" r="10" fill="#C9A070" stroke="${st}" stroke-width="3.5"/>`).join('');
  return g + `<path d="M-14 -66 L-14 -34" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".5"/></g>`;
}
const POCKET_Y = -68;                 // onde a base da chave fica quando encaixada (coordenada local do receptor)
function enxame(t, n, tipo, x0, x1, yTop, yBot, seed, s = .38, op0 = .9) {
  let g = '';
  for (let i = 0; i < n; i++) g += chave(tipo, lerp(x0, x1, hh(i, seed)) + 40 * Math.sin(t * .6 + i), lerp(yTop, yBot, hh(i, seed + 1)) + 26 * Math.cos(t * .5 + i * 1.3), 40 * Math.sin(t * .4 + i * 2) + (hh(i, seed + 2) - .5) * 120, s * (.7 + .6 * hh(i, seed + 3)), 0, op0);
  return g;
}
function zeta(x, y, s, o) {           // pequeno "Z" de sono
  if (o <= 0) return '';
  return `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(s)})" opacity="${f1(o)}"><path d="M-16 -16 L16 -16 L-16 16 L16 16" stroke="#C9C0FF" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}

/* ===================== caneca com a marca ===================== */
function caneca(t, vapor = 1, cheia = true) {
  let s = `<rect x="-300" y="1330" width="1700" height="800" fill="#5A3416"/><rect x="-300" y="1330" width="1700" height="10" fill="#8A5A2E"/>`;
  for (let i = 0; i < 8; i++) s += `<path d="M-300 ${1370 + i * 70} Q400 ${1360 + i * 70} 1400 ${1376 + i * 70}" stroke="#3E2410" stroke-width="3" fill="none" opacity=".5"/>`;
  s += `<ellipse cx="560" cy="1350" rx="320" ry="40" fill="#000" opacity=".3"/>`;
  s += `<path d="M810 880 C960 870 970 1130 770 1150" stroke="#E6E8F2" stroke-width="54" fill="none" stroke-linecap="round"/><path d="M810 880 C960 870 970 1130 770 1150" stroke="#fff" stroke-width="14" fill="none" stroke-linecap="round" opacity=".6" transform="translate(-6,-8)"/>`;
  s += `<path d="M280 760 L312 1240 Q336 1330 540 1340 Q744 1330 768 1240 L800 760Z" fill="url(#gCeram)"/>`;
  s += `<ellipse cx="540" cy="760" rx="260" ry="68" fill="#F4F5FB" stroke="#C6C9DA" stroke-width="4"/>${cheia ? `<ellipse cx="540" cy="768" rx="236" ry="54" fill="#3A2012"/><ellipse cx="540" cy="774" rx="200" ry="36" fill="#5A3318"/>` : `<ellipse cx="540" cy="768" rx="236" ry="54" fill="#B9BDD0"/><ellipse cx="540" cy="776" rx="200" ry="34" fill="#D9DCE8"/><ellipse cx="540" cy="782" rx="140" ry="18" fill="none" stroke="#9A6A3E" stroke-width="5" opacity=".4"/>`}`;
  s += cheia ? `<ellipse cx="470" cy="760" rx="70" ry="10" fill="#D9A36A" opacity=".6"/><path d="M420 770 Q540 800 660 770" stroke="#8A5A32" stroke-width="5" fill="none" opacity=".6"/>` : '';
  s += `<text x="546" y="1010" font-size="112" fill="#F07A1A" text-anchor="middle">HRYZ</text><text x="546" y="1086" font-size="58" fill="#1B2A5A" text-anchor="middle">Animation</text><path d="M388 1112 L704 1112" stroke="#1B2A5A" stroke-width="5" opacity=".6"/>`;
  s += `<path d="M300 820 L330 1200" stroke="#fff" stroke-width="18" opacity=".5" stroke-linecap="round"/>`;
  for (let i = 0; i < (vapor > 0 ? 5 : 0); i++) { const ph = (t * (.28 + .06 * i) + i * .2) % 1, x = 450 + i * 40 + Math.sin(t * 1.4 + i * 2) * 26; s += `<path d="M${f1(x)} ${f1(740 - ph * 420)} q${f1(40 * Math.sin(t + i))} -70 0 -140" stroke="#fff" stroke-width="${f1(26 - ph * 10)}" fill="none" opacity="${f1(.55 * (1 - ph) * Math.min(1, ph * 6))}" stroke-linecap="round"/>`; }
  return s;
}

/* ===================== instrumentos (em tela) ===================== */
function painel(rot, txt, cor, k, x, y, marca = true, sz = 66) {         // com a marca do canal na caixa
  const h = marca ? 170 : 124;
  let s = `<g opacity="${op(k)}" transform="translate(${x},${y})"><rect x="-165" y="-62" width="330" height="${h}" rx="22" fill="#000" opacity=".35" transform="translate(5,8)"/><rect x="-165" y="-62" width="330" height="${h}" rx="22" fill="#1B1C21" stroke="#5A5E68" stroke-width="4"/><rect x="-149" y="-46" width="298" height="92" rx="12" fill="#1C2B20"/><text x="-137" y="-24" font-size="16" fill="#6FA070">${rot}</text><text x="136" y="34" font-size="${sz}" fill="${cor}" text-anchor="end">${txt}</text><rect x="-149" y="-46" width="298" height="38" rx="12" fill="#fff" opacity=".05"/>`;
  if (marca) s += `<path d="M-149 58 L149 58" stroke="#3A3D46" stroke-width="3"/><text x="0" y="92" text-anchor="middle"><tspan fill="#FFB347" font-size="34">HRYZ</tspan><tspan fill="#EDEDED" font-size="26" dx="10">Animation</tspan></text>`;
  return s + `</g>`;
}
const hhmm = m => { const h = Math.floor(m / 60) % 24, mm = Math.floor(m % 60); return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); };
const painelHora = (m, k) => painel('HORA', hhmm(m), m >= 20 * 60 ? '#FFB020' : '#B6FF5A', k, 860, 390);
// barras: sono real (laranja → vermelho) e sono sentido (verde → vermelho)
function barrasSono(real, sent, k, x = 205, y = 330, sc = 1) {
  const H = 170, bar = (xx, v, c1, c2, lab) => `<rect x="${xx - 30}" y="0" width="60" height="${H}" rx="12" fill="#0A0E1E" stroke="#5A5E68" stroke-width="3"/><rect x="${xx - 26}" y="${f1(H - 4 - (H - 8) * clamp(v))}" width="52" height="${f1((H - 8) * clamp(v))}" rx="9" fill="${mix(c1, c2, clamp(v))}"/><text x="${xx}" y="${H + 34}" font-size="22" fill="#CFD6F0" text-anchor="middle">${lab}</text>`;
  return `<g opacity="${op(k)}" transform="translate(${x},${y}) scale(${sc})"><rect x="-126" y="-62" width="252" height="${H + 128}" rx="22" fill="#000" opacity=".35" transform="translate(5,8)"/><rect x="-126" y="-62" width="252" height="${H + 128}" rx="22" fill="#1B1C21" stroke="#5A5E68" stroke-width="4"/><text x="0" y="-26" font-size="26" fill="#9FB0E8" text-anchor="middle">SONO</text>${bar(-56, real, '#FFB347', '#FF3C3C', 'REAL')}${bar(56, sent, '#6FFFB0', '#FF3C3C', 'SENTIDO')}</g>`;
}
function etiquetaTexto(txt, x, y, k, w = 300, cor = '#FFD27A') {
  return `<g opacity="${op(k)}" transform="translate(${f1(x)},${f1(y)}) scale(${f1(.92 + .08 * k)})"><rect x="${-w / 2}" y="-32" width="${w}" height="64" rx="32" fill="#08152A" opacity=".85" stroke="${cor}" stroke-width="3"/><text x="0" y="10" font-size="30" fill="#FFF1C8" text-anchor="middle">${txt}</text></g>`;
}
