// T. REX no Three.js (GLB da biblioteca, feito no Blender: animais/trex/criar_trex.py --etapa glb). Olha para +X do próprio grupo, Y para cima,
// lado esquerdo em -Z. Tudo é função do tempo e da distância andada: a mesma chamada dá sempre a mesma pose (render em qualquer ordem).
//   const T = await criarTrex(); T.posar({ dist, vel, olhar, rugido, mordida, mastigar, t })
// Andar: pés presos no chão na fase de apoio e em arco no balanço (cinemática inversa quadril-joelho-tornozelo), corpo subindo e descendo
// duas vezes por ciclo, balanço lateral, cauda contrabalançando em onda, cabeça estabilizada mirando um alvo. Velocidade ~ caminhada rápida.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clamp, lerp } from './util.js';

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();

export async function criarTrex({ url = '../biblioteca3d/animais/trex/trex.glb' } = {}) {
  const g = await new GLTFLoader().loadAsync(url);
  const grupo = new THREE.Group(); grupo.name = 'trex'; grupo.add(g.scene);
  const ossos = {}; const malhas = [];
  g.scene.traverse(o => {
    if (o.isBone) ossos[o.name] = o;
    if (o.isMesh) {
      o.castShadow = o.receiveShadow = true; o.frustumCulled = false; malhas.push(o);
      const m = o.material; if (m && m.map) { m.map.anisotropy = 8; m.roughness = 0.72; m.envMapIntensity = 0.8; }
      if (o.name.startsWith('olho')) { o.material = o.material.clone(); o.material.roughness = 0.03; o.material.metalness = 0; o.material.envMapIntensity = 1.6; }
    }
  });
  // pesos da boca: os automáticos do Blender puxavam o lábio de cima junto com a mandíbula (o focinho esticava ao abrir). Acima da linha da boca
  // a pele é 100% crânio; abaixo dela, na frente da garganta, segue a mandíbula aos poucos. (Mesma regra no criar_trex.py para as próximas exportações.)
  g.scene.updateMatrixWorld(true);
  const linhaBoca = x => x > 4.45 ? 3.30 - 0.22 * (x - 4.45) : 3.30 + 0.05 * (4.45 - x);
  g.scene.traverse(o => {
    if (!o.isSkinnedMesh || o.name !== 'trex') return;
    const nomes = o.skeleton.bones.map(b => b.name), iC = nomes.indexOf('cabeca'), iM = nomes.indexOf('mandibula'); if (iC < 0 || iM < 0) return;
    const P = o.geometry.attributes.position, SI = o.geometry.attributes.skinIndex, SW = o.geometry.attributes.skinWeight, v = new THREE.Vector3();
    let mud = 0;
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); if (v.x < 3.7) continue;
      const acima = v.y > linhaBoca(v.x) - 0.18, km = acima ? 0 : clamp((v.x - 3.95) / 0.35, 0, 1);
      // a parte que não é da mandíbula vai toda para o crânio (na cabeça não há outro osso que deva mexer a pele)
      for (let k = 0; k < 4; k++) { SI.setComponent(i, k, k === 0 ? iC : k === 1 ? iM : 0); SW.setComponent(i, k, k === 0 ? 1 - km : k === 1 ? km : 0); }
      mud++;
    }
    SI.needsUpdate = SW.needsUpdate = true; o.userData.pesosBoca = mud;
  });
  const repouso = {}; for (const k in ossos) repouso[k] = ossos[k].quaternion.clone();
  grupo.updateMatrixWorld(true);
  const posRep = {}; for (const k in ossos) posRep[k] = ossos[k].getWorldPosition(new THREE.Vector3());      // juntas em repouso (espaço do modelo)
  const raizY0 = ossos.quadril.position.y;

  function girar(nome, eixo, ang) {                                    // gira o osso em torno de um eixo do MODELO (x frente, y cima, z direita)
    const b = ossos[nome]; if (!b || !ang) return;
    grupo.updateMatrixWorld(true);
    const em = _a.set(eixo[0], eixo[1], eixo[2]).normalize().applyQuaternion(grupo.getWorldQuaternion(_q2));
    const qm = new THREE.Quaternion().setFromAxisAngle(em, ang), pw = b.parent.getWorldQuaternion(new THREE.Quaternion()), bw = b.getWorldQuaternion(new THREE.Quaternion());
    b.quaternion.copy(pw.invert().multiply(qm.multiply(bw)));
  }
  function apontar(nome, de, para) {                                   // gira o osso (mundo) para levar a direção `de` até `para`
    const b = ossos[nome]; const q = new THREE.Quaternion().setFromUnitVectors(de.clone().normalize(), para.clone().normalize());
    const pw = b.parent.getWorldQuaternion(new THREE.Quaternion()), bw = b.getWorldQuaternion(new THREE.Quaternion()); b.quaternion.copy(pw.invert().multiply(q.multiply(bw)));
    grupo.updateMatrixWorld(true);
  }
  const P = n => ossos[n].getWorldPosition(new THREE.Vector3());
  function ik2(a, b, c, alvo, polo) {                                  // dois ossos (coxa, canela) levam a ponta (tornozelo) ao alvo
    grupo.updateMatrixWorld(true);
    const pa = P(a), pb = P(b), pc = P(c), l1 = pa.distanceTo(pb), l2 = pb.distanceTo(pc);
    const d = alvo.clone().sub(pa), dist = clamp(d.length(), Math.abs(l1 - l2) + 1e-4, (l1 + l2) * 0.999); d.normalize();
    const p = polo.clone().sub(d.clone().multiplyScalar(polo.dot(d))).normalize();
    const ang = Math.acos(clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1));
    const E = pa.clone().addScaledVector(d, Math.cos(ang) * l1).addScaledVector(p, Math.sin(ang) * l1), T = pa.clone().addScaledVector(d, dist);
    apontar(a, pb.clone().sub(pa), E.clone().sub(pa));
    const pb2 = P(b), pc2 = P(c); apontar(b, pc2.clone().sub(pb2), T.clone().sub(pb2));
  }
  const L2W = v => grupo.localToWorld(v.clone());

  /**
   * dist: metros andados (fase do passo); vel: m/s (amplitude do passo, inclinação); olhar: Vector3 do mundo (ou null);
   * rugido 0..1 (cabeça sobe, boca abre 45°, tremor); mordida 0..1 (bote: cabeça desce para a frente, boca abre e fecha no fim);
   * mastigar 0..1 (cabeça erguida, mandíbula batendo); parado: 0..1 (1 = pés juntos, sem passo); t: tempo (tremores e respiração)
   */
  function posar({ dist = 0, vel = 0, olhar = null, rugido = 0, mordida = 0, mastigar = 0, parado = 0, t = 0, chao = 0 } = {}) {
    for (const k in ossos) ossos[k].quaternion.copy(repouso[k]);
    ossos.quadril.position.y = raizY0;
    const ciclo = 2.8 + 0.42 * vel, fase = dist / ciclo, beta = clamp(0.62 - 0.03 * vel, 0.5, 0.65);
    const anda = (1 - parado) * clamp(vel / 1.2, 0, 1);
    // corpo: sobe e desce duas vezes por ciclo, balança de lado, inclina para a frente com a velocidade
    const bob = anda * (0.07 + 0.012 * vel) * Math.cos(4 * Math.PI * fase), lat = anda * 0.05 * Math.sin(2 * Math.PI * fase);
    ossos.quadril.position.y += bob * 1.0;                                                  // (unidade do GLB = metro)
    girar('quadril', [0, 0, 1], -0.04 * anda * Math.min(vel, 6) / 6 - 0.03 * mordida);     // tronco inclinado para a frente
    girar('quadril', [1, 0, 0], lat * 0.6); girar('quadril', [0, 1, 0], 0.05 * anda * Math.sin(2 * Math.PI * fase));
    girar('coluna1', [0, 1, 0], -0.03 * anda * Math.sin(2 * Math.PI * fase));
    // respiração
    girar('peito', [0, 0, 1], 0.012 * Math.sin(t * 1.6));
    // cauda: onda que contrabalança o quadril (atraso ao longo das vértebras) + leve subida
    for (let k = 1; k <= 8; k++) {
      girar('cauda' + k, [0, 1, 0], -(0.045 + 0.01 * k) * (anda + 0.25) * Math.sin(2 * Math.PI * fase - k * 0.45 + t * 0.7 * (1 - anda)));
      girar('cauda' + k, [0, 0, 1], (0.015 + 0.03 * rugido) * Math.sin(4 * Math.PI * fase - k * 0.5) * anda + 0.012 * rugido);
    }
    // pernas: alvo da bola do pé em cada fase (apoio: parado no chão; balanço: arco)
    grupo.updateMatrixWorld(true);
    for (const [l, desloc] of [['l', 0], ['r', 0.5]]) {
      const ph = ((fase + desloc) % 1 + 1) % 1, lado = posRep['dedos_' + l].z;
      let x, y;
      if (ph < beta) { const u = ph / beta; x = lerp(0.5, -0.5, u); y = 0; }
      else { const u = (ph - beta) / (1 - beta); x = lerp(-0.5, 0.5, 0.5 - 0.5 * Math.cos(Math.PI * u)); y = Math.sin(Math.PI * u) * (0.35 + 0.05 * vel); }
      x *= ciclo * beta * anda; y *= anda;
      const bola = new THREE.Vector3(posRep['dedos_' + l].x + x, posRep['dedos_' + l].y + y, lado);
      // tornozelo: atrás e acima da bola, no ângulo do metatarso (mais em pé no fim do apoio e no balanço)
      const levanta = ph < beta ? clamp((ph / beta - 0.7) / 0.3, 0, 1) : Math.sin(Math.PI * (ph - beta) / (1 - beta));
      const angM = lerp(0.60, 0.95, levanta * anda), Lm = posRep['metatarso_' + l].distanceTo(posRep['dedos_' + l]);
      const tornozelo = bola.clone().add(new THREE.Vector3(-Math.cos(angM) * Lm, Math.sin(angM) * Lm, 0));
      ik2('coxa_' + l, 'canela_' + l, 'metatarso_' + l, L2W(tornozelo), L2W(new THREE.Vector3(1, 0.1, 0)).sub(L2W(new THREE.Vector3())));
      const pm = P('metatarso_' + l), pd = P('dedos_' + l); apontar('metatarso_' + l, pd.clone().sub(pm), L2W(bola).sub(pm));
      const pd2 = P('dedos_' + l); apontar('dedos_' + l, new THREE.Vector3(1, -0.2, 0).applyQuaternion(ossos['dedos_' + l].getWorldQuaternion(_q)), L2W(bola.clone().add(new THREE.Vector3(0.66, -0.15 - y * 0.3, 0))).sub(pd2));
    }
    // braços: balanço curto
    for (const l of ['l', 'r']) { girar('braco_' + l, [0, 0, 1], 0.12 * anda * Math.sin(2 * Math.PI * fase + (l === 'l' ? 0 : Math.PI)) - 0.2 * rugido); girar('antebraco_' + l, [0, 0, 1], -0.25 - 0.2 * rugido); }
    // pescoço e cabeça: contra o balanço do corpo, mirando o alvo; rugido, bote e mastigar por cima
    girar('pescoco1', [0, 0, 1], -bob * 0.6 + 0.10 * rugido - 0.10 * mordida);
    girar('pescoco2', [0, 0, 1], 0.06 * rugido - 0.18 * mordida + 0.10 * mastigar);
    if (olhar) {
      grupo.updateMatrixWorld(true);
      const pc = P('cabeca'), frente = new THREE.Vector3(1, -0.1, 0).applyQuaternion(ossos.cabeca.getWorldQuaternion(_q)), alvo = olhar.clone().sub(pc).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(frente.normalize(), alvo); const qp = new THREE.Quaternion().slerp(q, 0.55);   // metade no pescoço, metade na cabeça
      const b = ossos.pescoco2, pw = b.parent.getWorldQuaternion(new THREE.Quaternion()), bw = b.getWorldQuaternion(new THREE.Quaternion()); b.quaternion.copy(pw.clone().invert().multiply(qp.clone().multiply(bw)));
      grupo.updateMatrixWorld(true);
      const frente2 = new THREE.Vector3(1, -0.1, 0).applyQuaternion(ossos.cabeca.getWorldQuaternion(_q)), alvo2 = olhar.clone().sub(P('cabeca')).normalize();
      const q2 = new THREE.Quaternion().setFromUnitVectors(frente2.normalize(), alvo2); const c = ossos.cabeca, pw2 = c.parent.getWorldQuaternion(new THREE.Quaternion()), cw = c.getWorldQuaternion(new THREE.Quaternion());
      c.quaternion.copy(pw2.invert().multiply(new THREE.Quaternion().slerp(q2, 0.9).multiply(cw)));
    }
    const treme = rugido * (0.02 * Math.sin(t * 47) + 0.015 * Math.sin(t * 31));
    girar('cabeca', [0, 0, 1], 0.14 * rugido + treme - 0.12 * mordida + 0.08 * mastigar);
    girar('cabeca', [1, 0, 0], treme * 0.6);
    // mandíbula: rugido abre ~45°, bote abre e fecha no fim, mastigar bate
    const boteAbre = mordida < 0.75 ? clamp(mordida / 0.4, 0, 1) : clamp(1 - (mordida - 0.75) / 0.12, 0, 1);
    const abre = Math.max(0.78 * rugido * (0.85 + 0.15 * Math.sin(t * 9)), 0.85 * boteAbre, mastigar * (0.08 + 0.10 * Math.max(0, Math.sin(t * 9))));
    girar('mandibula', [0, 0, 1], -abre);
    grupo.updateMatrixWorld(true);
  }
  /** ponto da boca no mundo (para encaixar a câmera, a vítima e o enquadramento) */
  const boca = (alvo = new THREE.Vector3()) => { grupo.updateMatrixWorld(true); return alvo.copy(P('cabeca')).lerp(P('mandibula'), 0.5).add(new THREE.Vector3(0.9, -0.2, 0).applyQuaternion(ossos.cabeca.getWorldQuaternion(_q))); };
  /** caixa aproximada (pontos-chave do corpo) para o verificador de enquadramento */
  const pontos = () => { grupo.updateMatrixWorld(true); return ['cabeca', 'mandibula', 'pescoco2', 'peito', 'quadril', 'cauda4', 'cauda8', 'dedos_l', 'dedos_r', 'coxa_l', 'coxa_r'].map(P); };
  return { grupo, ossos, malhas, posar, boca, pontos, girar };
}
