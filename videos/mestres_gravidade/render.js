// Renderiza o Short em quadros JPEG com vários navegadores em paralelo (cada trabalhador abre a página e pega os quadros i = w, w+K, ...).
//   node render.js [--trabalhadores 4] [--saida pasta] [--de N] [--ate N]
const { abrir } = require('./harness');
const path = require('path'), fs = require('fs');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const FPS = 30;
(async () => {
  const K = +arg('trabalhadores', 4), saida = arg('saida', path.join(__dirname, 'quadros')), larg = 1080, alt = 1920;
  fs.mkdirSync(saida, { recursive: true });
  await Promise.all(Array.from({ length: K }, async (_, w) => {
    const { p, fechar } = await abrir('index.html', larg, alt);
    const total = await p.evaluate(() => window.__total), N = Math.round(total * FPS), de = +arg('de', 0), ate = Math.min(+arg('ate', N - 1), N - 1);
    const t0 = Date.now(); let feitos = 0;
    for (let i = de + w; i <= ate; i += K) {
      const f = path.join(saida, 'f' + String(i).padStart(5, '0') + '.jpg'); if (fs.existsSync(f)) continue;
      const url = await p.evaluate(t => window.__frame(t, { jpeg: 0.93 }), i / FPS);
      fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); feitos++;
      if (feitos % 30 === 0) console.log('[' + w + ']', i, '/', ate, ((Date.now() - t0) / feitos / 1000).toFixed(2) + ' s/quadro');
    }
    await fechar();
  }));
  console.log('pronto');
})();
