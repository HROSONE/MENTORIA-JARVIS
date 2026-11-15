// Mundo V: vilarejo rústico de casas de pedra e adobe ao fim da tarde, cores vivas. O telhado do herói tem cumeeira estreita;
// ao lado, separado por um beco, um muro alto de pedra onde ele pousa. Casas da biblioteca (com a caixa de correio Hryz) ao fundo.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clamp, lerp, mulberry32 } from './util.js';
import { ruidoS, fbm, texFn, criarCeu } from './base.js';

const NV = ruidoS(41);
export const CUME = { y: 5.46, x0: -4.6, x1: 4.6, z: 0 };            // cumeeira do telhado do herói
export const MURO = { x0: 6.9, x1: 16, y: 5.15, z: 0, larg: 0.42 };  // topo do muro alto onde ele pousa
const cores = ['#f4e8cc', '#f2c04a', '#3fb6b0', '#e87aa4', '#fff5e0', '#7a8cf0', '#8ccf6a'];

function texParede(base, ped = true) {
  return texFn(256, 256, (u, v) => {
    const row = Math.floor(v * 8), off = (row % 2) * 0.5, col = Math.floor((u * 6 + off)), j = (NV.noise(col * 3.1, row * 5.7) * 0.5 + 0.5);
    const gx = Math.abs(((u * 6 + off) % 1) - 0.5), gy = Math.abs(((v * 8) % 1) - 0.5), junta = (ped && (gx > 0.46 || gy > 0.44)) ? 0.55 : 1;
    const n = fbm(NV, u * 20, v * 20, 3) * 0.5 + 0.5, k = junta * (0.82 + 0.3 * j) * (0.9 + 0.18 * n);
    return [clamp(base[0] * k, 0, 255), clamp(base[1] * k, 0, 255), clamp(base[2] * k, 0, 255)];
  });
}
function texTelha(cor) {
  return texFn(256, 256, (u, v) => {
    const row = Math.floor(v * 12), off = (row % 2) * 0.5, fx = ((u * 10 + off) % 1), fy = (v * 12) % 1, sh = 0.7 + 0.45 * Math.sin(fx * Math.PI) * (0.6 + 0.4 * fy), n = 0.9 + 0.2 * (NV.noise(Math.floor(u * 10 + off) * 4.1, row * 3.3) * 0.5 + 0.5);
    return [clamp(cor[0] * sh * n, 0, 255), clamp(cor[1] * sh * n, 0, 255), clamp(cor[2] * sh * n, 0, 255)];
  });
}
function texPlaca() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 192; const g = cv.getContext('2d');
  g.fillStyle = '#12306a'; g.fillRect(0, 0, 512, 192); g.strokeStyle = '#ff8a1c'; g.lineWidth = 12; g.strokeRect(10, 10, 492, 172);
  g.fillStyle = '#ffffff'; g.font = '900 96px "DejaVu Sans Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HRYZ', 256, 82);
  g.fillStyle = '#ffb347'; g.font = '800 40px "DejaVu Sans Mono", monospace'; g.fillText('ANIMATION', 256, 150);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function casa(g, x, z, w, d, h, { cor = [230, 150, 110], telha = [215, 70, 45], rot = 0, pedra = false, gable = true, porta = '#2a9d8f' } = {}) {
  const gr = new THREE.Group(); gr.position.set(x, 0, z); gr.rotation.y = rot; g.add(gr);
  const tw = texParede(cor, pedra); tw.repeat.set(w / 3, h / 3);
  const par = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ map: tw, roughness: 0.95 })); par.position.y = h / 2; par.castShadow = true; par.receiveShadow = true; gr.add(par);
  if (gable) {                                                   // telhado de duas águas (cumeeira ao longo de x)
    const rise = Math.min(1.9, d * 0.32), tt = texTelha(telha), sh = new THREE.Shape(); sh.moveTo(-d / 2 - 0.35, 0); sh.lineTo(0, rise); sh.lineTo(d / 2 + 0.35, 0);
    for (const sg of [-1, 1]) {
      const len = Math.hypot(d / 2 + 0.35, rise), pl = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.1, len), new THREE.MeshStandardMaterial({ map: tt, roughness: 0.8 }));
      tt.repeat.set(w / 2.2, len / 1.2); pl.position.set(0, h + rise / 2 + 0.02, sg * (d / 4 + 0.17)); pl.rotation.x = sg * Math.atan2(rise, d / 2 + 0.35); pl.castShadow = true; pl.receiveShadow = true; gr.add(pl);
    }
    const frontao = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ map: tw, side: THREE.DoubleSide })); for (const sx of [-1, 1]) { const f = frontao.clone(); f.position.set(sx * (w / 2 - 0.01), h, 0); f.rotation.y = Math.PI / 2; gr.add(f); }
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.55, 0.14, 0.26), new THREE.MeshStandardMaterial({ color: 0xa8502e, roughness: 0.8 })); cap.position.set(0, h + rise + 0.09, 0); cap.castShadow = true; gr.add(cap);
    gr.userData.cumeeira = h + rise + 0.16;
  } else { const t = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.2, d + 0.3), new THREE.MeshStandardMaterial({ color: 0xd8c09a })); t.position.y = h + 0.1; t.castShadow = true; gr.add(t); }
  // portas e janelas (z+ é a frente voltada para a rua)
  const dr = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.1, 0.12), new THREE.MeshStandardMaterial({ color: porta, roughness: 0.6 })); dr.position.set(-w * 0.25, 1.05, d / 2 + 0.03); gr.add(dr);
  for (let i = 0; i < Math.max(1, Math.floor(w / 3.2)); i++) {
    const jn = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.1), new THREE.MeshStandardMaterial({ color: 0xffd060, emissive: 0xffa020, emissiveIntensity: 1.1 })); jn.position.set(-w / 2 + 1.5 + i * 2.9 + (i ? 0.6 : 1.2), h * 0.62, d / 2 + 0.04); gr.add(jn);
    const mol = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.2), new THREE.MeshStandardMaterial({ color: 0x3a7a3a })); mol.position.set(jn.position.x, h * 0.62 - 0.65, d / 2 + 0.1); gr.add(mol);
  }
  return gr;
}
export async function construirV(g) {
  // céu: sol baixo e grande, cores vivas
  g.add(criarCeu({ dir: [0.5, 0.3, -0.75], halo: 1.4 }));
  // rua de terra e calçadas
  const terra = texFn(256, 256, (u, v) => { const n = fbm(NV, u * 18, v * 18, 4) * 0.5 + 0.5; return [205 + 25 * n, 172 + 30 * n, 125 + 28 * n]; }); terra.repeat.set(30, 30);
  const rua = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshStandardMaterial({ map: terra, roughness: 1 })); rua.rotation.x = -Math.PI / 2; rua.receiveShadow = true; g.add(rua);
  // casa do herói (telhado com cumeeira em y = CUME.y): paredes de pedra, telhas terracota
  const H0 = casa(g, 0, 0, 9.4, 6.4, 3.4, { cor: [235, 190, 130], telha: [190, 96, 62], pedra: true, porta: '#1fa6a0' });
  // muro alto de pedra (ao lado, separado por um beco de 2,3 m)
  const tm = texParede([200, 150, 120], true); tm.repeat.set(8, 2);
  const muro = new THREE.Mesh(new THREE.BoxGeometry(MURO.x1 - MURO.x0, MURO.y, MURO.larg), new THREE.MeshStandardMaterial({ map: tm, roughness: 1 })); muro.position.set((MURO.x0 + MURO.x1) / 2, MURO.y / 2, 0); muro.castShadow = true; muro.receiveShadow = true; g.add(muro);
  const topoM = new THREE.Mesh(new THREE.BoxGeometry(MURO.x1 - MURO.x0, 0.1, MURO.larg + 0.12), new THREE.MeshStandardMaterial({ color: 0xe8c8a0 })); topoM.position.set((MURO.x0 + MURO.x1) / 2, MURO.y + 0.05, 0); topoM.castShadow = true; g.add(topoM);
  // vizinhos coloridos
  const rnd = mulberry32(9);
  const viz = [[-10.5, 0, 7, 6, 3.2, 0], [-19, -2, 8, 7, 4.2, 0.1], [-9, -16, 8, 6, 3.8, 0], [11, -14, 9, 6, 4.0, 0], [21, -3, 7, 6, 3.4, -0.08], [-4, 17, 9, 6, 3.4, Math.PI], [7, 17, 8, 6, 3.8, Math.PI], [-17, 16, 8, 6, 3.6, Math.PI], [19, 16, 9, 6, 3.6, Math.PI], [0, -22, 10, 6, 4.2, 0], [-26, 6, 8, 6, 4.0, 0.2], [29, 8, 8, 6, 3.6, -0.2]];
  viz.forEach(([x, z, w, d, h, rot], i) => {
    const c = new THREE.Color(cores[i % cores.length]); casa(g, x, z, w, d, h, { cor: [c.r * 255, c.g * 255, c.b * 255], telha: [i % 2 ? 190 : 170, i % 2 ? 100 : 110, i % 2 ? 66 : 72], rot, pedra: i % 3 === 0, porta: cores[(i + 3) % cores.length] });
  });
  // placa HRYZ pendurada na casa em frente (diegética, lê certo da rua)
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.98), new THREE.MeshStandardMaterial({ map: texPlaca(), roughness: 0.5, emissive: 0x222222 })); pl.position.set(0, 3.0, 14.1); pl.rotation.y = Math.PI; g.add(pl);
  const hast = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.6), new THREE.MeshStandardMaterial({ color: 0x2a1a10 })); hast.position.set(0, 3.55, 14.3); g.add(hast);
  // casas da biblioteca (com a caixa de correio Hryz) no fundo da rua
  try {
    const gl = new GLTFLoader(); const gs = await Promise.all(['casa2-b', 'casa4-b', 'casa1-b'].map(n => gl.loadAsync('../biblioteca3d/casas/' + n + '.glb')));
    [[-5, 30, Math.PI], [9, 30, Math.PI], [-18, 34, Math.PI]].forEach(([x, z, rot], i) => { const o = gs[i].scene.clone(true); o.position.set(x, 0, z); o.rotation.y = rot; o.scale.setScalar(1.15); o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; if (m.material) m.material.color && m.material.color.multiplyScalar(1.25); } }); g.add(o); });
  } catch (e) { console.log('sem casas glb', e.message); }
  // chaminé com fumaça (esferas translúcidas que sobem; posição depende do tempo, feita em planos.js)
  const fum = new THREE.Group(); g.add(fum);
  const matF = new THREE.MeshBasicMaterial({ color: 0xffe6c8, transparent: true, opacity: 0.35, depthWrite: false });
  const bolas = []; for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), matF.clone()); fum.add(b); bolas.push(b); }
  return { fum, bolas };
}
