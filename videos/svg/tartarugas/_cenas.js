/* =====================================================================================
   CEM FILHOTES, NENHUMA MÃE 🐢  (Short de ~34 s, 112 palavras, 13 planos; ver roteiro_tartarugas.md para a decupagem)
   ===================================================================================== */
const SH = [['ferve', 0, 2.5], ['semMae', 2.5, 4.1], ['cava', 4.1, 5.5], ['ovos', 5.5, 6.6], ['cobre', 6.6, 8.3], ['tempo', 8.3, 9.9], ['juntos', 9.9, 11.9], ['bussola', 11.9, 16.1], ['luz', 16.1, 19.9], ['agua', 19.9, 23.3], ['milPontos', 23.3, 26.4], ['anos', 26.4, 30.3], ['igual', 30.3, 34.4]];
const FLASH = ['cava', 'tempo', 'bussola', 'agua', 'anos'];
const shotAt = t => SH.find(s => t >= s[1] && t < s[2]) || SH[SH.length - 1];
const loc = (t, id) => { const s = SH.find(x => x[0] === id); return { L: t - s[1], d: s[2] - s[1], k: (t - s[1]) / (s[2] - s[1]) }; };
const BASE = [540, 960, 1];
const RUN_T = (t, a, b) => range(t, a, b);
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

/* ===================== o corte do chão (mãe, ovos, ninho) ===================== */
const GY = 1030, POCO = { x: 345, w: 112, fundo: 1250 }, CAMARA = { x: 330, y: 1400, rx: 178, ry: 122 };
function solo(t, o = {}) {
  const { brilho = 0 } = o;
  let s = `<rect x="-400" y="${GY}" width="2000" height="1700" fill="url(#gSoil)"/>`;
  for (let i = 0; i < 14; i++) { const y = GY + 60 + i * 74, ph = hh(i, 61) * 6; let d = `M-400 ${f1(y)}`; for (let x = -400; x <= 1600; x += 100) d += ` L${x} ${f1(y + Math.sin(x * .008 + ph) * 12 + (hh(x / 100 + i * 20, 62) - .5) * 8)}`; s += `<path d="${d}" fill="none" stroke="${i % 2 ? '#1A0F08' : '#E9D3A8'}" stroke-width="${i % 2 ? 7 : 4}" opacity="${i % 2 ? .12 : .1}"/>`; }
  for (let i = 0; i < 160; i++) s += `<circle cx="${f1(-380 + hh(i, 63) * 1900)}" cy="${f1(GY + 40 + hh(i, 64) * 1100)}" r="${f1(1.5 + hh(i, 65) * 3.4)}" fill="${hh(i, 66) > .5 ? '#F3E3BE' : '#2A1A10'}" opacity="${op(.1 + .22 * hh(i, 67))}"/>`;
  for (let i = 0; i < 12; i++) { const x = -300 + hh(i, 68) * 1700, y = GY + 120 + hh(i, 69) * 900, r = 8 + hh(i, 70) * 20; s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(r * .7)}" fill="#6D5A44" opacity=".75"/><ellipse cx="${f1(x - r * .25)}" cy="${f1(y - r * .25)}" rx="${f1(r * .5)}" ry="${f1(r * .3)}" fill="#E6D2AE" opacity=".5"/>`; }
  // poço (cano) e câmara dos ovos
  const px = POCO.x, pw = POCO.w, C = CAMARA;
  s += `<path d="M${px - pw / 2} ${GY} L${px - pw / 2} ${POCO.fundo - 20} C${px - pw / 2} ${POCO.fundo + 40} ${C.x - C.rx} ${C.y - C.ry + 10} ${C.x - C.rx} ${C.y} C${C.x - C.rx} ${C.y + C.ry * 1.1} ${C.x + C.rx} ${C.y + C.ry * 1.1} ${C.x + C.rx} ${C.y} C${C.x + C.rx} ${C.y - C.ry + 10} ${px + pw / 2} ${POCO.fundo + 40} ${px + pw / 2} ${POCO.fundo - 20} L${px + pw / 2} ${GY}Z" fill="#2E1A0E"/>`;
  s += `<ellipse cx="${C.x}" cy="${C.y + 10}" rx="${C.rx + 30}" ry="${C.ry + 40}" fill="url(#gPitG)" opacity=".9"/><rect x="${px - pw / 2}" y="${GY}" width="${pw}" height="${POCO.fundo - GY}" fill="url(#gPitG)" opacity=".55"/>`;
  s += `<path d="M${px - pw / 2} ${GY} L${px - pw / 2} ${POCO.fundo - 20} C${px - pw / 2} ${POCO.fundo + 40} ${C.x - C.rx} ${C.y - C.ry + 10} ${C.x - C.rx} ${C.y}" fill="none" stroke="#F0DDB4" stroke-width="5" opacity=".55" stroke-linecap="round"/><path d="M${px + pw / 2} ${GY} L${px + pw / 2} ${POCO.fundo - 20} C${px + pw / 2} ${POCO.fundo + 40} ${C.x + C.rx} ${C.y - C.ry + 10} ${C.x + C.rx} ${C.y}" fill="none" stroke="#F0DDB4" stroke-width="5" opacity=".55" stroke-linecap="round"/>`;
  s += `<rect x="-400" y="${GY - 6}" width="2000" height="10" fill="#EDF2FF" opacity=".7"/>`;
  return s;
}
function cenaCorte(t, sub, o = {}) {
  const { dof = 1 } = o;
  let s = lay(.05, ceuNoite(t));
  s += lay(.1, blur(7 * dof, brilhoCidade(t)));
  s += lay(.14, blur(5 * dof, duna(t, 830)));
  s += lay(1, `<rect x="-400" y="800" width="2000" height="${GY - 800}" fill="#0C1C4A" opacity=".0"/>` + sub);
  return s;
}
// posição da ponta da pata traseira no mundo (a mãe em MX, GY): para jogar areia dali
const MX = 600, hfAng = c => 70 + 80 * (.5 - .5 * Math.cos(c * 6.2832));
function pontaPata(c) { const a = hfAng(c) * Math.PI / 180, bx = MX - 196, by = GY - 46, lx = 54 * 1.95, ly = 60 * 1.95; return [bx + lx * Math.cos(a) - ly * Math.sin(a), by + lx * Math.sin(a) + ly * Math.cos(a)]; }
const CICLO = .9;

/* ===================== 3. a mãe cava ===================== */
function sCava(t) {
  const { L, d, k } = loc(t, 'cava'), [jx, jy] = hand2(t), e = easeInOut(k), cv = (t / CICLO) % 1;
  setCam(lerp(660, 600, e) + jx, lerp(1010, 1030, e) + jy, lerp(1.0, 1.2, e), lerp(-1.2, .5, e), BASE);
  const [px, py] = pontaPata(cv);
  const mae = `<g transform="translate(${MX},${GY})">${rimGroup(tartLado({ cava: cv, resp: t * .55, cab: Math.sin(t * 2.2) * .6, olho: pulse(L, .7, .8, .05), pinta: 1, chora: 1 }), [1, -.7], '#BCD4FF', 3.5)}</g>`;
  const areia = jato(t, px, py, { n: 70, v: 780, g: 2100, a0: -2.45, abre: .45, seed: 21, rep: CICLO, vida: .85, maxR: 7 });
  return cenaCorte(t, solo(t) + areia + mae) + VIG(.55) + GRAINV(t);
}
/* ===================== 4. os ovos caem na câmara ===================== */
function sOvos(t) {
  const { L, d, k } = loc(t, 'ovos'), [jx, jy] = hand2(t), e = easeInOut(k);
  setCam(lerp(335, 330, e) + jx * .5, lerp(1330, 1290, e) + jy * .5, lerp(2.0, 1.28, e), lerp(1.2, -.4, e), BASE);
  const { base, queda } = pilhaOvos(t, 5.5 + .1, .85, CAMARA.x, CAMARA.y + 18, CAMARA.rx - 10, CAMARA.ry - 8, 15, GY - 10), cv = (t / CICLO) % 1;
  const mae = `<g transform="translate(${MX},${GY})">${rimGroup(tartLado({ cava: .05 + .08 * Math.sin(t * 3), resp: t * .55, cab: Math.sin(t * 2.2) * .4, olho: 0, pinta: 1, chora: 1 }), [1, -.7], '#BCD4FF', 3.5)}</g>`;
  const brilho = `<ellipse cx="${CAMARA.x}" cy="${CAMARA.y}" rx="320" ry="260" fill="url(#gAmber)" opacity=".5"/>`;
  return cenaCorte(t, solo(t) + brilho + base + queda + mae) + VIG(.55) + GRAINV(t);
}


/* ===================== 5. cobre tudo e vai embora (vista de cima) ===================== */
const TRILHA = Array.from({ length: 130 }, (_, i) => { const y = NINHO.y + 30 + i * (2000 / 129); return [540 + 26 * Math.sin(y / 170), y]; });
const posTrilha = s => { const f = clamp(s / (TRILHA.length - 1)) * (TRILHA.length - 1), i = Math.min(TRILHA.length - 2, Math.floor(f)), q = f - i, a = TRILHA[i], b = TRILHA[i + 1]; return [lerp(a[0], b[0], q), lerp(a[1], b[1], q), Math.atan2(b[1] - a[1], b[0] - a[0])]; };
function sCobre(t) {
  const { L, d, k } = loc(t, 'cobre'), [jx, jy] = hand2(t), e = easeInOut(k);
  setCam(540 + jx, lerp(1070, 1040, e) + jy, lerp(.78, .7, e), lerp(.8, 0, e), BASE);
  const cover = range(L, 0, .62), vira = easeInOut(range(L, .55, 1.05)), anda = easeInOut(range(L, .95, 1.7));
  const s = anda * 46, [px, py, ang0] = posTrilha(s), headA = lerp(0, 180, vira) + (ang0 * 57.3 - 90) * range(L, 1.05, 1.7) * 0, cx = lerp(NINHO.x, px, anda), cy = lerp(NINHO.y - 170, py - 40, anda);
  const sand = jato(t, NINHO.x, NINHO.y - 40, { n: 54, v: 420, g: 200, vida: .7, abre: 3.1, seed: 31, rep: .55, maxR: 7 }) .replace(/$/, '');
  const mae = `<g transform="translate(${f1(cx)},${f1(cy)}) rotate(${f1(headA)}) scale(1.5)">${rimGroup(tartTopo({ tom: 'adu', ph: t * (cover < 1 ? 1.7 : .9), v: .9, pinta: 1, cab: Math.sin(t * 2) * .3 }), [1, -1], '#BCD4FF', 4)}</g>`;
  const marca = rastro(TRILHA, Math.max(2, Math.round(46 * anda) + 60), 120);
  const sub = praiaTopo(t) + marca + montinho(NINHO.x, NINHO.y, 92, 1) + (cover < 1 ? `<g opacity="${op(1 - range(L, .5, .65))}">${sand}</g>` : '') + mae;
  return lay(1, sub) + VIG(.55) + GRAINV(t);
}

/* ===================== 6. dois meses (time-lapse do céu, plaquinha de dias) ===================== */
const PAL_CEU = { noite: ['#0E1A52', '#2A4796', '#6E8FE0'], alva: ['#3A3E86', '#E58A7B', '#FFD3A0'], dia: ['#4E8FD8', '#8CC0EE', '#DFF0FA'], poente: ['#2B2B6E', '#C86A78', '#FFB27A'] };
function corCeu(p) {                                                                  // p 0..1: 0 alvorada, .25 meio-dia, .5 poente, .75 meia-noite
  const L = [PAL_CEU.alva, PAL_CEU.dia, PAL_CEU.poente, PAL_CEU.noite, PAL_CEU.alva], f = ((p % 1) + 1) % 1 * 4, i = Math.floor(f), q = smooth(f - i);
  return [0, 1, 2].map(k => mix(L[i][k], L[i + 1][k], q));
}
function ceuCiclo(p, t) {
  const [c1, c2, c3] = corCeu(p), id = nid('cc'), noite = clamp(1 - Math.abs(((p % 1) + 1) % 1 - .75) / .2);
  def(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="-300" x2="0" y2="1300"><stop offset="0" stop-color="${c1}"/><stop offset=".55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>`);
  let s = `<rect x="-900" y="-1400" width="2900" height="2900" fill="url(#${id})"/>`;
  s += `<g opacity="${op(noite)}">${blur(1, estrelas(t, 80, 800))}</g>`;
  const ps = (((p % 1) + 1) % 1), sol = ps < .5 ? ps / .5 : -1, lun = ps >= .5 ? (ps - .5) / .5 : -1;
  if (sol >= 0) { const x = lerp(-120, 1200, sol), y = 1180 - 900 * Math.sin(Math.PI * sol); s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="520" fill="url(#gLamp)" opacity=".5"/><circle cx="${f1(x)}" cy="${f1(y)}" r="92" fill="#FFF4C8"/>`; }
  if (lun >= 0) { const x = lerp(-120, 1200, lun), y = 1180 - 820 * Math.sin(Math.PI * lun); s += lua(f1(x), f1(y), 120); }
  for (let i = 0; i < 5; i++) { const x = ((t * (90 + i * 30) + i * 300) % 1700) - 300; s += blur(14, `<ellipse cx="${f1(x)}" cy="${300 + i * 130}" rx="${260 + i * 40}" ry="36" fill="#fff" opacity="${op(.14 + .1 * (1 - noite))}"/>`); }
  return s;
}
function tagMundo(x, y, n, t, k = 1) {
  const sway = Math.sin(t * 5) * 2 + Math.sin(t * 11) * .8;
  return `<g opacity="${op(k)}" transform="translate(${x},${y}) rotate(${f1(sway)} 0 0)"><path d="M0 0 L0 54" stroke="#3E2A1A" stroke-width="4"/><g transform="translate(0,104)"><rect x="-122" y="-48" width="244" height="96" rx="14" fill="#000" opacity=".28" transform="translate(6,8)"/><path d="M-122 -34 Q-122 -48 -108 -48 L108 -48 Q122 -48 122 -34 L122 34 Q122 48 108 48 L-108 48 Q-122 48 -122 34Z" fill="#FFF1C8" stroke="#3E2A1A" stroke-width="4"/><circle cx="-98" cy="-26" r="8" fill="#3E2A1A"/><circle cx="-98" cy="-26" r="3" fill="#FFF1C8"/><text x="10" y="15" font-size="48" fill="#3E2A1A" text-anchor="middle">DIA ${n}</text></g></g>`;
}
function sTempo(t) {
  const { L, d, k } = loc(t, 'tempo'), [jx, jy] = hand2(t), e = easeInOut(k), ciclos = 2.6;
  setCam(600 + jx * .5, lerp(1200, 1150, e) + jy * .5, lerp(1.22, 1.38, e), 0, BASE);
  const u = easeInOut(range(L, .1, 1.4)), p = .56 + ciclos * u, dia = 1 + Math.floor(59 * u + .001), tremor = range(L, 1.38, 1.6) * 5;
  const [px, py] = [Math.sin(t * 60) * tremor, Math.cos(t * 71) * tremor];
  let s = lay(.05, ceuCiclo(p, t));
  s += lay(.12, blur(6, duna(t, 1000)));
  s += lay(.3, `<rect x="-300" y="1010" width="1700" height="1700" fill="url(#sandW)"/>` + ondulacoes(1050, 1900, 18, 9));
  const dia_ = (((p % 1) + 1) % 1), luzDia = dia_ < .5 ? Math.sin(Math.PI * dia_ / .5) : 0;
  const mound = `<g transform="translate(${f1(540 + px)},${f1(1340 + py)})"><ellipse cx="0" cy="22" rx="300" ry="38" fill="#07102A" opacity=".3"/><path d="M-290 30 C-240 -30 -120 -76 0 -78 C130 -76 240 -30 290 30Z" fill="url(#sandLip)"/><path d="M-250 8 C-190 -44 -90 -70 0 -72 C90 -70 180 -44 250 8" fill="none" stroke="#F2F6FF" stroke-width="5" opacity=".6" stroke-linecap="round"/>${tremor > 0 ? `<path d="M-30 -74 L-12 -40 L-34 -20 M18 -76 L30 -48 L12 -26" stroke="#4B5F96" stroke-width="4" fill="none" opacity="${op(tremor / 3)}" stroke-linecap="round"/>` : ''}</g>`;
  const estaca = `<g transform="translate(760,1370)"><rect x="-16" y="-330" width="32" height="360" rx="6" fill="#7A5A3A"/><path d="M-16 30 L0 70 L16 30Z" fill="#7A5A3A"/><rect x="-16" y="-330" width="9" height="360" fill="#B28E64" opacity=".6"/><g transform="translate(0,-356)"><rect x="-88" y="-38" width="176" height="76" rx="8" fill="#2A3F6B" stroke="#E8DDB8" stroke-width="3"/><text x="0" y="6" font-size="34" fill="#F4EBCB" text-anchor="middle">HRYZ</text><text x="0" y="28" font-size="14" fill="#BFD0F0" text-anchor="middle" letter-spacing="2">ANIMATION</text></g>${tagMundo(0, -300, dia, t)}</g>`;
  s += lay(1, mound + estaca);
  s += `<rect width="1080" height="1920" fill="#FFB060" opacity="${op(.1 * (1 - Math.abs(dia_ - .5) / .5) * (dia_ > .25 ? 1 : 0))}"/>`;
  return s + VIG(.5) + GRAINV(t);
}

/* ===================== 7. quebram a casca e cavam juntos (corte do ninho) ===================== */
const NIN = { x: 540, y: 1420, rx: 270, ry: 175 };
function sJuntos(t) {
  const { L, d, k } = loc(t, 'juntos'), [jx, jy] = hand2(t), e = easeInOut(k);
  setCam(540 + jx * .6, lerp(1280, 1400, e) + jy * .6, lerp(1.25, 1.65, easeInOut(range(L, 0, 1.2))), lerp(-1, 1, e), BASE);
  const topo = lerp(NIN.y - NIN.ry + 20, GY + 70, easeInOut(range(L, .35, 1.75)));            // o teto sobe: eles cavam para cima
  const pisa = lerp(0, 36, easeInOut(range(L, .2, 1.7)));                                   // o chão sobe (areia socada)
  const rompe = range(L, 1.72, 1.98);
  let s = lay(.05, ceuNoite(t));
  s += lay(.12, blur(6, duna(t, 830)));
  let sub = `<rect x="-400" y="${GY}" width="2000" height="1700" fill="url(#gSoil)"/>`;
  for (let i = 0; i < 12; i++) sub += `<path d="M-400 ${GY + 80 + i * 80} Q300 ${GY + 66 + i * 80} 700 ${GY + 90 + i * 80} T1500 ${GY + 80 + i * 80}" fill="none" stroke="${i % 2 ? '#1A0F08' : '#E9D3A8'}" stroke-width="${i % 2 ? 6 : 3}" opacity=".1"/>`;
  for (let i = 0; i < 140; i++) sub += `<circle cx="${f1(-380 + hh(i, 91) * 1900)}" cy="${f1(GY + 40 + hh(i, 92) * 1100)}" r="${f1(1.5 + hh(i, 93) * 3.2)}" fill="${hh(i, 94) > .5 ? '#F3E3BE' : '#2A1A10'}" opacity="${op(.1 + .2 * hh(i, 95))}"/>`;
  sub += `<rect x="-400" y="${GY - 6}" width="2000" height="10" fill="#EDF2FF" opacity=".7"/>`;
  // cavidade: elipse que cresce para cima
  const cy = (topo + NIN.y + NIN.ry - pisa) / 2, ry = (NIN.y + NIN.ry - pisa - topo) / 2;
  sub += `<ellipse cx="${NIN.x}" cy="${f1(cy)}" rx="${NIN.rx}" ry="${f1(ry)}" fill="#2E1A0E"/><ellipse cx="${NIN.x}" cy="${f1(cy + 10)}" rx="${NIN.rx + 30}" ry="${f1(ry + 40)}" fill="url(#gPitG)" opacity=".8"/>`;
  sub += `<ellipse cx="${NIN.x}" cy="${f1(cy)}" rx="${NIN.rx}" ry="${f1(ry)}" fill="none" stroke="#F0DDB4" stroke-width="5" opacity=".5"/>`;
  sub += `<ellipse cx="${NIN.x}" cy="${f1(NIN.y + 30)}" rx="360" ry="260" fill="url(#gAmber)" opacity=".42"/>`;
  // cascas no chão, ovos que racham e filhotes (os de cima raspam o teto, os de baixo pisam)
  for (let i = 0; i < 26; i++) { const x = NIN.x - NIN.rx * .8 + hh(i, 101) * NIN.rx * 1.6, y = NIN.y + NIN.ry - pisa - 14 - hh(i, 102) * 38, r = 15; if (range(L, .0, .6) > hh(i, 103)) sub += `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1((hh(i, 104) - .5) * 80)})"><path d="M-${r} 0 Q0 ${-r * 1.4} ${r} 0 L${r * .6} ${r * .3} L${r * .2} 0 L${-r * .3} ${r * .35} L${-r * .8} ${r * .2}Z" fill="#EFE7D2" opacity=".92"/></g>`; else sub += ovo(x, y, r); }
  const N = 34, filhotes = [];
  for (let i = 0; i < N; i++) {
    const fx = hh(i, 111), fy = hh(i, 112), x = NIN.x + (fx - .5) * NIN.rx * 1.5, yCav = lerp(topo + 46, NIN.y + NIN.ry - pisa - 40, fy);
    const sc = .4 + hh(i, 113) * .14, topoRow = fy < .22, ph = t * (1.6 + hh(i, 114) * .8) + hh(i, 115) * 3, dly = hh(i, 116) * .55, vis = range(L, dly, dly + .35);
    if (vis <= 0) continue;
    const rot = topoRow ? -90 + Math.sin(ph * 6.28) * 14 : (hh(i, 117) - .5) * 160 + Math.sin(ph * 3) * 18;
    filhotes.push(`<g transform="translate(${f1(x)},${f1(yCav)}) rotate(${f1(rot)}) scale(${f1(sc * vis)})" opacity="${op(vis)}">${filhoteLado({ ph, a: topoRow ? 1.3 : .8, cab: topoRow ? Math.sin(ph * 6.28) : 0 })}</g>`);
  }
  sub += rimGroup(filhotes.join(''), [0, -1], '#FFDDA0', 5);
  // areia caindo do teto
  for (let i = 0; i < 70; i++) { const per = .55 + hh(i, 121) * .5, tau = (t + hh(i, 122) * per) % per, x = NIN.x + (hh(i, 123) - .5) * NIN.rx * 1.7, y = topo + 10 + tau * 640 * (.6 + hh(i, 124)) ; if (y > NIN.y + NIN.ry - pisa) continue; sub += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(2 + hh(i, 125) * 4)}" fill="#E8D2A8" opacity="${op(.8 * (1 - tau / per))}"/>`; }
  if (rompe > 0) { sub += `<path d="M${NIN.x - 90 * rompe} ${GY - 4} Q${NIN.x} ${f1(GY - 70 * rompe)} ${NIN.x + 90 * rompe} ${GY - 4}Z" fill="#8FB0F0" opacity="${op(rompe)}"/>` + jato(t, NIN.x, GY, { n: 40, v: 520, g: 1700, abre: .8, seed: 55, rep: .5, maxR: 7 }); }
  s += lay(1, sub);
  return s + VIG(.55) + GRAINV(t);
}

/* ===================== 8. a bússola: a parte mais clara do horizonte ===================== */
// Chão visto de trás dos filhotes: o mar e a lua lá na frente (trilha de brilho), areia em primeiro plano. A câmera avança com eles: a linha d'água desce e cresce.
function praiaDeCostas(t, shore = 1070) {
  let s = lay(.04, ceuNoite(t, { y1: 800 }));
  s += lay(.08, marDeFrente(t, 810, shore - 810));
  s += lay(.1, `<rect x="-300" y="${f1(shore - 20)}" width="1700" height="${f1(36 + (shore - 1070) * .12)}" fill="#EAF2FF" opacity=".8" filter="url(#b4)"/>` + [0, 1, 2].map(i => `<path d="M-300 ${f1(shore + i * (26 + (shore - 1070) * .08))} Q300 ${f1(shore - 10 + i * 26 + 10 * Math.sin(t * 1.5 + i))} 700 ${f1(shore + 2 + i * 26)} T1400 ${f1(shore + i * 26)}" fill="none" stroke="#F4F9FF" stroke-width="${f1((8 - i * 2) * (1 + (shore - 1070) / 500))}" opacity="${.8 - i * .2}"/>`).join(''));
  const id = nid('mh'); def(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${f1(shore + 10)}" x2="0" y2="2400"><stop offset="0" stop-color="#7E96C8"/><stop offset=".25" stop-color="#9DB1DC"/><stop offset=".6" stop-color="#C2D1EE"/><stop offset="1" stop-color="#D8E4FA"/></linearGradient>`);
  s += lay(.14, `<rect x="-300" y="${f1(shore + 10)}" width="1700" height="1800" fill="url(#${id})"/>` + ondulacoes(shore + 120, 2300, 14, 15));
  return s;
}
function filhoteCostas(x, y, sc, ph, v, o = {}) {
  return `<g transform="translate(${f1(x)},${f1(y)})"><ellipse cx="6" cy="${f1(14 * sc)}" rx="${f1(92 * sc)}" ry="${f1(40 * sc)}" fill="#07102A" opacity=".3"/><g transform="scale(${f1(sc)},${f1(sc * .7)})">${tartTopo({ ph, v, tom: 'fil', pinta: o.pinta || 0, cab: o.cab || 0, sombra: 0 })}</g></g>`;
}
function sBussola(t) {
  const { L, d, k } = loc(t, 'bussola'), [jx, jy] = hand2(t), tilt = easeInOut(range(L, .3, 2.0));
  setCam(540 + jx * .6, lerp(1300, 990, tilt) + jy * .6, 1.0, lerp(-1.2, 0, tilt), BASE);
  const aproxima = easeInOut(range(L, 2.0, 4.2)), shore = lerp(1070, 1290, aproxima);
  let s = praiaDeCostas(t, shore);
  const lista = [], NF = 30, nest = { x: 540, y: 1900 };
  const pausa = range(L, 1.5, 1.8) * (1 - range(L, 2.1, 2.4));
  for (let i = 0; i < NF; i++) {
    const dly = hh(i, 131) * .6, a = range(L, dly, dly + .35);
    if (a <= 0) continue;
    const spread = range(L, .2, 1.7), walk = range(L, 2.1 + hh(i, 132) * .4, 4.2), rowv = hh(i, 133), prof = rowv;
    const x = 540 + (hh(i, 134) - .5) * 900 * (.35 + .65 * spread) * (1 - prof * .35) + Math.sin(t * 1.3 + i) * 8;
    const y = lerp(1900 - 20 * hh(i, 135), 1640 - 280 * prof, spread) - 70 * walk * (.5 + prof * .5);
    const sc = lerp(1.2, .72, prof) * (.88 + .22 * hh(i, 136)) * (1 - .12 * walk);
    lista.push([y, `<g opacity="${op(a)}">${filhoteCostas(x, y, sc, t * (1.5 + hh(i, 137) * .5) + i, a * (1 - pausa * .9))}</g>`]);
  }
  const mH = range(L, 2.1, 4.2), yH = lerp(1790, 1580, easeInOut(range(L, .4, 1.6))) - 60 * mH, xH = 500 + Math.sin(t * 1.1) * 12 + mH * 26;
  lista.push([yH, `<g>${filhoteCostas(xH, yH, 1.7 * (1 - .1 * mH), t * 1.9, 1 - pausa * .9, { pinta: 1, cab: -.2 })}</g>`]);
  lista.sort((p, q) => p[0] - q[0]);
  let sub = rimGroup(lista.map(p => p[1]).join(''), [1, -1], '#BCD4FF', 5);
  sub += `<g opacity="${op(1 - range(L, .8, 1.4))}">${jato(t, 540, 1900, { n: 40, v: 500, g: 1500, abre: 1.0, seed: 61, rep: .9, vida: .8, maxR: 6 })}</g>`;
  s += lay(1, sub);
  return s + VIG(.5) + GRAINV(t);
}

/* ===================== 9. a luz errada, o caranguejo e a ave (vista de cima) ===================== */
const BURACO = { x: 730, y: 2290 };
function sLuz(t) {
  const { L, d, k } = loc(t, 'luz'), [jx, jy] = hand2(t);
  const lampK = easeOut(range(L, .35, .8)) * 1, cy = lerp(1840, 2110, easeInOut(k));
  setCam(lerp(500, 520, k) + jx * .5, cy + jy * .5, lerp(1.0, 1.08, k), lerp(.8, -.4, k), BASE);
  const ang = (dx, dy) => Math.atan2(dy, dx) * 57.2958 + 90;
  const lista = [];
  const NF = 22, vDown = 165, vLamp = 150;
  const passoSim = (i, x0, y0, tv, quem) => {                               // integra a trajetória: desce, e quem vira vai para a lâmpada
    let x = x0, y = y0, hx = 0, hy = 1, dt = L / 40;
    for (let s = 0; s < 40; s++) {
      const ts = s * dt, aLamp = quem ? smooth(range(ts, tv, tv + .8)) : 0, dx = LAMP.x + 120 - x, dy = LAMP.y - y, dd = Math.hypot(dx, dy) || 1;
      const vx = lerp(0, dx / dd, aLamp), vy = lerp(1, dy / dd, aLamp), sp = lerp(vDown, vLamp, aLamp);
      x += vx * sp * dt + Math.sin(ts * 5 + i) * 6 * dt; y += vy * sp * dt; hx = vx; hy = vy;
    }
    return [x, y, hx, hy];
  };
  for (let i = 0; i < NF; i++) {
    const x0 = 110 + hh(i, 141) * 860, y0 = 1380 + hh(i, 142) * 640 - (i % 5) * 20, vira = x0 < 560 && hh(i, 143) < .75, tv = .55 + hh(i, 144) * .5;
    let [x, y, hx, hy] = passoSim(i, x0, y0, tv, vira);
    let scatter = 0;
    const bx = lerp(1500, -500, range(L, 3.0, 3.7)), by = 2150, near = Math.max(0, 1 - Math.hypot(x - bx, y - by) / 420) * (L > 3.0 && L < 3.8 ? 1 : 0);
    if (near > 0) { x += (hh(i, 145) - .5) * 140 * near; y -= 60 * near * hh(i, 146); }
    if (i === 5) { const q = range(L, 2.35, 3.0), px5 = lerp(x, 560, range(L, 1.6, 2.35)), py5 = lerp(y, BURACO.y - 6, range(L, 1.6, 2.35)); [x, y] = [lerp(px5, BURACO.x, easeIn(q)), lerp(py5, BURACO.y, easeIn(q))]; }
    const quemSumiu = i === 5 && range(L, 2.35, 3.0) >= .98;
    if (quemSumiu) continue;
    const esc = i === 5 ? lerp(.5, .24, range(L, 2.7, 3.0)) : .5;
    lista.push([y, `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(ang(hx, hy) + (near > 0 ? Math.sin(t * 22 + i) * 14 : 0))}) scale(${f1(esc)})">${tartTopo({ ph: t * (1.7 + hh(i, 147) * .5) + i, v: 1, tom: 'fil', sombra: 1 })}</g>`]);
  }
  // o herói: vai para baixo, para e olha as duas luzes, escolhe a azul
  const parar = range(L, .75, 1.0) * (1 - range(L, 1.75, 2.0)), hx0 = 560, hy0 = 1930, hy = hy0 + 165 * (L - .6 * 0 - 1.0 * parar * 0) * .0 + (vDown * Math.max(0, Math.min(L, .85))) + vDown * Math.max(0, L - 1.95) * 1.0 - 0;
  const look = L > .9 && L < 1.95 ? (L < 1.3 ? -1 : (L < 1.65 ? .5 : -.3)) : 0, hxx = hx0 + 14 * Math.sin(t * 2.2) * (1 - parar);
  lista.push([hy + 100, `<g transform="translate(${f1(hxx)},${f1(hy)}) rotate(${f1(look * 12)}) scale(.95)">${tartTopo({ ph: t * 1.9, v: 1 - parar * .95, tom: 'fil', pinta: 1, cab: look, sombra: 1 })}</g>`]);
  lista.sort((p, q) => p[0] - q[0]);
  // caranguejo: sai do buraco, vai de lado até o filhote e arrasta para dentro
  const cs = range(L, 1.95, 2.35), cg = range(L, 2.3, 2.5), volta = range(L, 2.5, 3.0);
  const cX = lerp(BURACO.x + 4, 640, easeOut(cs)) + (BURACO.x - 640) * easeIn(volta) * 0, cY = BURACO.y;
  const xC = lerp(lerp(BURACO.x, 600, easeOut(cs)), BURACO.x, easeInOut(volta)), yC = lerp(BURACO.y - 4, BURACO.y + 6, 0);
  const caran = (L > 1.9 && !(volta >= 1)) ? `<g transform="translate(${f1(xC)},${f1(yC)}) rotate(${f1(-90 + (volta > 0 ? 180 : 0))}) scale(1.6)">${caranguejo({ ph: t * 3.2, garra: cg * (1 - volta) })}</g>` : '';
  const burac = `<g transform="translate(${BURACO.x},${BURACO.y})"><ellipse rx="64" ry="50" fill="#6B7DAE"/><ellipse rx="52" ry="40" fill="#0C1636"/><ellipse cx="-8" cy="-8" rx="30" ry="18" fill="#000" opacity=".5"/></g>`;
  const marcaT = rastro(TRILHA, 130, 120);
  let sub = praiaTopo(t, { lamp: lampK }) + marcaT + montinho(NINHO.x, NINHO.y, 92, 1) + burac;
  sub += rimGroup(lista.map(p => p[1]).join(''), [1, -1], '#BCD4FF', 4.5) + caran;
  if (L > 2.9 && L < 3.8) sub += sombraAve(t, lerp(1500, -500, range(L, 3.0, 3.7)), 2150 + 30 * Math.sin(L * 6), 1.5);
  return lay(1, sub) + VIG(.55) + GRAINV(t);
}

/* ===================== 10. a água: a onda leva os filhotes e eles nadam ===================== */
function sAgua(t) {
  const { L, d, k } = loc(t, 'agua');
  if (L < 1.35) {                                                          // 10a: linha d'água vista de cima, a onda sobe e arrasta
    const [jx, jy] = hand2(t), e = easeInOut(L / 1.35), onda = Math.sin(Math.PI * clamp(L / 1.35)) ;
    setCam(540 + jx, lerp(2780, 2900, e) + jy, lerp(1.05, 1.12, e), lerp(.8, -.6, e), BASE);
    const lista = [];
    for (let i = 0; i < 9; i++) {
      const x = 180 + hh(i, 161) * 720, y = lerp(2480 + hh(i, 162) * 160, 2780 + 220 * onda + hh(i, 163) * 60, easeIn(range(L, 0, 1.2))) + 120 * range(L, .5, 1.35), mol = range(y, 2740, 2840);
      lista.push(`<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(Math.sin(t * 3 + i) * 12 + (i === 0 ? 0 : 0))}) scale(.52)" opacity="${op(1 - .3 * mol)}">${tartTopo({ ph: t * 2 + i, v: 1, tom: 'fil', sombra: 1 })}</g>`);
    }
    lista.push(`<g transform="translate(${f1(540 + Math.sin(t * 2) * 10)},${f1(lerp(2560, 2900, easeIn(range(L, 0, 1.2))))}) rotate(${f1(Math.sin(t * 3) * 9)}) scale(.95)">${tartTopo({ ph: t * 2.2, v: 1, tom: 'fil', pinta: 1, sombra: 1 })}</g>`);
    return lay(1, praiaTopo(t, { lamp: 1 }) .replace(/$/, '') + rimGroup(lista.join(''), [1, -1], '#BCD4FF', 4) + `<rect x="-400" y="${f1(2780 + 220 * onda)}" width="2100" height="1200" fill="#8FD0F0" opacity="${op(.28 * onda)}"/>`) + VIG(.5) + GRAINV(t);
  }
  // 10b: debaixo d'água: o herói nada, uma sombra de peixe passa por baixo
  const q = L - 1.35, d2 = d - 1.35, [jx, jy] = hand2(t), kk = q / d2;
  setCam(540 + jx, lerp(1000, 780, easeInOut(kk)) + jy, lerp(1.0, .9, kk), lerp(-1.4, 1.2, kk), BASE);
  const nada = t * 2.4, heroX = 460 + 40 * Math.sin(t * 1.3) + 90 * kk, heroY = lerp(1060, 760, easeInOut(kk)) + 16 * Math.sin(t * 2.4), fx = lerp(1500, -700, range(q, .1, 1.5)), fy = 1450;
  let s = lay(.2, aguaFundo(t));
  s += lay(.5, peixeSombra(fx, fy, 1.7, t, 1 - range(q, 1.4, 1.9)));
  const sp = heroX - fx, susto = Math.max(0, 1 - Math.abs(fx - heroX) / 700);
  const bolhas = Array.from({ length: 12 }, (_, i) => { const tt = ((t * .9 + i * .21) % 1), bx = heroX - 40 - tt * 220 + Math.sin(i * 2 + tt * 8) * 12, by = heroY - 10 - tt * 160; return `<circle cx="${f1(bx)}" cy="${f1(by)}" r="${f1(3 + hh(i, 171) * 6 * (1 - tt * .4))}" fill="#fff" opacity="${op(.6 * (1 - tt))}"/>`; }).join('');
  const hero = `<g transform="translate(${f1(heroX)},${f1(heroY)}) rotate(${f1(-8 + 6 * Math.sin(t * 2.4) - 10 * susto)}) scale(1.55)">${filhoteLado({ ph: nada * (1 + susto), a: 1.5, pinta: 1, nada: 1, cab: -.3 })}</g>`;
  s += lay(1, bolhas + rimGroup(hero, [0, -1], '#CFEFFF', 5));
  return s + VIG(.55) + GRAINV(t);
}

/* ===================== 11. um em cada mil (mil pontinhos; só um fica) ===================== */
const NPONTOS = 1000, TRAJ = Array.from({ length: NPONTOS }, (_, i) => ({ x: -160 + hh(i, 191) * 1400, y0: 820 + hh(i, 192) * 520, v: 300 + hh(i, 193) * 320, dly: hh(i, 194) * .5, die: i === 0 ? 99 : .5 + Math.pow(hh(i, 195), .8) * 1.9, drift: (hh(i, 196) - .5) * 160 }));
function sMilPontos(t) {
  const { L, d, k } = loc(t, 'milPontos'), [jx, jy] = hand2(t), e = easeInOut(k);
  setCam(540 + jx, lerp(1500, 2020, e) + jy, lerp(1.08, .54, e), lerp(.6, -.6, e), BASE);
  const baldes = Array.from({ length: 12 }, () => []);
  let heroXY = [540, 900];
  TRAJ.forEach((p, i) => {
    const tt = Math.max(0, L - p.dly * .6); if (tt <= 0 && i) return;
    const y = p.y0 + p.v * tt * (1 + .15 * Math.min(1, tt)), x = p.x + p.drift * Math.min(tt, 1.8) * .5 + Math.sin(tt * 4 + i) * 8;
    if (i === 0) { heroXY = [540 + 18 * Math.sin(tt * 2), p.y0 + 330 * tt]; return; }
    const vida = 1 - range(L, p.die - .25, p.die + .1); if (vida <= 0) return;
    baldes[Math.min(11, Math.floor((1 - vida) * 12))].push(`M${f1(x)} ${f1(y)}h.1`);
  });
  let sub = praiaTopo(t, { lamp: .55 }) + `<rect x="-400" y="-300" width="2200" height="5400" fill="#0A1844" opacity=".28"/>`;
  baldes.forEach((b, j) => { if (b.length) { const dd = b.join(''); sub += `<path d="${dd}" stroke="#D8E8CF" stroke-width="${f1(21 - 6 * j / 12)}" stroke-linecap="round" opacity="${op(.7 * (1 - j / 12 * .85))}"/><path d="${dd}" stroke="#14221B" stroke-width="${f1(15 - 5 * j / 12)}" stroke-linecap="round" opacity="${op(.95 * (1 - j / 12 * .85))}"/>`; } });
  const hxy = [heroXY[0], Math.min(heroXY[1], 2860 + 700 * range(L, 1.2, 2.9))], pulso = 1 + .12 * Math.sin(t * 6), q = range(L, .8, 2.4);
  sub += `<circle cx="${f1(hxy[0])}" cy="${f1(hxy[1])}" r="${f1(150 * pulso)}" fill="url(#gGold)" opacity="${op(.25 + .75 * q)}"/><circle cx="${f1(hxy[0])}" cy="${f1(hxy[1])}" r="${f1(21 + 8 * q)}" fill="#FFE9A0" stroke="#fff" stroke-width="5"/><circle cx="${f1(hxy[0])}" cy="${f1(hxy[1])}" r="${f1(9 + 3 * q)}" fill="#14221B"/>`;
  return lay(1, sub) + VIG(.55) + GRAINV(t);
}

/* ===================== 12. trinta anos depois: ela volta (a adulta sai da onda) ===================== */
function sAnos(t) {
  const { L, d, k } = loc(t, 'anos'), [jx, jy] = hand2(t);
  const parte = L < 1.9 ? 0 : 1;
  if (!parte) {                                                                                   // 12a: céu em time-lapse: luas e estrelas passam
    const q = L / 1.9, e = easeInOut(q);
    setCam(540 + jx, lerp(1100, 860, e) + jy, lerp(1.0, 1.0, e), lerp(-.6, .6, e), BASE);
    let s = lay(.04, `<rect x="-900" y="-1400" width="2900" height="3000" fill="url(#skyNight)"/>`);
    s += lay(.06, estrelasGiro(t, lerp(.1, 1.7, e)));
    const nl = 3.2, u = (q * nl) % 1, nlua = Math.floor(q * nl), fase = ((q * 8) % 1);
    s += lay(.1, luaFase(lerp(1200, -120, u), 700 - 480 * Math.sin(Math.PI * u), 120, fase));
    s += lay(.14, blur(5, duna(t, 1180, '#0C2150')));
    s += lay(.3, marDeFrente(t, 1210, 300).replace(/\$/, '') + `<rect x="-300" y="1500" width="1700" height="900" fill="url(#sandW)"/>`);
    return s + VIG(.5) + GRAINV(t);
  }
  // 12b: a adulta sai da arrebentação (de lado, mar à esquerda, duna e lua à direita)
  const q = (L - 1.9) / (d - 1.9), e = easeInOut(q);
  setCam(lerp(430, 640, e) + jx * .6, 1010 + jy * .6, lerp(1.05, 1.0, e), lerp(.6, -.4, e), BASE);
  const GL = 1130, shoreX = 360, tx = lerp(60, 640, easeInOut(range(q, .02, .98))), slope = Math.max(0, (tx - shoreX) * .06);
  let s = lay(.05, ceuNoite(t));
  s += lay(.12, blur(6, duna(t, 860)));
  s += lay(.2, `<rect x="-400" y="920" width="${shoreX + 400}" height="200" fill="url(#seaG)"/><rect x="-400" y="920" width="${shoreX + 400}" height="6" fill="#BFD6FF" opacity=".6"/>` + Array.from({ length: 30 }, (_, i) => `<rect x="${f1(-360 + hh(i, 201) * (shoreX + 330))}" y="${f1(926 + hh(i, 202) * 190)}" width="${f1(30 + hh(i, 203) * 120)}" height="4" rx="2" fill="#F2F7FF" opacity="${op(.15 + .35 * (.5 + .5 * Math.sin(t * 2 + i)))}"/>`).join(''));
  s += lay(.3, `<path d="M-400 1130 L${shoreX - 120} 1130 Q${shoreX} 1136 ${shoreX + 220} 1126 L1500 1090 L1500 2400 L-400 2400Z" fill="url(#sandW)"/>` + ondulacoes(1150, 1900, 14, 11));
  const adulta = `<g transform="translate(${f1(tx)},${f1(GL - slope)})">${rimGroup(tartLado({ pose: 'anda', passo: t * .8, resp: t * .55, cab: Math.sin(t * 2) * .5, pinta: 1, chora: 0, molhada: 1 - range(q, .4, .9) * .5 }), [1, -.7], '#BCD4FF', 3.5)}</g>`;
  // água na frente dela até a linha d'água, com espuma e a água escorrendo do casco
  const agua = `<path d="M-400 1010 L${shoreX + 120} 1010 Q${shoreX + 180} 1070 ${shoreX + 260} 1130 L${shoreX - 100} 1188 L-400 1188Z" fill="#2F7DBF" opacity=".5"/><path d="M${shoreX - 260} 1124 Q${shoreX - 40} 1090 ${shoreX + 250} 1128" fill="none" stroke="#F4FAFF" stroke-width="12" opacity="${op(.8 * (1 - range(q, .6, 1)))}" stroke-linecap="round"/>`;
  const gotas = Array.from({ length: 26 }, (_, i) => { const tt = (t * 1.6 + i * .21) % 1, gx = tx - 200 + hh(i, 211) * 520, gy = GL - 220 + tt * 230; return `<circle cx="${f1(gx)}" cy="${f1(gy)}" r="${f1(2 + hh(i, 212) * 3)}" fill="#DFF0FF" opacity="${op((1 - tt) * .8 * (1 - range(q, .5, .9)))}"/>`; }).join('');
  s += lay(1, adulta + agua + gotas);
  return s + VIG(.5) + GRAINV(t);
}

/* ===================== 13. igualzinho: cava, bota, cobre e vai; o montinho do quadro 0 (laço) ===================== */
function sIgual(t) {
  const { L, d, k } = loc(t, 'igual'), [jx, jy] = hand2(t), cv = ((t - 30.3) / CICLO) % 1;
  if (L < 1.15) {                                                                                  // 13a: mesmo enquadramento do plano 3
    const e = easeInOut(L / 1.15);
    setCam(lerp(660, 620, e) + jx, lerp(1010, 1020, e) + jy, lerp(1.0, 1.1, e), lerp(-1.2, -.2, e), BASE);
    const [px, py] = pontaPata(cv);
    const mae = `<g transform="translate(${MX},${GY})">${rimGroup(tartLado({ cava: cv, resp: t * .55, cab: Math.sin(t * 2.2) * .6, olho: pulse(L, .5, .6, .05), pinta: 1, chora: 1 }), [1, -.7], '#BCD4FF', 3.5)}</g>`;
    return cenaCorte(t, solo(t) + jato(t, px, py, { n: 70, v: 780, g: 2100, a0: -2.45, abre: .45, seed: 21, rep: CICLO, vida: .85, maxR: 7 }) + mae) + VIG(.55) + GRAINV(t);
  }
  if (L < 2.0) {                                                                                   // 13b: os ovos caem (corte)
    const q = (L - 1.15) / .85, e = easeInOut(q);
    setCam(lerp(335, 330, e) + jx * .5, lerp(1330, 1290, e) + jy * .5, lerp(1.9, 1.3, e), lerp(1, -.4, e), BASE);
    const { base, queda } = pilhaOvos(t, 30.3 + 1.2, .7, CAMARA.x, CAMARA.y + 18, CAMARA.rx - 10, CAMARA.ry - 8, 15, GY - 10);
    const mae = `<g transform="translate(${MX},${GY})">${rimGroup(tartLado({ cava: .05 + .08 * Math.sin(t * 3), resp: t * .55, cab: Math.sin(t * 2.2) * .4, pinta: 1, chora: 1 }), [1, -.7], '#BCD4FF', 3.5)}</g>`;
    return cenaCorte(t, solo(t) + `<ellipse cx="${CAMARA.x}" cy="${CAMARA.y}" rx="320" ry="260" fill="url(#gAmber)" opacity=".5"/>` + base + queda + mae) + VIG(.55) + GRAINV(t);
  }
  if (L < 3.3) {                                                                                   // 13c: cobre o buraco e vai embora (para a esquerda, para o mar)
    const q = (L - 2.0) / 1.3, e = easeInOut(q), enche = range(q, .0, .55), vai = easeInOut(range(q, .5, 1));
    setCam(lerp(470, 330, e) + jx, 1040 + jy, lerp(1.1, 1.0, e), lerp(.5, -.5, e), BASE);
    const mx = lerp(MX, -260, vai), cv2 = (t / CICLO) % 1;
    let sub = solo(t);
    sub += `<path d="M${POCO.x - POCO.w / 2} ${GY} L${POCO.x - POCO.w / 2} ${f1(lerp(POCO.fundo, GY, enche))} L${POCO.x + POCO.w / 2} ${f1(lerp(POCO.fundo, GY, enche))} L${POCO.x + POCO.w / 2} ${GY}Z" fill="#B7A47F"/><rect x="${POCO.x - POCO.w / 2 - 2}" y="${GY - 10}" width="${POCO.w + 4}" height="14" fill="#C4CFE9" opacity="${op(enche)}"/>`;
    const ovosEnterrados = pilhaOvos(t, 0, .01, CAMARA.x, CAMARA.y + 18, CAMARA.rx - 10, CAMARA.ry - 8, 15, GY - 10).base;
    sub += ovosEnterrados;
    const [px, py] = pontaPata(cv2);
    sub += jato(t, px, py, { n: 50, v: 700, g: 2000, a0: -2.45, abre: .5, seed: 27, rep: CICLO, vida: .8, maxR: 6 }).replace(/^/, `<g opacity="${op(1 - range(q, .35, .55))}">`).replace(/$/, '</g>');
    const flip = vai > 0 ? -1 : 1;
    sub += `<g transform="translate(${f1(mx)},${GY}) scale(${flip},1)">${rimGroup(tartLado({ pose: vai > 0 ? 'anda' : 'cava', cava: cv2, passo: t * .8, resp: t * .55, pinta: 1, chora: 0 }), [1, -.7], '#BCD4FF', 3.5)}</g>`;
    return cenaCorte(t, sub) + VIG(.55) + GRAINV(t);
  }
  // 13d: o quadro 0 chegando (laço): a mesma cena do gancho, com o relógio andando de -0,55 até 0; só a areia treme e os primeiros filhotes furam
  const q = (L - 3.3) / (d - 3.3), tf = lerp(-.55, 0, q);
  return sFervePre(tf, q);
}
/* o gancho "antes do quadro 0": mesma câmera e mesmo cenário do plano 1 em L = 0; o herói e a multidão só aparecem quando o relógio chega perto de 0 */
function sFervePre(tf, q) {
  const [jx, jy] = hand2(tf + 30), tre = q * q * 4;
  setCam(540 + jx * (1 - q), 1360 + jy * (1 - q), 1.36, -1.6, BASE);
  const rise = .78 * easeOut(range(tf, -.45, 0));
  const sub = `<g transform="translate(${f1(Math.sin(tf * 130) * 2.2 * tre)},${f1(Math.cos(tf * 150) * 2.2 * tre)})">` + formigueiro(tf, { cx: 540, base: 1540, pt: .5 }) + (rise > .01 ? heroiNaAreia(tf, { rise, wave: tf * .7, turn: Math.sin(tf * 2.1) * .5, look: [0, 0], blink: 0 }) : crista(1532, 6, .08)) + `</g>` + jato(tf, 540, 1380, { n: Math.round(6 + 36 * clamp(q * 1.4)), v: 520, g: 1700, abre: 1.1, seed: 5, rep: .5, vida: .5, maxR: 5 });
  return cenaMonte(tf, sub) + VIG(.6) + GRAINV(tf);
}
const FN = { ferve: sFerve, semMae: sSemMae, cava: sCava, ovos: sOvos, cobre: sCobre, tempo: sTempo, juntos: sJuntos, bussola: sBussola, luz: sLuz, agua: sAgua, milPontos: sMilPontos, anos: sAnos, igual: sIgual };

/* ===================== transições entre os planos: rebobinar e chicotes ===================== */
const CORTES_WHIP = [[6.6, 'v'], [8.3, 'v'], [9.9, 'h'], [11.9, 'v'], [16.1, 'v'], [19.9, 'v'], [21.35, 'h'], [23.3, 'v'], [26.4, 'v'], [28.3, 'h']];
function POS(t, body) {
  if (t > 3.9 && t < 4.3) {                                                      // volta no tempo: cor lavada, borrão horizontal e riscos de fita
    const q = (t - 3.9) / .4, pico = Math.sin(Math.PI * q), id = nid('rw');
    def(`<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="${f1(1 - .75 * pico)}"/><feGaussianBlur stdDeviation="${f1(2 + 26 * pico)} 0"/></filter>`);
    let ov = `<rect width="1080" height="1920" fill="#7FD8FF" opacity="${op(.13 * pico)}"/>`;
    for (let i = 0; i < 16; i++) { const y = ((hh(i, 221 + Math.floor(t * 30)) * 1920) | 0); ov += `<rect x="0" y="${y}" width="1080" height="${f1(3 + hh(i, 222) * 12)}" fill="#fff" opacity="${op(.35 * pico * hh(i, 223))}"/>`; }
    ov += `<rect width="1080" height="1920" fill="#fff" opacity="${op(.22 * range(q, .85, 1))}"/>`;
    return `<g filter="url(#${id})">${body}</g>` + ov;
  }
  for (const [tc, dir] of CORTES_WHIP) {
    const dt = Math.abs(t - tc);
    if (dt < .09) {
      const q = 1 - dt / .09, id = nid('wp'), sd = dir === 'v' ? `0 ${f1(60 * q)}` : `${f1(70 * q)} 0`;
      def(`<filter id="${id}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${sd}"/></filter>`);
      return `<g filter="url(#${id})">${body}</g>`;
    }
  }
  return body;
}
