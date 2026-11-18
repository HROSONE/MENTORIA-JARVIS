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

/* ---------------------------------- os planos ---------------------------------- */
const PLANOS = [];
let TOTAL = 0;
const plano = (nome, dur, fn) => { PLANOS.push({ nome, t0: TOTAL, dur, fn }); TOTAL += dur; };

// P1 (0–3,2) O GANCHO: pimenta, "ah… ah…", ATCHIM: o nariz sai voando da cara.
plano('P1 atchim', 3.2, (u, t) => {
  const X = 520, Y = 1950, E = 2.0, tA = 1.2;
  const ah = u < tA, k = inv(tA, tA + 0.5, u);
  const c = carlos({ x: X, y: Y, esc: E, t, idBase: 0, semNariz: !ah, olhos: ah ? 'meio' : (k < 0.6 ? 'fechados' : 'arregalados'), boca: ah ? 'o' : k < 0.6 ? 'grito' : 'o',
    sobr: ah ? 0.8 : 1, inclina: ah ? -8 * inv(0.3, tA, u) : 10 * Math.exp(-5 * (u - tA)), corpoY: ah ? -10 * inv(0.3, tA, u) : 16 * Math.exp(-6 * (u - tA)),
    bracoE: { ombro: 22, cotovelo: 50 }, maoE: 'punho', bracoD: REPOUSO });
  const face = [X, Y - 500 * E];
  let s = cozinha(t) + c.svg + `<g transform="translate(${r1(c.pts.maoE[0] + 70)},${r1(c.pts.maoE[1] + 30)}) scale(${E})">${pimenteiro(ah ? 20 + Math.sin(u * 30) * 10 : 10, 0.9)}</g>` + poPimenta(face[0], face[1] - 40, t, ah ? inv(0.1, 0.6, u) : 1 - inv(tA, tA + 0.6, u), 170);
  if (!ah) {
    const kv = ease(inv(tA, tA + 0.9, u)), nx = lerp(face[0], 250, kv), ny = lerp(face[1], 560, kv) - Math.sin(Math.PI * kv) * 120;
    s += rastro(face[0], face[1], nx, ny, 5, 50 * (1 - inv(tA + 0.9, tA + 1.4, u)));
    _cid = 3000; s += narizSolto(nx, ny, E * lerp(1, 1.5, kv), u * 600 * (1 - inv(tA + 0.6, tA + 1.2, u)) + 0);
    s += plim(face[0], face[1], inv(tA, tA + 0.3, u) * 0.999 + 0.001, 140, 12);
    s += `<text x="540" y="250" text-anchor="middle" font-family="Arial Black, Arial" font-weight="900" font-size="${r1(120 + 40 * mola(u - tA, 12, 4))}" fill="#FFF3C8" stroke="#1C1410" stroke-width="10" paint-order="stroke" transform="rotate(-6,540,250)">ATCHIM!</text>`;
  }
  return s;
});

function frame(t) {
  let p = PLANOS[0]; for (const q of PLANOS) if (t >= q.t0 - 1e-6) p = q;
  const u = cl(t - p.t0, 0, p.dur);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${DEFS_C}${DEFS_CENA}</defs>` +
    p.fn(u, t) + `<rect width="${W}" height="${H}" fill="url(#vinheta)"/><rect width="${W}" height="${H}" filter="url(#grao)" opacity=".5"/></svg>`;
}
