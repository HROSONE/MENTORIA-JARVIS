const SH = N.s.map(x => [x.k, x.a, x.b]);
const shotAt = t => SH.find(s => t >= s[1] && t < s[2]) || SH[SH.length - 1];
const loc = (t, id) => { const s = SH.find(x => x[0] === id); return { L: t - s[1], d: s[2] - s[1], k: (t - s[1]) / (s[2] - s[1]) }; };
const HH = (t, k = 1) => [3 * k * noise1(t * 1.3, 1), 3 * k * noise1(t * 1.1, 4)];
const GND = 1500;
/* ---------- texturas ---------- */
let PAPER = '', HATCH = '';
(function () {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); const im = x.createImageData(512, 512);
  const r = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };
  const vn = (u, v, s) => { const i = Math.floor(u / s), j = Math.floor(v / s), fu = u / s - i, fv = v / s - j, a = r(i % (512 / s), j % (512 / s)), b = r((i + 1) % (512 / s), j % (512 / s)), cc = r(i % (512 / s), (j + 1) % (512 / s)), d = r((i + 1) % (512 / s), (j + 1) % (512 / s)), su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv); return a + (b - a) * su + (cc - a) * sv + (a - b - cc + d) * su * sv; };
  for (let j = 0; j < 512; j++) for (let i = 0; i < 512; i++) { const n = vn(i, j, 64) * .45 + vn(i, j, 16) * .3 + vn(i, j, 4) * .15 + Math.random() * .1, k = (j * 512 + i) * 4, g = Math.floor(170 + n * 85); im.data[k] = g; im.data[k + 1] = Math.floor(g * .97); im.data[k + 2] = Math.floor(g * .9); im.data[k + 3] = 255; }
  x.putImageData(im, 0, 0);
  for (let f = 0; f < 260; f++) { x.strokeStyle = `rgba(90,70,50,${.05 + Math.random() * .08})`; x.lineWidth = .6 + Math.random(); x.beginPath(); const a = Math.random() * 512, b = Math.random() * 512, an = Math.random() * 6.3, l = 8 + Math.random() * 30; x.moveTo(a, b); x.quadraticCurveTo(a + Math.cos(an) * l / 2 + 4, b + Math.sin(an) * l / 2, a + Math.cos(an) * l, b + Math.sin(an) * l); x.stroke(); }
  PAPER = c.toDataURL('image/jpeg', .85);
})();
const TEXTURE = `<rect x="-100" y="-100" width="1280" height="2120" fill="url(#paperP)" style="mix-blend-mode:multiply" opacity=".55"/><rect x="-100" y="-100" width="1280" height="2120" fill="url(#paperP)" style="mix-blend-mode:soft-light" opacity=".5"/>`;


/* ---------- rua à noite ---------- */
/* ===================== Acoustic Kitty — o gato espião da CIA ===================== */
const bump = x => x < 0 || x > 1 ? 0 : Math.sin(x * Math.PI);
const ss = x => { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (x * 6 - 15) + 10); };   // smootherstep
const OL = '#1A1424';
const AT = k => S[k].a;
const CUTS = ['n2', 'n3', 'n5', 'n6', 'n7', 'n8', 'n9'].map(AT);
let TT = 0;
const TAG = (x, y, txt, s = 1, col = '#FFE04A') => `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(s * 100) / 100})"><rect x="${-txt.length * 15 - 22}" y="-40" width="${txt.length * 30 + 44}" height="68" rx="16" fill="#0A0810" opacity=".82"/><text x="0" y="13" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="44" fill="${col}">${txt}</text></g>`;
// traço contínuo com contorno (sem juntas): pontos → curva suave
function smoothD(P) { let d = `M${f1(P[0][0])} ${f1(P[0][1])}`; for (let i = 1; i < P.length - 1; i++) { const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2; d += ` Q${f1(P[i][0])} ${f1(P[i][1])} ${f1(mx)} ${f1(my)}`; } const L = P[P.length - 1]; return d + ` L${f1(L[0])} ${f1(L[1])}`; }
const stroke2 = (P, w, fill, ol = OL, extra = '') => `<path d="${smoothD(P)}" stroke="${ol}" stroke-width="${w + 11}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${smoothD(P)}" stroke="${fill}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${extra}`;
/* =========================================================================================
   PESSOAS (busto anime, braços em traço contínuo)
   ========================================================================================= */
const FACE = {
  chefe: { skin: '#E8C0A0', hair: '#2A2A30', hairStyle: 'penteado', iris: '#3A4A6A', eyeStyle: 'narrow', eyeH: 42, browW: 11, browA: 10, nose: 'sombra', mouth: 'reto', chin: 1.1, faceW: 1.02 },
  jovem: { skin: '#F2CCAA', hair: '#8A5A2A', hairStyle: 'curto', iris: '#3A6AC8', eyeH: 56, mouth: 'leve', browA: 0 },
  vet: { skin: '#E2B898', hair: '#C8C8D0', hairStyle: 'velho', iris: '#4A3A2A', eyeH: 46, glasses: 1, stache: 1, mouth: 'leve' },
  russo1: { skin: '#E8C4A4', hair: '#5A3A22', hairStyle: 'curto', iris: '#3A3A3A', eyeStyle: 'narrow', eyeH: 40, stache: 1, browW: 12, mouth: 'reto' },
  russo2: { skin: '#F0D0B0', hair: '#C8A060', hairStyle: 'penteado', iris: '#4A6A8A', eyeStyle: 'narrow', eyeH: 42, browW: 10, mouth: 'reto', chin: 1.08 },
  diretor: { skin: '#E8C0A0', hair: '#E8E8EC', hairStyle: 'penteado', iris: '#3A4A6A', eyeH: 48, glasses: 1, mouth: 'leve', browW: 10, browC: '#E8E8EC' },
};
// coat: cor do casaco; arms: [ [pontos braço esq], [pontos braço dir] ] em coords do busto; hat: chapéu fedora
function person(x, y, s, f, o = {}) {
  const coat = o.coat || '#5A5048', cd = mix(coat, '#000000', .28), shirt = o.shirt || '#F2F0EA';
  let g = `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(s * (o.flip || 1) * 1000) / 1000},${f1(s * 1000) / 1000})">`;
  const breathe = Math.sin(TT * 2.2 + (o.seed || 0)) * 5;
  const torso = `M-60 ${226 - breathe} Q-200 ${236 - breathe} -250 ${330 - breathe} Q-270 600 -240 1200 L240 1200 Q270 600 250 ${330 - breathe} Q200 ${236 - breathe} 60 ${226 - breathe}Z`;
  const armL = o.armL || [[-215, 330], [-260, 560], [-200, 780]], armR = o.armR || [[215, 330], [260, 560], [200, 780]];
  const handAt = (P) => { const L = P[P.length - 1], Q = P[P.length - 2], a = Math.atan2(L[1] - Q[1], L[0] - Q[0]) * 180 / Math.PI - 90; return `<g transform="translate(${f1(L[0])},${f1(L[1])}) rotate(${f1(a)})"><path d="M-30 -6 Q-36 44 -16 66 Q4 78 22 64 Q38 40 32 -6Z" fill="${f.skin}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><ellipse cx="34" cy="16" rx="11" ry="22" transform="rotate(-24 34 16)" fill="${f.skin}" stroke="${OL}" stroke-width="5"/></g>`; };
  if (o.backArm !== 0) g += stroke2(armR, 78, cd) + handAt(armR) + (o.itemR || '');
  g += `<path d="${torso}" fill="${coat}" stroke="${OL}" stroke-width="10" stroke-linejoin="round"/>`;
  g += `<path d="M-60 ${226 - breathe} L0 400 L60 ${226 - breathe}Z" fill="${shirt}" stroke="${OL}" stroke-width="5"/>${o.tie !== 0 ? `<path d="M-14 ${250 - breathe} L14 ${250 - breathe} L22 380 L0 420 L-22 380Z" fill="${o.tie || '#2A3A6A'}" stroke="${OL}" stroke-width="5"/>` : ''}`;
  g += `<path d="M-80 ${222 - breathe} L-10 460 L-150 330Z M80 ${222 - breathe} L10 460 L150 330Z" fill="${cd}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><path d="M200 340 Q236 700 230 1200" stroke="#000" stroke-width="70" fill="none" opacity=".12"/>`;
  if (o.lab) g = g.replace(`fill="${coat}"`, `fill="#F4F6F8"`);
  const hh = ANI.head(Object.assign({}, f, o.face || {})); def(ANI.flush());
  g += `<g transform="translate(${f1(o.hx || 0)},${f1((o.hy || 0) - breathe)}) rotate(${f1(o.tilt || 0)})">${hh}${o.hat ? `<g transform="translate(0,-120)"><ellipse cx="0" cy="12" rx="190" ry="34" fill="${o.hat}" stroke="${OL}" stroke-width="8"/><path d="M-120 14 Q-130 -110 0 -116 Q130 -110 120 14Z" fill="${o.hat}" stroke="${OL}" stroke-width="8"/><path d="M-120 -8 Q0 16 120 -8 L122 14 Q0 38 -122 14Z" fill="#1A1A20"/><path d="M-40 -110 Q0 -80 40 -110" stroke="${OL}" stroke-width="6" fill="none"/><path d="M-90 -80 Q-60 -100 -20 -96" stroke="#FFFFFF" stroke-width="6" fill="none" opacity=".25"/></g>` : ''}${o.headphones ? `<path d="M-130 -10 Q-140 -190 0 -196 Q140 -190 130 -10" stroke="#2A2A30" stroke-width="20" fill="none"/><rect x="-158" y="-40" width="50" height="90" rx="20" fill="#3A3A44" stroke="${OL}" stroke-width="6"/><rect x="108" y="-40" width="50" height="90" rx="20" fill="#3A3A44" stroke="${OL}" stroke-width="6"/>` : ''}</g>`;
  g += stroke2(armL, 78, coat) + handAt(armL) + (o.itemL || '');
  if (o.front) g += o.front;
  return g + '</g>';
}
const KCAM = (x, y, z, r = 0, shake = .6) => { const [hx, hy] = HH(TT, shake); setCam(x + hx, y + hy, z, r, [540, 960, 1]); };
/* =========================================================================================
   LARRY NA CADEIRA DE PRAIA (vista de frente, sentado). Origem = centro do assento.
   ========================================================================================= */
const LARRY = { skin: '#F0C49C', hair: '#6A3A1A', hairStyle: 'curto', iris: '#4A6A9A', eyeH: 56, stache: 1, browW: 10, mouth: 'grande', emo: 'feliz' };
const BAL = Array.from({ length: 42 }, (_, i) => { let r = (i * 9301 + 49297) % 233280 / 233280, r2 = (i * 4093 + 1777) % 1000 / 1000; const a = i * 2.39996, rad = Math.sqrt(i / 42); return { x: Math.cos(a) * rad * 330, y: -1380 + Math.sin(a) * rad * 330, r: 62 + r * 26, c: ['#F2F2EC', '#FFFDF4', '#E8E8F2'][i % 3], ph: r2 * 6.28 }; }).sort((a, b) => a.y - b.y);
function balloons(n, t, o = {}) {   // n balões restantes (os primeiros somem primeiro); stretch para cima ao subir rápido
  const st = o.stretch || 0, pop = o.popping;   // pop: {i, k}
  let s = '';
  const live = BAL.slice(0, n);
  live.forEach(b => s += `<path d="M${b.x < 0 ? -196 : 196} -468 Q${f1((b.x < 0 ? -240 : 240) + 10 * Math.sin(t + b.ph))} ${f1((b.y - 470) / 2)} ${f1(b.x + 6 * Math.sin(t * 1.3 + b.ph))} ${f1(b.y * (1 + st * .15) + b.r)}" stroke="#D8D8E0" stroke-width="3" fill="none" opacity=".9"/>`);
  live.forEach(b => { const bx = b.x + 6 * Math.sin(t * 1.3 + b.ph), by = b.y * (1 + st * .15) + 4 * Math.sin(t * 1.7 + b.ph); s += `<g transform="translate(${f1(bx)},${f1(by)})"><ellipse rx="${f1(b.r)}" ry="${f1(b.r * (1.08 + st * .1))}" fill="${b.c}" stroke="${OL}" stroke-width="6"/><ellipse cx="${f1(-b.r * .3)}" cy="${f1(-b.r * .35)}" rx="${f1(b.r * .28)}" ry="${f1(b.r * .18)}" fill="#FFFFFF" transform="rotate(-30 ${f1(-b.r * .3)} ${f1(-b.r * .35)})"/><path d="M${f1(b.r * .2)} ${f1(b.r * .6)} Q${f1(b.r * .6)} ${f1(b.r * .1)} ${f1(b.r * .5)} ${f1(-b.r * .3)}" stroke="#B8BCCA" stroke-width="6" fill="none" opacity=".5"/><path d="M-8 ${f1(b.r * 1.06)} l8 14 l8 -14Z" fill="${b.c}" stroke="${OL}" stroke-width="4"/></g>`; });
  if (pop) { const b = BAL[pop.i]; if (b && pop.k > 0 && pop.k < 1) s += `<g transform="translate(${f1(b.x)},${f1(b.y)})">${Array.from({ length: 10 }, (_, j) => { const a = j * .628, r = b.r * (1 + pop.k * 1.6); return `<path d="M${f1(Math.cos(a) * r * .6)} ${f1(Math.sin(a) * r * .6)} L${f1(Math.cos(a) * r)} ${f1(Math.sin(a) * r)}" stroke="#FFE04A" stroke-width="10" stroke-linecap="round" opacity="${op(1 - pop.k)}"/>`; }).join('')}<path d="M-40 -10 l20 -30 l10 24 l30 -20 l-10 30 l30 10 l-30 10Z" fill="#F2F2EC" stroke="${OL}" stroke-width="4" opacity="${op(1 - pop.k)}" transform="scale(${f1(1 + pop.k)})"/></g>`; }
  return s;
}
function chairBack() { return `<path d="M-200 -440 Q-210 -460 -190 -470 L190 -470 Q210 -460 200 -440 L210 30 L-210 30Z" fill="#9AB8C8" stroke="${OL}" stroke-width="8"/>${Array.from({ length: 7 }, (_, i) => `<rect x="-190" y="${-450 + i * 66}" width="380" height="34" fill="${i % 2 ? '#2A8A9A' : '#F2C040'}" opacity=".95"/>`).join('')}${Array.from({ length: 6 }, (_, i) => `<rect x="${-180 + i * 66}" y="-460" width="28" height="480" fill="${i % 2 ? '#F2F2EC' : '#2A8A9A'}" opacity=".55"/>`).join('')}<path d="M-210 -470 V40 M210 -470 V40" stroke="#C8CCD4" stroke-width="22"/><path d="M-210 -470 V40 M210 -470 V40" stroke="${OL}" stroke-width="28" opacity=".0"/>`; }
function chairFront(label) { return `<path d="M-240 20 L240 20 L250 70 L-250 70Z" fill="#2A8A9A" stroke="${OL}" stroke-width="7"/><path d="M-230 70 L-260 330 M230 70 L260 330 M-230 70 L-150 330 M230 70 L150 330" stroke="#C8CCD4" stroke-width="20" stroke-linecap="round"/><path d="M-250 -150 H-170 M170 -150 H250" stroke="#C8CCD4" stroke-width="22" stroke-linecap="round"/>${label ? `<g transform="translate(0,48)"><rect x="-150" y="-20" width="300" height="40" rx="8" fill="#F4ECD8" stroke="${OL}" stroke-width="4"/><text x="0" y="12" text-anchor="middle" font-family="'DejaVu Serif',serif" font-weight="700" font-size="26" fill="${OL}">INSPIRAÇÃO I</text></g>` : ''}`; }
// o: armL/armR pontos; face extras; items (no colo); legSwing; frost; gun
function larry(x, y, s, o = {}) {
  const t = TT, shirt = '#3A6AB8', jeans = '#2A4470', skin = LARRY.skin;
  const sw = o.legSwing === undefined ? Math.sin(t * 2.2) * 14 : o.legSwing;
  let g = `<g transform="translate(${f1(x)},${f1(y)}) scale(${s}) rotate(${f1(o.rot || 0)})">`;
  g += chairBack();
  // tronco: pescoço, ombros caídos, peito afinando até a cintura, quadril sentado
  const br = Math.sin(t * 2.4) * 3;
  const tor = `M-36 ${-500 - br} Q-60 ${-478 - br} -150 ${-452 - br} Q-176 ${-440 - br} -170 ${-396 - br} Q-150 -300 -112 -200 Q-104 -120 -122 -60 Q-130 -20 -110 0 L110 0 Q130 -20 122 -60 Q104 -120 112 -200 Q150 -300 170 ${-396 - br} Q176 ${-440 - br} 150 ${-452 - br} Q60 ${-478 - br} 36 ${-500 - br}Z`;
  g += `<rect x="-30" y="${-560 - br}" width="60" height="90" fill="${mix(skin, '#B06040', .18)}" stroke="${OL}" stroke-width="7"/>`;
  g += `<path d="${tor}" fill="${shirt}" stroke="${OL}" stroke-width="8" stroke-linejoin="round"/>`;
  g += `<path d="M-36 ${-500 - br} L0 ${-440 - br} L36 ${-500 - br}" stroke="${OL}" stroke-width="6" fill="${mix(shirt, '#000000', .25)}"/><path d="M60 ${-440 - br} Q120 -300 100 -40" stroke="${mix(shirt, '#000000', .2)}" stroke-width="26" fill="none" opacity=".5"/><path d="M-110 -40 Q0 -20 110 -40" stroke="${mix(shirt, '#000000', .25)}" stroke-width="6" fill="none"/><rect x="-112" y="-46" width="224" height="22" fill="#3A2A1A" stroke="${OL}" stroke-width="5"/><rect x="-16" y="-48" width="32" height="26" fill="#C8A040" stroke="${OL}" stroke-width="4"/>`;
  g += `<text x="0" y="-250" text-anchor="middle" font-family="'DejaVu Serif',serif" font-style="italic" font-weight="700" font-size="30" fill="#F2F2EC">Hryz</text><text x="0" y="-214" text-anchor="middle" font-family="'DejaVu Serif',serif" font-style="italic" font-weight="700" font-size="22" fill="#F2F2EC">Animation</text>`;
  // pernas sentadas (coxas em escorço, joelhos, canelas, tênis)
  [-1, 1].forEach(sd => {
    const swing = (sd > 0 ? sw : -sw);
    g += `<path d="M${sd * 8} -10 Q${sd * 120} -20 ${sd * 120} 30 Q${sd * 118} 76 ${sd * 64} 80 Q${sd * 10} 76 ${sd * 6} 30Z" fill="${jeans}" stroke="${OL}" stroke-width="7" stroke-linejoin="round"/>`;
    g += `<ellipse cx="${sd * 66}" cy="48" rx="46" ry="34" fill="${mix(jeans, '#FFFFFF', .12)}" stroke="${OL}" stroke-width="6"/>`;
    const kx = sd * 66, fx = kx + swing * .5, fy = 290 + swing * .3;
    g += `<path d="M${kx - 40} 60 Q${kx - 46} 180 ${fx - 34} ${fy} L${fx + 34} ${fy} Q${kx + 46} 180 ${kx + 40} 60Z" fill="${mix(jeans, '#000000', .1)}" stroke="${OL}" stroke-width="7" stroke-linejoin="round"/>`;
    g += `<path d="M${fx - 46} ${fy - 6} Q${fx - 54} ${fy + 44} ${fx} ${fy + 46} Q${fx + 54} ${fy + 44} ${fx + 46} ${fy - 6}Z" fill="#E8E2D8" stroke="${OL}" stroke-width="7"/><path d="M${fx - 40} ${fy + 30} H${fx + 40}" stroke="#B8B0A0" stroke-width="6"/>`;
  });
  g += chairFront(o.label);
  if (o.lap) g += o.lap;
  // braços (traço contínuo) + mãos
  const armL = o.armL || [[-150, -420], [-178, -250], [-110, -110]], armR = o.armR || [[150, -420], [178, -250], [110, -110]];
  const hand = (P, item) => { const L = P[P.length - 1], Q = P[P.length - 2], a = Math.atan2(L[1] - Q[1], L[0] - Q[0]) * 180 / Math.PI - 90; return `<g transform="translate(${f1(L[0])},${f1(L[1])}) rotate(${f1(a)})">${item || ''}<path d="M-22 -4 Q-28 34 -12 50 Q2 58 16 48 Q28 30 24 -4Z" fill="${skin}" stroke="${OL}" stroke-width="5"/><ellipse cx="26" cy="12" rx="8" ry="16" transform="rotate(-24 26 12)" fill="${skin}" stroke="${OL}" stroke-width="4"/></g>`; };
  g += stroke2(armL, 46, shirt) + hand(armL, o.itemL) + stroke2(armR, 46, shirt) + hand(armR, o.itemR);
  // cabeça
  const hh = ANI.head(Object.assign({}, LARRY, o.face || {})); def(ANI.flush());
  g += `<g transform="translate(${f1(o.hx || 0)},${f1(-720 - br + (o.hy || 0))}) scale(.82) rotate(${f1(o.tilt || 0)})">${hh}<g transform="translate(0,-120)"><path d="M-118 10 Q-120 -120 0 -126 Q120 -120 118 10Z" fill="#C8402A" stroke="${OL}" stroke-width="8"/><path d="M-20 0 L170 10 L160 40 L-20 30Z" fill="#A8301E" stroke="${OL}" stroke-width="7"/><circle cx="0" cy="-122" r="12" fill="#F2F2EC" stroke="${OL}" stroke-width="4"/></g>${o.frost ? `<g opacity="${op(o.frost)}"><path d="M-60 -30 l10 -14 l10 14 M40 -40 l10 -14 l10 14" stroke="#BFE4FF" stroke-width="6" fill="none"/><path d="M-50 150 Q0 170 50 150" stroke="#BFE4FF" stroke-width="10" fill="none"/></g><ellipse cx="0" cy="40" rx="96" ry="110" fill="#8AC8FF" opacity="${op(o.frost * .25)}"/>` : ''}</g>`;
  return g + '</g>';
}
// itens do colo
const BEER = `<g transform="rotate(-10)"><rect x="-24" y="-90" width="48" height="90" rx="10" fill="#C89A3A" stroke="${OL}" stroke-width="5"/><rect x="-24" y="-60" width="48" height="30" fill="#F2F2EC"/><rect x="-14" y="-108" width="28" height="20" fill="#E8E8EC" stroke="${OL}" stroke-width="4"/></g>`;
const GUN = `<g transform="rotate(-80)"><rect x="-12" y="-300" width="24" height="230" rx="6" fill="#3A3A40" stroke="${OL}" stroke-width="5"/><path d="M-16 -80 L-30 40 L30 50 L16 -80Z" fill="#8A5A2A" stroke="${OL}" stroke-width="5"/></g>`;
const LAPITEMS = [
  (k) => `<g transform="translate(-120,-20) scale(${f1(k)})"><path d="M-60 0 Q0 -40 60 0 L60 30 L-60 30Z" fill="#E8C080" stroke="${OL}" stroke-width="5"/><path d="M-60 10 Q0 -20 60 10" stroke="#6AA84A" stroke-width="10" fill="none"/><path d="M-60 20 H60" stroke="#C8402A" stroke-width="8"/></g>`,
  (k) => `<g transform="translate(-30,-40) scale(${f1(k)})"><path d="M-22 0 Q-30 -60 -14 -110 L14 -110 Q30 -60 22 0Z" fill="#5A2A1A" stroke="${OL}" stroke-width="5"/><rect x="-24" y="-70" width="48" height="26" fill="#C8202A"/><rect x="-10" y="-126" width="20" height="18" fill="#C8202A" stroke="${OL}" stroke-width="3"/></g>`,
  (k) => `<g transform="translate(60,-30) scale(${f1(k)})">${BEER}</g>`,
  (k) => `<g transform="translate(150,-20) scale(${f1(k)})"><rect x="-50" y="-40" width="100" height="70" rx="10" fill="#2A2A30" stroke="${OL}" stroke-width="5"/><circle cx="0" cy="-5" r="24" fill="#5A7A9A" stroke="#C8CCD4" stroke-width="6"/><rect x="20" y="-56" width="24" height="16" fill="#3A3A40"/></g>`,
  (k) => `<g transform="translate(-190,-200) scale(${f1(k)})"><rect x="-60" y="-80" width="120" height="160" rx="20" fill="#3A6A3A" stroke="${OL}" stroke-width="6"/><path d="M-60 -20 H60 M0 -80 V80" stroke="#2A4A2A" stroke-width="6"/></g>`,
  (k) => `<g transform="translate(40,-80) scale(${f1(k)})">${GUN}</g>`];
/* ---------- cenários ---------- */
function backyard(t) {
  let s = `<rect x="-3000" y="-3000" width="9000" height="9000" fill="#9ACDEE"/>` + [0, 1, 2].map(i => `<g transform="translate(${f1(((i * 700 + t * 20) % 2600) - 800)},${200 + i * 110})"><ellipse rx="200" ry="56" fill="#FFF"/><ellipse cx="80" cy="-30" rx="120" ry="50" fill="#FFF"/></g>`).join('');
  s += `<rect x="-3000" y="900" width="9000" height="300" fill="#E8D8B8"/>${Array.from({ length: 30 }, (_, i) => `<rect x="${-1500 + i * 160}" y="900" width="14" height="300" fill="#C8B898"/>`).join('')}<path d="M-3000 900 H6000" stroke="#B8A888" stroke-width="16"/>`;
  s += `<g transform="translate(-200,920)"><rect x="-300" y="-500" width="600" height="500" fill="#F2E2C8" stroke="${OL}" stroke-width="8"/><path d="M-340 -500 L0 -720 L340 -500Z" fill="#B8402A" stroke="${OL}" stroke-width="8"/><rect x="-200" y="-380" width="140" height="140" fill="#BFE0F8" stroke="${OL}" stroke-width="6"/><rect x="60" y="-260" width="120" height="260" fill="#8A5A34" stroke="${OL}" stroke-width="6"/></g>`;
  s += `<rect x="-3000" y="1200" width="9000" height="3000" fill="#7AB84A"/>${Array.from({ length: 50 }, (_, i) => `<path d="M${-1500 + i * 90} ${1260 + (i % 5) * 80} l8 -26 l8 26" stroke="#5A9A3A" stroke-width="5" fill="none"/>`).join('')}`;
  return s;
}
function jeep(x, y, s) { return `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="8" rx="360" ry="30" fill="#000" opacity=".3" filter="url(#b12)"/><path d="M-340 -60 L-340 -260 L-120 -260 L-80 -380 L160 -380 L180 -260 L340 -240 L340 -60Z" fill="#5A7A3A" stroke="${OL}" stroke-width="9" stroke-linejoin="round"/><path d="M-60 -360 L-90 -270 L150 -270 L140 -360Z" fill="#9AC0D8" stroke="${OL}" stroke-width="6"/>${[-200, 210].map(wx => `<g transform="translate(${wx},-60)"><circle r="78" fill="#1A1A20" stroke="${OL}" stroke-width="7"/><circle r="34" fill="#A8ACB4" stroke="${OL}" stroke-width="5"/></g>`).join('')}</g>`; }
function truck(x, y, s) { return `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="8" rx="620" ry="34" fill="#000" opacity=".3" filter="url(#b12)"/><rect x="-600" y="-520" width="760" height="440" rx="10" fill="#F2F2EC" stroke="${OL}" stroke-width="10"/><text x="-220" y="-330" text-anchor="middle" font-family="'DejaVu Serif',serif" font-style="italic" font-weight="700" font-size="70" fill="#C8402A">Hryz Animation</text><text x="-220" y="-250" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="34" fill="#5A5A60">TRANSPORTES</text><path d="M170 -80 L170 -420 L420 -420 L520 -260 L560 -240 L560 -80Z" fill="#C8402A" stroke="${OL}" stroke-width="10" stroke-linejoin="round"/><path d="M200 -400 L400 -400 L480 -270 L200 -270Z" fill="#9AC0D8" stroke="${OL}" stroke-width="7"/>${[-440, -240, 400].map(wx => `<g transform="translate(${wx},-70)"><circle r="84" fill="#1A1A20" stroke="${OL}" stroke-width="7"/><circle r="36" fill="#A8ACB4" stroke="${OL}" stroke-width="5"/></g>`).join('')}</g>`; }
function skyHigh(t, alt, o = {}) {   // alt 0..1: do chão às alturas
  const c1 = mix('#9ACDEE', '#2A5AA8', alt), c2 = mix('#E8F4FA', '#9AC8F0', alt), id = nid('sh');
  def(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`);
  let s = `<rect x="-3000" y="-3000" width="9000" height="9000" fill="url(#${id})"/>`;
  // cidade lá embaixo (some com a altura)
  if (alt < .9) { const sc = 1 - alt * .9; s += `<g transform="translate(540,${f1(1700 + alt * 1400)}) scale(${f1(sc)})" opacity="${op(1 - alt)}">${Array.from({ length: 26 }, (_, i) => `<rect x="${-1300 + i * 100}" y="${-80 - (i * 37) % 160}" width="80" height="${80 + (i * 37) % 160}" fill="${['#C8B8A0', '#A8B0C0', '#D8C8B0'][i % 3]}" stroke="${OL}" stroke-width="3"/>`).join('')}<rect x="-1500" y="0" width="3000" height="400" fill="#6A9A4A"/><rect x="600" y="-30" width="900" height="200" fill="#3A6AA8"/></g>`; }
  // nuvens passando (para baixo quando sobe)
  const v = o.rise || 0;
  for (let i = 0; i < 10; i++) { const y = ((i * 260 + t * v * 400) % 2600) - 600, x = (i * 397) % 1500 - 200; s += `<g transform="translate(${x},${f1(y)})" opacity="${op(.4 + alt * .5)}"><ellipse rx="${220 + (i % 3) * 60}" ry="60" fill="#FFFFFF"/><ellipse cx="90" cy="-36" rx="120" ry="50" fill="#FFFFFF"/></g>`; }
  return s;
}
function airliner(x, y, s, o = {}) { return `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(s * (o.flip || 1) * 100) / 100},${s})"><path d="M-700 0 Q-700 -70 -560 -80 L520 -80 Q680 -70 720 0 Q680 60 520 60 L-560 60 Q-700 60 -700 0Z" fill="#F4F4F0" stroke="${OL}" stroke-width="10"/><path d="M-620 -70 L-700 -260 L-580 -260 L-480 -80Z" fill="#2A5AA8" stroke="${OL}" stroke-width="8"/><path d="M-100 20 L-420 260 L-300 260 L120 30Z" fill="#E0E0E8" stroke="${OL}" stroke-width="8"/>${Array.from({ length: 14 }, (_, i) => `<circle cx="${-440 + i * 64}" cy="-24" r="14" fill="#5A7AA8" stroke="${OL}" stroke-width="3"/>`).join('')}<path d="M560 -60 Q640 -54 660 -20 L560 -20Z" fill="#3A4A6A" stroke="${OL}" stroke-width="5"/>${o.faces ? [-120, -56].map(cx => `<circle cx="${cx}" cy="-24" r="12" fill="#F2C8A6"/><circle cx="${cx - 4}" cy="-28" r="3" fill="${OL}"/><circle cx="${cx + 4}" cy="-28" r="3" fill="${OL}"/><ellipse cx="${cx}" cy="-18" rx="4" ry="5" fill="${OL}"/>`).join('') : ''}<rect x="-640" y="0" width="1300" height="14" fill="#C8402A"/></g>`; }
/* ====================== CENAS ====================== */
// n1: gancho — ele nas alturas, cerveja na mão, avião passando
function s1(t) {
  TT = t; const { L, d, k } = loc(t, 'n1');
  KCAM(540, lerp(820, 760, k), lerp(.78, .86, k), 1.5 * Math.sin(L * .8), .4);
  let s = lay(.3, skyHigh(t, .8, { rise: .1 }));
  s += lay(.8, airliner(lerp(2400, -1500, range(L, .2, 4.8)), 230, .9, { faces: 1, flip: -1 }));
  s += lay(1, `<g transform="translate(540,1240)">${balloons(42, t)}${larry(0, 0, 1, { lap: LAPITEMS[0](1) + LAPITEMS[1](1), armR: [[150, -420], [260, -420], [200, -600]], itemR: `<g transform="translate(0,-20)">${BEER}</g>`, face: { mouth: 'grande', emo: 'feliz' }, label: 1 })}</g>`);
  if (L > 2.6) s += `<g transform="translate(540,250)">${TAG(0, 0, '4.900 m', 1.5 + .2 * bump(range(L, 2.6, 3)), '#FFE04A')}</g>`;
  return s + VIG(.7);
}
// n2: caminhoneiro; balões chegando (contador até 45)
function s2(t) {
  TT = t; const { L, d, k } = loc(t, 'n2');
  KCAM(lerp(640, 700, k), 1200, lerp(1.0, 1.1, k), 0, .4);
  let s = lay(.5, backyard(t)) + lay(1, truck(700, 1340, .62));
  { const hh = ANI.head(Object.assign({}, LARRY, { mouth: L > 1 ? 'grande' : 'leve', emo: 'feliz', look: L > 4 ? .5 : 0 })); def(ANI.flush()); const w = Math.sin(L * 8) * 14; s += lay(1, `<g transform="translate(880,1150)">${stroke2([[30, 30], [110, -10], [150, -110 + w]], 30, '#3A6AB8')}<g transform="translate(150,${f1(-120 + w)})"><path d="M-16 -2 Q-20 26 -8 38 Q2 44 12 36 Q20 22 18 -2Z" fill="${LARRY.skin}" stroke="${OL}" stroke-width="4"/></g><g transform="scale(.36)">${hh}<g transform="translate(0,-120)"><path d="M-118 10 Q-120 -120 0 -126 Q120 -120 118 10Z" fill="#C8402A" stroke="${OL}" stroke-width="8"/><path d="M-20 0 L170 10 L160 40 L-20 30Z" fill="#A8301E" stroke="${OL}" stroke-width="7"/></g></g></g>`); }
  const n = Math.round(lerp(0, 45, ss(range(L, 3.6, 7.2))));
  for (let i = 0; i < n; i++) { const c = i % 9, r = Math.floor(i / 9); s += lay(1, `<g transform="translate(${120 + c * 105 + (r % 2) * 50},${1500 - r * 64})"><rect x="-50" y="-30" width="100" height="60" fill="#E8D8B8" stroke="${OL}" stroke-width="4"/><path d="M-50 -30 L50 30 M50 -30 L-50 30" stroke="#C8B898" stroke-width="3"/><circle r="12" fill="#F2F2EC" stroke="${OL}" stroke-width="3"/></g>`); }
  s += lay(1, `<rect x="-400" y="1530" width="2000" height="600" fill="#7AB84A"/>`);
  if (L > 3.6) s += `<g transform="translate(540,300)">${TAG(0, 0, n + ' BALÕES', 1.4)}</g>`;
  return s + VIG(.7);
}
// n3: enche 42 balões; a cadeira ganha nome
function s3(t) {
  TT = t; const { L, d, k } = loc(t, 'n3');
  KCAM(540, lerp(980, 820, ss(k)), lerp(.6, .5, ss(k)), 0, .4);
  let s = lay(.5, backyard(t));
  const n = Math.round(lerp(0, 42, ss(range(L, .2, 4.0))));
  s += lay(1, jeep(-150, 1500, .55) + `<path d="M-60 1440 Q200 1600 540 1600" stroke="#C8A060" stroke-width="10" fill="none"/>` + `<g transform="translate(980,1500)"><rect x="-50" y="-260" width="100" height="260" rx="40" fill="#8AA0B8" stroke="${OL}" stroke-width="7"/><text x="0" y="-130" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="36" fill="#F2F2EC" transform="rotate(-90 0 -130)">HÉLIO</text><path d="M0 -260 Q-80 -400 -300 -480" stroke="#3A3A40" stroke-width="10" fill="none"/></g>`);
  s += lay(1, `<g transform="translate(540,1600)">${balloons(n, t)}${larry(0, 0, .9, { face: { mouth: 'grande', emo: L > 4 ? 'feliz' : 'neutro', look: -.3 }, label: L > 4.4, armL: L > 4.4 ? [[-150, -420], [-250, -500], [-210, -680]] : undefined })}</g>`);
  s += `<g transform="translate(540,300)">${TAG(0, 0, n + ' / 42 COM HÉLIO', 1.1)}</g>`;
  return s + VIG(.7);
}
// n4: os itens vão chegando no colo, um por um (o último: a espingarda)
function s4(t) {
  TT = t; const { L, d, k } = loc(t, 'n4');
  KCAM(540, lerp(1200, 1180, k), lerp(1.0, 1.15, ss(range(L, 6.8, 8.4))), 0, .4);
  let s = lay(.5, backyard(t));
  const TS = [.4, 1.2, 2.0, 2.9, 3.9, 6.0];
  let lap = ''; TS.forEach((tt, i) => { const p = ss(range(L, tt, tt + .45)); if (p > 0) lap += LAPITEMS[i](lerp(.2, 1, p) + .2 * bump(range(L, tt + .3, tt + .6))); });
  s += lay(1, `<g transform="translate(540,1500)">${balloons(42, t)}${larry(0, 0, .95, { lap, label: 1, face: { mouth: L > 6.0 ? 'smirk' : 'grande', emo: L > 6.0 ? 'neutro' : 'feliz' }, armR: L > 6.3 ? [[150, -420], [260, -300], [300, -460]] : undefined })}</g>`);
  const NM = ['SANDUÍCHE', 'COCA-COLA', 'CERVEJA', 'CÂMERA', 'PARAQUEDAS', 'ESPINGARDA DE CHUMBINHO'];
  const cur = TS.filter(x => L >= x).length - 1;
  if (cur >= 0) s += `<g transform="translate(540,300)">${TAG(0, 0, NM[cur], cur === 5 ? 1.0 : 1.3, cur === 5 ? '#FF8A6A' : '#FFE04A')}</g>`;
  return s + VIG(.7);
}
// n5: amarrado no jipe; a corda arrebenta e ele dispara pra cima
function s5(t) {
  TT = t; const { L, d, k } = loc(t, 'n5');
  const snap = 2.6, up = Math.max(0, L - snap);
  const yy = 1550 - (up > 0 ? Math.pow(up, 2) * 900 : 0);
  KCAM(540, L < snap ? 1150 : lerp(1150, yy - 400, ss(range(L, snap, snap + .6))), lerp(.6, .7, k), up > 0 ? 3 * Math.sin(L * 20) * Math.max(0, 1 - up) : 0, .4 + (up > 0 && up < .5 ? 2 : 0));
  let s = lay(.5, backyard(t));
  s += lay(1, jeep(-100, 1600, .55));
  const tug = L < snap ? 10 * Math.sin(L * 7) : 0;
  if (L < snap) s += lay(1, `<path d="M40 1520 Q300 ${f1(1560 + tug)} 450 1620" stroke="#C8A060" stroke-width="10" fill="none"/>`);
  else s += lay(1, `<path d="M40 1520 Q${f1(140 + up * 40)} ${f1(1600 + up * 200)} 200 ${f1(1700 + up * 100)}" stroke="#C8A060" stroke-width="10" fill="none"/><path d="M450 ${f1(yy + 60)} Q${f1(400)} ${f1(yy + 200)} 380 ${f1(yy + 260)}" stroke="#C8A060" stroke-width="10" fill="none"/>` + (up < .4 ? `<g transform="translate(300,1560)">${Array.from({ length: 8 }, (_, i) => `<path d="M0 0 L${f1(Math.cos(i * .785) * 80)} ${f1(Math.sin(i * .785) * 80)}" stroke="#FFE04A" stroke-width="10" stroke-linecap="round" opacity="${op(1 - up * 2.5)}"/>`).join('')}</g>` : ''));
  s += lay(1, `<g transform="translate(540,${f1(yy)})">${balloons(42, t, { stretch: up > 0 ? Math.min(1, up) : 0 })}${larry(0, 0, .9, { label: 1, lap: LAPITEMS.map(f => f(1)).join(''), face: up > 0 ? { mouth: 'grande', emo: 'choque' } : { mouth: 'grande', emo: 'feliz' }, armL: up > 0 ? [[-150, -420], [-300, -440], [-340, -620]] : undefined, armR: up > 0 ? [[150, -420], [300, -440], [340, -620]] : undefined, legSwing: up > 0 ? 40 * Math.sin(L * 14) : undefined })}</g>`);
  if (up > 0) s += `<g transform="translate(540,300)">${TAG(0, 0, 'A CORDA ARREBENTOU!', 1.1, '#FF6A6A')}</g>` + Array.from({ length: 12 }, (_, i) => `<path d="M${-60 + i * 100} ${((i * 173 + L * 2200) % 1920)} v120" stroke="#FFFFFF" stroke-width="6" opacity=".5"/>`).join('');
  return s + VIG(.7);
}
// n6: alturas — frio, altímetro, dois aviões passam
function s6(t) {
  TT = t; const { L, d, k } = loc(t, 'n6');
  KCAM(540, 980, lerp(.62, .7, k), 1.2 * Math.sin(L), .5);
  let s = lay(.3, skyHigh(t, lerp(.4, 1, ss(range(L, 0, 2))), { rise: lerp(1.2, .1, ss(range(L, 0, 2.4))) }));
  s += lay(.8, airliner(lerp(2600, -1900, range(L, 2.4, 4.8)), 520, 1, { faces: 1, flip: -1 }) + airliner(lerp(-2400, 2400, range(L, 4.2, 6.6)), 330, .7, { faces: 1 }));
  const alt = Math.round(lerp(300, 4900, ss(range(L, 0, 2.2))));
  s += lay(1, `<g transform="translate(540,1420)">${balloons(42, t)}${larry(0, 0, .9, { label: 1, lap: LAPITEMS.slice(0, 5).map(f => f(1)).join(''), frost: range(L, 1.6, 3), face: { mouth: L > 2.6 ? 'grande' : 'reto', emo: L > 3.2 ? 'choque' : 'neutro' }, armL: [[-150, -420], [-200, -220], [-60, -260]], armR: [[150, -420], [200, -220], [60, -260]] })}</g>`);
  s += `<g transform="translate(540,250)">${TAG(0, 0, alt.toLocaleString('pt-BR') + ' m', 1.4, alt > 4000 ? '#8AD0FF' : '#FFE04A')}</g>`;
  if (L > 1.6) s += Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 137 + t * 40) % 1080}" cy="${(i * 211 + t * 120) % 1920}" r="${3 + i % 3}" fill="#FFFFFF" opacity=".7"/>`).join('');
  return s + VIG(.75);
}
// n7: atira nos balões (um estoura por vez) e deixa a arma cair
function s7(t) {
  TT = t; const { L, d, k } = loc(t, 'n7');
  KCAM(540, lerp(1000, 1060, k), lerp(.68, .82, ss(range(L, 2, 6))), 0, .5);
  let s = lay(.3, skyHigh(t, .95, { rise: .05 }));
  const shots = [2.0, 2.7, 3.3, 3.9], drop = range(L, 4.6, 6.2);
  const popped = shots.filter(x => L > x + .1).length;
  const curShot = shots.findIndex(x => L > x && L < x + .5);
  const aimR = [[150, -420], [180, -560], [120, -760]];
  s += lay(1, `<g transform="translate(540,1460)">${balloons(42 - popped, t, curShot >= 0 ? { popping: { i: 41 - curShot, k: (L - shots[curShot]) / .5 } } : {})}${larry(0, 0, .9, { label: 1, lap: LAPITEMS.slice(0, 5).map(f => f(1)).join(''), armR: L < 4.6 ? aimR : [[150, -420], [240, -260], [280, -120]], armL: L < 4.6 ? [[-150, -420], [-20, -560], [80, -720]] : [[-150, -420], [-260, -420], [-300, -600]], itemR: L < 4.6 ? `<g transform="rotate(180)">${GUN}</g>` : '', face: { mouth: L > 4.8 ? 'grande' : 'reto', emo: L > 4.8 ? 'choque' : 'bravo' } })}</g>`);
  shots.forEach(x => { if (L > x && L < x + .12) s += `<circle cx="660" cy="700" r="60" fill="#FFE04A" opacity=".8"/>`; });
  if (drop > 0) s += lay(1, `<g transform="translate(${f1(800 + drop * 60)},${f1(1420 + drop * drop * 1400)}) rotate(${f1(drop * 520)})">${GUN}</g>`);
  if (L > 2) s += `<g transform="translate(540,250)">${TAG(0, 0, (42 - popped) + ' BALÕES', 1.3)}</g>`;
  if (drop > .2) s += `<g transform="translate(540,380)">${TAG(0, 0, 'OPS…', 1.3, '#FF8A6A')}</g>`;
  return s + VIG(.75);
}
// n8: descida lenta; enrosca no fio; faíscas; luzes do bairro apagam
function s8(t) {
  TT = t; const { L, d, k } = loc(t, 'n8');
  const dn = ss(range(L, 0, 2.6));
  KCAM(540, lerp(800, 900, dn), lerp(.66, .76, k), 0, .5);
  let s = lay(.5, backyard(t).replace('fill="#9ACDEE"', `fill="${mix('#9ACDEE', '#E8A870', .5)}"`));
  // postes e fios + casas com janelas acesas
  const dark = range(L, 3.0, 3.3);
  s += lay(1, Array.from({ length: 4 }, (_, i) => `<g transform="translate(${-200 + i * 420},1240)"><rect x="-120" y="-220" width="240" height="220" fill="#E8D8C0" stroke="${OL}" stroke-width="6"/><path d="M-140 -220 L0 -330 L140 -220Z" fill="#8A5A3A" stroke="${OL}" stroke-width="6"/><rect x="-70" y="-160" width="60" height="60" fill="${mix('#FFE07A', '#3A3A4A', dark)}" stroke="${OL}" stroke-width="4"/><rect x="20" y="-160" width="60" height="60" fill="${mix('#FFE07A', '#3A3A4A', dark)}" stroke="${OL}" stroke-width="4"/></g>`).join('') + `<path d="M-500 740 V1300 M1500 740 V1300" stroke="#5A3E2A" stroke-width="28"/><path d="M-500 760 Q500 ${f1(800 + 60 * range(L, 2.4, 3))} 1500 760" stroke="#1A1A20" stroke-width="9" fill="none"/>`);
  const by = lerp(200, 640, dn);
  s += lay(1, `<g transform="translate(540,${f1(by + 1180 - 200)})">${balloons(38, t)}${larry(0, 0, .55, { label: 1, face: { mouth: L > 2.6 ? 'grande' : 'leve', emo: L > 2.8 ? 'choque' : 'neutro' } })}</g>`);
  if (L > 2.6 && L < 3.4) s += lay(1, Array.from({ length: 10 }, (_, i) => { const p = ((L - 2.6) * 3 + i / 10) % 1; return `<path d="M${f1(540 + Math.cos(i) * p * 160)} ${f1(800 + Math.sin(i * 2) * p * 120)} l14 -10 l-6 18 l16 -6" stroke="#FFE04A" stroke-width="6" fill="none" opacity="${op(1 - p)}"/>`; }).join(''));
  if (dark > 0) s += `<rect width="1080" height="1920" fill="#0A0A20" opacity="${op(dark * .45)}"/>`;
  if (L > 3.3) s += `<g transform="translate(540,300)">${TAG(0, 0, 'SEM LUZ', 1.3, '#FFE04A')}</g>`;
  return s + VIG(.8);
}
// n9: pousa, polícia, multa de US$ 4.000, ele sorri; volta ao céu (loop)
function s9(t) {
  TT = t; const { L, d, k } = loc(t, 'n9');
  if (L < d - 1.6) {
    KCAM(lerp(560, 600, k), 1180, lerp(.8, .9, k), 0, .4);
    let s = lay(.5, backyard(t));
    s += lay(1, `<g transform="translate(400,1500)">${balloons(38, t)}${larry(0, 0, .7, { label: 1, face: { mouth: 'grande', emo: 'feliz' }, armL: [[-150, -420], [-260, -200], [-240, -40]], armR: [[150, -420], [260, -480], [200, -640]] })}</g>`);
    const pol = ss(range(L, .6, 2.0));
    s += lay(1, person(lerp(1400, 860, pol), 1060, .45, FACE.chefe, { coat: '#2A3A6A', tie: '#1A1A2A', hat: '#1A2448', face: { mouth: 'reto' }, armL: [[-215, 330], [-120, 520], [60, 600]], itemL: '' }) + `<g transform="translate(${f1(lerp(1400, 860, pol) - 30)},1300)"><rect x="-26" y="-34" width="52" height="64" rx="8" fill="#E8C040" stroke="${OL}" stroke-width="4"/></g>` + Array.from({ length: 8 }, (_, i) => `<circle cx="${700 + i * 70}" cy="${1330 + (i % 2) * 30}" r="${110 + (i % 3) * 14}" fill="#3A7A2A" stroke="${OL}" stroke-width="7"/><circle cx="${690 + i * 70}" cy="${1300 + (i % 2) * 30}" r="44" fill="#5A9A3A"/>`).join('') + `<path d="M620 1440 Q900 1380 1400 1440 L1400 2200 L620 2200Z" fill="#3A7A2A" stroke="${OL}" stroke-width="7"/>`);
    if (L > 2.4) s += `<g transform="translate(540,300)"><g transform="rotate(-6) scale(${f1(1 + .15 * bump(range(L, 2.4, 2.8)))})"><rect x="-260" y="-90" width="520" height="180" rx="12" fill="#F4ECD8" stroke="${OL}" stroke-width="7"/><text x="0" y="-30" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="32" fill="#7A1A1A">MULTA</text><text x="0" y="50" text-anchor="middle" font-family="'DejaVu Sans Mono',monospace" font-weight="700" font-size="72" fill="${OL}">US$ 4.000</text></g></g>`;
    return s + VIG(.7);
  }
  return s1(AT('n1') + 1.2 + (t - (AT('n9') + d - 1.6)));
}
const FN = { n1: s1, n2: s2, n3: s3, n4: s4, n5: s5, n6: s6, n7: s7, n8: s8, n9: s9 };

function frame(t) {
  D = []; uid = 0;
  const sh = shotAt(t);
  let body = FN[sh[0]](t);
  for (const c of CUTS.map(x => [0, x])) if (t >= c[1] && t < c[1] + .08) body += `<rect width="1080" height="1920" fill="#fff" opacity="${op(.2 * (1 - (t - c[1]) / .08))}"/>`;
  defsEl.innerHTML = STATIC + objDefs() + `<filter id="sil_lotito" x="-25%" y="-25%" width="150%" height="150%"><feFlood flood-color="#151925" result="c"/><feComposite in="c" in2="SourceAlpha" operator="in" result="s"/><feOffset in="SourceAlpha" dx="-9" dy="7" result="o"/><feComposite in="SourceAlpha" in2="o" operator="out" result="e"/><feGaussianBlur in="e" stdDeviation="2.2" result="eb"/><feFlood flood-color="#FFC27A" flood-opacity=".85"/><feComposite in2="eb" operator="in" result="rim"/><feMerge><feMergeNode in="s"/><feMergeNode in="rim"/></feMerge></filter><filter id="sil_medico" x="-25%" y="-25%" width="150%" height="150%"><feFlood flood-color="#B8642A" result="c"/><feComposite in="c" in2="SourceAlpha" operator="in" result="s"/><feOffset in="SourceAlpha" dx="-9" dy="7" result="o"/><feComposite in="SourceAlpha" in2="o" operator="out" result="e"/><feGaussianBlur in="e" stdDeviation="2.2" result="eb"/><feFlood flood-color="#FFE0B0" flood-opacity=".85"/><feComposite in2="eb" operator="in" result="rim"/><feMerge><feMergeNode in="s"/><feMergeNode in="rim"/></feMerge></filter><filter id="zapF" x="-30%" y="-30%" width="160%" height="160%"><feFlood flood-color="#F2F8FF"/><feComposite in2="SourceAlpha" operator="in" result="w"/><feGaussianBlur in="w" stdDeviation="14" result="g"/><feFlood flood-color="#6AB0FF"/><feComposite in2="g" operator="in" result="gb"/><feMerge><feMergeNode in="gb"/><feMergeNode in="w"/></feMerge></filter><filter id="manVol" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feOffset in="SourceAlpha" dx="-16" dy="8" result="o1"/><feComposite in="SourceAlpha" in2="o1" operator="out" result="e1"/><feGaussianBlur in="e1" stdDeviation="7" result="b1"/><feComposite in="b1" in2="SourceAlpha" operator="in" result="s1"/><feFlood flood-color="#1A1028" flood-opacity=".38"/><feComposite in2="s1" operator="in" result="sh"/><feOffset in="SourceAlpha" dx="7" dy="-7" result="o2"/><feComposite in="SourceAlpha" in2="o2" operator="out" result="e2"/><feGaussianBlur in="e2" stdDeviation="2.5" result="b2"/><feComposite in="b2" in2="SourceAlpha" operator="in" result="r1"/><feFlood flood-color="#FFF0D0" flood-opacity=".55"/><feComposite in2="r1" operator="in" result="rim"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="sh"/><feMergeNode in="rim"/></feMerge></filter><radialGradient id="gHot"><stop offset="0" stop-color="#FF3A1A" stop-opacity=".95"/><stop offset=".5" stop-color="#FF7A2A" stop-opacity=".6"/><stop offset="1" stop-color="#FFB03A" stop-opacity="0"/></radialGradient><filter id="bl6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
<linearGradient id="beamW2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF0C0" stop-opacity=".6"/><stop offset="1" stop-color="#FFF0C0" stop-opacity="0"/></linearGradient><pattern id="gridP" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0 L0 0 0 60" stroke="#2A4A6A" stroke-width="2" fill="none"/></pattern><pattern id="paperP" width="512" height="512" patternUnits="userSpaceOnUse"><image href="${PAPER}" width="512" height="512"/></pattern>
<pattern id="waveP" width="160" height="90" patternUnits="userSpaceOnUse"><path d="M10 30 q20 -14 40 0 t40 0 M90 70 q20 -14 40 0" stroke="#8AC0E8" stroke-width="3" fill="none"/></pattern>
<pattern id="dotP" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2" fill="#000" opacity=".25"/><circle cx="13" cy="12" r="1.5" fill="#000" opacity=".18"/></pattern>
<pattern id="wallP" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M60 10 L80 60 L60 110 L40 60Z" fill="none" stroke="#B8A888" stroke-width="3"/><circle cx="0" cy="0" r="8" fill="#C8B898"/><circle cx="120" cy="120" r="8" fill="#C8B898"/><circle cx="60" cy="60" r="5" fill="#C8B898"/></pattern>
<pattern id="woodP" width="300" height="70" patternUnits="userSpaceOnUse"><rect width="300" height="70" fill="none" stroke="#6A4A2A" stroke-width="3"/><path d="M10 25 q60 -8 120 0 t140 2 M20 50 q80 6 160 -2" stroke="#8A6A4A" stroke-width="2" fill="none"/></pattern>
<pattern id="brickP" width="80" height="40" patternUnits="userSpaceOnUse"><path d="M0 0 H80 M0 20 H80 M0 0 V20 M40 20 V40" stroke="#5A4A3A" stroke-width="3" fill="none"/></pattern>
<pattern id="crackP" width="260" height="200" patternUnits="userSpaceOnUse"><path d="M0 60 L70 40 L120 90 L200 60 L260 80 M70 40 L60 0 M120 90 L100 200 M200 60 L230 0 M120 90 L180 150 L260 140 M0 160 L60 150 L100 200" stroke="#7A4A20" stroke-width="5" fill="none"/></pattern>` + D.join('');
  root.innerHTML = body + TEXTURE;
}
