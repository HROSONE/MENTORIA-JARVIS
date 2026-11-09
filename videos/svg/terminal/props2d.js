/* props2d.js — objetos em SVG (unidade cm, y para baixo, chão em y=0) */
(function (G) {
  const f = n => Math.round(n * 100) / 100;
  // gerador pseudo-aleatório estável
  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  const DEFS = `
<linearGradient id="gRedSeat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5a4a"/><stop offset=".55" stop-color="#d8291f"/><stop offset="1" stop-color="#9c1710"/></linearGradient>
<linearGradient id="gRedBack" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b71d14"/><stop offset=".35" stop-color="#ef3b2c"/><stop offset=".7" stop-color="#e2321f"/><stop offset="1" stop-color="#a5180f"/></linearGradient>
<linearGradient id="gChrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f6f8"/><stop offset=".45" stop-color="#9aa3ad"/><stop offset=".55" stop-color="#d9dee3"/><stop offset="1" stop-color="#6c747d"/></linearGradient>
<linearGradient id="gChromeV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6c747d"/><stop offset=".4" stop-color="#e9edf0"/><stop offset=".6" stop-color="#a4adb6"/><stop offset="1" stop-color="#5d646c"/></linearGradient>
<linearGradient id="gBox" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9a86a"/><stop offset="1" stop-color="#b98447"/></linearGradient>
<linearGradient id="gBoxS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b5813f"/><stop offset="1" stop-color="#93652f"/></linearGradient>
<linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2b0"/><stop offset=".45" stop-color="#e3b23c"/><stop offset="1" stop-color="#8f6512"/></linearGradient>
<radialGradient id="gShadow"><stop offset="0" stop-color="#000" stop-opacity=".42"/><stop offset=".6" stop-color="#000" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<linearGradient id="gPaper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#efe8d6"/></linearGradient>
<linearGradient id="gSuit1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2f5f8a"/><stop offset=".5" stop-color="#3f79ad"/><stop offset="1" stop-color="#284f74"/></linearGradient>
<linearGradient id="gSuit2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a4636"/><stop offset=".5" stop-color="#7a5f49"/><stop offset="1" stop-color="#4a392c"/></linearGradient>
<linearGradient id="gSuit3" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2f6b4f"/><stop offset=".5" stop-color="#3e8a66"/><stop offset="1" stop-color="#285a43"/></linearGradient>
<filter id="fSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="fSmoke" x="-50%" y="-50%" width="200%" height="200%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="6"/><feGaussianBlur stdDeviation="1.4"/></filter>`;

  // sombra de contato no chão
  const shadow = (x, w, d, op) => `<ellipse cx="${f(x)}" cy="0" rx="${f(w)}" ry="${f(d || w * 0.12)}" fill="url(#gShadow)" opacity="${op == null ? 1 : op}"/>`;

  /* Banco de aeroporto: assentos de plástico vermelho moldado sobre uma viga cromada.
     view 'front' (olhando de frente) ou 'side'. Assento a 45 cm, encosto até 84 cm. */
  function bench(n, view, o) {
    o = o || {}; n = n || 3; const sw = 54, seat = 45;
    let s = '';
    if (view === 'side') {
      s += shadow(0, 40, 6);
      // pés
      s += `<path d="M-18 0 L-14 -40 L-9 -40 L-13 0Z M14 0 L10 -40 L15 -40 L19 0Z" fill="url(#gChromeV)"/>`;
      s += `<rect x="-24" y="-41" width="46" height="4.5" rx="2" fill="url(#gChrome)"/>`;
      // concha em perfil: assento + encosto
      s += `<path d="M-24 -45 C-10 -49 10 -48 22 -45.5 C25 -44.8 25 -41.5 22 -41.3 C10 -42.4 -8 -43 -21 -40.8 C-24 -48 -26 -60 -26 -72 C-26 -78 -25 -83 -23.5 -86 C-21.5 -87.5 -19 -87 -19.5 -84 C-21 -76 -21 -62 -19 -49 Z" fill="url(#gRedBack)" stroke="#7a0f09" stroke-width=".6"/>`;
      s += `<path d="M-22 -84 C-23 -74 -23 -60 -21.5 -50" stroke="#ff8a7a" stroke-width="1.1" fill="none" opacity=".7"/>`;
      return `<g>${s}</g>`;
    }
    const W = n * sw; const x0 = -W / 2;
    s += shadow(0, W * 0.6, 9);
    // pés em T
    for (const px of [x0 + 12, x0 + W - 12]) {
      s += `<rect x="${px - 2.4}" y="-40" width="4.8" height="40" fill="url(#gChromeV)"/>`;
      s += `<rect x="${px - 14}" y="-3" width="28" height="3.2" rx="1.5" fill="url(#gChrome)"/><ellipse cx="${px}" cy="0" rx="15" ry="1.4" fill="#000" opacity=".25"/>`;
    }
    s += `<rect x="${x0 - 4}" y="-43" width="${W + 8}" height="5" rx="2.5" fill="url(#gChrome)"/>`;
    for (let i = 0; i < n; i++) {
      const cx = x0 + sw * i + sw / 2;
      // encosto
      s += `<path d="M${cx - 23} -50 C${cx - 24} -66 ${cx - 23} -80 ${cx - 19} -86 C${cx - 8} -89 ${cx + 8} -89 ${cx + 19} -86 C${cx + 23} -80 ${cx + 24} -66 ${cx + 23} -50 Z" fill="url(#gRedBack)" stroke="#7a0f09" stroke-width=".7"/>`;
      s += `<path d="M${cx - 15} -82 C${cx - 5} -84.5 ${cx + 5} -84.5 ${cx + 15} -82" stroke="#ff9a8a" stroke-width="1.4" fill="none" opacity=".65"/>`;
      // furinhos de ventilação
      for (let r = 0; r < 3; r++) for (let c = -2; c <= 2; c++) s += `<ellipse cx="${cx + c * 6}" cy="${-74 + r * 6}" rx="1.3" ry="1" fill="#7a0f09" opacity=".55"/>`;
      // assento (aba frontal arredondada)
      s += `<path d="M${cx - 25} -45.5 C${cx - 25} -50 ${cx - 22} -51 ${cx - 18} -51 L${cx + 18} -51 C${cx + 22} -51 ${cx + 25} -50 ${cx + 25} -45.5 C${cx + 25} -42 ${cx + 22} -40.5 ${cx + 18} -40.5 L${cx - 18} -40.5 C${cx - 22} -40.5 ${cx - 25} -42 ${cx - 25} -45.5Z" fill="url(#gRedSeat)" stroke="#7a0f09" stroke-width=".7"/>`;
      s += `<path d="M${cx - 18} -49.3 L${cx + 18} -49.3" stroke="#ffb2a6" stroke-width="1.2" opacity=".75"/>`;
    }
    return `<g>${s}</g>`;
  }
  // só os encostos (para desenhar por cima do personagem quando a câmera está atrás) — não usado na frente
  bench.SEAT = 45;

  // caixa de papelão (frente + topo em leve perspectiva)
  function box(x, y, w, h, o) {
    o = o || {}; const t = o.top == null ? Math.min(10, w * .22) : o.top;
    let s = `<g transform="translate(${f(x)},${f(y)}) rotate(${f(o.rot || 0)})">`;
    s += `<rect x="${f(-w / 2)}" y="${f(-h)}" width="${f(w)}" height="${f(h)}" fill="url(#gBox)" stroke="#7d5526" stroke-width=".6"/>`;
    if (t > 0) s += `<path d="M${f(-w / 2)} ${f(-h)} L${f(-w / 2 + t * .6)} ${f(-h - t)} L${f(w / 2 + t * .6)} ${f(-h - t)} L${f(w / 2)} ${f(-h)}Z" fill="#e6bd84" stroke="#7d5526" stroke-width=".6"/>`;
    s += `<rect x="${f(-w / 2)}" y="${f(-h * .62)}" width="${f(w)}" height="${f(Math.min(5, h * .08))}" fill="#c9a26a" opacity=".8"/>`; // fita
    if (o.label) s += `<text x="0" y="${f(-h * .3)}" font-family="Arial Black,Arial" font-weight="900" font-size="${f(Math.min(w * .16, 8))}" fill="#5b3a14" text-anchor="middle" opacity=".75">${o.label}</text>`;
    if (o.papers) { // jornais saindo da caixa
      for (let i = 0; i < 3; i++) s += `<rect x="${f(-w * .35 + i * w * .22)}" y="${f(-h - 7 - i * 1.5)}" width="${f(w * .3)}" height="9" fill="#f1ede2" stroke="#9a9384" stroke-width=".4" transform="rotate(${-6 + i * 6} ${f(-w * .2 + i * w * .22)} ${f(-h)})"/>`;
    }
    return s + '</g>';
  }
  // pilha de jornais amarrada
  function papers(x, y, w, h, seed) {
    const r = rng(seed || 7); let s = `<g transform="translate(${f(x)},${f(y)})">`;
    const n = Math.max(3, Math.round(h / 2.2));
    for (let i = 0; i < n; i++) {
      const yy = -i * h / n, dx = (r() - .5) * 3;
      s += `<rect x="${f(-w / 2 + dx)}" y="${f(yy - h / n)}" width="${f(w)}" height="${f(h / n + .3)}" fill="${i % 3 ? '#efeadd' : '#e2dccb'}" stroke="#a69f8f" stroke-width=".3"/>`;
    }
    s += `<rect x="${f(-1)}" y="${f(-h)}" width="2" height="${f(h)}" fill="#9b6d3a"/>`;
    return s + '</g>';
  }
  // mala de rodinha (frente)
  function suitcase(x, y, w, h, grad, o) {
    o = o || {};
    let s = `<g transform="translate(${f(x)},${f(y)})">`;
    s += `<rect x="${f(-w / 2)}" y="${f(-h)}" width="${f(w)}" height="${f(h - 3)}" rx="4" fill="url(#${grad || 'gSuit1'})" stroke="#1d2b3a" stroke-width=".6"/>`;
    for (let i = 1; i < 4; i++) s += `<line x1="${f(-w / 2 + w * i / 4)}" y1="${f(-h + 3)}" x2="${f(-w / 2 + w * i / 4)}" y2="-6" stroke="#000" stroke-opacity=".18" stroke-width="1"/>`;
    s += `<rect x="${f(-w * .22)}" y="${f(-h - 4)}" width="${f(w * .44)}" height="4" rx="2" fill="#222"/>`;
    s += `<circle cx="${f(-w / 2 + 4)}" cy="-2" r="2.4" fill="#222"/><circle cx="${f(w / 2 - 4)}" cy="-2" r="2.4" fill="#222"/>`;
    if (o.poster) s += o.poster;
    return s + '</g>';
  }
  // maleta (pasta executiva) segurada pela alça; x,y = alça
  function briefcase(x, y, o) {
    o = o || {}; const w = 44, h = 32;
    let s = `<g transform="translate(${f(x)},${f(y)}) rotate(${f(o.rot || 0)})">`;
    s += `<path d="M-7 1 C-7 -6 7 -6 7 1" stroke="#2b1b10" stroke-width="2.4" fill="none"/>`;
    s += `<rect x="${-w / 2}" y="1" width="${w}" height="${h}" rx="2.5" fill="#6b4126" stroke="#2b1b10" stroke-width=".8"/>`;
    s += `<rect x="${-w / 2}" y="1" width="${w}" height="6" rx="2" fill="#7f5032"/><rect x="-9" y="5" width="4" height="4" fill="url(#gGold)"/><rect x="5" y="5" width="4" height="4" fill="url(#gGold)"/>`;
    return s + '</g>';
  }
  // carrinho de bagagem (frente-perfil simplificado)
  function trolley(x, y, o) {
    o = o || {}; let s = `<g transform="translate(${f(x)},${f(y)}) scale(${o.flip ? -1 : 1},1)">`;
    s += shadow(0, 45, 5);
    s += `<path d="M-40 -14 L38 -14 L44 -96" stroke="url(#gChromeV)" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M30 -104 L58 -100" stroke="#333" stroke-width="5" stroke-linecap="round"/>`;
    s += `<rect x="-42" y="-16" width="82" height="4" fill="url(#gChrome)"/>`;
    s += `<circle cx="-32" cy="-6" r="6" fill="#222"/><circle cx="-32" cy="-6" r="2.2" fill="#888"/><circle cx="30" cy="-6" r="6" fill="#222"/><circle cx="30" cy="-6" r="2.2" fill="#888"/>`;
    return s + '</g>';
  }

  // cachimbo dourado: boca (mx,my), direção da haste (dx: +1 para a direita), tamanho em cm
  function pipe(mx, my, dir, o) {
    o = o || {}; const d = dir || 1;
    let s = `<g transform="translate(${f(mx)},${f(my)}) scale(${d},1)">`;
    s += `<path d="M0 0 C4 0.4 8 1.6 11 4.2" stroke="#2a1a0c" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M9.2 2.4 L15.6 2.4 L15 9.6 C14.4 11.6 10.6 11.8 10 9.6Z" fill="url(#gGold)" stroke="#6b4a0e" stroke-width=".5"/>`;
    s += `<ellipse cx="12.4" cy="2.5" rx="3.2" ry=".9" fill="#3a1d08"/>`;
    if (o.ember) s += `<ellipse cx="12.4" cy="2.4" rx="2.2" ry=".6" fill="#ff7a1a" opacity="${o.ember}"/>`;
    s += '</g>';
    return s;
  }
  // fumaça: lista de bolinhas subindo (t de 0 a 1 = idade)
  function smoke(x, y, t, seed) {
    const r = rng(seed || 3); let s = `<g filter="url(#fSmoke)" fill="#f4f1ea">`;
    for (let i = 0; i < 9; i++) {
      const a = ((t + i / 9) % 1), rr = 2 + a * 9;
      s += `<circle cx="${f(x + Math.sin(a * 6 + i) * 5 * a + (r() - .5) * 3)}" cy="${f(y - a * 55)}" r="${f(rr)}" opacity="${f(0.55 * (1 - a))}"/>`;
    }
    return s + '</g>';
  }
  // folha de papel em 2D (rotação, com texto opcional)
  function sheet(x, y, w, h, rot, lines, o) {
    o = o || {}; let s = `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot || 0)})">`;
    s += `<rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" fill="url(#gPaper)" stroke="#8d8573" stroke-width=".4"/>`;
    if (lines) for (let i = 0; i < lines; i++) s += `<rect x="${f(-w * .38)}" y="${f(-h * .35 + i * h * .7 / lines)}" width="${f(w * (i % 3 === 2 ? .5 : .76))}" height="${f(h * .025)}" fill="#8e877a" opacity=".6"/>`;
    if (o.stamp) s += `<circle cx="${f(w * .22)}" cy="${f(h * .3)}" r="${f(w * .13)}" fill="none" stroke="#2a54c9" stroke-width="${f(w * .02)}" opacity=".8"/>`;
    return s + '</g>';
  }
  // saco de lanche (genérico, sem marca)
  function bag(x, y, s0) {
    const k = s0 || 1; return `<g transform="translate(${f(x)},${f(y)}) scale(${k})"><path d="M-9 0 L9 0 L10.5 -22 L-10.5 -22Z" fill="#c9905a" stroke="#7a5228" stroke-width=".5"/><path d="M-10.5 -22 L-8 -26 L8 -26 L10.5 -22" fill="#b07b47"/><circle cx="0" cy="-11" r="4.4" fill="#f2d16b"/><path d="M-3 -11 L3 -11" stroke="#a0522d" stroke-width="1.2"/></g>`;
  }
  // toalha dobrada
  function towel(x, y, rot) { return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot || 0)})"><rect x="-14" y="-5" width="28" height="10" rx="2" fill="#f7f7f2" stroke="#b9b9b0" stroke-width=".5"/><rect x="-14" y="2" width="28" height="1.6" fill="#7fb3d9"/></g>`; }
  // diário aberto
  function diary(x, y, rot, s0) { const k = s0 || 1; return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot || 0)}) scale(${k})"><path d="M-14 -1 L0 1 L14 -1 L14 -11 L0 -9 L-14 -11Z" fill="#fbf6e6" stroke="#5a3a1c" stroke-width=".7"/><path d="M0 1 L0 -9" stroke="#8a6a3a" stroke-width=".5"/><path d="M-11 -7 L-3 -6.2 M-11 -4.5 L-3 -3.8 M3 -6.2 L11 -7 M3 -3.8 L9 -4.4" stroke="#6b6b8a" stroke-width=".5"/><path d="M-15 0 L15 0 L15 1.5 L-15 1.5Z" fill="#5a2e17"/></g>`; }
  // cheque
  function cheque(x, y, rot, s0) {
    const k = s0 || 1;
    return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot || 0)}) scale(${k})"><rect x="-20" y="-9" width="40" height="18" rx="1" fill="#e7f3e4" stroke="#5f8a5a" stroke-width=".5"/><rect x="-20" y="-9" width="40" height="3.5" fill="#8fbf86"/><text x="0" y="3.4" font-family="Georgia,serif" font-weight="700" font-size="7" text-anchor="middle" fill="#1f3b1c">US$ 250.000</text><path d="M4 7 C8 5 10 8 14 6" stroke="#223" stroke-width=".5" fill="none"/></g>`;
  }
  // cartaz de filme genérico (sem marca real): silhueta num banco, título "O FILME"
  function poster(x, y, w, h, rot) {
    return `<g transform="translate(${f(x)},${f(y)}) rotate(${f(rot || 0)})"><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" fill="#1f2b4a" stroke="#f0d68a" stroke-width=".7"/><circle cx="0" cy="${f(-h * .12)}" r="${f(w * .3)}" fill="#f2b84b"/><path d="M${f(-w * .3)} ${f(h * .08)} L${f(w * .3)} ${f(h * .08)}" stroke="#d33" stroke-width="${f(h * .05)}"/><circle cx="0" cy="${f(-h * .1)}" r="${f(w * .07)}" fill="#111"/><rect x="${f(-w * .06)}" y="${f(-h * .05)}" width="${f(w * .12)}" height="${f(h * .13)}" fill="#111"/><text x="0" y="${f(h * .36)}" font-family="Anton,Impact,sans-serif" font-size="${f(w * .19)}" fill="#f0d68a" text-anchor="middle">O FILME</text></g>`;
  }
  // cadeira de rodas (perfil, olhando para a direita)
  function wheelchair(x, y) {
    return `<g transform="translate(${f(x)},${f(y)})">${shadow(0, 40, 5)}<circle cx="-6" cy="-30" r="30" fill="none" stroke="#2b2f36" stroke-width="3"/><circle cx="-6" cy="-30" r="25" fill="none" stroke="url(#gChromeV)" stroke-width="1.5"/><path d="M-6 -30 L-6 -55 M-6 -30 L19 -30 M-6 -30 L-24 -12 M-6 -30 L12 -48" stroke="#aab" stroke-width=".6"/><circle cx="28" cy="-6" r="6" fill="#2b2f36"/><path d="M-20 -48 L22 -48 L28 -12 M-20 -48 L-26 -92 L-34 -94" stroke="url(#gChromeV)" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="-20" y="-52" width="40" height="5" rx="2" fill="#222"/><path d="M-22 -50 L-27 -90" stroke="#222" stroke-width="5"/></g>`;
  }

  G.PR = { DEFS, shadow, bench, box, papers, suitcase, briefcase, trolley, pipe, smoke, sheet, bag, towel, diary, cheque, poster, wheelchair, rng };
})(typeof window !== 'undefined' ? window : globalThis);
