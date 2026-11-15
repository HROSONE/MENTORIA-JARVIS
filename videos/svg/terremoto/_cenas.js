/* =====================================================================================
   COMO NASCE UM TERREMOTO 🌍  (Short de 25,4 s, 69 palavras, 9 planos)
   Regra do dono: o primeiro segundo é o ponto principal. O quadro 0 já é a estrada esticada em "S" pela falha travada
   e, em 0,12 s, ela ARREBENTA e o chão desliza 6 m (cota na tela). Depois a história rebobina e desenrola: placas, falha
   travada, séculos de energia, foco, ruptura, ondas. O último plano volta a esticar a estrada até o mesmo "S" do quadro 0
   (loop: o fim é a tensão que vira o estalo do começo). A marca HRYZ Animation está no contador de anos e no sismógrafo.

   DECUPAGEM (diretor)
    1 snap     0 – 2,6     CLOSE de cima (plongée total). Estrada, cerca e riacho em "S" sobre a falha que brilha; em 0,12 s tudo
                           estala e desliza; clarão curto, punch-in e tremor (único tremor forte do começo); cota "6 m".
    2 rebobina 2,6 – 3,3   PULL-OUT rápido com efeito de fita rebobinando; o contador de anos corre de trás para frente até 0.
    3 placas   3,3 – 6,7   GRANDE PLANO GERAL de cima; setas em sentidos opostos, o chão se arrasta; "3 cm/ano"; ano 0 a 25.
    4 trava    6,7 – 10,6  PUSH-IN até o macro da falha (faces ásperas travadas, faíscas de atrito, etiqueta TRAVADA) e pull-out
                           lento revelando o "S" crescendo e a estrada esquentando.
    5 anos     10,6 – 13,1 PLANO MÉDIO com push-in; o contador dispara até o ano 200; barra de tensão no vermelho; mergulho na fenda.
    6 foco     13,1 – 17,0 CORTE ESCURO para o plano da falha visto de frente; tilt para baixo até o foco; pulsa, clarão, e a
                           frente de ruptura cresce até a superfície (EPICENTRO), com setas de escorregão atrás dela.
    7 ruptura  17,0 – 19,0 PLANO GERAL de cima (replay em câmera lenta): a frente corre pela falha e cada linha estala e fica
                           deslocada; poeira; tremor forte com decaimento.
    8 ondas    19,0 – 22,6 GRANDE PLANO GERAL: anéis P (rápido, claro) e S (lento, laranja); o chão ondula, a cidade balança;
                           sismógrafo com a marca registra P pequena e S grande.
    9 ciclo    22,6 – 25,4 WHIP para a estrada refeita; ano 0; o contador sobe, a estrada se curva e a câmera avança até o
                           enquadramento do quadro 0, no mesmo "S" (loop).
   ===================================================================================== */
const SH = [['snap', 0, 2.6], ['rebobina', 2.6, 3.3], ['placas', 3.3, 6.7], ['trava', 6.7, 10.6], ['anos', 10.6, 13.1], ['foco', 13.1, 17.0], ['ruptura', 17.0, 19.0], ['ondas', 19.0, 22.6], ['ciclo', 22.6, TOTAL]];
const FLASH = ['foco', 'ruptura'];
const hand2 = t => [Math.sin(t * 1.3) * 3 + Math.sin(t * 3.1) * 1.5, Math.cos(t * 1.1) * 3];
const shotAt = t => SH.find(s => t >= s[1] && t < s[2]) || SH[SH.length - 1];
const loc = (t, id) => { const s = SH.find(x => x[0] === id); return { L: t - s[1], d: s[2] - s[1], k: (t - s[1]) / (s[2] - s[1]) }; };
const BASE = [0, 0, 1];
const T_SNAP = .12, T_FOCO = 14.35, V_FOCO = 300, T_RUP = 17.0;
const WAVE1 = { t0: T_SNAP, vp: 2200, vs: 1300, Ap: 9, As: 18, dec: 1.2 }, WAVE2 = { t0: T_RUP, vp: 600, vs: 360, Ap: 8, As: 18, dec: 2.4 };
const D_TOWN = Math.hypot(TOWN.x, TOWN.y), TP = T_RUP + D_TOWN / 600, TS = T_RUP + D_TOWN / 360;     // chegada das ondas P e S à cidade
const EV1 = { t0: T_SNAP, yh: 0, v: 5200, k: 1, span: 1500 }, EV2 = { t0: T_RUP, yh: 0, v: 1500, k: 2, span: 1700 };
/* anos de acúmulo (contador diegético): 3 cm/ano x 200 anos = 6 m */
const anoAt = t => t < 3.3 ? 0 : t < 6.7 ? 60 * range(t, 3.3, 6.7) : t < 10.6 ? lerp(60, 110, easeInOut(range(t, 6.7, 10.6))) : t < 13.0 ? lerp(110, 200, easeIn(range(t, 10.6, 13.0))) : 200;
const anoCiclo = t => 200 * easeIn(range(t, 22.8, TOTAL - .05));
/* tremor de câmera: só no impacto (estalo, ruptura, ondas) e um leve tremor de tensão antes do mergulho */
const shk = t => {
  let a = 0;
  if (t >= T_SNAP && t < 2.6) a += 34 * Math.exp(-(t - T_SNAP) / .32);
  if (t >= 12.2 && t < 13.1) a += 5 * range(t, 12.2, 13.1);
  if (t >= T_FOCO && t < T_FOCO + 1.2) a += 10 * Math.exp(-(t - T_FOCO) / .3);
  if (t >= T_RUP && t < 22.6) a += 26 * Math.exp(-(t - T_RUP) / 1.0) + (t > TS - .2 ? 11 * Math.exp(-(t - TS) / 1.6) * Math.min(1, (t - TS + .2) / .3) : 0);
  const f = t * 47;
  return [a * Math.sin(f) * .85, a * Math.cos(f * 1.31)];
};
function camMapa(t, x, y, z, r = 0) { const [sx, sy] = shk(t), [jx, jy] = hand2(t); const c = { x: x + (jx + sx) / z, y: y + (jy + sy) / z, z, r: r + sx * .012 }; setCam(c.x, c.y, c.z, c.r, BASE); return c; }
const hudAno = (ano, k) => painelAno(ano, k) + barraTensao(ano / 200, k, 255, 520);
function mundo(t, cam, tens, evs = [], extra = '') {
  const view = visR(cam);
  return mapa(t, cam) + estrada(t, tens) + cidade() + extra + falha(t, tens) + poeira(evs, view) + aneis(t);
}
const scan = (k, t) => { let s = `<g opacity="${f1(.5 * k)}">`; for (let y = 0; y < 1920; y += 7) s += `<rect y="${y}" width="1080" height="2.4" fill="#000" opacity=".3"/>`; for (let i = 0; i < 9; i++) { const y = 1920 * hh(i + Math.floor(t * 24), 71), h = 4 + 26 * hh(i, 73); s += `<rect x="${f1(-60 + 120 * hh(i + Math.floor(t * 24), 75))}" y="${f1(y)}" width="1200" height="${f1(h)}" fill="${i % 3 ? '#9FE8FF' : '#FF7AB8'}" opacity="${f1(.3 + .3 * hh(i, 77))}"/>`; } return s + `</g>`; };

/* ===================== 1. a estrada arrebenta (o ponto principal, já no quadro 0) ===================== */
function sSnap(t) {
  const { k } = loc(t, 'snap'), pun = t >= T_SNAP ? .1 * Math.exp(-(t - T_SNAP) / .14) : 0, z = lerp(1.32, 1.05, easeOut(k)) + pun;
  const cam = camMapa(t, 0, 0, z, lerp(0, 1, k));
  const tens = t < T_SNAP ? 1 : clamp(1 - (t - T_SNAP) * 1.8);
  ST = { D: DMAX, ev: EV1, r0: 0, t, w: WAVE1 };
  const g = mundo(t, cam, tens, [EV1]) + cota(range(t, .75, 1.0) * (1 - range(t, 2.3, 2.6)));
  const cm = range(t, .75, 1.0) * (1 - range(t, 2.3, 2.6));
  const fl = t >= T_SNAP && t < T_SNAP + .16 ? `<rect width="1080" height="1920" fill="#fff" opacity="${f1(.5 * (1 - (t - T_SNAP) / .16))}"/>` : '';
  return lay(1, g) + etiquetaTexto('6 m', 540 + (-125 - cam.x) * cam.z, 960 + (36 - cam.y) * cam.z, cm, 190, '#FFE066', 62) + fl + VIG(.5) + GRAINV(t);
}

/* ===================== 2. rebobina ===================== */
function sRebobina(t) {
  const { k } = loc(t, 'rebobina'), e = easeInOut(k), z = lerp(1.05, .52, e);
  const cam = camMapa(t, 0, 0, z, lerp(1, 0, e));
  const D = DMAX * (1 - smooth(range(k, .25, 1))), r0 = 1 - smooth(range(k, 0, .45));
  ST = { D, ev: null, r0, t, w: null };
  const ano = lerp(200, 0, e), tens = D / DMAX * (1 - r0);
  const ic = `<g transform="translate(700,300)" opacity="${f1(Math.floor(t * 9) % 2 ? .95 : .45)}"><polygon points="0,0 44,-30 44,30" fill="#fff"/><polygon points="46,0 90,-30 90,30" fill="#fff"/></g>`;
  return lay(1, mundo(t, cam, tens) + setas(range(k, .6, 1) * .6)) + scan(1, t) + ic + hudAno(ano, range(k, 0, .25)) + VIG(.5) + GRAINV(t);
}

/* ===================== 3. duas placas se arrastam ===================== */
function sPlacas(t) {
  const { k } = loc(t, 'placas'), z = lerp(.5, .58, easeInOut(k));
  const cam = camMapa(t, 0, lerp(160, -60, easeInOut(k)), z, lerp(0, -1.5, k));
  const ano = anoAt(t); ST = { D: DMAX * ano / 200, ev: null, r0: 0, t, w: null };
  const mov = (t * .5) % 1;
  return lay(1, mundo(t, cam, ano / 200 * .6) + setas(1, mov)) + hudAno(ano, 1) + etiquetaTexto('3 cm/ano', 735, 1190, range(t, 4.2, 4.6) * (1 - range(t, 6.2, 6.6)), 270, '#B6FF5A', 36) + VIG(.45) + GRAINV(t);
}

/* ===================== 4. a falha trava (macro) e a rocha estica ===================== */
function sTrava(t) {
  const { k, L } = loc(t, 'trava'), zin = easeInOut(range(L, 0, 1.5)), zout = easeInOut(range(L, 2.0, 3.9));
  const z = L < 2.0 ? lerp(.9, 3.0, zin) : lerp(3.0, 1.15, zout);
  const cam = camMapa(t, 0, lerp(30, 0, k), z, lerp(0, 2, k));
  const ano = anoAt(t); ST = { D: DMAX * ano / 200, ev: null, r0: 0, t, w: null };
  const tens = ano / 200 * .9 + .12;
  let sp = '';
  const j = Math.floor(t * 14);
  for (let i = 0; i < 16; i++) { const y = -130 + 260 * hh(i + j, 81), x = (hh(i + j, 83) < .5 ? -1 : 1) * (6 + 12 * hh(i + j, 85)); sp += `<circle cx="${f1(x)}" cy="${f1(y + DISP(x, y)[1])}" r="${f1(2.5 + 4 * hh(i + j, 87))}" fill="#FFD27A" opacity="${f1(.5 + .5 * hh(i + j, 89))}"/>`; }
  const g = mundo(t, cam, tens) + `<g opacity="${f1(range(L, .6, 1.3) * (1 - range(L, 2.4, 3.2)))}">${sp}</g>`;
  const tr = range(L, 1.0, 1.35) * (1 - range(L, 2.5, 3.0));
  return lay(1, g + setas(.5, (t * .5) % 1)) + hudAno(ano, 1) + etiquetaTexto('TRAVADA', 540, 560, tr, 330, '#FF9A5A', 38) + VIG(.5) + GRAINV(t);
}

/* ===================== 5. séculos de energia: o contador dispara ===================== */
function sAnos(t) {
  const { L, k } = loc(t, 'anos'), dive = easeIn(range(t, 12.5, 13.1)), z = lerp(1.0, 1.4, easeInOut(range(L, 0, 1.9))) + 4.8 * dive;
  const cam = camMapa(t, 0, 0, z, lerp(2, 0, k) + 0);
  const ano = anoAt(t); ST = { D: DMAX * ano / 200, ev: null, r0: 0, t, w: null };
  const tens = .12 + ano / 200 * .88;
  return lay(1, mundo(t, cam, tens) + setas(.5, (t * .8) % 1)) + hudAno(ano, 1 - range(t, 12.7, 13.0)) + `<rect width="1080" height="1920" fill="#06080F" opacity="${f1(range(t, 12.75, 13.1))}"/>` + VIG(.55) + GRAINV(t);
}

/* ===================== 6. o foco: a rocha cede lá no fundo (plano da falha) ===================== */
function sFoco(t) {
  const { L, k } = loc(t, 'foco'), tilt = easeInOut(range(L, .1, 1.3)), zz = lerp(1.15, .86, easeInOut(range(L, 1.2, 3.9)));
  const [sx, sy] = shk(t), [jx, jy] = hand2(t);
  setCam(540 + jx + sx, lerp(640, 1060, tilt) + jy + sy, zz, 0, [540, 960, 1]);
  const a = t - T_FOCO, rr = a > 0 ? V_FOCO * a : 0, foco = a > 0 ? Math.exp(-a / .55) : range(t, T_FOCO - .3, T_FOCO) * .6;
  const surf = rr >= 745 ? clamp(1 - (t - (T_FOCO + 745 / V_FOCO)) / .25) : 0;
  const g = plano(t, { stress: 1, rr, surf, pulse: a < 0 ? 1 : 0, foco });
  const lab = etiquetaTexto('FOCO', PL.fx + 190, PL.fy + 10, range(a, .1, .35) * (1 - range(a, 1.6, 2.0)), 190, '#FFE9A0', 40) + etiquetaTexto('EPICENTRO', PL.fx + 10, PL.y0 - 90, range(a, 2.1, 2.4), 330, '#FFE9A0', 36);
  const lin = `<path d="M${PL.fx} ${PL.fy - 24} V${PL.y0 - 28}" stroke="#FFE9A0" stroke-width="4" stroke-dasharray="10 9" opacity="${f1(range(a, 2.0, 2.3) * .8)}"/><circle cx="${PL.fx}" cy="${PL.y0 - 22}" r="11" fill="#FFE9A0" opacity="${f1(range(a, 2.0, 2.3))}"/>`;
  return lay(1, g + lin + lab) + `<rect width="1080" height="1920" fill="#06080F" opacity="${f1(1 - range(L, 0, .25))}"/>` + VIG(.5) + GRAINV(t);
}

/* ===================== 7. a ruptura corre pela falha (replay em câmera lenta) ===================== */
function sRuptura(t) {
  const { L, k } = loc(t, 'ruptura'), z = lerp(.62, .5, easeInOut(k));
  const cam = camMapa(t, 0, lerp(0, -90, easeInOut(k)), z, lerp(0, -2, k));
  ST = { D: DMAX, ev: EV2, r0: 0, t, w: WAVE2 };
  return lay(1, mundo(t, cam, 0, [EV2])) + VIG(.5) + GRAINV(t);
}

/* ===================== 8. as ondas P e S sacodem tudo ===================== */
function sOndas(t) {
  const { k } = loc(t, 'ondas'), z = lerp(.46, .6, easeInOut(k));
  const cam = camMapa(t, lerp(140, 480, easeInOut(k)), lerp(-30, -50, k), z, lerp(-2, 0.8, k));
  ST = { D: DMAX, ev: null, r0: 1, t, w: WAVE2 };
  return lay(1, mundo(t, cam, 0, [EV2])) + sismografo(t, range(t, 19.0, 19.25), TP, TS) + VIG(.5) + GRAINV(t);
}

/* ===================== 9. o ciclo recomeça: a estrada se curva até o "S" do quadro 0 ===================== */
function sCiclo(t) {
  const { L, k } = loc(t, 'ciclo'), e = easeInOut(range(L, 0, TOTAL - 22.6)), z = lerp(.64, 1.32, e);
  const cam = camMapa(t, 0, lerp(-80, 0, e), z, lerp(-1.5, 0, e));
  const ano = anoCiclo(t); ST = { D: DMAX * ano / 200, ev: null, r0: 0, t, w: null };
  const tens = .1 + ano / 200 * .9, wh = 1 - range(L, 0, .22);
  const body = lay(1, mundo(t, cam, tens) + setas(.5 * (1 - e), (t * .8) % 1));
  const whip = wh > 0 ? `<g transform="translate(${f1(-120 * wh)},0)">${blurH(34 * wh, body)}</g>` : body;
  return whip + hudAno(ano, 1 - range(L, 1.9, 2.5)) + VIG(.5) + GRAINV(t);
}
const FN = { snap: sSnap, rebobina: sRebobina, placas: sPlacas, trava: sTrava, anos: sAnos, foco: sFoco, ruptura: sRuptura, ondas: sOndas, ciclo: sCiclo };
