/* set2d.js — cenários em 2D com câmera de perspectiva (unidade cm).
   cam = { x, y (altura do olho, negativa = acima do chão), z, f (px por cm a 1 cm), hz (fração da tela onde fica o horizonte), W, H } */
(function (G) {
  const f = n => Math.round(n * 100) / 100;
  const { PR } = G;
  const W0 = 1080, H0 = 1920;

  function C(c) { return Object.assign({ x: 0, y: -150, z: -700, f: 1500, hz: 0.42, W: W0, H: H0 }, c); }
  function P(cam, X, Y, Z) { const d = Z - cam.z; const s = cam.f / d; return [cam.W / 2 + (X - cam.x) * s, cam.H * cam.hz + (Y - cam.y) * s, s]; }
  // coloca um desenho (coordenadas locais em cm) no ponto X,Y,Z do mundo
  function at(cam, X, Y, Z, svg, extra) { const p = P(cam, X, Y, Z); if (Z - cam.z <= 1) return ''; return `<g transform="translate(${f(p[0])},${f(p[1])}) scale(${f(p[2])})"${extra || ''}>${svg}</g>`; }

  // ---------------- Terminal 1 (Charles de Gaulle) ----------------
  // piso polido com juntas em perspectiva
  function floor(cam, o) {
    o = o || {}; const col = o.col || '#cfc6b8';
    const hy = cam.H * cam.hz + (0 - cam.y) * cam.f / 60000;
    let s = `<rect x="0" y="${f(hy)}" width="${cam.W}" height="${f(cam.H - hy)}" fill="url(#gFloor)"/>`;
    // juntas: linhas de profundidade constante
    for (let z = Math.ceil((cam.z + 60) / 120) * 120; z < 6000; z += 120) {
      const y = P(cam, 0, 0, z)[1]; if (y > cam.H || y < hy) continue;
      s += `<line x1="0" x2="${cam.W}" y1="${f(y)}" y2="${f(y)}" stroke="#8f8676" stroke-opacity="${f(Math.min(.45, 120 / (z - cam.z)))}" stroke-width="1.2"/>`;
    }
    for (let x = -3000; x <= 3000; x += 120) {
      const a = P(cam, x, 0, Math.max(cam.z + 30, -2000)), b = P(cam, x, 0, 6000);
      s += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="#8f8676" stroke-opacity=".28" stroke-width="1.1"/>`;
    }
    // reflexo das luzes
    s += `<ellipse cx="${cam.W / 2}" cy="${f(hy + (cam.H - hy) * .25)}" rx="${cam.W * .7}" ry="${f((cam.H - hy) * .18)}" fill="#fff" opacity=".18" filter="url(#fBig)"/>`;
    return s;
  }

  // painel de partidas (split-flap) — big = texto grande (ex.: "18 ANOS" ou "1999")
  function board(big, o) {
    o = o || {}; const w = 360, h = 190;
    let s = `<rect x="${-w / 2 - 8}" y="-8" width="${w + 16}" height="${h + 16}" rx="5" fill="#2a2d33"/><rect x="${-w / 2}" y="0" width="${w}" height="${h}" fill="#0d0f13"/>`;
    s += `<line x1="-120" y1="-8" x2="-120" y2="-400" stroke="#555" stroke-width="2"/><line x1="120" y1="-8" x2="120" y2="-400" stroke="#555" stroke-width="2"/>`;
    s += `<text x="${-w / 2 + 12}" y="22" font-family="Arial,Helvetica" font-weight="700" font-size="15" fill="#f6c844">DÉPARTS · DEPARTURES</text><text x="${w / 2 - 12}" y="22" font-family="Arial" font-weight="700" font-size="15" fill="#f6c844" text-anchor="end">TERMINAL 1</text>`;
    // fileira grande de plaquinhas
    const txt = String(big); const n = Math.max(txt.length, 4); const cw = Math.min(46, (w - 30) / n), ch = 70;
    const x0 = -n * cw / 2;
    for (let i = 0; i < n; i++) {
      const cx = x0 + i * cw;
      s += `<rect x="${f(cx + 1.5)}" y="36" width="${f(cw - 3)}" height="${ch}" rx="3" fill="#1b1e24"/><line x1="${f(cx + 1.5)}" x2="${f(cx + cw - 1.5)}" y1="${36 + ch / 2}" y2="${36 + ch / 2}" stroke="#000" stroke-width="1.6"/>`;
      const c = txt[i] || ' ';
      s += `<text x="${f(cx + cw / 2)}" y="${36 + ch * .78}" font-family="Anton,Impact,Arial Black" font-size="${f(ch * .82)}" fill="#ffd54a" text-anchor="middle">${c}</text>`;
    }
    const rows = o.rows || [['10:05', 'LONDRES', 'ANNULÉ'], ['10:40', 'BRUXELLES', 'À L\'HEURE'], ['11:15', 'NEW YORK', 'EMBARQ.']];
    rows.forEach((r, i) => {
      const y = 128 + i * 20;
      s += `<text x="${-w / 2 + 14}" y="${y}" font-family="Courier New,monospace" font-weight="700" font-size="15" fill="#e9eef5">${r[0]}</text><text x="${-w / 2 + 84}" y="${y}" font-family="Courier New,monospace" font-weight="700" font-size="15" fill="#e9eef5">${r[1]}</text><text x="${w / 2 - 14}" y="${y}" font-family="Courier New,monospace" font-weight="700" font-size="15" fill="${r[2] === 'ANNULÉ' ? '#ff6b5a' : '#f6c844'}" text-anchor="end">${r[2]}</text>`;
    });
    return s;
  }

  // caixa de luz com a marca do canal
  function brandBox(w) {
    w = w || 220; const h = w * 0.42;
    return `<rect x="${-w / 2 - 5}" y="${-h - 5}" width="${w + 10}" height="${h + 10}" rx="4" fill="#3b3f46"/><rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" fill="url(#gLight)"/>` +
      `<circle cx="${-w * .33}" cy="${-h / 2}" r="${h * .3}" fill="#e2321f"/><path d="M${-w * .33 - h * .1} ${-h / 2 - h * .14} L${-w * .33 + h * .16} ${-h / 2} L${-w * .33 - h * .1} ${-h / 2 + h * .14}Z" fill="#fff"/>` +
      `<text x="${w * .1}" y="${-h * .47}" font-family="Anton,Impact,Arial Black" font-size="${h * .34}" fill="#1b2240" text-anchor="middle">Hryz</text><text x="${w * .1}" y="${-h * .17}" font-family="Arial,Helvetica" font-weight="700" letter-spacing="2" font-size="${h * .15}" fill="#1b2240" text-anchor="middle">ANIMATION</text>`;
  }

  // fachada de loja/café no nível de baixo (desenhada a 1 cm = 1 cm)
  function shopRow(o) {
    o = o || {}; let s = '';
    // parede de concreto
    s += `<rect x="-1500" y="-420" width="3000" height="420" fill="url(#gConcrete)"/>`;
    // juntas de concreto
    for (let x = -1500; x <= 1500; x += 150) s += `<line x1="${x}" y1="-420" x2="${x}" y2="0" stroke="#000" stroke-opacity=".08" stroke-width="2"/>`;
    s += `<rect x="-1500" y="-430" width="3000" height="22" fill="#9a9184"/>`;
    // loja de jornais
    s += `<rect x="-640" y="-270" width="420" height="270" fill="#20262e"/><rect x="-630" y="-250" width="400" height="240" fill="url(#gShop)"/>`;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) { const hue = ['#e85d4a', '#3f7cc0', '#f2c94c', '#56a06b', '#f0efe9'][(r * 3 + c) % 5]; s += `<rect x="${-620 + c * 43}" y="${-236 + r * 52}" width="34" height="44" fill="${hue}" opacity=".85"/><rect x="${-617 + c * 43}" y="${-232 + r * 52}" width="28" height="6" fill="#fff" opacity=".7"/>`; }
    s += `<rect x="-640" y="-320" width="420" height="44" fill="#1f3c6e"/><text x="-430" y="-288" font-family="Arial,Helvetica" font-weight="700" font-size="30" fill="#fff" text-anchor="middle" letter-spacing="4">PRESSE · TABAC</text>`;
    // café
    s += `<rect x="220" y="-270" width="440" height="270" fill="#2a2018"/><rect x="230" y="-250" width="420" height="240" fill="url(#gCafe)"/>`;
    s += `<rect x="250" y="-120" width="380" height="110" fill="#5a3a24"/><rect x="240" y="-126" width="400" height="10" fill="#c9a77c"/>`;
    for (let i = 0; i < 5; i++) s += `<circle cx="${290 + i * 76}" cy="-200" r="16" fill="#ffd28a" opacity=".9"/><line x1="${290 + i * 76}" y1="-250" x2="${290 + i * 76}" y2="-216" stroke="#222" stroke-width="2"/>`;
    s += `<rect x="220" y="-320" width="440" height="44" fill="#7b2d1d"/><text x="440" y="-288" font-family="Georgia,serif" font-style="italic" font-weight="700" font-size="32" fill="#f7e2c4" text-anchor="middle">Paris Bye Bye · bar</text>`;
    // porta dos funcionários
    s += `<rect x="-120" y="-230" width="120" height="230" fill="#7f8790" stroke="#4e555c" stroke-width="3"/><rect x="-104" y="-214" width="88" height="70" fill="#a9b3bc"/><circle cx="-18" cy="-110" r="5" fill="#ddd"/><rect x="-108" y="-280" width="96" height="34" fill="#f6c844"/><text x="-60" y="-256" font-family="Arial" font-weight="700" font-size="20" fill="#222" text-anchor="middle">PRIVÉ</text>`;
    return s;
  }

  // átrio circular com tubos de escada rolante (assinatura do Terminal 1)
  function atrium(t) {
    t = t || 0; let s = '';
    s += `<rect x="-6000" y="-5200" width="12000" height="5200" fill="url(#gAtrium)"/>`;
    // claraboia
    s += `<ellipse cx="0" cy="-5150" rx="2600" ry="300" fill="#fbf7ee"/><ellipse cx="0" cy="-5150" rx="2300" ry="230" fill="#ffffff"/>`;
    for (let i = -8; i <= 8; i++) s += `<line x1="${i * 280}" y1="-5420" x2="${i * 240}" y2="-4880" stroke="#cfc6b6" stroke-width="18"/>`;
    // pisos (anéis de concreto) com aberturas
    for (let lv = 0; lv < 5; lv++) {
      const y = -700 - lv * 900;
      s += `<rect x="-6000" y="${y - 120}" width="12000" height="150" fill="#bdb3a3"/><rect x="-6000" y="${y + 20}" width="12000" height="30" fill="#8d8476"/>`;
      for (let c = -6; c <= 6; c++) s += `<rect x="${c * 820 - 260}" y="${y - 520}" width="520" height="380" rx="40" fill="#4d4740" opacity=".55"/><rect x="${c * 820 - 230}" y="${y - 490}" width="460" height="320" rx="30" fill="url(#gWarmWin)"/>`;
    }
    // luz entrando
    s += `<path d="M-1600 -5100 L1600 -5100 L2600 0 L-2600 0Z" fill="#fff8e8" opacity=".18" filter="url(#fHuge)"/>`;
    return s;
  }
  // um tubo de escada rolante: de (x1,y1) até (x2,y2), raio r, com gente dentro
  function tube(x1, y1, x2, y2, r, t, seed) {
    const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI, L = Math.hypot(x2 - x1, y2 - y1);
    let s = `<g transform="translate(${x1},${y1}) rotate(${f(ang)})">`;
    s += `<rect x="0" y="${-r}" width="${f(L)}" height="${2 * r}" fill="#dfe9ee" opacity=".55"/>`;
    s += `<rect x="0" y="${r * .55}" width="${f(L)}" height="${r * .45}" fill="#6f7780"/>`; // degraus
    // gente subindo
    const rr = PR.rng(seed || 5);
    for (let i = 0; i < 9; i++) { const u = ((i / 9 + t * 0.04) % 1) * L; const hh = r * (1.05 + rr() * .2); s += `<g transform="translate(${f(u)},${f(r * .55)}) rotate(${f(-ang)})"><rect x="${-r * .14}" y="${f(-hh)}" width="${r * .28}" height="${f(hh)}" rx="${r * .12}" fill="#3e4a63"/><circle cx="0" cy="${f(-hh - r * .12)}" r="${r * .13}" fill="#3e4a63"/></g>`; }
    // vidro e costelas
    s += `<rect x="0" y="${-r}" width="${f(L)}" height="${2 * r}" fill="url(#gTube)"/>`;
    for (let u = 0; u < L; u += r * .9) s += `<rect x="${f(u)}" y="${-r}" width="${r * .1}" height="${2 * r}" fill="#9aa3ab" opacity=".85"/>`;
    s += `<rect x="0" y="${-r - 6}" width="${f(L)}" height="12" fill="#c8cfd5"/><rect x="0" y="${r - 6}" width="${f(L)}" height="12" fill="#8c949b"/>`;
    return s + '</g>';
  }

  // passageiro andando (silhueta azul-acinzentada, desfocada pelo movimento)
  function passer(cam, X, Z, phase, tipo, dir, blur, o) {
    o = o || {};
    const pose = G.POSES.walk(phase, { yaw: dir > 0 ? 90 : -90 });
    const r = G.D2.draw(tipo, pose, { cor: o.cor, rim: o.rim });
    let s = r.svg;
    if (o.case) s = `<g>${PR.suitcase(-dir * 30, 0, 36, 62, o.case)}</g>` + s;
    const bl = blur ? ` filter="url(#fMB${blur})"` : '';
    return at(cam, X, 0, Z, `<g${bl} opacity="${o.op || 1}">${PR.shadow(0, 30, 4, .6)}${s}</g>`);
  }

  // defs de cenário
  const DEFS = `
<linearGradient id="gFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9b0a2"/><stop offset=".35" stop-color="#d6cfc2"/><stop offset="1" stop-color="#e9e3d8"/></linearGradient>
<linearGradient id="gConcrete" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdc3b2"/><stop offset="1" stop-color="#b6ab98"/></linearGradient>
<linearGradient id="gAtrium" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe7d8"/><stop offset=".6" stop-color="#d7cdbb"/><stop offset="1" stop-color="#c7bca9"/></linearGradient>
<linearGradient id="gWarmWin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1cf"/><stop offset="1" stop-color="#e8c98e"/></linearGradient>
<linearGradient id="gTube" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".75"/><stop offset=".3" stop-color="#ffffff" stop-opacity=".15"/><stop offset=".7" stop-color="#bcd3df" stop-opacity=".1"/><stop offset="1" stop-color="#7f97a6" stop-opacity=".45"/></linearGradient>
<linearGradient id="gShop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf6e8"/><stop offset="1" stop-color="#e4d8c0"/></linearGradient>
<linearGradient id="gCafe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffdca8"/><stop offset="1" stop-color="#c98b4e"/></linearGradient>
<linearGradient id="gLight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eef3ff"/></linearGradient>
<linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aa6e6"/><stop offset=".6" stop-color="#a9d4f2"/><stop offset="1" stop-color="#e6f3fb"/></linearGradient>
<linearGradient id="gSepia" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9d5b0"/><stop offset="1" stop-color="#c9a878"/></linearGradient>
<radialGradient id="gVig" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></radialGradient>
<filter id="fBig" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
<filter id="fHuge" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="120"/></filter>
<filter id="fDof1" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter>
<filter id="fDof2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="fMB1" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="9 0.5"/></filter>
<filter id="fMB2" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="22 1"/></filter>
<filter id="fGrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="9" result="n"/><feColorMatrix in="n" type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .07"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/></filter>`;

  /* Fundo do Terminal 1 visto de frente (atrás do banco). o.year = texto do painel. */
  function terminalBG(cam, o) {
    o = o || {}; const t = o.t || 0; let s = '';
    // átrio bem longe (Z=4500), desfocado
    s += `<g filter="url(#fDof2)">` + at(cam, 0, 0, 4500, atrium(t)) +
      at(cam, 0, 0, 3600, tube(-2600, -400, 600, -2300, 120, t, 3) + tube(2600, -1300, -400, -3300, 120, t + 3, 8) + tube(-2200, -2300, 1800, -4300, 120, t + 6, 11)) + `</g>`;
    // fileira de lojas (Z=1400)
    s += `<g filter="url(#fDof1)">` + at(cam, 0, 0, 1400, shopRow(o)) + at(cam, -60, -330, 1395, brandBox(240)) + `</g>`;
    return s;
  }
  function boardAt(cam, X, Y, Z, txt, o) { return at(cam, X, Y, Z, board(txt, o)); }

  // ---------------- 1988: estação de trem (sépia) ----------------
  function stationBG(cam, o) {
    o = o || {}; let s = '';
    s += `<rect x="0" y="0" width="${cam.W}" height="${cam.H}" fill="url(#gSepia)"/>`;
    // teto de ferro e vidro em arco
    let roof = '';
    for (let i = -6; i <= 6; i++) roof += `<path d="M${i * 500 - 250} -900 Q${i * 500} -1500 ${i * 500 + 250} -900" stroke="#6b5435" stroke-width="16" fill="none"/>`;
    roof += `<rect x="-3500" y="-920" width="7000" height="30" fill="#6b5435"/>`;
    for (let i = -14; i <= 14; i++) roof += `<line x1="${i * 250}" y1="-900" x2="${i * 250}" y2="0" stroke="#6b5435" stroke-width="14"/>`;
    s += `<g filter="url(#fDof1)">` + at(cam, 0, 0, 2600, roof) + `</g>`;
    // trem (Z=1100)
    let tr = `<rect x="-1800" y="-380" width="3600" height="340" rx="40" fill="#5f6f5c"/><rect x="-1800" y="-140" width="3600" height="40" fill="#3e4a3b"/>`;
    for (let i = -8; i <= 8; i++) tr += `<rect x="${i * 210 - 70}" y="-320" width="140" height="110" rx="10" fill="#f2deb0" opacity=".85"/>`;
    for (let i = -9; i <= 9; i++) tr += `<circle cx="${i * 200}" cy="-40" r="38" fill="#2e2a24"/>`;
    s += at(cam, 0, 0, 1100, tr);
    // plataforma
    s += `<rect x="0" y="${f(P(cam, 0, 0, 1000)[1])}" width="${cam.W}" height="${cam.H}" fill="#cdb48c"/>`;
    // relógio pendurado
    const ck = `<line x1="0" y1="-600" x2="0" y2="-60" stroke="#3a2c1c" stroke-width="5"/><circle cx="0" cy="0" r="60" fill="#f7efdc" stroke="#3a2c1c" stroke-width="9"/>` +
      Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="-48" x2="0" y2="-40" stroke="#3a2c1c" stroke-width="4" transform="rotate(${i * 30})"/>`).join('') +
      `<line x1="0" y1="0" x2="0" y2="-38" stroke="#111" stroke-width="5" transform="rotate(${o.min || 60})"/><line x1="0" y1="0" x2="0" y2="-26" stroke="#111" stroke-width="7" transform="rotate(${o.hr || 290})"/><text x="0" y="28" font-family="Georgia" font-size="13" text-anchor="middle" fill="#3a2c1c">PARIS</text>`;
    s += at(cam, o.clockX || 160, -300, 300, ck);
    return s;
  }
  // ---------------- Londres: balcão da imigração ----------------
  function londonDesk(cam, o) {
    o = o || {}; let s = '';
    let w = `<rect x="-1500" y="-500" width="3000" height="500" fill="#d9dde3"/><rect x="-1500" y="-520" width="3000" height="40" fill="#1f3c6e"/>`;
    w += `<text x="0" y="-488" font-family="Arial,Helvetica" font-weight="700" font-size="30" fill="#fff" text-anchor="middle" letter-spacing="6">LONDON · IMMIGRATION</text>`;
    for (let i = -6; i <= 6; i++) w += `<rect x="${i * 240 - 4}" y="-480" width="8" height="480" fill="#c3c8cf"/>`;
    s += `<g filter="url(#fDof1)">${at(cam, 0, 0, 900, w)}</g>`;
    return s;
  }
  // balcão em si (na frente do agente)
  function deskFront() {
    return `<rect x="-90" y="-104" width="180" height="104" fill="#e9ecef" stroke="#8a929b" stroke-width="1.2"/><rect x="-96" y="-110" width="192" height="10" fill="#9aa3ac"/><rect x="-90" y="-60" width="180" height="6" fill="#1f3c6e"/><text x="0" y="-78" font-family="Arial" font-weight="700" font-size="16" fill="#1f3c6e" text-anchor="middle">PASSPORTS</text>`;
  }
  // ---------------- céu e avião ----------------
  function skyBG(cam) {
    let s = `<rect x="0" y="0" width="${cam.W}" height="${cam.H}" fill="url(#gSky)"/>`;
    const r = PR.rng(4);
    for (let i = 0; i < 9; i++) { const x = r() * cam.W, y = cam.H * (.15 + r() * .75), k = 60 + r() * 120; s += `<g opacity=".9" filter="url(#fDof1)"><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(k * 1.6)}" ry="${f(k * .45)}" fill="#fff"/><ellipse cx="${f(x - k * .5)}" cy="${f(y - k * .2)}" rx="${f(k * .7)}" ry="${f(k * .45)}" fill="#fff"/><ellipse cx="${f(x + k * .5)}" cy="${f(y - k * .25)}" rx="${f(k * .8)}" ry="${f(k * .5)}" fill="#fff"/></g>`; }
    return s;
  }
  // avião de perfil (olhando para a direita), comprimento ~ 3800 cm
  function plane2d(o) {
    o = o || {};
    let s = `<g transform="scale(${o.flip ? -1 : 1},1)">`;
    s += `<path d="M-1700 -60 L-1500 -520 L-1320 -520 L-1240 -120Z" fill="#e2321f"/>`; // deriva
    s += `<path d="M-1640 -40 L-1820 -200 L-1720 -210 L-1500 -60Z" fill="#c9ced6"/>`;
    s += `<path d="M-1800 -80 C-1700 -150 -1300 -170 -900 -170 L1450 -170 C1700 -170 1880 -110 1920 -20 C1880 60 1700 90 1450 90 L-900 90 C-1300 90 -1650 40 -1800 -80Z" fill="#f7f8fa" stroke="#9aa3ad" stroke-width="6"/>`;
    s += `<path d="M-1600 40 C-1200 80 -600 90 1500 90 C1720 90 1880 50 1910 10 L1910 30 C1860 80 1700 100 1450 100 L-900 100 C-1300 100 -1600 70 -1600 40Z" fill="#cfd5dc"/>`;
    for (let i = 0; i < 26; i++) if (i < 3 || i > 20) s += `<rect x="${-1150 + i * 100}" y="-110" width="38" height="44" rx="14" fill="#2a3b52"/>`;
    s += `<path d="M1660 -120 C1740 -122 1810 -96 1846 -60 L1700 -60Z" fill="#2a3b52"/>`;
    s += `<rect x="-1000" y="-20" width="2400" height="22" fill="#e2321f"/>`;
    s += `<text x="${o.flip ? -30 : 30}" y="-48" transform="${o.flip ? 'scale(-1,1)' : ''}" font-family="Anton,Impact,Arial Black" font-size="150" letter-spacing="8" fill="#1b2240" text-anchor="middle">Hryz Animation</text>`;
    s += `<path d="M-200 40 L-900 420 L-600 420 L300 60Z" fill="#b7bec7"/>`; // asa
    s += `<ellipse cx="-420" cy="200" rx="230" ry="80" fill="#9aa3ad"/><ellipse cx="-200" cy="200" rx="40" ry="70" fill="#2a2f36"/>`;
    if (o.gear) s += `<rect x="-100" y="100" width="20" height="180" fill="#666"/><circle cx="-90" cy="290" r="45" fill="#222"/><rect x="1200" y="100" width="16" height="140" fill="#666"/><circle cx="1208" cy="250" r="35" fill="#222"/>`;
    return s + '</g>';
  }

  // acabamento da imagem: vinheta + grão
  function finish(cam) { return `<rect width="${cam.W}" height="${cam.H}" fill="url(#gVig)"/><rect width="${cam.W}" height="${cam.H}" fill="#fff" filter="url(#fGrain)" opacity=".9"/>`; }

  G.SET = { C, P, at, floor, board, boardAt, brandBox, shopRow, atrium, tube, passer, DEFS, terminalBG, stationBG, londonDesk, deskFront, skyBG, plane2d, finish };
})(typeof window !== 'undefined' ? window : globalThis);
