// Exporta da página os dados que o som precisa (instantes de pouso dos peixes, peixes de Yoro que se debatem): node eventos_som.js  -> eventos_som.json
const { abrir } = require('./harness');
const fs = require('fs'), path = require('path');
(async () => {
  const { p, fechar } = await abrir('index.html', 180, 320);
  const r = await p.evaluate(() => { const X = window.__X; return { tg: X.chao.tauPouso, tp: X.tauParou, pousosL: X.cairL.pousos, yoro: X.yoro.peixes.map(f => ({ x: f.x, z: f.z, fl: f.fl, per: f.per, amp: f.amp, fase: f.fase })) }; });
  fs.writeFileSync(path.join(__dirname, 'eventos_som.json'), JSON.stringify(r)); console.log('ok', r.pousosL.length, r.yoro.length); await fechar();
})();
