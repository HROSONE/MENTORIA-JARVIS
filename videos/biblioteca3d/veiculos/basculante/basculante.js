// CAMINHÃO BASCULANTE 6x4 (cabine avançada, tração nos dois eixos traseiros), proporções de basculantes rodoviários brasileiros:
// ~8,2 x 2,55 x 3,2 m · entre-eixos ~3,6 m + tandem de 1,36 m · pneus 295/80R22.5 (~1,04 m) · caçamba de ~12 m³
// (5,0 x 2,3 x 1,05 m por dentro) basculando para trás num pino no fim do chassi, com cilindro telescópico na frente
// e tampa traseira que se abre por cima. Genérico e fictício ("HRYZ OBRAS"). Eixo: Caçamba (bascular). Carga de terra.
import * as THREE from 'three';
import * as C from '../obra/comum.js';
const K = C.K;

export const M = { L: 8.2, W: 2.55, H: 3.2, EE: 4.28, R: 0.52 };
export function criar(opc = {}) {
  const G = new THREE.Group(); G.name = 'basculante';
  const mats = C.materiais(0xf2f2ec); const add = (o, p = G) => { p.add(o); return o; };
  const corCac = new THREE.MeshStandardMaterial({ color: opc.corCacamba ?? 0xe0661b, roughness: 0.5, metalness: 0.15 });
  const zN = 4.1, zF = 2.75, zT1 = -0.85, zT2 = -2.21, W = M.W, R = M.R;
  // ---------------- chassi e cabine avançada
  add(K.caixa(0.95, 0.30, 7.6, mats.chassi, 0.03, [0, 0.95, -0.1]));
  const CAB = [[2.15, 1.05], [2.15, 3.18], [3.85, 3.18], [4.05, 2.95], [4.12, 1.95], [4.10, 1.05]];
  add(new THREE.Mesh(K.perfil(CAB, { yBase: 1.0, largura: 2.48, bevel: 0.08, arcos: [{ z: zF, r: R + 0.10, yc: R }] }), mats.pintura)).castShadow = true;
  add(K.vidroInclinado([4.13, 2.0], [4.04, 2.92], 2.2, 2.15, mats.vidro, 1, 0.06));
  add(K.janelas([[3.95, 2.0], [3.95, 2.85], [3.1, 2.85], [3.1, 2.0]], 1.245, mats.vidro));
  add(K.caixa(2.3, 0.55, 0.10, mats.preto, 0.02, [0, 1.55, 4.16]));                                          // grade
  add(K.caixa(2.5, 0.35, 0.30, mats.aco, 0.04, [0, 0.82, 4.12]));                                            // para-choque
  add(K.caixa(2.48, 0.32, 0.10, mats.pintura, 0.03, [0, 3.30, 2.9])).rotation.x = -0.25;                     // defletor
  for (const s of [1, -1]) { add(K.caixa(0.06, 0.5, 0.25, mats.preto, 0.02, [s * 1.38, 2.5, 3.85])); add(K.caixa(0.7, 0.10, 0.4, mats.aco, 0.02, [s * 0.95, 0.55, 2.0])); }   // espelhos, degraus
  add(K.caixa(0.7, 0.55, 1.1, mats.aco, 0.05, [0.9, 0.9, 1.3]));                                            // tanque
  add(K.caixa(0.12, 1.4, 0.12, mats.preto, 0.02, [-1.05, 2.8, 2.05]));                                       // escapamento vertical
  add(C.adesivoLados('HRYZ', 'OBRAS · 6x4', 0.9, 0.26, 1.25, 1.55, 3.0, '#e0661b'));
  // ---------------- caçamba basculante (pino atrás, no fim do chassi)
  const zP = -3.75, yP = 1.18;
  const cac = add(new THREE.Group()); cac.position.set(0, yP, zP);
  const comp = 5.0, larg = 2.45, alt = 1.15, z0 = 0.05, z1 = z0 + comp;
  add(K.caixa(larg, 0.10, comp, corCac, 0.02, [0, 0.05, (z0 + z1) / 2]), cac);                                  // fundo
  for (const s of [1, -1]) { add(K.caixa(0.08, alt, comp, corCac, 0.02, [s * (larg / 2 - 0.04), alt / 2 + 0.05, (z0 + z1) / 2]), cac);
    for (let i = 0; i < 6; i++) add(K.caixa(0.05, alt, 0.10, corCac, 0.01, [s * (larg / 2 + 0.01), alt / 2 + 0.05, z0 + 0.35 + i * 0.86]), cac);   // reforços verticais
    add(K.caixa(0.10, 0.10, comp, corCac, 0.02, [s * (larg / 2 + 0.01), alt + 0.06, (z0 + z1) / 2]), cac); }
  add(K.caixa(larg, alt + 0.35, 0.10, corCac, 0.02, [0, (alt + 0.35) / 2 + 0.05, z1 - 0.05]), cac);             // frente (mais alta)
  add(K.caixa(larg, 0.10, 0.85, corCac, 0.02, [0, alt + 0.42, z1 + 0.30]), cac);                                // protetor da cabine
  const tampa = add(new THREE.Group(), cac); tampa.position.set(0, alt + 0.05, z0);                             // tampa traseira articulada em cima
  add(K.caixa(larg - 0.04, alt, 0.08, corCac, 0.02, [0, -alt / 2, -0.02]), tampa);
  add(C.zebrado(larg - 0.1, 0.18), tampa).position.set(0, -alt + 0.2, -0.07); tampa.children[tampa.children.length - 1].rotation.y = Math.PI;
  // carga de terra (monte que escorrega e sai quando a caçamba sobe)
  const gT = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2); gT.scale(larg * 0.46, 0.55, comp * 0.46);
  const terra = add(new THREE.Mesh(gT, mats.terra), cac); terra.position.set(0, alt * 0.75, (z0 + z1) / 2); terra.castShadow = true; terra.userData.dinamico = true;
  const cilT = add(C.cilindroHidraulico(0.14, 0.08, 1.2, mats));
  // ---------------- rodas: dianteira simples, tandem traseiro com rodado duplo
  const rd = K.rodas(G, [{ z: zF, x: 1.05, d: true }, { z: zF, x: -1.05, d: true },
    { z: zT1, x: 1.02 }, { z: zT1, x: 0.72, externa: false }, { z: zT1, x: -1.02 }, { z: zT1, x: -0.72, externa: false },
    { z: zT2, x: 1.02 }, { z: zT2, x: 0.72, externa: false }, { z: zT2, x: -1.02 }, { z: zT2, x: -0.72, externa: false }], R, 0.30, mats, { estilo: 'pesada', aro: 0.56 });
  for (const s of [1, -1]) add(K.caixa(0.62, 0.05, 2.25, mats.preto, 0.01, [s * 0.88, R * 2 + 0.06, (zT1 + zT2) / 2]));    // para-lamas
  const luzes = C.luzesBasicas(G, mats, { frente: 4.15, tras: -3.95, yF: 1.0, yT: 0.95, xs: 0.95 });
  // ---------------- poses
  let ferr = null, carga = 12; const CAP = 12;                                            // m³ de terra na caçamba
  const aplicar = () => {
    if (!ferr) return;
    const a = ferr.valor('cacamba');
    cac.rotation.x = -a;                                                                    // sobe a frente, gira no pino de trás
    tampa.rotation.x = -Math.min(1.2, Math.max(0, a - 0.18) * 1.8) * 0 + Math.min(1.1, Math.max(0, a - 0.15) * 1.6);   // a tampa abre por baixo
    const saiu = THREE.MathUtils.clamp((a - 0.45) / 0.3, 0, 1);                             // a terra escorrega para trás e sai
    const n = carga / CAP; terra.position.z = (z0 + z1) / 2 - saiu * comp * 0.9; terra.scale.set(n > 0 ? 0.55 + 0.45 * n : 0.001, Math.max(0.001, n), n > 0 ? 0.55 + 0.45 * n : 0.001); terra.scale.multiplyScalar(1 - saiu * 0.85); terra.visible = n > 0.01 && saiu < 0.98;
    G.updateMatrixWorld(true);
    cilT.atualizar(new THREE.Vector3(0, 1.05, 1.25), G.worldToLocal(cac.localToWorld(new THREE.Vector3(0, 0.02, z1 - 0.55))));
  };
  ferr = C.ferramentas([{ id: 'cacamba', nome: 'Caçamba', v: 0, min: 0, max: 0.85, vel: 0.22 }], aplicar);
  aplicar();
  if (opc.sombraChao !== false) add(K.sombraChao(M.L, W));
  return K.api(G, { L: M.L, W, H: M.H, R, luzes, rodas: rd, extra: {
    ferr,
    carregar() { carga = CAP; aplicar(); },
    cargaAtual: () => carga, capacidade: CAP,                                          // (função: o api copia as propriedades)
    /** põe (ou tira) terra; devolve quanto coube */
    adicionarCarga(m3) { const antes = carga; carga = Math.max(0, Math.min(CAP, carga + m3)); aplicar(); return carga - antes; },
    /** área da caçamba no mundo (para as máquinas despejarem dentro) */
    caixaCacamba() { const a = cac.localToWorld(new THREE.Vector3(0, alt, z0)), b = cac.localToWorld(new THREE.Vector3(0, alt, z1)); return { a, b, larg }; },
  } });
}
