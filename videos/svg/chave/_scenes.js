/* ===================== A chave, a fechadura e a bengalada ===================== */
const SH = N.s.map(x => [x.k, x.a, x.b]);
const shotAt = t => SH.find(s => t >= s[1] && t < s[2]) || SH[SH.length - 1];
const loc = (t, id) => { const s = SH.find(x => x[0] === id); return { L: t - s[1], d: s[2] - s[1], k: (t - s[1]) / (s[2] - s[1]) }; };
const HH = (t, k = 1) => [3 * k * noise1(t * 1.3, 1), 3 * k * noise1(t * 1.1, 4)];
const GND = 1500;
/* ---------- texturas ---------- */
let PAPER = '', HATCH = '';
(function () {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); const im = x.createImageData(512, 512);
  const r = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };
  const vn = (u, v, s) => { const i = Math.floor(u / s), j = Math.floor(v / s), fu = u / s - i, fv = v / s - j, a = r(i % (512 / s), j % (512 / s)), b = r((i + 1) % (512 / s), j % (512 / s)), cc = r(i % (512 / s), (j + 1) % (512 / s)), d = r((i + 1) % (512 / s), (j + 1) % (512 / s)), su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv); return a + (b - a) * su + (cc - a) * sv + (a - b - cc + d) * su * sv; };
  for (let j = 0; j < 512; j++) for (let i = 0; i < 512; i++) { const n = vn(i, j, 64) * .45 + vn(i, j, 16) * .3 + vn(i, j, 4) * .15 + Math.random() * .1, k = (j * 512 + i) * 4, g = Math.floor(170 + n * 85); im.data[k] = g; im.data[k + 1] = Math.floor(g * .97); im.data[k + 2] = Math.floor(g * .9); im.data[k + 3] = 255; }
  x.putImageData(im, 0, 0);
  for (let f = 0; f < 260; f++) { x.strokeStyle = `rgba(90,70,50,${.05 + Math.random() * .08})`; x.lineWidth = .6 + Math.random(); x.beginPath(); const a = Math.random() * 512, b = Math.random() * 512, an = Math.random() * 6.3, l = 8 + Math.random() * 30; x.moveTo(a, b); x.quadraticCurveTo(a + Math.cos(an) * l / 2 + 4, b + Math.sin(an) * l / 2, a + Math.cos(an) * l, b + Math.sin(an) * l); x.stroke(); }
  PAPER = c.toDataURL('image/jpeg', .85);
})();
const TEXTURE = `<rect x="-100" y="-100" width="1280" height="2120" fill="url(#paperP)" style="mix-blend-mode:multiply" opacity=".55"/><rect x="-100" y="-100" width="1280" height="2120" fill="url(#paperP)" style="mix-blend-mode:soft-light" opacity=".5"/>`;


/* ---------- rua à noite ---------- */
function nightStreet(t, o = {}) {
  let s = `<rect x="-1500" y="-900" width="4200" height="3800" fill="#0E1630"/>` + STARS.slice(0, 70).map(q => `<circle cx="${f1(q.x * 1.4)}" cy="${f1(q.y * .35 - 200)}" r="${q.r}" fill="#fff" opacity="${op(.3 + .4 * Math.sin(t * 2 + q.p))}"/>`).join('') + `<circle cx="1500" cy="200" r="70" fill="#F4F2E4"/><circle cx="1500" cy="200" r="200" fill="#F4F2E4" opacity=".08"/>`;
  // prédios
  const B = [[-1300, 900, '#2A2E48'], [-860, 760, '#323652'], [-420, 980, '#282C44'], [1060, 860, '#30344E'], [1500, 960, '#262A42'], [1940, 800, '#2E3250']];
  B.forEach(([x, h, c], i) => { s += `<rect x="${x}" y="${GND - 40 - h}" width="430" height="${h}" fill="${c}" stroke="${OUTL}" stroke-width="5"/><rect x="${x}" y="${GND - 40 - h}" width="430" height="${h}" fill="url(#brickP)" opacity=".18"/>`; for (let r = 0; r < Math.floor(h / 200); r++) for (let c2 = 0; c2 < 3; c2++) { const lit = (i * 7 + r * 3 + c2) % 4 === 0; s += `<rect x="${x + 40 + c2 * 130}" y="${GND - h + r * 200}" width="90" height="120" fill="${lit ? '#FFD88A' : '#1A1E30'}" stroke="${OUTL}" stroke-width="3"/>${lit ? `<rect x="${x + 40 + c2 * 130}" y="${GND - h + r * 200}" width="90" height="120" fill="#FFD88A" opacity=".25" filter="url(#b12)"/>` : ''}`; } });
  // padaria (iluminada)
  s += `<g transform="translate(40,${GND - 40})"><rect x="0" y="-760" width="980" height="760" fill="#5A3A2E" stroke="${OUTL}" stroke-width="6"/><rect x="0" y="-760" width="980" height="760" fill="url(#brickP)" opacity=".3"/><path d="M-20 -560 L1000 -560 L960 -470 L20 -470Z" fill="#C83A3A" stroke="${OUTL}" stroke-width="5"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${20 + i * 80} -470 l40 0 l-20 40Z" fill="${i % 2 ? '#F4F0E4' : '#C83A3A'}" stroke="${OUTL}" stroke-width="3"/>`).join('')}<rect x="80" y="-420" width="520" height="300" fill="#FFD890" stroke="${OUTL}" stroke-width="5"/><rect x="80" y="-420" width="520" height="300" fill="#FFE8B0" opacity=".5" filter="url(#b12)"/>${[0, 1, 2, 3].map(i => `<ellipse cx="${160 + i * 120}" cy="-170" rx="48" ry="26" fill="#C88A3A" stroke="${OUTL}" stroke-width="3"/><path d="M${132 + i * 120} -176 l12 -10 m10 10 l12 -10 m10 10 l12 -10" stroke="#8A5A2A" stroke-width="3"/>`).join('')}<rect x="700" y="-420" width="200" height="420" fill="#3A2418" stroke="${OUTL}" stroke-width="5"/><circle cx="870" cy="-210" r="8" fill="#C8A040"/><g transform="translate(490,-640)"><ellipse rx="150" ry="60" fill="#F2E6C8" stroke="${OUTL}" stroke-width="5"/><ellipse cx="0" cy="0" rx="100" ry="34" fill="#D89A4A" stroke="${OUTL}" stroke-width="4"/><path d="M-60 -6 l16 -14 m14 14 l16 -14 m14 14 l16 -14" stroke="#8A5A2A" stroke-width="4"/></g></g>`;
  s += `<path d="M40 ${GND - 40} L1020 ${GND - 40} L1260 ${GND + 300} L-200 ${GND + 300}Z" fill="#FFD890" opacity=".1"/>`;
  // beco escuro à esquerda
  s += `<rect x="-420" y="${GND - 640}" width="380" height="600" fill="#05060C" stroke="${OUTL}" stroke-width="5"/>`;
  // calçada, meio-fio, rua
  s += `<rect x="-1500" y="${GND - 40}" width="4200" height="80" fill="#5A5A64" stroke="${OUTL}" stroke-width="4"/>${Array.from({ length: 40 }, (_, i) => `<line x1="${-1500 + i * 110}" y1="${GND - 40}" x2="${-1500 + i * 110}" y2="${GND + 40}" stroke="${OUTL}" stroke-width="2" opacity=".4"/>`).join('')}<rect x="-1500" y="${GND + 40}" width="4200" height="1200" fill="#2A2C34"/><rect x="-1500" y="${GND + 40}" width="4200" height="1200" fill="url(#dotP)" opacity=".3"/>${Array.from({ length: 16 }, (_, i) => `<rect x="${-1400 + i * 280}" y="${GND + 300}" width="150" height="18" fill="#E8E4C8" opacity=".55"/>`).join('')}`;
  // postes de luz
  [-700, 1300].forEach(x => { s += `<rect x="${x - 10}" y="${GND - 900}" width="20" height="860" fill="#1A1C24" stroke="${OUTL}" stroke-width="3"/><path d="M${x} ${GND - 900} q0 -40 -80 -40" stroke="#1A1C24" stroke-width="16" fill="none"/><path d="M${x - 130} ${GND - 948} l100 0 l-20 24 l-60 0Z" fill="#2A2C34" stroke="${OUTL}" stroke-width="3"/><path d="M${x - 110} ${GND - 924} L${x - 50} ${GND - 924} L${x + 120} ${GND + 40} L${x - 280} ${GND + 40}Z" fill="url(#beamW2)" opacity=".55"/><circle cx="${x - 80}" cy="${GND - 920}" r="${f1(60 + 6 * Math.sin(t * 3))}" fill="#FFF0C0" opacity=".35" filter="url(#b12)"/>`; });
  return s;
}
/* ---------- carro de lado (virado para a direita); door = 0..1 aberta ---------- */
function car(x, y, s = 1, o = {}) {
  const col = o.col || '#4A8AC8', colD = mix(col, '#000000', .3), door = o.door || 0;
  let g = `<g transform="translate(${f1(x)},${f1(y)}) scale(${s})"><ellipse cx="0" cy="6" rx="500" ry="30" fill="#000" opacity=".45" filter="url(#b12)"/>`;
  const body = `M-470 -70 L-480 -230 Q-450 -275 -360 -285 L-250 -295 L-160 -425 Q-130 -455 -80 -455 L180 -455 Q230 -455 262 -414 L345 -300 L432 -282 Q484 -262 484 -200 L474 -70 Z`;
  g += `<path d="${body}" fill="${col}" stroke="${OUTL}" stroke-width="6"/><path d="M-470 -150 L474 -150" stroke="${colD}" stroke-width="10" opacity=".6"/><path d="M-440 -250 Q0 -300 440 -260" stroke="#fff" stroke-width="8" opacity=".25" fill="none"/>`;
  g += `<path d="M-145 -418 L-95 -438 L42 -438 L42 -300 L-228 -300Z" fill="#9CC4E4" stroke="${OUTL}" stroke-width="5"/><path d="M62 -438 L172 -438 Q212 -438 238 -402 L314 -300 L62 -300Z" fill="#9CC4E4" stroke="${OUTL}" stroke-width="5"/><path d="M-120 -400 L-60 -420 L-120 -320Z M90 -420 L150 -420 L90 -330Z" fill="#fff" opacity=".35"/>`;
  // porta da frente (abre girando na dobradiça da frente)
  const dp = `<g><path d="M52 -300 L332 -300 L344 -80 L52 -80Z" fill="${col}" stroke="${OUTL}" stroke-width="5"/><rect x="226" y="-262" width="74" height="22" rx="10" fill="#C8CCD4" stroke="${OUTL}" stroke-width="4"/><circle cx="314" cy="-251" r="8" fill="#2A2A30" stroke="#C8CCD4" stroke-width="3"/></g>`;
  if (door > 0) g += `<path d="M52 -300 L332 -300 L344 -80 L52 -80Z" fill="#14161E"/><path d="M80 -280 L200 -280 L190 -120 L80 -120Z" fill="#3A2A22"/>`;
  g += `<g transform="translate(340,0) scale(${f1((1 - .72 * door) * 1000) / 1000},1) translate(-340,0)">${dp}${door > 0 ? `<path d="M52 -300 L332 -300 L344 -80 L52 -80Z" fill="#000" opacity="${op(.35 * door)}"/>` : ''}</g>`;
  g += `<path d="M-460 -70 Q-460 -16 -420 -16 L-380 -16 M380 -16 L430 -16 Q474 -16 474 -70" stroke="${OUTL}" stroke-width="6" fill="none"/>`;
  [-300, 300].forEach(wx => { g += `<circle cx="${wx}" cy="-30" r="92" fill="#1A1A1E" stroke="${OUTL}" stroke-width="6"/><circle cx="${wx}" cy="-30" r="44" fill="#A8ACB4" stroke="${OUTL}" stroke-width="4"/>${[0, 1, 2, 3, 4].map(i => `<line x1="${wx}" y1="-30" x2="${f1(wx + Math.cos(i * 1.256) * 40)}" y2="${f1(-30 + Math.sin(i * 1.256) * 40)}" stroke="#6A6E76" stroke-width="5"/>`).join('')}`; });
  g += `<g transform="translate(-470,-130)"><rect x="-6" y="-26" width="150" height="52" rx="6" fill="#F4F4EC" stroke="${OUTL}" stroke-width="4"/><rect x="-6" y="-26" width="150" height="14" rx="4" fill="#2A4AA8"/><text x="69" y="18" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="19" fill="#1A1A22">HRYZ ANIMATION</text></g>`;
  g += `<path d="M474 -230 L484 -180 L450 -180 Z" fill="#FFF4C8" stroke="${OUTL}" stroke-width="3"/><rect x="-484" y="-236" width="20" height="44" fill="#E8302A" stroke="${OUTL}" stroke-width="3"/>`;
  if (o.police) { const bl = Math.sin(o.t * 14) > 0; g += `<rect x="-150" y="-300" width="300" height="200" fill="#F4F4F0" opacity=".9"/><rect x="-60" y="-490" width="120" height="36" rx="10" fill="#1A1A20" stroke="${OUTL}" stroke-width="4"/><rect x="-54" y="-486" width="52" height="28" rx="6" fill="${bl ? '#FF3A3A' : '#5A1A1A'}"/><rect x="2" y="-486" width="52" height="28" rx="6" fill="${bl ? '#1A2A5A' : '#3A6AFF'}"/><circle cx="${bl ? -28 : 28}" cy="-472" r="140" fill="${bl ? '#FF3A3A' : '#3A6AFF'}" opacity=".35" filter="url(#b30)"/>`; }
  return g + '</g>';
}
const chaveiro = (x, y, s, rot = 0) => `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(rot)}) scale(${s})"><circle r="26" fill="none" stroke="#C8CCD4" stroke-width="7"/><g transform="translate(18,18) rotate(40)"><circle r="20" fill="#1A1A20" stroke="${OUTL}" stroke-width="3"/><rect x="-6" y="16" width="12" height="70" fill="#C8CCD4" stroke="${OUTL}" stroke-width="3"/><path d="M6 46 h10 v8 h-10 M6 64 h12 v8 h-12" fill="#C8CCD4" stroke="${OUTL}" stroke-width="2"/></g><rect x="-36" y="10" width="34" height="22" rx="6" fill="#E8C040" stroke="${OUTL}" stroke-width="3"/></g>`;
const cane = (len = 420, rot = 0) => `<g transform="rotate(${f1(rot)})"><path d="M0 0 L0 ${len}" stroke="#6A4428" stroke-width="16" stroke-linecap="round"/><path d="M0 0 Q0 -50 -40 -50 Q-70 -50 -70 -20" stroke="#6A4428" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M-4 20 L-4 ${len - 20}" stroke="#A87A4A" stroke-width="4"/></g>`;

/* ---------- fechadura em corte ---------- */
const PT = 820, PBt = 1040, WX = [330, 420, 510, 600, 690], WD = [60, 30, 75, 45, 65];
function keyH(u) { if (u < 0 || u > 640) return 0; let h = 90; WX.forEach((x, i) => { h = Math.min(h, WD[i] + 1.6 * Math.abs(u - (x - 280))); }); return Math.max(0, Math.min(h, u * 2.2)); }
function lockCut(t, o) {
  const ha = o.housing ?? 1, tip = o.tip ?? 1000, rot = o.rot || 0, jig = o.jig || 0, latch = o.latch || 0, ghost = o.ghost ?? 1, lifts = o.lifts || [0, 0, 0, 0, 0];
  let s = `<rect x="-900" y="-900" width="2900" height="3800" fill="#0C1626"/><rect x="-900" y="-900" width="2900" height="3800" fill="url(#gridP)" opacity=".5"/>`;
  // porta (chapa) com camadas de tinta
  s += `<rect x="880" y="360" width="34" height="1160" fill="#4A8AC8" stroke="${OUTL}" stroke-width="4"/><rect x="872" y="360" width="8" height="1160" fill="#C8CCD4"/><rect x="914" y="360" width="10" height="1160" fill="#2A5A8A"/><rect x="876" y="${PT + 150}" width="52" height="58" fill="#0C1626"/>`;
  // carcaça (housing) — sólida no começo, depois transparente
  const hc = `rgba(150,158,170,${f1(ha * 100) / 100})`;
  s += `<rect x="200" y="${PT - 90}" width="680" height="${PBt - PT + 180}" rx="40" fill="${hc}" stroke="#C8D2E0" stroke-width="5"/>`;
  WX.forEach(x => { s += `<rect x="${x - 26}" y="${PBt}" width="52" height="84" fill="#0C1626" opacity="${op(1 - ha * .7)}" stroke="#8A96A8" stroke-width="3"/><rect x="${x - 26}" y="${PT - 84}" width="52" height="84" fill="#0C1626" opacity="${op(1 - ha * .7)}" stroke="#8A96A8" stroke-width="3"/>`; });
  if (ha > .6) s += `<rect x="200" y="${PT - 90}" width="680" height="60" rx="30" fill="#fff" opacity="${op((ha - .6) * .5)}"/>`;
  s += `<text x="540" y="${PBt + 72}" text-anchor="middle" font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="40" letter-spacing="6" fill="#E8EEF6" opacity="${op(.25 + .6 * ha)}" stroke="#0C1626" stroke-width="1.5">HRYZ ANIMATION</text>`;
  // miolo (plug) com listras que andam quando gira
  const aligned = WX.every((x, i) => Math.abs(WD[i] - keyH(x - tip) - lifts[i]) < 4);
  s += `<rect x="240" y="${PT}" width="620" height="${PBt - PT}" fill="#B88A3A" stroke="${OUTL}" stroke-width="5"/>`;
  for (let i = 0; i < 6; i++) { const yy = PT + ((i * 44 + rot * 220) % 220); s += `<line x1="240" y1="${f1(yy)}" x2="860" y2="${f1(yy)}" stroke="#E8C070" stroke-width="5" opacity=".35"/>`; }
  // linha de corte (onde tudo precisa alinhar)
  const ok = aligned ? 1 : 0;
  s += `<path d="M240 ${PT} L860 ${PT} M240 ${PBt} L860 ${PBt}" stroke="${ok ? '#3AFF8A' : '#FFFFFF'}" stroke-width="${ok ? 8 : 3}" stroke-dasharray="${ok ? '0' : '14 10'}" opacity="${ok ? .9 : .5}"/>`;
  if (ok) s += `<path d="M240 ${PT} L860 ${PT} M240 ${PBt} L860 ${PBt}" stroke="#3AFF8A" stroke-width="30" opacity=".25" filter="url(#b12)"/>`;
  // plaquinhas (wafers) com janela e mola
  WX.forEach((x, i) => {
    const off = (WD[i] - keyH(x - tip) - lifts[i]) * (1 - rot) + Math.sin(t * 40 + i) * 4 * jig, top = PT + off, win = 170 - WD[i];
    const flush = Math.abs(off) < 4, colW = flush ? '#3ACF7A' : '#E8C860';
    s += `<path d="M${x - 20} ${f1(top)} h40 v220 h-40Z M${x - 10} ${f1(top + win - 80)} v80 h20 v-80Z" fill="${colW}" fill-rule="evenodd" stroke="${OUTL}" stroke-width="4" opacity="${op(1 - rot * .6)}"/>`;
    if (off > 4) s += `<rect x="${x - 20}" y="${PBt}" width="40" height="${f1(off)}" fill="#FF3A3A" stroke="${OUTL}" stroke-width="3"/>`;
    if (off < -4) s += `<rect x="${x - 20}" y="${f1(top)}" width="40" height="${f1(-off)}" fill="#FF3A3A" stroke="${OUTL}" stroke-width="3"/>`;
    const sp0 = PT - 80, sp1 = top, n = 7; let zp = `M${x} ${sp0}`; for (let k = 1; k <= n; k++) zp += ` L${x + (k % 2 ? 16 : -16)} ${f1(sp0 + (sp1 - sp0) * k / n)}`;
    s += `<path d="${zp}" stroke="#D8E4F0" stroke-width="5" fill="none" opacity="${op(1 - rot)}"/>`;
  });
  // chave: perfil dos dentes + cabeça
  if (tip < 1400) {
    let kp = `M${tip} ${PT + 205}`; for (let u = 0; u <= 640; u += 8) kp += ` L${f1(tip + u)} ${f1(PT + 170 - keyH(u))}`; kp += ` L${tip + 640} ${PT + 205}Z`;
    s += `<g opacity="${op(ghost)}"><path d="${kp}" fill="${ghost < 1 ? '#9AD8FF' : '#D8DCE4'}" fill-opacity="${ghost < 1 ? .35 : 1}" stroke="${ghost < 1 ? '#BFEAFF' : OUTL}" stroke-width="4" stroke-dasharray="${ghost < 1 ? '12 8' : '0'}"/><path d="M${tip + 20} ${PT + 196} L${tip + 620} ${PT + 196}" stroke="#fff" stroke-width="4" opacity=".6"/>`;
    const bw = Math.max(.08, Math.cos(rot * Math.PI / 2));
    s += `<g transform="translate(${tip + 640},${PT + 180}) scale(${f1(bw * 100) / 100},1)"><rect x="0" y="-40" width="60" height="80" fill="#D8DCE4" stroke="${OUTL}" stroke-width="4"/><path d="M60 -110 Q220 -120 220 0 Q220 120 60 110Z" fill="#1A1A22" stroke="${OUTL}" stroke-width="5"/><circle cx="160" cy="0" r="28" fill="#0C1626" stroke="#5A5A66" stroke-width="5"/></g></g>`;
  }
  if (o.wire) { const [wx, wy] = o.wire; s += `<path d="M1300 ${PT + 190} L${f1(wx + 60)} ${PT + 190} L${f1(wx + 20)} ${f1(wy + 10)} L${f1(wx)} ${f1(wy)}" stroke="#C8A060" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M1300 ${PT + 186} L${f1(wx + 60)} ${PT + 186}" stroke="#FFE0A0" stroke-width="3" opacity=".6"/>`; }
  // came + haste + trinco (lado esquerdo)
  const ca = rot * 90;
  s += `<g transform="translate(220,${(PT + PBt) / 2}) rotate(${f1(-ca)})"><rect x="-26" y="-14" width="120" height="28" rx="12" fill="#A8B0BC" stroke="${OUTL}" stroke-width="4"/><circle r="24" fill="#6A7280" stroke="${OUTL}" stroke-width="4"/></g>`;
  const cx2 = 220 + Math.cos(rad(-ca)) * 90, cy2 = (PT + PBt) / 2 + Math.sin(rad(-ca)) * 90;
  const ry = 1420 - rot * 60;
  s += `<path d="M${f1(cx2)} ${f1(cy2)} L130 ${f1(ry - 40)}" stroke="#C8D0DC" stroke-width="12" stroke-linecap="round"/>`;
  s += `<g transform="translate(130,${f1(ry)})"><rect x="-80" y="-40" width="160" height="200" rx="16" fill="#3A4250" stroke="${OUTL}" stroke-width="5"/><g transform="translate(40,120) rotate(${f1(latch * 70)})"><path d="M0 0 L-90 0 Q-110 0 -110 -24 L-110 -50 L-80 -50 L-80 -24 L0 -24Z" fill="#C8D0DC" stroke="${OUTL}" stroke-width="4"/></g><path d="M-170 70 L-130 70 L-130 150 L-170 150" stroke="#E8C040" stroke-width="16" fill="none" opacity="${op(1 - latch)}"/></g>`;
  // visão de frente (inserto) do miolo girando
  const ix = 540, iy = 400, ang = rot * 90 + jig * Math.sin(t * 30) * 7;
  s += `<g transform="translate(${ix},${iy})"><circle r="196" fill="#0A1220" stroke="#C8D2E0" stroke-width="4" opacity=".9"/><circle r="170" fill="#9AA2AE" stroke="${OUTL}" stroke-width="5"/><rect x="-24" y="${f1(110)}" width="48" height="50" fill="#0A1220"/><rect x="-24" y="-160" width="48" height="50" fill="#0A1220"/><g transform="rotate(${f1(ang)})"><circle r="110" fill="#B88A3A" stroke="${OUTL}" stroke-width="5"/><rect x="-14" y="-60" width="28" height="120" fill="#0A1220"/>`;
  const allIn = aligned || rot > 0, prot = allIn ? 0 : 1;
  s += `<rect x="-22" y="-110" width="44" height="${f1(220 + 46 * prot)}" fill="${allIn ? '#3ACF7A' : '#E8C860'}" stroke="${OUTL}" stroke-width="4" opacity=".9"/>${prot ? `<rect x="-22" y="110" width="44" height="46" fill="#FF3A3A" stroke="${OUTL}" stroke-width="3"/>` : ''}</g>${jig > 0 && Math.sin(t * 30) > .6 ? `<circle cx="0" cy="134" r="40" fill="#FF3A3A" opacity=".5" filter="url(#b12)"/>` : ''}</g>`;
  return s;
}

/* ---------- 1. a senhora tranca o carro e entra na padaria ---------- */
const CARX = 420;
function s1(t) {
  const { L, d, k } = loc(t, 'n1'), [hx, hy] = HH(t);
  setCam(lerp(420, 620, k) + hx, lerp(1180, 1220, k) + hy, lerp(1.0, .92, k), 0, [540, 1200, 1]);
  let s = lay(.9, nightStreet(t)) + lay(1, car(CARX, GND, 1));
  const turn = range(L, .1, 1.1), walk = range(L, 1.3, d), lx = 560 + walk * 400, gone = range(L, 3.3, 3.8);
  if (turn > .6 && turn < .9) s += lay(1, `<circle cx="${CARX + 314}" cy="${GND - 251}" r="40" fill="#FFF4C0" opacity=".5" filter="url(#b12)"/>`);
  s += lay(1, `<g opacity="${op(1 - gone)}">${man({ x: lx, y: GND, s: .58, kind: 'idosa', ...walkPose(L * 6, walk > 0 && walk < 1 ? .7 : 0), armF: walk > 0 ? [20, 10] : [92, -8 + 8 * Math.sin(turn * 9)], armB: [30, 40], heldB: `<path d="M-30 0 L30 0 L40 90 L-40 90Z" fill="#C8A060" stroke="${OUTL}" stroke-width="4"/>`, held: walk > 0 ? '' : chaveiro(0, 0, .5) })}</g>`);
  const eyes = range(L, 2.6, 3.0);
  if (eyes > 0) s += lay(.9, `<g opacity="${op(eyes)}"><circle cx="-250" cy="${GND - 470}" r="9" fill="#FFF4C0"/><circle cx="-214" cy="${GND - 470}" r="9" fill="#FFF4C0"/><circle cx="-232" cy="${GND - 470}" r="60" fill="#FFF4C0" opacity=".12" filter="url(#b12)"/></g>`);
  return s + VIG(.9);
}
/* ---------- 2. o bandido chega e enfia um arame na fechadura ---------- */
const wireH = (len = 120) => `<path d="M0 0 L${len} 0 L${len + 20} -26" stroke="#C8A060" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
function s2(t) {
  const { L, d, k } = loc(t, 'n2'), [hx, hy] = HH(t);
  const zk = easeIn(range(L, 3.6, d)), z0 = lerp(.95, 1.25, easeInOut(range(L, 2.8, 3.6)));
  setCam(lerp(lerp(160, 600, easeInOut(range(L, 0, 2.4))), 734, zk) + hx * (1 - zk), lerp(lerp(1200, 1260, range(L, 2.6, 3.6)), 1249, zk) + hy * (1 - zk), z0 * Math.pow(1.6 / z0, zk), 0, [540, 1200, 1]);
  let s = lay(.9, nightStreet(t)) + lay(1, car(CARX, GND, 1));
  const walk = range(L, 0, 2.0), bx = lerp(-260, 560, easeOut(walk));
  const look = L > 2.1 && L < 2.7 ? -1 : 0, cr = easeInOut(range(L, 2.8, 3.4)), reach = range(L, 3.6, d - .1);
  const pose = cr > 0 ? { drop: 220 * cr, lean: 18 * cr, legF: [85 * cr, -100 * cr], legB: [-15 * cr, 100 * cr] } : walkPose(L * 9, walk < 1 ? 1 : 0);
  s += lay(1, man({ x: bx, y: GND, s: .58, kind: 'bandido', ...pose, look, armF: L > 3.4 ? [lerp(60, 112, reach), lerp(30, -6, reach)] : [lerp(10, 60, range(L, 2.5, 3.0)), lerp(10, 50, range(L, 2.5, 3.0))], armB: cr > 0 ? [lerp(10, 70, cr), 30] : [-10, 10], held: L > 2.6 ? wireH() : '' }));
  return s + VIG(.9);
}
/* ---------- 3. close na fechadura → vista lateral → carcaça some ---------- */
function s3(t) {
  const { L, d, k } = loc(t, 'n3');
  const ex = (a, b, p) => a * Math.pow(b / a, clamp(p));
  let s = `<rect width="1080" height="1920" fill="#000"/>`;
  if (L < 1.25) {   // rua: a câmera continua fechando na fechadura
    const p = easeIn(range(L, 0, 1.25));
    setCam(734, 1249, ex(1.6, 6, p), 0, [540, 1200, 1]);
    s += lay(.9, nightStreet(t)) + lay(1, car(CARX, GND, 1)) + lay(1, man({ x: 560, y: GND, s: .58, kind: 'bandido', drop: 220, lean: 18, legF: [85, -100], legB: [-15, 100], armF: [112, -6], armB: [70, 30], held: wireH() }));
  }
  if (L > .85 && L < 2.15) {   // close da porta: o arame entra e a câmera mergulha no buraco
    const p = range(L, .85, 2.05), a = range(L, .85, 1.25);
    setCam(840, 965, ex(.35, 9, easeIn(p)), 0, [540, 960, 1]);
    let c = '';
    c += `<rect x="-3000" y="-3000" width="7000" height="8000" fill="#4A8AC8"/><rect x="-3000" y="-3000" width="7000" height="8000" fill="url(#dotP)" opacity=".25"/><path d="M-900 400 Q540 300 2000 420" stroke="#fff" stroke-width="40" opacity=".12" fill="none"/>`;
    c += lay(1, `<rect x="-200" y="860" width="900" height="210" rx="100" fill="#C8CCD4" stroke="${OUTL}" stroke-width="8"/><rect x="-200" y="860" width="900" height="60" rx="30" fill="#fff" opacity=".35"/><circle cx="840" cy="965" r="120" fill="#B8BCC4" stroke="${OUTL}" stroke-width="8"/><circle cx="840" cy="965" r="80" fill="#9AA0A8" stroke="${OUTL}" stroke-width="5"/><rect x="826" y="910" width="28" height="110" rx="10" fill="#14161C"/><path id="ringP" d="M740 965 A100 100 0 0 1 940 965" fill="none"/><text font-family="'DejaVu Sans',sans-serif" font-weight="700" font-size="22" letter-spacing="3" fill="#3A3E46"><textPath href="#ringP" startOffset="50%" text-anchor="middle">HRYZ ANIMATION</textPath></text>`);
        const q = easeOut(range(L, .9, 1.7)), kx = lerp(1300, 840, q), ky = lerp(1500, 965, q), ks = lerp(2.6, 1.0, q);
    c += lay(1, `<g transform="translate(${f1(kx)},${f1(ky)}) scale(${f1(ks * 100) / 100})"><path d="M0 0 L60 140 Q80 200 40 260" stroke="#C8A060" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M4 4 L62 136" stroke="#FFE0A0" stroke-width="3" opacity=".6"/></g>` + vhand('pinca', kx + 60 * ks, ky + 250 * ks, .5 * ks, -20));
    s += `<g opacity="${op(a)}">${c}</g>`;
  }
  if (L > 1.95) {   // sai do buraco já na vista lateral; a carcaça fica transparente
    const p = easeOut(range(L, 2.0, 3.2)), a = range(L, 1.95, 2.15);
    setCam(lerp(902, 560, p), lerp(PT + 179, 880, p), ex(10, 1.35, p), 0, [560, 880, 1]);
    s += `<g opacity="${op(a)}">${lay(1, lockCut(t, { housing: 1 - easeInOut(range(L, 2.9, 3.9)) * .9, tip: 1000 }))}</g>`;
  }
  return s + VIG(.7);
}
/* ---------- 4. as plaquinhas travam: tenta girar, não gira ---------- */
function s4(t) {
  const { L, d, k } = loc(t, 'n4');
  setCam(lerp(580, 540, k), lerp(860, 900, k), lerp(1.35, 1.45, k), 0, [560, 880, 1]);
  const jig = L > 3.8 && L < 5.6 ? 1 : 0;
  let s = lay(1, lockCut(t, { housing: .1, tip: 1000, jig }));
  // destaque piscando nas partes vermelhas
  if (L > 1.6 && L < 3.6) s += lay(1, WX.map(x => `<circle cx="${x}" cy="${PBt + 40}" r="${f1(46 + 8 * Math.sin(t * 8))}" fill="none" stroke="#FF3A3A" stroke-width="6" opacity=".8"/>`).join(''));
  if (jig) s += `<rect width="1080" height="1920" fill="#FF2020" opacity="${op(.06 + .06 * Math.sin(t * 30))}"/>`;
  return s + VIG(.7);
}
/* ---------- 5. a chave certa (fantasma) alinha tudo de uma vez ---------- */
function s5(t) {
  const { L, d, k } = loc(t, 'n5');
  const tip = L < 4.4 ? lerp(1000, 280, easeInOut(range(L, .3, 3.6))) : lerp(280, 1000, easeIn(range(L, 4.6, 5.8)));
  setCam(lerp(600, 540, k), 890, lerp(1.35, 1.45, k), 0, [560, 880, 1]);
  return lay(1, lockCut(t, { housing: .1, tip, ghost: .75 })) + VIG(.7);
}
/* ---------- 6. o arame: levanta uma, as outras travam; não gira ---------- */
function s6(t) {
  const { L, d, k } = loc(t, 'n6');
  setCam(lerp(540, 600, k), 890, lerp(1.45, 1.6, k), 0, [560, 880, 1]);
  const prog = range(L, .4, 4.2) * 4, cur = Math.min(4, Math.floor(prog)), within = prog - Math.floor(prog);
  const lifts = WD.map((dd, i) => i < cur ? dd : (i === cur ? dd * Math.min(.85, Math.abs(Math.sin(within * Math.PI * 1.5)) * (i === 4 ? .8 : 1)) : 0));
  const x = WX[cur], wx = L < .4 ? lerp(1100, x, L / .4) : x + Math.sin(L * 7) * 6, wy = PT + 170 - lifts[cur] - 10;
  let s = lay(1, lockCut(t, { housing: .1, tip: 1500, wire: [wx, wy], lifts, jig: L > 4.4 ? .4 : 0 }));
  // contador de plaquinhas acertadas
  const n = Math.min(4, cur);
  s += `<g transform="translate(540,1560)">${[0, 1, 2, 3, 4].map(i => `<circle cx="${(i - 2) * 110}" cy="0" r="40" fill="${i < n ? '#3ACF7A' : '#3A2A2A'}" stroke="${i === 4 ? '#FF3A3A' : OUTL}" stroke-width="${i === 4 ? 8 : 5}"/>`).join('')}</g>`;
  if (L > 4.4) s += `<circle cx="${(4 - 2) * 110 + 540}" cy="1560" r="${f1(60 + 10 * Math.sin(t * 12))}" fill="none" stroke="#FF3A3A" stroke-width="6" opacity=".8"/>`;
  return s + VIG(.7);
}
/* ---------- 7. ele força a porta... e a senhora chega por trás ---------- */
function s7(t) {
  const { L, d, k } = loc(t, 'n7'), [hx, hy] = HH(t);
  setCam(lerp(700, 820, k) + hx, 1200 + hy, lerp(1.05, .95, k), 0, [540, 1200, 1]);
  const shake = Math.sin(t * 22) * 8 * (L < 2.8 ? 1 : 0);
  let s = lay(.9, nightStreet(t)) + lay(1, car(CARX, GND, 1));
  s += lay(1, man({ x: 560, y: GND, s: .58, kind: 'bandido', drop: 220, lean: 18, legF: [85, -100], legB: [-15, 100], armF: [112 + shake * .4, -6], armB: [70, 30], held: wireH() }));
  for (let i = 0; i < 3; i++) { const p = (L * 1.4 + i * .33) % 1; s += lay(1, `<path d="M${f1(520 + i * 30)} ${f1(GND - 560 + p * 60)} q6 12 0 20 q-6 -8 0 -20Z" fill="#9AD0FF" opacity="${op(1 - p)}"/>`); }
  const lx = lerp(1600, 980, easeOut(range(L, .4, 2.8)));
  s += lay(1, man({ x: lx, y: GND, s: .58, kind: 'idosa', flip: -1, ...walkPose(L * 7, L < 2.8 ? .7 : 0), armF: L > 2.8 ? [170, 10] : [30, 10], held: cane(420, L > 2.8 ? 160 : 0), armB: [30, 40], heldB: `<path d="M-30 0 L30 0 L40 90 L-40 90Z" fill="#C8A060" stroke="${OUTL}" stroke-width="4"/>`, mouth: L > 2.8 ? .6 : 0 }));
  return s + VIG(.9);
}
/* ---------- 8. BENGALADA ---------- */
function s8(t) {
  const { L, d, k } = loc(t, 'n8');
  const hit = .55, sh = L > hit && L < hit + .35 ? 18 : 0;
  setCam(700 + sh * noise1(t * 50, 1), 1180 + sh * noise1(t * 50, 4), 1.35, 0, [540, 1100, 1]);
  let s = lay(.9, nightStreet(t)) + lay(1, car(CARX, GND, 1));
  const fall = easeIn(range(L, hit + .3, hit + 1.1));
  s += lay(1, `<g transform="rotate(${f1(-80 * fall)} 560 ${GND})">${man({ x: 560, y: GND, s: .58, kind: 'bandido', drop: 220 * (1 - fall * .6), lean: 18, legF: [85, -100], legB: [-15, 100], armF: [lerp(112, 170, range(L, hit, hit + .2)), 0], armB: [lerp(70, 160, range(L, hit, hit + .2)), 0], held: L < hit ? wireH() : '', shadow: 0 })}</g>`);
  const sw = range(L, .2, hit);
  if (L > hit) { const fl = range(L, hit, hit + .5); s += lay(1, `<g transform="translate(${f1(700 + 60 * fl)},${f1(GND - 260 + 250 * easeIn(fl))}) rotate(${f1(fl * 300)})">${wireH()}</g>`); }
  s += lay(1, man({ x: 830, y: GND, s: .58, kind: 'idosa', flip: -1, armF: [lerp(170, 50, easeIn(sw)), 10], held: cane(420, lerp(160, 60, easeIn(sw))), mouth: .8 }));
  if (L > hit) {
    const p = range(L, hit, hit + 1.6), hx2 = 560 - 220 * fall, hy2 = GND - 520 * (1 - fall) - 60;
    s += lay(1, `<g opacity="${op(1 - range(L, hit + 1.6, hit + 2.0))}">${Array.from({ length: 5 }, (_, i) => { const a = t * 5 + i * 1.256; return `<path d="M0 -22 L6 -7 L22 -7 L9 3 L14 19 L0 9 L-14 19 L-9 3 L-22 -7 L-6 -7Z" fill="#FFD832" stroke="${OUTL}" stroke-width="3" transform="translate(${f1(hx2 + Math.cos(a) * 110)},${f1(hy2 + Math.sin(a) * 34)}) scale(1.3)"/>`; }).join('')}</g>`);
    if (L < hit + .12) s += `<rect width="1080" height="1920" fill="#fff" opacity="${op(.7 * (1 - (L - hit) / .12))}"/>`;
    s += lay(1, `<g opacity="${op(1 - range(L, hit, hit + .4))}">${Array.from({ length: 10 }, (_, i) => `<path d="M${560} ${GND - 520} l${f1(Math.cos(i * .63) * 170)} ${f1(Math.sin(i * .63) * 170)}" stroke="#FFF4C0" stroke-width="10" stroke-linecap="round"/>`).join('')}</g>`);
  }
  return s + VIG(.9);
}
/* ---------- 9. polícia: algemas; a senhora recupera a chave ---------- */
function ladyBack(blink) {
  const rim = blink ? '#FF5A5A' : '#5A8AFF';
  let g = `<g filter="url(#b4)">`;
  g += `<path d="M-160 1960 L-150 1660 Q-110 1470 120 1430 L560 1430 Q790 1470 820 1660 L840 1960Z" fill="#B86A8A" stroke="${OUTL}" stroke-width="8"/>`;
  g += `<path d="M-150 1660 Q-110 1470 120 1430" stroke="${rim}" stroke-width="10" fill="none" opacity=".0"/><path d="M560 1430 Q790 1470 820 1660 L840 1960" stroke="${rim}" stroke-width="14" fill="none" opacity=".8"/>`;
  g += `<path d="M120 1430 Q340 1500 560 1430" stroke="#9A5470" stroke-width="24" fill="none"/>${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${-60 + i * 150} 1600 l0 340" stroke="#9A5470" stroke-width="5" opacity=".5"/>`).join('')}`;
  g += `<rect x="270" y="1320" width="130" height="140" fill="#CCA486" stroke="${OUTL}" stroke-width="5"/>`;
  g += `<ellipse cx="560" cy="1220" rx="34" ry="54" fill="#EAC4A6" stroke="${OUTL}" stroke-width="5"/><path d="M560 1190 L700 1170" stroke="#3A2A20" stroke-width="7"/>`;
  g += `<ellipse cx="335" cy="1200" rx="215" ry="245" fill="#ECECEC" stroke="${OUTL}" stroke-width="8"/>`;
  for (let i = 0; i < 12; i++) g += `<path d="M${200 + i * 24} 980 Q${180 + i * 26} 1200 ${210 + i * 22} 1420" stroke="#C8C8CC" stroke-width="4" fill="none" opacity=".7"/>`;
  g += `<circle cx="335" cy="975" r="95" fill="#E2E2E6" stroke="${OUTL}" stroke-width="7"/><path d="M270 960 Q335 920 400 960" stroke="#B8B8C0" stroke-width="5" fill="none"/><rect x="380" y="940" width="70" height="10" rx="4" fill="#C8A040" transform="rotate(-20 380 940)"/>`;
  g += `<path d="M520 1050 Q560 1200 520 1400" stroke="${rim}" stroke-width="16" fill="none" opacity=".8"/><path d="M410 900 Q440 960 420 1030" stroke="${rim}" stroke-width="10" fill="none" opacity=".7"/>`;
  g += `<g transform="translate(930,1720)"><path d="M0 0 Q0 -70 -60 -70 Q-110 -70 -110 -30" stroke="#6A4428" stroke-width="30" fill="none" stroke-linecap="round"/><path d="M0 0 L0 300" stroke="#6A4428" stroke-width="30"/><ellipse cx="-20" cy="10" rx="56" ry="42" fill="#EAC4A6" stroke="${OUTL}" stroke-width="5"/></g>`;
  return g + `</g><path d="M560 1430 Q790 1470 820 1660" stroke="${rim}" stroke-width="40" fill="none" opacity=".35" filter="url(#b12)"/>`;
}
function s9(t) {
  const { L, d, k } = loc(t, 'n9'), [hx, hy] = HH(t);
  const blink = Math.sin(t * 14) > 0;
  let s = '';
  if (L < 2.6) {
  setCam(lerp(900, 760, k) + hx, 1200 + hy, .9, 0, [540, 1200, 1]);
    s = lay(.9, nightStreet(t)) + lay(1, car(CARX, GND, 1));
    const px = lerp(2400, 1700, easeOut(range(L, 0, 1.4)));
    s += lay(1, car(px, GND, 1, { col: '#1A1A22', police: true, t }));
    const blink = Math.sin(t * 14) > 0;
    s += `<rect width="1080" height="1920" fill="${blink ? '#FF2A2A' : '#2A4AFF'}" opacity=".08"/>`;
    // bandido em pé, mãos para trás; policial atrás algemando
    const cuff = L > 2.4;
    s += lay(1, man({ x: 760, y: GND, s: .58, kind: 'bandido', armF: [-35, -60], armB: [-40, -60], eyes: 1, mouth: .2, lean: 8 }));
    s += lay(1, man({ x: 930, y: GND, s: .6, kind: 'policia', flip: -1, armF: [70, 10], armB: [-10, 10] })) + lay(1, man({ x: 580, y: GND, s: .6, kind: 'policia', ...walkPose(L * 8, L < 1.6 ? 1 : 0), armF: [lerp(20, 80, range(L, 1.8, 2.4)), lerp(10, -20, range(L, 1.8, 2.4))], armB: [60, 10] }));
    if (cuff) s += lay(1, `<g transform="translate(700,${GND - 300})"><circle cx="0" cy="0" r="22" fill="none" stroke="#C8CCD4" stroke-width="9"/><circle cx="34" cy="8" r="22" fill="none" stroke="#C8CCD4" stroke-width="9"/></g>`);
    // senhora com a chave levantada, piscando para a câmera
    const wave = Math.sin(t * 8) * 10;
    s += lay(1, man({ x: 1150, y: GND, s: .58, kind: 'idosa', flip: -1, armF: [170, wave], held: cane(420, 160 + Math.sin(t * 8) * 10), armB: [20, 10], eyes: L > 3.6 && L < 4.0 ? 0 : 1, mouth: .5 }));
  } else {
    const L2 = L - 2.6, k2 = L2 / (d - 2.6);
    setCam(lerp(1380, 1480, k2) + hx, lerp(1180, 1210, k2) + hy, lerp(.95, 1.05, k2), 0, [540, 1200, 1]);
    s += lay(.9, nightStreet(t)) + lay(1, car(CARX, GND, 1));
    const walk = easeInOut(range(L2, 0, 2.4)), bx = lerp(1050, 1860, walk), inCar = range(L2, 2.4, 2.9), door = range(L2, .2, .8) * (1 - range(L2, 3.0, 3.4));
    s += lay(1, car(1750, GND, 1, { col: '#1A1A22', police: true, t, door }));
    const W = n => walkPose(L2 * 8 + n, walk < 1 ? 1 : 0);
    s += lay(1, `<g opacity="${op(1 - inCar)}">${man({ x: bx - 150, y: GND, s: .6, kind: 'policia', ...W(0), armF: [80, 0] })}${man({ x: bx, y: GND, s: .58, kind: 'bandido', ...W(1), armF: [-35, -60], armB: [-40, -60], lean: 12 })}${man({ x: bx + 150, y: GND, s: .6, kind: 'policia', ...W(2), armB: [-60, 0], armF: [20, 10] })}</g>`);
    s += lay(1, `<rect x="-1500" y="-900" width="4200" height="3800" fill="${blink ? '#FF2A2A' : '#2A4AFF'}" opacity=".12"/>`);
    s += VIG(.9) + ladyBack(blink) + `<rect width="1080" height="1920" fill="${blink ? '#FF2A2A' : '#2A4AFF'}" opacity=".06"/>`;
    return s;
  }
  return s + VIG(.9);
}
const FN = { n1: s1, n2: s2, n3: s3, n4: s4, n5: s5, n6: s6, n7: s7, n8: s8, n9: s9 };

function frame(t) {
  D = []; uid = 0;
  const sh = shotAt(t);
  let body = FN[sh[0]](t);
  for (const c of SH.slice(1)) if (t >= c[1] && t < c[1] + .08) body += `<rect width="1080" height="1920" fill="#fff" opacity="${op(.2 * (1 - (t - c[1]) / .08))}"/>`;
  defsEl.innerHTML = STATIC + objDefs() + `<filter id="manVol" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB"><feOffset in="SourceAlpha" dx="-16" dy="8" result="o1"/><feComposite in="SourceAlpha" in2="o1" operator="out" result="e1"/><feGaussianBlur in="e1" stdDeviation="7" result="b1"/><feComposite in="b1" in2="SourceAlpha" operator="in" result="s1"/><feFlood flood-color="#1A1028" flood-opacity=".38"/><feComposite in2="s1" operator="in" result="sh"/><feOffset in="SourceAlpha" dx="7" dy="-7" result="o2"/><feComposite in="SourceAlpha" in2="o2" operator="out" result="e2"/><feGaussianBlur in="e2" stdDeviation="2.5" result="b2"/><feComposite in="b2" in2="SourceAlpha" operator="in" result="r1"/><feFlood flood-color="#FFF0D0" flood-opacity=".55"/><feComposite in2="r1" operator="in" result="rim"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="sh"/><feMergeNode in="rim"/></feMerge></filter><radialGradient id="gHot"><stop offset="0" stop-color="#FF3A1A" stop-opacity=".95"/><stop offset=".5" stop-color="#FF7A2A" stop-opacity=".6"/><stop offset="1" stop-color="#FFB03A" stop-opacity="0"/></radialGradient><filter id="bl6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
<linearGradient id="beamW2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF0C0" stop-opacity=".6"/><stop offset="1" stop-color="#FFF0C0" stop-opacity="0"/></linearGradient><pattern id="gridP" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0 L0 0 0 60" stroke="#2A4A6A" stroke-width="2" fill="none"/></pattern><pattern id="paperP" width="512" height="512" patternUnits="userSpaceOnUse"><image href="${PAPER}" width="512" height="512"/></pattern>
<pattern id="waveP" width="160" height="90" patternUnits="userSpaceOnUse"><path d="M10 30 q20 -14 40 0 t40 0 M90 70 q20 -14 40 0" stroke="#8AC0E8" stroke-width="3" fill="none"/></pattern>
<pattern id="dotP" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2" fill="#000" opacity=".25"/><circle cx="13" cy="12" r="1.5" fill="#000" opacity=".18"/></pattern>
<pattern id="wallP" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M60 10 L80 60 L60 110 L40 60Z" fill="none" stroke="#B8A888" stroke-width="3"/><circle cx="0" cy="0" r="8" fill="#C8B898"/><circle cx="120" cy="120" r="8" fill="#C8B898"/><circle cx="60" cy="60" r="5" fill="#C8B898"/></pattern>
<pattern id="woodP" width="300" height="70" patternUnits="userSpaceOnUse"><rect width="300" height="70" fill="none" stroke="#6A4A2A" stroke-width="3"/><path d="M10 25 q60 -8 120 0 t140 2 M20 50 q80 6 160 -2" stroke="#8A6A4A" stroke-width="2" fill="none"/></pattern>
<pattern id="brickP" width="80" height="40" patternUnits="userSpaceOnUse"><path d="M0 0 H80 M0 20 H80 M0 0 V20 M40 20 V40" stroke="#5A4A3A" stroke-width="3" fill="none"/></pattern>
<pattern id="crackP" width="260" height="200" patternUnits="userSpaceOnUse"><path d="M0 60 L70 40 L120 90 L200 60 L260 80 M70 40 L60 0 M120 90 L100 200 M200 60 L230 0 M120 90 L180 150 L260 140 M0 160 L60 150 L100 200" stroke="#7A4A20" stroke-width="5" fill="none"/></pattern>` + D.join('');
  root.innerHTML = body + TEXTURE;
}
