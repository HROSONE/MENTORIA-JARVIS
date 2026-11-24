/* =====================================================================================
   REX DE PERFIL (olhando para a direita) — personagem articulado em SVG para o Short "Ele não consegue bater palma 🦖".
   Unidades locais: chão em y = 0 (para cima é negativo); quadril em (20, -420); focinho perto de x = 850; ponta da cauda em x = -790.
   Volume em "cel shading" automático (vol): cada parte ganha sombra própria do lado oposto ao sol e um fio de luz no lado do sol,
   feitos com máscaras do próprio contorno deslocado na direção da luz. Sol baixo atrás, à direita e acima: LUZ = (0.55, -0.83).
   Pose (graus): { pescoco, cabeca, boca(0..1), coxaC/coxaL, joelhoC/joelhoL, tornC/tornL (pernas de cá/lá), cauda, respira, t,
     bracoCa/bracoLa: { ombro, cotovelo, pulso, dedos(0..1), musc(0..1), k(comprimento; 1 = real) }, olho:[dx,dy], palpebra, sobrancelha, suor }
   ===================================================================================== */
const P = {
  pele: '#5D7E2B', peleEsc: '#3B5719', peleSomb: '#2E4513', peleClara: '#93B24C', luz: '#FFE9AE',
  barriga: '#E5D29A', barrigaEsc: '#B79F62', listra: '#36501A', contorno: '#17240A',
  boca: '#6E2320', gengiva: '#B44A3E', lingua: '#C0574B', dente: '#FBF4E2', unha: '#EFE2BE', iris: '#F4A21A', irisClara: '#FFE27A',
};
const LUZ = [0.55, -0.83];
let _id = 0;
const r2 = x => Math.round(x * 10) / 10;
const DEFS_REX = `
<pattern id="rxEsc" width="24" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(-6)">
  <path d="M0,10 Q6,3 12,10 Q18,3 24,10 M-6,20 Q0,13 6,20 Q12,13 18,20 Q24,13 30,20" stroke="#0F1A05" stroke-width="1.5" fill="none" opacity=".22"/>
  <circle cx="6" cy="14" r="2" fill="#D8E79A" opacity=".16"/><circle cx="18" cy="4" r="2" fill="#D8E79A" opacity=".16"/></pattern>
<pattern id="rxPintas" width="90" height="70" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
  <ellipse cx="20" cy="18" rx="9" ry="6" fill="#2A3F10" opacity=".35"/><ellipse cx="62" cy="48" rx="6" ry="4" fill="#2A3F10" opacity=".3"/><ellipse cx="74" cy="12" rx="4" ry="3" fill="#2A3F10" opacity=".3"/></pattern>
<radialGradient id="rxOlho" cx=".36" cy=".34" r=".72"><stop offset="0" stop-color="${P.irisClara}"/><stop offset=".55" stop-color="${P.iris}"/><stop offset="1" stop-color="#8A3E06"/></radialGradient>
<linearGradient id="rxBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.barriga}" stop-opacity="0"/><stop offset=".5" stop-color="${P.barriga}" stop-opacity=".95"/><stop offset="1" stop-color="${P.barrigaEsc}"/></linearGradient>
<linearGradient id="rxBarU" gradientUnits="userSpaceOnUse" x1="0" y1="-372" x2="0" y2="-205"><stop offset="0" stop-color="${P.barriga}" stop-opacity="0"/><stop offset=".55" stop-color="${P.barriga}" stop-opacity=".92"/><stop offset="1" stop-color="${P.barrigaEsc}"/></linearGradient>
<linearGradient id="rxBarP" gradientUnits="userSpaceOnUse" x1="560" y1="-470" x2="470" y2="-350"><stop offset="0" stop-color="${P.barriga}" stop-opacity="0"/><stop offset=".6" stop-color="${P.barriga}" stop-opacity=".9"/><stop offset="1" stop-color="${P.barrigaEsc}"/></linearGradient>
<linearGradient id="rxBarM" gradientUnits="userSpaceOnUse" x1="0" y1="-445" x2="0" y2="-412"><stop offset="0" stop-color="${P.barriga}" stop-opacity="0"/><stop offset="1" stop-color="${P.barriga}" stop-opacity=".95"/></linearGradient>
<filter id="rxBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="rxBlurP" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
`;
/** parte com volume: d = contorno; base/sombra/luz = cores; ds/dl = quanto a forma desliza para a sombra e para a luz (px);
 *  textura = padrão por cima; longe = parte do lado de lá (mais escura e sem luz) */
function vol(d, { base = P.pele, sombra = P.peleSomb, luz = P.luz, ds = 34, dl = 9, sw = 7, textura = 'rxEsc', pintas = false, longe = false, extra = '' } = {}) {
  const id = 'v' + (_id++);
  const sx = r2(LUZ[0] * ds), sy = r2(LUZ[1] * ds), lx = r2(-LUZ[0] * dl), ly = r2(-LUZ[1] * dl);
  const b = longe ? '#3E5A1C' : base, so = longe ? '#22340C' : sombra;
  let s = `<clipPath id="${id}c"><path d="${d}"/></clipPath>`;
  s += `<mask id="${id}s"><path d="${d}" fill="#fff"/><path d="${d}" transform="translate(${sx},${sy})" fill="#000" filter="url(#rxBlurP)"/></mask>`;
  s += `<path d="${d}" fill="${b}"/>`;
  s += `<g clip-path="url(#${id}c)">`;
  if (extra) s += extra;
  s += `<path d="${d}" fill="${so}" mask="url(#${id}s)" opacity=".85"/>`;
  if (textura) s += `<path d="${d}" fill="url(#${textura})"/>`;
  if (pintas) s += `<path d="${d}" fill="url(#rxPintas)"/>`;
  if (!longe && luz) { s += `<mask id="${id}l"><path d="${d}" fill="#fff"/><path d="${d}" transform="translate(${lx},${ly})" fill="#000"/></mask><path d="${d}" fill="${luz}" mask="url(#${id}l)" opacity=".9"/>`; }
  s += `</g><path d="${d}" fill="none" stroke="${P.contorno}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  return s;
}
const rot = (a, x, y, c) => `<g transform="rotate(${r2(a)},${r2(x)},${r2(y)})">${c}</g>`;

/** perna: tudo desenhado em repouso e girado em hierarquia (quadril -> joelho -> tornozelo) */
function perna({ coxa = 0, joelho = 0, torn = 0, longe = false } = {}) {
  const H = [20, -420], J = [95, -235], T = [-5, -92], B = [70, -14];
  const o = { longe };
  const dedos = [[-6, 92], [12, 80], [-26, 64]].map(([a, L]) => {
    const r = a * Math.PI / 180, E = [B[0] + Math.cos(r) * L, B[1] + Math.sin(r) * L * 0.4 + 6];
    return vol(`M${B[0]},${B[1] - 16} Q${r2(E[0] - 10)},${r2(E[1] - 18)} ${r2(E[0])},${r2(E[1] - 8)} Q${r2(E[0] + 6)},${r2(E[1] + 4)} ${r2(E[0] - 8)},${r2(E[1] + 8)} L${B[0]},${B[1] + 12} Z`, { ...o, ds: 10, dl: 3, sw: 5 }) +
      `<path d="M${r2(E[0] - 4)},${r2(E[1] - 6)} q20,-2 26,14" stroke="${P.contorno}" stroke-width="11" stroke-linecap="round" fill="none"/><path d="M${r2(E[0] - 4)},${r2(E[1] - 6)} q20,-2 26,14" stroke="${P.unha}" stroke-width="5.5" stroke-linecap="round" fill="none"/>`;
  });
  const pe = dedos.join('') + vol(`M${T[0] - 26},${T[1] - 10} Q${T[0] + 30},${T[1] - 20} ${B[0] + 20},${B[1] - 18} Q${B[0] + 26},${B[1] + 8} ${B[0] - 6},${B[1] + 10} Q${T[0] + 4},${T[1] + 40} ${T[0] - 26},${T[1] - 10} Z`, { ...o, ds: 16, dl: 5 });
  const canela = vol(`M${J[0] - 50},${J[1] - 20} Q${J[0] + 40},${J[1] - 40} ${J[0] + 46},${J[1] + 10} Q${T[0] + 50},${T[1] - 10} ${T[0] + 22},${T[1] + 12} Q${T[0] - 18},${T[1] + 20} ${T[0] - 30},${T[1] - 6} Q${J[0] - 60},${J[1] + 60} ${J[0] - 50},${J[1] - 20} Z`, { ...o, ds: 22, dl: 7 }) +
    (longe ? '' : `<path d="M${J[0] - 20},${J[1] + 20} q10,10 30,6 M${J[0] - 26},${J[1] + 40} q12,8 28,4" stroke="${P.peleSomb}" stroke-width="4" fill="none" opacity=".7"/>`);
  const coxaD = `M${H[0] - 175},${H[1] - 40} Q${H[0] - 60},${H[1] - 150} ${H[0] + 110},${H[1] - 70} Q${H[0] + 175},${H[1] + 40} ${J[0] + 60},${J[1] - 10} Q${J[0] + 30},${J[1] + 34} ${J[0] - 30},${J[1] + 18} Q${H[0] - 120},${H[1] + 130} ${H[0] - 175},${H[1] - 40} Z`;
  const coxa_ = vol(coxaD, { ...o, ds: 46, dl: 11, pintas: true });
  return rot(coxa, H[0], H[1], coxa_ + rot(joelho, J[0], J[1], canela + rot(torn, T[0], T[1], pe)));
}

/** bracinho: ombro S; desenhado em repouso (pendurado para baixo e para a frente) e girado em hierarquia */
function bracinho({ ombro = 0, cotovelo = 0, pulso = 0, dedos = 0.3, musc = 0, k = 1, longe = false } = {}) {
  const S = [452, -292], E = [S[0] + 18 * k, S[1] + 60 * k], W = [E[0] + 38 * k, E[1] + 26 * k];
  const o = { longe, ds: 9, dl: 3, sw: 5, textura: 'rxEsc' };
  const g = Math.min(k, 1.5), wk = 1 + 0.25 * musc;
  const dedo = (a, L) => { const r = a * Math.PI / 180, F = [W[0] + Math.cos(r) * L * g, W[1] + Math.sin(r) * L * g], r2a = (a + 40) * Math.PI / 180, F2 = [F[0] + Math.cos(r2a) * 14 * g, F[1] + Math.sin(r2a) * 14 * g];
    return vol(`M${r2(W[0] - 6)},${r2(W[1] - 6)} L${r2(F[0])},${r2(F[1] - 5)} L${r2(F[0] + 2)},${r2(F[1] + 5)} L${r2(W[0] + 2)},${r2(W[1] + 8)} Z`, { ...o, ds: 5, dl: 2, sw: 4 }) +
      `<path d="M${r2(F[0])},${r2(F[1])} Q${r2(F[0] + Math.cos(r) * 12)},${r2(F[1] + Math.sin(r) * 12)} ${r2(F2[0])},${r2(F2[1])}" stroke="${P.contorno}" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M${r2(F[0])},${r2(F[1])} Q${r2(F[0] + Math.cos(r) * 12)},${r2(F[1] + Math.sin(r) * 12)} ${r2(F2[0])},${r2(F2[1])}" stroke="${P.unha}" stroke-width="4.5" stroke-linecap="round" fill="none"/>`; };
  const mao = dedo(10 + 30 * dedos, 26) + dedo(-12 - 22 * dedos, 30);
  const ante = vol(`M${E[0] - 13 * wk},${E[1] - 6} Q${E[0] + 6},${E[1] - 18 * wk} ${W[0] + 6},${W[1] - 12} Q${W[0] + 14},${W[1] + 2} ${W[0]},${W[1] + 12} Q${E[0] + 4},${E[1] + 18 * wk} ${E[0] - 13 * wk},${E[1] - 6} Z`, o);
  const bD = `M${S[0] - 20 * wk},${S[1] - 10} Q${S[0] + 10},${S[1] - 24 * wk} ${S[0] + 22 * wk},${S[1] + 8} Q${E[0] + 18 * wk},${E[1] - 8} ${E[0] + 10},${E[1] + 10} Q${E[0] - 12},${E[1] + 16} ${E[0] - 16 * wk},${E[1] - 4} Q${S[0] - 26 * wk},${S[1] + 26} ${S[0] - 20 * wk},${S[1] - 10} Z`;
  let braco_ = vol(bD, o);
  if (musc > 0.01) { const M = [(S[0] + E[0]) / 2 + 10, (S[1] + E[1]) / 2 - 2]; braco_ += vol(`M${r2(M[0] - 8 - 18 * musc)},${r2(M[1] + 6)} Q${r2(M[0])},${r2(M[1] - 26 * musc - 6)} ${r2(M[0] + 14 + 16 * musc)},${r2(M[1] + 2)} Q${r2(M[0] + 4)},${r2(M[1] + 14)} ${r2(M[0] - 8 - 18 * musc)},${r2(M[1] + 6)} Z`, { ...o, base: P.peleClara, ds: 6, dl: 3, sw: 4 }); }
  return { svg: rot(ombro, S[0], S[1], braco_ + rot(cotovelo, E[0], E[1], ante + rot(pulso, W[0], W[1], mao))), S, E, W };
}

/** o REX inteiro de perfil */
function rexLado(o = {}) {
  const { pescoco = 0, cabeca = 0, boca = 0, cauda = 0, respira = 1, t = 0, olho = [0, 0], palpebra = 0, sobrancelha = 0, suor = 0, sombra = true,
    coxaC = 0, joelhoC = 0, tornC = 0, coxaL = 0, joelhoL = 0, tornL = 0, bracoCa = {}, bracoLa = {}, corpoY = 0, corpoGiro = 0 } = o;
  _id = (o.idBase || 0);
  const ar = Math.sin(t * 2.0) * 4 * respira;
  let s = '';
  if (sombra) s += `<ellipse cx="40" cy="4" rx="560" ry="36" fill="#2A230E" opacity=".42" filter="url(#rxBlur)"/>`;
  // perna e braço de lá (atrás)
  s += `<g transform="translate(-48,-6)">${perna({ coxa: coxaL, joelho: joelhoL, torn: tornL, longe: true })}</g>`;
  let tronco = '';
  tronco += `<g transform="translate(-30,-8)">${bracinho({ ...bracoCa, ...bracoLa, longe: true }).svg}</g>`;
  // cauda + tronco: peito fundo, quadril alto, cauda grossa na base que afina (cauda: graus de balanço na ponta)
  const cw = cauda, tip = [-790, -398 + cw * 2.2], mid = [-420, -446 + cw * 0.8];
  const corpoD = `M${r2(tip[0])},${r2(tip[1])} C${r2(-650)},${r2(-420 + cw * 1.5)} ${r2(mid[0] - 80)},${r2(mid[1] - 20)} -250,-500 C-110,-538 70,-560 210,-548 C320,-538 380,-512 425,-486 L470,-372 C478,-300 440,-230 350,-200 C240,-172 90,-190 -20,-252 C-140,-318 ${r2(mid[0] + 40)},${r2(mid[1] + 82)} ${r2(tip[0] + 6)},${r2(tip[1] + 10)} Z`;
  tronco += vol(corpoD, { ds: 60, dl: 13, pintas: true, extra:
    // barriga clara por baixo + listras escuras do dorso (camuflagem)
    `<path d="${corpoD}" fill="url(#rxBarU)"/>` +
    Array.from({ length: 10 }, (_, i) => { const x = -650 + i * 112, y = x < -250 ? -430 - (x + 650) * 0.17 : -500 - (x + 250) * 0.11; return `<path d="M${x},${r2(y - 40)} q26,44 8,104 q-20,-44 -8,-104 Z" fill="${P.listra}" opacity=".5"/>`; }).join('') });
  // fileira de escamas grossas (osteodermos baixos) no dorso
  for (let i = 0; i < 22; i++) { const x = -700 + i * 50, y = x < -250 ? -416 - (x + 700) * 0.18 + (x < -420 ? cw * ((-420 - x) / 370) * 1.8 : 0) : x < 210 ? -500 - (x + 250) * 0.105 : -548 + (x - 210) * 0.17; tronco += `<ellipse cx="${x}" cy="${r2(y + 3)}" rx="12" ry="7" fill="${P.peleEsc}" stroke="${P.contorno}" stroke-width="3"/>`; }
  // dobras do peito (onde o pescoço encontra o tronco)
  tronco += `<path d="M445,-430 q-24,40 -10,88 M420,-445 q-30,50 -16,104" stroke="${P.peleSomb}" stroke-width="5" fill="none" opacity=".7"/>`;
  const TRONCO = `<g transform="translate(0,${r2(ar * 0.4 + corpoY)}) rotate(${r2(corpoGiro)},20,-420)">${tronco}</g>`;
  // pescoço + cabeça
  const BP = [430, -440 + ar * 0.5 + corpoY];
  let ch = '';
  ch += vol(`M340,-500 C420,-600 540,-626 610,-590 C630,-540 632,-500 622,-468 C598,-396 532,-346 456,-336 C420,-380 380,-440 340,-500 Z`, { ds: 30, dl: 9, pintas: true, extra:
    `<path d="M640,-470 C610,-390 540,-344 456,-336 L470,-300 L660,-300 Z" fill="${P.barriga}" opacity=".55" filter="url(#rxBlurP)"/>` });
  ch += `<path d="M478,-372 q30,-20 52,-70 M505,-366 q30,-24 46,-74" stroke="${P.peleSomb}" stroke-width="4" fill="none" opacity=".6"/>`;
  // cabeça: occipital em OC; mandíbula articula em AR
  const OC = [560, -560], AR = [585, -478], ab = boca * 34;
  let cab = '';
  // interior da boca (atrás de tudo)
  cab += `<path d="M585,-482 L846,-476 L${r2(846 - ab * 1.6)},${r2(-476 + ab * 5.2)} L585,-476 Z" fill="${P.boca}" opacity="${r2(Math.min(1, boca * 4))}"/>`;
  cab += `<path d="M600,-478 Q700,${r2(-470 + ab * 2.6)} ${r2(820 - ab)},${r2(-472 + ab * 3.6)}" stroke="${P.lingua}" stroke-width="14" fill="none" stroke-linecap="round" opacity="${r2(Math.min(1, boca * 4))}"/>`;
  // mandíbula
  let mand = vol(`M560,-478 C660,-478 760,-474 836,-474 C860,-474 866,-460 858,-450 C832,-426 760,-418 690,-412 C630,-408 586,-414 566,-430 C550,-444 548,-468 560,-478 Z`, { ds: 18, dl: 6, extra:
    `<path d="M560,-478 C660,-478 760,-474 836,-474 C860,-474 866,-460 858,-450 C832,-426 760,-418 690,-412 C630,-408 586,-414 566,-430 C550,-444 548,-468 560,-478 Z" fill="url(#rxBarM)"/>` });
  for (let i = 0; i < 11; i++) { const x = 612 + i * 21, h = 13 + Math.sin(i * 1.7) * 3 + (i > 2 && i < 7 ? 4 : 0); mand += `<path d="M${x - 6},-476 L${x},${-476 - h} L${x + 6},-476 Z" fill="${P.dente}" stroke="${P.contorno}" stroke-width="2.5" opacity="${r2(Math.min(1, 0.25 + boca * 3))}"/>`; }
  mand += `<path d="M570,-476 C680,-480 780,-480 850,-470" stroke="${P.contorno}" stroke-width="5" fill="none"/>`;
  cab += rot(ab, AR[0], AR[1], mand);
  // crânio: largo atrás, focinho alto e comprido, ponta arredondada
  const crD = `M500,-570 C520,-650 600,-668 680,-652 C750,-640 815,-608 848,-566 C866,-542 864,-500 846,-484 C780,-478 660,-480 585,-482 C540,-484 505,-500 496,-526 C490,-546 494,-560 500,-570 Z`;
  let cran = vol(crD, { ds: 30, dl: 9, pintas: true, extra:
    `<path d="M540,-498 C640,-490 760,-490 850,-500 L850,-470 L540,-470 Z" fill="${P.peleEsc}" opacity=".35"/>` });
  // dentes de cima, sob o lábio
  for (let i = 0; i < 12; i++) { const x = 600 + i * 21, h = 15 + Math.sin(i * 1.3) * 4 + (i > 3 && i < 8 ? 5 : 0); cran += `<path d="M${x - 6},-484 L${x},${-484 + h} L${x + 6},-484 Z" fill="${P.dente}" stroke="${P.contorno}" stroke-width="2.5"/>`; }
  cran += `<path d="M585,-488 C680,-482 780,-482 852,-492" stroke="${P.contorno}" stroke-width="5" fill="none"/>`;
  // fenestra atrás do olho, rugosidades do focinho, narina
  cran += `<path d="M528,-560 C548,-592 592,-588 604,-566 C606,-536 576,-516 548,-520 C530,-526 524,-544 528,-560 Z" fill="${P.peleSomb}" opacity=".45"/>`;
  for (let i = 0; i < 8; i++) cran += `<ellipse cx="${700 + i * 19}" cy="${-626 + i * 8 + (i % 2) * 5}" rx="7" ry="4.5" fill="${P.peleEsc}" stroke="${P.contorno}" stroke-width="2" opacity=".8"/>`;
  cran += `<path d="M826,-566 q14,-8 20,6" stroke="${P.contorno}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  // olho e sobrancelha óssea (a expressão)
  const ox = 652, oy = -604, sb = sobrancelha;
  cran += `<ellipse cx="${ox}" cy="${oy}" rx="20" ry="18" fill="url(#rxOlho)" stroke="${P.contorno}" stroke-width="5"/>`;
  cran += `<ellipse cx="${r2(ox + 3 + olho[0] * 7)}" cy="${r2(oy + olho[1] * 6)}" rx="5.5" ry="12.5" fill="#160E04"/><circle cx="${r2(ox + olho[0] * 6)}" cy="${r2(oy - 6 + olho[1] * 5)}" r="4.5" fill="#FFFFFF"/>`;
  if (palpebra > 0.01) cran += `<path d="M${ox - 22},${oy} A22,20 0 0 1 ${ox + 22},${oy} L${ox + 22},${r2(oy - 20 + 40 * palpebra)} L${ox - 22},${r2(oy - 20 + 40 * palpebra)} Z" fill="${P.pele}" stroke="${P.contorno}" stroke-width="4"/>`;
  cran += `<path d="M${ox - 36},${r2(oy - 14 - sb * 7)} Q${ox},${r2(oy - 46 - sb * 15)} ${ox + 44},${r2(oy - 24 + sb * 11)}" stroke="${P.peleSomb}" stroke-width="17" fill="none" stroke-linecap="round"/>`;
  cran += `<path d="M${ox - 34},${r2(oy - 19 - sb * 7)} Q${ox},${r2(oy - 50 - sb * 15)} ${ox + 42},${r2(oy - 29 + sb * 11)}" stroke="${P.luz}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`;
  for (let i = 0; i < 2; i++) { if (suor < 0.01) break; const k = ((t * 1.1 + i * 0.5) % 1), gx = 620 + i * 100, gy = -690 + k * 70; cran += `<path d="M${gx},${r2(gy - 18)} Q${gx + 12},${r2(gy)} ${gx},${r2(gy + 9)} Q${gx - 12},${r2(gy)} ${gx},${r2(gy - 18)} Z" fill="#A9E7FF" stroke="#2B7DA8" stroke-width="3" opacity="${r2(suor * (1 - k))}"/>`; }
  cab += cran;
  ch += rot(cabeca, OC[0], OC[1], cab);
  s += `<g transform="translate(0,${r2(ar * 0.5 + corpoY)})">${rot(pescoco, BP[0], BP[1], ch)}</g>` + TRONCO + perna({ coxa: coxaC, joelho: joelhoC, torn: tornC });
  // braço de cá (na frente do peito)
  const bC = bracinho(bracoCa);
  s += (o.naMao || '') + `<g transform="translate(0,${r2(ar * 0.4 + corpoY)}) rotate(${r2(corpoGiro)},20,-420)">${bC.svg}</g>`;   // naMao: objeto entre o peito e o braço de cá (a mão fica por cima)
  return { svg: s };
}
if (typeof module !== 'undefined') module.exports = { rexLado, DEFS_REX, P };
