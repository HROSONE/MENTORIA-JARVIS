// Base do vídeo: luz dourada, céu em gradiente com sol, ambientes, câmera e linha do tempo de planos.
import * as THREE from 'three';
import { renderer, scene, cam, mundos, tremor } from './motor.js';
import { clamp, lerp, suave } from './util.js';

export const S = { planos: [], total: 0 };
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// luzes compartilhadas (reposicionadas a cada plano)
export const hemi = new THREE.HemisphereLight(0xa8c8ff, 0x7a5a4a, 0.9); scene.add(hemi);
export const sol = new THREE.DirectionalLight(0xffe0b0, 3.2); sol.castShadow = true; scene.add(sol); scene.add(sol.target);
sol.shadow.mapSize.set(2048, 2048); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02;
export const frente = new THREE.DirectionalLight(0xffd8b0, 0); scene.add(frente); scene.add(frente.target);
export const fill = new THREE.PointLight(0xffd2a0, 0, 6, 2); scene.add(fill);
export function luzFrente(pos, alvo, k = 0.9, cor = 0xffe8d0) { frente.position.set(...pos); frente.target.position.set(...alvo); frente.intensity = k; frente.color.set(cor); frente.target.updateMatrixWorld(); }
export function luzSol(pos, alvo, { cor = 0xffe0b0, k = 3.2, caixa = 6, hemiK = 0.9, ceu = 0xa8c8ff, chao = 0x7a5a4a } = {}) {
  sol.position.set(...pos); sol.target.position.set(...alvo); sol.color.set(cor); sol.intensity = k;
  const c = sol.shadow.camera; c.left = c.bottom = -caixa; c.right = c.top = caixa; c.near = 0.5; c.far = 80 + caixa * 4; c.updateProjectionMatrix();
  fill.intensity = 0; frente.intensity = 0;
  sol.target.updateMatrixWorld(); hemi.intensity = hemiK; hemi.color.set(ceu); hemi.groundColor.set(chao);
}

// céu: esfera com gradiente (zênite → horizonte) e disco/halo do sol na direção dir
export function criarCeu({ topo = '#2a64e8', meio = '#ff9a4a', horiz = '#ffd36a', rosa = '#b06ae0', dir = [0, 0.5, -1], solCor = '#fff2c8', halo = 0.9, raio = 400 } = {}) {
  const d = new THREE.Vector3(...dir).normalize();
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { r: { value: new THREE.Color(rosa) }, t: { value: new THREE.Color(topo) }, m: { value: new THREE.Color(meio) }, h: { value: new THREE.Color(horiz) }, d: { value: d }, s: { value: new THREE.Color(solCor) }, k: { value: halo } },
    vertexShader: 'varying vec3 vp0; void main(){ vp0 = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vp0; uniform vec3 t,m,h,s,d,r; uniform float k;
      void main(){ vec3 vp = normalize(vp0); float y = clamp(vp.y,-0.2,1.0); vec3 c = mix(h, m, smoothstep(-0.05,0.12,y)); c = mix(c, r, smoothstep(0.1,0.36,y)); c = mix(c, t, smoothstep(0.3,0.7,y));
        float c0 = max(dot(vp,d),0.0); c += s * (pow(c0,900.0)*3.0 + pow(c0,40.0)*0.55*k + pow(c0,6.0)*0.22*k);
        gl_FragColor = vec4(c,1.0); }`,
  });
  const e = new THREE.Mesh(new THREE.SphereGeometry(raio, 128, 64), m); e.frustumCulled = false; e.renderOrder = -10;
  return e;
}
export function mostrar(mundo, fundo, nevoa) {
  for (const k in mundos) mundos[k].visible = k === mundo;
  scene.background = new THREE.Color(fundo);
  scene.fog = nevoa ? new THREE.FogExp2(nevoa[0], nevoa[1]) : null;
}
export function camara({ pos, alvo, fov = 40, roll = 0, tr = 0, t = 0, semente = 0 }) {
  cam.position.set(pos[0], pos[1], pos[2]); cam.up.set(0, 1, 0); cam.lookAt(alvo[0], alvo[1], alvo[2]);
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  if (roll) cam.rotateZ(roll);
  if (tr) tremor(cam, t, tr, 1, semente);
}
export const lerpV = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export function plano(id, dur, amb, fn, extra = {}) { const t0 = S.total; S.planos.push({ id, dur, amb, fn, t0, ...extra }); S.total += dur; }
export function acharPlano(t) { for (let i = S.planos.length - 1; i >= 0; i--) if (t >= S.planos[i].t0 - 1e-6) return S.planos[i]; return S.planos[0]; }

// ---------------------------------------------------------------- texturas procedurais
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { mulberry32 } from './util.js';
export const ruidoS = sem => new SimplexNoise({ random: mulberry32(sem) });
export function fbm(n, x, y, oit = 4, lac = 2, g = 0.5) { let a = 1, f = 1, s = 0, nrm = 0; for (let i = 0; i < oit; i++) { s += a * n.noise(x * f, y * f); nrm += a; a *= g; f *= lac; } return s / nrm; }
// textura (cor ou relevo) por função f(x,y) -> [r,g,b] em 0..255
export function texFn(w, h, f, { repete = true, srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), im = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = f(x / w, y / h), i = (y * w + x) * 4; im.data[i] = v[0]; im.data[i + 1] = v[1]; im.data[i + 2] = v[2]; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; if (repete) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
