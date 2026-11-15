// Chuva: riscos finos instanciados (o comprimento acompanha a velocidade: em câmera lenta viram gotas quase paradas) e ondulações no chão.
import * as THREE from 'three';
import { mulberry32, clamp } from './util.js';

export function criarChuva(pai, { n = 9000, caixa = [12, 8, 12] } = {}) {
  const geo = new THREE.CylinderGeometry(0.0019, 0.0019, 1, 4, 1, true), mat = new THREE.MeshBasicMaterial({ color: 0xcfe2ff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const im = new THREE.InstancedMesh(geo, mat, n); im.frustumCulled = false; pai.add(im);
  const r = mulberry32(5), P = Array.from({ length: n }, () => [r(), r(), r(), 0.8 + 0.4 * r()]);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler();
  // tau: tempo físico (s). v: velocidade de queda (m/s). centro: centro da caixa. vento: inclinação (rad). ocultar(x,y,z): true se a gota está debaixo do guarda-chuva
  const cc = new THREE.Color();
  function atualizar(tau, centro, { v = 9, vento = 0.12, ocultar = null, comp = 0.45, camPos = null } = {}) {
    e.set(0, 0, vento); q.setFromEuler(e);
    for (let i = 0; i < n; i++) {
      const d = P[i], H = caixa[1], y = ((d[1] * H - tau * v * d[3]) % H + H) % H;
      const x = centro[0] + (d[0] - 0.5) * caixa[0] - Math.sin(vento) * (y - H / 2) * 0.0, z = centro[2] + (d[2] - 0.5) * caixa[2], yy = centro[1] - 0.1 + y;
      if (ocultar && ocultar(x, yy, z)) { m.makeScale(0, 0, 0); im.setMatrixAt(i, m); continue; }
      const L = Math.max(0.025, comp * (v / 9) * d[3]); s.set(1, L, 1); p.set(x, yy, z); m.compose(p, q, s); im.setMatrixAt(i, m);
      if (camPos) { const dd = Math.hypot(x - camPos.x, yy - camPos.y, z - camPos.z), f = dd < 0.6 ? 0 : dd < 1.7 ? (dd - 0.6) / 1.1 : 1; cc.setScalar(f); im.setColorAt(i, cc); }
    }
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }
  return { malha: im, atualizar };
}
export function criarOndas(pai, { n = 140, area = [10, 10], centro = [0, 0] } = {}) {
  const geo = new THREE.RingGeometry(0.86, 1, 28), mat = new THREE.MeshBasicMaterial({ color: 0xbcd6ff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const im = new THREE.InstancedMesh(geo, mat, n); im.frustumCulled = false; pai.add(im);
  const r = mulberry32(9), P = Array.from({ length: n }, () => [r(), r(), r()]), m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
  function atualizar(tau, y = 0.16, { taxa = 2.2, raio = 0.16, ocultar = null } = {}) {
    for (let i = 0; i < n; i++) {
      const d = P[i], f = ((tau * taxa * (0.7 + 0.6 * d[2]) + d[2] * 7) % 1 + 1) % 1, x = centro[0] + (d[0] - 0.5) * area[0], z = centro[1] + (d[1] - 0.5) * area[1];
      if (ocultar && ocultar(x, z)) { m.makeScale(0, 0, 0); im.setMatrixAt(i, m); continue; }
      const rr = 0.01 + raio * f; s.set(rr, rr, 1); p.set(x, y + 0.003, z); m.compose(p, q, s); im.setMatrixAt(i, m); c.setScalar(Math.pow(1 - f, 1.6)); im.setColorAt(i, c);
    }
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  }
  return { malha: im, atualizar };
}
