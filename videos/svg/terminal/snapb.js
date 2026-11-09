const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const [page, outdir, ...ns] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('ERR:', e.message)); p.on('console', m => console.log('C:', m.text().slice(0, 300)));
  await p.goto('file://' + path.resolve(page)); await p.waitForFunction(() => window.__ready);
  for (const n of ns) { try { await p.evaluate(n => window.SHOW(+n), n); await p.waitForTimeout(150); await p.screenshot({ path: `${outdir}/s${String(n).padStart(2, '0')}.png` }); } catch (e) { console.log('shot', n, e.message.slice(0, 300)); } }
  await b.close();
})();
