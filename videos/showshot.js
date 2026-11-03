const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 540, height: 720 } });
  p.on('pageerror', e => console.log('ERR:', e.message)); p.on('console', m => { if (/rror/.test(m.text())) console.log('C:', m.text().slice(0, 200)); });
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, r => r.fulfill({ path: path.join(__dirname, 'node_modules/three', r.request().url().match(/three@0\.160\.0\/(.*)/)[1]) }));
  await p.route(/assets\.local\/(.*)/, r => r.fulfill({ path: path.join(__dirname, 'assets', decodeURIComponent(r.request().url().match(/assets\.local\/(.*)/)[1])), headers: { 'access-control-allow-origin': '*' } }));
  await p.goto('file://' + path.join(__dirname, 'assets/show.html'), { timeout: 300000 });
  await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
  for (const [file, anim, t, yaw, elev, out] of JSON.parse(process.argv[2])) {
    try { const res = await p.evaluate(a => window.show(...a), [file, anim, t, yaw, elev]); fs.writeFileSync('assets/shots/' + out + '.png', Buffer.from(res.data.split(',')[1], 'base64')); console.log(out, JSON.stringify(res.names)); }
    catch (e) { console.log('FAIL', out, e.message.slice(0, 200)); }
  }
  await b.close();
})();
