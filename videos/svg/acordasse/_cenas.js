/* ===================== cenas (v2: 19 planos, cortes rápidos no começo) =====================
   Silhueta: sem espelhar ela olha para a ESQUERDA. Para andar para a direita use dir = +1 (a função anda() espelha sozinha).
   Inclinar para a frente = lean negativo, nos dois sentidos.
   DECUPAGEM (diretor):
    1 noite     plano geral do quarto à noite: você dorme do tamanho normal; a régua de altura na porta marca 1,67 m
    1b manha    o mesmo enquadramento de manhã: a cama vazia, só um volume minúsculo no travesseiro; push-in rápido
    2 acorda    close na altura do travesseiro: o despertador "07:00" toca, você se levanta debaixo do lenço e se espreguiça
    3 olho      seu ponto de vista: o olho do gato enche a tela, a pupila dilata e você aparece refletido nela
    4 fareja    contra-plongée: focinho e bigodes enormes descendo e farejando; você paralisado
    5 sombra    plongée (ponto de vista do gato): a sombra da pata cresce sobre você
    6 pata      plongée inclinada: a pata bate, flocos do travesseiro voam, você se joga para o lado
    7 corre     travelling lateral baixo: você corre pelo travesseiro, o gato vem atrás, desfocado
    8 borda     seu ponto de vista olhando para baixo da beira da cama: o tapete lá longe (vertigem, zoom pulsando)
    9 pulo      plano lateral: você pula; a câmera começa a descer
   10 queda     travelling vertical: os móveis passam para cima, um ratinho cai ao lado
   11 pouso     contra-plongée no tapete: pouso fofo, quique, o rato sai correndo
   12 sede      macro na altura dos olhos no banheiro: o pingo cai na poça, você anda até ela e encosta
   13 preso     close fechando: a água sobe pelo braço e te puxa
   14 visor     plano detalhe: o visor da balança marca 14 g (o peso de um rato), seus pés no alto do quadro
   15 frio      plano médio: tremendo, bafo de frio, barriga roncando, luz azul
   16 cozinha   travelling baixo: você vê o biscoito brilhando e corre até ele; formiga ao fundo
   17 migalha   travelling lateral: você empurra o biscoito rolando
   18 sombra2   plano médio: comendo, uma sombra enorme cobre você e você vira
   19 gato      volta ao contra-plongée do começo (loop)
*/
const SH = [
  ['noite', 0, 1.65], ['manha', 1.65, 2.75], ['acorda', 2.75, T('b2') - .1],
  ['olho', T('b2') - .1, 5.1], ['fareja', 5.1, 6.5], ['sombra', 6.5, 7.9], ['pata', 7.9, T('b3') - .1],
  ['corre', T('b3') - .1, 11.0], ['borda', 11.0, 12.4], ['pulo', 12.4, T('b4') - .1],
  ['queda', T('b4') - .1, 17.7], ['pouso', 17.7, T('b5') - .1],
  ['sede', T('b5') - .1, 23.5], ['preso', 23.5, T('b6') - .1],
  ['visor', T('b6') - .1, 29.2], ['frio', 29.2, T('b7') - .1],
  ['cozinha', T('b7') - .1, 35.1], ['migalha', 35.1, T('b8') - .1],
  ['sombra2', T('b8') - .1, 40.1], ['gato', 40.1, TOTAL]];

// anda/corre no sentido certo: dir +1 = para a direita, -1 = para a esquerda
const anda = (o, dir) => eu(Object.assign({ flip: dir > 0 ? -1 : 1 }, o));
// deitado de costas (joelhos para cima) -> sentado: gira a silhueta sentada em volta do quadril
function deitado(x, y, s, gira, o = {}) {   // gira -90 = deitado de costas (cabeça para a esquerda); 0 = em pé; gira em volta dos pés
  return `<g transform="rotate(${f1(gira)} ${f1(x)} ${f1(y)})">${eu(Object.assign({ x, y, s, flip: 1, shadow: 0 }, o))}</g>`;
}
// despertador digital gigante tocando
function despertador(x, y, s, t, toca = 1, txt = '07:00') {
  const tr = toca ? Math.sin(t * 60) * 6 : 0, pisca = Math.floor(t * 4) % 2 || !toca;
  let g = `<g transform="translate(${f1(x + tr)},${y}) scale(${s}) rotate(${f1(tr * .4)})"><ellipse cx="0" cy="220" rx="430" ry="40" fill="#000" opacity=".25" filter="url(#b12)"/>
    <rect x="-400" y="-180" width="800" height="400" rx="80" fill="#2A2E3A" stroke="${OL}" stroke-width="12"/><rect x="-340" y="-120" width="680" height="240" rx="30" fill="#140A0C"/>
    <text x="0" y="70" font-size="190" fill="${pisca ? '#FF3A2A' : '#5A1410'}" text-anchor="middle">${txt}</text>
    <rect x="-320" y="190" width="80" height="40" rx="10" fill="#1A1C24"/><rect x="240" y="190" width="80" height="40" rx="10" fill="#1A1C24"/></g>`;
  if (toca) for (let i = 0; i < 3; i++) { const q = (t * 3 + i / 3) % 1; g += `<path d="M${f1(x - 420 * s - q * 120 * s)} ${f1(y - 100 * s)} q${f1(-40 * s)} ${f1(100 * s)} 0 ${f1(200 * s)} M${f1(x + 420 * s + q * 120 * s)} ${f1(y - 100 * s)} q${f1(40 * s)} ${f1(100 * s)} 0 ${f1(200 * s)}" stroke="#FFD0A0" stroke-width="${f1(14 * s + 3)}" fill="none" stroke-linecap="round" opacity="${op(1 - q)}"/>`; }
  return g;
}
// lenço de papel servindo de cobertor
function lenco(x, y, s, sai = 0) {
  return `<g transform="translate(${f1(x + sai * 300)},${f1(y + sai * 60)}) rotate(${f1(sai * 25)}) scale(${s})" opacity="${op(1 - sai * .8)}">
    <path d="M-520 40 Q-500 -170 -300 -200 Q-60 -260 140 -190 Q330 -150 360 40 Z" fill="#FBFBF6" stroke="#D8DCE4" stroke-width="6"/>
    <path d="M-420 -10 Q-300 -130 -150 -150 M-120 -60 Q20 -190 180 -150 M40 20 Q140 -80 280 -60" stroke="#E2E6EE" stroke-width="10" fill="none" stroke-linecap="round"/>
    ${Array.from({ length: 10 }, (_, i) => `<circle cx="${-440 + i * 90}" cy="${-150 + (i % 3) * 50}" r="5" fill="#E8ECF2"/>`).join('')}</g>`;
}
// pelos de gato no travesseiro
const pelos = (x0, y0, k = 1) => Array.from({ length: 7 }, (_, i) => `<path d="M${x0 + i * 140} ${y0 + (i % 3) * 70} q${60 + i * 8} ${-30 - (i % 2) * 30} ${130 + i * 6} ${10 + (i % 3) * 14}" stroke="${['#8A8E9C', '#C4C8D2', '#5E6272'][i % 3]}" stroke-width="${f1(5 * k)}" fill="none" stroke-linecap="round" opacity=".85"/>`).join('');
// flocos do travesseiro
function flocos(cx, cy, q, n = 14) { let s = ''; for (let i = 0; i < n; i++) { const a = i * 2.4, r = 60 + q * (200 + (i % 4) * 60); s += `<ellipse cx="${f1(cx + Math.cos(a) * r)}" cy="${f1(cy + Math.sin(a) * r * .6 - q * 120 + q * q * 160)}" rx="${10 + i % 3 * 4}" ry="${6 + i % 2 * 3}" fill="#FFFFFF" stroke="#D0D6E2" stroke-width="2" opacity="${op(1 - q)}" transform="rotate(${f1(q * 300 + i * 30)} ${f1(cx + Math.cos(a) * r)} ${f1(cy + Math.sin(a) * r * .6)})"/>`; } return s; }

function quarto(t, k = 1) {   // fundo do quarto, desfocado (parede, janela com sol, quadro, planta)
  return `<rect x="-900" y="-900" width="2900" height="3700" fill="#F2D8B8"/><rect x="600" y="-200" width="700" height="900" fill="#FFF4D8"/><rect x="600" y="-200" width="700" height="900" fill="none" stroke="#C8A070" stroke-width="40"/><path d="M950 -200 L950 700 M600 250 L1300 250" stroke="#C8A070" stroke-width="30"/>
    <rect x="-300" y="80" width="420" height="320" fill="#6A8AB8" stroke="#3A2A20" stroke-width="22"/><circle cx="-80" cy="190" r="60" fill="#F2C860"/>
    <path d="M300 760 L360 560 L420 760Z" fill="#C86A4A"/>${[0, 1, 2, 3, 4].map(i => `<ellipse cx="${360 + (i - 2) * 50}" cy="${520 - (i % 2) * 50}" rx="40" ry="90" fill="#5A9A4A" transform="rotate(${(i - 2) * 25} 360 600)"/>`).join('')}` + raios(t, k, 1000, -150);
}
function cenaGato(t, L, pupila, push, pose = 'medo') {   // contra-plongée do gancho (início e fim)
  const [jx, jy] = hand2(t);
  setCam(540 + jx, lerp(980, 900, push) + jy, lerp(1.0, 1.22, push), lerp(-2, 1, push), [540, 980, 1]);
  let s = lay(.15, blur(14, quarto(t) + despertador(980, 900, .5, t, pose === 'dorme')));
  const blink = pulse(L, 2.2, 2.45, .1);
  s += lay(.45, catFace(540, 640, 1.95, { pupil: pupila, lookX: Math.sin(t * .7) * .15, lookY: .5, earL: Math.sin(t * 3) * 6, earR: -Math.sin(t * 2.4) * 8, blink, mouth: 'w' }));
  s += lay(.45, `<ellipse cx="540" cy="1020" rx="560" ry="120" fill="#000" opacity=".18" filter="url(#b30)"/>`);
  s += lay(1, travesseiro(1180, t) + pelos(80, 1500));
  if (pose === 'dorme') {
    const resp = Math.sin(t * 2.2) * 3;
    s += lay(1, deitado(560, 1400 + resp, .44, -90) + lenco(400, 1440, .6));
  } else {
    const tremor = Math.sin(t * 26) * 3;
    s += lay(1, eu({ x: 330 + tremor, y: 1420, s: .44, armF: [-150, -25], armB: [150, 25], lean: 4 }));
  }
  s += lay(1, raios(t, .6, 1100, -300));
  return s;
}
// quarto em plano geral (noite ou manhã): cama, porta com régua de altura, janela, criado-mudo
function quartoGeral(t, noite, k) {
  const pa = noite ? '#26304A' : '#F2D8B8', luzJ = noite ? '#9AB4E8' : '#FFF4D8', mold = noite ? '#141A2C' : '#C8A070';
  let s = `<rect x="-600" y="-600" width="2300" height="3200" fill="${pa}"/>`;
  s += `<rect x="560" y="260" width="380" height="460" fill="${luzJ}"/><rect x="560" y="260" width="380" height="460" fill="none" stroke="${mold}" stroke-width="24"/><path d="M750 260 L750 720 M560 490 L940 490" stroke="${mold}" stroke-width="18"/>`;
  if (noite) s += `<circle cx="850" cy="360" r="46" fill="#F4F0DC"/><circle cx="872" cy="350" r="44" fill="${luzJ}"/>`;
  // porta e a régua de altura (marcas a lápis e o número)
  s += `<rect x="40" y="200" width="300" height="1100" fill="${noite ? '#3A3020' : '#C89A6A'}"/><rect x="60" y="220" width="260" height="1080" fill="${noite ? '#4A3E2A' : '#D8AE7E'}"/><circle cx="290" cy="780" r="14" fill="#E8C060"/>`;
  s += `<rect x="360" y="380" width="70" height="920" fill="${noite ? '#B8B0A0' : '#FFF6E0'}" stroke="${noite ? '#5A5040' : '#B89A6A'}" stroke-width="4"/>`;
  for (let i = 0; i < 18; i++) s += `<rect x="360" y="${f1(400 + i * 50)}" width="${i % 2 ? 22 : 40}" height="4" fill="${noite ? '#5A5040' : '#8A6A4A'}"/>`;
  if (noite) s += `<rect x="350" y="430" width="100" height="8" fill="#C8302A"/><text x="450" y="458" font-size="52" fill="#F4EEDC">1,67 m</text>`;
  else s += `<rect x="350" y="430" width="100" height="8" fill="#C8302A" opacity=".5"/><text x="450" y="458" font-size="52" fill="#8A6A4A" opacity=".7">1,67 m</text><rect x="350" y="1270" width="100" height="8" fill="#C8302A"/><text x="450" y="1290" font-size="52" fill="#C8302A">10 cm</text>`;
  // cama
  s += `<rect x="460" y="980" width="760" height="260" rx="20" fill="${noite ? '#2A3048' : '#A87448'}"/><rect x="1150" y="760" width="60" height="540" rx="14" fill="${noite ? '#1E2236' : '#8A5A36'}"/>`;
  s += `<ellipse cx="1040" cy="940" rx="110" ry="46" fill="${noite ? '#8A94B8' : '#F4F6FA'}"/>`;
  s += `<rect x="-600" y="1300" width="2300" height="1300" fill="${noite ? '#1A1A28' : '#8A5A36'}"/>`;
  s += despertador(1340, 1180, .28, t, !noite, noite ? '23:00' : '07:00');
  return s;
}
// 1. à noite: você dorme do tamanho normal (régua 1,67 m)
function sNoite(t) {
  TT = t; const { L, d, k } = loc(t, 'noite'), [jx, jy] = hand2(t);
  setCam(lerp(700, 730, k) + jx, 820 + jy, lerp(1.45, 1.55, k), 0, [540, 900, 1]);
  let s = lay(1, quartoGeral(t, true, k));
  const resp = Math.sin(t * 1.8) * 4;
  s += lay(1, `<g transform="rotate(-90 1080 ${f1(950 + resp)})">${eu({ x: 1080, y: 950 + resp, s: .55, shadow: 0, rim: '#9AB4E8' })}</g>` + `<path d="M470 990 Q800 950 1110 965 L1110 1060 L470 1060Z" fill="#3A4A78"/><path d="M500 1000 Q800 960 1100 975" stroke="#5A6A98" stroke-width="10" fill="none"/>`);
  for (let i = 0; i < 3; i++) { const q = (t * .6 + i / 3) % 1; s += lay(1, `<circle cx="${f1(1000 + q * 60)}" cy="${f1(860 - q * 140)}" r="${f1(6 + q * 10)}" fill="none" stroke="#C8D4F0" stroke-width="4" opacity="${op(1 - q)}"/>`); }
  s += `<rect width="1080" height="1920" fill="#0A1028" opacity=".2"/>`;
  return s + VIG(.9) + GRAINV(t);
}
// 1b. de manhã, o mesmo quadro: a cama vazia, só um volume minúsculo no travesseiro
function sManha(t) {
  TT = t; const { L, d, k } = loc(t, 'manha'), [jx, jy] = hand2(t);
  const z = easeIn(range(L, .35, d));
  setCam(lerp(730, 1030, z) + jx, lerp(820, 932, z) + jy, lerp(1.55, 5.5, z), 0, [540, 900, 1]);
  let s = lay(1, quartoGeral(t, false, k) + raios(t, .8, 1000, -100));
  s += lay(1, `<path d="M470 1000 Q800 990 1110 985 L1110 1060 L470 1060Z" fill="#7A9AD0"/><path d="M500 1010 Q800 1000 1100 995" stroke="#9AB4E0" stroke-width="10" fill="none"/>` + lenco(1035, 934, .04) + `<ellipse cx="1036" cy="934" rx="9" ry="4" fill="${NAVY}" opacity=".7"/>`);
  return s + VIG(.7) + GRAINV(t);
}

// 2. o despertador toca: você senta e se espreguiça
function sAcorda(t) {
  TT = t; const { L, d, k } = loc(t, 'acorda'), [jx, jy] = hand2(t);
  setCam(540 + jx, 1100 + jy, lerp(1.0, 1.08, k), 0, [540, 1100, 1]);
  let s = lay(.2, blur(10, quarto(t, .8)));
  s += lay(.45, despertador(760, 760, .9, t, 1));
  s += lay(1, travesseiro(1150, t) + pelos(-100, 1420, 1.4));
  const senta = easeInOut(range(L, .05, .5)), estica = easeInOut(range(L, .5, .95));
  const arms = estica > 0 ? { armF: [lerp(-10, -170, estica), lerp(-10, -5, estica)], armB: [lerp(10, 170, estica), lerp(10, 5, estica)] } : {};
  s += lay(1, deitado(560, 1400, .8, lerp(-90, 0, senta), arms) + lenco(300, 1420, 1.0, easeIn(range(L, .05, .6))));
  return s + VIG(.7) + GRAINV(t);
}
// 3. o olho do gato (seu ponto de vista), com você refletido na pupila
function sOlho(t) {
  TT = t; const { L, d, k } = loc(t, 'olho'), [jx, jy] = hand2(t);
  setCam(540 + jx * 2, 960 + jy * 2, lerp(1.0, 1.25, easeIn(k)), 0, [540, 960, 1]);
  const pup = lerp(.3, .8, easeInOut(range(L, .1, 1.0)));
  let s = `<rect width="1080" height="1920" fill="${CAT.furD}"/>`;
  s += lay(.6, `<rect x="-400" y="-400" width="1900" height="2700" fill="${CAT.fur}"/>${Array.from({ length: 40 }, (_, i) => `<path d="M${(i * 97) % 1500 - 200} ${(i * 211) % 2400 - 200} q20 -70 0 -150" stroke="${[CAT.furD, CAT.furL, CAT.stripe][i % 3]}" stroke-width="${8 + i % 4 * 3}" fill="none" stroke-linecap="round" opacity=".6"/>`).join('')}`);
  s += lay(1, catEye(540, 960, 7.2, { pupil: pup, lookX: 0, lookY: 0 }));
  s += lay(1, `<g opacity=".55">${eu({ x: 620, y: 1060, s: .16, shadow: 0, rim: '#FFFFFF', col: '#E8F8E8', armF: [-150, -25], armB: [150, 25] })}</g>`);
  return s + VIG(.9) + GRAINV(t);
}
// 4. o focinho farejando de perto
function sFareja(t) {
  TT = t; const { L, d, k } = loc(t, 'fareja'), [jx, jy] = hand2(t);
  setCam(540 + jx, 1000 + jy, lerp(1.0, 1.1, k), lerp(1, -1, k), [540, 1000, 1]);
  let s = lay(.2, blur(12, quarto(t, .8)));
  const desce = easeOut(range(L, 0, 1.2)), fung = Math.sin(L * 22) * 10 * range(L, .3, .6);
  s += lay(.7, catFace(540, lerp(-80, 120, desce) + fung, 3.4, { pupil: .7, lookY: 1, mouth: 'w', blink: 0 }));
  s += lay(1, travesseiro(1250, t) + pelos(300, 1600, 1.2));
  const tr = Math.sin(t * 30) * 4;
  s += lay(1, eu({ x: 520 + tr, y: 1480, s: .55, armF: [-150, -25], armB: [150, 25], lean: 6 }));
  for (let i = 0; i < 6; i++) { const q = (t * 2 + i / 6) % 1; s += lay(1, `<path d="M${f1(500 + i * 18 - q * 30)} ${f1(1050 - q * 220)} q14 -30 0 -60" stroke="#FFFFFF" stroke-width="6" fill="none" opacity="${op((1 - q) * .45)}"/>`); }   // ar sendo cheirado
  return s + VIG(.8) + GRAINV(t);
}
// 5-6. a pata: sombra crescendo (sombra) e o golpe (pata)
function cenaPata(t, L, golpe) {
  const [jx, jy] = hand2(t);
  const desce = golpe ? easeIn(range(L, 0, .45)) : easeIn(range(L, 1.1, 1.6)) * .25;
  const hit = golpe ? range(L, .45, .85) : 0, sh = hit > 0 && hit < 1 ? Math.sin(L * 80) * 16 * (1 - hit) : 0;
  setCam(540 + jx + sh, 1000 + jy + sh * .6, golpe ? 1.25 : lerp(1.0, 1.15, range(L, 0, 1.6)), golpe ? -4 : 0, [540, 1000, 1]);
  let s = `<rect width="1080" height="1920" fill="#E8ECF4"/>`;
  s += lay(1, travesseiro(-400, t, { c1: '#F4F6FA', c2: '#DCE2EC' }) + pelos(-100, 700, 1.6) + pelos(200, 1500, 1.6));
  const somb = golpe ? 1 : easeIn(range(L, 0, 1.6));
  s += lay(1, `<ellipse cx="640" cy="1080" rx="${f1(lerp(90, 280, somb))}" ry="${f1(lerp(60, 180, somb))}" fill="#3A4258" opacity="${op(somb * .5)}" filter="url(#b30)"/>`);
  const pula = golpe ? easeOut(range(L, .3, .8)) : 0;
  const x = lerp(640, 330, pula), y = 1160 - Math.sin(pula * Math.PI) * 120;
  if (golpe && pula > 0) s += lay(1, `<g transform="rotate(${f1(-pula * 70)} ${f1(x)} ${f1(y - 100)})">${anda({ x, y, s: .5, lean: -30, armF: [90, 10], armB: [100, 20], shadow: 0 }, -1)}</g>`);
  else s += lay(1, eu({ x: 640 + Math.sin(t * 30) * 3, y: 1160, s: .5, armF: [-150, -25], armB: [150, 25] }));
  if (hit > 0 && hit < 1) { s += lay(1, flocos(640, 1080, hit)); for (let i = 0; i < 10; i++) { const a = i * .63; s += lay(1, `<line x1="${f1(640 + Math.cos(a) * (200 + hit * 160))}" y1="${f1(1080 + Math.sin(a) * (120 + hit * 100))}" x2="${f1(640 + Math.cos(a) * (260 + hit * 220))}" y2="${f1(1080 + Math.sin(a) * (150 + hit * 140))}" stroke="#8A92A8" stroke-width="10" stroke-linecap="round" opacity="${op(1 - hit)}"/>`); } }
  s += lay(1.3, pata(640, lerp(-700, 1080, desce), lerp(1.1, .8, desce), t));
  return s + VIG(.8) + GRAINV(t);
}
function sSombra(t) { TT = t; return cenaPata(t, loc(t, 'sombra').L, false); }
function sPata(t) { TT = t; return cenaPata(t, loc(t, 'pata').L, true); }
// 7. corre pelo travesseiro, o gato atrás
function sCorre(t) {
  TT = t; const { L, d, k } = loc(t, 'corre'), [jx, jy] = hand2(t);
  const x = lerp(100, 1100, L / d);
  setCam(x + 60 + jx, 1100 + jy + Math.abs(Math.sin(L * 11)) * 6, 1.15, 0, [540, 1100, 1]);
  let s = lay(.25, blur(12, quarto(t, .7)));
  s += lay(.5, blur(6, catSide(x - 700, 1150, 1.1, { pose: 'walk', ph: L * 7, speed: 1, lookX: 1 })));
  s += lay(1, `<rect x="-600" y="1180" width="2600" height="900" fill="#E4E9F2"/><path d="M-600 1180 Q400 1150 2000 1185" stroke="#FFFFFF" stroke-width="18" fill="none"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${-600 + i * 230} 1260 q110 -14 220 0" stroke="#C4CCDA" stroke-width="5" stroke-dasharray="14 10" fill="none"/>`).join('')}` + pelos(-200, 1300, 1.6) + pelos(900, 1330, 1.6));
  s += lay(1, anda({ x, y: 1200, s: .5, ph: L * 13, walk: 1.3, lean: -16 }, 1));
  for (let i = 0; i < 4; i++) { const q = (L * 3 + i / 4) % 1; s += lay(1, `<circle cx="${f1(x - 60 - q * 140)}" cy="${f1(1190 - q * 30)}" r="${f1(8 * (1 - q) + 3)}" fill="#FFFFFF" opacity="${op(1 - q)}"/>`); }
  return s + VIG(.8) + GRAINV(t);
}
// 8. a beira da cama vista de cima (seu ponto de vista): vertigem
function sBorda(t) {
  TT = t; const { L, d, k } = loc(t, 'borda'), [jx, jy] = hand2(t);
  const vert = Math.sin(L * 4) * .05;
  setCam(540 + jx, 960 + jy, 1.0 + vert + k * .1, Math.sin(L * 2) * 2, [540, 960, 1]);
  let s = `<rect width="1080" height="1920" fill="#C89A6A"/>`;
  // lá embaixo: tapete e chinelos gigantes, pequenos de tão longe (camada que "afunda" com o zoom)
  const fundo = 1 - vert * 3;
  s += lay(.3, `<g transform="translate(540,700) scale(${f1(fundo * 1000) / 1000}) translate(-540,-700)"><rect x="-400" y="-400" width="1900" height="1800" fill="#8A5A36"/>${Array.from({ length: 14 }, (_, i) => `<rect x="-400" y="${-400 + i * 120}" width="1900" height="6" fill="#6A4226"/>`).join('')}
    <ellipse cx="560" cy="640" rx="340" ry="240" fill="#B8524A"/>${Array.from({ length: 40 }, (_, i) => `<circle cx="${f1(560 + Math.cos(i * 2.4) * (i * 8))}" cy="${f1(640 + Math.sin(i * 2.4) * (i * 5.6))}" r="6" fill="#D8786C"/>`).join('')}
    <g transform="translate(330,420) rotate(-20)"><ellipse cx="0" cy="0" rx="60" ry="120" fill="#6A8AC8"/><ellipse cx="0" cy="-30" rx="46" ry="70" fill="#F2F4FA"/></g><g transform="translate(450,400) rotate(-8)"><ellipse cx="0" cy="0" rx="60" ry="120" fill="#6A8AC8"/><ellipse cx="0" cy="-30" rx="46" ry="70" fill="#F2F4FA"/></g>
    ${rato(780, 520, .3, t)}</g>`);
  s += lay(.6, `<path d="M-300 1100 L1400 1100 L1400 2300 L-300 2300Z" fill="#C8D2E4"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${-200 + i * 220} 1100 Q${-150 + i * 210} 1500 ${-260 + i * 240} 2300" stroke="#AAB6CC" stroke-width="8" fill="none"/>`).join('')}`);
  s += lay(1, `<path d="M-300 1360 Q540 1330 1400 1360 L1400 2400 L-300 2400Z" fill="#EEF2F8"/><path d="M-300 1360 Q540 1330 1400 1360" stroke="#FFFFFF" stroke-width="20" fill="none"/>${pelos(0, 1600, 2)}`);
  // pontas dos seus pés na beira (de cima)
  for (const dx of [-70, 70]) s += lay(1, `<path d="M${430 + dx} 1520 Q${430 + dx} 1380 ${470 + dx} 1370 Q${510 + dx} 1380 ${510 + dx} 1520Z" fill="${NAVY}"/>`);
  return s + VIG(1.1) + GRAINV(t);
}
// 9. o pulo
function sPulo(t) {
  TT = t; const { L, d, k } = loc(t, 'pulo'), [jx, jy] = hand2(t);
  const pulo = range(L, .25, d), desce = easeIn(range(L, .6, d));
  setCam(lerp(700, 760, k) + jx, lerp(900, 1500, desce) + jy, lerp(1.1, .95, k), 0, [540, 900, 1]);
  let s = lay(.2, blur(10, quarto(t, .8) + `<rect x="-900" y="1400" width="2900" height="1500" fill="#C8A47A"/>`));
  s += lay(.35, blur(6, catSide(-60, 760, .7, { pose: 'sit', lookX: 1, tailAmp: 1.4 })));
  s += lay(1, `<path d="M-700 800 L780 800 Q840 800 850 860 L880 2000 L-700 2000Z" fill="#DCE4F0"/><path d="M-700 800 L790 800" stroke="#FFFFFF" stroke-width="22"/>
    <path d="M780 820 Q900 1000 860 1300 Q900 1600 840 2000 L700 2000 Q760 1500 740 1200 Q760 980 700 820Z" fill="#C8D2E4" stroke="#AAB6CC" stroke-width="6"/>
    ${Array.from({ length: 6 }, (_, i) => `<path d="M${720 + i * 22} ${900 + i * 30} Q${790 + i * 10} 1400 ${740 + i * 18} 2000" stroke="#B0BCD2" stroke-width="5" fill="none"/>`).join('')}
    <rect x="-700" y="2000" width="2300" height="900" fill="#8A5A36"/>` + pelos(-100, 830, 1.2));
  const px = pulo > 0 ? lerp(740, 960, easeOut(pulo)) : 740, py = pulo > 0 ? 800 - 150 * Math.sin(Math.min(1, pulo * 2.2) * Math.PI) + Math.max(0, pulo - .45) * 1800 : 800;
  const agacha = pulo === 0 ? Math.sin(range(L, 0, .25) * Math.PI) * .25 : 0;
  s += lay(1, anda({ x: px, y: py, s: .42, sit: agacha, lean: pulo > 0 ? -25 : -10, armF: pulo > 0 ? [100, -20] : [40, 30], armB: pulo > 0 ? [-160, 20] : [-30, 30], shadow: pulo > 0 ? 0 : .3 }, 1));
  return s + VIG(.7) + GRAINV(t);
}
// 10-11. a queda (com o ratinho) e o pouso no tapete
function cenaQueda(t, L, pousoShot) {
  const [jx, jy] = hand2(t);
  const LL = pousoShot ? L + 3.9 : L;            // tempo contínuo da queda
  const pouso = range(LL, 4.2, 5.0), cair = range(LL, 0, 4.4);
  setCam(540 + jx, (pousoShot ? 1180 : 960) + jy + (pouso > 0 && pouso < .4 ? Math.sin(LL * 50) * 10 : 0), pousoShot ? lerp(1.35, 1.2, range(L, 0, 3)) : 1.0, pousoShot ? 2 : 0, [540, 960, 1]);
  const sc = cair * 2600;
  let s = `<rect width="1080" height="1920" fill="#F0D4B4"/>`;
  s += lay(.3, blur(8, `<g transform="translate(0,${f1(-sc * .3)})"><rect x="-300" y="0" width="420" height="3600" fill="#8A5A36"/><rect x="760" y="300" width="500" height="900" fill="#A87448"/><rect x="800" y="360" width="420" height="200" fill="#8A5A36"/><circle cx="1010" cy="460" r="18" fill="#E8C060"/><rect x="800" y="620" width="420" height="200" fill="#8A5A36"/><circle cx="1010" cy="720" r="18" fill="#E8C060"/><rect x="820" y="180" width="160" height="120" rx="20" fill="#2A2E3A"/></g>`));
  s += lay(.6, `<g transform="translate(0,${f1(-sc * .7)})"><path d="M-200 -200 L120 -200 L140 2200 L-180 2200Z" fill="#C8D2E4"/>${Array.from({ length: 5 }, (_, i) => `<path d="M${-150 + i * 60} -200 Q${-120 + i * 50} 1000 ${-160 + i * 64} 2200" stroke="#AAB6CC" stroke-width="6" fill="none"/>`).join('')}</g>`);
  for (let i = 0; i < 14; i++) { const q = (t * 2.2 + i / 14) % 1; if (pouso < .2) s += `<line x1="${f1(120 + i * 70)}" y1="${f1(1900 - q * 2200)}" x2="${f1(120 + i * 70)}" y2="${f1(2050 - q * 2200)}" stroke="#FFFFFF" stroke-width="5" opacity="${op(.5 * (1 - pouso * 5))}"/>`; }
  const chao = lerp(2600, 1340, easeOut(range(LL, 3.6, 4.4)));
  if (pousoShot) s += lay(.9, `<g transform="translate(860,${f1(chao - 60)})"><ellipse cx="0" cy="0" rx="150" ry="70" fill="#6A8AC8"/><ellipse cx="-10" cy="-10" rx="110" ry="46" fill="#F2F4FA"/></g>`);   // chinelo
  s += lay(1, tapete(chao, t));
  const chega = easeIn(range(LL, 3.6, 4.3)), yv = lerp(900 + Math.sin(LL * 2) * 40, chao - 2, chega);
  const rot = pouso > 0 ? lerp(220, 0, easeOut(pouso)) : LL * 50;
  const quica = pouso > 0 && pouso < .5 ? Math.sin(pouso / .5 * Math.PI) * 60 : 0, levanta = range(LL, 5.2, 6.0);
  s += lay(1, rato(lerp(800, 860, pouso) + (levanta > 0 ? levanta * 500 : 0), lerp(760 + Math.sin(LL * 2.4 + 1) * 50, chao + 6, chega) - quica * .6, .8, t, { rot: pouso > 0 ? lerp(160, 0, easeOut(pouso)) : LL * 70 + 30, walk: levanta > 0 ? 1 : 0 }));
  const sacode = levanta > 0 ? { armF: [-30 + 30 * Math.sin(LL * 14), -40], armB: [20, 10] } : pouso < .6 ? { armF: [-160, -20], armB: [160, 20] } : { armF: [-20, -10], armB: [20, 10] };
  s += lay(1, `<g transform="rotate(${f1(rot)} 420 ${f1(yv - 150)})">${eu(Object.assign({ x: 420, y: yv - quica, s: .42, shadow: 0 }, sacode))}</g>`);
  if (pouso > .3 && pouso < 1) for (let i = 0; i < 10; i++) { const a = Math.PI + i * .35, q = (pouso - .3) / .7; s += lay(1, `<circle cx="${f1(420 + Math.cos(a) * 140 * q)}" cy="${f1(chao - 10 + Math.sin(a) * 70 * q)}" r="${f1(8 * (1 - q) + 2)}" fill="#E8B0A8" opacity="${op(1 - q)}"/>`); }
  return s + VIG(.7) + GRAINV(t);
}
function sQueda(t) { TT = t; return cenaQueda(t, loc(t, 'queda').L, false); }
function sPouso(t) { TT = t; return cenaQueda(t, loc(t, 'pouso').L, true); }
// 12-13. a gota: chega e encosta (sede); a água sobe e prende (preso)
function banheiro(t) {
  return `<rect x="-800" y="-800" width="2700" height="1900" fill="#DCEAF0"/><path d="M200 -200 Q250 300 600 320 L620 380 Q260 380 150 -200Z" fill="#E8F0F4"/><rect x="560" y="300" width="160" height="80" rx="30" fill="#B8C8D4"/>
    <rect x="-200" y="80" width="60" height="520" rx="26" fill="#5AB8E8"/><rect x="-210" y="40" width="80" height="90" rx="20" fill="#F4F8FC"/>${Array.from({ length: 8 }, (_, i) => `<rect x="${-206 + i * 9}" y="10" width="6" height="40" fill="#FFFFFF"/>`).join('')}
    <rect x="900" y="300" width="240" height="420" rx="20" fill="#F2C8D8"/><rect x="940" y="250" width="160" height="70" rx="10" fill="#E8E8F0"/>
    ${Array.from({ length: 12 }, (_, i) => `<circle cx="${80 + i * 90}" cy="${300 + (i % 3) * 120}" r="${30 + (i % 4) * 14}" fill="#FFFFFF" opacity=".35"/>`).join('')}`;
}
// poça d'água no piso do banheiro (com 10 cm, uma gota é pequena demais: é a poça que pega você)
function poca(x, y, r, t, onda = 0) {
  const id = nid('pc');
  def(`<radialGradient id="${id}" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#E8F8FF" stop-opacity=".9"/><stop offset=".5" stop-color="#9AD4F2" stop-opacity=".75"/><stop offset="1" stop-color="#5AA8DA" stop-opacity=".8"/></radialGradient>`);
  let s = `<path d="M${x - r} ${y} Q${x - r * .9} ${y - r * .3} ${x - r * .3} ${y - r * .32} Q${x + r * .4} ${y - r * .38} ${x + r * .95} ${y - r * .12} Q${x + r * 1.1} ${y + r * .12} ${x + r * .5} ${y + r * .26} Q${x - r * .2} ${y + r * .34} ${x - r * .8} ${y + r * .2} Q${x - r * 1.05} ${y + r * .12} ${x - r} ${y}Z" fill="url(#${id})" stroke="#4A90C8" stroke-width="5"/>`;
  s += `<path d="M${f1(x - r * .55)} ${f1(y - r * .18)} q${f1(r * .3)} ${f1(-r * .08)} ${f1(r * .6)} 0" stroke="#FFFFFF" stroke-width="10" fill="none" stroke-linecap="round" opacity=".8"/>`;
  s += `<rect x="${f1(x + r * .2)}" y="${f1(y - r * .2)}" width="${f1(r * .22)}" height="${f1(r * .1)}" rx="4" fill="#FFFFFF" opacity=".55"/>`;
  for (let i = 0; i < 3; i++) { const q = (t * .8 + i / 3) % 1; s += `<ellipse cx="${f1(x + r * .25)}" cy="${f1(y - r * .05)}" rx="${f1(r * .1 + q * r * .5 * (onda ? 1 : .4))}" ry="${f1(r * .03 + q * r * .14 * (onda ? 1 : .4))}" fill="none" stroke="#E8F8FF" stroke-width="4" opacity="${op((1 - q) * .8)}"/>`; }
  return s;
}
// biscoito com gotas de chocolate (com 10 cm, ele é do tamanho de uma mesa)
function biscoito(x, y, r, rot) {
  let s = `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)})"><circle r="${r}" fill="#D8A050" stroke="${OL}" stroke-width="8"/><circle r="${f1(r * .86)}" fill="#E8B866"/>`;
  for (let i = 0; i < 18; i++) { const a = i * 2.39, rr = r * (.15 + .65 * ((i * 37) % 10) / 10); s += `<ellipse cx="${f1(Math.cos(a) * rr)}" cy="${f1(Math.sin(a) * rr)}" rx="${f1(r * .02 + (i % 3) * 2)}" ry="${f1(r * .015 + 2)}" fill="#C88A3A"/>`; }
  for (let i = 0; i < 9; i++) { const a = i * 2.1 + .5, rr = r * (.2 + .55 * ((i * 53) % 10) / 10); s += `<path d="M${f1(Math.cos(a) * rr - r * .08)} ${f1(Math.sin(a) * rr + r * .05)} Q${f1(Math.cos(a) * rr)} ${f1(Math.sin(a) * rr - r * .12)} ${f1(Math.cos(a) * rr + r * .08)} ${f1(Math.sin(a) * rr + r * .05)}Z" fill="#4A2A16" stroke="${OL}" stroke-width="4"/><circle cx="${f1(Math.cos(a) * rr - r * .02)}" cy="${f1(Math.sin(a) * rr - r * .03)}" r="${f1(r * .018)}" fill="#8A5A3A"/>`; }
  return s + `<path d="M${f1(-r * .7)} ${f1(-r * .45)} Q0 ${f1(-r * .95)} ${f1(r * .7)} ${f1(-r * .45)}" stroke="#FFE2A0" stroke-width="10" fill="none" opacity=".6" stroke-linecap="round"/></g>`;
}
function cenaGota(t, L, preso) {
  const [jx, jy] = hand2(t);
  const LL = preso ? L + 2.7 : L;
  const toca = range(LL, 1.9, 2.5), sobe = easeInOut(range(LL, 2.6, 5.0)), puxa = range(LL, 3.4, 6.2);
  setCam(lerp(520, 560, LL / 6) + jx, (preso ? 1060 : 1000) + jy, preso ? lerp(1.3, 1.6, easeInOut(range(L, 0, 3.4))) : lerp(1.0, 1.15, range(L, 0, 2.7)), 0, [540, 1000, 1]);
  let s = `<rect width="1080" height="1920" fill="#CFE2EC"/>`;
  s += lay(.2, blur(16, banheiro(t)));
  s += lay(.6, piso(1050, t));
  const pg = range(LL, .1, .8);
  if (pg > 0 && pg < 1) s += lay(1, `<ellipse cx="805" cy="${f1(lerp(-200, 1310, easeIn(pg)))}" rx="18" ry="28" fill="#9AD0F0" stroke="#2A6AA8" stroke-width="4"/>`);
  if (pg >= 1 && LL < 1.4) { const q = range(LL, .8, 1.4); s += lay(1, `<ellipse cx="805" cy="1310" rx="${f1(30 + q * 200)}" ry="${f1(8 + q * 40)}" fill="none" stroke="#E8F8FF" stroke-width="6" opacity="${op(1 - q)}"/>`); }
  s += lay(1, poca(700, 1330, 420, t, pg >= 1));
  const anda1 = easeInOut(range(LL, .3, 1.9)), xx = lerp(170, 410, anda1) - puxa * 30, ajoelha = easeInOut(range(LL, 4.6, 6.2));
  const pose = toca > 0 ? { armF: [lerp(60, 95, toca), lerp(10, 5, toca)], armB: [lerp(-20, -60, puxa), lerp(-20, -50 * Math.sin(LL * 8), puxa)] } : {};
  s += lay(1, anda(Object.assign({ x: xx, y: 1320, s: .46, ph: LL * 9, walk: anda1 > 0 && anda1 < 1 ? 1 : 0, lean: lerp(-6, 16, puxa), sit: ajoelha * .5, rim: RIMC, rimK: [1, -.4] }, pose), 1));
  if (sobe > 0) s += lay(1, `<path d="M${f1(xx + 120)} ${f1(1300 - 600)} Q${f1(xx + 60 - sobe * 80)} ${f1(1300 - 500 + 200 * (1 - sobe))} ${f1(xx - 60 + 40 * (1 - sobe))} ${f1(1300 - 120 - 380 * sobe * .8)} Q${f1(xx - 120)} ${f1(1300 - 60)} ${f1(xx + 20)} 1300 Q${f1(xx + 200)} 1300 ${f1(xx + 220)} ${f1(1300 - 380)}Z" fill="#7AC4F0" opacity="${op(.55 * sobe)}" stroke="#E8F8FF" stroke-width="4"/>`);
  for (let i = 0; i < 8; i++) { const q = (t * 1.3 + i / 8) % 1; if (sobe > .2) s += lay(1, `<circle cx="${f1(xx - 40 + i * 20)}" cy="${f1(1240 - q * 380 * sobe)}" r="${f1(5 + (i % 3) * 3)}" fill="#E8F8FF" opacity="${op((1 - q) * .8)}"/>`); }
  return s + VIG(.8) + GRAINV(t);
}
function sSede(t) { TT = t; return cenaGota(t, loc(t, 'sede').L, false); }
function sPreso(t) { TT = t; return cenaGota(t, loc(t, 'preso').L, true); }
// 14-15. a balança: o visor (0,1 g) e o frio
function cozinhaFundo(t) {
  return `<rect x="-800" y="-800" width="2700" height="1900" fill="#C8D8E8"/><rect x="-200" y="200" width="300" height="420" rx="30" fill="#E8C060"/><rect x="200" y="140" width="220" height="480" rx="20" fill="#F0F4F8"/>
    <rect x="600" y="-300" width="600" height="920" rx="30" fill="#EEF2F6"/><rect x="640" y="200" width="20" height="200" rx="10" fill="#B8C4CE"/>${[[760, 0, '#E85A4A'], [880, 60, '#4AA8E8'], [800, 120, '#F2C040'], [940, -40, '#6AC86A']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="36" fill="${c}"/>`).join('')}<rect x="-800" y="620" width="2700" height="60" fill="#8A9AAA"/>`;
}
function sVisor(t) {
  TT = t; const { L, d, k } = loc(t, 'visor'), [jx, jy] = hand2(t);
  setCam(520 + jx, lerp(1180, 1150, k) + jy, lerp(1.9, 2.1, k), 0, [540, 1000, 1]);
  let s = `<rect width="1080" height="1920" fill="#B8CCE0"/>`;
  s += lay(.3, blur(14, cozinhaFundo(t)));
  s += lay(.6, `<rect x="-800" y="680" width="2700" height="1700" fill="#DDE4EA"/>`);
  s += lay(1, balanca(540, 1080, .62, L > .35 ? '14 g' : (Math.floor(L * 20) % 2 ? '0,0 g' : '-.- g'), t));
  s += lay(1, eu({ x: 520 + Math.sin(t * 34) * 2, y: 1080, s: .42, armF: [-95, 140], armB: [95, -140], rim: RIMC, rimK: [1, -.4] }));
  return s + VIG(.75) + GRAINV(t);
}
function sFrio(t) {
  TT = t; const { L, d, k } = loc(t, 'frio'), [jx, jy] = hand2(t);
  setCam(lerp(560, 520, k) + jx, lerp(900, 960, k) + jy, lerp(1.45, 1.25, easeInOut(k)), lerp(-2, 1, k), [540, 1000, 1]);
  let s = `<rect width="1080" height="1920" fill="#B8CCE0"/>`;
  s += lay(.3, blur(14, cozinhaFundo(t)));
  s += lay(.6, `<rect x="-800" y="680" width="2700" height="1700" fill="#DDE4EA"/>${Array.from({ length: 8 }, (_, i) => `<rect x="-800" y="${680 + i * 160}" width="2700" height="4" fill="#C4CCD4"/>`).join('')}`);
  s += lay(1, balanca(540, 1080, .62, '14 g', t));
  const tr = Math.sin(t * 34) * 3;
  s += lay(1, eu({ x: 520 + tr, y: 1080, s: .42, armF: [-95 + Math.sin(t * 30) * 4, 140], armB: [95, -140], rim: RIMC, rimK: [1, -.4], lean: Math.sin(t * 3) * 3 }));
  s += lay(1, bafo(560, 640, t, 1));
  for (let i = 0; i < 12; i++) { const q = (t * .4 + i / 12) % 1; s += lay(.8, `<path d="M0 -10 L0 10 M-10 0 L10 0 M-7 -7 L7 7 M-7 7 L7 -7" stroke="#FFFFFF" stroke-width="3" transform="translate(${f1((i * 211) % 1080)},${f1(200 + q * 900)})" opacity="${op(Math.sin(q * Math.PI) * .7)}"/>`); }   // floquinhos de frio
  const ronco = range(L, 1.6, 3.2);
  for (let i = 0; i < 3; i++) { const q = (L * 1.5 + i / 3) % 1; if (ronco > 0 && ronco < 1) s += lay(1, `<path d="M${f1(440 - q * 60)} ${f1(930 - i * 6)} q-14 -14 0 -28 q14 -14 0 -28" stroke="#6A7A9A" stroke-width="6" fill="none" opacity="${op(1 - q)}" transform="rotate(-90 ${f1(440 - q * 60)} 930)"/>`); }
  return s + VIG(.75) + GRAINV(t);
}
// 16-17. a migalha: correndo até ela (cozinha) e empurrando (migalha)
function cozinhaChao(t, x0) {
  return `<rect x="-800" y="-800" width="2700" height="1900" fill="#F0D8B0"/><rect x="-600" y="100" width="1400" height="700" fill="#A8744A"/><rect x="-560" y="140" width="640" height="620" fill="#B8845A"/><rect x="120" y="140" width="640" height="620" fill="#B8845A"/><circle cx="60" cy="460" r="22" fill="#E8C060"/><circle cx="180" cy="460" r="22" fill="#E8C060"/>
    <rect x="1000" y="-200" width="70" height="1100" fill="#6A4628"/><rect x="1300" y="-200" width="70" height="1100" fill="#6A4628"/>`;
}
function formiga(x, y, s, t) { return `<g transform="translate(${f1(x)},${y}) scale(${-s},${s})"><ellipse cx="-60" cy="-30" rx="44" ry="30" fill="#2A1A14"/><ellipse cx="10" cy="-34" rx="24" ry="20" fill="#2A1A14"/><circle cx="60" cy="-44" r="24" fill="#2A1A14"/>${[-40, 0, 30].map((x, i) => `<path d="M${x} -26 l${-20 + 40 * Math.sin(t * 16 + i)} 34 M${x} -26 l${20 - 40 * Math.sin(t * 16 + i)} 34" stroke="#2A1A14" stroke-width="6"/>`).join('')}<path d="M70 -62 q30 -40 50 -30" stroke="#2A1A14" stroke-width="5" fill="none"/></g>`; }
function sCozinha(t) {
  TT = t; const { L, d, k } = loc(t, 'cozinha'), [jx, jy] = hand2(t);
  const x = lerp(-80, 560, easeIn(range(L, .4, d)));
  setCam(lerp(380, 640, k) + jx, 1080 + jy, lerp(1.25, 1.1, k), 0, [540, 1080, 1]);
  let s = `<rect width="1080" height="1920" fill="#E8C898"/>`;
  s += lay(.2, blur(14, cozinhaChao(t)));
  s += lay(.7, assoalho(860, t, 0));
  s += lay(.7, formiga(lerp(1300, 300, range(L, 0, d)), 1320, .18, t));
  s += lay(1, `<circle cx="900" cy="1180" r="${f1(230 + 20 * Math.sin(t * 4))}" fill="url(#gWarm)" opacity=".8"/>` + biscoito(900, 1180, 160, 10));
  for (let i = 0; i < 5; i++) s += lay(1, `<circle cx="${700 + i * 60}" cy="${1330 + (i % 2) * 6}" r="${6 + i % 3 * 3}" fill="#E8B866"/>`);
  s += lay(1, anda({ x, y: 1340, s: .44, ph: L * 12, walk: x > -50 ? 1.2 : 0, lean: -14 }, 1));
  return s + VIG(.7) + GRAINV(t);
}
function sMigalha(t) {
  TT = t; const { L, d, k } = loc(t, 'migalha'), [jx, jy] = hand2(t);
  setCam(lerp(500, 700, k) + jx, 1060 + jy, lerp(1.1, 1.18, k), 0, [540, 1060, 1]);
  let s = `<rect width="1080" height="1920" fill="#E8C898"/>`;
  s += lay(.2, blur(14, cozinhaChao(t)));
  s += lay(.7, assoalho(860, t, -L * 60));
  const mx = lerp(560, 900, easeInOut(range(L, .1, d))), giro = mx * .5;
  s += lay(1, `<ellipse cx="${f1(mx)}" cy="1338" rx="260" ry="34" fill="#000" opacity=".25" filter="url(#b12)"/>` + biscoito(mx, 1150, 200, giro));
  s += lay(1, anda({ x: mx - 250, y: 1340, s: .44, ph: L * 7, walk: .8, lean: -24, armF: [80, 10], armB: [70, 20] }, 1));
  for (let i = 0; i < 6; i++) { const q = (t * 1.2 + i / 6) % 1; s += lay(1, `<circle cx="${f1(mx - 170 - q * 260)}" cy="${f1(1320 - Math.sin(q * Math.PI) * 60)}" r="${4 + i % 3}" fill="#E8B866" opacity="${op(1 - q)}"/>`); }
  return s + VIG(.7) + GRAINV(t);
}
// 18. comendo: a sombra cobre você e você vira
function sSombra2(t) {
  TT = t; const { L, d, k } = loc(t, 'sombra2'), [jx, jy] = hand2(t);
  const sombra = easeIn(range(L, .1, 1.9)), vira = range(L, 1.8, 2.1);
  setCam(540 + jx, 1060 + jy, lerp(1.15, 1.4, easeInOut(k)), 0, [540, 1060, 1]);
  let s = `<rect width="1080" height="1920" fill="#E8C898"/>`;
  s += lay(.2, blur(14, cozinhaChao(t)));
  s += lay(.7, assoalho(860, t));
  s += lay(1, biscoito(700, 1210, 130, 30));
  const morde = Math.abs(Math.sin(L * 8)) * (1 - vira);
  s += lay(1, vira < .5 ? eu({ x: 520, y: 1340, s: .5, flip: -1, sit: .5, armF: [lerp(60, 90, morde), -30], armB: [70, -20] }) : eu({ x: 520, y: 1340, s: .5, flip: 1, armF: [-150, -25], armB: [150, 25] }));
  s += `<rect width="1080" height="1920" fill="#1A1424" opacity="${op(sombra * .5)}"/>`;
  s += lay(.9, `<ellipse cx="${f1(lerp(-300, 400, sombra))}" cy="1250" rx="${f1(500 + 300 * sombra)}" ry="${f1(260 + 120 * sombra)}" fill="#0A0810" opacity="${op(sombra * .5)}" filter="url(#b30)"/>`);
  if (vira > .5) s += lay(1, `<path d="M480 840 l-20 -40 M520 830 l0 -46 M560 840 l20 -40" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" opacity="${op((vira - .5) * 2)}"/>`);   // susto
  return s + VIG(1) + GRAINV(t);
}
// 19. de volta ao começo
function sGato(t) { TT = t; const { L, d } = loc(t, 'gato'); return cenaGato(t, L + 2, lerp(.3, .62, easeInOut(range(L, .1, 1.4))), easeOut(range(L, 0, d)) * .5, 'medo') + VIG(.7) + GRAINV(t); }

const FN = { noite: sNoite, manha: sManha, acorda: sAcorda, olho: sOlho, fareja: sFareja, sombra: sSombra, pata: sPata, corre: sCorre, borda: sBorda, pulo: sPulo, queda: sQueda, pouso: sPouso,
  sede: sSede, preso: sPreso, visor: sVisor, frio: sFrio, cozinha: sCozinha, migalha: sMigalha, sombra2: sSombra2, gato: sGato };
