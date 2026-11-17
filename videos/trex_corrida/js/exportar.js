// EXPORTAÇÃO para o Blender (render de cinema no Colab): a MESMA animação desta página, quadro a quadro.
//   personagens: um GLB animado por ator (ossos, posição, sumir = escala 0, expressões do rosto), amostrado a 30 qps
//   câmera e sol: JSON por quadro (posição, rotação, campo de visão vertical, foco, abertura), já nos eixos do Blender (z para cima)
//   cenário: GLB só com as malhas próprias (chão, estrada, paredes da fenda) e a referência da textura do Poly Haven;
//            plantas, árvores e pedras vão como lista de cópias (id do modelo + matriz) para o Blender usar os modelos originais.
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { scene, cam, passFoco } from './motor.js';
import { S, atualizar, acharPlano, mundo } from './planos.js';
import { INSTANCIAS } from './selva3d.js';

const FPS = 30;
// eixos: three (y para cima) -> Blender (z para cima): (x, y, z) -> (x, -z, y)
const R = new THREE.Matrix4().makeRotationX(Math.PI / 2), Ri = R.clone().invert(), qR = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
const paraBlender = M => R.clone().multiply(M).multiply(Ri);

function atoresDaCena() {
  const W = mundo();
  W.T.grupo.name = 'trex'; W.H.grupo.name = 'trilheiro'; W.Mt.grupo.name = 'maratonista'; W.ten.name = 'tenis';
  return [W.T.grupo, W.H.grupo, W.Mt.grupo, W.ten];
}

/** amostra o filme inteiro; devolve trilhas por ator e os dados de câmera/sol */
function amostrar() {
  const W = mundo(), atores = atoresDaCena(), N = Math.round(S.total * FPS);
  const reg = atores.map(raiz => {
    const nos = [raiz]; raiz.traverse(o => { if (o !== raiz && (o.isBone || o.name === 'tenis_parte')) nos.push(o); });
    const morfos = []; raiz.traverse(o => { if (o.isMesh && o.morphTargetInfluences && o.morphTargetInfluences.length) morfos.push(o); });
    return { raiz, nos, morfos, pos: nos.map(() => []), rot: nos.map(() => []), esc: [], mor: morfos.map(() => []) };
  });
  const quadros = [], v = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const t = i / FPS; atualizar(t); cam.updateMatrixWorld(true);
    for (const r of reg) {
      r.nos.forEach((n, k) => { r.pos[k].push(...n.position.toArray()); r.rot[k].push(...n.quaternion.toArray()); });
      const vis = r.raiz.visible ? 1 : 0; r.esc.push(r.raiz.scale.x * vis, r.raiz.scale.y * vis, r.raiz.scale.z * vis);
      r.morfos.forEach((m, k) => r.mor[k].push(...m.morphTargetInfluences));
    }
    // câmera nos eixos do Blender (a câmera do Blender também olha para -z local com y para cima: só a troca de eixos do mundo)
    const Mb = R.clone().multiply(cam.matrixWorld); Mb.decompose(v, q, sc);
    const sol = W.selva.sol, p = acharPlano(t);
    quadros.push({
      t: +t.toFixed(4), plano: p.id,
      cam: { pos: v.toArray().map(x => +x.toFixed(4)), quat: [q.w, q.x, q.y, q.z].map(x => +x.toFixed(6)), fov: cam.fov,
             foco: +passFoco.uniforms.focus.value.toFixed(3), abertura: passFoco.enabled ? passFoco.uniforms.aperture.value : 0 },
      sol: { pos: sol.position.clone().applyMatrix4(R).toArray().map(x => +x.toFixed(3)), alvo: sol.target.position.clone().applyMatrix4(R).toArray().map(x => +x.toFixed(3)) },
    });
  }
  return { reg, quadros, N };
}

function clipe(r, N) {
  const tempos = Array.from({ length: N }, (_, i) => i / FPS), tr = [];
  r.nos.forEach((n, k) => {
    tr.push(new THREE.VectorKeyframeTrack(n.uuid + '.position', tempos, r.pos[k]));
    tr.push(new THREE.QuaternionKeyframeTrack(n.uuid + '.quaternion', tempos, r.rot[k]));
  });
  tr.push(new THREE.VectorKeyframeTrack(r.raiz.uuid + '.scale', tempos, r.esc));
  r.morfos.forEach((m, k) => tr.push(new THREE.NumberKeyframeTrack(m.uuid + '.morphTargetInfluences', tempos, r.mor[k])));
  return new THREE.AnimationClip('filme', N / FPS, tr);
}

const exportarGLB = (obj, animacoes = []) => new Promise((ok, falha) =>
  new GLTFExporter().parse(obj, ok, falha, { binary: true, animations: animacoes, onlyVisible: false, maxTextureSize: 2048 }));
const b64 = buf => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };

/** cenário fixo: só as malhas feitas aqui (chão, estrada, paredes), com material simples + a referência da textura Poly Haven (extras) */
function cenarioFixo() {
  const G = new THREE.Group(); G.name = 'cenario';
  mundo().selva.g.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || o.material.side === THREE.BackSide) return;        // (cópias e o céu ficam de fora)
    let pai = o.parent, ph = false; while (pai) { if (pai.userData.ph) ph = true; pai = pai.parent; } if (ph) return;   // (modelos Poly Haven vão como cópias)
    o.updateWorldMatrix(true, false);
    const m = new THREE.Mesh(o.geometry, new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 1 }));
    m.material.userData = { ph: o.material.userData.ph || null }; m.name = o.name || 'malha';
    m.applyMatrix4(o.matrixWorld); G.add(m);
  });
  return G;
}

/** cópias: id do modelo e matriz (eixos do Blender); as que a limpeza da lente tirou (escala 0 em alguma parte) ficam de fora */
function copias() {
  const M = new THREE.Matrix4(), out = {}; let tiradas = 0;
  for (const reg of INSTANCIAS) {
    reg.matrizes.forEach((mat, i) => {
      if (reg.ims.some(im => { im.getMatrixAt(i, M); return M.elements[0] === 0 && M.elements[5] === 0 && M.elements[10] === 0; })) { tiradas++; return; }
      (out[reg.id] = out[reg.id] || []).push(paraBlender(mat).elements.map(x => +x.toFixed(5)));
    });
  }
  // modelos colocados um a um (pedras do esconderijo)
  mundo().selva.g.children.forEach(o => { if (o.userData.ph && !o.isInstancedMesh) { o.updateMatrixWorld(true); (out[o.userData.ph] = out[o.userData.ph] || []).push(paraBlender(o.matrixWorld).elements.map(x => +x.toFixed(5))); } });
  return { copias: out, tiradas };
}

export async function exportar() {
  const { reg, quadros, N } = amostrar();
  // o visor do relógio é uma textura fixa no GLB: o do maratonista mostra 21 km/h (o inserto S9r); o do trilheiro não aparece de perto
  mundo().relM.userData.mostrar(21); mundo().rel.userData.mostrar(18);
  const res = { arquivos: {}, info: {} };
  for (const r of reg) {
    // o GLB sai no repouso do quadro 0 (as trilhas animam tudo); quem estava escondido volta a aparecer no arquivo
    const vis = r.raiz.visible; r.raiz.visible = true;
    res.arquivos[r.raiz.name + '_anim.glb'] = b64(await exportarGLB(r.raiz, [clipe(r, N)]));
    r.raiz.visible = vis; res.info[r.raiz.name] = { nos: r.nos.length, morfos: r.morfos.length };
  }
  res.arquivos['cenario.glb'] = b64(await exportarGLB(cenarioFixo()));
  const c = copias(); res.info.copias_tiradas = c.tiradas;
  const W = mundo();
  res.json = {
    'camera.json': { fps: FPS, quadros: N, planos: S.planos.map(p => ({ nome: p.id, t0: p.t0, t1: p.t0 + p.dur })), por_quadro: quadros },
    'instancias.json': c.copias,
    'ambiente.json': { hdri: 'mossy_forest', nevoa: { cor: '#' + scene.fog.color.getHexString(), densidade: scene.fog.density }, sol: { cor: '#' + W.selva.sol.color.getHexString(), intensidade: W.selva.sol.intensity } },
  };
  return res;
}
