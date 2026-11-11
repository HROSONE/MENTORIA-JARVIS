// Exporta a agenda de efeitos (explosões, mísseis, aviões, rastros) para eventos.json, usada pelo script de som para sincronizar tudo com a imagem: node exportar_eventos.js
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const VID = path.resolve(__dirname, '..');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 270, height: 480 } });
  p.on('pageerror', e => console.log('ERRO:', e.message));
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, r => { const rel = r.request().url().match(/three@0\.160\.0\/(.*)/)[1]; r.fulfill({ path: path.join(VID, 'node_modules/three', rel), contentType: 'application/javascript' }); });
  await p.goto('http://127.0.0.1:8777/sono_militar/index.html?w=270&h=480');
  await p.waitForFunction(() => window.__ready, null, { timeout: 240000 });
  const fx = await p.evaluate(() => { const f = window.__S.fx; return { eventos: f.eventos, misseis: f.misseis, avioes: f.avioes, rastros: f.rastros }; });
  fs.writeFileSync(path.join(__dirname, 'eventos.json'), JSON.stringify(fx, null, 1));
  console.log('eventos.json:', fx.eventos.length, 'explosões,', fx.misseis.length, 'mísseis,', fx.avioes.length, 'aviões,', fx.rastros.length, 'rastros');
  await b.close();
})();
