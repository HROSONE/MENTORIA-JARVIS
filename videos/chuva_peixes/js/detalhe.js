// Detalhe procedural: sujeira, manchas de chuva, grão e relevo nas superfícies lisas do kit (sem precisar de UV), asfalto com rachaduras e poças,
// e reflexo de verdade (espelho do cenário) nas poças da rua molhada.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

export const UT = { value: 0 };                       // tempo (s), compartilhado por todos os materiais injetados

export const RUIDO = `
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm4(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
float poca(vec2 xz){ float a = smoothstep(0.50, 0.60, fbm4(xz * 0.30 + vec2(7.3, 2.1))); float b = 0.75 * smoothstep(0.58, 0.68, fbm4(xz * 0.85 + vec2(3.3, 9.7))); return max(a, b); }
`;
const BUMP = `
vec3 bumpN(vec3 surfPos, vec3 n, float h, float k, float fd){
  vec2 dH = k * vec2(dFdx(h), dFdy(h));
  vec3 sx = normalize(dFdx(surfPos)), sy = normalize(dFdy(surfPos));
  vec3 r1 = cross(sy, n), r2 = cross(n, sx);
  float det = dot(sx, r1) * fd;
  vec3 g = sign(det) * (dH.x * r1 + dH.y * r2);
  return normalize(abs(det) * n - g);
}`;

// tipo: 'parede' | 'telhado' | 'asfalto' | 'calcada' | 'faixa' | 'terra'
const RECEITAS = {
  parede: {
    cor: `{ vec2 q = vec2(vWP.x + vWP.z, vWP.y); float n1 = fbm4(q * 1.5), n2 = vn(q * 16.0), st = fbm4(vec2(q.x * 3.2, q.y * 0.30)), chao = smoothstep(3.2, 0.0, vWP.y);
      diffuseColor.rgb *= 1.0 + 0.34 * (n1 - 0.5) + 0.10 * (n2 - 0.5) - 0.42 * st * st - 0.38 * chao * (0.4 + n1);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.78, 0.9, 0.82), smoothstep(0.55, 0.9, n1) * chao); }`,
    rug: `roughnessFactor = clamp(roughnessFactor - 0.25 * smoothstep(1.8, 0.0, vWP.y), 0.2, 1.0);`,
    bump: `{ vec2 q = vec2(vWP.x + vWP.z, vWP.y); float hh = vn(q * 16.0) * 0.6 + fbm4(q * 5.0) * 0.4; normal = bumpN(-vViewPosition, normal, hh, 0.9, faceDirection); }`,
  },
  telhado: {
    cor: `{ vec2 q = vWP.xz; float n1 = fbm4(q * 1.1), n2 = vn(q * 12.0), fila = abs(sin(vWP.z * 9.0 + vWP.y * 3.0)); 
      diffuseColor.rgb *= 0.86 + 0.34 * n1 + 0.12 * (n2 - 0.5) - 0.20 * (1.0 - fila); diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.7, 0.85, 0.6), smoothstep(0.62, 0.9, fbm4(q * 2.3)) * 0.6); }`,
    rug: `roughnessFactor = clamp(roughnessFactor - 0.2, 0.2, 1.0);`,
    bump: `{ float hh = abs(sin(vWP.z * 9.0 + vWP.y * 3.0)) * 0.8 + vn(vWP.xz * 12.0) * 0.3; normal = bumpN(-vViewPosition, normal, hh, 1.1, faceDirection); }`,
  },
  asfalto: {
    cor: `{ vec2 q = vWP.xz; float g1 = vn(q * 38.0), g2 = vn(q * 95.0), n1 = fbm4(q * 0.9), cr = smoothstep(0.035, 0.0, abs(fbm4(q * 0.55 + 4.0) - 0.5) - 0.012), p = poca(q), remendo = smoothstep(0.55, 0.62, fbm4(q * 0.22 + 11.0));
      diffuseColor.rgb *= (0.78 + 0.5 * g1 + 0.3 * g2) * (0.86 + 0.3 * n1) * (1.0 - 0.55 * cr) * mix(1.0, 0.72, remendo) * mix(1.0, 0.8, p); }`,
    rug: `{ float p = poca(vWP.xz); roughnessFactor = mix(clamp(roughnessFactor + 0.28 * vn(vWP.xz * 38.0), 0.0, 1.0), 0.07, p); }`,
    bump: `{ vec2 q = vWP.xz; float hh = vn(q * 38.0) * 0.55 + vn(q * 95.0) * 0.35 - 1.2 * smoothstep(0.035, 0.0, abs(fbm4(q * 0.55 + 4.0) - 0.5) - 0.012); normal = bumpN(-vViewPosition, normal, hh, 0.9 * (1.0 - poca(q)), faceDirection); }`,
  },
  calcada: {
    cor: `{ vec2 q = vWP.xz; float n1 = fbm4(q * 1.3), g = vn(q * 30.0), junta = smoothstep(0.06, 0.0, min(abs(fract(q.x * 0.5) - 0.5), abs(fract(q.y * 0.5) - 0.5)) - 0.44) ;
      diffuseColor.rgb *= (0.82 + 0.32 * n1 + 0.22 * g) * (1.0 - 0.35 * junta) * mix(1.0, 0.7, smoothstep(0.5, 0.65, fbm4(q * 0.4 + 5.0))); }`,
    rug: `roughnessFactor = clamp(roughnessFactor - 0.28 + 0.2 * vn(vWP.xz * 20.0), 0.12, 1.0);`,
    bump: `{ vec2 q = vWP.xz; float hh = vn(q * 30.0) * 0.5 - 0.9 * smoothstep(0.06, 0.0, min(abs(fract(q.x * 0.5) - 0.5), abs(fract(q.y * 0.5) - 0.5)) - 0.44); normal = bumpN(-vViewPosition, normal, hh, 0.8, faceDirection); }`,
  },
  faixa: {
    cor: `{ vec2 q = vWP.xz; float g = vn(q * 25.0), desgaste = smoothstep(0.40, 0.7, fbm4(q * 2.2)); diffuseColor.rgb *= 0.55 + 0.5 * g * (1.0 - 0.5 * desgaste) - 0.15 * desgaste; }`,
    rug: ``, bump: ``,
  },
  terra: {
    cor: `{ vec2 q = vWP.xz; float n = fbm4(q * 0.7), g = vn(q * 40.0); diffuseColor.rgb *= 0.7 + 0.6 * n + 0.2 * g; }`,
    rug: ``, bump: `{ float hh = vn(vWP.xz * 40.0) * 0.6 + fbm4(vWP.xz * 3.0) * 0.4; normal = bumpN(-vViewPosition, normal, hh, 0.7, faceDirection); }`,
  },
};

export function detalhar(mat, tipo, { forca = 1 } = {}) {
  const r = RECEITAS[tipo]; if (!r || mat.userData.detalhado) return mat;
  mat.userData.detalhado = tipo;
  mat.onBeforeCompile = sh => {
    sh.uniforms.uT = UT;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform float uT;\n' + RUIDO + BUMP)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + r.cor)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n' + r.rug)
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + r.bump);
  };
  mat.customProgramCacheKey = () => 'det_' + tipo;
  mat.needsUpdate = true;
  return mat;
}

// aplica o detalhe pelo nome do material do kit
const MAPA = { Rodape: 'parede', ParedeRosa: 'parede', ParedeBranca: 'parede', ParedeAmarela: 'parede', ParedeVermelha: 'parede', ParedeTijolo: 'parede', ParedeCinza: 'parede', ParedeGrafite: 'parede', ConcretoClaro: 'parede', Laje: 'parede',
  Calcada: 'calcada', CalcadaLado: 'calcada', MeioFio: 'calcada', FaixaAmarela: 'faixa', FaixaBranca: 'faixa' };
export function detalharKit(raiz, { telhas = [] } = {}) {
  raiz.traverse(m => {
    if (!m.isMesh) return;
    const arr = Array.isArray(m.material) ? m.material : [m.material];
    const novo = arr.map(k => {
      let t = MAPA[k.name];
      if (m.name === 'Asfalto') t = 'asfalto';
      if (/^Telhado/.test(m.name) && k.name !== 'BrancoPuro') t = 'telhado';
      if (!t) return k;
      const c = k.userData.detalhado ? k : k.clone(); return detalhar(c, t);
    });
    m.material = Array.isArray(m.material) ? novo : novo[0];
  });
}

// reflexo nas poças: um plano espelho transparente logo acima do asfalto; a opacidade vem da máscara de poças e do ângulo (Fresnel)
export function criarReflexoPocas({ w = 540, h = 960, largura = 60, comprimento = 120, centro = [0, 0, 0], intens = 1.0, molhado = 0.12, y = 0.007 } = {}) {
  const sh = {
    name: 'PocasShader',
    uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, uT: UT, intens: { value: intens }, molhado: { value: molhado } },
    vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vWP;
      void main(){ vUv = textureMatrix * vec4(position, 1.0); vWP = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; uniform float uT, intens, molhado; varying vec4 vUv; varying vec3 vWP;
      ${RUIDO}
      void main(){
        float m = max(poca(vWP.xz), molhado);
        vec2 d = vec2(vn(vWP.xz * 11.0 + uT * 0.8), vn(vWP.xz * 11.0 + 31.0 - uT * 0.7)) - 0.5;
        vec4 uv = vUv; uv.xy += d * 0.05 * uv.w * (0.35 + m);
        vec3 refl = texture2DProj(tDiffuse, uv).rgb;
        vec3 V = normalize(cameraPosition - vWP); float f = 0.14 + 0.86 * pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);
        float a = clamp(m * f * intens, 0.0, 0.92);
        gl_FragColor = vec4(refl * color, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  };
  const r = new Reflector(new THREE.PlaneGeometry(largura, comprimento), { textureWidth: w, textureHeight: h, clipBias: 0.003, shader: sh, multisample: 0, color: 0xffffff });
  r.rotation.x = -Math.PI / 2; r.position.set(centro[0], y, centro[2]);
  r.material.transparent = true; r.material.depthWrite = false; r.renderOrder = 2;
  return r;
}

// tecido/pele de personagem: ruído em coordenadas do objeto (acompanha o esqueleto): dobras de capa e leve variação de cor
export function tecidoObj(mat, { forca = 1 } = {}) {
  mat.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP;\n' + RUIDO + BUMP)
      .replace('#include <color_fragment>', '#include <color_fragment>\n{ float n = fbm4(vOP.xy * 9.0 + vOP.z * 5.0), e = vn(vOP.xz * 60.0 + vOP.y * 40.0); diffuseColor.rgb *= 0.86 + 0.26 * n + 0.06 * e; }')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n{ float hh = fbm4(vOP.xy * 11.0 + vOP.z * 7.0) * 0.8 + vn(vOP.xz * 70.0 + vOP.y * 50.0) * 0.2; normal = bumpN(-vViewPosition, normal, hh, 1.2, faceDirection); }');
  };
  mat.customProgramCacheKey = () => 'tecidoObj'; mat.needsUpdate = true; return mat;
}
