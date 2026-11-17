// TUBARÃO-BRANCO no Three.js: modelo pronto "Animated Swimming Great White Shark Loop" de LasquetiSpice (Sketchfab, licença CC BY 4.0,
// crédito obrigatório: "Animated Swimming Great White Shark Loop" by LasquetiSpice, https://sketchfab.com/3d-models/animated-swimming-great-white-shark-loop-297ed35c6a5f43749b0ae189d991a3f1).
// O arquivo veio com material specular-glossiness, convertido para metal/rugosidade (npx @gltf-transform/cli metalrough). Ele traz esqueleto
// e 3 animações: 'Swimming' (laço de 2 s), 'Biting' (1 s) e 'Circling' (32 s, nadando em círculo).
// Aqui o modelo é colocado no mesmo espaço do tubarão antigo da biblioteca: adulto de 4,5 m olhando para +X, Y para cima, x = 0 na ponta da
// cauda e x = 4,5 no focinho, corpo centrado em y = 0 e z = 0.
//   const T = await criarTubarao(); cena.add(T.grupo); T.posar({ t, clip: 'Swimming' })   // t em segundos; mesma chamada = mesma pose
//   T.posar({ t, clip: 'Biting', mistura: 0.6 })                                             // mordida misturada ao nado (0..1)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const COMPRIMENTO = 4.5;

export async function criarTubarao({ url = new URL('./tubarao.glb', import.meta.url).href, comprimento = COMPRIMENTO } = {}) {
  const g = await new GLTFLoader().loadAsync(url);
  const malhas = [];
  g.scene.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.frustumCulled = false; malhas.push(o); if (o.material?.map) o.material.map.anisotropy = 8; } });
  // o original olha para +Z: gira para +X, escala para o comprimento e encosta a cauda em x = 0
  const base = new THREE.Group(); base.add(g.scene); base.rotation.y = Math.PI / 2;
  const grupo = new THREE.Group(); grupo.name = 'tubarao'; grupo.add(base);
  const mix = new THREE.AnimationMixer(g.scene), clipes = Object.fromEntries(g.animations.map(a => [a.name, a]));
  const acoes = Object.fromEntries(g.animations.map(a => [a.name, mix.clipAction(a)]));
  // caixa da malha já deformada pelos ossos (no nado em t = 0): a caixa da geometria crua não vale para malha com esqueleto
  const caixaPosada = () => { grupo.updateMatrixWorld(true); for (const m of malhas) if (m.isSkinnedMesh) m.skeleton.update(); for (const m of malhas) if (m.isSkinnedMesh) m.computeBoundingBox(); return new THREE.Box3().setFromObject(base); };
  acoes.Swimming?.play(); mix.update(0);
  const tam = caixaPosada().getSize(new THREE.Vector3()); base.scale.multiplyScalar(comprimento / tam.x);
  const caixa = caixaPosada(), c = caixa.getCenter(new THREE.Vector3()); base.position.set(-caixa.min.x, -c.y, -c.z);
  /** pose como função do tempo: clip principal no tempo t (em laço) e, opcional, mistura com o nado por baixo */
  function posar({ t = 0, clip = 'Swimming', mistura = 1 } = {}) {
    for (const k in acoes) { acoes[k].stop(); acoes[k].enabled = false; }
    const usar = (nome, peso) => { const a = acoes[nome]; if (!a) return; a.enabled = true; a.setEffectiveWeight(peso); a.play(); a.time = t % clipes[nome].duration; };
    if (clip !== 'Swimming' && mistura < 1) usar('Swimming', 1 - mistura);
    usar(clip, clip === 'Swimming' ? 1 : mistura);
    mix.update(0); grupo.updateMatrixWorld(true);
  }
  posar();
  return { grupo, malhas, posar, clipes: Object.keys(clipes), duracao: n => clipes[n]?.duration };
}
