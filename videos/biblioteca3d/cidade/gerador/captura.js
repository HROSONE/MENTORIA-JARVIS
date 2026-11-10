// Fotografa uma página do kit com Chromium/SwiftShader (mesmo método de ../../../shot.js).
// Uso:  node captura.js "catalogo.html?cat=ruas&still" saida.png [largura altura]
// Pré-requisitos: `npm install` em videos/ (three@0.160.0) e um servidor HTTP em videos/:  python3 -m http.server 8777
const { chromium } = require('playwright');
const path = require('path');
const VID = path.resolve(__dirname, '../../..');
const BASE = process.env.BASE || 'http://127.0.0.1:8777/biblioteca3d/cidade/';
(async () => {
  const [, , url, out, w = 1600, h = 900] = process.argv;
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  p.on('pageerror', e => console.log('ERRO:', e.message));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !t.includes('ERR_FAILED')) console.log('console:', t.slice(0, 300)); });
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, r => {
    const rel = r.request().url().match(/three@0\.160\.0\/(.*)/)[1];
    r.fulfill({ path: path.join(VID, 'node_modules/three', rel), contentType: 'application/javascript' });
  });
  await p.goto(BASE + url);
  await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await p.waitForTimeout(300);
  await p.screenshot({ path: out });
  await b.close();
})();
