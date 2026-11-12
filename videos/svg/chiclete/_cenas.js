/* =====================================================================================
   Se você engolir um chiclete 🤔  (formato dos virais: 33 s, 84 palavras, a primeira frase já é a ação,
   cada frase é uma mudança na tela, termina quando o processo termina; a bola rosa no centro emenda o fim no começo)
   DECUPAGEM (diretor):
    1 boca       corte lateral da cabeça (perfil em silhueta, por dentro em cores): a língua empurra o chiclete para a garganta; push-in
    2 esofago    dentro do tubo: anéis de músculo apertam em onda e empurram a bola; a câmera desce junto (usa a altura do vertical)
    3 estomago   plongée dentro do estômago: a bola cai no ácido, splash, pedaços de comida boiando
    4 acido      macro: cristais de açúcar e pontos de sabor se soltam e chiam; a goma fica
    5 amassa     plano médio: as paredes do estômago amassam tudo; a comida se desfaz, a goma continua inteira
    6 corpo      pull-out: o corpo inteiro em silhueta com a barriga transparente; o caminho acende; fita métrica "6 m" no intestino
    7 intestino  dentro do intestino delgado (vilosidades): travelling acompanhando a bola espremida
    8 grosso     intestino grosso (bolsas, bactérias coloridas): a bola segue com o resto
    9 saida      plongée sobre o vaso: a bola cai na água; push-in até a bola rosa no centro (igual ao quadro 0)
   ===================================================================================== */
const SH = [['boca', 0, 2.4], ['esofago', 2.4, T('b2') - .1], ['estomago', T('b2') - .1, 7.8], ['acido', 7.8, T('b3') - .1], ['amassa', T('b3') - .1, T('b4') - .1],
  ['corpo', T('b4') - .1, 17.7], ['intestino', 17.7, T('b5') - .1], ['grosso', T('b5') - .1, T('b6') - .1], ['saida', T('b6') - .1, TOTAL]];
const NAVY = '#141A2C', RIM = '#FFC07A', OLc = '#3A0E18';
const CARNE = '#E8848E', CARNE_D = '#C25866', CARNE_L = '#F8B4BA', MUCO = '#FFE0E4';
const hand2 = t => [Math.sin(t * 1.3) * 3 + Math.sin(t * 3.1) * 1.5, Math.cos(t * 1.1) * 3];
const shotAt = t => SH.find(s => t >= s[1] && t < s[2]) || SH[SH.length - 1];
const loc = (t, id) => { const s = SH.find(x => x[0] === id); return { L: t - s[1], d: s[2] - s[1], k: (t - s[1]) / (s[2] - s[1]) }; };
const GRAINV = t => { const j = Math.floor(t * 24); return `<rect x="-200" y="-200" width="1480" height="2320" fill="url(#noiseP)" opacity=".045" transform="translate(${(j * 37) % 200 - 100},${(j * 53) % 200 - 100})"/>`; };
const blur = (px, c) => { const id = 'bl' + px; if (!D.some(d => d.includes(`id="${id}"`))) def(`<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${px}"/></filter>`); return `<g filter="url(#${id})">${c}</g>`; };

// o chiclete: bola rosa mastigada (marcas de dente), achatável; `acucar` = brilho dos cristais ainda na superfície
function goma(x, y, r, t, o = {}) {
  const sx = o.sx || 1, sy = o.sy || 1, rot = o.rot || 0, ac = o.acucar ?? 0, id = nid('gm');
  def(`<radialGradient id="${id}" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#FFD6EC"/><stop offset=".45" stop-color="#FF8AC4"/><stop offset="1" stop-color="#D84A90"/></radialGradient>`);
  let s = `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${f1(sx * 1000) / 1000},${f1(sy * 1000) / 1000})">`;
  s += `<ellipse cx="0" cy="${f1(r * .85)}" rx="${f1(r * .9)}" ry="${f1(r * .18)}" fill="#000" opacity=".22" filter="url(#b12)"/>`;
  s += `<path d="M${-r} 0 Q${-r} ${-r * 1.02} ${-r * .1} ${-r} Q${r * .9} ${-r * 1.05} ${r * 1.02} ${-r * .1} Q${r * 1.05} ${r * .9} ${r * .05} ${r * .98} Q${-r * .95} ${r * 1.02} ${-r} 0Z" fill="url(#${id})" stroke="#9A2A62" stroke-width="${f1(r * .05)}"/>`;
  for (let i = 0; i < 4; i++) s += `<path d="M${f1(-r * .55 + i * r * .3)} ${f1(-r * .35)} q${f1(r * .08)} ${f1(r * .12)} ${f1(r * .16)} 0" stroke="#C24A86" stroke-width="${f1(r * .05)}" fill="none" opacity=".7" stroke-linecap="round"/>`;   // marcas de dente
  s += `<path d="M${f1(-r * .1)} ${f1(r * .35)} q${f1(r * .2)} ${f1(-r * .1)} ${f1(r * .4)} 0" stroke="#C24A86" stroke-width="${f1(r * .05)}" fill="none" opacity=".6" stroke-linecap="round"/>`;
  s += `<ellipse cx="${f1(-r * .38)}" cy="${f1(-r * .42)}" rx="${f1(r * .26)}" ry="${f1(r * .14)}" fill="#FFFFFF" opacity=".75" transform="rotate(-25 ${f1(-r * .38)} ${f1(-r * .42)})"/>`;
  for (let i = 0; i < 14; i++) if (ac > 0) { const a = i * 2.39, rr = r * (.3 + .6 * ((i * 37) % 10) / 10); s += `<rect x="${f1(Math.cos(a) * rr)}" y="${f1(Math.sin(a) * rr)}" width="${f1(r * .08)}" height="${f1(r * .08)}" fill="#FFFFFF" opacity="${op(ac * .9)}" transform="rotate(${i * 30} ${f1(Math.cos(a) * rr)} ${f1(Math.sin(a) * rr)})"/>`; }
  return s + '</g>';
}
// parede de carne com textura (dobras e brilho de muco)
function textura(x0, y0, w, h, t, cor = CARNE, n = 26) {
  let s = `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="${cor}"/>`;
  for (let i = 0; i < n; i++) { const x = x0 + ((i * 271) % w), y = y0 + ((i * 397) % h), r = 30 + (i % 5) * 18; s += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f1(r * .45)}" fill="${i % 2 ? CARNE_D : CARNE_L}" opacity=".35" transform="rotate(${(i * 47) % 180} ${x} ${y})"/>`; }
  for (let i = 0; i < 18; i++) { const x = x0 + ((i * 433 + Math.floor(t * 3) * 7) % w), y = y0 + ((i * 211) % h); s += `<ellipse cx="${x}" cy="${y}" rx="${8 + i % 4 * 4}" ry="${4 + i % 3 * 2}" fill="${MUCO}" opacity=".55"/>`; }
  return s;
}
const bolhas = (cx, cy, w, t, n = 18, cor = '#F4F8C0') => { let s = ''; for (let i = 0; i < n; i++) { const q = (t * (.4 + (i % 5) * .12) + i / n) % 1, x = cx + ((i * 97) % w) - w / 2 + Math.sin(t * 2 + i) * 10; s += `<circle cx="${f1(x)}" cy="${f1(cy - q * 260)}" r="${f1(5 + (i % 4) * 4)}" fill="none" stroke="${cor}" stroke-width="4" opacity="${op((1 - q) * .8)}"/>`; } return s; };

/* ===================== cenas ===================== */
// 1. a boca: corte lateral da cabeça; a língua joga o chiclete para a garganta
function sBoca(t) {
  const { L, d, k } = loc(t, 'boca'), [jx, jy] = hand2(t);
  setCam(lerp(560, 520, k) + jx, lerp(900, 1000, easeIn(k)) + jy, lerp(1.0, 1.35, easeIn(k)), lerp(-1, 1, k), [540, 960, 1]);
  let s = `<rect width="1080" height="1920" fill="#F2E4D8"/>`;
  s += lay(.2, `<rect x="-600" y="-600" width="2300" height="3200" fill="#F4E8DC"/>${Array.from({ length: 10 }, (_, i) => `<circle cx="${(i * 233) % 1300 - 100}" cy="${(i * 397) % 2000}" r="${60 + i % 3 * 40}" fill="#FFFFFF" opacity=".35"/>`).join('')}`);
  // cabeça de perfil (olhando para a direita) em silhueta, com a janela de corte por dentro
  const cab = `M180 300 Q200 60 470 40 Q760 30 820 260 Q840 360 800 430 L880 560 Q890 590 850 600 L840 660 Q860 690 820 720 L830 770 Q820 830 760 830 L700 840 Q680 900 640 960 L640 1500 L260 1500 L280 1000 Q170 880 170 650 Q150 470 180 300Z`;
  s += lay(1, `<path d="${cab}" fill="${NAVY}"/><path d="${cab}" fill="none" stroke="${RIM}" stroke-width="10" opacity=".8"/>`);
  const id = nid('cut'); def(`<clipPath id="${id}"><path d="M300 420 Q360 340 560 350 Q760 360 790 470 Q800 560 760 640 Q700 720 560 720 L560 1500 L420 1500 L420 800 Q300 760 290 620Z"/></clipPath>`);
  let corte = textura(200, 300, 700, 1300, t, '#B84A5A', 30);
  corte += `<path d="M310 520 Q400 420 600 430 Q760 440 790 520 L780 600 Q600 560 420 600 Q340 620 310 600Z" fill="#7A1E30"/>`;            // céu da boca / cavidade
  for (let i = 0; i < 5; i++) corte += `<path d="M${640 + i * 30} 440 l10 40 l14 -40Z M${640 + i * 30} 620 l10 -36 l14 36Z" fill="#FFF8F0" stroke="#D8C8B8" stroke-width="2"/>`;   // dentes
  const lingua = Math.sin(range(L, .2, 1.2) * Math.PI) * 40;
  corte += `<path d="M330 640 Q420 ${f1(560 - lingua)} 600 ${f1(580 - lingua * .6)} Q740 590 760 640 Q700 700 520 700 Q380 700 330 640Z" fill="#E8848E" stroke="#B84A5A" stroke-width="6"/>`;   // língua
  corte += `<path d="M420 700 L420 1500 L560 1500 L560 700 Q490 680 420 700Z" fill="#9A2A40"/><path d="M440 720 L440 1500 M540 720 L540 1500" stroke="#C25866" stroke-width="8"/>`;                       // garganta
  const vai = easeInOut(range(L, .25, d)), gx = lerp(640, 490, easeOut(range(vai, 0, .5))), gy = lerp(560, 1150, easeIn(vai));
  corte += goma(gx, gy, lerp(60, 52, vai), t, { sy: lerp(1, 1.25, range(vai, .5, 1)), sx: lerp(1, .85, range(vai, .5, 1)), rot: vai * 40 });
  s += lay(1, `<g clip-path="url(#${id})">${corte}</g><path d="M300 420 Q360 340 560 350 Q760 360 790 470 Q800 560 760 640 Q700 720 560 720 L560 1500 M420 1500 L420 800 Q300 760 290 620 L300 420" fill="none" stroke="#FFE4D0" stroke-width="6" stroke-dasharray="18 12" opacity=".8"/>`);
  return s + VIG(.6) + GRAINV(t);
}
// 2. o esôfago: anéis de músculo apertando em onda; a câmera desce junto
function sEsofago(t) {
  const { L, d, k } = loc(t, 'esofago'), [jx, jy] = hand2(t);
  const gy = lerp(500, 2600, easeInOut(k));
  setCam(540 + jx, gy + 80 + jy, 1.0, Math.sin(L * 1.5) * 2, [540, 960, 1]);
  let s = `<rect width="1080" height="1920" fill="#5A1020"/>`;
  let tubo = textura(-200, -400, 1500, 3800, t, '#9A2A40', 50);
  for (let y = -400; y < 3400; y += 60) {
    const onda = Math.exp(-(((y - (gy - 220)) / 160) ** 2)), w = 300 - 170 * onda;
    tubo += `<path d="M${540 - w - 120} ${y} Q${540 - w} ${y + 30} ${540 - w - 120} ${y + 60}" stroke="#C25866" stroke-width="22" fill="none"/><path d="M${540 + w + 120} ${y} Q${540 + w} ${y + 30} ${540 + w + 120} ${y + 60}" stroke="#C25866" stroke-width="22" fill="none"/>`;
    tubo += `<rect x="${540 - w}" y="${y}" width="${2 * w}" height="62" fill="#E8848E"/><rect x="${540 - w}" y="${y + 50}" width="${2 * w}" height="10" fill="#C25866" opacity=".45"/>`;
    tubo += `<path d="M${540 - w} ${y} L${540 - w} ${y + 60} M${540 + w} ${y} L${540 + w} ${y + 60}" stroke="#7A1E30" stroke-width="14"/>`;
  }
  for (let i = 0; i < 26; i++) { const y = -300 + i * 140, x = 540 + Math.sin(i * 1.7) * 160; tubo += `<ellipse cx="${f1(x)}" cy="${y}" rx="${14 + i % 3 * 6}" ry="8" fill="${MUCO}" opacity=".6"/>`; }
  s += lay(1, tubo);
  s += lay(1, goma(540, gy, 150, t, { sx: .9, sy: 1.15 + .08 * Math.sin(L * 6), rot: L * 30 }));
  for (let i = 0; i < 3; i++) { const yy = gy - 260 - i * 30; s += lay(1, `<path d="M300 ${yy} Q540 ${yy - 30} 780 ${yy}" stroke="#FFE0E4" stroke-width="6" fill="none" opacity="${op(.4 - i * .1)}"/>`); }
  return s + VIG(1) + GRAINV(t);
}
// estômago por dentro (fundo comum aos planos 3, 4 e 5)
function estomagoDentro(t, aperto = 0) {
  const sq = aperto * Math.sin(t * 3.2);
  let s = textura(-500, -500, 2100, 3000, t, '#B84A5A', 60);
  for (let i = 0; i < 9; i++) { const y = 200 + i * 170 + sq * 30 * Math.sin(i), a = 40 + sq * 40; s += `<path d="M-400 ${f1(y)} Q100 ${f1(y - a)} 540 ${f1(y + sq * 20)} Q980 ${f1(y + a)} 1500 ${f1(y)}" stroke="#E8848E" stroke-width="${30 + i * 2}" fill="none" opacity=".7"/><path d="M-400 ${f1(y + 18)} Q100 ${f1(y - a + 18)} 540 ${f1(y + sq * 20 + 18)} Q980 ${f1(y + a + 18)} 1500 ${f1(y + 18)}" stroke="#8A2236" stroke-width="10" fill="none" opacity=".6"/>`; }
  return s;
}
function acido(y, t, k = 1) {
  return `<path d="M-500 ${y} Q100 ${f1(y - 30 + Math.sin(t * 2) * 20)} 540 ${y} Q980 ${f1(y + 30 + Math.cos(t * 2.2) * 20)} 1600 ${y} L1600 2600 L-500 2600Z" fill="#C8D23A" opacity=".85"/><path d="M-500 ${y} Q100 ${f1(y - 30 + Math.sin(t * 2) * 20)} 540 ${y} Q980 ${f1(y + 30 + Math.cos(t * 2.2) * 20)} 1600 ${y}" stroke="#F4F8A0" stroke-width="10" fill="none"/>` + bolhas(540, y + 400, 1100, t, 24);
}
const comida = (t, k = 0, y0 = 1250) => {   // pedaços de comida boiando; k = quanto já se desfez
  const it = [['#E8C070', 300, 0, 120], ['#6AB04A', 760, 1, 90], ['#F2E8D0', 520, 2, 60], ['#C8783A', 880, 0, 100], ['#F2E8D0', 180, 2, 50], ['#D84A3A', 640, 1, 70]];
  return it.map(([c, x, tipo, r], i) => { const rr = r * (1 - .75 * k), y = y0 + Math.sin(t * 1.5 + i) * 30 + i * 40, xx = x + Math.sin(t + i) * 30; return tipo === 1 ? `<path d="M${xx - rr} ${y} Q${xx} ${y - rr} ${xx + rr} ${y} Q${xx} ${y + rr * .6} ${xx - rr} ${y}Z" fill="${c}" stroke="#2A5A1A" stroke-width="4"/>` : tipo === 2 ? Array.from({ length: 4 }, (_, j) => `<ellipse cx="${xx + j * rr * .7}" cy="${y + (j % 2) * 14}" rx="${f1(rr * .35)}" ry="${f1(rr * .18)}" fill="${c}" stroke="#B8A888" stroke-width="3"/>`).join('') : `<rect x="${xx - rr}" y="${y - rr * .7}" width="${2 * rr}" height="${f1(1.4 * rr)}" rx="${f1(rr * .3)}" fill="${c}" stroke="#8A5A2A" stroke-width="4"/>`; }).join('');
};
// 3. cai no estômago: splash no ácido
function sEstomago(t) {
  const { L, d, k } = loc(t, 'estomago'), [jx, jy] = hand2(t);
  setCam(540 + jx, lerp(900, 1050, easeInOut(k)) + jy, lerp(1.0, 1.12, k), 0, [540, 960, 1]);
  let s = `<rect width="1080" height="1920" fill="#7A1E30"/>`;
  s += lay(.6, estomagoDentro(t));
  s += lay(.6, `<path d="M380 -200 L700 -200 L640 200 Q540 260 440 200Z" fill="#7A1E30"/><ellipse cx="540" cy="200" rx="110" ry="40" fill="#5A1020"/>`);   // a boca do estômago (de onde a bola cai)
  const cai = easeIn(range(L, 0, .9)), gy = lerp(180, 1180, cai), dentro = L > .9;
  s += lay(1, acido(1180, t) + comida(t, 0));
  s += lay(1, goma(540, dentro ? 1180 + Math.sin(L * 3) * 12 : gy, 95, t, { acucar: 1, rot: L * 60 }));
  if (L > .9) { const q = range(L, .9, 1.7); for (let i = 0; i < 16; i++) { const a = Math.PI + (i / 15) * Math.PI; s += lay(1, `<circle cx="${f1(540 + Math.cos(a) * 240 * q)}" cy="${f1(1180 + Math.sin(a) * 300 * q + q * q * 260)}" r="${f1(14 * (1 - q) + 3)}" fill="#E8F070" opacity="${op(1 - q)}"/>`); } s += lay(1, `<ellipse cx="540" cy="1190" rx="${f1(120 + 300 * q)}" ry="${f1(26 + 60 * q)}" fill="none" stroke="#F4F8A0" stroke-width="8" opacity="${op(1 - q)}"/>`); }
  return s + VIG(.9) + GRAINV(t);
}
// 4. o ácido arranca o açúcar e o sabor (macro): a goma fica
function sAcido(t) {
  const { L, d, k } = loc(t, 'acido'), [jx, jy] = hand2(t);
  setCam(540 + jx, 960 + jy, lerp(1.0, 1.15, easeInOut(k)), lerp(2, -1, k), [540, 960, 1]);
  let s = `<rect width="1080" height="1920" fill="#9AA02A"/>`;
  s += lay(.3, blur(10, `<rect x="-500" y="-500" width="2100" height="3000" fill="#A8B032"/>${bolhas(540, 1700, 1400, t, 30, '#E8F0A0')}`));
  const ac = 1 - easeInOut(range(L, .2, 2.2));
  s += lay(1, goma(540, 960, 300, t, { acucar: ac, rot: Math.sin(L) * 8 }));
  // cristais de açúcar e pontinhos de sabor se soltando e chiando
  for (let i = 0; i < 26; i++) { const q = range(L, .15 + (i % 9) * .2, 1.0 + (i % 9) * .2), a = i * 2.39, r0 = 300; if (q > 0 && q < 1) { const x = 540 + Math.cos(a) * (r0 * .8 + q * 260), y = 960 + Math.sin(a) * (r0 * .8 + q * 260) - q * 120; s += lay(1, i % 3 ? `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(22 * (1 - q) + 4)}" height="${f1(22 * (1 - q) + 4)}" fill="#FFFFFF" transform="rotate(${f1(q * 300 + i * 20)} ${f1(x)} ${f1(y)})" opacity="${op(1 - q)}"/>` : `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(14 * (1 - q) + 3)}" fill="${['#FF5AA0', '#7AD0FF', '#FFE05A'][i % 3]}" opacity="${op(1 - q)}"/>`); } }
  s += lay(1, bolhas(540, 1300, 700, t, 20, '#FFFFFF'));
  return s + VIG(.9) + GRAINV(t);
}
// 5. amassada horas e horas: a comida some, a goma continua
function sAmassa(t) {
  const { L, d, k } = loc(t, 'amassa'), [jx, jy] = hand2(t);
  const sq = Math.sin(L * 3.2);
  setCam(540 + jx + sq * 6, 1000 + jy, lerp(1.05, .95, k) + sq * .02, sq * 1.5, [540, 960, 1]);
  let s = `<rect width="1080" height="1920" fill="#7A1E30"/>`;
  s += lay(.6, estomagoDentro(t, 1));
  s += lay(1, acido(1050 + sq * 40, t) + comida(t * 1.6, easeIn(k), 1150));
  s += lay(1, goma(540 + Math.sin(L * 2.2) * 120, 1180 + Math.cos(L * 2.6) * 80, 95, t, { rot: L * 120, sx: 1 + sq * .12, sy: 1 - sq * .12 }));
  // relógio na parede do estômago? não: o progresso é a comida diminuindo; luzinhas de horas passando
  for (let i = 0; i < 6; i++) { const q = (L * .9 + i / 6) % 1; s += lay(1, `<path d="M${f1(80 + i * 170)} ${f1(300 - q * 200)} q30 40 0 80" stroke="#FFE0E4" stroke-width="6" fill="none" opacity="${op(Math.sin(q * Math.PI) * .4)}"/>`); }
  return s + VIG(.9) + GRAINV(t);
}
// 6. o corpo inteiro (pull-out): o caminho acende e a fita métrica mede o intestino
function tratoDigestivo(t, brilho, ponto) {   // coordenadas de um corpo em pé de 1700 de altura, pés em y = 1800, centro x = 540
  const esof = 'M540 420 L540 760', est = 'M540 760 Q640 760 650 840 Q660 940 560 960 Q500 970 490 920',
    del = 'M490 930 Q420 960 430 1010 Q440 1060 520 1050 Q600 1040 620 1080 Q630 1120 560 1130 Q480 1140 470 1180 Q470 1220 540 1220 Q620 1220 630 1260 Q620 1300 560 1300',
    gro = 'M560 1300 Q680 1310 690 1240 L690 1000 Q690 960 640 960 Q520 970 430 980 Q380 990 390 1040 L390 1260 Q390 1320 460 1330 Q520 1340 540 1380';
  let s = `<path d="${gro}" stroke="#C88A5A" stroke-width="44" fill="none" stroke-linecap="round" opacity=".9"/><path d="${gro}" stroke="#E8B080" stroke-width="16" fill="none" stroke-dasharray="6 26" stroke-linecap="round"/>`;
  s += `<path d="${esof}" stroke="#E8848E" stroke-width="22" fill="none" stroke-linecap="round"/><path d="${est}" stroke="#E8848E" stroke-width="40" fill="none" stroke-linecap="round"/><path d="${del}" stroke="#F0A0A8" stroke-width="22" fill="none" stroke-linecap="round"/>`;
  s += `<path d="${del}" stroke="#FFF4C0" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="${f1(1400 * brilho)} 2000" opacity=".9"/>`;
  return s;
}
function sCorpo(t) {
  const { L, d, k } = loc(t, 'corpo'), [jx, jy] = hand2(t);
  const sai = easeInOut(range(L, 0, 1.4));
  setCam(lerp(540, 540, sai) + jx, lerp(1100, 1060, sai) + jy, lerp(3.2, 1.0, sai), 0, [540, 960, 1]);
  let s = `<rect width="1080" height="1920" fill="#3A4E78"/>`;
  s += lay(.2, `${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 197) % 1300 - 100}" cy="${(i * 331) % 2000}" r="${3 + i % 3 * 2}" fill="#6A7AA8" opacity=".5"/>`).join('')}`);
  const corpo = sil({ x: 540, y: 1800, s: 1.7, kind: 'homem', col: NAVY, rim: RIM, rimK: [1, -.35], shadow: .3 });
  s += lay(1, corpo);
  s += lay(1, `<ellipse cx="540" cy="1050" rx="230" ry="420" fill="#2A3450" opacity=".8"/>` + tratoDigestivo(t, easeInOut(range(L, .9, d)), 0));
  // fita métrica ao lado do intestino com "6 m"
  const fita = easeOut(range(L, 1.2, 2.0));
  s += lay(1, `<g opacity="${op(fita)}"><rect x="700" y="1060" width="${f1(260 * fita)}" height="70" rx="8" fill="#F2C840" stroke="#8A6A10" stroke-width="5"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${710 + i * 20}" y="1060" width="4" height="${i % 5 ? 20 : 34}" fill="#5A4210" opacity="${op(fita)}"/>`).join('')}<text x="${f1(700 + 130 * fita)}" y="1118" font-size="40" fill="#3A2A08" text-anchor="middle">6 m</text><path d="M700 1095 L640 1095" stroke="#F2C840" stroke-width="8"/></g>`);
  // a bola rosa brilhando no ponto em que está (entrando no intestino)
  s += lay(1, `<circle cx="490" cy="930" r="${f1(26 + 6 * Math.sin(t * 8))}" fill="#FF8AC4" stroke="#FFFFFF" stroke-width="4"/><circle cx="490" cy="930" r="60" fill="url(#gWarm)" opacity=".6"/>`);
  return s + VIG(.8) + GRAINV(t);
}
// 7. intestino delgado: vilosidades e a bola espremida, câmera acompanhando
function sIntestino(t) {
  const { L, d, k } = loc(t, 'intestino'), [jx, jy] = hand2(t);
  const gx = lerp(-300, 1500, k);
  setCam(gx + jx, 960 + Math.sin(k * 6) * 40 + jy, 1.05, Math.sin(k * 6) * 4, [540, 960, 1]);
  let s = `<rect width="1080" height="1920" fill="#5A1020"/>`;
  let tb = textura(-900, 300, 3300, 1300, t, '#C25866', 70);
  tb += `<path d="M-900 640 Q0 560 900 640 Q1800 720 2400 640 L2400 1280 Q1800 1360 900 1280 Q0 1200 -900 1280Z" fill="#F0A0A8"/>`;
  for (let i = 0; i < 90; i++) { const x = -880 + i * 37, yT = 640 + Math.sin(x / 300) * 40, yB = 1280 + Math.sin(x / 300 + 1) * 40, h = 60 + (i % 4) * 12, sw = Math.sin(t * 2 + i) * 8; tb += `<path d="M${x} ${f1(yT)} q${f1(sw)} ${h * .5} 0 ${h}" stroke="#E8848E" stroke-width="20" fill="none" stroke-linecap="round"/><path d="M${x} ${f1(yB)} q${f1(sw)} ${-h * .5} 0 ${-h}" stroke="#E8848E" stroke-width="20" fill="none" stroke-linecap="round"/>`; }
  const onda = Math.sin(L * 9);
  s += lay(1, tb);
  s += lay(1, goma(gx, 960 + Math.sin(k * 6) * 40, 140, t, { sx: 1.25 + onda * .08, sy: .85 - onda * .06, rot: L * 40 }));
  for (let i = 0; i < 3; i++) { const xx = gx - 260 - i * 40; s += lay(1, `<path d="M${xx} 660 Q${xx - 40} 960 ${xx} 1260" stroke="#FFE0E4" stroke-width="8" fill="none" opacity="${op(.45 - i * .12)}"/>`); }
  return s + VIG(1) + GRAINV(t);
}
// 8. intestino grosso: bolsas, bactérias e o resto da comida
function sGrosso(t) {
  const { L, d, k } = loc(t, 'grosso'), [jx, jy] = hand2(t);
  const gy = lerp(300, 2400, easeInOut(k));
  setCam(540 + jx, gy + 40 + jy, lerp(1.0, 1.08, k), lerp(-3, 3, k), [540, 960, 1]);
  let s = `<rect width="1080" height="1920" fill="#4A1820"/>`;
  let tb = textura(-400, -300, 1900, 3400, t, '#A8584A', 60);
  for (let y = -300; y < 3000; y += 220) tb += `<path d="M60 ${y} Q-20 ${y + 110} 60 ${y + 220} L1020 ${y + 220} Q1100 ${y + 110} 1020 ${y}Z" fill="#D8907A"/><path d="M60 ${y} Q540 ${y + 40} 1020 ${y}" stroke="#8A3A30" stroke-width="16" fill="none"/>`;   // bolsas (haustros)
  for (let i = 0; i < 40; i++) { const y = -200 + i * 80, x = 200 + ((i * 137) % 680); tb += `<ellipse cx="${x}" cy="${y}" rx="${30 + i % 4 * 10}" ry="${20 + i % 3 * 8}" fill="#8A5A30" opacity=".75"/>`; }   // o que sobrou da comida
  for (let i = 0; i < 30; i++) { const y = -200 + ((i * 271) % 3200) + Math.sin(t * 2 + i) * 20, x = 120 + ((i * 193) % 840) + Math.cos(t * 1.7 + i) * 20; tb += `<g transform="translate(${f1(x)},${f1(y)}) rotate(${(i * 40 + t * 60) % 360})"><rect x="-16" y="-6" width="32" height="12" rx="6" fill="${['#6AC86A', '#7AA8FF', '#FFB04A', '#C88AE8'][i % 4]}"/></g>`; }   // bactérias do intestino
  s += lay(1, tb);
  s += lay(1, goma(540 + Math.sin(L * 2) * 60, gy, 130, t, { rot: L * 50 }));
  return s + VIG(1) + GRAINV(t);
}
// 9. a saída: plongée no vaso; a bola cai na água e vira o quadro do começo
function sSaida(t) {
  const { L, d, k } = loc(t, 'saida'), [jx, jy] = hand2(t);
  const cai = range(L, 1.6, 2.2), push = easeInOut(range(L, 2.6, d));
  setCam(540 + jx, lerp(1000, 1000, push) + jy, lerp(1.0, 2.6, push), 0, [540, 960, 1]);
  let s = `<rect width="1080" height="1920" fill="#E6EEF2"/>`;
  s += lay(.6, `${Array.from({ length: 9 }, (_, i) => `<rect x="-600" y="${-600 + i * 400}" width="2300" height="6" fill="#B8C6CE"/><rect x="${-600 + i * 400}" y="-600" width="6" height="3200" fill="#B8C6CE"/>`).join('')}
    <g transform="translate(160,1640) rotate(-12)"><rect x="-90" y="-40" width="180" height="80" rx="8" fill="#E8E0F0" stroke="#9A8AB0" stroke-width="5"/><rect x="-80" y="-30" width="160" height="60" rx="6" fill="#1B2A4A"/><text x="0" y="12" font-size="34" fill="#FF8AC4" text-anchor="middle">HRYZ</text></g>`);   // embalagem do chiclete no chão
  s += lay(1, `<ellipse cx="540" cy="1000" rx="430" ry="560" fill="#FFFFFF" stroke="#B8C4CC" stroke-width="10"/><ellipse cx="540" cy="1010" rx="330" ry="440" fill="#F2F6F8" stroke="#D0D8DE" stroke-width="8"/>
    <ellipse cx="540" cy="1060" rx="230" ry="300" fill="#9AD0EA"/><ellipse cx="540" cy="1060" rx="160" ry="210" fill="#7AC0E2"/><path d="M420 900 q60 -20 120 0" stroke="#FFFFFF" stroke-width="10" fill="none" opacity=".7"/>
    <rect x="300" y="300" width="480" height="140" rx="30" fill="#FFFFFF" stroke="#B8C4CC" stroke-width="10"/>`);
  if (cai < 1 && L > 1.6) s += lay(1, goma(540, lerp(-200, 1060, easeIn(cai)), 70, t, { rot: cai * 200 }));
  if (cai >= 1) {
    const q = range(L, 2.2, 3.2);
    for (let i = 0; i < 4; i++) { const qq = (q + i * .25) % 1; s += lay(1, `<ellipse cx="540" cy="1062" rx="${f1(80 + qq * 160)}" ry="${f1(100 + qq * 200)}" fill="none" stroke="#E8F8FF" stroke-width="5" opacity="${op((1 - qq) * (1 - q * .5))}"/>`); }
    if (q < 1) for (let i = 0; i < 12; i++) { const a = Math.PI + (i / 11) * Math.PI; s += lay(1, `<circle cx="${f1(540 + Math.cos(a) * 160 * q)}" cy="${f1(1060 + Math.sin(a) * 220 * q + q * q * 200)}" r="${f1(10 * (1 - q) + 2)}" fill="#E8F8FF" opacity="${op(1 - q)}"/>`); }
    s += lay(1, goma(540, 1062 + Math.sin(L * 2.4) * 6, 70, t, { rot: Math.sin(L) * 8 }));
  }
  return s + VIG(.6) + GRAINV(t);
}
const FN = { boca: sBoca, esofago: sEsofago, estomago: sEstomago, acido: sAcido, amassa: sAmassa, corpo: sCorpo, intestino: sIntestino, grosso: sGrosso, saida: sSaida };
