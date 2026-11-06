/* ===================== O cavalo de madeira (Stalag Luft III, 1943) ===================== */
const SH = N.s.map(x => [x.k, x.a, x.b]);
const shotAt = t => SH.find(s => t >= s[1] && t < s[2]) || SH[SH.length - 1];
const loc = (t, id) => { const s = SH.find(x => x[0] === id); return { L: t - s[1], d: s[2] - s[1], k: (t - s[1]) / (s[2] - s[1]) }; };
const GRAINV = t => { const j = Math.floor(t * 24); return `<rect x="-200" y="-200" width="1480" height="2320" fill="url(#noiseP)" opacity=".05" transform="translate(${(j * 37) % 200 - 100},${(j * 53) % 200 - 100})"/>`; };
const HH = (t, k = 1) => [3 * k * noise1(t * 1.3, 1), 3 * k * noise1(t * 1.1, 4)];
const GND = 1500;   // linha do chão

/* ---------- cenário ---------- */
function sky(day = 1) { return `<rect x="-1500" y="-1500" width="6800" height="3200" fill="${mix('#0C1430', '#9CC0DE', day)}"/><rect x="-1500" y="700" width="6800" height="900" fill="${mix('#1A2240', '#D8E4EA', day)}" opacity=".7"/>`; }
function pines(y, n, sc, col, seed = 1) { let o = ''; n = Math.round(n * 1.66); for (let i = 0; i < n; i++) { const x = -1200 + i * (6000 / n) + ((i * 97 * seed) % 60), h = (260 + (i * 53 * seed) % 160) * sc; o += `<path d="M${x} ${y} L${x + 70 * sc} ${y - h} L${x + 140 * sc} ${y}Z" fill="${col}"/>`; } return o; }
function barracks(x, y, s, day = 1) { return `<g transform="translate(${x},${y}) scale(${s})"><rect x="-400" y="-260" width="800" height="260" fill="${mix('#3A3026', '#8A6E50', day)}" stroke="${OUTL}" stroke-width="5"/>${Array.from({ length: 16 }, (_, i) => `<line x1="${-400 + i * 50}" y1="-260" x2="${-400 + i * 50}" y2="0" stroke="${OUTL}" stroke-width="2" opacity=".35"/>`).join('')}<path d="M-430 -250 L0 -380 L430 -250Z" fill="${mix('#2A2420', '#5A4A3A', day)}" stroke="${OUTL}" stroke-width="5"/>${[-260, -60, 140].map(xx => `<rect x="${xx}" y="-200" width="110" height="90" fill="${mix('#1A2030', '#C8DCE8', day)}" stroke="${OUTL}" stroke-width="4"/>`).join('')}<rect x="300" y="-180" width="70" height="180" fill="#2A2018" stroke="${OUTL}" stroke-width="4"/><rect x="-400" y="-20" width="800" height="40" fill="#2A2420" stroke="${OUTL}" stroke-width="4"/></g>`; }
function fence(x0, x1, y, h = 520, day = 1) {
  let o = ''; const c = mix('#2A2420', '#6A5440', day);
  for (let x = x0; x <= x1; x += 240) o += `<rect x="${x - 12}" y="${y - h}" width="24" height="${h}" fill="${c}" stroke="${OUTL}" stroke-width="3"/><path d="M${x} ${y - h} l40 -50" stroke="${c}" stroke-width="16" stroke-linecap="round"/>`;
  for (let r = 0; r < 8; r++) { const yy = y - 40 - r * (h - 60) / 7; o += `<line x1="${x0}" y1="${f1(yy)}" x2="${x1}" y2="${f1(yy)}" stroke="#4A4A50" stroke-width="3"/>`; for (let x = x0 + (r % 2) * 30; x < x1; x += 60) o += `<path d="M${x - 7} ${f1(yy - 7)} l14 14 M${x + 7} ${f1(yy - 7)} l-14 14" stroke="#4A4A50" stroke-width="3"/>`; }
  return o;
}
function tower(x, y, s, t, o = {}) {
  const day = o.day ?? 1;
  let g = `<g transform="translate(${x},${y}) scale(${s})"><path d="M-110 0 L-70 -620 M110 0 L70 -620 M-100 -150 L90 -350 M100 -150 L-90 -350 M-86 -380 L80 -560 M86 -380 L-80 -560" stroke="${mix('#2A2018', '#5A4430', day)}" stroke-width="18" fill="none"/>`;
  g += `<rect x="-170" y="-800" width="340" height="190" fill="${mix('#2A2018', '#6A5038', day)}" stroke="${OUTL}" stroke-width="5"/><path d="M-210 -800 L0 -900 L210 -800Z" fill="${mix('#1E1814', '#4A3A2A', day)}" stroke="${OUTL}" stroke-width="5"/><rect x="-150" y="-780" width="300" height="80" fill="#0E0C0A"/>`;
  if (o.guard !== false) g += `<g transform="translate(${o.gx || 0},-618)">${man({ x: 0, y: 0, s: .55, kind: 'alemao', flip: o.flip || 1, armF: o.armF || [-10, 10], armB: o.armB || [-10, 10], mouth: o.mouth || 0, eyes: o.eyes ?? 1, shadow: 0 })}</g><rect x="-170" y="-700" width="340" height="90" fill="${mix('#2A2018', '#6A5038', day)}" stroke="${OUTL}" stroke-width="5"/>`;
  if (o.light) { const a = o.light; g += `<g transform="translate(120,-760) rotate(${f1(a)})"><path d="M0 -14 L1800 -260 L1800 260 L0 14Z" fill="url(#beamS)" opacity=".6"/></g><circle cx="120" cy="-760" r="22" fill="#FFF6D8"/>`; }
  return g + '</g>';
}
function sandGround(day = 1) { return `<rect x="-1500" y="${GND}" width="6800" height="1600" fill="${mix('#2A2618', '#C8B48A', day)}"/><rect x="-1500" y="${GND}" width="6800" height="10" fill="#000" opacity=".2"/>${Array.from({ length: 50 }, (_, i) => `<ellipse cx="${-1400 + (i * 173) % 3900}" cy="${GND + 40 + (i * 61) % 500}" rx="${8 + i % 9}" ry="3" fill="${mix('#1A1810', '#A8946A', day)}"/>`).join('')}`; }
// cavalo de ginástica de madeira (perfil). open: 0..1 mostra o interior (corte); inside: conteúdo
function horse(x, y, s, o = {}) {
  const day = o.day ?? 1, wood = mix('#4A3420', '#B8864E', day), woodD = mix('#3A2818', '#8A6038', day), top = mix('#2A1A10', '#6A3A22', day);
  let g = `<g transform="translate(${f1(x)},${f1(y)}) scale(${s})">`;
  g += `<path d="M-300 0 L-240 -360 L240 -360 L300 0Z" fill="${o.open ? '#1A120C' : wood}" stroke="${OUTL}" stroke-width="6"/>`;
  if (o.inside) g += o.inside;
  if (!o.open) { for (let i = 1; i < 5; i++) g += `<line x1="${-300 + i * 12}" y1="${-i * 72}" x2="${300 - i * 12}" y2="${-i * 72}" stroke="${woodD}" stroke-width="5"/>`; g += `<rect x="-60" y="-220" width="120" height="70" rx="12" fill="${woodD}" stroke="${OUTL}" stroke-width="4"/>`; }
  else g += `<path d="M-300 0 L-240 -360 L240 -360 L300 0" fill="none" stroke="${wood}" stroke-width="26"/><path d="M-300 0 L-240 -360 L240 -360 L300 0" fill="none" stroke="${OUTL}" stroke-width="4"/>`;
  g += `<rect x="-270" y="-410" width="540" height="64" rx="30" fill="${top}" stroke="${OUTL}" stroke-width="5"/><path d="M-230 -396 L230 -396" stroke="#fff" stroke-width="6" opacity=".2"/>`;
  if (o.poles) g += `<rect x="-560" y="-250" width="1120" height="24" rx="10" fill="${woodD}" stroke="${OUTL}" stroke-width="4"/>`;
  return g + '</g>';
}
// salto: fase 0..1 (corrida → mãos no cavalo → aterrissa)
function vault(x0, hx, ph, kind, s = .9) {
  const run = ph < .45 ? ph / .45 : 1, air = ph >= .45 && ph < .8 ? (ph - .45) / .35 : ph >= .8 ? 1 : 0, land = ph >= .8 ? (ph - .8) / .2 : 0;
  if (ph < .45) { const W = walkPose(ph * 40, 1.3); return man({ x: lerp(x0, hx - 260 * s, run), y: GND, s, kind, ...W, lean: 14 }); }
  if (ph < .8) { const x = lerp(hx - 200 * s, hx + 240 * s, air), y = GND - Math.sin(air * Math.PI) * 330 * s; return man({ x, y, s, kind, lean: 30, legF: [80, -10], legB: [-60, -10], armF: [lerp(20, -30, air), 0], armB: [lerp(10, -40, air), 0], shadow: 0 }); }
  const W = walkPose(land * 6, .6); return man({ x: hx + 260 * s + land * 260, y: GND, s, kind, ...W });
}
const sack = (x, y, s = 1) => `<g transform="translate(${f1(x)},${f1(y)}) scale(${s})"><path d="M-40 0 Q-50 -70 -20 -90 L20 -90 Q50 -70 40 0Z" fill="#C8B080" stroke="${OUTL}" stroke-width="4"/><path d="M-22 -90 Q0 -110 22 -90" stroke="${OUTL}" stroke-width="5" fill="none"/></g>`;
function counterBox(t, n, label, pop = 1) {
  return `<g transform="translate(540,220) scale(${f1(pop * 100) / 100})"><rect x="-300" y="-118" width="600" height="226" rx="34" fill="#0A0806" opacity=".6"/><rect x="-300" y="-118" width="600" height="226" rx="34" fill="none" stroke="#FFE2A8" stroke-width="4" opacity=".6"/><text x="0" y="40" text-anchor="middle" font-family="'DejaVu Sans Mono',monospace" font-weight="700" font-size="150" fill="#FFF3D6">${n}</text><text x="0" y="92" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="40" letter-spacing="10" fill="#FFD27A">${label}</text></g>`;
}
function yard(t, o = {}) {
  const day = o.day ?? 1;
  let s = lay(.05, sky(day)) + lay(.25, pines(1240, 26, 1.0, mix('#0E1810', '#3A5A3A', day), 1)) + lay(.35, pines(1300, 20, 1.3, mix('#0A140C', '#2E4A2E', day), 3));
  s += lay(.6, barracks(-260, 1280, .7, day) + barracks(560, 1260, .55, day));
  s += lay(.8, sandGround(day));
  return s;
}

/* ---------- 1. gancho: prisioneiros pulando o cavalo; guarda na torre olhando ---------- */
function s1(t) {
  const { L, d, k } = loc(t, 'n1'), [hx, hy] = HH(t);
  setCam(lerp(860, 920, k) + hx, 1080 + hy, lerp(.92, 1.02, easeInOut(k)), 0, [540, 1100, 1]);
  let s = yard(t);
  s += lay(.9, fence(-1100, 2300, GND - 120, 520) + tower(420, GND - 120, .8, t, { flip: 1 }));
  s += lay(1, horse(820, GND, 1.0));
  const kinds = ['pow', 'pow2', 'pow3', 'pow4'];
  for (let i = 0; i < 4; i++) { const ph = ((L * .62) + i * .25) % 1; s += lay(1, vault(-200 + i * 0, 820, ph, kinds[i])); }
  return s + VIG(.7) + GRAINV(t) + (L < .1 ? `<rect width="1080" height="1920" fill="#fff" opacity="${op(.3 * (1 - L / .1))}"/>` : '');
}
/* ---------- 2. carregam o cavalo até o canto, perto da cerca; o guarda boceja ---------- */
function s2(t) {
  const { L, d, k } = loc(t, 'n2'), [hx, hy] = HH(t);
  setCam(lerp(-80, 1000, easeInOut(range(L, 0, 3))) + hx, 1080 + hy, .82, 0, [540, 1100, 1]);
  let s = yard(t);
  const yawn = range(L, 3.2, 3.6) * (1 - range(L, 4.6, 5.0));
  s += lay(.9, fence(-1100, 2400, GND - 160, 520) + tower(1350, GND - 160, .8, t, { flip: -1, mouth: yawn, armF: yawn ? [170, 20] : [-10, 10], armB: yawn ? [170, 20] : [-10, 10], eyes: yawn > .5 ? 0 : 1 }));
  const carry = easeInOut(range(L, 0, 2.8)), hxp = lerp(-300, 900, carry), W = walkPose(L * 9, carry < 1 ? 1 : 0);
  const kinds = ['pow', 'pow2', 'pow3', 'pow4'];
  let c = '';
  if (L < 2.9) { c += man({ x: hxp - 520, y: GND, s: .85, kind: kinds[0], ...W, armF: [20, -40], armB: [10, -30] }) + man({ x: hxp - 380, y: GND, s: .85, kind: kinds[1], ...walkPose(L * 9 + 2, W.bob ? 1 : 0), armF: [20, -40] }); c += horse(hxp, GND - 40 - W.bob * .5, 1.0, { poles: true }); c += man({ x: hxp + 380, y: GND, s: .85, kind: kinds[2], ...walkPose(L * 9 + 1, carry < 1 ? 1 : 0), armF: [-20, -40] }) + man({ x: hxp + 520, y: GND, s: .85, kind: kinds[3], ...walkPose(L * 9 + 3, carry < 1 ? 1 : 0), armF: [-20, -40] }); }
  else { c += horse(900, GND, 1.0); for (let i = 0; i < 3; i++) { const ph = ((L - 2.9) * .7 + i * .33) % 1; c += vault(200, 900, ph, kinds[i]); } }
  s += lay(1, c);
  return s + VIG(.7) + GRAINV(t);
}
/* ---------- 3. o corte: tinha um homem lá dentro ---------- */
function s3(t) {
  const { L, d, k } = loc(t, 'n3'), [hx, hy] = HH(t);
  setCam(lerp(820, 820, k) + hx, lerp(1250, 1320, k) + hy, lerp(.8, 1.4, easeInOut(range(L, .2, 2.4))), 0, [540, 1250, 1]);
  let s = yard(t);
  s += lay(.9, fence(-1100, 2400, GND - 160, 520));
  const open = range(L, 1.0, 1.6);
  const inside = man({ x: -20, y: -6, s: .5, kind: 'pow3', drop: 230, lean: 45, legF: [100, -110], legB: [70, -120], armF: [110, 30], armB: [100, 40], shadow: 0, eyes: 1 });
  s += lay(1, horse(820, GND, 1.0, { open: open > .5, inside: open > .5 ? inside : '' }));
  if (open > 0 && open < 1) s += lay(1, `<path d="M${f1(820 - 300 + 600 * open)} ${GND - 420} L${f1(820 - 300 + 600 * open)} ${GND}" stroke="#fff" stroke-width="10" opacity=".8"/>`);
  // pulos continuam por cima
  const ph = (L * .7) % 1; s += lay(1, vault(200, 820, ph, 'pow'));
  return s + VIG(.7) + GRAINV(t);
}
/* ---------- 4. corte do subsolo: ele cava enquanto os outros pulam ---------- */
function underground(t, depth, tunnel, day = 1) {
  let s = `<rect x="-1500" y="${GND}" width="6800" height="1800" fill="#B8A070"/>`;
  for (let i = 0; i < 6; i++) s += `<rect x="-1500" y="${GND + 160 + i * 230}" width="6800" height="${110 + (i % 2) * 40}" fill="${['#A8905E', '#C8B080', '#9A8458'][i % 3]}" opacity=".6"/>`;
  for (let i = 0; i < 60; i++) s += `<circle cx="${-1400 + (i * 191) % 3900}" cy="${GND + 60 + (i * 83) % 1500}" r="${4 + i % 6}" fill="#8A7450" opacity=".5"/>`;
  if (depth > 0) s += `<rect x="740" y="${GND}" width="160" height="${f1(depth)}" fill="#2A1E12" stroke="#5A4428" stroke-width="6"/>`;
  if (tunnel > 0) s += `<rect x="740" y="${f1(GND + depth - 140)}" width="${f1(tunnel)}" height="140" rx="30" fill="#2A1E12" stroke="#5A4428" stroke-width="6"/>${Array.from({ length: Math.floor(tunnel / 160) }, (_, i) => `<rect x="${760 + i * 160}" y="${f1(GND + depth - 150)}" width="14" height="160" fill="#7A5A34"/>`).join('')}`;
  return s;
}
function s4(t) {
  const { L, d, k } = loc(t, 'n4'), [hx, hy] = HH(t);
  setCam(820 + hx, lerp(1450, 1560, k) + hy, lerp(1.05, 1.15, k), 0, [540, 1450, 1]);
  let s = lay(.05, sky(1)) + lay(.4, pines(1300, 20, 1.3, '#2E4A2E', 3));
  const depth = lerp(60, 420, easeOut(range(L, .3, d - .3)));
  s += lay(1, underground(t, depth, 0));
  // o cavaleiro escondido cavando dentro do poço, sacos ao lado
  const dig = Math.sin(L * 7);
  s += lay(1, man({ x: 800, y: GND + depth - 10, s: .55, kind: 'pow3', drop: 220, lean: 50 + 10 * dig, legF: [95, -110], legB: [60, -100], armF: [140 + 20 * dig, -20], armB: [130 + 20 * dig, -10], shadow: 0, held: `<path d="M0 0 q30 -10 60 0 q-10 30 -30 32 q-24 -2 -30 -32Z" fill="#8A8A90" stroke="${OUTL}" stroke-width="3" transform="rotate(${f1(40 + 30 * dig)})"/>` }));
  const nsacks = Math.floor(range(L, .6, d - .4) * 5);
  for (let i = 0; i < nsacks; i++) s += lay(1, sack(620 - i * 10, GND - 10 - i * 60, .9));
  s += lay(1, horse(820, GND, 1.0, { open: true }));
  // pés pulando por cima (poeira e batida)
  const ph = (L * .75) % 1; s += lay(1, vault(200, 820, ph, 'pow2'));
  if (ph > .55 && ph < .65) s += lay(1, `<g opacity=".7">${Array.from({ length: 6 }, (_, i) => `<circle cx="${820 + (i - 2.5) * 50}" cy="${GND - 430}" r="${10 + i % 3 * 4}" fill="#E8DCC0"/>`).join('')}</g>`);
  return s + VIG(.7) + GRAINV(t);
}
/* ---------- 5. tampam o buraco e levam o cavalo pesado de volta ---------- */
function s5(t) {
  const { L, d, k } = loc(t, 'n5'), [hx, hy] = HH(t);
  let s = '';
  if (L < 2.2) {
    setCam(860 + hx, 1300 + hy, 1.0, 0, [540, 1300, 1]);
    s += lay(.05, sky(.8)) + lay(.4, pines(1300, 20, 1.3, '#2E4A2E', 3)) + lay(1, sandGround(.85));
    const board = easeInOut(range(L, .2, .9)), sand = range(L, 1.0, 1.9);
    s += lay(1, `<ellipse cx="825" cy="${GND + 4}" rx="95" ry="22" fill="#1A1208"/>` + horse(820, GND - 460, .7, { open: false }).replace('<g transform', '<g opacity="0" transform'));
    s += lay(1, `<rect x="${f1(lerp(1200, 740, board))}" y="${GND - 6}" width="170" height="22" fill="#8A6038" stroke="${OUTL}" stroke-width="4"/>` + (sand > 0 ? `<path d="M720 ${GND + 10} Q820 ${f1(GND - 30 * sand)} 920 ${GND + 10}Z" fill="#C8B48A"/>` : '') + Array.from({ length: 16 }, (_, i) => { const p = (L * 2 + i * .13) % 1; return sand > 0 && sand < 1 ? `<circle cx="${f1(760 + (i % 8) * 20)}" cy="${f1(GND - 300 + p * 300)}" r="5" fill="#C8B48A"/>` : ''; }).join(''));
    s += lay(1, man({ x: 1060, y: GND, s: .62, kind: 'pow3', drop: 200, lean: 30, legF: [85, -95], legB: [-10, 95], armF: [lerp(30, 45, board) - 15 * Math.sin(L * 8) * (sand > 0 ? 1 : 0), 0], armB: [25, 10], flip: -1, held: board < 1 ? '' : '' }));
  } else {
    const L2 = L - 2.2, k2 = L2 / (d - 2.2);
    setCam(lerp(900, -250, k2) + hx, 1080 + hy, .85, 0, [540, 1100, 1]);
    s += yard(t, { day: .85 });
    const hxp = lerp(900, -400, k2), strain = Math.abs(Math.sin(L2 * 5)) * 18;
    const kinds = ['pow', 'pow2', 'pow4', 'pow'];
    let c = man({ x: hxp + 520, y: GND, s: .85, kind: kinds[0], flip: -1, ...walkPose(L2 * 6, .6), lean: -12, armF: [20, -40] }) + man({ x: hxp + 380, y: GND, s: .85, kind: kinds[1], flip: -1, ...walkPose(L2 * 6 + 2, .6), lean: -12, armF: [20, -40] });
    c += horse(hxp, GND - 30 - strain * .3, 1.0, { poles: true });
    c += man({ x: hxp - 380, y: GND, s: .85, kind: kinds[2], flip: -1, ...walkPose(L2 * 6 + 1, .6), lean: -12, armF: [-20, -40] }) + man({ x: hxp - 520, y: GND, s: .85, kind: kinds[3], flip: -1, ...walkPose(L2 * 6 + 3, .6), lean: -12, armF: [-20, -40] });
    // gotas de suor = está pesado
    for (let i = 0; i < 4; i++) { const p = (L2 * 1.5 + i * .25) % 1; c += `<path d="M${f1(hxp + [520, 380, -380, -520][i] + 40)} ${f1(GND - 900 + p * 80)} q8 14 0 22 q-8 -8 0 -22Z" fill="#9AD0FF" opacity="${op(1 - p)}"/>`; }
    s += lay(1, c);
  }
  return s + VIG(.7) + GRAINV(t);
}
/* ---------- 6. o túnel cresce por baixo da cerca (contador de dias) ---------- */
function s6(t) {
  const { L, d, k } = loc(t, 'n6'), [hx, hy] = HH(t);
  setCam(lerp(1000, 1500, easeInOut(k)) + hx, 1500 + hy, .58, 0, [540, 1500, 1]);
  const cyc = range(L, .1, d - .7), day = .5 + .5 * Math.sin(cyc * Math.PI * 2 * 8 - Math.PI / 2);
  let s = lay(.05, sky(day)) + lay(.4, pines(1300, 30, 1.3, mix('#0A140C', '#2E4A2E', day), 3));
  s += lay(1, underground(t, 420, lerp(160, 2000, easeInOut(cyc))) + `<rect x="-1500" y="${GND - 4}" width="6800" height="8" fill="${mix('#2A2618', '#C8B48A', day)}"/>` + fence(2000, 3400, GND, 520, day) + horse(820, GND, 1.0, { day }));
  const n = Math.max(1, Math.floor(cyc * 98)), fin = range(L, d - .7, d - .4);
  return s + VIG(.7) + (fin > 0 ? counterBox(t, 3, 'MESES', 1 + .25 * Math.sin(fin * Math.PI)) : counterBox(t, n, n === 1 ? 'DIA' : 'DIAS')) + GRAINV(t);
}
/* ---------- 7. a noite da fuga: rastejam e saem do outro lado da cerca ---------- */
function s7(t) {
  const { L, d, k } = loc(t, 'n7'), [hx, hy] = HH(t);
  setCam(lerp(1600, 2500, easeInOut(range(L, 0, 3.4))) + hx, lerp(1560, 1380, easeInOut(range(L, 2.4, 4.2))) + hy, .6, 0, [1600, 1500, 1]);
  let s = lay(.05, sky(0) + STARS.slice(0, 90).map(q => `<circle cx="${f1(q.x * 1.5 + 600)}" cy="${f1(q.y * .4 - 200)}" r="${q.r}" fill="#fff" opacity=".6"/>`).join('')) + lay(.4, pines(1300, 30, 1.3, '#0A140C', 3));
  s += lay(1, underground(t, 420, 2000).replace('#B8A070', '#3A3020') + `<rect x="-1500" y="${GND - 4}" width="6800" height="8" fill="#2A2618"/>` + fence(2000, 3400, GND, 520, 0) + `<rect x="2720" y="${GND - 4}" width="140" height="80" fill="#0A0806"/>` + pines(GND, 10, 1.6, '#08100A', 7).replace(/M(-?\d+)/g, (m, x) => `M${+x + 2800}`));
  // três rastejando no túnel e saindo pelo buraco
  for (let i = 0; i < 3; i++) {
    const p = range(L, .2 + i * .5, 3.2 + i * .5), x = lerp(900, 2780, p), out = range(L, 3.2 + i * .5, 3.8 + i * .5);
    const kind = ['pow', 'pow2', 'pow4'][i];
    if (out <= 0) s += lay(1, man({ x, y: GND + 400, s: .42, kind, drop: 300, lean: 80, legF: [90 + 20 * Math.sin(L * 9 + i), -90], legB: [80 - 20 * Math.sin(L * 9 + i), -90], armF: [150 + 20 * Math.sin(L * 9 + i), -20], armB: [140, -20], shadow: 0 }));
    else s += lay(1, man({ x: 2790 + out * 300, y: GND - lerp(-200, 0, Math.min(1, out * 2)), s: .55, kind, ...walkPose(L * 10 + i, out > .5 ? 1.2 : 0), lean: 15, shadow: 0 }));
  }
  s += lay(.9, tower(1700, GND, 1.1, t, { day: 0, light: -20 + Math.sin(t * .9) * 25, flip: 1 }));
  return s + VIG(.9) + GRAINV(t);
}
/* ---------- 8. trem e navio até a Suécia ---------- */
function s8(t) {
  const { L, d, k } = loc(t, 'n8'), [hx, hy] = HH(t);
  let s = '';
  if (L < 1.9) {
    setCam(540 + hx, 1100 + hy, .75, 0, [540, 1100, 1]);
    s += lay(.05, sky(.6)) + lay(.3, pines(1250, 30, 1.0, '#2A4430', 2).replace(/M(-?\d+)/g, (m, x) => `M${+x - ((L * 900) % 400)}`));
    s += lay(1, `<rect x="-1500" y="${GND}" width="6800" height="1600" fill="#4A4438"/><rect x="-1500" y="${GND + 10}" width="6800" height="14" fill="#6A6A70"/>`);
    const tx = lerp(-600, 300, L / 1.9);
    let train = '';
    for (let c = 0; c < 3; c++) { const x = tx + c * 640; train += `<g transform="translate(${f1(x)},${GND})"><rect x="0" y="-380" width="600" height="320" rx="20" fill="#5A2A22" stroke="${OUTL}" stroke-width="5"/><rect x="20" y="-420" width="560" height="44" rx="16" fill="#3A1A16" stroke="${OUTL}" stroke-width="4"/>${[60, 220, 380].map(wx => `<rect x="${wx}" y="-330" width="120" height="110" fill="#C8DCE8" stroke="${OUTL}" stroke-width="4"/>`).join('')}<circle cx="120" cy="-40" r="46" fill="#1A1A1E" stroke="${OUTL}" stroke-width="4"/><circle cx="480" cy="-40" r="46" fill="#1A1A1E" stroke="${OUTL}" stroke-width="4"/></g>`; }
    // os três na janela do primeiro vagão
    train += [0, 1, 2].map(i => `<g transform="translate(${f1(tx + 120 + i * 160)},${GND - 270}) scale(.7)"><circle r="40" fill="${['#E6B896', '#ECC4A2', '#EAC0A0'][i]}" stroke="${OUTL}" stroke-width="4"/><path d="M-40 -6 Q-44 -50 0 -52 Q40 -50 40 -10 Q20 -30 0 -30 Q-24 -30 -40 -6Z" fill="${['#3A2616', '#8A5A2A', '#C8A060'][i]}" stroke="${OUTL}" stroke-width="3"/></g>`).join('');
    s += lay(1, train);
  } else {
    const L2 = L - 1.9, k2 = L2 / (d - 1.9);
    setCam(lerp(500, 600, k2) + hx, 1060 + hy, .72, 0, [540, 1100, 1]);
    s += lay(.05, sky(1)) + lay(.4, `<path d="M-900 1250 Q-300 1150 300 1220 L300 1300 L-900 1300Z" fill="#5A7A5A"/><g transform="translate(-200,1180)">${Array.from({ length: 5 }, (_, i) => `<rect x="${i * 90}" y="${-60 - (i % 2) * 30}" width="70" height="${60 + (i % 2) * 30}" fill="${['#C8584A', '#E8D8A8', '#C8584A', '#8AA0B8', '#E8D8A8'][i]}" stroke="${OUTL}" stroke-width="3"/>`).join('')}</g>`);
    s += lay(.7, `<rect x="-1500" y="1290" width="6800" height="1600" fill="#3A6A9A"/>${Array.from({ length: 20 }, (_, i) => `<path d="M${-1400 + i * 200 + ((t * 60) % 200)} ${1340 + (i % 4) * 90} q30 -10 60 0" stroke="#9AC0E8" stroke-width="4" fill="none"/>`).join('')}`);
    const sx = lerp(1300, 560, easeOut(k2));
    s += lay(1, `<g transform="translate(${f1(sx)},1330)"><path d="M-420 -80 L420 -80 L340 60 L-360 60Z" fill="#E8E2D4" stroke="${OUTL}" stroke-width="5"/><rect x="-220" y="-220" width="320" height="140" fill="#D8D2C4" stroke="${OUTL}" stroke-width="4"/><rect x="-40" y="-330" width="60" height="110" fill="#2A2A30" stroke="${OUTL}" stroke-width="4"/><rect x="260" y="-380" width="8" height="300" fill="#3A3A40"/>
      <g transform="translate(268,-380) skewY(${f1(Math.sin(t * 6) * 4)})"><rect width="170" height="110" fill="#2A5AA8" stroke="${OUTL}" stroke-width="4"/><rect x="50" width="32" height="110" fill="#F2C832"/><rect y="38" width="170" height="32" fill="#F2C832"/></g>
      ${[0, 1, 2].map(i => man({ x: -180 + i * 110, y: -80, s: .32, kind: ['pow', 'pow2', 'pow4'][i], armF: [160 + 15 * Math.sin(t * 8 + i), 10], shadow: 0 })).join('')}</g>`);
  }
  return s + VIG(.7) + GRAINV(t);
}
/* ---------- 9. de manhã: alarme, o buraco; o cavalo sozinho no pátio ---------- */
function s9(t) {
  const { L, d, k } = loc(t, 'n9'), [hx, hy] = HH(t);
  setCam(lerp(1500, 860, easeInOut(range(L, 1.6, 3.8))) + hx, lerp(1060, 1120, easeInOut(range(L, 1.6, 3.8))) + hy, lerp(.72, 1.0, easeInOut(range(L, 1.6, 4.2))), 0, [540, 1100, 1]);
  const alarm = Math.sin(t * 12) > 0;
  let s = yard(t, { day: .9 });
  s += lay(.9, fence(-1100, 2600, GND - 160, 520) + `<rect x="2000" y="${GND - 170}" width="160" height="60" fill="#1A1408"/>`);
  // guardas correndo até o buraco, um apontando
  for (let i = 0; i < 3; i++) { const run = range(L, i * .3, 1.6 + i * .3); s += lay(.95, man({ x: lerp(400 + i * 120, 1800 + i * 110, run), y: GND - 160, s: .7, kind: 'alemao', ...walkPose(L * 11 + i, run < 1 ? 1.3 : 0), armF: run >= 1 && i === 0 ? [100, -10] : [20, 10], mouth: run >= 1 ? 1 : 0 })); }
  s += lay(1, horse(820, GND, 1.1, { day: .95 }) + `<ellipse cx="820" cy="${GND + 10}" rx="360" ry="30" fill="#000" opacity=".25" filter="url(#b12)"/>`);
  if (alarm && L < 3.2) s += `<rect width="1080" height="1920" fill="#FF3020" opacity=".12"/>`;
  return s + VIG(.7) + GRAINV(t);
}
const FN = { n1: s1, n2: s2, n3: s3, n4: s4, n5: s5, n6: s6, n7: s7, n8: s8, n9: s9 };
function frame(t) {
  D = []; uid = 0;
  const sh = shotAt(t);
  let body = FN[sh[0]](t);
  for (const c of SH.slice(1)) if (t >= c[1] && t < c[1] + .08) body += `<rect width="1080" height="1920" fill="#fff" opacity="${op(.2 * (1 - (t - c[1]) / .08))}"/>`;
  defsEl.innerHTML = STATIC + objDefs() + `<filter id="bl6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>` + D.join('');
  root.innerHTML = body;
}
