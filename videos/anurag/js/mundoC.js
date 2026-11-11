// Mundo C: o cemitério num dia nublado: caminho de cascalho até a capela, lápides, árvores, tenda, multidão de luto, caixões com flores.
import * as THREE from 'three';
import { Kit } from '../../biblioteca3d/cidade/kit.js';
import { mundos, canvasTex, sombras } from './motor.js';
import { mulberry32 } from './util.js';

const M = (cor, rug = 0.9, extra = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: rug, ...extra });

function texturaGrama() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#586651'; g.fillRect(0, 0, w, h);
    const r = mulberry32(5);
    for (let i = 0; i < 3500; i++) { const v = r(); g.fillStyle = v < 0.5 ? 'rgba(80,98,70,0.45)' : 'rgba(110,126,96,0.35)'; g.fillRect(r() * w, r() * h, 2 + r() * 3, 1 + r() * 3); }
  }, { repete: true, aniso: 8 });
}
function texturaCascalho() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#a6a39b'; g.fillRect(0, 0, w, h);
    const r = mulberry32(9);
    for (let i = 0; i < 2600; i++) { const v = 120 + r() * 90; g.fillStyle = `rgba(${v},${v - 4},${v - 10},0.7)`; g.beginPath(); g.arc(r() * w, r() * h, 1 + r() * 2.6, 0, 6.3); g.fill(); }
  }, { repete: true, aniso: 8 });
}
function texturaCeu() {
  return canvasTex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6f7a86'); gr.addColorStop(0.6, '#a7b0b9'); gr.addColorStop(1, '#cfd5da');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = mulberry32(2);
    for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h * 0.7, rad = 20 + r() * 40; const rg = g.createRadialGradient(x, y, 0, x, y, rad); rg.addColorStop(0, 'rgba(255,255,255,0.10)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, w, h); }
  });
}

export function criarCaixao(madeira, tampa, cor_flor = '#f4f2ee') {
  const g = new THREE.Group();
  const pts = [[-0.21, -1.0], [0.21, -1.0], [0.33, 0.28], [0.23, 1.0], [-0.23, 1.0], [-0.33, 0.28]];
  const shape = new THREE.Shape(); pts.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y)); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.46, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.035, bevelSegments: 3 });
  geo.rotateX(-Math.PI / 2); geo.translate(0, 0.0, 0);
  const corpo = new THREE.Mesh(geo, M(madeira, 0.42, { metalness: 0.05 })); corpo.castShadow = true; corpo.receiveShadow = true; corpo.position.y = 0.0; g.add(corpo);
  // geometria extrudada em y de 0 a 0.46 (+ bisel); tampa menor por cima
  const s2 = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s2.lineTo(x * 0.88, y * 0.94) : s2.moveTo(x * 0.88, y * 0.94)); s2.closePath();
  const g2 = new THREE.ExtrudeGeometry(s2, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3 }); g2.rotateX(-Math.PI / 2);
  const lid = new THREE.Mesh(g2, M(tampa, 0.35, { metalness: 0.08 })); lid.position.y = 0.50; lid.castShadow = true; g.add(lid);
  // alças prateadas
  const metal = M(0xc8ccd3, 0.25, { metalness: 0.9 });
  g.userData.alcas = [];
  for (const sx of [-1, 1]) for (const z of [-0.55, 0.0, 0.55]) {
    const x = sx * (0.31 + 0.10 * (z === 0 ? 0.45 : (z > 0 ? 0.0 : 0.3)) + 0.03);
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.13, 4, 8), metal); a.rotation.x = Math.PI / 2; a.position.set(sx * (0.345 - (z > 0.4 ? 0.04 : 0) - (z < -0.4 ? 0.07 : 0)), 0.26, z); g.add(a); g.userData.alcas.push(a);
  }
  // arranjo de flores sobre a tampa
  const rnd = mulberry32(Math.floor(parseInt(madeira.toString().slice(1, 7) || '1', 16) % 997));
  const flor = new THREE.Group(); flor.position.set(0, 0.60, 0.1); g.add(flor);
  const cores = [cor_flor, '#f4f2ee', '#e9b8c4', '#ffffff'];
  for (let i = 0; i < 26; i++) {
    const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05 + rnd() * 0.035, 1), M(cores[Math.floor(rnd() * cores.length)], 0.6));
    f.position.set((rnd() - 0.5) * 0.36, rnd() * 0.07, (rnd() - 0.5) * 0.8); f.castShadow = true; flor.add(f);
  }
  for (let i = 0; i < 14; i++) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.07), M(0x3a5a3a, 0.8, { side: THREE.DoubleSide }));
    l.position.set((rnd() - 0.5) * 0.4, -0.01, (rnd() - 0.5) * 0.9); l.rotation.set(-Math.PI / 2 + (rnd() - 0.5) * 0.5, rnd() * 3, 0); flor.add(l);
  }
  g.userData.altura = 0.62;
  return g;
}

export async function construirC() {
  const C = mundos.C;
  const kit = await Kit.carregar('../biblioteca3d/cidade/');
  const dados = { multidao: null };
  const r = mulberry32(21);
  // céu e chão
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(450, 24, 16), new THREE.MeshBasicMaterial({ map: texturaCeu(), side: THREE.BackSide, fog: false, depthWrite: false })); ceu.renderOrder = -10; ceu.frustumCulled = false; C.add(ceu); dados.ceu = ceu;
  const tg = texturaGrama(); tg.repeat.set(70, 70);
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), new THREE.MeshStandardMaterial({ map: tg, roughness: 1 })); chao.rotation.x = -Math.PI / 2; chao.position.set(0, 0, -40); chao.receiveShadow = true; C.add(chao);
  const tc = texturaCascalho(); tc.repeat.set(1, 60);
  const caminho = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 130), new THREE.MeshStandardMaterial({ map: tc, roughness: 1 })); caminho.rotation.x = -Math.PI / 2; caminho.position.set(0, 0.012, -48); caminho.receiveShadow = true; C.add(caminho);
  for (const sx of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 130), M(0xb7b4ad, 0.9)); b.position.set(sx * 1.45, 0.03, -48); b.receiveShadow = true; C.add(b); }

  // lápides em fileiras dos dois lados do caminho
  const matLap = [M(0x8a8c90, 0.9), M(0x777a80, 0.9), M(0x9a9b9a, 0.9), M(0x6c6e72, 0.9)];
  const geoLap = new THREE.BoxGeometry(0.55, 0.85, 0.12), geoTopo = new THREE.CylinderGeometry(0.275, 0.275, 0.12, 14, 1, false, 0, Math.PI); geoTopo.rotateX(Math.PI / 2); geoTopo.rotateZ(0);
  for (let z = -86; z < 16; z += 3.2) {
    for (const sx of [-1, 1]) for (let k = 0; k < 7; k++) {
      const x = sx * (5.0 + k * 3.0 + r() * 0.6); const zz = z + (r() - 0.5) * 0.8;
      const m = matLap[Math.floor(r() * matLap.length)];
      const l = new THREE.Mesh(geoLap, m); l.position.set(x, 0.42, zz); l.rotation.y = (r() - 0.5) * 0.18 + Math.PI / 2 * 0 + (sx > 0 ? 0 : 0); l.rotation.z = (r() - 0.5) * 0.05; l.castShadow = true; l.receiveShadow = true; C.add(l);
      const t = new THREE.Mesh(geoTopo, m); t.position.set(x, 0.85, zz); t.rotation.copy(l.rotation); t.castShadow = true; C.add(t);
      if (r() < 0.28) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12 + r() * 0.06, 1), M(['#d96a6a', '#f2ecd8', '#c58ad9', '#e8c35a'][Math.floor(r() * 4)], 0.7)); f.position.set(x, 0.12, zz + 0.38); C.add(f); }
    }
  }
  // árvores do kit, dispersas
  const nomes = ['arvore-frondosa', 'arvore-cipreste', 'arvore-redonda', 'arvore-pinheiro'];
  const base = await Promise.all(nomes.map(n => kit.peca(n)));
  for (let i = 0; i < 46; i++) {
    const o = base[Math.floor(r() * nomes.length)].clone(true), sx = r() < 0.5 ? -1 : 1;
    o.position.set(sx * (9 + r() * 55), 0, -95 + r() * 120); o.scale.setScalar(1.3 + r() * 0.9); o.rotation.y = r() * 6.28; sombras(o, true, false); C.add(o);
  }
  // capela ao fundo (fim do caminho): nave, torre com sino e cruz
  const cap = new THREE.Group(); cap.position.set(0, 0, -98); C.add(cap);
  const parede = M(0xd8d4cb, 0.95), tel = M(0x3a3c42, 0.9), porta = M(0x4a2f20, 0.8);
  const cx = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; cap.add(m); return m; };
  cx(11, 6.5, 16, parede, 0, 3.25, 0);
  const fo = new THREE.Shape(); fo.moveTo(-6.0, 0); fo.lineTo(6.0, 0); fo.lineTo(0, 3.6); fo.closePath();
  const gt = new THREE.ExtrudeGeometry(fo, { depth: 17.4, bevelEnabled: false }); gt.translate(0, 0, -8.7); const telh = new THREE.Mesh(gt, tel); telh.position.y = 6.5; telh.castShadow = true; cap.add(telh);
  cx(5, 12, 5, parede, 0, 6, 8.0);                                   // torre (do lado do caminho, +Z)
  const py = new THREE.Mesh(new THREE.ConeGeometry(4.0, 5, 4), tel); py.rotation.y = Math.PI / 4; py.position.set(0, 14.5, 8.0); cap.add(py);
  cx(0.18, 2.4, 0.18, M(0xcfcfcf), 0, 17.9, 8.0); cx(1.2, 0.18, 0.18, M(0xcfcfcf), 0, 18.4, 8.0);
  cx(2.0, 3.2, 0.2, porta, 0, 1.6, 10.55); cx(2.4, 0.3, 0.3, parede, 0, 3.35, 10.6);
  cx(1.0, 1.9, 0.2, M(0x2a3550, 0.4), 0, 8.4, 10.55);
  for (const sx of [-1, 1]) for (const z of [-4, 2]) cx(0.2, 2.0, 1.1, M(0x2a3550, 0.4), sx * 5.55, 3.4, z);
  dados.capela = cap;

  // tenda do sepultamento (atrás das câmeras, no fim do caminho): postes, teto e arranjos de flores; mais alguns arranjos ao longo do caminho para dar cor
  const tenda = new THREE.Group(); tenda.position.set(0, 0, 30); C.add(tenda);
  for (const [x, z] of [[-3.2, -2.4], [3.2, -2.4], [-3.2, 2.4], [3.2, 2.4]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.7, 8), M(0xbfc2c6, 0.4, { metalness: 0.7 })); p.position.set(x, 1.35, z); p.castShadow = true; tenda.add(p); }
  const teto = new THREE.Mesh(new THREE.ConeGeometry(5.4, 1.0, 4), M(0x2b2d33, 0.95)); teto.rotation.y = Math.PI / 4; teto.position.y = 3.15; teto.castShadow = true; tenda.add(teto);
  const tapete = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 5.0), M(0x32503a, 1)); tapete.rotation.x = -Math.PI / 2; tapete.position.y = 0.02; tapete.receiveShadow = true; tenda.add(tapete);
  for (const [x, z, c] of [[-3.0, -1.8, '#f4f2ee'], [3.0, -1.6, '#e8b3c1'], [-2.8, 2.0, '#ffffff'], [2.9, 1.8, '#f4f2ee']]) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.9, 10), M(0x2c2c30, 0.6)); base.position.set(x, 0.45, z); tenda.add(base);
    for (let i = 0; i < 18; i++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1 + r() * 0.05, 1), M(c, 0.6)); f.position.set(x + (r() - 0.5) * 0.7, 1.05 + r() * 0.45, z + (r() - 0.5) * 0.7); f.castShadow = true; tenda.add(f); }
  }
  for (const [x, z, cor] of [[-2.1, 11.0, '#f4f2ee'], [2.2, 13.5, '#e8b3c1'], [-2.3, 5.5, '#ffffff'], [2.1, 2.0, '#f4f2ee'], [-2.0, -2.5, '#e8b3c1']]) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.19, 0.85, 10), M(0x2c2c30, 0.6)); base.position.set(x, 0.43, z); C.add(base);
    for (let i = 0; i < 18; i++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1 + r() * 0.05, 1), M(cor, 0.6)); f.position.set(x + (r() - 0.5) * 0.6, 1.0 + r() * 0.42, z + (r() - 0.5) * 0.6); f.castShadow = true; C.add(f); }
  }
  dados.tenda = tenda;

  // multidão de luto (silhuetas baratas em instâncias): corpo, cabeça e cor de roupa
  const nM = 90;
  const corpo = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.26, 1.15, 10), new THREE.MeshStandardMaterial({ roughness: 0.9 }), nM);
  const cab = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshStandardMaterial({ roughness: 0.8 }), nM);
  const tonsRoupa = ['#17181d', '#1f2127', '#101215', '#242831', '#2c2430'], tonsPele = ['#d9a883', '#b07a54', '#8a5a3c', '#edc7a5', '#c68e69'];
  const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), c1 = new THREE.Color();
  dados.pessoas = [];
  const protegidos = [[3.3, -4.2], [-3.2, -8.2], [3.7, -12.5], [-3.4, -3.0]];                  // onde ficam as pessoas dos close-ups (e as câmeras): sem figurantes por perto
  for (let i = 0; i < nM; i++) {
    let lado, x, z, esc;
    do { lado = r() < 0.5 ? -1 : 1; x = lado * (2.3 + r() * 3.4); z = -32 + r() * 38; esc = 0.92 + r() * 0.2; } while (protegidos.some(([px, pz]) => Math.hypot(x - px, z - pz) < 2.5));
    dados.pessoas.push({ x, z, esc, fase: r() * 6.28, lado, altura: 1.0 + 0.0 });
    corpo.setColorAt(i, c1.set(tonsRoupa[Math.floor(r() * tonsRoupa.length)])); cab.setColorAt(i, c1.set(tonsPele[Math.floor(r() * tonsPele.length)]));
  }
  corpo.frustumCulled = false; cab.frustumCulled = false; corpo.castShadow = true; C.add(corpo, cab);
  dados.corpoMult = corpo; dados.cabMult = cab;
  dados.animarMultidao = t => {
    for (let i = 0; i < nM; i++) {
      const p = dados.pessoas[i], sway = Math.sin(t * 0.9 + p.fase) * 0.012;
      q.setFromEuler(new THREE.Euler(0, p.lado > 0 ? -1.2 : 1.2, sway));
      mm.compose(new THREE.Vector3(p.x, 0.575 * p.esc + 0.0, p.z), q, new THREE.Vector3(p.esc, p.esc, p.esc)); corpo.setMatrixAt(i, mm);
      mm.compose(new THREE.Vector3(p.x, 1.28 * p.esc + 0.0, p.z), q, new THREE.Vector3(p.esc, p.esc, p.esc)); cab.setMatrixAt(i, mm);
    }
    corpo.instanceMatrix.needsUpdate = true; cab.instanceMatrix.needsUpdate = true;
  };
  dados.animarMultidao(0);

  // luz nublada: hemisfério frio + direcional suave com sombra
  const hemi = new THREE.HemisphereLight(0xd5dbe2, 0x59604f, 1.35); C.add(hemi);
  const sol = new THREE.DirectionalLight(0xffffff, 0.95); sol.position.set(-12, 22, 10); sol.castShadow = true; sol.shadow.mapSize.set(1024, 1024);
  Object.assign(sol.shadow.camera, { left: -14, right: 14, top: 12, bottom: -12, near: 1, far: 80 }); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.04; sol.shadow.radius = 3;
  C.add(sol, sol.target); dados.sol = sol;
  return dados;
}
export function focoC(d, x, z) { d.sol.position.set(x - 12, 22, z + 10); d.sol.target.position.set(x, 0, z); d.sol.target.updateMatrixWorld(); }
