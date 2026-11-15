// RODAS da viatura: pneu P235/55R17 (diâmetro 0,690 m), roda de aço preta 17" com calota central cromada, disco e pinça de freio, vão da roda (túnel) e friso do arco.
import * as THREE from 'three';
import { M, ZF, ZT, YE, RARCO, XPORAO } from './forma.js';

const R_PNEU = M.RP, R_ARO = M.RARO, LP = M.LP;

function texturaPneu() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, 1024, 256);                                                              // altura média
  // v: 0 = borda interna ... 1 = borda externa; o centro (v ~ 0.5) é a banda de rodagem
  for (const v of [0.34, 0.42, 0.58, 0.66]) { g.fillStyle = '#202020'; g.fillRect(0, v * 256 - 3, 1024, 6); }       // sulcos circunferenciais
  g.fillStyle = '#303030';
  for (let i = 0; i < 96; i++) { const x = i / 96 * 1024; for (const v of [0.5]) { g.save(); g.translate(x, v * 256); g.rotate(0.35); g.fillRect(-1.5, -26, 3, 52); g.restore(); } }  // lâminas
  g.fillStyle = '#9a9a9a';
  for (let i = 0; i < 64; i++) { const x = (i + 0.5) / 64 * 1024; g.fillRect(x - 6, 10, 12, 4); g.fillRect(x - 6, 242, 12, 4); }                   // marcas leves na lateral
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}

/** pneu: perfil de revolução em torno do eixo X, face externa em +x */
function geometriaPneu() {
  const meio = [[0.2060, 0.0820], [0.2159, 0.1000], [0.2250, 0.1100], [0.2500, 0.1170], [0.2800, 0.1185], [0.3100, 0.1130], [0.3320, 0.1010], [0.3425, 0.0860], [0.3455, 0.0660],
    [0.3455, 0.0400], [0.3415, 0.0340], [0.3455, 0.0280], [0.3455, 0.0100], [0.3455, 0.0]];                                                  // [raio, a] do talão até o centro (a > 0 = lado de fora)
  const ord = [];
  for (const [r, a] of meio) ord.push(new THREE.Vector2(r, -a));                                                                              // lado interno: do talão (a < 0) até o centro
  for (const [r, a] of meio.slice(0, -1).reverse()) ord.push(new THREE.Vector2(r, a));                                                        // lado externo: do centro até o talão
  const g = new THREE.LatheGeometry(ord, 96); g.rotateZ(-Math.PI / 2);                                                                        // o eixo do pneu vira X
  return g;
}

function discoAco() {                                                                                                                          // disco da roda com furos de parafuso e aberturas de ventilação
  const sh = new THREE.Shape(); sh.absarc(0, 0, R_ARO - 0.004, 0, Math.PI * 2, false);
  const furo = (cx, cy, rx, ry, rot = 0) => { const p = new THREE.Path(); p.absellipse(cx, cy, rx, ry, 0, Math.PI * 2, true, rot); sh.holes.push(p); };
  furo(0, 0, 0.032, 0.032);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + Math.PI / 2; furo(Math.cos(a) * 0.0572, Math.sin(a) * 0.0572, 0.0108, 0.0108); }
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; furo(Math.cos(a) * 0.1500, Math.sin(a) * 0.1500, 0.022, 0.0125, a + Math.PI / 2); }
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.0015, bevelSegments: 1, curveSegments: 40 }); g.rotateY(Math.PI / 2);
  return g;
}

/** uma roda completa para o lado +x (face externa em +x); para o lado -x gire 180° em Y */
export function criarRoda(opc = {}) {
  const G = new THREE.Group(), giro = new THREE.Group(); G.add(giro);
  const borracha = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.88, metalness: 0.0, bumpMap: texturaPneu(), bumpScale: 1.2 });
  const aco = new THREE.MeshStandardMaterial({ color: 0x0d0e10, roughness: 0.55, metalness: 0.6 });
  const cromo = new THREE.MeshStandardMaterial({ color: 0xd8dde3, roughness: 0.18, metalness: 1.0 });
  const freio = new THREE.MeshStandardMaterial({ color: 0x6d6a66, roughness: 0.6, metalness: 0.85 });
  const pinca = new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.5, metalness: 0.4 });
  const add = (m, pai = giro) => { m.castShadow = true; m.receiveShadow = true; pai.add(m); return m; };
  const pneu = add(new THREE.Mesh(geometriaPneu(), borracha));
  // aro: borda (lábio) e cuba por trás do disco
  const labio = add(new THREE.Mesh(new THREE.TorusGeometry(R_ARO + 0.004, 0.0065, 8, 64), aco)); labio.rotation.y = Math.PI / 2; labio.position.x = 0.1015;
  const cuba = add(new THREE.Mesh(new THREE.CylinderGeometry(R_ARO - 0.002, R_ARO - 0.02, 0.09, 48, 1, true), aco)); cuba.rotation.z = Math.PI / 2; cuba.position.x = 0.056; cuba.material = aco.clone(); cuba.material.side = THREE.DoubleSide;
  const disco = add(new THREE.Mesh(discoAco(), aco)); disco.position.x = 0.068;                                                                 // face da roda, um pouco rebaixada em relação ao pneu
  const cone = add(new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.145, 0.026, 40, 1, true), aco)); cone.rotation.z = Math.PI / 2; cone.position.x = 0.054; cone.material = aco.clone(); cone.material.side = THREE.DoubleSide;
  const tampa = add(new THREE.Mesh(new THREE.SphereGeometry(0.043, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), cromo)); tampa.rotation.z = -Math.PI / 2; tampa.scale.set(0.5, 1, 1); tampa.position.x = 0.074;   // calota central
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + Math.PI / 2; const p = add(new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0125, 0.016, 6), cromo)); p.rotation.z = Math.PI / 2; p.position.set(0.076, Math.cos(a) * 0.0572, Math.sin(a) * 0.0572); }
  // freio visto pelas aberturas
  const rotor = add(new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.024, 40), freio)); rotor.rotation.z = Math.PI / 2; rotor.position.x = 0.022;
  const cubo = add(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.03, 24), freio)); cubo.rotation.z = Math.PI / 2; cubo.position.x = 0.045;
  const pc = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.095, 0.17), pinca); pc.position.set(0.026, 0.06, 0.082); G.add(pc); pc.castShadow = true;                    // pinça fixa (não gira)
  return { grupo: G, giro, pneu };
}

/** Raio de sondagem na superfície da carroceria: devolve x do flanco em (z, y) para o lado +x */
export function xDoFlanco(corpo, z, y) {
  const rc = new THREE.Raycaster(new THREE.Vector3(2.5, y, z), new THREE.Vector3(-1, 0, 0), 0, 5);
  const h = rc.intersectObject(corpo, false).filter(i => i.point.x > 0.3).sort((a, b) => b.point.x - a.point.x)[0];
  return h ? h.point.x : 0.98;
}

/** Vão da roda (túnel): meia calha por dentro do arco + parede interna, e friso (lábio) do arco na chapa */
export function criarVaoRoda(corpo, zc, lado) {
  const G = new THREE.Group(), N = 48, pos = [], idx = [], nor = [];
  const Rin = RARCO - 0.006, xs = [];
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * Math.PI, z = zc + Math.cos(th) * RARCO, y = YE + Math.sin(th) * RARCO;
    xs.push(Math.min(xDoFlanco(corpo, z, y), 1.0));
  }
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * Math.PI, c = Math.cos(th), s = Math.sin(th), x1 = XPORAO, x2 = xs[i] + 0.004;
    pos.push(x1, YE + s * Rin, zc + c * Rin, x2, YE + s * Rin, zc + c * Rin); nor.push(0, -s, -c, 0, -s, -c);
  }
  for (let i = 0; i < N; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  const liner = new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.95, side: THREE.DoubleSide });
  const calha = new THREE.Mesh(g, liner); G.add(calha);
  // parede interna (disco escuro) e fundo
  const sh = new THREE.Shape(), y0 = 0.19 - YE;                                                               // disco cortado na altura do assoalho
  for (let i = 0; i <= 48; i++) { const a = Math.asin(y0 / RARCO) + (i / 48) * (Math.PI - 2 * Math.asin(y0 / RARCO)); const p = [Math.cos(a) * RARCO, Math.sin(a) * RARCO]; i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1]); }
  const parede = new THREE.Mesh(new THREE.ShapeGeometry(sh), liner); parede.rotation.y = -Math.PI / 2; parede.position.set(XPORAO, YE, zc); G.add(parede);
  // friso do arco: tubo fino logo fora do furo da chapa
  const curva = []; for (let i = 0; i <= N; i++) { const th = (i / N) * Math.PI; curva.push(new THREE.Vector3(xs[i] + 0.0005, YE + Math.sin(th) * (RARCO + 0.0075), zc + Math.cos(th) * (RARCO + 0.0075))); }
  const tubo = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curva), 96, 0.0075, 8, false), opcFrisoMat); G.add(tubo);
  if (lado < 0) G.scale.x = -1;
  return G;
}
let opcFrisoMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 });
export function definirMaterialFriso(m) { opcFrisoMat = m; }

export function posicoesRodas() { return [{ z: ZF, lado: 1, dianteira: true }, { z: ZF, lado: -1, dianteira: true }, { z: ZT, lado: 1, dianteira: false }, { z: ZT, lado: -1, dianteira: false }]; }
export const X_CUBO = M.BITOLA / 2 - 0.0;                                                                                                       // centro do pneu; a roda local tem a face externa em +x
