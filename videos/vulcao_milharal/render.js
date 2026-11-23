// Renderiza o Short em quadros JPEG usando videos/core/render.js.
//   node render.js [--trabalhadores 4] [--saida pasta] [--de N] [--ate N]
const { renderizar } = require('../core/render');
renderizar(__dirname).catch(err => { console.error(err); process.exit(1); });
