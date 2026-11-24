// Renderiza o edit em quadros JPEG (720x1280 por padrão; o pós-processamento sobe para 1080x1920) com vários navegadores em paralelo (cada trabalhador abre a página e pega os quadros i = w, w+K, ...).
//   node render.js [--trabalhadores 4] [--saida pasta] [--de N] [--ate N] [--pagina index2.html --lista quadros.json]   (--lista: arquivo JSON com os índices dos quadros a renderizar)
const { abrir } = require('./harness');
const path = require('path'), fs = require('fs');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const FPS = 30;
(async () => {
  const K = +arg('trabalhadores', 4), saida = arg('saida', path.join(__dirname, 'quadros')), larg = +arg('w', 720), alt = +arg('h', 1280);
  fs.mkdirSync(saida, { recursive: true });
  const pagina = arg('pagina', 'index.html'), lista = arg('lista', '') ? JSON.parse(fs.readFileSync(arg('lista', ''), 'utf8')) : null;
  await Promise.all(Array.from({ length: K }, async (_, w) => {
    const { p, fechar } = await abrir(pagina, larg, alt);
    const total = await p.evaluate(() => window.__total), N = Math.round(total * FPS), de = +arg('de', 0), ate = Math.min(+arg('ate', N - 1), N - 1);
    const t0 = Date.now(); let feitos = 0;
    const indices = lista ? lista.filter((_, k) => k % K === w) : null;
    for (let n = 0, i = lista ? indices[0] : de + w; lista ? n < indices.length : i <= ate; n++, i = lista ? indices[n] : i + K) {
      const f = path.join(saida, 'f' + String(i).padStart(5, '0') + '.jpg'); if (fs.existsSync(f)) continue;
      const url = await p.evaluate(t => window.__frame(t, { jpeg: 0.93 }), i / FPS);
      fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); feitos++;
      if (feitos % 30 === 0) console.log('[' + w + ']', i, '/', ate, ((Date.now() - t0) / feitos / 1000).toFixed(2) + ' s/quadro');
    }
    await fechar();
  }));
  console.log('pronto');
})();
