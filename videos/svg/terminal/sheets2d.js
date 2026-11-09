(function (G) {
  const S = {}; const { PR, SET, POSES: PO, D2 } = G;
  const head = (W, H, bg) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${PR.DEFS}${SET.DEFS}</defs><rect width="${W}" height="${H}" fill="${bg || '#ece6da'}"/>`;
  const label = (x, y, t, sz) => `<text x="${x}" y="${y}" font-family="Arial,Helvetica" font-weight="700" font-size="${sz || 22}" fill="#3b3a36" text-anchor="middle">${t}</text>`;
  // poses do personagem
  S.poses = function () {
    const W = 2000, H = 1250; let s = head(W, H);
    s += label(W / 2, 50, 'NASSERI — POSES (silhueta, 1,72 m, proporção real)', 32);
    const items = [
      ['em pé', PO.stand({ yaw: 30 })], ['andando', PO.walk(0.15, { yaw: 90 })], ['andando', PO.walk(0.65, { yaw: 90 })],
      ['maleta', PO.standCase({ yaw: 60 })], ['mãos vazias', PO.standShrug({ yaw: 20 })], ['olha o relógio', PO.standWatch({ yaw: 70 })],
      ['sentado', PO.sit(45, { yaw: 25 })], ['cachimbo', PO.sitPipe({ yaw: 70 })], ['diário', PO.sitWrite({ yaw: 60 })],
      ['lendo o papel', PO.sitRead({ yaw: 70 })], ['braços cruzados', PO.sitCross({ yaw: 20 })], ['recebe', PO.sitReach({ yaw: 70 })], ['comendo', PO.sitEat({ yaw: 65 })],
    ];
    items.forEach((it, i) => {
      const row = i < 6 ? 0 : 1, col = row ? i - 6 : i; const n = row ? 7 : 6;
      const x = (col + .5) * W / n, y = row ? 1160 : 600, sc = row ? 2.7 : 2.6;
      const isSit = row === 1;
      const r = D2.draw('nasseri', it[1], { extra: (J, pj) => {
        let e = '';
        if (it[0] === 'cachimbo') { const m = pj(J.mouth); e += PR.pipe(m[0] + 0.5, m[1] + 0.3, 1, { ember: 1 }) + PR.smoke(m[0] + 13, m[1] - 2, 0.3); }
        if (it[0] === 'diário') { const g = pj(V3(J.gripL)); e += PR.diary(g[0] + 4, g[1] + 1, 0, 1); }
        if (it[0] === 'lendo o papel') { const a = pj(J.gripL), b = pj(J.gripR); e += PR.sheet((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 10, 21, 29.7, 0, 9, { stamp: 1 }); }
        if (it[0] === 'comendo') { const g = pj(J.gripR); e += `<rect x="${g[0] - 5}" y="${g[1] - 4}" width="10" height="7" rx="3" fill="#d7a35a"/>`; const g2 = pj(J.gripL); e += PR.bag(g2[0], g2[1] + 10, .8); }
        if (it[0] === 'maleta') { const g = pj(J.gripL); e += PR.briefcase(g[0], g[1] + 1); }
        if (it[0] === 'recebe') { const g = pj(J.gripR); e += PR.cheque(g[0] + 2, g[1] - 5, -8, .8); }
        return e;
      } });
      let bench = isSit ? `<g transform="scale(1)">${PR.bench(1, 'side')}</g>` : '';
      if (isSit) bench = `<g transform="translate(-6,0)">${PR.bench(1, 'side')}</g>`;
      s += `<g transform="translate(${x},${y}) scale(${sc})">${PR.shadow(0, 26, 3)}${isSit && false ? '' : ''}${isSit ? '' : ''}${r.svg}</g>`;
      s += label(x, y + 40, it[0]);
    });
    return s + '</svg>';
  };
  const V3 = v => v;
  S.turn = function () {
    const W = 1800, H = 1000; let s = head(W, H);
    [0, 45, 90, 135, 180].forEach((y, i) => { const x = 180 + i * 340; const r = D2.draw('nasseri', PO.stand({ yaw: y }), {}); s += `<g transform="translate(${x},560) scale(2.9)">${r.svg}</g>${label(x, 600, y + '°')}`; });
    return s + '</svg>';
  };
  G.SHEET = function (name) { document.getElementById('out').innerHTML = S[name](); window.__ready = true; };
  const q = new URLSearchParams(location.search).get('s'); if (q) setTimeout(() => G.SHEET(q), 50);
})(window);
