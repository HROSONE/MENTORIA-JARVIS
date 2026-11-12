// Motor do vídeo (Short do sono militar; cópia adaptada do motor do Short do elevador): renderizador, cena, grupos por cenário, luzes, brilhos (sprites), partículas determinísticas e captura de quadros com borrão de movimento.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { clamp, lerp, mulberry32, ruido } from './util.js';

export const LARG = 1080, ALT = 1920, FPS = 30;
const Q = new URLSearchParams(location.search);

export const renderer = new THREE.WebGLRenderer({ antialias: Q.get('aa') !== '0', preserveDrawingBuffer: true });
const larg = +(Q.get('w') || LARG), alt = +(Q.get('h') || ALT);
renderer.setPixelRatio(1);
renderer.setSize(larg, alt);
renderer.shadowMap.enabled = Q.get('sombra') !== '0';
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.appendChild(renderer.domElement);

export const scene = new THREE.Scene();
export const cam = new THREE.PerspectiveCamera(40, larg / alt, 0.05, 700);
scene.add(cam);

// um grupo por cenário; só o cenário do plano atual fica visível
export const mundos = { F: new THREE.Group(), S: new THREE.Group(), N: new THREE.Group() };
for (const k in mundos) { mundos[k].name = 'mundo' + k; scene.add(mundos[k]); mundos[k].visible = false; }

// ---------------------------------------------------------------------------------------------------- carregamento
const cacheGLB = new Map();
const carregador = new GLTFLoader();
export function glb(url) {
  if (!cacheGLB.has(url)) cacheGLB.set(url, carregador.loadAsync(url));
  return cacheGLB.get(url);
}
export async function clonarGLB(url) {
  const g = await glb(url);
  return SkeletonUtils.clone(g.scene);
}
export function sombras(obj, emite = true, recebe = true) {
  obj.traverse(o => { if (o.isMesh) { o.castShadow = emite; o.receiveShadow = recebe; } });
  return obj;
}

// ---------------------------------------------------------------------------------------------------- texturas procedurais
export function canvasTex(w, h, desenhar, { repete = false, aniso = 4, srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  desenhar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repete) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = aniso;
  return t;
}
const _brilhos = {};
export function texBrilho(cor = '255,214,150') {
  if (_brilhos[cor]) return _brilhos[cor];
  return _brilhos[cor] = canvasTex(128, 128, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    r.addColorStop(0, `rgba(${cor},1)`); r.addColorStop(0.18, `rgba(${cor},0.55)`); r.addColorStop(0.5, `rgba(${cor},0.12)`); r.addColorStop(1, `rgba(${cor},0)`);
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  });
}
let _fumaca = null;
export function texFumaca() {
  if (_fumaca) return _fumaca;
  const rnd = mulberry32(5);
  return _fumaca = canvasTex(128, 128, (g, w, h) => {
    for (let i = 0; i < 26; i++) {
      const x = w / 2 + (rnd() - 0.5) * w * 0.42, y = h / 2 + (rnd() - 0.5) * h * 0.42, r = w * (0.12 + rnd() * 0.2);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
    const fade = g.createRadialGradient(w / 2, h / 2, w * 0.18, w / 2, h / 2, w / 2);
    fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = fade; g.fillRect(0, 0, w, h);
  });
}

// brilho aditivo (farol, lâmpada, brilho de lanterna)
export function brilho(cor = '255,214,150', tam = 1, op = 1) {
  const m = new THREE.SpriteMaterial({ map: texBrilho(cor), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: op, fog: false });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(tam);
  s.renderOrder = 10;
  return s;
}

// ---------------------------------------------------------------------------------------------------- partículas determinísticas
// Cada partícula nasce em t0 e a posição é função fechada do tempo (gravidade, arrasto, chão): o vídeo pode ser renderizado em qualquer ordem.
export class Rajada {
  constructor(pai, { n, geo, mat, t0 = 0, vida = 2, semente = 1, origem = [0, 0, 0], raio = 0.2, vel = [4, 8], dir = [0, 1, 0], v0 = [0, 0, 0], abre = 1.0, grav = 9.8, arrasto = 0.4, tam = [0.02, 0.05], tam1 = null,
                     gira = 8, chao = 0.02, quica = 0.25, billboard = false, cores = null, nasce = 0, fim = 'some', crescer = 0, sobe = 0 }) {
    this.n = n; this.t0 = t0; this.vida = vida; this.grav = grav; this.arrasto = arrasto; this.chao = chao; this.quica = quica; this.billboard = billboard; this.fim = fim; this.crescer = crescer; this.sobe = sobe;
    const r = mulberry32(semente);
    this.P = [];
    const d0 = new THREE.Vector3(...dir).normalize();
    for (let i = 0; i < n; i++) {
      const u = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(abre).add(d0).normalize();
      const v = u.multiplyScalar(lerp(vel[0], vel[1], r())).add(new THREE.Vector3(...v0));
      const p = new THREE.Vector3(origem[0] + (r() - 0.5) * 2 * raio, origem[1] + (r() - 0.5) * 2 * raio, origem[2] + (r() - 0.5) * 2 * raio);
      this.P.push({ p, v, nasce: t0 + r() * nasce, t: lerp(tam[0], tam[1], r()), t1: tam1 ? lerp(tam1[0], tam1[1], r()) : null,
                    eixo: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), w: (r() - 0.5) * 2 * gira, fase: r() * 6.28, cor: cores ? cores[Math.floor(r() * cores.length)] : null, vida: vida * lerp(0.7, 1.15, r()) });
    }
    for (const q of this.P) {                                                       // instante em que toca o chão
      q.th = Infinity;
      for (let tau = 0.02; tau < q.vida * 1.3; tau += 0.01) {
        const f = arrasto > 0 ? (1 - Math.exp(-arrasto * tau)) / arrasto : tau;
        if (q.p.y + q.v.y * f - 0.5 * grav * tau * tau + sobe * tau < chao) { q.th = tau; break; }
      }
    }
    this.mesh = new THREE.InstancedMesh(geo, mat, n);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (cores) { const c = new THREE.Color(); this.P.forEach((q, i) => this.mesh.setColorAt(i, c.set(q.cor))); }
    pai.add(this.mesh);
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3(); this._p = new THREE.Vector3();
  }
  atualizar(t, camera) {
    const g = this.grav, k = this.arrasto;
    for (let i = 0; i < this.n; i++) {
      const q = this.P[i], tau = t - q.nasce;
      if (tau < 0 || (this.fim === 'some' && tau > q.vida)) { this._m.makeScale(0, 0, 0); this.mesh.setMatrixAt(i, this._m); continue; }
      let tt = tau, slide = 0;
      if (tau > q.th) { slide = tau - q.th; tt = q.th; }
      const f = k > 0 ? (1 - Math.exp(-k * tt)) / k : tt;
      let y = q.p.y + q.v.y * f - 0.5 * g * tt * tt + this.sobe * tt;
      let x = q.p.x + q.v.x * f, z = q.p.z + q.v.z * f;
      if (slide > 0) {                                                          // no chão: desliza um pouco e para
        const sl = (1 - Math.exp(-9 * slide)) / 9 * 0.35 * Math.exp(-k * tt);
        y = this.chao; x += q.v.x * sl; z += q.v.z * sl;
      }
      this._p.set(x, y, z);
      const vida01 = clamp(tau / q.vida);
      let e = q.t;
      if (q.t1 !== null) e = lerp(q.t, q.t1, vida01);
      if (this.crescer) e *= 1 + this.crescer * vida01;
      if (this.fim === 'some') e *= vida01 > 0.7 ? 1 - (vida01 - 0.7) / 0.3 : 1;
      if (this.billboard && camera) this._q.copy(camera.quaternion); else this._q.setFromAxisAngle(q.eixo, q.fase + q.w * Math.min(tau, 2.5));
      this._s.setScalar(e);
      this._m.compose(this._p, this._q, this._s);
      this.mesh.setMatrixAt(i, this._m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
  ajustar(fn) {                                                                     // fn(i, partícula) pode mudar p (origem), nasce, v...
    this.P.forEach((q, i) => fn(i, q));
    for (const q of this.P) {
      q.th = Infinity;
      for (let tau = 0.02; tau < q.vida * 1.3; tau += 0.01) {
        const f = this.arrasto > 0 ? (1 - Math.exp(-this.arrasto * tau)) / this.arrasto : tau;
        if (q.p.y + q.v.y * f - 0.5 * this.grav * tau * tau + this.sobe * tau < this.chao) { q.th = tau; break; }
      }
    }
    return this;
  }
  mostrar(v) { this.mesh.visible = v; }
}

// tremor de câmera na mão (sempre ligado): deslocamento + rotação, com amplitude `a` e velocidade `f`
export function tremor(c, t, a = 1, f = 1, semente = 0) {
  c.position.x += a * 0.012 * ruido(t * 7 * f, semente);
  c.position.y += a * 0.012 * ruido(t * 7.7 * f, semente + 1);
  c.position.z += a * 0.008 * ruido(t * 6.3 * f, semente + 2);
  c.rotateX(a * 0.0045 * ruido(t * 6.1 * f, semente + 3));
  c.rotateY(a * 0.0045 * ruido(t * 5.7 * f, semente + 4));
  c.rotateZ(a * 0.0060 * ruido(t * 4.9 * f, semente + 5));
}

// ---------------------------------------------------------------------------------------------------- captura com borrão de movimento
const acc = document.createElement('canvas'); acc.width = larg; acc.height = alt;
const g2 = acc.getContext('2d');
export function capturar(desenharEm, t, { subs = 1, obturador = 0.5, fade = 0, flash = 0, flashCor = '255,255,255', jpeg = 0.92, tintas = null } = {}) {
  // desenharEm(t): atualiza a cena para o instante t e renderiza
  for (let k = 0; k < subs; k++) {
    const tk = subs > 1 ? t + (k / (subs - 1) - 0.5) * obturador / FPS : t;
    desenharEm(tk);
    g2.globalAlpha = 1 / (k + 1);
    g2.drawImage(renderer.domElement, 0, 0);
  }
  g2.globalAlpha = 1;
  if (flash > 0) { g2.fillStyle = `rgba(${flashCor},${clamp(flash)})`; g2.fillRect(0, 0, larg, alt); }
  if (fade > 0) { g2.fillStyle = `rgba(0,0,0,${clamp(fade)})`; g2.fillRect(0, 0, larg, alt); }
  if (tintas) tintas(g2, larg, alt);
  return acc.toDataURL('image/jpeg', jpeg);
}
export const tela = { larg, alt };
