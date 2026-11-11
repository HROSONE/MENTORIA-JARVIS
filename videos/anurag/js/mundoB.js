// Mundo B: a estrada rural à noite (asfalto com faixas, árvores do kit, postes com fio, morros ao longe, céu com lua) e o local da batida (árvore e poste).
import * as THREE from 'three';
import { Kit } from '../../biblioteca3d/cidade/kit.js';
import { mundos, canvasTex, brilho, sombras, clonarGLB } from './motor.js';
import { mulberry32 } from './util.js';

const M = (cor, rug = 0.95, extra = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: rug, ...extra });

function texturaAsfalto() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#34353a'; g.fillRect(0, 0, w, h);
    const r = mulberry32(7);
    for (let i = 0; i < 5200; i++) { const v = 40 + r() * 36; g.fillStyle = `rgba(${v},${v},${v + 3},0.5)`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
    // faixa dupla amarela no centro e bordas brancas (a textura repete a cada 12 m ao longo de V)
    g.fillStyle = '#c9a21c'; g.fillRect(w / 2 - 9, 0, 5, h); g.fillRect(w / 2 + 4, 0, 5, h);
    g.fillStyle = '#d8d8d2'; g.fillRect(14, 0, 6, h); g.fillRect(w - 20, 0, 6, h);
    g.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 8; i++) g.fillRect(w * 0.3, i * 64 + 10, 3, 30);
  }, { repete: true, aniso: 8 });
}
function texturaCeu() {
  return canvasTex(512, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#04060f'); gr.addColorStop(0.55, '#0a1226'); gr.addColorStop(0.85, '#1b2640'); gr.addColorStop(1, '#2d3552');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = mulberry32(3);
    for (let i = 0; i < 160; i++) { const y = r() * h * 0.7; g.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.6})`; g.fillRect(r() * w, y, 1.3, 1.3); }
  });
}

export async function construirB(hist) {
  const B = mundos.B;
  const kit = await Kit.carregar('../biblioteca3d/cidade/');
  const dados = { arvores: [], postes: [], tr: hist.arvore };
  const z0 = -90, z1 = 560, L = z1 - z0, zc = (z0 + z1) / 2;

  // céu (cúpula que acompanha a câmera) e lua
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(500, 24, 16), new THREE.MeshBasicMaterial({ map: texturaCeu(), side: THREE.BackSide, fog: false, depthWrite: false }));
  ceu.renderOrder = -10; ceu.frustumCulled = false; B.add(ceu); dados.ceu = ceu;
  const lua = brilho('210,225,255', 70, 0.95); lua.position.set(-260, 210, 380); B.add(lua); dados.luaVisual = lua;
  const disco = new THREE.Mesh(new THREE.CircleGeometry(12, 28), new THREE.MeshBasicMaterial({ color: 0xf2f6ff, fog: false })); disco.position.set(-260, 210, 380); disco.lookAt(0, 0, 0); disco.renderOrder = -5; B.add(disco); dados.luaDisco = disco;

  // chão: grama escura, acostamento de cascalho, asfalto
  const mato = new THREE.Mesh(new THREE.PlaneGeometry(900, L), M(0x101c14, 1)); mato.rotation.x = -Math.PI / 2; mato.position.set(0, -0.03, zc); mato.receiveShadow = true; B.add(mato);
  const acost = new THREE.Mesh(new THREE.PlaneGeometry(13, L), M(0x4a4338, 1)); acost.rotation.x = -Math.PI / 2; acost.position.set(0, -0.015, zc); acost.receiveShadow = true; B.add(acost);
  const tex = texturaAsfalto(); tex.repeat.set(1, L / 8);
  const asf = new THREE.Mesh(new THREE.PlaneGeometry(7.4, L), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.82, metalness: 0.0 }));
  asf.rotation.x = -Math.PI / 2; asf.position.set(0, 0.0, zc); asf.receiveShadow = true; B.add(asf);
  // olhos de gato (refletores) nas bordas: pontinhos brilhantes que reforçam a velocidade
  const geoRef = new THREE.BoxGeometry(0.12, 0.05, 0.12);
  for (let z = z0 + 5; z < z1; z += 12) for (const x of [-3.9, 3.9]) { const m = new THREE.Mesh(geoRef, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: x < 0 ? 0xffe3a0 : 0xfff1d0, emissiveIntensity: 0.5 })); m.position.set(x, 0.03, z); B.add(m); }

  // morros ao longe (silhuetas)
  const morro = M(0x070b13, 1);
  for (let k = 0; k < 14; k++) {
    const r = mulberry32(40 + k), lado = k % 2 ? 1 : -1;
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12), morro);
    m.scale.set(60 + r() * 50, 22 + r() * 24, 90 + r() * 60); m.position.set(lado * (150 + r() * 80), -4, z0 + 40 + k * 46 + r() * 20); B.add(m);
    // luzes de casas nas encostas
    for (let j = 0; j < 4; j++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), new THREE.MeshBasicMaterial({ color: 0xffd48a })); p.position.set(m.position.x - lado * (30 + r() * 20), 6 + r() * 14, m.position.z + (r() - 0.5) * 70); p.scale.setScalar(0.6 + r()); B.add(p); }
  }

  // árvores (kit) dos dois lados; só as próximas da câmera ficam visíveis (ver `cortar`)
  const nomes = ['natureza/arvore-pinheiro', 'natureza/arvore-cipreste', 'natureza/arvore-frondosa', 'natureza/arvore-redonda'];
  const r = mulberry32(11);
  const base = await Promise.all(nomes.map(n => kit.peca(n.split('/')[1])));
  for (let z = z0; z < z1; z += 8.5) {
    for (const lado of [-1, 1]) {
      if (lado < 0 && Math.abs(z - hist.arvore.z) < 14) continue;                               // trecho da batida: só a árvore da batida
      for (let k = 0; k < 2; k++) {
        const i = Math.floor(r() * nomes.length);
        const o = base[i].clone(true);
        const x = lado * (k === 0 ? 8.5 + r() * 4 : 15 + r() * 14);
        o.position.set(x, 0, z + r() * 6); o.rotation.y = r() * 6.28; o.scale.setScalar((k === 0 ? 1.15 : 1.4) + r() * 0.5);
        o.traverse(m => { if (m.isMesh) { m.castShadow = k === 0; m.receiveShadow = false; } });
        B.add(o); dados.arvores.push(o);
      }
    }
  }
  // arbustos baixos à beira do asfalto
  const arb = await kit.peca('arbusto');
  for (let z = z0; z < z1; z += 5) for (const lado of [-1, 1]) { if (r() < 0.4 || (lado < 0 && Math.abs(z - hist.arvore.z) < 30)) continue; const o = arb.clone(true); o.position.set(lado * (5.6 + r() * 1.6), 0, z + r() * 4); o.scale.setScalar(0.6 + r() * 0.5); o.rotation.y = r() * 6; B.add(o); dados.arvores.push(o); }

  // postes de energia do lado esquerdo (+X) e fios entre eles
  const poste = await kit.peca('poste-energia');
  const fio = await kit.peca('fio-vao-36');
  for (let z = z0; z < z1; z += 36) {
    const p = poste.clone(true); p.position.set(6.8, 0, z); p.rotation.y = Math.PI / 2; sombras(p); B.add(p); dados.postes.push(p);
    const f = fio.clone(true); f.position.set(6.8, 0, z); f.rotation.y = Math.PI / 2; B.add(f); dados.postes.push(f);
  }
  // o local da batida: a árvore e o poste que o carro também atinge
  const tr = hist.arvore;
  const arv = (await kit.peca('arvore-frondosa')); arv.position.set(tr.x, 0, tr.z); arv.scale.setScalar(1.6); arv.rotation.y = 0.7; sombras(arv); B.add(arv); dados.arvoreBatida = arv;
  const pb = (await kit.peca('poste-energia')); pb.position.set(-6.4, 0, tr.z + 4.2); pb.rotation.y = -Math.PI / 2; sombras(pb); B.add(pb); dados.posteBatida = pb;
  const fb = (await kit.peca('fio-vao-36')); fb.position.set(-6.4, 0, tr.z + 4.2); fb.rotation.y = -Math.PI / 2; B.add(fb); dados.fioBatida = fb;

  // luz da lua (com sombra) e céu de fundo
  const hemi = new THREE.HemisphereLight(0x5f78b8, 0x151210, 0.75); B.add(hemi);
  const sol = new THREE.DirectionalLight(0x9db2f5, 1.05); sol.position.set(-20, 26, 8); sol.castShadow = true; sol.shadow.mapSize.set(1024, 1024);
  Object.assign(sol.shadow.camera, { left: -18, right: 18, top: 16, bottom: -16, near: 1, far: 90 }); sol.shadow.bias = -0.0005; sol.shadow.normalBias = 0.05;
  B.add(sol); B.add(sol.target); dados.lua = sol;
  return dados;
}

// só as árvores/postes perto de `z` ficam visíveis; a luz da lua (com sombra) acompanha o foco
export function cortarB(d, z, folga = 170) {
  for (const o of d.arvores) o.visible = Math.abs(o.position.z - z) < folga;
  for (const o of d.postes) o.visible = Math.abs(o.position.z - z) < folga;
  d.lua.position.set(-20, 26, z + 8); d.lua.target.position.set(0, 0, z); d.lua.target.updateMatrixWorld();
}
