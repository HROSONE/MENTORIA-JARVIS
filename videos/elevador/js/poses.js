// Poses da Marites na cabine (coordenadas locais da cabine: +X é a porta, Z lateral, Y para cima) e do monofone.
import * as THREE from 'three';
import { Y_CAB, POCO } from './casa.js';
import { clamp, lerp, ruido } from './util.js';

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const PI = Math.PI;
// ponto da cabine em coordenadas do mundo (a cabine pode estar em outra altura que Y_CAB)
export const cabW = (x, y, z, ycab = Y_CAB) => V(x, ycab + y, POCO.cz + z);

// coloca a atriz em coordenadas da cabine
export function colocarCab(a, x, z, giro, ycab = Y_CAB, y = 0) { a.grupo.visible = true; a.colocar(x, ycab + y, POCO.cz + z, giro); return a; }

// de pé, segurando a grade com as duas mãos (rosto na grade)
export function poseGrade(a, t, { x = 0.30, z = 0.0, ycab = Y_CAB, hy = 1.42, vao = 0.17, medo = 0.8, olhar = [0, 0.05], tr = 1 } = {}) {
  colocarCab(a, x, z, PI / 2, ycab);
  a.anim('Assustado', t * 0.5);
  const n1 = ruido(t * 3.1, 3) * 0.01 * tr, n2 = ruido(t * 2.7, 5) * 0.01 * tr;
  a.ikBraco('E', cabW(0.615, hy + 0.03 + n1, z - vao, ycab), V(-0.3, -1, -0.7));
  a.ikBraco('D', cabW(0.615, hy - 0.04 + n2, z + vao, ycab), V(-0.3, -1, 0.7));
  a.rosto({ expressao: 'medo', forca: medo, olhar, piscar: 0.0 }); a.atualizarRosto();
  return a;
}

// de pé, apertando o botão i do painel (parede -Z, perto da porta)
export function poseBotao(a, t, i, { ycab = Y_CAB, press = 0, medo = 0.5, x = 0.30 } = {}) {
  colocarCab(a, x, -0.22, PI, ycab);
  a.anim('Parado', t * 0.4);
  const alvo = cabW(0.36 + 0.0, 1.58 - 0.065 * i, -0.50 + 0.03 * press, ycab);
  a.ikBraco('D', alvo, V(0.6, -1, 0.2));
  a.somar('Peito', 0.05, 0.0, 0);
  a.rosto({ expressao: 'medo', forca: medo, olhar: [0.25, -0.1] }); a.atualizarRosto();
  return a;
}

// monofone na orelha (k = 0 no gancho, 1 na orelha): ela fica de frente para a cabine (costas para a parede do painel), o fio estica até o gancho
export function poseFone(a, t, k, { ycab = Y_CAB, medo = 0.6 } = {}) {
  colocarCab(a, 0.30, -0.28, 0.0, ycab);
  a.anim('Parado', t * 0.4);
  const gancho = cabW(0.36, 1.00, -0.50, ycab);
  a.grupo.updateMatrixWorld(true);
  const cab = a.pos('Cabeca');
  const orelha = cab.clone().add(V(-0.095, 0.075, -0.02));
  const alvo = gancho.clone().lerp(orelha, k).add(V(0, Math.sin(k * PI) * 0.08, 0.10 * Math.sin(k * PI)));
  a.ikBraco('D', alvo, V(-0.7, -0.9, 0.3));
  a.ikBraco('E', cabW(0.34, 0.95, -0.12, ycab), V(0.3, -1, 0));
  a.rosto({ expressao: 'medo', forca: medo, olhar: [0, 0] }); a.atualizarRosto();
  return alvo;
}

// sentada no chão encostada no fundo da cabine, braços em volta dos joelhos
export function poseSentada(a, t, { x = -0.40, z = 0.0, ycab = Y_CAB, giro = PI / 2, cansaco = 0.6, cabeca = 0.0 } = {}) {
  colocarCab(a, x, z, giro, ycab);
  a.anim('Parado', t * 0.2);
  a.sentarChao();
  a.grupo.updateMatrixWorld(true);
  const j = a.pos('CanelaE'), j2 = a.pos('CanelaD');
  a.ikBraco('E', j.clone().add(V(0.02, 0.10, 0.06)), V(0, 0, -1));
  a.ikBraco('D', j2.clone().add(V(0.02, 0.10, -0.06)), V(0, 0, 1));
  a.somar('Cabeca', 0.25 * cansaco + cabeca, 0, 0);
  a.rosto({ expressao: 'triste', forca: 0.7 * cansaco + 0.2, olhar: [0, 0.1] }); a.atualizarRosto();
  return a;
}
