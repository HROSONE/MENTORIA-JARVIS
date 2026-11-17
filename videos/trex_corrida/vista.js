// Desenha a cena de uma câmera livre: node vista.js t px,py,pz tx,ty,tz [fov] saida.jpg
const { abrir } = require('./harness'); const fs = require('fs');
(async () => {
  const [t, p, a, fov, saida] = process.argv.slice(2), num = s => s.split(',').map(Number);
  const { p: pg, fechar } = await abrir('index.html', 540, 960);
  const url = await pg.evaluate(([t, p, a, f]) => window.__vista(t, p, a, f), [+t, num(p), num(a), +fov]);
  fs.writeFileSync(saida, Buffer.from(url.split(',')[1], 'base64')); await fechar();
})();
