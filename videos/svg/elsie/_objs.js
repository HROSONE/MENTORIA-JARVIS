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

