// Elenco: personagens com rosto que mexe. Estende o ajudante do Corredor (carregar, tocar, pose, atualizar, clonar, silhueta, contorno).
//
//   import { Personagem } from './elenco.js';
//   const m = await Personagem.carregar('maniaco.glb');
//   scene.add(m.obj);  m.tocar('Andar');
//   m.rosto({ expressao: 'maldoso', forca: 1, olhar: [0.2, 0] });   // expressões: neutro, medo, grito, surpresa, sorriso, maldoso, raiva
//   m.piscarAuto(true);                                           // pisca sozinho (e o olhar dá pequenos saltos)
//   // no laço:  m.atualizar(dt);
//
// Os clipes de corpo não mexem nos ossos do rosto: o rosto é comandado por `rosto()` e funciona junto com qualquer animação.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { Corredor } from '../corredor/corredor.js';

const OSSOS_ROSTO = ['Mandibula', 'OlhoE', 'OlhoD', 'PalpebraE', 'PalpebraD', 'SobrancelhaE', 'SobrancelhaD', 'BocaE', 'BocaD'];
const ID = new THREE.Quaternion();

export class Personagem extends Corredor {
  static async carregar(url) {
    const gltf = await new GLTFLoader().loadAsync(url);
    const info = (gltf.scene.getObjectByName('Raiz') || {}).userData || {};
    return new Personagem(gltf.scene, gltf.animations, info, gltf);
  }

  constructor(obj, clipes, extras = {}, gltf = null) {
    super(obj, clipes, extras, gltf);
    this._estado = { expressao: 'neutro', forca: 1, boca: 0, olhar: [0, 0], piscar: 0 };
    this._auto = { ligado: false, proxima: 1.5, t: 0, piscando: -1, olhar_t: 0 };
    this._rosto = {};
    for (const n of OSSOS_ROSTO) {
      const o = obj.getObjectByName(n);
      if (o) this._rosto[n] = { o, pos: o.position.clone() };
    }
    this.expressoes = extras.expressoes || {};
  }

  clonar() {
    const c = new Personagem(SkeletonUtils.clone(this.obj), this.clipes, this.extras);
    return c;
  }

  // ajusta o rosto. expressao: nome (ver extras.expressoes); forca 0..1; boca 0..1 (abertura extra da mandíbula); olhar [giro, inclinação] em rad; piscar 0..1 (1 = olhos fechados)
  rosto(opc = {}) {
    Object.assign(this._estado, opc);
    this._aplicarRosto();
    return this;
  }

  piscarAuto(ligar = true) {
    this._auto.ligado = ligar;
    return this;
  }

  atualizar(dt) {
    super.atualizar(dt);
    const a = this._auto;
    if (a.ligado) {
      a.t += dt;
      if (a.piscando < 0 && a.t > a.proxima) { a.piscando = 0; }
      if (a.piscando >= 0) {
        a.piscando += dt;
        const k = a.piscando / 0.16;
        this._estado.piscar = k < 0.5 ? k * 2 : Math.max(0, 2 - k * 2);
        if (k >= 1) { a.piscando = -1; a.t = 0; a.proxima = 1.8 + Math.random() * 3.2; this._estado.piscar = 0; }
      }
      a.olhar_t -= dt;
      if (a.olhar_t < 0) { a.olhar_t = 0.6 + Math.random() * 2.2; this._estado.olhar = [(Math.random() - 0.5) * 0.35, (Math.random() - 0.5) * 0.2]; }
    }
    this._aplicarRosto();
  }

  _aplicarRosto() {
    const e = this._estado;
    const ex = this.expressoes[e.expressao] || {};
    const q = new THREE.Quaternion();
    const tmp = new THREE.Quaternion();
    const eul = new THREE.Euler();
    for (const n of OSSOS_ROSTO) {
      const r = this._rosto[n];
      if (!r) continue;
      const d = ex[n];
      r.o.position.copy(r.pos);
      q.copy(ID);
      if (d) {
        if (d.p) r.o.position.x += d.p[0] * e.forca, r.o.position.y += d.p[1] * e.forca, r.o.position.z += d.p[2] * e.forca;
        if (d.r) q.slerp(tmp.set(d.r[0], d.r[1], d.r[2], d.r[3]), e.forca);
      }
      if (n === 'Mandibula' && e.boca) q.multiply(tmp.setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.5 * e.boca));
      if (n.startsWith('Palpebra') && e.piscar) q.premultiply(tmp.setFromAxisAngle(new THREE.Vector3(1, 0, 0), 1.2 * e.piscar));
      if (n.startsWith('Olho')) { eul.set(-e.olhar[1], e.olhar[0], 0, 'YXZ'); q.premultiply(tmp.setFromEuler(eul)); }
      r.o.quaternion.copy(q);
    }
  }
}
