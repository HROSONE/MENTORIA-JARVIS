// Efeitos do vulcão, todos função fechada do tempo: coluna de fumaça e cinza (sprites), bombas de lava com rastro (pontos incandescentes), chuva de cinza,
// relâmpagos na nuvem, fogueira de galhos e luz da cratera.
import * as THREE from 'three';
import { mulberry32, clamp, lerp, suave } from './util.js';
import { texBrilho, brilho } from './motor.js';
import { fbm } from './terreno.js';

// ---------------------------------------------------------------- coluna de fumaça e cinza
// textura de fumaça: nuvem de couve-flor (ruído deformado), com sombreado embutido (luz vinda de cima e da esquerda) e borda definida
let _fum = null;
function texFumaca() {
  if (_fum) return _fum;
  const W = 160, c = document.createElement('canvas'); c.width = c.height = W; const g = c.getContext('2d'), im = g.createImageData(W, W);
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
    const u = (i + 0.5) / W * 2 - 1, v = (j + 0.5) / W * 2 - 1, r = Math.hypot(u, v);
    const wx = fbm(u * 2.0 + 3.1, v * 2.0 + 1.7, 3) - 0.5, wy = fbm(u * 2.0 - 5.3, v * 2.0 + 8.4, 3) - 0.5;
    const n = fbm(u * 2.8 + wx * 2.2, v * 2.8 + wy * 2.2, 5), forma = suave(clamp((1 - r) / 0.62));
    const d = clamp((n * 1.25 - 0.32) * 2.3) * forma, k = (j * W + i) * 4;
    const luz = clamp(0.62 + 0.55 * (-0.45 * u - 0.55 * v) + 0.5 * (n - 0.5), 0.25, 1.0);
    im.data[k] = im.data[k + 1] = im.data[k + 2] = luz * 255; im.data[k + 3] = clamp(d * 1.15) * 255;
  }
  g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return _fum = t;
}
export function criarColuna(pai, { n = 240, semente = 4 } = {}) {
  const r = mulberry32(semente), S = [], tex = texFumaca();
  for (let i = 0; i < n; i++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0x6a6670, transparent: true, depthWrite: false, opacity: 0 })); m.renderOrder = 8; pai.add(m); S.push({ m, f: r(), dx: r() - 0.5, dz: r() - 0.5, e: 0.7 + r() * 0.9, v: 0.7 + 0.6 * r(), rot: r() * 6.28 }); }
  // topo: cratera (cx,cy,cz); ativ 0..1 (altura e densidade); vento (vx,vz); luz: 0 dia .. 1 noite (laranja por baixo)
  const atualizar = (t, { topo = [0, 0, 0], ativ = 1, alt = 160, esc = 1, larg = 1, vento = [0.55, 0.1], noite = 0, quente = 0.5 } = {}) => {
    S.forEach((o, i) => {
      const u = ((t * 0.09 * (0.5 + ativ) * o.v + o.f) % 1 + 1) % 1, vis = i / n < ativ ? 1 : 0;
      const h = u * alt * (0.35 + 0.65 * ativ), sp = (4 + 70 * u) * esc * larg * (0.4 + ativ * 0.7);
      const x = topo[0] + o.dx * sp * 1.4 + vento[0] * h * 0.7 * u + 5 * Math.sin(t * 0.6 + o.f * 9), z = topo[2] + o.dz * sp * 1.4 + vento[1] * h * 0.7 * u, y = topo[1] + h;
      o.m.position.set(x, y, z); const s = esc * larg * o.e * (12 + 85 * Math.pow(u, 0.75)) * (0.5 + ativ * 0.6); o.m.scale.set(s, s, 1);
      const lume = (1 - u) ** 3.2 * quente;                                                            // base da coluna iluminada pela lava
      o.m.material.color.setRGB(0.30 + lume * (0.16 + 0.5 * noite), 0.26 + lume * (0.06 + 0.14 * noite), 0.24 - 0.06 * lume); o.m.material.rotation = o.rot + t * 0.05;
      o.m.material.opacity = vis * 0.9 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), 0.7) * (0.4 + 0.6 * ativ) * (u < 0.02 ? u / 0.02 : 1);
    });
  };
  return { atualizar };
}

// ---------------------------------------------------------------- bombas de lava (pontos com brilho e rastro)
export function criarBombas(pai, { n = 260, semente = 8 } = {}) {
  const r = mulberry32(semente), TR = 22, N = n * TR;
  const geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), cor = new Float32Array(N * 3), tam = new Float32Array(N);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('cor', new THREE.BufferAttribute(cor, 3)); geo.setAttribute('tam', new THREE.BufferAttribute(tam, 1));
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { esc: { value: 900 } },
    vertexShader: 'attribute vec3 cor; attribute float tam; varying vec3 vC; uniform float esc; void main(){ vC = cor; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = clamp(tam * esc / -mv.z, 1.0, 140.0); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying vec3 vC; void main(){ vec2 p = gl_PointCoord - 0.5; float d = length(p) * 2.0; float a = pow(max(0.0, 1.0 - d), 1.8); float core = pow(max(0.0, 1.0 - d * 1.6), 3.0); gl_FragColor = vec4(vC * (a * 0.8 + core * 1.4), 1.0); }' });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 9; pai.add(pts);
  const B = Array.from({ length: n }, (_, i) => { const a = r() * 6.283, el = (62 + 27 * r()) * Math.PI / 180, v = 22 + 26 * r() * r() + 6 * r(); return { per: 0.9 + 1.6 * r(), ph: r(), vx: Math.cos(a) * Math.cos(el) * v, vy: Math.sin(el) * v, vz: Math.sin(a) * Math.cos(el) * v, e: 0.7 + 1.4 * r() }; });
  const atualizar = (t, { topo = [0, 0, 0], ativ = 1, alturaEm = () => 0, esc = 1, camEsc = 900, tamK = 1 } = {}) => {
    mat.uniforms.esc.value = camEsc;
    for (let i = 0; i < n; i++) {
      const b = B[i], ciclo = (t / b.per + b.ph), k = Math.floor(ciclo), tau = (ciclo - k) * b.per * 3.2, on = (i / n) < ativ && tau < b.per * 3.2 ? 1 : 0;
      for (let j = 0; j < TR; j++) {
        const ta = Math.max(0, tau - j * 0.007), idx = (i * TR + j) * 3;
        const x = topo[0] + b.vx * ta * esc, z = topo[2] + b.vz * ta * esc; let y = topo[1] + (b.vy * ta - 4.9 * ta * ta) * esc;
        const hg = alturaEm(x, z); let pouso = false; if (y < hg + 0.5 && ta > 0.4) { y = hg + 0.5; pouso = true; }
        pos[idx] = x; pos[idx + 1] = y; pos[idx + 2] = z;
        const frio = Math.exp(-tau / (pouso ? 5.0 : 3.8)), q = on * frio * (1 - j / TR) * (pouso ? 0.55 : 1);
        cor[idx] = 1.0 * q; cor[idx + 1] = (0.18 + 0.5 * frio) * q; cor[idx + 2] = 0.04 * q;
        tam[i * TR + j] = (0.4 + 0.6 * (1 - j / TR)) * b.e * (0.4 + frio * 0.8) * 2.2 * esc * tamK * (on ? 1 : 0.0001);
      }
    }
    geo.attributes.position.needsUpdate = geo.attributes.cor.needsUpdate = geo.attributes.tam.needsUpdate = true;
  };
  return { atualizar };
}

// ---------------------------------------------------------------- chuva de cinza (pontos cinzentos caindo devagar, levados pelo vento)
export function criarCinza(pai, { n = 3500, caixa = [60, 40, 60] } = {}) {
  const r = mulberry32(12), geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), P = Array.from({ length: n }, () => [r(), r(), r(), 0.6 + 0.8 * r()]);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, map: texBrilho('196,192,186'), size: 0.2, sizeAttenuation: true, transparent: true, opacity: 0.0, depthWrite: false }); const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pai.add(pts);
  const atualizar = (t, centro, { dens = 0, vento = [1.6, 0.3], v = 1.4 } = {}) => {
    mat.opacity = 0.75 * clamp(dens);
    for (let i = 0; i < n; i++) { const d = P[i], y = ((d[1] * caixa[1] - t * v * d[3]) % caixa[1] + caixa[1]) % caixa[1]; pos[i * 3] = centro[0] + (d[0] - 0.5) * caixa[0] + vento[0] * (y - caixa[1] / 2) * -0.3 + Math.sin(t * 0.7 + d[2] * 20) * 0.6; pos[i * 3 + 1] = centro[1] - 3 + y; pos[i * 3 + 2] = centro[2] + (d[2] - 0.5) * caixa[2]; }
    geo.attributes.position.needsUpdate = true;
  };
  return { atualizar };
}

// ---------------------------------------------------------------- relâmpagos na nuvem de cinza (tubos irregulares que acendem por instantes)
export function criarRelampagos(pai, { n = 5, semente = 21 } = {}) {
  const r = mulberry32(semente), B = [];
  const mat = new THREE.MeshBasicMaterial({ color: 0xdfe8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  for (let b = 0; b < n; b++) {
    const g = new THREE.Group(), ramo = (p0, dirx, dirz, comp, raio, nivel) => {
      const pts = [new THREE.Vector3(...p0)]; let x = p0[0], y = p0[1], z = p0[2]; const passos = 14;
      for (let k = 0; k < passos; k++) { y -= comp / passos; x += dirx * comp / passos + (r() - 0.5) * comp * 0.09; z += dirz * comp / passos + (r() - 0.5) * comp * 0.09; pts.push(new THREE.Vector3(x, y, z)); if (nivel < 2 && r() < 0.18) ramo([x, y, z], (r() - 0.5) * 1.2, (r() - 0.5) * 1.2, comp * 0.35, raio * 0.55, nivel + 1); }
      const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, raio, 5), mat); g.add(t);
    };
    ramo([0, 0, 0], (r() - 0.5) * 0.5, (r() - 0.5) * 0.5, 120 + 60 * r(), 0.85, 0); g.visible = false; pai.add(g); B.push(g);
  }
  // acende o relâmpago k no instante local u (0..1 do clarão), na posição base
  const atualizar = (ativos, base) => { B.forEach((g, i) => { const a = ativos[i] || 0; g.visible = a > 0.02; if (g.visible) g.position.set(base[0] + (i - 2) * 22, base[1], base[2] + (i % 2 ? 14 : -10)); }); mat.opacity = Math.max(0, ...ativos.map(a => a || 0)); };
  return { atualizar };
}

// ---------------------------------------------------------------- fogueira de galhos (chamas em sprites, brasas e fumaça fina)
let _fogo = null;
function texFogo() {
  if (_fogo) return _fogo;
  const W = 96, H = 192, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), im = g.createImageData(W, H);
  const rampa = q => q < 0.5 ? [lerp(0.80, 1.0, q * 2), lerp(0.10, 0.50, q * 2), lerp(0.02, 0.08, q * 2)] : [1.0, lerp(0.50, 0.96, (q - 0.5) * 2), lerp(0.08, 0.72, (q - 0.5) * 2)];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const u = (i + 0.5) / W * 2 - 1, v = 1 - (j + 0.5) / H;                                   // v: 0 na base, 1 na ponta
    const larg = Math.pow(Math.max(0, 1 - v), 0.8) * (0.80 + 0.10 * Math.sin(v * 11 + 1.3)) * Math.min(1, 0.25 + v * 7);
    const lat = clamp(1 - Math.abs((u + 0.10 * Math.sin(v * 6.5)) / Math.max(larg, 1e-3)), 0, 1);      // língua levemente torcida
    const a = Math.pow(lat, 1.5) * Math.min(1, v * 16) * (1 - Math.pow(v, 2.6));
    const q = clamp(lat * (1 - v * 0.8) * 1.2), k = (j * W + i) * 4, cor = rampa(q);
    im.data[k] = cor[0] * 255; im.data[k + 1] = cor[1] * 255; im.data[k + 2] = cor[2] * 255; im.data[k + 3] = clamp(a) * 255;
  }
  g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return _fogo = t;
}
export function criarFogueira(pai, { pos = [0, 0, 0], escala = 1 } = {}) {
  const g = new THREE.Group(); g.position.set(...pos); pai.add(g);
  const madeira = new THREE.MeshStandardMaterial({ color: 0x4a3018, roughness: 1, emissive: 0x401000, emissiveIntensity: 0.6 }), r = mulberry32(3);
  for (let i = 0; i < 34; i++) { const a = r() * 6.28, l = 0.45 + 0.6 * r(); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.022, l, 5), madeira); s.position.set(Math.cos(a) * 0.22 * r() * escala, 0.1 + 0.3 * r() * escala, Math.sin(a) * 0.22 * r() * escala); s.rotation.set((r() - 0.5) * 2.2, a, (r() - 0.5) * 2.2); s.scale.setScalar(escala); g.add(s); }
  const ch = Array.from({ length: 7 }, (_, i) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFogo(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); m.center.set(0.5, 0.05); g.add(m); return { m, f: i / 7 }; });
  const brasa = brilho('255,150,60', 1.6 * escala, 0.8); brasa.position.y = 0.5 * escala; g.add(brasa);
  const fu = Array.from({ length: 8 }, (_, i) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFumaca(), color: 0x4a4a50, transparent: true, depthWrite: false, opacity: 0 })); g.add(m); return { m, f: i / 8 }; });
  const atualizar = (t, forca = 1) => {
    ch.forEach((o, i) => { const s = (0.8 + 0.5 * Math.sin(t * 9 + i * 2)) * escala * forca * (0.7 + 0.5 * (i % 3) / 3); o.m.scale.set(0.62 * s, 1.35 * s, 1); o.m.position.set(0.16 * Math.sin(i * 2.3 + t * 2) * escala, 0.28 * escala, 0.16 * Math.cos(i * 1.7) * escala); o.m.material.opacity = 0.85 * forca * (0.7 + 0.3 * Math.sin(t * 13 + i * 3)); });
    brasa.material.opacity = forca * (0.7 + 0.3 * Math.sin(t * 11));
    fu.forEach(o => { const u = ((t * 0.18 + o.f) % 1 + 1) % 1; o.m.position.set(0.5 * u * escala * 2, (0.8 + 4.5 * u) * escala, 0.2 * Math.sin(u * 6 + o.f * 9)); const s = (0.7 + 2.6 * u) * escala; o.m.scale.set(s, s, 1); o.m.material.opacity = 0.4 * forca * Math.sin(Math.PI * u); });
  };
  return { grupo: g, atualizar };
}

// ---------------------------------------------------------------- fissura do nascimento: brilho, poucas chamas baixas e fagulhas (a rachadura incandescente em si é pintada no terreno)
export function criarFissura(pai) {
  const g = new THREE.Group(), r = mulberry32(31); pai.add(g);
  const chamas = Array.from({ length: 7 }, (_, i) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFogo(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); m.center.set(0.5, 0.04); g.add(m); return { m, x: -1.1 + 2.2 * i / 6 + 0.1 * Math.sin(i * 3.1), f: i * 0.37 }; });
  const gl = brilho('255,140,50', 9, 0.9); gl.position.y = 0.45; g.add(gl);
  // fagulhas: brasas que saltam da fenda em arcos curtos e caem
  const NF = 70, gf = new THREE.BufferGeometry(), pf = new Float32Array(NF * 3), F = Array.from({ length: NF }, () => ({ x: (r() - 0.5) * 2.4, vx: (r() - 0.5) * 2.4, vy: 2.2 + 3.6 * r(), vz: (r() - 0.5) * 2.0, per: 0.7 + 0.9 * r(), ph: r() }));
  gf.setAttribute('position', new THREE.BufferAttribute(pf, 3));
  const mf = new THREE.PointsMaterial({ color: 0xffffff, map: texBrilho('255,170,70'), size: 0.16, sizeAttenuation: true, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const fag = new THREE.Points(gf, mf); fag.frustumCulled = false; fag.renderOrder = 9; g.add(fag);
  const eixo = x => 0.20 * Math.sin(x * 2.3 + 0.7) + 0.09 * Math.sin(x * 6.1 + 2.0);
  const atualizar = (t, { y = 0, k = 1, alturaEm = () => y } = {}) => {
    g.visible = k > 0.01; if (!g.visible) return; g.position.set(0, y, 0); g.scale.setScalar(1);
    const ya = x => alturaEm(x, eixo(x)) - y;
    gl.material.opacity = 0.55 * k * (0.8 + 0.2 * Math.sin(t * 11)); gl.scale.setScalar(2.2 + 2.2 * k);
    chamas.forEach((o, i) => { const f = (0.55 + 0.45 * Math.sin(t * 9 + o.f * 7)) * k, s = (0.7 + 0.5 * Math.sin(t * 6 + i)) * k; o.m.position.set(o.x, ya(o.x) + 0.03, eixo(o.x)); o.m.scale.set(0.36 * s + 0.07, 0.58 * s + 0.1, 1); o.m.material.opacity = 0.75 * f; });
    F.forEach((o, i) => { const u = (((t / o.per + o.ph) % 1) + 1) % 1, tau = u * o.per; const on = (i / NF) < k ? 1 : 0; const x0 = o.x * 0.5; pf[i * 3] = x0 + o.vx * tau; pf[i * 3 + 1] = ya(x0) + 0.1 + (o.vy * tau - 4.9 * tau * tau) * on; pf[i * 3 + 2] = eixo(x0) + o.vz * tau; if (!on) pf[i * 3 + 1] = -50; });
    gf.attributes.position.needsUpdate = true;
  };
  return { atualizar, gl, chamas, fag };
}
