/* ===================== mãos vetorizadas de fotos reais ===================== */
const MAOS = window.MAOS;
const HANCH = { pinca: [560, 1150], aberta: [665, 480] };
const handDefs = () => `<linearGradient id="slvG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7A8CA6"/><stop offset=".55" stop-color="#4E5E78"/><stop offset="1" stop-color="#2C3848"/></linearGradient>` + Object.keys(MAOS).map(k => `<g id="H_${k}">${MAOS[k].skin}${MAOS[k].sleeve}</g>`).join('');
// (x,y) = ponto da pinça/palma; rot gira o braço; flip espelha
function vhand(type, x, y, s, rot = 0, flip = 1, dark = 0) {
  const [ax, ay] = HANCH[type];
  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${f1(s * flip * 1000) / 1000},${f1(s * 1000) / 1000}) translate(${-ax},${-ay})"><use href="#H_${type}"/>${dark ? `<use href="#H_${type}" opacity="${op(dark)}" filter="url(#toBlack)"/>` : ''}</g>`;
}
/* ===================== objetos de Alcatraz ===================== */
const RUB = '#2C3532', RUBD = '#1A201E', RUBL = '#7E9A92';
function coat(x, y, s, rot = 0, k = 0, col = RUB) {   // capa de chuva estendida (borracha brilhante)
  const cd = mix(col, '#000000', .35);
  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${f1(s * 1000) / 1000})">
  <path d="M-70 -300 Q0 -340 70 -300 L120 -250 L230 -120 Q250 -90 220 -70 L150 -130 L170 300 Q0 330 -170 300 L-150 -130 L-220 -70 Q-250 -90 -230 -120 L-120 -250Z" fill="${col}"/>
  <path d="M-70 -300 Q0 -250 70 -300 Q60 -360 0 -370 Q-60 -360 -70 -300Z" fill="${cd}"/>
  <path d="M0 -290 L0 310" stroke="${cd}" stroke-width="8"/>${[-200, -110, -20, 70, 160].map(yy => `<circle cx="22" cy="${yy}" r="10" fill="${cd}"/>`).join('')}
  <path d="M-120 -200 Q-150 0 -120 260" stroke="${RUBL}" stroke-width="14" fill="none" opacity=".45" stroke-linecap="round"/><path d="M90 -180 Q110 -40 100 120" stroke="${RUBL}" stroke-width="8" fill="none" opacity=".3" stroke-linecap="round"/></g>`;
}
function island(x, y, s, t, light = 1) {
  const rock = '#1A1E26', bld = '#2A2E38', win = '#FFD58A';
  let o = `<g transform="translate(${x},${y}) scale(${s})">`;
  o += `<path d="M-620 120 Q-560 -40 -420 -80 L-300 -120 Q-100 -170 100 -150 L340 -120 Q520 -80 600 40 L640 120Z" fill="${rock}"/>`;
  o += `<rect x="-380" y="-330" width="620" height="200" fill="${bld}"/><path d="M-390 -330 L250 -330 L230 -360 L-370 -360Z" fill="#20242C"/>`;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 18; c++) o += `<rect x="${-360 + c * 33}" y="${-310 + r * 60}" width="16" height="34" fill="${win}" opacity="${op(((r * 7 + c * 3) % 5 < 2 ? .85 : .2) * light)}"/>`;
  o += `<rect x="300" y="-460" width="40" height="320" fill="#262A34"/><path d="M290 -470 L350 -470 L340 -500 L300 -500Z" fill="#262A34"/><circle cx="320" cy="-482" r="14" fill="#FFF4C8"/>`;
  const a = t * 1.6 % (Math.PI * 2), dx = Math.cos(a), w = Math.abs(Math.sin(a));
  o += `<path d="M320 -482 L${f1(320 + dx * 1600)} ${f1(-482 - 260 * w)} L${f1(320 + dx * 1600)} ${f1(-482 + 260 * w)}Z" fill="url(#beamS)" opacity="${op(.5 * (.3 + .7 * w))}"/>`;
  o += `<g transform="translate(-520,-160)"><rect x="-6" y="-160" width="12" height="160" fill="#262A34"/><rect x="40" y="-160" width="12" height="160" fill="#262A34"/><ellipse cx="23" cy="-180" rx="60" ry="40" fill="#262A34"/></g>`;
  return o + '</g>';
}
function water(y0, t, col = '#0B1626', k = 1) {
  let o = `<rect x="-800" y="${y0}" width="2700" height="2000" fill="${col}"/>`;
  for (let i = 0; i < 26; i++) { const yy = y0 + 20 + i * i * 2.4, ph = t * (1 + i * .05) + i; o += `<path d="M-800 ${f1(yy)} ${Array.from({ length: 30 }, (_, j) => `Q${-800 + j * 100 + 50} ${f1(yy + Math.sin(ph + j) * (3 + i * .5))} ${-700 + j * 100} ${f1(yy)}`).join(' ')}" stroke="#5A7AA8" stroke-width="${1 + i * .1}" fill="none" opacity="${op(.25 * k)}"/>`; }
  return o;
}
function fog(t, y0 = 900, k = 1) {
  let o = ''; for (let i = 0; i < 9; i++) { const x = ((i * 380 + t * (30 + i * 8)) % 2400) - 700; o += `<ellipse cx="${f1(x)}" cy="${f1(y0 + (i % 3) * 140)}" rx="${420 + (i % 4) * 90}" ry="${90 + (i % 3) * 30}" fill="#C8D4E4" opacity="${op(.12 * k)}" filter="url(#b30)"/>`; }
  return o;
}
function cellBg(t, warm = 1) {
  let s = `<rect x="-600" y="-600" width="2300" height="3200" fill="${mix('#1A1A22', '#3A2E24', warm * .5)}"/>`;
  for (let r = 0; r < 16; r++) s += `<rect x="-600" y="${-600 + r * 160}" width="2300" height="8" fill="#000" opacity=".25"/>`;
  return s;
}
function bed(x, y, s, t, dummy = 0, light = 0) {
  let o = `<g transform="translate(${x},${y}) scale(${s})"><rect x="-420" y="-40" width="840" height="60" fill="#3A3A40"/><rect x="-420" y="20" width="20" height="200" fill="#2A2A30"/><rect x="400" y="20" width="20" height="200" fill="#2A2A30"/>
  <path d="M-400 -40 Q-300 -170 -100 -150 Q200 -170 400 -120 L400 -40Z" fill="#5A6070"/><path d="M-200 -150 Q100 -190 400 -130" stroke="#7A8090" stroke-width="10" fill="none"/>
  <ellipse cx="-310" cy="-80" rx="110" ry="50" fill="#D8D4CC"/>`;
  if (dummy) o += `<g transform="translate(-300,-140)">${dummyHead(0, 0, .55, 1)}</g>`;
  return o + '</g>';
}
function dummyHead(x, y, s, done = 1, hair = 1, paint = 1) {
  return `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="0" rx="120" ry="150" fill="#E2C2A2"/><ellipse cx="-30" cy="-30" rx="60" ry="80" fill="#fff" opacity=".18"/>
  ${paint ? `<path d="M-70 0 Q-45 -14 -20 0 M20 0 Q45 -14 70 0" stroke="#3A2418" stroke-width="10" fill="none" stroke-linecap="round" opacity="${op(paint)}"/><path d="M-10 30 Q0 60 14 40" stroke="#B88A6A" stroke-width="8" fill="none" opacity="${op(paint)}"/><path d="M-40 90 Q0 104 40 90" stroke="#9A5A4A" stroke-width="9" fill="none" opacity="${op(paint)}"/>` : ''}
  ${hair ? `<path d="M-130 -20 Q-140 -170 0 -170 Q140 -170 130 -20 Q110 -110 0 -120 Q-110 -110 -130 -20Z" fill="#3A2614" opacity="${op(hair)}"/>${Array.from({ length: 14 }, (_, i) => `<path d="M${-110 + i * 16} -120 q8 -40 ${10 + (i % 3) * 4} -54" stroke="#2A1A0C" stroke-width="5" fill="none" opacity="${op(hair)}"/>`).join('')}` : ''}</g>`;
}
function pipe(y, t, hot = 1) {
  return `<rect x="-600" y="${y - 40}" width="2300" height="80" fill="#5A4A3C"/><rect x="-600" y="${y - 40}" width="2300" height="18" fill="#8A6A50"/><rect x="-600" y="${y + 24}" width="2300" height="16" fill="#3A2E24"/>${[0, 400, 800].map(x => `<rect x="${x}" y="${y - 54}" width="40" height="108" rx="6" fill="#4A3C30"/>`).join('')}<rect x="-600" y="${y - 40}" width="2300" height="80" fill="#FF6A2A" opacity="${op(.15 * hot)}"/>` + steam(300, y - 40, t * 1.6, 4, '#E8E8F0', 1, 1.2) + steam(700, y - 40, t * 1.6 + .4, 3, '#E8E8F0', .8, 1);
}
function raftShape(x, y, s, rot = 0, fill = 1) {
  return `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s}, ${f1(s * (.4 + .6 * fill) * 1000) / 1000})"><ellipse cx="0" cy="0" rx="300" ry="110" fill="${RUB}"/><ellipse cx="0" cy="-10" rx="230" ry="62" fill="${RUBD}"/><ellipse cx="-80" cy="-70" rx="140" ry="18" fill="${RUBL}" opacity=".35"/>${[-200, -100, 0, 100, 200].map(xx => `<path d="M${xx} -100 Q${xx + 10} 0 ${xx} 100" stroke="#121614" stroke-width="5" fill="none" opacity=".6"/>`).join('')}</g>`;
}
function guard(x, y, s, t, walk = 1, lightOn = true, flip = 1) {
  return sil({ x, y, s, kind: 'soldado', ph: t * 4.2, walk, flip, col: '#0A0C14', rim: '#BFD4FF', rimK: [1, -.3], light: lightOn, shadow: .3 });
}

/* ===================== planos (curtos) ===================== */
const B = k => T(k) - .05;
const SH = [
  ['coat', 0, 1.9], ['island', 1.9, 3.8], ['pile', 3.8, B('b2')],
  ['grab', B('b2'), B('b2') + 2.4], ['tower', B('b2') + 2.4, B('b3')],
  ['pipe', B('b3'), B('b3') + 2.0], ['seam', B('b3') + 2.0, B('b3') + 3.9], ['raft', B('b3') + 3.9, B('b4')],
  ['hair', B('b4'), B('b4') + 2.4], ['head', B('b4') + 2.4, B('b5')],
  ['patrol', B('b5'), B('b5') + 2.4], ['beds', B('b5') + 2.4, B('b6')],
  ['roof', B('b6'), B('b6') + 2.3], ['launch', B('b6') + 2.3, B('b6') + 4.5], ['bay', B('b6') + 4.5, TOTAL]];
const shotAt = t => SH.find(s => t >= s[1] && t < s[2]) || SH[SH.length - 1];
const loc = (t, id) => { const s = SH.find(x => x[0] === id); return { L: t - s[1], d: s[2] - s[1], k: (t - s[1]) / (s[2] - s[1]) }; };
const GRAINV = t => { const j = Math.floor(t * 24); return `<rect x="-200" y="-200" width="1480" height="2320" fill="url(#noiseP)" opacity=".06" transform="translate(${(j * 37) % 200 - 100},${(j * 53) % 200 - 100})"/>`; };

function sCoat(t) {   // gancho: capa sendo enfiada debaixo do colchão
  const { L, d, k } = loc(t, 'coat');
  setCam(lerp(500, 580, k), lerp(1000, 940, k), lerp(1.3, 1.05, easeOut(k)), lerp(-3, 2, k), [540, 960, 1]);
  let s = lay(.5, cellBg(t) + `<ellipse cx="300" cy="500" rx="700" ry="600" fill="url(#gWarm)" opacity=".5"/>` + bars(-300, 1400, -200, 2000, 8, '#14141A', '#7A7A90'));
  s += lay(1, `<rect x="-300" y="1200" width="1700" height="140" fill="#5A6070"/><rect x="-300" y="1330" width="1700" height="40" fill="#3A3A40"/><path d="M-300 1200 Q500 ${f1(1120 - 60 * Math.sin(L * 6))} 1400 1200Z" fill="#6A7080"/>`);
  const push = easeInOut(range(L, .1, 1.5));
  s += lay(1, coat(lerp(560, 520, push), lerp(980, 1230, push), lerp(1.05, .8, push), lerp(-20, 85, push)) + vhand('pinca', lerp(700, 660, push), lerp(1010, 1180, push), .55, lerp(-10, 10, push)) + vhand('pinca', lerp(400, 420, push), lerp(1000, 1170, push), .55, lerp(10, -10, push), -1));
  return s + VIG() + GRAINV(t);
}
function sIsland(t) {
  const { L, d, k } = loc(t, 'island');
  setCam(lerp(380, 640, k), lerp(980, 900, k), lerp(.8, 1.15, easeInOut(k)), lerp(2, -2, k), [540, 960, 1]);
  let s = lay(.05, `<rect x="-800" y="-800" width="2700" height="3600" fill="url(#skyN)"/><circle cx="880" cy="380" r="140" fill="url(#gMoon)"/><circle cx="880" cy="380" r="40" fill="#EEF2FF"/>`);
  s += lay(.3, `<g opacity=".7">${Array.from({ length: 40 }, (_, i) => `<circle cx="${-400 + i * 52}" cy="${880 + (i % 4) * 8}" r="${3 + i % 3}" fill="#FFD890"/>`).join('')}</g>`);
  s += lay(.5, water(940, t));
  s += lay(.7, island(540, 1080, 1.0, t));
  s += lay(1, fog(t, 1000, 1.2));
  return s + VIG() + GRAINV(t);
}
function sPile(t) {   // capas se acumulando (contagem rápida)
  const { L, d, k } = loc(t, 'pile');
  setCam(540, lerp(1150, 1050, k), lerp(1.0, 1.2, easeOut(k)), lerp(-1.5, 1.5, Math.sin(L * 2)), [540, 1100, 1]);
  let s = lay(.4, cellBg(t) + `<ellipse cx="540" cy="700" rx="700" ry="500" fill="url(#gWarm)" opacity=".5"/>`) + lay(1, `<rect x="-400" y="1350" width="1900" height="900" fill="#2A2420"/>`);
  const n = Math.floor(easeOut(range(L, 0, d - .2)) * 26);
  let p = '';
  for (let i = 0; i < n + 1; i++) { const r = ((i * 7919) % 100) / 100, land = i < n ? 1 : easeIn((L * 14) % 1), y = lerp(-200, 1420 - Math.floor(i / 3) * 34, land); p += coat(420 + r * 260 + (i % 3 - 1) * 90, y, .5, (r - .5) * 150, 0, mix(RUB, ['#3A2A22', '#2A3440', '#3A3A2A'][i % 3], .5)); }
  s += lay(1, p);
  return s + VIG() + GRAINV(t);
}
function sGrab(t) {   // pegando uma capa do cabide enquanto o guarda vira
  const { L, d, k } = loc(t, 'grab');
  setCam(lerp(460, 640, easeInOut(k)), 1000, lerp(1.1, 1.25, k), lerp(-2, 2, k), [540, 1000, 1]);
  let s = lay(.4, `<rect x="-600" y="-600" width="2300" height="3200" fill="#3A3E46"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${-600 + i * 200}" y="-600" width="190" height="3200" fill="#40444C"/>`).join('')}`);
  s += lay(.8, `<rect x="-600" y="1500" width="2300" height="900" fill="#2A2C32"/><rect x="-200" y="560" width="1500" height="22" fill="#5A4A3C"/>` + [0, 1, 2, 3].map(i => { const gone = i === 2 && L > 1.2; return gone ? '' : coat(80 + i * 230, 900, .5, Math.sin(t * 2 + i) * 4, 0, mix(RUB, '#3A2A22', i * .2)); }).join(''));
  const gr = easeInOut(range(L, 1.0, 1.6));
  s += lay(1, sil({ x: lerp(620, 900, gr), y: 1640, s: .78, kind: 'homem', flip: -1, ph: L * 5, walk: .8, lean: -6, col: '#3A4658', rim: '#FFC88A', rimK: [-1, -.3], armF: [-160 + 120 * gr, -10] }) + (gr > 0 ? coat(lerp(540, 980, gr), lerp(900, 1240, gr), .42, 40 * gr) : ''));
  s += lay(1.2, `<g filter="url(#b4)">${guard(lerp(1150, 1320, k), 1900, 1.1, t, .9, false, -1)}</g>`);
  return s + VIG() + GRAINV(t);
}
function sTower(t) {
  const { L, d, k } = loc(t, 'tower');
  setCam(lerp(600, 480, k), lerp(820, 900, k), lerp(1.25, 1.05, easeOut(k)), lerp(3, -2, k), [540, 900, 1]);
  let s = lay(.05, `<rect x="-800" y="-800" width="2700" height="3600" fill="url(#skyN)"/>`) + lay(.6, fog(t, 700, 1.4));
  const a = Math.sin(t * 1.1) * 40;
  s += lay(1, `<g transform="translate(540,1900)"><path d="M-160 0 L-90 -900 L90 -900 L160 0" stroke="#14161E" stroke-width="30" fill="none"/><path d="M-130 -200 L120 -500 M130 -200 L-120 -500 M-110 -560 L100 -840 M110 -560 L-100 -840" stroke="#14161E" stroke-width="14"/><rect x="-230" y="-1160" width="460" height="260" fill="#1A1C24"/><rect x="-200" y="-1130" width="400" height="120" fill="#FFE6B0" opacity=".55"/><path d="M-260 -1160 L0 -1260 L260 -1160Z" fill="#1A1C24"/>
  <g transform="translate(150,-1040) rotate(${f1(160 + a)})"><path d="M0 -20 L1700 -300 L1700 300 L0 20Z" fill="url(#beamS)" opacity=".55"/></g></g>`);
  const gh = Math.sin(t * 1.1) * 30; s += lay(1, `<g transform="translate(${f1(520 + gh)},890)"><path d="M-70 0 Q-70 -60 0 -66 Q70 -60 70 0Z" fill="#0A0C14"/><ellipse cx="0" cy="-96" rx="30" ry="34" fill="#0A0C14"/><path d="M-46 -112 Q0 -150 46 -112 L52 -104 L-56 -104Z" fill="#0A0C14"/></g>`);
  return s + VIG() + GRAINV(t);
}
function sPipe(t) {   // noite: a capa encostada no cano quente
  const { L, d, k } = loc(t, 'pipe');
  setCam(lerp(520, 580, k), lerp(980, 900, k), lerp(1.05, 1.35, easeInOut(k)), lerp(-2, 3, k), [540, 960, 1]);
  let s = lay(.5, `<rect x="-600" y="-600" width="2300" height="3200" fill="#120E10"/><ellipse cx="540" cy="900" rx="800" ry="700" fill="url(#gRed)" opacity=".6"/>`);
  s += lay(1, pipe(820, t) + coat(560, 1150, .75, -8 + Math.sin(t * 3) * 2) + vhand('pinca', 700, 860 + Math.sin(t * 6) * 10, .5, 0) + vhand('pinca', 420, 870 + Math.cos(t * 6) * 10, .5, 0, -1));
  return s + VIG() + GRAINV(t);
}
function sSeam(t) {   // close: borracha derretendo, colando
  const { L, d, k } = loc(t, 'seam');
  setCam(540, 960, lerp(1.2, 1.55, easeIn(k)), lerp(4, -4, k), [540, 960, 1]);
  let s = `<rect width="1080" height="1920" fill="#14100E"/>`;
  const press = easeInOut(range(L, .2, 1.2));
  s += lay(1, `<ellipse cx="540" cy="960" rx="700" ry="700" fill="url(#gRed)" opacity=".55"/><path d="M-200 600 L${f1(560 - 40 * press)} 600 L${f1(560 - 40 * press)} 1400 L-200 1400Z" fill="${RUB}"/><path d="M${f1(520 + 40 * press)} 640 L1300 640 L1300 1440 L${f1(520 + 40 * press)} 1440Z" fill="${mix(RUB, '#3A3A2A', .4)}"/>
    <path d="M${f1(540)} 620 L540 1420" stroke="#FFB070" stroke-width="${f1(10 + 18 * press)}" opacity="${op(.25 + .4 * Math.sin(t * 9) ** 2)}"/>
    ${Array.from({ length: 8 }, (_, i) => `<ellipse cx="${540 + Math.sin(i * 2) * 14}" cy="${f1(680 + i * 100 + Math.sin(t * 4 + i) * 6)}" rx="${f1(10 + 10 * press)}" ry="${f1(14 + 6 * press)}" fill="#1A1E1C" stroke="#8AAA9A" stroke-width="2" opacity=".9"/>`).join('')}
    <path d="M-200 600 L1300 600" stroke="${RUBL}" stroke-width="10" opacity=".3"/>` + steam(540, 600, t * 1.8, 4, '#E8E8F0', 1, 1.4));
  return s + VIG(1.2) + GRAINV(t);
}
function sRaft(t) {   // o bote tomando forma, escondido
  const { L, d, k } = loc(t, 'raft');
  setCam(lerp(600, 480, k), lerp(1100, 1060, k), lerp(1.0, 1.2, easeInOut(k)), Math.sin(L * 3) * 2, [540, 1080, 1]);
  let s = lay(.5, cellBg(t, .3) + `<ellipse cx="540" cy="900" rx="700" ry="500" fill="url(#gWarm)" opacity=".35"/>`);
  s += lay(1, `<rect x="-400" y="1350" width="1900" height="900" fill="#1E1A18"/>` + raftShape(540, 1300, 1.25, Math.sin(t * 2) * 2, easeOut(range(L, 0, 1.4))));
  s += lay(1, sil({ x: 160, y: 1500, s: .6, kind: 'homem', sit: 1, flip: 1, lean: 16 + Math.sin(t * 5) * 5, col: '#2A2420', rim: '#FFC88A', rimK: [1, -.3], armF: [-70 - Math.sin(t * 5) * 20, -20], armB: [-60, -30] }) + sil({ x: 930, y: 1500, s: .6, kind: 'homem', sit: 1, flip: -1, lean: 14 + Math.cos(t * 5) * 5, col: '#2A2420', rim: '#FFC88A', rimK: [-1, -.3], armF: [-70 - Math.cos(t * 5) * 20, -20], armB: [-60, -30] }));
  return s + VIG() + GRAINV(t);
}
function sHair(t) {   // barbearia: cabelo caindo, mão juntando
  const { L, d, k } = loc(t, 'hair');
  setCam(lerp(540, 600, k), lerp(900, 1100, easeInOut(k)), lerp(1.1, 1.3, k), lerp(-3, 2, k), [540, 1000, 1]);
  let s = lay(.4, `<rect x="-600" y="-600" width="2300" height="3200" fill="#D8D2C2"/>${Array.from({ length: 30 }, (_, i) => `<rect x="${-600 + (i % 10) * 240}" y="${1300 + Math.floor(i / 10) * 240}" width="230" height="230" fill="${(i + Math.floor(i / 10)) % 2 ? '#2A2A30' : '#E8E4DA'}"/>`).join('')}<rect x="-600" y="200" width="2300" height="700" fill="#BCC8C8"/><rect x="100" y="260" width="880" height="500" fill="#9AB0B8" opacity=".6"/>`);
  // cadeira + preso sentado de costas, cabeça sendo cortada
  s += lay(.8, `<rect x="380" y="1100" width="320" height="300" rx="30" fill="#5A1A1A"/><rect x="420" y="1380" width="240" height="40" fill="#8A8A90"/>` + sil({ x: 540, y: 1460, s: .62, kind: 'homem', sit: 1, col: '#3A3226', shadow: 0, armF: [-20, -10] }));
  const sx = 640 + Math.sin(t * 10) * 30;
  s += lay(.8, `<g transform="translate(${f1(sx)},560) rotate(${f1(-30 + Math.sin(t * 20) * 8)})"><path d="M0 0 L120 -16 L120 16Z" fill="#C8CCD4"/><path d="M0 0 L120 16" stroke="#8A8E96" stroke-width="3"/><circle cx="-20" cy="-14" r="16" fill="none" stroke="#2A2A30" stroke-width="7"/><circle cx="-20" cy="14" r="16" fill="none" stroke="#2A2A30" stroke-width="7"/></g>`);
  // fios de cabelo caindo
  let h = ''; for (let i = 0; i < 40; i++) { const ph = (t * .7 + i * .137) % 1, x = 500 + Math.sin(i * 3.1) * 140 + Math.sin(t * 3 + i) * 20, y = 600 + ph * 900; h += `<path d="M${f1(x)} ${f1(y)} q${f1(10 + i % 6)} ${f1(8 + i % 5)} ${f1(18 + i % 7)} ${f1(-4)}" stroke="#2A1A0C" stroke-width="3" fill="none" opacity="${op(1 - ph * .5)}"/>`; }
  s += lay(1, h);
  // mão escondendo um tufo no bolso
  const grab = easeInOut(range(L, 1.0, 1.8));
  s += lay(1.1, `<g transform="translate(${f1(lerp(900, 760, grab))},${f1(lerp(1700, 1600, grab))})"><path d="M-40 0 q20 -30 60 -10 q30 20 0 40 q-40 10 -60 -30Z" fill="#2A1A0C"/></g>` + vhand('pinca', lerp(900, 760, grab), lerp(1700, 1610, grab), .55, 20));
  return s + VIG() + GRAINV(t);
}
function sHead(t) {   // montando a cabeça falsa: sabão, papel, tinta, cabelo
  const { L, d, k } = loc(t, 'head');
  const step = L / d;
  setCam(540, lerp(980, 940, k), lerp(1.0, 1.45, easeInOut(k)) + .06 * Math.max(0, Math.sin(L * 7)), Math.sin(L * 2.5) * 3, [540, 960, 1]);
  let s = lay(.4, cellBg(t) + `<ellipse cx="540" cy="760" rx="700" ry="500" fill="url(#gWarm)" opacity=".55"/>`) + lay(1, `<rect x="-400" y="1240" width="1900" height="900" fill="#3A2A1C"/>`);
  // materiais na mesa
  s += lay(1, `<rect x="140" y="1250" width="140" height="80" rx="20" fill="#F2EEDC"/><g transform="translate(860,1270)"><rect x="-60" y="-70" width="120" height="120" rx="20" fill="#F4F4F0"/><circle cx="0" cy="-10" r="22" fill="#C8C8C0"/></g><g transform="translate(260,1380)"><rect x="-30" y="-50" width="60" height="70" fill="#C83A3A"/><rect x="40" y="-40" width="60" height="60" fill="#3A6AC8"/></g>`);
  s += lay(1, dummyHead(540, 1000, 1.25, 1, easeOut(range(step, .55, .85)), easeOut(range(step, .25, .5))));
  // pincel pintando
  const bx = 480 + Math.sin(L * 12) * 50, by = 980 + Math.cos(L * 9) * 20;
  if (step > .2 && step < .55) s += lay(1, `<g transform="translate(${f1(bx)},${f1(by)}) rotate(-35)"><rect x="-8" y="-300" width="16" height="280" fill="#8A5A2A"/><path d="M-12 -20 L12 -20 L4 20 L-4 20Z" fill="#3A2418"/></g>`);
  if (step > .55) s += lay(1, vhand('pinca', lerp(820, 640, easeOut(range(step, .55, .8))), lerp(700, 860, easeOut(range(step, .55, .8))), .6, -10));
  return s + VIG() + GRAINV(t);
}
function sPatrol(t) {   // guarda com lanterna no corredor
  const { L, d, k } = loc(t, 'patrol');
  setCam(lerp(380, 700, k), lerp(1000, 960, k), lerp(1.15, 1.0, k), lerp(-3, 3, k), [540, 960, 1]);
  let s = `<rect width="1080" height="1920" fill="#06070C"/>`;
  let c = '';
  for (let i = 0; i < 8; i++) { const x = -400 + i * 300; c += `<rect x="${x}" y="300" width="290" height="1300" fill="#10121A"/>${bars(x + 20, x + 270, 300, 1600, 5, '#1C1E28', '#5A6A8A')}`; }
  s += lay(.7, c + `<rect x="-600" y="1600" width="2300" height="600" fill="#14161E"/>`);
  const gx = lerp(-100, 1200, k);
  s += lay(1, guard(gx, 1760, .9, t, 1, true) + `<ellipse cx="${f1(gx + 600)}" cy="1000" rx="300" ry="420" fill="#FFF6D8" opacity=".12" filter="url(#b30)"/>`);
  return s + VIG(1.2) + GRAINV(t);
}
function sBeds(t) {   // POV pelas grades: os três "dormindo"; lanterna passa; ele segue
  const { L, d, k } = loc(t, 'beds');
  setCam(lerp(500, 600, k), lerp(1000, 980, k), lerp(1.05, 1.3, easeInOut(range(L, 0, 1.4))), lerp(2, -2, k), [540, 980, 1]);
  let s = lay(1, cellBg(t, 0) + bed(860, 1250, 1.1, t, 1));
  const sweep = range(L, .2, 2.2), fx = lerp(-200, 1300, sweep);
  s += lay(1, `<ellipse cx="${f1(fx)}" cy="1160" rx="330" ry="260" fill="#FFF6D8" opacity=".38" filter="url(#b30)"/><rect width="1080" height="1920" fill="#000" opacity=".45"/><ellipse cx="${f1(fx)}" cy="1160" rx="260" ry="200" fill="#FFF6D8" opacity=".18"/>`);
  s += lay(1.3, bars(-400, 1500, -300, 2300, 7, '#0A0A10', '#8A9AC0'));
  return s + VIG(1.2) + GRAINV(t);
}
function sRoof(t) {   // os três correndo no telhado sob o farol
  const { L, d, k } = loc(t, 'roof');
  setCam(lerp(400, 680, k), lerp(980, 1060, k), lerp(1.2, 1.0, k), lerp(-4, 2, k), [540, 1000, 1]);
  let s = lay(.05, `<rect x="-800" y="-800" width="2700" height="3600" fill="url(#skyN)"/>`) + lay(.3, `<g opacity=".8">${Array.from({ length: 40 }, (_, i) => `<circle cx="${-400 + i * 52}" cy="${1160 + (i % 4) * 8}" r="${3 + i % 3}" fill="#FFD890"/>`).join('')}</g>`) + lay(.5, fog(t, 1100, 1.2));
  const a = t * 1.6 % (Math.PI * 2), w = Math.abs(Math.sin(a));
  s += lay(.6, `<path d="M1000 600 L${f1(1000 + Math.cos(a) * 1800)} ${f1(600 - 300 * w)} L${f1(1000 + Math.cos(a) * 1800)} ${f1(600 + 300 * w)}Z" fill="url(#beamS)" opacity="${op(.45 * w)}"/>`);
  s += lay(1, `<path d="M-600 1300 L1700 1300 L1700 2400 L-600 2400Z" fill="#1A1C24"/><rect x="-600" y="1290" width="2300" height="20" fill="#2A2E38"/>${[100, 600].map(x => `<rect x="${x}" y="1160" width="140" height="140" fill="#22252E"/>`).join('')}`);
  for (let i = 0; i < 3; i++) s += lay(1, sil({ x: lerp(-100 - i * 180, 1100 - i * 200, k), y: 1310, s: .55, kind: 'homem', ph: L * 9 + i, walk: 1.2, lean: -12, col: '#06070C', rim: '#BFD4FF', rimK: [1, -.4] }));
  return s + VIG() + GRAINV(t);
}
function sLaunch(t) {   // na margem: o bote entra na água escura
  const { L, d, k } = loc(t, 'launch');
  setCam(lerp(600, 500, k), lerp(1100, 1180, k), lerp(1.0, 1.2, easeInOut(k)), Math.sin(L * 3) * 3, [540, 1100, 1]);
  let s = lay(.05, `<rect x="-800" y="-800" width="2700" height="3600" fill="url(#skyN)"/>`) + lay(.4, water(900, t)) + lay(.6, fog(t, 980, 1.3));
  s += lay(1, `<path d="M-600 1500 Q100 1380 600 1450 Q900 1500 1700 1700 L1700 2400 L-600 2400Z" fill="#14161C"/>${Array.from({ length: 10 }, (_, i) => `<ellipse cx="${-300 + i * 180}" cy="${1520 + (i % 3) * 30}" rx="${60 + i % 4 * 20}" ry="30" fill="#20232C"/>`).join('')}`);
  const push = easeInOut(range(L, .2, d)), rx = lerp(560, 760, push), ry = lerp(1440, 1250, push);
  s += lay(1, raftShape(rx, ry, .9, -6 + Math.sin(t * 3) * 3, 1));
  s += lay(1, sil({ x: rx - 280, y: ry + 160, s: .5, kind: 'homem', lean: -30, ph: L * 5, walk: .7, col: '#06070C', rim: '#BFD4FF', rimK: [1, -.4], armF: [-90, -10] }) + sil({ x: rx - 450, y: ry + 210, s: .5, kind: 'homem', lean: -26, ph: L * 5 + 1, walk: .7, col: '#06070C', rim: '#BFD4FF', rimK: [1, -.4], armF: [-90, -10] }));
  s += lay(1, `<ellipse cx="${f1(rx)}" cy="${f1(ry + 60)}" rx="320" ry="40" fill="none" stroke="#8AAAD8" stroke-width="4" opacity=".4"/>`);
  return s + VIG() + GRAINV(t);
}
function sBay(t) {   // o bote some na neblina (corte seco no fim)
  const { L, d, k } = loc(t, 'bay');
  setCam(540, lerp(1100, 900, easeIn(k)), lerp(1.15, .8, easeInOut(k)), lerp(-2, 2, k), [540, 1000, 1]);
  let s = lay(.05, `<rect x="-800" y="-800" width="2700" height="3600" fill="url(#skyN)"/><circle cx="300" cy="420" r="160" fill="url(#gMoon)"/><circle cx="300" cy="420" r="44" fill="#EEF2FF"/>`);
  s += lay(.2, `<g opacity=".9"><path d="M-500 820 L1600 820" stroke="#1A1E28" stroke-width="8"/><rect x="760" y="560" width="22" height="270" fill="#2A1A18"/><rect x="1180" y="560" width="22" height="270" fill="#2A1A18"/><path d="M772 570 Q990 760 1190 570 M-500 640 Q300 800 772 570 M1190 570 Q1400 720 1700 650" stroke="#2A1A18" stroke-width="6" fill="none"/>${Array.from({ length: 30 }, (_, i) => `<circle cx="${-400 + i * 70}" cy="${818 + (i % 2) * 4}" r="4" fill="#FFD890"/>`).join('')}</g>`);
  s += lay(.5, water(860, t)) + lay(.5, `<path d="M300 870 L340 870 L520 2000 L120 2000Z" fill="#DDE6FF" opacity=".12"/>`);
  const rk = easeIn(k);
  s += lay(.8, `<g opacity="${op(1 - range(k, .55, .95))}">${raftShape(560, lerp(1300, 1000, rk), lerp(.7, .25, rk), Math.sin(t * 3) * 4, 1)}${[0, 1, 2].map(i => sil({ x: 560 + (i - 1) * lerp(110, 40, rk), y: lerp(1260, 990, rk), s: lerp(.24, .09, rk), kind: 'homem', sit: 1, lean: -10 + Math.sin(t * 4 + i) * 10, col: '#05060A', shadow: 0, armF: [-60 + Math.sin(t * 4 + i) * 30, -20] })).join('')}</g>`);
  s += lay(1, fog(t * 1.5, lerp(1200, 1000, k), lerp(1, 3.5, k)));
  return s + VIG() + GRAINV(t);
}
const FN = { coat: sCoat, island: sIsland, pile: sPile, grab: sGrab, tower: sTower, pipe: sPipe, seam: sSeam, raft: sRaft, hair: sHair, head: sHead, patrol: sPatrol, beds: sBeds, roof: sRoof, launch: sLaunch, bay: sBay };

/* ===================== câmera "viva" em todo quadro ===================== */
// tremor de mão sempre + balanço + zoom rápido (punch) nas batidas + passada rápida (whip) nos cortes
const PUNCH = [0.05, ...N.s.map(x => x.t0 + .05), ...SH.slice(1).map(s => s[1] + .02)];
function liveCam(t, body) {
  const sh = 9, sx = sh * noise1(t * 9, 1) + 16 * Math.sin(t * 1.3), sy = sh * noise1(t * 8, 4) + 10 * Math.sin(t * 1.7 + 1), r = .7 * noise1(t * 5, 7) + .6 * Math.sin(t * .9);
  let z = 1.07;
  for (const p of PUNCH) if (t >= p && t < p + .7) { const a = range(t, p, p + .09), b = range(t, p + .09, p + .7); z += .1 * (a < 1 ? easeOut(a) : 1 - easeOut(b)); }
  let wx = 0, blur = 0;
  for (const c of SH.slice(1)) { const dt = t - c[1]; if (dt > -.1 && dt < .1) { const dir = (SH.indexOf(c) % 2 ? 1 : -1); wx = dir * (dt < 0 ? -easeIn(range(dt, -.1, 0)) : 1 - easeOut(range(dt, 0, .1))) * 520; blur = 1 - Math.abs(dt) / .1; } }
  return `<g transform="translate(${f1(540 + sx + wx)},${f1(960 + sy)}) rotate(${f1(r)}) scale(${Math.round(z * 1000) / 1000}) translate(-540,-960)"${blur > .05 ? ` filter="url(#whip)"` : ''}>${body}</g>`;
}
function frame(t) {
  D = []; uid = 0;
  const sh = shotAt(t);
  let body = FN[sh[0]](t);
  defsEl.innerHTML = STATIC + handDefs() + `<filter id="toBlack"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter><filter id="whip" x="-20%" y="-5%" width="140%" height="110%"><feGaussianBlur stdDeviation="28 0"/></filter>` + D.join('');
  root.innerHTML = `<rect width="1080" height="1920" fill="#000"/>` + liveCam(t, body);
}
