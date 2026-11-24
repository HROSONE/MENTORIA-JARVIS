// Utilidades do vídeo: matemática, ruído, curvas.
import * as THREE from 'three';

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const inv = (a, b, x) => clamp((x - a) / (b - a));            // 0 antes de a, 1 depois de b
export const suave = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const suave5 = t => { t = clamp(t); return t * t * t * (t * (6 * t - 15) + 10); };
export const entra = t => { t = clamp(t); return t * t; };            // acelera
export const sai = t => { t = clamp(t); return 1 - (1 - t) * (1 - t); }; // freia
export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const grau = d => d * Math.PI / 180;

export function mulberry32(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

// ruído suave unidimensional em [-1, 1] (soma de senos incomensuráveis)
export function ruido(t, semente = 0) {
  return 0.50 * Math.sin(t * 1.71 + semente * 12.3) + 0.30 * Math.sin(t * 2.93 + semente * 7.1 + 1.3) + 0.20 * Math.sin(t * 5.31 + semente * 3.7 + 2.1);
}

// interpolação linear entre pontos-chave [[t, valor], ...] (valor número ou array)
export function chaves(pts, t, f = x => x) {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const k = f((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
      const a = pts[i - 1][1], b = pts[i][1];
      return Array.isArray(a) ? a.map((v, j) => lerp(v, b[j], k)) : lerp(a, b, k);
    }
  }
  return pts[pts.length - 1][1];
}

// curva 3D (Catmull-Rom) com parâmetro por comprimento de arco: pos(s) e tangente(s), s em metros
export class Caminho {
  constructor(pontos, tipo = 'centripetal') {
    this.curva = new THREE.CatmullRomCurve3(pontos.map(p => new THREE.Vector3(...p)), false, tipo, 0.5);
    this.comp = this.curva.getLength();
  }
  pos(s, alvo = new THREE.Vector3()) { return this.curva.getPointAt(clamp(s / this.comp), alvo); }
  tan(s, alvo = new THREE.Vector3()) { return this.curva.getTangentAt(clamp(s / this.comp), alvo); }
}

export const REL = (a, b) => b - a;
