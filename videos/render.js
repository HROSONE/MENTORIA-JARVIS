const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const [w, nw, fps] = process.argv.slice(2).map(Number);
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('ERR:', e.message));
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, (r) => {
    const rel = r.request().url().match(/three@0\.160\.0\/(.*)/)[1];
    r.fulfill({ path: path.join(__dirname, 'node_modules/three', rel), contentType: 'application/javascript' });
  });
  await p.goto('file://' + path.join(__dirname, (process.env.PAGE || 'mosca.html')) + '?hideui&still', { timeout: 600000, waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.__ready, null, { timeout: 600000 });
  await p.evaluate(() => { window.__render = true; return document.fonts.ready; });
  const total = await p.evaluate(() => window.__total);
  const N = Math.ceil(total * fps) + 15;
  const stage = await p.$('#stage');
  for (let i = w; i < N; i += nw) {
    const fp = `${process.env.FR || 'frames'}/f${String(i).padStart(5, '0')}.jpg`; if (fs.existsSync(fp)) continue;
    await p.evaluate(t => window.__seek(t), Math.min(i / fps, total));
    await stage.screenshot({ path: `${process.env.FR || 'frames'}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92, timeout: 120000 });
    if (i % 60 === w) console.log(w, i, '/', N, new Date().toISOString());
  }
  await b.close();
})();
