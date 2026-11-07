const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] }); const p = await b.newPage();
  await p.route(/cdn\.jsdelivr\.net\/npm\/three@0\.160\.0\/(.*)/, r => r.fulfill({ path: path.join(__dirname, 'node_modules/three', r.request().url().match(/three@0\.160\.0\/(.*)/)[1]) }));
  await p.route(/assets\.local\/(.*)/, r => r.fulfill({ path: path.join(__dirname, 'assets', r.request().url().match(/assets\.local\/(.*)/)[1]), headers: { 'access-control-allow-origin': '*' } }));
  await p.goto('file://' + path.join(__dirname, 'assets/probe.html')); await p.waitForFunction(() => window.__out, null, { timeout: 120000 }); console.log(await p.evaluate(() => window.__out)); await b.close(); })();
