/* =====================================================================================
   PLANO 5 — SALTO EM CONTRALUZ: a cabra (silhueta com luz de recorte) toma impulso, cruza o vão e pousa com os quatro cascos
   num pináculo pequeno ("pernas fortes e equilíbrio"). Rig de poses por ângulos (cinemática direta) + trajetória parabólica,
   câmera que acompanha, aceleração/desaceleração (rampa de velocidade) e sol enorme atrás do vão.
   Ângulos das pernas: graus a partir da vertical para baixo, positivo = para frente (+x).
   ===================================================================================== */
const SUN_S5 = { x: 300, y: -190, r: 190 };
const BASE_S = [150, -140, 1.0];
const SIL_ROOT = [-60, -300];                                    // ponto do corpo (referencial local) que segue a trajetória
const SLEG = {
  FL: { a: [70, -262], seg: [118, 122, 46], w: [19, 12.5, 10, 7.5], far: false },
  FR: { a: [36, -262], seg: [118, 122, 46], w: [19, 12.5, 10, 7.5], far: true },
  HL: { a: [-212, -292], seg: [128, 130, 46], w: [42, 25, 12.5, 8.5], far: false },
  HR: { a: [-172, -292], seg: [128, 130, 46], w: [42, 25, 12.5, 8.5], far: true },
};
/* poses-chave: t (s do plano), th (graus, + = nariz para baixo), cabeça, e [phi1,phi2,phi3] de cada perna */
const KEYS_S5 = [
  { t: 0.0, th: -3, hd: 0, FL: [12, -34, 18], FR: [4, -38, 14], HL: [40, -70, 16], HR: [34, -74, 20] },
  { t: .45, th: -9, hd: -6, FL: [34, 6, 18], FR: [28, 2, 18], HL: [6, -30, -10], HR: [2, -34, -8] },
  { t: .62, th: -19, hd: -10, FL: [64, 44, 30], FR: [58, 38, 26], HL: [-52, -46, -58], HR: [-58, -52, -60] },
  { t: .95, th: -15, hd: -8, FL: [82, 66, 44], FR: [76, 62, 40], HL: [-46, -78, -72], HR: [-52, -82, -74] },
  { t: 1.3, th: -4, hd: 0, FL: [66, 36, 18], FR: [62, 32, 14], HL: [8, -62, -22], HR: [4, -66, -22] },
  { t: 1.7, th: 8, hd: 8, FL: [78, 58, 44], FR: [72, 54, 40], HL: [34, -34, 6], HR: [30, -38, 8] },
  { t: 1.98, th: 5, hd: 4, FL: [24, 0, 14], FR: [20, -4, 12], HL: [32, -52, 22], HR: [28, -56, 24] },
  { t: 2.25, th: 1, hd: 0, FL: [10, -34, 16], FR: [6, -36, 14], HL: [38, -66, 18], HR: [32, -70, 20] },
  { t: 2.7, th: 0, hd: 0, FL: [2, -3, 4], FR: [0, -4, 4], HL: [14, -26, 8], HR: [10, -28, 8] },
  { t: 3.0, th: 0, hd: 0, FL: [2, -3, 4], FR: [0, -4, 4], HL: [14, -26, 8], HR: [10, -28, 8] },
];
function salPoseAt(tt) {
  let i = 0; while (i < KEYS_S5.length - 2 && tt > KEYS_S5[i + 1].t) i++;
  const A = KEYS_S5[i], B = KEYS_S5[i + 1], u = smooth(range(tt, A.t, B.t));
  const mix3 = (a, b) => a.map((v, k) => lerp(v, b[k], u));
  return { th: lerp(A.th, B.th, u), hd: lerp(A.hd, B.hd, u), FL: mix3(A.FL, B.FL), FR: mix3(A.FR, B.FR), HL: mix3(A.HL, B.HL), HR: mix3(A.HR, B.HR) };
}
const legPts = (L, ph) => { let [x, y] = L.a; const out = [[x, y]]; for (let k = 0; k < 3; k++) { const a = ph[k] * Math.PI / 180; x += Math.sin(a) * L.seg[k]; y += Math.cos(a) * L.seg[k]; out.push([x, y]); } return out; };
/* altura do ponto mais baixo (no referencial do mundo, depois de girar th em volta de SIL_ROOT) relativa à raiz */
function lowestRel(P) {
  let m = -1e9; const th = P.th * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
  for (const id of ['FL', 'FR', 'HL', 'HR']) for (const p of legPts(SLEG[id], P[id])) { const dx = p[0] - SIL_ROOT[0], dy = p[1] - SIL_ROOT[1], y = dx * s + dy * c; if (y > m) m = y; }
  return m + 8;
}
/* trajetória da raiz: chão (pináculo de saída y=0) -> parábola -> chão (pináculo de chegada y=-34). tt = tempo "de pose" */
const T_SAI = .62, T_CHEGA = 1.98, G0 = 0, G1 = -34, X_S = -330, X_E = 305, ALTURA = 230;
function salRoot(tt) {
  const P = salPoseAt(tt), low = lowestRel(P);
  const y0 = G0 - low - SIL_ROOT[1] * 0 + 0, ya = G0 - lowestRel(salPoseAt(T_SAI)) , yb = G1 - lowestRel(salPoseAt(T_CHEGA));
  let x, y;
  const f = range(tt, T_SAI, T_CHEGA);
  if (tt < T_SAI) { x = lerp(X_S, X_S + 38, smooth(range(tt, .3, T_SAI))); y = G0 - low; }
  else if (tt <= T_CHEGA) { x = lerp(X_S + 38, 220, f); y = lerp(ya, yb, f) - 4 * ALTURA * f * (1 - f); }
  else { x = lerp(220, X_E, smooth(range(tt, T_CHEGA, 2.55))); y = G1 - low; }
  // equilíbrio: pequeno balanço amortecido depois do pouso
  const wob = tt > 2.2 ? 2.6 * Math.exp(-(tt - 2.2) / .33) * Math.sin((tt - 2.2) * 13) : 0;
  return { x, y: y + SIL_ROOT[1] * 0, th: P.th + wob, P };
}
/* silhueta: corpo (polígono do tronco+pescoço), cabeça plana, 4 pernas em tubos */
function silCabra(P, root) {
  const B = bodyData(2, 'alerta'), H = headData(2), HP = headPose('alerta');
  const flat = '#1A0E18', rimC = '#FFC878';
  const leg = id => { const L = SLEG[id], pts = legPts(L, P[id]), poly = tubo(pts, L.w.slice(0, 4), L.w.slice(0, 4), 8); return `<path d="${pathPoly(poly)}"/>`; };
  const cab = `<g transform="translate(${f1(HP.ex)},${f1(HP.ey)}) rotate(${f1(HP.a + P.hd)}) scale(${HT.sc})"><path d="${rspl(SK_PTS, true)}"/><path d="${rspl(JW_PTS, true)}"/><path d="${pathPoly([...H.horn.A, ...H.horn.B.slice().reverse()])}"/><path d="${pathPoly([...H.hornFar.A, ...H.hornFar.B.slice().reverse()])}" transform="translate(-14,6)"/><g transform="translate(-150,-62) rotate(-126) scale(.64)"><path d="${rspl(H.ear, true)}"/></g></g>`;
  const rabo = `<path d="${pathPoly(B.tail.poly)}"/>`;
  const shape = leg('FR') + leg('HR') + rabo + `<path d="${pathPoly(B.torso)}"/>` + leg('FL') + leg('HL') + cab;
  return `<g transform="translate(${f1(root.x)},${f1(root.y)}) rotate(${f1(root.th)}) translate(${-SIL_ROOT[0]},${-SIL_ROOT[1]})"><g fill="${rimC}" opacity=".9" transform="translate(2.4,-2.6)">${shape}</g><g fill="${flat}">${shape}</g></g>`;
}
function rochasSalto() {
  const pol = (pts, c) => `<path d="${pathPoly(pts)}" fill="${c}"/>`;
  const near = [[-1500, 0], [-130, -2], [-96, 18], [-128, 64], [-92, 150], [-126, 320], [-98, 620], [-140, 1300], [-1500, 1300]];
  const far = [[116, -26], [142, -34], [300, -38], [500, -34], [528, -22], [506, 60], [556, 210], [514, 410], [558, 720], [496, 1300], [110, 1300], [146, 720], [108, 410], [150, 210], [118, 70]];
  let s = pol(near, '#1E1224') + pol(far, '#1E1224');
  for (const pts of [near.slice(0, 5), far.slice(0, 5)]) s += `<path d="M${pts.map(rpt).join('L')}" stroke="#FFD59A" stroke-width="3.2" fill="none" opacity=".85"/><path d="M${pts.map(rpt).join('L')}" stroke="#FFB070" stroke-width="10" fill="none" opacity=".25" filter="url(#b4)"/>`;
  // capins e arbustos secos em silhueta no topo
  for (let i = 0; i < 40; i++) { const side = i % 2, x = side ? 150 + 360 * hh(i, 5) : -1000 + 880 * hh(i, 6), y0 = side ? -30 : 0, h = 14 + 38 * hh(i, 7); s += `<path d="M${f1(x)} ${y0 + 2}Q${f1(x + 4)} ${f1(y0 - h * .6)} ${f1(x + 6 * (hh(i, 8) - .5) * 4)} ${f1(y0 - h)}" stroke="#1E1224" stroke-width="2" fill="none"/>`; }
  return s;
}
function sSalto(t) {
  const L = t - SH[4][1], d = SH[4][2] - SH[4][1];
  // rampa de velocidade: o voo (0,62 -> 1,98 de "pose") vira a parte central do plano, lento no ponto mais alto
  const Lp = L * 1.0;
  const tt = Lp < .62 ? Lp : Lp < 1.98 + .0 ? (() => { const f = range(Lp, .62, 1.98); return .62 + 1.36 * (f + .4 * Math.sin(f * 6.2832) / 6.2832 * -1 * -1); })() : Lp;
  const R = salRoot(clamp(tt, 0, 3.0));
  const e = easeInOut(range(L, .2, 2.5));
  const cx = lerp(-60, 300, e) + 20 * Math.sin(L * .9), cy = lerp(-250, -330, smooth(range(L, .4, 1.3))) + 70 * smooth(range(L, 1.6, 2.6)) + .2 * (R.y + 300) * 0, z = lerp(1.0, 1.16, smooth(range(L, .3, 2.4))) , r = lerp(-2.4, 2.2, e) + 1.4 * Math.sin(L * 1.5);
  setCam(cx, cy, z, r, BASE_S);
  let s = lay(0, ceuS1(t, SUN_S5));
  for (const sr of serrasS1(t)) s += lay(sr.p, sr.svg);
  s += lay(.2, avesS1(t));
  s += lay(.35, `<rect x="-1400" y="120" width="2800" height="900" fill="url(#gNevoa)" opacity=".6"/>`);
  s += lay(1, rochasSalto() + silCabra(R.P, R));
  s += lay(1.15, poeiraS1(t, 1.4));
  s += lay(1.7, folhasFrente(t, .7), 'fDesf');
  return s + VIG(.7) + GRAINV(t);
}
