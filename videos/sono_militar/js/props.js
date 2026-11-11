// Objetos de cena: fuzil (com luneta opcional), binóculo, lata e comprimidos, cantil, cronômetro, cobertor, travesseiro.
import * as THREE from 'three';
import { canvasTex } from './motor.js';
import { mulberry32 } from './util.js';

const M = (c, r = 0.8, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...x });
const sombra = o => { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };

// fuzil: cano ao longo de +Z (boca em z ≈ +0,62), origem na empunhadura; userData.mao1 (empunhadura), mao2 (guarda-mão) em coordenadas locais
export function criarFuzil(luneta = false) {
  const g = new THREE.Group(); g.name = 'fuzil';
  const madeira = M(0x6a4a2a, 0.55), aco = M(0x2b2e31, 0.4, { metalness: 0.7 });
  const coronha = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.12, 0.34), madeira); coronha.position.set(0, -0.02, -0.28); coronha.rotation.x = 0.10; g.add(coronha);
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.075, 0.38), madeira); corpo.position.set(0, 0.0, 0.10); g.add(corpo);
  const cano = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.58, 10), aco); cano.rotation.x = Math.PI / 2; cano.position.set(0, 0.025, 0.40); g.add(cano);
  const guarda = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.34), madeira); guarda.position.set(0, 0.0, 0.34); g.add(guarda);
  const ferrolho = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8), aco); ferrolho.rotation.z = Math.PI / 2; ferrolho.position.set(0.05, 0.04, 0.02); g.add(ferrolho);
  if (luneta) {
    const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.34, 14), aco); tubo.rotation.x = Math.PI / 2; tubo.position.set(0, 0.095, 0.0); g.add(tubo);
    const lente = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.026, 0.05, 14), aco); lente.rotation.x = Math.PI / 2; lente.position.set(0, 0.095, 0.185); g.add(lente);
    const vidro = new THREE.Mesh(new THREE.CircleGeometry(0.027, 14), new THREE.MeshBasicMaterial({ color: 0x7fb0ff })); vidro.position.set(0, 0.095, 0.211); g.add(vidro);
  }
  g.userData.mao1 = new THREE.Vector3(0, -0.01, 0.0); g.userData.mao2 = new THREE.Vector3(0, -0.035, 0.21); g.userData.olho = new THREE.Vector3(0, 0.115, -0.27);
  return sombra(g);
}
export function criarBinoculo() {
  const g = new THREE.Group(); g.name = 'binoculo';
  const m = M(0x1e2124, 0.5, { metalness: 0.4 });
  for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.034, 0.16, 14), m); t.rotation.x = Math.PI / 2; t.position.set(sx * 0.036, 0, 0); g.add(t); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.030, 0.02, 14), m); l.rotation.x = Math.PI / 2; l.position.set(sx * 0.036, 0, 0.09); g.add(l); }
  const ponte = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.06), m); ponte.position.z = -0.01; g.add(ponte);
  g.userData.maoE = new THREE.Vector3(-0.06, -0.02, 0.0); g.userData.maoD = new THREE.Vector3(0.06, -0.02, 0.0);
  return sombra(g);
}
// lata de comprimidos (sem marca: texto genérico) com tampa aberta e uma pilha de comprimidos
export function criarLata() {
  const g = new THREE.Group(); g.name = 'lata';
  const rotulo = canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#c8c1a2'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a2418'; c.textAlign = 'center'; c.font = 'bold 26px "DejaVu Sans", sans-serif'; c.fillText('COMPRIMIDOS', w / 2, 30); c.font = '16px "DejaVu Sans", sans-serif'; c.fillText('1 A CADA 6 HORAS', w / 2, 52); });
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.050, 32, 1, true), new THREE.MeshStandardMaterial({ map: rotulo, roughness: 0.5, metalness: 0.3 })); corpo.position.y = 0.025; g.add(corpo);
  const fundo = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.004, 32), M(0x9a9a8a, 0.4, { metalness: 0.7 })); fundo.position.y = 0.002; g.add(fundo);
  const tampa = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.012, 32), M(0xa8a898, 0.35, { metalness: 0.7 })); tampa.position.set(0.10, 0.006, 0.03); tampa.rotation.set(0.04, 0, 0.1); g.add(tampa);
  const r = mulberry32(3);
  const pil = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.0042, 0.011, 3, 8), M(0xf1ecdc, 0.6), 60);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < 60; i++) { const a = r() * 6.28, rad = Math.sqrt(r()) * 0.052; e.set(r() * 3, r() * 3, r() * 3); q.setFromEuler(e); m4.compose(new THREE.Vector3(Math.cos(a) * rad, 0.009 + r() * 0.012, Math.sin(a) * rad), q, new THREE.Vector3(1, 1, 1)); pil.setMatrixAt(i, m4); }
  g.add(pil);
  return sombra(g);
}
// comprimidos soltos (n) para a mão: posições locais fixas em torno da origem
export function criarComprimidos(n = 5) {
  const g = new THREE.Group();
  const r = mulberry32(8);
  for (let i = 0; i < n; i++) { const p = new THREE.Mesh(new THREE.CapsuleGeometry(0.0045, 0.012, 3, 8), M(0xf1ecdc, 0.5)); p.position.set((r() - 0.5) * 0.03, 0.004, (r() - 0.5) * 0.03); p.rotation.set(r() * 3, r() * 3, r() * 3); p.castShadow = true; g.add(p); }
  return g;
}
export function criarCantil() {
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 20), M(0x9a9060, 0.8)); c.rotation.x = Math.PI / 2; c.scale.set(1, 1, 1.0); g.add(c);
  const bo = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.04, 12), M(0x2e3033, 0.4, { metalness: 0.6 })); bo.position.set(0, 0.075, 0); g.add(bo);
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.014, 12), M(0x1a1a1a, 0.6)); t.position.set(0, 0.10, 0); g.add(t);
  return sombra(g);
}
// cronômetro com mostrador desenhado (mm:ss)
export function criarCronometro() {
  const g = new THREE.Group();
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; const c = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.016, 28), M(0xb8b8b0, 0.3, { metalness: 0.8 })); corpo.rotation.x = Math.PI / 2; g.add(corpo);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.033, 28), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 })); face.position.z = 0.0085; g.add(face);
  const botao = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.014, 10), M(0xc9c9bd, 0.3, { metalness: 0.8 })); botao.position.set(0, 0.044, 0); g.add(botao);
  g.userData.mostrar = seg => {
    c.fillStyle = '#efe9d6'; c.fillRect(0, 0, 256, 256);
    c.strokeStyle = '#222'; c.lineWidth = 6; c.beginPath(); c.arc(128, 128, 118, 0, 6.3); c.stroke();
    for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283, big = i % 5 === 0; c.lineWidth = big ? 5 : 2; c.beginPath(); c.moveTo(128 + Math.sin(a) * 108, 128 - Math.cos(a) * 108); c.lineTo(128 + Math.sin(a) * (big ? 92 : 100), 128 - Math.cos(a) * (big ? 92 : 100)); c.stroke(); }
    c.fillStyle = '#222'; c.font = 'bold 44px "DejaVu Sans Mono", monospace'; c.textAlign = 'center'; const mm = Math.floor(seg / 60), ss = Math.floor(seg % 60);
    c.fillText(`${mm}:${String(ss).padStart(2, '0')}`, 128, 168);
    const a = (seg % 60) / 60 * 6.283; c.strokeStyle = '#a02020'; c.lineWidth = 5; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.sin(a) * 90, 128 - Math.cos(a) * 90); c.stroke();
    tex.needsUpdate = true;
  };
  g.userData.mostrar(0);
  return sombra(g);
}
export function criarCobertor(cor = 0x4a5a78) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(1.6, 0.16, 1.2, 24, 3, 18);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, p.getY(i) * (1 - 0.28 * Math.abs(x) / 0.8 * 0.6) + 0.04 * Math.sin(x * 4 + z * 3) * (p.getY(i) > 0 ? 1 : 0) + 0.05 * Math.exp(-((x * 1.2) ** 2 + (z * 1.8) ** 2))); }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, M(cor, 0.95)); g.add(m);
  return sombra(g);
}
