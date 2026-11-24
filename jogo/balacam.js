// CÂMERA DA BALA da sniper: no disparo calcula onde a bala vai bater (alvos especiais da missão em esferas + a cidade por raio),
// e então a câmera acompanha a bala em câmera lenta por toda a trajetória (atrás dela, girando até vê-la de lado), corta para o
// alvo no impacto, mostra a reação devagar e devolve a câmera ao jogador. Enquanto dura, a resolução sobe (pixelRatio ≥ 1,25).
import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const suave = t => t * t * (3 - 2 * t);

function texAnel() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 14; g.beginPath(); g.arc(64, 64, 44, 0, Math.PI * 2); g.stroke();
  return new THREE.CanvasTexture(c);
}
function texPuff(cor) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, cor); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export class BalaCam {
  /** opc: { scene, camera, renderer, armas, som, alvosEspeciais() → [{tipo, parte, centro, raio}], aoImpacto(res), aoFim(res), pixelRatio() } */
  constructor(opc) {
    Object.assign(this, opc);
    this.ativa = false;
    this.el = document.getElementById('balacam'); this.elInfo = document.getElementById('bc-info');
    // bala: ogiva de latão (escala exagerada ×3 para ser vista na câmera lenta)
    const g = new THREE.Group();
    const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.0155, 0.0155, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0xc99a3f, metalness: 1, roughness: 0.25 }));
    corpo.rotation.x = Math.PI / 2; g.add(corpo);
    const ponta = new THREE.Mesh(new THREE.ConeGeometry(0.0155, 0.045, 16), new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 1, roughness: 0.3 }));
    ponta.rotation.x = Math.PI / 2; ponta.position.z = 0.047; g.add(ponta);
    g.scale.setScalar(2.2);
    this.bala = g; g.visible = false; this.scene.add(g);
    this.rastro = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.004, 1, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xdfe8ff, transparent: true, opacity: 0.32, depthWrite: false }));
    this.rastro.visible = false; this.scene.add(this.rastro);
    this.matAnel = new THREE.MeshBasicMaterial({ map: texAnel(), transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.5 });
    this.texPoeira = texPuff('rgba(200,190,170,0.9)'); this.texSangue = texPuff('rgba(120,10,10,0.85)'); this.texFaisca = texPuff('rgba(255,220,120,1)');
    this.aneis = []; this.particulas = [];
    this.rc = new THREE.Raycaster();
  }

  /** disparo: { origem, dir, boca, luneta } */
  disparar({ origem, dir }) {
    // 1. onde a bala vai bater
    this.rc.set(origem, dir); this.rc.far = 700; this.rc.camera = this.camera;
    const mundo = this.rc.intersectObjects(this.armas.alvos(), true).find(h => h.object.visible && h.distance > 2.6)          // o cano passa da mureta: ignora o que está colado no olho;
    let res = mundo ? { tipo: 'mundo', parte: '', ponto: mundo.point.clone(), dist: mundo.distance, normal: mundo.face ? mundo.face.normal.clone().transformDirection(mundo.object.matrixWorld) : dir.clone().negate() }
      : { tipo: 'nada', parte: '', ponto: origem.clone().addScaledVector(dir, 400), dist: 400, normal: dir.clone().negate() };
    for (const a of this.alvosEspeciais()) {
      const oc = a.centro.clone().sub(origem), tc = oc.dot(dir); if (tc <= 0) continue;
      const d2 = oc.lengthSq() - tc * tc; if (d2 > a.raio * a.raio) continue;
      const th = tc - Math.sqrt(a.raio * a.raio - d2);
      if (th < res.dist) res = { tipo: a.tipo, parte: a.parte, ponto: origem.clone().addScaledVector(dir, th), dist: th, normal: dir.clone().negate(), centro: a.centro.clone() };
    }
    res.dir = dir.clone(); res.origem = origem.clone();
    this.res = res;
    // 2. trajetória e tempos (em segundos reais)
    this.ini = origem.clone().addScaledVector(dir, 1.2); this.fim = res.ponto.clone();
    this.L = this.ini.distanceTo(this.fim);
    this.T = THREE.MathUtils.clamp(this.L / 22, 1.8, 4.6);
    this.tPos = 2.6;                                     // depois do impacto: reação em câmera lenta
    this.t = 0; this.fase = 'voo'; this.ativa = true; this.impactou = false;
    const lado = V().crossVectors(dir, V(0, 1, 0)); if (lado.lengthSq() < 1e-4) lado.set(1, 0, 0); this.lado = lado.normalize();
    this.cima = V().crossVectors(this.lado, dir).normalize();
    this.giroSinal = Math.random() < 0.5 ? 1 : -1;
    // câmera do desfecho: ao lado do alvo, a uns 3,5 m, um pouco acima
    const alvo = res.centro || res.ponto;
    this.camFinal = alvo.clone().addScaledVector(this.lado, 3.2 * this.giroSinal).addScaledVector(dir, -1.6).add(V(0, 0.9, 0));
    this.olharFinal = alvo.clone().add(V(0, res.tipo === 'mundo' || res.tipo === 'nada' ? 0 : -0.2, 0));
    this.bala.visible = true; this.rastro.visible = true;
    this.pr0 = this.renderer.getPixelRatio(); this.renderer.setPixelRatio(Math.max(this.pr0, Math.min(devicePixelRatio || 1, 1.5), 1.25));
    this.fov0 = this.camera.fov; this.near0 = this.camera.near; this.camera.fov = 52; this.camera.near = 0.03; this.camera.updateProjectionMatrix();
    this.el.classList.remove('oculto'); document.body.classList.add('na-balacam'); this._info();
    this._somVoo();
  }

  _info() { this.elInfo.textContent = `${this.L.toFixed(0)} m · câmera lenta`; }

  /** devolve { foco, escala } (escala de tempo do mundo) ou null quando acabou */
  atualizar(dt) {
    if (!this.ativa) return null;
    this.t += dt;
    const cam = this.camera;
    if (cam.fov !== 52 || cam.near !== 0.03) { cam.fov = 52; cam.near = 0.03; cam.updateProjectionMatrix(); }   // (a luneta mexe no fov no quadro do disparo)
    let escala = 0.03;
    if (this.fase === 'voo') {
      const k = Math.min(1, this.t / this.T), e = k < 0.12 ? k * 0.6 : 0.072 + (k - 0.12) / 0.88 * 0.928;   // arranca devagar e segue
      const pos = this.ini.clone().lerp(this.fim, e);
      this.bala.position.copy(pos); this.bala.lookAt(this.fim); this.bala.rotateZ(this.t * 9);             // gira no eixo (raiamento)
      const meio = this.ini.clone().lerp(pos, 0.5); this.rastro.position.copy(meio);
      this.rastro.quaternion.setFromUnitVectors(V(0, 1, 0), pos.clone().sub(this.ini).normalize()); this.rastro.scale.set(1, Math.max(0.01, this.ini.distanceTo(pos)), 1);
      this.rastro.material.opacity = 0.32 * (1 - k * 0.6);
      if (Math.random() < dt * 5) this._anel(pos);
      // câmera: atrás da bala, girando em volta dela até vê-la de lado; no último trecho, vai para o lado do alvo
      const giro = suave(Math.min(1, k / 0.8)) * 1.25 * this.giroSinal;
      const off = this.res.dir.clone().multiplyScalar(-0.55 + 0.3 * suave(k)).addScaledVector(this.lado, Math.sin(giro) * 0.45).addScaledVector(this.cima, 0.1 + Math.cos(giro) * 0.06);
      const camBala = pos.clone().add(off), olharBala = pos.clone().addScaledVector(this.res.dir, 2.5);
      if (k > 0.86) {
        const u = suave((k - 0.86) / 0.14);
        cam.position.copy(camBala.lerp(this.camFinal, u)); cam.lookAt(olharBala.lerp(this.olharFinal, u));
      } else { cam.position.copy(camBala); cam.lookAt(olharBala); }
      if (k >= 1) { this.fase = 'reacao'; this.t = 0; this._impacto(); }
      return { foco: { x: pos.x, z: pos.z }, escala };
    }
    // reação: câmera parada ao lado do alvo, aproximando devagar; o mundo anda devagar e depois normal
    const u = Math.min(1, this.t / this.tPos);
    escala = u < 0.55 ? 0.3 : 0.3 + (u - 0.55) / 0.45 * 0.7;
    cam.position.copy(this.camFinal.clone().lerp(this.olharFinal, 0.18 * suave(u)));
    cam.lookAt(this.olharFinal);
    this._particulas(dt);
    if (u >= 1) { this._terminar(); return null; }
    return { foco: { x: this.olharFinal.x, z: this.olharFinal.z }, escala };
  }

  _anel(p) {
    const a = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), this.matAnel.clone()); a.position.copy(p); a.lookAt(p.clone().add(this.res.dir));
    a.userData.vida = 0.7; this.scene.add(a); this.aneis.push(a);
  }

  _impacto() {
    this.bala.visible = false; this.impactou = true;
    const r = this.res, p = r.ponto;
    const tex = r.tipo === 'bandido' || r.tipo === 'refem' ? this.texSangue : r.tipo === 'arma' ? this.texFaisca : this.texPoeira;
    const n = r.tipo === 'arma' ? 10 : 7;
    for (let i = 0; i < n; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: r.tipo === 'arma' ? THREE.AdditiveBlending : THREE.NormalBlending }));
      s.position.copy(p); s.scale.setScalar(r.tipo === 'mundo' ? 0.35 : 0.18);
      const v = r.dir.clone().multiplyScalar(r.tipo === 'mundo' ? -0.6 : 0.9).add(V((Math.random() - 0.5) * 1.4, Math.random() * 1.1, (Math.random() - 0.5) * 1.4));
      s.userData = { v, vida: 1.6 + Math.random() * 0.6 }; this.scene.add(s); this.particulas.push(s);
    }
    this.aoImpacto?.(r);
    this._somImpacto(r.tipo);
  }

  _particulas(dt) {
    const dm = dt * 0.4;                                                                  // as partículas também em câmera lenta
    this.particulas = this.particulas.filter(s => { const u = s.userData; u.vida -= dt; if (u.vida <= 0) { this.scene.remove(s); s.material.dispose(); return false; } s.position.addScaledVector(u.v, dm); u.v.y -= 2.5 * dm; s.scale.multiplyScalar(1 + dm * 1.4); s.material.opacity = Math.min(1, u.vida); return true; });
  }

  atualizarEfeitos(dt) {
    this.aneis = this.aneis.filter(a => { a.userData.vida -= dt; if (a.userData.vida <= 0) { this.scene.remove(a); a.material.dispose(); a.geometry.dispose(); return false; } a.scale.multiplyScalar(1 + dt * 2.2); a.material.opacity = a.userData.vida * 0.6; return true; });
    if (!this.ativa) this._particulas(dt);
  }

  _terminar() {
    this.ativa = false; this.rastro.visible = false;
    this.renderer.setPixelRatio(this.pr0); this.camera.fov = this.fov0; this.camera.near = this.near0; this.camera.updateProjectionMatrix();
    this.el.classList.add('oculto'); document.body.classList.remove('na-balacam');
    this.aoFim?.(this.res);
  }

  pular() { if (!this.ativa) return; if (!this.impactou) this._impacto(); this._terminar(); }

  _somVoo() {
    const s = this.som; if (!s?.ctx || s.mudo) return;
    const ctx = s.ctx, now = ctx.currentTime, dur = this.T;
    const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate), a = b.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
    const n = ctx.createBufferSource(); n.buffer = b; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(260, now); f.frequency.linearRampToValueAtTime(520, now + dur); f.Q.value = 1.4;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(0.22, now + 0.4); g.gain.linearRampToValueAtTime(0.16, now + dur - 0.2); g.gain.linearRampToValueAtTime(0.0001, now + dur);
    n.connect(f); f.connect(g); g.connect(ctx.destination); n.start(now); n.stop(now + dur);
  }
  _somImpacto(tipo) {
    const s = this.som; if (!s?.ctx || s.mudo) return;
    const ctx = s.ctx, now = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo === 'arma' ? 'square' : 'sine'; o.frequency.setValueAtTime(tipo === 'arma' ? 1800 : 110, now); o.frequency.exponentialRampToValueAtTime(tipo === 'arma' ? 600 : 45, now + 0.25);
    g.gain.setValueAtTime(tipo === 'arma' ? 0.12 : 0.5, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.4); o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now + 0.45);
  }
}
