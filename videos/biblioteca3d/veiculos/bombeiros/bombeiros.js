// Caminhão de bombeiros (autobomba com cabine "custom" de teto elevado), proporções de um pumper de 185" de entre-eixos (4,70 m):
// ~9,40 x 2,54 x 3,0 m. Vermelho com faixa branca refletiva, compartimentos de porta de enrolar, painel da bomba, escada no teto, mangueiras,
// barra de luzes vermelha/branca e "HRYZ CITY FIRE DEPT · ENGINE 9" (fictício).
import * as THREE from 'three';
import * as K from '../kit/kit.js';

export const M = { L: 9.40, W: 2.54, H: 3.0, EE: 4.70, R: 0.53 };
export function criar(opc = {}) {
  const G = new THREE.Group(); G.name = 'bombeiros';
  const mats = K.materiais(opc.cor ?? 0xa8121f); const add = (o, p = G) => { p.add(o); return o; };
  const branco = new THREE.MeshPhysicalMaterial({ color: 0xf3f3f0, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 });
  const zN = M.L / 2, zF = zN - 1.55, zR = zF - M.EE, W = M.W, R = M.R, X = W / 2, B = 0.06;
  // cabine (perfil com o arco da roda dianteira), teto branco
  const CAB = [[1.65, 0.78], [1.65, 2.95], [4.40, 2.95], [4.62, 2.72], [4.68, 1.80], [4.66, 0.78]];
  add(new THREE.Mesh(K.perfil(CAB, { yBase: 0.72, largura: W - 0.02, bevel: B, arcos: [{ z: zF, r: R + 0.08, yc: R }] }), mats.pintura)).castShadow = true;
  add(K.caixa(W - 0.06, 0.05, 2.70, branco, 0.02, [0, 2.99, 3.02]));
  add(K.vidroInclinado([4.70, 1.86], [4.64, 2.66], W - 0.30, W - 0.34, mats.vidro, 1, 0.07));
  add(K.janelas([[4.45, 1.86], [4.45, 2.62], [3.55, 2.62], [3.55, 1.86]], X + 0.005, mats.vidro));
  add(K.janelas([[3.35, 1.86], [3.35, 2.62], [1.85, 2.62], [1.85, 1.86]], X + 0.005, mats.vidro));
  // corpo de compartimentos
  const zb0 = -4.62, zb1 = 1.32, yb0 = 1.20, yb1 = 2.40;
  add(K.caixa(W, yb1 - yb0, zb1 - zb0, mats.pintura, 0.05, [0, (yb0 + yb1) / 2, (zb0 + zb1) / 2]));
  for (const s of [1, -1]) {
    add(K.caixa(0.12, 0.45, zb1 - (zR + 0.72), mats.pintura, 0.03, [s * (X - 0.06), 0.98, (zb1 + zR + 0.72) / 2]));
    add(K.caixa(0.12, 0.45, (zR - 0.72) - zb0, mats.pintura, 0.03, [s * (X - 0.06), 0.98, (zR - 0.72 + zb0) / 2]));
    const a = new THREE.Mesh(new THREE.TorusGeometry(0.70, 0.045, 8, 32, Math.PI), mats.cromo); a.rotation.y = Math.PI / 2; a.position.set(s * (X + 0.005), 0.78, zR); add(a);
  }
  // painel da bomba (entre a cabine e o corpo), cromado, com manômetros
  add(K.caixa(W + 0.02, 1.70, 0.30, mats.cromo, 0.02, [0, 1.65, 1.48]));
  add(K.decalLados(X + 0.015, 1.34, 1.62, 1.0, 2.40, (g, w, h, Xz, Y) => { g.fillStyle = '#2a2d31'; g.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) { const cx = w / 2, cy = Y(2.20 - i * 0.2); g.fillStyle = '#f4f4f0'; g.beginPath(); g.arc(cx, cy, w * 0.28, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#111'; g.lineWidth = 3; g.stroke(); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + w * 0.2, cy - w * 0.1); g.stroke(); } }, 300));
  // portas de enrolar (frisos verticais cromados), faixa branca, nome, número
  add(K.decalLados(X + 0.002, zb0, zb1, 0.75, yb1, (g, w, h, Xz, Y, s, ppm) => {
    const portas = [[1.25, 0.25], [0.18, zR + 0.75], [zR + 0.70, zR - 0.70], [zR - 0.75, -3.10], [-3.15, -4.55]];
    portas.forEach(([za, zb], i) => {
      const yTop = i === 2 ? 2.35 : 2.35, yBot = i === 2 ? 1.55 : 1.25;
      const xa = Math.min(Xz(za), Xz(zb)), xw = Math.abs(Xz(zb) - Xz(za));
      g.fillStyle = '#c8ccd0'; g.fillRect(xa, Y(yTop), xw, Y(yBot) - Y(yTop));
      for (let y = Y(yTop); y < Y(yBot); y += 0.045 * ppm) { g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(xa, y, xw, 0.012 * ppm); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(xa, y + 0.02 * ppm, xw, 0.008 * ppm); }
      g.strokeStyle = '#222'; g.lineWidth = 4; g.strokeRect(xa, Y(yTop), xw, Y(yBot) - Y(yTop));
      g.fillStyle = '#333'; g.fillRect(xa + xw * 0.4, Y(yBot + 0.06), xw * 0.2, 0.03 * ppm);
    });
    g.fillStyle = '#f4f4f0'; g.fillRect(0, Y(1.20), w, 0.10 * ppm);
  }, 200));
  add(K.decalLados(X + B + 0.001, 1.68, 4.62, 0.78, 2.95, (g, w, h, Xz, Y, s, ppm) => {
    g.fillStyle = '#f4f4f0'; g.fillRect(0, Y(1.20), w, 0.10 * ppm);
    g.strokeStyle = 'rgba(10,10,10,0.85)'; g.lineWidth = 3; for (const [za, zb] of [[4.48, 3.50], [3.40, 1.80]]) g.strokeRect(Math.min(Xz(za), Xz(zb)), Y(2.66), Math.abs(Xz(zb) - Xz(za)), Y(0.95) - Y(2.66));
    g.fillStyle = '#E8C04A'; g.strokeStyle = '#5a3a00'; g.lineWidth = 3; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `900 ${Math.round(0.13 * ppm)}px ${K.FONTE}`; g.fillText(opc.depto || 'HRYZ CITY', Xz(2.60), Y(1.62)); g.strokeText(opc.depto || 'HRYZ CITY', Xz(2.60), Y(1.62));
    g.font = `900 ${Math.round(0.10 * ppm)}px ${K.FONTE}`; g.fillText('FIRE DEPT', Xz(2.60), Y(1.45));
    g.beginPath(); g.arc(Xz(4.0), Y(1.55), 0.18 * ppm, 0, Math.PI * 2); g.fill(); g.fillStyle = '#a8121f'; g.font = `900 ${Math.round(0.16 * ppm)}px ${K.FONTE}`; g.fillText(opc.numero || '9', Xz(4.0), Y(1.55));
  }, 200));
  // teto do corpo: escada de alumínio e mangueiras na calha de mangueiras atrás
  const alu = new THREE.MeshStandardMaterial({ color: 0xc9ced3, roughness: 0.35, metalness: 0.9 });
  for (const dx of [0.0, 0.42]) add(K.caixa(0.05, 0.08, 5.4, alu, 0.01, [0.55 + dx, yb1 + 0.22, -1.6]));
  for (let i = 0; i < 18; i++) add(K.cilX(0.015, 0.42, alu, [0.76, yb1 + 0.22, -4.2 + i * 0.30]));
  for (const z of [-3.8, -1.6, 0.6]) add(K.caixa(0.10, 0.20, 0.06, mats.cromo, 0, [0.76, yb1 + 0.10, z]));
  const cores = [0xd8b400, 0x2a4fb0, 0xd8d8d0, 0xd8b400];
  for (let k = 0; k < 4; k++) add(K.caixa(0.95, 0.09, 2.6, new THREE.MeshStandardMaterial({ color: cores[k], roughness: 0.8 }), 0.04, [-0.55, yb1 + 0.05 + k * 0.09, -3.25]));
  // barra de luzes no teto da cabine, luzes da frente e de trás
  const luzes = { farol: [], freio: [], re: [], setaE: [], setaD: [], posicao: [], emergencia: [] };
  add(K.caixa(2.0, 0.10, 0.36, mats.plastico, 0.03, [0, 3.06, 4.30]));
  [-0.85, -0.5, -0.15, 0.15, 0.5, 0.85].forEach((x, i) => { const c = K.cabecaLuz(0.28, 0.10, i === 2 || i === 3 ? 0xffffff : 0xff1a1a, mats.cromo, [x, 3.14, 4.46], [0, 0, 1]); add(c.grupo); luzes.emergencia.push({ mat: c.mat, lado: x > 0 ? 1 : -1 }); });
  const fz = 4.70;
  for (const s of [1, -1]) {
    for (const dx of [0.0, 0.26]) { const f = K.lampada(0.22, 0.14, 0.05, 0xfff4dc, [s * (0.85 + dx * 0.0) + s * dx - s * 0.13, 1.18, fz + 0.02], 0.02, 0.9); add(f.malha); luzes.farol.push(f.mat); }
    const c1 = K.cabecaLuz(0.22, 0.10, 0xff1a1a, mats.cromo, [s * 0.95, 1.40, fz + 0.03], [0, 0, 1]); add(c1.grupo); luzes.emergencia.push({ mat: c1.mat, lado: s });
    const c2 = K.cabecaLuz(0.22, 0.10, 0xff1a1a, mats.cromo, [s * (X + 0.03), 2.80, 4.35], [s, 0, 0]); add(c2.grupo); luzes.emergencia.push({ mat: c2.mat, lado: s });
    const c3 = K.cabecaLuz(0.22, 0.10, 0xff1a1a, mats.cromo, [s * (X + 0.02), 2.30, zb0 + 0.25], [s, 0, 0]); add(c3.grupo); luzes.emergencia.push({ mat: c3.mat, lado: -s });
    const c4 = K.cabecaLuz(0.22, 0.12, 0xff1a1a, mats.cromo, [s * 1.0, 2.25, zb0 - 0.03], [0, 0, -1]); add(c4.grupo); luzes.emergencia.push({ mat: c4.mat, lado: -s });
    const fr = K.lampada(0.16, 0.16, 0.05, 0xff1a1a, [s * 1.05, 1.45, zb0 - 0.03], 0.03); add(fr.malha); luzes.freio.push(fr.mat);
    const st = K.lampada(0.16, 0.16, 0.05, 0xffa020, [s * 1.05, 1.27, zb0 - 0.03], 0.03); add(st.malha); luzes[s > 0 ? 'setaE' : 'setaD'].push(st.mat);
    const rr = K.lampada(0.16, 0.12, 0.05, 0xffffff, [s * 1.05, 1.10, zb0 - 0.03], 0.03); add(rr.malha); luzes.re.push(rr.mat);
    add(K.caixa(0.05, 0.50, 0.03, mats.cromo, 0, [s * (X + 0.25), 2.25, 4.15])); add(K.caixa(0.07, 0.42, 0.26, mats.cromo, 0.03, [s * (X + 0.28), 2.30, 4.12]));     // espelhos
    add(K.caixa(0.20, 0.04, 0.45, alu, 0.01, [s * (X - 0.05), 0.62, 2.30]));                                                                                 // degraus da cabine
    add(K.cilZ(0.025, 0.9, mats.cromo, [s * (X + 0.04), 1.85, 1.80]));                                                                                      // corrimão
  }
  add(K.caixa(1.30, 0.70, 0.05, mats.cromo, 0.03, [0, 1.20, fz + 0.01]));                                                // grade
  for (let i = 0; i < 6; i++) add(K.caixa(1.24, 0.02, 0.02, mats.plastico, 0, [0, 0.92 + i * 0.11, fz + 0.04]));
  add(K.caixa(W + 0.04, 0.32, 0.45, mats.cromo, 0.05, [0, 0.60, fz + 0.20]));                                           // para-choque estendido
  add(K.cilZ(0.12, 0.10, mats.plastico, [0.55, 0.62, fz + 0.45]));                                                       // sirene
  add(K.decalFace(zb0 - 0.004, -X, X, 0.75, yb1, (g, w, h, Xx, Y, ppm) => {                                               // chevrons atrás
    g.save(); g.beginPath(); g.rect(Xx(0.85), Y(2.10), Xx(-0.85) - Xx(0.85), Y(1.15) - Y(2.10)); g.clip();
    for (let i = -14; i < 14; i++) { g.fillStyle = i % 2 ? '#F2C200' : '#C8102E'; g.beginPath(); const x0 = w / 2 + i * 0.12 * ppm; g.moveTo(x0, Y(2.10)); g.lineTo(x0 + 0.12 * ppm, Y(2.10)); g.lineTo(x0 + 0.12 * ppm - 0.5 * ppm * Math.sign(i + 0.5), Y(1.15)); g.lineTo(x0 - 0.5 * ppm * Math.sign(i + 0.5), Y(1.15)); g.closePath(); g.fill(); }
    g.restore(); g.fillStyle = '#f4f4f0'; g.fillRect(0, Y(1.20), w, 0.10 * ppm);
  }, 200, true));
  add(K.caixa(W - 0.1, 0.10, 0.45, alu, 0.02, [0, 0.72, zb0 - 0.22]));                                                   // degrau de trás
  const rd = K.rodas(G, [{ z: zF, x: 1.00, d: true }, { z: zF, x: -1.00, d: true }, { z: zR, x: 0.98 }, { z: zR, x: 0.68, externa: false }, { z: zR, x: -0.98 }, { z: zR, x: -0.68, externa: false }], R, 0.30, mats, { estilo: 'pesada', aro: 0.56 });
  add(K.caixa(1.0, 0.25, 8.0, mats.escuro, 0, [0, 0.62, -0.1]));
  if (opc.sombraChao !== false) add(K.sombraChao(M.L, W));
  const pontos = [new THREE.PointLight(0xff2020, 0, 16, 2), new THREE.PointLight(0xff2020, 0, 16, 2)]; pontos[0].position.set(1.4, 3.2, 4.0); pontos[1].position.set(-1.4, 3.2, 4.0); pontos.forEach(p => add(p));
  const fachos = []; for (const s of [1, -1]) { const f = new THREE.SpotLight(0xfff2dc, 0, 50, 0.42, 1.0, 1.7); f.position.set(s * 0.85, 1.18, zN); f.target.position.set(s * 0.6, 0, zN + 16); add(f); add(f.target); fachos.push(f); }
  return K.api(G, { L: M.L, W, H: M.H, R, luzes, rodas: rd, fachos, pontos });
}
