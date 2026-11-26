// Ator do elenco com captura real (CMU) no corpo + IK nas mãos (o mesmo esquema do açougueiro do vídeo do boi, em módulo reaproveitável).
// carregarAtor(url) → { obj, ik, corpo(clip, tClip, origem, yaw), maoD(alvo, polo), maoE(alvo, polo), orientarMao(l, dir, ref) }
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const MAPA = [
  ['Coluna', 'Coluna2', 'root', 'lowerback'], ['Coluna2', 'Peito', 'lowerback', 'upperback'], ['Peito', 'Pescoco', 'upperback', 'thorax'],
  ['Pescoco', 'Cabeca', 'thorax', 'upperneck'], ['Cabeca', null, 'upperneck', 'head'],
  ['OmbroE', 'BracoE', 'thorax', 'lclavicle'], ['OmbroD', 'BracoD', 'thorax', 'rclavicle'],
  ['BracoE', 'AntebracoE', 'lclavicle', 'lhumerus'], ['AntebracoE', 'MaoE', 'lhumerus', 'lradius'],
  ['BracoD', 'AntebracoD', 'rclavicle', 'rhumerus'], ['AntebracoD', 'MaoD', 'rhumerus', 'rradius'],
  ['CoxaE', 'CanelaE', 'lhipjoint', 'lfemur'], ['CanelaE', 'PeE', 'lfemur', 'ltibia'], ['PeE', 'PonteiraE', 'ltibia', 'lfoot'],
  ['CoxaD', 'CanelaD', 'rhipjoint', 'rfemur'], ['CanelaD', 'PeD', 'rfemur', 'rtibia'], ['PeD', 'PonteiraD', 'rtibia', 'rfoot'],
];
export async function carregarClip(url) {
  const d = await (await fetch(url)).json(), J = {}; d.juntas.forEach((j, i) => { J[j] = i; }); const Q = d.quadros;
  return { fps: d.fps, dur: (Q.length - 1) / d.fps,
    pos(t, nome, alvo = V()) { const f = Math.min(Math.max(t * d.fps, 0), Q.length - 1), k = Math.floor(f), a = f - k, k2 = Math.min(k + 1, Q.length - 1), i = J[nome] * 3;
      return alvo.set(Q[k][i] * (1 - a) + Q[k2][i] * a, Q[k][i + 1] * (1 - a) + Q[k2][i + 1] * a, Q[k][i + 2] * (1 - a) + Q[k2][i + 2] * a); } };
}
function giraMundo(osso, de, para) {
  if (de.lengthSq() < 1e-10 || para.lengthSq() < 1e-10) return;
  const q = new THREE.Quaternion().setFromUnitVectors(de.clone().normalize(), para.clone().normalize());
  const pw = osso.parent.getWorldQuaternion(new THREE.Quaternion()), bw = osso.getWorldQuaternion(new THREE.Quaternion());
  osso.quaternion.copy(pw.invert().multiply(q.multiply(bw))); osso.updateMatrixWorld(true);
}

export async function carregarAtor(url) {
  const g = await new GLTFLoader().loadAsync(url);
  const obj = g.scene; obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
  let sk = null; obj.traverse(o => { if (!sk && o.isSkinnedMesh) sk = o.skeleton; });
  const O = {}, REST = {}, q = {}, p = {}, m1 = new THREE.Matrix4();
  sk.bones.forEach((b, i) => { O[b.name] = b; REST[b.name] = b.quaternion.clone(); const m = m1.copy(sk.boneInverses[i]).invert(), pp = V(), qq = new THREE.Quaternion(); m.decompose(pp, qq, V()); q[b.name] = qq; p[b.name] = pp; });
  const local = (n, v) => v.clone().applyQuaternion(q[n].clone().invert()).normalize();
  const eixos = {}; const def = (n, f, ref) => { eixos[n] = { eixo: local(n, p[f].clone().sub(p[n])), ref: local(n, ref) }; };
  for (const l of ['E', 'D']) { def('Braco' + l, 'Antebraco' + l, V(0, 0, 1)); def('Antebraco' + l, 'Mao' + l, V(0, 0, 1)); eixos['Mao' + l] = { eixo: local('Mao' + l, p['Mao' + l].clone().sub(p['Antebraco' + l])), ref: local('Mao' + l, V(l === 'D' ? 1 : -1, 0, 0)) }; }
  def('Pescoco', 'Cabeca', V(0, 0, 1));
  const la = p.AntebracoD.distanceTo(p.BracoD), lb = p.MaoD.distanceTo(p.AntebracoD);
  const pos = n => O[n].getWorldPosition(V());
  function orientar(n, eixoW, refW) {
    const b = O[n], e = eixos[n], ma = new THREE.Matrix4(), mb = new THREE.Matrix4();
    const base = (x, r, M) => { const xx = x.clone().normalize(), yy = r.clone().addScaledVector(xx, -r.dot(xx)); if (yy.lengthSq() < 1e-6) yy.set(0, 1, 0); yy.normalize(); return M.makeBasis(xx, yy, xx.clone().cross(yy)); };
    const qq = new THREE.Quaternion().setFromRotationMatrix(base(eixoW, refW, ma)).multiply(new THREE.Quaternion().setFromRotationMatrix(base(e.eixo, e.ref, mb)).invert());
    b.parent.updateMatrixWorld(true); qq.premultiply(b.parent.getWorldQuaternion(new THREE.Quaternion()).invert()); b.quaternion.copy(qq); b.updateMatrixWorld(true);
  }
  function ik(l, alvo, polo, ref = V(0, 0, 1), peso = 1) {
    const a = 'Braco' + l, b = 'Antebraco' + l, A = pos(a), d = alvo.clone().sub(A);
    const dist = THREE.MathUtils.clamp(d.length(), Math.abs(la - lb) + 1e-3, la + lb - 1e-3), dn = d.normalize();
    const cosA = THREE.MathUtils.clamp((la * la + dist * dist - lb * lb) / (2 * la * dist), -1, 1), senA = Math.sqrt(1 - cosA * cosA);
    const pp = polo.clone().addScaledVector(dn, -polo.dot(dn)).normalize();
    const junta = A.clone().addScaledVector(dn, la * cosA).addScaledVector(pp, la * senA);
    const qa = O[a].quaternion.clone(), qb = O[b].quaternion.clone();
    orientar(a, junta.clone().sub(A), ref); orientar(b, alvo.clone().sub(pos(b)), ref);
    if (peso < 1) { O[a].quaternion.copy(qa.slerp(O[a].quaternion, peso)); O[a].updateMatrixWorld(true); O[b].quaternion.copy(qb.slerp(O[b].quaternion, peso)); O[b].updateMatrixWorld(true); }
  }
  /** corpo pela captura (ancorado em `origem`, virado para `yaw`; o ator da captura fica no lugar) */
  function corpo(clip, t, origem, yaw = 0, { desloca = null } = {}) {
    for (const n in REST) O[n].quaternion.copy(REST[n]);
    obj.position.set(0, 0, 0); obj.rotation.set(0, 0, 0); obj.updateMatrixWorld(true);
    if (!clip._esc) {
      const pm = clip.pos(0, 'lhipjoint').distanceTo(clip.pos(0, 'lfemur')) + clip.pos(0, 'lfemur').distanceTo(clip.pos(0, 'ltibia'));
      clip._esc = (pos('CoxaE').distanceTo(pos('CanelaE')) + pos('CanelaE').distanceTo(pos('PeE'))) / pm;
      clip._pelQ = O.Quadril.getWorldQuaternion(new THREE.Quaternion());
    }
    const l = clip.pos(t, 'lhipjoint').sub(clip.pos(t, 'rhipjoint')), f = l.clone().cross(V(0, 1, 0));
    const yAtor = Math.atan2(-f.x, f.z) + yaw, s = clip._esc, cy = Math.cos(yAtor), sy = Math.sin(yAtor), r0 = clip.pos(t, 'root');
    const P = (nome, alvo = V()) => { clip.pos(t, nome, alvo); const x = alvo.x - r0.x, z = alvo.z - r0.z; return alvo.set(origem.x + s * (x * cy + z * sy), s * alvo.y, origem.z + s * (-x * sy + z * cy)); };
    const hipL = P('lhipjoint'), hipR = P('rhipjoint'), raiz = P('root'), costas = P('lowerback');
    if (desloca) raiz.add(desloca);
    const x = hipL.sub(hipR).normalize(), y = costas.sub(P('root')).normalize(); y.sub(x.clone().multiplyScalar(y.dot(x))).normalize(); const z = V().crossVectors(x, y);
    const qA = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    const pel = O.Quadril, pw = pel.parent.getWorldQuaternion(new THREE.Quaternion());
    pel.quaternion.copy(pw.clone().invert().multiply(qA.multiply(clip._pelQ))); pel.updateMatrixWorld(true);
    for (let it = 0; it < 2; it++) { obj.updateMatrixWorld(true); obj.position.add(raiz.clone().sub(pel.getWorldPosition(V()))); }
    obj.updateMatrixWorld(true);
    for (const [osso, filho, de, para] of MAPA) {
      const b = O[osso]; if (!b) continue;
      const atual = filho ? O[filho].getWorldPosition(V()).sub(b.getWorldPosition(V())) : V(0, 1, 0).applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()));
      giraMundo(b, atual, P(para).sub(P(de)));
    }
    // pés no chão (nunca abaixo de y = 0)
    const pe = Math.min(pos('PeE').y, pos('PeD').y, pos('PonteiraE').y, pos('PonteiraD').y);
    if (pe < 0.045) { obj.position.y += 0.045 - pe; obj.updateMatrixWorld(true); }
  }
  return { obj, ossos: O, pos, orientar, ik, corpo };
}
