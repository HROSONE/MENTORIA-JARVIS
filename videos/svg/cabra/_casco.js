/* =====================================================================================
   O CASCO (planos 2, 3 e 4)
   2  casco de FRENTE pousando numa quina de rocha: as duas metades (dedos) se abrem, se encaixam nas encostas e apertam
   3  CORTE lateral: a borda (parede) é dura, a sola é macia e se molda aos relevos da rocha
   4  MICROSCÓPIO: feixe de tubinhos de queratina (corte longitudinal -> corte transversal -> filamentos)
   Escala do plano 2: ~1 unidade = 1 px (casco com ~290 de largura). Pelo, dedos, bandas coronárias, esporões, rochas com líquen.
   ===================================================================================== */
const BASE_H = [540, 960, 1];
const ROCK_TOP = [[-500, 1900], [-260, 1730], [-60, 1590], [120, 1496], [250, 1424], [350, 1362], [440, 1296], [496, 1252], [524, 1232], [540, 1226], [556, 1232], [584, 1252], [640, 1296], [730, 1362], [830, 1424], [960, 1496], [1140, 1590], [1340, 1730], [1580, 1900]];
const rockY = x => { for (let i = 0; i < ROCK_TOP.length - 1; i++) if (x >= ROCK_TOP[i][0] && x <= ROCK_TOP[i + 1][0]) return lerp(ROCK_TOP[i][1], ROCK_TOP[i + 1][1], (x - ROCK_TOP[i][0]) / (ROCK_TOP[i + 1][0] - ROCK_TOP[i][0])); return ROCK_TOP[ROCK_TOP.length - 1][1]; };
const P_HORN = paleta(['#0E0A0A', '#241A18', '#3E302A', '#6A5648', '#B8A590'], 7);
const P_LEGD = paleta(['#0B0607', '#1C100C', '#3A2418', '#6A4630', '#C9955A'], 8);
const P_CORO = paleta(['#7A5E48', '#B89A78', '#E2CBA2', '#FFF0CE'], 6);
EXTRA += `<radialGradient id="gHornD" gradientUnits="userSpaceOnUse" cx="34" cy="120" r="230"><stop offset="0" stop-color="#4A3B35"/><stop offset=".45" stop-color="#271C19"/><stop offset="1" stop-color="#0C0808"/></radialGradient>
<filter id="fTubos" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.16 0.008" numOctaves="3" seed="11" result="n"/><feDiffuseLighting in="n" surfaceScale="5" diffuseConstant="1.1" lighting-color="#FFEBD0"><feDistantLight azimuth="15" elevation="50"/></feDiffuseLighting></filter>
<filter id="fRocha" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.013" numOctaves="5" seed="7" result="n1"/><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="3" result="n2"/><feComposite in="n1" in2="n2" operator="arithmetic" k1="0" k2=".72" k3=".28" k4="0" result="n"/><feDiffuseLighting in="n" surfaceScale="9" diffuseConstant="1.05" lighting-color="#FFE9D2"><feDistantLight azimuth="35" elevation="38"/></feDiffuseLighting></filter>
<linearGradient id="gCoro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E6D2AC"/><stop offset="1" stop-color="#9A7C5E"/></linearGradient>
<linearGradient id="gRockL" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8A6A9A"/><stop offset="1" stop-color="#3C2A52"/></linearGradient>
<linearGradient id="gRockR" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFC088"/><stop offset=".4" stop-color="#E0804C"/><stop offset="1" stop-color="#7A3E52"/></linearGradient>
<linearGradient id="gBoke" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A2A62"/><stop offset=".4" stop-color="#C45A60"/><stop offset=".75" stop-color="#FF9A52"/><stop offset="1" stop-color="#FFD08A"/></linearGradient>
<linearGradient id="gBrilho" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".6" stop-color="#FFE9C8" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;

/* ----- peças pré-geradas do casco (referencial: origem no centro entre os dedos, no nível da banda coronária) ----- */
const TOE_PTS = [[-92, -12], [-98, 30], [-97, 100], [-86, 180], [-64, 252], [-36, 306], [-10, 332], [12, 328], [38, 294], [62, 238], [80, 172], [90, 100], [92, 30], [88, -12]];
const CORO_PTS = [[-95, -34], [-99, 30], [-93, 76], [-60, 92], [0, 98], [60, 92], [90, 76], [94, 30], [88, -34], [0, -46]];
const LEG_PTS = [[-128, -1500], [-122, -1000], [-130, -560], [-158, -440], [-170, -320], [-160, -210], [-150, -120], [-166, -44], [-192, 22], [192, 22], [166, -44], [150, -120], [160, -210], [170, -320], [158, -440], [130, -560], [122, -1000], [128, -1500]];
let HD = null;
function cascoData() {
  if (HD) return HD;
  const toe = poly2d(TOE_PTS, true, 6), coro = poly2d(CORO_PTS, true, 6), leg = poly2d(LEG_PTS, true, 6);
  const D = { toe, coro, leg };
  // pelo da perna: escuro, com luz de recorte quente do lado do sol (direita)
  D.legFur = pelo(leg, { n: Math.round(areaPoly(leg) * .95 / 30), filtro: (x, y) => y > -1100 || hh(x * 3.1 + y, 5) < .3, cl: 3, len: [15, 27], w: [2, 3.4], fluxo: campoFluxo([[0, -800, 0, 1], [0, -300, 0, 1], [0, -100, 0, 1], [140, -250, .15, 1], [-140, -250, -.15, 1]]), pal: P_LEGD, semente: 101, sun: [.9, -.3], Dmax: 120, amb: .36, gain: .5, jit: .8, rimCor: '#FFC27A', rimD: 26, rimP: .55 });
  // tufo mais comprido caindo sobre o machinho (boleto)
  const tufo = poly2d([[-170, -340], [0, -310], [170, -340], [170, -150], [80, -70], [-80, -70], [-170, -150]], true, 5);
  D.tufo = pelo(tufo, { n: 200, cl: 3, len: [44, 80], w: [2.6, 4.2], fluxo: campoFluxo([[0, -200, 0, 1], [-120, -200, -.18, 1], [120, -200, .18, 1]]), pal: P_LEGD, semente: 102, ref: leg, sun: [.9, -.3], Dmax: 120, amb: .38, gain: .5, jit: .8, rimCor: '#FFC27A', rimD: 30, rimP: .5 });
  // pelo fino na banda coronária (cai sobre o topo da parede)
  D.coroFur = pelo(coro, { n: 230, cl: 3, len: [10, 19], w: [1.6, 2.8], fluxo: campoFluxo([[0, 20, 0, 1]]), pal: P_CORO, semente: 103, sun: [.9, -.3], Dmax: 40, amb: .5, gain: .3, jit: .6 });
  D.coroTop = pelo(poly2d([[-93, -52], [-97, 6], [0, 30], [93, 6], [87, -52], [0, -64]], true, 5), { n: 130, cl: 2, len: [24, 44], w: [2.4, 4], fluxo: campoFluxo([[0, -20, 0, 1], [-70, -20, -.3, 1], [70, -20, .3, 1]]), pal: P_LEGD, semente: 104, ref: poly2d(CORO_PTS, true, 5), Dmax: 60, amb: .4, gain: .3, jit: .8, rimCor: '#FFC27A', rimD: 20, rimP: .4 });
  HD = D;
  return D;
}
/* um dedo, no próprio referencial (pivô em 0,0, dedo apontando para +y). side: -1 esquerdo, +1 direito */
function dedo(side, o = {}) {
  const D = cascoData(), { glow = 0, desgaste = 1 } = o, id = nid('tp');
  def(`<clipPath id="${id}"><path d="${pathPoly(D.toe)}"/></clipPath>`);
  let s = `<g transform="scale(${side * -1},1)">`;                          // desenha como dedo esquerdo e espelha o direito
  s += `<path d="${pathPoly(D.toe)}" fill="url(#gHornD)"/>`;
  // fibras de queratina (tubos) = textura alongada na vertical, iluminada (clip no próprio elemento para o blend funcionar)
  s += `<rect x="-110" y="-20" width="220" height="370" fill="#000" filter="url(#fTubos)" clip-path="url(#${id})" opacity=".22" style="mix-blend-mode:screen"/>`;
  s += `<g clip-path="url(#${id})">`;
  // anéis de crescimento, finos e irregulares (arcos paralelos à banda coronária)
  [120, 170, 224].forEach((y, k) => { s += `<path d="M-98 ${y}Q0 ${y + 32 - k * 3} 92 ${y + 2}" stroke="#070404" stroke-width="${f1(1.6 + hh(k, 2))}" fill="none" opacity="${f1(.28 + .12 * hh(k, 3))}"/><path d="M-98 ${y + 3}Q0 ${y + 35 - k * 3} 92 ${y + 5}" stroke="#9A8470" stroke-width="1" fill="none" opacity=".14"/>`; });
  // luz do sol: brilho largo no lado direito + reflexo frio no esquerdo + sombra da fenda
  s += `<path d="M40 -4Q86 90 66 230Q50 280 28 312L12 300Q40 240 42 150Q44 70 24 -2Z" fill="#FFD9A8" opacity=".13" filter="url(#b4)"/>`;
  s += `<path d="M52 4Q82 100 64 220" stroke="#FFF0D6" stroke-width="4" fill="none" opacity=".55" stroke-linecap="round" filter="url(#b4)"/>`;
  s += `<path d="M-96 20Q-100 120 -80 210Q-64 262 -34 306" stroke="#7A5C9A" stroke-width="9" fill="none" opacity=".28" filter="url(#b4)"/>`;
  s += `<path d="M92 -10L72 -10Q86 120 52 280L66 290Q100 200 92 30Z" fill="#000" opacity=".28"/>`;
  // ponta desgastada: borda de apoio clara
  if (desgaste) s += `<path d="M-52 286Q-26 322 -8 330Q18 324 46 286" stroke="#BCA68C" stroke-width="9" fill="none" stroke-linecap="round" opacity=".6"/><path d="M-48 292Q-24 326 -8 334Q18 328 42 292" stroke="#F0DEC0" stroke-width="2.2" fill="none" opacity=".5"/><path d="M-20 322l5 -9l6 8l7 -8" stroke="#2A201C" stroke-width="2" fill="none" opacity=".6"/>`;
  s += `</g>`;
  s += `<path d="${pathPoly(D.toe)}" fill="none" stroke="#070404" stroke-width="3.2" stroke-linejoin="round"/>`;
  // banda coronária (pele clara, macia) com pelinhos
  s += `<path d="${pathPoly(D.coro)}" fill="url(#gCoro)"/>${D.coroFur}`;
  s += `<path d="M-92 72Q0 100 90 72" stroke="#5A4232" stroke-width="3" fill="none" opacity=".55"/>`;
  s += D.coroTop;
  if (glow > .01) s += `<path d="M-50 290Q0 336 40 290" stroke="#FFD28A" stroke-width="14" fill="none" opacity="${f1(.55 * glow)}" filter="url(#b4)"/>`;
  s += `</g>`;
  return s;
}
/* conjunto: perna + 2 dedos. spread = abertura de cada dedo (graus). Devolve {svg, bottom: pontos de apoio p/ calcular a altura} */
function cascoFrente(spread, o = {}) {
  const D = cascoData(), { glow = 0 } = o;
  let s = '';
  // esporões (dewclaws), um de cada lado, logo abaixo do boleto
  const esp = side => `<g transform="scale(${side},1)"><path d="M150 -170Q224 -166 234 -96Q212 -126 160 -112Z" fill="#1A1210"/><path d="M166 -162Q210 -156 224 -120" stroke="#8A7260" stroke-width="2.4" fill="none" opacity=".6"/></g>`;
  s += esp(-1) + esp(1);
  s += `<path d="${pathPoly(D.leg)}" fill="url(#gLegD)"/>${D.legFur}${D.tufo}`;
  // dedos: cada um gira em torno do pivô (±52, 0)
  s += `<g transform="translate(-98,0) rotate(${f1(spread)})">${dedo(-1, { glow })}</g>`;
  s += `<g transform="translate(98,0) rotate(${f1(-spread)})">${dedo(1, { glow })}</g>`;
  return s;
}
EXTRA += `<linearGradient id="gLegD" gradientUnits="userSpaceOnUse" x1="-170" y1="0" x2="170" y2="0"><stop offset="0" stop-color="#1C100C"/><stop offset=".6" stop-color="#3A2418"/><stop offset="1" stop-color="#6A4630"/></linearGradient>`;
/* altura em que o conjunto toca a rocha: para cada dedo, o ponto mais baixo (depois de girar) deve ficar sobre a encosta */
function alturaApoio(spread, cx = 540) {
  let best = 1e9;
  const D = cascoData();
  for (const side of [-1, 1]) {
    const pv = side * 98, ang = -side * spread * Math.PI / 180;           // esquerdo (side -1) gira +spread; direito, -spread
    for (const p of D.toe) {
      const lx = side === -1 ? p[0] : -p[0];   // dedo direito é espelho do esquerdo
      const x = lx * Math.cos(ang) - p[1] * Math.sin(ang), y = lx * Math.sin(ang) + p[1] * Math.cos(ang);
      const wx = cx + pv + x, wy = y;
      const cand = rockY(wx) - wy;
      if (cand < best) best = cand;
    }
  }
  return best;
}

/* ----- cenário do plano 2: fundo desfocado do pôr do sol, rocha com líquen, poeira, grama seca na frente ----- */
function fundoMacro(t) {
  let s = `<rect x="-1200" y="-800" width="3400" height="3600" fill="url(#gBoke)"/>`;
  s += `<circle cx="900" cy="560" r="330" fill="url(#gHalo)"/><circle cx="900" cy="560" r="120" fill="#FFF3C8" opacity=".9" filter="url(#b12)"/>`;
  // serras desfocadas
  s += `<g filter="url(#fDesf)"><path d="${serraPath(serraPts(2, 930, 120, -1200, 2200, 60, 1), 2200)}" fill="#8A4F7A" opacity=".85"/><path d="${serraPath(serraPts(5, 1100, 150, -1200, 2200, 60, 1), 2200)}" fill="#5A3466" opacity=".9"/></g>`;
  // bolhas de bokeh
  for (let i = 0; i < 14; i++) s += `<circle cx="${f1(-100 + 1300 * hh(i, 3))}" cy="${f1(200 + 800 * hh(i, 4))}" r="${f1(26 + 60 * hh(i, 5))}" fill="${i % 2 ? '#FFD28A' : '#FFB070'}" opacity="${f1(.06 + .1 * hh(i, 6))}" filter="url(#b4)"/>`;
  return s;
}
function pernaFundo() {
  // a outra pata, bem desfocada, ao fundo à esquerda
  return `<g filter="url(#fDesf2)" opacity=".85"><path d="M-170 -200L-60 -200L-50 1130L-20 1180L-40 1230L-210 1230L-190 1170L-150 1130Z" fill="#2A1A18"/><path d="M-70 -200L-60 -200L-50 1130L-70 1130Z" fill="#FFB070" opacity=".55"/></g>`;
}
function rochaMacro(t) {
  const top = ROCK_TOP, lh = [...top.filter(p => p[0] <= 540), [540, 2500], [-500, 2500]], rh = [...top.filter(p => p[0] >= 540), [1580, 2500], [540, 2500]];
  const idL = nid('rkL'), idR = nid('rkR'), idT = nid('rkT');
  def(`<clipPath id="${idL}"><path d="${pathPoly(lh)}"/></clipPath><clipPath id="${idR}"><path d="${pathPoly(rh)}"/></clipPath><clipPath id="${idT}"><path d="${pathPoly([...top, [1580, 2500], [-500, 2500]])}"/></clipPath>`);
  let s = `<path d="${pathPoly(lh)}" fill="url(#gRockL)"/><path d="${pathPoly(rh)}" fill="url(#gRockR)"/>`;
  // relevo (turbulência iluminada) por cima, em "soft-light": dá a rugosidade de granito sem ficar chapado
  s += `<rect x="-500" y="1180" width="2100" height="760" fill="#888" filter="url(#fRocha)" clip-path="url(#${idT})" style="mix-blend-mode:multiply" opacity=".9"/>`;
  const R = mulberry(909);
  for (const [id, x0, x1, claro] of [[idL, -500, 540, false], [idR, 540, 1580, true]]) {
    s += `<g clip-path="url(#${id})">`;
    for (let i = 0; i < 18; i++) { const x = lerp(x0, x1, R()), y = rockY(x) + 30 + R() * 420; s += `<path d="M${f1(x)} ${f1(y)}l${f1(-26 + 52 * R())} ${f1(30 + 80 * R())}l${f1(-26 + 52 * R())} ${f1(30 + 80 * R())}" stroke="#0A0610" stroke-width="${f1(1.2 + 2 * R())}" fill="none" opacity=".5"/>`; }
    for (let i = 0; i < 46; i++) { const x = lerp(x0, x1, R()), y = rockY(x) + 16 + R() * 340, r = 4 + 16 * R(); s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(r * .55)}" fill="${R() < .55 ? '#E08A2B' : '#B8C98A'}" opacity="${f1(.16 + .26 * R())}"/>`; }
    for (let i = 0; i < 200; i++) { const x = lerp(x0, x1, R()), y = rockY(x) + 8 + R() * 560; s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(.7 + 1.8 * R())}" fill="${R() < .5 ? '#FFE0B8' : '#0E0714'}" opacity="${f1(.1 + .2 * R())}"/>`; }
    s += `</g>`;
  }
  const rim = 'M' + top.filter(p => p[0] >= 400 && p[0] <= 1100).map(rpt).join('L');
  s += `<path d="${rim}" stroke="#FFC878" stroke-width="12" fill="none" opacity=".4" filter="url(#b4)"/><path d="${rim}" stroke="#FFE9BE" stroke-width="3" fill="none" opacity=".9"/>`;
  return s;
}
/* poeira que sobe quando o casco pousa/aperta: bolinhas desfocadas que sobem e se abrem */
function poeiraMacro(L, t0, xs, dur = 1.4) {
  const u = (L - t0) / dur; if (u < 0 || u > 1) return '';
  let s = '';
  for (const x0 of xs) for (let i = 0; i < 6; i++) {
    const h = hh(i + x0, 31), dx = (h - .5) * 160 * u + (x0 > 540 ? 40 : -40) * u, y = rockY(x0) - 14 - 120 * u * (.4 + h * .8), r = 16 + 46 * u * (.5 + h);
    s += `<ellipse cx="${f1(x0 + dx)}" cy="${f1(y)}" rx="${f1(r * 1.3)}" ry="${f1(r * .8)}" fill="${i % 2 ? '#F0C9A6' : '#D7A890'}" opacity="${f1(.38 * (1 - u) * (1 - u))}" filter="url(#b12)"/>`;
  }
  return s;
}
function gramaFrente(t) {
  let s = '';
  for (let i = 0; i < 36; i++) { const x = -260 + 1700 * hh(i, 81), h = 260 + 380 * hh(i, 82), sw = 18 * Math.sin(t * 1.2 + i), side = x < 540 ? -1 : 1; s += `<path d="M${f1(x)} 2200Q${f1(x + sw * .4)} ${f1(2200 - h * .6)} ${f1(x + sw + side * 40 * hh(i, 83))} ${f1(2200 - h)}" stroke="${i % 3 ? '#E0B070' : '#8F6A3A'}" stroke-width="${f1(8 + 10 * hh(i, 84))}" fill="none" stroke-linecap="round" opacity=".75"/>`; }
  return s;
}

/* =====================================================================================
   PLANO 3 — CORTE LATERAL DO CASCO: parede dura, sola/talão macios que se moldam aos relevos da rocha (focinho para a direita)
   Referencial: origem no nível do chão sob a ponta (x para o dedo/direita, y para baixo).
   ===================================================================================== */
const bumpR = x => {
  const g = (c, a, w) => a * Math.exp(-(((x - c) / w) ** 2));
  const edge = smooth((Math.abs(x) - 250) / 90);               // sob a parede o terreno é plano (a parede apoia)
  return (1 - edge) * (g(-190, -16, 34) + g(-60, -10, 26) + g(80, -17, 30) + g(205, -8, 22) + g(-120, 11, 28) + g(10, 13, 30) + g(150, 9, 24) + 3 * Math.sin(x * .09));
};
function padBottom(p) {                                         // contorno inferior da sola: min(rocha, sola livre que desce com a pressão)
  const pts = [];
  for (let x = 352; x >= -338; x -= 6) { const free = -20 + 15 * Math.pow(x / 340, 2) + p * 30; pts.push([x, Math.min(bumpR(x), free)]); }
  return pts;
}
const CAP_TOP = [[-322, -150], [-300, -250], [-232, -304], [-100, -322], [60, -330], [172, -340]];
const CAP_DORS = [[172, -340], [262, -250], [330, -140], [386, -40], [404, 0]];
const DORS_LINE = rdense([[150, -352], [262, -250], [330, -140], [386, -40], [406, 4]], false, 8);
let CUTFUR = null;
function corteCasco(t, p, o = {}) {
  const { hiDura = 0, hiMacia = 0 } = o;
  const id = nid('cw');
  let s = '';
  // ---- rocha (palco): relevo escuro-quente com a superfície bumpR ----
  const rk = []; for (let x = -1400; x <= 1400; x += 8) rk.push([x, bumpR(x)]);
  const rockPoly = [...rk, [1400, 900], [-1400, 900]];
  const idr = nid('rk'); def(`<clipPath id="${idr}"><path d="${pathPoly(rockPoly)}"/></clipPath>`);
  s += `<path d="${pathPoly(rockPoly)}" fill="url(#gRockCorte)"/><rect x="-1400" y="-40" width="2800" height="940" fill="#888" filter="url(#fRocha)" clip-path="url(#${idr})" style="mix-blend-mode:multiply" opacity=".95"/>`;
  s += `<path d="M${rk.map(rpt).join('L')}" stroke="#FFD9A8" stroke-width="3.4" fill="none" opacity=".9"/>`;
  // ---- contorno da cápsula do casco (parte de cima fixa; embaixo = parede + sola deformável) ----
  const top = rdense([...CAP_TOP, ...CAP_DORS.slice(1)], false, 8);
  const pb = padBottom(p).filter(q => q[0] <= 336 && q[0] >= -332);
  const outline = [...top, [372, 1], [340, 1], ...pb, [-326, -50]];
  def(`<clipPath id="${id}"><path d="${pathPoly(outline)}"/></clipPath>`);
  // pelo/pele da perna acima (entra na cápsula pela coroa)
  if (!CUTFUR) {
    const leg = tubo([[70, -330], [-10, -600], [-130, -900]], [150, 150, 150], [150, 150, 150], 8);
    CUTFUR = { leg, fur: pelo(leg, { n: 900, cl: 3, len: [14, 26], w: [2.2, 3.6], fluxo: () => 1.4, pal: P_LEGD, semente: 131, sun: [.9, -.3], Dmax: 60, amb: .38, gain: .5, jit: .8, rimCor: '#FFC27A', rimD: 22, rimP: .5, filtro: (x, y) => distBorda(leg, x, y) < 40 }) };
  }
  // perna cortada: tecido (tendões/músculo), pele escura com pelo na borda e o osso P2 no centro
  const idl = nid('lg'); def(`<clipPath id="${idl}"><path d="${pathPoly(CUTFUR.leg)}"/></clipPath>`);
  s += `<path d="${pathPoly(CUTFUR.leg)}" fill="url(#gCorteLeg)"/>`;
  s += `<g clip-path="url(#${idl})"><path d="${pathPoly(CUTFUR.leg)}" fill="none" stroke="#2A1A14" stroke-width="44"/><path d="M${rpt([-20, -300])}L${rpt([-150, -900])}" stroke="#D9A89A" stroke-width="230" opacity=".25" filter="url(#b12)"/></g>`;
  s += CUTFUR.fur;
  s += `<path d="M18 -352L-100 -900" stroke="#EADFC8" stroke-width="104" stroke-linecap="round" opacity=".95"/><path d="M40 -352L-80 -900" stroke="#FFF7E8" stroke-width="18" stroke-linecap="round" opacity=".45"/><ellipse cx="18" cy="-350" rx="62" ry="40" fill="#F4E9D2" stroke="#9A8460" stroke-width="3"/>`;
  // ---- interior da cápsula ----
  s += `<g clip-path="url(#${id})">`;
  s += `<path d="${pathPoly(outline)}" fill="url(#gCoxim)"/>`;
  // sola + talão (macios): região abaixo da curva de cima, até o contorno deformável
  const padTop = rdense([[340, -62], [250, -84], [100, -96], [-60, -106], [-190, -146], [-290, -214], [-338, -170]], false, 6);
  const padPoly = [...padTop, ...pb.slice().reverse().filter(q => q[0] >= -332 && q[0] <= 336).reverse().slice().reverse()];
  const padShape = [...padTop.slice().reverse(), ...pb];            // do talão (esq.) até a ponta (dir.) por cima; volta por baixo
  const padClosed = [...padTop, ...pb.filter(q => q[0] >= -338)];
  s += `<path d="${pathPoly([...padTop, [-340, 40], [372, 40]])}" fill="url(#gSola)"/>`;
  // osso (falange distal) paralelo à parede
  s += `<path d="${pathPoly(poly2d([[150, -304], [236, -206], [300, -104], [340, -34], [250, -46], [150, -72], [40, -112], [-30, -192], [-20, -272], [50, -308]], true, 5))}" fill="url(#gOsso)" stroke="#8A7458" stroke-width="3"/>`;
  s += `<path d="M30 -300Q120 -330 160 -300" stroke="#C9B896" stroke-width="3" fill="none" opacity=".6"/>`;
  // parede dura: dois traços grossos recortados pela cápsula + fibras paralelas à superfície
  s += `<path d="M${DORS_LINE.map(rpt).join('L')}" stroke="url(#gParede)" stroke-width="150" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  s += `<path d="M410 2L296 2" stroke="#150F0D" stroke-width="64" stroke-linecap="round" fill="none"/>`;
  const nrm = [-.822, .569];
  for (let i = 0; i < 12; i++) { const off = 4 + i * 4.2; s += `<path d="M${DORS_LINE.map(q => rpt([q[0] + nrm[0] * off, q[1] + nrm[1] * off])).join('L')}" stroke="${i % 3 ? '#6A5A4E' : '#080505'}" stroke-width="${f1(1.1 + hh(i, 4))}" fill="none" opacity="${f1(.3 + .25 * hh(i, 5))}"/>`; }
  // sombras internas suaves nas bordas
  s += `<path d="${pathPoly(outline)}" fill="none" stroke="#5A2A20" stroke-width="22" opacity=".25" filter="url(#b12)"/>`;
  s += `</g>`;
  // contorno e luz de recorte
  s += `<path d="${pathPoly(outline)}" fill="none" stroke="#1A0E0A" stroke-width="5" stroke-linejoin="round"/>`;
  s += `<path d="M${top.map(rpt).join('L')}" stroke="#FFE3B4" stroke-width="2.6" fill="none" opacity=".6" transform="translate(2,-2)"/>`;
  // coroa (banda clara macia no encontro pele-parede)
  s += `<path d="M150 -352Q190 -372 206 -330L176 -322Q150 -330 150 -352Z" fill="#E2CDA8" stroke="#6A5238" stroke-width="2"/>`;
  // realces para a narração
  if (hiDura > .01) s += `<g clip-path="url(#${id})" opacity="${f1(hiDura)}"><path d="M${DORS_LINE.map(rpt).join('L')}" stroke="#FFB36B" stroke-width="150" stroke-linecap="round" fill="none" opacity=".55" filter="url(#b4)"/></g><path d="M${top.slice(6).map(rpt).join('L')}" stroke="#FFD08A" stroke-width="8" fill="none" opacity="${f1(.9 * hiDura)}" filter="url(#b4)"/>`;
  if (hiMacia > .01) s += `<g clip-path="url(#${id})" opacity="${f1(hiMacia)}"><path d="${pathPoly([...padTop, [-340, 40], [372, 40]])}" fill="#FF9AA8" opacity=".55" filter="url(#b4)"/></g><path d="M${pb.map(rpt).join('L')}" stroke="#FFB0BC" stroke-width="12" fill="none" opacity="${f1(.9 * hiMacia)}" filter="url(#b4)"/>`;
  return s;
}
EXTRA += `<linearGradient id="gCorteLeg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B8705E"/><stop offset=".5" stop-color="#D08C78"/><stop offset="1" stop-color="#A85E52"/></linearGradient>
<linearGradient id="gRockCorte" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B87850"/><stop offset=".5" stop-color="#7A4C48"/><stop offset="1" stop-color="#3A2438"/></linearGradient>
<linearGradient id="gCoxim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2DDA4"/><stop offset="1" stop-color="#E4BC7C"/></linearGradient>
<linearGradient id="gOsso" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6EEDC"/><stop offset="1" stop-color="#C9B896"/></linearGradient>
<linearGradient id="gSola" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E8A89A"/><stop offset=".6" stop-color="#D98A80"/><stop offset="1" stop-color="#B8685E"/></linearGradient>
<linearGradient id="gParede" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3A2E28"/><stop offset=".5" stop-color="#1F1715"/><stop offset="1" stop-color="#0E0909"/></linearGradient>
<radialGradient id="gFundoCorte" cx=".5" cy=".38" r=".8"><stop offset="0" stop-color="#4A3052"/><stop offset=".55" stop-color="#241830"/><stop offset="1" stop-color="#0C0812"/></radialGradient>`;

/* =====================================================================================
   PLANO 4 — MICROSCÓPIO (falsa cor ciano, estilo MEV): feixe de tubinhos de queratina.
   Nível A: corte longitudinal (tubos paralelos, em diagonal)  ->  Nível B: corte transversal (feixe de círculos)  ->  um tubo
   com lamelas concêntricas e filamentos. A barra de escala e a ampliação seguem o zoom (1 unidade = 1,5 µm; ilustrativo).
   ===================================================================================== */
const UM_POR_UN = 1.5;
EXTRA += `<filter id="fMatriz" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.05 0.03" numOctaves="4" seed="21" result="n"/><feDiffuseLighting in="n" surfaceScale="6" diffuseConstant="1.1" lighting-color="#9FEFE8"><feDistantLight azimuth="40" elevation="45"/></feDiffuseLighting></filter>
<radialGradient id="gMicroBg" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#0F5560"/><stop offset=".7" stop-color="#083A44"/><stop offset="1" stop-color="#031820"/></radialGradient>
<radialGradient id="gLume" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#021218"/><stop offset="1" stop-color="#010A0E"/></radialGradient>`;
let MICRO = null;
function microData() {
  if (MICRO) return MICRO;
  const R = mulberry(2024), D = { A: [], B: [] };
  // nível A: tubos na vertical local (a camada inteira gira para a diagonal)
  for (let i = -70; i <= 70; i++) {
    const x = i * 30 + (R() - .5) * 14, w = 15 + 11 * R(), ph = R() * 6.28, am = 3 + 6 * R();
    D.A.push({ x, w, ph, am, claro: R() });
  }
  // nível B: grade com jitter, raios variados; o tubo 0 (mais perto do centro) é o alvo do mergulho final
  let k = 0;
  for (let gy = -9; gy <= 9; gy++) for (let gx = -7; gx <= 7; gx++) {
    const x = gx * 68 + (gy % 2 ? 34 : 0) + (R() - .5) * 18, y = gy * 62 + (R() - .5) * 18, r = 21 + 10 * R();
    D.B.push({ x, y, r, rings: 4 + Math.floor(5 * R()), ph: R() * 6.28, id: k++ });
  }
  D.B.sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y));
  MICRO = D;
  return D;
}
function microA(z) {
  const D = microData();
  let s = `<rect x="-4500" y="-4500" width="9000" height="9000" fill="url(#gMicroBg)"/>`;
  s += `<rect x="-4500" y="-4500" width="9000" height="9000" fill="#888" filter="url(#fMatriz)" style="mix-blend-mode:multiply" opacity=".55"/>`;
  for (const t of D.A) {
    const pts = []; for (let y = -3600; y <= 3600; y += 300) pts.push([t.x + t.am * Math.sin(y * .004 + t.ph), y]);
    const d = 'M' + pts.map(rpt).join('L');
    s += `<path d="${d}" stroke="#04222A" stroke-width="${f1(t.w + 10)}" fill="none" opacity=".8"/><path d="${d}" stroke="#4FD0CC" stroke-width="${f1(t.w + 4)}" fill="none" opacity="${f1(.5 + .3 * t.claro)}"/><path d="${d}" stroke="url(#gLume)" stroke-width="${f1(t.w * .55)}" fill="none"/><path d="${d}" stroke="#C8FFF8" stroke-width="${f1(Math.max(1, t.w * .08))}" fill="none" opacity=".75" transform="translate(${f1(-t.w * .36)},0)"/>`;
  }
  return s;
}
function tuboCorte(t, detalhe) {
  let s = `<circle cx="${f1(t.x)}" cy="${f1(t.y)}" r="${f1(t.r * 1.42)}" fill="#0B3F48" opacity=".9"/>`;      // halo de matriz densa em volta
  s += `<circle cx="${f1(t.x)}" cy="${f1(t.y)}" r="${f1(t.r)}" fill="#5CD8D2" stroke="#04222A" stroke-width="${f1(t.r * .12)}"/>`;
  for (let k = 1; k <= t.rings; k++) { const rr = t.r * (1 - .78 * k / (t.rings + 1)); s += `<circle cx="${f1(t.x)}" cy="${f1(t.y)}" r="${f1(rr)}" fill="none" stroke="${k % 2 ? '#2A8F96' : '#A8F2EC'}" stroke-width="${f1(Math.max(.4, t.r * .045))}" opacity=".85"/>`; }
  s += `<circle cx="${f1(t.x)}" cy="${f1(t.y)}" r="${f1(t.r * .26)}" fill="url(#gLume)"/><circle cx="${f1(t.x - t.r * .3)}" cy="${f1(t.y - t.r * .32)}" r="${f1(t.r * .12)}" fill="#E8FFFC" opacity=".6"/>`;
  if (detalhe) {                                                                                           // filamentos radiais de queratina (só no tubo alvo)
    for (let i = 0; i < 70; i++) { const a = i / 70 * 6.2832 + hh(i, 2) * .05, r0 = t.r * (.3 + .1 * hh(i, 3)), r1 = t.r * (.9 + .08 * hh(i, 4)); s += `<path d="M${f1(t.x + Math.cos(a) * r0)} ${f1(t.y + Math.sin(a) * r0)}Q${f1(t.x + Math.cos(a + .08) * (r0 + r1) / 2)} ${f1(t.y + Math.sin(a + .08) * (r0 + r1) / 2)} ${f1(t.x + Math.cos(a) * r1)} ${f1(t.y + Math.sin(a) * r1)}" stroke="${i % 3 ? '#E8FFFC' : '#1B6F78'}" stroke-width="${f1(t.r * .012)}" fill="none" opacity=".45"/>`; }
  }
  return s;
}
function microB(z, detalheK) {
  const D = microData();
  let s = `<rect x="-1200" y="-1200" width="2400" height="2400" fill="url(#gMicroBg)"/>`;
  s += `<rect x="-1200" y="-1200" width="2400" height="2400" fill="#888" filter="url(#fMatriz)" style="mix-blend-mode:multiply" opacity=".6"/>`;
  D.B.forEach((t, i) => { s += tuboCorte(t, i === 0 && detalheK > .01); });
  return s;
}
/* moldura do microscópio: máscara circular, anel, graduação, HUD com ampliação, barra de escala e a marca HRYZ */
function hudMicro(t, z, k, rot) {
  const Rr = 500 * k;
  let s = `<path d="M0 0H1080V1920H0Z M${540 - Rr} 960a${Rr} ${Rr} 0 1 0 ${2 * Rr} 0a${Rr} ${Rr} 0 1 0 ${-2 * Rr} 0Z" fill="#02070A" fill-rule="evenodd"/>`;
  s += `<circle cx="540" cy="960" r="${f1(Rr)}" fill="none" stroke="#6FE8E0" stroke-width="5" opacity=".9"/><circle cx="540" cy="960" r="${f1(Rr + 16)}" fill="none" stroke="#6FE8E0" stroke-width="1.6" opacity=".4"/>`;
  for (let i = 0; i < 72; i++) { const a = i / 72 * 6.2832 + rot * .0174, l = i % 6 ? 10 : 22; s += `<path d="M${f1(540 + Math.cos(a) * (Rr + 22))} ${f1(960 + Math.sin(a) * (Rr + 22))}L${f1(540 + Math.cos(a) * (Rr + 22 + l))} ${f1(960 + Math.sin(a) * (Rr + 22 + l))}" stroke="#6FE8E0" stroke-width="2" opacity="${f1(.6 * k)}"/>`; }
  s += `<path d="M520 960H560M540 940V980" stroke="#9FFFF6" stroke-width="2" opacity=".5"/><circle cx="540" cy="960" r="64" fill="none" stroke="#9FFFF6" stroke-width="1.4" opacity=".28"/>`;
  // ampliação e escala
  const mag = Math.round(160 * z), raw = 150 / z * UM_POR_UN, pot = Math.pow(10, Math.floor(Math.log10(raw))), nice = [1, 2, 5, 10].map(m => m * pot).filter(v => v <= raw).pop(), barPx = nice / UM_POR_UN * z;
  const lab = nice >= 1000 ? `${nice / 1000} mm` : `${nice} µm`;
  s += `<g opacity="${f1(k)}" font-size="40" fill="#8FFFF4" style="letter-spacing:2px"><text x="64" y="132">MEV · 10 kV</text><text x="64" y="184" fill="#C8FFFA">×${mag}</text>`;
  s += `<path d="M64 1790h${f1(barPx)}M64 1776v28M${f1(64 + barPx)} 1776v28" stroke="#C8FFFA" stroke-width="5"/><text x="64" y="1850">${lab}</text>`;
  s += `<g transform="translate(1016,1830)"><circle r="20" fill="none" stroke="#6FE8E0" stroke-width="3"/><circle r="9" fill="#6FE8E0"/><text x="-34" y="14" text-anchor="end" font-size="30" fill="#8FFFF4">HRYZ ANIMATION</text></g></g>`;
  return s;
}
