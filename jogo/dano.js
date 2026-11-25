// DANO, VIDA E EFEITOS do Hryz City.
//  · Jogador: 100 de vida, barra na tela, tela vermelha a cada dano, volta a encher devagar depois de 6 s sem apanhar;
//    se zerar, desmaia e acorda no hospital.
//  · Veículos: 100 de "lataria"; batidas (pela velocidade do impacto) e tiros tiram vida; abaixo de 45 sai fumaça cinza,
//    abaixo de 15 fumaça preta e fogo; em 0 explode (clarão, bola de fogo, empurra e fere quem estiver perto), fica queimado
//    e não anda mais; volta inteiro na vaga depois de um tempo.
//  · Partículas leves (sprites) com um único conjunto de texturas.
import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
function texPuff(cor) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, cor); r.addColorStop(0.6, cor.replace(/[\d.]+\)$/, '0.35)')); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}

export class Efeitos {
  constructor(scene) {
    this.scene = scene; this.lista = [];
    this.tex = { cinza: texPuff('rgba(170,170,170,0.8)'), preta: texPuff('rgba(30,30,30,0.85)'), fogo: texPuff('rgba(255,150,40,1)'), poeira: texPuff('rgba(150,120,85,0.8)'), terra: texPuff('rgba(110,80,50,0.95)') };
    this.luz = new THREE.PointLight(0xffa040, 0, 30, 2); scene.add(this.luz); this.tLuz = 0;
  }
  /** uma partícula: tipo ('cinza'|'preta'|'fogo'|'poeira'|'terra'), posição, velocidade, vida, tamanho inicial e crescimento */
  emitir(tipo, p, v, vida = 1.5, tam = 0.6, cresce = 1.2, gravidade = 0) {
    if (this.lista.length > 260) return;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex[tipo], transparent: true, depthWrite: false, blending: tipo === 'fogo' ? THREE.AdditiveBlending : THREE.NormalBlending }));
    s.position.copy(p); s.scale.setScalar(tam); this.scene.add(s);
    this.lista.push({ s, v: v.clone(), vida, vida0: vida, cresce, gravidade });
  }
  explosao(p) {
    for (let i = 0; i < 26; i++) this.emitir('fogo', p.clone().add(V((Math.random() - 0.5) * 1.5, Math.random() * 1.2, (Math.random() - 0.5) * 1.5)), V((Math.random() - 0.5) * 7, 2 + Math.random() * 6, (Math.random() - 0.5) * 7), 0.7 + Math.random() * 0.5, 1.4, 2.2);
    for (let i = 0; i < 18; i++) this.emitir('preta', p.clone().add(V(0, 1, 0)), V((Math.random() - 0.5) * 3, 3 + Math.random() * 3, (Math.random() - 0.5) * 3), 2.5 + Math.random() * 1.5, 1.6, 1.6);
    this.luz.position.copy(p).add(V(0, 2, 0)); this.luz.intensity = 60; this.tLuz = 0.6;
  }
  atualizar(dt) {
    if (this.tLuz > 0) { this.tLuz -= dt; this.luz.intensity = Math.max(0, this.tLuz / 0.6) * 60; }
    this.lista = this.lista.filter(e => {
      e.vida -= dt; if (e.vida <= 0) { this.scene.remove(e.s); e.s.material.dispose(); return false; }
      e.v.y -= e.gravidade * dt; e.s.position.addScaledVector(e.v, dt); e.v.multiplyScalar(1 - dt * 0.8);
      e.s.scale.multiplyScalar(1 + dt * e.cresce); e.s.material.opacity = Math.min(1, e.vida / e.vida0 * 1.4);
      return true;
    });
  }
}

/** vida do jogador + barra na tela */
export class VidaJogador {
  constructor({ aoMorrer }) {
    this.max = 100; this.hp = 100; this.tSemDano = 99; this.morto = false; this.aoMorrer = aoMorrer;
    this.el = document.getElementById('hud-vida'); this.elBarra = this.el?.querySelector('i'); this.elNum = this.el?.querySelector('b');
    this.elDano = document.getElementById('tela-dano');
    this._hud();
  }
  dano(n, motivo = '') {
    if (this.morto || n <= 0) return;
    this.hp = Math.max(0, this.hp - n); this.tSemDano = 0;
    this.elDano?.classList.add('visivel'); clearTimeout(this._t); this._t = setTimeout(() => { if (!this.morto) this.elDano?.classList.remove('visivel'); }, 260 + n * 6);
    this._hud();
    if (this.hp <= 0) { this.morto = true; this.aoMorrer?.(motivo); }
  }
  curar(n) { this.hp = Math.min(this.max, this.hp + n); this._hud(); }
  reviver() { this.morto = false; this.hp = this.max; this.tSemDano = 99; this.elDano?.classList.remove('visivel'); this._hud(); }
  atualizar(dt) {
    this.tSemDano += dt;
    if (!this.morto && this.tSemDano > 6 && this.hp < this.max) { this.hp = Math.min(this.max, this.hp + dt * 4); this._hud(); }
  }
  _hud() {
    if (!this.el) return;
    const k = this.hp / this.max;
    this.elBarra.style.transform = `scaleX(${k.toFixed(3)})`; this.elBarra.style.background = k > 0.5 ? '#22c55e' : k > 0.25 ? '#facc15' : '#ef4444';
    this.elNum.textContent = Math.ceil(this.hp);
  }
}

/** estado de dano de um veículo (lataria, fumaça, fogo, explosão, queimado, volta na vaga) */
export function danoVeiculo(v, efeitos, { aoExplodir } = {}) {
  v.hp = 100; v.queimado = false;
  const cores = [];                                                  // cores originais (para escurecer quando queimar e restaurar depois)
  v.obj.traverse(m => { if (m.isMesh) for (const mt of [].concat(m.material, m.userData.matPbr || [], m.userData.matLeve || [])) if (mt?.color && !cores.find(c => c.mt === mt)) cores.push({ mt, c: mt.color.clone() }); });
  let tFumaca = 0, tVolta = 0;
  v.dano = (n, onde) => {
    if (v.queimado || n <= 0) return;
    v.hp = Math.max(0, v.hp - n);
    if (v.hp <= 0) {
      v.queimado = true; tVolta = 45;
      efeitos.explosao(onde || v.obj.position.clone().add(V(0, 1, 0)));
      for (const { mt } of cores) mt.color.multiplyScalar(0.18);
      v.vel = 0; v.sirene = false;
      aoExplodir?.(v);
    }
  };
  v.atualizarDano = (dt) => {
    if (v.queimado) {
      tVolta -= dt;
      tFumaca -= dt; if (tFumaca <= 0) { tFumaca = 0.12; const p = v.obj.position.clone().add(V((Math.random() - 0.5), 1.4, (Math.random() - 0.5))); efeitos.emitir('preta', p, V(0, 2.2, 0), 2.6, 0.9, 1.3); if (tVolta > 30) efeitos.emitir('fogo', p, V(0, 1.5, 0), 0.6, 0.8, 0.8); }
      if (tVolta <= 0 && v.vaga && v.aoVoltar?.()) { v.queimado = false; v.hp = 100; for (const { mt, c } of cores) mt.color.copy(c); }
      return;
    }
    if (v.hp < 45) {
      tFumaca -= dt;
      if (tFumaca <= 0) {
        tFumaca = v.hp < 15 ? 0.07 : 0.18;
        const frente = V(Math.sin(v.ry), 0, Math.cos(v.ry)), p = v.obj.position.clone().addScaledVector(frente, (v.raio || 2) * 0.55).add(V(0, 1.1, 0));
        efeitos.emitir(v.hp < 15 ? 'preta' : 'cinza', p, V((Math.random() - 0.5) * 0.4, 1.6, (Math.random() - 0.5) * 0.4), 2.0, 0.5, 1.4);
        if (v.hp < 15) efeitos.emitir('fogo', p, V(0, 1.2, 0), 0.45, 0.55, 0.6);
      }
    }
  };
  return v;
}
