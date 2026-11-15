/* =====================================================================================
   CENA 1 — O QUE NÃO ACONTECEU (5,8 s): o filme mostra a pista se abrindo em cratera e o carro ficando preso.
   Primeira pessoa (olho do motorista). No quadro 0 a pista já está rachando à frente, com poeira; a rachadura
   desmorona em direção ao carro, ele não consegue parar, cai na cratera, bate e fica preso no fundo (a poeira baixa,
   a cabine segue tremendo, o motor morre). A marca HRYZ Animation está no centro do volante.

   DECUPAGEM
    0 – 1,0   o chão treme; a pista racha à frente (poeira, o lado de lá sai do alinhamento): o ponto principal já no quadro 0
    1,0 – 1,6 a borda de lá desaba para cima do carro e abre a cratera; freada forte (a câmera afunda, pneus cantando)
    1,6 – 2,4 o carro passa da borda e despenca; primeira batida na parede de lá (2,05) e segunda no fundo (2,4); vidro trinca
    2,4 – 5,8 preso no fundo: o céu lá em cima, poeira, torrões caindo, vapor, motor morre, luzes do painel acendem
   ===================================================================================== */
const SH = [['carro', 0, TOTAL]];
const FLASH = [];
const shotAt = () => SH[0];
const Z0 = 33, T_E = 1.6, T_W = 2.05, T_I = 2.4;
const FIELDS = genFields(Z0);
const bump = x => Math.exp(-Math.pow((x + 1.2) / 4.8, 2));
const sT = t => t < .5 ? 20 * t : 10 + 20 * (t - .5) - 3.6 * (t - .5) ** 2;          // 72 km/h, freia a partir de 0,5 s
function trinca(t) {
  return { w: .45 + .3 * easeOut(range(t, 0, 1.2)), col: 4.7 * easeInOut(range(t, .85, 1.4)), ext: range(t, 1.7, 3.2), dep: 3.3 * easeOut(range(t, .9, 1.6)), dX: -2.6 * (.45 + .55 * easeOut(range(t, 0, .7))), dY: -.7 * (.4 + .6 * easeOut(range(t, 0, .7))) };
}
function camAt(t) {
  const zs = sT(Math.min(t, T_E));
  let z = zs, y = 1.25, p = .035 * smooth(range(t, .5, .85)), roll = 0;
  if (t > T_E && t <= T_W) { const u = range(t, T_E, T_W); z = lerp(zs, 29.7, easeOut(u)); y = 1.25 - 1.35 * u * u; p = lerp(.035, .36, u * u); }
  else if (t > T_W && t <= T_I) { const u = range(t, T_W, T_I); z = lerp(29.7, 31.0, easeOut(u)); y = lerp(-.10, -1.30, u * u); p = lerp(.36, .5, u); }
  else if (t > T_I) { const a = t - T_I; z = 31.0 + .12 * Math.exp(-a / .3) * Math.sin(a * 12); y = -1.30 + .14 * Math.exp(-a / .22) * Math.sin(a * 17 + 1); p = .10 - .16 * Math.exp(-a / .24) * Math.cos(a * 15); roll = 3.4 * smooth(range(a, .2, 1.2)); }
  if (t >= T_W) { const j = Math.exp(-(t - T_W) / .09); p += .07 * j; y -= .22 * j; }
  return { z, y, p, roll };
}
const kmhAt = t => t < T_E ? 3.6 * (t < .5 ? 20 : 20 - 7.2 * (t - .5)) : lerp(3.6 * (20 - 7.2 * (T_E - .5)), 0, easeOut(range(t, T_E, T_I)));
const steerAt = t => 3 * Math.sin(t * 19) * (1 - range(t, 2.6, 3.4)) + 7 * Math.sin(t * 9 + 1) * range(t, .3, 1.6) * (1 - range(t, 1.6, 2.0)) + (t >= T_W ? 18 * Math.exp(-(t - T_W) / .25) * Math.sin((t - T_W) * 14) : 0) + (t >= T_I ? -24 * Math.exp(-(t - T_I) / .3) * Math.cos((t - T_I) * 11) : 0) + 2 * Math.sin(t * 30) * range(t, 2.6, 3);
function shakeW(t) {
  let a = 6 * smooth(range(t, 0, .3)) * (1 - range(t, 1.9, 2.2)) + 12 * range(t, .9, 1.4) * (1 - range(t, 1.9, 2.2));
  if (t >= T_W) a += 34 * Math.exp(-(t - T_W) / .22);
  if (t >= T_I) a += 46 * Math.exp(-(t - T_I) / .26) + 3.5 * Math.exp(-(t - T_I) / 2.5);
  return a;
}
const hazeAt = t => Math.max(0, .03 * range(t, .2, 1) + .06 * range(t, .9, 1.7) + .10 * range(t, T_W, T_W + .3) + .09 * range(t, T_I, T_I + .4) - .13 * range(t, 3.0, 4.8));
const POEIRAS = [
  ...makePuffs(34, 10, { x0: -16, x1: 14, z0: Z0 - 1, z1: Z0 + 1.5, y0: 0, y1: .6, tb0: -.9, tb1: 1.2, life: 2.2, r0: .5, r1: 2.1, vy: 1.0, vx: 1.5, a: .55 }),
  ...makePuffs(16, 40, { x0: -6, x1: 7, z0: 28, z1: 37, y0: -1.5, y1: 0, tb0: .95, tb1: 1.6, life: 2.6, r0: 1.0, r1: 3.2, vy: 1.5, vx: 1, a: .6 }),
  ...makePuffs(8, 70, { x0: -3, x1: 6, z0: 29, z1: 39, y0: -3.2, y1: .5, tb0: T_W, tb1: T_W + .45, life: 3.2, r0: 1.1, r1: 3.4, vy: .5, vx: 1, a: .55 }),
  ...makePuffs(7, 100, { x0: -3, x1: 6, z0: 29, z1: 39, y0: -3.2, y1: .5, tb0: T_I, tb1: T_I + .5, life: 3.0, r0: 1.1, r1: 3.0, vy: .45, vx: 1, a: .45 }),
];
/* região da tela acima da borda de cá da cratera (o resto é pista, que tapa o buraco) */
function lipClip(lip) {
  const pts = lip.map(p => { let c = toCam(p[0], p[1], p[2]); const ok = c[2] >= ZN; if (!ok) c = [c[0], c[1], ZN]; const q = scr(c); return [Math.max(-6000, Math.min(6000, q[0])), ok ? Math.min(6000, q[1]) : 6000]; });
  pts.sort((a, b) => a[0] - b[0]);
  const poly = [[-6000, -6000], [6000, -6000], [6000, pts[pts.length - 1][1]], ...pts.slice().reverse(), [-6000, pts[0][1]]];
  const id = nid('lc');
  def(`<clipPath id="${id}"><polygon points="${poly.map(q => q.map(f1).join(',')).join(' ')}"/></clipPath>`);
  return id;
}
function pitSVG(t, c) {
  const xs = []; for (let x = -16; x <= 14.01; x += .9) xs.push(x);
  const J = (x, sd) => noise1(x * .9, sd) * (.1 + .28 * Math.min(1, c.col / 3));
  const Zn = x => Z0 - c.w / 2 - (c.col + 1.4 * c.ext) * bump(x) + J(x, 1.3);
  const Zf = x => Z0 + c.w / 2 + .45 * c.col * bump(x) + J(x, 4.1);
  const Dp = x => c.dep * (.1 + .9 * bump(x));
  const run = .53, dX = c.dX, dY = c.dY;
  const dentro = CAMS.y < .3;
  let g = dentro ? '' : poly3([[-200, 0, Zn(-200)], [200, 0, Zn(200)], [200 + dX, dY, Zf(200)], [-200 + dX, dY, Zf(-200)]], '#15100E');
  const lip = [-200, -60, -30, ...xs, 30, 60, 200].map(x => [x, 0, Zn(x)]);
  const id = CAMS.y < .3 ? null : lipClip(lip);
  const F = xs.map(x => [x, dY, Zf(x)]), N = xs.map(x => [x, 0, Zn(x)]);
  let p = dentro ? '' : poly3([...F, ...N.slice().reverse()], '#120C0A');
  const wall = (x, d) => [x, dY - d, Zf(x) - run * d];
  for (const [d1, d2, col] of [[0, .22, '#2D3036'], [.22, .62, '#A09584'], [.62, 1.5, '#8A6240'], [1.5, 2.5, '#69482F'], [2.5, 9, '#43301F']]) {
    const top = xs.map(x => wall(x, Math.min(d1, Dp(x)))), bot = xs.map(x => wall(x, Math.min(d2, Dp(x))));
    p += poly3([...top, ...bot.slice().reverse()], col);
  }
  for (const d of [.62, 1.5, 2.5]) for (let i = 0; i < xs.length - 1; i++) if (Dp(xs[i]) > d && Dp(xs[i + 1]) > d) p += seg3(wall(xs[i], d), wall(xs[i + 1], d), '#00000066', 2.4);
  for (let i = 0; i < 40; i++) {
    const x = -7 + 13 * hh(i, 201), u = .06 + .88 * hh(i, 202), d = u * Dp(x);
    if (d < .15) continue;
    const q = pt3(...wall(x, d)); if (!q) continue;
    const R = (.1 + .3 * hh(i, 203)) * CF / q[2];
    p += `<ellipse cx="${f1(q[0])}" cy="${f1(q[1] + R * .15)}" rx="${f1(R)}" ry="${f1(R * .74)}" fill="#6F6454"/><ellipse cx="${f1(q[0] - R * .1)}" cy="${f1(q[1] - R * .05)}" rx="${f1(R * .85)}" ry="${f1(R * .6)}" fill="#A59A88"/>`;
  }
  const B = xs.map(x => wall(x, Dp(x))), M = xs.map(x => [x, -Dp(x), Zn(x) + .4]);
  p += poly3([...B, ...M.slice().reverse()], '#1E140F');
  for (let i = 0; i < 30; i++) {
    const x = -6 + 12 * hh(i, 211), z = lerp(Zn(x) + 1, Zf(x) - run * Dp(x) - .3, hh(i, 212)), q = pt3(x, -Dp(x) + .1, z); if (!q) continue;
    const R = (.15 + .42 * hh(i, 213)) * CF / q[2];
    p += `<ellipse cx="${f1(q[0])}" cy="${f1(q[1])}" rx="${f1(R)}" ry="${f1(R * .6)}" fill="#5E5446"/><ellipse cx="${f1(q[0] - R * .1)}" cy="${f1(q[1] - R * .12)}" rx="${f1(R * .8)}" ry="${f1(R * .46)}" fill="#8E8372"/>`;
  }
  return g + (id ? `<g clip-path="url(#${id})">${p}</g>` : `<g>${p}</g>`);
}

function sCarro(t) {
  const c = trinca(t), cam = camAt(t);
  CAMS = { x: 1.4, y: cam.y, z: cam.z, p: cam.p };
  const A = shakeW(t), sx = A * (Math.sin(41 * t) + .6 * Math.sin(79 * t + 1)), sy = A * (Math.sin(53 * t + 2) + .5 * Math.sin(97 * t)), rl = cam.roll + A * .03 * Math.sin(37 * t);
  const inside = cam.y < .3, far = z => z >= Z0 ? [c.dX, c.dY] : [0, 0];
  let w = ceu(t);
  w += drawFields(FIELDS, { zFar: Z0, dX: c.dX, dY: c.dY, skipNear: inside, zStart: inside ? 35.8 : -1e9 });
  if (!inside) w += road(-10, Z0);
  w += road(inside ? 35.8 : Z0, 420, { dx: c.dX, dy: c.dY });
  w += drawRoadside({ shiftOf: far, skip: z => z < Z0 + 3 });
  w += pitSVG(t, c);
  w += drawRoadside({ shiftOf: far, skip: z => z >= Z0 - 5 });
  w += drawPuffs(POEIRAS, t) + drawClods(t, T_W) + drawSteam(t, T_I + .3);
  const hz = hazeAt(t);
  w += `<rect x="-600" y="-200" width="2280" height="1320" fill="url(#gHaze)" opacity="${f1(hz * 1.5)}"/>`;
  const ja = A * .45;
  const cab = cabine(t, { jx: ja * Math.sin(43 * t + 1), jy: ja * Math.sin(57 * t), steer: steerAt(t), kmh: kmhAt(t), luzes: range(t, T_W, T_W + .05), dim: range(t, 3.0, 3.3) * (.75 + .25 * Math.sin(t * 40)), g1: range(t, T_W, T_W + .14), g2: range(t, T_I, T_I + .22), poeiraEsp: Math.min(1, hz * 3) });
  return worldWrap(w, sx, sy, rl) + cab + VIG(.5) + GRAINV(t);
}
const FN = { carro: sCarro };
