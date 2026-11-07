const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
 for (const m of ['cena', 'poses']) { await p.goto('file://' + __dirname + '/teste.html#' + m); await p.reload(); await p.screenshot({ path: __dirname + '/' + m + '.png' }); }
 await b.close(); })();
