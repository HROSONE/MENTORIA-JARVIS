// Short "Câmara de ar sem tirar a roda": a moto do Blender num cavalete, fundo azul neutro, uma câmara de ar vazia (anel de borracha
// achatado que deforma quando trava). Sem pessoa: só os objetos.
// Por que não entra: as duas pernas do garfo + o eixo formam um anel fechado que passa pelo meio da roda; a câmara também é um anel
// fechado. Para ela ficar em volta do pneu, o eixo teria de passar por dentro dela (os dois anéis enganchados), e isso só acontece
// cortando um deles. Sem uma perna do garfo o anel abre e a câmara passa inteira por cima do pneu pelo lado livre.
// Coordenadas: metros, y para cima, frente da moto em +Z, +X = lado esquerdo do piloto.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { criarMotor, tremor } from '../../core/motor.js';
import { clamp, lerp, inv, suave, suave5, ruido } from '../../core/util.js';

export const { renderer, scene, cam, capturar, FPS } = criarMotor({ exposicao: 1.0, near: 0.02, far: 80, fov: 34 });
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ------------------------------------------------------------------------------------------------ medidas
const ELEV = 0.10;                                           // moto no cavalete (as duas rodas 10 cm acima do chão)
const W = V(0, 0.30 + ELEV, 0.69);                            // centro da roda dianteira
const C24 = Math.cos(24 * Math.PI / 180), S24 = Math.sin(24 * Math.PI / 180);
const U3 = V(0, C24, -S24);                                   // eixo do garfo (sobe e vai para trás)
const LEGX = 0.105, RLEG = 0.033, MEIA = 0.0055;              // perna do garfo: afastamento, raio do tubo; meia espessura da câmara
const TL = Math.atan2(-S24, C24);                             // ângulo, no plano da roda, em que a perna cruza a câmara
const R0 = 0.33;                                              // câmara esticada (passa por cima do pneu de raio 0,30)
const angDif = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

// ------------------------------------------------------------------------------------------------ linha do tempo (s)
export const PLANOS = [
  { id: 1, t0: 0, t1: 3 }, { id: 2, t0: 3, t1: 8 }, { id: 3, t0: 8, t1: 13 }, { id: 4, t0: 13, t1: 19 },
  { id: 5, t0: 19, t1: 24 }, { id: 6, t0: 24, t1: 30 }, { id: 7, t0: 30, t1: 35 }, { id: 8, t0: 35, t1: 37.4 },
];
export const TOTAL = 37.4;
export const plano = t => PLANOS.find(p => t >= p.t0 && t < p.t1) || PLANOS[PLANOS.length - 1];

// ------------------------------------------------------------------------------------------------ cenário: estúdio azul
function estudio() {
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { cima: { value: new THREE.Color(0x86a8d2) }, baixo: { value: new THREE.Color(0x4a6f9f) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 cima; uniform vec3 baixo; varying vec3 vP; void main(){ float k = smoothstep(-6.0, 14.0, vP.y); gl_FragColor = vec4(mix(baixo, cima, k), 1.0); }',
  }));
  scene.add(ceu);
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: 0x5679a8, roughness: 0.95 }));
  chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; scene.add(chao);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.75;
  const sol = new THREE.DirectionalLight(0xfff1df, 2.2); sol.position.set(2.2, 4.2, 3.0); sol.target.position.copy(W); scene.add(sol.target);
  sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); Object.assign(sol.shadow.camera, { left: -2.2, right: 2.2, top: 2.2, bottom: -2.2, near: 0.5, far: 12 }); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02;
  scene.add(sol);
  scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x3a5578, 0.55));
  const contra = new THREE.DirectionalLight(0xbfd6ff, 1.1); contra.position.set(-2.5, 2.2, -2.5); scene.add(contra);
  // cavalete embaixo do motor (moto erguida, rodas no ar)
  const ferro = new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.5, metalness: 0.7 }), borr = new THREE.MeshStandardMaterial({ color: 0xb3141c, roughness: 0.7 });
  const cav = new THREE.Group(); cav.name = 'cavalete';
  const caixa = (sx, sy, sz, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; cav.add(o); };
  caixa(0.30, 0.02, 0.32, borr, 0, 0.205, 0.05); caixa(0.26, 0.03, 0.28, ferro, 0, 0.18, 0.05);
  for (const sx of [1, -1]) for (const sz of [1, -1]) { const o = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.18, 10), ferro); o.position.set(sx * 0.11, 0.08, 0.05 + sz * 0.11); o.rotation.z = sx * 0.12; o.castShadow = true; cav.add(o); }
  caixa(0.36, 0.02, 0.36, ferro, 0, 0.01, 0.05);
  scene.add(cav);
}

// ------------------------------------------------------------------------------------------------ câmara de ar vazia (anel achatado que deforma)
const NS = 220, NC = 12;
class Camara {
  constructor() {
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(NS * NC * 3); this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const idx = [];
    for (let i = 0; i < NS; i++) for (let j = 0; j < NC; j++) { const a = i * NC + j, b = ((i + 1) % NS) * NC + j, c = ((i + 1) % NS) * NC + (j + 1) % NC, d = i * NC + (j + 1) % NC; idx.push(a, b, c, a, c, d); }
    this.geo.setIndex(idx);
    this.matBorracha = new THREE.MeshPhysicalMaterial({ color: 0x2a2b30, roughness: 0.32, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.25, side: THREE.DoubleSide });
    this.matBorracha.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n float fr = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.2); gl_FragColor.rgb += vec3(0.75, 0.85, 1.0) * fr * 0.55;'); };
    this.matRaiox = new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.95 });
    this.malha = new THREE.Mesh(this.geo, this.matBorracha); this.malha.castShadow = true; this.malha.frustumCulled = false; scene.add(this.malha);
    const lat = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.3, metalness: 1 }), tampa = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
    this.valvula = new THREE.Group();
    const v1 = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.038, 12), lat); v1.position.y = 0.019; this.valvula.add(v1);
    const v2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0048, 0.0048, 0.012, 12), tampa); v2.position.y = 0.043; this.valvula.add(v2);
    const v3 = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.006, 16), this.matBorracha); v3.position.y = 0.002; this.valvula.add(v3);
    this.valvula.traverse(o => { o.castShadow = true; }); scene.add(this.valvula);
    this.est = null;
  }
  /** ponto do anel no ângulo th (estado e) */
  ponto(e, th) {
    const r = e.R + (e.dr ? e.dr(th) : 0), dx = e.dx ? e.dx(th) : 0;
    return V(e.C.x + dx, e.C.y + r * Math.cos(th), e.C.z + r * Math.sin(th));
  }
  atualizar(e, raiox = false) {
    this.est = e; this.malha.visible = e.visivel !== false; this.valvula.visible = this.malha.visible && !raiox;
    this.malha.material = raiox ? this.matRaiox : this.matBorracha;
    if (!this.malha.visible) return;
    const P = [], T = [];
    for (let i = 0; i < NS; i++) P.push(this.ponto(e, 2 * Math.PI * i / NS));
    for (let i = 0; i < NS; i++) T.push(P[(i + 1) % NS].clone().sub(P[(i - 1 + NS) % NS]).normalize());
    const larg = raiox ? 0.016 : 0.021, esp = raiox ? 0.012 : MEIA;
    for (let i = 0; i < NS; i++) {
      const th = 2 * Math.PI * i / NS, rr = V(0, Math.cos(th), Math.sin(th)), b = T[i].clone().cross(rr).normalize(), n = rr.clone().addScaledVector(T[i], -rr.dot(T[i])).normalize();
      const ruga = 1 + 0.07 * Math.sin(th * 23 + 1.3) * Math.sin(th * 7);                // vazia: borracha amassada
      for (let j = 0; j < NC; j++) {
        const a = 2 * Math.PI * j / NC, k = (i * NC + j) * 3;
        const q = P[i].clone().addScaledVector(b, Math.cos(a) * larg * ruga).addScaledVector(n, Math.sin(a) * esp * (2 - ruga));   // faixa achatada: largura no eixo da roda, espessura no raio
        this.pos[k] = q.x; this.pos[k + 1] = q.y; this.pos[k + 2] = q.z;
      }
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.computeVertexNormals(); this.geo.computeBoundingSphere();
    // válvula embaixo, apontando para o centro
    const pv = this.ponto(e, Math.PI), dirV = e.C.clone().sub(pv).setX(0).normalize();
    this.valvula.position.copy(pv); this.valvula.quaternion.setFromUnitVectors(V(0, 1, 0), dirV);
  }
}

/** câmara empurrada contra uma perna do garfo: o anel passa, mas o trecho que encosta na perna fica preso e estica em volta dela.
 *  x = plano do anel; lado = +1 (perna esquerda, +X) ou -1; dentro = true quando ela vem de dentro (tentando sair) */
function presa(x, lado, { R = R0, aperto = 1, dentro = false } = {}) {
  const xPin = dentro ? lado * (LEGX - RLEG - MEIA - 0.002) : lado * (LEGX + RLEG + MEIA + 0.002);
  const passou = dentro ? lado * x > lado * xPin : lado * x < lado * xPin;
  const g = th => Math.exp(-(((angDif(th, TL)) / 0.62) ** 2));
  return {
    C: V(x, W.y, W.z), R,
    dx: passou ? th => (xPin - x) * g(th) : null,
    dr: passou ? th => 0.016 * aperto * Math.min(1, Math.abs(xPin - x) / 0.08) * Math.exp(-(((angDif(th, TL)) / 0.35) ** 2)) : null,
  };
}

// ------------------------------------------------------------------------------------------------ carga
let moto, perna, pernaBase, dirNo, camara, malhasMoto = [], laco, matFantasma, contornoPneu;
export async function construir() {
  estudio();
  const L = new GLTFLoader();
  const gm = await L.loadAsync('../biblioteca3d/veiculos/moto/moto.glb');
  moto = gm.scene; moto.position.y = ELEV; scene.add(moto);
  moto.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.userData.mat0 = o.material; malhasMoto.push(o); } });
  perna = moto.getObjectByName('PernaGarfoE'); dirNo = moto.getObjectByName('Direcao'); pernaBase = perna.position.clone();
  camara = new Camara();
  // raio-x: material fantasma da moto e laço amarelo garfo + eixo
  matFantasma = new THREE.MeshBasicMaterial({ color: 0xe4efff, transparent: true, opacity: 0.16, depthWrite: false });
  const P = (x, t) => W.clone().add(V(x, 0, 0)).addScaledVector(U3, t);
  const pts = [P(0.0, -0.02), P(0.105, -0.02), P(0.105, 0.25), P(0.105, 0.52), P(0.105, 0.70), P(0.0, 0.73), P(-0.105, 0.70), P(-0.105, 0.52), P(-0.105, 0.25), P(-0.105, -0.02)];
  laco = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.15), 300, 0.011, 10, true), new THREE.MeshBasicMaterial({ color: 0xffcf2e }));
  laco.visible = false; scene.add(laco);
  contornoPneu = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.004, 8, 120), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }));
  contornoPneu.rotation.y = Math.PI / 2; contornoPneu.position.copy(W); contornoPneu.visible = false; scene.add(contornoPneu);
  return { total: TOTAL };
}

// ------------------------------------------------------------------------------------------------ estado por instante
function estadoCamara(t) {
  const pl = plano(t).id;
  if (pl === 1 || pl === 8) {                                                   // gancho / loop: presa e esticada na perna esquerda
    const k = pl === 1 ? t : t - 35;
    return { ...presa(0.05 + 0.025 * Math.sin(k * 3.1) ** 2, 1, { aperto: 1 }), lado: 1 };
  }
  if (pl === 2 || pl === 3) {                                                   // tentativa de um lado e do outro
    const lado = pl === 2 ? 1 : -1, k = t - (pl === 2 ? 3 : 8);
    let x = lerp(0.30, 0.15, suave(inv(0.2, 1.4, k)));
    const empurra = Math.max(suave(inv(1.4, 2.2, k)) * (1 - suave(inv(2.6, 3.0, k)) * 0.7), suave(inv(3.2, 3.9, k)) * (1 - suave(inv(4.4, 5.0, k)) * 0.5));
    x -= 0.11 * empurra;
    return { ...presa(lado * x, lado), lado };
  }
  if (pl === 4) return { visivel: false };
  if (pl === 5) {                                                               // raio-x: a câmara no lugar certo tenta sair pelo lado esquerdo e engancha
    const k = t - 19, sai = suave(inv(0.6, 1.8, k)) * (1 - suave(inv(2.2, 2.8, k))) + suave(inv(3.0, 4.0, k)) * (1 - suave(inv(4.6, 5.0, k)) * 0.0);
    return { ...presa(0.24 * sai, 1, { R: 0.31, dentro: true }), lado: 1, raiox: true };
  }
  if (pl === 6) return { ...presa(0.30, 1), lado: 1 };                          // esperando a perna sair
  // plano 7: sem a perna esquerda a câmara passa por cima do pneu e assenta
  const k = t - 30, x = lerp(0.30, 0.0, suave5(inv(0.3, 2.3, k))), assenta = suave(inv(2.3, 3.2, k)), R = lerp(R0, 0.306, assenta);
  return { C: V(x, W.y - (R - 0.303) * assenta + 0.0 * (1 - assenta), W.z), R, lado: 1, solta: suave(inv(3.2, 4.2, k)) };
}

function pernaDoGarfo(t) {
  const pl = plano(t).id;
  perna.visible = true;
  let d = 0, sai = 0;
  if (pl === 6) { const k = t - 24; d = suave(inv(1.0, 3.2, k)); sai = suave(inv(3.0, 4.6, k)); }
  else if (pl === 7) { perna.visible = false; return; }
  if (d + sai === 0) { perna.position.copy(pernaBase); return; }
  // sobe pelo eixo do garfo e sai para fora (no espaço do nó Direcao)
  const mundo = U3.clone().multiplyScalar(0.55 * d).add(V(0.9 * sai, 0.6 * sai, 0));
  const qi = dirNo.getWorldQuaternion(new THREE.Quaternion()).invert();
  perna.position.copy(pernaBase).add(mundo.applyQuaternion(qi));
  perna.visible = sai < 0.98;
}

function raiox(t) {
  const pl = plano(t).id, on = pl === 4 || pl === 5;
  for (const m of malhasMoto) m.material = on ? matFantasma : m.userData.mat0;
  laco.visible = on; contornoPneu.visible = on; const cv = scene.getObjectByName('cavalete'); if (cv) cv.visible = !on;
  if (on) {                                                                     // o laço amarelo se desenha (13,3–15,5 s) e pulsa
    const k = suave(inv(13.3, 15.5, t)); laco.geometry.setDrawRange(0, Math.floor(laco.geometry.index.count * (pl === 5 ? 1 : k) / 3) * 3);
    laco.material.color.setHSL(0.13, 1, 0.55 + 0.1 * Math.sin(t * 6));
  } else laco.geometry.setDrawRange(0, Infinity);
  return on;
}

// ------------------------------------------------------------------------------------------------ câmera (decupagem)
function camera(t) {
  const pl = plano(t), k = t - pl.t0, d = pl.t1 - pl.t0, u = k / d;
  const contato = V(LEGX + 0.02, W.y + R0 * C24, W.z - R0 * S24);
  let p, a, fov = 34;
  const orb = (ang, r, h, alvo) => alvo.clone().add(V(Math.sin(ang) * r, h, Math.cos(ang) * r));
  switch (pl.id) {
    case 1: case 8: {                                                           // a câmara presa na perna (3/4 de frente, de cima), push-in
      const s = suave(u); p = V(lerp(1.15, 0.92, s), lerp(1.18, 1.05, s), lerp(1.85, 1.55, s)); a = V(0.08, 0.56, 0.62); fov = 36; break; }
    case 2: {                                                                   // plano médio 3/4: a câmara chega e trava
      const s = suave(u); p = V(lerp(1.55, 1.3, s), lerp(1.08, 0.98, s), lerp(2.4, 2.1, s)); a = V(0.12, 0.5, 0.64); fov = 38; break; }
    case 3: {                                                                   // o outro lado (entra com whip)
      const s = suave(u); p = V(lerp(-1.55, -1.3, s), lerp(1.08, 0.98, s), lerp(2.35, 2.05, s)); a = V(-0.12, 0.5, 0.64); fov = 38; break; }
    case 4: {                                                                   // raio-x, pull-out mostrando o laço inteiro
      const s = suave(u); p = orb(lerp(0.45, 0.7, s), lerp(1.6, 2.2, s), lerp(0.3, 0.5, s), V(0, 0.62, 0.58)); a = V(0, lerp(0.6, 0.64, s), 0.58); fov = 36; break; }
    case 5: {                                                                   // órbita em volta dos dois anéis
      const s = suave(u); p = orb(lerp(0.95, 0.45, s), 1.9, lerp(0.42, 0.32, s), V(0, 0.6, 0.6)); a = V(0.05, 0.58, 0.6); fov = 36; break; }
    case 6: {                                                                   // de baixo, push-in enquanto a perna sai
      const s = suave(u); p = V(lerp(1.05, 0.82, s), lerp(0.32, 0.38, s), lerp(1.9, 1.62, s)); a = V(0.1, lerp(0.7, 0.85, s), 0.56); fov = 42; break; }
    case 7: {                                                                   // travelling acompanhando a câmara entrar
      const s = suave(u); p = V(lerp(1.45, 0.95, s), lerp(1.08, 0.55, s), lerp(2.3, 2.0, s)); a = V(lerp(0.14, 0.03, s), lerp(0.52, 0.42, s), W.z); fov = 38; break; }
  }
  cam.position.copy(p); cam.lookAt(a);
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  // whip pan na entrada do plano 3 e do plano 2
  if ((pl.id === 3 || pl.id === 2) && k < 0.25) cam.rotateY((pl.id === 3 ? -1 : 1) * (1 - k / 0.25) ** 2 * 0.5);
  tremor(cam, t, pl.id === 1 || pl.id === 8 ? 0.9 : 0.6);
}

export function atualizar(t) {
  const on = raiox(t);
  const e = estadoCamara(t);
  camara.atualizar(e, on);
  pernaDoGarfo(t);
  camera(t);
}
export function efeitos(t) {
  const flash = Math.max(0, 1 - Math.abs(t - 13.0) / 0.18) + Math.max(0, 1 - Math.abs(t - 24.0) / 0.18) * 0.8;
  const perto = [3, 8, 13, 24].some(c => t >= c && t < c + 0.25);
  return { flash, subs: perto ? 4 : 1 };
}
