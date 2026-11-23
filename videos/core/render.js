// Renderizador paralelo compartilhado em quadros JPEG para Shorts Three.js (protocolo window.__total / window.__frame).
// Uso direto: node ../core/render.js --proj . [--trabalhadores 4] [--saida pasta] [--de N] [--ate N] [--largura 1080] [--altura 1920] [--jpeg 0.93] [--pagina index.html]
// Uso por wrapper em um projeto: require('../core/render').renderizar(__dirname);
const path = require('path');
const fs = require('fs');
const { abrir } = require('./harness');

function lerArg(argv, nome, padrao) {
  const i = argv.indexOf('--' + nome);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : padrao;
}

async function renderizar(projDir, {
  argv = process.argv.slice(2),
  fps = 30,
  largPadrao = 1080,
  altPadrao = 1920,
  jpegPadrao = 0.93,
  paginaPadrao = 'index.html',
  trabalhadoresPadrao = 4,
} = {}) {
  const K = +lerArg(argv, 'trabalhadores', trabalhadoresPadrao);
  const saida = lerArg(argv, 'saida', path.join(projDir, 'quadros'));
  const larg = +lerArg(argv, 'largura', largPadrao);
  const alt = +lerArg(argv, 'altura', altPadrao);
  const jpeg = +lerArg(argv, 'jpeg', jpegPadrao);
  const pagina = lerArg(argv, 'pagina', paginaPadrao);
  fs.mkdirSync(saida, { recursive: true });

  await Promise.all(Array.from({ length: K }, async (_, w) => {
    const { p, fechar } = await abrir(projDir, pagina, larg, alt);
    const total = await p.evaluate(() => window.__total);
    const N = Math.round(total * fps);
    const de = +lerArg(argv, 'de', 0);
    const ate = Math.min(+lerArg(argv, 'ate', N - 1), N - 1);
    const t0 = Date.now();
    let feitos = 0;
    for (let i = de + w; i <= ate; i += K) {
      const f = path.join(saida, 'f' + String(i).padStart(5, '0') + '.jpg');
      if (fs.existsSync(f)) continue;
      const url = await p.evaluate(({ t, q }) => window.__frame(t, { jpeg: q }), { t: i / fps, q: jpeg });
      fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
      feitos++;
      if (feitos % 30 === 0) {
        console.log('[' + w + ']', i, '/', ate, ((Date.now() - t0) / feitos / 1000).toFixed(2) + ' s/quadro');
      }
    }
    await fechar();
  }));
  console.log('pronto');
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const proj = path.resolve(lerArg(argv, 'proj', process.cwd()));
  renderizar(proj, { argv }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { renderizar };
