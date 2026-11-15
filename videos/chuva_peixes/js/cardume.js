// Peixes estáticos instanciados (rua cheia de peixes, peixes caindo do céu, peixes no redemoinho) e a chuva de peixes determinística.
// Cada instância: posição, giro (yaw), rolagem ao redor do eixo do corpo (roll) e inclinação (pitch). Deitado de lado: roll = -PI/2 (o dorso fica na horizontal).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { loft, alturaCorpo, texturaPele } from './peixe.js';
import { mulberry32, clamp, lerp, suave } from './util.js';

let _geo = null, _tex = null;
function geometrias() {
  if (_geo) return _geo;
  const xs = Array.from({ length: 21 }, (_, i) => 0.139 - 0.276 * i / 20), dAlt = x => (alturaCorpo(x + 0.002) - alturaCorpo(x - 0.002)) / 0.004;
  const corpo = loft(xs.map(x => ({ x, ry: alturaCorpo(x), rx: alturaCorpo(x) * 0.56 })), { N: 12, capIni: true, capFim: true, dAlt });
  // nadadeiras: caudal bifurcada + dorsal curva, planas no plano XY (o dorso do peixe é +y)
  const tail = new THREE.ShapeGeometry(new THREE.Shape([[-0.137, 0.004], [-0.187, 0.058], [-0.173, 0.008], [-0.173, -0.008], [-0.187, -0.058], [-0.137, -0.004]].map(p => new THREE.Vector2(p[0], p[1]))));
  const sh = new THREE.Shape(); sh.moveTo(0.045, 0.047); sh.bezierCurveTo(0.041, 0.073, 0.023, 0.097, -0.017, 0.105); sh.bezierCurveTo(-0.005, 0.083, -0.011, 0.063, -0.025, 0.047); sh.lineTo(0.045, 0.047);
  const barb = mergeGeometries([tail, new THREE.ShapeGeometry(sh, 6)]);
  _geo = { corpo, barb }; return _geo;
}
export function criarCardume(pai, n, { env = null } = {}) {
  const G = geometrias(); if (!_tex) _tex = texturaPele();
  const mc = new THREE.MeshStandardMaterial({ map: _tex, roughness: 0.34, metalness: 0.05, envMap: env, envMapIntensity: 0.4 });
  const mb = new THREE.MeshStandardMaterial({ color: 0xff8a3a, side: THREE.DoubleSide, roughness: 0.55 });
  const corpo = new THREE.InstancedMesh(G.corpo, mc, n), barb = new THREE.InstancedMesh(G.barb, mb, n);
  for (const m of [corpo, barb]) { m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); pai.add(m); }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3();
  const set = (i, x, y, z, yaw = 0, roll = -Math.PI / 2, pitch = 0, esc = 1) => {
    E.set(roll, yaw, pitch, 'YXZ'); Q.setFromEuler(E); P.set(x, y, z); S.setScalar(esc); M.compose(P, Q, S);
    corpo.setMatrixAt(i, M); barb.setMatrixAt(i, M);
  };
  const esconder = i => { M.makeScale(0, 0, 0); corpo.setMatrixAt(i, M); barb.setMatrixAt(i, M); };
  const fim = () => { corpo.instanceMatrix.needsUpdate = true; barb.instanceMatrix.needsUpdate = true; };
  return { corpo, barb, set, esconder, fim, n };
}

// chuva de peixes: n peixes nascem entre t0 e t0+dur, caem de alturas diferentes e, ao chegar no chão, quicam e param deitados
export function chuvaDePeixes(cardume, { t0 = 0, dur = 3, area = [-4, 4, -4, 4], alturas = [10, 22], chao = 0.04, semente = 3, vento = [0.8, 0.2], grav = 9.8, esc = [0.9, 1.25], ladoQuedaV = 4 } = {}) {
  const r = mulberry32(semente), F = [];
  for (let i = 0; i < cardume.n; i++) {
    const H = lerp(alturas[0], alturas[1], r()), tN = t0 + dur * Math.pow(r(), 0.8), x1 = lerp(area[0], area[1], r()), z1 = lerp(area[2], area[3], r());
    const v0 = -r() * ladoQuedaV, T = (-v0 + Math.sqrt(v0 * v0 + 2 * grav * (H - chao))) / grav;
    F.push({ H, tN, x1, z1, T, v0, vx: vento[0] * (0.6 + 0.8 * r()), vz: vento[1] * (0.6 + 0.8 * r()), wx: (r() - 0.5) * 14, wz: (r() - 0.5) * 10, yaw: r() * 6.283, yaw2: r() * 6.283, e: lerp(esc[0], esc[1], r()), fase: r() * 6.28, pit: (r() - 0.5) * 1.2 });
  }
  return t => {
    for (let i = 0; i < F.length; i++) {
      const f = F[i], tau = t - f.tN;
      if (tau < 0) { cardume.esconder(i); continue; }
      if (tau < f.T) {                                                    // voo: sai da nuvem, gira
        const y = f.H + f.v0 * tau - 0.5 * 9.8 * tau * tau;
        cardume.set(i, f.x1 - f.vx * (f.T - tau), y, f.z1 - f.vz * (f.T - tau), f.yaw + f.wz * tau * 0.2, -1.2 + f.wx * tau * 0.15, f.pit + f.wz * tau * 0.25, f.e);
      } else {                                                            // pousa: dois quiques e deitado
        const L = tau - f.T, hop = Math.max(0, 0.16 * Math.exp(-L * 2.6) * Math.abs(Math.sin(L * 9 + f.fase))), k = suave(clamp(L / 0.25));
        cardume.set(i, f.x1, chao + hop, f.z1, lerp(f.yaw + 0.3, f.yaw2, k), lerp(-1.2, -Math.PI / 2, k) + 0.35 * Math.sin(L * 14 + f.fase) * Math.exp(-L * 1.8), lerp(f.pit, 0, k), f.e);
      }
    }
    cardume.fim();
  };
}
