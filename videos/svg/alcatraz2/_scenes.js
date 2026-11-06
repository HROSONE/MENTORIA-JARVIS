/* ===================== peças vetorizadas de fotos (mãos, rosto) ===================== */
const MAOS = window.MAOS, OBJ = window.OBJ;
const HANCH = { pinca: [560, 1150], aberta: [665, 480] };
function objDefs() {
  let d = `<linearGradient id="slvG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7A8CA6"/><stop offset=".55" stop-color="#4E5E78"/><stop offset="1" stop-color="#2C3848"/></linearGradient>`;
  d += Object.keys(MAOS).map(k => `<g id="H_${k}">${MAOS[k].skin}${MAOS[k].sleeve}</g>`).join('');
  const R = OBJ.rosto;
  d += `<g id="R_base"><path d="${R.layers[0][1]}" fill="#E8E0CC"/></g>`;
  d += `<g id="R_full">${R.layers.map(([c, p]) => `<path d="${p}" fill="${c}"/>`).join('')}<path d="${R.outline}" fill="none" stroke="#1a0e08" stroke-width="3" opacity=".7"/></g>`;
  // camadas separadas para a montagem (pele clara → escura; cabelo = as mais escuras)
  R.layers.forEach(([c, p, L], i) => { d += `<path id="R_${i}" d="${p}" fill="${c}"/>`; });
  d += coatDefs();
  return d;
}
function vhand(type, x, y, s, rot = 0, flip = 1) {
  const [ax, ay] = HANCH[type];
  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${f1(s * flip * 1000) / 1000},${f1(s * 1000) / 1000}) translate(${-ax},${-ay})"><use href="#H_${type}"/></g>`;
}
// rosto dormindo; build: 0 = só molde branco, 1 = pintado, 2 = com cabelo (camadas escuras)
function face(x, y, s, build = 2, rot = 0) {
  const R = OBJ.rosto, [w, h] = R.size;
  let o = `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${f1(s * 1000) / 1000}) translate(${-w / 2},${-h / 2})">`;
  if (build >= 2) return o + `<use href="#R_full"/></g>`;
  o += `<use href="#R_base"/>`;
  const paint = clamp(build), hair = clamp(build - 1);
  R.layers.forEach(([c, p, L], i) => { if (i === 0) return; const isHair = L < 70; const a = isHair ? hair : paint; if (a > 0) o += `<use href="#R_${i}" opacity="${op(a)}"/>`; });
  return o + `<path d="${R.outline}" fill="none" stroke="#1a0e08" stroke-width="3" opacity=".6"/></g>`;
}

/* ===================== capa de chuva desenhada com cuidado ===================== */
function coatDefs() {
  return `<linearGradient id="cG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1C2422"/><stop offset=".35" stop-color="#3A4A44"/><stop offset=".55" stop-color="#2E3C37"/><stop offset="1" stop-color="#141A18"/></linearGradient>
  <linearGradient id="cG2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2A221A"/><stop offset=".4" stop-color="#4A3E30"/><stop offset="1" stop-color="#1E1812"/></linearGradient>
  <linearGradient id="gloss" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <g id="COAT">
    <path d="M-30 -330 Q0 -350 30 -330 L30 -300 Q0 -290 -30 -300Z" fill="#8A8E96"/><path d="M0 -330 Q-4 -380 26 -384 Q54 -384 50 -356" stroke="#9AA0A8" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M-150 -290 Q-160 -306 -110 -310 L110 -310 Q160 -306 150 -290 L230 -60 Q248 -10 236 170 L208 176 Q200 40 176 -40 L190 330 Q0 360 -190 330 L-176 -40 Q-200 40 -208 176 L-236 170 Q-248 -10 -230 -60Z" fill="url(#cG)"/>
    <path d="M-110 -310 L-30 -310 L0 -150 L-60 -210Z" fill="#26302C"/><path d="M110 -310 L30 -310 L0 -150 L60 -210Z" fill="#202824"/>
    <path d="M-30 -310 L0 -240 L30 -310" fill="#141A18"/>
    <path d="M0 -150 L-8 330" stroke="#121816" stroke-width="7"/><path d="M8 -150 L18 330" stroke="#3E4E48" stroke-width="3" opacity=".6"/>
    ${[-110, -30, 50, 130, 210].map(y => `<circle cx="-24" cy="${y}" r="9" fill="#0E1210"/><circle cx="-26" cy="${y - 2}" r="3" fill="#6A7A74"/>`).join('')}
    <path d="M-176 40 L176 40 L178 76 L-178 76Z" fill="#1A2220"/><rect x="-26" y="36" width="52" height="44" rx="6" fill="none" stroke="#8A8E80" stroke-width="5"/>
    <path d="M-150 120 L-70 120 L-70 140 L-150 140Z M150 120 L70 120 L70 140 L150 140Z" fill="#141A18"/>
    <path d="M-176 -40 Q-150 120 -170 300 M176 -40 Q150 120 170 300 M-100 90 Q-90 200 -110 320 M100 100 Q80 200 104 320" stroke="#0E1412" stroke-width="5" fill="none" opacity=".7"/>
    <path d="M-236 170 L-208 176 L-206 196 L-238 190Z M236 170 L208 176 L206 196 L238 190Z" fill="#101614"/>
    <path d="M-130 -260 Q-150 -40 -136 300" stroke="url(#gloss)" stroke-width="26" fill="none" opacity=".55"/><path d="M60 -200 Q80 0 70 300" stroke="#9AB8AC" stroke-width="8" fill="none" opacity=".22"/>
    <path d="M-222 -40 Q-232 60 -224 160" stroke="#9AB8AC" stroke-width="6" fill="none" opacity=".3"/>
  </g>`;
}
const coat = (x, y, s, rot = 0, col = '') => `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${f1(s * 1000) / 1000})"><use href="#COAT"${col ? ` filter="url(#${col})"` : ''}/></g>`;

/* ===================== cenários ===================== */
function cellRoom(t, o = {}) {
  const bulb = o.bulb ?? 1;
  let s = `<rect x="-800" y="-800" width="2700" height="3600" fill="#1E2028"/>`;
  for (let r = 0; r < 20; r++) for (let c = 0; c < 10; c++) { const x = -800 + c * 280 + (r % 2) * 140, y = -800 + r * 140; s += `<rect x="${x + 6}" y="${y + 6}" width="268" height="128" rx="12" fill="#2A2C36" opacity="${f1(.5 + ((r * 7 + c * 3) % 5) * .1)}"/>`; }
  s += `<rect x="-800" y="1500" width="2700" height="1400" fill="#16171C"/><rect x="-800" y="1500" width="2700" height="14" fill="#000" opacity=".4"/>`;
  s += `<ellipse cx="540" cy="300" rx="760" ry="620" fill="url(#gWarm)" opacity="${op(.55 * bulb)}"/>`;
  return s;
}
function lighthouseBeam(x, y, t, len = 1800, k = 1) {
  const a = t * 1.5, w = Math.abs(Math.sin(a)), dx = Math.cos(a);
  return `<path d="M${x} ${y} L${f1(x + dx * len)} ${f1(y - 260 * w)} L${f1(x + dx * len)} ${f1(y + 260 * w)}Z" fill="url(#beamS)" opacity="${op((.25 + .45 * w) * k)}"/><circle cx="${x}" cy="${y}" r="${f1(90 + 40 * w)}" fill="url(#lampG)" opacity="${op(k)}"/>`;
}
function islandArt(t) {
  let s = `<g transform="translate(540,1180)">`;
  s += `<path d="M-700 120 Q-600 -20 -460 -70 L-330 -110 Q-120 -160 120 -140 L360 -110 Q560 -60 660 60 L720 140Z" fill="#14171E"/><path d="M-460 -70 L-330 -110 Q-120 -160 120 -140 L360 -110 Q300 -60 100 -70 Q-200 -40 -460 -70Z" fill="#20242E"/>`;
  s += `<path d="M-700 120 Q-500 60 -300 90 Q0 120 300 80 Q500 60 720 140" stroke="#2E3440" stroke-width="10" fill="none"/>`;
  s += `<rect x="-390" y="-330" width="640" height="210" fill="#3A3E4A"/><rect x="-390" y="-330" width="640" height="26" fill="#4A4E5A"/><rect x="-390" y="-150" width="640" height="30" fill="#2A2E38"/>`;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 19; c++) s += `<rect x="${-372 + c * 33}" y="${-292 + r * 52}" width="15" height="30" fill="${(r * 7 + c * 3) % 6 < 2 ? '#FFD58A' : '#1C1F28'}" opacity="${(r * 7 + c * 3) % 6 < 2 ? .9 : 1}"/>`;
  s += `<rect x="-520" y="-300" width="14" height="170" fill="#2A2E38"/><rect x="-470" y="-300" width="14" height="170" fill="#2A2E38"/><ellipse cx="-488" cy="-320" rx="62" ry="38" fill="#2E323C"/>`;
  s += `<rect x="300" y="-470" width="44" height="350" fill="#C8CCD4"/><rect x="300" y="-470" width="14" height="350" fill="#E8ECF2" opacity=".6"/><rect x="290" y="-500" width="64" height="34" fill="#3A3E4A"/><path d="M290 -500 L322 -530 L354 -500Z" fill="#3A3E4A"/></g>`;
  return s + lighthouseBeam(862, 670, t);
}
function waterArt(y0, t) {
  let o = `<rect x="-800" y="${y0}" width="2700" height="2400" fill="#0C1626"/>`;
  for (let i = 0; i < 24; i++) { const yy = y0 + 18 + i * i * 2.6, ph = t * (1 + i * .05) + i; o += `<path d="M-800 ${f1(yy)} ${Array.from({ length: 28 }, (_, j) => `Q${-800 + j * 100 + 50} ${f1(yy + Math.sin(ph + j) * (3 + i * .5))} ${-700 + j * 100} ${f1(yy)}`).join(' ')}" stroke="#4A6A98" stroke-width="${f1(1.5 + i * .12)}" fill="none" opacity=".3"/>`; }
  for (let i = 0; i < 30; i++) { const x = (i * 137) % 1080, y = y0 + 40 + (i * 71) % 700; o += `<rect x="${x}" y="${y}" width="${8 + i % 14}" height="2" fill="#E8F0FF" opacity="${op(Math.max(0, Math.sin(t * 5 + i * 1.7)) * .5)}"/>`; }
  return o;
}
function fogArt(t, y0 = 1000, k = 1) { let o = ''; for (let i = 0; i < 8; i++) { const x = ((i * 360 + t * (40 + i * 10)) % 2400) - 700; o += `<ellipse cx="${f1(x)}" cy="${f1(y0 + (i % 3) * 150)}" rx="${420 + (i % 4) * 90}" ry="${90 + (i % 3) * 30}" fill="#C8D4E4" opacity="${op(.13 * k)}" filter="url(#b30)"/>`; } return o; }
function raftArt(x, y, s, t, k = 1) {
  return `<g transform="translate(${f1(x)},${f1(y)}) scale(${s})"><ellipse cx="0" cy="40" rx="340" ry="70" fill="#000" opacity=".4" filter="url(#b12)"/>
  <path d="M-320 0 Q-320 -110 -160 -120 L160 -120 Q320 -110 320 0 Q320 110 160 120 L-160 120 Q-320 110 -320 0Z" fill="url(#cG)" stroke="#0A0E0C" stroke-width="6"/>
  <path d="M-250 0 Q-250 -60 -140 -66 L140 -66 Q250 -60 250 0 Q250 60 140 66 L-140 66 Q-250 60 -250 0Z" fill="#141A18"/>
  ${[-240, -160, -80, 0, 80, 160, 240].map(xx => `<path d="M${xx} ${-112 + Math.abs(xx) * .1} L${xx} -66 M${xx} 66 L${xx} ${112 - Math.abs(xx) * .1}" stroke="#E8823A" stroke-width="3" opacity="${op(.25 * k)}"/>`).join('')}
  <path d="M-260 -96 Q0 -130 260 -96" stroke="url(#gloss)" stroke-width="16" fill="none" opacity=".5"/></g>`;
}
function counterBox(t, n, label = 'CAPAS', pop = 1) {
  return `<g transform="translate(540,220) scale(${f1(pop * 100) / 100})"><rect x="-300" y="-118" width="600" height="226" rx="34" fill="#0A0806" opacity=".6"/><rect x="-300" y="-118" width="600" height="226" rx="34" fill="none" stroke="#FFE2A8" stroke-width="4" opacity=".6"/>
  <text x="0" y="40" text-anchor="middle" font-family="'DejaVu Sans Mono',monospace" font-weight="700" font-size="150" fill="#FFF3D6">${n}</text><text x="0" y="92" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="40" letter-spacing="10" fill="#FFD27A">${n === 1 ? 'CAPA' : label}</text></g>`;
}

/* ===================== planos ===================== */
const SH = [['coats', 0, 4.0], ['island', 4.0, T('b2') - .05], ['steal', T('b2') - .05, T('b3') - .05], ['pipe', T('b3') - .05, T('b3') + 2.4], ['plan', T('b3') + 2.4, T('b4') - .05],
  ['barber', T('b4') - .05, T('b4') + 1.9], ['build', T('b4') + 1.9, T('b5') - .05], ['patrol', T('b5') - .05, T('b5') + 1.8], ['bed', T('b5') + 1.8, T('b6') - .05], ['roof', T('b6') - .05, T('b6') + 2.6], ['bay', T('b6') + 2.6, TOTAL]];
const shotAt = t => SH.find(s => t >= s[1] && t < s[2]) || SH[SH.length - 1];
const loc = (t, id) => { const s = SH.find(x => x[0] === id); return { L: t - s[1], d: s[2] - s[1], k: (t - s[1]) / (s[2] - s[1]) }; };
const GRAINV = t => { const j = Math.floor(t * 24); return `<rect x="-200" y="-200" width="1480" height="2320" fill="url(#noiseP)" opacity=".06" transform="translate(${(j * 37) % 200 - 100},${(j * 53) % 200 - 100})"/>`; };
const HH = (t, k = 1) => [4 * k * noise1(t * 1.3, 1), 4 * k * noise1(t * 1.1, 4)];   // mão leve, só para respirar

// 1. gancho: uma capa → 50 capas (contador como os dias do Mike)
function sCoats(t) {
  const { L, d, k } = loc(t, 'coats');
  const pull = easeInOut(range(L, .2, 3.4)), [hx, hy] = HH(t);
  setCam(540 + hx, lerp(980, 1060, pull) + hy, lerp(1.55, .62, pull), lerp(-1.5, .8, pull), [540, 1000, 1]);
  const n = 1 + Math.floor(Math.pow(range(L, .3, 3.4), 1.5) * 49);
  let s = lay(.9, cellRoom(t));
  let c = '';
  // 50 capas penduradas em fileiras (5 x 10), a primeira no centro; aparecem conforme o contador
  const pos = []; for (let r = 0; r < 5; r++) for (let i = 0; i < 10; i++) pos.push([540 + (i - 4.5) * 230, 360 + r * 620]);
  pos.sort((a, b) => Math.hypot(a[0] - 540, a[1] - 1000) - Math.hypot(b[0] - 540, b[1] - 1000));
  for (let i = 0; i < n; i++) { const [x, y] = pos[i]; const age = L - (.3 + Math.pow((i) / 49, 1 / 1.5) * 3.1); const sw = Math.sin(t * 2 + i) * 3 * Math.exp(-Math.max(0, age) * 2); c += coat(x, y, .5, sw + (i % 3 - 1) * 2); }
  s += lay(1, `<rect x="-1400" y="20" width="3900" height="10" fill="#4A3C30"/>${[0, 1, 2, 3, 4].map(r => `<rect x="-1400" y="${30 + r * 620}" width="3900" height="14" fill="#3A3028"/>`).join('')}` + c);
  const fin = range(L, 3.4, 3.7);
  return s + VIG() + counterBox(t, n, 'CAPAS', fin > 0 ? 1 + .25 * Math.sin(fin * Math.PI) : 1) + GRAINV(t) + (L < .1 ? `<rect width="1080" height="1920" fill="#fff" opacity="${op(.3 * (1 - L / .1))}"/>` : '');
}
// 2. Alcatraz, a prisão mais segura do mundo
function sIsland(t) {
  const { L, d, k } = loc(t, 'island'), [hx, hy] = HH(t);
  setCam(lerp(520, 600, k) + hx, lerp(1060, 980, easeInOut(k)) + hy, lerp(.9, 1.15, easeInOut(k)), lerp(1, -1, k), [540, 1000, 1]);
  let s = lay(.05, `<rect x="-800" y="-800" width="2700" height="3600" fill="url(#skyN)"/><circle cx="240" cy="380" r="150" fill="url(#gMoon)"/><circle cx="240" cy="380" r="42" fill="#EEF2FF"/>` + STARS.slice(0, 80).map(q => `<circle cx="${f1((q.x % 1600 + 1600) % 1600 - 260)}" cy="${f1((q.y % 900 + 900) % 900 - 100)}" r="${q.r * .7}" fill="#fff" opacity="${op(.3 + .4 * Math.sin(t * 2 + q.p))}"/>`).join(''));
  s += lay(.25, `<g opacity=".8">${Array.from({ length: 50 }, (_, i) => `<circle cx="${-500 + i * 44}" cy="${1070 + (i % 4) * 6}" r="${3 + i % 3}" fill="#FFD890"/>`).join('')}</g>`);
  s += lay(.5, waterArt(1090, t)) + lay(.7, islandArt(t)) + lay(1, fogArt(t, 1300, .8));
  return s + VIG() + GRAINV(t);
}
// 3. roubando as capas, uma a uma; o guarda passa sem ver
function sSteal(t) {
  const { L, d, k } = loc(t, 'steal'), [hx, hy] = HH(t);
  setCam(lerp(420, 700, easeInOut(k)) + hx, 1000 + hy, lerp(1.05, 1.15, k), 0, [540, 1000, 1]);
  let s = lay(.5, `<rect x="-800" y="-800" width="2900" height="3600" fill="#3A3E46"/>${Array.from({ length: 16 }, (_, i) => `<rect x="${-800 + i * 180}" y="-800" width="174" height="3600" fill="#40444C"/>`).join('')}<rect x="-800" y="1500" width="2900" height="1400" fill="#24262C"/>`);
  // guarda ao fundo (atrás de uma porta gradeada), caminhando e olhando para o outro lado
  const gx = lerp(-300, 1500, range(L, 0, d));
  s += lay(.5, `<g opacity=".95">${sil({ x: gx, y: 1480, s: .55, kind: 'soldado', ph: L * 4.4, walk: 1, flip: 1, col: '#0A0C12', rim: '#DDE6FF', rimK: [1, -.3], light: true, shadow: .3 })}</g>`);
  s += lay(.5, bars(-800, 2100, 200, 1500, 18, '#1A1C22', '#6A7A9A'));
  // cabideiro com capas
  let c = `<rect x="-800" y="560" width="2900" height="20" fill="#5A4A3C"/>`;
  const taken = Math.floor(range(L, .6, d - .4) * 4);
  for (let i = 0; i < 8; i++) { const x = 0 + i * 190; if (i >= 3 && i < 3 + taken) continue; c += coat(x, 920, .62, Math.sin(t * 1.5 + i) * 2); }
  // a capa sendo levada (uma por ciclo) + mão de foto
  const cyc = (range(L, .6, d - .4) * 4) % 1, ci = 3 + taken, cx = ci * 190;
  if (taken < 4) { const up = easeInOut(range(cyc, .3, .9)); c += coat(cx + up * 260, 920 + up * 520, .62, up * 40) + vhand('pinca', cx + 40 + up * 260, 620 + up * 520 + lerp(200, 0, easeOut(range(cyc, 0, .3))), .5, -8 + up * 25); }
  s += lay(1, c);
  return s + VIG() + GRAINV(t);
}
// 4. o cano quente: a borracha derretendo
function sPipe(t) {
  const { L, d, k } = loc(t, 'pipe'), [hx, hy] = HH(t);
  setCam(lerp(520, 560, k) + hx, lerp(960, 900, k) + hy, lerp(1.05, 1.3, easeInOut(k)), 0, [540, 960, 1]);
  let s = lay(.6, `<rect x="-800" y="-800" width="2700" height="3600" fill="#140E0E"/><ellipse cx="540" cy="820" rx="900" ry="700" fill="url(#gRed)" opacity=".7"/>`);
  s += lay(1, `<rect x="-800" y="760" width="2700" height="96" fill="#6A4A34"/><rect x="-800" y="760" width="2700" height="22" fill="#A8744E"/><rect x="-800" y="830" width="2700" height="26" fill="#3A2618"/><rect x="-800" y="760" width="2700" height="96" fill="#FF5A1A" opacity="${op(.18 + .08 * Math.sin(t * 5))}"/>${[60, 520, 980].map(x => `<rect x="${x}" y="744" width="46" height="128" rx="8" fill="#4A3424"/>`).join('')}` + steam(300, 760, t * 1.6, 4, '#ECECF2', 1, 1.4) + steam(780, 760, t * 1.6 + .4, 3, '#ECECF2', .8, 1.2));
  const press = .5 + .5 * Math.sin(t * 3);
  s += lay(1, coat(540, 1250 - press * 20, .95, -4) + `<path d="M520 820 L520 1500" stroke="#FFB070" stroke-width="${f1(8 + 10 * press)}" opacity="${op(.35 + .3 * press)}"/>` + vhand('pinca', 720, 880 - press * 20, .55, 0) + vhand('pinca', 360, 890 - press * 20, .55, 0, -1));
  return s + VIG() + GRAINV(t);
}
// 5. o projeto: as capas viram um bote (cena explicativa, como o raio-X do Mike)
function sPlan(t) {
  const { L, d, k } = loc(t, 'plan');
  setCam(540, lerp(980, 940, k), lerp(1.0, 1.12, easeInOut(k)), 0, [540, 960, 1]);
  let s = `<rect width="1080" height="1920" fill="#0A2240"/>`;
  let g = ''; for (let x = -400; x < 1500; x += 60) g += `<line x1="${x}" y1="-400" x2="${x}" y2="2400" stroke="#1E4A7A" stroke-width="2"/>`; for (let y = -400; y < 2400; y += 60) g += `<line x1="-400" y1="${y}" x2="1500" y2="${y}" stroke="#1E4A7A" stroke-width="2"/>`;
  s += lay(.4, g);
  // capas (em traço branco) deslizam e se juntam no formato do bote
  const m = easeInOut(range(L, .2, 2.2));
  const slots = Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return [540 + Math.cos(a) * 300, 980 + Math.sin(a) * 120, a * 57 + 90]; });
  let c = '';
  slots.forEach(([x, y, r], i) => { const sx = 540 + ((i * 263) % 900) - 450, sy = 300 + ((i * 397) % 1300); c += `<g opacity="${op(1 - range(L, 2.2, 2.8) * .7)}">${coat(lerp(sx, x, m), lerp(sy, y, m), lerp(.35, .22, m), lerp((i * 47) % 60 - 30, r, m), 'fBlue')}</g>`; });
  s += lay(1, c);
  const raft = range(L, 2.2, 2.9);
  if (raft > 0) s += lay(1, `<g opacity="${op(raft)}">${raftArt(540, 980, 1.25, t, 1)}</g>` + `<g opacity="${op(range(L, 2.6, 3.0))}"><path d="M220 860 Q540 760 860 860" stroke="#FFB070" stroke-width="5" stroke-dasharray="14 10" fill="none"/><path d="M220 1100 Q540 1200 860 1100" stroke="#FFB070" stroke-width="5" stroke-dasharray="14 10" fill="none"/></g>`);
  // remos e coletes aparecem
  if (L > 2.8) s += lay(1, `<g opacity="${op(range(L, 2.8, 3.2))}"><g transform="translate(220,1420) rotate(-20)"><rect x="-12" y="-200" width="24" height="380" fill="none" stroke="#E8F0FF" stroke-width="5"/><ellipse cx="0" cy="-230" rx="44" ry="70" fill="none" stroke="#E8F0FF" stroke-width="5"/></g><g transform="translate(860,1420) rotate(20)"><rect x="-12" y="-200" width="24" height="380" fill="none" stroke="#E8F0FF" stroke-width="5"/><ellipse cx="0" cy="-230" rx="44" ry="70" fill="none" stroke="#E8F0FF" stroke-width="5"/></g></g>`);
  return s + `<rect x="0" y="${f1((L * 600) % 2200 - 200)}" width="1080" height="70" fill="#7FD0FF" opacity=".06"/>` + VIG() + GRAINV(t);
}
// 6. barbearia: cabelo caindo na mão
function sBarber(t) {
  const { L, d, k } = loc(t, 'barber'), [hx, hy] = HH(t);
  setCam(540 + hx, lerp(900, 1000, k) + hy, lerp(1.25, 1.1, k), 0, [540, 960, 1]);
  let s = lay(.4, `<rect x="-800" y="-800" width="2700" height="3600" fill="#D8D0C0"/><rect x="-800" y="-200" width="2700" height="900" fill="#B8C4C4"/>${Array.from({ length: 40 }, (_, i) => `<rect x="${-800 + (i % 10) * 270}" y="${1300 + Math.floor(i / 10) * 270}" width="270" height="270" fill="${(i + Math.floor(i / 10)) % 2 ? '#2A2A30' : '#ECE8DE'}"/>`).join('')}`);
  // tesoura cortando (abre/fecha)
  const op_ = Math.abs(Math.sin(t * 9)) * 22;
  s += lay(1, `<g transform="translate(560,520)"><g transform="rotate(${f1(-op_)})"><path d="M0 0 L240 -16 L240 6Z" fill="#D8DCE4" stroke="#8A8E96" stroke-width="3"/><circle cx="-60" cy="0" r="34" fill="none" stroke="#2A2A30" stroke-width="14"/></g><g transform="rotate(${f1(op_)})"><path d="M0 0 L240 16 L240 -6Z" fill="#C8CCD4" stroke="#8A8E96" stroke-width="3"/><circle cx="-60" cy="0" r="34" fill="none" stroke="#2A2A30" stroke-width="14"/></g><circle r="8" fill="#5A5A60"/></g>`);
  let h = ''; for (let i = 0; i < 46; i++) { const ph = (t * .8 + i * .113) % 1, x = 700 + Math.sin(i * 3.1) * 90 + Math.sin(t * 3 + i) * 16, y = 560 + ph * 560; h += `<path d="M${f1(x)} ${f1(y)} q${f1(10 + i % 6)} ${f1(8 + i % 5)} ${f1(18 + i % 7)} -6 q8 -6 14 4" stroke="#2A1A0C" stroke-width="4" fill="none" opacity="${op(1 - ph * .3)}"/>`; }
  s += lay(1, h + `<g transform="translate(760,1140)"><path d="M-80 0 q40 -40 160 -10 q30 20 -10 40 q-90 20 -150 -30Z" fill="#2A1A0C" opacity="${op(range(L, .3, 1.6))}"/></g>` + vhand('aberta', 760, 1180, .7, -90));
  return s + VIG() + GRAINV(t);
}
// 7. montando a cabeça falsa: molde branco → tinta → cabelo
function sBuild(t) {
  const { L, d, k } = loc(t, 'build'), [hx, hy] = HH(t);
  setCam(540 + hx, 980 + hy, lerp(1.0, 1.18, easeInOut(k)), Math.sin(L) * .8, [540, 960, 1]);
  let s = lay(.5, cellRoom(t) + `<rect x="-800" y="1350" width="2700" height="1400" fill="#3A2A1C"/>`);
  s += lay(.5, `<g transform="translate(150,1380)"><rect x="-80" y="-60" width="160" height="80" rx="20" fill="#F2EEDC"/><path d="M-60 -60 Q0 -90 60 -60" stroke="#fff" stroke-width="8" fill="none" opacity=".5"/></g><g transform="translate(930,1390)"><rect x="-70" y="-90" width="140" height="140" rx="24" fill="#F4F4F0"/><circle cx="0" cy="-20" r="28" fill="#C8C8C0"/></g><g transform="translate(300,1500)"><rect x="-40" y="-70" width="70" height="90" fill="#C83A3A"/><rect x="40" y="-60" width="70" height="80" fill="#3A6AC8"/><rect x="120" y="-50" width="60" height="70" fill="#E8C060"/></g>`);
  const b = range(L, .3, 1.6) + range(L, 1.8, d - .3);
  s += lay(1, face(540, 980, 1.12, b, -4));
  // pincel pintando (fase de tinta)
  if (L > .3 && L < 1.7) { const bx = 480 + Math.sin(L * 12) * 90, by = 960 + Math.cos(L * 9) * 60; s += lay(1, `<g transform="translate(${f1(bx)},${f1(by)}) rotate(-40)"><rect x="-10" y="-380" width="20" height="360" rx="8" fill="#8A5A2A"/><rect x="-12" y="-40" width="24" height="26" fill="#B8B8C0"/><path d="M-12 -14 L12 -14 L4 30 L-4 30Z" fill="#7A3A2A"/></g>`); }
  if (L > 1.8) s += lay(1, vhand('pinca', lerp(820, 700, easeOut(range(L, 1.8, 2.6))), lerp(560, 760, easeOut(range(L, 1.8, 2.6))), .55, -10));
  return s + VIG() + GRAINV(t);
}
// 8. a ronda: o guarda passa com a lanterna
function sPatrol(t) {
  const { L, d, k } = loc(t, 'patrol'), [hx, hy] = HH(t);
  setCam(lerp(360, 720, k) + hx, 980 + hy, 1.05, 0, [540, 980, 1]);
  let s = `<rect width="1080" height="1920" fill="#06070C"/>`;
  let c = ''; for (let i = 0; i < 8; i++) { const x = -500 + i * 300; c += `<rect x="${x}" y="300" width="290" height="1300" fill="#10121A"/>${bars(x + 20, x + 270, 300, 1600, 5, '#1C1E28', '#5A6A8A')}`; }
  s += lay(.6, c + `<rect x="-800" y="1600" width="2700" height="900" fill="#14161E"/>`);
  const gx = lerp(-160, 1240, k);
  s += lay(1, sil({ x: gx, y: 1760, s: .95, kind: 'soldado', ph: L * 4.2, walk: 1, col: '#0A0C14', rim: '#BFD4FF', rimK: [1, -.3], light: true, shadow: .3 }) + `<ellipse cx="${f1(gx + 640)}" cy="1000" rx="320" ry="440" fill="#FFF6D8" opacity=".12" filter="url(#b30)"/>`);
  return s + VIG(1.2) + GRAINV(t);
}
// 9. pelas grades: os três "dormindo"
function sBed(t) {
  const { L, d, k } = loc(t, 'bed'), [hx, hy] = HH(t);
  setCam(lerp(520, 600, k) + hx, lerp(1060, 1020, k) + hy, lerp(1.0, 1.25, easeInOut(k)), 0, [540, 1040, 1]);
  let s = lay(1, cellRoom(t, { bulb: 0 }) + `<g transform="translate(540,1300)"><rect x="-500" y="-30" width="1000" height="70" fill="#3A3A40"/><rect x="-500" y="40" width="22" height="260" fill="#2A2A30"/><rect x="478" y="40" width="22" height="260" fill="#2A2A30"/><ellipse cx="-230" cy="-60" rx="230" ry="70" fill="#DCD8CC"/>
    <path d="M-60 -40 Q150 -200 500 -130 L500 -30 L-120 -30Z" fill="#5A6072"/><path d="M-60 -40 Q150 -200 500 -130" stroke="#7A8094" stroke-width="12" fill="none"/></g>` + face(400, 1175, .5, 2, 72) + `<g transform="translate(540,1300)"><path d="M-160 -50 Q100 -230 500 -150 L500 -30 L-160 -30Z" fill="#646A7E"/><path d="M-160 -50 Q100 -230 500 -150" stroke="#8A90A4" stroke-width="12" fill="none"/></g>`);
  const sw = range(L, .2, 2.4), fx = lerp(-150, 1250, sw);
  s += lay(1, `<rect x="-800" y="-800" width="2700" height="3600" fill="#000" opacity=".55"/><ellipse cx="${f1(fx)}" cy="1200" rx="330" ry="260" fill="#FFF6D8" opacity=".34" filter="url(#b30)"/>`);
  s += lay(1.25, bars(-500, 1600, -300, 2400, 7, '#0A0A10', '#8A9AC0'));
  return s + VIG(1.2) + GRAINV(t);
}
// 10. o telhado: três silhuetas correndo sob o farol
function sRoof(t) {
  const { L, d, k } = loc(t, 'roof'), [hx, hy] = HH(t);
  setCam(lerp(440, 640, k) + hx, lerp(1000, 1060, k) + hy, lerp(1.1, 1.0, k), 0, [540, 1000, 1]);
  let s = lay(.05, `<rect x="-800" y="-800" width="2700" height="3600" fill="url(#skyN)"/>`) + lay(.25, `<g opacity=".8">${Array.from({ length: 50 }, (_, i) => `<circle cx="${-500 + i * 44}" cy="${1180 + (i % 4) * 6}" r="${3 + i % 3}" fill="#FFD890"/>`).join('')}</g>`) + lay(.5, fogArt(t, 1150, 1.1));
  s += lay(.6, lighthouseBeam(1020, 560, t, 1900, .9) + `<rect x="996" y="560" width="48" height="900" fill="#C8CCD4" opacity=".8"/>`);
  s += lay(1, `<path d="M-800 1320 L1900 1320 L1900 2600 L-800 2600Z" fill="#1A1C24"/><rect x="-800" y="1306" width="2700" height="18" fill="#2E323C"/>${[80, 640].map(x => `<rect x="${x}" y="1180" width="150" height="140" fill="#22252E"/>`).join('')}`);
  for (let i = 0; i < 3; i++) s += lay(1, sil({ x: lerp(-160 - i * 190, 1200 - i * 210, k), y: 1320, s: .56, kind: 'homem', ph: L * 9 + i, walk: 1.2, lean: -12, col: '#06070C', rim: '#BFD4FF', rimK: [1, -.4] }));
  return s + VIG() + GRAINV(t);
}
// 11. a baía: o bote some na neblina (fim, corte seco)
function sBay(t) {
  const { L, d, k } = loc(t, 'bay');
  setCam(540, lerp(1120, 920, easeIn(k)), lerp(1.2, .85, easeInOut(k)), 0, [540, 1000, 1]);
  let s = lay(.05, `<rect x="-800" y="-800" width="2700" height="3600" fill="url(#skyN)"/><circle cx="300" cy="420" r="160" fill="url(#gMoon)"/><circle cx="300" cy="420" r="44" fill="#EEF2FF"/>`);
  s += lay(.2, `<path d="M-500 860 L1600 860" stroke="#1A1E28" stroke-width="8"/><rect x="740" y="600" width="22" height="270" fill="#2A1A18"/><rect x="1160" y="600" width="22" height="270" fill="#2A1A18"/><path d="M752 610 Q970 800 1170 610 M-500 690 Q300 840 752 610 M1170 610 Q1400 760 1700 690" stroke="#2A1A18" stroke-width="6" fill="none"/>${Array.from({ length: 30 }, (_, i) => `<circle cx="${-400 + i * 70}" cy="${858 + (i % 2) * 4}" r="4" fill="#FFD890"/>`).join('')}`);
  s += lay(.5, waterArt(900, t)) + lay(.5, `<path d="M300 910 L340 910 L520 2100 L120 2100Z" fill="#DDE6FF" opacity=".12"/>`);
  const rk = easeIn(k);
  s += lay(.8, `<g opacity="${op(1 - range(k, .6, .97))}">${raftArt(560, lerp(1380, 1030, rk), lerp(.85, .28, rk), t)}${[0, 1, 2].map(i => sil({ x: 560 + (i - 1) * lerp(140, 46, rk), y: lerp(1360, 1024, rk), s: lerp(.26, .09, rk), kind: 'homem', sit: 1, lean: -10 + Math.sin(t * 4 + i) * 10, col: '#05060A', shadow: 0, armF: [-60 + Math.sin(t * 4 + i) * 30, -20] })).join('')}</g>`);
  s += lay(1, fogArt(t * 1.4, lerp(1300, 1050, k), lerp(1, 3.5, k)));
  return s + VIG() + GRAINV(t);
}
const FN = { coats: sCoats, island: sIsland, steal: sSteal, pipe: sPipe, plan: sPlan, barber: sBarber, build: sBuild, patrol: sPatrol, bed: sBed, roof: sRoof, bay: sBay };
function frame(t) {
  D = []; uid = 0;
  const sh = shotAt(t);
  let body = FN[sh[0]](t);
  for (const c of SH.slice(1)) if (t >= c[1] && t < c[1] + .08) body += `<rect width="1080" height="1920" fill="#fff" opacity="${op(.22 * (1 - (t - c[1]) / .08))}"/>`;
  defsEl.innerHTML = STATIC + objDefs() + `<radialGradient id="lampG"><stop offset="0" stop-color="#FFF4D0" stop-opacity="1"/><stop offset=".3" stop-color="#FFE0A0" stop-opacity=".45"/><stop offset="1" stop-color="#FFD080" stop-opacity="0"/></radialGradient><filter id="fBlue" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .85  0 0 0 0 .93  0 0 0 0 1  0 0 0 .9 0"/></filter>` + D.join('');
  root.innerHTML = body;
}
