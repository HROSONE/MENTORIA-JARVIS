// Folha de contato: node render_folha.js "index.html" saida.png t1,t2,t3,... [largura altura colunas]
// Abre a página uma vez, chama window.__setTime(t) para cada instante e monta uma folha (rótulo = tempo). Usa a captura do canvas inteiro.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const VID = path.resolve(__dirname, '..');
(async () => {
  const [, , url = 'index.html', saida = '/tmp/folha.png', lista = '0', w = 360, h = 640, cols = 6] = process.argv;
  let tempos = lista.startsWith('auto') ? [] : lista.split(',').map(Number);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  p.on('pageerror', e => console.log('ERRO:', e.message));
  p.on('console', m => { const t = m.text(); if (['error'].includes(m.type()) && !t.includes('ERR_FAILED')) console.log(m.type() + ':', t.slice(0, 400)); });
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, r => {
    const rel = r.request().url().match(/three@0\.160\.0\/(.*)/)[1];
    r.fulfill({ path: path.join(VID, 'node_modules/three', rel), contentType: 'application/javascript' });
  });
  await p.goto('http://127.0.0.1:8777/viagem_futuro/' + url + (url.includes('?') ? '&' : '?') + 'w=' + w + '&h=' + h);
  await p.waitForFunction(() => window.__ready, null, { timeout: 240000 });
  if (lista.startsWith('auto')) {
    const planos = await p.evaluate(() => window.__planos);
    const [a, bb] = (lista.split(':')[1] || '0-999').split('-').map(Number);
    const pontos = (lista.split(':')[2] || '0.15,0.5,0.85').split(',').map(Number);
    planos.forEach(([id, t0, dur], i) => { if (i >= a && i <= bb) for (const k of pontos) tempos.push(+(t0 + dur * k).toFixed(3)); });
    console.log(planos.map((q, i) => i + ':' + q[0] + '@' + q[1] + '+' + q[2]).join(' | '));
  }
  const dir = fs.mkdtempSync('/tmp/folha_');
  const arqs = [];
  for (const t of tempos) {
    await p.evaluate(x => window.__setTime(x), t);
    if (process.env.DEBUG_CAM) console.log(t, JSON.stringify(await p.evaluate(() => window.__camInfo)));
    const f = path.join(dir, 'q_' + t.toFixed(3) + '.png');
    await p.screenshot({ path: f });
    arqs.push([t, f]);
  }
  await b.close();
  const py = `
import sys
from PIL import Image, ImageDraw
saida, cols = sys.argv[1], int(sys.argv[2])
itens = [a.split('|') for a in sys.argv[3:]]
ims = [(float(t), Image.open(f).convert('RGB')) for t, f in itens]
W, H = ims[0][1].size
rows = (len(ims) + cols - 1) // cols
sh = Image.new('RGB', (W * cols, H * rows), (20, 20, 20))
for i, (t, im) in enumerate(ims):
    d = ImageDraw.Draw(im); d.rectangle((0, 0, 58, 16), fill=(0, 0, 0)); d.text((3, 2), '%.2fs' % t, fill=(255, 255, 0))
    sh.paste(im, ((i % cols) * W, (i // cols) * H))
sh.save(saida)
print(saida, sh.size)
`;
  execFileSync('python3', ['-I', '-c', py, saida, String(cols), ...arqs.map(([t, f]) => t + '|' + f)], { stdio: 'inherit' });
})();
