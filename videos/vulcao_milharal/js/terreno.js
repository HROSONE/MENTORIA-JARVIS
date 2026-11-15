// Terreno em malha de alturas que acompanha a história do vulcão: o chão incha, o cone cresce (com cratera, ravinas e escória), a lava corre pelo caminho até o povoado
// (a camada de lava SOBE o terreno, então casas e igreja vão sendo enterradas de verdade) e a cinza cobre os campos. Tudo é função do estado (closed form).
// Duas malhas com a mesma função: a grande (640 m, células de 2,5 m) e uma fina no centro (48 m, células de 25 cm) para o morro recém-nascido não virar pirâmide.
import * as THREE from 'three';
import { RUIDO, BUMP, UT } from './detalhe.js';
import { clamp, lerp, suave, mulberry32 } from './util.js';

// ---- ruído em JS (mesmo espírito do GLSL)
const h2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return lerp(lerp(h2(xi, yi), h2(xi + 1, yi), u), lerp(h2(xi, yi + 1), h2(xi + 1, yi + 1), u), v); };
export const fbm = (x, y, o = 4) => { let a = 0.5, s = 0, n = 0; for (let i = 0; i < o; i++) { s += a * vn(x, y); n += a; x = x * 2.03 + 17.1; y = y * 2.03 + 17.1; a *= 0.5; } return s / n; };

// ---- caminho da lava: da cratera até o povoado
export const CAMINHO = [[0, 0], [34, -7], [78, -26], [128, -46], [176, -58], [214, -66]];
const SEG = []; let COMP = 0; for (let i = 0; i < CAMINHO.length - 1; i++) { const a = CAMINHO[i], b = CAMINHO[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); SEG.push({ a, b, l, s0: COMP }); COMP += l; }
export const COMP_LAVA = COMP;
export const IGREJA = { x: 206, z: -62 };                                                     // centro do povoado (a igreja)
export function noCaminho(s) { for (const g of SEG) if (s <= g.s0 + g.l) { const u = (s - g.s0) / g.l; return [lerp(g.a[0], g.b[0], u), lerp(g.a[1], g.b[1], u)]; } const g = SEG.at(-1); return g.b; }

// perfil do cone: altura H, raio da base R = K*H; cratera no meio; ravinas radiais
export const K_BASE = 1.55;
export function altCone(d, ang, H) {
  if (H <= 0.001) return 0;
  const R = K_BASE * H, u = d / R; if (u >= 1) return 0;
  let f = u < 0.13 ? (1 - 0.13) ** 1.1 * (0.82 + 0.18 * (u / 0.13) ** 2) : (1 - u) ** 1.1;
  const rav = 1 + 0.07 * Math.sin(ang * 9 + fbm(ang * 3, u * 4) * 5) * Math.min(1, u * 3) * (1 - u);       // ravinas
  return H * f * rav * (1 + (H > 20 ? 0.04 * (vn(ang * 5, u * 8) - 0.5) : 0));
}

const UF = { value: 0 }, UH = { value: 0 };                                                                      // brilho da fenda do nascimento (0 apaga)

export function criarTerreno({ tam = 640, seg = 256, tamF = 48, segF = 192 } = {}) {
  const E = { H: 0, cinza: 0, lavaFrente: 0, lavaEsp: 1, ativ: 0, crateraBrilho: 0, inchaco: 0, fenda: 0 };
  const larg = s => 7 + 0.13 * s, espessura = s => (1.0 + 6.5 * suave((s - 60) / 170)) * E.lavaEsp;
  const inchar = d => E.inchaco * Math.exp(-((d / 2.7) ** 2));
  function lavaMask(sp, dp, rz) {
    if (E.lavaFrente <= 0) return 0;
    const sf = E.lavaFrente * COMP, ao = clamp((sf - sp) / 14 + 0.0), w = larg(sp) * (0.85 + 0.5 * rz);
    return ao * (1 - suave((dp - w * 0.62) / (w * 0.5)));
  }
  function fazer(lado, nSeg, buraco, fina) {
    const geo = new THREE.PlaneGeometry(lado, lado, nSeg, nSeg); geo.rotateX(-Math.PI / 2);
    const P = geo.attributes.position, n = P.count, base = Float32Array.from(P.array);
    const atr = new Float32Array(n * 4); geo.setAttribute('atr', new THREE.BufferAttribute(atr, 4));
    // pré-cálculos fixos por vértice
    const D = new Float32Array(n), ANG = new Float32Array(n), HB = new Float32Array(n), SP = new Float32Array(n), DP = new Float32Array(n), RZ = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = base[i * 3], z = base[i * 3 + 2]; D[i] = Math.hypot(x, z); ANG[i] = Math.atan2(z, x);
      HB[i] = 1.1 * (fbm(x / 70, z / 70) - 0.5) + 0.35 * (fbm(x / 14, z / 14) - 0.5);
      let melhor = 1e9, sp = 0; for (const g of SEG) { const dx = g.b[0] - g.a[0], dz = g.b[1] - g.a[1], t = clamp(((x - g.a[0]) * dx + (z - g.a[1]) * dz) / (g.l * g.l)), px = g.a[0] + dx * t, pz = g.a[1] + dz * t, dd = Math.hypot(x - px, z - pz); if (dd < melhor) { melhor = dd; sp = g.s0 + t * g.l; } }
      DP[i] = melhor; SP[i] = sp; RZ[i] = fbm(x / 9 + 3.1, z / 9 - 1.7);
    }
    const malha = new THREE.Mesh(geo, material(buraco, fina)); malha.receiveShadow = true; malha.castShadow = false; malha.frustumCulled = false;
    const atualizar = () => {
      const R = K_BASE * E.H;
      for (let i = 0; i < n; i++) {
        const lm = lavaMask(SP[i], DP[i], RZ[i]), hh = HB[i] + altCone(D[i], ANG[i], E.H) + espessura(SP[i]) * lm * 0.9 + inchar(D[i]);
        P.array[i * 3 + 1] = hh;
        const dn = D[i] / Math.max(R, 1), cone = E.H > 0.2 ? clamp((1.02 - dn) / 0.3) : 0;
        const dentro = E.H > 0.2 ? 1 : 0;
        // cinza: cai mais perto do cone e a favor do vento (+x)
        const ci = clamp(E.cinza * (1.25 - D[i] / 340) * (1 + 0.45 * Math.tanh(base[i * 3] / 160)) * (0.75 + 0.5 * RZ[i]));
        const quente = clamp(lm * (0.45 + 0.55 * clamp((E.lavaFrente * COMP - SP[i]) < 40 ? 1 : 0.35)) * E.ativ + (D[i] < Math.max(4, R * 0.16) ? 1 : 0) * E.crateraBrilho + (E.inchaco > 0 ? Math.exp(-((D[i] / 2.2) ** 2)) * clamp(E.inchaco / 1.5) : 0));
        atr[i * 4] = ci; atr[i * 4 + 1] = lm; atr[i * 4 + 2] = cone * dentro; atr[i * 4 + 3] = quente;
      }
      P.needsUpdate = true; geo.attributes.atr.needsUpdate = true; geo.computeVertexNormals();
    };
    return { malha, atualizar };
  }
  const grande = fazer(tam, seg, tamF / 2 - 0.4, false), fina = fazer(tamF, segF, 0, true);
  const malha = new THREE.Group(); malha.add(grande.malha, fina.malha);
  function atualizar(est) { Object.assign(E, est); UF.value = E.fenda; UH.value = E.H; grande.atualizar(); fina.atualizar(); }
  // altura do terreno em (x, z) com o estado atual (para pôr gente, plantas, câmera e bombas no chão)
  function alturaEm(x, z) {
    const d = Math.hypot(x, z), ang = Math.atan2(z, x); let lm = 0, sp = 0, dp = 1e9;
    if (E.lavaFrente > 0) { for (const g of SEG) { const dx = g.b[0] - g.a[0], dz = g.b[1] - g.a[1], t = clamp(((x - g.a[0]) * dx + (z - g.a[1]) * dz) / (g.l * g.l)), px = g.a[0] + dx * t, pz = g.a[1] + dz * t, dd = Math.hypot(x - px, z - pz); if (dd < dp) { dp = dd; sp = g.s0 + t * g.l; } }
      const w = larg(sp), ao = clamp((E.lavaFrente * COMP - sp) / 14); lm = ao * (1 - suave((dp - w * 0.62 * 0.95) / (w * 0.5 * 0.95))); }
    return 1.1 * (fbm(x / 70, z / 70) - 0.5) + 0.35 * (fbm(x / 14, z / 14) - 0.5) + altCone(d, ang, E.H) + espessura(sp) * lm * 0.9 + inchar(d);
  }
  return { malha, atualizar, alturaEm, estado: E };
}

// material: PBR do three com solo/capim, cinza, escória, crosta de lava com rachaduras incandescentes (emissivo) e relevo
function material(buraco, fina) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0 });
  if (fina) { m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
  m.onBeforeCompile = sh => {
    sh.uniforms.uT = UT; sh.uniforms.uF = UF; sh.uniforms.uH = UH; sh.uniforms.uHole = { value: buraco };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 atr; varying vec4 vAtr; varying vec3 vWP;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvAtr = atr; vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vAtr; varying vec3 vWP; uniform float uT, uF, uH, uHole;\n' + RUIDO + BUMP + `
      vec3 emisT; float hBump; float lavaT;
      void terra(vec3 wp, float graz, out vec3 cor, out float rug, out vec3 em, out float hb){
        float n1 = fbm4(wp.xz * 0.045), n2 = vn(wp.xz * 1.7), n3 = vn(wp.xz * 9.0);
        float campo = smoothstep(150.0, 105.0, length(wp.xz - vec2(-14.0, -6.0)));
        float dc = length(wp - cameraPosition), fd = smoothstep(34.0, 8.0, dc); float sulco = 0.5 + 0.5 * cos(6.2832 * (wp.x + 70.0) / 1.05 + 0.9 * n1 + 0.4 * n2); sulco = mix(0.5, sulco, fd);
        vec3 terraC = mix(vec3(0.38, 0.24, 0.15), vec3(0.54, 0.37, 0.22), n1) * (0.78 + 0.34 * n2 + 0.12 * n3) * mix(1.0, 0.8 + 0.34 * sulco, campo);
        vec3 mato = mix(vec3(0.62, 0.52, 0.27), vec3(0.45, 0.40, 0.20), n1) * (0.82 + 0.36 * n2);
        float g1 = vn(wp.xz * 24.0), g2 = vn(wp.xz * 70.0), g3 = vn(wp.xz * 190.0), fg = smoothstep(42.0, 4.0, dc) * graz, fg2 = smoothstep(14.0, 2.0, dc) * graz;
        float grao = ((g1 - 0.5) * 0.34 + (g2 - 0.5) * 0.30) * fg + (g3 - 0.5) * 0.26 * fg2;
        float torrao = smoothstep(0.74, 0.88, vn(wp.xz * 5.5 + 3.0)) * fg, pedra = smoothstep(0.88, 0.95, vn(wp.xz * 21.0 + 9.0)) * fg;
        vec2 pq = (wp.xz + vec2(13.0, 7.0)) / vec2(46.0, 38.0), pi = floor(pq), pf = fract(pq);
        float hp = h21(pi), borda = smoothstep(0.0, 0.025, pf.x) * smoothstep(1.0, 0.975, pf.x) * smoothstep(0.0, 0.03, pf.y) * smoothstep(1.0, 0.97, pf.y);
        terraC *= mix(0.88, 1.12, hp); terraC = mix(vec3(0.44, 0.34, 0.24), terraC, borda);
        terraC *= 1.0 + grao; terraC = mix(terraC, terraC * 0.62, torrao * 0.6); terraC = mix(terraC, vec3(0.27, 0.24, 0.22) * (0.8 + 0.4 * g2), pedra * 0.7);
        cor = mix(mato, terraC, campo); rug = 0.95; hb = (n3 * 0.4 + n2 * 0.3) * fd + campo * sulco * 0.8 * fd + (grao * 0.7 + torrao * 0.9 + pedra * 1.2) * campo;
        float ci = clamp(vAtr.x * (0.8 + 0.5 * n1), 0.0, 1.0);
        float onda = 0.5 + 0.5 * sin((wp.x * 0.8 + wp.z * 0.35) * 8.0 + 4.0 * n1 + 1.5 * n2);
        cor = mix(cor, vec3(0.27, 0.265, 0.28) * (0.72 + 0.5 * n2) * (0.82 + 0.3 * onda), ci); hb += ci * onda * 0.9 * fd; hb = mix(hb, (n3 * 0.5 + n2 * 0.3) * fd, ci * 0.7);
        float es = clamp(vAtr.z, 0.0, 1.0);
        vec3 escC = mix(vec3(0.07, 0.05, 0.045), vec3(0.22, 0.10, 0.07), n2) * (0.55 + 0.9 * n3) * (1.0 + grao * 1.4);
        cor = mix(cor, escC, es); hb = mix(hb, (n3 * 0.9 + n2 * 0.6) * fd, es);
        float la = smoothstep(0.30 + 0.22 * n2, 0.52 + 0.22 * n2, vAtr.y);
        float t = uT * 0.12, ke = 1.0 + 3.2 * (1.0 - smoothstep(2.0, 26.0, uH)); float f1 = fbm4(wp.xz * 0.30 * ke + vec2(t, -t * 0.7)), f2 = fbm4(wp.xz * 0.9 * ke - vec2(t * 1.4, t)), crack = smoothstep(0.045, 0.0, abs(f1 - 0.5) - 0.004) + 0.5 * smoothstep(0.035, 0.0, abs(f2 - 0.5) - 0.004);
        vec3 crosta = mix(vec3(0.028, 0.024, 0.024), vec3(0.17, 0.075, 0.055), f1) * (0.7 + 0.6 * n3);
        cor = mix(cor, crosta, la); rug = mix(rug, 0.85, la); hb = mix(hb, f1 * 1.2 + n3 * 0.5, la);
        float quenteL = clamp(vAtr.w * 1.25, 0.0, 1.0), derr = clamp(crack * 1.0 + 0.18 * (1.0 - smoothstep(0.30, 0.62, f2)), 0.0, 1.0);
        em = vec3(1.0, 0.36, 0.07) * (la * quenteL * (0.07 + 1.15 * derr) + es * vAtr.w * (0.05 + 1.0 * crack * (0.25 + f1)));
        em += vec3(1.0, 0.72, 0.28) * la * quenteL * derr * derr * derr * 0.35; em *= 0.85;
        // fenda do nascimento: rachadura sinuosa e incandescente no alto do morro recém-aberto (só enquanto ele é pequeno)
        if (uF > 0.001) {
          float xx = wp.x;
          float eixo = 0.20 * sin(xx * 2.3 + 0.7) + 0.09 * sin(xx * 6.1 + 2.0);
          float amp = smoothstep(1.7, 0.8, abs(xx));
          float w = (0.04 + 0.15 * smoothstep(1.4, 0.0, abs(xx))) * (0.7 + 0.6 * vn(vec2(xx * 2.7, 4.0)));
          float dd = abs(wp.z - eixo);
          float f = smoothstep(w, w * 0.15, dd) * amp, halo = smoothstep(w * 3.2, w * 0.8, dd) * amp;
          float pulso = 0.85 + 0.15 * sin(uT * 13.0 + xx * 3.1);
          cor = mix(cor, vec3(0.03, 0.022, 0.018), halo * 0.8 * uF);
          em += (vec3(1.0, 0.42, 0.08) * (f * 3.2 + halo * 0.16) + vec3(1.0, 0.8, 0.45) * f * f * 1.4) * uF * pulso;
        }
        lavaT = la;
      }
    `)
      .replace('#include <color_fragment>', '#include <color_fragment>\n{ vec3 c; float r; float gz = smoothstep(0.04, 0.30, abs(dot(normalize(vNormal), normalize(vViewPosition)))); terra(vWP, gz, c, r, emisT, hBump); diffuseColor.rgb = c; roughnessCorr = r; }')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = roughnessCorr;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += emisT;')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = bumpN(-vViewPosition, normal, hBump, 1.1 * (1.0 - 0.6 * lavaT), faceDirection);');
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'float roughnessCorr = 0.95;\nvoid main() {\n  if (uHole > 0.0 && abs(vWP.x) < uHole && abs(vWP.z) < uHole) discard;');
  };
  m.customProgramCacheKey = () => 'terrenoVulcao'; return m;
}
