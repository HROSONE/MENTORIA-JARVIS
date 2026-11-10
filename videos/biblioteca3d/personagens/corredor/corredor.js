// Corredor: carrega o GLB com esqueleto e dá uma interface simples para tocar as animações.
//
//   import { Corredor } from './corredor.js';
//   const eu = await Corredor.carregar('corredor.glb');   // ou 'corredor-colorido.glb'
//   scene.add(eu.obj);
//   eu.tocar('Correr');                                   // 'Parado' | 'Andar' | 'Correr' | 'Pular'
//   // no laço de animação:  eu.atualizar(dt);
//
// Os clipes são "no lugar" (o personagem não sai do lugar): quem anda é o `eu.obj`.
// `eu.info('Andar').velocidade` diz a velocidade (m/s) para mover o objeto sem os pés escorregarem.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export class Corredor {
  static async carregar(url) {
    const gltf = await new GLTFLoader().loadAsync(url);
    const info = (gltf.scene.getObjectByName('Raiz') || {}).userData || {};
    return new Corredor(gltf.scene, gltf.animations, info, gltf);
  }

  constructor(obj, clipes, extras = {}, gltf = null) {
    this.obj = obj;
    this.clipes = clipes;
    this.extras = extras;
    this._gltf = gltf;
    this.mixer = new THREE.AnimationMixer(obj);
    this.acao = null;
    this.ultimo = null;
  }

  // outro personagem independente com o mesmo modelo (esqueleto e mixer próprios)
  clonar() {
    return new Corredor(SkeletonUtils.clone(this.obj), this.clipes, this.extras);
  }

  info(nome) {
    return ((this.extras.clipes || {})[nome]) || {};
  }

  // toca (ou troca com fusão suave) o clipe `nome`; opções: { fade (s), velocidade (fator), loop (padrão: repete) }
  tocar(nome, { fade = 0.25, velocidade = 1, loop = true } = {}) {
    const clip = this.clipes.find(c => c.name === nome);
    if (!clip) throw new Error('clipe inexistente: ' + nome);
    const nova = this.mixer.clipAction(clip);
    nova.reset();
    nova.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    nova.clampWhenFinished = !loop;
    nova.timeScale = velocidade;
    if (this.acao && this.acao !== nova) nova.crossFadeFrom(this.acao, fade, false);
    nova.play();
    this.acao = nova;
    this.ultimo = nome;
    return nova;
  }

  // congela o personagem na pose do instante `t` (s) do clipe `nome`
  pose(nome, t) {
    const clip = this.clipes.find(c => c.name === nome);
    this.mixer.stopAllAction();
    const a = this.mixer.clipAction(clip);
    a.reset().play();
    this.mixer.setTime(0);
    this.mixer.setTime(t);
    this.acao = a;
    this.mixer.update(0);
  }

  atualizar(dt) {
    this.mixer.update(dt);
  }
}
