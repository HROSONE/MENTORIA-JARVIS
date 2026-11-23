// Captura um quadro de teste em páginas dev.html que expõem window.__tiro(obj).
// Uso por wrapper: require('../core/tiro').capturarTiro(__dirname);
const { abrir } = require('./harness');

async function capturarTiro(projDir, argv = process.argv.slice(2)) {
  const [pag, out, js, dens] = argv;
  const { p, fechar } = await abrir(projDir, pag + (dens ? '?dens=' + dens : ''), 1080, 1920);
  const t0 = Date.now();
  await p.evaluate(o => window.__tiro(o), JSON.parse(js));
  await p.screenshot({ path: out });
  console.log('ok', out, (Date.now() - t0) / 1000 + ' s');
  await fechar();
}

module.exports = { capturarTiro };
