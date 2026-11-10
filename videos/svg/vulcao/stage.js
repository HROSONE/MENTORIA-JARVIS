/* stage.js — palco 2D: câmera lateral com paralaxe, utilidades, bicicleta e objetos. Unidade: cm (y para cima). */
(function (G) {
  const W = 1080, H = 1920; const f = n => Math.round(n * 100) / 100;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x)); const ease = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const seg = (t, a, b) => ease((t - a) / (b - a)), lin = (t, a, b) => clamp((t - a) / (b - a), 0, 1), lerp = (a, b, k) => a + (b - a) * k;
  const rng = seed => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
  // camada com paralaxe: conteúdo em cm, y do SVG = -Y do mundo
  const layer = (cam, par, svg, extra) => `<g transform="translate(${f(W / 2 - cam.x * cam.z * par)},${f(H * (cam.hz || .6) + cam.y * cam.z * par)}) scale(${f(cam.z * (cam.par0 ? par : 1))})"${extra || ''}>${svg}</g>`;
  const put = (x, y, svg, o) => `<g transform="translate(${f(x)},${f(-y)})${o && o.rot ? ` rotate(${f(o.rot)})` : ''}${o && o.sc ? ` scale(${o.sc})` : ''}${o && o.flip ? ' scale(-1,1)' : ''}"${o && o.op != null ? ` opacity="${f(o.op)}"` : ''}>${svg}</g>`;
  const shadow = (w, op) => `<ellipse cx="0" cy="0" rx="${f(w)}" ry="${f(w * .13)}" fill="#000" opacity="${op == null ? .22 : op}"/>`;
  const DEFS = `
<linearGradient id="gSkyDay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a9ee8"/><stop offset=".65" stop-color="#a8d8f6"/><stop offset="1" stop-color="#e8f6fd"/></linearGradient>
<linearGradient id="gSkyGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a8fd8"/><stop offset=".6" stop-color="#f6c98a"/><stop offset="1" stop-color="#fde6b8"/></linearGradient>
<linearGradient id="gLava" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a0"/><stop offset=".12" stop-color="#ffb52e"/><stop offset=".5" stop-color="#f2551c"/><stop offset="1" stop-color="#8a1508"/></linearGradient>
<linearGradient id="gRock" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2d2224"/><stop offset="1" stop-color="#4a3838"/></linearGradient>
<linearGradient id="gRockW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7b6a62"/><stop offset="1" stop-color="#4f4340"/></linearGradient>
<linearGradient id="gSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f8fd0"/><stop offset="1" stop-color="#14508c"/></linearGradient>
<linearGradient id="gGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc05a"/><stop offset="1" stop-color="#4f9a3e"/></linearGradient>
<linearGradient id="gRoad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d7078"/><stop offset="1" stop-color="#4c4f57"/></linearGradient>
<linearGradient id="gWallIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4e3c2"/><stop offset="1" stop-color="#e6cfa4"/></linearGradient>
<linearGradient id="gWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b98654"/><stop offset="1" stop-color="#8f6238"/></linearGradient>
<linearGradient id="gSlope" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a7468"/><stop offset="1" stop-color="#5b4a44"/></linearGradient>
<linearGradient id="gMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f3f5"/><stop offset=".5" stop-color="#9aa3ad"/><stop offset="1" stop-color="#5f6770"/></linearGradient>
<radialGradient id="gGlow"><stop offset="0" stop-color="#fff2a8" stop-opacity=".95"/><stop offset=".5" stop-color="#ff9a2e" stop-opacity=".45"/><stop offset="1" stop-color="#ff5a1e" stop-opacity="0"/></radialGradient>
<radialGradient id="gSun"><stop offset="0" stop-color="#fffbe0"/><stop offset=".45" stop-color="#ffe680"/><stop offset="1" stop-color="#ffe680" stop-opacity="0"/></radialGradient>
<radialGradient id="gVig" cx=".5" cy=".45" r=".78"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></radialGradient>
<radialGradient id="gSmk"><stop offset="0" stop-color="#f4f1ec" stop-opacity=".95"/><stop offset=".7" stop-color="#d9d4cc" stop-opacity=".6"/><stop offset="1" stop-color="#cfc9c0" stop-opacity="0"/></radialGradient>
<radialGradient id="gSmkD"><stop offset="0" stop-color="#8f8a86" stop-opacity=".9"/><stop offset=".7" stop-color="#77726e" stop-opacity=".55"/><stop offset="1" stop-color="#6a6561" stop-opacity="0"/></radialGradient>
<filter id="fB2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2"/></filter>
<filter id="fB6" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="fB20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>
<filter id="fGrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="9" result="n"/><feColorMatrix in="n" type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .06"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/></filter>`;
  const INK = '#2a1c1a';
  const frame = (bg, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${DEFS}${G.TOON.defs()}</defs><rect width="${W}" height="${H}" fill="${bg}"/>${body}<rect width="${W}" height="${H}" fill="url(#gVig)"/><rect width="${W}" height="${H}" fill="#fff" filter="url(#fGrain)"/></svg>`;
  // nuvem fofa
  const cloud = (x, y, k, op) => `<g transform="translate(${f(x)},${f(-y)}) scale(${k})" opacity="${op == null ? .95 : op}" fill="#fff"><ellipse cx="0" cy="0" rx="90" ry="26"/><ellipse cx="-34" cy="-16" rx="40" ry="28"/><ellipse cx="22" cy="-22" rx="48" ry="34"/><ellipse cx="60" cy="-6" rx="34" ry="22"/></g>`;
  // fumaça: bolas subindo de (x,y); t anima; n bolas; h altura; sp espalhamento
  function smoke(x, y, t, o) { o = o || {}; const n = o.n || 14, h = o.h || 500, r = rng(o.seed || 5); let s = '';
    for (let i = 0; i < n; i++) { const ph = r(), a = ((t * (o.v || .22) + ph) % 1), dx = (r() - .5) * (o.sp || 120) * (.3 + a) + Math.sin(a * 5 + i) * 20 * a + (o.wind || 0) * a * a, rr = (o.r0 || 30) + a * (o.r1 || 90);
      s += `<circle cx="${f(x + dx)}" cy="${f(-(y + a * h))}" r="${f(rr)}" fill="url(#${o.dark ? 'gSmkD' : 'gSmk'})" opacity="${f((o.op || .9) * Math.sin(Math.PI * Math.min(1, a * 1.15)) ** .6)}"/>`; }
    return s; }
  // etiqueta diegética (cronômetro)
  const tag = (txt, k) => `<g transform="translate(540,250) scale(${f(k == null ? 1 : k)})"><rect x="-210" y="-66" width="420" height="132" rx="26" fill="#1b2030" stroke="#ffd54a" stroke-width="6"/><circle cx="-140" cy="0" r="38" fill="#fdf6e3" stroke="#ffd54a" stroke-width="6"/><path d="M-140 0 L-140 -24 M-140 0 L-124 8" stroke="#1b2030" stroke-width="7" stroke-linecap="round"/><rect x="-148" y="-56" width="16" height="12" fill="#ffd54a"/><text x="40" y="26" font-family="Anton,Impact,Arial Black" font-size="76" fill="#ffd54a" text-anchor="middle">${txt}</text></g>`;

  // ---------------- bicicleta (perfil, indo para a direita). origem: ponto do chão sob o movimento central
  const BK = { R: 33, rear: [-47, 33], front: [58, 33], bb: [0, 29], seat: [-17, 91], head: [40, 92], grip: [36, 104], crank: 17 };
  function wheel(c, ang) { let s = `<g transform="translate(${c[0]},${-c[1]})"><circle r="33" fill="none" stroke="#22252b" stroke-width="5"/><circle r="29.5" fill="none" stroke="#c9ced6" stroke-width="2"/>`;
    for (let i = 0; i < 12; i++) { const a = ang + i * Math.PI / 6; s += `<line x1="0" y1="0" x2="${f(Math.cos(a) * 29)}" y2="${f(Math.sin(a) * 29)}" stroke="#aab1ba" stroke-width=".7"/>`; } return s + `<circle r="3.4" fill="#555"/></g>`; }
  function bike(o) { o = o || {}; const col = o.col || '#e2321f', wa = (o.dist || 0) / 33, ca = o.crank || 0; const B = BK; const P = p => `${p[0]} ${-p[1]}`;
    const ped = (a, far) => { const x = B.bb[0] + Math.cos(a) * B.crank, y = B.bb[1] + Math.sin(a) * B.crank; return `<line x1="${B.bb[0]}" y1="${-B.bb[1]}" x2="${f(x)}" y2="${f(-y)}" stroke="${far ? '#6c737c' : '#9aa3ad'}" stroke-width="3.2" stroke-linecap="round"/><rect x="${f(x - 7)}" y="${f(-y - 1.6)}" width="14" height="3.2" rx="1.2" fill="#22252b"/>`; };
    let s = shadow(70, .2) + ped(ca + Math.PI, 1) + wheel(B.rear, wa) + wheel(B.front, wa);
    s += `<g stroke="${col}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M${P(B.bb)} L${P(B.rear)} L${P([-14, 84])} Z"/><path d="M${P(B.bb)} L${P([-14, 84])} L${P([38, 86])} L${P(B.bb)}"/></g>`;
    s += `<path d="M${P([-14, 84])} L${P([-16, 93])}" stroke="#333" stroke-width="3.4"/><path d="M-29 ${-94} C-22 ${-98} -8 ${-97} -4 ${-93} L-6 ${-90} L-28 ${-90}Z" fill="#22252b"/>`; // selim
    s += `<path d="M${P([38, 86])} L${P(B.front)}" stroke="#aab1ba" stroke-width="4" stroke-linecap="round"/><path d="M${P([38, 86])} L${P([40, 100])} L${P(B.grip)}" stroke="#333" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${B.grip[0]}" cy="${-B.grip[1]}" r="2.6" fill="#22252b"/>`;
    s += `<circle cx="${B.bb[0]}" cy="${-B.bb[1]}" r="8.5" fill="none" stroke="#555" stroke-width="2.4"/><path d="M${P([B.bb[0], B.bb[1] + 8.5])} L${P([B.rear[0], B.rear[1] + 3.5])} M${P([B.bb[0], B.bb[1] - 8.5])} L${P([B.rear[0], B.rear[1] - 3.5])}" stroke="#555" stroke-width="1.2"/><circle cx="${B.rear[0]}" cy="${-B.rear[1]}" r="4" fill="none" stroke="#555" stroke-width="1.6"/>`;
    if (o.brand) s += `<text x="12" y="${-70}" font-family="Anton,Impact,Arial Black" font-size="6.4" fill="#fff" text-anchor="middle" transform="rotate(-2 12 -70)">Hryz Animation</text>`;
    return { svg: s, near: ped(ca, 0) }; }
  // pose de ciclista (yaw 90 = indo para a direita). crank em rad; retorna pose do rig
  function riderPose(ca, o) { o = o || {}; const B = BK, k = o.k || 1; const foot = a => [B.bb[1] + Math.sin(a) * B.crank + 8.5, B.bb[0] + Math.cos(a) * B.crank - 3];
    const l = foot(ca), r = foot(ca + Math.PI); const bob = Math.sin(ca * 2) * .6;
    return Object.assign({ yaw: 90, pel: [0, 100 + bob, B.seat[0] - 2], lean: 24, spine: [14, 0, 0], chest: [8, 0, 0], neck: [-22, 0, 0], head: [-14, 0, 0],
      legL: { t: [9, l[0], l[1]], pole: [0.25, 0.4, 1], fwd: [0, -0.12 + Math.sin(ca) * .12, 1] }, legR: { t: [-9, r[0], r[1]], pole: [-0.25, 0.4, 1], fwd: [0, -0.12 + Math.sin(ca + Math.PI) * .12, 1] },
      armL: { t: [19, B.grip[1] + 1, B.grip[0] - 2], hand: 'fist', hd: [0, -0.3, 1], palm: [0, -1, 0], pole: [1, -1, -0.3] }, armR: { t: [-19, B.grip[1] + 1, B.grip[0] - 2], hand: 'fist', hd: [0, -0.3, 1], palm: [0, -1, 0], pole: [-1, -1, -0.3] } }, o.extra || {}); }
  // ciclista completo: perna de trás, bicicleta, corpo
  function rider(tipo, o) { o = o || {}; const b = bike(o), r = G.TOON.draw(tipo, riderPose(o.crank || 0, o)); return r.back + b.svg + r.mid + b.near + r.front; }

  G.ST = { W, H, f, clamp, ease, seg, lin, lerp, rng, layer, put, shadow, frame, cloud, smoke, tag, bike, rider, riderPose, BK, INK, DEFS };
})(window);
