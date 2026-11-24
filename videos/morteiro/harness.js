// Servidor estático + navegador sem GPU (SwiftShader) para renderizar páginas Three.js do projeto.
// Uso (módulo): const { abrir } = require('./harness'); const { p, fechar } = await abrir('dev.html?x=1', 1080, 1920);
const { chromium } = require('playwright');
const http = require('http'), path = require('path'), fs = require('fs');
const RAIZ = path.resolve(__dirname, '..');
const PROJ = path.basename(__dirname);                          // videos/
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' };
function servidor() {
  return new Promise(ok => {
    const s = http.createServer((q, r) => {
      const f = path.join(RAIZ, decodeURIComponent(q.url.split('?')[0]));
      if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
    }).listen(0, '127.0.0.1', () => ok(s));
  });
}
async function abrir(pagina, larg = 1080, alt = 1920, esperar = true) {
  const srv = await servidor(), porta = srv.address().port;
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: larg, height: alt } });
  const p = await ctx.newPage();
  let falha = null; p.on('pageerror', e => { console.log('ERRO:', e.message); falha = falha || e.message; });
  p.on('console', m => { if (['error', 'warning'].includes(m.type())) console.log('console:', m.text().slice(0, 300)); });
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, r => {
    const rel = r.request().url().match(/three@0\.160\.0\/(.*)/)[1];
    r.fulfill({ path: path.join(RAIZ, 'node_modules/three', rel), contentType: 'application/javascript' });
  });
  await p.goto(`http://127.0.0.1:${porta}/${PROJ}/${pagina}${pagina.includes('?') ? '&' : '?'}w=${larg}&h=${alt}`);
  if (esperar) { const t0 = Date.now(); while (!(await p.evaluate(() => !!window.__ready))) { if (falha) { await b.close(); srv.close(); throw new Error('erro na página: ' + falha); } if (Date.now() - t0 > 300000) throw new Error('timeout'); await new Promise(r => setTimeout(r, 400)); } }
  return { p, fechar: async () => { await b.close(); srv.close(); } };
}
module.exports = { abrir };
