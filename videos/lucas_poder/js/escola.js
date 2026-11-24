// SALA DE AULA: paredes pintadas, piso de madeira, janelas com sol de manhã, carteiras e cadeiras escolares (CC0), relógio, mesa da professora
// e a LOUSA verde de giz, onde "HRYZ" é escrito traço a traço (`escrever(k)`, k 0..1); `ponta(k)` dá a posição do giz no mundo para a mão da professora.
import * as THREE from 'three';
import { canvasTex } from './motor.js';
import { materialPH, modeloPH } from '../../biblioteca3d/polyhaven/ph.js';
import { mulberry32, clamp } from './util.js';

const SX = 4.2, SZ = 4.4, SH = 3.0;                          // meia-largura, meia-profundidade, altura
export const LOUSA = { cx: 0, cy: 1.55, z: -SZ + 0.035, larg: 3.6, alt: 1.25 };

// letras de forma (caixa 0,6 x 1): listas de traços (polilinhas)
const LETRAS = {
  H: [[[0, 0], [0, 1]], [[0.6, 0], [0.6, 1]], [[0, 0.52], [0.6, 0.52]]],
  R: [[[0, 0], [0, 1], [0.42, 1], [0.6, 0.86], [0.6, 0.66], [0.42, 0.52], [0, 0.52]], [[0.28, 0.52], [0.62, 0]]],
  Y: [[[0, 1], [0.3, 0.5]], [[0.6, 1], [0.3, 0.5], [0.3, 0]]],
  Z: [[[0, 1], [0.6, 1], [0, 0], [0.62, 0]]],
};
function tracos() {                                          // traços de "HRYZ" em coordenadas da lousa (u, v em 0..1) e comprimento acumulado
  const L = [], u0 = 0.33, esc = 0.16, passo = 0.13, v0 = 0.22, alt = 0.56;
  'HRYZ'.split('').forEach((c, i) => { for (const tr of LETRAS[c]) L.push(tr.map(([x, y]) => [u0 + i * passo + x * esc, v0 + y * alt])); });
  let total = 0; const seg = [];
  for (const tr of L) for (let k = 0; k < tr.length - 1; k++) { const a = tr[k], b = tr[k + 1], l = Math.hypot(b[0] - a[0], (b[1] - a[1]) * 0.35); seg.push({ a, b, l, ini: total, novo: k === 0 }); total += l; }
  for (const s of seg) { s.ini /= total; s.l /= total; }
  return seg;
}

export async function construirEscola(pai, { origem = [6000, 0, 0] } = {}) {
  const G = new THREE.Group(); G.name = 'escola'; G.position.set(...origem); pai.add(G);
  const piso = materialPH('wood_floor_worn', { rep: [3, 3], extra: { color: 0xdccdb8 } });
  const par = materialPH('painted_plaster_wall', { rep: [3, 1.2], ao: false, extra: { color: 0xe9e2c8 } });
  const plano = (w, h, m, x, y, z, rx, ry) => { const g = new THREE.PlaneGeometry(w, h); g.setAttribute('uv2', g.attributes.uv); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, ry, 0); o.receiveShadow = true; G.add(o); return o; };
  plano(SX * 2, SZ * 2, piso, 0, 0, 0, -Math.PI / 2, 0);
  plano(SX * 2, SH, par, 0, SH / 2, -SZ, 0, 0); plano(SX * 2, SH, par, 0, SH / 2, SZ, 0, Math.PI); plano(SZ * 2, SH, par, SX, SH / 2, 0, 0, -Math.PI / 2);
  const teto = plano(SX * 2, SZ * 2, new THREE.MeshStandardMaterial({ color: 0xf1efe8, roughness: 0.95 }), 0, SH, 0, Math.PI / 2, 0);
  // parede das janelas (x = -SX): três vãos com luz da manhã
  const mPar = par; for (const [w, h, y, z] of [[SZ * 2, 0.9, 0.45, 0], [SZ * 2, 0.55, SH - 0.275, 0]]) plano(w, h, mPar, -SX, y, z, 0, Math.PI / 2);
  for (const z of [-3.6, -1.2, 1.2, 3.6]) plano(0.5, SH - 1.45, mPar, -SX, 0.9 + (SH - 1.45) / 2, z, 0, Math.PI / 2);
  const ceuJan = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), new THREE.MeshBasicMaterial({ color: 0xcfe6ff, fog: false })); ceuJan.position.set(-SX - 3, 1.8, 0); ceuJan.rotation.y = Math.PI / 2; G.add(ceuJan);
  // rodapé e quadro de cortiça
  const mRod = new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.6 });
  for (const [w, x, z, ry] of [[SX * 2, 0, -SZ + 0.01, 0], [SZ * 2, SX - 0.01, 0, -Math.PI / 2], [SX * 2, 0, SZ - 0.01, Math.PI]]) { const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, 0.02), mRod); r.position.set(x, 0.05, z); r.rotation.y = ry; G.add(r); }
  // LOUSA: moldura de madeira, ardósia verde em canvas (giz antigo apagado + HRYZ escrito aos poucos), canaleta com giz
  const W = 2048, H = Math.round(2048 * LOUSA.alt / LOUSA.larg);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const fundo = document.createElement('canvas'); fundo.width = W; fundo.height = H; const gf = fundo.getContext('2d');
  { gf.fillStyle = '#26402f'; gf.fillRect(0, 0, W, H); const R = mulberry32(3);
    for (let i = 0; i < 60; i++) { const x = R() * W, y = R() * H, r = 80 + R() * 260; const gr = gf.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(210,225,215,0.08)'); gr.addColorStop(1, 'rgba(210,225,215,0)'); gf.fillStyle = gr; gf.fillRect(0, 0, W, H); }
    gf.font = '64px "DejaVu Sans", sans-serif'; gf.fillStyle = 'rgba(235,240,232,0.82)'; gf.fillText('3 x 7 = 21', 70, 140); gf.fillText('4 x 8 = 32', 70, 230); gf.fillText('16 / 11', 1730, 120);
    gf.fillStyle = 'rgba(235,240,232,0.25)'; gf.fillText('5 x 9 = 45', 70, 320); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const lousa = new THREE.Mesh(new THREE.PlaneGeometry(LOUSA.larg, LOUSA.alt), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92 })); lousa.position.set(LOUSA.cx, LOUSA.cy, LOUSA.z); lousa.receiveShadow = true; G.add(lousa);
  const mMold = new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.55 });
  for (const [w, h, x, y] of [[LOUSA.larg + 0.16, 0.08, 0, LOUSA.alt / 2 + 0.04], [LOUSA.larg + 0.16, 0.08, 0, -LOUSA.alt / 2 - 0.04], [0.08, LOUSA.alt, -LOUSA.larg / 2 - 0.04, 0], [0.08, LOUSA.alt, LOUSA.larg / 2 + 0.04, 0]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), mMold); b.position.set(LOUSA.cx + x, LOUSA.cy + y, -SZ + 0.03); b.castShadow = true; G.add(b); }
  const canal = new THREE.Mesh(new THREE.BoxGeometry(LOUSA.larg, 0.03, 0.08), mMold); canal.position.set(0, LOUSA.cy - LOUSA.alt / 2 - 0.09, -SZ + 0.06); G.add(canal);
  const seg = tracos();
  function escrever(k) {
    g.drawImage(fundo, 0, 0);
    g.strokeStyle = 'rgba(240,244,238,0.95)'; g.lineWidth = 15; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const s of seg) {
      if (k <= s.ini) break;
      const f = clamp((k - s.ini) / s.l), bx = s.a[0] + (s.b[0] - s.a[0]) * f, by = s.a[1] + (s.b[1] - s.a[1]) * f;
      g.beginPath(); g.moveTo(s.a[0] * W, (1 - s.a[1]) * H); g.lineTo(bx * W, (1 - by) * H); g.stroke();
    }
    const R = mulberry32(9); g.fillStyle = 'rgba(38,64,47,0.55)';                                          // falhas do giz
    for (let i = 0; i < 1400; i++) g.fillRect(R() * W, R() * H, 2 + R() * 3, 2 + R() * 3);
    tex.needsUpdate = true;
  }
  function ponta(k, alvo = new THREE.Vector3()) {
    let s = seg[seg.length - 1], f = 1; for (const q of seg) if (k < q.ini + q.l) { s = q; f = clamp((k - q.ini) / q.l); break; }
    const u = s.a[0] + (s.b[0] - s.a[0]) * f, v = s.a[1] + (s.b[1] - s.a[1]) * f;
    return alvo.set(origem[0] + LOUSA.cx - LOUSA.larg / 2 + u * LOUSA.larg, origem[1] + LOUSA.cy - LOUSA.alt / 2 + v * LOUSA.alt, origem[2] + LOUSA.z + 0.02);
  }
  escrever(0);
  // carteiras e cadeiras (de frente para a lousa), mesa da professora, relógio
  const carteira = await modeloPH('SchoolDesk_01'), cadeira = await modeloPH('SchoolChair_01'), relogio = await modeloPH('wall_clock');
  const lugares = [];
  for (const x of [-2.2, -0.75, 0.75, 2.2]) for (const z of [-1.2, 0.4, 2.0, 3.4]) {
    const d = carteira.clone(); d.position.set(x, 0, z); d.rotation.y = Math.PI; G.add(d);
    const c = cadeira.clone(); c.position.set(x, 0, z + 0.48); c.rotation.y = Math.PI; G.add(c); lugares.push([x, z]);
  }
  const mesa = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.7), mMold); mesa.position.set(2.4, 0.76, -3.1); mesa.castShadow = true; G.add(mesa);
  for (const [dx, dz] of [[-0.65, -0.3], [0.65, -0.3], [-0.65, 0.3], [0.65, 0.3]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.74, 0.05), mMold); p.position.set(2.4 + dx, 0.37, -3.1 + dz); G.add(p); }
  relogio.position.set(2.6, 2.45, -SZ + 0.01); G.add(relogio);
  // luz: sol da manhã pelas janelas, céu, preenchimento
  const sol = new THREE.DirectionalLight(0xfff0d6, 3.0); sol.position.set(-SX - 6, 5.5, 2); sol.target.position.set(0, 0, -0.5); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 20 }); sol.shadow.bias = -0.0006; G.add(sol, sol.target);
  const hemi = new THREE.HemisphereLight(0xe8f0ff, 0x6a5a48, 1.1); G.add(hemi);
  const fill = new THREE.PointLight(0xfff4e0, 0.4, 12, 2); fill.position.set(1.5, 2.7, 1.5); G.add(fill);
  G.traverse(o => { if (o.isMesh && o !== ceuJan) { o.castShadow = o.castShadow || false; o.receiveShadow = true; } });
  return { g: G, escrever, ponta, lugares, origem: new THREE.Vector3(...origem) };
}
