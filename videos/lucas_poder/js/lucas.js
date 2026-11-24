// LUCAS: o menino do elenco (Théo) repintado. Aos 10 anos, no carro, moletom vermelho; aos 12, em casa, moletom cinza desbotado e pele pálida,
// com pernas e braços atrofiados (exceção à regra "proibido deformar", pedida pelo dono só neste vídeo): coxas, canelas e braços afinados no esqueleto.
import * as THREE from 'three';
import { Ator } from './atores.js';
import { clamp, lerp, ruido } from './util.js';
import { Q } from './motor.js';

export async function criarLucas({ idade = 12, atrofia = 1 } = {}) {
  const a = await Ator.criar('teo', { escala: idade >= 12 ? 1.13 : 1.07 });       // Théo tem 1,27 m: Lucas fica com ~1,36 m aos 10 e ~1,44 m aos 12
  const pele = idade >= 12 ? '#e3c0a6' : '#c99572';
  a.pintar(idade >= 12
    ? { M_pele: pele, M_moletom: '#8a8f96', M_mol_barra: '#767b82', M_mol_bolso: '#80858c', M_cordao: '#d9d9d9', M_bermuda: '#2f3640', M_bermuda_barra: '#252b33', M_meia: pele, M_meia_faixa: pele, M_cabelo: '#2b2018' }
    : { M_pele: pele, M_moletom: '#b2262c', M_mol_barra: '#8f1d22', M_mol_bolso: '#a42228', M_cordao: '#f0f0f0', M_bermuda: '#3b4a5c', M_meia: '#f2f2f2', M_meia_faixa: '#c23a3a', M_cabelo: '#2b2018' });
  // a mochila só aparece quando o roteiro pede (ela flutua atrás dele aos 12)
  a.obj.traverse(o => { if (!o.isMesh) return; const arr = Array.isArray(o.material) ? o.material : [o.material]; for (const m of arr) if (/mochila/.test(m.name)) m.visible = false; });
  a.atrofia = idade >= 12 ? atrofia : 0;
  a.idade = idade;
  return a;
}

/** aplica a magreza depois da pose (o clipe zera as escalas): afina coxa/canela/braço/antebraço sem encolher o comprimento e devolve o pé ao tamanho normal */
export function afinar(a) {
  const k = a.atrofia || 0; if (!k) return;
  const coxa = lerp(1, 0.56, k), canela = lerp(1, 0.62, k), braco = lerp(1, 0.70, k), ante = lerp(1, 0.72, k);
  for (const l of 'ED') {
    a.ossos['Coxa' + l].scale.set(coxa, 1, coxa);
    a.ossos['Canela' + l].scale.set(canela / coxa, 1, canela / coxa);
    a.ossos['Pe' + l].scale.set(1 / canela, 1, 1 / canela);
    a.ossos['Braco' + l].scale.set(braco, 1, braco);
    a.ossos['Antebraco' + l].scale.set(ante / braco, 1, ante / braco);
    a.ossos['Mao' + l].scale.set(1 / ante, 1, 1 / ante);
  }
}

/**
 * Lucas no chão, de bruços, tentando se erguer nos braços (o estado do gancho).
 * esforco 0..1: quanto ele consegue levantar o peito; treme 0..1: tremor dos braços; t: tempo (s); cansa: cabeça cai
 */
export function noChao(a, { x = 0, z = 0, yaw = 0, esforco = 0.6, treme = 1, t = 0, cansa = 0 } = {}) {
  a.grupo.visible = true;
  a.anim('Parado', 0);
  const tr = treme * (0.6 * ruido(t * 14, 3) + 0.4 * ruido(t * 23, 7));
  const ergue = clamp(esforco + 0.10 * tr) * (1 - 0.6 * cansa);
  // tronco: coluna em extensão (peito sobe), quadril no chão
  a.somar('Coluna', -0.36 * ergue, 0, 0.02 * tr); a.somar('Coluna2', -0.30 * ergue, 0, 0); a.somar('Peito', -0.24 * ergue, 0, 0);
  a.somar('Pescoco', -0.30 * ergue + 0.12 * cansa - 0.10, 0, 0); a.somar('Cabeca', -0.38 * ergue + 0.16 * cansa - 0.12, 0.06 * tr, 0.04 * tr);
  // o tronco sobe girando pelo quadril (L rad); as coxas giram de volta para as pernas ficarem no chão
  const L = 0.34 * ergue, sL = +(Q.get('sl') || 1);
  for (const l of 'ED') { const s = l === 'E' ? 1 : -1; a.somar('Coxa' + l, sL * L + 0.04, 0, s * 0.06); a.somar('Canela' + l, 0.10, 0, 0); a.somar('Pe' + l, 0.25, 0, 0); }
  const th = Math.PI / 2 - L, hp = a.ossos['Quadril'].position.y * a.escala;
  a.grupo.rotation.set(th, yaw, 0, 'YXZ');
  a.grupo.position.set(x, 0.085 - hp * Math.cos(th), z - hp * Math.sin(th) + hp);
  a.grupo.updateMatrixWorld(true);
  // mãos espalmadas no chão, à frente e ao lado dos ombros (IK), cotovelos para fora
  const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), lado = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  for (const l of 'ED') {
    const s = l === 'E' ? 1 : -1, ombro = a.pos('Braco' + l);
    const alvo = ombro.clone().addScaledVector(lado, s * 0.07 * a.escala).addScaledVector(fwd, 0.02 * a.escala); alvo.y = 0.03 + 0.012 * tr;
    a.ikBraco(l, alvo, lado.clone().multiplyScalar(s).add(new THREE.Vector3(0, 0.4, 0)));
    const mr = (Q.get('mao') || '0,1.57,0').split(',').map(Number); a.osso('Mao' + l, mr[0], s * mr[1], s * mr[2]);
  }
  afinar(a);
  a.rosto({ expressao: Q.get('expr') || 'triste', forca: 0.7 + 0.3 * ergue, boca: 0, piscar: 0.15 * cansa, olhar: [0.05, 0.45] });
  a.atualizarRosto(); a.grupo.updateMatrixWorld(true);
  return a;
}
