const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
for(const n of ['A','C','D','E']){await p.setContent('<body style="margin:0;background:#000">'+fs.readFileSync(process.argv[2]+'/nova'+n+'.svg','utf8')+'</body>');await p.screenshot({path:process.argv[2]+'/nova'+n+'.png'});}
await b.close();})();
