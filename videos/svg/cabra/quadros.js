// Fotografa quadros soltos: node quadros.js [pagina.html] saida_prefixo t1 t2 ...   (rodar de svg/cabra, sem NODE_PATH)
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  let a = process.argv.slice(2), page = 'cabra.html';
  if (a[0].endsWith('.html')) page = a.shift();
  const [pre, ...ts] = a;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('ERR:', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
  await p.goto('file://' + path.join(__dirname, page) + '?hideui&still');
  await p.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  for (const t of ts) { await p.evaluate(x => window.__seek(+x), t); await p.screenshot({ path: `${pre}_${t}.png` }); }
  await b.close();
})();
