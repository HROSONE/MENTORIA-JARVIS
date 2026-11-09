const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const [w, nw, fps] = process.argv.slice(2).map(Number); const NM = process.env.NM, FR = process.env.FR;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.log('ERR:', e.message));
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, r => { const rel = r.request().url().match(/three@0\.160\.0\/(.*)/)[1]; r.fulfill({ path: path.join(NM, 'three', rel), contentType: 'application/javascript' }); });
  await p.goto('http://localhost:8766/svg/terminal/terminal3d.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
  const total = await p.evaluate(() => window.__total); const N = Math.round(total * fps); const st = await p.$('#stage');
  for (let i = w; i < N; i += nw) { const fp = `${FR}/f${String(i).padStart(5, '0')}.jpg`; if (fs.existsSync(fp)) continue; await p.evaluate(t => window.__seek(t), i / fps); await st.screenshot({ path: fp, type: 'jpeg', quality: 93, timeout: 120000 }); if (i % 120 === w) console.log(w, i, '/', N); }
  await b.close(); console.log('fim', w);
})();
