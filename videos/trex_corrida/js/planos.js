// LINHA DO TEMPO do Short "Você fugiria de um T. rex?": 12 planos, câmera sempre DE FRENTE para o protagonista com o T. rex atrás dele.
// Três tentativas com volta no tempo: (1) reta na estrada, é pego; (2) entra na mata e se esconde na fenda; (3) maratonista de elite, mantém a
// distância mas também se esconde. Tudo é função do tempo absoluto t (s). Enquadramento: cada plano tem a lista do que PRECISA caber;
// verificarEnquadramento() projeta esses pontos na tela 9:16 e, se algo sair, gira a câmera em volta do protagonista até caber (fixo no plano).
import * as THREE from 'three';
import { scene, cam, renderer, lente, Q, tela, canvasTex } from './motor.js';
import { clamp, lerp, suave, inv, ruido } from './util.js';
import { criarLucasReal, URL_REAL } from './lucasreal.js';
import { carregarMocap, aplicarMocap, misturarClipes, vida } from './mocap.js';
import { criarTrex } from './trex.js';
import { construirSelva, alturaChao, TRILHA, FENDA, ESCONDE_M } from './selva3d.js';
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
  const pul = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.0042, 6, 28), new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.7 })); pul.rotation.y = Math.PI / 2; pul.scale.set(0.8, 0.8, 1); pul.position.y = -0.031; G.add(pul);
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
  const corrida = await carregarMocap('../biblioteca3d/mocap/cmu/09_05.json');     // corrida (ciclo sem emenda: quadros 8-31)
  const medo = await carregarMocap('../biblioteca3d/mocap/cmu/79_73.json');        // em pé, assustado (antes de disparar)
  const agacha = await carregarMocap('../biblioteca3d/mocap/cmu/127_31.json');     // corre e se abaixa para passar por baixo: agachado de verdade de 1,3 a 2,9 s
  // direção da corrida na captura (para virar o ator para onde ele corre)
  const a0 = corrida.pos(8 / 30, 'root', V()), a1 = corrida.pos(31 / 30, 'root', V()); const RUMO_CLIP = Math.atan2(a1.z - a0.z, a1.x - a0.x);
  aplicarMocap(H, corrida, 8 / 30);                                              // calcula a escala da captura para este corpo
  const passoClip = Math.hypot(a1.x - a0.x, a1.z - a0.z) * corrida._esc;        // comprimento de um ciclo (m)
  // para onde o corpo da captura está virado (quadril: esquerda x cima = frente), em ângulo no plano xz
  const frenteClip = (c, tc) => { const l = c.pos(tc, 'lhipjoint', V()).sub(c.pos(tc, 'rhipjoint', V())); return Math.atan2(l.x, -l.z); };
  const rel = relogio(), relM = relogio(), num = numeroPeito(), ten = tenis(); scene.add(ten);
  // acessórios presos a ossos: a posição é decidida no corpo em REPOUSO (espaço do modelo: rosto para +z) e convertida para o osso
  // (os eixos próprios dos ossos não são os do corpo; foi isso que deixou a mochila como um cubo solto no ar)
  function prender(A, osso, obj, pos, quat) {
    A.reset(); A.grupo.position.set(0, 0, 0); A.grupo.rotation.set(0, 0, 0); A.grupo.updateMatrixWorld(true);
    const M = new THREE.Matrix4().compose(pos, quat, V(1, 1, 1)); obj.matrix.copy(A.ossos[osso].matrixWorld.clone().invert().multiply(M));
    obj.matrix.decompose(obj.position, obj.quaternion, obj.scale); A.ossos[osso].add(obj);
  }
  function relogioNoPulso(A, obj) {                                   // no dorso do pulso esquerdo, visor para fora
    A.reset(); A.grupo.position.set(0, 0, 0); A.grupo.rotation.set(0, 0, 0); A.grupo.updateMatrixWorld(true);
    const mao = A.pos('hand_l'), cot = A.pos('lowerarm_l'), d = mao.clone().sub(cot).normalize();
    const n = V(0, 1, 0).addScaledVector(d, -d.y).normalize(), z = new THREE.Vector3().crossVectors(d, n);
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(d, n, z));
    prender(A, 'lowerarm_l', obj, mao.clone().addScaledVector(d, -0.06).addScaledVector(n, 0.03), q);
  }
  function frentePeito(A) {                                           // ponto mais à frente da roupa na altura do peito (repouso)
    A.reset(); A.grupo.updateMatrixWorld(true); const yc = A.pos('spine_03').y + 0.02; let zMax = 0; const v = V();
    for (const m of A.malhas) { if (/cabelo|cilio|sobrancelha|olho/i.test(m.name + (m.material.name || ''))) continue; const P = m.geometry.attributes.position;
      for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); if (Math.abs(v.y - yc) < 0.04 && Math.abs(v.x) < 0.07) zMax = Math.max(zMax, v.z); } }
    return V(0, yc, zMax + 0.006);
  }
  relogioNoPulso(H, rel); relogioNoPulso(Mt, relM);
  prender(Mt, 'spine_03', num, frentePeito(Mt), new THREE.Quaternion());
  const poeira = criarFumaca(scene, tela.alt);
  MUNDO = { selva, T, H, Mt, corrida, RUMO_CLIP, passoClip, rel, relM, ten, poeira };

  // ---------------------------------------------------------------------------------------------- poses
  // ações (capturas reais): cada uma diz que clipe, que instante e para onde o corpo da captura olha
  const acao = {
    correr: (dist, vel) => {                                         // ciclo de corrida em laço; o passo alonga um pouco com a velocidade
      const passo = passoClip * clamp(0.8 + 0.2 * vel / 3.47, 0.85, 1.3), fase = ((dist / passo) % 1 + 1) % 1;
      return { c: corrida, tc: 8 / 30 + fase * (23 / 30), th: RUMO_CLIP };
    },
    medo: u => { const tc = 1.0 + u; return { c: medo, tc, th: frenteClip(medo, tc) }; },
    // desce em 0,6 s e fica agachado mudando o peso devagar (o trecho agachado da captura, em câmera lenta, indo e voltando)
    agachar: u => { const tc = u < 0.6 ? 0.7 + u : 2.1 - 0.8 * Math.cos((u - 0.6) * 0.9); return { c: agacha, tc, th: frenteClip(agacha, tc) }; },
  };
  /** posa o ator com a ação `a` (e mistura para `b` com peso k), quadril em (x, z), corpo virado para `rumo` (rad, no plano xz) */
  function atuar(A, x, z, rumo, a, b = null, k = 0) {
    const origem = [x, alturaChao(x, z), z];
    if (!b || k <= 0) aplicarMocap(A, a.c, a.tc, { origem, yaw: a.th - rumo, segue: false });
    else if (k >= 1) aplicarMocap(A, b.c, b.tc, { origem, yaw: b.th - rumo, segue: false });
    else { const mix = misturarClipes(a.c, b.c, () => a.tc, () => b.tc, () => k, { yawB: b.th - a.th }); mix._esc = corrida._esc; aplicarMocap(A, mix, 0, { origem, yaw: a.th - rumo, segue: false }); }
    return A;
  }
  /** por cima da captura: respiração/peso (vida) e o tronco girando para olhar para trás por cima do ombro */
  function viver(A, t, { olhaTras = 0, ofegante = 0.5, semente = 0 } = {}) {
    vida(A, t, { forca: 0.6, ofegante, semente });
    if (olhaTras) A.dobrar('spine_02', 0, 12 * olhaTras, 0).dobrar('spine_03', 0, 16 * olhaTras, 0).dobrar('neck_01', 0, 28 * olhaTras, 0).dobrar('head', 0, 30 * olhaTras, 0);
    return A;
  }
  function correr(A, x, z, rumo, dist, vel, t, opc = {}) { atuar(A, x, z, rumo, acao.correr(dist, vel)); return viver(A, t, opc); }
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
  // os dois atores são posados SEMPRE (mesmo invisíveis): a câmera de um plano pode depender deles e o quadro não pode depender da ordem do render
  const BOCA_X = 5.6;                                                // da raiz do T. rex até a boca (m, modelo)
  const softmin = (a, b, k = 0.6) => b - k * Math.log1p(Math.exp((b - a) / k));     // ~min(a, b), sem quina
  const derivada = (f, u, h = 1 / 120) => (f(u + h) - f(u - h)) / (2 * h);
  function estado1(t) {                                              // tentativa 1, tempo absoluto: na reta, ele é pego
    const dR = A1.dR(t), dT = A1.dT(t), xr = A1.x0 + dR, xt = A1.tx0 + dT, vr = A1.vR(t), vt = A1.vT(t);
    const mord = inv(9.2, 10.45, t), comido = t > 10.3;
    H.grupo.visible = !comido; Mt.grupo.visible = false;
    const k = suave(inv(2.25, 2.7, t));                              // de "parado com medo" para a corrida
    atuar(H, xr, 0, 0, acao.medo(t - 1.5), acao.correr(dR, vr), k);
    viver(H, t, { olhaTras: t < 2.6 ? 1 - k : t > 7.9 && t < 9.5 ? 0.8 * suave(inv(7.9, 8.3, t)) * (1 - inv(9.2, 9.5, t)) : 0, ofegante: t < 2.4 ? 0.9 : clamp((t - 5) / 3) });
    if (t < 2.6) H.rosto({ esforco: 0.5, boca: 0.15 + 0.85 * suave(inv(1.75, 2.0, t)) }).expressao({ 'eyebrows-left-inner-up': 1, 'eyebrows-right-inner-up': 1, 'eye-left-closure': 0, 'eye-right-closure': 0 });
    else H.rosto({ esforco: 0.7, boca: 0.35 + 0.2 * Math.sin(t * 8) + 0.4 * inv(9.2, 9.6, t) });
    rel.userData.mostrar(vr * 3.6);
    const rug = suave(inv(0.0, 0.35, t)) * (1 - suave(inv(1.35, 1.75, t)));
    const olhar = comido ? V(xt + 16, 2.6, 0) : H.pos('head');
    trexEm(xt, 0, 0, dT, vt, t, { olhar, rugido: rug, mordida: comido ? 0 : mord, mastigar: comido ? clamp((t - 10.35) / 0.3) : 0 });
    ten.visible = t > 11.2; if (ten.visible) { const u = t - 11.2, y = Math.max(0.03, 3.1 - 4.9 * u * u), b = Math.max(0, u - 0.8); ten.position.set(xt + BOCA_X - 0.3 + u * 0.5, y + 0.12 * Math.abs(Math.sin(b * 9)) * Math.exp(-b * 5), 0.35); ten.rotation.set(Math.min(u, 0.8) * 6, 0.6, Math.min(u, 0.8) * 4); }
    return { xr, xt, vr, vt, dT };
  }
  // tentativa 2: a trilha continua para dentro da fenda; quem corre para no fundo, o T. rex fica com a boca na entrada
  const dirF = V(Math.cos(FENDA.giro), 0, Math.sin(FENDA.giro));
  const curva2 = new THREE.CatmullRomCurve3([...TRILHA.map(([x, z]) => V(x, 0, z)), V(FENDA.x, 0, FENDA.z), V(FENDA.x, 0, FENDA.z).addScaledVector(dirF, 0.4)]);
  const L2 = curva2.getLength(), ENTRADA = L2 - 1.65;            // arco onde fica a boca da fenda
  const ptArco = (s, alvo = V()) => s <= 0 ? alvo.set(TRILHA[0][0] + s, 0, TRILHA[0][1]) : curva2.getPointAt(Math.min(s / L2, 1), alvo);
  const tgArco = s => s <= 0 ? V(1, 0, 0) : curva2.getTangentAt(clamp(s / L2, 0, 1));
  const sR2 = u => softmin(A2.dR(u), L2 - 0.05, 0.5);
  const sT2 = u => softmin(sR2(u) - lerp(6.5, 9.5, clamp(u / 4)), ENTRADA + 0.4, 0.5);        // boca do T. rex (arco), atrás de quem corre
  let chega2 = 0; for (let u = 0; u < 8; u += 1 / 60) if (L2 - sR2(u) < 0.45) { chega2 = u; break; }
  function estado2(t) {
    const u = t - A2.t0, sR = sR2(u), sT = sT2(u), vr = derivada(sR2, u), vt = derivada(sT2, u);
    const p = ptArco(sR), tg = tgArco(sR), rumo = Math.atan2(tg.z, tg.x);
    const tgT = tgArco(sT - 2.5), rumoT = Math.atan2(tgT.z, tgT.x), pb = ptArco(sT);
    const xt = pb.x - Math.cos(rumoT) * BOCA_X, zt = pb.z - Math.sin(rumoT) * BOCA_X;
    H.grupo.visible = true; Mt.grupo.visible = false; ten.visible = false;
    const ua = u - chega2, k = suave(ua / 0.45), naFenda = ua > 0;
    atuar(H, p.x, p.z, lerp(rumo, FENDA.giro, k), acao.correr(sR, vr), acao.medo(0.4 + Math.max(0, ua)), k);
    viver(H, t, { olhaTras: u > 2.3 && u < 3.3 ? 0.7 * suave(inv(2.3, 2.6, u)) * (1 - inv(3.0, 3.3, u)) : naFenda ? 0.9 * suave(inv(0.5, 1.0, ua)) : 0, ofegante: naFenda ? 1 : 0.6 });
    H.rosto({ esforco: 0.8, boca: naFenda ? 0.45 + 0.25 * Math.sin(t * 7) : 0.4 });
    rel.userData.mostrar(vr * 3.6);
    const tb = chega2 + 0.75;                                          // a boca bate na entrada
    trexEm(xt, zt, rumoT, A1.tx0 + sT, vt, t, { olhar: H.pos('head'), mordida: u > tb && u < tb + 1.2 ? inv(tb, tb + 1.3, u) * 0.85 : 0, rugido: suave(inv(tb + 1.2, tb + 1.5, u)) });
    return { p, rumo, xt, zt, sR, sT, vt, naFenda, tb };
  }
  // tentativa 3: o maratonista segue pela estrada e, no fim, contorna as rochas e se agacha atrás delas
  const AG = ESCONDE_M.agacha, curva3 = new THREE.CatmullRomCurve3([V(2, 0, 0), V(24, 0, 0), V(44.5, 0, 0), V(47.6, 0, -2.6), V(48.9, 0, -6.6), V(50.6, 0, -8.6), V(AG.x, 0, AG.z)]);
  const L3 = curva3.getLength();
  const sR3 = u => softmin(A3.vR * Math.max(0, u) * suave(clamp((u + 0.6) / 0.6)), L3 - 0.05, 0.5);
  let chega3 = 0; for (let u = 0; u < 14; u += 1 / 60) if (L3 - sR3(u) < 0.45) { chega3 = u; break; }
  const xT3 = u => A1.tx0 + softmin(A3.vT * Math.max(0, u - 0.2), A3.vT * (chega3 - 0.2) + 3.0, 1.2);   // o T. rex perde o rastro e para
  function estado3(t) {
    const u = t - A3.t0, sR = sR3(u), vr = derivada(sR3, u), p = curva3.getPointAt(clamp(sR / L3)), tg = curva3.getTangentAt(clamp(sR / L3)), rumo = Math.atan2(tg.z, tg.x);
    H.grupo.visible = false; Mt.grupo.visible = true; ten.visible = false;
    const ua = u - chega3, k = suave(ua / 0.45), escondido = ua > 0;
    atuar(Mt, p.x, p.z, lerp(rumo, -Math.PI / 2, k), acao.correr(sR, vr), acao.agachar(Math.max(0, ua)), k);
    viver(Mt, t, { olhaTras: u > 5.4 && u < 7.4 ? 0.8 * suave(inv(5.4, 5.8, u)) * (1 - inv(7.0, 7.4, u)) : escondido ? 0.35 * suave(inv(0.6, 1.2, ua)) : 0, ofegante: escondido ? 0.7 : 0.3, semente: 3 });
    Mt.rosto({ esforco: escondido ? 0.6 : 0.3, boca: escondido ? 0.3 : 0.25 });
    relM.userData.mostrar(vr * 3.6);
    const xt = xT3(u), vt = derivada(xT3, u), dT = xt - A1.tx0, ur = ua - 0.35;
    const olhar = escondido ? V(xt + 12, 2.2, 6 * Math.sin(ua * 1.3)) : Mt.pos('head');
    trexEm(xt, 0, 0, dT, vt, t, { olhar, rugido: suave(inv(0, 0.3, ur)) * (1 - suave(inv(1.3, 1.6, ur))) });
    return { p, xt, dT, vt, escondido };
  }
  MUNDO.e = { estado1, estado2, estado3 };
  // instantes marcados para o som (a fenda fecha os dentes ~1,15 s depois do bote começar; o rugido do esconderijo começa 0,35 s após agachar)
  const tb2 = chega2 + 0.75;
  MUNDO.marcas = { fenda_chega: A2.t0 + chega2, fenda_estalo: A2.t0 + tb2 + 1.15, esconde_agacha: A3.t0 + chega3 + 0.45, esconde_rugido: A3.t0 + chega3 + 0.35, mordida_fecha: 10.24 };

  // ---------------------------------------------------------------------------------------------- planos
  // Regra do dono: a câmera fica DE FRENTE para quem corre, o T. rex atrás dele. Plano aberto mostra os dois inteiros; close mostra o rosto e a boca atrás.
  const ilumina = p => selva.iluminar(p);
  const T_ = MUNDO.T;
  function camEm(pos, olha, fov, { tremor = 0, t = 0 } = {}) {
    cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(olha);
    if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    if (tremor) { cam.position.y += tremor * 0.04 * ruido(t * 40, 1); cam.rotateX(tremor * 0.010 * ruido(t * 37, 2)); cam.rotateZ(tremor * 0.008 * ruido(t * 33, 3)); }
    return pos.distanceTo(olha);
  }
  /** a regra do dono em código: câmera na linha "T. rex -> protagonista", além do protagonista (ele de frente, o T. rex atrás dele);
   *  lado desloca um pouco para o T. rex aparecer por cima do ombro; mira (0..1) puxa o olhar da câmera do rosto dele para o T. rex */
  function camDosDois(A, alvoT, dist, { alt = 0, lado = 0.4, fov = 42, mira = 0.3, tremor = 0, t = 0 } = {}) {
    const h = A.pos('head'), d = h.clone().sub(alvoT); d.y = 0; d.normalize(); const l = V(-d.z, 0, d.x);
    const p = h.clone().addScaledVector(d, dist).addScaledVector(l, lado); p.y = h.y + alt;
    return camEm(p, h.clone().lerp(alvoT, mira), fov, { tremor, t });
  }
  const corpoH = A => [A.pos('head'), A.pos('foot_l'), A.pos('foot_r'), A.pos('hand_l'), A.pos('hand_r')];
  const cabecaT = () => [T_.boca(), T_.pontos()[0]];

  // S1 (0-1,6): o gancho. Close baixo da cabeça rugindo, câmera aproximando devagar; a boca abre no quadro 1.
  plano('S1 rugido', 1.6, (u, t) => {
    estado1(t); const b = T_.boca(); ilumina(b);
    const d = cameraFrente(b, lerp(4.4, 3.5, suave(u / 1.6)), -1.3, Math.PI * 0.10, 46, { olhaY: 0.25, tremor: 1.1 * suave(inv(0.25, 0.6, t)) * (1 - inv(1.3, 1.6, t)), t });
    lente({ foco: d, abertura: 0.010, desfoque: 0.010, brilho: 0.35, limiar: 0.9, ao: 0.7 });
  }, { precisa: () => [T_.boca(), T_.pontos()[0], T_.pontos()[1]] });
  // S2 (1,6-3,2): ele de frente (plano médio), olhando para trás, grita e dispara para a lente; o T. rex atrás, fora de foco
  plano('S2 grito', 1.6, (u, t) => {
    estado1(t); const c = H.pos('head'); ilumina(c);
    const d = cameraFrente(V(c.x, c.y - 0.25, c.z), 3.1, -0.05, -Math.PI * 0.035, 40, { olhaY: 0.35, tremor: 0.4, t });
    lente({ foco: d, abertura: 0.012, desfoque: 0.012, brilho: 0.3, ao: 0.8 });
  }, { precisa: () => [H.pos('head'), H.pos('spine_01'), T_.pontos()[0]] });
  // S3 (3,2-8,0): aberto de frente, câmera recuando na velocidade dele; o T. rex inteiro atrás
  plano('S3 reta', 4.8, (u, t) => {
    const e = estado1(t); const c = H.pos('spine_03'); ilumina(c);
    const d = cameraFrente(c, 8.0, 0.25, Math.PI * 0.07, 42, { olhaY: 1.15, tremor: 0.4 + tremorPisada(e.dT, e.vt, 0.7), t });
    lente({ foco: d, abertura: 0.004, brilho: 0.3, ao: 0.8 });
  }, { precisa: () => [...corpoH(H), ...T_.pontos()] });
  // S4 (8,0-9,4): close no rosto cansado; ele olha para trás; a boca cresce atrás dele
  plano('S4 perto', 1.4, (u, t) => {
    const e = estado1(t); const c = H.pos('head'); ilumina(T_.boca());
    const d = cameraFrente(V(c.x, c.y - 0.15, c.z), 2.7, 0.05, Math.PI * 0.06, 40, { olhaY: 0.55, tremor: 0.6 + tremorPisada(e.dT, e.vt, 1.2), t });
    lente({ foco: d, abertura: 0.010, desfoque: 0.010, brilho: 0.3, ao: 0.8 });
  }, { precisa: () => [H.pos('head'), T_.boca()] });
  // S5 (9,4-10,3): plano médio; a cabeça desce por trás de boca aberta e fecha: corta no fechar (sem mostrar nada)
  plano('S5 mordida', 0.9, (u, t) => {
    const e = estado1(t); const c = H.pos('spine_03'); ilumina(c);
    const d = cameraFrente(c, 5.0, 0.2, Math.PI * 0.08, 46, { olhaY: 1.2, tremor: 1.0 + tremorPisada(e.dT, e.vt, 1.2), t });
    lente({ foco: d, abertura: 0.006, brilho: 0.3, ao: 0.8 });
  }, { precisa: () => [H.pos('head'), H.pos('pelvis'), T_.boca(), T_.pontos()[0]] });
  // S6 (10,3-13,2): contra-plongée baixa na estrada: ele mastiga, um tênis cai e quica no chão em primeiro plano
  plano('S6 mastiga', 2.9, (u, t) => {
    const e = estado1(t); const b = T_.boca(); ilumina(b);
    const base = V(e.xt + BOCA_X, 0, 0);
    const d = camEm(V(base.x + 5.2, 0.45, 1.4), V(base.x, 1.5, 0), 50, { tremor: 0.25, t });
    lente({ foco: 5.0, abertura: 0.005, brilho: 0.3, ao: 0.8 });
  }, { precisa: () => [T_.boca(), T_.pontos()[0], ...(ten.visible ? [ten.position.clone()] : [])], efeito: u => ({ rebobina: u > 2.5 ? (u - 2.5) / 0.4 : 0 }) });
  // R1 (13,2-14,2): volta no tempo: o tênis volta para a boca e a corrida desanda até o começo
  plano('R1 volta no tempo', 1.0, (u, t) => {
    if (u < 0.35) { const tt = lerp(13.2, 10.35, u / 0.35); MUNDO.planosPorNome['S6 mastiga'].fn(tt - 10.3, tt); }
    else { const tt = lerp(10.2, 2.4, suave((u - 0.35) / 0.65)); MUNDO.planosPorNome['S3 reta'].fn(tt - 3.2, tt); }
  }, { efeito: () => ({ rebobina: 1 }) });
  // S7 (14,2-18,5): de frente na trilha (câmera sobre a própria trilha, à frente dele); o T. rex atrás, travando entre as árvores
  plano('S7 mata', 4.3, (u, t) => {
    const e = estado2(t); const c = H.pos('spine_03'); ilumina(c);
    const sc = Math.min(e.sR + 6.5, L2 + 2.4), pc = sc <= L2 ? ptArco(sc) : ptArco(L2).addScaledVector(dirF, sc - L2); pc.y = alturaChao(pc.x, pc.z) + 1.7;   // termina onde o S8 começa
    const dc = pc.distanceTo(c), d = camEm(pc, V(c.x, c.y + 0.9 * clamp((dc - 2.5) / 3), c.z), 46, { tremor: 0.4 + tremorPisada(e.sT, e.vt, 0.7), t });
    lente({ foco: d, abertura: 0.004, brilho: 0.35, ao: 0.85 });
  }, { precisa: () => [...corpoH(H), T_.boca(), T_.pontos()[0]] });
  // S8 (18,5-21,5): dentro da fenda, de frente para ele agachado; atrás dele a boca bate na entrada e não cabe
  plano('S8 fenda', 3.0, (u, t) => {
    const e = estado2(t); const fundo = V(FENDA.x, 0, FENDA.z).addScaledVector(dirF, 1.85); ilumina(V(FENDA.x, 1, FENDA.z));
    const tb = A2.t0 + e.tb, tr = t > tb + 0.55 ? 1.6 * Math.exp(-(t - tb - 0.55) * 3) : 0.15;
    camDosDois(H, T_.boca(), 2.4, { alt: 0.05, lado: 0.12, fov: 52, mira: 0.4, tremor: tr, t });
    lente({ foco: 1.5, abertura: 0.007, desfoque: 0.008, brilho: 0.3, ao: 0.9 });
  }, { precisa: () => [H.pos('head'), H.pos('foot_l'), T_.boca()], efeito: u => ({ rebobina: u > 2.6 ? (u - 2.6) / 0.4 : 0 }) });
  // R2 (21,5-22,5): volta no tempo de novo
  plano('R2 volta no tempo', 1.0, (u, t) => {
    if (u < 0.4) { const tt = lerp(21.5, 18.5, u / 0.4); MUNDO.planosPorNome['S8 fenda'].fn(tt - 18.5, tt); }
    else { const tt = lerp(18.5, 14.3, suave((u - 0.4) / 0.6)); MUNDO.planosPorNome['S7 mata'].fn(tt - 14.2, tt); }
  }, { efeito: () => ({ rebobina: 1 }) });
  // S9 (22,5-24,6): o maratonista (número no peito), aberto de frente, passada solta; o T. rex atrás não ganha terreno
  plano('S9 maratonista', 2.1, (u, t) => {
    const e = estado3(t); const c = Mt.pos('spine_03'); ilumina(c);
    const d = cameraFrente(c, 8.0, 0.25, Math.PI * 0.07, 42, { olhaY: 1.15, tremor: 0.3 + tremorPisada(e.dT, e.vt, 0.5), t });
    lente({ foco: d, abertura: 0.004, brilho: 0.3, ao: 0.8 });
  }, { precisa: () => [...corpoH(Mt), ...T_.pontos()] });
  // S9r (24,6-25,9): o relógio no pulso, câmera presa ao antebraço (balança com o braço): 21 km/h
  plano('S9r relogio', 1.3, (u, t) => {
    estado3(t); Mt.grupo.updateMatrixWorld(true); const rp = relM.getWorldPosition(V()), q = relM.getWorldQuaternion(new THREE.Quaternion());
    const n = V(0, 1, 0).applyQuaternion(q), d = V(1, 0, 0).applyQuaternion(q);              // normal do visor e direção do antebraço
    const cimaTexto = V(0, 0, -1).applyQuaternion(q); cam.position.copy(rp).addScaledVector(n, 0.20).addScaledVector(cimaTexto, -0.06); cam.up.copy(cimaTexto); cam.lookAt(rp);
    if (cam.fov !== 38) { cam.fov = 38; cam.updateProjectionMatrix(); }
    ilumina(rp); lente({ foco: cam.position.distanceTo(rp), abertura: 0.02, desfoque: 0.014, brilho: 0.4, ao: 0.6 });
  }, { precisa: () => [relM.getWorldPosition(V())] });
  // S9b (25,9-27,5): baixo, 3/4 de frente, câmera rente ao chão: os pés passam, o T. rex ao fundo
  plano('S9b passada', 1.6, (u, t) => {
    const e = estado3(t); const c = Mt.pos('pelvis'); ilumina(c);
    const d = camDosDois(Mt, T_.boca(), 4.6, { alt: -1.35, lado: 0.7, fov: 46, mira: 0.3, tremor: 0.3 + tremorPisada(e.dT, e.vt, 0.5), t });
    lente({ foco: d, abertura: 0.005, brilho: 0.3, ao: 0.8 });
  }, { precisa: () => [...corpoH(Mt), T_.boca()] });
  // S10 (27,5-31,5): close; ele olha para trás: o T. rex continua lá, na mesma distância (ele não cansa, mas o bicho também não)
  plano('S10 nao cansa', 4.0, (u, t) => {
    const e = estado3(t); const c = Mt.pos('head'); ilumina(c);
    const d = camDosDois(Mt, T_.boca(), lerp(3.4, 2.8, suave(u / 4)), { alt: -0.1, lado: 0.35, fov: 40, mira: 0.25, tremor: 0.35, t });
    lente({ foco: d, abertura: 0.010, desfoque: 0.010, brilho: 0.3, ao: 0.8 });
  }, { precisa: () => [Mt.pos('head'), T_.boca()] });
  // S11 (31,5-34,5): atrás das rochas: ele vem correndo para a lente e se agacha; o T. rex para na estrada, procura e ruge por cima das pedras
  plano('S11 esconde', 3.0, (u, t) => {
    estado3(t); const ag = ESCONDE_M.agacha; ilumina(V(ag.x, 1, ag.z));
    camDosDois(Mt, T_.boca(), 4.6, { alt: 0.55, lado: 0.5, fov: 46, mira: 0.45, tremor: 0.25, t });
    lente({ foco: 4.0, abertura: 0.005, brilho: 0.3, ao: 0.85 });
  }, { precisa: () => [Mt.pos('head'), T_.boca(), T_.pontos()[0]] });
  // S12 (34,5-36): o instante ANTES do primeiro quadro (boca fechada, respira, cabeça se armando): o último quadro emenda no rugido do quadro 0 (laço)
  plano('S12 laco', 1.5, (u, t) => MUNDO.planosPorNome['S1 rugido'].fn(u - 1.5, u - 1.5), { precisa: () => [T_.boca(), T_.pontos()[0]] });
  MUNDO.planosPorNome = Object.fromEntries(S.planos.map(p => [p.id, p]));
  return S;
}

export function atualizar(t) { const p = acharPlano(t); p.fn(clamp(t - p.t0, 0, p.dur), t, p); scene.updateMatrixWorld(true); }
export const marcas = () => MUNDO.marcas;
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

/**
 * Eventos para o som, lidos da própria animação: cada pé que toca o chão (quem corre e o T. rex), com a distância até a câmera e a posição
 * na tela (pan). Os trechos de volta no tempo ficam de fora (lá o som é o rebobinar). dt = passo de amostragem (s).
 */
export function eventosSom(dt = 1 / 120) {
  const ev = [], ant = {}, v = new THREE.Vector3();
  const pes = () => {
    const { H, Mt, T } = MUNDO, L = [];
    for (const [A, q] of [[H, 'H'], [Mt, 'M']]) if (A.grupo.visible) for (const l of ['l', 'r']) L.push([q + l, A.pos('ball_' + l, new THREE.Vector3()), 0.09]);
    for (const l of ['l', 'r']) L.push(['T' + l, T.ossos['dedos_' + l].getWorldPosition(new THREE.Vector3()), 0.22]);
    return L;
  };
  for (let t = 0; t < S.total; t += dt) {
    const p = acharPlano(t); if (p.id.startsWith('R')) { for (const k in ant) delete ant[k]; continue; }
    atualizar(t); cam.updateMatrixWorld(true);
    for (const [k, pos, lim] of pes()) {
      const chao = alturaChao(pos.x, pos.z), h = pos.y - chao, a = ant[k];
      if (a && a.h > lim && h <= lim && a.livre > 0.12) {
        v.copy(pos).project(cam); ev.push({ t: +t.toFixed(3), quem: k[0], lado: k[1], dist: +pos.distanceTo(cam.position).toFixed(2), pan: +Math.max(-1, Math.min(1, v.x)).toFixed(2), visivel: Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && v.z < 1, plano: p.id });
      }
      ant[k] = { h, livre: h > lim ? (a ? a.livre : 0) + dt : 0 };
    }
  }
  return ev;
}
