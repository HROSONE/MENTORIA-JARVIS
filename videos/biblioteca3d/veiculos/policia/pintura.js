// PINTURA da viatura: texturas desenhadas em canvas (projeção planar nos três eixos, "triplanar") e o material de pintura automotiva.
// A casca (carroceria + cabine) usa UM material: a cor, a rugosidade, o relevo (frestas dos painéis) e os recortes (janelas, grade, faróis) saem destas texturas.
//   LADO  (4096x2048): metade de cima = lado do motorista (+x), metade de baixo = lado direito (-x); u = distância do nariz (invertida no lado direito), v = altura
//   TOPO  (1024x2048): capô, teto, porta-malas visto de cima (x, d)
//   FT    (2048x1024): metade esquerda = frente (x, y), metade direita = traseira (x, y)
// Cada projeção tem COR (RGBA: o alfa < 0,5 abre um buraco) e DADO (R = relevo, G = rugosidade, B = metal).
import * as THREE from 'three';
import { M, ZN, ZF, ZT, YE, RARCO, XPORAO } from './forma.js';
import { FRENTE } from './frente.js';

export const TEX = { LW: 4096, LH: 2048, TW: 1024, TH: 2048, FW: 2048, FH: 1024, YMAX: 1.5, XMAX: 1.1 };
const L = M.L;

/** converte (lado, d, y) em pixels do atlas LADO. lado: +1 = motorista (x>0), -1 = direito */
export function pxLado(lado, d, y) {
  const u = lado > 0 ? d / L : (L - d) / L, v = 1 - y / TEX.YMAX;
  return [u * TEX.LW, (lado > 0 ? 0 : TEX.LH / 2) + v * (TEX.LH / 2)];
}
export function pxTopo(x, d) { return [(TEX.XMAX - x) / (2 * TEX.XMAX) * TEX.TW, d / L * TEX.TH]; }
/** frente (frente = true): vista de frente, +x à direita do observador; traseira: vista de trás, +x à esquerda */
export function pxFT(frente, x, y) {
  const u = frente ? (x + TEX.XMAX) / (2 * TEX.XMAX) : (TEX.XMAX - x) / (2 * TEX.XMAX), v = 1 - y / TEX.YMAX;
  return [(frente ? 0 : TEX.FW / 2) + u * (TEX.FW / 2), v * TEX.FH];
}
const mmLado = TEX.LW / L;              // pixels por metro no atlas lado
const mmTopo = TEX.TW / (2 * TEX.XMAX);
const mmFT = (TEX.FW / 2) / (2 * TEX.XMAX);

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function textura(c, cor) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = cor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.flipY = true; t.needsUpdate = true; return t;
}

/** Pincel: reúne os dois canvases (cor e dado) de uma projeção e as primitivas de desenho em coordenadas físicas. */
function criarPincel(w, h, corBase, rugosidade) {
  const C = canvas(w, h), D = canvas(w, h), c = C.getContext('2d'), d = D.getContext('2d');
  c.fillStyle = corBase; c.fillRect(0, 0, w, h);
  d.fillStyle = `rgb(128,${Math.round(rugosidade * 255)},0)`; d.fillRect(0, 0, w, h);
  return { C, D, c, d, w, h };
}
const rgb = (r, g, b) => `rgb(${r},${g},${b})`;

/** Desenha polilinha/polígono em pixels nos dois canvases. `dado` = [r, g, b] ou null (não mexe no dado). */
function traco(P, pts, { cor = null, dado = null, largura = 3, fechar = false, preencher = false, buraco = false, cap = 'round' }) {
  const caminho = ctx => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); if (fechar) ctx.closePath(); };
  if (buraco) {                                                                                           // abre um buraco na cor (alfa 0)
    P.c.save(); P.c.globalCompositeOperation = 'destination-out'; caminho(P.c); P.c.fillStyle = '#000'; P.c.fill(); P.c.restore(); return;
  }
  if (cor) { P.c.save(); caminho(P.c); if (preencher) { P.c.fillStyle = cor; P.c.fill(); } else { P.c.strokeStyle = cor; P.c.lineWidth = largura; P.c.lineJoin = 'round'; P.c.lineCap = cap; P.c.stroke(); } P.c.restore(); }
  if (dado) { P.d.save(); caminho(P.d); const s = rgb(...dado); if (preencher) { P.d.fillStyle = s; P.d.fill(); } else { P.d.strokeStyle = s; P.d.lineWidth = largura; P.d.lineJoin = 'round'; P.d.lineCap = cap; P.d.stroke(); } P.d.restore(); }
}

// ------------------------------------------------------------------------------------------------ desenho do LADO (portas, janelas, fresta, grafismo)
// Todos os pontos em (d, y) = (distância do nariz, altura), em metros.
export const LAYOUT = {
  // fresta do paralama dianteiro com a porta, entre a porta da frente e a de trás, porta de trás e painel traseiro (ref. fotos de perfil: Miami, Cocoa Beach, Bahrain)
  frestaPD: 1.745, frestaB: 2.905, frestaPT: 3.780,
  cintura: 0.998, soleira: 0.215,
  // janelas laterais: (d, y). Janela da frente: borda dianteira inclinada (coluna A), borda traseira vertical (coluna B)
  janFrente: [[1.775, 1.003], [2.862, 1.003], [2.862, 1.372], [2.530, 1.392], [2.350, 1.362], [2.150, 1.215], [1.775, 1.003]],
  janTras: [[2.948, 1.003], [3.662, 1.003], [3.660, 1.085], [3.560, 1.250], [3.440, 1.352], [3.200, 1.392], [2.948, 1.392]],
};

function lado(P, s, opc) {                                                                                  // s = +1 (motorista) ou -1 (direito)
  const px = (d, y) => pxLado(s, d, y), pts = A => A.map(([d, y]) => px(d, y));
  const mm = v => v * mmLado;
  const cor0 = opc.corGrade || '#101010';
  // janelas: moldura (vedação preta) por baixo, buraco por cima
  for (const j of [LAYOUT.janFrente, LAYOUT.janTras]) traco(P, pts(j), { cor: '#0b0b0c', largura: mm(0.034), fechar: true });
  // frestas dos painéis (linhas escuras + sulco no relevo)
  const sulco = (A, larg = 0.0045, esc = 0.78) => { traco(P, pts(A), { cor: `rgba(8,8,10,${esc})`, dado: [20, 120, 0], largura: mm(larg) }); };
  const { frestaPD: fa, frestaB: fb, frestaPT: fc, cintura: yc, soleira: ys } = LAYOUT;
  sulco([[fa, 0.30], [fa, 0.62], [fa - 0.002, 0.80], [fa + 0.0, 0.93]]);                                        // paralama x porta da frente (de baixo até a cintura)
  sulco([[fa + 0.0, 0.93], [fa + 0.02, 1.000]], 0.005);
  sulco([[fb, ys + 0.02], [fb, yc]], 0.0055);                                                                  // porta da frente x porta de trás
  sulco([[fc, ys + 0.05], [fc, 0.70], [fc + 0.004, 0.86], [fc + 0.02, yc]], 0.005);                           // porta de trás x painel traseiro
  sulco([[fa, ys + 0.045], [fb, ys + 0.03]], 0.0045);                                                          // borda inferior da porta da frente
  sulco([[fb, ys + 0.03], [fc, ys + 0.045]], 0.0045);                                                          // borda inferior da porta de trás
  // linha de cintura (friso) e friso inferior
  traco(P, pts([[fa + 0.02, yc - 0.012], [fc + 0.01, yc - 0.012]]), { cor: 'rgba(0,0,0,0.30)', dado: [95, 120, 0], largura: mm(0.004) });
  traco(P, pts([[2.853, 0.985], [2.957, 0.985], [2.957, 1.43], [2.853, 1.43]]), { cor: '#0b0b0c', preencher: true });                       // coluna B preta
  if (s > 0) {                                                                                            // tampa do tanque no paralama traseiro do motorista
    const c = []; for (let i = 0; i <= 28; i++) { const a = (i / 28) * Math.PI * 2; c.push([4.075 + Math.cos(a) * 0.058, 0.868 + Math.sin(a) * 0.066]); }
    traco(P, pts(c), { cor: 'rgba(8,8,10,0.7)', dado: [30, 120, 0], largura: mm(0.0035), fechar: true });
  }
  // maçanetas (rebaixos escuros)
  for (const [d0, d1] of [[2.42, 2.60], [3.30, 3.48]]) { traco(P, pts([[d0, 0.915], [d1, 0.915]]), { cor: '#14161a', dado: [64, 150, 255], largura: mm(0.028) }); }
}

// ------------------------------------------------------------------------------------------------ desenho do TOPO (capô, porta-malas, teto)
function topo(P, opc) {
  const px = (x, d) => pxTopo(x, d), pts = A => A.map(([x, d]) => px(x, d)), mm = v => v * mmTopo;
  const sulco = (A, larg = 0.0045) => traco(P, pts(A), { cor: 'rgba(8,8,10,0.78)', dado: [20, 120, 0], largura: mm(larg) });
  // capô: contorno
  const x0 = 0.725;
  sulco([[x0, 1.745], [x0 + 0.01, 1.2], [x0 + 0.015, 0.7], [x0 + 0.01, 0.30], [0.60, 0.145], [0.45, 0.115], [-0.45, 0.115], [-0.60, 0.145], [-x0 - 0.01, 0.30], [-x0 - 0.015, 0.7], [-x0 - 0.01, 1.2], [-x0, 1.745], [x0, 1.745]]);
  // molduras pretas (vedação) do para-brisa e do vidro traseiro
  for (const k of Object.keys(VIDRO_TOPO)) traco(P, pts(VIDRO_TOPO[k]), { cor: '#0b0b0c', largura: mm(0.034), fechar: true });
  // tampa do porta-malas
  const t0 = 0.80;
  sulco([[t0, 4.215], [t0 + 0.02, 4.55], [t0 + 0.0, 5.03], [0.60, 5.20], [0.4, 5.27], [-0.4, 5.27], [-0.60, 5.20], [-t0, 5.03], [-t0 - 0.02, 4.55], [-t0, 4.215], [t0, 4.215]]);
}

// ------------------------------------------------------------------------------------------------ desenho da FRENTE e da TRASEIRA
function frenteTras(P, opc) {
  const pf = A => A.map(([x, y]) => pxFT(true, x, y)), pt = A => A.map(([x, y]) => pxFT(false, x, y)), mm = v => v * mmFT;
  const sulco = (px, A, larg = 0.0045, esc = 0.78) => traco(P, px(A), { cor: `rgba(8,8,10,${esc})`, dado: [20, 120, 0], largura: mm(larg) });
  // frente: linha da borda dianteira do capô, junta da capa do para-choque e friso de proteção
  sulco(pf, [[-0.93, 0.845], [-0.60, 0.842], [0.60, 0.842], [0.93, 0.845]]);
  sulco(pf, [[-0.95, 0.598], [-0.45, 0.602], [-0.40, 0.6], [0.40, 0.6], [0.45, 0.602], [0.95, 0.598]], 0.0042);
  sulco(pf, [[-0.95, 0.520], [0.95, 0.520]], 0.006, 0.5);
  // traseira: junta da tampa do porta-malas com o para-choque e friso de proteção
  sulco(pt, [[-0.90, 0.640], [-0.45, 0.646], [0.45, 0.646], [0.90, 0.640]], 0.0045);
  sulco(pt, [[-0.92, 0.545], [0.92, 0.545]], 0.006, 0.5);
  void opc;
}

// para-brisa e vidro traseiro vistos de cima (x, d): a inclinação deles (27° e 38°) faz a projeção dominante ser a de cima
export const VIDRO_TOPO = {
  parabrisa: [[-0.775, 1.800], [0.775, 1.800], [0.668, 2.455], [0.612, 2.535], [-0.612, 2.535], [-0.668, 2.455]],
  traseiro: [[-0.725, 4.105], [0.725, 4.105], [0.628, 3.870], [0.566, 3.775], [-0.566, 3.775], [-0.628, 3.870]],
};

/** recortes (buracos) são feitos depois dos riscos, para a moldura preta ficar só do lado de fora */
function recortes(PL, PT, PF, opc) {
  for (const s of [1, -1]) for (const j of [LAYOUT.janFrente, LAYOUT.janTras]) traco(PL, j.map(([d, y]) => pxLado(s, d, y)), { buraco: true, fechar: true });
  for (const k of Object.keys(VIDRO_TOPO)) traco(PT, VIDRO_TOPO[k].map(([x, d]) => pxTopo(x, d)), { buraco: true, fechar: true });
  const pf = A => A.map(([x, y]) => pxFT(true, x, y));
  traco(PF, pf(FRENTE.grade), { buraco: true, fechar: true });                                          // grade
  for (const s of [1, -1]) { traco(PF, pf(FRENTE.farol(s)), { buraco: true, fechar: true }); traco(PF, pf(FRENTE.entrada(s)), { buraco: true, fechar: true }); }
  void opc;
}


// ------------------------------------------------------------------------------------------------ pintura de polícia (grafismo)
export const LIVERIES = {
  'preto-branco': { base: '#0e0f12', porta: '#f3f3f1', texto: '#0b0c0e', faixa: null, detalhe: '#c9a43a' },
  'branco-azul': { base: '#f1f2f3', porta: null, texto: '#17327f', faixa: '#1b3c92', detalhe: '#d6a928' },
  'branco': { base: '#f1f2f3', porta: null, texto: '#17327f', faixa: null, detalhe: '#17327f' },
};
const FONTE = `'Arial Black', 'Liberation Sans', 'DejaVu Sans', Arial, sans-serif`;

function textoLado(P, s, d0, d1, y, str, cor, altura, peso = 800) {                                    // texto centrado entre d0 e d1 (lê certo nos dois lados)
  const [a, b] = pxLado(s, d0, y), [a2] = pxLado(s, d1, y), cx = (a + a2) / 2, px = altura * mmLado;
  P.c.save(); P.c.fillStyle = cor; P.c.textAlign = 'center'; P.c.textBaseline = 'alphabetic'; P.c.font = `${peso} ${px / 0.72}px ${FONTE}`;
  const larg = Math.abs(a2 - a); let sz = px / 0.72; P.c.font = `${peso} ${sz}px ${FONTE}`; const w = P.c.measureText(str).width; if (w > larg) { sz *= larg / w; P.c.font = `${peso} ${sz}px ${FONTE}`; }
  P.c.fillText(str, cx, b); P.c.restore();
}
function estrela(c, cx, cy, r, cor) {
  c.save(); c.fillStyle = cor; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } c.closePath(); c.fill(); c.restore();
}
function distintivo(P, s, d, y, r, L) {                                                                // escudo com estrela
  const [px, py] = pxLado(s, d, y), R = r * mmLado, c = P.c;
  c.save(); c.translate(px, py);
  c.fillStyle = L.detalhe; c.beginPath(); c.moveTo(0, -R * 1.12); c.quadraticCurveTo(R * 0.95, -R * 0.95, R * 0.95, -R * 0.2); c.quadraticCurveTo(R * 0.8, R * 0.75, 0, R * 1.18); c.quadraticCurveTo(-R * 0.8, R * 0.75, -R * 0.95, -R * 0.2); c.quadraticCurveTo(-R * 0.95, -R * 0.95, 0, -R * 1.12); c.fill();
  c.fillStyle = '#16275f'; c.beginPath(); c.moveTo(0, -R * 0.95); c.quadraticCurveTo(R * 0.78, -R * 0.8, R * 0.78, -R * 0.2); c.quadraticCurveTo(R * 0.66, R * 0.62, 0, R * 1.0); c.quadraticCurveTo(-R * 0.66, R * 0.62, -R * 0.78, -R * 0.2); c.quadraticCurveTo(-R * 0.78, -R * 0.8, 0, -R * 0.95); c.fill();
  estrela(c, 0, -R * 0.05, R * 0.55, L.detalhe); c.restore();
}
function grafismoLado(P, s, L, opc) {
  const { frestaPD: fa, frestaB: fb, frestaPT: fc, cintura: yc } = LAYOUT, pts = A => A.map(([d, y]) => pxLado(s, d, y));
  if (L.porta) {                                                                                       // portas brancas (carroceria preta)
    traco(P, pts([[fa + 0.004, 0.236], [fb - 0.003, 0.230], [fb - 0.003, yc - 0.004], [fa + 0.006, yc - 0.004], [fa + 0.002, 0.60]]), { cor: L.porta, preencher: true });
    traco(P, pts([[fb + 0.003, 0.230], [fc - 0.004, 0.238], [fc - 0.002, 0.60], [fc + 0.016, yc - 0.004], [fb + 0.003, yc - 0.004]]), { cor: L.porta, preencher: true });
  }
  if (L.faixa) {                                                                                       // faixa azul com filete dourado
    const faixa = (y0, y1, cor) => traco(P, pts([[0.50, y0 + 0.02], [fa, y0 + 0.005], [fc + 0.05, y0 - 0.02], [4.35, y0 + 0.05], [4.35, y1 + 0.05], [fc + 0.05, y1 - 0.02], [fa, y1 + 0.005], [0.50, y1 + 0.02]]), { cor, preencher: true });
    faixa(0.455, 0.565, L.faixa); faixa(0.425, 0.447, L.detalhe);
  }
  textoLado(P, s, fa + 0.20, fb - 0.12, 0.690, 'POLICE', L.texto, 0.115);
  textoLado(P, s, fa + 0.26, fb - 0.20, 0.625, opc.cidade || 'HRYZ CITY', L.texto, 0.042, 700);
  distintivo(P, s, fc - 0.30, 0.70, 0.095, L);
  textoLado(P, s, fb + 0.10, fc - 0.40, 0.335, opc.numero || '117', L.texto, 0.075, 800);
}
function grafismoTopo(P, L, opc) {
  const mm = v => v * mmTopo, c = P.c;
  const texto = (x, d, str, alt, cor, rot = 0) => { const [px, py] = pxTopo(x, d); c.save(); c.translate(px, py); c.rotate(rot); c.fillStyle = cor; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `800 ${mm(alt)}px ${FONTE}`; c.fillText(str, 0, 0); c.restore(); };
  texto(0, 4.62, 'POLICE', 0.21, L.porta ? '#f3f3f1' : L.texto);                                       // tampa do porta-malas, lê de trás
  texto(0, 3.17, opc.numero || '117', 0.36, L.porta ? '#f3f3f1' : L.texto);                           // número da unidade no teto
}

/** Cria as texturas e o material. opc: { livery: 'preto-branco' | 'branco-azul' | 'branco', numero, cidade, placa } */
export function criarPintura(opc = {}) {
  const L = LIVERIES[opc.livery || 'preto-branco'] || LIVERIES['preto-branco'], corBase = opc.corBase || L.base, rug = opc.rugosidade ?? 0.22;
  const PL = criarPincel(TEX.LW, TEX.LH, corBase, rug), PT = criarPincel(TEX.TW, TEX.TH, corBase, rug), PF = criarPincel(TEX.FW, TEX.FH, corBase, rug);
  for (const s of [1, -1]) grafismoLado(PL, s, L, opc);
  grafismoTopo(PT, L, opc);
  lado(PL, 1, opc); lado(PL, -1, opc); topo(PT, opc); frenteTras(PF, opc);
  recortes(PL, PT, PF, opc);
  const tex = { sc: textura(PL.C, true), sd: textura(PL.D, false), tc: textura(PT.C, true), td: textura(PT.D, false), fc: textura(PF.C, true), fd: textura(PF.D, false) };
  const mat = materialPintura(tex, opc);
  return { material: mat, tex, canvases: { PL, PT, PF }, livery: L };
}

// ------------------------------------------------------------------------------------------------ material
const GLSL_PARS = `
varying vec3 vOP; varying vec3 vON;
uniform sampler2D tSC; uniform sampler2D tSD; uniform sampler2D tTC; uniform sampler2D tTD; uniform sampler2D tFC; uniform sampler2D tFD;
uniform vec3 uCorInterior;
const float K_L = ${L.toFixed(4)}; const float K_ZN = ${ZN.toFixed(4)}; const float K_YMAX = ${TEX.YMAX.toFixed(3)}; const float K_XMAX = ${TEX.XMAX.toFixed(3)};
const float K_ZF = ${ZF.toFixed(4)}; const float K_ZT = ${ZT.toFixed(4)}; const float K_YE = ${YE.toFixed(4)}; const float K_RARCO = ${RARCO.toFixed(4)}; const float K_XPORAO = ${XPORAO.toFixed(4)};
uniform float uBump; uniform float uSujeira;
float h31(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float rv(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y), mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
struct TriMat { vec4 cor; vec3 dado; float peso; };
TriMat triplanar(vec3 p, vec3 n) {
  float d = K_ZN - p.z;
  vec3 w = vec3(pow(abs(n.x), 8.0), pow(max(n.y, 0.0), 8.0), pow(abs(n.z), 8.0));
  w /= (w.x + w.y + w.z + 1e-5);
  // lado: u = d/L (motorista, +x) ou (L-d)/L (direito, -x); v = 0.5 + 0.5*y/ymax (motorista) ou 0.5*y/ymax (direito)
  float sd = p.x >= 0.0 ? 1.0 : 0.0;
  vec2 uvS = vec2(sd > 0.5 ? d / K_L : (K_L - d) / K_L, (sd > 0.5 ? 0.5 : 0.0) + 0.5 * clamp(p.y / K_YMAX, 0.0, 1.0));
  vec2 uvT = vec2((K_XMAX - p.x) / (2.0 * K_XMAX), 1.0 - d / K_L);
  float fr = n.z >= 0.0 ? 1.0 : 0.0;
  vec2 uvF = vec2((fr > 0.5 ? (p.x + K_XMAX) / (2.0 * K_XMAX) : (K_XMAX - p.x) / (2.0 * K_XMAX)) * 0.5 + (fr > 0.5 ? 0.0 : 0.5), clamp(p.y / K_YMAX, 0.0, 1.0));
  vec4 cS = texture2D(tSC, uvS), cT = texture2D(tTC, uvT), cF = texture2D(tFC, uvF);
  vec3 dS = texture2D(tSD, uvS).rgb, dT = texture2D(tTD, uvT).rgb, dF = texture2D(tFD, uvF).rgb;
  TriMat r;
  r.cor = vec4(cS.rgb * w.x + cT.rgb * w.y + cF.rgb * w.z, cS.a * w.x + cT.a * w.y + cF.a * w.z);
  r.dado = dS * w.x + dT * w.y + dF * w.z;
  r.peso = 1.0;
  return r;
}
`;

function materialPintura(tex, opc) {
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.035, side: THREE.DoubleSide, envMapIntensity: opc.envMapIntensity ?? 1.0 });
  mat.userData.uniformes = { tSC: { value: tex.sc }, tSD: { value: tex.sd }, tTC: { value: tex.tc }, tTD: { value: tex.td }, tFC: { value: tex.fc }, tFD: { value: tex.fd }, uCorInterior: { value: new THREE.Color(0.20, 0.20, 0.21) }, uBump: { value: opc.relevo ?? 0.9 }, uSujeira: { value: opc.sujeira ?? 0.5 } };
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, mat.userData.uniformes);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP; varying vec3 vON;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP = position; vON = normal;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + GLSL_PARS)
      .replace('#include <map_fragment>', `
        vec3 nO = normalize(vON); TriMat tri = triplanar(vOP, nO);
        if (tri.cor.a < 0.5) discard;
        for (int ia = 0; ia < 2; ia++) { float zc = ia == 0 ? K_ZF : K_ZT; vec2 qa = vec2(vOP.z - zc, vOP.y - K_YE); if (abs(vOP.x) > K_XPORAO && dot(qa, qa) < K_RARCO * K_RARCO) discard; }
        diffuseColor.rgb *= tri.cor.rgb;
        bool inferior = nO.y < -0.8;
        bool dentro = !gl_FrontFacing;
        float suj = 0.0;
        if (uSujeira > 0.0) { float baixo = 1.0 - smoothstep(0.22, 0.70, vOP.y); float r1 = rv(vOP * vec3(9.0, 22.0, 9.0)) * 0.6 + rv(vOP * 46.0) * 0.4; suj = clamp(baixo * (0.25 + 1.1 * r1) * uSujeira + 0.07 * uSujeira * rv(vOP * 5.0), 0.0, 1.0); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.20, 0.17, 0.13) * 0.55 + diffuseColor.rgb * 0.18, suj * 0.62); }
        if (inferior) diffuseColor.rgb = vec3(0.045);
        if (dentro) diffuseColor.rgb = (vOP.y > 0.95) ? uCorInterior * 1.4 : uCorInterior * 0.16;`)
      .replace('#include <roughnessmap_fragment>', `float roughnessFactor = roughness; roughnessFactor = (inferior || dentro) ? 0.9 : clamp(tri.dado.g + suj * 0.45, 0.0, 1.0);`)
      .replace('#include <metalnessmap_fragment>', `float metalnessFactor = (inferior || dentro) ? 0.0 : tri.dado.b;`)
      .replace('#include <normal_fragment_maps>', `
        #include <normal_fragment_maps>
        { float h = tri.dado.r * uBump; vec2 dH = vec2(dFdx(h), dFdy(h));
          vec3 sx = normalize(dFdx(-vViewPosition)), sy = normalize(dFdy(-vViewPosition)); vec3 R1 = cross(sy, normal), R2 = cross(normal, sx); float det = dot(sx, R1) * faceDirection;
          vec3 g = sign(det) * (dH.x * R1 + dH.y * R2); normal = normalize(abs(det) * normal - g); }`)
      .replace('#include <lights_physical_fragment>', `#include <lights_physical_fragment>
        #ifdef USE_CLEARCOAT
          material.clearcoat *= (1.0 - smoothstep(0.5, 0.65, roughnessFactor));
        #endif`);
  };
  mat.customProgramCacheKey = () => 'viaturaPintura';
  return mat;
}
