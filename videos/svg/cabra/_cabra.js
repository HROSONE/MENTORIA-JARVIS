/* =====================================================================================
   A CABRA — cabeça de perfil (olhando para a direita), pelo fio a fio.
   Coordenadas locais: origem no centro do olho, x para o focinho, y para baixo. Comprimento do focinho ao cogote ~ 540.
   Peças: crânio (pelo tan + faixa escura do focinho + anel creme do olho), mandíbula separada (gira ao mastigar), interior da boca
   com língua, orelha (com brinco amarelo HRYZ), chifre com anéis de crescimento, olho âmbar de pupila horizontal, bigodes,
   cílios e tufos de pelo que balançam contra o pôr do sol. Tudo pré-gerado uma vez (semente fixa); por quadro só se aplicam
   transformações (mastigar, orelha, vento).
   ===================================================================================== */
const SOL = [.56, -.83];                       // direção do sol (no referencial da cabeça): em cima, à direita, na frente do focinho
const P_TAN = paleta(['#43302A', '#6E5238', '#A27E52', '#D4AE74', '#FFDD9A'], 8);
const P_CRE = paleta(['#6A5042', '#A88862', '#E0C494', '#FFF0C8'], 7);
const P_DRK = paleta(['#0B0608', '#1E120C', '#3A2416', '#6A4A2C'], 7);
const RIM = '#FFD98A';
const P_STR = paleta(['#1E120C', '#3A2416', '#6A4A2C', '#8B6038'], 7);
const HX = x => x > 60 ? 60 + (x - 60) * .84 : x;
const hp = pts => pts.map(p => [HX(p[0]), p[1]]);
const SK_PTS = hp([[-170, -52], [-150, -108], [-96, -138], [-30, -140], [34, -124], [104, -98], [182, -62], [250, -30], [304, -6], [340, 18], [354, 62], [350, 106], [320, 130], [246, 122], [172, 116], [114, 122], [84, 150], [30, 182], [-40, 196], [-110, 178], [-170, 120], [-185, 30]]);
const JW_PTS = hp([[306, 136], [332, 154], [326, 186], [276, 204], [196, 204], [124, 212], [64, 222], [-8, 212], [-30, 150], [90, 124], [204, 124]]);
const DK_PTS = hp([[-130, -138], [-50, -142], [25, -126], [100, -100], [180, -66], [255, -32], [314, -6], [346, 18], [358, 62], [354, 110], [320, 134], [246, 126], [172, 120], [114, 126], [96, 76], [84, 24], [58, -22], [18, -52], [-32, -60], [-76, -84], [-116, -108]]);
const CR1_PTS = [[-62, 0], [-40, -40], [4, -52], [50, -40], [70, 2], [52, 44], [6, 56], [-40, 42]];
const CR2_PTS = [[60, 130], [30, 96], [-30, 80], [-90, 100], [-120, 150], [-80, 196], [-10, 206], [50, 186]];
const JDK_PTS = hp([[296, 134], [332, 156], [326, 190], [270, 206], [214, 170], [250, 140]]);
const JCR_PTS = hp([[190, 208], [120, 214], [60, 224], [-8, 214], [-26, 170], [60, 160], [140, 180]]);
const FLX_CAB = campoFluxo([[-60, -100, 1, .1], [60, -70, 1, .3], [150, -50, 1, .5], [260, 5, 1, .6], [315, 75, .55, .85], [45, 70, .3, .95], [-95, 60, .1, 1], [160, 175, 1, .3], [-130, -30, .45, .9], [40, 150, .7, .7]]);
const jawPivot = [10, 150];
const earBase = [-150, -62];
const hornBase = [-96, -124];
const tagLocal = [170, 40];                  // posição do brinco na orelha (referencial da orelha)

/* ----- chifre: linha central + perfil de espessura; anéis de crescimento ----- */
function hornData(comp = 1, grosso = 1, anel = 12, curvaK = 1) {
  const pts = [[0, 0], [-34, -108], [-124, -208], [-258, -258], [-372, -228]].map(p => [hornBase[0] + p[0] * curvaK + (1 - curvaK) * p[0] * .0, hornBase[1] + p[1]]);
  const cen = rdense(pts, false, 14), n = cen.length, tot = [0];
  for (let i = 1; i < n; i++) tot.push(tot[i - 1] + Math.hypot(cen[i][0] - cen[i - 1][0], cen[i][1] - cen[i - 1][1]));
  const L = tot[n - 1], keep = [];
  for (let i = 0; i < n; i++) if (tot[i] <= L * comp) keep.push(i);
  const A = [], B = [], at = [];
  for (const i of keep) {
    const p = cen[i], q = cen[Math.min(n - 1, i + 1)], r = cen[Math.max(0, i - 1)];
    let tx = q[0] - r[0], ty = q[1] - r[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const s = tot[i] / (L * comp), w = (27 * grosso * Math.pow(1 - s, .85) + 3.2) * (1 + .05 * Math.sin(s * 40));
    A.push([p[0] - ty * w, p[1] + tx * w]); B.push([p[0] + ty * w, p[1] - tx * w]); at.push({ p, tx, ty, w, s });
  }
  return { A, B, at, comp };
}
function hornSVG(h, o = {}) {
  const { claro = '#B79B72', escuro = '#3A2B20', rim = RIM, aneis = 12, amp = 1 } = o;
  const A = h.A, B = h.B, n = A.length;
  let d = 'M' + rpt(A[0]); for (let i = 1; i < n; i++) d += 'L' + rpt(A[i]); for (let i = n - 1; i >= 0; i--) d += 'L' + rpt(B[i]); d += 'Z';
  let s = `<path d="${d}" fill="url(#gHorn)"/>`;
  // lado iluminado (borda de cima) e sombra (borda de baixo)
  let dl = 'M' + rpt(A[0]); for (let i = 1; i < n; i++) dl += 'L' + rpt(A[i]);
  let dr = 'M' + rpt(B[0]); for (let i = 1; i < n; i++) dr += 'L' + rpt(B[i]);
  s += `<path d="${dr}" stroke="${escuro}" stroke-width="5" fill="none" opacity=".65" stroke-linecap="round"/><path d="${dl}" stroke="${rim}" stroke-width="3.2" fill="none" opacity=".9" stroke-linecap="round"/>`;
  // anéis
  const R = mulberry(77);
  for (let k = 0; k < aneis; k++) {
    const u = (k + .6 + R() * .5) / (aneis + .3), i = Math.min(n - 1, Math.floor(u * (n - 1))), a = h.at[i], w = a.w;
    const ax = a.p[0] - a.ty * w, ay = a.p[1] + a.tx * w, bx = a.p[0] + a.ty * w, by = a.p[1] - a.tx * w, bulge = w * .55 * amp;
    const cx = (ax + bx) / 2 + a.tx * bulge, cy = (ay + by) / 2 + a.ty * bulge;
    s += `<path d="M${f1(ax)} ${f1(ay)}Q${f1(cx)} ${f1(cy)} ${f1(bx)} ${f1(by)}" stroke="${escuro}" stroke-width="${f1(1.6 + 1.8 * (1 - u))}" fill="none" opacity=".5" stroke-linecap="round"/>`;
    s += `<path d="M${f1(ax + a.tx * 4)} ${f1(ay + a.ty * 4)}Q${f1(cx + a.tx * 4)} ${f1(cy + a.ty * 4)} ${f1(bx + a.tx * 4)} ${f1(by + a.ty * 4)}" stroke="#F1DDB0" stroke-width="1.6" fill="none" opacity=".35" stroke-linecap="round"/>`;
  }
  return s;
}

/* ----- dados pré-gerados (cache por LOD) ----- */
const HC = {};
function headData(lod = 0) {
  if (HC[lod]) return HC[lod];
  const k = [1, .42, .16][lod], sk = poly2d(SK_PTS, true, 6), jw = poly2d(JW_PTS, true, 6), dk = poly2d(DK_PTS, true, 6), c1 = poly2d(CR1_PTS, true, 6), c2 = poly2d(CR2_PTS, true, 6), jdk = poly2d(JDK_PTS, true, 6), jcr = poly2d(JCR_PTS, true, 6);
  const D = {};
  D.sk = sk; D.jw = jw;
  const base = { fluxo: FLX_CAB, sun: SOL, Dmax: 110, amb: .5, gain: .42, cl: 3, jit: .8, ref: sk };
  const back = (x, y) => .3 * smooth((-x - 70) / 90);                        // costura com o pescoço: clareia a nuca
  // crânio: base tan + pelo comprido + pelo fino
  D.skFur = pelo(sk, { ...base, n: Math.round(1900 * k), len: [18, 30], w: [2, 3.4], pal: P_TAN, semente: 11, rimCor: RIM, rimD: 20, rimP: .55, luzMod: (x, y) => back(x, y) + .06 * Math.sin(x * .02) - .1 * smooth((y - 80) / 120) + .1 * smooth(1 - Math.hypot(x - 20, y + 20) / 260) })
    + pelo(sk, { ...base, n: Math.round(2200 * k), len: [9, 15], w: [1.3, 2.2], pal: P_TAN, semente: 12, cl: 4, luzMod: back });
  D.crFur = pelo(c1, { ...base, n: Math.round(170 * k), len: [10, 17], w: [1.6, 2.6], pal: P_CRE, semente: 13, amb: .58, gain: .3 })
    + pelo(c2, { ...base, n: Math.round(260 * k), len: [11, 19], w: [2, 3.2], pal: P_CRE, semente: 14, amb: .4, gain: .3, luzMod: back });
  D.dkFur = pelo(dk, { ...base, n: Math.round(1500 * k), len: [14, 24], w: [2, 3.4], pal: P_DRK, semente: 15, amb: .5, gain: .5, rimCor: '#D9A55E', rimD: 16, rimP: .5, luzMod: (x, y) => .12 * smooth((x - 140) / 160) })
    + pelo(dk, { ...base, n: Math.round(1500 * k), len: [7, 12], w: [1.2, 2], pal: P_DRK, semente: 16, cl: 4 });
  // mandíbula (na sombra do lábio de cima)
  D.jwFur = pelo(jw, { ...base, ref: jw, n: Math.round(700 * k), len: [12, 20], w: [1.8, 3], pal: P_TAN, semente: 21, amb: .34, gain: .3, luzMod: () => -.04 })
    + pelo(jcr, { ...base, ref: jw, n: Math.round(240 * k), len: [10, 17], w: [1.8, 2.8], pal: P_CRE, semente: 22, amb: .3, gain: .25 })
    + pelo(jdk, { ...base, ref: jw, n: Math.round(300 * k), len: [8, 13], w: [1.4, 2.4], pal: P_DRK, semente: 23, amb: .42, gain: .35 });
  // orelha (referencial: base em (0,0), eixo +x)
  const ear = poly2d([[-6, -34], [60, -58], [160, -64], [248, -44], [290, 0], [250, 34], [160, 52], [60, 52], [-6, 36]], true, 6);
  const earIn = poly2d([[22, -26], [80, -42], [160, -44], [232, -28], [262, 0], [226, 22], [160, 34], [76, 36], [22, 26]], true, 6);
  D.ear = ear; D.earIn = earIn;
  const fluxoOr = (x, y) => Math.atan2(y * .12, 1);
  D.earFur = pelo(ear, { n: Math.round(520 * k), cl: 3, len: [10, 17], w: [1.5, 2.6], jit: .8, fluxo: fluxoOr, pal: P_TAN, semente: 31, sun: [.1, -1], Dmax: 40, amb: .42, gain: .5, rimCor: RIM, rimD: 10, rimMin: .4 })
    + pelo(earIn, { n: Math.round(260 * k), cl: 3, len: [8, 13], w: [1.6, 2.6], fluxo: fluxoOr, pal: P_CRE, semente: 32, sun: [.1, -1], Dmax: 40, amb: .5, gain: .3 });
  // borda escura da orelha (faixa preta, como na foto de referência)
  D.earRim = poly2d([[-6, -34], [60, -58], [160, -64], [248, -44], [290, 0], [268, -10], [232, -32], [160, -50], [60, -44], [-4, -20]], true, 6);
  D.earRimFur = pelo(D.earRim, { n: Math.round(150 * k), cl: 3, len: [7, 12], w: [1.5, 2.6], fluxo: fluxoOr, pal: P_DRK, semente: 33, sun: [.1, -1], Dmax: 25, amb: .5, gain: .4 });
  // tufos animados (nascem na borda iluminada do crânio e do pescoço)
  const R = mulberry(5), tf = [], edge = poly2d(SK_PTS, true, 4);
  for (let i = 0; i < edge.length; i++) {
    const p = edge[i], q = edge[(i + 1) % edge.length], r = edge[(i + edge.length - 1) % edge.length];
    let tx = q[0] - r[0], ty = q[1] - r[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl; const nx = ty, ny = -tx;          // normal para fora (sentido horário em y p/ baixo)
    if (nx * SOL[0] + ny * SOL[1] > .2 && R() < .9 * (lod ? .4 : 1)) tf.push({ x: p[0], y: p[1], a: Math.atan2(ny * .8 + .1, nx * .8 + .35), L: 18 + 20 * R(), W: 2 + 1.8 * R(), ph: R() * 6.28, am: .12 + .14 * R() });
  }
  D.tufos = tf;
  // chifre (fêmea: médio, anéis suaves)
  D.horn = hornData(.78, 1.5, 14);
  D.hornFar = hornData(.74, 1.35, 12);
  D.hornBode = hornData(1.0, 2.3, 24); D.hornBodeFar = hornData(.96, 2.1, 22);
  const beard = poly2d([[238, 196], [300, 192], [292, 262], [266, 352], [240, 300], [226, 238]], true, 5);
  D.beard = pelo(beard, { n: Math.round(170 * k), cl: 3, len: [26, 52], w: [3, 5], fluxo: () => 1.6, pal: P_DRK, semente: 91, sun: SOL, Dmax: 40, amb: .35, gain: .3, jit: .8 }); D.beardPoly = beard;
  HC[lod] = D;
  return D;
}

/* ----- olho: âmbar, pupila horizontal, sem piscar ----- */
function olhoSVG(o = {}) {
  const { lid = .22, ref = 1 } = o;
  const amen = 'M-38 7C-26 -14 -8 -26 12 -26C32 -24 44 -10 46 5C40 20 20 29 0 29C-18 28 -32 20 -38 7Z';
  let s = `<g>`;
  s += `<ellipse cx="3" cy="2" rx="64" ry="48" fill="#2A180E" opacity=".35" filter="url(#b4)"/>`;
  s += `<path d="${amen}" fill="#120A06"/>`;
  s += `<clipPath id="olhoClip"><path d="${amen}"/></clipPath><g clip-path="url(#olhoClip)">`;
  s += `<ellipse cx="4" cy="2" rx="40" ry="30" fill="url(#gIris)"/>`;
  s += `<ellipse cx="4" cy="2" rx="40" ry="30" fill="none" stroke="#5A3208" stroke-width="5" opacity=".8"/>`;
  s += `<path d="M-24 -4 C-10 -18 18 -18 32 -4 M-22 12 C-8 24 18 24 30 10" stroke="#FFD27A" stroke-width="2" fill="none" opacity=".35"/>`;
  s += `<rect x="-26" y="-9" width="60" height="19" rx="7" fill="#050302" transform="translate(0,.5)"/>`;
  s += `<rect x="-24" y="-8" width="56" height="3" rx="1.5" fill="#fff" opacity=".07"/>`;
  s += `<ellipse cx="22" cy="-13" rx="9" ry="6" fill="#FFF3D2" opacity="${op(.95 * ref)}" transform="rotate(-25 22 -13)"/>`;
  s += `<ellipse cx="-14" cy="18" rx="11" ry="4" fill="#BFD8FF" opacity="${op(.4 * ref)}"/>`;
  // pálpebra superior relaxada
  s += `<path d="M-44 -2 C-30 -34 30 -34 52 0 L52 -40 L-44 -40Z" transform="translate(0,${f1(-30 + lid * 60)})" fill="#2B190E"/>`;
  s += `</g>`;
  s += `<path d="${amen}" fill="none" stroke="#1A0E07" stroke-width="5" stroke-linejoin="round"/>`;
  // pálpebra de cima com cílios
  s += `<path d="M-40 4 C-28 -18 -6 -29 14 -29 C34 -28 46 -12 48 4" stroke="#0F0804" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  for (let i = 0; i < 6; i++) { const u = i / 5, x = lerp(-22, 38, u), y = -25 + 20 * Math.pow(2 * u - 1, 2) * .55 - 3 + (u < .5 ? 0 : 2); s += `<path d="M${f1(x)} ${f1(y + 4)}q${f1(-2 + u * 2)} -8 ${f1(-4 + u * 10)} -11" stroke="#0F0804" stroke-width="2.2" fill="none" stroke-linecap="round"/>`; }
  s += `<path d="M-36 12 C-20 30 20 34 44 14" stroke="#E7C990" stroke-width="2.4" fill="none" opacity=".5" stroke-linecap="round"/>`;
  s += `</g>`;
  return s;
}

/* ----- a cabeça inteira. o: { t, mast (0..1), orelha (graus), lod, lingua (0..1), vento (0..1), horn (true) } ----- */
function cabeca(o = {}) {
  const { t = 0, mast = 0, orelha = 0, lod = 0, lingua = 0, vento = 1, tag = true, chifre = true, boca = 0, bode = false, lingExt = 0 } = o;
  const D = headData(lod);
  const jang = .8 + 2.6 * boca + 1.9 * mast;                 // ângulo da mandíbula (graus): a mastigação abre e fecha
  const jx = -5 * mast + 3 * boca;                              // a mandíbula também desliza um pouco (moagem)
  let s = '';
  // chifre do outro lado (atrás) e orelha do outro lado
  const hs = bode ? 1.5 : 1;
  if (chifre) s += `<g transform="translate(${hornBase[0]},${hornBase[1]}) scale(${hs}) translate(${-hornBase[0]},${-hornBase[1]})"><g transform="translate(-14,6) scale(.97)" opacity=".92"><g>${hornSVG(bode ? D.hornBodeFar : D.hornFar, { claro: '#8F7650', escuro: '#2A1E16', rim: '#D9A860', aneis: bode ? 14 : 9, amp: bode ? 1.3 : .8 })}</g></g></g>`;
  s += `<g transform="translate(-130,-70) rotate(${f1(-146 + orelha * .6)}) scale(.55)"><path d="${rspl(D.ear.filter((p, i) => i % 3 == 0), true)}" fill="#4A2C18"/></g>`;
  // interior da boca
  s += `<path d="M105 116L215 116L277 122L272 170L180 182L102 160Z" fill="#2A0C0C"/>`;
  if (lingua > .01 || boca > .2) s += `<path d="M120 138C150 150 200 150 ${f1(240 + 34 * lingua)} ${f1(150 + 10 * lingua)}C${f1(250 + 40 * lingua)} 166 200 172 150 168Z" fill="#C4585E"/>`;
  // mandíbula
  s += `<g transform="translate(${f1(jx)},0) rotate(${f1(jang)} ${jawPivot[0]} ${jawPivot[1]})"><path d="${rspl(JW_PTS, true)}" fill="#6B4125"/>${D.jwFur}</g>`;
  if (lingExt > .01) s += `<g transform="translate(${f1(8 * lingExt)},0)"><path d="M232 130Q282 118 ${f1(292 + 74 * lingExt)} ${f1(128 + 6 * lingExt)}Q${f1(306 + 74 * lingExt)} 158 ${f1(280 + 20 * lingExt)} 166Q250 170 230 156Z" fill="#D8626E"/><path d="M244 132Q290 124 ${f1(290 + 70 * lingExt)} 132" stroke="#FFB0B8" stroke-width="4" fill="none" opacity=".6"/></g>`;
  if (bode) s += `<g>${D.beard}</g>`;
  // crânio
  s += `<g><path d="${rspl(SK_PTS, true)}" fill="#7A4B28"/>`;
  s += `<path d="${rspl(DK_PTS, true)}" fill="#24150C"/>`;
  s += `<path d="${rspl(CR1_PTS, true)}" fill="#9A7A52" opacity=".9"/>`;
  s += D.skFur + D.crFur + D.dkFur + `</g>`;
  // sombra de contato sob a mandíbula e dobra da boca
  s += `<path d="M105 120C150 124 215 128 280 130" stroke="#120706" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".9"/>`;
  s += `<path d="M270 132C282 114 292 98 300 80" stroke="#0A0504" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`;
  // focinho: placa nasal (pele sem pelo) e narina
  s += `<g transform="translate(290,64) rotate(-12)"><ellipse rx="20" ry="35" fill="#2A1A17"/><ellipse cx="-4" cy="-10" rx="9" ry="16" fill="#8A6258" opacity=".35"/></g>`;
  s += `<g transform="translate(288,70) rotate(${f1(24 + 3 * boca)})"><ellipse rx="7.5" ry="19" fill="#070302"/><path d="M-4 -15C-2 -6 -1 6 -4 15" stroke="#9A6E5E" stroke-width="2" fill="none" opacity=".45"/></g>`;
  // olho
  s += `<g transform="translate(0,0)">${olhoSVG({ lid: .2 })}</g>`;
  // orelha
  const ea = -126 + orelha;
  s += `<g transform="translate(${earBase[0]},${earBase[1]}) rotate(${f1(ea)}) scale(.64)">`;
  s += `<path d="${rspl(D.ear, true)}" fill="#7B4D2A"/><path d="${rspl(D.earIn, true)}" fill="#A98660"/>`;
  s += D.earFur + `<path d="${rspl(D.earRim, true)}" fill="#1B100A"/>` + D.earRimFur;
  if (tag) s += brinco();
  s += `</g>`;
  // chifre
  if (chifre) s += `<g transform="translate(${hornBase[0]},${hornBase[1]}) scale(${hs}) translate(${-hornBase[0]},${-hornBase[1]})"><g>${hornSVG(bode ? D.hornBode : D.horn, { aneis: bode ? 22 : 14, amp: bode ? 1.6 : 1.25 })}</g></g>`;
  // tufos que balançam
  if (vento) {
    s += `<g>`;
    for (const f of D.tufos) { const a = f.a + vento * f.am * Math.sin(t * 2.3 + f.ph) + vento * .05 * Math.sin(t * 5.1 + f.ph * 2); const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx, L = f.L, W = f.W; s += `<path d="M${f1(f.x + nx * W / 2)} ${f1(f.y + ny * W / 2)}Q${f1(f.x + dx * L * .5 + nx * W * .3)} ${f1(f.y + dy * L * .5 + ny * W * .3)} ${f1(f.x + dx * L)} ${f1(f.y + dy * L)}Q${f1(f.x + dx * L * .5 - nx * W * .3)} ${f1(f.y + dy * L * .5 - ny * W * .3)} ${f1(f.x - nx * W / 2)} ${f1(f.y - ny * W / 2)}Z" fill="${RIM}" opacity=".7"/>`; }
    s += `</g>`;
  }
  // bigodes do focinho
  s += `<g stroke="#F3D79A" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".75">`;
  for (let i = 0; i < 7; i++) { const x = 268 + 10 * hh(i, 3), y = 96 + 9 * i - 12 + (i % 2) * 3, a = .75 + .4 * hh(i, 4); s += `<path d="M${f1(x)} ${f1(y)}q${f1(26 * a)} ${f1(10 + 10 * hh(i, 5))} ${f1(58 * a + 6 * Math.sin(t * 2 + i))} ${f1(30 + 18 * hh(i, 6))}"/>`; }
  s += `</g>`;
  return s;
}
function brinco() {
  return `<g transform="translate(${tagLocal[0]},${tagLocal[1]}) rotate(70)"><path d="M0 -8Q-2 -22 4 -34" stroke="#BDBDBD" stroke-width="3.5" fill="none"/><rect x="-22" y="-4" width="64" height="44" rx="7" fill="#F4C21D" stroke="#B07D08" stroke-width="2.4"/><rect x="-18" y="0" width="56" height="36" rx="5" fill="none" stroke="#FFE680" stroke-width="1.6" opacity=".7"/><circle cx="-12" cy="4" r="2.6" fill="#B07D08"/><text x="10" y="27" text-anchor="middle" font-size="19" fill="#2A1A00" letter-spacing="1" style="font-family:'DejaVu Sans Mono','DejaVu Sans',monospace;font-weight:900">HRYZ</text></g>`;
}
EXTRA += `<linearGradient id="gHorn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4A3829"/><stop offset=".5" stop-color="#8C7352"/><stop offset="1" stop-color="#C2A678"/></linearGradient>
<radialGradient id="gIris" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#F2C24A"/><stop offset=".55" stop-color="#C98A1C"/><stop offset="1" stop-color="#7A4A0C"/></radialGradient>
`;

/* =====================================================================================
   CORPO (coordenadas do corpo: chão em y=0, cernelha em y≈-408, cabra olhando para a direita; a cabeça é 0,36x a escala local)
   ===================================================================================== */
const HT = { ex: 206, ey: -486, ha: 6, sc: .30 };                // olho (pose alerta), inclinação e escala da cabeça no corpo (cabeça ≈ 0,3 da altura da cernelha)
/* costas, garupa, barriga e peito (até o início do pescoço) */
const BODY_BACK = [[44, -410], [-30, -405], [-100, -399], [-156, -400], [-200, -407], [-234, -402], [-258, -386], [-270, -370], [-281, -342], [-284, -302], [-276, -280], [-260, -262], [-220, -246], [-172, -236], [-116, -226], [-40, -218], [28, -224], [86, -240]];
/* pescoço FINO (pose alerta): garganta (de baixo p/ cima), trecho escondido atrás da cabeça e nuca (da cabeça p/ a cernelha) */
const NECK_THROAT = [[118, -268], [132, -304], [148, -344], [168, -382], [190, -414], [200, -432]];
const NECK_UNDER = [[214, -472], [200, -524]];
const NECK_NAPE = [[160, -500], [132, -472], [104, -448], [74, -428]];
const NECK_PIV = [90, -340], NECK_AX = [.5, -.866];
const BC = {};
/* poses: phi = giro do pescoço em volta do ombro (graus); dh = giro extra da cabeça (mantém o focinho mais nivelado) */
const POSES = { alerta: { phi: 0, dh: 0 }, comer: { phi: 24, dh: 9 }, lamber: { phi: 56, dh: 22 } };
const neckXf = (p, phi) => { const dx = p[0] - NECK_PIV[0], dy = p[1] - NECK_PIV[1], w = smooth((dx * NECK_AX[0] + dy * NECK_AX[1]) / 130), a = phi * w * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a); return [NECK_PIV[0] + dx * c - dy * sn, NECK_PIV[1] + dx * sn + dy * c]; };
const corpoPts = pose => { const f = POSES[pose].phi; return [...BODY_BACK, ...NECK_THROAT.map(p => neckXf(p, f)), ...NECK_UNDER.map(p => neckXf(p, f)), ...NECK_NAPE.map(p => neckXf(p, f))]; };
const headPose = pose => { const P = POSES[pose], e = neckXf([HT.ex, HT.ey], P.phi); return { ex: e[0], ey: e[1], a: HT.ha + P.dh + P.phi * .0 }; };
const FLX_BODY = campoFluxo([[-80, -380, -1, .18], [-140, -300, -.85, .55], [-70, -220, -.3, .95], [90, -240, -.15, 1], [-260, -320, -.5, .85], [60, -320, -.45, .9], [150, -400, -1, .35], [100, -370, -.8, .5], [-240, -250, -.3, .95], [150, -440, -.8, .6], [150, -350, -.55, .85]]);
const HIND_F = [[-178, -320], [-152, -262], [-160, -226], [-188, -186], [-206, -150], [-204, -110], [-201, -70], [-199, -44], [-199, -24]];
const HIND_B = [[-219, -24], [-221, -44], [-224, -70], [-228, -104], [-238, -132], [-240, -162], [-250, -200], [-266, -246], [-280, -294], [-284, -334], [-252, -352]];
const LEG = {
  nf: { pts: [[70, -262], [74, -196], [78, -128], [75, -58], [75, -16]], wa: [34, 21, 15, 8.5, 10], wb: [31, 21, 17, 9.5, 11], yk: -250, hoof: [74, 0] },
  ff: { pts: [[28, -262], [26, -196], [28, -128], [25, -58], [27, -16]], wa: [34, 21, 15, 8.5, 10], wb: [31, 21, 17, 9.5, 11], yk: -250, hoof: [27, 0] },
  nr: { poly: [...HIND_F, ...HIND_B], yk: -135, hoof: [-209, 0] },
  fr: { poly: [...HIND_F, ...HIND_B].map(p => [p[0] + 40, p[1] + (p[1] > -200 ? 0 : 0)]), yk: -135, hoof: [-169, 0] },
};
const TAIL = { pts: [[-262, -368], [-282, -392], [-290, -420]], wa: [14, 10, 5], wb: [14, 10, 5], piv: [-262, -368] };
const P_BUFF = paleta(['#3A2A26', '#6A5240', '#9A7C5C', '#C4A276', '#F2D49A'], 8);
const P_BRN = paleta(['#0F0807', '#1F130E', '#38251A', '#684830', '#C79A60'], 8);
const distPoly = (pts, x, y) => { let m = 1e9; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dx = bx - ax, dy = by - ay, u = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)); m = Math.min(m, Math.hypot(x - (ax + u * dx), y - (ay + u * dy))); } return m; };
function bodyData(lod = 0, pose = 'alerta') {
  const key = lod + pose;
  if (BC[key]) return BC[key];
  const k = [1, .45, .2][lod], B = {}, phi = POSES[pose].phi;
  const torso = poly2d(corpoPts(pose), true, 6);
  B.torso = torso;
  // linha "frente-baixo": garganta -> peito -> barriga (de onde sai o pelo escuro, como no íbex da foto)
  const frente = [...NECK_THROAT.slice().reverse().map(p => neckXf(p, phi)), [118, -268], [86, -240], [28, -224], [-40, -218], [-116, -226], [-172, -236]];
  const wD = (x, y) => x > 100 ? 78 : x > 20 ? 100 : lerp(30, 100, smooth((x + 170) / 190));
  const pD = (x, y) => 1 - smooth(distPoly(frente, x, y) / wD(x, y));
  const hb = (x, y) => hh(x * 12.9898 + y * 78.233, 9);                        // aceita por posição (misturas determinísticas)
  // juba: faixa fina ao longo da nuca e do dorso (cabelo mais comprido e escuro)
  const topo = [...NECK_NAPE.map(p => neckXf(p, phi)), ...BODY_BACK.slice(0, 8)];
  const mane = [...topo, ...topo.slice().reverse().map(p => [p[0] + 4, p[1] + 26])];
  const bb = { fluxo: FLX_BODY, sun: SOL, cl: 3, jit: .5 };
  const dist = (x, y) => clamp((196 - x) / 230);                       // 0 junto à cabeça, 1 longe: pelo fino perto da cabeça
  const lenF = (x, y) => { const u = dist(x, y); return [lerp(4.5, 9, u), lerp(7.5, 15, u)]; }, wF = (x, y) => { const u = dist(x, y); return [lerp(.8, 1.4, u), lerp(1.4, 2.4, u)]; };
  const nT = Math.round(areaPoly(torso) * .9 / 13 * k);
  const luzM = (x, y) => -.06 * smooth((y + 270) / 80) + .05 * smooth(1 - Math.hypot(x + 60, y + 330) / 300);
  B.torsoFur = pelo(torso, { ...bb, n: Math.round(nT * 1.05), len: lenF, w: wF, pal: P_BUFF, semente: 41, Dmax: 150, amb: .5, gain: .32, rimCor: RIM, rimD: 18, rimP: .45, luzMod: luzM, filtro: (x, y) => hb(x, y) > pD(x, y) * .98 })
    + pelo(torso, { ...bb, n: Math.round(nT * .8), len: lenF, w: wF, pal: P_BRN, semente: 43, Dmax: 150, amb: .5, gain: .3, rimCor: '#E0A860', rimD: 16, rimP: .45, luzMod: luzM, filtro: (x, y) => hb(x, y) <= pD(x, y) * .98 })
    + pelo(mane, { ...bb, ref: torso, n: Math.round(areaPoly(mane) * 1.1 / 16 * k), len: [9, 17], w: [1.3, 2.4], pal: P_STR, semente: 42, Dmax: 150, amb: .55, gain: .3, rimCor: '#D9A55E', rimD: 14, rimP: .3 });
  // sombras pintadas que definem a anatomia: prega do ombro, sombra sob a mandíbula, luz na nuca
  const ns = NECK_NAPE.map(p => neckXf(p, phi)), th = NECK_THROAT.map(p => neckXf(p, phi));
  B.sombras = `<g fill="none" stroke-linecap="round">`
    + `<path d="M${rpt(neckXf([104, -430], phi))}Q${rpt(neckXf([60, -360], phi))} ${rpt([66, -262])}" stroke="#120A08" stroke-width="22" opacity=".16" filter="url(#b12)"/>`
    + `<path d="M${rpt(th[1])}Q${rpt(th[3])} ${rpt(th[5])}" stroke="#0E0705" stroke-width="16" opacity=".22" filter="url(#b12)" transform="translate(-6,4)"/>`
    + `<path d="M${rpt(ns[3])}Q${rpt(ns[2])} ${rpt(ns[1])}L${rpt(ns[0])}" stroke="#FFD890" stroke-width="3" opacity=".5" filter="url(#b4)"/></g>`;
  B.legs = {};
  for (const id of Object.keys(LEG)) {
    const L = LEG[id], poly = L.poly ? poly2d(L.poly, true, 5) : tubo(L.pts, L.wa, L.wb, 10), far = id[0] === 'f', sd = id.length * 0 + (id === 'nf' ? 51 : id === 'ff' ? 52 : id === 'nr' ? 53 : 54);
    const op0 = { ...bb, ref: L.poly ? ((x, y) => pip(torso, x, y) ? torso : poly) : poly, Dmax: L.poly ? 70 : 40, amb: far ? .28 : .44, gain: far ? .2 : .34, rimCor: far ? null : RIM, rimD: 7, rimP: .38 };
    const ar = areaPoly(poly);
    B.legs[id] = { poly, base: pathPoly(poly),
      fur: pelo(poly, { ...op0, n: Math.round(ar * 1.4 / 20 * k), len: [11, 18], w: [1.8, 3], pal: P_BUFF, semente: sd, filtro: (x, y) => y < L.yk + 14 })
        + pelo(poly, { ...op0, n: Math.round(ar * 1.5 / 16 * k), len: [9, 15], w: [1.5, 2.6], pal: P_BRN, semente: sd + 10, filtro: (x, y) => y > L.yk, amb: far ? .3 : .46 }) };
  }
  const tail = tubo(TAIL.pts, TAIL.wa, TAIL.wb, 8);
  B.tail = { poly: tail, base: pathPoly(tail), fur: pelo(tail, { ...bb, ref: tail, n: Math.round(220 * k), len: [10, 18], w: [1.6, 2.8], pal: P_DRK, semente: 71, Dmax: 20, amb: .45, gain: .35, rimCor: '#D9A55E', rimD: 6, rimP: .5, fluxo: () => -1.9 }) };
  BC[key] = B;
  return B;
}
function casquinho(x, y, far) {          // casco simples (a versão detalhada está em _casco.js)
  const c = far ? '#150D0B' : '#241612';
  return `<g transform="translate(${x},${y})"><path d="M-13 -22 C-17 -12 -17 -4 -13 0 L19 0 C23 -6 21 -14 12 -22Z" fill="${c}"/><path d="M-12 -20 Q0 -25 11 -20" stroke="#6A4A30" stroke-width="3" fill="none" opacity="${far ? .3 : .6}"/><path d="M-12 -3 L18 -3" stroke="#4A3626" stroke-width="2" opacity="${far ? .3 : .7}"/></g>`;
}
/* a cabra em pé (pose de comer). o: { t, mast, orelha, lod, bob (graus), rabo (graus), tag } */
function cabraCorpo(o = {}) {
  const { t = 0, mast = 0, orelha = 0, lod = 0, bob = 0, rabo = 0, tag = true, boca = 0, lingua = 0, pose = 'alerta', bode = false, lingExt = 0 } = o;
  const B = bodyData(lod, pose), HP = headPose(pose);
  let s = '';
  const leg = (id, far) => { const L = LEG[id], l = B.legs[id]; return `<g><path d="${l.base}" fill="${L.poly ? 'url(#gPerna)' : (far ? '#241610' : '#2E1D14')}"/>${l.fur}${casquinho(L.hoof[0], L.hoof[1], far)}</g>`; };
  s += leg('fr', true) + leg('ff', true);
  s += leg('nf', false);
  // rabo
  s += `<g transform="rotate(${f1(rabo)} ${TAIL.piv[0]} ${TAIL.piv[1]})"><path d="${B.tail.base}" fill="#1B100B"/>${B.tail.fur}</g>`;
  // tronco + pescoço (um polígono só) e a cabeça
  s += `<g><path d="${pathPoly(B.torso)}" fill="url(#gTorso)"/>${B.torsoFur}${B.sombras}</g>`;
  s += leg('nr', false);
  const bx = HP.ex - 12, by = HP.ey + 34;
  s += `<g transform="rotate(${f1(bob)} ${f1(bx)} ${f1(by)})">`;
  s += `<g transform="translate(${f1(HP.ex)},${f1(HP.ey)}) rotate(${f1(HP.a)}) scale(${HT.sc})">${cabeca({ t, mast, orelha, lod, tag, boca, lingua, bode, lingExt })}</g>`;
  s += `</g>`;
  return s;
}
EXTRA += `<linearGradient id="gPerna" gradientUnits="userSpaceOnUse" x1="0" y1="-330" x2="0" y2="-120"><stop offset="0" stop-color="#8A6E52"/><stop offset=".45" stop-color="#5A4232"/><stop offset="1" stop-color="#22150F"/></linearGradient>
<linearGradient id="gTorso" gradientUnits="userSpaceOnUse" x1="0" y1="-420" x2="0" y2="-170"><stop offset="0" stop-color="#B58F63"/><stop offset=".45" stop-color="#7A5C42"/><stop offset="1" stop-color="#3A261C"/></linearGradient>
<linearGradient id="gNeck" gradientUnits="userSpaceOnUse" x1="0" y1="-470" x2="0" y2="-300"><stop offset="0" stop-color="#C9904F"/><stop offset="1" stop-color="#7A4C2A"/></linearGradient>`;

/* --- só para desenvolvimento: silhueta em cor chapada (conferir proporções) --- */
function silhuetaDev() {
  const B = bodyData(2);
  let s = '';
  const flat = (p, c) => `<path d="${pathPoly(p)}" fill="${c}"/>`;
  s += flat(B.legs.fr.poly, '#2a1810') + flat(B.legs.ff.poly, '#2a1810') + flat(B.legs.nr.poly, '#4a2e1c') + flat(B.legs.nf.poly, '#4a2e1c');
  s += flat(B.tail.poly, '#1b100b') + flat(B.torso, '#9a6a3a');
  const HP = headPose('alerta');
  s += `<g>`;
  s += `<g transform="translate(${HP.ex},${HP.ey}) rotate(${HP.a}) scale(${HT.sc})"><path d="${rspl(SK_PTS, true)}" fill="#a06a34"/><path d="${rspl(JW_PTS, true)}" fill="#7a4c2a"/><path d="${rspl(DK_PTS, true)}" fill="#2a1a10" opacity=".8"/>${olhoSVG({})}<g transform="translate(-150,-62) rotate(-125)"><path d="${rspl(headData(2).ear, true)}" fill="#c09060"/></g><g>${hornSVG(headData(2).horn, {})}</g></g></g>`;
  return s;
}

/* ponto (lx,ly) do referencial local da cabeça -> mundo (corpo), na pose e com o bob dados */
function ptCab(lx, ly, pose = 'alerta', bob = 0) {
  const HP = headPose(pose), a = HP.a * Math.PI / 180, x = lx * HT.sc, y = ly * HT.sc;
  const X = HP.ex + x * Math.cos(a) - y * Math.sin(a), Y = HP.ey + x * Math.sin(a) + y * Math.cos(a);
  const b = bob * Math.PI / 180, px = HP.ex - 12, py = HP.ey + 34, dx = X - px, dy = Y - py;
  return [px + dx * Math.cos(b) - dy * Math.sin(b), py + dx * Math.sin(b) + dy * Math.cos(b)];
}
