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
<linearGradient id="gSoil" gradientUnits="userSpaceOnUse" x1="0" y1="1030" x2="0" y2="2300"><stop offset="0" stop-color="#C4CFE9"/><stop offset=".05" stop-color="#B7A47F"/><stop offset=".35" stop-color="#8A6B48"/><stop offset=".7" stop-color="#5A4029"/><stop offset="1" stop-color="#34241A"/></linearGradient>
<radialGradient id="gPitG" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#8A5A2A"/><stop offset=".6" stop-color="#4A2D18"/><stop offset="1" stop-color="#2B190E"/></radialGradient>
<radialGradient id="gAmber"><stop offset="0" stop-color="#FFC878" stop-opacity=".95"/><stop offset=".45" stop-color="#E88A30" stop-opacity=".4"/><stop offset="1" stop-color="#C85A10" stop-opacity="0"/></radialGradient>
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
  const { n = 60, v = 520, g = 1500, vida = 1.1, abre = 1, seed = 0, rep = 2.4, cor = '#EADFC8', maxR = 6, a0 = -Math.PI / 2 } = o;
  let s = '';
  for (let i = 0; i < n; i++) {
    const per = rep * (.55 + hh(i, seed) * .9), tau = (t + hh(i, seed + 1) * per) % per, life = vida * (.6 + hh(i, seed + 2) * .8);
    if (tau > life) continue;
    const a = a0 + (hh(i, seed + 3) - .5) * 2 * abre, sp = v * (.4 + hh(i, seed + 4) * .9), k = 1 - tau / life;
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

/* ===================== tartaruga de lado (a mãe cavando, a adulta) ===================== */
// Olha para +x; origem no chão, no meio do casco. Escala 1 = casco de ~520 de comprimento. Poses: cava (pata de trás no buraco), anda.
// cava = fase do raspar (0..1), resp = respiração (0..1), chora = brilho da lágrima de sal, cab = balanço da cabeça, pinta = pintinha clara na testa.
function tartLado(o = {}) {
  const { cava = 0, resp = 0, chora = 1, cab = 0, olho = 0, pinta = 0, pose = 'cava', passo = 0, molhada = 0 } = o;
  const insp = Math.sin(resp * 6.2832) * 3.5;
  const hf = pose === 'cava' ? 70 + 80 * (.5 - .5 * Math.cos(cava * 6.2832)) : 108 + 26 * Math.sin(passo * 6.2832);         // ângulo da pata traseira
  const ff = pose === 'cava' ? -30 + 3 * Math.sin(cava * 6.2832) : -22 + 34 * Math.sin(passo * 6.2832);                           // ângulo da pata dianteira
  let s = '';
  if (pose === 'cava') s += `<ellipse cx="-10" cy="6" rx="300" ry="22" fill="#1A0F08" opacity=".4"/>`;
  // patas do lado de longe (mais escuras, atrás do casco)
  s += `<g transform="translate(112,-48) rotate(${f1(ff + 22)})" opacity=".85"><path d="M0 0 C34 6 66 34 76 78 C78 94 60 100 48 86 C28 62 8 38 -8 22Z" transform="scale(1.75)" fill="#4D4B2D"/></g>`;
  s += `<g transform="translate(-176,-48) rotate(${f1(hf - 24)})" opacity=".85"><path d="M0 0 C20 4 46 24 54 60 C46 70 24 58 0 34Z" transform="scale(1.45)" fill="#4D4B2D"/></g>`;
  s += `<path d="M-262 -40 L-285 -14 L-262 -30Z" fill="url(#gPeleA)"/>`;
  // casco
  const CS = 'M-262 -46 C-262 -128 -150 -188 -10 -188 C120 -188 226 -130 240 -66 C244 -52 236 -44 222 -42 L-248 -42 C-260 -42 -264 -44 -262 -46Z';
  s += `<g transform="translate(0,${f1(-insp * .5 + 42)}) scale(1,1.22) translate(0,-42)"><path d="${CS}" fill="url(#gCascoA)"/>`;
  s += `<path d="M-232 -106 Q-100 -170 20 -178 Q140 -176 216 -100 M-176 -148 Q-196 -90 -206 -46 M-74 -182 Q-86 -110 -90 -44 M40 -184 Q44 -110 42 -44 M150 -160 Q160 -100 172 -48" fill="none" stroke="#3A3319" stroke-width="5" opacity=".5" stroke-linecap="round"/>`;
  s += `<path d="M-262 -46 C-262 -128 -150 -188 -10 -188" fill="none" stroke="#F0E6BC" stroke-width="5" opacity=".35"/>`;
  s += `<path d="M-250 -42 L224 -42" fill="none" stroke="#EADFB2" stroke-width="10" stroke-dasharray="26 8" stroke-linecap="round" opacity=".9"/>`;
  if (molhada) s += `<path d="M-200 -120 Q-100 -176 20 -182" fill="none" stroke="#fff" stroke-width="9" opacity="${op(.45 * molhada)}" stroke-linecap="round"/><ellipse cx="-60" cy="-140" rx="70" ry="10" fill="#fff" opacity="${op(.18 * molhada)}"/>`;
  s += `</g>`;
  s += `<path d="M-250 -42 L226 -42 L210 -22 L-232 -22Z" fill="#CFC38F"/><path d="M-250 -42 L226 -42" stroke="#F0E6BC" stroke-width="3" opacity=".8"/>`;
  // pata traseira (perto): coxa + pá que raspa
  s += `<g transform="translate(-196,-46) rotate(${f1(hf)})"><path d="M0 0 C20 4 46 24 54 60 C46 70 24 58 0 34Z" transform="scale(1.95)" fill="url(#gPeleA)"/><path d="M0 0 C20 4 46 24 54 60" transform="scale(1.95)" fill="none" stroke="#E6DBA6" stroke-width="2" opacity=".85" stroke-linecap="round"/></g>`;
  // pata dianteira (perto)
  s += `<g transform="translate(150,-52) rotate(${f1(ff)})"><path d="M0 0 C34 6 66 34 76 78 C78 94 60 100 48 86 C28 62 8 38 -8 22Z" transform="scale(1.85)" fill="url(#gPeleA)"/><path d="M0 0 C34 6 66 34 76 78" transform="scale(1.85)" fill="none" stroke="#E6DBA6" stroke-width="2.4" opacity=".8" stroke-linecap="round"/></g>`;
  // pescoço e cabeça
  const bx = cab * 10, by = -cab * 5 + insp * .4;
  s += `<path d="M194 -98 C226 -112 264 -112 296 -100 L298 -56 C266 -46 226 -48 198 -56Z" fill="url(#gPeleA)"/>`;
  s += `<g transform="translate(${f1(bx - 40)},${f1(by + 16)}) scale(1.22) translate(-40,-18)"><path d="M284 -124 C298 -150 346 -154 378 -132 C402 -116 408 -94 398 -80 C388 -64 352 -56 318 -60 C292 -64 280 -92 284 -124Z" fill="url(#gPeleA)"/>`;
  s += `<path d="M384 -100 C406 -96 418 -84 410 -72 C400 -66 386 -70 378 -80Z" fill="#CBBE8C"/><path d="M308 -86 Q344 -76 392 -82" fill="none" stroke="#2D2A14" stroke-width="3.2" opacity=".5" stroke-linecap="round"/>`;
  s += `<g transform="translate(346,-112) scale(1,${f1(clamp(1 - olho, .06, 1) * 100) / 100})"><ellipse rx="19" ry="17" fill="#2C2812"/><circle r="14" fill="url(#gEye)"/><circle cx="-4" cy="-5" r="5.4" fill="#fff"/><circle cx="5" cy="5" r="2.4" fill="#fff" opacity=".8"/></g><path d="M326 -124 Q346 -138 368 -124" fill="none" stroke="#3A3319" stroke-width="4" opacity=".5" stroke-linecap="round"/>`;
  if (pinta) s += `<ellipse cx="322" cy="-138" rx="13" ry="7" transform="rotate(-16 322 -138)" fill="#FFF1C8" opacity="${op(pinta)}"/>`;
  if (chora > 0) { const q = (resp * 2.3) % 1; s += `<g opacity="${op(chora)}"><path d="M340 -100 Q338 ${f1(-86 + 24 * q)} 342 ${f1(-80 + 34 * q)}" stroke="#DDF1FF" stroke-width="5" stroke-linecap="round" fill="none" opacity="${op(.9 - q * .6)}"/><circle cx="342" cy="${f1(-76 + 36 * q)}" r="${f1(6 - 3 * q)}" fill="#E8F6FF" opacity="${op(.95 - q)}"/><ellipse cx="338" cy="-98" rx="9" ry="4.5" fill="#CFEAFF" opacity=".7"/></g>`; }
  s += `</g>`;
  return s;
}

/* ===================== o ovo e a pilha de ovos ===================== */
function ovo(x, y, r, k = 1) {
  return `<g transform="translate(${f1(x)},${f1(y)})"><ellipse cx="${f1(r * .12)}" cy="${f1(r * .18)}" rx="${f1(r * 1.02)}" ry="${f1(r)}" fill="#1F1208" opacity="${op(.28 * k)}"/><circle r="${f1(r)}" fill="url(#gEggG)"/><ellipse cx="${f1(-r * .32)}" cy="${f1(-r * .36)}" rx="${f1(r * .28)}" ry="${f1(r * .16)}" transform="rotate(-30 ${f1(-r * .32)} ${f1(-r * .36)})" fill="#fff" opacity=".85"/><path d="M${f1(-r * .6)} ${f1(r * .1)} Q${f1(-r * .1)} ${f1(r * .5)} ${f1(r * .55)} ${f1(r * .28)}" stroke="#B5A98C" stroke-width="1.6" fill="none" opacity=".55"/></g>`;
}
// posições (hex) dentro de uma elipse: câmara dos ovos
function slotsOvos(cx, cy, rx, ry, r) {
  const P = [], dy = r * 1.72, dx = r * 2.04;
  for (let j = 0, y = cy + ry - r; y > cy - ry + r * .6; j++, y -= dy) for (let x = cx - rx - (j % 2) * dx / 2; x < cx + rx + 40; x += dx) {
    const u = (x - cx) / (rx - r), w = (y - cy) / (ry - r);
    if (u * u + w * w < 1) P.push([x + (hh(P.length, 31) - .5) * 3, y + (hh(P.length, 32) - .5) * 3, hh(P.length, 33)]);
  }
  return P;
}
/* os ovos chegam um a um: caem do cano de cima até a posição do monte (gravidade), e depois ficam; n(t) = quantos já caíram */
function pilhaOvos(t, t0, dur, cx, cy, rx, ry, r, topoY) {
  const P = slotsOvos(cx, cy, rx, ry, r), N = P.length; let s = '', caindo = '';
  const feitos = clamp((t - t0) / dur) * (N + 6);
  P.forEach((p, i) => {
    const ti = i / N * (dur * .94), tau = t - t0 - ti;
    if (tau < 0) return;
    const d = .2, q = clamp(tau / d), y = lerp(topoY, p[1], q * q), x = lerp(cx + (hh(i, 41) - .5) * 10, p[0], q * q);
    const e = ovo(x, y, r * (.98 + .04 * p[2]));
    if (q < 1) caindo += e; else s += e;
  });
  return { base: s, queda: caindo, n: Math.min(N, Math.floor(feitos)) };
}

/* ===================== a praia vista de cima ===================== */
// Mundo: x -300..1380; y: duna e mata (<520), areia seca (520-2350), areia molhada (2350-2750), espuma (2750-3050), mar (>3050).
// A lâmpada fica na beira esquerda (60,1560). O ninho, no meio da areia seca (540,900).
const NINHO = { x: 540, y: 900 }, LAMP = { x: 40, y: 1540 }, MAR_Y = 2860;
function praiaTopo(t, o = {}) {
  const { lamp = 0, y0 = -200, y1 = 4700 } = o;
  let s = `<rect x="-1600" y="${y0}" width="4300" height="${y1 - y0}" fill="url(#topoG)"/>`;
  // duna e mata
  s += `<path d="M-1600 -600 L2700 -600 L2700 430 Q1300 480 1000 440 T500 470 T-100 430 L-1600 460Z" fill="#12305A"/>`;
  for (let i = 0; i < 22; i++) { const x = -300 + i * 92 + hh(i, 71) * 40, y = 340 + hh(i, 72) * 110; for (let b = 0; b < 7; b++) { const a = -Math.PI / 2 + (b - 3) * .34 + Math.sin(t * 1.2 + i + b) * .06, h = 70 + hh(i * 9 + b, 73) * 70; s += `<path d="M${f1(x)} ${f1(y)} Q${f1(x + Math.cos(a) * h * .5)} ${f1(y + Math.sin(a) * h * .5 - 10)} ${f1(x + Math.cos(a) * h)} ${f1(y + Math.sin(a) * h)}" stroke="#0E2650" stroke-width="7" fill="none" stroke-linecap="round"/>`; } }
  // areia seca: ondulações e pedrinhas
  s += ondulacoes(560, 2300, 52, 21);
  for (let i = 0; i < 7; i++) { const x = -200 + hh(i, 81) * 1500, y = 700 + hh(i, 82) * 1500, a = (hh(i, 83) - .5) * 160, l = 70 + hh(i, 84) * 130; s += `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(a)})"><ellipse cx="8" cy="10" rx="${f1(l)}" ry="14" fill="#07102A" opacity=".35"/><rect x="${f1(-l)}" y="-11" width="${f1(l * 2)}" height="22" rx="11" fill="#5B4636"/><rect x="${f1(-l + 8)}" y="-9" width="${f1(l * 2 - 20)}" height="7" rx="3.5" fill="#9B7C5E" opacity=".7"/></g>`; }
  for (let i = 0; i < 30; i++) { const x = -250 + hh(i, 85) * 1600, y = 600 + hh(i, 86) * 1700, r = 6 + hh(i, 87) * 9; s += `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(hh(i, 88) * 360)})"><path d="M0 0 L${f1(-r)} ${f1(-r * 1.4)} Q0 ${f1(-r * 1.9)} ${f1(r)} ${f1(-r * 1.4)}Z" fill="#F5F0E6" opacity=".9"/><path d="M0 0 L${f1(-r * .5)} ${f1(-r * 1.6)} M0 0 L${f1(r * .5)} ${f1(-r * 1.6)}" stroke="#BDB39F" stroke-width="1.6" fill="none"/></g>`; }
  s += `<ellipse cx="900" cy="900" rx="900" ry="1400" fill="#fff" opacity=".1" filter="url(#b30)"/>`;
  // areia molhada, espuma e mar
  s += `<rect x="-1600" y="2350" width="4300" height="400" fill="url(#molhadaG)"/>`;
  for (let i = 0; i < 30; i++) s += `<ellipse cx="${f1(-300 + hh(i, 74) * 1700)}" cy="${f1(2370 + hh(i, 75) * 360)}" rx="${f1(30 + hh(i, 76) * 120)}" ry="3" fill="#CFE0FF" opacity="${op(.12 + .22 * (.5 + .5 * Math.sin(t * 1.4 + i)))}"/>`;
  const av = 40 * Math.sin(t * .8);                                                       // a onda avança e recua
  s += `<rect x="-1600" y="${f1(MAR_Y + av)}" width="4300" height="${f1(y1 - MAR_Y)}" fill="url(#marTopoG)"/>`;
  for (let k = 0; k < 4; k++) { const yy = MAR_Y + av - 40 + k * 18 + 10 * Math.sin(t * 1.1 + k); let d = `M-1600 ${f1(yy)}`; for (let x = -1600; x <= 2700; x += 70) d += ` L${x} ${f1(yy + 14 * Math.sin(x * .02 + t * 1.6 + k * 2) + 8 * Math.sin(x * .05 + t + k))}`; s += `<path d="${d}" fill="none" stroke="#F2F8FF" stroke-width="${f1(10 - k * 2)}" stroke-linejoin="round" opacity="${op(.75 - k * .14)}"/>`; }
  for (let i = 0; i < 46; i++) s += `<rect x="${f1(-300 + hh(i, 77) * 1700)}" y="${f1(MAR_Y + 80 + hh(i, 78) * 500)}" width="${f1(40 + hh(i, 79) * 180)}" height="5" rx="2.5" fill="#BFD8FF" opacity="${op(.12 + .3 * (.5 + .5 * Math.sin(t * 2 + i * 3)))}"/>`;
  // a lâmpada: poste visto de cima e o poço de luz laranja na areia
  if (lamp > 0) {
    s += `<circle cx="${LAMP.x}" cy="${LAMP.y}" r="${f1(1100 * lamp)}" fill="url(#gLamp)" opacity="${op(.75 * lamp)}"/>`;
  }
  s += `<g transform="translate(${LAMP.x},${LAMP.y})"><ellipse cx="18" cy="20" rx="84" ry="34" fill="#07102A" opacity=".4"/><circle r="46" fill="#2B2F3A"/><circle r="32" fill="${lamp > 0 ? '#FFEFC0' : '#555B6B'}"/><circle r="15" fill="${lamp > 0 ? '#fff' : '#3A3F4D'}"/>${lamp > 0 ? `<circle r="${f1(70 * lamp)}" fill="url(#gLamp)" opacity=".9"/>` : ''}</g>`;
  return s;
}
const EXTRA3 = `
<linearGradient id="topoG" gradientUnits="userSpaceOnUse" x1="0" y1="400" x2="0" y2="2400"><stop offset="0" stop-color="#9DB0DC"/><stop offset=".35" stop-color="#B9C9EA"/><stop offset="1" stop-color="#A3B6DE"/></linearGradient>
<linearGradient id="molhadaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8CA1CE"/><stop offset=".5" stop-color="#6A82B8"/><stop offset="1" stop-color="#5A74AC"/></linearGradient>
<linearGradient id="marTopoG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A82C4"/><stop offset=".35" stop-color="#1E5C9A"/><stop offset="1" stop-color="#0F3A70"/></linearGradient>
`;

/* rastro da mãe na areia: marcas das nadadeiras (duas fileiras) e o sulco do casco no meio, de A até a posição atual */
function rastro(pts, n, larg = 120) {
  if (n < 2) return '';
  let c = 'M' + pts.slice(0, n).map(p => `${f1(p[0])} ${f1(p[1])}`).join(' L'), m = '';
  for (let i = 3; i < n; i += 4) { const a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; [-1, 1].forEach(sd => { m += `<ellipse cx="${f1(b[0] + nx * larg * sd)}" cy="${f1(b[1] + ny * larg * sd)}" rx="30" ry="10" transform="rotate(${f1(Math.atan2(dy, dx) * 57.3 + sd * 24)} ${f1(b[0] + nx * larg * sd)} ${f1(b[1] + ny * larg * sd)})" fill="#4B5F96" opacity=".55"/><ellipse cx="${f1(b[0] + nx * larg * sd - 4)}" cy="${f1(b[1] + ny * larg * sd - 4)}" rx="26" ry="6" transform="rotate(${f1(Math.atan2(dy, dx) * 57.3 + sd * 24)} ${f1(b[0] + nx * larg * sd)} ${f1(b[1] + ny * larg * sd)})" fill="#E3ECFF" opacity=".5"/>`; }); }
  return `<path d="${c}" fill="none" stroke="#5A6FA6" stroke-width="30" stroke-linecap="round" stroke-linejoin="round" opacity=".42"/><path d="${c}" fill="none" stroke="#DCE6FF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity=".35" transform="translate(-14,-12)"/>` + m;
}
/* montinho do ninho visto de cima */
function montinho(x, y, r, brilho = 1) {
  return `<g transform="translate(${x},${y})"><ellipse cx="14" cy="18" rx="${f1(r * 1.1)}" ry="${f1(r * .86)}" fill="#07102A" opacity=".3"/><ellipse rx="${r}" ry="${f1(r * .78)}" fill="url(#gMound)"/><ellipse cx="${f1(-r * .25)}" cy="${f1(-r * .22)}" rx="${f1(r * .55)}" ry="${f1(r * .3)}" fill="#fff" opacity="${op(.28 * brilho)}"/></g>`;
}
const EXTRA4 = `<radialGradient id="gMound" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#EAF0FF"/><stop offset=".6" stop-color="#BDCDEE"/><stop offset="1" stop-color="#8FA3D2"/></radialGradient>`;

/* ===================== filhote de lado (dentro do ninho, nadando) ===================== */
// Olha para +x; origem no meio do casco. Escala 1 = casco de ~110. ph = fase (remada), bico = giro da cabeça para cima, cur = encolhido
function filhoteLado(o = {}) {
  const { ph = 0, a = 1, pinta = 0, cab = 0, nada = 0 } = o;
  const f = Math.sin(ph * 6.2832) * a, g = Math.cos(ph * 6.2832) * a;
  let s = `<g transform="translate(70,6) rotate(${f1(-20 - 38 * f + nada * 18)})"><path d="M0 0 C30 -6 62 10 74 30 C60 34 30 22 0 10Z" fill="url(#gPeleF)"/><path d="M0 0 C30 -6 62 10 74 30" fill="none" stroke="#E1EFD6" stroke-width="3.4" stroke-linecap="round" opacity=".8"/></g>`;
  s += `<g transform="translate(-44,16) rotate(${f1(150 + 14 * g)})"><path d="M0 0 C14 -3 30 6 38 20 C28 24 12 18 0 8Z" fill="url(#gPeleF)"/></g><path d="M-62 14 L-82 22 L-60 22Z" fill="#26372F"/>`;
  s += `<path d="M-64 14 C-64 -34 -34 -62 4 -62 C42 -62 74 -34 74 14 L66 24 L-56 24Z" fill="url(#gCascoF)"/><path d="M-64 14 C-64 -34 -34 -62 4 -62 C42 -62 74 -34 74 14" fill="none" stroke="#DCEACF" stroke-width="5" opacity=".85"/><path d="M-30 -52 Q-20 -10 -18 22 M18 -58 Q24 -14 22 22 M-52 -26 Q4 -52 56 -22" fill="none" stroke="#A9C3A8" stroke-width="2.6" opacity=".4"/>`;
  s += `<path d="M-60 24 L68 24 L58 34 L-50 34Z" fill="#C8D6BE"/>`;
  if (pinta) s += `<ellipse cx="86" cy="-14" rx="6.6" ry="3.8" transform="rotate(-20 86 -14)" fill="#FFF1C8"/>`;
  s += `<g transform="translate(66,-8) rotate(${f1(-6 + cab * 12)})"><path d="M0 8 C4 -14 26 -20 40 -8 C50 0 50 14 42 20 C30 26 6 26 0 8Z" fill="url(#gSkin)"/><path d="M36 4 C48 8 52 18 44 22 C38 22 34 14 34 8Z" fill="#CBBE8C" opacity=".95"/><circle cx="26" cy="-2" r="8.4" fill="url(#gEye)"/><circle cx="23" cy="-5" r="3" fill="#fff"/><circle cx="29" cy="2" r="1.4" fill="#fff" opacity=".8"/></g>`;
  return s;
}

/* ===================== caranguejo-fantasma visto de cima ===================== */
// olha para -y; escala 1 = carapaça de ~76 de largura. ph = passada; garra = quanto levanta a garra grande (0..1)
function caranguejo(o = {}) {
  const { ph = 0, garra = 0, sombra = 1 } = o;
  let s = '';
  if (sombra) s += `<ellipse cx="6" cy="10" rx="70" ry="52" fill="#07102A" opacity=".32"/>`;
  [-1, 1].forEach(sd => {
    for (let i = 0; i < 4; i++) {
      const w = Math.sin(ph * 6.2832 + i * 1.6 + (sd > 0 ? 0 : 3.1)) * 9, y0 = -4 + i * 11, x1 = sd * 62, y1 = y0 - 8 + i * 8 + w, x2 = sd * 94, y2 = y0 + 6 + i * 9 + w * .6;
      s += `<path d="M${sd * 26} ${y0} L${x1} ${f1(y1 - 14)} L${x2} ${f1(y2)}" stroke="#8A6F4A" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M${sd * 26} ${y0} L${x1} ${f1(y1 - 14)} L${x2} ${f1(y2)}" stroke="#EFC98F" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M${sd * 26} ${y0} L${x1} ${f1(y1 - 14)} L${x2} ${f1(y2)}" stroke="#F3E8CC" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>`;
    }
  });
  const grande = (sd, k, esc) => `<g transform="translate(${sd * 26},-26) rotate(${f1(sd * (-18 - 30 * k))})"><path d="M0 0 L${sd * 18} -42 L${sd * 24} -72" stroke="#8A6F4A" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 0 L${sd * 18} -42 L${sd * 24} -72" stroke="#EFC98F" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><g transform="translate(${sd * 24},-72) scale(${esc})"><path d="M${-sd * 6} 0 C${-sd * 26} -22 ${-sd * 8} -64 ${sd * 6} -58 C${sd * 14} -50 ${sd * 4} -24 ${sd * 6} 0Z" fill="#F2D3A0" stroke="#8A6F4A" stroke-width="3"/><path d="M${sd * 6} 0 C${sd * 24} -20 ${sd * 24} -50 ${sd * 10} -60 C${sd * 6} -40 ${sd * 6} -20 ${-sd * 2} 0Z" fill="#DDB982" stroke="#8A6F4A" stroke-width="3"/><path d="M${-sd * 6} 0 C${-sd * 26} -22 ${-sd * 8} -64 ${sd * 6} -58" fill="none" stroke="#F8EFD8" stroke-width="2.4" opacity=".8"/></g></g>`;
  s += grande(-1, garra, 1.25) + grande(1, garra * .4, .8);
  s += `<ellipse cx="0" cy="0" rx="43" ry="35" fill="#8A6F4A"/><ellipse cx="0" cy="0" rx="40" ry="32" fill="#EFC98F"/><ellipse cx="0" cy="2" rx="30" ry="22" fill="#D3BE92" opacity=".7"/><path d="M-26 -10 Q0 -26 26 -10" fill="none" stroke="#F8EFD8" stroke-width="3" opacity=".7"/>`;
  [-1, 1].forEach(sd => { s += `<path d="M${sd * 10} -28 L${sd * 15} -46" stroke="#D9C8A4" stroke-width="5" stroke-linecap="round"/><circle cx="${sd * 15}" cy="-48" r="7.4" fill="#0A0807"/><circle cx="${sd * 13}" cy="-50.5" r="2.4" fill="#fff"/>`; });
  return s;
}
/* sombra de uma ave passando: asas batendo, vista de cima; bem escura e macia */
function sombraAve(t, x, y, esc = 1) {
  const bat = Math.sin(t * 17) * .35, w = 250 * esc;
  const asa = sd => `<path d="M0 0 C${sd * w * .35} ${f1(-46 + bat * 70)} ${sd * w * .8} ${f1(-14 + bat * 110)} ${sd * w} ${f1(34 + bat * 150)} C${sd * w * .74} ${f1(46 + bat * 70)} ${sd * w * .36} ${f1(30)} 0 36Z"/>`;
  return `<g transform="translate(${f1(x)},${f1(y)})" filter="url(#b4)" opacity=".78" fill="#050B22"><ellipse cx="0" cy="8" rx="${f1(30 * esc)}" ry="${f1(72 * esc)}"/>${asa(-1)}${asa(1)}<path d="M-18 70 L0 150 L18 70Z"/></g>`;
}

/* ===================== debaixo d'água ===================== */
function aguaFundo(t, o = {}) {
  const { luz = 1 } = o;
  let s = `<rect x="-300" y="-400" width="1700" height="2800" fill="url(#aguaG)"/>`;
  s += `<rect x="-300" y="-400" width="1700" height="640" fill="url(#aguaTopo)"/>`;
  for (let i = 0; i < 9; i++) { const x = 40 + i * 130 + Math.sin(t * .6 + i) * 30; s += `<path d="M${f1(x)} -100 L${f1(x + 90)} -100 L${f1(x + 360 + Math.sin(t + i) * 40)} 1500 L${f1(x + 170)} 1500Z" fill="url(#raioG)" opacity="${op(.9 * luz)}"/>`; }
  for (let i = 0; i < 22; i++) { const y = 20 + i * 24 + 10 * Math.sin(t * 1.3 + i), k = i / 22; let d = `M-300 ${f1(y)}`; for (let x = -300; x <= 1400; x += 60) d += ` L${x} ${f1(y + 14 * Math.sin(x * .02 + t * 1.8 + i) * (1 - k))}`; s += `<path d="${d}" fill="none" stroke="#DFF1FF" stroke-width="${f1(3 + 3 * (1 - k))}" opacity="${op(.22 * (1 - k) * luz)}"/>`; }
  for (let i = 0; i < 16; i++) s += `<circle cx="${f1(hh(i, 151) * 1200 - 60 + Math.sin(t + i) * 12)}" cy="${f1(((hh(i, 152) * 2200 - t * (60 + 80 * hh(i, 153))) % 2200 + 2200) % 2200 - 200)}" r="${f1(2 + hh(i, 154) * 6)}" fill="#fff" opacity="${op(.18 + .25 * hh(i, 155))}"/>`;
  return s;
}
const EXTRA6 = `<linearGradient id="raioG" gradientUnits="userSpaceOnUse" x1="0" y1="-100" x2="0" y2="1500"><stop offset="0" stop-color="#CFE7FF" stop-opacity=".16"/><stop offset=".6" stop-color="#CFE7FF" stop-opacity=".05"/><stop offset="1" stop-color="#CFE7FF" stop-opacity="0"/></linearGradient><linearGradient id="aguaG" gradientUnits="userSpaceOnUse" x1="0" y1="-300" x2="0" y2="1900"><stop offset="0" stop-color="#2E8AB8"/><stop offset=".3" stop-color="#1B5C93"/><stop offset=".7" stop-color="#0F3A70"/><stop offset="1" stop-color="#091F4A"/></linearGradient>
<linearGradient id="aguaTopo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4F6FF" stop-opacity=".75"/><stop offset=".5" stop-color="#9ED6F0" stop-opacity=".25"/><stop offset="1" stop-color="#9ED6F0" stop-opacity="0"/></linearGradient>`;
function peixeSombra(x, y, esc, t, k = 1) {
  const b = Math.sin(t * 4) * 10;
  return `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(esc)})" opacity="${op(.7 * k)}" filter="url(#b4)"><path d="M-170 0 C-110 -64 40 -70 120 -14 C150 -2 170 -34 214 -62 C206 -24 206 24 214 62 C170 34 150 2 120 14 C40 70 -110 64 -170 0Z" fill="#06142F" transform="skewX(${f1(b * .2)})"/><path d="M-30 -62 L10 -118 L60 -60Z" fill="#06142F"/></g>`;
}

/* lua com fases (cheia -> minguante -> nova -> crescente) para o tempo passando */
function luaFase(x, y, r, f) {                       // f 0..1: 0 cheia, .5 nova
  const k = Math.cos(f * 6.2832), off = (1 - k) / 2 * r * 2.1 * (f < .5 ? 1 : -1);
  const id = nid('lf'); def(`<clipPath id="${id}"><circle cx="${x}" cy="${y}" r="${r}"/></clipPath>`);
  return `<circle cx="${x}" cy="${y}" r="${f1(r * 3.4)}" fill="url(#gMoon)" opacity="${op(.8 * (.2 + .8 * (1 + k) / 2))}"/><circle cx="${x}" cy="${y}" r="${r}" fill="#F7F9FF"/><g clip-path="url(#${id})"><circle cx="${f1(x + off)}" cy="${y}" r="${f1(r * 1.02)}" fill="#1B2D6E" opacity=".94"/></g>`;
}
/* estrelas girando em torno de um polo (longa exposição): riscos em arco */
function estrelasGiro(t, ang, n = 80) {
  let s = '';
  for (let i = 0; i < n; i++) { const r = 80 + hh(i, 181) * 1500, a0 = hh(i, 182) * 6.2832, arco = ang * (.4 + .6 * hh(i, 183)), px = 180, py = 120; const x0 = px + r * Math.cos(a0), y0 = py + r * Math.sin(a0), x1 = px + r * Math.cos(a0 + arco), y1 = py + r * Math.sin(a0 + arco); s += `<path d="M${f1(x0)} ${f1(y0)} A${f1(r)} ${f1(r)} 0 ${arco > Math.PI ? 1 : 0} 1 ${f1(x1)} ${f1(y1)}" fill="none" stroke="#EAF1FF" stroke-width="${f1(1.4 + hh(i, 184) * 2)}" opacity="${op(.35 + .5 * hh(i, 185))}" stroke-linecap="round"/>`; }
  return s;
}
