// Rua de cidade à noite sob tempestade, montada com o kit da biblioteca (ruas, prédios, poste de luz, placa RUA HRYZ).
import * as THREE from 'three';
import { Kit } from '../../biblioteca3d/cidade/kit.js';
import { detalharKit, criarReflexoPocas } from './detalhe.js';
import { feixeLuz, linhaDeFios, criarVapor } from './props.js';
import { clonarGLB, brilho } from './motor.js';

export async function construirRua(g, { comPoste = true, env = null } = {}) {
  const kit = await Kit.carregar(new URL('../../biblioteca3d/cidade/', import.meta.url).href);
  const L = [];
  for (const gz of [-2, -1, 0, 1, 2]) L.push(await kit.ladrilho('rua-reta', 0, gz, 0));
  // prédios dos dois lados, de frente para a rua (a porta do kit aponta para +Z; girar 90 graus leva a porta para +X)
  const pr = [['predio-loja-3', -1, 0], ['predio-residencial-6', -1, -1], ['predio-loja-3', -1, 1], ['predio-residencial-6', -1, 2], ['predio-comercial-10', -1.5, -2],
              ['predio-residencial-6', 1, 0], ['predio-loja-3', 1, -1], ['predio-residencial-6', 1, 1], ['predio-loja-3', 1, 2], ['predio-residencial-6', 1, -2]];
  const B = [];
  for (const [nome, lado, gz] of pr) {
    const o = await kit.peca(nome); const lx = Math.sign(lado) * (6 + 5.4 + 0.2);
    o.position.set(lx, 0, gz * 12); o.rotation.y = lado < 0 ? Math.PI / 2 : -Math.PI / 2;
    kit.luzEstado(o, true); B.push(o);
  }
  const placa = await kit.peca('placa-rua-hryz'); placa.position.set(4.6, 0.15, -3.5); placa.rotation.y = Math.PI / 2 * 0 + 0.0; B.push(placa);
  const postes = [];
  if (comPoste) for (const [x, z, ry] of [[4.9, -2.6, -Math.PI / 2], [-4.9, 4.2, Math.PI / 2], [4.9, 9.5, -Math.PI / 2], [-4.9, -9.5, Math.PI / 2], [4.9, -13, -Math.PI / 2]]) { const p = await kit.peca('poste-luz'); p.position.set(x, 0.15, z); p.rotation.y = ry; kit.luzEstado(p, true); postes.push(p); B.push(p); }
  for (const o of [...L, ...B]) g.add(o);
  // asfalto molhado: escuro, com grão, rachaduras e poças; calçada de laje com juntas e manchas; paredes com sujeira de chuva
  g.traverse(m => { if (!m.isMesh) return; if (m.name === 'Asfalto') m.material = new THREE.MeshStandardMaterial({ color: 0x2c3856, roughness: 0.5, metalness: 0.1, envMap: env, envMapIntensity: 0.35 });
    if (m.name === 'Calcada') { m.material = m.material.clone(); m.material.roughness = 0.4; m.material.color.multiplyScalar(0.8); } });
  detalharKit(g);
  // postes de energia com fios ao longo da rua, hidrante, lixeira, táxi estacionado e feixes de luz dos postes na chuva
  const pe = []; for (const z of [-16, -4, 8]) { const p = await kit.peca('poste-energia'); p.position.set(5.3, 0.15, z); p.rotation.y = Math.PI / 2; g.add(p); pe.push([5.3, z]); }
  linhaDeFios(g, pe, 8.3, { x: [-0.8, 0, 0.8], sag: 0.55 });
  { const h = await kit.peca('hidrante'); h.position.set(4.7, 0.15, 3.4); g.add(h); }
  { const lx = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.9, 14), new THREE.MeshStandardMaterial({ color: 0x2f7a4a, roughness: 0.55, metalness: 0.2 })); lx.position.set(4.9, 0.6, -6.4); lx.castShadow = true; g.add(lx);
    const tp = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 14), new THREE.MeshStandardMaterial({ color: 0x25603a, roughness: 0.5 })); tp.position.set(4.9, 1.09, -6.4); g.add(tp); }
  try { const taxi = await clonarGLB(new URL('../../biblioteca3d/veiculos/taxi.glb', import.meta.url).href); taxi.scale.setScalar(1.7); taxi.position.set(3.0, 0, -9.5); taxi.rotation.y = Math.PI; taxi.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; } }); g.add(taxi); } catch (e) { console.warn('taxi', e.message); }
  const feixes = [];
  for (const p of postes) { const fx = feixeLuz({ de: [p.position.x * 0.55, 7.95, p.position.z], altura: 7.9, raio: 2.4, forca: 0.09 }); g.add(fx); feixes.push(fx); const b = brilho('255,205,140', 2.4, 0.8); b.position.set(p.position.x * 0.55, 8.0, p.position.z); g.add(b); }
  const vapor = criarVapor(g, { pos: [0.6, 0.02, -5.8], n: 14, altura: 2.6, periodo: 5.5 });
  const reflexo = criarReflexoPocas({ largura: 12, comprimento: 60, centro: [0, 0, 0], molhado: 0.3, intens: 1.0 }); g.add(reflexo);
  // letreiro das lojas: a marca HRYZ no lugar de "LOJA" (a textura do kit é compartilhada, então basta redesenhar uma vez)
  const feitas = new Set();
  g.traverse(m => { if (!m.isMesh || !/^Letreiro/.test(m.name)) return; const t = m.material.map; if (!t || feitas.has(t)) return; feitas.add(t);
    const c = document.createElement('canvas'); c.width = 1024; c.height = 192; const x = c.getContext('2d');
    x.fillStyle = '#c4302b'; x.fillRect(0, 0, 1024, 192); x.strokeStyle = '#ffffff'; x.lineWidth = 8; x.beginPath(); x.roundRect(14, 12, 996, 168, 14); x.stroke();
    x.fillStyle = '#ffffff'; x.font = 'bold 150px Arial Black, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('HRYZ', 512, 100);
    t.image = c; t.needsUpdate = true; });
  // janelas acesas mais quentes e variadas (cada janela tem um tom e brilho)
  let n = 0;
  g.traverse(m => { if (!m.isMesh) return; const arr = Array.isArray(m.material) ? m.material : [m.material];
    const novo = arr.map(k => { if (!/^Vidro(Escuro)?Luz$/.test(k.name)) return k; const c = k.clone(); const h = (n++ * 0.6180339) % 1;
      c.color.set(0xffd9a0).lerp(new THREE.Color(h < 0.3 ? 0xffb35a : h < 0.6 ? 0xffe2a8 : 0xff9a4a), 0.6); c.emissive.set(h < 0.3 ? 0xff8a2a : h < 0.6 ? 0xffb85c : 0xff7a2a); c.emissiveIntensity = 0.75 + 0.35 * h; return c; });
    m.material = Array.isArray(m.material) ? novo : novo[0]; });
  return { kit, postes, L, B, reflexo, feixes, vapor };
}
