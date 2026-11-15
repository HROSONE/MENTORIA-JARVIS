// Mundo A: a arganeira retorcida numa paisagem árida ao pôr do sol; cinco galhos altos e finos onde as cabras se equilibram.
import * as THREE from 'three';
import { clamp, lerp, mulberry32, suave } from './util.js';
import { ruidoS, fbm, texFn, criarCeu } from './base.js';

const NA = ruidoS(31), NB = ruidoS(32);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// pontos de apoio das cinco cabras: galho (curva), parâmetro u onde a cabra fica e para onde olha (guinada em radianos; 0 = +x, -pi/2 = +z)
export const POUSOS = [
  { pts: [[0.1, 3.3, 0.1], [0.8, 3.55, 0.25], [1.6, 3.78, 0.3], [2.3, 3.95, 0.2]], u: 0.62, yaw: 0.25, mast: 0.0 },
  { pts: [[-0.1, 3.9, -0.1], [-0.9, 4.2, -0.15], [-1.7, 4.45, -0.35], [-2.4, 4.6, -0.3]], u: 0.6, yaw: Math.PI - 0.2, mast: 0.35 },
  { pts: [[0.0, 4.5, 0.15], [0.3, 4.85, 0.9], [0.45, 5.05, 1.6], [0.4, 5.15, 2.3]], u: 0.58, yaw: -Math.PI / 2 + 0.12, mast: 0.1 },   // olha para a lente
  { pts: [[0.0, 4.9, -0.1], [-0.5, 5.3, -0.8], [-0.85, 5.5, -1.5], [-0.8, 5.55, -2.1]], u: 0.62, yaw: Math.PI / 2 + 0.3, mast: 0.7 },
  { pts: [[0.1, 4.6, -0.05], [0.9, 4.95, -0.5], [1.55, 5.15, -0.95], [2.1, 5.2, -1.2]], u: 0.62, yaw: -0.35, mast: 0.5 },
];
export function pontoGalho(i) { const P = POUSOS[i], cv = new THREE.CatmullRomCurve3(P.pts.map(p => V3(...p))); return { p: cv.getPointAt(P.u), tg: cv.getTangentAt(P.u), curva: cv }; }

export function construirA(g) {
  // ---- céu (sol baixo atrás da copa), colinas, chão
  g.add(criarCeu({ dir: [0.55, 0.34, -1], halo: 1.2 }));
  const solo = texFn(512, 512, (u, v) => { const n = fbm(NA, u * 24, v * 24, 4) * 0.5 + 0.5, m = fbm(NB, u * 6, v * 6, 3) * 0.5 + 0.5, r = 200 + 35 * m + 18 * n, gg = 160 + 40 * m + 16 * n, b = 95 + 30 * m; return [r, gg, b]; });
  solo.repeat.set(30, 30);
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(500, 500, 1, 1), new THREE.MeshStandardMaterial({ map: solo, roughness: 1 })); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; g.add(chao);
  for (let k = 0; k < 4; k++) {                                    // colinas em camadas (névoa dá a profundidade)
    const w = 600, geo = new THREE.PlaneGeometry(w, 40, 120, 8), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, 0); p.setY(i, (y + 20) * (0.35 + 0.65 * (0.5 + 0.5 * fbm(NA, x * 0.01 + k * 9, k, 3))) ); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(0.72 - k * 0.04, 0.45 - k * 0.04, 0.5 + k * 0.06), fog: true }));
    m.position.set(0, 0, -90 - k * 45); g.add(m);
  }
  // pedras e capim seco (instâncias)
  { const n = 220, im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x8a7a68, roughness: 1, flatShading: true }), n), r = mulberry32(4), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3();
    for (let i = 0; i < n; i++) { const a = r() * 6.283, d = 2 + 40 * Math.sqrt(r()), s = 0.06 + 0.4 * Math.pow(r(), 3); p.set(Math.cos(a) * d, s * 0.25, Math.sin(a) * d - 2); e.set(r(), r() * 6, r()); q.setFromEuler(e); sc.set(s, s * 0.6, s * 0.8); m.compose(p, q, sc); im.setMatrixAt(i, m); }
    im.castShadow = true; im.receiveShadow = true; g.add(im); }
  { const n = 2600, im = new THREE.InstancedMesh(new THREE.ConeGeometry(0.012, 0.32, 3), new THREE.MeshLambertMaterial({ color: 0xcfae6a }), n), r = mulberry32(6), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3();
    for (let i = 0; i < n; i++) { const a = r() * 6.283, d = 1.4 + 26 * Math.sqrt(r()), s = 0.5 + r(); p.set(Math.cos(a) * d, 0.15 * s, Math.sin(a) * d - 1); e.set((r() - 0.5) * 0.5, r() * 6, (r() - 0.5) * 0.5); q.setFromEuler(e); sc.set(1, s, 1); m.compose(p, q, sc); im.setMatrixAt(i, m); }
    g.add(im); }
  // ---- a árvore: dois troncos que se enroscam, galhos principais, ramos finos, folhas, frutos
  const cascaTex = texFn(256, 256, (u, v) => { const n = fbm(NB, u * 30, v * 3, 4) * 0.5 + 0.5, q = 70 + 90 * n; return [q, q * 0.88, q * 0.78]; });
  const bump = texFn(256, 256, (u, v) => { const n = 0.4 + 0.6 * (fbm(NA, u * 40, v * 3, 4) * 0.5 + 0.5), q = Math.round(n * 255); return [q, q, q]; }, { srgb: false });
  const mCasca = new THREE.MeshStandardMaterial({ map: cascaTex, bumpMap: bump, bumpScale: 4, roughness: 1, color: 0xe0b890 });
  const tubo = (pts, r0, r1, seg = 40, rad = 10) => {
    const cv = new THREE.CatmullRomCurve3(pts.map(p => V3(...p))), geo = new THREE.TubeGeometry(cv, seg, 1, rad, false), pos = geo.attributes.position, nrm = geo.attributes.normal;
    for (let i = 0; i < pos.count; i++) { const row = Math.floor(i / (rad + 1)), u = row / seg, r = lerp(r0, r1, u) * (1 + 0.12 * NA.noise(row * 0.4, i % (rad + 1) * 0.9)); const c = cv.getPointAt(u); const dx = pos.getX(i) - c.x, dy = pos.getY(i) - c.y, dz = pos.getZ(i) - c.z; pos.setXYZ(i, c.x + dx * r, c.y + dy * r, c.z + dz * r); }
    geo.computeVertexNormals();
    geo.setAttribute('uv', new THREE.BufferAttribute(Float32Array.from({ length: pos.count * 2 }, (_, q) => { const p = q >> 1, row = Math.floor(p / (rad + 1)), col = p % (rad + 1); return q & 1 ? row / seg * Math.max(1, cv.getLength() / 2) : col / rad; }), 2));
    const m = new THREE.Mesh(geo, mCasca); m.castShadow = true; m.receiveShadow = true; g.add(m); return cv;
  };
  const curvas = [];
  curvas.push(tubo([[0.15, -0.1, 0.05], [-0.25, 0.8, -0.1], [0.3, 1.7, 0.2], [-0.1, 2.6, 0.0], [0.05, 3.4, 0.1]], 0.42, 0.2));
  curvas.push(tubo([[-0.3, -0.1, -0.1], [0.2, 0.7, 0.15], [-0.25, 1.6, -0.15], [0.25, 2.6, 0.1], [0.0, 3.9, -0.1]], 0.36, 0.17));
  curvas.push(tubo([[0.0, 2.6, 0.0], [0.15, 3.4, 0.5], [0.2, 4.1, 0.95], [0.0, 4.5, 0.15]], 0.14, 0.09, 24, 8));
  // galhos principais e os cinco galhos finos das cabras (curvas definidas em POUSOS)
  POUSOS.forEach((P, i) => curvas.push(tubo(P.pts, 0.085, 0.032, 30, 8)));
  const GAL = [[[0.0, 3.4, 0.1], [-1.0, 3.7, 0.9], [-1.8, 4.1, 1.5], [-2.6, 4.2, 1.9]], [[0.0, 3.4, 0.0], [1.0, 3.4, -0.9], [1.9, 3.7, -1.6], [2.9, 3.8, -2.1]], [[0.0, 3.6, 0.1], [-0.3, 4.3, -0.9], [-0.6, 4.9, -1.9], [-0.9, 5.2, -2.7]], [[0.0, 3.5, 0.0], [1.3, 3.2, 0.7], [2.5, 3.5, 1.2], [3.4, 3.4, 1.4]], [[0.0, 4.2, 0.0], [-1.2, 4.6, -0.4], [-2.3, 4.9, -0.9], [-3.1, 5.1, -1.0]]];
  GAL.forEach(p => curvas.push(tubo(p, 0.09, 0.03, 30, 8)));
  // folhas: cartões pequenos e curvos, agrupados ao longo dos galhos (menos perto do ponto onde cada cabra fica, para ela alcançar e mastigar)
  const nF = 26000, geoF = new THREE.PlaneGeometry(0.036, 0.082, 1, 2), pf = geoF.attributes.position;
  for (let i = 0; i < pf.count; i++) pf.setZ(i, 0.01 * Math.pow(pf.getY(i) / 0.04, 2)); geoF.translate(0, 0.041, 0);
  const folhas = new THREE.InstancedMesh(geoF, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, vertexColors: false }), nF), r = mulberry32(21), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3(), cc = new THREE.Color();
  const livres = POUSOS.map((P, i) => pontoGalho(i).p);
  let k = 0;
  while (k < nF) {
    const cv = curvas[3 + Math.floor(r() * (curvas.length - 3))], u = 0.3 + 0.7 * r(), c = cv.getPointAt(u);
    p.set(c.x + (r() - 0.5) * 0.7, c.y + (r() - 0.35) * 0.55, c.z + (r() - 0.5) * 0.7);
    if (livres.some(l => p.distanceTo(l) < 0.55 && p.y < l.y + 0.7)) continue;
    e.set((r() - 0.5) * 2.4, r() * 6.28, (r() - 0.5) * 2.4); q.setFromEuler(e); const s = 0.8 + 0.7 * r(); sc.set(s, s, s); m.compose(p, q, sc); folhas.setMatrixAt(k, m);
    const l = 0.22 + 0.3 * r() + 0.15 * Math.max(0, (p.x * 0.3 + p.y * 0.1 - 1) * 0.2); cc.setHSL(0.27 + 0.08 * r(), 0.85, 0.2 + 0.26 * r() + 0.4 * (l - 0.22)); folhas.setColorAt(k, cc); k++;
  }
  folhas.castShadow = true; folhas.receiveShadow = false; folhas.frustumCulled = false; g.add(folhas);
  // frutos de argan (amarelo-esverdeados), perto das bocas das cabras
  { const n = 90, im = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ color: 0xc8c24a, roughness: 0.5 }), n), r2 = mulberry32(9);
    for (let i = 0; i < n; i++) { const cv = curvas[3 + Math.floor(r2() * (curvas.length - 3))], c = cv.getPointAt(0.35 + 0.65 * r2()); p.set(c.x + (r2() - 0.5) * 0.4, c.y + (r2() - 0.2) * 0.3, c.z + (r2() - 0.5) * 0.4); const s = 0.018 + 0.012 * r2(); q.identity(); sc.set(s, s * 1.15, s); m.compose(p, q, sc); im.setMatrixAt(i, m); }
    im.castShadow = true; g.add(im); }
  return { curvas };
}
