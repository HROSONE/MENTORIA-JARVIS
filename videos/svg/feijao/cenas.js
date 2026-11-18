/* =====================================================================================
   CENAS do Short "Engoliu um feijão 🌱 (ficção)" (2D, SVG, 1080×1920, 30 fps). frame(t) devolve o SVG inteiro do instante t.
   Tudo é função do tempo: qualquer quadro sai igual em qualquer ordem. Coordenadas da cena = pixels da tela (antes da câmera).
   ===================================================================================== */
const W = 1080, H = 1920;
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sv = x => { x = cl(x); return x * x * (3 - 2 * x); };
const ease = x => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const inv = (a, b, x) => cl((x - a) / (b - a));
const hh = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const mola = (u, f = 14, am = 6) => u <= 0 ? 0 : 1 - Math.exp(-am * u) * Math.cos(f * u);   // chega em 1 passando do ponto
const r1 = x => Math.round(x * 10) / 10;

const DEFS_CENA = `
<linearGradient id="azul" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BFE6E2"/><stop offset="1" stop-color="#8CC9C4"/></linearGradient>
<linearGradient id="vidro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9F7F5"/><stop offset="1" stop-color="#A9D3CF"/></linearGradient>
<linearGradient id="brilhoV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="loucaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C9D6D8"/></linearGradient>
<radialGradient id="janelaLuz" cx=".2" cy=".15" r=".9"><stop offset="0" stop-color="#FFF6D8" stop-opacity=".8"/><stop offset="1" stop-color="#FFF6D8" stop-opacity="0"/></radialGradient>
<radialGradient id="vinheta" cx=".5" cy=".46" r=".78"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#10140F" stop-opacity=".5"/></radialGradient>
<linearGradient id="ceuDia" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5FA8E6"/><stop offset="1" stop-color="#CDEBFA"/></linearGradient>
<linearGradient id="ceuAlto" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3D6FC4"/><stop offset=".55" stop-color="#F4B97A"/><stop offset="1" stop-color="#FFE3B0"/></linearGradient>
<radialGradient id="solAlto" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFFBE6"/><stop offset=".3" stop-color="#FFE7A0"/><stop offset="1" stop-color="#FFC870" stop-opacity="0"/></radialGradient>
<filter id="chicote" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="40 0"/></filter>
<filter id="desf6" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="grao"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .35  0 0 0 .06 0"/></filter>
`;
/** zoom em torno de (cx, cy) da tela */
const zoom = (z, cx, cy, c) => `<g transform="translate(${r1(cx)},${r1(cy)}) scale(${r1(z * 1000) / 1000}) translate(${r1(-cx)},${r1(-cy)})">${c}</g>`;
/** linhas de impacto (o "plim") em volta de (x,y) */
function plim(x, y, k, r = 60, n = 8) {
  if (k <= 0 || k >= 1) return '';
  let s = ''; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.3, r0 = r * (0.6 + k * 0.8), r2 = r0 + 40 * (1 - k);
    s += `<path d="M${r1(x + Math.cos(a) * r0)},${r1(y + Math.sin(a) * r0)} L${r1(x + Math.cos(a) * r2)},${r1(y + Math.sin(a) * r2)}" stroke="#1C1410" stroke-width="${r1(8 * (1 - k) + 2)}" stroke-linecap="round"/>`; }
  return s;
}

/* ---------------------------------- o banheiro ---------------------------------- */
function azulejos(x0, y0, x1, y1, tam = 120, cor = '#9DD3CE', rejunte = '#E9F6F4') {
  let s = `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="${cor}"/>`;
  for (let x = x0; x <= x1; x += tam) s += `<path d="M${x},${y0} L${x},${y1}" stroke="${rejunte}" stroke-width="6"/>`;
  for (let y = y0; y <= y1; y += tam) s += `<path d="M${x0},${y} L${x1},${y}" stroke="${rejunte}" stroke-width="6"/>`;
  return s;
}
/** a parede do banheiro (fora do espelho) + o espelho com o reflexo dentro + a pia na frente */
function banheiro(t, reflexo, { esp = [110, 250, 970, 1460] } = {}) {
  const [x0, y0, x1, y1] = esp;
  let s = azulejos(-200, -200, W + 200, H + 200, 130) + `<rect x="-200" y="-200" width="${W + 400}" height="${H + 400}" fill="url(#janelaLuz)"/>`;
  // o reflexo: a parede de trás (azulejo mais escuro, janela com luz da manhã) e o Carlos espelhado
  const fundo = azulejos(x0 - 40, y0 - 40, x1 + 40, y1 + 40, 110, '#7FB8B4', '#C5E3E0') +
    `<rect x="${x1 - 290}" y="${y0 + 70}" width="230" height="300" rx="10" fill="#FFF3C8" stroke="#E2D2A0" stroke-width="16"/><path d="M${x1 - 175},${y0 + 70} L${x1 - 175},${y0 + 370} M${x1 - 290},${y0 + 220} L${x1 - 60},${y0 + 220}" stroke="#E2D2A0" stroke-width="12"/>` +
    `<rect x="${x0 - 40}" y="${y0 - 40}" width="${x1 - x0 + 80}" height="${y1 - y0 + 80}" fill="url(#janelaLuz)"/>`;
  s += `<clipPath id="espK"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="36"/></clipPath>`;
  s += `<rect x="${x0 - 8}" y="${y0 + 14}" width="${x1 - x0 + 16}" height="${y1 - y0 + 10}" rx="40" fill="#000" opacity=".25" filter="url(#desf6)"/>`;
  s += `<g clip-path="url(#espK)">${fundo}${reflexo}<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="#DFF3F0" opacity=".08"/>` +
    `<path d="M${x0 + 80},${y1} L${x0 + 330},${y0} L${x0 + 420},${y0} L${x0 + 170},${y1} Z" fill="url(#brilhoV)" opacity=".7"/><path d="M${x0 + 470},${y1} L${x0 + 720},${y0} L${x0 + 750},${y0} L${x0 + 500},${y1} Z" fill="url(#brilhoV)" opacity=".5"/></g>`;
  s += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="36" fill="none" stroke="#1C1410" stroke-width="30"/><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="36" fill="none" stroke="#D9DEE0" stroke-width="20"/>` +
    `<rect x="${x0 - 6}" y="${y0 - 6}" width="${x1 - x0 + 12}" height="${y1 - y0 + 12}" rx="40" fill="none" stroke="#fff" stroke-width="4" opacity=".7"/>`;
  return s;
}
/** a pia (borda de louça), o copo com a escova e o sabonete, embaixo da tela */
function pia(t, y = 1560) {
  return `<path d="M-40,${y} L1120,${y} L1120,${y + 420} L-40,${y + 420} Z" fill="url(#loucaG)" stroke="#1C1410" stroke-width="8"/>` +
    `<path d="M-40,${y + 14} L1120,${y + 14}" stroke="#fff" stroke-width="10"/><path d="M-40,${y + 60} L1120,${y + 60}" stroke="#A9BABD" stroke-width="5"/>` +
    `<g transform="translate(820,${y + 10})"><path d="M-46,-150 L46,-150 L38,0 L-38,0 Z" fill="#F07E70" stroke="#1C1410" stroke-width="7"/><path d="M-30,-140 L-26,-14" stroke="#fff" stroke-width="8" opacity=".5"/>` +
    `<path d="M-6,-150 L-30,-290" stroke="#1C1410" stroke-width="18" stroke-linecap="round"/><path d="M-6,-150 L-30,-290" stroke="#4F8FD8" stroke-width="10" stroke-linecap="round"/><rect x="-46" y="-336" width="22" height="56" rx="6" fill="#fff" stroke="#1C1410" stroke-width="5" transform="rotate(-10,-35,-308)"/>` +
    `<path d="M14,-150 L40,-270" stroke="#1C1410" stroke-width="18" stroke-linecap="round"/><path d="M14,-150 L40,-270" stroke="#F0A93A" stroke-width="10" stroke-linecap="round"/></g>` +
    `<g transform="translate(250,${y + 4})"><ellipse cx="0" cy="-26" rx="70" ry="34" fill="#F6E9C9" stroke="#1C1410" stroke-width="7"/><ellipse cx="-20" cy="-40" rx="26" ry="9" fill="#fff" opacity=".7"/></g>`;
}

/* ---------------------------------- utilidades de pose ---------------------------------- */
const DEG = 180 / Math.PI;
/** IK do braço: alvo (pulso) no espaço local do Carlos; devolve { ombro, cotovelo, k } */
function ik(ld, alvo, k = 1) {
  const S = [ld * 92, -362], L1 = 104 * k, L2 = 96 * k;
  const vx = (alvo[0] - S[0]) * ld, vy = alvo[1] - S[1];
  const d = cl(Math.hypot(vx, vy), Math.abs(L1 - L2) + 1, L1 + L2 - 0.5), th = Math.atan2(vx, vy);
  const a = Math.acos(cl((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)), b = Math.acos(cl((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
  const o1 = th + a, o2 = th - a;   // escolhe o cotovelo para fora (ombro mais perto de 90°)
  return Math.abs(o1 - Math.PI / 2) < Math.abs(o2 - Math.PI / 2) ? { ombro: o1 * DEG, cotovelo: -(Math.PI - b) * DEG, k } : { ombro: o2 * DEG, cotovelo: (Math.PI - b) * DEG, k };
}
const mixPose = (a, b, k) => ({ ombro: lerp(a.ombro, b.ombro, k), cotovelo: lerp(a.cotovelo, b.cotovelo, k), k: lerp(a.k ?? 1, b.k ?? 1, k) });
const REPOUSO = { ombro: 10, cotovelo: 20 };
const OUTRO = { camisa: '#5C93DA', camisaSomb: '#33609F', camisaLuz: '#AFD0F5', cabelo: '#B4552A', cabeloLuz: '#E68C55', calca: '#3C4256', calcaSomb: '#262A3A', calcaLuz: '#5E6680' };

/* ---------------------------------- objetos ---------------------------------- */
function colher(px, py, ang) {
  return `<g transform="translate(${r1(px)},${r1(py)}) rotate(${r1(ang)})"><path d="M-4,0 L84,0" stroke="#1C1410" stroke-width="16" stroke-linecap="round"/><path d="M-4,0 L84,0" stroke="#C9D2D8" stroke-width="9" stroke-linecap="round"/>` +
    `<ellipse cx="-30" cy="-2" rx="32" ry="16" fill="#C9D2D8" stroke="#1C1410" stroke-width="6"/><ellipse cx="-34" cy="-6" rx="14" ry="5" fill="#fff" opacity=".8"/></g>`;
}
function prato(x, y, comida = true) {
  let s = `<ellipse cx="${x}" cy="${y + 8}" rx="150" ry="40" fill="#000" opacity=".18"/><ellipse cx="${x}" cy="${y}" rx="150" ry="40" fill="#F4F1EA" stroke="#1C1410" stroke-width="6"/><ellipse cx="${x}" cy="${y - 2}" rx="104" ry="25" fill="#E2DCCF"/>`;
  if (comida) {
    s += `<ellipse cx="${x - 40}" cy="${y - 6}" rx="56" ry="17" fill="#FFFDF4" stroke="#D9D2BE" stroke-width="3"/>`;
    s += `<ellipse cx="${x + 34}" cy="${y - 4}" rx="58" ry="18" fill="#6B3A22"/>`;
    for (let i = 0; i < 16; i++) s += `<ellipse cx="${r1(x + 34 + (hh(i, 1) - .5) * 92)}" cy="${r1(y - 5 + (hh(i, 2) - .5) * 24)}" rx="9" ry="6" fill="${i % 3 ? '#9A5A34' : '#B87A4E'}" stroke="#3A1E10" stroke-width="2" transform="rotate(${r1(hh(i, 3) * 180)},${r1(x + 34 + (hh(i, 1) - .5) * 92)},${r1(y - 5 + (hh(i, 2) - .5) * 24)})"/>`;
  }
  return s;
}
/** mesa vista de frente um pouco de cima: borda do fundo em y0, borda da frente em y1 */
function mesa(y0 = 1370, y1 = 1490, toalha = '#D9473B') {
  let s = `<path d="M-60,${y0} L1140,${y0} L1180,${y1} L-100,${y1} Z" fill="#F6EFE0" stroke="#1C1410" stroke-width="8"/>`;
  for (let x = -60; x < 1140; x += 90) s += `<path d="M${x},${y0} L${x + 45},${y0} L${r1(x * 1.07 + 45 * 1.07 - 40)},${y1} L${r1(x * 1.07 - 40)},${y1} Z" fill="${toalha}" opacity=".85"/>`;
  for (let k = 0; k < 2; k++) { const yy = y0 + (y1 - y0) * (k + 0.5) / 2.2; s += `<path d="M-100,${r1(yy)} L1180,${r1(yy)}" stroke="${toalha}" stroke-width="22" opacity=".5"/>`; }
  s += `<path d="M-100,${y1} L1180,${y1} L1180,${H + 50} L-100,${H + 50} Z" fill="${toalha}" stroke="#1C1410" stroke-width="8"/>`;
  for (let x = -100; x < 1180; x += 96) s += `<rect x="${x}" y="${y1}" width="48" height="${H - y1 + 50}" fill="#F6EFE0" opacity=".9"/>`;
  s += `<rect x="-100" y="${y1}" width="1300" height="40" fill="#000" opacity=".18"/>`;
  return s;
}
function nuvemFofa(x, y, esc = 1, cor = '#FFFFFF', somb = '#D6E2F0') {
  const b = [[0, 0, 90], [-110, 30, 70], [110, 26, 76], [-200, 60, 50], [200, 58, 54], [-50, 50, 80], [60, 54, 80]];
  return `<g transform="translate(${r1(x)},${r1(y)}) scale(${r1(esc * 100) / 100})">` + b.map(([a, c, r]) => `<circle cx="${a}" cy="${c + 10}" r="${r}" fill="${somb}"/>`).join('') + b.map(([a, c, r]) => `<circle cx="${a}" cy="${c}" r="${r}" fill="${cor}"/>`).join('') + `</g>`;
}
/** pombo de perfil, olhando para dir (1 = direita); asa 0..1 (bate), bica 0..1 */
function pombo(x, y, esc, dir, asa = 0, bica = 0, comVagem = false) {
  const ab = Math.sin(asa * Math.PI * 2);
  let s = `<path d="M-40,10 L-80,0 L-82,22 Z" fill="#59607A" stroke="#1C1410" stroke-width="4" stroke-linejoin="round"/>`;
  s += `<path d="M-6,34 L-10,56 M12,34 L14,56" stroke="#E07A7A" stroke-width="6" stroke-linecap="round"/>`;
  s += `<ellipse cx="0" cy="10" rx="50" ry="32" fill="#8E97AE" stroke="#1C1410" stroke-width="5"/><ellipse cx="10" cy="22" rx="30" ry="16" fill="#B5BDD0"/>`;
  const hy = -24 + bica * 26, hx = 40 + bica * 14;
  s += `<path d="M24,-6 Q${hx - 6},${hy + 10} ${hx},${hy}" stroke="#1C1410" stroke-width="30" stroke-linecap="round" fill="none"/><path d="M24,-6 Q${hx - 6},${hy + 10} ${hx},${hy}" stroke="#5F9C8C" stroke-width="20" stroke-linecap="round" fill="none"/>`;
  s += `<circle cx="${hx}" cy="${hy}" r="20" fill="#7E87A0" stroke="#1C1410" stroke-width="5"/><circle cx="${hx + 6}" cy="${hy - 4}" r="5" fill="#F09A3A" stroke="#1C1410" stroke-width="2"/><path d="M${hx + 16},${hy - 2} L${hx + 34},${hy + 4} L${hx + 16},${hy + 8} Z" fill="#E8C29A" stroke="#1C1410" stroke-width="3" stroke-linejoin="round"/>`;
  if (comVagem) s += `<g transform="translate(${hx + 26},${hy + 6}) rotate(70) scale(.5)">${vagem(0, 0, 0, 1, 0)}</g>`;
  s += `<path d="M-10,0 C-30,${r1(-30 - ab * 50)} 20,${r1(-40 - ab * 60)} 30,${r1(-6 - ab * 10)} Z" fill="#6F7891" stroke="#1C1410" stroke-width="5" stroke-linejoin="round"/>`;
  return `<g transform="translate(${r1(x)},${r1(y)}) scale(${r1(esc * dir * 100) / 100},${r1(esc * 100) / 100})">${s}</g>`;
}
function passarinho(x, y, esc, fase) {
  const a = Math.sin(fase * Math.PI * 2) * 22;
  return `<path d="M${r1(x - 30 * esc)},${r1(y - a * esc)} Q${r1(x - 12 * esc)},${r1(y - 8 * esc)} ${r1(x)},${r1(y)} Q${r1(x + 12 * esc)},${r1(y - 8 * esc)} ${r1(x + 30 * esc)},${r1(y - a * esc)}" stroke="#2A2A3A" stroke-width="${r1(6 * esc)}" fill="none" stroke-linecap="round"/>`;
}
function aviao(x, y, esc, t) {
  let s = `<path d="M-300,0 C-300,-40 -240,-56 -160,-56 L240,-56 C300,-56 330,-30 340,0 C330,30 290,40 240,40 L-200,40 C-260,40 -300,26 -300,0 Z" fill="#F2F4F8" stroke="#1C1410" stroke-width="8"/>`;
  s += `<path d="M180,-56 L280,-150 L320,-150 L270,-56 Z" fill="#D9473B" stroke="#1C1410" stroke-width="7" stroke-linejoin="round"/>`;
  s += `<path d="M-40,10 L80,110 L130,110 L60,10 Z" fill="#C9D0DA" stroke="#1C1410" stroke-width="7" stroke-linejoin="round"/>`;
  s += `<path d="M-300,0 C-300,-40 -270,-50 -240,-52 L-230,-10 L-298,-4 Z" fill="#7FB4E0" stroke="#1C1410" stroke-width="5"/>`;
  s += `<rect x="-200" y="6" width="420" height="12" fill="#4F8FD8"/>`;
  for (let i = 0; i < 8; i++) { const wx = -170 + i * 50; s += `<circle cx="${wx}" cy="-22" r="15" fill="#FFF3C8" stroke="#1C1410" stroke-width="4"/><circle cx="${wx - 4}" cy="-24" r="4" fill="#1C1410"/><circle cx="${wx + 5}" cy="-24" r="4" fill="#1C1410"/>`; }
  return `<g transform="translate(${r1(x)},${r1(y)}) scale(${esc})">${s}</g>`;
}
function predios(Yb, x0, x1, sem, cores) {      // fileira de prédios; Yb = y da base na tela
  let s = '';
  for (let x = x0, i = 0; x < x1; i++) {
    const w = 150 + hh(i, sem) * 110, h = 420 + hh(i, sem + 1) * 700, c = cores[i % cores.length];
    s += `<rect x="${r1(x)}" y="${r1(Yb - h)}" width="${r1(w)}" height="${r1(h + 2000)}" fill="${c}" stroke="#1C1410" stroke-width="6"/>`;
    for (let yy = Yb - h + 40; yy < Yb + 1800; yy += 70) for (let xx = x + 22; xx < x + w - 40; xx += 48) s += `<rect x="${r1(xx)}" y="${r1(yy)}" width="26" height="36" fill="${hh(xx * 7 + yy, sem) > .7 ? '#FFE9A8' : '#3E5470'}" opacity=".9"/>`;
    s += `<rect x="${r1(x - 8)}" y="${r1(Yb - h - 16)}" width="${r1(w + 16)}" height="18" fill="#2C2C38"/>`;
    x += w + 10;
  }
  return s;
}
function ceuRua(t) {
  return `<rect x="-600" y="-1500" width="${W + 1200}" height="${H + 3000}" fill="url(#ceuDia)"/>` + nuvemFofa(220 + t * 6, 260, .8) + nuvemFofa(900 + t * 4, 420, .6);
}
function rua(t) {
  let s = predios(1470, -60, 1200, 3, ['#E6B88A', '#C9D7E8', '#E9D3A0', '#B9D3C2', '#E8A99A']);
  s += `<g transform="translate(700,1470)"><rect x="-130" y="-560" width="260" height="70" rx="10" fill="#FFF3D6" stroke="#1C1410" stroke-width="6"/><text x="0" y="-512" text-anchor="middle" font-family="Arial Black, Arial" font-weight="900" font-size="44" fill="#C7463C">PADARIA</text>` +
    `<path d="M-150,-488 L150,-488 L170,-440 L-170,-440 Z" fill="#C7463C" stroke="#1C1410" stroke-width="6"/>` + [-120, -60, 0, 60, 120].map(a => `<path d="M${a},-488 L${a + 10},-440" stroke="#FFF3D6" stroke-width="18"/>`).join('') + `</g>`;
  s += `<path d="M960,1470 L960,880" stroke="#1C1410" stroke-width="22"/><path d="M960,1470 L960,880" stroke="#3E4A5A" stroke-width="12"/><path d="M960,890 Q960,850 900,850" stroke="#1C1410" stroke-width="16" fill="none"/><ellipse cx="896" cy="862" rx="34" ry="16" fill="#FFF3C8" stroke="#1C1410" stroke-width="5"/>`;
  s += `<rect x="-100" y="1462" width="${W + 200}" height="120" fill="#CFC6B6" stroke="#1C1410" stroke-width="6"/>`;
  for (let x = -60; x < W + 100; x += 160) s += `<path d="M${x},1466 L${x - 30},1580" stroke="#A9A090" stroke-width="5"/>`;
  s += `<rect x="-100" y="1580" width="${W + 200}" height="26" fill="#9C9384" stroke="#1C1410" stroke-width="6"/><rect x="-100" y="1606" width="${W + 200}" height="${H}" fill="#555B66"/>`;
  for (let x = -40; x < W + 100; x += 260) s += `<rect x="${x}" y="1740" width="140" height="22" fill="#F2E6B6"/>`;
  return s;
}
function chuva(t, k) {
  if (k <= 0) return '';
  let s = `<rect x="-100" y="-100" width="${W + 200}" height="${H + 200}" fill="#2E3A4E" opacity="${r1(0.45 * k * 100) / 100}"/>`;
  for (let i = 0; i < 90; i++) { const x = hh(i, 7) * (W + 200) - 100, v = 1700 + hh(i, 8) * 600, y = ((hh(i, 9) * 2400 + t * v) % 2400) - 200;
    s += `<path d="M${r1(x)},${r1(y)} L${r1(x - 10)},${r1(y + 70)}" stroke="#D8E8FF" stroke-width="4" opacity="${r1(0.6 * k * 100) / 100}" stroke-linecap="round"/>`; }
  return s;
}

/* ---------------------------------- os planos ---------------------------------- */
const PLANOS = [];
let TOTAL = 0;
const plano = (nome, dur, fn) => { PLANOS.push({ nome, t0: TOTAL, dur, fn }); TOTAL += dur; };

/** o espelho do banheiro: quem (opções do personagem) acorda com o broto na orelha */
function espelho(u, t, extra = {}) {
  const tb = 0.55, kB = mola(u - tb, 16, 5.5) * (u > tb ? 1 : 0);
  const susto = sv(inv(tb + 0.05, tb + 0.35, u)), olha = sv(inv(1.0, 1.4, u));
  const pulo = Math.sin(Math.PI * inv(tb + 0.02, tb + 0.3, u)) * -40;
  const c = carlos({ x: 0, y: 0, esc: 2.2, t, idBase: 0, planta: 0.22 * kB, mudaAng: -16, mudaEsc: 1.5,
    olhos: susto > 0.5 ? 'arregalados' : 'meio', olho: [olha * 1, -0.35 * olha], boca: susto > 0.5 ? 'o' : 'mastiga', sobr: susto, suor: inv(1.6, 2.0, u),
    inclina: -6 * olha + Math.sin(t * 1.3) * 2 * (1 - susto), corpoY: pulo / 2.2, bracoE: REPOUSO, bracoD: REPOUSO, ...extra });
  const z = lerp(1, 1.05, ease(inv(1.2, 3.0, u)));
  const refl = zoom(z, 520, 820, `<g transform="translate(580,2110) scale(-1,1)">${c.svg}</g>` + plim(580 - c.pts.orelha[0] + 20, 2110 + c.pts.orelha[1] - 60, inv(tb, tb + 0.35, u) * 0.999 + (u > tb ? 0.001 : 0), 90));
  return banheiro(t, refl) + pia(t);
}
// P1 (0–3,0) O GANCHO: de manhã, no espelho, sonolento… PLIM: um broto sai da orelha. Ele congela.
plano('P1 espelho', 3.0, (u, t) => espelho(u, t));

/** o jantar (P2 à noite na cozinha; P7 em cima das nuvens). Bocejo, o feijão voa para a boca, GULP. */
function jantar(u, t, o) {
  const { nuvem = false, quem = {}, tBoc = 0.5, tFim = 2.15, tGulp = 2.15 } = o;
  const X = 540, Y = 1750, E = 1.55;
  const L = p => [(p[0] - X) / E, (p[1] - Y) / E];
  // braços: na mesa → espreguiça → (P2) bate na mesa em cima do cabo da colher
  const mesaE = ik(-1, L([430, 1418])), mesaD0 = ik(1, L([640, 1420])), mesaD1 = ik(1, L([700, 1416]));
  const cima = { ombro: 150, cotovelo: 18 };
  const kSobe = sv(inv(tBoc, tBoc + 0.45, u)), kDesce = nuvem ? sv(inv(tFim + 0.3, tFim + 0.8, u)) : sv(inv(1.42, 1.58, u));
  const bE = mixPose(mixPose(mesaE, cima, kSobe), mesaE, kDesce), bD = mixPose(mixPose(mesaD0, cima, kSobe), nuvem ? mesaD0 : mesaD1, kDesce);
  const boceja = u > tBoc + 0.1 && u < tFim, gulp = u >= tGulp, kG = inv(tGulp, tGulp + 0.5, u);
  const depois = inv(tGulp + 0.7, tGulp + 1.0, u);
  const pers = {
    x: X, y: Y, esc: E, t, idBase: 0, ...quem, bracoE: bE, bracoD: bD,
    olhos: boceja ? 'fechados' : gulp ? (depois > 0.5 ? 'meio' : 'arregalados') : 'meio',
    boca: boceja ? 'grito' : gulp ? (kG < 1 ? 'engole' : depois > 0.5 ? (nuvem ? 'mastiga' : 'reto') : 'o') : 'mastiga',
    bochecha: gulp ? Math.max(0, 1 - kG * 1.4) : 0, sobr: gulp ? (depois > 0.5 ? -0.2 : 1) : 0,
    olho: gulp && depois > 0.5 ? [nuvem ? 0 : 0.2, nuvem ? -0.8 : 0.9] : [0, 0],
    inclina: boceja ? Math.sin(Math.PI * inv(tBoc, tFim, u)) * -4 : 0, corpoY: boceja ? -10 * Math.sin(Math.PI * inv(tBoc, tFim, u)) : 0,
  };
  const c = carlos(pers);
  let s = '';
  if (!nuvem) {   // a cozinha à noite
    s += `<rect x="-100" y="-100" width="${W + 200}" height="${H + 200}" fill="#E8B66A"/>`;
    for (let x = -60; x < W + 100; x += 90) s += `<rect x="${x}" y="-100" width="40" height="${H + 200}" fill="#DCA45A"/>`;
    s += `<rect x="640" y="270" width="290" height="360" rx="12" fill="#1E2A55" stroke="#5A3A22" stroke-width="22"/><circle cx="820" cy="370" r="46" fill="#FFF3C8"/><circle cx="840" cy="358" r="46" fill="#1E2A55"/>` +
      [[700, 320], [880, 500], [720, 560], [760, 420]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="4" fill="#fff"/>`).join('') +
      `<path d="M785,270 L785,630 M640,450 L930,450" stroke="#5A3A22" stroke-width="14"/>`;
    // o calendário na parede: "ONTEM"
    s += `<g transform="translate(300,430) rotate(-4)"><rect x="-140" y="-150" width="280" height="300" rx="8" fill="#FFFDF4" stroke="#1C1410" stroke-width="7"/><rect x="-140" y="-150" width="280" height="80" rx="8" fill="#D9473B" stroke="#1C1410" stroke-width="7"/>` +
      `<circle cx="-70" cy="-150" r="10" fill="#1C1410"/><circle cx="70" cy="-150" r="10" fill="#1C1410"/><text x="0" y="40" text-anchor="middle" font-family="Arial Black, Arial" font-weight="900" font-size="74" fill="#1C1410">ONTEM</text>` +
      `<path d="M-100,90 L100,90" stroke="#C9C2B0" stroke-width="6"/></g>`;
    s += `<path d="M540,-20 L540,170" stroke="#1C1410" stroke-width="6"/><path d="M450,250 Q540,140 630,250 Z" fill="#2E6B4A" stroke="#1C1410" stroke-width="7"/><ellipse cx="540" cy="252" rx="30" ry="14" fill="#FFF6C8"/>` +
      `<path d="M440,250 L120,1500 L960,1500 L640,250 Z" fill="#FFF0B8" opacity=".14"/>`;
  } else {        // em cima das nuvens, luz dourada
    s += `<rect x="-100" y="-100" width="${W + 200}" height="${H + 200}" fill="url(#ceuAlto)"/>` + `<circle cx="860" cy="330" r="180" fill="url(#solAlto)"/>`;
    s += '<!--carlosNuvem-->';
    for (let i = 0; i < 7; i++) s += nuvemFofa(-80 + i * 210, 1150 + (i % 2) * 40, 1.2, '#FFF6E6', '#F2C9A0');
    s += `<rect x="-100" y="1200" width="${W + 200}" height="800" fill="#FFF6E6"/>`;
  }
  s += c.svg + mesa(1370, 1490, nuvem ? '#F2C9A0' : '#D9473B');
  if (nuvem) for (let i = 0; i < 7; i++) s += nuvemFofa(-60 + i * 200, 1600 + (i % 2) * 50, 1.4, '#FFFFFF', '#F2D6B8');
  s += prato(560, 1440);
  // a colher (P2): deitada na beira do prato; a mão bate no cabo e ela vira catapulta
  const tBate = 1.58, voo = [tBate, tBate + 0.55];
  if (!nuvem) { const angC = u < tBate ? -12 : lerp(-12, 20, mola(u - tBate, 30, 9)); s += colher(645, 1428, angC); }
  s += carlos({ ...pers, idBase: 5000, soBracos: true }).svg;
  // o feijão: da colher para a boca (P2) ou da vagem lá de cima (P7)
  const boca = [X, Y - 452 * E + pers.corpoY * E];
  if (!nuvem && u >= voo[0] && u < voo[1]) {
    const k = inv(voo[0], voo[1], u), x0 = 612, y0 = 1416, xx = lerp(x0, boca[0], k), yy = lerp(y0, boca[1], k) - Math.sin(Math.PI * k) * 330;
    s += feijao(xx, yy, 26 + 10 * k, u * 900);
  }
  if (nuvem) {
    const tAbre = 1.35, tCai = [1.55, 2.12];
    // o ramo do Carlos que vem da esquerda, por cima, com a vagem pendurada em cima do homem
    const bal = Math.sin(t * 1.6) * 8, ponta = [560 + bal, 300];
    // o Carlos (já pé de feijão) aparece à esquerda, saindo das nuvens, olhando
    const sobe = ease(inv(0, 1.0, u)), cy = lerp(760, 560, sobe), sorri = u > tGulp + 0.3;
    _cid = 7000;
    const cab = `<g transform="translate(250,${r1(cy)}) scale(.62)">${cabecaC({ t, planta: 1, kO: 0.6, olhos: 'arregalados', boca: sorri ? 'sorriso' : 'o', sobr: sorri ? -0.3 : 0.8, olho: u < tAbre ? [1, -0.3] : u < tGulp ? [1, 0.6] : [0, 0.2] })}</g>`;
    s = s.replace('<!--carlosNuvem-->', caule([[250, 1300], [240, 1000], [250, cy + 40]], 80) + cab);
    s += caule([[250, cy - 160], [280, 260], [380, 170], [ponta[0] - 40, 230], ponta], 14) + folha(130, 300, 30, 1.2, bal) + folha(300, 190, -60, 1.1, -bal) + folha(470, 220, 50, 1.0, bal);
    const ab = sv(inv(tAbre, tAbre + 0.25, u));
    s += `<g transform="translate(${r1(ponta[0])},${r1(ponta[1])})"><g transform="rotate(${r1(-30 * ab)})">${vagem(0, 0, 90, 1.1, 0)}</g><g transform="rotate(${r1(30 * ab)})">${vagem(0, 0, 90, 1.1, 0)}</g></g>`;
    if (u < tCai[0]) s += feijao(ponta[0] + 4, ponta[1] + 70, 20, 0);
    else if (u < tCai[1]) { const k = inv(tCai[0], tCai[1], u); s += feijao(lerp(ponta[0] + 4, boca[0], k), lerp(ponta[1] + 70, boca[1], k * k), 20 + 8 * k, u * 700); }
    s += plim(ponta[0], ponta[1] + 60, inv(tAbre, tAbre + 0.3, u) * 0.999 + (u > tAbre ? 0.001 : 0), 50, 6);
  }
  if (gulp && kG < 1) s += `<text text-anchor="middle" x="${r1(boca[0])}" y="${r1(boca[1] - 470)}" font-family="Arial Black, Arial" font-weight="900" font-size="${r1(70 + 30 * mola(kG, 12, 4))}" fill="#FFF3C8" stroke="#1C1410" stroke-width="8" paint-order="stroke" transform="rotate(-6,${r1(boca[0])},${r1(boca[1] - 470)})" opacity="${r1(1 - inv(0.7, 1, kG))}">GULP</text>`;
  const z = 1.14 + lerp(0, 0.12, ease(inv(tBoc + 0.8, tGulp, u))) - lerp(0, 0.12, ease(inv(tGulp + 0.6, tGulp + 1.2, u)));
  return zoom(z, X, 1000, s);
}
// P2 (3,0–6,5): ONTEM à noite. Boceja, bate a mão na colher, o feijão voa para a boca. GULP.
plano('P2 ontem', 3.5, (u, t) => jantar(u, t, {}));

// P3 (6,5–10,5): no espelho, ele puxa o broto (estica), solta, o broto estala na cara; espirra e saem folhas do nariz.
plano('P3 puxa', 4.0, (u, t) => {
  const E = 2.2, OX = 580, OY = 2110, kBr = 1.4;
  const tPega = [0.2, 0.75], tPuxa = [0.8, 1.85], tSolta = 1.9, tAh = 2.35, tAtchim = 2.95;
  const puxa = sv(inv(tPuxa[0], tPuxa[1], u)) + Math.sin(u * 40) * 0.02 * (u > tPuxa[0] && u < tSolta ? 1 : 0);
  let estica, ang;
  if (u < tSolta) { estica = 1 + 1.2 * puxa; ang = -16 + 11 * puxa; }
  else { const m = u - tSolta; estica = 1 + 1.2 * Math.exp(-7 * m) * Math.cos(16 * m); ang = -16 + 11 * Math.exp(-5 * m) * Math.cos(9 * m) - 60 * Math.exp(-6 * m) * Math.sin(9 * m); }
  const fr = 0.35, Lm = 88 * estica * 1.5 * fr, rad = ang / DEG;
  const pega = [160 + Math.sin(rad) * Lm, -520 - Math.cos(rad) * Lm];
  const alvo = ik(1, [pega[0] - 6, pega[1] + 26], kBr);
  const rep = { ...REPOUSO, k: kBr };
  const bD = u < tPega[0] ? rep : u < tSolta ? mixPose(rep, alvo, sv(inv(tPega[0], tPega[1], u))) : mixPose(alvo, rep, sv(inv(tSolta, tSolta + 0.3, u)));
  const tapa = u > tSolta + 0.08 && u < tSolta + 0.4, ah = u > tAh && u < tAtchim, atchim = u >= tAtchim;
  const kN = atchim ? cl(mola(u - tAtchim, 18, 6), 0, 1.15) : 0;
  const c = carlos({ x: 0, y: 0, esc: E, t, idBase: 0, kM: 1, kN, kO: 0, kT: 0, kV: 0, mudaAng: ang, mudaEsc: 1.5, mudaEstica: estica,
    olhos: tapa ? 'fechados' : ah ? 'meio' : atchim ? (u < tAtchim + 0.25 ? 'fechados' : 'arregalados') : 'abertos',
    boca: tapa ? 'triste' : ah ? 'o' : atchim ? (u < tAtchim + 0.3 ? 'grito' : 'triste') : (u > tPuxa[0] ? 'reto' : 'reto'),
    sobr: tapa ? 0.6 : atchim ? 1 : u > tPuxa[0] ? -0.9 : -0.4, suor: u > tPuxa[0] + 0.3 && u < tSolta ? 1 : 0, olho: u < tSolta ? [0.8, -0.6] : [0, 0.4],
    inclina: (tapa ? 10 * Math.exp(-6 * (u - tSolta)) : 0) + (u > tPuxa[0] && u < tSolta ? -6 * puxa : 0) + (ah ? -7 * inv(tAh, tAtchim, u) : 0) + (atchim ? 8 * Math.exp(-5 * (u - tAtchim)) : 0),
    corpoY: atchim ? 20 * Math.exp(-5 * (u - tAtchim)) : 0, bracoE: REPOUSO, bracoD: bD, maoD: u > tPega[1] - 0.1 && u < tSolta ? 'punho' : 'aberta' });
  const treme = (u > tSolta && u < tSolta + 0.25 ? Math.sin(u * 90) * 8 * (1 - inv(tSolta, tSolta + 0.25, u)) : 0) + (atchim && u < tAtchim + 0.3 ? Math.sin(u * 80) * 10 * (1 - inv(tAtchim, tAtchim + 0.3, u)) : 0);
  const testa = [OX - 40 * E, OY - 620 * E], nariz = [OX, OY - 470 * E];
  let refl = `<g transform="translate(${r1(OX + treme)},${OY}) scale(-1,1)">${c.svg}</g>` + plim(testa[0] + 30, testa[1] + 40, inv(tSolta + 0.05, tSolta + 0.4, u) * 0.999 + (u > tSolta + 0.05 ? 0.001 : 0), 80);
  // folhas do espirro grudam no vidro do espelho
  let vidro = '';
  if (atchim) for (let i = 0; i < 9; i++) {
    const k = sv(inv(tAtchim + 0.02 + i * 0.015, tAtchim + 0.22 + i * 0.015, u)), a = i / 9 * Math.PI * 2 + 0.4, d = 300 + hh(i, 4) * 160;
    vidro += folha(lerp(nariz[0], nariz[0] + Math.cos(a) * d, k), lerp(nariz[1], nariz[1] + Math.sin(a) * d * 0.9, k), hh(i, 5) * 360, lerp(0.6, 1.5 + hh(i, 6) * 0.6, k));
  }
  if (atchim && u < tAtchim + 0.6) vidro += `<text x="500" y="${r1(nariz[1] - 420)}" text-anchor="middle" font-family="Arial Black, Arial" font-weight="900" font-size="${r1(90 + 30 * mola(u - tAtchim, 12, 4))}" fill="#FFF3C8" stroke="#1C1410" stroke-width="9" paint-order="stroke" transform="rotate(-6,500,${r1(nariz[1] - 420)})" opacity="${r1(1 - inv(tAtchim + 0.4, tAtchim + 0.6, u))}">ATCHIM!</text>`;
  return banheiro(t, refl + vidro) + pia(t);
});

// P4 (10,5–15,0): na rua de chapéu; os ramos levantam o chapéu; o pombo pousa, bica uma vagem e vai embora com ela.
plano('P4 rua', 4.5, (u, t) => {
  const anda = inv(0, 2.4, u), X = lerp(330, 540, anda), Y = 1500, E = 1.3;
  const passo = u < 2.4 ? u * 1.7 : 2.4 * 1.7;
  const pl = lerp(0.42, 0.78, sv(inv(0.3, 2.3, u)));
  const kT = cl((pl - 0.4) / 0.25), lv = kT * 190;
  const topo = [X, Y - (392 + 236 + lv) * E];
  const pP = [0.0, 2.15, 2.75, 3.55, 4.5];          // pombo: chega, pousa, bica, vai
  let pX, pY, asa = 0, bica = 0, dir = -1, comV = false;
  if (u < pP[2]) { const k = ease(inv(pP[1], pP[2], u)); pX = lerp(1250, topo[0] + 20, k); pY = lerp(250, topo[1] - 60, k) - Math.sin(Math.PI * k) * 80; asa = u * 5; }
  else if (u < pP[3]) { pX = topo[0] + 20; pY = topo[1] - 60; bica = Math.max(0, Math.sin((u - pP[2]) * 14)); }
  else { const k = inv(pP[3], pP[4], u); pX = lerp(topo[0] + 20, -250, k); pY = lerp(topo[1] - 60, 100, k) - Math.sin(Math.PI * k) * 60; asa = u * 5.5; dir = -1; comV = true; }
  const nota = u > pP[2] + 0.2;
  const c = carlos({ x: X, y: Y, esc: E, t, idBase: 0, planta: pl, kO: 0.6, chapeu: lv, passo: u < 2.4 ? passo : null,
    corpoY: u < 2.4 ? -Math.abs(Math.sin(passo * Math.PI * 2)) * 10 : 0, olhos: nota ? 'arregalados' : 'meio', boca: nota ? 'reto' : 'bico', olho: nota ? [0, -1] : [0.3, 0], sobr: nota ? 0.7 : 0.2,
    bracoE: { ombro: 10 + Math.sin(passo * Math.PI * 2) * 8, cotovelo: 20 }, bracoD: { ombro: 10 - Math.sin(passo * Math.PI * 2) * 8, cotovelo: 20 } });
  let s = ceuRua(t) + rua(t) + c.svg + pombo(pX, pY, 1.1, dir, asa, bica, comV);
  if (!nota) for (let i = 0; i < 3; i++) { const k = ((u * 0.9 + i / 3) % 1); s += `<text x="${r1(X + 60 + k * 90)}" y="${r1(Y - 470 - k * 120)}" font-family="Arial" font-size="${r1(40 + 10 * k)}" fill="#1C1410" opacity="${r1((1 - k) * 0.9 * 100) / 100}">♪</text>`; }
  return s;
});

// P5 (15,0–19,0): chuva; ele olha para cima, desesperado; o sol sai; FUUU: cipós no corpo, os sapatos viram raízes. A câmera começa a subir.
plano('P5 chuva', 4.0, (u, t) => {
  const kChuva = 1 - sv(inv(1.4, 1.9, u)), kSol = sv(inv(1.5, 2.0, u)), kCresce = u > 2.0 ? cl(mola(u - 2.0, 9, 3.2), 0, 1.08) : 0;
  const X = 540, Y = 1480, E = 1.2;
  const c = carlos({ x: X, y: Y, esc: E, t, idBase: 0, planta: lerp(0.78, 1.0, cl(kCresce)), kO: 0.6, raiz: cl(kCresce), chapeu: null,
    olhos: 'arregalados', boca: u < 1.5 ? 'triste' : u < 2.0 ? 'o' : 'grito', olho: u < 2.0 ? [0, -1] : [0, 0], sobr: 1,
    bracoE: u < 2.0 ? { ombro: 30, cotovelo: 30 } : { ombro: 150 + Math.sin(u * 22) * 15, cotovelo: 20 }, bracoD: u < 2.0 ? { ombro: 30, cotovelo: 30 } : { ombro: 150 + Math.sin(u * 22 + 1) * 15, cotovelo: 20 },
    corpoY: u > 2.0 ? -30 * Math.exp(-4 * (u - 2)) * Math.abs(Math.sin((u - 2) * 14)) : 0 });
  let s = ceuRua(t) + rua(t);
  s += `<rect x="-100" y="-100" width="${W + 200}" height="${H + 200}" fill="#FFD27A" opacity="${r1(0.22 * kSol * 100) / 100}"/>`;
  if (kSol > 0) s += `<g opacity="${r1(kSol * 0.5 * 100) / 100}">` + [0, 1, 2, 3].map(i => `<path d="M${780 + i * 80},-100 L${200 + i * 160},1500 L${300 + i * 160},1500 Z" fill="#FFF3C8" opacity=".35"/>`).join('') + '</g>';
  s += c.svg + chuva(t, kChuva);
  if (kChuva > 0) for (let i = 0; i < 6; i++) { const k = ((t * 2.5 + hh(i, 3)) % 1); s += `<ellipse cx="${r1(X + (hh(i, 4) - .5) * 300)}" cy="${r1(Y - 790 + k * 20)}" rx="${r1(6 + 20 * k)}" ry="${r1(3 + 6 * k)}" fill="none" stroke="#D8E8FF" stroke-width="3" opacity="${r1((1 - k) * kChuva * 100) / 100}"/>`; }
  s += plim(X, Y - 560, inv(2.0, 2.45, u) * 0.999 + (u > 2.0 ? 0.001 : 0), 330, 12);
  if (u > 2.0 && u < 3.0) s += `<text x="540" y="380" text-anchor="middle" font-family="Arial Black, Arial" font-weight="900" font-size="${r1(110 + 40 * mola(u - 2, 10, 4))}" fill="#C2F07F" stroke="#1C1410" stroke-width="10" paint-order="stroke" opacity="${r1(1 - inv(2.7, 3.0, u))}">FUUU!</text>`;
  const z = lerp(1, 0.85, ease(inv(2.0, 3.0, u))), sobe = ease(inv(3.1, 4.0, u)) * 520;
  return `<g transform="translate(0,${r1(sobe)})">${zoom(z, 540, 1300, s)}</g>`;
});

/** altitude da cabeça no P6 (unidades = pixels) */
const ALT = [[0, 0], [1.5, 1100], [2.2, 2200], [3.2, 3600], [4.3, 5000], [5.0, 5600], [6.5, 6150]];
function altP6(u) { for (let i = 1; i < ALT.length; i++) if (u <= ALT[i][0]) { const [a, b] = [ALT[i - 1], ALT[i]], k = (u - a[0]) / (b[0] - a[0]); return lerp(a[1], b[1], i === ALT.length - 1 ? 1 - (1 - k) * (1 - k) : k); } return ALT[ALT.length - 1][1]; }
// P6 (19,0–25,5): ele virou o pé de feijão e sobe: prédios, passarinhos, avião, fura as nuvens.
plano('P6 cresce', 6.5, (u, t) => {
  const A = altP6(u), HY = 820, Y = a => HY + (A - a);
  const ceuK = cl(A / 5600);
  let s = `<rect x="-100" y="-100" width="${W + 200}" height="${H + 200}" fill="#86C6F0"/><rect x="-100" y="-100" width="${W + 200}" height="${H + 200}" fill="#2F5FB8" opacity="${r1(ceuK * 0.8 * 100) / 100}"/>`;
  if (A > 5300) s += `<rect x="-100" y="-100" width="${W + 200}" height="${H + 200}" fill="url(#ceuAlto)" opacity="${r1(inv(5300, 5700, A) * 100) / 100}"/><circle cx="860" cy="330" r="180" fill="url(#solAlto)" opacity="${r1(inv(5300, 5700, A) * 100) / 100}"/>`;
  // nuvenzinhas soltas (paralaxe .7)
  for (const [a, x, e] of [[1500, 160, .7], [2700, 900, .9], [3300, 140, .6], [4200, 820, 1.0], [4600, 240, .8]]) { const yy = HY + (A - a) * 0.7; if (yy > -300 && yy < H + 300) s += nuvemFofa(x, yy, e); }
  // prédios dos lados
  s += predios(Y(-400), -80, 330, 5, ['#E6B88A', '#C9D7E8', '#E9D3A0']) + predios(Y(-400), 760, 1250, 6, ['#B9D3C2', '#E8A99A', '#C9D7E8']);
  // passarinhos
  for (let i = 0; i < 6; i++) { const yy = Y(2150 + (i % 3) * 60) , xx = -200 + (u - 1.4) * 900 + i * 70 - (i % 2) * 40; if (yy > -100 && yy < H + 100) s += passarinho(xx, yy, 1.4, u * 3 + i * .3); }
  // o avião (passa por trás do pé)
  const av = [1500 - (u - 2.3) * 1050, Y(3350)];
  if (av[1] > -300 && av[1] < H + 300) s += aviao(av[0], av[1], 1.0, t);
  // o caule (o corpo dele virou caule) com folhas e vagens que passam
  const sway = yy => Math.sin(yy * 0.004 + t * 2) * 30 * cl((yy - HY) / 1100);
  const pts = []; for (let yy = HY + 120; yy <= H + 200; yy += 100) pts.push([540 + sway(yy), yy]);
  s += caule(pts, 150);
  s += caule(pts.map(p => [p[0] - 34, p[1]]), 18, '#5BC24A');
  for (let i = 0; i < 40; i++) { const a = i * 240 - 300, yy = Y(a); if (yy < HY + 160 || yy > H + 100) continue; const ld = i % 2 ? 1 : -1, xx = 540 + sway(yy) + ld * 70;
    s += folha(xx, yy, ld * 70, 1.7, Math.sin(t * 3 + i) * 6); if (i % 3 === 0) s += vagem(xx - ld * 10, yy + 20, ld > 0 ? 70 : 110, 1.2, t); }
  // os braços-galho acenando
  const aceno = Math.sin(t * 9) * 20;
  for (const ld of [-1, 1]) { const b0 = [540 + ld * 60, HY + 200], m = [540 + ld * 220, HY + 120 + aceno * ld], h = [540 + ld * 320, HY - 40 + aceno * ld * 1.5];
    s += caule([b0, m, h], 34) + folha(m[0], m[1], ld * 40, 1.0, aceno) + maoC(h[0], h[1], ld * 160 + aceno, 'aberta', ld).replace('<g transform="translate', '<g transform="scale(1) translate'); }
  // a cabeça
  const olhaAv = u > 2.6 && u < 3.9, sobeNuvem = A > 5600;
  _cid = 9000;
  s += `<g transform="translate(540,${HY + 140}) scale(1.4)">${cabecaC({ t, planta: 1, kO: 0.8, olhos: 'arregalados', boca: sobeNuvem ? 'sorriso' : olhaAv ? 'o' : 'grito', sobr: sobeNuvem ? 0.3 : 1, olho: olhaAv ? [lerp(1, -1, inv(2.6, 3.9, u)), 0.3] : [0, -0.6], inclina: 0 })}</g>`;
  // a camada de nuvens (passa na frente de tudo)
  const nt = Y(5600), nb = Y(5000);
  if (nb > -200 && nt < H + 200) {
    s += `<rect x="-100" y="${r1(nt + 60)}" width="${W + 200}" height="${r1(Math.max(0, nb - nt - 60))}" fill="#FFF6E6"/>`;
    for (let i = 0; i < 8; i++) s += nuvemFofa(-100 + i * 180, nt + 40 + (i % 2) * 30, 1.2, '#FFF6E6', '#F2C9A0');
    for (let i = 0; i < 8; i++) s += nuvemFofa(-60 + i * 180, nb - 20 + (i % 2) * 30, 1.2, '#FFFFFF', '#DCE6F2');
  }
  return s;
});

// P7 (25,5–30,5): em cima das nuvens um homem janta; boceja; a vagem do Carlos se abre e o feijão cai na boca dele. GULP.
plano('P7 nuvem', 5.0, (u, t) => {
  let s = jantar(u, t, { nuvem: true, quem: { cores: OUTRO, semBigode: true }, tBoc: 1.0, tFim: 2.15, tGulp: 2.12 });
  return s;
});

// P8 (30,5–34,0): o homem da nuvem no espelho de manhã: PLIM (laço).
plano('P8 laco', 3.5, (u, t) => espelho(u * 3.0 / 3.5 * 1.0 + 0, t, { cores: OUTRO, semBigode: true }));

/* ---------------------------------- montagem ---------------------------------- */
function frame(t) {
  let p = PLANOS[0]; for (const q of PLANOS) if (t >= q.t0 - 1e-6) p = q;
  const u = cl(t - p.t0, 0, p.dur);
  let corpo = p.fn(u, t);
  // chicote (whip) entre o jantar e o espelho
  const wOut = p.nome === 'P2 ontem' ? inv(p.dur - 0.15, p.dur, u) : 0, wIn = p.nome === 'P3 puxa' ? 1 - inv(0, 0.15, u) : 0, w = Math.max(wOut, wIn);
  if (w > 0) corpo = `<g filter="url(#chicote)" transform="translate(${r1((wOut > 0 ? -1 : 1) * w * 500)},0)">${corpo}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${DEFS_C}${DEFS_CENA}</defs>` +
    `<rect width="${W}" height="${H}" fill="#E9F6F4"/>` + corpo + `<rect width="${W}" height="${H}" fill="url(#vinheta)"/><rect width="${W}" height="${H}" filter="url(#grao)" opacity=".5"/></svg>`;
}
