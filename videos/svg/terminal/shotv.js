const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const [outdir, ...ts] = process.argv.slice(2); const NM = process.env.NM;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('ERR:', e.message, (e.stack || '').split('\n').slice(0, 4).join(' | '))); p.on('console', m => { if (m.type() === 'error' || /ERR|falhou/.test(m.text())) console.log('C:', m.text().slice(0, 300)); });
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, r => { const rel = r.request().url().match(/three@0\.160\.0\/(.*)/)[1]; r.fulfill({ path: path.join(NM, 'three', rel), contentType: 'application/javascript' }); });
  await p.goto('http://localhost:8766/svg/terminal/terminal3d.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 180000 });
  const st = await p.$('#stage');
  for (const t of ts) { try { const a = Date.now(); await p.evaluate(t => window.__seek(+t), t); await st.screenshot({ path: `${outdir}/t${t}.jpg`, type: 'jpeg', quality: 85 }); process.stdout.write(`${t}:${Date.now() - a} `); } catch (e) { console.log('t', t, e.message.slice(0, 500)); } }
  await b.close();
})();
