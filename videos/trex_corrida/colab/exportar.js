// Gera colab/dados/ (animação, câmeras, cenário) a partir da página do Short: node colab/exportar.js
const { abrir } = require('../harness'); const fs = require('fs'), path = require('path');
(async () => {
  const D = path.join(__dirname, 'dados'); fs.mkdirSync(D, { recursive: true });
  const { p, fechar } = await abrir('index.html', 270, 480);
  const t0 = Date.now(), r = await p.evaluate(() => window.__exportar());
  for (const [n, b] of Object.entries(r.arquivos)) { fs.writeFileSync(path.join(D, n), Buffer.from(b, 'base64')); console.log(n, (fs.statSync(path.join(D, n)).size / 1e6).toFixed(1), 'MB'); }
  for (const [n, j] of Object.entries(r.json)) { fs.writeFileSync(path.join(D, n), JSON.stringify(j)); console.log(n, (fs.statSync(path.join(D, n)).size / 1e6).toFixed(2), 'MB'); }
  console.log('info', JSON.stringify(r.info), ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  await fechar();
})();
