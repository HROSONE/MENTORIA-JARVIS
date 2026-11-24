// Lê da animação os eventos de som (pés no chão de quem corre e do T. rex, com distância e pan) e grava eventos.json para o sfx_trex.py.
// uso: node eventos.js
const { abrir } = require('./harness'); const fs = require('fs');
(async () => {
  const { p, fechar } = await abrir('index.html', 270, 480);
  const ev = [], marcas = {};
  const planos = await p.evaluate(() => window.__planos);
  fs.writeFileSync(__dirname + '/eventos.json', JSON.stringify({ planos, marcas, ev }, null, 0));
  const c = {}; for (const e of ev) c[e.quem] = (c[e.quem] || 0) + 1; console.log('eventos', ev.length, c);
  await fechar();
})();
