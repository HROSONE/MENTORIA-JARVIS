// DESFILADEIRO: estrada de terra vermelha na beira de um penhasco, com a encosta subindo de um lado e o vale 70 m abaixo do outro
// (pedras, árvores, arbustos). Terreno em malha de alturas com material triplanar (terra vermelha na estrada, chão pedregoso no plano,
// paredão de rocha onde é íngreme), céu e reflexos de um cânion real (HDRI CC0), sol de fim de tarde, névoa quente de distância.
// Estrada: x = estradaX(z), largura 6 m, em y = 0; o abismo fica do lado -x.
import * as THREE from 'three';
import { materialPH, modeloPH, hdriPH } from '../../biblioteca3d/polyhaven/ph.js';
import { mulberry32 } from './util.js';

export const LARG_ESTRADA = 6.0, FUNDO_VALE = -72;
export const estradaX = z => 9 * Math.sin(z / 70) + 3 * Math.sin(z / 23 + 1.3);
export function estradaDir(z) { const e = 0.5, dx = estradaX(z + e) - estradaX(z - e); return Math.atan2(dx, 2 * e); }   // rumo (yaw) da estrada em z

// ruído de valor 2D determinístico (para relevo)
function ruido2(seed) {
  const R = mulberry32(seed), N = 256, P = new Float32Array(N * N); for (let i = 0; i < N * N; i++) P[i] = R();
  const at = (x, y) => P[((y & 255) * N) + (x & 255)];
  return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return (at(xi, yi) * (1 - u) + at(xi + 1, yi) * u) * (1 - v) + (at(xi, yi + 1) * (1 - u) + at(xi + 1, yi + 1) * u) * v; };
}
const n1 = ruido2(3), n2 = ruido2(8);
const fbm = (x, y, oit = 5) => { let a = 0, f = 1, s = 0, t = 0; for (let i = 0; i < oit; i++) { a += (n1(x * f, y * f) - 0.5) * (1 / f); s += 1 / f; f *= 2.03; } return a / s; };

/** altura do terreno em (x, z): estrada plana, encosta subindo em +x, penhasco em -x até o vale */
export function altura(x, z) {
  const d = x - estradaX(z), borda = LARG_ESTRADA / 2;
  if (Math.abs(d) <= borda + 0.6) return 0.02 * fbm(x * 0.8, z * 0.8, 2);                                  // estrada
  if (d > 0) { const k = d - borda - 0.6; return k * 0.55 + k * k * 0.012 + 3.5 * fbm(x * 0.05, z * 0.05) * Math.min(1, k / 6) + 0.3 * fbm(x * 0.6, z * 0.6, 3); }   // encosta
  const k = -d - borda - 0.6;                                                                                // acostamento estreito e o penhasco
  if (k < 1.6) return -0.15 * k + 0.08 * fbm(x, z, 3);
  const queda = Math.min(1, Math.pow((k - 1.6) / 9, 0.55));                                                  // parede quase vertical nos primeiros metros
  const rocha = 4.5 * fbm(x * 0.09, z * 0.09) + 1.6 * fbm(x * 0.4, z * 0.4, 3);
  const vale = FUNDO_VALE + 6 * fbm(x * 0.02 + 7, z * 0.02) + 2 * fbm(x * 0.15, z * 0.15, 3);
  return -0.25 + (vale + 0.25) * queda + rocha * Math.sin(queda * Math.PI) * 0.8;
}

function materialTerreno(texs, renderer) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0 });
  const U = { tEstrada: { value: texs.estrada }, tChao: { value: texs.chao }, tRocha: { value: texs.rocha }, tRochaN: { value: texs.rochaN } };
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vPosW; varying vec3 vNorW;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvPosW = (modelMatrix * vec4(transformed, 1.0)).xyz; vNorW = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vPosW; varying vec3 vNorW; uniform sampler2D tEstrada, tChao, tRocha, tRochaN;
      float estradaX(float z) { return 9.0 * sin(z / 70.0) + 3.0 * sin(z / 23.0 + 1.3); }
      vec3 tri(sampler2D t, vec3 p, vec3 w, float s) { return texture2D(t, p.zy * s).rgb * w.x + texture2D(t, p.xz * s).rgb * w.y + texture2D(t, p.xy * s).rgb * w.z; }`)
      .replace('#include <map_fragment>', `
      vec3 nW = normalize(vNorW); vec3 w = pow(abs(nW), vec3(5.0)); w /= (w.x + w.y + w.z);
      float d = abs(vPosW.x - estradaX(vPosW.z));
      vec3 cE = texture2D(tEstrada, vPosW.xz * 0.22).rgb;
      vec3 cC = texture2D(tChao, vPosW.xz * 0.12).rgb;
      vec3 cR = tri(tRocha, vPosW, w, 0.045) * vec3(1.05, 0.86, 0.74);
      float ingreme = smoothstep(0.55, 0.80, 1.0 - nW.y);
      float naEstrada = 1.0 - smoothstep(2.6, 3.8, d);
      // trilhas de pneu: duas faixas mais escuras e lisas
      float trilha = (1.0 - smoothstep(0.18, 0.45, abs(d - 0.85))) * naEstrada;
      vec3 base = mix(mix(cC * vec3(1.08, 0.92, 0.82), cE, naEstrada), cR, ingreme);
      base *= 1.0 - 0.18 * trilha;
      diffuseColor.rgb *= base;`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(0.92, 0.78, ingreme);');
  };
  return m;
}

export async function construirDesfiladeiro(pai, renderer) {
  const G = new THREE.Group(); G.name = 'desfiladeiro'; pai.add(G);
  const carregar = (id, res) => materialPH(id, { res, rep: [1, 1] });
  const texs = { estrada: carregar('red_laterite_soil_stones', '2k').map, chao: carregar('dry_ground_rocks', '2k').map, rocha: carregar('cliff_side', '2k').map, rochaN: carregar('cliff_side', '2k').normalMap };
  // terreno: malha de alturas mais densa perto da estrada (x de -95 a 90; z de -260 a 260)
  const xs = [], zs = [];
  for (let x = -95; x <= 90; x += x < -40 || x > 40 ? 3 : 0.8) xs.push(x);
  for (let z = -260; z <= 260; z += 1.6) zs.push(z);
  const pos = new Float32Array(xs.length * zs.length * 3); let k = 0;
  for (const z of zs) for (const xr of xs) { const x = xr + estradaX(z); pos[k++] = x; pos[k++] = altura(x, z); pos[k++] = z; }
  const idx = []; const NX = xs.length;
  for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i; idx.push(a, a + NX, a + 1, a + 1, a + NX, a + NX + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const terreno = new THREE.Mesh(geo, materialTerreno(texs, renderer)); terreno.receiveShadow = true; terreno.castShadow = true; G.add(terreno);

  // céu de cânion (HDRI) como fundo e reflexo
  const hd = await hdriPH('valley_of_desolation', renderer, { res: '2k' });
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(800, 64, 32), new THREE.MeshBasicMaterial({ map: hd.fundo, side: THREE.BackSide, fog: false, depthWrite: false }));
  ceu.rotation.y = 1.2; ceu.renderOrder = -10; G.add(ceu);

  // pedras, árvores e arbustos (CC0), espalhados de forma determinística
  const R = mulberry32(42);
  const L_ = { leve: true }, pedraA = await modeloPH('namaqualand_boulder_02', L_), pedraB = await modeloPH('namaqualand_boulder_05', L_), arvore = await modeloPH('island_tree_02', L_), arbusto = await modeloPH('shrub_02', L_), tronco = await modeloPH('dead_tree_trunk', L_);
  const por = (mod, x, z, esc, giro, afunda = 0.1) => { const o = mod.clone(); o.position.set(x, altura(x, z) - afunda * esc, z); o.scale.setScalar(esc); o.rotation.y = giro; G.add(o); return o; };
  for (let i = 0; i < 70; i++) { const z = -240 + R() * 480, d = 6 + R() * 40; por(R() < 0.5 ? pedraA : pedraB, estradaX(z) + d, z, 0.6 + R() * 2.2, R() * 6); }               // encosta
  for (let i = 0; i < 90; i++) { const z = -240 + R() * 480, d = -(18 + R() * 70); por(R() < 0.5 ? pedraA : pedraB, estradaX(z) + d, z, 1 + R() * 4, R() * 6); }            // vale
  for (let i = 0; i < 40; i++) { const z = -240 + R() * 480, d = -(22 + R() * 70); por(arvore, estradaX(z) + d, z, 1.4 + R() * 1.4, R() * 6, 0); }                           // árvores no vale
  for (let i = 0; i < 16; i++) { const z = -240 + R() * 480, d = 8 + R() * 30; por(arvore, estradaX(z) + d, z, 1.0 + R(), R() * 6, 0); }                                   // árvores na encosta
  for (let i = 0; i < 80; i++) { const z = -240 + R() * 480, s = R() < 0.6 ? 1 : -1, d = s > 0 ? 3.8 + R() * 10 : -(4.2 + R() * 1.0); por(arbusto, estradaX(z) + d, z, 0.25 + R() * 0.35, R() * 6, 0); }   // beira da estrada
  for (let i = 0; i < 10; i++) { const z = -240 + R() * 480, d = 4 + R() * 6; por(tronco, estradaX(z) + d, z, 0.8 + R() * 0.6, R() * 6, 0.05); }

  // luz: sol baixo de fim de tarde (quente), céu (hemisfério) e névoa de distância quente
  const sol = new THREE.DirectionalLight(0xffd2a0, 3.2); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 140 }); sol.shadow.bias = -0.0005; sol.shadow.normalBias = 0.03;
  G.add(sol, sol.target);
  const hemi = new THREE.HemisphereLight(0xbcd2ec, 0x7a4a30, 0.9); G.add(hemi);
  const DIR_SOL = new THREE.Vector3(-0.55, 0.42, 0.72).normalize();
  return {
    g: G, ambiente: hd.ambiente, sol, hemi, terreno,
    nevoa: new THREE.FogExp2(0xd9a882, 0.0042),
    /** a sombra do sol acompanha o assunto do plano */
    iluminar(alvo) { sol.position.copy(alvo).addScaledVector(DIR_SOL, 60); sol.target.position.copy(alvo); },
  };
}
