// Linha do tempo do Short: constrói os mundos e comanda cada plano (câmera, atores, carros, efeitos) em função do tempo.
import * as THREE from 'three';
import { cam, mundos } from './motor.js';
import { clamp, suave, inv } from './util.js';
import { Ator } from './atores.js';
import { Carro } from './carros.js';
import { construirA, POS } from './mundoA.js';
import { S, Q, plano, acharPlano, reset, mostrar } from './base.js';
import { montarAto1 } from './ato1.js';
import { prepararB } from './ato2.js';
import { prepararAto3 } from './ato3.js';
import { prepararAto4 } from './ato4.js';

export async function construirTudo() {
  S.A = await construirA();
  S.jA = await Ator.criar('jovem_a'); S.jB = await Ator.criar('jovem_b'); S.jC = await Ator.criar('jovem_c');
  S.jD = await Ator.criar('jovem_b', { escala: 0.98 }); S.jD.pintar({ M_jaqueta: '#2f5fb8', M_jeans_plano: '#272931' });
  S.jE = await Ator.criar('jovem_a', { escala: 1.02 }); S.jE.pintar({ M_moletom: '#d9822f', M_mol_barra: '#b66a22', M_mol_bolso: '#c9772a' });
  S.homem = await Ator.criar('homem');
  S.atores = [S.jA, S.jB, S.jC, S.jD, S.jE, S.homem];
  for (const a of S.atores) mundos.A.add(a.grupo);
  S.hatch = await Carro.criar('hatchback-sports', { pintura: ['#8f96a3', '#4b515d'] });
  S.sedan = await Carro.criar('sedan-sports', { pintura: ['#3b414f', '#12151b'] });
  S.carros = [S.hatch, S.sedan];
  mundos.A.add(S.hatch.grupo); mundos.A.add(S.sedan.grupo);
  montarAto1();
  await prepararB();
  await prepararAto3();
  await prepararAto4();
  return S;
}

export function atualizar(t) {
  const p = acharPlano(t);
  reset();
  mostrar(p.mundo);
  p.fn(clamp(t - p.t0, 0, p.dur), t, p);
}
export function efeitos(t) {
  const p = acharPlano(t);
  const u = t - p.t0;
  const e = { subs: 1, obturador: 0.5, fade: 0, flash: 0, flashCor: '255,255,255', tintas: null };
  if (p.efeito) Object.assign(e, p.efeito(u, t, p));
  if (t > S.total - 1.0) e.fade = Math.max(e.fade, suave(inv(S.total - 1.0, S.total - 0.15, t)));
  return e;
}
