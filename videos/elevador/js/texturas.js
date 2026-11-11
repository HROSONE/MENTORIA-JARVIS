// Texturas procedurais do Short do elevador (madeira, mármore, papel de parede, pedra, tijolo, concreto, tapete, relógio, quadros, letreiros).
import * as THREE from 'three';
import { canvasTex } from './motor.js';
import { mulberry32 } from './util.js';

const cache = new Map();
const unico = (chave, f) => { if (!cache.has(chave)) cache.set(chave, f()); return cache.get(chave); };

// veios de madeira na vertical; devolve o contexto já desenhado
function veios(g, w, h, base, escuro, claro, n = 520, seed = 3) {
  const r = mulberry32(seed);
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < n; i++) {
    const x = r() * w, a = 0.03 + r() * 0.12, larg = 0.6 + r() * 2.2, onda = r() * 6;
    g.strokeStyle = r() < 0.6 ? escuro : claro; g.globalAlpha = a; g.lineWidth = larg;
    g.beginPath();
    for (let y = 0; y <= h; y += 16) { const xx = x + Math.sin(y * 0.011 + onda) * (2 + r() * 1.2); y === 0 ? g.moveTo(xx, y) : g.lineTo(xx, y); }
    g.stroke();
  }
  g.globalAlpha = 1;
}

// parede da cabine: lambri de mogno com um painel alto em cima e um baixo embaixo (altura da cabine 2,3 m)
export function texLambri({ base = '#5a2f1e', escuro = '#2b130a', claro = '#8a5636', bump = false } = {}) {
  return unico('lambri' + base + bump, () => canvasTex(512, 1024, (g, w, h) => {
    if (bump) { g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, w, h); } else veios(g, w, h, base, escuro, claro);
    const painel = (x0, y0, x1, y1) => {
      if (bump) {
        g.fillStyle = '#555'; g.fillRect(x0 - 10, y0 - 10, x1 - x0 + 20, y1 - y0 + 20);
        g.fillStyle = '#c8c8c8'; g.fillRect(x0 + 10, y0 + 10, x1 - x0 - 20, y1 - y0 - 20);
        return;
      }
      g.fillStyle = 'rgba(0,0,0,0.38)'; g.fillRect(x0 - 12, y0 - 12, x1 - x0 + 24, y1 - y0 + 24);
      g.fillStyle = 'rgba(255,200,150,0.16)'; g.fillRect(x0 + 8, y0 + 8, x1 - x0 - 16, 6); g.fillRect(x0 + 8, y0 + 8, 6, y1 - y0 - 16);
      g.fillStyle = 'rgba(0,0,0,0.30)'; g.fillRect(x0 + 8, y1 - 14, x1 - x0 - 16, 6); g.fillRect(x1 - 14, y0 + 8, 6, y1 - y0 - 16);
    };
    painel(64, 70, 448, 560); painel(64, 640, 448, 960);
  }, { aniso: 8 }));
}
export function texMadeira(base = '#6b3a22', escuro = '#34190d', claro = '#9a6540') {
  return unico('mad' + base, () => canvasTex(256, 256, (g, w, h) => veios(g, w, h, base, escuro, claro, 260, 11), { repete: true, aniso: 8 }));
}
// piso xadrez de mármore (4 x 4 casas, com veios)
export function texXadrez(c1 = '#e8e4da', c2 = '#1c1c20') {
  return unico('xadrez' + c1, () => canvasTex(512, 512, (g, w, h) => {
    const r = mulberry32(9), n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? c2 : c1; g.fillRect(i * s, j * s, s, s); }
    for (let k = 0; k < 60; k++) {
      const x = r() * w, y = r() * h; g.strokeStyle = r() < 0.5 ? 'rgba(120,120,125,0.35)' : 'rgba(255,255,255,0.18)'; g.lineWidth = 0.7 + r() * 1.3;
      g.beginPath(); g.moveTo(x, y); for (let q = 0; q < 5; q++) g.lineTo(x + (r() - 0.3) * 90, y + (r() - 0.5) * 90); g.stroke();
    }
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke(); g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
  }, { aniso: 8 }));
}
// papel de parede listrado com motivo (c1 fundo, c2 listra, dourado fino)
export function texPapel(c1 = '#274236', c2 = '#2f4d40', ouro = '#b59a58') {
  return unico('papel' + c1, () => canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = c1; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 64) { g.fillStyle = c2; g.fillRect(x, 0, 28, h); g.fillStyle = ouro; g.globalAlpha = 0.55; g.fillRect(x + 28, 0, 2, h); g.fillRect(x + 62, 0, 2, h); g.globalAlpha = 1; }
    g.strokeStyle = ouro; g.globalAlpha = 0.28; g.lineWidth = 1.5;
    for (let y = 16; y < h; y += 64) for (let x = 14; x < w; x += 64) { g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x + 9, y); g.lineTo(x, y + 9); g.lineTo(x - 9, y); g.closePath(); g.stroke(); }
    g.globalAlpha = 1;
  }, { repete: true, aniso: 8 }));
}
export function texPedra(base = '#cdbf9f', junta = '#8d8068', seed = 4) {
  return unico('pedra' + base, () => canvasTex(512, 512, (g, w, h) => {
    const r = mulberry32(seed), alt = 64;
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let j = 0; j < h / alt; j++) {
      let x = -(j % 2) * 110;
      while (x < w + 240) {
        const lar = 180 + r() * 90, v = (r() - 0.5) * 22;
        g.fillStyle = shade(base, v); g.fillRect(x, j * alt, lar, alt);
        g.fillStyle = 'rgba(0,0,0,0.06)'; for (let q = 0; q < 14; q++) g.fillRect(x + r() * lar, j * alt + r() * alt, 2 + r() * 8, 1 + r() * 3);
        g.fillStyle = junta; g.fillRect(x, j * alt, 3, alt); x += lar;
      }
      g.fillStyle = junta; g.fillRect(0, j * alt, w, 3);
    }
  }, { repete: true, aniso: 8 }));
}
export function texTijolo(base = '#8a4a34', junta = '#bdb3a4', seed = 6) {
  return unico('tij' + base, () => canvasTex(256, 256, (g, w, h) => {
    const r = mulberry32(seed), bh = 16, bw = 48;
    g.fillStyle = junta; g.fillRect(0, 0, w, h);
    for (let j = 0; j < h / bh; j++) for (let x = -(j % 2) * bw / 2; x < w; x += bw) { g.fillStyle = shade(base, (r() - 0.5) * 30); g.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4); }
  }, { repete: true, aniso: 8 }));
}
export function texConcreto(base = '#6e6f70') {
  return unico('conc' + base, () => canvasTex(256, 256, (g, w, h) => {
    const r = mulberry32(2);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 3000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
    for (let i = 0; i < 14; i++) { const x = r() * w, gr = g.createLinearGradient(x, 0, x + 6, h); gr.addColorStop(0, 'rgba(20,20,20,0)'); gr.addColorStop(0.5, 'rgba(20,20,20,0.22)'); gr.addColorStop(1, 'rgba(20,20,20,0)'); g.fillStyle = gr; g.fillRect(x, 0, 6 + r() * 8, h); }
  }, { repete: true, aniso: 8 }));
}
export function texTapete(c1 = '#6b1f2a', c2 = '#c9a857', c3 = '#1f2a4a') {
  return unico('tap' + c1, () => canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = c1; g.fillRect(0, 0, w, h);
    g.strokeStyle = c2; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
    g.strokeStyle = c3; g.lineWidth = 10; g.strokeRect(26, 26, w - 52, h - 52);
    g.strokeStyle = c2; g.lineWidth = 2; g.strokeRect(42, 42, w - 84, h - 84);
    g.fillStyle = c3; g.beginPath(); g.moveTo(w / 2, 62); g.lineTo(w - 62, h / 2); g.lineTo(w / 2, h - 62); g.lineTo(62, h / 2); g.closePath(); g.fill();
    g.fillStyle = c2; g.beginPath(); g.moveTo(w / 2, 100); g.lineTo(w - 100, h / 2); g.lineTo(w / 2, h - 100); g.lineTo(100, h / 2); g.closePath(); g.fill();
    g.fillStyle = c1; g.beginPath(); g.arc(w / 2, h / 2, 22, 0, 6.3); g.fill();
  }, { aniso: 8 }));
}
export function texQuadro(seed = 1) {
  return unico('quadro' + seed, () => canvasTex(128, 160, (g, w, h) => {
    const r = mulberry32(seed * 13 + 5);
    const paleta = [['#2c3d55', '#c9a75b', '#8a3b32', '#e8e1cf'], ['#1d3b34', '#d9b36a', '#6d2b2b', '#efe6d2'], ['#3b2f55', '#d6a05b', '#2a5d6a', '#eadfcd']][seed % 3];
    g.fillStyle = paleta[3]; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { g.fillStyle = paleta[Math.floor(r() * 3)]; g.globalAlpha = 0.85; g.fillRect(r() * w * 0.6, r() * h * 0.7, 30 + r() * 70, 20 + r() * 60); }
    g.globalAlpha = 1; g.fillStyle = paleta[0]; g.beginPath(); g.arc(w * (0.3 + r() * 0.4), h * (0.3 + r() * 0.3), 18 + r() * 14, 0, 6.3); g.fill();
  }, { aniso: 4 }));
}
// mostrador do relógio de pé: algarismos romanos, marca no dial; texto da marca embaixo
export function texRelogio() {
  return unico('relogio', () => canvasTex(512, 512, (g, w, h) => {
    const c = w / 2;
    g.fillStyle = '#e9e1cc'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#2b2214'; g.lineWidth = 6; g.beginPath(); g.arc(c, c, c - 14, 0, 6.3); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.arc(c, c, c - 70, 0, 6.3); g.stroke();
    for (let i = 0; i < 60; i++) { const a = i / 60 * 6.283, big = i % 5 === 0; g.lineWidth = big ? 4 : 1.5; g.beginPath(); g.moveTo(c + Math.sin(a) * (c - 22), c - Math.cos(a) * (c - 22)); g.lineTo(c + Math.sin(a) * (c - (big ? 52 : 40)), c - Math.cos(a) * (c - (big ? 52 : 40))); g.stroke(); }
    g.fillStyle = '#2b2214'; g.font = 'bold 46px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const rom = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, rr = c - 112; g.save(); g.translate(c + Math.sin(a) * rr, c - Math.cos(a) * rr); g.rotate(a); g.font = 'bold 40px serif'; g.fillText(rom[i], 0, 0); g.restore(); }
    g.font = 'bold 27px "DejaVu Sans", sans-serif'; g.fillStyle = '#7a1f1f'; g.fillText('HRYZ', c, c + 94); g.font = '15px "DejaVu Sans", sans-serif'; g.fillText('ANIMATION', c, c + 118);
  }, { aniso: 8 }));
}
// painel de LED do indicador de andar (texto e seta)
export function texIndicador(txt = '2', seta = '') {
  return canvasTex(128, 64, (g, w, h) => {
    g.fillStyle = '#0a0606'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ff5a2a'; g.font = 'bold 46px "DejaVu Sans Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w * 0.62, h / 2 + 3);
    if (seta) { g.font = 'bold 30px sans-serif'; g.fillText(seta, w * 0.22, h / 2); }
  });
}
// etiqueta de caixa de entrega (marca na etiqueta)
export function texEtiqueta() {
  return unico('etq', () => canvasTex(256, 160, (g, w, h) => {
    g.fillStyle = '#f2efe6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1b1b1d'; g.font = 'bold 30px "DejaVu Sans", sans-serif'; g.textAlign = 'left'; g.fillText('HRYZ', 14, 40);
    g.font = '15px "DejaVu Sans", sans-serif'; g.fillText('ANIMATION · ENTREGA', 14, 62);
    const r = mulberry32(8); for (let x = 14; x < w - 14; x += 3) { g.fillRect(x, 84, 1 + (r() * 2 | 0), 46); x += r() * 3; }
    g.fillStyle = '#c0392b'; g.fillRect(w - 52, 12, 38, 22);
  }, { aniso: 4 }));
}
// papelão
export function texPapelao() {
  return unico('papelao', () => canvasTex(128, 128, (g, w, h) => {
    const r = mulberry32(4); g.fillStyle = '#b48a5a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) { g.fillStyle = r() < 0.5 ? 'rgba(80,50,20,0.07)' : 'rgba(255,230,190,0.06)'; g.fillRect(r() * w, r() * h, 6 + r() * 14, 1); }
    g.fillStyle = '#cdb98f'; g.fillRect(0, h / 2 - 6, w, 12);
  }, { aniso: 4 }));
}
// céu em gradiente (vertical): hora = 'crepusculo' | 'dia' | 'manha'
export function texCeu(hora = 'dia') {
  return unico('ceu' + hora, () => canvasTex(16, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    const P = { crepusculo: [[0, '#0d1428'], [0.5, '#2a3558'], [0.8, '#a2594d'], [1, '#e6a068']], dia: [[0, '#7f9ac0'], [0.55, '#b4c8de'], [1, '#e6ecf0']], manha: [[0, '#8da5c4'], [0.6, '#c3d1df'], [1, '#eef0ee']] }[hora];
    P.forEach(([o, c]) => gr.addColorStop(o, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }));
}

function shade(hex, v) {
  const n = parseInt(hex.slice(1), 16), c = x => Math.max(0, Math.min(255, x + v));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}
