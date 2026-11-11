// Ato 1: a campainha, a fuga dos adolescentes e a saída do homem.
import * as THREE from 'three';
import { cam, mundos } from './motor.js';
import { clamp, lerp, suave, suave5, entra, sai, inv, ruido } from './util.js';
import { POS } from './mundoA.js';
import { S, V, PI, plano, camara, mix3 } from './base.js';

// ---------------------------------------------------------------------------------------------------- ATO 1: a campainha
const P = POS;
function porta(abre) { S.A.portaPivo.rotation.y = abre * 1.55; S.A.vao.visible = abre > 0.02; }
function luzVaranda(k) { S.A.luzVaranda.intensity = 14 * k; S.A.globoVaranda.material.emissiveIntensity = 2.2 * k; S.A.brilhoVaranda.material.opacity = 0.8 * Math.min(1, k); }

// corrida em linha reta: devolve posição/giro para o corredor i no tempo u
function corrida(a, b, v, atraso, u) {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]), dir = [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
  const s = clamp((u - atraso) * v, 0, d);
  return { x: a[0] + dir[0] * s, z: a[1] + dir[1] * s, giro: Math.atan2(dir[0], dir[1]), andando: u > atraso && s < d };
}

// os atores e os carros foram levados para outros mundos (B, C) na montagem: cada plano do mundo A os traz de volta, sem amassados
function emA() {
  for (const a of [S.jA, S.jB, S.jC, S.jD, S.jE, S.homem]) { mundos.A.add(a.grupo); a.grupo.scale.setScalar(a.escala); }
  mundos.A.add(S.hatch.grupo, S.sedan.grupo);
  S.hatch.amassar('tras', 0); S.hatch.amassar('frente', 0); S.sedan.amassar('frente', 0);
  S.hatch.corpo.visible = true; S.sedan.corpo.visible = true;
}

export function montarAto1() {
  const A = S.A;
  // 1) campainha (o rosto dele, o polegar no botão)
  plano('campainha', 1.40, 'A', (u, t) => {
    emA();
    luzVaranda(1); porta(0);
    const a = S.jA; a.grupo.visible = true; a.colocar(-2.55, 0.45, -11.50, 0 + 0.05 * ruido(t * 1.5));
    a.anim('Parado', u);
    const aperta = suave(inv(0.08, 0.16, u)) * (1 - suave(inv(0.52, 0.66, u)));
    a.ikBraco('E', P.campainha.clone().add(V(0, 0.0, 0.07 - 0.07 * aperta)), V(0.9, -0.2, 0.4));
    a.somar('Coluna', 0, -0.10, 0); a.somar('Peito', 0, 0.12 * aperta, 0);
    a.rosto({ expressao: 'sorriso', forca: 1, boca: 0.06 + 0.05 * Math.sin(u * 9), olhar: [0.03, -0.02] });
    a.somar('Cabeca', 0.02, -0.16 + 0.05 * Math.sin(u * 5), 0.06);
    a.atualizarRosto();
    A.botao.material.emissiveIntensity = 1.2 + 5.0 * aperta; A.botaoBrilho.material.opacity = 0.9 + 0.1 * aperta; A.botaoBrilho.scale.setScalar(0.28 + 0.5 * aperta);
    const k = suave(u / 1.4);
    camara({ pos: mix3([-2.30, 1.80, -9.75], [-2.48, 1.98, -10.45], k), alvo: [-2.60, mix3([0, 1.72, 0], [0, 1.99, 0], k)[1], -11.5], fov: lerp(30, 24, suave(inv(0.2, 1.4, u))), roll: 0.03 * Math.sin(u * 3), tr: 1.3, t, semente: 1 });
  }, { efeito: u => ({ flash: 0.45 * Math.max(0, 1 - Math.abs(u - 0.13) / 0.05) }) });

  // 2) os cinco saem correndo (câmera à frente deles, recuando)
  plano('correm', 1.45, 'A', (u, t) => {
    emA();
    luzVaranda(1); porta(0);
    const A = S.A;
    const lista = [[S.jA, [-2.6, -10.7], 0.00, 3.5], [S.jB, [-1.2, -10.6], 0.12, 3.35], [S.jC, [-4.4, -10.6], 0.07, 3.2], [S.jD, [-0.2, -10.8], 0.22, 3.4], [S.jE, [-3.6, -10.4], 0.27, 3.3]];
    const destino = [[8.2, -3.8], [9.6, -3.2], [7.4, -3.4], [10.4, -4.2], [8.8, -4.6]];
    lista.forEach(([a, ini, atraso, v], i) => {
      a.grupo.visible = true;
      const c = corrida(ini, destino[i], v, atraso, u + 0.15);
      const alt = c.z < -10.2 ? 0.45 : (c.z < -9.9 ? 0.31 : 0.17);
      a.colocar(c.x, alt, c.z, c.giro);
      if (c.andando) a.anim('Fugir', (u + 0.15 - atraso) * 1.0 + i * 0.07); else a.anim('Parado', u);
      a.rosto({ expressao: i % 2 ? 'grito' : 'sorriso', forca: 1, boca: i % 2 ? 0.0 : 0.25 });
      a.atualizarRosto();
    });
    const l = corrida(lista[0][1], destino[0], lista[0][3], 0, u + 0.15);
    const lider = V(l.x, 1.0, l.z);
    const dir = V(Math.sin(l.giro), 0, Math.cos(l.giro));
    const pos = lider.clone().add(dir.clone().multiplyScalar(3.2 - 0.0 * u)).add(V(0, -0.35, 0)).add(V(-dir.z, 0, dir.x).multiplyScalar(0.5));
    camara({ pos: [pos.x, 0.62, pos.z], alvo: [lider.x - dir.x * 0.3, 1.05, lider.z - dir.z * 0.3], fov: 52, roll: -0.05 + 0.03 * Math.sin(u * 7), tr: 2.0, t, semente: 2 });
  }, { efeito: () => ({ subs: 2, obturador: 0.7 }) });

  // 3) a porta abre: a luz do corredor vaza e ele aparece
  plano('porta abre', 1.20, 'A', (u, t) => {
    emA();
    const k = suave5(inv(0.15, 0.62, u));
    porta(k); luzVaranda(1 + 0.8 * (u > 0.1 ? 1 : 0));
    const h = S.homem; h.grupo.visible = true;
    const passo = suave(inv(0.22, 1.1, u));
    h.colocar(P.portaX + 0.1, 0.45, -12.1 + 1.0 * passo, 0);
    h.anim('Andar', u * 0.6);
    h.rosto({ expressao: 'raiva', forca: 1, boca: 0.0 });
    h.olhar(V(10, 1.3, -3), { forca: 0.8 }); h.atualizarRosto();
    camara({ pos: mix3([-0.6, 1.0, -7.6], [-1.5, 1.55, -8.7], suave(u / 1.2)), alvo: [P.portaX, 1.95, -11.8], fov: 38, roll: 0.06 - 0.05 * suave(u / 1.2), tr: 1.4, t, semente: 3 });
  });

  // 4) close dele (olhar de ódio)
  plano('olhar dele', 1.15, 'A', (u, t) => {
    emA();
    porta(1); luzVaranda(1.5);
    const h = S.homem; h.grupo.visible = true;
    h.colocar(P.portaX + 0.15, 0.45, -11.55, 0.10 - 0.18 * suave(u / 1.15));
    h.anim('Parado', u);
    h.rosto({ expressao: 'raiva', forca: 1, boca: 0.04 + 0.02 * Math.sin(u * 8), olhar: [-0.30 * suave(inv(0.5, 0.9, u)), 0.0] });
    h.olhar(V(10, 1.35, -3), { forca: 0.9 }); h.atualizarRosto();
    const k = suave(u / 1.15);
    camara({ pos: mix3([P.portaX + 0.9, 2.12, -10.0], [P.portaX + 0.55, 2.10, -10.75], k), alvo: [P.portaX + 0.15, 2.09, -11.55], fov: lerp(30, 22, k), roll: -0.05 + 0.10 * k, tr: 1.5, t, semente: 4 });
  });

  // 5) o carro dos adolescentes arranca cantando pneu
  plano('carro foge', 1.25, 'A', (u, t) => {
    emA();
    luzVaranda(1); porta(1);
    const c = S.hatch; c.grupo.visible = true;
    const v = 15 * entra(u / 1.1) * 1.0;
    const x = 12 + 0.0 + (u < 0.35 ? 0 : 0.5 * 18 * (u - 0.35) ** 2);
    c.colocar(x, 0.15, -2.3, PI / 2, { pitch: -0.025 * Math.min(1, u * 2) * (u < 0.9 ? 1 : 0), dist: x * 1.0 });
    c.farois(1); c.lanternas(u < 0.35 ? 1 : 0.5);
    camara({ pos: mix3([5.5, 0.55, -1.2], [10.5, 0.7, -1.0], suave(u / 1.25)), alvo: [x + 1.5, 0.8, -2.3], fov: 48, tr: 2.2, t, semente: 5 });
  }, { efeito: () => ({ subs: 2, obturador: 0.7 }) });

  // 6) ele corre para o carro dele
  plano('ele corre', 1.30, 'A', (u, t) => {
    emA();
    luzVaranda(1); porta(1);
    const h = S.homem; h.grupo.visible = true;
    const a = [-1.8, -10.2], b = [3.2, -8.6];
    const c = corrida(a, b, 3.9, 0, u);
    h.colocar(c.x, 0.17, c.z, c.giro);
    h.anim('Correr', u * 1.05);
    h.rosto({ expressao: 'raiva', forca: 1, boca: 0.15 }); h.atualizarRosto();
    const s = S.sedan; s.grupo.visible = true; s.colocar(P.garagemX, 0.17, -9.6, 0); s.farois(0); s.lanternas(0.2);
    camara({ pos: [c.x + 1.8 - 1.0 * u, 0.55, c.z + 2.3], alvo: [c.x + 0.6, 1.1, c.z - 0.2], fov: 46, roll: 0.08, tr: 2.4, t, semente: 6 });
  }, { efeito: () => ({ subs: 2, obturador: 0.7 }) });

  // 7) faróis acendem e ele sai em disparada pela garagem
  plano('faróis', 0.95, 'A', (u, t) => {
    emA();
    luzVaranda(1); porta(1);
    const s = S.sedan; s.grupo.visible = true;
    const acende = suave(inv(0.05, 0.14, u));
    const dz = 0.5 * 12 * Math.max(0, u - 0.35) ** 2;
    s.colocar(P.garagemX, 0.17, -9.6 + dz, 0, { pitch: -0.03 * (u > 0.35 ? 1 : 0), dist: dz });
    s.farois(acende); s.lanternas(0.25);
    const k = suave(u / 0.95);
    camara({ pos: mix3([P.garagemX - 0.9, 0.50, -3.2], [P.garagemX + 0.9, 0.72, -3.0], k), alvo: [P.garagemX, 0.8, -7.6 + dz], fov: lerp(36, 52, k), roll: 0.0, tr: 2.0 + 3 * (u > 0.4 ? 1 : 0), t, semente: 7 });
  }, { efeito: u => ({ flash: 0.45 * Math.max(0, 1 - Math.abs(u - 0.12) / 0.10) }) });
}
