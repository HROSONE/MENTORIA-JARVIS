// Fotografa quadros de teste: node render_teste.js "index.html?dbg=rua" saida.png [largura altura]   (usa window.__setTime com ?t=...)
const { chromium } = require('playwright');
const path = require('path');
const VID = path.resolve(__dirname, '..');
(async () => {
  const [, , url, saida = '/tmp/teste.png', w = 540, h = 960] = process.argv;
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  p.on('pageerror', e => console.log('ERRO:', e.message));
  p.on('console', m => { const t = m.text(); if (['error', 'warning'].includes(m.type()) && !t.includes('ERR_FAILED') && !t.includes('GPU stall')) console.log(m.type() + ':', t.slice(0, 400)); });
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, r => {
    const rel = r.request().url().match(/three@0\.160\.0\/(.*)/)[1];
    r.fulfill({ path: path.join(VID, 'node_modules/three', rel), contentType: 'application/javascript' });
  });
  const t0 = Date.now();
  await p.goto('http://127.0.0.1:8777/todos_pulando/' + url + (url.includes('?') ? '&' : '?') + 'w=' + w + '&h=' + h);
  await p.waitForFunction(() => window.__ready, null, { timeout: 240000 });
  console.log('carga %d ms', Date.now() - t0);
  await p.waitForTimeout(200);
  if (process.env.EVAL) console.log(JSON.stringify(await p.evaluate(process.env.EVAL)));
  await p.screenshot({ path: saida });
  await b.close();
})();
