// Conferência antes do render: (1) o verificador de enquadramento 9:16 de cada plano (o que precisa caber, em 6 instantes);
// (2) quadros no começo, meio e fim de cada plano, montados numa folha por plano para olhar.
// uso: node conferir.js [--planos "S3 reta,S8 fenda"] [--saida pasta] [--w 360 --h 640]
const { abrir } = require('./harness'); const fs = require('fs'), path = require('path');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
(async () => {
  const w = +arg('w', 360), h = +arg('h', 640), saida = arg('saida', 'conferir'), so = arg('planos', '').split(',').filter(Boolean);
  fs.mkdirSync(saida, { recursive: true });
  const { p, fechar } = await abrir('index.html', w, h);
  const enq = await p.evaluate(() => window.__enquadramento());
  console.log('ENQUADRAMENTO (fora > 0 = algo sai da tela 9:16):');
  for (const e of enq) console.log('  ' + e.plano.padEnd(20) + (e.fora > 0 ? 'FORA ' + e.fora : 'ok'));
  const planos = await p.evaluate(() => window.__planos);
  for (const pl of planos) {
    if (so.length && !so.includes(pl.nome)) continue;
    for (const [k, f] of [[0, 0.04], [1, 0.5], [2, 0.96]]) {
      const t = pl.t0 + (pl.t1 - pl.t0) * f, url = await p.evaluate(tt => window.__frame(tt, { jpeg: 0.85, subs: 1 }), t);
      fs.writeFileSync(path.join(saida, `${pl.nome.replace(/ /g, '_')}_${k}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
    }
    console.log('quadros', pl.nome);
  }
  await fechar();
})();
