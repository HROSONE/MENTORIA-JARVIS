// Texturas deste Short: terra, saco de areia, chapa corrugada, ruínas, madeira com estêncil, lousa, água.
import * as THREE from 'three';
import { canvasTex } from './motor.js';
import { mulberry32 } from './util.js';

const cache = new Map();
const unico = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };

export function texTerra() {
  return unico('terra', () => canvasTex(256, 256, (g, w, h) => {
    const r = mulberry32(3);
    g.fillStyle = '#5b4e3e'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5200; i++) { const v = r(); g.fillStyle = v < 0.4 ? 'rgba(30,24,18,0.22)' : (v < 0.8 ? 'rgba(120,100,76,0.22)' : 'rgba(170,150,120,0.16)'); g.fillRect(r() * w, r() * h, 1 + r() * 3.5, 1 + r() * 2.5); }
    for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(80,70,58,0.5)'; g.beginPath(); g.arc(r() * w, r() * h, 1 + r() * 3, 0, 6.3); g.fill(); }
  }, { repete: true, aniso: 8 }));
}
export function texSaco(cor = '#9a8c6a') {
  return unico('saco' + cor, () => canvasTex(128, 64, (g, w, h) => {
    const r = mulberry32(7);
    g.fillStyle = cor; g.fillRect(0, 0, w, h);
    // sombreado de travesseiro: centro claro, bordas escuras
    const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(20,12,4,0.38)'); gx.addColorStop(0.18, 'rgba(255,245,215,0.06)'); gx.addColorStop(0.5, 'rgba(255,245,215,0.16)'); gx.addColorStop(0.82, 'rgba(255,245,215,0.06)'); gx.addColorStop(1, 'rgba(20,12,4,0.38)'); g.fillStyle = gx; g.fillRect(0, 0, w, h);
    const gy = g.createLinearGradient(0, 0, 0, h); gy.addColorStop(0, 'rgba(255,245,215,0.10)'); gy.addColorStop(0.55, 'rgba(0,0,0,0)'); gy.addColorStop(1, 'rgba(20,12,4,0.40)'); g.fillStyle = gy; g.fillRect(0, 0, w, h);
    // trama bem leve e rugas
    g.strokeStyle = 'rgba(40,30,15,0.10)'; g.lineWidth = 1;
    for (let y = 0; y < h; y += 6) { g.beginPath(); g.moveTo(0, y + r() * 2); g.lineTo(w, y + r() * 2); g.stroke(); }
    g.strokeStyle = 'rgba(30,20,8,0.22)'; g.lineWidth = 1.6;
    for (let i = 0; i < 7; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14 + r() * 20, y + (r() - 0.5) * 14, x + 30 + r() * 30, y + (r() - 0.5) * 10); g.stroke(); }
    for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,240,200,0.06)'; g.fillRect(r() * w, r() * h, 3, 3); }
    g.fillStyle = 'rgba(30,20,10,0.35)'; g.fillRect(0, h - 4, w, 4); g.fillRect(w - 5, 0, 5, h);
    
  }, { aniso: 8 }));
}
export function texChapa() {
  return unico('chapa', () => canvasTex(256, 256, (g, w, h) => {
    const r = mulberry32(5);
    g.fillStyle = '#6a6e70'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, 'rgba(0,0,0,0.38)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(0,0,0,0.38)'); g.fillStyle = gr; g.fillRect(x, 0, 16, h); }
    for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${120 + r() * 40},${60 + r() * 20},30,${0.18 + r() * 0.3})`; g.fillRect(r() * w, r() * h, 3 + r() * 20, 2 + r() * 14); }
  }, { repete: true, aniso: 8 }));
}
// fachada em ruínas: concreto escuro, janelas vazadas e brasas lá dentro (mapa de emissão separado)
export function texRuina(seed = 1) {
  return unico('ruina' + seed, () => {
    const W = 256, H = 512, r = mulberry32(seed * 17 + 3);
    const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
    const cm = mk(), ce = mk(), gm = cm.getContext('2d'), ge = ce.getContext('2d');
    gm.fillStyle = '#3a3836'; gm.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) { gm.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.14)' : 'rgba(110,100,92,0.10)'; gm.fillRect(r() * W, r() * H, 2 + r() * 8, 1 + r() * 5); }
    ge.fillStyle = '#000'; ge.fillRect(0, 0, W, H);
    for (let f = 0; f < 8; f++) for (let c = 0; c < 4; c++) {
      const x = 14 + c * 60, y = 18 + f * 60, w = 34, h = 40;
      gm.fillStyle = '#0c0b0b'; gm.fillRect(x, y, w, h);
      if (r() < 0.32) { const gr = ge.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#ffb05a'); gr.addColorStop(1, '#ff4a12'); ge.fillStyle = gr; ge.fillRect(x + 2, y + 8, w - 4, h - 10); }
      if (r() < 0.25) { gm.fillStyle = '#3a3836'; gm.fillRect(x + r() * 10, y, 14, 14 + r() * 10); }
    }
    const map = new THREE.CanvasTexture(cm); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
    const emi = new THREE.CanvasTexture(ce); emi.colorSpace = THREE.SRGBColorSpace;
    return { map, emi };
  });
}
// caixa de madeira com estêncil (marca do canal) — texto nunca espelhado
export function texCaixaEstencil(texto = 'HRYZ ANIMATION', sub = 'MUNIÇÃO · CX 7') {
  return unico('estencil' + texto, () => canvasTex(256, 128, (g, w, h) => {
    const r = mulberry32(9);
    g.fillStyle = '#6a5a3a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { g.strokeStyle = r() < 0.5 ? 'rgba(40,28,12,0.25)' : 'rgba(150,120,70,0.18)'; g.lineWidth = 1 + r() * 2; g.beginPath(); const y = r() * h; g.moveTo(0, y); g.lineTo(w, y + (r() - 0.5) * 6); g.stroke(); }
    g.fillStyle = 'rgba(25,22,14,0.9)'; g.textAlign = 'center'; g.font = 'bold 30px "DejaVu Sans", sans-serif'; g.fillText(texto, w / 2, 62);
    g.font = 'bold 15px "DejaVu Sans", sans-serif'; g.fillText(sub, w / 2, 90);
    g.strokeStyle = 'rgba(25,22,14,0.8)'; g.lineWidth = 4; g.strokeRect(10, 10, w - 20, h - 20);
  }, { aniso: 4 }));
}
export function texPlaca(texto = 'POSTO 7') {
  return unico('placa' + texto, () => canvasTex(256, 96, (g, w, h) => {
    g.fillStyle = '#7a6a48'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#2a2418'; g.lineWidth = 6; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = '#e9e2cf'; g.textAlign = 'center'; g.font = 'bold 44px "DejaVu Sans", sans-serif'; g.fillText(texto, w / 2, 62);
  }, { aniso: 4 }));
}
export function texAgua() {
  return unico('agua', () => canvasTex(256, 256, (g, w, h) => {
    const r = mulberry32(4);
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#6f8fa8'); gr.addColorStop(1, '#3e5d78'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 1.2;
    for (let i = 0; i < 90; i++) { const y = r() * h, x = r() * w, L = 20 + r() * 50; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + L / 2, y + (r() - 0.5) * 4, x + L, y); g.stroke(); }
  }, { repete: true, aniso: 8 }));
}
// quadro de giz: desenha a lousa com os textos dados (jogados em tempo de execução)
export function criarLousa(w = 1024, h = 512) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const r = mulberry32(12);
  const poeira = [];
  for (let i = 0; i < 900; i++) poeira.push([r() * w, r() * h, 1 + r() * 4, r()]);
  function desenhar(linhas) {
    g.fillStyle = '#26352d'; g.fillRect(0, 0, w, h);
    for (const [x, y, s, a] of poeira) { g.fillStyle = `rgba(230,235,225,${0.03 + a * 0.05})`; g.fillRect(x, y, s * 4, s); }
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    for (const L of linhas) {
      g.save(); g.globalAlpha = L.a ?? 1; g.fillStyle = L.cor || '#f1f1e8'; g.textAlign = L.al || 'left';
      g.translate(L.x, L.y); g.rotate(L.rot || 0);
      g.font = `${L.peso || 'bold'} ${L.tam || 56}px "DejaVu Sans", sans-serif`;
      g.fillText(L.t, 0, 0);
      g.restore();
    }
    tex.needsUpdate = true;
  }
  desenhar([]);
  return { tex, desenhar, w, h };
}
