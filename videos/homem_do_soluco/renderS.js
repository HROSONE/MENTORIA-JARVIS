const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const dir = process.argv[2]; const ids = process.argv.slice(3);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const i of ids) { await p.setContent('<body style="margin:0;background:#000">' + fs.readFileSync(`${dir}/sc${i}.svg`, 'utf8') + '</body>'); await p.screenshot({ path: `${dir}/sc${i}.png` }); }
  await b.close();
})();
