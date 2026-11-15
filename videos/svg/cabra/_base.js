/* =====================================================================================
   POR QUE AS CABRAS ESCALAM TUDO? 🐐 — base da arte (ferramentas)
   Splines (Catmull-Rom), ponto em polígono, gerador de PELO (fios afilados com cor por luz, sombra e contorno iluminado
   pelo pôr do sol) e utilidades. Tudo determinístico: semente fixa, nada de acaso dentro de quadro.
   ===================================================================================== */
const hh = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const mulberry = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const VIG = (k = 1) => `<rect width="1080" height="1920" fill="url(#vig)" opacity="${k}"/>`;
const GRAINV = t => { const j = Math.floor(t * 24); return `<rect x="-200" y="-200" width="1480" height="2320" fill="url(#noiseP)" opacity=".05" transform="translate(${(j * 37) % 200 - 100},${(j * 53) % 200 - 100})"/>`; };
const blur = (px, c) => { const id = 'bl' + String(px).replace('.', '_'); if (!D.some(d => d.includes(`id="${id}"`))) def(`<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${px}"/></filter>`); return `<g filter="url(#${id})">${c}</g>`; };
const rpt = p => `${f1(p[0])} ${f1(p[1])}`;
function rctrl(pts, closed) {
  const n = pts.length, g = i => closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))], m = closed ? n : n - 1, out = [];
  for (let i = 0; i < m; i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); out.push([p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2]); }
  return out;
}
const rspl = (pts, closed = false) => { const s = rctrl(pts, closed); let d = 'M' + rpt(s[0][0]); for (const [, c1, c2, p] of s) d += `C${rpt(c1)} ${rpt(c2)} ${rpt(p)}`; return d + (closed ? 'Z' : ''); };
function rbez(p0, c1, c2, p1, u) { const a = 1 - u; return [a * a * a * p0[0] + 3 * a * a * u * c1[0] + 3 * a * u * u * c2[0] + u * u * u * p1[0], a * a * a * p0[1] + 3 * a * a * u * c1[1] + 3 * a * u * u * c2[1] + u * u * u * p1[1]]; }
const rdense = (pts, closed = false, per = 8) => { const s = rctrl(pts, closed), out = [s[0][0]]; for (const [p0, c1, c2, p1] of s) for (let k = 1; k <= per; k++) out.push(rbez(p0, c1, c2, p1, k / per)); return out; };
const pip = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
const bbox = poly => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of poly) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); } return [x0, y0, x1, y1]; };
const distBorda = (poly, x, y) => { let m = 1e9; for (let i = 0; i < poly.length; i += 2) { const d = (poly[i][0] - x) ** 2 + (poly[i][1] - y) ** 2; if (d < m) m = d; } return Math.sqrt(m); };

/* ===================== pelo ===================== */
let EXTRA = '';
/* borda mais próxima: devolve [distância, nx, ny] com (nx,ny) = direção de (x,y) para a borda (normal "para fora") */
const nBorda = (poly, x, y) => { let m = 1e12, k = 0; for (let i = 0; i < poly.length; i++) { const d = (poly[i][0] - x) ** 2 + (poly[i][1] - y) ** 2; if (d < m) { m = d; k = i; } } const d = Math.sqrt(m) || 1; return [d, (poly[k][0] - x) / d, (poly[k][1] - y) / d]; };
/* Gera fios afilados dentro de um polígono (em "tufos": cl fios por semente, todos com quase a mesma direção, como mechas).
   Cada fio: raiz, direção (campo de fluxo), comprimento, largura, curvatura leve. Cor = classe da paleta pela luz do ponto (luz
   automática: normal da borda x direção do sol, com ambiente e ganho); fios na borda voltada ao sol viram "luz de recorte".
   Devolve um <path> por classe de cor, prontos para colar. Determinístico (semente fixa). */
function pelo(poly, o) {
  const { n = 600, cl = 3, len = [8, 14], w = [1.6, 2.6], fluxo = () => 0, pal = ['#000', '#888', '#fff'], semente = 1, curva = .3, jit = .9,
    sun = [.5, -.86], Dmax = 90, amb = .5, gain = .5, luz = null, luzMod = null, rimCor = null, rimD = 10, rimMin = .3, rimP = .8, espalha = .55, ref = null, filtro = null } = o;
  const RF0 = ref || poly;
  const R = mulberry(semente), [x0, y0, x1, y1] = bbox(poly), K = pal.length, cls = Array.from({ length: K + 1 }, () => []);
  let feitos = 0, tent = 0;
  const lz = (x, y, nb) => { let v = luz ? luz(x, y) : amb + gain * (1 - smooth(nb[0] / Dmax)) * (nb[1] * sun[0] + nb[2] * sun[1]) * 1.6; if (luzMod) v += luzMod(x, y); return v; };
  while (feitos < n && tent < n * 14) {
    tent++;
    const cx = x0 + (x1 - x0) * R(), cy = y0 + (y1 - y0) * R();
    if (!pip(poly, cx, cy) || (filtro && !filtro(cx, cy))) continue;
    const a0 = fluxo(cx, cy), lr = typeof len === 'function' ? len(cx, cy) : len, wr = typeof w === 'function' ? w(cx, cy) : w, L0 = lr[0] + (lr[1] - lr[0]) * R();
    for (let j = 0; j < cl && feitos < n; j++) {
      const x = cx + (R() - .5) * 11 * espalha, y = cy + (R() - .5) * 11 * espalha;
      if (j && (!pip(poly, x, y) || (filtro && !filtro(x, y)))) continue;
      const ang = a0 + (R() - .5) * .34, L = L0 * (.8 + .4 * R()), W = wr[0] + (wr[1] - wr[0]) * R(), c = (R() - .5) * curva * L;
      const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
      const tx = x + dx * L + nx * c, ty = y + dy * L + ny * c;
      const mx = x + dx * L * .5 + nx * (c * .5 + W * .38), my = y + dy * L * .5 + ny * (c * .5 + W * .38), mx2 = x + dx * L * .5 + nx * (c * .5 - W * .38), my2 = y + dy * L * .5 + ny * (c * .5 - W * .38);
      const d = `M${f1(x + nx * W / 2)} ${f1(y + ny * W / 2)}Q${f1(mx)} ${f1(my)} ${f1(tx)} ${f1(ty)}Q${f1(mx2)} ${f1(my2)} ${f1(x - nx * W / 2)} ${f1(y - ny * W / 2)}Z`;
      const nb = nBorda(typeof RF0 === 'function' ? RF0(x, y) : RF0, x, y);
      let k;
      if (rimCor && nb[0] < rimD && nb[1] * sun[0] + nb[2] * sun[1] > rimMin && R() < rimP) k = K;
      else k = Math.max(0, Math.min(K - 1, Math.round(lz(x, y, nb) * (K - 1) + (R() - .5) * jit * (K - 1) / 5)));
      cls[k].push(d); feitos++;
    }
  }
  const cores = [...pal, rimCor || '#fff'];
  return cls.map((a, i) => a.length ? `<path d="${a.join('')}" fill="${cores[i]}"/>` : '').join('');
}
const poly2d = (pts, closed = true, per = 6) => rdense(pts, closed, per);
/* campo de fluxo por âncoras: média ponderada (1/d²) de vetores -> ângulo */
const campoFluxo = ancoras => (x, y) => { let sx = 0, sy = 0; for (const [ax, ay, vx, vy] of ancoras) { const d2 = (x - ax) ** 2 + (y - ay) ** 2 + 400, k = 1 / d2; sx += vx * k; sy += vy * k; } return Math.atan2(sy, sx); };

/* paleta com n níveis por interpolação entre cores-chave (escuro -> claro) */
const paleta = (keys, n = 8) => Array.from({ length: n }, (_, i) => { const u = i / (n - 1) * (keys.length - 1), a = Math.min(keys.length - 2, Math.floor(u)); return mix(keys[a], keys[a + 1], u - a); });
/* tubo: polígono em volta de uma linha central, com meia-largura de cada lado em cada ponto de controle */
function tubo(pts, wa, wb, per = 10) {
  const cen = rdense(pts, false, per), n = cen.length, A = [], B = [];
  for (let i = 0; i < n; i++) {
    const c = i / per, i0 = Math.min(wa.length - 2, Math.floor(c)), f = c - i0;
    const a = lerp(wa[i0], wa[i0 + 1], smooth(f)), b = lerp(wb[i0], wb[i0 + 1], smooth(f));
    const p = cen[i], q = cen[Math.min(n - 1, i + 1)], r = cen[Math.max(0, i - 1)];
    let tx = q[0] - r[0], ty = q[1] - r[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    A.push([p[0] - ty * a, p[1] + tx * a]); B.push([p[0] + ty * b, p[1] - tx * b]);
  }
  return [...A, ...B.reverse()];
}
const pathPoly = (poly, fechar = true) => 'M' + poly.map(rpt).join('L') + (fechar ? 'Z' : '');

const areaPoly = poly => { let a = 0; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]); return Math.abs(a / 2); };
