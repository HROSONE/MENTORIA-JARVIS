// Renderiza um quadro por plano (meio do plano por padrão) em baixa resolução, para conferir o enquadramento: node folha.js [--w 360 --h 640 --saida pasta --frac 0.5 --so 0,5,9]
const { abrir } = require('./harness'); const fs = require('fs'), path = require('path');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
(async () => {
  const w = +arg('w', 360), h = +arg('h', 640), saida = arg('saida', 'folha'), frac = +arg('frac', 0.5), so = arg('so', '') ? arg('so', '').split(',').map(Number) : null;
  fs.mkdirSync(saida, { recursive: true });
  const { p, fechar } = await abrir('index.html', w, h);
  const planos = await p.evaluate(() => window.__planos);
  for (let i = 0; i < planos.length; i++) {
    if (so && !so.includes(i)) continue;
    const t = planos[i].t0 + (planos[i].t1 - planos[i].t0) * frac, t0 = Date.now();
    const url = await p.evaluate(t => window.__frame(t, { jpeg: 0.9 }), t);
    fs.writeFileSync(path.join(saida, 'p' + String(i).padStart(2, '0') + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
    console.log(i, planos[i].nome, ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  }
  await fechar();
})();
