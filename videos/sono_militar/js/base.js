// Base compartilhada dos planos: estado global, definição de plano, câmera, ambiente de cada mundo.
import * as THREE from 'three';
import { renderer, scene, cam, mundos, tremor } from './motor.js';
import { clamp, lerp } from './util.js';

export const Q = new URLSearchParams(location.search);
export const S = { planos: [], total: 0, atores: [], carros: [] };
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const PI = Math.PI;

const AMB = {
  // F = frente de guerra (guarita, ninho do atirador); S = sala de aula, quarto e lago; o céu/hora de F é ajustado por frente.hora()
  guerra: { fundo: 0x07080f, nevoa: [0x120c0c, 0.0075], exp: 1.25 },
  entardecer: { fundo: 0x6a4a3c, nevoa: [0x8a6a58, 0.0085], exp: 1.05 },
  dia: { fundo: 0xa9b6c4, nevoa: [0xb8c0c4, 0.0070], exp: 1.0 },
  sala: { fundo: 0x101010, nevoa: null, exp: 1.1 },
  quarto: { fundo: 0x05060a, nevoa: null, exp: 1.4 },
  lago: { fundo: 0x050a18, nevoa: [0x0b1830, 0.0028], exp: 1.25 },
  N: { fundo: 0x000000, nevoa: null, exp: 1.0 },
  Z: { fundo: 0x000000, nevoa: null, exp: 1.0 },
};
const PADRAO = { F: 'guerra', S: 'sala', N: 'N', Z: 'Z' };
export function ambiente(nome) {
  const a = AMB[nome] || AMB.guerra;
  scene.background = new THREE.Color(a.fundo);
  scene.fog = a.nevoa ? new THREE.FogExp2(a.nevoa[0], a.nevoa[1]) : null;
  renderer.toneMappingExposure = a.exp;
}
export function mostrar(mundo, amb = null) {
  for (const k in mundos) mundos[k].visible = k === mundo;
  ambiente(amb || PADRAO[mundo] || 'guerra');
}
export function camara({ pos, alvo, fov = 40, roll = 0, tr = 1, t = 0, semente = 0 }) {
  window.__camInfo = { pos: pos.map(v => +v.toFixed(2)), alvo: alvo.map(v => +v.toFixed(2)), fov };
  cam.position.set(pos[0], pos[1], pos[2]); cam.up.set(0, 1, 0); cam.lookAt(alvo[0], alvo[1], alvo[2]);
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  if (roll) cam.rotateZ(roll);
  if (tr) tremor(cam, t, tr, 1, semente);
  if (S.aposCamera) S.aposCamera();
}
export const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export function reset() { if (S.F && S.F.rostoLuz) { S.F.rostoLuz.intensity = 0; S.F.rostoLuz.distance = 5; } if (S.quarto) { S.quarto.fill.intensity = 0; } if (S.lago) { S.lago.fill.intensity = 0; } if (S.soldado && S.soldado.olheiras) S.soldado.olheiras(0); for (const a of S.atores) { a.grupo.visible = false; a.lagrimaAt && a.lagrimaAt(0, false); } for (const c of S.carros) c.grupo.visible = false; for (const k of ['fuzil', 'fuzilDorme', 'binoculo', 'cantilProp', 'pilulasMao', 'giz']) if (S[k]) S[k].visible = false; }


export function plano(id, dur, mundo, fn, extra = {}) {
  const t0 = S.total;
  S.planos.push({ id, dur, mundo, fn, t0, ...extra });
  S.total += dur;
}
export function acharPlano(t) {
  for (let i = S.planos.length - 1; i >= 0; i--) if (t >= S.planos[i].t0 - 1e-6) return S.planos[i];
  return S.planos[0];
}
