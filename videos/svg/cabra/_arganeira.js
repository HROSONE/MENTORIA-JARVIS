/* =====================================================================================
   PLANO 7 — ARGANEIRA (Marrocos): árvore baixa e retorcida, copa larga com folhas pequenas, frutos redondos, três cabras
   nos galhos (uma delas, de frente para a câmera no fim, come os frutos). Câmera: plano geral -> sobe e entra na copa.
   Mundo: chão em y=0 (a árvore ocupa x≈100–900, copa até y≈-950). Luz do pôr do sol vindo da direita (sol atrás da copa).
   ===================================================================================== */
const BASE_T = [520, -380, .8];
const SUN_S7 = { x: 790, y: -430, r: 150 };
const P_FOL = paleta(['#14281A', '#24462A', '#3F6E30', '#6E9A3E', '#B5CC62', '#EFE8A0'], 8);
const TRONCO = { pts: [[530, 30], [522, -140], [500, -262], [516, -336]], wa: [96, 74, 60, 54], wb: [92, 72, 60, 54] };
const GALHOS = [
  { pts: [[510, -300], [400, -352], [300, -378], [190, -430], [100, -540]], w: [46, 36, 30, 22, 12] },          // esquerda (trecho quase plano para a cabra A)
  { pts: [[524, -318], [620, -420], [700, -448], [770, -520], [800, -650]], w: [44, 34, 28, 20, 12] },          // direita (trecho plano para a cabra B)
  { pts: [[512, -330], [496, -470], [470, -610], [452, -740], [470, -770]], w: [38, 30, 26, 22, 18] },          // centro (leva à bifurcação da cabra C)
  { pts: [[452, -740], [540, -770], [620, -776], [700, -820]], w: [20, 18, 16, 10] },                           // plataforma da cabra C
  { pts: [[452, -740], [380, -790], [330, -860]], w: [18, 14, 9] },
  { pts: [[300, -392], [250, -520], [260, -640], [220, -720]], w: [22, 16, 12, 8] },
  { pts: [[700, -448], [690, -600], [740, -700]], w: [20, 15, 9] },
];
const CLUMPS = [[120, -560, 150], [250, -470, 120], [360, -440, 100], [200, -660, 140], [310, -720, 130], [430, -800, 150], [560, -880, 150], [690, -820, 140], [790, -700, 140], [850, -600, 120], [730, -540, 110], [620, -670, 120], [480, -650, 130], [380, -600, 110], [540, -540, 90], [700, -900, 110], [330, -820, 110], [450, -930, 100], [600, -960, 100], [250, -800, 100]];
const FRUTOS = [[310, -660], [352, -690], [430, -720], [560, -760], [640, -740], [706, -770], [770, -620], [808, -580], [180, -600], [240, -520], [690, -640], [600, -840], [520, -860], [460, -880], [370, -770], [660, -880], [750, -740], [150, -640], [400, -840], [620, -700]];
let ARGD = null;
function arganData() {
  if (ARGD) return ARGD;
  const R = mulberry(333), D = { folhas: [], galhos: [], tronco: tubo(TRONCO.pts, TRONCO.wa, TRONCO.wb, 10) };
  D.galhos = GALHOS.map(g => tubo(g.pts, g.w, g.w, 10));
  // folhas: elipses finas em tufos, claras do lado do sol (direita/cima)
  D.fol = [];
  for (const [cx, cy, r] of CLUMPS) {
    const blob = rdense(Array.from({ length: 10 }, (_, k) => { const an = k / 10 * 6.2832; return [cx + Math.cos(an) * r * (.82 + .16 * hh(k, cx)) * 1.12, cy + Math.sin(an) * r * (.78 + .16 * hh(k, cy)) * .8]; }), true, 5);
    let sFol = `<path d="${pathPoly(blob)}" fill="#1C3822"/><path d="${pathPoly(blob)}" fill="#2A4E2E" transform="translate(${f1(r * .06)},${f1(-r * .08)}) scale(.92)" transform-origin="${cx} ${cy}" opacity=".8"/>`;
    const n = Math.round(r * 1.5);
    for (let i = 0; i < n; i++) {
      const a = R() * 6.2832, d = r * Math.sqrt(R()), x = cx + Math.cos(a) * d * 1.15, y = cy + Math.sin(a) * d * .8, lum = clamp(.45 + .5 * ((x - cx) * .5 - (y - cy) * .8) / r + (R() - .5) * .5), k = Math.max(0, Math.min(P_FOL.length - 1, Math.round(lum * (P_FOL.length - 1))));
      sFol += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(7.5 + 4 * R())}" ry="${f1(3 + 1.6 * R())}" fill="${P_FOL[k]}" transform="rotate(${f1(R() * 180)} ${f1(x)} ${f1(y)})"/>`;
    }
    D.fol.push(sFol);
  }
  ARGD = D;
  return D;
}
function troncoSVG(t) {
  const D = arganData();
  let s = '';
  const casca = (poly, id) => { const idc = nid('cs'); def(`<clipPath id="${idc}"><path d="${pathPoly(poly)}"/></clipPath>`); return `<path d="${pathPoly(poly)}" fill="url(#gCasca)"/><g clip-path="url(#${idc})">` + Array.from({ length: 16 }, (_, i) => { const bb = bbox(poly), x = lerp(bb[0], bb[2], hh(i, id)), y = lerp(bb[1], bb[3], hh(i, id + 1)); return `<path d="M${f1(x)} ${f1(y)}q${f1(6 * (hh(i, 3) - .5))} 40 ${f1(10 * (hh(i, 4) - .5))} ${f1(70 + 60 * hh(i, 5))}" stroke="#1C0F0C" stroke-width="${f1(1.6 + 2.6 * hh(i, 6))}" fill="none" opacity=".5"/>`; }).join('') + `<path d="${pathPoly(poly)}" fill="none" stroke="#1C0F0C" stroke-width="16" opacity=".3" filter="url(#b4)"/></g><path d="${pathPoly(poly)}" fill="none" stroke="#120A08" stroke-width="3"/>`; };
  for (let i = 0; i < D.galhos.length; i++) s += casca(D.galhos[i], 20 + i * 3);
  s += casca(D.tronco, 11);
  // luz do sol na borda direita do tronco
  s += `<path d="M${TRONCO.pts.map((p, i) => rpt([p[0] + TRONCO.wb[i] - 6, p[1]])).join('L')}" stroke="#FFC27A" stroke-width="5" fill="none" opacity=".55" filter="url(#b4)"/>`;
  return s;
}
function frutosSVG(t, foco) {
  let s = '';
  FRUTOS.forEach(([x, y], i) => {
    const r = 9 + 5 * hh(i, 71), sw = Math.sin(t * 1.3 + i) * 2.2, col = i % 5 === 0 ? ['#F0DC6A', '#B89A2A'] : ['#CFE070', '#7FA02E'];
    s += `<g transform="translate(${f1(x + sw)},${f1(y + 1.2 * Math.cos(t * 1.1 + i))})"><path d="M0 ${f1(-r)}q2 -12 7 -16" stroke="#3A2A1A" stroke-width="2.4" fill="none"/><ellipse rx="${f1(r)}" ry="${f1(r * 1.1)}" fill="${col[1]}"/><ellipse cx="${f1(-r * .12)}" cy="${f1(-r * .12)}" rx="${f1(r * .86)}" ry="${f1(r * .94)}" fill="${col[0]}"/><ellipse cx="${f1(-r * .38)}" cy="${f1(-r * .45)}" rx="${f1(r * .22)}" ry="${f1(r * .3)}" fill="#fff" opacity=".75"/></g>`;
  });
  return s;
}
EXTRA += `<linearGradient id="gCasca" gradientUnits="userSpaceOnUse" x1="100" y1="0" x2="900" y2="0"><stop offset="0" stop-color="#3A2418"/><stop offset=".55" stop-color="#5A3A28"/><stop offset="1" stop-color="#9A6A44"/></linearGradient>
<linearGradient id="gSoloS7" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D88A52"/><stop offset=".25" stop-color="#9A5A44"/><stop offset="1" stop-color="#3A2230"/></linearGradient>`;
function colinasS7() {
  const cor = [['#E8A07E', '#F6B88A', -60, 34, 11], ['#C97A6E', '#E49A78', 20, 48, 12], ['#9A5A62', '#C2786A', 130, 70, 13]];
  return cor.map(([c0, c1, y0, amp, sd], i) => ({ p: [.05, .12, .26][i], svg: `<defs><linearGradient id="gCol${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${c1}"/></linearGradient></defs><path d="${serraPath(serraPts(sd, y0, amp, -1400, 1900, 40, 1), y0 + 900)}" fill="url(#gCol${i})"/><rect x="-1400" y="${y0 + 10}" width="3300" height="${amp * 4 + 120}" fill="url(#gNevoa)" opacity="${f1(.8 - i * .2)}"/>` }));
}
function soloS7(t) {
  const pts = []; for (let x = -1500; x <= 2000; x += 60) pts.push([x, 6 * Math.sin(x * .012) + 4 * Math.sin(x * .05)]);
  let s = `<path d="${pathPoly([...pts, [2000, 2600], [-1500, 2600]])}" fill="url(#gSoloS7)"/><path d="M${pts.map(rpt).join('L')}" stroke="#FFD59A" stroke-width="3" fill="none" opacity=".8"/>`;
  s += `<ellipse cx="330" cy="26" rx="520" ry="46" fill="#2A1228" opacity=".38" filter="url(#b30)"/>`;
  for (let i = 0; i < 14; i++) { const x = -500 + 1500 * hh(i, 25), r = 30 + 70 * hh(i, 26), y = 60 + 260 * hh(i, 27); s += `<path d="M${f1(x - r)} ${f1(y)}Q${f1(x - r * .6)} ${f1(y - r * .8)} ${f1(x)} ${f1(y - r)}Q${f1(x + r * .8)} ${f1(y - r * .7)} ${f1(x + r)} ${f1(y)}Z" fill="${i % 2 ? '#8A5048' : '#B07058'}"/><path d="M${f1(x - r * .7)} ${f1(y - r * .4)}Q${f1(x)} ${f1(y - r * 1.1)} ${f1(x + r * .5)} ${f1(y - r * .8)}" stroke="#FFD6A0" stroke-width="2.4" fill="none" opacity=".6"/>`; }
  for (let i = 0; i < 60; i++) { const x = -600 + 1800 * hh(i, 5), r = 6 + 20 * hh(i, 6), y = 10 + 40 * hh(i, 7); s += `<path d="M${f1(x - r)} ${f1(y)}Q${f1(x - r * .7)} ${f1(y - r)} ${f1(x)} ${f1(y - r * 1.1)}Q${f1(x + r)} ${f1(y - r * .6)} ${f1(x + r * 1.1)} ${f1(y)}Z" fill="${i % 2 ? '#7A4A44' : '#A86A52'}"/>`; }
  for (let i = 0; i < 80; i++) { const x = -600 + 1800 * hh(i, 15), h = 12 + 34 * hh(i, 16), sw = Math.sin(t * 1.3 + i) * 3; s += `<path d="M${f1(x)} 6Q${f1(x + sw * .5)} ${f1(6 - h * .6)} ${f1(x + sw)} ${f1(6 - h)}" stroke="${i % 3 ? '#D9A760' : '#8F6A3A'}" stroke-width="1.8" fill="none"/>`; }
  return s;
}
