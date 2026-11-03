const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  p.on('pageerror', e => console.log('ERR:', e.message));
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, r => r.fulfill({ path: path.join(__dirname, 'node_modules/three', r.request().url().match(/three@0\.160\.0\/(.*)/)[1]), contentType: 'application/javascript' }));
  await p.goto('file://' + path.join(__dirname, 'stick/' + (process.env.SPAGE || 'stickman.html')) + `?still&w=${process.env.W || 1920}&h=${process.env.H || 1080}`, { timeout: 300000 });
  await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
  const shots = JSON.parse(process.argv[2]);
  for (const [name, t, cam] of shots) {
    const d = await p.evaluate(([t, cam]) => window.__frame(t, cam), [t, cam]);
    fs.writeFileSync(`stick/${name}.png`, Buffer.from(d.split(',')[1], 'base64'));
  }
  await b.close();
})();
