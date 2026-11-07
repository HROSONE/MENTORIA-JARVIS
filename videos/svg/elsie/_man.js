/* ===================== personagem de perfil (virado para a direita) =====================
   ângulos em graus: 0 = para baixo; positivo = para a frente.
   o = { x, y, s, flip, look (cabeça virada p/ trás: -1..1), lean (tronco), drop (abaixa quadril),
         legF:[coxa,canela], legB:[coxa,canela], armF:[braço,antebraço], armB:[...], kind: 'preso'|'guarda'|'barbeiro', eyes (0 fechado..1) } */
const OUTL = '#16110E';
const KIND = {
  preso: { shirt: '#9EB8D0', shirtD: '#7E98B2', pants: '#3A4660', pantsD: '#2C364C', skin: '#E2B08E', skinD: '#C48E6E', hair: '#2A1C14', shoe: '#1A1614' },
  preso2: { shirt: '#A8BEB0', shirtD: '#86A090', pants: '#3A4660', pantsD: '#2C364C', skin: '#E8BC98', skinD: '#C89A78', hair: '#6A4426', shoe: '#1A1614' },
  preso3: { shirt: '#B8B0A0', shirtD: '#968E7E', pants: '#3A4660', pantsD: '#2C364C', skin: '#DCA888', skinD: '#B88868', hair: '#1A1410', shoe: '#1A1614' },
  guarda: { shirt: '#24304A', shirtD: '#1A2438', pants: '#1E283C', pantsD: '#161E2E', skin: '#E4B494', skinD: '#C49474', hair: '#3A2A1C', shoe: '#0E0E10', cap: '#1A2238', belt: 1 },
  pow: { shirt: '#7A8CA8', shirtD: '#5E6E88', pants: '#56647E', pantsD: '#46526A', skin: '#E6B896', skinD: '#C69676', hair: '#3A2616', shoe: '#2A2018' },
  pow2: { shirt: '#C2B48A', shirtD: '#A2946C', pants: '#56647E', pantsD: '#46526A', skin: '#ECC4A2', skinD: '#CCA282', hair: '#8A5A2A', shoe: '#2A2018' },
  pow3: { shirt: '#E8E2D4', shirtD: '#C8C2B4', pants: '#56647E', pantsD: '#46526A', skin: '#E0AE8C', skinD: '#C08E6C', hair: '#1E1610', shoe: '#2A2018' },
  pow4: { shirt: '#7A8CA8', shirtD: '#5E6E88', pants: '#4A566E', pantsD: '#3A4458', skin: '#EAC0A0', skinD: '#CAA080', hair: '#C8A060', shoe: '#2A2018' },
  alemao: { shirt: '#6A7258', shirtD: '#545C44', pants: '#5A6248', pantsD: '#484E38', skin: '#E6B898', skinD: '#C69878', hair: '#5A4A3A', shoe: '#141210', cap: '#545C44', belt: 1 },
  civil: { shirt: '#E8643A', shirtD: '#C44E2A', pants: '#3A4A6A', pantsD: '#2C3A56', skin: '#C8906A', skinD: '#A8704C', hair: '#1E140E', shoe: '#2A2A30' },
  civil2: { shirt: '#3AA88A', shirtD: '#2A8A6E', pants: '#4A4A58', pantsD: '#3A3A46', skin: '#E6B896', skinD: '#C69676', hair: '#6A3A1A', shoe: '#2A2A30' },
  idoso: { shirt: '#B8A0C8', shirtD: '#9A82AA', pants: '#5A5A66', pantsD: '#4A4A54', skin: '#E2B08E', skinD: '#C2906E', hair: '#E8E8E8', shoe: '#3A2A20' },
  bandido: { shirt: '#2E2E38', shirtD: '#22222A', pants: '#2A3448', pantsD: '#20283A', skin: '#D8A888', skinD: '#B88868', hair: '#1A1410', shoe: '#141418', hood: '#34343F' },
  idosa: { shirt: '#B86A8A', shirtD: '#9A5470', pants: '#7A6A8A', pantsD: '#665878', skin: '#EAC4A6', skinD: '#CCA486', hair: '#ECECEC', shoe: '#5A3A2A', bun: 1, skirt: '#8A5A9A', glasses: 1 },
  policia: { shirt: '#2A3E6A', shirtD: '#1E2E52', pants: '#1E2A44', pantsD: '#162036', skin: '#C89070', skinD: '#A87050', hair: '#1A120C', shoe: '#0E0E10', cap: '#1A2448', belt: 1 },
  elsiej: { shirt: '#6A9AC8', shirtD: '#5480AA', pants: '#5A4A6A', pantsD: '#4A3C58', skin: '#EAC4A6', skinD: '#CCA486', hair: '#5A3A22', shoe: '#3A2A20', bun: 1, skirt: '#3A5A8A' },
  rudy: { shirt: '#7A3A2A', shirtD: '#5E2C20', pants: '#3A4A6A', pantsD: '#2C3A56', skin: '#E2B08E', skinD: '#C2906E', hair: '#D8D8D8', shoe: '#2A1E16' },
  rudyj: { shirt: '#7A3A2A', shirtD: '#5E2C20', pants: '#3A4A6A', pantsD: '#2C3A56', skin: '#E2B08E', skinD: '#C2906E', hair: '#4A3020', shoe: '#2A1E16' },
  turista: { shirt: '#E8C040', shirtD: '#C8A030', pants: '#4A5A7A', pantsD: '#3A4A66', skin: '#8A5A3A', skinD: '#6A4028', hair: '#1A120C', shoe: '#2A2A30' },
  motoq: { shirt: '#2A2A30', shirtD: '#1E1E24', pants: '#3A3A44', pantsD: '#2A2A34', skin: '#E6B896', skinD: '#C69676', hair: '#8A6A4A', shoe: '#141414' },
  barbeiro: { shirt: '#F2F0EA', shirtD: '#D6D2C8', pants: '#4A4A50', pantsD: '#3A3A40', skin: '#DDA585', skinD: '#BE8868', hair: '#8A8A8A', shoe: '#1A1614' }};
const rad = a => a * Math.PI / 180;
function seg(x, y, ang, l) { return [x + Math.sin(rad(ang)) * l, y + Math.cos(rad(ang)) * l]; }
function capsule(x1, y1, x2, y2, w1, w2, fill) {
  const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a), ny = Math.cos(a);
  return `<path d="M${f1(x1 + nx * w1)} ${f1(y1 + ny * w1)} L${f1(x2 + nx * w2)} ${f1(y2 + ny * w2)} A${w2} ${w2} 0 0 0 ${f1(x2 - nx * w2)} ${f1(y2 - ny * w2)} L${f1(x1 - nx * w1)} ${f1(y1 - ny * w1)} A${w1} ${w1} 0 0 0 ${f1(x1 + nx * w1)} ${f1(y1 + ny * w1)}Z" fill="${fill}" stroke="${OUTL}" stroke-width="4" stroke-linejoin="round"/>`;
}
function walkPose(ph, amt = 1) {
  const a = Math.sin(ph) * amt, b = Math.sin(ph + Math.PI) * amt;
  return { legF: [24 * a, -Math.max(0, -a) * 40 - 6], legB: [24 * b, -Math.max(0, -b) * 40 - 6], armF: [-22 * a, 18], armB: [-22 * b, 18], bob: Math.abs(Math.cos(ph)) * 10 * amt };
}
function man(o) {
  const P = Object.assign({ x: 0, y: 0, s: 1, flip: 1, look: 0, lean: 0, drop: 0, legF: [0, 0], legB: [0, 0], armF: [8, 10], armB: [-6, 10], kind: 'preso', eyes: 1, held: '', heldB: '', shadow: .3, bob: 0, mouth: 0 }, o);
  const C = KIND[P.kind];
  const hip = [0, -470 + P.drop + P.bob];
  let s = '';
  const leg = (ang, back) => {
    const [t, sh] = ang, k1 = seg(hip[0], hip[1], t, 230), f = seg(k1[0], k1[1], t + sh, 225);
    const col = back ? C.pantsD : C.pants;
    let o2 = capsule(hip[0], hip[1], k1[0], k1[1], 44, 36, col) + capsule(k1[0], k1[1], f[0], f[1], 36, 28, col) + `<path d="M${f1(hip[0] + 12)} ${f1(hip[1] + 20)} L${f1(k1[0] + 10)} ${f1(k1[1])} L${f1(f[0] + 8)} ${f1(f[1] - 20)}" stroke="#000" stroke-width="3" opacity=".18" fill="none"/><path d="M${f1(k1[0] - 22)} ${f1(k1[1] - 6)} q14 10 30 2" stroke="#000" stroke-width="3" opacity=".2" fill="none"/>`;
    o2 += `<path d="M${f1(f[0] - 30)} ${f1(f[1] - 22)} Q${f1(f[0] - 34)} ${f1(f[1] + 14)} ${f1(f[0] - 20)} ${f1(f[1] + 16)} L${f1(f[0] + 78)} ${f1(f[1] + 16)} Q${f1(f[0] + 92)} ${f1(f[1] - 2)} ${f1(f[0] + 64)} ${f1(f[1] - 22)}Z" fill="${C.shoe}" stroke="${OUTL}" stroke-width="4"/><path d="M${f1(f[0] + 20)} ${f1(f[1] - 12)} q24 -4 40 4" stroke="#fff" stroke-width="4" opacity=".3" fill="none"/>`;
    return o2;
  };
  // tronco (gira no quadril)
  const sh = seg(hip[0], hip[1], 180 - P.lean, 330), nk = seg(hip[0], hip[1], 180 - P.lean, 380);
  const arm = (ang, back, held) => {
    const [u, fa] = ang, e = seg(sh[0], sh[1], u, 170), h = seg(e[0], e[1], u + fa, 160);
    const col = back ? C.shirtD : C.shirt;
    const cf = seg(e[0], e[1], u + fa, 128); return capsule(sh[0], sh[1], e[0], e[1], 34, 28, col) + capsule(e[0], e[1], h[0], h[1], 28, 22, col) + capsule(cf[0], cf[1], h[0], h[1], 25, 24, back ? C.shirtD : mix(C.shirt, '#000000', .12)) + `<path d="M${f1(sh[0])} ${f1(sh[1])} L${f1(e[0])} ${f1(e[1])}" stroke="#fff" stroke-width="5" opacity=".18"/>` + `<circle cx="${f1(h[0])}" cy="${f1(h[1])}" r="27" fill="${back ? C.skinD : C.skin}" stroke="${OUTL}" stroke-width="4"/>` + (held ? `<g transform="translate(${f1(h[0])},${f1(h[1])})">${held}</g>` : '');
  };
  s += arm(P.armB, true, P.heldB) + leg(P.legB, true) + leg(P.legF, false);
  if (C.skirt) s += `<path d="M-80 ${hip[1] - 30} L80 ${hip[1] - 30} L${f1(120 + 30 * Math.abs(Math.sin(rad(P.legF[0]))))} ${hip[1] + 280} L-120 ${hip[1] + 280}Z" fill="${C.skirt}" stroke="${OUTL}" stroke-width="4"/><path d="M-60 ${hip[1] + 240} L100 ${hip[1] + 240}" stroke="#fff" stroke-width="4" opacity=".25"/>`;
  // tronco
  const tor = `<g transform="rotate(${f1(P.lean)} ${hip[0]} ${hip[1]})"><path d="M-70 ${hip[1] + 20} L-78 ${hip[1] - 300} Q-60 ${hip[1] - 352} 0 ${hip[1] - 356} Q60 ${hip[1] - 352} 78 ${hip[1] - 300} L72 ${hip[1] + 20}Z" fill="${C.shirt}" stroke="${OUTL}" stroke-width="4"/>
    <path d="M40 ${hip[1] - 330} L46 ${hip[1] + 10}" stroke="${C.shirtD}" stroke-width="5"/>${[-280, -210, -140, -70].map(yy => `<circle cx="52" cy="${hip[1] + yy}" r="6" fill="${C.shirtD}"/>`).join('')}
    <path d="M-20 ${hip[1] - 352} L40 ${hip[1] - 300} L62 ${hip[1] - 350}Z" fill="${C.shirtD}" stroke="${OUTL}" stroke-width="3"/>
    <rect x="6" y="${hip[1] - 290}" width="52" height="56" rx="6" fill="${C.shirtD}" stroke="${OUTL}" stroke-width="3" opacity=".9"/><path d="M4 ${hip[1] - 292} L60 ${hip[1] - 292} L56 ${hip[1] - 270} L8 ${hip[1] - 270}Z" fill="${C.shirt}" stroke="${OUTL}" stroke-width="3"/><circle cx="32" cy="${hip[1] - 276}" r="4" fill="${OUTL}"/><path d="M-58 ${hip[1] - 344} L20 ${hip[1] - 330}" stroke="${C.shirtD}" stroke-width="14" stroke-linecap="round"/><path d="M-60 ${hip[1] - 120} Q-30 ${hip[1] - 100} -50 ${hip[1] - 60} M-40 ${hip[1] - 200} Q-10 ${hip[1] - 180} -30 ${hip[1] - 150}" stroke="#000" stroke-width="3" opacity=".18" fill="none"/><path d="M-70 ${hip[1] + 20} L-78 ${hip[1] - 300} Q-60 ${hip[1] - 352} 0 ${hip[1] - 356}" stroke="#000" stroke-width="18" opacity=".12" fill="none"/>${C.belt ? `<rect x="-74" y="${hip[1] - 20}" width="148" height="30" fill="#0E0E12"/><rect x="56" y="${hip[1] - 16}" width="22" height="22" fill="#C8A040"/><path d="M-50 ${hip[1] - 260} l30 0 l0 20 l-30 0Z" fill="#C8A040"/>` : ''}
    ${P.kind === 'barbeiro' ? `<path d="M-74 ${hip[1] - 300} L74 ${hip[1] - 300}" stroke="#C8C4BA" stroke-width="4"/>` : ''}
    ${P.kind.startsWith('preso') ? `<rect x="-58" y="${hip[1] - 250}" width="50" height="22" fill="#F4F0E4" stroke="${OUTL}" stroke-width="2"/>` : ''}</g>`;
  s += tor;
  // cabeça (perfil); look < 0 vira a cabeça para trás (olhando por cima do ombro)
  const hf = P.look < 0 ? -1 : 1, hx = nk[0], hy = nk[1] - 60;
  let hd = `<g transform="translate(${f1(hx)},${f1(hy)}) scale(${hf},1)">`;
  hd += `<rect x="-22" y="20" width="44" height="60" fill="${C.skinD}" stroke="${OUTL}" stroke-width="4"/>`;
  hd += `<path d="M-58 -10 Q-62 -78 -4 -84 Q56 -84 62 -24 L66 2 L80 14 L64 22 Q66 50 40 62 Q0 72 -30 56 Q-62 40 -58 -10Z" fill="${C.skin}" stroke="${OUTL}" stroke-width="4" stroke-linejoin="round"/>`;
  hd += `<ellipse cx="38" cy="20" rx="14" ry="9" fill="#E07A6A" opacity=".25"/><path d="M60 4 Q64 18 56 22" stroke="${C.skinD}" stroke-width="5" fill="none"/><path d="M-56 -6 Q-56 40 -24 56" stroke="${C.skinD}" stroke-width="10" fill="none" opacity=".5"/>`;
  hd += `<ellipse cx="-14" cy="0" rx="13" ry="18" fill="${C.skinD}" stroke="${OUTL}" stroke-width="3"/>`;
  hd += P.eyes > .5 ? `<ellipse cx="36" cy="-12" rx="7" ry="9" fill="#fff" stroke="${OUTL}" stroke-width="2"/><circle cx="39" cy="-11" r="4.5" fill="#1A120C"/>` : `<path d="M28 -10 Q37 -4 46 -10" stroke="${OUTL}" stroke-width="4" fill="none"/>`;
  hd += `<path d="M24 -28 Q38 -34 52 -28" stroke="${C.hair}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  hd += P.mouth ? `<ellipse cx="46" cy="40" rx="9" ry="${f1(6 + 8 * P.mouth)}" fill="#5A1E1A"/>` : `<path d="M36 40 Q46 44 54 38" stroke="${OUTL}" stroke-width="3" fill="none"/>`;
  if (C.cap) hd += `<path d="M-66 -46 Q-60 -110 4 -112 Q66 -110 66 -50Z" fill="${C.cap}" stroke="${OUTL}" stroke-width="4"/><path d="M40 -52 L108 -40 L104 -30 L40 -38Z" fill="#0A0A0E" stroke="${OUTL}" stroke-width="3"/><circle cx="6" cy="-80" r="9" fill="#C8A040"/>`;
  else hd += `<path d="M-60 -6 Q-70 -92 6 -96 Q60 -96 62 -40 Q40 -64 6 -62 Q-30 -60 -40 -20 Q-46 -6 -60 -6Z" fill="${C.hair}" stroke="${OUTL}" stroke-width="4"/><path d="M-30 -78 Q6 -90 40 -74" stroke="#fff" stroke-width="5" opacity=".25" fill="none"/>`;
  if (C.hood) hd += `<path d="M-78 70 Q-96 -40 -60 -96 Q-10 -140 50 -112 Q92 -86 84 -30 L74 -4 Q60 -64 14 -74 Q-36 -74 -44 -20 Q-48 30 -20 66 Q-40 80 -78 70Z" fill="${C.hood}" stroke="${OUTL}" stroke-width="5"/><path d="M74 -4 Q60 -64 14 -74 Q-36 -74 -44 -20" stroke="#000" stroke-width="10" fill="none" opacity=".35"/><path d="M-60 -60 Q-20 -110 40 -100" stroke="#fff" stroke-width="5" opacity=".12" fill="none"/>`;
  if (C.hood) hd += `<path d="M-30 -60 Q40 -86 86 -36 L90 20 Q84 64 40 70 Q0 76 -30 60Z" fill="#0A0A10" opacity=".93"/><path d="M84 -34 Q104 -10 92 26" stroke="${C.hood}" stroke-width="22" fill="none" stroke-linecap="round"/><ellipse cx="44" cy="-10" rx="9" ry="5" fill="#E8F0FF"/><circle cx="47" cy="-10" r="3" fill="#0A0A10"/><ellipse cx="60" cy="-8" rx="5" ry="4" fill="#C8D0E0" opacity=".7"/>`;
  if (C.bun) hd += `<circle cx="-56" cy="-70" r="30" fill="${C.hair}" stroke="${OUTL}" stroke-width="4"/>`;
  if (C.glasses) hd += `<circle cx="38" cy="-12" r="16" fill="#CFE8FF" fill-opacity=".25" stroke="#3A2A20" stroke-width="4"/><path d="M22 -14 L-6 -16" stroke="#3A2A20" stroke-width="4"/>`;
  hd += `</g>`;
  s += hd;
  s += arm(P.armF, false, P.held);
  const shd = P.shadow ? `<ellipse cx="0" cy="6" rx="150" ry="22" fill="#000" opacity="${P.shadow}" filter="url(#b12)"/>` : '';
  return `<g transform="translate(${f1(P.x)},${f1(P.y)}) scale(${f1(P.s * P.flip * 1000) / 1000},${f1(P.s * 1000) / 1000})">${shd}<g filter="url(#manVol)">${s}</g></g>`;
}
// capa dobrada (para carregar / pilha)
const foldedCoat = (w = 150, h = 50, rot = 0) => `<g transform="rotate(${rot})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="10" fill="#2E3C37" stroke="${OUTL}" stroke-width="4"/><path d="M${-w / 2 + 10} ${-h / 2 + 10} L${w / 2 - 10} ${-h / 2 + 10}" stroke="#7E9A92" stroke-width="5" opacity=".6"/><path d="M${-w / 4} ${-h / 2} L${-w / 4 + 12} ${h / 2}" stroke="#141A18" stroke-width="3"/></g>`;
