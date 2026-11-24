// Picape grande de cabine dupla (proporções de uma F-150 SuperCrew 5,5': 5,89 x 2,01 x 1,90 m, entre-eixos 3,68 m), genérica e sem marca.
import * as THREE from 'three';
import * as K from '../kit/kit.js';

export const M = { L: 5.89, W: 2.01, H: 1.90, EE: 3.68, R: 0.40 };
export function criar(opc = {}) {
  const G = new THREE.Group(); G.name = 'picape';
  const mats = K.materiais(opc.cor ?? 0x7a1418); const add = (o, p = G) => { p.add(o); return o; };
  const zN = M.L / 2, zF = zN - 0.96, zR = zF - M.EE, W = M.W, R = M.R, B = 0.06;
  const TOPO = [[-2.92, 0.50], [-2.94, 0.68], [-2.92, 0.96], [-0.66, 0.96], [-0.66, 1.30], [1.10, 1.33], [2.50, 1.24], [2.88, 1.18], [2.94, 0.98], [2.94, 0.50]];
  const fz = (y, l = 1) => K.faceZ(TOPO, y, l, B) + l * 0.012;
  const arcos = [{ z: zF, r: R + 0.07, yc: R }, { z: zR, r: R + 0.07, yc: R }];
  add(new THREE.Mesh(K.perfil(TOPO, { yBase: 0.46, largura: W, bevel: B, arcos }), mats.pintura)).castShadow = true;
  // caçamba: laterais, tampa, assoalho escuro, caixas de roda
  const zc0 = -2.90, zc1 = -0.70;
  for (const s of [1, -1]) add(K.caixa(0.09, 0.36, zc1 - zc0, mats.pintura, 0.03, [s * (W / 2 - 0.05), 1.13, (zc0 + zc1) / 2]));
  add(K.caixa(W - 0.02, 0.36, 0.08, mats.pintura, 0.03, [0, 1.13, zc0 - 0.02]));
  add(K.caixa(W - 0.20, 0.02, zc1 - zc0 - 0.05, mats.escuro, 0, [0, 0.975, (zc0 + zc1) / 2]));
  for (const s of [1, -1]) add(K.caixa(0.25, 0.20, 0.95, mats.escuro, 0.04, [s * 0.70, 1.06, zR]));
  // cabine (estufa)
  const Wg = W * 0.88;
  add(new THREE.Mesh(K.perfil([[-0.68, 1.28], [-0.66, 1.88], [0.58, 1.90], [0.78, 1.86], [1.18, 1.31]], { yBase: 1.28, largura: Wg, bevel: 0.05 }), mats.pintura)).castShadow = true;
  add(K.vidroInclinado([1.15, 1.34], [0.80, 1.83], Wg - 0.10, Wg - 0.18, mats.vidro, 1, 0.052));
  add(K.vidroInclinado([-0.70, 1.40], [-0.69, 1.80], Wg - 0.40, Wg - 0.40, mats.vidro, -1, 0.052));
  add(K.janelas([[1.06, 1.36], [0.76, 1.81], [0.02, 1.83], [0.02, 1.36]], Wg / 2 + 0.055, mats.vidro));
  add(K.janelas([[-0.06, 1.36], [-0.06, 1.83], [-0.56, 1.83], [-0.56, 1.36]], Wg / 2 + 0.055, mats.vidro));
  add(K.decalLados(W / 2 + B + 0.001, -2.94, 2.94, 0.46, 1.32, (g, w, h, X, Y) => {
    g.strokeStyle = 'rgba(15,15,18,0.85)'; g.lineWidth = 2.5;
    for (const [za, zb] of [[1.08, 0.02], [-0.04, -0.62]]) { g.beginPath(); g.moveTo(X(za), Y(1.30)); g.lineTo(X(za), Y(0.62)); g.lineTo(X(zb), Y(0.62)); g.lineTo(X(zb), Y(1.30)); g.stroke(); }
    g.beginPath(); g.moveTo(X(-0.68), Y(0.97)); g.lineTo(X(-0.68), Y(0.62)); g.stroke();
  }));
  for (const s of [1, -1]) {
    for (const z of [0.70, -0.30]) add(K.caixa(0.03, 0.04, 0.17, mats.cromo, 0.012, [s * (W / 2 + B), 1.20, z]));
    add(K.caixa(0.10, 0.06, 2.0, mats.plastico, 0.02, [s * (W / 2 + 0.02), 0.50, 0.30]));                         // estribo
    add(K.caixa(0.06, 0.06, 0.14, mats.plastico, 0.01, [s * (Wg / 2 + 0.10), 1.40, 1.05])); add(K.caixa(0.08, 0.26, 0.20, mats.plastico, 0.03, [s * (Wg / 2 + 0.22), 1.48, 1.02]));
    for (const z of [zF, zR]) { const a = new THREE.Mesh(new THREE.TorusGeometry(R + 0.08, 0.04, 8, 32, Math.PI), mats.plastico); a.rotation.y = Math.PI / 2; a.position.set(s * (W / 2 + 0.03), R, z); add(a); }
  }
  // frente: grade grande cromada, faróis em C, para-choque cromado; traseira: lanternas verticais, tampa com maçaneta
  const luzes = { farol: [], freio: [], re: [], setaE: [], setaD: [], posicao: [] };
  add(K.caixa(1.10, 0.42, 0.05, mats.cromo, 0.04, [0, 1.02, fz(1.02)]));
  add(K.caixa(1.00, 0.34, 0.04, mats.plastico, 0.03, [0, 1.02, fz(1.02) + 0.02]));
  for (let i = 0; i < 3; i++) add(K.caixa(1.0, 0.03, 0.02, mats.cromo, 0, [0, 0.92 + i * 0.10, fz(1.02) + 0.045]));
  for (const s of [1, -1]) {
    const f = K.lampada(0.30, 0.20, 0.05, 0xfff4dc, [s * 0.78, 1.05, fz(1.05) - 0.01], 0.03, 0.9); add(f.malha); luzes.farol.push(f.mat);
    const st = K.lampada(0.05, 0.20, 0.04, 0xffa020, [s * 0.96, 1.05, fz(1.05) - 0.05], 0.015); add(st.malha); luzes[s > 0 ? 'setaE' : 'setaD'].push(st.mat);
    const fr = K.lampada(0.12, 0.30, 0.05, 0xff1a1a, [s * 0.95, 1.13, zc0 - 0.06], 0.02); add(fr.malha); luzes.freio.push(fr.mat);
    const rr = K.lampada(0.10, 0.07, 0.04, 0xffffff, [s * 0.95, 0.94, zc0 - 0.06], 0.015); add(rr.malha); luzes.re.push(rr.mat);
  }
  add(K.caixa(2.02, 0.22, 0.16, mats.cromo, 0.05, [0, 0.62, fz(0.62)]));
  add(K.placa(opc.placa || 'HRZ 4X4', 'HRYZ STATE', null, [0, 0.64, fz(0.64) + 0.09]));
  add(K.caixa(2.02, 0.20, 0.14, mats.cromo, 0.05, [0, 0.62, -2.98]));
  add(K.caixa(0.24, 0.05, 0.04, mats.cromo, 0.015, [0, 1.20, zc0 - 0.07]));
  add(K.placa(opc.placa || 'HRZ 4X4', 'HRYZ STATE', null, [0, 0.82, zc0 - 0.075], true));
  add(K.caixa(0.08, 0.08, 0.25, mats.escuro, 0, [0, 0.55, -3.08]));                                                    // engate
  const rd = K.rodas(G, [{ z: zF, x: 0.86, d: true }, { z: zF, x: -0.86, d: true }, { z: zR, x: 0.86 }, { z: zR, x: -0.86 }], R, 0.28, mats, { estilo: 'liga', aro: 0.56 });
  add(K.caixa(1.1, 0.16, 5.0, mats.escuro, 0, [0, 0.45, 0]));
  if (opc.sombraChao !== false) add(K.sombraChao(M.L, W));
  const fachos = []; for (const s of [1, -1]) { const f = new THREE.SpotLight(0xfff2dc, 0, 45, 0.42, 1.0, 1.7); f.position.set(s * 0.78, 1.05, zN); f.target.position.set(s * 0.6, 0, zN + 15); add(f); add(f.target); fachos.push(f); }
  return K.api(G, { L: M.L, W, H: M.H, R, luzes, rodas: rd, fachos });
}
