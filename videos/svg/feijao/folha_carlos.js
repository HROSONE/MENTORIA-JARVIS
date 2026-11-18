// Folha de design do Carlos (planta 0, 0,3, 0,6, 1): node folha_carlos.js saida.png
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const src = fs.readFileSync(path.join(__dirname, 'carlos.js'), 'utf8');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1600, height: 900 } })).newPage();
  await p.setContent('<html><body style="margin:0"></body></html>');
  const svg = await p.evaluate(s => eval(s + `;(() => {
    const L = [
      carlos({ x: 200, y: 860, esc: 1.0, idBase: 0, boca: 'sorriso', bracoE: { ombro: 8 }, bracoD: { ombro: 8 } }),
      carlos({ x: 600, y: 860, esc: 1.0, idBase: 300, planta: 0.3, olhos: 'arregalados', boca: 'o', sobr: 1, bracoE: { ombro: 20, cotovelo: 30 }, bracoD: { ombro: 40, cotovelo: 120 }, maoD: 'aponta' }),
      carlos({ x: 1000, y: 860, esc: 1.0, idBase: 600, planta: 0.65, olhos: 'meio', boca: 'reto', sobr: -0.5, bracoE: { ombro: 30 }, bracoD: { ombro: 30 } }),
      carlos({ x: 1400, y: 860, esc: 1.0, idBase: 900, planta: 1, olhos: 'arregalados', boca: 'grito', sobr: 1, raiz: 0.7, bracoE: { ombro: 120, cotovelo: 20 }, bracoD: { ombro: 120, cotovelo: 20 } }),
    ];
    return '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><defs>' + DEFS_C + '</defs><rect width="1600" height="900" fill="#CFE8F5"/><rect y="860" width="1600" height="40" fill="#C9B88E"/>' + L.map(c => c.svg).join('') + '</svg>';
  })()`), src);
  await p.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await p.screenshot({ path: process.argv[2] }); await b.close(); console.log('ok');
})();
