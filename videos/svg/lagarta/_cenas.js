/* =====================================================================================
   A LAGARTA VIRA SOPA 🦋  (Short de 25,8 s, 73 palavras, 8 planos; primeiro corte aos 2,3 s)
   Fórmula dos virais: a 1ª frase descreve o quadro 0; cada frase muda a tela; termina quando o
   processo termina; o último plano repete o primeiro (a casca vazia no lugar da lagarta).

   DECUPAGEM (diretor)
    1 pendura       0 – 2,3   CLOSE (quadro 0). De baixo, lente macro (fundo desfocado, folhas em primeiro plano). Push-in lento:
                              a criatura ganha peso. Contraluz do sol nascendo (borda quente), herói nítido. Corte no movimento.
    2 troca       2,3 – 4,7   PLANO DETALHE. Altura dos olhos. A pele sobe e rasga: punch-in no momento do rasgo, a câmera
                              acompanha a pele subindo até a crisálida ficar no centro (mesma posição do plano 3). Corte por íris.
    3 sopa        4,7 – 9,2   "LUPA" redonda que cresce a partir da crisálida e vira o corte interno. Tele, fundo achatado:
                              só o corpo da lagarta e as enzimas ficam nítidos. Luz âmbar de dentro. Dolly lento.
    4 discos      9,2 – 12,7  MACRO escuro. A luz apaga, só os discos acendem (um por vez). Deriva com paralaxe, de cima para
                              baixo, na ordem em que as peças vão nascer. Etiqueta "DISCOS IMAGINAIS" no primeiro.
    5 cresce     12,7 – 16,6  PULL-OUT revelando a borboleta inteira dobrada na casca. Contador de dias (etiqueta de jardim).
                              A sopa baixa. A íris se fecha e devolve o exterior.
    6 transparente 16,6 – 21,0 Contra-plongée (de baixo), grande-angular: a casca grande contra o céu. Time-lapse do céu
                              (3 ciclos suaves) até DIA 10; a casca fica transparente e as asas aparecem. Tilt para cima. Estalo.
    7 sai         21,0 – 23,0 CLOSE no bico da casca: racha, cabeça e antenas empurram para fora, pernas agarram a borda.
    8 voa         23,0 – 25,8 Plano médio, pull-out: a borboleta pendurada incha as asas (bombeia), abre, bate e sai em
                              direção ao sol. Termina na casca vazia balançando, igual ao quadro 0 (loop).
   ===================================================================================== */
const SH = [['pendura', 0, 2.3], ['troca', 2.3, T('b2') - .1], ['sopa', T('b2') - .1, T('b3') - .1], ['discos', T('b3') - .1, T('b4') - .1], ['cresce', T('b4') - .1, T('b5') - .1],
  ['transparente', T('b5') - .1, T('b6') - .1], ['sai', T('b6') - .1, 23.0], ['voa', 23.0, TOTAL]];
const FLASH = ['troca', 'sai', 'voa'];
const hand2 = t => [Math.sin(t * 1.3) * 3 + Math.sin(t * 3.1) * 1.5, Math.cos(t * 1.1) * 3];
const shotAt = t => SH.find(s => t >= s[1] && t < s[2]) || SH[SH.length - 1];
const loc = (t, id) => { const s = SH.find(x => x[0] === id); return { L: t - s[1], d: s[2] - s[1], k: (t - s[1]) / (s[2] - s[1]) }; };
const PC = PAD.y + 208 * PS;                          // centro da crisálida no mundo
const BASE = [560, 780, 1];
const kSky = t => {
  if (t < 16.6) return .42;
  if (t < 21.0) { const L = t - 16.6; return .42 + .3 * Math.sin(2 * Math.PI * L / .95) * (1 - range(L, 1.0, 1.5)) + .12 * range(L, 1.5, 4.4); }
  return lerp(.54, .8, range(t, 21, 25.8));
};
const diaN = t => Math.min(10, 1 + Math.floor(Math.max(0, t - 12.8) / .5));
const glint = (x, y, q, sz) => q <= 0 || q >= 1 ? '' : `<g transform="translate(${f1(x)},${f1(y)}) rotate(45) scale(${f1(Math.sin(q * Math.PI) * sz)})"><circle r=".55" fill="#FFF3B0" opacity=".5"/><path d="M0 -1 Q0 0 1 0 Q0 0 0 1 Q0 0 -1 0 Q0 0 0 -1Z" fill="#FFFBE0"/></g>`;
const lente = (R, inn, ext0) => {
  const id = nid('ln'); def(`<clipPath id="${id}"><circle cx="540" cy="960" r="${f1(R)}"/></clipPath>`);
  let s = ext0 + `<g clip-path="url(#${id})">${inn}</g>`;
  if (R > 20 && R < 1400) s += `<circle cx="540" cy="960" r="${f1(R)}" fill="none" stroke="#E8FFD8" stroke-width="12" opacity=".85"/><circle cx="540" cy="960" r="${f1(R - 10)}" fill="none" stroke="#000" stroke-width="10" opacity=".25"/><path d="M${f1(540 - R * .8)} 960 A${f1(R * .8)} ${f1(R * .8)} 0 0 1 540 ${f1(960 - R * .8)}" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" opacity=".6"/>`;
  return s;
};
const tagDia = t => etiquetaDia(diaN(t), t, range(t, 12.7, 12.95) * (1 - range(t, 20.3, 20.6)), t < 12.8 || t > 17.5 ? 1 : range((t - 12.8) % .5, 0, .14));

/* ===================== 1. pendura ===================== */
function sPendura(t) {
  const { L, d, k } = loc(t, 'pendura'), [jx, jy] = hand2(t);
  setCam(lerp(705, 690, easeInOut(k)) + jx, lerp(705, 725, easeInOut(k)) + jy, lerp(1.3, 1.48, easeInOut(k)), lerp(-1.4, .8, k), BASE);
  const curv = lerp(1, .22, easeInOut(range(L, .5, d))), blink = pulse(L, 1.05, 1.25, .06);
  return ext(t, kSky(t), rimGroup(lagarta(t, { curv, blink }))) + VIG(.55) + GRAINV(t);
}
/* ===================== 2. troca de pele ===================== */
function sTroca(t) {
  const { L, d, k } = loc(t, 'troca'), [jx, jy] = hand2(t);
  setCam(PAD.x + 8 + jx * (1 - k * .7), lerp(PAD.y + 430, PC, easeInOut(range(L, .5, 2.0))) + jy * (1 - k * .5), lerp(1.5, 2.35, easeInOut(range(L, .3, 2.2))), lerp(1.4, 0, easeOut(k)), BASE);
  const s = easeInOut(range(L, .1, 1.5)), curv = .22 * (1 - easeOut(range(L, 0, .5))), q = range(L, 1.5, d);
  const comp = 1 - s * .82, hp = emU(espinha(curv), comp), rh = 64 * (1 + .12 * s), yEdge = hp.y + rh * .7;
  const qs = Math.max(0, L - 1.45), sw = 7 * Math.exp(-2.2 * qs) * Math.sin(9 * qs);
  let clip = '';
  if (q <= 0) { const id = nid('rv'); def(`<clipPath id="${id}"><rect x="-400" y="${f1(yEdge)}" width="2000" height="2400"/></clipPath>`); clip = ` clip-path="url(#${id})"`; }
  let sub = `<g${clip}><g transform="translate(${PAD.x},${PAD.y}) rotate(${f1(sw)}) scale(${PS})">${crisalida(t, { a: 1 })}</g></g>`;
  const fall = q > 0 ? `translate(${f1(90 * q)},${f1(1300 * q * q)}) rotate(${f1(110 * q)} ${PAD.x} ${f1(PAD.y + 60)})` : '';
  sub += `<g transform="${fall}" opacity="${op(1 - range(q, .7, 1))}">${rimGroup(lagarta(t, { curv, s }))}</g>`;
  [[-56, 0], [20, .25], [62, .5]].forEach(([lx, dl]) => { const w = loc2w(lx, 98 + 38 * (1 - (lx / 96) ** 2)); sub += glint(w[0], w[1], range(L, 1.75 + dl, 2.2 + dl), 46); });
  return ext(t, kSky(t), sub) + VIG(.55) + GRAINV(t);
}
/* ===================== 3. a sopa ===================== */
function sSopa(t) {
  const { L, d, k } = loc(t, 'sopa'), [jx, jy] = hand2(t);
  setCam(PAD.x + jx * .6 + Math.sin(L * .6) * 8, PC + lerp(0, 40, easeInOut(k)) + jy * .6, lerp(2.35, 2.62, easeInOut(k)), 0, BASE);
  const R = easeInOut(range(L, 0, .6)) * 1500, m = easeInOut(range(L, .9, 3.9)), pool = easeInOut(range(L, 1.2, 4.1)), enz = range(L, .35, .9) * (1 - range(L, 3.3, 4.1));
  const ex = ext(t, kSky(t), `<g transform="translate(${PAD.x},${PAD.y}) scale(${PS})">${crisalida(t, { a: 1 })}</g>`);
  return lente(R, interior(t, { m, pool, enz, L, dark: 0 }), ex) + VIG(.7) + GRAINV(t);
}
/* ===================== 4. os discos imaginais ===================== */
function sDiscos(t) {
  const { L, d, k } = loc(t, 'discos'), [jx, jy] = hand2(t), e = easeInOut(k), [cx, cy] = loc2w(lerp(-8, 10, e), lerp(130, 300, e));
  setCam(cx + jx * .5, cy + jy * .5, lerp(2.62, 4.2, easeInOut(range(L, 0, 2.6))), 0, BASE);
  const dark = .72 * easeOut(range(L, 0, .5));
  let s = interior(t, { m: 1, pool: 1, dark, L, disc: 1, semLagarta: true });
  const w = loc2w(-52, 205), [dx, dy] = proj(w[0], w[1]), lk = pulse(L, 1.65, 3.2, .3), lx = clamp(dx + 40, 330, 650), ly = Math.max(330, dy - 170);
  if (lk > 0) s += `<g opacity="${op(lk)}"><path d="M${f1(lx)} ${f1(ly + 38)} L${f1(dx)} ${f1(dy)}" stroke="#E8FFD0" stroke-width="3" stroke-dasharray="8 7"/><circle cx="${f1(dx)}" cy="${f1(dy)}" r="9" fill="none" stroke="#E8FFD0" stroke-width="3"/></g>` + etiquetaTexto('DISCOS IMAGINAIS', lx, ly, lk, 470);
  return s + VIG(.75) + GRAINV(t);
}
/* ===================== 5. as partes crescem ===================== */
function sCresce(t) {
  const { L, d, k } = loc(t, 'cresce'), [jx, jy] = hand2(t), e = easeInOut(range(L, .2, 3.4)), [cx, cy] = loc2w(lerp(8, 0, e), lerp(300, 208, e));
  setCam(cx + jx * .4, cy + jy * .4, lerp(4.0, 2.35, e), lerp(-1.5, 0, e), BASE);
  const P = { wing: range(L, .8, 2.9), body: range(L, 1.2, 2.6), leg: range(L, 2.0, 3.0), eye: range(L, 2.5, 3.3), ant: range(L, 2.9, 3.6) };
  const dark = lerp(.72, .12, easeInOut(range(L, 0, 3))), pool = lerp(1, .04, easeInOut(range(L, .2, 3.4)));
  const inn = interior(t, { m: 1, pool, dark, L, discL: 99, disc: 1 - range(L, .4, 2.4), P, Pa: 1, semLagarta: true });
  const R = 1500 * (1 - easeInOut(range(L, 3.4, 3.9)));
  let s;
  if (R < 1490) s = lente(R, inn, ext(t, kSky(t), `<g transform="translate(${PAD.x},${PAD.y}) scale(${PS})">${crisalida(t, { a: 1 })}</g>`)); else s = inn;
  return s + tagDia(t) + VIG(.7) + GRAINV(t);
}
/* ===================== 6. a crisálida fica transparente ===================== */
function sTransp(t) {
  const { L, d, k } = loc(t, 'transparente'), [jx, jy] = hand2(t), e = easeInOut(range(L, .2, 4.2));
  setCam(PAD.x + jx * .6, lerp(PC + 30, PC - 70, e) + jy * .6, lerp(2.35, 1.8, e), lerp(-2.2, 1.0, e), BASE);
  const a = lerp(1, .16, easeInOut(range(L, 1.5, 3.5))), pat = easeInOut(range(L, 1.2, 3.3)), tr = range(L, 3.2, 4.4), sw = Math.sin(t * 37) * 1.1 * tr + Math.sin(t * 1.3) * .6, rach = .3 * easeOut(range(L, 3.95, 4.4));
  const sub = `<g transform="translate(${PAD.x},${PAD.y}) rotate(${f1(sw)}) scale(${PS})">${crisalida(t, { a, pat, rach })}</g>`;
  return ext(t, kSky(t), sub) + tagDia(t) + VIG(.5) + GRAINV(t);
}
/* ===================== 7. racha e a cabeça sai ===================== */
function sSai(t) {
  const { L, d, k } = loc(t, 'sai'), [jx, jy] = hand2(t), [cx, cy] = loc2w(0, 330);
  setCam(cx + jx, cy + jy, lerp(2.7, 2.5, k), lerp(1.2, -1, k), BASE);
  const rach = lerp(.3, 1, easeOut(range(L, .05, .9))), em = easeInOut(range(L, .55, 1.95));
  const sub = `<g transform="translate(${PAD.x},${PAD.y}) rotate(${f1(Math.sin(t * 33) * .8 * (1 - k * .3))}) scale(${PS})">${crisalida(t, { a: .16, pat: 1 - range(L, 1.2, 2.0) * .85, rach, emerge: em })}</g>`;
  return ext(t, kSky(t), sub) + VIG(.5) + GRAINV(t);
}
/* ===================== 8. a borboleta abre as asas e voa ===================== */
function sVoa(t) {
  const { L, d, k } = loc(t, 'voa'), [jx, jy] = hand2(t), e = easeInOut(range(L, .35, 2.6)), [cx0, cy0] = loc2w(0, 440);
  setCam(lerp(cx0, 690, e) + jx * .6, lerp(cy0, 725, e) + jy * .6, lerp(1.7, 1.48, e), lerp(-1, .8, e), BASE);
  const hang = loc2w(0, 420), q = range(L, 1.55, 2.7), lg = 1 - range(L, 1.2, 1.6), qs = Math.max(0, L - 1.6), sw = 5 * Math.exp(-1.3 * qs) * Math.sin(6 * qs);
  const size = lerp(.25, 1, smooth(range(L, 0, 1.15))), swell = 1.6 - .6 * smooth(range(L, 0, 1.15)), wet = 1 - range(L, .5, 1.5);
  const ph = L < 1.5 ? 0 : 2 * Math.PI * (L - 1.5) * (2 + 3.5 * range(L, 1.5, 2.4));
  const psi = lerp(84, 6, easeInOut(range(L, .95, 1.5))), open = L < 1.5 ? 1 : .22 + .78 * Math.abs(Math.cos(ph));
  const bx = lerp(hang[0], 1180, easeIn(q)) + Math.sin(L * 7) * 6 * q, by = lerp(hang[1], -150, easeInOut(q)) + Math.sin(L * 9) * 8 * q;
  let sub = `<g transform="translate(${PAD.x},${PAD.y}) rotate(${f1(sw)}) scale(${PS})">${crisalida(t, { a: .16, pat: 0, rach: 1 })}</g>`;
  if (q < 1) sub += borboleta(t, { x: bx, y: by, sc: lerp(.62, .34, q), rot: lerp(0, 32, easeOut(q)), open, psi, size, wet, swell, legs: lg });
  let s = ext(t, kSky(t), sub);
  s += `<circle cx="1020" cy="170" r="760" fill="url(#gSun)" opacity="${op(.7 * pulse(L, 1.7, 2.8, .5))}"/>`;
  return s + VIG(.45) + GRAINV(t);
}
const FN = { pendura: sPendura, troca: sTroca, sopa: sSopa, discos: sDiscos, cresce: sCresce, transparente: sTransp, sai: sSai, voa: sVoa };
