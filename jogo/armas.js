// ARMAS do Hryz City: pistola semiautomática e metralhadora (carabina automática) feitas no Blender
// (videos/biblioteca3d/objetos/armas/*.glb, peças: Ferrolho, Gatilho, Carregador; marcadores: Boca, Ejecao, Apoio).
// O personagem mira com os dois braços (IK de dois ossos sobre o esqueleto do elenco), a arma fica na mão, e cada tiro tem:
// recuo da arma, ferrolho correndo para trás, gatilho, clarão na boca com luz, cápsula ejetada que quica no chão, rastro do projétil,
// faíscas e marca no ponto atingido e som sintetizado. Munição, recarga (o carregador cai e entra outro) e clique sem munição.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const DEF = {
  pistola:      { nome: 'Pistola',      arq: 'pistola.glb',      cadencia: 0.16, auto: false, pente: 15, recarga: 1.2, dano: 1, recuo: 0.11, ferrolho: 0.030, dispersao: 0.006, volume: 0.55, reserva: 45 },
  metralhadora: { nome: 'Metralhadora', arq: 'metralhadora.glb', cadencia: 0.085, auto: true,  pente: 30, recarga: 1.8, dano: 1, recuo: 0.045, ferrolho: 0.022, dispersao: 0.018, volume: 0.75, reserva: 90 },
  // fuzil de ferrolho: 1 bala na arma; as outras só comprando na loja. Todo tiro dela vira a câmera da bala (aoDisparoSniper).
  sniper:       { nome: 'Sniper',       arq: 'sniper.glb',       cadencia: 1.4, auto: false, pente: 1,  recarga: 1.7, dano: 1, recuo: 0.16, ferrolho: 0.085, dispersao: 0.03, volume: 1.0, reserva: 0 },
};
export { ik2, apontar };
const V = () => new THREE.Vector3();
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = V(), _v2 = V(), _m = new THREE.Matrix4();

/** gira o osso `osso` (no mundo) para que o eixo que vai até `filho` aponte para `dir` (vetor no mundo). peso 0..1 */
function apontar(osso, filho, dir, peso = 1) {
  if (!osso || !filho || peso <= 0) return;
  osso.updateWorldMatrix(true, false);
  const pq = osso.parent.getWorldQuaternion(new THREE.Quaternion()), wq = osso.getWorldQuaternion(new THREE.Quaternion());
  const eixo = filho.position.clone().normalize().applyQuaternion(wq);               // direção atual do osso no mundo
  const rot = new THREE.Quaternion().setFromUnitVectors(eixo, dir.clone().normalize());
  const alvo = rot.multiply(wq);                                                       // nova orientação no mundo
  const local = pq.invert().multiply(alvo);
  osso.quaternion.slerp(local, peso);
  osso.updateWorldMatrix(false, true);
}
/** IK de dois ossos (braço e antebraço): a mão vai até `alvo`; `polo` = para onde o cotovelo aponta */
function ik2(braco, antebraco, mao, alvo, polo, peso = 1) {
  if (!braco || !antebraco || !mao) return;
  braco.updateWorldMatrix(true, true);
  const S = braco.getWorldPosition(V()), E = antebraco.getWorldPosition(V()), H = mao.getWorldPosition(V());
  const L1 = S.distanceTo(E), L2 = E.distanceTo(H), d = Math.min(S.distanceTo(alvo), (L1 + L2) * 0.999);
  const eixo = alvo.clone().sub(S).normalize();
  const a = Math.acos(THREE.MathUtils.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const p = polo.clone().sub(eixo.clone().multiplyScalar(polo.dot(eixo))).normalize();
  const cot = S.clone().addScaledVector(eixo, Math.cos(a) * L1).addScaledVector(p, Math.sin(a) * L1);
  apontar(braco, antebraco, cot.sub(S), peso);
  antebraco.updateWorldMatrix(true, true);
  apontar(antebraco, mao, alvo.clone().sub(antebraco.getWorldPosition(V())), peso);
}
function texClarao() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,230,1)'); r.addColorStop(0.25, 'rgba(255,210,120,0.9)'); r.addColorStop(1, 'rgba(255,140,40,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,230,160,0.9)'; g.lineWidth = 6;
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.beginPath(); g.moveTo(64, 64); g.lineTo(64 + Math.cos(a) * 62, 64 + Math.sin(a) * 62); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function texMarca() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(10,10,10,1)'); r.addColorStop(0.35, 'rgba(30,28,26,0.9)'); r.addColorStop(0.6, 'rgba(60,55,50,0.35)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t;
}

export class Armas {
  /** opc: { scene, camera, som (SomJogo, usa som.ctx e som.mudo), alvos: () => [Object3D], chao: () => y, aoAtirar(ponto) } */
  constructor(opc) {
    Object.assign(this, opc);
    this.modelos = {}; this.atual = null; this.estado = {};
    this.possui = new Set(opc.possui || []); this.reserva = {}; this.luneta = false;
    this.gatilhoApertado = false; this.tUltimo = -9; this.recarregando = 0; this.recuo = 0; this.ferrolho = 0; this.gat = 0; this.flash = 0;
    this.capsulas = []; this.rastros = []; this.faiscas = []; this.marcas = [];
    this.rc = new THREE.Raycaster(); this.rc.far = 220;
    this.mirar = V(); this.peso = 0;
  }
  async carregar(base) {
    const gl = new GLTFLoader();
    for (const [id, d] of Object.entries(DEF)) {
      const g = await gl.loadAsync(`${base}/objetos/armas/${d.arq}`);
      const raiz = g.scene; raiz.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
      const no = n => raiz.getObjectByName(n);
      const m = { raiz, ferrolho: no('Ferrolho'), gatilho: no('Gatilho'), carregador: no('Carregador'), boca: no('Boca'), ejecao: no('Ejecao'), apoio: no('Apoio') };
      m.ferrolho0 = m.ferrolho.position.clone(); m.gatilho0 = m.gatilho.quaternion.clone(); m.carregador0 = m.carregador.position.clone();
      raiz.visible = false; this.scene.add(raiz); this.modelos[id] = m;
      this.estado[id] = { municao: this.possui.has(id) ? d.pente : 0 }; this.reserva[id] = this.possui.has(id) ? d.reserva : 0;
    }
    // efeitos compartilhados
    this.clarao = new THREE.Sprite(new THREE.SpriteMaterial({ map: texClarao(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    this.clarao.visible = false; this.scene.add(this.clarao);
    this.luz = new THREE.PointLight(0xffc070, 0, 9, 2);   // (fora da cena: luz pontual sempre presente encarece todo pixel; o clarão fica no sprite)
    this.geoCapsula = new THREE.CylinderGeometry(0.0048, 0.0048, 0.020, 8); this.matCapsula = new THREE.MeshStandardMaterial({ color: 0xc89b3c, metalness: 1, roughness: 0.25 });
    this.matRastro = new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    this.geoRastro = new THREE.BoxGeometry(0.025, 0.025, 1);
    this.matFaisca = new THREE.MeshBasicMaterial({ color: 0xffd080 }); this.geoFaisca = new THREE.BoxGeometry(0.02, 0.02, 0.10);
    this.matMarca = new THREE.MeshBasicMaterial({ map: texMarca(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
    this.matPoeira = new THREE.SpriteMaterial({ color: 0xbfb7a8, transparent: true, opacity: 0.5, depthWrite: false });
  }
  get ativa() { return !!this.atual; }
  get info() { if (!this.atual) return null; return { id: this.atual, nome: DEF[this.atual].nome, municao: this.estado[this.atual].municao, pente: DEF[this.atual].pente, reserva: this.reserva[this.atual], recarregando: this.recarregando > 0 }; }
  /** pega a arma no mapa: passa a ter, com o pente cheio e a reserva inicial */
  pegar(id) {
    if (!DEF[id]) return false;
    const nova = !this.possui.has(id); this.possui.add(id);
    if (nova) { this.estado[id].municao = DEF[id].pente; this.reserva[id] = DEF[id].reserva; }
    return nova;
  }
  /** compra na loja: +n balas da sniper e repõe as reservas da pistola e da metralhadora */
  comprar(nSniper = 5) {
    this.reserva.sniper = (this.reserva.sniper || 0) + nSniper;
    for (const id of ['pistola', 'metralhadora']) this.reserva[id] = Math.max(this.reserva[id] || 0, DEF[id].reserva);
    if (this.possui.has('sniper') && this.estado.sniper.municao === 0) this.recarregar(true);
  }
  /** equipa 'pistola' | 'metralhadora' | 'sniper' | null (guardar). Só equipa o que já foi pego. */
  equipar(id) {
    if (id && !this.possui.has(id)) return false;
    for (const m of Object.values(this.modelos)) m.raiz.visible = false;
    this.atual = id && this.modelos[id] ? id : null; this.recarregando = 0; this.gatilhoApertado = false; this.luneta = false;
    if (this.atual) { this.modelos[this.atual].raiz.visible = true; this._som('engatilhar'); }
    return true;
  }
  gatilho(apertado) {
    if (apertado && !this.gatilhoApertado) this._quer = true;          // semiautomática: um tiro por clique
    this.gatilhoApertado = apertado;
  }
  recarregar(forcar = false) {
    const id = forcar ? 'sniper' : this.atual;
    if (!id || this.recarregando > 0 || this.estado[id].municao === DEF[id].pente) return false;
    if ((this.reserva[id] || 0) <= 0) { this.aoSemMunicao?.(id); return false; }
    if (forcar && this.atual !== 'sniper') { const n = Math.min(DEF[id].pente - this.estado[id].municao, this.reserva[id]); this.estado[id].municao += n; this.reserva[id] -= n; return true; }
    this.recarregando = DEF[id].recarga; this._som('soltar'); return true;
  }

  /**
   * Chamar a cada quadro DEPOIS do personagem.atualizar(dt) (a animação do corpo já aplicada).
   * pers: objeto do personagem (com o esqueleto do elenco) ou null; t = tempo do jogo; visivel = arma na mão (false dentro do carro)
   */
  atualizar(dt, t, pers, visivel = true) {
    this._efeitos(dt);
    if (!this.atual) return;
    const m = this.modelos[this.atual], d = DEF[this.atual];
    m.raiz.visible = visivel && !!pers && !this.luneta;                                    // na luneta a visão é do olho: a arma some
    if (!pers || !visivel) return;
    const osso = n => pers.getObjectByName(n);
    // ponto de mira: o que está no centro da tela, a 40 m
    this.camera.getWorldDirection(_v); const mira = this.camera.getWorldPosition(V()).addScaledVector(_v, 40);
    // corpo: o peito e os ombros
    pers.updateWorldMatrix(true, true);
    const peito = osso('Peito'), ombroD = osso('BracoD'), ombroE = osso('BracoE');
    if (!peito || !ombroD || !ombroE || !osso('MaoD') || !osso('MaoE')) { m.raiz.visible = false; return; }   // personagem sem esqueleto (ex.: o ultra-leve)
    const P = peito.getWorldPosition(V()), OD = ombroD.getWorldPosition(V()), OE = ombroE.getWorldPosition(V());
    const frente = mira.clone().sub(P).setY(0).normalize(), cima = new THREE.Vector3(0, 1, 0), direita = new THREE.Vector3().crossVectors(frente, cima).normalize();
    // onde a arma fica (posição do cabo), e a direção do cano
    let cabo;
    if (this.atual === 'pistola') cabo = OD.clone().lerp(OE, 0.45).addScaledVector(frente, 0.50).addScaledVector(cima, -0.02);
    else if (this.atual === 'sniper') cabo = OD.clone().addScaledVector(frente, 0.16).addScaledVector(cima, -0.10).addScaledVector(direita, -0.07);
    else cabo = OD.clone().addScaledVector(frente, 0.22).addScaledVector(cima, -0.13).addScaledVector(direita, -0.05);
    const dirCano = mira.clone().sub(cabo).normalize();
    // recuo: a arma sobe e vem para trás, volta com mola
    const k = this.recuo;
    const q = new THREE.Quaternion().setFromRotationMatrix(_m.lookAt(V(), dirCano.clone().negate(), cima));   // +z do modelo = cano
    const qRecuo = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -k * (this.atual === 'pistola' ? 3.2 : 1.6));
    q.multiply(qRecuo);
    if (this.recarregando > 0) { const u = 1 - this.recarregando / d.recarga, giro = Math.sin(Math.min(1, u * 1.4) * Math.PI) * 0.6; q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.35 * giro, 0, -giro))); }
    m.raiz.quaternion.copy(q); m.raiz.position.copy(cabo).addScaledVector(dirCano, -k * 0.12);
    m.raiz.updateMatrixWorld(true);
    // braços: a mão direita no cabo; a esquerda apoia (embaixo do cabo na pistola, no guarda-mão na metralhadora)
    const poloD = direita.clone().multiplyScalar(0.6).addScaledVector(cima, -1), poloE = direita.clone().multiplyScalar(-0.6).addScaledVector(cima, -1);
    ik2(ombroD, osso('AntebracoD'), osso('MaoD'), m.raiz.getWorldPosition(V()).addScaledVector(cima, -0.02), poloD);
    const alvoE = this.atual === 'pistola' ? m.raiz.localToWorld(new THREE.Vector3(-0.012, -0.045, 0.0)) : m.apoio.getWorldPosition(V());
    if (this.recarregando > 0 && this.atual === 'pistola') alvoE.addScaledVector(cima, -0.15 * Math.sin(Math.PI * (1 - this.recarregando / d.recarga)));
    ik2(ombroE, osso('AntebracoE'), osso('MaoE'), alvoE, poloE);
    // peças móveis
    m.ferrolho.position.copy(m.ferrolho0); m.ferrolho.position.z -= this.ferrolho;
    m.gatilho.quaternion.copy(m.gatilho0).multiply(_q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.gat * 0.35));
    // recarga: o carregador desce, some e volta
    const est = this.estado[this.atual];
    if (this.recarregando > 0) {
      const u = 1 - this.recarregando / d.recarga;
      m.carregador.position.copy(m.carregador0); m.carregador.position.y -= u < 0.5 ? u * 0.5 : (1 - u) * 0.5; m.carregador.visible = u < 0.35 || u > 0.55;
      this.recarregando -= dt;
      if (this.recarregando <= 0) { this.recarregando = 0; const n = Math.min(d.pente - est.municao, this.reserva[this.atual]); est.municao += n; this.reserva[this.atual] -= n; m.carregador.position.copy(m.carregador0); m.carregador.visible = true; this._som('engatilhar'); }
    }
    // tiro
    const quer = d.auto ? this.gatilhoApertado : this._quer; this._quer = false;
    if (quer && this.recarregando <= 0 && t - this.tUltimo >= d.cadencia) {
      if (est.municao <= 0) { if (!d.auto || t - this.tUltimo > 0.3) { this._som('vazio'); this.tUltimo = t; } this.recarregar(); }
      else { est.municao--; this.tUltimo = t; this._atirar(m, d); if (est.municao === 0 && this.reserva[this.atual] > 0) setTimeout(() => this.recarregar(), this.atual === 'sniper' ? 900 : 250); }
    }
    this.recuo = Math.max(0, this.recuo - dt * (this.atual === 'pistola' ? 1.4 : 2.2));
    this.ferrolho = Math.max(0, this.ferrolho - dt * 0.45); this.gat = Math.max(0, this.gat - dt * 6);
  }

  _atirar(m, d) {
    this.recuo = Math.min(0.22, this.recuo + d.recuo); this.ferrolho = d.ferrolho; this.gat = 1; this.flash = 0.05;
    const boca = m.boca.getWorldPosition(V());
    if (this.atual === 'sniper') {
      // sniper: o raio sai exatamente do centro da luneta (sem luneta, com a dispersão do tiro sem apoio) e a câmera da bala cuida do resto
      const disp = this.luneta ? 0 : d.dispersao;
      this.rc.setFromCamera(new THREE.Vector2((Math.random() - 0.5) * disp * 2, (Math.random() - 0.5) * disp * 2), this.camera);
      const origem = this.rc.ray.origin.clone(), dir = this.rc.ray.direction.clone();
      this.clarao.position.copy(boca); this.clarao.scale.setScalar(0.9); this.clarao.visible = !this.luneta; this.luz.position.copy(boca); this.luz.intensity = 8;
      this._som('tiro', d.volume);
      this.aoDisparoSniper?.({ origem, dir, boca: boca.clone(), luneta: this.luneta });
      return;
    }
    // raio do centro da tela (com dispersão) → ponto atingido
    this.rc.setFromCamera(new THREE.Vector2((Math.random() - 0.5) * d.dispersao * 2 * (1 + this.recuo * 6), (Math.random() - 0.5) * d.dispersao * 2 * (1 + this.recuo * 6)), this.camera);
    this.rc.near = this.camera.position.distanceTo(boca) * 0.8;
    const hits = this.rc.intersectObjects(this.alvos(), true).filter(h => h.object.visible);
    const h = hits[0];
    const ponto = h ? h.point.clone() : this.rc.ray.origin.clone().addScaledVector(this.rc.ray.direction, 150);
    // clarão e luz
    this.clarao.position.copy(boca); this.clarao.scale.setScalar(this.atual === 'pistola' ? 0.40 : 0.55); this.clarao.material.rotation = Math.random() * 6; this.clarao.visible = true;
    this.luz.position.copy(boca); this.luz.intensity = 6;
    // rastro do projétil
    const r = new THREE.Mesh(this.geoRastro, this.matRastro.clone()); const dist = boca.distanceTo(ponto);
    r.position.copy(boca).lerp(ponto, 0.5); r.lookAt(ponto); r.scale.set(1, 1, dist); r.userData.vida = 0.08; this.scene.add(r); this.rastros.push(r);
    // cápsula ejetada para a direita e para cima
    const cap = new THREE.Mesh(this.geoCapsula, this.matCapsula); cap.position.copy(m.ejecao.getWorldPosition(V()));
    const dir = new THREE.Vector3(1, 0, 0).applyQuaternion(m.raiz.quaternion);
    cap.userData = { v: dir.multiplyScalar(1.6 + Math.random()).add(new THREE.Vector3(0, 1.8 + Math.random(), 0)), w: new THREE.Vector3(Math.random() * 30, Math.random() * 30, 0), vida: 2.5 };
    this.scene.add(cap); this.capsulas.push(cap);
    // impacto: faíscas, poeira e marca
    if (h) {
      const n = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld).normalize() : this.rc.ray.direction.clone().negate();
      for (let i = 0; i < 7; i++) {
        const f = new THREE.Mesh(this.geoFaisca, this.matFaisca); f.position.copy(ponto);
        const v = n.clone().multiplyScalar(2 + Math.random() * 3).add(new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3, (Math.random() - 0.5) * 4));
        f.userData = { v, vida: 0.25 + Math.random() * 0.2 }; f.lookAt(ponto.clone().add(v)); this.scene.add(f); this.faiscas.push(f);
      }
      const p = new THREE.Sprite(this.matPoeira.clone()); p.position.copy(ponto).addScaledVector(n, 0.05); p.scale.setScalar(0.30); p.userData = { vida: 0.6, poeira: true }; this.scene.add(p); this.faiscas.push(p);
      const mk = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), this.matMarca); mk.position.copy(ponto).addScaledVector(n, 0.004); mk.lookAt(ponto.clone().add(n)); mk.rotateZ(Math.random() * 6);
      this.scene.add(mk); this.marcas.push(mk); if (this.marcas.length > 80) this.scene.remove(this.marcas.shift());
    }
    this._som('tiro', d.volume);
    if (this.aoAtirar) this.aoAtirar(ponto, this.atual, h?.object || null);
  }

  _efeitos(dt) {
    if (this.flash > 0) { this.flash -= dt; if (this.flash <= 0) { this.clarao.visible = false; this.luz.intensity = 0; } else this.luz.intensity = 6 * this.flash / 0.05; }
    const chao = this.chao ? this.chao() : 0.15;
    this.capsulas = this.capsulas.filter(c => {
      const u = c.userData; u.vida -= dt; if (u.vida <= 0) { this.scene.remove(c); return false; }
      u.v.y -= 9.8 * dt; c.position.addScaledVector(u.v, dt); c.rotation.x += u.w.x * dt; c.rotation.y += u.w.y * dt;
      if (c.position.y < chao + 0.005) { c.position.y = chao + 0.005; if (u.v.y < -0.6 && !u.tocou) { this._som('capsula'); u.tocou = true; } u.v.y *= -0.35; u.v.x *= 0.6; u.v.z *= 0.6; u.w.multiplyScalar(0.6); }
      return true;
    });
    this.rastros = this.rastros.filter(r => { r.userData.vida -= dt; r.material.opacity = Math.max(0, r.userData.vida / 0.08) * 0.9; if (r.userData.vida <= 0) { this.scene.remove(r); r.material.dispose(); return false; } return true; });
    this.faiscas = this.faiscas.filter(f => {
      const u = f.userData; u.vida -= dt; if (u.vida <= 0) { this.scene.remove(f); if (u.poeira) f.material.dispose(); return false; }
      if (u.poeira) { f.scale.multiplyScalar(1 + dt * 3); f.material.opacity = u.vida * 0.8; f.position.y += dt * 0.3; }
      else { u.v.y -= 9.8 * dt; f.position.addScaledVector(u.v, dt); }
      return true;
    });
  }

  /** sons sintetizados (Web Audio): tiro, clique sem munição, engatilhar, soltar o carregador, cápsula no chão */
  _som(tipo, vol = 0.6) {
    const s = this.som; if (!s || !s.ctx || s.mudo) return;
    const ctx = s.ctx, now = ctx.currentTime, saida = ctx.destination;
    const ruido = (dur) => { const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate), a = b.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; const n = ctx.createBufferSource(); n.buffer = b; return n; };
    if (tipo === 'tiro') {
      const pist = this.atual === 'pistola', snp = this.atual === 'sniper';
      const n = ruido(0.35), f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = 'lowpass'; f.frequency.setValueAtTime(pist ? 5200 : 4200, now); f.frequency.exponentialRampToValueAtTime(380, now + 0.25);
      g.gain.setValueAtTime(vol * 0.9, now); g.gain.exponentialRampToValueAtTime(0.001, now + (pist ? 0.22 : snp ? 0.42 : 0.18));
      n.connect(f); f.connect(g); g.connect(saida); n.start(now); n.stop(now + 0.35);
      const o = ctx.createOscillator(), go = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(pist ? 150 : 120, now); o.frequency.exponentialRampToValueAtTime(40, now + 0.12);
      go.gain.setValueAtTime(vol * 0.8, now); go.gain.exponentialRampToValueAtTime(0.001, now + 0.14); o.connect(go); go.connect(saida); o.start(now); o.stop(now + 0.15);
      if (snp) {                                                                          // estalo supersônico e rolar do eco entre os prédios
        const r2 = ruido(2.2), f2 = ctx.createBiquadFilter(), g2 = ctx.createGain(); f2.type = 'lowpass'; f2.frequency.value = 700;
        g2.gain.setValueAtTime(0.0001, now); g2.gain.linearRampToValueAtTime(vol * 0.35, now + 0.12); g2.gain.exponentialRampToValueAtTime(0.001, now + 2.1);
        r2.connect(f2); f2.connect(g2); g2.connect(saida); r2.start(now); r2.stop(now + 2.2);
      }
      const e = ruido(0.6), fe = ctx.createBiquadFilter(), ge = ctx.createGain(); fe.type = 'bandpass'; fe.frequency.value = 900; fe.Q.value = 0.7;                   // eco da rua
      ge.gain.setValueAtTime(0.0001, now); ge.gain.linearRampToValueAtTime(vol * 0.12, now + 0.06); ge.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      e.connect(fe); fe.connect(ge); ge.connect(saida); e.start(now); e.stop(now + 0.6);
    } else {
      const cfg = { vazio: [2600, 0.025, 0.25], engatilhar: [1800, 0.05, 0.25], soltar: [1200, 0.04, 0.2], capsula: [5200, 0.03, 0.06] }[tipo];
      if (!cfg) return;
      const rep = tipo === 'engatilhar' ? 2 : 1;
      for (let k = 0; k < rep; k++) {
        const t0 = now + k * 0.09, n = ruido(cfg[1]), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'bandpass'; f.frequency.value = cfg[0]; f.Q.value = 3;
        g.gain.setValueAtTime(cfg[2], t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + cfg[1]); n.connect(f); f.connect(g); g.connect(saida); n.start(t0); n.stop(t0 + cfg[1]);
      }
    }
  }
}
