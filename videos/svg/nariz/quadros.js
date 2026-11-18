// Renderiza quadros do Short 2D do nariz: node quadros.js pasta [--tempos 0,1.5] [--de N --ate N] [--w 1080 --h 1920] [--fps 30]
// Sem --tempos: todos os quadros (pula os que já existem). Cada quadro: o SVG de frame(t) rasterizado pelo Chromium.
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const src = ['../feijao/carlos.js', 'cenas.js'].map(f => fs.readFileSync(path.join(__dirname, f), 'utf8')).join('\n');
(async () => {
  const saida = process.argv[2]; fs.mkdirSync(saida, { recursive: true });
  const w = +arg('w', 1080), h = +arg('h', 1920), fps = +arg('fps', 30);
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  await p.setContent(`<html><body style="margin:0;overflow:hidden;background:#000"><div id="c" style="width:${w}px;height:${h}px"></div><script>${src}
    window.__total = TOTAL; window.__planos = PLANOS.map(q => ({ nome: q.nome, t0: q.t0, t1: q.t0 + q.dur }));
    window.__mostrar = t => { document.getElementById('c').innerHTML = frame(t).replace('<svg ', '<svg style="width:${w}px;height:${h}px" '); return true; };
  </script></body></html>`);
  const total = await p.evaluate(() => window.__total), N = Math.round(total * fps);
  const lista = arg('tempos', '') ? arg('tempos').split(',').map(Number).map(t => ({ t, f: path.join(saida, 't' + t.toFixed(2).padStart(6, '0') + '.jpg') }))
    : Array.from({ length: N }, (_, i) => i).filter(i => i >= +arg('de', 0) && i <= +arg('ate', N - 1)).map(i => ({ t: i / fps, f: path.join(saida, 'f' + String(i).padStart(5, '0') + '.jpg') }));
  const t0 = Date.now(); let n = 0;
  for (const { t, f } of lista) {
    if (fs.existsSync(f) && !arg('tempos', '')) continue;
    await p.evaluate(tt => window.__mostrar(tt), t); await p.screenshot({ path: f, type: 'jpeg', quality: 92 }); n++;
    if (n % 60 === 0) console.log(n, '/', lista.length, ((Date.now() - t0) / n / 1000).toFixed(2) + ' s/quadro');
  }
  console.log('pronto', n, 'quadros, total', total.toFixed(2), 's'); await b.close();
})();
