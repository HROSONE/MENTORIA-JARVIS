const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  p.on('console', m => console.log('console:', m.text()));
  p.on('pageerror', e => console.log('ERR:', e.message)); p.on('console', m => { const t=m.text(); if(!t.includes('ERR_FAILED')) console.log('C:', t.slice(0,300)); });
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, (r) => {
    const rel = r.request().url().match(/three@0\.160\.0\/(.*)/)[1];
    r.fulfill({ path: path.join(__dirname, 'node_modules/three', rel), contentType: 'application/javascript' });
  });
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto('file://' + path.join(__dirname, (process.env.PAGE || 'mosca.html')) + '?hideui&still' + (process.env.QS || ''));
  await p.waitForFunction(() => window.__ready, null, { timeout: +(process.env.TO || 240000) });
  const times = process.argv.slice(2).map(Number);
  for (const t of times) {
    await p.evaluate(t => window.__seek(t), t);
    await p.waitForTimeout(100);
    await p.screenshot({ timeout: 120000, path: `${process.env.OUT || 'shots'}/t${t}.png` });
  }
  await b.close();
})();
