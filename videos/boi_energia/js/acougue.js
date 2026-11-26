// Açougue no estúdio azul: mesa de inox, tábua de polietileno, peça de contra-filé em fatias (o cutelo separa uma a uma), bifes já cortados,
// cutelo, pistola de dardo cativo, relógio "tempo desde o abate" e o açougueiro do elenco com os braços por IK (mão direita no cabo do
// cutelo, mão esquerda com a luva de malha segurando a peça).
// A carne "fervilha": deslocamento no shader (abalos que andam pela superfície + ondas nas fibras), com amplitude = energia que resta.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clamp, lerp, inv, suave, mulberry32 } from '../../core/util.js';
import { canvasTex } from '../../core/motor.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const MESA_Y = 0.90, TABUA_Y = MESA_Y + 0.035;

// ------------------------------------------------------------------------------------------------ carne
const GLSL_RUIDO = `
  float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
    return mix(mix(mix(h3(i), h3(i+vec3(1,0,0)), f.x), mix(h3(i+vec3(0,1,0)), h3(i+vec3(1,1,0)), f.x), f.y),
               mix(mix(h3(i+vec3(0,0,1)), h3(i+vec3(1,0,1)), f.x), mix(h3(i+vec3(0,1,1)), h3(i+vec3(1,1,1)), f.x), f.y), f.z); }
  float fbm(vec3 p){ return 0.5*n3(p) + 0.25*n3(p*2.03) + 0.125*n3(p*4.1) + 0.0625*n3(p*8.3); }`;
export const UNI_CARNE = { uT: { value: 0 }, uEn: { value: 1 }, uRigor: { value: 0 } };
// texturas da biblioteca (biblioteca3d/objetos/carne/gerar_texturas.py): face de corte, lateral (grão) e gordura; 1 repetição = 0,20 m
const TEX = {};
async function carregarTexturas() {
  const L = new THREE.TextureLoader(), B = '../biblioteca3d/objetos/carne/';
  const ler = async (n, srgb) => { const t = await L.loadAsync(B + n); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  [TEX.corte, TEX.corteN, TEX.corteR, TEX.lado, TEX.ladoN, TEX.gord] = await Promise.all([
    ler('carne_corte_cor.jpg', true), ler('carne_corte_normal.jpg'), ler('carne_corte_rug.jpg'), ler('carne_lado_cor.jpg', true), ler('carne_lado_normal.jpg'), ler('gordura_cor.jpg', true)]);
}
/** material da carne: face = 'corte' (fibras saindo da superfície) ou 'lado' (grão ao longo do músculo).
 *  O tremor ("fervilhar"): abalos que andam pela superfície como relevo animado na normal + leve deslocamento dos vértices. */
function matCarne(semente = 0, face = 'corte') {
  const corte = face === 'corte';
  const clone = (t, rep, rot = 0) => { const c = t.clone(); c.needsUpdate = true; c.repeat.set(rep, rep); c.offset.set((semente * 0.37) % 1, (semente * 0.61) % 1); c.rotation = rot; return c; };
  const m = new THREE.MeshPhysicalMaterial({
    map: clone(corte ? TEX.corte : TEX.lado, 5, corte ? 0 : Math.PI / 2), normalMap: clone(corte ? TEX.corteN : TEX.ladoN, 5, corte ? 0 : Math.PI / 2), normalScale: new THREE.Vector2(0.9, 0.9),
    roughnessMap: corte ? clone(TEX.corteR, 5) : null, roughness: corte ? 1.0 : 0.42, clearcoat: 0.7, clearcoatRoughness: 0.22, sheen: 0.35, sheenColor: new THREE.Color(0.6, 0.12, 0.1), sheenRoughness: 0.5,
  });
  const gord = clone(TEX.gord, 5);
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, UNI_CARNE); sh.uniforms.uSem = { value: semente }; sh.uniforms.uGord = { value: gord };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT, uEn, uRigor, uSem; varying vec3 vQ; ' + GLSL_RUIDO)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vQ = position;
        vec3 q = position * 18.0 + vec3(uSem * 3.1);
        float a1 = n3(q + vec3(uT * 1.7, 0.0, uT * 0.9));
        float puls = sin(uT * 13.0 + n3(q * 0.7) * 12.0) * 0.5 + 0.5;
        transformed += normal * smoothstep(0.55, 0.9, a1) * puls * 0.0022 * uEn;
        transformed *= 1.0 - 0.025 * uRigor;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uT, uEn, uRigor, uSem; uniform sampler2D uGord; varying vec3 vQ; ' + GLSL_RUIDO + `
      // abalos: altura animada (manchas que pulsam e andam + ondinhas nas fibras), usada para entortar a normal
      float abalo(vec3 p){ vec3 q = p * 55.0 + vec3(uSem * 3.1);
        float a1 = n3(q + vec3(uT * 1.9, uT * 0.7, uT * 1.1)), a2 = n3(q * 2.1 - vec3(uT * 2.6, 0.0, uT * 1.3));
        float puls = sin(uT * 14.0 + n3(q * 0.5) * 10.0) * 0.5 + 0.5;
        return (smoothstep(0.5, 0.92, a1) * puls + 0.5 * smoothstep(0.55, 0.95, a2) * (0.5 + 0.5 * sin(uT * 23.0 + uSem))) + 0.25 * sin(p.y * 700.0 + p.z * 300.0 - uT * 18.0 + n3(q) * 6.0); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        // capa de gordura em cima, com a membrana prateada (fáscia) entre ela e a carne
        vec3 q = vQ * 40.0 + vec3(uSem * 7.0);
        float yc = vQ.y + 0.003 * n3(q * 0.4);
        float capa = smoothstep(0.080, 0.084, yc), fascia = smoothstep(0.076, 0.080, yc) * (1.0 - capa);
        vec3 g = texture2D(uGord, vMapUv * 0.7).rgb;
        diffuseColor.rgb *= vec3(0.86, 0.80, 0.82);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.80, 0.80, 0.86), fascia * 0.8);
        diffuseColor.rgb = mix(diffuseColor.rgb, g, capa);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.6, 0.45, 0.5), uRigor * 0.45);   // rigor: mais escura e opaca
        float ab = abalo(vQ); diffuseColor.rgb *= 1.0 - 0.06 * uEn * smoothstep(0.5, 1.0, ab);           // onde contrai fica um pouco mais escuro`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { float h = abalo(vQ) * 0.0010 * uEn;                                   // relevo animado pelas derivadas de tela (como o bump do three)
          vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition), R1 = cross(sy, normal), R2 = cross(normal, sx);
          float det = dot(sx, R1); vec3 grad = sign(det) * (dFdx(h) * R1 + dFdy(h) * R2);
          normal = normalize(abs(det) * normal - grad); }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.55, smoothstep(0.080, 0.084, vQ.y)) + 0.15 * uRigor;`);
  };
  m.customProgramCacheKey = () => 'carne-' + face;
  return m;
}
const matsCarne = sem => [matCarne(sem, 'corte'), matCarne(sem, 'lado')];      // grupos do ExtrudeGeometry: 0 = faces, 1 = laterais

// fatia de contra-filé: forma de "D" (achatada embaixo, capa de gordura em cima), extrudada em X (o corte fica de frente para ±X)
function geoFatia(esp) {
  const s = new THREE.Shape(), r = mulberry32(5);
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const a = Math.PI * (i / 40);                                                 // metade de cima (arco)
    pts.push([Math.cos(a) * 0.085 * (1 + 0.04 * Math.sin(a * 5)), 0.008 + Math.sin(a) * 0.072 * (1 - 0.18 * Math.cos(a) ** 2)]);   // contra-filé: ~17 × 9 cm
  }
  pts.push([-0.08, -0.004], [-0.05, -0.012], [0.05, -0.012], [0.08, -0.004]);
  s.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) s.lineTo(p[0], p[1]); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: esp, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.004, bevelSegments: 4, curveSegments: 12, steps: 8 });
  g.translate(0, 0.012, -esp / 2); g.rotateY(Math.PI / 2);                     // espessura em X
  // mais vértices na face de corte para os abalos aparecerem
  return g;
}
function subdividir(g, n = 2) {
  // subdivisão simples (cada triângulo em 4) para o deslocamento ficar suave
  let geo = g.toNonIndexed();
  for (let k = 0; k < n; k++) {
    const p = geo.attributes.position.array, out = [];
    for (let i = 0; i < p.length; i += 9) {
      const A = [p[i], p[i + 1], p[i + 2]], B = [p[i + 3], p[i + 4], p[i + 5]], C = [p[i + 6], p[i + 7], p[i + 8]];
      const m = (u, v) => [(u[0] + v[0]) / 2, (u[1] + v[1]) / 2, (u[2] + v[2]) / 2], ab = m(A, B), bc = m(B, C), ca = m(C, A);
      out.push(...A, ...ab, ...ca, ...ab, ...B, ...bc, ...ca, ...bc, ...C, ...ab, ...bc, ...ca);
    }
    geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  }
  geo.computeVertexNormals(); return geo;
}

// ------------------------------------------------------------------------------------------------ IK do açougueiro (como o piloto da moto)
class PoseIK {
  preparar(obj) {
    let sk = null; obj.traverse(o => { if (!sk && o.isSkinnedMesh) sk = o.skeleton; });
    const q = {}, p = {}, ossos = {}, m1 = new THREE.Matrix4();
    sk.bones.forEach((b, i) => { const m = m1.copy(sk.boneInverses[i]).invert(), pp = V(), qq = new THREE.Quaternion(); m.decompose(pp, qq, V()); q[b.name] = qq; p[b.name] = pp; ossos[b.name] = b; });
    const local = (n, v) => v.clone().applyQuaternion(q[n].clone().invert()).normalize();
    const frente = V(0, 0, 1);
    this.eixos = {};
    const def = (n, filho, ref) => { this.eixos[n] = { eixo: local(n, p[filho].clone().sub(p[n])), ref: local(n, ref) }; };
    for (const l of ['E', 'D']) {
      def('Braco' + l, 'Antebraco' + l, frente); def('Antebraco' + l, 'Mao' + l, frente);
      this.eixos['Mao' + l] = { eixo: local('Mao' + l, p['Mao' + l].clone().sub(p['Antebraco' + l])), ref: local('Mao' + l, V(l === 'D' ? 1 : -1, 0, 0)) };
    }
    def('Coluna2', 'Peito', frente); def('Peito', 'Pescoco', frente); def('Pescoco', 'Cabeca', frente);
    this.q = q; this.p = p; this.ossos = ossos; this.la = p.AntebracoD.distanceTo(p.BracoD); this.lb = p.MaoD.distanceTo(p.AntebracoD);
  }
  orientar(n, eixoW, refW) {
    const b = this.ossos[n], e = this.eixos[n], m1 = new THREE.Matrix4(), m2 = new THREE.Matrix4();
    const base = (x, r, M) => { const xx = x.clone().normalize(), yy = r.clone().addScaledVector(xx, -r.dot(xx)); if (yy.lengthSq() < 1e-6) yy.set(0, 1, 0); yy.normalize(); return M.makeBasis(xx, yy, xx.clone().cross(yy)); };
    const q = new THREE.Quaternion().setFromRotationMatrix(base(eixoW, refW, m1)).multiply(new THREE.Quaternion().setFromRotationMatrix(base(e.eixo, e.ref, m2)).invert());
    b.parent.updateMatrixWorld(true); q.premultiply(b.parent.getWorldQuaternion(new THREE.Quaternion()).invert()); b.quaternion.copy(q); b.updateMatrixWorld(true);
  }
  pos(n) { return this.ossos[n].getWorldPosition(V()); }
  ik(l, alvo, polo, ref) {
    const a = 'Braco' + l, b = 'Antebraco' + l, A = this.pos(a), d = alvo.clone().sub(A), la = this.la, lb = this.lb;
    const dist = THREE.MathUtils.clamp(d.length(), Math.abs(la - lb) + 1e-3, la + lb - 1e-3), dn = d.normalize();
    const cosA = THREE.MathUtils.clamp((la * la + dist * dist - lb * lb) / (2 * la * dist), -1, 1), senA = Math.sqrt(1 - cosA * cosA);
    const pp = polo.clone().addScaledVector(dn, -polo.dot(dn)).normalize();
    const junta = A.clone().addScaledVector(dn, la * cosA).addScaledVector(pp, la * senA);
    this.orientar(a, junta.clone().sub(A), ref); this.orientar(b, alvo.clone().sub(this.pos(b)), ref);
  }
}

// ------------------------------------------------------------------------------------------------ captura real (CMU) no corpo do açougueiro
// Retarget por direção (como lucas_poder/js/mocap.js), com os nomes de ossos do elenco. Braço direito e mão esquerda ficam com o IK.
const MAPA_ELENCO = [
  ['Coluna', 'Coluna2', 'root', 'lowerback'], ['Coluna2', 'Peito', 'lowerback', 'upperback'], ['Peito', 'Pescoco', 'upperback', 'thorax'],
  ['Pescoco', 'Cabeca', 'thorax', 'upperneck'], ['Cabeca', null, 'upperneck', 'head'],
  ['OmbroE', 'BracoE', 'thorax', 'lclavicle'], ['OmbroD', 'BracoD', 'thorax', 'rclavicle'],
  ['CoxaE', 'CanelaE', 'lhipjoint', 'lfemur'], ['CanelaE', 'PeE', 'lfemur', 'ltibia'], ['PeE', 'PonteiraE', 'ltibia', 'lfoot'],
  ['CoxaD', 'CanelaD', 'rhipjoint', 'rfemur'], ['CanelaD', 'PeD', 'rfemur', 'rtibia'], ['PeD', 'PonteiraD', 'rtibia', 'rfoot'],
];
async function carregarClip(url) {
  const d = await (await fetch(url)).json(), J = {}; d.juntas.forEach((j, i) => { J[j] = i; }); const Q = d.quadros;
  return { fps: d.fps, dur: (Q.length - 1) / d.fps,
    pos(t, nome, alvo = V()) { const f = Math.min(Math.max(t * d.fps, 0), Q.length - 1), k = Math.floor(f), a = f - k, k2 = Math.min(k + 1, Q.length - 1), i = J[nome] * 3;
      return alvo.set(Q[k][i] * (1 - a) + Q[k2][i] * a, Q[k][i + 1] * (1 - a) + Q[k2][i + 1] * a, Q[k][i + 2] * (1 - a) + Q[k2][i + 2] * a); } };
}
function giraMundo(osso, de, para) {
  if (de.lengthSq() < 1e-10 || para.lengthSq() < 1e-10) return;
  const q = new THREE.Quaternion().setFromUnitVectors(de.clone().normalize(), para.clone().normalize());
  const pw = osso.parent.getWorldQuaternion(new THREE.Quaternion()), bw = osso.getWorldQuaternion(new THREE.Quaternion());
  osso.quaternion.copy(pw.invert().multiply(q.multiply(bw))); osso.updateMatrixWorld(true);
}
function aplicarCorpo(homem, O, rest, clip, t, origem) {
  for (const n in rest) O[n].quaternion.copy(rest[n]);
  homem.position.set(0, 0, 0); homem.updateMatrixWorld(true);
  const pos = n => O[n].getWorldPosition(V());
  if (!clip._esc) {
    const pm = clip.pos(0, 'lhipjoint').distanceTo(clip.pos(0, 'lfemur')) + clip.pos(0, 'lfemur').distanceTo(clip.pos(0, 'ltibia'));
    clip._esc = (pos('CoxaE').distanceTo(pos('CanelaE')) + pos('CanelaE').distanceTo(pos('PeE'))) / pm;
    const l = clip.pos(0, 'lhipjoint').sub(clip.pos(0, 'rhipjoint')), f = l.clone().cross(V(0, 1, 0));   // frente do ator = esquerda × cima
    clip._yaw = Math.atan2(-f.x, f.z); clip._r0 = clip.pos(0, 'root');
  }
  const s = clip._esc, cy = Math.cos(clip._yaw), sy = Math.sin(clip._yaw), r0 = clip.pos(t, 'root');   // ancorado: o ator não anda pelo estúdio
  const P = (nome, alvo = V()) => { clip.pos(t, nome, alvo); const x = alvo.x - r0.x, z = alvo.z - r0.z; return alvo.set(origem.x + s * (x * cy + z * sy), s * alvo.y, origem.z + s * (-x * sy + z * cy)); };
  const hipL = P('lhipjoint'), hipR = P('rhipjoint'), raiz = P('root'), costas = P('lowerback');
  const x = hipL.sub(hipR).normalize(), y = costas.sub(raiz).normalize(); y.sub(x.clone().multiplyScalar(y.dot(x))).normalize(); const z = V().crossVectors(x, y);
  const qAlvo = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  const pel = O.Quadril, pw = pel.parent.getWorldQuaternion(new THREE.Quaternion());
  if (!clip._pelQ) clip._pelQ = pel.getWorldQuaternion(new THREE.Quaternion());           // quadril em repouso, no mundo
  pel.quaternion.copy(pw.clone().invert().multiply(qAlvo.multiply(clip._pelQ))); pel.updateMatrixWorld(true);
  for (let it = 0; it < 2; it++) { homem.updateMatrixWorld(true); homem.position.add(raiz.clone().sub(pel.getWorldPosition(V()))); }
  homem.updateMatrixWorld(true);
  for (const [osso, filho, de, para] of MAPA_ELENCO) {
    const b = O[osso]; if (!b) continue;
    const atual = filho ? O[filho].getWorldPosition(V()).sub(b.getWorldPosition(V())) : V(0, 1, 0).applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion()));
    giraMundo(b, atual, P(para).sub(P(de)));
  }
}

// ------------------------------------------------------------------------------------------------ montagem
export async function criarAcougue() {
  const g = new THREE.Group();
  const inox = new THREE.MeshStandardMaterial({ color: 0xc9cdd2, roughness: 0.28, metalness: 1.0 });
  const inoxEsc = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.35, metalness: 1.0 });
  // mesa de inox (tampo com borda dobrada e quatro pés com prateleira)
  const tampo = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.035, 0.85), inox); tampo.position.y = MESA_Y - 0.0175; tampo.castShadow = tampo.receiveShadow = true; g.add(tampo);
  const borda = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.06, 0.87), inoxEsc); borda.position.y = MESA_Y - 0.05; g.add(borda);
  for (const [x, z] of [[-0.8, -0.38], [0.8, -0.38], [-0.8, 0.38], [0.8, 0.38]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, MESA_Y - 0.06, 16), inox); p.position.set(x, (MESA_Y - 0.06) / 2, z); p.castShadow = true; g.add(p); }
  const prat = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.02, 0.78), inoxEsc); prat.position.y = 0.18; prat.receiveShadow = true; g.add(prat);
  // tábua de polietileno branca com marcas de faca
  const tabMat = new THREE.MeshStandardMaterial({ color: 0xd9d6cf, roughness: 0.7 });
  tabMat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + GLSL_RUIDO + '\nvarying vec3 vW;').replace('#include <color_fragment>', `#include <color_fragment>
      float risco = 1.0 - smoothstep(0.0, 0.004, abs(fract(vW.x * 23.0 + n3(vW * 9.0) * 1.5) - 0.5) * 0.08);
      diffuseColor.rgb *= 0.95 - 0.06 * risco * n3(vW * 40.0) + 0.04 * n3(vW * 6.0);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.75, 0.45, 0.42), 0.18 * smoothstep(0.6, 0.85, n3(vW * 5.0)));`);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;'); };
  const tabua = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.03, 0.45, 1, 1, 1), tabMat); tabua.position.set(0, MESA_Y + 0.015, 0.02); tabua.castShadow = tabua.receiveShadow = true; g.add(tabua);
  // peça de contra-filé: 6 fatias encostadas (o cutelo solta uma por golpe) + 3 bifes já cortados ao lado
  const ESP = 0.032, fatias = [];
  await carregarTexturas();
  const gf = geoFatia(ESP);
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(gf, matsCarne(i)); m.castShadow = true; m.receiveShadow = true;
    m.userData.x0 = -0.05 + i * (ESP + 0.0005); m.position.set(m.userData.x0, TABUA_Y, 0.02); g.add(m); fatias.push(m);
  }
  const bifes = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(gf, matsCarne(10 + i)); m.castShadow = true; m.receiveShadow = true;
    m.rotation.z = Math.PI / 2; m.rotation.y = 0.3 * (i - 1); m.position.set(-0.27 + i * 0.012, TABUA_Y + ESP / 2 + 0.004 + i * 0.002, -0.08 + i * 0.09); g.add(m); bifes.push(m);
  }
  // cutelo: lâmina retangular com furo, gume afiado, cabo de polipropileno preto com 3 rebites. Origem = ponto da pegada (meio do cabo)
  const cutelo = new THREE.Group(); g.add(cutelo);
  const lam = new THREE.Shape(); lam.moveTo(0.03, -0.004); lam.lineTo(0.215, -0.004); lam.quadraticCurveTo(0.235, -0.004, 0.235, 0.02); lam.lineTo(0.232, 0.10); lam.lineTo(0.03, 0.10); lam.lineTo(0.03, -0.004);
  const furo = new THREE.Path(); furo.absarc(0.205, 0.075, 0.011, 0, Math.PI * 2, true); lam.holes.push(furo);
  const geoL = new THREE.ExtrudeGeometry(lam, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.0015, bevelSegments: 2 }); geoL.translate(0, -0.10, -0.002);
  const aco = new THREE.MeshStandardMaterial({ color: 0xd4d8dc, roughness: 0.22, metalness: 1.0 });
  const lamina = new THREE.Mesh(geoL, aco); lamina.castShadow = true; cutelo.add(lamina);
  const gume = new THREE.Mesh(new THREE.BoxGeometry(0.205, 0.006, 0.0015), new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.1, metalness: 1.0 })); gume.position.set(0.1325, -0.103, 0); cutelo.add(gume);
  const cabo = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.10, 6, 16), new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.55 })); cabo.rotation.z = Math.PI / 2; cabo.position.set(-0.03, 0.0, 0); cabo.scale.set(1, 1, 0.75); cutelo.add(cabo);
  for (const x of [-0.07, -0.03, 0.01]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.026, 10), aco); r.rotation.x = Math.PI / 2; r.position.set(x, 0, 0); cutelo.add(r); }
  // pistola de dardo cativo (insensibilização): corpo cilíndrico, cabo e boca com o pino
  const pistola = new THREE.Group(); g.add(pistola);
  const ferro = new THREE.MeshStandardMaterial({ color: 0x6b7178, roughness: 0.35, metalness: 0.9 });
  const corpoP = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.36, 24), ferro); corpoP.rotation.z = Math.PI / 2; pistola.add(corpoP);
  const boca = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.05, 20), new THREE.MeshStandardMaterial({ color: 0x2c2f33, roughness: 0.4, metalness: 0.9 })); boca.rotation.z = Math.PI / 2; boca.position.x = 0.2; pistola.add(boca);
  const caboP = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.13, 0.035), new THREE.MeshStandardMaterial({ color: 0x1d1f22, roughness: 0.6 })); caboP.position.set(-0.08, -0.08, 0); caboP.rotation.z = 0.25; pistola.add(caboP);
  pistola.visible = false;
  // cronômetro de cozinha em cima da mesa, ao lado da carne: "tempo desde o abate"
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 400; const cx = cv.getContext('2d');
  const texRel = new THREE.CanvasTexture(cv); texRel.colorSpace = THREE.SRGBColorSpace;
  const painel = new THREE.Group(); g.add(painel); painel.position.set(-0.14, TABUA_Y + 0.03, 0.19); painel.rotation.set(-0.45, 0.10, 0, 'YXZ'); painel.scale.setScalar(0.15);
  const caixaR = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.36, 0.14), new THREE.MeshStandardMaterial({ color: 0x111418, roughness: 0.4 })); painel.add(caixaR);
  const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.297), new THREE.MeshBasicMaterial({ map: texRel, toneMapped: false })); tela.position.z = 0.071; painel.add(tela);
  const pe = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.06, 0.30), new THREE.MeshStandardMaterial({ color: 0x1b1e22, roughness: 0.5 })); pe.position.set(0, -0.19, -0.10); painel.add(pe);   // base inclinada
  let textoAnt = '';
  function relogio(min) {
    const h = Math.floor(min / 60), m = Math.floor(min % 60), s = Math.floor((min * 60) % 60);
    const txt = min < 60 ? `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${h} h ${String(m).padStart(2, '0')}`;
    if (txt === textoAnt) return; textoAnt = txt;
    cx.fillStyle = '#05070a'; cx.fillRect(0, 0, 1024, 400);
    cx.fillStyle = '#7fa6c9'; cx.font = '700 64px Inter, sans-serif'; cx.textAlign = 'center'; cx.fillText('DESDE O ABATE', 512, 86);
    cx.fillStyle = '#ff4d3d'; cx.shadowColor = '#ff2a1a'; cx.shadowBlur = 30; cx.font = '800 220px "JetBrains Mono", monospace'; cx.fillText(txt, 512, 330); cx.shadowBlur = 0;
    texRel.needsUpdate = true;
  }
  relogio(0);
  // açougueiro do elenco
  const ga = await new GLTFLoader().loadAsync('../biblioteca3d/personagens/elenco/acougueiro.glb');
  const homem = ga.scene; g.add(homem); homem.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
  const ik = new PoseIK(); ik.preparar(homem);
  const OS = ik.ossos, REST = {}; for (const n in OS) REST[n] = OS[n].quaternion.clone();
  const clip = await carregarClip('../biblioteca3d/mocap/cmu/62_08.json');          // CMU 62_08: martelando (peso, coluna, cabeça)
  homem.position.set(0.05, 0, -0.62);                                             // atrás da mesa, de frente para +Z

  /** golpe k (0..5) no instante tk; cutelo cai na fronteira da fatia k */
  function golpe(t, tempos) {
    let fase = null, k = -1;
    for (let i = 0; i < tempos.length; i++) if (t >= tempos[i] - 0.55 && t < tempos[i] + 0.45) { k = i; fase = (t - tempos[i]); }
    return { k, fase };
  }
  return {
    grupo: g, homem, cutelo, pistola, fatias, bifes, relogio,
    /** t: tempo; golpes: instantes em que o cutelo bate; soltas: quantas fatias já se soltaram; agarra: 0..1 mão esquerda na peça */
    atualizar(t, { golpes = [], en = 1, rigor = 0, comCutelo = true, homemVisivel = true } = {}) {
      UNI_CARNE.uT.value = t; UNI_CARNE.uEn.value = en; UNI_CARNE.uRigor.value = rigor;
      homem.visible = homemVisivel;
      // corpo: trecho rítmico da captura (6–12 s) em laço, com o ator de frente para a mesa
      const tc = 6.0 + ((t * 0.9) % 6.0);
      aplicarCorpo(homem, OS, REST, clip, tc, V(0.05, 0, -0.60));
      homem.updateMatrixWorld(true);
      // fatias: cada golpe solta a fatia da ponta (ela tomba para a frente da tábua)
      let soltas = 0; for (const tg of golpes) if (t > tg) soltas++;
      fatias.forEach((f, i) => {
        const ordem = i;                                                           // corta da ponta do lado do braço direito dele (-X)
        const tg = golpes[ordem]; const k = tg !== undefined ? suave(inv(tg + 0.02, tg + 0.45, t)) : 0;
        f.position.set(f.userData.x0 - 0.05 * k - 0.012 * (ordem < soltas ? 1 : 0), TABUA_Y + 0.01 * Math.sin(k * Math.PI), 0.02 + 0.03 * k);
        f.rotation.set(0, -0.15 * k, 1.25 * k);
      });
      // cutelo: sobe, desce rápido, bate na tábua, levanta um pouco (ou parado ao lado)
      if (comCutelo) {
        const { k, fase } = golpe(t, golpes);
        const xCorte = k >= 0 ? fatias[k].userData.x0 + ESP / 2 + 0.001 : -0.2;
        let alt = 0.0, ang = 0, recua = 0;
        if (k >= 0) {
          if (fase < -0.13) { const u = suave(inv(-0.62, -0.16, fase)); alt = 0.40 * u; ang = -1.25 * u; recua = 0.10 * u; }           // antecipação: sobe alto, lâmina para trás
          else if (fase < 0) { const u = inv(-0.13, 0, fase), e = u * u * u; alt = 0.40 * (1 - e); ang = -1.25 * (1 - e); recua = 0.10 * (1 - e); } // golpe: acelera até a tábua
          else if (fase < 0.07) { alt = -0.004 * Math.sin(fase / 0.07 * Math.PI); ang = 0.04; }                                            // impacto: crava e para
          else { const u = suave(inv(0.07, 0.45, fase)); alt = 0.06 * u; ang = -0.25 * u; recua = 0.02 * u; }                            // solta e prepara o próximo
        } else { alt = 0.10; ang = -0.3; }
        cutelo.rotation.order = 'YXZ'; cutelo.rotation.set(ang, -Math.PI / 2, 0.06 * Math.sin(ang));
        cutelo.position.set(xCorte - 0.55 * Math.max(0, alt - 0.03) - 0.06 * (alt > 0.3 ? (alt - 0.3) / 0.1 : 0), TABUA_Y + 0.105 + alt, -0.06 - recua - 0.05 * Math.sin(-ang));   // sobe pelo lado de fora (direita dele)
        cutelo.updateMatrixWorld(true);
        // mão direita no cabo; mão esquerda (luva de malha) segurando a peça do outro lado
        const pega = cutelo.localToWorld(V(-0.03, 0, 0));
        ik.ik('D', pega, V(-0.7, -1, -0.3).normalize(), V(0, 0, 1));
        ik.orientar('MaoD', pega.clone().sub(ik.pos('AntebracoD')).addScaledVector(V(0, 1, 0), 0.1), V(1, 0, 0));
        const esq = V(0.17, TABUA_Y + 0.075, 0.03);
        ik.ik('E', esq, V(0.7, -1, -0.3).normalize(), V(0, 0, 1));
        ik.orientar('MaoE', V(-0.1, -1, 0.35), V(0, 0, 1));
      }
    },
  };
}
