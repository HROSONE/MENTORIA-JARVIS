// Mundo P: o paredão de pedra quase liso, com saliências mínimas, o caminho de saliências até o topo e o entalhe entre duas pontas de rocha.
import * as THREE from 'three';
import { clamp, lerp, mulberry32, suave } from './util.js';
import { ruidoS, fbm, texFn, criarCeu } from './base.js';

const NZ = ruidoS(11), NC = ruidoS(12), NK = ruidoS(13);
const gauss = x => Math.exp(-x * x);
// altura da crista em x (topo irregular com duas pontas em x=±1.9 e um vão no meio)
export const alturaTopo = x => 37.2 + 1.2 * gauss(x / 9) + 1.4 * fbm(NZ, x * 0.3, 7.7, 3) + 3.4 * gauss((x + 1.9) / 0.75) + 3.7 * gauss((x - 1.9) / 0.75) - 1.0 * gauss(x / 0.9);
// relevo do paredão: formas grandes suaves, estratos, trincas finas e micro-rugosidade; "quase liso" perto da saliência do herói
export function zParede(x, y) {
  const liso = 0.3 + 0.7 * suave(Math.hypot((x + 1.0) / 4.2, (y - 23.8) / 3.5) - 0.7);
  let z = 0.7 * fbm(NZ, x * 0.14, y * 0.07, 4) * liso;
  z += 0.06 * Math.sin(y * 5.2 + 4 * fbm(NZ, x * 0.4, y * 0.3, 2)) * liso;
  const c = 1 - Math.abs(NC.noise(x * 0.55, y * 0.16)); z -= 0.2 * Math.pow(c, 14) * (0.4 + 0.6 * liso);
  z += 0.12 * Math.floor(4 * (0.5 + 0.5 * NK.noise(x * 0.35, y * 0.5))) / 4 * liso;
  z += 0.035 * fbm(NK, x * 3.2, y * 3.2, 3);
  return z;
}
export const LEDGE0 = { x: -1.6, y: 24.0 };
// caminho de saliências (de baixo para cima, subindo para a direita). Cada uma: centro x, topo y, largura
export const CAMINHO = [
  { x: -1.6, y: 24.0, w: 1.1 }, { x: -0.6, y: 25.7, w: 0.9 }, { x: 0.5, y: 27.3, w: 0.9 }, { x: 1.4, y: 29.1, w: 0.9 }, { x: 2.5, y: 30.7, w: 0.9 },
  // trecho do topo (a câmera "pula" até aqui na edição)
  { x: -4.2, y: 35.2, w: 0.9 }, { x: -3.1, y: 36.9, w: 0.9 }, { x: -2.3, y: 38.6, w: 0.8 },
];
export const PONTA_E = { x: -1.9, y: 40.15 }, PONTA_D = { x: 1.9, y: 40.4 };

export function construirP(g) {
  // ---- parede
  const NX = 260, NY = 330, X0 = -24, X1 = 24;
  const pos = new Float32Array((NX + 1) * (NY + 1) * 3), col = new Float32Array((NX + 1) * (NY + 1) * 3), idx = [];
  const C1 = new THREE.Color('#ecbc7c'), C2 = new THREE.Color('#b8704c'), C3 = new THREE.Color('#4c3c80'), CL = new THREE.Color('#ffa21c'), CR = new THREE.Color('#a8402c'), CV = new THREE.Color('#2e2c48'), CY = new THREE.Color('#c8dc3a'), c = new THREE.Color();
  for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
    const x = lerp(X0, X1, i / NX), Hx = alturaTopo(x), y = (j / NY) * Hx, z = zParede(x, y), k = (j * (NX + 1) + i) * 3;
    pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
    const n = fbm(NK, x * 0.3, y * 0.25, 3), band = 0.5 + 0.5 * Math.sin(y * 3.1 + 5 * n);
    c.copy(C2).lerp(C1, clamp(0.5 + n * 0.9)).lerp(C3, 0.25 * band);
    c.multiplyScalar(0.5 + 0.5 * clamp(0.5 + z * 0.6));
    const lq = NC.noise(x * 1.7 + 9, y * 1.7); if (lq > 0.55) c.lerp(CL, clamp((lq - 0.55) * 1.8));
    const st = NK.noise(x * 1.9, y * 0.12 + 3), st2 = NC.noise(x * 3.3 + 5, y * 0.09); if (st > 0.4) c.lerp(CR, clamp((st - 0.4) * 1.6)); if (st2 > 0.45) c.lerp(CV, clamp((st2 - 0.45) * 1.8));
    col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
  }
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, d = a + NX + 1, e = d + 1; idx.push(a, b, d, b, e, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(Float32Array.from({ length: (NX + 1) * (NY + 1) * 2 }, (_, q) => { const p = q >> 1, i = p % (NX + 1), j = (p / (NX + 1)) | 0; return q & 1 ? j / NY * 40 : i / NX * 40; }), 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const bump = texFn(512, 512, (u, v) => { const n = fbm(NK, u * 14, v * 14, 5) * 0.5 + 0.5, cr = Math.pow(1 - Math.abs(NC.noise(u * 5, v * 2.5)), 22), st = 0.5 + 0.5 * Math.sin(v * 40 + 5 * NK.noise(u * 4, v * 4)), m = clamp(0.3 + 0.55 * n + 0.08 * st - 0.3 * cr), q = Math.round(m * 255); return [q, q, q]; }, { srgb: false });
  bump.repeat.set(1, 1);
  const parede = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, bumpMap: bump, bumpScale: 3 }));
  parede.castShadow = true; parede.receiveShadow = true; g.add(parede);
  // ---- rochas facetadas em cima da parede (dão relevo duro, sombra e silhueta); poupa a região "quase lisa" do herói
  { const nR = 6000, gi = new THREE.IcosahedronGeometry(1, 2), pi = gi.attributes.position, rj = mulberry32(5);
    for (let i = 0; i < pi.count; i++) { const kx = 0.78 + 0.5 * NK.noise(pi.getX(i) * 2.1, pi.getY(i) * 2.1 + pi.getZ(i) * 1.7), l = Math.hypot(pi.getX(i), pi.getY(i), pi.getZ(i)); pi.setXYZ(i, pi.getX(i) * kx, pi.getY(i) * kx * (0.8 + 0.3 * rj()), pi.getZ(i) * kx); void l; }
    gi.computeVertexNormals();
    const im = new THREE.InstancedMesh(gi, new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), nR), r = mulberry32(77), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3(), cc = new THREE.Color(); let k = 0;
    while (k < nR) {
      const x = lerp(-20, 20, r()), Hx = alturaTopo(x), y = lerp(2, Hx - 0.2, r());
      if (Math.hypot((x + 1.0) / 4.4, (y - 24.8) / 3.6) < 1.0) continue;
      const z = zParede(x, y), big = Math.pow(r(), 3.2), w = 0.05 + 0.42 * big, h = w * lerp(0.3, 0.8, r()), d = w * lerp(0.25, 0.6, r());
      p.set(x, y, z - 0.01 + d * 0.1); e.set((r() - 0.5) * 0.4, (r() - 0.5) * 0.4, r() * 6.28); q.setFromEuler(e); sc.set(w, h, d); m.compose(p, q, sc); im.setMatrixAt(k, m);
      const lum = 0.3 + 0.4 * r(); cc.setRGB(0.92, 0.66, 0.46).multiplyScalar(lum); if (r() < 0.15) cc.lerp(new THREE.Color('#d0a040'), 0.4); im.setColorAt(k, cc); k++;
    }
    im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; g.add(im); }
  // ---- saliências (lábios de pedra): caixa subdividida com relevo irregular
  const rnd = mulberry32(5), ledges = [];
  const mkLedge = (x, y, w, d = 0.11) => {
    const bg = new THREE.BoxGeometry(w, 0.07, d, 24, 1, 6), p = bg.attributes.position;
    for (let i = 0; i < p.count; i++) { const px = p.getX(i), py = p.getY(i), pz = p.getZ(i); p.setY(i, py + 0.014 * NK.noise(px * 2.6 + x, pz * 3) - (py < 0 ? 0.035 * Math.abs(NK.noise(px * 1.8, 1)) : 0)); p.setZ(i, pz + 0.025 * NK.noise(px * 2.2, 4 + pz * 3)); }
    bg.computeVertexNormals();
    const m = new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ color: 0x9a8068, roughness: 1, bumpMap: bump, bumpScale: 2, flatShading: true }));
    m.position.set(x, y - 0.035, zParede(x, y) + d / 2 - 0.015); m.castShadow = true; m.receiveShadow = true; g.add(m);
    ledges.push({ x, y, z: zParede(x, y) + 0.05, w });
    return m;
  };
  CAMINHO.forEach(l => mkLedge(l.x, l.y, l.w));
  mkLedge(PONTA_E.x, PONTA_E.y, 1.1, 0.5); mkLedge(PONTA_D.x, PONTA_D.y, 1.1, 0.5);
  g.userData.ledges = ledges;
  // ---- céu e sol (atrás do paredão, alto), terra distante
  const ceu = criarCeu({ dir: [0.05, 0.82, -0.55], halo: 1 }); g.add(ceu);
  const base = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x5a4034, roughness: 1 })); base.rotation.x = -Math.PI / 2; base.position.set(0, -1.5, 40); base.receiveShadow = true; g.add(base);
  return { parede, ledges };
}
