// Render rápido para páginas SVG: sem emulação de GPU (SwiftShader) e captura direta via CDP.
// uso: PAGE=svg/x.html FR=pasta [VW=1920 VH=1080] node render_svg.js <worker> <nworkers> <fps>
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
const [w, nw, fps] = process.argv.slice(2).map(Number);
const VW = +(process.env.VW || 1920), VH = +(process.env.VH || 1080);
(async () => {
  const b = await chromium.launch({ args: ['--disable-gpu', '--disable-gpu-compositing', '--disable-software-rasterizer'] });
  const p = await b.newPage({ viewport: { width: VW, height: VH } });
  p.on('pageerror', e => console.log('ERR:', e.message));
  await p.goto('file://' + path.join(__dirname, process.env.PAGE) + '?hideui&still', { timeout: 600000, waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.__ready, null, { timeout: 600000 });
  await p.evaluate(() => { window.__render = true; return document.fonts.ready; });
  const cdp = await p.context().newCDPSession(p);
  const total = await p.evaluate(() => window.__total);
  const N = Math.ceil(total * fps) + 1;
  for (let i = w; i < N; i += nw) {
    const fp = `${process.env.FR || 'frames'}/f${String(i).padStart(5, '0')}.jpg`; if (fs.existsSync(fp)) continue;
    await p.evaluate(t => window.__seek(t), Math.min(i / fps, total));
    const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, optimizeForSpeed: true });
    fs.writeFileSync(fp, Buffer.from(r.data, 'base64'));
    if (i % 240 === w) console.log(w, i, '/', N, new Date().toISOString());
  }
  await b.close();
})();
