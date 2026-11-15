// Igrejinha colonial de cidade pequena (fachada branca, torre com sino, telhado vermelho, porta de madeira em arco) e a praça com chão de laje.
import * as THREE from 'three';
import { mulberry32 } from './util.js';
import { detalhar, criarReflexoPocas } from './detalhe.js';
import { brilho } from './motor.js';

function texMadeira() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d'); g.fillStyle = '#6a3d1c'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#5d3517' : '#744420'; g.fillRect(i * 128 + 2, 0, 124, 512); for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(30,12,4,${0.1 + 0.2 * Math.random()})`; g.lineWidth = 1 + 2 * Math.random(); g.beginPath(); const x = i * 128 + 8 + Math.random() * 110; g.moveTo(x, 0); g.bezierCurveTo(x + 6, 170, x - 6, 340, x + 3, 512); g.stroke(); } }
  g.fillStyle = '#1c1410'; for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) { g.beginPath(); g.arc(i * 128 + 64, 40 + j * 62, 5, 0, 7); g.fill(); }
  g.fillStyle = '#2a2420'; g.fillRect(0, 90, 512, 14); g.fillRect(0, 400, 512, 14);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 1.9, 1 / 3.4); t.offset.set(0.5, 0); t.anisotropy = 8; return t;
}

const mat = (cor, r = 0.9, extra = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: r, ...extra });
const caixa = (w, h, d, m, x, y, z, pai) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; pai.add(o); return o; };

// arco (vão) como forma: retângulo + semicírculo; extrude fina
function arco(w, h, prof, m) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-w / 2, h - w / 2); s.absarc(0, h - w / 2, w / 2, Math.PI, 0, true); s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0);
  const o = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: prof, bevelEnabled: false }), m); return o;
}
export function criarIgreja({ janelaLuz = true } = {}) {
  const g = new THREE.Group(), branco = detalhar(mat(0xf2ece0, 0.95), 'parede'), telha = detalhar(mat(0xc4442c, 0.75), 'telhado'), pedra = detalhar(mat(0xcfc4b0, 0.95), 'parede'), madeira = mat(0x6a3d1c, 0.8), vidro = new THREE.MeshStandardMaterial({ color: 0xffd88a, emissive: 0xffa83a, emissiveIntensity: 1.5, roughness: 0.3 });
  // nave (corpo principal) e telhado de duas águas
  caixa(7, 5, 11, branco, 0, 2.5, 0, g);
  const telhado = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 4.4, 2.3, 4, 1), telha); telhado.rotation.y = Math.PI / 4; telhado.scale.set(1.04, 1, 1.5); telhado.position.set(0, 6.1, 0); telhado.castShadow = true; g.add(telhado);
  // fachada com frontão triangular (em +z)
  const fr = new THREE.Shape(); fr.moveTo(-3.5, 0); fr.lineTo(3.5, 0); fr.lineTo(3.5, 5); fr.lineTo(0, 7.4); fr.lineTo(-3.5, 5); fr.lineTo(-3.5, 0);
  const fach = new THREE.Mesh(new THREE.ExtrudeGeometry(fr, { depth: 0.5, bevelEnabled: false }), branco); fach.position.set(0, 0, 5.5); fach.castShadow = true; g.add(fach);
  // porta em arco, moldura de pedra e degraus
  const mold = arco(2.5, 3.9, 0.12, pedra); mold.position.set(0, 0, 6.02); g.add(mold);
  const porta = arco(1.9, 3.4, 0.14, new THREE.MeshStandardMaterial({ map: texMadeira(), roughness: 0.75 })); porta.position.set(0, 0, 6.07); g.add(porta);
  for (let i = 0; i < 3; i++) { const topo = 0.18 * (3 - i); caixa(4.2 + i * 0.8, topo, 1.0, pedra, 0, topo / 2, 6.55 + i * 0.95, g); }
  // janelas redondas e altas acesas
  for (const sx of [-2.5, 2.5]) { const j = arco(0.9, 2.2, 0.1, vidro); j.position.set(sx, 1.6, 6.03); g.add(j); const mj = arco(1.1, 2.4, 0.06, pedra); mj.position.set(sx, 1.5, 6.0); g.add(mj); }
  const oculo = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), vidro); oculo.rotation.x = Math.PI / 2; oculo.position.set(0, 5.4, 6.0); g.add(oculo);
  // travessas de pedra nas janelas e lampiões ao lado da porta
  for (const sx of [-2.5, 2.5]) { caixa(0.06, 2.2, 0.07, pedra, sx, 2.7, 6.1, g); caixa(0.9, 0.05, 0.07, pedra, sx, 3.1, 6.1, g); }
  for (const sx of [-1.8, 1.8]) { const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.34, 0.2), new THREE.MeshStandardMaterial({ color: 0xffd58a, emissive: 0xffa030, emissiveIntensity: 2.0 })); lamp.position.set(sx, 3.3, 6.2); g.add(lamp); const b = brilho('255,196,110', 1.4, 0.95); b.position.set(sx, 3.3, 6.3); g.add(b); caixa(0.04, 0.5, 0.04, pedra, sx, 3.65, 6.1, g); }
  // cruz no frontão
  caixa(0.18, 1.2, 0.18, pedra, 0, 8.0, 5.8, g); caixa(0.7, 0.18, 0.18, pedra, 0, 8.25, 5.8, g);
  // torre do sino ao lado (em x=+4.5), com abertura em arco, sino e cúpula
  caixa(2.6, 9, 2.6, branco, 4.8, 4.5, 5.6, g);
  const abertura = arco(1.2, 2.2, 0.1, mat(0x1a1410, 1)); abertura.position.set(4.8, 6.4, 6.93); g.add(abertura);
  const pivo = new THREE.Group(); pivo.position.set(4.8, 7.45, 5.6); g.add(pivo); const sino = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.42, 0.7, 16), mat(0xc8962a, 0.35, { metalness: 0.7 })); sino.position.y = -0.35; pivo.add(sino); const badalo = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(0x3a2a14, 0.5, { metalness: 0.6 })); badalo.position.y = -0.74; pivo.add(badalo); g.userData.sino = pivo;
  const cupula = new THREE.Mesh(new THREE.ConeGeometry(2.0, 2.6, 4), telha); cupula.rotation.y = Math.PI / 4; cupula.position.set(4.8, 10.3, 5.6); cupula.castShadow = true; g.add(cupula);
  caixa(0.14, 0.9, 0.14, pedra, 4.8, 12.0, 5.6, g); caixa(0.5, 0.14, 0.14, pedra, 4.8, 12.2, 5.6, g);
  return g;
}
// placa pequena "IGLESIA HRYZ" fica fora; esta função cria a praça: chão de laje, banco e postes de lâmpada quente
export function criarPraca({ lajes = true } = {}) {
  const g = new THREE.Group();
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(60, 60, 1, 1), detalhar(new THREE.MeshStandardMaterial({ color: 0x6b6f84, roughness: 0.3, metalness: 0.08 }), 'calcada')); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; chao.name = 'ChaoPraca'; g.add(chao);
  g.add(criarReflexoPocas({ largura: 60, comprimento: 60, centro: [0, 0, 0], molhado: 0.45, intens: 1.1 }));
  return g;
}
