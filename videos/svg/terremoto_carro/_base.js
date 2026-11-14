/* =====================================================================================
   TERREMOTO — CENAS DO CARRO EM PRIMEIRA PESSOA (base compartilhada das duas cenas)
   Câmera em perspectiva (olho do motorista) sobre um mundo 3D simples: céu, colinas, campos, estrada, postes, árvores,
   poeira. A cabine (para-brisa, colunas, retrovisor, painel, volante com a marca HRYZ e as mãos em silhueta) fica em tela.
   Mundo: X para a direita, Y para cima, Z para a frente (metros). O chão é Y = 0. Tudo é determinístico.
   ===================================================================================== */
const hh = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const VIG = (k = 1) => `<rect width="1080" height="1920" fill="url(#vig)" opacity="${k}"/>`;
const GRAINV = t => { const j = Math.floor(t * 24); return `<rect x="-200" y="-200" width="1480" height="2320" fill="url(#noiseP)" opacity=".045" transform="translate(${(j * 37) % 200 - 100},${(j * 53) % 200 - 100})"/>`; };
const EXTRA = `
<radialGradient id="gPoeira"><stop offset="0" stop-color="#E6D5AE" stop-opacity=".85"/><stop offset=".55" stop-color="#DCCAA2" stop-opacity=".45"/><stop offset="1" stop-color="#D5C197" stop-opacity="0"/></radialGradient>
<radialGradient id="gVapor"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".7"/><stop offset="1" stop-color="#E8EEF2" stop-opacity="0"/></radialGradient>
<radialGradient id="gSol"><stop offset="0" stop-color="#FFF6D2" stop-opacity=".95"/><stop offset=".22" stop-color="#FFEBB0" stop-opacity=".5"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>
<linearGradient id="gHaze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D2BF93" stop-opacity=".30"/><stop offset=".55" stop-color="#CDB98E" stop-opacity=".75"/><stop offset="1" stop-color="#C4AE80" stop-opacity=".8"/></linearGradient>
<linearGradient id="gPainel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2D3240"/><stop offset=".16" stop-color="#1E222C"/><stop offset="1" stop-color="#0D0F15"/></linearGradient>
<linearGradient id="gEspelho" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FBBE6"/><stop offset=".55" stop-color="#CBE3F6"/><stop offset="1" stop-color="#6E7C8A"/></linearGradient>
`;

/* ===================== câmera em perspectiva ===================== */
const CF = 1000, CPX = 540, CPY = 700, ZN = .3;
let CAMS = { x: 1.4, y: 1.25, z: 0, p: 0 };                           // olho do motorista (faixa da direita); p = inclinação para baixo (rad)
const toCam = (X, Y, Z) => { const dx = X - CAMS.x, dy = Y - CAMS.y, dz = Z - CAMS.z, cp = Math.cos(CAMS.p), sp = Math.sin(CAMS.p); return [dx, dy * cp + dz * sp, dz * cp - dy * sp]; };
const scr = c => [CPX + CF * c[0] / c[2], CPY - CF * c[1] / c[2]];
const horizonY = () => CPY - CF * Math.tan(CAMS.p);
function clipNear(poly) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], ai = a[2] >= ZN, bi = b[2] >= ZN;
    if (ai) out.push(a);
    if (ai !== bi) { const k = (ZN - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, ZN]); }
  }
  return out;
}
function poly3(pts, fill, extra = '') {
  const c = clipNear(pts.map(p => toCam(p[0], p[1], p[2])));
  if (c.length < 3) return '';
  return `<polygon points="${c.map(q => scr(q).map(f1).join(',')).join(' ')}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
}
function seg3(a, b, stroke, w, extra = '') {
  let ca = toCam(a[0], a[1], a[2]), cb = toCam(b[0], b[1], b[2]);
  if (ca[2] < ZN && cb[2] < ZN) return '';
  if (ca[2] < ZN) { const k = (ZN - ca[2]) / (cb[2] - ca[2]); ca = [ca[0] + (cb[0] - ca[0]) * k, ca[1] + (cb[1] - ca[1]) * k, ZN]; }
  else if (cb[2] < ZN) { const k = (ZN - cb[2]) / (ca[2] - cb[2]); cb = [cb[0] + (ca[0] - cb[0]) * k, cb[1] + (ca[1] - cb[1]) * k, ZN]; }
  const A = scr(ca), B = scr(cb);
  return `<line x1="${f1(A[0])}" y1="${f1(A[1])}" x2="${f1(B[0])}" y2="${f1(B[1])}" stroke="${stroke}" stroke-width="${f1(w)}" stroke-linecap="round"${extra ? ' ' + extra : ''}/>`;
}
function pt3(X, Y, Z) { const c = toCam(X, Y, Z); return c[2] < ZN ? null : [...scr(c), c[2]]; }
const wpx = (m, z, min = 1.2) => Math.max(min, CF * m / Math.max(z, .5));       // largura em pixels de algo com m metros a z metros

/* ===================== céu, nuvens e colinas ===================== */
function ceu(t) {
  const yh = horizonY(), id = nid('sk');
  def(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${f1(yh - 1000)}" x2="0" y2="${f1(yh)}"><stop offset="0" stop-color="#3C7BD6"/><stop offset=".55" stop-color="#86B9EA"/><stop offset="1" stop-color="#DCEEFB"/></linearGradient>`);
  let s = `<rect x="-500" y="-2600" width="2080" height="${f1(yh + 2600)}" fill="url(#${id})"/>`;
  s += `<circle cx="${f1(850 + 5 * t)}" cy="${f1(yh - 470)}" r="300" fill="url(#gSol)"/>`;
  for (let i = 0; i < 6; i++) {
    const x = ((i * 330 + 36 * t + 220 * hh(i, 5)) % 1700) - 300, y = yh - 300 - 100 * hh(i, 6) - 38 * i, w = 150 + 120 * hh(i, 7);
    s += `<g opacity=".82"><ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(w)}" ry="${f1(w * .21)}" fill="#fff"/><ellipse cx="${f1(x + w * .36)}" cy="${f1(y - w * .1)}" rx="${f1(w * .5)}" ry="${f1(w * .2)}" fill="#fff"/><ellipse cx="${f1(x - w * .3)}" cy="${f1(y + w * .02)}" rx="${f1(w * .4)}" ry="${f1(w * .16)}" fill="#F0F6FC"/></g>`;
  }
  let a = `M-500 ${f1(yh + 8)}`, b = a;
  for (let x = -500; x <= 1600; x += 60) { a += `L${x} ${f1(yh - 40 - 34 * Math.sin(x * .004 + 1) - 22 * Math.sin(x * .011))}`; b += `L${x} ${f1(yh - 14 - 22 * Math.sin(x * .006 + 3) - 12 * Math.sin(x * .017 + 2))}`; }
  s += `<path d="${a}L1600 ${f1(yh + 8)}Z" fill="#A4C4B8"/><path d="${b}L1600 ${f1(yh + 8)}Z" fill="#79A98C"/>`;
  s += `<rect x="-500" y="${f1(yh)}" width="2080" height="3200" fill="#5E9B49"/>`;
  return s;
}

/* ===================== campos (remendo de lavouras em perspectiva) ===================== */
const PAL = ['#6DB550', '#86C85A', '#4F9A47', '#E7C95B', '#F0D878', '#C99A4B', '#A87B3A', '#7DBB63', '#D9E07A', '#5FA84E'];
function genFields(zBreak) {
  const breaks = Array.isArray(zBreak) ? zBreak : [zBreak], out = []; let id = 0;
  for (const side of [-1, 1]) for (const [xa, xb] of [[4.9, 26], [26, 150]]) {
    let z = -40, k = 0;
    while (z < 720) {
      const len = 26 + 58 * hh(k + id, 3 + side);
      let z1 = z + len; for (const zb of breaks) if (z < zb && z1 > zb) z1 = zb;
      out.push({ x0: xa, x1: xb, side, z0: z, z1, col: Math.floor(hh(id + k, 5 + xa) * PAL.length), st: hh(id + k, 7) < .7 });
      z = z1; k++;
    }
    id += 100;
  }
  return out;
}
function drawFields(fields, o = {}) {
  const { zFar = 1e9, dX = 0, dY = 0, skipNear = false, zSkipFrom = 1e9, zSkipTo = -1e9, zStart = -1e9 } = o;
  const zlo = CAMS.z - 6;
  let s = '';
  const list = fields.filter(f => f.z1 > zlo).sort((a, b) => b.z1 - a.z1);
  for (const f of list) {
    const far = f.z0 >= zFar;
    if (skipNear && !far) continue;
    if (f.z0 >= zSkipFrom && f.z1 <= zSkipTo) continue;
    const sx = far ? dX : 0, sy = far ? dY : 0, xa = f.side * f.x0 + sx, xb = f.side * f.x1 + sx, za = Math.max(f.z0, zlo, far ? zStart : -1e9);
    if (za >= f.z1) continue;
    s += poly3([[xa, sy, za], [xb, sy, za], [xb, sy, f.z1], [xa, sy, f.z1]], PAL[f.col]);
    if (f.st && f.x1 < 40) {
      const n = 6, dark = mix(PAL[f.col], '#1E3A1C', .22);
      for (let k = 1; k <= n; k++) { const x = xa + (xb - xa) * k / (n + 1); s += seg3([x, sy, za], [x, sy, f.z1], dark, 2.2, 'opacity=".5"'); }
    }
  }
  return s;
}

/* ===================== estrada ===================== */
function road(z0, z1, o = {}) {
  const { dx = 0, dy = 0, shoulder = true, half = 3.6, tone = '#3D414C' } = o;
  const a = Math.max(z0, CAMS.z - 6);
  if (z1 <= a) return '';
  const P = (x0, x1, col) => poly3([[x0 + dx, dy, a], [x1 + dx, dy, a], [x1 + dx, dy, z1], [x0 + dx, dy, z1]], col);
  let s = '';
  if (shoulder) s += P(-half - 1.1, half + 1.1, '#8D836F');
  s += P(-half, half, tone);
  for (const x of [-1.9, 1.9]) s += P(x - .5, x + .5, '#363A44');
  for (const x of [-half + .2, half - .2]) s += P(x - .08, x + .08, '#ECE8DC');
  for (let k = Math.floor(a / 9) - 1; k * 9 < z1; k++) { const za = Math.max(a, k * 9), zb = Math.min(z1, k * 9 + 3); if (zb > za + .2) s += poly3([[-.08 + dx, dy, za], [.08 + dx, dy, za], [.08 + dx, dy, zb], [-.08 + dx, dy, zb]], '#F2C230'); }
  return s;
}

/* ===================== árvores, postes e cerca ao lado da pista ===================== */
const TREES = Array.from({ length: 52 }, (_, i) => ({ z: 6 + i * 14 + 7 * hh(i, 11), x: (hh(i, 12) < .5 ? -1 : 1) * (9 + 24 * hh(i, 13)), r: 1.9 + 1.5 * hh(i, 14) }));
const POLES = Array.from({ length: 14 }, (_, i) => 6 + i * 36);
const POSTS = Array.from({ length: 50 }, (_, i) => 2 + i * 8);
function drawTree(t, sx, sy) {
  const X = t.x + sx, Z = t.z, b = pt3(X, sy, Z);
  if (!b) return '';
  const r = CF * t.r / b[2], c = pt3(X, sy + 2.5 + t.r * .75, Z);
  if (!c) return '';
  return `<ellipse cx="${f1(b[0] + r * .3)}" cy="${f1(b[1])}" rx="${f1(r * 1.1)}" ry="${f1(r * .22)}" fill="#0A200E" opacity=".28"/>` +
    seg3([X, sy, Z], [X, sy + 2.2, Z], '#5A3A22', wpx(.38, b[2], 2)) +
    `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(r)}" fill="#2D7436"/><circle cx="${f1(c[0] - r * .28)}" cy="${f1(c[1] - r * .3)}" r="${f1(r * .62)}" fill="#47A04C"/><circle cx="${f1(c[0] - r * .42)}" cy="${f1(c[1] - r * .46)}" r="${f1(r * .26)}" fill="#7CD070" opacity=".8"/>`;
}
function drawPole(z, shiftOf) {
  const [sx, sy] = shiftOf(z), [nx, ny] = shiftOf(z + 36), X = -7.6 + sx;
  const b = pt3(X, sy, z);
  let s = '';
  s += seg3([X, sy, z], [X, sy + 8, z], '#3A2E26', wpx(.26, b ? b[2] : 5, 1.6));
  s += seg3([X - 1.1, sy + 7.5, z], [X + 1.1, sy + 7.5, z], '#3A2E26', wpx(.14, b ? b[2] : 5, 1.2));
  for (const w of [-1, 1]) {
    let prev = [X + w, sy + 7.5, z];
    for (let k = 1; k <= 6; k++) {
      const u = k / 6, cur = [lerp(X + w, -7.6 + nx + w, u), lerp(sy + 7.5, ny + 7.5, u) - .8 * Math.sin(Math.PI * u), lerp(z, z + 36, u)];
      s += seg3(prev, cur, '#26262C', 1.4);
      prev = cur;
    }
  }
  return s;
}
function drawRoadside(o = {}) {
  const { shiftOf = () => [0, 0], skip = () => false } = o;
  const items = [];
  for (const t of TREES) if (!skip(t.z)) items.push({ z: t.z, k: 't', t });
  for (const z of POLES) if (!skip(z)) items.push({ z, k: 'p' });
  for (const z of POSTS) if (!skip(z)) items.push({ z, k: 'f' });
  items.sort((a, b) => b.z - a.z);
  let s = '';
  for (const it of items) {
    if (it.z < CAMS.z + 1.2 || it.z > CAMS.z + 300) continue;
    if (it.k === 't') { const [sx, sy] = shiftOf(it.z); s += drawTree(it.t, sx, sy); }
    else if (it.k === 'p') s += drawPole(it.z, shiftOf);
    else {
      const [sx, sy] = shiftOf(it.z), [nx, ny] = shiftOf(it.z + 8), X = 5.8;
      const b = pt3(X + sx, sy, it.z);
      s += seg3([X + sx, sy, it.z], [X + sx, sy + 1.05, it.z], '#4A3A2A', wpx(.14, b ? b[2] : 5, 1.4));
      for (const h of [.5, .95]) s += seg3([X + sx, sy + h, it.z], [X + nx, ny + h, it.z + 8], '#3A3A40', 1.3);
    }
  }
  return s;
}

/* ===================== poeira em volume (puffs no mundo) ===================== */
function drawPuffs(list, t) {
  const vis = [];
  for (const p of list) {
    const a = t - p.tb;
    if (a < 0 || a > p.life) continue;
    const k = a / p.life, R = lerp(p.r0, p.r1, easeOut(k));
    const c = toCam(p.x + (p.vx || 0) * a, p.y + (p.vy === undefined ? 1.2 : p.vy) * a, p.z + (p.vz || 0) * a);
    if (c[2] < .9) continue;
    vis.push({ c, R, k, a, al: p.a === undefined ? .9 : p.a });
  }
  vis.sort((u, v) => v.c[2] - u.c[2]);
  let s = '';
  for (const v of vis) { const q = scr(v.c), r = CF * v.R / v.c[2]; s += `<circle cx="${f1(q[0])}" cy="${f1(q[1])}" r="${f1(r)}" fill="url(#gPoeira)" opacity="${f1(v.al * (1 - v.k * v.k) * Math.min(1, v.a * 6))}"/>`; }
  return s;
}
function makePuffs(n, seed, o) {
  const out = [];
  for (let i = 0; i < n; i++) out.push({
    x: o.x0 + (o.x1 - o.x0) * hh(i, seed), z: o.z0 + (o.z1 - o.z0) * hh(i, seed + 1), y: o.y0 + (o.y1 - o.y0) * hh(i, seed + 2),
    tb: o.tb0 + (o.tb1 - o.tb0) * hh(i, seed + 3), life: o.life * (.8 + .4 * hh(i, seed + 4)), r0: o.r0 * (.7 + .6 * hh(i, seed + 5)), r1: o.r1 * (.7 + .6 * hh(i, seed + 6)),
    vy: o.vy, vx: (hh(i, seed + 7) - .5) * (o.vx || 0), a: o.a,
  });
  return out;
}
/* torrões de terra caindo (em tela), depois que o carro bate */
function drawClods(t, t0, n = 30) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const tb = t0 + .15 + 1.9 * hh(i, 71), a = t - tb;
    if (a < 0) continue;
    const x = 60 + 960 * hh(i, 72), y = -80 + 330 * a * (.6 + hh(i, 73)) + .5 * 2100 * a * a, sz = 14 + 34 * hh(i, 74);
    if (y > 1180) continue;
    const rot = 200 * a * (hh(i, 75) - .5), pts = [];
    for (let k = 0; k < 6; k++) { const an = k / 6 * 6.283, rr = sz * (.7 + .5 * hh(i * 7 + k, 76)); pts.push(`${f1(Math.cos(an) * rr)},${f1(Math.sin(an) * rr * .8)}`); }
    s += `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)})"><polygon points="${pts.join(' ')}" fill="#4A3324"/><polygon points="${pts.map((p, k) => k < 3 ? p : '0,0').join(' ')}" fill="#7A5A3E" opacity=".7"/></g>`;
  }
  return s;
}
function drawSteam(t, t0) {
  let s = '';
  if (t < t0) return s;
  for (let i = 0; i < 10; i++) {
    const a = ((t - t0) * .55 + i * .1) % 1, x = 450 + 190 * hh(i, 81) + 30 * Math.sin(t * 2 + i), y = 1130 - 520 * a, r = 40 + 130 * a;
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="url(#gVapor)" opacity="${f1(.55 * (1 - a) * range(t, t0, t0 + .6))}"/>`;
  }
  return s;
}

/* ===================== cabine em primeira pessoa ===================== */
const RAIOS = Array.from({ length: 18 }, (_, i) => { const an = i * Math.PI / 9 + .25 * (hh(i, 91) - .5), L = 200 + 460 * hh(i, 92), pts = []; for (let k = 0; k <= 5; k++) { const rr = L * k / 5, w = (hh(i * 11 + k, 93) - .5) * 26 * (k > 0 ? 1 : 0); pts.push([Math.cos(an) * rr - Math.sin(an) * w, Math.sin(an) * rr + Math.cos(an) * w]); } return { pts, L, an, late: i % 2 }; });
function rachaduras(g1, g2) {
  if (g1 <= 0 && g2 <= 0) return '';
  const C = [640, 500];
  let s = `<g transform="translate(${C[0]},${C[1]})" fill="none" stroke-linecap="round" stroke-linejoin="round">`;
  for (const r of RAIOS) {
    const g = r.late ? g2 : Math.max(g1, g2 * .5);
    if (g <= 0) continue;
    const n = Math.max(1, Math.floor(r.pts.length * g)), seg = r.pts.slice(0, n + 1);
    const d = 'M' + seg.map(p => `${f1(p[0])} ${f1(p[1])}`).join('L');
    s += `<path d="${d}" stroke="#0A0C12" stroke-width="5" opacity=".35"/><path d="${d}" stroke="#EAF5FF" stroke-width="2.6" opacity=".9"/>`;
  }
  for (const R of [90, 170, 260]) {
    const g = g2 * (R / 260 < 1 ? 1 : 1);
    if (g <= 0) continue;
    let d = '';
    for (let i = 0; i < RAIOS.length; i++) { const r = RAIOS[i], k = Math.min(r.pts.length - 1, Math.round(R / (r.L / 5))); if (r.L < R) continue; const p = r.pts[k]; d += (d ? 'L' : 'M') + `${f1(p[0])} ${f1(p[1])}`; }
    if (d) s += `<path d="${d}" stroke="#EAF5FF" stroke-width="1.8" opacity="${f1(.7 * g)}"/>`;
  }
  return s + `</g>`;
}
const MAO_PARTES = [`<rect x="-58" y="-40" width="92" height="80" rx="30"/>`, `<rect x="26" y="-44" width="70" height="22" rx="11"/>`, `<rect x="30" y="-22" width="82" height="22" rx="11"/>`, `<rect x="30" y="0" width="76" height="22" rx="11"/>`, `<rect x="26" y="22" width="62" height="21" rx="10.5"/>`, `<rect x="-38" y="-70" width="76" height="26" rx="13" transform="rotate(-24 -38 -57)"/>`, `<rect x="-130" y="-30" width="84" height="60" rx="20"/>`];
const rotP = (x, y, deg) => { const a = deg * Math.PI / 180; return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]; };
function volante(steer, aperto) {
  const C = [540, 1640], HL = [-248, -174], HR = [248, -174];
  let s = `<g transform="translate(${C[0]},${C[1]}) rotate(${f1(steer)})">`;
  s += `<circle r="303" fill="none" stroke="#0D0F15" stroke-width="66"/><circle r="303" fill="none" stroke="#39404F" stroke-width="52"/>`;
  s += `<path d="M-214 -214A303 303 0 0 1 -60 -297" stroke="#7E8AA6" stroke-width="9" fill="none" stroke-linecap="round" opacity=".75"/><path d="M60 -297A303 303 0 0 1 214 -214" stroke="#5C667E" stroke-width="7" fill="none" stroke-linecap="round" opacity=".55"/>`;
  s += `<rect x="-300" y="-36" width="215" height="72" rx="30" fill="#2A3040" stroke="#0D0F15" stroke-width="5"/><rect x="85" y="-36" width="215" height="72" rx="30" fill="#2A3040" stroke="#0D0F15" stroke-width="5"/><rect x="-36" y="80" width="72" height="225" rx="30" fill="#2A3040" stroke="#0D0F15" stroke-width="5"/>`;
  s += `<circle r="122" fill="#1B2030" stroke="#0D0F15" stroke-width="8"/><circle r="98" fill="none" stroke="#3E4660" stroke-width="4"/>`;
  s += `<text x="0" y="-2" text-anchor="middle" font-size="62" fill="#FFB347">HRYZ</text><text x="0" y="46" text-anchor="middle" font-size="27" fill="#EDEDED">Animation</text>`;
  s += `</g>`;
  // antebraços (ligam a mão ao canto de baixo da tela) e mãos (giram com o volante)
  const wr = (h, sg) => { const w = rotP(h[0] - sg * 106.5, h[1] - 74.6, steer); return [C[0] + w[0], C[1] + w[1]]; };
  const wl = wr(HL, 1), wrr = wr(HR, -1);
  const arm = (w, bx) => `<polygon points="${f1(w[0] - 46)},${f1(w[1] - 14)} ${f1(w[0] + 46)},${f1(w[1] + 14)} ${f1(bx + 96)},1980 ${f1(bx - 96)},1980" fill="#0B0F1E" stroke="#FFB070" stroke-width="2.2" opacity="1"/><path d="M${f1(w[0] - 50)} ${f1(w[1] + 38)}L${f1(w[0] + 50)} ${f1(w[1] + 66)}" stroke="#1E2646" stroke-width="10" opacity=".9"/>`;
  s += arm(wl, wl[0] - 20) + arm(wrr, wrr[0] + 20);
  const mao = (h, sg) => `<g transform="translate(${C[0]},${C[1]}) rotate(${f1(steer)}) translate(${h[0]},${h[1]}) ${sg < 0 ? 'scale(-1,1) ' : ''}rotate(35)"><g fill="none" stroke="#FFB070" stroke-width="5.5" opacity=".9">${MAO_PARTES.join('')}</g><g fill="#0B0F1E">${MAO_PARTES.join('')}</g><g stroke="#1F2750" stroke-width="3" stroke-linecap="round" opacity=".9"><path d="M40 -22H96M40 0H100M38 22H88"/></g></g>`;
  s += mao(HL, 1) + mao(HR, -1);
  return s;
}
function quadro(kmh, luzes, dim, t) {
  const cx = 540, cy = 1236, r = 90;
  let s = `<rect x="290" y="1128" width="500" height="206" rx="34" fill="#0B0D13" stroke="#262B3A" stroke-width="5"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#07090E" stroke="#3B4358" stroke-width="6"/>`;
  for (let i = 0; i <= 8; i++) { const a = (150 + 240 * i / 8) * Math.PI / 180; s += `<path d="M${f1(cx + (r - 8) * Math.cos(a))} ${f1(cy + (r - 8) * Math.sin(a))}L${f1(cx + (r - 20) * Math.cos(a))} ${f1(cy + (r - 20) * Math.sin(a))}" stroke="${i > 6 ? '#FF5A4A' : '#C9D0E6'}" stroke-width="4" stroke-linecap="round"/>`; }
  const an = (150 + 240 * clamp(kmh / 160)) * Math.PI / 180;
  s += `<path d="M${cx} ${cy}L${f1(cx + (r - 18) * Math.cos(an))} ${f1(cy + (r - 18) * Math.sin(an))}" stroke="#FF5A4A" stroke-width="5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="8" fill="#242838"/>`;
  s += `<text x="${cx}" y="${cy + 46}" text-anchor="middle" font-size="30" fill="#7CFFB0">${Math.round(kmh)}</text><text x="${cx}" y="${cy + 64}" text-anchor="middle" font-size="13" fill="#8A92A8">km/h</text>`;
  for (const [x, nome] of [[395, 0], [685, 1]]) { s += `<circle cx="${x}" cy="${cy + 6}" r="48" fill="#07090E" stroke="#2E3548" stroke-width="5"/><path d="M${x} ${cy + 6}L${x + (nome ? 24 : -22)} ${cy - 22}" stroke="#C9D0E6" stroke-width="4" stroke-linecap="round"/>`; }
  const cores = ['#FFB020', '#FF3C3C', '#FF3C3C', '#FFB020', '#FF3C3C'];
  for (let i = 0; i < 5; i++) { const on = luzes * (i % 2 ? (Math.sin(t * 22 + i) > -.3 ? 1 : .35) : 1); s += `<circle cx="${450 + i * 45}" cy="1165" r="9" fill="${cores[i]}" opacity="${f1(.12 + .88 * on)}"/>`; }
  if (dim > 0) s += `<rect x="290" y="1128" width="500" height="206" rx="34" fill="#000" opacity="${f1(.78 * dim)}"/>`;
  return s;
}
function cabine(t, o) {
  const { jx = 0, jy = 0, steer = 0, kmh = 60, luzes = 0, dim = 0, g1 = 0, g2 = 0, poeiraEsp = 0 } = o;
  let s = `<g transform="translate(${f1(jx)},${f1(jy)})">`;
  s += rachaduras(g1, g2);
  s += `<path d="M-30 -30H1110V122Q540 186 -30 122Z" fill="#14161D"/><path d="M-30 122Q540 186 1110 122" fill="none" stroke="#2C303C" stroke-width="5"/>`;
  s += `<path d="M-30 60L118 128L-6 700L-30 740Z" fill="#12141A"/><path d="M118 128L-6 700" stroke="#2E3340" stroke-width="5"/><path d="M1110 60L962 128L1086 700L1110 740Z" fill="#12141A"/><path d="M962 128L1086 700" stroke="#2E3340" stroke-width="5"/>`;
  // retrovisor com a estrada que ficou para trás
  s += `<path d="M748 150V190" stroke="#0E1016" stroke-width="12"/><rect x="618" y="186" width="260" height="106" rx="24" fill="#0E1016"/><rect x="628" y="196" width="240" height="86" rx="17" fill="url(#gEspelho)"/><path d="M748 250L690 282H806Z" fill="#3A3E48"/><path d="M748 250V282" stroke="#F2C230" stroke-width="3" stroke-dasharray="6 5"/><rect x="628" y="196" width="240" height="86" rx="17" fill="#D8C79F" opacity="${f1(.7 * poeiraEsp)}"/>`;
  // painel
  s += `<path d="M-30 1120Q540 1082 1110 1120V2000H-30Z" fill="url(#gPainel)"/><path d="M-30 1120Q540 1082 1110 1120" fill="none" stroke="#586178" stroke-width="5" opacity=".9"/><path d="M-30 1120Q540 1082 1110 1120L1110 1166Q540 1128 -30 1166Z" fill="#9FC4F0" opacity=".10"/>`;
  s += quadro(kmh, luzes, dim, t) + volante(steer);
  return s + `</g>`;
}
const worldWrap = (c, sx, sy, roll) => `<g transform="translate(${f1(sx)},${f1(sy)}) rotate(${f1(roll)} 540 700)">${c}</g>`;
