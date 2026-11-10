const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:+process.argv[3],height:+process.argv[4]}});
await p.setContent('<body style="margin:0">'+fs.readFileSync(process.argv[2],'utf8')+'</body>');
const t=Date.now();await p.screenshot({path:process.argv[2].replace('.svg','.png')});console.log('ms',Date.now()-t);await b.close();})();
