/* =====================================================================================
   A LAGARTA VIRA SOPA 🦋 — arte em SVG
   Céu, galho, folhas, lagarta-monarca, crisálida, interior (sopa, discos imaginais), borboleta.
   Mundo: a almofada de seda (PAD) fica sob o galho; a crisálida usa coordenadas locais com origem
   na almofada (y para baixo) e escala PS. Tudo é determinístico (nada de R() dentro de quadro).
   ===================================================================================== */
const PS = 1.15;                                   // escala da crisálida no mundo
const hh = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const VIG = (k = 1) => `<rect width="1080" height="1920" fill="url(#vig)" opacity="${k}"/>`;
const GRAINV = t => { const j = Math.floor(t * 24); return `<rect x="-200" y="-200" width="1480" height="2320" fill="url(#noiseP)" opacity=".045" transform="translate(${(j * 37) % 200 - 100},${(j * 53) % 200 - 100})"/>`; };
const blur = (px, c) => { const id = 'bl' + String(px).replace('.', '_'); if (!D.some(d => d.includes(`id="${id}"`))) def(`<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${px}"/></filter>`); return `<g filter="url(#${id})">${c}</g>`; };
const fb = sd => { const id = nid('fb'); def(`<filter id="${id}" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="${f1(sd)}"/></filter>`); return id; };
const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; };
const rimGroup = (c, k = [1, -.5], col = '#FFE2B0', w = 8) => `<g filter="url(#${rig({ amb: '#ffffff', k: [-k[0], -k[1]], shO: 0, rims: [{ c: col, k, w, o: 1, glow: true }] })})">${c}</g>`;

const EXTRA = `
<linearGradient id="tubo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".68" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
<radialGradient id="jade" cx=".36" cy=".28" r=".9"><stop offset="0" stop-color="#CDF8A4"/><stop offset=".42" stop-color="#8BDB63"/><stop offset="1" stop-color="#3A9A4D"/></radialGradient>
<radialGradient id="bolhaG" cx=".36" cy=".3" r=".72"><stop offset="0" stop-color="#fff" stop-opacity=".04"/><stop offset=".72" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#fff" stop-opacity=".62"/></radialGradient>
<radialGradient id="asaG" cx=".08" cy=".55" r="1.05"><stop offset="0" stop-color="#FFB534"/><stop offset=".5" stop-color="#F58516"/><stop offset="1" stop-color="#DA5A0C"/></radialGradient>
<linearGradient id="casca" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B8895C"/><stop offset=".4" stop-color="#80573A"/><stop offset="1" stop-color="#4A2F20"/></linearGradient>
<radialGradient id="gDc"><stop offset="0" stop-color="#6FF0FF" stop-opacity=".95"/><stop offset=".35" stop-color="#6FF0FF" stop-opacity=".35"/><stop offset="1" stop-color="#6FF0FF" stop-opacity="0"/></radialGradient>
<radialGradient id="gDm"><stop offset="0" stop-color="#FF7BE0" stop-opacity=".95"/><stop offset=".35" stop-color="#FF7BE0" stop-opacity=".35"/><stop offset="1" stop-color="#FF7BE0" stop-opacity="0"/></radialGradient>
<radialGradient id="gDo"><stop offset="0" stop-color="#FFC24A" stop-opacity=".98"/><stop offset=".35" stop-color="#FF9A2E" stop-opacity=".4"/><stop offset="1" stop-color="#FF8A20" stop-opacity="0"/></radialGradient>
<radialGradient id="gDl"><stop offset="0" stop-color="#B8FF6B" stop-opacity=".95"/><stop offset=".35" stop-color="#B8FF6B" stop-opacity=".35"/><stop offset="1" stop-color="#B8FF6B" stop-opacity="0"/></radialGradient>
<radialGradient id="gBack"><stop offset="0" stop-color="#14534A"/><stop offset=".6" stop-color="#0B2E2A"/><stop offset="1" stop-color="#04120F"/></radialGradient>
<clipPath id="cascaClip"><path d="M0 26 C52 26 96 70 96 140 C96 215 64 300 24 372 Q0 400 -24 372 C-64 300 -96 215 -96 140 C-96 70 -52 26 0 26Z"/></clipPath>
`;
const CASCA = 'M0 26 C52 26 96 70 96 140 C96 215 64 300 24 372 Q0 400 -24 372 C-64 300 -96 215 -96 140 C-96 70 -52 26 0 26Z';

/* ===================== céu e fundo ===================== */
const SKYK = [[0, '#0B1433', '#1A2A58', '#33447A'], [.4, '#3A5886', '#DE8F7C', '#FFC98E'], [.75, '#5B98C9', '#C2DBE6', '#FFEBC4'], [1, '#6CB1E8', '#AAD5F0', '#EAF5FA']];
function skyAt(k) { let a = SKYK[0], b = SKYK[1]; for (let i = 0; i < SKYK.length - 1; i++) if (k >= SKYK[i][0]) { a = SKYK[i]; b = SKYK[i + 1]; } const q = range(k, a[0], b[0]); return [1, 2, 3].map(i => mix(a[i], b[i], q)); }
function ceu(k, t) {
  const [c1, c2, c3] = skyAt(k), id = nid('sk');
  def(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="-250" x2="0" y2="1500"><stop offset="0" stop-color="${c1}"/><stop offset=".5" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>`);
  let s = `<rect x="-900" y="-1400" width="2900" height="4600" fill="url(#${id})"/>`;
  const sa = clamp((k - .08) / .35), sy = 300 - k * 140;
  s += `<circle cx="1020" cy="${f1(sy)}" r="${f1(560 + k * 140)}" fill="url(#gSun)" opacity="${op(sa * (.5 + .35 * k))}"/><circle cx="1020" cy="${f1(sy)}" r="64" fill="#FFF6D8" opacity="${op(sa * .95)}"/>`;
  s += blur(30, `<ellipse cx="300" cy="120" rx="520" ry="70" fill="#fff" opacity=".2"/><ellipse cx="900" cy="560" rx="460" ry="60" fill="#fff" opacity=".16"/><ellipse cx="200" cy="900" rx="560" ry="80" fill="#fff" opacity=".14"/>`);
  return s;
}
function bokeh(n, x0, y0, w, h, cols, r0, r1, t, seed = 0, a = .35) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + hh(i, seed) * w + Math.sin(t * .3 + i) * 10, y = y0 + hh(i, seed + 1) * h + Math.cos(t * .25 + i * 1.7) * 8;
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(lerp(r0, r1, hh(i, seed + 2)))}" fill="${cols[Math.floor(hh(i, seed + 3) * cols.length)]}" opacity="${f1(a * (.45 + .55 * hh(i, seed + 4)))}"/>`;
  }
  return s;
}
const polen = t => Array.from({ length: 26 }, (_, i) => {
  const x = -200 + hh(i, 1) * 1500 + Math.sin(t * .5 + i) * 30, y = ((-300 + hh(i, 2) * 2200 - t * (14 + 20 * hh(i, 3))) % 2200 + 2200) % 2200 - 300, r = 2 + hh(i, 4) * 3.5;
  return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 3)}" fill="#FFE9B0" opacity=".1"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="#FFF3CC" opacity="${f1(.25 + .4 * hh(i, 5))}"/>`;
}).join('');

function folha(len, wid, c1 = '#79B650', c2 = '#3F8A3C', vein = '#D8EDB0') {
  let s = `<path d="M0 0 C${f1(wid * .62)} ${f1(-len * .2)} ${f1(wid * .56)} ${f1(-len * .78)} 0 ${-len} C${f1(-wid * .56)} ${f1(-len * .78)} ${f1(-wid * .62)} ${f1(-len * .2)} 0 0Z" fill="${c1}"/>`;
  s += `<path d="M0 0 C${f1(-wid * .62)} ${f1(-len * .2)} ${f1(-wid * .56)} ${f1(-len * .78)} 0 ${-len}Z" fill="${c2}" opacity=".5"/>`;
  s += `<path d="M0 0 L0 ${f1(-len * .97)}" stroke="${vein}" stroke-width="${f1(Math.max(2, wid * .035))}" fill="none" stroke-linecap="round"/>`;
  for (let k = 1; k <= 6; k++) { const y = -len * (.1 + .13 * k), e = wid * (.5 - k * .045); s += `<path d="M0 ${f1(y)} Q${f1(e * .5)} ${f1(y - len * .02)} ${f1(e)} ${f1(y - len * .1)} M0 ${f1(y)} Q${f1(-e * .5)} ${f1(y - len * .02)} ${f1(-e)} ${f1(y - len * .1)}" stroke="${vein}" stroke-width="${f1(Math.max(1.4, wid * .016))}" fill="none" opacity=".55" stroke-linecap="round"/>`; }
  return s;
}
const fol = (x, y, rot, len, wid, c1, c2, vein) => `<g transform="translate(${x},${y}) rotate(${f1(rot)})">${folha(len, wid, c1, c2, vein)}</g>`;
function folhagemFundo(t) {
  const cols = ['#173F3A', '#1E5446', '#2A6B4A', '#386F4E'];
  const Ls = [[-120, 1700, 28, 900, 340, 0], [150, 1950, 12, 1000, 360, 1], [980, 1850, -24, 950, 330, 0], [1250, 1500, -52, 800, 300, 2], [-200, 900, 62, 700, 280, 1], [1260, 700, -70, 720, 280, 0], [-100, 120, 130, 640, 260, 2], [1180, 90, -135, 680, 260, 1], [420, 2100, -4, 1100, 380, 2], [760, 2120, 6, 1000, 340, 1]];
  return Ls.map(([x, y, r, len, wid, ci], i) => fol(x, y, r + Math.sin(t * .6 + i) * 1.6, len, wid, cols[ci], mix(cols[ci], '#0A1F1A', .5), '#9CC88A')).join('');
}
function primeiroPlano(t) {
  return fol(-80, 1980, 30 + Math.sin(t * .5) * 1.5, 820, 330, '#0B2724', '#06120F', '#1A4A3A') + fol(1180, 1990, -34 + Math.sin(t * .45 + 1) * 1.5, 860, 330, '#0B2724', '#06120F', '#1A4A3A') + fol(1250, -40, -140, 600, 240, '#0B2724', '#06120F', '#1A4A3A');
}

/* ===================== galho e almofada de seda ===================== */
const galho = x => ({ c: 344 + (x - 560) * .045 + Math.sin(x / 190) * 9, w: 54 - (x + 500) * .0085 });
const PAD = { x: 560, y: 0 }; PAD.y = galho(560).c + galho(560).w / 2 - 3;
function ramo() {
  const xs = []; for (let x = -600; x <= 1700; x += 50) xs.push(x);
  const top = xs.map(x => [x, galho(x).c - galho(x).w / 2]), bot = xs.map(x => [x, galho(x).c + galho(x).w / 2]);
  const P = a => a.map(p => `${f1(p[0])} ${f1(p[1])}`).join(' L');
  let s = `<path d="M${P(top.concat(bot.slice().reverse()))}Z" fill="url(#casca)"/>`;
  for (const f of [.22, .42, .62, .8]) s += `<path d="M${xs.map(x => { const g = galho(x); return `${x} ${f1(g.c - g.w / 2 + g.w * f + Math.sin(x / 37 + f * 9) * 2.4)}`; }).join(' L')}" stroke="#3E2616" stroke-width="2.6" fill="none" opacity=".45" stroke-dasharray="${f1(60 + f * 80)} ${f1(18 + f * 30)}" stroke-linecap="round"/>`;
  s += `<path d="M${P(top.map(p => [p[0], p[1] + 3]))}" stroke="#F6D29A" stroke-width="5" fill="none" opacity=".8" stroke-linecap="round"/>`;
  for (const x of [130, 760, 1010, 1330]) { const g = galho(x); s += `<ellipse cx="${x}" cy="${f1(g.c + 2)}" rx="22" ry="${f1(g.w * .3)}" fill="#3E2616" opacity=".4"/>`; }
  return s;
}
function galhoTudo(t) {
  const sw = k => Math.sin(t * .8 + k) * 1.8;
  let s = `<path d="M880 ${f1(galho(880).c)} Q940 250 1050 160" stroke="#6A4630" stroke-width="18" fill="none" stroke-linecap="round"/><path d="M300 ${f1(galho(300).c + 10)} Q250 420 160 520" stroke="#6A4630" stroke-width="16" fill="none" stroke-linecap="round"/>`;
  s += fol(300, 470, -120 + sw(1), 400, 180, '#79B650', '#3F8A3C', '#D8EDB0');
  s += fol(160, 520, -160 + sw(2), 360, 160, '#6FAE4C', '#3A8038', '#D8EDB0');
  s += ramo();
  s += fol(930, 262, 28 + sw(3), 470, 210, '#7DBA52', '#3F8A3C', '#E0F0B8');
  s += fol(1050, 168, -18 + sw(4), 430, 190, '#86C25A', '#44903E', '#E0F0B8');
  s += fol(900, 330, 84 + sw(5), 400, 176, '#70AE4C', '#3A8038', '#D8EDB0');
  // almofada de seda onde a lagarta se prende
  s += `<ellipse cx="${PAD.x}" cy="${f1(PAD.y - 3)}" rx="42" ry="15" fill="#F5EFDC"/>`;
  for (let i = 0; i < 11; i++) { const a = (i - 5) * 9, x1 = PAD.x + a * .9, x2 = PAD.x + a * 2.3; s += `<path d="M${f1(x1)} ${f1(PAD.y)} L${f1(x2)} ${f1(PAD.y + 26 + hh(i) * 22)}" stroke="#fff" stroke-width="1.8" opacity=".7" stroke-linecap="round"/>`; }
  return s;
}
function ext(t, k, subject) {
  let s = lay(.08, ceu(k, t));
  s += lay(.3, blur(3, bokeh(30, -200, -500, 1500, 1700, ['#FFE9B8', '#FFD08A', '#FFF6DA', '#BFE0FF'], 12, 52, t, 3, .45)));
  s += lay(.45, blur(14, folhagemFundo(t)));
  s += lay(.8, polen(t));
  s += lay(1, galhoTudo(t) + subject);
  s += lay(1.25, blur(20, primeiroPlano(t)));
  return s;
}

/* ===================== lagarta-monarca ===================== */
const NSEG = 12, LCAT = 900, RCAT = 80;
function espinha(curv, hook0 = .4, thmax = 2.6) {
  const N = 120, pts = [{ x: PAD.x, y: PAD.y + 6, th: 0 }], ds = LCAT / N; let x = PAD.x, y = PAD.y + 6;
  for (let i = 1; i <= N; i++) { const th = curv * thmax * smooth(range((i - .5) / N, hook0, 1)); x += Math.sin(th) * ds; y += Math.cos(th) * ds; pts.push({ x, y, th }); }
  return pts;
}
const emU = (pts, u) => { const f = clamp(u) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), q = f - i, a = pts[i], b = pts[i + 1]; return { x: lerp(a.x, b.x, q), y: lerp(a.y, b.y, q), th: lerp(a.th, b.th, q) }; };
function segmentoSVG(ds, r, o = {}) {
  const f = o.fade ?? 1, base = o.base || '#151515', cr = o.crum || 0;
  let s = `<ellipse rx="${f1(ds * .62)}" ry="${f1(r)}" fill="${base}"/>`;
  if (f > .01) s += `<g opacity="${op(f)}"><ellipse cx="${f1(ds * .04)}" rx="${f1(ds * .27)}" ry="${f1(r * .97)}" fill="#EFE23A"/><ellipse cx="${f1(-ds * .31)}" rx="${f1(ds * .11)}" ry="${f1(r * .94)}" fill="#F7F3E2"/><ellipse cx="${f1(ds * .37)}" rx="${f1(ds * .065)}" ry="${f1(r * .9)}" fill="#F7F3E2"/><circle cx="${f1(ds * .05)}" cy="${f1(r * .12)}" r="${f1(Math.max(2, r * .045))}" fill="#F7F3E2" stroke="#151515" stroke-width="1.6"/></g>`;
  if (cr > 0) s += `<ellipse cx="${f1(ds * .14)}" rx="${f1(ds * .5)}" ry="${f1(r * .94)}" fill="#EFE23A" opacity="${op(cr)}"/><ellipse cx="${f1(-ds * .53)}" rx="${f1(ds * .045)}" ry="${f1(r * .9)}" fill="#F7F3E2" opacity="${op(cr)}"/>`;
  return s + `<ellipse rx="${f1(ds * .62)}" ry="${f1(r)}" fill="url(#tubo)"/>`;
}
function cabeca(rh, o = {}) {
  const bl = o.blink || 0;
  let s = `<ellipse cx="${f1(rh * .25)}" rx="${f1(rh * 1.05)}" ry="${f1(rh * .98)}" fill="#141414"/>`;
  s += `<path d="M${f1(-rh * .5)} ${f1(-rh * .85)} Q${f1(rh * .12)} ${f1(-rh * .2)} ${f1(-rh * .5)} ${f1(rh * .85)}" stroke="#F0E23C" stroke-width="${f1(rh * .24)}" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M${f1(rh * .06)} ${f1(-rh * .95)} Q${f1(rh * .62)} ${f1(-rh * .2)} ${f1(rh * .06)} ${f1(rh * .95)}" stroke="#F7F3E2" stroke-width="${f1(rh * .2)}" fill="none" stroke-linecap="round"/>`;
  for (const [ex, ey] of [[.6, -.3], [.54, .36]]) s += `<circle cx="${f1(rh * ex)}" cy="${f1(rh * ey)}" r="${f1(rh * .2)}" fill="#fff"/><circle cx="${f1(rh * (ex + .06))}" cy="${f1(rh * (ey + .01))}" r="${f1(rh * .115 * (1 - bl * .9))}" fill="#0A0A0A"/><circle cx="${f1(rh * (ex + .09))}" cy="${f1(rh * (ey - .04))}" r="${f1(rh * .04)}" fill="#fff"/>`;
  s += `<ellipse cx="${f1(rh * 1.0)}" cy="${f1(rh * .04)}" rx="${f1(rh * .08)}" ry="${f1(rh * .16)}" fill="#2B0F0F"/>`;
  return s + `<ellipse cx="${f1(rh * .2)}" cy="${f1(-rh * .5)}" rx="${f1(rh * .55)}" ry="${f1(rh * .2)}" fill="#fff" opacity=".18"/>`;
}
// s = quanto a pele já subiu (0 = lagarta inteira, 1 = pele enrolada na almofada)
function lagarta(t, o = {}) {
  const curv = o.curv ?? 1, s = o.s ?? 0, sp = espinha(curv), comp = 1 - s * .82, n = NSEG, bl = o.blink || 0;
  let g = '';
  for (let i = 0; i < n; i++) {
    const u = (i + .5) / n, p = emU(sp, u * comp), prof = .66 + .34 * Math.sin(Math.PI * (.1 + .8 * u));
    const peri = 1 + .055 * Math.sin(t * 4.2 - u * 8) * (1 - s), r = RCAT * prof * peri * (1 + .3 * s), ds = LCAT / n * comp, rx = Math.max(ds * .62, r * .3 * s);
    const ang = Math.atan2(Math.cos(p.th), Math.sin(p.th)) * 180 / Math.PI;
    let seg = segmentoSVG(rx / .62, r, { crum: smooth(range(s, .3, .8)) });
    const ten = (r0, len, ph) => { const sw = Math.sin(t * 3.1 + ph) * 12, sw2 = Math.sin(t * 2.3 + ph * 1.7) * 7; const xm = -14 + sw * .4, ym = r0 + len * .55, xe = -24 + sw + sw2, ye = r0 + len; return `<g opacity="${op(1 - s * 1.4)}"><path d="M-6 ${f1(r0 * .85)} Q${f1(xm)} ${f1(ym)} ${f1(xm * .9 + xe * .1)} ${f1(ym + len * .08)}" stroke="#121212" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M${f1(xm * .9 + xe * .1)} ${f1(ym + len * .08)} Q${f1(lerp(xm, xe, .7))} ${f1(ym + len * .3)} ${f1(xe)} ${f1(ye)}" stroke="#121212" stroke-width="7" fill="none" stroke-linecap="round"/></g>`; };
    if (s < .7) { if (i === 9) seg += ten(r, 120, 0) + ten(r, 96, 2); if (i === 2) seg += ten(r, 70, 4) + ten(r, 58, 6); }
    if (i >= 3 && i <= 6) seg = `<path d="M-14 ${f1(-r + 2)} L-11 ${f1(-r - 14)} L11 ${f1(-r - 14)} L14 ${f1(-r + 2)}Z" fill="#E7DE9A" stroke="#6B6420" stroke-width="2"/><rect x="-10" y="${f1(-r - 17)}" width="20" height="4" rx="2" fill="#2A2A20"/>` + seg;
    if (i === 9 || i === 10) seg = `<path d="M-8 ${f1(-r + 4)} L-4 ${f1(-r - 20)} L4 ${f1(-r - 20)} L8 ${f1(-r + 4)}Z" fill="#1A1A1A"/>` + seg;
    g += `<g transform="translate(${f1(p.x)},${f1(p.y)}) rotate(${f1(ang)})">${seg}</g>`;
  }
  const pe = emU(sp, comp), ae = Math.atan2(Math.cos(pe.th), Math.sin(pe.th)) * 180 / Math.PI, rh = 64 * (1 + .12 * s);
  g += `<g transform="translate(${f1(pe.x)},${f1(pe.y)}) rotate(${f1(ae)})">${cabeca(rh, { blink: bl })}</g>`;
  return g;
}
function pontaDaCabeca(curv, s) { const sp = espinha(curv), p = emU(sp, 1 - s * .94); return p; }

/* ===================== crisálida ===================== */
const GOLD = '#FFD23F';
function dobrada(P) {          // a borboleta dobrada dentro da casca (coordenadas locais)
  const w = easeOut(P.wing || 0), b = easeOut(P.body || 0), e = easeOut(P.eye || 0), a = easeOut(P.ant || 0), l = easeOut(P.leg || 0);
  let ins = '', hd = '';
  if (w > 0) {
    for (const sg of [-1, 1]) {
      ins += `<g transform="translate(${sg * 62},150) scale(${f1(w * 1000) / 1000}) translate(${-sg * 62},-150)" opacity="${op(Math.min(1, w * 1.7))}"><path d="M${sg * 8} 0 L${sg * 130} 0 L${sg * 130} 340 L${sg * 18} 376Z" fill="url(#asaG)"/>`;
      [[92, 150], [88, 205], [74, 255], [58, 298], [40, 334], [22, 362]].forEach(([x, y]) => { ins += `<path d="M${sg * 14} 78 Q${sg * (x * .55 + 14)} ${f1((y + 78) / 2 - 6)} ${sg * x} ${y}" stroke="#171310" stroke-width="3.4" fill="none" stroke-linecap="round"/>`; });
      ins += `</g>`;
    }
    ins += `<path d="${CASCA}" fill="none" stroke="#161210" stroke-width="${f1(26 * w)}" opacity="${op(w)}"/>`;
    for (const sg of [-1, 1]) for (let k = 0; k < 8; k++) { const q = .14 + k * .115, p = bez([96, 140], [96, 215], [64, 300], [24, 372], q); ins += `<circle cx="${f1(sg * (p[0] - 11))}" cy="${f1(p[1])}" r="${f1(4.6 - Math.abs(k - 3.5) * .25)}" fill="#F8F4E4" opacity="${op(w)}"/>`; }
  }
  if (b > 0) {
    ins += `<g opacity="${op(b)}"><path d="M-9 52 C-13 100 -19 160 -17 230 C-15 290 -10 320 0 342 C10 320 15 290 17 230 C19 160 13 100 9 52Z" fill="#17120E"/>`;
    for (let i = 0; i < 12; i++) ins += `<circle cx="${i % 2 ? 5 : -5}" cy="${70 + i * 22}" r="2.5" fill="#F8F4E4"/>`;
    ins += `</g>`;
  }
  if (e > 0 || a > 0 || l > 0) {
    hd += `<g>`;
    if (l > 0) for (const sg of [-1, 1]) [[222, 250, 36, 16], [236, 276, 30, 14], [252, 300, 24, 12]].forEach(([y0, y1, dx, dx2], i) => { const k = clamp(l * 3 - i); if (k > 0) hd += `<path d="M${sg * 10} ${y0} L${sg * (10 + dx * k)} ${f1(y0 + (y1 - y0) * k)} L${sg * (10 + dx * k - dx2 * .4 * k)} ${f1(y1 + 26 * k)}" stroke="#241E18" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; });
    if (a > 0) for (const sg of [-1, 1]) hd += `<path d="M${sg * 7} 326 Q${sg * 44} 280 ${sg * 38} 190" stroke="#171310" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="${f1(150 * a)} 200"/><ellipse cx="${sg * 38}" cy="${f1(190 + (1 - a) * 150)}" rx="4.4" ry="8" fill="#171310" opacity="${op(a * 3 - 2)}"/>`;
    hd += `<circle cx="0" cy="338" r="${f1(17 * clamp(Math.max(e, b)))}" fill="#17120E"/>`;
    if (e > 0) for (const sg of [-1, 1]) hd += `<circle cx="${sg * 9.5}" cy="334" r="${f1(8.6 * e)}" fill="#26272E"/><circle cx="${sg * 7.4}" cy="${f1(331.4)}" r="${f1(2.6 * e)}" fill="#fff" opacity=".9"/><path d="M${sg * 4} 338 l${sg * 6} -4 M${sg * 4} 342 l${sg * 8} -3" stroke="#555a66" stroke-width="1.2" opacity="${op(e * .8)}"/>`;
    hd += `</g>`;
  }
  return { ins, hd };
}
function cabecaSaindo(t, hy, k) {          // cabeça de fora da casca (olhando para baixo): antenas para fora, pernas agarrando a borda
  const wv = Math.sin(t * 5) * 5, wv2 = Math.sin(t * 4.1 + 1) * 5;
  let s = `<path d="M-9 322 L9 322 L9 ${f1(hy)} L-9 ${f1(hy)}Z" fill="#17120E"/>`;
  for (const sg of [-1, 1]) [[-40, 14], [-58, 22], [-76, 30]].forEach(([dy, dx], i) => { s += `<path d="M${sg * 9} ${f1(hy + dy)} L${sg * (24 + dx * k)} ${f1(hy + dy - 16 - 8 * k)} L${sg * (28 + dx * k)} ${f1(392 - i * 7)}" stroke="#241E18" stroke-width="4.2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${op(k * 3 - i * .6)}"/>`; });
  for (const sg of [-1, 1]) { const w = sg > 0 ? wv : wv2, ex = sg * (40 + w * 1.3); s += `<path d="M${sg * 7} ${f1(hy + 10)} Q${f1(sg * (34 + w))} ${f1(hy + 26)} ${f1(ex)} ${f1(hy + 62)}" stroke="#171310" stroke-width="3.6" fill="none" stroke-linecap="round"/><ellipse cx="${f1(ex)}" cy="${f1(hy + 68)}" rx="4.8" ry="8.6" fill="#171310" transform="rotate(${sg * -18} ${f1(ex)} ${f1(hy + 68)})"/>`; }
  s += `<circle cx="0" cy="${f1(hy)}" r="18" fill="#17120E"/>`;
  for (const sg of [-1, 1]) s += `<circle cx="${sg * 9.5}" cy="${f1(hy + 5)}" r="8.8" fill="#26272E"/><circle cx="${sg * 7.4}" cy="${f1(hy + 7.6)}" r="2.8" fill="#fff" opacity=".9"/>`;
  return s;
}
function crisalida(t, o = {}) {
  const a = o.a ?? 1, rach = o.rach ?? 0, pat = o.pat ?? 0, P = o.P || { wing: 1, body: 1, eye: 1, ant: 1, leg: 1 }, em = o.emerge ?? 0;
  const dentro = pat > 0 ? dobrada(P) : null, fx = range(em, 0, .12);
  let hole = null; if (rach > 0) { const rx0 = 6 + 24 * rach, ry0 = 5 + 19 * rach; hole = nid('mk'); def(`<mask id="${hole}" maskUnits="userSpaceOnUse" x="-130" y="-10" width="260" height="480"><rect x="-130" y="-10" width="260" height="480" fill="#fff"/><ellipse cx="0" cy="382" rx="${f1(rx0)}" ry="${f1(ry0)}" fill="#000"/></mask>`); }
  let s = `<path d="M-5 -2 L5 -2 L4 30 L-4 30Z" fill="#17120E"/>`;
  if (pat > 0) s += `<g opacity="${op(pat)}"><g clip-path="url(#cascaClip)">${dentro.ins}</g></g><g opacity="${op(pat * (1 - fx))}">${dentro.hd}</g>`;
  if (hole) s += `<g mask="url(#${hole})">`;
  s += `<path d="${CASCA}" fill="url(#jade)" opacity="${op(a)}"/>`;
  s += `<path d="M-62 120 Q-44 224 -14 330 M62 120 Q44 224 14 330 M-30 60 Q-26 200 -8 340 M30 60 Q26 200 8 340" stroke="#4FA848" stroke-width="3" fill="none" opacity="${op(.4 * a)}" stroke-linecap="round"/>`;
  const by = x => 98 + 38 * (1 - (x / 96) ** 2), bandPts = []; for (let x = -94; x <= 94; x += 8) bandPts.push(`${x} ${f1(by(x))}`);
  s += `<path d="M${bandPts.join(' L')}" stroke="#17120E" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${op(.55 + .45 * a)}"/>`;
  for (let x = -84; x <= 84; x += 14) s += `<circle cx="${x}" cy="${f1(by(x) - 1)}" r="5.2" fill="${GOLD}" stroke="#B8860B" stroke-width="1"/><circle cx="${x - 1.5}" cy="${f1(by(x) - 3)}" r="1.6" fill="#fff" opacity=".9"/>`;
  for (let k = -3; k <= 3; k++) s += `<circle cx="${k * 9}" cy="${f1(344 + 3 * k * k / 3)}" r="3.6" fill="${GOLD}" stroke="#B8860B" stroke-width=".8"/>`;
  s += `<path d="M-70 96 Q-40 44 28 48" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round" opacity=".55"/><ellipse cx="-44" cy="150" rx="9" ry="34" fill="#fff" opacity=".22" transform="rotate(8 -44 150)"/>`;
  s += `<path d="${CASCA}" fill="none" stroke="#2E7A3E" stroke-width="3" opacity=".7"/><path d="${CASCA}" fill="none" stroke="#B8F59A" stroke-width="2" opacity="${op(.7 * (1 - a) + .2)}" transform="scale(.985) translate(0,3)"/>`;
  if (hole) s += '</g>';
  if (rach > 0) {            // rachaduras irregulares + boca que se abre no bico da casca
    const e = rach, c0 = 384;
    const zig = (x0, len, dir) => { let d = `M${x0} ${c0 - 4}`; for (let i = 1; i <= 7; i++) d += ` L${f1(x0 + dir * (i % 2 ? 7 : -2) * (1 + hh(i, x0)))} ${f1(c0 - 4 - len * e * i / 7)}`; return d; };
    for (const [x0, len, dir] of [[0, 96, 1], [-15, 56, -1], [15, 56, 1]]) s += `<path d="${zig(x0, len, dir)}" stroke="#1F4A2C" stroke-width="3.6" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="${zig(x0, len, dir)}" stroke="#C8F6AA" stroke-width="1.2" fill="none" stroke-linejoin="round" opacity=".7" transform="translate(2,0)"/>`;
    const rx = 6 + 24 * e, ry = 5 + 19 * e;
    s += `<ellipse cx="0" cy="${c0 - 2}" rx="${f1(rx)}" ry="${f1(ry)}" fill="none" stroke="#1F4A2C" stroke-width="4"/><path d="M${f1(-rx)} ${c0 - 2} Q${f1(-rx)} ${f1(c0 - 2 - ry)} 0 ${f1(c0 - 2 - ry)} Q${f1(rx)} ${f1(c0 - 2 - ry)} ${f1(rx)} ${c0 - 2}" stroke="#C8F6AA" stroke-width="3" fill="none" opacity=".9"/>`;
    for (const sg of [-1, 1]) s += `<path d="M${f1(sg * (rx + 2))} ${c0 - 8} Q${f1(sg * (rx + 22 * e))} ${c0 + 4} ${f1(sg * (rx + 14 * e))} ${f1(c0 + 8 + 20 * e)}" stroke="#7CCB62" stroke-width="5" fill="none" stroke-linecap="round" opacity="${op(e)}"/>`;
  }
  if (em > 0) s += `<g opacity="${op(fx)}">${cabecaSaindo(t, 338 + em * 96, em)}</g>`;
  return s;
}

/* ===================== interior da crisálida ===================== */
const SPINE_IN = u => ({ x: 36 * Math.sin(2 * Math.PI * 1.3 * u + .5) * (1 - .25 * u), y: 60 + 300 * u });
function lagartaDentro(t, m) {
  const n = NSEG; let g = '';
  for (let i = 0; i < n; i++) {
    const u = (i + .5) / n, a = SPINE_IN(u), b = SPINE_IN(u + .01), ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    const q = smooth(range(m, .04 + .46 * hh(i, 4), .4 + .5 * hh(i, 4)));
    if (q >= 1) continue;
    const prof = .68 + .32 * Math.sin(Math.PI * (.1 + .8 * u)), peri = 1 + .05 * Math.sin(t * 4 - u * 8), r = 24 * prof * peri * (1 + .4 * q);
    const dx = (hh(i, 2) - .5) * q * 30, dy = q * (16 + 26 * hh(i, 1));
    const body = segmentoSVG(27, r, { fade: 1 - smooth(q * 1.7), base: mix('#151515', '#B8A838', smooth(q * 1.4)) });
    g += `<g transform="translate(${f1(a.x + dx)},${f1(a.y + dy)}) rotate(${f1(ang + q * (hh(i, 6) - .5) * 50)})" opacity="${op(1 - q * q)}"${q > .08 ? ` filter="url(#${fb(q * 4.2)})"` : ''}>${body}</g>`;
    if (q > .05 && q < .95) for (let k = 0; k < 3; k++) { const ph = (t * (.9 + .4 * hh(i, k)) + hh(i, k + 8)) % 1; g += `<circle cx="${f1(a.x + dx + (hh(i, k + 5) - .5) * r * 1.6)}" cy="${f1(a.y + dy + r * .4 + ph * 60)}" r="${f1(2.2 + 3 * hh(i, k + 3) * (1 - ph * .5))}" fill="#E4D24A" opacity="${op(q * (1 - ph) * 1.2)}"/>`; }
  }
  const qh = smooth(range(m, .55, .98));
  if (qh < 1) { const a = SPINE_IN(1), b = SPINE_IN(.99), ang = Math.atan2(a.y - b.y, a.x - b.x) * 180 / Math.PI; g += `<g transform="translate(${f1(a.x + 14 * Math.cos(ang * Math.PI / 180))},${f1(a.y + 14 * Math.sin(ang * Math.PI / 180) + qh * 24)}) rotate(${f1(ang + qh * 30)})" opacity="${op(1 - qh * qh)}"${qh > .08 ? ` filter="url(#${fb(qh * 4.2)})"` : ''}>${cabeca(25 * (1 + .3 * qh))}</g>`; }
  return g;
}
function enzimas(t, L, k) {
  if (k <= 0) return '';
  let s = '';
  for (let j = 0; j < 22; j++) {
    const seg = SPINE_IN(((j * 5) % 12 + .5) / 12), ph = hh(j, 1) * 6.28, conv = range(L, .35, 1.5), rad = lerp(110, 18, conv) * (1 + .2 * Math.sin(t * 2 + j));
    const ang = t * (1.1 + hh(j, 2)) + ph, x = seg.x + Math.cos(ang) * rad, y = seg.y + Math.sin(ang) * rad * .9, rot = ang * 57.3 + 90;
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="9" fill="#FFF3A0" opacity="${op(.2 * k)}"/><g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)})" opacity="${op(k)}"><rect x="-2.6" y="-5.4" width="5.2" height="10.8" rx="2.6" fill="#FFF6B8" stroke="#FFD23F" stroke-width="1.1"/><path d="M-2.6 0 L2.6 0" stroke="#FFD23F" stroke-width=".9"/></g>`;
  }
  return s;
}
function piscina(t, pool, dark) {
  if (pool <= 0) return '';
  const lv = lerp(412, 36, easeInOut(pool)), top = mix('#E8D24A', '#6A5E1E', dark), mid = mix('#B9A734', '#4A4416', dark), bot = mix('#7C7A24', '#2A2A10', dark), id = nid('pl');
  def(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".35" stop-color="${mid}"/><stop offset="1" stop-color="${bot}"/></linearGradient>`);
  let d = `M-130 ${f1(lv)}`; const pts = [];
  for (let x = -130; x <= 130; x += 10) { const y = lv + 5 * Math.sin(x / 22 + t * 2.2) + 3 * Math.sin(x / 9 - t * 3); pts.push([x, y]); d += ` L${x} ${f1(y)}`; }
  d += ' L130 430 L-130 430Z';
  let s = `<path d="${d}" fill="url(#${id})"/>`;
  s += `<path d="M${pts.map(p => `${p[0]} ${f1(p[1])}`).join(' L')}" stroke="${mix('#FFF6A8', '#8A8030', dark)}" stroke-width="3.4" fill="none" opacity=".85" stroke-linecap="round"/>`;
  for (let i = 0; i < 6; i++) { const y = lv + 30 + i * 52 + Math.sin(t + i) * 6; if (y < 420) s += `<path d="M${-90 + hh(i) * 40} ${f1(y)} q30 ${-14 + hh(i, 1) * 10} 60 0 t60 0" stroke="${mix('#FFF4B0', '#7A7030', dark)}" stroke-width="3" fill="none" opacity=".4" stroke-linecap="round"/>`; }
  for (let i = 0; i < 26; i++) {
    const ph = (t * (.16 + .22 * hh(i, 1)) + hh(i, 2)) % 1, y = lerp(420, lv, ph), r = 3 + 8 * hh(i, 3), x = -86 + 172 * hh(i, 4) + Math.sin(t * 1.4 + i) * 6;
    if (y > lv + 4) s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="url(#bolhaG)" stroke="#fff" stroke-width="1.1" stroke-opacity=".55"/><circle cx="${f1(x - r * .3)}" cy="${f1(y - r * .32)}" r="${f1(r * .22)}" fill="#fff" opacity=".85"/>`;
  }
  return s;
}
function traqueias(op0) {
  let s = '';
  for (const sg of [-1, 1]) {
    s += `<path d="M${sg * 84} 110 Q${sg * 74} 200 ${sg * 46} 304 M${sg * 78} 150 q${sg * -26} 18 ${sg * -44} 54 M${sg * 70} 214 q${sg * -22} 12 ${sg * -38} 40 M${sg * 60} 258 q${sg * -18} 8 ${sg * -30} 30" stroke="#F6F0D2" stroke-width="2.8" fill="none" stroke-linecap="round" opacity="${op(op0)}"/>`;
    for (const [x, y] of [[84, 110], [78, 150], [70, 214], [60, 258], [46, 304]]) s += `<circle cx="${sg * x}" cy="${y}" r="3.4" fill="#fff" opacity="${op(op0)}"/>`;
  }
  return s;
}
// discos imaginais: ign = progresso de ignição de cada um (0..1); tipos: asa, olho, antena, perna
const DISCOS = [['asa', -58, 112, 'gDo', .35], ['asa', 58, 112, 'gDo', .6], ['asa', -52, 205, 'gDo', .85], ['asa', 52, 205, 'gDo', 1.1], ['perna', -30, 256, 'gDl', 1.4], ['perna', 30, 286, 'gDl', 1.6], ['antena', -42, 318, 'gDm', 1.85], ['antena', 42, 318, 'gDm', 2.05], ['olho', -15, 344, 'gDc', 2.3], ['olho', 15, 344, 'gDc', 2.5]];
function discos(t, L, fade) {
  let s = '';
  DISCOS.forEach(([tp, x, y, gr, t0], i) => {
    const ig = range(L, t0, t0 + .4); if (ig <= 0) return;
    const pop = backOut(ig), pul = 1 + .12 * Math.sin(t * 3.2 + i), a = fade;
    s += `<g opacity="${op(a)}"><circle cx="${x}" cy="${y}" r="${f1(46 * pop * pul)}" fill="url(#${gr})"/>`;
    s += `<circle cx="${x}" cy="${y}" r="${f1(5.5 * pop)}" fill="#fff"/>`;
    for (let k = 0; k < 8; k++) { const an = k * .785 + t * .5 * (i % 2 ? 1 : -1), rr = 13 * pop; s += `<circle cx="${f1(x + Math.cos(an) * rr)}" cy="${f1(y + Math.sin(an) * rr)}" r="${f1(2.3 * pop)}" fill="#fff" opacity=".9"/>`; }
    const q = range(L, t0, t0 + .7); if (q > 0 && q < 1) s += `<circle cx="${x}" cy="${y}" r="${f1(8 + 60 * easeOut(q))}" fill="none" stroke="#fff" stroke-width="2.4" opacity="${op((1 - q) * .8)}"/>`;
    s += `</g>`;
  });
  return s;
}
function cavidade(dark) {
  const id = nid('cv'); def(`<radialGradient id="${id}" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="${mix('#E4F7BE', '#2E4C2A', dark)}"/><stop offset=".6" stop-color="${mix('#9AD47A', '#1E3A22', dark)}"/><stop offset="1" stop-color="${mix('#3C8A52', '#0C1E12', dark)}"/></radialGradient>`);
  return `<rect x="-140" y="0" width="280" height="440" fill="url(#${id})"/><ellipse cx="46" cy="90" rx="120" ry="90" fill="url(#gWarm)" opacity="${op(.55 * (1 - dark))}"/>`;
}
// o barril inteiro (em coordenadas locais). o: m, pool, dark, enz, L, disc, P (partes), Pa (opacidade das partes), sem lagarta
function barril(t, o) {
  const L = o.L || 0, dark = o.dark || 0;
  let c = cavidade(dark);
  c += piscina(t, o.pool || 0, dark);
  if (!o.semLagarta && (o.m ?? 0) < 1) c += lagartaDentro(t, o.m || 0);
  c += enzimas(t, L, o.enz || 0);
  c += traqueias(.8 - .3 * dark);
  if (o.disc) c += discos(t, o.discL ?? L, o.disc);
  if (o.P) { const D2 = dobrada(o.P); c += `<g opacity="${op(o.Pa ?? 1)}">${D2.ins}${D2.hd}</g>`; }
  let s = `<path d="${CASCA}" fill="#0A2A22" opacity=".55" transform="scale(1.05) translate(0,-6)"/>`;
  s += `<g clip-path="url(#cascaClip)">${c}<path d="${CASCA}" fill="none" stroke="#000" stroke-width="30" opacity=".35"/></g>`;
  s += `<path d="${CASCA}" fill="none" stroke="#A8F08C" stroke-width="6" opacity=".7"/><path d="${CASCA}" fill="none" stroke="#C8FFB0" stroke-width="14" opacity=".18" filter="url(#b4)"/>`;
  s += `<path d="M-70 96 Q-44 52 24 54" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".45"/>`;
  return s;
}
function interior(t, o) {
  let s = lay(.25, `<rect x="-900" y="-1400" width="2900" height="4600" fill="url(#gBack)"/>` + blur(3, bokeh(26, -200, -400, 1500, 1700, ['#3FD6B0', '#B8FF8A', '#6FF0FF'], 8, 36, t, 7, .16)));
  s += lay(1, `<g transform="translate(${PAD.x},${PAD.y}) scale(${PS})">${barril(t, o)}</g>`);
  s += lay(1.4, blur(6, bokeh(10, -200, -400, 1500, 1700, ['#B8FF8A', '#E8FFB0'], 10, 30, t * 1.3, 11, .25)));
  return s;
}

/* ===================== borboleta-monarca (vista de cima) ===================== */
const FW = 'M4 -30 C70 -120 190 -250 320 -300 C372 -318 410 -300 412 -258 C414 -196 372 -118 300 -62 C250 -24 120 6 8 -6Z';
const HW = 'M8 -8 C90 -30 230 -20 300 30 C345 70 330 150 270 200 C220 240 130 240 80 190 C40 150 14 80 8 -8Z';
const dotsAlong = (c, ts, inset, to) => ts.map(q => { const p = bez(c[0], c[1], c[2], c[3], q), dx = to[0] - p[0], dy = to[1] - p[1], d = Math.hypot(dx, dy) || 1; return [p[0] + dx / d * inset, p[1] + dy / d * inset]; });
const FW3 = [[412, -258], [414, -196], [372, -118], [300, -62]], FW4 = [[300, -62], [250, -24], [120, 6], [8, -6]], HW2 = [[300, 30], [345, 70], [330, 150], [270, 200]], HW3 = [[270, 200], [220, 240], [130, 240], [80, 190]];
const veinsOf = (R, ends) => ends.map(E => { const mx = (R[0] + E[0]) / 2, my = (R[1] + E[1]) / 2, px = -(E[1] - R[1]) * .07, py = (E[0] - R[0]) * .07; return `M${R[0]} ${R[1]} Q${f1(mx + px)} ${f1(my + py)} ${f1(E[0])} ${f1(E[1])}`; });
const dotsSVG = (pts, r0) => pts.map((p, i) => `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${f1(r0 - Math.abs(i % 9 - 4) * .35)}" fill="#F8F4E4"/>`).join('');
const FORE = `<path d="${FW}" fill="url(#asaG)"/>` + veinsOf([18, -24], [.12, .3, .5, .7, .9].map(q => bez(...FW3, q)).concat([.3, .65].map(q => bez(...FW4, q)))).map(d => `<path d="${d}" stroke="#171310" stroke-width="7.5" fill="none" stroke-linecap="round"/>`).join('')
  + `<path d="M300 -296 C360 -316 405 -298 410 -256 C412 -210 392 -170 366 -140 C360 -190 340 -250 300 -296Z" fill="#171310"/><path d="${FW}" fill="none" stroke="#171310" stroke-width="24" stroke-linejoin="round"/>`
  + dotsSVG(dotsAlong(FW3, [.04, .15, .27, .39, .5, .62, .74, .86, .97], 13, [120, -110]).concat(dotsAlong(FW4, [.12, .28, .44, .6, .76, .9], 12, [120, -110])), 6.8)
  + [[352, -262, 8], [380, -236, 7], [336, -240, 6.5], [372, -276, 6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFE3B0"/>`).join('');
const HIND = `<path d="${HW}" fill="url(#asaG)"/>` + veinsOf([14, 0], [.25, .55, .85].map(q => bez(...HW2, q)).concat([.25, .6].map(q => bez(...HW3, q)))).map(d => `<path d="${d}" stroke="#171310" stroke-width="7" fill="none" stroke-linecap="round"/>`).join('')
  + `<path d="${HW}" fill="none" stroke="#171310" stroke-width="24" stroke-linejoin="round"/>` + dotsSVG(dotsAlong(HW2, [.1, .24, .38, .52, .66, .8, .92], 12, [120, 80]).concat(dotsAlong(HW3, [.12, .3, .5, .7, .88], 12, [120, 80])), 6.4);
// open: abertura horizontal (0..1, cos do bater); psi: queda das asas (graus); size: tamanho das asas; wet: asas molhadas; swell: abdome inchado
function borboleta(t, o = {}) {
  const { x = 0, y = 0, rot = 0, sc = 1, open = 1, psi = 0, size = 1, wet = 0, swell = 1, legs = 0 } = o;
  const crum = 1 - smooth(range(size, .35, .85));
  const wing = sg => `<g transform="translate(${sg * 6},-22) rotate(${f1(sg * psi)}) scale(${f1(sg * size * Math.max(open, .03) * 1000) / 1000},${f1(size * 1000) / 1000})">${HIND}${FORE}`
    + (wet > 0 ? `<path d="${FW}" fill="#FFF1B8" opacity="${op(.5 * wet)}"/><path d="${HW}" fill="#FFF1B8" opacity="${op(.5 * wet)}"/>` : '')
    + (crum > 0 ? `<path d="M60 -90 q40 20 20 60 M150 -170 q50 10 40 70 M230 -230 q40 30 10 80 M120 60 q50 20 30 70 M210 100 q30 30 0 70" stroke="#3A1A08" stroke-width="7" fill="none" opacity="${op(crum * .6)}" stroke-linecap="round"/>` : '') + `</g>`;
  let b = '';
  const sw = 1 + (swell - 1) * .8;
  b += `<path d="M${f1(-12 * sw)} 20 C${f1(-14 * sw)} 90 -10 190 0 266 C10 190 ${f1(14 * sw)} 90 ${f1(12 * sw)} 20Z" fill="#17120E"/>`;
  for (let i = 0; i < 10; i++) b += `<circle cx="${i % 2 ? 5 : -5}" cy="${40 + i * 22}" r="3" fill="#F8F4E4"/>`;
  b += `<ellipse cx="0" cy="-6" rx="25" ry="47" fill="#17120E"/>`;
  [[-12, -22], [12, -22], [-14, 0], [14, 0], [-10, 20], [10, 20]].forEach(([dx, dy]) => b += `<circle cx="${dx}" cy="${dy}" r="3.2" fill="#F8F4E4"/>`);
  b += `<circle cy="-64" r="21" fill="#17120E"/><circle cx="-9" cy="-68" r="6.5" fill="#2A2C34"/><circle cx="9" cy="-68" r="6.5" fill="#2A2C34"/><circle cx="-10.6" cy="-70" r="2" fill="#fff" opacity=".9"/><circle cx="7.4" cy="-70" r="2" fill="#fff" opacity=".9"/>`;
  if (legs > 0) for (const sg of [-1, 1]) [[-26, 0], [-12, 1], [2, 2]].forEach(([dy, i]) => { b += `<path d="M${sg * 12} ${dy} L${sg * (32 + i * 6)} ${dy - 40} L${sg * (28 + i * 6)} ${dy - 74 - i * 6}" stroke="#241E18" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${op(legs)}"/>`; });
  const ant = Math.sin(t * 2.2) * 4;
  for (const sg of [-1, 1]) b += `<path d="M${sg * 6} -78 Q${f1(sg * 34 + ant * sg)} -150 ${f1(sg * 62 + ant * sg)} -196" stroke="#17120E" stroke-width="4" fill="none" stroke-linecap="round"/><ellipse cx="${f1(sg * 63 + ant * sg)}" cy="-200" rx="7" ry="12" fill="#17120E" transform="rotate(${sg * 18} ${f1(sg * 63 + ant * sg)} -200)"/>`;
  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${f1(sc * 1000) / 1000})">${wing(-1)}${wing(1)}${b}</g>`;
}

/* ===================== etiquetas diegéticas ===================== */
function etiquetaDia(n, t, k, pop) {       // etiqueta de jardim pendurada do alto do quadro, com o contador de dias
  const sy = 1 - .75 * Math.max(0, 1 - pop), sway = Math.sin(t * 1.5) * 1.4 + Math.sin(t * 3.7) * .4;
  return `<g opacity="${op(k)}" transform="translate(230,0) rotate(${f1(sway)})"><path d="M0 -20 L0 304" stroke="#3E2A1A" stroke-width="4"/>
    <g transform="translate(112,330) scale(1.12) scale(1,${f1(sy * 100) / 100})"><rect x="-122" y="-48" width="244" height="96" rx="14" fill="#000" opacity=".28" transform="translate(6,8)"/>
    <path d="M-122 -34 Q-122 -48 -108 -48 L108 -48 Q122 -48 122 -34 L122 34 Q122 48 108 48 L-108 48 Q-122 48 -122 34Z" fill="#FFF1C8" stroke="#3E2A1A" stroke-width="4"/>
    <circle cx="-98" cy="-26" r="8" fill="#3E2A1A"/><circle cx="-98" cy="-26" r="3" fill="#FFF1C8"/><text x="10" y="15" font-size="48" fill="#3E2A1A" text-anchor="middle">DIA ${n}</text></g></g>`;
}
function etiquetaTexto(txt, x, y, k, w = 420) {
  return `<g opacity="${op(k)}" transform="translate(${f1(x)},${f1(y)}) scale(${f1(.92 + .08 * k)})"><rect x="${-w / 2}" y="-38" width="${w}" height="76" rx="38" fill="#08150F" opacity=".78" stroke="#B8FF8A" stroke-width="3"/><text x="0" y="12" font-size="34" fill="#E8FFD0" text-anchor="middle">${txt}</text></g>`;
}
const proj = (wx, wy, p = 1) => { const z = CAM.z0 * (1 + (CAM.z / CAM.z0 - 1) * p), x = CAM.x0 + (CAM.x - CAM.x0) * p, y = CAM.y0 + (CAM.y - CAM.y0) * p, r = CAM.r * Math.PI / 180, dx = (wx - x) * z, dy = (wy - y) * z; return [540 + dx * Math.cos(r) - dy * Math.sin(r), 960 + dx * Math.sin(r) + dy * Math.cos(r)]; };
const loc2w = (lx, ly) => [PAD.x + PS * lx, PAD.y + PS * ly];
