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

  // Visual "silhueta escura com borda de luz quente" do canal: acrescenta aos materiais um brilho de borda (Fresnel) só no lado
  // que olha para a luz. Funciona com qualquer iluminação da cena. luz = direção (mundo) de onde vem a luz de contorno.
  silhueta({ borda = '#ffc27a', forca = 1.7, potencia = 2.4, luz = [-0.6, 0.45, -0.65] } = {}) {
    const rim = (this.rim = this.rim || { cor: new THREE.Color(), dir: new THREE.Vector3(), forca: { value: 1 }, pot: { value: 2 } });
    rim.cor.set(borda);
    rim.dir.set(...luz).normalize();
    rim.forca.value = forca;
    rim.pot.value = potencia;
    this.obj.traverse(o => {
      if (!o.isMesh) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (m.userData.__borda) continue;
        m.userData.__borda = true;
        m.onBeforeCompile = sh => {
          sh.uniforms.uRimCor = { value: rim.cor };
          sh.uniforms.uRimDir = { value: rim.dir };
          sh.uniforms.uRimForca = rim.forca;
          sh.uniforms.uRimPot = rim.pot;
          sh.fragmentShader = 'uniform vec3 uRimCor; uniform vec3 uRimDir; uniform float uRimForca; uniform float uRimPot;\n' +
            sh.fragmentShader.replace('#include <opaque_fragment>', `
              vec3 Nr = normalize(normal);
              float fr = pow(1.0 - clamp(dot(Nr, normalize(vViewPosition)), 0.0, 1.0), uRimPot);
              float lado = smoothstep(-0.15, 0.55, dot(Nr, normalize((viewMatrix * vec4(uRimDir, 0.0)).xyz)));
              outgoingLight += uRimCor * fr * lado * uRimForca;
              #include <opaque_fragment>`);
        };
        m.customProgramCacheKey = () => 'corredor-borda';
        m.needsUpdate = true;
      }
    });
    return this;
  }

  // Contorno de desenho animado (casca invertida): uma cópia levemente inflada de cada malha, só com a face de trás, na cor do contorno
  contorno({ cor = '#0a0d14', espessura = 0.006 } = {}) {
    const mat = new THREE.MeshBasicMaterial({ color: cor, side: THREE.BackSide });
    mat.onBeforeCompile = sh => {
      sh.uniforms.uEsp = { value: espessura };
      sh.vertexShader = 'uniform float uEsp;\n' + sh.vertexShader.replace('#include <skinning_vertex>', '#include <skinning_vertex>\n transformed += normalize(objectNormal) * uEsp;');
    };
    const alvos = [];
    this.obj.traverse(o => { if (o.isSkinnedMesh && o.name !== 'Contorno') alvos.push(o); });
    for (const m of alvos) {
      const c = new THREE.SkinnedMesh(m.geometry, mat);
      c.bind(m.skeleton, m.bindMatrix);
      c.name = 'Contorno';
      c.frustumCulled = false;
      m.parent.add(c);
    }
    return this;
  }
}
