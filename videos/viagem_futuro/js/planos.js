// Linha do tempo: constrói o mundo e comanda cada plano em função do tempo.
import * as THREE from 'three';
import { mundos, cam } from './motor.js';
import { clamp } from './util.js';
import { S, acharPlano, reset, mostrar } from './base.js';
import { construirMundo } from './mundo.js';
import { montarPlanos } from './cenas.js';

const fr = new THREE.Frustum(), pv = new THREE.Matrix4(), esf = new THREE.Sphere();
export async function construirTudo() {
  S.m = await construirMundo(mundos.F);
  S.atores = [S.m.heroi, ...S.m.pool];
  montarPlanos();
  return S;
}
export function atualizar(t) {
  const p = acharPlano(t), m = S.m;
  reset();
  mostrar('F', p.amb);
  m.esconderTudo(); m.maq.grupo.visible = false; m.arma.visible = false; m.raio.visible = false; m.impacto.visible = false; m.faiscas.forEach(f => { f.visible = false; });
  m.aneisEnc.forEach(r => { r.visible = false; }); m.flashEnc.forEach(f => { f.visible = false; }); m.banana.visible = false; m.maca.visible = false; m.ferr.forEach(f => { f.visible = false; }); m.pedacinhos.forEach(f => { f.visible = false; });
  m.bananaSeg.forEach(s => { if (s.g.parent !== m.banana) s.g.visible = false; });
  p.fn(clamp(t - p.t0, 0, p.dur), t, p);
  // só gasta tempo de pele com quem aparece na câmera
  cam.updateMatrixWorld(); pv.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); fr.setFromProjectionMatrix(pv);
  for (const a of S.atores) { if (!a.grupo.visible) continue; esf.center.copy(a.grupo.position); esf.center.y += 0.8 * a.escala; esf.radius = 1.6 * a.escala; if (!fr.intersectsSphere(esf)) a.grupo.visible = false; }
}
export function efeitos(t) {
  const e = { subs: 1, obturador: 0.35, fade: 0, flash: 0, flashCor: '255,255,255', tintas: null };
  const p = acharPlano(t), u = t - p.t0;
  if (p.efeito) Object.assign(e, p.efeito(u, t, p));
  e.subs = Math.max(1, Math.round(e.subs * 0.6));
  return e;
}
