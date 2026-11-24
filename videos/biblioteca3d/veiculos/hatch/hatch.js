// Hatch compacto de 5 portas (proporções de um Golf Mk7: 4,257 x 1,798 x 1,478 m, entre-eixos 2,637 m), genérico e sem marca.
import * as THREE from 'three';
import * as K from '../kit/kit.js';

export const M = { L: 4.257, W: 1.798, H: 1.478, EE: 2.637, R: 0.316 };
export function criar(opc = {}) {
  const G = new THREE.Group(); G.name = 'hatch';
  const mats = K.materiais(opc.cor ?? 0x1f4f9a); const add = (o, p = G) => { p.add(o); return o; };
  const zN = M.L / 2, zF = zN - 0.88, zR = zF - M.EE, W = M.W, R = M.R;
  // carroceria baixa (largura toda) e a estufa (mais estreita)
  const TOPO = [[-2.10, 0.34], [-2.13, 0.58], [-2.10, 0.97], [0.86, 1.00], [1.55, 0.92], [1.98, 0.86], [2.10, 0.80], [2.14, 0.60], [2.12, 0.34]];
  const fz = (y, l = 1) => K.faceZ(TOPO, y, l, 0.07) + l * 0.012;
  const baixo = new THREE.Mesh(K.perfil(TOPO,
    { yBase: 0.28, largura: W, bevel: 0.07, arcos: [{ z: zF, r: R + 0.05, yc: R }, { z: zR, r: R + 0.05, yc: R }] }), mats.pintura); baixo.castShadow = baixo.receiveShadow = true; add(baixo);
  const Wg = W * 0.84;
  const cima = new THREE.Mesh(K.perfil([[-2.0, 0.95], [-1.92, 1.28], [-1.56, 1.45], [0.0, 1.478], [0.30, 1.455]], { yBase: 0.95, largura: Wg, bevel: 0.06 }), mats.pintura);
  // fecha a estufa na frente (base do para-brisa)
  cima.geometry = K.perfil([[-2.02, 0.95], [-1.64, 1.45], [0.0, 1.478], [0.32, 1.45], [0.92, 0.99]], { yBase: 0.95, largura: Wg, bevel: 0.06 });
  cima.castShadow = cima.receiveShadow = true; add(cima);
  // vidros
  add(K.vidroInclinado([0.90, 1.01], [0.33, 1.43], Wg - 0.10, Wg - 0.22, mats.vidro, 1, 0.062));
  add(K.vidroInclinado([-1.985, 1.0], [-1.67, 1.42], Wg - 0.16, Wg - 0.26, mats.vidro, -1, 0.062));
  add(K.janelas([[0.84, 1.03], [0.30, 1.41], [-0.52, 1.43], [-0.52, 1.03]], Wg / 2 + 0.065, mats.vidro));
  add(K.janelas([[-0.60, 1.03], [-0.60, 1.43], [-1.50, 1.43], [-1.86, 1.05]], Wg / 2 + 0.065, mats.vidro));
  // frestas das portas, friso e maçanetas
  add(K.decalLados(W / 2 + 0.071, -2.13, 2.13, 0.28, 1.0, (g, w, h, X, Y) => {
    g.strokeStyle = 'rgba(15,15,18,0.85)'; g.lineWidth = 2.5;
    for (const [za, zb] of [[0.86, -0.55], [-0.58, -1.62]]) { g.beginPath(); g.moveTo(X(za), Y(0.97)); g.lineTo(X(za + 0.02), Y(0.40)); g.lineTo(X(zb), Y(0.40)); g.lineTo(X(zb), Y(0.97)); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, Y(0.62), w, 6);
  }));
  for (const s of [1, -1]) for (const z of [0.40, -0.95]) add(K.caixa(0.03, 0.035, 0.15, mats.pintura, 0.012, [s * (W / 2 + 0.07), 0.90, z]));
  // retrovisores
  for (const s of [1, -1]) { add(K.caixa(0.05, 0.04, 0.12, mats.plastico, 0.01, [s * (Wg / 2 + 0.10), 1.00, 0.78])); add(K.caixa(0.20, 0.13, 0.10, mats.pintura, 0.04, [s * (Wg / 2 + 0.20), 1.04, 0.76])); }
  // frente: faróis, grade, para-choque com entrada de ar
  const luzes = { farol: [], freio: [], re: [], setaE: [], setaD: [], posicao: [] };
    for (const s of [1, -1]) {
    const f = K.lampada(0.36, 0.12, 0.05, 0xfff4dc, [s * 0.62, 0.78, fz(0.78)], 0.03, 0.9); add(f.malha); luzes.farol.push(f.mat);
    const st = K.lampada(0.08, 0.05, 0.03, 0xffa020, [s * 0.80, 0.74, fz(0.74)], 0.015); add(st.malha); luzes[s > 0 ? 'setaE' : 'setaD'].push(st.mat);
    add(K.caixa(0.20, 0.05, 0.04, mats.plastico, 0.02, [s * 0.66, 0.46, fz(0.46)]));       // faróis de neblina
  }
  add(K.caixa(0.80, 0.08, 0.05, mats.plastico, 0.03, [0, 0.77, fz(0.77)]));
  add(K.caixa(0.06, 0.06, 0.02, mats.cromo, 0.03, [0, 0.77, fz(0.77) + 0.02]));
  add(K.caixa(1.00, 0.14, 0.05, mats.plastico, 0.05, [0, 0.46, fz(0.46)]));
  add(K.placa(opc.placa || 'HRZ 2037', 'HRYZ STATE', null, [0, 0.60, fz(0.60) + 0.01]));
  // traseira: lanternas, placa, limpador, para-choque
    for (const s of [1, -1]) {
    const fr = K.lampada(0.30, 0.10, 0.05, 0xff1a1a, [s * 0.66, 0.90, fz(0.90, -1)], 0.03); add(fr.malha); luzes.freio.push(fr.mat);
    const rr = K.lampada(0.08, 0.05, 0.03, 0xffffff, [s * 0.50, 0.84, fz(0.84, -1) - 0.01], 0.015); add(rr.malha); luzes.re.push(rr.mat);
    const st = K.lampada(0.08, 0.05, 0.03, 0xffa020, [s * 0.80, 0.84, fz(0.84, -1) - 0.01], 0.015); add(st.malha); luzes[s > 0 ? 'setaE' : 'setaD'].push(st.mat);
  }
  add(K.caixa(1.60, 0.16, 0.05, mats.plastico, 0.04, [0, 0.42, fz(0.42, -1)]));
  add(K.placa(opc.placa || 'HRZ 2037', 'HRYZ STATE', null, [0, 0.66, fz(0.66, -1) - 0.01], true));
  add(K.caixa(0.40, 0.012, 0.012, mats.escuro, 0, [0.05, 1.08, -2.04]));
  // rodas
  const rd = K.rodas(G, [{ z: zF, x: 0.775, d: true }, { z: zF, x: -0.775, d: true }, { z: zR, x: 0.775 }, { z: zR, x: -0.775 }], R, 0.205, mats, { estilo: 'liga', aro: 0.64 });
  add(K.caixa(1.3, 0.12, 3.2, mats.escuro, 0, [0, 0.26, -0.1]));
  if (opc.sombraChao !== false) add(K.sombraChao(M.L, W));
  const fachos = [];
  for (const s of [1, -1]) { const f = new THREE.SpotLight(0xfff2dc, 0, 40, 0.42, 1.0, 1.7); f.position.set(s * 0.62, 0.8, zN); f.target.position.set(s * 0.5, 0, zN + 14); add(f); add(f.target); fachos.push(f); }
  return K.api(G, { L: M.L, W, H: M.H, R, luzes, rodas: rd, fachos });
}
