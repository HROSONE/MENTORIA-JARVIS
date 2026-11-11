// Renderiza o Short em quadros JPEG com vários navegadores em paralelo.
//   node render.js [--de N] [--ate N] [--trabalhadores K] [--saida pasta] [--largura 1080 --altura 1920] [--jpeg 0.92]
// Cada trabalhador abre a página e pega os quadros i = w, w+K, ... (pula os que já existem). Quadros: <saida>/f00000.jpg
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const VID = path.resolve(__dirname, '..');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const FPS = 30;
(async () => {
  const K = +arg('trabalhadores', 3), saida = arg('saida', path.join(__dirname, 'quadros')), larg = +arg('largura', 1080), alt = +arg('altura', 1920), jpeg = +arg('jpeg', 0.92);
  const pagina = arg('pagina', 'index.html');
  fs.mkdirSync(saida, { recursive: true });
  const probe = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const trabalho = async w => {
    const b = probe;
    const ctx = await b.newContext({ viewport: { width: larg, height: alt } });
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('ERRO[' + w + ']:', e.message));
    await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, r => {
      const rel = r.request().url().match(/three@0\.160\.0\/(.*)/)[1];
      r.fulfill({ path: path.join(VID, 'node_modules/three', rel), contentType: 'application/javascript' });
    });
    await p.goto('http://127.0.0.1:8777/elevador/' + pagina + '?w=' + larg + '&h=' + alt);
    await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
    const total = await p.evaluate(() => window.__total);
    const N = Math.round(total * FPS);
    const de = +arg('de', 0), ate = Math.min(+arg('ate', N - 1), N - 1);
    let feitos = 0;
    const t0 = Date.now();
    for (let i = de + w; i <= ate; i += K) {
      const f = path.join(saida, 'f' + String(i).padStart(5, '0') + '.jpg');
      if (fs.existsSync(f)) continue;
      const url = await p.evaluate(([t, j]) => window.__frame(t, { jpeg: j }), [i / FPS, jpeg]);
      fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
      feitos++;
      if (feitos % 30 === 0) console.log('[' + w + '] quadro', i, '/', ate, ((Date.now() - t0) / feitos / 1000).toFixed(2) + ' s/quadro');
    }
    await ctx.close();
  };
  await Promise.all(Array.from({ length: K }, (_, w) => trabalho(w)));
  await probe.close();
  console.log('pronto');
})();
