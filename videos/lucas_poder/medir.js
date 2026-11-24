const { abrir } = require('./harness');
(async () => { const { p, fechar } = await abrir('medir.html?ids=' + process.argv[2], 200, 200); console.log(JSON.stringify(await p.evaluate(() => window.__out), null, 0).replace(/},/g, '},\n')); await fechar(); })();
