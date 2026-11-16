// Captura de movimento real (CMU) aplicada ao Lucas realista: cada osso é girado para apontar na mesma direção do segmento correspondente
// do ator capturado (retarget por direção), o quadril recebe a orientação e a posição da captura (escalada pelo tamanho da perna).
// clip = await carregarMocap(url) ; aplicarMocap(L, clip, tClip, { origem: [x, 0, z], yaw, ancorar: true })
import * as THREE from 'three';

export async function carregarMocap(url) {
  const d = await (await fetch(url)).json(), n = d.juntas.length, J = {};
  d.juntas.forEach((j, i) => { J[j] = i; });
  const Q = d.quadros;
  return {
    fps: d.fps, N: Q.length, dur: (Q.length - 1) / d.fps, J,
    /** posição (interpolada) da junta `nome` no instante t (s) do clipe */
    pos(t, nome, alvo = new THREE.Vector3()) {
      const f = Math.min(Math.max(t * d.fps, 0), Q.length - 1), k = Math.floor(f), a = f - k, k2 = Math.min(k + 1, Q.length - 1), i = J[nome] * 3;
      return alvo.set(Q[k][i] * (1 - a) + Q[k2][i] * a, Q[k][i + 1] * (1 - a) + Q[k2][i + 1] * a, Q[k][i + 2] * (1 - a) + Q[k2][i + 2] * a);
    },
  };
}

// osso do Lucas -> [osso filho (direção atual), junta CMU de origem, junta CMU de destino]
const MAPA = [
  ['spine_01', 'spine_02', 'root', 'lowerback'], ['spine_02', 'spine_03', 'lowerback', 'upperback'], ['spine_03', 'neck_01', 'upperback', 'thorax'],
  ['neck_01', 'head', 'thorax', 'upperneck'], ['head', null, 'upperneck', 'head'],
  ['clavicle_l', 'upperarm_l', 'thorax', 'lclavicle'], ['upperarm_l', 'lowerarm_l', 'lclavicle', 'lhumerus'], ['lowerarm_l', 'hand_l', 'lhumerus', 'lradius'], ['hand_l', 'middle_01_l', 'lwrist', 'lhand'],
  ['clavicle_r', 'upperarm_r', 'thorax', 'rclavicle'], ['upperarm_r', 'lowerarm_r', 'rclavicle', 'rhumerus'], ['lowerarm_r', 'hand_r', 'rhumerus', 'rradius'], ['hand_r', 'middle_01_r', 'rwrist', 'rhand'],
  ['thigh_l', 'calf_l', 'lhipjoint', 'lfemur'], ['calf_l', 'foot_l', 'lfemur', 'ltibia'], ['foot_l', 'ball_l', 'ltibia', 'lfoot'],
  ['thigh_r', 'calf_r', 'rhipjoint', 'rfemur'], ['calf_r', 'foot_r', 'rfemur', 'rtibia'], ['foot_r', 'ball_r', 'rtibia', 'rfoot'],
];
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4();

function giraMundo(osso, de, para) {
  if (de.lengthSq() < 1e-10 || para.lengthSq() < 1e-10) return;
  const q = new THREE.Quaternion().setFromUnitVectors(de.clone().normalize(), para.clone().normalize());
  const pw = osso.parent.getWorldQuaternion(new THREE.Quaternion()), bw = osso.getWorldQuaternion(new THREE.Quaternion());
  osso.quaternion.copy(pw.invert().multiply(q.multiply(bw))); osso.updateMatrixWorld(true);
}
function direcaoOsso(osso, filho, alvo) {                           // direção atual do osso: até o filho, ou o eixo Y local (osso do Blender aponta em Y)
  if (filho) return filho.getWorldPosition(alvo).sub(osso.getWorldPosition(_d));
  return alvo.set(0, 1, 0).applyQuaternion(osso.getWorldQuaternion(_q));
}

/**
 * Posa o Lucas com o quadro t (s) do clipe.
 * opc: origem [x, y, z] (onde fica o quadril da captura no quadro tRef), yaw (giro do movimento inteiro), tRef (quadro de referência para a origem, padrão 0),
 *      segue (true: o quadril anda como na captura; false: fica preso na origem em x/z), ossos (lista para limitar quais ossos recebem a captura)
 */
export function aplicarMocap(L, clip, t, { origem = [0, 0, 0], yaw = 0, tRef = 0, segue = true, ossos = null } = {}) {
  const O = L.ossos; L.reset();
  L.grupo.rotation.set(0, 0, 0); L.grupo.position.set(0, 0, 0); L.grupo.updateMatrixWorld(true);
  // escala pela perna
  if (!clip._esc) {
    const pm = clip.pos(0, 'lhipjoint').distanceTo(clip.pos(0, 'lfemur')) + clip.pos(0, 'lfemur').distanceTo(clip.pos(0, 'ltibia'));
    const pl = L.pos('thigh_l').distanceTo(L.pos('calf_l')) + L.pos('calf_l').distanceTo(L.pos('foot_l'));
    clip._esc = pl / pm;
  }
  const s = clip._esc, cy = Math.cos(yaw), sy = Math.sin(yaw), r0 = clip.pos(tRef, 'root', new THREE.Vector3());
  const P = (nome, alvo) => {                                          // junta da captura no mundo do vídeo
    clip.pos(t, nome, alvo); let x = alvo.x - r0.x, z = alvo.z - r0.z;
    if (!segue) { const r = clip.pos(t, 'root', _c); x = alvo.x - r.x; z = alvo.z - r.z; }
    return alvo.set(origem[0] + s * (x * cy + z * sy), origem[1] + s * alvo.y, origem[2] + s * (-x * sy + z * cy));
  };
  // quadril: orientação (esquerda, cima, frente) e posição
  const hipL = P('lhipjoint', new THREE.Vector3()), hipR = P('rhipjoint', new THREE.Vector3()), raiz = P('root', new THREE.Vector3()), costas = P('lowerback', new THREE.Vector3());
  const x = hipL.sub(hipR).normalize(), y = costas.sub(raiz).normalize(); y.sub(x.clone().multiplyScalar(y.dot(x))).normalize(); const z = new THREE.Vector3().crossVectors(x, y);
  const qAlvo = new THREE.Quaternion().setFromRotationMatrix(_m.makeBasis(x, y, z));
  const pel = O.pelvis, pw = pel.parent.getWorldQuaternion(new THREE.Quaternion());
  pel.quaternion.copy(pw.clone().invert().multiply(qAlvo.multiply(L._pelvisRepousoMundo || (L._pelvisRepousoMundo = pel.getWorldQuaternion(new THREE.Quaternion())))));
  pel.updateMatrixWorld(true);
  const pp = pel.getWorldPosition(new THREE.Vector3()); L.grupo.position.copy(raiz).sub(pp); L.grupo.updateMatrixWorld(true);
  // membros e coluna, de pai para filho
  for (const [osso, filho, de, para] of MAPA) {
    if (ossos && !ossos.includes(osso)) continue;
    const b = O[osso]; if (!b) continue;
    const atual = direcaoOsso(b, filho ? O[filho] : null, new THREE.Vector3()), alvo = P(para, _b).clone().sub(P(de, _a));
    giraMundo(b, atual, alvo);
  }
  return L;
}
