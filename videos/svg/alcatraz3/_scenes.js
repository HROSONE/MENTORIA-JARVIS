/* ===================== história em 9 cenas (cada uma se entende só olhando) ===================== */
const NS = Object.fromEntries(N.s.map(x => [x.k, x]));
const SH = N.s.map(x => [x.k, x.a, x.b]);
const shotAt = t => SH.find(s => t >= s[1] && t < s[2]) || SH[SH.length - 1];
const loc = (t, id) => { const s = SH.find(x => x[0] === id); return { L: t - s[1], d: s[2] - s[1], k: (t - s[1]) / (s[2] - s[1]) }; };
const GRAINV = t => { const j = Math.floor(t * 24); return `<rect x="-200" y="-200" width="1480" height="2320" fill="url(#noiseP)" opacity=".05" transform="translate(${(j * 37) % 200 - 100},${(j * 53) % 200 - 100})"/>`; };
const HH = (t, k = 1) => [3 * k * noise1(t * 1.3, 1), 3 * k * noise1(t * 1.1, 4)];
const FLOOR = 1500;

/* ---------- cenário reaproveitável ---------- */
function cellBack(t, night = 1) {
  const wall = mix('#4A4E5A', '#262A36', night), brick = mix('#565A66', '#2E3240', night), floor = mix('#5A5650', '#1E1E24', night);
  let s = `<rect x="-900" y="-900" width="2900" height="3800" fill="${wall}"/>`;
  for (let r = 0; r < 18; r++) for (let c = 0; c < 12; c++) { const x = -900 + c * 260 + (r % 2) * 130, y = -900 + r * 130; s += `<rect x="${x + 6}" y="${y + 6}" width="248" height="118" rx="10" fill="${brick}"/>`; }
  s += `<rect x="-900" y="${FLOOR}" width="2900" height="1400" fill="${floor}"/><rect x="-900" y="${FLOOR}" width="2900" height="12" fill="#000" opacity=".35"/>`;
  return s;
}
function windowSky(x, y, w, h, tday, t) {   // tday: 0 noite .. 1 dia
  const sky = mix('#1A2448', '#9CC4EC', tday);
  let s = `<rect x="${x - 16}" y="${y - 16}" width="${w + 32}" height="${h + 32}" fill="#1A1C22"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${sky}"/>`;
  s += tday < .5 ? `<circle cx="${x + w * .65}" cy="${y + h * .35}" r="${f1(w * .14)}" fill="#EEF2FF" opacity="${op(1 - tday * 2)}"/>` : `<circle cx="${x + w * .35}" cy="${y + h * .4}" r="${f1(w * .18)}" fill="#FFE9A8" opacity="${op(tday * 2 - 1)}"/>`;
  for (let i = 1; i < 4; i++) s += `<rect x="${x + i * w / 4 - 7}" y="${y}" width="14" height="${h}" fill="#1A1C22"/>`;
  return s;
}
function bed(x, y, lift = 0, o = {}) {   // cama de perfil, alta; lift levanta o colchão pelo lado esquerdo
  let s = `<g transform="translate(${x},${y})">`;
  s += `<rect x="-330" y="-350" width="18" height="350" fill="#3A3E46" stroke="${OUTL}" stroke-width="3"/><rect x="312" y="-350" width="18" height="350" fill="#3A3E46" stroke="${OUTL}" stroke-width="3"/><rect x="-340" y="-360" width="680" height="30" fill="#4A4E58" stroke="${OUTL}" stroke-width="3"/><rect x="-330" y="-60" width="660" height="14" fill="#3A3E46" stroke="${OUTL}" stroke-width="3"/>`;
  if (o.under) s += o.under;
  s += `<g transform="rotate(${f1(lift)} 330 -360)"><rect x="-330" y="-432" width="660" height="76" rx="14" fill="#D8D2C4" stroke="${OUTL}" stroke-width="4"/>${Array.from({ length: 10 }, (_, i) => `<rect x="${-320 + i * 66}" y="-430" width="22" height="72" fill="#8EA4C0" opacity=".6"/>`).join('')}${o.pillow !== false ? `<ellipse cx="250" cy="-444" rx="80" ry="30" fill="#F0ECE2" stroke="${OUTL}" stroke-width="3"/>` : ''}${o.top || ''}</g>`;
  return s + '</g>';
}
function bars2(x0, x1, y0, y1, n = 7) {
  let o = ''; const st = (x1 - x0) / (n - 1);
  for (let i = 0; i < n; i++) o += `<rect x="${f1(x0 + i * st - 12)}" y="${y0}" width="24" height="${y1 - y0}" rx="8" fill="#2A2E38" stroke="${OUTL}" stroke-width="3"/><rect x="${f1(x0 + i * st - 6)}" y="${y0}" width="5" height="${y1 - y0}" fill="#8A9AB8" opacity=".5"/>`;
  return o + `<rect x="${x0 - 30}" y="${y0 + 60}" width="${x1 - x0 + 60}" height="24" fill="#2A2E38" stroke="${OUTL}" stroke-width="3"/><rect x="${x0 - 30}" y="${y1 - 200}" width="${x1 - x0 + 60}" height="24" fill="#2A2E38" stroke="${OUTL}" stroke-width="3"/>`;
}
// cabeça falsa = cópia da cabeça do preso, olhos fechados (b: 0 molde branco → 1 pintada → 2 com cabelo)
function dummyHead(x, y, s, b = 2, rot = 0) {
  const C = KIND.preso, skin = b < 1 ? mix('#EEEAE0', C.skin, b) : C.skin;
  let h = `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${s})">`;
  h += `<path d="M-58 -10 Q-62 -78 -4 -84 Q56 -84 62 -24 L66 2 L80 14 L64 22 Q66 50 40 62 Q0 72 -30 56 Q-62 40 -58 -10Z" fill="${skin}" stroke="${OUTL}" stroke-width="4"/>`;
  if (b > 0) h += `<g opacity="${op(Math.min(1, b))}"><ellipse cx="-14" cy="0" rx="13" ry="18" fill="${C.skinD}" stroke="${OUTL}" stroke-width="3"/><path d="M28 -10 Q37 -4 46 -10" stroke="${OUTL}" stroke-width="4" fill="none"/><path d="M24 -28 Q38 -34 52 -28" stroke="${C.hair}" stroke-width="6" fill="none"/><path d="M36 40 Q46 44 54 38" stroke="${OUTL}" stroke-width="3" fill="none"/></g>`;
  if (b > 1) h += `<path d="M-60 -6 Q-70 -92 6 -96 Q60 -96 62 -40 Q40 -64 6 -62 Q-30 -60 -40 -20 Q-46 -6 -60 -6Z" fill="${C.hair}" stroke="${OUTL}" stroke-width="4" opacity="${op(b - 1)}"/>`;
  return h + '</g>';
}
const blanketLump = (x, y, w = 520, c = '#6A7088') => `<path d="M${x - w / 2} ${y} Q${x - w / 2 + 40} ${y - 120} ${x - w / 4} ${y - 110} Q${x} ${y - 150} ${x + w / 4} ${y - 100} Q${x + w / 2} ${y - 90} ${x + w / 2} ${y}Z" fill="${c}" stroke="${OUTL}" stroke-width="4"/><path d="M${x - w / 2 + 30} ${y - 70} Q${x} ${y - 120} ${x + w / 2 - 30} ${y - 60}" stroke="#8A90A8" stroke-width="8" fill="none" opacity=".6"/>`;
const hangCoat = (x, y, s = .5, sw = 0) => coat(x, y, s, sw);

/* ---------- 1. escondendo a capa debaixo do colchão ---------- */
function s1(t) {
  const { L, d, k } = loc(t, 'n1'), [hx, hy] = HH(t);
  setCam(lerp(640, 600, easeInOut(k)) + hx, lerp(1080, 1140, k) + hy, lerp(1.35, .98, easeInOut(range(L, .2, 2.6))), 0, [540, 1100, 1]);
  const look = L < .45 ? 0 : L < 1.05 ? -1 : 0;   // olha para a porta, desconfiado
  const lift = easeInOut(range(L, 1.15, 1.6)) * (1 - easeInOut(range(L, 3.0, 3.5))) * 12;
  const push = easeInOut(range(L, 1.6, 2.9));
  let s = lay(.8, cellBack(t, .8) + windowSky(560, 300, 300, 220, 0, t) + `<path d="M560 300 L860 300 L760 ${FLOOR} L300 ${FLOOR}Z" fill="#BFD4FF" opacity=".08"/>`);
  s += lay(.8, bars2(-460, -60, 120, FLOOR, 4));
  s += lay(1, bed(880, FLOOR, lift));
  const held = push < .98 ? `<g transform="translate(${f1(push * 120)},${f1(push * 30)})">${foldedCoat(170, 50, lerp(-10, 0, push))}</g>` : '';
  s += lay(1, man({ x: 300, y: FLOOR, s: 1.0, drop: 210, lean: 22, legF: [85, -95], legB: [-10, 95], armF: [lerp(70, 88, push), lerp(30, 6, push)], armB: [lerp(60, 84, lift / 12), lerp(30, 6, lift / 12)], look, kind: 'preso', held }));
  // a ponta do colchão por cima da mão (dá a ideia de "debaixo")
  if (lift > 1) s += lay(1, `<g transform="translate(880,${FLOOR}) rotate(${f1(lift)} 330 -360)"><rect x="-330" y="-432" width="200" height="76" rx="14" fill="#D8D2C4" stroke="${OUTL}" stroke-width="4"/>${Array.from({ length: 3 }, (_, i) => `<rect x="${-320 + i * 66}" y="-430" width="22" height="72" fill="#8EA4C0" opacity=".6"/>`).join('')}</g>`);
  return s + VIG(.8) + GRAINV(t);
}
/* ---------- 2. o guarda vira as costas: ele pega uma capa do cabideiro ---------- */
function s2(t) {
  const { L, d, k } = loc(t, 'n2'), [hx, hy] = HH(t);
  setCam(lerp(520, 600, k) + hx, 1060 + hy, .78, 0, [540, 1060, 1]);
  let s = lay(.8, cellBack(t, .15) + `<rect x="-900" y="300" width="2900" height="60" fill="#3A3E46"/><text x="0" y="0"/>`);
  // cabideiro com 5 capas
  const grabbed = L > 2.1;
  let rack = `<rect x="-280" y="440" width="560" height="22" rx="8" fill="#6A5240" stroke="${OUTL}" stroke-width="3"/><rect x="-270" y="460" width="16" height="${FLOOR - 460}" fill="#5A4430" stroke="${OUTL}" stroke-width="3"/><rect x="254" y="460" width="16" height="${FLOOR - 460}" fill="#5A4430" stroke="${OUTL}" stroke-width="3"/>`;
  [-200, -100, 0, 100, 200].forEach((x, i) => { if (i === 4 && grabbed) return; rack += hangCoat(x, 820, .52, Math.sin(t * 1.5 + i) * 2); });
  s += lay(1, `<g transform="translate(0,0)">${rack}</g>`);
  // guarda: de frente para o cabideiro (esquerda), vira para a direita em 1.0–3.6 (algo chamou atenção), depois volta
  const away = L > 1.0 && L < 3.7;
  s += lay(1, man({ x: 1000, y: FLOOR, s: 1.0, kind: 'guarda', flip: away ? 1 : -1, armF: [-10, 10], armB: [-20, 20] }));
  if (away && L < 1.6) s += lay(1, `<g transform="translate(1180,620)" opacity="${op(range(L, 1.0, 1.15))}"><path d="M0 0 l40 -60 M30 10 l70 -30 M30 40 l80 0" stroke="#FFE08A" stroke-width="10" stroke-linecap="round"/></g>`);
  // preso: entra pela esquerda, pega a capa, esconde atrás, sai
  const inX = lerp(-500, 330, easeOut(range(L, .2, 1.9))), outX = lerp(330, -600, easeIn(range(L, 2.6, 4.2)));
  const px = L < 2.6 ? inX : outX, walking = (L > .2 && L < 1.9) || L > 2.6;
  const W = walkPose(L * 9, walking ? 1 : 0);
  const reach = range(L, 1.9, 2.1) * (1 - range(L, 2.2, 2.5));
  const held = L > 2.1 ? `<g transform="rotate(-20)">${foldedCoat(150, 48)}</g>` : '';
  s += lay(1, man({ x: px, y: FLOOR, s: 1.0, kind: 'preso', flip: L < 2.6 ? 1 : -1, ...W, armF: L > 2.1 ? [60, 60] : [lerp(-10, 120, reach), lerp(10, -10, reach)], held, look: (L > 1.9 && L < 2.6) ? -1 : 0 }));
  return s + VIG(.8) + GRAINV(t);
}
/* ---------- 3. noites passando: a pilha debaixo da cama cresce (contador) ---------- */
function s3(t) {
  const { L, d, k } = loc(t, 'n3'), [hx, hy] = HH(t);
  setCam(lerp(700, 760, k) + hx, lerp(1180, 1240, k) + hy, lerp(.9, 1.15, easeInOut(k)), 0, [540, 1100, 1]);
  const cyc = range(L, .2, d - .5), tday = .5 + .5 * Math.sin(cyc * Math.PI * 2 * 6 - Math.PI / 2), n = 1 + Math.floor(Math.pow(cyc, 1.3) * 49);
  let s = lay(.8, cellBack(t, 1 - tday * .7) + windowSky(220, 380, 300, 220, tday, t));
  let pile = ''; const rows = Math.min(8, Math.ceil(n / 6));
  for (let i = 0; i < n; i++) { const r = Math.floor(i / 6), c = i % 6; if (r > 7) break; pile += `<g transform="translate(${f1(-250 + c * 100 + (r % 2) * 30)},${f1(-80 - r * 30)})">${foldedCoat(150, 34, (i * 37) % 7 - 3)}</g>`; }
  s += lay(1, bed(820, FLOOR, 0, { under: pile }));
  s += lay(1, man({ x: 300, y: FLOOR, s: .95, drop: 210, lean: 30, legF: [85, -95], legB: [-10, 95], armF: [80 + 10 * Math.sin(L * 9), 10], armB: [60, 20], kind: 'preso', held: Math.sin(L * 9) > 0 ? foldedCoat(120, 34) : '' }));
  return s + VIG(.8) + counterBox(t, n, 'CAPAS', 1) + GRAINV(t);
}
/* ---------- 4. o cano quente cola as capas → vira um bote ---------- */
function s4(t) {
  const { L, d, k } = loc(t, 'n4'), [hx, hy] = HH(t);
  let s = '';
  if (L < 2.6) {
    setCam(540 + hx, 960 + hy, lerp(1.0, 1.15, L / 2.6), 0, [540, 960, 1]);
    s += `<rect width="1080" height="1920" fill="#1A1210"/><ellipse cx="540" cy="760" rx="900" ry="700" fill="url(#gRed)" opacity=".7"/>`;
    s += lay(1, `<rect x="-900" y="620" width="2900" height="110" fill="#8A5A3A" stroke="${OUTL}" stroke-width="5"/><rect x="-900" y="624" width="2900" height="26" fill="#C8845A"/><rect x="-900" y="620" width="2900" height="110" fill="#FF5A1A" opacity="${op(.25 + .1 * Math.sin(t * 6))}"/>${[100, 900].map(x => `<rect x="${x}" y="600" width="60" height="150" rx="10" fill="#6A4430" stroke="${OUTL}" stroke-width="4"/>`).join('')}` + steam(540, 620, t * 1.7, 5, '#F2F2F6', 1, 1.6));
    // duas capas encostam no cano e grudam
    const join = easeInOut(range(L, .3, 1.6));
    s += lay(1, coat(lerp(260, 400, join), 1180, .9, lerp(-12, 0, join)) + coat(lerp(820, 680, join), 1180, .9, lerp(12, 0, join)));
    const seam = range(L, 1.4, 2.2);
    if (seam > 0) s += lay(1, `<path d="M540 900 L540 1480" stroke="#FFB070" stroke-width="${f1(10 + 10 * Math.sin(t * 10))}" opacity="${op(seam)}" filter="url(#bl6)"/><path d="M540 900 L540 1480" stroke="#FFE2B0" stroke-width="4" opacity="${op(seam)}"/>`);
  } else {
    const L2 = L - 2.6, k2 = L2 / (d - 2.6);
    setCam(lerp(560, 600, k2) + hx, 1200 + hy, .85, 0, [540, 1200, 1]);
    s += lay(.8, cellBack(t, .8));
    // bote cinza de borracha inflando no chão; ele sopra por um tubo
    const inf = easeOut(range(L2, .1, 2.0));
    s += lay(1, `<g transform="translate(700,${FLOOR})"><ellipse cx="0" cy="-10" rx="${f1(420)}" ry="${f1(26 + 90 * inf)}" fill="#2E3C37" stroke="${OUTL}" stroke-width="5"/><ellipse cx="0" cy="${f1(-10 - 40 * inf)}" rx="300" ry="${f1(10 + 34 * inf)}" fill="#1E2824" opacity="${op(inf)}"/>${[-300, -150, 0, 150, 300].map(x => `<path d="M${x} ${f1(-10 - 90 * inf)} L${x} 0" stroke="#E8823A" stroke-width="3" opacity=".5"/>`).join('')}<path d="M-260 ${f1(-20 - 80 * inf)} Q0 ${f1(-40 - 100 * inf)} 260 ${f1(-20 - 80 * inf)}" stroke="#7E9A92" stroke-width="10" fill="none" opacity=".5"/></g>`);
    const puff = Math.sin(L2 * 8) > 0;
    s += lay(1, `<path d="M330 ${FLOOR - 40} Q420 ${FLOOR - 300} 300 ${FLOOR - 612}" stroke="#2A2E2C" stroke-width="16" fill="none" stroke-linecap="round"/>` + man({ x: 140, y: FLOOR, s: .95, drop: 210, lean: 18, legF: [85, -95], legB: [-10, 95], armF: [110, 60], armB: [100, 70], kind: 'preso', mouth: puff ? .8 : .2 }));
  }
  return s + VIG(.8) + GRAINV(t);
}
/* ---------- 5. barbearia: ele junta o cabelo do chão ---------- */
function s5(t) {
  const { L, d, k } = loc(t, 'n5'), [hx, hy] = HH(t);
  setCam(lerp(500, 620, k) + hx, 1100 + hy, .82, 0, [540, 1100, 1]);
  let s = lay(.8, `<rect x="-900" y="-900" width="2900" height="3800" fill="#C8CEC8"/><rect x="-900" y="500" width="2900" height="40" fill="#9AA6A0"/>${Array.from({ length: 40 }, (_, i) => `<rect x="${-900 + (i % 14) * 210}" y="${FLOOR + Math.floor(i / 14) * 210}" width="210" height="210" fill="${(i + Math.floor(i / 14)) % 2 ? '#2A2A30' : '#ECE8DE'}"/>`).join('')}<rect x="80" y="200" width="420" height="300" fill="#B8D0DA" stroke="${OUTL}" stroke-width="5"/>`);
  // cadeira + preso2 sentado + barbeiro cortando
  s += lay(1, `<g transform="translate(340,${FLOOR})"><rect x="-120" y="-420" width="40" height="300" fill="#7A1E1E" stroke="${OUTL}" stroke-width="4"/><rect x="-140" y="-140" width="300" height="60" rx="14" fill="#8A2424" stroke="${OUTL}" stroke-width="4"/><rect x="-10" y="-80" width="40" height="80" fill="#9A9AA0" stroke="${OUTL}" stroke-width="3"/><rect x="-90" y="-10" width="200" height="20" fill="#9A9AA0" stroke="${OUTL}" stroke-width="3"/></g>` + man({ x: 330, y: FLOOR - 80, s: .9, kind: 'preso2', drop: 120, legF: [85, -80], legB: [80, -80], armF: [40, 30], armB: [40, 30], shadow: 0 }));
  const snip = Math.abs(Math.sin(t * 9));
  s += lay(1, man({ x: 70, y: FLOOR, s: .95, kind: 'barbeiro', armF: [120, -30 + 10 * snip], armB: [90, -20], held: `<g transform="rotate(-30)"><path d="M0 0 L70 ${f1(-8 * snip)} M0 0 L70 ${f1(8 * snip)}" stroke="#C8CCD4" stroke-width="8" stroke-linecap="round"/><circle cx="-12" cy="-8" r="10" fill="none" stroke="#2A2A30" stroke-width="5"/><circle cx="-12" cy="8" r="10" fill="none" stroke="#2A2A30" stroke-width="5"/></g>` }));
  // fios de cabelo caindo e montinho no chão
  let h = ''; for (let i = 0; i < 26; i++) { const ph = (t * .9 + i * .21) % 1, x = 330 + Math.sin(i * 2.7) * 70, y = 640 + ph * (FLOOR - 640); h += `<path d="M${f1(x)} ${f1(y)} q10 6 18 -2" stroke="#2A1C14" stroke-width="5" fill="none" opacity="${op(1 - ph * .3)}"/>`; }
  const taken = L > 2.5;
  s += lay(1, h + (taken ? '' : `<path d="M560 ${FLOOR + 6} q30 -30 80 -10 q30 10 0 20 q-40 10 -80 -10Z" fill="#2A1C14" stroke="${OUTL}" stroke-width="3"/>`));
  // nosso preso entra varrendo, abaixa, pega o tufo, põe no bolso
  const px = lerp(1250, 760, easeOut(range(L, 0, 1.6))), crouch = easeInOut(range(L, 1.7, 2.3)) * (1 - easeInOut(range(L, 2.8, 3.3)));
  const W = walkPose(L * 9, L < 1.6 ? 1 : 0);
  s += lay(1, man({ x: px, y: FLOOR, s: 1.0, kind: 'preso', flip: -1, ...W, drop: 150 * crouch, lean: 35 * crouch, legF: crouch > .05 ? [70 * crouch, -110 * crouch] : W.legF, legB: crouch > .05 ? [-10, 60 * crouch] : W.legB, armF: L > 2.5 && L < 3.2 ? [10, -100] : [lerp(10, 110, crouch), 10], held: L > 2.3 && L < 3.0 ? `<path d="M-20 0 q20 -20 50 -6 q16 10 -6 14 q-24 6 -44 -8Z" fill="#2A1C14" stroke="${OUTL}" stroke-width="3"/>` : '', look: L > 1.6 && L < 2.0 ? -1 : 0 }));
  return s + VIG(.8) + GRAINV(t);
}
/* ---------- 6. a cabeça falsa: molda, pinta, cola cabelo, põe na cama e foge pelo buraco ---------- */
function s6(t) {
  const { L, d, k } = loc(t, 'n6'), [hx, hy] = HH(t);
  let s = '';
  if (L < 2.4) {   // close na mesa
    setCam(540 + hx, 980 + hy, lerp(1.1, 1.25, L / 2.4), 0, [540, 960, 1]);
    s += `<rect width="1080" height="1920" fill="#2E2A28"/><ellipse cx="540" cy="700" rx="800" ry="700" fill="url(#gWarm)" opacity=".6"/>`;
    s += lay(1, `<rect x="-900" y="1250" width="2900" height="900" fill="#5A4030" stroke="${OUTL}" stroke-width="5"/><g transform="translate(180,1240)"><rect x="-90" y="-70" width="180" height="80" rx="18" fill="#F2EEDC" stroke="${OUTL}" stroke-width="4"/></g><g transform="translate(900,1230)"><rect x="-70" y="-110" width="140" height="120" rx="22" fill="#F8F8F4" stroke="${OUTL}" stroke-width="4"/><circle cx="0" cy="-50" r="26" fill="#D8D8D0" stroke="${OUTL}" stroke-width="3"/></g><g transform="translate(250,1340)">${['#C83A3A', '#3A6AC8', '#E8C060'].map((c, i) => `<rect x="${i * 70}" y="-50" width="56" height="60" fill="${c}" stroke="${OUTL}" stroke-width="3"/>`).join('')}</g>`);
    const grow = easeOut(range(L, .0, .6)), b = range(L, .7, 1.4) + range(L, 1.5, 2.1);
    s += lay(1, `<g transform="translate(540,1180) scale(${f1(grow * 100) / 100})">${dummyHead(0, -90, 2.4, b)}</g>`);
    if (L > .7 && L < 1.4) s += lay(1, `<g transform="translate(${f1(560 + Math.sin(L * 14) * 60)},${f1(900 + Math.cos(L * 11) * 30)}) rotate(-40)"><rect x="-10" y="-360" width="20" height="340" rx="8" fill="#8A5A2A" stroke="${OUTL}" stroke-width="3"/><path d="M-12 -20 L12 -20 L4 26 L-4 26Z" fill="#C83A3A"/></g>`);
    if (L > 1.5 && L < 2.2) s += lay(1, `<g transform="translate(${f1(lerp(860, 600, range(L, 1.5, 1.9)))},${f1(lerp(700, 860, range(L, 1.5, 1.9)))})"><path d="M-40 0 q30 -40 90 -14 q30 16 -6 26 q-50 10 -84 -12Z" fill="#2A1C14" stroke="${OUTL}" stroke-width="3"/></g>`);
  } else {   // cela: coloca na cama, cobre, sai pelo buraco da ventilação
    const L2 = L - 2.4, k2 = L2 / (d - 2.4);
    setCam(lerp(760, 480, easeInOut(k2)) + hx, 1150 + hy, .8, 0, [540, 1150, 1]);
    s += lay(.8, cellBack(t, .85));
    const grill = easeInOut(range(L2, 1.6, 2.1));
    s += lay(.8, `<rect x="-120" y="${FLOOR - 330}" width="230" height="230" fill="#08080A" stroke="${OUTL}" stroke-width="5"/><g transform="translate(${f1(-120 - 260 * grill)},${f1(FLOOR - 330 + 200 * grill)}) rotate(${f1(-30 * grill)})"><rect width="230" height="230" fill="#5A606C" stroke="${OUTL}" stroke-width="5"/>${[1, 2, 3, 4, 5].map(i => `<rect x="20" y="${i * 36}" width="190" height="12" fill="#2A2E36"/>`).join('')}</g>`);
    const placed = easeInOut(range(L2, .2, .9)), covered = range(L2, .9, 1.3);
    let top = '';
    top += `<g opacity="${op(placed > .95 ? 1 : 0)}">${dummyHead(250, -470, .9, 2, 90)}</g>`;
    if (covered > 0) top += `<g opacity="${op(covered)}">${blanketLump(-30, -430, 500)}</g>`;
    s += lay(1, bed(780, FLOOR, 0, { top }));
    const px = L2 < 1.4 ? 1240 : lerp(1240, 60, easeInOut(range(L2, 1.4, 2.4)));
    const crawl = range(L2, 2.4, 3.4);
    if (crawl < 1) {
      const W = walkPose(L2 * 9, L2 > 1.4 && L2 < 2.2 ? 1 : 0);
      const held = placed < .95 ? `<g transform="rotate(90)">${dummyHead(0, 0, .8, 2)}</g>` : '';
      const pose = crawl > 0 ? { drop: 260, lean: 70, legF: [90, -100], legB: [60, -60], armF: [140, -20], armB: [130, -10] } : { ...W, armF: placed < .95 ? [lerp(60, 120, placed), 20] : (covered < 1 ? [100, 20] : W.armF) };
      s += lay(1, `<g opacity="${op(1 - range(crawl, .5, 1))}">${man({ x: px - crawl * 160, y: FLOOR, s: 1.0, kind: 'preso', flip: -1, ...pose, held })}</g>`);
    }
  }
  return s + VIG(.8) + GRAINV(t);
}
/* ---------- 7. a ronda: o guarda ilumina a cama e segue ---------- */
function s7(t) {
  const { L, d, k } = loc(t, 'n7'), [hx, hy] = HH(t);
  setCam(lerp(420, 640, easeInOut(k)) + hx, lerp(1120, 1180, k) + hy, lerp(.8, 1.0, easeInOut(range(L, 1.5, 3.5))), 0, [540, 1100, 1]);
  let s = lay(.8, cellBack(t, 1));
  const top = dummyHead(250, -470, .9, 2, 90) + blanketLump(-30, -430, 500);
  s += lay(1, bed(760, FLOOR, 0, { top }));
  s += lay(1, `<rect x="-900" y="-900" width="2900" height="3800" fill="#000" opacity=".55"/>`);
  // feixe da lanterna sobre a cama
  const g = loc(t, 'n7'), stop = L > 1.3 && L < 3.2, gx = L < 1.3 ? lerp(-500, 180, easeOut(range(L, 0, 1.3))) : L < 3.2 ? 180 : lerp(180, 1500, easeIn(range(L, 3.2, 4.6)));
  const beamOn = range(L, .8, 1.3) * (1 - range(L, 3.2, 3.5));
  s += lay(1, `<path d="M${f1(gx + 130)} ${FLOOR - 560} L1300 ${FLOOR - 520} L1300 ${FLOOR - 120} Z" fill="#FFF4D0" opacity="${op(.25 * beamOn)}" filter="url(#bl6)"/><ellipse cx="1010" cy="${FLOOR - 300}" rx="300" ry="170" fill="#FFF4D0" opacity="${op(.35 * beamOn)}" filter="url(#b30)"/>`);
  s += lay(1, bars2(-200, 1400, 60, FLOOR + 40, 10));
  const W = walkPose(L * 8, stop ? 0 : 1), nod = stop ? Math.max(0, Math.sin((L - 2.2) * 9)) * (L > 2.2 && L < 2.8 ? 1 : 0) : 0;
  s += lay(1.15, man({ x: gx, y: FLOOR + 240, s: 1.15, kind: 'guarda', flip: 1, ...W, lean: nod * 6, armF: stop ? [80, 10] : [60, 10], held: `<g><rect x="-10" y="-14" width="70" height="28" rx="6" fill="#3A3A40" stroke="${OUTL}" stroke-width="3"/><circle cx="64" cy="0" r="12" fill="#FFF4D0"/></g>` }));
  return s + VIG(.9) + GRAINV(t);
}
/* ---------- 8. telhado e baía: os três fogem no bote ---------- */
function s8(t) {
  const { L, d, k } = loc(t, 'n8'), [hx, hy] = HH(t);
  let s = '';
  if (L < 2.4) {
    setCam(lerp(380, 700, L / 2.4) + hx, 1100 + hy, .78, 0, [540, 1100, 1]);
    s += lay(.05, `<rect x="-900" y="-900" width="2900" height="3800" fill="url(#skyN)"/>`) + lay(.2, `<g opacity=".8">${Array.from({ length: 60 }, (_, i) => `<circle cx="${-700 + i * 44}" cy="${1150 + (i % 4) * 6}" r="${3 + i % 3}" fill="#FFD890"/>`).join('')}</g>`);
    s += lay(.5, lighthouseBeam(1300, 520, t, 2000, .9) + `<rect x="1276" y="520" width="48" height="1000" fill="#C8CCD4" stroke="${OUTL}" stroke-width="4"/>`);
    s += lay(1, `<path d="M-900 ${FLOOR} L2000 ${FLOOR} L2000 3000 L-900 3000Z" fill="#262A34"/><rect x="-900" y="${FLOOR - 16}" width="2900" height="20" fill="#3A3E4A" stroke="${OUTL}" stroke-width="3"/>`);
    // três correndo carregando o bote enrolado
    const base = lerp(-500, 1200, L / 2.4);
    ['preso3', 'preso2', 'preso'].forEach((kd, i) => { const W = walkPose(L * 11 + i * 2, 1.2); s += lay(1, man({ x: base - i * 230, y: FLOOR, s: .9, kind: kd, ...W, lean: 10, armF: [165, 10], armB: [155, 20] })); });
    s += lay(1, `<g transform="translate(${f1(base - 230)},${f1(FLOOR - 1010 + Math.sin(L * 11) * 6)})"><rect x="-340" y="-55" width="680" height="110" rx="55" fill="#2E3C37" stroke="${OUTL}" stroke-width="5"/>${[-240, -120, 0, 120, 240].map(x => `<path d="M${x} -55 L${x} 55" stroke="#141A18" stroke-width="4"/>`).join('')}<path d="M-300 -30 L300 -30" stroke="#7E9A92" stroke-width="8" opacity=".5"/></g>`);
  } else {
    const L2 = L - 2.4, k2 = L2 / (d - 2.4);
    setCam(540 + hx, lerp(1150, 1000, k2) + hy, lerp(.9, .75, k2), 0, [540, 1100, 1]);
    s += lay(.05, `<rect x="-900" y="-900" width="2900" height="3800" fill="url(#skyN)"/><circle cx="260" cy="420" r="150" fill="url(#gMoon)"/><circle cx="260" cy="420" r="42" fill="#EEF2FF"/>`);
    s += lay(.3, islandArt(t).replace('<g transform="translate(540,1180)">', '<g transform="translate(260,1000) scale(.55)">'));
    s += lay(.6, waterArt(1060, t));
    const rx = lerp(560, 760, easeIn(k2)), ry = lerp(1500, 1180, easeIn(k2)), rs = lerp(1.0, .45, easeIn(k2));
    let crew = ''; ['preso', 'preso2', 'preso3'].forEach((kd, i) => { const pd = Math.sin(t * 5 + i * 2); crew += man({ x: (i - 1) * 210, y: -40, s: .55, kind: kd, drop: 230, legF: [85, -80], legB: [80, -80], armF: [60 + 40 * pd, 30], armB: [50 + 40 * pd, 30], shadow: 0, held: `<rect x="-6" y="-120" width="12" height="240" fill="#6A4A2A" stroke="${OUTL}" stroke-width="3" transform="rotate(${f1(20 + 20 * pd)})"/>` }); });
    s += lay(.8, `<g transform="translate(${f1(rx)},${f1(ry)}) scale(${f1(rs * 100) / 100})">${crew}<ellipse cx="0" cy="-20" rx="380" ry="60" fill="#2E3C37" stroke="${OUTL}" stroke-width="6"/><ellipse cx="0" cy="-34" rx="300" ry="30" fill="#1E2824"/></g>`);
    s += lay(1, fogArt(t * 1.4, lerp(1300, 1150, k2), lerp(1, 3, k2)));
  }
  return s + VIG(.8) + GRAINV(t);
}
/* ---------- 9. de manhã: a cabeça rola no chão; alarme ---------- */
function s9(t) {
  const { L, d, k } = loc(t, 'n9'), [hx, hy] = HH(t);
  let s = '';
  if (L < 3.8) {
    setCam(lerp(620, 860, easeInOut(range(L, 1.2, 3.0))) + hx, lerp(1150, 1300, easeInOut(range(L, 1.2, 3.0))) + hy, lerp(.82, 1.05, easeInOut(range(L, 1.2, 3.2))), 0, [540, 1150, 1]);
    const alarm = L > 2.4 ? (Math.sin(t * 14) > 0 ? 1 : 0) : 0;
    s += lay(.8, cellBack(t, .1) + windowSky(160, 380, 300, 220, 1, t) + `<path d="M160 380 L460 380 L700 ${FLOOR} L300 ${FLOOR}Z" fill="#FFE9A8" opacity=".14"/>`);
    // cabeça rola do travesseiro para o chão
    const roll = range(L, 1.3, 2.3), hx2 = lerp(1030, 1120, roll), hy2 = roll < .5 ? lerp(FLOOR - 470, FLOOR - 70, easeIn(roll * 2)) : FLOOR - 70 - Math.abs(Math.sin((roll - .5) * 2 * Math.PI)) * 60 * (1 - roll);
    const pulled = L > 1.2;
    const top = (roll > 0 ? '' : dummyHead(250, -470, .9, 2, 90)) + (pulled ? '' : blanketLump(-30, -430, 500));
    s += lay(1, bed(780, FLOOR, 0, { top }));
    if (roll > 0) s += lay(1, dummyHead(hx2, hy2, .9, 2, 90 + roll * 360));
    // guarda puxa o cobertor e pula de susto
    const pull = range(L, .9, 1.4), jump = range(L, 2.2, 2.6);
    s += lay(1, man({ x: lerp(560, 440, jump), y: FLOOR - Math.sin(jump * Math.PI) * 60, s: 1.0, kind: 'guarda', flip: 1, armF: [lerp(70, 110, pull), lerp(20, -10, pull)], armB: jump > 0 ? [150, -30] : [-10, 10], lean: -12 * jump, mouth: jump > 0 ? 1 : 0, held: pulled ? `<g transform="rotate(30)"><path d="M-20 0 Q60 -40 140 10 Q120 120 40 160 Q-10 80 -20 0Z" fill="#6A7088" stroke="${OUTL}" stroke-width="4"/></g>` : '' }));
    if (alarm) s += `<rect width="1080" height="1920" fill="#FF2020" opacity=".18"/>`;
    s += lay(.8, `<g transform="translate(980,260)"><rect x="-60" y="-20" width="120" height="50" fill="#3A3A40" stroke="${OUTL}" stroke-width="4"/><path d="M-50 -20 Q0 -90 50 -20Z" fill="${alarm ? '#FF3A2A' : '#7A2A22'}" stroke="${OUTL}" stroke-width="4"/>${alarm ? `<circle cx="0" cy="-40" r="160" fill="#FF3A2A" opacity=".35" filter="url(#b30)"/>` : ''}</g>`);
  } else {   // baía vazia ao amanhecer, neblina
    const L2 = L - 3.8, k2 = L2 / (d - 3.8);
    setCam(540, lerp(1000, 960, k2), lerp(.9, .95, k2), 0, [540, 1000, 1]);
    s += lay(.05, `<rect x="-900" y="-900" width="2900" height="3800" fill="#A8B4C4"/><circle cx="800" cy="900" r="220" fill="#FFE2B0" opacity=".5" filter="url(#b30)"/>`) + lay(.5, waterArt(1000, t).replace('#0C1626', '#5A6A80')) + lay(1, fogArt(t, 1050, 3));
  }
  return s + VIG(.8) + GRAINV(t);
}
const FN = { n1: s1, n2: s2, n3: s3, n4: s4, n5: s5, n6: s6, n7: s7, n8: s8, n9: s9 };
function frame(t) {
  D = []; uid = 0;
  const sh = shotAt(t);
  let body = FN[sh[0]](t);
  for (const c of SH.slice(1)) if (t >= c[1] && t < c[1] + .08) body += `<rect width="1080" height="1920" fill="#fff" opacity="${op(.2 * (1 - (t - c[1]) / .08))}"/>`;
  defsEl.innerHTML = STATIC + objDefs() + `<radialGradient id="lampG"><stop offset="0" stop-color="#FFF4D0" stop-opacity="1"/><stop offset=".3" stop-color="#FFE0A0" stop-opacity=".45"/><stop offset="1" stop-color="#FFD080" stop-opacity="0"/></radialGradient><filter id="bl6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>` + D.join('');
  root.innerHTML = body;
}
