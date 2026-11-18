/* =====================================================================================
   CARLOS — o homem que engoliu um feijão (Short 2D de ficção).
   Cartoon de frente, cabeção careca (o topo vira canteiro), nariz de batata, bigode, corpo de pera, camisa mostarda.
   Volume igual ao REX: cada parte tem sombra própria (lado oposto à luz) e fio de luz, contorno escuro.
   Unidades: chão em y = 0, para cima é negativo; altura ~ 660.
   carlos(o): { x, y, esc, t, idBase,
     olhos('abertos'|'arregalados'|'meio'|'fechados'), olho:[dx,dy], boca('sorriso'|'o'|'grito'|'engole'|'reto'|'triste'|'mastiga'|'bico'),
     sobr (-1 bravo .. 1 assustado), bochecha (0..1 inflada), suor, inclina (graus, cabeça), corpoY (agachar/pular),
     bracoE/bracoD: { ombro, cotovelo } (graus; 0 = pendurado, + = para fora/para cima), maoE/maoD: 'aberta'|'punho'|'aponta',
     naMao: svg desenhado na mão direita, planta (0..1), raiz (0..1: as pernas viram raízes) }
   ===================================================================================== */
const C = {
  pele: '#F3B98E', peleSomb: '#CF8660', peleLuz: '#FFE3C8', boch: '#F07E70', cabelo: '#3A2618', cabeloLuz: '#6B4A33',
  camisa: '#F0A93A', camisaSomb: '#C4741C', camisaLuz: '#FFD98E', calca: '#5B4636', calcaSomb: '#3A2B20', calcaLuz: '#836A55',
  sapato: '#2E2019', contorno: '#1C1410', boca: '#6E1F1C', lingua: '#E0605A',
  folha: '#58B83E', folhaSomb: '#2F7F24', folhaLuz: '#C2F07F', caule: '#3E9A30', cauleSomb: '#2A6E20', vagem: '#86C64C', vagemSomb: '#4F8E2A', raiz: '#8A6238',
};
const LUZC = [0.5, -0.86];
let _cid = 0;
const q1 = x => Math.round(x * 10) / 10;
const clC = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const DEFS_C = `
<filter id="cBlurP" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5"/></filter>
<filter id="cBlur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10"/></filter>
<radialGradient id="cBoch" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${C.boch}" stop-opacity=".75"/><stop offset="1" stop-color="${C.boch}" stop-opacity="0"/></radialGradient>
<radialGradient id="cCareca" cx=".38" cy=".3" r=".5"><stop offset="0" stop-color="#FFF4E6" stop-opacity=".95"/><stop offset="1" stop-color="#FFF4E6" stop-opacity="0"/></radialGradient>
<linearGradient id="cFolG" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${C.folhaSomb}"/><stop offset=".5" stop-color="${C.folha}"/><stop offset="1" stop-color="${C.folhaLuz}"/></linearGradient>
`;
/** volume genérico: el(cor) devolve o elemento pintado com 'cor' (preenchimento ou traço). Sombra e luz por máscara. */
function volE(el, base, sombra, luz, { ds = 20, dl = 6, extra = '', contorno = '', antes = '' } = {}) {
  const id = 'c' + (_cid++), sx = q1(LUZC[0] * ds), sy = q1(LUZC[1] * ds), lx = q1(-LUZC[0] * dl), ly = q1(-LUZC[1] * dl);
  let s = antes + el(base);
  s += `<mask id="${id}d">${el('#fff')}</mask>`;
  if (extra) s += `<g mask="url(#${id}d)">${extra}</g>`;
  s += `<mask id="${id}s">${el('#fff')}<g transform="translate(${sx},${sy})" filter="url(#cBlurP)">${el('#000')}</g></mask><g mask="url(#${id}s)" opacity=".85">${el(sombra)}</g>`;
  if (luz) s += `<mask id="${id}l">${el('#fff')}<g transform="translate(${lx},${ly})">${el('#000')}</g></mask><g mask="url(#${id}l)" opacity=".8">${el(luz)}</g>`;
  return s + contorno;
}
/** forma preenchida com contorno */
function volP(d, base, sombra, luz, o = {}) {
  const sw = o.sw ?? 6;
  return volE(c => `<path d="${d}" fill="${c}"/>`, base, sombra, luz, { ...o, contorno: `<path d="${d}" fill="none" stroke="${C.contorno}" stroke-width="${sw}" stroke-linejoin="round"/>` });
}
/** tubo (braço/perna) por traço grosso, contorno desenhado por baixo */
function volT(d, w, base, sombra, luz, o = {}) {
  const sw = o.sw ?? 6, tubo = c => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return volE(tubo, base, sombra, luz, { ...o, antes: `<path d="${d}" fill="none" stroke="${C.contorno}" stroke-width="${w + 2 * sw}" stroke-linecap="round" stroke-linejoin="round"/>` });
}

/* ---------------------------------- a planta ---------------------------------- */
/** folíolo (gota com ponta), apontando para cima, comprimento L */
const FOLIOLO = L => `M0,0 C${q1(L * .3)},${q1(-L * .14)} ${q1(L * .42)},${q1(-L * .62)} 0,${-L} C${q1(-L * .42)},${q1(-L * .62)} ${q1(-L * .3)},${q1(-L * .14)} 0,0 Z`;
/** folha de feijão trifoliolada em (x,y), ângulo (0 = para cima), escala */
function folha(x, y, ang = 0, esc = 1, bal = 0) {
  if (esc <= 0.02) return '';
  const f = (a, L) => `<g transform="rotate(${a}) translate(0,-8)"><path d="${FOLIOLO(L)}" fill="url(#cFolG)" stroke="${C.contorno}" stroke-width="3.5" stroke-linejoin="round"/><path d="M0,-2 L0,${q1(-L * .86)}" stroke="${C.folhaSomb}" stroke-width="2.4" stroke-linecap="round"/></g>`;
  return `<g transform="translate(${q1(x)},${q1(y)}) rotate(${q1(ang + bal)}) scale(${q1(esc * 100) / 100})">
    <path d="M0,0 L0,-14" stroke="${C.contorno}" stroke-width="7" stroke-linecap="round"/><path d="M0,0 L0,-14" stroke="${C.caule}" stroke-width="3.5" stroke-linecap="round"/>
    <g transform="translate(0,-14)">${f(-62, 44)}${f(62, 44)}${f(0, 58)}</g></g>`;
}
/** caule curvo com contorno; pontos [[x,y],...] (Catmull-Rom) */
function caule(pts, w = 8, cor = C.caule) {
  if (pts.length < 2) return '';
  let d = `M${q1(pts[0][0])},${q1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${q1(p1[0] + (p2[0] - p0[0]) / 6)},${q1(p1[1] + (p2[1] - p0[1]) / 6)} ${q1(p2[0] - (p3[0] - p1[0]) / 6)},${q1(p2[1] - (p3[1] - p1[1]) / 6)} ${q1(p2[0])},${q1(p2[1])}`;
  }
  return `<path d="${d}" fill="none" stroke="${C.contorno}" stroke-width="${q1(w + 6)}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${q1(w)}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${C.folhaLuz}" stroke-width="${q1(Math.max(1, w * .25))}" stroke-linecap="round" opacity=".55" transform="translate(${q1(-w * .2)},${q1(-w * .2)})"/>`;
}
/** pontos de um ramo que sai de (x,y) na direção ang (graus, 0 = direita), comprimento L, curva c */
function ramo(x, y, ang, L, c = 0.4, n = 6) {
  const r = ang * Math.PI / 180, pts = [];
  for (let i = 0; i <= n; i++) { const u = i / n, a = r + c * u * u * 2.2; pts.push([x + Math.cos(r) * L * u * 0.55 + Math.cos(a) * L * u * 0.45, y + Math.sin(r) * L * u * 0.55 + Math.sin(a) * L * u * 0.45]); }
  return pts;
}
/** gavinha (espiral) na ponta de um ramo */
function gavinha(x, y, ang, esc = 1) {
  if (esc <= 0.05) return '';
  let d = 'M0,0', a = 0, r = 26;
  for (let i = 1; i <= 16; i++) { a += 0.55; r *= 0.86; d += ` L${q1(Math.cos(a) * 30 * (1 - i / 20) + i * 1.5)},${q1(-Math.sin(a) * r)}`; }
  return `<g transform="translate(${q1(x)},${q1(y)}) rotate(${q1(ang)}) scale(${q1(esc * 100) / 100})"><path d="${d}" fill="none" stroke="${C.contorno}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${C.caule}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}
/** muda (o brotinho clássico: caule + dois cotilédones) saindo de (x,y) inclinada ang (0 = para cima), k = crescimento */
function muda(x, y, ang, k, t = 0, sem = 0, estica = 1) {
  if (k <= 0.01) return '';
  const bal = Math.sin(t * 3.1 + sem) * 7 * k / estica, h = (26 + 62 * k) * estica;
  const cot = lado => `<g transform="translate(0,${-h}) rotate(${q1(lado * (58 - 10 * k))}) scale(${q1(.4 + .6 * k)})"><g transform="scale(${lado},1)"><path d="M0,0 C18,-14 26,-46 4,-58 C-16,-50 -16,-16 0,0 Z" fill="url(#cFolG)" stroke="${C.contorno}" stroke-width="4" stroke-linejoin="round"/><path d="M0,-4 L3,-46" stroke="${C.folhaSomb}" stroke-width="2.5"/></g></g>`;
  return `<g transform="translate(${q1(x)},${q1(y)}) rotate(${q1(ang + bal)})">${caule([[0, 0], [5, -h * .4], [-4, -h * .75], [0, -h]], (6 + 3 * k) / Math.sqrt(estica))}${cot(-1)}${cot(1)}</g>`;
}
/** vagem pendurada em (x,y), ângulo, escala */
function vagem(x, y, ang = 90, esc = 1, t = 0) {
  if (esc <= 0.02) return '';
  const d = 'M0,0 C8,-12 30,-14 56,-10 C84,-6 104,6 116,22 C108,30 82,24 56,18 C30,14 8,10 0,0 Z';
  const g = `<path d="${d}" fill="${C.vagem}" stroke="${C.contorno}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M10,6 C30,12 60,14 104,22" fill="none" stroke="${C.vagemSomb}" stroke-width="5" opacity=".7"/>` +
    [24, 48, 72, 94].map((u, i) => `<ellipse cx="${u}" cy="${q1(-2 + i * 3)}" rx="11" ry="8" fill="#A6DC6A" opacity=".75"/>`).join('') +
    `<path d="M0,0 L-10,-8" stroke="${C.contorno}" stroke-width="7" stroke-linecap="round"/><path d="M0,0 L-10,-8" stroke="${C.caule}" stroke-width="3" stroke-linecap="round"/>`;
  return `<g transform="translate(${q1(x)},${q1(y)}) rotate(${q1(ang + Math.sin(t * 2.3 + x * .05) * 5)}) scale(${q1(esc * 100) / 100})">${g}</g>`;
}
/** o grão de feijão (carioca, com pintinhas), centro (x,y), raio ~r */
function feijao(x, y, r = 20, ang = 0) {
  const d = `M${-r},0 C${-r},${-r * .8} ${-r * .3},${-r * .85} 0,${-r * .55} C${r * .3},${-r * .85} ${r},${-r * .8} ${r},0 C${r},${r * .8} ${r * .4},${r * .9} 0,${r * .9} C${-r * .4},${r * .9} ${-r},${r * .8} ${-r},0 Z`;
  return `<g transform="translate(${q1(x)},${q1(y)}) rotate(${q1(ang)})"><path d="${d}" fill="#D9AD7C" stroke="${C.contorno}" stroke-width="${q1(Math.max(2, r * .12))}"/>` +
    [[-.5, -.2, .22], [.1, .3, .18], [.5, -.15, .2], [-.2, .45, .14], [.35, .45, .12]].map(([a, b, c]) => `<ellipse cx="${q1(a * r)}" cy="${q1(b * r)}" rx="${q1(c * r)}" ry="${q1(c * r * .7)}" fill="#8A5530" opacity=".85"/>`).join('') +
    `<ellipse cx="${q1(-r * .4)}" cy="${q1(-r * .3)}" rx="${q1(r * .26)}" ry="${q1(r * .12)}" fill="#fff" opacity=".7" transform="rotate(-25,${q1(-r * .4)},${q1(-r * .3)})"/>` +
    `<path d="M${q1(-r * .15)},${q1(-r * .5)} q${q1(r * .15)},${q1(r * .12)} ${q1(r * .3)},0" stroke="#F4E6D0" stroke-width="${q1(r * .1)}" fill="none" stroke-linecap="round"/></g>`;
}

/* ---------------------------------- a cabeça ---------------------------------- */
/** cabeça em coordenadas locais: (0,0) = base do queixo, topo em y ~ -262 */
function cabecaC(o = {}) {
  const { olhos = 'abertos', olho = [0, 0], boca = 'sorriso', sobr = 0, piscar = 0, planta = 0, t = 0, bochecha = 0, suor = 0, mudaAng = 64, mudaEsc = 1 } = o;
  const kM = o.kM ?? clC(planta / 0.22), kN = o.kN ?? clC((planta - 0.22) / 0.2), kT = o.kT ?? clC((planta - 0.4) / 0.25), kV = o.kV ?? clC((planta - 0.62) / 0.3), kO = o.kO ?? kN;
  const { mudaEstica = 1, chapeu = null, semBigode = false } = o;
  let s = '', tras = '';
  // ramos do topo (atrás da cabeça, saindo da careca)
  if (kT > 0) {
    const R = [[-70, -238, -118, 1.0, -0.5], [-20, -258, -98, 1.25, 0.4], [34, -256, -76, 1.15, -0.4], [84, -232, -58, 0.95, 0.5]];
    R.forEach(([x, y, a, L, c], i) => {
      const P = ramo(x, y, a + Math.sin(t * 2 + i) * 4, 170 * L * kT, c), e = P[P.length - 1];
      tras += caule(P, 7 + 4 * kT) + gavinha(e[0], e[1], a + 70, kT * .9);
      for (let j = 2; j < P.length; j += 2) tras += folha(P[j][0], P[j][1], (a + 90) + (j % 4 ? 70 : -70), 0.62 * kT, Math.sin(t * 3 + i + j) * 6);
      if (kV > 0) tras += vagem(P[3][0], P[3][1], 70 + i * 12, 0.7 * kV, t) + (i % 2 ? vagem(P[5][0], P[5][1], 100, 0.55 * kV, t) : '');
    });
  }
  // orelhas
  const orelha = ld => volP(`M${ld * 128},-150 C${ld * 168},-176 ${ld * 178},-104 ${ld * 140},-90 C${ld * 132},-88 ${ld * 126},-96 ${ld * 124},-104 Z`, C.pele, C.peleSomb, C.peleLuz, { ds: 10, dl: 3, sw: 5 }) +
    `<path d="M${ld * 138},-138 C${ld * 156},-140 ${ld * 158},-112 ${ld * 140},-106" fill="none" stroke="${C.peleSomb}" stroke-width="5" stroke-linecap="round"/>`;
  s += orelha(-1) + orelha(1);
  // rosto
  const ROSTO = 'M0,0 C-92,0 -136,-48 -138,-128 C-140,-212 -80,-262 0,-262 C80,-262 140,-212 138,-128 C136,-48 92,0 0,0 Z';
  const bk = 0.6 + 0.4 * bochecha, bx = 66 + 18 * bochecha, br = 36 + 16 * bochecha;
  s += volP(ROSTO, C.pele, C.peleSomb, C.peleLuz, { ds: 34, dl: 8, extra:
    `<ellipse cx="${-bx}" cy="-70" rx="${br}" ry="${q1(br * .7)}" fill="url(#cBoch)" opacity="${bk}"/><ellipse cx="${bx}" cy="-70" rx="${br}" ry="${q1(br * .7)}" fill="url(#cBoch)" opacity="${bk}"/>` +
    `<ellipse cx="-34" cy="-226" rx="62" ry="30" fill="url(#cCareca)"/>` });
  // cabelo: tufos dos lados e três fios penteados por cima (a careca disfarçada)
  for (const ld of [-1, 1]) s += volP(`M${ld * 120},-208 C${ld * 140},-196 ${ld * 150},-170 ${ld * 140},-150 C${ld * 150},-140 ${ld * 146},-118 ${ld * 136},-112 C${ld * 132},-140 ${ld * 126},-176 ${ld * 112},-196 Z`, C.cabelo, '#1A0F08', C.cabeloLuz, { ds: 8, dl: 3, sw: 4 });
  const fio = Math.sin(t * 4) * 3;
  [[-70, -246, 50, -248], [-60, -254, 70, -240], [-40, -258, 90, -228]].forEach(([a, b, c, d], i) =>
    s += `<path d="M${a},${b} Q${q1((a + c) / 2)},${q1(b - 24 - i * 4 + fio)} ${c},${d}" fill="none" stroke="${C.cabelo}" stroke-width="5" stroke-linecap="round"/>`);
  // olhos
  const [ox, oy] = olho, fech = olhos === 'fechados' || piscar > 0.5;
  for (const ld of [-1, 1]) {
    const cx = ld * 46, cy = -150;
    if (fech) { s += `<path d="M${cx - 22},${cy} Q${cx},${cy + 12} ${cx + 22},${cy}" stroke="${C.contorno}" stroke-width="6" fill="none" stroke-linecap="round"/>`; continue; }
    const arr = olhos === 'arregalados', rx = arr ? 30 : 24, ry = arr ? 38 : 30, pr = arr ? 8 : 11;
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" stroke="${C.contorno}" stroke-width="5"/>` +
      `<path d="M${cx - rx + 4},${cy + 6} Q${cx},${cy + ry + 2} ${cx + rx - 4},${cy + 6}" fill="none" stroke="#D8D2CC" stroke-width="5" opacity=".7"/>` +
      `<circle cx="${q1(cx + ox * 9)}" cy="${q1(cy + 4 + oy * 9)}" r="${pr}" fill="${C.contorno}"/><circle cx="${q1(cx + ox * 9 + 4)}" cy="${q1(cy + oy * 9)}" r="3.5" fill="#fff"/>`;
    if (olhos === 'meio') s += `<path d="M${cx - rx - 2},${cy - 2} Q${cx},${cy - ry - 4} ${cx + rx + 2},${cy - 2} Z" fill="${C.pele}" stroke="${C.contorno}" stroke-width="5" stroke-linejoin="round"/>`;
  }
  // sobrancelhas (sobr > 0 sobe = medo; < 0 desce no meio = bravo)
  for (const ld of [-1, 1]) {
    const yi = -196 - sobr * 16 + (sobr < 0 ? -sobr * 22 : 0), ye = -196 - sobr * 6 - (sobr < 0 ? -sobr * 8 : 0);
    const d = `M${ld * 18},${q1(yi)} Q${ld * 46},${q1(Math.min(yi, ye) - 14)} ${ld * 78},${q1(ye)}`;
    s += `<path d="${d}" fill="none" stroke="${C.contorno}" stroke-width="16" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${C.cabelo}" stroke-width="9" stroke-linecap="round"/>`;
  }
  // boca
  const BOCAS = {
    sorriso: `<path d="M-44,-56 Q0,-58 44,-56 Q36,-16 0,-14 Q-36,-16 -44,-56 Z" fill="${C.boca}" stroke="${C.contorno}" stroke-width="5" stroke-linejoin="round"/><path d="M-38,-54 Q0,-56 38,-54 L34,-44 Q0,-46 -34,-44 Z" fill="#fff"/><ellipse cx="0" cy="-24" rx="18" ry="8" fill="${C.lingua}"/>`,
    o: `<ellipse cx="0" cy="-34" rx="18" ry="22" fill="${C.boca}" stroke="${C.contorno}" stroke-width="5"/><ellipse cx="0" cy="-24" rx="10" ry="6" fill="${C.lingua}"/>`,
    grito: `<path d="M-46,-60 Q0,-66 46,-60 Q40,10 0,14 Q-40,10 -46,-60 Z" fill="${C.boca}" stroke="${C.contorno}" stroke-width="5" stroke-linejoin="round"/><path d="M-38,-58 Q0,-62 38,-58 L35,-48 Q0,-52 -35,-48 Z" fill="#fff"/><ellipse cx="0" cy="-4" rx="22" ry="10" fill="${C.lingua}"/>`,
    engole: `<path d="M-24,-34 Q0,-42 24,-34" stroke="${C.contorno}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
    bico: `<ellipse cx="0" cy="-36" rx="13" ry="10" fill="${C.boch}" stroke="${C.contorno}" stroke-width="5"/>`,
    reto: `<path d="M-30,-36 L30,-36" stroke="${C.contorno}" stroke-width="6" stroke-linecap="round"/>`,
    triste: `<path d="M-32,-26 Q0,-50 32,-26" stroke="${C.contorno}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
    mastiga: `<path d="M-30,-40 Q0,${q1(-26 + Math.sin(t * 18) * 8)} 30,-40" stroke="${C.contorno}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  };
  s += BOCAS[boca] || BOCAS.sorriso;
  // nariz de batata
  s += volP('M0,-150 C-24,-150 -28,-118 -40,-104 C-56,-86 -38,-62 -14,-68 C-6,-60 6,-60 14,-68 C38,-62 56,-86 40,-104 C28,-118 24,-150 0,-150 Z', C.pele, C.peleSomb, C.peleLuz, { ds: 14, dl: 4, sw: 5,
    extra: '<ellipse cx="-14" cy="-120" rx="9" ry="13" fill="#fff" opacity=".5"/>' });
  s += `<ellipse cx="-14" cy="-72" rx="6" ry="4" fill="${C.boca}" opacity=".7"/><ellipse cx="14" cy="-72" rx="6" ry="4" fill="${C.boca}" opacity=".7"/>`;
  // folhinhas saindo das narinas
  if (kN > 0) s += folha(-16, -72, -160 + Math.sin(t * 3) * 6, 0.8 * kN) + folha(16, -72, 160 - Math.sin(t * 3.4) * 6, 0.75 * kN);
  // bigode (vassourinha)
  if (!semBigode) s += volP('M0,-64 C-14,-74 -46,-76 -78,-58 C-84,-48 -70,-40 -58,-46 C-40,-42 -18,-46 0,-54 C18,-46 40,-42 58,-46 C70,-40 84,-48 78,-58 C46,-76 14,-74 0,-64 Z', C.cabelo, '#140A04', C.cabeloLuz, { ds: 6, dl: 3, sw: 4 });
  if (suor > 0) s += `<path d="M120,-196 C108,-176 112,-160 124,-160 C136,-160 138,-176 120,-196 Z" fill="#9FD8FF" stroke="${C.contorno}" stroke-width="4" opacity="${q1(suor)}"/>`;
  // a muda que sai da orelha direita (a primeira coisa) e os ramos que vêm depois
  s += `<g transform="translate(160,-128) scale(${mudaEsc})">${muda(0, 0, mudaAng, kM * (1 - kT * .4), t, 1, mudaEstica)}</g>`;
  if (kO > 0) { const P = ramo(166, -126, -10, 170 * kO, -0.7); s += caule(P, 6 + 3 * kO); for (let j = 2; j < P.length; j += 2) s += folha(P[j][0], P[j][1], j % 4 ? -10 : 150, 0.55 * kO, Math.sin(t * 3 + j) * 6); s += gavinha(P[6][0], P[6][1], -60, kO); if (kV > 0) s += vagem(P[4][0], P[4][1], 80, 0.7 * kV, t); }
  if (kT > 0) { const P = ramo(-166, -126, 190, 150 * kT, 0.7); s += caule(P, 6 + 3 * kT); for (let j = 2; j < P.length; j += 2) s += folha(P[j][0], P[j][1], j % 4 ? 10 : -150, 0.55 * kT, Math.sin(t * 3 + j) * 6); if (kV > 0) s += vagem(P[4][0], P[4][1], 100, 0.65 * kV, t); }
  if (chapeu !== null) {
    const lv = chapeu, bal = lv > 5 ? Math.sin(t * 2.6) * 6 * Math.min(1, lv / 80) : 0;
    s += `<g transform="translate(0,${q1(-236 - lv)}) rotate(${q1(bal)})">` +
      volP('M-170,-6 C-150,-26 150,-26 170,-6 C150,14 -150,14 -170,-6 Z', '#4A3B57', '#2A2033', '#7A6A8C', { ds: 8, dl: 3 }) +
      volP('M-104,-10 C-110,-80 -84,-130 -40,-132 C-20,-118 20,-118 40,-132 C84,-130 110,-80 104,-10 C60,0 -60,0 -104,-10 Z', '#4A3B57', '#2A2033', '#7A6A8C', { ds: 14, dl: 4,
        extra: '<rect x="-120" y="-44" width="240" height="30" fill="#C7463C"/>' }) + '</g>';
  }
  return tras + s;
}

/* ---------------------------------- o corpo ---------------------------------- */
function maoC(x, y, ang, tipo = 'aberta', ld = 1) {
  const pal = 'M-24,-6 C-28,20 -14,32 2,32 C18,32 28,20 24,-6 C18,-18 -18,-18 -24,-6 Z';
  const dedo = (a, b, c, d) => `<path d="M${a},${b} L${c},${d}" stroke="${C.contorno}" stroke-width="15" stroke-linecap="round"/><path d="M${a},${b} L${c},${d}" stroke="${C.pele}" stroke-width="8" stroke-linecap="round"/>`;
  let dedos = '';
  if (tipo === 'aberta') dedos = [-16, -5, 6, 17].map((dx, i) => dedo(dx, 22, q1(dx * 1.15), q1(44 - Math.abs(i - 1.5) * 3))).join('');
  if (tipo === 'aponta') dedos = dedo(8, 24, 12, 62);
  const pol = `<path d="M${-22 * ld},2 C${-36 * ld},4 ${-40 * ld},18 ${-30 * ld},24" fill="none" stroke="${C.contorno}" stroke-width="15" stroke-linecap="round"/><path d="M${-22 * ld},2 C${-36 * ld},4 ${-40 * ld},18 ${-30 * ld},24" fill="none" stroke="${C.pele}" stroke-width="8" stroke-linecap="round"/>`;
  return `<g transform="translate(${q1(x)},${q1(y)}) rotate(${q1(ang)})">${dedos}${pol}${volP(pal, C.pele, C.peleSomb, C.peleLuz, { ds: 8, dl: 3, sw: 5 })}</g>`;
}

/** Carlos inteiro. Devolve { svg, pts } com pontos no espaço da cena */
function carlos(o = {}) {
  const { x = 0, y = 0, esc = 1, t = 0, bracoE = {}, bracoD = {}, maoE = 'aberta', maoD = 'aberta', planta = 0, raiz = 0, inclina = 0, corpoY = 0, naMao = '', passo = null } = o;
  _cid = o.idBase || 0;
  const C0 = { ...C }; if (o.cores) Object.assign(C, o.cores);
  try {
  const resp = Math.sin(t * 2.4) * 3, kC = o.kC ?? clC((planta - 0.55) / 0.35);
  let s = `<ellipse cx="0" cy="4" rx="${q1(130 + 80 * raiz)}" ry="20" fill="#000" opacity=".22" filter="url(#cBlur)"/>`;
  // raízes (as pernas viram raiz)
  if (raiz > 0.01) for (let i = 0; i < 9; i++) {
    const ld = i < 4 ? -1 : i > 4 ? 1 : 0, a = (i - 4) * 0.36, L = (90 + 150 * raiz) * (0.75 + 0.25 * ((i * 7) % 4) / 3);
    s += caule([[ld * 40, -60], [ld * 50 + Math.sin(a) * L * .4, -10], [Math.sin(a) * L * .8, 14], [Math.sin(a) * L, 24 + (i % 3) * 8]], 6 + 10 * raiz * (1 - Math.abs(i - 4) / 6), C.raiz);
  }
  // pernas
  for (const ld of [-1, 1]) {
    const lev = passo === null ? 0 : Math.max(0, Math.sin(passo * Math.PI * 2 + (ld > 0 ? Math.PI : 0))) * 34;
    if (raiz < 0.9) s += `<g transform="translate(${ld * 52},${q1(-lev)})" opacity="${q1(1 - raiz)}">` + volT('M0,-150 L0,-36', 58, C.calca, C.calcaSomb, C.calcaLuz, { ds: 14, dl: 4 }) +
      volP(`M${ld * -30},-40 L${ld * 26},-40 C${ld * 66},-40 ${ld * 74},-10 ${ld * 66},0 L${ld * -34},0 C${ld * -40},-14 ${ld * -38},-34 ${ld * -30},-40 Z`, C.sapato, '#120A06', '#6A4C3A', { ds: 8, dl: 3 }) + '</g>';
  }
  // corpo (pera) com a camisa
  const CORPO = 'M-78,-392 C-120,-380 -156,-270 -148,-196 C-142,-148 -96,-128 0,-128 C96,-128 142,-148 148,-196 C156,-270 120,-380 78,-392 C44,-402 -44,-402 -78,-392 Z';
  let corpo = volP(CORPO, C.camisa, C.camisaSomb, C.camisaLuz, { ds: 30, dl: 8, extra:
    `<rect x="-160" y="-190" width="320" height="70" fill="${C.calca}"/><rect x="-160" y="-192" width="320" height="12" fill="${C.calcaSomb}"/>` +
    `<path d="M0,-378 L0,-194" stroke="${C.camisaSomb}" stroke-width="4"/>` + [-340, -290, -240].map(yb => `<circle cx="10" cy="${yb}" r="6" fill="#FFF1D6" stroke="${C.camisaSomb}" stroke-width="2"/>`).join('') +
    `<path d="M-100,-310 L-56,-310 L-56,-270 Q-78,-262 -100,-270 Z" fill="none" stroke="${C.camisaSomb}" stroke-width="4"/>` +
    `<rect x="-16" y="-192" width="32" height="14" rx="3" fill="#C9A23A" stroke="${C.contorno}" stroke-width="3"/>` });
  corpo += `<path d="M-46,-398 L0,-366 L46,-398 L30,-410 L0,-388 L-30,-410 Z" fill="#FFF6E4" stroke="${C.contorno}" stroke-width="5" stroke-linejoin="round"/>`;
  // cipó enrolando o corpo
  if (kC > 0) {
    const P = [[-140, -170], [-60, -230], [60, -200], [130, -280], [40, -340], [-90, -330]].slice(0, 2 + Math.round(4 * kC));
    corpo += caule(P, 10 * kC + 2); for (let j = 1; j < P.length; j++) corpo += folha(P[j][0], P[j][1] - 6, j % 2 ? -40 : 40, 0.7 * kC, Math.sin(t * 3 + j) * 6);
  }
  // braços: ombro em (±92, -362)
  const braco = (ld, b, tipo) => {
    const { ombro = 8, cotovelo = 12, k = 1 } = b, S = [ld * 92, -362 + resp * .3], L1 = 104 * k, L2 = 96 * k;
    const a1 = (90 - ombro) * Math.PI / 180, E = [S[0] + Math.cos(a1) * L1 * ld, S[1] + Math.sin(a1) * L1];
    const a2 = (90 - ombro - cotovelo) * Math.PI / 180, Hh = [E[0] + Math.cos(a2) * L2 * ld, E[1] + Math.sin(a2) * L2];
    const d = `M${q1(S[0])},${q1(S[1])} Q${q1(E[0])},${q1(E[1])} ${q1((E[0] + Hh[0]) / 2)},${q1((E[1] + Hh[1]) / 2)} L${q1(Hh[0])},${q1(Hh[1])}`;
    let g = volT(d, 50, C.camisa, C.camisaSomb, C.camisaLuz, { ds: 12, dl: 4 });
    const ang = Math.atan2(Hh[1] - E[1], Hh[0] - E[0]) * 180 / Math.PI - 90;
    g += maoC(Hh[0], Hh[1], ang, tipo, ld);
    if (kC > 0.2) { const P = [S, [(S[0] + E[0]) / 2 + ld * 26, (S[1] + E[1]) / 2], E, [(E[0] + Hh[0]) / 2 - ld * 24, (E[1] + Hh[1]) / 2]]; g += caule(P, 7 * kC); g += folha(E[0] + ld * 20, E[1], ld * 60, .55 * kC, Math.sin(t * 3 + ld) * 8); }
    return { svg: g, mao: [Hh[0] + Math.cos(a2) * 26 * ld, Hh[1] + Math.sin(a2) * 26] };
  };
  const bE = braco(-1, bracoE, maoE), bD = braco(1, bracoD, maoD);
  if (o.soBracos) return { svg: `<g transform="translate(${q1(x)},${q1(y)}) scale(${esc})"><g transform="translate(0,${q1(corpoY)})">${bE.svg}${naMao ? `<g transform="translate(${q1(bD.mao[0])},${q1(bD.mao[1])})">${naMao}</g>` : ''}${bD.svg}</g></g>`, pts: {} };
  const cab = `<g transform="translate(0,${q1(-392 + resp * .5)}) rotate(${q1(inclina)})">${cabecaC(o)}</g>`;
  s += `<g transform="translate(0,${q1(corpoY)})">${corpo}${cab}${bE.svg}${naMao ? `<g transform="translate(${q1(bD.mao[0])},${q1(bD.mao[1])})">${naMao}</g>` : ''}${bD.svg}</g>`;
  const P = p => [x + p[0] * esc, y + (p[1] + corpoY) * esc];
  return { svg: `<g transform="translate(${q1(x)},${q1(y)}) scale(${esc})">${s}</g>`,
    pts: { maoE: P(bE.mao), maoD: P(bD.mao), boca: P([0, -432]), orelha: P([170, -520]), cabeca: P([0, -560]), topo: P([0, -654]), nariz: P([0, -470]) } };
  } finally { Object.assign(C, C0); }
}
if (typeof module !== 'undefined') module.exports = { carlos, cabecaC, maoC, DEFS_C, C, folha, caule, ramo, muda, vagem, feijao, gavinha, volP, volT };
