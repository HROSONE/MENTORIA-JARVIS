// Detalhes em GEOMETRIA que o Kit acrescenta sozinho (junto com os shaders do detalhe.js):
//  - casas, prédios e equipamentos: peitoril e pingadeira em cada janela (acha cada vidro pela geometria), alguns aparelhos de ar-condicionado
//    e calhas verticais nos cantos da frente; tudo vira UMA malha por peça (cache por nome: custa uma chamada de desenho a mais por prédio);
//  - ruas: tampas de bueiro e bocas de lobo (grelhas) ao longo do meio-fio, sorteadas pela posição do ladrilho (a cidade nunca repete igual).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { detalhar } from './detalhe.js';

const COR_PEITORIL = [0.78, 0.76, 0.7], COR_AR = [0.84, 0.86, 0.88], COR_GRELHA = [0.12, 0.13, 0.15], COR_CALHA = [0.56, 0.58, 0.6];
function hash(a, b, c = 0) { let h = (Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791)) >>> 0; h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0; h = Math.imul(h ^ (h >>> 12), 0x297a2d39) >>> 0; return ((h ^ (h >>> 15)) >>> 0) / 4294967296; }

function caixa(w, h, d, cx, cy, cz, rotY, cor) {
  const g = new THREE.BoxGeometry(w, h, d); g.rotateY(rotY); g.translate(cx, cy, cz);
  const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set(cor, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}
function cano(r, h, cx, cy, cz, cor) {
  const g = new THREE.CylinderGeometry(r, r, h, 8); g.translate(cx, cy, cz);
  const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set(cor, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}

// ---- janelas: agrupa os triângulos do vidro em "panos" (cada janela é um quadrilátero ou uma caixa fina) pela posição dos vértices
function acharJanelas(o, nome0 = '') {
  const panos = [];
  o.traverse(m => {
    if (!m.isMesh || !/^Vidro/.test(m.name)) return;
    const g = m.geometry, P = g.attributes.position, idx = g.index, nTri = (idx ? idx.count : P.count) / 3, get = i => (idx ? idx.getX(i) : i);
    const chave = i => Math.round(P.getX(i) * 50) + ',' + Math.round(P.getY(i) * 50) + ',' + Math.round(P.getZ(i) * 50);
    const pai = new Map(), achar = k => { while (pai.get(k) !== k) { pai.set(k, pai.get(pai.get(k))); k = pai.get(k); } return k; }, une = (a, b) => { a = achar(a); b = achar(b); if (a !== b) pai.set(a, b); };
    const tris = [], marca = new Float32Array(P.count * 3).fill(-1); let idJan = 1 + hash(nome0.length, P.count) * 7;
    for (let t = 0; t < nTri; t++) {
      const ks = [0, 1, 2].map(j => chave(get(t * 3 + j))); ks.forEach(k => { if (!pai.has(k)) pai.set(k, k); }); une(ks[0], ks[1]); une(ks[1], ks[2]); tris.push({ ks, t });
    }
    const grupos = new Map();
    for (const { ks, t } of tris) { const r = achar(ks[0]); if (!grupos.has(r)) grupos.set(r, []); grupos.get(r).push(t); }
    const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), N = new THREE.Vector3();
    for (const ts of grupos.values()) {
      const mn = new THREE.Vector3(1e9, 1e9, 1e9), mx = new THREE.Vector3(-1e9, -1e9, -1e9); N.set(0, 0, 0);
      for (const t of ts) {
        A.fromBufferAttribute(P, get(t * 3)); B.fromBufferAttribute(P, get(t * 3 + 1)); C.fromBufferAttribute(P, get(t * 3 + 2));
        [A, B, C].forEach(v => { mn.min(v); mx.max(v); }); N.add(B.clone().sub(A).cross(C.clone().sub(A)));
      }
      const ext = mx.clone().sub(mn); if (ext.y < 0.4 || ext.y > 3.0) continue;
      const largo = Math.max(ext.x, ext.z), fino = Math.min(ext.x, ext.z); if (largo < 0.45 || largo > 3.4 || fino > 0.25) continue;      // só janelas de parede (não vidraça de teto, nem cortina inteira)
      const eixoX = ext.x < ext.z;                                                                                                         // vidro no plano YZ: a normal é ±X
      for (const t of ts) for (let j = 0; j < 3; j++) {                                                                                    // atributo `jan` = (id, u, v) do pano: o shader do vidro sorteia cortina, persiana ou sala escura
        const vi = get(t * 3 + j), uu = ((eixoX ? P.getZ(vi) - mn.z : P.getX(vi) - mn.x) / Math.max(largo, 1e-3)), vv = (P.getY(vi) - mn.y) / ext.y;
        marca[vi * 3] = idJan; marca[vi * 3 + 1] = uu; marca[vi * 3 + 2] = vv;
      }
      idJan += 1;
      const nrm = eixoX ? new THREE.Vector3(Math.sign(N.x) || 1, 0, 0) : new THREE.Vector3(0, 0, Math.sign(N.z) || 1);
      panos.push({ cx: (mn.x + mx.x) / 2, cy: (mn.y + mx.y) / 2, cz: (mn.z + mx.z) / 2, w: largo, h: ext.y, minY: mn.y, maxY: mx.y, n: nrm, centro: null });
    }
    g.setAttribute('jan', new THREE.BufferAttribute(marca, 3));
  });
  return panos;
}

const cacheGeo = new Map();
function geometriaPredio(o, nome) {
  if (cacheGeo.has(nome)) return cacheGeo.get(nome);
  const partes = [], panos = acharJanelas(o, nome);
  const caixaTudo = new THREE.Box3(); let paredes = null;
  o.traverse(m => { if (m.isMesh && m.name === 'Paredes') { const b = new THREE.Box3().setFromObject(m); paredes = paredes ? paredes.union(b) : b; } });
  const centro = paredes ? paredes.getCenter(new THREE.Vector3()) : new THREE.Vector3();
  panos.forEach((p, i) => {
    const fora = new THREE.Vector3(p.cx - centro.x, 0, p.cz - centro.z); if (fora.dot(p.n) < 0) p.n.multiplyScalar(-1);                  // normal sempre para fora da peça
    const rotY = Math.atan2(p.n.x, p.n.z), ox = p.n.x, oz = p.n.z;
    partes.push(caixa(p.w + 0.24, 0.07, 0.19, p.cx + ox * 0.11, p.minY - 0.035, p.cz + oz * 0.11, rotY, COR_PEITORIL));                       // peitoril
    partes.push(caixa(p.w + 0.16, 0.06, 0.12, p.cx + ox * 0.07, p.maxY + 0.05, p.cz + oz * 0.07, rotY, COR_PEITORIL));                         // pingadeira
    if (p.w > 0.75 && p.minY > 1.0 && hash(i, panos.length, nome.length) < 0.17) {                                                          // ar-condicionado sob a janela
      partes.push(caixa(0.8, 0.5, 0.34, p.cx + ox * 0.2, p.minY - 0.34, p.cz + oz * 0.2, rotY, COR_AR));
      partes.push(caixa(0.66, 0.36, 0.03, p.cx + ox * 0.375, p.minY - 0.34, p.cz + oz * 0.375, rotY, COR_GRELHA));
    }
  });
  if (paredes && panos.length) {                                                                                                            // calhas nos cantos da frente (+Z)
    const topo = paredes.max.y - 0.25;
    for (const x of [paredes.min.x + 0.11, paredes.max.x - 0.11]) partes.push(cano(0.04, topo - 0.2, x, 0.2 + (topo - 0.2) / 2, paredes.max.z + 0.05, COR_CALHA));
  }
  const geo = partes.length ? mergeGeometries(partes) : null;
  partes.forEach(g => g.dispose()); cacheGeo.set(nome, geo); return geo;
}
let _matPredio = null;
export function extrasPredio(o, nome) {
  const geo = geometriaPredio(o, nome);
  let semMarca = false; o.traverse(m => { if (m.isMesh && /^Vidro/.test(m.name) && !m.geometry.attributes.jan) semMarca = true; });
  if (semMarca) acharJanelas(o, nome);                                                      // segundo Kit na mesma página: a geometria dele ainda não tem o atributo das janelas
  if (!geo) return;
  if (!_matPredio) _matPredio = detalhar(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0.0 }), 'tinta');
  const m = new THREE.Mesh(geo, _matPredio); m.name = 'Extras3D'; m.castShadow = true; m.receiveShadow = true; o.add(m);
}

// ---- ruas: tampa de bueiro e boca de lobo
let _texBueiro = null, _texGrelha = null;
function textura(w, h, desenhar) { const c = document.createElement('canvas'); c.width = w; c.height = h; desenhar(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function matBueiro() {
  if (!_texBueiro) _texBueiro = textura(128, 128, (g, w, h) => {
    g.fillStyle = '#1a1b1d'; g.fillRect(0, 0, w, h); g.strokeStyle = '#3a3c40'; g.lineWidth = 4; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.stroke(); g.beginPath(); g.arc(64, 64, 46, 0, 7); g.stroke();
    g.strokeStyle = '#2e3033'; g.lineWidth = 3; for (let i = -64; i <= 64; i += 12) { g.beginPath(); g.moveTo(64 + i, 8); g.lineTo(64 + i, 120); g.stroke(); g.beginPath(); g.moveTo(8, 64 + i); g.lineTo(120, 64 + i); g.stroke(); }
    g.fillStyle = '#4a4c50'; g.font = 'bold 13px Arial'; g.textAlign = 'center'; g.fillText('HRYZ', 64, 70);
  });
  return new THREE.MeshStandardMaterial({ map: _texBueiro, roughness: 0.55, metalness: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
}
function matGrelha() {
  if (!_texGrelha) _texGrelha = textura(128, 256, (g, w, h) => {
    g.fillStyle = '#17181a'; g.fillRect(0, 0, w, h); g.fillStyle = '#050506'; for (let i = 0; i < 7; i++) g.fillRect(14, 18 + i * 32, 100, 16);
    g.strokeStyle = '#43454a'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  });
  return new THREE.MeshStandardMaterial({ map: _texGrelha, roughness: 0.6, metalness: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
}
let _mb = null, _mg = null;
export function extrasRua(o, nome, gx, gz) {
  if (nome !== 'rua-reta' && nome !== 'rua-cruzamento') return;
  if (!_mb) { _mb = matBueiro(); _mg = matGrelha(); }
  const y = 0.016;
  const bueiro = (x, z) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.4, 24), _mb); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; m.name = 'Bueiro'; o.add(m); };
  const grelha = (x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.0), _mg); m.rotation.set(-Math.PI / 2, 0, ry); m.position.set(x, y, z); m.receiveShadow = true; m.name = 'BocaDeLobo'; o.add(m); };
  if (nome === 'rua-reta') {
    if (hash(gx, gz, 1) < 0.65) bueiro((hash(gx, gz, 2) < 0.5 ? -1.75 : 1.75) + (hash(gx, gz, 3) - 0.5) * 0.7, (hash(gx, gz, 4) - 0.5) * 8);
    if (hash(gx, gz, 5) < 0.55) grelha(hash(gx, gz, 6) < 0.5 ? -3.12 : 3.12, (hash(gx, gz, 7) - 0.5) * 8, Math.PI / 2 * 0);          // grelha ao longo do meio-fio (0,5 m para a pista x 1 m ao longo)
  } else { bueiro(-1.2 + hash(gx, gz, 8) * 0.6, 1.4); bueiro(1.2, -1.0 + hash(gx, gz, 9) * 0.6); }
}
