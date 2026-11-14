/* =====================================================================================
   POR QUE AS CABRAS ESCALAM TUDO? 🐐  (Short ~27,8 s, 8 planos)
   DECUPAGEM no roteiro_cabra.md. Este arquivo: câmeras, cenas e linha do tempo.
   ===================================================================================== */
const SH = [['abre', 0, 3.2], ['casco', 3.2, 7.0], ['sola', 7.0, 10.35], ['micro', 10.35, 13.55], ['salto', 13.55, 16.45], ['alto', 16.45, 20.35], ['arganeira', 20.35, 24.85], ['final', 24.85, TOTAL]];
const FLASH = [];
const shotAt = t => SH.find(s => t >= s[1] && t < s[2]) || SH[SH.length - 1];
const loc = (t, id) => { const s = SH.find(x => x[0] === id); return { L: t - s[1], d: s[2] - s[1], k: (t - s[1]) / (s[2] - s[1]) }; };

/* mastigar: ~1,7 mordidas por segundo, jaw anima em ciclo; orelha e rabo com tiques isolados */
const CH_F = 1.7;
const mastAt = t => .5 + .5 * Math.sin(t * CH_F * 6.2832);
const orelhaAt = t => { let a = 0; for (const t0 of [.85, 2.35, 5.1, 26.2]) { const d = (t - t0) / .09; a += -16 * Math.exp(-d * d) + 5 * Math.exp(-(((t - t0 - .22) / .12) ** 2)); } return a; };
const raboAt = t => { let a = 0; for (const t0 of [1.7, 3.0]) a += 14 * Math.exp(-(((t - t0) / .12) ** 2)) * Math.sin((t - t0) * 40); return a; };
/* pedrinha que cai da borda (sincroniza com o som): trechos de queda livre com quiques */
const PEDRA = (() => {
  const g = 1500, t0 = 2.05, seg = [[-8, 148, 0], [40, 168, 0], [330, 205, -90], [660, 250, -60]];  // [y, x, vy depois do quique]
  const ev = [{ t: t0, y: -8, x: 148, vy: 0 }]; let tt = t0;
  for (let i = 1; i < seg.length; i++) {
    const a = ev[ev.length - 1], dy = seg[i][0] - a.y, tau = (-a.vy + Math.sqrt(a.vy * a.vy + 2 * g * dy)) / g; tt += tau;
    ev.push({ t: tt, y: seg[i][0], x: seg[i][1], vy: seg[i][2] });
  }
  return { g, ev, quiques: ev.slice(1).map(e => e.t) };
})();
function pedraAt(t) {
  const ev = PEDRA.ev; if (t < ev[0].t) return [148, -8, 0];
  for (let i = 0; i < ev.length - 1; i++) if (t < ev[i + 1].t) { const a = ev[i], b = ev[i + 1], u = t - a.t; return [lerp(a.x, b.x, (t - a.t) / (b.t - a.t)), a.y + a.vy * u + .5 * PEDRA.g * u * u, u * 8]; }
  const a = ev[ev.length - 1], u = t - a.t; return [a.x + 20 * u, a.y + a.vy * u + .5 * PEDRA.g * u * u, u * 8];
}

/* ===================== 1. abre: close da cabra ao pôr do sol -> afasta rápido e revela o precipício ===================== */
const CAM_ECU = (() => { const p = ptCab(78, -24, 'comer', 0); return { x: p[0], y: p[1] }; })();
function camAbre(t) {
  const e = easeInOut(range(t, .2, 1.75)), e2 = easeInOut(range(t, .3, 1.95)), lz = Math.log;
  let z = Math.exp(lerp(lz(6.2), lz(1.06), e)) * (1 + .02 * range(t, 0, .2));
  const cx = lerp(CAM_ECU.x, 70, e2), cy = lerp(CAM_ECU.y, 150, e2) + 60 * smooth(range(t, 1.8, 3.2));
  if (t > 1.75) z *= 1 - .03 * smooth(range(t, 1.75, 3.2));
  return { x: cx, y: cy, z, r: lerp(2.4, -.6, e2) + 1.2 * Math.sin(t * .6) * smooth(range(t, 1.8, 3.2)) };
}
function goatAbre(t) { return cabraCorpo({ t, mast: mastAt(t) * .55, orelha: orelhaAt(t), rabo: raboAt(t), lod: 0, pose: 'comer', bob: 1.5 * Math.sin(t * CH_F * 6.2832 + 1) }); }
function cenarioAbre(t, z) {
  let s = '';
  s += lay(0, ceuS1(t));
  for (const sr of serrasS1(t)) s += lay(sr.p, sr.svg);
  s += lay(.22, avesS1(t));
  s += lay(1, penhascoS1(t) + lajeS1(t));
  return s;
}
function folhasBoca(t) {
  const bobE = 1.5 * Math.sin(t * CH_F * 6.2832 + 1), M = ptCab(282, 116, 'comer', bobE), m = mastAt(t), sh = 1.6 * Math.sin(t * CH_F * 6.2832 + 2.2);
  let s = `<g transform="translate(${f1(M[0] + sh * .5)},${f1(M[1] + 2 + sh * .4)})">`;
  [[0, 0.9, '#8FB040'], [-.55, .8, '#C9D060'], [.5, 1.0, '#6C9034'], [1.0, .7, '#8FB040']].forEach(([a, k, col], i) => {
    const L = 30 * k, an = 1.1 + a + .12 * Math.sin(t * 5 + i);
    s += `<path d="M0 0q${f1(Math.cos(an - .5) * L * .6)} ${f1(Math.sin(an - .5) * L * .6)} ${f1(Math.cos(an) * L)} ${f1(Math.sin(an) * L)}q${f1(Math.cos(an + .5) * -L * .1)} ${f1(Math.sin(an + .5) * -L * .1)} ${f1(-Math.cos(an - .5) * L * .25)} ${f1(-Math.sin(an - .5) * L * .25)}Z" fill="${col}" stroke="#2B3A18" stroke-width=".8"/>`;
  });
  return s + `</g>`;
}
function sAbreGen(ct, at, comPedra) {
  const c = camAbre(ct); setCam(c.x, c.y, c.z, c.r, BASE_W);
  let s = cenarioAbre(at, c.z);
  const p = pedraAt(at), kf = smooth(range(ct, .75, 1.15)) * (1 - smooth(range(ct, 1.7, 2.4)));
  s += lay(1, arbustoS1(at) + goatAbre(at) + folhasBoca(at) + (comPedra && at >= PEDRA.ev[0].t ? `<g transform="translate(${f1(p[0])},${f1(p[1])}) rotate(${f1(p[2] * 60)})"><path d="M-9 3Q-10 -6 -2 -8Q8 -9 10 0Q9 6 2 7Q-6 7 -9 3Z" fill="#8A5648"/><path d="M-5 -4Q0 -8 6 -5" stroke="#FFD0A0" stroke-width="1.6" fill="none"/></g>` : ''));
  s += lay(1.15, poeiraS1(at));
  if (kf > .01) s += lay(1.35, folhasFrente(at, kf), 'fDesf');
  return s + VIG(.65) + GRAINV(at);
}
const sAbre = t => sAbreGen(t, t, true);
/* ===================== 8. final: a câmera volta para o close do quadro 0 (loop). Tempo de câmera = o de S1 de trás pra frente;
   tempo de animação = t - TOTAL (no último quadro vale 0, igual ao quadro 0 do vídeo) ===================== */
function sFinal(t) {
  const L = SH[7][1], u = clamp((TOTAL - t) / (TOTAL - L));
  return sAbreGen(u * 3.2, t - TOTAL, false);
}

/* ===================== 2. casco: de frente, pousa numa quina de rocha; os dois dedos se abrem e agarram ===================== */
const T_POUSO = 1.12, T_ABRE0 = 1.15, T_ABRE1 = 2.2, T_APERTA0 = 2.5, T_APERTA1 = 3.0;
const spreadAt = L => 3 + 25 * easeInOut(range(L, T_ABRE0, T_ABRE1)) - 7 * smooth(range(L, T_APERTA0, T_APERTA1));
function camCasco(L) {
  const e = easeInOut(range(L, 0, 3.8)), tilt = smooth(range(L, .15, 1.5));
  let sh = 0, shy = 0;
  for (const [t0, a] of [[T_POUSO, 9], [T_ABRE1 - .05, 3], [T_APERTA0 + .1, 4.5]]) if (L >= t0) { const d = L - t0; sh += a * Math.exp(-d / .18) * Math.sin(d * 55); shy += a * .8 * Math.exp(-d / .2) * Math.cos(d * 47); }
  return { x: 540 + 26 * Math.sin(L * .8) + sh, y: lerp(560, 1100, tilt) + shy - 20 * e, z: lerp(1.05, 1.7, e), r: lerp(-2, 1.4, e) + .6 * Math.sin(L * .7) };
}
function sCasco(t) {
  const L = t - SH[1][1], c = camCasco(L); setCam(c.x, c.y, c.z, c.r, BASE_H);
  const sp = spreadAt(L), lift = 460 * Math.pow(1 - easeOut(range(L, .05, T_POUSO)), 1.2);
  const y0 = alturaApoio(sp) - lift;
  const glow = smooth(range(L, T_APERTA0, T_APERTA0 + .35)) * (.6 + .4 * Math.sin(L * 9));
  let s = lay(.08, fundoMacro(t));
  s += lay(.5, pernaFundo());
  s += lay(1, rochaMacro(t));
  const sombra = smooth(range(L, .5, T_POUSO)) * .55;
  s += lay(1, `<g opacity="${f1(sombra)}" filter="url(#b12)"><ellipse cx="440" cy="${f1(rockY(440) + 6)}" rx="86" ry="14" fill="#10081A"/><ellipse cx="640" cy="${f1(rockY(640) + 6)}" rx="86" ry="14" fill="#10081A"/></g>`);
  s += lay(1, `<g transform="translate(540,${f1(y0)})">${cascoFrente(sp, { glow })}</g>`);
  s += lay(1, poeiraMacro(L, T_POUSO, [440, 640, 380, 700], 1.5) + poeiraMacro(L, T_APERTA0, [450, 630], 1.2));
  s += lay(1.5, gramaFrente(t), 'fDesf');
  s += lay(1.2, poeiraS1(t, 2.6));
  return s + VIG(.7) + GRAINV(t);
}


/* ===================== 3. sola: corte lateral - borda DURA, sola MACIA que se molda à rocha ===================== */
function rotulo(txt, x, y, cor, k, lx, ly) {
  if (k < .01) return '';
  const w = txt.length * 40;
  return `<g opacity="${f1(k)}"><path d="M${f1(lx)} ${f1(ly)}L${f1(x + (lx > x ? w * .5 : -w * .5))} ${f1(y + 16)}" stroke="${cor}" stroke-width="3" opacity=".9"/><circle cx="${f1(lx)}" cy="${f1(ly)}" r="8" fill="${cor}"/><rect x="${f1(x - w * .5 - 24)}" y="${f1(y - 66)}" width="${f1(w + 48)}" height="96" rx="22" fill="#120A1C" opacity=".72" stroke="${cor}" stroke-width="3"/><text x="${f1(x)}" y="${f1(y)}" text-anchor="middle" font-size="68" letter-spacing="6" fill="${cor}" filter="url(#b4)" opacity=".6">${txt}</text><text x="${f1(x)}" y="${f1(y)}" text-anchor="middle" font-size="68" letter-spacing="6" fill="#FFF6E6">${txt}</text></g>`;
}
function sSola(t) {
  const L = t - SH[2][1], d = SH[2][2] - SH[2][1];
  const e = easeInOut(range(L, 0, d));
  setCam(lerp(580, 600, e) + 4 * Math.sin(L * 1.3), lerp(940, 1060, e), lerp(1.0, 1.25, e), lerp(-1.2, .8, e), [540, 960, 1]);
  const p = smooth(range(L, 1.4, 3.1)), hiD = smooth(range(L, .35, .7)) * (1 - smooth(range(L, 1.5, 1.9))), hiM = smooth(range(L, 1.5, 1.85));
  const sink = 14 * p;
  let s = lay(.05, `<rect x="-800" y="-600" width="2700" height="3200" fill="url(#gFundoCorte)"/>`);
  // varredura (scanner) revela o corte nos primeiros 0,35 s
  const sc = range(L, 0, .38);
  s += lay(1, `<g transform="translate(560,${f1(1180 + sink)})"><clipPath id="clSc"><rect x="-700" y="-900" width="${f1(1400 * easeOut(sc))}" height="1800"/></clipPath><g clip-path="url(#clSc)">${corteCasco(t, p, { hiDura: hiD, hiMacia: hiM })}</g></g>`);
  if (sc < 1) s += lay(1, `<rect x="${f1(560 - 700 + 1400 * easeOut(sc) - 6)}" y="-200" width="12" height="2400" fill="#FFE9B8" opacity="${f1(.9 * (1 - sc))}" filter="url(#b4)"/>`);
  // rótulos (diegéticos, curtos)
  s += lay(1, rotulo('DURA', 770, 640, '#FFB36B', smooth(range(L, .4, .7)) * (1 - smooth(range(L, 1.6, 1.9)) * .6), 850, 1000));
  s += lay(1, rotulo('MACIA', 330, 1560, '#FF9AA8', smooth(range(L, 1.55, 1.9)), 460, 1180 + sink - 30));
  s += lay(1.1, poeiraS1(t, 2));
  return s + VIG(.7) + GRAINV(t);
}


/* ===================== 4. micro: mergulho no microscópio - tubos de queratina (longitudinal -> transversal -> um tubo) ===================== */
function sMicro(t) {
  const L = t - SH[3][1], d = SH[3][2] - SH[3][1];
  const u = easeInOut(range(L, .2, d - .05)), z = Math.exp(lerp(Math.log(.42), Math.log(15), u));
  const abre = easeOut(range(L, 0, .4)), rot = lerp(-10, 6, u);
  const cx = lerp(0, 4, u), cy = lerp(0, 3, u);
  const kB = smooth(range(z, .85, 1.7)), kA = 1 - kB;
  let s = `<rect width="1080" height="1920" fill="#02070A"/>`;
  setCam(cx, cy, z, rot, [0, 0, z]);
  const girB = lerp(14, 0, kB);
  s += `<g clip-path="url(#clMicro)" filter="${kB > .05 && kB < .95 ? 'url(#b4)' : 'none'}">`;
  def(`<clipPath id="clMicro"><circle cx="540" cy="960" r="${f1(500 * abre)}"/></clipPath>`);
  if (kA > .01) s += `<g opacity="${f1(kA)}">${lay(1, `<g transform="rotate(-62)">${microA(z)}</g>`)}</g>`;
  if (kB > .01) s += `<g opacity="${f1(kB)}">${lay(1, `<g transform="rotate(${f1(girB)})">${microB(z, smooth(range(z, 4, 8)))}</g>`)}</g>`;
  s += `</g>`;
  s += hudMicro(t, z, abre, rot);
  s += rotulo('TUBOS', 800, 330, '#8FFFF4', smooth(range(L, 1.15, 1.5)) * (1 - smooth(range(L, 2.0, 2.3))), 700, 800).replace(/#FFF6E6/g, '#E8FFFC').replace(/#120A1C/g, '#031A22');
  s += rotulo('QUERATINA', 700, 330, '#8FFFF4', smooth(range(L, 2.45, 2.8)), 620, 700).replace(/#FFF6E6/g, '#E8FFFC').replace(/#120A1C/g, '#031A22');
  return s + VIG(.5) + GRAINV(t) + GRAINV(t + .5);
}


/* ===================== 6. alto: o lobo no pé do paredão (não sobe) -> sobe a câmera: cabras e bodes nos patamares -> close do sal ===================== */
const T6_CUT = 2.65, SUN_S6 = { x: 520, y: -700, r: 130 };
function camAlto(L) {
  const e = easeInOut(range(L, .85, 2.5));
  return { x: 300 + 24 * Math.sin(L * .7), y: lerp(40, -985, e) - 10 * range(L, 0, .8), z: lerp(.92, 1.02, e), r: lerp(-1.5, 1.2, e) };
}
function poeiraAlto(L, t0, x, y) {
  const u = (L - t0) / 1.3; if (u < 0 || u > 1) return '';
  let s = '';
  for (let i = 0; i < 7; i++) { const h = hh(i, 41), dx = (h - .5) * 220 * u, dy = -70 * u * (.4 + h), r = 14 + 40 * u * (.5 + h); s += `<ellipse cx="${f1(x + dx)}" cy="${f1(y + dy)}" rx="${f1(r * 1.3)}" ry="${f1(r * .8)}" fill="${i % 2 ? '#F0C9A6' : '#C89A86'}" opacity="${f1(.42 * (1 - u) * (1 - u))}" filter="url(#b12)"/>`; }
  return s;
}
function sAlto(t) {
  const L = t - SH[5][1];
  if (L >= T6_CUT) return sSal(t, L);
  const c = camAlto(L); setCam(c.x, c.y, c.z, c.r, BASE_A);
  const u = range(L, .5, 1.12), lu = Math.sin(Math.PI * u) * (u > 0 && u < 1 ? 1 : 0);
  let s = lay(0, ceuS1(t, SUN_S6));
  s += lay(1, paredao(t, c.y) + lajes());
  const ch = mastAt(t) * .4;
  s += lay(1, `<g transform="translate(470,-430) scale(.4)">${cabraCorpo({ t, mast: ch, orelha: orelhaAt(t + 1.1), lod: 2, pose: 'comer', bob: 5 })}</g>`);
  s += lay(1, `<g transform="translate(130,-770) scale(.4)">${cabraCorpo({ t, mast: 0, orelha: orelhaAt(t + .3), lod: 2, pose: 'alerta', tag: false })}</g><g transform="translate(30,-770) scale(.27)">${cabraCorpo({ t, mast: ch, lod: 2, pose: 'alerta', tag: false })}</g>`);
  s += lay(1, `<g transform="translate(520,-1070) scale(.42)">${cabraCorpo({ t, mast: ch, lod: 2, pose: 'comer', bob: 3 })}</g>`);
  s += lay(1, `<g transform="translate(618,-1332) scale(.66)">${cabraCorpo({ t, mast: 0, orelha: orelhaAt(t + 2.2), lod: 1, pose: 'alerta', bode: true, tag: false })}</g>`);
  s += lay(1, pePredregulho());
  s += lay(1, `<g transform="translate(${f1(150 + 38 * lu)},${f1(34 - 150 * lu)}) rotate(${f1(-15 * lu)} -80 -150)">${lobo(t, lu)}</g>`);
  s += lay(1, poeiraAlto(L, 1.1, 190, 30) + poeiraAlto(L, .52, 100, 30));
  s += lay(1.15, poeiraS1(t, 1.6));
  s += lay(1.6, folhasFrente(t, .45 * (1 - smooth(range(L, 1.2, 1.8)))), 'fDesf');
  return s + VIG(.7) + GRAINV(t);
}
/* close do sal (macro-espaço): a cabra de pé à esquerda lambe a crosta branca na parede à direita */
function sSal(t, L) {
  const Ls = L - T6_CUT, e = easeInOut(range(Ls, 0, 1.7));
  const m = 2.3, P = ptCab(292, 96, 'comer', 0), gx = 806 - m * P[0], gy = 800 - m * P[1];
  setCam(690 + 14 * Math.sin(Ls * 1.4), lerp(840, 800, e), lerp(1.4, 1.72, e), lerp(1.2, -.6, e), BASE_H);
  let s = lay(.08, fundoMacro(t));
  s += lay(1, paredeSal(t));
  s += lay(1, `<path d="${pathPoly([[-1400, gy], [1800, gy - 8], [1800, 3200], [-1400, 3200]])}" fill="#2E1C2C"/><path d="M-1400 ${f1(gy)}L1800 ${f1(gy - 8)}" stroke="#FFC888" stroke-width="3" opacity=".7"/>`);
  const lick = .5 + .5 * Math.sin(t * 6.2832 * 1.5);
  s += lay(1, `<g transform="translate(${f1(gx + 4 * lick)},${f1(gy)}) scale(${m})">${cabraCorpo({ t, mast: .5 + .5 * Math.sin(t * 6.2832 * 1.5 + 1), orelha: orelhaAt(t + .7), lod: 0, pose: 'comer', bob: -1.2 * lick, boca: .5, lingExt: .35 + .65 * lick })}</g>`);
  s += lay(1.2, poeiraS1(t, 3));
  return s + VIG(.7) + GRAINV(t);
}


/* ===================== 7. arganeira: plano geral da árvore com cabras nos galhos -> sobe e entra na copa até a cabra que come os frutos ===================== */
const HERO7 = { x: 592, y: -782, rot: -11, s: .58 };
function camArgan(L, d) {
  const e = easeInOut(range(L, .8, 3.3)), e2 = smooth(range(L, 3.3, d));
  return { x: lerp(520, 690, e), y: lerp(-400, -840, e) + 6 * Math.sin(L * .8), z: Math.exp(lerp(Math.log(.86), Math.log(1.95), e)) * (1 + .1 * e2), r: lerp(-1.6, 1.0, e) };
}
function sArgan(t) {
  const L = t - SH[6][1], d = SH[6][2] - SH[6][1], c = camArgan(L, d), D = arganData();
  setCam(c.x, c.y, c.z, c.r, BASE_T);
  let s = lay(0, ceuS1(t, SUN_S7));
  for (const sr of colinasS7()) s += lay(sr.p, sr.svg);
  s += lay(.6, `<rect x="-1400" y="-120" width="3400" height="500" fill="url(#gNevoa)" opacity=".45"/>`);
  // chão + árvore (folhagem atrás, galhos, frutos, cabras, folhagem na frente)
  const frente = [0, 1, 2, 8, 9, 10];
  s += lay(1, soloS7(t) + CLUMPS.map((cl, i) => D.fol[i]).join('') + troncoSVG(t) + frutosSVG(t));
  const m = mastAt(t * 1.07 + .3) * .5, ch = mastAt(t) * .5;
  s += lay(1, `<g transform="translate(330,-404) scale(-.5,.5)">${cabraCorpo({ t, mast: ch, orelha: orelhaAt(t + 3), lod: 1, pose: 'comer', bob: 3, tag: false })}</g>`);
  s += lay(1, `<g transform="translate(676,-474) scale(.5,.5) rotate(-4)">${cabraCorpo({ t, mast: m, orelha: orelhaAt(t + 1.7), lod: 1, pose: 'alerta', tag: false })}</g>`);
  const hero = `<g transform="translate(${HERO7.x},${HERO7.y}) rotate(${HERO7.rot}) scale(${HERO7.s})">${cabraCorpo({ t, mast: mastAt(t) * .7, orelha: orelhaAt(t + .4), lod: 0, pose: 'comer', bob: 2 * Math.sin(t * CH_F * 6.2832), boca: .15 })}</g>`;
  s += lay(1, hero);
  // frutos na boca da cabra (cacho preso a um raminho que vem da direita)
  const P = ptCab(290, 100, 'comer', 0), a = HERO7.rot * Math.PI / 180, mx = HERO7.x + HERO7.s * (P[0] * Math.cos(a) - P[1] * Math.sin(a)), my = HERO7.y + HERO7.s * (P[0] * Math.sin(a) + P[1] * Math.cos(a)), sw = Math.sin(t * CH_F * 6.2832 + 2) * 2;
  s += lay(1, `<g transform="translate(${f1(mx + 6 + sw)},${f1(my + 10)})"><path d="M60 -50Q30 -20 0 -4" stroke="#3A2418" stroke-width="5" fill="none" stroke-linecap="round"/>${[[0, 0, 15], [24, -14, 12], [44, 4, 13]].map(([x, y, r], i) => `<g transform="translate(${x},${f1(y + (i === 0 ? 2 * Math.sin(t * 8) : 0))})"><ellipse rx="${r}" ry="${r * 1.1}" fill="#8FA838"/><ellipse cx="${-r * .1}" cy="${-r * .1}" rx="${r * .86}" ry="${r * .94}" fill="#D3E477"/><ellipse cx="${-r * .38}" cy="${-r * .45}" rx="${r * .22}" ry="${r * .3}" fill="#fff" opacity=".75"/></g>`).join('')}</g>`);
  s += lay(1, frente.map(i => D.fol[i]).join(''));
  s += lay(1.15, poeiraS1(t, 1.3));
  s += lay(1.7, folhasFrente(t, .55 * (1 - smooth(range(L, 2.2, 3.0)))), 'fDesf');
  return s + VIG(.65) + GRAINV(t);
}

const FN = {
  abre: sAbre,
  casco: sCasco, sola: sSola, micro: sMicro, salto: sSalto, alto: sAlto, arganeira: sArgan, final: sFinal,
};
