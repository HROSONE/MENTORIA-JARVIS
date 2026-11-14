/* =====================================================================================
   COMO NASCE UM TERREMOTO 🌍 — arte em SVG
   Mapa visto de cima (campos, estrada, cerca, riacho, árvores e uma cidade) cortado por uma falha vertical (x = 0).
   Cada ponto do mapa é deslocado em y por DISP(x, y): antes da ruptura a falha está TRAVADA e o chão se curva em "S"
   (perfil de arco-tangente, o modelo clássico do rebote elástico); na ruptura a frente corre pela falha e cada linha
   que ela cruza dá o estalo (resposta elástica com ressalto) e fica deslocada; depois as ondas P e S passam e o chão ondula.
   Também: plano da falha visto de frente (foco, frente de ruptura), instrumentos com a marca HRYZ Animation.
   Tudo é determinístico (nada de R() dentro de quadro).
   ===================================================================================== */
const hh = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const VIG = (k = 1) => `<rect width="1080" height="1920" fill="url(#vig)" opacity="${k}"/>`;
const GRAINV = t => { const j = Math.floor(t * 24); return `<rect x="-200" y="-200" width="1480" height="2320" fill="url(#noiseP)" opacity=".045" transform="translate(${(j * 37) % 200 - 100},${(j * 53) % 200 - 100})"/>`; };
const blur = (px, c) => { const id = 'bl' + String(px).replace('.', '_'); if (!D.some(d => d.includes(`id="${id}"`))) def(`<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${px}"/></filter>`); return `<g filter="url(#${id})">${c}</g>`; };
const blurH = (px, c) => { const id = 'bh' + Math.round(px); if (!D.some(d => d.includes(`id="${id}"`))) def(`<filter id="${id}" x="-20%" y="-5%" width="140%" height="110%"><feGaussianBlur stdDeviation="${px} 0"/></filter>`); return `<g filter="url(#${id})">${c}</g>`; };

const EXTRA = `
<linearGradient id="gQuenteH" gradientUnits="userSpaceOnUse" x1="-420" y1="0" x2="420" y2="0"><stop offset="0" stop-color="#FF4A2A" stop-opacity="0"/><stop offset=".5" stop-color="#FF5A2A" stop-opacity=".9"/><stop offset="1" stop-color="#FF4A2A" stop-opacity="0"/></linearGradient>
<radialGradient id="gFoco"><stop offset="0" stop-color="#FFF4C0" stop-opacity="1"/><stop offset=".25" stop-color="#FFB040" stop-opacity=".85"/><stop offset="1" stop-color="#FF4A20" stop-opacity="0"/></radialGradient>
<radialGradient id="gTensao" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FF3A1E" stop-opacity=".95"/><stop offset=".38" stop-color="#FF7A2A" stop-opacity=".7"/><stop offset=".72" stop-color="#C0408A" stop-opacity=".32"/><stop offset="1" stop-color="#7040B0" stop-opacity="0"/></radialGradient>
<radialGradient id="gPoeira"><stop offset="0" stop-color="#E6D5AE" stop-opacity=".8"/><stop offset=".55" stop-color="#DCCAA2" stop-opacity=".42"/><stop offset="1" stop-color="#D5C197" stop-opacity="0"/></radialGradient>
<linearGradient id="gRocha" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7A6249"/><stop offset=".45" stop-color="#54443A"/><stop offset="1" stop-color="#2E2630"/></linearGradient>
<radialGradient id="gCeuPlano" cx=".5" cy=".42" r=".8"><stop offset="0" stop-color="#1D2C58"/><stop offset="1" stop-color="#070C1E"/></radialGradient>
`;

/* ===================== o chão: deformação ===================== */
const PX_M = 36, FW = 14, LAM = 100, DMAX = 108;                     // 1 m = 36 px; cada lado anda DMAX (3 m) => escorregão de 6 m
const uPre = (x, D) => D * .6366 * Math.atan(x / LAM);
const uPost = (x, D) => (x < 0 ? -D : D);
let ST = { D: DMAX, ev: null, r0: 0, t: 0, w: null };               // estado do chão no quadro
function rupFrac(y) {
  if (!ST.ev) return ST.r0;
  const e = ST.ev, tau = (ST.t - e.t0 - Math.abs(y - e.yh) / e.v) * (e.slow || 1);
  return tau <= 0 ? 0 : 1 - Math.exp(-11 * tau) * (Math.cos(15 * tau) + (11 / 15) * Math.sin(15 * tau));   // resposta de mola: sobe e dá um leve ressalto
}
function ondaDisp(x, y) {
  const w = ST.w, d = Math.max(1, Math.hypot(x, y)), tp = ST.t - w.t0 - d / w.vp, ts = ST.t - w.t0 - d / w.vs;
  let ax = 0, ay = 0;
  if (tp > 0) { const a = w.Ap * Math.exp(-tp / .4) * Math.sin(tp * 34); ax += a * x / d; ay += a * y / d; }
  if (ts > 0) { const a = w.As * Math.min(1, ts / .35) * Math.exp(-ts / w.dec) * Math.sin(ts * 13 + d * .008) / (1 + d / 1500); ax += -a * y / d; ay += a * x / d; }
  return [ax, ay];
}
function DISP(x, y) {
  const r = rupFrac(y);
  let dy = (1 - r) * uPre(x, ST.D) + r * uPost(x, ST.D), dx = 0;
  if (ST.w) { const o = ondaDisp(x, y); dx = o[0]; dy += o[1]; }
  return [dx, dy];
}
const XS = (() => { const a = []; let x = -1750; while (x < 1750) { a.push(x); const ax = Math.abs(x); x += ax < 40 ? 10 : ax < 120 ? 16 : ax < 260 ? 26 : ax < 520 ? 50 : 110; } a.push(1750); return a; })();
const XSF = (() => { const a = []; for (let x = -1750; x <= 1750; x += 26) a.push(x); return a; })();
const xsIn = (x0, x1) => { const src = ST.w ? XSF : XS, o = [x0]; for (const x of src) if (x > x0 + 1 && x < x1 - 1) o.push(x); o.push(x1); return o; };
const pj = (x, y) => { const d = DISP(x, y); return [x + d[0], y + d[1]]; };            // ponto do mapa -> ponto deslocado
const strP = a => a.map(p => `${f1(p[0])},${f1(p[1])}`).join(' ');

/* campos: remendo de lavouras (as bordas e as fileiras mostram a deformação) */
const PAL = ['#6DB550', '#86C85A', '#4F9A47', '#E7C95B', '#F0D878', '#C99A4B', '#A87B3A', '#7DBB63', '#D9E07A', '#5FA84E'];
const PATCH = (() => {
  const out = []; let y = -2750, row = 0, id = 0;
  while (y < 2750) {
    const h = 230 + 190 * hh(row, 3); let x = -1800, c = 0;
    while (x < 1800) {
      const w = 280 + 300 * hh(row * 9 + c, 7), x1 = x + w, ty = Math.floor(hh(row * 13 + c, 11) * 5), col = Math.floor(hh(row * 17 + c, 13) * PAL.length);
      const mk = (a, b) => out.push({ x0: a, x1: b, y0: y, y1: y + h, ty, col, id: id++ });
      if (x < -FW - 3 && x1 > FW + 3) { mk(x, -FW - 3); mk(FW + 3, x1); } else if (x1 <= -FW - 3 || x >= FW + 3) mk(x, x1);
      x = x1; c++;
    }
    y += h; row++;
  }
  return out;
})();
function visR(cam, m = 220) { const hx = 540 / cam.z * 1.08 + m, hy = 960 / cam.z * 1.08 + m; return { x0: cam.x - hx, x1: cam.x + hx, y0: cam.y - hy, y1: cam.y + hy }; }
function campos(view, z) {
  let s = '', stripes = '';
  const SP = z < .7 ? 44 : 22;
  for (const p of PATCH) {
    if (p.x1 < view.x0 || p.x0 > view.x1 || p.y1 < view.y0 || p.y0 > view.y1) continue;
    const xs = xsIn(p.x0, p.x1), top = xs.map(x => pj(x, p.y0)), bot = xs.slice().reverse().map(x => pj(x, p.y1));
    const ys = []; for (let y = p.y0 + 90; y < p.y1 - 1; y += 90) ys.push(y);
    const rgt = ys.map(y => pj(p.x1, y)), lft = ys.slice().reverse().map(y => pj(p.x0, y));
    const base = PAL[p.col];
    s += `<polygon points="${strP([...top, ...rgt, ...bot, ...lft])}" fill="${base}" stroke="#2C5E31" stroke-width="3.5" stroke-opacity=".6" stroke-linejoin="round"/>`;
    if (p.ty <= 3 && xs.length > 2) {
      const dark = mix(base, '#1E3A1C', .16), lig = mix(base, '#FFFFFF', .14);
      let d = '';
      for (let yy = p.y0 + 11; yy < p.y1 - 8; yy += SP) d += 'M' + strP(xs.slice(1, -1).map(x => pj(x, yy))).replace(/ /g, 'L');
      stripes += `<path d="${d}" fill="none" stroke="${p.ty % 2 ? lig : dark}" stroke-width="${z < .7 ? 5 : 3.4}" stroke-opacity=".55"/>`;
    }
  }
  return s + stripes;
}
/* touceiras e arbustos espalhados (dão textura e mostram o balanço) */
function arbustos(view) {
  let s = '';
  for (let i = 0; i < 260; i++) {
    const x = -1700 + 3400 * hh(i, 41), y = -2600 + 5200 * hh(i, 43);
    if (Math.abs(x) < 60 || x < view.x0 || x > view.x1 || y < view.y0 || y > view.y1) continue;
    const [px, py] = pj(x, y), r = 9 + 9 * hh(i, 45);
    s += `<circle cx="${f1(px + 5)}" cy="${f1(py + 7)}" r="${f1(r)}" fill="#0E2A12" opacity=".25"/><circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(r)}" fill="#2F7A3A"/><circle cx="${f1(px - r * .3)}" cy="${f1(py - r * .3)}" r="${f1(r * .55)}" fill="#4DA253"/>`;
  }
  return s;
}

/* ===================== feições que cruzam a falha ===================== */
const ROAD_Y = 0, FENCE_Y = -400, TREE_Y = 860, ROAD_W = 126;
const streamY = x => 410 + 46 * Math.sin(x / 190) + 18 * Math.sin(x / 71);
function ribbon(yfn, half, xa, xb) { const xs = xsIn(xa, xb), a = xs.map(x => pj(x, yfn(x) - half)), b = xs.slice().reverse().map(x => pj(x, yfn(x) + half)); return strP([...a, ...b]); }
function line(yfn, xa, xb) { return strP(xsIn(xa, xb).map(x => pj(x, yfn(x)))); }
function estrada(t, tens) {
  const seg = (xa, xb) => {
    const rp = ribbon(() => ROAD_Y, ROAD_W / 2 + 10, xa, xb), ap = ribbon(() => ROAD_Y, ROAD_W / 2, xa, xb);
    const e1 = line(() => ROAD_Y - 50, xa, xb), e2 = line(() => ROAD_Y + 50, xa, xb), cl = line(() => ROAD_Y, xa, xb);
    return `<polygon points="${rp}" fill="#8F8570"/><polygon points="${ap}" fill="#3B404D"/>` + (tens > .02 ? `<polygon points="${ap}" fill="url(#gQuenteH)" opacity="${op(tens)}"/>` : '') +
      `<polyline points="${e1}" fill="none" stroke="#E8E4D8" stroke-width="4.5" opacity=".85"/><polyline points="${e2}" fill="none" stroke="#E8E4D8" stroke-width="4.5" opacity=".85"/><polyline points="${cl}" fill="none" stroke="#F2C230" stroke-width="7" stroke-dasharray="46 36"/>`;
  };
  const cortada = rupFrac(0) > .03;
  return seg(-1750, -FW - 2) + seg(FW + 2, 1750) + (cortada ? '' : seg(-FW - 3, FW + 3));
}
function cerca() {
  const xs = xsIn(-1750, 1750), l = strP(xs.map(x => pj(x, FENCE_Y)));
  let p = '';
  for (let x = -1750; x <= 1750; x += 70) { if (Math.abs(x) < FW + 8) continue; const [px, py] = pj(x, FENCE_Y); p += `<rect x="${f1(px - 7)}" y="${f1(py - 7)}" width="14" height="14" fill="#4A2F1A"/>`; }
  return `<polyline points="${l}" fill="none" stroke="#2A1A0E" stroke-width="9" opacity=".25" transform="translate(5,6)"/><polyline points="${l}" fill="none" stroke="#6B4A2C" stroke-width="6"/>` + p;
}
function riacho(t) {
  const xs = xsIn(-1750, 1750), pts = xs.map(x => pj(x, streamY(x))), l = strP(pts);
  return `<polyline points="${l}" fill="none" stroke="#E8F6FF" stroke-width="66" opacity=".55" stroke-linejoin="round"/><polyline points="${l}" fill="none" stroke="#2F82BC" stroke-width="54" stroke-linejoin="round"/><polyline points="${l}" fill="none" stroke="#6FC0EE" stroke-width="32" stroke-linejoin="round"/><polyline points="${l}" fill="none" stroke="#D5F0FF" stroke-width="5" stroke-dasharray="12 70" stroke-dashoffset="${f1(-t * 90)}" opacity=".7"/>`;
}
function arvores(view) {
  let s = '';
  for (let x = -1700; x <= 1700; x += 118) {
    const xx = x + 26 * Math.sin(x * .07), yy = TREE_Y + 22 * Math.cos(x * .05), r = 38 + 8 * hh(x, 9);
    if (Math.abs(xx) < 60 || xx < view.x0 || xx > view.x1 || yy < view.y0 || yy > view.y1) continue;
    const [px, py] = pj(xx, yy);
    s += `<circle cx="${f1(px + 12)}" cy="${f1(py + 16)}" r="${f1(r)}" fill="#08200E" opacity=".3"/><circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(r)}" fill="#2B7036"/><circle cx="${f1(px - 8)}" cy="${f1(py - 9)}" r="${f1(r * .62)}" fill="#46A04C"/><circle cx="${f1(px - 13)}" cy="${f1(py - 14)}" r="${f1(r * .25)}" fill="#7CD070" opacity=".8"/>`;
  }
  return s;
}

/* ===================== a falha: faixa escura de bordas irregulares, brilho de tensão, fendas, poeira ===================== */
function falha(t, tens) {
  const N = 130, L = [], R = [];
  for (let k = 0; k < N; k++) {
    const y = -2700 + k * 41.5, r = clamp(rupFrac(y), 0, 1.15), hw = 3.5 + 12 * Math.min(1, r);
    const jl = 3 * hh(k, 1) + 4 * hh(k, 2), jr = 3 * hh(k, 3) + 4 * hh(k, 4);
    const dl = DISP(-hw - jl, y), dr = DISP(hw + jr, y);
    L.push([-hw - jl + dl[0], y + dl[1]]); R.push([hw + jr + dr[0], y + dr[1]]);
  }
  let s = `<polygon points="${strP([...L, ...R.slice().reverse()])}" fill="#14100F"/>`;
  let g1 = '', g2 = '';
  for (let k = 0; k < N - 1; k++) {
    const y = -2700 + k * 41.5, r = clamp(rupFrac(y), 0, 1), tf = ST.ev ? ST.ev.t0 + Math.abs(y - ST.ev.yh) / ST.ev.v / (ST.ev.slow || 1) : 0;
    const gl = clamp(tens) * (1 - r) * .95 + (ST.ev && r > .04 ? clamp(1 - (ST.t - tf) / 1.5) * .7 : 0);
    if (gl < .03) continue;
    g1 += `<line x1="${f1(R[k][0])}" y1="${f1(R[k][1])}" x2="${f1(R[k + 1][0])}" y2="${f1(R[k + 1][1])}" stroke="#FF5A2A" stroke-width="22" opacity="${op(gl)}"/><line x1="${f1(L[k][0])}" y1="${f1(L[k][1])}" x2="${f1(L[k + 1][0])}" y2="${f1(L[k + 1][1])}" stroke="#FF8A3A" stroke-width="16" opacity="${op(gl * .8)}"/>`;
    g2 += `<line x1="${f1(R[k][0])}" y1="${f1(R[k][1])}" x2="${f1(R[k + 1][0])}" y2="${f1(R[k + 1][1])}" stroke="#FFB070" stroke-width="3" opacity="${op(gl)}"/><line x1="${f1(L[k][0])}" y1="${f1(L[k][1])}" x2="${f1(L[k + 1][0])}" y2="${f1(L[k + 1][1])}" stroke="#FFB070" stroke-width="3" opacity="${op(gl * .8)}"/>`;
  }
  if (g1) s += blur(7, g1) + g2;
  // fendas em echelon: aparecem quando a ruptura passa
  for (let i = 0; i < 34; i++) {
    const y = -2700 + i * 160 + 40 * hh(i, 5), side = i % 2 ? 1 : -1, r = clamp(rupFrac(y) * 1.4);
    if (r <= .02) continue;
    const x0 = side * (FW + 4), x1 = side * (FW + 38 + 50 * hh(i, 6)), y1 = y + (28 + 30 * hh(i, 7)) * side * -1;
    const a = pj(x0, y), b = pj(x1, y1);
    s += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(a[0] + (b[0] - a[0]) * r)}" y2="${f1(a[1] + (b[1] - a[1]) * r)}" stroke="#14100F" stroke-width="${f1(4 + 5 * hh(i, 8))}" stroke-linecap="round"/>`;
  }
  return s;
}
function poeira(evs, view) {
  let s = '';
  for (const e of evs) for (let i = 0; i < 46; i++) {
    const y = e.yh + (hh(i, e.k) - .5) * 2 * e.span, tb = e.t0 + Math.abs(y - e.yh) / e.v / (e.slow || 1) - .02, a = ST.t - tb;
    if (a < 0 || a > 2.4 || y < view.y0 || y > view.y1) continue;
    const side = hh(i, e.k + 1) < .5 ? -1 : 1, k = a / 2.4, x = side * (22 + 120 * easeOut(k) * (.4 + hh(i, e.k + 2))), yy = y - 60 * k * (hh(i, e.k + 3) - .3), r = 30 + 110 * easeOut(k) * (.5 + hh(i, e.k + 4));
    s += `<circle cx="${f1(x)}" cy="${f1(yy + (ST.D * side * rupFrac(y)))}" r="${f1(r)}" fill="url(#gPoeira)" opacity="${f1(.95 * (1 - k) * Math.min(1, a * 8))}"/>`;
  }
  return s;
}

/* ===================== cidade (casas vistas de cima) ===================== */
const TOWN = { x: 1020, y: -60 };
const CASAS = (() => { const o = []; let n = 0; for (const cx of [-130, -10, 110]) for (const cy of [-165, -55, 55, 165]) { o.push({ x: TOWN.x + cx + 14 * (hh(n, 51) - .5), y: TOWN.y + cy + 14 * (hh(n, 53) - .5), w: 82 + 38 * hh(n, 55), h: 64 + 30 * hh(n, 57), roof: ['#D9573C', '#C97A3C', '#7A8CC0', '#B84A4A', '#9A5CB0', '#D9A03C'][n % 6], rot: (hh(n, 59) - .5) * 7 }); n++; } return o; })();
function cidade() {
  let s = '';
  const ruas = [[[-70, -230], [-70, 230]], [[50, -230], [50, 230]], [[-200, -110], [180, -110]], [[-200, 0], [180, 0]], [[-200, 110], [180, 110]]];
  for (const r of ruas) s += `<polyline points="${strP(xsIn(TOWN.x + r[0][0], TOWN.x + r[1][0]).map(x => pj(x, TOWN.y + r[0][1] + (r[1][1] - r[0][1]) * (r[1][0] === r[0][0] ? 0 : 0))))}" fill="none" stroke="#5A606D" stroke-width="22" opacity="0"/>`;
  s += `<polygon points="${strP([pj(TOWN.x - 215, TOWN.y - 230), pj(TOWN.x + 195, TOWN.y - 230), pj(TOWN.x + 195, TOWN.y + 230), pj(TOWN.x - 215, TOWN.y + 230)])}" fill="#6E7482" opacity=".0"/>`;
  const rua = (x1, y1, x2, y2, w = 24) => { const n = 8, p = []; for (let k = 0; k <= n; k++) p.push(pj(x1 + (x2 - x1) * k / n, y1 + (y2 - y1) * k / n)); return `<polyline points="${strP(p)}" fill="none" stroke="#575D6B" stroke-width="${w}" stroke-linecap="round"/><polyline points="${strP(p)}" fill="none" stroke="#7B8190" stroke-width="3" stroke-dasharray="14 12" opacity=".7"/>`; };
  s += rua(TOWN.x - 70, TOWN.y - 240, TOWN.x - 70, TOWN.y + 240) + rua(TOWN.x + 50, TOWN.y - 240, TOWN.x + 50, TOWN.y + 240) + rua(TOWN.x - 210, TOWN.y - 110, TOWN.x + 190, TOWN.y - 110) + rua(TOWN.x - 210, TOWN.y, TOWN.x + 190, TOWN.y) + rua(TOWN.x - 210, TOWN.y + 110, TOWN.x + 190, TOWN.y + 110);
  for (const c of CASAS) {
    const [px, py] = pj(c.x, c.y), wob = ST.w ? ondaDisp(c.x + 40, c.y + 40) : [0, 0], rr = ST.w ? ondaDisp(c.x - 40, c.y) : [0, 0];
    const rot = c.rot + (wob[1] - rr[1]) * .45;
    s += `<g transform="translate(${f1(px)},${f1(py)}) rotate(${f1(rot)})"><rect x="${f1(-c.w / 2 + 10)}" y="${f1(-c.h / 2 + 12)}" width="${f1(c.w)}" height="${f1(c.h)}" fill="#0A1A0A" opacity=".3"/><rect x="${f1(-c.w / 2)}" y="${f1(-c.h / 2)}" width="${f1(c.w)}" height="${f1(c.h)}" fill="#EADFC6"/><rect x="${f1(-c.w / 2 - 5)}" y="${f1(-c.h / 2 - 4)}" width="${f1(c.w + 10)}" height="${f1(c.h / 2 + 4)}" fill="${c.roof}"/><rect x="${f1(-c.w / 2 - 5)}" y="0" width="${f1(c.w + 10)}" height="${f1(c.h / 2 + 4)}" fill="${mix(c.roof, '#000000', .28)}"/><rect x="${f1(-c.w / 2 - 5)}" y="-2" width="${f1(c.w + 10)}" height="4" fill="#00000030"/></g>`;
  }
  return s;
}

/* ===================== ondas sísmicas (anéis) e setas de empurrão ===================== */
function aneis(t) {
  const w = ST.w; if (!w) return '';
  const a = t - w.t0, rp = w.vp * a, rs = w.vs * a, k = clamp(1 - a / 5.5);
  if (a < 0) return '';
  return blur(4, `<circle r="${f1(rp)}" fill="none" stroke="#BFEAFF" stroke-width="16" opacity="${f1(.55 * k)}"/>`) + `<circle r="${f1(rp)}" fill="none" stroke="#F4FBFF" stroke-width="7" opacity="${f1(.95 * k)}"/>` + blur(8, `<circle r="${f1(rs)}" fill="none" stroke="#FF9A30" stroke-width="40" opacity="${f1(.8 * k)}"/>`) + `<circle r="${f1(rs)}" fill="none" stroke="#FFE2A0" stroke-width="11" opacity="${f1(.95 * k)}"/>`;
}
function setas(k, mov = 0) {
  const arrow = (x, y, up) => `<g transform="translate(${x},${y}) scale(1,${up ? -1 : 1})" opacity="${f1(.5 * k)}"><path d="M-60 -150 L60 -150 L60 20 L120 20 L0 190 L-120 20 L-60 20Z" fill="#FFFFFF"/></g>`;
  return arrow(-430, -520 + mov * 40, true) + arrow(430, 520 - mov * 40, false) + arrow(-430, 1500 + mov * 40, true) + arrow(430, -1500 - mov * 40, false);
}
function mapa(t, cam) {
  const view = visR(cam), z = cam.z;
  return campos(view, z) + arbustos(view) + riacho(t) + cerca() + arvores(view);
}

/* ===================== plano da falha (visto de frente) ===================== */
const PL = { x0: 150, x1: 930, y0: 440, y1: 1640, fx: 570, fy: 1190 };
const ASPER = (() => { const p = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, r = 230 + 52 * Math.sin(3 * a + 1) + 34 * Math.sin(5 * a + .4); p.push([PL.fx + r * Math.cos(a) * 1.1, PL.fy + r * Math.sin(a)]); } return p; })();
function rpath(pts) { let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`; const n = pts.length; for (let i = 0; i < n; i++) { const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]; d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`; } return d + 'Z'; }
function plano(t, o) {
  const { stress = 1, rr = 0, surf = 0, pulse = 0, foco = 0, epi = 0 } = o;
  let s = `<rect x="-600" y="-400" width="2300" height="2900" fill="url(#gCeuPlano)"/>`;
  const stars = []; for (let i = 0; i < 40; i++) stars.push(`<circle cx="${f1(-300 + 1700 * hh(i, 61))}" cy="${f1(-100 + 1700 * hh(i, 62))}" r="${f1(1.2 + 2 * hh(i, 63))}" fill="#8FA8FF" opacity="${f1(.15 + .25 * hh(i, 64))}"/>`);
  s += stars.join('');
  // superfície do terreno em corte, com casa, árvore, poste e a estrada
  s += `<rect x="${PL.x0 - 70}" y="400" width="${PL.x1 - PL.x0 + 140}" height="40" fill="#5DA84E"/><rect x="${PL.x0 - 70}" y="400" width="${PL.x1 - PL.x0 + 140}" height="9" fill="#8FD36A"/>`;
  s += `<rect x="${PL.fx - 80}" y="396" width="160" height="14" fill="#3B404D"/><rect x="${PL.fx - 80}" y="401" width="160" height="3" fill="#F2C230"/>`;
  s += `<g transform="translate(320,400)"><rect x="-50" y="-56" width="100" height="56" fill="#EADFC6"/><polygon points="-62,-56 0,-104 62,-56" fill="#D9573C"/><rect x="-12" y="-34" width="24" height="34" fill="#7A5230"/></g>`;
  s += `<g transform="translate(780,400)"><rect x="-6" y="-46" width="12" height="46" fill="#5A3A1E"/><circle cx="0" cy="-70" r="40" fill="#2B7036"/><circle cx="-12" cy="-80" r="24" fill="#46A04C"/></g>`;
  // a parede de rocha
  s += `<rect x="${PL.x0}" y="${PL.y0}" width="${PL.x1 - PL.x0}" height="${PL.y1 - PL.y0}" rx="26" fill="url(#gRocha)"/>`;
  let est = ''; for (let i = 0; i < 9; i++) { const y = PL.y0 + 90 + i * 128 + 20 * Math.sin(i * 2.1); est += `<path d="M${PL.x0} ${f1(y)} Q${PL.fx - 120} ${f1(y - 24 * Math.sin(i))} ${PL.x1} ${f1(y + 18 * Math.cos(i * 1.3))}" stroke="${i % 2 ? '#00000040' : '#FFFFFF1C'}" stroke-width="${6 + (i % 3) * 2}" fill="none"/>`; }
  s += est;
  let tex = ''; for (let i = 0; i < 26; i++) { const x = PL.x0 + 30 + (PL.x1 - PL.x0 - 60) * hh(i, 91), y = PL.y0 + 40 + (PL.y1 - PL.y0 - 80) * hh(i, 92); tex += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(30 + 90 * hh(i, 93))}" ry="${f1(10 + 26 * hh(i, 94))}" fill="${i % 2 ? '#00000026' : '#FFFFFF12'}" transform="rotate(${f1(-12 + 24 * hh(i, 95))} ${f1(x)} ${f1(y)})"/>`; }
  for (let i = 0; i < 7; i++) { const x = PL.x0 + 60 + (PL.x1 - PL.x0 - 120) * hh(i, 96), y = PL.y0 + 80 + (PL.y1 - PL.y0 - 300) * hh(i, 97); tex += `<path d="M${f1(x)} ${f1(y)} l${f1(30 * (hh(i, 98) - .5))} 40 l${f1(40 * (hh(i, 99) - .5))} 50" stroke="#0000004D" stroke-width="4" fill="none" stroke-linecap="round"/>`; }
  s += tex + `<rect x="${PL.x0}" y="${PL.y0}" width="${PL.x1 - PL.x0}" height="${PL.y1 - PL.y0}" rx="26" fill="none" stroke="#B89C78" stroke-width="5" opacity=".7"/>`;
  // tensão acumulada ao redor do foco (a parte travada brilha)
  const pul = 1 + .05 * Math.sin(t * 9) * pulse;
  s += `<g opacity="${f1(.15 + .85 * stress)}"><ellipse cx="${PL.fx}" cy="${PL.fy}" rx="${f1(470 * pul)}" ry="${f1(430 * pul)}" fill="url(#gTensao)"/><path d="${rpath(ASPER)}" fill="none" stroke="#FFD27A" stroke-width="5" stroke-dasharray="16 12" opacity=".8"/></g>`;
  // região já rompida (atrás da frente): esverdeada, com setas de escorregão
  if (rr > 4) {
    const id = nid('cl');
    def(`<clipPath id="${id}"><ellipse cx="${PL.fx}" cy="${PL.fy}" rx="${f1(rr * 1.12)}" ry="${f1(rr)}"/></clipPath><clipPath id="${id}p"><rect x="${PL.x0}" y="${PL.y0}" width="${PL.x1 - PL.x0}" height="${PL.y1 - PL.y0}" rx="26"/></clipPath>`);
    let ar = '';
    for (let gy = PL.y0 + 70; gy < PL.y1; gy += 118) for (let gx = PL.x0 + 80; gx < PL.x1; gx += 150) { const d = Math.hypot((gx - PL.fx) / 1.12, gy - PL.fy); if (d < rr - 36) ar += `<g transform="translate(${gx},${gy})" opacity="${f1(clamp((rr - 36 - d) / 80) * .85)}"><path d="M30 -9 L-22 -9 L-22 -20 L-52 -3 L-22 14 L-22 3 L30 3Z" fill="#CFFFF0"/><path d="M-30 12 L22 12 L22 23 L52 6 L22 -11 L22 0 L-30 0Z" fill="#7AE0C8" transform="translate(0,6)"/></g>`; }
    s += `<g clip-path="url(#${id}p)"><g clip-path="url(#${id})"><rect x="${PL.x0}" y="${PL.y0}" width="${PL.x1 - PL.x0}" height="${PL.y1 - PL.y0}" fill="#21C9A8" opacity=".30"/>${ar}</g>`;
    s += blur(9, `<ellipse cx="${PL.fx}" cy="${PL.fy}" rx="${f1(rr * 1.12)}" ry="${f1(rr)}" fill="none" stroke="#FFC24A" stroke-width="34" opacity=".75"/>`) + `<ellipse cx="${PL.fx}" cy="${PL.fy}" rx="${f1(rr * 1.12)}" ry="${f1(rr)}" fill="none" stroke="#FFF6C8" stroke-width="10"/></g>`;
  }
  // clarão da superfície quando a ruptura chega
  if (surf > 0) s += blur(10, `<rect x="${PL.x0}" y="396" width="${PL.x1 - PL.x0}" height="22" fill="#FFF3B8" opacity="${f1(surf)}"/>`);
  // o foco
  if (foco > 0) s += `<circle cx="${PL.fx}" cy="${PL.fy}" r="${f1(70 + 90 * foco)}" fill="url(#gFoco)" opacity="${f1(Math.min(1, foco * 2))}"/><circle cx="${PL.fx}" cy="${PL.fy}" r="15" fill="#FFFBE0"/>`;
  return s;
}

/* ===================== instrumentos (em tela) com a marca do canal ===================== */
function painel(rot, txt, cor, k, x, y, marca = true, sz = 66) {
  const h = marca ? 170 : 124;
  let s = `<g opacity="${op(k)}" transform="translate(${x},${y})"><rect x="-165" y="-62" width="330" height="${h}" rx="22" fill="#000" opacity=".35" transform="translate(5,8)"/><rect x="-165" y="-62" width="330" height="${h}" rx="22" fill="#1B1C21" stroke="#5A5E68" stroke-width="4"/><rect x="-149" y="-46" width="298" height="92" rx="12" fill="#1C2B20"/><text x="-137" y="-24" font-size="16" fill="#6FA070">${rot}</text><text x="136" y="34" font-size="${sz}" fill="${cor}" text-anchor="end">${txt}</text><rect x="-149" y="-46" width="298" height="38" rx="12" fill="#fff" opacity=".05"/>`;
  if (marca) s += `<path d="M-149 58 L149 58" stroke="#3A3D46" stroke-width="3"/><text x="0" y="92" text-anchor="middle"><tspan fill="#FFB347" font-size="34">HRYZ</tspan><tspan fill="#EDEDED" font-size="26" dx="10">Animation</tspan></text>`;
  return s + `</g>`;
}
const painelAno = (ano, k) => painel('ANO', String(Math.round(ano)), ano > 150 ? '#FFB020' : '#B6FF5A', k, 255, 300);
function barraTensao(v, k, x = 255, y = 520, t = 0) {
  const H = 230, cor = mix('#6FFFB0', '#FF3C3C', clamp(v)), fl = v > .92 ? .5 + .5 * Math.sin(t * 30) : 1;
  return `<g opacity="${op(k)}" transform="translate(${x},${y})"><rect x="-84" y="-62" width="168" height="${H + 100}" rx="22" fill="#000" opacity=".35" transform="translate(5,8)"/><rect x="-84" y="-62" width="168" height="${H + 100}" rx="22" fill="#1B1C21" stroke="#5A5E68" stroke-width="4"/><text x="0" y="-26" font-size="25" fill="#9FB0E8" text-anchor="middle">TENSÃO</text><rect x="-30" y="0" width="60" height="${H}" rx="12" fill="#0A0E1E" stroke="#5A5E68" stroke-width="3"/><rect x="-26" y="${f1(H - 4 - (H - 8) * clamp(v))}" width="52" height="${f1((H - 8) * clamp(v))}" rx="9" fill="${cor}" opacity="${f1(fl)}"/><path d="M-44 6 L44 6" stroke="#FF3C3C" stroke-width="3" stroke-dasharray="6 5"/></g>`;
}
function sismografo(t, k, tp, ts, x = 255, y = 300) {
  // traço: ruído leve, chegada da P (pequena, rápida) e da S (grande, mais lenta)
  const sig = tt => { let a = .03 * Math.sin(tt * 40) + .02 * Math.sin(tt * 91); const p = tt - tp, s2 = tt - ts; if (p > 0) a += .22 * Math.exp(-p / .45) * Math.sin(p * 55) * Math.min(1, p * 12); if (s2 > 0) a += 1.0 * Math.exp(-s2 / 1.8) * Math.sin(s2 * 21) * Math.min(1, s2 * 6); return a; };
  let pts = []; for (let i = 0; i <= 60; i++) { const tt = t - 3 + i * .05; pts.push(`${f1(-140 + i * 4.7)},${f1(8 - 40 * clamp(sig(tt), -1.15, 1.15))}`); }
  return `<g opacity="${op(k)}" transform="translate(${x},${y})"><rect x="-165" y="-62" width="330" height="192" rx="22" fill="#000" opacity=".35" transform="translate(5,8)"/><rect x="-165" y="-62" width="330" height="192" rx="22" fill="#1B1C21" stroke="#5A5E68" stroke-width="4"/><rect x="-149" y="-46" width="298" height="108" rx="12" fill="#10231A"/><text x="-137" y="-26" font-size="16" fill="#6FA070">SISMÓGRAFO</text><path d="M-149 8 L149 8" stroke="#2C5A40" stroke-width="2"/><polyline points="${pts.join(' ')}" fill="none" stroke="#B6FF5A" stroke-width="3.2" stroke-linejoin="round"/><path d="M-149 76 L149 76" stroke="#3A3D46" stroke-width="3"/><text x="0" y="110" text-anchor="middle"><tspan fill="#FFB347" font-size="34">HRYZ</tspan><tspan fill="#EDEDED" font-size="26" dx="10">Animation</tspan></text></g>`;
}
function etiquetaTexto(txt, x, y, k, w = 300, cor = '#FFD27A', sz = 30) {
  return `<g opacity="${op(k)}" transform="translate(${f1(x)},${f1(y)}) scale(${f1(.92 + .08 * k)})"><rect x="${-w / 2}" y="-32" width="${w}" height="64" rx="32" fill="#08152A" opacity=".88" stroke="${cor}" stroke-width="3"/><text x="0" y="${f1(sz * .34)}" font-size="${sz}" fill="#FFF1C8" text-anchor="middle">${txt}</text></g>`;
}
/* medida do escorregão (cota "6 m") entre os centros da estrada dos dois lados */
function cota(k) {
  const x = -240;
  return `<g opacity="${op(k)}"><path d="M${FW + 6} ${DMAX} H${x - 36}" stroke="#FFE066" stroke-width="5" stroke-dasharray="14 10" opacity=".85"/><path d="M${x} ${-DMAX + 12} V${DMAX - 12}" stroke="#FFE066" stroke-width="7"/><path d="M${x} ${-DMAX} l-17 28 h34z M${x} ${DMAX} l-17 -28 h34z" fill="#FFE066"/></g>`;
}
