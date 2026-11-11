// Exporta os tempos dos planos para planos.json (usado pelo script de som): node exportar_planos.js
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const VID = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 270, height: 480 } });
  p.on('pageerror', e => console.log('ERRO:', e.message));
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, r => { const rel = r.request().url().match(/three@0\.160\.0\/(.*)/)[1]; r.fulfill({ path: path.join(VID, 'node_modules/three', rel), contentType: 'application/javascript' }); });
  await p.goto('http://127.0.0.1:8777/elevador/index.html?w=270&h=480');
  await p.waitForFunction(() => window.__ready, null, { timeout: 240000 });
  const planos = await p.evaluate(() => window.__planos), total = await p.evaluate(() => window.__total);
  fs.writeFileSync(path.join(__dirname, 'planos.json'), JSON.stringify({ total, planos: planos.map(([id, t0, dur]) => ({ id, t0, dur })) }, null, 1));
  console.log('planos.json:', planos.length, 'planos,', total.toFixed(2), 's');
  await b.close();
})();
