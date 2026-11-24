// Folha de design do REX de perfil: node folha_rex.js saida.png
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const src = fs.readFileSync(path.join(__dirname, 'rex.js'), 'utf8');
(async () => {
  const saida = process.argv[2];
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1600, height: 1200 } })).newPage();
  await p.setContent('<html><body style="margin:0"></body></html>');
  const svg = await p.evaluate(s => eval(s + `;(() => {
    const corpo = rexLado({ t: 0.3, olho: [0.3, 0.2] });
    const perto = rexLado({ idBase: 500, t: 0.3, olho: [-0.2, 1], boca: 0.35, sobrancelha: -0.6, suor: 1, pescoco: 8, cabeca: 14, bracoCa: { ombro: -40, cotovelo: -30, dedos: 1 }, bracoLa: { ombro: -30, cotovelo: -20, dedos: 1 } });
    return \`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200"><defs>\${DEFS_REX}</defs>
      <rect width="1600" height="1200" fill="#BFE3F2"/><rect y="760" width="1600" height="440" fill="#D7C38A"/>
      <g transform="translate(830,780) scale(0.9)">\${corpo.svg}</g>
      <rect x="1040" y="20" width="540" height="560" fill="#BFE3F2" stroke="#333" stroke-width="3"/>
      <g transform="translate(1040,20)"><svg width="540" height="560" viewBox="330 -720 540 560">\${perto.svg}</svg></g></svg>\`;
  })()`), src);
  await p.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await p.screenshot({ path: saida }); await b.close(); console.log('ok', saida);
})();
