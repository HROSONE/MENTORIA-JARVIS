// Ônibus escolar amarelo Type C (capô na frente), proporções de um Blue Bird Vision de 252" de entre-eixos (6,40 m):
// ~11,0 x 2,44 x 3,15 m. Amarelo-ônibus-escolar com frisos pretos, letreiro SCHOOL BUS, braço de PARE, luzes de advertência vermelhas e âmbar.
import * as THREE from 'three';
import * as K from '../kit/kit.js';

export const M = { L: 11.0, W: 2.44, H: 3.15, EE: 6.40, R: 0.52 };
const AMARELO = 0xf7a800;
export function criar(opc = {}) {
  const G = new THREE.Group(); G.name = 'onibusEscolar';
  const mats = K.materiais(opc.cor ?? AMARELO); const add = (o, p = G) => { p.add(o); return o; };
  const zN = M.L / 2, zF = zN - 1.15, zR = zF - M.EE, W = M.W, R = M.R, X = W / 2;
  const zb0 = -5.45, zb1 = 3.60, yb0 = 1.12, yb1 = 3.12;
  // corpo (caixa arredondada), saias com o vão da roda traseira
  add(K.caixa(W, yb1 - yb0, zb1 - zb0, mats.pintura, 0.16, [0, (yb0 + yb1) / 2, (zb0 + zb1) / 2]));
  for (const s of [1, -1]) {
    add(K.caixa(0.12, 0.36, zb1 - (zR + 0.70), mats.pintura, 0.04, [s * (X - 0.06), 0.96, (zb1 + zR + 0.70) / 2]));
    add(K.caixa(0.12, 0.36, (zR - 0.70) - zb0, mats.pintura, 0.04, [s * (X - 0.06), 0.96, (zR - 0.70 + zb0) / 2]));
    const a = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.04, 8, 32, Math.PI), mats.plastico); a.rotation.y = Math.PI / 2; a.position.set(s * (X + 0.005), 0.78, zR); add(a);
  }
  add(K.caixa(W - 0.3, 0.3, zb1 - zb0 - 0.2, mats.escuro, 0, [0, 0.95, (zb0 + zb1) / 2]));
  // capô e para-lamas
  const capo = [[3.50, 0.85], [3.50, 1.74], [5.15, 1.64], [5.38, 1.50], [5.42, 0.85]];
  add(new THREE.Mesh(K.perfil(capo, { yBase: 0.80, largura: 1.86, bevel: 0.08, arcos: [{ z: zF, r: R + 0.06, yc: R }] }), mats.pintura)).castShadow = true;
  add(new THREE.Mesh(K.perfil([[3.55, 0.80], [3.55, 1.28], [4.95, 1.30], [5.30, 1.05], [5.33, 0.80]], { yBase: 0.70, largura: 2.34, bevel: 0.06, arcos: [{ z: zF, r: R + 0.08, yc: R }] }), mats.pintura)).castShadow = true;
  add(K.caixa(2.36, 0.30, 0.22, mats.plastico, 0.04, [0, 0.62, 5.42]));                                                // para-choque preto
  add(K.caixa(1.0, 0.50, 0.05, mats.plastico, 0.03, [0, 1.18, 5.44]));                                                  // grade
  for (let i = 0; i < 5; i++) add(K.caixa(0.92, 0.025, 0.02, mats.cromo, 0, [0, 0.98 + i * 0.10, 5.47]));
  const luzes = { farol: [], freio: [], re: [], setaE: [], setaD: [], posicao: [], emergencia: [] };
  for (const s of [1, -1]) for (const dx of [0.62, 0.84]) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.09, 24), new THREE.MeshStandardMaterial({ color: 0xe8eef2, emissive: 0xfff3d6, emissiveIntensity: 0, roughness: 0.05, metalness: 0.4 })); f.position.set(s * dx, 1.30, 5.43); add(f); luzes.farol.push(f.material); add(K.caixa(0.22, 0.22, 0.03, mats.cromo, 0.04, [s * dx, 1.30, 5.415])); }
  // frente do corpo: para-brisa de 2 partes, letreiro SCHOOL BUS, luzes de advertência
  const zf = zb1 + 0.005;
  for (const s of [1, -1]) add(K.caixa(1.00, 0.80, 0.02, mats.vidro, 0.04, [s * 0.53, 2.25, zf]));
  add(K.caixa(0.05, 0.84, 0.03, mats.plastico, 0, [0, 2.25, zf + 0.005]));
  const letreiro = (z, tras) => K.decalFace(z, -0.85, 0.85, 2.72, 3.02, (g, w, h) => { g.fillStyle = '#111'; g.font = `900 ${Math.round(h * 0.72)}px ${K.FONTE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SCHOOL BUS', w / 2, h / 2 + 3); }, 400, tras);
  add(letreiro(zf + 0.003, false));
  const adv = (x, y, z, cor, n) => { const c = K.cabecaLuz(0.20, 0.20, cor, mats.cromo, [x, y, z], n); add(c.grupo); return c.mat; };
  for (const s of [1, -1]) {
    luzes.emergencia.push({ mat: adv(s * 1.05, 2.87, zf + 0.02, 0xff1a1a, [0, 0, 1]), lado: s }, { mat: adv(s * 0.95, 2.87, zf + 0.02, 0xffa020, [0, 0, 1]), lado: -s, pisca: false });
    luzes.emergencia.push({ mat: adv(s * 1.05, 2.87, zb0 - 0.02, 0xff1a1a, [0, 0, -1]), lado: s }, { mat: adv(s * 0.95, 2.87, zb0 - 0.02, 0xffa020, [0, 0, -1]), lado: -s, pisca: false });
  }
  // laterais: janelas, frisos pretos, nome, número, porta de entrada (lado do passageiro), saída de emergência
  add(K.decalLados(X + 0.002, zb0, zb1, 0.80, yb1, (g, w, h, Xz, Y, s, ppm) => {
    g.fillStyle = '#111';
    for (const y of [1.20, 1.56]) g.fillRect(0, Y(y + 0.05), w, 0.10 * ppm);
    g.fillRect(0, Y(1.82), w, 0.04 * ppm);
    const z0w = -4.95, z1w = 2.65, n = 10, pw = (z1w - z0w) / n;
    for (let i = 0; i < n; i++) { const za = z0w + i * pw + 0.06, zb = za + pw - 0.12; g.fillStyle = '#1a1d22'; g.fillRect(Math.min(Xz(za), Xz(zb)), Y(2.62), Math.abs(Xz(zb) - Xz(za)), Y(1.88) - Y(2.62)); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(Math.min(Xz(za), Xz(zb)), Y(2.62), Math.abs(Xz(zb) - Xz(za)), Y(2.30) - Y(2.62)); }
    g.fillStyle = '#111'; g.font = `900 ${Math.round(0.20 * ppm)}px ${K.FONTE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(opc.escola || 'HRYZ CITY SCHOOLS', Xz(0.1), Y(1.38));
    g.font = `900 ${Math.round(0.26 * ppm)}px ${K.FONTE}`; g.fillText(opc.numero || '12', Xz(3.15), Y(1.38));
    if (s < 0) { g.fillStyle = '#1a1d22'; g.fillRect(Xz(2.82), Y(2.62), Xz(3.48) - Xz(2.82), Y(0.98) - Y(2.62)); g.strokeStyle = '#d0d4d8'; g.lineWidth = 5; g.strokeRect(Xz(2.82), Y(2.62), Xz(3.48) - Xz(2.82), Y(0.98) - Y(2.62)); g.beginPath(); g.moveTo(Xz(3.15), Y(2.62)); g.lineTo(Xz(3.15), Y(0.98)); g.moveTo(Xz(2.82), Y(1.80)); g.lineTo(Xz(3.48), Y(1.80)); g.stroke(); }
  }));
  // braço de PARE (lado do motorista), aberto
  const pare = new THREE.Group(); pare.position.set(X + 0.30, 1.95, 2.45); add(pare);
  const oct = new THREE.Mesh(new THREE.CircleGeometry(0.24, 8), new THREE.MeshStandardMaterial({ map: K.tela(256, 256, (g, w, h) => { g.fillStyle = '#C8102E'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * Math.PI * 2; g.lineTo(w / 2 + Math.cos(a) * w / 2, h / 2 + Math.sin(a) * h / 2); } g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 10; g.stroke(); g.fillStyle = '#fff'; g.font = `900 68px ${K.FONTE}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('STOP', w / 2, h / 2 + 4); }), side: THREE.DoubleSide, roughness: 0.4 }));
  oct.rotation.z = Math.PI / 8; pare.add(oct); const oct2 = oct.clone(); oct2.rotation.set(0, Math.PI, -Math.PI / 8); oct2.position.z = -0.004; oct.position.z = 0.004; oct.material.side = THREE.FrontSide; pare.add(oct2); pare.add(K.caixa(0.30, 0.04, 0.03, mats.plastico, 0, [-0.20, 0, 0]));
  // espelhos: retrovisores e os de visão cruzada nos para-lamas
  for (const s of [1, -1]) {
    add(K.caixa(0.03, 0.55, 0.03, mats.plastico, 0, [s * (X + 0.20), 2.20, 3.45])); add(K.caixa(0.06, 0.40, 0.22, mats.plastico, 0.03, [s * (X + 0.24), 2.25, 3.42]));
    add(K.caixa(0.03, 0.45, 0.03, mats.plastico, 0, [s * 1.08, 1.50, 5.05])); const e = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12, 0, Math.PI), mats.plastico); e.position.set(s * 1.08, 1.80, 5.10); add(e);
  }
  // traseira: porta de emergência com janela, lanternas redondas, para-choque
  const zt = zb0 - 0.005;
  add(letreiro(zt - 0.002, true));
  add(K.decalFace(zt - 0.003, -1.20, 1.20, 0.80, 2.68, (g, w, h, Xx, Y) => {
    g.strokeStyle = '#111'; g.lineWidth = 6; g.strokeRect(Xx(0.42), Y(2.55), Xx(-0.42) - Xx(0.42), Y(1.05) - Y(2.55));
    g.fillStyle = '#1a1d22'; g.fillRect(Xx(0.36), Y(2.48), Xx(-0.36) - Xx(0.36), Y(1.92) - Y(2.48));
    g.fillStyle = '#111'; g.font = `900 ${Math.round(0.11 * 300)}px ${K.FONTE}`; g.textAlign = 'center'; g.fillText('EMERGENCY DOOR', w / 2, Y(1.78));
    g.fillRect(0, Y(1.25), w, 0.10 * 300); g.fillRect(0, Y(1.61), w, 0.10 * 300);
  }, 300, true));
  for (const s of [1, -1]) {
    const fr = new THREE.Mesh(new THREE.CircleGeometry(0.11, 24), new THREE.MeshStandardMaterial({ color: 0x881010, emissive: 0xff1a1a, emissiveIntensity: 0, roughness: 0.1 })); fr.rotation.y = Math.PI; fr.position.set(s * 0.95, 1.38, zt - 0.01); add(fr); luzes.freio.push(fr.material);
    const st = new THREE.Mesh(new THREE.CircleGeometry(0.09, 24), new THREE.MeshStandardMaterial({ color: 0x885010, emissive: 0xffa020, emissiveIntensity: 0, roughness: 0.1 })); st.rotation.y = Math.PI; st.position.set(s * 0.95, 1.15, zt - 0.01); add(st); luzes[s > 0 ? 'setaE' : 'setaD'].push(st.material);
  }
  add(K.caixa(2.40, 0.30, 0.20, mats.plastico, 0.04, [0, 0.75, zb0 - 0.08]));
  // rodas (traseiras duplas)
  const rd = K.rodas(G, [{ z: zF, x: 0.98, d: true }, { z: zF, x: -0.98, d: true }, { z: zR, x: 0.92 }, { z: zR, x: 0.62, externa: false }, { z: zR, x: -0.92 }, { z: zR, x: -0.62, externa: false }], R, 0.27, mats, { estilo: 'pesada', aro: 0.55 });
  if (opc.sombraChao !== false) add(K.sombraChao(M.L, W));
  const fachos = []; for (const s of [1, -1]) { const f = new THREE.SpotLight(0xfff2dc, 0, 50, 0.42, 1.0, 1.7); f.position.set(s * 0.72, 1.30, zN); f.target.position.set(s * 0.6, 0, zN + 16); add(f); add(f.target); fachos.push(f); }
  return K.api(G, { L: M.L, W, H: M.H, R, luzes, rodas: rd, fachos });
}
