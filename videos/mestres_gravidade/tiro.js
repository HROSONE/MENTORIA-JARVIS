// node tiro.js dev.html saida.png '{"t":0,"cam":{"pos":[...],"alvo":[...]}, "pose":{}}'
const { abrir } = require('./harness');
(async () => {
  const [pag, out, js, dens] = process.argv.slice(2);
  const { p, fechar } = await abrir(pag + (dens ? '?dens=' + dens : ''), 1080, 1920);
  const t0 = Date.now();
  await p.evaluate(o => window.__tiro(o), JSON.parse(js));
  await p.screenshot({ path: out });
  console.log('ok', out, (Date.now() - t0) / 1000 + ' s');
  await fechar();
})();
