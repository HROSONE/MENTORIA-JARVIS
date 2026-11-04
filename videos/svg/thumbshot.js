const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  for (const v of ['a', 'b']) { await p.goto('file://' + path.join(__dirname, 'thumb.html') + '?v=' + v); await p.waitForFunction(() => window.__ready); await p.screenshot({ path: path.join(__dirname, `thumb_${v}.png`) }); }
  await b.close(); })();
