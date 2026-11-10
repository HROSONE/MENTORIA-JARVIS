const { chromium } = require('playwright');
(async () => {
  const dir = process.argv[2]; const list = JSON.parse(process.argv[3]);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs=[]; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  for (const [s, t] of list) {
    await p.goto('file://' + dir + '/' + s + '.html');
    await p.evaluate(`setT(${t})`);
    await p.screenshot({ path: `${dir}/chk_${s}_${t}.jpg`, type: 'jpeg', quality: 85 });
  }
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
