// CANTEIRO DE OBRAS do Hryz City (campo ao norte da rua de cima): terreno de terra batida cercado com tapume e portão,
// contêiner-escritório, banheiro químico, montes de terra e brita, manilhas de concreto, cones, placa "USE EPI" e o operador.
// As máquinas (escavadeira, retroescavadeira, pá carregadeira, rolo e basculante) estacionam aqui (ver jogo.js).
import * as THREE from 'three';
import { Personagem } from '../videos/biblioteca3d/personagens/elenco/elenco.js';

export const CANTEIRO = { x0: 140, x1: 220, z0: -30, z1: 15, portao: [168, 192] };

function tela(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

export async function construirCanteiro({ scene, colisores, base }) {
  const g = new THREE.Group(); g.name = 'canteiro'; scene.add(g);
  const { x0, x1, z0, z1, portao } = CANTEIRO, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const add = (o) => { g.add(o); return o; };
  const caixa = (sx, sy, sz, mat, x, y, z, colide = true) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; add(m); if (colide) colisores.push({ minX: x - sx / 2, maxX: x + sx / 2, minZ: z - sz / 2, maxZ: z + sz / 2 }); return m; };
  // terreno de terra batida com marcas de pneu
  const texT = tela(512, 512, (c, w, h) => { c.fillStyle = '#8a6a48'; c.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(${60 + Math.random() * 60},${45 + Math.random() * 40},${30 + Math.random() * 25},${0.25 + Math.random() * 0.3})`; c.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 2 + Math.random() * 5); }
    c.strokeStyle = 'rgba(50,38,26,0.35)'; c.lineWidth = 7; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(Math.random() * w, 0); c.bezierCurveTo(Math.random() * w, h * 0.3, Math.random() * w, h * 0.7, Math.random() * w, h); c.stroke(); } });
  texT.wrapS = texT.wrapT = THREE.RepeatWrapping; texT.repeat.set(5, 3);
  const chao = add(new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshLambertMaterial({ map: texT })));
  chao.rotation.x = -Math.PI / 2; chao.position.set(cx, 0.02, cz); chao.receiveShadow = true;
  // entrada de terra até a rua (z 15 → 19)
  const entrada = add(new THREE.Mesh(new THREE.PlaneGeometry(portao[1] - portao[0], 5), new THREE.MeshLambertMaterial({ map: texT })));
  entrada.rotation.x = -Math.PI / 2; entrada.position.set((portao[0] + portao[1]) / 2, 0.025, z1 + 2.2);
  // tapume: painéis metálicos verdes de 2,2 m com faixa "HRYZ OBRAS", postes; portão aberto no sul
  const texTap = tela(512, 128, (c, w, h) => { c.fillStyle = '#1f6b45'; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(x, 0, 6, h); } c.fillStyle = '#f2b20c'; c.fillRect(0, h * 0.40, w, h * 0.2); c.fillStyle = '#111'; c.font = '900 20px system-ui'; c.textBaseline = 'middle'; c.fillText('HRYZ OBRAS · ÁREA DE MÁQUINAS', 14, h * 0.5); });
  texTap.wrapS = THREE.RepeatWrapping;
  const matTap = new THREE.MeshLambertMaterial({ map: texTap, side: THREE.DoubleSide }), matPoste = new THREE.MeshLambertMaterial({ color: 0x3a3f44 });
  const tapume = (xa, za, xb, zb) => {
    const L = Math.hypot(xb - xa, zb - za), t = texTap.clone(); t.needsUpdate = true; t.repeat.set(L / 6, 1);
    const m = add(new THREE.Mesh(new THREE.PlaneGeometry(L, 2.2), new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide })));
    m.position.set((xa + xb) / 2, 1.1, (za + zb) / 2); m.rotation.y = -Math.atan2(zb - za, xb - xa); m.castShadow = true;
    for (let k = 0; k <= Math.ceil(L / 3); k++) { const u = Math.min(1, k * 3 / L); caixa(0.12, 2.35, 0.12, matPoste, xa + (xb - xa) * u, 1.17, za + (zb - za) * u, false); }
    colisores.push({ minX: Math.min(xa, xb) - 0.15, maxX: Math.max(xa, xb) + 0.15, minZ: Math.min(za, zb) - 0.15, maxZ: Math.max(za, zb) + 0.15 });
  };
  tapume(x0, z0, x1, z0); tapume(x0, z0, x0, z1); tapume(x1, z0, x1, z1); tapume(x0, z1, portao[0], z1); tapume(portao[1], z1, x1, z1);
  // placa de obra no portão
  const placa = add(new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), new THREE.MeshBasicMaterial({ map: tela(720, 360, (c, w, h) => {
    c.fillStyle = '#f4f4f0'; c.fillRect(0, 0, w, h); c.fillStyle = '#1f6b45'; c.fillRect(0, 0, w, 96); c.fillStyle = '#fff'; c.font = '900 54px system-ui'; c.textAlign = 'center'; c.fillText('OBRA HRYZ CITY', w / 2, 66);
    c.fillStyle = '#111'; c.font = '800 36px system-ui'; c.fillText('PROIBIDA A ENTRADA SEM EPI', w / 2, 160); c.font = '700 30px system-ui'; c.fillText('Capacete · Colete · Botina · Luvas', w / 2, 215);
    c.fillStyle = '#f2b20c'; c.fillRect(0, h - 70, w, 70); c.fillStyle = '#111'; c.font = '900 34px system-ui'; c.fillText('⚠ MÁQUINAS EM MOVIMENTO', w / 2, h - 24); }), side: THREE.DoubleSide })));
  placa.position.set(portao[0] - 3.2, 2.6, z1 + 0.15);
  caixa(0.1, 2.2, 0.1, matPoste, portao[0] - 4.6, 1.1, z1 + 0.1, false); caixa(0.1, 2.2, 0.1, matPoste, portao[0] - 1.8, 1.1, z1 + 0.1, false);
  // contêiner-escritório e banheiro químico
  const matCont = new THREE.MeshLambertMaterial({ map: tela(256, 128, (c, w, h) => { c.fillStyle = '#d9d9d2'; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 8) { c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(x, 0, 3, h); } }) });
  const cont = caixa(6.0, 2.6, 2.45, matCont, x0 + 6, 1.3, z1 - 3.2);
  const vidro = new THREE.MeshLambertMaterial({ color: 0x2a3a48 });
  for (const dx of [-1.6, 1.4]) { const j = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), vidro); j.position.set(x0 + 6 + dx, 1.6, z1 - 1.96); add(j); }
  const porta = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.0), new THREE.MeshLambertMaterial({ color: 0x5a6068 })); porta.position.set(x0 + 6, 1.0, z1 - 1.96); add(porta);
  caixa(1.2, 2.3, 1.2, new THREE.MeshLambertMaterial({ color: 0x2f6fb3 }), x0 + 11, 1.15, z1 - 2.5);
  // montes de terra e brita
  const monte = (x, z, r, h, cor) => { const m = add(new THREE.Mesh(new THREE.ConeGeometry(r, h, 18), new THREE.MeshLambertMaterial({ color: cor }))); m.position.set(x, h / 2, z); m.castShadow = m.receiveShadow = true; colisores.push({ minX: x - r * 0.7, maxX: x + r * 0.7, minZ: z - r * 0.7, maxZ: z + r * 0.7 }); return m; };
  monte(x1 - 12, z0 + 8, 5.5, 3.6, 0x7a5a3a); monte(x1 - 22, z0 + 6, 4.0, 2.6, 0x8a6a48); monte(x0 + 30, z0 + 7, 3.6, 2.2, 0x8d8d88);
  // manilhas de concreto empilhadas e cones
  const matConc = new THREE.MeshLambertMaterial({ color: 0xa9a9a2, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) { const m = add(new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 2.0, 18, 1, true), matConc)); m.rotation.z = Math.PI / 2; m.position.set(x0 + 20 + i * 1.25, 0.62, z0 + 4); m.castShadow = true; }
  colisores.push({ minX: x0 + 19, maxX: x0 + 24, minZ: z0 + 3, maxZ: z0 + 5 });
  const matCone = new THREE.MeshLambertMaterial({ color: 0xff6a13 });
  for (const [x, z] of [[portao[0] + 1, z1 - 1], [portao[1] - 1, z1 - 1], [cx, z0 + 14], [cx + 4, z0 + 14], [cx - 4, z0 + 14]]) { const c = add(new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 12), matCone)); c.position.set(x, 0.35, z); }
  // operador (elenco), em pé perto do escritório, de frente para as máquinas
  let operador = null;
  try {
    operador = await Personagem.carregar(`${base}/personagens/elenco/operador.glb`);
    operador.obj.position.set(x0 + 9.5, 0.02, z1 - 6); operador.obj.rotation.y = Math.PI * 0.85;
    operador.obj.traverse(m => { if (m.isMesh) m.castShadow = true; }); g.add(operador.obj);
    operador.tocar('Parado'); operador.piscarAuto(true);
  } catch (e) { console.warn('operador', e); }
  return {
    grupo: g, area: CANTEIRO, chao, materialTerra: chao.material,
    atualizar(dt, fx, fz) {
      const perto = fx > x0 - 120 && fx < x1 + 120 && fz > z0 - 120 && fz < z1 + 120;
      g.visible = perto;
      if (perto && operador) operador.atualizar(dt);
    },
  };
}

/** monte de terra despejado pelo basculante (fica no mundo) */
export function monteDeTerra(scene, x, z) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.3, 16), new THREE.MeshLambertMaterial({ color: 0x7a5a3a }));
  m.position.set(x, 0.65, z); m.castShadow = m.receiveShadow = true; scene.add(m); return m;
}
