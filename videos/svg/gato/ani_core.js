const ANI = (() => {
/* ===================== personagens estilo anime (originais) ===================== */
const OL = '#1A1220';
const f1 = v => Math.round(v * 10) / 10;
const mix = (a, b, k) => { const h = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); const A = h(a), B = h(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
let UID = 0; const uid = p => p + (UID++);
let DEFS = [];
/* ---------- olhos ---------- */
function eye(x, side, o) {
  const w = o.eyeW || 54, h = o.eyeH || 62, iris = o.iris || '#3A7AD8', st = o.eyeStyle || 'round', em = o.emo || 'neutro';
  const id = uid('ir'); DEFS.push(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(iris, '#000000', .55)}"/><stop offset=".55" stop-color="${iris}"/><stop offset="1" stop-color="${mix(iris, '#FFFFFF', .55)}"/></linearGradient>`);
  const y = o.eyeY || 18, s = side; let g = `<g transform="translate(${x},${y}) scale(${s},1)">`;
  if (st === 'line' || em === 'feliz2') return g + `<path d="M${-w * .5} 4 Q0 ${-h * .35} ${w * .5} 4" stroke="${OL}" stroke-width="7" fill="none" stroke-linecap="round"/></g>`;
  if (em === 'fechado') return g + `<path d="M${-w * .5} 0 Q0 ${h * .25} ${w * .5} 0" stroke="${OL}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M${w * .45} -2 l12 -8" stroke="${OL}" stroke-width="4"/></g>`;
  if (st === 'dot') return g + `<ellipse cx="0" cy="0" rx="9" ry="13" fill="${OL}"/><circle cx="-3" cy="-5" r="3" fill="#fff"/></g>`;
  // forma do olho (branco)
  let top = -h * .5, bot = h * .5, tilt = 0;
  if (st === 'sharp') { top = -h * .32; bot = h * .32; tilt = -10; }
  if (st === 'narrow') { top = -h * .2; bot = h * .2; tilt = -14; }
  if (em === 'bravo') tilt -= 8;
  if (em === 'choque') { top *= 1.15; bot *= 1.15; }
  const wid = uid('ew');
  const shape = `M${-w * .5} ${f1(tilt * .2)} Q${-w * .45} ${f1(top)} ${f1(w * .1)} ${f1(top - tilt * .4)} Q${w * .5} ${f1(top * .9 - tilt)} ${w * .55} ${f1(-tilt * .2)} Q${w * .4} ${f1(bot)} 0 ${f1(bot)} Q${-w * .45} ${f1(bot)} ${-w * .5} ${f1(tilt * .2)}Z`;
  DEFS.push(`<clipPath id="${wid}"><path d="${shape}"/></clipPath>`);
  g += `<path d="${shape}" fill="#FFFFFF"/>`;
  const ir = em === 'choque' ? .3 : 1, irw = w * .38 * (st === 'sharp' ? .9 : 1), irh = h * .46;
  const lx = (o.look || 0) * 6;
  g += `<g clip-path="url(#${wid})"><ellipse cx="${lx}" cy="${f1(h * .04)}" rx="${f1(irw * (em === 'choque' ? .55 : 1))}" ry="${f1(irh * (em === 'choque' ? .55 : 1))}" fill="url(#${id})" stroke="${mix(iris, '#000000', .6)}" stroke-width="3"/>`;
  if (em !== 'choque') g += `<ellipse cx="${lx}" cy="${f1(h * .06)}" rx="${f1(irw * .45)}" ry="${f1(irh * .5)}" fill="${mix(iris, '#000000', .75)}"/><ellipse cx="${f1(lx - irw * .38)}" cy="${f1(-h * .1)}" rx="${f1(irw * .32)}" ry="${f1(irh * .26)}" fill="#FFFFFF"/><circle cx="${f1(lx + irw * .4)}" cy="${f1(h * .22)}" r="${f1(irw * .15)}" fill="#FFFFFF"/>`;
  else g += `<circle cx="${lx}" cy="${f1(h * .04)}" r="4" fill="#FFFFFF"/>`;
  g += `<path d="${shape}" fill="none" stroke="#000" stroke-width="10" opacity=".08"/><rect x="${-w}" y="${f1(top - 6)}" width="${w * 2}" height="14" fill="${mix(o.skin, '#000000', .25)}" opacity=".35"/></g>`;
  // pálpebra superior grossa + cílios
  g += `<path d="M${-w * .56} ${f1(tilt * .2 + 4)} Q${-w * .45} ${f1(top - 2)} ${f1(w * .1)} ${f1(top - tilt * .4 - 3)} Q${w * .5} ${f1(top * .9 - tilt - 2)} ${w * .62} ${f1(-tilt * .2 + 2)}" stroke="${OL}" stroke-width="${o.lash ? 9 : 7}" fill="none" stroke-linecap="round"/>`;
  if (o.lash) g += `<path d="M${-w * .5} ${f1(tilt * .2 - 6)} l-14 -10 M${-w * .56} ${f1(tilt * .2 + 2)} l-16 -2" stroke="${OL}" stroke-width="5" stroke-linecap="round"/>`;
  g += `<path d="M${-w * .3} ${f1(bot + 2)} Q0 ${f1(bot + 6)} ${w * .3} ${f1(bot + 1)}" stroke="${OL}" stroke-width="3" fill="none" opacity=".6"/>`;
  if (em === 'choro') g += `<path d="M${w * .1} ${f1(bot)} Q${w * .3} ${f1(bot + 60)} ${w * .1} ${f1(bot + 130)}" stroke="#8AD0FF" stroke-width="12" fill="none" stroke-linecap="round" opacity=".85"/>`;
  return g + '</g>';
}
function brow(x, side, o) {
  const em = o.emo || 'neutro', y = (o.eyeY || 18) - (o.eyeH || 62) * .62 - 8;
  let a = o.browA || 0; if (em === 'bravo') a = 22; if (em === 'triste' || em === 'choro') a = -18; if (em === 'choque') a = -6;
  const dy = em === 'choque' ? -12 : 0;
  return `<g transform="translate(${x},${y + dy}) scale(${side},1) rotate(${a})"><path d="M-26 4 Q0 -8 28 0" stroke="${o.browC || OL}" stroke-width="${o.browW || 7}" fill="none" stroke-linecap="round"/></g>`;
}
function mouth(o) {
  const em = o.emo || 'neutro', y = o.mouthY || 112, m = o.mouth || 'leve';
  const BIG =  `<path d="M-30 ${y - 4} Q0 ${y + 40} 30 ${y - 4}Z" fill="#7A1E2A" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/><path d="M-18 ${y + 16} Q0 ${y + 32} 18 ${y + 16}" fill="#E8707A"/><path d="M-26 ${y - 2} L26 ${y - 2} L22 ${y + 5} L-22 ${y + 5}Z" fill="#FFFFFF"/>`;
  if (em === 'bravo') return `<path d="M-26 ${y + 6} L-12 ${y - 6} L12 ${y - 6} L26 ${y + 6} L12 ${y + 14} L-12 ${y + 14}Z" fill="#7A1E2A" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/><path d="M-12 ${y - 6} L12 ${y - 6} L10 ${y} L-10 ${y}Z" fill="#fff"/>`;
  if (em === 'choque') return `<ellipse cx="0" cy="${y + 6}" rx="16" ry="22" fill="#7A1E2A" stroke="${OL}" stroke-width="4"/>`;
  if (em === 'triste' || em === 'choro') return `<path d="M-20 ${y + 8} Q0 ${y - 8} 20 ${y + 8}" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  if (em === 'feliz' || em === 'feliz2' || m === 'grande') return BIG;
  if (m === 'smirk') return `<path d="M-18 ${y + 2} Q8 ${y + 8} 26 ${y - 8}" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  if (m === 'gato') return `<path d="M-20 ${y - 2} Q-10 ${y + 10} 0 ${y} Q10 ${y + 10} 20 ${y - 2}" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  if (m === 'reto') return `<path d="M-14 ${y + 2} H14" stroke="${OL}" stroke-width="5" stroke-linecap="round"/>`;
  return `<path d="M-16 ${y} Q0 ${y + 10} 16 ${y}" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
}
/* ---------- cabelos (atrás e franja) ---------- */
function hairBack(o) {
  const c = o.hair, d = mix(c, '#000000', .3);
  switch (o.hairStyle) {
    case 'longo': return `<path d="M-128 -60 Q-150 120 -140 330 Q-90 360 -40 300 L40 300 Q90 360 140 330 Q150 120 128 -60Z" fill="${d}" stroke="${OL}" stroke-width="6"/>`;
    case 'chanel': return `<path d="M-124 -40 Q-140 90 -118 170 Q-70 190 -40 150 L40 150 Q70 190 118 170 Q140 90 124 -40Z" fill="${d}" stroke="${OL}" stroke-width="6"/>`;
    case 'grande': case 'baguncado': return `<path d="M-120 -40 L-150 60 L-118 70 L-140 150 L-90 120 L-70 180 L70 180 L90 120 L140 150 L118 70 L150 60 L120 -40Z" fill="${d}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/>`;
    case 'velho': return `<path d="M-112 -10 Q-136 60 -110 110 L-90 60 Z M112 -10 Q136 60 110 110 L90 60Z" fill="${d}" stroke="${OL}" stroke-width="5"/>`;
    case 'trancas': return `<path d="M-110 -110 Q-230 -60 -200 120 Q-190 220 -150 290 Q-170 160 -130 40Z" fill="${d}" stroke="${OL}" stroke-width="6"/><path d="M110 -110 Q230 -60 200 120 Q190 220 150 290 Q170 160 130 40Z" fill="${d}" stroke="${OL}" stroke-width="6"/>`;
    case 'coque': case 'velhaCoque': return `<circle cx="0" cy="-170" r="62" fill="${d}" stroke="${OL}" stroke-width="6"/><path d="M-40 -200 Q0 -230 40 -200" stroke="${mix(c, '#FFFFFF', .3)}" stroke-width="8" fill="none"/>`;
    case 'lateral': return `<path d="M-122 -40 Q-136 80 -112 140 L112 140 Q136 80 122 -40Z" fill="${d}" stroke="${OL}" stroke-width="6"/>`;
    case 'longoM': return `<path d="M-124 -50 Q-140 100 -130 230 L-60 210 L60 210 L130 230 Q140 100 124 -50Z" fill="${d}" stroke="${OL}" stroke-width="6"/>`;
    case 'rabo': return `<path d="M60 -140 Q190 -120 170 40 Q160 160 120 220 Q130 100 100 0Z" fill="${d}" stroke="${OL}" stroke-width="6"/>`;
    default: return '';
  }
}
function hairFront(o) {
  const c = o.hair, l = mix(c, '#FFFFFF', .35), dk = mix(c, '#000000', .25);
  let h = '';
  switch (o.hairStyle) {
    case 'espetado': h = `<path d="M-118 10 L-150 -40 L-112 -50 L-160 -120 L-96 -112 L-110 -190 L-40 -150 L-20 -230 L30 -160 L80 -220 L84 -150 L150 -170 L118 -100 L170 -70 L118 -30 L140 30 L100 0 L86 -60 L50 -20 L30 -70 L0 -10 L-20 -70 L-50 -10 L-70 -60 L-90 10Z" fill="${c}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><path d="M-100 -120 Q-20 -170 70 -140" stroke="${l}" stroke-width="12" fill="none" stroke-linecap="round" opacity=".8"/>`; break;
    case 'chanel': h = `<path d="M-126 30 Q-136 -150 0 -160 Q136 -150 126 30 L104 -10 L90 -40 L70 -6 L50 -44 L24 -4 L0 -46 L-26 -4 L-50 -44 L-72 -6 L-92 -40 L-106 -10Z" fill="${c}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><path d="M-90 -110 Q0 -150 90 -110" stroke="${l}" stroke-width="10" fill="none" stroke-linecap="round" opacity=".8"/><path d="M-126 30 L-130 160 L-104 150 L-110 40Z M126 30 L130 160 L104 150 L110 40Z" fill="${c}" stroke="${OL}" stroke-width="5"/>`; break;
    case 'longo': h = `<path d="M-130 60 Q-140 -150 0 -162 Q140 -150 130 60 L112 0 Q80 -60 40 -40 L30 -80 Q0 -40 -30 -76 L-50 -30 Q-90 -50 -112 10Z" fill="${c}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><path d="M-80 -120 Q0 -160 80 -120" stroke="${l}" stroke-width="10" fill="none" stroke-linecap="round" opacity=".8"/><path d="M-128 40 Q-150 160 -120 260 L-100 250 Q-120 150 -106 50Z M128 40 Q150 160 120 260 L100 250 Q120 150 106 50Z" fill="${c}" stroke="${OL}" stroke-width="5"/>`; break;
    case 'grande': h = `<path d="M-122 40 L-140 -60 Q-110 -170 0 -165 Q120 -170 138 -60 L124 40 L100 -40 L84 -6 L56 -60 L40 2 L12 -52 L-14 -4 L-36 -60 L-60 -8 L-82 -50 L-104 0Z" fill="${c}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><path d="M-60 -120 Q10 -150 80 -110" stroke="${l}" stroke-width="10" fill="none" stroke-linecap="round" opacity=".6"/><path d="M-122 30 Q-150 120 -130 210 L-104 190 Q-118 120 -106 50Z M122 30 Q150 120 130 210 L104 190 Q118 120 106 50Z" fill="${c}" stroke="${OL}" stroke-width="5"/>`; break;
    case 'baguncado': h = `<path d="M-122 40 L-140 -60 Q-110 -170 0 -165 Q120 -170 138 -60 L124 40 L96 -30 L80 40 L50 -50 L40 60 L10 -40 L-20 30 L-36 -50 L-60 20 L-80 -40 L-100 30Z" fill="${c}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><path d="M-60 -120 Q10 -150 80 -110" stroke="${l}" stroke-width="10" fill="none" stroke-linecap="round" opacity=".6"/>`; break;
    case 'penteado': h = `<path d="M-120 -10 Q-130 -150 0 -168 Q140 -160 128 -20 Q110 -100 40 -110 Q-40 -114 -90 -70 Q-110 -40 -120 -10Z" fill="${c}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><path d="M30 -100 Q60 -40 40 30 Q80 -30 70 -100Z" fill="${c}" stroke="${OL}" stroke-width="5"/><path d="M-70 -120 Q20 -150 100 -100" stroke="${l}" stroke-width="10" fill="none" opacity=".7" stroke-linecap="round"/>`; break;
    case 'rabo': h = `<path d="M-124 20 Q-136 -150 0 -164 Q136 -150 124 20 L108 -20 Q70 -70 30 -60 L20 -100 Q-10 -60 -40 -90 L-50 -40 Q-90 -60 -108 -10Z" fill="${c}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><path d="M-80 -120 Q0 -160 80 -120" stroke="${l}" stroke-width="10" fill="none" opacity=".8" stroke-linecap="round"/><circle cx="96" cy="-120" r="16" fill="#E83A6A" stroke="${OL}" stroke-width="4"/>`; break;
    case 'topete': h = `<path d="M-110 -6 Q-126 -110 -84 -146 Q-70 -206 -10 -216 Q60 -230 120 -196 Q136 -186 140 -168 Q118 -176 100 -170 Q132 -140 120 -96 Q116 -50 110 -6 Q98 -70 60 -88 Q20 -100 -20 -92 Q-70 -84 -96 -50 Q-104 -30 -110 -6Z" fill="${c}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><path d="M-70 -150 Q0 -210 100 -184" stroke="${l}" stroke-width="12" fill="none" stroke-linecap="round" opacity=".85"/><path d="M-50 -120 Q10 -170 96 -150 M-30 -100 Q30 -136 104 -120" stroke="${dk}" stroke-width="5" fill="none" opacity=".6"/>`; break;
    case 'curto': h = `<path d="M-112 -20 Q-126 -150 0 -160 Q126 -150 112 -20 L96 -60 L76 -40 L60 -76 L36 -50 L14 -84 L-10 -52 L-34 -82 L-56 -48 L-76 -74 L-96 -40Z" fill="${c}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><path d="M-80 -120 Q0 -150 80 -120" stroke="${l}" stroke-width="10" fill="none" stroke-linecap="round" opacity=".8"/>`; break;
    case 'lateral': h = `<path d="M-120 0 Q-136 -150 0 -164 Q136 -150 122 10 Q118 -70 70 -90 Q110 -20 92 90 Q70 30 40 10 Q20 -40 -20 -70 Q-70 -80 -120 0Z" fill="${c}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><path d="M-60 -126 Q20 -150 90 -100" stroke="${l}" stroke-width="10" fill="none" stroke-linecap="round" opacity=".7"/>`; break;
    case 'trancas': h = `<path d="M-124 20 Q-136 -150 0 -164 Q136 -150 124 20 L106 -26 L84 -10 L66 -50 L40 -14 L18 -56 L-6 -14 L-30 -54 L-52 -12 L-76 -50 L-96 -10 L-108 -26Z" fill="${c}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><path d="M-80 -120 Q0 -160 80 -120" stroke="${l}" stroke-width="10" fill="none" stroke-linecap="round" opacity=".8"/><circle cx="-112" cy="-104" r="16" fill="${o.acc || '#FFD23A'}" stroke="${OL}" stroke-width="4"/><circle cx="112" cy="-104" r="16" fill="${o.acc || '#FFD23A'}" stroke="${OL}" stroke-width="4"/>`; break;
    case 'coque': h = `<path d="M-122 30 Q-136 -150 0 -162 Q136 -150 122 30 Q112 -40 80 -60 L70 -20 L50 -64 L24 -24 L0 -66 L-24 -24 L-50 -64 L-70 -20 L-80 -60 Q-112 -40 -122 30Z" fill="${c}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><path d="M-80 -120 Q0 -158 80 -120" stroke="${l}" stroke-width="10" fill="none" stroke-linecap="round" opacity=".8"/><path d="M-122 30 Q-136 100 -116 140 L-104 40Z M122 30 Q136 100 116 140 L104 40Z" fill="${c}" stroke="${OL}" stroke-width="5"/>`; break;
    case 'velhaCoque': h = `<path d="M-112 10 Q-130 -150 0 -158 Q130 -150 112 10 Q100 -80 0 -96 Q-100 -80 -112 10Z" fill="${c}" stroke="${OL}" stroke-width="6"/><path d="M-90 -40 Q-60 -110 0 -110 M90 -40 Q60 -110 0 -110 M-60 -60 Q-30 -120 0 -120" stroke="${dk}" stroke-width="4" fill="none" opacity=".5"/>`; break;
    case 'longoM': h = `<path d="M-128 50 Q-140 -150 0 -164 Q140 -150 128 50 L110 -20 Q90 -70 50 -60 Q30 10 10 40 Q4 -20 -10 -60 Q-60 -80 -100 -30 L-112 30Z" fill="${c}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><path d="M-80 -120 Q0 -158 80 -120" stroke="${l}" stroke-width="10" fill="none" stroke-linecap="round" opacity=".7"/><path d="M-128 40 Q-146 150 -126 230 L-108 220 L-110 50Z M128 40 Q146 150 126 230 L108 220 L110 50Z" fill="${c}" stroke="${OL}" stroke-width="5"/>`; break;
    case 'velho': h = `<path d="M-108 -40 Q-100 -140 0 -150 Q100 -140 108 -40" fill="${o.skin}" stroke="${OL}" stroke-width="6"/><path d="M-60 -120 Q0 -140 60 -120" stroke="#FFFFFF" stroke-width="8" fill="none" opacity=".5"/><path d="M-112 -30 Q-124 40 -100 70 L-96 -20Z M112 -30 Q124 40 100 70 L96 -20Z" fill="${c}" stroke="${OL}" stroke-width="5"/>`; break;
    case 'redondo': h = `<path d="M-124 10 Q-140 -160 0 -164 Q140 -160 124 10 Q110 -60 60 -70 Q20 -40 -20 -70 Q-90 -70 -124 10Z" fill="${c}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><path d="M0 -164 Q20 -230 60 -220 Q30 -200 14 -160" fill="${c}" stroke="${OL}" stroke-width="5"/>`; break;
  }
  return h;
}
/* ---------- cabeça completa ---------- */
function head(o) {
  const sk = o.skin, skd = mix(sk, '#B04060', .25), chin = o.chin || 1, fw = o.faceW || 1;
  let g = '';
  g += hairBack(o);
  g += `<path d="M-30 120 L-34 240 L34 240 L30 120Z" fill="${skd}" stroke="${OL}" stroke-width="5"/>`;
  const face = `M${-100 * fw} -40 Q${-104 * fw} ${f1(60 * chin)} ${-62 * fw} ${f1(122 * chin)} Q${-20 * fw} ${f1(166 * chin)} 0 ${f1(172 * chin)} Q${20 * fw} ${f1(166 * chin)} ${62 * fw} ${f1(122 * chin)} Q${104 * fw} ${f1(60 * chin)} ${100 * fw} -40 Q${100 * fw} -150 0 -155 Q${-100 * fw} -150 ${-100 * fw} -40Z`;
  g += `<ellipse cx="${-104 * fw}" cy="30" rx="16" ry="28" fill="${sk}" stroke="${OL}" stroke-width="5"/><ellipse cx="${104 * fw}" cy="30" rx="16" ry="28" fill="${sk}" stroke="${OL}" stroke-width="5"/>`;
  g += `<path d="${face}" fill="${sk}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/>`;
  const cid = uid('fc'); DEFS.push(`<clipPath id="${cid}"><path d="${face}"/></clipPath>`);
  // sombra cel embaixo da franja e lado do rosto
  g += `<g clip-path="url(#${cid})"><path d="M-130 -80 Q-60 -20 0 -60 Q60 -20 130 -80 L130 -200 L-130 -200Z" fill="${skd}" opacity=".55"/><path d="M60 -40 Q90 60 40 170 L140 170 L140 -40Z" fill="${skd}" opacity=".35"/></g>`;
  if (o.blush) g += `<ellipse cx="-62" cy="72" rx="24" ry="11" fill="#FF7A9A" opacity=".45"/><ellipse cx="62" cy="72" rx="24" ry="11" fill="#FF7A9A" opacity=".45"/><path d="M-74 68 l6 8 M-64 66 l6 8 M-54 66 l6 8 M50 66 l6 8 M60 66 l6 8 M70 68 l6 8" stroke="#E04A6A" stroke-width="2.5"/>`;
  if (o.scar) g += `<path d="M48 -10 L84 40 M58 4 l12 -6 M68 18 l12 -6" stroke="#C04A4A" stroke-width="5" stroke-linecap="round"/>`;
  g += eye(-48, 1, o) + eye(48, -1, o) + brow(-48, 1, o) + brow(48, -1, o);
  g += o.nose === 'sombra' ? `<path d="M4 66 L-6 86 L6 88" stroke="${skd}" stroke-width="5" fill="none"/>` : `<path d="M0 78 l-5 6" stroke="${OL}" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>`;
  g += mouth(o);
  if (o.glasses) g += `<g fill="#CFE8FF" fill-opacity=".18" stroke="${OL}" stroke-width="5"><rect x="-90" y="-8" width="80" height="58" rx="12"/><rect x="10" y="-8" width="80" height="58" rx="12"/></g><path d="M-10 14 H10" stroke="${OL}" stroke-width="5"/><path d="M-80 0 L-40 -4 M20 0 L60 -4" stroke="#FFFFFF" stroke-width="5" opacity=".7"/>`;
  if (o.stache) g += `<path d="M-6 94 Q-40 84 -66 104 Q-40 102 -6 104Z M6 94 Q40 84 66 104 Q40 102 6 104Z" fill="${o.hair}" stroke="${OL}" stroke-width="4"/>`;
  if (o.beard) g += `<path d="M-70 96 Q-70 220 0 260 Q70 220 70 96 Q40 130 0 132 Q-40 130 -70 96Z" fill="${o.hair}" stroke="${OL}" stroke-width="5"/><path d="M-60 100 Q-30 84 0 98 Q30 84 60 100 Q50 116 30 112 Q10 118 0 108 Q-10 118 -30 112 Q-50 116 -60 100Z" fill="${o.hair}" stroke="${OL}" stroke-width="5"/>`;
  g += hairFront(o);
  if (o.bow) g += `<g transform="translate(-86,-118) rotate(-20)"><path d="M0 0 L-46 -26 L-46 26Z M0 0 L46 -26 L46 26Z" fill="${o.bow}" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/><circle r="12" fill="${o.bow}" stroke="${OL}" stroke-width="4"/></g>`;
  if (o.sweat) g += `<path d="M118 -60 Q134 -30 124 -10 Q110 0 104 -18 Q104 -40 118 -60Z" fill="#9AD8FF" stroke="${OL}" stroke-width="4"/>`;
  if (o.band) g += `<path d="M-118 -70 Q0 -110 118 -70 L116 -50 Q0 -88 -116 -50Z" fill="${o.band}" stroke="${OL}" stroke-width="5"/><path d="M116 -62 L160 -40 L150 -24 L112 -50Z" fill="${o.band}" stroke="${OL}" stroke-width="4"/>`;
  return g;
}

return { head, flush: () => { const d = DEFS.join(''); DEFS = []; UID = 0; return d; } };
})();
