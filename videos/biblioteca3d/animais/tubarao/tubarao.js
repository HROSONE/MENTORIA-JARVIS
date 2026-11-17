// TUBARÃO-BRANCO no Three.js (GLB da biblioteca, feito no Blender: animais/tubarao/criar_tubarao.py --glb tubarao.glb).
// Adulto de 4,5 m (metros). Olha para +X do próprio grupo, Y para cima, lado esquerdo em -Z; x = 0 na ponta da cauda, x = 4,5 na ponta do focinho,
// o corpo fica centrado em y = 0 (não tem "chão": o grupo vai para a altura que a cena pedir).
//   const T = await criarTubarao(); cena.add(T.grupo); T.posar({ fase, amp, abre, vira })
// posar é função só dos parâmetros (a mesma chamada dá sempre a mesma pose; renderiza em qualquer ordem). É a mesma regra do posar() do Blender:
//   fase  fase do nado em radianos (a onda do corpo anda para a cauda: nado tunniforme, a frente quase parada)   amp  1 = nado normal, 0 = reto
//   abre  abertura da mandíbula em graus (padrão 6: em repouso a boca fica semiaberta; a cabeça sobe 0,28 grau por grau aberto na mordida)   vira  curva do corpo (+ para a esquerda)
// Ossos: raiz, cabeca, coluna1..coluna8 (da frente para a cauda), mandibula, peitoral_l, peitoral_r. No GLB a boca está fechada (pose de modelagem).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const _a = new THREE.Vector3(), _q = new THREE.Quaternion();
const rad = d => d * Math.PI / 180;

export async function criarTubarao({ url = new URL('./tubarao.glb', import.meta.url).href } = {}) {
  const g = await new GLTFLoader().loadAsync(url);
  const grupo = new THREE.Group(); grupo.name = 'tubarao'; grupo.add(g.scene);
  const ossos = {}, malhas = [];
  g.scene.traverse(o => {
    if (o.isBone) ossos[o.name] = o;
    if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.frustumCulled = false; malhas.push(o); if (o.material?.map) o.material.map.anisotropy = 8; }
  });
  const repouso = {}; for (const k in ossos) repouso[k] = ossos[k].quaternion.clone();

  /** gira o osso em torno de um eixo do MODELO (x frente, y cima, z direita), somando à pose atual */
  function girar(nome, eixo, ang) {
    const b = ossos[nome]; if (!b || !ang) return;
    grupo.updateMatrixWorld(true);
    const em = _a.set(eixo[0], eixo[1], eixo[2]).normalize().applyQuaternion(grupo.getWorldQuaternion(_q));
    const qm = new THREE.Quaternion().setFromAxisAngle(em, ang), pw = b.parent.getWorldQuaternion(new THREE.Quaternion()), bw = b.getWorldQuaternion(new THREE.Quaternion());
    b.quaternion.copy(pw.invert().multiply(qm.multiply(bw)));
  }

  function posar({ fase = 0, amp = 1, abre = 6, vira = 0 } = {}) {
    for (const k in ossos) ossos[k].quaternion.copy(repouso[k]);
    const n = 8;
    for (let i = 0; i < n; i++) {                                              // onda lateral que cresce para a cauda (giro em torno do eixo vertical)
      const k = (i + 1) / n;
      girar('coluna' + (i + 1), [0, 1, 0], amp * (0.02 + 0.30 * Math.pow(k, 2.2)) * Math.sin(fase - 2.4 * k) + vira * 0.10);
    }
    girar('cabeca', [0, 0, 1], rad(0.28 * abre));                                // focinho sobe quando a boca abre
    girar('cabeca', [0, 1, 0], -amp * 0.03 * Math.sin(fase) - vira * 0.15);       // a cabeça contrabalança a onda
    girar('mandibula', [0, 0, -1], rad(abre));                                   // a mandíbula abre para baixo
    grupo.updateMatrixWorld(true);
  }
  posar();
  /** ponto da boca no mundo (a articulação da mandíbula 0,25 m à frente, na altura da fenda), para mirar a câmera ou a presa */
  const boca = (alvo = new THREE.Vector3()) => { grupo.updateMatrixWorld(true); return alvo.copy(ossos.mandibula.getWorldPosition(new THREE.Vector3())).add(new THREE.Vector3(0.25, 0.07, 0).applyQuaternion(grupo.getWorldQuaternion(new THREE.Quaternion()))); };
  return { grupo, ossos, malhas, posar, girar, boca };
}
