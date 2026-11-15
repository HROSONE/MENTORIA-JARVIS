/* =====================================================================================
   CENA 2 — COMO ACONTECE DE VERDADE (5,4 s): sem cratera. A falha passa por baixo de uma ponte; o chão do outro lado
   escorrega para o lado (até 6 m) e a ponte, que é reta, dura e rígida, não acompanha: quebra no meio do vão.
   Primeira pessoa (olho do motorista) sobre o tabuleiro. No quadro 0 a ponte já está sendo sacudida e, em 0,35 s,
   o tabuleiro estala; a metade de lá desliza para a esquerda e gira (o ângulo muda), a pista deixa de se encontrar,
   os guarda-corpos entortam e pedaços caem no rio. O carro freia e para a uns 5 m da quebra. A marca HRYZ Animation
   está no centro do volante. (Dramatização do que acontece com uma ponte sobre uma falha; não é um caso de 1906.)

   DECUPAGEM
    0 – 0,9   ponte reta e rígida à frente; tremor; o tabuleiro estala no meio do vão e o lado de lá escorrega e gira
    0,9 – 2,5 freada; a abertura cresce na frente do carro (lado de lá deslocado, degrau, rio embaixo); pneus cantando
    2,5 – 5,4 parado na beira da quebra: poeira, pedaços caindo no rio, o tabuleiro ainda cede um pouco; pisca-alerta
   ===================================================================================== */
const SH = [['carro', 0, TOTAL]];
const FLASH = [];
const shotAt = () => SH[0];
const Z_F = 21, B0 = -14, B1 = 51, DW = 4.1, T_B = .12, T_STOP = 2.05;
const FIELDS = genFields([B0, B1]);
const sT = t => t < .45 ? 12 * t : 5.4 + 12 * (t - .45) - 3.75 * (t - .45) ** 2;
const zCar = t => sT(Math.min(t, T_STOP));
const vCar = t => t < T_STOP ? (t < .45 ? 12 : 12 - 7.5 * (t - .45)) : 0;
const valleyY = z => z < B0 ? 0 : z < B0 + 16 ? -7 * smooth((z - B0) / 16) : z <= B1 - 16 ? -7 : z < B1 ? -7 * smooth((B1 - z) / 16) : 0;
/* quanto da ruptura já aconteceu (resposta de mola) e o deslocamento do lado de lá */
const slip = t => { const tau = (t - T_B) * .85; return tau <= 0 ? 0 : 1 - Math.exp(-9 * tau) * (Math.cos(13 * tau) + (9 / 13) * Math.sin(13 * tau)); };
const dXat = (z, e) => -(4 + 2 * clamp((z - Z_F) / (B1 - Z_F))) * e;                       // na quebra 4 m, na ponta de lá 6 m (o chão de lá andou 6 m)
const dYat = (z, e, t) => -(1.1 * (1 - clamp((z - Z_F) / (B1 - Z_F))) * e + .16 * range(t, 2.1, 4.6));
const dZat = e => 1.0 * e;
const TF = (X, Y, Z, e, t) => [X + dXat(Z, e), Y + dYat(Z, e, t), Z + dZat(e)];             // põe um ponto do lado de lá no lugar novo
const JAG = x => noise1(x * 1.3, 2.7) * .5;
const solido = (pts, col) => poly3(pts, col);
function steerAt(t) { return 2.5 * Math.sin(t * 17) * (1 - range(t, 2.6, 3.4)) + 6 * Math.sin(t * 8 + 1) * range(t, .2, 1.4) * (1 - range(t, 1.4, 2.4)) + 3 * Math.sin(t * 25) * range(t, 2.6, 3.2); }
function shakeW(t) {
  let a = 7 * smooth(range(t, 0, .2)) * (1 - range(t, 1.3, 2.4)) + 20 * Math.exp(-Math.abs(t - T_B - .1) / .25);
  a += 5 * Math.exp(-(Math.max(0, t - T_STOP)) / 1.2) * (t > T_STOP ? 1 : 0) + 2.2 * range(t, 2.1, 2.6);
  return a;
}
const hazeAt = t => Math.max(0, .02 * range(t, .2, .6) + .05 * range(t, .3, 1.2) - .05 * range(t, 3.0, 5.0));
const POEIRAS = [
  ...makePuffs(24, 10, { x0: -6.5, x1: 6.5, z0: Z_F - 1, z1: Z_F + 2, y0: -1.5, y1: 1.5, tb0: T_B, tb1: T_B + .9, life: 2.4, r0: .6, r1: 2.0, vy: 1.4, vx: 1.5, a: .42 }),
  ...makePuffs(10, 60, { x0: -9, x1: 9, z0: Z_F - 1, z1: Z_F + 3, y0: -4, y1: -.5, tb0: T_B + .1, tb1: T_B + 1.4, life: 3.0, r0: 1.0, r1: 2.6, vy: 1.0, vx: 1.2, a: .4 }),
  ...makePuffs(8, 90, { x0: -5, x1: 5, z0: Z_F - 3, z1: Z_F + 1, y0: -.5, y1: 1.5, tb0: 2.0, tb1: 3.4, life: 2.8, r0: .8, r1: 2.0, vy: .6, vx: 1, a: .3 }),
];
/* pedaços de concreto que caem da quebra (mundo) + respingos no rio */
function pedacos(t) {
  let s = '';
  for (let i = 0; i < 22; i++) {
    const tb = T_B + .1 + 1.8 * hh(i, 301) + (i > 14 ? 1.4 : 0), a = t - tb;
    if (a < 0) continue;
    const x = -4 + 8 * hh(i, 302), z = Z_F + (hh(i, 303) - .3) * 1.8, y0 = .2 - .5 * hh(i, 304), y = y0 - 4.9 * a * a;
    if (y < -6.9) {
      const k = (y0 - -6.9 > 0 ? Math.sqrt((y0 + 6.9) / 4.9) : 0), ar = t - (tb + k);
      if (ar < 0 || ar > .9) continue;
      const q = pt3(x, -6.8, z); if (!q) continue;
      s += `<ellipse cx="${f1(q[0])}" cy="${f1(q[1])}" rx="${f1(CF * (.7 + 2.2 * ar) / q[2])}" ry="${f1(CF * (.25 + .8 * ar) / q[2])}" fill="none" stroke="#EAF6FF" stroke-width="${f1(4 * (1 - ar))}" opacity="${f1(.9 * (1 - ar))}"/>`;
      continue;
    }
    const q = pt3(x, y, z); if (!q) continue;
    const R = (.18 + .4 * hh(i, 305)) * CF / q[2];
    s += `<g transform="translate(${f1(q[0])},${f1(q[1])}) rotate(${f1(260 * a * (hh(i, 306) - .5))})"><rect x="${f1(-R)}" y="${f1(-R * .8)}" width="${f1(R * 2)}" height="${f1(R * 1.6)}" fill="#A9A59A"/><rect x="${f1(-R)}" y="${f1(-R * .8)}" width="${f1(R * 2)}" height="${f1(R * .5)}" fill="#C9C5B8"/></g>`;
  }
  return s;
}

/* ===================== o vale, o rio e as margens ===================== */
const ARV_V = Array.from({ length: 12 }, (_, i) => ({ x: (hh(i, 331) < .5 ? -1 : 1) * (7 + 34 * hh(i, 332)), z: B1 - 17 + 13 * hh(i, 333), r: 1.5 + 1.2 * hh(i, 334) })).sort((a, b) => b.z - a.z);
function vale(e, t) {
  let s = '';
  const strips = [];
  for (let z = B0 - 30; z < B1 + 30; z += 3) strips.push(z);
  const zlo = CAMS.z - 6;
  for (let i = strips.length - 1; i >= 0; i--) {
    const za = strips[i], zb = za + 3;
    if (zb < zlo) continue;
    const ya = valleyY(za), yb = valleyY(zb), sh = clamp(Math.abs(yb - ya) / 1.1), col = mix('#69AB52', '#3F7A3A', sh * .7 + .1 * hh(i, 7));
    s += poly3([[-90, ya, za], [90, ya, za], [90, yb, zb], [-90, yb, zb]], col);
  }
  // rio (corre para os lados, por baixo da ponte, e a falha passa no meio dele)
  const wa = Math.max(10, zlo);
  s += poly3([[-90, -6.85, Z_F - 13], [90, -6.85, Z_F - 13], [90, -6.85, Z_F + 13], [-90, -6.85, Z_F + 13]], '#2F83BF');
  s += poly3([[-90, -6.8, Z_F - 9], [90, -6.8, Z_F - 9], [90, -6.8, Z_F + 9], [-90, -6.8, Z_F + 9]], '#5DB4E8');
  for (const a of ARV_V) s += drawTree(a, dXat(a.z, e), valleyY(a.z) + dYat(a.z, e, t));
  for (let k = 0; k < 14; k++) { const z = Z_F - 9 + 18 * hh(k, 311); s += seg3([-60, -6.78, z], [60, -6.78, z], '#D9F1FF', 3, 'opacity=".55"'); }
  return s;
}

/* ===================== o tabuleiro, as bordas, os guarda-corpos e os postes de luz ===================== */
function tabuleiro(t, e) {
  let s = '';
  const zlo = Math.max(B0, CAMS.z - 6);
  const near = (X, Y, Z) => [X, Y, Z], far = (X, Y, Z) => TF(X, Y, Z, e, t);
  // ---- metade de lá (inclusive a face da quebra, as vigas e o asfalto), desenhada antes da de cá
  const zs = []; for (let z = Z_F; z < B1 - .01; z += 5) zs.push(z); zs.push(B1);
  const edgeJ = X => Z_F + JAG(X);
  const topL = [], topR = [];
  for (const z of zs) { topL.push(far(-DW, 0, Math.max(z, edgeJ(-DW)))); topR.push(far(DW, 0, Math.max(z, edgeJ(DW)))); }
  // face da quebra (virada para cá): laje e vigas
  const faceTop = [], faceBot = [];
  for (let x = -DW; x <= DW + .01; x += .8) { faceTop.push(far(x, 0, edgeJ(x))); faceBot.push(far(x, -.7, edgeJ(x))); }
  s += solido([...faceTop, ...faceBot.slice().reverse()], '#B2AEA2');
  for (const gx of [-2.4, 2.4]) s += solido([far(gx - .3, -.7, Z_F), far(gx + .3, -.7, Z_F), far(gx + .3, -1.9, Z_F), far(gx - .3, -1.9, Z_F)], '#8C887E');
  for (let i = 0; i < 9; i++) { const x = -DW + 8.2 * hh(i, 321), a = far(x, -.25, edgeJ(x)), b = far(x + .15, -.25 - .2, edgeJ(x) - .45 - .3 * hh(i, 322)); s += seg3(a, b, '#4A3A30', 2.4); }
  // asfalto da metade de lá
  s += solido([...faceTop, ...zs.slice(1).map(z => far(DW, 0, z)), ...zs.slice(1).reverse().map(z => far(-DW, 0, z))], '#42464F');
  // faixas da metade de lá (laterais e tracejado)
  for (const x of [-DW + .3, DW - .3]) s += solido(zs.map(z => far(x - .08, 0, z)).concat(zs.slice().reverse().map(z => far(x + .08, 0, z))), '#ECE8DC');
  for (let k = Math.floor(Z_F / 9); k * 9 < B1; k++) { const za = Math.max(Z_F + .8, k * 9), zb = Math.min(B1, k * 9 + 3); if (zb > za + .2) s += solido([far(-.08, 0, za), far(.08, 0, za), far(.08, 0, zb), far(-.08, 0, zb)], '#F2C230'); }
  // ---- metade de cá
  const zA = Math.max(B0, CAMS.z - 6), nz = [zA]; for (let z = Math.ceil(zA / 5) * 5; z < Z_F; z += 5) if (z > zA + .1) nz.push(z);
  const nl = [], nr = [];
  for (const z of nz) { nl.push([-DW, 0, z]); nr.push([DW, 0, z]); }
  const endE = []; for (let x = -DW; x <= DW + .01; x += .8) endE.push([x, 0, edgeJ(x)]);
  s += solido([...nl, ...endE, ...nr.slice().reverse()], '#42464F');
  for (const x of [-DW + .3, DW - .3]) s += solido([[x - .08, 0, zA], [x + .08, 0, zA], [x + .08, 0, Z_F - .2], [x - .08, 0, Z_F - .2]], '#ECE8DC');
  for (let k = Math.floor(zA / 9) - 1; k * 9 < Z_F - .3; k++) { const za = Math.max(zA, k * 9), zb = Math.min(Z_F - .3, k * 9 + 3); if (zb > za + .2) s += solido([[-.08, 0, za], [.08, 0, za], [.08, 0, zb], [-.08, 0, zb]], '#F2C230'); }
  // ---- guarda-corpos (postes a cada 2,5 m e dois trilhos) e postes de luz
  const rail = (side, half) => {
    const zz = []; for (let z = half ? Z_F + 1.4 : Math.ceil(zlo / 2.5) * 2.5; z < (half ? B1 : Z_F - 1.2); z += 2.5) zz.push(z);
    const X = side * (DW - .12), P = (z, y) => half ? far(X, y, z) : near(X, y, z);
    let r = '';
    for (const z of zz) { const a = P(z, 0), b = P(z, 1.1), q = pt3(...a); r += seg3(a, b, '#8E939C', wpx(.13, q ? q[2] : 5, 1.6)); }
    for (const h of [1.1, .55]) for (let i = 0; i < zz.length - 1; i++) r += seg3(P(zz[i], h), P(zz[i + 1], h), '#B9BEC8', wpx(.1, Math.max(.6, toCam(...P(zz[i], h))[2]), 1.4));
    return r;
  };
  const dobra = e > .5 ? 1 : 0;
  s += rail(-1, true) + rail(1, true) + rail(-1, false) + rail(1, false);
  // trilhos de cá entortados na quebra (a ponta solta pro lado e pra baixo)
  const kink = range(t, T_B, T_B + .5);
  for (const side of [-1, 1]) for (const h of [1.1, .55]) { const X = side * (DW - .12), a = [X, h, Z_F - 1.2], b = [X + side * .9 * kink, h - .6 * kink, Z_F - .1]; s += seg3(a, b, '#B9BEC8', 3.2); }
  // postes de luz no tabuleiro
  for (let z = -4; z < B1; z += 14) {
    const half = z > Z_F, X = -DW + .5, P = (y) => half ? far(X, y, z) : [X, y, z], b = pt3(...P(0));
    s += seg3(P(0), P(6.8), '#59606C', wpx(.2, b ? b[2] : 5, 1.6)) + seg3(P(6.8), [P(6.8)[0] + 1.6, P(6.8)[1] + .3, P(6.8)[2]], '#59606C', wpx(.12, b ? b[2] : 5, 1.4));
    const lamp = pt3(P(6.8)[0] + 1.6, P(6.8)[1] + .3, P(6.8)[2]); if (lamp) s += `<circle cx="${f1(lamp[0])}" cy="${f1(lamp[1])}" r="${f1(CF * .22 / lamp[2])}" fill="#FFF3C0"/>`;
  }
  return s;
}

function sPonte(t) {
  const e = slip(t), z = zCar(t);
  // câmera: avança e freia; a ponte cede um pouco depois que o carro para
  const dive = .03 * smooth(range(t, .45, .8)) + .24 * smooth(range(t, 2.0, 3.4)) + .02 * range(t, 2.1, 4.6);
  CAMS = { x: 1.4, y: 1.25 - .05 * range(t, 2.1, 4.6), z, p: dive };
  const A = shakeW(t), sx = A * (Math.sin(41 * t) + .6 * Math.sin(79 * t + 1)), sy = A * (Math.sin(53 * t + 2) + .5 * Math.sin(97 * t)), rl = A * .03 * Math.sin(37 * t) + 1.3 * smooth(range(t, 2.2, 4.6));
  const fx = (zz) => zz >= B1 ? [dXat(zz, e), dYat(zz, e, t)] : [0, 0];
  let w = ceu(t);
  w += vale(e, t);
  w += drawFields(FIELDS, { zFar: B1, dX: dXat(B1, e), dY: dYat(B1, e, t), zSkipFrom: B0 - .5, zSkipTo: B1 + .5 });
  w += road(B1, 420, { dx: dXat(B1, e), dy: dYat(B1, e, t) });
  w += drawRoadside({ shiftOf: fx, skip: zz => zz < B1 + 4 });
  w += pedacos(t);
  w += tabuleiro(t, e);
  w += drawPuffs(POEIRAS, t);
  const hz = hazeAt(t);
  w += `<rect x="-600" y="-200" width="2280" height="1320" fill="url(#gHaze)" opacity="${f1(hz * 1.4)}"/>`;
  const ja = A * .45;
  const cab = cabine(t, { jx: ja * Math.sin(43 * t + 1), jy: ja * Math.sin(57 * t), steer: steerAt(t), kmh: 3.6 * vCar(t), luzes: (t > .5 && t < T_STOP + .1 ? 1 : 0) * .6 + (t > T_STOP ? .5 * (Math.floor(t * 2) % 2) : 0), dim: 0, g1: 0, g2: 0, poeiraEsp: Math.min(1, hz * 3) });
  return worldWrap(w, sx, sy, rl) + cab + VIG(.5) + GRAINV(t);
}
const FN = { carro: sPonte };
