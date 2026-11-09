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
const CUTS = ['n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9'].map(AT);
let TT = 0;
const TAG = (x, y, txt, s = 1, col = '#FFE04A') => `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(s * 100) / 100})"><rect x="${-txt.length * 15 - 22}" y="-40" width="${txt.length * 30 + 44}" height="68" rx="16" fill="#0A0810" opacity=".82"/><text x="0" y="13" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="44" fill="${col}">${txt}</text></g>`;
// traço contínuo com contorno (sem juntas): pontos → curva suave
function smoothD(P) { let d = `M${f1(P[0][0])} ${f1(P[0][1])}`; for (let i = 1; i < P.length - 1; i++) { const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2; d += ` Q${f1(P[i][0])} ${f1(P[i][1])} ${f1(mx)} ${f1(my)}`; } const L = P[P.length - 1]; return d + ` L${f1(L[0])} ${f1(L[1])}`; }
const stroke2 = (P, w, fill, ol = OL, extra = '') => `<path d="${smoothD(P)}" stroke="${ol}" stroke-width="${w + 11}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${smoothD(P)}" stroke="${fill}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${extra}`;
/* =========================================================================================
   O GATO (cinza rajado, olhos verdes). Duas vistas: de frente (close) e de lado (corpo inteiro)
   ========================================================================================= */
const CAT = { fur: '#8A8E9C', furD: '#5E6272', furL: '#C4C8D2', belly: '#E8E6EE', stripe: '#4A4E5E', pink: '#F2A0B0', iris: '#6ACB6A', irisD: '#2A7A3A' };
function catEye(x, y, s, o) {
  const open = o.blink !== undefined ? 1 - o.blink : 1, pup = o.pupil || .32, lx = (o.lookX || 0) * 10, ly = (o.lookY || 0) * 8, id = nid('ce'), gid = nid('cg');
  def(`<clipPath id="${id}"><ellipse cx="0" cy="0" rx="58" ry="${f1(64 * open + .5)}"/></clipPath><radialGradient id="${gid}" cx=".5" cy=".7" r=".7"><stop offset="0" stop-color="#C8F08A"/><stop offset=".55" stop-color="${CAT.iris}"/><stop offset="1" stop-color="${CAT.irisD}"/></radialGradient>`);
  let g = `<g transform="translate(${f1(x)},${f1(y)}) scale(${s}) rotate(${o.rot || 0})">`;
  if (open < .08) return g + `<path d="M-58 4 Q0 30 58 4" stroke="${OL}" stroke-width="9" fill="none" stroke-linecap="round"/></g>`;
  g += `<ellipse cx="0" cy="0" rx="58" ry="${f1(64 * open)}" fill="#FAFAF4"/><g clip-path="url(#${id})"><circle cx="${f1(lx)}" cy="${f1(ly + 4)}" r="50" fill="url(#${gid})" stroke="${CAT.irisD}" stroke-width="4"/><ellipse cx="${f1(lx)}" cy="${f1(ly + 4)}" rx="${f1(46 * pup)}" ry="44" fill="#0A0A10"/><ellipse cx="${f1(lx - 18)}" cy="${f1(ly - 20)}" rx="17" ry="13" fill="#FFFFFF"/><circle cx="${f1(lx + 20)}" cy="${f1(ly + 26)}" r="7" fill="#FFFFFF" opacity=".9"/><rect x="-70" y="-80" width="140" height="30" fill="${CAT.furD}" opacity=".35"/></g>`;
  g += `<ellipse cx="0" cy="0" rx="58" ry="${f1(64 * open)}" fill="none" stroke="${OL}" stroke-width="7"/><path d="M-64 ${f1(-8 * open)} Q-30 ${f1(-74 * open)} 40 ${f1(-62 * open)} Q62 ${f1(-50 * open)} 70 ${f1(-30 * open)}" stroke="${OL}" stroke-width="12" fill="none" stroke-linecap="round"/>`;
  return g + '</g>';
}
// rosto de frente (close). o: blink, lookX, pupil, earL/earR (giro), mouth ('w'|'open'|'hiss'), wire (0..1 brilho), tilt
function catFace(x, y, s, o = {}) {
  const t = TT, eL = o.earL || 0, eR = o.earR || 0, gid = nid('cf');
  def(`<radialGradient id="${gid}" cx=".45" cy=".35" r=".75"><stop offset="0" stop-color="${CAT.furL}"/><stop offset=".6" stop-color="${CAT.fur}"/><stop offset="1" stop-color="${CAT.furD}"/></radialGradient>`);
  let g = `<g transform="translate(${f1(x)},${f1(y)}) scale(${s}) rotate(${f1(o.tilt || 0)})">`;
  const ear = (sd, rot) => `<g transform="translate(${sd * 170},-170) rotate(${f1(sd * 18 + rot)})"><path d="M-80 60 Q-60 -120 ${sd * 10} -170 Q70 -100 90 60 Q0 30 -80 60Z" fill="url(#${gid})" stroke="${OL}" stroke-width="9" stroke-linejoin="round"/><path d="M-46 44 Q-36 -70 ${sd * 6} -110 Q44 -60 56 44 Q0 26 -46 44Z" fill="${CAT.pink}"/>${[-20, 0, 20].map(k => `<path d="M${k} 40 q${-k * .3} -50 ${k * .2} -90" stroke="#FFFFFF" stroke-width="4" fill="none" opacity=".7"/>`).join('')}</g>`;
  g += ear(-1, eL) + ear(1, eR);
  // cabeça com tufos nas bochechas
  g += `<path d="M-250 40 Q-260 -190 0 -210 Q260 -190 250 40 Q290 70 250 110 Q280 140 220 170 Q150 250 0 250 Q-150 250 -220 170 Q-280 140 -250 110 Q-290 70 -250 40Z" fill="url(#${gid})" stroke="${OL}" stroke-width="10" stroke-linejoin="round"/>`;
  // listras
  g += `<path d="M-30 -200 Q-20 -140 -36 -100 M30 -200 Q20 -140 36 -100 M0 -206 L0 -130 M-200 -60 q50 10 70 40 M200 -60 q-50 10 -70 40 M-230 40 q60 0 80 30 M230 40 q-60 0 -80 30" stroke="${CAT.stripe}" stroke-width="16" fill="none" stroke-linecap="round" opacity=".75"/>`;
  // focinho claro
  g += `<path d="M-130 110 Q-120 40 0 40 Q120 40 130 110 Q120 220 0 230 Q-120 220 -130 110Z" fill="${CAT.belly}" opacity=".92"/>`;
  g += catEye(-105, -10, 1, o) + catEye(105, -10, 1, Object.assign({}, o, { rot: 0 }));
  // nariz e boca
  g += `<path d="M-26 70 L26 70 Q24 92 0 104 Q-24 92 -26 70Z" fill="#E87A8E" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><path d="M-12 76 q10 -6 22 0" stroke="#FFFFFF" stroke-width="4" fill="none" opacity=".7"/>`;
  const m = o.mouth || 'w';
  if (m === 'w') g += `<path d="M0 104 Q-10 140 -46 134 M0 104 Q10 140 46 134" stroke="${OL}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  else if (m === 'open') g += `<path d="M-50 124 Q0 112 50 124 Q40 190 0 196 Q-40 190 -50 124Z" fill="#7A2A3A" stroke="${OL}" stroke-width="7"/><path d="M-26 170 Q0 152 26 170 Q14 190 0 190 Q-14 190 -26 170Z" fill="#F27A8A"/><path d="M-40 126 l8 18 l8 -16 M24 124 l8 18 l8 -16" fill="#FFF" stroke="${OL}" stroke-width="3"/>`;
  else if (m === 'happy') g += `<path d="M-46 120 Q-24 150 0 120 Q24 150 46 120" stroke="${OL}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  // bigodes (balançam)
  const wv = Math.sin(t * 3) * 3;
  [-1, 1].forEach(sd => [0, 1, 2].forEach(k => g += `<path d="M${sd * 120} ${110 + k * 22} Q${sd * 220} ${f1(96 + k * 30 + wv)} ${sd * 320} ${f1(90 + k * 44 + wv)}" stroke="#F4F4F8" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M${sd * 120} ${110 + k * 22} Q${sd * 220} ${f1(96 + k * 30 + wv)} ${sd * 320} ${f1(90 + k * 44 + wv)}" stroke="${OL}" stroke-width="1.5" fill="none" opacity=".5"/>`));
  if (o.blush) g += `<ellipse cx="-160" cy="80" rx="34" ry="16" fill="#FF8AA0" opacity=".45"/><ellipse cx="160" cy="80" rx="34" ry="16" fill="#FF8AA0" opacity=".45"/>`;
  // equipamento: fio prateado do ouvido descendo pelo pelo
  if (o.wire) g += `<path d="M196 -230 Q220 -120 236 0 Q250 120 210 230" stroke="#D8E4F0" stroke-width="5" fill="none" opacity="${op(.4 + .6 * o.wire)}"/><circle cx="196" cy="-232" r="${f1(8 + 4 * o.wire)}" fill="#FF4A4A" opacity="${op(o.wire * (.5 + .5 * Math.sin(t * 8)))}"/><circle cx="196" cy="-232" r="26" fill="#FF6A6A" opacity="${op(o.wire * .25)}" filter="url(#b4)"/>`;
  return g + '</g>';
}
// gato de lado, virado para a direita; origem nas patas. o: pose 'walk'|'sit'|'loaf'|'pounce', ph, speed, tail, head (0 perfil .. 1 olhando a câmera), wire, blink
function catSide(x, y, s, o = {}) {
  const t = TT, ph = o.ph || 0, sp = o.speed === undefined ? (o.pose === 'walk' ? 1 : 0) : o.speed, pose = o.pose || 'walk';
  const sit = pose === 'sit' ? 1 : 0, crouch = o.crouch || 0, gid = nid('cs');
  def(`<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${CAT.furL}"/><stop offset=".45" stop-color="${CAT.fur}"/><stop offset="1" stop-color="${CAT.furD}"/></linearGradient>`);
  const bob = Math.abs(Math.sin(ph)) * 10 * sp, breathe = Math.sin(t * 2.4) * 4;
  let g = `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(s * (o.flip || 1) * 1000) / 1000},${f1(s * 1000) / 1000})"><ellipse cx="0" cy="6" rx="${sit ? 220 : 300}" ry="26" fill="#000" opacity=".22" filter="url(#b12)"/>`;
  // pontos-chave (andando x sentado)
  const hip = sit ? [-120, -150] : [-190, -250 + bob + crouch * 60], sh = sit ? [90, -330] : [150, -270 + bob + crouch * 80];
  // cauda: curva suave balançando
  const tw = Math.sin(t * (o.tailSpeed || 1.6)) * (o.tailAmp || 1), tail = sit
    ? [[hip[0] - 40, hip[1] + 60], [-260, -20], [-150 + 40 * tw, 10], [40 + 30 * tw, -6]]
    : [[hip[0] - 30, hip[1] - 10], [-330, -320 - 30 * tw], [-300 + 60 * tw, -470], [-230 + 80 * tw, -520 - 20 * tw]];
  g += stroke2(tail, 40, CAT.fur);
  g += `<path d="${smoothD(tail)}" stroke="${CAT.stripe}" stroke-width="40" fill="none" stroke-dasharray="18 34" opacity=".6"/>`;
  // pernas do fundo
  const leg = (bx, by, a, back, front) => { const c = back ? CAT.furD : CAT.fur, len = front ? 250 : 240; let P; if (sit && front) P = [[bx, by], [bx + 10, by + 120], [bx + 6, -10]]; else if (sit) P = [[bx, by], [bx + 120, by + 60], [bx + 60, -10]]; else { const sw = Math.sin(ph + a) * 50 * sp, lift = Math.max(0, Math.cos(ph + a)) * 40 * sp; P = front ? [[bx, by], [bx + sw * .4 + 6, by + len * .55], [bx + sw, -lift - 12]] : [[bx, by], [bx - 50 + sw * .3, by + len * .45], [bx + sw - 20, -lift - 12]]; } const paw = P[P.length - 1]; return stroke2(P, front ? 42 : 52, c) + `<ellipse cx="${f1(paw[0] + 16)}" cy="${f1(paw[1] + 2)}" rx="34" ry="18" fill="${back ? CAT.furD : CAT.belly}" stroke="${OL}" stroke-width="6"/>`; };
  g += leg(hip[0] + 30, hip[1] + 40, Math.PI, 1, 0) + leg(sh[0] - 10, sh[1] + 60, 0, 1, 1);
  // corpo
  const bodyD = sit
    ? `M${hip[0] - 110} ${hip[1] + 120} Q${hip[0] - 150} ${hip[1] - 60} ${sh[0] - 120} ${sh[1] - 30} Q${sh[0] + 40} ${sh[1] - 90} ${sh[0] + 90} ${sh[1] + 40} Q${sh[0] + 120} ${hip[1] + 60} ${sh[0] + 40} ${hip[1] + 140} Q${hip[0]} ${hip[1] + 170} ${hip[0] - 110} ${hip[1] + 120}Z`
    : `M${hip[0] - 90} ${hip[1] + 20} Q${hip[0] - 80} ${hip[1] - 100 - breathe} ${(hip[0] + sh[0]) / 2} ${hip[1] - 90 - breathe} Q${sh[0] + 60} ${sh[1] - 110 - breathe} ${sh[0] + 100} ${sh[1] - 10} Q${sh[0] + 90} ${sh[1] + 110} ${sh[0] - 10} ${sh[1] + 120} Q${(hip[0] + sh[0]) / 2} ${hip[1] + 150 + crouch * 20} ${hip[0] - 40} ${hip[1] + 120} Q${hip[0] - 100} ${hip[1] + 90} ${hip[0] - 90} ${hip[1] + 20}Z`;
  g += `<path d="${bodyD}" fill="url(#${gid})" stroke="${OL}" stroke-width="10" stroke-linejoin="round"/>`;
  const cid = nid('cb'); def(`<clipPath id="${cid}"><path d="${bodyD}"/></clipPath>`);
  g += `<g clip-path="url(#${cid})">${[0, 1, 2, 3, 4].map(k => { const xx = hip[0] - 40 + k * 70; return `<path d="M${xx} ${hip[1] - 140} q30 70 0 150" stroke="${CAT.stripe}" stroke-width="22" fill="none" stroke-linecap="round" opacity=".65"/>`; }).join('')}<path d="M${hip[0] - 120} ${hip[1] + 150} Q${(hip[0] + sh[0]) / 2} ${hip[1] + 60} ${sh[0] + 120} ${sh[1] + 150}" stroke="${CAT.belly}" stroke-width="70" fill="none" opacity=".75"/></g>`;
  // pernas da frente
  g += leg(hip[0] + 10, hip[1] + 50, 0, 0, 0) + leg(sh[0] + 10, sh[1] + 70, Math.PI, 0, 1);
  // cabeça (3/4): reaproveita o rosto de frente, menor, inclinado
  const hx = sh[0] + 90 + (sit ? -20 : 30), hy = sh[1] - (sit ? 160 : 110) + bob * .5 + breathe;
  g += `<g transform="translate(${f1(hx)},${f1(hy)}) scale(${f1((o.flip || 1) * 1000) / 1000},1)">${catFace(0, 0, .62, { blink: o.blink, lookX: o.lookX === undefined ? .8 : o.lookX, lookY: o.lookY || 0, pupil: o.pupil, mouth: o.mouth, earL: o.earL, earR: o.earR, tilt: o.tilt || 6, wire: o.wire, blush: o.blush })}</g>`;
  if (o.wire) g += `<path d="M${f1(hx + 110)} ${f1(hy - 120)} Q${sh[0] - 40} ${sh[1] - 30} ${(hip[0] + sh[0]) / 2} ${hip[1] - 80} Q${hip[0] - 40} ${hip[1] - 60} ${tail[1][0]} ${tail[1][1]} Q${tail[2][0]} ${tail[2][1]} ${tail[3][0]} ${tail[3][1]}" stroke="#E0EAF4" stroke-width="4" fill="none" opacity="${op(.35 + .5 * o.wire)}"/>`;
  return g + '</g>';
}
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
/* =========================================================================================
   CENÁRIOS
   ========================================================================================= */
function office(t, o = {}) {
  let s = `<rect x="-2000" y="-2000" width="6000" height="6000" fill="#3A2A20"/>`;
  s += `<rect x="-800" y="-400" width="2800" height="2000" fill="#5A3E2A"/>` + Array.from({ length: 16 }, (_, i) => `<rect x="${-800 + i * 180}" y="-400" width="10" height="2000" fill="#3E2A1C" opacity=".6"/>`).join('');
  // janela com persiana: listras de luz
  s += `<g transform="translate(700,200)"><rect x="-260" y="-200" width="520" height="560" fill="#1A2A4A" stroke="#2A1A10" stroke-width="20"/><path d="M-200 260 L-160 -100 L-60 -140 L0 -40 L80 -160 L200 -120 L220 260Z" fill="#2A3A5A"/>${Array.from({ length: 14 }, (_, i) => `<rect x="-260" y="${-200 + i * 40}" width="520" height="22" fill="#C8B898" opacity=".9"/>`).join('')}</g>`;
  s += `<path d="M450 400 L-400 1500 L200 1500 L960 400Z" fill="#FFE8B0" opacity=".08"/>` + Array.from({ length: 8 }, (_, i) => `<path d="M${460 + i * 60} 400 L${-300 + i * 110} 1500" stroke="#FFE8B0" stroke-width="24" opacity=".05"/>`).join('');
  // quadro com mapa da URSS e foto da embaixada
  s += `<g transform="translate(-160,300)"><rect x="-260" y="-180" width="520" height="360" fill="#C8B888" stroke="#3A2416" stroke-width="12"/><path d="M-220 40 Q-150 -120 -20 -90 Q120 -140 220 -60 L200 100 Q60 140 -80 110 Q-200 120 -220 40Z" fill="#C8402A" opacity=".75"/><text x="0" y="140" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="34" fill="#5A1A10">URSS</text><path d="M60 -20 L140 60 M140 -20 L60 60" stroke="#1A1A1A" stroke-width="8"/>${o.pins !== 0 ? [[-120, -40], [20, 0], [140, -60]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="10" fill="#FFE04A" stroke="${OL}" stroke-width="3"/>`).join('') : ''}</g>`;
  s += `<rect x="-2000" y="1300" width="6000" height="1200" fill="#2A1E16"/>`;
  return s;
}
function desk(t, o = {}) {
  let s = `<path d="M-800 1180 L1900 1180 L1900 1700 L-800 1700Z" fill="#6A4428" stroke="${OL}" stroke-width="10"/><path d="M-800 1180 L1900 1180 L1900 1220 L-800 1220Z" fill="#8A5A34"/>`;
  // abajur verde com cone de luz
  s += `<g transform="translate(1040,1180)"><rect x="-80" y="-24" width="160" height="24" rx="8" fill="#C8A040" stroke="${OL}" stroke-width="6"/><path d="M0 -24 L0 -240" stroke="#C8A040" stroke-width="16"/><path d="M-130 -240 Q-110 -340 0 -340 Q110 -340 130 -240Z" fill="#2A6A3A" stroke="${OL}" stroke-width="8"/><path d="M-130 -240 L-420 0 L420 0 L130 -240Z" fill="#FFF0B0" opacity=".14"/><ellipse cx="0" cy="-240" rx="120" ry="20" fill="#FFF0B0" opacity=".7"/></g>`;
  // papéis, telefone, xícara com vapor
  s += `<g transform="translate(160,1170) rotate(-4)"><rect x="-180" y="-16" width="360" height="22" fill="#F4ECD8" stroke="${OL}" stroke-width="4"/><text x="0" y="0" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="20" fill="#C8282E">TOP SECRET</text></g>`;
  s += `<g transform="translate(-300,1150)"><rect x="-90" y="-30" width="180" height="60" rx="16" fill="#1A1A20" stroke="${OL}" stroke-width="6"/><path d="M-100 -40 Q0 -100 100 -40 L80 -20 Q0 -60 -80 -20Z" fill="#1A1A20" stroke="${OL}" stroke-width="6"/><circle cx="0" cy="0" r="22" fill="#E8E8E8" stroke="${OL}" stroke-width="4"/></g>`;
  s += `<g transform="translate(560,1160)"><path d="M-40 -60 L40 -60 L32 10 L-32 10Z" fill="#F4F4F0" stroke="${OL}" stroke-width="6"/><path d="M40 -44 Q70 -40 60 -10 Q50 4 34 -6" stroke="${OL}" stroke-width="6" fill="none"/>${[0, 1, 2].map(i => { const p = (t * .5 + i / 3) % 1; return `<path d="M${-14 + i * 14} ${f1(-70 - p * 120)} q12 -20 0 -40" stroke="#FFFFFF" stroke-width="6" fill="none" opacity="${op((1 - p) * .5)}" filter="url(#b4)"/>`; }).join('')}</g>`;
  return s;
}
// árvores, gramado, banco, embaixada (Washington, dia)
function park(t, o = {}) {
  const id = nid('pk'); def(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7AB8E8"/><stop offset="1" stop-color="#E4F0F4"/></linearGradient>`);
  let s = `<rect x="-3000" y="-3000" width="9000" height="9000" fill="url(#${id})"/>` + [0, 1, 2].map(i => `<g transform="translate(${f1(((i * 700 + t * 16) % 2800) - 900)},${180 + i * 90})"><ellipse rx="200" ry="56" fill="#FFFFFF" opacity=".9"/><ellipse cx="80" cy="-30" rx="120" ry="50" fill="#FFFFFF"/></g>`).join('');
  // embaixada soviética (prédio clássico) com bandeira vermelha tremulando
  const fl = (k) => f1(Math.sin(t * 5 + k) * 14);
  s += `<g transform="translate(${o.embX || 1250},1050)"><rect x="-420" y="-520" width="840" height="520" fill="#D8D0C0" stroke="${OL}" stroke-width="8"/><path d="M-460 -520 L0 -700 L460 -520Z" fill="#C8BEAA" stroke="${OL}" stroke-width="8"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${-360 + i * 140}" y="-470" width="40" height="420" fill="#ECE6DA" stroke="${OL}" stroke-width="4"/>`).join('')}${Array.from({ length: 5 }, (_, i) => `<rect x="${-300 + i * 140}" y="-420" width="60" height="110" fill="#5A6A8A" stroke="${OL}" stroke-width="4"/><rect x="${-300 + i * 140}" y="-250" width="60" height="110" fill="#5A6A8A" stroke="${OL}" stroke-width="4"/>`).join('')}<path d="M0 -700 V-940" stroke="#3A3A40" stroke-width="10"/><path d="M0 -940 Q60 ${-950 + +fl(0)} 120 ${-940 - +fl(1)} Q180 ${-930 + +fl(2)} 230 -940 L230 -820 Q180 ${-810 + +fl(2)} 120 ${-820 - +fl(1)} Q60 ${-830 + +fl(0)} 0 -820Z" fill="#C8202A" stroke="${OL}" stroke-width="5"/><g transform="translate(46,-904) scale(.9)"><path d="M0 0 l8 -14 l8 14 l-16 -9 l16 0Z" fill="#FFD23A"/></g></g>`;
  // árvores
  s += [[-250, 1100, 1.2], [180, 1060, .9], [2100, 1080, 1.1]].map(([x, y, k]) => `<g transform="translate(${x},${y}) scale(${k})"><path d="M-30 0 Q-20 -300 -10 -380 L20 -380 Q30 -300 40 0Z" fill="#5A3E2A" stroke="${OL}" stroke-width="7"/>${[[-120, -480, 160], [80, -500, 170], [-10, -620, 170], [-180, -380, 120], [150, -380, 130]].map(([a, b, r]) => `<circle cx="${a}" cy="${f1(b + Math.sin(t * 1.3 + a) * 4)}" r="${r}" fill="#4A8A3A" stroke="${OL}" stroke-width="7"/><circle cx="${a - r * .25}" cy="${b - r * .3}" r="${r * .5}" fill="#6AAA4A"/>`).join('')}</g>`).join('');
  s += `<rect x="-3000" y="1050" width="9000" height="400" fill="#6AA84A"/><rect x="-3000" y="1050" width="9000" height="20" fill="#4A8A3A"/>`;
  // rua com faixa
  s += `<rect x="-3000" y="1450" width="9000" height="420" fill="#4A4A52"/><path d="M-3000 1660 H6000" stroke="#E8D04A" stroke-width="14" stroke-dasharray="90 70"/><rect x="-3000" y="1440" width="9000" height="20" fill="#9A9AA0"/><rect x="-3000" y="1870" width="9000" height="800" fill="#8A8A90"/>`;
  return s;
}
function bench(x, y, s = 1) { return `<g transform="translate(${x},${y}) scale(${s})"><rect x="-300" y="-180" width="600" height="30" rx="8" fill="#8A5A34" stroke="${OL}" stroke-width="6"/><rect x="-300" y="-130" width="600" height="30" rx="8" fill="#8A5A34" stroke="${OL}" stroke-width="6"/><rect x="-310" y="-60" width="620" height="34" rx="8" fill="#9A6A40" stroke="${OL}" stroke-width="6"/><path d="M-260 -30 V0 M260 -30 V0 M-260 -180 V-60 M260 -180 V-60" stroke="#2A2A30" stroke-width="16"/></g>`; }
// furgão de vigilância disfarçado (marca Hryz Animation)
function van(x, y, s, o = {}) { return `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="10" rx="520" ry="34" fill="#000" opacity=".3" filter="url(#b12)"/><path d="M-480 -40 L-480 -420 Q-470 -470 -420 -470 L220 -470 Q300 -470 340 -400 L440 -240 Q480 -220 480 -160 L480 -40Z" fill="#E8E2D0" stroke="${OL}" stroke-width="10" stroke-linejoin="round"/><path d="M240 -440 L320 -440 L410 -260 L240 -260Z" fill="#7AA0C0" stroke="${OL}" stroke-width="7"/><path d="M-480 -200 L480 -200" stroke="#2A6A8A" stroke-width="40"/><text x="-120" y="-310" text-anchor="middle" font-family="'DejaVu Serif',serif" font-style="italic" font-weight="700" font-size="64" fill="#2A6A8A">Hryz Animation</text><text x="-120" y="-250" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="30" fill="#5A5A60">FLORES &amp; ENTREGAS</text>${o.door ? `<rect x="-300" y="-430" width="${f1(300 * o.door)}" height="380" fill="#1A1A22" stroke="${OL}" stroke-width="6"/>` : ''}<rect x="-30" y="-560" width="60" height="90" fill="#3A3A40" stroke="${OL}" stroke-width="5"/><path d="M0 -560 L0 -700" stroke="#3A3A40" stroke-width="6"/><circle cx="0" cy="-704" r="10" fill="#FF4A4A" opacity="${op(.5 + .5 * Math.sin(TT * 6))}"/>${[-300, 300].map(wx => `<g transform="translate(${wx},-40)"><circle r="86" fill="#1A1A20" stroke="${OL}" stroke-width="7"/><circle r="40" fill="#A8ACB4" stroke="${OL}" stroke-width="5"/></g>`).join('')}</g>`; }
function taxi(x, y, s) { return `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="10" rx="520" ry="34" fill="#000" opacity=".35" filter="url(#b12)"/><path d="M-500 -60 L-500 -220 Q-480 -250 -380 -260 L-260 -400 Q-220 -430 -120 -430 L160 -430 Q230 -430 280 -380 L380 -260 Q500 -250 510 -200 L510 -60Z" fill="#F2C424" stroke="${OL}" stroke-width="10" stroke-linejoin="round"/><path d="M-240 -390 L-160 -390 L-160 -270 L-340 -270Z M-130 -390 L120 -390 L120 -270 L-130 -270Z M150 -390 Q210 -390 250 -340 L310 -270 L150 -270Z" fill="#7AA0C0" stroke="${OL}" stroke-width="6"/><rect x="-80" y="-480" width="160" height="50" rx="10" fill="#F4F4F0" stroke="${OL}" stroke-width="6"/><text x="0" y="-444" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="34" fill="${OL}">TAXI</text>${Array.from({ length: 10 }, (_, i) => `<rect x="${-480 + i * 96}" y="-170" width="48" height="30" fill="${i % 2 ? '#1A1A20' : '#F4F4F0'}"/>`).join('')}<ellipse cx="500" cy="-170" rx="24" ry="30" fill="#FFF8C8" stroke="${OL}" stroke-width="5"/><path d="M520 -170 L1200 -320 L1200 -20Z" fill="#FFF8C8" opacity=".25"/>${[-300, 300].map(wx => `<g transform="translate(${wx},-60)"><circle r="90" fill="#1A1A20" stroke="${OL}" stroke-width="7"/><circle r="42" fill="#C8CCD4" stroke="${OL}" stroke-width="5"/></g>`).join('')}</g>`; }
const KCAM = (x, y, z, r = 0, shake = .6) => { const [hx, hy] = HH(TT, shake); setCam(x + hx, y + hy, z, r, [540, 960, 1]); };
const VIGN = (k = .8) => VIG(k);
/* =========================================================================================
   CENAS
   ========================================================================================= */
// n1: gancho — close no gato no banco, a câmera aproxima da orelha: um fio e uma luz vermelha
function s1(t) {
  TT = t; const { L, d, k } = loc(t, 'n1');
  const push = ss(range(L, .2, 3.6));
  KCAM(lerp(540, 700, push), lerp(1000, 780, push), lerp(1.0, 2.1, push), lerp(0, -3, push), .4);
  let s = lay(.4, park(t, { embX: 1300 }));
  s += lay(1, bench(540, 1300, 1.3));
  const twitch = bump(range(L, 1.4, 1.75)) * 22, blink = bump(range(L, 2.6, 2.85));
  s += lay(1, `<g transform="translate(540,880)">${catFace(0, 0, 1.15, { earR: -twitch, earL: twitch * .3, blink, lookX: lerp(0, .9, ss(range(L, .8, 1.6))), pupil: lerp(.32, .14, ss(range(L, 2.9, 3.4))), wire: ss(range(L, 1.6, 2.4)), mouth: 'w' })}</g>` + `<g transform="translate(540,1240)"><path d="M-330 -40 Q-340 220 -300 330 L300 330 Q340 220 330 -40 Q200 -120 0 -120 Q-200 -120 -330 -40Z" fill="${CAT.fur}" stroke="${OL}" stroke-width="10"/><path d="M-120 -100 Q0 40 120 -100 Q60 200 0 220 Q-60 200 -120 -100Z" fill="${CAT.belly}"/></g>`);
  if (L > 3.3) s += `<g transform="translate(540,330)">${TAG(0, 0, 'GATO ESPIÃO', 1.5 + .2 * bump(range(L, 3.3, 3.7)), '#FF6A6A')}</g>`;
  return s + VIGN(.8);
}
// n2: anos 60 — escritório da CIA; o chefe e o agente; um gato pula na mesa; ideia
function s2(t) {
  TT = t; const { L, d, k } = loc(t, 'n2');
  const pan = ss(range(L, 3.4, 5.4));
  KCAM(lerp(520, 600, k), lerp(980, 900, pan), lerp(1.0, 1.25, pan), 0, .5);
  let s = lay(.6, office(t)) + lay(1, `<g transform="translate(-140,520)">${TAG(0, 0, 'CIA · ANOS 1960', 1, '#FFE6A0')}</g>`);
  // dois agentes atrás da mesa
  const talk = Math.floor(L * 6) % 2;
  s += lay(1, person(260, 640, .58, FACE.chefe, { coat: '#3A3A44', tie: '#7A1A2A', face: { mouth: L < 3 && talk ? 'grande' : 'reto' }, armL: [[-215, 330], [-170, 560], [-40, 760]], armR: [[215, 330], [200, 560], [60, 760]] }));
  const look = ss(range(L, 3.0, 3.6));
  s += lay(1, person(820, 660, .55, FACE.jovem, { coat: '#5A5048', seed: 2, face: { mouth: L > 5.6 ? 'grande' : 'leve', emo: L > 5.6 ? 'feliz' : 'neutro', look: -look }, armL: L > 5.6 ? [[-215, 330], [-250, 160], [-200, -40]] : [[-215, 330], [-240, 560], [-120, 760]] }));
  s += lay(1, desk(t));
  // gato pula na mesa (arco) e senta
  const jp = ss(range(L, 2.2, 3.2)), cx = lerp(-300, 540, jp), cy = lerp(1500, 1180, jp) - Math.sin(jp * Math.PI) * 360;
  if (L > 2.2) s += lay(1, catSide(cx, cy, .38, { pose: jp < 1 ? 'walk' : 'sit', ph: t * 10, speed: jp < 1 ? 1.4 : 0, crouch: jp < 1 ? -.3 : 0, lookX: .2, blink: bump(range(L, 4.6, 4.8)), tailAmp: 1.4 }));
  if (L > 5.6) s += lay(1, `<g transform="translate(700,420) scale(${f1(1 + .2 * bump(range(L, 5.6, 6)))})"><circle r="70" fill="#FFF3A0" stroke="${OL}" stroke-width="7"/><path d="M-26 64 L26 64 L20 100 L-20 100Z" fill="#A8ACB4" stroke="${OL}" stroke-width="6"/><path d="M-20 0 Q0 -40 20 0 Q0 30 -20 0" stroke="#E8A020" stroke-width="6" fill="none"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${f1(Math.cos(i * .785) * 90)} ${f1(Math.sin(i * .785) * 90)} L${f1(Math.cos(i * .785) * 120)} ${f1(Math.sin(i * .785) * 120)}" stroke="#FFE04A" stroke-width="8" stroke-linecap="round"/>`).join('')}</g>`);
  if (L > 6.4) s += `<g transform="translate(540,330)">${TAG(0, 0, 'QUEM DESCONFIA?', 1.25, '#FFE04A')}</g>`;
  return s + VIGN(.85);
}
// n3: a cirurgia (sem sangue) — planta técnica (blueprint) com as peças entrando no gato
function s3(t) {
  TT = t; const { L, d, k } = loc(t, 'n3');
  KCAM(lerp(520, 560, k), lerp(980, 1000, k), lerp(.95, 1.12, ss(k)), .6 * Math.sin(L * .5), .35);
  let s = `<rect x="-2000" y="-2000" width="6000" height="6000" fill="#0E2A4A"/>` + lay(.8, Array.from({ length: 50 }, (_, i) => `<path d="M${-1200 + i * 80} -800 V3000 M-1200 ${-800 + i * 80} H3000" stroke="#2A5A8A" stroke-width="2" opacity=".5"/>`).join(''));
  // relógio "1 hora"
  const clk = ss(range(L, 0, d));
  s += lay(.9, `<g transform="translate(860,330)"><circle r="90" fill="#0E2A4A" stroke="#8AD0FF" stroke-width="6"/><path d="M0 0 L0 -64" stroke="#8AD0FF" stroke-width="7" transform="rotate(${f1(clk * 360)})"/><path d="M0 0 L40 0" stroke="#8AD0FF" stroke-width="9" transform="rotate(${f1(clk * 30 - 90)})"/><text x="0" y="140" text-anchor="middle" font-family="'DejaVu Sans Mono',monospace" font-weight="700" font-size="34" fill="#8AD0FF">1 HORA</text></g>`);
  // gato dormindo (anestesiado) em vista lateral, desenhado como planta azul
  s += lay(1, `<g opacity=".95">${catSide(500, 1350, .9, { pose: 'sit', blink: 1, tailAmp: .2, tailSpeed: .5, mouth: 'happy', wire: 0 })}</g>`);
  s += lay(1, `<rect x="-1000" y="900" width="3000" height="2000" fill="#0E2A4A" opacity=".35" style="mix-blend-mode:multiply"/>`);
  // peças chegando (microfone, transmissor, fio)
  const p1 = ss(range(L, 1.6, 2.6)), p2 = ss(range(L, 3.4, 4.4)), p3 = range(L, 5.4, 7.6);
  const earX = 739, earY = 874, nkX = 540, nkY = 1080;
  const mic = `<g><rect x="-26" y="-14" width="52" height="28" rx="12" fill="#C8CCD4" stroke="#8AD0FF" stroke-width="4"/><path d="M-14 -14 V14 M0 -14 V14 M14 -14 V14" stroke="#5A6A8A" stroke-width="3"/></g>`;
  const tx = `<g><rect x="-50" y="-30" width="100" height="60" rx="8" fill="#3A5A3A" stroke="#8AD0FF" stroke-width="4"/>${[-30, -10, 10, 30].map(x => `<rect x="${x - 4}" y="-20" width="8" height="40" fill="#C8A040"/>`).join('')}<circle cx="34" cy="-18" r="6" fill="#FF4A4A"/></g>`;
  s += lay(1, `<g transform="translate(${f1(lerp(-100, earX, p1))},${f1(lerp(500, earY - 60, p1))}) scale(${f1(lerp(2.4, 1, p1))})">${mic}</g>` + (p1 >= 1 ? `<circle cx="${earX}" cy="${earY - 60}" r="${f1(30 + 20 * Math.sin(t * 6))}" fill="none" stroke="#8AD0FF" stroke-width="4"/>` : '') + `<g transform="translate(${f1(lerp(1200, nkX, p2))},${f1(lerp(700, nkY, p2))}) scale(${f1(lerp(2.4, .8, p2))})">${tx}</g>`);
  if (p3 > 0) { const P = [[nkX, nkY], [470, 1060], [360, 1180], [250, 1290], [180, 1350]]; const len = 2400; s += lay(1, `<path d="${smoothD(P)}" stroke="#E0F0FF" stroke-width="6" fill="none" stroke-dasharray="${f1(len * p3)} ${len}"/><path d="${smoothD(P)}" stroke="#8AD0FF" stroke-width="18" fill="none" opacity=".25" stroke-dasharray="${f1(len * p3)} ${len}" filter="url(#b4)"/>`); }
  const lab = (x, y, txt, a) => a > 0 ? `<g opacity="${op(a)}"><path d="M${x} ${y} L${x + 120} ${y - 80} H${x + 120 + txt.length * 22}" stroke="#8AD0FF" stroke-width="4" fill="none"/><text x="${x + 130}" y="${y - 92}" font-family="'DejaVu Sans Mono',monospace" font-weight="700" font-size="34" fill="#BFE6FF">${txt}</text></g>` : '';
  s += lay(1, lab(earX - 300, earY - 260, 'MICROFONE', range(L, 2.4, 2.8)) + lab(nkX - 330, nkY + 150, 'TRANSMISSOR', range(L, 4.2, 4.6)) + lab(120, 1460, 'FIO NO PELO', range(L, 7.2, 7.6)));
  return s + VIGN(.85);
}
// n4: o gato distraído — os agentes apontam; ele vai atrás do peixe; outra operação
function s4(t) {
  TT = t; const { L, d, k } = loc(t, 'n4');
  KCAM(lerp(560, 460, ss(range(L, 2, 4.5))), 1180, lerp(.8, .92, k), 0, .5);
  let s = lay(.5, park(t, { embX: 1700 }));
  // agente agachado apontando para a direita (embaixada)
  const point = ss(range(L, .2, .8));
  s += lay(1, person(880, 1060, .62, FACE.jovem, { coat: '#5A5048', hat: '#4A4038', face: { mouth: L > 1.2 && L < 3.6 && Math.floor(L * 7) % 2 ? 'grande' : 'leve', emo: L > 4.5 ? 'choque' : 'neutro' }, armL: [[-215, 330], [lerp(-240, 60, point), lerp(560, 360, point)], [lerp(-200, 320, point), lerp(780, 300, point)]] }));
  // gato: começa andando pra direita, vê o peixe de um vendedor (esquerda baixa) e muda de direção
  const turn = ss(range(L, 2.0, 2.8)), go = range(L, 2.8, 5.6);
  const cx = L < 2.0 ? lerp(300, 560, ss(range(L, 0, 2))) : lerp(560, 330, ss(go)), dir = turn > .5 ? -1 : 1;
  s += lay(1, catSide(cx, 1500, .42, { pose: L > 5.6 ? 'sit' : 'walk', ph: t * 9, speed: (L < 2 || (go > 0 && go < 1)) ? 1 : 0, flip: dir, lookX: dir > 0 ? .8 : -.8, pupil: L > 2 ? .5 : .3, earL: L > 1.8 && L < 2.4 ? 20 : 0, tailAmp: L > 2 ? 1.6 : 1 }));
  // carrinho de peixe
  s += lay(1, `<g transform="translate(80,1500)"><rect x="-200" y="-260" width="400" height="200" rx="10" fill="#C8A060" stroke="${OL}" stroke-width="8"/><path d="M-220 -260 L0 -380 L220 -260Z" fill="#E86A4A" stroke="${OL}" stroke-width="8"/><text x="0" y="-150" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="44" fill="${OL}">PEIXE</text>${[-120, 0, 120].map(x => `<g transform="translate(${x},-270) rotate(${f1(Math.sin(t * 2 + x) * 6)})"><path d="M-50 0 Q0 -28 40 0 L64 -18 L60 0 L64 18 L40 0 Q0 28 -50 0Z" fill="#8AB0C8" stroke="${OL}" stroke-width="5"/><circle cx="-34" cy="-4" r="5" fill="${OL}"/></g>`).join('')}<circle cx="-150" cy="-40" r="44" fill="#3A3A40" stroke="${OL}" stroke-width="6"/><circle cx="150" cy="-40" r="44" fill="#3A3A40" stroke="${OL}" stroke-width="6"/></g>`);
  if (L > 2.0 && L < 3.2) s += lay(1, `<g transform="translate(${f1(cx - 40)},1220)">${TAG(0, 0, '!', 1.2, '#FFE04A')}</g>`);
  if (L > 4.6) s += `<g transform="translate(540,330)">${TAG(0, 0, 'OUTRA OPERAÇÃO', 1.2 + .15 * bump(range(L, 4.6, 5)), '#FF8A6A')}</g>`;
  return s + VIGN(.8);
}
// n5: 20 milhões — o dinheiro empilhando atrás do gato sentado no cofre
function s5(t) {
  TT = t; const { L, d, k } = loc(t, 'n5');
  KCAM(lerp(540, 560, k), lerp(1000, 860, ss(k)), lerp(1.25, 1.05, k), 0, .5);
  let s = lay(.6, office(t, { pins: 0 })) + lay(1, desk(t));
  const n = Math.floor(lerp(0, 26, ss(range(L, .2, 3.4))));
  let money = ''; for (let i = 0; i < n; i++) { const col = i % 3, row = Math.floor(i / 3); money += `<g transform="translate(${420 + col * 130 - row * 6},${1150 - row * 42})"><rect x="-60" y="-20" width="120" height="40" rx="6" fill="#6AA85A" stroke="${OL}" stroke-width="4"/><rect x="-20" y="-20" width="40" height="40" fill="#E8E2C8" stroke="${OL}" stroke-width="3"/><text x="0" y="8" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="20" fill="#2A5A2A">$</text></g>`; }
  s += lay(1, money);
  const top = 1150 - Math.floor(n / 3) * 42;
  s += lay(1, catSide(560, top - 6, .32, { pose: 'sit', blink: bump(range(L, 2, 2.2)), lookX: 0, mouth: 'happy', tailAmp: 1.2, wire: 1 }));
  const v = Math.round(lerp(0, 20, ss(range(L, .2, 3.4))));
  s += `<g transform="translate(540,300)"><rect x="-300" y="-80" width="600" height="150" rx="24" fill="#0A0810" opacity=".8"/><text x="0" y="28" text-anchor="middle" font-family="'DejaVu Sans Mono',monospace" font-weight="700" font-size="84" fill="#9AE08A">US$ ${v}${v > 0 ? '.000.000' : ''}</text></g>`;
  return s + VIGN(.85);
}
// n6: o primeiro teste — furgão, fones, os dois homens no banco; soltam o gato
function s6(t) {
  TT = t; const { L, d, k } = loc(t, 'n6');
  let s;
  if (L < 3.6) {   // dentro do furgão
    KCAM(lerp(500, 560, k), 1000, lerp(1.0, 1.1, k), 0, .4);
    s = `<rect x="-2000" y="-2000" width="6000" height="6000" fill="#2A2A30"/>` + lay(1, `<rect x="-600" y="300" width="2400" height="900" fill="#3A3A44"/>${Array.from({ length: 6 }, (_, i) => `<g transform="translate(${-100 + i * 220},560)"><rect x="-90" y="-140" width="180" height="280" rx="10" fill="#4A4A54" stroke="${OL}" stroke-width="6"/><circle cx="-36" cy="-60" r="40" fill="#1A1A20" stroke="#8A8A90" stroke-width="5"/><circle cx="36" cy="-60" r="40" fill="#1A1A20" stroke="#8A8A90" stroke-width="5"/><path d="M-36 -60 L${f1(-36 + 30 * Math.cos(t * 3 + i))} ${f1(-60 + 30 * Math.sin(t * 3 + i))} M36 -60 L${f1(36 + 30 * Math.cos(t * 3 + i))} ${f1(-60 + 30 * Math.sin(t * 3 + i))}" stroke="#E8E8E8" stroke-width="5"/>${[0, 1, 2, 3].map(j => `<circle cx="${-60 + j * 40}" cy="60" r="10" fill="${['#FF4A4A', '#4AE07A', '#FFE04A', '#4AA0FF'][(j + i + Math.floor(t * 3)) % 4]}"/>`).join('')}</g>`).join('')}<path d="M-600 940 H1800" stroke="#1A1A20" stroke-width="30"/>`);
    // medidor de sinal
    let sig = ''; for (let i = 0; i < 40; i++) sig += `${i ? 'L' : 'M'}${i * 10} ${f1(Math.sin(t * 12 + i * .7) * 30 * Math.sin(i * .2 + t))} `;
    s += lay(1, `<g transform="translate(700,250)"><rect x="-220" y="-70" width="440" height="140" rx="14" fill="#0A1A12" stroke="#2A5A3A" stroke-width="6"/><path d="${sig}" transform="translate(-200,0)" stroke="#4AE07A" stroke-width="5" fill="none"/></g>`);
    s += lay(1, person(380, 820, .64, FACE.jovem, { coat: '#5A5048', headphones: 1, face: { emo: 'neutro', mouth: 'leve', look: .4 }, armL: [[-215, 330], [-150, 560], [60, 640]], armR: [[215, 330], [240, 520], [120, 640]] }));
  } else {   // o parque visto de longe
    const L2 = L - 3.6;
    KCAM(lerp(500, 600, ss(range(L2, 0, d - 3.6))), 1250, lerp(.72, .8, ss(range(L2, 0, d - 3.6))), 0, .4);
    s = lay(.5, park(t, { embX: 1200 }));
    s += lay(1, bench(820, 1360, 1));
    const talk = Math.floor(L * 5) % 2;
    s += lay(1, person(680, 1010, .36, FACE.russo1, { coat: '#3A3A30', hat: '#2A2A24', seed: 1, face: { mouth: talk ? 'grande' : 'reto' }, armL: [[-215, 330], [-180, 560], [-40, 640]] }) + person(960, 1010, .36, FACE.russo2, { coat: '#4A4A54', hat: '#3A3A44', seed: 3, flip: -1, face: { mouth: talk ? 'reto' : 'grande' } }));
    s += lay(1, van(200, 1720, .55, { door: ss(range(L2, .3, 1.2)) }));
    const out = ss(range(L2, 1.2, d - 3.6));
    if (L2 > 1.1) s += lay(1, catSide(lerp(240, 560, out), 1700, .26, { pose: 'walk', ph: t * 9, speed: out < 1 ? 1 : 0, wire: 1, lookX: .8 }));
    s += `<g transform="translate(540,330)">${TAG(0, 0, 'EMBAIXADA SOVIÉTICA', 1.0, '#FF8A6A')}</g>`;
  }
  return s + VIGN(.8);
}
// n7: atravessa a rua — faróis, buzina, corte para o preto (sem mostrar o impacto)
function s7(t) {
  TT = t; const { L, d, k } = loc(t, 'n7');
  const cross = ss(range(L, .2, 4.0)), car = range(L, 3.8, 6.4);
  KCAM(lerp(480, 600, cross), lerp(1450, 1520, k), lerp(1.0, 1.25, ss(car)), 0, .5 + car);
  let s = lay(1, park(t, { embX: 1300 }));
  s += lay(1, catSide(lerp(120, 560, cross), lerp(1420, 1640, ss(range(L, 1.6, 4.0))), .32, { pose: car > .4 ? 'sit' : 'walk', ph: t * 9, speed: car > .4 ? 0 : 1, wire: 1, lookX: car > .3 ? 1 : .8, pupil: car > .3 ? .9 : .3, earL: car > .3 ? -30 : 0, earR: car > .3 ? 30 : 0, mouth: car > .5 ? 'open' : 'w' }));
  if (car > 0) s += lay(1, taxi(lerp(2600, 1100, ss(car)), 1760, .8)) + `<rect width="1080" height="1920" fill="#FFF8C8" opacity="${op(car * .45)}"/>`;
  if (L > 6.4) s = `<rect width="1080" height="1920" fill="#000"/>` + `<g transform="translate(540,960)">${TAG(0, 0, 'VERSÃO 1', 1.4, '#FF6A6A')}</g>`;
  return s + (L <= 6.4 ? VIGN(.8) : '');
}
// n8: a outra versão — rebobina; costuram; o gato vive feliz numa almofada
function s8(t) {
  TT = t; const { L, d, k } = loc(t, 'n8');
  let s;
  if (L < 1.6) {   // rebobinar
    KCAM(540, 960, 1, 0, 1.4);
    s = `<rect width="1080" height="1920" fill="#101018"/>` + Array.from({ length: 30 }, (_, i) => `<rect x="0" y="${(i * 71 + t * 2400) % 1920}" width="1080" height="${4 + i % 3 * 3}" fill="#FFFFFF" opacity="${.06 + (i % 4) * .03}"/>`).join('') + `<g transform="translate(540,960)">${TAG(0, 0, '◀◀ VERSÃO 2', 1.4, '#8AD0FF')}</g>`;
    return s;
  }
  const L2 = L - 1.6;
  KCAM(lerp(500, 560, k), lerp(1100, 1000, k), lerp(.9, 1.1, ss(k)), 0, .35);
  // sala aconchegante: tapete, lareira, janela com sol
  s = `<rect x="-2000" y="-2000" width="6000" height="6000" fill="#E8C898"/>` + lay(1, `<rect x="-800" y="-400" width="2800" height="1800" fill="#E8D0A8"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${-700 + i * 220} -400 V1400" stroke="#D8B888" stroke-width="40" opacity=".5"/>`).join('')}<g transform="translate(820,420)"><rect x="-200" y="-220" width="400" height="440" fill="#BFE4F8" stroke="#8A5A34" stroke-width="20"/><path d="M0 -220 V220 M-200 0 H200" stroke="#8A5A34" stroke-width="14"/><circle cx="80" cy="-110" r="50" fill="#FFF0A0"/></g><path d="M620 640 L200 1500 L900 1500 L1020 640Z" fill="#FFF0B0" opacity=".2"/><rect x="-800" y="1300" width="2800" height="900" fill="#B87A4A"/><ellipse cx="460" cy="1500" rx="520" ry="110" fill="#C8463A" stroke="${OL}" stroke-width="8"/><ellipse cx="460" cy="1500" rx="420" ry="80" fill="none" stroke="#F2C060" stroke-width="10"/>`);
  // tesoura/linha: a costura (o fio sai do pelo)
  const wireOff = 1 - ss(range(L2, .2, 1.6));
  // almofada + gato enrolado, ronronando
  s += lay(1, `<g transform="translate(460,1440)"><ellipse cx="0" cy="0" rx="300" ry="90" fill="#6A8AC8" stroke="${OL}" stroke-width="8"/><ellipse cx="0" cy="-20" rx="250" ry="60" fill="#8AAAE0"/></g>`);
  const purr = Math.sin(t * 22) * 2;
  s += lay(1, `<g transform="translate(0,${f1(purr)})">${catSide(470, 1430, .55, { pose: 'sit', blink: L2 > 2.2 ? 1 : bump(range(L2, 1.2, 1.4)), lookX: .2, mouth: 'happy', blush: 1, tailAmp: .6, tailSpeed: 1, wire: wireOff })}</g>`);
  if (L2 > 2.6) s += lay(1, [0, 1, 2].map(i => { const p = (L2 * .4 + i / 3) % 1; return `<text x="${f1(620 + i * 30 + p * 80)}" y="${f1(1060 - p * 260)}" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="${f1(40 + p * 30)}" fill="#5A3A8A" opacity="${op((1 - p) * .9)}">z</text>`; }).join('') + `<g transform="translate(470,1000)">${TAG(0, 0, 'VIDA LONGA', 1.1 + .1 * bump(range(L2, 2.6, 3)), '#9AE08A')}</g>`);
  if (L2 > .3 && L2 < 1.8) s += lay(1, `<g transform="translate(${f1(lerp(800, 640, ss(range(L2, .3, 1))))},1120) rotate(-30)"><path d="M0 0 L120 -20 M0 0 L120 20" stroke="#C8CCD4" stroke-width="10"/><circle cx="-20" cy="-20" r="20" fill="none" stroke="#C83A3A" stroke-width="8"/><circle cx="-20" cy="20" r="20" fill="none" stroke="#C83A3A" stroke-width="8"/></g>`);
  return s + VIGN(.6);
}
// n9: 1967 — o diretor carimba o relatório; o gato derruba o carimbo da mesa (loop)
function s9(t) {
  TT = t; const { L, d, k } = loc(t, 'n9');
  KCAM(lerp(480, 560, k), lerp(980, 1000, k), lerp(1.15, 1.25, ss(k)), 0, .45);
  let s = lay(.6, office(t)) + lay(1, desk(t));
  const stamp = range(L, 3.0, 3.6), slam = L > 3.4;
  s += lay(1, person(320, 640, .58, FACE.diretor, { coat: '#3A3A44', tie: '#2A3A6A', face: { mouth: L < 3 && Math.floor(L * 6) % 2 ? 'grande' : 'reto', look: L > 4.6 ? .8 : 0, emo: L > 6.2 ? 'choque' : 'neutro' }, armL: [[-215, 330], [lerp(-150, -60, bump(stamp)), lerp(500, 380, bump(stamp))], [lerp(60, 120, bump(stamp)), lerp(760, 640 + (slam ? 120 : 0) * (1 - stamp), bump(stamp))]], itemL: '' }));
  // relatório
  s += lay(1, `<g transform="translate(320,1170) rotate(-3)"><rect x="-230" y="-26" width="460" height="34" fill="#F4ECD8" stroke="${OL}" stroke-width="5"/></g><g transform="translate(320,1000) rotate(-3)"><rect x="-200" y="-150" width="400" height="300" fill="#F4ECD8" stroke="${OL}" stroke-width="6"/><text x="0" y="-100" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="26" fill="${OL}">VIEWS ON TRAINED</text><text x="0" y="-66" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="26" fill="${OL}">CATS USE · 1967</text><path d="M-160 -20 H160 M-160 10 H120 M-160 40 H140" stroke="#9A9A9A" stroke-width="6"/>${slam ? `<g transform="rotate(-12)"><rect x="-170" y="60" width="340" height="80" rx="10" fill="none" stroke="#C8282E" stroke-width="10"/><text x="0" y="118" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="900" font-size="44" fill="#C8282E">NÃO É PRÁTICO</text></g>` : ''}</g>`);
  // gato sentado na mesa empurra a xícara/carimbo com a pata e derruba
  const push = ss(range(L, 4.8, 6.0)), fall = range(L, 6.0, 7.0);
  s += lay(1, catSide(700, 1180, .36, { pose: 'sit', lookX: L > 4.6 ? -.6 : .2, blink: bump(range(L, 2, 2.2)), tailAmp: 1.3, mouth: L > 6.2 ? 'happy' : 'w' }));
  const sx = 780 + 40 * push + 120 * fall, sy = 1150 + 600 * fall * fall;
  s += lay(1, `<g transform="translate(${f1(sx)},${f1(sy)}) rotate(${f1(fall * 260)})"><rect x="-30" y="-80" width="60" height="80" rx="10" fill="#6A4428" stroke="${OL}" stroke-width="6"/><rect x="-50" y="0" width="100" height="26" rx="6" fill="#C8282E" stroke="${OL}" stroke-width="6"/></g>`);
  if (L > 6.6) s += `<g transform="translate(540,330)">${TAG(0, 0, 'GATO É GATO', 1.3 + .15 * bump(range(L, 6.6, 7)), '#FFE04A')}</g>`;
  // volta ao começo (loop): close no olho
  const back = ss(range(L, d - 1.4, d));
  if (back > 0) s += `<g opacity="${op(back)}"><rect width="1080" height="1920" fill="#6AA84A"/><g transform="translate(540,960)">${catFace(0, 0, 2.2, { wire: 1, lookX: .9, pupil: .14, mouth: 'w' })}</g></g>`;
  return s + VIGN(.85);
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
