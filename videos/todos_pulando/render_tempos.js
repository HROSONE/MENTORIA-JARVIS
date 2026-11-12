// Renderiza quadros específicos com a mesma rota do vídeo final (window.__frame): node render_tempos.js "t1,t2,..." pasta [largura altura]
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const VID = path.resolve(__dirname, '..');
(async () => {
  const [, , lista, pasta, w = 1080, h = 1920, subs = ''] = process.argv;
  fs.mkdirSync(pasta, { recursive: true });
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  p.on('pageerror', e => console.log('ERRO:', e.message));
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, r => { const rel = r.request().url().match(/three@0\.160\.0\/(.*)/)[1]; r.fulfill({ path: path.join(VID, 'node_modules/three', rel), contentType: 'application/javascript' }); });
  await p.goto('http://127.0.0.1:8777/todos_pulando/index.html?w=' + w + '&h=' + h + (process.env.EXTRA || ''));
  await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
  for (const t of lista.split(',').map(Number)) {
    const t0 = Date.now();
    const url = await p.evaluate(([x, s]) => window.__frame(x, s === '' ? { jpeg: 0.92 } : { jpeg: 0.92, subs: +s }), [t, subs]);
    fs.writeFileSync(path.join(pasta, 't' + t.toFixed(2) + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
    console.log(t, ((Date.now() - t0) / 1000).toFixed(2) + ' s');
  }
  await b.close();
})();
