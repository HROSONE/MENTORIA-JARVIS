// Ato 4: o funeral. Close-ups de quem chora, os carregadores levantam as alças e o cortejo dos três caixões.
import * as THREE from 'three';
import { cam, mundos } from './motor.js';
import { clamp, lerp, suave, suave5, entra, sai, inv, ruido, mulberry32 } from './util.js';
import { S, V, PI, plano, camara, mix3 } from './base.js';
import { Ator } from './atores.js';
import { construirC, criarCaixao, focoC } from './mundoC.js';

const VEL = 0.74;                       // velocidade do cortejo (m/s)
const ESPACO = 4.3;                     // distância entre os caixões
const BASE_Y = 0.70;                    // altura da base dos caixões (mãos na altura do quadril)
const zLider = tp => -9.5 + VEL * tp;

export async function prepararAto4() {
  S.C = await construirC();
  S.mae = await Ator.criar('mae'); S.paiC = await Ator.criar('pai'); S.velhaL = await Ator.criar('velha_luto'); S.davi = await Ator.criar('davi');
  for (const a of [S.mae, S.paiC, S.velhaL, S.davi]) a.criarLagrimas(3);
  S.carregadores = [];
  const modelos = ['pai', 'terno2', 'terno3', 'terno2', 'terno3', 'pai', 'terno2', 'pai', 'terno3', 'terno2', 'pai', 'terno3'];
  const r = mulberry32(8);
  for (const m of modelos) S.carregadores.push(await Ator.criar(m, { escala: 0.97 + r() * 0.07 }));
  S.caixoes = [criarCaixao('#e6e4de', '#f7f5f0', '#e9b8c4'), criarCaixao('#9a6a3e', '#b8854f', '#ffffff'), criarCaixao('#4a2a18', '#6a3d22', '#f4f2ee')];
  for (const a of [S.mae, S.paiC, S.velhaL, S.davi, ...S.carregadores]) { mundos.C.add(a.grupo); S.atores.push(a); }
  for (const c of S.caixoes) mundos.C.add(c);
  montarAto4();
}

function cortejo(tp, t, { detalhe = true } = {}) {
  S.C.animarMultidao(t);
  const dur = i => S.carregadores[i].duracao('Andar');
  S.caixoes.forEach((cx, k) => {
    const zc = zLider(tp) - k * ESPACO;
    const bob = 0.011 * Math.sin(tp * 2 * PI * 0.92 + k * 0.7);
    cx.position.set(0, BASE_Y + bob, zc); cx.rotation.set(0, 0, 0.004 * Math.sin(tp * 4 + k)); cx.visible = true;
    for (let j = 0; j < 4; j++) {
      const i = k * 4 + j, a = S.carregadores[i];
      const sx = j % 2 ? -1 : 1, fz = j < 2 ? 0.55 : -0.55;
      a.grupo.visible = true;
      a.colocar(sx * 0.66, 0, zc + fz, 0);
      const rate = VEL / Math.max(a.velocidade('Andar'), 0.4);
      a.anim('Andar', tp * rate + (j % 2) * 0.5 + k * 0.17);
      a.rosto({ expressao: 'triste', forca: 0.5, boca: 0, olhar: [0, -0.15] }); a.atualizarRosto();
      a.somar('Cabeca', 0.18, 0, 0);
      const alca = V(sx * (fz > 0 ? 0.305 : 0.275), BASE_Y + bob + 0.27, zc + fz);
      const pole = V(sx * 0.5, -0.8, -0.2);
      a.ikBraco(sx > 0 ? 'D' : 'E', alca, pole);
      const frente = a.grupo.localToWorld(new THREE.Vector3(-sx * 0.12, 0.92 / a.escala * 0.98, 0.20));
      a.ikBraco(sx > 0 ? 'E' : 'D', frente, V(-sx * 0.5, -0.8, -0.2));
    }
  });
  focoC(S.C, 0, zLider(tp) - ESPACO);
}

// pessoa chorando: posição, giro, o que faz com a mão; devolve o ponto da cabeça
function chorando(a, x, z, giro, t, { mao = null, olhar = [0, -0.3], boca = 0.05, piscar = 0.0 } = {}) {
  a.grupo.visible = true; a.colocar(x, 0, z, giro);
  a.anim('Parado', t * 0.3);
  a.soluco(t, 1.0);
  const f = V(Math.sin(giro), 0, Math.cos(giro));
  const hp0 = a.pos('Cabeca');
  if (mao) {
    const alvo = hp0.clone().add(f.clone().multiplyScalar(mao.f)).add(V(0, mao.y, 0)).add(V(f.z, 0, -f.x).multiplyScalar(mao.l || 0));
    a.ikBraco(mao.lado, alvo, V(f.z * (mao.lado === 'D' ? -1 : 1) * 0.5, -0.9, -f.x * 0.2));
  }
  const s = Math.max(0, Math.sin(t * 3.1)) ** 3;
  a.rosto({ expressao: 'triste', forca: 1, boca: boca + 0.05 * s, olhar, piscar: piscar });
  a.atualizarRosto();
  a.lagrimaAt(t * 1.2);
  return a.pos('Cabeca');
}
function camFace(hp, giro, d, lat, alt) {
  const f = V(Math.sin(giro), 0, Math.cos(giro)), l = V(f.z, 0, -f.x);
  return hp.clone().add(f.multiplyScalar(d)).add(l.multiplyScalar(lat)).add(V(0, alt, 0));
}

function montarAto4() {
  const chapelZ = -98;
  // 1) cemitério, céu nublado, o sino: câmera sobe devagar sobre quem espera
  plano('cemitério', 1.7, 'C', (u, t) => {
    cortejo(-11 + 0.0 * u + u * 0.5, t);
    const k = suave(u / 1.7);
    camara({ pos: [lerp(-5.5, 0.8, k), lerp(1.4, 4.4, k), lerp(19.5, 16.0, k)], alvo: [0, lerp(1.5, 1.2, k), -30], fov: 46, roll: 0.03 * Math.sin(t * 0.8) + 0.02, tr: 0.9, t, semente: 41 });
  }, { efeito: () => ({ subs: 1 }) });

  // 2) mãe (close, chorando, a mão na boca)
  plano('mãe', 1.05, 'C', (u, t) => {
    cortejo(-10.5, t);
    const giro = -1.45, a = S.mae;
    const hp = chorando(a, 3.3, -4.2, giro, t, { mao: { lado: 'D', f: 0.11, y: -0.045, l: 0.0 }, olhar: [0.1, -0.35], boca: 0.02, piscar: 0.35 });
    const k = suave(u / 1.05), p = camFace(hp.add(V(0, 0.07, 0)), giro, lerp(0.95, 0.68, k), lerp(0.24, 0.12, k), 0.02);
    camara({ pos: [p.x, p.y, p.z], alvo: [hp.x, hp.y, hp.z], fov: lerp(28, 22, k), roll: -0.05 + 0.08 * k, tr: 2.6, t, semente: 42 });
  });

  // 3) pai (óculos, a mão nos olhos)
  plano('pai', 1.0, 'C', (u, t) => {
    cortejo(-10.0, t);
    const giro = 1.5, a = S.paiC;
    const hp = chorando(a, -3.2, -8.2, giro, t, { olhar: [0, -0.3], piscar: 0.75, boca: 0.03 });
    const k = suave(u / 1.0), p = camFace(hp.add(V(0, 0.07, 0)), giro, lerp(0.90, 0.66, k), lerp(-0.26, -0.14, k), 0.03);
    camara({ pos: [p.x, p.y, p.z], alvo: [hp.x, hp.y, hp.z], fov: lerp(28, 22, k), roll: 0.06 - 0.08 * k, tr: 2.8, t, semente: 43 });
  });

  // 4) avó
  plano('avó', 1.0, 'C', (u, t) => {
    cortejo(-9.6, t);
    const giro = -1.35, a = S.velhaL;
    const hp = chorando(a, 3.7, -12.5, giro, t, { olhar: [0, -0.4], piscar: 0.45, boca: 0.02 });
    const k = suave(u / 1.0), p = camFace(hp.add(V(0, 0.06, 0)), giro, lerp(0.85, 0.62, k), lerp(0.20, 0.10, k), 0.02);
    camara({ pos: [p.x, p.y, p.z], alvo: [hp.x, hp.y, hp.z], fov: lerp(28, 21, k), roll: -0.04 + 0.06 * k, tr: 2.4, t, semente: 44 });
  });

  // 5) o irmão mais novo
  plano('irmão', 1.0, 'C', (u, t) => {
    cortejo(-9.2, t);
    const giro = 1.45, a = S.davi;
    const hp = chorando(a, -3.4, -3.0, giro, t, { olhar: [0, -0.2], boca: 0.05, piscar: 0.2 });
    const k = suave(u / 1.0), p = camFace(hp.add(V(0, 0.06, 0)), giro, lerp(0.80, 0.58, k), lerp(-0.22, -0.10, k), 0.01);
    camara({ pos: [p.x, p.y, p.z], alvo: [hp.x, hp.y, hp.z], fov: lerp(27, 21, k), roll: 0.05 - 0.07 * k, tr: 2.8, t, semente: 45 });
  });

  // 6) de frente para o caixão da frente: os carregadores e as mãos nas alças (baixo, acompanhando)
  plano('alças', 1.1, 'C', (u, t) => {
    const tp = -1.0 + u; cortejo(tp, t);
    const zc = zLider(tp), k = suave(u / 1.1);
    camara({ pos: [lerp(-0.55, 0.55, k), lerp(1.30, 1.15, k), zc + 2.6], alvo: [0, 0.96, zc + 0.4], fov: 44, roll: -0.08 + 0.10 * k, tr: 2.2, t, semente: 46 });
  });

  // 7) o cortejo vem em câmera lenta pelo caminho: três caixões em fila
  plano('cortejo', 3.2, 'C', (u, t) => {
    const tp = 0.0 + u * 1.0; cortejo(tp, t);
    const k = suave(u / 3.2);
    camara({ pos: [lerp(0.6, -0.4, k), lerp(0.62, 1.15, k), lerp(2.2, 4.4, k)], alvo: [0.0, lerp(0.95, 1.5, k), zLider(tp) - lerp(2.0, 4.6, k)], fov: lerp(36, 44, k), roll: lerp(0.04, -0.03, k), tr: 0.9, t, semente: 47 });
  }, { efeito: () => ({ subs: 1 }) });

  // 8) subimos: o cortejo de cima, indo até a tenda
  plano('alto', 2.7, 'C', (u, t) => {
    const tp = 3.2 + u; cortejo(tp, t);
    const k = suave(u / 2.7);
    camara({ pos: [lerp(-0.4, -3.5, k), lerp(1.4, 12.5, k), lerp(4.6, 12.0, k)], alvo: [0, lerp(1.4, 0.3, k), zLider(tp) - lerp(5, 11, k)], fov: lerp(44, 50, k), roll: -0.03 + 0.06 * k, tr: 0.6, t, semente: 48 });
  }, { efeito: () => ({ subs: 1 }) });

  // 9) cartela final: fonte, reconstituição e a marca
  const tintas = k => (g, w, h) => {
    const q = w / 1080;
    g.save(); g.scale(q, q); w = 1080; h = h / q; g.globalAlpha = k; g.textAlign = 'center'; g.fillStyle = '#e9e6df';
    g.font = '500 44px "DejaVu Sans", sans-serif'; g.fillText('CASO REAL', w / 2, h * 0.40);
    g.font = '34px "DejaVu Sans", sans-serif'; g.fillStyle = '#cfcbc2';
    g.fillText('Temescal Valley, Califórnia · 19/01/2020', w / 2, h * 0.455);
    g.fillText('Reconstituição ilustrativa', w / 2, h * 0.49);
    g.font = 'bold 56px "DejaVu Sans", sans-serif'; g.fillStyle = '#c9a24a'; g.fillText('HRYZ ANIMATION', w / 2, h * 0.62);
    g.font = '24px "DejaVu Sans", sans-serif'; g.fillStyle = '#9a968e'; g.fillText('Fontes: NBC News (14/07/2023) · AP · Promotoria de Riverside', w / 2, h * 0.93);
    g.restore();
  };
  plano('cartela', 2.4, 'Z', () => { cam.position.set(0, 0, 5); cam.lookAt(0, 0, 0); }, { efeito: u => ({ tintas: tintas(suave(inv(0.15, 0.7, u)) * (1 - suave(inv(2.0, 2.4, u)))) }) });
}
