// Carros do vídeo: modelos do Kenney (biblioteca3d/veiculos) com textura de cores refeita para a noite (vidro escuro, pintura da cor desejada),
// rodas que giram, faróis (luz + cone + brilho), lanternas, freio, amassado e peças.
import * as THREE from 'three';
import { glb, clonarGLB, brilho, canvasTex } from './motor.js';
import { clamp, lerp, suave, mulberry32 } from './util.js';

const BASE = '../biblioteca3d/veiculos/';
export const ESC = 1.7;                      // escala dos veículos Kenney nas ruas do kit
let _img = null;
function imagemColormap() {
  if (_img) return _img;
  _img = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = BASE + 'Textures/colormap.png'; });
  return _img;
}

// onde fica a tinta de cada modelo no colormap de 512 px (descoberto pelos UVs do corpo): [x0, y0, x1, y1]
const PINTURA = {
  'hatchback-sports': [192, 128, 256, 256],
  'sedan-sports': [384, 128, 448, 256],
  'sedan': [384, 128, 448, 256],
  'suv': null, 'police': null, 'taxi': null,
};
// luzes (em unidades do modelo, antes da escala): frente [x, y, z], trás [x, y, z]
const LUZES = {
  'hatchback-sports': { f: [0.47, 0.40, 1.36], t: [0.50, 0.66, -1.44], cabine: [0, 0.55, -0.1] },
  'sedan-sports': { f: [0.46, 0.49, 1.20], t: [0.50, 0.52, -1.29], cabine: [0, 0.55, -0.1] },
  'sedan': { f: [0.46, 0.50, 1.20], t: [0.50, 0.50, -1.29], cabine: [0, 0.55, -0.1] },
  'suv': { f: [0.46, 0.45, 1.28], t: [0.50, 0.60, -1.22], cabine: [0, 0.7, 0] },
  'police': { f: [0.46, 0.35, 1.34], t: [0.50, 0.55, -1.50], cabine: [0, 0.7, 0] },
};

async function texturas(modelo, pintura) {
  const img = await imagemColormap();
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  // vidro escuro (os dois meios-swatches do vidro)
  let gr = g.createLinearGradient(0, 384, 0, 512); gr.addColorStop(0, '#26344a'); gr.addColorStop(1, '#0b0f17');
  g.fillStyle = gr; g.fillRect(0, 384, 64, 128);
  // faróis: branco quente
  g.fillStyle = '#fff6dc'; g.fillRect(64, 384, 64, 128);
  const rect = PINTURA[modelo];
  if (rect && pintura) {
    gr = g.createLinearGradient(0, rect[1], 0, rect[3]); gr.addColorStop(0, pintura[0]); gr.addColorStop(1, pintura[1]);
    g.fillStyle = gr; g.fillRect(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]);
  }
  const map = new THREE.CanvasTexture(c); map.flipY = false; map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  const e = document.createElement('canvas'); e.width = e.height = 512;
  const ge = e.getContext('2d'); ge.fillStyle = '#000'; ge.fillRect(0, 0, 512, 512); ge.fillStyle = '#fff'; ge.fillRect(64, 384, 64, 128);
  const emi = new THREE.CanvasTexture(e); emi.flipY = false; emi.colorSpace = THREE.SRGBColorSpace;
  return { map, emi };
}

function gradienteCone() {
  return canvasTex(8, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,240,205,0.0)'); gr.addColorStop(0.08, 'rgba(255,240,205,0.9)'); gr.addColorStop(1, 'rgba(255,240,205,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
}

export class Carro {
  static async criar(modelo, { pintura = null, fome = true } = {}) {
    const obj = await clonarGLB(BASE + modelo + '.glb');
    const tx = await texturas(modelo, pintura);
    const c = new Carro(modelo, obj, tx);
    return c;
  }

  constructor(modelo, obj, tx) {
    this.modelo = modelo;
    this.grupo = new THREE.Group();
    this.corpoGrupo = new THREE.Group();          // inclina/rola sem mexer nas luzes
    this.grupo.add(this.corpoGrupo);
    this.obj = obj; obj.scale.setScalar(ESC);
    this.corpoGrupo.add(obj);
    this.rodas = [];
    this.dist = 0;
    this.mats = [];
    obj.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      const m = o.material.clone();
      m.map = tx.map; m.emissiveMap = tx.emi; m.emissive = new THREE.Color(0xffffff); m.emissiveIntensity = 0; m.roughness = 0.55; m.metalness = 0.08;
      o.material = m; this.mats.push(m);
      if (o.name === 'body') this.corpo = o;
    });
    for (const n of ['wheel-front-left', 'wheel-front-right', 'wheel-back-left', 'wheel-back-right']) {
      const w = obj.getObjectByName(n);
      if (w) { w.rotation.order = 'YXZ'; this.rodas.push({ nome: n, o: w, frente: n.includes('front') }); }
    }
    const L = LUZES[modelo] || LUZES['sedan'];
    this.L = L;
    // faróis (spot) e cones
    this.spot = new THREE.SpotLight(0xfff0d8, 0, 70, 0.52, 0.75, 1.5);
    this.spot.position.set(0, L.f[1] * ESC + 0.2, L.f[2] * ESC);
    this.spot.target.position.set(0, 0, L.f[2] * ESC + 14);
    this.corpoGrupo.add(this.spot); this.corpoGrupo.add(this.spot.target);
    this.cones = []; this.glows = []; this.glowsT = [];
    const tg = gradienteCone();
    const cg = new THREE.CylinderGeometry(0.15, 2.4, 22, 20, 1, true); cg.translate(0, -11, 0); cg.rotateX(-Math.PI / 2 + 0.07);   // ponta no farol, abre para frente
    for (const sg of [1, -1]) {
      const cm = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ map: tg, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      cm.position.set(sg * L.f[0] * ESC * 0.95, L.f[1] * ESC, L.f[2] * ESC);
      cm.rotation.y = sg * 0.03; cm.frustumCulled = false;
      this.corpoGrupo.add(cm); this.cones.push(cm);
      const gl = brilho('255,236,190', 2.2, 0); gl.position.set(sg * L.f[0] * ESC, L.f[1] * ESC, L.f[2] * ESC + 0.1); this.corpoGrupo.add(gl); this.glows.push(gl);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.13, 0.06), new THREE.MeshStandardMaterial({ color: 0x401010, emissive: 0xff1810, emissiveIntensity: 0.0 }));
      lamp.position.set(sg * L.t[0] * ESC * 0.95, L.t[1] * ESC, L.t[2] * ESC - 0.02); this.corpoGrupo.add(lamp); this.glowsT.push(lamp);
      const gt = brilho('255,40,24', 1.5, 0); gt.position.set(sg * L.t[0] * ESC * 0.95, L.t[1] * ESC, L.t[2] * ESC - 0.18); this.corpoGrupo.add(gt); lamp.userData.glow = gt;
    }
    this.farol = 0; this.freioK = 0.25;
    // amassado: guarda a geometria original
    if (this.corpo) {
      this.corpo.geometry = this.corpo.geometry.clone();
      this.orig = this.corpo.geometry.attributes.position.array.slice();
      this.D = { tras: null, frente: null, lado: null };
      this.nivel = { tras: 0, frente: 0, lado: 0 };
    }
  }

  // posiciona o carro (centro do chão), giro (rad em Y), com cabeceio/rolagem opcionais; `dist` = distância rodada (giro das rodas)
  colocar(x, y, z, giro, { pitch = 0, roll = 0, dist = null, esterco = 0 } = {}) {
    this.grupo.position.set(x, y, z);
    this.grupo.rotation.set(0, giro, 0);
    this.corpoGrupo.rotation.set(pitch, 0, roll, 'ZXY');
    if (dist !== null) this.dist = dist;
    const ang = this.dist / (0.3 * ESC);
    for (const r of this.rodas) { r.o.rotation.x = ang; r.o.rotation.y = r.frente ? esterco : 0; }
    return this;
  }

  // farol: 0 apagado, 1 aceso (spot + cones + brilho)
  farois(k = 1, spot = 1) {
    this.farol = k;
    this.spot.intensity = 520 * k * spot;
    this.cones.forEach(c => { c.material.opacity = 0.16 * k; });
    this.glows.forEach(gl => { gl.material.opacity = 0.9 * k; });
    this.mats.forEach(m => { m.emissiveIntensity = 1.6 * k; });
  }
  // lanternas: k = 0.25 normal, 1 freio
  lanternas(k = 0.3) {
    this.freioK = k;
    this.glowsT.forEach(l => { l.material.emissiveIntensity = 2.2 * k; l.userData.glow.material.opacity = Math.min(1, 0.9 * k); l.userData.glow.scale.setScalar(1.1 + 1.4 * k); });
  }

  // prepara o amassado: zonas { centro, raio, dir, prof } em unidades do modelo; ruído estável por vértice
  preparar(nome, zonas, semente = 3) {
    if (!this.corpo) return;
    const pos = this.orig, n = pos.length / 3, D = new Float32Array(pos.length);
    const r = mulberry32(semente);
    for (const z of zonas) {
      for (let i = 0; i < n; i++) {
        const dx = pos[i * 3] - z.centro[0], dy = pos[i * 3 + 1] - z.centro[1], dz = pos[i * 3 + 2] - z.centro[2];
        const d = Math.hypot(dx, dy * 1.2, dz);
        if (d >= z.raio) continue;
        const w = Math.pow(1 - d / z.raio, 1.4);
        const h = Math.sin(pos[i * 3] * 91.7 + pos[i * 3 + 1] * 53.1 + pos[i * 3 + 2] * 17.3 + semente) * 0.5 + 0.5;
        D[i * 3] += z.dir[0] * z.prof * w * (0.65 + 0.7 * h) + (h - 0.5) * 0.10 * w;
        D[i * 3 + 1] += z.dir[1] * z.prof * w * (0.65 + 0.7 * h) + (0.5 - h) * 0.12 * w;
        D[i * 3 + 2] += z.dir[2] * z.prof * w * (0.65 + 0.7 * h);
      }
    }
    this.D[nome] = D;
  }
  amassar(nome, k) {
    if (!this.corpo || !this.D[nome]) return;
    this.nivel[nome] = k;
    const a = this.corpo.geometry.attributes.position, pos = a.array;
    pos.set(this.orig);
    for (const nm in this.D) {
      const D = this.D[nm], kk = this.nivel[nm];
      if (!D || kk <= 0) continue;
      for (let i = 0; i < pos.length; i++) pos[i] += D[i] * kk;
    }
    a.needsUpdate = true;
    this.corpo.geometry.computeVertexNormals();
  }
}
