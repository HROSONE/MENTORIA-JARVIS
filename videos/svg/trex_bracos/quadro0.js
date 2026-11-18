// Gera o quadro 0 (teste de arte): node quadro0.js saida.png [t]
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const arte = fs.readFileSync(path.join(__dirname, '_arte.js'), 'utf8');
(async () => {
  const [saida, tStr] = process.argv.slice(2), t = +(tStr || 0.4);
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1080, height: 1920 } })).newPage();
  await p.setContent('<html><body style="margin:0;background:#000"><div id="c"></div></body></html>');
  const svg = await p.evaluate(([src, t]) => {
    eval(src + `; window.__f = (t) => {
      const k = (Math.sin(t * 9) + 1) / 2;                          // bate (tenta) palma: as mãos vão e voltam e não se tocam
      const R = rexFrente({ x: 540, y: 1300, esc: 1.0, t, olhar: [0, 1], vesgo: 1, sobrancelha: -0.6, suor: 1, boca: 0.08,
        bracoE: { a1: 110 - 12 * k, a2: 10 - 25 * k }, bracoD: { a1: 70 + 12 * k, a2: 170 + 25 * k } });
      return '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs>' + DEFS + '</defs>' + fundo(t) +
        cica(-60, 1500, 1.1, t, '#2E6A28') + cica(1150, 1560, 1.2, t, '#2E6A28', 3) + R.svg +
        riscos(R.maoE[0], R.maoE[1], 3, Math.PI * 1.1, 50) + riscos(R.maoD[0], R.maoD[1], 3, -Math.PI * 0.1, 50) +
        '<rect width="1080" height="1920" fill="url(#vig)"/></svg>';
    }`);
    return window.__f(t);
  }, [arte, t]);
  await p.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await p.screenshot({ path: saida }); await b.close(); console.log('ok', saida);
})();
