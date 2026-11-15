// node quadros.js prefixo t1 t2 ...   (PNG de quadros soltos, em 1080x1920)
const { abrir } = require('./harness');
(async () => {
  const [pre, ...ts] = process.argv.slice(2);
  const { p, fechar } = await abrir('index.html', 1080, 1920);
  console.log('planos', JSON.stringify(await p.evaluate(() => window.__planos)));
  for (const t of ts) { const t0 = Date.now(); await p.evaluate(x => window.__setTime(+x), t); await p.screenshot({ path: `${pre}_${t}.png` }); console.log(t, (Date.now() - t0) / 1000 + ' s'); }
  await fechar();
})();
