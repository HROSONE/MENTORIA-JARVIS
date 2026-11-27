// PNEU SEM CÂMARA + ARO DE AÇO (265/70 R16, picape), procedural no Three.js, deitado (eixo em +Y) — feito para o Short do "pneu com fogo".
// Medidas: aro 16" (raio do assento do talão 0,2032 m), largura do aro ~7,5", seção 265 mm, flanco 70% (185 mm), raio externo ~0,389 m.
// O perfil da carcaça (seção transversal) é girado em volta do eixo (LatheGeometry), com dois estados como alvos de morph:
//   assentado (talões encostados nas abas do aro) e solto (talões caídos no rebaixo central, flanco murcho) — `assentar(kSup, kInf)`.
// Corte transversal: `cortar(ang)` abre uma fatia (phiLength < 2π) e mostra as tampas do corte com as camadas (borracha, lonas, cintas de
// aço, arames do talão) desenhadas numa textura. Banda de rodagem com blocos (normal map gerada em canvas) e letras HRYZ no flanco.
// Coordenadas do perfil: (r, y) com r = raio, y = eixo (y > 0 = lado de cima do pneu deitado). Unidades: metros.
import * as THREE from 'three';

const V2 = (x, y) => new THREE.Vector2(x, y);
export const MED = { R_ASSENTO: 0.2032, R_EXT: 0.389, ABA_Y: 0.100, LARG: 0.133 };

// ---------------------------------------------------------------------------------------------- perfil da carcaça
// linha média da carcaça (metade de cima, do talão até o centro da banda), nos dois estados
const MEIO_ASSENT = [[0.212, 0.095], [0.235, 0.112], [0.272, 0.128], [0.310, 0.133], [0.345, 0.128], [0.366, 0.113], [0.375, 0.082], [0.378, 0.041], [0.379, 0.0]];
const MEIO_SOLTO = [[0.190, 0.052], [0.220, 0.084], [0.265, 0.112], [0.305, 0.123], [0.343, 0.121], [0.364, 0.108], [0.374, 0.080], [0.378, 0.041], [0.379, 0.0]];
// espessura para fora e para dentro ao longo da linha (s = 0 no talão, 1 no centro da banda)
const espFora = s => s < 0.08 ? 0.016 : s < 0.62 ? 0.008 + 0.002 * Math.sin(s * 9) : 0.008 + 0.022 * Math.min(1, (s - 0.62) / 0.12);
const espDentro = s => s < 0.08 ? 0.012 : 0.006;
function reamostrar(P, n) {
  const pts = P.map(p => V2(p[0], p[1])); const curva = new THREE.SplineCurve(pts); return curva.getSpacedPoints(n);
}
/** contorno fechado da seção (lado y>0 e y<0) para um estado; mesma contagem de pontos nos dois estados (para o morph) */
function secao(meio, n = 90, ySup = 1, yInf = 1) {
  const M = reamostrar(meio, n);
  const lado = (sinal) => {
    const fora = [], dentro = [];
    for (let i = 0; i <= n; i++) {
      const s = i / n, p = M[i], q = M[Math.min(n, i + 1)], o = M[Math.max(0, i - 1)];
      const t = V2(q.x - o.x, q.y - o.y).normalize(); const nor = V2(t.y, -t.x);              // normal para fora (r maior / y maior)
      if (nor.x * (p.x - 0.285) + nor.y * p.y < 0) nor.multiplyScalar(-1);                         // para fora da cavidade de ar (centro ~ r 0,285, y 0)
      fora.push(V2(p.x + nor.x * espFora(s), (p.y + nor.y * espFora(s)) * sinal));
      dentro.push(V2(p.x - nor.x * espDentro(s), (p.y - nor.y * espDentro(s)) * sinal));
    }
    return { fora, dentro };
  };
  const sup = lado(1), inf = lado(-1);
  // contorno: talão de cima (dentro→fora) ... banda ... talão de baixo, voltando por dentro
  const ext = [...sup.fora, ...inf.fora.slice(0, -1).reverse()];
  const int = [...sup.dentro, ...inf.dentro.slice(0, -1).reverse()];
  return [...ext, ...int.reverse(), ext[0].clone()];
}
// ---------------------------------------------------------------------------------------------- texturas (canvas)
function texBanda() {
  // u = volta do pneu (2048 px), v = ao longo do contorno (1024 px): blocos da banda, letras no flanco
  const W = 2048, H = 1024, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, W, H);                                                  // altura média
  return { c, g, W, H };
}
function texCorte() {
  const W = 1024, H = 1024, c = document.createElement('canvas'); c.width = W; c.height = H; return { c, g: c.getContext('2d'), W, H };
}
// ---------------------------------------------------------------------------------------------- montagem
export function criarRoda({ segs = 220, corte = 0 } = {}) {
  const grupo = new THREE.Group(); grupo.name = 'roda';
  const NP = 90;
  const A = secao(MEIO_ASSENT, NP), S = secao(MEIO_SOLTO, NP);
  const N = A.length;
  // ---- textura da superfície: posição de cada ponto do contorno em v; banda = região de r alto
  const vDe = A.map((p, i) => i / (N - 1));
  const bt = texBanda();
  { const { g, W, H } = bt;
    // blocos da banda (all-terrain): dois anéis de blocos desencontrados + sulco central em zigue-zague
    for (let i = 0; i < N - 1; i++) {
      const p = A[i]; if (p.x < 0.356) continue;                                                     // só a banda
      const v0 = vDe[i] * H, v1 = vDe[i + 1] * H, y = p.y;
      const nb = 64;
      for (let k = 0; k < nb; k++) {
        const u0 = k / nb * W, larg = W / nb;
        const lado = y > 0 ? 1 : -1, desloc = (y > 0 ? 0 : 0.5) * larg, centro = Math.abs(y) < 0.012;
        const sulco = centro || (Math.abs(Math.abs(y) - 0.06 - 0.006 * Math.sin(k * 2.2)) < 0.006);
        g.fillStyle = sulco ? '#202020' : '#c8c8c8';
        g.fillRect((u0 + desloc + (Math.abs(y) > 0.06 ? larg * 0.15 : 0)) % W, v0, larg * (sulco ? 1 : 0.78), v1 - v0 + 1);
      }
    }
    // lamelas finas nos blocos
    g.strokeStyle = 'rgba(40,40,40,0.8)'; g.lineWidth = 2;
    for (let k = 0; k < 64 * 3; k++) { const u = k / (64 * 3) * W; g.beginPath(); g.moveTo(u, H * 0.40); g.lineTo(u + 6, H * 0.60); g.stroke(); }
  }
  const tNormal = new THREE.CanvasTexture(bt.c); tNormal.wrapS = THREE.RepeatWrapping;
  // ---- letras no flanco de cima: textura de cor separada (relevo de borracha um pouco mais clara)
  const lc = document.createElement('canvas'); lc.width = 4096; lc.height = 512; const lg = lc.getContext('2d');
  lg.fillStyle = '#000'; lg.fillRect(0, 0, 4096, 512); lg.fillStyle = '#fff'; lg.textBaseline = 'middle'; lg.textAlign = 'center';
  const rotulos = ['HRYZ ANIMATION', 'ALL TERRAIN T/A', 'LT265/70R16', 'HRYZ', 'TUBELESS', 'MAX PRESS 50 PSI'];   // a marca do canal no flanco
  rotulos.forEach((s, i) => { lg.font = (s.startsWith('HRYZ') ? '900 200px' : '700 120px') + ' Inter, Arial, sans-serif'; lg.fillText(s, (i + 0.5) / rotulos.length * 4096, 256); });
  const tLetras = new THREE.CanvasTexture(lc); tLetras.wrapS = THREE.RepeatWrapping; tLetras.colorSpace = THREE.SRGBColorSpace;
  // ---- geometria: lathe nos dois estados (morph)
  const fazer = (pts, phiLen) => new THREE.LatheGeometry(pts, segs, Math.PI / 2 + (2 * Math.PI - phiLen) / 2, phiLen);
  let geoPneu = null, capas = [];
  const borracha = new THREE.MeshPhysicalMaterial({ color: 0x17181a, roughness: 0.78, metalness: 0, sheen: 0.3, sheenRoughness: 0.6, sheenColor: new THREE.Color(0x3a3a3e), side: THREE.DoubleSide });
  const uniP = { uLetras: { value: tLetras }, uBanda: { value: tNormal } };
  borracha.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, uniP);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vUvP; varying vec3 vPosP;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvUvP = uv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPosP = transformed;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform sampler2D uLetras, uBanda; varying vec2 vUvP; varying vec3 vPosP;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float r = length(vPosP.xz), y = vPosP.y;
        // letras HRYZ em relevo no flanco de cima (entre r 0,26 e 0,33)
        float ang = atan(vPosP.z, vPosP.x) / 6.2831853 + 0.5;
        float vL = (r - 0.262) / 0.066;
        if (y > 0.05 && vL > 0.0 && vL < 1.0) { float l = texture2D(uLetras, vec2(-ang * 3.0, 1.0 - vL)).r; diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.13), l); }
        // banda: sulcos mais escuros e borracha gasta mais clara no topo dos blocos
        float b = texture2D(uBanda, vUvP).r;
        if (r > 0.36) diffuseColor.rgb *= mix(0.55, 1.15, b);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        if (length(vPosP.xz) > 0.36) {
          vec2 e = vec2(1.0 / 2048.0, 1.0 / 1024.0);
          float h0 = texture2D(uBanda, vUvP).r, hu = texture2D(uBanda, vUvP + vec2(e.x * 2.0, 0.0)).r, hv = texture2D(uBanda, vUvP + vec2(0.0, e.y * 2.0)).r;
          normal = normalize(normal + (vec3(h0 - hu, h0 - hv, 0.0)) * 2.5);
        }`);
  };
  borracha.customProgramCacheKey = () => 'pneuBorracha';
  const forro = new THREE.MeshStandardMaterial({ color: 0x2a2b2e, roughness: 0.9, side: THREE.BackSide });   // parte de dentro (inner liner)
  const pneu = new THREE.Mesh(new THREE.BufferGeometry(), borracha); pneu.castShadow = pneu.receiveShadow = true; grupo.add(pneu);
  // ---- tampa do corte: a seção com as camadas desenhadas (textura no próprio sistema (r, y) do perfil)
  const tc = texCorte();
  function desenharCorte(k) {
    const { g, W, H } = tc, map = (p) => [((p.x - 0.17) / 0.24) * W, (0.5 - p.y / 0.32) * H];
    g.fillStyle = '#000000'; g.fillRect(0, 0, W, H);
    const pts = A.map((p, i) => V2(p.x + (S[i].x - p.x) * (1 - k), p.y + (S[i].y - p.y) * (1 - k)));
    g.fillStyle = '#18191b'; g.beginPath(); pts.forEach((p, i) => { const [x, y] = map(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.fill();
    // linha média (lona da carcaça) e cintas de aço sob a banda, arames do talão
    const meio = reamostrar(MEIO_ASSENT.map((p, i) => [p[0] + (MEIO_SOLTO[i][0] - p[0]) * (1 - k), p[1] + (MEIO_SOLTO[i][1] - p[1]) * (1 - k)]), 60);
    for (const sinal of [1, -1]) {
      g.strokeStyle = '#c9b48a'; g.lineWidth = 7; g.beginPath(); meio.forEach((p, i) => { const [x, y] = map(V2(p.x, p.y * sinal)); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();   // lona de poliéster
      g.strokeStyle = '#9aa1a8'; g.lineWidth = 6;
      for (const off of [0.010, 0.016]) { g.beginPath(); meio.forEach((p, i) => { if (p.x < 0.366) return; const [x, y] = map(V2(p.x + off, p.y * sinal)); g.lineTo(x, y); }); g.stroke(); }   // cintas de aço
      const b = meio[0]; g.fillStyle = '#b8bec5';
      for (let a = 0; a < 3; a++) for (let c = 0; c < 3; c++) { const [x, y] = map(V2(b.x - 0.004 + a * 0.0045, (b.y - 0.004 + c * 0.0045) * sinal)); g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); }   // feixe de arames do talão
    }
    texC.needsUpdate = true;
  }
  const texC = new THREE.CanvasTexture(tc.c); texC.colorSpace = THREE.SRGBColorSpace;
  const matCorte = new THREE.MeshStandardMaterial({ map: texC, roughness: 0.7, side: THREE.DoubleSide });
  // ---- aro de aço: perfil girado (aba, assento do talão, ressalto, rebaixo central) + disco com furos + válvula
  const RA = MED.R_ASSENTO;
  const meioAro = [[RA + 0.019, 0.104], [RA + 0.016, 0.098], [RA + 0.006, 0.095], [RA, 0.090], [RA, 0.075], [RA + 0.002, 0.068], [RA - 0.004, 0.062], [RA - 0.024, 0.045], [RA - 0.027, 0.030],
                   [RA - 0.027, -0.030], [RA - 0.024, -0.045], [RA - 0.004, -0.062], [RA + 0.002, -0.068], [RA, -0.075], [RA, -0.090], [RA + 0.006, -0.095], [RA + 0.016, -0.098], [RA + 0.019, -0.104]];
  const ptsAro = []; const MA = new THREE.SplineCurve(meioAro.map(p => V2(p[0], p[1]))).getSpacedPoints(120);
  MA.forEach(p => ptsAro.push(V2(p.x, p.y))); for (let i = MA.length - 1; i >= 0; i--) ptsAro.push(V2(MA[i].x - 0.0035, MA[i].y)); ptsAro.push(ptsAro[0].clone());
  const aco = new THREE.MeshStandardMaterial({ color: 0x2e3238, roughness: 0.35, metalness: 0.85 });           // aço pintado de grafite
  const acoBorda = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.25, metalness: 1 });
  const aro = new THREE.Mesh(new THREE.BufferGeometry(), aco); aro.castShadow = aro.receiveShadow = true; grupo.add(aro);
  const formaDisco = new THREE.Shape(); formaDisco.absarc(0, 0, RA - 0.026, 0, Math.PI * 2, false);
  const furo = (x, y, r) => { const p = new THREE.Path(); p.absarc(x, y, r, 0, Math.PI * 2, true); formaDisco.holes.push(p); };
  furo(0, 0, 0.054);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; furo(Math.cos(a) * 0.0695, Math.sin(a) * 0.0695, 0.0075); }
  for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * Math.PI * 2, p = new THREE.Path(); const cx = Math.cos(a) * 0.128, cy = Math.sin(a) * 0.128;
    p.absellipse(cx, cy, 0.03, 0.018, 0, Math.PI * 2, true, a); formaDisco.holes.push(p); }
  const disco = new THREE.Mesh(new THREE.ExtrudeGeometry(formaDisco, { depth: 0.005, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2, curveSegments: 48 }).rotateX(-Math.PI / 2), aco);
  disco.position.y = 0.035; disco.castShadow = disco.receiveShadow = true; grupo.add(disco);
  const cubo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.03, 48, 1, true), acoBorda); cubo.position.y = 0.05; grupo.add(cubo);
  const valvula = new THREE.Group(); grupo.add(valvula);
  const corpoV = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0075, 0.045, 16), new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.6 })); valvula.add(corpoV);
  const capV = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.012, 16), acoBorda); capV.position.y = 0.028; valvula.add(capV);
  valvula.position.set(RA - 0.03, 0.02, 0); valvula.rotation.z = 0.35;
  // ---- estado
  let kSup = 1, kInf = 1, phiAtual = -1;
  function montarPneu(phi) {
    const geoA = fazer(A, phi), geoS = fazer(S, phi);
    geoA.morphAttributes.position = [geoS.attributes.position];
    geoA.computeVertexNormals();
    // normais do estado solto para o morph
    geoS.computeVertexNormals(); geoA.morphAttributes.normal = [geoS.attributes.normal];
    pneu.geometry.dispose(); pneu.geometry = geoA; pneu.morphTargetInfluences = [0]; pneu.updateMorphTargets();
    aro.geometry.dispose(); aro.geometry = fazer(ptsAro, phi); aro.geometry.computeVertexNormals();
    for (const c of capas) { grupo.remove(c); c.geometry.dispose(); } capas = [];
    if (phi < Math.PI * 2 - 1e-3) {
      // tampas: a seção (forma do contorno) nos dois ângulos do corte
      const ini = Math.PI / 2 + (2 * Math.PI - phi) / 2;
      for (const a of [ini, ini + phi]) {
        const forma = new THREE.Shape(A.slice(0, -1).map(p => V2(p.x, p.y)));
        const geo = new THREE.ShapeGeometry(forma, 1);
        // UV pelo sistema (r, y) da textura do corte
        const uv = geo.attributes.uv, pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - 0.17) / 0.24, 0.5 + pos.getY(i) / 0.32);
        const m = new THREE.Mesh(geo, matCorte);
        m.rotation.order = 'YXZ'; m.rotation.y = a - Math.PI / 2;                                  // eixo x da forma (raio) → direção do corte (sen a, 0, cos a)
        m.userData.ang = a; grupo.add(m); capas.push(m);
        // tampa do aro
        const fa = new THREE.Shape(ptsAro.slice(0, -1).map(p => V2(p.x, p.y))); const ga = new THREE.Mesh(new THREE.ShapeGeometry(fa, 1), acoBorda);
        ga.rotation.copy(m.rotation); grupo.add(ga); capas.push(ga);
      }
    }
    phiAtual = phi;
  }
  montarPneu(Math.PI * 2 - corte);
  desenharCorte(1);
  return {
    grupo, pneu, aro, disco, valvula, MED,
    /** abre (ou fecha) o corte transversal: ang = tamanho da fatia aberta (0 = pneu inteiro) */
    cortar(ang) { const phi = Math.PI * 2 - ang; if (Math.abs(phi - phiAtual) > 1e-4) montarPneu(phi); },
    /** assentamento do talão: 1 = encostado na aba do aro (cheio), 0 = solto no rebaixo (vazio). Sup = lado de cima, inf = de baixo. */
    assentar(sup, inf = sup) {
      kSup = sup; kInf = inf; pneu.morphTargetInfluences[0] = 1 - Math.min(sup, inf) * 0.5 - Math.max(sup, inf) * 0.5;
      if (capas.length) desenharCorte(0.5 * (sup + inf));
      // as tampas do corte deformam junto (refeitas da seção interpolada)
      const k = 0.5 * (sup + inf);
      for (const c of capas) {
        if (c.material !== matCorte) continue;
        const pts = A.slice(0, -1).map((p, i) => V2(p.x + (S[i].x - p.x) * (1 - k), p.y + (S[i].y - p.y) * (1 - k)));
        const geo = new THREE.ShapeGeometry(new THREE.Shape(pts), 1), uv = geo.attributes.uv, pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - 0.17) / 0.24, 0.5 + pos.getY(i) / 0.32);
        c.geometry.dispose(); c.geometry = geo;
      }
    },
    /** contorno interno (cavidade de ar) na seção para um assentamento k: para pôr moléculas, chama e setas de pressão */
    cavidade(k = 1) {
      const pts = A.map((p, i) => V2(p.x + (S[i].x - p.x) * (1 - k), p.y + (S[i].y - p.y) * (1 - k)));
      const meio = Math.floor(pts.length / 2);
      return { interno: pts.slice(meio, pts.length - 1), aro: MA };
    },
    /** fresta entre o talão de cima e a aba do aro (0 = vedado): onde o spray entra e a chama sai */
    fresta(k = kSup) { return { r: RA + 0.012, y: 0.095 * k + 0.052 * (1 - k), abertura: 0.03 * (1 - k) }; },
  };
}
