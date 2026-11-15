/* =====================================================================================
   CABEÇA EM RAIO X (ilustração plana): pele translúcida azul com contorno de luz, crânio e mandíbula (que abre no
   bocejo), coluna cervical, clavícula/ombro e um cérebro com lobos coloridos, giros, cerebelo e tronco.
   Desenhada em coordenadas de projeto (2000 x 1116, voltada para a ESQUERDA); cabeca() posiciona e espelha na cena.
   Determinístico: os giros do cérebro saem de um gerador de semente fixa, calculado uma única vez.
   ===================================================================================== */
const RXC = { ln: '#4A3440', osso: '#F2E7DC', tan: '#D4BFAA', dente: '#FAF0E7', cln: '#492554', glow: '#98D2EA' };
const rpt = p => `${f1(p[0])} ${f1(p[1])}`;
function rbez(p0, c1, c2, p1, u) { const a = 1 - u; return [a * a * a * p0[0] + 3 * a * a * u * c1[0] + 3 * a * u * u * c2[0] + u * u * u * p1[0], a * a * a * p0[1] + 3 * a * a * u * c1[1] + 3 * a * u * u * c2[1] + u * u * u * p1[1]]; }
function rctrl(pts, closed) {            // Catmull-Rom -> lista de Béziers [p0,c1,c2,p1]
  const n = pts.length, g = i => closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))], m = closed ? n : n - 1, out = [];
  for (let i = 0; i < m; i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); out.push([p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2]); }
  return out;
}
const rspl = (pts, closed = false) => { const s = rctrl(pts, closed); let d = 'M' + rpt(s[0][0]); for (const [, c1, c2, p] of s) d += `C${rpt(c1)} ${rpt(c2)} ${rpt(p)}`; return d + (closed ? 'Z' : ''); };
const rdense = (pts, closed = false, per = 8) => { const s = rctrl(pts, closed), out = [s[0][0]]; for (const [p0, c1, c2, p1] of s) for (let k = 1; k <= per; k++) out.push(rbez(p0, c1, c2, p1, k / per)); return out; };
const rpoly = (pp, closed = false) => 'M' + pp.map(rpt).join('L') + (closed ? 'Z' : '');

/* ===================== cérebro: silhueta com escalopes + giros por empacotamento de linhas ===================== */
const CER_BASE = [[811, 228], [814, 202], [824, 175], [843, 157], [858, 138], [885, 126], [911, 112], [943, 101], [979, 96], [1016, 90], [1053, 94], [1085, 101], [1111, 105], [1127, 110], [1158, 127], [1185, 153], [1216, 182], [1237, 211], [1251, 247], [1252, 268], [1244, 293], [1232, 328], [1211, 349], [1190, 358], [1158, 347], [1106, 342], [1053, 353], [1037, 363], [1016, 371], [974, 371], [943, 358], [916, 334], [909, 312], [906, 303], [880, 298], [848, 286], [822, 270], [812, 250]];
const FISSURAS = [[[906, 303], [922, 282], [948, 265], [985, 255], [1025, 251], [1070, 247], [1112, 248], [1142, 259]]];
const BRGEN = seed => {
  let st = seed; const rn = () => (st = (st * 16807) % 2147483647) / 2147483647;
  const dense = rdense(CER_BASE, true, 12); dense.pop();
  const n = dense.length;
  const s = [0]; for (let i = 1; i <= n; i++) { const a = dense[i - 1], b = dense[i % n]; s.push(s[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const L = s[n];
  const nor = dense.map((p, i) => { const a = dense[(i - 1 + n) % n], b = dense[(i + 1) % n]; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; });
  // escalopes: gomos arredondados separados por reentrâncias (onde nascem os sulcos)
  const bounds = []; let acc = 6; while (acc < L - 20) { bounds.push(acc); acc += 26 + 16 * rn(); }
  const amp = bounds.map(() => 7 + 4 * rn());
  const disp = dense.map((p, i) => {
    let k = 0; while (k + 1 < bounds.length && s[i] >= bounds[k + 1]) k++;
    const a = bounds[k], b = k + 1 < bounds.length ? bounds[k + 1] : L + bounds[0], u = clamp((s[i] < a ? s[i] + L : s[i]) - a, 0, b - a) / (b - a);
    const low = p[1] > 335 ? .45 : 1;
    const d = amp[k] * low * (Math.pow(Math.sin(Math.PI * u), .55) - .5);
    return [p[0] + nor[i][0] * d, p[1] + nor[i][1] * d];
  });
  const dents = bounds.map(b => { let bi = 0; for (let i = 0; i < n; i++) if (s[i] <= b) bi = i; return { p: disp[bi], n: [-nor[bi][0], -nor[bi][1]] }; });
  // grade de distância à borda (positiva dentro)
  const X0 = 790, Y0 = 70, X1 = 1275, Y1 = 395, CS = 3, GW = Math.ceil((X1 - X0) / CS), GH = Math.ceil((Y1 - Y0) / CS), sd = new Float32Array(GW * GH);
  const pip = (x, y) => { let c = false; for (let i = 0, j = n - 1; i < n; j = i++) { const a = disp[i], b = disp[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) { const x = X0 + gx * CS, y = Y0 + gy * CS; let md = 1e9; for (let i = 0; i < n; i += 2) { const d = (disp[i][0] - x) ** 2 + (disp[i][1] - y) ** 2; if (d < md) md = d; } sd[gy * GW + gx] = (pip(x, y) ? 1 : -1) * Math.sqrt(md); }
  const dist = (x, y) => { const gx = Math.round((x - X0) / CS), gy = Math.round((y - Y0) / CS); return gx < 0 || gy < 0 || gx >= GW || gy >= GH ? -99 : sd[gy * GW + gx]; };
  // ocupação (linhas já traçadas)
  const OC = 12, ow = Math.ceil((X1 - X0) / OC) + 2, oh = Math.ceil((Y1 - Y0) / OC) + 2, oc = Array.from({ length: ow * oh }, () => []);
  const addPt = (x, y, id, i) => oc[Math.floor((y - Y0) / OC) * ow + Math.floor((x - X0) / OC)].push([x, y, id, i]);
  const nearest = (x, y, id, i, skip) => { let md = 1e9; const cx = Math.floor((x - X0) / OC), cy = Math.floor((y - Y0) / OC); for (let yy = cy - 3; yy <= cy + 3; yy++) for (let xx = cx - 3; xx <= cx + 3; xx++) { if (xx < 0 || yy < 0 || xx >= ow || yy >= oh) continue; for (const q of oc[yy * ow + xx]) { if (q[2] === id && Math.abs(i - q[3]) < skip) continue; const d = Math.hypot(q[0] - x, q[1] - y); if (d < md) md = d; } } return md; };
  FISSURAS.forEach((f, k) => { const dd = rdense(f, false, 14); dd.forEach((p, i) => addPt(p[0], p[1], 9000 + k, i * 1000)); });
  const DS = 2.5, DMIN = 15, EDGE = 6, KMAX = .115, SKIP = 14;
  const pref = (x, y) => (x > 905 && x < 1140 && y > 262 && y < 345) ? .12 : (x > 1175 ? 1.45 : null);
  const lines = [];
  function grow(x, y, th, sgn, id, maxLen) {
    const pts = []; let k = (rn() - .5) * .05;
    for (let i = 1; i <= maxLen / DS; i++) {
      k = k * .925 + (rn() - .5) * .05; if (i > maxLen / DS - 9) k += Math.sign(k || 1) * .012; k = Math.max(-KMAX, Math.min(KMAX, k)); th += k * DS;
      const pf = pref(x, y); if (pf !== null) th += .035 * Math.sin(2 * (pf - th));
      const nx = x + Math.cos(th) * DS, ny = y + Math.sin(th) * DS;
      if (dist(nx, ny) < EDGE) break;
      if (nearest(nx, ny, id, sgn * i, SKIP) < DMIN) break;
      x = nx; y = ny; pts.push([x, y]); addPt(x, y, id, sgn * i);
    }
    return pts;
  }
  let id = 0;
  dents.forEach(dn => {                              // sulcos que nascem nas reentrâncias da borda
    if (dn.p[1] > 345) return;
    const th = Math.atan2(dn.n[1], dn.n[0]) + (rn() - .5) * .7, x0 = dn.p[0] + dn.n[0] * (EDGE + 1), y0 = dn.p[1] + dn.n[1] * (EDGE + 1);
    const arm = grow(x0, y0, th, 1, ++id, 110 + 90 * rn()); lines.push([dn.p, [x0, y0], ...arm]);
  });
  for (let it = 0; it < 400; it++) {                 // preenche o resto: semente no ponto mais livre
    let best = null, bd = 0;
    for (let c = 0; c < 90; c++) { const x = 800 + 460 * rn(), y = 85 + 295 * rn(); if (dist(x, y) < EDGE + 9) continue; const d = nearest(x, y, -1, 0, 0); if (d > bd) { bd = d; best = [x, y]; } }
    if (!best || bd < 18) break;
    const th = rn() * 6.283, a = grow(best[0], best[1], th, 1, ++id, 55 + 65 * rn()), b = grow(best[0], best[1], th + Math.PI, -1, id, 55 + 65 * rn());
    lines.push([...b.reverse(), best, ...a]);
  }
  const len = pts => { let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return l; };
  const gyri = lines.filter(l => len(l) > 30).map(l => { const o = l.filter((p, i) => i % 2 === 0 || i === l.length - 1); return rspl(o); });
  const total = lines.filter(l => len(l) > 30).reduce((a, l) => a + len(l), 0);
  return { outline: rpoly(disp, true), poly: disp, gyri, fissuras: FISSURAS.map(f => rspl(f)), total };
};
const BR = BRGEN(8014041);

const TRONCO = rspl([[1040, 392], [1062, 402], [1086, 432], [1098, 456], [1102, 468], [1086, 470], [1074, 446], [1056, 418], [1038, 404]], true);
const CEREBELO = rspl([[1050, 352], [1090, 340], [1150, 340], [1190, 352], [1199, 372], [1188, 392], [1162, 408], [1126, 413], [1092, 402], [1066, 384]], true);
function rxCerebro(act = .7, t = 0) {
  const ln = RXC.cln;
  def(`<clipPath id="rxBrC"><path d="${BR.outline}"/></clipPath><clipPath id="rxCbC"><path d="${CEREBELO}"/></clipPath>`);
  def(`<linearGradient id="rxBrG" gradientUnits="userSpaceOnUse" x1="811" y1="0" x2="1252" y2="0"><stop offset="0" stop-color="#F98BA6"/><stop offset=".40" stop-color="#FC9AB0"/><stop offset=".47" stop-color="#E6A2DD"/><stop offset=".53" stop-color="#CFA5E6"/><stop offset=".75" stop-color="#C79AE0"/><stop offset=".86" stop-color="#B2B2EE"/><stop offset="1" stop-color="#A5B6F0"/></linearGradient>
<radialGradient id="rxPatchA"><stop offset="0" stop-color="#E07FB8" stop-opacity=".75"/><stop offset="1" stop-color="#E07FB8" stop-opacity="0"/></radialGradient>
<radialGradient id="rxPatchB"><stop offset="0" stop-color="#E8A0D2" stop-opacity=".7"/><stop offset="1" stop-color="#E8A0D2" stop-opacity="0"/></radialGradient>
<radialGradient id="rxPatchC"><stop offset="0" stop-color="#9AB0F0" stop-opacity=".85"/><stop offset="1" stop-color="#9AB0F0" stop-opacity="0"/></radialGradient>`);
  let s = '';
  // tronco e cerebelo (atrás)
  s += `<path d="${TRONCO}" fill="#C79ADB" stroke="${ln}" stroke-width="4.4" stroke-linejoin="round"/>`;
  s += `<path d="${CEREBELO}" fill="#8EA0E8" stroke="${ln}" stroke-width="4.4" stroke-linejoin="round"/>`;
  let est = '';
  for (let i = 0; i < 7; i++) est += `<path d="M${1200 - i * 4} ${352 + i * 9} Q${1150 - i * 8} ${346 + i * 11} ${1096 - i * 6} ${370 + i * 7}" stroke="${ln}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
  s += `<g clip-path="url(#rxCbC)">${est}</g>`;
  s += `<ellipse cx="1037" cy="379" rx="24" ry="17" transform="rotate(25 1037 379)" fill="#8EBDF0" stroke="${ln}" stroke-width="4.2"/>`;
  // cérebro
  s += `<path d="${BR.outline}" fill="url(#rxBrG)"/>`;
  s += `<g clip-path="url(#rxBrC)"><ellipse cx="1138" cy="192" rx="62" ry="58" fill="url(#rxPatchA)"/><ellipse cx="1090" cy="306" rx="95" ry="40" fill="url(#rxPatchB)"/><ellipse cx="1212" cy="290" rx="62" ry="78" fill="url(#rxPatchC)"/></g>`;
  s += `<g clip-path="url(#rxBrC)" fill="none" stroke="${ln}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">`;
  for (const g of BR.gyri) s += `<path d="${g}"/>`;
  for (const g of BR.fissuras) s += `<path d="${g}" stroke-width="5.2"/>`;
  s += `</g>`;
  s += `<path d="${BR.outline}" fill="none" stroke="${ln}" stroke-width="4.8" stroke-linejoin="round"/>`;
  // sono: escurece o conjunto
  const dim = op(.5 * (1 - act));
  if (dim > 0) s += `<g opacity="${dim}" fill="#0B1230"><path d="${BR.outline}"/><path d="${CEREBELO}"/><path d="${TRONCO}"/></g>`;
  return s;
}

/* ===================== crânio, face, mandíbula ===================== */
const LN = RXC.ln, SW = 3.8;
const bone = (d, extra = '') => `<path d="${d}" fill="${RXC.osso}" stroke="${LN}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round"${extra}/>`;
const line = (pts, w = SW) => `<path d="${rspl(pts)}" fill="none" stroke="${LN}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const barra = (pts, w, fill = RXC.osso) => { const d = rspl(pts); return `<path d="${d}" fill="none" stroke="${LN}" stroke-width="${w + SW * 2}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`; };
const CRANIO = rspl([[734, 345], [731, 318], [731, 290], [742, 250], [754, 200], [769, 150], [795, 115], [821, 100], [908, 74], [995, 65], [1082, 70], [1169, 87], [1238, 130], [1269, 191], [1275, 261], [1264, 330], [1247, 391], [1212, 452], [1169, 487], [1117, 504], [1075, 512], [1047, 513], [1020, 502], [1000, 482], [985, 462], [960, 447], [930, 452], [905, 468], [880, 492], [866, 522], [866, 541], [800, 550], [722, 559], [720, 529], [721, 506], [722, 476], [736, 470], [742, 453], [740, 440], [730, 420], [716, 408], [707, 394], [722, 375]], true);
const MAND = rspl([[728, 562], [731, 584], [733, 615], [738, 645], [748, 666], [803, 671], [864, 649], [915, 634], [955, 615], [971, 590], [974, 556], [978, 522], [990, 480], [999, 456], [996, 441], [985, 433], [972, 438], [962, 449], [955, 460], [948, 458], [940, 447], [930, 441], [918, 445], [906, 460], [888, 490], [873, 520], [866, 545]], true);
const DENTE_SUP = 'M730 527L860 517Q870 516 870 526L870 534Q870 542 862 543L734 559Q722 561 722 549L722 538Q722 528 730 527Z';
const DENTE_INF = 'M732 566L858 548Q868 546 868 556L868 563Q868 571 860 572L736 590Q724 592 724 581L724 574Q724 567 732 566Z';
function rxCranio() {
  let s = bone(CRANIO);
  s += `<ellipse cx="792" cy="356" rx="30" ry="54" fill="${RXC.tan}" stroke="${LN}" stroke-width="${SW}"/>`;
  s += `<ellipse cx="1028" cy="447" rx="14" ry="19" transform="rotate(-15 1028 447)" fill="${RXC.tan}" stroke="${LN}" stroke-width="${SW}"/>`;
  s += line([[842, 300], [843, 335], [858, 385], [888, 406], [935, 414], [989, 408]]) + line([[892, 409], [901, 429]]);
  s += line([[772, 431], [786, 447], [813, 476], [851, 473], [886, 453], [925, 441]]) + line([[737, 366], [727, 402]]);
  s += `<path d="${DENTE_SUP}" fill="${RXC.dente}" stroke="${LN}" stroke-width="${SW}" stroke-linejoin="round"/>`;
  return s;
}
const MPIV = [992, 435], MTH = 17 * Math.PI / 180, MTX = 18;
const mrot = (p, k) => { const a = MTH * k, c = Math.cos(a), sn = Math.sin(a), dx = p[0] - MPIV[0], dy = p[1] - MPIV[1]; return [MPIV[0] + dx * c + dy * sn - MTX * k, MPIV[1] - dx * sn + dy * c]; };
function rxMandibula(k) {
  let s = `<g transform="translate(${f1(-MTX * k)},0) rotate(${f1(-17 * k)} ${MPIV[0]} ${MPIV[1]})">`;
  s += `<path d="${MAND}" fill="${RXC.osso}"/><g clip-path="url(#rxMandC)"><path d="M900 425L946 425L941 447L928 462L910 492L895 522L888 548L884 574L850 574L850 545L862 520L878 490L890 466Z" fill="${RXC.tan}"/></g>`;
  s += `<path d="${MAND}" fill="none" stroke="${LN}" stroke-width="${SW}" stroke-linejoin="round"/>`;
  s += line([[936, 452], [928, 464], [910, 492], [895, 522], [888, 548], [885, 570]], SW * .8) + line([[862, 608], [873, 589]]) + line([[933, 608], [958, 578]]);
  s += `<path d="${DENTE_INF}" fill="${RXC.dente}" stroke="${LN}" stroke-width="${SW}" stroke-linejoin="round"/></g>`;
  return s;
}

/* ===================== coluna cervical, clavícula e ombro ===================== */
const VERT = [{ x: 1024, y: 551, w: 66, h: 38, r: 5, pl: 68 }, { x: 1029, y: 596, w: 68, h: 44, r: 7, pl: 82 }, { x: 1034, y: 645, w: 68, h: 46, r: 9, pl: 80 }, { x: 1038, y: 696, w: 68, h: 46, r: 11, pl: 90 }, { x: 1046, y: 746, w: 68, h: 44, r: 13, pl: 96 }, { x: 1058, y: 794, w: 68, h: 44, r: 15, pl: 108 }, { x: 1074, y: 840, w: 68, h: 44, r: 17, pl: 116 }];
function rxColuna() {
  let s = '';
  for (let i = VERT.length - 1; i >= 0; i--) {
    const v = VERT[i], w2 = v.w / 2, h2 = v.h / 2;
    const proc = `M${w2 - 10} ${-12}L${w2 + v.pl * .6} ${-11}Q${w2 + v.pl} ${-9} ${w2 + v.pl} ${5}Q${w2 + v.pl} ${17} ${w2 + v.pl * .6} ${17}L${w2 - 10} ${15}Z`;
    s += `<g transform="translate(${v.x},${v.y}) rotate(${v.r})"><path d="${proc}" fill="${RXC.osso}" stroke="${LN}" stroke-width="${SW}" stroke-linejoin="round"/>`;
    s += `<rect x="${-w2}" y="${-h2}" width="${v.w}" height="${v.h}" rx="11" fill="${RXC.osso}" stroke="${LN}" stroke-width="${SW}"/>`;
    s += `<rect x="${-w2 + 3}" y="${h2 + 1}" width="${v.w - 6}" height="9" rx="4" fill="${RXC.tan}" stroke="${LN}" stroke-width="${SW * .8}"/></g>`;
  }
  s += `<path d="M996 514Q1008 500 1034 506L1050 520Q1034 530 1008 532Q994 528 996 514Z" fill="${RXC.tan}" stroke="${LN}" stroke-width="${SW}" stroke-linejoin="round"/>`;   // atlas
  return s;
}
function rxOmbro() {
  let s = '';
  s += barra([[838, 1080], [880, 1040], [950, 1005], [1030, 985]], 30);
  s += barra([[812, 1130], [850, 1090], [915, 1050], [990, 1030]], 30);
  s += bone('M1150 905C1165 878 1195 862 1212 866C1262 884 1312 930 1328 990L1338 1140L1236 1140C1236 1060 1215 1000 1176 962C1160 946 1148 925 1150 905Z');
  s += line([[1195, 905], [1260, 940], [1300, 985]]);
  s += `<circle cx="1090" cy="993" r="57" fill="${RXC.osso}" stroke="${LN}" stroke-width="${SW}"/>`;
  return s;
}
const CLAVICULA = [[905, 940], [960, 925], [1040, 908], [1120, 898], [1168, 895]];

/* ===================== pele (silhueta) com a mandíbula deformável ===================== */
const SK_STAT = rdense([[681, 547], [678, 529], [681, 500], [663, 488], [639, 476], [634, 453], [648, 424], [675, 394], [698, 353], [698, 294], [703, 235], [725, 187], [751, 139], [795, 100], [847, 70], [908, 52], [995, 39], [1082, 43], [1169, 65], [1238, 100], [1282, 165], [1299, 235], [1303, 296], [1290, 365], [1264, 426], [1230, 478], [1199, 530], [1190, 591], [1199, 661], [1221, 722], [1256, 783], [1299, 843], [1334, 904], [1360, 965], [1386, 1043], [1400, 1130]], false, 7);
const SK_NF = rdense([[750, 1130], [765, 1070], [790, 1020], [828, 975], [865, 930], [893, 885], [904, 835], [896, 775], [892, 730], [878, 708], [856, 696], [853, 688], [850, 672], [846, 650]], false, 7);
const SK_JAW = [[686, 565], [683, 582], [701, 606], [704, 647], [722, 676], [751, 688], [804, 700], [856, 697], [910, 693], [960, 690]];
function segInt(a, b, c, d) { const rx = b[0] - a[0], ry = b[1] - a[1], sx = d[0] - c[0], sy = d[1] - c[1], den = rx * sy - ry * sx; if (Math.abs(den) < 1e-9) return null; const t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / den, u = ((c[0] - a[0]) * ry - (c[1] - a[1]) * rx) / den; return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? { t, u, p: [a[0] + t * rx, a[1] + t * ry] } : null; }
function rxPele(k) {
  const jaw = rdense(SK_JAW.map(p => mrot(p, k)), false, 7);
  let ji = jaw.length - 1, ni = 0, J = jaw[jaw.length - 1];
  outer: for (let i = 0; i < jaw.length - 1; i++) for (let j = 0; j < SK_NF.length - 1; j++) { const h = segInt(jaw[i], jaw[i + 1], SK_NF[j], SK_NF[j + 1]); if (h) { ji = i; ni = j; J = h.p; break outer; } }
  const U = [681, 547], L = jaw[0], C = [701 + 42 * k, 553 + 14 * k];
  const notch = rdense([U, [U[0] + 9, U[1] + 3], C, [(C[0] + L[0]) / 2 + 2, (C[1] + L[1]) / 2], L], false, 6);
  // monta: estático (do lábio superior, em volta da cabeça, até o fundo) + fundo + frente do pescoço (de baixo até J) + mandíbula (de J ao lábio) + entalhe
  const pts = [...SK_STAT, [1400, 1130], [750, 1130], ...SK_NF.slice(0, ni + 1).reverse().filter((_, i, a) => true)];
  // SK_NF vai de baixo para cima: parte de baixo até ni, depois J
  const nfBase = SK_NF.slice(0, ni + 1);
  const all = [...SK_STAT, [1400, 1130], ...nfBase, J, ...jaw.slice(0, ji + 1).reverse(), ...notch.slice().reverse()];
  // arredonda o canto do pescoço com a garganta (J)
  const jidx = all.findIndex(p => p === J), R = 16, out = [];
  for (let i = 0; i < all.length; i++) {
    if (Math.abs(i - jidx) < 1) continue;
    const near = Math.hypot(all[i][0] - J[0], all[i][1] - J[1]) < R;
    if (near && i !== jidx) continue;
    out.push(all[i]);
  }
  // reinsere J suavizado como curva
  const before = all.slice(0, jidx).reverse().find(p => Math.hypot(p[0] - J[0], p[1] - J[1]) >= R), after = all.slice(jidx + 1).find(p => Math.hypot(p[0] - J[0], p[1] - J[1]) >= R);
  const fil = []; if (before && after) { const a = [J[0] + (before[0] - J[0]) * R / Math.hypot(before[0] - J[0], before[1] - J[1]), J[1] + (before[1] - J[1]) * R / Math.hypot(before[0] - J[0], before[1] - J[1])], b = [J[0] + (after[0] - J[0]) * R / Math.hypot(after[0] - J[0], after[1] - J[1]), J[1] + (after[1] - J[1]) * R / Math.hypot(after[0] - J[0], after[1] - J[1])]; for (let u = 0; u <= 1.001; u += .2) { const q = 1 - u; fil.push([q * q * a[0] + 2 * q * u * J[0] + u * u * b[0], q * q * a[1] + 2 * q * u * J[1] + u * u * b[1]]); } }
  const seq = [...all.slice(0, jidx).filter(p => Math.hypot(p[0] - J[0], p[1] - J[1]) >= R), ...fil, ...all.slice(jidx + 1).filter(p => Math.hypot(p[0] - J[0], p[1] - J[1]) >= R)];
  return { d: rpoly(seq, true), C, L, U };
}

/* ===================== conjunto ===================== */
function cabecaRX(o = {}) {
  const { act = .7, t = 0 } = o, k = easeInOut(clamp(o.yawn || 0));
  const pele = rxPele(k);
  def(`<clipPath id="rxSilC"><path d="${pele.d}"/></clipPath><clipPath id="rxMandC"><path d="${MAND}"/></clipPath><filter id="rxB10" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10"/></filter><filter id="rxB5" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
<linearGradient id="rxPeleG" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="0" y2="1130"><stop offset="0" stop-color="#5E8197"/><stop offset=".55" stop-color="#4C6A84"/><stop offset="1" stop-color="#3E5B76"/></linearGradient>`);
  let s = `<path d="${pele.d}" fill="url(#rxPeleG)"/>`;
  s += `<g clip-path="url(#rxSilC)"><path d="${pele.d}" fill="none" stroke="#86CBE6" stroke-width="34" opacity=".32" filter="url(#rxB10)"/>`;
  // boca aberta: cavidade escura e língua (entre as fileiras de dentes)
  if (k > .02) {
    const a1 = [724, 559], a2 = [866, 541], b2 = mrot([864, 546], k), b1 = mrot([730, 563], k);
    s += `<path d="M${rpt(a1)}L${rpt(a2)}L${rpt(b2)}L${rpt(b1)}Z" fill="#4A1B33"/>`;
    const t1 = mrot([740, 566], k), t2 = mrot([850, 549], k);
    s += `<path d="M${rpt(t1)}Q${f1((t1[0] + t2[0]) / 2)} ${f1((t1[1] + t2[1]) / 2 - 46 * k)} ${rpt(t2)}Z" fill="#E4708C"/>`;
  }
  s += `</g>`;
  s += rxOmbro() + rxColuna() + barra(CLAVICULA, 38);
  s += rxCranio() + rxMandibula(k);
  s += rxCerebro(act, t);
  s += `<path d="${pele.d}" fill="none" stroke="${RXC.glow}" stroke-width="16" opacity=".22" filter="url(#rxB5)"/><path d="${pele.d}" fill="none" stroke="${RXC.glow}" stroke-width="6.5" stroke-linejoin="round"/>`;
  return s;
}

/* ===================== na cena: posiciona, espelha (rosto para a direita) e solta os "Z" ===================== */
function cabeca(t, act, yawn, zk) {
  const S = .9;
  let s = `<g transform="translate(545,595) scale(${-S},${S}) translate(-1000,-40)">${cabecaRX({ act, t, yawn })}</g>`;
  for (let i = 0; i < 3; i++) s += zeta(450 + i * 55, 555 - i * 70 - 110 * zk, 1 + .4 * i + zk, Math.sin(clamp(zk * 1.2 - i * .2) * Math.PI) * .9);
  return s;
}
function rxDev(o) {
  if (o.part === 'brain') return `<rect x="780" y="60" width="520" height="440" fill="${RXC.osso}"/>` + rxCerebro(o.act, o.t);
  return cabecaRX({ act: o.act, t: o.t, yawn: o.yawn });
}
