// Base do vídeo da chuva de peixes: luzes, reflexos (mapa de ambiente), céu, câmera, linha do tempo e texturas por função.
import * as THREE from 'three';
import { renderer, scene, cam, mundos, tremor } from './motor.js';
import { clamp, lerp, suave, mulberry32 } from './util.js';
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';

export const S = { planos: [], total: 0 };
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const ruidoS = sem => new SimplexNoise({ random: mulberry32(sem) });
export function fbm(n, x, y, oit = 4, lac = 2, g = 0.5) { let a = 1, f = 1, s = 0, nrm = 0; for (let i = 0; i < oit; i++) { s += a * n.noise(x * f, y * f); nrm += a; a *= g; f *= lac; } return s / nrm; }

export const hemi = new THREE.HemisphereLight(0x7aa0ff, 0x2a2a4a, 0.9); scene.add(hemi);
export const sol = new THREE.DirectionalLight(0xbcd4ff, 1.2); scene.add(sol); scene.add(sol.target);
export const spot = new THREE.SpotLight(0xffd29a, 0, 30, 0.6, 0.6, 1.2); spot.castShadow = true; scene.add(spot); scene.add(spot.target);
spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -0.0003; spot.shadow.normalBias = 0.02;
export const ponto = new THREE.PointLight(0xffd29a, 0, 12, 2); scene.add(ponto);
export function luzes({ solSombra = false, solCaixa = 14, hemiK = 0.9, ceu = 0x7aa0ff, chao = 0x2a2a4a, solK = 1.2, solCor = 0xbcd4ff, solPos = [-6, 10, 8], spotK = 0, spotPos = [0, 6, 0], spotAlvo = [0, 1, 0], spotCor = 0xffd29a, spotAng = 0.6, pontoK = 0, pontoPos = [0, 2, 0], pontoCor = 0xffd29a } = {}) {
  hemi.intensity = hemiK; hemi.color.set(ceu); hemi.groundColor.set(chao);
  sol.intensity = solK; sol.color.set(solCor); sol.position.set(...solPos);
  sol.castShadow = solSombra; if (solSombra) { const c = sol.shadow.camera; c.left = -solCaixa; c.right = solCaixa; c.top = solCaixa; c.bottom = -solCaixa; c.near = 1; c.far = 80; c.updateProjectionMatrix(); sol.shadow.mapSize.set(2048, 2048); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.03; }
  spot.castShadow = spotK > 0;
  spot.intensity = spotK; spot.position.set(...spotPos); spot.target.position.set(...spotAlvo); spot.color.set(spotCor); spot.angle = spotAng; spot.target.updateMatrixWorld();
  ponto.intensity = pontoK; ponto.position.set(...pontoPos); ponto.color.set(pontoCor);
}

// mapa de ambiente: céu de chuva ao entardecer com pontos quentes (postes, vitrines) que aparecem no asfalto molhado e no guarda-chuva
export function mapaAmbiente(topo = '#2a4fbf', meio = '#5f8fe8', horiz = '#ffb36a') {
  const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene();
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { t: { value: new THREE.Color(topo) }, m: { value: new THREE.Color(meio) }, h: { value: new THREE.Color(horiz) } },
    vertexShader: 'varying vec3 vp; void main(){ vp = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vp; uniform vec3 t,m,h; void main(){ vec3 p = normalize(vp); float y = p.y; vec3 c = mix(h, m, smoothstep(-0.1,0.25,y)); c = mix(c, t, smoothstep(0.2,0.9,y)); gl_FragColor = vec4(c*1.2,1.0); }' });
  es.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), m));
  for (const [x, y, z, c, s] of [[-12, 3, -10, 0xffc27a, 5], [14, 4, -14, 0xff9a6a, 6], [0, 2, 16, 0xffe0a0, 4], [-10, 6, 12, 0x9ad0ff, 3]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 8), new THREE.MeshBasicMaterial({ color: c })); b.position.set(x, y, z); es.add(b); }
  const tex = pm.fromScene(es, 0.03).texture; pm.dispose(); return tex;
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
export function texFn(w, h, f, { repete = true, srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), im = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = f(x / w, y / h), i = (y * w + x) * 4; im.data[i] = v[0]; im.data[i + 1] = v[1]; im.data[i + 2] = v[2]; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; if (repete) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
