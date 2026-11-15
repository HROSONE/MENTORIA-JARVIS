// Bode-montês / cabra em 3D, 100% procedural (sem modelo externo): corpo por "loft" de seções elípticas, pernas articuladas com
// cinemática inversa no plano, cascos fendidos (dois dedos que abrem), chifres anelados, orelhas com a placa HRYZ, olhos âmbar de
// pupila horizontal, mandíbula que mastiga e PELO de verdade: milhares de fios instanciados na superfície, que balançam ao vento.
// Referencial local: x = frente, y = cima, z = lado; origem no chão, sob o meio do corpo. Unidades em metros (cernelha ~0,82 m).
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { clamp, lerp, mulberry32, suave } from './util.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const ventoU = { value: 0 }, ventoF = { value: 1 };       // tempo e força do vento (uniformes do pelo)

// ---------------------------------------------------------------- loft: tubo de seções elípticas ao longo de uma linha
export function loft(secs, { N = 14, ref = [0, 1, 0], cor = null, tampas = true } = {}) {
  const R = V(...ref), pos = [], idx = [], col = [], n = secs.length, c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const a = V(...secs[Math.max(0, i - 1)].c), b = V(...secs[Math.min(n - 1, i + 1)].c), t = b.sub(a).normalize();
    const bi = new THREE.Vector3().crossVectors(t, R).normalize(), no = new THREE.Vector3().crossVectors(bi, t).normalize(), s = secs[i];
    for (let k = 0; k < N; k++) {
      const th = k / N * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th), ry = sn > 0 ? (s.ryT ?? s.ry) : s.ry;
      const p = V(...s.c).addScaledVector(bi, s.rx * cs).addScaledVector(no, ry * sn);
      pos.push(p.x, p.y, p.z);
      if (cor) { cor(p, c); col.push(c.r, c.g, c.b); }
    }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < N; k++) { const a = i * N + k, b = i * N + (k + 1) % N, d = a + N, e = b + N; idx.push(a, d, b, b, d, e); }
  if (tampas) for (const [i, inv] of [[0, false], [n - 1, true]]) {
    const ci = pos.length / 3, p = secs[i].c; pos.push(p[0], p[1], p[2]); if (cor) { cor(V(...p), c); col.push(c.r, c.g, c.b); }
    for (let k = 0; k < N; k++) { const a = i * N + k, b = i * N + (k + 1) % N; inv ? idx.push(ci, a, b) : idx.push(ci, b, a); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (cor) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- cores da pelagem (íbex ao pôr do sol)
const C_DORSO = new THREE.Color('#d9a05a'), C_FLANCO = new THREE.Color('#b27a42'), C_ESCURO = new THREE.Color('#3a2418'), C_VENTRE = new THREE.Color('#f0d8a8'), C_CARA = new THREE.Color('#cf9d62');
function corCorpo(p, c) {                               // tronco: dorso claro, flanco médio, peito e baixo escuros, ventre claro
  const h = clamp((p.y - 0.5) / 0.42), fr = suave(clamp((p.x - 0.12) / 0.3));
  c.copy(C_FLANCO).lerp(C_DORSO, suave(h)).lerp(C_ESCURO, fr * 0.75 * (1 - 0.5 * h));
  if (p.y < 0.56) c.lerp(Math.abs(p.z) < 0.09 ? C_VENTRE : C_ESCURO, 0.6);
  if (p.x < -0.36) c.lerp(C_VENTRE, 0.45 * clamp((0.75 - p.y) / 0.2));
  return c;
}
const corPesc = (p, c) => c.copy(C_FLANCO).lerp(C_ESCURO, clamp(0.25 + 1.6 * (0.02 - p.y))).lerp(C_DORSO, clamp(p.y * 3) * 0.5);
const corCab = (p, c) => c.copy(C_CARA).lerp(C_ESCURO, clamp((p.x - 0.07) / 0.1) * 0.8 + clamp(p.y * 8 - 0.2) * 0.35).lerp(C_VENTRE, clamp(-p.y * 9 - 0.25) * 0.5 * clamp(1 - p.x * 6));
const corPerna = esc => (p, c) => c.copy(C_ESCURO).lerp(C_FLANCO, clamp(1 + p.y / 0.16) * esc);

// ---------------------------------------------------------------- pelo: fios instanciados na superfície
const geoFio = (() => {                                   // lâmina fina (3 faces), base em y=0 e ponta em y=1
  const g = new THREE.ConeGeometry(0.5, 1, 3, 1, true); g.translate(0, 0.5, 0); return g;
})();
function matPelo() {
  const m = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
  m.onBeforeCompile = sh => {
    sh.uniforms.uT = ventoU; sh.uniforms.uF = ventoF;
    sh.vertexShader = 'uniform float uT; uniform float uF;\n' + sh.vertexShader.replace('#include <begin_vertex>',
      `#include <begin_vertex>
       float fase = instanceMatrix[3].x * 9.0 + instanceMatrix[3].y * 6.0 + instanceMatrix[3].z * 11.0;
       float k = position.y * position.y;
       transformed.x += k * uF * (0.22 * sin(uT * 5.3 + fase) + 0.12 * sin(uT * 11.0 + fase * 1.7));
       transformed.z += k * uF * 0.16 * sin(uT * 4.1 + fase * 0.6);`);
  };
  return m;
}
const MAT_PELO = matPelo();
const MAT_PELE = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
// espalha n fios na malha; fluxo(p) dá a direção em que o pelo "deita"; comp/esp em metros
function pelo(mesh, n, { cor, fluxo, comp = [0.03, 0.05], esp = 0.006, deita = 0.75, semente = 1, filtro = null }) {
  const smp = new MeshSurfaceSampler(mesh).setRandomGenerator(mulberry32(semente)).build(), rnd = mulberry32(semente + 7);
  const im = new THREE.InstancedMesh(geoFio, MAT_PELO, n), p = V(), nn = V(), d = V(), q = new THREE.Quaternion(), s = V(), m = new THREE.Matrix4(), c = new THREE.Color(), up = V(0, 1, 0);
  let k = 0, tent = 0;
  while (k < n && tent < n * 6) {
    tent++; smp.sample(p, nn);
    if (filtro && !filtro(p)) continue;
    d.copy(fluxo(p)).multiplyScalar(deita).addScaledVector(nn, 1 - deita * 0.7).normalize();
    d.x += (rnd() - 0.5) * 0.35; d.y += (rnd() - 0.5) * 0.35; d.z += (rnd() - 0.5) * 0.35; d.normalize();
    q.setFromUnitVectors(up, d);
    const L = lerp(comp[0], comp[1], rnd()) * (typeof comp[2] === 'function' ? comp[2](p) : 1);
    s.set(esp * (0.7 + 0.6 * rnd()), L, esp * (0.7 + 0.6 * rnd()));
    m.compose(p, q, s); im.setMatrixAt(k, m);
    cor(p, c); c.offsetHSL(0, 0, (rnd() - 0.5) * 0.09); im.setColorAt(k, c);
    k++;
  }
  im.count = k; im.castShadow = false; im.receiveShadow = true; im.frustumCulled = false;
  mesh.add(im);
  return im;
}

// ---------------------------------------------------------------- texturas pequenas (olho, placa da orelha)
function texOlho() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
  const r = g.createRadialGradient(64, 64, 6, 64, 64, 64); r.addColorStop(0, '#f2c24a'); r.addColorStop(0.6, '#c98a1c'); r.addColorStop(1, '#5a3208');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#060403'; g.beginPath(); g.roundRect(22, 50, 84, 28, 12); g.fill();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function texPlaca() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 160; const g = cv.getContext('2d');
  g.fillStyle = '#f4c21d'; g.fillRect(0, 0, 256, 160); g.strokeStyle = '#b07d08'; g.lineWidth = 10; g.strokeRect(5, 5, 246, 150);
  g.fillStyle = '#2a1a00'; g.font = '900 84px "DejaVu Sans Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HRYZ', 128, 86);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let TEX_OLHO = null, TEX_PLACA = null;
const MAT_CHIFRE = new THREE.MeshStandardMaterial({ color: 0x9a8662, roughness: 0.65 });
const MAT_ORELHA = new THREE.MeshStandardMaterial({ color: 0x8a6e4e, roughness: 0.95 });
const MAT_CASCO = new THREE.MeshStandardMaterial({ color: 0x1c1512, roughness: 0.45 });
const MAT_ESC = new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.6 });

// ---------------------------------------------------------------- a cabra
// opções: bode (chifres grandes + barba), dens (densidade do pelo: 1 = close, 0.3 = longe), placa (HRYZ na orelha)
export function criarCabra({ bode = true, dens = 1, placa = true, semente = 1 } = {}) {
  TEX_OLHO ||= texOlho(); TEX_PLACA ||= texPlaca();
  const g = new THREE.Group(), corpo = new THREE.Group(); g.add(corpo);
  const fl = { tras: V(-0.9, -0.42, 0), baixo: V(-0.25, -0.97, 0) };
  const nf = n => Math.round(n * dens);
  // tronco
  const tronco = new THREE.Mesh(loft([
    { c: [-0.47, 0.72, 0], rx: 0.03, ry: 0.04 }, { c: [-0.43, 0.72, 0], rx: 0.125, ry: 0.15 }, { c: [-0.31, 0.725, 0], rx: 0.17, ry: 0.2 }, { c: [-0.1, 0.71, 0], rx: 0.19, ry: 0.225 },
    { c: [0.1, 0.7, 0], rx: 0.185, ry: 0.235 }, { c: [0.25, 0.715, 0], rx: 0.165, ry: 0.235 }, { c: [0.35, 0.75, 0], rx: 0.13, ry: 0.19 }, { c: [0.41, 0.79, 0], rx: 0.085, ry: 0.12 }], { N: 18, cor: corCorpo }), MAT_PELE);
  corpo.add(tronco);
  pelo(tronco, nf(11000), { cor: corCorpo, fluxo: p => p.y < 0.6 ? fl.baixo : fl.tras, comp: [0.03, 0.05, p => p.y < 0.58 || p.x > 0.25 ? 1.5 : 1], esp: 0.0055, semente });
  // rabo
  const rabo = new THREE.Group(); rabo.position.set(-0.45, 0.83, 0); corpo.add(rabo);
  const rm = new THREE.Mesh(loft([{ c: [0, 0, 0], rx: 0.03, ry: 0.03 }, { c: [-0.05, 0.05, 0], rx: 0.028, ry: 0.025 }, { c: [-0.09, 0.12, 0], rx: 0.012, ry: 0.012 }], { N: 8, ref: [0, 0, 1], cor: (p, c) => c.copy(C_ESCURO) }), MAT_PELE);
  rabo.add(rm); pelo(rm, nf(500), { cor: (p, c) => c.copy(C_ESCURO), fluxo: () => V(-0.5, 0.86, 0), comp: [0.04, 0.07], esp: 0.006, semente: semente + 1 });
  // pescoço (gira na base) e cabeça (gira na nuca)
  const pesc = new THREE.Group(); pesc.position.set(0.33, 0.84, 0); corpo.add(pesc);
  const LP = 0.34;
  const pm = new THREE.Mesh(loft([{ c: [-0.06, -0.1, 0], rx: 0.12, ry: 0.17 }, { c: [0.02, 0.02, 0], rx: 0.1, ry: 0.13 }, { c: [0.1, 0.14, 0], rx: 0.075, ry: 0.092 }, { c: [0.17, 0.25, 0], rx: 0.062, ry: 0.078 }, { c: [0.2, 0.3, 0], rx: 0.056, ry: 0.07 }], { N: 14, ref: [0, 0, 1], cor: corPesc }), MAT_PELE);
  pesc.add(pm);
  pelo(pm, nf(5200), { cor: corPesc, fluxo: p => V(-0.5, -0.86, 0), comp: [0.022, 0.04, p => p.x - p.y * 0.6 > 0.02 ? 1.5 : 1], esp: 0.0045, semente: semente + 2 });
  const cab = new THREE.Group(); cab.position.set(0.19, 0.29, 0); pesc.add(cab);
  const cm = new THREE.Mesh(loft([{ c: [-0.085, 0.0, 0], rx: 0.045, ry: 0.055 }, { c: [-0.04, 0.012, 0], rx: 0.07, ry: 0.082 }, { c: [0.03, 0.008, 0], rx: 0.066, ry: 0.078 }, { c: [0.1, -0.012, 0], rx: 0.05, ry: 0.058 },
    { c: [0.165, -0.032, 0], rx: 0.038, ry: 0.042 }, { c: [0.2, -0.045, 0], rx: 0.03, ry: 0.03 }, { c: [0.212, -0.05, 0], rx: 0.016, ry: 0.016 }], { N: 14, cor: corCab }), MAT_PELE);
  cab.add(cm);
  pelo(cm, nf(4200), { cor: corCab, fluxo: p => V(0.85, -0.5, 0), comp: [0.008, 0.016], esp: 0.0028, deita: 0.9, semente: semente + 3 });
  // focinho (nariz escuro), mandíbula
  const nariz = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), MAT_ESC); nariz.position.set(0.208, -0.04, 0); nariz.scale.set(0.8, 0.9, 1.25); cab.add(nariz);
  const mand = new THREE.Group(); mand.position.set(0.0, -0.045, 0); cab.add(mand);
  const mm = new THREE.Mesh(loft([{ c: [-0.02, -0.01, 0], rx: 0.045, ry: 0.03 }, { c: [0.07, -0.022, 0], rx: 0.036, ry: 0.024 }, { c: [0.15, -0.03, 0], rx: 0.026, ry: 0.018 }, { c: [0.185, -0.03, 0], rx: 0.014, ry: 0.01 }], { N: 10, cor: (p, c) => corCab(V(p.x, -0.06, p.z), c) }), MAT_PELE);
  mand.add(mm); pelo(mm, nf(500), { cor: (p, c) => corCab(V(p.x, -0.06, p.z), c), fluxo: () => V(0.7, -0.7, 0), comp: [0.008, 0.014], esp: 0.003, semente: semente + 4 });
  if (bode) { const b = new THREE.Mesh(loft([{ c: [0.1, -0.04, 0], rx: 0.02, ry: 0.014 }, { c: [0.09, -0.1, 0], rx: 0.016, ry: 0.014 }, { c: [0.07, -0.16, 0], rx: 0.004, ry: 0.004 }], { N: 6, ref: [1, 0, 0], cor: (p, c) => c.copy(C_ESCURO) }), MAT_PELE); mand.add(b); pelo(b, nf(350), { cor: (p, c) => c.copy(C_ESCURO), fluxo: () => V(-0.2, -1, 0), comp: [0.04, 0.07], esp: 0.005, semente: semente + 5 }); }
  // olhos, orelhas (com a placa HRYZ), chifres
  const olhos = [];
  for (const sz of [-1, 1]) {
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.017, 14, 10), new THREE.MeshStandardMaterial({ map: TEX_OLHO, roughness: 0.15 }));
    o.position.set(0.035, 0.03, sz * 0.058); o.rotation.y = -sz * Math.PI / 2 + 0.25 * sz; cab.add(o); olhos.push(o);
    const palp = new THREE.Mesh(new THREE.SphereGeometry(0.0195, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.42), MAT_ESC); palp.position.copy(o.position); palp.rotation.z = 0.25; cab.add(palp);
    const or = new THREE.Group(); or.position.set(-0.05, 0.05, sz * 0.058); cab.add(or); or.rotation.set(sz * 1.05, 0, 0.95);
    const og = new THREE.SphereGeometry(1, 12, 8); og.scale(0.011, 0.058, 0.03); og.translate(0, 0.05, 0);
    const om = new THREE.Mesh(og, MAT_ORELHA); or.add(om);
    g.userData['orelha' + (sz > 0 ? 'D' : 'E')] = or;
    if (placa && sz > 0) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.032), new THREE.MeshStandardMaterial({ map: TEX_PLACA, side: THREE.DoubleSide, roughness: 0.5 })); pl.position.set(-0.075, 0.012, 0.085); pl.rotation.set(0.1, 0.25, 0.2); cab.add(pl); }
    // chifre: curva para cima e para trás, abrindo para fora; anéis de crescimento
    const comp = bode ? 0.62 : 0.26, r0 = bode ? 0.034 : 0.02, pts = [], secs = [];
    for (let i = 0; i <= 22; i++) { const u = i / 22, a = u * (bode ? 2.1 : 1.3); pts.push([-0.03 - comp * 0.62 * (1 - Math.cos(a)) * 0.9, 0.06 + comp * 0.62 * Math.sin(a) * 0.95, sz * (0.03 + 0.16 * u * u * (bode ? 1 : 0.5))]); }
    pts.forEach((c, i) => { const u = i / 22, r = (r0 * Math.pow(1 - u, 0.8) + 0.004) * (1 + (bode ? 0.16 : 0.08) * Math.sin(u * 46)); secs.push({ c, rx: r * 0.8, ry: r * 1.15 }); });
    const ch = new THREE.Mesh(loft(secs, { N: 18, ref: [0, 0, 1] }), MAT_CHIFRE); ch.castShadow = true; cab.add(ch);
  }
  // pernas
  const pernas = [];
  const mkPerna = (x, y, z, frente) => {
    const P = { frente, raiz: new THREE.Group(), L1: frente ? 0.3 : 0.27, L2: frente ? 0.26 : 0.27, L0: frente ? 0 : 0.2, HC: 0.07, anc: V(x, y, z) };
    P.raiz.position.set(x, y, z); corpo.add(P.raiz);
    let topo = P.raiz;
    if (!frente) {                                          // coxa (fêmur) + joelho
      const cx = new THREE.Mesh(loft([{ c: [0, 0.06, 0], rx: 0.085, ry: 0.13 }, { c: [0, -0.08, 0], rx: 0.075, ry: 0.11 }, { c: [0, -0.2, 0], rx: 0.05, ry: 0.06 }], { N: 10, ref: [1, 0, 0], cor: (p, c) => corCorpo(V(-0.33, 0.66 + p.y, z), c) }), MAT_PELE);
      P.raiz.add(cx); pelo(cx, nf(900), { cor: (p, c) => corCorpo(V(-0.33, 0.66 + p.y, z), c), fluxo: () => V(-0.3, -0.95, 0), comp: [0.03, 0.05], esp: 0.006, semente: semente + 11 + x * 10 + z * 100 });
      P.joelho0 = new THREE.Group(); P.joelho0.position.set(0, -P.L0, 0); P.raiz.add(P.joelho0); topo = P.joelho0;
    }
    const w = frente ? [0.055, 0.04, 0.03] : [0.05, 0.036, 0.027];
    const s1 = new THREE.Mesh(loft([{ c: [0, 0.02, 0], rx: w[0], ry: w[0] * 1.25 }, { c: [0, -P.L1 * 0.5, 0], rx: w[1], ry: w[1] * 1.2 }, { c: [0, -P.L1, 0], rx: w[2], ry: w[2] * 1.15 }], { N: 10, ref: [1, 0, 0], cor: corPerna(frente ? 0.25 : 0.7) }), MAT_PELE);
    topo.add(s1); pelo(s1, nf(700), { cor: corPerna(frente ? 0.25 : 0.7), fluxo: () => V(0, -1, 0), comp: [0.02, 0.035], esp: 0.005, semente: semente + 21 + x * 10 + z * 100 });
    P.s1 = topo; P.j = new THREE.Group(); P.j.position.set(0, -P.L1, 0); topo.add(P.j);
    const s2 = new THREE.Mesh(loft([{ c: [0, 0.015, 0], rx: 0.03, ry: 0.034 }, { c: [0, -P.L2 * 0.5, 0], rx: 0.02, ry: 0.024 }, { c: [0, -P.L2, 0], rx: 0.024, ry: 0.028 }], { N: 8, ref: [1, 0, 0], cor: (p, c) => c.copy(C_ESCURO) }), MAT_PELE);
    P.j.add(s2); pelo(s2, nf(450), { cor: (p, c) => c.copy(C_ESCURO), fluxo: () => V(0, -1, 0), comp: [0.014, 0.024], esp: 0.0045, semente: semente + 31 + x * 10 + z * 100 });
    P.pe = new THREE.Group(); P.pe.position.set(0, -P.L2, 0); P.j.add(P.pe);
    // quartela + casco fendido: dois dedos (cada um gira para abrir) e dois esporões atrás
    const q = new THREE.Mesh(loft([{ c: [0, 0.01, 0], rx: 0.024, ry: 0.026 }, { c: [0.012, -0.035, 0], rx: 0.03, ry: 0.028 }], { N: 8, ref: [1, 0, 0], cor: (p, c) => c.copy(C_ESCURO) }), MAT_PELE); P.pe.add(q);
    P.dedos = [];
    for (const sd of [-1, 1]) {
      const d = new THREE.Group(); d.position.set(0.012, -0.034, sd * 0.012); P.pe.add(d);
      const dm = new THREE.Mesh(loft([{ c: [-0.012, 0, 0], rx: 0.0125, ry: 0.02 }, { c: [0.004, -0.018, 0], rx: 0.0135, ry: 0.024 }, { c: [0.022, -0.033, 0], rx: 0.011, ry: 0.02 }, { c: [0.04, -0.036, 0], rx: 0.004, ry: 0.006 }], { N: 8, ref: [1, 0, 0] }), MAT_CASCO);
      dm.castShadow = true; d.add(dm); P.dedos.push(d);
      const e = new THREE.Mesh(new THREE.ConeGeometry(0.007, 0.022, 6), MAT_CASCO); e.position.set(-0.02, -0.005, sd * 0.014); e.rotation.z = 2.4; P.pe.add(e);
    }
    pernas.push(P); return P;
  };
  const FE = mkPerna(0.27, 0.62, -0.1, true), FD = mkPerna(0.27, 0.62, 0.1, true), TE = mkPerna(-0.33, 0.66, -0.1, false), TD = mkPerna(-0.33, 0.66, 0.1, false);
  g.traverse(o => { if (o.isMesh && !o.isInstancedMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // cinemática inversa de uma perna: alvo (x, y) do casco em coordenadas do corpo; lat = desvio lateral (m); abre = dedos abertos (0..1)
  function perna(P, tx, ty, { lat = 0, abre = 0, ponta = 0 } = {}) {
    let ox = P.anc.x, oy = P.anc.y, base = 0;
    const alt = oy - ty;
    P.raiz.rotation.x = Math.atan2(lat, Math.max(0.2, alt));
    if (!P.frente) {                                        // a coxa avança mais quando a perna encolhe
      const dd = Math.hypot(tx - ox, ty + P.HC - oy), enc = clamp(1 - dd / (P.L0 + P.L1 + P.L2 - 0.02));
      base = 0.42 + 1.5 * enc + 0.25 * clamp((tx - ox) / 0.3, -1, 1);
      P.raiz.rotation.z = base; ox += Math.sin(base) * P.L0; oy -= Math.cos(base) * P.L0;
    }
    const dx = tx - ox, dy0 = (ty + P.HC) - oy, dy = -Math.hypot(dy0, lat), d = clamp(Math.hypot(dx, dy), 0.08, P.L1 + P.L2 - 0.002), phi = Math.atan2(dx, -dy);
    const a1 = Math.acos(clamp((P.L1 * P.L1 + d * d - P.L2 * P.L2) / (2 * P.L1 * d), -1, 1)), a2 = Math.PI - Math.acos(clamp((P.L1 * P.L1 + P.L2 * P.L2 - d * d) / (2 * P.L1 * P.L2), -1, 1));
    const s = P.frente ? 1 : -1, up = phi + s * a1;
    if (P.frente) P.raiz.rotation.z = up; else P.joelho0.rotation.z = up - base;
    P.j.rotation.z = -s * a2;
    P.pe.rotation.z = -(up - s * a2) + ponta;                // casco nivelado (ou apontado com "ponta")
    P.dedos[0].rotation.y = 0.05 + 0.55 * abre; P.dedos[1].rotation.y = -0.05 - 0.55 * abre;
  }
  let ult = {};
  const g_ult = o => { ult = o; };
  // pose completa. o: pes = [[x,y],...] na ordem FE, FD, TE, TD (coordenadas do corpo), opções por perna em pesO; pescoço/cabeça em graus
  const REP = [[0.27, 0], [0.27, 0], [-0.33, 0], [-0.33, 0]];
  function pose(o = {}) {
    g_ult(o);
    const { pes = REP, pesO = [], alt = 0, incl = 0, rolo = 0, pesc: ap = 0, cabeca = 0, vira = 0, viraCab = 0, mast = 0, rabo: ar = 0, orelha = 0, lado = 0 } = o;
    corpo.position.set(0, alt, lado); corpo.rotation.set(rolo, 0, incl);
    [FE, FD, TE, TD].forEach((P, i) => { const f = pes[i] || REP[i]; perna(P, f[0], f[1] - alt, pesO[i] || {}); });
    pesc.rotation.set(0, vira * 0.5, ap); cab.rotation.set(0, vira * 0.5 + viraCab, cabeca - ap * 0.6);
    mand.rotation.z = -0.05 - 0.16 * mast; mand.position.z = 0.006 * Math.sin(mast * Math.PI * 2);
    rabo.rotation.z = ar;
    g.userData.orelhaD.rotation.z = 0.95 + orelha; g.userData.orelhaE.rotation.z = 0.95 + orelha;
  }
  pose();
  return { get _ult() { return ult; }, grupo: g, corpo, pesc, cab, mand, pernas: { FE, FD, TE, TD }, pose, REP };
}

// ---------------------------------------------------------------- movimentos prontos (devolvem o objeto de pose)
// andar: fase 0..1 por ciclo; passo = comprimento; devolve os alvos dos 4 cascos (o corpo deve avançar passo/0.65 por ciclo)
export function passoAndar(fase, passo = 0.3, sobe = 0.07, junto = 0) {
  const off = [0, 0.5, 0.75, 0.25], AP = 0.65;
  const pes = [0, 1, 2, 3].map(i => {
    const p = ((fase + off[i]) % 1 + 1) % 1, x0 = (i < 2 ? 0.27 : -0.33) * (1 - junto);
    if (p < AP) return [x0 + passo * (0.5 - p / AP), 0];
    const u = (p - AP) / (1 - AP); return [x0 + passo * (-0.5 + suave(u)), sobe * Math.sin(Math.PI * u)];
  });
  return { pes, alt: 0.008 * Math.sin(fase * Math.PI * 4), cabeca: 0.03 * Math.sin(fase * Math.PI * 4 + 1) };
}
// salto: u 0..1 (agacha, empurra, voa, estica a frente, pousa, amortece). Devolve pés e inclinação; a trajetória do corpo é de quem chama.
export function passoSalto(u) {
  const K = (pts) => { for (let i = 1; i < pts.length; i++) if (u <= pts[i][0]) { const k = suave((u - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0])); return pts[i - 1][1].map((v, j) => lerp(v, pts[i][1][j], k)); } return pts[pts.length - 1][1]; };
  const fr = K([[0, [0.27, 0]], [0.14, [0.3, 0.02]], [0.3, [0.44, 0.22]], [0.55, [0.5, 0.3]], [0.78, [0.46, 0.05]], [0.88, [0.3, 0]], [1, [0.27, 0]]]);
  const tr = K([[0, [-0.33, 0]], [0.14, [-0.28, 0]], [0.3, [-0.62, 0.08]], [0.5, [-0.5, 0.3]], [0.72, [-0.24, 0.26]], [0.9, [-0.3, 0.02]], [1, [-0.33, 0]]]);
  const alt = K([[0, [0]], [0.14, [-0.1]], [0.3, [0.02]], [0.8, [0.02]], [0.9, [-0.09]], [1, [0]]])[0];
  const incl = K([[0, [0]], [0.14, [0.06]], [0.3, [0.3]], [0.55, [0.1]], [0.78, [-0.22]], [0.9, [-0.05]], [1, [0]]])[0];
  return { pes: [fr, [fr[0] - 0.04, fr[1]], tr, [tr[0] + 0.04, tr[1]]], alt, incl, pesc: -0.5 * incl, abre: clamp(1 - Math.abs(u - 0.86) / 0.08) };
}
