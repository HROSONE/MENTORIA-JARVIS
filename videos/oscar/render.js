const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const dir = process.argv[2];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (let i = 1; i <= 8; i++) {
    const svg = fs.readFileSync(`${dir}/cena${i}.svg`, 'utf8');
    await p.setContent(`<html><body style="margin:0;background:#000">${svg}</body></html>`);
    await p.screenshot({ path: `${dir}/cena${i}.png` });
  }
  await b.close();
})();
