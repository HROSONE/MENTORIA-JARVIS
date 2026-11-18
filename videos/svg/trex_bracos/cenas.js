/* =====================================================================================
   CENAS do Short "Ele não alcança a própria boca 🦖" (2D, SVG, 1080×1920, 30 fps). frame(t) devolve o SVG inteiro do instante t.
   Câmera: cada plano diz onde olha (cx, cy) e o zoom; o mundo é desenhado em unidades do REX (chão em y = 0).
   Tudo é função do tempo: qualquer quadro sai igual em qualquer ordem.
   ===================================================================================== */
const W = 1080, H = 1920;
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sv = x => { x = cl(x); return x * x * (3 - 2 * x); };
const ease = x => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const inv = (a, b, x) => cl((x - a) / (b - a));
const hh = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const molas = (t, f = 9, amort = 5) => Math.exp(-amort * t) * Math.cos(f * t);           // sobressalto amortecido

const DEFS_CENA = `
<linearGradient id="ceuT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E6FB0"/><stop offset=".45" stop-color="#7FB7D9"/><stop offset=".75" stop-color="#F6C98A"/><stop offset="1" stop-color="#FFB46A"/></linearGradient>
<radialGradient id="solT" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF8D6"/><stop offset=".25" stop-color="#FFE8A0"/><stop offset=".6" stop-color="#FFC86A" stop-opacity=".45"/><stop offset="1" stop-color="#FFB050" stop-opacity="0"/></radialGradient>
<linearGradient id="nevoa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD9A0" stop-opacity="0"/><stop offset="1" stop-color="#FFD9A0" stop-opacity=".75"/></linearGradient>
<linearGradient id="chaoT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B9A15A"/><stop offset=".4" stop-color="#9C8443"/><stop offset="1" stop-color="#6E5B2A"/></linearGradient>
<linearGradient id="planicie" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FA35A"/><stop offset=".25" stop-color="#A4974F"/><stop offset="1" stop-color="#8A7333"/></linearGradient>
<filter id="tomB"><feColorMatrix type="hueRotate" values="-28"/><feColorMatrix type="saturate" values=".8"/></filter>
<filter id="tomC"><feColorMatrix type="hueRotate" values="40"/><feComponentTransfer><feFuncR type="linear" slope=".85"/><feFuncG type="linear" slope=".8"/><feFuncB type="linear" slope=".8"/></feComponentTransfer></filter>
<radialGradient id="vinheta" cx=".5" cy=".46" r=".78"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1A1206" stop-opacity=".55"/></radialGradient>
<radialGradient id="raios" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF2C4" stop-opacity=".55"/><stop offset="1" stop-color="#FFF2C4" stop-opacity="0"/></radialGradient>
<filter id="desf2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5"/></filter>
<filter id="desf6" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="desf14" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="grao"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .35  0 0 0 .07 0"/></filter>
`;
const r1 = x => Math.round(x * 10) / 10;

/** araucária (silhueta em camadas), samambaia, cica: a flora do fim do Cretáceo */
function araucaria(x, y, h, cor, sem = 0) {
  let s = `<path d="M${x - 6},${y} L${x - 4},${y - h} L${x + 4},${y - h} L${x + 6},${y} Z" fill="${cor}"/>`;
  for (let i = 0; i < 7; i++) { const yy = y - h * (0.35 + i * 0.1), w = h * (0.32 - i * 0.035) * (0.85 + hh(i, sem) * 0.3); s += `<path d="M${r1(x - w)},${r1(yy + 14)} Q${x},${r1(yy - 26)} ${r1(x + w)},${r1(yy + 14)} Q${x},${r1(yy - 4)} ${r1(x - w)},${r1(yy + 14)} Z" fill="${cor}"/>`; }
  return s + `<ellipse cx="${x}" cy="${r1(y - h * 1.02)}" rx="${r1(h * 0.08)}" ry="${r1(h * 0.06)}" fill="${cor}"/>`;
}
function samambaia(x, y, esc, t, cor, sem = 0, dir = 1) {
  let s = `<g transform="translate(${r1(x)},${r1(y)}) scale(${r1(esc * dir)},${r1(esc)})">`;
  for (let i = 0; i < 7; i++) {
    const a = -150 + i * 20 + Math.sin(t * 1.4 + i + sem) * 3, L = 300 - Math.abs(i - 3) * 30, r = a * Math.PI / 180;
    const ex = Math.cos(r) * L, ey = Math.sin(r) * L, mx = Math.cos(r) * L * 0.5 - Math.sin(r) * 50, my = Math.sin(r) * L * 0.5 + Math.cos(r) * 50;
    s += `<path d="M0,0 Q${r1(mx)},${r1(my)} ${r1(ex)},${r1(ey)}" stroke="${cor}" stroke-width="10" fill="none" stroke-linecap="round"/>`;
    for (let k = 1; k < 10; k++) { const u = k / 10, px = 2 * (1 - u) * u * mx + u * u * ex, py = 2 * (1 - u) * u * my + u * u * ey, n = r + Math.PI / 2, l = 52 * (1 - u * 0.7);
      s += `<path d="M${r1(px)},${r1(py)} q${r1(Math.cos(n + 0.6) * l * 0.6)},${r1(Math.sin(n + 0.6) * l * 0.6)} ${r1(Math.cos(n + 0.6) * l)},${r1(Math.sin(n + 0.6) * l)} M${r1(px)},${r1(py)} q${r1(-Math.cos(n - 0.6) * l * 0.6)},${r1(-Math.sin(n - 0.6) * l * 0.6)} ${r1(-Math.cos(n - 0.6) * l)},${r1(-Math.sin(n - 0.6) * l)}" stroke="${cor}" stroke-width="7" fill="none" stroke-linecap="round"/>`; }
  }
  return s + '</g>';
}

/** mundo de fim de tarde com profundidade: céu, sol, vulcão, serras com névoa, florestas de araucária, chão. cx = onde a câmera olha (parallax) */
function paisagem(t, camX, camY, zoom) {
  const par = k => `translate(${r1(-camX * k * 0.06)},${r1(-camY * k * 0.03)})`;
  let s = `<rect width="${W}" height="${H}" fill="url(#ceuT)"/>`;
  s += `<g transform="${par(0.2)}"><circle cx="760" cy="760" r="360" fill="url(#solT)"/><circle cx="760" cy="760" r="92" fill="#FFF4C8"/>`;
  for (let i = 0; i < 9; i++) { const a = -0.3 + i * 0.07 + Math.sin(t * 0.2 + i) * 0.01; s += `<path d="M760,760 L${r1(760 + Math.cos(Math.PI + a) * 1400)},${r1(760 + Math.sin(Math.PI + a) * 1400)} L${r1(760 + Math.cos(Math.PI + a + 0.025) * 1400)},${r1(760 + Math.sin(Math.PI + a + 0.025) * 1400)} Z" fill="#FFF2C4" opacity=".07"/>`; }
  for (let i = 0; i < 5; i++) { const x = ((i * 290 + t * 10) % 1500) - 200, y = 300 + i * 120; s += `<g opacity=".85" fill="#FFE1B8"><ellipse cx="${r1(x)}" cy="${y}" rx="150" ry="26"/><ellipse cx="${r1(x + 70)}" cy="${y - 16}" rx="90" ry="30"/></g>`; }
  s += `</g>`;
  // vulcão e serras ao longe (azuladas pela distância)
  s += `<g transform="${par(0.4)}"><path d="M120,1130 L360,820 L430,800 L500,822 L760,1130 Z" fill="#8C8FB4"/><path d="M360,820 L430,800 L500,822 Q430,840 360,820 Z" fill="#F37A3C"/>`;
  for (let i = 0; i < 7; i++) { const k = ((t * 0.1 + i / 7) % 1); s += `<circle cx="${r1(430 + k * 140 + Math.sin(i * 3 + t) * 20)}" cy="${r1(790 - k * 360)}" r="${r1(30 + k * 80)}" fill="#D9C8C6" opacity="${r1((1 - k) * 0.5)}"/>`; }
  s += `<path d="M-100,1150 Q140,980 380,1080 T820,1040 T1200,1080 V1400 H-100 Z" fill="#8FA0A8"/><rect y="980" width="${W}" height="300" fill="url(#nevoa)"/></g>`;
  // floresta de araucárias (duas camadas)
  s += `<g transform="${par(0.7)}">`;
  for (let i = 0; i < 14; i++) s += araucaria(-80 + i * 95 + hh(i, 2) * 40, 1210, 220 + hh(i, 3) * 120, '#5F7A62', i);
  s += `<rect y="1120" width="${W}" height="200" fill="url(#nevoa)" opacity=".7"/>`;
  for (let i = 0; i < 10; i++) s += araucaria(-60 + i * 130 + hh(i, 5) * 50, 1290, 300 + hh(i, 6) * 160, '#3E5A3A', i + 20);
  s += `<path d="M-200,1280 Q300,1250 700,1275 T1400,1270 V2400 H-200 Z" fill="url(#planicie)"/>`;
  for (let i = 0; i < 18; i++) { const x = -100 + i * 75 + hh(i, 30) * 40, y = 1300 + hh(i, 31) * 60; s += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(40 + hh(i, 32) * 50)}" ry="${r1(10 + hh(i, 33) * 8)}" fill="#55753A" opacity=".55"/>`; }
  s += `</g>`;
  return s;
}
/** chão do mundo (em coordenadas do mundo, desenhado dentro da câmera) */
function chao(x0, x1) {
  let s = `<rect x="${x0}" y="0" width="${x1 - x0}" height="900" fill="url(#chaoT)"/>`;
  for (let i = 0; i < 40; i++) { const x = x0 + hh(i, 9) * (x1 - x0), y = 20 + hh(i, 10) * 300; s += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(8 + hh(i, 11) * 18)}" ry="${r1(3 + hh(i, 12) * 5)}" fill="#6B5626" opacity=".5"/>`; }
  for (let i = 0; i < 26; i++) { const x = x0 + hh(i, 13) * (x1 - x0); s += `<path d="M${r1(x)},4 q-6,-26 -14,-40 M${r1(x)},4 q2,-30 4,-46 M${r1(x)},4 q8,-24 18,-34" stroke="#6F8A3A" stroke-width="4" fill="none" stroke-linecap="round"/>`; }
  return s;
}
const camera = (cx, cy, z, c) => `<g transform="translate(${W / 2},${H / 2}) scale(${r1(z * 100) / 100}) translate(${r1(-cx)},${r1(-cy)})">${c}</g>`;

/** o pedaço de carne (coxa de presa, desenho) */
function carne(x, y, ang = 0, esc = 1) {
  return `<g transform="translate(${r1(x)},${r1(y)}) rotate(${r1(ang)}) scale(${esc})">
    <path d="M-6,-6 L-46,-14 Q-62,-24 -60,-8 Q-74,-2 -60,8 Q-58,22 -46,12 L-6,6 Z" fill="#F6EEDA" stroke="#17240A" stroke-width="4"/>
    <path d="M-10,-26 Q30,-40 52,-14 Q62,10 40,26 Q8,38 -12,18 Q-20,0 -10,-26 Z" fill="#B5422F" stroke="#17240A" stroke-width="5"/>
    <path d="M0,-20 Q28,-28 44,-8" stroke="#E07560" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M6,6 Q20,12 34,4" stroke="#7E2A1E" stroke-width="4" fill="none"/></g>`;
}

/* -------------------------------------------------------------------------------- PLANOS */
const PLANOS = [];
let TOTAL = 0;
const plano = (nome, dur, fn) => { PLANOS.push({ nome, t0: TOTAL, dur, fn }); TOTAL += dur; };

// P1 (0–3,2): o gancho. Close de perfil do peito e da cabeça: a carne na mão de cá; o braço sobe tudo que pode, a cabeça desce,
// a língua tenta, sobra o vão; a carne escorrega e cai. Push-in lento; tranco quando a carne cai.
function cenaCarne(u, t, dur = 3.2) {
  const sobe = ease(inv(0.15, 1.1, u)), estica = ease(inv(0.9, 1.8, u)), cai = inv(2.05, 2.75, u), desiste = ease(inv(2.5, 3.0, u));
  const treme = estica * (1 - desiste) * Math.sin(t * 46) * 2.2;
  const pose = {
    t, idBase: 0, respira: 1, suor: estica,
    pescoco: lerp(0, 22, estica) - 6 * desiste, cabeca: lerp(0, 16, estica) - 4 * desiste, boca: lerp(0.05, 0.55, estica) * (1 - desiste) + 0.05,
    olho: [lerp(0.2, -0.6, sobe), lerp(0.3, 1, sobe)], sobrancelha: lerp(0, -0.8, estica) + desiste * 1.1,
    bracoCa: { ombro: lerp(0, -95, sobe) + treme, cotovelo: lerp(0, -58, estica) + treme, pulso: lerp(0, -40, estica), dedos: 0.2 + 0.6 * cai },
    bracoLa: { ombro: lerp(0, -80, sobe) - treme, cotovelo: lerp(0, -40, estica), pulso: -20, dedos: 0.5 },
  };
  const R = rexLado(pose);
  // a carne vai na mão de cá (ponto aproximado pela pose: ombro (452,-292) girado), e cai depois
  const S = [452, -292], a1 = pose.bracoCa.ombro * Math.PI / 180, E0 = [470, -232], dE = [E0[0] - S[0], E0[1] - S[1]];
  const E = [S[0] + dE[0] * Math.cos(a1) - dE[1] * Math.sin(a1), S[1] + dE[0] * Math.sin(a1) + dE[1] * Math.cos(a1)];
  const a2 = a1 + pose.bracoCa.cotovelo * Math.PI / 180, dW = [38, 26], Wp = [E[0] + dW[0] * Math.cos(a2) - dW[1] * Math.sin(a2), E[1] + dW[0] * Math.sin(a2) + dW[1] * Math.cos(a2)];
  let cx = Wp[0] + 30, cy = Wp[1] - 18, ang = -30 + a2 * 57;
  if (cai > 0) { cy += 900 * cai * cai; cx += 60 * cai; ang += 300 * cai; }
  const quica = u > 2.75 ? Math.abs(Math.sin((u - 2.75) * 9)) * Math.exp(-(u - 2.75) * 6) * 40 : 0;
  if (u > 2.75) cy = Math.min(cy, -24 - quica);
  const z = lerp(1.72, 1.9, sv(u / dur)) + 0.05 * molas(Math.max(0, u - 2.75), 18, 7) * (u > 2.75 ? 1 : 0);
  const mundo = chao(-1400, 1600) + R.svg + carne(cx, cy, ang, 1.15);
  return camera(650, -470, z, mundo);
}
plano('P1 carne', 3.2, (u, t) => cenaCarne(u, t));

/* ---------- objetos de cena */
function mosquito(x, y, t, esc = 1, pousado = 0) {
  const asa = pousado > 0.5 ? 0.15 : Math.sin(t * 90) * 0.5 + 0.5;
  return `<g transform="translate(${r1(x)},${r1(y)}) scale(${esc})">
    <ellipse cx="-8" cy="-10" rx="${r1(22 * (0.4 + asa))}" ry="9" fill="#DDF3FF" opacity=".75" stroke="#2A3A48" stroke-width="2" transform="rotate(-30,-8,-10)"/>
    <ellipse cx="4" cy="-12" rx="${r1(20 * (0.4 + asa))}" ry="8" fill="#DDF3FF" opacity=".75" stroke="#2A3A48" stroke-width="2" transform="rotate(-60,4,-12)"/>
    <path d="M-20,0 Q0,-10 18,-2 Q4,8 -20,0 Z" fill="#3B2A22" stroke="#1A120C" stroke-width="2.5"/><circle cx="20" cy="-3" r="6" fill="#3B2A22"/><circle cx="22" cy="-5" r="2" fill="#F33"/>
    <path d="M24,-1 L40,6" stroke="#1A120C" stroke-width="2.5"/>
    <path d="M-10,2 l-8,14 M-2,3 l-2,16 M6,2 l6,14" stroke="#1A120C" stroke-width="2" fill="none"/></g>`;
}
function arvore(x, t) {                                                  // tronco grosso de araucária para coçar
  let s = `<path d="M${x - 70},20 C${x - 60},-500 ${x - 40},-900 ${x - 30},-1400 L${x + 40},-1400 C${x + 50},-900 ${x + 70},-500 ${x + 80},20 Z" fill="#6B4A2E" stroke="#1E140A" stroke-width="8"/>`;
  for (let i = 0; i < 14; i++) { const y = -60 - i * 95; s += `<path d="M${x - 55 + i},${y} q55,-30 120,0" stroke="#4A321E" stroke-width="6" fill="none"/>`; }
  s += `<path d="M${x + 40},-1300 C${x + 60},-800 ${x + 70},-400 ${x + 74},10" stroke="#9C7448" stroke-width="10" fill="none" opacity=".6"/>`;
  return s;
}
function regua(x0, y, x1, txt, alt = 26) {                               // régua de madeira com marcas e o número
  let s = `<rect x="${r1(x0)}" y="${r1(y - alt / 2)}" width="${r1(x1 - x0)}" height="${alt}" rx="4" fill="#F2C55C" stroke="#4A3210" stroke-width="4"/>`;
  for (let i = 0; i <= 10; i++) { const x = x0 + (x1 - x0) * i / 10; s += `<path d="M${r1(x)},${r1(y - alt / 2)} v${i % 5 ? 9 : 16}" stroke="#4A3210" stroke-width="3"/>`; }
  return s + `<text x="${r1((x0 + x1) / 2)}" y="${r1(y + alt / 2 - 3)}" font-family="DejaVu Sans" font-weight="900" font-size="${r1(alt * 0.62)}" text-anchor="middle" fill="#4A3210">${txt}</text>`;
}
function fita(x0, y, x1, txt, k = 1) {                                  // fita métrica amarela que se desenrola
  const xe = lerp(x0, x1, k);
  let s = `<rect x="${r1(x0)}" y="${r1(y - 22)}" width="${r1(xe - x0)}" height="44" fill="#FFD84A" stroke="#3B2A06" stroke-width="5"/>`;
  for (let x = x0; x < xe; x += 34) s += `<path d="M${r1(x)},${r1(y - 22)} v${(Math.round((x - x0) / 34) % 5) ? 12 : 22}" stroke="#3B2A06" stroke-width="3"/>`;
  s += `<rect x="${r1(xe - 10)}" y="${r1(y - 34)}" width="26" height="68" rx="6" fill="#D93B2B" stroke="#3B2A06" stroke-width="5"/>`;
  if (k > 0.98) s += `<g><rect x="${r1((x0 + x1) / 2 - 150)}" y="${r1(y - 150)}" width="300" height="100" rx="20" fill="#FFF6DA" stroke="#3B2A06" stroke-width="6"/><text x="${r1((x0 + x1) / 2)}" y="${r1(y - 75)}" font-family="DejaVu Sans" font-weight="900" font-size="74" text-anchor="middle" fill="#3B2A06">${txt}</text></g>`;
  return s;
}
function pessoa(x, y, t, { braco = 0, susto = 0 } = {}) {               // paleontóloga de chapéu (1,7 m = 235 unidades), braço esquerdo estendido para a direita
  const c = '#17240A';
  return `<g transform="translate(${r1(x)},${r1(y)})">
    <path d="M-22,-110 L-28,0 L-8,0 L-2,-80 L6,0 L26,0 L22,-110 Z" fill="#7A6040" stroke="${c}" stroke-width="5"/>
    <path d="M-34,-200 Q-38,-150 -26,-104 L26,-104 Q38,-150 34,-200 Q0,-212 -34,-200 Z" fill="#D9C08A" stroke="${c}" stroke-width="5"/>
    <path d="M28,-192 L${r1(28 + 92 * Math.cos(braco))},${r1(-192 + 92 * Math.sin(braco) * 0.2)}" stroke="${c}" stroke-width="22" stroke-linecap="round"/>
    <path d="M28,-192 L${r1(28 + 92 * Math.cos(braco))},${r1(-192 + 92 * Math.sin(braco) * 0.2)}" stroke="#D9C08A" stroke-width="13" stroke-linecap="round"/>
    <circle cx="${r1(28 + 98 * Math.cos(braco))}" cy="${r1(-192 + 98 * Math.sin(braco) * 0.2)}" r="10" fill="#E9B98E" stroke="${c}" stroke-width="4"/>
    <path d="M-30,-196 L-46,-120" stroke="${c}" stroke-width="20" stroke-linecap="round"/><path d="M-30,-196 L-46,-120" stroke="#D9C08A" stroke-width="11" stroke-linecap="round"/>
    <circle cx="0" cy="-228" r="26" fill="#E9B98E" stroke="${c}" stroke-width="5"/>
    <circle cx="9" cy="-232" r="${r1(3.5 + 3 * susto)}" fill="${c}"/><path d="M4,${r1(-214 + 2 * susto)} q8,${r1(4 + 6 * susto)} 14,0" stroke="${c}" stroke-width="3" fill="${susto > 0.5 ? c : 'none'}"/>
    <path d="M-44,-244 L44,-244 L30,-252 Q0,-290 -30,-252 Z" fill="#B88A44" stroke="${c}" stroke-width="5"/></g>`;
}
function tronco(x, y, ang, esc = 1) {                                   // tora de madeira (o peso do bíceps) com a etiqueta pendurada
  return `<g transform="translate(${r1(x)},${r1(y)}) rotate(${r1(ang)}) scale(${esc})">
    <rect x="-150" y="-26" width="300" height="52" rx="26" fill="#8A5E36" stroke="#1E140A" stroke-width="6"/>
    <path d="M-120,-10 q60,-12 120,0 q60,12 110,-2" stroke="#5E3E20" stroke-width="5" fill="none"/>
    <ellipse cx="150" cy="0" rx="16" ry="26" fill="#D9B07A" stroke="#1E140A" stroke-width="5"/><ellipse cx="150" cy="0" rx="8" ry="14" fill="none" stroke="#8A5E36" stroke-width="3"/>
    <path d="M-90,22 L-90,70" stroke="#3B2A06" stroke-width="4"/>
    <g transform="rotate(${r1(-ang)},-90,90)"><rect x="-150" y="70" width="120" height="58" rx="10" fill="#FFF6DA" stroke="#3B2A06" stroke-width="5"/><text x="-90" y="112" font-family="DejaVu Sans" font-weight="900" font-size="32" text-anchor="middle" fill="#3B2A06">~200 kg</text></g></g>`;
}
function carcaca(x, y, t, esc = 1) {                                    // edmontossauro deitado (desenho), olho em X
  const c = '#17240A';
  return `<g transform="translate(${r1(x)},${r1(y)}) scale(${esc})">
    ${vol('M-520,-60 C-420,-150 -200,-250 40,-240 C220,-232 330,-170 360,-90 C380,-30 330,0 260,0 L-480,0 C-540,-10 -560,-40 -520,-60 Z', { base: '#7E8C9C', sombra: '#4E5A68', luz: '#E8EEF4', ds: 40, dl: 10, textura: 'rxEsc' })}
    ${vol('M300,-150 C380,-200 470,-210 560,-180 C620,-160 650,-120 640,-96 C600,-80 520,-90 450,-70 C380,-50 330,-80 300,-150 Z', { base: '#7E8C9C', sombra: '#4E5A68', luz: '#E8EEF4', ds: 18, dl: 6 })}
    <path d="M560,-176 C620,-170 680,-140 690,-112 C660,-100 620,-104 600,-110" fill="#C9B07A" stroke="${c}" stroke-width="6"/>
    <path d="M500,-160 l18,18 M518,-160 l-18,18" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
    ${vol('M-60,-200 L-90,-330 L-60,-340 L-20,-210 Z', { base: '#6E7C8C', sombra: '#4E5A68', ds: 10, dl: 3, sw: 6 })}${vol('M80,-210 L110,-320 L140,-310 L120,-200 Z', { base: '#6E7C8C', sombra: '#4E5A68', ds: 10, dl: 3, sw: 6 })}
    <path d="M-90,-330 l-14,-18 m14,18 l4,-22 M110,-320 l-6,-22 m6,22 l12,-18" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
    <path d="M-140,-120 C-60,-160 60,-170 160,-130" stroke="#B5422F" stroke-width="18" stroke-linecap="round" fill="none" opacity=".85"/></g>`;
}
function nuvemBriga(x, y, t, esc = 1, k = 1) {                          // a nuvem de poeira de desenho animado, com estrelinhas e pedaços voando
  let s = `<g transform="translate(${r1(x)},${r1(y)}) scale(${r1(esc * (0.6 + 0.4 * k))})" opacity="${r1(k)}">`;
  for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + t * 0.6, rr = 260 + 50 * Math.sin(t * 7 + i * 2), px = Math.cos(a) * rr * 1.25, py = Math.sin(a) * rr * 0.6, r = 120 + 40 * Math.sin(t * 9 + i);
    s += `<circle cx="${r1(px)}" cy="${r1(py)}" r="${r1(r)}" fill="#F3E3C0" stroke="#5A4520" stroke-width="7"/>`; }
  s += `<ellipse cx="0" cy="0" rx="380" ry="200" fill="#F3E3C0"/>`;
  for (let i = 0; i < 5; i++) { const a = t * 4 + i * 1.3, px = Math.cos(a) * 280, py = -160 + Math.sin(a * 1.7) * 120;
    s += `<path d="M${r1(px)},${r1(py - 34)} l9,24 25,2 -19,16 6,25 -21,-13 -21,13 6,-25 -19,-16 25,-2 Z" fill="#FFE14A" stroke="#5A4520" stroke-width="4"/>`; }
  for (let i = 0; i < 4; i++) { const k2 = ((t * 1.3 + i / 4) % 1), px = (i - 1.5) * 200 + k2 * 120 * (i % 2 ? 1 : -1), py = -200 - k2 * 300 + k2 * k2 * 260;
    s += `<g transform="translate(${r1(px)},${r1(py)}) rotate(${r1(k2 * 720)})"><path d="M-14,-4 L-36,-8 Q-46,-14 -44,-4 Q-52,2 -44,6 Q-42,14 -36,8 L-14,4 Z" fill="#F6EEDA" stroke="#17240A" stroke-width="3"/><path d="M-12,-14 Q12,-22 26,-6 Q30,8 18,16 Q0,22 -12,10 Z" fill="#B5422F" stroke="#17240A" stroke-width="3"/></g>`; }
  return s + '</g>';
}
function estrelinhas(x, y, t, r = 70) {
  let s = ''; for (let i = 0; i < 4; i++) { const a = t * 6 + i * 1.57; s += `<path transform="translate(${r1(x + Math.cos(a) * r)},${r1(y + Math.sin(a) * r * 0.35)}) scale(.8)" d="M0,-30 l8,20 22,2 -17,14 6,22 -19,-12 -19,12 6,-22 -17,-14 22,-2 Z" fill="#FFE14A" stroke="#5A4520" stroke-width="4"/>`; }
  return s;
}
const lado = (svg, x, flip = false, fil = '') => `<g transform="translate(${r1(x)},0) scale(${flip ? -1 : 1},1)"${fil ? ` filter="url(#${fil})"` : ''}>${svg}</g>`;

// P2 (3,2–6,4): o mosquito pousa no focinho; o bracinho sobe tremendo e não chega; ele esfrega o focinho na árvore
plano('P2 mosquito', 3.2, (u, t) => {
  const chega = ease(inv(0, 0.9, u)), tenta = ease(inv(1.0, 1.5, u)) * (1 - ease(inv(2.0, 2.3, u))), coca = inv(2.25, 3.2, u);
  const treme = tenta * Math.sin(t * 50) * 3;
  const anda = ease(inv(2.0, 2.45, u)) * 150, esfrega = coca > 0 ? Math.sin(coca * 28) * 6 : 0;
  const R = rexLado({ t, idBase: 0, olho: [0.9, -0.2 + 0.5 * tenta], sobrancelha: tenta > 0.1 ? -0.7 : coca > 0 ? 1 : 0, boca: 0.05 + 0.15 * tenta, palpebra: coca > 0 ? 0.55 : 0,
    pescoco: -4 + esfrega * 0.5 + (coca > 0 ? -6 : 0), cabeca: -8 * tenta + esfrega + (coca > 0 ? -6 : 0),
    bracoCa: { ombro: -118 * tenta + treme, cotovelo: -70 * tenta - treme, pulso: -30 * tenta, dedos: 0.6 * tenta }, bracoLa: { ombro: -100 * tenta - treme, cotovelo: -60 * tenta, dedos: 0.5 },
    coxaC: anda > 1 && anda < 149 ? Math.sin(u * 12) * 10 : 0, coxaL: anda > 1 && anda < 149 ? -Math.sin(u * 12) * 10 : 0 });
  // mosquito: chega voando em zigue-zague e pousa na ponta do focinho; foge quando ele esfrega
  const ponta = [855 + anda, -575];
  let mx = lerp(1250, ponta[0], chega) + Math.sin(u * 13) * 40 * (1 - chega), my = lerp(-900, ponta[1], chega) + Math.cos(u * 11) * 30 * (1 - chega);
  if (coca > 0.15) { const k = inv(0.15, 1, coca); mx = ponta[0] + 300 * k; my = ponta[1] - 500 * k + Math.sin(k * 20) * 40; }
  const mundo = chao(-1400, 2200) + arvore(1060, t) + `<g transform="translate(${r1(anda)},0)">${R.svg}</g>` + mosquito(mx, my, t, 1.4, chega > 0.99 && coca < 0.15 ? 1 : 0);
  return camera(lerp(660, 860, ease(inv(1.9, 2.6, u))), -560, lerp(1.85, 1.6, inv(1.8, 2.6, u)), mundo);
});
// P3 (6,4–9,6): régua: o braço do REX ao lado do braço de uma pessoa (os dois com 1 m); a câmera abre e a fita mostra os 12 m
plano('P3 regua', 3.2, (u, t) => {
  const abre = ease(inv(1.2, 2.3, u)), fitaK = ease(inv(1.8, 2.6, u));
  const R = rexLado({ t, idBase: 0, olho: [0.6, 0.8], sobrancelha: 0.3, bracoCa: { ombro: -78, cotovelo: -10, pulso: 0, dedos: 0.5 } });
  const mundo = chao(-1600, 2200) + `<path d="M520,-60 Q600,-120 700,-90 Q760,-40 740,10 L500,10 Z" fill="#8C7A60" stroke="#1E140A" stroke-width="7"/>` +
    R.svg + pessoa(640, -70, t, { braco: 0, susto: abre }) + regua(452, -372, 590, '1 m', 30) + regua(668, -330, 806, '1 m', 30) +
    `<g opacity="${r1(fitaK)}">${fita(-790, -620, 860, '12 m', fitaK)}</g>`;
  return camera(lerp(620, 60, abre), lerp(-300, -380, abre), lerp(2.1, 0.62, abre), mundo);
});
// P4 (9,6–13,0): virada: rosca bíceps com a tora; o músculo incha; a etiqueta ~200 kg balança
plano('P4 biceps', 3.4, (u, t) => {
  const rep = 0.5 - 0.5 * Math.cos(Math.max(0, u - 0.4) * 4.4), musc = ease(inv(0.3, 2.0, u)), orgulho = ease(inv(2.6, 3.1, u));
  const ang = -10 - 105 * rep;
  // a tora fica na mão de cá: pulso aproximado pela pose (ombro (452,-292), cotovelo e pulso girados); desenhada entre o peito e o braço
  const S = [452, -292], a1 = -20 * Math.PI / 180, E = [S[0] + 18 * Math.cos(a1) - 60 * Math.sin(a1), S[1] + 18 * Math.sin(a1) + 60 * Math.cos(a1)];
  const a2 = a1 + ang * Math.PI / 180, Wp = [E[0] + 38 * Math.cos(a2) - 26 * Math.sin(a2), E[1] + 38 * Math.sin(a2) + 26 * Math.cos(a2)];
  const R = rexLado({ t, idBase: 0, olho: [0.5, 0.9 - orgulho], sobrancelha: rep > 0.6 ? -0.8 : orgulho, boca: 0.08 + 0.12 * rep, suor: rep * (1 - orgulho),
    pescoco: 6 * rep - 8 * orgulho, cabeca: 10 - 14 * orgulho, bracoCa: { ombro: -20, cotovelo: ang, pulso: -20, dedos: 0.1, musc }, bracoLa: { ombro: -18, cotovelo: ang + 10, dedos: 0.1, musc },
    naMao: tronco(Wp[0] + 30, Wp[1] + 14, Math.sin(t * 3) * 3, 0.9) });
  const mundo = chao(-1400, 2000) + R.svg;
  return camera(390, -320, lerp(1.95, 2.05, sv(u / 3.4)), mundo);
});
// P5 (13,0–15,0): ele olha os bracinhos e dá de ombros, duas vezes
plano('P5 pergunta', 2.0, (u, t) => {
  const ombros = Math.max(0, Math.sin(Math.max(0, u - 0.4) * 6.5)) * (u < 1.85 ? 1 : 0);
  const R = rexLado({ t, idBase: 0, olho: [-0.3, 1], sobrancelha: 0.9, boca: 0.04, pescoco: 14, cabeca: 18, corpoY: -10 * ombros,
    bracoCa: { ombro: -60 * ombros, cotovelo: -40 * ombros, pulso: -40 * ombros, dedos: 1 }, bracoLa: { ombro: -55 * ombros, cotovelo: -40 * ombros, dedos: 1 } });
  return camera(600, -430, 1.95, chao(-1400, 2000) + R.svg);
});
// P6 (15,0–20,5): a carcaça; três T. rex caem em cima e vira uma nuvem de briga de desenho
const CX = 1350;
function grupo(u, t, { k = 1, braco = 1, morde = null, rexCome = false } = {}) {
  const mB = (Math.sin(t * 9) + 1) / 2, mC = (Math.sin(t * 8 + 2) + 1) / 2;
  let s = '';
  // C atrás (mais escuro, menor, outra cor), vindo da direita, olhando para a esquerda
  s += `<g transform="translate(${CX + 1500},-40) scale(-0.82,0.82)" filter="url(#tomC)">${rexLado({ t, idBase: 3000, pescoco: 26, cabeca: 18, boca: 0.2 + 0.6 * mC, olho: [0.5, 0.6], sobrancelha: -0.8, coxaC: Math.sin(t * 9) * 6 }).svg}</g>`;
  s += carcaca(CX, -10, t, 1.05);
  s += `<g transform="translate(${CX + 1420},10) scale(-1,1)" filter="url(#tomB)">${rexLado({ t, idBase: 2000, pescoco: 24, cabeca: 16, boca: 0.2 + 0.6 * mB, olho: [0.5, 0.6], sobrancelha: -0.8, coxaL: Math.sin(t * 8) * 6 }).svg}</g>`;
  return s;
}
plano('P6 briga', 5.5, (u, t) => {
  const pula = ease(inv(0.6, 1.8, u)), nuvem = ease(inv(1.7, 2.3, u));
  const R = rexLado({ t, idBase: 0, pescoco: 24 * pula, cabeca: 16 * pula, boca: 0.15 + 0.5 * pula * ((Math.sin(t * 10) + 1) / 2), sobrancelha: -0.8 * pula, olho: [0.5, 0.6] });
  const mundo = chao(-1800, 4200) + grupo(u, t) + `<g transform="translate(${r1(lerp(-400, 380, pula))},0)">${R.svg}</g>` + (nuvem > 0.01 ? nuvemBriga(CX + 80, -480, t, 1.25, nuvem) : '');
  return camera(lerp(1150, 1300, ease(u / 5.5)), lerp(-620, -540, ease(u / 5.5)), lerp(0.66, 0.78, ease(u / 5.5)), mundo);
});
// P7 (20,5–25,0): e se fosse comprido? Um T. rex de braço longo enfia a mão na confusão: NHAC. Pulinho, estrelinhas, braço enfaixado
plano('P7 petisco', 4.5, (u, t) => {
  const cresce = ease(inv(0.2, 1.1, u)), enfia = ease(inv(1.2, 2.0, u)), nhac = u > 2.15, puxa = ease(inv(2.15, 2.45, u)), faixa = u > 3.0;
  const k = lerp(1, 2.9, cresce);
  const R = rexLado({ t, idBase: 0, olho: nhac ? [0, -0.5] : [0.6, 0.4], sobrancelha: nhac ? 1.4 : 0.2, boca: nhac ? 0.7 : 0.05, palpebra: 0,
    corpoY: nhac ? -60 * Math.abs(Math.sin((u - 2.15) * 8)) * Math.exp(-(u - 2.15) * 2) : 0,
    bracoCa: { k, ombro: lerp(0, -55, enfia) + 70 * puxa, cotovelo: lerp(0, 25, enfia) - 60 * puxa, pulso: 0, dedos: 0.6 }, bracoLa: { k: 1, ombro: -10 } });
  // a "mão" comprida entra na nuvem (à direita); a boca que morde sai da nuvem
  let s = chao(-1400, 2600) + `<g transform="translate(150,0)">${R.svg}</g>`;
  s += nuvemBriga(1400, -440, t, 0.85, 1);
  if (u > 1.95 && u < 2.6) { const kk = ease(inv(1.95, 2.15, u)); s += `<g transform="translate(${r1(lerp(1350, 1140, kk))},-360) scale(-0.9,0.9)" filter="url(#tomB)"><g transform="translate(-860,500)">${rexLado({ t, idBase: 2000, boca: u < 2.15 ? 0.9 : 0, sombra: false, olho: [0.6, 0.2], sobrancelha: -1 }).svg}</g></g>`; }
  if (faixa) s += estrelinhas(150 + 640, -720, t, 120);
  if (nhac) s += `<g opacity="${r1(cl((u - 2.15) / 0.1))}"><circle cx="${r1(150 + 452 + 40)}" cy="-250" r="1" fill="none"/></g>`;
  if (faixa) { const B = [150 + 452 + 30, -250]; s += `<g transform="translate(${B[0]},${B[1]})"><rect x="-6" y="-8" width="90" height="60" rx="20" fill="#FFFFFF" stroke="#17240A" stroke-width="6" transform="rotate(30)"/><path d="M10,6 l60,26 M8,22 l56,26" stroke="#C9D2D8" stroke-width="5" transform="rotate(30)"/></g>`; }
  return camera(lerp(760, 1000, ease(inv(1.0, 2.1, u))) - 200 * ease(inv(2.6, 3.4, u)), lerp(-470, -450, ease(u / 4.5)), lerp(1.05, 1.0, ease(u / 4.5)) + (nhac ? 0.06 * molas(u - 2.15, 20, 6) : 0), s);
});
// P8 (25,0–29,5): o REX come tranquilo, bracinhos encolhidos; mordidas passam raspando e erram; ele sorri
plano('P8 seguro', 4.5, (u, t) => {
  const masca = (Math.sin(t * 8) + 1) / 2, quase = [1.0, 2.2, 3.4].map(a => Math.exp(-Math.pow((u - a) / 0.38, 2)));
  const R = rexLado({ t, idBase: 0, pescoco: 26, cabeca: 18, boca: 0.15 + 0.3 * masca, olho: [0.2, 0.8], palpebra: 0.5, sobrancelha: 0.8,
    bracoCa: { ombro: -30, cotovelo: -70, pulso: -40, dedos: 0.1 }, bracoLa: { ombro: -26, cotovelo: -64, dedos: 0.1 } });
  let s = chao(-1400, 3000) + carcaca(1100, -10, t, 0.9) + `<g transform="translate(-60,0)">${R.svg}</g>`;
  // cabeças vizinhas que mordem perto do peito e erram (vêm de cima/da frente)
  quase.forEach((q, i) => { if (q < 0.02) return; const y = -620 + 120 * i, x = 520 + 60 * i; s += `<g transform="translate(${r1(x + 260 * (1 - q))},${r1(y - 200 * (1 - q))}) scale(-0.75,0.75)" filter="url(#tomC)"><g transform="translate(-840,520)">${rexLado({ t, idBase: 4000 + 100 * i, boca: q > 0.8 ? 0.05 : 0.8, sombra: false, olho: [0.5, 0.5], sobrancelha: -1 }).svg}</g></g>`; });
  return camera(560, -420, 1.55, s);
});
// P9 (29,5–34,0): de volta ao começo (laço)
plano('P9 laco', 4.5, (u, t) => cenaCarne(u * 3.2 / 4.5 * 0.9, t, 3.2));

function frame(t) {
  let p = PLANOS[0]; for (const q of PLANOS) if (t >= q.t0 - 1e-6) p = q;
  const u = cl(t - p.t0, 0, p.dur);
  const cam = { x: 560, y: -430 };
  const corpo = p.fn(u, t);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${DEFS_REX}${DEFS_CENA}</defs>` +
    paisagem(t, cam.x, cam.y, 1) + corpo +
    samambaia(-40, 1980, 1.5, t, '#1F3A14', 1, 1) + samambaia(1120, 2000, 1.6, t, '#1F3A14', 4, -1) +
    `<rect width="${W}" height="${H}" fill="url(#vinheta)"/><rect width="${W}" height="${H}" filter="url(#grao)" opacity=".6"/></svg>`;
}
