// Fotografa quadros soltos: node quadros.js saida_prefixo t1 t2 ...
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const [pre, ...ts] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('ERR:', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
  await p.goto('file://' + path.join(__dirname, 'chiclete.html') + '?hideui&still');
  await p.waitForFunction(() => window.__ready);
  for (const t of ts) { await p.evaluate(x => window.__seek(+x), t); await p.screenshot({ path: `${pre}_${t}.png` }); }
  await b.close();
})();
