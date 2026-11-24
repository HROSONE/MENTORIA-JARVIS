// Corte de instâncias por quadro: a "equipe de set" tira do cenário o que a câmera não vê e põe versão leve no que está longe.
// As ~2000 plantas e pedras são InstancedMesh com frustumCulled = false (o Three.js não corta cópias uma a uma): a mata tinha ~58 milhões de
// triângulos por passe de render e cada quadro tem 4 passes (sombra, imagem, normais do AO, profundidade do desfoque), então cada passe
// processava tudo, até o que está atrás da câmera. A cada quadro (função só da câmera e do sol: qualquer quadro sai igual em qualquer ordem):
//   • sai o que não cruza o campo de visão e não joga sombra dentro dele, e o que está além de DIST_MAX (a névoa exp² de 0,018 já engoliu: < 4%);
//   • o que está a mais de DIST_LOD troca para o modelo leve (a névoa e a distância escondem o detalhe);
//   • só entra no mapa de sombra o que cai na janela da câmera da luz (±14 m em volta do assunto): o resto seria cortado pela própria câmera da luz.
// Chamar prepararCorte(INSTANCIAS) depois de montar a cena E depois da limparLente (as cópias escondidas ficam fora para sempre).
import * as THREE from 'three';

const lotes = [];
const F = new THREE.Frustum(), PV = new THREE.Matrix4(), M4 = new THREE.Matrix4(), c3 = new THREE.Vector3();
const LUZ = new THREE.Vector3(), U = new THREE.Vector3(), W = new THREE.Vector3(), CIMA = new THREE.Vector3(0, 1, 0);
export const DIST_MAX = 100, DIST_LOD = 45, JANELA_SOMBRA = 14;
export const estatisticas = { total: 0, sombra: 0, perto: 0, longe: 0 };

export function prepararCorte(registros) {
  lotes.length = 0;
  for (const reg of registros) {
    const N = reg.matrizes.length, base = reg.ims[0].instanceMatrix.array;
    const L = {
      reg, N, ativo: new Uint8Array(N), modo: new Uint8Array(N), cx: new Float32Array(N), cy: new Float32Array(N), cz: new Float32Array(N), r: new Float32Array(N),
      c: reg.ims.map(im => ({ im, todas: im.instanceMatrix.array.slice() })), l: reg.imsL.map(im => ({ im, todas: im.instanceMatrix.array.slice() })),
    };
    L.m = reg.imsM.map((im, j) => ({ im, todas: L.c[j].todas }));                  // (mesmas matrizes do conjunto com sombra)
    for (let i = 0; i < N; i++) {
      const k = i * 16;
      if (base[k] === 0 && base[k + 5] === 0 && base[k + 10] === 0 && base[k + 12] === 0 && base[k + 13] === 0 && base[k + 14] === 0) continue;     // escondida pela limparLente
      M4.copy(reg.matrizes[i]); c3.copy(reg.esfera.c).applyMatrix4(M4);
      L.cx[i] = c3.x; L.cy[i] = c3.y; L.cz[i] = c3.z; L.r[i] = reg.esfera.r * M4.getMaxScaleOnAxis(); L.ativo[i] = 1;
    }
    lotes.push(L);
  }
  return lotes.length;
}

/** volta ao estado de montagem: todas as cópias no conjunto com sombra, nenhuma nos outros (para exportar a cena inteira ou conferir) */
export function restaurarCorte() {
  for (const L of lotes) {
    for (const P of L.c) { P.im.instanceMatrix.array.set(P.todas); P.im.count = L.N; P.im.instanceMatrix.needsUpdate = true; }
    for (const P of [...L.m, ...L.l]) P.im.count = 0;
  }
}

const dentro = (x, y, z, r) => { for (const p of F.planes) if (p.normal.x * x + p.normal.y * y + p.normal.z * z + p.constant < -r) return false; return true; };

/**
 * cam: câmera já posicionada (matrizes do mundo atualizadas). sol: a DirectionalLight (posição e alvo dão a direção da luz e a janela da sombra).
 * margem: folga em metros (a esfera de cada cópia é aproximada). alcance: comprimento máximo da sombra considerada.
 */
export function cortar(cam, sol, { margem = 0.6, alcance = 18 } = {}) {
  if (!lotes.length) return;
  cam.updateMatrixWorld(); PV.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); F.setFromProjectionMatrix(PV);
  const cp = cam.position, alvo = sol.target.position;
  LUZ.copy(sol.position).sub(alvo).normalize();                                    // do assunto para o sol
  U.crossVectors(CIMA, LUZ).normalize(); W.crossVectors(LUZ, U);                   // eixos da câmera da luz (a janela da sombra é um quadrado em U, W)
  const ly = LUZ.y > 0.05 ? LUZ.y : 0, est = estatisticas; est.total = est.sombra = est.perto = est.longe = 0;
  for (const L of lotes) {
    const modo = L.modo, tem_l = L.l.length > 0;
    for (let i = 0; i < L.N; i++) {
      modo[i] = 0;
      if (!L.ativo[i]) continue; est.total++;
      const x = L.cx[i], y = L.cy[i], z = L.cz[i], r = L.r[i] + margem, dx = x - cp.x, dy = y - cp.y, dz = z - cp.z, d2 = dx * dx + dy * dy + dz * dz;
      if (d2 > (DIST_MAX + r) * (DIST_MAX + r)) continue;
      const ve = dentro(x, y, z, r);
      let sv = ve;                                                                  // a sombra dela cai dentro do quadro?
      if (!sv && ly) {
        const fim = Math.min(Math.max(0, (y + 0.4) / ly), alcance);
        for (let f = 0.25; f <= 1.001 && !sv; f += 0.25) { const s = fim * f; sv = dentro(x - LUZ.x * s, y - LUZ.y * s, z - LUZ.z * s, r); }
      }
      if (!sv) continue;
      const px = x - alvo.x, py = y - alvo.y, pz = z - alvo.z;                      // cai na janela do mapa de sombra?
      const noMapa = Math.abs(px * U.x + py * U.y + pz * U.z) < JANELA_SOMBRA + r && Math.abs(px * W.x + py * W.y + pz * W.z) < JANELA_SOMBRA + r;
      if (noMapa) { modo[i] = 1; est.sombra++; }
      else if (ve) { const longe = tem_l && Math.sqrt(d2) - 0.5 * r > DIST_LOD; modo[i] = longe ? 3 : 2; if (longe) est.longe++; else est.perto++; }
    }
    for (const [lista, m] of [[L.c, 1], [L.m, 2], [L.l, 3]]) for (const P of lista) {
      const arr = P.im.instanceMatrix.array, todas = P.todas; let k = 0;
      for (let i = 0; i < L.N; i++) if (modo[i] === m) { arr.set(todas.subarray(i * 16, i * 16 + 16), k * 16); k++; }
      P.im.count = k; P.im.instanceMatrix.needsUpdate = true;
    }
  }
}
