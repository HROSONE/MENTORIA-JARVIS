// PILOTO NA MOTO: monta o personagem do elenco sentado na moto, a cada quadro, por cima da animação.
//  · O quadril vai para o marcador Assento e o corpo acompanha a moto (inclinação nas curvas incluída).
//  · Tronco inclinado para frente (posição de esportiva), cabeça olhando a estrada.
//  · Braços e pernas por IK de dois ossos: mãos nas manoplas (MaoE/MaoD, que viram com o guidão), pés nas pedaleiras (PeE/PeD),
//    cotovelos para fora e para baixo, joelhos para frente e encaixados no tanque.
// Cada osso é orientado a partir da pose de repouso (matrizes inversas do esqueleto), sem torção.
import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion(), _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4();
const NECESSARIOS = ['Quadril', 'Coluna', 'Coluna2', 'Peito', 'Pescoco', 'Cabeca', 'BracoE', 'AntebracoE', 'MaoE', 'BracoD', 'AntebracoD', 'MaoD',
  'CoxaE', 'CanelaE', 'PeE', 'PonteiraE', 'CoxaD', 'CanelaD', 'PeD', 'PonteiraD'];

export class PilotoMoto {
  /** prepara (uma vez por personagem); devolve false se o esqueleto não tiver os ossos necessários */
  preparar(inst) {
    if (this.inst === inst) return this.ok;
    this.inst = inst; this.ok = false;
    let sk = null; inst.obj.traverse(o => { if (!sk && o.isSkinnedMesh) sk = o.skeleton; });
    if (!sk) return false;
    const q = {}, p = {}, ossos = {};
    sk.bones.forEach((b, i) => { const m = _m1.copy(sk.boneInverses[i]).invert(), pp = V(), qq = new THREE.Quaternion(); m.decompose(pp, qq, V()); q[b.name] = qq; p[b.name] = pp; ossos[b.name] = b; });
    if (!NECESSARIOS.every(n => ossos[n])) return false;
    const local = (n, v) => v.clone().applyQuaternion(q[n].clone().invert()).normalize();
    const eixo = (a, b) => local(a, p[b].clone().sub(p[a]));
    const frente = V(0, 0, 1), cima = V(0, 1, 0);
    this.eixos = {};
    const def = (n, filho, ref) => { this.eixos[n] = { eixo: eixo(n, filho), ref: local(n, ref) }; };
    def('Coluna', 'Coluna2', frente); def('Coluna2', 'Peito', frente); def('Peito', 'Pescoco', frente); def('Pescoco', 'Cabeca', frente);
    this.eixos.Cabeca = { eixo: this.eixos.Pescoco ? local('Cabeca', p.Cabeca.clone().sub(p.Pescoco)) : local('Cabeca', cima), ref: local('Cabeca', frente) };
    for (const l of ['E', 'D']) {
      def('Braco' + l, 'Antebraco' + l, frente); def('Antebraco' + l, 'Mao' + l, frente);
      this.eixos['Mao' + l] = { eixo: local('Mao' + l, p['Mao' + l].clone().sub(p['Antebraco' + l])), ref: local('Mao' + l, V(l === 'D' ? 1 : -1, 0, 0)) };
      def('Coxa' + l, 'Canela' + l, frente); def('Canela' + l, 'Pe' + l, frente);
      this.eixos['Pe' + l] = { eixo: eixo('Pe' + l, 'Ponteira' + l), ref: local('Pe' + l, cima) };
    }
    this.q = q; this.p = p; this.ossos = ossos;
    this.lenBraco = p.AntebracoE.distanceTo(p.BracoE); this.lenAnte = p.MaoE.distanceTo(p.AntebracoE);
    this.lenCoxa = p.CanelaE.distanceTo(p.CoxaE); this.lenCanela = p.PeE.distanceTo(p.CanelaE);
    this.ok = true; return true;
  }

  _orientar(n, eixoW, refW, w = 1) {
    const b = this.ossos[n], e = this.eixos[n]; if (!b || !e) return;
    const base = (x, r, M) => { const xx = x.clone().normalize(), yy = r.clone().addScaledVector(xx, -r.dot(xx)); if (yy.lengthSq() < 1e-6) yy.set(0, 1, 0).addScaledVector(xx, -xx.y); yy.normalize(); return M.makeBasis(xx, yy, xx.clone().cross(yy)); };
    _q.setFromRotationMatrix(base(eixoW, refW, _m1)).multiply(_q2.setFromRotationMatrix(base(e.eixo, e.ref, _m2)).invert());
    b.parent.updateMatrixWorld(true); b.parent.getWorldQuaternion(_q3).invert();
    _q.premultiply(_q3); b.quaternion.slerp(_q, w); b.updateMatrixWorld(true);
  }
  _pos(n) { return this.ossos[n].getWorldPosition(V()); }

  /** IK de dois ossos: a → b → c, com a ponta em `alvo` e a junta do meio puxada para `polo` */
  _ik(a, b, c, la, lb, alvo, polo, refA, refB) {
    const A = this._pos(a), d = alvo.clone().sub(A), dist = THREE.MathUtils.clamp(d.length(), Math.abs(la - lb) + 1e-3, la + lb - 1e-3), dn = d.normalize();
    const cosA = THREE.MathUtils.clamp((la * la + dist * dist - lb * lb) / (2 * la * dist), -1, 1), senA = Math.sqrt(1 - cosA * cosA);
    const pp = polo.clone().addScaledVector(dn, -polo.dot(dn)).normalize();
    const junta = A.clone().addScaledVector(dn, la * cosA).addScaledVector(pp, la * senA);
    this._orientar(a, junta.clone().sub(A), refA);
    const J = this._pos(b);
    this._orientar(b, alvo.clone().sub(J), refB);
  }

  /** monta o personagem `inst` na moto (objeto `obj` e marcadores `pontos`); inclinação do tronco em rad */
  aplicar(inst, obj, pontos, { tronco = 0.72 } = {}) {
    if (!this.preparar(inst)) return false;
    const o = inst.obj;
    obj.updateMatrixWorld(true);
    const qm = obj.getWorldQuaternion(new THREE.Quaternion());
    const F = V(0, 0, 1).applyQuaternion(qm), U = V(0, 1, 0).applyQuaternion(qm), Esq = V(1, 0, 0).applyQuaternion(qm);
    // corpo: rotação da moto; quadril no assento (um pouco para trás e para baixo, sentado no banco)
    o.quaternion.copy(qm);
    const assento = pontos.assento.getWorldPosition(V()).addScaledVector(F, -0.04).addScaledVector(U, -0.02);
    o.position.copy(assento).sub(this.p.Quadril.clone().applyQuaternion(qm));
    o.updateMatrixWorld(true);
    // tronco inclinado para frente, a cabeça levantada olhando a estrada
    const eixoT = k => U.clone().multiplyScalar(Math.cos(tronco * k)).addScaledVector(F, Math.sin(tronco * k));
    const barriga = k => F.clone().multiplyScalar(Math.cos(tronco * k)).addScaledVector(U, -Math.sin(tronco * k));
    this._orientar('Coluna', eixoT(0.55), barriga(0.55)); this._orientar('Coluna2', eixoT(0.85), barriga(0.85)); this._orientar('Peito', eixoT(1.0), barriga(1.0));
    this._orientar('Pescoco', eixoT(0.55), barriga(0.55)); this._orientar('Cabeca', eixoT(0.12), barriga(0.12));
    // braços até as manoplas (cotovelos para fora e para baixo)
    for (const l of ['E', 'D']) {
      const lado = l === 'E' ? 1 : -1, mao = (l === 'E' ? pontos.maoE : pontos.maoD).getWorldPosition(V()).addScaledVector(F, -0.035).addScaledVector(U, 0.015);
      const polo = Esq.clone().multiplyScalar(lado * 0.8).addScaledVector(U, -0.55).addScaledVector(F, -0.2);
      this._ik('Braco' + l, 'Antebraco' + l, 'Mao' + l, this.lenBraco, this.lenAnte, mao, polo, U, U);
      const ante = mao.clone().sub(this._pos('Antebraco' + l)).normalize();
      this._orientar('Mao' + l, ante.clone().addScaledVector(U, -0.15), U.clone().negate());
      // pernas até as pedaleiras (joelhos para frente, encostados no tanque)
      const pe = (l === 'E' ? pontos.peE : pontos.peD).getWorldPosition(V()).addScaledVector(U, 0.075).addScaledVector(F, -0.07).addScaledVector(Esq, -lado * 0.02);
      const poloJ = F.clone().addScaledVector(U, 0.35).addScaledVector(Esq, lado * 0.15);
      this._ik('Coxa' + l, 'Canela' + l, 'Pe' + l, this.lenCoxa, this.lenCanela, pe, poloJ, U, F);
      this._orientar('Pe' + l, F.clone().addScaledVector(U, -0.25), U);
    }
    return true;
  }
}
