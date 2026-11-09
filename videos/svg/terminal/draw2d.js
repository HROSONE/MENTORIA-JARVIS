/* draw2d.js — projeta o rig em SVG como silhueta (estilo do vídeo do xadrez).
   Câmera ortográfica: camYaw gira em volta do personagem, camPitch inclina. */
(function (G) {
  const { V, M } = G.RIG;
  let FID = 0;
  function camMat(yaw, pitch) { return M.mul(M.rx(-(pitch || 0)), M.ry(-(yaw || 0))); }
  function proj(R, p) { const q = M.ap(R, p); return [q[0], -q[1], q[2]]; }

  function ellipse2d(R, pr) {
    const c = proj(R, pr.c);
    const A = M.mul(R, pr.A); // linhas: x, y, z
    const a = A[0], b = A[1].map(v => -v);
    const s00 = V.dot(a, a), s11 = V.dot(b, b), s01 = V.dot(a, b);
    const th = 0.5 * Math.atan2(2 * s01, s00 - s11);
    const tr = s00 + s11, det = s00 * s11 - s01 * s01;
    const disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
    const l1 = tr / 2 + disc, l2 = Math.max(0, tr / 2 - disc);
    return { c, rx: Math.sqrt(l1), ry: Math.sqrt(l2), th };
  }
  const f = n => (Math.round(n * 100) / 100);
  function elPath(e) {
    // elipse como caminho (rotacionado)
    return `<ellipse cx="${f(e.c[0])}" cy="${f(e.c[1])}" rx="${f(e.rx)}" ry="${f(e.ry)}" transform="rotate(${f(e.th * 180 / Math.PI)} ${f(e.c[0])} ${f(e.c[1])})"/>`;
  }
  function capsule2d(A, B, r1, r2) {
    const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy);
    if (d <= Math.abs(r1 - r2) + 1e-3) { const big = r1 > r2 ? [A, r1] : [B, r2]; return `<circle cx="${f(big[0][0])}" cy="${f(big[0][1])}" r="${f(big[1])}"/>`; }
    const ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
    const cp = (r1 - r2) / d, sp = Math.sqrt(Math.max(0, 1 - cp * cp));
    const p1 = [ux * cp + nx * sp, uy * cp + ny * sp], p2 = [ux * cp - nx * sp, uy * cp - ny * sp];
    const phi = Math.acos(Math.max(-1, Math.min(1, cp)));
    const lB = 2 * phi > Math.PI ? 1 : 0, lA = (2 * Math.PI - 2 * phi) > Math.PI ? 1 : 0;
    const a1 = [A[0] + r1 * p1[0], A[1] + r1 * p1[1]], b1 = [B[0] + r2 * p1[0], B[1] + r2 * p1[1]];
    const b2 = [B[0] + r2 * p2[0], B[1] + r2 * p2[1]], a2 = [A[0] + r1 * p2[0], A[1] + r1 * p2[1]];
    return `<path d="M${f(a1[0])} ${f(a1[1])}L${f(b1[0])} ${f(b1[1])}A${f(r2)} ${f(r2)} 0 ${lB} 0 ${f(b2[0])} ${f(b2[1])}L${f(a2[0])} ${f(a2[1])}A${f(r1)} ${f(r1)} 0 ${lA} 0 ${f(a1[0])} ${f(a1[1])}Z"/>`;
  }

  // filtro de silhueta: une as formas (gooey), cor sólida, borda de luz quente e uma fria fraca
  function silFilter(id, cor, rim, o) {
    o = o || {};
    const bl = o.blur || 0.55, lx = o.lx == null ? 1.15 : o.lx, ly = o.ly == null ? -0.9 : o.ly;
    return `<filter id="${id}" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="${bl}" result="b"/>
<feColorMatrix in="b" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 24 -11" result="a"/>
<feFlood flood-color="${cor}"/><feComposite in2="a" operator="in" result="body"/>
<feOffset in="a" dx="${-lx}" dy="${-ly}" result="o"/><feComposite in="a" in2="o" operator="out" result="r"/>
<feGaussianBlur in="r" stdDeviation="0.32" result="rb"/><feComposite in="rb" in2="a" operator="in" result="rb2"/>
<feFlood flood-color="${rim}"/><feComposite in2="rb2" operator="in" result="rim"/>
<feOffset in="a" dx="${lx * 0.7}" dy="${ly * 0.7}" result="o2"/><feComposite in="a" in2="o2" operator="out" result="r2"/>
<feGaussianBlur in="r2" stdDeviation="0.5" result="r2b"/><feComposite in="r2b" in2="a" operator="in" result="r2c"/>
<feFlood flood-color="#9fb4e0" flood-opacity="0.22"/><feComposite in2="r2c" operator="in" result="cool"/>
<feMerge><feMergeNode in="body"/><feMergeNode in="cool"/><feMergeNode in="rim"/></feMerge></filter>`;
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(Math.min(255, r * k)); g = Math.round(Math.min(255, g * k)); b = Math.round(Math.min(255, b * k));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* desenha o personagem. opts: camYaw, camPitch, cor, rim, light [lx,ly], extra(J, P)->svg (objetos na mão, por cima)
     retorna { svg, J2 (juntas projetadas), J } */
  function draw(tipo, pose, opts) {
    opts = opts || {};
    const rig = G.RIG.build(tipo, pose);
    const R = camMat(opts.camYaw || 0, opts.camPitch || 0);
    const T = rig.T, cor = opts.cor || T.cor, rim = opts.rim || T.rim;
    const id = 'sl' + (FID++);
    const lx = opts.light ? opts.light[0] : 1.15, ly = opts.light ? opts.light[1] : -0.9;
    const defs = silFilter(id + 'a', shade(cor, 0.72), shade(rim, 0.75), { lx, ly }) + silFilter(id + 'b', cor, rim, { lx, ly, blur: 1.0 }) + silFilter(id + 'c', shade(cor, 1.12), rim, { lx, ly });
    // profundidade de cada membro em relação à pelve
    const zp = proj(R, rig.J.pel)[2];
    const depth = p => proj(R, p)[2] - zp;
    const near = {
      armL: depth(rig.J.shL) > -4, armR: depth(rig.J.shR) > -4,
      legL: depth(rig.J.hipL) >= depth(rig.J.hipR) - 0.01, legR: depth(rig.J.hipR) > depth(rig.J.hipL) + 0.01,
    };
    // braço que está claramente atrás vai para a camada de trás
    const zl = depth(rig.J.shL), zr = depth(rig.J.shR);
    if (Math.abs(zl - zr) > 8) { near.armL = zl > zr; near.armR = zr > zl; }
    const L = [[], [], []];
    for (const p of rig.prims) {
      let layer = 1;
      if (p.part === 'armL') layer = near.armL ? 2 : 0;
      else if (p.part === 'armR') layer = near.armR ? 2 : 0;
      else if (p.part === 'legL') layer = near.legL ? 1 : 0;
      else if (p.part === 'legR') layer = near.legR ? 1 : 0;
      let s;
      if (p.t === 'e') s = elPath(ellipse2d(R, p));
      else { const a = proj(R, p.a), b = proj(R, p.b); s = capsule2d(a, b, p.ra, p.rb); }
      L[layer].push(s);
    }
    // dois braços na frente: um por camada para que a borda de luz separe
    let svg = `<defs>${defs}</defs>`;
    svg += `<g filter="url(#${id}a)" fill="#000">${L[0].join('')}</g>`;
    svg += `<g filter="url(#${id}b)" fill="#000">${L[1].join('')}</g>`;
    if (L[2].length) svg += `<g filter="url(#${id}c)" fill="#000">${L[2].join('')}</g>`;
    const J2 = {}; for (const key in rig.J) { const v = rig.J[key]; if (Array.isArray(v) && v.length === 3 && typeof v[0] === 'number') J2[key] = proj(R, v); }
    if (opts.extra) svg += opts.extra(rig.J, p3 => proj(R, p3), R);
    return { svg, J2, J: rig.J, R, proj: p3 => proj(R, p3) };
  }

  G.D2 = { draw, proj, camMat, capsule2d, ellipse2d, silFilter, shade };
})(typeof window !== 'undefined' ? window : globalThis);
