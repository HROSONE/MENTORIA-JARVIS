// ====================================================================================================
// MISSÃO MARTE (Hryz City):
// - Nave espacial modelada em Blender (nave_marte.glb) estacionada na Lua
// - Cutscene 1: decolagem da Lua + câmera DENTRO DA CABINE mostrando o painel holográfico "DESTINO: MARTE"
// - Fase jogável no Espaço: desviar de asteroides 3D (Blender), atirar LASER e PLASMA e explodir asteroides!
// - Cutscene 2: aproximação cinematográfica do planeta Marte (marte.glb + halo atmosférico) com a nave
//   mergulhando direto para dentro do planeta enquanto a câmera fica em órbita + frase final "Nos veremos lá"
// ====================================================================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const ORIGEM_MARTE = new THREE.Vector3(60000, 0, 60000);
const META_ASTEROIDES = 12;
const DIST_INICIAL = 100; // 100% -> 0% de distância até Marte

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const suave = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

function criarTexBrilho(corCentro, corMeio) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, corCentro);
  r.addColorStop(0.35, corMeio);
  r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Cria textura dinâmica de canvas 1024x512 (alta nitidez) para o painel holográfico dentro da cabine! */
function criarTelaPainelDinamica() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  function desenhar(t, alerta = false) {
    g.save();
    g.scale(2, 2); // desenha no sistema lógico 512x256 com nitidez 2x retina!

    // Fundo azul-escuro espacial com leve gradiente radial
    const bg = g.createRadialGradient(256, 128, 20, 256, 128, 300);
    bg.addColorStop(0, '#09192f');
    bg.addColorStop(1, '#020814');
    g.fillStyle = bg;
    g.fillRect(0, 0, 512, 256);

    // Grade holográfica sutil
    g.strokeStyle = 'rgba(56, 189, 248, 0.14)';
    g.lineWidth = 1;
    for (let x = 0; x < 512; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
    for (let y = 0; y < 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }

    // Moldura dupla do computador de bordo
    g.strokeStyle = alerta ? '#f97316' : '#38bdf8';
    g.lineWidth = 3.5;
    g.strokeRect(8, 8, 496, 240);
    g.strokeStyle = alerta ? 'rgba(249,115,22,0.35)' : 'rgba(56,189,248,0.3)';
    g.lineWidth = 1.5;
    g.strokeRect(14, 14, 484, 228);

    // Cabeçalho
    g.fillStyle = '#7dd3fc';
    g.font = '900 13px monospace';
    g.fillText('HRYZ-NAV // COMPUTADOR DE BORDO · SETOR SOL-4', 24, 34);
    g.fillStyle = '#fb923c';
    g.font = '900 25px system-ui, sans-serif';
    g.fillText('DESTINO ESPACIAL: MARTE', 24, 66);

    // Linha divisória brilhante
    g.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(24, 78); g.lineTo(340, 78); g.stroke();

    // Rota Lua -> Marte animada
    const yR = 132;
    g.strokeStyle = 'rgba(148, 163, 184, 0.42)';
    g.setLineDash([6, 6]);
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(54, yR); g.lineTo(328, yR); g.stroke();
    g.setLineDash([]);

    // Progresso brilhante da rota
    const prog = 0.25 + ((t * 0.16) % 0.72);
    const px = 54 + prog * (328 - 54);
    g.strokeStyle = '#38bdf8';
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(54, yR); g.lineTo(px, yR); g.stroke();

    // Lua à esquerda
    g.fillStyle = '#e2e8f0';
    g.beginPath(); g.arc(54, yR, 14, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#94a3b8';
    g.beginPath(); g.arc(50, yR - 4, 3.5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(59, yR + 4, 2.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#cbd5e1';
    g.font = '800 12px monospace';
    g.fillText('LUA', 42, yR + 30);

    // Ícone da nave na rota
    g.fillStyle = '#e0f2fe';
    g.beginPath(); g.moveTo(px + 11, yR); g.lineTo(px - 7, yR - 6); g.lineTo(px - 7, yR + 6); g.closePath(); g.fill();

    // Holograma giratório de Marte à direita
    const mx = 418, my = 128, mr = 52;
    const gr = g.createRadialGradient(mx - 15, my - 15, 6, mx, my, mr);
    gr.addColorStop(0, '#fdba74');
    gr.addColorStop(0.45, '#ea580c');
    gr.addColorStop(0.85, '#9a3412');
    gr.addColorStop(1, '#431407');
    g.fillStyle = gr;
    g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.fill();

    // Calota polar + linhas de longitude holográficas girando em Marte
    g.fillStyle = 'rgba(255, 247, 237, 0.72)';
    g.beginPath(); g.ellipse(mx, my - mr + 7, 14, 4.5, 0, 0, Math.PI * 2); g.fill();

    g.strokeStyle = 'rgba(254, 215, 170, 0.45)';
    g.lineWidth = 1.3;
    for (let i = 0; i < 3; i++) {
      const rx = Math.abs(Math.cos(t * 0.9 + i * 1.05)) * mr;
      g.beginPath(); g.ellipse(mx, my, rx, mr, 0, 0, Math.PI * 2); g.stroke();
    }
    g.strokeStyle = '#fb923c';
    g.lineWidth = 2;
    g.beginPath(); g.arc(mx, my, mr + 6, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#ffedd5';
    g.font = '900 14px monospace';
    g.fillText('PLANETA MARTE', mx - 54, my + mr + 24);

    // Telemetria inferior
    g.fillStyle = '#cbd5e1';
    g.font = '700 12.5px monospace';
    g.fillText('DISTÂNCIA: 225.000.000 KM  ·  PLASMA: 100%', 24, 194);

    if (alerta) {
      const pisca = Math.sin(t * 12) > -0.2;
      g.fillStyle = pisca ? 'rgba(239, 68, 68, 0.34)' : 'rgba(239, 68, 68, 0.16)';
      g.fillRect(22, 204, 336, 30);
      g.strokeStyle = '#f87171';
      g.lineWidth = 1.5;
      g.strokeRect(22, 204, 336, 30);
      g.fillStyle = '#fecaca';
      g.font = '900 13px monospace';
      g.fillText('⚠ CINTURÃO DE ASTEROIDES · LASER/PLASMA ON', 28, 224);
    } else {
      g.fillStyle = 'rgba(34, 197, 94, 0.18)';
      g.fillRect(22, 204, 336, 30);
      g.strokeStyle = '#4ade80';
      g.lineWidth = 1.5;
      g.strokeRect(22, 204, 336, 30);
      g.fillStyle = '#86efac';
      g.font = '900 13px monospace';
      g.fillText('▶ ROTA BLOQUEADA: MARTE · IGNIÇÃO TOTAL', 30, 224);
    }
    g.restore();
    tex.needsUpdate = true;
  }

  desenhar(0, false);
  return { tex, desenhar };
}

/** Áudio sci-fi procedural leve (WebAudio): laser, plasma, explosão e motor espacial. */
class SomEspacial {
  constructor() { this.ctx = null; this.mudo = false; }
  _garantir() {
    if (this.mudo) return null;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }
  laser() {
    const ctx = this._garantir(); if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(1180, now);
    o.frequency.exponentialRampToValueAtTime(220, now + 0.11);
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.0008, now + 0.12);
    o.connect(g); g.connect(ctx.destination);
    o.start(now); o.stop(now + 0.13);
  }
  plasma() {
    const ctx = this._garantir(); if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o2.type = 'sine';
    o.frequency.setValueAtTime(420, now); o.frequency.exponentialRampToValueAtTime(68, now + 0.34);
    o2.frequency.setValueAtTime(840, now); o2.frequency.exponentialRampToValueAtTime(140, now + 0.28);
    g.gain.setValueAtTime(0.14, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    o.connect(g); o2.connect(g); g.connect(ctx.destination);
    o.start(now); o2.start(now); o.stop(now + 0.37); o2.stop(now + 0.37);
  }
  explosao(grande = false) {
    const ctx = this._garantir(); if (!ctx) return;
    const now = ctx.currentTime;
    const dur = grande ? 0.52 : 0.32;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const k = 1 - i / len;
      d[i] = (Math.random() * 2 - 1) * k * k;
    }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass';
    f.frequency.setValueAtTime(grande ? 520 : 780, now);
    f.frequency.exponentialRampToValueAtTime(75, now + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(grande ? 0.24 : 0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(f); f.connect(g); g.connect(ctx.destination);
    src.start(now);
  }
  dano() {
    const ctx = this._garantir(); if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(160, now); o.frequency.linearRampToValueAtTime(95, now + 0.22);
    g.gain.setValueAtTime(0.12, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    o.connect(g); g.connect(ctx.destination);
    o.start(now); o.stop(now + 0.25);
  }
}

export class MissaoMarte {
  constructor({ scene, camera, lua, base, toast, aoSairParaSala }) {
    this.scene = scene;
    this.camera = camera;
    this.lua = lua;
    this.base = base;
    this.toast = toast;
    this.aoSairParaSala = aoSairParaSala;

    this.loader = new GLTFLoader();
    this.som = new SomEspacial();

    // Estado: 'inativa' | 'cine_decolagem' | 'cine_painel' | 'voo' | 'cine_chegada' | 'fim'
    this.estado = 'inativa';
    this.t = 0;
    this.carregado = false;
    this.carregando = null;

    // Grupo na Lua (nave estacionada pronta para embarque!)
    this.naveLuaPos = new THREE.Vector3(14.5, 0, 8.5); // offset local em relação a lua.ORIGEM
    this.naveLua = null;
    this.marcNave = null;

    // Grupo do Espaço Profundo (Missão Marte)
    this.raiz = new THREE.Group();
    this.raiz.name = 'MissaoMarte';
    this.raiz.position.copy(ORIGEM_MARTE);
    this.raiz.visible = false;
    this.scene.add(this.raiz);

    this.tplNave = null;
    this.tplAsteroides = [];
    this.tplMarte = null;

    this.naveVoo = null;
    this.tremPousoVoo = null;
    this.chamasVoo = [];
    this.painelCanvas = criarTelaPainelDinamica();

    this.marteGrupo = null;
    this.marteMalha = null;
    this.estrelasWarp = null;
    this.luzSolMarte = null;
    this.luzAmbMarte = null;

    // Jogabilidade do voo
    this.shipPos = new THREE.Vector3(0, 0, 0);
    this.shipVel = new THREE.Vector2(0, 0);
    this.escudo = 100;
    this.destruidos = 0;
    this.distancia = DIST_INICIAL;
    this.coolLaser = 0;
    this.coolPlasma = 0;
    this.spawnTimer = 0;
    this.tremor = 0;
    this.danoFlash = 0;
    this.laserAtivo = false;
    this.plasmaAtivo = false;

    this.tiros = [];
    this.asteroides = [];
    this.explosoes = [];

    this.texLaser = criarTexBrilho('rgba(224,242,254,1)', 'rgba(56,189,248,0.85)');
    this.texPlasma = criarTexBrilho('rgba(255,240,255,1)', 'rgba(217,70,239,0.85)');
    this.texFogo = criarTexBrilho('rgba(255,248,200,1)', 'rgba(249,115,22,0.85)');

    // Referências HUD/DOM
    this.elHud = document.getElementById('hud-marte');
    this.elDist = document.getElementById('marte-dist');
    this.elAst = document.getElementById('marte-ast');
    this.elEscudo = document.getElementById('marte-escudo-barra');
    this.elEscudoTxt = document.getElementById('marte-escudo-txt');
    this.elCine = document.getElementById('cine-marte');
    this.elCineLeg = document.getElementById('cine-marte-legenda');
    this.elCinePular = document.getElementById('cine-marte-pular');
    this.elFinal = document.getElementById('marte-final');
    this.elTouchMarte = document.getElementById('touch-marte');
    this.elDanoMarte = document.getElementById('marte-flash');

    this._vincularUI();
  }

  _vincularUI() {
    this.elCinePular?.addEventListener('click', () => this.pularCutscene());
    document.getElementById('marte-btn-sala')?.addEventListener('click', () => {
      this.encerrar();
      this.aoSairParaSala?.();
    });
    document.getElementById('marte-btn-replay')?.addEventListener('click', () => {
      this.iniciarDaLua(false);
    });

    // Botões touch de Laser e Plasma
    const bindHold = (id, fn) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('pointerdown', e => { e.preventDefault(); fn(true); });
      el.addEventListener('pointerup', () => fn(false));
      el.addEventListener('pointercancel', () => fn(false));
      el.addEventListener('pointerleave', () => fn(false));
    };
    bindHold('touch-laser', on => { this.laserAtivo = on; });
    bindHold('touch-plasma', on => { this.plasmaAtivo = on; });
  }

  get ativa() { return this.estado !== 'inativa'; }
  get emVoo() { return this.estado === 'voo'; }
  get emCutscene() { return this.estado === 'cine_decolagem' || this.estado === 'cine_painel' || this.estado === 'cine_chegada' || this.estado === 'fim'; }

  /** Carrega nave_marte.glb, marte.glb e os 3 asteroides esculpidos em Blender. */
  async carregar() {
    if (this.carregado) return;
    if (this.carregando) return this.carregando;
    this.carregando = (async () => {
      const B = this.base;
      const [gNave, gMarte, gA1, gA2, gA3] = await Promise.all([
        this.loader.loadAsync(`${B}/veiculos/nave_marte/nave_marte.glb`),
        this.loader.loadAsync(`${B}/cenarios/marte/marte.glb`),
        this.loader.loadAsync(`${B}/cenarios/marte/asteroide_1.glb`),
        this.loader.loadAsync(`${B}/cenarios/marte/asteroide_2.glb`),
        this.loader.loadAsync(`${B}/cenarios/marte/asteroide_3.glb`),
      ]);
      this.tplNave = gNave.scene;
      this.tplMarte = gMarte.scene;
      this.tplAsteroides = [gA1.scene, gA2.scene, gA3.scene];

      this._colocarNaveNaLua();
      this._montarArenaEspacial();
      this.carregado = true;
    })();
    return this.carregando;
  }

  _prepararNave(clone) {
    clone.traverse(o => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.name === 'TelaPainel') {
          o.material = new THREE.MeshBasicMaterial({ map: this.painelCanvas.tex, side: THREE.DoubleSide });
        }
      }
    });
    // Chamas duplas dos propulsores traseiros (em Three.js, traseira da nave está em -Z!)
    const chamas = [];
    const geoC = new THREE.ConeGeometry(0.46, 3.6, 16, 1, true);
    geoC.rotateX(-Math.PI / 2);
    geoC.translate(0, 0, -1.8);
    const matC = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, transparent: true, opacity: 0.78,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const geoN = new THREE.ConeGeometry(0.24, 2.0, 12, 1, true);
    geoN.rotateX(-Math.PI / 2);
    geoN.translate(0, 0, -1.0);
    const matN = new THREE.MeshBasicMaterial({
      color: 0xffedd5, transparent: true, opacity: 0.92,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    for (const sx of [-1.24, 1.24]) {
      const g = new THREE.Group();
      g.position.set(sx, 1.38, -4.35);
      g.add(new THREE.Mesh(geoC, matC), new THREE.Mesh(geoN, matN));
      g.visible = false;
      clone.add(g);
      chamas.push(g);
    }
    const trem = clone.getObjectByName('TremPouso') || null;
    return { obj: clone, chamas, trem };
  }

  /** Estaciona a Nave Marte na superfície da Lua ao lado da base lunar! */
  _colocarNaveNaLua() {
    if (this.naveLua || !this.tplNave) return;
    const O = this.lua.ORIGEM;
    const lx = this.naveLuaPos.x, lz = this.naveLuaPos.z;
    const y = this.lua.altura(O.x + lx, O.z + lz);
    this.naveLuaPos.y = y;

    const prep = this._prepararNave(this.tplNave.clone(true));
    prep.obj.position.set(lx, y, lz);
    prep.obj.rotation.y = -0.65;
    if (prep.trem) prep.trem.visible = true;
    this.lua.raiz.add(prep.obj);
    this.naveLua = prep;

    // Marcador luminoso sutil ao redor da nave na Lua
    const g = new THREE.Group();
    g.position.set(lx, y + 0.08, lz);
    const anel = new THREE.Mesh(
      new THREE.RingGeometry(4.6, 5.1, 40),
      new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false })
    );
    anel.rotation.x = -Math.PI / 2;
    g.add(anel);
    this.lua.raiz.add(g);
    this.marcNave = g;
  }

  _montarArenaEspacial() {
    // 1. Iluminação cinematográfica espacial dedicada à arena de Marte
    // IMPORTANTE: adicionar o .target das DirectionalLights dentro de this.raiz (origem 60000,0,60000)
    // para que o Sol ilumine a face FRONTAL de Marte voltada para a câmera!
    this.luzAmbMarte = new THREE.HemisphereLight(0xfff0dc, 0x4a1f12, 0.92);
    this.raiz.add(this.luzAmbMarte);

    const solPos = new THREE.Vector3(-190, 125, -160);
    const marteAlvo = new THREE.Vector3(0, 4, 240);
    const dirSolMarte = solPos.clone().sub(marteAlvo).normalize(); // direção da superfície de Marte -> Sol

    this.luzSolMarte = new THREE.DirectionalLight(0xfff4e2, 3.85);
    this.luzSolMarte.position.copy(solPos);
    this.luzSolMarte.target.position.copy(marteAlvo);
    this.raiz.add(this.luzSolMarte, this.luzSolMarte.target);

    const luzRim = new THREE.DirectionalLight(0xfb923c, 0.95);
    luzRim.position.set(220, -35, 340);
    luzRim.target.position.copy(marteAlvo);
    this.raiz.add(luzRim, luzRim.target);

    // 2. Campo estelar 3D profundo (3.000 estrelas coloridas ao redor da arena)
    const N_EST = 3000;
    const ePos = new Float32Array(N_EST * 3), eCor = new Float32Array(N_EST * 3);
    let s = 1337;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < N_EST; i++) {
      const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - u * u);
      const dist = 1600 + rnd() * 1400;
      ePos.set([r * Math.cos(a) * dist, u * dist, r * Math.sin(a) * dist], i * 3);
      const b = 0.4 + 0.6 * rnd() ** 2, tom = rnd();
      eCor.set([b * (0.85 + 0.25 * tom), b * 0.92, b * (1.1 - 0.25 * tom)], i * 3);
    }
    const eGeo = new THREE.BufferGeometry();
    eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
    eGeo.setAttribute('color', new THREE.BufferAttribute(eCor, 3));
    const est = new THREE.Points(eGeo, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false }));
    est.frustumCulled = false;
    this.raiz.add(est);

    // 3. Poeira / linhas estelares de velocidade (warp streaks) voando contra a nave
    const N_WARP = 260;
    const wPos = new Float32Array(N_WARP * 6);
    this.warpSeeds = [];
    for (let i = 0; i < N_WARP; i++) {
      const x = (Math.random() - 0.5) * 140;
      const y = (Math.random() - 0.5) * 90;
      const z = Math.random() * 280 - 60;
      this.warpSeeds.push({ x, y, z, vel: 90 + Math.random() * 110 });
    }
    const wGeo = new THREE.BufferGeometry();
    wGeo.setAttribute('position', new THREE.BufferAttribute(wPos, 3));
    this.estrelasWarp = new THREE.LineSegments(
      wGeo,
      new THREE.LineBasicMaterial({ color: 0xbbe8ff, transparent: true, opacity: 0.42 })
    );
    this.estrelasWarp.frustumCulled = false;
    this.raiz.add(this.estrelasWarp);

    // 4. Planeta MARTE (modelo Blender + halo atmosférico Fresnel alaranjado perfeito e lindo!)
    this.marteGrupo = new THREE.Group();
    this.marteGrupo.position.set(0, 8, 520);
    this.marteMalha = this.tplMarte.clone(true);
    this.marteMalha.scale.setScalar(105);
    this.marteMalha.traverse(o => {
      if (o.isMesh && o.material) {
        o.material.roughness = 0.84;
        o.material.metalness = 0.0;
        o.material.fog = false;
        if (o.material.emissive) {
          o.material.emissive.setHex(0x280c05);
          o.material.emissiveIntensity = 0.32;
        }
      }
    });
    this.marteGrupo.add(this.marteMalha);

    // Camada interna de brilho atmosférico suave (Rayleigh marciano sincronizado com o Sol frontal!)
    const matAtmo = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide,
      uniforms: {
        uSol: { value: dirSolMarte.clone() },
      },
      vertexShader: `
        varying vec3 vN; varying vec3 vV; varying vec3 vWorldN;
        void main() {
          vWorldN = normalize(mat3(modelMatrix) * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uSol;
        varying vec3 vN; varying vec3 vV; varying vec3 vWorldN;
        void main() {
          float fres = pow(1.0 - max(dot(vN, vV), 0.0), 3.0);
          float dia = smoothstep(-0.25, 0.55, dot(vWorldN, uSol));
          vec3 cor = mix(vec3(0.96, 0.42, 0.16), vec3(1.0, 0.76, 0.52), fres);
          gl_FragColor = vec4(cor * fres * (0.24 + 0.96 * dia), fres * 0.88);
        }`,
    });
    const atmo = new THREE.Mesh(new THREE.SphereGeometry(107.2, 48, 32), matAtmo);
    this.marteGrupo.add(atmo);

    // Halo externo suave (BackSide)
    const matHalo = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
      uniforms: { uSol: { value: dirSolMarte.clone() } },
      vertexShader: `
        varying vec3 vN; varying vec3 vV; varying vec3 vWorldN;
        void main() {
          vWorldN = normalize(mat3(modelMatrix) * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uSol;
        varying vec3 vN; varying vec3 vV; varying vec3 vWorldN;
        void main() {
          float rim = pow(clamp(dot(-vN, vV), 0.0, 1.0), 2.5);
          float dia = smoothstep(-0.30, 0.60, dot(vWorldN, uSol));
          vec3 cor = vec3(1.0, 0.54, 0.25);
          gl_FragColor = vec4(cor * rim * (0.22 + 0.78 * dia), rim * 0.68);
        }`,
    });
    const halo = new THREE.Mesh(new THREE.SphereGeometry(118, 48, 32), matHalo);
    this.marteGrupo.add(halo);
    this.raiz.add(this.marteGrupo);

    // 5. Nave do Jogador para a fase espacial (aponta para +Z rumo a Marte!)
    const prepVoo = this._prepararNave(this.tplNave.clone(true));
    this.naveVoo = prepVoo.obj;
    this.tremPousoVoo = prepVoo.trem;
    this.chamasVoo = prepVoo.chamas;
    if (this.tremPousoVoo) this.tremPousoVoo.visible = false;
    this.raiz.add(this.naveVoo);

    // 6. Interior detalhado da Cabine (usado exclusivamente na Cutscene 1B: painel DESTINO MARTE + janela p/ o espaço!)
    this.cabineGrupo = this._construirCabineInterior();
    this.cabineGrupo.visible = false;
    this.raiz.add(this.cabineGrupo);
  }

  /** Constrói o interior 3D da cabine da nave (mesma paleta grafite/branco/laranja) para a cutscene do painel. */
  _construirCabineInterior() {
    const g = new THREE.Group();
    const mGraf = new THREE.MeshStandardMaterial({ color: 0x1e2530, roughness: 0.45, metalness: 0.55 });
    const mEsc = new THREE.MeshStandardMaterial({ color: 0x0d121a, roughness: 0.55, metalness: 0.45 });
    const mBranco = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.4, metalness: 0.25 });
    const mLar = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.38, metalness: 0.28 });
    const mCiano = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const mLedVerd = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
    const mLedLar = new THREE.MeshBasicMaterial({ color: 0xfb923c });

    // Base envolvente do painel de instrumentos
    const consoleBase = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.72, 1.35), mEsc);
    consoleBase.position.set(0, 0.72, 2.22);
    g.add(consoleBase);

    // Cobertura superior do painel (com friso laranja industrial)
    const capota = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.11, 0.76), mGraf);
    capota.position.set(0, 1.09, 2.38);
    g.add(capota);
    const friso = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.035, 0.06), mLar);
    friso.position.set(0, 1.15, 2.02);
    g.add(friso);

    // Moldura luminosa + Tela Central Holográfica (DESTINO ESPACIAL: MARTE)
    const moldTela = new THREE.Mesh(new THREE.BoxGeometry(2.04, 1.04, 0.08), mGraf);
    moldTela.rotation.order = 'YXZ';
    moldTela.rotation.set(-0.22, Math.PI, 0);
    moldTela.position.set(0, 1.56, 2.34);
    g.add(moldTela);

    const bordaCiano = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.98, 0.09), mCiano);
    bordaCiano.rotation.order = 'YXZ';
    bordaCiano.rotation.set(-0.22, Math.PI, 0);
    bordaCiano.position.set(0, 1.56, 2.34);
    g.add(bordaCiano);

    const telaMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.92, 0.94),
      new THREE.MeshBasicMaterial({ map: this.painelCanvas.tex })
    );
    telaMesh.rotation.order = 'YXZ';
    telaMesh.rotation.set(-0.22, Math.PI, 0);
    telaMesh.position.set(0, 1.56, 2.28);
    g.add(telaMesh);

    // Telas auxiliares laterais (propulsores / escudos / armas)
    const criarTelaLateral = (titulo, linhas, corHex) => {
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 192;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#040c18'; ctx.fillRect(0, 0, 256, 192);
      ctx.strokeStyle = corHex; ctx.lineWidth = 4; ctx.strokeRect(6, 6, 244, 180);
      ctx.fillStyle = corHex; ctx.font = '900 18px monospace'; ctx.fillText(titulo, 18, 36);
      ctx.fillStyle = '#e2e8f0'; ctx.font = '700 14px monospace';
      linhas.forEach((l, idx) => ctx.fillText(l, 18, 70 + idx * 28));
      // Barrinhas de telemetria
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i < 5 ? corHex : '#475569';
        ctx.fillRect(18 + i * 36, 152, 28, 16);
      }
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshBasicMaterial({ map: t });
    };

    const matEsq = criarTelaLateral('PROPULSÃO', ['REATOR: 100%', 'EMPX: 2.8 MN', 'ÓRBITA: OK'], '#38bdf8');
    const matDir = criarTelaLateral('ARMAMENTO', ['LASER: PRONTO', 'PLASMA: 100%', 'ESCUDO: 100%'], '#fb923c');

    for (const [sx, mat] of [[1, matEsq], [-1, matDir]]) {
      const mMold = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.66, 0.08), mGraf);
      mMold.rotation.order = 'YXZ';
      mMold.rotation.set(-0.20, Math.PI + sx * 0.42, 0);
      mMold.position.set(sx * 1.44, 1.46, 2.02);
      g.add(mMold);

      const mPl = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.60), mat);
      mPl.rotation.order = 'YXZ';
      mPl.rotation.set(-0.20, Math.PI + sx * 0.42, 0);
      mPl.position.set(sx * 1.42, 1.46, 1.97);
      g.add(mPl);
    }

    // Fileira de botões e LEDs luminosos no console
    for (let i = -5; i <= 5; i++) {
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.035, 0.05), i % 3 === 0 ? mLedLar : (i % 2 === 0 ? mCiano : mLedVerd));
      led.position.set(i * 0.14, 1.07, 1.92);
      g.add(led);
    }

    // Manche / controles de pilotagem duplos (HOTAS)
    for (const sx of [-0.62, 0.62]) {
      const baseM = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.13, 0.14, 12), mGraf);
      baseM.position.set(sx, 0.98, 1.62);
      const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.34, 10), mEsc);
      haste.position.set(sx, 1.15, 1.58);
      haste.rotation.x = 0.24;
      const topo = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.10), mLar);
      topo.position.set(sx, 1.30, 1.54);
      g.add(baseM, haste, topo);
    }

    // Moldura blindada da janela da cabine (colunas laterais + teto, SEM barra central tapando a visão!)
    for (const sx of [-1, 1]) {
      const pilar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.25, 0.22), mGraf);
      pilar.position.set(sx * 1.98, 2.12, 1.95);
      pilar.rotation.z = sx * 0.18;
      pilar.rotation.x = -0.35;
      g.add(pilar);

      const detalheBr = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.4, 0.14), mBranco);
      detalheBr.position.set(sx * 1.90, 2.05, 1.85);
      detalheBr.rotation.z = sx * 0.18;
      detalheBr.rotation.x = -0.35;
      g.add(detalheBr);
    }
    const vigaTopo = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.24, 0.35), mGraf);
    vigaTopo.position.set(0, 2.95, 1.60);
    g.add(vigaTopo);

    // Iluminação interna da cabine (reflexo ciano do painel + luz quente laranja)
    const luzPainel = new THREE.PointLight(0x38bdf8, 2.6, 8);
    luzPainel.position.set(0, 1.82, 1.55);
    const luzQuente = new THREE.PointLight(0xf97316, 1.2, 6);
    luzQuente.position.set(0, 1.25, 1.15);
    g.add(luzPainel, luzQuente);

    return g;
  }

  /** Posição mundial da nave estacionada na Lua + colisão */
  posNaveNaLuaMundo() {
    const O = this.lua.ORIGEM;
    return { x: O.x + this.naveLuaPos.x, y: this.naveLuaPos.y, z: O.z + this.naveLuaPos.z };
  }

  colidirLua(x, z, r) {
    if (!this.naveLua) return { x, z };
    const p = this.posNaveNaLuaMundo();
    const dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz), min = 3.6 + r;
    if (d < min && d > 1e-4) { x = p.x + dx / d * min; z = p.z + dz / d * min; }
    return { x, z };
  }

  interacaoLua(jx, jz) {
    if (!this.lua.ativa || this.ativa || !this.naveLua) return null;
    const p = this.posNaveNaLuaMundo();
    if (Math.hypot(jx - p.x, jz - p.z) < 6.4) {
      return {
        texto: '[E] 🚀 Embarcar na Nave · Missão Marte',
        fazer: () => this.iniciarDaLua(true),
      };
    }
    return null;
  }

  /** Inicia a Missão Marte (com cutscene de decolagem + painel da cabine). */
  async iniciarDaLua(comDecolagem = true) {
    await this.carregar();
    this._limparEntidades();

    this.t = 0;
    this.escudo = 100;
    this.destruidos = 0;
    this.distancia = DIST_INICIAL;
    this.shipPos.set(0, 0, 0);
    this.shipVel.set(0, 0);
    this.coolLaser = 0;
    this.coolPlasma = 0;
    this.spawnTimer = 0.4;
    this.tremor = 0;
    this.danoFlash = 0;
    this.laserAtivo = false;
    this.plasmaAtivo = false;

    this.naveVoo.visible = true;
    this.naveVoo.position.set(0, 0, 0);
    this.naveVoo.rotation.set(0, 0, 0);
    this.naveVoo.scale.setScalar(1);
    for (const c of this.chamasVoo) c.visible = true;
    if (this.cabineGrupo) this.cabineGrupo.visible = false;

    this.marteGrupo.position.set(0, 8, 520);
    this.marteGrupo.scale.setScalar(0.55);

    this.elFinal?.classList.add('oculto');
    this.elHud?.classList.add('oculto');
    this.elTouchMarte?.classList.add('oculto');

    if (comDecolagem && this.naveLua) {
      this.estado = 'cine_decolagem';
      this.raiz.visible = false;
      this.naveLua.obj.position.set(this.naveLuaPos.x, this.naveLuaPos.y, this.naveLuaPos.z);
      if (this.naveLua.trem) this.naveLua.trem.visible = true;
      for (const c of this.naveLua.chamas) c.visible = true;
      if (this.marcNave) this.marcNave.visible = false;
      this._mostrarCine(true, '🚀 DECOLANDO DA LUA · RUMO A MARTE');
    } else {
      this._entrarPainelCabine();
    }
    document.body.classList.add('modo-marte');
  }

  _entrarPainelCabine() {
    this.estado = 'cine_painel';
    this.t = 0;
    this.raiz.visible = true;
    this.lua.raiz.visible = false;
    // Mostra o interior detalhado da cabine + Planeta Marte brilhando pela janela superior!
    this.naveVoo.visible = false;
    if (this.cabineGrupo) this.cabineGrupo.visible = true;
    this.marteGrupo.position.set(-28, 72, 390);
    this.marteGrupo.scale.setScalar(0.46);
    this.painelCanvas.desenhar(0, false);
    this._mostrarCine(true, '🛰️ PAINEL DE NAVEGAÇÃO · DESTINO ESPACIAL: PLANETA MARTE');
  }

  _iniciarCombate() {
    this.estado = 'voo';
    this.t = 0;
    this.raiz.visible = true;
    this.lua.raiz.visible = false;
    this.naveVoo.visible = true;
    if (this.cabineGrupo) this.cabineGrupo.visible = false;
    this.marteGrupo.position.set(0, 8, 520);
    this.marteGrupo.scale.setScalar(0.55);
    this._mostrarCine(false);
    this.elHud?.classList.remove('oculto');
    this.elTouchMarte?.classList.remove('oculto');
    this._atualizarHud();
    // Já nasce com 4 asteroides à frente para ação imediata!
    for (let i = 0; i < 4; i++) this._spawnAsteroide(120 + i * 38);
    this.toast?.('☄️ CINTURÃO DE ASTEROIDES! Desvie (WASD) · Clique/Espaço = LASER · Botão Dir/F = PLASMA!');
  }

  _iniciarChegadaMarte() {
    this.estado = 'cine_chegada';
    this.t = 0;
    this._limparEntidades();
    this.elHud?.classList.add('oculto');
    this.elTouchMarte?.classList.add('oculto');
    this.elDanoMarte && (this.elDanoMarte.style.opacity = '0');
    if (this.cabineGrupo) this.cabineGrupo.visible = false;

    // Posiciona Marte imponente, perfeitamente iluminado pelo Sol frontal, bem à frente!
    this.marteGrupo.position.set(0, 4, 240);
    this.marteGrupo.scale.setScalar(1.15);
    this.naveVoo.visible = true;
    this.naveVoo.position.set(-14, -4, 0);
    this.naveVoo.rotation.set(0, 0, 0);
    this.naveVoo.scale.setScalar(1);
    for (const c of this.chamasVoo) c.visible = true;
    this._mostrarCine(true, '🪐 ÓRBITA DE MARTE ALCANÇADA');
  }

  pularCutscene() {
    if (this.estado === 'cine_decolagem') this._entrarPainelCabine();
    else if (this.estado === 'cine_painel') this._iniciarCombate();
    else if (this.estado === 'cine_chegada') this._mostrarFinal();
  }

  _mostrarCine(on, texto = '') {
    document.body.classList.toggle('em-cine', on);
    if (this.elCine) this.elCine.classList.toggle('oculto', !on);
    if (this.elCineLeg) this.elCineLeg.textContent = texto;
  }

  _mostrarFinal() {
    this.estado = 'fim';
    this._mostrarCine(true, '');
    if (this.elCinePular) this.elCinePular.classList.add('oculto');
    this.elFinal?.classList.remove('oculto');
  }

  encerrar() {
    this._limparEntidades();
    this.estado = 'inativa';
    this.raiz.visible = false;
    if (this.cabineGrupo) this.cabineGrupo.visible = false;
    this._mostrarCine(false);
    if (this.elCinePular) this.elCinePular.classList.remove('oculto');
    this.elHud?.classList.add('oculto');
    this.elTouchMarte?.classList.add('oculto');
    this.elFinal?.classList.add('oculto');
    if (this.elDanoMarte) this.elDanoMarte.style.opacity = '0';
    document.body.classList.remove('modo-marte');
    // Restaura nave na Lua se existir
    if (this.naveLua) {
      this.naveLua.obj.position.set(this.naveLuaPos.x, this.naveLuaPos.y, this.naveLuaPos.z);
      if (this.naveLua.trem) this.naveLua.trem.visible = true;
      for (const c of this.naveLua.chamas) c.visible = false;
      if (this.marcNave) this.marcNave.visible = true;
    }
  }

  _limparEntidades() {
    for (const t of this.tiros) this.raiz.remove(t.obj);
    for (const a of this.asteroides) this.raiz.remove(a.obj);
    for (const e of this.explosoes) this.raiz.remove(e.grupo);
    this.tiros.length = 0;
    this.asteroides.length = 0;
    this.explosoes.length = 0;
  }

  // ---- Armas: Laser rápido (duplo) e Plasma pesado (esfera explosiva) ------------------------------
  dispararLaser() {
    if (this.estado !== 'voo' || this.coolLaser > 0) return;
    this.coolLaser = 0.14;
    this.som.laser();
    for (const sx of [-2.12, 2.12]) {
      const g = new THREE.Group();
      const feixe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 4.4, 8),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      feixe.rotation.x = Math.PI / 2;
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texLaser, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.scale.set(1.6, 1.6, 1);
      g.add(feixe, halo);
      g.position.set(this.shipPos.x + sx, this.shipPos.y + 1.16, this.shipPos.z + 1.5);
      this.raiz.add(g);
      this.tiros.push({ tipo: 'laser', obj: g, vel: 165, dano: 1, raio: 1.5, vida: 2.2 });
    }
  }

  dispararPlasma() {
    if (this.estado !== 'voo' || this.coolPlasma > 0) return;
    this.coolPlasma = 0.50;
    this.som.plasma();
    this.tremor = Math.max(this.tremor, 0.25);

    const g = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.68, 14, 12),
      new THREE.MeshBasicMaterial({ color: 0xf5d0fe })
    );
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texPlasma, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.scale.set(4.8, 4.8, 1);
    g.add(core, halo);
    g.position.set(this.shipPos.x, this.shipPos.y + 1.1, this.shipPos.z + 4.4);
    this.raiz.add(g);
    this.tiros.push({ tipo: 'plasma', obj: g, vel: 118, dano: 4, raio: 4.5, vida: 2.8 });
  }

  _spawnAsteroide(zInicial = 230) {
    if (!this.tplAsteroides.length) return;
    const tpl = this.tplAsteroides[Math.floor(Math.random() * this.tplAsteroides.length)];
    const obj = tpl.clone(true);
    obj.traverse(m => {
      if (m.isMesh && m.material) {
        m.material = m.material.clone();
        if (m.material.emissive) m.material.emissive.setHex(0x000000);
      }
    });
    const grande = Math.random() < 0.34;
    const escala = grande ? (3.2 + Math.random() * 2.2) : (1.5 + Math.random() * 1.4);
    obj.scale.setScalar(escala);

    // 45% mira perto da rota da nave para obrigar desvio/tiro; 55% espalha pelo corredor
    const naRota = Math.random() < 0.45;
    const ax = naRota ? clamp(this.shipPos.x + (Math.random() - 0.5) * 9, -20, 20) : (Math.random() - 0.5) * 44;
    const ay = naRota ? clamp(this.shipPos.y + (Math.random() - 0.5) * 6, -10, 11) : (Math.random() - 0.5) * 24;
    obj.position.set(ax, ay, zInicial);
    obj.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    this.raiz.add(obj);

    this.asteroides.push({
      obj,
      raio: escala * 1.08,
      hp: grande ? 3 : 1,
      grande,
      vel: 52 + Math.random() * 34,
      rot: new THREE.Vector3((Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 2.2),
      flash: 0,
    });
  }

  _explodirAsteroide(pos, grande) {
    this.som.explosao(grande);
    this.tremor = Math.max(this.tremor, grande ? 0.55 : 0.28);

    const grupo = new THREE.Group();
    grupo.position.copy(pos);

    // Clarão central + anel de onda de choque
    const bola = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texFogo, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    bola.scale.setScalar(grande ? 13 : 7.5);
    const anel = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 1.35, 24),
      new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.9, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    grupo.add(bola, anel);

    // Estilhaços de rocha voando em todas as direções!
    const pedacos = [];
    const nPed = grande ? 14 : 8;
    const geoP = new THREE.DodecahedronGeometry(grande ? 0.65 : 0.38, 0);
    const matP = new THREE.MeshStandardMaterial({ color: 0x7c4a32, emissive: 0xf97316, emissiveIntensity: 0.9, roughness: 0.85 });
    for (let i = 0; i < nPed; i++) {
      const m = new THREE.Mesh(geoP, matP);
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const v = dir.multiplyScalar((grande ? 18 : 13) + Math.random() * 14);
      grupo.add(m);
      pedacos.push({ m, v });
    }
    this.raiz.add(grupo);
    this.explosoes.push({ grupo, bola, anel, pedacos, idade: 0, dur: grande ? 0.95 : 0.68, grande });
  }

  _atualizarHud() {
    if (this.elDist) this.elDist.textContent = `${Math.max(0, Math.round(this.distancia * 2.25))}M km`;
    if (this.elAst) this.elAst.textContent = `${this.destruidos}/${META_ASTEROIDES}`;
    if (this.elEscudo) this.elEscudo.style.transform = `scaleX(${clamp(this.escudo / 100, 0, 1).toFixed(3)})`;
    if (this.elEscudoTxt) this.elEscudoTxt.textContent = `${Math.max(0, Math.round(this.escudo))}%`;
  }

  _atualizarWarp(dt, velMult = 1) {
    if (!this.estrelasWarp) return;
    const arr = this.estrelasWarp.geometry.attributes.position.array;
    for (let i = 0; i < this.warpSeeds.length; i++) {
      const w = this.warpSeeds[i];
      w.z -= w.vel * velMult * dt;
      if (w.z < -40) {
        w.z = 240 + Math.random() * 40;
        w.x = (Math.random() - 0.5) * 140;
        w.y = (Math.random() - 0.5) * 90;
      }
      const j = i * 6;
      arr[j] = w.x; arr[j + 1] = w.y; arr[j + 2] = w.z;
      arr[j + 3] = w.x; arr[j + 4] = w.y; arr[j + 5] = w.z + 4.8 * velMult;
    }
    this.estrelasWarp.geometry.attributes.position.needsUpdate = true;
  }

  /** Atualização principal chamada no laço do jogo quando a Missão Marte está ativa (ou na Lua p/ pulsar o marcador). */
  atualizar(dt, entrada = {}) {
    if (this.marcNave && this.lua.ativa && !this.ativa) {
      this.marcNave.rotation.y += dt * 0.7;
      return null;
    }
    if (!this.ativa) return null;

    this.t += dt;
    this.tremor = Math.max(0, this.tremor - dt * 2.4);
    if (this.danoFlash > 0) {
      this.danoFlash = Math.max(0, this.danoFlash - dt * 2.8);
      if (this.elDanoMarte) this.elDanoMarte.style.opacity = (this.danoFlash * 0.55).toFixed(3);
    }

    // Gira Marte majestosamente sempre que a arena está visível
    if (this.marteMalha && this.raiz.visible) this.marteMalha.rotation.y += dt * 0.065;

    // -------------------------------------------------------- CUTSCENE 1A: DECOLAGEM DA LUA
    if (this.estado === 'cine_decolagem') {
      const u = clamp(this.t / 2.6, 0, 1);
      const elev = 32 * u * u;
      const O = this.lua.ORIGEM;
      const nx = this.naveLuaPos.x, ny = this.naveLuaPos.y + elev, nz = this.naveLuaPos.z;
      this.naveLua.obj.position.set(nx, ny, nz);
      this.naveLua.obj.rotation.x = -0.22 * suave(u);
      if (u > 0.35 && this.naveLua.trem) this.naveLua.trem.visible = false;
      for (const c of this.naveLua.chamas) {
        c.visible = true;
        const f = 1 + 0.25 * Math.sin(this.t * 48);
        c.scale.set(1, 1, (0.6 + 1.1 * u) * f);
      }
      const pCam = new THREE.Vector3(O.x + nx + 11, ny + 3.2 - elev * 0.45, O.z + nz + 12);
      const aCam = new THREE.Vector3(O.x + nx, ny + 1.8, O.z + nz);
      if (this.t >= 2.6) this._entrarPainelCabine();
      return { p: pCam, a: aCam, fov: 50 };
    }

    // -------------------------------------------------------- CUTSCENE 1B: PAINEL DENTRO DA CABINE -> DESTINO: MARTE
    if (this.estado === 'cine_painel') {
      const alerta = this.t > 3.2;
      this.painelCanvas.desenhar(this.t, alerta);
      this._atualizarWarp(dt, 1.35);
      for (const c of this.chamasVoo) { c.visible = true; c.scale.set(1, 1, 1.0 + 0.15 * Math.sin(this.t * 42)); }

      if (alerta && this.elCineLeg) {
        this.elCineLeg.textContent = '⚠️ ALERTA: CINTURÃO DE ASTEROIDES À FRENTE · ARMAS LASER & PLASMA ATIVADAS!';
      }

      // Câmera DENTRO DA CABINE olhando direto para o Painel Holográfico (DESTINO ESPACIAL: MARTE) + Marte pela janela!
      const swayX = Math.sin(this.t * 1.05) * 0.06;
      const swayY = Math.cos(this.t * 0.85) * 0.03;
      const zoom = suave(clamp(this.t / 2.2, 0, 1));
      const pCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(swayX, 1.86 + swayY, -0.32 + zoom * 0.28));
      const aCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(0, 1.66 + (alerta ? 0.14 : 0.0), 2.35));

      if (this.t >= 5.6) this._iniciarCombate();
      return { p: pCam, a: aCam, fov: 46 };
    }

    // -------------------------------------------------------- FASE JOGÁVEL: CINTURÃO DE ASTEROIDES
    if (this.estado === 'voo') {
      this._atualizarWarp(dt, 1.5);
      this.coolLaser = Math.max(0, this.coolLaser - dt);
      this.coolPlasma = Math.max(0, this.coolPlasma - dt);

      // Controle suave da nave (WASD / Setas / Joystick)
      const inpX = clamp(-(entrada.lado || 0), -1, 1);    // direita = -X na câmera olhando +Z
      const inpY = clamp(entrada.frente || 0, -1, 1);     // W / cima = sobe
      this.shipVel.x += (inpX * 26 - this.shipVel.x) * Math.min(1, dt * 8);
      this.shipVel.y += (inpY * 18 - this.shipVel.y) * Math.min(1, dt * 8);
      this.shipPos.x = clamp(this.shipPos.x + this.shipVel.x * dt, -18, 18);
      this.shipPos.y = clamp(this.shipPos.y + this.shipVel.y * dt, -9.5, 10.5);

      this.naveVoo.position.copy(this.shipPos);
      // Inclinação dinâmica nas curvas (banking/roll + pitch)
      this.naveVoo.rotation.z = -this.shipVel.x * 0.024;
      this.naveVoo.rotation.x = -this.shipVel.y * 0.018;
      this.naveVoo.rotation.y = this.shipVel.x * 0.008;

      for (const c of this.chamasVoo) {
        c.visible = true;
        c.scale.set(1, 1, 1.1 + 0.25 * Math.sin(this.t * 50));
      }

      // Disparos (teclado, mouse ou botões touch)
      if (entrada.laser || this.laserAtivo) this.dispararLaser();
      if (entrada.plasma || this.plasmaAtivo) this.dispararPlasma();

      // Spawn contínuo de asteroides
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.asteroides.length < 18) {
        this._spawnAsteroide(215 + Math.random() * 55);
        this.spawnTimer = 0.42 + Math.random() * 0.32;
      }

      // Atualiza tiros
      for (let i = this.tiros.length - 1; i >= 0; i--) {
        const ti = this.tiros[i];
        ti.vida -= dt;
        ti.obj.position.z += ti.vel * dt;
        let acertou = false;
        for (let j = this.asteroides.length - 1; j >= 0; j--) {
          const a = this.asteroides[j];
          const d = ti.obj.position.distanceTo(a.obj.position);
          if (d < a.raio + ti.raio) {
            a.hp -= ti.dano;
            a.flash = 0.14;
            acertou = true;
            // Plasma dá dano em área nos asteroides vizinhos!
            if (ti.tipo === 'plasma') {
              for (let k = this.asteroides.length - 1; k >= 0; k--) {
                if (k === j) continue;
                const a2 = this.asteroides[k];
                if (a2.obj.position.distanceTo(ti.obj.position) < a2.raio + 11) {
                  a2.hp -= 3;
                  a2.flash = 0.15;
                }
              }
            }
            break;
          }
        }
        if (acertou || ti.vida <= 0) {
          this.raiz.remove(ti.obj);
          this.tiros.splice(i, 1);
        }
      }

      // Atualiza asteroides + colisões + explosões
      for (let i = this.asteroides.length - 1; i >= 0; i--) {
        const a = this.asteroides[i];
        a.obj.position.z -= a.vel * dt;
        a.obj.rotation.x += a.rot.x * dt;
        a.obj.rotation.y += a.rot.y * dt;
        a.obj.rotation.z += a.rot.z * dt;

        if (a.flash > 0) {
          a.flash -= dt;
          a.obj.traverse(m => { if (m.isMesh && m.material?.emissive) m.material.emissive.setHex(a.flash > 0 ? 0xf97316 : 0x000000); });
        }

        if (a.hp <= 0) {
          this._explodirAsteroide(a.obj.position, a.grande);
          this.raiz.remove(a.obj);
          this.asteroides.splice(i, 1);
          this.destruidos++;
          this.distancia = Math.max(0, this.distancia - (a.grande ? 6.5 : 4.2));
          this._atualizarHud();
          continue;
        }

        // Colisão asteroide x nave
        const dNave = Math.hypot(
          a.obj.position.x - this.shipPos.x,
          a.obj.position.y - (this.shipPos.y + 1.2),
          a.obj.position.z - this.shipPos.z
        );
        if (dNave < a.raio + 2.35) {
          this._explodirAsteroide(a.obj.position, true);
          this.raiz.remove(a.obj);
          this.asteroides.splice(i, 1);
          this.escudo = Math.max(0, this.escudo - (a.grande ? 28 : 18));
          this.danoFlash = 1.0;
          this.tremor = 0.7;
          this.som.dano();
          this._atualizarHud();
          if (this.escudo <= 0) {
            this.toast?.('⚠️ Escudos rompidos! Reiniciando travessia do cinturão…');
            this.escudo = 100;
            this.distancia = Math.min(DIST_INICIAL, this.distancia + 25);
            this._limparEntidades();
            this._atualizarHud();
            break;
          }
          continue;
        }

        if (a.obj.position.z < -35) {
          this.raiz.remove(a.obj);
          this.asteroides.splice(i, 1);
        }
      }

      // Atualiza explosões 3D
      for (let i = this.explosoes.length - 1; i >= 0; i--) {
        const e = this.explosoes[i];
        e.idade += dt;
        const k = e.idade / e.dur;
        if (k >= 1) { this.raiz.remove(e.grupo); this.explosoes.splice(i, 1); continue; }
        e.bola.material.opacity = (1 - k) * (1 - k);
        e.bola.scale.setScalar((e.grande ? 13 : 7.5) * (0.7 + k * 1.4));
        e.anel.scale.setScalar(1 + k * (e.grande ? 13 : 8));
        e.anel.material.opacity = (1 - k) * 0.85;
        for (const p of e.pedacos) {
          p.m.position.addScaledVector(p.v, dt);
          p.m.rotation.x += dt * 4; p.m.rotation.y += dt * 3;
          p.m.scale.setScalar(Math.max(0.05, 1 - k));
        }
      }

      // Progresso contínuo aproximando Marte na frente da nave!
      this.distancia = Math.max(0, this.distancia - dt * 1.8);
      const prox = 1 - this.distancia / DIST_INICIAL;
      this.marteGrupo.position.set(0, 8 - prox * 4, 520 - prox * 250);
      this.marteGrupo.scale.setScalar(0.55 + prox * 0.55);
      this._atualizarHud();

      // Chegou perto de Marte (distância zerada ou meta de asteroides batida + próximo)!
      if (this.distancia <= 0 || this.destruidos >= META_ASTEROIDES) {
        this._iniciarChegadaMarte();
      }

      // Câmera 3ª pessoa espacial dinâmica atrás da nave
      const tx = (Math.random() - 0.5) * this.tremor;
      const ty = (Math.random() - 0.5) * this.tremor;
      const pCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(this.shipPos.x * 0.72 + tx, this.shipPos.y * 0.72 + 4.4 + ty, -14.8));
      const aCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(this.shipPos.x * 0.85, this.shipPos.y * 0.85 + 1.5, 42));
      return { p: pCam, a: aCam, fov: 60 };
    }

    // -------------------------------------------------------- CUTSCENE 2: MARTE PERFEITO + NAVE INDO PARA DENTRO DO PLANETA
    if (this.estado === 'cine_chegada') {
      this._atualizarWarp(dt, 0.35);
      const dur = 9.2;
      const u = clamp(this.t / dur, 0, 1);

      // A nave voa suavemente da câmera direto para dentro do planeta Marte e diminui até sumir na atmosfera!
      const kVoo = suave(clamp((this.t - 1.2) / 7.2, 0, 1));
      const sx = -10 * (1 - kVoo) + Math.sin(kVoo * Math.PI) * 3.5;
      const sy = -3 * (1 - kVoo) + 4 * kVoo;
      const sz = -2 + kVoo * 175;
      this.naveVoo.position.set(sx, sy, sz);
      this.naveVoo.rotation.set(-0.04, 0.08 * (1 - kVoo), -0.18 * Math.sin(kVoo * Math.PI));
      // A nave some gradualmente ao entrar na atmosfera luminosa de Marte
      const escNave = Math.max(0.02, 1.0 - Math.pow(kVoo, 2.2) * 0.96);
      this.naveVoo.scale.setScalar(escNave);
      this.naveVoo.visible = kVoo < 0.96;
      for (const c of this.chamasVoo) {
        c.visible = true;
        c.scale.set(1, 1, 1.25 + 0.2 * Math.sin(this.t * 45));
      }

      // Câmera FICA EM ÓRBITA (NÃO acompanha ele para dentro!) admirando o planeta perfeito e lindo!
      const panX = -18 + suave(u) * 26;
      const panY = 7 - suave(u) * 2.5;
      const panZ = -22 + suave(u) * 14;
      const pCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(panX, panY, panZ));
      const aCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(0, 4, 240));

      if (this.t > 4.2 && this.elCineLeg) {
        this.elCineLeg.textContent = '🚀 ENTRANDO NA ATMOSFERA DE MARTE…';
      }
      if (this.t >= dur) this._mostrarFinal();
      return { p: pCam, a: aCam, fov: 48 };
    }

    // -------------------------------------------------------- TELA FINAL: "Nos veremos lá"
    if (this.estado === 'fim') {
      const pCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(8, 4.5, -8));
      const aCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(0, 4, 240));
      return { p: pCam, a: aCam, fov: 48 };
    }

    return null;
  }

  /** Atalhos p/ testes automatizados */
  info() {
    return {
      estado: this.estado,
      carregado: this.carregado,
      escudo: Math.round(this.escudo),
      destruidos: this.destruidos,
      meta: META_ASTEROIDES,
      distancia: Math.round(this.distancia),
      asteroidesAtivos: this.asteroides.length,
      tirosAtivos: this.tiros.length,
      explosoesAtivas: this.explosoes.length,
      naveNaLua: !!this.naveLua,
    };
  }
}
