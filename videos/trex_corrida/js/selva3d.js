// SELVA para a perseguição (Three.js): estrada de terra reta ao longo de +X (tentativas 1 e 3), mata fechada dos dois lados, um corredor que sai da
// estrada para dentro da mata até uma FENDA estreita entre duas rochas (tentativa 2) e um grupo de rochas mais adiante (esconderijo do maratonista).
// Tudo CC0 do Poly Haven (versões leves das árvores por decimar.py), espalhado por instâncias com semente fixa. Y para cima; estrada em z = 0.
import * as THREE from 'three';
import { materialPH, modeloPH, hdriPH } from '../../biblioteca3d/polyhaven/ph.js';
import { mulberry32, clamp } from './util.js';

export const ESTRADA_LARG = 4.2;
// trilha da tentativa 2: sai da estrada em x≈6 e entra na mata (+z) até a fenda (~21 m de corrida: ~4 s)
export const TRILHA = [[2, 0], [6, 0.4], [10, 2.5], [14, 5.0], [17.5, 7.2], [19.6, 8.6]];
export const FENDA = { x: 20.8, z: 9.4, giro: 0.6 };                   // entre duas rochas grandes; abertura ~0,8 m
export const ESCONDE_M = { x: 58, z: -6.5 };                             // rochas do maratonista (lado -z)

export function alturaChao(x, z) {
  const d = Math.abs(z);
  const ond = 0.35 * Math.sin(x * 0.11 + 1.3) * Math.sin(z * 0.17) + 0.18 * Math.sin(x * 0.31 + z * 0.23);
  return d < ESTRADA_LARG / 2 + 0.6 ? 0.02 * Math.sin(x * 0.7) : ond * clamp((d - 2.7) / 4, 0, 1);
}
function distTrilha(x, z) {
  let m = 1e9;
  for (let i = 0; i < TRILHA.length - 1; i++) {
    const [ax, az] = TRILHA[i], [bx, bz] = TRILHA[i + 1], vx = bx - ax, vz = bz - az, t = clamp(((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz));
    m = Math.min(m, Math.hypot(x - (ax + t * vx), z - (az + t * vz)));
  }
  return m;
}

function instanciar(pai, modelo, matrizes, { sombra = true } = {}) {
  modelo.updateMatrixWorld(true);
  modelo.traverse(o => {
    if (!o.isMesh) return;
    const im = new THREE.InstancedMesh(o.geometry, o.material, matrizes.length); const rel = o.matrixWorld.clone();
    matrizes.forEach((M, i) => im.setMatrixAt(i, M.clone().multiply(rel)));
    im.castShadow = sombra; im.receiveShadow = true; im.frustumCulled = false;
    if (o.material.transparent || o.material.alphaTest) { o.material.alphaTest = Math.max(o.material.alphaTest || 0, 0.45); o.material.transparent = false; o.material.side = THREE.DoubleSide; }
    pai.add(im);
  });
}

export async function construirSelva(pai, renderer) {
  const G = new THREE.Group(); G.name = 'selva'; pai.add(G);
  const R = mulberry32(17);
  // chão: terreno com estrada de terra, mato de folhas dos lados
  const N = 240, T = 160; const geo = new THREE.PlaneGeometry(T * 2, T * 2, N, N); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position; for (let i = 0; i < pos.count; i++) pos.setY(i, alturaChao(pos.getX(i), pos.getZ(i)));
  geo.computeVertexNormals(); geo.setAttribute('uv2', geo.attributes.uv);
  const mFolhas = materialPH('forest_leaves_02', { rep: [70, 70] }), mTerra = materialPH('brown_mud_03', { rep: [70, 70] });
  const chao = new THREE.Mesh(geo, mFolhas); chao.receiveShadow = true; G.add(chao);
  const geoE = new THREE.PlaneGeometry(T * 2, ESTRADA_LARG + 1.2, 400, 8); geoE.rotateX(-Math.PI / 2); const pe = geoE.attributes.position;
  for (let i = 0; i < pe.count; i++) pe.setY(i, alturaChao(pe.getX(i), pe.getZ(i)) + 0.015); geoE.computeVertexNormals();
  const mE = materialPH('brown_mud_03', { rep: [80, 1.6], extra: { transparent: false } }); const estrada = new THREE.Mesh(geoE, mE); estrada.receiveShadow = true; G.add(estrada);
  // trilha batida para dentro da mata
  const pts = TRILHA.map(([x, z]) => new THREE.Vector3(x, 0, z)); const curva = new THREE.CatmullRomCurve3(pts);
  const trilhaGeo = new THREE.TubeGeometry(curva, 60, 0.9, 6, false); trilhaGeo.scale(1, 0.02, 1); const tr = new THREE.Mesh(trilhaGeo, mTerra); tr.position.y = 0.03; tr.receiveShadow = true; G.add(tr);

  // assets
  const L = { leve: true };
  const arv = [await modeloPH('jacaranda_tree', L), await modeloPH('island_tree_01', L), await modeloPH('island_tree_03', L), await modeloPH('tree_small_02', L)];
  const sam = await modeloPH('fern_02'), fol = [await modeloPH('anthurium_botany_01'), await modeloPH('calathea_orbifolia_01'), await modeloPH('pachira_aquatica_01')];
  const arb = [await modeloPH('shrub_01', L), await modeloPH('shrub_04')], ped = [await modeloPH('rock_moss_set_01'), await modeloPH('rock_moss_set_02'), await modeloPH('boulder_01'), await modeloPH('rock_07')];
  const tronco = [await modeloPH('dead_tree_trunk_02'), await modeloPH('root_cluster_01', L)];
  const livre = (x, z, folga) => Math.abs(z) > ESTRADA_LARG / 2 + folga && distTrilha(x, z) > 1.6 + folga * 0.5 && Math.hypot(x - FENDA.x, z - FENDA.z) > 3.2 && Math.hypot(x - ESCONDE_M.x, z - ESCONDE_M.z) > 3.5;
  const M = (x, z, esc, giro, afunda = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, alturaChao(x, z) - afunda, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), giro), new THREE.Vector3(esc, esc, esc));
  const espalhar = (mods, n, rmin, rmax, esc, folga, xs = [-90, 140]) => {
    const por = mods.map(() => []);
    for (let k = 0, f = 0; k < n * 30 && f < n; k++) {
      const x = xs[0] + R() * (xs[1] - xs[0]), z = (R() < 0.5 ? -1 : 1) * (rmin + R() * (rmax - rmin));
      if (!livre(x, z, folga)) continue;
      por[Math.floor(R() * mods.length)].push(M(x, z, esc[0] + R() * (esc[1] - esc[0]), R() * 6.283)); f++;
    }
    mods.forEach((m, i) => por[i].length && instanciar(G, m, por[i]));
  };
  espalhar(arv, 170, 5.5, 60, [0.9, 1.5], 3.0);                           // árvores
  espalhar([sam], 900, 2.8, 40, [1.6, 3.0], 0.6);                         // samambaias gigantes
  espalhar(fol, 500, 2.8, 35, [1.2, 2.4], 0.5);                           // folhagens tropicais
  espalhar(arb, 260, 3.0, 45, [1.0, 2.0], 0.8);                           // arbustos
  espalhar(ped, 120, 3.2, 40, [0.8, 2.4], 0.8);                           // rochas com musgo
  espalhar(tronco, 30, 4, 30, [1.0, 1.6], 1.0);
  // a trilha da tentativa 2 fica cercada de árvores próximas (ele passa entre elas; o T. rex trava)
  const perto = [];
  for (let i = 0; i < 26; i++) {
    const u = R(), seg = curva.getPointAt(0.25 + 0.7 * u), tg = curva.getTangentAt(0.25 + 0.7 * u), lado = R() < 0.5 ? -1 : 1, d = 2.1 + R() * 1.6;
    const x = seg.x - tg.z * lado * d, z = seg.z + tg.x * lado * d; if (Math.hypot(x - FENDA.x, z - FENDA.z) < 3) continue; perto.push(M(x, z, 0.9 + R() * 0.5, R() * 6.283));
  }
  instanciar(G, arv[1], perto);
  // a fenda: duas rochas grandes inclinadas uma contra a outra, abertura estreita
  const rocha = await modeloPH('boulder_01'); const bb = new THREE.Box3().setFromObject(rocha), tam = bb.getSize(new THREE.Vector3());
  const escR = 3.4 / Math.max(tam.x, tam.z);
  for (const s of [-1, 1]) {
    const r = rocha.clone(), dx = Math.cos(FENDA.giro + Math.PI / 2) * s * (0.4 + tam.x * escR / 2), dz = Math.sin(FENDA.giro + Math.PI / 2) * s * (0.4 + tam.z * escR / 2);
    r.position.set(FENDA.x + dx, alturaChao(FENDA.x, FENDA.z) - 0.2, FENDA.z + dz); r.scale.setScalar(escR); r.rotation.set(0, FENDA.giro + (s > 0 ? Math.PI : 0), s * 0.12); G.add(r);
  }
  // esconderijo do maratonista: rochas altas
  for (let i = 0; i < 4; i++) { const r = ped[2].clone(); r.position.set(ESCONDE_M.x + (i - 1.5) * 2.6, alturaChao(ESCONDE_M.x, ESCONDE_M.z) - 0.25, ESCONDE_M.z - 1.2 + (i % 2) * 1.4); r.scale.setScalar(1.8 + 0.4 * (i % 2)); r.rotation.y = i * 1.3; G.add(r); }
  // céu e luz: floresta (HDRI), sol entre as copas, névoa esverdeada
  const hd = await hdriPH('mossy_forest', renderer, { res: '2k' });
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), new THREE.MeshBasicMaterial({ map: hd.fundo, side: THREE.BackSide, fog: false, depthWrite: false })); ceu.renderOrder = -10; G.add(ceu);
  const sol = new THREE.DirectionalLight(0xffe2b8, 3.4); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 120 }); sol.shadow.bias = -0.0006; sol.shadow.normalBias = 0.04; G.add(sol, sol.target);
  const hemi = new THREE.HemisphereLight(0xcfe4c8, 0x3a3020, 0.7); G.add(hemi);
  const DIR = new THREE.Vector3(-0.45, 0.62, 0.62).normalize();
  return {
    g: G, ambiente: hd.ambiente, sol, hemi, curva,
    nevoa: new THREE.FogExp2(0x9fb39a, 0.018),
    /** a sombra do sol acompanha o assunto do plano */
    iluminar(alvo) { sol.position.copy(alvo).addScaledVector(DIR, 50); sol.target.position.copy(alvo); sol.target.updateMatrixWorld(); },
  };
}
