/* =====================================================================================
   CEM FILHOTES, NENHUMA MÃE 🐢 — arte em SVG
   Noite de lua cheia: azul = casa (lua e mar), laranja = armadilha (a lâmpada). O nosso filhote tem uma pintinha clara no casco.
   Tudo é determinístico (nada de R() dentro de quadro): qualquer quadro sai igual em qualquer ordem.
   Vistas das tartarugas: de frente (gancho), de cima (a caminhada pela praia), de lado (mãe, nado, adulta) e em corte (dentro do ninho).
   ===================================================================================== */
const hh = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const VIG = (k = 1) => `<rect width="1080" height="1920" fill="url(#vig)" opacity="${k}"/>`;
const GRAINV = t => { const j = Math.floor(t * 24); return `<rect x="-200" y="-200" width="1480" height="2320" fill="url(#noiseP)" opacity=".05" transform="translate(${(j * 37) % 200 - 100},${(j * 53) % 200 - 100})"/>`; };
const blur = (px, c) => { const id = 'bl' + String(px).replace('.', '_'); if (!D.some(d => d.includes(`id="${id}"`))) def(`<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${px}"/></filter>`); return `<g filter="url(#${id})">${c}</g>`; };
const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; };
const rimGroup = (c, k = [1, -.6], col = '#BCD4FF', w = 7) => `<g filter="url(#${rig({ amb: '#ffffff', k: [-k[0], -k[1]], shO: 0, rims: [{ c: col, k, w, o: 1, glow: true }] })})">${c}</g>`;
const hand2 = t => [Math.sin(t * 1.3) * 3 + Math.sin(t * 3.1) * 1.5, Math.cos(t * 1.1) * 3];
const ang = (a) => f1(a);

/* ---------- gradientes fixos ---------- */
const EXTRA = `
<linearGradient id="skyNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E1A52"/><stop offset=".45" stop-color="#2A4796"/><stop offset=".85" stop-color="#6E8FE0"/><stop offset="1" stop-color="#9DB6F2"/></linearGradient>
<linearGradient id="seaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2D6DB5"/><stop offset=".5" stop-color="#17497F"/><stop offset="1" stop-color="#0C2C58"/></linearGradient>
<linearGradient id="sandG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9D6F2"/><stop offset=".5" stop-color="#9FB1D8"/><stop offset="1" stop-color="#6E82B6"/></linearGradient>
<linearGradient id="sandW" gradientUnits="userSpaceOnUse" x1="0" y1="880" x2="0" y2="2200"><stop offset="0" stop-color="#DCE6FB"/><stop offset=".35" stop-color="#AEBFE4"/><stop offset="1" stop-color="#5F74AA"/></linearGradient>
<linearGradient id="sandLip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4ECFF"/><stop offset=".25" stop-color="#B9C8E8"/><stop offset="1" stop-color="#7388BC"/></linearGradient>
<radialGradient id="gShell" cx=".42" cy=".28" r=".85"><stop offset="0" stop-color="#6D8B73"/><stop offset=".45" stop-color="#3A5043"/><stop offset="1" stop-color="#1B2A25"/></radialGradient>
<radialGradient id="gSkin" cx=".45" cy=".3" r=".85"><stop offset="0" stop-color="#7C9680"/><stop offset=".5" stop-color="#46604F"/><stop offset="1" stop-color="#23342C"/></radialGradient>
<linearGradient id="gFlip" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2A3B33"/><stop offset=".62" stop-color="#4C6757"/><stop offset="1" stop-color="#C9DCC0"/></linearGradient>
<linearGradient id="gChest" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9D8C2"/><stop offset=".6" stop-color="#91A593"/><stop offset="1" stop-color="#5F7566"/></linearGradient>
<radialGradient id="gEye" cx=".34" cy=".3" r=".9"><stop offset="0" stop-color="#4A3B35"/><stop offset=".5" stop-color="#1E1614"/><stop offset="1" stop-color="#080505"/></radialGradient>
<radialGradient id="gEggG" cx=".36" cy=".3" r=".85"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#F1EBDD"/><stop offset="1" stop-color="#C9BFA8"/></radialGradient>
`;

/* ===================== céu, lua e mar (noite de lua cheia) ===================== */
function estrelas(t, n = 70, y1 = 900) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = hh(i, 1) * 1500 - 210, y = hh(i, 2) * y1 - 120, r = .8 + hh(i, 3) * 2.2, tw = .55 + .45 * Math.sin(t * (1.2 + hh(i, 4) * 2.4) + i * 3.1);
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="#EAF1FF" opacity="${op(.35 + .5 * hh(i, 5) * tw)}"/>`;
  }
  return s;
}
function lua(x, y, r, k = 1) {
  let s = `<circle cx="${x}" cy="${y}" r="${f1(r * 4.6)}" fill="url(#gMoon)" opacity="${op(.95 * k)}"/><circle cx="${x}" cy="${y}" r="${f1(r * 2.1)}" fill="url(#gMoon)" opacity="${op(.7 * k)}"/>`;
  s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#F7F9FF"/>`;
  [[-.34, -.18, .22, '#DCE3F2', .9], [.28, .22, .28, '#D5DDEF', .85], [.06, -.46, .15, '#E3E9F6', .8], [-.16, .38, .2, '#D9E0F1', .8], [.44, -.2, .12, '#E0E7F5', .8]].forEach(([a, b, q, c, o]) => { s += `<circle cx="${f1(x + a * r)}" cy="${f1(y + b * r)}" r="${f1(q * r)}" fill="${c}" opacity="${o}"/>`; });
  return s;
}
const LUA = { x: 740, y: 380, r: 170 };
function ceuNoite(t, o = {}) {
  const { lua: lk = 1, estr = 1, y1 = 900 } = o;
  let s = `<rect x="-900" y="-1400" width="2900" height="3000" fill="url(#skyNight)"/>`;
  s += blur(1, estrelas(t, 90, y1)).replace('<g', `<g opacity="${op(estr)}"`);
  s += `<g opacity="${op(lk)}">${lua(LUA.x, LUA.y, LUA.r)}</g>`;
  s += blur(30, `<ellipse cx="200" cy="560" rx="560" ry="46" fill="#CFE0FF" opacity=".16"/><ellipse cx="880" cy="760" rx="520" ry="40" fill="#CFE0FF" opacity=".14"/><ellipse cx="500" cy="300" rx="480" ry="34" fill="#CFE0FF" opacity=".1"/>`);
  return s;
}

/* duna com capim ao fundo (para o plano de frente para a terra) */
function brilhoCidade(t, x = 70, y = 905) {                     // a luz laranja ao longe, atrás da duna: já avisa que a armadilha existe
  return `<ellipse cx="${x}" cy="${y}" rx="360" ry="190" fill="url(#gLamp)" opacity="${op(.5 + .08 * Math.sin(t * 2.3))}"/>` + [0, 1, 2, 3].map(i => `<circle cx="${x - 60 + i * 52}" cy="${y - 36 + (i % 2) * 22}" r="${5 + (i % 3)}" fill="#FFE3AE" opacity=".95"/>`).join('');
}
function duna(t, y0 = 900, cor = '#102A63') {
  let s = `<path d="M-200 ${y0 + 40} Q60 ${y0 - 70} 300 ${y0 - 20} T700 ${y0 - 40} T1100 ${y0 - 90} T1400 ${y0 - 10} L1400 ${y0 + 400} L-200 ${y0 + 400}Z" fill="${cor}"/>`;
  for (let i = 0; i < 26; i++) {                                  // tufos de capim: várias lâminas afiladas saindo do mesmo ponto
    const x = -150 + i * 56 + hh(i, 7) * 30, yb = y0 - 50 + Math.sin(i * .7) * 30;
    for (let b = 0; b < 6; b++) {
      const h = 60 + hh(i * 7 + b, 8) * 110, sw = Math.sin(t * 1.1 + i * .8 + b) * 9 + (b - 2.5) * 16, xe = x + sw, ye = yb - h;
      s += `<path d="M${f1(x + (b - 2.5) * 3)} ${f1(yb + 30)} Q${f1(x + sw * .3)} ${f1(yb - h * .55)} ${f1(xe)} ${f1(ye)} Q${f1(x + sw * .3 + 7)} ${f1(yb - h * .5)} ${f1(x + (b - 2.5) * 3 + 8)} ${f1(yb + 30)}Z" fill="${cor}"/>`;
    }
  }
  return s;
}

/* trilha de brilho da lua no mar (vista do chão, de frente para o mar) */
function marDeFrente(t, y0 = 760, alt = 300) {
  let s = `<rect x="-300" y="${y0}" width="1700" height="${alt}" fill="url(#seaG)"/>`;
  s += `<rect x="-300" y="${y0}" width="1700" height="6" fill="#BFD6FF" opacity=".55"/>`;
  for (let i = 0; i < 110; i++) {
    const k = hh(i, 11), y = y0 + 6 + k * k * (alt - 10), w = 24 + k * 230 * (.4 + hh(i, 12)), x = LUA.x + (hh(i, 13) - .5) * (60 + k * 360), fl = .5 + .5 * Math.sin(t * (2 + hh(i, 14) * 3) + i * 5);
    s += `<rect x="${f1(x - w / 2)}" y="${f1(y)}" width="${f1(w)}" height="${f1(2 + k * 7)}" rx="3" fill="#F2F7FF" opacity="${op(.25 + .6 * fl * (1 - k * .35))}"/>`;
  }
  return s;
}

/* ===================== areia: monte, borda cobrindo a base, grãos no ar ===================== */
function grao(n, x0, y0, w, h, t, seed = 0, cor = '#EAF0FF', r0 = 1.5, r1 = 4.5) {
  let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${f1(x0 + hh(i, seed) * w)}" cy="${f1(y0 + hh(i, seed + 1) * h)}" r="${f1(lerp(r0, r1, hh(i, seed + 2)))}" fill="${cor}" opacity="${op(.1 + .35 * hh(i, seed + 3))}"/>`;
  return s;
}
function bordaAreia(w, h, seed = 0) {
  let p = `M${-w} 60 L${-w} ${f1(-h * .35)}`;
  for (let i = 0; i <= 8; i++) { const x = -w + (2 * w * i) / 8, y = -h * (.55 + .45 * Math.sin(Math.PI * i / 8)) + (hh(i, seed) - .5) * h * .25; p += ` L${f1(x)} ${f1(y)}`; }
  p += ` L${w} ${f1(-h * .35)} L${w} 60Z`;
  let s = `<path d="${p}" fill="url(#sandLip)"/><path d="${p}" fill="none" stroke="#F2F6FF" stroke-width="3" opacity=".55" stroke-linejoin="round"/>`;
  for (let i = 0; i < Math.round(w / 9); i++) s += `<circle cx="${f1(-w + hh(i, seed + 4) * 2 * w)}" cy="${f1(-h * .1 - hh(i, seed + 5) * h * .6)}" r="${f1(1.3 + hh(i, seed + 6) * 2.4)}" fill="#fff" opacity="${op(.12 + .3 * hh(i, seed + 7))}"/>`;
  return s;
}
/* jato de areia: grãos e torrões lançados de uma abertura, com gravidade; rep = período de cada rajada */
function jato(t, x0, y0, o = {}) {
  const { n = 60, v = 520, g = 1500, vida = 1.1, abre = 1, seed = 0, rep = 2.4, cor = '#EADFC8', maxR = 6 } = o;
  let s = '';
  for (let i = 0; i < n; i++) {
    const per = rep * (.55 + hh(i, seed) * .9), tau = (t + hh(i, seed + 1) * per) % per, life = vida * (.6 + hh(i, seed + 2) * .8);
    if (tau > life) continue;
    const a = -Math.PI / 2 + (hh(i, seed + 3) - .5) * 2 * abre, sp = v * (.4 + hh(i, seed + 4) * .9), k = 1 - tau / life;
    const x = x0 + Math.cos(a) * sp * tau, y = y0 + Math.sin(a) * sp * tau + .5 * g * tau * tau, r = (2 + hh(i, seed + 5) * hh(i, seed + 6) * maxR * 2) * (.55 + .45 * k);
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${cor}" opacity="${op(.9 * k)}"/><circle cx="${f1(x - r * .25)}" cy="${f1(y - r * .3)}" r="${f1(r * .45)}" fill="#fff" opacity="${op(.55 * k)}"/>`;
  }
  return s;
}

/* crista de areia: cobre a base da fileira de trás e dá o degradê de distância (névoa azulada em cima de cada crista) */
function crista(y, seed = 0, haze = .5) {
  const id = nid('hz'); def(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${y - 40}" x2="0" y2="${y + 200}"><stop offset="0" stop-color="#9FB6EA" stop-opacity="${haze}"/><stop offset="1" stop-color="#9FB6EA" stop-opacity="0"/></linearGradient>`);
  let top = '', p = '';
  for (let x = -300; x <= 1400; x += 80) { const yy = y + Math.sin(x * .012 + seed * 3.1) * 16 + (hh(Math.round(x / 80), seed) - .5) * 14; top += `${top ? ' L' : 'M'}${x} ${f1(yy)}`; }
  p = `${top} L1400 2600 L-300 2600Z`;
  let s = `<path d="${p}" fill="url(#sandW)"/><path d="${p}" fill="url(#${id})"/><path d="${top}" fill="none" stroke="#F0F5FF" stroke-width="4" opacity=".55" stroke-linejoin="round"/>`;
  for (let i = 0; i < 40; i++) s += `<circle cx="${f1(-300 + hh(i, seed + 9) * 1700)}" cy="${f1(y + 14 + hh(i, seed + 10) * 160)}" r="${f1(1.2 + hh(i, seed + 11) * 2.6)}" fill="#fff" opacity="${op(.1 + .25 * hh(i, seed + 12))}"/>`;
  return s;
}
/* monte liso onde o herói sai (base arredondada que cobre o corpo até a cintura) */
function monte(w, h) {
  return `<path d="M${-w} 90 C${-w} ${f1(-h * .5)} ${f1(-w * .55)} ${-h} 0 ${-h} C${f1(w * .55)} ${-h} ${w} ${f1(-h * .5)} ${w} 90Z" fill="url(#sandLip)"/><path d="M${-w + 10} ${f1(-h * .3)} C${f1(-w * .6)} ${f1(-h * .95)} ${f1(-w * .2)} ${f1(-h * 1.02)} 0 ${-h} C${f1(w * .2)} ${f1(-h * 1.02)} ${f1(w * .6)} ${f1(-h * .95)} ${w - 10} ${f1(-h * .3)}" fill="none" stroke="#F2F6FF" stroke-width="4" opacity=".6" stroke-linecap="round"/>`;
}

/* ===================== filhote visto de frente (gancho) ===================== */
// origem: base do corpo na areia (y negativo = para cima); altura total ~ 330; rise 0..1 = o quanto já saiu da areia
function filhoteFrente(o = {}) {
  const { rise = 1, look = [0, 0], turn = 0, blink = 0, wave = 0, mark = 0, tilt = 0, worry = 0 } = o;
  const up = (1 - rise) * 215, fx = turn * 26;
  let s = `<g transform="translate(0,${f1(up)}) rotate(${f1(tilt)})">`;
  // casco por trás da cabeça (cúpula com borda clara e placas)
  s += `<path d="M-176 110 L-176 -30 C-186 -190 -96 -300 0 -300 C96 -300 186 -190 176 -30 L176 110Z" fill="url(#gShell)"/>`;
  s += `<path d="M-176 -30 C-186 -190 -96 -300 0 -300 C96 -300 186 -190 176 -30" fill="none" stroke="#CFE0C4" stroke-width="9" stroke-dasharray="30 9" stroke-linecap="round" opacity=".9"/>`;
  s += `<path d="M-126 -80 Q-34 -250 0 -262 Q34 -250 126 -80 M-156 -110 Q-76 -222 -40 -252 M156 -110 Q76 -222 40 -252 M-96 -150 Q0 -204 96 -150" fill="none" stroke="#A5BFA6" stroke-width="5" opacity=".34" stroke-linecap="round"/>`;
  // nadadeiras da frente (levantadas como quem acena)
  [-1, 1].forEach(sd => {
    const a = sd * (30 + 20 * Math.sin(wave * 6.28 + (sd > 0 ? 0 : 1.9)));
    s += `<g transform="translate(${sd * 138},-70) rotate(${f1(a)})"><g transform="scale(${sd},1)"><path d="M0 0 C34 -18 52 -120 18 -224 C-2 -252 -26 -170 -30 -108 C-32 -56 -22 -10 0 0Z" fill="url(#gFlip)"/><path d="M0 0 C34 -18 52 -120 18 -224" fill="none" stroke="#E4F1D8" stroke-width="7" stroke-linecap="round" opacity=".8"/></g></g>`;
  });
  // pescoço e cabeça
  s += `<path d="M${f1(fx * .5 - 96)} 70 C${f1(fx * .5 - 100)} -40 ${f1(fx * .5 - 84)} -118 ${f1(fx * .5)} -122 C${f1(fx * .5 + 84)} -118 ${f1(fx * .5 + 100)} -40 ${f1(fx * .5 + 96)} 70Z" fill="url(#gChest)"/><path d="M${f1(fx * .5 - 60)} -40 Q${f1(fx * .5)} -66 ${f1(fx * .5 + 60)} -40 M${f1(fx * .5 - 64)} 10 Q${f1(fx * .5)} -14 ${f1(fx * .5 + 64)} 10 M${f1(fx * .5)} -66 L${f1(fx * .5)} 40" fill="none" stroke="#6F8574" stroke-width="3.4" opacity=".5" stroke-linecap="round"/>`;
  s += `<g transform="translate(${f1(fx)},-196)"><path d="M-104 -6 C-108 -80 -62 -96 0 -96 C62 -96 108 -80 104 -6 C102 40 66 76 30 90 L0 98 L-30 90 C-66 76 -102 40 -104 -6Z" fill="url(#gSkin)"/>`;
  s += `<path d="M-64 -56 Q-20 -82 0 -76 Q20 -82 64 -56 M-80 -22 Q-40 -46 -10 -40 M80 -22 Q40 -46 10 -40 M0 -76 L0 -40" fill="none" stroke="#A5BFA6" stroke-width="3.5" opacity=".32" stroke-linecap="round"/>`;
  s += `<path d="M-70 30 Q0 78 70 30 Q50 84 0 98 Q-50 84 -70 30Z" fill="#C2D2B2" opacity=".4"/>`;
  if (mark) s += `<g opacity="${op(mark)}" transform="translate(${f1(12 + fx * .1)},-58) rotate(-12)"><ellipse rx="19" ry="10.5" fill="#FFF1C8"/><ellipse rx="19" ry="10.5" fill="none" stroke="#fff" stroke-width="2.4" opacity=".7"/></g>`;
  // bico claro e curvo (com gancho), narinas e uma linha de boca que cai nos cantos
  s += `<path d="M-22 16 Q0 28 22 16 Q24 40 6 56 Q0 62 -6 56 Q-24 40 -22 16Z" fill="#B7AB84"/><path d="M-22 16 Q0 28 22 16" fill="none" stroke="#6E6247" stroke-width="3" opacity=".7"/><path d="M-5 54 Q0 66 5 54" fill="#8E835F"/>`;
  s += `<path d="M-56 46 Q-38 62 -14 60 M56 46 Q38 62 14 60" fill="none" stroke="#1B2723" stroke-width="3.5" stroke-linecap="round" opacity=".5"/>`;
  s += `<circle cx="-10" cy="14" r="3.6" fill="#10181A" opacity=".8"/><circle cx="10" cy="14" r="3.6" fill="#10181A" opacity=".8"/>`;
  // olhos grandes e brilhantes
  [-1, 1].forEach(sd => {
    const ex = sd * 60 + look[0] * 5, ey = -12 + look[1] * 4, op_ = clamp(1 - blink, .04, 1);
    s += `<g transform="translate(${f1(ex)},${f1(ey)})"><ellipse rx="43" ry="41" fill="#1F2D26" opacity=".72"/>`;
    s += `<g transform="scale(1,${f1(op_ * 100) / 100})"><circle r="34" fill="url(#gEye)"/><circle cx="${f1(-9 + look[0] * 2.2)}" cy="${f1(-11 + look[1] * 1.6)}" r="11.5" fill="#fff"/><circle cx="${f1(10 + look[0] * 1.6)}" cy="${f1(11 + look[1] * 1.2)}" r="5" fill="#fff" opacity=".8"/></g>`;
    s += `<g transform="rotate(${f1(sd * worry * 15)})"><path d="M-46 -6 Q0 ${f1(-56 + 50 * blink)} 46 -6" fill="none" stroke="#B5CDB0" stroke-width="5.5" opacity=".5" stroke-linecap="round"/></g></g>`;
  });
  s += `</g></g>`;
  return s;
}

/* ===================== o gancho: a areia ferve de filhotes ===================== */
// fileiras de trás para a frente; depois de cada fileira vem uma crista de areia que cobre a base e dá a distância
function formigueiro(t, o = {}) {
  const { cx = 540, base = 1540, pt = 0 } = o;
  const linhas = [[.0, 9], [.2, 9], [.4, 8], [.6, 7], [.8, 5]];
  let s = '';
  linhas.forEach(([d, nlin], li) => {
    const sc = lerp(.34, .82, d), y = base - lerp(560, 90, d);
    let g = '';
    for (let i = 0; i < nlin; i++) {
      const fx = (i + .5) / nlin, x = cx + (fx - .5) * lerp(900, 1240, d) + (hh(i, li * 7) - .5) * 60, dly = (hh(i, li * 3 + 1) * .5 + (1 - d) * .12), e = backOut(range(t + pt, dly, dly + .38));
      if (e <= 0.02) continue;
      const wave = t * (1.1 + hh(i, li) * .6) + hh(i, li * 5) * 6;
      g += `<g transform="translate(${f1(x)},${f1(y + (hh(i, li * 9) - .5) * 24)}) scale(${f1(sc * (.94 + .12 * hh(i, li * 2)))})">${filhoteFrente({ rise: clamp(e, 0, 1), wave: wave / 6.28, turn: Math.sin(t * 1.3 + i * 2 + li) * .8, look: [Math.sin(t * 1.7 + i) * 1.5, Math.cos(t * 1.3 + li)], blink: pulse((t + hh(i, li) * 3) % 3.2, 1.4, 1.52, .05), tilt: Math.sin(t * 2.1 + i * 1.7) * 4 })}</g>`;
    }
    s += (d < .7 ? blur(lerp(3.4, .5, d / .7), rimGroup(g)) : rimGroup(g)) + crista(y + 4 * sc, li + 1, lerp(.55, .12, d));
  });
  return s;
}

/* ondulações de areia (vento) e pedrinhas no chão: dá textura e profundidade ao chão grande */
function ondulacoes(y0, y1, n = 26, seed = 0) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const y = y0 + (y1 - y0) * (hh(i, seed) ** 1.4), x = -200 + hh(i, seed + 1) * 1500, w = 140 + hh(i, seed + 2) * 380, k = (y - y0) / (y1 - y0), a = 6 + 18 * k;
    s += `<path d="M${f1(x)} ${f1(y)} Q${f1(x + w * .5)} ${f1(y - a)} ${f1(x + w)} ${f1(y + a * .2)}" fill="none" stroke="#F4F8FF" stroke-width="${f1(2 + 4 * k)}" stroke-linecap="round" opacity="${op(.1 + .14 * (1 - k))}"/><path d="M${f1(x + 6)} ${f1(y + 6 + 5 * k)} Q${f1(x + w * .5)} ${f1(y - a + 8 + 5 * k)} ${f1(x + w - 8)} ${f1(y + 4 + a * .2 + 5 * k)}" fill="none" stroke="#3A4F8A" stroke-width="${f1(3 + 5 * k)}" stroke-linecap="round" opacity="${op(.1 + .08 * k)}"/>`;
  }
  for (let i = 0; i < 18; i++) { const x = -150 + hh(i, seed + 5) * 1400, y = y0 + (y1 - y0) * hh(i, seed + 6), r = 3 + hh(i, seed + 7) * 9; s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(r * .6)}" fill="#7C8EC0" opacity=".5"/><ellipse cx="${f1(x - r * .2)}" cy="${f1(y - r * .25)}" rx="${f1(r * .6)}" ry="${f1(r * .3)}" fill="#E7EEFF" opacity=".5"/>`; }
  return s;
}

/* ===================== tartaruga vista de cima (a caminhada pela praia) ===================== */
// Olha para -y. Escala: casco com ~200 de comprimento (multiplicar por sc). ph = fase da passada (0..1), v = 0..1 quanto remam (amplitude),
// cab = giro da cabeça (-1..1), tom 'fil' (filhote escuro) ou 'adu' (adulta oliva), pinta = a pintinha clara da testa (e uma listra no casco).
function tartTopo(o = {}) {
  const { ph = 0, v = 1, cab = 0, tom = 'fil', pinta = 0, molhada = 0, sombra = 1 } = o;
  const adu = tom === 'adu', cas = adu ? 'url(#gCascoA)' : 'url(#gCascoF)', pele = adu ? 'url(#gPeleA)' : 'url(#gPeleF)', lin = adu ? '#3A3319' : '#A9C3A8', marg = adu ? '#EADFB2' : '#DCEACF', bord = adu ? '#E6DBA6' : '#E1EFD6';
  const sw = Math.sin(ph * 6.2832), a = 24 + 44 * sw * v, r = 8 + 6 * Math.sin(ph * 6.2832 + 1.2) * v;
  let s = '';
  if (sombra) s += `<ellipse cx="10" cy="14" rx="104" ry="128" fill="#07102A" opacity=".34"/>`;
  // nadadeiras traseiras e cauda
  [-1, 1].forEach(sd => { s += `<g transform="translate(${sd * 50},84) rotate(${f1(sd * (128 + r))})"><g transform="scale(${sd},1)"><path d="M0 0 C16 -4 40 8 52 34 C40 42 20 34 0 20Z" fill="${pele}"/><path d="M0 0 C16 -4 40 8 52 34" fill="none" stroke="${bord}" stroke-width="3" opacity=".7" stroke-linecap="round"/></g></g>`; });
  s += `<path d="M-7 104 L0 134 L7 104Z" fill="${pele}"/>`;
  // nadadeiras da frente (remam juntas)
  [-1, 1].forEach(sd => { s += `<g transform="translate(${sd * 76},-50) rotate(${f1(sd * a)})"><g transform="scale(${sd},1)"><path d="M0 0 C30 -16 78 -8 118 30 C134 46 124 60 104 54 C66 44 28 28 0 18Z" fill="${pele}"/><path d="M0 0 C30 -16 78 -8 118 30 C134 46 124 60 104 54" fill="none" stroke="${bord}" stroke-width="5" stroke-linecap="round" opacity=".85"/></g></g>`; });
  // casco
  const C = 'M0 -98 C48 -98 90 -58 88 -2 C86 56 44 100 0 112 C-44 100 -86 56 -88 -2 C-90 -58 -48 -98 0 -98Z';
  s += `<path d="${C}" fill="${cas}"/><path d="${C}" fill="none" stroke="${marg}" stroke-width="8" stroke-dasharray="22 7" stroke-linecap="round" opacity=".92"/>`;
  s += `<path d="M-19 -84 L-19 100 M19 -84 L19 100 M-19 -60 Q-56 -66 -84 -50 M19 -60 Q56 -66 84 -50 M-19 -22 Q-58 -26 -87 -14 M19 -22 Q58 -26 87 -14 M-19 16 Q-56 16 -86 22 M19 16 Q56 16 86 22 M-19 54 Q-48 56 -72 66 M19 54 Q48 56 72 66" fill="none" stroke="${lin}" stroke-width="3.4" opacity=".46" stroke-linecap="round"/>`;
  s += `<path d="M-19 -86 Q0 -98 19 -86 M-19 -60 L-26 -22 L-19 16 M19 -60 L26 -22 L19 16" fill="none" stroke="${lin}" stroke-width="3" opacity=".3"/>`;
  if (pinta) s += `<path d="M-6 -50 Q0 -70 6 -50 Q8 -8 0 -4 Q-8 -8 -6 -50Z" fill="#FFF1C8" opacity="${op(.9 * pinta)}"/>`;
  if (molhada) s += `<path d="M-60 -58 Q-40 -86 0 -88 Q-30 -70 -40 -30Z" fill="#fff" opacity="${op(.4 * molhada)}"/><ellipse cx="-34" cy="-34" rx="12" ry="34" transform="rotate(14 -34 -34)" fill="#fff" opacity="${op(.22 * molhada)}"/>`;
  // pescoço e cabeça
  s += `<g transform="translate(${f1(cab * 16)},0) rotate(${f1(cab * 10)} 0 -96)"><ellipse cx="0" cy="-104" rx="22" ry="20" fill="${pele}"/><path d="M-27 -122 C-28 -146 -12 -156 0 -158 C12 -156 28 -146 27 -122 C26 -104 12 -98 0 -98 C-12 -98 -26 -104 -27 -122Z" fill="${pele}"/><path d="M-5 -154 L0 -166 L5 -154Z" fill="${adu ? '#B7A878' : '#8FA48D'}"/>`;
  s += `<ellipse cx="-17" cy="-130" rx="6" ry="7" fill="#0A0807"/><ellipse cx="17" cy="-130" rx="6" ry="7" fill="#0A0807"/><circle cx="-18.5" cy="-132.5" r="2.2" fill="#fff"/><circle cx="15.5" cy="-132.5" r="2.2" fill="#fff"/>`;
  if (pinta) s += `<ellipse cx="3" cy="-138" rx="8" ry="4.6" transform="rotate(-12 3 -138)" fill="#FFF1C8" opacity="${op(pinta)}"/>`;
  s += `</g>`;
  return s;
}
// gradientes da vista de cima
const EXTRA2 = `
<radialGradient id="gCascoF" cx=".45" cy=".35" r=".8"><stop offset="0" stop-color="#52705A"/><stop offset=".55" stop-color="#2D4437"/><stop offset="1" stop-color="#16231E"/></radialGradient>
<radialGradient id="gPeleF" cx=".4" cy=".4" r=".9"><stop offset="0" stop-color="#4E6B58"/><stop offset="1" stop-color="#22342B"/></radialGradient>
<radialGradient id="gCascoA" cx=".45" cy=".35" r=".85"><stop offset="0" stop-color="#9C8A4C"/><stop offset=".55" stop-color="#6D6234"/><stop offset="1" stop-color="#3A3319"/></radialGradient>
<radialGradient id="gPeleA" cx=".4" cy=".4" r=".9"><stop offset="0" stop-color="#8E8B5C"/><stop offset="1" stop-color="#4B4A2C"/></radialGradient>
`;
