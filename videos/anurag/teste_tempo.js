// Mede o tempo por quadro: node teste_tempo.js "teste_desempenho.html?aa=1&sombra=1" largura altura saida.png
const { chromium } = require('playwright');
const path = require('path');
const VID = path.resolve(__dirname, '..');
(async () => {
  const [, , url, w = 1080, h = 1920, saida = '/tmp/teste.png'] = process.argv;
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  p.on('pageerror', e => console.log('ERRO:', e.message));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !t.includes('ERR_FAILED')) console.log('console:', t.slice(0, 300)); });
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, r => {
    const rel = r.request().url().match(/three@0\.160\.0\/(.*)/)[1];
    r.fulfill({ path: path.join(VID, 'node_modules/three', rel), contentType: 'application/javascript' });
  });
  const t0 = Date.now();
  await p.goto('http://127.0.0.1:8777/anurag/' + url);
  await p.waitForFunction(() => window.__ready, null, { timeout: 180000 });
  console.log('carga: %d ms', Date.now() - t0);
  for (let k = 0; k < 4; k++) {
    const t1 = Date.now();
    await p.evaluate(t => window.__setTime(t), 0.1 * k);
    const t2 = Date.now();
    await p.screenshot({ path: k === 3 ? saida : '/tmp/_descarte.png' });
    console.log('quadro %d: render %d ms, captura %d ms', k, t2 - t1, Date.now() - t2);
  }
  await b.close();
})();
