const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 540, height: 960 } });
  p.on('pageerror', e => console.log('ERR:', e.message));
  p.on('console', m => { const t = m.text(); if (/error|Error/.test(t) && !t.includes('ERR_FAILED')) console.log('C:', t.slice(0, 300)); });
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, r => r.fulfill({ path: path.join(__dirname, 'node_modules/three', r.request().url().match(/three@0\.160\.0\/(.*)/)[1]), contentType: 'application/javascript' }));
  const page = process.env.PAGE || 'teen/viewer_src.html', W = process.env.W || 1080, H = process.env.H || 1920;
  await p.goto('file://' + path.join(__dirname, page) + `?still&w=${W}&h=${H}${process.env.QS || ''}`, { timeout: 300000, waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
  for (const v of process.argv.slice(2)) {
    const data = await p.evaluate(v => { window.__setView(v); return document.getElementById('c').toDataURL('image/png'); }, v);
    fs.writeFileSync(`${process.env.OUT || 'teen/shots'}/${v}.png`, Buffer.from(data.split(',')[1], 'base64'));
  }
  await b.close();
})();
