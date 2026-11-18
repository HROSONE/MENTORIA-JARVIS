// Ilustração 2D (1080×1920): por que a abelha morre ao ferroar e a vespa não. node ilustra.js saida.png
// Fatos: o ferrão da operária da abelha-europeia (Apis mellifera) tem farpas viradas para trás; na pele elástica de um mamífero ele prende,
// e quando a abelha puxa, o ferrão sai junto com o saco de veneno e parte do abdome (ela morre); o aparelho continua bombeando veneno.
// O ferrão da vespa é liso: entra, sai, e ela pode ferroar de novo. A rainha e as mamangavas também têm ferrão liso.
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const W = 1080, H = 1920, K = '#1C1410';
const r1 = x => Math.round(x * 10) / 10;
const F = 'font-family="Arial Black, Arial, sans-serif" font-weight="900"';

const DEFS = `
<linearGradient id="fundoA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4D6"/><stop offset="1" stop-color="#FBDF9C"/></linearGradient>
<linearGradient id="fundoV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E6F2F8"/><stop offset="1" stop-color="#BFDCEA"/></linearGradient>
<linearGradient id="pele" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6C3A4"/><stop offset=".18" stop-color="#EFAE8C"/><stop offset=".19" stop-color="#F7D2BF"/><stop offset="1" stop-color="#E9A98E"/></linearGradient>
<radialGradient id="abdA" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFD27A"/><stop offset=".6" stop-color="#E9A136"/><stop offset="1" stop-color="#B86E16"/></radialGradient>
<radialGradient id="toraxA" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#E2A65A"/><stop offset="1" stop-color="#8A5422"/></radialGradient>
<radialGradient id="abdV" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFF15A"/><stop offset=".6" stop-color="#F7CF12"/><stop offset="1" stop-color="#C79A00"/></radialGradient>
<linearGradient id="asa" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".85"/><stop offset="1" stop-color="#BFE3F2" stop-opacity=".45"/></linearGradient>
<radialGradient id="veneno" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFFBE0"/><stop offset=".7" stop-color="#F3E3A0"/><stop offset="1" stop-color="#D2B45C"/></radialGradient>
<pattern id="favo" width="60" height="104" patternUnits="userSpaceOnUse"><path d="M30,0 L60,17 L60,52 L30,69 L0,52 L0,17 Z M30,69 L30,104" fill="none" stroke="#E9C46A" stroke-width="3" opacity=".45"/></pattern>
<filter id="somb" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-opacity=".22"/></filter>
`;

/** perna articulada (3 segmentos) */
const perna = (pts, cor, w = 6) => `<path d="M${pts.map(p => p.join(',')).join(' L')}" fill="none" stroke="${K}" stroke-width="${w + 4}" stroke-linecap="round" stroke-linejoin="round"/><path d="M${pts.map(p => p.join(',')).join(' L')}" fill="none" stroke="${cor}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
function asa(x, y, ang, L, larg, veias = true) {
  return `<g transform="translate(${x},${y}) rotate(${ang})"><path d="M0,0 C${L * .3},${-larg} ${L * .9},${-larg * .9} ${L},${-larg * .2} C${L * .9},${larg * .35} ${L * .4},${larg * .3} 0,0 Z" fill="url(#asa)" stroke="#6A8A9A" stroke-width="3"/>` +
    (veias ? `<path d="M4,0 C${L * .3},${-larg * .45} ${L * .6},${-larg * .5} ${L * .92},${-larg * .25} M${L * .3},${-larg * .5} L${L * .45},0 M${L * .6},${-larg * .55} L${L * .7},${larg * .05}" fill="none" stroke="#7FA2B2" stroke-width="2" opacity=".8"/>` : '') + '</g>';
}

/** ABELHA de lado, olhando para a direita. Ponta do abdome em (-128, 8). o: { rasgada, morta, ferrao, asaFase } */
function abelha({ rasgada = false, morta = false, ferrao = true, asaFase = 0 } = {}) {
  let s = '';
  // pernas de trás (atrás do corpo), com cestinha de pólen
  s += perna([[20, 34], [-10, 70], [-40, 96]], '#4A3424') + `<ellipse cx="-12" cy="70" rx="12" ry="8" fill="#F5A623" stroke="${K}" stroke-width="3"/>`;
  s += asa(30, -40, -150 + asaFase, 150, 50) + asa(44, -42, -128 + asaFase * 0.7, 120, 40);
  // abdome com listras (rasgado: falta a ponta)
  const abd = 'M-10,-38 C-60,-56 -128,-40 -134,4 C-130,40 -70,58 -10,40 C10,24 10,-24 -10,-38 Z';
  s += `<clipPath id="cAbd${rasgada ? 'R' : ''}"><path d="${abd}"/>${''}</clipPath>`;
  let corpoAbd = `<path d="${abd}" fill="url(#abdA)"/>` + [-112, -80, -48].map(x => `<path d="M${x},-60 C${x - 14},-20 ${x - 14},20 ${x},62 L${x + 18},62 C${x + 4},20 ${x + 4},-20 ${x + 18},-60 Z" fill="#2A1A10"/>`).join('') +
    `<ellipse cx="-50" cy="-24" rx="40" ry="12" fill="#fff" opacity=".35"/>`;
  if (rasgada) {
    const corte = 'M-104,-60 L-96,-38 L-108,-22 L-94,-4 L-108,14 L-96,30 L-106,48 L-98,64 L20,64 L20,-60 Z';
    s += `<clipPath id="cRasg"><path d="${corte}"/></clipPath><g clip-path="url(#cRasg)"><g clip-path="url(#cAbdR)">${corpoAbd}</g><path d="${abd}" fill="none" stroke="${K}" stroke-width="5"/></g>`;
    s += `<path d="M-96,-38 L-108,-22 L-94,-4 L-108,14 L-96,30 L-104,46" fill="none" stroke="#8E2A1E" stroke-width="7" stroke-linejoin="round"/>` +
      `<path d="M-104,0 C-120,6 -126,22 -122,34 M-100,18 C-114,30 -112,44 -120,52" fill="none" stroke="#C96A4A" stroke-width="4" stroke-linecap="round"/>` +
      [[-116, 60], [-128, 74], [-110, 84]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#E7C34A" stroke="#8E6A10" stroke-width="2"/>`).join('');
  } else {
    s += `<g clip-path="url(#cAbd)">${corpoAbd}</g><path d="${abd}" fill="none" stroke="${K}" stroke-width="5"/>`;
    if (ferrao) s += `<path d="M-132,2 L-176,12 L-131,14 Z" fill="#3A2416" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"/>`;
  }
  // tórax peludo
  let pelos = ''; for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, x = 42 + Math.cos(a) * 46, y = -4 + Math.sin(a) * 44; pelos += `<path d="M${r1(x)},${r1(y)} l${r1(Math.cos(a) * 10)},${r1(Math.sin(a) * 10)}" stroke="#8A5422" stroke-width="4" stroke-linecap="round"/>`; }
  s += pelos + `<ellipse cx="42" cy="-4" rx="48" ry="45" fill="url(#toraxA)" stroke="${K}" stroke-width="5"/>`;
  for (let i = 0; i < 14; i++) s += `<path d="M${r1(20 + (i % 7) * 8)},${r1(-30 + Math.floor(i / 7) * 26)} l4,9" stroke="#C88B40" stroke-width="3" stroke-linecap="round"/>`;
  // pernas da frente
  s += perna([[56, 36], [70, 70], [58, 98]], '#4A3424') + perna([[36, 40], [30, 76], [10, 100]], '#4A3424');
  // cabeça, olho, antena, boca
  s += `<ellipse cx="112" cy="6" rx="36" ry="38" fill="#3E2C1E" stroke="${K}" stroke-width="5"/>`;
  s += morta ? `<path d="M104,-16 L128,8 M128,-16 L104,8" stroke="#FFF" stroke-width="7" stroke-linecap="round"/>`
    : `<ellipse cx="118" cy="-4" rx="17" ry="25" fill="#120C08"/><ellipse cx="112" cy="-14" rx="6" ry="8" fill="#fff" opacity=".9"/>`;
  s += `<path d="M124,-28 C132,-56 146,-70 168,-74" fill="none" stroke="${K}" stroke-width="6" stroke-linecap="round"/><path d="M114,-30 C116,-60 128,-80 150,-90" fill="none" stroke="${K}" stroke-width="5" stroke-linecap="round"/>`;
  s += `<path d="M134,30 L144,44 M126,36 L132,50" stroke="${K}" stroke-width="5" stroke-linecap="round"/>`;
  if (morta) s += `<path d="M90,-74 q10,-14 20,0 q10,-14 20,0" fill="none" stroke="#5A4A3A" stroke-width="4"/>`;
  return s;
}

/** VESPA de lado, olhando para a direita. Ponta do abdome em (-136, 10). */
function vespa({ asaFase = 0, brava = true } = {}) {
  let s = '';
  s += perna([[18, 22], [-14, 64], [-30, 106], [-46, 116]], '#F2C200', 5) + asa(26, -30, -168 + asaFase, 170, 26) + asa(36, -32, -150 + asaFase * 0.7, 140, 22);
  // abdome (pontudo), cintura fina
  const abd = 'M-18,-26 C-60,-44 -118,-30 -138,8 C-116,36 -60,40 -18,24 C-6,14 -6,-16 -18,-26 Z';
  s += `<clipPath id="cAbdV"><path d="${abd}"/></clipPath><g clip-path="url(#cAbdV)"><path d="${abd}" fill="url(#abdV)"/>` +
    [-118, -86, -54].map(x => `<path d="M${x},-50 L${x + 14},-50 L${x + 4},-14 L${x + 12},50 L${x - 4},50 C${x - 10},14 ${x - 10},-14 ${x},-50 Z" fill="#1A1A1A"/><path d="M${x + 22},-40 l-8,16 l-8,-16 Z" fill="#1A1A1A"/>`).join('') +
    `<ellipse cx="-60" cy="-18" rx="36" ry="8" fill="#fff" opacity=".4"/></g><path d="${abd}" fill="none" stroke="${K}" stroke-width="5"/>`;
  s += `<path d="M-136,8 L-180,14 L-136,16 Z" fill="#2A2A2A" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"/>`;
  s += `<path d="M-18,-8 C-6,-12 4,-12 10,-6 C4,2 -6,4 -18,2 Z" fill="#1A1A1A" stroke="${K}" stroke-width="3"/>`;          // cintura (pecíolo)
  // tórax preto com marcas amarelas
  s += `<ellipse cx="36" cy="-6" rx="40" ry="32" fill="#1E1E1E" stroke="${K}" stroke-width="5"/><path d="M14,-30 C30,-38 50,-36 62,-28" fill="none" stroke="#F7CF12" stroke-width="7" stroke-linecap="round"/><ellipse cx="44" cy="10" rx="9" ry="6" fill="#F7CF12"/><ellipse cx="20" cy="6" rx="7" ry="5" fill="#F7CF12"/>`;
  s += perna([[50, 22], [68, 60], [58, 100], [66, 112]], '#F2C200', 5) + perna([[32, 24], [26, 64], [6, 102], [-4, 110]], '#F2C200', 5);
  // cabeça: rosto amarelo, olho em meia-lua, mandíbulas
  s += `<ellipse cx="100" cy="4" rx="32" ry="34" fill="#F7CF12" stroke="${K}" stroke-width="5"/><path d="M84,-28 C108,-36 122,-16 118,10 C114,26 102,30 96,24 C108,8 104,-14 84,-28 Z" fill="#1A1A1A"/>`;
  s += `<path d="M100,-8 C92,-4 90,4 96,10" fill="none" stroke="#1A1A1A" stroke-width="4"/><path d="M120,26 L136,34 L124,40 Z M110,32 L120,46 L106,44 Z" fill="#B88A00" stroke="${K}" stroke-width="3"/>`;
  if (brava) s += `<path d="M86,-36 L118,-24" stroke="${K}" stroke-width="7" stroke-linecap="round"/>`;
  s += `<path d="M110,-26 C118,-56 132,-72 156,-80" fill="none" stroke="${K}" stroke-width="5" stroke-linecap="round"/><path d="M100,-28 C102,-60 112,-84 132,-96" fill="none" stroke="${K}" stroke-width="5" stroke-linecap="round"/>`;
  return s;
}

/** coloca um inseto (desenho local) com a ponta do ferrão em (x,y), girado ang graus, escala esc */
const por = (svg, x, y, ang, esc, ponta) => `<g transform="translate(${x},${y}) rotate(${ang}) scale(${esc}) translate(${-ponta[0]},${-ponta[1]})" filter="url(#somb)">${svg}</g>`;

function pele(x0, x1, y, h = 150) {
  let s = `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${h}" rx="18" fill="url(#pele)" stroke="${K}" stroke-width="5"/>`;
  for (let i = 0; i < 9; i++) s += `<path d="M${x0 + 40 + i * (x1 - x0 - 80) / 8},${y + 50} q12,24 0,50" fill="none" stroke="#D8907A" stroke-width="3" opacity=".6"/>`;
  return s + `<path d="M${x0 + 10},${y + 4} L${x1 - 10},${y + 4}" stroke="#FBE0D2" stroke-width="5" opacity=".8"/>`;
}
/** ferrão farpado (desenho grande): ponta em (0,0), corpo para cima-esquerda ao longo de -x */
function ferraoFarpado(L = 300, esc = 1, comSaco = false, pulsa = 1) {
  let s = `<path d="M0,0 L${-L},-16 L${-L},16 Z" fill="#5A3A22" stroke="${K}" stroke-width="4" stroke-linejoin="round"/>`;
  for (let i = 0; i < 9; i++) { const x = -26 - i * (L - 60) / 8, h = 4 + i * 1.3; s += `<path d="M${x},${-h} l-22,${-14} l4,${12} Z M${x},${h} l-22,${14} l4,${-12} Z" fill="#5A3A22" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"/>`; }
  if (comSaco) s += `<g transform="translate(${-L - 50},0) scale(${pulsa})"><ellipse cx="0" cy="0" rx="64" ry="50" fill="url(#veneno)" stroke="${K}" stroke-width="4"/><path d="M-40,-20 C-10,-34 20,-30 44,-10 M-44,10 C-10,26 24,22 44,8" fill="none" stroke="#C7A24A" stroke-width="3"/></g>`;
  return `<g transform="scale(${esc})">${s}</g>`;
}
function ferraoLiso(L = 300, esc = 1) {
  return `<g transform="scale(${esc})"><path d="M0,0 C${-L * .3},-10 ${-L * .7},-15 ${-L},-15 L${-L},15 C${-L * .7},15 ${-L * .3},10 0,0 Z" fill="#3A3A3A" stroke="${K}" stroke-width="4" stroke-linejoin="round"/><path d="M-20,-3 L${-L + 10},-9" stroke="#9A9A9A" stroke-width="4" stroke-linecap="round"/></g>`;
}
/** círculo de lupa com conteúdo, ligado a um ponto */
function lupa(cx, cy, r, alvo, conteudo, rotulo) {
  return `<path d="M${cx},${cy} L${alvo[0]},${alvo[1]}" stroke="${K}" stroke-width="4" stroke-dasharray="10 8"/>` +
    `<clipPath id="lp${cx}${cy}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><circle cx="${cx}" cy="${cy}" r="${r + 10}" fill="#fff" stroke="${K}" stroke-width="6" filter="url(#somb)"/>` +
    `<g clip-path="url(#lp${cx}${cy})">${conteudo}</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${K}" stroke-width="5"/><circle cx="${alvo[0]}" cy="${alvo[1]}" r="12" fill="none" stroke="${K}" stroke-width="4"/>` +
    `<text x="${cx}" y="${cy - r - 26}" text-anchor="middle" ${F} font-size="34" fill="${K}" stroke="#fff" stroke-width="8" paint-order="stroke">${rotulo}</text>`;
}
const etiqueta = (x, y, txt, cor, tam = 40) => `<text x="${x}" y="${y}" text-anchor="middle" ${F} font-size="${tam}" fill="${cor}" stroke="#fff" stroke-width="10" paint-order="stroke">${txt}</text>`;
const numero = (x, y, n, cor) => `<circle cx="${x}" cy="${y}" r="30" fill="${cor}" stroke="${K}" stroke-width="5"/><text x="${x}" y="${y + 14}" text-anchor="middle" ${F} font-size="40" fill="#fff">${n}</text>`;
const seta = (d, cor = K) => `<path d="${d}" fill="none" stroke="${cor}" stroke-width="6" stroke-dasharray="14 10" stroke-linecap="round"/>`;

function svg() {
  let s = `<rect width="${W}" height="${H}" fill="#FFFBF2"/>`;
  s += `<text x="540" y="104" text-anchor="middle" ${F} font-size="76" fill="${K}">ABELHA × VESPA</text>` +
    `<text x="540" y="164" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="38" fill="#5A4A3A">quem morre depois de ferroar?</text>`;
  const lupaFerrao = (cx, cy, f) => `<rect x="${cx - 130}" y="${cy - 130}" width="260" height="260" fill="#F7D2BF"/><path d="M${cx - 130},${cy - 40} L${cx + 130},${cy - 40}" stroke="#EFAE8C" stroke-width="10"/><g transform="translate(${cx - 95},${cy + 10}) rotate(180)">${f}</g>`;
  // ===================== ABELHA =====================
  const yA = 200, pA = yA + 580;
  s += `<rect x="24" y="${yA}" width="${W - 48}" height="810" rx="36" fill="url(#fundoA)" stroke="${K}" stroke-width="6"/><rect x="24" y="${yA}" width="${W - 48}" height="810" rx="36" fill="url(#favo)"/>`;
  s += `<text x="70" y="${yA + 78}" ${F} font-size="58" fill="#B86E16" stroke="#fff" stroke-width="10" paint-order="stroke">ABELHA</text><text x="338" y="${yA + 76}" font-family="Arial, sans-serif" font-weight="700" font-size="30" fill="#6A4A1A">(operária da abelha-europeia)</text>`;
  s += pele(60, 1020, pA, 120);
  // 1: ferroando
  s += numero(470, yA + 170, 1, '#E9A136');
  s += por(abelha({}), 330, pA + 34, -70, 1.0, [-176, 12]);
  // 2: o ferrão ficou na pele com o saco de veneno; a abelha voa embora rasgada e morre
  s += numero(620, yA + 170, 2, '#E9A136');
  const fx = 820;
  s += `<g transform="translate(${fx},${pA + 70}) rotate(84)">${ferraoFarpado(100, 1, true, 1.0)}</g>`;
  s += `<g transform="translate(${fx - 14},${pA - 150})">` + [0, 1, 2].map(i => `<path d="M${-34 - i * 16},0 a${34 + i * 16},${34 + i * 16} 0 0 1 ${68 + i * 32},0" fill="none" stroke="#C7463C" stroke-width="5" opacity="${0.8 - i * 0.22}"/>`).join('') + `</g>`;
  s += etiqueta(600, pA - 70, 'o ferrão fica', '#8E2A1E', 32) + etiqueta(600, pA - 34, 'e bombeia veneno', '#8E2A1E', 32);
  s += por(abelha({ rasgada: true, morta: true, asaFase: 18 }), 720, yA + 330, -12, 0.8, [-128, 8]);
  s += etiqueta(830, yA + 120, 'perde parte do corpo', '#8E2A1E', 32) + etiqueta(830, yA + 156, 'e morre', '#8E2A1E', 32);
  s += lupa(170, yA + 330, 100, [328, pA + 22], lupaFerrao(170, yA + 330, ferraoFarpado(230, 0.85)), 'farpas = anzol');
  s += etiqueta(540, pA + 185, 'Só consegue ferroar 1 vez', '#B86E16', 50);
  // ===================== VESPA =====================
  const yV = 1030, pV = yV + 580;
  s += `<rect x="24" y="${yV}" width="${W - 48}" height="810" rx="36" fill="url(#fundoV)" stroke="${K}" stroke-width="6"/>`;
  s += `<text x="70" y="${yV + 78}" ${F} font-size="58" fill="#1A5A7A" stroke="#fff" stroke-width="10" paint-order="stroke">VESPA</text>`;
  s += pele(60, 1020, pV, 120);
  s += numero(470, yV + 170, 1, '#2E86AB');
  s += por(vespa({}), 330, pV + 34, -70, 1.0, [-180, 14]);
  s += numero(620, yV + 170, 2, '#2E86AB');
  [560, 660, 760].forEach(x => s += `<circle cx="${x}" cy="${pV + 12}" r="28" fill="#E0605A" opacity=".25"/><circle cx="${x}" cy="${pV + 12}" r="13" fill="#E0605A" stroke="#A3332B" stroke-width="3"/>`);
  s += seta(`M560,${pV - 30} C580,${pV - 150} 640,${pV - 150} 660,${pV - 30} M660,${pV - 30} C680,${pV - 150} 740,${pV - 150} 760,${pV - 30} M760,${pV - 30} C780,${pV - 150} 830,${pV - 170} 850,${pV - 90}`, '#2E86AB');
  s += por(vespa({ asaFase: 14 }), 880, pV - 70, -105, 0.85, [-180, 14]);
  s += etiqueta(800, yV + 110, 'o ferrão sai inteiro', '#1A5A7A', 32) + etiqueta(800, yV + 146, 'e ela ferroa de novo', '#1A5A7A', 32);
  s += lupa(170, yV + 330, 100, [328, pV + 22], lupaFerrao(170, yV + 330, ferraoLiso(230, 0.85)), 'ferrão liso');
  s += etiqueta(540, pV + 185, 'Ferroa quantas vezes quiser', '#1A5A7A', 48);
  s += `<text x="540" y="1878" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="26" fill="#5A4A3A">Só a operária da abelha-europeia morre. A rainha e as mamangavas</text>` +
    `<text x="540" y="1910" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="26" fill="#5A4A3A">têm ferrão liso e também ferroam mais de uma vez.</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${DEFS}</defs>${s}</svg>`;
}
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
  await p.setContent(`<html><body style="margin:0">${svg()}</body></html>`);
  await p.screenshot({ path: process.argv[2] || path.join(__dirname, 'ilustra.png') }); await b.close(); console.log('ok');
})();
