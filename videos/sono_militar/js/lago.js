// O lago da imaginação: canoa parada na água calma sob a lua, margem escura, vaga-lumes e céu estrelado (a imagem mental do método).
import * as THREE from 'three';
import { brilho, canvasTex } from './motor.js';
import { Lote, M } from './lote.js';
import * as T from './texturas.js';
import * as X from './tex2.js';
import { mulberry32, clamp, lerp } from './util.js';

export const POS_L = [-100, 0, 0];
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

function criarCanoa() {
  const g = new THREE.Group(); g.name = 'canoa';
  const L = 3.5, N = 44, MM = 16, boca = 0.30;
  const pos = [], uv = [], idx = [];
  const perfil = i => { const u = i / N, s = Math.sin(Math.PI * u); return { z: (u - 0.5) * L, w: 0.42 * Math.pow(s, 0.72), dep: 0.27 * Math.pow(s, 0.55), lift: 0.22 * Math.pow(Math.abs(2 * u - 1), 3.2), u }; };
  for (let i = 0; i <= N; i++) {
    const p = perfil(i);
    for (let j = 0; j <= MM; j++) {
      const a = j / MM * Math.PI;
      pos.push(Math.cos(a) * p.w, boca + p.lift - Math.sin(a) * p.dep, p.z); uv.push(p.u * 3.4, j / MM);
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < MM; j++) { const a = i * (MM + 1) + j, b = a + 1, c = a + MM + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const tex = T.texMadeira('#8a5a34', '#3c2210', '#b98a5a'); tex.repeat.set(1, 1);
  const casco = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, side: THREE.DoubleSide })); casco.castShadow = true; casco.receiveShadow = true; g.add(casco);
  // bordas (talas) e bancos
  const mb = M(0x4b2e18, 0.6);
  for (const sg of [-1, 1]) {
    const pts = []; for (let i = 0; i <= N; i += 2) { const p = perfil(i); pts.push(new THREE.Vector3(sg * p.w, boca + p.lift, p.z)); }
    const tubo = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.02, 6, false), mb); tubo.castShadow = true; g.add(tubo);
  }
  for (const z of [-0.85, 0.85]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.035, 0.12), mb); b.position.set(0, boca - 0.01, z); b.castShadow = true; g.add(b); }
  const piso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.02, 2.2), M(0x6b4a2c, 0.8)); piso.position.set(0, 0.07, 0); piso.receiveShadow = true; g.add(piso);
  return g;
}

export function construirLago(mundo) {
  const g = new THREE.Group(); g.name = 'lago'; g.position.set(POS_L[0], 0, POS_L[2]); mundo.add(g);
  const d = { g, ox: POS_L[0], oz: POS_L[2] };
  // água: plano grande com ondulação animada no mapa (função do tempo)
  const ta = X.texAgua(); ta.repeat.set(60, 60);
  const normal = canvasTex(256, 256, (c, w, h) => { const r = mulberry32(21); c.fillStyle = '#8080ff'; c.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { const x = r() * w, y = r() * h, L = 14 + r() * 40; c.strokeStyle = `rgba(${120 + r() * 20 | 0},${120 + r() * 20 | 0},255,0.5)`; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + L / 2, y + (r() - 0.5) * 6, x + L, y); c.stroke(); } }, { repete: true, aniso: 8, srgb: false });
  normal.repeat.set(70, 70);
  const mAgua = new THREE.MeshStandardMaterial({ color: 0x3d5d92, map: ta, roughness: 0.22, metalness: 0.1, normalMap: normal, normalScale: new THREE.Vector2(0.5, 0.5), emissive: 0x0b1a36, emissiveIntensity: 1.0 });
  const agua = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), mAgua); agua.rotation.x = -Math.PI / 2; agua.receiveShadow = true; g.add(agua); d.agua = agua; d.mAgua = mAgua;
  // céu estrelado e lua
  const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 1024; const c = cv.getContext('2d');
  const gr = c.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, '#02040c'); gr.addColorStop(0.42, '#0b1634'); gr.addColorStop(0.5, '#2a4170'); gr.addColorStop(1, '#2a4170'); c.fillStyle = gr; c.fillRect(0, 0, 2048, 1024);
  const r = mulberry32(31);
  for (let i = 0; i < 1500; i++) { const y = Math.pow(r(), 1.5) * 500; c.fillStyle = `rgba(255,255,${220 + r() * 35 | 0},${0.25 + r() * 0.75})`; const s = r() < 0.06 ? 1.9 : 0.7 + r() * 0.7; c.beginPath(); c.arc(r() * 2048, y, s, 0, 6.3); c.fill(); }
  for (let i = 0; i < 160; i++) { const x = 600 + r() * 840, y = 60 + Math.sin(x / 280) * 80 + r() * 140; c.fillStyle = 'rgba(190,210,255,0.045)'; c.beginPath(); c.arc(x, y, 28 + r() * 60, 0, 6.3); c.fill(); }
  const tc = new THREE.CanvasTexture(cv); tc.colorSpace = THREE.SRGBColorSpace;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(320, 32, 20), new THREE.MeshBasicMaterial({ map: tc, side: THREE.BackSide, fog: false, depthWrite: false })); dome.renderOrder = -10; dome.frustumCulled = false; g.add(dome);
  d.luaPos = V(14, 112, -300);
  const lua = new THREE.Mesh(new THREE.CircleGeometry(13, 40), new THREE.MeshBasicMaterial({ color: 0xf3f6ff, fog: false })); lua.position.copy(d.luaPos); lua.lookAt(0, 0, 0); g.add(lua);
  const luaB = brilho('170,195,255', 150, 0.9); luaB.position.copy(d.luaPos).multiplyScalar(0.98); g.add(luaB);
  // caminho da lua na água (faixa brilhante cintilante)
  const trilha = new THREE.Mesh(new THREE.PlaneGeometry(26, 260), new THREE.MeshBasicMaterial({ map: canvasTex(64, 256, (cx, w, h) => { const gg = cx.createLinearGradient(0, 0, w, 0); gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(0.5, 'rgba(200,220,255,0.55)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); cx.fillStyle = gg; cx.fillRect(0, 0, w, h); const rr = mulberry32(9); for (let i = 0; i < 220; i++) { cx.fillStyle = `rgba(255,255,255,${rr() * 0.6})`; cx.fillRect(w * (0.2 + rr() * 0.6), rr() * h, 3 + rr() * 8, 1.2); } }), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  trilha.rotation.x = -Math.PI / 2; trilha.position.set(0, 0.03, -150); const gT = new THREE.Group(); gT.rotation.y = -Math.atan2(d.luaPos.x, -d.luaPos.z); gT.add(trilha); g.add(gT); d.trilha = trilha; trilha.material.opacity = 0.62;
  // margem escura com pinheiros (silhueta em anel)
  const sil = canvasTex(1024, 128, (cx, w, h) => { cx.clearRect(0, 0, w, h); cx.fillStyle = '#04070d'; const rr = mulberry32(6); let x = 0; cx.beginPath(); cx.moveTo(0, h); while (x < w) { const alt = 28 + rr() * 70 + 30 * Math.sin(x / 90); const lar = 6 + rr() * 12; cx.lineTo(x, h - alt * 0.4); cx.lineTo(x + lar / 2, h - alt); cx.lineTo(x + lar, h - alt * 0.4); x += lar; } cx.lineTo(w, h); cx.fill(); });
  const anel = new THREE.Mesh(new THREE.CylinderGeometry(210, 210, 26, 48, 1, true), new THREE.MeshBasicMaterial({ map: sil, transparent: true, side: THREE.BackSide, fog: false })); anel.position.y = 9; g.add(anel);
  // canoa
  d.canoa = criarCanoa(); g.add(d.canoa);
  // vaga-lumes
  d.vaga = []; const rf = mulberry32(14);
  for (let i = 0; i < 16; i++) { const s = brilho('220,255,150', 0.17, 0.0); s.userData = { x: (rf() - 0.5) * 9, y: 0.4 + rf() * 1.8, z: (rf() - 0.5) * 9, f: 0.4 + rf() * 0.8, ph: rf() * 6.3 }; g.add(s); d.vaga.push(s); }
  // luz: lua (sombra só na canoa) + hemisférica
  d.luar = new THREE.DirectionalLight(0xb5cdff, 3.0); d.luar.position.set(5, 14, -40); d.luar.target.position.set(0, 0.3, 0); g.add(d.luar, d.luar.target);
  d.luar.castShadow = true; d.luar.shadow.mapSize.set(1024, 1024); Object.assign(d.luar.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 5, far: 70 }); d.luar.shadow.bias = -0.0006; d.luar.shadow.normalBias = 0.03; d.luar.shadow.radius = 3;
  d.hemi = new THREE.HemisphereLight(0x405d96, 0x0b101c, 0.95); g.add(d.hemi);
  d.fill = new THREE.PointLight(0xffd8b0, 0.0, 6, 1.8); d.fill.position.set(1.2, 1.4, 1.6); g.add(d.fill);
  // movimento (função do tempo): a canoa balança e a água corre
  d.atualizar = (t, { canoa = true } = {}) => {
    ta.offset.set(t * 0.012, t * 0.007); normal.offset.set(-t * 0.010, t * 0.006);
    d.canoa.position.set(0, -0.07 + 0.012 * Math.sin(t * 1.1), 0);
    d.canoa.rotation.set(0.010 * Math.sin(t * 0.8 + 1), 0.015 * Math.sin(t * 0.3), 0.028 * Math.sin(t * 1.1));
    for (const s of d.vaga) { const u = s.userData; s.position.set(u.x + Math.sin(t * u.f + u.ph) * 0.9, u.y + Math.sin(t * u.f * 1.7 + u.ph) * 0.3, u.z + Math.cos(t * u.f * 0.8 + u.ph) * 0.9); s.material.opacity = Math.max(0, Math.sin(t * 3.0 * u.f + u.ph * 3)) ** 3 * 0.9; }
  };
  d.centro = V(POS_L[0], 0, POS_L[2]);
  return d;
}

// pessoa deitada de costas na canoa (cabeça para -Z), mãos atrás da cabeça, relaxada
export function deitadoCanoa(a, lago, t, { fase = 1 } = {}) {
  const c = lago.canoa;
  a.grupo.visible = true; a.grupo.rotation.order = 'YXZ';
  a.anim('Parado', t * 0.12);
  // posição do corpo no referencial da canoa (a canoa balança junto)
  const rot = c.rotation, pos = c.position;
  const loc = V(0, 0.17, 0.82);                                                // origem do grupo (pés) dentro da canoa
  const w = loc.clone().applyEuler(rot).add(pos).add(V(lago.ox, 0, lago.oz));
  a.grupo.position.copy(w); a.grupo.rotation.set(-Math.PI / 2 + rot.x, rot.y, rot.z);
  a.somar('Pescoco', 0.10, 0, 0); a.somar('Cabeca', 0.06, 0.05, 0.05);
  const b = Math.sin(t * 2 * Math.PI * 0.13);
  a.somar('Peito', 0.012 * b, 0, 0);
  a.somar('CoxaE', 0, 0.20, 0); a.somar('CoxaD', 0, -0.20, 0);
  a.rosto({ expressao: 'sorriso', forca: 0.10, piscar: 1, boca: 0.0 }); a.atualizarRosto();
  a.grupo.updateMatrixWorld(true);
  const cab = a.pos('Cabeca', V());
  for (const l of 'ED') { const sg = l === 'E' ? 1 : -1; a.ikBraco(l, V(cab.x + sg * 0.14, cab.y + 0.02, cab.z - 0.04), V(sg * 1, 0.1, 0.5)); }
}
