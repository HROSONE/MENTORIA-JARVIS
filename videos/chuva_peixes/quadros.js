// node quadros.js prefixo t1 t2 ...   (PNG de quadros soltos; use W=540 H=960 para miniaturas)
const { capturarQuadros } = require('../core/quadros');
capturarQuadros(__dirname).catch(err => { console.error(err); process.exit(1); });
