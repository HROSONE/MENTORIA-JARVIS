// Objetos e efeitos do Short "pneu com fogo": lata de spray (rótulo Hryz Animation), isqueiro, névoa do spray, moléculas no corte,
// frente de chama no anel, labareda saindo pela fresta, fumaça, setas de pressão, manômetro, mangueira de ar e placa de aviso.
// Tudo é função do tempo (partículas com posição fechada no tempo, sem estado acumulado).
import * as THREE from 'three';
import { canvasTex, texBrilho, texFumaca } from '../../core/motor.js';
import { clamp, lerp, mulberry32, suave } from '../../core/util.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------------------------------------- textura de fogo (chama com borda suave)
let _fogo = null;
export function texFogo() {
  if (_fogo) return _fogo;
  const r = mulberry32(9);
  return _fogo = canvasTex(256, 256, (g, w, h) => {
    for (let i = 0; i < 60; i++) {
      const x = w / 2 + (r() - 0.5) * w * 0.35, y = h * 0.62 + (r() - 0.5) * h * 0.4, rr = w * (0.08 + r() * 0.16);
      const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(255,230,150,0.35)'); gr.addColorStop(0.5, 'rgba(255,120,20,0.18)'); gr.addColorStop(1, 'rgba(200,40,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
    const f = g.createRadialGradient(w / 2, h / 2, w * 0.15, w / 2, h / 2, w / 2); f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(1, 'rgba(0,0,0,1)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = f; g.fillRect(0, 0, w, h);
  });
}

// ---------------------------------------------------------------------------------------------- lata de spray e isqueiro
export function criarLata() {
  const g = new THREE.Group();
  const rot = canvasTex(1024, 512, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d72a1f'); gr.addColorStop(1, '#9c1710'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffd23f'; c.fillRect(0, h * 0.30, w, h * 0.06);
    c.fillStyle = '#fff'; c.font = '900 120px Inter, Arial'; c.textAlign = 'center'; c.fillText('HRYZ', w * 0.30, h * 0.24);
    c.font = '800 46px Inter, Arial'; c.fillText('ANIMATION', w * 0.30, h * 0.48);
    c.font = '900 62px Inter, Arial'; c.fillText('PARTIDA RÁPIDA', w * 0.30, h * 0.66);
    c.fillStyle = '#ffd23f'; c.font = '800 40px Inter, Arial'; c.fillText('⚠ EXTREMAMENTE INFLAMÁVEL', w * 0.30, h * 0.82);
    // pictograma de chama
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(w * 0.78, h * 0.25); c.lineTo(w * 0.92, h * 0.25); c.lineTo(w * 0.92, h * 0.75); c.lineTo(w * 0.78, h * 0.75); c.closePath(); c.fill();
    c.fillStyle = '#111'; c.beginPath(); c.moveTo(w * 0.85, h * 0.32); c.quadraticCurveTo(w * 0.90, h * 0.50, w * 0.86, h * 0.68); c.quadraticCurveTo(w * 0.80, h * 0.60, w * 0.85, h * 0.32); c.fill();
  });
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.19, 48, 1, true), new THREE.MeshStandardMaterial({ map: rot, roughness: 0.32, metalness: 0.45 }));
  g.add(corpo);
  const metal = new THREE.MeshStandardMaterial({ color: 0xc8ccd2, roughness: 0.25, metalness: 1 });
  const fundo = new THREE.Mesh(new THREE.SphereGeometry(0.033, 32, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), metal); fundo.position.y = -0.095; fundo.scale.y = 0.25; g.add(fundo);
  const domo = new THREE.Mesh(new THREE.SphereGeometry(0.033, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), metal); domo.position.y = 0.095; domo.scale.y = 0.55; g.add(domo);
  const valv = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.011, 0.018, 16), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 })); valv.position.y = 0.122; g.add(valv);
  const bico = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.03, 8), new THREE.MeshStandardMaterial({ color: 0xd8d8d8 })); bico.rotation.z = Math.PI / 2; bico.position.set(0.02, 0.124, 0); g.add(bico);
  const ponta = new THREE.Object3D(); ponta.position.set(0.036, 0.124, 0); g.add(ponta);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { grupo: g, ponta };
}
export function criarIsqueiro() {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.075, 0.012), new THREE.MeshPhysicalMaterial({ color: 0x1f6fd6, roughness: 0.2, transmission: 0.0, clearcoat: 1 })); g.add(corpo);
  const topo = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.014, 0.013), new THREE.MeshStandardMaterial({ color: 0xbfc4ca, metalness: 1, roughness: 0.3 })); topo.position.y = 0.044; g.add(topo);
  const roda = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.008, 16), new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 1, roughness: 0.5 })); roda.rotation.x = Math.PI / 2; roda.position.set(-0.004, 0.053, 0); g.add(roda);
  const chama = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFogo(), color: 0xffb347, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  chama.scale.set(0.025, 0.05, 1); chama.position.set(0.004, 0.075, 0); g.add(chama);
  const brilhoC = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrilho('255,170,60'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); brilhoC.scale.setScalar(0.09); brilhoC.position.copy(chama.position); g.add(brilhoC);
  const luz = new THREE.PointLight(0xffa040, 0, 1.2, 2); luz.position.copy(chama.position); g.add(luz);
  corpo.castShadow = true;
  return { grupo: g, acesa(k, t) { chama.visible = brilhoC.visible = k > 0.01; const f = 1 + 0.15 * Math.sin(t * 37) + 0.1 * Math.sin(t * 23); chama.scale.set(0.025 * k * f, 0.05 * k * f, 1); brilhoC.material.opacity = 0.7 * k; luz.intensity = 0.015 * k * f; }, ponta: chama };
}

// ---------------------------------------------------------------------------------------------- pontos (sprites instanciados por Points)
/** altura do quadro em pixels (o tamanho das partículas acompanha a resolução) */
export const ALTURA = { value: 960 };
const FRAG_FOGO = `varying vec3 vC; varying float vA;
  void main(){ vec2 p = gl_PointCoord * 2.0 - 1.0; p.y = -p.y;                       // y para cima
    p.x *= 1.0 + 0.9 * max(p.y, 0.0);                                                  // afina em cima: língua de fogo
    float d = length(vec2(p.x, (p.y + 0.15) * 0.8)); float a = smoothstep(1.0, 0.0, d); a = a * a;
    float nucleo = smoothstep(0.55, 0.0, d);
    gl_FragColor = vec4(mix(vC, vec3(1.0, 0.8, 0.45), nucleo * 0.3) * a * vA, 1.0); }`;
function nuvemPontos(n, tex, { aditivo = true, cor = 0xffffff, fogo = false } = {}) {
  const pos = new Float32Array(n * 3), tam = new Float32Array(n), corA = new Float32Array(n * 3), alfa = new Float32Array(n);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('tam', new THREE.BufferAttribute(tam, 1));
  geo.setAttribute('cor', new THREE.BufferAttribute(corA, 3)); geo.setAttribute('alfa', new THREE.BufferAttribute(alfa, 1));
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: { mapa: { value: tex }, altura: ALTURA },
    vertexShader: 'attribute float tam; attribute vec3 cor; attribute float alfa; varying vec3 vC; varying float vA; uniform float altura; void main(){ vC = cor; vA = alfa; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = tam * projectionMatrix[1][1] * altura * 0.5 / -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: fogo ? FRAG_FOGO : 'uniform sampler2D mapa; varying vec3 vC; varying float vA; void main(){ vec4 c = texture2D(mapa, gl_PointCoord); gl_FragColor = vec4(c.rgb * vC, c.a * vA); }' });
  if (fogo) { mat.blending = THREE.CustomBlending; mat.blendSrc = THREE.OneFactor; mat.blendDst = THREE.OneFactor; }   // aditivo puro (a forma já vem multiplicada)
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
  return { pts, pos, tam, corA, alfa, geo, n, pronto() { for (const k of ['position', 'tam', 'cor', 'alfa']) geo.attributes[k].needsUpdate = true; } };
}

// ---------------------------------------------------------------------------------------------- efeitos ligados à roda
export function criarEfeitos(roda) {
  const g = new THREE.Group(); roda.grupo.add(g);                                      // tudo no sistema da roda (eixo +Y)
  const r = mulberry32(21);
  // névoa do spray: do bico (no mundo) até a fresta
  const nevoa = nuvemPontos(500, texFumaca(), { aditivo: false });
  const N0 = []; for (let i = 0; i < nevoa.n; i++) N0.push({ f: r(), dx: r() - 0.5, dy: r() - 0.5, dz: r() - 0.5, s: 0.5 + r() });
  // moléculas dentro da cavidade (vapor azul e ar branco), visíveis no corte
  const mol = nuvemPontos(1400, texBrilho('255,255,255'));
  const cav = roda.cavidade(1), interno = cav.interno;
  const dentro = (rr, y) => {                                                            // ponto (r, y) dentro da cavidade do pneu assentado e acima do aro
    let w = 0; for (let i = 0; i < interno.length - 1; i++) { const a = interno[i], b = interno[i + 1]; if ((a.x - rr) * (b.x - rr) <= 0 && Math.abs(b.x - a.x) > 1e-6) w = Math.max(w, Math.abs(a.y + (b.y - a.y) * (rr - a.x) / (b.x - a.x))); }
    return Math.abs(y) < w - 0.006 && rr > 0.212;
  };
  const M = [];
  while (M.length < mol.n) { const rr = 0.20 + r() * 0.17, y = (r() - 0.5) * 0.27; if (!dentro(rr, y)) continue; M.push({ rr, y, a: r(), vapor: M.length % 3 === 0, f1: r() * 10, f2: r() * 10, f3: r() * 10 }); }
  // fogo no anel: partículas que acendem atrás da frente de chama
  const fogo = nuvemPontos(1400, null, { fogo: true });
  const F = []; for (let i = 0; i < fogo.n; i++) { let rr, y; do { rr = 0.20 + r() * 0.17; y = (r() - 0.5) * 0.25; } while (!dentro(rr, y)); F.push({ rr, y, a: r(), f: r() }); }
  // labareda saindo pela fresta (de cima) e fumaça depois
  const laba = nuvemPontos(700, null, { fogo: true }), fum = nuvemPontos(160, texFumaca(), { aditivo: false });
  const L = []; for (let i = 0; i < laba.n; i++) L.push({ a: r(), v: 0.6 + r() * 1.4, s: 0.6 + r() * 0.8, f: r(), atraso: r() * 0.35, dr: r() - 0.5 });
  const luzFogo = new THREE.PointLight(0xff8a2a, 0, 3, 2); luzFogo.position.set(0, 0.3, 0); g.add(luzFogo);
  const brilhoAnel = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.07, 16, 96), new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  brilhoAnel.rotation.x = Math.PI / 2; g.add(brilhoAnel);
  // seção da cavidade nas duas faces do corte, com fogo em fbm (fica um tiquinho para dentro da borracha)
  const matJanela = () => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { k: { value: 0 }, t: { value: 0 } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float k, t; varying vec2 vP;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * n(p); p = p * 2.03 + 1.7; a *= 0.5; } return s; }
      void main(){
        vec2 q = vec2(vP.x * 28.0 - t * 2.5, vP.y * 28.0);                                // o fogo corre para fora (r maior)
        float f = fbm(q + vec2(fbm(q * 0.7 + t * 0.9), fbm(q * 0.7 - t * 0.8)) * 1.8);
        float borda = smoothstep(0.205, 0.235, vP.x);                                      // apaga junto do aro
        float e = clamp((f - 0.28) * 1.9, 0.0, 1.0) * borda;
        vec3 c = mix(vec3(0.55, 0.06, 0.0), vec3(1.0, 0.42, 0.04), smoothstep(0.1, 0.55, e)); c = mix(c, vec3(1.0, 0.9, 0.55), smoothstep(0.6, 1.0, e));
        gl_FragColor = vec4(c * e * k * 1.1, 1.0); }` });
  const janelas = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.BufferGeometry(), matJanela()); m.rotation.order = 'YXZ'; m.visible = false; m.renderOrder = 5; g.add(m); return m; });
  let kJan = -1;
  function janelaForma(k) {
    if (Math.abs(k - kJan) < 1e-3) return; kJan = k;
    const pts = roda.cavidade(k).interno.map(p => new THREE.Vector2(p.x, p.y));
    const geo = new THREE.ShapeGeometry(new THREE.Shape(pts), 1);
    janelas.forEach((j, i) => { j.geometry.dispose(); j.geometry = i ? geo.clone() : geo; });
  }
  // a face do corte fica em θ = π/2 ± ang/2; a forma (x = raio) gira com rotation.y = θ − π/2
  function janelaAng(corteAng) { const c = corteAng / 2 + 0.004; janelas[0].rotation.y = c; janelas[1].rotation.y = -c; }
  // setas de pressão no plano do corte (empurram as paredes e os talões para fora)
  const setas = new THREE.Group(); g.add(setas);
  const matSeta = new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.95, depthTest: false });
  const DIRS = [[0.30, 0.10, 0.25, 1.0], [0.34, 0.06, 0.6, 0.8], [0.36, 0.0, 1, 0], [0.34, -0.06, 0.6, -0.8], [0.30, -0.10, 0.25, -1.0], [0.25, 0.10, -0.2, 1], [0.25, -0.10, -0.2, -1]];
  for (const [rr, y, dr, dy] of DIRS) {
    const s = new THREE.Group(); const corpoS = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.05, 8), matSeta); corpoS.position.y = 0.025; s.add(corpoS);
    const cab = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.025, 12), matSeta); cab.position.y = 0.06; s.add(cab);
    s.userData = { rr, y, dir: new THREE.Vector2(dr, dy).normalize() }; s.renderOrder = 20; setas.add(s);
  }
  g.add(nevoa.pts, mol.pts, fogo.pts, laba.pts, fum.pts);
  for (const o of [nevoa.pts, mol.pts, fogo.pts, laba.pts, fum.pts]) o.renderOrder = 10;   // depois da borracha translúcida do raio-x
  return {
    g, luzFogo, janelaAng,
    /** névoa do spray saindo de `bicoMundo` em direção à fresta (k = quanto está borrifando) */
    nevoa(t, k, bicoMundo) {
      const inv = roda.grupo.matrixWorld.clone().invert(), bico = bicoMundo.clone().applyMatrix4(inv);
      const fr = roda.fresta(), alvo = V(-fr.r - 0.005, fr.y + 0.004, 0.01);                  // a fresta do lado do operador (-x)
      for (let i = 0; i < nevoa.n; i++) {
        const o = N0[i], c = (t * 1.6 + o.f) % 1, p = bico.clone().lerp(alvo, c);
        const abre = 0.006 + c * 0.05; p.x += o.dx * abre; p.y += o.dy * abre * 0.6; p.z += o.dz * abre;
        nevoa.pos.set([p.x, p.y, p.z], i * 3); nevoa.tam[i] = 0.035 * o.s * (0.4 + 1.2 * c) * k; nevoa.alfa[i] = 0.4 * k * Math.sin(c * Math.PI); nevoa.corA.set([0.85, 0.9, 1.0], i * 3);
      }
      nevoa.pronto();
    },
    /** moléculas: vapor (azul) e ar (branco); calor 0..1 (agitação e cor), visível no ângulo do corte */
    moleculas(t, { vis = 0, mistura = 1, calor = 0, cortePhi = 1.2 } = {}) {
      const amp = lerp(0.004, 0.02, calor), vel = lerp(1.5, 9, calor);
      for (let i = 0; i < mol.n; i++) {
        const o = M[i];
        // ângulo: perto das duas faces do corte (onde a gente vê a seção)
        const face = i % 2 ? 1 : -1, a = Math.PI / 2 + face * (cortePhi / 2 + 0.01 + o.a * 0.30);   // logo atrás de cada face do corte
        let rr = o.rr + amp * Math.sin(t * vel + o.f1), y = o.y + amp * Math.sin(t * vel * 1.3 + o.f2);
        // antes de misturar, o vapor fica perto da fresta de cima
        if (o.vapor) { const m = clamp(mistura); rr = lerp(0.24 + o.a * 0.05, rr, m); y = lerp(0.07 + o.a * 0.03, y, m); }
        mol.pos.set([rr * Math.sin(a), y, rr * Math.cos(a)], i * 3);
        mol.tam[i] = (o.vapor ? 0.009 : 0.0065) * vis * (1 - 0.5 * o.a);
        const quente = calor; mol.corA.set(o.vapor ? [lerp(0.4, 1.0, quente), lerp(0.75, 0.55, quente), lerp(1.0, 0.2, quente)] : [1, lerp(1, 0.75, quente), lerp(1, 0.45, quente)], i * 3);
        mol.alfa[i] = vis * (o.vapor ? 0.95 : 0.6);
      }
      mol.pronto();
    },
    /** frente de chama girando no anel a partir da fresta (frente 0..1 da volta); queima = brilho geral */
    chama(t, { frente = 0, queima = 0, vis = 1, kAssento = 1 } = {}) {
      for (let i = 0; i < fogo.n; i++) {
        const o = F[i], aRel = o.a;                                                     // posição na volta (0..1) a partir da fresta
        const aceso = clamp((frente - aRel) / 0.06) * (1 - clamp((frente - aRel - 0.35) / 0.4) * 0.7) * vis;
        const a = 1.5 * Math.PI + aRel * (Math.PI - 0.7) * (i % 2 ? 1 : -1);                    // duas frentes saem da fresta (lado -x) e se encontram no corte
        const sobe = ((t * (1.2 + o.f) + o.f * 7) % 1), tremida = 0.006 * Math.sin(t * 30 + o.f * 20);
        const rr = o.rr + tremida - 0.02 * sobe, y = o.y + 0.012 * Math.sin(t * 9 + o.f * 13);
        fogo.pos.set([rr * Math.sin(a), y, rr * Math.cos(a)], i * 3);
        const novo = clamp(1 - (frente - aRel) / 0.12);                                   // a frente é amarela-branca, atrás fica laranja-vermelho
        fogo.tam[i] = 0.045 * aceso * (0.6 + o.f) * (1 - 0.5 * sobe); fogo.alfa[i] = 0.7 * aceso * (1 - sobe * 0.6);
        fogo.corA.set([1.0, lerp(0.3, 0.75, novo), lerp(0.05, 0.35, novo)], i * 3);
      }
      fogo.pronto();
      brilhoAnel.material.opacity = 0.05 * queima; luzFogo.intensity = 0.25 * queima;
      // janela do corte: a seção da cavidade em chamas (fbm) quando a frente chega no corte
      const kj = clamp((frente - 0.9) / 0.1) * queima * vis;
      if (kj > 0.002) janelaForma(kAssento);
      for (const j of janelas) { j.visible = kj > 0.002; j.material.uniforms.k.value = kj; j.material.uniforms.t.value = t; }
    },
    /** labareda pela fresta (k 0..1 no estalo) e fumaça depois (f 0..1) */
    labareda(t, tEst, { k = 0, fumaca = 0, setor = 0 } = {}) {
      const fr = roda.fresta(0);
      for (let i = 0; i < laba.n; i++) {
        // línguas de fogo saindo pela fresta em volta do aro: nascem em leque, sobem e esfriam (amarelo → laranja → vermelho escuro)
        const o = L[i], a = setor ? Math.PI + (o.a - 0.5) * setor : o.a * Math.PI * 2, bruto = (t - tEst - o.atraso) * o.v * 1.8, idade = clamp(bruto), vivo = bruto > 0 && bruto < 1 ? 1 : 0;
        const sai = Math.sqrt(idade), rr = fr.r + 0.01 + sai * (0.05 + 0.10 * o.s) + o.dr * 0.02 * idade, y = fr.y + 0.01 + idade * (0.10 + 0.22 * o.f) + 0.04 * sai;
        const ondula = 0.012 * idade * Math.sin(t * 25 + o.f * 30);
        laba.pos.set([(rr + ondula) * Math.cos(a), y, (rr + ondula) * Math.sin(a)], i * 3);
        laba.tam[i] = (0.07 + 0.15 * o.s * sai) * (1 - idade * 0.5) * vivo; laba.alfa[i] = 0.2 * k * vivo * (1 - idade) * Math.min(1, bruto * 8);
        laba.corA.set([1, lerp(0.62, 0.16, Math.sqrt(idade)), lerp(0.18, 0.0, Math.sqrt(idade))], i * 3);
      }
      laba.pronto();
      for (let i = 0; i < fum.n; i++) {
        const o = L[i], a = o.a * Math.PI * 2, idade = clamp((t - tEst - 0.15) * 0.35 * o.v);
        const rr = fr.r + 0.05 + idade * 0.25, y = 0.12 + idade * 0.9;
        fum.pos.set([rr * Math.cos(a), y, rr * Math.sin(a)], i * 3);
        fum.tam[i] = (0.10 + idade * 0.4) * fumaca; fum.alfa[i] = 0.35 * fumaca * (1 - idade); fum.corA.set([0.35, 0.35, 0.37], i * 3);
      }
      fum.pronto();
    },
    /** setas de pressão (p 0..1) no plano de uma face do corte */
    pressao(p, cortePhi) {
      setas.visible = p > 0.01;
      const a = Math.PI / 2 - cortePhi / 2 + 0.02;                                       // na face do corte
      setas.children.forEach((s, i) => {
        const { rr, y, dir } = s.userData, base = V(rr * Math.sin(a), y, rr * Math.cos(a));
        const d3 = V(dir.x * Math.sin(a), dir.y, dir.x * Math.cos(a)).normalize();
        s.position.copy(base); s.quaternion.setFromUnitVectors(V(0, 1, 0), d3); s.scale.setScalar(Math.max(0.001, p) * (0.8 + 0.25 * Math.sin(i * 1.7 + p * 9)));
      });
    },
  };
}

// ---------------------------------------------------------------------------------------------- manômetro (relógio de pressão na válvula, diegético)
export function criarManometro() {
  const g = new THREE.Group();
  const caixa = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 48), new THREE.MeshStandardMaterial({ color: 0xbfc4ca, metalness: 1, roughness: 0.3 })); caixa.rotation.x = Math.PI / 2; g.add(caixa);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.04, 64), new THREE.MeshBasicMaterial({ map: canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#f4f2ea'; c.beginPath(); c.arc(w / 2, h / 2, w / 2, 0, 7); c.fill();
    c.strokeStyle = '#111'; c.fillStyle = '#111'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let v = 0; v <= 60; v += 5) { const a = (-225 + v / 60 * 270) * Math.PI / 180, r0 = v % 10 ? 205 : 190; c.lineWidth = v % 10 ? 3 : 6;
      c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * r0, h / 2 + Math.sin(a) * r0); c.lineTo(w / 2 + Math.cos(a) * 225, h / 2 + Math.sin(a) * 225); c.stroke();
    }
    // faixas (sem números: o vídeo não afirma valores de pressão): verde = pressão de uso, vermelha = perigo
    const arco = (v0, v1, cor) => { c.strokeStyle = cor; c.lineWidth = 26; c.beginPath(); c.arc(w / 2, h / 2, 172, (-225 + v0 / 60 * 270) * Math.PI / 180, (-225 + v1 / 60 * 270) * Math.PI / 180); c.stroke(); };
    arco(25, 38, '#2fa84f'); arco(45, 60, '#d0281c');
    c.fillStyle = '#111'; c.font = '900 44px Inter, Arial'; c.fillText('PRESSÃO', w / 2, h * 0.68);
    c.fillStyle = '#555'; c.font = '700 28px Inter, Arial'; c.fillText('HRYZ', w / 2, h * 0.32);
  }), toneMapped: false }));
  face.position.z = 0.0105; g.add(face);
  const ponteiro = new THREE.Mesh(new THREE.BoxGeometry(0.0025, 0.034, 0.001), new THREE.MeshBasicMaterial({ color: 0xd0201a })); ponteiro.geometry.translate(0, 0.014, 0); ponteiro.position.z = 0.012; g.add(ponteiro);
  const vidro = new THREE.Mesh(new THREE.CircleGeometry(0.041, 48), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transparent: true, opacity: 0.18 })); vidro.position.z = 0.013; g.add(vidro);
  return { grupo: g, ler(psi) { const a = (-225 + clamp(psi / 60) * 270) * Math.PI / 180; ponteiro.rotation.z = -(a + Math.PI / 2); } };
}

// ---------------------------------------------------------------------------------------------- placa de aviso (diegética)
export function criarPlaca() {
  const g = new THREE.Group();
  const tex = canvasTex(1024, 1280, (c, w, h) => {
    c.fillStyle = '#ffd23f'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.fillRect(24, 24, w - 48, h - 48); c.fillStyle = '#ffd23f'; c.fillRect(48, 48, w - 96, h - 96);
    c.fillStyle = '#111'; c.beginPath(); c.moveTo(w / 2, 120); c.lineTo(w / 2 + 210, 480); c.lineTo(w / 2 - 210, 480); c.closePath(); c.fill();
    c.fillStyle = '#ffd23f'; c.font = '900 260px Inter, Arial'; c.textAlign = 'center'; c.fillText('!', w / 2, 455);
    c.fillStyle = '#111'; c.font = '900 120px Inter, Arial'; c.fillText('NÃO TENTE', w / 2, 680); c.fillText('EM CASA', w / 2, 820);
    c.font = '700 54px Inter, Arial'; c.fillText('Borracheiro tem máquina,', w / 2, 960); c.fillText('gaiola e ar comprimido.', w / 2, 1030);
    c.font = '900 56px Inter, Arial'; c.fillText('HRYZ ANIMATION', w / 2, 1180);
  });
  const placa = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.75, 0.02), [0, 0, 0, 0, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), 0].map(m => m || new THREE.MeshStandardMaterial({ color: 0x222222 })));
  placa.position.y = 1.35; placa.castShadow = true; g.add(placa);
  const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 12), new THREE.MeshStandardMaterial({ color: 0x555b62, metalness: 0.8, roughness: 0.4 })); poste.position.y = 0.5; g.add(poste);
  return g;
}
