// LINHA DO TEMPO do Short "Por que o braço do T. rex era curto?" (roteiro_bracos.md). Tudo é função do tempo absoluto t (s).
// Três T. rex (o da biblioteca, com tons de pele diferentes): REX é o herói; B e C chegam para a carcaça. Hipótese de Padian (2022): numa carcaça
// disputada, braço comprido seria mordido pelos vizinhos. Cena 1 (P2-P5): REX sozinho numa clareira. Cena 2 (P1, P6-P10): a carcaça.
import * as THREE from 'three';
import { scene, cam, renderer, lente, Q, canvasTex } from '../../trex_corrida/js/motor.js';
import { clamp, lerp, suave, inv, ruido } from '../../trex_corrida/js/util.js';
import { criarTrex } from '../../trex_corrida/js/trex.js';
import { construirSelva, alturaChao, INSTANCIAS } from '../../trex_corrida/js/selva3d.js';
import { prepararCorte, cortar } from '../../trex_corrida/js/corte.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const S = { planos: [], total: 0 };
const plano = (id, dur, fn, extra = {}) => { S.planos.push({ id, t0: S.total, dur, fn, ...extra }); S.total += dur; };
export function acharPlano(t) { for (let i = S.planos.length - 1; i >= 0; i--) if (t >= S.planos[i].t0 - 1e-6) return S.planos[i]; return S.planos[0]; }
const V = (x, y, z) => new THREE.Vector3(x, y, z);
let M = null;

// ------------------------------------------------------------------------------------------------ lugares (metros; y para cima)
const SOLO = { x0: 22, z: -40 };                          // clareira da cena 1: REX anda ao longo de +x
const CARC = { x: 86.8, z: -44 };                         // centro da carcaça (deitada ao longo de z, na frente de REX)
const RX = { x: 80, z: -44 };                             // quadris de REX na cena da carcaça (olhando para +x: o lado esquerdo dele é -z)
const CLAROS = [{ x0: 12, x1: 48, z0: -52, z1: -29 }, { x0: 68, x1: 104, z0: -58, z1: -31 }];          // longe da estrada (z = 0)

// ------------------------------------------------------------------------------------------------ objetos
function tingir(T, cor) { T.grupo.traverse(o => { if (o.isMesh && o.material?.map) { o.material = o.material.clone(); o.material.color.multiply(new THREE.Color(...cor)); } }); }
async function carcaca() {
  const g = await new GLTFLoader().loadAsync('../biblioteca3d/animais/edmontosaurus/edmontosaurus.glb');
  const base = new THREE.Group(); base.add(g.scene);
  g.scene.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.frustumCulled = false; if (o.material?.color) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.82); } } });
  base.scale.setScalar(9 / 12.72); base.rotation.set(0, 0, Math.PI / 2 - 0.12);    // 9 m, comprido em z, deitado de lado
  const G = new THREE.Group(); G.add(base); G.updateMatrixWorld(true);
  const cx = new THREE.Box3().setFromObject(base), c = cx.getCenter(V()); base.position.set(-c.x, -cx.min.y - 0.25, -c.z);
  G.position.set(CARC.x, alturaChao(CARC.x, CARC.z), CARC.z); return G;
}
/** texto que fica no mundo (sempre de frente para a câmera), branco com contorno escuro */
function rotulo(txt, alt = 0.55) {
  const tex = canvasTex(512, 160, (g, w, h) => {
    g.font = '900 104px "DejaVu Sans", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 16; g.strokeStyle = 'rgba(10,10,10,0.85)'; g.strokeText(txt, w / 2, h / 2 + 4); g.fillStyle = '#ffffff'; g.fillText(txt, w / 2, h / 2 + 4);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, fog: false })); s.scale.set(alt * 3.2, alt, 1); s.renderOrder = 20; return s;
}
/** cota: linha fina entre a e b com tracinhos nas pontas e o rótulo no meio; aparece com `mostrar(k)` (0..1, a linha cresce do meio) */
function cota(txt, altRot) {
  const G = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, fog: false });
  const linha = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 6), mat); linha.renderOrder = 19; G.add(linha);
  const ponta = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 6), mat); m.renderOrder = 19; G.add(m); return m; });
  const r = rotulo(txt, altRot); G.add(r); scene.add(G);
  G.userData.por = (a, b, k, esp = 0.03, tick = 0.35) => {
    G.visible = k > 0.01; if (!G.visible) return; const meio = a.clone().lerp(b, 0.5), d = b.clone().sub(a), L = d.length() * suave(k);
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
    linha.position.copy(meio); linha.quaternion.copy(q); linha.scale.set(esp, L, esp);
    const lado = V(0, 1, 0).cross(d).normalize().cross(d.clone().normalize()).normalize(); if (lado.lengthSq() < 0.5) lado.set(0, 1, 0);
    ponta.forEach((m, i) => { const p = meio.clone().addScaledVector(d.clone().normalize(), (i ? 0.5 : -0.5) * L); m.position.copy(p); m.quaternion.setFromUnitVectors(V(0, 1, 0), V(0, 1, 0)); m.scale.set(esp, tick, esp); });
    r.position.copy(meio).add(V(0, altRot * 0.95, 0)); r.material.opacity = suave(inv(0.5, 1, k));
  };
  return G;
}

// ------------------------------------------------------------------------------------------------ construção
export async function construirTudo() {
  const selva = await construirSelva(scene, renderer, { claros: CLAROS });
  scene.environment = selva.ambiente; scene.fog = selva.nevoa; scene.background = new THREE.Color(0x9fb39a);
  const REX = await criarTrex(), B = await criarTrex(), C = await criarTrex();
  tingir(B, [0.78, 0.86, 0.76]); tingir(C, [1.05, 0.82, 0.70]);
  scene.fog.density = 0.010;
  scene.add(REX.grupo, B.grupo, C.grupo);
  const car = await carcaca(); scene.add(car);
  const c12 = cota('12 m', 0.9), c1 = cota('1 m', 0.5), kg = rotulo('~200 kg', 0.16); scene.add(kg);
  M = { selva, REX, B, C, car, c12, c1, kg };
  // sol do lado da câmera (o da selva vinha de frente para estas câmeras e lavava a imagem)
  const ilumina = (p, D = V(0.35, 0.72, -0.6)) => { const sol = selva.sol, d = D.clone().normalize(); sol.position.copy(p).addScaledVector(d, 50); sol.target.position.copy(p); sol.target.updateMatrixWorld(); };
  const W = (T, n) => T.ossos[n].getWorldPosition(V());

  // ---------------------------------------------------------------------------------------------- poses
  /** põe um T. rex com os quadris em (x, z) olhando para `rumo` (rad no plano xz; 0 = +x) e posa */
  function trexEm(T, x, z, rumo, opc) {
    T.grupo.visible = true; T.grupo.position.set(x, alturaChao(x + 2 * Math.cos(rumo), z + 2 * Math.sin(rumo)), z); T.grupo.rotation.set(0, -rumo, 0); T.posar(opc);
    if (opc.inclina) { T.girar('cauda1', [0, 0, 1], 0.6 * opc.inclina); T.girar('cauda3', [0, 0, 1], 0.3 * opc.inclina); T.grupo.updateMatrixWorld(true); }   // corpo inclinado para comer: a cauda não sobe junto
  }
  /** braço esquerdo (o da câmera): levanta para a frente (ergue), dobra o cotovelo (dobra), e o comprimento (k = 1 real) */
  function braco(T, { ergue = 0, dobra = 0, k = 1, lado = 'l' } = {}) {
    const g = lerp(1, 1.45, clamp((k - 1) / 1.6));                                                  // o braço comprido também engrossa (senão vira um graveto)
    for (const n of ['braco_', 'antebraco_', 'mao_']) T.ossos[n + lado].scale.set(g, n === 'mao_' ? g : k, g);
    T.girar('braco_' + lado, [0, 0, 1], ergue); T.girar('antebraco_' + lado, [0, 0, 1], dobra); T.grupo.updateMatrixWorld(true);
  }
  // REX sozinho (cena 1): anda, para, tenta pôr a mão na boca, flexiona, olha o braço
  const VEL = 2.2;
  function rexSolo(t) {
    const u = t - S.p2;                                                         // tempo desde o começo do P2
    const vel = VEL * (1 - suave(inv(2.4, 3.4, u))), dist = VEL * (u < 3.4 ? u - 0.5 * (u > 2.4 ? (u - 2.4) ** 2 / 1.0 : 0) : 2.9);
    const x = SOLO.x0 + dist;
    const alcanca = suave(inv(3.6, 4.6, u)) * (1 - suave(inv(6.4, 7.0, u)));            // P3: a mão tenta subir até a boca
    const cabecaDesce = alcanca * 0.9;
    const flex = u > 7.0 ? 0.5 + 0.5 * Math.sin((u - 7.0) * 4.2 - Math.PI / 2) : 0;   // P4: dobra o braço com força
    const olhaBraco = suave(inv(10.0, 10.6, u));                                      // P5
    trexEm(REX, x, SOLO.z, 0, { dist, vel, t, parado: 1 - clamp(vel / 0.8), olhar: olhaBraco > 0.01 ? W(REX, 'mao_l').lerp(V(x + 6, 3.4, SOLO.z), 1 - olhaBraco) : null });
    REX.girar('pescoco1', [0, 0, 1], -0.22 * cabecaDesce); REX.girar('pescoco2', [0, 0, 1], -0.16 * cabecaDesce); REX.girar('cabeca', [0, 0, 1], -0.25 * cabecaDesce);
    braco(REX, { ergue: 1.15 * alcanca + 0.25 * flex, dobra: -0.6 * alcanca - 1.1 * flex });
    return { x, u };
  }
  // cena 2: a carcaça. REX ao norte (olhando para -z); B a leste; C a oeste. Cada um come (abaixa e morde em ciclos) e às vezes morde para o lado.
  // REX olha para +x com a carcaça à frente; B à esquerda dele (-z), C à direita (+z), os dois de frente para a carcaça
  const rumoPara = (de, para) => Math.atan2(para[1] - de[1], para[0] - de[0]);
  const POS = {                                                            // os três lado a lado, olhando para a carcaça (deitada ao longo de z)
    REX: { x: RX.x, z: RX.z, rumo: 0 },
    B: { x: RX.x + 0.5, z: RX.z - 4.8, rumo: 0.05 },
    C: { x: RX.x + 0.3, z: RX.z + 4.7, rumo: -0.05 },
  };
  /** ponto no referencial de REX na carcaça: x frente, y cima (a partir do chão), z direita */
  const L = (x, y, z) => V(RX.x + x, alturaChao(RX.x + x, RX.z + z) + y, RX.z + z);
  const ciclo = (t, per, fase) => (((t + fase) / per) % 1 + 1) % 1;
  /** mordida de B no braço de REX: começa em tb, fecha ~0,9 s depois; erra = distância (m) entre os dentes e a mão quando fecha */
  function grupo(t, { tb = null, erra = 0.35, kBraco = 1, chegada = 1 } = {}) {
    const P = POS.REX;
    const mR = ciclo(t, 2.2, 0.3);
    trexEm(M.REX, P.x, P.z, P.rumo, { t, parado: 1, inclina: 0.30, abaixa: 0.35, olhar: V(CARC.x - 1.0, 1.0, CARC.z - 0.3), mordida: mR });
    braco(M.REX, { ergue: -0.15, dobra: -0.2, k: kBraco });
    const mao = W(M.REX, 'mao_l'), ant = W(M.REX, 'antebraco_l');
    const anda = (p, k, d) => [p.x - Math.cos(p.rumo) * d * (1 - k), p.z - Math.sin(p.rumo) * d * (1 - k)];
    // B: chega da mata (chegada 0..1) e come; no instante tb vira a cabeça para o braço de REX e morde (erra = folga em metros)
    const pB = POS.B; let [bx, bz] = anda(pB, chegada, 13), rumoB = pB.rumo;
    let alvoB = V(CARC.x - 1.0, 1.0, bz + 0.3), mB = ciclo(t, 1.9, 1.1);
    if (tb != null && t > tb - 0.7 && t < tb + 1.4) {
      const k = suave(inv(tb - 0.7, tb - 0.15, t)) * (1 - suave(inv(tb + 0.9, tb + 1.4, t)));
      const noBraco = ant.clone().lerp(mao, 0.6).add(V(0.15, -0.05, -erra));
      alvoB = alvoB.lerp(noBraco, k); mB = clamp((t - (tb - 0.7)) / 1.45, 0, 1) * k + mB * (1 - k);
      const giro = Math.atan2(noBraco.z - bz, noBraco.x - bx); rumoB = lerp(pB.rumo, giro, k);       // o bote: B vira o corpo para o braço de REX
      bx = lerp(bx, noBraco.x - Math.cos(giro) * 5.3, k); bz = lerp(bz, noBraco.z - Math.sin(giro) * 5.3, k);
    }
    trexEm(M.B, bx, bz, rumoB, { t, dist: 13 * chegada, vel: chegada < 1 ? 2.2 : 0, parado: chegada < 1 ? 0 : 1, inclina: 0.28 * chegada, abaixa: 0.3 * chegada, olhar: alvoB, mordida: chegada < 1 ? 0 : mB });
    const pC = POS.C, chC = clamp(chegada * 1.15 - 0.15), [cx, cz] = anda(pC, chC, 12);
    trexEm(M.C, cx, cz, pC.rumo, { t, dist: 12 * chC, vel: chC < 1 ? 2.0 : 0, parado: chC < 1 ? 0 : 1, inclina: 0.3 * chC, abaixa: 0.3 * chC, olhar: V(CARC.x - 1.0, 1.1, cz - 0.3), mordida: chC < 1 ? 0 : ciclo(t, 2.5, 0.7) });
    return { mao, ant, alvoB };
  }
  const esconde = (...L) => { for (const T of [M.REX, M.B, M.C]) T.grupo.visible = L.includes(T); };
  function camEm(pos, olha, fov, { tremor = 0, t = 0, roll = 0 } = {}) {
    cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(olha);
    if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    if (roll) cam.rotateZ(roll);
    if (tremor) { cam.position.y += tremor * 0.03 * ruido(t * 40, 1); cam.rotateX(tremor * 0.010 * ruido(t * 37, 2)); cam.rotateZ(tremor * 0.008 * ruido(t * 33, 3)); }
    return pos.distanceTo(olha);
  }
  const semRotulos = () => { M.c12.visible = M.c1.visible = M.kg.visible = false; };

  // ---------------------------------------------------------------------------------------------- planos
  // P1 / P10: close do bracinho esquerdo de REX visto da frente-esquerda, de baixo; a boca de B entra pela esquerda do quadro e fecha a
  // um palmo da mão (tb = TB s no plano); o braço recua num tranco
  const TB = 1.05;
  function closeMordida(u, t0) {
    semRotulos(); esconde(M.REX, M.B, M.C);
    const t = 40 + u;                                                         // instante "do mundo" da cena da carcaça (o mesmo no P1 e no P10)
    grupo(t, { tb: 40 + TB, erra: 0.30 });
    const recua = suave(inv(TB + 0.75, TB + 0.95, u)) * (1 - 0.6 * suave(inv(TB + 1.1, 2.4, u)));
    braco(M.REX, { ergue: -0.15 - 0.55 * recua, dobra: -0.2 - 0.9 * recua });
    const mao = W(M.REX, 'mao_l'); ilumina(mao);
    const fecha = u > TB + 0.8 ? Math.exp(-(u - (TB + 0.8)) * 9) : 0;
    const pos = L(4.6, 0.95, -1.9), d = camEm(pos, mao.clone().add(V(0.35, 0.15, -0.6)), 54, { tremor: 2.2 * fecha, t: t0 + u });   // (perto do braço: a cabeça de B não passa na frente da lente na volta do bote)
    lente({ foco: d, abertura: 0.010, desfoque: 0.012, brilho: 0.12, limiar: 0.95, ao: 0.8 });
  }
  plano('P1 mordida', 2.4, (u, t) => closeMordida(u, t), { precisa: () => [W(M.REX, 'mao_l'), M.B.boca()] });
  // R1: rebobina o P1 (de trás para a frente, rápido)
  plano('R1 volta', 0.5, (u, t) => closeMordida(2.4 * (1 - u / 0.5), t));
  // cena 1: pontos no referencial de REX sozinho (anda em +x; esquerda dele = -z)
  const Ls = (x0, lx, ly, lz) => V(x0 + lx, alturaChao(x0 + lx, SOLO.z + lz) + ly, SOLO.z + lz);
  // P2: REX sozinho atravessa a clareira; cotas "12 m" ao longo do corpo e "1 m" no braço. 3/4 de trás-esquerda para caber no 9:16
  S.p2 = S.total;
  plano('P2 escala', 3.1, (u, t) => {
    esconde(M.REX); M.kg.visible = false; const { x } = rexSolo(t); ilumina(V(x + 1, 2, SOLO.z));
    M.c12.userData.por(Ls(x, -6.6, 5.0, -0.6), Ls(x, 5.7, 5.0, -0.6), inv(0.3, 1.1, u), 0.045, 0.5);
    const b0 = W(M.REX, 'braco_l'), b1 = W(M.REX, 'mao_l'); M.c1.userData.por(b0.add(V(0, 0, -0.9)), b1.add(V(0, -0.1, -0.9)), inv(1.3, 1.9, u), 0.025, 0.2);
    const alvo = Ls(x, -0.2, 2.6, 0), d = camEm(Ls(x, -6.5, 1.6, -11.5), alvo, 50, { t });
    lente({ foco: d, abertura: 0.002, brilho: 0.15, ao: 0.8 });
  }, { precisa: () => [W(M.REX, 'cabeca'), W(M.REX, 'cauda8'), W(M.REX, 'dedos_l')] });
  // P3: a mão tenta chegar à boca (3/4 frente-esquerda, de baixo, push-in lento)
  plano('P3 boca', 3.5, (u, t) => {
    esconde(M.REX); M.c12.visible = M.kg.visible = false; M.c1.userData.por(V(), V(), 0);
    const { x } = rexSolo(t); const alvo = Ls(x, 3.7, 2.6, -0.3); ilumina(alvo);
    const k = suave(u / 3.5), d = camEm(Ls(x, lerp(9.0, 8.0, k), 1.4, lerp(-5.2, -4.4, k)), alvo, 44, { t });
    lente({ foco: d, abertura: 0.006, brilho: 0.15, ao: 0.85 });
  }, { precisa: () => [W(M.REX, 'mao_l'), M.REX.boca()] });
  // P4: close do braço dobrando com força (de lado, tele, fundo achatado); etiqueta "~200 kg"
  plano('P4 forca', 3.0, (u, t) => {
    esconde(M.REX); M.c12.visible = false; M.c1.userData.por(V(), V(), 0);
    const { x } = rexSolo(t); const b = W(M.REX, 'antebraco_l'), m = W(M.REX, 'mao_l'); ilumina(b);
    M.kg.visible = u > 0.5; M.kg.position.copy(b.clone().lerp(m, 0.5).add(V(0.0, 0.45, -0.35))); M.kg.material.opacity = suave(inv(0.5, 0.9, u));
    const alvo = b.clone().lerp(m, 0.4).add(V(0, 0.1, 0)), d = camEm(alvo.clone().add(V(1.0, -0.2, -6.0)), alvo, 20, { t });
    lente({ foco: d, abertura: 0.02, desfoque: 0.014, brilho: 0.15, ao: 0.85 });
  }, { precisa: () => [W(M.REX, 'antebraco_l'), W(M.REX, 'mao_l')] });
  // P5: ele olha para o próprio braço: por cima do ombro esquerdo, leve órbita
  plano('P5 pergunta', 2.0, (u, t) => {
    esconde(M.REX); semRotulos(); const { x } = rexSolo(t); const m = W(M.REX, 'mao_l'), cab = W(M.REX, 'cabeca'); ilumina(cab);
    const a = suave(u / 2), d = camEm(Ls(x, lerp(-0.4, 0.4, a), 4.7, lerp(-3.9, -3.5, a)), m.clone().lerp(cab, 0.35), 42, { t });
    lente({ foco: d, abertura: 0.008, brilho: 0.15, ao: 0.85 });
  }, { precisa: () => [W(M.REX, 'cabeca'), W(M.REX, 'mao_l')] });
  // P6: a clareira com a carcaça, de cima e de trás de REX; B e C saem da mata (grua descendo)
  plano('P6 grupo', 4.5, (u, t) => {
    semRotulos(); esconde(M.REX, M.B, M.C); grupo(30 + u, { chegada: suave(inv(0.2, 4.2, u)) });
    const alvo = L(4.5, 0.8, 0), k = suave(u / 4.5); ilumina(alvo);
    const d = camEm(L(lerp(15, 12.5, k), lerp(8.5, 6.0, k), lerp(-7.5, -6.0, k)), L(3.0, 1.2, -1.0), 50, { t });
    lente({ foco: d, abertura: 0.002, brilho: 0.15, ao: 0.8 });
  }, { precisa: () => [M.REX.boca(), V(CARC.x, 0.5, CARC.z)] });
  // P7: disputa: cortes curtos (1 s), câmera na mão entre as cabeças (posições no referencial de REX)
  const CAOS = [
    { pos: [4.4, 0.6, -2.4], olha: 'B', fov: 58 }, { pos: [4.3, 0.7, 2.4], olha: 'C', fov: 56 }, { pos: [4.6, 0.5, -0.9], olha: 'REX', fov: 60 },
    { pos: [7.0, 3.8, -3.2], olha: 'B', fov: 52 }, { pos: [6.6, 3.4, 0.4], olha: 'REX', fov: 56 },
  ];
  plano('P7 caos', 5.0, (u, t) => {
    semRotulos(); esconde(M.REX, M.B, M.C); const k = Math.min(4, Math.floor(u)), c = CAOS[k];
    grupo(34.5 + u, { tb: k === 3 ? 34.5 + 3.6 : null, erra: 0.7 });
    const b = M[c.olha].boca(); ilumina(b);
    const d = camEm(L(...c.pos), b, c.fov, { tremor: 1.2, t });
    lente({ foco: d, abertura: 0.008, desfoque: 0.012, brilho: 0.15, ao: 0.8 });
  }, { precisa: () => [] });
  // P8: "e se fosse comprido?": o braço de REX cresce e a mordida de B o puxa (plano médio, push-in quando a boca chega)
  plano('P8 comprido', 4.0, (u, t) => {
    semRotulos(); esconde(M.REX, M.B, M.C); const kB = lerp(1, 2.6, suave(inv(0.2, 1.2, u)));
    grupo(50 + u, { tb: 50 + 2.4, erra: -0.05, kBraco: kB });
    const puxa = suave(inv(3.15, 3.35, u)) * (1 - 0.5 * suave(inv(3.5, 4.0, u)));
    if (puxa > 0) braco(M.REX, { ergue: -0.15 + 0.45 * puxa, dobra: -0.2 + 0.35 * puxa, k: kB });
    const mao = W(M.REX, 'mao_l'), alvo = W(M.REX, 'braco_l').lerp(mao, 0.6); ilumina(alvo);
    const k = suave(inv(1.8, 3.2, u)), d = camEm(L(lerp(8.0, 7.3, k), lerp(4.6, 4.1, k), lerp(-2.4, -2.0, k)), alvo, 50, { tremor: 2 * (u > 3.3 ? Math.exp(-(u - 3.3) * 6) : 0), t });
    lente({ foco: d, abertura: 0.008, brilho: 0.15, ao: 0.85 });
  }, { precisa: () => [W(M.REX, 'braco_l'), W(M.REX, 'mao_l')] });
  // P9: o braço volta ao tamanho real; a mordida passa e erra (pull-out revela)
  plano('P9 curto', 4.5, (u, t) => {
    semRotulos(); esconde(M.REX, M.B, M.C); const kB = lerp(2.6, 1, suave(inv(0, 0.8, u)));
    grupo(60 + u, { tb: 60 + 2.2, erra: 0.45, kBraco: kB });
    const mao = W(M.REX, 'mao_l'); ilumina(mao);
    const k = suave(inv(2.9, 4.5, u)), d = camEm(L(lerp(7.3, 8.6, k), lerp(4.1, 5.2, k), lerp(-2.0, -2.8, k)), mao.clone().add(V(0.4, 0.2, -0.5)), lerp(50, 58, k), { t });
    lente({ foco: d, abertura: 0.008, brilho: 0.15, ao: 0.85 });
  }, { precisa: () => [W(M.REX, 'mao_l'), M.B.boca()] });
  // P10: igual ao P1 (laço)
  plano('P10 laco', 3.5, (u, t) => closeMordida(Math.min(u * 2.4 / 3.5, 2.4), t), { precisa: () => [W(M.REX, 'mao_l'), M.B.boca()] });

  S.limpos = limparLente();
  prepararCorte(INSTANCIAS);
  return S;
}

/** tira da frente da lente a vegetação que cai entre a câmera e o assunto (igual ao do Short da corrida) */
function limparLente() {
  const pts = [], Mx = new THREE.Matrix4(), cen = V(), sc = V(), q = new THREE.Quaternion(), cw = V();
  for (let t = 0; t < S.total; t += 0.2) {
    const p = acharPlano(t); atualizar(t); const c = cam.position.clone(); pts.push(c);
    for (const alvo of (p.precisa ? p.precisa() : []).slice(0, 2)) for (const f of [0.2, 0.4, 0.6, 0.75, 0.87, 0.94]) pts.push(c.clone().lerp(alvo, f));
  }
  let tirados = 0;
  scene.traverse(o => {
    if (!o.isInstancedMesh) return; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const bs = o.geometry.boundingSphere;
    for (let i = 0; i < o.count; i++) {
      o.getMatrixAt(i, Mx); Mx.decompose(cen, q, sc); if (sc.x === 0) continue; cw.copy(bs.center).applyMatrix4(Mx); const r = bs.radius * Math.max(sc.x, sc.y, sc.z);
      const arvore = r > 3.2, R = arvore ? 1.3 : 0.6 * r + 0.3, ref = arvore ? cen : cw;
      for (const p of pts) { const dx = p.x - ref.x, dz = p.z - ref.z, dy = arvore ? 0 : p.y - ref.y; if (dx * dx + dy * dy + dz * dz < R * R) { Mx.makeScale(0, 0, 0); o.setMatrixAt(i, Mx); tirados++; break; } }
    }
    o.instanceMatrix.needsUpdate = true;
  });
  return tirados;
}

export function atualizar(t) {
  const p = acharPlano(t); p.fn(clamp(t - p.t0, 0, p.dur), t, p); scene.updateMatrixWorld(true);
  if (M && M.selva.sol && Q.get('corte') !== '0') cortar(cam, M.selva.sol);
}
export const mundo = () => M;
export function efeitos(t) { const p = acharPlano(t), u = t - p.t0; return p.efeito ? p.efeito(u, t) : {}; }
export function verificarEnquadramento(margem = 0.06) {
  const res = [];
  for (const p of S.planos) {
    if (!p.precisa) continue; let pior = 0;
    for (let k = 0; k <= 5; k++) {
      const t = p.t0 + p.dur * (0.02 + 0.96 * k / 5); atualizar(t); cam.updateMatrixWorld(true);
      for (const v of p.precisa()) { const q = v.clone().project(cam); pior = Math.max(pior, Math.abs(q.x) - (1 - margem), Math.abs(q.y) - (1 - margem), q.z > 1 ? 1 : 0); }
    }
    res.push({ plano: p.id, fora: +pior.toFixed(3) });
  }
  return res;
}
