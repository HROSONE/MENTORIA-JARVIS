// MOTO ESPORTIVA VERMELHA (classe 600 cc), procedural em Three.js — a mesma moto do Blender (criar_moto.py), com as mesmas medidas:
// entre-eixos 1,375 m, comprimento ~2,03 m, banco a ~0,83 m, cáster 24°, trail ~97 mm, pneus 120/70 ZR17 e 180/55 ZR17, discos de 310 mm.
// Genérica e fictícia ("HRYZ 600 RS"). Convenção do kit: metros, frente em +Z, +X = lado esquerdo do piloto, pneus em y = 0.
// Peças móveis: direção (esterco gira em volta da coluna), rodas (rodar), balança (suspensao), descanso (descanso(true/false)).
// As tabelas de seções estão em coordenadas do Blender (x, y = trás, z = cima) e são convertidas por B().
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as K from '../kit/kit.js';

const PI = Math.PI;
const B = (x, y, z) => new THREE.Vector3(x, z, -y);                    // Blender → Three.js
const Bv = v => B(v[0], v[1], v[2]);
export const M = { L: 2.03, W: 0.72, H: 1.12, EE: 1.375, RF: 0.300, RT: 0.315 };
const AF = [0, -0.690, M.RF], AT = [0, 0.685, M.RT];
const CASTER = 24 * PI / 180, U = [0, Math.sin(CASTER), Math.cos(CASTER)];
const G0y = AF[1] - 0.097;
const COL = z => [0, G0y + U[1] * (z / U[2]), z];
const PIVO = [0, 0.130, 0.420], PINHAO = [0.118, 0.055, 0.395];
const add3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

function materiais(cor) {
  const fis = (o) => new THREE.MeshPhysicalMaterial(o), std = (o) => new THREE.MeshStandardMaterial(o);
  return {
    pintura: fis({ color: cor, roughness: 0.22, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04, side: THREE.DoubleSide }),
    branco: fis({ color: 0xe8eaec, roughness: 0.3, clearcoat: 1, side: THREE.DoubleSide }),
    preto: std({ color: 0x141416, roughness: 0.55 }), fosco: std({ color: 0x1c1c1f, roughness: 0.8 }),
    carbono: fis({ color: 0x1a1b1f, roughness: 0.3, metalness: 0.4, clearcoat: 0.8 }),
    aluminio: std({ color: 0xc4c7cc, roughness: 0.32, metalness: 1 }), quadro: std({ color: 0xa4a7ad, roughness: 0.42, metalness: 1 }),
    cromo: std({ color: 0xe8eaee, roughness: 0.07, metalness: 1 }), dourado: std({ color: 0xe2a63a, roughness: 0.25, metalness: 1 }),
    titanio: std({ color: 0xa9a3a6, roughness: 0.3, metalness: 1 }), motor: std({ color: 0x2a2a2e, roughness: 0.42, metalness: 0.6 }),
    disco: std({ color: 0xc8c9cc, roughness: 0.35, metalness: 1, side: THREE.DoubleSide }), borracha: std({ color: 0x161617, roughness: 0.9 }),
    banco: std({ color: 0x1b1b1d, roughness: 0.75 }), roda: fis({ color: 0x111113, roughness: 0.35, metalness: 0.5, clearcoat: 0.6 }),
    pinca: std({ color: 0xc0141a, roughness: 0.3, metalness: 0.2 }), mola: std({ color: 0xf5b80d, roughness: 0.35, metalness: 0.2 }),
    bolha: fis({ color: 0x1a1d22, roughness: 0.04, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }),
    vidroFarol: fis({ color: 0xdfe6ec, roughness: 0.03, transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
    espelho: std({ color: 0xeef2f6, roughness: 0.02, metalness: 1 }), corrente: std({ color: 0x5a524c, roughness: 0.45, metalness: 1 }),
    tela: std({ color: 0x0a0f18, emissive: 0x2766d8, emissiveIntensity: 0.6, roughness: 0.1 }),
  };
}

// ------------------------------------------------------------------------------------------------ geometria
function geo(V, F, suave = true) {
  const pos = [], idx = [];
  V.forEach(v => pos.push(v.x, v.y, v.z));
  F.forEach(f => { for (let i = 1; i < f.length - 1; i++) idx.push(f[0], f[i], f[i + 1]); });
  let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  if (!suave) g = g.toNonIndexed();
  g.computeVertexNormals(); return g;
}
const malha = (g, m, sombra = true) => { const o = new THREE.Mesh(g, m); o.castShadow = sombra; o.receiveShadow = true; return o; };

/** suaviza uma sequência de laços (Catmull-Rom entre estações) — faz o papel da subdivisão do Blender */
function suavizar(loops, sub = 4) {
  if (loops.length < 3 || sub < 2) return loops;
  const out = [], n = loops[0].length, P = i => loops[Math.max(0, Math.min(loops.length - 1, i))];
  for (let i = 0; i < loops.length - 1; i++) for (let s = 0; s < sub; s++) {
    const t = s / sub, t2 = t * t, t3 = t2 * t, p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
    out.push(Array.from({ length: n }, (_, j) => new THREE.Vector3(cr(p0[j].x, p1[j].x, p2[j].x, p3[j].x), cr(p0[j].y, p1[j].y, p2[j].y, p3[j].y), cr(p0[j].z, p1[j].z, p2[j].z, p3[j].z))));
  }
  out.push(loops[loops.length - 1]); return out;
}
function loft(loops, { fechado = true, tampa = [true, true], sub = 1, suave = true } = {}) {
  loops = suavizar(loops, sub);
  const n = loops[0].length, V = loops.flat(), F = [];
  for (let i = 0; i < loops.length - 1; i++) for (let j = 0; j < (fechado ? n : n - 1); j++) { const a = i * n + j, b = i * n + (j + 1) % n; F.push([a, b, b + n, a + n]); }
  if (fechado && tampa[0]) F.push([...Array(n).keys()].reverse());
  if (fechado && tampa[1]) F.push([...Array(n).keys()].map(k => (loops.length - 1) * n + k));
  return geo(V, F, suave);
}
/** seção superelíptica (coordenadas do Blender) na estação y */
function sec(y, zc, w, ht, hb = ht, n = 2.6, k = 32, xc = 0) {
  const pts = [];
  for (let i = 0; i < k; i++) {
    const t = 2 * PI * i / k, c = Math.cos(t), s = Math.sin(t);
    pts.push(B(xc + w * Math.sign(c) * Math.abs(c) ** (2 / n), y, zc + (s >= 0 ? ht : hb) * Math.sign(s) * Math.abs(s) ** (2 / n)));
  }
  return pts;
}
/** revolução em volta do eixo X: perfil [(x lateral, raio)] */
function revolucao(perfil, c, seg = 64, fechar = false) {
  const n = perfil.length, V = [], F = [];
  for (let i = 0; i < seg; i++) { const a = 2 * PI * i / seg; for (const [x, r] of perfil) V.push(B(c[0] + x, c[1] + r * Math.cos(a), c[2] + r * Math.sin(a))); }
  for (let i = 0; i < seg; i++) for (let j = 0; j < (fechar ? n : n - 1); j++) {
    const a = i * n + j, b = ((i + 1) % seg) * n + j, a2 = i * n + (j + 1) % n, b2 = ((i + 1) % seg) * n + (j + 1) % n; F.push([a, b, b2, a2]);
  }
  return geo(V, F);
}
/** barra retangular afinando de p0 a p1 (pontos do Blender) */
function barra(p0, p1, w0, h0, w1 = w0, h1 = h0, up = [1, 0, 0]) {
  const a = Bv(p0), b = Bv(p1), d = b.clone().sub(a).normalize(), u = Bv(up); u.sub(d.clone().multiplyScalar(u.dot(d))).normalize(); const v = d.clone().cross(u);
  const ret = (p, w, h) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => p.clone().addScaledVector(u, sx * w / 2).addScaledVector(v, sy * h / 2));
  return loft([ret(a, w0, h0), ret(b, w1, h1)], { suave: false });
}
function viga(caminho, larg, alt, up = [1, 0, 0], sub = 3) {
  const P = caminho.map(Bv), L = [];
  P.forEach((p, i) => {
    const d = P[Math.min(i + 1, P.length - 1)].clone().sub(P[Math.max(i - 1, 0)]).normalize(), u = Bv(up); u.sub(d.clone().multiplyScalar(u.dot(d))).normalize(); const v = d.clone().cross(u);
    const w = Array.isArray(larg) ? larg[i] : larg, h = Array.isArray(alt) ? alt[i] : alt;
    L.push([[-1, -1], [-0.7, -1], [0.7, -1], [1, -1], [1, -0.7], [1, 0.7], [1, 1], [0.7, 1], [-0.7, 1], [-1, 1], [-1, 0.7], [-1, -0.7]].map(([sx, sy]) => p.clone().addScaledVector(u, sx * w / 2).addScaledVector(v, sy * h / 2)));
  });
  return loft(L, { sub });
}
/** cilindro entre dois pontos do Blender */
function cil(p0, p1, r, m, n = 24, r2 = r) {
  const a = Bv(p0), b = Bv(p1), d = b.clone().sub(a);
  const o = malha(new THREE.CylinderGeometry(r2, r, d.length(), n), m);
  o.position.copy(a).add(b).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return o;
}
function tubo(pts, r, m, seg = 40, radial = 10) {
  return malha(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(Bv)), seg, r, radial, false), m);
}
/** chapa recortada (Shape com furos) no plano lateral (normal em X), centrada em c (Blender) e em x */
function chapaLateral(shape, c, x, esp, m) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: esp, bevelEnabled: false, curveSegments: 48 }); g.translate(0, 0, -esp / 2);
  g.rotateY(PI / 2);                                                    // espessura em X; o desenho (u, v) fica em (-z, y) do Three
  const o = malha(g, m); o.position.copy(B(c[0] + x, c[1], c[2])); return o;
}
const furo = (r, cx, cy) => { const p = new THREE.Path(); p.absarc(cx, cy, r, 0, 2 * PI, true); return p; };

/** texto em canvas (decalque) */
function decal(txt, w, h, cor, fonte = 900) {
  const t = K.tela(512, Math.round(512 * h / w), (g, W, H) => { g.fillStyle = cor; g.font = `italic ${fonte} ${Math.round(H * 0.82)}px ${K.FONTE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, W / 2, H / 2 + H * 0.04); });
  return malha(new THREE.PlaneGeometry(w, h), new THREE.MeshPhysicalMaterial({ map: t, transparent: true, roughness: 0.3, clearcoat: 1, polygonOffset: true, polygonOffsetFactor: -4, depthWrite: false }), false);
}

// ------------------------------------------------------------------------------------------------ rodas
function pneu(r, larg, c, m) {
  const hs = r - 0.2159, perfil = [[-larg * 0.40, 0.2125], [-larg * 0.47, 0.2159 + hs * 0.25], [-larg * 0.5, 0.2159 + hs * 0.55]];
  for (let i = 1; i < 18; i++) { const t = -1 + 2 * i / 18; perfil.push([t * larg * 0.48, r - (1 - Math.cos(t * 1.2)) * hs * 0.62]); }
  perfil.push([larg * 0.5, 0.2159 + hs * 0.55], [larg * 0.47, 0.2159 + hs * 0.25], [larg * 0.40, 0.2125]);
  const gs = [revolucao(perfil, c, 80)];
  for (let k = 0; k < 18; k++) for (const lado of [1, -1]) {                // sulcos curtos e inclinados
    const a = 2 * PI * k / 18, pts = [];
    for (let j = 0; j < 5; j++) { const t = j / 4, aa = a + lado * 0.05 + t * 0.16 * lado, x = lado * (larg * 0.12 + t * larg * 0.26), rr = r - (1 - Math.cos((x / (larg * 0.48)) * 1.2)) * hs * 0.62 + 0.0006; pts.push(B(c[0] + x, c[1] + rr * Math.cos(aa), c[2] + rr * Math.sin(aa))); }
    gs.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, 0.0026, 4, false));
  }
  const borr = malha(mergeGeometries([gs[0]]), m.borracha), sulcos = malha(mergeGeometries(gs.slice(1)), m.fosco, false);
  return [borr, sulcos];
}
function roda(r, largPneu, largAro, c, m, discos, coroa = false) {
  const pecas = [...pneu(r, largPneu, c, m)], ra = 0.2159;
  pecas.push(malha(revolucao([[-largAro / 2, ra + 0.006], [-largAro / 2 + 0.004, ra - 0.012], [-largAro / 2 + 0.012, ra - 0.018], [largAro / 2 - 0.012, ra - 0.018], [largAro / 2 - 0.004, ra - 0.012], [largAro / 2, ra + 0.006], [largAro / 2 - 0.004, ra - 0.004], [-largAro / 2 + 0.004, ra - 0.004]], c, 80, true), m.roda));
  for (const s of [1, -1]) pecas.push(malha(revolucao([[s * (largAro / 2 + 0.0005), ra - (s > 0 ? 0.010 : 0.004)], [s * (largAro / 2 + 0.0005), ra - (s > 0 ? 0.004 : 0.010)]], c, 80), m.pinca, false));
  pecas.push(cil([c[0] - largAro * 0.42, c[1], c[2]], [c[0] + largAro * 0.42, c[1], c[2]], 0.045, m.roda, 28));
  pecas.push(cil([c[0] - largAro * 0.6, c[1], c[2]], [c[0] + largAro * 0.6, c[1], c[2]], 0.012, m.aluminio, 14));
  for (let i = 0; i < 3; i++) {                                             // 3 pares de raios em Y
    const a0 = 2 * PI * i / 3 + PI / 6;
    for (const s of [-1, 1]) {
      const a1 = a0 + s * 0.20;
      pecas.push(malha(barra([c[0], c[1] + 0.05 * Math.cos(a0), c[2] + 0.05 * Math.sin(a0)], [c[0], c[1] + (ra - 0.016) * Math.cos(a1), c[2] + (ra - 0.016) * Math.sin(a1)], 0.030, 0.026, 0.020, 0.016), m.roda));
    }
  }
  for (const [x, rd] of discos) {                                            // disco furado + flange com botões
    const sh = new THREE.Shape(); sh.absarc(0, 0, rd, 0, 2 * PI, false); sh.holes.push(furo(rd - 0.045, 0, 0));
    for (let k = 0; k < 30; k++) { const a = 2 * PI * k / 30, rr = rd - (k % 2 ? 0.015 : 0.030); sh.holes.push(furo(0.0035, rr * Math.cos(a), rr * Math.sin(a))); }
    pecas.push(chapaLateral(sh, c, x, 0.005, m.disco));
    const fl = new THREE.Shape(); fl.absarc(0, 0, rd - 0.043, 0, 2 * PI, false); fl.holes.push(furo(0.05, 0, 0));
    for (let k = 0; k < 6; k++) fl.holes.push(furo(0.018, 0.085 * Math.cos(2 * PI * k / 6), 0.085 * Math.sin(2 * PI * k / 6)));
    pecas.push(chapaLateral(fl, c, x, 0.008, m.aluminio));
    for (let k = 0; k < 10; k++) { const a = 2 * PI * k / 10, rr = rd - 0.045; pecas.push(cil([c[0] + x - 0.006, c[1] + rr * Math.cos(a), c[2] + rr * Math.sin(a)], [c[0] + x + 0.006, c[1] + rr * Math.cos(a), c[2] + rr * Math.sin(a)], 0.006, m.aluminio, 8)); }
  }
  if (coroa) {                                                              // coroa de 45 dentes, lado esquerdo
    const sh = new THREE.Shape();
    for (let k = 0; k <= 90; k++) { const a = 2 * PI * k / 90, rr = k % 2 === 0 ? 0.106 : 0.098; k ? sh.lineTo(rr * Math.cos(a), rr * Math.sin(a)) : sh.moveTo(rr * Math.cos(a), rr * Math.sin(a)); }
    sh.holes.push(furo(0.03, 0, 0)); for (let k = 0; k < 5; k++) sh.holes.push(furo(0.022, 0.062 * Math.cos(2 * PI * k / 5 + 0.3), 0.062 * Math.sin(2 * PI * k / 5 + 0.3)));
    pecas.push(chapaLateral(sh, c, 0.118, 0.006, m.aluminio));
    pecas.push(cil([c[0] + 0.06, c[1], c[2]], [c[0] + 0.115, c[1], c[2]], 0.055, m.aluminio, 28));
  }
  const giro = new THREE.Group(); giro.position.copy(Bv(c));
  for (const p of pecas) { p.position.sub(giro.position); giro.add(p); }
  return giro;
}
function pinca(c, x, rd, a0, a1, m, larg = 0.05, alt = 0.055) {
  const L = [];
  for (let i = 0; i <= 8; i++) {
    const a = a0 + (a1 - a0) * i / 8, dy = Math.cos(a), dz = Math.sin(a), rm = rd - alt * 0.35, esp = 1 - 0.25 * (2 * i / 8 - 1) ** 4;
    L.push([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => B(c[0] + x + sx * larg / 2 * esp, c[1] + dy * (rm + sy * alt / 2 * esp), c[2] + dz * (rm + sy * alt / 2 * esp))));
  }
  return malha(loft(L, { sub: 2 }), m);
}

// ------------------------------------------------------------------------------------------------ moto
export function criar(opc = {}) {
  const G = new THREE.Group(); G.name = 'moto';
  const m = materiais(opc.cor ?? 0xb3141c), add = (o, p = G) => { p.add(o); return o; };
  const luzes = { farol: [], freio: [], re: [], setaE: [], setaD: [], posicao: [] };
  const emis = (cor, base = 0.35) => new THREE.MeshStandardMaterial({ color: new THREE.Color(cor).multiplyScalar(base), emissive: new THREE.Color(cor), emissiveIntensity: 0, roughness: 0.1 });

  // ---------------- quadro de dupla viga + subchassi
  const cab = COL(0.86);
  add(cil(COL(0.79), COL(0.935), 0.035, m.quadro, 20));
  for (const s of [1, -1]) {
    add(malha(viga([add3(cab, [s * 0.03, 0.02, 0.02]), [s * 0.11, -0.30, 0.84], [s * 0.165, -0.12, 0.78], [s * 0.17, 0.05, 0.70], [s * 0.155, 0.14, 0.58], [s * 0.15, 0.16, 0.46], [s * 0.145, 0.15, 0.34]],
      [0.04, 0.045, 0.05, 0.05, 0.055, 0.06, 0.06], [0.10, 0.13, 0.15, 0.15, 0.12, 0.10, 0.09]), m.quadro));
    add(malha(viga([add3(cab, [s * 0.03, 0, -0.05]), [s * 0.10, -0.32, 0.62], [s * 0.12, -0.26, 0.48]], 0.03, 0.05), m.quadro));
    add(tubo([[s * 0.15, 0.13, 0.70], [s * 0.12, 0.40, 0.80], [s * 0.08, 0.78, 0.88]], 0.012, m.fosco, 24, 8));
    add(tubo([[s * 0.15, 0.17, 0.52], [s * 0.13, 0.42, 0.66], [s * 0.09, 0.70, 0.84]], 0.010, m.fosco, 24, 8));
    add(cil([s * 0.14, PIVO[1], PIVO[2]], [s * 0.19, PIVO[1], PIVO[2]], 0.022, m.aluminio, 18));
  }
  add(malha(barra([-0.16, -0.05, 0.74], [0.16, -0.05, 0.74], 0.04, 0.03, 0.04, 0.03, [0, 0, 1]), m.quadro));

  // ---------------- motor 4 cilindros inclinado, tampas, radiador
  add(malha(loft([[-0.34, 0.13], [-0.30, 0.19], [0.05, 0.20], [0.16, 0.16], [0.20, 0.10]].map(([y, w]) => sec(y, 0.37, w, 0.17, 0.15, 3.2, 28)), { sub: 3 }), m.motor));
  const incl = 30 * PI / 180, ax = [0, -Math.sin(incl), Math.cos(incl)], base = [0, -0.20, 0.52];
  const bloco = (t0, comp, w, h, mat) => {
    const L = [0, comp].map(t => sec(0, 0, w, h, h, 3.5, 28).map(p => { const bx = p.x, bz = p.y; const q = add3(base, ax, t0 + t); return B(q[0] + bx, q[1] + bz * Math.cos(incl), q[2] + bz * Math.sin(incl)); }));
    return malha(loft(L), mat);
  };
  add(bloco(0, 0.16, 0.19, 0.085, m.motor));
  for (let k = 0; k < 6; k++) add(bloco(0.02 + k * 0.022, 0.008, 0.195, 0.088, m.fosco));
  add(bloco(0.16, 0.07, 0.185, 0.082, m.aluminio)); add(bloco(0.23, 0.045, 0.175, 0.075, m.motor));
  for (const s of [1, -1]) {
    add(cil([s * 0.19, 0, 0.36], [s * 0.225, 0, 0.36], 0.105, m.motor, 36, 0.095));
    add(cil([s * 0.224, 0, 0.36], [s * 0.23, 0, 0.36], 0.07, m.aluminio, 36, 0.064));
  }
  add(cil([0.19, PINHAO[1], PINHAO[2]], [0.205, PINHAO[1], PINHAO[2]], 0.06, m.motor, 24));
  add(cil([0, -0.33, 0.27], [0, -0.42, 0.24], 0.035, m.preto, 20));
  add(malha(new THREE.BoxGeometry(0.38, 0.33, 0.05), m.preto)).position.copy(B(0, -0.435, 0.625));
  { const g = []; for (let k = 0; k < 28; k++) { const b = new THREE.BoxGeometry(0.35, 0.004, 0.007); b.translate(0, 0.477 + k * 0.011, 0.4585); g.push(b); } add(malha(mergeGeometries(g), m.aluminio, false)); }
  for (const s of [1, -1]) add(tubo([[s * 0.15, -0.41, 0.50], [s * 0.17, -0.33, 0.45], [s * 0.13, -0.25, 0.46]], 0.016, m.preto, 16, 8));

  // ---------------- escapamento 4-em-1 com ponteira do lado direito (-X)
  [-0.105, -0.035, 0.035, 0.105].forEach(x => add(tubo([[x, -0.355, 0.60], [x * 1.05, -0.45, 0.50], [x * 0.9, -0.44, 0.30], [x * 0.6, -0.33, 0.17], [x * 0.25, -0.12, 0.15], [-0.02, 0, 0.155]], 0.019, m.titanio, 40, 10)));
  add(tubo([[-0.02, 0, 0.155], [-0.06, 0.12, 0.17], [-0.12, 0.26, 0.24], [-0.16, 0.33, 0.30]], 0.032, m.titanio, 24, 12));
  { const p0 = [-0.16, 0.33, 0.30], p1 = [-0.205, 0.68, 0.47], L = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8, q = add3(p0, [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], t); L.push(sec(0, 0, 0.055 + 0.012 * Math.sin(PI * t), 0.068 + 0.01 * Math.sin(PI * t), undefined, 3.0, 24).map(p => B(q[0] + p.x, q[1], q[2] + p.y))); }
    add(malha(loft(L, { sub: 2 }), m.titanio));
    const d = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], n = Math.hypot(...d), dn = d.map(v => v / n);
    add(cil(add3(p1, dn, -0.01), add3(p1, dn, 0.03), 0.05, m.carbono, 24, 0.045)); add(cil(add3(p1, dn, 0.025), add3(p1, dn, 0.035), 0.03, m.fosco, 18));
  }

  // ---------------- tanque, bancos, rabeta, placa
  add(malha(loft([[-0.34, 0.92, 0.10, 0.04, 0.06, 2.6], [-0.30, 0.93, 0.15, 0.07, 0.10, 2.8], [-0.20, 0.925, 0.185, 0.085, 0.12, 3.0], [-0.08, 0.915, 0.19, 0.08, 0.13, 3.0], [0.02, 0.90, 0.15, 0.07, 0.12, 2.8], [0.10, 0.88, 0.12, 0.05, 0.10, 2.6], [0.13, 0.87, 0.10, 0.035, 0.08, 2.4]]
    .map(([y, zc, w, ht, hb, n]) => sec(y, zc, w, ht, hb, n, 32)), { sub: 4 }), m.pintura));
  add(cil([0, -0.22, 1.003], [0, -0.22, 1.012], 0.042, m.aluminio, 28));
  add(malha(loft([[0.10, 0.835, 0.11], [0.18, 0.825, 0.15], [0.30, 0.83, 0.14], [0.40, 0.85, 0.10], [0.46, 0.87, 0.07]].map(([y, zc, w]) => sec(y, zc, w, 0.035, 0.03, 3.2, 28)), { sub: 4 }), m.banco));
  add(malha(loft([[0.50, 0.905, 0.07], [0.58, 0.925, 0.085], [0.66, 0.945, 0.07]].map(([y, zc, w]) => sec(y, zc, w, 0.025, 0.02, 3.0, 24)), { sub: 4 }), m.banco));
  add(malha(loft([[0.36, 0.80, 0.13, 0.03, 0.10, 2.4], [0.48, 0.85, 0.13, 0.05, 0.11, 2.6], [0.62, 0.89, 0.12, 0.05, 0.10, 2.6], [0.76, 0.925, 0.09, 0.04, 0.08, 2.4], [0.88, 0.95, 0.055, 0.03, 0.05, 2.2], [0.95, 0.965, 0.03, 0.018, 0.03, 2.0]]
    .map(([y, zc, w, ht, hb, n]) => sec(y, zc, w, ht, hb, n, 32)), { sub: 4 }), m.pintura));
  for (const s of [1, -1]) add(malha(loft([[0.50, 0.86, 0.131], [0.66, 0.895, 0.118], [0.80, 0.925, 0.086]].map(([y, zc, w]) => sec(y, zc, 0.004, 0.012, 0.012, 4, 10, s * w)), { sub: 4 }), m.branco));
  const matLanterna = emis(0xff1010, 0.5); luzes.freio.push(matLanterna); luzes.posicao.push(matLanterna);
  add(malha(loft([[0.925, 0.05], [0.955, 0.034], [0.966, 0.018]].map(([y, w]) => sec(y, 0.955, w, 0.014, 0.010, 2.4, 20)), { sub: 2 }), matLanterna));
  add(malha(loft([[0.45, 0.10], [0.65, 0.085], [0.82, 0.05]].map(([y, w]) => sec(y, 0.80, w, 0.02, 0.025, 3, 20)), { sub: 3 }), m.preto));
  add(malha(barra([0, 0.80, 0.78], [0, 1.02, 0.60], 0.14, 0.012, 0.16, 0.012), m.preto));
  add(K.placa('HRY-2O26', 'HRYZ CITY', m.preto, [0, 0.565, -1.025], true)).scale.set(0.66, 0.85, 1);
  for (const s of [1, -1]) {
    add(cil([s * 0.07, 0.96, 0.66], [s * 0.15, 0.97, 0.66], 0.006, m.preto, 8));
    const mp = emis(0xff8a00, 0.6); (s > 0 ? luzes.setaE : luzes.setaD).push(mp);
    const p = add(malha(new THREE.SphereGeometry(0.016, 14, 10), mp)); p.position.copy(B(s * 0.16, 0.97, 0.66)); p.scale.set(1.4, 0.8, 0.8);
  }

  // ---------------- carenagem dianteira contínua (mesmas tabelas do Blender)
  const interp = (y, tab) => { if (y <= tab[0][0]) return tab[0][1]; for (let i = 0; i < tab.length - 1; i++) if (y <= tab[i + 1][0]) return tab[i][1] + (tab[i + 1][1] - tab[i][1]) * (y - tab[i][0]) / (tab[i + 1][0] - tab[i][0]); return tab[tab.length - 1][1]; };
  const ZB = [[-1.0, 0.765], [-0.95, 0.725], [-0.80, 0.695], [-0.64, 0.655], [-0.50, 0.59], [-0.42, 0.50], [-0.37, 0.36], [-0.33, 0.27], [-0.12, 0.25], [0.04, 0.31]];
  const W = [[-1.0, 0.035], [-0.97, 0.105], [-0.92, 0.165], [-0.85, 0.200], [-0.75, 0.225], [-0.60, 0.245], [-0.46, 0.255], [-0.20, 0.252], [0.04, 0.236]];
  const ZS = [[-1.0, 0.80], [-0.92, 0.835], [-0.80, 0.865], [-0.62, 0.90], [-0.45, 0.90], [-0.33, 0.875], [-0.16, 0.70], [0.04, 0.44]];
  const BOLHA = [[-0.90, 0.875, 0.16], [-0.83, 0.93, 0.17], [-0.74, 1.00, 0.17], [-0.64, 1.06, 0.15], [-0.56, 1.09, 0.11]];
  const ZT = [[-0.50, 0.985], [-0.46, 0.96], [-0.33, 0.93], [-0.16, 0.72], [0.04, 0.45]];
  const bz = y => interp(y, BOLHA.map(b => [b[0], b[1]])), bw = y => interp(y, BOLHA.map(b => [b[0], b[2]]));
  const topo = y => {
    if (y <= -0.92) return [0, interp(y, [[-1.0, 0.82], [-0.95, 0.865], [-0.92, 0.88]])];
    if (y <= -0.88) { const t = (y + 0.92) / 0.04; return [bw(-0.90) * t * 0.96, 0.88 + (bz(-0.88) - 0.88) * t]; }
    if (y <= -0.56) return [bw(y) * 0.96, bz(y)];
    if (y <= -0.50) { const t = (y + 0.56) / 0.06; return [bw(-0.56) * 0.96 * (1 - t) + (interp(-0.50, W) - 0.03) * t, bz(-0.56) * (1 - t) + 0.985 * t]; }
    return [interp(y, W) - 0.03, interp(y, ZT)];
  };
  const meia = y => {
    const zb = interp(y, ZB), w = interp(y, W); const [ex, ez] = topo(y); let zs = Math.min(interp(y, ZS), ez - 0.012); zs = Math.max(zs, zb + 0.03);
    const P = []; for (let t = 0; t < 10; t++) { const z = zb + (zs - zb) * t / 9; P.push([w * (1 - 0.10 * ((z - 0.62) / 0.36) ** 2), z]); }
    for (let i = 1; i < 9; i++) { const f = i / 8 * PI / 2; P.push([ex + (P[9][0] - ex) * Math.cos(f) ** (2 / 2.6), zs + (ez - zs) * Math.sin(f) ** (2 / 2.6)]); }
    return P;
  };
  const xlat = (y, z) => interp(y, W) * (1 - 0.10 * ((z - 0.62) / 0.36) ** 2);
  const yfrente = x => { for (let i = 0; i < W.length - 1; i++) if (x >= W[i][1] && x <= W[i + 1][1]) return W[i][0] + (W[i + 1][0] - W[i][0]) * (x - W[i][1]) / (W[i + 1][1] - W[i][1]); return -1.0; };
  const ys = Array.from({ length: 53 }, (_, i) => -1.0 + 1.04 * i / 52);
  const matFarol = emis(0xeaf2ff, 0.9); luzes.farol.push(matFarol); luzes.posicao.push(matFarol);
  for (const s of [1, -1]) {
    add(malha(loft(ys.map(y => meia(y).map(([x, z]) => B(s * x, y, z))), { fechado: false }), m.pintura));
    // faixa branca diagonal, nome, guelras, winglet
    add(malha(loft(Array.from({ length: 11 }, (_, i) => { const y = -0.74 + 0.66 * i / 10, zc = 0.80 - (y + 0.74) * 0.36; return [zc - 0.016, zc + 0.016].map(z => B(s * (xlat(y, z) + 0.003), y, z)); }), { fechado: false }), m.branco));
    const nome = add(decal('HRYZ', 0.30, 0.10, '#f2f3f5')); nome.position.copy(B(s * (xlat(-0.50, 0.63) + 0.004), -0.50, 0.63)); nome.rotation.y = s * PI / 2;
    const mod = add(decal('600 RS', 0.14, 0.045, '#18181b')); mod.position.copy(B(s * (xlat(-0.24, 0.44) + 0.004), -0.24, 0.44)); mod.rotation.y = s * PI / 2;
    for (let k = 0; k < 3; k++) { const y0 = -0.36 + k * 0.045; add(malha(barra([s * (xlat(y0, 0.78) + 0.003), y0, 0.78], [s * (xlat(y0 + 0.06, 0.60) + 0.003), y0 + 0.06, 0.60], 0.004, 0.022), m.preto)); }
    add(malha(barra([s * 0.20, -0.72, 0.74], [s * 0.27, -0.62, 0.72], 0.008, 0.045, 0.004, 0.03), m.carbono));
    // faróis rentes à frente do bico (vidro, LED e projetor)
    const placaFrente = (x0, x1, z0, z1, recuo, mat, curva = 0) => {
      const V = [], F = [], nx = 10, nz = 4;
      for (let i = 0; i <= nx; i++) { const x = x0 + (x1 - x0) * i / nx, zc = curva * (i / nx - 0.5) ** 2; for (let j = 0; j <= nz; j++) V.push(B(s * x, yfrente(x) - recuo, z0 + (z1 - z0) * j / nz + zc)); }
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const a = i * (nz + 1) + j; F.push([a, a + nz + 1, a + nz + 2, a + 1]); }
      return malha(geo(V, F), mat);
    };
    add(placaFrente(0.022, 0.150, 0.778, 0.818, 0.004, m.vidroFarol, -0.03));
    add(placaFrente(0.040, 0.140, 0.808, 0.815, 0.007, matFarol, -0.03));
    add(placaFrente(0.085, 0.120, 0.782, 0.800, 0.006, m.cromo));
    const pf = emis(0xff8a00, 0.6); (s > 0 ? luzes.setaE : luzes.setaD).push(pf);
    const p = add(malha(new THREE.SphereGeometry(0.014, 12, 8), pf)); p.position.copy(B(s * 0.215, -0.82, 0.80)); p.scale.set(0.6, 0.8, 1.6);
    // retrovisores
    add(tubo([[s * 0.215, -0.70, 0.95], [s * 0.27, -0.66, 1.0], [s * 0.32, -0.61, 1.03]], 0.007, m.preto, 12, 6));
    add(malha(loft([-0.62, -0.59, -0.575].map(y => sec(y, 1.05, 0.065, 0.032, 0.032, 2.4, 20, s * 0.34)), { sub: 2 }), m.pintura));
    add(malha(new THREE.BoxGeometry(0.11, 0.05, 0.002), m.espelho)).position.copy(B(s * 0.34, -0.5735, 1.05));
  }
  add(malha(loft(BOLHA.map(([y, zc, w]) => Array.from({ length: 15 }, (_, i) => { const x = -w + 2 * w * i / 14; return B(x, y, zc + 0.04 * (1 - (x / w) ** 2)); })), { fechado: false, sub: 3 }), m.bolha, false));
  add(malha(loft([[-0.38, 0.30, 0.17], [-0.25, 0.22, 0.22], [-0.05, 0.20, 0.23], [0.10, 0.24, 0.18], [0.16, 0.28, 0.12]].map(([y, zc, w]) => sec(y, zc, w, 0.06, 0.08, 2.6, 28)), { sub: 4 }), m.preto));
  add(malha(new THREE.BoxGeometry(0.16, 0.08, 0.03), m.preto)).position.copy(B(0, -0.545, 1.03));
  add(malha(new THREE.PlaneGeometry(0.14, 0.06), m.tela)).position.copy(B(0, -0.5295, 1.03));

  // ---------------- pedaleiras, pedais, amortecedor com mola
  for (const s of [1, -1]) {
    add(malha(barra([s * 0.15, 0.10, 0.52], [s * 0.165, 0.24, 0.38], 0.008, 0.06, 0.008, 0.045), m.aluminio));
    add(cil([s * 0.165, 0.22, 0.385], [s * 0.24, 0.22, 0.385], 0.012, m.fosco, 14));
    add(malha(barra([s * 0.17, 0.21, 0.40], [s * 0.20, 0.03, 0.36], 0.008, 0.012), m.aluminio));
    add(malha(barra([s * 0.13, 0.40, 0.66], [s * 0.18, 0.46, 0.48], 0.008, 0.04), m.aluminio));
    add(cil([s * 0.18, 0.46, 0.48], [s * 0.24, 0.46, 0.48], 0.010, m.fosco, 12));
  }
  { const a0 = [0, 0.30, 0.36], a1 = [0, 0.19, 0.70];
    add(cil(a1, add3(a1, [a0[0] - a1[0], a0[1] - a1[1], a0[2] - a1[2]], 0.55), 0.024, m.aluminio, 18)); add(cil(a0, a1, 0.009, m.cromo, 10));
    const e = Bv(a1).sub(Bv(a0)).normalize(), p = new THREE.Vector3(1, 0, 0), q = e.clone().cross(p), pts = [];
    for (let i = 0; i <= 140; i++) { const t = i / 140; pts.push(Bv(a0).addScaledVector(e, 0.06 + 0.18 * t).addScaledVector(p, Math.cos(t * 2 * PI * 7) * 0.036).addScaledVector(q, Math.sin(t * 2 * PI * 7) * 0.036)); }
    add(malha(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 280, 0.0055, 6, false), m.mola));
  }

  // ---------------- DIREÇÃO: pivô na coluna (gira em volta do eixo da coluna)
  const dir = add(new THREE.Group()); dir.name = 'direcao'; dir.position.copy(Bv(cab));
  const eixoCol = Bv(U).sub(new THREE.Vector3()).normalize(); dir.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), eixoCol); const q0 = dir.quaternion.clone();
  const pecasD = [];
  const P = (s, t) => add3(add3(AF, [s * 0.105, 0, 0]), U, t);
  for (const s of [1, -1]) {
    pecasD.push(cil(P(s, 0.06), P(s, 0.44), 0.0245, m.cromo, 24), cil(P(s, 0.38), P(s, 0.725), 0.033, m.dourado, 28), cil(P(s, 0.375), P(s, 0.39), 0.036, m.preto, 24),
      cil(P(s, 0.725), P(s, 0.74), 0.026, m.aluminio, 18), cil(P(s, 0.74), P(s, 0.752), 0.012, m.dourado, 10));
    pecasD.push(malha(barra(P(s, -0.04), P(s, 0.11), 0.05, 0.07, 0.045, 0.055), m.aluminio));
    pecasD.push(pinca(AF, s * 0.088, 0.155, 0.15, 0.85, m.pinca));
    pecasD.push(tubo([add3(AF, [s * 0.088, 0.11, 0.17]), add3(P(s, 0.30), [0, 0.06, 0]), add3(COL(0.78), [s * 0.05, 0.02, 0]), add3(COL(0.93), [s * 0.10, 0.04, 0.02])], 0.0045, m.preto, 24, 6));
    // semiguidão, manopla, peso, manete, comandos
    const c0 = add3(add3(AF, U, 0.66), [s * 0.105, 0, 0]), g1 = add3(c0, [s * 0.05, 0.02, -0.005]), g2 = add3(c0, [s * 0.30, 0.09, -0.04]);
    const dg = [g2[0] - g1[0], g2[1] - g1[1], g2[2] - g1[2]], ng = Math.hypot(...dg), ug = dg.map(v => v / ng), gm = add3(g1, dg, 0.55);
    pecasD.push(cil(add3(c0, U, -0.02), add3(c0, U, 0.02), 0.040, m.aluminio, 20), cil(g1, g2, 0.011, m.fosco, 14), cil(gm, add3(g2, ug, 0.01), 0.018, m.borracha, 18), cil(add3(g2, ug, 0.01), add3(g2, ug, 0.035), 0.016, m.aluminio, 18));
    const lev0 = add3(add3(g1, dg, 0.5), [0, -0.04, 0]);
    pecasD.push(tubo([lev0, add3(lev0, [s * 0.06, -0.035, -0.01]), add3(lev0, [s * 0.17, -0.03, -0.02])], 0.006, m.aluminio, 12, 6));
    const cmd = malha(new THREE.BoxGeometry(0.05, 0.055, 0.05), m.preto); cmd.position.copy(Bv(add3(g1, [s * 0.045, 0.025, 0]))); pecasD.push(cmd);
  }
  for (const [t, h] of [[0.53, 0.04], [0.70, 0.03]]) {                         // mesas
    const c = add3(AF, U, t);
    pecasD.push(malha(loft([-h / 2, h / 2].map(dz => [[-0.15, 0.03], [0.15, 0.03], [0.15, 0.09], [0.05, 0.13], [-0.05, 0.13], [-0.15, 0.09]].map(([x, yy]) => B(x, c[1] + yy, c[2] + dz))), { suave: false }), m.aluminio));
  }
  { const L = [];                                                             // para-lama dianteiro
    for (let g = 25; g <= 135; g += 10) { const a = g * PI / 180, dy = -Math.cos(a), dz = Math.sin(a); L.push(Array.from({ length: 9 }, (_, i) => { const x = -0.075 + 0.15 * i / 8, r = M.RF + 0.03 + 0.02 * (1 - (x / 0.075) ** 2); return B(x, AF[1] + r * dy, AF[2] + r * dz); })); }
    pecasD.push(malha(loft(L, { fechado: false, sub: 2 }), m.pintura));
  }
  const rodaD = roda(M.RF, 0.12, 0.09, AF, m, [[0.088, 0.155], [-0.088, 0.155]]);
  G.updateMatrixWorld(true);
  for (const o of pecasD) { G.add(o); dir.attach(o); }
  G.add(rodaD); dir.attach(rodaD);

  // ---------------- BALANÇA: pivô (gira em X), braços, roda traseira com coroa, pinça
  const bal = add(new THREE.Group()); bal.name = 'balanca'; bal.position.copy(Bv(PIVO));
  const pecasB = [];
  for (const s of [1, -1]) {
    const meio = [(PIVO[0] + AT[0]) / 2 + s * 0.135, (PIVO[1] + AT[1]) / 2, (PIVO[2] + AT[2]) / 2 + (s === -1 ? 0.05 : 0.02)];
    pecasB.push(malha(viga([add3(PIVO, [s * 0.12, 0, 0]), meio, add3(AT, [s * 0.135, -0.02, 0]), add3(AT, [s * 0.135, 0.05, 0])], [0.05, 0.05, 0.04, 0.035], [0.08, 0.10, 0.06, 0.05]), m.quadro));
    pecasB.push(cil([s * 0.15, AT[1], AT[2]], [s * 0.17, AT[1], AT[2]], 0.018, m.aluminio, 6));
  }
  pecasB.push(malha(barra(add3(PIVO, [-0.12, 0.10, 0]), add3(PIVO, [0.12, 0.10, 0]), 0.05, 0.06, 0.05, 0.06, [0, 0, 1]), m.quadro));
  pecasB.push(cil(add3(PIVO, [-0.14, 0, 0]), add3(PIVO, [0.14, 0, 0]), 0.03, m.quadro, 20));
  pecasB.push(pinca(AT, -0.085, 0.11, -0.95, -0.45, m.pinca, 0.04, 0.045));
  const rodaT = roda(M.RT, 0.18, 0.14, AT, m, [[-0.085, 0.11]], true);
  for (const o of pecasB) { G.add(o); bal.attach(o); }
  G.add(rodaT); bal.attach(rodaT);

  // corrente: elos instanciados ao longo do circuito pinhão → coroa (lado esquerdo)
  { const rp = 0.040, rc = 0.103, pin = [PINHAO[1], PINHAO[2]], cor = [AT[1], AT[2]];
    const dx = cor[0] - pin[0], dz = cor[1] - pin[1], Lc = Math.hypot(dx, dz), dn = [dx / Lc, dz / Lc], nrm = [-dn[1], dn[0]], ang = Math.asin((rc - rp) / Lc), tang = Math.sqrt(Lc * Lc - (rc - rp) ** 2);
    const nUp = [nrm[0] * Math.cos(ang) - dn[0] * Math.sin(ang), nrm[1] * Math.cos(ang) - dn[1] * Math.sin(ang)], nDn = [-nrm[0] * Math.cos(ang) - dn[0] * Math.sin(ang), -nrm[1] * Math.cos(ang) - dn[1] * Math.sin(ang)];
    const segs = [tang, rc * (PI + 2 * ang), tang, rp * (PI - 2 * ang)], total = segs.reduce((a, b) => a + b);
    const ponto = u => {
      u = ((u % total) + total) % total;
      if (u < segs[0]) { const a = [pin[0] + nUp[0] * rp, pin[1] + nUp[1] * rp], b = [cor[0] + nUp[0] * rc, cor[1] + nUp[1] * rc], k = u / segs[0]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; }
      u -= segs[0]; if (u < segs[1]) { const a = Math.atan2(nUp[1], nUp[0]) - u / rc; return [cor[0] + Math.cos(a) * rc, cor[1] + Math.sin(a) * rc]; }
      u -= segs[1]; if (u < segs[2]) { const a = [cor[0] + nDn[0] * rc, cor[1] + nDn[1] * rc], b = [pin[0] + nDn[0] * rp, pin[1] + nDn[1] * rp], k = u / segs[2]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; }
      u -= segs[2]; const a = Math.atan2(nDn[1], nDn[0]) - u / rp; return [pin[0] + Math.cos(a) * rp, pin[1] + Math.sin(a) * rp];
    };
    const n = Math.round(total / 0.015875), passo = total / n;
    const placa = new THREE.InstancedMesh(new THREE.BoxGeometry(0.0016, 0.009, 0.0159), m.corrente, n * 2), rol = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.010, 6).rotateZ(PI / 2), m.corrente, n);
    const o = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      const a = ponto(i * passo), b = ponto(i * passo + passo), pa = B(0, a[0], a[1]), pb = B(0, b[0], b[1]), c = pa.clone().add(pb).multiplyScalar(0.5);
      o.position.set(PINHAO[0], c.y, c.z); o.lookAt(PINHAO[0], pb.y, pb.z);
      for (const [k, dx2] of [[0, -0.0055], [1, 0.0055]]) { o.position.x = PINHAO[0] + dx2; o.updateMatrix(); placa.setMatrixAt(i * 2 + k, o.matrix); }
      o.position.set(PINHAO[0], pa.y, pa.z); o.rotation.set(0, 0, 0); o.updateMatrix(); rol.setMatrixAt(i, o.matrix);
    }
    add(placa); add(rol);
  }

  // ---------------- descanso lateral (gira para baixo)
  const desc = add(new THREE.Group()); desc.name = 'descanso'; desc.position.copy(B(0.13, 0.02, 0.30));
  { const h = malha(barra([0.13, 0.02, 0.30], [0.165, 0.33, 0.24], 0.016, 0.02, 0.014, 0.016, [0, 0, 1]), m.fosco); G.add(h); desc.attach(h); }

  if (opc.sombraChao !== false) { const sc = add(K.sombraChao(M.L * 0.9, 0.55)); sc.name = 'sombraChao'; }
  G.traverse(o => { if (o.isMesh) o.castShadow = o.castShadow !== false; });

  // marcadores para montar o piloto (mesmos nomes do GLB do Blender)
  const marca = (p, pai = G) => { const o = new THREE.Object3D(); o.position.copy(p); pai.add(o); return o; };
  const pontos = { assento: marca(B(0, 0.26, 0.87)), peE: marca(B(0.20, 0.22, 0.39)), peD: marca(B(-0.20, 0.22, 0.39)), maoE: null, maoD: null };
  { const mE = B(...add3(add3(AF, U, 0.66), [0.33, 0.07, -0.03])), mD = B(...add3(add3(AF, U, 0.66), [-0.33, 0.07, -0.03])); G.updateMatrixWorld(true);
    pontos.maoE = marca(dir.worldToLocal(mE.clone()), dir); pontos.maoD = marca(dir.worldToLocal(mD.clone()), dir); }   // as mãos vão com o guidão
  const rodas = [{ giro: rodaD, d: true, R: M.RF }, { giro: rodaT, d: false, R: M.RT }];
  return K.api(G, { L: M.L, W: M.W, H: M.H, R: M.RF, luzes, rodas, extra: {
    moto: true, direcao: dir, balanca: bal,
    rodar(metros, extraTras = 0) { rodaD.rotation.x = metros / M.RF; rodaT.rotation.x = metros / M.RT + extraTras; },
    esterco(rad) { dir.quaternion.copy(q0).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.clamp(rad, -0.6, 0.6))); },
    /** compressão da suspensão traseira (rad, positivo = roda sobe) */
    suspensao(rad) { bal.rotation.x = rad; },
    descanso(baixo) { desc.rotation.set(baixo ? -1.15 : 0, 0, baixo ? -0.35 : 0); },
    pontos,
  } });
}
