// Ilustração 2D (1080×1920): por que a abelha morre ao ferroar e a vespa-mandarina não. node ilustra.js saida.png
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const { W, H, K, F, r1, DEFS, abelha, mandarina, por, pele, ferraoFarpado, ferraoLiso, lupa, etiqueta, numero, seta } = require('./desenhos.js');
function svg() {
  let s = `<rect width="${W}" height="${H}" fill="#FFFBF2"/>`;
  s += `<text x="540" y="92" text-anchor="middle" ${F} font-size="64" fill="${K}">ABELHA × VESPA-MANDARINA</text>` +
    `<text x="540" y="146" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="36" fill="#5A4A3A">quem morre depois de ferroar?</text>`;
  const lupaFerrao = (cx, cy, f) => `<rect x="${cx - 130}" y="${cy - 130}" width="260" height="260" fill="#F7D2BF"/><path d="M${cx - 130},${cy - 40} L${cx + 130},${cy - 40}" stroke="#EFAE8C" stroke-width="10"/><g transform="translate(${cx - 95},${cy + 10}) rotate(180)">${f}</g>`;
  // ===================== ABELHA =====================
  const yA = 180, pA = yA + 555;
  s += `<rect x="24" y="${yA}" width="${W - 48}" height="770" rx="36" fill="url(#fundoA)" stroke="${K}" stroke-width="6"/><rect x="24" y="${yA}" width="${W - 48}" height="770" rx="36" fill="url(#favo)"/>`;
  s += `<text x="70" y="${yA + 78}" ${F} font-size="58" fill="#B86E16" stroke="#fff" stroke-width="10" paint-order="stroke">ABELHA</text><text x="338" y="${yA + 76}" font-family="Arial, sans-serif" font-weight="700" font-size="30" fill="#6A4A1A">(operária da abelha-europeia)</text>`;
  s += pele(60, 1020, pA, 120);
  s += numero(470, yA + 170, 1, '#E9A136');
  s += por(abelha({}), 330, pA + 34, -70, 1.0, [-176, 12]);
  s += numero(620, yA + 170, 2, '#E9A136');
  const fx = 820;
  s += `<g transform="translate(${fx},${pA + 70}) rotate(84)">${ferraoFarpado(100, 1, true, 1.0)}</g>`;
  s += `<g transform="translate(${fx - 14},${pA - 150})">` + [0, 1, 2].map(i => `<path d="M${-34 - i * 16},0 a${34 + i * 16},${34 + i * 16} 0 0 1 ${68 + i * 32},0" fill="none" stroke="#C7463C" stroke-width="5" opacity="${0.8 - i * 0.22}"/>`).join('') + `</g>`;
  s += etiqueta(600, pA - 70, 'o ferrão fica', '#8E2A1E', 32) + etiqueta(600, pA - 34, 'e bombeia veneno', '#8E2A1E', 32);
  s += por(abelha({ rasgada: true, morta: true, asaFase: 18 }), 720, yA + 330, -12, 0.8, [-128, 8]);
  s += etiqueta(830, yA + 120, 'perde parte do corpo', '#8E2A1E', 32) + etiqueta(830, yA + 156, 'e morre', '#8E2A1E', 32);
  s += lupa(170, yA + 330, 100, [328, pA + 22], lupaFerrao(170, yA + 330, ferraoFarpado(230, 0.85)), 'farpas = anzol');
  s += etiqueta(540, pA + 165, 'Só consegue ferroar 1 vez', '#B86E16', 50);
  // ===================== VESPA-MANDARINA =====================
  const yV = 965, pV = yV + 555;
  s += `<rect x="24" y="${yV}" width="${W - 48}" height="770" rx="36" fill="url(#fundoV)" stroke="${K}" stroke-width="6"/>`;
  s += `<text x="70" y="${yV + 74}" ${F} font-size="50" fill="#8A3A0A" stroke="#fff" stroke-width="10" paint-order="stroke">VESPA-MANDARINA</text><text x="70" y="${yV + 116}" font-family="Arial, sans-serif" font-weight="700" font-size="28" fill="#6A3A1A">(Vespa mandarinia, a maior vespa do mundo)</text>`;
  s += pele(60, 1020, pV, 120);
  s += numero(470, yV + 190, 1, '#D57A0A');
  s += por(mandarina({}), 330, pV + 34, -70, 1.0, [-188, 16]);
  s += numero(610, yV + 190, 2, '#D57A0A');
  [560, 660, 760].forEach(x => s += `<circle cx="${x}" cy="${pV + 12}" r="30" fill="#E0605A" opacity=".25"/><circle cx="${x}" cy="${pV + 12}" r="14" fill="#E0605A" stroke="#A3332B" stroke-width="3"/>`);
  s += seta(`M560,${pV - 30} C580,${pV - 150} 640,${pV - 150} 660,${pV - 30} M660,${pV - 30} C680,${pV - 150} 740,${pV - 150} 760,${pV - 30} M760,${pV - 30} C780,${pV - 150} 830,${pV - 170} 850,${pV - 90}`, '#B86A0A');
  s += por(mandarina({ asaFase: 14 }), 890, pV - 70, -105, 0.82, [-188, 16]);
  s += etiqueta(855, yV + 166, 'o ferrão sai inteiro', '#8A3A0A', 30) + etiqueta(855, yV + 200, 'e ela ferroa de novo', '#8A3A0A', 30);
  s += lupa(170, yV + 330, 100, [328, pV + 22], lupaFerrao(170, yV + 330, ferraoLiso(230, 0.85)), 'ferrão liso');
  s += etiqueta(540, pV + 165, 'Ferroa quantas vezes quiser', '#8A3A0A', 48);
  // ===================== tamanho de verdade (proporção) =====================
  const yT = 1790;
  s += `<text x="60" y="${yT + 8}" ${F} font-size="28" fill="${K}">PROPORÇÃO:</text>`;
  s += por(abelha({}), 345, yT, 0, 0.09, [-176, 12]) + `<text x="360" y="${yT + 64}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="24" fill="#5A4A3A">abelha ~1,3 cm</text>`;
  s += por(mandarina({}), 600, yT - 4, 0, 0.30, [-188, 16]) + `<text x="660" y="${yT + 64}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="24" fill="#5A4A3A">vespa-mandarina até ~4,5 cm</text>`;
  s += `<text x="540" y="1890" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="22" fill="#5A4A3A">A vespa-mandarina tem ferrão de ~6 mm e injeta muito veneno a cada picada.</text>` +
    `<text x="540" y="1914" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="22" fill="#5A4A3A">Só a operária da abelha-europeia morre ao ferroar (a rainha não).</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${DEFS}</defs>${s}</svg>`;
}
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
  await p.setContent(`<html><body style="margin:0">${svg()}</body></html>`);
  await p.screenshot({ path: process.argv[2] || path.join(__dirname, 'ilustra.png') }); await b.close(); console.log('ok');
})();
