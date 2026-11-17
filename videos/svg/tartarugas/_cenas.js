/* =====================================================================================
   CEM FILHOTES, NENHUMA MÃE 🐢  (Short de ~34 s, 112 palavras, 13 planos; ver roteiro_tartarugas.md para a decupagem)
   ===================================================================================== */
const SH = [['ferve', 0, 2.5], ['semMae', 2.5, 4.1]];
const FLASH = ['semMae'];
const shotAt = t => SH.find(s => t >= s[1] && t < s[2]) || SH[SH.length - 1];
const loc = (t, id) => { const s = SH.find(x => x[0] === id); return { L: t - s[1], d: s[2] - s[1], k: (t - s[1]) / (s[2] - s[1]) }; };
const BASE = [540, 960, 1];

/* cenário de frente para a terra: lua sobre a duna, areia na frente */
function cenaMonte(t, sub, o = {}) {
  const { dof = 1 } = o;
  let s = lay(.05, ceuNoite(t));
  s += lay(.1, blur(7 * dof, brilhoCidade(t)));
  s += lay(.12, blur(5 * dof, duna(t, 900)));
  s += lay(.25, `<rect x="-300" y="880" width="1700" height="1700" fill="url(#sandW)"/>` + ondulacoes(930, 2100, 30, 3));
  s += lay(1, sub);
  return s;
}

/* ===================== 1. a areia ferve ===================== */
const heroiNaAreia = (t, extra = {}) => `<g transform="translate(540,1560) scale(1.55)">${rimGroup(filhoteFrente({ mark: 1, ...extra }))}</g>` + crista(1532, 6, .08) + ondulacoes(1570, 2150, 14, 8);
function sFerve(t) {
  const { L, d, k } = loc(t, 'ferve'), [jx, jy] = hand2(t), e = easeInOut(k);
  setCam(540 + jx, lerp(1360, 1200, e) + jy, lerp(1.36, 1.0, e), lerp(-1.6, 0, e), BASE);
  const sub = formigueiro(t, { cx: 540, base: 1540, pt: .5 }) + heroiNaAreia(t, { rise: lerp(.78, 1, easeOut(range(L, 0, .5))), wave: t * .7, turn: Math.sin(t * 2.1) * .5, look: [0, 0], blink: pulse(L, 1.6, 1.74, .05) }) + jatoFundo(t);
  return cenaMonte(t, sub) + VIG(.6) + GRAINV(t);
}
const jatoFundo = t => jato(t, 540, 1280, { n: 46, v: 700, g: 1800, abre: 1.2, seed: 4, rep: 1.6, maxR: 5 }) + blur(4, jato(t, 330, 1500, { n: 18, v: 430, g: 1600, abre: .9, seed: 9, rep: 2.1, maxR: 11 }) + jato(t, 760, 1520, { n: 18, v: 430, g: 1600, abre: .9, seed: 12, rep: 2.3, maxR: 11 }));

/* ===================== 2. nenhum conhece a mãe ===================== */
function sSemMae(t) {
  const { L, d, k } = loc(t, 'semMae'), [jx, jy] = hand2(t), e = easeInOut(k);
  setCam(540 + jx * .6, lerp(1300, 1232, e) + jy * .6, lerp(1.4, 2.0, e), lerp(1.2, 0, e), BASE);
  const bk = pulse(L, .9, 1.05, .06), turn = Math.sin(L * 3.1) * .9 * (1 - range(L, 1.2, 1.5)), lk = [Math.sin(L * 3.1) * 1.8, 0];
  const sub = formigueiro(t, { cx: 540, base: 1540, pt: 3 }) + heroiNaAreia(t, { rise: 1, wave: L * .45, turn, look: lk, blink: bk, worry: easeOut(range(L, .5, 1.2)) }) + jatoFundo(t);
  return cenaMonte(t, sub, { dof: 1.5 }) + VIG(.6) + GRAINV(t);
}
const FN = { ferve: sFerve, semMae: sSemMae };
