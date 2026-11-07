/* ===================== peças, xícara, mãos, chaves, cães ===================== */
const LIGHT = '#E9D7B0', LIGHTD = '#B89A6A', STAIN = '#5A3418', STAIND = '#2E1A0C';
function piece(type, x, y, s, k = 0, rot = 0) {   // k: quanto já está escurecida pelo café
  const c = mix(LIGHT, STAIN, k), cd = mix(LIGHTD, STAIND, k);
  let p = `<ellipse cx="0" cy="4" rx="70" ry="16" fill="#000" opacity=".35"/><path d="M-62 0 L62 0 L56 -26 L-56 -26Z" fill="${cd}"/><rect x="-58" y="-34" width="116" height="14" rx="6" fill="${c}"/>`;
  if (type === 'peao') p += `<path d="M-38 -34 Q-20 -90 -16 -120 L16 -120 Q20 -90 38 -34Z" fill="${c}"/><rect x="-30" y="-128" width="60" height="12" rx="6" fill="${cd}"/><circle cx="0" cy="-158" r="32" fill="${c}"/>`;
  if (type === 'rei') p += `<path d="M-44 -34 Q-24 -120 -22 -190 L22 -190 Q24 -120 44 -34Z" fill="${c}"/><rect x="-38" y="-204" width="76" height="16" rx="7" fill="${cd}"/><path d="M-34 -204 Q0 -250 34 -204Z" fill="${c}"/><rect x="-7" y="-286" width="14" height="50" rx="4" fill="${c}"/><rect x="-22" y="-272" width="44" height="14" rx="4" fill="${c}"/>`;
  if (type === 'dama') p += `<path d="M-44 -34 Q-24 -120 -22 -180 L22 -180 Q24 -120 44 -34Z" fill="${c}"/><rect x="-38" y="-194" width="76" height="16" rx="7" fill="${cd}"/><path d="M-40 -194 L-46 -240 L-24 -214 L-12 -250 L0 -216 L12 -250 L24 -214 L46 -240 L40 -194Z" fill="${c}"/><circle cx="0" cy="-262" r="10" fill="${c}"/>`;
  if (type === 'cavalo') p += `<path d="M-44 -34 Q-40 -80 -30 -100 Q-50 -130 -40 -170 Q-30 -220 10 -240 L20 -262 L30 -236 Q60 -220 66 -170 L70 -130 Q58 -118 40 -126 Q20 -130 20 -110 Q34 -70 44 -34Z" fill="${c}"/><circle cx="18" cy="-196" r="6" fill="${cd}"/><path d="M-30 -190 Q-10 -230 10 -238" stroke="${cd}" stroke-width="6" fill="none"/>`;
  p += `<path d="M-30 -40 Q-14 -100 -14 -150" stroke="#fff" stroke-width="7" fill="none" opacity="${op(.25 + .25 * k)}" stroke-linecap="round"/>`;
  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${f1(s * 1000) / 1000})">${p}</g>`;
}
function steam(x, y, t, n = 3, col = '#E8E0D0', k = 1, sc = 1) {
  let o = '';
  for (let i = 0; i < n; i++) { const ph = (t * .5 + i / n) % 1; o += `<path d="M${f1(x + (i - 1) * 30 * sc)} ${f1(y - ph * 260 * sc)} q${f1(30 * sc)} ${f1(-40 * sc)} 0 ${f1(-80 * sc)} q${f1(-30 * sc)} ${f1(-40 * sc)} 0 ${f1(-80 * sc)}" stroke="${col}" stroke-width="${f1(10 * sc)}" fill="none" stroke-linecap="round" opacity="${op(Math.sin(ph * Math.PI) * .45 * k)}" filter="url(#b4)"/>`; }
  return o;
}
function cup(x, y, s, t, liquidY = 0) {
  return `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="250" rx="260" ry="50" fill="#000" opacity=".45" filter="url(#b12)"/>
  <path d="M-200 0 L-170 240 Q0 280 170 240 L200 0Z" fill="#E8E2D6"/><path d="M-200 0 L-170 240 Q-120 256 -80 262 L-110 0Z" fill="#000" opacity=".15"/><path d="M200 40 Q300 40 300 130 Q300 210 190 200" stroke="#E8E2D6" stroke-width="34" fill="none"/>
  <ellipse cx="0" cy="0" rx="200" ry="56" fill="#F4EFE6"/><ellipse cx="0" cy="${f1(6 + liquidY)}" rx="178" ry="46" fill="#1E0F06"/><ellipse cx="-60" cy="${f1(-6 + liquidY)}" rx="60" ry="10" fill="#7A4A2A" opacity=".6"/>
  <path d="M120 40 Q140 140 120 230" stroke="#fff" stroke-width="10" opacity=".35" fill="none" stroke-linecap="round"/></g>`;
}
function hand(x, y, s, rot, col = '#5A3A2A', rim = '#FFC27A', sleeve = '#7A3A18') {  // mão pinçando, vista de lado
  const id = rig({ amb: '#ffffff', k: [-1, -.2], shO: .3, shD: 10, rims: [{ c: rim, k: [1, -.4], w: 6, o: .9 }] });
  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${f1(s * 1000) / 1000})" filter="url(#${id})">
    <path d="M-64 -520 L64 -520 L60 -150 L-60 -150Z" fill="${sleeve}"/><path d="M-60 -170 L60 -170 L60 -150 L-60 -150Z" fill="#000" opacity=".25"/>
    <path d="M-62 -170 Q-80 -60 -50 -10 Q-30 20 0 30 Q40 22 56 -20 Q72 -80 60 -170Z" fill="${col}"/>
    <path d="M-50 -40 Q-80 0 -60 40 Q-50 62 -30 50 Q-20 20 -30 -20Z" fill="${col}"/>
    <path d="M40 -30 Q70 10 40 56 Q26 70 14 56 Q20 20 10 -10Z" fill="${col}"/></g>`;
}
function keyRing(x, y, s, t, soap = 0, swing = 0) {
  const c = soap ? '#EDE6D2' : '#C9CDD4', cd = soap ? '#C8BFA6' : '#7A808A', sh = soap ? '#fff' : '#fff';
  let o = `<g transform="translate(${f1(x)},${f1(y)}) scale(${s})"><circle cx="0" cy="0" r="46" fill="none" stroke="${cd}" stroke-width="12"/><circle cx="0" cy="0" r="46" fill="none" stroke="${c}" stroke-width="6"/>`;
  for (let i = 0; i < 4; i++) { const a = -20 + i * 18 + Math.sin(t * 5 + i) * 6 * swing; o += `<g transform="rotate(${f1(a)}) translate(0,46)"><circle cx="0" cy="40" r="34" fill="${c}" stroke="${cd}" stroke-width="5"/><circle cx="0" cy="40" r="12" fill="#14161c"/><rect x="-11" y="70" width="22" height="${130 + i * 14}" rx="${soap ? 9 : 3}" fill="${c}" stroke="${cd}" stroke-width="4"/><path d="M11 ${120 + i * 14} h22 v18 h-12 v14 h12 v18 h-22" fill="${c}" stroke="${cd}" stroke-width="4"/><path d="M-4 80 L-4 ${180 + i * 14}" stroke="${sh}" stroke-width="4" opacity="${soap ? .5 : .7}"/></g>`; }
  return o + '</g>';
}
function dog(x, y, s, t, ph = 0, sniff = 0, col = '#0b0b10', rim = '#BFD4FF') {
  const a = Math.sin(t * 9 + ph), hd = sniff * (8 + 6 * Math.sin(t * 14 + ph));
  const leg = (lx, k) => `<path d="M${lx} -150 L${f1(lx + 20 * k)} -60 L${f1(lx + 8 * k)} 0" stroke="${col}" stroke-width="22" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  const id = rig({ amb: '#ffffff', k: [-1, .3], shO: 0, rims: [{ c: rim, k: [1, -.6], w: 6, o: 1, glow: true }] });
  return `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(s * 1000) / 1000})" filter="url(#${id})">${leg(-110, a)}${leg(-80, -a)}${leg(110, -a)}${leg(140, a)}
    <path d="M-150 -160 Q-160 -230 -60 -240 L120 -236 Q190 -230 190 -160 Q180 -120 120 -120 L-110 -120 Q-150 -124 -150 -160Z" fill="${col}"/>
    <path d="M-150 -200 Q-210 -230 -230 -290" stroke="${col}" stroke-width="18" fill="none" stroke-linecap="round"/>
    <g transform="translate(170,-220) rotate(${f1(20 + hd * 3)})"><path d="M0 -30 Q40 -70 90 -50 L170 -10 Q180 20 150 30 L60 40 Q0 40 -10 0Z" fill="${col}"/><path d="M40 -60 L50 -120 L80 -60Z" fill="${col}"/><circle cx="168" cy="6" r="12" fill="#222"/></g></g>`;
}
function rain(t, k = 1, n = 140) {
  let o = ''; for (let i = 0; i < n; i++) { const x = (i * 97.3) % 1300 - 110, sp = 1600 + (i % 7) * 120, y = ((i * 211) % 2100 + t * sp) % 2100 - 100; o += `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x - 14)}" y2="${f1(y + 70)}" stroke="#BFD0EE" stroke-width="${2 + i % 2}" opacity="${op((.25 + (i % 5) * .08) * k)}"/>`; }
  return o;
}
function board(cx, cy, w, h, persp = .7, rot = 0) {   // tabuleiro em perspectiva simples (trapézio)
  let o = `<g transform="translate(${cx},${cy}) rotate(${rot})">`;
  const topW = w * persp, P = (u, v) => [lerp(-topW / 2, -w / 2, v) + u * lerp(topW, w, v), -h / 2 + v * h];
  const [a0, a1] = [P(0, 0), P(1, 0)], [b0, b1] = [P(0, 1), P(1, 1)];
  o += `<path d="M${f1(a0[0] - 26)} ${f1(a0[1] - 18)} L${f1(a1[0] + 26)} ${f1(a1[1] - 18)} L${f1(b1[0] + 36)} ${f1(b1[1] + 26)} L${f1(b0[0] - 36)} ${f1(b0[1] + 26)}Z" fill="#3A2412"/><path d="M${f1(b0[0] - 36)} ${f1(b0[1] + 26)} L${f1(b1[0] + 36)} ${f1(b1[1] + 26)} L${f1(b1[0] + 36)} ${f1(b1[1] + 50)} L${f1(b0[0] - 36)} ${f1(b0[1] + 50)}Z" fill="#24160A"/>`;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const p1 = P(i / 8, j / 8), p2 = P((i + 1) / 8, j / 8), p3 = P((i + 1) / 8, (j + 1) / 8), p4 = P(i / 8, (j + 1) / 8); o += `<path d="M${f1(p1[0])} ${f1(p1[1])} L${f1(p2[0])} ${f1(p2[1])} L${f1(p3[0])} ${f1(p3[1])} L${f1(p4[0])} ${f1(p4[1])}Z" fill="${(i + j) % 2 ? '#6E4524' : '#D9BE8A'}"/>`; }
  return { svg: o + '</g>', P: (u, v) => { const p = P(u, v); const c = Math.cos(rot * Math.PI / 180), s = Math.sin(rot * Math.PI / 180); return [cx + p[0] * c - p[1] * s, cy + p[0] * s + p[1] * c]; } };
}

