/* =====================================================================================
   COMO NASCE UM RAIO ⚡  (Short de 26,3 s, 75 palavras, 9 planos; primeiro corte aos 2,4 s)
   Formato dos virais: a 1ª frase descreve o quadro 0 (a colisão com faísca); cada frase muda a tela; o raio é o
   clímax no meio; termina quando o processo termina (o trovão); o último plano volta para o quadro 0 (loop).
   A marca HRYZ Animation está na caixa do medidor de campo elétrico (contador diegético).

   DECUPAGEM (diretor)
    1 gelo     0 – 2,4    EXTREMO CLOSE (quadro 0). Macro dentro da nuvem: cristal e granizo se chocam com faísca.
                          Push-in lento com leve giro; fundo violeta e neve desfocados; cristais desfocados em 1º plano.
    2 troca  2,4 – 4,9    CLOSE em câmera lenta no ponto de contato: os "−" saltam do cristal para o granizo, arcos de faísca.
    3 separa 4,9 – 7,8    PULL-OUT: os cristais leves (+, laranja) sobem e o granizo pesado (−, azul) desce; a nuvem se divide.
    4 nuvem  7,8 – 11,7   GRANDE PLANO GERAL: a nuvem inteira (topo + / base −) e TILT PARA BAIXO até o chão, que responde com
                          "+" subindo pela árvore e pela casa. Medidor de campo elétrico sobe.
    5 lider 11,7 – 16,3   PLANO MÉDIO: o líder desce em degraus, em zigue-zague e com ramos; a câmera acompanha a ponta.
    6 faisca 16,3 – 19,2  CLOSE (de baixo, na copa): a faísca sobe da árvore e encontra a ponta do líder. Push-in.
    7 raio  19,2 – 23,5   GRANDE PLANO GERAL: o raio de retorno sobe pelo canal (clarão único e suave), tilt para cima
                          seguindo a corrente; "30.000 °C" contra "Sol 5.500 °C".
    8 trovao 23,5 – 25,7  PLANO MÉDIO: o ar explode em anéis de choque em volta do canal; tremor decrescente.
    9 ciclo  25,7 – 26,3  CLOSE: volta ao macro do quadro 0 (rebobinando até o clarão), para o vídeo fazer o loop.
   ===================================================================================== */
const SH = [['gelo', 0, 2.4], ['troca', 2.4, T('b2') - .1], ['separa', T('b2') - .1, T('b3') - .1], ['nuvem', T('b3') - .1, T('b4') - .1], ['lider', T('b4') - .1, T('b5') - .1],
  ['faisca', T('b5') - .1, T('b6') - .1], ['raio', T('b6') - .1, T('b7') - .1], ['trovao', T('b7') - .1, 25.7], ['ciclo', 25.7, TOTAL]];
const FLASH = [];
const hand2 = t => [Math.sin(t * 1.3) * 3 + Math.sin(t * 3.1) * 1.5, Math.cos(t * 1.1) * 3];
const shotAt = t => SH.find(s => t >= s[1] && t < s[2]) || SH[SH.length - 1];
const loc = (t, id) => { const s = SH.find(x => x[0] === id); return { L: t - s[1], d: s[2] - s[1], k: (t - s[1]) / (s[2] - s[1]) }; };
const BASE = [540, 960, 1];
const G0 = [600, 1010], GR = 190;                              // granizo-herói no macro
const T_RAIO = T('b6') - .1;                                   // 19,2 s: o raio
const campoAt = t => t < 7.8 ? 0 : t < 11.7 ? lerp(1.2, 6.0, range(t, 7.8, 11.7)) : t < 16.3 ? lerp(6.0, 9.6, easeIn(range(t, 11.7, 16.3))) : lerp(9.6, 10.0, range(t, 16.3, T_RAIO));
const FLC = L => clamp(Math.exp(-L * 4.5) + (L > .55 ? .35 * Math.exp(-(L - .55) * 6) : 0));   // luz do clarão que ilumina o cenário
const macroBase = (t, sw = 1) => lay(.2, fundoMacro(t)) + lay(.4, blur(5, neve(t, 26, 3, 5, 16, .5)));
const macroFg = t => lay(1.5, blur(10, cristal(60, 1500, 150, t * 6, 0) + cristal(1050, 300, 120, -t * 5, 0)));

/* ===================== 1. o choque ===================== */
function sGelo(t) {
  const { L, d, k } = loc(t, 'gelo'), [jx, jy] = hand2(t);
  setCam(580 + jx, 940 + jy, lerp(1.35, 1.58, easeInOut(k)), lerp(-2, 2, k), BASE);
  const G = [G0[0] + 14 * Math.sin(t * .8), G0[1] + 10 * Math.cos(t * .7)];
  const uA = [-.707, -.707], dA = L < .05 ? 260 + 600 * (.05 - L) : 260 + 420 * (1 - Math.exp(-(L - .05) * 1.6)), CA = [G[0] + uA[0] * dA, G[1] + uA[1] * dA];
  const uB = [.8, -.6], dB = L < 1.55 ? 260 + 700 * (1.55 - L) : 260 + 420 * (1 - Math.exp(-(L - 1.55) * 1.6)), CB = [G[0] + uB[0] * dB, G[1] + uB[1] * dB];
  const chG = -(.5 * range(L, .05, .7) + .5 * range(L, 1.55, 2.1));
  let m = graupel(G[0], G[1], GR, chG) + cristal(CA[0], CA[1], 120, -30 + 60 * L, clamp((L - .05) / .5)) + cristal(CB[0], CB[1], 105, 20 - 50 * L, clamp((L - 1.55) / .5));
  m += impacto(G[0] + uA[0] * GR, G[1] + uA[1] * GR, 1 - range(L, 0, .45), 1.1) + impacto(G[0] + uB[0] * GR, G[1] + uB[1] * GR, L < 1.55 ? 0 : 1 - range(L, 1.55, 2.0), 1.0);
  m += glifo(CA[0] + 70, CA[1] - 90, 1, .9, range(L, .3, .7)) + glifo(G[0] - 110, G[1] + 130, -1, 1.1, range(L, .35, .75)) + glifo(CB[0] + 70, CB[1] - 80, 1, .8, range(L, 1.85, 2.2));
  return macroBase(t) + lay(1, m) + macroFg(t) + VIG(.45) + GRAINV(t);
}
/* ===================== 2. a troca de carga ===================== */
function sTroca(t) {
  const { L, d, k } = loc(t, 'troca'), [jx, jy] = hand2(t), u = [-.9, -.43], P = [G0[0] + u[0] * GR, G0[1] + u[1] * GR];
  setCam(P[0] + 40 + jx, P[1] + 20 + jy, lerp(1.9, 2.3, easeInOut(k)), lerp(1.5, -1, k), BASE);
  const G = [G0[0] + 8 * Math.sin(t * .8), G0[1] + 6 * Math.cos(t * .7)], dc = L < .45 ? 300 + 500 * (.45 - L) : L < 1.9 ? 292 : 292 + 380 * easeOut(range(L, 1.9, 2.5)), CC = [G[0] + u[0] * dc, G[1] + u[1] * dc];
  const chC = range(L, 1.2, 2.2), chG = -(.5 + .45 * range(L, .6, 2.0));
  let m = graupel(G[0], G[1], GR, chG) + cristal(CC[0], CC[1], 125, 10 + 12 * L, chC);
  const A = [P[0] + u[0] * 60, P[1] + u[1] * 60], B = [P[0] - u[0] * 40, P[1] - u[1] * 40], pp = [-u[1], u[0]];
  if (L > .45 && L < 1.95) {
    for (let i = 0; i < 10; i++) { const ph = (((L - .45) * 1.1) + i / 10) % 1, off = Math.sin(ph * Math.PI) * (26 + 12 * hh(i, 1)) * (i % 2 ? 1 : -1); m += glifo(lerp(A[0], B[0], ph) + pp[0] * off, lerp(A[1], B[1], ph) + pp[1] * off, -1, .36 + .1 * hh(i, 2), Math.sin(ph * Math.PI)); }
    if (L < 1.4 && Math.floor(t * 9) % 2 === 0) m += arco(A[0], A[1], B[0], B[1], Math.floor(t * 9), 4);
  }
  m += impacto(P[0], P[1], (1 - range(L, .45, .9)) * .9, .9) + glifo(CC[0] - 20, CC[1] - 100, 1, 1.0, range(L, 2.0, 2.5)) + glifo(G[0] - 150, G[1] + 40, -1, 1.2, range(L, 2.0, 2.5));
  return macroBase(t) + lay(1, m) + macroFg(t) + VIG(.45) + GRAINV(t);
}
/* ===================== 3. leves sobem, pesados descem ===================== */
function sSepara(t) {
  const { L, d, k } = loc(t, 'separa'), [jx, jy] = hand2(t), e = easeInOut(range(L, .2, 2.6)), cg = range(L, .1, 1.6);
  setCam(560 + jx, lerp(960, 1000, e) + jy, lerp(1.7, .6, easeInOut(range(L, 0, 2.7))), lerp(-1, 1.5, k), BASE);
  let s = macroBase(t);
  s += lay(.5, blur(40, `<ellipse cx="560" cy="60" rx="900" ry="420" fill="url(#gDo)" opacity="${f1(.9 * e)}"/><ellipse cx="560" cy="1800" rx="900" ry="420" fill="url(#gDc)" opacity="${f1(.9 * e)}"/>`));
  let m = '';
  for (let i = 0; i < 16; i++) m += graupel(80 + 920 * hh(i, 11) + 30 * Math.sin(t * .9 + i), 800 + 440 * hh(i, 12) + (360 + 380 * hh(i, 14)) * e, 38 + 28 * hh(i, 13), -cg);
  m += graupel(G0[0] + 14 * Math.sin(t * .8), G0[1] + 560 * e, GR, -.95);
  for (let i = 0; i < 24; i++) m += cristal(60 + 960 * hh(i, 1) + 30 * Math.sin(t * .9 + i), 760 + 440 * hh(i, 2) - (360 + 420 * hh(i, 4)) * e, 34 + 34 * hh(i, 3), t * 8 * (hh(i, 5) - .5), cg);
  for (let i = 0; i < 5; i++) m += glifo(160 + i * 200, 190 + 40 * Math.sin(i * 2 + t), 1, 1.5, e * .9) + glifo(160 + i * 200, 1700 + 40 * Math.sin(i * 3 + t), -1, 1.5, e * .9);
  return s + lay(1, m) + VIG(.45) + GRAINV(t);
}
/* ===================== cena exterior (nuvem, chuva, paisagem) ===================== */
function exterior(t, fl, carga, cargaChao, ldr = '') {
  return lay(.15, ceuAlto(fl)) + lay(1, nuvem(t, carga, fl)) + lay(.9, chuva(t, fl)) + lay(1, paisagem(t, fl) + (cargaChao > 0 ? cargasChao(t, cargaChao) : '') + ldr);
}
/* ===================== 4. a nuvem inteira e o chão responde ===================== */
function sNuvem(t) {
  const { L, d, k } = loc(t, 'nuvem'), [jx, jy] = hand2(t), e = easeInOut(range(L, 1.0, 3.4));
  setCam(560 + jx, lerp(80, 1220, e) + jy, lerp(.75, 1.0, e), lerp(1, -.5, e), BASE);
  return exterior(t, 0, 1, range(L, 1.6, 3.4)) + medidorCampo(campoAt(t), range(L, .3, .7)) + VIG(.6) + GRAINV(t);
}
/* ===================== 5. o líder desce aos pulinhos ===================== */
function sLider(t) {
  const { L, d, k } = loc(t, 'lider'), [jx, jy] = hand2(t);
  setCam(620 + jx, lerp(480, 1150, easeInOut(range(L, .2, 4.2))) + jy, lerp(1.0, 1.1, k), lerp(-.8, .5, k), BASE);
  return exterior(t, 0, 1, 1, liderSVG({ tip: Math.min(24, Math.max(0, L - .5) / .155) })) + medidorCampo(campoAt(t), 1) + VIG(.6) + GRAINV(t);
}
/* ===================== 6. a faísca sobe ===================== */
function sFaisca(t) {
  const { L, d, k } = loc(t, 'faisca'), [jx, jy] = hand2(t), g = easeIn(range(L, .5, 2.4)), conn = range(L, 2.45, 2.55);
  setCam(700 + jx, 1290 + jy, lerp(1.7, 2.0, easeIn(k)), lerp(1, -1, k), BASE);
  const tip = L < 1.2 ? 24 : 25, ldr = liderSVG({ tip, conn }) + streamers(t, g) + (conn > 0 ? impacto(700, 1245, 1 - range(L, 2.5, 2.9), 1.2) : '');
  return exterior(t, 0, 1, 1, ldr) + medidorCampo(campoAt(t), 1) + VIG(.55) + GRAINV(t);
}
/* ===================== 7. o raio ===================== */
function sRaio(t) {
  const { L, d, k } = loc(t, 'raio'), [jx, jy] = hand2(t), sh = 8 * Math.exp(-L * 3);
  setCam(620 + jx + Math.sin(t * 53) * sh, lerp(1150, 150, easeInOut(range(L, .15, 3.4))) + jy + Math.cos(t * 47) * sh, lerp(.82, .72, k), lerp(-.5, .5, k), BASE);
  const front = TREE.top - (TREE.top - 335) * easeOut(range(L, 0, .55)), hot = .12 + .88 * Math.exp(-Math.max(0, L - .55) * 1.3), fl = FLC(L);
  const ldr = liderSVG({ tip: LID.N, conn: 1, front, hot }) + streamers(t, 1);
  let s = exterior(t, fl, 1, 1, ldr);
  s += `<rect width="1080" height="1920" fill="#DCE6FF" opacity="${f1(.42 * Math.exp(-L * 6) + (L > .55 ? .18 * Math.exp(-(L - .55) * 9) : 0))}"/>`;
  s += medidorCampo(10.0, 1 - range(L, 1.2, 1.6)) + painelTemp(range(L, 1.6, 1.9)) + painelSol(range(L, 2.8, 3.1));
  return s + VIG(.5) + GRAINV(t);
}
/* ===================== 8. o trovão ===================== */
function sTrovao(t) {
  const { L, d, k } = loc(t, 'trovao'), [jx, jy] = hand2(t), sh = 10 * Math.exp(-L * 1.4);
  setCam(700 + jx + Math.sin(t * 31) * sh, 1400 + jy + Math.cos(t * 27) * sh * .8, lerp(1.1, 1.2, k), lerp(.5, 0, k), BASE);
  const hot = .1 * Math.exp(-L * 1.2), ldr = liderSVG({ tip: LID.N, conn: 1, front: 335, hot }) + aneis(L);
  return exterior(t, .08 * Math.exp(-L * 2), 1, 1, ldr) + painelTemp(1 - range(L, 0, .4)) + painelSol(1 - range(L, 0, .4)) + VIG(.55) + GRAINV(t);
}
const FN = { gelo: sGelo, troca: sTroca, separa: sSepara, nuvem: sNuvem, lider: sLider, faisca: sFaisca, raio: sRaio, trovao: sTrovao, ciclo: t => sGelo(.6 * (1 - range(t, 25.7, TOTAL))) };
