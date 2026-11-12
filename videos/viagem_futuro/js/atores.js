// Atores do vídeo: envelopa o Personagem do elenco com IK de braços, sentar, olhar, choro (soluço + lágrimas) e tinta de roupa.
import * as THREE from 'three';
import { Personagem } from '../../biblioteca3d/personagens/elenco/elenco.js';
import { clamp, ruido } from './util.js';

const BASE = '../biblioteca3d/personagens/elenco/';
const modelos = {};
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

export async function carregarModelo(nome) {
  if (!modelos[nome]) modelos[nome] = Personagem.carregar(BASE + nome + '.glb');
  return modelos[nome];
}

const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler();

export class Ator {
  static async criar(nome, opc = {}) {
    const base = await carregarModelo(nome);
    const usar = base.usado ? base.clonar() : base;
    base.usado = true;
    return new Ator(usar, nome, opc);
  }

  constructor(p, nome, { escala = 1, pele = null } = {}) {
    this.p = p; this.nome = nome; this.obj = p.obj;
    this.ossos = {};
    p.obj.traverse(o => { if (o.isBone) this.ossos[o.name] = o; });
    this.altura = (p.extras.altura_m || 1.7) * escala;
    this.grupo = new THREE.Group();                 // o grupo é quem anda; o obj fica dentro (permite girar/escalar sem mexer no esqueleto)
    this.grupo.add(p.obj);
    this.grupo.scale.setScalar(escala);
    this.escala = escala;
    p.obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
    this.choro = 0; this.lagrimas = null;
    p.rosto({ expressao: 'neutro', forca: 1 });
  }

  colocar(x, y, z, giro = 0) { this.grupo.position.set(x, y, z); this.grupo.rotation.set(0, giro, 0); return this; }
  velocidade(clip) { return (this.p.info(clip).velocidade || 0) * this.escala; }
  duracao(clip) { const c = this.p.clipes.find(k => k.name === clip); return c ? c.duration : 1; }

  // pose do clipe no instante t (laço automático); depois dela vêm IK, sentar, olhar...
  anim(clip, t, { laco = true } = {}) {
    const d = this.duracao(clip);
    const tt = laco ? ((t % d) + d) % d : clamp(t, 0, d - 1e-3);
    this.p.pose(clip, tt);
    return this;
  }

  rosto(opc) { this.p.rosto(opc); return this; }
  atualizarRosto() { this.p._aplicarRosto(); if (this.fecharOlhos) this.fecharOlhos(this.p._estado.piscar || 0); }

  pos(osso, alvo = V()) { this.grupo.updateMatrixWorld(true); return this.ossos[osso].getWorldPosition(alvo); }

  // IK de dois ossos para o braço: leva o punho a `alvo` (mundo); `polo` indica para onde o cotovelo aponta (mundo)
  ikBraco(lado, alvo, polo = V(0, -1, -0.3)) {
    const B = this.ossos['Braco' + lado], A = this.ossos['Antebraco' + lado], M = this.ossos['Mao' + lado];
    this.grupo.updateMatrixWorld(true);
    const rU = A.position.clone(), rF = M.position.clone();
    const L1 = rU.length(), L2 = rF.length();
    rU.normalize(); rF.normalize();
    const S = B.getWorldPosition(V());
    const Pq = B.parent.getWorldQuaternion(new THREE.Quaternion());
    let d = alvo.clone().sub(S);
    // escala do grupo: comprimentos em mundo
    const k = this.grupo.scale.x;
    const l1 = L1 * k, l2 = L2 * k;
    let dist = d.length();
    dist = clamp(dist, Math.abs(l1 - l2) + 1e-3, (l1 + l2) * 0.9995);
    const ed = d.normalize();
    let p = polo.clone().sub(ed.clone().multiplyScalar(polo.dot(ed)));
    if (p.lengthSq() < 1e-6) p.set(0, -1, 0);
    p.normalize();
    const a = Math.acos(clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1));
    const E = S.clone().add(ed.clone().multiplyScalar(Math.cos(a) * l1)).add(p.clone().multiplyScalar(Math.sin(a) * l1));
    const T = S.clone().add(ed.clone().multiplyScalar(dist));
    const u = E.clone().sub(S).normalize();
    const u0 = rU.clone().applyQuaternion(Pq);
    const R = _q.setFromUnitVectors(u0, u).clone();
    const qb = Pq.clone().invert().multiply(R).multiply(Pq);
    B.quaternion.copy(qb);
    const Bw = R.clone().multiply(Pq);
    const f = T.clone().sub(E).normalize();
    const v0 = rF.clone().applyQuaternion(Bw);
    const R2 = _q2.setFromUnitVectors(v0, f).clone();
    const qa = Bw.clone().invert().multiply(R2).multiply(Bw);
    A.quaternion.copy(qa);
    return this;
  }

  // gira um osso (rotação local absoluta em Euler YXZ)
  osso(nome, rx = 0, ry = 0, rz = 0) { this.ossos[nome].quaternion.setFromEuler(_e.set(rx, ry, rz, 'YXZ')); return this; }
  somar(nome, rx = 0, ry = 0, rz = 0) { this.ossos[nome].quaternion.multiply(_q.setFromEuler(_e.set(rx, ry, rz, 'YXZ'))); return this; }

  // sentado (carro): quadril na altura `y`, coxas para frente, canelas para baixo
  sentar({ y = 0.50, coxa = -1.42, canela = 1.50, tronco = -0.04 } = {}) {
    const q = this.ossos['Quadril'];
    q.position.y = y / this.escala;
    for (const l of 'ED') { this.osso('Coxa' + l, coxa, l === 'E' ? -0.05 : 0.05, 0); this.osso('Canela' + l, canela, 0, 0); this.osso('Pe' + l, -0.1, 0, 0); this.osso('Ponteira' + l, 0, 0, 0); }
    this.somar('Coluna', tronco, 0, 0);
    return this;
  }

  // sentada no chão (joelhos para cima, pés no chão): quadril rente ao piso; `abre` afasta os joelhos
  sentarChao({ y = 0.115, coxa = -1.90, canela = 2.25, tronco = -0.12, abre = 0.16 } = {}) {
    const q = this.ossos['Quadril'];
    q.position.y = y / this.escala;
    for (const l of 'ED') {
      const sg = l === 'E' ? 1 : -1;
      this.osso('Coxa' + l, coxa, -sg * abre, 0);
      this.osso('Canela' + l, canela, 0, 0);
      this.osso('Pe' + l, -(coxa + canela) + 0.05, 0, 0);
      this.osso('Ponteira' + l, 0, 0, 0);
    }
    this.somar('Quadril', 0.28, 0, 0);
    this.somar('Coluna', tronco, 0, 0);
    return this;
  }

  // olha para um ponto do mundo: pescoço e cabeça giram (limitados) e os olhos completam
  olhar(alvo, { forca = 1, max = 1.1 } = {}) {
    this.grupo.updateMatrixWorld(true);
    const h = this.ossos['Cabeca'].getWorldPosition(V());
    const loc = this.grupo.worldToLocal(alvo.clone());
    const hl = this.grupo.worldToLocal(h.clone());
    const d = loc.sub(hl);
    const yaw = clamp(Math.atan2(d.x, d.z), -max, max) * forca;
    const pitch = clamp(Math.atan2(d.y, Math.hypot(d.x, d.z)), -0.6, 0.6) * forca;
    this.osso('Pescoco', -pitch * 0.35, yaw * 0.35, 0);
    this.osso('Cabeca', -pitch * 0.65, yaw * 0.65, 0);
    return this;
  }

  // soluço: tremor no peito, ombros e cabeça (t em s, amp 0..1)
  soluco(t, amp = 1) {
    const s = Math.sin(t * 17 + 1) * 0.5 + Math.sin(t * 9.3) * 0.5;
    const pulso = Math.max(0, Math.sin(t * 3.1)) ** 3;
    this.somar('Peito', -0.05 * amp * pulso, 0, 0.012 * s * amp);
    this.somar('Pescoco', 0.07 * amp * pulso, 0, 0);
    this.somar('Cabeca', 0.10 * amp, 0.03 * ruido(t * 2, 3), 0.02 * s * amp);
    for (const l of 'ED') this.somar('Ombro' + l, 0.04 * amp * pulso, 0, 0);
  }

  // lágrimas: gotas brilhantes que escorrem pelas bochechas (filhas do osso da cabeça); chamar `lagrimaAt(t)` a cada quadro
  criarLagrimas(n = 3) {
    if (this.lagrimas) return;
    const mat = new THREE.MeshStandardMaterial({ color: 0xe6f1ff, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.85, emissive: 0x6c8fb8, emissiveIntensity: 0.25 });
    const geo = new THREE.SphereGeometry(0.0034, 8, 6);
    this.lagrimas = [];
    const cab = this.ossos['Cabeca'];
    for (const lado of 'ED') {
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(geo, mat);
        m.scale.set(1, 1.6, 1); m.visible = false; m.frustumCulled = false;
        cab.add(m);
        this.lagrimas.push({ m, lado, fase: i / n + (lado === 'E' ? 0 : 0.37) });
      }
    }
  }
  lagrimaAt(t, ligado = true) {
    if (!this.lagrimas) return;
    const cab = this.ossos['Cabeca'];
    for (const l of this.lagrimas) {
      l.m.visible = ligado;
      if (!ligado) continue;
      const olho = this.ossos['Olho' + l.lado];
      const u = (((t * 0.55 + l.fase) % 1) + 1) % 1;
      const sg = l.lado === 'E' ? 1 : -1;
      const ex = olho.position.x, ey = olho.position.y, ez = olho.position.z;
      const y = ey - 0.012 - u * 0.082;
      const x = ex + sg * (0.004 + 0.012 * u);
      const z = ez + 0.012 - 0.030 * u * u;                       // a bochecha recua conforme desce
      l.m.position.set(x, y, z);
      l.m.visible = ligado && u > 0.02;
    }
  }

  // troca a cor de materiais pelo nome (clona antes: o modelo é compartilhado entre instâncias). mapa: { 'M_moletom': '#d0763b', ... }
  pintar(mapa) {
    this.obj.traverse(o => {
      if (!o.isMesh) return;
      const arr = Array.isArray(o.material) ? o.material : [o.material];
      const novo = arr.map(m => { if (!(m.name in mapa)) return m; const n = m.clone(); n.color.set(mapa[m.name]); return n; });
      o.material = Array.isArray(o.material) ? novo : novo[0];
    });
    return this;
  }

  // tinge materiais (clona antes: o modelo é compartilhado entre instâncias)
  tingir(cor, nomes = []) {
    const c = new THREE.Color(cor);
    this.obj.traverse(o => {
      if (!o.isMesh) return;
      const arr = Array.isArray(o.material) ? o.material : [o.material];
      o.material = arr.map(m => {
        if (nomes.length && !nomes.includes(m.name)) return m;
        const n = m.clone(); n.color.multiply(c); return n;
      });
      if (o.material.length === 1) o.material = o.material[0];
    });
    return this;
  }
}
