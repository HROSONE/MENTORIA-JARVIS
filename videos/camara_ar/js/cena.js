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

// ------------------------------------------------------------------------------------------------ reflexos de estúdio calculados no shader
// Sem placa de vídeo, ler o mapa de ambiente (PMREM) custa ~7 dos ~11 s de um quadro 1080x1920. Aqui o "estúdio" (fundo azul, chão,
// duas softboxes e a luz de cima) é uma fórmula: o mesmo tipo de reflexo, ~2,5x mais rápido. ?ibl=pmrem volta ao mapa de ambiente.
const IBL_ANALITICO = new URLSearchParams(location.search).get('ibl') === 'analitico';   // padrão: mapa de ambiente (com o llvmpipe ele ficou barato)
const GLSL_ESTUDIO = `
vec3 estudioHryz(vec3 d, float rough) {
  float y = d.y;
  vec3 ceu = mix(vec3(0.30, 0.42, 0.60), vec3(0.60, 0.72, 0.88), smoothstep(-0.1, 0.8, y));
  vec3 c = mix(vec3(0.20, 0.28, 0.40), ceu, smoothstep(-0.25, 0.05, y));
  float n = mix(90.0, 2.5, rough);
  c += vec3(1.0, 0.95, 0.88) * 2.4 * pow(max(dot(d, normalize(vec3(0.5, 0.75, 0.45))), 0.0), n);
  c += vec3(0.80, 0.88, 1.0) * 1.3 * pow(max(dot(d, normalize(vec3(-0.6, 0.5, -0.6))), 0.0), n);
  c += vec3(1.0) * 0.9 * pow(max(y, 0.0), n * 0.5);
  return c;
}`;
function reflexoEstudio(mat, k = 0.75) {
  if (!IBL_ANALITICO || !mat || !mat.isMeshStandardMaterial || mat.userData.estudio) return;
  mat.userData.estudio = true; const antes = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    antes?.call(mat, sh, r);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + GLSL_ESTUDIO)
      .replace('#include <lights_fragment_maps>', `#include <lights_fragment_maps>
        { vec3 rv = inverseTransformDirection(reflect(-geometryViewDir, geometryNormal), viewMatrix);
          radiance += estudioHryz(rv, material.roughness) * ${k.toFixed(3)};
          iblIrradiance += PI * estudioHryz(inverseTransformDirection(geometryNormal, viewMatrix), 1.0) * ${k.toFixed(3)} * 0.5;
          #ifdef USE_CLEARCOAT
          clearcoatRadiance += estudioHryz(inverseTransformDirection(reflect(-geometryViewDir, geometryClearcoatNormal), viewMatrix), material.clearcoatRoughness) * ${k.toFixed(3)};
          #endif
        }`);
  };
  mat.needsUpdate = true;
}

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
  if (!IBL_ANALITICO) { const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.75; }
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
    const ctrl = e.curva || Array.from({ length: 72 }, (_, i) => this.ponto(e, 2 * Math.PI * i / 72));
    const P = new THREE.CatmullRomCurve3(ctrl, true, 'centripetal').getSpacedPoints(NS).slice(0, NS);
    const T = P.map((p, i) => P[(i + 1) % NS].clone().sub(P[(i - 1 + NS) % NS]).normalize());
    const larg = raiox ? 0.014 : 0.019, esp = raiox ? 0.012 : MEIA;
    this.normais = [];
    for (let i = 0; i < NS; i++) {
      // espessura apontando para fora do pneu: no plano da roda é o raio a partir do eixo; encostada na lateral, é o eixo X
      const rad = V(0, P[i].y - W.y, P[i].z - W.z).normalize(), lat = V(Math.sign(P[i].x) || 1, 0, 0), k = clamp((Math.abs(P[i].x) - 0.035) / 0.03);
      const n = rad.multiplyScalar(1 - k).addScaledVector(lat, k); n.addScaledVector(T[i], -n.dot(T[i])).normalize();
      const b = T[i].clone().cross(n).normalize(); this.normais.push(n);
      const ruga = 1 + 0.08 * Math.sin(i * 0.65 + 1.3) * Math.sin(i * 0.19);              // vazia: borracha amassada
      for (let j = 0; j < NC; j++) {
        const a = 2 * Math.PI * j / NC, kk = (i * NC + j) * 3;
        const q = P[i].clone().addScaledVector(b, Math.cos(a) * larg * ruga).addScaledVector(n, Math.sin(a) * esp * (2 - ruga));
        this.pos[kk] = q.x; this.pos[kk + 1] = q.y; this.pos[kk + 2] = q.z;
      }
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.computeVertexNormals(); this.geo.computeBoundingSphere();
    const iv = Math.round(NS * (e.valvula ?? 0.5)) % NS;                                  // válvula para dentro do anel
    this.valvula.position.copy(P[iv]); this.valvula.quaternion.setFromUnitVectors(V(0, 1, 0), this.normais[iv].clone().negate());
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
let moto, perna, pernaBase, dirNo, camara, malhasMoto = [], vidraveis = [], laco, matFantasma, contornoPneu;
export async function construir() {
  estudio();
  const L = new GLTFLoader();
  const gm = await L.loadAsync('../biblioteca3d/veiculos/moto/moto.glb');
  moto = gm.scene; moto.position.y = ELEV; scene.add(moto);
  moto.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.userData.mat0 = o.material; malhasMoto.push(o);
    if (/disco_aco|pinca_vermelha/.test(o.material.name)) { const g = o.material.clone(); g.transparent = true; g.opacity = 0.22; g.depthWrite = false; o.userData.matVidro = g; vidraveis.push(o); } } });
  moto.getObjectByName('ParaLama').visible = false;                            // sem o para-lama (tirado para mexer no pneu)
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
  scene.traverse(o => { if (o.isMesh) reflexoEstudio(o.material); });           // inclusive a câmara, o cavalete e o disco transparente
  for (const m of vidraveis) reflexoEstudio(m.userData.matVidro);
  return { total: TOTAL };
}

// ------------------------------------------------------------------------------------------------ estado por instante
// A câmara vem deitada (anel horizontal), desce por cima do pneu e é puxada para baixo pela frente e por trás. As duas laterais
// descem entre o pneu e as pernas do garfo e ENGANCHAM no eixo (que está preso nas duas pernas). Sem uma perna, aquele lado sai
// pela ponta livre do eixo, passa por baixo do pneu e a câmara fica em pé em volta dele.
const RHO = 0.307, LARGL = 0.068, TOPO_EIXO = 0.04;
const rp = (th, x, extra = 0) => V(x, W.y + (RHO + extra) * Math.cos(th), W.z + (RHO + extra) * Math.sin(th));   // th: 0 em cima, + para a frente
const bez = (a, m, b, u) => a.clone().multiplyScalar((1 - u) ** 2).addScaledVector(m, 2 * u * (1 - u)).addScaledVector(b, u * u);

/** anel puxado: frente no ângulo thF, trás em thR; laterais em ±w; mid = ponto do meio de cada lateral (null = reta, presa no eixo se descer demais);
 *  arco = 0..1 mistura a lateral com o arco do pneu (por cima para -X, por baixo para +X) */
function anelPuxado(thF, thR, { w = LARGL, midE = null, midD = null, arcoE = 0, arcoD = 0, wE = w, wD = w, tremor = 0 } = {}) {
  const lado = (s, ww, mid, arco) => {
    const F = rp(thF, s * ww), R = rp(thR, s * ww), pts = [];
    let m = mid;
    if (!m) { m = F.clone().add(R).multiplyScalar(0.5); m.x = s * ww; if (m.y < W.y + TOPO_EIXO) { m.y = W.y + TOPO_EIXO + 0.01; m.z = W.z + 0.005; } }   // engancha por cima do eixo
    m = m.clone(); m.y += tremor;
    for (let k = 1; k < 8; k++) {
      const u = k / 8, c = bez(F, m.clone().multiplyScalar(2).sub(F.clone().add(R).multiplyScalar(0.5)), R, u);
      const a = s < 0 ? rp(lerp(thF, thR, u), 0) : rp(thF + (2 * Math.PI - (thF - thR)) * u, 0);   // -X passa por cima, +X por baixo
      pts.push(c.lerp(a, arco));
    }
    return pts;
  };
  const ladoE = lado(1, wD, midD, arcoD), ladoW = lado(-1, wE, midE, arcoE);
  // frente (+x → -x), lateral -X (frente → trás), trás (-x → +x), lateral +X (trás → frente)
  return [rp(thF, wD), ...[0.5, 0, -0.5].map(f => rp(thF, f * wD + (1 - Math.abs(f)) * 0, 0.014 * (1 - Math.abs(f)))), rp(thF, -wE), ...ladoW, rp(thR, -wE),
    ...[-0.5, 0, 0.5].map(f => rp(thR, f * wE, 0.014 * (1 - Math.abs(f)))), rp(thR, wD), ...ladoE.reverse()];
}

/** anel deitado descendo (antes de encostar no pneu): elipse horizontal */
function anelDeitado(y, ax, az, z0 = W.z) {
  return Array.from({ length: 24 }, (_, i) => { const a = 2 * Math.PI * i / 24; return V(ax * Math.cos(a), y + 0.01 * Math.sin(a * 3), z0 + az * Math.sin(a)); });
}

function preso(k, forca = 1) {                                                   // enganchado no eixo, sendo puxado
  const puxa = Math.sin(k * 3.2) ** 2 * forca;
  return { curva: anelPuxado(2.15 + 0.08 * puxa, -2.15 - 0.08 * puxa, { tremor: -0.006 * puxa }), valvula: 0.5 };
}

function estadoCamara(t) {
  const pl = plano(t).id;
  if (pl === 1) return preso(t, 1);
  if (pl === 8) return preso(t - 35, 1);
  if (pl === 2) {                                                                // desce deitada por cima do pneu e é puxada para baixo
    const k = t - 3;
    if (k < 1.4) { const u = suave(inv(0.0, 1.4, k)); return { curva: anelDeitado(lerp(0.60, 0.662, u), lerp(0.20, LARGL, suave(inv(0.1, 0.6, u))), lerp(0.24, 0.19, u), W.z + lerp(0.75, 0.0, u)), valvula: 0.75 }; }   // entra deitada pela frente, por baixo do bico
    const u = suave5(inv(1.4, 3.6, k)), th = lerp(0.55, 2.15, u);
    if (k < 3.6) return { curva: anelPuxado(th, -th), valvula: 0.5 };
    return preso(k - 3.6, 1);
  }
  if (pl === 3) return preso(t - 8, 1.5);                                        // do outro lado: preso também
  if (pl === 4) return { visivel: false };
  if (pl === 5) {                                                               // raio-x: a câmara no lugar certo tenta sair pelo lado esquerdo e engancha
    return { ...preso(t - 19, 1.6), raiox: true };
  }
  if (pl === 6) return preso(t - 24, 0.3);
  // plano 7: sem a perna esquerda, o lado +X sai pela ponta do eixo, passa por baixo do pneu; o lado -X sobe por cima; a câmara fica em pé
  const k = t - 30;
  const a1 = suave(inv(0.2, 1.2, k)), a2 = suave(inv(1.1, 2.4, k)), a3 = suave(inv(2.0, 3.4, k));
  const midD = a2 < 1e-3 ? V(lerp(LARGL, 0.21, a1), W.y + TOPO_EIXO + 0.01, W.z + 0.005)
    : bez(V(0.21, W.y + TOPO_EIXO + 0.01, W.z), V(0.2, W.y - 0.32, W.z), V(0, W.y - RHO, W.z), a2);
  const midE = bez(V(-LARGL, W.y + TOPO_EIXO + 0.01, W.z), V(-0.06, W.y + 0.25, W.z), V(0, W.y + RHO, W.z), a3);
  const th = lerp(2.15, Math.PI / 2, a3);
  return { curva: anelPuxado(th, -th, { midD, midE, arcoD: a2 * a3, arcoE: a3, wD: lerp(LARGL, 0, a3), wE: lerp(LARGL, 0, a3) }), valvula: 0.5 };
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
  const vidro = !on && [1, 3, 8].includes(pl);                                  // nos closes o disco e a pinça ficam transparentes para mostrar o gancho no eixo
  if (vidro) for (const m of vidraveis) m.material = m.userData.matVidro;
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
      const s = suave(u); p = V(lerp(0.95, 0.74, s), lerp(0.62, 0.56, s), lerp(1.6, 1.38, s)); a = V(0.06, 0.46, 0.66); fov = 36; break; }
    case 2: {                                                                   // plano médio 3/4: a câmara chega e trava
      const s = suave(u); p = V(lerp(1.0, 0.85, s), lerp(1.45, 1.05, s), lerp(1.75, 1.6, s)); a = V(0.03, lerp(0.62, 0.48, s), 0.66); fov = 38; break; }
    case 3: {                                                                   // o outro lado (entra com whip)
      const s = suave(u); p = V(lerp(-1.05, -0.85, s), lerp(0.72, 0.6, s), lerp(1.8, 1.55, s)); a = V(-0.05, 0.46, 0.66); fov = 38; break; }
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
