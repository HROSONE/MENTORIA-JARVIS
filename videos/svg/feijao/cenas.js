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

/* ---------------------------------- os planos ---------------------------------- */
const PLANOS = [];
let TOTAL = 0;
const plano = (nome, dur, fn) => { PLANOS.push({ nome, t0: TOTAL, dur, fn }); TOTAL += dur; };

// P1 (0–3,0) O GANCHO: de manhã, no espelho, sonolento… PLIM: um broto sai da orelha. Ele congela.
plano('P1 espelho', 3.0, (u, t) => {
  const tb = 0.55, kB = mola(u - tb, 16, 5.5) * (u > tb ? 1 : 0);            // o broto nasce com sobressalto
  const susto = sv(inv(tb + 0.05, tb + 0.35, u)), olha = sv(inv(1.0, 1.4, u));
  const pulo = Math.sin(Math.PI * inv(tb + 0.02, tb + 0.3, u)) * -40;
  const c = carlos({ x: 0, y: 0, esc: 2.2, t, idBase: 0, planta: 0.22 * kB, mudaAng: -16, mudaEsc: 1.5,
    olhos: susto > 0.5 ? 'arregalados' : 'meio', olho: [olha * 1, -0.35 * olha], boca: susto > 0.5 ? 'o' : 'mastiga', sobr: susto, suor: inv(1.6, 2.0, u),
    inclina: -6 * olha + Math.sin(t * 1.3) * 2 * (1 - susto), corpoY: pulo / 2.2, bracoE: { ombro: 10, cotovelo: 20 }, bracoD: { ombro: 10, cotovelo: 20 } });
  // o espelho mostra o Carlos invertido: a orelha direita dele aparece do lado esquerdo da tela
  const z = lerp(1, 1.05, ease(inv(1.2, 3.0, u)));
  const refl = zoom(z, 520, 820, `<g transform="translate(580,2110) scale(-1,1)">${c.svg}</g>` + plim(580 - c.pts.orelha[0] + 20, 2110 + c.pts.orelha[1] - 60, inv(tb, tb + 0.35, u) * 0.999 + (u > tb ? 0.001 : 0), 90));
  return banheiro(t, refl) + pia(t);
});

function frame(t) {
  let p = PLANOS[0]; for (const q of PLANOS) if (t >= q.t0 - 1e-6) p = q;
  const u = cl(t - p.t0, 0, p.dur);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${DEFS_C}${DEFS_CENA}</defs>` +
    p.fn(u, t) + `<rect width="${W}" height="${H}" fill="url(#vinheta)"/><rect width="${W}" height="${H}" filter="url(#grao)" opacity=".5"/></svg>`;
}
