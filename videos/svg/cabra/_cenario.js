/* =====================================================================================
   CENÁRIO DO PÔR DO SOL (planos 1 e 8): céu, sol, raios, serras em camadas, névoa, penhasco com camadas de rocha, borda,
   arbusto espinhoso que a cabra mordisca, pedrinha que cai, aves lá embaixo, poeira dourada, folhas desfocadas em primeiro plano.
   Espaço do mundo = unidades do corpo (chão da cabra em y=0). A câmera base [60,120,1.05] é o plano aberto; as camadas
   usam paralaxe (p=0 céu fixo ... p=1 cabra ... p>1 primeiro plano) e por isso o "afastar" da câmera revela o abismo.
   ===================================================================================== */
const BASE_W = [60, 120, 1.05];
const SUN_S1 = { x: 330, y: -250, r: 120 };
EXTRA += `<linearGradient id="gCeu" gradientUnits="userSpaceOnUse" x1="0" y1="-1100" x2="0" y2="140"><stop offset="0" stop-color="#241F54"/><stop offset=".22" stop-color="#4B2F74"/><stop offset=".45" stop-color="#A44878"/><stop offset=".66" stop-color="#E7714A"/><stop offset=".85" stop-color="#FFAE5A"/><stop offset="1" stop-color="#FFD98E"/></linearGradient>
<radialGradient id="gSol2"><stop offset="0" stop-color="#FFFBE6"/><stop offset=".55" stop-color="#FFE9A8"/><stop offset=".8" stop-color="#FFC66A" stop-opacity=".9"/><stop offset="1" stop-color="#FFA24A" stop-opacity="0"/></radialGradient>
<radialGradient id="gHalo"><stop offset="0" stop-color="#FFF0B8" stop-opacity=".95"/><stop offset=".25" stop-color="#FFC070" stop-opacity=".55"/><stop offset=".6" stop-color="#FF8A48" stop-opacity=".18"/><stop offset="1" stop-color="#FF7A3A" stop-opacity="0"/></radialGradient>
<linearGradient id="gRaio" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFE7A8" stop-opacity=".5"/><stop offset="1" stop-color="#FFC878" stop-opacity="0"/></linearGradient>
<linearGradient id="gNevoa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB27A" stop-opacity="0"/><stop offset=".5" stop-color="#FFB887" stop-opacity=".55"/><stop offset="1" stop-color="#E88A78" stop-opacity=".25"/></linearGradient>
<linearGradient id="gRocha" gradientUnits="userSpaceOnUse" x1="170" y1="0" x2="-500" y2="0"><stop offset="0" stop-color="#C46A44"/><stop offset=".12" stop-color="#8A4A3C"/><stop offset=".45" stop-color="#4A2C3E"/><stop offset="1" stop-color="#1C1226"/></linearGradient>
<linearGradient id="gTopo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E2905A"/><stop offset=".2" stop-color="#9C5A44"/><stop offset="1" stop-color="#3A2234"/></linearGradient>
<filter id="fDesf" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="fDesf2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter>`;

/* serra: contorno por soma de senos com fases fixas (determinístico) */
function serraPts(seed, y0, amp, x0 = -1200, x1 = 1400, passo = 40, rug = 1) {
  const pts = [];
  for (let x = x0; x <= x1; x += passo) {
    const u = x * .004 + seed * 3.1;
    const y = y0 + amp * (Math.sin(u) * .5 + Math.sin(u * 2.3 + seed) * .3 + Math.sin(u * 5.1 + seed * 2) * .15 * rug + Math.sin(u * 11.7 + seed * 5) * .06 * rug);
    pts.push([x, y]);
  }
  return pts;
}
const serraPath = (pts, fundo = 1800) => 'M' + pts.map(rpt).join('L') + `L${pts[pts.length - 1][0]} ${fundo}L${pts[0][0]} ${fundo}Z`;

function ceuS1(t, SUN = SUN_S1) {
  let s = `<rect x="-3200" y="-3400" width="6400" height="5400" fill="url(#gCeu)"/>`;
  // cirros alaranjados (faixas finas e longas)
  for (let i = 0; i < 6; i++) {
    const y = -520 + i * 62 + 30 * hh(i, 1), x = -500 + 240 * hh(i, 2) + 6 * t * (1 + .3 * i % 2), w = 520 + 300 * hh(i, 3);
    s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(w)}" ry="${f1(7 + 9 * hh(i, 4))}" fill="${i % 2 ? '#FFB27A' : '#FFD7A0'}" opacity="${f1(.2 + .18 * hh(i, 5))}" filter="url(#b12)"/>`;
  }
  // halo + disco do sol
  s += `<circle cx="${SUN.x}" cy="${SUN.y}" r="${SUN.r * 3.4}" fill="url(#gHalo)"/>`;
  s += `<circle cx="${SUN.x}" cy="${SUN.y}" r="${SUN.r}" fill="url(#gSol2)"/>`;
  // raios de luz (lentos)
  s += `<g opacity=".55">`;
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (.52 + .5 * (i / 8)) + .03 * Math.sin(t * .4 + i * 1.7), L = 1500, w = .05 + .035 * hh(i, 7);
    const ex = SUN.x + Math.cos(a) * L, ey = SUN.y + Math.sin(a) * L;
    s += `<path d="M${SUN.x} ${SUN.y}L${f1(ex - Math.sin(a) * L * w)} ${f1(ey + Math.cos(a) * L * w)}L${f1(ex + Math.sin(a) * L * w)} ${f1(ey - Math.cos(a) * L * w)}Z" fill="#FFE0A0" opacity="${f1(.08 + .08 * hh(i, 9))}"/>`;
  }
  s += `</g>`;
  return s;
}
function serrasS1(t) {
  const cor = [['#E39A8E', '#F4B58A', -170, 30, 1], ['#C27384', '#E98F82', -70, 42, 2], ['#97507A', '#C46A7A', 100, 60, 3], ['#6A3A6C', '#8E4A72', 340, 80, 4]];
  const out = [];
  cor.forEach(([c0, c1, y0, amp, sd], i) => {
    const id = 'gSer' + i, p = serraPts(sd, y0, amp, -1200, 1400, 40, 1);
    out.push({ p: [.04, .09, .17, .27][i], svg: `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c0}"/><stop offset="1" stop-color="${c1}"/></linearGradient></defs><path d="${serraPath(p, y0 + 1100)}" fill="url(#${id})"/><rect x="-1300" y="${y0 + 20}" width="2800" height="${amp * 5 + 160}" fill="url(#gNevoa)" opacity="${f1(.9 - i * .15)}"/>` });
  });
  return out;
}

/* penhasco: massa de rocha à esquerda da borda, camadas, trincas, borda com luz de recorte */
const BORDA = [[152, 0], [160, 34], [158, 76], [174, 84], [172, 132], [146, 142], [142, 214], [162, 222], [160, 300], [122, 312], [120, 396], [144, 408], [140, 490], [108, 502], [106, 590], [128, 600], [124, 700], [92, 712], [90, 820], [112, 830], [106, 940], [74, 950], [70, 1100], [90, 1110], [84, 1500]];
/* penhasco: massa de rocha à esquerda da borda, camadas, trincas, borda com luz de recorte */
function penhascoS1(t) {
  const borda = BORDA;
  let poly = `M-1500 0L-1500 1700L${borda[borda.length - 1][0]} 1700`;
  for (let i = borda.length - 1; i >= 0; i--) poly += 'L' + rpt(borda[i]);
  poly += 'L-1500 0Z';
  const id = nid('cl');
  def(`<clipPath id="${id}"><path d="${poly}"/></clipPath>`);
  let s = `<path d="${poly}" fill="url(#gRocha)"/>`;
  s += `<g clip-path="url(#${id})">`;
  // camadas inclinadas de estratos
  for (let i = 0; i < 22; i++) {
    const y = 60 + i * 66 + 18 * hh(i, 3), sl = -20 + 40 * hh(i, 4), th = 4 + 14 * hh(i, 5);
    s += `<path d="M-1500 ${f1(y - sl * 20)}L200 ${f1(y + sl * 5)}L200 ${f1(y + sl * 5 + th)}L-1500 ${f1(y - sl * 20 + th * 1.6)}Z" fill="${i % 3 ? '#1C1226' : '#C46A44'}" opacity="${f1(i % 3 ? .22 : .08)}"/>`;
  }
  // trincas verticais e blocos
  for (let i = 0; i < 26; i++) {
    const x = 160 - 600 * Math.pow(hh(i, 11), 1.6), y = 20 + 1400 * hh(i, 12), L = 40 + 200 * hh(i, 13);
    s += `<path d="M${f1(x)} ${f1(y)}l${f1(-8 + 16 * hh(i, 14))} ${f1(L * .35)}l${f1(-10 + 20 * hh(i, 15))} ${f1(L * .65)}" stroke="#0E0814" stroke-width="${f1(1.6 + 2.4 * hh(i, 16))}" fill="none" opacity=".5"/>`;
  }
  // manchas de líquen/ferrugem perto da borda
  for (let i = 0; i < 60; i++) { const y = 30 + 1300 * hh(i, 21), x = bordaX(y) - 10 - 120 * hh(i, 22) * hh(i, 23); s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(6 + 22 * hh(i, 24))}" ry="${f1(3 + 8 * hh(i, 25))}" fill="${i % 2 ? '#E8A05A' : '#6A4A56'}" opacity="${f1(.12 + .14 * hh(i, 26))}"/>`; }
  s += `</g>`;
  // luz de recorte na borda voltada para o sol
  let rim = 'M' + borda.map(rpt).join('L');
  s += `<path d="${rim}" stroke="#FFC878" stroke-width="7" fill="none" opacity=".35" filter="url(#b4)"/><path d="${rim}" stroke="#FFE7B0" stroke-width="2.6" fill="none" opacity=".85"/>`;
  return s;
}
function bordaX(y) { const b = BORDA; for (let i = 0; i < b.length - 1; i++) if (y >= b[i][1] && y <= b[i + 1][1]) return lerp(b[i][0], b[i + 1][0], (y - b[i][1]) / (b[i + 1][1] - b[i][1])); return b[b.length - 1][0]; }

/* a borda onde a cabra pisa: laje de rocha com pedras, tufos de capim seco e florzinhas */
function lajeS1(t) {
  let top = [];
  for (let x = -1500; x <= 160; x += 30) top.push([x, -2 + 5 * Math.sin(x * .02) + 4 * Math.sin(x * .071 + 1) + (x > 100 ? (x - 100) * .08 : 0)]);
  top.push([166, 14]);
  let d = 'M-1500 70L' + top.map(rpt).join('L') + 'L150 70Z';
  let s = `<path d="${d}" fill="url(#gTopo)"/>`;
  s += `<path d="M${top.map(rpt).join('L')}" stroke="#FFD9A0" stroke-width="2.6" fill="none" opacity=".85"/>`;
  // pedras
  for (let i = 0; i < 16; i++) { const x = -420 + 560 * hh(i, 31), r = 7 + 18 * hh(i, 32); if (Math.abs(x - 75) < 55 || Math.abs(x + 190) < 50) continue; s += `<path d="M${f1(x - r)} 2Q${f1(x - r * .8)} ${f1(-r * .9)} ${f1(x)} ${f1(-r)}Q${f1(x + r * .9)} ${f1(-r * .8)} ${f1(x + r)} 2Z" fill="${i % 2 ? '#6B4040' : '#8A5648'}"/><path d="M${f1(x - r * .7)} ${f1(-r * .4)}Q${f1(x)} ${f1(-r * 1.1)} ${f1(x + r * .5)} ${f1(-r * .8)}" stroke="#FFD0A0" stroke-width="1.6" fill="none" opacity=".6"/>`; }
  // capim seco (lâminas finas, balançam com o vento)
  for (let i = 0; i < 90; i++) {
    const x = -480 + 640 * hh(i, 41), h = 14 + 36 * hh(i, 42), sw = Math.sin(t * 1.4 + i * .9) * 3 + 2;
    s += `<path d="M${f1(x)} 2Q${f1(x + sw * .5)} ${f1(-h * .6)} ${f1(x + sw + (hh(i, 43) - .5) * 10)} ${f1(-h)}" stroke="${i % 3 ? '#D9A760' : '#8F6A3A'}" stroke-width="${f1(1.2 + 1.2 * hh(i, 44))}" fill="none" stroke-linecap="round" opacity=".9"/>`;
  }
  // florzinhas amarelas perto da borda
  for (let i = 0; i < 7; i++) { const x = 100 + 55 * hh(i, 51), h = 12 + 16 * hh(i, 52); s += `<path d="M${f1(x)} 2L${f1(x + 1)} ${f1(-h)}" stroke="#7A8A3A" stroke-width="1.6"/><circle cx="${f1(x + 1)}" cy="${f1(-h)}" r="${f1(3 + 2 * hh(i, 53))}" fill="#FFD84A"/>`; }
  return s;
}

/* arbusto espinhoso que nasce da fenda da borda e se curva até a boca da cabra: galho principal afilado, ramos finos com folhas
   alternadas e espinhos; as folhas tremem com o vento */
const ARB_PTS = [[142, 8], [148, -70], [178, -160], [232, -240], [296, -300], [362, -340], [426, -352]];
function folhaPath(x, y, ang, L, Wd) {
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  const mx = x + dx * L * .5, my = y + dy * L * .5, tx = x + dx * L, ty = y + dy * L;
  return `M${f1(x)} ${f1(y)}Q${f1(mx + nx * Wd)} ${f1(my + ny * Wd)} ${f1(tx)} ${f1(ty)}Q${f1(mx - nx * Wd)} ${f1(my - ny * Wd)} ${f1(x)} ${f1(y)}Z`;
}
function arbustoS1(t) {
  let s = '';
  const tr = rdense(ARB_PTS, false, 8), n = tr.length;
  const ptsT = [];  // tubo afilado do galho principal
  const poly = tubo(ARB_PTS, [8, 6.5, 5, 4, 3, 2.4, 2], [8, 6.5, 5, 4, 3, 2.4, 2], 8);
  s += `<path d="${pathPoly(poly)}" fill="#3A2420"/><path d="M${tr.map(rpt).join('L')}" stroke="#7A5240" stroke-width="2.2" fill="none" opacity=".75" transform="translate(1.5,-2.5)"/><path d="M${tr.map(rpt).join('L')}" stroke="#FFC98A" stroke-width="1.4" fill="none" opacity=".45" transform="translate(3,-3.5)"/>`;
  const ramos = [[.30, 70, -1], [.42, 96, 1], [.52, 74, -1], [.62, 106, 1], [.72, 80, -1], [.80, 100, 1], [.88, 70, -1], [.95, 60, 1]];
  ramos.forEach(([u, L, sg], k) => {
    const i = Math.min(n - 2, Math.floor(u * (n - 1))), p = tr[i], q = tr[i + 1], a0 = Math.atan2(q[1] - p[1], q[0] - p[0]), a = a0 + sg * (.42 + .22 * hh(k, 61));
    // curva do ramo (sobe um pouco, como galho que busca a luz)
    const ctrl = [[p[0], p[1]], [p[0] + Math.cos(a) * L * .5, p[1] + Math.sin(a) * L * .5 - 8], [p[0] + Math.cos(a) * L, p[1] + Math.sin(a) * L - 20]];
    const rp = rdense(ctrl, false, 8);
    s += `<path d="M${rp.map(rpt).join('L')}" stroke="#3A2420" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M${rp.map(rpt).join('L')}" stroke="#FFC98A" stroke-width="1" fill="none" opacity=".4" transform="translate(1,-1.4)"/>`;
    // folhas alternadas ao longo do ramo + espinhos
    const nl = 6 + Math.floor(3 * hh(k, 62));
    for (let j = 1; j <= nl; j++) {
      const uu = j / nl, ii = Math.min(rp.length - 2, Math.floor(uu * (rp.length - 1))), pp = rp[ii], qq = rp[ii + 1], ta = Math.atan2(qq[1] - pp[1], qq[0] - pp[0]);
      const side = j % 2 ? 1 : -1, la = ta + side * (.75 + .25 * hh(k * 9 + j, 63)) + .06 * Math.sin(t * 1.7 + k + j), LL = 15 + 9 * hh(k * 9 + j, 64) + 5 * uu;
      const col = (j + k) % 4 === 0 ? '#C9D060' : (j + k) % 4 === 1 ? '#8FB040' : (j + k) % 4 === 2 ? '#6C9034' : '#A8C250';
      s += `<path d="${folhaPath(pp[0], pp[1], la, LL, 5.5 + 2 * hh(k * 9 + j, 65))}" fill="${col}" stroke="#2B3A18" stroke-width=".7"/><path d="M${f1(pp[0])} ${f1(pp[1])}L${f1(pp[0] + Math.cos(la) * LL * .85)} ${f1(pp[1] + Math.sin(la) * LL * .85)}" stroke="#F4F6A8" stroke-width=".8" opacity=".55"/>`;
      if (j % 3 === 0) s += `<path d="M${f1(pp[0])} ${f1(pp[1])}l${f1(Math.cos(ta - side * 1.5) * 7)} ${f1(Math.sin(ta - side * 1.5) * 7)}" stroke="#2A1A1E" stroke-width="1.6" stroke-linecap="round"/>`;
    }
    // folhas na ponta
    const tp = rp[rp.length - 1], tq = rp[rp.length - 2], te = Math.atan2(tp[1] - tq[1], tp[0] - tq[0]);
    for (let j = -1; j <= 1; j++) s += `<path d="${folhaPath(tp[0], tp[1], te + j * .55 + .06 * Math.sin(t * 1.9 + k + j), 19 + 4 * j * j, 6)}" fill="${j ? '#8FB040' : '#C9D060'}" stroke="#2B3A18" stroke-width=".7"/>`;
  });
  return s;
}

/* aves (urubus/águias) planando lá embaixo: dão escala ao abismo */
function avesS1(t) {
  let s = '';
  for (let i = 0; i < 3; i++) {
    const x = -300 + ((t * (14 + 5 * i) + 300 * i) % 1100), y = 460 + 140 * i + 22 * Math.sin(t * .6 + i), sc = .8 + .35 * i, fl = Math.sin(t * 2.2 + i * 2) * .12;
    s += `<g transform="translate(${f1(x)},${f1(y)}) scale(${sc}) rotate(${f1(-6 + 4 * Math.sin(t * .5 + i))})"><path d="M-34 4Q-18 ${f1(-10 - fl * 60)} -3 -2Q0 -3 3 -2Q18 ${f1(-10 - fl * 60)} 34 4Q18 ${f1(-3 - fl * 40)} 3 3L-3 3Q-18 ${f1(-3 - fl * 40)} -34 4Z" fill="#26141F"/></g>`;
  }
  return s;
}
/* poeira dourada flutuando na contraluz */
function poeiraS1(t, z = 1) {
  let s = '';
  for (let i = 0; i < 46; i++) {
    const x = -200 + 700 * hh(i, 71) + 18 * Math.sin(t * .5 + i * 2) + t * (3 + 4 * hh(i, 72)), y = -700 + 900 * hh(i, 73) + 14 * Math.sin(t * .7 + i * 3) - t * 5 * hh(i, 74), r = (1.2 + 2.6 * hh(i, 75)) * z, tw = .45 + .45 * Math.sin(t * 2.4 + i * 1.7);
    s += `<circle cx="${f1(((x + 200) % 700) - 200)}" cy="${f1(y)}" r="${f1(r)}" fill="#FFE6A8" opacity="${f1(.25 + .5 * tw * hh(i, 76))}"/>`;
  }
  return s;
}
/* folhas e ramos desfocados passando na frente da lente (primeiro plano) */
function folhasFrente(t, k = 1) {
  let s = '';
  const L = [[-330, 420, 70, -.9, '#6C9034'], [-260, 520, 90, -.5, '#C9D060'], [-380, 340, 60, -1.2, '#8FB040'], [420, -820, 80, 2.3, '#C9D060'], [350, -760, 110, 2.7, '#6C9034']];
  for (const [x, y, r, a, c] of L) s += `<g transform="translate(${x},${y}) rotate(${f1(a * 57.3 + 4 * Math.sin(t * .9 + x))})"><path d="M0 0C${r * .5} ${-r * .6} ${r * 1.2} ${-r * .5} ${r * 1.7} 0C${r * 1.2} ${r * .5} ${r * .5} ${r * .6} 0 0Z" fill="${c}" opacity="${f1(.55 * k)}"/></g>`;
  return s;
}
