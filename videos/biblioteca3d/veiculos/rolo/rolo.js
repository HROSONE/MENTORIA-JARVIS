// ROLO COMPACTADOR vibratório de solo (cilindro liso na frente, pneus atrás), articulado, classe de ~11 t, proporções de fichas técnicas:
// cilindro de 2,134 m de largura e 1,534 m de diâmetro · 5,86 x 2,30 x 3,11 m (até o topo do ROPS) · entre-eixos 2,90 m ·
// pneus traseiros ~1,58 m. Genérico e fictício ("HRYZ OBRAS"). Eixo: Vibração (liga/desliga o vibrador: o cilindro treme).
import * as THREE from 'three';
import * as C from '../obra/comum.js';
const K = C.K;

export const M = { L: 5.86, W: 2.30, H: 3.11, EE: 2.90, R: 0.79, RC: 0.767 };
export function criar(opc = {}) {
  const G = new THREE.Group(); G.name = 'rolo';
  const mats = C.materiais(opc.cor ?? C.AMARELO); const add = (o, p = G) => { p.add(o); return o; };
  const zC = 1.45, zT = -1.45;                                                        // cilindro na frente, eixo traseiro atrás
  // ---------------- frente: quadro em U em volta do cilindro + cilindro vibratório
  const frente = add(new THREE.Group());
  for (const s of [1, -1]) add(K.caixa(0.12, 0.95, 2.05, mats.pintura, 0.04, [s * 1.13, 0.95, zC - 0.15]), frente);       // laterais do quadro
  add(K.caixa(2.38, 0.30, 0.55, mats.pintura, 0.05, [0, 1.62, zC - 0.95]), frente);                                       // travessa de trás do quadro
  add(K.caixa(2.38, 0.22, 0.30, mats.pintura, 0.04, [0, 1.38, zC + 0.86]), frente);                                       // travessa da frente
  for (const z of [zC + 0.85, zC - 0.92]) add(K.caixa(2.05, 0.06, 0.10, mats.desgaste, 0.01, [0, 0.42, z]), frente);    // raspadores
  add(K.caixa(0.7, 0.4, 0.7, mats.chassi, 0.05, [0, 1.15, 0.15]), frente);                                                  // articulação
  const cil = add(new THREE.Group(), frente); cil.position.set(0, M.RC, zC);
  const giroC = add(new THREE.Group(), cil);
  const tambor = K.cilX(M.RC, 2.134, mats.aco, [0, 0, 0], 48); giroC.add(tambor);
  for (const s of [1, -1]) { giroC.add(K.cilX(M.RC * 0.62, 0.03, mats.pintura, [s * 1.07, 0, 0], 32)); giroC.add(K.cilX(0.16, 0.08, mats.chassi, [s * 1.1, 0, 0], 16)); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; giroC.add(K.caixa(0.01, 0.08, 0.30, mats.chassi, 0, [1.09, Math.cos(a) * 0.4, Math.sin(a) * 0.4])); }   // raios da tampa (para ver o giro)
  // ---------------- trás: plataforma do operador com ROPS e capota, motor, pneus
  const tras = add(new THREE.Group());
  add(K.caixa(1.25, 0.5, 3.0, mats.chassi, 0.05, [0, 0.95, -1.4]), tras);
  const CAP = [[-2.95, 1.05], [-2.95, 2.05], [-2.7, 2.18], [-1.75, 2.18], [-1.70, 1.05]];
  add(new THREE.Mesh(K.perfil(CAP, { yBase: 1.05, largura: 1.95, bevel: 0.07 }), mats.pintura), tras).castShadow = true;
  for (let i = 0; i < 6; i++) add(K.caixa(1.6, 0.03, 0.04, mats.preto, 0, [0, 1.3 + i * 0.13, -2.97]), tras);
  add(K.caixa(2.05, 0.18, 1.35, mats.pintura, 0.04, [0, 1.45, -0.85]), tras);                                              // piso da plataforma
  const cab = add(C.cabine(1.85, 1.30, 1.55, mats, { vidroTras: true }), tras); cab.position.set(0, 1.54, -0.85);
  const giro = C.giroflex([0.6, 3.16, -1.2], mats); add(giro.grupo, tras);
  add(K.caixa(0.09, 0.6, 0.09, mats.preto, 0.02, [-0.6, 2.4, -2.2]), tras);
  for (const s of [1, -1]) add(K.caixa(0.62, 0.06, 1.0, mats.pintura, 0.02, [s * 0.86, M.R * 2 + 0.05, zT]), tras);          // para-lamas
  add(C.adesivoLados('HRYZ', 'OBRAS · CS56', 1.0, 0.30, 0.99, 1.7, -2.3), tras);
  add(C.zebrado(1.8, 0.14), tras).position.set(0, 1.18, -3.03); tras.children[tras.children.length - 1].rotation.y = Math.PI;
  const rd = K.rodas(tras, [{ z: zT, x: 0.86 }, { z: zT, x: -0.86 }], M.R, 0.58, mats, { estilo: 'pesada', aro: 0.55 });
  const luzes = C.luzesBasicas(tras, mats, { frente: -0.18, tras: -3.0, yF: 3.0, yT: 1.95, xs: 0.8, giros: [giro] });
  for (const s of [1, -1]) { const f = K.lampada(0.16, 0.12, 0.06, 0xfff4dc, [s * 0.95, 1.65, zC + 0.95], 0.02, 0.9); add(f.malha, frente); luzes.farol.push(f.mat); }
  // ---------------- vibração
  let vib = 0, t = 0;
  const ferr = C.ferramentas([{ id: 'vibracao', nome: 'Vibração', v: 0, min: 0, max: 1, vel: 2 }], () => {});
  if (opc.sombraChao !== false) add(K.sombraChao(5.6, 2.3));
  return K.api(G, { L: M.L, W: M.W, H: M.H, R: M.R, luzes, rodas: rd, extra: {
    ferr,
    rodar(m) { for (const r of rd) r.giro.rotation.x = m / M.R; giroC.rotation.x = m / M.RC; },
    esterco(rad) { frente.rotation.y = THREE.MathUtils.clamp(rad * 1.2, -0.6, 0.6); },
    /** chame a cada quadro: o cilindro treme quando a vibração está ligada (> 0,5) */
    vibrar(dt) { t += dt; vib = ferr.valor('vibracao') > 0.5 ? 1 : 0; cil.position.y = M.RC + vib * Math.sin(t * 190) * 0.012; cil.position.x = vib * Math.sin(t * 157) * 0.006; return vib; },
  } });
}
