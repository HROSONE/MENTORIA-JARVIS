// Renderiza quadros avulsos (para conferir enquadramento e luz): node quadros.js --tempos 0,1.5,3 [--w 540 --h 960 --saida pasta --subs 1]
const { abrir } = require('./harness'); const fs = require('fs'), path = require('path');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
(async () => {
  const w = +arg('w', 540), h = +arg('h', 960), saida = arg('saida', 'teste'), tempos = arg('tempos', '0').split(',').map(Number), subs = +arg('subs', 1), extra = arg('extra', '');
  fs.mkdirSync(saida, { recursive: true });
  const { p, fechar } = await abrir('index.html' + (extra ? '?' + extra : ''), w, h);
  for (const t of tempos) {
    const t0 = Date.now(), url = await p.evaluate(([t, s]) => window.__frame(t, { jpeg: 0.92, subs: s }), [t, subs]);
    const f = path.join(saida, 't' + t.toFixed(2).padStart(6, '0') + '.jpg'); fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
    console.log(f, ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  }
  await fechar();
})();
