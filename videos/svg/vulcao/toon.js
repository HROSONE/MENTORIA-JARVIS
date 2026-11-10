/* toon.js — desenha o rig em 2D com cor: pele, roupa, cabelo, contorno e rosto com expressão.
   Cada material vira um grupo "fundido" (sem juntas aparentes), com contorno escuro e sombra suave.
   TOON.draw(tipo, pose, opts) -> { back, mid, front, all, J, proj }
   pose.face = { brow: -1..1, mouth: 'smile'|'open'|'flat'|'frown'|'grin'|'o', blink: 0..1, gaze: [x,y] } */
(function (G) {
  const { V, M } = G.RIG; const f = n => Math.round(n * 100) / 100;
  const camMat = (yaw, pitch) => M.mul(M.rx(-(pitch || 0)), M.ry(-(yaw || 0)));
  const proj = (R, p) => { const q = M.ap(R, p); return [q[0], -q[1], q[2]]; };
  function ell(R, c, A) { // elipse projetada de um elipsoide (c, A)
    const cc = proj(R, c), B = M.mul(R, A), a = B[0], b = B[1].map(v => -v);
    const s00 = V.dot(a, a), s11 = V.dot(b, b), s01 = V.dot(a, b), th = 0.5 * Math.atan2(2 * s01, s00 - s11), tr = s00 + s11, det = s00 * s11 - s01 * s01, d = Math.sqrt(Math.max(0, tr * tr / 4 - det));
    return `<ellipse cx="${f(cc[0])}" cy="${f(cc[1])}" rx="${f(Math.sqrt(tr / 2 + d))}" ry="${f(Math.sqrt(Math.max(0, tr / 2 - d)))}" transform="rotate(${f(th * 180 / Math.PI)} ${f(cc[0])} ${f(cc[1])})"/>`;
  }
  function cap(A, B, r1, r2) {
    const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy);
    if (d <= Math.abs(r1 - r2) + 1e-3) { const big = r1 > r2 ? [A, r1] : [B, r2]; return `<circle cx="${f(big[0][0])}" cy="${f(big[0][1])}" r="${f(big[1])}"/>`; }
    const ux = dx / d, uy = dy / d, nx = -uy, ny = ux, cp = (r1 - r2) / d, sp = Math.sqrt(Math.max(0, 1 - cp * cp));
    const p1 = [ux * cp + nx * sp, uy * cp + ny * sp], p2 = [ux * cp - nx * sp, uy * cp - ny * sp], phi = Math.acos(Math.max(-1, Math.min(1, cp)));
    const lB = 2 * phi > Math.PI ? 1 : 0, lA = (2 * Math.PI - 2 * phi) > Math.PI ? 1 : 0;
    return `<path d="M${f(A[0] + r1 * p1[0])} ${f(A[1] + r1 * p1[1])}L${f(B[0] + r2 * p1[0])} ${f(B[1] + r2 * p1[1])}A${f(r2)} ${f(r2)} 0 ${lB} 0 ${f(B[0] + r2 * p2[0])} ${f(B[1] + r2 * p2[1])}L${f(A[0] + r1 * p2[0])} ${f(A[1] + r1 * p2[1])}A${f(r1)} ${f(r1)} 0 ${lA} 0 ${f(A[0] + r1 * p1[0])} ${f(A[1] + r1 * p1[1])}Z"/>`;
  }
  function shade(hex, k) { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k)))); return '#' + ((1 << 24) + (c[0] << 16) + (c[1] << 8) + c[2]).toString(16).slice(1); }
  const INK = '#2a1c1a';
  // filtro de material: funde as formas, pinta, sombreia (luz de cima-esquerda) e contorna
  const FIL = {}; let fdefs = '';
  function fil(cor, dim) {
    const key = cor + (dim || ''); if (FIL[key]) return FIL[key]; const id = 'tm' + Object.keys(FIL).length; FIL[key] = id; const c = dim ? shade(cor, dim) : cor;
    fdefs += `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation=".55" result="b"/><feColorMatrix in="b" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 24 -11" result="a"/>
<feMorphology in="a" operator="dilate" radius=".42" result="d"/><feFlood flood-color="${INK}"/><feComposite in2="d" operator="in" result="ink"/>
<feFlood flood-color="${c}"/><feComposite in2="a" operator="in" result="fill"/>
<feOffset in="a" dx="-1.5" dy="-1.7" result="o1"/><feComposite in="a" in2="o1" operator="out" result="s0"/><feGaussianBlur in="s0" stdDeviation=".45" result="s1"/><feComposite in="s1" in2="a" operator="in" result="s2"/><feFlood flood-color="${shade(c, .72)}"/><feComposite in2="s2" operator="in" result="sh"/>
<feOffset in="a" dx="1.3" dy="1.5" result="o2"/><feComposite in="a" in2="o2" operator="out" result="h0"/><feGaussianBlur in="h0" stdDeviation=".4" result="h1"/><feComposite in="h1" in2="a" operator="in" result="h2"/><feFlood flood-color="${shade(c, 1.28)}" flood-opacity=".8"/><feComposite in2="h2" operator="in" result="hl"/>
<feMerge><feMergeNode in="ink"/><feMergeNode in="fill"/><feMergeNode in="sh"/><feMergeNode in="hl"/></feMerge></filter>`;
    return id;
  }
  const ORDER = ['shoe', 'skin', 'pants', 'shirt', 'strap', 'head', 'hair', 'cap', 'glass'];

  function face(J, R, T, fc) {
    fc = fc || {}; const k = J.kh || J.k, Rh = J.Rh, at = v => V.add(J.head, M.ap(Rh, V.mul(v, k))); const RR = M.mul(R, Rh); let s = '';
    const vis = n => M.ap(RR, V.norm(n))[2];
    const blink = 1 - (fc.blink || 0), gz = fc.gaze || [0, 0], hair = T.cores.hair, wide = fc.wide || 0;
    for (const sx of [1, -1]) {
      const v = vis([sx * 0.5, 0.05, 0.86]); if (v < 0.12) continue;
      const c = at([sx * 3.15, 8.7, 8.15]), Re = M.mul(Rh, M.ry(sx * 18));
      const A = r => M.mul(Re, [[r[0] * k, 0, 0], [0, r[1] * k, 0], [0, 0, r[2] * k]]);
      const eh = (2.35 + wide * .6) * Math.max(.12, blink);
      s += `<g fill="#fff" stroke="${INK}" stroke-width=".42">${ell(R, c, A([1.95, eh, .2]))}</g>`;
      if (blink > .25) { const pc = V.add(c, M.ap(Re, [gz[0] * .7 * k, gz[1] * .8 * k, .25 * k])); s += `<g fill="#241713">${ell(R, pc, A([1.05, Math.min(1.2, eh * .7), .2]))}</g><g fill="#fff">${ell(R, V.add(pc, M.ap(Re, [-.35 * k, .4 * k, .1 * k])), A([.3, .3, .1]))}</g>`; }
      // sobrancelha: brow > 0 levanta (surpresa), < 0 fecha (bravo/malicioso)
      const br = fc.brow || 0, a = proj(R, at([sx * 1.5, 11.5 + br * 1.4 - Math.max(0, -br) * 1.6 + wide * .6, 8.7])), b = proj(R, at([sx * 5.2, 11.9 + br * 1.0 + Math.max(0, -br) * .9 + wide * .6, 7.3]));
      s += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${shade(hair, .8)}" stroke-width="${f(1.05 * k)}" stroke-linecap="round"/>`;
    }
    if (vis([0, -0.15, 1]) > 0.1) {
      const m = fc.mouth || 'flat', w = 2.9, y = 2.9; const P = (x, yy, z) => proj(R, at([x, yy, z]));
      const l = P(-w, y + (m === 'smile' || m === 'grin' ? .7 : m === 'frown' ? -.5 : 0), 8.3), r = P(w, y + (m === 'smile' || m === 'grin' ? .7 : m === 'frown' ? -.5 : 0), 8.3);
      if (m === 'open' || m === 'o' || m === 'grin') { const c = at([0, y - (m === 'grin' ? .2 : .6), 9.2]); const rr = m === 'o' ? [1.5, 1.8, .2] : m === 'grin' ? [2.9, 1.5, .2] : [2.4, 2.6, .2];
        s += `<g fill="#5a1b16" stroke="${INK}" stroke-width=".4">${ell(R, c, M.mul(Rh, [[rr[0] * k, 0, 0], [0, rr[1] * k, 0], [0, 0, rr[2] * k]]))}</g>`;
        if (m === 'grin') { const t = at([0, y + .55, 9.3]); s += `<g fill="#fff">${ell(R, t, M.mul(Rh, [[2.3 * k, 0, 0], [0, .55 * k, 0], [0, 0, .2 * k]]))}</g>`; } else if (m === 'open') { const t = at([0, y - 2.1, 9.2]); s += `<g fill="#e2726a">${ell(R, t, M.mul(Rh, [[1.5 * k, 0, 0], [0, .9 * k, 0], [0, 0, .2 * k]]))}</g>`; }
      } else { const c = P(0, y + (m === 'smile' ? -1.1 : m === 'frown' ? 1.0 : 0), 9.3); s += `<path d="M${f(l[0])} ${f(l[1])}Q${f(c[0])} ${f(c[1])} ${f(r[0])} ${f(r[1])}" stroke="${INK}" stroke-width="${f(.6 * k)}" fill="none" stroke-linecap="round"/>`; }
    }
    return s;
  }

  function draw(tipo, pose, o) {
    o = o || {}; const rig = G.RIG.build(tipo, pose); const T = rig.T, J = rig.J; const R = camMat(o.camYaw || 0, o.camPitch || 0); const pj = p => proj(R, p);
    const cores = Object.assign({}, T.cores, o.cores || {}); cores.head = cores.skin; cores.hairB = cores.hair;
    const zp = pj(J.pel)[2], depth = p => pj(p)[2] - zp;
    const near = { armL: depth(J.shL) > -4, armR: depth(J.shR) > -4, legL: depth(J.hipL) >= depth(J.hipR) - 0.01, legR: depth(J.hipR) > depth(J.hipL) + 0.01 };
    const zl = depth(J.shL), zr = depth(J.shR); if (Math.abs(zl - zr) > 8) { near.armL = zl > zr; near.armR = zr > zl; }
    if (o.armFront) for (const a of o.armFront) near['arm' + a] = true;
    const L = [{}, {}, {}], pack = [];
    for (const p of rig.prims) {
      const s = p.t === 'e' ? ell(R, p.c, p.A) : cap(pj(p.a), pj(p.b), p.ra, p.rb);
      if (p.part === 'pack') { pack.push(s); continue; }
      let layer = 1; if (p.part === 'armL') layer = near.armL ? 2 : 0; else if (p.part === 'armR') layer = near.armR ? 2 : 0; else if (p.part === 'legL') layer = near.legL ? 1 : 0; else if (p.part === 'legR') layer = near.legR ? 1 : 0;
      (L[layer][p.m] = L[layer][p.m] || []).push(s);
    }
    const grp = (m, arr, dim) => `<g filter="url(#${fil(cores[m] || '#888', dim)})">${arr.join('')}</g>`;
    const lay = (i, dim) => ORDER.filter(m => L[i][m]).map(m => grp(m, L[i][m], dim)).join('');
    const packS = pack.length ? grp('pack', pack) : '', packFront = pack.length && depth(V.add(J.chest, M.ap(J.Rc, [0, 5, -16]))) > depth(J.chest);
    const back = lay(0, .86);
    let mid = (packFront ? '' : packS);
    // corpo: tudo menos a cabeça; depois cabeça + rosto; (a mochila por cima quando ele está de costas)
    mid += ORDER.filter(m => L[1][m] && !['head', 'hair', 'cap', 'glass'].includes(m)).map(m => grp(m, L[1][m])).join('');
    const g1 = m => L[1][m] ? grp(m, L[1][m]) : '', nz = M.ap(M.mul(R, J.Rh), [0, 0, 1])[2];
    mid += nz > 0.82 ? g1('hairB') + g1('head') + face(J, R, T, pose && pose.face) + g1('hair') + g1('cap') + g1('glass') : nz > -0.25 ? g1('head') + face(J, R, T, pose && pose.face) + g1('hairB') + g1('hair') + g1('cap') + g1('glass') : g1('head') + g1('hair') + g1('hairB') + g1('cap');
    if (packFront) mid += packS;
    const front = lay(2);
    return { back, mid, front, all: back + mid + (o.between || '') + front, J, proj: pj, R };
  }
  // esqueleto de desenho animado na mesma pose
  function skeleton(tipo, pose, o) {
    o = o || {}; const rig = G.RIG.build(tipo, pose), J = rig.J, R = camMat(o.camYaw || 0, o.camPitch || 0), p = v => proj(R, v), k = J.k; let s = '';
    const bone = (a, b, w) => { const A = p(a), B = p(b); return cap(A, B, w, w) + `<circle cx="${f(A[0])}" cy="${f(A[1])}" r="${f(w * 1.5)}"/><circle cx="${f(B[0])}" cy="${f(B[1])}" r="${f(w * 1.5)}"/>`; };
    s += bone(J.pel, J.neck, 2); for (const sd of ['L', 'R']) { s += bone(J['sh' + sd], J['el' + sd], 1.6) + bone(J['el' + sd], J['wr' + sd], 1.4) + bone(J['hip' + sd], J['knee' + sd], 2) + bone(J['knee' + sd], J['ank' + sd], 1.7); const g = p(J['grip' + sd]); s += `<circle cx="${f(g[0])}" cy="${f(g[1])}" r="${f(3 * k)}"/>`; const a = p(J['ank' + sd]); s += `<ellipse cx="${f(a[0])}" cy="${f(a[1] + 4)}" rx="${f(6 * k)}" ry="${f(2.6 * k)}"/>`; }
    s += bone(J.shL, J.shR, 1.6) + bone(J.hipL, J.hipR, 2.6);
    for (let i = 0; i < 4; i++) { const c = V.add(J.chest, M.ap(J.Rc, [0, (3 + i * 4.2) * k, 1 * k])); s += `<g fill="none" stroke="#fbf7ea" stroke-width="${f(1.9 * k)}">${ell(R, c, M.mul(J.Rc, [[(11.5 - i * .6) * k, 0, 0], [0, 1.2 * k, 0], [0, 0, 8 * k]]))}</g>`; }
    const kq = J.kh || k; const hc = V.add(J.head, M.ap(J.Rh, [0, 10 * k, 0])), jc = V.add(J.head, M.ap(J.Rh, [0, 3.6 * k, 3 * k])); const A = r => M.mul(J.Rh, [[r[0] * k, 0, 0], [0, r[1] * k, 0], [0, 0, r[2] * k]]);
    s += ell(R, hc, A([8.2, 9, 9.4])) + ell(R, jc, A([5.4, 5.4, 5.6]));
    let fx = ''; for (const sx of [1, -1]) { const e = V.add(J.head, M.ap(J.Rh, [sx * 3.2 * k, 9 * k, 8.4 * k])); if (M.ap(M.mul(R, J.Rh), V.norm([sx * .5, 0, .86]))[2] > .1) fx += ell(R, e, A([2.2, 2.6, .2])); }
    const n = V.add(J.head, M.ap(J.Rh, [0, 5.6 * k, 9.4 * k])); if (M.ap(M.mul(R, J.Rh), [0, 0, 1])[2] > .1) { fx += ell(R, n, A([.9, 1.3, .2])); for (let i = -2; i <= 2; i++) { const t = p(V.add(J.head, M.ap(J.Rh, [i * 1.25 * k, 2.3 * k, 8.3 * k]))); fx += `<rect x="${f(t[0] - .45)}" y="${f(t[1] - 1.3)}" width=".9" height="2.6"/>`; } }
    return `<g fill="#fbf7ea" stroke="${INK}" stroke-width=".5" stroke-linejoin="round">${s}</g><g fill="${INK}">${fx}</g>`;
  }
  G.TOON = { draw, skeleton, face, ell, cap, proj, camMat, shade, INK, defs: () => fdefs };
})(typeof window !== 'undefined' ? window : globalThis);
