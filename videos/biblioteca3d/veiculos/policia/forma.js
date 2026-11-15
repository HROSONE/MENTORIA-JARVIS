// FORMA do Ford Crown Victoria Police Interceptor (P71, 2006-2011): perfis, seções e malhas por estações.
// Convenções do kit de veículos: metros, Y para cima, frente em +Z, X positivo = lado do motorista (esquerda), origem no meio do comprimento, rodas apoiadas em y = 0.
// "d" é a distância medida a partir do nariz (d = 0 no para-choque dianteiro, d = L no traseiro); z = ZN - d.
//
// Medidas oficiais (Ford 2006-2011, folha técnica do P71): comprimento 5,385 m (212,0 in), largura 1,989 m (78,3 in, sem retrovisores),
// altura 1,443 m (56,8 in), entre-eixos 2,914 m (114,7 in), bitola 1,595 m (frente) / 1,608 m (trás), pneu P235/55R17 (diâmetro 0,690 m).
import * as THREE from 'three';

export const M = { L: 5.385, W: 1.989, H: 1.443, EE: 2.914, BF: 0.970, RP: 0.345, RARO: 0.2159, BITOLA: 1.60, LP: 0.235 };
export const ZN = M.L / 2;               // z do nariz (a frente é +z)
export const ZF = ZN - M.BF;             // eixo dianteiro
export const ZT = ZF - M.EE;             // eixo traseiro
export const YE = M.RP;                  // altura do centro das rodas
export const RARCO = 0.418;              // raio do vão da roda (arco do paralama)
export const XPORAO = 0.575;             // parede interna do vão da roda
export const D_COWL = 1.74;              // base do para-brisa e fresta paralama/porta (distância do nariz; medida nas fotos de perfil)
export const D_BASE_TRAS = 4.17;         // base do vidro traseiro (encontro com a tampa do porta-malas)
export const Y_CINTURA = 0.998;          // altura da linha de cintura (base dos vidros)

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const suave = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/** interpolação cúbica monótona por pontos [[x, y], ...] (sem sobressinal) */
export function pchip(P) {
  const n = P.length, h = [], d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) { h[i] = P[i + 1][0] - P[i][0]; d[i] = (P[i + 1][1] - P[i][1]) / h[i]; }
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
  }
  return x => {
    if (x <= P[0][0]) return P[0][1]; if (x >= P[n - 1][0]) return P[n - 1][1];
    let i = 0; while (x > P[i + 1][0]) i++;
    const t = (x - P[i][0]) / h[i], t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * P[i][1] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * P[i + 1][1] + (t3 - t2) * h[i] * m[i + 1];
  };
}

// ------------------------------------------------------------------------------------------------ perfis da carroceria inferior (d = distância do nariz)
export const TOPO = pchip([[0, 0.835], [0.06, 0.862], [0.30, 0.885], [0.80, 0.915], [1.20, 0.945], [1.50, 0.975], [1.68, 0.994], [D_COWL, Y_CINTURA],
  [2.40, Y_CINTURA], [4.10, 1.000], [D_BASE_TRAS, 1.008], [4.27, 1.034], [4.70, 1.052], [5.05, 1.050], [5.25, 1.042], [5.385, 1.000]]);       // altura do topo no eixo (capô, cintura, tampa do porta-malas)
export const FUNDO = pchip([[0, 0.300], [0.15, 0.285], [0.40, 0.235], [0.80, 0.195], [1.2, 0.175], [1.6, 0.170], [4.2, 0.170], [4.7, 0.200], [5.1, 0.260], [5.385, 0.31]]);
export const WLADO = pchip([[0, 0.94], [0.5, 0.972], [1.0, 0.987], [1.6, 0.9915], [3.9, 0.9915], [4.5, 0.982], [5.0, 0.957], [5.385, 0.90]]);   // meia-largura máxima
export const CROWN = pchip([[0, 0.015], [0.5, 0.03], [1.2, 0.035], [D_COWL - 0.25, 0.022], [D_COWL, 0.008], [D_COWL + 0.1, 0.0], [D_BASE_TRAS - 0.1, 0.0], [D_BASE_TRAS + 0.05, 0.025], [4.8, 0.022], [5.385, 0.012]]);                   // queda do centro até o início do ombro                   // queda do centro até o início do ombro                   // queda do centro até o início do ombro // queda do centro até o início do ombro
export const RT = pchip([[0, 0.05], [0.4, 0.055], [1.0, 0.06], [D_COWL - 0.25, 0.055], [D_COWL, 0.04], [D_COWL + 0.15, 0.04], [D_BASE_TRAS - 0.1, 0.04], [D_BASE_TRAS + 0.1, 0.07], [4.8, 0.08], [5.385, 0.08]]);   // raio do ombro   // raio do ombro   // raio do ombro  // raio do ombro
export const TT = pchip([[0, 0.02], [D_COWL - 0.3, 0.02], [D_COWL, 0.03], [D_COWL + 0.15, 0.03], [D_BASE_TRAS - 0.1, 0.03], [D_BASE_TRAS + 0.1, 0.035], [5.385, 0.04]]);                                       // recuo do ombro (tumblehome)                                       // recuo do ombro (tumblehome)                                          // recuo do ombro (tumblehome)
const TB = 0.07;                                                                                                                                 // recuo da soleira
const RB = 0.11;                                                                                                                                 // raio da quina inferior
// plano: fator de largura nas pontas (superelipse): frente quase reta com cantos arredondados, traseira mais fechada
const CF = 0.44, NF = 3.4, CT = 0.50, NT = 3.4;
export function fatorPlano(d) {
  const f = (e, n) => Math.pow(Math.max(0, 1 - Math.pow(1 - clamp(e), n)), 1 / n);
  if (d < CF) return f(d / CF, NF);
  if (d > M.L - CT) return f((M.L - d) / CT, NT);
  return 1;
}
// perfil lateral do nariz e da traseira: deslocamento de d conforme a altura (para-choque projetado, capô recuado, spoiler sob o para-choque)
const NARIZ = pchip([[0.28, 0.075], [0.34, 0.035], [0.40, 0.012], [0.47, 0.0], [0.60, 0.0], [0.70, 0.04], [0.78, 0.09], [0.86, 0.15]]);
const POPA = pchip([[0.17, 0.15], [0.30, 0.10], [0.40, 0.03], [0.50, 0.0], [0.65, 0.0], [0.85, 0.03], [1.0, 0.10], [1.06, 0.14]]);
const FN = d => 1 - suave(0.0, 0.62, d), FT = d => 1 - suave(0.0, 0.62, M.L - d);
export function deslocaD(d, y) { return d + NARIZ(y) * FN(d) - POPA(y) * FT(d); }

// ------------------------------------------------------------------------------------------------ seção transversal da carroceria (meia, x >= 0, do centro embaixo até o centro em cima)
export const NSEC = { fundo: 7, canto: 7, parede: 15, ombro: 9, topo: 13 };                      // pontos por trecho (topologia fixa em todas as estações)
export const NMEIA = NSEC.fundo + NSEC.canto + NSEC.parede + NSEC.ombro + NSEC.topo + 1;
export const K_TOPO0 = NSEC.fundo + NSEC.canto + NSEC.parede + NSEC.ombro;                      // índice onde começa o trecho do topo (primeiro ponto = fim do ombro)
export function meiaSecao(d) {
  const W = WLADO(d) * fatorPlano(d), yb = FUNDO(d), yt = Math.max(TOPO(d), yb + 0.3), cr = CROWN(d);
  const rt = Math.min(RT(d), W * 0.45), tt = Math.min(TT(d), W * 0.2), rb = Math.min(RB, W * 0.35), tb = Math.min(TB, W * 0.25);
  const P = [], xf = Math.max(W - tb - rb, 0);
  for (let i = 0; i < NSEC.fundo; i++) P.push([lerp(0, xf, i / NSEC.fundo), yb]);                                                   // fundo plano
  for (let i = 0; i < NSEC.canto; i++) { const a = (i / NSEC.canto) * Math.PI / 2; P.push([xf + rb * Math.sin(a), yb + rb * (1 - Math.cos(a))]); }   // quina inferior
  const x0 = xf + rb, y0 = yb + rb, x1 = W - tt, ys1 = yt - cr - rt, cx = x1 - rt;
  for (let i = 0; i < NSEC.parede; i++) {                                                                                          // parede convexa: largura máxima W no meio
    const u = i / NSEC.parede, extra = (W - (x0 + x1) / 2) * 4 * u * (1 - u);
    P.push([lerp(x0, x1, u) + Math.max(extra, 0), lerp(y0, ys1, u)]);
  }
  let thE = Math.PI / 2, xe = 0, ye = 0;
  for (let it = 0; it < 4; it++) {                                                                                                  // o arco do ombro termina tangente à curva do topo
    xe = cx + rt * Math.cos(thE); ye = ys1 + rt * Math.sin(thE);
    const s = 2 * Math.max(yt - ye, 0) / Math.max(xe, 0.05); thE = Math.atan(1 / Math.max(s, 1e-3));
  }
  xe = Math.max(cx + rt * Math.cos(thE), 0); ye = ys1 + rt * Math.sin(thE);
  for (let i = 0; i < NSEC.ombro; i++) { const th = (i / NSEC.ombro) * thE; P.push([cx + rt * Math.cos(th), ys1 + rt * Math.sin(th)]); }
  for (let i = 0; i <= NSEC.topo; i++) { const x = xe * (1 - i / NSEC.topo); P.push([x, yt - (yt - ye) * (xe > 1e-4 ? (x / xe) ** 2 : 0)]); }
  return P;
}

// ------------------------------------------------------------------------------------------------ estações
export function estacoesCorpo() {
  const L = M.L, e = [0, 0.004, 0.012, 0.025, 0.045, 0.07, 0.10, 0.14, 0.19, 0.25, 0.32, 0.40, 0.50, 0.62, 0.76, 0.90];
  const S = new Set(e); e.forEach(d => S.add(+(L - d).toFixed(4)));
  for (let d = 0.95; d < L - 0.9; d += 0.075) S.add(+d.toFixed(4));
  S.add(D_COWL); S.add(D_BASE_TRAS); S.add(M.BF); S.add(+(M.BF + M.EE).toFixed(4));                                                  // estações exatas no cowl, na base do vidro traseiro e nos eixos
  return [...S].sort((a, b) => a - b);
}

/** monta a geometria por estações: aneis[i] = lista [x, y] de um anel fechado; devolve BufferGeometry + índices */
function geometriaDeAneis(ds, aneis, { fechado, pular = null, ajustaZ = null }) {
  const S = ds.length, R = aneis[0].length, pos = new Float32Array(S * R * 3), idx = [];
  for (let i = 0; i < S; i++) for (let k = 0; k < R; k++) {
    const [x, y] = aneis[i][k], z = ajustaZ ? ZN - ajustaZ(ds[i], y) : ZN - ds[i], o = (i * R + k) * 3;
    pos[o] = x; pos[o + 1] = y; pos[o + 2] = z;
  }
  const nSeg = fechado ? R : R - 1;
  for (let i = 0; i < S - 1; i++) for (let k = 0; k < nSeg; k++) {
    if (pular && pular(i, k)) continue;
    const a = i * R + k, b = i * R + (k + 1) % R, c = (i + 1) * R + k, d = (i + 1) * R + (k + 1) % R;
    idx.push(a, c, b, b, c, d);                                                                                                  // sentido anti-horário visto de fora
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  return g;
}
/** une os vértices coincidentes (costuras no eixo e nas pontas) e calcula normais suaves */
export function normaisSuaves(g, tol = 1e-5) {
  g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal, mapa = new Map(), chave = (i) => Math.round(p.getX(i) / tol) + ',' + Math.round(p.getY(i) / tol) + ',' + Math.round(p.getZ(i) / tol);
  for (let i = 0; i < p.count; i++) { const k = chave(i); let a = mapa.get(k); if (!a) mapa.set(k, a = [0, 0, 0, []]); a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i); a[3].push(i); }
  for (const [, a] of mapa) { const l = Math.hypot(a[0], a[1], a[2]) || 1; for (const i of a[3]) n.setXYZ(i, a[0] / l, a[1] / l, a[2] / l); }
  n.needsUpdate = true; return g;
}

/** anel fechado a partir da meia seção: lado +x de baixo para cima e lado -x de cima para baixo (o centro embaixo é um único vértice) */
function aneilFechado(H) { const n = H.length, R = H.map(p => [p[0], p[1]]); for (let k = n - 2; k >= 1; k--) R.push([-H[k][0], H[k][1]]); return R; }

/** carroceria inferior (capô, para-lamas, portas, porta-malas, para-choques): casca fechada, com o vão da cabine aberto entre o cowl e a base do vidro traseiro */
export function criarCorpoGeo() {
  const ds = estacoesCorpo(), aneis = ds.map(d => aneilFechado(meiaSecao(d))), R = aneis[0].length, WCAB = 0.925;
  const pular = (i, k) => {
    if (ds[i] < D_COWL - 1e-6 || ds[i + 1] > D_BASE_TRAS + 1e-6) return false;                                                    // só no vão entre o cowl e a base do vidro traseiro
    const k2 = (k + 1) % R, A = aneis[i], B = aneis[i + 1];
    return [A[k], A[k2], B[k], B[k2]].every(p => Math.abs(p[0]) < WCAB && p[1] > 0.9);                                            // faces do topo dentro da faixa da cabine
  };
  return normaisSuaves(geometriaDeAneis(ds, aneis, { fechado: true, pular, ajustaZ: deslocaD }));
}

// ------------------------------------------------------------------------------------------------ cabine (teto, colunas, vidros): casca aberta na base
export const YR = pchip([[D_COWL, 0.999], [1.85, 1.048], [1.97, 1.105], [2.10, 1.175], [2.25, 1.250], [2.40, 1.322], [2.52, 1.382], [2.62, 1.418], [2.78, 1.438], [3.0, 1.443], [3.4, 1.443],
  [3.55, 1.436], [3.65, 1.418], [3.78, 1.372], [3.92, 1.295], [4.05, 1.195], [4.12, 1.100], [D_BASE_TRAS, 1.010]]);                       // altura do centro da cabine (para-brisa, teto, vidro traseiro)
export const WBASE = pchip([[D_COWL, 0.925], [2.4, 0.935], [3.4, 0.935], [3.9, 0.930], [D_BASE_TRAS, 0.915]]);                           // meia-largura na base dos vidros (cintura)
export const WTETO = pchip([[D_COWL, 0.925], [1.85, 0.89], [2.00, 0.84], [2.3, 0.79], [2.6, 0.775], [3.0, 0.78], [3.5, 0.78], [3.7, 0.78], [3.9, 0.80], [4.05, 0.84], [D_BASE_TRAS, 0.915]]);  // meia-largura do teto/colunas
export function meiaCabine(d) {
  const yr = YR(d), wb = WBASE(d), wI = WTETO(d), yb = Y_CINTURA, alt = Math.max(yr - yb, 0.002), crR = 0.03 * suave(0, 0.12, alt);
  const yI = yr - crR, lat = Math.hypot(wI - wb, yI - yb), rr = Math.min(0.095, lat * 0.45, wI * 0.5);                               // I = quina viva entre a lateral e o teto; rr = arredondamento
  const P = [], N1 = 12, N2 = 8, N3 = 14, ux = lat > 1e-6 ? (wI - wb) / lat : 0, uy = lat > 1e-6 ? (yI - yb) / lat : 1;
  const Sx = wI - ux * rr, Sy = yI - uy * rr, Ex = wI - rr, Ey = yI;                                                                // início e fim do arredondamento
  for (let i = 0; i <= N1; i++) { const t = i / N1; P.push([lerp(wb, Sx, t) + 0.012 * 4 * t * (1 - t), lerp(yb, Sy, t)]); }          // lateral levemente convexa
  for (let i = 1; i <= N2; i++) { const t = i / N2, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t; P.push([a * Sx + b * wI + c * Ex, a * Sy + b * yI + c * Ey]); }
  for (let i = 1; i <= N3; i++) { const x = Ex * (1 - i / N3); P.push([x, yI + crR * (1 - (Ex > 1e-4 ? (x / Ex) ** 2 : 0))]); }          // teto abaulado até o eixo
  return P;
}
export function estacoesCabine() { const ds = []; for (let d = D_COWL; d < D_BASE_TRAS - 1e-6; d += 0.03) ds.push(+d.toFixed(4)); ds.push(D_BASE_TRAS); return ds; }
export function criarCabineGeo(inset = 0) {
  const ds = estacoesCabine(), aneis = ds.map(d => { const H = meiaCabine(d), n = H.length, R = H.map(p => [p[0], p[1]]); for (let k = n - 2; k >= 0; k--) R.push([-H[k][0], H[k][1]]); return R; });
  const g = geometriaDeAneis(ds, aneis, { fechado: false });
  normaisSuaves(g);
  if (inset) { const p = g.attributes.position, n = g.attributes.normal; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) - n.getX(i) * inset, p.getY(i) - n.getY(i) * inset, p.getZ(i) - n.getZ(i) * inset); p.needsUpdate = true; }
  return g;
}
