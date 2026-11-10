const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const [outdir, ...ts] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('ERR:', e.message, (e.stack || '').split('\n').slice(1, 4).join(' | '))); p.on('console', m => { if (m.type() === 'error') console.log('C:', m.text().slice(0, 300)); });
  await p.goto('file:///home/user/MENTORIA-JARVIS/videos/svg/vulcao/vulcao.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  const st = await p.$('#stage');
  for (const t of ts) { try { const a = Date.now(); await p.evaluate(t => window.__seek(+t), t); await st.screenshot({ path: `${outdir}/t${t}.jpg`, type: 'jpeg', quality: 85 }); process.stdout.write(`${t}:${Date.now() - a} `); } catch (e) { console.log('t', t, e.message.slice(0, 400)); } }
  await b.close();
})();
