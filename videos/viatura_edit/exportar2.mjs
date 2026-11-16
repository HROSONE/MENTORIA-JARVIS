// Exporta a linha do tempo da v2 para JSON (uma fonte da verdade para o pós, os efeitos sonoros e a montagem dos quadros):
//   node exportar2.mjs > edl2.json
// "fonte"[i] = índice do quadro da v1 a reaproveitar no quadro i da v2 (−1 = quadro novo, renderizado por index2.html).
// O reaproveitamento desloca o plano da v1 em batidas inteiras (a fase das luzes e do soco de zoom se mantém); o quadro mais próximo no tempo é escolhido e fica dentro do plano de origem.
import { EDL, FX, B, BPM, TOTAL_B, TOTAL, planoEm } from './js/planos2.js';
import * as V1 from './js/planos.js';

const FPS = 30, N = Math.round(TOTAL * FPS), N1 = Math.round(V1.TOTAL * FPS);
const faixa1 = new Map();                                                                  // plano da v1 (por batida inicial) -> [primeiro quadro, último quadro]
for (let j = 0; j < N1; j++) { const p = V1.planoEm(j / FPS); const f = faixa1.get(p.b0) || [j, j]; f[1] = j; faixa1.set(p.b0, f); }
const fonte = [], quadrosNovos = [];
for (let i = 0; i < N; i++) {
  const t = Math.min(Math.max(i / FPS, 0), TOTAL - 1e-4), pl = planoEm(t);
  if (!pl.reuso) { fonte.push(-1); quadrosNovos.push(i); continue; }
  const p1 = V1.PLANOS.find(p => p.b0 === pl.reuso.b0);
  if (!p1) throw new Error('plano da v1 não encontrado para ' + pl.nome + ' (b0=' + pl.reuso.b0 + ')');
  if (Math.abs((p1.b1 - p1.b0) - (pl.b1 - pl.b0)) > 1e-9) throw new Error('duração diferente ao reaproveitar ' + pl.nome + ': v1 ' + (p1.b1 - p1.b0) + ' batidas, v2 ' + (pl.b1 - pl.b0));
  const [j0, j1] = faixa1.get(p1.b0), j = Math.min(j1, Math.max(j0, Math.round((pl.reuso.b0 * B + (t - pl.b0 * B)) * FPS)));
  fonte.push(j);
}
const planos = EDL.map(p => ({ nome: p.nome, b0: p.b0, b1: p.b1, novo: !p.reuso, deB: p.reuso ? p.reuso.b0 : null, calmo: !!p.calmo }));
console.log(JSON.stringify({ BPM, B, FPS, N, TOTAL_B, TOTAL, planos, fonte, quadrosNovos, FX }));
