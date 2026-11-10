// Fotografa uma página do Corredor com Chromium/SwiftShader (Playwright). Dois modos:
//   foto:      node captura.js "corredor.html?still=1&clip=Correr&t=0.2" saida.png [largura altura]
//   sequência: node captura.js --anim "corredor.html?still=1&clip=Correr" pasta_saida N duracao_s [largura altura]
//              (chama window.__setTime(t) da página para N instantes de 0 até duracao_s e salva frame_000.png ...)
// Variáveis: BASE = URL da pasta do corredor (padrão http://127.0.0.1:8777/biblioteca3d/personagens/corredor/).
// Pré-requisitos: `npm install` em videos/ (three@0.160.0 e playwright) e um servidor HTTP na pasta videos/ (python3 -m http.server 8777).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const VID = path.resolve(__dirname, '../../../..');
const BASE = process.env.BASE || 'http://127.0.0.1:8777/biblioteca3d/personagens/corredor/';
(async () => {
  const args = process.argv.slice(2);
  const anim = args[0] === '--anim';
  if (anim) args.shift();
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  let w, h;
  if (anim) [, , , , w = 480, h = 540] = args; else [, , w = 1600, h = 900] = args;
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  p.on('pageerror', e => console.log('ERRO:', e.message));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !t.includes('ERR_FAILED')) console.log('console:', t.slice(0, 300)); });
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, r => {
    const rel = r.request().url().match(/three@0\.160\.0\/(.*)/)[1];
    r.fulfill({ path: path.join(VID, 'node_modules/three', rel), contentType: 'application/javascript' });
  });
  await p.goto(BASE + args[0]);
  await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
  await p.waitForTimeout(300);
  if (anim) {
    const [, dir, n, dur] = args;
    fs.mkdirSync(dir, { recursive: true });
    for (let k = 0; k < +n; k++) {
      await p.evaluate(t => window.__setTime(t), (k / +n) * +dur);
      await p.screenshot({ path: path.join(dir, 'frame_' + String(k).padStart(3, '0') + '.png') });
    }
  } else {
    await p.screenshot({ path: args[1] });
  }
  await b.close();
})();
