// Detalhe procedural da cidade: o Kit aplica isto sozinho em toda peça (asfalto, calçada, grama, paredes, telhas, vidro, água...),
// então nenhum vídeo precisa refazer "mais detalhes" nos cenários. As peças do kit são cores chapadas e sem UV; aqui o relevo, a sujeira e o
// desgaste vêm de shaders em COORDENADAS DO MUNDO (os padrões continuam de uma peça para a próxima: trinca, mancha e poça atravessam ladrilhos).
//
//   import { Kit } from './kit.js';           const kit = await Kit.carregar();      // detalhe ligado por padrão (Kit.carregar(base, { detalhe: false }) desliga)
//   kit.ambiente({ molhado: 0.8, chuva: 1 });  // rua molhada: escurece, poças com reflexo do céu e anéis de chuva
//   kit.ambiente({ ceuTopo: '#1a2a5a', ceuHorizonte: '#3a4a80', solDir: [0.3, 0.5, 0.2], solCor: '#aab8ff' });   // cor do céu refletido (poças, vidro, metal)
//   kit.tempo(t);                              // anima poças, chuva e água (escreve UT.value; em vídeo chame com o tempo do quadro)
//   import { criarAgua } from './detalhe.js';  // lago, rio, mar ou piscina com ondas, reflexo do céu, cor por profundidade e espuma
//
// Cada receita tem quatro ganchos de GLSL injetados no MeshStandardMaterial: cor (albedo), rug (rugosidade), bump (normal) e emi (reflexo do céu).
// O detalhe fino some sozinho com a distância (aa(): usa a derivada do pixel), então não cintila nem faz moiré em vídeo.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

export const UT = { value: 0 };                                        // tempo (s) compartilhado por todos os materiais detalhados

// ambiente global lido por todos os materiais detalhados (uniforms compartilhados: mudar aqui muda a cidade inteira)
export const AMB = {
  molhado: { value: 0 },                                               // 0 seco .. 1 encharcado
  chuva: { value: 0 },                                                 // 0..1: anéis de chuva nas poças
  sujeira: { value: 1 },                                               // 0 cidade nova .. 1 gasta (manchas, desgaste)
  ceuTopo: { value: new THREE.Color('#4f86d8') },
  ceuHor: { value: new THREE.Color('#bcd8f2') },
  solDir: { value: new THREE.Vector3(-0.5, 0.75, 0.4).normalize() },
  solCor: { value: new THREE.Color('#fff1d8') },
};
export function ambiente(o = {}) {
  if ('molhado' in o) AMB.molhado.value = o.molhado;
  if ('chuva' in o) AMB.chuva.value = o.chuva;
  if ('sujeira' in o) AMB.sujeira.value = o.sujeira;
  if ('ceuTopo' in o) AMB.ceuTopo.value.set(o.ceuTopo);
  if ('ceuHorizonte' in o) AMB.ceuHor.value.set(o.ceuHorizonte);
  if ('solDir' in o) AMB.solDir.value.set(...o.solDir).normalize();
  if ('solCor' in o) AMB.solCor.value.set(o.solCor);
}

// ------------------------------------------------------------------------------------------------ GLSL: ruído, relevo, céu analítico
export const RUIDO = `
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 h22(vec2 p){ return vec2(h21(p), h21(p + 17.13)); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm4(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
float fbm3(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++) { s += a * vn(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
vec2 cel(vec2 p, out float id){ vec2 i = floor(p), f = fract(p); float d1 = 9.0, d2 = 9.0; id = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 r = g + h22(i + g) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = h21(i + g + 7.7); } else if (d < d2) d2 = d; }
  return sqrt(vec2(d1, d2)); }
float poca(vec2 xz){ float a = smoothstep(0.50, 0.60, fbm4(xz * 0.30 + vec2(7.3, 2.1))); float b = 0.75 * smoothstep(0.58, 0.68, fbm4(xz * 0.85 + vec2(3.3, 9.7))); return max(a, b); }
`;
export const BUMP = `
vec3 bumpN(vec3 surfPos, vec3 n, float h, float k, float fd){
  vec2 dH = k * vec2(dFdx(h), dFdy(h));
  vec3 sx = normalize(dFdx(surfPos)), sy = normalize(dFdy(surfPos));
  vec3 r1 = cross(sy, n), r2 = cross(n, sx);
  float det = dot(sx, r1) * fd;
  vec3 g = sign(det) * (dH.x * r1 + dH.y * r2);
  return normalize(abs(det) * n - g);
}`;
const COMUM = `
varying vec3 vWP; varying vec3 vWN; varying vec3 vOP; varying vec3 vJan;
uniform float uT, uMolhado, uChuva, uSujeira; uniform vec3 uCeuTopo, uCeuHor, uSolDir, uSolCor;
float gPX = 0.01, gPoca = 0.0, gMol = 0.0, gUmid = 0.0;
float aa(float lam){ return smoothstep(gPX * 1.2, gPX * 5.0, lam); }                       // 0 quando o detalhe é menor que ~um pixel (sem cintilar)
vec3 ceu(vec3 d){ float s = max(dot(d, uSolDir), 0.0); vec3 c = mix(uCeuHor, uCeuTopo, pow(clamp(d.y, 0.0, 1.0), 0.55)); c += uSolCor * (pow(s, 28.0) * 0.30 + pow(s, 400.0) * 4.0);
  return d.y < 0.0 ? mix(uCeuHor, uCeuHor * 0.2, clamp(-d.y * 3.0, 0.0, 1.0)) : c; }
vec2 planoUV(vec3 p, vec3 n){ if (abs(n.y) > 0.7) return p.xz; vec2 t = normalize(vec2(-n.z, n.x) + vec2(1e-5)); return vec2(dot(p.xz, t), p.y); }   // coordenadas no plano da parede (contínuas entre peças)
float fres(float c){ return 0.02 + 0.98 * pow(1.0 - clamp(c, 0.0, 1.0), 5.0); }
float aneis(vec2 q, float t){ vec2 i = floor(q / 0.55); float h = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 c = i + vec2(float(x), float(y)); vec2 pos = (c + h22(c)) * 0.55;
    float ph = fract(t * (0.55 + 0.8 * h21(c + 3.3)) + h21(c + 9.1)), r = length(q - pos), rad = ph * 0.30, w = exp(-pow((r - rad) / 0.02, 2.0));
    h += w * (1.0 - ph) * sin((r - rad) * 95.0); }
  return h; }
float gLuzJan = 1.0, gCobre = 0.0; vec3 gCorJan = vec3(1.0);
vec3 interiorJan(vec3 j){                                                                      // j = (id da janela, u, v no pano de vidro); id < 0: vidro comum
  gLuzJan = 1.0; gCobre = 0.0; gCorJan = vec3(1.0); if (j.x < 0.0) return vec3(0.0);
  float h = fract(j.x * 37.719), tipo = fract(j.x * 11.31), u = j.y, v = j.z;
  vec3 pal = h < 0.25 ? vec3(0.85, 0.78, 0.62) : (h < 0.5 ? vec3(0.62, 0.74, 0.86) : (h < 0.75 ? vec3(0.8, 0.5, 0.4) : vec3(0.9, 0.9, 0.88)));
  if (tipo < 0.34) { float ab = 0.18 + 0.2 * fract(j.x * 5.7), ca = step(u, ab + 0.03 * sin(v * 20.0)) + step(1.0 - ab - 0.03 * sin(v * 20.0 + 2.0), u);
    gCobre = clamp(ca, 0.0, 1.0); gLuzJan = mix(0.45, 1.0, gCobre); gCorJan = mix(vec3(1.0), pal * 1.1 + 0.15, gCobre * 0.8); return pal * (0.75 + 0.25 * sin(u * 70.0 + v * 3.0)); }
  if (tipo < 0.62) { float q = 0.35 + 0.65 * fract(j.x * 3.9), em = step(1.0 - q, v), rip = 0.55 + 0.45 * (0.5 + 0.5 * sin(v * 90.0));
    gCobre = em; gLuzJan = mix(0.45, 0.9, em * rip); gCorJan = mix(vec3(1.0), vec3(1.0, 0.95, 0.85), em * 0.6); return vec3(0.82, 0.82, 0.78) * rip; }
  if (tipo < 0.76) { gCobre = 1.0; gLuzJan = 0.85; gCorJan = pal * 1.1 + 0.15; return pal * (0.7 + 0.3 * sin(u * 60.0)); }
  gLuzJan = 0.5; return vec3(0.0); }
vec3 reflexoCeu(vec3 nView){ vec3 V = normalize(cameraPosition - vWP); vec3 Nw = inverseTransformDirection(nView, viewMatrix); return ceu(reflect(-V, Nw)) * fres(dot(Nw, V)); }
`;

// ------------------------------------------------------------------------------------------------ receitas por tipo de superfície
const R = {};

// ---- ruas
R.asfalto = {
  cor: `{ gPX = length(fwidth(vWP)) + 1e-5; vec2 q = vWP.xz;
    float gr = mix(0.5, vn(q * 170.0) * 0.5 + vn(q * 62.0) * 0.5, aa(0.012));                          // brita
    float n0 = fbm4(q * 0.11), n1 = fbm4(q * 0.8 + 3.1);
    float tr = (1.0 - smoothstep(0.0, 0.03, abs(fbm4(q * 0.45 + 4.0) - 0.5) - 0.005)) * aa(0.01);    // trinca longa e fina
    float idj; vec2 ce = cel(q * 0.75 + 5.0, idj);
    float jaca = (1.0 - smoothstep(0.0, 0.05, ce.y - ce.x - 0.012)) * smoothstep(0.6, 0.72, fbm4(q * 0.18 + 9.0)) * aa(0.012);   // couro de jacaré em manchas
    vec2 gp = q / vec2(8.0, 5.5) + 3.7; vec2 ip = floor(gp), fp = fract(gp) + 0.05 * (vec2(vn(q * 2.1), vn(q * 2.1 + 9.0)) - 0.5); float sorteio = step(0.93, h21(ip));
    float rem = sorteio * step(0.05, fp.x) * step(fp.x, 0.95) * step(0.07, fp.y) * step(fp.y, 0.93);          // remendo de reparo (mais escuro)
    float borda = sorteio * (1.0 - rem) * step(0.02, fp.x) * step(fp.x, 0.98) * step(0.03, fp.y) * step(fp.y, 0.97);   // selagem na beira do remendo
    float oleo = smoothstep(0.66, 0.9, fbm4(q * 0.55 + 21.0));
    float esp = smoothstep(0.9, 0.97, vn(q * 210.0)) * aa(0.007) + 0.6 * smoothstep(0.88, 0.96, vn(q * 95.0 + 4.0)) * aa(0.012);    // pedrinhas claras
    vec3 c = diffuseColor.rgb * 1.5 * (0.78 + 0.5 * gr + 0.9 * esp) * (0.78 + 0.5 * n0) * (0.92 + 0.16 * n1);
    c *= 1.0 - (0.7 * tr + 0.4 * jaca) * uSujeira; c = mix(c, c * 0.74, rem); c = mix(c, c * 0.5, borda * 0.8); c *= 1.0 - 0.5 * oleo * uSujeira;
    gMol = uMolhado; gPoca = poca(q) * smoothstep(0.12, 0.55, uMolhado);
    c *= mix(1.0, 0.6, gMol); c *= mix(1.0, 0.72, gPoca); diffuseColor.rgb = c; }`,
  rug: `{ float r0 = clamp(roughnessFactor + 0.2 * vn(vWP.xz * 40.0) - 0.05, 0.0, 1.0); roughnessFactor = mix(r0, 0.32, gMol * 0.85); roughnessFactor = mix(roughnessFactor, 0.035, gPoca); }`,
  bump: `{ vec2 q = vWP.xz; float h = (vn(q * 170.0) * 0.5 + vn(q * 62.0) * 0.5) * 0.5 * aa(0.012) - 1.4 * (1.0 - smoothstep(0.0, 0.03, abs(fbm4(q * 0.45 + 4.0) - 0.5) - 0.005)) * aa(0.01);
    if (uChuva * gPoca > 0.02) h += aneis(q, uT) * 0.15 * uChuva * gPoca;
    normal = bumpN(-vViewPosition, normal, h, 0.85 * (1.0 - 0.5 * gPoca) + 3.0 * uChuva * gPoca, faceDirection); }`,
  emi: `{ totalEmissiveRadiance += reflexoCeu(normal) * (gPoca * 0.9 + gMol * 0.18); }`,
};
R.asfaltoReta = { ...R.asfalto, cor: R.asfalto.cor.replace('    gMol = uMolhado; gPoca = poca(q)', `    { float ax = abs(vOP.x), eixo = abs(ax - 1.75);
      float trilha = 1.0 - smoothstep(0.12, 0.3, abs(eixo - 0.82)), centroF = 1.0 - smoothstep(0.0, 0.22, eixo), sarjeta = smoothstep(2.9, 3.35, ax) * (1.0 - smoothstep(3.4, 3.6, ax));
      c = mix(c, c * 0.62, trilha * (0.4 + 0.6 * fbm4(q * 0.5)) * uSujeira);                                          // pneus polem duas trilhas por faixa
      c *= 1.0 - 0.4 * centroF * smoothstep(0.5, 0.78, vn(vec2(vOP.z * 1.2, vOP.x * 3.0))) * uSujeira;               // pingos de óleo
      c = mix(c, c * vec3(1.35, 1.25, 1.1) + 0.012, sarjeta * (0.5 + 0.5 * fbm4(q * 1.6)) * uSujeira); }            // areia e poeira na sarjeta
    gMol = uMolhado; gPoca = poca(q)`) };
R.acostamento = { cor: R.asfalto.cor.replace('diffuseColor.rgb * (0.82', 'diffuseColor.rgb * vec3(1.12, 1.08, 1.0) * (0.82'), rug: R.asfalto.rug, bump: R.asfalto.bump, emi: R.asfalto.emi };
R.faixa = {                                                                                    // tinta de sinalização: gasta, esfarelada, com asfalto aparecendo
  cor: `{ gPX = length(fwidth(vWP)) + 1e-5; vec2 q = vWP.xz; float gr = mix(0.5, vn(q * 90.0), aa(0.02)), gasto = smoothstep(0.38, 0.72, fbm4(q * 2.4 + 1.7)) * uSujeira, falha = smoothstep(0.55, 0.62, vn(q * 26.0) * 0.6 + fbm4(q * 6.0) * 0.4) * gasto;
    vec3 c = diffuseColor.rgb * (0.78 + 0.3 * gr) * (1.0 - 0.28 * gasto); c = mix(c, vec3(0.045, 0.045, 0.05) , falha * 0.85);
    gMol = uMolhado; c *= mix(1.0, 0.72, gMol); diffuseColor.rgb = c; }`,
  rug: `{ roughnessFactor = mix(clamp(roughnessFactor + 0.1, 0.0, 1.0), 0.28, gMol * 0.8); }`,
  bump: `{ float h = vn(vWP.xz * 90.0) * 0.4 * aa(0.02); normal = bumpN(-vViewPosition, normal, h, 0.6, faceDirection); }`,
  emi: `{ totalEmissiveRadiance += reflexoCeu(normal) * gMol * 0.12; }`,
};
R.meiofio = {                                                                                  // concreto com juntas a cada 2 m, lascas, sujeira de pneu na base e lama
  cor: `{ gPX = length(fwidth(vWP)) + 1e-5; vec3 n = normalize(vWN); vec2 uv = planoUV(vWP, n); float ao = abs(n.y) > 0.7 ? vWP.x + vWP.z : uv.x;
    float gr = mix(0.5, vn(uv * 120.0) * 0.5 + vn(uv * 40.0) * 0.5, aa(0.015)), n0 = fbm4(uv * 0.8), junta = 1.0 - smoothstep(0.004, 0.012 + gPX, abs(fract(ao / 2.0 + 0.5) - 0.5) * 2.0);
    float baixo = 1.0 - smoothstep(0.15, 0.32, vWP.y), lasca = smoothstep(0.72, 0.8, vn(uv * 14.0 + 3.0)) * aa(0.03);
    vec3 c = diffuseColor.rgb * (0.82 + 0.3 * gr) * (0.84 + 0.3 * n0); c *= 1.0 - 0.5 * junta; c = mix(c, c * vec3(0.5, 0.48, 0.44), baixo * (0.4 + 0.4 * fbm4(uv * 5.0)) * uSujeira); c *= 1.0 - 0.35 * lasca;
    gMol = uMolhado; c *= mix(1.0, 0.72, gMol); diffuseColor.rgb = c; }`,
  rug: `{ roughnessFactor = mix(clamp(roughnessFactor + 0.12 * vn(vWP.xz * 40.0), 0.0, 1.0), 0.4, gMol * 0.7); }`,
  bump: `{ vec3 n = normalize(vWN); vec2 uv = planoUV(vWP, n); float h = (vn(uv * 120.0) * 0.5 + vn(uv * 40.0) * 0.5) * 0.45 * aa(0.015); normal = bumpN(-vViewPosition, normal, h, 0.8, faceDirection); }`,
  emi: `{ totalEmissiveRadiance += reflexoCeu(normal) * gMol * 0.12; }`,
};
R.calcada = {                                                                                  // lajes de 1,4 m com juntas, mato nas juntas, manchas, chiclete e rachaduras
  cor: `{ gPX = length(fwidth(vWP)) + 1e-5; vec2 q = vWP.xz, gs = q / 1.4, is = floor(gs), fs = fract(gs);
    float jd = min(min(fs.x, 1.0 - fs.x), min(fs.y, 1.0 - fs.y)) * 1.4, junta = 1.0 - smoothstep(0.008, 0.026 + gPX, jd);
    float t = h21(is), gr = mix(0.5, vn(q * 95.0) * 0.5 + vn(q * 32.0) * 0.5, aa(0.015)), n0 = fbm4(q * 0.35), n1 = fbm4(q * 2.3);
    float rach = (1.0 - smoothstep(0.0, 0.02, abs(fs.x * 0.8 + fs.y * 0.6 - 0.5 + 0.2 * vn(q * 7.0)) - 0.006)) * step(0.82, h21(is + 4.4)) * aa(0.01);
    float chicle = smoothstep(0.935, 0.96, vn(q * 26.0 + 5.0)) * aa(0.02), mancha = smoothstep(0.55, 0.78, fbm4(q * 0.7 + 8.0));
    float mato = junta * smoothstep(0.55, 0.8, vn(q * 38.0)) * (0.4 + 0.6 * uSujeira) * aa(0.02);
    vec3 c = diffuseColor.rgb * (0.9 + 0.2 * t) * (0.84 + 0.3 * gr) * (0.84 + 0.3 * n0) * (0.95 + 0.1 * n1);
    c *= 1.0 - 0.42 * junta; c *= 1.0 - 0.35 * mancha * uSujeira; c *= 1.0 - 0.6 * rach; c = mix(c, vec3(0.05, 0.045, 0.04), chicle * 0.8); c = mix(c, vec3(0.05, 0.13, 0.025), mato * 0.85);
    gMol = uMolhado; gPoca = poca(q * 0.8 + 5.0) * smoothstep(0.35, 0.9, uMolhado) * 0.6; c *= mix(1.0, 0.68, gMol); c *= mix(1.0, 0.8, gPoca); diffuseColor.rgb = c; }`,
  rug: `{ float r0 = clamp(roughnessFactor - 0.3 + 0.25 * vn(vWP.xz * 22.0), 0.12, 1.0); roughnessFactor = mix(r0, 0.3, gMol * 0.8); roughnessFactor = mix(roughnessFactor, 0.04, gPoca); }`,
  bump: `{ vec2 q = vWP.xz, gs = q / 1.4, fs = fract(gs); float jd = min(min(fs.x, 1.0 - fs.x), min(fs.y, 1.0 - fs.y)) * 1.4, h = (vn(q * 95.0) * 0.5 + vn(q * 32.0) * 0.5) * 0.5 * aa(0.015) - 1.2 * (1.0 - smoothstep(0.008, 0.026 + gPX, jd));
    if (uChuva * gPoca > 0.02) h += aneis(q, uT) * 0.15 * uChuva * gPoca; normal = bumpN(-vViewPosition, normal, h, 0.8 + 3.0 * uChuva * gPoca, faceDirection); }`,
  emi: `{ totalEmissiveRadiance += reflexoCeu(normal) * (gPoca * 0.9 + gMol * 0.15); }`,
};
R.calcadaLado = { cor: R.meiofio.cor, rug: R.meiofio.rug, bump: R.meiofio.bump, emi: R.meiofio.emi };

// ---- chão
R.grama = {                                                                                    // tufos e folhas, pontas claras, faixas do cortador, manchas secas e viçosas, falhas de terra com seixos e flores
  cor: `{ gPX = length(fwidth(vWP)) + 1e-5; vec2 q = vWP.xz; float n0 = fbm4(q * 0.07), n1 = fbm4(q * 0.45 + 2.0), n2 = fbm4(q * 1.6 + 7.0);
    float tufo = mix(0.5, vn(q * 14.0) * 0.5 + vn(q * 38.0) * 0.5, aa(0.03));
    float lam = mix(0.5, vn(q * 280.0) * 0.5 + vn(q * 110.0) * 0.5, aa(0.008));
    float corte = 0.5 + 0.5 * sin(dot(q, vec2(0.94, 0.34)) * 5.2 + 1.4 * n0);
    vec3 verde = diffuseColor.rgb; vec3 seco = verde * vec3(1.55, 1.25, 0.55), trevo = verde * vec3(0.75, 1.18, 0.7);
    vec3 c = mix(verde, seco, smoothstep(0.45, 0.66, n0) * 0.85); c = mix(c, trevo, smoothstep(0.52, 0.72, n1) * 0.6);
    c *= (0.6 + 0.8 * lam) * (0.76 + 0.5 * tufo) * (0.82 + 0.36 * n2) * (0.94 + 0.12 * corte);
    c += vec3(0.07, 0.085, 0.012) * smoothstep(0.78, 0.95, vn(q * 150.0 + 3.0)) * aa(0.01);                      // pontas das folhas ao sol
    c *= 1.0 - 0.55 * smoothstep(0.8, 0.94, vn(q * 95.0 + 11.0)) * aa(0.01);                                       // falhas escuras entre as folhas
    float perto = 1.0 - smoothstep(60.0, 260.0, length(cameraPosition - vWP));
    float terra = smoothstep(0.70, 0.78, fbm4(q * 0.3 + 7.0) + 0.15 * vn(q * 6.0)) * perto; float seixo = smoothstep(0.82, 0.9, vn(q * 22.0)) * terra;
    c = mix(c, vec3(0.2, 0.12, 0.06) * (0.7 + 0.6 * vn(q * 45.0)), terra * 0.9); c = mix(c, vec3(0.28, 0.26, 0.24), seixo * 0.7);
    vec2 fc = floor(q * 12.0); float fl = step(0.992, h21(fc)) * (1.0 - smoothstep(0.1, 0.17, length(fract(q * 12.0) - 0.5 - 0.2 * (h22(fc) - 0.5)))) * (1.0 - terra) * aa(0.03) * perto;
    vec3 corF = h21(fc + 5.1) < 0.4 ? vec3(0.95, 0.95, 0.9) : (h21(fc + 5.1) < 0.7 ? vec3(0.95, 0.75, 0.1) : vec3(0.5, 0.2, 0.7)); c = mix(c, corF, fl);
    gMol = uMolhado; c *= mix(1.0, 0.7, gMol); diffuseColor.rgb = c; gPoca = 0.0; }`,
  rug: `{ roughnessFactor = clamp(roughnessFactor - 0.12 * gMol, 0.4, 1.0); }`,
  bump: `{ vec2 q = vWP.xz; float h = (vn(q * 280.0) * 0.35 + vn(q * 110.0) * 0.25 + vn(q * 38.0) * 0.25 + vn(q * 14.0) * 0.4) * aa(0.01); normal = bumpN(-vViewPosition, normal, h, 1.1, faceDirection); }`,
  emi: ``,
};
R.terra = {
  cor: `{ gPX = length(fwidth(vWP)) + 1e-5; vec2 q = vWP.xz; float n = fbm4(q * 0.5), g = mix(0.5, vn(q * 120.0) * 0.5 + vn(q * 40.0) * 0.5, aa(0.01)), seixo = smoothstep(0.8, 0.88, vn(q * 20.0));
    float idj; vec2 ce = cel(q * 0.9, idj); float rach = (1.0 - smoothstep(0.0, 0.05, ce.y - ce.x - 0.01)) * smoothstep(0.45, 0.6, fbm4(q * 0.15)) * aa(0.012);
    vec3 c = diffuseColor.rgb * (0.7 + 0.55 * n) * (0.75 + 0.5 * g); c = mix(c, vec3(0.3, 0.28, 0.25), seixo * 0.6); c *= 1.0 - 0.5 * rach; gMol = uMolhado; c *= mix(1.0, 0.65, gMol); diffuseColor.rgb = c; gPoca = 0.0; }`,
  rug: ``,
  bump: `{ vec2 q = vWP.xz; float h = (vn(q * 120.0) * 0.4 + vn(q * 40.0) * 0.4 + vn(q * 20.0) * 0.3) * aa(0.01); normal = bumpN(-vViewPosition, normal, h, 0.8, faceDirection); }`,
  emi: ``,
};

// ---- paredes (as coordenadas seguem o plano da parede: não dependem do giro da peça)
const SUJEIRA_PAREDE = `
    float chao = 1.0 - smoothstep(0.15, 0.9, vWP.y - 0.15);
    float umid = chao * (0.45 + 0.55 * fbm4(vec2(uv.x * 3.2, 0.5)));
    float respingo = (1.0 - smoothstep(0.0, 0.5, vWP.y - 0.15)) * (0.4 + 0.6 * vn(uv * 18.0));
    float escorre = fbm4(vec2(uv.x * 5.0, uv.y * 0.22 + 3.0));`;
R.reboco = {
  cor: `{ gPX = length(fwidth(vWP)) + 1e-5; vec3 n = normalize(vWN); vec2 uv = planoUV(vWP, n); bool piso = abs(n.y) > 0.7;
    ${SUJEIRA_PAREDE}
    float gr = mix(0.5, vn(uv * 110.0) * 0.5 + vn(uv * 38.0) * 0.5, aa(0.012)), desempena = fbm4(uv * 2.0), manchas = fbm4(uv * 0.9 + 4.0);
    float rach = (1.0 - smoothstep(0.0, 0.025, abs(fbm4(uv * 0.8 + 11.0) - 0.5) - 0.004)) * smoothstep(0.45, 0.62, fbm4(uv * 0.18 + 2.0)) * aa(0.008);
    float desc = smoothstep(0.74, 0.8, fbm4(uv * 1.6 + 6.0) + 0.12 * vn(uv * 9.0)) * (0.3 + 0.7 * smoothstep(0.1, 0.8, umid + escorre * 0.3)) * uSujeira;   // tinta descascando
    vec3 base = diffuseColor.rgb, reb = vec3(0.45, 0.42, 0.38);
    vec3 c = base * (0.9 + 0.2 * gr) * (0.93 + 0.14 * desempena) * (0.9 + 0.2 * manchas);
    c *= 1.0 - 0.34 * smoothstep(0.45, 0.8, escorre) * (piso ? 0.0 : 1.0) * uSujeira;                                            // faixas de chuva
    c = mix(c, c * vec3(0.55, 0.6, 0.5), umid * 0.55 * uSujeira); c = mix(c, c * vec3(0.5, 0.47, 0.43), respingo * 0.55 * uSujeira);
    float musgo = umid * smoothstep(0.55, 0.78, fbm4(uv * 3.5 + 9.0)) * uSujeira; c = mix(c, vec3(0.06, 0.15, 0.04), musgo * 0.45);
    c = mix(c, reb * (0.8 + 0.4 * gr), desc * 0.9); c *= 1.0 - 0.6 * rach * uSujeira;
    gMol = uMolhado; c *= mix(1.0, 0.82, gMol * (piso ? 0.4 : 0.55)); diffuseColor.rgb = c; gPoca = 0.0; }`,
  rug: `{ roughnessFactor = clamp(roughnessFactor - 0.2 * gMol, 0.3, 1.0); }`,
  bump: `{ vec3 n = normalize(vWN); vec2 uv = planoUV(vWP, n); float h = (vn(uv * 110.0) * 0.45 + vn(uv * 38.0) * 0.35) * aa(0.012) + fbm4(uv * 2.0) * 0.5 - 1.5 * (1.0 - smoothstep(0.0, 0.025, abs(fbm4(uv * 0.8 + 11.0) - 0.5) - 0.004)) * aa(0.008);
    normal = bumpN(-vViewPosition, normal, h, 0.8, faceDirection); }`,
  emi: ``,
};
R.tinta = {                                                                                    // molduras e peças brancas: tinta lisa com sujeira leve e arranhões
  cor: `{ gPX = length(fwidth(vWP)) + 1e-5; vec3 n = normalize(vWN); vec2 uv = planoUV(vWP, n);
    ${SUJEIRA_PAREDE}
    float gr = mix(0.5, vn(uv * 140.0), aa(0.01)); vec3 c = diffuseColor.rgb * (0.94 + 0.1 * gr) * (0.92 + 0.14 * fbm4(uv * 1.3));
    c = mix(c, c * vec3(0.62, 0.6, 0.55), (0.35 * smoothstep(0.5, 0.85, escorre) + 0.4 * respingo) * uSujeira); gMol = uMolhado; diffuseColor.rgb = c; gPoca = 0.0; }`,
  rug: ``, bump: ``, emi: ``,
};
R.tijolo = {                                                                                   // fiadas de tijolo com junta de argamassa, tom por tijolo, mofo e manchas
  cor: `{ gPX = length(fwidth(vWP)) + 1e-5; vec3 n = normalize(vWN); vec2 uv = planoUV(vWP, n);
    ${SUJEIRA_PAREDE}
    float rr = uv.y / 0.075, row = floor(rr), fr = fract(rr); float cc = uv.x / 0.24 + 0.5 * mod(row, 2.0), col = floor(cc), fc = fract(cc);
    float md = min(min(fr, 1.0 - fr) * 0.075, min(fc, 1.0 - fc) * 0.24), argam = (1.0 - smoothstep(0.0035, 0.0065 + gPX, md)) * aa(0.03);
    float t = h21(vec2(col, row)), g = vn(uv * 70.0);
    vec3 tij = diffuseColor.rgb * (0.65 + 0.7 * t) * mix(vec3(1.0), vec3(1.15, 0.95, 0.8), h21(vec2(col, row) + 3.0)) * (0.85 + 0.3 * g);
    vec3 miolo = diffuseColor.rgb * (0.65 + 0.7 * 0.5) * 1.0; vec3 mortar = vec3(0.42, 0.4, 0.35) * (0.8 + 0.4 * vn(uv * 50.0));
    vec3 c = mix(mix(miolo, tij, aa(0.075)), mortar, argam);
    c = mix(c, c * vec3(0.6, 0.62, 0.55), umid * 0.5 * uSujeira); c *= 1.0 - 0.3 * smoothstep(0.45, 0.8, escorre) * uSujeira; c = mix(c, vec3(0.08, 0.16, 0.05), umid * smoothstep(0.6, 0.8, fbm4(uv * 3.0)) * 0.4 * uSujeira);
    float sal = smoothstep(0.7, 0.82, fbm4(uv * 2.0 + 5.0)) * 0.5 * uSujeira; c = mix(c, c + vec3(0.12), sal * 0.4); gMol = uMolhado; c *= mix(1.0, 0.8, gMol * 0.6); diffuseColor.rgb = c; gPoca = 0.0; }`,
  rug: ``,
  bump: `{ vec3 n = normalize(vWN); vec2 uv = planoUV(vWP, n); float rr = uv.y / 0.075, row = floor(rr), fr = fract(rr); float cc = uv.x / 0.24 + 0.5 * mod(row, 2.0), fc = fract(cc);
    float md = min(min(fr, 1.0 - fr) * 0.075, min(fc, 1.0 - fc) * 0.24), argam = (1.0 - smoothstep(0.0035, 0.0065 + gPX, md)) * aa(0.03);
    float h = vn(uv * 70.0) * 0.35 * aa(0.012) - 1.6 * argam; normal = bumpN(-vViewPosition, normal, h, 1.0, faceDirection); }`,
  emi: ``,
};
R.concreto = {                                                                                 // concreto: fôrmas, furos de tirante, bolhas, eflorescência e ferrugem escorrida
  cor: `{ gPX = length(fwidth(vWP)) + 1e-5; vec3 n = normalize(vWN); vec2 uv = planoUV(vWP, n); bool piso = abs(n.y) > 0.7;
    ${SUJEIRA_PAREDE}
    vec2 pn = uv / vec2(2.4, 1.2); vec2 fp = fract(pn); float jp = min(min(fp.x, 1.0 - fp.x) * 2.4, min(fp.y, 1.0 - fp.y) * 1.2), painel = (1.0 - smoothstep(0.004, 0.011 + gPX, jp)) * aa(0.04);
    float gr = mix(0.5, vn(uv * 130.0) * 0.5 + vn(uv * 45.0) * 0.5, aa(0.012)), n0 = fbm4(uv * 0.9), bolha = smoothstep(0.88, 0.93, vn(uv * 55.0)) * aa(0.015);
    vec2 tf = (fp - vec2(0.5, 0.5)) * vec2(2.4, 1.2); float furo = (1.0 - smoothstep(0.012, 0.022 + gPX, length(tf - vec2(0.6, 0.3)) )) + (1.0 - smoothstep(0.012, 0.022 + gPX, length(tf + vec2(0.6, 0.3))));
    float flor = smoothstep(0.62, 0.8, fbm4(uv * 1.3 + 3.0)) * 0.6 * uSujeira;
    vec3 c = diffuseColor.rgb * (0.88 + 0.24 * gr) * (0.86 + 0.28 * n0);
    c *= 1.0 - 0.38 * painel; c *= 1.0 - 0.5 * min(furo, 1.0) * aa(0.04); c *= 1.0 - 0.3 * bolha;
    c = mix(c, c + vec3(0.14), flor * 0.5); c *= 1.0 - 0.3 * smoothstep(0.45, 0.8, escorre) * (piso ? 0.0 : 1.0) * uSujeira;
    c = mix(c, c * vec3(0.55, 0.58, 0.5), umid * 0.5 * uSujeira); c = mix(c, c * vec3(0.5, 0.48, 0.45), respingo * 0.5 * uSujeira);
    float ferr = smoothstep(0.7, 0.85, fbm4(vec2(uv.x * 6.0, uv.y * 0.3 + 7.0))) * (piso ? 0.0 : 1.0) * 0.5 * uSujeira; c = mix(c, vec3(0.3, 0.13, 0.05), ferr * 0.6);
    gMol = uMolhado; c *= mix(1.0, 0.8, gMol * (piso ? 0.8 : 0.5)); gPoca = piso ? poca(vWP.xz * 0.9) * smoothstep(0.4, 0.9, uMolhado) * 0.5 : 0.0; c *= mix(1.0, 0.8, gPoca); diffuseColor.rgb = c; }`,
  rug: `{ roughnessFactor = mix(clamp(roughnessFactor + 0.05 * vn(vWP.xz * 30.0), 0.0, 1.0), 0.3, gMol * 0.7); roughnessFactor = mix(roughnessFactor, 0.05, gPoca); }`,
  bump: `{ vec3 n = normalize(vWN); vec2 uv = planoUV(vWP, n); vec2 pn = uv / vec2(2.4, 1.2), fp = fract(pn); float jp = min(min(fp.x, 1.0 - fp.x) * 2.4, min(fp.y, 1.0 - fp.y) * 1.2);
    float h = (vn(uv * 130.0) * 0.5 + vn(uv * 45.0) * 0.4) * 0.5 * aa(0.012) - 1.0 * (1.0 - smoothstep(0.004, 0.011 + gPX, jp)) * aa(0.04) - 0.8 * smoothstep(0.88, 0.93, vn(uv * 55.0)) * aa(0.015);
    if (uChuva * gPoca > 0.02) h += aneis(vWP.xz, uT) * 0.15 * uChuva * gPoca; normal = bumpN(-vViewPosition, normal, h, 0.8 + 3.0 * uChuva * gPoca, faceDirection); }`,
  emi: `{ totalEmissiveRadiance += reflexoCeu(normal) * (gPoca * 0.9 + gMol * 0.08); }`,
};
R.telha = {                                                                                    // telhas capa-e-canal em fiadas deslocadas (segue a inclinação de qualquer água), musgo e telhas de tom diferente
  cor: `{ gPX = length(fwidth(vWP)) + 1e-5; vec3 n = normalize(vWN); bool plano = n.y > 0.97;
    vec3 gsl = normalize(vec3(0.0, 1.0, 0.0) - n * n.y + vec3(1e-5)); vec3 la = normalize(cross(n, gsl));
    vec2 uv = plano ? vWP.xz : vec2(dot(vWP, la), dot(vWP, gsl));
    float rr = uv.y / 0.26, row = floor(rr), fr = fract(rr); float cc = uv.x / 0.21 + 0.5 * mod(row, 2.0), col = floor(cc), fc = fract(cc);
    float t = h21(vec2(col, row)), onda = 0.5 + 0.5 * cos(fc * 6.2831853), sombra = smoothstep(0.0, 0.18, fr);
    float gr = mix(0.5, vn(uv * 60.0), aa(0.012)), n0 = fbm4(uv * 0.6), musgo = smoothstep(0.62, 0.85, fbm4(uv * 2.2 + 3.0)) * uSujeira;
    vec3 c = diffuseColor.rgb * (0.72 + 0.5 * t) * (0.8 + 0.3 * onda) * (0.82 + 0.2 * sombra) * (0.85 + 0.3 * gr) * (0.88 + 0.24 * n0);
    c = mix(c, c * vec3(0.7, 0.85, 0.6), musgo * 0.55); c = mix(c, c * 0.5, (1.0 - smoothstep(0.0, 0.05, fr)) * 0.5 * aa(0.04));
    if (plano) c = diffuseColor.rgb * (0.7 + 0.6 * fbm4(vWP.xz * 1.5)) * (0.8 + 0.4 * vn(vWP.xz * 40.0));                // laje plana: manta/cascalho
    gMol = uMolhado; c *= mix(1.0, 0.75, gMol); diffuseColor.rgb = c; gPoca = 0.0; }`,
  rug: `{ roughnessFactor = clamp(roughnessFactor - 0.2 * gMol, 0.25, 1.0); }`,
  bump: `{ vec3 n = normalize(vWN); bool plano = n.y > 0.97; vec3 gsl = normalize(vec3(0.0, 1.0, 0.0) - n * n.y + vec3(1e-5)); vec3 la = normalize(cross(n, gsl)); vec2 uv = plano ? vWP.xz : vec2(dot(vWP, la), dot(vWP, gsl));
    float rr = uv.y / 0.26, row = floor(rr), fr = fract(rr); float cc = uv.x / 0.21 + 0.5 * mod(row, 2.0), fc = fract(cc);
    float h = plano ? vn(vWP.xz * 40.0) * 0.5 : (0.5 + 0.5 * cos(fc * 6.2831853)) * 0.9 * aa(0.05) + smoothstep(0.0, 0.2, fr) * 0.6 * aa(0.05); normal = bumpN(-vViewPosition, normal, h, 1.0, faceDirection); }`,
  emi: ``,
};

// ---- vidro, metal, madeira, água
R.vidro = {                                                                                    // vidro: interior sorteado por janela (cortina, persiana, sala escura), reflexo do céu em Fresnel, sujeira e escorridos
  jan: true,
  cor: `{ gPX = length(fwidth(vWP)) + 1e-5; vec3 n = normalize(vWN); vec2 uv = planoUV(vWP, n);
    float suj = smoothstep(0.5, 0.9, fbm4(vec2(uv.x * 6.0, uv.y * 0.3 + 2.0))) * 0.35 * uSujeira; vec3 c = diffuseColor.rgb * 0.62 * (0.9 + 0.2 * fbm4(uv * 1.1));
    vec3 inte = interiorJan(vJan); c = mix(c, inte * 0.55 * (0.9 + 0.2 * fbm4(uv * 1.1)), gCobre * 0.9); c = mix(c, c * 1.8 + vec3(0.05), suj * (1.0 - gCobre * 0.6));
    gMol = uMolhado; diffuseColor.rgb = c; gPoca = 0.0; }`,
  rug: `{ roughnessFactor = clamp(roughnessFactor + 0.06 * smoothstep(0.5, 0.9, fbm4(vWP.xy * 4.0)), 0.02, 1.0); }`,
  bump: ``,
  emi: `{ totalEmissiveRadiance *= gLuzJan * gCorJan; vec3 Vv = normalize(cameraPosition - vWP); vec3 Nw = inverseTransformDirection(normal, viewMatrix); vec3 rv = reflect(-Vv, Nw); float F = fres(dot(Nw, Vv));
    totalEmissiveRadiance += ceu(rv) * (0.16 + 1.1 * F) * (0.85 + 0.3 * smoothstep(-0.2, 0.6, rv.y)) * (1.0 - 0.5 * gCobre); }`,
};
R.metal = {
  cor: `{ gPX = length(fwidth(vWP)) + 1e-5; vec3 n = normalize(vWN); vec2 uv = planoUV(vWP, n); float rc = smoothstep(0.58, 0.8, fbm4(uv * 3.0 + 1.0)) * (1.0 - smoothstep(0.3, 2.2, vWP.y)) * uSujeira, ar = vn(uv * 90.0) * aa(0.012);
    vec3 c = diffuseColor.rgb * (0.85 + 0.3 * ar) * (0.9 + 0.2 * fbm4(uv * 1.2)); c = mix(c, vec3(0.25, 0.1, 0.04), rc * 0.7); gMol = uMolhado; diffuseColor.rgb = c; gPoca = 0.0; }`,
  rug: `{ roughnessFactor = clamp(roughnessFactor + 0.15 * vn(vWP.xz * 50.0 + vWP.y * 40.0), 0.15, 1.0); }`,
  bump: ``,
  emi: `{ totalEmissiveRadiance += reflexoCeu(normal) * 0.28 * metalnessFactor; }`,
};
R.madeira = {
  cor: `{ gPX = length(fwidth(vWP)) + 1e-5; vec3 n = normalize(vWN); vec2 uv = planoUV(vWP, n); float veio = vn(vec2(uv.x * 55.0, uv.y * 3.0)) * 0.6 + vn(vec2(uv.x * 140.0, uv.y * 8.0)) * 0.4, mofo = smoothstep(0.62, 0.85, fbm4(uv * 2.0 + 3.0)) * uSujeira;
    vec3 c = diffuseColor.rgb * (0.7 + 0.6 * mix(0.5, veio, aa(0.01))) * (0.85 + 0.3 * fbm4(uv * 1.5)); c = mix(c, c * vec3(0.7, 0.75, 0.6), mofo * 0.4); gMol = uMolhado; c *= mix(1.0, 0.78, gMol); diffuseColor.rgb = c; gPoca = 0.0; }`,
  rug: ``, bump: ``, emi: ``,
};
R.agua = {                                                                                     // piscina e água parada: ondinhas que andam, reflexo do céu, brilho do sol, luzes de refração
  cor: `{ gPX = length(fwidth(vWP)) + 1e-5; vec2 q = vWP.xz; float cs = 0.0; float idc; vec2 ce = cel(q * 1.3 + vec2(uT * 0.18, -uT * 0.12), idc); cs = pow(1.0 - clamp(ce.x * 1.4, 0.0, 1.0), 3.0);
    vec3 c = diffuseColor.rgb; c += vec3(0.35, 0.55, 0.6) * cs * 0.45 * aa(0.05); diffuseColor.rgb = c; gPoca = 0.0; gMol = 0.0; }`,
  rug: `{ roughnessFactor = 0.04; }`,
  bump: `{ vec2 q = vWP.xz; float t = uT; float h = vn(q * 3.0 + vec2(t * 0.5, t * 0.3)) * 0.5 + vn(q * 7.0 - vec2(t * 0.6, -t * 0.4)) * 0.3 + vn(q * 15.0 + vec2(-t * 0.8, t * 0.5)) * 0.2 * aa(0.04);
    normal = bumpN(-vViewPosition, normal, h, 0.7, faceDirection); }`,
  emi: `{ totalEmissiveRadiance += reflexoCeu(normal) * 1.0; }`,
};
R.azulejo = {
  cor: `{ gPX = length(fwidth(vWP)) + 1e-5; vec3 n = normalize(vWN); vec2 uv = planoUV(vWP, n); vec2 g = uv / 0.15, f = fract(g); float j = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)) * 0.15, junta = 1.0 - smoothstep(0.002, 0.005 + gPX, j);
    vec3 c = diffuseColor.rgb * (0.92 + 0.16 * h21(floor(g))); c = mix(c, vec3(0.75, 0.8, 0.8), mix(0.0, junta, aa(0.15))); diffuseColor.rgb = c; gPoca = 0.0; gMol = 0.0; }`,
  rug: ``, bump: ``, emi: ``,
};

// ------------------------------------------------------------------------------------------------ aplicação em materiais
export function detalhar(mat, tipo) {
  const r = R[tipo]; if (!r) return mat;
  mat.userData.detalhado = tipo;
  if (r.jan) mat.defaultAttributeValues = { jan: [-1, 0, 0] };                                    // geometria sem o atributo `jan` (peças que o Kit não marca) = vidro comum
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uT: UT, uMolhado: AMB.molhado, uChuva: AMB.chuva, uSujeira: AMB.sujeira, uCeuTopo: AMB.ceuTopo, uCeuHor: AMB.ceuHor, uSolDir: AMB.solDir });
    sh.uniforms.uSolCor = AMB.solCor;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN; varying vec3 vOP; varying vec3 vJan;' + (r.jan ? '\nattribute vec3 jan;' : ''))
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvWN = normalize(mat3(modelMatrix) * objectNormal);')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vOP = position; vJan = ' + (r.jan ? 'jan' : 'vec3(-1.0, 0.0, 0.0)') + ';');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + RUIDO + BUMP + COMUM)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + r.cor)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n' + (r.rug || ''))
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + (r.bump || ''))
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + (r.emi || ''));
  };
  mat.customProgramCacheKey = () => 'cidadeDet_' + tipo;
  mat.needsUpdate = true;
  return mat;
}
/** depois de `material.clone()` (que não leva o shader junto) devolve o detalhe do mesmo tipo */
export function redetalhar(mat) { const t = mat.userData && mat.userData.detalhado; return t ? detalhar(mat, t) : mat; }

// material do kit (por nome) -> receita
const POR_MATERIAL = {
  Asfalto: 'asfalto', AsfaltoPista: 'asfalto', AsfaltoRodovia: 'asfalto', Acostamento: 'acostamento',
  FaixaBranca: 'faixa', FaixaAmarela: 'faixa', TintaBranca: 'faixa', TintaAmarela: 'faixa', NumeroPista: 'faixa',
  Calcada: 'calcada', CalcadaB: 'calcada', CalcadaLado: 'calcadaLado', MeioFio: 'meiofio', Mureta: 'meiofio',
  Grama: 'grama', GramaA: 'grama', GramaB: 'grama', GramaC: 'grama', TerraBatida: 'terra',
  ParedeBranca: 'reboco', ParedeCinza: 'reboco', ParedeAmarela: 'reboco', ParedeRosa: 'reboco', ParedeAzul: 'reboco', ParedeVerde: 'reboco', ParedeVermelha: 'reboco', ParedeAzulEscuro: 'reboco', ParedeGrafite: 'reboco', MarinhoHryz: 'reboco',
  BrancoPuro: 'tinta', MolduraBranca: 'tinta', MolduraEscura: 'tinta',
  ParedeTijolo: 'tijolo',
  ParedeConcreto: 'concreto', ConcretoClaro: 'concreto', Laje: 'concreto', Rodape: 'concreto', PistaConcreto: 'concreto', DegrauConcreto: 'concreto', EspelhoConcreto: 'concreto', ConcretoPatio: 'concreto', Junta: 'concreto',
  Telha: 'telha', TelhaMarrom: 'telha', TelhaCinza: 'telha',
  Vidro: 'vidro', VidroEscuro: 'vidro', VidroLuz: 'vidro', VidroEscuroLuz: 'vidro',
  Metal: 'metal', MetalEscuro: 'metal', PosteLuz: 'metal', PosteLuzBase: 'metal', Luminaria: 'metal',
  Madeira: 'madeira', MadeiraEscura: 'madeira', MadeiraClara: 'madeira',
  Agua: 'agua', Azulejo: 'azulejo',
};
/** material de chão para planos grandes (fora das peças do kit): `materialDetalhado(0x6fa94c, 'grama')`; tipos: grama, terra, asfalto, calcada, concreto */
export function materialDetalhado(cor, tipo = 'grama', { rugosidade = 1 } = {}) { return detalhar(new THREE.MeshStandardMaterial({ color: cor, roughness: rugosidade, metalness: 0 }), tipo); }
/** aplica o detalhe em toda a árvore (clona os materiais antes: o cache do loader continua intacto) */
export function detalharKit(raiz, nome = '') {
  raiz.traverse(m => {
    if (!m.isMesh) return;
    const arr = Array.isArray(m.material) ? m.material : [m.material];
    const novo = arr.map(k => {
      let t = POR_MATERIAL[k.name];
      if (t === 'asfalto' && nome === 'rua-reta') t = 'asfaltoReta';
      if (/^Telhado/.test(m.name) && (k.name === 'ConcretoClaro' || k.name === 'Laje' || k.name === 'ParedeCinza' || k.name === 'MolduraEscura')) t = 'telha';   // telhado feito com material de parede
      if (!t) return k;
      const c = k.userData.detalhado ? k : k.clone(); return detalhar(c, t);
    });
    m.material = Array.isArray(m.material) ? novo : novo[0];
  });
}

// ------------------------------------------------------------------------------------------------ água em geral (lago, rio, mar, enchente, fonte)
/** plano de água: cor por profundidade, ondas que andam (duas direções), reflexo do céu em Fresnel, brilho do sol e espuma nas bordas.
 *  `centro` em x,z; `y` = nível; `cor` = água funda; `corRasa` = água rasa; `onda` = 0 (espelho) .. 1 (mar agitado); `vento` = direção das ondas em x,z. */
export function criarAgua({ largura = 60, comprimento = 60, y = 0, centro = [0, 0], cor = '#0b4f73', corRasa = '#3aa7b0', onda = 0.4, vento = [1, 0.4], opacidade = 0.92 } = {}) {
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(cor), roughness: 0.04, metalness: 0.1, transparent: opacidade < 1, opacity: opacidade });
  const rasa = new THREE.Color(corRasa);
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uT: UT, uCeuTopo: AMB.ceuTopo, uCeuHor: AMB.ceuHor, uSolDir: AMB.solDir, uSolCor: AMB.solCor, uMolhado: AMB.molhado, uChuva: AMB.chuva, uSujeira: AMB.sujeira });
    Object.assign(sh.uniforms, { uRasa: { value: rasa }, uOnda: { value: onda }, uVento: { value: new THREE.Vector2(...vento).normalize() } });
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN; varying vec3 vOP; varying vec3 vJan;').replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvWN = normalize(mat3(modelMatrix) * objectNormal);')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vOP = position; vJan = vec3(-1.0, 0.0, 0.0);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uRasa; uniform float uOnda; uniform vec2 uVento;\n' + RUIDO + BUMP + COMUM)
      .replace('#include <color_fragment>', `#include <color_fragment>
        { gPX = length(fwidth(vWP)) + 1e-5; vec2 q = vWP.xz; float dist = length(cameraPosition - vWP); float prof = 0.55 + 0.45 * fbm3(q * 0.08 + 3.0);        // profundidade falsa por ruído
          vec3 c = mix(uRasa, diffuseColor.rgb, smoothstep(0.1, 0.9, prof)); float idc; vec2 ce = cel(q * 1.1 + vec2(uT * 0.2, -uT * 0.13), idc); c += vec3(0.3, 0.5, 0.55) * pow(1.0 - clamp(ce.x * 1.5, 0.0, 1.0), 3.0) * 0.06 * aa(0.05);
          diffuseColor.rgb = c; }`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec2 q = vWP.xz, d = uVento; vec2 p1 = q + d * uT * 0.9, p2 = q * mat2(0.8, -0.6, 0.6, 0.8) - d.yx * uT * 0.6;
          float h = vn(p1 * 0.9) * 1.0 + vn(p2 * 2.2) * 0.55 + vn(p1 * 5.5 + 3.0) * 0.3 * aa(0.05) + vn(p2 * 12.0) * 0.12 * aa(0.02);
          normal = bumpN(-vViewPosition, normal, h * uOnda, 1.1, faceDirection); }`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{ totalEmissiveRadiance += reflexoCeu(normal) * 1.0; }');
  };
  mat.customProgramCacheKey = () => 'cidadeAgua';
  const m = new THREE.Mesh(new THREE.PlaneGeometry(largura, comprimento), mat);
  m.rotation.x = -Math.PI / 2; m.position.set(centro[0], y, centro[1]); m.receiveShadow = true; m.name = 'Agua';
  return m;
}

// ------------------------------------------------------------------------------------------------ espelho real nas poças (opcional, custa uma renderização extra; o reflexo do céu já vem do shader)
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
