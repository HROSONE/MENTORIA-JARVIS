// PÁ CARREGADEIRA de rodas, articulada, classe média (~18–19 t), proporções de fichas técnicas dessa classe:
// entre-eixos 3,30 m (articulação no meio, 1,65 m do eixo traseiro) · 3,46 m até o topo da cabine · 2,67 m até o capô ·
// 2,745 m de largura nos pneus · pneus 23.5R25 (~1,62 m de diâmetro) · caçamba de ~3,2 m³ e ~2,95 m de largura ·
// ~8,3 m de comprimento com a caçamba no chão. Genérica e fictícia ("HRYZ OBRAS").
// Direção articulada: esterco(rad) dobra o chassi no meio. Eixos: Braços (levantar), Caçamba (inclinar).
import * as THREE from 'three';
import * as C from '../obra/comum.js';
const K = C.K;

export const M = { L: 8.3, W: 2.95, H: 3.46, EE: 3.30, R: 0.81 };
export function criar(opc = {}) {
  const G = new THREE.Group(); G.name = 'carregadeira';
  const mats = C.materiais(opc.cor ?? C.AMARELO); const add = (o, p = G) => { p.add(o); return o; };
  const R = M.R, bit = 2.745 - 0.60;                                                   // bitola (centro dos pneus)
  // ---------------- chassi traseiro (motor e cabine) — fica parado; a frente gira na articulação (z = 0)
  const tras = add(new THREE.Group());
  const zT = -M.EE / 2;
  add(K.caixa(1.1, 0.55, 4.0, mats.chassi, 0.05, [0, 1.0, -2.1]), tras);
  const CAP = [[-4.05, 1.05], [-4.05, 2.35], [-3.75, 2.62], [-1.55, 2.67], [-1.50, 1.05]];
  add(new THREE.Mesh(K.perfil(CAP, { yBase: 1.05, largura: 1.85, bevel: 0.08 }), mats.pintura), tras).castShadow = true;
  for (let i = 0; i < 9; i++) add(K.caixa(1.5, 0.03, 0.04, mats.preto, 0, [0, 1.35 + i * 0.12, -4.14]), tras);           // grade do radiador atrás
  add(K.caixa(2.0, 0.42, 0.30, mats.pintura, 0.05, [0, 0.95, -4.05]), tras);                                              // contrapeso
  add(K.caixa(0.10, 0.75, 0.10, mats.preto, 0.02, [0.45, 3.0, -2.2]), tras);                                              // escapamento (~3,4 m)
  const cab = add(C.cabine(1.65, 1.75, 1.80, mats), tras); cab.position.set(0, 1.62, -0.75);
  add(K.caixa(2.1, 0.35, 1.9, mats.pintura, 0.05, [0, 1.42, -0.75]), tras);
  const giro = C.giroflex([0.55, 3.52, -1.2], mats); add(giro.grupo, tras);
  for (const s of [1, -1]) {                                                                                               // para-lamas traseiros
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.12, R + 0.12, 0.66, 24, 1, true, 0, Math.PI), mats.pintura); pl.rotation.z = Math.PI / 2; pl.rotation.y = Math.PI / 2; pl.position.set(s * bit / 2, R + 0.05, zT); add(pl, tras);
    add(K.caixa(0.15, 1.2, 0.15, mats.chassi, 0.02, [s * 0.62, 1.95, -0.05]), tras);                                       // corrimão da escada
  }
  add(C.adesivoLados('HRYZ', 'OBRAS · 950', 1.35, 0.36, 0.935, 2.05, -2.8), tras);
  add(C.zebrado(1.9, 0.14), tras).position.set(0, 1.2, -4.22); tras.children[tras.children.length - 1].rotation.y = Math.PI;
  // ---------------- chassi dianteiro (gira na articulação): braços em Z, caçamba
  const frente = add(new THREE.Group());
  add(K.caixa(1.0, 0.65, 2.3, mats.pintura, 0.06, [0, 1.15, 1.25]), frente);
  add(K.caixa(0.35, 0.35, 0.4, mats.aco, 0.04, [0, 1.15, 0.05]), frente);                                                   // articulação
  for (const s of [1, -1]) { const pl = K.caixa(0.75, 0.08, 1.3, mats.pintura, 0.02, [s * bit / 2, R + 0.30, M.EE / 2]); add(pl, frente); }   // para-lamas dianteiros
  const bracos = add(new THREE.Group(), frente); bracos.position.set(0, 2.25, 0.95);                                       // pino dos braços na torre
  add(K.caixa(0.70, 1.3, 0.5, mats.pintura, 0.05, [0, 1.75, 0.95]), frente);                                                // torre dos braços
  const PB = new THREE.Vector3(0, -1.70, 2.65);                                                                             // pino da caçamba (no chão)
  for (const s of [1, -1]) add(C.viga([s * 0.62, 0, 0], [s * 0.62, PB.y, PB.z], 0.16, 0.42, mats.pintura, 0.04), bracos);
  add(K.caixa(1.24, 0.30, 0.28, mats.pintura, 0.04, [0, -0.75, 1.15]), bracos);                                             // travessa
  const alav = add(new THREE.Group(), bracos); alav.position.set(0, -0.35, 1.30);                                           // alavanca em Z (basculamento)
  add(K.caixa(0.22, 1.1, 0.24, mats.pintura, 0.04, [0, 0.0, 0]), alav);
  const cac = add(new THREE.Group(), bracos); cac.position.copy(PB);
  const sc = new THREE.Shape(); sc.moveTo(-0.15, 0.95); sc.lineTo(0.15, 1.05); sc.quadraticCurveTo(0.20, 0.30, 0.70, -0.30); sc.lineTo(1.45, -0.55); sc.lineTo(1.40, -0.66); sc.lineTo(0.0, -0.62); sc.quadraticCurveTo(-0.32, 0.2, -0.15, 0.95);
  const gc = new THREE.ExtrudeGeometry(sc, { depth: 2.90, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 14 }); gc.translate(0, 0, -1.45); gc.rotateY(-Math.PI / 2);
  add(new THREE.Mesh(gc, mats.pintura), cac).castShadow = true;
  { const sl = new THREE.Shape(); sl.moveTo(-0.15, 0.95); sl.lineTo(0.15, 1.05); sl.lineTo(1.45, -0.55); sl.lineTo(1.40, -0.66); sl.lineTo(0.0, -0.62); sl.quadraticCurveTo(-0.32, 0.2, -0.15, 0.95);   // laterais no mesmo perfil
    for (const s of [1, -1]) { const gl = new THREE.ExtrudeGeometry(sl, { depth: 0.05, bevelEnabled: false, curveSegments: 10 }); gl.translate(0, 0, -0.025); gl.rotateY(-Math.PI / 2); const m = new THREE.Mesh(gl, mats.pintura); m.position.x = s * 1.47; m.castShadow = true; add(m, cac); } }
  add(K.caixa(2.96, 0.05, 0.22, mats.desgaste, 0.01, [0, -0.62, 1.38]), cac);                                                // lâmina de corte
  const cilE = [1, -1].map(s => add(C.cilindroHidraulico(0.10, 0.06, 1.2, mats), frente));
  const cilC = add(C.cilindroHidraulico(0.11, 0.065, 1.15, mats), frente);
  const tirante = add(K.caixa(0.12, 0.12, 1, mats.aco, 0.02), bracos);
  // ---------------- rodas
  const rdT = K.rodas(tras, [{ z: zT, x: bit / 2 }, { z: zT, x: -bit / 2 }], R, 0.60, mats, { estilo: 'pesada', aro: 0.55 });
  const rdF = K.rodas(frente, [{ z: M.EE / 2, x: bit / 2 }, { z: M.EE / 2, x: -bit / 2 }], R, 0.60, mats, { estilo: 'pesada', aro: 0.55 });
  const luzes = C.luzesBasicas(tras, mats, { frente: 0.15, tras: -4.18, yF: 3.30, yT: 2.15, xs: 0.75, giros: [giro] });
  for (const s of [1, -1]) { const f = K.lampada(0.18, 0.14, 0.06, 0xfff4dc, [s * 0.55, 2.55, 1.6], 0.02, 0.9); add(f.malha, frente); luzes.farol.push(f.mat); }
  // ---------------- poses
  let ferr = null;
  const loc = (obj, v) => frente.worldToLocal(obj.localToWorld(v.clone()));
  const aplicar = () => {
    if (!ferr) return;
    const b = ferr.valor('bracos'), c = ferr.valor('cacamba');
    bracos.rotation.x = -b; cac.rotation.x = -c + b * 0.95;                       // o ligamento em Z mantém a caçamba quase nivelada ao subir
    alav.rotation.x = -c * 0.8 + 0.1;
    G.updateMatrixWorld(true);
    cilE.forEach((cl, i) => { const s = i ? -1 : 1; cl.atualizar(new THREE.Vector3(s * 0.55, 1.05, 1.95), loc(bracos, new THREE.Vector3(s * 0.62, -0.95, 1.4))); });
    cilC.atualizar(new THREE.Vector3(0, 1.95, 1.05), loc(alav, new THREE.Vector3(0, 0.5, 0)));
    const a = alav.localToWorld(new THREE.Vector3(0, -0.5, 0)), bb = cac.localToWorld(new THREE.Vector3(0, 0.75, 0.25));
    const la = bracos.worldToLocal(a.clone()), lb = bracos.worldToLocal(bb.clone());
    tirante.position.copy(la).lerp(lb, 0.5); tirante.scale.z = la.distanceTo(lb); tirante.lookAt(bracos.localToWorld(lb.clone()));
  };
  ferr = C.ferramentas([
    { id: 'bracos', nome: 'Braços', v: 0.18, min: -0.12, max: 1.15, vel: 0.45 },
    { id: 'cacamba', nome: 'Caçamba', v: 0.25, min: -0.85, max: 0.75, vel: 0.8 },
  ], aplicar);
  aplicar();
  if (opc.sombraChao !== false) add(K.sombraChao(6.2, 2.9));
  return K.api(G, { L: M.L, W: M.W, H: M.H, R, luzes, rodas: [...rdT, ...rdF], extra: {
    ferr,
    esterco(rad) { frente.rotation.y = THREE.MathUtils.clamp(rad * 1.25, -0.70, 0.70); },     // direção articulada (até ~40°)
  } });
}
