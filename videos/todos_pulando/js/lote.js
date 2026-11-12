// Ajudantes de geometria: Lote junta caixas/cilindros estáticos do mesmo material numa malha só (poucas chamadas de desenho) e escala UV por metro.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const M = (cor, rug = 0.9, extra = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: rug, ...extra });

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();

// BoxGeometry: faces +x, -x, +y, -y, +z, -z (4 vértices cada). Escala as UV para `tile` metros por repetição.
export function escalarUV(g, w, h, d, tile) {
  const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile);
  }
  uv.needsUpdate = true;
}

export class Lote {
  constructor(pai, { emite = true, recebe = true } = {}) { this.pai = pai; this.por = new Map(); this.emite = emite; this.recebe = recebe; this.malhas = []; }
  add(geo, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
    _m.compose(_p.set(p[0], p[1], p[2]), _q.setFromEuler(_e.set(r[0], r[1], r[2], 'YXZ')), _s.set(s[0], s[1], s[2]));
    geo.applyMatrix4(_m);
    if (!this.por.has(mat.uuid)) this.por.set(mat.uuid, { mat, geos: [] });
    this.por.get(mat.uuid).geos.push(geo);
    return this;
  }
  caixa(w, h, d, mat, x, y, z, { ry = 0, rx = 0, rz = 0, uv = 0 } = {}) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (uv) escalarUV(g, w, h, d, uv);
    return this.add(g, mat, [x, y, z], [rx, ry, rz]);
  }
  // saco de areia: caixa arredondada (superelipsoide) com barriga e pontas afuniladas; normais analíticas para sombreado suave
  saco(w, h, d, mat, x, y, z, { ry = 0, rz = 0, rx = 0 } = {}) {
    const g = new THREE.BoxGeometry(w, h, d, 4, 3, 4), p = g.attributes.position, nr = g.attributes.normal, n = 3.2;
    for (let i = 0; i < p.count; i++) {
      let X = p.getX(i) / (w / 2), Y = p.getY(i) / (h / 2), Z = p.getZ(i) / (d / 2);
      const sg = Math.pow(Math.pow(Math.abs(X), n) + Math.pow(Math.abs(Y), n) + Math.pow(Math.abs(Z), n), 1 / n) || 1;
      X /= sg; Y /= sg; Z /= sg;
      const nx = Math.sign(X) * Math.pow(Math.abs(X), n - 1) / (w / 2), ny = Math.sign(Y) * Math.pow(Math.abs(Y), n - 1) / (h / 2), nz = Math.sign(Z) * Math.pow(Math.abs(Z), n - 1) / (d / 2);
      const l = Math.hypot(nx, ny, nz) || 1; nr.setXYZ(i, nx / l, ny / l, nz / l);
      const bar = 1 + 0.16 * (1 - X * X) * (1 - 0.3 * Z * Z);
      p.setXYZ(i, X * w / 2, Y * h / 2 * bar, Z * d / 2 * (1 - 0.16 * X * X));
    }
    return this.add(g, mat, [x, y, z], [rx, ry, rz]);
  }
  cilindro(r0, r1, h, mat, x, y, z, { seg = 14, rx = 0, ry = 0, rz = 0, aberto = false } = {}) {
    return this.add(new THREE.CylinderGeometry(r1, r0, h, seg, 1, aberto), mat, [x, y, z], [rx, ry, rz]);
  }
  // cilindro entre dois pontos a=[x,y,z], b=[x,y,z]
  haste(a, b, r0, r1, mat, { seg = 6 } = {}) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), dir = B.clone().sub(A), len = dir.length();
    if (len < 1e-5) return this;
    const g = new THREE.CylinderGeometry(r1, r0, len, seg, 1, false);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    g.applyMatrix4(new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)));
    if (!this.por.has(mat.uuid)) this.por.set(mat.uuid, { mat, geos: [] });
    this.por.get(mat.uuid).geos.push(g);
    return this;
  }
  esfera(r, mat, x, y, z, { seg = 14, sx = 1, sy = 1, sz = 1 } = {}) {
    return this.add(new THREE.SphereGeometry(r, seg, Math.max(6, seg * 0.6 | 0)), mat, [x, y, z], [0, 0, 0], [sx, sy, sz]);
  }
  plano(w, h, mat, x, y, z, { rx = 0, ry = 0, rz = 0, uv = 0 } = {}) {
    const g = new THREE.PlaneGeometry(w, h);
    if (uv) { const a = g.attributes.uv; for (let i = 0; i < a.count; i++) a.setXY(i, a.getX(i) * w / uv, a.getY(i) * h / uv); }
    return this.add(g, mat, [x, y, z], [rx, ry, rz]);
  }
  fechar() {
    for (const { mat, geos } of this.por.values()) {
      const g = mergeGeometries(geos, false);
      const mesh = new THREE.Mesh(g, mat);
      mesh.castShadow = this.emite; mesh.receiveShadow = this.recebe; mesh.frustumCulled = false;
      this.pai.add(mesh); this.malhas.push(mesh);
      geos.forEach(x => x.dispose());
    }
    this.por.clear();
    return this.malhas;
  }
}
