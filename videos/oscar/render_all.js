const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const dir = process.argv[2], wid = +process.argv[3], nw = +process.argv[4], fps = 24;
  const order = JSON.parse(fs.readFileSync(dir + '/order.json'));
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  let g = 0;
  for (let s = 0; s < order.length; s++) {
    const n = Math.round(order[s][1] * fps);
    let loaded = false;
    for (let f = 0; f < n; f++, g++) {
      if (g % nw !== wid) continue;
      if (!loaded) { await p.goto('file://' + dir + '/' + order[s][0] + '.html'); loaded = true; }
      await p.evaluate(`setT(${f / fps})`);
      await p.screenshot({ path: `${dir}/frames/${String(g).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 });
    }
  }
  await b.close();
})();
