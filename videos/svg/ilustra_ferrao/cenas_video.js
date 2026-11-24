/* =====================================================================================
   VÍDEO "Abelha × vespa-mandarina" (2D, SVG, 1080×1920, 30 fps). Usa desenhos.js (abelha, mandarina, ferrões).
   A abelha pica um braço, o ferrão farpado prende, ela arranca o próprio abdome e morre; a vespa-mandarina pica quatro vezes e vai embora inteira.
   frame(t) devolve o SVG do instante t (tudo é função do tempo).
   ===================================================================================== */
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sv = x => { x = cl(x); return x * x * (3 - 2 * x); };
const ease = x => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const inv = (a, b, x) => cl((x - a) / (b - a));
const hh = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const mola = (u, f = 14, am = 6) => u <= 0 ? 0 : 1 - Math.exp(-am * u) * Math.cos(f * u);

const TOPO = x => 1005 - (x / 1080) * 18;        // a superfície de cima do braço
const CHAO = 1580;
const DEFS_V = `
<linearGradient id="jardim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE9C2"/><stop offset=".55" stop-color="#8CC27A"/><stop offset="1" stop-color="#5E9A4E"/></linearGradient>
<linearGradient id="braco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6C9A6"/><stop offset=".25" stop-color="#EDB48E"/><stop offset=".8" stop-color="#D99A74"/><stop offset="1" stop-color="#B97A58"/></linearGradient>
<radialGradient id="vergao" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#E0504A"/><stop offset=".45" stop-color="#EE8070" stop-opacity=".85"/><stop offset="1" stop-color="#F2A08A" stop-opacity="0"/></radialGradient>
<linearGradient id="chao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7A9A48"/><stop offset=".2" stop-color="#6A5A36"/><stop offset="1" stop-color="#4A3A22"/></linearGradient>
<filter id="bokeh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
<filter id="desf" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
<radialGradient id="vinh" cx=".5" cy=".46" r=".78"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0E140A" stop-opacity=".5"/></radialGradient>
<radialGradient id="sombraV" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<filter id="grao"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .35  0 0 0 .05 0"/></filter>
`;

/* ---------------------------------- cenário ---------------------------------- */
function jardim(t, escuro = 0) {
  let s = `<rect x="-600" y="-600" width="${W + 1200}" height="${H + 1200}" fill="url(#jardim)"/>`;
  for (let i = 0; i < 22; i++) {
    const x = hh(i, 1) * 1400 - 160, y = hh(i, 2) * 950 - 80, r = 40 + hh(i, 3) * 90, c = ['#FFF6C8', '#F7B2C4', '#FFFFFF', '#E8F59A', '#F3D35A'][i % 5];
    s += `<circle cx="${r1(x + Math.sin(t * 0.3 + i) * 10)}" cy="${r1(y)}" r="${r1(r)}" fill="${c}" opacity="${r1(0.25 + hh(i, 4) * 0.35)}" filter="url(#bokeh)"/>`;
  }
  for (let i = 0; i < 9; i++) { const x = 60 + i * 130 + hh(i, 6) * 40, y = 640 + hh(i, 7) * 220;
    s += `<g filter="url(#desf)" opacity=".8"><path d="M${x},${y + 400} Q${x + 10},${y + 200} ${x},${y}" stroke="#3E7A30" stroke-width="10" fill="none"/>` +
      [0, 1, 2, 3, 4].map(k => `<ellipse cx="${r1(x + Math.cos(k * 1.26) * 26)}" cy="${r1(y + Math.sin(k * 1.26) * 26)}" rx="22" ry="14" fill="${i % 2 ? '#F7A8C0' : '#FFD84A'}" transform="rotate(${k * 72},${r1(x + Math.cos(k * 1.26) * 26)},${r1(y + Math.sin(k * 1.26) * 26)})"/>`).join('') + `<circle cx="${x}" cy="${y}" r="12" fill="#C98A1A"/></g>`; }
  s += `<path d="M-600,${CHAO} L${W + 600},${CHAO} L${W + 600},${H + 600} L-600,${H + 600} Z" fill="url(#chao)"/>`;
  for (let i = 0; i < 70; i++) { const x = -100 + i * 18 + hh(i, 9) * 10, h = 30 + hh(i, 10) * 50, b = Math.sin(t * 1.5 + i) * 4;
    s += `<path d="M${r1(x)},${CHAO + 6} Q${r1(x + b)},${r1(CHAO - h / 2)} ${r1(x + b * 2 + 4)},${r1(CHAO - h)}" stroke="${i % 3 ? '#5E8A36' : '#7AA848'}" stroke-width="6" fill="none" stroke-linecap="round"/>`; }
  if (escuro > 0) s += `<rect x="-600" y="-600" width="${W + 1200}" height="${H + 1200}" fill="#1A1A10" opacity="${r1(escuro * 100) / 100}"/>`;
  return s;
}
/** o braço (antebraço atravessando a tela), com vergões { x, k } e o tremor dy */
function braco(t, vergoes = [], dy = 0) {
  let s = `<g transform="translate(0,${r1(dy)})">`;
  const d = `M-120,${TOPO(-120) + 6} C200,${TOPO(200) - 4} 700,${TOPO(700) + 2} 1300,${TOPO(1300)} L1300,1270 C700,1290 200,1300 -120,1320 Z`;
  s += `<path d="${d}" fill="url(#braco)" stroke="${K}" stroke-width="7"/>`;
  s += `<path d="M-120,${TOPO(-120) + 22} C200,${TOPO(200) + 12} 700,${TOPO(700) + 18} 1200,${TOPO(1200) + 16}" stroke="#FFE2CC" stroke-width="10" fill="none" opacity=".7"/>`;
  s += `<path d="M-120,1200 C300,1180 700,1196 1200,1170" stroke="#C88660" stroke-width="16" fill="none" opacity=".35"/>`;
  for (let i = 0; i < 46; i++) { const x = -80 + i * 28 + hh(i, 2) * 14, y = TOPO(x) + 30 + hh(i, 3) * 160; s += `<path d="M${r1(x)},${r1(y)} q8,-4 14,-14" stroke="#9A6A4A" stroke-width="2" fill="none" opacity=".45"/>`; }
  for (let i = 0; i < 6; i++) s += `<circle cx="${r1(100 + hh(i, 5) * 900)}" cy="${r1(1080 + hh(i, 6) * 150)}" r="${r1(3 + hh(i, 7) * 3)}" fill="#B97A58" opacity=".5"/>`;
  for (const v of vergoes) { if (v.k <= 0) continue; const y = TOPO(v.x) + 6, r = 20 + 50 * v.k;
    s += `<ellipse cx="${v.x}" cy="${r1(y + 10)}" rx="${r1(r)}" ry="${r1(r * 0.55)}" fill="url(#vergao)"/><path d="M${r1(v.x - r * 0.7)},${r1(y)} Q${v.x},${r1(y - 14 * v.k)} ${r1(v.x + r * 0.7)},${r1(y)}" fill="#EE8A78" stroke="#C4584A" stroke-width="3"/><circle cx="${v.x}" cy="${r1(y - 4 * v.k)}" r="3" fill="#8E2A1E"/>`; }
  return s + '</g>';
}

/* ---------------------------------- insetos no mundo ---------------------------------- */
const ROT = (p, a, c) => { const r = a * Math.PI / 180, x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * Math.cos(r) - y * Math.sin(r), c[1] + x * Math.sin(r) + y * Math.cos(r)]; };
/** coloca o inseto: (x, y) = centro do corpo no mundo, ang = giro do corpo, e = escala; devolve svg e a ponta do ferrão no mundo */
function inseto(tipo, x, y, ang, e, o = {}) {
  const P = tipo === 'abelha' ? { tip: [-176, 12], piv: [-6, 0], cauda: [-128, 8] } : { tip: [-188, 16], piv: [-10, 0], cauda: [-150, 8] };
  const curva = o.curva || 0, tipL = ROT(P.tip, curva, P.piv), caudaL = ROT(P.cauda, curva, P.piv);
  const mundo = p => { const q = ROT([p[0] * e, p[1] * e], ang, [0, 0]); return [x + q[0], y + q[1]]; };
  const desenho = tipo === 'abelha' ? abelha(o) : mandarina(o);
  return { svg: `<g transform="translate(${r1(x)},${r1(y)}) rotate(${r1(ang)}) scale(${r1(e * 1000) / 1000})">${desenho}</g>`, ponta: mundo(tipL), cauda: mundo(caudaL) };
}
/** põe o inseto picando: a ponta do ferrão (já curvado) em (px, py) */
function picando(tipo, px, py, ang, e, o) {
  const a = inseto(tipo, 0, 0, ang, e, o); return inseto(tipo, px - a.ponta[0], py - a.ponta[1], ang, e, o);
}
const PES = { abelha: 100, mandarina: 118 };
function pousado(tipo, x, ang, e, o = {}) { return inseto(tipo, x, TOPO(x) - PES[tipo] * e, ang, e, o); }
/** ferrão farpado preso na pele (com o saco de veneno pulsando) */
function ferraoPreso(x, y, e, pulso) {
  return `<g transform="translate(${r1(x)},${r1(y + 26 * e)}) rotate(84) scale(${e})">${ferraoFarpado(100, 1, true, 1 + 0.06 * Math.sin(pulso))}</g>`;
}
function ondas(x, y, t, cor = '#C7463C', n = 3, r0 = 40) {
  let s = ''; for (let i = 0; i < n; i++) { const k = ((t * 1.6 + i / n) % 1); s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r0 + k * 70)}" fill="none" stroke="${cor}" stroke-width="5" opacity="${r1((1 - k) * 0.7 * 100) / 100}"/>`; }
  return s;
}
function plimV(x, y, k, r = 60, n = 10, cor = K) {
  if (k <= 0 || k >= 1) return '';
  let s = ''; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.3, r0 = r * (0.6 + k * 0.8), r2 = r0 + 40 * (1 - k);
    s += `<path d="M${r1(x + Math.cos(a) * r0)},${r1(y + Math.sin(a) * r0)} L${r1(x + Math.cos(a) * r2)},${r1(y + Math.sin(a) * r2)}" stroke="${cor}" stroke-width="${r1(8 * (1 - k) + 2)}" stroke-linecap="round"/>`; }
  return s;
}
/** zumbido: tracinhos tremendo em volta das asas */
function zumbido(x, y, t, r = 120) {
  let s = ''; for (let i = 0; i < 6; i++) { const a = -2.4 + i * 0.35 + Math.sin(t * 40 + i) * 0.05, rr = r + (i % 2) * 20;
    s += `<path d="M${r1(x + Math.cos(a) * rr)},${r1(y + Math.sin(a) * rr)} l${r1(Math.cos(a) * 24)},${r1(Math.sin(a) * 24)}" stroke="${K}" stroke-width="5" stroke-linecap="round" opacity=".6"/>`; }
  return s;
}
/** lupa grande com corte da pele: ferrão farpado preso (abelha) ou liso entrando e saindo (vespa) */
function lupaCorte(cx, cy, r, k, tipo, t, alvo) {
  if (k <= 0) return '';
  const R = r * sv(k);
  let c = `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" fill="#E9F2FA"/>`;
  const sup = cy - r * 0.1;
  c += `<rect x="${cx - r}" y="${sup}" width="${2 * r}" height="${r * 1.2}" fill="#F7D2BF"/><rect x="${cx - r}" y="${sup}" width="${2 * r}" height="34" fill="#EFAE8C"/>` +
    [0, 1, 2, 3, 4].map(i => `<path d="M${cx - r + 40 + i * 120},${sup + 90} q20,40 0,90" stroke="#D8907A" stroke-width="5" fill="none" opacity=".6"/>`).join('') +
    `<path d="M${cx - r},${sup + 200} C${cx - 100},${sup + 180} ${cx + 100},${sup + 220} ${cx + r},${sup + 200}" stroke="#E7726A" stroke-width="10" fill="none" opacity=".6"/>`;
  if (tipo === 'abelha') {
    c += `<g transform="translate(${cx},${sup + 200}) rotate(90) scale(1.1)">${ferraoFarpado(150, 1, true, 1 + 0.08 * Math.sin(t * 9))}</g>`;
    for (let i = 0; i < 4; i++) { const q = ((t * 0.9 + i / 4) % 1); c += `<circle cx="${r1(cx + Math.sin(i * 2) * 10)}" cy="${r1(sup + 170 + q * 120)}" r="${r1(9 * (1 - q) + 3)}" fill="#E8D36A" stroke="#A88A2A" stroke-width="2" opacity="${r1(1 - q)}"/>`; }
  } else {
    const fundo = 0.5 + 0.5 * Math.sin(t * 7), y0 = sup - 230 + fundo * 220;
    c += `<g transform="translate(${cx},${y0 + 230}) rotate(90) scale(1.4)">${ferraoLiso(170, 1)}</g>`;
    c += `<path d="M${cx},${sup - 10} L${cx},${r1(Math.max(sup, y0 + 230 + 10))}" stroke="#C4584A" stroke-width="${r1(6 * fundo)}" opacity=".6"/>`;
  }
  return `<path d="M${cx},${cy} L${alvo[0]},${alvo[1]}" stroke="${K}" stroke-width="5" stroke-dasharray="12 9" opacity="${r1(sv(k))}"/>` +
    `<clipPath id="lupaV${tipo}"><circle cx="${cx}" cy="${cy}" r="${r1(R)}"/></clipPath><circle cx="${cx}" cy="${cy}" r="${r1(R + 14)}" fill="#fff" stroke="${K}" stroke-width="8"/>` +
    `<g clip-path="url(#lupaV${tipo})">${c}</g><circle cx="${cx}" cy="${cy}" r="${r1(R)}" fill="none" stroke="${K}" stroke-width="6"/><circle cx="${alvo[0]}" cy="${alvo[1]}" r="16" fill="none" stroke="${K}" stroke-width="5" opacity="${r1(sv(k))}"/>`;
}

/* ---------------------------------- linha do tempo ---------------------------------- */
const T = { pousaA: 2.6, curvaA: 3.0, picaA: 3.45, puxa: 4.7, rasga: 5.5, cai: [7.0, 7.7], lupaA: [9.0, 12.0], vespa: [12.0, 15.2], picas: [15.5, 16.9, 18.3, 19.7], lupaV: [21.6, 24.6], foi: [24.8, 27.0], fim: 28.5 };
const XB = 470, XF = 470;                    // onde a abelha pica (o ferrão fica aqui)
const XS = [470, 560, 630, 360];            // onde a vespa pica
const AE = 0.62, VE = 1.45;                 // escalas: a vespa-mandarina é ~3x a abelha
const TOTAL = T.fim;

function cenaAbelha(t) {
  let s = '', voando = t < T.pousaA, asaV = Math.sin(t * 95) * 28;
  const pulsoArm = t > T.picaA ? 14 * Math.exp(-7 * (t - T.picaA)) * Math.cos(30 * (t - T.picaA)) : 0;
  const vergA = t > T.picaA ? sv(inv(T.picaA, T.picaA + 4, t)) * 0.8 : 0;
  s += braco(t, [{ x: XF, k: vergA }].concat(vespaVergoes(t)), pulsoArm);
  // o ferrão preso (depois que ela se rasga)
  if (t >= T.rasga) s += ferraoPreso(XF, TOPO(XF), 0.45, t * 9) + (t < T.lupaA[1] + 1 ? ondas(XF, TOPO(XF) - 50, t, '#C7463C', 3, 22) : '');
  if (t < T.pousaA) {                                  // chega voando e pousa
    const k = ease(inv(-0.4, T.pousaA, t)), x = lerp(70, XB + 40, k) + Math.sin(t * 5) * 30 * (1 - k), y = lerp(420, TOPO(XB) - PES.abelha * AE, k) + Math.sin(t * 7) * 30 * (1 - k);
    s += inseto('abelha', x, y, Math.sin(t * 6) * 8 * (1 - k), AE, { asaFase: asaV }).svg + zumbido(x + 20, y - 20, t, 110);
  } else if (t < T.rasga) {                            // curva o abdome, pica, bombeia; tenta subir e o abdome estica
    const cv = -55 * sv(inv(T.curvaA, T.picaA, t)), puxa = sv(inv(T.puxa, T.rasga, t));
    if (t < T.picaA) s += pousado('abelha', XB + 40, -10 * sv(inv(T.curvaA, T.picaA, t)), AE, { curva: cv }).svg;
    else {
      const bomb = Math.sin(t * 14) * 4, a = picando('abelha', XF, TOPO(XF) + 10, -14, AE, { curva: cv + bomb, asaFase: puxa > 0 ? asaV : 0 });
      const subir = puxa * 70;
      const b = inseto('abelha', 0, 0, -14 + puxa * 10, AE, { curva: cv * (1 - puxa * 0.6), asaFase: puxa > 0 ? asaV : 0 });
      const ab = picando('abelha', XF, TOPO(XF) + 10, -14, AE, { curva: cv, asaFase: 0 });
      const X0 = ab.ponta[0] - b.ponta[0], Y0 = ab.ponta[1] - b.ponta[1] - subir;
      const g = puxa > 0 ? inseto('abelha', X0 + 0, Y0, -14 + puxa * 10, AE, { curva: cv * (1 - puxa * 0.6), asaFase: asaV }) : a;
      if (puxa > 0) s += `<path d="M${r1(g.ponta[0])},${r1(g.ponta[1])} L${XF},${r1(TOPO(XF) + 10)}" stroke="#C96A4A" stroke-width="${r1(8 - 5 * puxa)}" stroke-linecap="round"/>` + zumbido(g.cauda[0] + 160 * AE, g.cauda[1] - 60, t, 100);
      s += g.svg;
      if (t < T.picaA + 0.35) s += plimV(XF, TOPO(XF), inv(T.picaA, T.picaA + 0.35, t), 50, 10, '#B8261A');
    }
  } else if (t < T.cai[1]) {                           // arrancou: voa torto, perdendo altura, e cai no chão
    const u = t - T.rasga, x = XF + 60 + u * 120 + Math.sin(u * 9) * 40, y = TOPO(XF) - 120 - Math.sin(Math.min(u, 1.2) * 2) * 160 + Math.max(0, t - T.cai[0]) ** 2 * 2600;
    const yy = Math.min(y, CHAO - 50), ang = Math.sin(u * 11) * 25 + inv(T.cai[0], T.cai[1], t) * 180;
    s += inseto('abelha', x, yy, ang, AE, { rasgada: true, morta: u > 0.8, asaFase: t < T.cai[0] ? asaV * (1 - u * 0.3) : 0 }).svg;
    s += plimV(XF, TOPO(XF) - 20, inv(T.rasga, T.rasga + 0.3, t), 60, 10, '#B8261A');
    for (let i = 0; i < 4; i++) { const q = inv(T.rasga, T.rasga + 0.6, t); if (q > 0 && q < 1) s += `<circle cx="${r1(XF + 30 + i * 18 + q * 60)}" cy="${r1(TOPO(XF) - 60 + q * q * 200 + i * 8)}" r="5" fill="#E7C34A" opacity="${r1(1 - q)}"/>`; }
  }
  // abelha morta no chão (de costas, perninhas mexendo um pouco no começo)
  if (t >= T.cai[1]) {
    const u = t - T.cai[1], x = XF + 60 + (T.cai[1] - T.rasga) * 120 + Math.sin((T.cai[1] - T.rasga) * 9) * 40;
    s += inseto('abelha', x, CHAO - 50 - Math.abs(Math.sin(u * 30)) * 6 * Math.exp(-3 * u), 180 + Math.sin(u * 20) * 6 * Math.exp(-2 * u), AE, { rasgada: true, morta: true }).svg;
  }
  return s;
}
function vespaVergoes(t) { return XS.map((x, i) => ({ x, k: t > T.picas[i] + 0.25 ? sv(inv(T.picas[i] + 0.25, T.picas[i] + 2.5, t)) : 0 })); }
function cenaVespa(t) {
  let s = '', asaV = Math.sin(t * 70) * 26;
  if (t < T.vespa[0]) return '';
  if (t < T.vespa[1]) {                                // a sombra passa, ela desce e pousa
    const k = ease(inv(T.vespa[0] + 0.6, T.vespa[1], t)), x = lerp(1250, XS[0] + 80, k), y = lerp(-200, TOPO(XS[0]) - PES.mandarina * VE, k) + Math.sin(t * 5) * 20 * (1 - k);
    s += `<ellipse cx="${r1(lerp(1400, XS[0], k))}" cy="${r1(TOPO(XS[0]) + 60)}" rx="${r1(260 * (1.4 - k * 0.4))}" ry="${r1(70 * (1.4 - k * 0.4))}" fill="url(#sombraV)"/>`;
    s += inseto('mandarina', x, y, Math.sin(t * 4) * 6 * (1 - k), VE, { asaFase: asaV }).svg + zumbido(x + 40, y - 60, t, 250);
    return s;
  }
  if (t < T.foi[0]) {                                  // as picadas
    let i = 0; for (let j = 0; j < XS.length; j++) if (t >= T.picas[j] - 0.6) i = j;
    const t0 = T.picas[i], u = t - t0, xp = XS[i];
    const desce = sv(inv(-0.35, 0, u)) * (1 - sv(inv(0.45, 0.75, u)));            // abdome curvando e o ferrão dentro
    const cv = -48 * desce, dentro = u >= 0 && u < 0.6;
    if (dentro || desce > 0.02) {
      const g = picando('mandarina', xp, TOPO(xp) + 10 * desce, -12, VE, { curva: cv, asaFase: 0 });
      const sobe = (1 - desce) * 30;
      s += inseto('mandarina', g.ponta[0] - (g.ponta[0] - picando('mandarina', xp, TOPO(xp), -12, VE, { curva: cv }).ponta[0]), 0, 0, 1, {}).svg.slice(0, 0);
      s += `<g transform="translate(0,${r1(-sobe)})">${g.svg}</g>`;
      if (u > 0 && u < 0.3) s += plimV(xp, TOPO(xp), inv(0, 0.3, u), 60, 10, '#B8261A');
    } else {                                           // pula para o próximo lugar
      const prox = XS[Math.min(i + 1, XS.length - 1)], q = sv(inv(0.75, 1.35, u)), x = lerp(xp, prox, q) + 10;
      s += pousado('mandarina', x, -6 + Math.sin(q * Math.PI) * -10, VE, { asaFase: q > 0 && q < 1 ? asaV : 0 }).svg;
      if (q > 0 && q < 1) s += zumbido(x + 40, TOPO(x) - 200, t, 200);
    }
    return s;
  }
  // vai embora inteira
  const k = ease(inv(T.foi[0], T.foi[1], t)), x = lerp(XS[3] + 60, 1300, k), y = lerp(TOPO(XS[3]) - PES.mandarina * VE, -350, k);
  return inseto('mandarina', x, y, -10 * k, VE, { asaFase: asaV }).svg + zumbido(x + 40, y - 60, t, 250);
}

/** câmera: centro (cx, cy) e zoom z, por trechos */
function camera(t) {
  const K = [[0, 540, 900, 1.0], [2.6, 560, 900, 1.25], [3.2, XF, 880, 1.9], [4.6, XF, 880, 1.9], [5.6, XF + 120, 900, 1.35], [7.7, XF + 140, 1200, 1.3], [8.8, XF + 100, 1150, 1.25],
    [9.0, 540, 960, 1.0], [12.0, 540, 960, 1.0], [15.0, 580, 900, 1.0], [19.0, 580, 900, 1.0], [21.4, 580, 900, 1.0], [21.6, 540, 960, 1.0], [24.6, 540, 960, 1.0], [27.5, 560, 1000, 1.06]];
  let a = K[0], b = K[K.length - 1];
  for (let i = 0; i < K.length - 1; i++) if (t >= K[i][0] && t <= K[i + 1][0]) { a = K[i]; b = K[i + 1]; break; }
  if (t > K[K.length - 1][0]) a = b;
  const k = a === b ? 0 : ease((t - a[0]) / (b[0] - a[0]));
  return [lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k)];
}
function frame(t) {
  const [cx, cy, z] = camera(t);
  const escuro = 0.25 * sv(inv(T.vespa[0], T.vespa[0] + 0.8, t)) * (1 - sv(inv(T.foi[0], T.foi[1], t)));
  let mundo = jardim(t, escuro) + cenaAbelha(t) + cenaVespa(t);
  const tremor = t > T.vespa[0] && t < T.vespa[1] ? Math.sin(t * 60) * 3 : 0;
  let s = `<g transform="translate(${r1(540 + tremor)},960) scale(${r1(z * 1000) / 1000}) translate(${r1(-cx)},${r1(-cy)})">${mundo}</g>`;
  // lupas (fora da câmera: ficam do mesmo tamanho na tela)
  const toScreen = p => [540 + (p[0] - cx) * z, 960 + (p[1] - cy) * z];
  const kA = inv(T.lupaA[0], T.lupaA[0] + 0.5, t) * (1 - inv(T.lupaA[1] - 0.4, T.lupaA[1], t));
  s += lupaCorte(540, 520, 330, kA, 'abelha', t, toScreen([XF, TOPO(XF)]));
  const kV = inv(T.lupaV[0], T.lupaV[0] + 0.5, t) * (1 - inv(T.lupaV[1] - 0.4, T.lupaV[1], t));
  s += lupaCorte(540, 520, 330, kV, 'vespa', t, toScreen([XS[3], TOPO(XS[3])]));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${DEFS}${DEFS_V}</defs>${s}` +
    `<rect width="${W}" height="${H}" fill="url(#vinh)"/><rect width="${W}" height="${H}" filter="url(#grao)" opacity=".5"/><rect width="${W}" height="${H}" fill="#000" opacity="${r1(inv(T.fim - 0.6, T.fim, t) * 100) / 100}"/></svg>`;
}
const PLANOS = [{ nome: 'video', t0: 0, dur: TOTAL }];
