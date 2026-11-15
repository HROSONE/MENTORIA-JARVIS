// FRENTE e TRASEIRA do Crown Victoria P71: grade, faróis, entradas de ar, placas, lanternas e emblemas (remendos sobre a carroceria).
// Medidas lidas de fotos de frente/trás (Wikimedia Commons) usando a largura do carro e a placa (0,305 m) como régua; alturas a partir do chão.
import * as THREE from 'three';
import { remendo, canvasMetros, caminho, retArred, texturaDe } from './pecas.js';

// ---- layout (metros) -- compartilhado com a pintura (os mesmos contornos viram buracos na chapa)
export const FRENTE = {
  grade: retArred(-0.405, 0.405, 0.632, 0.806, 0.03),
  farol: s => retArred(s * 0.435, s * 0.868, 0.652, 0.806, 0.028).map(([x, y]) => [x, y]),                // contorno do conjunto (lente transparente + seta âmbar)
  entrada: s => retArred(s * 0.205, s * 0.620, 0.322, 0.402, 0.018),
  placa: retArred(-0.168, 0.168, 0.350, 0.512, 0.012),
};
export const TRASEIRA = {
  lanterna: s => { const P = [[0.330, 0.752], [0.640, 0.746], [0.800, 0.738], [0.880, 0.728], [0.884, 0.80], [0.874, 0.905], [0.84, 0.948], [0.70, 0.965], [0.33, 0.968]]; return P.map(([x, y]) => [s * x, y]); },
  placa: retArred(-0.178, 0.178, 0.668, 0.850, 0.012),
};

function mat(map, extra = {}) { return new THREE.MeshPhysicalMaterial({ map, alphaTest: 0.5, roughness: 0.4, metalness: 0.0, side: THREE.DoubleSide, ...extra }); }

function texGrade() {                                                                                  // grade preta com malha hexagonal e o oval da Ford
  const w = 0.84, h = 0.20, cv = canvasMetros(-0.42, 0.42, 0.625, 0.825, 1200), { g, px } = cv;
  g.fillStyle = '#060607'; g.fillRect(0, 0, cv.c.width, cv.c.height);
  // malha hexagonal
  g.strokeStyle = '#26272a'; g.lineWidth = 2.2; const r = 0.0105;
  for (let j = -2; j < 24; j++) for (let i = -2; i < 90; i++) {
    const cx = -0.42 + i * r * 1.732 + (j % 2 ? r * 0.866 : 0), cy = 0.625 + j * r * 1.5; const [a, b] = px(cx, cy);
    g.beginPath(); for (let k = 0; k < 6; k++) { const an = Math.PI / 6 + k * Math.PI / 3; const X = a + Math.cos(an) * r * 1200 * 0.95, Y = b + Math.sin(an) * r * 1200 * 0.95; k ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.closePath(); g.stroke();
  }
  // moldura (borda) do vão da grade
  caminho(g, px, FRENTE.grade); g.lineWidth = 9; g.strokeStyle = '#0b0b0c'; g.stroke();
  // oval da Ford
  const [ox, oy] = px(0, 0.728); g.save(); g.translate(ox, oy);
  g.fillStyle = '#d7dce2'; g.beginPath(); g.ellipse(0, 0, 0.088 * 1200, 0.038 * 1200, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#12306f'; g.beginPath(); g.ellipse(0, 0, 0.081 * 1200, 0.0325 * 1200, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#eef2f8'; g.font = `italic 700 ${0.040 * 1200}px Georgia, 'Times New Roman', serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Ford', 0, 2);
  g.restore();
  return cv;
}

function texFarol(s) {                                                                                  // s = +1 (motorista) / -1 (direito); cobre x de s*0.425 a s*0.878
  const xa = Math.min(s * 0.425, s * 0.878), xb = Math.max(s * 0.425, s * 0.878), cv = canvasMetros(xa, xb, 0.645, 0.815, 1400), { g, px, c } = cv;
  const inner = Math.abs(0.435), meio = 0.690, fora = 0.868;                                              // |x|: inboard = farol; outboard = seta âmbar
  g.clearRect(0, 0, c.width, c.height);
  const contorno = FRENTE.farol(s); caminho(g, px, contorno); g.save(); g.clip();
  // faixa interna: lente do farol com refletor prateado
  const [a0, b0] = px(s * inner, 0.806), [a1, b1] = px(s * meio, 0.652); const x0 = Math.min(a0, a1), x1 = Math.max(a0, a1);
  let gr = g.createLinearGradient(0, b0, 0, b1); gr.addColorStop(0, '#d9dde2'); gr.addColorStop(0.5, '#8d949c'); gr.addColorStop(1, '#c4c9cf'); g.fillStyle = gr; g.fillRect(x0, b0, x1 - x0, b1 - b0);
  g.fillStyle = 'rgba(60,66,74,0.55)'; g.fillRect(x0 + (x1 - x0) * 0.08, b0 + (b1 - b0) * 0.34, (x1 - x0) * 0.84, (b1 - b0) * 0.32);                                  // barra do refletor
  g.fillStyle = '#eef2f6'; g.fillRect(x0 + (x1 - x0) * 0.30, b0 + (b1 - b0) * 0.42, (x1 - x0) * 0.40, (b1 - b0) * 0.16);                                                       // lâmpada
  g.strokeStyle = 'rgba(40,44,50,0.45)'; g.lineWidth = 2; for (let k = 1; k < 7; k++) { g.beginPath(); g.moveTo(x0 + (x1 - x0) * k / 7, b0); g.lineTo(x0 + (x1 - x0) * k / 7, b1); g.stroke(); }
  // faixa externa: seta âmbar
  const [a2, b2] = px(s * meio, 0.806), [a3, b3] = px(s * fora, 0.652); const y0 = Math.min(a2, a3), y1 = Math.max(a2, a3);
  gr = g.createLinearGradient(0, b2, 0, b3); gr.addColorStop(0, '#ffb23a'); gr.addColorStop(0.5, '#ff8a1a'); gr.addColorStop(1, '#e46b0a'); g.fillStyle = gr; g.fillRect(y0, b2, y1 - y0, b3 - b2);
  g.fillStyle = 'rgba(255,230,160,0.6)'; g.fillRect(y0 + (y1 - y0) * 0.25, b2 + (b3 - b2) * 0.22, (y1 - y0) * 0.5, (b3 - b2) * 0.5);
  g.restore();
  caminho(g, px, contorno); g.lineWidth = 6; g.strokeStyle = '#0c0d0f'; g.stroke();
  return cv;
}

function texEntrada(s) {
  const xa = Math.min(s * 0.20, s * 0.625), xb = Math.max(s * 0.20, s * 0.625), cv = canvasMetros(xa, xb, 0.315, 0.41, 1200), { g, px, c } = cv;
  g.fillStyle = '#050506'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#1a1b1e'; const n = 9; for (let i = 0; i <= n; i++) { const x = (c.width / n) * i; g.fillRect(x - 5, 0, 10, c.height); }
  caminho(g, px, FRENTE.entrada(s)); g.lineWidth = 8; g.strokeStyle = '#0b0b0c'; g.stroke();
  return cv;
}

function texPlaca(frente, texto = 'HRYZ 911') {
  const cv = canvasMetros(-0.19, 0.19, frente ? 0.34 : 0.66, frente ? 0.525 : 0.86, 1400), { g, px, c } = cv;
  g.fillStyle = '#0c0c0e'; g.fillRect(0, 0, c.width, c.height);
  const pw = 0.305, ph = 0.152, [a, b] = px(-pw / 2, (frente ? 0.43 : 0.76) + ph / 2), W = pw * 1400, H = ph * 1400;
  g.fillStyle = '#e9ebe8'; g.fillRect(a, b, W, H); g.strokeStyle = '#2a3a7a'; g.lineWidth = 5; g.strokeRect(a + 6, b + 6, W - 12, H - 12);
  g.fillStyle = '#1b2f73'; g.fillRect(a + 6, b + 6, W - 12, H * 0.2); g.fillStyle = '#e9ebe8'; g.font = `700 ${H * 0.16}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HRYZ STATE', a + W / 2, b + H * 0.12);
  g.fillStyle = '#16275f'; g.font = `800 ${H * 0.46}px system-ui, sans-serif`; g.fillText(texto, a + W / 2, b + H * 0.62);
  return cv;
}

function texLanterna(s) {                                                                                 // vista de trás (espelhada): s = +1 motorista
  const xa = Math.min(s * 0.32, s * 0.89), xb = Math.max(s * 0.32, s * 0.89), cv = canvasMetros(xa, xb, 0.70, 0.98, 1300, true), { g, px, c } = cv;
  g.clearRect(0, 0, c.width, c.height); const contorno = TRASEIRA.lanterna(s);
  caminho(g, px, contorno); g.save(); g.clip();
  let gr = g.createLinearGradient(0, 0, 0, c.height); gr.addColorStop(0, '#d92b32'); gr.addColorStop(0.55, '#a8121a'); gr.addColorStop(1, '#7a0b12'); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = 'rgba(255,120,120,0.35)'; g.lineWidth = 3; for (let k = 1; k < 9; k++) { g.beginPath(); g.moveTo(0, c.height * k / 9); g.lineTo(c.width, c.height * k / 9); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.ellipse(c.width * 0.45, c.height * 0.3, c.width * 0.3, c.height * 0.1, -0.1, 0, Math.PI * 2); g.fill();
  // lente de ré (clara) no canto interno inferior
  const [a, b] = px(s * 0.335, 0.805), [a2, b2] = px(s * 0.52, 0.752); g.fillStyle = '#e6e8ea'; g.fillRect(Math.min(a, a2), b, Math.abs(a2 - a), b2 - b);
  g.strokeStyle = '#9aa0a6'; g.lineWidth = 2; for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(Math.min(a, a2), b + (b2 - b) * k / 5); g.lineTo(Math.max(a, a2), b + (b2 - b) * k / 5); g.stroke(); }
  g.restore(); caminho(g, px, contorno); g.lineWidth = 6; g.strokeStyle = '#150b0c'; g.stroke();
  return cv;
}
function texOvalFord() {
  const cv = canvasMetros(-0.11, 0.11, 0.86, 0.94, 1400, true), { g, px } = cv; const [ox, oy] = px(0, 0.90); g.save(); g.translate(ox, oy);
  g.fillStyle = '#d7dce2'; g.beginPath(); g.ellipse(0, 0, 0.088 * 1400, 0.038 * 1400, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#12306f'; g.beginPath(); g.ellipse(0, 0, 0.081 * 1400, 0.0325 * 1400, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#eef2f8'; g.font = `italic 700 ${0.040 * 1400}px Georgia, 'Times New Roman', serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Ford', 0, 2); g.restore();
  return cv;
}
function texPlacaTras(texto) {
  const cv = canvasMetros(-0.20, 0.20, 0.655, 0.865, 1400, true), { g, px, c } = cv;
  g.fillStyle = '#d0d3d6'; caminho(g, px, TRASEIRA.placa); g.fill();                                                  // rebaixo prateado atrás da placa
  const pw = 0.305, ph = 0.152, [a, b] = px(pw / 2, 0.76 + ph / 2), W = pw * 1400, H = ph * 1400;
  g.fillStyle = '#e9ebe8'; g.fillRect(a, b, W, H); g.strokeStyle = '#2a3a7a'; g.lineWidth = 5; g.strokeRect(a + 6, b + 6, W - 12, H - 12);
  g.fillStyle = '#1b2f73'; g.fillRect(a + 6, b + 6, W - 12, H * 0.2); g.fillStyle = '#e9ebe8'; g.font = `700 ${H * 0.16}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HRYZ STATE', a + W / 2, b + H * 0.12);
  g.fillStyle = '#16275f'; g.font = `800 ${H * 0.46}px system-ui, sans-serif`; g.fillText(texto, a + W / 2, b + H * 0.62);
  caminho(g, px, TRASEIRA.placa); g.lineWidth = 6; g.strokeStyle = '#17181a'; g.stroke();
  return cv;
}

/** máscara de brilho: desenha as formas dadas (listas de pontos) com borrão, cor única */
function mascara(x0, x1, y0, y1, ppm, espelho, formas, cor) {
  const cv = canvasMetros(x0, x1, y0, y1, ppm, espelho), { g, px, c } = cv; g.clearRect(0, 0, c.width, c.height);
  g.shadowColor = cor; g.shadowBlur = ppm * 0.012; g.fillStyle = cor;
  for (const F of formas) { caminho(g, px, F); g.fill(); }
  return cv;
}
function materialLuz() { return new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }); }

function rasgar(cv, mat0) { const m = mat0.clone(); m.map = texturaDe(cv); return m; }

/** monta frente e traseira; `corpo` = malha da carroceria (para os raios) */
export function criarFrenteTraseira(corpo, opc = {}) {
  const G = new THREE.Group(); G.name = 'frenteTras';
  // grade
  const g = texGrade(); G.add(remendo(corpo, { x0: -0.42, x1: 0.42, y0: 0.625, y1: 0.825, nx: 48, ny: 14, dir: 1, desloca: () => -0.032, material: mat(texturaDe(g), { roughness: 0.55 }) }));
  for (const s of [1, -1]) {
    const f = texFarol(s), xa = Math.min(s * 0.425, s * 0.878), xb = Math.max(s * 0.425, s * 0.878);
    G.add(remendo(corpo, { x0: xa, x1: xb, y0: 0.645, y1: 0.815, nx: 30, ny: 10, dir: 1, desloca: () => -0.006, material: mat(texturaDe(f), { roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03 }) }));
    const e = texEntrada(s), xe = Math.min(s * 0.20, s * 0.625), xf = Math.max(s * 0.20, s * 0.625);
    G.add(remendo(corpo, { x0: xe, x1: xf, y0: 0.315, y1: 0.41, nx: 24, ny: 6, dir: 1, desloca: () => -0.05, material: mat(texturaDe(e), { roughness: 0.7 }) }));
  }
  const pf = texPlaca(true, opc.placa || 'HRYZ 911'); G.add(remendo(corpo, { x0: -0.19, x1: 0.19, y0: 0.34, y1: 0.525, nx: 14, ny: 8, dir: 1, desloca: () => 0.004, material: mat(texturaDe(pf), { roughness: 0.4 }) }));
  // traseira: lanternas, oval da Ford, placa
  for (const s of [1, -1]) {
    const t = texLanterna(s), xa = Math.min(s * 0.32, s * 0.89), xb = Math.max(s * 0.32, s * 0.89);
    G.add(remendo(corpo, { x0: xa, x1: xb, y0: 0.70, y1: 0.98, nx: 30, ny: 14, dir: -1, desloca: () => 0.0025, material: mat(texturaDe(t), { roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.04 }) }));
  }
  G.add(remendo(corpo, { x0: -0.11, x1: 0.11, y0: 0.86, y1: 0.94, nx: 10, ny: 4, dir: -1, desloca: () => 0.003, material: mat(texturaDe(texOvalFord()), { roughness: 0.3 }) }));
  G.add(remendo(corpo, { x0: -0.20, x1: 0.20, y0: 0.655, y1: 0.865, nx: 16, ny: 8, dir: -1, desloca: () => 0.003, material: mat(texturaDe(texPlacaTras(opc.placa || 'HRYZ 911')), { roughness: 0.4 }) }));
  // luzes: remendos aditivos por cima das lentes (faróis, setas, freio, ré)
  const luzes = { materiais: {} }, L0 = 0.004;
  const clara = s => retArred(s * 0.440, s * 0.686, 0.662, 0.800, 0.02), ambar = s => retArred(s * 0.694, s * 0.862, 0.662, 0.800, 0.024);
  const mkFrente = (nome, formaFn, cor) => {
    const m = materialLuz(); luzes.materiais[nome] = m;
    for (const s of [1, -1]) {
      const xa = Math.min(s * 0.425, s * 0.878), xb = Math.max(s * 0.425, s * 0.878), cv = mascara(xa, xb, 0.645, 0.815, 700, false, [formaFn(s)], cor), t = texturaDe(cv); const mm = m.clone(); mm.map = t; mm.userData.base = m; luzes.materiais[nome + (s > 0 ? 'E' : 'D')] = mm;
      G.add(remendo(corpo, { x0: xa, x1: xb, y0: 0.645, y1: 0.815, nx: 30, ny: 10, dir: 1, desloca: () => -0.003, material: mm }));
    }
  };
  mkFrente('farol', clara, '#fff6e0'); mkFrente('seta', ambar, '#ffa020');
  const mkTras = (nome, formaFn, cor) => {
    for (const s of [1, -1]) {
      const xa = Math.min(s * 0.32, s * 0.89), xb = Math.max(s * 0.32, s * 0.89), cv = mascara(xa, xb, 0.70, 0.98, 600, true, [formaFn(s)], cor), t = texturaDe(cv), mm = materialLuz(); mm.map = t; luzes.materiais[nome + (s > 0 ? 'E' : 'D')] = mm;
      G.add(remendo(corpo, { x0: xa, x1: xb, y0: 0.70, y1: 0.98, nx: 30, ny: 14, dir: -1, desloca: () => 0.0045, material: mm }));
    }
  };
  mkTras('freio', s => TRASEIRA.lanterna(s).filter(([x, y]) => true), '#ff1a14'); mkTras('re', s => retArred(s * 0.335, s * 0.52, 0.752, 0.805, 0.008), '#ffffff');
  luzes.definir = (nome, valor) => { for (const k of Object.keys(luzes.materiais)) if (k.startsWith(nome) && k.length === nome.length + 1) luzes.materiais[k].opacity = valor; };
  return { grupo: G, luzes };
}

