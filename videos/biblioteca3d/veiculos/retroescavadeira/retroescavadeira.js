// RETROESCAVADEIRA (pá na frente, retro atrás), classe de ~8–11 t, proporções de fichas técnicas dessa classe:
// ~7,2 x 2,31 x 3,6 m · entre-eixos 2,21 m · pneus traseiros 19,5L-24 (~1,49 m) e dianteiros ~0,97 m · pá dianteira de ~2,3 m ·
// retro com lança de ~3,4 m e braço de ~2,2 m (profundidade de escavação ~4,3 m) · sapatas estabilizadoras atrás.
// Genérica e fictícia ("HRYZ OBRAS"). Eixos: Pá (levantar), Caçamba da pá, Lança da retro, Braço da retro, Giro da retro.
import * as THREE from 'three';
import * as C from '../obra/comum.js';
const K = C.K;

export const M = { L: 7.2, W: 2.31, H: 3.6, EE: 2.21, R: 0.745, RF: 0.485 };
export function criar(opc = {}) {
  const G = new THREE.Group(); G.name = 'retroescavadeira';
  const mats = C.materiais(opc.cor ?? C.AMARELO); const add = (o, p = G) => { p.add(o); return o; };
  const zT = -0.85, zF = zT + M.EE, W = M.W;
  // chassi, capô inclinado na frente, para-lamas traseiros, cabine sobre o eixo traseiro
  add(K.caixa(0.95, 0.45, 4.6, mats.chassi, 0.05, [0, 0.75, -0.2]));
  const CAP = [[0.45, 0.95], [0.45, 1.85], [1.6, 1.80], [2.35, 1.55], [2.45, 0.95]];
  add(new THREE.Mesh(K.perfil(CAP, { yBase: 0.95, largura: 1.05, bevel: 0.06 }), mats.pintura)).castShadow = true;
  for (let i = 0; i < 6; i++) add(K.caixa(0.9, 0.02, 0.05, mats.preto, 0, [0, 1.15 + i * 0.1, 2.44]));                 // grade
  add(K.cilX(0.06, 0.06, mats.preto, [0.3, 2.15, 1.0]).rotateZ(Math.PI / 2)); add(K.caixa(0.08, 0.5, 0.08, mats.preto, 0.02, [0.3, 2.0, 1.0]));  // escapamento
  for (const s of [1, -1]) {
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(M.R + 0.10, M.R + 0.10, 0.62, 24, 1, true, 0, Math.PI), mats.pintura); pl.rotation.z = Math.PI / 2; pl.rotation.y = Math.PI / 2; pl.position.set(s * 0.86, M.R, zT); add(pl);
    add(K.caixa(0.62, 0.06, 1.7, mats.pintura, 0.02, [s * 0.86, M.R + 0.08, zT]));                                      // para-lama em cima
  }
  add(K.caixa(W - 0.2, 0.30, 2.0, mats.pintura, 0.05, [0, 1.15, -0.95]));                                                 // base da cabine
  const cab = add(C.cabine(1.75, 1.85, 1.65, mats, {})); cab.position.set(0, 1.30, -0.95);
  const giro = C.giroflex([0.55, 3.05, -0.4], mats); add(giro.grupo);
  add(C.adesivoLados('HRYZ', 'OBRAS · 416', 1.0, 0.30, 0.53, 1.45, 1.45));
  // ---------------- pá carregadeira dianteira: braços que giram nos pinos da frente da cabine
  const pa = add(new THREE.Group()); pa.position.set(0, 2.05, 0.15);
  const PONTA = new THREE.Vector3(0, -1.55, 2.85);                                                                         // pino da caçamba (pá no chão)
  for (const s of [1, -1]) { const b = C.viga([s * 0.98, 0, 0], [s * 0.98, PONTA.y + 0.15, PONTA.z - 0.1], 0.14, 0.30, mats.pintura, 0.03); add(b, pa); }
  add(K.caixa(2.0, 0.18, 0.2, mats.pintura, 0.03, [0, -0.35, 1.25]), pa);                                                   // travessa
  const cacF = add(new THREE.Group(), pa); cacF.position.copy(PONTA);
  const sf = new THREE.Shape(); sf.moveTo(-0.10, 0.45); sf.lineTo(0.15, 0.50); sf.quadraticCurveTo(0.45, 0.2, 0.62, -0.25); sf.lineTo(0.95, -0.38); sf.lineTo(0.90, -0.45); sf.lineTo(-0.12, -0.40); sf.closePath();
  const gf = new THREE.ExtrudeGeometry(sf, { depth: 2.25, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }); gf.translate(0, 0, -1.125); gf.rotateY(-Math.PI / 2);
  add(new THREE.Mesh(gf, mats.pintura), cacF).castShadow = true;
  add(K.caixa(2.3, 0.04, 0.12, mats.desgaste, 0.01, [0, -0.42, 0.95]), cacF);
  add(C.pino(0.07, 2.0, mats, [0, 0, 0]), cacF);
  const cilPa = [1, -1].map(s => add(C.cilindroHidraulico(0.07, 0.04, 1.1, mats)));
  const cilCF = [1, -1].map(s => add(C.cilindroHidraulico(0.06, 0.035, 0.9, mats)));
  // ---------------- retro: quadro giratório atrás, lança curva, braço, caçamba estreita; sapatas estabilizadoras
  const zR = -2.35;
  add(K.caixa(1.0, 0.5, 0.45, mats.chassi, 0.05, [0, 1.05, zR + 0.25]));
  const quadro = add(new THREE.Group()); quadro.position.set(0, 1.05, zR);
  add(K.caixa(0.45, 0.55, 0.35, mats.pintura, 0.05, [0, 0, -0.1]), quadro);
  const lancaR = add(new THREE.Group(), quadro); lancaR.position.set(0, 0.1, -0.2);
  const RL1 = new THREE.Vector3(0, 1.6, -0.95), RL2 = new THREE.Vector3(0, 1.2, -2.75);
  add(C.viga([0, 0, 0], RL1.toArray(), 0.30, 0.42, mats.pintura, 0.04), lancaR); add(C.viga(RL1.toArray(), RL2.toArray(), 0.28, 0.36, mats.pintura, 0.04), lancaR);
  add(C.pino(0.09, 0.36, mats, RL1.toArray()), lancaR);
  const bracoR = add(new THREE.Group(), lancaR); bracoR.position.copy(RL2);
  add(C.viga([0, 0.35, 0.1], [0, -2.1, 0], 0.24, 0.30, mats.pintura, 0.04), bracoR);
  const cacR = add(new THREE.Group(), bracoR); cacR.position.set(0, -2.15, 0);
  const sr = new THREE.Shape(); sr.moveTo(0, 0.08); sr.quadraticCurveTo(0.55, 0.05, 0.62, -0.45); sr.lineTo(0.5, -0.80); sr.lineTo(0.05, -0.72); sr.quadraticCurveTo(-0.15, -0.3, 0, 0.08);
  const gr = new THREE.ExtrudeGeometry(sr, { depth: 0.6, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }); gr.translate(0, 0, -0.3); gr.rotateY(-Math.PI / 2);
  add(new THREE.Mesh(gr, mats.pintura), cacR).castShadow = true;
  for (let i = 0; i < 4; i++) add(K.caixa(0.06, 0.05, 0.16, mats.desgaste, 0.01, [-0.21 + i * 0.14, -0.82, 0.48]), cacR);
  const cilLR = add(C.cilindroHidraulico(0.07, 0.045, 1.15, mats), quadro), cilBR = add(C.cilindroHidraulico(0.065, 0.04, 1.0, mats), lancaR);
  const sapatas = [1, -1].map(s => { const g = add(new THREE.Group()); g.position.set(s * 0.72, 1.1, zR + 0.35);
    add(C.viga([0, 0, 0], [s * 0.55, -0.85, 0], 0.16, 0.18, mats.pintura, 0.03), g); const pe = add(K.caixa(0.36, 0.08, 0.42, mats.chassi, 0.02, [s * 0.58, -0.92, 0]), g); g.userData.pe = pe; return g; });
  // ---------------- rodas, luzes
  const rd = K.rodas(G, [{ z: zF, x: 0.78, d: true }, { z: zF, x: -0.78, d: true }], M.RF, 0.32, mats, { estilo: 'aco', aro: 0.55 });
  const rdT = K.rodas(G, [{ z: zT, x: 0.86 }, { z: zT, x: -0.86 }], M.R, 0.50, mats, { estilo: 'aco', aro: 0.52 });
  for (const r of [...rd, ...rdT]) r.R = r.z === zF ? M.RF : M.R;
  const luzes = C.luzesBasicas(G, mats, { frente: 2.47, tras: -1.98, yF: 1.62, yT: 1.55, xs: 0.40, giros: [giro] });
  for (const s of [1, -1]) { const f = K.lampada(0.16, 0.12, 0.08, 0xfff4dc, [s * 0.72, 2.95, -0.05], 0.02, 0.9); add(f.malha); luzes.farol.push(f.mat); }
  // ---------------- poses
  let ferr = null;
  const _p = new THREE.Vector3();
  const loc = (obj, v) => G.worldToLocal(obj.localToWorld(v.clone()));
  const aplicar = () => {
    if (!ferr) return;
    const pv = ferr.valor('pa'), cf = ferr.valor('cacambaF'), lr = ferr.valor('lancaR'), br = ferr.valor('bracoR'), gr2 = ferr.valor('giroR');
    pa.rotation.x = -pv; cacF.rotation.x = cf + pv * 0.85;              // a caçamba se mantém nivelada enquanto a pá sobe
    quadro.rotation.y = gr2; lancaR.rotation.x = lr; bracoR.rotation.x = br;
    const desce = THREE.MathUtils.clamp((br + 1.0) / 0.4, 0, 1);                       // braço da retro aberto → sapatas no chão
    sapatas.forEach((g, i) => { g.rotation.z = (i ? 1 : -1) * (1 - desce) * 0.9; });
    G.updateMatrixWorld(true);
    cilPa.forEach((c, i) => { const s = i ? -1 : 1; c.atualizar(new THREE.Vector3(s * 0.85, 1.0, 1.15), loc(pa, new THREE.Vector3(s * 0.98, -0.55, 1.05))); });
    cilCF.forEach((c, i) => { const s = i ? -0.45 : 0.45; c.atualizar(loc(pa, new THREE.Vector3(s, -0.25, 1.2)), loc(cacF, new THREE.Vector3(s, 0.45, 0.05))); });
    cilLR.atualizar(new THREE.Vector3(0, -0.1, 0.05), quadro.worldToLocal(lancaR.localToWorld(new THREE.Vector3(0, 1.05, -0.75))));
    cilBR.atualizar(new THREE.Vector3(0, 1.85, -1.0), lancaR.worldToLocal(bracoR.localToWorld(new THREE.Vector3(0, 0.35, 0.1))));
  };
  ferr = C.ferramentas([
    { id: 'pa', nome: 'Pá', v: 0.12, min: -0.08, max: 1.05, vel: 0.45 },
    { id: 'cacambaF', nome: 'Caçamba da pá', v: 0.0, min: -0.9, max: 0.7, vel: 0.8 },
    { id: 'lancaR', nome: 'Lança da retro', v: 0.70, min: -0.35, max: 0.85, vel: 0.5 },
    { id: 'bracoR', nome: 'Braço da retro', v: -1.23, min: -1.4, max: 1.2, vel: 0.7 },
    { id: 'giroR', nome: 'Giro da retro', v: 0, min: -1.3, max: 1.3, vel: 0.6 },
  ], aplicar);
  aplicar();
  if (opc.sombraChao !== false) add(K.sombraChao(5.2, W));
  return K.api(G, { L: M.L, W, H: M.H, R: M.R, luzes, rodas: [...rd, ...rdT], extra: {
    ferr,
    rodar(m) { for (const r of rd) r.giro.rotation.x = m / M.RF; for (const r of rdT) r.giro.rotation.x = m / M.R; },
  } });
}
