// Objetos de cena: cesto de roupa, caixa de entrega (com a etiqueta da marca), pé-de-cabra dos bombeiros, manta térmica prateada, poeira na luz.
import * as THREE from 'three';
import { canvasTex, brilho } from './motor.js';
import * as T from './texturas.js';
import { mulberry32 } from './util.js';

const M = (cor, rug = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: rug, ...extra });
const sombra = o => { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };

// cesto de roupa (plástico azul claro com frestas e toalhas); alças em g.userData.alcas = [local E, local D] (em metros, no sistema do grupo)
export function criarCesto() {
  const g = new THREE.Group(); g.name = 'cesto';
  const tex = canvasTex(128, 64, (c, w, h) => { c.fillStyle = '#7fb3d9'; c.fillRect(0, 0, w, h); c.fillStyle = '#5c93bd'; for (let y = 8; y < h; y += 14) for (let x = 6; x < w; x += 22) c.fillRect(x, y, 14, 5); }, { repete: true });
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, side: THREE.DoubleSide });
  const lado = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.25, 0.32, 4, 1, true), mat); lado.rotation.y = Math.PI / 4; lado.scale.set(1.0, 1, 0.78); lado.position.y = 0.16; g.add(lado);
  const fundo = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.02, 0.27), M(0x5c93bd, 0.6)); fundo.position.y = 0.01; g.add(fundo);
  const borda = new THREE.Mesh(new THREE.TorusGeometry(0.01, 0.01, 4, 4), mat); borda.visible = false; g.add(borda);
  for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.24), M(i % 2 ? 0xf1efe9 : 0xe4dccb, 0.95)); t.position.set((i - 1.5) * 0.015, 0.30 + i * 0.045, (i % 2 ? 0.012 : -0.01)); t.rotation.y = (i - 1.5) * 0.12; g.add(t); }
  g.userData.alcas = [new THREE.Vector3(-0.30, 0.30, 0), new THREE.Vector3(0.30, 0.30, 0)];
  return sombra(g);
}

// caixa de entrega de papelão com fita e etiqueta ("HRYZ ANIMATION · ENTREGA")
export function criarCaixaEntrega() {
  const g = new THREE.Group(); g.name = 'caixa';
  const papelao = M(0xffffff, 0.9, { map: T.texPapelao() });
  const c = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.32, 0.34), papelao); c.position.y = 0.16; g.add(c);
  const fita = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.003, 0.345), M(0xd6c18d, 0.4)); fita.position.set(0, 0.3215, 0); g.add(fita);
  const etq = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.15), new THREE.MeshStandardMaterial({ map: T.texEtiqueta(), roughness: 0.6 })); etq.position.set(0, 0.17, 0.171); g.add(etq);
  const etq2 = etq.clone(); etq2.position.set(0.231, 0.17, 0); etq2.rotation.y = Math.PI / 2; g.add(etq2);
  g.userData.alcas = [new THREE.Vector3(-0.235, 0.16, 0.02), new THREE.Vector3(0.235, 0.16, 0.02)];
  return sombra(g);
}

// pé-de-cabra (Halligan): comprimento 0,9 m ao longo de +Y a partir da origem (a ponta achatada em y = 0); g.userData.ponta = 0, g.userData.cabo = 0.9
export function criarBarra() {
  const g = new THREE.Group(); g.name = 'barra';
  const aco = M(0x8b9096, 0.35, { metalness: 0.85 });
  const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.80, 8), aco); haste.position.y = 0.40; g.add(haste);
  const ponta = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.006), aco); ponta.position.set(0, 0.02, 0); ponta.rotation.x = 0.02; g.add(ponta);
  const garra = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.12, 0.012), aco); garra.position.set(0, 0.86, 0.045); garra.rotation.x = -0.9; g.add(garra);
  const garra2 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.028), aco); garra2.position.set(0, 0.88, -0.02); garra2.rotation.x = 0.25; g.add(garra2);
  g.userData.ponta = 0; g.userData.cabo = 0.84;
  return sombra(g);
}

// manta térmica (prateada, amassada): casca aberta na frente em volta do tronco; é filha do osso Peito do ator
export function criarManta(ator, { larg = 1.0, folga = 0.0 } = {}) {
  const r = mulberry32(5);
  const g = new THREE.CylinderGeometry(0.185, 0.225, 0.62, 28, 10, true, Math.PI * 0.78, Math.PI * 1.44);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = Math.sin(x * 40 + y * 31) * 0.012 + Math.sin(z * 37 - y * 23) * 0.010; const l = Math.hypot(x, z) || 1; p.setXYZ(i, x + x / l * n, y, z + z / l * n); }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xd9dee5, metalness: 0.35, roughness: 0.42, emissive: 0x2a2f36, side: THREE.DoubleSide, flatShading: true }));
  m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
  m.rotation.y = Math.PI;                                  // abertura para a frente (+Z do personagem)
  m.scale.set(1.10 * larg, 1, 0.82 * larg);
  const peito = ator.ossos['Peito'];
  const gr = new THREE.Group(); gr.position.set(0, -0.20 / ator.escala + folga, -0.012); gr.add(m); gr.visible = false; gr.scale.setScalar(1 / ator.escala * ator.escala);
  peito.add(gr);
  return gr;
}

// poeira flutuando na luz: n pontos que derivam devagar; atualizar(t, k) com k = intensidade 0..1
export function criarPoeira(n = 36, caixa = [0.9, 1.6, 0.9], semente = 4) {
  const r = mulberry32(semente);
  const geo = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const tex = canvasTex(32, 32, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,240,210,1)'); gr.addColorStop(1, 'rgba(255,240,210,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
  const mat = new THREE.PointsMaterial({ map: tex, size: 0.018, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, color: 0xfff0d0 });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
  const base = Array.from({ length: n }, () => [r() - 0.5, r(), r() - 0.5, r() * 6.28, 0.2 + r() * 0.5]);
  pts.userData.atualizar = (t, k, centro) => {
    for (let i = 0; i < n; i++) {
      const [bx, by, bz, f, v] = base[i];
      pos[i * 3] = centro.x + bx * caixa[0] + Math.sin(t * 0.3 * v + f) * 0.08;
      pos[i * 3 + 1] = centro.y + ((by + t * 0.012 * v) % 1) * caixa[1];
      pos[i * 3 + 2] = centro.z + bz * caixa[2] + Math.cos(t * 0.27 * v + f) * 0.08;
    }
    geo.attributes.position.needsUpdate = true; mat.opacity = 0.75 * k;
  };
  return pts;
}

// celular (retângulo escuro com tela acesa) para o entregador
export function criarCelular() {
  const g = new THREE.Group(); g.name = 'celular';
  const c = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.145, 0.009), M(0x0d0e12, 0.3, { metalness: 0.5 })); g.add(c);
  const t = new THREE.Mesh(new THREE.PlaneGeometry(0.063, 0.13), new THREE.MeshBasicMaterial({ color: 0x7fb0ff })); t.position.z = 0.0051; g.add(t);
  return sombra(g);
}
