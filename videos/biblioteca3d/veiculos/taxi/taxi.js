// Táxi amarelo: sedã médio genérico (proporções de um Camry 2020: 4,885 x 1,840 x 1,445 m, entre-eixos 2,825 m), luminoso TAXI no teto,
// faixa quadriculada, número da frota e "HRYZ CITY TAXI" (fictício). Sem marca.
import * as THREE from 'three';
import * as K from '../kit/kit.js';

export const M = { L: 4.885, W: 1.84, H: 1.445, EE: 2.825, R: 0.335 };
export function criar(opc = {}) {
  const G = new THREE.Group(); G.name = 'taxi';
  const mats = K.materiais(opc.cor ?? 0xf6b40e); const add = (o, p = G) => { p.add(o); return o; };
  const zN = M.L / 2, zF = zN - 0.96, zR = zF - M.EE, W = M.W, R = M.R, B = 0.07;
  const TOPO = [[-2.40, 0.34], [-2.44, 0.58], [-2.41, 0.98], [-1.62, 1.03], [0.95, 1.00], [1.80, 0.90], [2.28, 0.82], [2.42, 0.74], [2.44, 0.56], [2.42, 0.34]];
  const fz = (y, l = 1) => K.faceZ(TOPO, y, l, B) + l * 0.012;
  const baixo = add(new THREE.Mesh(K.perfil(TOPO, { yBase: 0.28, largura: W, bevel: B, arcos: [{ z: zF, r: R + 0.05, yc: R }, { z: zR, r: R + 0.05, yc: R }] }), mats.pintura)); baixo.castShadow = baixo.receiveShadow = true;
  const Wg = W * 0.82;
  const cima = add(new THREE.Mesh(K.perfil([[-1.66, 0.98], [-1.20, 1.40], [-0.70, 1.445], [0.28, 1.445], [0.55, 1.40], [1.02, 0.99]], { yBase: 0.98, largura: Wg, bevel: 0.06 }), mats.pintura)); cima.castShadow = true;
  add(K.vidroInclinado([1.00, 1.00], [0.57, 1.38], Wg - 0.10, Wg - 0.22, mats.vidro, 1, 0.062));
  add(K.vidroInclinado([-1.64, 1.00], [-1.23, 1.38], Wg - 0.12, Wg - 0.22, mats.vidro, -1, 0.062));
  add(K.janelas([[0.93, 1.03], [0.54, 1.37], [-0.18, 1.40], [-0.18, 1.03]], Wg / 2 + 0.065, mats.vidro));
  add(K.janelas([[-0.25, 1.03], [-0.25, 1.40], [-0.72, 1.40], [-1.20, 1.05]], Wg / 2 + 0.065, mats.vidro));
  // grafismo do táxi: faixa quadriculada, nome, número, frestas
  add(K.decalLados(W / 2 + B + 0.001, -2.44, 2.44, 0.28, 1.0, (g, w, h, X, Y, s, ppm) => {
    g.strokeStyle = 'rgba(15,15,18,0.85)'; g.lineWidth = 2.5;
    for (const [za, zb] of [[0.95, -0.18], [-0.24, -1.30]]) { g.beginPath(); g.moveTo(X(za), Y(0.98)); g.lineTo(X(za + 0.02), Y(0.42)); g.lineTo(X(zb), Y(0.42)); g.lineTo(X(zb), Y(0.98)); g.stroke(); }
    const q = 0.05 * ppm; for (let i = 0; X(-2.3) + i * q < X(2.3) || X(2.3) + i * q < X(-2.3); i++) for (let j = 0; j < 2; j++) if ((i + j) % 2) { g.fillStyle = '#111'; g.fillRect(Math.min(X(-2.3), X(2.3)) + i * q, Y(0.80) + j * q, q, q); }
    g.fillStyle = '#111'; g.font = `900 ${Math.round(0.11 * ppm)}px ${K.FONTE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('HRYZ CITY TAXI', X(-0.25), Y(0.58)); g.font = `900 ${Math.round(0.09 * ppm)}px ${K.FONTE}`; g.fillText(opc.numero || '4A12', X(1.75), Y(0.62));
  }));
  for (const s of [1, -1]) for (const z of [0.55, -0.62]) add(K.caixa(0.03, 0.035, 0.15, mats.cromo, 0.012, [s * (W / 2 + B), 0.90, z]));
  for (const s of [1, -1]) { add(K.caixa(0.05, 0.04, 0.12, mats.plastico, 0.01, [s * (Wg / 2 + 0.10), 1.00, 0.88])); add(K.caixa(0.20, 0.13, 0.10, mats.pintura, 0.04, [s * (Wg / 2 + 0.20), 1.04, 0.86])); }
  // luminoso TAXI no teto
  const tl = new THREE.MeshStandardMaterial({ map: K.tela(512, 128, (g, w, h) => { g.fillStyle = '#fff6cc'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; g.font = `900 96px ${K.FONTE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TAXI', w / 2, h / 2 + 6); }), emissive: 0xfff2b0, emissiveIntensity: 0.3, roughness: 0.3 });
  const placaTeto = add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.16, 0.20), [mats.plastico, mats.plastico, mats.plastico, mats.plastico, tl, tl])); placaTeto.position.set(0, 1.445 + 0.12, -0.25); placaTeto.castShadow = true;
  add(K.caixa(0.50, 0.04, 0.12, mats.plastico, 0.01, [0, 1.47, -0.25]));
  const luzes = { farol: [], freio: [], re: [], setaE: [], setaD: [], posicao: [tl] };
  for (const s of [1, -1]) {
    const f = K.lampada(0.42, 0.11, 0.05, 0xfff4dc, [s * 0.62, 0.76, fz(0.76)], 0.03, 0.9); add(f.malha); luzes.farol.push(f.mat);
    const st = K.lampada(0.08, 0.05, 0.03, 0xffa020, [s * 0.83, 0.72, fz(0.72) - 0.02], 0.015); add(st.malha); luzes[s > 0 ? 'setaE' : 'setaD'].push(st.mat);
    const fr = K.lampada(0.36, 0.11, 0.05, 0xff1a1a, [s * 0.66, 0.90, fz(0.90, -1)], 0.03); add(fr.malha); luzes.freio.push(fr.mat);
    const rr = K.lampada(0.10, 0.05, 0.03, 0xffffff, [s * 0.40, 0.88, fz(0.88, -1) - 0.01], 0.015); add(rr.malha); luzes.re.push(rr.mat);
  }
  add(K.caixa(0.70, 0.14, 0.05, mats.plastico, 0.03, [0, 0.74, fz(0.74)]));
  for (let i = 0; i < 3; i++) add(K.caixa(0.66, 0.012, 0.02, mats.cromo, 0, [0, 0.70 + i * 0.04, fz(0.74) + 0.025]));
  add(K.caixa(1.30, 0.12, 0.05, mats.plastico, 0.04, [0, 0.44, fz(0.44)]));
  add(K.placa(opc.placa || 'TX 4A12', 'HRYZ STATE', null, [0, 0.58, fz(0.58) + 0.01]));
  add(K.caixa(1.60, 0.14, 0.05, mats.plastico, 0.04, [0, 0.42, fz(0.42, -1)]));
  add(K.placa(opc.placa || 'TX 4A12', 'HRYZ STATE', null, [0, 0.68, fz(0.68, -1) - 0.01], true));
  const rd = K.rodas(G, [{ z: zF, x: 0.80, d: true }, { z: zF, x: -0.80, d: true }, { z: zR, x: 0.80 }, { z: zR, x: -0.80 }], R, 0.215, mats, { estilo: 'aco', aro: 0.62 });
  add(K.caixa(1.3, 0.12, 3.6, mats.escuro, 0, [0, 0.26, -0.1]));
  if (opc.sombraChao !== false) add(K.sombraChao(M.L, W));
  const fachos = []; for (const s of [1, -1]) { const f = new THREE.SpotLight(0xfff2dc, 0, 40, 0.42, 1.0, 1.7); f.position.set(s * 0.62, 0.76, zN); f.target.position.set(s * 0.5, 0, zN + 14); add(f); add(f.target); fachos.push(f); }
  return K.api(G, { L: M.L, W, H: M.H + 0.2, R, luzes, rodas: rd, fachos });
}
