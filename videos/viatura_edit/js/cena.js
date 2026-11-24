// CENÁRIO do edit: rua à noite (asfalto molhado com faixas, calçadas, prédios com janelas acesas, postes de sódio, letreiro de neon HRYZ) e luzes de cinema
// que acompanham a câmera (contraluz frio e quente), para o herói sempre ter contorno.
import * as THREE from 'three';
import { criarCeuMalha, criarAmbiente } from '../../biblioteca3d/veiculos/policia/viatura.js';

const rng = seed => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

function texAsfalto() {
  const c = canvas(512, 1024), g = c.getContext('2d'), R = rng(7);                                              // 14 m de largura x 16 m de comprimento
  g.fillStyle = '#26282d'; g.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 90000; i++) { const v = 22 + R() * 46; g.fillStyle = `rgba(${v},${v},${v + 4},0.5)`; g.fillRect(R() * 512, R() * 1024, 1 + R() * 2.2, 1 + R() * 2.2); }
  for (let i = 0; i < 14; i++) { g.strokeStyle = `rgba(8,8,10,${0.18 + R() * 0.2})`; g.lineWidth = 1 + R() * 1.5; g.beginPath(); let x = R() * 512, y = R() * 1024; g.moveTo(x, y); for (let k = 0; k < 7; k++) { x += (R() - 0.5) * 60; y += (R() - 0.2) * 50; g.lineTo(x, y); } g.stroke(); }
  const px = x => (x + 7) / 14 * 512;                                                                              // x em metros -> pixel
  g.fillStyle = '#cfa820'; for (const x of [-0.16, 0.16]) g.fillRect(px(x) - 2, 0, 4.4, 1024);                      // faixa dupla amarela
  g.fillStyle = '#d9dcdf'; for (const x of [-3.5, 3.5]) for (let k = 0; k < 2; k++) g.fillRect(px(x) - 2, 40 + k * 512, 4.4, 230);   // tracejadas
  for (const x of [-6.5, 6.5]) g.fillRect(px(x) - 2.6, 0, 5.2, 1024);                                              // bordas
  for (let i = 0; i < 24; i++) { g.fillStyle = `rgba(0,0,0,${0.04 + R() * 0.05})`; g.beginPath(); g.ellipse(R() * 512, R() * 1024, 18 + R() * 40, 30 + R() * 80, 0, 0, Math.PI * 2); g.fill(); }   // manchas de óleo/umidade
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 12); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function fachada(seed) {                                                                                           // cor e emissiva: janelas acesas ao acaso (célula = 0,5 m; tile de 8 m)
  const R = rng(seed), N = 16, S = 32, cor = canvas(N * S, N * S), emi = canvas(N * S, N * S), g = cor.getContext('2d'), e = emi.getContext('2d');
  g.fillStyle = ['#12151d', '#171a22', '#10131a', '#1a1d26'][seed % 4]; g.fillRect(0, 0, N * S, N * S); e.fillStyle = '#000'; e.fillRect(0, 0, N * S, N * S);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = i * S + 8, y = j * S + 7, w = S - 16, h = S - 14, r = R();
    if (r < 0.34) { const q = R(), c = q < 0.62 ? '#e8c890' : q < 0.84 ? '#a9c4e0' : q < 0.95 ? '#e0a070' : '#8fd0b0'; g.fillStyle = c; g.fillRect(x, y, w, h); e.fillStyle = c; e.fillRect(x, y, w, h); }
    else { g.fillStyle = '#0a0c11'; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(70,90,130,0.22)'; g.fillRect(x, y, w, h * 0.35); }
  }
  const a = new THREE.CanvasTexture(cor), b = new THREE.CanvasTexture(emi); for (const t of [a, b]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; } return [a, b];
}

function texNeon() {
  const c = canvas(1024, 512), g = c.getContext('2d'); g.clearRect(0, 0, 1024, 512); g.textAlign = 'center'; g.textBaseline = 'middle';
  const neon = (txt, y, size, cor, glow) => { for (const [blur, w, col] of [[60, 0, glow], [30, 0, glow], [12, 0, cor], [0, 0, '#ffffff']]) { g.save(); g.shadowColor = glow; g.shadowBlur = blur; g.fillStyle = col; g.font = `900 ${size}px 'Arial Black', 'DejaVu Sans', sans-serif`; g.fillText(txt, 512, y); g.restore(); } };
  neon('HRYZ', 215, 300, '#7ff3ff', '#00c8ff'); neon('ANIMATION', 410, 96, '#ff9be8', '#ff2fc4');
  g.strokeStyle = '#00c8ff'; g.lineWidth = 6; g.shadowColor = '#00c8ff'; g.shadowBlur = 26; g.strokeRect(40, 40, 944, 432);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function brilho(cor, tam, op = 1) {
  const c = canvas(128, 128), g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.16, cor); r.addColorStop(0.5, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: op, fog: false })); s.scale.setScalar(tam); s.renderOrder = 20; return s;
}
function poca(cor, op) {                                                                                           // mancha de luz no chão (aditiva)
  const c = canvas(128, 128), g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, cor); r.addColorStop(0.55, 'rgba(0,0,0,0.0)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: t, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: op, fog: false, polygonOffset: true, polygonOffsetFactor: -1 }));
}

export function criarMundo(renderer) {
  const scene = new THREE.Scene(), R = rng(11);
  scene.fog = new THREE.FogExp2(0x0b1226, 0.016);
  const CEU = { zenite: [0.010, 0.018, 0.06], horizonte: [0.20, 0.17, 0.30], chao: [0.025, 0.027, 0.04], sol: [0, -1, 0] };
  scene.add(criarCeuMalha({ ...CEU, raio: 280 }));
  scene.environment = criarAmbiente(renderer, { ...CEU, paineis: [
    { pos: [-8, 11, 5], w: 16, h: 2.4, cor: [0.6, 0.7, 1.0], k: 5.0 }, { pos: [9, 9, -3], w: 3.2, h: 8, cor: [1.0, 0.72, 0.4], k: 6.0 },
    { pos: [0, 7, -12], w: 14, h: 1.6, cor: [0.7, 0.8, 1.0], k: 3.5 }, { pos: [-11, 3, -2], w: 2.5, h: 6, cor: [0.55, 0.65, 1.0], k: 4.0 }, { pos: [10, 4, 9], w: 2, h: 5, cor: [1.0, 0.45, 0.35], k: 3.0 }] });

  // ---- rua e calçadas
  const rua = new THREE.Mesh(new THREE.PlaneGeometry(14, 360), new THREE.MeshStandardMaterial({ map: texAsfalto(), roughness: 0.36, metalness: 0.0, envMapIntensity: 1.1 })); rua.rotation.x = -Math.PI / 2; rua.receiveShadow = true; scene.add(rua);
  const calc = new THREE.MeshStandardMaterial({ color: 0x34363c, roughness: 0.75 }), meio = new THREE.MeshStandardMaterial({ color: 0x4a4c52, roughness: 0.8 });
  for (const s of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(6, 0.16, 360), calc); c.position.set(s * 10, 0.08, 0); c.receiveShadow = true; scene.add(c);
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.17, 360), meio); f.position.set(s * 7.12, 0.085, 0); f.receiveShadow = true; scene.add(f);
  }

  // ---- prédios
  const fachadas = Array.from({ length: 6 }, (_, i) => fachada(31 + i * 7)), predios = new THREE.Group(); scene.add(predios);
  for (const s of [-1, 1]) for (let z = -170; z < 170;) {
    const w = 12 + R() * 14, d = 14 + R() * 8, h = 12 + R() * 32, [map, emi] = fachadas[Math.floor(R() * fachadas.length)], a = map.clone(), b = emi.clone();
    for (const t of [a, b]) { t.repeat.set(w / 8, h / 8); t.offset.set(R(), R()); t.needsUpdate = true; }
    const m = new THREE.Mesh(new THREE.BoxGeometry(d, h, w), new THREE.MeshStandardMaterial({ map: a, emissiveMap: b, emissive: 0xffffff, emissiveIntensity: 0.8, roughness: 0.85 }));
    m.position.set(s * (13 + d / 2), h / 2, z + w / 2); predios.add(m);
    if (h > 28) { const lp = brilho('rgba(255,40,40,1)', 3.0, 0); lp.position.set(s * (13 + d / 2), h + 0.6, z + w / 2); lp.userData.aviso = true; predios.add(lp); }
    z += w + 1.5 + R() * 3;
  }

  // ---- postes de sódio
  const mat = new THREE.MeshStandardMaterial({ color: 0x1b1d22, roughness: 0.6, metalness: 0.6 }), poste = new THREE.CylinderGeometry(0.07, 0.1, 8, 10), braco = new THREE.BoxGeometry(2.2, 0.1, 0.1);
  for (const s of [-1, 1]) for (let z = -150; z <= 150; z += 20) {
    const zz = z + (s > 0 ? 10 : 0), p = new THREE.Mesh(poste, mat); p.position.set(s * 7.9, 4, zz); scene.add(p);
    const b = new THREE.Mesh(braco, mat); b.position.set(s * 6.9, 8, zz); scene.add(b);
    const l = brilho('rgba(255,170,70,1)', 4.2, 0.95); l.position.set(s * 5.9, 7.85, zz); scene.add(l);
    const pc = poca('rgba(255,170,80,1)', 0.38); pc.rotation.x = -Math.PI / 2; pc.scale.set(11, 11, 1); pc.position.set(s * 5.4, 0.02, zz); scene.add(pc);
  }

  // ---- letreiro HRYZ (diegético): na fachada direita (x > 0), virado para a rua
  const neon = texNeon(), plano = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 3.7), new THREE.MeshBasicMaterial({ map: neon, transparent: true, toneMapped: false, fog: false })); plano.position.set(12.85, 8.6, -30); plano.rotation.y = -Math.PI / 2; scene.add(plano);
  const halo = brilho('rgba(0,200,255,1)', 14, 0.55); halo.position.set(12.6, 8.6, -30); scene.add(halo);
  const caixa = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.3, 8), new THREE.MeshStandardMaterial({ color: 0x0b0d12, roughness: 0.7 })); caixa.position.set(13.1, 8.6, -30); scene.add(caixa);

  // ---- luzes de cinema (as de contraluz acompanham a câmera)
  scene.add(new THREE.HemisphereLight(0x6a7fbf, 0x10131c, 0.45));
  const lua = new THREE.DirectionalLight(0xa9bcff, 1.35); lua.castShadow = true; lua.shadow.mapSize.set(1536, 1536); Object.assign(lua.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 40 }); lua.shadow.bias = -0.0004; lua.shadow.normalBias = 0.02; scene.add(lua, lua.target);
  const kA = new THREE.DirectionalLight(0x7f9bff, 2.4), kB = new THREE.DirectionalLight(0xffa868, 1.9); scene.add(kA, kA.target, kB, kB.target);
  const pos = new THREE.Vector3(), fwd = new THREE.Vector3(), rgt = new THREE.Vector3();
  function iluminar(cam, alvo) {                                                                                   // alvo: ponto herói do plano
    fwd.subVectors(alvo, cam).setY(0); if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, 1); fwd.normalize(); rgt.set(-fwd.z, 0, fwd.x);                  // direita da câmera no plano horizontal (para fwd=+z, direita = -x ... conferido na prática)
    lua.position.copy(alvo).add(pos.set(-6, 10, 5)); lua.target.position.copy(alvo);
    kA.position.copy(alvo).addScaledVector(fwd, 9).addScaledVector(rgt, -6).setY(7.4); kA.target.position.copy(alvo);
    kB.position.copy(alvo).addScaledVector(fwd, 9).addScaledVector(rgt, 6.5).setY(6.2); kB.target.position.copy(alvo);
  }
  function atualizar(t) { predios.children.forEach(o => { if (o.userData.aviso) o.material.opacity = (Math.floor(t * 0.9 + o.position.z) % 2) ? 0.9 : 0.05; }); }
  return { scene, iluminar, atualizar, neon: plano };
}
