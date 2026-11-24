// Fotos de conferência da ambulância (bancada em Chromium sem GPU): node fotos.js [saida] [cam1,cam2,...] [extra]
const path = require('path'), fs = require('fs');
const { abrir } = require('../../../morteiro/harness.js');
(async () => {
  const saida = process.argv[2] || path.join(__dirname, 'previews'), cams = (process.argv[3] || 'tq,lado,lado2,frente,tras,tqt').split(','), extra = process.argv[4] || '';
  fs.mkdirSync(saida, { recursive: true });
  for (const c of cams) {
    const { p, fechar } = await abrir(`../biblioteca3d/veiculos/ambulancia/ambulancia.html?still&cam=${c}${extra ? '&' + extra : ''}`, 1200, 800);
    await p.screenshot({ path: path.join(saida, `ambulancia-${c}.png`) }); await fechar(); console.log(c);
  }
})();
