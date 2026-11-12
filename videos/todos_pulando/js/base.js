// Base compartilhada dos planos: estado global, definição de plano, câmera, ambientes.
import * as THREE from 'three';
import { renderer, scene, cam, mundos, tremor } from './motor.js';
import { clamp, lerp } from './util.js';

export const Q = new URLSearchParams(location.search);
export const S = { planos: [], total: 0, atores: [] };
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const PI = Math.PI;

const AMB = {
  espaco: { fundo: 0x000004, nevoa: null, exp: 1.0 },
  celular: { fundo: 0x07070c, nevoa: null, exp: 1.1 },
  cidade: { fundo: 0x9fc4e8, nevoa: [0xb9d3ea, 0.0016], exp: 1.0 },
  africa: { fundo: 0xf0b070, nevoa: [0xf0c088, 0.0024], exp: 1.0 },
  brasil: { fundo: 0x74c4f0, nevoa: [0xbfe6f6, 0.0018], exp: 1.0 },
  china: { fundo: 0xc8c0c8, nevoa: [0xc8c0c8, 0.0034], exp: 1.0 },
  atomo: { fundo: 0x03050c, nevoa: null, exp: 1.1 },
};
export function ambiente(nome) {
  const a = AMB[nome] || AMB.espaco;
  scene.background = new THREE.Color(a.fundo);
  scene.fog = a.nevoa ? new THREE.FogExp2(a.nevoa[0], a.nevoa[1]) : null;
  renderer.toneMappingExposure = a.exp;
}
export function mostrar(mundo, amb) { for (const k in mundos) mundos[k].visible = k === mundo; ambiente(amb); }
export function camara({ pos, alvo, fov = 40, roll = 0, tr = 0, t = 0, semente = 0 }) {
  window.__camInfo = { pos: pos.map(v => +v.toFixed(2)), alvo: alvo.map(v => +v.toFixed(2)), fov };
  cam.position.set(pos[0], pos[1], pos[2]); cam.up.set(0, 1, 0); cam.lookAt(alvo[0], alvo[1], alvo[2]);
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  if (roll) cam.rotateZ(roll);
  if (tr) tremor(cam, t, tr, 1, semente);
}
export const lerpV = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export function plano(id, dur, amb, fn, extra = {}) {
  const t0 = S.total;
  S.planos.push({ id, dur, amb, fn, t0, ...extra });
  S.total += dur;
}
export function acharPlano(t) {
  for (let i = S.planos.length - 1; i >= 0; i--) if (t >= S.planos[i].t0 - 1e-6) return S.planos[i];
  return S.planos[0];
}
export function reset() { for (const a of S.atores) a.grupo.visible = false; }
