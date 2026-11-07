/* ===================== personagem de perfil (virado para a direita) =====================
   ângulos em graus: 0 = para baixo; positivo = para a frente.
   o = { x, y, s, flip, look (cabeça virada p/ trás: -1..1), lean (tronco), drop (abaixa quadril),
         legF:[coxa,canela], legB:[coxa,canela], armF:[braço,antebraço], armB:[...], kind: 'preso'|'guarda'|'barbeiro', eyes (0 fechado..1) } */
const OUTL = '#16110E';
const KIND = {
  preso: { shirt: '#9EB8D0', shirtD: '#7E98B2', pants: '#3A4660', pantsD: '#2C364C', skin: '#E2B08E', skinD: '#C48E6E', hair: '#2A1C14', shoe: '#1A1614' },
  preso2: { shirt: '#A8BEB0', shirtD: '#86A090', pants: '#3A4660', pantsD: '#2C364C', skin: '#E8BC98', skinD: '#C89A78', hair: '#6A4426', shoe: '#1A1614' },
  preso3: { shirt: '#B8B0A0', shirtD: '#968E7E', pants: '#3A4660', pantsD: '#2C364C', skin: '#DCA888', skinD: '#B88868', hair: '#1A1410', shoe: '#1A1614' },
  guarda: { shirt: '#24304A', shirtD: '#1A2438', pants: '#1E283C', pantsD: '#161E2E', skin: '#E4B494', skinD: '#C49474', hair: '#3A2A1C', shoe: '#0E0E10', cap: '#1A2238' },
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
    let o2 = capsule(hip[0], hip[1], k1[0], k1[1], 44, 36, col) + capsule(k1[0], k1[1], f[0], f[1], 36, 28, col);
    o2 += `<path d="M${f1(f[0] - 30)} ${f1(f[1] - 22)} Q${f1(f[0] - 34)} ${f1(f[1] + 14)} ${f1(f[0] - 20)} ${f1(f[1] + 16)} L${f1(f[0] + 78)} ${f1(f[1] + 16)} Q${f1(f[0] + 92)} ${f1(f[1] - 2)} ${f1(f[0] + 64)} ${f1(f[1] - 22)}Z" fill="${C.shoe}" stroke="${OUTL}" stroke-width="4"/>`;
    return o2;
  };
  // tronco (gira no quadril)
  const sh = seg(hip[0], hip[1], 180 - P.lean, 330), nk = seg(hip[0], hip[1], 180 - P.lean, 380);
  const arm = (ang, back, held) => {
    const [u, fa] = ang, e = seg(sh[0], sh[1], u, 170), h = seg(e[0], e[1], u + fa, 160);
    const col = back ? C.shirtD : C.shirt;
    return capsule(sh[0], sh[1], e[0], e[1], 34, 28, col) + capsule(e[0], e[1], h[0], h[1], 28, 22, col) + `<circle cx="${f1(h[0])}" cy="${f1(h[1])}" r="27" fill="${back ? C.skinD : C.skin}" stroke="${OUTL}" stroke-width="4"/>` + (held ? `<g transform="translate(${f1(h[0])},${f1(h[1])})">${held}</g>` : '');
  };
  s += arm(P.armB, true, P.heldB) + leg(P.legB, true) + leg(P.legF, false);
  // tronco
  const tor = `<g transform="rotate(${f1(P.lean)} ${hip[0]} ${hip[1]})"><path d="M-70 ${hip[1] + 20} L-78 ${hip[1] - 300} Q-60 ${hip[1] - 352} 0 ${hip[1] - 356} Q60 ${hip[1] - 352} 78 ${hip[1] - 300} L72 ${hip[1] + 20}Z" fill="${C.shirt}" stroke="${OUTL}" stroke-width="4"/>
    <path d="M40 ${hip[1] - 330} L46 ${hip[1] + 10}" stroke="${C.shirtD}" stroke-width="5"/>${[-280, -210, -140, -70].map(yy => `<circle cx="52" cy="${hip[1] + yy}" r="6" fill="${C.shirtD}"/>`).join('')}
    <path d="M-20 ${hip[1] - 352} L40 ${hip[1] - 300} L62 ${hip[1] - 350}Z" fill="${C.shirtD}" stroke="${OUTL}" stroke-width="3"/>
    ${P.kind === 'guarda' ? `<rect x="-74" y="${hip[1] - 20}" width="148" height="30" fill="#0E0E12"/><rect x="56" y="${hip[1] - 16}" width="22" height="22" fill="#C8A040"/><path d="M-50 ${hip[1] - 260} l30 0 l0 20 l-30 0Z" fill="#C8A040"/>` : ''}
    ${P.kind === 'barbeiro' ? `<path d="M-74 ${hip[1] - 300} L74 ${hip[1] - 300}" stroke="#C8C4BA" stroke-width="4"/>` : ''}
    ${P.kind.startsWith('preso') ? `<rect x="-58" y="${hip[1] - 250}" width="50" height="22" fill="#F4F0E4" stroke="${OUTL}" stroke-width="2"/>` : ''}</g>`;
  s += tor;
  // cabeça (perfil); look < 0 vira a cabeça para trás (olhando por cima do ombro)
  const hf = P.look < 0 ? -1 : 1, hx = nk[0], hy = nk[1] - 60;
  let hd = `<g transform="translate(${f1(hx)},${f1(hy)}) scale(${hf},1)">`;
  hd += `<rect x="-22" y="20" width="44" height="60" fill="${C.skinD}" stroke="${OUTL}" stroke-width="4"/>`;
  hd += `<path d="M-58 -10 Q-62 -78 -4 -84 Q56 -84 62 -24 L66 2 L80 14 L64 22 Q66 50 40 62 Q0 72 -30 56 Q-62 40 -58 -10Z" fill="${C.skin}" stroke="${OUTL}" stroke-width="4" stroke-linejoin="round"/>`;
  hd += `<ellipse cx="-14" cy="0" rx="13" ry="18" fill="${C.skinD}" stroke="${OUTL}" stroke-width="3"/>`;
  hd += P.eyes > .5 ? `<ellipse cx="36" cy="-12" rx="7" ry="9" fill="#fff" stroke="${OUTL}" stroke-width="2"/><circle cx="39" cy="-11" r="4.5" fill="#1A120C"/>` : `<path d="M28 -10 Q37 -4 46 -10" stroke="${OUTL}" stroke-width="4" fill="none"/>`;
  hd += `<path d="M24 -28 Q38 -34 52 -28" stroke="${C.hair}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  hd += P.mouth ? `<ellipse cx="46" cy="40" rx="9" ry="${f1(6 + 8 * P.mouth)}" fill="#5A1E1A"/>` : `<path d="M36 40 Q46 44 54 38" stroke="${OUTL}" stroke-width="3" fill="none"/>`;
  if (P.kind === 'guarda') hd += `<path d="M-66 -46 Q-60 -110 4 -112 Q66 -110 66 -50Z" fill="${C.cap}" stroke="${OUTL}" stroke-width="4"/><path d="M40 -52 L108 -40 L104 -30 L40 -38Z" fill="#0A0A0E" stroke="${OUTL}" stroke-width="3"/><circle cx="6" cy="-80" r="9" fill="#C8A040"/>`;
  else hd += `<path d="M-60 -6 Q-70 -92 6 -96 Q60 -96 62 -40 Q40 -64 6 -62 Q-30 -60 -40 -20 Q-46 -6 -60 -6Z" fill="${C.hair}" stroke="${OUTL}" stroke-width="4"/>`;
  hd += `</g>`;
  s += hd;
  s += arm(P.armF, false, P.held);
  const shd = P.shadow ? `<ellipse cx="0" cy="6" rx="150" ry="22" fill="#000" opacity="${P.shadow}" filter="url(#b12)"/>` : '';
  return `<g transform="translate(${f1(P.x)},${f1(P.y)}) scale(${f1(P.s * P.flip * 1000) / 1000},${f1(P.s * 1000) / 1000})">${shd}${s}</g>`;
}
// capa dobrada (para carregar / pilha)
const foldedCoat = (w = 150, h = 50, rot = 0) => `<g transform="rotate(${rot})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="10" fill="#2E3C37" stroke="${OUTL}" stroke-width="4"/><path d="M${-w / 2 + 10} ${-h / 2 + 10} L${w / 2 - 10} ${-h / 2 + 10}" stroke="#7E9A92" stroke-width="5" opacity=".6"/><path d="M${-w / 4} ${-h / 2} L${-w / 4 + 12} ${h / 2}" stroke="#141A18" stroke-width="3"/></g>`;
