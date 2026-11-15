/* =====================================================================================
   POR QUE A PIPOCA ESTOURA? 🍿  (Short de 28,2 s, 71 palavras, 9 planos; primeiro corte aos 2,2 s)
   Formato dos virais: a 1ª frase descreve o quadro 0; cada frase muda a tela; termina quando o processo
   termina; o último plano repete o primeiro (a pipoca no lugar do grão, no centro do quadro).

   DECUPAGEM (diretor)
    1 grao      0 – 2,2    EXTREMO CLOSE (quadro 0). De baixo, na altura do óleo, lente macro (fundo desfocado, grãos
                           desfocados em primeiro plano). Push-in lento. Contraluz laranja das chamas. Termômetro no canto.
    2 corte   2,2 – 4,3    CLOSE no corte do grão. Uma varredura de luz abre o grão ao meio; tele, dolly lateral lento; a
                           gota de água fica nítida e vira vapor.
    3 pressao 4,3 – 8,5    MACRO na parede da casca. Push-in; o vapor bate na parede (pulsos de luz), setas de pressão
                           empurram para fora e o manômetro sobe.
    4 calor   8,5 – 12,9   PLANO GERAL, plongée, pull-out: a panela com vários grãos. O termômetro chega a 180 °C e o
                           manômetro à zona vermelha; tremor de câmera crescendo. Corte seco no estouro.
    5 estouro 12,9 – 17,5  CLOSE em câmera lenta. O grão racha, estoura (flash suave, onda de choque), a espuma de amido
                           cresce e a câmera recua para mostrar o tamanho.
    6 estalo  17,5 – 21,6  PLANO MÉDIO "esquemático": a casca racha em silêncio (medidor de som parado); o vapor escapa
                           e o medidor dispara (anéis de som saem do vapor, não da casca).
    7 pula    21,6 – 24,0  CONTRA-PLONGÉE, tilt acompanhando o voo: a perna de amido empurra, a pipoca gira no ar.
    8 pouso   24,0 – 25,0  CLOSE: a pipoca cai no lugar do grão e assenta.
    9 coro    25,0 – 28,2  PLANO GERAL, plongée, pull-out lento: a grandona já é pipoca e os outros grãos estouram um atrás
                           do outro e pulam (cada estouro dá um tranco na câmera). Termômetro HRYZ Animation no canto.
   ===================================================================================== */
const SH = [['grao', 0, 2.2], ['corte', 2.2, T('b2') - .1], ['pressao', T('b2') - .1, T('b3') - .1], ['calor', T('b3') - .1, T('b4') - .1], ['estouro', T('b4') - .1, T('b5') - .1],
  ['estalo', T('b5') - .1, 21.6], ['pula', 21.6, 24.0], ['pouso', 24.0, 25.0], ['coro', 25.0, TOTAL]];
const FLASH = ['estalo', 'pula', 'coro'];
const hand2 = t => [Math.sin(t * 1.3) * 3 + Math.sin(t * 3.1) * 1.5, Math.cos(t * 1.1) * 3];
const shotAt = t => SH.find(s => t >= s[1] && t < s[2]) || SH[SH.length - 1];
const loc = (t, id) => { const s = SH.find(x => x[0] === id); return { L: t - s[1], d: s[2] - s[1], k: (t - s[1]) / (s[2] - s[1]) }; };
const BASE = [540, 980, 1];
const POP = 13.85;                                           // instante do estouro
const REST_Y = 640;                                          // centro da pipoca assentada no óleo
const heatAt = t => clamp(t / 10);
const tempAt = t => t < 8.5 ? lerp(105, 146, t / 8.5) : t < 10 ? lerp(146, 180, easeOut(range(t, 8.5, 10))) : 180;
const presAt = t => t < 4.3 ? 1 + .5 * range(t, 2.2, 4.3) : t < 8.5 ? lerp(1.5, 6.5, easeInOut(range(t, 4.3, 8.5))) : t < 11.8 ? lerp(6.5, 10.2, easeInOut(range(t, 8.5, 11.8))) : t < POP ? 10.2 + .4 * range(t, 11.8, POP) : 10.6 * (1 - easeOut(range(t, POP, POP + .3)));
const gKernel = (sc, inner, x = K.x, y = K.y, rot = 0) => `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${sc})">${inner}</g>`;
const gota = (cx, cy, r, op0) => `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}" fill="#FFC24A" opacity="${op(op0)}"/><circle cx="${f1(cx - r * .3)}" cy="${f1(cy - r * .3)}" r="${f1(r * .3)}" fill="#FFF3C0" opacity="${op(op0 * .8)}"/>`;

/* ===================== 1. o grão no óleo ===================== */
function sGrao(t) {
  const { L, d, k } = loc(t, 'grao'), [jx, jy] = hand2(t), heat = heatAt(t);
  setCam(540 + jx * .8, lerp(990, 965, k) + jy * .8, lerp(1.0, 1.14, easeInOut(k)), lerp(-1.2, .8, k), BASE);
  const tr = Math.sin(t * 38) * lerp(1.2, 3.2, k), tr2 = Math.cos(t * 29) * lerp(.8, 2.2, k);
  const sub = gKernel(KS, grao(t, { glow: heat * .3 }), K.x + tr, K.y + tr2) + oleo(t) + bolhasOleo(t, heat);
  return panela(t, heat, sub) + termometro(tempAt(t), t, 1) + VIG(.5) + GRAINV(t);
}
/* ===================== 2. a varredura abre o grão ===================== */
function sCorte(t) {
  const { L, d, k } = loc(t, 'corte'), [jx, jy] = hand2(t), heat = heatAt(t), e = easeInOut(k);
  setCam(lerp(540, 590, e) + jx, lerp(965, 945, e) + jy, lerp(1.14, 1.4, e), lerp(.8, -.6, e), BASE);
  const sx = lerp(K.x - 400, K.x + 400, easeInOut(range(L, 0, .6))), gt = 1 - .62 * easeInOut(range(L, .7, 1.9)), vap = .5 * easeInOut(range(L, .8, 2.0));
  const idL = nid('cl'), idR = nid('cr');
  def(`<clipPath id="${idL}"><rect x="-900" y="-400" width="${f1(sx + 900)}" height="3000"/></clipPath><clipPath id="${idR}"><rect x="${f1(sx)}" y="-400" width="2000" height="3000"/></clipPath>`);
  const corte = `<g clip-path="url(#${idL})">${gKernel(KS, graoCorte(t, { gota: gt, vapor: vap, pres: .08, heat }))}</g>`;
  const fora = `<g clip-path="url(#${idR})">${gKernel(KS, grao(t, { glow: heat * .3 }))}</g>`;
  const linha = L < .75 ? `<g opacity="${op(Math.sin(range(L, 0, .7) * Math.PI))}"><rect x="${f1(sx - 5)}" y="${K.y - 420}" width="10" height="840" fill="#9CF0FF"/><rect x="${f1(sx - 30)}" y="${K.y - 420}" width="60" height="840" fill="#9CF0FF" opacity=".25" filter="url(#b12)"/></g>` : '';
  return panela(t, heat, corte + fora + oleo(t) + bolhasOleo(t, heat) + linha) + termometro(tempAt(t), t, 1 - range(L, .6, 1)) + VIG(.5) + GRAINV(t);
}
/* ===================== 3. a pressão sobe ===================== */
function sPressao(t) {
  const { L, d, k } = loc(t, 'pressao'), [jx, jy] = hand2(t), heat = heatAt(t), e = easeInOut(k);
  setCam(K.x + lerp(-35, -85, e) + jx * .6, K.y + lerp(-14, -48, e) + jy * .6, lerp(1.5, 2.3, e), lerp(-.6, 1.2, e), BASE);
  const pv = presAt(t), pres = clamp((pv - 1) / 9.6), gt = Math.max(0, .38 - .38 * easeOut(range(L, 0, 1.2))), vap = lerp(.5, 1, easeOut(range(L, 0, 1.6))), gel = .4 * range(L, 2.2, 4.0);
  let sp = '';
  for (let i = 0; i < 7; i++) { const ph = (t * (1.6 + .5 * i) + hh(i)) % 1, y = -150 + i * 46, x = -(148 + 18 * Math.sin(y / 60)); sp += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(8 + 30 * ph)}" fill="#FFF4C8" opacity="${op((1 - ph) ** 2 * pres * 1.3)}"/>`; }
  const sub = gKernel(KS, graoCorte(t, { gota: gt, vapor: vap, pres, heat, gel }) + sp) + oleo(t) + bolhasOleo(t, heat);
  return panela(t, heat, sub, false) + manometro(pv, t, range(L, 0, .4)) + VIG(.55) + GRAINV(t);
}
/* ===================== 4. a panela esquenta (plano geral) ===================== */
function sCalor(t) {
  const { L, d, k } = loc(t, 'calor'), [jx, jy] = hand2(t), heat = heatAt(t), tremor = lerp(1, 7, easeIn(k));
  setCam(540 + jx * (1 + 2.5 * k) + Math.sin(t * 43) * tremor * .6, lerp(1010, 1000, k) + 45 * easeIn(range(L, 3.2, 4.4)) + jy + Math.cos(t * 37) * tremor * .6, L < 3.2 ? lerp(1.5, 1.0, easeInOut(range(L, 0, 3.2))) : lerp(1.0, 1.32, easeIn(range(L, 3.2, 4.4))), lerp(-1.2, 0, k), BASE);
  return lay(1, panelaTopo(t, heat, tremor, range(t, 12.0, 12.8))) + termometro(tempAt(t), t, 1) + manometro(presAt(t), t, 1) + VIG(.6) + GRAINV(t);
}
/* ===================== 5. o estouro em câmera lenta ===================== */
function sEstouro(t) {
  const { L, d } = loc(t, 'estouro'), [jx, jy] = hand2(t), P0 = POP - 12.9, q = Math.max(0, L - P0), fk = 1 - Math.pow(1 - range(q, 0, 1.8), 4), pre = L < P0, pk = range(L, 0, P0);
  const shake = pre ? 3 + 7 * pk : 16 * Math.exp(-q * 3.5), zk = easeOut(range(q, 0, 2.7));
  setCam(540 + jx + Math.sin(t * 59) * shake, (pre ? lerp(965, 930, pk) : lerp(930, 770, zk)) + jy + Math.cos(t * 47) * shake, pre ? lerp(1.4, 1.75, easeIn(pk)) : lerp(1.8, .5, zk), pre ? lerp(1.4, -1, pk) : lerp(-1, 1.5, easeOut(range(q, 0, 3))), BASE);
  let sub = '';
  if (pre) {
    const a = 3 + 8 * pk;
    sub += gKernel(KS, grao(t, { glow: 1, crack: range(L, 0, P0 - .15) }), K.x + Math.sin(t * 47) * a, K.y + Math.cos(t * 41) * a);
  } else {
    if (q < .14) sub += `<g opacity="${op(1 - q / .14)}">${gKernel(f1(KS * (1 + .2 * q / .14) * 1000) / 1000, grao(t, { glow: 1 }))}</g>`;
    sub += `<g transform="translate(${K.x},${K.y}) scale(${KS})">${metade(-1, q)}${metade(1, q)}</g>`;
    sub += `<g transform="translate(${K.x},${f1(lerp(K.y, REST_Y, fk))}) scale(${KS})">${espuma(fk, t)}</g>`;
    const tau = q * .9;
    for (let i = 0; i < 8; i++) { const an = -Math.PI * (.12 + .76 * hh(i, 1)), v = 600 + 500 * hh(i, 2); sub += `<g transform="translate(${f1(K.x + Math.cos(an) * v * tau)},${f1(K.y - 60 + Math.sin(an) * v * tau + 1200 * tau * tau)}) rotate(${f1(q * 300 * (hh(i, 3) - .5))}) scale(1.6)" opacity="${op(1 - range(q, .8, 1.6))}"><path d="M-34 0 Q0 -26 34 0 Q0 -10 -34 0Z" fill="#E39A1C" stroke="#9A5A0C" stroke-width="3"/></g>`; }
    for (let i = 0; i < 16; i++) { const v = 500 + 450 * hh(i, 4), x = K.x + (hh(i, 5) - .5) * 900 * tau, y = OIL - v * tau * 1.1 + 1000 * tau * tau; sub += gota(x, y, 8 + 12 * hh(i, 6), 1 - range(q, 1, 1.8)); }
    const rk = easeOut(range(q, 0, .55));
    sub += `<circle cx="${K.x}" cy="${K.y}" r="${f1(140 + 1300 * rk)}" fill="none" stroke="#FFF6DC" stroke-width="${f1(26 * (1 - rk))}" opacity="${op((1 - rk) * .9)}"/>`;
  }
  sub += oleo(t) + bolhasOleo(t, 1);
  const inst = pre ? 1 : 1 - range(q, .3, .9);
  let s = panela(t, 1, sub, false);
  if (inst > 0) s += termometro(180, t, inst) + manometro(presAt(t), t, inst);
  if (!pre) s += `<rect width="1080" height="1920" fill="#FFF3D0" opacity="${op(.5 * Math.exp(-q * 12))}"/>`;
  return s + VIG(.5) + GRAINV(t);
}
/* ===================== 6. de onde vem o estalo ===================== */
function sEstalo(t) {
  const { L, d, k } = loc(t, 'estalo'), [jx, jy] = hand2(t);
  setCam(540 + jx * .5, 880 + jy * .5, lerp(1.0, 1.08, k), lerp(.6, -.4, k), BASE);
  const S6 = 1.95, C6 = [540, 700], cp = range(L, .3, 1.9), open = easeOut(range(L, 2.2, 2.6));
  let s = `<rect x="-900" y="-1400" width="2900" height="4600" fill="#0C1822"/>`;
  let g = ''; for (let x = -540; x <= 1620; x += 90) g += `M${x} -400 L${x} 2400 `; for (let y = -400; y <= 2400; y += 90) g += `M-540 ${y} L1620 ${y} `;
  s += `<path d="${g}" stroke="#18303F" stroke-width="2" fill="none" opacity=".7"/><ellipse cx="540" cy="700" rx="620" ry="680" fill="url(#gWarm)" opacity=".28"/>`;
  s += `<g transform="translate(${C6[0]},${C6[1]}) scale(${S6})">${graoCorte(t, { gota: 0, vapor: 1 - .5 * open, pres: 1 - .6 * open, gel: 1, heat: 1 })}`;
  const crack = 'M141 -173 L128 -160 L136 -148 L118 -140 L104 -134';
  if (open < 1) s += `<path d="${crack}" stroke="#FF7A22" stroke-width="12" fill="none" stroke-dasharray="${f1(70 * cp)} 200" stroke-linecap="round" stroke-linejoin="round" opacity=".7" filter="url(#b4)"/><path d="${crack}" stroke="#FFF4C8" stroke-width="4" fill="none" stroke-dasharray="${f1(70 * cp)} 200" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (open > 0) s += `<g transform="translate(104,-134) scale(${f1(open * 1000) / 1000}) translate(-104,134)"><path d="M104 -134 L112 -158 L106 -172 L121 -190 L127 -207 L145 -194 L156 -204 L166 -178 L180 -158 L162 -152 L152 -140 L134 -144 L120 -126Z" fill="#0C1822"/><path d="M127 -207 L121 -190 L106 -172 L112 -158 L104 -134 L120 -126 L134 -144 L152 -140 L162 -152 L180 -158 L166 -178 L156 -204 L145 -194 Z" stroke="#FFF4C8" stroke-width="4" fill="none" stroke-linejoin="round"/></g>`;
  s += `</g>`;
  const G = [C6[0] + S6 * 143, C6[1] + S6 * -175], u = [.63, -.78], pv = [.78, .63];
  if (open > 0) {
    for (let j = 0; j < 14; j++) { const tau = ((j / 14) + t * 1.2) % 1, dist = tau * 760, x = G[0] + u[0] * dist + pv[0] * Math.sin(t * 6 + j) * 40 * tau, y = G[1] + u[1] * dist + pv[1] * Math.sin(t * 6 + j) * 40 * tau, r = 22 + 90 * tau; s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="#EAF9FF" opacity="${op((1 - tau) * .85 * open)}" filter="url(#b4)"/>`; }
    for (let i = 0; i < 10; i++) { const tr = t - (19.7 + .24 * i); if (tr > 0 && tr < 1.8) s += `<circle cx="${f1(G[0])}" cy="${f1(G[1])}" r="${f1(60 + 600 * tr)}" fill="none" stroke="#7FE8FF" stroke-width="${f1(8 * (1 - tr / 1.8) + 1)}" opacity="${op((1 - tr / 1.8) * .9)}"/>`; }
  }
  const level = L < 2.2 ? .03 : .98 * Math.exp(-(L - 2.2) * .28) + .1;
  s = lay(1, s);
  const lk1 = pulse(L, .5, 2.1, .25), lk2 = pulse(L, 2.4, 4.0, .25);
  return s + medidorSom(level, t, 540, 1470, .8) + etiquetaTexto('CASCA RACHA · SEM SOM', 540, 1240, lk1, 640) + etiquetaTexto('VAPOR ESCAPA · ESTALO', 540, 1240, lk2, 640) + VIG(.55) + GRAINV(t);
}
/* ===================== 7. o grão pula ===================== */
function sPula(t) {
  const { L, d, k } = loc(t, 'pula'), [jx, jy] = hand2(t), H = 1500, q = range(L, .35, 2.35), arc = 4 * q * (1 - q);
  setCam(540 + jx, 850 - .6 * H * arc + jy, lerp(.55, .5, k), lerp(0, -2, Math.sin(q * Math.PI)), BASE);
  const py = REST_Y - H * arc, px = 540 + 80 * Math.sin(q * 3.1), rot = -360 * easeInOut(q), sq = L < .35 ? 1 - .1 * Math.sin(range(L, .1, .35) * Math.PI) : 1 + .05 * arc;
  const leg = pulse(L, .05, .45, .18);
  let sub = `<g transform="translate(${f1(px)},${f1(py)}) rotate(${f1(rot)}) scale(${KS},${f1(KS * sq * 1000) / 1000})">${leg > 0 ? `<ellipse cx="20" cy="${f1(380 + 40 * leg)}" rx="${f1(70)}" ry="${f1(90 * leg)}" fill="url(#gEspuma)" stroke="#E7C47E" stroke-width="4"/>` : ''}${espuma(1, t)}</g>`;
  for (let i = 0; i < 14; i++) { const tau = Math.max(0, L - .35 - .05 * hh(i)), v = 700 + 600 * hh(i, 1), x = 540 + (hh(i, 2) - .5) * 1100 * tau, y = OIL - v * tau + 900 * tau * tau; if (tau > 0 && y < OIL + 20) sub += gota(x, y, 10 + 16 * hh(i, 3), 1 - range(tau, 1, 1.6)); }
  return panela(t, 1, sub + oleo(t) + bolhasOleo(t, 1), false) + VIG(.5) + GRAINV(t);
}
/* ===================== 8. cai no lugar do grão ===================== */
function sPouso(t) {
  const { L, d, k } = loc(t, 'pouso'), [jx, jy] = hand2(t), e = easeInOut(k);
  setCam(540 + jx * .6, lerp(850, 870, e) + jy * .6, lerp(.5, .52, e), lerp(-.2, -1.0, e), BASE);
  const sq = 1 - .13 * Math.exp(-4 * L) * Math.cos(16 * L), dy = 26 * Math.exp(-4 * L) * Math.cos(16 * L - 1.2);
  let sub = `<g transform="translate(540,${f1(REST_Y + dy)}) scale(${KS},${f1(KS * sq * 1000) / 1000})">${espuma(1, t)}</g>`;
  for (let i = 0; i < 12; i++) { const tau = Math.max(0, L - .02), an = -Math.PI * (.1 + .8 * hh(i, 1)), v = 500 + 500 * hh(i, 2); sub += gota(540 + Math.cos(an) * v * tau * 1.4 * (i % 2 ? 1 : -1), OIL + Math.sin(an) * v * tau + 1100 * tau * tau, 7 + 10 * hh(i, 3), 1 - range(tau, .45, .9)); }
  const rk = range(L, 0, .6);
  sub += `<ellipse cx="540" cy="${OIL}" rx="${f1(220 + 760 * easeOut(rk))}" ry="${f1(26 + 60 * easeOut(rk))}" fill="none" stroke="#FFF0B0" stroke-width="${f1(10 * (1 - rk) + 1)}" opacity="${op((1 - rk) * .8)}"/>`;
  return panela(t, 1, sub + oleo(t) + bolhasOleo(t, 1), false) + VIG(.5) + GRAINV(t);
}
/* ===================== 9. as outras pipocas estouram e pulam ===================== */
function sCoro(t) {
  const { L, d, k } = loc(t, 'coro'), [jx, jy] = hand2(t);
  let kick = 0; for (const tp of POPS_CORO) if (t > tp) kick += 6 * Math.exp(-(t - tp) * 11);
  setCam(540 + jx + Math.sin(t * 57) * kick * .6, lerp(1010, 1000, k) + jy + Math.cos(t * 49) * kick, lerp(1.18, .98, easeOut(k)), lerp(-.8, 0, k), BASE);
  return lay(1, panelaTopo(t, 1, 0, 0, coroPipocas(t))) + termometro(180, t, 1) + VIG(.55) + GRAINV(t);
}
const FN = { coro: sCoro, grao: sGrao, corte: sCorte, pressao: sPressao, calor: sCalor, estouro: sEstouro, estalo: sEstalo, pula: sPula, pouso: sPouso };
