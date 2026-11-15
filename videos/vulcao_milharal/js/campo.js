// O campo: restolho seco de milho (o campo estava limpo para o plantio), pilhas de galhos, ferramentas, chapéu de palha, placas (a de Pulido e o medidor) e as montanhas ao redor.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32, clamp, lerp } from './util.js';
import { UT, RUIDO } from './detalhe.js';

// ---------------------------------------------------------------- restolho: talos secos instanciados (balançam ao vento; ficam cinzentos com a cinza; somem dentro do cone)
function geoTalo() {
  const talo = new THREE.CylinderGeometry(0.008, 0.02, 2.0, 5, 3, true); talo.translate(0, 1.0, 0);
  const cor = (g, rgb) => { const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set(rgb, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
  const partes = [cor(talo, [0.62, 0.5, 0.26])];
  for (const [ay, h, rot] of [[0, 0.7, 0], [Math.PI * 0.66, 1.05, 0], [Math.PI * 1.33, 1.4, 0], [Math.PI * 0.33, 1.2, 0]]) {
    const pts = [], N = 5; for (let k = 0; k <= N; k++) { const u = k / N; pts.push([u * 0.7, h + u * 0.3 - u * u * 0.7, 0.055 * (1 - u * 0.6)]); }
    const pos = [], idx = [], col = []; pts.forEach((p, k) => { pos.push(p[0], p[1], -p[2], p[0], p[1], p[2]); const t = k / N; for (let q = 0; q < 2; q++) col.push(0.74 - 0.16 * t, 0.6 - 0.15 * t, 0.3 - 0.08 * t); if (k < N) { const a = k * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.rotateY(ay); partes.push(g.toNonIndexed());
  }
  for (const [rz, ry] of [[0.0, 0], [0.5, 2.1], [-0.5, 4.2]]) { const pend = new THREE.ConeGeometry(0.014, 0.38, 3); pend.translate(0, 0.19, 0); pend.rotateZ(rz); pend.rotateY(ry); pend.translate(0, 2.0, 0); partes.push(cor(pend.toNonIndexed(), [0.82, 0.66, 0.3])); }
  const lim = partes.map(p => { const q = p.index ? p.toNonIndexed() : p; q.deleteAttribute('uv'); q.deleteAttribute('normal'); return q; });
  const m = mergeGeometries(lim); m.computeVertexNormals(); return m;
}
export function criarRestolho(pai, { n = 4500, x0 = -60, x1 = 60, z0 = -60, z1 = 60, alturaEm = () => 0, semente = 5, clareira = [] } = {}) {
  const r = mulberry32(semente), geo = geoTalo();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide });
  mat.onBeforeCompile = sh => { sh.uniforms.uT = UT; sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;').replace('#include <begin_vertex>', '#include <begin_vertex>\n{ float ph = instanceMatrix[3].x * 0.31 + instanceMatrix[3].z * 0.23; float h = max(position.y, 0.0); transformed.x += sin(uT * 1.9 + ph) * 0.06 * h * h * 0.35; transformed.z += cos(uT * 1.5 + ph * 1.3) * 0.04 * h * h * 0.35; vec3 pc = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz; transformed *= smoothstep(1.6, 3.4, length(pc - cameraPosition)); }'); };
  mat.customProgramCacheKey = () => 'restolho';
  const im = new THREE.InstancedMesh(geo, mat, n), P = [], M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), c = new THREE.Color();
  // fileiras de plantio (espaçamento ~1 m) com falhas; deixa clareiras para as pilhas de galhos
  let k = 0; const fil = 1.05;
  for (let x = x0; x < x1 && k < n; x += fil) for (let z = z0; z < z1 && k < n; z += 0.62) { if (r() < 0.4) continue; const xx = x + (r() - 0.5) * 0.18, zz = z + (r() - 0.5) * 0.3; if (clareira.some(([cx, cz, rr]) => Math.hypot(xx - cx, zz - cz) < rr)) continue; P.push({ x: xx, z: zz, y: alturaEm(xx, zz), yaw: r() * 6.28, e: 0.55 + 0.7 * r(), tom: r() }); k++; }
  im.count = P.length; im.castShadow = true; im.frustumCulled = false; pai.add(im);
  const atualizar = (R = 0, cinza = 0, lavaOculta = null) => {
    P.forEach((p, i) => {
      const oculto = R > 0 && Math.hypot(p.x, p.z) < R * 1.06 + 1.5; const e = oculto ? 0.0001 : p.e;
      Q.setFromAxisAngle(V.set(0, 1, 0), p.yaw); V.set(p.x, p.y, p.z); S.set(e, e, e); M.compose(V, Q, S); im.setMatrixAt(i, M);
      const t = clamp(cinza * (0.8 + 0.4 * p.tom)); c.setRGB(lerp(1, 0.55, t), lerp(1, 0.55, t), lerp(1, 0.58, t)); im.setColorAt(i, c);
    });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  };
  return { atualizar, malha: im, n: P.length };
}

// ---------------------------------------------------------------- pilhas de galhos
export function criarPilhas(pai, lista, alturaEm) {
  const r = mulberry32(14), mat = new THREE.MeshStandardMaterial({ color: 0x5a3c1e, roughness: 1 }), grupos = [];
  for (const [x, z, e] of lista) {
    const g = new THREE.Group(); g.position.set(x, alturaEm(x, z), z);
    for (let i = 0; i < 46; i++) { const a = r() * 6.28, l = (0.5 + 0.9 * r()) * e, s = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.03, l, 5), mat); s.position.set(Math.cos(a) * 0.4 * r() * e, 0.25 * e + 0.55 * r() * e, Math.sin(a) * 0.4 * r() * e); s.rotation.set((r() - 0.5) * 2.4, a, (r() - 0.5) * 2.4); s.castShadow = true; g.add(s); }
    pai.add(g); grupos.push(g);
  }
  return grupos;
}

// ---------------------------------------------------------------- chapéu de palha (sombrero), enxada e poncho
export function criarSombrero(cor = '#d9b266') {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d'); x.fillStyle = cor; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 80; i++) { x.strokeStyle = `rgba(90,60,20,${0.1 + 0.15 * Math.random()})`; x.lineWidth = 1 + Math.random() * 2; x.beginPath(); x.moveTo(0, i * 3.2); x.lineTo(256, i * 3.2 + (Math.random() - 0.5) * 6); x.stroke(); }
  for (let i = 0; i < 80; i++) { x.strokeStyle = `rgba(255,235,170,${0.06 + 0.1 * Math.random()})`; x.beginPath(); x.moveTo(i * 3.2, 0); x.lineTo(i * 3.2, 256); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  const perfil = [[0, 0.135], [0.05, 0.133], [0.092, 0.12], [0.104, 0.07], [0.106, 0.012], [0.2, -0.002], [0.3, -0.02], [0.34, -0.04]].map(p => new THREE.Vector2(p[0], p[1]));
  const m = new THREE.Mesh(new THREE.LatheGeometry(perfil, 40), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, side: THREE.DoubleSide })); m.castShadow = true;
  const fita = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.108, 0.025, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0x3a2412, roughness: 0.9, side: THREE.DoubleSide })); fita.position.y = 0.035;
  const g = new THREE.Group(); g.add(m, fita); g.userData.acessorio = true; return g;
}
export function criarEnxada() {
  const g = new THREE.Group(), madeira = new THREE.MeshStandardMaterial({ color: 0x7a5530, roughness: 0.9 }), ferro = new THREE.MeshStandardMaterial({ color: 0x4a4e56, roughness: 0.5, metalness: 0.6 });
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 1.35, 8), madeira); cabo.position.y = 0.675; g.add(cabo);
  const lamina = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.17, 0.018), ferro); lamina.position.set(0, 1.36, 0.09); lamina.rotation.x = -1.1; g.add(lamina);
  const luva = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8), ferro); luva.position.y = 1.33; g.add(luva);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g;
}
export function criarPoncho(cor = 0xe0405a) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.215, 0.2, 20, 1, true), new THREE.MeshStandardMaterial({ color: cor, roughness: 0.95, side: THREE.DoubleSide })); m.castShadow = true;
  const g = new THREE.Group(); g.add(m); g.userData.acessorio = true; return g;
}

// ---------------------------------------------------------------- placas de madeira com texto (a de Pulido e o medidor com a marca HRYZ)
export function criarPlaca({ larg = 1.6, alt = 1.0, fundo = '#7a5a34', moldura = '#4a331b', desenhar, pernas = 1.6 } = {}) {
  const cv = document.createElement('canvas'); cv.width = 640; cv.height = Math.round(640 * alt / larg); const c = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const g = new THREE.Group(), face = new THREE.Mesh(new THREE.PlaneGeometry(larg, alt), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.55 }));
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(larg + 0.1, alt + 0.1, 0.06), new THREE.MeshStandardMaterial({ color: moldura, roughness: 0.9 }));
  face.position.set(0, pernas + alt / 2, 0.035); corpo.position.set(0, pernas + alt / 2, 0); corpo.castShadow = true; g.add(corpo, face);
  for (const sx of [-larg * 0.35, larg * 0.35]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, pernas + 0.2, 6), new THREE.MeshStandardMaterial({ color: moldura, roughness: 1 })); p.position.set(sx, (pernas + 0.2) / 2 - 0.1, -0.05); p.castShadow = true; g.add(p); }
  const redesenhar = (...a) => { desenhar(c, cv.width, cv.height, ...a); tex.needsUpdate = true; }; redesenhar(); return { grupo: g, redesenhar };
}
export function placaPulido() {
  return criarPlaca({ larg: 1.9, alt: 1.45, desenhar: (c, w, h) => {
    c.fillStyle = '#d8c08a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#5a3c1e'; c.lineWidth = 12; c.strokeRect(10, 10, w - 20, h - 20);
    c.fillStyle = '#3a2410'; c.textAlign = 'center'; c.font = 'bold 74px Arial Black, Arial, sans-serif'; c.fillText('ESTE VOLCÁN', w / 2, 140); c.fillText('ES PROPIEDAD', w / 2, 240); c.fillText('DE DIONISIO', w / 2, 340); c.fillText('PULIDO', w / 2, 440);
  } });
}
export function criarMedidor() {
  return criarPlaca({ larg: 1.7, alt: 1.15, pernas: 0.9, desenhar: (c, w, h, tempo = 'DIA 1', altura = '≈ 50 m') => {
    c.fillStyle = '#1d3a30'; c.fillRect(0, 0, w, h); c.strokeStyle = '#e8e2cc'; c.lineWidth = 10; c.strokeRect(10, 10, w - 20, h - 20);
    c.fillStyle = '#ffd24a'; c.font = 'bold 54px Arial Black, Arial, sans-serif'; c.textAlign = 'center'; c.fillText('HRYZ · MEDIÇÃO', w / 2, 90);
    c.fillStyle = '#f4f0dc'; c.font = 'bold 92px Arial, sans-serif'; c.fillText(tempo, w / 2, 215); c.fillStyle = '#ff9a3c'; c.font = 'bold 120px Arial, sans-serif'; c.fillText(altura, w / 2, 365);
  } });
}

// ---------------------------------------------------------------- montanhas ao redor (cristas em camadas com névoa) e pinheiros do kit ao longe
export function criarMontanhas(pai, { raio = 760, cores = [0x3d6a4a, 0x56709a, 0x8a78a8], altura = 95 } = {}) {
  const g = new THREE.Group(), r = mulberry32(6);
  cores.forEach((cor, k) => {
    const seg = 160, geo = new THREE.CylinderGeometry(raio + k * 120, raio + k * 120, 1, seg, 1, true), P = geo.attributes.position;
    for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2, h = altura * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(a * 5 + k * 2) * 0.6 + 0.4 * Math.sin(a * 13 + k))) * (1 + 0.5 * k * 0.3) + 12 * r(); P.setY(i, h); P.setY(i + seg + 1, -4); }
    geo.computeVertexNormals(); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cor, side: THREE.BackSide, fog: true })); g.add(m);
  });
  { const c = new THREE.Mesh(new THREE.CircleGeometry(1300, 72).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x8a7c48, fog: true })); c.position.y = -0.7; c.renderOrder = -2; g.add(c); }
  const meshes = g.children.slice(), bases = meshes.map(m => m.material.color.clone());
  const chaoCor = new THREE.Color(0x2c2b30);
  g.escurecer = (k, cinza = 0) => meshes.forEach((m, i) => { m.material.color.copy(bases[i]); if (i === meshes.length - 1) m.material.color.lerp(chaoCor, cinza); m.material.color.multiplyScalar(1 - 0.9 * k); });
  pai.add(g); return g;
}
