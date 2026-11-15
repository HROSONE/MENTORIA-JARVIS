// Linha do tempo: constrói os mundos, os atores e comanda cada plano em função do tempo.
//   Dois relógios: t (filme, câmera e montagem) e tau (física: chuva, peixe, tecido, mulher). Na câmera lenta tau anda a 2,5% de t.
import * as THREE from 'three';
import { scene, cam, mundos, Rajada } from './motor.js';
import { clamp, lerp, suave, inv, ruido, mulberry32, chaves } from './util.js';
import { S, V, plano, acharPlano, mostrar, luzes, camara, mapaAmbiente, spot, ponto, hemi, sol } from './base.js';
import { construirRua } from './rua.js';
import { Ator } from './atores.js';
import { criarPeixe } from './peixe.js';
import { criarGuardaChuva } from './guardachuva.js';
import { criarChuva, criarOndas } from './chuva.js';

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
  montarPlanos();
  return S;
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

  plano('abertura', 7.6, 'R', (u, t) => {
    const tau = tauDe(t), tg = X.chao.tauPouso;
    mostrar('R', 0x0f1a40, [0x1c2b66, 0.014]);
    const tec = tecidoEm(tau); X.balanco = tec.balanco;
    const pe = peixeEm(tau);
    // olhar: acompanha o peixe depois que ele fura o tecido; mais tarde olha para o buraco na copa
    const buraco = V().copy(X.furo.Pw).add(V(0, 0.0, 0));
    const kb = suave(inv(tg + 1.7, tg + 2.4, tau)), alvoOlhar = pe.c.clone().lerp(buraco, kb);
    const ko = suave(inv(0.05, 0.38, tau)), ks = 0.7 * suave(inv(tg + 0.05, tg + 0.45, tau));
    const mao = poseMae(tau, { olhar: alvoOlhar, kolhar: ko * 0.9, ksusto: ks });
    X.guarda.atualizar({ dent: tec.dent, hole: tec.hole, flap: tec.flap, balanco: tec.balanco });
    X.spray.atualizar(tau, cam); X.respingo.atualizar(tau, cam);
    // chuva (a mesma câmera lenta); não passa pelo guarda-chuva
    const gm = X.guarda.grupo.matrixWorld.clone().invert(), gp = V(), R = X.guarda.R;
    const ocultar = (x, y, z) => { gp.set(x, y, z).applyMatrix4(gm); return gp.y < X.guarda.alturaCopa(gp.x, gp.z) + 0.02 && Math.hypot(gp.x, gp.z) < R * 1.02 && gp.y > -1.05; };
    const mz = X.mae.grupo.position.z;
    X.chuva.atualizar(tau, [MAE.x, 0, mz + 0.8], { v: 9, vento: 0.1, comp: 0.36 * clamp(rate(t), 0.07, 1), ocultar, camPos: cam.position });
    X.ondas.atualizar(tau, 0.0, { taxa: 2.4, raio: 0.17 * clamp(rate(t) + 0.15, 0.2, 1) });
    camChaves(t, [
      [0.0, [CAM0.x, CAM0.y, CAM0.z], [-0.62, 1.95, -0.22], 31],
      [1.8, [-1.55, 1.78, 1.70], [-0.60, 1.70, -0.15], 30],
      [3.1, [-1.25, 0.80, 1.70], [-0.72, 0.20, -0.02], 38],
      [4.4, [-1.45, 0.50, 1.55], [-0.74, 0.62, -0.20], 50],
      [5.6, [-0.25, 1.20, 1.75], [-0.55, 1.42, -0.25], 30],
      [7.6, [-0.45, 0.95, 0.85], [-0.64, 2.00, -0.33], 42],
    ], { tr: 0.5 });
    if (typeof window !== 'undefined' && window.__camDbg) camara({ ...window.__camDbg, t });
    luzRua([MAE.x - 0.1, 1.5, mz + 0.3], { fill: [cam.position.x + 0.5, Math.max(1.4, cam.position.y), cam.position.z + 0.6] });
  });
}

// ---------------------------------------------------------------- atualização e efeitos de quadro
export function atualizar(t) {
  const pl = acharPlano(t);
  pl.fn((t - pl.t0) / pl.dur, t, pl);
}
export function efeitos(t) {
  const e = { subs: 1, obturador: 0.5, fade: 0, flash: 0, flashCor: '255,255,255', tintas: null };
  if (t > S.total - 0.25) e.fade = clamp((t - (S.total - 0.25)) / 0.25);
  return e;
}
