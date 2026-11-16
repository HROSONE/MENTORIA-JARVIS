// Linha do tempo do Short "Ele podia voar". Cada plano é uma função do tempo local u (s); o mundo inteiro é recalculado a cada quadro.
import * as THREE from 'three';
import { scene, cam, lente, renderer, Q } from './motor.js';
import { clamp, lerp, suave, sai, entra, ruido } from './util.js';
import { construirQuarto, relampago, criarLata, criarGibi } from './quarto.js';
import { criarLucas, noChao } from './lucas.js';

export const S = { planos: [], total: 0 };
const plano = (id, dur, fn, extra = {}) => { S.planos.push({ id, t0: S.total, dur, fn, ...extra }); S.total += dur; };
export function acharPlano(t) { for (let i = S.planos.length - 1; i >= 0; i--) if (t >= S.planos[i].t0 - 1e-6) return S.planos[i]; return S.planos[0]; }

const _a = new THREE.Vector3();
function camera(pos, alvo, fov, { roll = 0, tremor = 0, t = 0 } = {}) {
  if (Q.has('cam')) { pos = Q.get('cam').split(',').map(Number); alvo = Q.get('alvo').split(',').map(Number); fov = +(Q.get('fov') || 40); roll = 0; tremor = 0; }
  cam.position.set(...pos); cam.up.set(0, 1, 0); cam.lookAt(_a.set(...alvo));
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  if (roll) cam.rotateZ(roll);
  if (tremor) { cam.position.x += tremor * 0.010 * ruido(t * 6, 1); cam.position.y += tremor * 0.010 * ruido(t * 6.6, 2); cam.rotateX(tremor * 0.004 * ruido(t * 5.3, 3)); cam.rotateY(tremor * 0.004 * ruido(t * 4.7, 4)); cam.rotateZ(tremor * 0.005 * ruido(t * 4.1, 5)); }
  return Math.hypot(pos[0] - alvo[0], pos[1] - alvo[1], pos[2] - alvo[2]);
}

// queda livre com quique: altura y(t) partindo de y0 em repouso no instante 0 (chão em yc; e = restituição)
function queda(t, y0, yc, e = 0.3) {
  const g = 9.8; let h = y0 - yc, tt = t, v = 0, y = y0;
  if (tt <= 0) return { y: y0, parado: false, toque: -1 };
  const t1 = Math.sqrt(2 * h / g); if (tt < t1) return { y: y0 - 0.5 * g * tt * tt, parado: false, toque: -1 };
  tt -= t1; v = e * g * t1; let n = 0;
  while (v > 0.25 && n < 4) { const tb = 2 * v / g; if (tt < tb) return { y: yc + v * tt - 0.5 * g * tt * tt, parado: false, toque: n }; tt -= tb; v *= e; n++; }
  return { y: yc, parado: true, toque: n };
}

export async function construirTudo() {
  const quarto = await construirQuarto(scene, renderer); scene.environment = quarto.ambiente;
  const lucas = await criarLucas({ idade: 12 }); scene.add(lucas.grupo);
  const lata = criarLata(), gibi = criarGibi(); scene.add(lata, gibi);
  scene.background = new THREE.Color(0x0b0e12);
  const LX = -0.15, LZ = 0.05;                                                                 // onde o Lucas cai (cabeça para +z, pés para a janela)

  // ================================================================================================ 1) GANCHO: o preço antes da causa (0-4 s)
  plano('P1 gancho: caído no chão', 4.0, (u, t) => {
    renderer.toneMappingExposure = 1.0;
    quarto.atualizar(t, { relampago: relampago(t, [1.55]), luzAcesa: 0 });
    // ele tenta duas vezes e os braços falham
    const esforco = u < 1.25 ? lerp(0.62, 0.90, sai(u / 1.25)) : u < 1.75 ? lerp(0.90, 0.30, entra((u - 1.25) / 0.5)) : lerp(0.30, 0.70, suave((u - 2.1) / 1.4));
    const cansa = u < 1.25 ? 0 : u < 2.1 ? 0.55 * suave((u - 1.25) / 0.5) : 0.55 * (1 - suave((u - 2.1) / 1.0));
    noChao(lucas, { x: LX, z: LZ, yaw: 0, esforco, cansa, treme: 0.6 + 0.6 * clamp(esforco), t });
    // a lata e o gibi estavam flutuando: caem no quadro 0 (ainda no ar) e batem no chão
    const ql = queda(u, 0.62, 0.033, 0.28), qg = queda(u - 0.05, 0.85, 0.004, 0.0);
    lata.position.set(LX + 0.32 + 0.20 * clamp(u - 0.36) * (1 - Math.exp(-(u - 0.36) * 2)), ql.y, LZ + 1.55); lata.rotation.set(ql.parado ? Math.PI / 2 : 0.4 + u * 3.5, 0.6, ql.parado ? 0 : u * 2.0);
    if (ql.parado) lata.position.y = 0.033;
    gibi.position.set(LX - 0.48, qg.y + 0.003, LZ + 1.05); gibi.rotation.set(qg.parado ? 0 : 0.5 - u * 1.4, 0.4, qg.parado ? 0.02 : 0.3 + u * 1.1);
    const e = suave(u / 4);
    const d = camera([lerp(0.60, 0.45, e), lerp(1.70, 1.40, e), lerp(2.75, 2.45, e)], [LX + 0.0, 0.22, LZ + 0.95], lerp(44, 37, e), { roll: lerp(0.06, 0.0, e), tremor: 1, t });
    lente({ foco: d - 0.35, abertura: 0.010, desfoque: 0.012, brilho: 0.45, limiar: 0.8 });
  });
  return S;
}

export function atualizar(t) { const p = acharPlano(t); p.fn(clamp(t - p.t0, 0, p.dur), t, p); }
export function efeitos(t) { const p = acharPlano(t), u = t - p.t0; return p.efeito ? p.efeito(u, t) : { subs: 1 }; }
