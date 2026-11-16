// Folha de contato dos planos NOVOS da v2 (os reaproveitados da v1 não têm cena aqui): vários instantes por plano, em baixa resolução, para conferir enquadramento e luz.
//   node folha2.js [--w 360 --h 640 --saida pasta --fracs 0.15,0.5,0.85 --so N1,N5]   (--so: prefixo do nome do plano, separado por vírgulas)
const { abrir } = require('./harness'); const fs = require('fs'), path = require('path');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
(async () => {
  const w = +arg('w', 360), h = +arg('h', 640), saida = arg('saida', 'folha2'), fracs = arg('fracs', '0.15,0.5,0.85').split(',').map(Number), so = arg('so', '') ? arg('so', '').split(',') : null;
  fs.mkdirSync(saida, { recursive: true });
  const { p, fechar } = await abrir('index2.html', w, h);
  const planos = await p.evaluate(() => window.__planos);
  for (const pl of planos) {
    if (!pl.novo) continue; if (so && !so.some(s => pl.nome.startsWith(s))) continue;
    for (const fr of fracs) {
      const t = pl.t0 + (pl.t1 - pl.t0) * fr * 0.999, t0 = Date.now();
      const url = await p.evaluate(t => window.__frame(t, { jpeg: 0.9 }), t);
      const nome = pl.nome.split(' ')[0] + '_' + String(Math.round(fr * 100)).padStart(3, '0') + '.jpg';
      fs.writeFileSync(path.join(saida, nome), Buffer.from(url.split(',')[1], 'base64'));
      console.log(nome, pl.nome, ((Date.now() - t0) / 1000).toFixed(1) + ' s');
    }
  }
  await fechar();
})();
