const { chromium } = require('playwright');
(async () => {
  const [,, dir, scene, t, out] = process.argv;
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + dir + '/scene' + scene + '.html');
  await p.evaluate(`setT(${t})`);
  const s = Date.now(); await p.screenshot({ path: out, type: 'jpeg', quality: 90 }); console.log('ms', Date.now() - s);
  await b.close();
})();
