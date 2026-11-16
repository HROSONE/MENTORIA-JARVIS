// LINHA DO TEMPO do Short "Você fugiria de um T. rex?": 12 planos, câmera sempre DE FRENTE para o protagonista com o T. rex atrás dele.
// Três tentativas com volta no tempo: (1) reta na estrada, é pego; (2) entra na mata e se esconde na fenda; (3) maratonista de elite, mantém a
// distância mas também se esconde. Tudo é função do tempo absoluto t (s). Enquadramento: cada plano tem a lista do que PRECISA caber;
// verificarEnquadramento() projeta esses pontos na tela 9:16 e, se algo sair, gira a câmera em volta do protagonista até caber (fixo no plano).
import * as THREE from 'three';
import { scene, cam, renderer, lente, Q, tela, canvasTex } from './motor.js';
import { clamp, lerp, suave, inv, ruido } from './util.js';
import { criarLucasReal, URL_REAL } from './lucasreal.js';
import { carregarMocap, aplicarMocap, vida } from './mocap.js';
import { criarTrex } from './trex.js';
import { construirSelva, alturaChao, FENDA, ESCONDE_M } from './selva3d.js';
import { criarFumaca } from './poeira.js';

export const S = { planos: [], total: 0 };
const plano = (id, dur, fn, extra = {}) => { S.planos.push({ id, t0: S.total, dur, fn, ...extra }); S.total += dur; };
export function acharPlano(t) { for (let i = S.planos.length - 1; i >= 0; i--) if (t >= S.planos[i].t0 - 1e-6) return S.planos[i]; return S.planos[0]; }
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ------------------------------------------------------------------------------------------------ cinemática das três tentativas (metros, segundos)
function tabela(vfn, t0, t1, dt = 1 / 240) {                       // distância acumulada de uma velocidade v(t)
  const n = Math.ceil((t1 - t0) / dt) + 1, D = new Float64Array(n); for (let i = 1; i < n; i++) D[i] = D[i - 1] + vfn(t0 + i * dt) * dt;
  return t => { const f = clamp((t - t0) / dt, 0, n - 1), i = Math.floor(f), a = f - i; return D[i] * (1 - a) + D[Math.min(i + 1, n - 1)] * a; };
}
// tentativa 1: o trilheiro dispara (~23 km/h), aguenta uns segundos e cai para ~11 km/h; o T. rex anda a ~21 km/h e alcança
const A1 = { largada: 2.4, x0: 2, tx0: -11, tLarg: 1.8 };
A1.vR = t => { const u = t - A1.largada; return u < 0 ? 0 : u < 2.8 ? 6.5 * suave(u / 1.0) : u < 6.8 ? lerp(6.5, 3.0, (u - 2.8) / 4.0) : 3.0; };
A1.vT = t => 5.8 * suave((t - A1.tLarg) / 1.5);
A1.dR = tabela(A1.vR, 0, 14); A1.dT = tabela(A1.vT, 0, 14);
// tentativa 2 (começa em 14,2 s; tempo local u): sai da estrada para a mata; o T. rex vai mais devagar entre as árvores
const A2 = { t0: 14.2 };
A2.vR = u => u < 0 ? 0 : 6.2 * suave(u / 0.6) * (u > 3.9 ? clamp(1 - (u - 3.9) / 0.5) : 1);
A2.vT = u => 5.4 * suave((u + 0.4) / 1.2) * (u > 2.0 ? lerp(1, 0.62, clamp((u - 2.0) / 1.0)) : 1) * (u > 5.2 ? clamp(1 - (u - 5.2) / 0.8) : 1);
A2.dR = tabela(A2.vR, 0, 8); A2.dT = tabela(A2.vT, 0, 8);
// tentativa 3 (começa em 22,5 s): maratonista a 21 km/h constantes; o T. rex a ~20 km/h não encosta
const A3 = { t0: 22.5, vR: 5.9, vT: 5.6 };

let MUNDO = null;      // preenchido em construirTudo

// ------------------------------------------------------------------------------------------------ objetos de cena
function relogio() {                                             // relógio de pulso com a velocidade (texto diegético)
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d'); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const G = new THREE.Group();
  const caixa = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.012, 0.040), new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.4 })); G.add(caixa);
  const tela_ = new THREE.Mesh(new THREE.PlaneGeometry(0.036, 0.032), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); tela_.rotation.x = -Math.PI / 2; tela_.position.y = 0.0065; G.add(tela_);
  const pul = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.008, 6, 20), new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.7 })); pul.rotation.y = Math.PI / 2; pul.scale.set(1, 1.25, 1); pul.position.y = -0.026; G.add(pul);
  let ult = null;
  G.userData.mostrar = kmh => {
    const v = Math.round(kmh); if (v === ult) return; ult = v;
    g.fillStyle = '#05080a'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#7dff9a'; g.font = '900 130px "DejaVu Sans", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(v), 128, 112); g.font = '700 46px "DejaVu Sans", sans-serif'; g.fillStyle = '#cfe8d6'; g.fillText('km/h', 128, 205); tex.needsUpdate = true;
  };
  G.userData.mostrar(0); return G;
}
function mochila() {
  const G = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: 0x3b3428, roughness: 0.85 });
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.42, 0.16, 2, 2, 2), m); corpo.geometry.translate(0, 0, -0.08); G.add(corpo);
  const bolso = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.05), new THREE.MeshStandardMaterial({ color: 0x2c2820, roughness: 0.9 })); bolso.position.set(0, -0.10, -0.175); G.add(bolso);
  G.traverse(o => { if (o.isMesh) o.castShadow = true; }); return G;
}
function numeroPeito() {                                         // número de peito do maratonista com a marca do canal
  const tex = canvasTex(512, 384, (g, w, h) => { g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, w, h); g.fillStyle = '#c4161c'; g.fillRect(0, 0, w, 70);
    g.fillStyle = '#ffffff'; g.font = '900 54px "DejaVu Sans", sans-serif'; g.textAlign = 'center'; g.fillText('HRYZ', w / 2, 54);
    g.fillStyle = '#111'; g.font = '900 210px "DejaVu Sans", sans-serif'; g.fillText('21', w / 2, 300); });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(0.20, 0.15), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide })); return p;
}
function tenis() {                                               // o tênis que cai da boca (tentativa 1)
  const G = new THREE.Group();
  const sola = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.035, 0.10), new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.8 })); G.add(sola);
  const cab = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 10), new THREE.MeshStandardMaterial({ color: 0x4a4c52, roughness: 0.7 })); cab.scale.set(2.1, 0.95, 0.85); cab.position.set(0.0, 0.05, 0); G.add(cab);
  G.traverse(o => { if (o.isMesh) o.castShadow = true; }); return G;
}

// ------------------------------------------------------------------------------------------------ construção
export async function construirTudo() {
  const selva = await construirSelva(scene, renderer);
  scene.environment = selva.ambiente; scene.fog = selva.nevoa; scene.background = new THREE.Color(0x9fb39a);
  const T = await criarTrex(); scene.add(T.grupo);
  const H = await criarLucasReal({ url: URL_REAL('trilheiro') }); scene.add(H.grupo);
  const Mt = await criarLucasReal({ url: URL_REAL('maratonista') }); scene.add(Mt.grupo);
  const corrida = await carregarMocap('../biblioteca3d/mocap/cmu/09_05.json');
  // direção da corrida na captura (para virar o ator para onde ele corre)
  const a0 = corrida.pos(8 / 30, 'root', V()), a1 = corrida.pos(31 / 30, 'root', V()); const RUMO_CLIP = Math.atan2(a1.z - a0.z, a1.x - a0.x);
  const passoClip = Math.hypot(a1.x - a0.x, a1.z - a0.z);       // comprimento de um ciclo na captura
  const rel = relogio(), relM = relogio(), moch = mochila(), num = numeroPeito(), ten = tenis(); scene.add(ten);
  H.ossos.hand_l.add(rel); rel.position.set(-0.02, 0.07, 0.0); rel.rotation.set(0, 0, Math.PI / 2);
  Mt.ossos.hand_l.add(relM); relM.position.set(-0.02, 0.07, 0.0); relM.rotation.set(0, 0, Math.PI / 2);
  H.ossos.spine_03.add(moch); moch.position.set(0, 0.05, -0.12);
  Mt.ossos.spine_03.add(num); num.position.set(0, 0.06, 0.16);
  const poeira = criarFumaca(scene, tela.alt);
  MUNDO = { selva, T, H, Mt, corrida, RUMO_CLIP, passoClip, rel, relM, ten, poeira };

  // ---------------------------------------------------------------------------------------------- poses
  function correr(A, x, z, rumo, dist, vel, t, { olhaTras = 0, ofegante = 0.5, semente = 0 } = {}) {
    // ciclo de corrida real (quadros 8-31 da captura 09_05) em laço; o passo alonga com a velocidade
    const passo = passoClip * (A.esc || 1) * clamp(0.75 + 0.22 * vel / 3.5, 0.8, 1.35);
    const fase = ((dist / passo) % 1 + 1) % 1, tc = 8 / 30 + fase * (23 / 30);
    aplicarMocap(A, corrida, tc, { origem: [x, alturaChao(x, z), z], yaw: RUMO_CLIP - (-rumo), segue: false });
    vida(A, t, { forca: 0.6, ofegante, semente });
    if (olhaTras) { A.dobrar('spine_02', 0, -14 * olhaTras, 0).dobrar('spine_03', 0, -16 * olhaTras, 0).dobrar('neck_01', 0, -30 * olhaTras, 0).dobrar('head', 0, -25 * olhaTras, 0); }
    return A;
  }
  function trexEm(x, z, rumo, dist, vel, t, opc = {}) {
    T.grupo.position.set(x, alturaChao(x + 2, z), z); T.grupo.rotation.set(0, -rumo, 0);
    T.posar({ dist, vel, t, ...opc });
  }
  // tremor de câmera nas pisadas do T. rex (decai a cada passo), mais forte perto
  function tremorPisada(dist, vel, perto) {
    const ciclo = 2.8 + 0.42 * vel, f = (dist / ciclo) * 2, u = f - Math.floor(f);            // duas pisadas por ciclo
    return vel > 0.5 ? perto * Math.exp(-u * 9) : 0;
  }
  function cameraFrente(alvo, dist, alt, az, fov, { olhaY = 0, tremor = 0, t = 0, roll = 0 }) {
    const p = V(alvo.x + Math.cos(az) * dist, alvo.y + alt, alvo.z + Math.sin(az) * dist);
    cam.position.copy(p); cam.up.set(0, 1, 0); cam.lookAt(alvo.x, alvo.y + olhaY, alvo.z);
    if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    if (roll) cam.rotateZ(roll);
    if (tremor) { cam.position.y += tremor * 0.05 * ruido(t * 40, 1); cam.rotateX(tremor * 0.012 * ruido(t * 37, 2)); cam.rotateZ(tremor * 0.010 * ruido(t * 33, 3)); }
    return p.distanceTo(alvo);
  }
  MUNDO.f = { correr, trexEm, tremorPisada, cameraFrente };

  // ---------------------------------------------------------------------------------------------- estado de cada tentativa (para os planos e para a volta no tempo)
  function estado1(t) {                                              // tentativa 1, tempo absoluto
    const dR = A1.dR(t), dT = A1.dT(t), xr = A1.x0 + dR, xt = A1.tx0 + dT, vr = A1.vR(t), vt = A1.vT(t);
    const mord = inv(10.0, 11.2, t), comido = t > 11.0;
    H.grupo.visible = !comido; Mt.grupo.visible = false;
    if (!comido) correr(H, xr, 0, 0, dR, vr, t, { olhaTras: t < A1.largada ? 1 : t > 8.0 && t < 9.6 ? 0.8 : 0, ofegante: clamp((t - 5) / 3) });
    if (t < A1.largada) H.rosto({ esforco: 0.6, boca: inv(1.7, 2.0, t) }).expressao({ 'mouth-open': inv(1.7, 2.0, t), 'eyebrows-left-inner-up': 1, 'eyebrows-right-inner-up': 1 });
    else H.rosto({ esforco: 0.7, boca: 0.4 + 0.2 * Math.sin(t * 8) });
    rel.userData.mostrar(vr * 3.6);
    const rug = t < 1.7 ? suave(inv(0.05, 0.45, t)) * (1 - inv(1.4, 1.7, t)) : 0;
    const olhar = comido ? V(xt + 12, 6, 0) : H.pos('head');
    trexEm(xt, 0, 0, dT, vt, t, { olhar, rugido: rug, mordida: comido ? 0 : mord, mastigar: comido ? clamp((t - 11.1) / 0.3) : 0 });
    ten.visible = t > 11.6; if (ten.visible) { const u = t - 11.6, y = Math.max(0.02, 3.3 - 4.9 * u * u); ten.position.set(xt + 5.6 + u * 0.6, y, 0.4); ten.rotation.set(u * 7, 0.6, u * 5); }
    return { xr, xt, vr, vt, dT };
  }
  function estado2(t) {
    const u = t - A2.t0, dR = A2.dR(u), dT = A2.dT(u);
    const cur = selva.curva, L = cur.getLength(), k = clamp(dR / L), p = cur.getPointAt(k), tg = cur.getTangentAt(k), rumo = Math.atan2(tg.z, tg.x);
    const kT = clamp((dT - 11) / L), pT = cur.getPointAt(Math.max(0, kT)), tgT = cur.getTangentAt(Math.max(0, kT));
    const xt = kT <= 0 ? A1.tx0 + dT + 2 : pT.x - Math.cos(Math.atan2(tgT.z, tgT.x)) * 4.4, zt = kT <= 0 ? 0 : pT.z - Math.sin(Math.atan2(tgT.z, tgT.x)) * 4.4;
    H.grupo.visible = true; Mt.grupo.visible = false; ten.visible = false;
    const naFenda = u > 4.2;
    if (!naFenda) correr(H, p.x, p.z, rumo, dR, A2.vR(u), t, { olhaTras: u > 2.4 && u < 3.4 ? 0.7 : 0, ofegante: 0.6 });
    else {                                                            // espremido na fenda: agachado, de costas para a pedra, olhando a boca do T. rex
      const e = suave((u - 4.2) / 0.5); correr(H, lerp(p.x, FENDA.x, e), lerp(p.z, FENDA.z, e), rumo + Math.PI * e, dR, 0, t, { ofegante: 1 });
      H.dobrar('thigh_l', -70 * e, 0, 0).dobrar('thigh_r', -70 * e, 0, 0).dobrar('calf_l', 90 * e, 0, 0).dobrar('calf_r', 90 * e, 0, 0).dobrar('spine_02', 18 * e, 0, 0);
      H.grupo.position.y -= 0.35 * e;
    }
    H.rosto({ esforco: 0.8, boca: naFenda ? 0.5 + 0.3 * Math.sin(t * 6) : 0.4 });
    rel.userData.mostrar(A2.vR(u) * 3.6);
    const rumoT = kT <= 0 ? 0 : Math.atan2(tgT.z, tgT.x), vt = A2.vT(u);
    const bateu = u > 4.9 ? suave(inv(4.9, 5.4, u)) : 0;
    trexEm(xt, zt, rumoT, dT, vt, t, { olhar: H.pos('head'), mordida: u > 4.9 && u < 5.6 ? inv(4.9, 5.7, u) * 0.6 : 0, rugido: u > 5.6 ? suave(inv(5.6, 6.0, u)) : 0 });
    return { p, rumo, xt, zt, dR, dT, vt, naFenda };
  }
  function estado3(t) {
    const u = t - A3.t0, d = 2 + A3.vR * u, vira = suave(inv(9.0, 10.4, u));
    const x = d - vira * 1.5, z = lerp(0, ESCONDE_M.z + 2.2, vira), rumo = -vira * 0.9;
    H.grupo.visible = false; Mt.grupo.visible = true; ten.visible = false;
    const escondido = u > 10.6;
    if (!escondido) correr(Mt, x, z, rumo, A3.vR * u, A3.vR, t, { olhaTras: u > 5.2 && u < 6.6 ? 0.8 : 0, ofegante: 0.25, semente: 3 });
    else { correr(Mt, x, z, rumo - Math.PI * 0.6, A3.vR * u, 0, t, { ofegante: 0.6, semente: 3 }); Mt.dobrar('thigh_l', -60, 0, 0).dobrar('thigh_r', -60, 0, 0).dobrar('calf_l', 80, 0, 0).dobrar('calf_r', 80, 0, 0); Mt.grupo.position.y -= 0.3; }
    Mt.rosto({ esforco: 0.35, boca: 0.25 });
    relM.userData.mostrar(escondido ? 0 : A3.vR * 3.6);
    const dT = A3.vT * Math.max(0, u - 0.2), xt = A1.tx0 + dT, para = suave(inv(10.6, 12.0, u));
    trexEm(Math.min(xt, ESCONDE_M.x - 9), 0, 0, Math.min(dT, ESCONDE_M.x - 9 - A1.tx0), A3.vT * (1 - para), t, { olhar: Mt.pos('head'), rugido: suave(inv(11.0, 11.5, u)) * (1 - inv(11.9, 12.0, u)) });
    return { x, z, xt, dT };
  }
  MUNDO.e = { estado1, estado2, estado3 };

  // ---------------------------------------------------------------------------------------------- planos
  const ilumina = p => selva.iluminar(p);
  const pegadas = (xt, zt, dT, vt, t) => [];                           // (poeira das pisadas: ver efeitos)
  // S1: rugido na cara (o quadro 0)
  plano('S1 rugido', 1.6, (u, t) => {
    const e = estado1(t); const boca = MUNDO.T.boca(); ilumina(boca);
    const d = cameraFrente(boca, 3.6, -1.2, Math.PI * 0.08, 46, { olhaY: 0.1, tremor: 1.2 * suave(inv(0.3, 0.7, t)), t });
    lente({ foco: d, abertura: 0.010, desfoque: 0.010, brilho: 0.35, limiar: 0.9, ao: 0.7 });
  }, { precisa: () => [MUNDO.T.boca(), MUNDO.T.pontos()[0]] });
  // S2: o trilheiro de frente, olhando para trás, grita e dispara
  plano('S2 grito', 1.6, (u, t) => {
    const e = estado1(t); const c = H.pos('head'); ilumina(c);
    const d = cameraFrente(V(c.x, c.y - 0.15, c.z), 3.0, 0.05, Math.PI * 0.10, 40, { tremor: 0.6, t });
    lente({ foco: d, abertura: 0.012, desfoque: 0.012, brilho: 0.3, ao: 0.8 });
  }, { precisa: () => [H.pos('head'), H.pos('pelvis')] });
  // S3: de frente, ele corre na direção da lente; o T. rex atrás cresce
  plano('S3 reta', 4.8, (u, t) => {
    const e = estado1(t); const c = H.pos('spine_03'); ilumina(c);
    const tr = tremorPisada(e.dT, e.vt, 0.9);
    const d = cameraFrente(c, 7.5, 0.35, Math.PI * 0.06, 42, { olhaY: 1.2, tremor: 0.5 + tr, t });
    lente({ foco: d, abertura: 0.004, brilho: 0.3, ao: 0.8 });
  }, { precisa: () => [H.pos('head'), H.pos('foot_l'), H.pos('foot_r'), MUNDO.T.pontos()[0]] });
  // S4: close de frente; a sombra da cabeça cobre ele
  plano('S4 sombra', 2.0, (u, t) => {
    const e = estado1(t); const c = H.pos('head'); ilumina(MUNDO.T.boca());
    const d = cameraFrente(V(c.x, c.y - 0.1, c.z), 2.6, 0.15, Math.PI * 0.05, 40, { olhaY: 0.35, tremor: 0.8 + tremorPisada(e.dT, e.vt, 1.2), t });
    lente({ foco: d, abertura: 0.012, desfoque: 0.012, brilho: 0.3, ao: 0.8 });
  }, { precisa: () => [H.pos('head'), MUNDO.T.boca()] });
  // S5: a cabeça desce por trás e a boca fecha (corta no fechar)
  plano('S5 mordida', 1.0, (u, t) => {
    const e = estado1(t); const c = H.pos('spine_03'); ilumina(c);
    const d = cameraFrente(c, 5.2, 0.4, Math.PI * 0.07, 44, { olhaY: 1.0, tremor: 1.6, t });
    lente({ foco: d, abertura: 0.006, brilho: 0.3, ao: 0.8 });
  }, { precisa: () => [H.pos('head'), MUNDO.T.boca()] });
  // S6: mastigando; o tênis cai na estrada
  plano('S6 mastiga', 2.2, (u, t) => {
    const e = estado1(t); const b = MUNDO.T.boca(); ilumina(b);
    const d = cameraFrente(V(b.x, b.y - 1.2, b.z), 6.0, -1.4, Math.PI * 0.10, 40, { olhaY: 0.6, tremor: 0.3, t });
    lente({ foco: d, abertura: 0.006, brilho: 0.3, ao: 0.8 });
  }, { precisa: () => [MUNDO.T.boca(), MUNDO.T.pontos()[3]], efeito: u => ({ rebobina: u > 1.6 ? (u - 1.6) / 0.6 : 0 }) });
  // volta no tempo 1: a tentativa 1 de trás para a frente, rápido
  plano('R1 volta no tempo', 1.0, (u, t) => {
    const tt = lerp(13.2, 1.8, suave(u)); MUNDO.planosPorNome['S3 reta'].fn(clamp(tt - 3.2, 0, 4.8), tt);
  }, { efeito: u => ({ rebobina: 1 }) });
  // S7: de frente, ele sai da estrada para a mata; o T. rex atrás, travando entre as árvores
  plano('S7 mata', 4.3, (u, t) => {
    const e = estado2(t); const c = H.pos('spine_03'); ilumina(c);
    const az = e.rumo + Math.PI * 0.04;
    const d = cameraFrente(c, 6.0, 0.25, az, 44, { olhaY: 1.0, tremor: 0.5 + tremorPisada(e.dT, e.vt, 0.7), t });
    lente({ foco: d, abertura: 0.005, brilho: 0.35, ao: 0.85 });
  }, { precisa: () => [H.pos('head'), H.pos('foot_l'), MUNDO.T.pontos()[0]] });
  // S8: câmera dentro da fenda, de frente para ele; a boca bate na entrada e não cabe
  plano('S8 fenda', 3.0, (u, t) => {
    const e = estado2(t); const c = V(FENDA.x, 1.0, FENDA.z); ilumina(c);
    const fora = V(Math.cos(FENDA.giro + Math.PI), 0, Math.sin(FENDA.giro + Math.PI));
    cam.position.set(FENDA.x + Math.cos(FENDA.giro) * 0.9, 1.0, FENDA.z + Math.sin(FENDA.giro) * 0.9); cam.up.set(0, 1, 0);
    cam.lookAt(FENDA.x - Math.cos(FENDA.giro) * 3, 1.9, FENDA.z - Math.sin(FENDA.giro) * 3);
    if (cam.fov !== 50) { cam.fov = 50; cam.updateProjectionMatrix(); }
    const tr = t - A2.t0 > 4.9 ? 1.4 * Math.exp(-((t - A2.t0) - 5.3) * 3) : 0.2; if (tr > 0.05) { cam.rotateZ(tr * 0.02 * ruido(t * 35, 4)); cam.rotateX(tr * 0.015 * ruido(t * 41, 5)); }
    lente({ foco: 1.6, abertura: 0.006, brilho: 0.3, ao: 0.9 });
  }, { precisa: () => [H.pos('head'), MUNDO.T.boca()], efeito: u => ({ rebobina: u > 2.4 ? (u - 2.4) / 0.6 : 0 }) });
  // volta no tempo 2
  plano('R2 volta no tempo', 1.0, (u, t) => {
    const tt = lerp(21.5, 14.4, suave(u)); MUNDO.planosPorNome['S7 mata'].fn(clamp(tt - 14.2, 0, 4.3), tt);
  }, { efeito: u => ({ rebobina: 1 }) });
  // S9: o maratonista de frente; o T. rex atrás não chega mais perto
  plano('S9 maratonista', 5.0, (u, t) => {
    const e = estado3(t); const c = Mt.pos('spine_03'); ilumina(c);
    const d = cameraFrente(c, 7.5, 0.35, Math.PI * 0.06, 42, { olhaY: 1.2, tremor: 0.4 + tremorPisada(e.dT, A3.vT, 0.6), t });
    lente({ foco: d, abertura: 0.004, brilho: 0.3, ao: 0.8 });
  }, { precisa: () => [Mt.pos('head'), Mt.pos('foot_l'), MUNDO.T.pontos()[0]] });
  // S10: close; ele sorri, olha para trás; o T. rex continua lá
  plano('S10 nao cansa', 4.0, (u, t) => {
    const e = estado3(t); const c = Mt.pos('head'); ilumina(c);
    const d = cameraFrente(V(c.x, c.y - 0.1, c.z), 3.2, 0.1, Math.PI * 0.09, 40, { olhaY: 0.6, tremor: 0.4, t });
    lente({ foco: d, abertura: 0.010, desfoque: 0.010, brilho: 0.3, ao: 0.8 });
  }, { precisa: () => [Mt.pos('head'), MUNDO.T.pontos()[0]] });
  // S11: ele também se esconde nas rochas; o T. rex para e ruge
  plano('S11 esconde', 3.0, (u, t) => {
    const e = estado3(t); const c = V(ESCONDE_M.x, 1.0, ESCONDE_M.z + 1.0); ilumina(c);
    const d = cameraFrente(c, 7.0, 1.3, -Math.PI * 0.42, 40, { olhaY: 1.0, tremor: 0.4, t });
    lente({ foco: d, abertura: 0.004, brilho: 0.3, ao: 0.85 });
  }, { precisa: () => [Mt.pos('head'), MUNDO.T.pontos()[0]] });
  // S12: volta ao rugido do começo (laço)
  plano('S12 laço', 1.5, (u, t) => { MUNDO.planosPorNome['S1 rugido'].fn(Math.min(u, 1.55), Math.min(u, 1.55)); });
  MUNDO.planosPorNome = Object.fromEntries(S.planos.map(p => [p.id, p]));
  return S;
}

export function atualizar(t) { const p = acharPlano(t); p.fn(clamp(t - p.t0, 0, p.dur), t, p); scene.updateMatrixWorld(true); }
export function efeitos(t) { const p = acharPlano(t), u = t - p.t0; return p.efeito ? p.efeito(u, t) : {}; }

/** confere o enquadramento: projeta o que precisa caber em cada plano (6 instantes); devolve a lista de planos com algo fora da tela 9:16 */
export function verificarEnquadramento(margem = 0.06) {
  const res = [];
  for (const p of S.planos) {
    if (!p.precisa) continue; let pior = 0;
    for (let k = 0; k <= 5; k++) {
      const t = p.t0 + p.dur * (0.02 + 0.96 * k / 5); atualizar(t); cam.updateMatrixWorld(true);
      for (const v of p.precisa()) { const q = v.clone().project(cam); const fora = Math.max(Math.abs(q.x) - (1 - margem), Math.abs(q.y) - (1 - margem), q.z > 1 ? 1 : 0); pior = Math.max(pior, fora); }
    }
    res.push({ plano: p.id, fora: +pior.toFixed(3) });
  }
  return res;
}
