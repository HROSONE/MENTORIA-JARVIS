const OL = '#1A1424';
let TT = 0;
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
