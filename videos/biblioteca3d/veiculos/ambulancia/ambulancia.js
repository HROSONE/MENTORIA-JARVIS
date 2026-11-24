// Ambulância Type III dos EUA (cabine de picape Ford E-450 "cutaway" + baú/módulo de atendimento), modelada em código (sem GLB e sem textura externa).
// Medidas reais (polegadas → metros): entre-eixos 158" (4,013 m), comprimento total 268,5" (6,82 m), largura 98" (2,49 m), altura 106,5" (2,70 m);
// módulo 169" x 96" (4,29 x 2,44 m), pé-direito interno 72". Fontes no README.
// Mesma convenção da viatura: escala real em metros, frente em +Z, +X = lado do motorista (esquerda), origem no meio do comprimento, pneus em y = 0.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const A = {
  L: 6.82, ZN: 3.41, ZT: -3.41,             // nariz e traseira (para-choques)
  EE: 4.013, ZF: 2.40, ZR: 2.40 - 4.013,    // eixos
  RP: 0.375,                                // raio do pneu 225/75R16
  MOD: { z0: -3.27, z1: 0.98, x: 1.22, y0: 0.92, y1: 2.70 },   // módulo (baú)
  CAB: { z0: 0.98, x: 1.0 },                // cabine (fundo encostado no módulo)
};

/* ------------------------------------------------------------------ texturas desenhadas em canvas */
function tela(w, h, desenhar) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); desenhar(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
/** a "estrela da vida" genérica (seis braços azuis com o bastão e a serpente) — símbolo de serviço médico de emergência */
function estrela(g, cx, cy, r) {
  g.save(); g.translate(cx, cy);
  g.fillStyle = '#ffffff'; for (let k = 0; k < 3; k++) { g.save(); g.rotate(k * Math.PI / 3); g.fillRect(-r * 0.36, -r * 1.06, r * 0.72, r * 2.12); g.restore(); }
  g.fillStyle = '#1F5FB8'; for (let k = 0; k < 3; k++) { g.save(); g.rotate(k * Math.PI / 3); g.fillRect(-r * 0.3, -r, r * 0.6, r * 2); g.restore(); }
  g.strokeStyle = '#ffffff'; g.lineWidth = r * 0.09; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, -r * 0.78); g.lineTo(0, r * 0.78); g.stroke();
  g.lineWidth = r * 0.07; g.beginPath();
  for (let i = 0; i <= 40; i++) { const u = i / 40, y = -r * 0.62 + u * r * 1.3, x = Math.sin(u * Math.PI * 3.2) * r * 0.16; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(0, -r * 0.68, r * 0.1, r * 0.07, 0, 0, Math.PI * 2); g.fill();
  g.restore();
}
const FONTE = '"Arial Black", "DejaVu Sans", Arial, sans-serif';
const VERM = '#C8102E', VERM2 = '#E03A2E';
/** lateral do módulo: faixas vermelhas, nome do serviço, número da unidade, estrela da vida, frestas das portas dos compartimentos */
function texturaLado(opc, lado) {
  const { z0, z1, y0, y1 } = A.MOD, W = 2048, H = Math.round(W * (y1 - y0) / (z1 - z0)), ppm = W / (z1 - z0);
  return tela(W, H, (g) => {
    const X = z => lado > 0 ? (z1 - z) * ppm : (z - z0) * ppm;        // o lado do motorista (+X) é visto com a frente à esquerda? não: de +X a frente (+Z) fica à direita
    const Y = y => (y1 - y) * ppm;
    g.clearRect(0, 0, W, H);
    // frestas dos compartimentos e da porta lateral (linhas finas escuras) + borda de borracha
    const porta = (za, zb, ya, yb) => { g.strokeStyle = 'rgba(20,20,22,0.85)'; g.lineWidth = 3.2; const xa = X(za), xb = X(zb); g.beginPath(); if (g.roundRect) g.roundRect(Math.min(xa, xb), Y(yb), Math.abs(xb - xa), Y(ya) - Y(yb), 10); else g.rect(Math.min(xa, xb), Y(yb), Math.abs(xb - xa), Y(ya) - Y(yb)); g.stroke(); };
    if (lado > 0) porta(0.08, 0.90, 0.98, 2.30); else porta(0.06, 0.94, 0.98, 2.38);
    // faixa vermelha larga + filete
    g.fillStyle = VERM; g.fillRect(0, Y(1.42), W, Y(1.24) - Y(1.42));
    g.fillStyle = VERM2; g.fillRect(0, Y(1.20), W, Y(1.16) - Y(1.20));
    g.fillStyle = VERM; g.fillRect(0, Y(2.62), W, Y(2.56) - Y(2.62));
    // textos (na faixa branca de cima)
    g.fillStyle = VERM; g.textBaseline = 'middle';
    const zTexto = lado > 0 ? -1.25 : -1.25;
    g.font = `900 ${Math.round(0.30 * ppm)}px ${FONTE}`; g.textAlign = 'center';
    g.fillText(opc.servico || 'AMBULANCE', X(zTexto), Y(1.92));
    g.font = `900 ${Math.round(0.15 * ppm)}px ${FONTE}`; g.fillStyle = '#1C2A44';
    g.fillText(opc.cidade || 'HRYZ CITY EMS', X(zTexto), Y(1.66));
    g.fillStyle = '#ffffff'; g.font = `900 ${Math.round(0.13 * ppm)}px ${FONTE}`;
    g.fillText(`MEDIC ${opc.numero || '7'}`, X(-2.70), Y(1.33));
    estrela(g, X(-2.72), Y(1.95), 0.30 * ppm);
  });
}
/** traseira do módulo: portas duplas com janelas, faixas, chevrons vermelho/amarelo, MEDIC n e estrela */
function texturaTras(opc) {
  const W = 1024, H = Math.round(W * (A.MOD.y1 - A.MOD.y0) / (2 * A.MOD.x)), ppm = W / (2 * A.MOD.x);
  return tela(W, H, (g) => {
    const X = x => (A.MOD.x - x) * ppm, Y = y => (A.MOD.y1 - y) * ppm;    // vista de trás: +x (motorista) fica à direita da imagem? de trás, +X aparece à direita
    g.clearRect(0, 0, W, H);
    // chevrons na metade de baixo das portas
    g.save(); g.beginPath(); g.rect(X(0.66), Y(1.40), X(-0.66) - X(0.66), Y(0.95) - Y(1.40)); g.clip();
    for (let i = -20; i < 20; i++) { g.fillStyle = i % 2 ? '#F2C200' : VERM; g.beginPath(); const x0 = W / 2 + i * 44; g.moveTo(x0, Y(1.40)); g.lineTo(x0 + 44, Y(1.40)); g.lineTo(x0 + 44 + (i < 0 ? -1 : 1) * 0, Y(1.40)); g.lineTo(x0 + 44 - 120 * Math.sign(i + 0.5), Y(0.95)); g.lineTo(x0 - 120 * Math.sign(i + 0.5), Y(0.95)); g.closePath(); g.fill(); }
    g.restore();
    g.fillStyle = VERM; g.fillRect(0, Y(1.52), W, Y(1.42) - Y(1.52)); g.fillRect(0, Y(2.62), W, Y(2.56) - Y(2.62));
    // frestas das portas
    g.strokeStyle = 'rgba(20,20,22,0.9)'; g.lineWidth = 3.5;
    g.strokeRect(X(0.66), Y(2.36), X(0.012) - X(0.66), Y(0.95) - Y(2.36)); g.strokeRect(X(-0.012), Y(2.36), X(-0.66) - X(-0.012), Y(0.95) - Y(2.36));
    g.fillStyle = '#1C2A44'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `900 ${Math.round(0.11 * ppm)}px ${FONTE}`;
    g.fillText(`MEDIC ${opc.numero || '7'}`, X(-0.92), Y(2.25));
    estrela(g, X(0.92), Y(2.25), 0.13 * ppm);
  });
}
/** frente do módulo (sobre a cabine) e capô: AMBULANCE espelhado (para ler no retrovisor) */
function texturaEspelhada(txt, w, h, cor = VERM, fundo = null) {
  return tela(w, h, (g) => {
    g.clearRect(0, 0, w, h); if (fundo) { g.fillStyle = fundo; g.fillRect(0, 0, w, h); }
    g.save(); g.translate(w, 0); g.scale(-1, 1); g.fillStyle = cor; g.font = `900 ${Math.round(h * 0.62)}px ${FONTE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 2); g.restore();
  });
}
function texturaCabineLado(lado) {
  // faixa que continua na porta da cabine + frestas da porta
  const z0 = A.CAB.z0, z1 = 2.25, y0 = 0.55, y1 = 2.15, W = 1024, ppm = W / (z1 - z0), H = Math.round((y1 - y0) * ppm);
  return tela(W, H, (g) => {
    const X = z => lado > 0 ? (z1 - z) * ppm : (z - z0) * ppm, Y = y => (y1 - y) * ppm;
    g.clearRect(0, 0, W, H);
    g.fillStyle = VERM; g.fillRect(Math.min(X(z0), X(1.95)), Y(1.42), Math.abs(X(1.95) - X(z0)), Y(1.24) - Y(1.42));
    g.fillStyle = VERM2; g.fillRect(Math.min(X(z0), X(1.95)), Y(1.20), Math.abs(X(1.95) - X(z0)), Y(1.16) - Y(1.20));
    g.strokeStyle = 'rgba(20,20,22,0.85)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(X(1.06), Y(2.04)); g.lineTo(X(1.06), Y(0.70)); g.lineTo(X(2.00), Y(0.70)); g.lineTo(X(2.00), Y(1.40)); g.stroke();
    g.fillStyle = '#1C2A44'; g.font = `900 ${Math.round(0.11 * ppm)}px ${FONTE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('EMS', X(1.55), Y(1.04));
  });
}

/* ------------------------------------------------------------------ peças */
function decal(tex, w, h, pos, rotY, rotX = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.35, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false }));
  m.position.set(...pos); m.rotation.set(rotX, rotY, 0, 'YXZ'); m.renderOrder = 2; m.receiveShadow = true; return m;
}
function caixa(sx, sy, sz, mat, r = 0.01, pos = [0, 0, 0]) {
  const m = new THREE.Mesh(r > 0 ? new RoundedBoxGeometry(sx, sy, sz, 2, Math.min(r, sx / 2 - 1e-4, sy / 2 - 1e-4, sz / 2 - 1e-4)) : new THREE.BoxGeometry(sx, sy, sz), mat);
  m.position.set(...pos); m.castShadow = m.receiveShadow = true; return m;
}
/** perfil lateral da cabine (z, y), extrudado na largura: capô, para-brisa, teto, arco da roda dianteira */
function geoCabine() {
  const s = new THREE.Shape(), R = 0.50, zr = A.ZF;
  s.moveTo(A.CAB.z0, 0.66);
  s.lineTo(A.CAB.z0, 2.10); s.lineTo(1.08, 2.16); s.lineTo(1.62, 2.16); s.lineTo(1.72, 2.12);
  s.lineTo(2.18, 1.47); s.lineTo(2.30, 1.42); s.lineTo(3.12, 1.24); s.lineTo(3.24, 1.20); s.lineTo(3.30, 1.12);
  s.lineTo(3.31, 0.66); s.lineTo(zr + R + 0.02, 0.62);
  s.absarc(zr, 0.40, R, Math.atan2(0.22, R), Math.PI - Math.atan2(0.22, R), false);
  s.lineTo(A.CAB.z0, 0.66);
  const g = new THREE.ExtrudeGeometry(s, { depth: 2 * A.CAB.x, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.045, bevelSegments: 4, steps: 1, curveSegments: 24 });
  g.translate(0, 0, -A.CAB.x); g.rotateY(-Math.PI / 2);          // a extrusão vira a largura (x); o x do perfil vira o comprimento (z)
  g.computeVertexNormals(); return g;
}
/** pneu (perfil girado) + roda de aço com aro, cubo e porcas; dupla = roda traseira de rodado duplo (prato fundo) */
function roda(mats, dupla = false, externa = true) {
  const G = new THREE.Group(), giro = new THREE.Group(); G.add(giro);
  const R = A.RP, L = 0.11, rr = 0.205;
  const pts = []; for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + Math.PI * i / 16; pts.push(new THREE.Vector2(R - 0.045 + Math.cos(a) * 0.045 * (Math.abs(Math.sin(a)) < 0.9 ? 1 : 1), Math.sin(a) * L)); }
  const perfil = [new THREE.Vector2(rr, -L * 0.92), ...pts.map(p => new THREE.Vector2(Math.max(p.x, rr), p.y)), new THREE.Vector2(rr, L * 0.92)];
  const pneu = new THREE.Mesh(new THREE.LatheGeometry(perfil, 56), mats.pneu); pneu.rotation.z = Math.PI / 2; pneu.castShadow = pneu.receiveShadow = true; giro.add(pneu);
  const lado = externa ? 1 : -1;
  const disco = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, 0.02, 40), mats.roda); disco.rotation.z = Math.PI / 2; disco.position.x = lado * (dupla ? 0.02 : 0.07); giro.add(disco);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.012, 8, 48), mats.cromo); aro.rotation.y = Math.PI / 2; aro.position.x = lado * 0.095; giro.add(aro);
  const cubo = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.10, 0.08, 32), mats.cromo); cubo.rotation.z = Math.PI / 2; cubo.position.x = lado * (dupla ? 0.06 : 0.10); giro.add(cubo);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, p = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.03, 6), mats.cromo); p.rotation.z = Math.PI / 2; p.position.set(lado * (dupla ? 0.05 : 0.09), Math.cos(a) * 0.125, Math.sin(a) * 0.125); giro.add(p); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3, f = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), mats.escuro); f.rotation.y = lado * Math.PI / 2; f.position.set(lado * (dupla ? 0.031 : 0.081), Math.cos(a) * 0.165, Math.sin(a) * 0.165); giro.add(f); }
  return { grupo: G, giro };
}
/** cabeça de luz de emergência (lente + moldura), devolve a malha da lente para acender */
function cabecaLuz(w, h, cor, mats, pos, normal) {
  const g = new THREE.Group();
  const mold = caixa(w + 0.02, h + 0.02, 0.05, mats.cromo, 0.008); g.add(mold);
  const lenteMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(cor).multiplyScalar(0.55), emissive: new THREE.Color(cor), emissiveIntensity: 0, roughness: 0.15, metalness: 0.1 });
  const lente = caixa(w, h, 0.03, lenteMat, 0.006, [0, 0, 0.018]); g.add(lente);
  for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.004, 0.002), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })); l.position.set(0, -h / 2 + h * (i + 1) / 4, 0.034); g.add(l); }
  g.position.set(...pos); g.lookAt(new THREE.Vector3(...pos).add(new THREE.Vector3(...normal))); return { grupo: g, mat: lenteMat };
}

/* ------------------------------------------------------------------ montagem */
export function criarAmbulancia(opc = {}) {
  const G = new THREE.Group(); G.name = 'ambulanciaTypeIII';
  const mats = {
    branco: new THREE.MeshPhysicalMaterial({ color: opc.corBase ?? 0xf4f5f2, roughness: 0.32, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.06 }),
    vidro: new THREE.MeshPhysicalMaterial({ color: 0x0b1117, roughness: 0.05, metalness: 0.2, envMapIntensity: 2.0 }),
    escuro: new THREE.MeshStandardMaterial({ color: 0x141517, roughness: 0.7, metalness: 0.2 }),
    plastico: new THREE.MeshStandardMaterial({ color: 0x222326, roughness: 0.55, metalness: 0.1 }),
    cromo: new THREE.MeshStandardMaterial({ color: 0xdfe3e8, roughness: 0.16, metalness: 1.0 }),
    pneu: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 }),
    roda: new THREE.MeshStandardMaterial({ color: 0xd9dbdd, roughness: 0.35, metalness: 0.7 }),
    chapaXadrez: new THREE.MeshStandardMaterial({ color: 0xbfc3c7, roughness: 0.3, metalness: 1.0, bumpMap: tela(256, 256, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.save(); g.translate(x * 32 + 16, y * 32 + 16); g.rotate((x + y) % 2 ? 0.7 : -0.7); g.fillRect(-11, -3, 22, 6); g.restore(); } }), bumpScale: 2 }),
  };
  mats.chapaXadrez.bumpMap.wrapS = mats.chapaXadrez.bumpMap.wrapT = THREE.RepeatWrapping; mats.chapaXadrez.bumpMap.repeat.set(6, 1);
  const add = (o, pai = G) => { pai.add(o); return o; };
  const { z0, z1, x: mx, y0, y1 } = A.MOD, mz = (z0 + z1) / 2, ml = z1 - z0;

  // ---------------- chassi, eixos, rodas
  add(caixa(0.9, 0.18, 6.0, mats.escuro, 0, [0, 0.5, 0]));
  for (const z of [A.ZF, A.ZR]) add(caixa(1.6, 0.12, 0.12, mats.escuro, 0, [0, A.RP, z]));
  const rodas = [];
  const posR = [{ z: A.ZF, x: 0.86, d: true }, { z: A.ZF, x: -0.86, d: true }, { z: A.ZR, x: 1.00, d: false, ext: true }, { z: A.ZR, x: 0.76, d: false, ext: false }, { z: A.ZR, x: -1.00, d: false, ext: true }, { z: A.ZR, x: -0.76, d: false, ext: false }];
  for (const p of posR) {
    const pivo = new THREE.Group(); pivo.position.set(p.x, A.RP, p.z); add(pivo);
    const r = roda(mats, !p.d, p.ext !== false); if (p.x < 0) r.grupo.rotation.y = Math.PI; pivo.add(r.grupo); rodas.push({ ...p, pivo, giro: r.giro });
  }

  // ---------------- cabine
  const cab = new THREE.Mesh(geoCabine(), mats.branco); cab.castShadow = cab.receiveShadow = true; add(cab);
  // para-brisa e janelas
  const pb = new THREE.Shape(); pb.moveTo(-0.86, 0); pb.lineTo(0.86, 0); pb.lineTo(0.80, 1); pb.lineTo(-0.80, 1); pb.closePath();
  const vPB = new THREE.Mesh(new THREE.ShapeGeometry(pb), mats.vidro);
  { const P = t => new THREE.Vector3(0, 1.47 + (2.12 - 1.47) * t, 2.18 + (1.72 - 2.18) * t), a = P(0.06), b = P(0.94), up = b.clone().sub(a), len = up.length(); up.normalize();
    const n = new THREE.Vector3().crossVectors(new THREE.Vector3(1, 0, 0), up);
    vPB.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), up, n)); vPB.scale.set(1, len, 1); vPB.position.copy(a).addScaledVector(n, 0.05); }
  add(vPB);
  for (const s of [1, -1]) {
    const jw = new THREE.Shape();                                                                         // janela da porta, com o canto inclinado na coluna A
    if (s > 0) { jw.moveTo(0, 0); jw.lineTo(0.92, 0); jw.lineTo(0.92, 0.58); jw.lineTo(0.30, 0.58); } else { jw.moveTo(0, 0); jw.lineTo(0.92, 0); jw.lineTo(0.62, 0.58); jw.lineTo(0, 0.58); } jw.closePath();
    const j = new THREE.Mesh(new THREE.ShapeGeometry(jw), mats.vidro); j.position.set(s * (A.CAB.x + 0.047), 1.45, s > 0 ? 2.02 : 1.10); j.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; add(j);
    // retrovisor "west coast" grande no braço cromado
    const br = caixa(0.25, 0.02, 0.02, mats.cromo, 0, [s * (A.CAB.x + 0.17), 1.62, 2.02]); add(br);
    add(caixa(0.02, 0.38, 0.02, mats.cromo, 0, [s * (A.CAB.x + 0.28), 1.80, 2.02]));
    add(caixa(0.06, 0.40, 0.20, mats.plastico, 0.02, [s * (A.CAB.x + 0.31), 1.82, 2.00]));
    add(caixa(0.02, 0.32, 0.16, mats.vidro, 0.01, [s * (A.CAB.x + 0.285), 1.82, 2.00]));
    add(caixa(0.03, 0.04, 0.14, mats.cromo, 0.01, [s * (A.CAB.x + 0.05), 1.30, 1.25]));        // maçaneta
    // degrau da cabine
    add(caixa(0.12, 0.04, 0.55, mats.chapaXadrez, 0.005, [s * (A.CAB.x - 0.02), 0.50, 1.52]));
    add(decal(texturaCabineLado(s), 2.25 - A.CAB.z0, 1.60, [s * (A.CAB.x + 0.048), 1.35, (A.CAB.z0 + 2.25) / 2], s > 0 ? Math.PI / 2 : -Math.PI / 2));
  }
  // frente: grade, faróis, setas, para-choque, placa, emblema
  const zf = 3.335;
  add(caixa(1.18, 0.40, 0.04, mats.plastico, 0.02, [0, 0.93, zf]));
  for (let i = 0; i < 4; i++) add(caixa(1.10, 0.025, 0.02, mats.cromo, 0.005, [0, 0.80 + i * 0.085, zf + 0.025]));
  add(caixa(0.02, 0.38, 0.02, mats.cromo, 0, [0, 0.93, zf + 0.03]));
  const emb = new THREE.Mesh(new THREE.CircleGeometry(0.07, 32), new THREE.MeshStandardMaterial({ color: 0x1d3a7a, roughness: 0.2, metalness: 0.6 })); emb.scale.set(1.5, 0.75, 1); emb.position.set(0, 0.93, zf + 0.045); add(emb);
  const farol = new THREE.MeshStandardMaterial({ color: 0xdfe8ee, emissive: 0xfff3d6, emissiveIntensity: 0, roughness: 0.05, metalness: 0.3 });
  const setaFr = new THREE.MeshStandardMaterial({ color: 0xc98a20, emissive: 0xffa020, emissiveIntensity: 0, roughness: 0.1 });
  for (const s of [1, -1]) {
    add(caixa(0.30, 0.22, 0.05, mats.cromo, 0.012, [s * 0.78, 0.96, zf - 0.005]));
    add(caixa(0.27, 0.19, 0.04, farol, 0.01, [s * 0.78, 0.96, zf + 0.012]));
    for (const dx of [-0.065, 0.065]) { const c = new THREE.Mesh(new THREE.CircleGeometry(0.055, 32), new THREE.MeshStandardMaterial({ color: 0xf2f6fa, roughness: 0.02, metalness: 0.9 })); c.position.set(s * 0.78 + dx, 0.96, zf + 0.034); add(c); }
    add(caixa(0.10, 0.19, 0.04, setaFr, 0.01, [s * 0.98, 0.96, zf - 0.02]));
  }
  add(caixa(2.08, 0.20, 0.14, mats.cromo, 0.03, [0, 0.55, 3.35]));                                   // para-choque
  add(caixa(0.31, 0.15, 0.01, new THREE.MeshStandardMaterial({ map: tela(310, 150, (g, w, h) => { g.fillStyle = '#f4f4f0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#333'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); g.fillStyle = '#1C2A44'; g.font = `900 64px ${FONTE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(opc.placa || 'EMS 911', w / 2, h / 2 + 8); g.font = '700 20px Arial'; g.fillText('HRYZ STATE', w / 2, 24); }), roughness: 0.4 }), 0, [0, 0.55, 3.43]));
  // AMBULANCE espelhado no capô e na testa do módulo
  add(decal(texturaEspelhada('AMBULANCE', 1024, 200), 1.30, 0.25, [0, 1.36, 2.75], 0, -Math.PI / 2 + 0.21));
  // luzes de cruzamento nos para-lamas e na grade
  const luzes = { vermelho: [], branco: [], ambar: [], cena: [] };
  const cab2 = (w, h, cor, pos, n, grupo) => { const c = cabecaLuz(w, h, cor, mats, pos, n); add(c.grupo); luzes[grupo].push({ mat: c.mat, pos: new THREE.Vector3(...pos) }); return c; };
  for (const s of [1, -1]) { cab2(0.16, 0.07, 0xff2020, [s * 0.98, 1.16, 3.18], [s * 0.6, 0, 1], 'vermelho'); cab2(0.13, 0.05, 0xff2020, [s * 0.38, 1.10, zf + 0.05], [0, 0, 1], 'vermelho'); }

  // ---------------- módulo (baú)
  const mod = caixa(2 * mx, y1 - y0, ml, mats.branco, 0.07, [0, (y0 + y1) / 2, mz]); add(mod);
  add(caixa(2 * mx - 0.04, 0.06, ml - 0.04, mats.plastico, 0.02, [0, y1 + 0.01, mz]));                    // calha do teto
  add(caixa(1.10, 0.20, 0.90, mats.branco, 0.05, [0, y1 + 0.12, -2.35]));                               // ar-condicionado no teto
  // saias com o vão da roda traseira
  const wz0 = A.ZR + 0.62, wz1 = A.ZR - 0.62;
  for (const s of [1, -1]) {
    add(caixa(0.10, 0.46, z1 - wz0, mats.branco, 0.03, [s * (mx - 0.05), 0.70, (z1 + wz0) / 2]));
    add(caixa(0.10, 0.46, wz1 - z0, mats.branco, 0.03, [s * (mx - 0.05), 0.70, (wz1 + z0) / 2]));
    const arco = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 8, 40, Math.PI), mats.plastico); arco.rotation.y = Math.PI / 2; arco.position.set(s * (mx + 0.005), 0.48, A.ZR); add(arco);
    add(caixa(0.02, 0.62, 1.20, mats.escuro, 0, [s * (mx - 0.32), 0.78, A.ZR]));                         // parede interna do vão
    add(decal(texturaLado(opc, s), ml, y1 - y0, [s * (mx + 0.002), (y0 + y1) / 2, mz], s > 0 ? Math.PI / 2 : -Math.PI / 2));
    // janela da porta lateral (lado do passageiro) e janelinha do motorista
    if (s < 0) add(caixa(0.02, 0.38, 0.52, mats.vidro, 0.04, [s * (mx + 0.004), 1.98, 0.50]));
    // maçanetas cromadas dos compartimentos
    for (const [zz, yy] of (s > 0 ? [[0.80, 1.62]] : [[0.82, 1.62]])) add(caixa(0.03, 0.05, 0.16, mats.cromo, 0.01, [s * (mx + 0.01), yy, zz]));
    // luzes de emergência dos cantos de cima (vermelhas), âmbar no meio, holofotes de cena brancos
    cab2(0.22, 0.11, 0xff2020, [s * (mx + 0.02), y1 - 0.14, z1 - 0.25], [s, 0, 0], 'vermelho');
    cab2(0.22, 0.11, 0xff2020, [s * (mx + 0.02), y1 - 0.14, z0 + 0.25], [s, 0, 0], 'vermelho');
    cab2(0.22, 0.11, 0xffa020, [s * (mx + 0.02), y1 - 0.14, -1.25], [s, 0, 0], 'ambar');
    cab2(0.26, 0.10, 0xffffff, [s * (mx + 0.02), y1 - 0.14, -0.55], [s, 0, 0], 'cena');
    cab2(0.26, 0.10, 0xffffff, [s * (mx + 0.02), y1 - 0.14, -1.95], [s, 0, 0], 'cena');
    cab2(0.12, 0.06, 0xff2020, [s * (mx + 0.02), 0.82, z1 - 0.18], [s, 0, 0], 'vermelho');                // laterais baixas
    cab2(0.12, 0.06, 0xff2020, [s * (mx + 0.02), 0.82, z0 + 0.18], [s, 0, 0], 'vermelho');
  }
  // frente do módulo (acima da cabine): 5 cabeças vermelha-branca-vermelha + AMBULANCE espelhado
  const zfm = z1 + 0.035;
  [[-0.95, 0xff2020, 'vermelho'], [-0.55, 0xff2020, 'vermelho'], [0, 0xffffff, 'branco'], [0.55, 0xff2020, 'vermelho'], [0.95, 0xff2020, 'vermelho']].forEach(([x, c, gr]) => cab2(0.28, 0.13, c, [x, y1 - 0.15, zfm], [0, 0, 1], gr));
  add(decal(texturaEspelhada('AMBULANCE', 1024, 170), 1.55, 0.26, [0, 2.32, z1 + 0.002], 0));
  // traseira: portas, janelas, puxadores, degrau, lanternas e luzes
  const zt = z0 - 0.035;
  add(decal(texturaTras(opc), 2 * mx, y1 - y0, [0, (y0 + y1) / 2, z0 - 0.002], Math.PI));
  for (const s of [1, -1]) {
    add(caixa(0.50, 0.42, 0.02, mats.vidro, 0.04, [s * 0.34, 1.95, z0 - 0.006]));
    add(caixa(0.04, 0.18, 0.04, mats.cromo, 0.01, [s * 0.08, 1.45, z0 - 0.02]));
    for (const y of [1.15, 1.75, 2.25]) add(caixa(0.05, 0.10, 0.03, mats.cromo, 0.01, [s * 0.66, y, z0 - 0.015]));     // dobradiças
  }
  add(caixa(2.0, 0.08, 0.38, mats.chapaXadrez, 0.01, [0, 0.62, z0 - 0.17]));                           // degrau traseiro
  add(caixa(2.0, 0.16, 0.06, mats.escuro, 0.01, [0, 0.52, z0 - 0.33]));
  const lanterna = { freio: [], re: [], setaE: [], setaD: [] };
  const lMat = (cor) => new THREE.MeshStandardMaterial({ color: new THREE.Color(cor).multiplyScalar(0.5), emissive: new THREE.Color(cor), emissiveIntensity: 0, roughness: 0.1 });
  for (const s of [1, -1]) {
    const x = s * 0.98;
    add(caixa(0.22, 0.62, 0.05, mats.cromo, 0.02, [x, 1.10, zt]));
    const mF = lMat(0xff1a1a), mS = lMat(0xffa020), mR = lMat(0xffffff);
    add(caixa(0.18, 0.18, 0.04, mF, 0.02, [x, 1.30, zt - 0.02])); add(caixa(0.18, 0.18, 0.04, mS, 0.02, [x, 1.10, zt - 0.02])); add(caixa(0.18, 0.15, 0.04, mR, 0.02, [x, 0.92, zt - 0.02]));
    lanterna.freio.push(mF); lanterna.re.push(mR); lanterna[s > 0 ? 'setaE' : 'setaD'].push(mS);
    cab2(0.22, 0.11, 0xff2020, [s * 0.95, y1 - 0.14, zt], [0, 0, -1], 'vermelho');
    cab2(0.20, 0.10, 0xff2020, [s * 0.98, 1.62, zt], [0, 0, -1], 'vermelho');
  }
  cab2(0.30, 0.11, 0xffa020, [0, y1 - 0.14, zt], [0, 0, -1], 'ambar');
  add(caixa(0.31, 0.15, 0.01, mats.branco, 0, [0, 0.80, z0 - 0.04]));
  // frisos cromados (rub rail) nas laterais do módulo, luzes de posição (âmbar na frente, vermelhas atrás), limpadores, setas laterais da cabine
  const posicao = [];
  for (const s of [1, -1]) {
    add(caixa(0.03, 0.05, ml - 0.10, mats.cromo, 0.01, [s * (mx + 0.012), 1.00, mz]));
    for (const [zz, cor] of [[z1 - 0.06, 0xffa020], [z0 + 0.06, 0xff2020], [mz, 0xffa020]]) { const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(cor).multiplyScalar(0.6), emissive: cor, emissiveIntensity: 0, roughness: 0.2 }); posicao.push(m); add(caixa(0.025, 0.05, 0.09, m, 0.01, [s * (mx + 0.012), y1 - 0.03, zz])); add(caixa(0.025, 0.04, 0.07, m, 0.01, [s * (mx + 0.012), 0.72, zz])); }
    add(caixa(0.02, 0.05, 0.09, setaFr, 0.01, [s * (A.CAB.x + 0.05), 1.05, 2.85]));
    const lp = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.012, 0.012), mats.escuro); lp.position.set(s * 0.38, 1.50, 2.24); lp.rotation.z = s * 0.12; add(lp);
  }
  for (const x of [-0.6, -0.3, 0, 0.3, 0.6]) { const m = new THREE.MeshStandardMaterial({ color: 0x996010, emissive: 0xffa020, emissiveIntensity: 0, roughness: 0.2 }); posicao.push(m); add(caixa(0.07, 0.035, 0.04, m, 0.01, [x, y1 - 0.02, z1 + 0.03])); }
  for (const x of [-0.25, 0, 0.25]) { const m = new THREE.MeshStandardMaterial({ color: 0x991010, emissive: 0xff2020, emissiveIntensity: 0, roughness: 0.2 }); posicao.push(m); add(caixa(0.07, 0.035, 0.04, m, 0.01, [x, y1 - 0.02, z0 - 0.03])); }
  for (const s of [1, -1]) add(caixa(0.18, 0.30, 0.10, mats.escuro, 0.02, [s * 1.08, 0.55, z0 - 0.30]));                      // protetores de canto do para-choque
  // luzes coloridas que iluminam a cena
  const pontos = [new THREE.PointLight(0xff2020, 0, 14, 2), new THREE.PointLight(0xff2020, 0, 14, 2), new THREE.PointLight(0xffffff, 0, 14, 2), new THREE.PointLight(0xffa020, 0, 14, 2)];
  pontos[0].position.set(1.6, 2.4, 0.5); pontos[1].position.set(-1.6, 2.4, -2.8); pontos[2].position.set(0, 2.5, 1.8); pontos[3].position.set(0, 2.5, -3.9); pontos.forEach(p => add(p));
  const fachos = [];
  for (const s of [1, -1]) { const f = new THREE.SpotLight(0xfff2dc, 0, 50, 0.42, 1.0, 1.7); f.position.set(s * 0.78, 0.96, A.ZN); f.target.position.set(s * 0.6, 0, A.ZN + 16); add(f); add(f.target); fachos.push(f); }
  // sombra de contato
  if (opc.sombraChao !== false) {
    const t = tela(256, 640, (g, w, h) => { for (let i = 0; i < 14; i++) { const gr = 4 + i * 5; g.fillStyle = `rgba(0,0,0,${0.075 * (1 - i / 16)})`; g.beginPath(); g.roundRect ? g.roundRect(30 - gr, 26 - gr, w - 60 + 2 * gr, h - 52 + 2 * gr, 30 + i * 6) : g.rect(30 - gr, 26 - gr, w - 60 + 2 * gr, h - 52 + 2 * gr); g.fill(); } });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 7.4), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); pl.rotation.x = -Math.PI / 2; pl.position.y = 0.004; pl.renderOrder = -1; add(pl);
  }
  const acende = (lista, k) => lista.forEach(l => { (l.mat || l).emissiveIntensity = k; });
  const api = {
    grupo: G, rodas, luzesMat: luzes,
    /** luzes de emergência: modo 'off' | 'ligado' (vermelhas alternando lado a lado, branca piscando, âmbar atrás) | 'fixo' */
    luzes(t, modo = 'ligado', forca = 6) {
      if (modo === 'off') { for (const k in luzes) if (k !== 'cena') acende(luzes[k], 0); pontos.forEach(p => p.intensity = 0); return; }
      if (modo === 'fixo') { acende(luzes.vermelho, 2.5); acende(luzes.branco, 2.5); acende(luzes.ambar, 2.5); pontos.forEach(p => p.intensity = forca * 0.6); return; }
      const f = t * 2.2, a = (f % 1) < 0.5, pisca = ((t * 7) % 1) < 0.5;
      luzes.vermelho.forEach(l => { const ld = l.pos.x >= 0; l.mat.emissiveIntensity = (ld === a) && pisca ? 8 : 0.08; });
      luzes.branco.forEach(l => l.mat.emissiveIntensity = !a && pisca ? 8 : 0.05);
      luzes.ambar.forEach(l => l.mat.emissiveIntensity = ((t * 3) % 1) < 0.5 ? 3.5 : 0.05);
      pontos[0].intensity = a && pisca ? forca : 0; pontos[1].intensity = !a && pisca ? forca : 0; pontos[2].intensity = !a && pisca ? forca * 0.6 : 0; pontos[3].intensity = ((t * 3) % 1) < 0.5 ? forca * 0.5 : 0;
    },
    cena(on) { acende(luzes.cena, on ? 3 : 0); },
    farois(on, forca = 70) { farol.emissiveIntensity = on ? 1.2 : 0; fachos.forEach(f => f.intensity = on ? forca : 0); },
    freio(on) { acende(lanterna.freio, on ? 2.5 : 0.15); },
    /** luzes de posição (contorno âmbar/vermelho) */
    posicao(on) { posicao.forEach(m => m.emissiveIntensity = on ? 1.6 : 0); },
    re(on) { acende(lanterna.re, on ? 2.5 : 0); },
    seta(lado, on) { acende(lanterna[lado > 0 ? 'setaE' : 'setaD'], on ? 3 : 0); setaFr.emissiveIntensity = on ? 2 : 0; },
    rodar(metros) { for (const r of rodas) r.giro.rotation.x = metros / A.RP; },
    esterco(rad) { for (const r of rodas) if (r.d) r.pivo.rotation.y = rad; },
  };
  api.freio(false);
  return api;
}
