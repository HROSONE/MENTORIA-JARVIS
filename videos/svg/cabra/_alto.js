/* =====================================================================================
   PLANO 6 — "LÁ EM CIMA": o lobo no pé do paredão (não sobe), a câmera sobe pela rocha passando pelas cabras e pelo bode no
   pináculo; corte para o close da cabra lambendo o sal (crosta mineral branca na rocha).
   Mundo do paredão: y=0 é o pé; a escarpa sobe até y≈-1250. Lobo e cabras são os mesmos desenhos de pelo (LOD baixo).
   ===================================================================================== */
const BASE_A = [300, -300, 1.0];
const P_LOBO = paleta(['#1C1918', '#3A3433', '#6A625C', '#9E9488', '#D6C9B2'], 8);
const LEDGES = [{ x0: 250, x1: 650, y: -430 }, { x0: -170, x1: 270, y: -770 }, { x0: 300, x1: 770, y: -1070 }];
let LOBOD = null;
function loboData() {
  if (LOBOD) return LOBOD;
  const corpo = poly2d([[-250, -240], [-205, -282], [-120, -300], [-30, -306], [50, -310], [112, -314], [160, -324], [198, -338], [220, -330], [238, -306], [216, -276], [186, -240], [150, -204], [118, -172], [84, -144], [30, -132], [-60, -128], [-150, -132], [-226, -146], [-268, -190]], true, 6);
  const cab = poly2d([[-34, -26], [12, -42], [66, -44], [118, -40], [160, -26], [190, -8], [186, 10], [140, 16], [92, 26], [52, 44], [10, 50], [-30, 36], [-46, 8]], true, 6);
  const D = { corpo, cab };
  const fl = campoFluxo([[-100, -250, -1, .2], [-200, -220, -.9, .5], [100, -220, -.4, .9], [150, -350, -.7, .7], [0, -160, -.2, 1]]);
  D.corpoFur = pelo(corpo, { n: 1500, cl: 3, len: [13, 24], w: [2.2, 3.8], fluxo: fl, pal: P_LOBO, semente: 201, sun: SOL, Dmax: 90, amb: .46, gain: .42, jit: .7, rimCor: '#FFD28A', rimD: 16, rimP: .5 });
  D.cabFur = pelo(cab, { n: 420, cl: 3, len: [8, 14], w: [1.6, 2.8], fluxo: () => .35, pal: P_LOBO, semente: 202, sun: SOL, Dmax: 40, amb: .44, gain: .4, jit: .7, rimCor: '#FFD28A', rimD: 10, rimP: .5 });
  const legs = { nf: [[[70, -190], [60, -92], [64, 0]], [30, 18, 13]], ff: [[[30, -190], [20, -92], [30, 0]], [28, 16, 12]], nr: [[[-206, -214], [-244, -112], [-222, 0]], [56, 24, 13]], fr: [[[-170, -214], [-208, -112], [-190, 0]], [52, 22, 12]] };
  D.legs = {};
  for (const id in legs) { const [pts, w] = legs[id], poly = tubo(pts, w, w, 8); D.legs[id] = { poly, fur: pelo(poly, { n: 260, cl: 3, len: [10, 17], w: [1.8, 3], fluxo: () => 1.5, pal: P_LOBO, semente: 210 + id.length + id.charCodeAt(0), sun: SOL, Dmax: 30, amb: id[0] === 'f' && id[1] === 'f' || id === 'fr' ? .3 : .42, gain: .35, jit: .7, rimCor: id === 'nf' || id === 'nr' ? '#FFD28A' : null, rimD: 8, rimP: .45 }) }; }
  const tail = tubo([[-262, -236], [-312, -206], [-350, -126]], [20, 32, 14], [20, 32, 14], 8);
  D.tail = { poly: tail, fur: pelo(tail, { n: 380, cl: 3, len: [12, 22], w: [2, 3.4], fluxo: () => 1.9, pal: P_LOBO, semente: 220, sun: SOL, Dmax: 40, amb: .42, gain: .4, jit: .7, rimCor: '#FFD28A', rimD: 10, rimP: .45 }) };
  LOBOD = D;
  return D;
}
/* o lobo olhando para o alto (focinho levantado), com leve respiração; lunge: salto contra a parede e queda */
function lobo(t, lunge = 0, k = 1) {
  const D = loboData(), hp = Math.sin(t * 2.6) * 1.2 + 3 * lunge, cab = `<g transform="translate(212,-334) rotate(${f1(-20 - 12 * lunge + hp)})"><path d="${pathPoly(D.cab)}" fill="#6A625C"/>${D.cabFur}<path d="M118 -40L190 -8L186 10L140 16Z" fill="#241E1C" opacity=".85"/><ellipse cx="188" cy="-4" rx="8" ry="6" fill="#0A0706"/><g transform="translate(-6,-34)"><path d="M0 0L20 -70L46 -6Z" fill="#4A4340"/><path d="M12 -8L22 -52L36 -10Z" fill="#B89A88" opacity=".7"/></g><ellipse cx="78" cy="-22" rx="9" ry="6.5" fill="#E8B22A"/><ellipse cx="80" cy="-22" rx="3.4" ry="5" fill="#0A0706"/><circle cx="76" cy="-25" r="2" fill="#fff"/><path d="M162 -6Q172 2 184 0" stroke="#E8DCC4" stroke-width="2.4" fill="none" opacity="${f1(.6 * lunge + .2)}"/></g>`;
  const leg = id => `<g><path d="${pathPoly(D.legs[id].poly)}" fill="#3A3433"/>${D.legs[id].fur}<path d="M${id.endsWith('f') && id[0] === 'n' ? '36 0Q60 -14 86 0' : '-270 0Q-246 -14 -220 0'}Z" fill="#241E1C"/></g>`;
  return `<g opacity="${k}">` + leg('fr') + leg('ff') + `<g transform="rotate(${f1(8 * Math.sin(t * 3.1) + 14 * lunge)} -262 -236)"><path d="${pathPoly(D.tail.poly)}" fill="#4A4340"/>${D.tail.fur}</g>` +
    `<path d="${pathPoly(D.corpo)}" fill="url(#gLoboC)"/>${D.corpoFur}` + leg('nr') + leg('nf') + cab + `</g>`;
}
EXTRA += `<linearGradient id="gScree" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B8786A"/><stop offset=".18" stop-color="#7A4A56"/><stop offset="1" stop-color="#2A1828"/></linearGradient>
<linearGradient id="gLoboC" gradientUnits="userSpaceOnUse" x1="0" y1="-440" x2="0" y2="-130"><stop offset="0" stop-color="#8A8074"/><stop offset=".5" stop-color="#5A524C"/><stop offset="1" stop-color="#2E2826"/></linearGradient>
<linearGradient id="gParedao" gradientUnits="userSpaceOnUse" x1="-500" y1="0" x2="1100" y2="0"><stop offset="0" stop-color="#2A1A34"/><stop offset=".5" stop-color="#6A3C4A"/><stop offset="1" stop-color="#D88A58"/></linearGradient>
<linearGradient id="gSal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF6F0"/><stop offset=".6" stop-color="#F4DCD2"/><stop offset="1" stop-color="#D8B4AA"/></linearGradient>`;

/* ----- o paredão: rocha com relevo iluminado (retângulo só da janela visível), lajes (ledges), tufos, lascas ----- */
function paredao(t, cy) {
  const top = [[-800, -1340], [-420, -1296], [-200, -1306], [0, -1274], [180, -1284], [330, -1266], [440, -1262], [470, -1332], [770, -1332], [800, -1252], [900, -1286], [1300, -1246], [1500, -1250]];
  const poly = [...top, [1500, 900], [-800, 900]], id = nid('pd');
  def(`<clipPath id="${id}"><path d="${pathPoly(poly)}"/></clipPath>`);
  let s = `<path d="${pathPoly(poly)}" fill="url(#gParedao)"/>`;
  s += `<rect x="-800" y="${f1(cy - 1100)}" width="2300" height="2200" fill="#888" filter="url(#fRocha)" clip-path="url(#${id})" style="mix-blend-mode:multiply" opacity=".85"/>`;
  s += `<g clip-path="url(#${id})">`;
  const R = mulberry(515);
  for (let i = 0; i < 120; i++) { const x = -700 + 2100 * R(), y = -1300 + 2200 * R(), w = 40 + 160 * R(), h = 24 + 90 * R(), a = R() * 6.28, lit = x > 380; s += `<path d="M${f1(x)} ${f1(y)}l${f1(Math.cos(a) * w)} ${f1(Math.sin(a) * h)}l${f1(Math.cos(a + 2) * w * .8)} ${f1(Math.sin(a + 2) * h * .8)}Z" fill="${lit ? (R() < .5 ? '#FFC892' : '#6A3040') : (R() < .5 ? '#6A4A78' : '#150C20')}" opacity="${f1(.08 + .12 * R())}"/>`; }
  for (let i = 0; i < 46; i++) { const x = -700 + 2100 * R(), y = -1300 + 2150 * R(); s += `<path d="M${f1(x)} ${f1(y)}l${f1(-24 + 48 * R())} ${f1(40 + 100 * R())}l${f1(-24 + 48 * R())} ${f1(40 + 100 * R())}" stroke="#0A0610" stroke-width="${f1(1.4 + 2.4 * R())}" fill="none" opacity=".5"/>`; }
  for (let i = 0; i < 80; i++) { const x = -700 + 2100 * R(), y = -1300 + 2150 * R(), r = 5 + 20 * R(); s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(r * .55)}" fill="${R() < .55 ? '#E08A2B' : '#B8C98A'}" opacity="${f1(.14 + .22 * R())}"/>`; }
  s += `</g>`;
  s += `<path d="M${top.map(rpt).join('L')}" stroke="#FFD59A" stroke-width="3.4" fill="none" opacity=".8"/>`;
  // crosta de sal visível de longe (manchas brancas na rocha perto do 3º patamar)
  s += `<g opacity=".9"><path d="M786 -1118Q830 -1136 850 -1096Q856 -1056 818 -1044Q780 -1054 786 -1118Z" fill="url(#gSal)"/><path d="M812 -1106l10 -12l8 14z" fill="#fff"/></g>`;
  return s;
}
function lajes() {
  let s = '';
  for (const l of LEDGES) {
    const pts = [[l.x0 - 10, l.y + 34], [l.x0, l.y], [l.x1, l.y - 6], [l.x1 + 18, l.y + 30], [l.x1 - 26, l.y + 66], [l.x0 + 70, l.y + 76]];
    s += `<path d="${pathPoly(pts)}" fill="#3C2434"/><path d="M${pts.slice(1, 4).map(rpt).join('L')}" stroke="#FFD9A0" stroke-width="3" fill="none" opacity=".85"/><path d="${pathPoly([[l.x0, l.y], [l.x1, l.y - 6], [l.x1 + 8, l.y + 14], [l.x0 - 4, l.y + 20]])}" fill="#7A4A4A" opacity=".7"/>`;
    for (let i = 0; i < 18; i++) { const x = l.x0 + 20 + (l.x1 - l.x0 - 40) * hh(i, l.y), h = 8 + 16 * hh(i, l.y + 1); s += `<path d="M${f1(x)} ${l.y}q2 ${f1(-h * .6)} ${f1(4 * (hh(i, 3) - .5) * 3)} ${f1(-h)}" stroke="#D9A760" stroke-width="1.6" fill="none"/>`; }
  }
  return s;
}
function pePredregulho() {
  const pts = [[-800, 30], [-400, 14], [-120, 24], [200, 10], [520, 26], [900, 12], [1500, 30], [1500, 1600], [-800, 1600]];
  const idp = nid('pp'); def(`<clipPath id="${idp}"><path d="${pathPoly(pts)}"/></clipPath>`);
  let s = `<path d="${pathPoly(pts)}" fill="url(#gScree)"/><rect x="-800" y="0" width="2300" height="900" fill="#888" filter="url(#fRocha)" clip-path="url(#${idp})" style="mix-blend-mode:multiply" opacity=".9"/><path d="M${pts.slice(0, 7).map(rpt).join('L')}" stroke="#FFC888" stroke-width="3" fill="none" opacity=".8"/>`;
  for (let i = 0; i < 30; i++) { const x = -700 + 1900 * hh(i, 5), r = 8 + 26 * hh(i, 6); s += `<path d="M${f1(x - r)} 30Q${f1(x - r * .7)} ${f1(30 - r)} ${f1(x)} ${f1(26 - r * 1.1)}Q${f1(x + r)} ${f1(26 - r * .6)} ${f1(x + r * 1.1)} 30Z" fill="${i % 2 ? '#5A3A44' : '#3A2434'}"/>`; }
  return s;
}

/* ----- close do sal: macro-espaço (como o plano 2). A cabra de pé à esquerda, a parede à direita com a crosta de sal ----- */
function paredeSal(t) {
  const xw = 800, poly = [[xw, -900], [xw + 18, 200], [xw - 10, 700], [xw + 14, 1100], [xw - 6, 1700], [xw + 8, 2600], [1700, 2600], [1700, -900]], id = nid('ps');
  def(`<clipPath id="${id}"><path d="${pathPoly(poly)}"/></clipPath>`);
  let s = `<path d="${pathPoly(poly)}" fill="url(#gRockR)"/><rect x="${xw - 20}" y="-400" width="1000" height="2200" fill="#888" filter="url(#fRocha)" clip-path="url(#${id})" style="mix-blend-mode:multiply" opacity=".9"/>`;
  s += `<path d="M${poly.slice(0, 6).map(rpt).join('L')}" stroke="#FFE2B4" stroke-width="4" fill="none" opacity=".8"/>`;
  // crosta de sal: cristais facetados brancos/rosados com brilho
  const R = mulberry(77);
  let d = '';
  for (let i = 0; i < 46; i++) {
    const ang = R() * 6.28, rr = 150 * Math.sqrt(R()), cx = xw + 70 + Math.cos(ang) * rr * 1.1, cy = 770 + Math.sin(ang) * rr * 1.5, sz = 16 + 38 * R(), rot = R() * 6.28, n = 5 + Math.floor(R() * 2);
    let pts = []; for (let k = 0; k < n; k++) { const aa = rot + k / n * 6.2832, rd = sz * (.7 + .5 * R()); pts.push([cx + Math.cos(aa) * rd, cy + Math.sin(aa) * rd * .8]); }
    d += `<path d="${pathPoly(pts)}" fill="url(#gSal)" stroke="#C99C94" stroke-width="1.6" opacity="${f1(.7 + .3 * R())}"/><path d="M${rpt(pts[0])}L${f1(cx)} ${f1(cy)}L${rpt(pts[2])}" stroke="#fff" stroke-width="1.4" fill="none" opacity=".6"/>`;
  }
  s += `<g clip-path="url(#${id})">${d}`;
  for (let i = 0; i < 70; i++) { const a2 = R() * 6.28, rr = 150 * Math.sqrt(R()), x = xw + 60 + Math.cos(a2) * rr * 1.2, y = 770 + Math.sin(a2) * rr * 1.6, sz = 4 + 9 * R(), tw = .5 + .5 * Math.sin(t * 5 + i * 1.7); s += `<path d="M${f1(x)} ${f1(y - sz)}L${f1(x + sz * .6)} ${f1(y)}L${f1(x)} ${f1(y + sz)}L${f1(x - sz * .6)} ${f1(y)}Z" fill="#fff" opacity="${f1(.35 + .6 * tw)}"/>`; }
  s += `</g>`;
  return s;
}
