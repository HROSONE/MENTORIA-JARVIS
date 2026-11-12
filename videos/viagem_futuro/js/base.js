// Base compartilhada dos planos: estado global, definição de plano, câmera, ambientes.
import * as THREE from 'three';
import { renderer, scene, cam, mundos, tremor } from './motor.js';
import { clamp, lerp } from './util.js';

export const Q = new URLSearchParams(location.search);
export const S = { planos: [], total: 0, atores: [] };
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const PI = Math.PI;

const AMB = {
  seca: { fundo: 0xd9a06a, nevoa: [0xd9a870, 0.0075], exp: 1.0 },
  nave: { fundo: 0x05070c, nevoa: null, exp: 1.2 },
  tunel: { fundo: 0x02020a, nevoa: null, exp: 1.2 },
  futuro: { fundo: 0x0b1030, nevoa: [0x12204a, 0.0036], exp: 1.25 },
  lab: { fundo: 0x10141c, nevoa: null, exp: 1.15 },
  cidade: { fundo: 0x9fc4e8, nevoa: [0xb9d3ea, 0.0016], exp: 1.0 },
};
export function ambiente(nome) {
  const a = AMB[nome] || AMB.espaco;
  scene.background = new THREE.Color(a.fundo);
  scene.fog = a.nevoa ? new THREE.FogExp2(a.nevoa[0], a.nevoa[1]) : null;
  renderer.toneMappingExposure = a.exp;
}
export function mostrar(mundo, amb) { for (const k in mundos) mundos[k].visible = k === mundo; ambiente(amb); }
export function camara({ pos, alvo, fov = 40, roll = 0, tr = 0, t = 0, semente = 0, near = 0.05 }) {
  if (cam.near !== near) { cam.near = near; cam.updateProjectionMatrix(); }
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
