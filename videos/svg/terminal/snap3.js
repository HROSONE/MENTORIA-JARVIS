const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const [outdir, ...ns] = process.argv.slice(2); const NM = process.env.NM;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('ERR:', e.message)); p.on('console', m => console.log('C:', m.text().slice(0, 300)));
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, r => { const rel = r.request().url().match(/three@0\.160\.0\/(.*)/)[1]; r.fulfill({ path: path.join(NM, 'three', rel), contentType: 'application/javascript' }); });
  await p.goto('http://localhost:8766/svg/terminal/board3d.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  if (process.env.PRE) await p.evaluate(process.env.PRE);
  for (const n of ns) { try { const t = Date.now(); await p.evaluate(n => window.SHOW(+n), n); await p.waitForTimeout(200); await p.screenshot({ path: `${outdir}/s${String(n).padStart(2, '0')}.png` }); console.log('ok', n, Date.now() - t); } catch (e) { console.log('shot', n, e.message.slice(0, 400)); } }
  await b.close();
})();
