/* =====================================================================================
   POR QUE O BRAÇO DO T. REX ERA CURTO? 🦖 — arte em SVG (2D, cartoon colorido, dia claro)
   O herói é o REX (verde-oliva com barriga creme e olho amarelo). Tudo é determinístico: qualquer quadro sai igual em qualquer ordem.
   rexFrente(o): busto de 3/4 de frente (cabeça grande, peito e os dois bracinhos) — gags de bater palma, coçar o nariz, flexionar.
   ===================================================================================== */
const hh = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const lerp = (a, b, k) => a + (b - a) * k;
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sv = x => { x = cl(x); return x * x * (3 - 2 * x); };
const f1 = x => x.toFixed(1);

const COR = { pele: '#6E8F3A', peleSombra: '#4F6B26', peleClara: '#93B256', barriga: '#E9D9A6', barrigaSombra: '#CDB97F', contorno: '#22300F',
  olho: '#FFD23A', boca: '#7A2E2A', dente: '#FFF8E6', unha: '#F3EBD3' };

const DEFS = `
<linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4FB3EC"/><stop offset=".55" stop-color="#9ED8F2"/><stop offset="1" stop-color="#E6F6E9"/></linearGradient>
<radialGradient id="solG" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF7C2"/><stop offset=".5" stop-color="#FFE27A" stop-opacity=".7"/><stop offset="1" stop-color="#FFE27A" stop-opacity="0"/></radialGradient>
<linearGradient id="chao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C7B26A"/><stop offset="1" stop-color="#9C8442"/></linearGradient>
<radialGradient id="peleG" cx=".42" cy=".3" r=".8"><stop offset="0" stop-color="${COR.peleClara}"/><stop offset=".55" stop-color="${COR.pele}"/><stop offset="1" stop-color="${COR.peleSombra}"/></radialGradient>
<radialGradient id="barrigaG" cx=".45" cy=".3" r=".8"><stop offset="0" stop-color="#F6EAC2"/><stop offset=".7" stop-color="${COR.barriga}"/><stop offset="1" stop-color="${COR.barrigaSombra}"/></radialGradient>
<radialGradient id="olhoG" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFF1A0"/><stop offset=".6" stop-color="${COR.olho}"/><stop offset="1" stop-color="#E09A14"/></radialGradient>
<radialGradient id="vig" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1B2A10" stop-opacity=".35"/></radialGradient>
<filter id="sombraSuave" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
`;

/** fundo do Cretáceo de dia: céu, sol, vulcão ao longe, morros, samambaias e cicas nas laterais, chão */
function fundo(t, o = {}) {
  const { horizonte = 1180, desloca = 0 } = o;
  const vx = 820 + desloca * 0.2;
  let s = `<rect width="1080" height="1920" fill="url(#ceu)"/>
  <circle cx="${f1(860 + desloca * 0.05)}" cy="300" r="230" fill="url(#solG)"/><circle cx="${f1(860 + desloca * 0.05)}" cy="300" r="70" fill="#FFF6C9"/>`;
  // nuvens que andam devagar
  for (let i = 0; i < 4; i++) {
    const x = ((i * 330 + t * 14 + desloca * 0.1) % 1500) - 220, y = 180 + i * 95;
    s += `<g opacity=".9" fill="#FFFFFF"><ellipse cx="${f1(x)}" cy="${y}" rx="120" ry="34"/><ellipse cx="${f1(x + 60)}" cy="${y - 22}" rx="80" ry="38"/><ellipse cx="${f1(x - 55)}" cy="${y - 12}" rx="60" ry="28"/></g>`;
  }
  // vulcão com fumaça
  s += `<path d="M${vx - 330},${horizonte - 40} L${vx - 80},${horizonte - 420} L${vx + 40},${horizonte - 430} L${vx + 300},${horizonte - 40} Z" fill="#7C8FA3" opacity=".8"/>
  <path d="M${vx - 95},${horizonte - 405} L${vx - 80},${horizonte - 420} L${vx + 40},${horizonte - 430} L${vx + 58},${horizonte - 412} Q${vx - 20},${horizonte - 380} ${vx - 95},${horizonte - 405} Z" fill="#E86A3A" opacity=".85"/>`;
  for (let i = 0; i < 6; i++) {
    const k = ((t * 0.12 + i / 6) % 1), x = vx - 20 + Math.sin(i * 2.1 + t * 0.6) * 40 * k + k * 90, y = horizonte - 440 - k * 330, r = 40 + k * 90;
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="#C9CED6" opacity="${f1((1 - k) * 0.55)}"/>`;
  }
  // morros
  s += `<path d="M-50,${horizonte} Q200,${horizonte - 170} 420,${horizonte - 60} T900,${horizonte - 90} T1130,${horizonte - 40} V1920 H-50 Z" fill="#5E9A4A"/>
  <path d="M-50,${horizonte + 60} Q260,${horizonte - 40} 520,${horizonte + 30} T1130,${horizonte + 10} V1920 H-50 Z" fill="#4C8540"/>
  <rect y="${horizonte + 120}" width="1080" height="${1920 - horizonte}" fill="url(#chao)"/>`;
  return s;
}
/** samambaia/cica em primeiro plano (moldura) */
function cica(x, y, esc = 1, t = 0, cor = '#2F6B2A', sem = 0) {
  let s = `<g transform="translate(${f1(x)},${f1(y)}) scale(${esc})">`;
  for (let i = 0; i < 9; i++) {
    const a = -150 + i * 15 + Math.sin(t * 1.3 + i + sem) * 3, L = 330 - Math.abs(i - 4) * 25;
    const r = a * Math.PI / 180, ex = Math.cos(r) * L, ey = Math.sin(r) * L, mx = Math.cos(r) * L * 0.55 - Math.sin(r) * 40, my = Math.sin(r) * L * 0.55 + Math.cos(r) * 40;
    s += `<path d="M0,0 Q${f1(mx)},${f1(my)} ${f1(ex)},${f1(ey)}" stroke="${cor}" stroke-width="14" fill="none" stroke-linecap="round"/>`;
    for (let k = 1; k < 9; k++) {
      const u = k / 9, px = 2 * (1 - u) * u * mx + u * u * ex, py = 2 * (1 - u) * u * my + u * u * ey, n = r + Math.PI / 2, l = 60 * (1 - u * 0.6);
      s += `<path d="M${f1(px)},${f1(py)} l${f1(Math.cos(n + 0.5) * l)},${f1(Math.sin(n + 0.5) * l)} M${f1(px)},${f1(py)} l${f1(-Math.cos(n - 0.5) * l)},${f1(-Math.sin(n - 0.5) * l)}" stroke="${cor}" stroke-width="9" stroke-linecap="round"/>`;
    }
  }
  return s + '</g>';
}

/** bracinho gordinho: ombro em (x, y); a1 = direção do braço e a2 = do antebraço (graus na tela: 0 = direita, 90 = para baixo);
 *  esc = tamanho (1 = real; >1 o "e se fosse comprido"); musc = bíceps inflado (0..1); abre = dedos abertos (0..1) */
function braco(x, y, { a1 = 100, a2 = 160, esc = 1, musc = 0, abre = 0.3 } = {}) {
  const R = d => d * Math.PI / 180, L1 = 92 * esc, L2 = 80 * esc, w = 46 + 12 * musc;
  const cx = x + Math.cos(R(a1)) * L1, cy = y + Math.sin(R(a1)) * L1, hx = cx + Math.cos(R(a2)) * L2, hy = cy + Math.sin(R(a2)) * L2;
  const caps = (ax, ay, bx, by, w0, w1, fill) => { const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
    return `<path d="M${f1(ax + nx * w0)},${f1(ay + ny * w0)} L${f1(bx + nx * w1)},${f1(by + ny * w1)} A${f1(w1)},${f1(w1)} 0 0 1 ${f1(bx - nx * w1)},${f1(by - ny * w1)} L${f1(ax - nx * w0)},${f1(ay - ny * w0)} A${f1(w0)},${f1(w0)} 0 0 1 ${f1(ax + nx * w0)},${f1(ay + ny * w0)} Z" fill="${fill}"/>`; };
  // traços grossos de ponta redonda: primeiro o contorno escuro (mais largo), depois a pele por cima
  const linha = (pts, wd, cor) => `<path d="M${pts.map(p => f1(p[0]) + ',' + f1(p[1])).join(' L')}" stroke="${cor}" stroke-width="${f1(wd)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  const dedos = [-1, 1].map(d => { const ad = R(a2) + d * (0.35 + abre * 0.45); return [[hx, hy], [hx + Math.cos(ad) * 38 * esc, hy + Math.sin(ad) * 38 * esc], ad, d]; });
  let s = '';
  for (const [a, b, ad, d] of dedos) {                                                       // garras (curvas, creme)
    s += `<path d="M${f1(b[0])},${f1(b[1])} q${f1(Math.cos(ad) * 18)},${f1(Math.sin(ad) * 18)} ${f1(Math.cos(ad + d * 0.9) * 26)},${f1(Math.sin(ad + d * 0.9) * 26)}" stroke="${COR.contorno}" stroke-width="16" stroke-linecap="round" fill="none"/>`;
    s += `<path d="M${f1(b[0])},${f1(b[1])} q${f1(Math.cos(ad) * 18)},${f1(Math.sin(ad) * 18)} ${f1(Math.cos(ad + d * 0.9) * 26)},${f1(Math.sin(ad + d * 0.9) * 26)}" stroke="${COR.unha}" stroke-width="8" stroke-linecap="round" fill="none"/>`;
  }
  for (const [a, b] of dedos) s += linha([a, b], 26 * Math.min(esc, 1.3), COR.contorno);
  s += linha([[x, y], [cx, cy], [hx, hy]], w + 12, COR.contorno);
  for (const [a, b] of dedos) s += linha([a, b], 16 * Math.min(esc, 1.3), COR.pele);
  s += linha([[x, y], [cx, cy]], w, COR.pele) + linha([[cx, cy], [hx, hy]], w * 0.82, COR.pele);
  s += linha([[lerp(x, cx, 0.15) - 6, lerp(y, cy, 0.15) - 6], [lerp(x, cx, 0.8) - 6, lerp(y, cy, 0.8) - 6]], w * 0.3, COR.peleClara);   // brilho em cima
  if (musc > 0) { const mx = lerp(x, cx, 0.5), my = lerp(y, cy, 0.5); s += `<ellipse cx="${f1(mx)}" cy="${f1(my - 6)}" rx="${f1(26 + 26 * musc)}" ry="${f1(22 + 20 * musc)}" fill="${COR.peleClara}" stroke="${COR.contorno}" stroke-width="5" transform="rotate(${f1(a1)},${f1(mx)},${f1(my)})"/>`; }
  return { svg: s, mao: [hx, hy], cotovelo: [cx, cy] };
}

/** REX de 3/4 de frente (busto): cabeça, pescoço, peito, bracinhos. o: { x, y, esc, olhar:[dx,dy], boca (0..1), sobrancelha (-1 brava .. 1 surpresa),
 *  cabecaGiro (graus), bracoE/bracoD (opções do braco), suor (0..1), vesgo (0..1, olhos para as mãos) } */
function rexFrente(o = {}) {
  const { x = 540, y = 1250, esc = 1, olhar = [0, 0], boca = 0, sobrancelha = 0, cabecaGiro = 0, bracoE = {}, bracoD = {}, suor = 0, t = 0, respira = 1 } = o;
  const r = Math.sin(t * 2.2) * 6 * respira;
  let s = `<g transform="translate(${f1(x)},${f1(y + r * 0.4)}) scale(${esc})">`;
  // sombra no chão
  s += `<ellipse cx="0" cy="640" rx="430" ry="70" fill="#3C3014" opacity=".35" filter="url(#sombraSuave)"/>`;
  // pernas grossas (atrás do peito)
  s += `<g stroke="${COR.contorno}" stroke-width="7" stroke-linejoin="round">
    <path d="M-250,200 Q-330,420 -260,600 L-150,610 Q-160,430 -110,260 Z" fill="${COR.peleSombra}"/>
    <path d="M250,200 Q330,420 260,600 L150,610 Q160,430 110,260 Z" fill="${COR.peleSombra}"/>
    <path d="M-290,600 l-60,40 h220 l-20,-40 Z M290,600 l60,40 h-220 l20,-40 Z" fill="${COR.peleSombra}"/></g>`;
  // tronco/peito em pera
  s += `<path d="M-300,-140 Q-380,140 -270,380 Q-140,560 0,560 Q140,560 270,380 Q380,140 300,-140 Q200,-330 0,-340 Q-200,-330 -300,-140 Z" fill="url(#peleG)" stroke="${COR.contorno}" stroke-width="8"/>`;
  s += `<path d="M-170,-150 Q-230,150 -150,380 Q-70,500 0,500 Q70,500 150,380 Q230,150 170,-150 Q90,-240 0,-240 Q-90,-240 -170,-150 Z" fill="url(#barrigaG)"/>`;
  for (let i = 0; i < 6; i++) s += `<path d="M${-140 + i * 4},${-60 + i * 85} Q0,${-30 + i * 85} ${140 - i * 4},${-60 + i * 85}" stroke="${COR.barrigaSombra}" stroke-width="6" fill="none" opacity=".8"/>`;
  // bracinhos (ombros no alto do peito)
  const bE = braco(-150, -40, { a1: 115, a2: 20, ...bracoE }), bD = braco(150, -40, { a1: 65, a2: 160, ...bracoD });
  // pescoço e cabeça
  const cg = cabecaGiro;
  let cab = `<g transform="rotate(${f1(cg)},0,-330)">`;
  cab += `<path d="M-200,-240 Q-230,-420 -170,-520 L170,-520 Q230,-420 200,-240 Z" fill="url(#peleG)" stroke="${COR.contorno}" stroke-width="8"/>`;
  // crânio largo e pesado: testa estreita, bochechas largas atrás, focinho comprido e retangular vindo para a câmera
  cab += `<path d="M-300,-700 Q-330,-560 -250,-470 Q-130,-400 0,-395 Q130,-400 250,-470 Q330,-560 300,-700 Q270,-840 150,-905 Q0,-950 -150,-905 Q-270,-840 -300,-700 Z" fill="url(#peleG)" stroke="${COR.contorno}" stroke-width="8"/>`;
  // manchas e escamas grossas no alto da cabeça
  for (let i = 0; i < 14; i++) { const ax = -200 + hh(i, 3) * 400, ay = -900 + hh(i, 4) * 160, rr = 10 + hh(i, 5) * 16; cab += `<ellipse cx="${f1(ax)}" cy="${f1(ay)}" rx="${f1(rr)}" ry="${f1(rr * 0.7)}" fill="${COR.peleSombra}" opacity=".45"/>`; }
  // focinho (trapézio mais claro) e narinas na ponta
  cab += `<path d="M-170,-760 Q-205,-580 -150,-500 Q0,-470 150,-500 Q205,-580 170,-760 Q90,-800 0,-802 Q-90,-800 -170,-760 Z" fill="${COR.peleClara}" opacity=".5"/>`;
  cab += `<path d="M-70,-600 q15,-14 30,0" stroke="${COR.contorno}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M40,-600 q15,-14 30,0" stroke="${COR.contorno}" stroke-width="10" fill="none" stroke-linecap="round"/>`;
  // mandíbula: queixo largo embaixo, a boca é a linha entre os dois (abre para baixo)
  const ab = boca * 110;
  cab += `<path d="M-265,-520 Q-250,${f1(-410 + ab)} -120,${f1(-385 + ab)} Q0,${f1(-372 + ab)} 120,${f1(-385 + ab)} Q250,${f1(-410 + ab)} 265,-520 Q140,${f1(-470 + ab * 0.7)} 0,${f1(-468 + ab * 0.7)} Q-140,${f1(-470 + ab * 0.7)} -265,-520 Z" fill="url(#peleG)" stroke="${COR.contorno}" stroke-width="8"/>`;
  cab += `<path d="M-250,-522 Q0,${f1(-455 + ab * 0.55)} 250,-522 Q0,${f1(-500 + ab * 0.2)} -250,-522 Z" fill="${COR.boca}" stroke="${COR.contorno}" stroke-width="6"/>`;
  for (let i = 0; i < 11; i++) { const u = i / 10, px = -225 + u * 450, py = -520 + Math.sin(u * Math.PI) * 30 * (1 - boca * 0.5); const L = 22 + 10 * Math.sin(u * Math.PI); cab += `<path d="M${f1(px - 10)},${f1(py - 4)} l10,${f1(L)} l10,${f1(-L)} Z" fill="${COR.dente}" stroke="${COR.contorno}" stroke-width="3"/>`; }
  // olhos grandes com pupila que segue o olhar; sobrancelha óssea
  for (const lado of [-1, 1]) {
    const ox = lado * 175, oy = -785, px = ox + cl(olhar[0], -1, 1) * 20 - lado * (o.vesgo || 0) * 16, py = oy + cl(olhar[1], -1, 1) * 18;
    cab += `<ellipse cx="${ox}" cy="${oy}" rx="44" ry="40" fill="url(#olhoG)" stroke="${COR.contorno}" stroke-width="7"/>
      <ellipse cx="${f1(px)}" cy="${f1(py)}" rx="11" ry="24" fill="#1A1A10"/><circle cx="${f1(px - 8)}" cy="${f1(py - 14)}" r="8" fill="#FFFFFF"/>`;
    const sb = sobrancelha, yb = oy - 62 - sb * 22, inc = -lado * (14 - sb * 26);
    cab += `<path d="M${ox - 75},${f1(yb + inc)} Q${ox},${f1(yb - 30)} ${ox + 75},${f1(yb - inc)}" stroke="${COR.peleSombra}" stroke-width="30" fill="none" stroke-linecap="round"/>`;
  }
  // gotas de suor
  for (let i = 0; i < 3; i++) {
    const k = ((t * 0.9 + i / 3) % 1), gx = (i - 1) * 210 + (i === 1 ? 0 : 0), gy = -900 + k * 160;
    if (suor > 0.01) cab += `<path d="M${f1(gx)},${f1(gy - 26)} Q${f1(gx + 18)},${f1(gy)} ${f1(gx)},${f1(gy + 12)} Q${f1(gx - 18)},${f1(gy)} ${f1(gx)},${f1(gy - 26)} Z" fill="#9FE3FF" stroke="#2D7EA6" stroke-width="4" opacity="${f1(suor * (1 - k))}"/>`;
  }
  cab += `</g>`;
  s += cab + bE.svg + bD.svg + `</g>`;
  const T = (p) => [x + p[0] * esc, y + r * 0.4 + p[1] * esc];
  return { svg: s, maoE: T(bE.mao), maoD: T(bD.mao) };
}

/** riscos de movimento perto de um ponto */
function riscos(x, y, n = 3, ang = 0, L = 60, cor = '#FFFFFF') {
  let s = ''; for (let i = 0; i < n; i++) { const a = ang + (i - (n - 1) / 2) * 0.35, r0 = 50 + i * 6; s += `<path d="M${f1(x + Math.cos(a) * r0)},${f1(y + Math.sin(a) * r0)} l${f1(Math.cos(a) * L)},${f1(Math.sin(a) * L)}" stroke="${cor}" stroke-width="9" stroke-linecap="round" opacity=".9"/>`; }
  return s;
}
