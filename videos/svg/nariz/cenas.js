/* =====================================================================================
   CENAS do Short "O nariz fugiu 👃 (ficção)" (2D, SVG, 1080×1920, 30 fps). frame(t) devolve o SVG inteiro do instante t.
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

/* ---------------------------------- a cozinha de dia ---------------------------------- */
function pimenteiro(ang = 0, esc = 1) {        // saleiro de pimenta-do-reino (na mão: origem = mão)
  return `<g transform="rotate(${r1(ang)}) scale(${esc})"><path d="M-26,-10 L26,-10 L22,-110 L-22,-110 Z" fill="#E9E4DA" stroke="#1C1410" stroke-width="6"/>` +
    `<rect x="-20" y="-80" width="40" height="50" fill="#3A2C24"/><text x="0" y="-48" text-anchor="middle" font-family="Arial Black, Arial" font-weight="900" font-size="15" fill="#F2E6C8">PIMENTA</text>` +
    `<path d="M-24,-110 C-24,-140 24,-140 24,-110 Z" fill="#B9C2CC" stroke="#1C1410" stroke-width="6"/>` + [-8, 0, 8].map(a => `<circle cx="${a}" cy="-124" r="2.5" fill="#1C1410"/>`).join('') + `</g>`;
}
function cozinha(t) {
  let s = `<rect x="-300" y="-300" width="${W + 600}" height="${H + 600}" fill="#FFF3D9"/>`;
  for (let y = 900; y < H + 300; y += 90) for (let x = -100; x < W + 200; x += 90) s += `<rect x="${x + ((y / 90) % 2) * 45}" y="${y}" width="86" height="86" fill="${((x + y) / 90) % 2 ? '#F6E7C4' : '#EFD9A8'}"/>`;
  s += `<rect x="-300" y="880" width="${W + 600}" height="24" fill="#C98A4A" stroke="#1C1410" stroke-width="6"/>`;
  // janela com sol
  s += `<rect x="610" y="170" width="330" height="420" rx="14" fill="#BFE6FA" stroke="#7A4E2A" stroke-width="22"/><circle cx="860" cy="260" r="50" fill="#FFF0A0"/><path d="M775,170 L775,590 M610,380 L940,380" stroke="#7A4E2A" stroke-width="14"/>` +
    `<path d="M590,160 Q680,300 600,620 L560,620 L560,160 Z" fill="#E86A5A" stroke="#1C1410" stroke-width="6"/>`;
  // prateleira com potes
  s += `<rect x="60" y="400" width="420" height="22" fill="#9A6234" stroke="#1C1410" stroke-width="6"/>` +
    [[110, '#D9473B'], [200, '#58B83E'], [290, '#F0A93A'], [380, '#5C93DA']].map(([x, c], i) => `<rect x="${x - 34}" y="${300 - i % 2 * 20}" width="68" height="${100 + i % 2 * 20}" rx="10" fill="${c}" stroke="#1C1410" stroke-width="6"/><rect x="${x - 38}" y="${288 - i % 2 * 20}" width="76" height="22" rx="6" fill="#E9E4DA" stroke="#1C1410" stroke-width="5"/>`).join('');
  return s;
}
/** nuvem de pimenta: pontinhos escuros em volta de (x,y) */
function poPimenta(x, y, t, k, r = 120) {
  let s = ''; for (let i = 0; i < 40; i++) { const a = hh(i, 1) * 6.28 + t * 0.6, d = r * (0.3 + hh(i, 2) * 0.9) * (0.6 + 0.4 * k);
    s += `<circle cx="${r1(x + Math.cos(a) * d)}" cy="${r1(y + Math.sin(a) * d * 0.7 - t * 20 % 30)}" r="${r1(2 + hh(i, 3) * 4)}" fill="#3A2C24" opacity="${r1(0.7 * k * 100) / 100}"/>`; }
  return s;
}
/** linhas de velocidade de (x0,y0) até (x1,y1) */
function rastro(x0, y0, x1, y1, n = 5, w = 60) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; let s = '';
  for (let i = 0; i < n; i++) { const o = (i / (n - 1) - 0.5) * w * 2, a = 0.15 + hh(i, 5) * 0.25;
    s += `<path d="M${r1(x0 + nx * o + dx * a)},${r1(y0 + ny * o + dy * a)} L${r1(x1 + nx * o * 0.4 - dx * 0.12)},${r1(y1 + ny * o * 0.4 - dy * 0.12)}" stroke="#1C1410" stroke-width="7" stroke-linecap="round" opacity=".55"/>`; }
  return s;
}

/* ---------------------------------- mais objetos ---------------------------------- */
/** batata (mesmo formato do nariz, cor de batata, olhinhos de batata) */
function batata(x, y, esc = 1, ang = 0, cor = '#D9AE7C', somb = '#A97C4C', broto = 0, t = 0) {
  _cid = (_cid + 1) % 100000;
  let s = volP(NARIZ_D, cor, somb, '#F4D8B0', { ds: 14, dl: 4, sw: 5 }) + `<circle cx="-18" cy="-110" r="3" fill="${somb}"/><circle cx="20" cy="-90" r="3" fill="${somb}"/><circle cx="4" cy="-128" r="2.5" fill="${somb}"/>`;
  if (broto > 0) s += muda(6, -146, 10, broto, t, 3);
  return `<g transform="translate(${r1(x)},${r1(y)}) rotate(${r1(ang)}) scale(${r1(esc * 100) / 100}) translate(0,105)">${s}</g>`;
}
/** linhas de cheiro (onduladas) de (x0,y0) a (x1,y1); k = quanto já andaram (0..1) */
function cheiro(x0, y0, x1, y1, t, k = 1, n = 3, cor = '#FFE38A') {
  let s = ''; const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  for (let j = 0; j < n; j++) {
    let d = ''; const o = (j - (n - 1) / 2) * 34;
    for (let i = 0; i <= 30; i++) { const u = i / 30 * k, w = Math.sin(u * 14 - t * 6 + j) * 22 * (0.4 + u);
      d += (i ? ' L' : 'M') + r1(x0 + dx * u + nx * (o + w)) + ',' + r1(y0 + dy * u + ny * (o + w)); }
    s += `<path d="${d}" fill="none" stroke="#8A5A2A" stroke-width="20" stroke-linecap="round" opacity=".35"/><path d="${d}" fill="none" stroke="${cor}" stroke-width="12" stroke-linecap="round" opacity=".95"/>`;
  }
  return s;
}
/** pão francês grandão */
function pao(x, y, esc = 1, ang = 0) {
  return `<g transform="translate(${r1(x)},${r1(y)}) rotate(${r1(ang)}) scale(${r1(esc * 100) / 100})"><path d="M-130,0 C-130,-50 -60,-62 0,-62 C60,-62 130,-50 130,0 C130,40 60,48 0,48 C-60,48 -130,40 -130,0 Z" fill="#D9963E" stroke="#1C1410" stroke-width="7"/>` +
    `<path d="M-110,-6 C-70,-40 70,-46 110,-10" fill="none" stroke="#F2C277" stroke-width="12" opacity=".7"/>` + [-60, 0, 60].map(a => `<path d="M${a - 26},-22 Q${a},-46 ${a + 26},-30" fill="none" stroke="#F7DFA6" stroke-width="10" stroke-linecap="round"/>`).join('') + `</g>`;
}
/** cachorro deitado de lado (olhando para a esquerda); olha = -1..1 vira a cabeça */
function cachorro(x, y, esc = 1, t = 0, olha = 0, acorda = 0) {
  const rabo = Math.sin(t * (6 + 10 * acorda)) * (10 + 25 * acorda);
  let s = `<ellipse cx="0" cy="4" rx="170" ry="16" fill="#000" opacity=".2"/>`;
  s += `<path d="M120,-40 Q${r1(170 + rabo * .3)},${r1(-90 + rabo)} ${r1(190 + rabo * .5)},${r1(-70 + rabo)}" fill="none" stroke="#1C1410" stroke-width="20" stroke-linecap="round"/><path d="M120,-40 Q${r1(170 + rabo * .3)},${r1(-90 + rabo)} ${r1(190 + rabo * .5)},${r1(-70 + rabo)}" fill="none" stroke="#B9783E" stroke-width="11" stroke-linecap="round"/>`;
  s += `<path d="M-120,0 C-130,-70 -40,-96 40,-96 C120,-96 150,-50 140,0 Z" fill="#B9783E" stroke="#1C1410" stroke-width="7"/><ellipse cx="40" cy="-60" rx="40" ry="24" fill="#8A5428" opacity=".6"/>`;
  s += `<path d="M-100,0 L-150,0 M-40,0 L-90,0" stroke="#1C1410" stroke-width="22" stroke-linecap="round"/><path d="M-100,0 L-150,0 M-40,0 L-90,0" stroke="#B9783E" stroke-width="13" stroke-linecap="round"/>`;
  const hx = -150, hy = -70 - 20 * acorda;
  s += `<g transform="translate(${hx},${hy}) rotate(${r1(-olha * 25)})"><ellipse cx="0" cy="0" rx="62" ry="50" fill="#C98A4E" stroke="#1C1410" stroke-width="7"/><ellipse cx="-50" cy="16" rx="34" ry="24" fill="#E8C9A0" stroke="#1C1410" stroke-width="6"/><ellipse cx="-78" cy="8" rx="11" ry="8" fill="#1C1410"/>` +
    (acorda > 0.5 ? `<circle cx="-18" cy="-12" r="11" fill="#fff" stroke="#1C1410" stroke-width="4"/><circle cx="${r1(-18 - olha * 4)}" cy="-10" r="5" fill="#1C1410"/>` : `<path d="M-30,-12 Q-18,-4 -6,-12" stroke="#1C1410" stroke-width="5" fill="none" stroke-linecap="round"/>`) +
    `<path d="M24,-36 C60,-40 70,10 40,30 C30,4 22,-14 24,-36 Z" fill="#7A4A22" stroke="#1C1410" stroke-width="6"/></g>`;
  if (acorda < 0.3) s += `<text x="${hx + 30}" y="${r1(hy - 80 - (t * 30) % 40)}" font-family="Arial Black, Arial" font-size="40" fill="#1C1410" opacity=".6">z</text>`;
  return `<g transform="translate(${r1(x)},${r1(y)}) scale(${esc})">${s}</g>`;
}
/** pernas do Carlos vistas de baixo (câmera no chão): calça + sapato, cortadas no alto */
function pernasCarlos(x, y, esc, passo) {
  let s = '';
  for (const ld of [-1, 1]) {
    const lev = Math.max(0, Math.sin(passo * Math.PI * 2 + (ld > 0 ? Math.PI : 0))) * 60, px = ld * 80;
    s += `<path d="M${px - 62},-900 L${px + 62},-900 L${px + 58},${r1(-60 - lev)} L${px - 58},${r1(-60 - lev)} Z" fill="${C.calca}" stroke="#1C1410" stroke-width="8"/><path d="M${px + 20},-900 L${px + 24},${r1(-70 - lev)}" stroke="${C.calcaSomb}" stroke-width="18" opacity=".6"/>` +
      `<path d="M${px - 66},${r1(-70 - lev)} L${px + 50},${r1(-70 - lev)} C${px + 100},${r1(-70 - lev)} ${px + 110},${r1(-10 - lev)} ${px + 96},${r1(-lev)} L${px - 70},${r1(-lev)} C${px - 80},${r1(-30 - lev)} ${px - 80},${r1(-60 - lev)} ${px - 66},${r1(-70 - lev)} Z" fill="${C.sapato}" stroke="#1C1410" stroke-width="7" transform="scale(-1,1)"/>`;
  }
  return `<g transform="translate(${r1(x)},${r1(y)}) scale(${esc})">${s}</g>`;
}
function chao(t) {          // a cozinha vista do chão: parede, rodapé, piso de tábuas, porta aberta para a rua
  let s = `<rect x="-300" y="-300" width="${W + 600}" height="1420" fill="#FFF3D9"/>`;
  for (let y = 500; y < 1110; y += 90) for (let x = -100; x < W + 200; x += 90) s += `<rect x="${x + ((y / 90) % 2) * 45}" y="${y}" width="86" height="86" fill="${((x + y) / 90) % 2 ? '#F6E7C4' : '#EFD9A8'}"/>`;
  s += `<rect x="50" y="200" width="360" height="910" fill="#BFE6FA"/><rect x="50" y="820" width="360" height="290" fill="#CFC6B6"/><rect x="50" y="200" width="360" height="910" fill="none" stroke="#7A4E2A" stroke-width="26"/>` +
    `<path d="M410,200 L560,260 L560,1060 L410,1110 Z" fill="#C98A4A" stroke="#1C1410" stroke-width="7"/><circle cx="535" cy="680" r="14" fill="#F0C43A" stroke="#1C1410" stroke-width="5"/>`;
  s += `<rect x="-300" y="1100" width="${W + 600}" height="40" fill="#9A6234" stroke="#1C1410" stroke-width="6"/>`;
  for (let k = 0; k < 9; k++) { const y0 = 1140 + Math.pow(k / 9, 1.6) * 800, y1 = 1140 + Math.pow((k + 1) / 9, 1.6) * 800;
    s += `<rect x="-300" y="${r1(y0)}" width="${W + 600}" height="${r1(y1 - y0)}" fill="${k % 2 ? '#C58B55' : '#B97E48'}" stroke="#7A4E2A" stroke-width="3"/>`; }
  return s;
}
function ruaLonga(camX, comPadaria = false) {
  let s = `<g transform="translate(${r1(-camX * 0.6)},0)">${predios(1470, -100, camX * 0.6 + 1400, 3, ['#E6B88A', '#C9D7E8', '#E9D3A0', '#B9D3C2', '#E8A99A'])}</g>`;
  s += `<rect x="-100" y="1462" width="${W + 200}" height="120" fill="#CFC6B6" stroke="#1C1410" stroke-width="6"/>`;
  for (let x = -((camX) % 160) - 60; x < W + 100; x += 160) s += `<path d="M${r1(x)},1466 L${r1(x - 30)},1580" stroke="#A9A090" stroke-width="5"/>`;
  s += `<rect x="-100" y="1580" width="${W + 200}" height="26" fill="#9C9384" stroke="#1C1410" stroke-width="6"/><rect x="-100" y="1606" width="${W + 200}" height="${H}" fill="#555B66"/>`;
  for (let x = -((camX * 1.2) % 260) - 40; x < W + 100; x += 260) s += `<rect x="${r1(x)}" y="1740" width="140" height="22" fill="#F2E6B6"/>`;
  return s;
}
/** a banca da feira: toldo listrado, placa BATATA, tábua; o monte de batatas fica por conta de quem chama */
function banca(t, yb = 1250) {
  let s = `<rect x="-300" y="-300" width="${W + 600}" height="${H + 600}" fill="url(#ceuDia)"/>` + predios(1100, -60, 1200, 8, ['#E6B88A', '#C9D7E8', '#E9D3A0']);
  s += `<rect x="-300" y="1100" width="${W + 600}" height="900" fill="#CFC6B6"/>`;
  s += `<path d="M40,120 L40,1300 M1040,120 L1040,1300" stroke="#1C1410" stroke-width="30"/><path d="M40,120 L40,1300 M1040,120 L1040,1300" stroke="#8A5A30" stroke-width="18"/>`;
  for (let i = 0; i < 12; i++) s += `<path d="M${-40 + i * 100},90 L${60 + i * 100},90 L${60 + i * 100},300 Q${10 + i * 100},340 ${-40 + i * 100},300 Z" fill="${i % 2 ? '#FFF6E4' : '#D9473B'}" stroke="#1C1410" stroke-width="6"/>`;
  s += `<g transform="translate(540,410) rotate(-3)"><rect x="-210" y="-60" width="420" height="120" rx="12" fill="#FFF3D6" stroke="#1C1410" stroke-width="8"/><text x="0" y="28" text-anchor="middle" font-family="Arial Black, Arial" font-weight="900" font-size="86" fill="#7A4A22">BATATA</text></g>`;
  return s;
}
function balcao(yb = 1250) {
  let s = `<rect x="-60" y="${yb}" width="${W + 120}" height="${H}" fill="#A9733F" stroke="#1C1410" stroke-width="8"/>`;
  for (let y = yb + 90; y < H; y += 110) s += `<path d="M-60,${y} L${W + 60},${y}" stroke="#7A4E2A" stroke-width="6"/>`;
  return s + `<rect x="-60" y="${yb - 20}" width="${W + 120}" height="34" fill="#C98A4A" stroke="#1C1410" stroke-width="7"/>`;
}
/** o monte de batatas (posições fixas), com o nariz escondido no lugar `esc` */
const MONTE = []; for (let i = 0; i < 26; i++) { const fila = i < 9 ? 0 : i < 17 ? 1 : i < 23 ? 2 : 3, nf = [9, 8, 6, 3][fila], j = i - [0, 9, 17, 23][fila];
  MONTE.push([540 + (j - (nf - 1) / 2) * 104 + (hh(i, 1) - .5) * 20, -fila * 70 + (hh(i, 2) - .5) * 14, (hh(i, 3) - .5) * 70, 0.95 + hh(i, 4) * 0.25]); }
const ESCONDE = 20;
function monte(yb, t, { nariz = 1, tremer = 0, cheira = 0, pular = 0, tira = [] } = {}) {
  let s = '';
  MONTE.forEach(([x, y, a, e], i) => {
    if (tira.includes(i)) return;
    if (i === ESCONDE && nariz) { _cid = 4000; const tr = Math.sin(t * 50) * 6 * tremer, sn = 1 + Math.max(0, Math.sin(t * 22)) * 0.12 * cheira;
      s += narizSolto(x + tr, yb + y - 46 - pular, 0.95 * e * sn, a * (1 - cheira), { pernas: pular > 0 ? 1 : 0.35 * tremer, passo: t * 4 }); return; }
    s += batata(x, yb + y - 46, 0.95 * e, a, i % 4 === 1 ? '#E8BC8C' : '#D9AE7C');
  });
  return s;
}

/* ---------------------------------- os planos ---------------------------------- */
const PLANOS = [];
let TOTAL = 0;
const plano = (nome, dur, fn) => { PLANOS.push({ nome, t0: TOTAL, dur, fn }); TOTAL += dur; };
const titulo = (txt, x, y, tam, k, cor = '#FFF3C8', ang = -6) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial Black, Arial" font-weight="900" font-size="${r1(tam * (0.8 + 0.2 * mola(k, 12, 4)))}" fill="${cor}" stroke="#1C1410" stroke-width="10" paint-order="stroke" transform="rotate(${ang},${x},${y})">${txt}</text>`;

// P1 (0–3,2) O GANCHO: pimenta, "ah… ah…", ATCHIM: o nariz sai voando da cara.
plano('P1 atchim', 3.2, (u, t) => {
  const X = 520, Y = 1950, E = 2.0, tA = 1.2;
  const ah = u < tA, k = inv(tA, tA + 0.5, u);
  const c = carlos({ x: X, y: Y, esc: E, t, idBase: 0, semNariz: !ah, olhos: ah ? 'meio' : (k < 0.6 ? 'fechados' : 'arregalados'), boca: ah ? 'o' : k < 0.6 ? 'grito' : 'o',
    sobr: ah ? 0.8 : 1, inclina: ah ? -8 * inv(0.3, tA, u) : 10 * Math.exp(-5 * (u - tA)), corpoY: ah ? -10 * inv(0.3, tA, u) : 16 * Math.exp(-6 * (u - tA)),
    bracoE: { ombro: 22, cotovelo: 50 }, maoE: 'punho', bracoD: REPOUSO, olho: !ah && k >= 0.6 ? [-0.8, -0.8] : [0, 0] });
  const face = [X, Y - 500 * E];
  let s = cozinha(t) + c.svg + `<g transform="translate(${r1(c.pts.maoE[0] + 70)},${r1(c.pts.maoE[1] + 30)}) scale(${E})">${pimenteiro(ah ? 20 + Math.sin(u * 30) * 10 : 10, 0.9)}</g>` + poPimenta(face[0], face[1] - 40, t, ah ? inv(0.1, 0.6, u) : 1 - inv(tA, tA + 0.6, u), 170);
  if (!ah) {
    const kv = ease(inv(tA, tA + 0.9, u)), nx = lerp(face[0], 250, kv), ny = lerp(face[1], 560, kv) - Math.sin(Math.PI * kv) * 120;
    s += rastro(face[0], face[1], nx, ny, 5, 50 * (1 - inv(tA + 0.9, tA + 1.4, u)));
    _cid = 3000; s += narizSolto(nx, ny, E * lerp(1, 1.5, kv), u * 600 * (1 - inv(tA + 0.6, tA + 1.2, u)));
    s += plim(face[0], face[1], inv(tA, tA + 0.3, u) * 0.999 + 0.001, 140, 12);
    s += titulo('ATCHIM!', 540, 250, 150, u - tA);
  }
  const z = ah ? 1 + 0.08 * ease(inv(0.2, tA, u)) : 1.08 - 0.12 * Math.exp(-6 * (u - tA)) * Math.cos(10 * (u - tA)) - 0.08 * ease(inv(tA, tA + 0.6, u));
  const sh = !ah && u < tA + 0.3 ? Math.sin(u * 90) * 14 * (1 - inv(tA, tA + 0.3, u)) : 0;
  return `<g transform="translate(${r1(sh)},0)">${zoom(z, 520, 900, s)}</g>`;
});

// P2 (3,2–6,5): câmera no chão. O nariz cai, quica, brotam perninhas, ele olha, e corre para a porta; os pés do Carlos chegam.
plano('P2 pernas', 3.3, (u, t) => {
  let s = chao(t);
  const chaoY = 1480, E = 3.4;
  let nx = 640, ny = chaoY, ang = 0, pernas = 0, dir = -1, passo = 0;
  if (u < 0.9) { // cai e quica
    const q = [[0, 0.42, 1.0], [0.42, 0.68, 0.32], [0.68, 0.86, 0.1]];
    let hgt = 0; for (const [a, b, h] of q) if (u >= a && u < b) { const k = (u - a) / (b - a); hgt = a === 0 ? (1 - k * k) * 1600 : Math.sin(Math.PI * k) * h * 600; }
    nx = lerp(420, 640, inv(0, 0.86, u)); ny = chaoY - hgt; ang = (1 - inv(0, 0.86, u)) * 400;
  }
  const kP = u > 1.0 ? cl(mola(u - 1.0, 14, 5), 0, 1.2) : 0; pernas = Math.min(kP, 1);
  const sobe = 46 * E * pernas;               // o nariz levanta sobre as perninhas
  if (u > 1.6 && u < 2.2) dir = Math.sin((u - 1.6) * 10) > 0 ? 1 : -1;   // olha para os lados
  let corre = 0; if (u > 2.25) { corre = u - 2.25; nx = 640 - corre * corre * 450 - corre * 500; passo = u * 6; }
  if (u > 1.0 && u < 2.25) passo = 0.25;
  _cid = 3000; s += narizSolto(nx, ny - sobe + (corre > 0 ? -Math.abs(Math.sin(passo * Math.PI * 2)) * 18 : 0), E, ang, { pernas, passo, dir, suor: u > 2.0 ? 1 : 0 });
  s += plim(640, chaoY - 60, inv(1.0, 1.3, u) * 0.999 + (u > 1.0 ? 0.001 : 0), 120, 10);
  if (u < 0.9) for (const tq of [0.42, 0.68]) if (u > tq && u < tq + 0.25) s += titulo('POC', 820, 1180, 90, u - tq, '#FFF3C8', 8);
  // os pés do Carlos chegando pela direita
  if (u > 2.4) { const k = ease(inv(2.4, 3.3, u)); s += pernasCarlos(lerp(1600, 780, k), 1880, 1.5, u * 2.2); }
  return s;
});

// P3 (6,5–11,0): rua. O nariz corre na frente, o Carlos atrás tapando os furinhos; o nariz passa debaixo do cachorro; o Carlos pula.
plano('P3 rua', 4.5, (u, t) => {
  const camX = u * 700, chaoY = 1500;
  let s = `<rect x="-300" y="-300" width="${W + 600}" height="${H + 600}" fill="url(#ceuDia)"/>` + nuvemFofa(300 - camX * 0.1, 260, .8) + nuvemFofa(950 - camX * 0.1, 430, .6) + ruaLonga(camX);
  const cX = 1800 - camX, nX = 720 + Math.sin(u * 3) * 30, carX = 350;
  const passaN = inv(1.5, 1.8, u), acorda = sv(inv(1.6, 1.9, u));
  s += cachorro(cX, chaoY, 1.0, t, acorda ? lerp(-1, 1, inv(1.6, 2.6, u)) : 0, acorda);
  _cid = 3000; s += narizSolto(nX, chaoY - 140 - Math.abs(Math.sin(u * 7 * Math.PI)) * 20 + (passaN > 0 && passaN < 1 ? 30 : 0), 1.9, 0, { pernas: 1, passo: u * 3.5, dir: 1, suor: 0.8 });
  const pulo = Math.sin(Math.PI * inv(1.95, 2.45, u)) * 220;
  const c = carlos({ x: carX, y: chaoY - pulo, esc: 1.0, t, idBase: 0, semNariz: true, passo: pulo > 0 ? null : u * 2.2, corpoY: -Math.abs(Math.sin(u * 2.2 * Math.PI * 2)) * 14,
    olhos: 'arregalados', boca: u > 1.95 && u < 2.45 ? 'grito' : 'reto', sobr: -0.6, olho: [1, 0], bracoD: ik(1, [40, -470]), maoD: 'aberta', bracoE: { ombro: 18 + Math.sin(u * 14) * 14, cotovelo: 40 } });
  s += c.svg;
  if (u > 4.0) s += `<rect x="-100" y="-100" width="${W + 200}" height="${H + 200}" fill="#fff" opacity="${r1(inv(4.0, 4.5, u) * 0.0 * 100) / 100}"/>`;
  return s;
});

// P4 (11,0–16,5): a banca de batatas. O nariz mergulha no monte; o Carlos chega e testa batatas na cara, uma por uma.
plano('P4 batatas', 5.5, (u, t) => {
  const yb = 1300, X = 560, Y = 1505, E = 1.5;
  let s = banca(t, yb);
  const [hx, hy] = MONTE[ESCONDE];
  // o Carlos entra por trás da banca
  const entra = ease(inv(0.5, 1.1, u)), cx = lerp(-300, X, entra);
  // as tentativas: [início, tipo]
  const TENT = [[1.35, 'grande'], [2.3, 'pequena'], [3.25, 'broto'], [4.2, 'doce']];
  let tent = null; for (const [t0, tipo] of TENT) if (u >= t0 && u < t0 + 0.95) tent = { k: u - t0, tipo, t0 };
  const face = [cx, Y - 470 * E];
  const L = p => [(p[0] - cx) / E, (p[1] - Y) / E];
  let bD = REPOUSO, bE = REPOUSO, olhos = 'arregalados', boca = 'o', sobr = 1, olho = [0, 0.8];
  if (tent) { const hold = tent.k > 0.12 && tent.k < 0.78; bD = ik(1, L([face[0] + 60, face[1] + 50])); olhos = hold ? 'arregalados' : 'abertos'; boca = hold ? (tent.tipo === 'broto' ? 'grito' : 'reto') : 'triste'; olho = hold ? [-0.4, 0.6] : [0, 0.8]; sobr = hold ? (tent.tipo === 'grande' ? 1 : -0.5) : 0.6; }
  const c = carlos({ x: cx, y: Y, esc: E, t, idBase: 0, semNariz: true, olhos, boca, sobr, olho, bracoE: bE, bracoD: bD, maoD: 'punho',
    passo: u < 1.1 ? u * 2 : null, corpoY: u < 1.1 ? -Math.abs(Math.sin(u * 4 * Math.PI)) * 10 : 0 });
  s += c.svg + balcao(yb);
  // o nariz pulando no monte
  const mergulho = inv(0.0, 0.5, u);
  const tira = TENT.filter(([t0]) => u >= t0).map((_, i) => [3, 12, 7, 15][i]);
  s += monte(yb, t, { nariz: u >= 0.5 ? 1 : 0, tira });
  if (u < 0.5) { _cid = 4000; s += narizSolto(lerp(-100, hx, mergulho), lerp(yb - 300, yb + MONTE[ESCONDE][1] - 46, mergulho) - Math.sin(Math.PI * mergulho) * 300, 1.0, mergulho * 340, { pernas: 1 - mergulho, passo: u * 6 }); }
  if (u >= 0.5 && u < 0.8) s += plim(hx, yb - 60, inv(0.5, 0.8, u), 80, 8);
  // a batata da vez (na cara) ou voando para fora
  if (tent) {
    const { k, tipo } = tent, src = MONTE[[3, 12, 7, 15][TENT.findIndex(q => q[0] === tent.t0)]];
    const esc = { grande: 2.4, pequena: 0.45, broto: 1.1, doce: 1.3 }[tipo] * E * 0.75;
    let px, py, ang = 0;
    if (k < 0.12) { const q = ease(k / 0.12); px = lerp(src[0], face[0], q); py = lerp(yb + src[1] - 46, face[1] + 16, q); }
    else if (k < 0.78) { px = face[0]; py = face[1] + 16; }
    else { const q = (k - 0.78) / 0.17; px = face[0] + q * 900; py = face[1] - Math.sin(Math.PI * q) * 300 + q * 200; ang = q * 500; }
    if (tipo === 'doce') s += `<g transform="translate(${r1(px)},${r1(py)}) rotate(${r1(ang + 80)}) scale(${r1(esc * 100) / 100})"><path d="M-120,0 C-120,-46 -40,-50 0,-50 C60,-50 130,-30 140,0 C130,30 60,50 0,50 C-40,50 -120,46 -120,0 Z" fill="#9A4F7A" stroke="#1C1410" stroke-width="6"/><path d="M-90,-14 C-40,-30 40,-30 100,-10" stroke="#C47AA6" stroke-width="10" fill="none"/></g>`;
    else s += batata(px, py, esc, ang, '#D9AE7C', '#A97C4C', tipo === 'broto' ? cl(mola(k - 0.2, 14, 5), 0, 1) : 0, t);
    if (tipo === 'broto' && k > 0.2 && k < 0.5) s += plim(px + 10, py - 120 * esc, inv(0.2, 0.5, k), 50, 6);
    if (k > 0.12) s += carlos({ x: cx, y: Y, esc: E, t, idBase: 5000, soBracos: 'D', bracoE: bE, bracoD: bD, maoD: 'punho', semNariz: true }).svg;
  }
  return s;
});

// P5 (16,5–21,5): cheiro de pão. A: a padaria solta linhas de cheiro, o Carlos (sem nariz) só vê; tem uma ideia. B: no monte, uma batata fareja e treme.
plano('P5 cheiro', 5.0, (u, t) => {
  if (u < 2.4) {
    let s = ceuRua(t) + rua(t);
    s += cheiro(700, 1100, -100, 700, t, ease(inv(0.1, 1.2, u)), 3);
    const ideia = u > 1.5;
    const c = carlos({ x: 300, y: 1500, esc: 1.15, t, idBase: 0, semNariz: true, olhos: ideia ? 'arregalados' : 'meio', boca: ideia ? 'sorriso' : 'triste', sobr: ideia ? 0.6 : 0.3, olho: ideia ? [1, -0.3] : [0.5, 0.2],
      bracoE: REPOUSO, bracoD: ideia ? ik(1, [150, -560]) : REPOUSO, maoD: ideia ? 'aponta' : 'aberta' });
    s += c.svg;
    if (ideia) s += plim(300, 1500 - 800 * 1.15, inv(1.5, 1.8, u), 70, 8);
    return zoom(1.3, 360, 1150, s);
  }
  const v = u - 2.4, yb = 1350;
  let s = banca(t, yb) + balcao(yb);
  s += cheiro(1200, 700, MONTE[ESCONDE][0], yb - 80, t, ease(inv(0, 0.8, v)), 3);
  const cheira = inv(0.6, 1.0, v), tremer = inv(1.4, 2.2, v);
  s += monte(yb, t, { nariz: 1, cheira, tremer, tira: [3, 12, 7, 15], pular: tremer > 0.6 ? Math.abs(Math.sin(v * 12)) * 30 : 0 });
  if (v > 0.6 && v < 2.0) s += titulo('snif snif', 470, yb - 300, 70, v - 0.6, '#FFF3C8', -4);
  return zoom(1.35, 540, yb - 80, s);
});

// P6 (21,5–27,0): a isca. O Carlos agachado com o pão; o nariz vem correndo, pula… e gruda na cara de ponta-cabeça.
plano('P6 isca', 5.5, (u, t) => {
  const X = 540, Y = 1980, E = 1.9, face = [X, Y - 470 * E];
  let s = ceuRua(t) + rua(t);
  const tPula = 2.6, tCola = 3.15, colou = u >= tCola;
  const L = p => [(p[0] - X) / E, (p[1] - Y) / E];
  const paoP = [X, Y - 300 * E];
  const mao = ik(1, L([paoP[0] + 130, paoP[1] + 10])), maoE = ik(-1, L([paoP[0] - 130, paoP[1] + 10]));
  const c = carlos({ x: X, y: Y, esc: E, t, idBase: 0, semNariz: true, olhos: colou ? 'arregalados' : 'meio', boca: colou ? (u < tCola + 0.5 ? 'o' : 'reto') : 'sorriso', sobr: colou ? 1 : 0.2,
    olho: colou ? [0, -0.9] : u > 1.0 ? [-0.8, 0.5] : [0, 0], bracoD: mao, bracoE: maoE, maoD: 'punho', maoE: 'punho', inclina: colou ? 6 * Math.exp(-5 * (u - tCola)) * Math.cos(12 * (u - tCola)) : 0 });
  s += c.svg + pao(paoP[0], paoP[1] + Math.sin(t * 5) * 8, E * 0.95, Math.sin(t * 3) * 4) + carlos({ x: X, y: Y, esc: E, t, idBase: 5000, soBracos: true, bracoD: mao, bracoE: maoE, maoD: 'punho', maoE: 'punho' }).svg;
  if (!colou) s += cheiro(paoP[0], paoP[1] - 40, -200, 1200, t, ease(inv(0, 0.8, u)), 2);
  // o nariz: chega correndo pela esquerda, pula
  _cid = 3000;
  if (u > 0.9 && u < tPula) { const k = inv(0.9, tPula, u); s += narizSolto(lerp(-120, 250, k), lerp(1500, 1420, k) - Math.abs(Math.sin(u * 7 * Math.PI)) * 22, lerp(1.3, 1.9, k), 0, { pernas: 1, passo: u * 3.5, dir: 1 }); }
  else if (u >= tPula && u < tCola) { const k = inv(tPula, tCola, u); s += narizSolto(lerp(250, face[0], k), lerp(1420, face[1], k) - Math.sin(Math.PI * k) * 380, E * lerp(1.0, 1.0, k), k * 180, { pernas: 1 - k * 0.5, passo: 0.3, dir: 1 }); }
  else if (colou) s += narizSolto(face[0], face[1], E, 180, { pernas: 1 - inv(tCola, tCola + 0.6, u), passo: u * 5 });
  if (colou && u < tCola + 0.6) { s += plim(face[0], face[1], inv(tCola, tCola + 0.4, u), 140, 12); s += titulo('PLOFT!', 540, 360, 130, u - tCola); }
  const sh = colou && u < tCola + 0.3 ? Math.sin(u * 90) * 12 * (1 - inv(tCola, tCola + 0.3, u)) : 0;
  return `<g transform="translate(0,${r1(sh)})">${s}</g>`;
});

// P7 (27,0–31,5): close: o nariz de ponta-cabeça; as duas mãos desviram; plim; ele cheira o pão, feliz.
plano('P7 conserto', 4.5, (u, t) => {
  const X = 540, Y = 2950, E = 3.4, face = [X, Y - 470 * E];
  const L = p => [(p[0] - X) / E, (p[1] - Y) / E];
  const tG = [0.5, 1.6], vira = sv(inv(tG[0] + 0.2, tG[1], u)), certo = u >= tG[1];
  const angN = 180 * (1 - vira) + (certo ? -14 * Math.exp(-6 * (u - tG[1])) * Math.sin(14 * (u - tG[1])) : 0);
  const pega = u > tG[0] && u < tG[1] + 0.25;
  const bD = pega ? ik(1, L([face[0] + 60 + Math.cos(angN / DEG) * 10, face[1] + 40]), 1.1) : REPOUSO, bE = pega ? ik(-1, L([face[0] - 60, face[1] + 30]), 1.1) : REPOUSO;
  const feliz = u > tG[1] + 0.3;
  let s = ceuRua(t) + rua(t);
  const c = carlos({ x: X, y: Y, esc: E, t, idBase: 0, semNariz: true, olhos: feliz ? 'fechados' : 'arregalados', boca: feliz ? 'sorriso' : 'reto', sobr: feliz ? 0.3 : 0.8, olho: [0, -0.9], bochecha: feliz ? 0.6 : 0, bracoD: bD, bracoE: bE, maoD: 'punho', maoE: 'punho' });
  s += c.svg; _cid = 3000; s += narizSolto(face[0], face[1], E, angN);
  if (pega) s += carlos({ x: X, y: Y, esc: E, t, idBase: 5000, soBracos: true, bracoD: bD, bracoE: bE, maoD: 'punho', maoE: 'punho' }).svg;
  if (certo && u < tG[1] + 0.5) s += plim(face[0], face[1] - 60, inv(tG[1], tG[1] + 0.4, u), 200, 12);
  if (feliz) { s += pao(540, 1880 - ease(inv(tG[1] + 0.3, tG[1] + 0.9, u)) * 150, 2.2, -4); s += cheiro(540, 1780, face[0], face[1] + 40, t, ease(inv(tG[1] + 0.6, tG[1] + 1.4, u)), 3); }
  if (u > 3.0) s += titulo('hmmm', 800, 520, 100, u - 3.0, '#FFF3C8', 6);
  return s;
});

// P8 (31,5–35,0): o pimenteiro passa no vento… "ah… ah…" ATCHIM: as orelhas saem voando batendo feito asas (laço).
plano('P8 orelhas', 3.5, (u, t) => {
  const X = 540, Y = 1950, E = 2.0, tA = 1.9, ah = u > 1.0 && u < tA, foi = u >= tA;
  let s = ceuRua(t) + rua(t);
  const c = carlos({ x: X, y: Y, esc: E, t, idBase: 0, semOrelhas: foi, olhos: foi ? (u < tA + 0.3 ? 'fechados' : 'arregalados') : ah ? 'meio' : 'abertos', boca: foi ? (u < tA + 0.3 ? 'grito' : 'triste') : ah ? 'o' : 'sorriso',
    sobr: foi ? 1 : ah ? 0.8 : 0, olho: foi && u > tA + 0.4 ? [0, -1] : u < 1.0 ? [lerp(-1, 1, inv(0.2, 1.0, u)), -0.3] : [0, 0],
    inclina: ah ? -7 * inv(1.0, tA, u) : foi ? 9 * Math.exp(-5 * (u - tA)) : 0, bracoE: REPOUSO, bracoD: REPOUSO });
  s += c.svg;
  // o pimenteiro voando no vento
  if (u < 1.3) { const k = inv(0, 1.3, u), px = lerp(-150, 1250, k), py = 760 + Math.sin(k * 9) * 40; s += `<g transform="translate(${r1(px)},${r1(py)}) scale(1.6)">${pimenteiro(u * 700, 1)}</g>` + poPimenta(px - 120, py, t, 0.8, 90); }
  if (u > 0.9 && u < 2.3) s += poPimenta(X, Y - 500 * E, t, 1 - inv(tA, tA + 0.4, u), 160);
  // as orelhas: tremem, depois voam
  const tremor = ah ? Math.sin(u * 70) * 6 * inv(1.2, tA, u) : 0;
  for (const ld of [-1, 1]) {
    const base = [X + ld * 150 * E, Y - 517 * E];
    if (!foi) continue;
    const k = u - tA, ox = base[0] + ld * k * 260, oy = base[1] - k * k * 700 - k * 300;
    _cid = 3000 + (ld + 1) * 50; s += orelhaSolta(ox, oy, E, ld, u * 4);
  }
  if (foi && u < tA + 0.7) { s += plim(X, Y - 520 * E, inv(tA, tA + 0.35, u), 330, 12); s += titulo('ATCHIM!', 540, 300, 150, u - tA); }
  return s;
});

function frame(t) {
  let p = PLANOS[0]; for (const q of PLANOS) if (t >= q.t0 - 1e-6) p = q;
  const u = cl(t - p.t0, 0, p.dur);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${DEFS_C}${DEFS_CENA}</defs>` +
    `<rect width="${W}" height="${H}" fill="#FFF3D9"/>` + p.fn(u, t) + `<rect width="${W}" height="${H}" fill="url(#vinheta)"/><rect width="${W}" height="${H}" filter="url(#grao)" opacity=".5"/></svg>`;
}
