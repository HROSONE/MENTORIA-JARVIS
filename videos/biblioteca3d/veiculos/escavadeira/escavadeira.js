// ESCAVADEIRA HIDRÁULICA de esteiras, classe de ~22 t (proporções conferidas com fichas técnicas de escavadeiras dessa classe):
// transporte 9,53 x 2,98 x 2,96 m · esteiras de 4,45 m com sapatas de 0,60 m e bitola de 2,38 m · raio traseiro de giro ~2,8 m ·
// lança de 5,7 m, braço de 2,9 m, caçamba de ~1,2 m³ (raio da ponta ~1,57 m). Genérica e fictícia ("HRYZ OBRAS"), sem marca.
// Eixos da ferramenta: Lança, Braço, Caçamba, Giro da casa. Esteiras com sapatas que andam (rodar).
import * as THREE from 'three';
import * as C from '../obra/comum.js';
const K = C.K;

export const M = { L: 9.53, W: 2.98, H: 2.96, R: 0.38 };
export function criar(opc = {}) {
  const G = new THREE.Group(); G.name = 'escavadeira';
  const mats = C.materiais(opc.cor ?? C.AMARELO); const add = (o, p = G) => { p.add(o); return o; };
  // ---------------- material rodante: duas esteiras (4,45 m de ponta a ponta) e o chassi inferior
  const compE = 4.45 - 2 * M.R, bitola = 2.38, lSap = 0.60;
  const esteiras = [1, -1].map(s => { const e = C.esteira(compE, M.R, lSap, mats); e.position.set(s * bitola / 2, M.R + 0.05, 0); add(e); return e; });
  add(K.caixa(1.25, 0.55, 2.6, mats.chassi, 0.08, [0, 0.78, 0]));                                  // chassi central
  for (const s of [1, -1]) add(K.caixa(0.55, 0.28, 2.0, mats.chassi, 0.05, [s * 0.75, 0.82, 0]));    // travessas até as esteiras
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.16, 32), mats.aco)).position.set(0, 1.10, 0);   // rolamento do giro
  // ---------------- casa (gira): contrapeso atrás, motor, caixa de ferramentas à direita, cabine à esquerda na frente
  const casa = add(new THREE.Group()); casa.position.y = 1.18;
  const yC = 0.0;
  add(K.caixa(2.54, 0.22, 3.6, mats.chassi, 0.04, [0, yC + 0.11, -0.25]), casa);                    // plataforma
  const contra = new THREE.Shape(); contra.absarc(0, 0, 2.80, Math.PI * 1.22, Math.PI * 1.78, false); contra.lineTo(1.27, -1.75); contra.lineTo(-1.27, -1.75); contra.closePath();
  const gC = new THREE.ExtrudeGeometry(contra, { depth: 0.95, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3, curveSegments: 24 });
  gC.rotateX(Math.PI / 2); const mC = new THREE.Mesh(gC, mats.pintura); mC.position.set(0, yC + 0.22 + 0.95, 0.05);   // (o arco fica atrás; a extrusão desce) mC.castShadow = true; add(mC, casa);   // contrapeso (raio de 2,8 m)
  add(K.caixa(2.50, 0.95, 1.55, mats.pintura, 0.06, [0, yC + 0.70, -1.15]), casa);                   // capô do motor
  for (let i = 0; i < 7; i++) add(K.caixa(0.06, 0.02, 1.1, mats.preto, 0, [-0.9 + i * 0.3, yC + 1.18, -1.15]), casa);   // grade do capô
  add(K.cilX(0.07, 0.07, mats.preto, [0.0, yC + 1.30, -0.75]).rotateZ(Math.PI / 2), casa);           // escapamento
  add(K.caixa(1.10, 0.95, 1.65, mats.pintura, 0.05, [-0.72, yC + 0.70, 0.62]), casa);                // tanque e caixa de ferramentas (lado direito)
  add(K.caixa(1.12, 0.03, 1.6, mats.chassi, 0, [-0.72, yC + 1.19, 0.62]), casa);
  const cab = add(C.cabine(1.0, 1.65, 1.72, mats, { portaX: 1 }), casa); cab.position.set(0.74, yC + 0.22, 0.70);
  const giro = C.giroflex([0.74, yC + 2.02, 0.2], mats); add(giro.grupo, casa);
  add(C.zebrado(2.4, 0.16), casa).position.set(0, yC + 0.42, -1.82); casa.children[casa.children.length - 1].rotation.y = Math.PI;
  add(C.adesivoLados('HRYZ', 'OBRAS · 320', 1.3, 0.36, 1.275, yC + 0.82, -1.0), casa);
  // ---------------- lança (dobrada), braço e caçamba
  const P_LANCA = new THREE.Vector3(-0.12, yC + 1.05, 1.30);
  const lanca = add(new THREE.Group(), casa); lanca.position.copy(P_LANCA);
  // lança no próprio referencial: sobe 3,3 m e dobra; ponta em (0, 1.55, 5.45) ≈ 5,7 m de comprimento
  const L1 = new THREE.Vector3(0, 1.85, 2.75), L2 = new THREE.Vector3(0, 1.55, 5.45);
  const perfilLanca = (a, b, h0, h1) => { const g = new THREE.Group(); const d = a.distanceTo(b); const sh = new THREE.Shape(); sh.moveTo(0, -h0 / 2); sh.lineTo(d, -h1 / 2); sh.lineTo(d, h1 / 2); sh.lineTo(0, h0 / 2); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.50, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }); geo.translate(0, 0, -0.25); geo.rotateY(-Math.PI / 2);
    const m = new THREE.Mesh(geo, mats.pintura); m.castShadow = true; g.add(m); g.position.copy(a); g.lookAt(b); return g; };   // (lookAt antes de ir para o pai: coordenadas do pai)
  const seg1 = perfilLanca(new THREE.Vector3(), L1, 0.62, 0.78); seg1.lookAt(L1); add(seg1, lanca);
  const seg2 = perfilLanca(L1, L2, 0.78, 0.48); seg2.position.copy(L1); seg2.lookAt(L2); add(seg2, lanca);
  add(C.pino(0.11, 0.62, mats, [0, 0, 0]), lanca); add(C.pino(0.12, 0.62, mats, L1.toArray()), lanca);
  const braco = add(new THREE.Group(), lanca); braco.position.copy(L2);
  // braço: 2,9 m para baixo/à frente no seu referencial (eixo -y), com o "nariz" acima do pino para o cilindro
  const B_PONTA = new THREE.Vector3(0, -2.90, 0.0), B_TOPO = new THREE.Vector3(0, 0.55, -0.20);
  const sb = new THREE.Shape(); sb.moveTo(-0.24, 0.55); sb.lineTo(0.22, 0.45); sb.lineTo(0.16, -2.85); sb.lineTo(-0.12, -2.95); sb.lineTo(-0.30, 0.2); sb.closePath();
  const gb = new THREE.ExtrudeGeometry(sb, { depth: 0.40, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }); gb.translate(0, 0, -0.20); gb.rotateY(-Math.PI / 2);
  add(new THREE.Mesh(gb, mats.pintura), braco).castShadow = true;
  add(C.pino(0.11, 0.66, mats, [0, 0, 0]), braco);
  const cacamba = add(new THREE.Group(), braco); cacamba.position.copy(B_PONTA);
  // caçamba: ~1,05 m de largura, ponta a 1,57 m do pino, com 5 dentes
  const sc = new THREE.Shape(); sc.moveTo(0.0, 0.10); sc.quadraticCurveTo(-0.85, 0.15, -1.05, -0.65); sc.lineTo(-0.92, -1.45); sc.lineTo(-0.15, -1.30); sc.quadraticCurveTo(0.35, -0.55, 0.0, 0.10);
  const gc = new THREE.ExtrudeGeometry(sc, { depth: 1.0, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 16 }); gc.translate(0, 0, -0.5); gc.rotateY(-Math.PI / 2);
  const mcac = new THREE.Mesh(gc, mats.pintura); mcac.castShadow = true; add(mcac, cacamba);
  add(K.caixa(1.06, 0.05, 0.26, mats.desgaste, 0.01, [0, -1.42, -0.82]), cacamba).rotation.x = -0.15;   // lâmina de corte na boca (a ponta fica do lado da máquina)
  for (let i = 0; i < 5; i++) { const d = K.caixa(0.09, 0.07, 0.24, mats.desgaste, 0.015, [-0.42 + i * 0.21, -1.47, -1.0]); d.rotation.x = -0.2; add(d, cacamba); }
  add(C.pino(0.09, 1.1, mats, [0, 0, 0]), cacamba);
  // ---------------- cilindros hidráulicos (2 da lança, 1 do braço, 1 da caçamba)
  const cilL = [0.30, -0.30].map(x => add(C.cilindroHidraulico(0.085, 0.05, 1.55, mats), casa));
  const cilB = add(C.cilindroHidraulico(0.085, 0.055, 1.55, mats), lanca);
  const cilC = add(C.cilindroHidraulico(0.075, 0.045, 1.25, mats), braco);
  // ---------------- luzes
  const luzes = C.luzesBasicas(G, mats, { frente: 0.55, tras: -1.42, yF: 2.2, yT: 1.45, xs: 0.85, giros: [giro] });
  const fL = K.lampada(0.18, 0.12, 0.08, 0xfff4dc, [0.25, 0.9, 1.4], 0.02, 0.9); add(fL.malha, lanca); luzes.farol.push(fL.mat);      // farol de trabalho na lança
  // ---------------- poses
  const _A = new THREE.Vector3(), _B = new THREE.Vector3();
  const loc = (obj, v, ref = casa) => ref.worldToLocal(obj.localToWorld(v.clone()));
  const aplicar = () => {
    if (!ferr) return;
    const lan = ferr.valor('lanca'), br = ferr.valor('braco'), cc = ferr.valor('cacamba'), gr = ferr.valor('giro');
    casa.rotation.y = gr;
    lanca.rotation.x = -lan;                            // >0 levanta a lança
    braco.rotation.x = br;                              // >0 recolhe o braço para dentro
    cacamba.rotation.x = cc;                            // >0 fecha a caçamba (enche)
    G.updateMatrixWorld(true);
    // cilindros da lança: da plataforma (frente, embaixo) até o meio da lança, por baixo
    cilL.forEach((c, i) => { const x = i ? -0.30 : 0.30; c.atualizar(new THREE.Vector3(x - 0.12, yC + 0.45, 1.05), loc(lanca, new THREE.Vector3(x, 0.95, 1.95))); });
    cilB.atualizar(new THREE.Vector3(0, 2.25, 2.55), loc(braco, B_TOPO, lanca));
    cilC.atualizar(new THREE.Vector3(0, 0.25, 0.32), new THREE.Vector3(0, -2.35, 0.40));
  };
  let ferr = null;
  ferr = C.ferramentas([
    { id: 'lanca', nome: 'Lança', v: -0.05, min: -0.45, max: 0.75, vel: 0.5 },
    { id: 'braco', nome: 'Braço', v: 1.05, min: -0.5, max: 1.25, vel: 0.6 },
    { id: 'cacamba', nome: 'Caçamba', v: 1.45, min: -0.6, max: 1.9, vel: 0.9 },
    { id: 'giro', nome: 'Giro', v: 0, min: -Math.PI, max: Math.PI, vel: 0.7 },
  ], aplicar);
  ferr.casa = casa; ferr.cacamba = cacamba; aplicar();
  const terraC = C.terraNaCacamba(cacamba, [0, -0.62, -0.45], 0.45, 0.45, 0.42, mats); terraC.rotation.x = Math.PI * 0.1;
  const cacambas = [C.cacamba({ nome: 'Caçamba', cap: 1.2, obj: cacamba, ponta: [0, -1.45, -0.95], centro: [0, -0.6, -0.45], terra: terraC, despejando: () => ferr.valor('cacamba') < 0.1 })];
  if (opc.sombraChao !== false) add(K.sombraChao(4.6, 3.0));
  let dist = 0;
  return K.api(G, { L: M.L, W: M.W, H: M.H, R: M.R, luzes, rodas: [], extra: {
    ferr, esteiras: true, cacambas,
    rodar(metros) { const d = metros - dist; dist = metros; esteiras.forEach(e => e.mover(metros)); },
    esterco(rad) { esteiras[0].mover(dist + rad * 0.8); esteiras[1].mover(dist - rad * 0.8); },
  } });
}
