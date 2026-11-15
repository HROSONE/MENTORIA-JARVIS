// Peixe 3D procedural (corpo em seções elípticas, cauda e nadadeiras laranja, olho, escamas prateadas): três segmentos articulados
// (corpo, meio, cauda) para ondular, se debater e saltar no chão. Comprimento ~27 cm, apontando para +x.
import * as THREE from 'three';
import { clamp } from './util.js';

// casca por seções elípticas (x ao longo do corpo); N+1 colunas para a costura da textura (u: cauda 0 -> nariz 1; v: volta ao redor).
// Normais analíticas (as emendas entre os três segmentos ficam sem linha escura); tampas só nas pontas do peixe.
export function loft(secs, { N = 18, capIni = false, capFim = false, dAlt = null } = {}) {
  const NC = N + 1, pos = [], nor = [], uvs = [], idx = [];
  secs.forEach(s => {
    const dr = dAlt ? dAlt(s.x) : 0;
    for (let k = 0; k <= N; k++) {
      const th = k / N * Math.PI * 2, sn = Math.sin(th), cs = Math.cos(th);
      pos.push(s.x, s.ry * sn, s.rx * cs); uvs.push((s.x + 0.137) / 0.276, k / N);
      const n = new THREE.Vector3(-0.56 * s.ry * dr, 0.56 * s.ry * sn, s.ry * cs).normalize(); nor.push(n.x, n.y, n.z);
    }
  });
  for (let i = 0; i < secs.length - 1; i++) for (let k = 0; k < N; k++) { const a = i * NC + k, b = a + 1, d = a + NC, e = b + NC; idx.push(a, d, b, b, d, e); }
  for (const [i, inv, ativo] of [[0, false, capIni], [secs.length - 1, true, capFim]]) {
    if (!ativo) continue;
    const ci = pos.length / 3; pos.push(secs[i].x, 0, 0); nor.push(inv ? -1 : 1, 0, 0); uvs.push((secs[i].x + 0.137) / 0.276, 0.5);
    for (let k = 0; k < N; k++) { const a = i * NC + k, b = a + 1; inv ? idx.push(ci, a, b) : idx.push(ci, b, a); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx); return g;
}
// pele do peixe: dorso azul-marinho, flancos prateados com faixa lateral laranja, barriga clara, escamas em arcos, opérculo (guelra) e manchas escuras
// relevo das escamas (mesmas coordenadas da pele): arcos claros com sombra por baixo
export function relevoEscamas() {
  const W = 1024, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, W, H);
  for (let row = 0; row < 26; row++) for (let col = 0; col < 42; col++) { const x = col * 24.4 + (row % 2 ? 12.2 : 0), y = row * (H / 26) + 4; const gr = g.createRadialGradient(x, y - 3, 1, x, y, 11); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.7, 'rgba(160,160,160,0.0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.ClampToEdgeWrapping; t.anisotropy = 8; return t;
}
// nadadeira com raios: textura em canvas com raios que saem da base; recebe UV pela caixa do contorno
export function texturaNadadeira(cor = '#ff8a3a', escuro = '#c4501a') {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); g.fillStyle = cor; g.fillRect(0, 0, 256, 128);
  g.strokeStyle = escuro; g.lineWidth = 1.6; for (let i = 0; i < 26; i++) { const a = (i / 25 - 0.5) * 1.6; g.beginPath(); g.moveTo(0, 64); g.lineTo(256, 64 + Math.tan(a) * 256 * 0.8); g.stroke(); }
  const gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, 'rgba(255,255,255,0.0)'); gr.addColorStop(0.7, 'rgba(255,230,200,0.0)'); gr.addColorStop(1, 'rgba(255,240,210,0.35)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
export function uvDaCaixa(geo) { geo.computeBoundingBox(); const b = geo.boundingBox, P = geo.attributes.position, uv = new Float32Array(P.count * 2); for (let i = 0; i < P.count; i++) { uv[i * 2] = (P.getX(i) - b.min.x) / (b.max.x - b.min.x || 1); uv[i * 2 + 1] = (P.getY(i) - b.min.y) / (b.max.y - b.min.y || 1); } geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return geo; }
export function materialPele(env, esc = 1) {
  return new THREE.MeshPhysicalMaterial({ map: texturaPele(), bumpMap: relevoEscamas(), bumpScale: 1.6, color: 0xffffff, roughness: 0.3, metalness: 0.1, envMap: env, envMapIntensity: 0.5, clearcoat: 0.9, clearcoatRoughness: 0.14, iridescence: 0.6, iridescenceIOR: 1.5, iridescenceThicknessRange: [200, 420] });
}
export function texturaPele() {
  const W = 1024, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  // v (linhas): 0 = flanco +z, 0.25 = dorso, 0.5 = flanco -z, 0.75 = barriga
  const sv = v => Math.sin(v * Math.PI * 2);                                       // +1 dorso, -1 barriga
  for (let y = 0; y < H; y++) {
    const h = sv(1 - y / H);
    const mix = (c1, c2, k) => c1.map((v, i) => v + (c2[i] - v) * k);
    let col = [222, 236, 244];                                                      // flanco prateado
    if (h > 0.2) col = mix(col, [16, 64, 150], Math.min(1, (h - 0.2) / 0.5));       // dorso azul
    if (h < -0.4) col = mix(col, [255, 248, 236], Math.min(1, (-h - 0.4) / 0.4));   // barriga
    const st = Math.max(0, 1 - Math.abs(h - 0.02) / 0.15); col = mix(col, [255, 138, 68], st * 0.85); // faixa lateral
    g.fillStyle = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`; g.fillRect(0, y, W, 1);
  }
  g.strokeStyle = 'rgba(40,70,110,0.28)'; g.lineWidth = 1.6;
  for (let row = 0; row < 26; row++) for (let col = 0; col < 40; col++) { const x = col * 25.6 + (row % 2 ? 12.8 : 0), y = row * (H / 26) + 3; g.beginPath(); g.arc(x, y, 9, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
  // cabeça: boné escuro no dorso, opérculo em arco e olho
  g.fillStyle = 'rgba(10,36,90,0.55)'; g.fillRect(W * 0.82, 0, W * 0.18, H * 0.5);
  g.strokeStyle = 'rgba(30,50,80,0.75)'; g.lineWidth = 4; for (const y0 of [H * 0.0, H * 0.5]) { g.beginPath(); g.arc(W * 0.79, y0 + H * 0.25, H * 0.2, -1.3, 1.3); g.stroke(); }
  for (let i = 0; i < 22; i++) { g.fillStyle = 'rgba(15,40,90,0.55)'; const x = 80 + (i * 197) % 700, y = 20 + (i * 53) % 100; g.beginPath(); g.arc(x, y, 3 + (i % 3), 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.ClampToEdgeWrapping; t.anisotropy = 8; return t;
}
const PERFIL = [[-0.137, 0.004], [-0.125, 0.008], [-0.11, 0.013], [-0.085, 0.022], [-0.06, 0.032], [-0.03, 0.044], [0, 0.052], [0.03, 0.054], [0.06, 0.05], [0.09, 0.041], [0.113, 0.028], [0.13, 0.014], [0.139, 0.004]];
const alt = x => { for (let i = 1; i < PERFIL.length; i++) if (x <= PERFIL[i][0]) { const a = PERFIL[i - 1], b = PERFIL[i], u = (x - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * u; } return 0.004; };
const secs = (x0, x1, n) => Array.from({ length: n + 1 }, (_, i) => { const x = x0 + (x1 - x0) * i / n, ry = alt(x); return { x, ry, rx: ry * 0.56 }; });
export function barbatana(pts, cor, dupla = true) {
  const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
  const g = new THREE.ShapeGeometry(sh);
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: cor, side: THREE.DoubleSide, roughness: 0.5, transparent: true, opacity: 0.93 }));
}
// raio (meia-altura) do corpo na estação x (m, a partir do centro; nariz em +0,139)
export const alturaCorpo = alt;
export function criarPeixe(esc = 1, { env = null } = {}) {
  const g = new THREE.Group(), mat = materialPele(env);
  const corpo = new THREE.Group(); g.add(corpo);
  // corpo único com malha "skinned" de três ossos (tronco, meio, cauda): dobra suave nas articulações
  const dAlt = x => (alt(x + 0.002) - alt(x - 0.002)) / 0.004;
  const xs = Array.from({ length: 49 }, (_, i) => 0.139 - 0.276 * i / 48);
  const geo = loft(xs.map(x => ({ x, ry: alt(x), rx: alt(x) * 0.56 })), { capIni: true, capFim: true, dAlt });
  const HB = -0.03, HC = -0.085, W = 0.022, P = geo.attributes.position, si = [], sw = [];
  for (let v = 0; v < P.count; v++) {
    const x = P.getX(v); let a = 0, b = 0, c = 0;
    if (x >= HB + W) a = 1; else if (x > HB - W) { b = (HB + W - x) / (2 * W); a = 1 - b; } else if (x >= HC + W) b = 1; else if (x > HC - W) { c = (HC + W - x) / (2 * W); b = 1 - c; } else c = 1;
    si.push(0, 1, 2, 0); sw.push(a, b, c, 0);
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  const bA = new THREE.Bone(), bB = new THREE.Bone(), bC = new THREE.Bone(); bB.position.x = HB; bC.position.x = HC - HB; bA.add(bB); bB.add(bC);
  const malha = new THREE.SkinnedMesh(geo, mat); malha.add(bA); malha.bind(new THREE.Skeleton([bA, bB, bC])); malha.castShadow = true; malha.frustumCulled = false; corpo.add(malha);
  // nadadeiras: caudal bifurcada (no osso da cauda), dorsal curva (no tronco) e peitorais
  const mFin = new THREE.MeshStandardMaterial({ map: texturaNadadeira(), side: THREE.DoubleSide, roughness: 0.45, transparent: true, opacity: 0.94 });
  const tf = new THREE.Mesh(uvDaCaixa(new THREE.ShapeGeometry(new THREE.Shape([[0, 0.004], [-0.05, 0.058], [-0.036, 0.008], [-0.036, -0.008], [-0.05, -0.058], [0, -0.004]].map(q => new THREE.Vector2(q[0], q[1]))))), mFin); tf.position.x = -0.052; bC.add(tf);
  const dfSh = new THREE.Shape(); dfSh.moveTo(0.0, 0); dfSh.bezierCurveTo(-0.004, 0.026, -0.022, 0.05, -0.062, 0.058); dfSh.bezierCurveTo(-0.05, 0.036, -0.056, 0.016, -0.07, 0); dfSh.lineTo(0, 0);
  const df = new THREE.Mesh(uvDaCaixa(new THREE.ShapeGeometry(dfSh, 10)), mFin); df.position.set(0.045, 0.047, 0); bA.add(df);
  const pf = barbatana([[0, 0], [-0.03, -0.012], [-0.012, -0.03]], 0xffb066); for (const sz of [-1, 1]) { const f = pf.clone(); f.position.set(0.07, -0.02, sz * 0.026); f.rotation.x = sz * 0.9; corpo.add(f); }
  // olhos: esfera escura brilhante com anel prateado
  for (const sz of [-1, 1]) {
    const anel = new THREE.Mesh(new THREE.TorusGeometry(0.0098, 0.0021, 8, 18), new THREE.MeshStandardMaterial({ color: 0xdfe8ee, roughness: 0.25, metalness: 0.6 })); anel.position.set(0.108, 0.013, sz * 0.0232); corpo.add(anel);
    const olho = new THREE.Mesh(new THREE.SphereGeometry(0.0092, 14, 10), new THREE.MeshStandardMaterial({ color: 0x0a0b10, roughness: 0.08, metalness: 0.1, envMap: env, envMapIntensity: 1.2 })); olho.position.set(0.108, 0.013, sz * 0.0238); olho.scale.set(0.8, 1, 0.5); corpo.add(olho);
  }
  const boca = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), new THREE.MeshStandardMaterial({ color: 0x331a14 })); boca.position.set(0.138, -0.006, 0); boca.scale.set(1, 0.6, 1.5); corpo.add(boca);
  g.scale.setScalar(esc);
  // fase 0..2pi; amp (rad) da ondulação; dobra: curvatura estática (debate no chão)
  function ondular(fase, amp = 0.3, dobra = 0) { bB.rotation.y = amp * Math.sin(fase) + dobra * 0.45; bC.rotation.y = amp * 1.7 * Math.sin(fase - 1.1) + dobra * 0.9; }
  return { grupo: g, ondular, corpo };
}
