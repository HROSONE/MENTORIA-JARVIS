/* board2d.js — monta cada plano do storyboard em 2D (1080x1920). BOARD2D(n) -> svg */
(function (G) {
  const { PR, SET, POSES: PO, D2, RIG } = G; const { V, M } = RIG;
  const W = 1080, H = 1920; const f = n => Math.round(n * 100) / 100;
  const open = bg => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${PR.DEFS}${SET.DEFS}</defs><rect width="${W}" height="${H}" fill="${bg || '#d7cdbb'}"/>`;
  const close = cam => SET.finish(cam) + '</svg>';
  // personagem no mundo
  function man(cam, X, Z, tipo, pose, o) {
    o = o || {}; const r = D2.draw(tipo, pose, o);
    return SET.at(cam, X, 0, Z, (o.noShadow ? '' : PR.shadow(o.sx || 0, o.sw || 30, 4, .8)) + (o.under || '') + r.svg + (o.over ? o.over(r) : ''), o.blur ? ` filter="url(#${o.blur})"` : '');
  }
  // terminal: fundo + piso + lojas + painel
  function terminal(cam, year, o) {
    o = o || {};
    let s = SET.at(cam, 0, 0, 4500, SET.atrium(0), ' filter="url(#fDof2)"');
    s += `<g filter="url(#fDof1)">` + SET.at(cam, 0, 0, 3600, SET.tube(-2600, -500, 800, -2300, 130, 2, 3) + SET.tube(2700, -1200, -600, -3200, 130, 5, 8)) + `</g>`;
    s += SET.floor(cam);
    s += `<g filter="url(#fDof1)">` + SET.at(cam, o.shopX || 0, 0, 1400, SET.shopRow()) + SET.at(cam, (o.shopX || 0) - 60, -300, 1395, SET.brandBox(250)) + `</g>`;
    if (year != null) s += SET.boardAt(cam, o.bx || 0, o.by == null ? -470 : o.by, o.bz == null ? 260 : o.bz, year);
    return s;
  }
  // montanha de coisas em volta do banco. lv 0..1
  function pileBack(cam, lv) {
    const it = [ // [X, Z, tipo, w, h, nível mínimo, extra]
      [-150, 90, 'box', 70, 55, .1, { label: 'JORNAIS' }], [150, 90, 'box', 64, 50, .2, {}],
      [-150, 90.1, 'box2', 60, 46, .35, { y: -55, papers: 1 }], [-60, 100, 'box', 66, 58, .3, { label: '1993' }], [70, 100, 'box', 72, 62, .45, { label: 'REVISTAS' }],
      [150, 90.1, 'box2', 58, 44, .5, { y: -50 }], [-60, 100.1, 'box2', 60, 48, .6, { y: -58, label: 'DIÁRIO' }], [70, 100.1, 'box2', 64, 46, .7, { y: -62, papers: 1 }],
      [-240, 70, 'box', 76, 64, .65, {}], [245, 70, 'box', 70, 60, .75, { label: 'LIVROS' }], [-240, 70.1, 'box2', 62, 50, .85, { y: -64 }],
      [-150, 90.2, 'box2', 52, 40, .8, { y: -101 }], [245, 70.1, 'box2', 60, 48, .92, { y: -60, papers: 1 }], [0, 110, 'box', 70, 60, .88, {}], [0, 110.1, 'box2', 60, 50, .95, { y: -60, label: '2004' }],
    ];
    let s = '';
    it.filter(a => lv >= a[5]).sort((a, b) => b[1] - a[1]).forEach(a => { const e = a[6] || {}; s += SET.at(cam, a[0], e.y || 0, a[1], (e.y ? '' : PR.shadow(0, a[3] * .6, 4, .7)) + PR.box(0, 0, a[3], a[4], e)); });
    return s;
  }
  function pileFront(cam, lv, o) {
    o = o || {}; let s = '';
    if (lv >= .15) s += SET.at(cam, o.poster ? -128 : 128, 0, -8, PR.shadow(0, 26, 4, .7) + PR.suitcase(0, 0, 44, 70, 'gSuit1', o.poster ? { poster: PR.poster(0, -36, 30, 42, -3) } : {}));
    if (lv >= .4) s += SET.at(cam, o.poster ? -182 : -126, 0, -6, PR.shadow(0, 22, 4, .7) + PR.suitcase(0, 0, 40, 60, 'gSuit2'));
    if (lv >= .55) s += SET.at(cam, -178, 0, -30, PR.shadow(0, 20, 3, .7) + PR.papers(0, 0, 34, 30, 3));
    if (lv >= .75) s += SET.at(cam, 186, 0, -34, PR.shadow(0, 20, 3, .7) + PR.papers(0, 0, 36, 42, 9) + PR.papers(40, 0, 32, 22, 5));
    if (lv >= .9) s += SET.at(cam, -236, 0, -48, PR.shadow(0, 26, 4, .7) + PR.suitcase(0, 0, 46, 56, 'gSuit3') + PR.papers(-4, -56, 30, 14, 2));
    return s;
  }
  const bench = (cam, n) => SET.at(cam, 0, 0, 0, PR.bench(n || 3, 'front'));
  const benchSide = (cam, X) => SET.at(cam, X || 0, 0, 0, PR.bench(1, 'side'));
  const passers = (cam, list) => list.map(p => SET.passer(cam, p[0], p[1], p[2], p[3] || 'passageiro', p[4] || 1, p[5], { case: p[6], op: p[7] })).join('');
  const pipeX = (dir, ember, smokeT) => r => { const m = r.proj(r.J.mouth); return PR.pipe(m[0] + dir * .5, m[1] + .3, dir, { ember }) + (smokeT != null ? PR.smoke(m[0] + dir * 13, m[1] - 2, smokeT) : ''); };
  const hold = (side, fn) => r => { const g = r.proj(r.J['grip' + side]); return fn(g[0], g[1], r); };

  const S = {};
  // 1 — QUADRO 0
  S[1] = (yr) => {
    const cam = SET.C({ z: -370, y: -116, f: 2050, hz: .6 }); let s = open();
    s += terminal(cam, yr || '18 ANOS', { by: -545, bz: 520 });
    s += passers(cam, [[-330, 300, .2, 'passageira', 1, 1, 'gSuit2', .9], [300, 420, .7, 'passageiro', -1, 1, 'gSuit3', .9]]);
    s += pileBack(cam, 1) + bench(cam, 3);
    s += man(cam, 0, 0, 'nasseri', PO.sitPipe({ yaw: 16 }), { over: pipeX(1, 1, .35) });
    s += pileFront(cam, 1);
    s += passers(cam, [[-250, -330, .1, 'passageiro', 1, 2, 'gSuit1', .8]]);
    return s + close(cam);
  };
  // 2 — close do cachimbo
  S[2] = () => {
    const cam = SET.C({ z: -300, y: -112, f: 2150, hz: .5, x: 6 }); let s = open();
    s += terminal(cam, null);
    s += pileBack(cam, 1) + bench(cam, 3);
    s += man(cam, 0, 0, 'nasseri', PO.sitPipe({ yaw: 24, head: [-4, 0, 0] }, .6), { over: pipeX(1, .4, .6) });
    s += pileFront(cam, 1);
    return s + close(cam);
  };
  // 3 — estação, 1988
  const yearTag = (t, col) => `<g transform="translate(540,250)"><rect x="-170" y="-80" width="340" height="130" rx="10" fill="#1b1e24"/><text x="0" y="24" font-family="Anton,Impact,Arial Black" font-size="110" fill="${col || '#ffd54a'}" text-anchor="middle">${t}</text></g>`;
  S[3] = () => {
    const cam = SET.C({ z: -330, y: -105, f: 1900, hz: .58, x: -30 }); let s = open('#e9d5b0');
    s += SET.stationBG(cam, { clockX: 95 });
    s += SET.at(cam, -95, 0, 6, PR.shadow(0, 26, 4) + PR.briefcase(0, -34));
    s += man(cam, 10, 0, 'nasseri', PO.standWatch({ yaw: 80 }), {});
    s += yearTag('1988');
    return s + close(cam);
  };
  S[4] = () => {
    const cam = SET.C({ z: -290, y: -105, f: 1900, hz: .58, x: -30 }); let s = open('#e9d5b0');
    s += SET.stationBG(cam, { clockX: 95, min: 150 });
    s += SET.at(cam, -95, 0, 6, `<rect x="-22" y="-33" width="44" height="32" rx="3" fill="none" stroke="#7a5a30" stroke-width="1.6" stroke-dasharray="5 4"/><text x="0" y="-9" font-family="Arial Black,Arial" font-weight="900" font-size="20" fill="#7a5a30" text-anchor="middle">?</text>`);
    s += man(cam, 10, 0, 'nasseri', PO.standShock({ yaw: -35, head: [10, -18, 0], spine: [6, 0, -8], armL: { t: [13, 159, 5], hand: 'open', hd: [-0.5, 1, 0], palm: [-1, 0, 0], pole: [1, -0.2, 0.3] }, armR: { t: [-13, 159, 5], hand: 'open', hd: [0.5, 1, 0], palm: [1, 0, 0], pole: [-1, -0.2, 0.3] } }), {});
    return s + close(cam);
  };
  // 5/6 — Londres
  function london(ag, na, cx) {
    const cam = SET.C({ z: -470, y: -108, f: 1900, hz: .58, x: 22 }); let s = open('#d9dde3');
    s += SET.londonDesk(cam) + SET.floor(cam);
    s += man(cam, 112, 40, 'oficial', ag.pose, { over: ag.over });
    s += SET.at(cam, 122, 0, 0, PR.shadow(0, 70, 8) + SET.deskFront());
    s += man(cam, -62, 0, 'nasseri', na.pose, { over: na.over });
    return s + close(cam);
  }
  S[5] = () => london({ pose: PO.handOut('oficial', { yaw: -75, armR: { t: [-14, 118, 60], hand: 'open', hd: [0, 0, 1], palm: [0, 1, 0] } }) }, { pose: PO.standShrug({ yaw: 55 }) });
  S[6] = () => london({ pose: PO.stand({ yaw: -75, head: [-4, 0, 0], armR: { t: [-10, 142, 62], hand: 'relax', hd: [0, 0.05, 1], palm: [1, 0, 0], pole: [-1, -1, 0] }, armL: { t: [26, 100, 6], hand: 'fist', pole: [1, 0, -1] } }) },
    { pose: PO.stand({ yaw: 40, spine: [8, 0, 0], chest: [10, 0, 0], neck: [10, 0, 0], head: [16, 0, 0] }) }, -10);
  // 7 — avião
  S[7] = () => {
    const cam = SET.C({ z: -3000, y: -600, f: 1800, hz: .5 }); let s = open('#a9d4f2');
    s += SET.skyBG(cam);
    s += `<g transform="translate(560,900) rotate(4) scale(0.27)">${SET.plane2d({ flip: 1 })}</g>`;
    s += `<g opacity=".7"><path d="M1080 870 L870 884" stroke="#fff" stroke-width="16" stroke-linecap="round" filter="url(#fDof1)"/><path d="M1080 930 L880 938" stroke="#fff" stroke-width="12" stroke-linecap="round" filter="url(#fDof1)"/></g>`;
    s += `<g transform="translate(250,1420)"><rect x="-150" y="-52" width="300" height="84" rx="8" fill="#1f3c6e"/><text x="0" y="10" font-family="Arial,Helvetica" font-weight="700" font-size="46" fill="#fff" text-anchor="middle">← PARIS</text></g>`;
    return s + close(cam);
  };
  // 8 — entra no Terminal 1
  S[8] = () => {
    const cam = SET.C({ z: -700, y: -140, f: 1750, hz: .7 }); let s = open();
    s += SET.at(cam, 0, 0, 4500, SET.atrium(0), ' filter="url(#fDof1)"');
    s += SET.at(cam, 0, 0, 2600, SET.tube(-1900, -350, 700, -1900, 120, 2, 3) + SET.tube(2000, -900, -500, -2700, 120, 5, 8) + SET.tube(-1700, -1900, 1500, -3600, 120, 7, 11));
    s += SET.floor(cam);
    s += `<g filter="url(#fDof1)">` + SET.at(cam, 0, 0, 1400, SET.shopRow()) + SET.at(cam, -60, -300, 1395, SET.brandBox(250)) + `</g>`;
    s += passers(cam, [[-420, 500, .3, 'passageira', 1, 1, 'gSuit2', .9], [380, 300, .8, 'passageiro', -1, 1, 'gSuit3', .9]]);
    s += SET.at(cam, 120, 0, 160, PR.bench(3, 'front'));
    s += man(cam, -70, -80, 'nasseri', PO.walk(.18, { yaw: 65, armL: { t: [22, 78, -8], hand: 'fist' } }), { over: hold('L', (x, y) => PR.suitcase(x - 2, y + 62, 40, 60, 'gSuit1')) });
    return s + close(cam);
  };
  // 9 — senta no banco
  S[9] = () => {
    const cam = SET.C({ z: -400, y: -112, f: 2050, hz: .58 }); let s = open();
    s += terminal(cam, '1988', { by: -545, bz: 520 });
    s += bench(cam, 3);
    s += man(cam, 0, 0, 'nasseri', PO.sit(45, { yaw: 14, head: [-6, 18, 0] }), {});
    s += pileFront(cam, .2);
    return s + close(cam);
  };
  // planos de perfil no banco (ele olha para a direita)
  function profile(year, lv, na, other, o) {
    o = o || {};
    const cam = SET.C(Object.assign({ z: -480, y: -112, f: 2050, hz: .58, x: 72 }, o.cam || {})); let s = open();
    s += terminal(cam, year, { by: -545, bx: 72, bz: 520 });
    s += SET.at(cam, -40, 0, 0, `<g transform="translate(${-110},0)">${''}</g>`);
    s += pileBackSide(cam, lv);
    s += benchSide(cam, -6);
    s += man(cam, 0, 0, 'nasseri', na.pose, { over: na.over, sw: 36, sx: 10 });
    if (other) s += man(cam, other.x || 150, other.z || 0, other.tipo, other.pose, { over: other.over, under: other.under });
    if (o.front) s += o.front(cam);
    return s + close(cam);
  }
  function pileBackSide(cam, lv) {
    let s = '';
    const it = [[-110, 30, 70, 56, .1, { label: 'JORNAIS' }], [-112, 30, 60, 46, .4, { y: -56, papers: 1 }], [-190, 50, 66, 60, .5, {}], [-188, 50, 58, 46, .7, { y: -60, label: 'DIÁRIO' }], [-110, 30, 50, 40, .85, { y: -102 }], [-265, 20, 70, 58, .9, { label: 'LIVROS' }]];
    it.filter(a => lv >= a[4]).forEach(a => { const e = a[5]; s += SET.at(cam, a[0], e.y || 0, a[1], (e.y ? '' : PR.shadow(0, a[2] * .6, 4, .7)) + PR.box(0, 0, a[2], a[3], e)); });
    if (lv >= .2) s += SET.at(cam, -62, 0, -20, PR.shadow(0, 24, 4, .7) + PR.suitcase(0, 0, 40, 64, 'gSuit1', lv >= .99 ? { poster: PR.poster(0, -34, 28, 40, -3) } : {}));
    return s;
  }
  // 10 — toalha
  S[10] = () => profile('1991', .3, { pose: PO.sitReach({ yaw: 90 }) },
    { tipo: 'funcionario', x: 122, pose: PO.offerR('funcionario', { yaw: -90, armR: { t: [-12, 108, 50], hand: 'hold', hd: [0, 0, 1], palm: [0, 1, 0] } }), over: hold('R', (x, y) => PR.towel(x - 3, y - 6, 0)) });
  // 11 — lanche
  S[11] = () => profile('1994', .55, { pose: PO.sitEat({ yaw: 90 }), over: r => { const g = r.proj(r.J.gripR), g2 = r.proj(r.J.gripL); return `<path d="M${g[0] - 6} ${g[1] - 1} a6 5 0 0 1 12 0Z" fill="#d79a4e"/><rect x="${g[0] - 6}" y="${g[1] - 1}" width="12" height="2.2" fill="#6b3d1e"/><rect x="${g[0] - 6}" y="${g[1] + 1.2}" width="12" height="2.6" rx="1" fill="#e3b064"/>` + PR.bag(g2[0] + 2, g2[1] + 12, .8); } },
    { tipo: 'passageiro', x: 118, pose: PO.stand({ yaw: -90, head: [6, 0, 0], armR: { t: [-16, 118, 20], hand: 'open', hd: [0, 1, 0.4], palm: [0, 0, 1], pole: [-1, -1, 0] } }), under: PR.suitcase(34, 0, 36, 60, 'gSuit3') });
  // 12 — diário + reverência
  S[12] = () => profile('1997', .8, { pose: PO.sitWrite({ yaw: 90 }), over: hold('L', (x, y) => PR.diary(x + 3, y + 1, 0, 1) + `<line x1="${x - 2}" y1="${y - 4}" x2="${x - 5}" y2="${y - 12}" stroke="#223" stroke-width="1"/>`) },
    { tipo: 'funcionario', x: 128, pose: PO.bow('funcionario', { yaw: -90 }) });
  // 13 — o documento
  S[13] = () => profile('1999', .9, { pose: PO.sit(45, { yaw: 90, head: [-4, 0, 0] }) },
    { tipo: 'oficial', x: 126, pose: PO.offerR('oficial', { yaw: -90, armR: { t: [-12, 112, 52], hand: 'hold', hd: [0, 0.2, 1], palm: [1, 0, 0] }, armL: { t: [20, 78, 4], hand: 'fist' } }), over: r => { const g = r.proj(r.J.gripR), l = r.proj(r.J.gripL); return PR.sheet(g[0] - 4, g[1] - 13, 21, 29.7, -6, 9, { stamp: 1 }) + PR.briefcase(l[0], l[1] + 1); } });
  // 14 — recusa
  S[14] = () => profile('1999', .9, { pose: PO.sitCross({ yaw: 78, head: [-8, -14, 0] }) },
    { tipo: 'oficial', x: 122, pose: PO.standShrug({ yaw: -70, head: [2, 0, 8] }), over: hold('R', (x, y) => PR.sheet(x + 2, y - 10, 21, 29.7, 14, 9, { stamp: 1 })) }, { cam: { z: -400, x: 62 } });
  // 15 — inserto do papel
  S[15] = () => {
    const cam = SET.C({}); let s = open('#b9b0a2');
    s += `<rect width="${W}" height="${H}" fill="url(#gFloor)"/>`;
    s += `<g transform="translate(540,960) rotate(-3)"><rect x="-430" y="-640" width="860" height="1240" fill="#000" opacity=".25" transform="translate(14,18)" filter="url(#fSoft)"/><rect x="-430" y="-640" width="860" height="1240" fill="url(#gPaper)" stroke="#8d8573" stroke-width="2"/>`;
    s += `<text x="0" y="-540" font-family="Georgia,serif" font-weight="700" font-size="46" fill="#1f3c6e" text-anchor="middle">RÉPUBLIQUE FRANÇAISE</text><text x="0" y="-480" font-family="Georgia,serif" font-size="34" fill="#1f3c6e" text-anchor="middle">TITRE DE SÉJOUR · AUTORIZAÇÃO DE RESIDÊNCIA</text><line x1="-380" x2="380" y1="-450" y2="-450" stroke="#1f3c6e" stroke-width="3"/>`;
    s += `<text x="-380" y="-350" font-family="Arial" font-weight="700" font-size="30" fill="#666">NOME</text><text x="-380" y="-280" font-family="Courier New,monospace" font-weight="700" font-size="50" fill="#222">Mehran Karimi Nasseri</text>`;
    s += `<path d="M-390 -300 C-200 -270 100 -320 300 -290" stroke="#c62828" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M-390 -282 C-150 -310 60 -268 300 -304" stroke="#c62828" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    s += `<text x="-380" y="-110" font-family="'Brush Script MT','Segoe Script',cursive" font-style="italic" font-size="88" fill="#16327a" transform="rotate(-3 -380 -110)">Sir<tspan font-size="210" dy="30" fill="#c62828">,</tspan><tspan dy="-30"> Alfred Mehran</tspan></text>`;
    s += `<text x="-380" y="90" font-family="Arial" font-weight="700" font-size="30" fill="#666">NACIONALIDADE</text><text x="-380" y="160" font-family="Courier New,monospace" font-weight="700" font-size="50" fill="#222">iraniana</text><path d="M-390 146 C-300 130 -200 160 -120 140" stroke="#c62828" stroke-width="8" fill="none" stroke-linecap="round"/>`;
    for (let i = 0; i < 4; i++) s += `<rect x="-380" y="${260 + i * 46}" width="${i === 3 ? 420 : 760}" height="10" fill="#8e877a" opacity=".5"/>`;
    s += `<circle cx="250" cy="430" r="110" fill="none" stroke="#2a54c9" stroke-width="10" opacity=".75"/><text x="250" y="445" font-family="Arial" font-weight="700" font-size="40" fill="#2a54c9" text-anchor="middle" opacity=".75" transform="rotate(-14 250 430)">1999</text></g>`;
    // mão com caneta (silhueta)
    const cp = D2.capsule2d;
    s += `<g transform="translate(560,1010) rotate(38)"><rect x="0" y="-10" width="330" height="20" rx="10" fill="#1f3c6e"/><rect x="60" y="-10" width="16" height="20" fill="url(#gGold)"/><path d="M0 -10 L-40 0 L0 10Z" fill="url(#gGold)"/><path d="M-40 0 L-28 -3 L-28 3Z" fill="#111"/></g>`;
    s += `<defs>${D2.silFilter('hnd', '#141a2c', '#ffb46a', { blur: 3, lx: 4, ly: -4 })}</defs><g filter="url(#hnd)" fill="#000">` +
      cp([1230, 1640], [900, 1290], 105, 92) + `<ellipse cx="850" cy="1235" rx="120" ry="100" transform="rotate(35 850 1235)"/>` +
      cp([800, 1190], [690, 1120], 34, 28) + cp([760, 1150], [668, 1092], 30, 24) + cp([905, 1160], [760, 1075], 36, 28) + cp([780, 1260], [700, 1190], 36, 30) + `</g>`;
    return s + close(cam);
  };
  // 16 — Hollywood
  S[16] = () => {
    const cam = SET.C({ z: -470, y: -116, f: 2050, hz: .58, x: 48 }); let s = open();
    s += terminal(cam, '2004', { by: -545, bx: 48, bz: 520 });
    s += pileBack(cam, .9) + bench(cam, 3);
    s += man(cam, 0, 0, 'nasseri', PO.sitReach({ yaw: 30, armR: { t: [-20, 84, 44], hand: 'open', hd: [-0.4, 0.2, 1], palm: [0, 1, 0] } }), { over: pipeX(1, .6, null) });
    s += pileFront(cam, .9, { poster: 1 });
    s += man(cam, 128, -50, 'produtor', PO.offerR('produtor', { yaw: -65, lean: 8, spine: [12, 0, 0], armR: { t: [-12, 100, 58], hand: 'hold', hd: [0, 0, 1], palm: [0, 1, 0] } }), { over: hold('R', (x, y) => PR.cheque(x - 6, y - 6, 6, 1.25)) });
    return s + close(cam);
  };
  // 17 — sai na cadeira de rodas
  S[17] = () => {
    const cam = SET.C({ z: -640, y: -118, f: 2050, hz: .58, x: 150 }); let s = open();
    s += terminal(cam, '2006', { by: -600, bx: 150, bz: 520 });
    s += pileBack(cam, 1) + bench(cam, 3) + pileFront(cam, 1, { poster: 1 });
    const sit = RIG.sitPose('nasseri', 50, { yaw: 90, lean: -6, spine: [14, 0, 0], chest: [10, 0, 0], neck: [10, 0, 0], head: [8, 0, 0], armL: { t: [13, 62, 28], hand: 'relax' }, armR: { t: [-13, 62, 28], hand: 'relax' } });
    s += SET.at(cam, 236, 0, -120, PR.wheelchair(0, 0));
    s += man(cam, 242, -120, 'nasseri', sit, { noShadow: 1 });
    s += man(cam, 166, -120, 'funcionario', PO.walk(.2, { yaw: 90, half: 20, lean: 5, armL: { t: [20, 98, 34], hand: 'fist', hd: [0, 0, 1] }, armR: { t: [-20, 98, 34], hand: 'fist', hd: [0, 0, 1] } }), {});
    s += `<g transform="translate(880,1700)"><rect x="-120" y="-44" width="240" height="76" rx="8" fill="#2f6b4f"/><text x="0" y="12" font-family="Arial,Helvetica" font-weight="700" font-size="44" fill="#fff" text-anchor="middle">SORTIE →</text></g>`;
    return s + close(cam);
  };
  // 18 — volta em 2022 (fecha igual ao quadro 0)
  S[18] = () => S[1]('2022');

  G.BOARD2D = n => S[n]();
})(window);
