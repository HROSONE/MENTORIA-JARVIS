// KIT DE VEÍCULOS procedurais (Three.js, só código): as peças comuns aos carros da biblioteca (táxi, hatch, picape, ônibus escolar, bombeiros).
// Convenção da viatura e da ambulância: metros, frente em +Z, +X = lado do motorista (esquerda), origem no meio do comprimento, pneus em y = 0.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const FONTE = '"Arial Black", "DejaVu Sans", Arial, sans-serif';

/** textura de canvas */
export function tela(w, h, desenhar) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); desenhar(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
/** materiais básicos */
export function materiais(cor) {
  return {
    pintura: new THREE.MeshPhysicalMaterial({ color: cor, roughness: 0.3, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 }),
    vidro: new THREE.MeshPhysicalMaterial({ color: 0x0b1117, roughness: 0.04, metalness: 0.25, envMapIntensity: 2.0, side: THREE.DoubleSide }),
    escuro: new THREE.MeshStandardMaterial({ color: 0x141517, roughness: 0.7, metalness: 0.2 }),
    plastico: new THREE.MeshStandardMaterial({ color: 0x1d1e21, roughness: 0.6, metalness: 0.05 }),
    cromo: new THREE.MeshStandardMaterial({ color: 0xdfe3e8, roughness: 0.14, metalness: 1.0 }),
    pneu: new THREE.MeshStandardMaterial({ color: 0x131313, roughness: 0.9 }),
    roda: new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.3, metalness: 0.85 }),
  };
}
/** caixa (arredondada se r > 0) */
export function caixa(sx, sy, sz, mat, r = 0.01, pos = [0, 0, 0]) {
  r = Math.min(r, sx / 2 - 1e-4, sy / 2 - 1e-4, sz / 2 - 1e-4);
  const m = new THREE.Mesh(r > 0.0005 ? new RoundedBoxGeometry(sx, sy, sz, 2, r) : new THREE.BoxGeometry(sx, sy, sz), mat);
  m.position.set(...pos); m.castShadow = m.receiveShadow = true; return m;
}
/** cilindro deitado ao longo de x */
export function cilX(r, comp, mat, pos, n = 24) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, comp, n), mat); m.rotation.z = Math.PI / 2; m.position.set(...pos); m.castShadow = true; return m; }
export function cilZ(r, comp, mat, pos, n = 24) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, comp, n), mat); m.rotation.x = Math.PI / 2; m.position.set(...pos); m.castShadow = true; return m; }

/**
 * Perfil lateral (z, y) extrudado na largura. topo: pontos do fundo de trás, por cima, até o fundo da frente; o fundo é uma reta em yBase
 * com os arcos das rodas (arcos: [{ z, r, yc }]). Devolve a geometria centrada em x.
 */
export function perfil(topo, { yBase, arcos = [], largura, bevel = 0.04, curva = 20 }) {
  const s = new THREE.Shape();
  s.moveTo(topo[0][0], topo[0][1]); for (let i = 1; i < topo.length; i++) s.lineTo(topo[i][0], topo[i][1]);
  const ultimo = topo[topo.length - 1];
  s.lineTo(ultimo[0], yBase);
  for (const a of [...arcos].sort((p, q) => q.z - p.z)) {
    const yc = a.yc ?? yBase - a.r * 0.35, dy = yBase - yc; if (dy >= a.r) continue;
    const a0 = Math.asin(dy / a.r), dz = Math.cos(a0) * a.r;
    s.lineTo(a.z + dz, yBase); s.absarc(a.z, yc, a.r, a0, Math.PI - a0, false); s.lineTo(a.z - dz, yBase);
  }
  s.lineTo(topo[0][0], yBase); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: largura - 2 * bevel, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, steps: 1, curveSegments: curva });
  g.translate(0, 0, -(largura - 2 * bevel) / 2); g.rotateY(-Math.PI / 2); g.computeVertexNormals(); return g;
}
/** z da superfície da frente (lado = +1) ou de trás (-1) do perfil na altura y (já com o bevel) */
export function faceZ(topo, y, lado = 1, bevel = 0.04) {
  const pts = lado > 0 ? topo.slice(Math.floor(topo.length / 2)) : topo.slice(0, Math.ceil(topo.length / 2) + 1);
  let melhor = null;
  for (let i = 0; i < pts.length - 1; i++) { const [z0, y0] = pts[i], [z1, y1] = pts[i + 1]; if ((y - y0) * (y - y1) <= 0 && y0 !== y1) { const z = z0 + (z1 - z0) * (y - y0) / (y1 - y0); if (melhor === null || (lado > 0 ? z > melhor : z < melhor)) melhor = z; } }
  if (melhor === null) melhor = lado > 0 ? Math.max(...pts.map(p => p[0])) : Math.min(...pts.map(p => p[0]));
  return melhor + lado * bevel;
}
/** vidro inclinado (para-brisa, vigia) entre dois pontos do perfil (z, y), com largura de baixo e de cima; sinal = +1 frente, -1 trás */
export function vidroInclinado(p0, p1, lb, lt, mat, sinal = 1, afasta = 0.045) {
  const s = new THREE.Shape(); s.moveTo(-lb / 2, 0); s.lineTo(lb / 2, 0); s.lineTo(lt / 2, 1); s.lineTo(-lt / 2, 1); s.closePath();
  const m = new THREE.Mesh(new THREE.ShapeGeometry(s), mat);
  const a = new THREE.Vector3(0, p0[1], p0[0]), b = new THREE.Vector3(0, p1[1], p1[0]), up = b.clone().sub(a), len = up.length(); up.normalize();
  const x = new THREE.Vector3(1, 0, 0), n = new THREE.Vector3().crossVectors(x, up); if (n.z * sinal < 0) n.negate();
  const xx = new THREE.Vector3().crossVectors(up, n);
  m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xx, up, n)); m.scale.set(1, len, 1); m.position.copy(a).addScaledVector(n, afasta); m.renderOrder = 3; return m;
}
/** janela lateral: polígono (z, y) nos dois lados, a ±x */
export function janelas(pts, x, mat) {
  const G = new THREE.Group();
  for (const s of [1, -1]) {
    const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]); sh.closePath();
    const g = new THREE.ShapeGeometry(sh); const m = new THREE.Mesh(g, mat);
    // plano do shape: x_shape = z, y_shape = y; gira para o plano lateral
    m.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; m.position.x = s * x;
    if (s > 0) { m.scale.x = -1; }
    m.renderOrder = 3; G.add(m);
  }
  return G;
}
/** decalque (plano com textura de canvas) */
export function decal(tex, w, h, pos, rotY = 0, rotX = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.35, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false, side: THREE.DoubleSide }));
  m.position.set(...pos); m.rotation.set(rotX, rotY, 0, 'YXZ'); m.renderOrder = 2; m.receiveShadow = true; return m;
}
/** decalque nas duas laterais. desenhar(g, W, H, X, Y, lado) com X(z) e Y(y) em pixels (a frente fica à esquerda vista de +X e à direita vista de -X) */
export function decalLados(x, z0, z1, y0, y1, desenhar, ppm = 220) {
  const G = new THREE.Group(), W = Math.round((z1 - z0) * ppm), H = Math.round((y1 - y0) * ppm);
  for (const s of [1, -1]) {
    const tex = tela(W, H, (g) => { g.clearRect(0, 0, W, H); const X = z => s > 0 ? (z1 - z) * ppm : (z - z0) * ppm, Y = y => (y1 - y) * ppm; desenhar(g, W, H, X, Y, s, ppm); });
    G.add(decal(tex, z1 - z0, y1 - y0, [s * x, (y0 + y1) / 2, (z0 + z1) / 2], s > 0 ? Math.PI / 2 : -Math.PI / 2));
  }
  return G;
}
/** decalque de frente (+z) ou de trás (-z): desenhar(g, W, H, X, Y) com X(x) em pixels já espelhado conforme a vista */
export function decalFace(z, x0, x1, y0, y1, desenhar, ppm = 300, tras = false) {
  const W = Math.round((x1 - x0) * ppm), H = Math.round((y1 - y0) * ppm);
  const tex = tela(W, H, (g) => { g.clearRect(0, 0, W, H); const X = x => tras ? (x1 - x) * ppm : (x - x0) * ppm, Y = y => (y1 - y) * ppm; desenhar(g, W, H, X, Y, ppm); });
  // vista de frente (+z, olhando para -z): +x fica à direita? câmera em +z olhando -z: a direita da imagem é -x... por isso espelha
  const m = decal(tex, x1 - x0, y1 - y0, [(x0 + x1) / 2, (y0 + y1) / 2, z], tras ? Math.PI : 0);
  if (!tras) m.scale.x = 1; return m;
}

/** roda: pneu (perfil girado) + aro. estilo: 'aco' (disco com furos e calota), 'liga' (5 raios), 'pesada' (caminhão, com porcas). dupla: prato fundo de rodado duplo */
export function roda(R, L, mats, { estilo = 'liga', aro = 0.62, dupla = false, externa = true } = {}) {
  const G = new THREE.Group(), giro = new THREE.Group(); G.add(giro);
  const rr = R * aro, pts = [new THREE.Vector2(rr, -L / 2 * 0.9)];
  for (let i = 0; i <= 18; i++) { const a = -Math.PI / 2 + Math.PI * i / 18; pts.push(new THREE.Vector2(R - L * 0.22 + Math.cos(a) * L * 0.22, Math.sin(a) * L / 2)); }
  pts.push(new THREE.Vector2(rr, L / 2 * 0.9));
  const pneu = new THREE.Mesh(new THREE.LatheGeometry(pts, 60), mats.pneu); pneu.rotation.z = Math.PI / 2; pneu.castShadow = pneu.receiveShadow = true; giro.add(pneu);
  const lado = externa ? 1 : -1, face = lado * (dupla ? L * 0.15 : L * 0.36);
  giro.add(cilX(rr, L * 0.8, mats.escuro, [0, 0, 0], 40));
  const disco = cilX(rr * 0.98, 0.012, mats.roda, [face, 0, 0], 48); giro.add(disco);
  const labio = new THREE.Mesh(new THREE.TorusGeometry(rr, R * 0.025, 8, 48), mats.cromo); labio.rotation.y = Math.PI / 2; labio.position.x = lado * L * 0.42; giro.add(labio);
  if (estilo === 'liga') {
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, b = new THREE.Mesh(new THREE.BoxGeometry(0.02, rr * 0.82, rr * 0.2), mats.roda); b.position.set(face + lado * 0.012, Math.cos(a) * rr * 0.5, Math.sin(a) * rr * 0.5); b.rotation.x = -a; giro.add(b); }
    for (let i = 0; i < 5; i++) { const a = (i + 0.5) / 5 * Math.PI * 2, f = new THREE.Mesh(new THREE.CircleGeometry(rr * 0.22, 3), mats.escuro); f.rotation.y = lado * Math.PI / 2; f.position.set(face + lado * 0.007, Math.cos(a) * rr * 0.58, Math.sin(a) * rr * 0.58); f.rotation.z = a; giro.add(f); }
    giro.add(cilX(rr * 0.2, 0.03, mats.cromo, [face + lado * 0.02, 0, 0]));
  } else {
    const nf = estilo === 'pesada' ? 0 : 6;
    for (let i = 0; i < nf; i++) { const a = i / nf * Math.PI * 2 + 0.3, f = new THREE.Mesh(new THREE.CircleGeometry(rr * 0.13, 16), mats.escuro); f.rotation.y = lado * Math.PI / 2; f.position.set(face + lado * 0.007, Math.cos(a) * rr * 0.68, Math.sin(a) * rr * 0.68); giro.add(f); }
    giro.add(cilX(rr * (estilo === 'pesada' ? 0.42 : 0.35), 0.05, mats.cromo, [face + lado * 0.025, 0, 0], 32));
    const np = estilo === 'pesada' ? 10 : 5;
    for (let i = 0; i < np; i++) { const a = i / np * Math.PI * 2; giro.add(cilX(R * 0.022, 0.04, mats.cromo, [face + lado * 0.04, Math.cos(a) * rr * 0.32, Math.sin(a) * rr * 0.32], 6)); }
  }
  return { grupo: G, giro };
}
/** coloca as rodas: lista de { z, x, dupla, externa, d (dianteira) } */
export function rodas(G, lista, R, L, mats, opc = {}) {
  const out = [];
  for (const p of lista) {
    const pivo = new THREE.Group(); pivo.position.set(p.x, R, p.z); G.add(pivo);
    const r = roda(R, L, mats, { ...opc, dupla: !!p.dupla, externa: p.externa !== false }); if (p.x < 0) r.grupo.rotation.y = Math.PI; pivo.add(r.grupo); out.push({ ...p, pivo, giro: r.giro });
  }
  return out;
}
/** lâmpada (lente com emissivo) */
export function lampada(w, h, d, cor, pos, r = 0.012, base = 0.5) {
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(cor).multiplyScalar(base), emissive: new THREE.Color(cor), emissiveIntensity: 0, roughness: 0.08, metalness: 0.2 });
  return { malha: caixa(w, h, d, mat, r, pos), mat };
}
/** cabeça de luz de emergência com moldura; normal = direção para onde aponta */
export function cabecaLuz(w, h, cor, cromo, pos, normal) {
  const g = new THREE.Group(); g.add(caixa(w + 0.02, h + 0.02, 0.05, cromo, 0.008));
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(cor).multiplyScalar(0.55), emissive: new THREE.Color(cor), emissiveIntensity: 0, roughness: 0.15 });
  g.add(caixa(w, h, 0.03, mat, 0.006, [0, 0, 0.018]));
  g.position.set(...pos); g.lookAt(new THREE.Vector3(...pos).add(new THREE.Vector3(...normal))); return { grupo: g, mat };
}
/** sombra de contato no chão */
export function sombraChao(L, W) {
  const t = tela(256, 640, (g, w, h) => { for (let i = 0; i < 14; i++) { const gr = 4 + i * 5; g.fillStyle = `rgba(0,0,0,${0.075 * (1 - i / 16)})`; g.beginPath(); if (g.roundRect) g.roundRect(30 - gr, 26 - gr, w - 60 + 2 * gr, h - 52 + 2 * gr, 30 + i * 6); else g.rect(30 - gr, 26 - gr, w - 60 + 2 * gr, h - 52 + 2 * gr); g.fill(); } });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.25, L * 1.1), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  pl.rotation.x = -Math.PI / 2; pl.position.y = 0.004; pl.renderOrder = -1; return pl;
}
/** placa de carro */
export function placa(txt, estado, mat0, pos, tras = false) {
  const t = tela(310, 155, (g, w, h) => { g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#333'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); g.fillStyle = '#1C2A44'; g.font = `900 60px ${FONTE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 10); g.font = '700 20px Arial'; g.fillText(estado, w / 2, 26); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.305, 0.152), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2 })); m.position.set(...pos); if (tras) m.rotation.y = Math.PI; return m;
}
/**
 * API comum: grupos de luzes { farol: [mats], freio, re, setaE, setaD, posicao, emergencia: [{ mat, lado, cor }] }, rodas, fachos
 */
export function api(G, { L, W, H, R, luzes, rodas: rd, fachos = [], pontos = [], extra = {} }) {
  const set = (lista, k) => (lista || []).forEach(m => { m.emissiveIntensity = k; });
  const o = {
    grupo: G, rodas: rd, dims: { L, W, H },
    farois(on, forca = 70) { set(luzes.farol, on ? 1.3 : 0); fachos.forEach(f => f.intensity = on ? forca : 0); },
    freio(on) { set(luzes.freio, on ? 2.6 : 0.2); },
    re(on) { set(luzes.re, on ? 2.5 : 0); },
    seta(lado, on) { set(luzes[lado > 0 ? 'setaE' : 'setaD'], on ? 3 : 0); },
    posicao(on) { set(luzes.posicao, on ? 1.6 : 0); },
    /** luzes de emergência/advertência: 'off' | 'ligado' | 'fixo' */
    luzes(t, modo = 'ligado', forca = 6) {
      const em = luzes.emergencia || [];
      if (modo === 'off') { em.forEach(l => l.mat.emissiveIntensity = 0); pontos.forEach(p => p.intensity = 0); return; }
      if (modo === 'fixo') { em.forEach(l => l.mat.emissiveIntensity = 3); pontos.forEach(p => p.intensity = forca * 0.6); return; }
      const a = ((t * 2.2) % 1) < 0.5, pisca = ((t * 7) % 1) < 0.5;
      em.forEach(l => { const on = l.fixo ? true : (l.lado === 0 ? !a : (l.lado > 0) === a) && (l.pisca === false || pisca); l.mat.emissiveIntensity = on ? 7 : 0.06; });
      pontos.forEach((p, i) => p.intensity = ((i % 2 === 0) === a) && pisca ? forca : 0);
    },
    rodar(metros) { for (const r of rd) r.giro.rotation.x = metros / R; },
    esterco(rad) { for (const r of rd) if (r.d) r.pivo.rotation.y = rad; },
    ...extra,
  };
  o.freio(false); return o;
}
