const fs = require('fs'); const { chromium } = require('playwright');
const lib = fs.readFileSync(__dirname + '/anime.js', 'utf8');
function page(W, H, fn) { return `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#111}</style></head><body><svg id="s" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"></svg><script>${lib}
${fn}
const OUT = build(); document.getElementById('s').innerHTML = '<defs>' + DEFS.join('') + '</defs>' + OUT;</script></body></html>`; }
const card = `function card(x, y, w, h, c, inner) { const id = uid('bg'); DEFS.push('<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c.bg[0] + '"/><stop offset="1" stop-color="' + c.bg[1] + '"/></linearGradient>'); let r = '<g transform="translate(' + x + ',' + y + ')"><rect width="' + w + '" height="' + h + '" rx="26" fill="url(#' + id + ')"/>'; r += '<defs><radialGradient id="g' + id + '"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><ellipse cx="' + (w / 2) + '" cy="' + (h * .4) + '" rx="' + (w * .6) + '" ry="' + (h * .35) + '" fill="url(#g' + id + ')"/>'; const dark = c.bg[1] < '#80'; r += '<defs><clipPath id="cl' + id + '"><rect width="' + w + '" height="' + h + '" rx="26"/></clipPath></defs><g clip-path="url(#cl' + id + ')">' + inner + '</g>'; r += '<rect y="' + (h - 120) + '" width="' + w + '" height="120" fill="#0A0810" opacity=".72"/><text x="' + (w / 2) + '" y="' + (h - 70) + '" text-anchor="middle" font-family="DejaVu Sans" font-weight="900" font-size="36" fill="#FFFFFF">' + c.nome + '</text><text x="' + (w / 2) + '" y="' + (h - 28) + '" text-anchor="middle" font-family="DejaVu Sans" font-size="19" fill="#FFE6A0">' + c.diz + '</text></g>'; return r; }`;
const heads = page(2440, 1500, card + `
function build() { let s = '<rect width="2440" height="1500" fill="#14121A"/>'; CAST.forEach((c, i) => { const col = i < 4 ? i : i - 4, row = i < 4 ? 0 : 1, x = (row ? 310 : 20) + col * 605, y = 20 + row * 740; const sc = c.H < 4 ? 1.12 : 1.0; s += card(x, y, 585, 720, c, '<g transform="translate(292,' + (c.beard ? 290 : 320) + ') scale(' + sc + ')"><path d="M-170 240 Q0 200 170 240 L200 500 L-200 500Z" fill="' + ({gakuran:'#1E2230',moletom:'#E8642A',marinheira:'#F4F4F0',terno:'#2A2A32',sobretudo:'#6A5A48',quimono:'#5A6A8A',camiseta:'#F2D24A'})[c.outfit] + '" stroke="#1A1220" stroke-width="6"/>' + head(c) + '</g>'); }); return s; }`);
const bodies = page(2440, 1500, card + `
function build() { let s = '<rect width="2440" height="1500" fill="#14121A"/>'; CAST.forEach((c, i) => { const w = 336, x = 20 + i * 345; const sc = c.H < 4 ? .62 : (1260 - 260) / (330 * (c.H + .9)); s += card(x, 20, w, 1460, Object.assign({}, c, { diz: '' }), '<g transform="translate(' + (w / 2) + ',' + (c.H < 4 ? 560 : 220) + ')">' + character(c, 0, 0, sc, c.H) + '</g>'); }); return s; }`);
const EM = ['neutro', 'feliz', 'bravo', 'choque', 'choro', 'fechado'], EN = ['NEUTRO', 'FELIZ', 'BRAVO', 'CHOCADO', 'CHORANDO', 'CONFIANTE'];
const expr = page(2440, 760, card + `
function build() { let s = '<rect width="2440" height="760" fill="#14121A"/>'; const EM = ${JSON.stringify(EM)}, EN = ${JSON.stringify(EN)}; EM.forEach((e, i) => { const c = Object.assign({}, CAST[0], { emo: e, mouth: e === 'fechado' ? 'smirk' : (e === 'neutro' ? 'leve' : 'grande'), nome: EN[i], diz: 'o herói' }); s += card(20 + i * 403, 20, 390, 720, c, '<g transform="translate(195,300) scale(.78)">' + head(c) + '</g>'); }); return s; }`);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 2440, height: 1500 } });
  const SN = ['heroi', 'fofa', 'misterioso', 'sensivel', 'vilao', 'mestre', 'atrapalhado'];
  const extra = SN.map((n, gi) => ['v_' + (gi + 1) + '_' + n, page(2440, 880, card + `
function build() { let s = '<rect width="2440" height="880" fill="#14121A"/>'; VAR[${gi}].forEach((c, i) => { const sc = c.H < 4 ? 1.12 : 1.0; s += card(20 + i * 605, 20, 585, 840, c, '<g transform="translate(292,' + (c.beard || c.hairStyle === 'coque' || c.hairStyle === 'velhaCoque' ? 330 : 340) + ') scale(' + sc + ')"><path d="M-170 240 Q0 200 170 240 L200 600 L-200 600Z" fill="' + ({gakuran:'#1E2230',moletom:'#E8642A',marinheira:'#F4F4F0',terno:'#2A2A32',sobretudo:'#6A5A48',quimono:'#5A6A8A',camiseta:'#F2D24A'})[c.outfit] + '" stroke="#1A1220" stroke-width="6"/>' + head(c) + '</g>'); }); return s; }`), 880]);
  const meu = page(2440, 2240, card + `
function build() { let s = '<rect width="2440" height="2240" fill="#14121A"/>'; MEU.forEach((c, i) => { const sc = c.H < 4 ? 1.12 : 1.0; s += card(20 + i * 605, 20, 585, 760, c, '<g transform="translate(292,' + (c.H < 4 ? 360 : 380) + ') scale(' + sc + ')"><path d="M-170 240 Q0 200 170 240 L200 600 L-200 600Z" fill="#D8282E" stroke="#1A1220" stroke-width="6"/>' + head(c) + '</g>'); const scb = c.H < 4 ? .7 : (1300 - 160) / (330 * (c.H + .9)); s += card(20 + i * 605, 800, 585, 1420, Object.assign({}, c, { diz: '' }), '<g transform="translate(292,' + (c.H < 4 ? 560 : 260) + ')">' + character(c, 0, 0, scb, c.H) + '</g>'); }); return s; }`);
  for (const [n, html, h] of [['cabecas', heads, 1500], ['corpos', bodies, 1500], ['expressoes', expr, 760], ['meu_personagem', meu, 2240], ...extra]) {
    fs.writeFileSync(__dirname + '/' + n + '.html', html);
    await p.setViewportSize({ width: 2440, height: h });
    p.on('pageerror', e => console.log('ERR', n, e.message));
    await p.goto('file://' + __dirname + '/' + n + '.html'); await p.waitForTimeout(300);
    await p.screenshot({ path: __dirname + '/' + n + '.png' });
  }
  await b.close();
})();
