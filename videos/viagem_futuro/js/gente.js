// Movimento de gente (poses procedurais sobre os clipes do elenco): andar fraco, desabar, ficar deitado; ajudantes de escala fina (magros).
import * as THREE from 'three';
import { clamp, lerp, suave } from './util.js';

export const FINO = 0.80;                                   // magros: ombros e tronco mais estreitos (escala x/z)
export function dimensionar(a, esc = 1, fino = FINO) { a.escala = esc; a.grupo.scale.set(esc * fino, esc, esc * fino); return a; }

const ease2 = k => k * k;
const pingue = k => (k < 0.82 ? ease2(k / 0.82) : 1 + 0.025 * Math.sin((k - 0.82) / 0.18 * Math.PI));   // queda acelerada com um quique curto no fim

// andando com fraqueza: passo lento, tronco curvado, cabeça baixa
export function andarFraco(a, x, y, z, yaw, t, ritmo = 0.5, pesar = 1) {
  a.grupo.visible = true; a.grupo.position.set(x, y, z); a.grupo.rotation.set(0, yaw, 0, 'YXZ');
  a.anim('Andar', t * ritmo);
  a.somar('Coluna', 0.30 * pesar, 0, 0); a.somar('Pescoco', 0.28 * pesar, 0, 0); a.somar('Cabeca', 0.18 * pesar, 0, 0);
  a.somar('OmbroE', 0.12 * pesar, 0, 0); a.somar('OmbroD', 0.12 * pesar, 0, 0);
  a.rosto({ expressao: 'triste', forca: 0.7, piscar: 0 }); a.atualizarRosto(); a.grupo.updateMatrixWorld(true);
  return a;
}

// parado de pé, fraco, balançando de leve
export function emPeFraco(a, x, y, z, yaw, t, fase = 0, expr = 'triste', forca = 0.6) {
  a.grupo.visible = true; a.grupo.position.set(x, y, z); a.grupo.rotation.set(0, yaw, 0, 'YXZ');
  a.anim('Parado', t * 0.6 + fase);
  a.somar('Coluna', 0.18 + 0.03 * Math.sin(t * 1.2 + fase), 0, 0.03 * Math.sin(t * 0.9 + fase)); a.somar('Pescoco', 0.16, 0, 0); a.somar('Cabeca', 0.12, 0, 0);
  a.rosto({ expressao: expr, forca, piscar: 0 }); a.atualizarRosto(); a.grupo.updateMatrixWorld(true);
  return a;
}

// desabando: k 0 → 1. tipo: 'costas' | 'frente' | 'lado'. Joelhos cedem, braços se abrem, o corpo tomba em torno dos pés e quica.
export function cair(a, x, y, z, yaw, k, tipo = 'costas', t = 0) {
  a.grupo.visible = true;
  const e = pingue(clamp(k)), lado = tipo === 'lado' ? (yaw > 0 ? 1 : -1) : 0;
  const joelho = suave(clamp(k * 2.2));
  a.anim('Parado', t * 0.6);
  for (const l of 'ED') { a.somar('Coxa' + l, -0.55 * joelho, 0, 0); a.somar('Canela' + l, 0.95 * joelho, 0, 0); }
  const sg = l => (l === 'E' ? 1 : -1);
  for (const l of 'ED') { a.somar('Braco' + l, 0.2 * k, 0, sg(l) * (0.5 + 0.9 * k)); a.somar('Antebraco' + l, 0.2, 0, 0); }
  a.somar('Coluna', 0.3 * (1 - k), 0, 0); a.somar('Cabeca', tipo === 'frente' ? 0.2 : -0.35 * k, 0, 0.2 * k);
  const rx = (tipo === 'frente' ? 1 : -1) * (Math.PI / 2) * (tipo === 'lado' ? 0 : e), rz = lado * (Math.PI / 2) * (tipo === 'lado' ? e : 0);
  a.grupo.rotation.set(rx, yaw, rz, 'YXZ'); a.grupo.position.set(x, y + 0.15 * clamp(e), z);
  a.rosto({ expressao: 'triste', forca: 0.8, piscar: k > 0.6 ? 1 : 0 }); a.atualizarRosto(); a.grupo.updateMatrixWorld(true);
  return a;
}

// já caído e imóvel (respira bem de leve, ou treme na primeira metade da vida)
export function deitado(a, x, y, z, yaw, tipo = 'costas', t = 0, fase = 0, vivo = 0) {
  a.grupo.visible = true;
  a.anim('Parado', 0);
  const resp = 0.012 * Math.sin(t * 1.4 + fase) * (0.5 + vivo);
  for (const l of 'ED') {
    const s = l === 'E' ? 1 : -1;
    a.somar('Braco' + l, 0.1 + (tipo === 'lado' ? -0.5 * (l === 'E') : 0), 0, s * (0.55 + 0.35 * Math.sin(fase * 3 + (l === 'E' ? 0 : 2))));
    a.somar('Antebraco' + l, 0.25 + 0.2 * Math.sin(fase * 2), 0, 0);
  }
  if (tipo === 'lado') for (const l of 'ED') { a.somar('Coxa' + l, -0.9, 0, 0); a.somar('Canela' + l, 1.3, 0, 0); }
  else { a.somar('CoxaE', -0.1, 0, -0.18); a.somar('CoxaD', 0.0, 0, 0.22); if (fase % 2 > 1) { a.somar('CoxaE', -0.7, 0, 0); a.somar('CanelaE', 1.1, 0, 0); } }
  a.somar('Peito', resp, 0, 0); a.somar('Cabeca', tipo === 'frente' ? 0 : -0.15, 0.4 * Math.sin(fase * 5), 0.15 * Math.sin(fase * 4));
  const rx = tipo === 'frente' ? Math.PI / 2 : tipo === 'costas' ? -Math.PI / 2 : 0, rz = tipo === 'lado' ? (fase % 2 > 1 ? 1 : -1) * Math.PI / 2 : 0;
  a.grupo.rotation.set(rx, yaw, rz, 'YXZ'); a.grupo.position.set(x, y + 0.15, z);
  a.rosto({ expressao: 'triste', forca: 0.8, piscar: 1 }); a.atualizarRosto(); a.grupo.updateMatrixWorld(true);
  return a;
}
