// PODERES DO KAEL (herói em estilo anime do Hryz City)
//  · Rajada (F / botão ✋): estende o braço direito e solta da palma um feixe vermelho tipo laser na direção da câmera.
//    Carro atingido explode; parede ou chão ganha um rombo com pedaços voando; pessoa: o 1º acerto derruba o susto, o 2º mata;
//    o T. rex perde vida.
//  · Super força (T / botão 💪): perto de um carro, levanta ele acima da cabeça; de novo, arremessa para onde a câmera olha.
//    O carro voa com gravidade e explode quando bate no chão, numa parede ou em outro carro; quem estiver no caminho cai.
//  · Super pulo: o pulo é tratado no jogo.js (segurar o pulo carrega, até ~33 m, sem dano de queda); aqui fica só o impacto do pouso.
import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const _a = V(), _b = V(), _c = V(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion();
const CIMA = V(0, 1, 0);

function texRadial(paradas, n = 64) {
  const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d');
  const r = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  for (const [p, cor] of paradas) r.addColorStop(p, cor);
  g.fillStyle = r; g.fillRect(0, 0, n, n);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// rombo na parede: buraco escuro irregular com rachaduras saindo
function texRombo() {
  const n = 256, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d');
  g.translate(n / 2, n / 2);
  g.strokeStyle = 'rgba(25,20,18,0.9)'; g.lineCap = 'round';
  for (let i = 0; i < 11; i++) {                                                         // rachaduras
    let a = (i / 11) * Math.PI * 2 + Math.random() * 0.4, r = 40, x = Math.cos(a) * r, y = Math.sin(a) * r;
    g.lineWidth = 4; g.beginPath(); g.moveTo(x, y);
    while (r < 120) { r += 12 + Math.random() * 14; a += (Math.random() - 0.5) * 0.5; x = Math.cos(a) * r; y = Math.sin(a) * r; g.lineTo(x, y); g.lineWidth = Math.max(1, g.lineWidth - 0.6); }
    g.stroke();
  }
  const borda = g.createRadialGradient(0, 0, 20, 0, 0, 70);                               // chamuscado em volta
  borda.addColorStop(0, 'rgba(20,10,8,0.95)'); borda.addColorStop(0.6, 'rgba(60,30,20,0.55)'); borda.addColorStop(1, 'rgba(60,30,20,0)');
  g.fillStyle = borda; g.beginPath(); g.arc(0, 0, 72, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(6,5,5,1)'; g.beginPath();                                            // o buraco
  for (let i = 0; i <= 18; i++) { const a = (i / 18) * Math.PI * 2, r = 38 + Math.random() * 16; i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class PoderesKael {
  /**
   * jogo: { jogador(), inst(), veiculos(), cidade, alvosExtra(), danoTrex(n), toast(m), tremer(k), virar(ry), camYaw(),
   *         colisao(x, z, raio, y) -> { x, z, bateu }, chao(x, z) }
   */
  constructor({ scene, camera, efeitos, som, jogo }) {
    this.scene = scene; this.camera = camera; this.efeitos = efeitos; this.som = som; this.jogo = jogo;
    this.ativo = false; this.cooldown = 0; this.fase = null; this.poseD = 0; this.poseCima = 0;
    this.segurando = null; this.voando = []; this.feixes = []; this.detritos = []; this.rombos = [];
    this.ray = new THREE.Raycaster(); this.ray.far = 150;
    this.dirTiro = V(0, 0, 1);
    // feixe: três cilindros (núcleo claro, vermelho e halo) com mistura aditiva
    this.geoFeixe = new THREE.CylinderGeometry(1, 1, 1, 14, 1, true); this.geoFeixe.translate(0, 0.5, 0);
    this.matsFeixe = [[0xfff0f0, 1.0, 0.045], [0xff2020, 0.85, 0.11], [0xff0000, 0.28, 0.32]];
    this.texBrilho = texRadial([[0, 'rgba(255,240,240,1)'], [0.25, 'rgba(255,60,50,0.9)'], [1, 'rgba(255,0,0,0)']]);
    this.brilhoMao = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texBrilho, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.brilhoMao.visible = false; this.brilhoMao.renderOrder = 5; scene.add(this.brilhoMao);
    this.texRombo = texRombo();
    this.geoRombo = new THREE.PlaneGeometry(1, 1);
    this.geoPedra = new THREE.DodecahedronGeometry(1, 0);
    this.matPedra = new THREE.MeshLambertMaterial({ color: 0x9a948a });
    this.matPedraEscura = new THREE.MeshLambertMaterial({ color: 0x5d5852 });
    this.anel = new THREE.Mesh(new THREE.RingGeometry(0.6, 1, 40), new THREE.MeshBasicMaterial({ color: 0xd8c8a8, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    this.anel.rotation.x = -Math.PI / 2; this.anel.visible = false; scene.add(this.anel); this.tAnel = 0;
  }

  // ------------------------------------------------------------------ entradas
  rajada() {
    const j = this.jogo.jogador();
    if (!this.ativo || j.veiculo || this.cooldown > 0 || this.segurando) return false;
    this.cooldown = 0.42; this.fase = { t: 0, disparou: false };
    this._mirar();
    this.jogo.virar(Math.atan2(this.dirTiro.x, this.dirTiro.z));
    this._somCarga();
    return true;
  }

  forca() {
    if (!this.ativo || this.jogo.jogador().veiculo) return;
    if (this.segurando) { this._arremessar(); return; }
    const j = this.jogo.jogador();
    let melhor = null, dMelhor = 1e9;
    for (const v of this.jogo.veiculos()) {
      if (v.voando || !v.obj.visible) continue;
      const d = Math.hypot(v.x - j.x, v.z - j.z) - (v.raio || 2) * 0.75;
      if (d < 2.4 && d < dMelhor) { melhor = v; dMelhor = d; }
    }
    if (!melhor) { this.jogo.toast('💪 Chegue perto de um carro para levantar (T)'); return; }
    const v = melhor; v.voando = true; v.vel = 0;
    this.segurando = v; this.tSegura = 0; this.ySegura = v.obj.position.y;
    this.jogo.virar(Math.atan2(v.x - j.x, v.z - j.z));
    this._somGrave(70, 0.5, 0.35);
    this.jogo.toast('💪 Carro levantado! T de novo para arremessar');
  }

  // ------------------------------------------------------------------ mira: para frente (direção da câmera), saindo da mão;
  // trava sozinha no carro, pessoa ou T. rex mais alinhado à frente (até ~12° e 90 m), como num jogo de ação no celular
  _mirar() {
    const j = this.jogo.jogador(), yaw = this.jogo.camYaw();
    const mao = this._osso('MaoD');
    const o = mao && this.poseD > 0.6 ? mao.getWorldPosition(V()) : V(j.x + Math.sin(yaw) * 0.3, j.y + 1.45, j.z + Math.cos(yaw) * 0.3);
    this.camera.getWorldDirection(_a);
    const base = V(Math.sin(yaw), THREE.MathUtils.clamp(_a.y + 0.3, -0.6, 0.6), Math.cos(yaw)).normalize();
    let melhor = null, nota = 1e9;
    const avaliar = (p) => {
      _b.subVectors(p, o); const d = _b.length(); if (d < 1.5 || d > 90) return;
      const ang = Math.abs(Math.atan2(Math.sin(Math.atan2(_b.x, _b.z) - yaw), Math.cos(Math.atan2(_b.x, _b.z) - yaw)));
      if (ang > 0.21) return;
      const n = ang + d / 400; if (n < nota) { nota = n; melhor = p.clone(); }
    };
    for (const v of this.jogo.veiculos()) if (v.obj.visible && !v.voando && !v.queimado && v !== j.veiculo) avaliar(V(v.x, 1.0, v.z));
    for (const n of this.jogo.cidade.npcs || []) if (!n.morto && n.p.obj.visible) avaliar(n.p.obj.position.clone().add(V(0, 1.25, 0)));
    for (const g of this.jogo.alvosExtra?.() || []) avaliar(g.getWorldPosition(V()).add(V(0, 2.2, 0)));
    this.origemRaio = o;
    this.dirTiro.copy(melhor ? melhor.sub(o).normalize() : base);
  }

  _alvos() {
    const lista = [this.jogo.cidade.mundo];
    for (const v of this.jogo.veiculos()) if (v.obj.visible && !v.voando) lista.push(v.obj);
    return lista.concat(this.jogo.alvosExtra?.() || []);
  }

  _classificar(obj) {
    const veic = this.jogo.veiculos(), npcs = this.jogo.cidade.npcs || [], extras = this.jogo.alvosExtra?.() || [];
    for (let o = obj; o; o = o.parent) {
      const v = veic.find(x => x.obj === o); if (v) return { tipo: 'veiculo', v };
      const n = npcs.find(x => x.p.obj === o); if (n) return { tipo: 'npc', n };
      if (extras.includes(o)) return { tipo: 'trex' };
    }
    return { tipo: 'mundo' };
  }

  _disparar() {
    this._mirar();
    const mao = this._osso('MaoD');
    const origem = mao ? mao.getWorldPosition(V()) : this.jogo.inst().obj.position.clone().add(V(0, 1.4, 0));
    this.ray.set(this.origemRaio, this.dirTiro); this.ray.camera = this.camera;
    let hits = []; try { hits = this.ray.intersectObjects(this._alvos(), true); } catch (e) { console.warn('rajada: raio', e); }
    let hit = hits.find(h => h.object.visible !== false && !h.object.isSprite && !h.object.isPoints && !(h.object.material?.transparent && h.object.material.opacity < 0.3));
    let alvo = hit ? this._classificar(hit.object) : null;
    // pedestres: cápsula vertical (o feixe pega mesmo raspando)
    let dist = hit ? hit.distance : 150;
    for (const n of this.jogo.cidade.npcs || []) {
      if (n.morto || !n.p.obj.visible) continue;
      const p = n.p.obj.position;
      _b.set(p.x - this.origemRaio.x, 0, p.z - this.origemRaio.z);
      const hx = this.dirTiro.x, hz = this.dirTiro.z, h2 = hx * hx + hz * hz; if (h2 < 1e-6) continue;
      const tt = (_b.x * hx + _b.z * hz) / h2;                                  // parâmetro ao longo do raio (mesma escala da direção unitária)
      if (tt <= 0 || tt >= dist) continue;
      const qx = this.origemRaio.x + hx * tt, qy = this.origemRaio.y + this.dirTiro.y * tt, qz = this.origemRaio.z + hz * tt;
      if (Math.hypot(qx - p.x, qz - p.z) < 0.55 && qy > p.y - 0.1 && qy < p.y + 1.95) { dist = tt; alvo = { tipo: 'npc', n }; hit = { point: V(qx, qy, qz), distance: tt, face: null, object: n.p.obj }; }
    }
    const ponto = hit ? hit.point.clone() : this.origemRaio.clone().addScaledVector(this.dirTiro, 150);
    this._feixe(origem, ponto);
    this._somRajada();
    this.jogo.tremer(0.12);
    if (!hit) return null;
    // efeitos por alvo
    const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texBrilho, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    fl.position.copy(ponto); fl.scale.setScalar(2.6); this.scene.add(fl); this.feixes.push({ sprite: fl, vida: 0.3, vida0: 0.3 });
    if (alvo.tipo === 'veiculo') {
      alvo.v.dano?.(200, ponto);
      this._detritos(ponto, V(0, 1, 0), 10, this.matPedraEscura, 0.12);
    } else if (alvo.tipo === 'npc') {
      const caiu = this.jogo.cidade.atingirNpc(alvo.n, 1);
      this.jogo.toast(caiu ? '✋ Abatido!' : '✋ Acertou! Mais um acerto derruba');
      for (let i = 0; i < 6; i++) this.efeitos.emitir('fogo', ponto, V((Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2), 0.35, 0.4, 1.2);
    } else if (alvo.tipo === 'trex') {
      this.jogo.danoTrex(25);
      for (let i = 0; i < 8; i++) this.efeitos.emitir('fogo', ponto, V((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3), 0.4, 0.5, 1.2);
    } else {
      const n = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : this.dirTiro.clone().negate();
      if (n.dot(this.dirTiro) > 0) n.negate();
      this._rombo(ponto, n);
    }
    return alvo.tipo;
  }

  _feixe(de, ate) {
    const g = new THREE.Group(), comp = de.distanceTo(ate);
    for (const [cor, op, r] of this.matsFeixe) {
      const m = new THREE.Mesh(this.geoFeixe, new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.scale.set(r, comp, r); m.userData.r = r; m.userData.op = op; m.frustumCulled = false; g.add(m);
    }
    g.position.copy(de); _a.subVectors(ate, de).normalize(); g.quaternion.setFromUnitVectors(CIMA, _a);
    this.scene.add(g); this.feixes.push({ grupo: g, vida: 0.34, vida0: 0.34 });
  }

  _rombo(p, n) {
    const chao = n.y > 0.7;
    const tam = chao ? 2.2 : 2.6;
    const m = new THREE.Mesh(this.geoRombo, new THREE.MeshBasicMaterial({ map: this.texRombo, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
    m.scale.setScalar(tam); m.position.copy(p).addScaledVector(n, 0.03);
    m.quaternion.setFromUnitVectors(V(0, 0, 1), n); m.rotateZ(Math.random() * Math.PI * 2);
    this.scene.add(m); this.rombos.push(m);
    if (this.rombos.length > 24) { const r = this.rombos.shift(); this.scene.remove(r); r.material.dispose(); }
    this._detritos(p, n, chao ? 12 : 18, this.matPedra, 0.16);
    for (let i = 0; i < 10; i++) this.efeitos.emitir('poeira', p.clone().addScaledVector(n, 0.3), n.clone().multiplyScalar(2 + Math.random() * 2).add(V((Math.random() - 0.5) * 2, Math.random() * 1.5, (Math.random() - 0.5) * 2)), 1.4 + Math.random(), 0.9, 1.6);
    for (let i = 0; i < 5; i++) this.efeitos.emitir('fogo', p.clone().addScaledVector(n, 0.2), n.clone().multiplyScalar(1.5).add(V((Math.random() - 0.5), Math.random(), (Math.random() - 0.5))), 0.3, 0.5, 1.5);
  }

  _detritos(p, n, qtd, mat, tam) {
    for (let i = 0; i < qtd; i++) {
      if (this.detritos.length > 90) break;
      const m = new THREE.Mesh(this.geoPedra, mat);
      const s = tam * (0.5 + Math.random()); m.scale.set(s, s * (0.6 + Math.random() * 0.6), s);
      m.position.copy(p).addScaledVector(n, 0.2); m.castShadow = false;
      const v = n.clone().multiplyScalar(3 + Math.random() * 6).add(V((Math.random() - 0.5) * 6, 1 + Math.random() * 5, (Math.random() - 0.5) * 6));
      this.scene.add(m); this.detritos.push({ m, v, w: V(Math.random() * 10, Math.random() * 10, Math.random() * 10), vida: 3 + Math.random() * 2 });
    }
  }

  // ------------------------------------------------------------------ arremesso
  _arremessar() {
    const v = this.segurando; this.segurando = null;
    const yaw = this.jogo.camYaw();
    this.camera.getWorldDirection(_a);
    const sobe = THREE.MathUtils.clamp(_a.y + 0.22, 0.08, 0.7);
    const vel = V(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(30).add(V(0, sobe * 22, 0));
    this.voando.push({ v, vel, w: V((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 4), t: 0 });
    this.jogo.virar(yaw);
    this.fase = null; this.poseCima = 0.6;
    this._somGrave(55, 0.4, 0.5); this.jogo.tremer(0.25);
  }

  _atualizarVoando(dt) {
    const npcs = this.jogo.cidade.npcs || [];
    this.voando = this.voando.filter(f => {
      const v = f.v, o = v.obj; f.t += dt;
      f.vel.y -= 16 * dt;
      o.position.addScaledVector(f.vel, dt);
      o.rotation.x += f.w.x * dt; o.rotation.y += f.w.y * dt; o.rotation.z += f.w.z * dt;
      v.x = o.position.x; v.z = o.position.z;
      let fim = false, explode = false;
      // pessoas no caminho
      for (const n of npcs) if (!n.morto && n.p.obj.visible && Math.hypot(n.p.obj.position.x - v.x, n.p.obj.position.z - v.z) < (v.raio || 2) * 0.7 + 0.5 && o.position.y < 2.4) this.jogo.cidade.atingirNpc(n, 2);
      // outros carros
      for (const q of this.jogo.veiculos()) {
        if (q === v || q.voando || !q.obj.visible) continue;
        if (Math.hypot(q.x - v.x, q.z - v.z) < ((v.raio || 2) + (q.raio || 2)) * 0.6 && o.position.y < 2.6) { q.dano?.(200, q.obj.position.clone().add(V(0, 1, 0))); explode = true; fim = true; }
      }
      // prédios e muros
      if (!fim && f.t > 0.08) {
        const col = this.jogo.colisao(v.x, v.z, (v.raio || 2) * 0.55, o.position.y);
        if (col.bateu) {
          const p = o.position.clone().add(V(0, 1, 0));
          _b.set(col.x - v.x, 0, col.z - v.z); if (_b.lengthSq() < 1e-6) _b.set(-f.vel.x, 0, -f.vel.z); _b.normalize();
          this._rombo(p.clone().addScaledVector(_b, -(v.raio || 2) * 0.55), _b.clone());
          o.position.x = col.x; o.position.z = col.z; v.x = col.x; v.z = col.z;
          f.vel.x *= -0.15; f.vel.z *= -0.15; explode = true;
        }
      }
      // chão
      const chao = this.jogo.chao(v.x, v.z);
      if (o.position.y <= chao) {
        const vy = -f.vel.y;
        if (vy > 6 || explode || f.t > 0.4) explode = true;
        fim = true;
        this._detritos(o.position.clone(), V(0, 1, 0), 8, this.matPedra, 0.14);
        for (let i = 0; i < 10; i++) this.efeitos.emitir('poeira', o.position.clone().add(V((Math.random() - 0.5) * 3, 0.3, (Math.random() - 0.5) * 3)), V((Math.random() - 0.5) * 3, 1.5, (Math.random() - 0.5) * 3), 1.8, 1.2, 1.4);
      }
      if (explode) v.dano?.(200, o.position.clone().add(V(0, 1, 0)));
      if (fim) {
        const ry = o.rotation.y;
        o.rotation.set(0, ry, 0); o.position.y = Math.max(chao, 0);
        v.ry = ry; v.x = o.position.x; v.z = o.position.z; v.vel = 0; v.voando = false;
        this.jogo.tremer(0.4);
        return false;
      }
      if (f.t > 8) { v.voando = false; return false; }
      return true;
    });
  }

  // ------------------------------------------------------------------ pouso do super pulo
  pouso(x, y, z, queda) {
    if (queda < 6) return;
    const k = Math.min(1, queda / 30);
    this.anel.position.set(x, y + 0.06, z); this.anel.visible = true; this.tAnel = 0.7; this.anelMax = 4 + 10 * k;
    for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; this.efeitos.emitir('poeira', V(x + Math.cos(a) * 0.8, y + 0.3, z + Math.sin(a) * 0.8), V(Math.cos(a) * (5 + 6 * k), 0.8, Math.sin(a) * (5 + 6 * k)), 1.6, 1.0, 1.8); }
    this._detritos(V(x, y + 0.1, z), V(0, 1, 0), Math.round(6 + 10 * k), this.matPedra, 0.14);
    this.jogo.tremer(0.3 + 0.5 * k);
    this._somGrave(45, 0.6, 0.5 + 0.4 * k);
    const raio = 3 + 5 * k;
    for (const n of this.jogo.cidade.npcs || []) if (!n.morto && n.p.obj.visible && Math.hypot(n.p.obj.position.x - x, n.p.obj.position.z - z) < raio) this.jogo.cidade.atingirNpc(n, k > 0.6 ? 2 : 1);
    for (const v of this.jogo.veiculos()) if (!v.voando && Math.hypot(v.x - x, v.z - z) < raio + (v.raio || 2) * 0.5) v.dano?.(queda * 2.2, V(v.x, 1, v.z));
  }

  // ------------------------------------------------------------------ pose (depois da animação, antes do render)
  _osso(nome) { return this.jogo.inst()?.obj.getObjectByName(nome); }

  /** gira o osso para o eixo dele (rumo ao filho) apontar para `dir` (mundo), com peso w */
  _apontar(nomeOsso, nomeFilho, dir, w) {
    const b = this._osso(nomeOsso), f = this._osso(nomeFilho); if (!b || !f || w <= 0) return;
    b.updateMatrixWorld(true);
    b.getWorldQuaternion(_q);
    _a.copy(f.position).normalize().applyQuaternion(_q);                       // eixo do osso no mundo
    _q2.setFromUnitVectors(_a, _b.copy(dir).normalize());
    _q3.copy(_q2).multiply(_q);                                                  // nova orientação no mundo
    b.parent.getWorldQuaternion(_q2).invert();
    _q3.premultiply(_q2);
    b.quaternion.slerp(_q3, w);
    b.updateMatrixWorld(true);
  }

  atualizar(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    const inst = this.jogo.inst(), j = this.jogo.jogador();
    // rajada: braço sobe (0,1 s), dispara, segura o braço esticado um instante
    if (this.fase) {
      this.fase.t += dt;
      if (!this.fase.disparou && this.fase.t >= 0.1) { this.fase.disparou = true; this._disparar(); }
      if (this.fase.t > 0.42) this.fase = null;
    }
    this.poseD += ((this.fase ? 1 : 0) - this.poseD) * Math.min(1, dt * (this.fase ? 18 : 7));
    this.poseCima += ((this.segurando ? 1 : 0) - this.poseCima) * Math.min(1, dt * 8);
    if (inst && this.ativo && !j.veiculo) {
      if (this.poseD > 0.01) {
        this._apontar('BracoD', 'AntebracoD', this.dirTiro, this.poseD);
        this._apontar('AntebracoD', 'MaoD', this.dirTiro, this.poseD);
        const mao = this._osso('MaoD');
        if (mao) { mao.getWorldPosition(_c); this.brilhoMao.position.copy(_c).addScaledVector(this.dirTiro, 0.12); }
        this.brilhoMao.visible = true;
        const pulso = this.fase && !this.fase.disparou ? this.fase.t / 0.1 : 1;
        this.brilhoMao.scale.setScalar((0.35 + 0.5 * pulso) * (0.9 + Math.random() * 0.2) * this.poseD);
      } else this.brilhoMao.visible = false;
      if (this.poseCima > 0.01) {
        _c.set(Math.sin(j.ry) * 0.25, 1, Math.cos(j.ry) * 0.25);
        for (const l of ['D', 'E']) { this._apontar('Braco' + l, 'Antebraco' + l, _c, this.poseCima); this._apontar('Antebraco' + l, 'Mao' + l, _c, this.poseCima); }
      }
    } else this.brilhoMao.visible = false;
    // carro segurado acima da cabeça (atravessado nos ombros)
    if (this.segurando) {
      const v = this.segurando, o = v.obj; this.tSegura += dt;
      const sobe = Math.min(1, this.tSegura / 0.35);
      o.position.set(j.x + Math.sin(j.ry) * 0.2, j.y + this.ySegura + sobe * 2.05, j.z + Math.cos(j.ry) * 0.2);
      o.rotation.set(0, j.ry + Math.PI / 2, Math.sin(this.tSegura * 2) * 0.03, 'YXZ');
      v.x = o.position.x; v.z = o.position.z;
      if (j.veiculo || !this.ativo) { this.segurando = null; this.voando.push({ v, vel: V(0, 0, 0), w: V(), t: 0 }); }
    }
    this._atualizarVoando(dt);
    // feixes e clarões apagando
    this.feixes = this.feixes.filter(f => {
      f.vida -= dt; const k = Math.max(0, f.vida / f.vida0);
      if (f.grupo) for (const m of f.grupo.children) { m.material.opacity = m.userData.op * k; const r = m.userData.r * (0.6 + 0.4 * k) * (0.9 + Math.random() * 0.2); m.scale.x = m.scale.z = r; }
      if (f.sprite) { f.sprite.material.opacity = k; f.sprite.scale.multiplyScalar(1 + dt * 2); }
      if (f.vida <= 0) { const o = f.grupo || f.sprite; this.scene.remove(o); o.traverse(m => m.material?.dispose()); return false; }
      return true;
    });
    // pedaços de parede/chão
    this.detritos = this.detritos.filter(d => {
      d.vida -= dt; d.v.y -= 16 * dt; d.m.position.addScaledVector(d.v, dt);
      d.m.rotation.x += d.w.x * dt; d.m.rotation.y += d.w.y * dt;
      const ch = this.jogo.chao(d.m.position.x, d.m.position.z);
      if (d.m.position.y < ch + 0.05) { d.m.position.y = ch + 0.05; d.v.multiplyScalar(0.35); d.v.y = Math.abs(d.v.y) * 0.3; d.w.multiplyScalar(0.5); }
      if (d.vida <= 0) { this.scene.remove(d.m); return false; }
      return true;
    });
    if (this.tAnel > 0) {
      this.tAnel -= dt; const k = 1 - this.tAnel / 0.7;
      this.anel.scale.setScalar(0.5 + k * this.anelMax); this.anel.material.opacity = 0.55 * (1 - k);
      if (this.tAnel <= 0) this.anel.visible = false;
    }
  }

  // ------------------------------------------------------------------ sons (sintetizados, sem arquivos)
  _ctx() { return this.som?.ctx && !this.som.mudo ? this.som.ctx : null; }
  _somCarga() {
    const c = this._ctx(); if (!c) return; const t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.1);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.13);
  }
  _somRajada() {
    const c = this._ctx(); if (!c) return; const t = c.currentTime;
    const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 2600;
    o.frequency.setValueAtTime(1400, t); o.frequency.exponentialRampToValueAtTime(160, t + 0.32);
    o2.frequency.setValueAtTime(700, t); o2.frequency.exponentialRampToValueAtTime(90, t + 0.32);
    g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(c.destination); o.start(t); o2.start(t); o.stop(t + 0.37); o2.stop(t + 0.37);
  }
  _somGrave(freq, dur, ganho) {
    const c = this._ctx(); if (!c) return; const t = c.currentTime;
    const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq * 6;
    const o = c.createOscillator(); o.frequency.setValueAtTime(freq * 1.6, t); o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(ganho, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); o.connect(g); g.connect(c.destination); s.start(t); o.start(t); o.stop(t + dur);
  }
}
