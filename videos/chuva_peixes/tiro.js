// node tiro.js dev.html saida.png '{"t":0,"cam":{"pos":[...],"alvo":[...]},"pose":{}}'
const { capturarTiro } = require('../core/tiro');
capturarTiro(__dirname).catch(err => { console.error(err); process.exit(1); });
