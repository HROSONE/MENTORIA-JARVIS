// FASE DA LUA (Hryz City): o mundo lunar, o foguete HRYZ-1 e a viagem Terra ↔ Lua.
// Modelos feitos no Blender por script: videos/biblioteca3d/cenarios/lua (terreno 800 m com crateras, rochas, horizonte)
// e videos/biblioteca3d/veiculos/foguete (foguete com pernas e escotilha móveis + plataforma de lançamento).
// A Lua fica longe da cidade (ORIGEM), na mesma cena: quando o jogador está lá, a cidade sai do alcance da câmera.
// API: criarFaseLua({ scene, base, padX, padZ, padRy }) → { carregar, altura, colidir, perto, cineAtiva, atualizarCine,
//       atualizar, embarcar, irDireto, ativa, ORIGEM, ... }
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const ORIGEM = new THREE.Vector3(30000, 0, 30000);     // centro do terreno lunar no mundo do jogo
export const G_LUA = 2.9;                                      // gravidade do jogo na Lua (1/6 da gravidade do jogo na Terra, 17,5)
const L = 800, N = 321, PASSO = L / (N - 1);

const suave = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;

export function criarFaseLua({ scene, base, padX, padZ, padRy = 0 }) {
  const raiz = new THREE.Group(); raiz.name = 'Lua'; raiz.position.copy(ORIGEM); raiz.visible = false; scene.add(raiz);
  const H = new Float32Array(N * N);
  const rochasCol = [];                                       // [x, z, raio] em coordenadas do mundo (só as grandes)
  let carregado = false, carregando = null;
  const loader = new GLTFLoader();
  const texLoader = new THREE.TextureLoader();
  const estado = { ativa: false, cine: null };

  // ------------------------------------------------------------------ foguetes: um na plataforma da cidade, um na Lua (mesmo GLB)
  const pad = new THREE.Group(); pad.position.set(padX, 0, padZ); pad.rotation.y = padRy; scene.add(pad);
  let fogTerra = null, fogLua = null, gltfFog = null;
  const VEC = new THREE.Vector3();

  function prepararFoguete(obj) {
    const pecas = { pernas: [], escotilha: null, bocal: null };
    obj.traverse(o => {
      if (/^Perna\d$/.test(o.name)) { pecas.pernas.push(o); o.userData.q0 = o.quaternion.clone(); }
      if (o.name === 'Escotilha') { pecas.escotilha = o; o.userData.q0 = o.quaternion.clone(); }
      if (o.name === 'Bocal') pecas.bocal = o;
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    const chama = criarChama(); obj.add(chama.grupo); chama.grupo.position.set(0, 0.75, 0);
    const api = {
      obj, chama,
      /** 0 = pernas abertas (pouso), 1 = dobradas junto ao corpo (voo) */
      pernas(k) { for (const p of pecas.pernas) p.quaternion.copy(p.userData.q0).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 2.45 * suave(k))); },
      /** 0 = fechada, 1 = aberta */
      escotilha(k) { const e = pecas.escotilha; if (e) e.quaternion.copy(e.userData.q0).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -1.75 * suave(k))); },
    };
    return api;
  }

  // chama do motor: cone com degradê (núcleo branco-azulado → laranja), diamantes de choque e luz
  function criarChama() {
    const grupo = new THREE.Group();
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { t: { value: 0 }, k: { value: 0 }, vacuo: { value: 0 } },
      vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: `uniform float t, k, vacuo; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main(){
          float y = vUv.y;                                   // 1 no bocal, 0 na ponta
          float borda = pow(abs(dot(vN, vV)), 1.5);
          float ruido = 0.75 + 0.25 * sin(y * 40.0 - t * 60.0) * sin(vUv.x * 30.0 + t * 20.0);
          float diam = (1.0 - vacuo) * smoothstep(0.75, 1.0, fract(y * 4.0 - t * 0.0)) * 0.6;   // diamantes de choque (no ar)
          vec3 cor = mix(vec3(1.0, 0.35, 0.05), vec3(1.0, 0.85, 0.55), smoothstep(0.3, 0.95, y));
          cor = mix(cor, vec3(0.75, 0.85, 1.0), smoothstep(0.88, 1.0, y) * 0.8);
          float a = k * borda * ruido * smoothstep(0.0, 0.35, y) * (1.0 + diam);
          gl_FragColor = vec4(cor * a, 1.0); }`,
    });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.85, 9, 32, 1, true), mat);
    cone.geometry.translate(0, -4.5, 0); cone.rotation.x = 0; grupo.add(cone);
    const nucleo = new THREE.Mesh(new THREE.ConeGeometry(0.45, 3.2, 24, 1, true), mat); nucleo.geometry.translate(0, -1.6, 0); grupo.add(nucleo);
    const luz = new THREE.PointLight(0xffa050, 0, 60, 1.6); luz.position.y = -2; grupo.add(luz);
    grupo.visible = false;
    return {
      grupo,
      definir(k, t, { vacuo = 0, comprimento = 1 } = {}) {
        grupo.visible = k > 0.01; mat.uniforms.k.value = k; mat.uniforms.t.value = t; mat.uniforms.vacuo.value = vacuo;
        const f = 1 + 0.06 * Math.sin(t * 47) + 0.04 * Math.sin(t * 31);
        // no vácuo a pluma abre (sem ar para segurar), na Terra fica comprida e fina
        cone.scale.set(vacuo ? 1.9 : 1, comprimento * f * (vacuo ? 0.55 : 1), vacuo ? 1.9 : 1);
        luz.intensity = 260 * k * f;
      },
    };
  }

  // ------------------------------------------------------------------ fumaça/poeira em partículas (balísticas na Lua, sobe e espalha na Terra)
  function criarParticulas(n, cor, tamBase) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3), alfa = new Float32Array(n), tam = new Float32Array(n);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('alfa', new THREE.BufferAttribute(alfa, 1)); geo.setAttribute('tam', new THREE.BufferAttribute(tam, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: { cor: { value: new THREE.Color(cor) }, escala: { value: 600 } },
      vertexShader: 'attribute float alfa; attribute float tam; varying float vA; uniform float escala; void main(){ vA = alfa; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = tam * escala / max(0.5, -mv.z); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 cor; varying float vA; void main(){ vec2 p = gl_PointCoord * 2.0 - 1.0; float d = dot(p,p); if (d > 1.0) discard; gl_FragColor = vec4(cor, vA * (1.0 - d) * (1.0 - d)); }',
    });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
    const P = []; for (let i = 0; i < n; i++) P.push({ vivo: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, idade: 0, vida: 1, s: 1, chao: 0, bal: true });
    let prox = 0;
    return {
      pts,
      emitir(x, y, z, vx, vy, vz, vida, s, chao, bal = true) {
        const p = P[prox]; prox = (prox + 1) % n;
        Object.assign(p, { vivo: true, x, y, z, vx, vy, vz, idade: 0, vida, s, chao, bal });
      },
      atualizar(dt, g, alturaEm) {
        for (let i = 0; i < n; i++) {
          const p = P[i];
          if (!p.vivo) { alfa[i] = 0; continue; }
          p.idade += dt;
          if (p.bal) {                                           // vácuo: arco perfeito, sem frear no ar; cai e para
            p.vy -= g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
            const c = alturaEm ? alturaEm(p.x, p.z) : p.chao;
            if (p.y < c) { p.y = c; p.vx = p.vy = p.vz = 0; p.idade = Math.max(p.idade, p.vida - 0.25); }
          } else {                                               // ar: a fumaça sobe, freia e cresce
            const ar = Math.exp(-dt * 1.2); p.vx *= ar; p.vz *= ar; p.vy = p.vy * ar + 1.2 * dt;
            p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.y = Math.max(p.y, p.chao + 0.3);
          }
          const k = p.idade / p.vida; if (k >= 1) { p.vivo = false; alfa[i] = 0; continue; }
          pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
          alfa[i] = (p.bal ? 0.55 : 0.5) * Math.min(1, p.idade * 8) * (1 - k); tam[i] = p.s * (p.bal ? 1 : 1 + 3 * k);
        }
        geo.attributes.position.needsUpdate = geo.attributes.alfa.needsUpdate = geo.attributes.tam.needsUpdate = true;
      },
    };
  }
  const poeira = criarParticulas(700, 0x8d8a84, 0.25); raiz.add(poeira.pts);            // coordenadas locais da Lua
  const fumaca = criarParticulas(500, 0xdedad4, 1.2); scene.add(fumaca.pts);              // coordenadas do mundo (Terra)

  // ------------------------------------------------------------------ pegadas (a bota marca o regolito; não há vento para apagar)
  const NPEG = 500;
  const texPeg = (() => {
    const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,0)'; g.fillRect(0, 0, 64, 128);
    g.fillStyle = 'rgba(255,255,255,1)'; g.beginPath(); g.ellipse(32, 64, 22, 56, 0, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,0.55)';
    for (let y = 14; y < 118; y += 9) g.fillRect(8, y, 48, 3.5);                         // as barras da sola
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const pegadas = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.16, 0.32).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x3e3c39, alphaMap: texPeg, transparent: true, opacity: 0.75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, roughness: 1 }), NPEG);
  pegadas.count = 0; pegadas.frustumCulled = false; pegadas.receiveShadow = true; raiz.add(pegadas);
  let pegI = 0, pegLado = 1, pegUlt = null;
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S1 = new THREE.Vector3(1, 1, 1);

  // ------------------------------------------------------------------ céu: estrelas e a Terra (Blue Marble, NASA, domínio público)
  function criarCeu() {
    const g = new THREE.Group();
    const n = 2600, pos = new Float32Array(n * 3), cor = new Float32Array(n * 3);
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < n; i++) {
      const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - u * u);
      pos.set([r * Math.cos(a) * 7000, Math.abs(u) * 7000 * 0.98 + 60, r * Math.sin(a) * 7000], i * 3);
      const b = 0.35 + 0.65 * rnd() ** 3, t = rnd(); cor.set([b * (0.85 + 0.15 * t), b * 0.92, b * (1.05 - 0.15 * t)], i * 3);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(cor, 3));
    const est = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false }));
    g.add(est);
    const terra = new THREE.Mesh(new THREE.SphereGeometry(85, 64, 32), new THREE.MeshStandardMaterial({ map: texLoader.load(`${base}/cenarios/lua/terra.jpg`, t => { t.colorSpace = THREE.SRGBColorSpace; }), roughness: 0.75, fog: false }));
    terra.position.set(3400, 1060, -3700); terra.rotation.set(0.4, 2.2, 0); g.add(terra);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(89, 48, 24), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
      vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
      fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 3.0); gl_FragColor = vec4(vec3(0.35,0.6,1.0) * f * 0.9, 1.0); }',
    }));
    halo.position.copy(terra.position); g.add(halo);
    return g;
  }

  // ------------------------------------------------------------------ carga
  async function carregar(aoProgresso) {
    if (carregado) return; if (carregando) return carregando;
    carregando = (async () => {
      aoProgresso?.('Carregando a Lua…');
      const [ter, roc] = await Promise.all([
        loader.loadAsync(`${base}/cenarios/lua/lua_terreno.glb`),
        loader.loadAsync(`${base}/cenarios/lua/lua_rochas.glb`),
      ]);
      // terreno: altura de cada vértice da malha de 321 × 321 (2,5 m) → grade para o chão e as colisões
      ter.scene.traverse(o => {
        if (!o.isMesh) return;
        o.receiveShadow = true; o.castShadow = false;
        if (o.name.startsWith('LuaTerreno')) {
          const p = o.geometry.attributes.position;
          for (let i = 0; i < p.count; i++) {
            const j = Math.round((p.getX(i) + L / 2) / PASSO), k = Math.round((p.getZ(i) + L / 2) / PASSO);
            if (j >= 0 && j < N && k >= 0 && k < N) H[k * N + j] = p.getY(i);
          }
        }
        // detalhe do grão (4 m, repete) somado ao normal map do terreno
        const m = o.material;
        if (m && m.normalMap && !m.userData.det) {
          m.userData.det = true; m.roughness = 0.97; m.metalness = 0; m.envMapIntensity = 0;
          const det = texLoader.load(`${base}/cenarios/lua/lua_detalhe_normal.jpg`); det.wrapS = det.wrapT = THREE.RepeatWrapping;
          m.onBeforeCompile = sh => {
            sh.uniforms.detN = { value: det };
            sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D detN;')
              .replace('mapN.xy *= normalScale;', 'mapN.xy *= normalScale;\n  vec3 dN = texture2D(detN, vNormalMapUv * 200.0).xyz * 2.0 - 1.0; mapN = normalize(vec3(mapN.xy + dN.xy * 0.9, mapN.z));');
          };
          m.customProgramCacheKey = () => 'luaTerrenoDet';
        }
      });
      raiz.add(ter.scene);
      // rochas: uma InstancedMesh por forma, assentadas no chão
      const meta = await (await fetch(`${base}/cenarios/lua/rochas.json`).catch(() => null))?.json?.().catch(() => null);
      const formas = []; roc.scene.traverse(o => { if (o.isMesh && /^Rocha\d/.test(o.name)) formas[+o.name[5]] = o; });
      const lista = meta?.rochas || [];
      for (let v = 0; v < formas.length; v++) {
        const f = formas[v]; if (!f) continue;
        const minhas = lista.filter(r => r[4] === v);
        const im = new THREE.InstancedMesh(f.geometry, f.material, minhas.length); im.castShadow = true; im.receiveShadow = true;
        minhas.forEach(([x, z, s, rot], i) => {
          Q.setFromEuler(E.set(0, rot, 0)); M4.compose(VEC.set(x, altura(x + ORIGEM.x, z + ORIGEM.z) - 0.12 * s, z), Q, S1.set(s, s, s)); im.setMatrixAt(i, M4);
          if (s > 0.55) rochasCol.push([x + ORIGEM.x, z + ORIGEM.z, s * 0.95]);
        });
        im.instanceMatrix.needsUpdate = true;
        im.computeBoundingSphere();
        raiz.add(im);
      }
      raiz.add(criarCeu());
      // foguete pousado na Lua (o mesmo modelo da plataforma)
      fogLua = prepararFoguete(gltfFog.scene.clone(true)); fogLua.obj.position.set(0, altura(ORIGEM.x, ORIGEM.z), 0); raiz.add(fogLua.obj);
      carregado = true;
    })();
    return carregando;
  }
  async function carregarFoguete() {
    if (gltfFog) return;
    const [f, p] = await Promise.all([loader.loadAsync(`${base}/veiculos/foguete/foguete_hryz.glb`), loader.loadAsync(`${base}/veiculos/foguete/plataforma_foguete.glb`)]);
    gltfFog = f;
    p.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    pad.add(p.scene);
    fogTerra = prepararFoguete(f.scene); fogTerra.obj.position.y = 0.6; pad.add(fogTerra.obj);
  }

  // ------------------------------------------------------------------ chão e colisões
  function alturaLocal(x, z) {
    const fx = Math.min(N - 1.001, Math.max(0, (x + L / 2) / PASSO)), fz = Math.min(N - 1.001, Math.max(0, (z + L / 2) / PASSO));
    const j = Math.floor(fx), k = Math.floor(fz), a = fx - j, b = fz - k, i0 = k * N + j;
    return H[i0] * (1 - a) * (1 - b) + H[i0 + 1] * a * (1 - b) + H[i0 + N] * (1 - a) * b + H[i0 + N + 1] * a * b;
  }
  function altura(x, z) { return alturaLocal(x - ORIGEM.x, z - ORIGEM.z); }
  /** empurra (x, z) para fora das rochas grandes, do foguete e da borda do mapa */
  function colidir(x, z, r) {
    const lim = L / 2 - 6;
    x = Math.min(ORIGEM.x + lim, Math.max(ORIGEM.x - lim, x)); z = Math.min(ORIGEM.z + lim, Math.max(ORIGEM.z - lim, z));
    const obs = [[ORIGEM.x, ORIGEM.z, 2.05]];
    if (fogLua) for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; obs.push([ORIGEM.x + 4.35 * Math.cos(a), ORIGEM.z - 4.35 * Math.sin(a), 0.6]); }
    for (const [ox, oz, or] of obs.concat(rochasCol)) {
      const dx = x - ox, dz = z - oz, d = Math.hypot(dx, dz), m = or + r;
      if (d < m && d > 1e-4) { x = ox + dx / d * m; z = oz + dz / d * m; }
    }
    return { x, z };
  }
  /** colisão do foguete e da torre na cidade */
  function colidirPad(x, z, r) {
    const c = Math.cos(padRy), s = Math.sin(padRy);
    const obs = [[0, 0, 2.05], [8.2, 0, 1.9]];
    for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2; obs.push([4.35 * Math.cos(a), -4.35 * Math.sin(a), 0.6]); }
    for (const [lx, lz, or] of obs) {
      const ox = padX + lx * c + lz * s, oz = padZ - lx * s + lz * c, dx = x - ox, dz = z - oz, d = Math.hypot(dx, dz), m = or + r;
      if (d < m && d > 1e-4) { x = ox + dx / d * m; z = oz + dz / d * m; }
    }
    return { x, z };
  }
  // pé da escada (frente do foguete = +Z local)
  function peEscada(naLua) {
    if (naLua) return { x: ORIGEM.x, z: ORIGEM.z + 3.4, ang: 0 };
    return { x: padX + Math.sin(padRy) * 3.4, z: padZ + Math.cos(padRy) * 3.4, ang: padRy };
  }
  function perto(x, z, naLua) { const p = peEscada(naLua); return Math.hypot(x - p.x, z - p.z) < 2.6; }
  // altura da plataforma (0,6 m) para andar em cima dela
  function alturaPad(x, z) {
    const dx = x - padX, dz = z - padZ; const c = Math.cos(padRy), s = Math.sin(padRy);
    const lx = dx * c - dz * s, lz = dx * s + dz * c, d = Math.hypot(lx, lz);
    if (d < 10.6) return 0.6;
    if (Math.abs(lx) < 1.4 && lz > 10 && lz < 14.2) return 0.6 * (1 - (lz - 10.6) / 3.6);   // rampa
    return null;
  }

  // ------------------------------------------------------------------ passo, pulo e pouso do astronauta (pegadas e poeira)
  function atualizarJogador(dt, j, movendo, noChao, aterrissou) {
    const lx = j.x - ORIGEM.x, lz = j.z - ORIGEM.z;
    if (aterrissou > 0.4) {                                  // caiu de um salto: um anel de poeira em arco
      const n = Math.min(60, 12 + aterrissou * 18);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = 0.6 + Math.random() * 1.8;
        poeira.emitir(lx + Math.cos(a) * 0.25, j.y + 0.05, lz + Math.sin(a) * 0.25, Math.cos(a) * v, 0.6 + Math.random() * 1.6, Math.sin(a) * v, 1.6 + Math.random(), 0.05 + Math.random() * 0.07, 0);
      }
    }
    if (noChao && movendo) {
      if (!pegUlt || Math.hypot(lx - pegUlt.x, lz - pegUlt.z) > 0.75) {
        const ang = j.ry, ox = Math.cos(ang) * 0.13 * pegLado, oz = -Math.sin(ang) * 0.13 * pegLado; pegLado *= -1;
        const px = lx + ox, pz = lz + oz;
        Q.setFromEuler(E.set(0, ang, 0)); M4.compose(VEC.set(px, alturaLocal(px, pz) + 0.015, pz), Q, S1.set(1, 1, 1));
        pegadas.setMatrixAt(pegI, M4); pegadas.instanceMatrix.needsUpdate = true; pegI = (pegI + 1) % NPEG; pegadas.count = Math.max(pegadas.count, pegI === 0 ? NPEG : pegI);
        pegUlt = { x: lx, z: lz };
        for (let i = 0; i < 5; i++) {                       // o chute de poeira de cada passo: arquinhos que caem logo
          const a = ang + (Math.random() - 0.5) * 1.2, v = 0.4 + Math.random() * 0.7;
          poeira.emitir(px, j.y + 0.04, pz, Math.sin(a) * v, 0.4 + Math.random() * 0.7, Math.cos(a) * v, 1.2, 0.035 + Math.random() * 0.04, 0);
        }
      }
    }
  }
  function atualizar(dt) {
    poeira.atualizar(dt, G_LUA, (x, z) => alturaLocal(x, z));
    fumaca.atualizar(dt, 0, null);
  }

  // ------------------------------------------------------------------ cenas: Terra → Lua e Lua → Terra
  const fundo = document.createElement('div');
  fundo.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:40;transition:none';
  const contagem = document.createElement('div');
  contagem.style.cssText = 'position:fixed;left:50%;top:28%;transform:translate(-50%,-50%);font:900 min(22vw,160px)/1 Inter,system-ui,sans-serif;color:#fff;text-shadow:0 4px 30px rgba(0,0,0,.6);pointer-events:none;z-index:41;opacity:0';
  const legenda = document.createElement('div');
  legenda.style.cssText = 'position:fixed;left:50%;bottom:16%;transform:translateX(-50%);font:800 clamp(14px,3.4vw,22px) Inter,system-ui,sans-serif;color:#fff;letter-spacing:.06em;text-shadow:0 2px 12px rgba(0,0,0,.7);pointer-events:none;z-index:41;opacity:0;white-space:nowrap';
  document.body.append(fundo, contagem, legenda);

  // som do motor: ruído marrom filtrado (o ronco grave) gerado na hora, sem arquivo
  let ac = null, ruidoNo = null, ganho = null, filtro = null;
  function som(k, brilho = 1) {
    try {
      if (!ac) {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0); let ult = 0;
        for (let i = 0; i < len; i++) { const b = Math.random() * 2 - 1; ult = (ult + 0.02 * b) / 1.02; d[i] = ult * 3.5; }
        ruidoNo = ac.createBufferSource(); ruidoNo.buffer = buf; ruidoNo.loop = true;
        filtro = ac.createBiquadFilter(); filtro.type = 'lowpass'; filtro.frequency.value = 300;
        ganho = ac.createGain(); ganho.gain.value = 0; ruidoNo.connect(filtro).connect(ganho).connect(ac.destination); ruidoNo.start();
      }
      ganho.gain.setTargetAtTime(0.9 * k, ac.currentTime, 0.08); filtro.frequency.setTargetAtTime(180 + 900 * k * brilho, ac.currentTime, 0.1);
    } catch (_) {}
  }

  /** começa a viagem; destino 'lua' ou 'terra'. aoTrocar(destino) muda o ambiente (luz/céu) no meio da tela preta */
  function embarcar(destino, aoTrocar, aoFim) {
    estado.cine = { destino, t: 0, aoTrocar, aoFim, trocou: false };
  }
  const P = new THREE.Vector3(), A = new THREE.Vector3();
  function atualizarCine(dt) {
    const c = estado.cine; if (!c) return null;
    c.t += dt; const t = c.t;
    const ida = c.destino === 'lua';
    const origem = ida ? fogTerra : fogLua, chegada = ida ? fogLua : fogTerra;
    const baseO = ida ? new THREE.Vector3(padX, 0.6, padZ) : new THREE.Vector3(ORIGEM.x, altura(ORIGEM.x, ORIGEM.z), ORIGEM.z);
    const baseC = ida ? new THREE.Vector3(ORIGEM.x, altura(ORIGEM.x, ORIGEM.z), ORIGEM.z) : new THREE.Vector3(padX, 0.6, padZ);
    const noVacuoO = !ida, noVacuoC = ida;
    // ---------------- decolagem (0 a 9,5 s)
    if (t < 9.5) {
      origem.escotilha(1 - suave(t / 1.0));
      const ign = ida ? 3.4 : 1.6, sobe = Math.max(0, t - (ida ? 4.2 : 2.2));
      const y = (ida ? 2.2 : 3.2) * sobe * sobe;                       // na Lua o foguete sai mais leve
      const k = suave((t - ign) / 0.6);
      origem.obj.position.y = (ida ? 0.6 : baseO.y) + y;
      origem.pernas(suave((sobe - 1.2) / 1.5));
      origem.chama.definir(k, t, { vacuo: noVacuoO ? 1 : 0, comprimento: 0.6 + 0.6 * k });
      som(k * (1 - suave((t - 8.6) / 0.9)), 1);
      // contagem (só na Terra)
      if (ida) { const n = 3 - Math.floor(t - 0.6); contagem.textContent = n > 0 ? String(n) : 'DECOLAR!'; contagem.style.opacity = t > 0.6 && t < 4.6 ? 1 : 0; }
      legenda.textContent = ida ? 'HRYZ-1 · DESTINO: LUA' : 'HRYZ-1 · VOLTANDO PARA A TERRA'; legenda.style.opacity = t > 0.3 && t < 4 ? 1 : 0;
      // fumaça/poeira saindo da base
      if (k > 0.1 && sobe < 6) for (let i = 0; i < (ida ? 6 : 4); i++) {
        const a = Math.random() * Math.PI * 2, v = 6 + Math.random() * 8;
        if (ida) fumaca.emitir(baseO.x + Math.cos(a) * 3, 0.8, baseO.z + Math.sin(a) * 3, Math.cos(a) * v, 0.5 + Math.random(), Math.sin(a) * v, 3.5 + Math.random() * 2, 2.2 + Math.random() * 2, 0.6, false);
        else poeira.emitir(Math.cos(a) * 3, baseO.y + 0.1, Math.sin(a) * 3, Math.cos(a) * v, 0.5 + Math.random() * 2, Math.sin(a) * v, 2.5, 0.15 + Math.random() * 0.2, 0);
      }
      // câmera: de baixo, de longe, inclinando para acompanhar a subida
      const ry = ida ? padRy : 0;
      P.set(baseO.x + Math.sin(ry + 0.9) * 34, baseO.y + 3 + Math.min(20, y * 0.25), baseO.z + Math.cos(ry + 0.9) * 34);
      A.set(baseO.x, origem.obj.position.y + (ida ? 0 : baseO.y) * 0 + 9, baseO.z);
      fundo.style.opacity = suave((t - 8.4) / 1.0);
      return { p: P.clone(), a: A.clone(), fov: 50 };
    }
    // ---------------- tela preta: troca de mundo
    if (!c.trocou) { c.trocou = true; origem.chama.definir(0, t); origem.obj.position.y = ida ? 0.6 : baseO.y; origem.pernas(0); origem.escotilha(0); c.aoTrocar?.(c.destino); }
    // ---------------- pouso (9,5 a 16,5 s)
    const s = Math.min(1, (t - 9.5) / 5.2), alt = 70 * (1 - s) * (1 - s);
    chegada.obj.position.y = baseC.y + alt;
    chegada.pernas(suave((alt - 4) / 9));                                        // as pernas abrem só perto do chão (abaixo do braço da torre)
    const queima = t < 14.9 ? 1 : 1 - suave((t - 14.9) / 0.4);
    chegada.chama.definir(queima * (0.75 + 0.25 * Math.sin(t * 3)), t, { vacuo: noVacuoC ? 1 : 0, comprimento: 0.7 });
    som(queima * 0.8, noVacuoC ? 0.5 : 1);
    if (alt < 18 && queima > 0.2) for (let i = 0; i < 7; i++) {                  // o jato levanta o chão em leque
      const a = Math.random() * Math.PI * 2, v = 8 + Math.random() * 10;
      if (noVacuoC) poeira.emitir(Math.cos(a) * 2.5, baseC.y + 0.1, Math.sin(a) * 2.5, Math.cos(a) * v, 0.3 + Math.random() * 1.5, Math.sin(a) * v, 2.2, 0.18 + Math.random() * 0.25, 0);
      else fumaca.emitir(baseC.x + Math.cos(a) * 3, 0.8, baseC.z + Math.sin(a) * 3, Math.cos(a) * v * 0.6, 0.5, Math.sin(a) * v * 0.6, 3, 2 + Math.random() * 2, 0.6, false);
    }
    chegada.escotilha(suave((t - 15.4) / 1.0));
    fundo.style.opacity = 1 - suave((t - 9.6) / 0.9);
    legenda.textContent = noVacuoC ? 'BASE LUNAR HRYZ · GRAVIDADE 1/6' : 'HRYZ CITY · BEM-VINDO DE VOLTA'; legenda.style.opacity = t > 10.2 && t < 14.5 ? 1 : 0;
    const ryC = noVacuoC ? 0.6 : padRy + 0.6;
    P.set(baseC.x + Math.sin(ryC) * 30, baseC.y + 4 + alt * 0.35, baseC.z + Math.cos(ryC) * 30);
    A.set(baseC.x, chegada.obj.position.y + 8, baseC.z);
    if (t > 16.6) {
      contagem.style.opacity = 0; legenda.style.opacity = 0; fundo.style.opacity = 0; som(0);
      estado.cine = null; c.aoFim?.(c.destino);
      return null;
    }
    return { p: P.clone(), a: A.clone(), fov: 50 };
  }

  return {
    ORIGEM, G_LUA, raiz, pad,
    carregar, carregarFoguete, altura, alturaPad, colidir, colidirPad, perto, peEscada, atualizarJogador, atualizar,
    embarcar, atualizarCine,
    get cineAtiva() { return !!estado.cine; },
    get ativa() { return estado.ativa; },
    set ativa(v) { estado.ativa = v; raiz.visible = v; },
    get carregado() { return carregado; },
    fogTerra: () => fogTerra, fogLua: () => fogLua,
  };
}
