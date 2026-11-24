// Fotos de conferência de qualquer veículo do kit: node fotos.js <veiculo> [saida] [cam1,cam2,...] [extra]
const path = require('path'), fs = require('fs');
const { abrir } = require('../../morteiro/harness.js');
(async () => {
  const v = process.argv[2], saida = process.argv[3] || path.join(__dirname, v, 'previews'), cams = (process.argv[4] || 'tq,lado,lado2,frente,tras,tqt').split(','), extra = process.argv[5] || '';
  fs.mkdirSync(saida, { recursive: true });
  for (const c of cams) {
    const { p, fechar } = await abrir(`../biblioteca3d/veiculos/bancada.html?still&v=${v}&cam=${c}${extra ? '&' + extra : ''}`, 1200, 800);
    await p.screenshot({ path: path.join(saida, `${v}-${c}${extra.includes('noite') ? '-noite' : ''}.png`) }); await fechar(); console.log(v, c);
  }
})();
