// Linha do tempo: constrói o mundo e comanda cada plano em função do tempo.
import * as THREE from 'three';
import { mundos } from './motor.js';
import { clamp, suave } from './util.js';
import { S, acharPlano, reset, mostrar } from './base.js';
import { construirMundo } from './mundo.js';
import { montarPlanos } from './cenas.js';

export async function construirTudo() {
  S.m = await construirMundo(mundos.F);
  S.atores = [S.m.heroi];
  montarPlanos();
  return S;
}
export function atualizar(t) {
  const p = acharPlano(t);
  reset();
  mostrar('F', p.amb);
  S.m.esconderTudo(); S.m.arma.visible = false; S.m.raio.visible = false; S.m.faiscas.forEach(f => { f.visible = false; }); S.m.maca_mao.visible = false;
  p.fn(clamp(t - p.t0, 0, p.dur), t, p);
}
export function efeitos(t) {
  const e = { subs: 1, obturador: 0.35, fade: 0, flash: 0, flashCor: '255,255,255', tintas: null };
  const p = acharPlano(t), u = t - p.t0;
  if (p.efeito) Object.assign(e, p.efeito(u, t, p));
  e.subs = Math.max(1, Math.round(e.subs * 0.6));
  return e;
}
