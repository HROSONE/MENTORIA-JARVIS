// Yoro de manhã: rua de cidade pequena depois da tempestade, casas coloridas, palmeiras, montanhas ao fundo, peixes por todo lado, cestas e gente do elenco.
import * as THREE from 'three';
import { Kit } from '../../biblioteca3d/cidade/kit.js';
import { mulberry32, lerp } from './util.js';
import { criarCardume } from './cardume.js';
import { detalharKit, detalhar, criarReflexoPocas } from './detalhe.js';
import { linhaDeFios, bandeirolas, faixa, criarGaivotas, canteiro } from './props.js';
import { clonarGLB } from './motor.js';

export const YORO = { esc: 0.62, meia: 6 * 0.62 };           // rua estreita: o ladrilho de 12 m é comprimido em x
export async function construirYoro(g, { env = null, nPeixes = 150 } = {}) {
  const kit = await Kit.carregar(new URL('../../biblioteca3d/cidade/', import.meta.url).href, { detalhe: false });
  const R = mulberry32(21), obj = [];
  for (const gz of [-3, -2, -1, 0, 1, 2]) { const t = await kit.ladrilho('rua-reta', 0, gz, 0); t.scale.x = YORO.esc; obj.push(t); }       // rua estreita de cidade pequena
  // casas de frente para a rua (porta do kit em +Z; girar +90 leva a porta para +X)
  const casas = [['casa-colonial', -1, -30], ['casa-simples', -1, -18], ['casa-sobrado', -1, -6], ['casa-colonial', -1, 6], ['casa-simples', -1, 18],
                 ['casa-simples', 1, -30], ['casa-colonial', 1, -18], ['casa-simples', 1, -6], ['casa-sobrado', 1, 6], ['predio-loja-3', 1, 20]];
  for (const [nome, lado, z] of casas) {
    const o = await kit.peca(nome), larg = nome === 'predio-loja-3' ? 5.6 : 5.0;
    o.position.set(lado * (YORO.meia + larg + 0.35), 0.15, z); o.rotation.y = lado < 0 ? Math.PI / 2 : -Math.PI / 2; kit.luzEstado(o, false); obj.push(o);
  }
  for (const [x, z] of [[-4.0, -22], [-4.1, -9], [4.1, -12], [4.0, 3], [-4.1, 14], [4.1, 16], [-4.0, 27], [4.1, -26], [-4.1, 3]]) { const p = await kit.peca('arvore-palmeira'); p.position.set(x, 0.15, z); p.rotation.y = R() * 6.28; p.scale.setScalar(0.9 + 0.3 * R()); obj.push(p); }
  // postes de energia nos dois lados (fios ao longo da rua), bandeirolas e faixa de festa atravessando a rua, canteiros de flores na frente das casas
  const pL = [], pR = []; for (const z of [-20, -6, 8, 22]) { for (const [lado, arr] of [[-1, pL], [1, pR]]) { const p = await kit.peca('poste-energia'); p.position.set(lado * (YORO.meia - 0.2), 0.15, z); p.rotation.y = Math.PI / 2; g.add(p); arr.push([lado * (YORO.meia - 0.2), z]); } }
  linhaDeFios(g, pL, 8.0, { x: [-0.6, 0, 0.6], sag: 0.5 }); linhaDeFios(g, pR, 8.0, { x: [-0.6, 0, 0.6], sag: 0.5 });
  const flags = [bandeirolas(g, [-(YORO.meia - 0.2), 5.6, 3.0], [YORO.meia - 0.2, 5.7, 3.0], { n: 30, sag: 0.8, semente: 3 }), bandeirolas(g, [-(YORO.meia - 0.2), 5.7, 13.0], [YORO.meia - 0.2, 5.6, 13.0], { n: 30, sag: 0.8, semente: 6 })];
  const faixaFesta = faixa(g, { pos: [0, 4.6, 8.5], larg: 5.4, alt: 1.15, yaw: Math.PI });
  for (const lado of [-1, 1]) for (const z of [-24, -12, 0, 12, 24]) canteiro(g, { x0: lado * (YORO.meia + 0.4), x1: lado * (YORO.meia + 1.9), z0: z - 2.2, z1: z + 2.2, y: 0.12, n: 26, semente: 7 + Math.floor(z) + (lado > 0 ? 3 : 0) });
  const gaivotas = criarGaivotas(g, 8, { centro: [0, 8, 6], raio: 9, semente: 11 });
  try { const van = await clonarGLB(new URL('../../biblioteca3d/veiculos/delivery.glb', import.meta.url).href); van.scale.setScalar(1.7); van.position.set(-2.4, 0.0, 17); van.rotation.y = 0; van.traverse(m => { if (m.isMesh) m.castShadow = m.receiveShadow = true; }); g.add(van); } catch (e) { console.warn('van', e.message); }
  const placa = await kit.peca('placa-rua-hryz'); placa.position.set(3.5, 0.15, 7); placa.rotation.y = -Math.PI / 2; obj.push(placa);
  for (const o of obj) g.add(o);
  g.traverse(m => { if (!m.isMesh) return; if (m.name === 'Asfalto') m.material = new THREE.MeshStandardMaterial({ color: 0x75665a, roughness: 0.45, metalness: 0.08, envMap: env, envMapIntensity: 0.3 }); });
  detalharKit(g);
  const reflexo = criarReflexoPocas({ largura: YORO.meia * 2, comprimento: 74, centro: [0, 0, -6], molhado: 0.22, intens: 0.9 }); g.add(reflexo);
  // montanhas ao fundo (cristas baixas, verdes e roxas na névoa)
  const mont = new THREE.Group();
  for (let k = 0; k < 3; k++) {
    const w = 260, seg = 90, geo = new THREE.PlaneGeometry(w, 40, seg, 1), P = geo.attributes.position; const cor = [0x3c7a52, 0x4f6fb0, 0x7a6bb0][k];
    for (let i = 0; i <= seg; i++) { const x = P.getX(i), top = 14 + 16 * Math.sin(x * 0.045 + k * 2.1) + 8 * Math.sin(x * 0.11 + k) + 5 * Math.sin(x * 0.27 + k * 4); P.setY(i, top); P.setY(i + seg + 1, -2); }
    geo.computeVertexNormals(); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cor, fog: true, side: THREE.DoubleSide })); m.position.set(0, 0, 105 + k * 40); mont.add(m);
  }
  g.add(mont);
  // chão de terra e capim até as montanhas
  const solo = new THREE.Mesh(new THREE.PlaneGeometry(600, 700), detalhar(new THREE.MeshStandardMaterial({ color: 0x6f9a4c, roughness: 1 }), 'terra')); solo.rotation.x = -Math.PI / 2; solo.position.set(0, -0.03, 120); solo.receiveShadow = true; g.add(solo);
  // peixes espalhados (deitados de lado); alguns se debatem
  const card = criarCardume(g, nPeixes, { env });
  const F = [];
  for (let i = 0; i < nPeixes; i++) {
    const ex = R() < 0.2, x = ex ? (R() < 0.5 ? -1 : 1) * lerp(YORO.meia - 1.3, YORO.meia - 0.2, R()) : lerp(-YORO.meia + 1.5, YORO.meia - 1.5, R()), z = lerp(-8, 24, Math.pow(R(), 0.9)), y = ex ? 0.19 : 0.04;
    F.push({ x, y, z, yaw: R() * 6.283, e: lerp(1.0, 1.5, R()), fl: R() < 0.22, per: lerp(0.5, 1.3, R()), amp: lerp(0.03, 0.07, R()), fase: R() * 6.28 });
  }
  const atualizar = t => {
    F.forEach((f, i) => {
      let y = f.y, roll = -Math.PI / 2, yaw = f.yaw;
      if (f.fl) { const s = Math.sin(t * 6.283 / f.per + f.fase), a = Math.max(0, s); y += f.amp * a * a; roll += 0.5 * Math.sin(t * 6.283 / f.per * 2 + f.fase); yaw += 0.25 * Math.sin(t * 3.1 + f.fase); }
      card.set(i, f.x, y, f.z, yaw, roll, 0, f.e);
    });
    card.fim();
  };
  const extra = t => { for (const f of flags) f.atualizar(t); faixaFesta.atualizar(t); gaivotas.atualizar(t); };
  return { kit, card, atualizar: t => { atualizar(t); extra(t); }, objetos: obj, peixes: F, reflexo };
}

// cesta de vime (tronco de cone aberto) com peixes por cima; devolve o grupo
export function criarCesta({ env = null, cor = 0xb07a3a } = {}) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.9, side: THREE.DoubleSide });
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.19, 0.24, 20, 1, true), mat); corpo.position.y = 0.12; corpo.castShadow = true; g.add(corpo);
  const fundo = new THREE.Mesh(new THREE.CircleGeometry(0.19, 20), mat); fundo.rotation.x = -Math.PI / 2; fundo.position.y = 0.01; g.add(fundo);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.012, 6, 28), new THREE.MeshStandardMaterial({ color: 0x8a5a26, roughness: 0.8 })); aro.rotation.x = Math.PI / 2; aro.position.y = 0.24; g.add(aro);
  const alca = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.012, 6, 20, Math.PI), new THREE.MeshStandardMaterial({ color: 0x8a5a26, roughness: 0.8 })); alca.position.y = 0.24; g.add(alca);
  // listras do vime
  for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.262 - k * 0.014 - 0.002, 0.262 - k * 0.014 - 0.002, 0.012, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x7a4c1e, roughness: 0.9, side: THREE.DoubleSide })); f.position.y = 0.04 + k * 0.055; g.add(f); }
  return g;
}
