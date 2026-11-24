// Motor do Short "Ele podia voar": renderizador com pós de cinema (oclusão de ambiente GTAO, brilho, profundidade de campo), cena, texturas procedurais,
// partículas determinísticas (Rajada) e captura com borrão de movimento. O vídeo inteiro é função do tempo: qualquer quadro sai igual em qualquer ordem.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { clamp, lerp, mulberry32 } from './util.js';

export const LARG = 1080, ALT = 1920, FPS = 30;
export const Q = new URLSearchParams(location.search);
const larg = +(Q.get('w') || LARG), alt = +(Q.get('h') || ALT);

export const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(larg, alt);
renderer.shadowMap.enabled = Q.get('sombra') !== '0'; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

export const scene = new THREE.Scene();
export const cam = new THREE.PerspectiveCamera(40, larg / alt, 0.03, 900);
scene.add(cam);

// ---------------------------------------------------------------------------------------------------- pós (no navegador: precisa da profundidade)
const rt = new THREE.WebGLRenderTarget(larg, alt, { type: THREE.HalfFloatType, samples: Q.get('msaa') === '0' ? 0 : 4 });
export const composer = new EffectComposer(renderer, rt);
const passRender = new RenderPass(scene, cam);
export const passAO = new GTAOPass(scene, cam, larg, alt);
passAO.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 12 });
passAO.blendIntensity = 0.85;
export const passBrilho = new UnrealBloomPass(new THREE.Vector2(larg / 2, alt / 2), 0.35, 0.55, 0.85);
export const passFoco = new BokehPass(scene, cam, { focus: 3, aperture: 0.0, maxblur: 0.008 });
composer.addPass(passRender);
if (Q.get('ao') !== '0') composer.addPass(passAO);
composer.addPass(passBrilho);
if (Q.get('dof') !== '0') composer.addPass(passFoco);
composer.addPass(new OutputPass());

/** lente do plano: foco (m até o assunto), abertura (0 = tudo nítido; 0.002-0.02 cinema), brilho (força do bloom), limiar */
export function lente({ foco = 3, abertura = 0, desfoque = 0.010, brilho = 0.35, limiar = 0.85, raioBrilho = 0.55, ao = 0.85 } = {}) {
  passFoco.uniforms.focus.value = foco; passFoco.uniforms.aperture.value = abertura; passFoco.uniforms.maxblur.value = desfoque; passFoco.enabled = abertura > 0;
  passBrilho.strength = brilho; passBrilho.threshold = limiar; passBrilho.radius = raioBrilho;
  passAO.blendIntensity = ao; passAO.enabled = ao > 0;
}
export function desenharTela() { composer.render(); }

// ---------------------------------------------------------------------------------------------------- texturas procedurais
export function canvasTex(w, h, desenhar, { repete = false, aniso = 8, srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  desenhar(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repete) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso;
  return t;
}
/** mapa de relevo (normal map) a partir de uma função de altura desenhada em canvas cinza */
export function normalDeAltura(texAltura, forca = 2) {
  const src = texAltura.image, w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), o = g.createImageData(w, h);
  const H = (x, y) => d[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * forca, dy = (H(x, y + 1) - H(x, y - 1)) * forca, l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    o.data[i] = (-dx / l * 0.5 + 0.5) * 255; o.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; o.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; o.data[i + 3] = 255;
  }
  g.putImageData(o, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
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
export function brilho(cor = '255,214,150', tam = 1, op = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrilho(cor), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: op, fog: false }));
  s.scale.setScalar(tam); s.renderOrder = 10; return s;
}
let _fumaca = null;
export function texFumaca() {
  if (_fumaca) return _fumaca;
  const rnd = mulberry32(5);
  return _fumaca = canvasTex(256, 256, (g, w, h) => {
    for (let i = 0; i < 40; i++) {
      const x = w / 2 + (rnd() - 0.5) * w * 0.45, y = h / 2 + (rnd() - 0.5) * h * 0.45, r = w * (0.10 + rnd() * 0.2);
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.20)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
    const fade = g.createRadialGradient(w / 2, h / 2, w * 0.16, w / 2, h / 2, w / 2); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = fade; g.fillRect(0, 0, w, h);
  });
}
export function sombras(obj, emite = true, recebe = true) { obj.traverse(o => { if (o.isMesh) { o.castShadow = emite; o.receiveShadow = recebe; } }); return obj; }

// ---------------------------------------------------------------------------------------------------- partículas determinísticas (posição em forma fechada no tempo)
export class Rajada {
  constructor(pai, { n, geo, mat, t0 = 0, vida = 2, semente = 1, origem = [0, 0, 0], raio = 0.2, vel = [4, 8], dir = [0, 1, 0], v0 = [0, 0, 0], abre = 1.0, grav = 9.8, arrasto = 0.4, tam = [0.02, 0.05], tam1 = null,
                     gira = 8, chao = 0.02, billboard = false, nasce = 0, sobe = 0 }) {
    Object.assign(this, { n, t0, vida, grav, arrasto, chao, billboard, sobe });
    const r = mulberry32(semente), d0 = new THREE.Vector3(...dir).normalize();
    this.P = [];
    for (let i = 0; i < n; i++) {
      const u = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(abre).add(d0).normalize();
      const v = u.multiplyScalar(lerp(vel[0], vel[1], r())).add(new THREE.Vector3(...v0));
      const p = new THREE.Vector3(origem[0] + (r() - 0.5) * 2 * raio, origem[1] + (r() - 0.5) * 2 * raio, origem[2] + (r() - 0.5) * 2 * raio);
      this.P.push({ p, v, nasce: t0 + r() * nasce, t: lerp(tam[0], tam[1], r()), t1: tam1 ? lerp(tam1[0], tam1[1], r()) : null, eixo: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), w: (r() - 0.5) * 2 * gira, fase: r() * 6.28, vida: vida * lerp(0.7, 1.15, r()) });
    }
    for (const q of this.P) { q.th = Infinity; for (let tau = 0.02; tau < q.vida * 1.3; tau += 0.01) { const f = arrasto > 0 ? (1 - Math.exp(-arrasto * tau)) / arrasto : tau; if (q.p.y + q.v.y * f - 0.5 * grav * tau * tau + sobe * tau < chao) { q.th = tau; break; } } }
    this.mesh = new THREE.InstancedMesh(geo, mat, n); this.mesh.frustumCulled = false; this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); pai.add(this.mesh);
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3(); this._p = new THREE.Vector3();
  }
  atualizar(t, camera) {
    const g = this.grav, k = this.arrasto;
    for (let i = 0; i < this.n; i++) {
      const q = this.P[i], tau = t - q.nasce;
      if (tau < 0 || tau > q.vida) { this._m.makeScale(0, 0, 0); this.mesh.setMatrixAt(i, this._m); continue; }
      let tt = tau, slide = 0; if (tau > q.th) { slide = tau - q.th; tt = q.th; }
      const f = k > 0 ? (1 - Math.exp(-k * tt)) / k : tt;
      let y = q.p.y + q.v.y * f - 0.5 * g * tt * tt + this.sobe * tt, x = q.p.x + q.v.x * f, z = q.p.z + q.v.z * f;
      if (slide > 0) { const sl = (1 - Math.exp(-9 * slide)) / 9 * 0.35 * Math.exp(-k * tt); y = this.chao; x += q.v.x * sl; z += q.v.z * sl; }
      const v01 = clamp(tau / q.vida); let e = q.t1 !== null ? lerp(q.t, q.t1, v01) : q.t; e *= v01 > 0.7 ? 1 - (v01 - 0.7) / 0.3 : 1;
      if (this.billboard && camera) this._q.copy(camera.quaternion); else this._q.setFromAxisAngle(q.eixo, q.fase + q.w * Math.min(tau, 2.5));
      this._m.compose(this._p.set(x, y, z), this._q, this._s.setScalar(e)); this.mesh.setMatrixAt(i, this._m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// ---------------------------------------------------------------------------------------------------- captura com borrão de movimento
const acc = document.createElement('canvas'); acc.width = larg; acc.height = alt; const g2 = acc.getContext('2d');
export function capturar(desenharEm, t, { subs = 1, obturador = 0.5, fade = 0, flash = 0, flashCor = '255,255,255', jpeg = 0.93 } = {}) {
  for (let k = 0; k < subs; k++) {
    const tk = subs > 1 ? t + (k / (subs - 1) - 0.5) * obturador / FPS : t;
    desenharEm(tk); g2.globalAlpha = 1 / (k + 1); g2.drawImage(renderer.domElement, 0, 0);
  }
  g2.globalAlpha = 1;
  if (flash > 0) { g2.fillStyle = `rgba(${flashCor},${clamp(flash)})`; g2.fillRect(0, 0, larg, alt); }
  if (fade > 0) { g2.fillStyle = `rgba(0,0,0,${clamp(fade)})`; g2.fillRect(0, 0, larg, alt); }
  return acc.toDataURL('image/jpeg', jpeg);
}
export const tela = { larg, alt };
