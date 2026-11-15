// Linha do tempo: constrói os mundos, os atores e comanda cada plano em função do tempo.
//   Dois relógios: t (filme, câmera e montagem) e tau (física: chuva, peixe, tecido, mulher). Na câmera lenta tau anda a 2,5% de t.
import * as THREE from 'three';
import { scene, cam, mundos, Rajada } from './motor.js';
import { clamp, lerp, suave, inv, ruido, mulberry32, chaves } from './util.js';
import { S, V, plano, acharPlano, mostrar, luzes, camara, mapaAmbiente, spot, ponto, hemi, sol, lerpV } from './base.js';
import { construirRua } from './rua.js';
import { Ator } from './atores.js';
import { criarPeixe } from './peixe.js';
import { criarGuardaChuva } from './guardachuva.js';
import { criarChuva, criarOndas } from './chuva.js';
import { criarCeu } from './ceu.js';
import { construirYoro, criarCesta } from './yoro.js';
import { criarCardume, chuvaDePeixes } from './cardume.js';
import { criarIgreja, criarPraca } from './igreja.js';
import { brilho } from './motor.js';
import { construirMar, construirCorte } from './ciencia.js';

export const X = {};
if (typeof window !== 'undefined') window.__X = X;
const GRAV = V(0, -9.8, 0);
const easeIO = u => suave(clamp(u));

// ---------------------------------------------------------------- relógio da física (câmera lenta tipo "bullet time")
const T_PULO = 0.017;                          // no quadro 0 o peixe já está com meio corpo fora do tecido
const BT = { fim: 1.8, rampa: 1.8, lento: 0.025 };
const rate = t => t < BT.fim ? BT.lento : t < BT.fim + BT.rampa ? lerp(BT.lento, 1, suave((t - BT.fim) / BT.rampa)) : 1;
const TAB = []; { let a = T_PULO; const dt = 1 / 600; for (let i = 0; i <= 600 * 12; i++) { TAB.push(a); a += rate(i * dt) * dt; } }
export const tauDe = t => { const x = clamp(t, 0, 12) * 600, i = Math.min(TAB.length - 2, Math.floor(x)); return lerp(TAB[i], TAB[i + 1], x - i); };

// orienta um objeto: eixo +x do objeto -> n (nariz), dorso o mais próximo de `ref`, depois gira `roll` ao redor do eixo
function orientar(g, n, roll = 0, ref = V(0, 1, 0)) {
  const x = n.clone().normalize();
  let y = ref.clone().sub(x.clone().multiplyScalar(ref.dot(x)));
  if (y.lengthSq() < 1e-6) y = V(0, 0, 1).sub(x.clone().multiplyScalar(x.z));
  y.normalize().applyAxisAngle(x, roll);
  const z = x.clone().cross(y);
  g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

// ---------------------------------------------------------------- construção
export async function construirTudo() {
  X.env = mapaAmbiente('#16358f', '#3a63c8', '#ff9c55');
  X.rua = await construirRua(mundos.R, { env: X.env });
  // mulher: capa de chuva amarela, botas vermelhas
  X.mae = await Ator.criar('mae');
  X.mae.pintar({ M_vestido: '#ffc414', M_sapato: '#d4202c', M_meia: '#2a2f3a' });
  X.mae.obj.traverse(o => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(k => { if (k.name === 'M_vestido') { k.envMap = X.env; k.envMapIntensity = 0.9; k.roughness = 0.35; } }); });
  mundos.R.add(X.mae.grupo);
  X.guarda = criarGuardaChuva({ R: 0.56, H: 0.26, env: X.env });
  mundos.R.add(X.guarda.grupo);
  X.peixe = criarPeixe(1.2, { env: X.env });
  mundos.R.add(X.peixe.grupo);
  X.chuva = criarChuva(mundos.R, { n: 9000, caixa: [11, 7.5, 11] });
  X.ondas = criarOndas(mundos.R, { n: 160, area: [9, 9], centro: [0, 1] });
  X.ceuR = criarCeu({ topo: '#0b1540', meio: '#1c2a6a', horiz: '#3a3f86', nuvens: 0.5, nuvemCor: '#1a2150', nuvemLuz: '#4a4f9a', luzK: 0.25, sol: [0.2, 0.2, -1] }); scene.add(X.ceuR.mesh);
  await construirManha();
  await construirLenda();
  await construirCiencia();
  montarPlanos();
  return S;
}

// ---------------------------------------------------------------- Yoro de manhã (mundo D): rua com peixes, gente do elenco, placar de peixes
async function construirManha() {
  const g = mundos.D, envD = mapaAmbiente('#7fa0e8', '#f0b8c8', '#ffc890');
  X.envD = envD;
  X.yoro = await construirYoro(g, { env: envD, nPeixes: 420 });
  X.ceuD = criarCeu({ topo: '#3d6ad8', meio: '#f2a6c8', horiz: '#ffd098', sol: [-0.5, 0.18, -1], solCor: '#ffd9a8', nuvens: 0.8, nuvemCor: '#7a5fb0', nuvemLuz: '#ffc48e', luzK: 0.5 }); scene.add(X.ceuD.mesh);
  const cria = async (nome, cor) => { const a = await Ator.criar(nome); if (cor) a.pintar(cor); g.add(a.grupo); return a; };
  X.povo = {
    teo: await cria('teo'), davi: await cria('davi'), lia: await cria('lia'), nina: await cria('nina'),
    velha: await cria('velha'), homem: await cria('homem', { M_camisa: '#e8553b', M_camisa_manga: '#e8553b', M_camisa_gola: '#c8402a' }), jovem: await cria('jovem_b'), faxi: await cria('faxineira'),
  };
  X.cestas = [[-0.2, 3.7], [-3.0, 7.4], [3.4, 6.6], [2.4, 1.8], [-2.2, 10.6]].map(([x, z]) => { const c = criarCesta(); c.position.set(x, 0.0, z); c.rotation.y = x; g.add(c); return c; });
  // peixes nas cestas
  X.cestaPeixes = criarCardume(g, 30, { env: envD });
  const rr = mulberry32(8);
  X.cestaPeixes.pos = [];
  for (let i = 0; i < 30; i++) { const c = X.cestas[i % 5]; X.cestaPeixes.pos.push([c.position.x + (rr() - 0.5) * 0.3, 0.24 + 0.03 * Math.floor(i / 5) * rr(), c.position.z + (rr() - 0.5) * 0.3, rr() * 6.28, (rr() - 0.5) * 0.8]); }
  // peixe vivo na mão do Théo
  X.peixeTeo = criarPeixe(1.15, { env: envD }); g.add(X.peixeTeo.grupo);
  // placar de peixes (diegético): quadro-negro num cavalete
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 384; X.placarCv = cv; X.placarTex = new THREE.CanvasTexture(cv); X.placarTex.colorSpace = THREE.SRGBColorSpace; X.placarTex.anisotropy = 8;
  const placa = new THREE.Group(), quadro = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.68, 0.04), [0x6a4320, 0x6a4320, 0x6a4320, 0x6a4320, 0x6a4320, 0x6a4320].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 })));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.6), new THREE.MeshStandardMaterial({ map: X.placarTex, roughness: 0.8, emissive: 0x222222, emissiveMap: X.placarTex, emissiveIntensity: 0.5 })); face.position.z = 0.025; quadro.position.y = 1.0; face.position.y = 1.0;
  placa.add(quadro, face); for (const sx of [-0.35, 0.35]) { const perna = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.05, 0.05), new THREE.MeshStandardMaterial({ color: 0x6a4320 })); perna.position.set(sx, 0.52, -0.1); perna.rotation.x = 0.12; placa.add(perna); }
  placa.position.set(1.5, 0, 1.2); placa.rotation.y = Math.PI + 0.25; g.add(placa); X.placar = placa;
}
function desenharPlacar(n) {
  const c = X.placarCv.getContext('2d'); c.fillStyle = '#1d3a30'; c.fillRect(0, 0, 512, 384); c.strokeStyle = '#e8e2cc'; c.lineWidth = 8; c.strokeRect(10, 10, 492, 364);
  c.fillStyle = '#f4f0dc'; c.font = 'bold 74px Arial, sans-serif'; c.textAlign = 'center'; c.fillText('PEIXES', 256, 112);
  c.fillStyle = '#ffd24a'; c.font = 'bold 190px Arial, sans-serif'; c.fillText(String(n), 256, 300); X.placarTex.needsUpdate = true;
}

// ---------------------------------------------------------------- hipóteses (mundo C): tromba-d'água no mar; rio subterrâneo
async function construirCiencia() {
  const g = mundos.C; X.envC = mapaAmbiente('#14205a', '#5a3a8a', '#ff9060');
  X.mar = construirMar(g, { env: X.envC });
  X.corte = await construirCorte(g, { env: X.envC, kit: X.yoro.kit }); X.corte.grupo.position.x = 600;
  X.ceuM = criarCeu({ topo: '#12184e', meio: '#6a3f8a', horiz: '#ff8a5a', sol: [-0.6, 0.1, -1], solCor: '#ffb070', nuvens: 0.85, nuvemCor: '#2a2060', nuvemLuz: '#ff9a70', luzK: 0.9 }); scene.add(X.ceuM.mesh);
  X.ceuC = criarCeu({ topo: '#5a74b8', meio: '#9aa4cc', horiz: '#e8c8b0', sol: [-0.4, 0.3, -1], solCor: '#ffe0b0', nuvens: 0.9, nuvemCor: '#7a7a9a', nuvemLuz: '#d8c8c0', luzK: 0.4 }); scene.add(X.ceuC.mesh);
}

// ---------------------------------------------------------------- A lenda do padre (mundo L): noite de tempestade, igrejinha, padre ajoelhado, peixes caindo
async function construirLenda() {
  const g = mundos.L, env = mapaAmbiente('#16206a', '#33398f', '#ff9a50'); X.envL = env;
  const praca = criarPraca(); praca.children[0].material.envMap = env; praca.children[0].material.envMapIntensity = 0.9; g.add(praca);
  X.igreja = criarIgreja(); X.igreja.position.set(0, 0, -12); g.add(X.igreja);
  X.ceuL = criarCeu({ topo: '#050a22', meio: '#141c58', horiz: '#3a3a86', sol: [0, 0.3, -1], nuvens: 0.9, nuvemCor: '#10163e', nuvemLuz: '#3a4a9a', luzK: 0.2 }); scene.add(X.ceuL.mesh);
  X.padre = await Ator.criar('homem'); X.padre.pintar({ M_camisa: '#15151a', M_camisa_gola: '#f6f4ee', M_camisa_manga: '#15151a', M_jeans_plano: '#111116', M_jeans: '#15151a', M_jeans_punho: '#111116', M_tenis: '#0e0e10', M_tenis_det: '#222226' });
  g.add(X.padre.grupo);
  // cruz peitoral dourada
  const cruz = new THREE.Group(), ouro = new THREE.MeshStandardMaterial({ color: 0xe0b040, roughness: 0.3, metalness: 0.8 }); const braco = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.008), ouro); braco.position.set(0, 0.02, 0); cruz.add(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.09, 0.008), ouro), braco);
  X.cruzPadre = cruz; g.add(cruz);
  // lampião no chão (brilho + luz pontual compartilhada)
  X.lampiao = new THREE.Group(); const vidro = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 12), new THREE.MeshStandardMaterial({ color: 0xffd58a, emissive: 0xffa030, emissiveIntensity: 2.2, transparent: true, opacity: 0.95 })); vidro.position.y = 0.2;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.05, 12), new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.6 })); const topo = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.07, 12), new THREE.MeshStandardMaterial({ color: 0x2a2018 })); topo.position.y = 0.34;
  const bri = brilho('255,190,110', 1.6, 0.9); bri.position.y = 0.22; X.lampiao.add(vidro, base, topo, bri); X.lampiao.position.set(0.7, 0.025, 0.55); g.add(X.lampiao);
  X.cardumeL = criarCardume(g, 230, { env });
  X.cairL = chuvaDePeixes(X.cardumeL, { t0: 3.4, dur: 5.2, area: [-4.2, 4.2, -2.6, 5.4], alturas: [14, 28], chao: 0.04, semente: 5, vento: [0.5, 0.15], esc: [1.0, 1.45] });
  X.chuvaL = criarChuva(g, { n: 8000, caixa: [12, 9, 12] });
  X.ondasL = criarOndas(g, { n: 150, area: [10, 10], centro: [0, 1] });
}
function poseReza(a, t, olharPara) {
  a.colocar(0, 0, 0.3, Math.PI * 0.04); a.anim('Parado', t, {});
  const q = a.ossos['Quadril']; q.position.y = 0.5 / a.escala;
  for (const l of 'ED') { a.osso('Coxa' + l, -0.1, 0, 0); a.osso('Canela' + l, 1.6, 0, 0); a.osso('Pe' + l, 0.9, 0, 0); a.osso('Ponteira' + l, 0, 0, 0); }
  a.somar('Coluna', -0.04 + 0.012 * Math.sin(t * 1.3), 0, 0);
  a.grupo.updateMatrixWorld(true);
  a.ikBraco('E', loc2w(a, 0.035, 0.98, 0.26), V(0.6, -1, 0)); a.ikBraco('D', loc2w(a, -0.035, 0.98, 0.26), V(-0.6, -1, 0));
  a.grupo.updateMatrixWorld(true);
  a.rosto({ expressao: 'triste', forca: 0.55, piscar: 0 }); a.olhar(olharPara, { forca: 1.0, max: 1.2 }); a.grupo.updateMatrixWorld(true);
  // cruz no peito
  const pt = a.pos('Peito'), fw = V(0, 0, 1).applyQuaternion(a.grupo.getWorldQuaternion(new THREE.Quaternion())); X.cruzPadre.position.copy(pt).add(fw.multiplyScalar(0.17)).add(V(0, -0.05, 0)); X.cruzPadre.quaternion.copy(a.grupo.getWorldQuaternion(new THREE.Quaternion()));
}

// ---------------------------------------------------------------- a mulher (caminhando com guarda-chuva) e o guarda-chuva
const MAE = { x: -0.55, z: -0.95, vel: 0.66, rit: 0.55, giro: 0 };         // posição em tau = 0 (o peixe fura nesse instante); passeio calmo
const TILT = { frente: 0.08, lado: -0.13 };                                  // inclinação do guarda-chuva (topo para a frente, como quem anda na chuva)
// mistura de duas poses de clipes (a, b = [clipe, tempo]); k 0..1
function capturarOssos(m) { const o = {}; for (const n in m.ossos) { const b = m.ossos[n]; o[n] = [b.quaternion.clone(), b.position.clone()]; } return o; }
function misturarPoses(m, a, b, k) {
  m.anim(a[0], a[1], {}); const A = capturarOssos(m);
  if (k <= 0.001) return;
  m.anim(b[0], b[1], { laco: false }); const B = capturarOssos(m);
  for (const n in A) { const bone = m.ossos[n]; bone.quaternion.copy(A[n][0]).slerp(B[n][0], k); bone.position.copy(A[n][1]).lerp(B[n][1], k); }
}
// pose completa da mulher em tau: caminhada -> susto (mãos ao alto); braço direito segura o guarda-chuva; opc.olhar = ponto do mundo; opc.k* = pesos
function poseMae(tau, { olhar = null, kolhar = 0, ksusto = 0, piscar = 0 } = {}) {
  const m = X.mae, g = X.guarda, tp = X.tauParou ?? 99;
  const tw = Math.min(tau, tp), mundoZ = MAE.z + MAE.vel * tw;
  m.colocar(MAE.x, 0, mundoZ, MAE.giro);
  const kp = suave(inv(tp, tp + 0.2, tau));                                   // 0 andando, 1 parada e assustada
  misturarPoses(m, ['Andar', tw * MAE.rit], ['Assustado', Math.max(0, tau - tp)], kp);
  m.rosto({ expressao: ksusto > 0.02 ? 'surpresa' : 'neutro', forca: Math.max(ksusto, 0.001), piscar });
  m.grupo.updateMatrixWorld(true);
  const bob = m.ossos['Quadril'].getWorldPosition(V()).y;
  const loc = m.grupo.matrixWorld;
  const alvo = V(-0.17, 1.12, 0.30).applyMatrix4(loc); alvo.y += (bob - 0.88) * 0.8;
  m.ikBraco('D', alvo, V(-0.25, -1, -0.45));
  m.grupo.updateMatrixWorld(true);
  if (olhar && kolhar > 0.001) m.olhar(olhar, { forca: kolhar, max: 1.2 });
  m.grupo.updateMatrixWorld(true);
  const mao = m.pos('MaoD');
  // guarda-chuva: o ponto de empunhadura (local y = -0.74) fica na mão
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(TILT.frente + (X.balanco || 0) * 0.07, 0, TILT.lado, 'XYZ'));
  g.grupo.quaternion.copy(q);
  g.grupo.position.copy(mao).add(V(0, 0.74, 0).applyQuaternion(q));
  g.grupo.updateMatrixWorld(true);
  return mao;
}

// ---------------------------------------------------------------- o peixe: trajetória, furo no tecido, queda, quique no chão
const CAM0 = V(-0.55, 2.05, 3.0);
const PEIXE = { dir: V(-0.07, -0.99, 0.12).normalize(), v0: 9.2, alvoX: MAE.x - 0.02, alvoZ: MAE.z + 0.62, esc: 1.2 };   // dir: direção do nariz; alvoX/Z: onde o peixe fura a copa (mundo)
X.chao = { x: 0, z: 0, tauPouso: 0.27, y: 0.034 };
const DN = 0.139;                                                         // nariz do peixe (m, escala 1)
function iniciarPeixe() {
  const g = X.guarda; poseMae(0);
  const mi = g.grupo.matrixWorld.clone().invert();
  const f = y => { const p = V(PEIXE.alvoX, y, PEIXE.alvoZ).applyMatrix4(mi); return p.y - g.alturaCopa(p.x, p.z); };
  let a = 1.0, b = 3.2;
  for (let i = 0; i < 50; i++) { const c = (a + b) / 2; (f(a) * f(c) <= 0) ? b = c : a = c; }
  const Pw = V(PEIXE.alvoX, (a + b) / 2, PEIXE.alvoZ), Pl = Pw.clone().applyMatrix4(mi);
  g.P[0] = Pl.x; g.P[1] = Pl.z;
  const n0 = PEIXE.dir, v0 = n0.clone().multiplyScalar(PEIXE.v0), vB = v0.clone().multiplyScalar(0.84), C0 = Pw.clone().sub(n0.clone().multiplyScalar(DN * PEIXE.esc));
  const centro = tau => tau < 0 ? C0.clone().add(v0.clone().multiplyScalar(tau)).add(GRAV.clone().multiplyScalar(0.5 * tau * tau)) : C0.clone().add(vB.clone().multiplyScalar(tau)).add(GRAV.clone().multiplyScalar(0.5 * tau * tau));
  let tg = 0.3; for (let tau = 0.01; tau < 1; tau += 0.0005) if (centro(tau).y <= X.chao.y + 0.02) { tg = tau; break; }
  const cg = centro(tg);
  // roll inicial: o flanco do peixe (eixo lateral) olha para a câmera do quadro 0
  const cd = CAM0.clone().sub(Pw).normalize(); let melhor = 0, mv = -9;
  for (let r = 0; r < 6.283; r += 0.05) { const t = new THREE.Object3D(); orientar(t, n0, r); const z = V(0, 0, 1).applyQuaternion(t.quaternion); if (z.dot(cd) > mv) { mv = z.dot(cd); melhor = r; } }
  X.furo = { Pw, Pl, C0, centro, n0, v0, vB, roll0: melhor };
  X.chao = { x: cg.x, z: cg.z, tauPouso: tg, y: X.chao.y, tauParou: tg + 0.22 };
  X.tauParou = tg + 0.2;
  return X.furo;
}

// estado do peixe em tau: posição, orientação e ondulação
function peixeEm(tau) {
  const F = X.furo, P = X.peixe, tg = X.chao.tauPouso;
  const esc = PEIXE.esc, g = P.grupo;
  const horiz = V(F.n0.x, 0, F.n0.z).normalize();
  if (tau < tg) {
    const c = F.centro(tau);
    const k = suave(inv(0.04, tg, tau)), qk = new THREE.Quaternion().slerp(new THREE.Quaternion().setFromUnitVectors(F.n0, horiz), k);
    const n = F.n0.clone().applyQuaternion(qk);
    let rl = F.roll0; while (rl > 0.5) rl -= 2 * Math.PI;                                        // até -pi/2 pelo caminho curto
    const roll = lerp(rl, -Math.PI / 2, k) + 0.25 * Math.sin(tau * 38) * (1 - k);
    g.position.copy(c); orientar(g, n, roll);
    P.ondular(tau * 55 + 1.0, 0.42, 0.25 * Math.sin(tau * 21));
    return { solo: false, c };
  }
  // no chão: saltos que diminuem, girando um pouco a cada salto; depois só bate a cauda
  const L = tau - tg;
  let y = 0, yaw = 0, roll = -Math.PI / 2, dx = 0, dz = 0, t0 = 0, k = 0, amp = 0.5, dobra = 0;
  const alt0 = 0.20, durs = [], hs = [];
  for (let i = 0; i < 9; i++) { durs.push(0.36 * Math.pow(0.78, i)); hs.push(alt0 * Math.pow(0.52, i)); }
  let acc = 0, achou = false;
  for (let i = 0; i < 9; i++) {
    const d = durs[i];
    if (L < acc + d) { const u = (L - acc) / d; y = hs[i] * 4 * u * (1 - u); roll = -Math.PI / 2 + (i % 2 ? -1 : 1) * 1.1 * Math.sin(Math.PI * u) * (1 - i * 0.08); achou = true; k = i; break; }
    acc += d; yaw += (i % 2 ? -0.5 : 0.7); dx += 0.06 * Math.pow(0.8, i); 
  }
  if (!achou) { k = 9; yaw += 0; }
  const Lr = Math.max(0, L - acc);
  // depois dos saltos: arqueia e bate a cauda de vez em quando (decai)
  const arco = achou ? 0 : Math.max(0, Math.sin(Lr * 9)) * 0.9 * Math.exp(-Lr * 0.7);
  const slap = achou ? 1 : Math.exp(-Lr * 0.5);
  const ang = Math.atan2(horiz.x, horiz.z) + yaw;
  const dir = V(Math.sin(ang), 0, Math.cos(ang));
  const c = V(X.chao.x, X.chao.y + y, X.chao.z).add(V(Math.sin(Math.atan2(horiz.x, horiz.z)), 0, Math.cos(Math.atan2(horiz.x, horiz.z))).multiplyScalar(dx));
  g.position.copy(c); orientar(g, dir, roll);
  P.ondular(L * 30, achou ? 0.5 * Math.exp(-L * 0.8) : 0.15 * slap, achou ? 0.45 + 0.5 * Math.sin(L * 25) : arco);
  return { solo: true, c, L };
}

// tecido: afundamento (m), buraco (raio), abas (m) e balanço
function tecidoEm(tau) {
  const tT = 0.006, tS = 0.043;                                         // instante do rasgo e saída da cauda
  const dent = tau < tT ? 0.06 * suave(inv(-0.004, tT, tau)) : 0.012 * Math.exp(-(tau - tT) / 0.05);
  const hole = tau < tT ? 0 : 0.082 * suave(inv(tT, tT + 0.03, tau)) + 0.004;
  const pass = suave(inv(tT, 0.03, tau)) * (tau < tS ? 1 : 0), apos = Math.max(0, tau - tS);
  const flap = tau < tT ? 0 : tau < tS ? 0.075 * suave(inv(tT, 0.03, tau)) : 0.032 + 0.043 * Math.exp(-apos / 0.11) * Math.cos(apos * 27);
  const balanco = tau < tT ? 0 : Math.exp(-(tau - tT) / 0.2) * Math.sin((tau - tT) * 24);
  return { dent, hole, flap, balanco, apos };
}

// ---------------------------------------------------------------- câmera por pontos-chave: [t, [x,y,z], [alvo], fov] (spline cúbica: velocidade contínua, sem "pára-e-anda")
function hermite(K, t) {
  const n = K.length; let i = 0; while (i < n - 2 && t > K[i + 1][0]) i++;
  const t0 = K[i][0], t1 = K[i + 1][0], h = t1 - t0, u = clamp((t - t0) / h);
  const m = j => { const a = K[Math.max(0, j - 1)], b = K[Math.min(n - 1, j + 1)]; return b[1].map((v, d) => (v - a[1][d]) / (b[0] - a[0])); };
  const m0 = m(i), m1 = m(i + 1), p0 = K[i][1], p1 = K[i + 1][1];
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  return p0.map((v, d) => h00 * v + h10 * h * m0[d] + h01 * p1[d] + h11 * h * m1[d]);
}
function camChaves(t, K, extra = {}) {
  const f = hermite(K.map(k => [k[0], [...k[1], ...k[2], k[3]]]), t);
  camara({ pos: [f[0], f[1], f[2]], alvo: [f[3], f[4], f[5]], fov: f[6], t, ...extra });
}

// ---------------------------------------------------------------- luz do plano da rua à noite
function luzRua(foco, { fill = [-1.5, 2.2, 2.4] } = {}) {
  luzes({ hemiK: 0.55, ceu: 0x4565c4, chao: 0x2a2250, solK: 0.5, solCor: 0x86a8ff, solPos: [-6, 9, 6],
    spotK: 170, spotPos: [2.75, 8.0, -2.6], spotAlvo: foco, spotCor: 0xffb468, spotAng: 0.42,
    pontoK: 9, pontoPos: fill, pontoCor: 0xffc08a });
}

// ---------------------------------------------------------------- poses do povo de Yoro
function dobrar(a, k) {                       // inclina o tronco para a frente em k rad com as pernas retas (as coxas contra-giram)
  a.somar('Quadril', k * 0.62, 0, 0); a.somar('Coluna', k * 0.22, 0, 0); a.somar('Coluna2', k * 0.1, 0, 0);
  for (const l of 'ED') a.somar('Coxa' + l, -k * 0.62, 0, 0);
}
const loc2w = (a, x, y, z) => V(x, y, z).applyMatrix4(a.grupo.matrixWorld);
function ficar(a, x, z, yaw, clip, t, { rit = 1, expr = 'neutro', f = 0.8 } = {}) {
  a.colocar(x, 0.0, z, yaw); a.anim(clip, t * rit, {}); a.rosto({ expressao: expr, forca: f, piscar: 0 }); a.grupo.updateMatrixWorld(true);
}
function posePovo(t) {
  const P = X.povo, cam3 = cam.position;
  // Théo: mostra o peixe vivo para a câmera
  { const a = P.teo; ficar(a, -0.6, 4.5, Math.PI + 0.12, 'Parado', t, { expr: 'sorriso', f: 1 });
    a.somar('Coluna', -0.05 + 0.02 * Math.sin(t * 2.2), 0, 0);
    a.grupo.updateMatrixWorld(true);
    const mao = loc2w(a, -0.17 + 0.012 * Math.sin(t * 5), 0.86 + 0.02 * Math.sin(t * 4.1), 0.40); a.ikBraco('D', mao, V(-0.2, -1, -0.3)); a.grupo.updateMatrixWorld(true);
    a.olhar(cam3, { forca: 0.8 }); a.grupo.updateMatrixWorld(true);
    const m = a.pos('MaoD'), pg = X.peixeTeo.grupo, dirL = V(0.25, 0.55, 0.8).normalize().applyQuaternion(a.grupo.getWorldQuaternion(new THREE.Quaternion()));
    pg.position.copy(m).add(V(0, 0.03, 0.0)); orientar(pg, dirL, 0.3 * Math.sin(t * 7)); X.peixeTeo.ondular(t * 17, 0.55, 0.1 * Math.sin(t * 4)); }
  // Davi: abaixado catando peixe
  { const a = P.davi; ficar(a, -3.4, 8.6, 2.7, 'Parado', t, { expr: 'sorriso', f: 0.7 }); const k = 1.0 + 0.12 * Math.sin(t * 1.7); dobrar(a, k); a.grupo.updateMatrixWorld(true);
    a.ikBraco('E', loc2w(a, 0.1, 0.1, 0.5), V(0.3, -1, 0)); a.ikBraco('D', loc2w(a, -0.12, 0.12, 0.42), V(-0.3, -1, 0)); }
  // Lia e Nina pulando de alegria
  { const a = P.lia; ficar(a, 2.2, 3.5, Math.PI - 0.3, 'Pular', t, { rit: 0.9, expr: 'sorriso', f: 1 }); a.olhar(cam3, { forca: 0.6 }); }
  { const a = P.nina; ficar(a, 3.3, 4.6, Math.PI + 0.35, 'Pular', t + 0.5, { rit: 0.9, expr: 'sorriso', f: 1 }); a.olhar(cam3, { forca: 0.6 }); }
  // Dona Lurdes: abaixa devagar para pegar um peixe
  { const a = P.velha; ficar(a, 3.5, 8.3, 3.6, 'Parado', t, { expr: 'sorriso', f: 0.6 }); dobrar(a, 0.5 + 0.1 * Math.sin(t * 1.3)); a.grupo.updateMatrixWorld(true);
    a.ikBraco('E', loc2w(a, 0.14, 0.2, 0.42), V(0.3, -1, 0)); }
  // Homem: vem pela rua carregando a cesta
  { const a = P.homem, z = 13 - 0.62 * t; ficar(a, -1.8 + 0.1 * Math.sin(t), z, Math.PI, 'Andar', t, { rit: 0.55, expr: 'sorriso', f: 0.8 }); a.grupo.updateMatrixWorld(true);
    a.ikBraco('E', loc2w(a, 0.2, 0.92, 0.36), V(0.4, -1, 0)); a.ikBraco('D', loc2w(a, -0.2, 0.92, 0.36), V(-0.4, -1, 0)); a.grupo.updateMatrixWorld(true);
    const c = X.cestas[4]; c.position.copy(loc2w(a, 0, 0.74, 0.4)); c.rotation.set(0, Math.PI, 0); }
  // jovem: olha para o céu, surpreso
  { const a = P.jovem; ficar(a, 1.4, 10.4, Math.PI + 0.2, 'Parado', t, { expr: 'surpresa', f: 0.6 }); a.olhar(V(0, 14, 10), { forca: 0.9 }); }
  { const a = P.faxi; ficar(a, -4.7, 5.6, 1.9, 'Parado', t, { expr: 'sorriso', f: 0.7 }); dobrar(a, 0.9 + 0.1 * Math.sin(t * 1.5 + 1)); a.grupo.updateMatrixWorld(true);
    a.ikBraco('E', loc2w(a, 0.1, 0.1, 0.46), V(0.3, -1, 0)); a.ikBraco('D', loc2w(a, -0.12, 0.12, 0.4), V(-0.3, -1, 0)); }
  // peixes nas cestas
  X.cestaPeixes.pos.forEach((q, i) => { if (i < 25) X.cestaPeixes.set(i, q[0], q[1], q[2], q[3], -Math.PI / 2 + q[4], 0, 1); else X.cestaPeixes.esconder(i); }); X.cestaPeixes.fim();
}

// cena da rua à noite (mulher, guarda-chuva, peixe, chuva): a câmera já está posicionada
function cenaRua(tau, rateV) {
  const tg = X.chao.tauPouso;
  mostrar('R', 0x0f1a40, [0x1c2b66, 0.014]); X.ceuR.mesh.visible = true; X.ceuD.mesh.visible = false; X.ceuL.mesh.visible = false; X.ceuM.mesh.visible = false; X.ceuC.mesh.visible = false; X.ceuR.seguir(cam);
  const tec = tecidoEm(tau); X.balanco = tec.balanco;
  const pe = peixeEm(tau);
  const kb = suave(inv(tg + 1.7, tg + 2.4, tau)), alvoOlhar = pe.c.clone().lerp(X.furo.Pw, kb);
  const ko = suave(inv(0.05, 0.38, tau)), ks = 0.7 * suave(inv(tg + 0.05, tg + 0.45, tau));
  poseMae(tau, { olhar: alvoOlhar, kolhar: ko * 0.9, ksusto: ks });
  X.guarda.atualizar({ dent: tec.dent, hole: tec.hole, flap: tec.flap, balanco: tec.balanco });
  X.spray.atualizar(tau, cam); X.respingo.atualizar(tau, cam);
  const gm = X.guarda.grupo.matrixWorld.clone().invert(), gp = V(), R = X.guarda.R;
  const ocultar = (x, y, z) => { gp.set(x, y, z).applyMatrix4(gm); return gp.y < X.guarda.alturaCopa(gp.x, gp.z) + 0.02 && Math.hypot(gp.x, gp.z) < R * 1.02 && gp.y > -1.05; };
  const mz = X.mae.grupo.position.z;
  X.chuva.atualizar(tau, [MAE.x, 0, mz + 0.8], { v: 9, vento: 0.1, comp: 0.36 * clamp(rateV, 0.07, 1), ocultar, camPos: cam.position });
  X.ondas.atualizar(tau, 0.0, { taxa: 2.4, raio: 0.17 * clamp(rateV + 0.15, 0.2, 1) });
  luzRua([MAE.x - 0.1, 1.5, mz + 0.3], { fill: [cam.position.x + 0.5, Math.max(1.4, cam.position.y), cam.position.z + 0.6] });
}

// ---------------------------------------------------------------- planos
function montarPlanos() {
  const furo = iniciarPeixe();
  X.ref = { furo };
  // gotas que o impacto lança do tecido
  const gota = new THREE.MeshStandardMaterial({ color: 0xcfe6ff, emissive: 0x3d6ba8, emissiveIntensity: 0.9, roughness: 0.05, transparent: true, opacity: 0.72, envMap: X.env, envMapIntensity: 1.2 });
  X.spray = new Rajada(mundos.R, { n: 70, geo: new THREE.SphereGeometry(1, 8, 6), mat: gota,
    t0: 0.002, vida: 1.5, semente: 7, origem: [furo.Pw.x, furo.Pw.y + 0.03, furo.Pw.z], raio: 0.025, vel: [1.5, 5.5], dir: [0, 1, 0], abre: 1.5, grav: 9.8, arrasto: 0.35, tam: [0.0028, 0.0075], gira: 2, chao: -50, fim: 'some' });
  X.respingo = new Rajada(mundos.R, { n: 80, geo: new THREE.SphereGeometry(1, 8, 6), mat: gota,
    t0: X.chao.tauPouso, vida: 0.9, semente: 11, origem: [X.chao.x, 0.03, X.chao.z], raio: 0.06, vel: [0.5, 2.4], dir: [0, 1, 0], abre: 1.1, grav: 9.8, arrasto: 0.3, tam: [0.004, 0.011], gira: 2, chao: 0.0, fim: 'some' });

  const K1 = [
    [0.0, [CAM0.x, CAM0.y, CAM0.z], [-0.62, 1.95, -0.22], 31],
    [1.8, [-1.55, 1.78, 1.70], [-0.60, 1.70, -0.15], 30],
    [3.1, [-1.25, 0.80, 1.70], [-0.72, 0.20, -0.02], 38],
    [4.4, [-1.45, 0.50, 1.55], [-0.74, 0.62, -0.20], 50],
    [5.6, [-0.25, 1.20, 1.75], [-0.55, 1.42, -0.25], 30],
    [7.6, [-0.45, 0.95, 0.85], [-0.64, 2.00, -0.33], 42],
  ];
  plano('abertura', 7.6, 'R', (u, t) => {
    camChaves(t, K1, { tr: 0.5 });
    if (window.__camDbg) camara({ ...window.__camDbg, t });
    cenaRua(tauDe(t), rate(t));
  });

  // ======================================================= 2. Yoro de manhã (rua cheia de peixes)
  plano('manha', 9.0, 'D', (u, t, pl) => {
    const tl = t - pl.t0;
    camChaves(tl, [
      [0.0, [2.4, 7.4, -9.5], [0.2, 0.9, 6.5], 42],
      [3.0, [1.6, 2.7, -3.2], [-0.4, 0.95, 5.0], 38],
      [6.0, [0.9, 1.35, 0.7], [-0.7, 0.95, 4.5], 34],
      [9.0, [-0.1, 1.05, 2.5], [-0.62, 1.0, 4.5], 27],
    ], { tr: 0.5 });
    mostrar('D', 0xffc8a0, [0xf6c8a8, 0.006]);
    X.ceuR.mesh.visible = false; X.ceuL.mesh.visible = false; X.ceuM.mesh.visible = false; X.ceuC.mesh.visible = false; X.ceuD.mesh.visible = true; X.ceuD.mat.uniforms.tempo.value = tl;
    X.yoro.atualizar(tl);
    posePovo(tl);
    desenharPlacar(Math.floor(lerp(14, 183, suave(inv(0.3, 8.7, tl)))));
    X.ceuD.seguir(cam);
    sol.target.position.set(0, 0, 5); sol.target.updateMatrixWorld();
    luzes({ solSombra: true, solCaixa: 16, hemiK: 1.0, ceu: 0xd2d8ff, chao: 0xb89270, solK: 3.0, solCor: 0xffc690, solPos: [-12, 8, -16], spotK: 0, pontoK: 14, pontoPos: [cam.position.x + 0.4, cam.position.y + 0.3, cam.position.z - 0.5], pontoCor: 0xffe6cc });
    if (window.__camDbg) camara({ ...window.__camDbg, t });
  });

  // ======================================================= 3. A lenda do padre (noite, tempestade, peixes do céu)
  plano('lenda', 9.0, 'L', (u, t, pl) => {
    const tl = t - pl.t0;
    camChaves(tl, [
      [0.0, [0.3, 1.30, 1.55], [0.0, 1.22, 0.3], 30],
      [3.2, [1.3, 1.25, 4.2], [0.0, 1.75, -1.5], 34],
      [6.0, [3.0, 3.1, 8.2], [0.0, 3.4, -5.5], 42],
      [9.0, [1.4, 9.5, 3.4], [0.0, 0.0, 0.4], 40],
    ], { tr: 0.5 });
    mostrar('L', 0x050a22, [0x141c58, 0.012]); X.ceuR.mesh.visible = false; X.ceuD.mesh.visible = false; X.ceuM.mesh.visible = false; X.ceuC.mesh.visible = false; X.ceuL.mesh.visible = true; X.ceuL.mat.uniforms.tempo.value = tl;
    const rel = (a, d) => Math.exp(-Math.pow((tl - a) / d, 2));                                   // relâmpago suave
    const fl = 0.9 * rel(2.35, 0.07) + 0.6 * rel(2.5, 0.12) + 0.9 * rel(6.1, 0.07) + 0.5 * rel(6.25, 0.14);
    X.ceuL.mat.uniforms.flash.value = fl;
    poseReza(X.padre, tl, V(0.4, 9, -4));
    X.cairL(tl);
    X.chuvaL.atualizar(tl, [0, 0, 1], { v: 9, vento: 0.14, comp: 0.4, camPos: cam.position });
    X.ondasL.atualizar(tl, 0.0, { taxa: 2.4, raio: 0.17 });
    X.ceuL.seguir(cam);
    sol.target.position.set(0, 0, 0); sol.target.updateMatrixWorld();
    luzes({ hemiK: 0.45, ceu: 0x4a5fd0, chao: 0x1a1a3a, solK: 0.7 + 3.5 * fl, solCor: 0x9fb4ff, solPos: [-6, 12, 5], spotK: 260, spotPos: [-1.5, 4.2, -6.0], spotAlvo: [0, 1.0, 0.3], spotCor: 0xffb060, spotAng: 0.5,
      pontoK: 9 + 1.2 * Math.sin(tl * 7.3) , pontoPos: [0.7, 0.4, 0.6], pontoCor: 0xffb468 });
    if (window.__camDbg) camara({ ...window.__camDbg, t });
  });

  // ======================================================= 4a. Hipótese 1: tromba-d'água (e o mar a 72 km)
  plano('mar', 6.5, 'C', (u, t, pl) => {
    const tl = t - pl.t0;
    camChaves(tl, [
      [0.0, [13.0, 2.8, 32.0], [-14.0, 17.0, -12.0], 54],
      [3.2, [8.5, 2.6, 27.0], [-10.0, 12.0, -6.0], 46],
      [6.5, [3.8, 2.3, 21.5], [-0.2, 4.0, 12.0], 38],
    ], { tr: 0.6 });
    mostrar('C', 0x12184e, [0x7a4a7a, 0.0035]); X.mar.grupo.visible = true; X.corte.grupo.visible = false;
    X.ceuR.mesh.visible = false; X.ceuD.mesh.visible = false; X.ceuL.mesh.visible = false; X.ceuC.mesh.visible = false; X.ceuM.mesh.visible = true; X.ceuM.mat.uniforms.tempo.value = tl; X.ceuM.seguir(cam);
    X.mar.atualizar(tl);
    sol.target.position.set(-10, 5, 0); sol.target.updateMatrixWorld();
    luzes({ solSombra: false, hemiK: 0.8, ceu: 0x8a82e8, chao: 0x2a2a60, solK: 2.6, solCor: 0xff9e60, solPos: [-70, 14, -90], spotK: 0, pontoK: 0 });
    if (window.__camDbg) camara({ ...window.__camDbg, t });
  });

  // ======================================================= 4b. Hipótese 2: rio subterrâneo
  plano('corte', 6.5, 'C', (u, t, pl) => {
    const tl = t - pl.t0, X0 = 600;
    camChaves(tl, [
      [0.0, [X0 - 5.5, -3.0, 20.0], [X0 - 4.5, -3.6, 0.0], 50],
      [2.6, [X0 - 0.5, -2.4, 20.0], [X0 + 0.8, -3.0, 0.0], 50],
      [4.4, [X0 + 2.0, 0.0, 19.0], [X0 + 2.8, -1.5, 0.0], 50],
      [6.5, [X0 + 3.4, 2.4, 16.0], [X0 + 3.0, 0.8, -3.0], 48],
    ], { tr: 0.5 });
    mostrar('C', 0x9aa4cc, [0xb8b8d0, 0.003]); X.mar.grupo.visible = false; X.corte.grupo.visible = true;
    X.ceuR.mesh.visible = false; X.ceuD.mesh.visible = false; X.ceuL.mesh.visible = false; X.ceuM.mesh.visible = false; X.ceuC.mesh.visible = true; X.ceuC.mat.uniforms.tempo.value = tl; X.ceuC.seguir(cam);
    X.corte.atualizar(tl, cam.position.clone().sub(V(X0, 0, 0)));
    sol.target.position.set(X0, -2, -3); sol.target.updateMatrixWorld();
    luzes({ solSombra: false, hemiK: 1.1, ceu: 0xc0ccf0, chao: 0x7a6a5a, solK: 2.2, solCor: 0xfff0d8, solPos: [X0 - 10, 12, 14], spotK: 0, pontoK: 26, pontoPos: [X0 + 1.5, -5.0, 3], pontoCor: 0x6ab4ff });
    if (window.__camDbg) camara({ ...window.__camDbg, t });
  });

  // ======================================================= 5. Fecho em loop: a mulher volta à cena e o peixe fura o guarda-chuva de novo (último quadro = quadro 0)
  const FE = { dur: 6.0, lento: 0.025, t1: 3.2, t2: 5.2 };
  const rateF = tf => tf < FE.t1 ? 1 : tf < FE.t2 ? lerp(1, FE.lento, suave((tf - FE.t1) / (FE.t2 - FE.t1))) : FE.lento;
  const TF = []; { const n = 600 * 6, dt = 1 / 600, I = new Float64Array(n + 2); for (let i = n; i >= 0; i--) I[i] = I[i + 1] + rateF(i * dt) * dt; for (let i = 0; i <= n; i++) TF.push(T_PULO - I[i] + I[n]); }
  const tauF = tf => { const x = clamp(tf, 0, 6) * 600, i = Math.min(TF.length - 2, Math.floor(x)); return lerp(TF[i], TF[i + 1], x - i); };
  plano('fecho', FE.dur, 'R', (u, t, pl) => {
    const tf = t - pl.t0, e = suave(clamp(tf / FE.dur));
    const A = [CAM0.x + 0.9, CAM0.y + 0.55, CAM0.z + 2.4], B = [CAM0.x, CAM0.y, CAM0.z], Ta = [-0.45, 1.65, -0.75], Tb = [-0.62, 1.95, -0.22];
    camara({ pos: lerpV(A, B, e), alvo: lerpV(Ta, Tb, e), fov: lerp(38, 31, e), tr: 0.5, t: -(FE.dur - tf) * 1.0 });
    cenaRua(tauF(tf), rateF(tf));
  });
}

// ---------------------------------------------------------------- atualização e efeitos de quadro
export function atualizar(t) {
  const pl = acharPlano(t);
  pl.fn((t - pl.t0) / pl.dur, t, pl);
}
export function efeitos(t) {
  const e = { subs: 1, obturador: 0.5, fade: 0, flash: 0, flashCor: '255,255,255', tintas: null };
  if ((t > 1.7 && t < 3.3) || (t > 20 && t < 25.5)) { e.subs = 3; e.obturador = 0.6; }                    // queda rápida do peixe: borrão de movimento
  return e;
}
