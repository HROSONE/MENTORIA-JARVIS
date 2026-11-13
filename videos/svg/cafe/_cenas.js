/* =====================================================================================
   POR QUE O CAFÉ TE ACORDA? ☕  (Short de 26 s, 70 palavras, 8 planos; primeiro corte aos 2,4 s)
   Formato dos virais: a 1ª frase descreve o quadro 0 (a adenosina encaixando nos receptores); cada frase muda a tela;
   a virada é "o café não cria energia, só bloqueia o aviso"; termina no bocejo. A marca HRYZ Animation está no relógio
   digital (contador diegético) e impressa na caneca.

   DECUPAGEM (diretor)
    1 sono     0 – 2,4    MACRO (quadro 0). Membrana do neurônio, receptores-fechadura; a adenosina (chave laranja com haste)
                          desce e encaixa. Push-in lento; neurônio aceso. Relógio 07:00 correndo.
    2 acumula 2,4 – 4,8   PULL-OUT: dezenas de peças se acumulam, todas as fechaduras ocupadas; o neurônio escurece; relógio 15:00.
    3 encaixe 4,8 – 9,1   EXTREMO CLOSE em câmera lenta: a chave entra, a alavanca gira, a luz fica rosa e o aviso "Z" entra na célula.
    4 cafe    9,1 – 12,4  CLOSE na caneca (marca HRYZ Animation), push-in no café; a cafeína sobe do líquido; diagrama com as duas
                          peças lado a lado: o encaixe é igual, mas a adenosina tem haste e a cafeína não.
    5 bloqueio 12,4 – 16,3 MACRO: a cafeína ocupa as fechaduras primeiro; a adenosina bate e volta. O neurônio se acende.
    6 tapa    16,3 – 20,4 PLANO GERAL: a adenosina se acumula do lado de fora; barras "sono real" (sobe) e "sono sentido" (baixo).
    7 baque   20,4 – 24,0 MACRO: a cafeína sai, a adenosina encaixa em onda; o neurônio apaga e o sono sentido pula.
    8 bocejo  24,0 – 26,0 ZOOM-OUT: do cérebro à silhueta da cabeça, que boceja; a caneca vazia ao lado.
   ===================================================================================== */
const SH = [['sono', 0, 2.4], ['acumula', 2.4, T('b2') - .1], ['encaixe', T('b2') - .1, T('b3') - .1], ['cafe', T('b3') - .1, T('b4') - .1], ['bloqueio', T('b4') - .1, T('b5') - .1],
  ['tapa', T('b5') - .1, T('b6') - .1], ['baque', T('b6') - .1, 24.0], ['bocejo', 24.0, TOTAL]];
const FLASH = [];
const hand2 = t => [Math.sin(t * 1.3) * 3 + Math.sin(t * 3.1) * 1.5, Math.cos(t * 1.1) * 3];
const shotAt = t => SH.find(s => t >= s[1] && t < s[2]) || SH[SH.length - 1];
const loc = (t, id) => { const s = SH.find(x => x[0] === id); return { L: t - s[1], d: s[2] - s[1], k: (t - s[1]) / (s[2] - s[1]) }; };
const BASE = [540, 960, 1];
const T_BAQUE = 22.0;                                    // a adenosina volta a encaixar
const horaAt = t => t < 4.8 ? lerp(420, 900, easeOut(range(t, 0, 4.8))) : t < 12.4 ? lerp(900, 920, range(t, 4.8, 12.4)) : t < 16.3 ? lerp(920, 960, range(t, 12.4, 16.3)) : t < 20.4 ? lerp(960, 1230, easeInOut(range(t, 16.3, 20.4))) : lerp(1230, 1270, range(t, 20.4, 26));
const realAt = t => t < 4.8 ? lerp(.05, .72, easeOut(range(t, 0, 4.8))) : t < 16.3 ? lerp(.72, .84, range(t, 4.8, 16.3)) : t < 20.4 ? lerp(.84, .95, range(t, 16.3, 20.4)) : .95;
const sentidoAt = t => { const r = realAt(t); if (t < 13.0) return r; if (t < T_BAQUE) return r * (1 - .82 * easeInOut(range(t, 13.0, 14.3))); return lerp(r * .18, r, easeOut(range(t, T_BAQUE, T_BAQUE + 1.1))); };
const actAt = t => clamp(1 - sentidoAt(t) * 1.05, .06, 1);
const ovl = (t, k = 1) => painelHora(horaAt(t), k) + barrasSono(realAt(t), sentidoAt(t), k);
const recXs = [240, 540, 840], recXw = [-60, 140, 340, 540, 740, 940, 1140];
const keyDesc = (x, kk, i, tipo = 'ad', alt = 520, glow = .9) => chave(tipo, x + (1 - kk) * 90 * Math.sin(i * 2 + 1), mYat(x) + POCKET_Y - (1 - kk) * alt, (1 - kk) * 40 * Math.sin(i + 2), 1, glow);

/* ===================== 1. as peças laranja encaixam ===================== */
function sSono(t) {
  const { L, d, k } = loc(t, 'sono'), [jx, jy] = hand2(t), act = actAt(t);
  setCam(540 + jx, 1010 + jy, lerp(1.15, 1.32, easeInOut(k)), lerp(-1.5, 1, k), BASE);
  const tD = [.95, 2.4, 1.7], tS = tD.map(v => v - .8 - .1);
  let s = lay(.2, fundoMicro(t)) + lay(.5, blur(6, enxame(t, 10, 'ad', -100, 1200, 100, 700, 9, .3, .5))) + lay(1, citoplasma(act) + membrana(t));
  let g = '';
  recXs.forEach((x, i) => { const r = range(L, tD[i], tD[i] + .35); g += receptor(x, { luz: r, lever: r, ring: range(L, tD[i], tD[i] + 1.0) }); });
  recXs.forEach((x, i) => { g += keyDesc(x, easeInOut(range(L, tS[i], tD[i])), i); });
  g += enxame(t, 14, 'ad', -100, 1200, 420, 900, 7, .36, .9);
  return s + lay(1, g) + ovl(t, range(L, 0, .3)) + VIG(.45) + GRAINV(t);
}
/* ===================== 2. a adenosina se acumula ===================== */
function sAcumula(t) {
  const { L, d, k } = loc(t, 'acumula'), [jx, jy] = hand2(t), act = actAt(t), e = easeInOut(range(L, 0, 2.4));
  setCam(540 + jx, lerp(1000, 900, e) + jy, lerp(1.0, .5, e), lerp(1, -1, k), BASE);
  let s = lay(.2, fundoMicro(t)) + lay(1, citoplasma(act) + membrana(t));
  let g = '';
  recXw.forEach((x, i) => { const tD = .3 + i * .3, r = range(L, tD, tD + .35); g += receptor(x, { luz: r, lever: r, ring: range(L, tD, tD + 1.0) }); });
  recXw.forEach((x, i) => { const tD = .3 + i * .3; g += keyDesc(x, easeInOut(range(L, tD - .8, tD)), i); });
  g += enxame(t, Math.floor(24 + 56 * range(L, 0, 2.2)), 'ad', -300, 1400, 120, 900, 7, .4, .9);
  return s + lay(1, g) + ovl(t) + VIG(.45) + GRAINV(t);
}
/* ===================== 3. o encaixe em câmera lenta ===================== */
function sEncaixe(t) {
  const { L, d, k } = loc(t, 'encaixe'), [jx, jy] = hand2(t), kk = easeInOut(range(L, .3, 2.7)), r = range(L, 2.7, 3.3);
  setCam(540 + jx, mYat(540) + 10 + jy, lerp(2.0, 2.35, easeInOut(k)), lerp(-1, 1, k), BASE);
  const act = clamp(actAt(t) - .1 * range(L, 2.8, 3.8), .05, 1);
  let s = lay(.2, fundoMicro(t)) + lay(1, citoplasma(act) + membrana(t));
  let g = receptor(240, { luz: 1, lever: 1 }) + chave('ad', 240, mYat(240) + POCKET_Y, 0, 1, .6) + receptor(840, { luz: 1, lever: 1 }) + chave('ad', 840, mYat(840) + POCKET_Y, 0, 1, .6);
  g += receptor(540, { luz: r, lever: r, ring: range(L, 2.8, 4.3) });
  g += chave('ad', 540 + (1 - kk) * 70 * Math.sin(L * 1.3), mYat(540) + POCKET_Y - (1 - kk) * 560, (1 - kk) * 22 * Math.sin(L * 1.1 + 1), 1, .9);
  for (let i = 0; i < 3; i++) { const q = range(L, 3.0 + i * .3, 4.4 + i * .3); g += zeta(540 + (i - 1) * 90 + 20 * Math.sin(q * 6), mYat(540) + MH + 150 + 300 * q, .9 + .5 * q, Math.sin(q * Math.PI) * .95); }
  return s + lay(1, g) + ovl(t) + VIG(.5) + GRAINV(t);
}
/* ===================== 4. o café e as duas peças ===================== */
function sCafe(t) {
  const { L, d, k } = loc(t, 'cafe'), [jx, jy] = hand2(t), A = 1 - range(L, 1.5, 1.8);
  let s = '';
  if (A > 0) {
    setCam(540 + jx, lerp(1000, 820, easeInOut(range(L, 0, 1.7))) + jy, lerp(1.0, 1.5, easeInOut(range(L, 0, 1.7))), lerp(1, -1, k), BASE);
    const id = nid('kz'); def(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="-200" x2="0" y2="1500"><stop offset="0" stop-color="#2A1408"/><stop offset=".6" stop-color="#6A3818"/><stop offset="1" stop-color="#A8602A"/></linearGradient>`);
    let g = '';
    for (let i = 0; i < 6; i++) { const q = range(L, .5 + i * .2, 1.8 + i * .2); if (q > 0 && q < 1) g += chave('ca', 470 + i * 28 + 40 * Math.sin(q * 5 + i), 790 - q * 760, 30 * Math.sin(q * 4 + i), .3 + .35 * q, 1, Math.sin(q * Math.PI)); }
    s += `<g opacity="${f1(A)}">${lay(.2, `<rect x="-900" y="-1400" width="2900" height="4600" fill="url(#${id})"/>` + blur(10, bokeh(22, -300, -300, 1700, 1500, ['#FFD27A', '#FF9A3A', '#FFE9B0'], 14, 60, t, 3, .35)))}${lay(1, caneca(t) + g)}</g>`;
  }
  if (A < 1) {
    setCam(540, 960, 1, 0, BASE);
    const e = easeOut(range(L, 1.5, 2.1)), hl = range(L, 2.0, 2.4);
    let g = chave('ad', 340 - 300 * (1 - e), 1120, 0, 1.9, 1) + chave('ca', 740 + 300 * (1 - e), 1120, 0, 1.9, 1);
    if (hl > 0) for (const x of [340, 740]) g += `<rect x="${x - 58}" y="940" width="116" height="215" rx="26" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="14 10" stroke-dashoffset="${f1(-t * 30)}" opacity="${f1(hl * (.7 + .3 * Math.sin(t * 6)))}"/>`;
    g += `<text x="540" y="1070" font-size="130" fill="#fff" text-anchor="middle" opacity="${f1(hl)}">≈</text>` + etiquetaTexto('ADENOSINA', 340, 1290, e, 330, '#FFB347') + etiquetaTexto('CAFEÍNA', 740, 1290, e, 330, '#D9B084');
    s += `<g opacity="${f1(1 - A)}">${lay(.2, fundoMicro(t))}${lay(1, g)}</g>`;
  }
  return s + painelHora(horaAt(t), 1) + VIG(.5) + GRAINV(t);
}
/* ===================== 5. a cafeína ocupa primeiro; a adenosina bate e volta ===================== */
function sBloqueio(t) {
  const { L, d, k } = loc(t, 'bloqueio'), [jx, jy] = hand2(t), act = actAt(t);
  setCam(lerp(500, 580, k) + jx, 1010 + jy, lerp(1.2, 1.28, k), lerp(-1, 1, k), BASE);
  const tD = [.8, 1.3, 1.8];
  let s = lay(.2, fundoMicro(t)) + lay(.5, blur(6, enxame(t, 10, 'ad', -100, 1200, 100, 700, 9, .3, .5))) + lay(1, citoplasma(act) + membrana(t));
  let g = '';
  recXs.forEach(x => { g += receptor(x, { luz: 0 }); });
  recXs.forEach((x, i) => { g += keyDesc(x, easeInOut(range(L, tD[i] - .7, tD[i])), i + 3, 'ca', 520, .8); });
  // a adenosina chega, bate na cafeína e volta
  [[1, 2.2], [0, 2.6], [2, 3.0], [1, 3.3]].forEach(([ri, tA], j) => {
    const u = range(L, tA, tA + 1.1), x = recXs[ri], ry = mYat(x), hit = .42;
    if (u <= 0 || u >= 1) return;
    const down = u < hit ? easeIn(u / hit) : 1, up = u < hit ? 0 : easeOut((u - hit) / (1 - hit)), y = ry - 520 + 330 * down - 400 * up - 60 * (u > hit ? 0 : 0), side = (j % 2 ? 1 : -1) * 170 * up;
    g += chave('ad', x + side, y - 8 + 0, (j % 2 ? 1 : -1) * 60 * up + 30 * Math.sin(u * 9) * (u > hit ? 1 : 0), 1, .9, 1 - range(u, .75, 1));
    if (u > hit && u < hit + .35) { const q = (u - hit) / .35; g += `<ellipse cx="${f1(x)}" cy="${f1(ry - 190)}" rx="${f1(40 + 110 * q)}" ry="${f1(14 + 40 * q)}" fill="none" stroke="#fff" stroke-width="${f1(8 * (1 - q) + 1)}" opacity="${f1((1 - q) * .9)}"/>`; }
  });
  g += enxame(t, 12, 'ad', -100, 1200, 300, 720, 13, .34, .85);
  return s + lay(1, g) + ovl(t) + VIG(.45) + GRAINV(t);
}
/* ===================== 6. a adenosina se acumula e o sono real sobe ===================== */
function sTapa(t) {
  const { L, d, k } = loc(t, 'tapa'), [jx, jy] = hand2(t), act = actAt(t), e = easeInOut(k);
  setCam(540 + jx, lerp(960, 900, e) + jy, lerp(.62, .56, e), lerp(.8, -.8, e), BASE);
  let s = lay(.2, fundoMicro(t)) + lay(1, citoplasma(act) + membrana(t));
  let g = '';
  recXw.forEach((x, i) => { g += receptor(x, { luz: 0 }) + chave('ca', x, mYat(x) + POCKET_Y, 0, 1, .7); });
  g += enxame(t, Math.floor(30 + 150 * range(L, 0, 3.6)), 'ad', -300, 1400, 80, 980, 21, .42, .92);
  const bk = range(L, .2, .6);
  return s + lay(1, g) + `<rect width="1080" height="1920" fill="#08152A" opacity="${f1(.35 * bk)}"/>` + painelHora(horaAt(t), 1) + barrasSono(realAt(t), sentidoAt(t), bk, 540, 1100, 1.45) + VIG(.45) + GRAINV(t);
}
/* ===================== 7. a cafeína sai e tudo encaixa de uma vez ===================== */
function sBaque(t) {
  const { L, d, k } = loc(t, 'baque'), [jx, jy] = hand2(t), act = actAt(t), sh = 7 * Math.exp(-Math.abs(L - 1.9) * 3) * (L > 1.5 ? 1 : 0);
  setCam(540 + jx + Math.sin(t * 47) * sh, 1010 + jy + Math.cos(t * 41) * sh, lerp(1.1, 1.2, k), lerp(-1, 1, k), BASE);
  const tD = [1.7, 1.85, 2.0];
  let s = lay(.2, fundoMicro(t)) + lay(.5, blur(6, enxame(t, 12, 'ad', -100, 1200, 100, 700, 9, .3, .5))) + lay(1, citoplasma(act) + membrana(t));
  let g = '';
  recXs.forEach((x, i) => { const r = range(L, tD[i], tD[i] + .35); g += receptor(x, { luz: r, lever: r, ring: range(L, tD[i], tD[i] + 1.0) }); });
  recXs.forEach((x, i) => {
    const out = easeInOut(range(L, .25 + i * .12, 1.3 + i * .12)), ry = mYat(x);
    if (out < 1) g += chave('ca', x + 60 * out * (i - 1), ry + POCKET_Y - 460 * out, 50 * out * (i - 1), 1, .8, 1 - out);
    const kk = easeIn(range(L, tD[i] - .55, tD[i]));
    if (kk > 0) g += keyDesc(x, kk, i + 6);
  });
  for (let j = 0; j < 14; j++) { const q = easeIn(range(L, 1.3 + .04 * j, 2.1 + .04 * j)); if (q > 0 && q < 1) g += chave('ad', lerp(-100 + 1200 * hh(j, 31), recXs[j % 3], q), lerp(300, mYat(recXs[j % 3]) - 100, q), 60 * (1 - q) * (hh(j, 32) - .5), .5, .6, 1 - range(q, .8, 1)); }
  return s + lay(1, g) + ovl(t) + VIG(.5) + GRAINV(t);
}
/* ===================== 8. o bocejo ===================== */
function sBocejo(t) {
  const { L, d, k } = loc(t, 'bocejo'), [jx, jy] = hand2(t), e = easeInOut(range(L, 0, 1.3)), z = lerp(7.5, 1.0, e);
  setCam(lerp(510, 540, e) + jx * e, lerp(830, 980, e) + jy * e, z, lerp(-3, 0, e), BASE);
  const id = nid('nt'); def(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="-300" x2="0" y2="1900"><stop offset="0" stop-color="#0A1030"/><stop offset=".7" stop-color="#16204A"/><stop offset="1" stop-color="#241E40"/></linearGradient>`);
  let s = lay(.2, `<rect x="-900" y="-1800" width="2900" height="4600" fill="url(#${id})"/><circle cx="880" cy="260" r="60" fill="#DDE6FF" opacity=".5"/>` + blur(20, `<circle cx="880" cy="260" r="220" fill="#8AA0E8" opacity=".25"/>`));
  const yawn = easeInOut(range(L, 1.2, 1.7)), zk = range(L, 1.5, 2.0);
  s += lay(1, `<rect x="-300" y="1430" width="1700" height="800" fill="#1B1830"/><rect x="-300" y="1430" width="1700" height="8" fill="#4A3F6A"/><g transform="translate(540,1000)">${cabeca(t, .1, yawn, zk)}</g><g transform="translate(760,1425) scale(.3)">${caneca(t * 0).replace(/<rect x="-300" y="1330"[^>]*\/>/, '')}</g>`);
  return s + `<rect width="1080" height="1920" fill="#0A1030" opacity="${f1(.55 * (1 - range(L, 0, .5)))}"/>` + painelHora(horaAt(t), range(L, .6, 1.0)) + VIG(.55) + GRAINV(t);
}
const FN = { sono: sSono, acumula: sAcumula, encaixe: sEncaixe, cafe: sCafe, bloqueio: sBloqueio, tapa: sTapa, baque: sBaque, bocejo: sBocejo };
