// PEÇAS aplicadas na carroceria: remendos que seguem a superfície (grade, faróis, lanternas, placa, emblemas). Cada remendo é uma malha em grade (x, y) de uma vista de frente ou de trás,
// projetada sobre a carroceria por raios, com a textura desenhada em canvas (alfa = formato).
import * as THREE from 'three';
import { ZN } from './forma.js';

const _rc = new THREE.Raycaster();

/** altura da superfície z (frente: +z) em (x, y), por raio. dir = +1 (frente) ou -1 (traseira). Devolve null se não acerta. */
export function sondarZ(corpo, x, y, dir) {
  _rc.set(new THREE.Vector3(x, y, dir * 4), new THREE.Vector3(0, 0, -dir)); _rc.far = 8;
  const h = _rc.intersectObject(corpo, false); if (!h.length) return null;
  h.sort((a, b) => a.distance - b.distance); return h[0].point.z;
}

/**
 * Remendo sobre a superfície: grade [x0,x1] x [y0,y1] projetada em z pela carroceria. deslocar(x, y) devolve o recuo (+ para fora da chapa, - para dentro).
 * UV = posição normalizada na grade; a textura do remendo cobre exatamente o retângulo.
 */
export function remendo(corpo, { x0, x1, y0, y1, nx = 40, ny = 16, dir = 1, desloca = () => 0.002, material }) {
  const P = [], uv = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const x = x0 + (x1 - x0) * i / nx, y = y0 + (y1 - y0) * j / ny;
    let z = sondarZ(corpo, x, y, dir); if (z === null) z = dir * (ZN - 0.1);
    P.push([x, y, z]); uv.push(dir > 0 ? i / nx : 1 - i / nx, j / ny);                  // visto de trás, +x fica à esquerda: espelha o u
  }
  const at = (i, j) => P[j * (nx + 1) + i];
  const pos = [], idx = [];
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const a = at(Math.max(i - 1, 0), j), b = at(Math.min(i + 1, nx), j), c = at(i, Math.max(j - 1, 0)), d = at(i, Math.min(j + 1, ny));
    const tx = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), ty = new THREE.Vector3(d[0] - c[0], d[1] - c[1], d[2] - c[2]);
    const n = new THREE.Vector3().crossVectors(tx, ty).normalize(); if (n.z * dir < 0) n.negate();
    const p = at(i, j), o = desloca(p[0], p[1]);
    pos.push(p[0] + n.x * o, p[1] + n.y * o, p[2] + n.z * o);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; if (dir > 0) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, material); m.castShadow = false; m.receiveShadow = true; return m;
}

/** canvas com mapeamento em metros: devolve { c, g, px(x, y) } para o retângulo [x0,x1] x [y0,y1] a `ppm` pixels por metro */
export function canvasMetros(x0, x1, y0, y1, ppm, espelho = false) {
  const c = document.createElement('canvas'); c.width = Math.round((x1 - x0) * ppm); c.height = Math.round((y1 - y0) * ppm); const g = c.getContext('2d');
  const px = espelho ? (x, y) => [(x1 - x) * ppm, (y1 - y) * ppm] : (x, y) => [(x - x0) * ppm, (y1 - y) * ppm];   // espelho: vista de trás (+x fica à esquerda de quem olha)
  return { c, g, px, ppm, x0, x1, y0, y1 };
}
export function caminho(g, px, pts, fechar = true) { g.beginPath(); pts.forEach(([x, y], i) => { const [a, b] = px(x, y); i ? g.lineTo(a, b) : g.moveTo(a, b); }); if (fechar) g.closePath(); }
/** retângulo arredondado como lista de pontos (x, y) */
export function retArred(xa, xb, ya, yb, r, n = 6) {
  const P = [], q = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * Math.PI / 2; P.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  q(xb - r, yb - r, 0); q(xa + r, yb - r, Math.PI / 2); q(xa + r, ya + r, Math.PI); q(xb - r, ya + r, 1.5 * Math.PI); return P;
}
export function texturaDe(cv, cor = true) { const t = new THREE.CanvasTexture(cv.c); t.colorSpace = cor ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; t.flipY = true; t.needsUpdate = true; return t; }
