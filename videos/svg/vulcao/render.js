const { chromium } = require('playwright'); const fs = require('fs');
const [w, nw, fps] = process.argv.slice(2).map(Number); const FR = process.env.FR;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', e => console.log('ERR:', e.message));
  await p.goto('file:///home/user/MENTORIA-JARVIS/videos/svg/vulcao/vulcao.html'); await p.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  const total = await p.evaluate(() => window.__total); const N = Math.round(total * fps); const st = await p.$('#stage');
  for (let i = w; i < N; i += nw) { const fp = `${FR}/f${String(i).padStart(5, '0')}.jpg`; if (fs.existsSync(fp)) continue; await p.evaluate(t => window.__seek(t), i / fps); await st.screenshot({ path: fp, type: 'jpeg', quality: 93 }); }
  await b.close(); console.log('fim', w);
})();
