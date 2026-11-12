// Linha do tempo: constrói o mundo (espaço, celular, cidade, átomo) e comanda cada plano em função do tempo.
import * as THREE from 'three';
import { mundos, scene, cam } from './motor.js';
import { clamp, suave } from './util.js';
import { S, Q, plano, acharPlano, reset, mostrar, camara } from './base.js';
import { construirMundo } from './mundo.js';
import { montarPlanos } from './cenas.js';

export async function construirTudo() {
  S.m = await construirMundo(mundos.F);
  S.atores = [S.m.heroi, ...S.m.saindo];
  montarPlanos();
  return S;
}
export function atualizar(t) {
  const p = acharPlano(t);
  reset();
  mostrar('F', p.amb);
  S.m.esconderTudo();
  p.fn(clamp(t - p.t0, 0, p.dur), t, p);
}
export function efeitos(t) {
  const e = { subs: 1, obturador: 0.35, fade: 0, flash: 0, flashCor: '255,255,255', tintas: null };
  const p = acharPlano(t), u = t - p.t0;
  if (p.efeito) Object.assign(e, p.efeito(u, t, p));
  e.subs = Math.max(1, Math.round(e.subs * 0.6));
  if (t > S.total - 0.5) e.fade = suave((t - (S.total - 0.5)) / 0.5) * 0;
  return e;
}
