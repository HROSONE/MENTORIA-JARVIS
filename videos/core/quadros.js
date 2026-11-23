// Captura PNG de quadros soltos em 1080x1920 (use W=540 H=960 para miniaturas).
// Uso por wrapper: require('../core/quadros').capturarQuadros(__dirname);
const { abrir } = require('./harness');

async function capturarQuadros(projDir, argv = process.argv.slice(2)) {
  const [pre, ...ts] = argv;
  const W = +(process.env.W || 1080);
  const H = +(process.env.H || 1920);
  const { p, fechar } = await abrir(projDir, 'index.html', W, H);
  console.log('planos', JSON.stringify(await p.evaluate(() => window.__planos)));
  for (const t of ts) {
    const t0 = Date.now();
    await p.evaluate(x => window.__setTime(+x), t);
    await p.screenshot({ path: `${pre}_${t}.png` });
    console.log(t, (Date.now() - t0) / 1000 + ' s');
  }
  await fechar();
}

module.exports = { capturarQuadros };
