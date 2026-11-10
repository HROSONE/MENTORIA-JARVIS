/* scenes.js — "O que acontece se você cair dentro de um vulcão" (2D, 54 s). Cada cena devolve o SVG do instante t. */
(function (G) {
  const { ST, TOON, RIG, POSES: PO } = G; const { W, H, f, clamp, seg, lin, lerp, layer, put, shadow, frame, cloud, smoke, tag, rng } = ST; const { M, V } = RIG;
  const TOTAL = 54; const INK = ST.INK;
  const loc = (yaw, w) => M.ap(M.ry(-yaw), w);                       // deslocamento na tela -> coordenada local do boneco
  const blink = (t, s) => (((t + (s || 0)) % 3.3) < .11 ? 1 : 0);
  const face = (t, o, s) => Object.assign({ blink: blink(t, s) }, o);
  const chr = (tipo, pose, x, y, o) => { o = o || {}; const r = TOON.draw(tipo, pose, o); return put(x, y, (o.noShadow ? '' : shadow(o.sw || 30)) + (o.under || '') + r.back + (o.mid0 || '') + r.mid + (o.between || '') + r.front + (o.over ? o.over(r) : ''), o.tr); };
  const breathe = (p, t, s) => { p = Object.assign({}, p); const c = p.chest || [0, 0, 0]; p.chest = [c[0] + Math.sin(t * 2 + (s || 0)) * 1.2, c[1], c[2]]; return p; };
  const sky = (id, sunX, sunY) => `<rect width="${W}" height="${H}" fill="url(#${id || 'gSkyDay'})"/>` + (sunX != null ? `<circle cx="${sunX}" cy="${sunY}" r="210" fill="url(#gSun)"/><circle cx="${sunX}" cy="${sunY}" r="62" fill="#fff6c8"/>` : '');
  const clouds = (cam, t, y0, n, seed) => { const r = rng(seed || 3); let s = ''; for (let i = 0; i < (n || 6); i++) { const x = ((r() * 2600 + t * 14 * (0.5 + r())) % 2600) - 1300 + cam.x * .15; s += cloud(x, y0 + r() * 420, .9 + r() * 1.1, .9); } return layer(cam, .15, s); };
  // caminhada em ladeira: os pés acompanham a inclinação
  const walkUp = (ph, tan, o) => { const p = PO.walk(ph, o); for (const sd of ['legL', 'legR']) { const t = p[sd].t; p[sd].t = [t[0], t[1] + t[2] * tan, t[2]]; } return p; };

  // ====================== 1) abertura: cair na lava (0 – 5,0)
  function ghost(t) { const w = Math.sin(t * 5) * 6; let s = `<g opacity=".9"><path d="M-34 -70 C-34 -128 34 -128 34 -70 L${36 + w * .3} 40 C24 26 16 52 6 38 C-2 26 -12 54 -20 38 C-28 26 -34 46 ${-38 + w * .3} 40 Z" fill="#f4fbff" stroke="#9fc4e8" stroke-width="2.2"/>`;
    s += `<ellipse cx="-12" cy="-82" rx="5.5" ry="8" fill="#22304a"/><ellipse cx="12" cy="-82" rx="5.5" ry="8" fill="#22304a"/><ellipse cx="0" cy="-60" rx="6" ry="8" fill="#22304a"/>`;
    s += `<path d="M-32 -40 C-52 -46 -58 ${-70 + w} -50 ${-84 + w}" stroke="#f4fbff" stroke-width="13" stroke-linecap="round" fill="none"/><path d="M32 -40 C50 -34 56 -16 50 -4" stroke="#f4fbff" stroke-width="13" stroke-linecap="round" fill="none"/>`;
    s += `<ellipse cx="0" cy="-142" rx="26" ry="7" fill="none" stroke="#ffd54a" stroke-width="5"/></g>`; return s; }
  function s1(t) {
    const yFall = 250 * (1 - Math.pow(clamp(t / 1.4, 0, 1), 1.6)); const sink = t < 1.4 ? 0 : -75 * seg(t, 1.4, 1.85) - 150 * seg(t, 2.3, 3.3);
    const gy = -30 + 470 * seg(t, 2.5, 5.2); const yc = t < 1.4 ? yFall * .55 + 95 : lerp(95, gy + 70, seg(t, 2.7, 3.6));
    const cam = { x: Math.sin(t * 7) * (t > 1.38 && t < 1.8 ? 6 : 0), y: yc, z: 4.5, hz: .52 }; let b = '';
    // parede do fundo com veios acesos
    let wall = `<rect x="-900" y="-1700" width="1800" height="2400" fill="#5a2a1c"/><rect x="-900" y="-1700" width="1800" height="1100" fill="#3a1f1c" opacity=".7"/>`; const r = rng(11); for (let i = 0; i < 16; i++) { const x = -420 + r() * 840, y = -40 - r() * 1100; wall += `<path d="M${f(x)} ${f(y)} l${f(20 - r() * 40)} 60 l${f(20 - r() * 40)} 70 l${f(15 - r() * 30)} 50" stroke="#ff7a2a" stroke-width="${f(2 + r() * 3)}" fill="none" opacity="${f(.25 + r() * .4 + Math.sin(t * 3 + i) * .1)}"/>`; }
    b += layer(cam, .85, wall);
    b += layer(cam, 1, `<ellipse cx="0" cy="-10" rx="760" ry="560" fill="url(#gGlow)"/><ellipse cx="0" cy="-10" rx="520" ry="300" fill="url(#gGlow)"/>`);
    // corpo / esqueleto (some dentro da lava)
    const flick = t > 1.45 && t < 2.15 ? Math.floor(t * 30) % 6 < 3 : t >= 2.15; const fl = Math.sin(t * 13);
    const pose = { yaw: 25, lean: 10, chest: [-8, 0, 0], head: [-16, 0, 0], armL: { t: [44, 150 + fl * 14, 16], hand: 'open', hd: [0.4, 1, 0], pole: [1, 0, 0] }, armR: { t: [-44, 152 - fl * 14, 16], hand: 'open', hd: [-0.4, 1, 0], pole: [-1, 0, 0] },
      legL: { t: [22, 18 + fl * 9, 10], pole: [0.4, 0, 1] }, legR: { t: [-22, 18 - fl * 9, -6], pole: [-0.4, 0, 1] }, face: { mouth: 'open', brow: 1, wide: 1, gaze: [0, -.6] } };
    const rot = t < 1.4 ? -18 + 26 * (t / 1.4) : 8 - 8 * seg(t, 1.4, 2);
    const body = (flick ? TOON.skeleton('cobaia', pose) : TOON.draw('cobaia', pose).all);
    const wave = x => Math.sin(x * .02 + t * 3) * 5 + Math.sin(x * .05 - t * 4.2) * 3;
    let surf = 'M-900 0'; for (let x = -900; x <= 900; x += 30) surf += ` L${x} ${f(-wave(x))}`;
    b += layer(cam, 1, `<clipPath id="clv"><path d="${surf} L900 -3000 L-900 -3000Z"/></clipPath><g clip-path="url(#clv)">${put(0, (t < 1.4 ? yFall : 0) + sink, `<g transform="translate(0,-90) rotate(${f(rot)}) translate(0,90)">${body}</g>`)}</g>`);
    // lava
    let lava = `<path d="${surf} L900 900 L-900 900Z" fill="url(#gLava)"/>`; for (let i = 0; i < 9; i++) { const x = -420 + i * 105 + Math.sin(t + i) * 20, a = (t * .5 + i * .37) % 1; lava += `<ellipse cx="${f(x)}" cy="${f(26 + (i % 3) * 30)}" rx="${f(26 + a * 30)}" ry="${f(6 + a * 6)}" fill="#fff3a0" opacity="${f(.5 * (1 - a))}"/>`; }
    if (t > 1.4) { const k = t - 1.4; const rr = rng(5); for (let i = 0; i < 22; i++) { const vx = (rr() - .5) * 520, vy = 380 + rr() * 520, x = vx * k, y = vy * k - 900 * k * k; if (y > -5) lava += `<circle cx="${f(x)}" cy="${f(-y)}" r="${f(5 + rr() * 9)}" fill="${rr() > .5 ? '#ffb52e' : '#fff3a0'}"/>`; }
      lava += `<ellipse cx="0" cy="0" rx="${f(60 + k * 260)}" ry="${f(8 + k * 20)}" fill="none" stroke="#fff3a0" stroke-width="${f(Math.max(0, 8 - k * 7))}"/>`; }
    b += layer(cam, 1, lava);
    if (t > 2.45) b += layer(cam, 1, put(Math.sin(t * 2.2) * 26, gy, ghost(t), { op: seg(t, 2.45, 2.9) }));
    // brasas e paredes da frente
    let em = ''; const re = rng(21); for (let i = 0; i < 26; i++) { const a = ((t * .25 + re()) % 1), x = -380 + re() * 760 + Math.sin(a * 9 + i) * 20; em += `<circle cx="${f(x)}" cy="${f(-a * 900)}" r="${f(2 + re() * 3)}" fill="#ffc24a" opacity="${f(1 - a)}"/>`; }
    b += layer(cam, 1, em);
    b += layer(cam, 1.12, `<path d="M-900 400 L-900 -2000 L-300 -2000 C-240 -1400 -330 -900 -250 -500 C-210 -260 -300 -60 -270 400Z" fill="url(#gRock)"/><path d="M900 400 L900 -2000 L300 -2000 C250 -1500 330 -1000 260 -560 C220 -300 300 -80 276 400Z" fill="url(#gRock)"/>`);
    return frame('#5a2a1c', b);
  }

  // ====================== 2) o quarto: arrumando a mochila (5,0 – 9,4)
  function packOpen(sq) { return `<g transform="scale(${f(1 + (sq || 0) * .08)},${f(1 - (sq || 0) * .1)})"><path d="M-22 0 L-24 -40 C-24 -50 24 -50 24 -40 L22 0Z" fill="#3d8a4f" stroke="${INK}" stroke-width="1.2"/><path d="M-24 -40 C-18 -58 18 -58 24 -40 C14 -46 -14 -46 -24 -40Z" fill="#2c6b3b" stroke="${INK}" stroke-width="1.2"/><rect x="-13" y="-22" width="26" height="16" rx="3" fill="#2c6b3b" stroke="${INK}" stroke-width="1"/><text x="0" y="-11" font-family="Anton,Impact,Arial Black" font-size="5.4" fill="#f4f4f0" text-anchor="middle">Hryz</text></g>`; }
  const ITEM = [() => `<g><rect x="-9" y="-3" width="14" height="6" rx="1.5" fill="#f2b632" stroke="${INK}" stroke-width=".8"/><path d="M5 -4.5 L11 -6 L11 6 L5 4.5Z" fill="#c9ced6" stroke="${INK}" stroke-width=".8"/></g>`,
    () => `<g fill="none" stroke="#c98a4a" stroke-width="3"><ellipse rx="9" ry="6"/><ellipse rx="5" ry="3"/></g>`, () => `<g><rect x="-4" y="-10" width="8" height="18" rx="3" fill="#6fc3ea" stroke="${INK}" stroke-width=".8"/><rect x="-2.6" y="-13.5" width="5.2" height="4" fill="#2f6fd0" stroke="${INK}" stroke-width=".8"/></g>`];
  function s2(t) {
    const cam = { x: 22 - 8 * seg(t, 5, 9.4), y: 104, z: 4.4 + .3 * seg(t, 5, 9.4), hz: .58 }; let b = '';
    let room = `<rect x="-800" y="-900" width="1600" height="900" fill="url(#gWallIn)"/><rect x="-800" y="0" width="1600" height="500" fill="url(#gWood)"/><rect x="-800" y="-9" width="1600" height="9" fill="#f7efdc" stroke="${INK}" stroke-width=".8"/>`;
    for (let i = -8; i <= 8; i++) room += `<line x1="${i * 90}" y1="0" x2="${i * 110}" y2="500" stroke="#6b4826" stroke-width="1.2" opacity=".5"/>`;
    room += `<g><rect x="-250" y="-245" width="130" height="140" fill="#9ed3f5" stroke="#f7efdc" stroke-width="8"/><circle cx="-160" cy="-205" r="20" fill="#fff3a0"/><path d="M-250 -150 L-212 -182 L-180 -150Z" fill="#6c8a5a"/><line x1="-185" y1="-245" x2="-185" y2="-105" stroke="#f7efdc" stroke-width="5"/><rect x="-262" y="-108" width="154" height="9" fill="#f7efdc" stroke="${INK}" stroke-width=".8"/></g>`;
    room += `<g transform="translate(74,-262) rotate(-3)"><rect x="-50" y="-34" width="100" height="68" fill="#fdfaf0" stroke="${INK}" stroke-width="1"/><circle cx="-28" cy="0" r="14" fill="#e2321f"/><path d="M-33 -8 L-18 0 L-33 8Z" fill="#fff"/><text x="12" y="-2" font-family="Anton,Impact,Arial Black" font-size="15" fill="#1b2240" text-anchor="middle">Hryz</text><text x="12" y="13" font-family="Arial" font-weight="700" font-size="6.5" fill="#1b2240" text-anchor="middle" letter-spacing="1">ANIMATION</text></g>`;
    room += `<g transform="translate(-52,-262) rotate(4)"><rect x="-32" y="-42" width="64" height="84" fill="#bfe3f7" stroke="${INK}" stroke-width="1"/><path d="M-32 42 L-4 -14 L6 -8 L14 -20 L32 42Z" fill="#7b6a62"/><path d="M-4 -14 L6 -8 L14 -20 L8 -26 L0 -22Z" fill="#f2551c"/><circle cx="6" cy="-32" r="6" fill="#ddd"/></g>`;
    // criado-mudo e cama
    room += `<g><rect x="-112" y="-62" width="62" height="62" fill="#a9763f" stroke="${INK}" stroke-width="1.2"/><rect x="-116" y="-66" width="70" height="6" fill="#8f6238" stroke="${INK}" stroke-width="1"/><rect x="-104" y="-50" width="46" height="18" fill="#8f6238" stroke="${INK}" stroke-width=".8"/><circle cx="-81" cy="-41" r="2.4" fill="#f2b632"/></g>`;
    room += `<g><rect x="52" y="-30" width="330" height="30" fill="#8f6238" stroke="${INK}" stroke-width="1.2"/><rect x="48" y="-54" width="338" height="26" rx="8" fill="#f4f1ea" stroke="${INK}" stroke-width="1.2"/><path d="M150 -54 L386 -54 L386 -30 L150 -30 C160 -40 160 -46 150 -54Z" fill="#4f86c6" stroke="${INK}" stroke-width="1.2"/><rect x="330" y="-74" width="52" height="22" rx="9" fill="#fff" stroke="${INK}" stroke-width="1.2"/><rect x="376" y="-108" width="14" height="108" fill="#8f6238" stroke="${INK}" stroke-width="1.2"/></g>`;
    b += layer(cam, 1, room);
    // itens: [pega, solta] e voo em arco até a mochila
    const TH = [[5.55, 5.85], [6.4, 6.7], [7.25, 7.55]]; const yaw = 14; const stand = [-70, 66], packP = [92, 54]; let items = '', sq = 0;
    let reach = 0, thr = 0, cur = -1; TH.forEach((a, i) => { const k = seg(t, a[0] - .3, a[0]) * (1 - seg(t, a[1], a[1] + .25)); if (k > reach) { reach = k; cur = i; } thr = Math.max(thr, seg(t, a[0], a[1]) * (1 - seg(t, a[1], a[1] + .3))); });
    const done = t > 8.0; const lift = seg(t, 8.0, 8.75);
    const armR = { t: loc(yaw, [lerp(-26, -58, reach) + thr * 46, lerp(86, 76, reach) + thr * 62, lerp(10, 22, reach)]), hand: reach > .3 ? 'hold' : 'relax', pole: loc(yaw, [-1, -0.4, -0.3]) };
    const armL = t > 7.7 && t < 8.75 ? { t: loc(yaw, [lerp(26, 62, seg(t, 7.75, 8.05)) - lift * 50, lerp(86, 100, seg(t, 7.75, 8.05)) + lift * 26, 18]), hand: 'hold', pole: loc(yaw, [1, -0.4, -0.3]) } : (t >= 8.75 ? { t: loc(yaw, [30, lerp(120, 178, seg(t, 8.8, 9.05)), 14]), hand: 'fist', hd: [0, 1, 0], pole: loc(yaw, [1, -0.3, 0]) } : {});
    const pose = breathe({ yaw: yaw + 10 * seg(t, 7.7, 8.1) - 10 * seg(t, 8.7, 9), spine: [4 + reach * 10, 0, -reach * 10 + thr * 16], head: [reach * 10 - thr * 12, -reach * 30 + seg(t, 7.7, 8.1) * 30 - seg(t, 8.7, 9) * 30, 0], armR, armL,
      face: face(t, { mouth: t > 8.7 ? 'grin' : 'smile', brow: thr > .4 ? .6 : 0, gaze: [-(reach) * .7 + thr * .8, 0] }) }, t);
    const r0 = TOON.draw(t >= 8.72 ? 'jensen' : 'jensenSem', pose);
    for (let i = 0; i < 3; i++) { const a = TH[i]; let p, rot = 0, sc = 1.25; if (t < a[0] - .05) p = [stand[0] + (i - 1) * 17, stand[1] + (i === 2 ? 9 : 3)]; else if (t < a[1]) { const g = r0.proj(r0.J.gripR); p = [g[0], -g[1]]; rot = thr * 60; } else { const k = lin(t, a[1], a[1] + .38); if (k >= 1) { if (t < a[1] + .6) sq = Math.max(sq, Math.sin(Math.PI * lin(t, a[1] + .38, a[1] + .6))); continue; } const g0 = [22, 150]; p = [lerp(g0[0], packP[0], k), lerp(g0[1], packP[1] + 44, k) + Math.sin(Math.PI * k) * 46]; rot = 60 + k * 300; }
      items += put(p[0], p[1], ITEM[i](), { rot, sc }); }
    // mochila: na cama -> nas costas
    const pk = t < 8.0 ? put(packP[0], packP[1], packOpen(sq)) : (t < 8.72 ? (() => { const g = r0.proj(r0.J.gripL); return put(g[0] + 4, -g[1] - 20, packOpen(0), { rot: -lift * 20 }); })() : '');
    b += layer(cam, 1, (t < 8.0 ? pk : '') + put(0, 0, shadow(32) + r0.back + r0.mid + r0.front) + (t >= 8.0 ? pk : '') + items);
    return frame('#e6cfa4', b);
  }

  // ====================== 3 e 4) pedalando (9,4 – 13,6 e 13,6 – 17,2)
  function house(x, w, h, col, roof, o) { o = o || {}; let s = `<g transform="translate(${x},0)"><rect x="0" y="${-h}" width="${w}" height="${h}" fill="${col}" stroke="${INK}" stroke-width="1.4"/><path d="M-14 ${-h} L${w / 2} ${-h - w * .34} L${w + 14} ${-h}Z" fill="${roof}" stroke="${INK}" stroke-width="1.4"/>`;
    s += `<rect x="${w * .12}" y="-92" width="46" height="92" fill="${o.door || '#7a4a26'}" stroke="${INK}" stroke-width="1.2"/><circle cx="${w * .12 + 38}" cy="-46" r="2.6" fill="#f2b632"/>`;
    for (const wx of [w * .55, w * .8]) if (wx + 30 < w) s += `<rect x="${wx - 26}" y="${-h + 34}" width="52" height="48" fill="#bfe3f7" stroke="#fdfaf0" stroke-width="5"/><line x1="${wx}" y1="${-h + 34}" x2="${wx}" y2="${-h + 82}" stroke="#fdfaf0" stroke-width="3"/>`;
    return s + '</g>'; }
  const tree = (x, k) => `<g transform="translate(${x},0) scale(${k || 1})"><rect x="-7" y="-90" width="14" height="90" fill="#7a4a26" stroke="${INK}" stroke-width="1.2"/><circle cx="0" cy="-130" r="52" fill="#4f9a3e" stroke="${INK}" stroke-width="1.4"/><circle cx="-30" cy="-104" r="30" fill="#4f9a3e"/><circle cx="32" cy="-108" r="32" fill="#5aa848"/><circle cx="-10" cy="-150" r="22" fill="#6ab857"/></g>`;
  function street(cam, t, kind) { let b = sky('gSkyDay', 820, 300) + clouds(cam, t, 520, 6, kind === 'air' ? 8 : 3);
    let hills = `<path d="M-3000 0 C-2400 -260 -1800 -80 -1200 -200 C-700 -300 -200 -90 400 -220 C1000 -340 1600 -100 2300 -240 C2800 -330 3400 -120 4200 -200 L4200 60 L-3000 60Z" fill="#8cc76f"/>`; b += layer(cam, .3, hills);
    let mid = '';
    if (kind === 'air') { // aeroporto ao fundo
      mid += `<g transform="translate(900,0)"><rect x="-36" y="-520" width="72" height="520" fill="#dfe5ea" stroke="${INK}" stroke-width="1.6"/><path d="M-80 -600 L80 -600 L60 -520 L-60 -520Z" fill="#8fd0f0" stroke="${INK}" stroke-width="1.6"/><rect x="-90" y="-616" width="180" height="18" fill="#c9ced6" stroke="${INK}" stroke-width="1.6"/><line x1="0" y1="-616" x2="0" y2="-690" stroke="${INK}" stroke-width="3"/><circle cx="0" cy="-694" r="6" fill="#e2321f"/></g>`;
      mid += `<g transform="translate(1500,0)"><rect x="0" y="-260" width="1100" height="260" fill="#eef1f4" stroke="${INK}" stroke-width="1.6"/><path d="M-30 -260 Q550 -360 1130 -260Z" fill="#8fa3b5" stroke="${INK}" stroke-width="1.6"/>`; for (let i = 0; i < 9; i++) mid += `<rect x="${40 + i * 118}" y="-210" width="92" height="150" fill="#8fd0f0" stroke="#fdfaf0" stroke-width="6"/>`;
      mid += `<rect x="330" y="-330" width="440" height="64" fill="#1f3c6e" stroke="${INK}" stroke-width="1.6"/><text x="550" y="-283" font-family="Anton,Impact,Arial Black" font-size="46" fill="#fff" text-anchor="middle" letter-spacing="4">AEROPORTO</text></g>`;
      mid += `<g transform="translate(260,-150) scale(.2)">${G.SET.plane2d({ gear: 1 })}</g>`;
      for (let x = -400; x < 3000; x += 70) mid += `<line x1="${x}" y1="-70" x2="${x}" y2="0" stroke="#7b838c" stroke-width="3"/>`; mid += `<path d="M-400 -70 L3000 -70 M-400 -36 L3000 -36" stroke="#7b838c" stroke-width="2.4"/>`;
    } else { const cols = [['#f6d9a8', '#b5503a'], ['#cfe6d2', '#5a6b7a'], ['#f3c5c0', '#8a4a3a'], ['#d9d4f0', '#4a4f6b'], ['#fbe6a2', '#b5503a']]; let x = -520, i = 0; const r = rng(9);
      while (x < 1560) { const w = 220 + Math.floor(r() * 3) * 40, c = cols[i % 5]; mid += house(x, w, 250 + (i % 3) * 30, c[0], c[1]); mid += tree(x + w + 46, .8 + r() * .3); x += w + 110; i++; }
      mid += house(1700, 300, 290, '#ffe08a', '#2f6fd0', { door: '#2f6fd0' }) + tree(2070, 1.1) + house(2180, 260, 250, '#cfe6d2', '#5a6b7a');
      for (let xx = -520; xx < 2600; xx += 34) mid += `<rect x="${xx}" y="-46" width="8" height="46" fill="#fdfaf0" stroke="${INK}" stroke-width=".8"/>`; mid += `<rect x="-520" y="-34" width="3120" height="6" fill="#fdfaf0" stroke="${INK}" stroke-width=".8"/>`; }
    b += layer(cam, .8, put(0, 46, mid));
    let road = `<rect x="-3000" y="-46" width="9000" height="46" fill="#cfc8b8"/><rect x="-3000" y="-10" width="9000" height="12" fill="#b3ab99"/><rect x="-3000" y="0" width="9000" height="700" fill="url(#gRoad)"/>`;
    for (let x = -3000; x < 6000; x += 180) road += `<rect x="${x}" y="150" width="90" height="12" fill="#f4f1ea" opacity=".9"/>`;
    b += layer(cam, 1, put(0, 40, road)); return b; }
  function s3(t) {
    const u = t - 9.4, v = 520; const d = u < 2.9 ? v * u : v * 2.9 + v * ((u - 2.9) - Math.pow(Math.min(u - 2.9, 1.1), 2) / 2.2) * (u - 2.9 < 1.1 ? 1 : 0) + (u - 2.9 >= 1.1 ? v * .55 : 0);
    const stop = seg(t, 12.6, 13.3); const cam = { x: d + 50 + 70 * stop, y: 120, z: 4.1 - .9 * stop, hz: .62 }; let b = street(cam, t, 'home');
    // o amigo esperando na frente da casa amarela
    const fx = 1794 + 215; const wv = Math.sin(t * 9) * 14 * (1 - seg(t, 13.2, 13.5));
    const fp = breathe(PO.stand({ yaw: -55, head: [0, -10, 0], armR: { t: loc(-55, [-30, 176 + wv * .3, 6]).map((x, i) => i === 0 ? x + wv * .4 : x), hand: 'open', hd: [0, 1, 0], pole: loc(-55, [-1, -0.4, 0]) }, face: face(t, { mouth: 'grin' }, 1) }), t, 2);
    let fr = put(fx + 100, 0, ST.bike({ col: '#2f6fd0' }).svg + ST.bike({ col: '#2f6fd0' }).near, { flip: 0 }) + chr('amigo', fp, fx, 0);
    const ca = d / 62; const extra = stop > .5 ? { legL: { t: [16, 7, 14], pole: [0.3, 0, 1] }, armR: { t: loc(90, [20, 172, 0]).map((x, i) => i === 2 ? 20 : x), hand: 'open', hd: [0, 1, 0], pole: [-1, -0.3, 0] }, head: [-8, -20, 0], neck: [-14, 0, 0] } : {};
    const jr = ST.rider('jensen', { crank: -ca, dist: d, col: '#e2321f', extra: Object.assign({ face: face(t, { mouth: stop > .3 ? 'grin' : 'smile' }) }, extra) });
    b += layer(cam, 1, fr + put(d, 0, jr)); b += tag('10 min', seg(t, 9.7, 10.0) * (1 - seg(t, 12.9, 13.2)));
    return frame('#a8d8f6', b);
  }
  function s4(t) {
    const u = t - 13.6, d = 520 * u; const cam = { x: d + 110, y: 125, z: 3.7, hz: .62 }; let b = street(cam, t, 'air');
    const ca = d / 62; b += layer(cam, 1, put(d + 215, 0, ST.rider('amigo', { crank: -ca - 1, dist: d, col: '#2f6fd0', extra: { face: face(t, { mouth: 'smile' }, 1), head: [-14, 0, 0] } })) + put(d, 0, ST.rider('jensen', { crank: -ca, dist: d, col: '#e2321f', extra: { face: face(t, { mouth: 'grin' }) } })));
    b += tag('30 min', seg(t, 13.9, 14.2) * (1 - seg(t, 16.6, 16.9))); return frame('#a8d8f6', b);
  }

  // ====================== 5) o voo até a ilha (17,2 – 22,2)
  function island(t) { let s = `<path d="M-900 0 C-700 -60 -520 -90 -380 -180 C-250 -280 -160 -470 -90 -560 L90 -560 C170 -460 260 -280 400 -170 C540 -80 720 -50 900 0Z" fill="url(#gRockW)" stroke="${INK}" stroke-width="3"/>`;
    s += `<path d="M-900 0 C-700 -60 -520 -90 -380 -180 C-300 -150 -200 -160 -120 -130 C0 -100 140 -150 260 -130 C330 -150 370 -160 400 -170 C540 -80 720 -50 900 0Z" fill="#5aa848" stroke="${INK}" stroke-width="3"/><path d="M-90 -560 C-50 -540 50 -540 90 -560 C50 -576 -50 -576 -90 -560Z" fill="#3a2c2c"/>`;
    for (const [x, k] of [[-600, .5], [-480, .6], [520, .55], [650, .5], [-200, .5], [150, .5]]) s += `<g transform="translate(${x},${-40 - Math.abs(x) * .0}) scale(${k})"><rect x="-4" y="-70" width="8" height="70" fill="#7a4a26"/><path d="M0 -70 C-40 -90 -50 -60 -56 -40 M0 -70 C40 -90 50 -60 56 -40 M0 -70 C-20 -110 -40 -100 -50 -90 M0 -70 C20 -110 40 -100 50 -90" stroke="#2f8a3a" stroke-width="9" fill="none" stroke-linecap="round"/></g>`;
    return s + smoke(0, 560, t, { n: 16, h: 900, sp: 160, r0: 40, r1: 150, wind: 260, dark: 0, v: .16 }) + `<path d="M-1000 0 C-600 -26 600 -26 1000 0 L1000 30 L-1000 30Z" fill="#f2e2b0"/>`; }
  function s5(t) {
    const u = lin(t, 17.2, 22.2), cam = { x: 0, y: 0, z: 1, hz: .5 }; let b = sky('gSkyDay', 240, 260);
    b += layer({ x: u * 260, y: 0, z: 1, hz: .5 }, 1, cloud(-300, 420, 2.2) + cloud(380, 620, 1.8) + cloud(900, 300, 2.4) + cloud(1300, 560, 1.6) + cloud(-700, 200, 1.5));
    // ilha chegando pela direita
    b += `<g transform="translate(${f(1500 - 1000 * seg(t, 17.6, 22.2))},1500) scale(${f(.62 + .12 * u)})">${island(t)}</g>`;
    let sea = `<rect x="0" y="1500" width="${W}" height="420" fill="url(#gSea)"/>`; for (let i = 0; i < 26; i++) { const r = rng(i + 3)(), x = ((r * 1400 - t * (40 + (i % 5) * 30)) % 1300 + 1300) % 1300 - 110, y = 1530 + (i % 9) * 42; sea += `<path d="M${f(x)} ${y} q22 -12 44 0 q22 12 44 0" stroke="#bfe6fb" stroke-width="4" fill="none" opacity=".7"/>`; } b += sea;
    const px = -460 + 1050 * seg(t, 17.2, 22.4), py = 760 + 250 * seg(t, 19.4, 22.2) + Math.sin(t * 2.4) * 10; b += `<g transform="translate(${f(px)},${f(py)}) rotate(${f(3 + 6 * seg(t, 19.4, 22.2))}) scale(.3)">${G.SET.plane2d({})}</g>`;
    b += `<path d="M${f(px - 570)} ${f(py - 20)} L${f(px - 1100)} ${f(py - 50)}" stroke="#fff" stroke-width="16" stroke-linecap="round" opacity=".55" filter="url(#fB6)"/>`;
    return frame('#a8d8f6', b);
  }

  // ====================== 6) a subida (22,2 – 30,4)
  const TAN = 0.5; const SY = x => x * TAN;
  function slope(cam, t, gold) { let b = sky(gold > .5 ? 'gSkyGold' : 'gSkyDay', lerp(260, 420, gold), lerp(360, 620, gold));
    if (gold <= .5) b += `<rect width="${W}" height="${H}" fill="url(#gSkyGold)" opacity="${f(gold * 2)}"/>`; else b += '';
    b += clouds(cam, t, 300, 5, 14);
    b += layer(cam, .12, `<rect x="-3000" y="60" width="9000" height="1400" fill="url(#gSea)"/>` + put(0, -60, ''));
    b += layer(cam, .45, put(1500, 900, smoke(0, 0, t, { n: 18, h: 1100, sp: 200, r0: 60, r1: 190, wind: -340, v: .12 }) + `<path d="M-1900 950 L-260 0 C-120 -40 120 -40 260 0 L1900 950Z" fill="#6b5a54"/>`));
    let g = `<path d="M-4000 ${-SY(-4000)} L6000 ${-SY(6000)} L6000 4000 L-4000 4000Z" fill="url(#gSlope)" stroke="${INK}" stroke-width="2.5"/>`; const r = rng(31);
    for (let x = -1200; x < 2400; x += 55 + r() * 80) { const y = -SY(x), k = .5 + r(); if (r() > .5) g += `<path d="M${f(x)} ${f(y + 2)} l${f(10 * k)} ${f(-14 * k - 5 * k)} l${f(16 * k)} ${f(-2 * k)} l${f(12 * k)} ${f(-0)}Z" fill="#9a8478" stroke="${INK}" stroke-width="1"/>`; else g += `<path d="M${f(x)} ${f(y)} q4 -22 -4 -30 M${f(x + 5)} ${f(y - 2.5)} q8 -20 12 -24 M${f(x - 5)} ${f(y + 2.5)} q-10 -16 -14 -18" stroke="#6f8a4a" stroke-width="2.4" fill="none"/>`; }
    for (let i = 0; i < 40; i++) { const x = -1200 + r() * 3600, dd = 40 + r() * 600; g += `<ellipse cx="${f(x)}" cy="${f(-SY(x) + dd)}" rx="${f(14 + r() * 30)}" ry="${f(5 + r() * 8)}" fill="#4a3c38" opacity=".5" transform="rotate(-26 ${f(x)} ${f(-SY(x) + dd)})"/>`; }
    return b + layer(cam, 1, g); }
  function s6(t) {
    const u = t - 22.2, slow = seg(t, 27.4, 28.2); const xj = 62 * u, xf = xj - 150 - 30 * slow; const k = seg(t, 26.9, 28.0) * (1 - seg(t, 30.0, 30.4)) * 0 + seg(t, 26.9, 28.0);
    const cam = { x: lerp(xj - 50, xf + 16, k), y: lerp(SY(xj - 50) + 100, SY(xf) + 138, k), z: lerp(4.1, 6.6, k), hz: .6 }; let b = slope(cam, t, seg(t, 23, 29));
    const ph = xj / 90; const jp = walkUp(ph, TAN, { yaw: 90, lean: 6, half: 17, spine: [4, 0, 0], head: [-10, 0, 0], face: face(t, { mouth: 'smile', gaze: [.3, .4] }) });
    const rub = Math.sin(t * 11) * 4; const fpW = walkUp((xf + 40) / 90, TAN, { yaw: 90, lean: 6, half: 17 * (1 - slow * .6), spine: [4, 0, 0], head: [-10, 0, 0], face: face(t, { mouth: 'smile' }, 1) });
    if (slow > 0) { const y = 112; fpW.armL = { t: loc(90, [26, y + rub * .5, 8 + rub]).map((v, i) => i === 0 ? 4 : v), hand: 'open', hd: [-0.6, 0.5, 1], pole: [1, -1, 0] }; fpW.armR = { t: [-4, y - rub * .5, 26 - rub], hand: 'open', hd: [0.6, 0.5, 1], pole: [-1, -1, 0] };
      fpW.head = [-6, lerp(0, -62, seg(t, 28.6, 29.2)), 0]; fpW.face = face(t, { mouth: 'grin', brow: -1, gaze: [seg(t, 28.6, 29.2) * -.2 + .5 * (1 - seg(t, 28.6, 29.2)), 0], blink: t > 29.5 && t < 29.75 ? 1 : 0 }, 1); }
    b += layer(cam, 1, chr('amigo', fpW, xf, SY(xf)) + chr('jensen', jp, xj, SY(xj)));
    b += tag('60 min', seg(t, 22.6, 22.9) * (1 - seg(t, 26.4, 26.7))); return frame('#a8d8f6', b);
  }

  // ====================== 7) a borda e o empurrão (30,4 – 37,0)
  function s7(t) {
    const push = t >= 35.1, sh = t > 35.05 && t < 35.5 ? Math.sin(t * 60) * 5 * (1 - lin(t, 35.05, 35.5)) : 0; const zin = seg(t, 33.4, 34.9);
    const cam = { x: -78 + 30 * zin + sh + 40 * seg(t, 35.2, 35.6) - 100 * seg(t, 35.8, 36.5), y: 100 + 8 * zin - 30 * seg(t, 35.4, 35.8) + 40 * seg(t, 35.9, 36.6), z: 4.0 + .5 * zin - .6 * seg(t, 35.4, 35.8) + 1.2 * seg(t, 35.9, 36.6), hz: .6 }; let b = sky('gSkyGold', 300, 560) + clouds(cam, t, 500, 5, 4);
    b += layer(cam, 1, `<path d="M20 30 L3000 30 L3000 900 L20 900Z" fill="#3a2c2c"/><path d="M560 20 C640 -70 820 -110 3000 -130 L3000 900 L560 900Z" fill="#6b5a54" stroke="${INK}" stroke-width="2"/><path d="M20 30 L560 30 L560 900 L20 900Z" fill="#2c2020"/>`);
    b += layer(cam, .9, smoke(260, -260, t, { n: 22, h: 1100, sp: 300, r0: 70, r1: 200, v: .13, wind: 80, seed: 8 }));
    let g = `<path d="M-3000 0 L-30 0 C10 2 26 20 30 60 C40 200 20 420 60 900 L-3000 900Z" fill="url(#gSlope)" stroke="${INK}" stroke-width="2.5"/>`; const r = rng(4); for (let i = 0; i < 12; i++) { const x = -900 + r() * 820; g += `<path d="M${f(x)} 0 l8 -12 l14 -3 l10 15Z" fill="#9a8478" stroke="${INK}" stroke-width="1"/>`; }
    for (let i = 0; i < 20; i++) { const x = -900 + r() * 860, d = 30 + r() * 500; g += `<ellipse cx="${f(x)}" cy="${f(d)}" rx="${f(16 + r() * 30)}" ry="${f(5 + r() * 8)}" fill="#4a3c38" opacity=".5"/>`; }
    b += layer(cam, 1, g);
    // Jensen
    const jx = lerp(-300, -52, lin(t, 30.4, 32.3)); let J;
    if (t < 32.3) J = chr('jensen', PO.walk((jx + 300) / 90, { yaw: 90, face: face(t, { mouth: 'smile' }) }), jx, 0);
    else if (!push) { const look = seg(t, 32.3, 32.9) * (1 - seg(t, 34.15, 34.45)), turn = seg(t, 34.2, 34.75), yaw = 90 - 180 * turn;
      const p = breathe(PO.stand({ yaw, lean: look * 12, spine: [look * 12, 0, 0], head: [look * 26 - turn * 4, 0, 0], armR: look > .05 ? { t: loc(yaw, [lerp(20, 30, look), lerp(84, 166, look), 16]), hand: 'open', hd: loc(yaw, [-1, 0.2, 0]), palm: [0, -1, 0], pole: loc(yaw, [0.2, -1, 0.6]) } : {}, face: face(t, { mouth: turn > .5 ? 'o' : 'flat', brow: turn > .5 ? 1 : .3, wide: turn > .6 ? .6 : 0, gaze: [0, look ? -.6 : 0] }) }), t);
      J = chr('jensen', p, jx, 0); }
    else { const k = t - 35.1, fl = Math.sin(t * 22); const rot = 150 * Math.pow(lin(k, 0, 1.15), 1.25), x = -52 + 150 * Math.min(k, 1.3) * .95, y = k < .22 ? 0 : -720 * Math.pow(k - .22, 2);
      const p = { yaw: -90, chest: [-10, 0, 0], head: [-10, 0, 0], armL: { t: [40, 158 + fl * 16, 24], hand: 'open', hd: [0, 1, 0.3], pole: [1, 0, 0] }, armR: { t: [-40, 158 - fl * 16, 24], hand: 'open', hd: [0, 1, 0.3], pole: [-1, 0, 0] }, legL: { t: [10, 10 + Math.max(0, fl) * 14 * lin(k, .2, .5), 10 + 16 * lin(k, .2, .5)] }, legR: { t: [-10, 10 + Math.max(0, -fl) * 14 * lin(k, .2, .5), -6] }, face: { mouth: 'open', brow: 1, wide: 1 } };
      J = put(x, y, `<g transform="rotate(${f(rot)})">${TOON.draw('jensen', p).all}</g>`, { op: 1 - seg(t, 36.0, 36.5) }); }
    // o amigo
    const fx = lerp(-640, -148, lin(t, 30.9, 33.5)); let F;
    if (t < 33.5) F = chr('amigo', PO.walk((fx + 640) / 90, { yaw: 90, face: face(t, { mouth: 'grin', brow: -.7 }, 1) }), fx, 0);
    else { const call = seg(t, 33.55, 33.85) * (1 - seg(t, 34.5, 34.8)), th = seg(t, 34.9, 35.12) * (1 - seg(t, 35.5, 36.0)), peek = seg(t, 35.7, 36.2), toCam = seg(t, 36.3, 36.7); const yaw = 90 - 70 * toCam;
      const p = breathe(PO.stand({ yaw, lean: th * 14 + peek * 8 * (1 - toCam), spine: [th * 10, 0, 0], head: [peek * 20 * (1 - toCam), 0, 0],
        armR: th > .02 ? { t: loc(yaw, [lerp(20, 78, th), lerp(90, 128, th), 14]), hand: 'open', hd: loc(yaw, [1, 0.5, 0]), palm: loc(yaw, [1, 0, 0]), pole: loc(yaw, [0, -1, 0.5]) } : (call > .02 ? { t: loc(yaw, [lerp(20, 44, call), lerp(90, 178 + Math.sin(t * 16) * 6, call), 12]), hand: 'open', hd: [0, 1, 0], pole: loc(yaw, [0.3, -1, 0.4]) } : (toCam > .3 ? { t: loc(yaw, [-14, 118, 24]), hand: 'fist', hd: [0, 1, 0], pole: [-1, -1, 0] } : {})),
        armL: th > .02 ? { t: loc(yaw, [lerp(20, 78, th), lerp(90, 124, th), -14]), hand: 'open', hd: loc(yaw, [1, 0.5, 0]), palm: loc(yaw, [1, 0, 0]), pole: loc(yaw, [0, -1, -0.5]) } : {},
        face: face(t, { mouth: call > .4 ? 'open' : (th > .3 || toCam > .3) ? 'grin' : 'smile', brow: th > .3 || toCam > .3 ? -1 : 0, gaze: [toCam > .5 ? 0 : .4, peek * (1 - toCam) * -.6] }, 1) }), t, 1);
      F = chr('amigo', p, fx + th * 34 * (1 - seg(t, 35.5, 36.0)), 0, { armFront: ['L', 'R'] });
      if (call > .3) F += put(fx + 40, 215, `<g stroke="${INK}" stroke-width="3.4" stroke-linecap="round"><line x1="0" y1="0" x2="16" y2="-8"/><line x1="2" y1="12" x2="20" y2="12"/><line x1="0" y1="24" x2="16" y2="32"/></g>`); }
    b += layer(cam, 1, F + J);
    if (push && t < 35.45) b += layer(cam, 1, put(-30, 140, `<g stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="${f(1 - lin(t, 35.1, 35.45))}"><line x1="0" y1="-30" x2="26" y2="-50"/><line x1="6" y1="0" x2="40" y2="0"/><line x1="0" y1="30" x2="26" y2="50"/></g>`));
    b += layer(cam, 1.05, smoke(210, -220, t + 3, { n: 14, h: 900, sp: 260, r0: 60, r1: 170, v: .15, wind: 60, seed: 3, op: .8 }));
    return frame('#f6c98a', b);
  }

  // ====================== 8 e 9) a queda, a cama elástica e a revelação (37,0 – 54)
  function tramp(dx, dy) { // lona esticada até (dx,dy) (dy<0 = afundada)
    let s = shadow(180, .22); for (const x of [-150, -75, 0, 75, 150]) s += `<rect x="${x - 4}" y="-88" width="8" height="88" fill="url(#gMetal)" stroke="${INK}" stroke-width="1"/>`;
    for (let i = 0; i < 16; i++) { const x = -158 + i * 21; s += `<path d="M${x} -90 l6 5 l-6 5 l6 5" stroke="#aab1ba" stroke-width="1.6" fill="none"/>`; }
    s += `<path d="M-160 -92 Q${f(dx - 60)} ${f(-92 - dy * .98)} ${f(dx)} ${f(-92 - dy)} Q${f(dx + 60)} ${f(-92 - dy * .98)} 160 -92 L160 -86 Q${f(dx + 60)} ${f(-86 - dy * .98)} ${f(dx)} ${f(-86 - dy)} Q${f(dx - 60)} ${f(-86 - dy * .98)} -160 -86Z" fill="#22252b" stroke="${INK}" stroke-width="1"/>`;
    s += `<rect x="-176" y="-100" width="352" height="16" rx="8" fill="#2f6fd0" stroke="${INK}" stroke-width="1.4"/><text x="0" y="-88" font-family="Anton,Impact,Arial Black" font-size="12" fill="#fff" text-anchor="middle" letter-spacing="1.5">Hryz Animation</text>`; return s; }
  // altura do Jensen sobre a lona (cm acima do chão; lona em 90)
  function bounce(t) { const B = [[39.0, 330, .75], [40.35, 210, .5], [41.25, 0, 0]]; if (t < 39.0) return { y: 90 + 1500 * (39.0 - t) * 1.0 + 300 * Math.pow(39.0 - t, 2) * 0, air: 1, def: 0 };
    for (let i = 0; i < B.length; i++) { const [t0, hgt] = B[i], tc = .16; if (t < t0 + tc * 2) { const k = (t - t0) / (tc * 2), d = Math.sin(Math.PI * k) * (i === 0 ? 62 : i === 1 ? 40 : 22); return { y: 90 - d, air: 0, def: -d }; }
      const ta = t0 + tc * 2, tb = B[i + 1] ? B[i + 1][0] : 1e9; if (t < tb) { const k = (t - ta) / (tb - ta); return { y: 90 + hgt * 4 * k * (1 - k), air: 1, def: 0, k }; } }
    return { y: 90, air: 0, def: 0 }; }
  function craterBG(cam, t, o) { o = o || {}; let b = `<rect width="${W}" height="${H}" fill="#6a5750"/>`;
    b += layer(cam, .6, `<rect x="-2000" y="-2600" width="4000" height="2700" fill="#7a665d"/><path d="M-260 -2100 L420 -2100 L900 200 L-700 200Z" fill="#fde6b8" opacity=".16"/><ellipse cx="80" cy="-2100" rx="620" ry="420" fill="#fde6b8"/><ellipse cx="80" cy="-2100" rx="900" ry="640" fill="url(#gSun)" opacity=".5"/>`);
    let w = ''; const r = rng(17); for (let i = 0; i < 40; i++) { const x = -1300 + r() * 2600, y = -60 - r() * 1500; w += `<path d="M${f(x)} ${f(y)} l${f(30 + r() * 60)} ${f(-10 + r() * 20)} l${f(20 + r() * 40)} ${f(20 + r() * 20)}" stroke="#4a3a37" stroke-width="${f(3 + r() * 4)}" fill="none" opacity=".7"/>`; }
    b += layer(cam, .8, w);
    let g = `<path d="M-2600 0 C-1400 -14 -600 6 0 0 C600 -6 1400 10 2600 0 L2600 900 L-2600 900Z" fill="url(#gSlope)" stroke="${INK}" stroke-width="2.5"/>`; for (let i = 0; i < 26; i++) { const x = -1300 + r() * 2600, d = 20 + r() * 300; g += `<ellipse cx="${f(x)}" cy="${f(d)}" rx="${f(18 + r() * 40)}" ry="${f(5 + r() * 9)}" fill="#4a3c38" opacity=".5"/>`; }
    for (let i = 0; i < 14; i++) { const x = -1300 + r() * 2600; g += `<path d="M${f(x)} 0 l10 -16 l18 -4 l12 20Z" fill="#9a8478" stroke="${INK}" stroke-width="1"/>`; }
    return b + layer(cam, 1, g); }
  function fire(t) { let s = `<g><rect x="-34" y="-12" width="68" height="11" rx="5" fill="#7a4a26" stroke="${INK}" stroke-width="1.2" transform="rotate(14)"/><rect x="-34" y="-12" width="68" height="11" rx="5" fill="#8f5a30" stroke="${INK}" stroke-width="1.2" transform="rotate(-14)"/>`;
    for (let i = 0; i < 5; i++) { const x = -22 + i * 11, h = 34 + Math.sin(t * 14 + i * 1.7) * 12 + (i === 2 ? 22 : 0); s += `<path d="M${x - 10} -8 C${x - 12} ${-h * .6} ${x - 2} ${-h * .7} ${x} ${-h} C${x + 4} ${-h * .7} ${x + 12} ${-h * .5} ${x + 10} -8Z" fill="${i % 2 ? '#ffb52e' : '#f2551c'}"/>`; }
    return s + `<path d="M-8 -8 C-9 -22 0 -26 0 -34 C3 -26 9 -20 8 -8Z" fill="#fff3a0"/></g>`; }
  function s8(t) {
    const fall = t < 39.0; const bz = bounce(t); const sit = seg(t, 41.3, 41.7);
    const cam = { x: 0, y: fall ? bz.y + 40 : lerp(bz.y + 40, 150, seg(t, 39.0, 39.5)) + (bz.y - 90) * .6 * (t > 39.5 ? 1 : 0), z: lerp(4.2, 3.5, seg(t, 38.5, 39.4)), hz: .58 }; let b = craterBG(cam, t);
    if (t < 39.2) { let st = ''; const r = rng(2); for (let i = 0; i < 26; i++) { const x = -380 + r() * 760, a = ((t * 2.2 + r()) % 1); st += `<circle cx="${f(x)}" cy="${f(-(bz.y - 500 + a * 1300))}" r="${f(40 + r() * 90)}" fill="url(#gSmk)" opacity="${f(.75 * (1 - seg(t, 38.3, 39.1)))}"/>`; } b += layer(cam, 1, st); }
    b += layer(cam, 1, put(0, 0, tramp(0, bz.def)));
    const fl = Math.sin(t * 20); let p, rot = 0;
    const first = !bz.air && t < 39.4; if (bz.air || first) { const k = t < 39 ? 0 : (bz.k || 0); rot = t < 38.6 ? -150 + Math.sin(t * 5) * 8 : t < 39.0 ? -150 + 55 * seg(t, 38.6, 39.0) : first ? -95 : (t < 40.35 ? -95 + 95 * seg(k, 0, .7) : 0);
      p = { yaw: 10, chest: [-8, 0, 0], head: [-12, 0, 0], armL: { t: [46, 150 + fl * 14, 14], hand: 'open', hd: [0.4, 1, 0], pole: [1, 0, 0] }, armR: { t: [-46, 150 - fl * 14, 14], hand: 'open', hd: [-0.4, 1, 0], pole: [-1, 0, 0] }, legL: { t: [20, 20 + fl * 8, 12], pole: [0.4, 0, 1] }, legR: { t: [-20, 20 - fl * 8, -4], pole: [-0.4, 0, 1] }, face: { mouth: 'open', brow: 1, wide: 1 } }; }
    else p = { yaw: 10, pelvisY: 88.8 - 20, chest: [8, 0, 0], legL: { t: [16, 7, 14], pole: [0.5, 0, 1] }, legR: { t: [-16, 7, 8], pole: [-0.5, 0, 1] }, armL: { t: [40, 120, 10], hand: 'open' }, armR: { t: [-40, 120, 10], hand: 'open' }, face: { mouth: 'o', brow: 1, wide: .6 } };
    let J;
    if (sit > 0 && !bz.air) { const sp = RIG.sitPose('jensen', 0, { yaw: 25, lean: -14, spine: [8, 0, 0], head: [Math.sin(t * 3) * 6, Math.sin(t * 2.2) * 26, 0], legL: { t: [14, 7, 70], pole: [0.4, 1, 0.4] }, legR: { t: [-14, 7, 66], pole: [-0.4, 1, 0.4] }, armL: { t: [30, 10, -16], hand: 'open', pole: [1, 0, -1] }, armR: { t: [-14, 132, 16], hand: 'open', hd: [0.3, 1, 0], pole: [-1, -0.5, 0] }, face: face(t, { mouth: 'o', brow: .8, gaze: [Math.sin(t * 2.2) * .6, 0] }) });
      J = put(0, 90, TOON.draw('jensen', sp).all) + put(20, 300 + Math.sin(t * 4) * 6, `<text font-family="Anton,Impact,Arial Black" font-size="76" fill="#fff" stroke="${INK}" stroke-width="5" paint-order="stroke" text-anchor="middle" transform="rotate(${f(Math.sin(t * 3) * 8)})">?</text>`, { op: sit }); }
    else J = put(0, bz.y + (first ? 12 : (bz.air && t < 40.35 && t >= 39 ? 12 * (1 - seg(bz.k || 0, 0, .7)) : 0)), `<g transform="translate(0,-95) rotate(${f(rot)}) translate(0,95)">${TOON.draw('jensen', p).all}</g>`);
    b += layer(cam, 1, J); return frame('#6a5750', b);
  }
  function s9(t) {
    // 42–45,2 fogueira; 45,2–47,6 a placa falsa; 47,6–50 Jensen entende; 50–51,8 o amigo lá em cima; 51,8–54 pulando feliz
    const k1 = seg(t, 42.0, 43.0), k2 = seg(t, 45.0, 46.0), k3 = seg(t, 47.4, 48.3);
    const cx = lerp(lerp(lerp(0, 490, k1), -520, k2), 0, k3), cz = lerp(lerp(3.5, 3.9, k1), 4.0, k3);
    const up = t >= 50.0 && t < 51.8; const jy = t > 51.8 ? 90 + 300 * Math.abs(Math.sin((t - 51.8) * 2.5)) * (1 + .5 * lin(t, 51.8, 54)) : 90;
    const cam = { x: cx, y: t > 51.8 ? 190 + (jy - 90) * .42 : 140, z: t > 51.8 ? lerp(4.0, 2.9, seg(t, 51.8, 52.4)) : cz, hz: .6 };
    if (up) { // vista de baixo: a boca da cratera com o amigo acenando
      let b = `<rect width="${W}" height="${H}" fill="#3a2c2c"/>`; const r = rng(6); let rock = ''; for (let i = 0; i < 30; i++) { const a = r() * 6.28, d = 620 + r() * 700; rock += `<path d="M${f(540 + Math.cos(a) * d)} ${f(820 + Math.sin(a) * d)} l40 -20 l30 30" stroke="#2f2424" stroke-width="8" fill="none" opacity=".6"/>`; }
      b += rock + `<ellipse cx="540" cy="820" rx="470" ry="420" fill="url(#gSkyGold)" stroke="${INK}" stroke-width="6"/><circle cx="700" cy="640" r="120" fill="url(#gSun)"/>`;
      const wv = Math.sin(t * 10) * 16; const p = PO.stand({ yaw: 0, lean: 30, spine: [26, 0, 0], head: [-30, 0, 0], armR: { t: [-40 - wv * .5, 176, 30], hand: 'open', hd: [0, 1, 0], pole: [-1, -0.4, 0] }, armL: { t: [22, 96, 30], hand: 'open' }, face: face(t, { mouth: 'grin', gaze: [0, -.6] }, 1) });
      b += `<clipPath id="chole"><ellipse cx="540" cy="820" rx="470" ry="420"/></clipPath><g clip-path="url(#chole)"><g transform="translate(540,${f(1330 + (1 - seg(t, 50.0, 50.35)) * 300)}) scale(4.6)">${TOON.draw('amigoSem', p).all}</g></g>`;
      b += `<path d="M70 820 a470 420 0 0 0 940 0" fill="none" stroke="#3a2c2c" stroke-width="60"/>`;
      return frame('#6a5750', b); }
    let b = craterBG(cam, t);
    // fogueira + dois cúmplices abanando o pano
    const fp = Math.sin(t * 7.5), hy = 150 + fp * 34; const A = TOON.draw('cumpliceA', breathe(PO.stand({ yaw: 78, armL: { t: [16, hy, 44], hand: 'fist', hd: [0, 0.3, 1], pole: [1, -1, 0] }, armR: { t: [-16, hy, 44], hand: 'fist', hd: [0, 0.3, 1], pole: [-1, -1, 0] }, head: [0, t > 46.5 ? -60 : 0, 0], face: face(t, { mouth: 'grin' }, 2) }), t)),
      Bc = TOON.draw('cumpliceB', breathe(PO.stand({ yaw: -78, armL: { t: [16, hy, 44], hand: 'fist', hd: [0, 0.3, 1], pole: [1, -1, 0] }, armR: { t: [-16, hy, 44], hand: 'fist', hd: [0, 0.3, 1], pole: [-1, -1, 0] }, face: face(t, { mouth: 'grin' }, 3) }), t, 2));
    const ax = 380, bx = 600, fy = hy + 4; const cloth = `<path d="M${ax + 48} ${-fy} Q${(ax + bx) / 2} ${f(-fy - fp * 46 + 22)} ${bx - 48} ${-fy} L${bx - 48} ${-fy + 9} Q${(ax + bx) / 2} ${f(-fy - fp * 46 + 34)} ${ax + 48} ${-fy + 9}Z" fill="#d9c7a3" stroke="${INK}" stroke-width="1.4"/>`;
    b += layer(cam, 1, put((ax + bx) / 2, 0, shadow(50, .2) + fire(t)) + smoke((ax + bx) / 2, 60, t, { n: 12, h: 110, sp: 60, r0: 16, r1: 26, v: .9, seed: 4, op: .7 }) + put(ax, 0, shadow(30) + A.all) + put(bx, 0, shadow(32) + Bc.all) + cloth + smoke((ax + bx) / 2, 200, t, { n: 18, h: 1500, sp: 150, r0: 34, r1: 130, v: .2, seed: 12 }));
    // cúmplice C com a placa falsa e a tinta
    const lf = Math.sin(t * 9) * 3; const Cc = TOON.draw('cumpliceC', breathe(PO.stand({ yaw: 35, head: [-4 + lf, 20, 0], armL: { t: loc(35, [52, 138, 10]), hand: 'relax', hd: loc(35, [1, 0.1, 0]), pole: loc(35, [0, -1, 0]) }, armR: { t: loc(35, [-30, 96, 14]), hand: 'hold', pole: loc(35, [-1, -0.5, 0]) }, face: face(t, { mouth: 'grin', brow: .4 }, 4) }), t, 4), { over: null });
    const sign = `<g transform="rotate(-4)"><rect x="-6" y="-150" width="12" height="150" fill="#8f6238" stroke="${INK}" stroke-width="1.2"/><path d="M-96 -238 L92 -246 L98 -138 L-90 -130Z" fill="#c9a26a" stroke="${INK}" stroke-width="1.6"/><text x="2" y="-196" font-family="Anton,Impact,Arial Black" font-size="34" fill="#c62828" text-anchor="middle">PERIGO</text><text x="2" y="-156" font-family="Anton,Impact,Arial Black" font-size="27" fill="#2a1c1a" text-anchor="middle">VULCÃO ATIVO</text><path d="M60 -150 l4 16 M70 -149 l2 10" stroke="#c62828" stroke-width="4" stroke-linecap="round"/></g>`;
    const can = `<g><path d="M-16 0 L-18 -30 L18 -30 L16 0Z" fill="#c9ced6" stroke="${INK}" stroke-width="1.2"/><ellipse cx="0" cy="-30" rx="18" ry="5" fill="#c62828" stroke="${INK}" stroke-width="1.2"/><path d="M14 -28 C22 -20 20 -8 24 0" stroke="#c62828" stroke-width="5" fill="none" stroke-linecap="round"/></g>`;
    b += layer(cam, 1, put(-560, 0, sign) + put(-470, 0, can) + put(-400, 0, shadow(30) + Cc.all + (() => { const g = Cc.proj(Cc.J.gripR); return `<g transform="translate(${f(g[0])},${f(g[1])}) rotate(30)"><rect x="-2" y="-4" width="4" height="34" fill="#8f6238" stroke="${INK}" stroke-width=".8"/><rect x="-5" y="28" width="10" height="12" fill="#c62828" stroke="${INK}" stroke-width=".8"/></g>`; })()));
    // Jensen na cama elástica: confuso -> entende -> ri -> pula
    const real = seg(t, 47.9, 48.5), stand = seg(t, 48.3, 49.0); let J; const def = t > 51.8 ? -Math.max(0, 40 * (1 - Math.abs(Math.sin((t - 51.8) * 2.5)) * 6)) : 0;
    if (stand < .02) { const sp = RIG.sitPose('jensen', 0, { yaw: 25, lean: -14, spine: [8, 0, 0], head: [0, lerp(-50, 60, seg(t, 44.6, 45.6)), 0], legL: { t: [14, 7, 70], pole: [0.4, 1, 0.4] }, legR: { t: [-14, 7, 66], pole: [-0.4, 1, 0.4] }, armL: { t: [30, 10, -16], hand: 'open', pole: [1, 0, -1] }, armR: { t: [-30, 8, -10], hand: 'open', pole: [-1, 0, -1] }, face: face(t, { mouth: real > .5 ? 'open' : 'o', brow: .8, wide: real * .6 }) }); J = put(0, 90, TOON.draw('jensen', sp).all); }
    else { const air = t > 51.8, hup = air ? 1 : seg(t, 49.2, 49.6) * (1 - seg(t, 50.0, 50.2)); const lg = Math.sin(t * 12) * 2.5 * (t < 51.8 ? 1 : 0);
      const p = breathe(PO.stand({ yaw: 15, pelvisY: lerp(60, 88.8, stand) + lg * .4, chest: [-4 * hup + lg, 0, 0], head: [-10 * hup, 0, 0], armL: { t: [lerp(22, 44, hup), lerp(86, 176, hup), 8], hand: hup > .5 ? 'open' : 'relax', hd: hup > .5 ? [0.3, 1, 0] : null, pole: [1, -0.3, 0] }, armR: hup > .5 ? { t: [-44, 176, 8], hand: 'open', hd: [-0.3, 1, 0], pole: [-1, -0.3, 0] } : { t: [-8, lerp(86, 150, seg(t, 48.5, 49.0)), 20], hand: 'open', hd: [0.2, 1, 0], palm: [0, 0, -1], pole: [-1, -0.6, 0] },
        legL: air ? { t: [16, 26, 12], pole: [0.5, 0, 1] } : null, legR: air ? { t: [-16, 14, -4], pole: [-0.5, 0, 1] } : null, face: face(t, { mouth: 'grin', brow: .3, blink: t < 49.1 ? 1 : 0 }) }), t);
      if (!p.armL.hd) delete p.armL.hd; if (!p.legL) { delete p.legL; delete p.legR; } J = put(0, jy, TOON.draw('jensen', p).all); }
    b += layer(cam, 1, put(0, 0, tramp(0, def)) + J);
    return frame('#6a5750', b);
  }

  const CUTS = [[0, s1], [5.0, s2], [9.4, s3], [13.6, s4], [17.2, s5], [22.2, s6], [30.4, s7], [37.0, s8], [42.0, s9]];
  G.SCENE = t => { t = clamp(t, 0, TOTAL - 1e-3); let fn = s1; for (const c of CUTS) if (t >= c[0]) fn = c[1]; return fn(t); };
  G.TOTAL = TOTAL;
})(window);
