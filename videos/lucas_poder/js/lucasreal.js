// LUCAS REALISTA no Three.js: carrega o GLB gerado no Blender (biblioteca3d/personagens/lucas), arruma materiais (pele com brilho de sub-superfície falso,
// cabelo/cílios com recorte de alfa, olhos com verniz) e dá controles: girar ossos em eixos do próprio corpo, IK de braço e perna, expressões (morph targets).
// Esqueleto "game_engine": pelvis, spine_01..03, neck_01, head, clavicle_*, upperarm_*, lowerarm_*, hand_*, thigh_*, calf_*, foot_*, ball_* (lado _l = esquerda do Lucas = +x).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clamp } from './util.js';

const URL_LUCAS = '../biblioteca3d/personagens/lucas/lucas12.glb';
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3();

export async function criarLucasReal({ url = URL_LUCAS } = {}) {
  const gltf = await new GLTFLoader().loadAsync(url);
  const raiz = gltf.scene, grupo = new THREE.Group(); grupo.add(raiz); grupo.name = 'LucasReal';
  const ossos = {}, malhas = [];
  raiz.traverse(o => {
    if (o.isBone) ossos[o.name] = o;
    if (o.isMesh) {
      malhas.push(o); o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
      const m = o.material, n = m.name;
      if (n === 'pele') {
        o.material = new THREE.MeshPhysicalMaterial({ name: 'pele', map: m.map, normalMap: m.normalMap, roughness: 0.58, metalness: 0, sheen: 0.45, sheenRoughness: 0.7, sheenColor: new THREE.Color(0xff8f78), specularIntensity: 0.55 });
      } else if (['cabelo', 'cilios', 'sobrancelha'].includes(n)) {
        m.transparent = n !== 'cabelo'; m.alphaTest = n === 'cabelo' ? 0.42 : 0.15; m.depthWrite = n === 'cabelo'; m.side = THREE.DoubleSide; m.roughness = 0.6;
        if (n === 'cabelo') { m.color.setRGB(1, 1, 1); o.renderOrder = 2; } else o.renderOrder = 3;
      } else if (n === 'olho') {
        o.material = new THREE.MeshPhysicalMaterial({ name: 'olho', map: m.map, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.03 });
      } else if (n === 'roupa') { m.side = THREE.DoubleSide; m.roughness = 0.92; }
    }
  });
  const repouso = {}; for (const k in ossos) repouso[k] = { q: ossos[k].quaternion.clone(), p: ossos[k].position.clone() };
  const morphs = malhas.filter(m => m.morphTargetDictionary);
  grupo.updateMatrixWorld(true); const cabRep = ossos.head.getWorldQuaternion(new THREE.Quaternion());      // orientação de repouso da cabeça (rosto para +z)

  const L = {
    grupo, ossos, malhas, altura: 1.384,
    /** volta à pose de repouso (A) */
    reset() { for (const k in ossos) { ossos[k].quaternion.copy(repouso[k].q); ossos[k].position.copy(repouso[k].p); } for (const m of morphs) m.morphTargetInfluences.fill(0); return L; },
    /** gira um osso `ang` rad em torno de um eixo dado no espaço do corpo (x = esquerda do Lucas, y = cima, z = frente) */
    girar(nome, eixo, ang) {
      const b = ossos[nome]; if (!b || !ang) return L;
      grupo.updateMatrixWorld(true);
      const qg = grupo.getWorldQuaternion(_q2), eixoMundo = _v.set(eixo[0], eixo[1], eixo[2]).normalize().applyQuaternion(qg);
      const qm = _q.setFromAxisAngle(eixoMundo, ang), pw = b.parent.getWorldQuaternion(new THREE.Quaternion()), bw = b.getWorldQuaternion(new THREE.Quaternion());
      b.quaternion.copy(pw.invert().multiply(qm.multiply(bw)));
      return L;
    },
    /** atalhos: flexão (para a frente), lateral, torção — em graus */
    dobrar(nome, gx = 0, gy = 0, gz = 0) { if (gx) L.girar(nome, [1, 0, 0], gx * Math.PI / 180); if (gy) L.girar(nome, [0, 1, 0], gy * Math.PI / 180); if (gz) L.girar(nome, [0, 0, 1], gz * Math.PI / 180); return L; },
    pos(nome, alvo = new THREE.Vector3()) { grupo.updateMatrixWorld(true); return ossos[nome].getWorldPosition(alvo); },
    /** IK de dois ossos (mundo): leva a ponta da cadeia a `alvo`; `polo` = direção para onde o joelho/cotovelo aponta (mundo) */
    ik(a, b, c, alvo, polo) {
      grupo.updateMatrixWorld(true);
      const A = ossos[a], Bn = ossos[b], C = ossos[c];
      const pa = A.getWorldPosition(new THREE.Vector3()), pb = Bn.getWorldPosition(new THREE.Vector3()), pc = C.getWorldPosition(new THREE.Vector3());
      const l1 = pa.distanceTo(pb), l2 = pb.distanceTo(pc);
      const d = alvo.clone().sub(pa), dist = clamp(d.length(), Math.abs(l1 - l2) + 1e-4, (l1 + l2) * 0.999); d.normalize();
      const p = polo.clone().sub(d.clone().multiplyScalar(polo.dot(d))); if (p.lengthSq() < 1e-8) p.set(0, -1, 0); p.normalize();
      const ang = Math.acos(clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1));
      const E = pa.clone().add(d.clone().multiplyScalar(Math.cos(ang) * l1)).add(p.clone().multiplyScalar(Math.sin(ang) * l1));
      const T = pa.clone().add(d.clone().multiplyScalar(dist));
      const giraMundo = (bone, de, para) => { const q = new THREE.Quaternion().setFromUnitVectors(de.normalize(), para.normalize()); const pw = bone.parent.getWorldQuaternion(new THREE.Quaternion()), bw = bone.getWorldQuaternion(new THREE.Quaternion()); bone.quaternion.copy(pw.invert().multiply(q.multiply(bw))); };
      giraMundo(A, pb.clone().sub(pa), E.clone().sub(pa)); grupo.updateMatrixWorld(true);
      const pb2 = Bn.getWorldPosition(new THREE.Vector3()), pc2 = C.getWorldPosition(new THREE.Vector3());
      giraMundo(Bn, pc2.clone().sub(pb2), T.clone().sub(pb2)); grupo.updateMatrixWorld(true);
      return L;
    },
    /** vira pescoço e cabeça para o rosto apontar para `alvo` (mundo); forca 0..1 */
    olharPara(alvo, forca = 1) {
      grupo.updateMatrixWorld(true);
      const gq = grupo.getWorldQuaternion(new THREE.Quaternion());
      for (const [nome, parte] of [['neck_01', 0.4], ['head', 1.0]]) {
        const b = ossos[nome], hw = ossos.head.getWorldQuaternion(new THREE.Quaternion());
        const frente = new THREE.Vector3(0, 0, 1).applyQuaternion(hw.clone().multiply(cabRep.clone().invert())).applyQuaternion(gq.clone().multiply(gq.clone().invert()));
        const para = alvo.clone().sub(ossos.head.getWorldPosition(new THREE.Vector3())).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(frente.normalize(), para); q.slerp(new THREE.Quaternion(), 1 - forca * parte);
        const pw = b.parent.getWorldQuaternion(new THREE.Quaternion()), bw = b.getWorldQuaternion(new THREE.Quaternion());
        b.quaternion.copy(pw.invert().multiply(q.multiply(bw))); b.updateMatrixWorld(true);
      }
      return L;
    },
    /** expressões: { 'eye-left-closure': 0..1, ... } (nomes do MakeHuman); atalhos: piscar, triste, esforco, boca */
    expressao(mapa) {
      for (const m of morphs) { const d = m.morphTargetDictionary; for (const k in mapa) if (k in d) m.morphTargetInfluences[d[k]] = mapa[k]; }
      return L;
    },
    rosto({ piscar = 0, triste = 0, esforco = 0, boca = 0 } = {}) {
      return L.expressao({
        'eye-left-closure': clamp(piscar + 0.25 * esforco), 'eye-right-closure': clamp(piscar + 0.25 * esforco),
        'eyebrows-left-inner-up': clamp(triste * 0.9 + esforco * 0.5), 'eyebrows-right-inner-up': clamp(triste * 0.9 + esforco * 0.5),
        'eyebrows-left-down': 0.4 * esforco, 'eyebrows-right-down': 0.4 * esforco,
        'mouth-depression': 0.5 * triste, 'mouth-open': clamp(boca + 0.15 * esforco), 'mouth-retraction': 0.6 * esforco, 'mouth-compression': 0.2 * triste,
        'nose-left-dilatation': 0.5 * esforco, 'nose-right-dilatation': 0.5 * esforco,
      });
    },
  };
  return L;
}
