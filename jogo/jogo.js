// HRYZ CITY — Jogo 3D de mundo aberto na Cidade Oficial do canal (Three.js r160)
// Controles: WASD/Setas, Shift (correr), Espaço (pular / freio de mão), E (entrar/sair do carro),
// L (sirene/giroflex), F (faróis), N (dia/noite), R (chuva), V (câmera), C (personagem), M (som), H (ajuda).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TILE, CALCADA, ESCALA_VEICULO } from '../videos/biblioteca3d/cidade/kit.js';
import { Personagem } from '../videos/biblioteca3d/personagens/elenco/elenco.js';
import { Corredor } from '../videos/biblioteca3d/personagens/corredor/corredor.js';
import { criarViatura, criarAmbiente } from '../videos/biblioteca3d/veiculos/policia/viatura.js';
import { construirCidade, PONTOS_TELEPORTE } from './cidade.js';

const BASE_BIB = './videos/biblioteca3d';

const PERSONAGENS_DEF = [
  { id: 'policial',   nome: 'Policial',      tipo: 'elenco',   url: `${BASE_BIB}/personagens/elenco/policial.glb` },
  { id: 'jovem_a',    nome: 'Jovem A',       tipo: 'elenco',   url: `${BASE_BIB}/personagens/elenco/jovem_a.glb` },
  { id: 'bombeiro',   nome: 'Bombeiro',      tipo: 'elenco',   url: `${BASE_BIB}/personagens/elenco/bombeiro.glb` },
  { id: 'astronauta', nome: 'Astronauta',    tipo: 'elenco',   url: `${BASE_BIB}/personagens/elenco/astronauta.glb` },
  { id: 'corredor',   nome: 'Corredor',      tipo: 'corredor', url: `${BASE_BIB}/personagens/corredor/corredor-colorido.glb` },
  { id: 'silhueta',   nome: 'Silhueta Hryz', tipo: 'silhueta', url: `${BASE_BIB}/personagens/corredor/corredor.glb` },
];

const CHECKPOINTS = [
  { nome: 'Praça Central',      x: 216, z: 168 },
  { nome: 'Rotatória Central',  x: 252, z: 222 },
  { nome: 'Entrada da Rodovia', x: 18,  z: 96  },
  { nome: 'Reta da Rodovia',    x: 18,  z: 360 },
  { nome: 'Pista do Aeroporto', x: 260, z: 567 },
  { nome: 'Jardim Hryz',        x: 248, z: 312 },
  { nome: 'Estádio Hryz',       x: 396, z: 84  },
  { nome: 'Delegacia Central',  x: 146, z: 168 },
];

// ====================================================================================================
// Áudio procedural leve (WebAudio): motor, sirene P71, porta e checkpoint
// ====================================================================================================
class SomJogo {
  constructor() {
    this.ctx = null;
    this.mudo = false;
    this.motorOsc = null;
    this.motorGain = null;
    this.sireneOsc = null;
    this.sireneGain = null;
  }
  desbloquear() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    // Motor contínuo suave
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 260;
    this.motorGain = this.ctx.createGain(); this.motorGain.gain.value = 0;
    this.motorOsc = this.ctx.createOscillator(); this.motorOsc.type = 'sawtooth'; this.motorOsc.frequency.value = 55;
    this.motorOsc.connect(filt); filt.connect(this.motorGain); this.motorGain.connect(this.ctx.destination);
    this.motorOsc.start();

    // Sirene policial (wail)
    const sFilt = this.ctx.createBiquadFilter();
    sFilt.type = 'bandpass'; sFilt.frequency.value = 950; sFilt.Q.value = 1.6;
    this.sireneGain = this.ctx.createGain(); this.sireneGain.gain.value = 0;
    this.sireneOsc = this.ctx.createOscillator(); this.sireneOsc.type = 'triangle'; this.sireneOsc.frequency.value = 700;
    this.sireneOsc.connect(sFilt); sFilt.connect(this.sireneGain); this.sireneGain.connect(this.ctx.destination);
    this.sireneOsc.start();
  }
  atualizar(t, { dirigindo, velAbs, sireneAtiva }) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.mudo) {
      this.motorGain.gain.setTargetAtTime(0, now, 0.06);
      this.sireneGain.gain.setTargetAtTime(0, now, 0.06);
      return;
    }
    const gMotor = dirigindo ? (0.028 + Math.min(velAbs / 45, 1) * 0.045) : 0;
    this.motorGain.gain.setTargetAtTime(gMotor, now, 0.08);
    this.motorOsc.frequency.setTargetAtTime(48 + Math.min(velAbs, 60) * 3.1, now, 0.07);

    const gSir = sireneAtiva ? 0.042 : 0;
    this.sireneGain.gain.setTargetAtTime(gSir, now, 0.06);
    if (sireneAtiva) {
      const wail = 650 + 430 * (0.5 + 0.5 * Math.sin(t * 4.4));
      this.sireneOsc.frequency.setTargetAtTime(wail, now, 0.03);
    }
  }
  tocarBeep(freq = 660, dur = 0.14, ganho = 0.08) {
    if (!this.ctx || this.mudo) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(freq, now);
    o.frequency.exponentialRampToValueAtTime(freq * 1.35, now + dur);
    g.gain.setValueAtTime(ganho, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(now); o.stop(now + dur + 0.02);
  }
  tocarPorta() {
    if (!this.ctx || this.mudo) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(140, now);
    o.frequency.exponentialRampToValueAtTime(42, now + 0.11);
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(now); o.stop(now + 0.13);
  }
}

const QUALIDADES = {
  leve: {
    id: 'leve', rotulo: 'Leve',
    pixelRatio: 0.75,
    pbr: false, mostrarDecor: false,
    viaturaCompleta: false, personagemCompleto: false,
    sombras: false, sombraRaio: 36,
    sombraPrincipal: false, sombraDetalhe: false,
    viewDist: 120, camFar: 165, fogNear: 55, fogFar: 155,
    npcsMax: 0, npcDist: 40, trafegoMax: 8,
    rainN: 220, minimapInterval: 0.16,
  },
  medio: {
    id: 'medio', rotulo: 'Médio',
    pixelRatio: 1.0,
    pbr: false, mostrarDecor: true,
    viaturaCompleta: true, personagemCompleto: true,
    sombras: true, sombraRaio: 44,
    sombraPrincipal: true, sombraDetalhe: false,
    viewDist: 210, camFar: 270, fogNear: 110, fogFar: 255,
    npcsMax: 2, npcDist: 50, trafegoMax: 14,
    rainN: 500, minimapInterval: 0.083,
  },
  alto: {
    id: 'alto', rotulo: 'Alto',
    pixelRatio: 1.5,
    pbr: true, mostrarDecor: true,
    viaturaCompleta: true, personagemCompleto: true,
    sombras: true, sombraRaio: 65,
    sombraPrincipal: true, sombraDetalhe: true,
    viewDist: 420, camFar: 520, fogNear: 190, fogFar: 490,
    npcsMax: 8, npcDist: 95, trafegoMax: 20,
    rainN: 900, minimapInterval: 0.05,
  },
};
const ORDEM_QUAL = ['leve', 'medio', 'alto'];

// Personagem policial articulado ultra-leve (~144 triângulos, zero skinning de GPU) para o modo Leve
function criarPersonagemLeve() {
  const g = new THREE.Group();
  g.name = 'PolicialLeve';
  const mAzul = new THREE.MeshLambertMaterial({ color: 0x1e3a6e });
  const mCalca = new THREE.MeshLambertMaterial({ color: 0x111c33 });
  const mPele = new THREE.MeshLambertMaterial({ color: 0xe6b89c });
  const mPreto = new THREE.MeshLambertMaterial({ color: 0x151820 });
  const mOuro = new THREE.MeshLambertMaterial({ color: 0xfacc15 });

  const corpo = new THREE.Group();
  g.add(corpo);

  const tronco = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.58, 0.24), mAzul);
  tronco.position.y = 1.06;
  corpo.add(tronco);

  const cinto = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.26), mPreto);
  cinto.position.y = 0.78;
  corpo.add(cinto);

  const distintivo = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), mOuro);
  distintivo.position.set(0.11, 1.18, 0.13);
  corpo.add(distintivo);

  const cabeca = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), mPele);
  cabeca.position.y = 1.52;
  corpo.add(cabeca);

  const quepe = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.11, 0.31), mAzul);
  quepe.position.y = 1.69;
  corpo.add(quepe);
  const aba = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.03, 0.12), mPreto);
  aba.position.set(0, 1.64, 0.17);
  corpo.add(aba);

  const pernaE = new THREE.Group(); pernaE.position.set(-0.12, 0.75, 0);
  const mPE = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.74, 0.18), mCalca); mPE.position.y = -0.37; pernaE.add(mPE);
  const pernaD = new THREE.Group(); pernaD.position.set(0.12, 0.75, 0);
  const mPD = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.74, 0.18), mCalca); mPD.position.y = -0.37; pernaD.add(mPD);
  corpo.add(pernaE, pernaD);

  const bracoE = new THREE.Group(); bracoE.position.set(-0.31, 1.31, 0);
  const mBE = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.56, 0.15), mAzul); mBE.position.y = -0.28; bracoE.add(mBE);
  const bracoD = new THREE.Group(); bracoD.position.set(0.31, 1.31, 0);
  const mBD = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.56, 0.15), mAzul); mBD.position.y = -0.28; bracoD.add(mBD);
  corpo.add(bracoE, bracoD);

  let acao = 'Parado';
  let fase = 0;
  return {
    obj: g,
    tocar(nome) { acao = nome; },
    atualizar(dt) {
      if (acao === 'Correr' || acao === 'Andar') {
        const vel = acao === 'Correr' ? 12 : 7.5;
        const amp = acao === 'Correr' ? 0.75 : 0.45;
        fase += dt * vel;
        const s = Math.sin(fase) * amp;
        pernaE.rotation.x = s;
        pernaD.rotation.x = -s;
        bracoE.rotation.x = -s * 0.8;
        bracoD.rotation.x = s * 0.8;
        corpo.position.y = Math.abs(Math.cos(fase)) * (acao === 'Correr' ? 0.06 : 0.03);
      } else if (acao === 'Pular') {
        pernaE.rotation.x = 0.35;
        pernaD.rotation.x = -0.35;
        bracoE.rotation.x = -0.8;
        bracoD.rotation.x = -0.8;
        corpo.position.y = 0;
      } else {
        pernaE.rotation.x *= 0.8;
        pernaD.rotation.x *= 0.8;
        bracoE.rotation.x *= 0.8;
        bracoD.rotation.x *= 0.8;
        corpo.position.y = 0;
      }
    },
  };
}

// Converte materiais PBR de um GLB Kenney para Lambert leve (mantendo a textura)
function converterParaLambert(root) {
  root.traverse(m => {
    if (!m.isMesh || !m.material || Array.isArray(m.material)) return;
    const mat = m.material;
    if (mat.isMeshStandardMaterial) {
      m.userData.matPbr = mat;
      m.userData.matLeve = new THREE.MeshLambertMaterial({
        color: mat.color ? mat.color.clone() : 0xffffff,
        map: mat.map || null,
        transparent: mat.transparent,
        opacity: mat.opacity,
      });
    }
  });
}

// Viatura policial ultra-leve (~1.3k triângulos e 5 draw calls vs 166k triângulos / 206 draw calls da P71)
async function criarViaturaLeve(glbLoader) {
  const G = new THREE.Group();
  G.name = 'viaturaLeve';
  const gltf = await glbLoader.loadAsync(`${BASE_BIB}/veiculos/police.glb`);
  const carro = gltf.scene;
  carro.scale.setScalar(ESCALA_VEICULO);
  converterParaLambert(carro);
  carro.traverse(m => {
    if (m.isMesh) {
      if (m.userData.matLeve) m.material = m.userData.matLeve;
      m.castShadow = false;
      m.receiveShadow = true;
    }
  });
  G.add(carro);

  // Giroflex leve no teto (2 malhas leves, sem PointLight/SpotLight)
  const matV = new THREE.MeshBasicMaterial({ color: 0x881111 });
  const matA = new THREE.MeshBasicMaterial({ color: 0x113388 });
  const barraV = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.14, 0.24), matV);
  barraV.position.set(-0.23, 1.80, -0.08);
  const barraA = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.14, 0.24), matA);
  barraA.position.set(0.23, 1.80, -0.08);
  G.add(barraV, barraA);

  // Sombra de contato leve sob o carro
  const sombra = new THREE.Mesh(
    new THREE.PlaneGeometry(2.3, 4.7),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.30, depthWrite: false })
  );
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.y = 0.02;
  G.add(sombra);

  // Farol leve com gradiente suave no chão à noite (custo zero de iluminação dinâmica)
  const fc = document.createElement('canvas'); fc.width = 64; fc.height = 128;
  const fg = fc.getContext('2d');
  const gr = fg.createLinearGradient(0, 128, 0, 0);
  gr.addColorStop(0, 'rgba(255,244,205,0.75)');
  gr.addColorStop(0.55, 'rgba(255,240,190,0.28)');
  gr.addColorStop(1, 'rgba(255,240,190,0)');
  fg.fillStyle = gr;
  fg.beginPath(); fg.moveTo(22, 128); fg.lineTo(42, 128); fg.lineTo(64, 0); fg.lineTo(0, 0); fg.closePath(); fg.fill();
  const fTex = new THREE.CanvasTexture(fc);
  fTex.colorSpace = THREE.SRGBColorSpace;
  const fachoMat = new THREE.MeshBasicMaterial({ map: fTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const facho = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 14), fachoMat);
  facho.rotation.x = -Math.PI / 2;
  facho.position.set(0, 0.04, 8.8);
  G.add(facho);

  return {
    grupo: G,
    luzes(t, modo) {
      if (modo === 'ligado') {
        const p = Math.floor(t * 7) % 2 === 0;
        matV.color.setHex(p ? 0xff2222 : 0x551111);
        matA.color.setHex(p ? 0x112255 : 0x2288ff);
      } else {
        matV.color.setHex(0x881111);
        matA.color.setHex(0x113388);
      }
    },
    farois(on) { fachoMat.opacity = on ? 0.55 : 0; },
    freio() {},
    re() {},
    seta() {},
    rodar() {},
    esterco() {},
  };
}

// ====================================================================================================
// Inicialização principal do jogo
// ====================================================================================================
export async function iniciarJogo() {
  const $ = id => document.getElementById(id);
  const elTelaCarga = $('tela-carga');
  const elBarra = $('barra-carga');
  const elTextoCarga = $('texto-carga');
  const elPrompt = $('prompt-acao');
  const elVel = $('velocimetro');
  const elVelNum = $('vel-num');
  const elMarcha = $('vel-marcha');
  const elVeiculoNome = $('vel-nome');
  const elModoPe = $('hud-pe');
  const elPersNome = $('pers-nome');
  const elToast = $('toast');
  const elScore = $('hud-score');
  const elMaxVel = $('hud-maxvel');
  const elFps = $('hud-fps');
  const elAlvoNome = $('hud-alvo');
  const elMinimap = $('minimap');
  const mmCtx = elMinimap.getContext('2d');

  const som = new SomJogo();
  const desbloquearSom = () => som.desbloquear();
  addEventListener('pointerdown', desbloquearSom, { passive: true });
  addEventListener('keydown', desbloquearSom, { passive: true });

  let toastTimer = null;
  function mostrarToast(msg) {
    elToast.textContent = msg;
    elToast.classList.add('visivel');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => elToast.classList.remove('visivel'), 2600);
  }

  // ---- Renderer, Qualidade e Cena (padrão = Leve para rodar liso em qualquer PC!)
  const Q = new URLSearchParams(location.search);
  let ehNoite = Q.has('noite');
  let ehChuva = Q.has('chuva');

  const qParam = (Q.get('qualidade') || '').toLowerCase();
  let qSalva = '';
  try { qSalva = localStorage.getItem('hryz_qualidade_v2') || ''; } catch (_) {}
  let qualAtual = QUALIDADES[qParam] || QUALIDADES[qSalva] || QUALIDADES.leve;

  const renderer = new THREE.WebGLRenderer({
    antialias: qualAtual.id !== 'leve',
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, qualAtual.pixelRatio));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = qualAtual.pbr ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
  renderer.toneMappingExposure = ehNoite ? 1.15 : 1.04;
  document.body.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.25, qualAtual.camFar);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x8fa3b5, 1.45);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.2);
  sun.castShadow = qualAtual.sombras;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.05;
  const SR = qualAtual.sombraRaio;
  Object.assign(sun.shadow.camera, { left: -SR, right: SR, top: SR, bottom: -SR, near: 1, far: 240 });
  scene.add(sun, sun.target);

  let envDia = null;
  let envNoite = null;
  function obterAmbiente(noite) {
    if (noite) {
      if (!envNoite) {
        envNoite = criarAmbiente(renderer, {
          sol: [0.45, 0.55, -0.55], zenite: [0.03, 0.06, 0.14], horizonte: [0.08, 0.13, 0.24], chao: [0.04, 0.05, 0.08],
          paineis: [
            { pos: [12, 8, 6], w: 12, h: 2, cor: [1.0, 0.86, 0.55], k: 2.2 },
            { pos: [-12, 8, -6], w: 12, h: 2, cor: [0.4, 0.65, 1.0], k: 1.8 },
          ],
        });
      }
      return envNoite;
    }
    if (!envDia) {
      envDia = criarAmbiente(renderer, {
        sol: [-0.55, 0.72, 0.45], zenite: [0.22, 0.48, 0.88], horizonte: [0.76, 0.89, 0.96], chao: [0.28, 0.34, 0.26],
      });
    }
    return envDia;
  }

  function atualizarProgresso(frac, texto) {
    elBarra.style.width = `${Math.round(Math.min(1, frac) * 100)}%`;
    elTextoCarga.textContent = texto;
  }

  // ---- Construir Cidade Hryz (ultra-leve: Lambert + malhas mescladas + culling por setor)
  atualizarProgresso(0.05, 'Carregando Cidade Hryz…');
  const cidade = await construirCidade({
    scene,
    noiteInicial: ehNoite,
    qualidadeInicial: qualAtual,
    onProgresso: (f, txt) => atualizarProgresso(0.05 + f * 0.72, txt),
  });

  function aplicarClima() {
    const fundo = ehNoite ? 0x091124 : (ehChuva ? 0x7c92a6 : 0xb8dff5);
    scene.background = new THREE.Color(fundo);
    const fNear = ehChuva ? Math.min(qualAtual.fogNear, 65) : qualAtual.fogNear;
    const fFar = ehChuva ? Math.min(qualAtual.fogFar, 220) : qualAtual.fogFar;
    scene.fog = new THREE.Fog(fundo, fNear, fFar);
    // Só gera/usa cubemap PMREM quando PBR ou a P71 detalhada está ativa (0 custo no modo Leve!)
    scene.environment = (qualAtual.pbr || qualAtual.viaturaCompleta) ? obterAmbiente(ehNoite) : null;
    renderer.toneMapping = qualAtual.pbr ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    renderer.toneMappingExposure = ehNoite ? 1.18 : (ehChuva ? 0.98 : 1.05);

    hemi.color.setHex(ehNoite ? 0x5c77b8 : (ehChuva ? 0x9fb2c4 : 0xffffff));
    hemi.groundColor.setHex(ehNoite ? 0x182136 : 0x7e94a8);
    hemi.intensity = ehNoite ? 1.05 : (ehChuva ? 1.15 : (qualAtual.pbr ? 1.45 : 1.15));
    sun.color.setHex(ehNoite ? 0x9db4ea : 0xfff4e0);
    sun.intensity = ehNoite ? 0.85 : (ehChuva ? 1.2 : (qualAtual.pbr ? 2.6 : 1.85));

    cidade.alternarNoite(ehNoite);
    cidade.alternarChuva(ehChuva);

    for (const v of veiculos) {
      if (v.api?.farois) v.api.farois(v.farois || ehNoite);
    }
    $('btn-noite').classList.toggle('ativo', ehNoite);
    $('btn-chuva').classList.toggle('ativo', ehChuva);
  }

  // ---- Partículas de chuva 3D ao redor do jogador
  const RAIN_N = 900;
  const rainGeo = new THREE.BufferGeometry();
  const rainPos = new Float32Array(RAIN_N * 6);
  const rainSeeds = [];
  for (let i = 0; i < RAIN_N; i++) {
    rainSeeds.push({
      dx: (Math.random() - 0.5) * 65,
      y: Math.random() * 28,
      dz: (Math.random() - 0.5) * 65,
      vel: 22 + Math.random() * 10,
    });
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  rainGeo.setDrawRange(0, qualAtual.rainN * 2);
  const rainLines = new THREE.LineSegments(
    rainGeo,
    new THREE.LineBasicMaterial({ color: 0xcbe4ff, transparent: true, opacity: 0.42 })
  );
  rainLines.frustumCulled = false;
  rainLines.visible = ehChuva;
  scene.add(rainLines);

  // ---- Veículos dirigíveis (Viatura Leve no modo Leve, P71 completa sob demanda em Médio/Alto)
  atualizarProgresso(0.80, 'Preparando viatura policial…');
  const veiculos = [];
  const glbLoader = new GLTFLoader();

  let viaturaLeveApi = null;
  let viaturaP71Api = null;

  async function garantirViaturaPolicia(completa) {
    if (completa) {
      if (!viaturaP71Api) {
        viaturaP71Api = criarViatura({
          livery: 'preto-branco',
          numero: '117',
          cidade: 'HRYZ CITY',
          placa: 'HRYZ 911',
          pushbar: true,
          sujeira: 0.25,
        });
        viaturaP71Api.grupo.visible = false;
        scene.add(viaturaP71Api.grupo);
      }
      return viaturaP71Api;
    }
    if (!viaturaLeveApi) {
      viaturaLeveApi = await criarViaturaLeve(glbLoader);
      viaturaLeveApi.grupo.visible = false;
      scene.add(viaturaLeveApi.grupo);
    }
    return viaturaLeveApi;
  }

  const vPolIni = await garantirViaturaPolicia(qualAtual.viaturaCompleta);
  vPolIni.grupo.position.set(146, 0, 166.2);
  vPolIni.grupo.rotation.y = Math.PI / 2;
  vPolIni.grupo.visible = true;

  const veiculoPolicia = {
    id: 'p71',
    nome: qualAtual.viaturaCompleta ? 'Viatura Crown Victoria P71' : 'Viatura Policial Hryz',
    obj: vPolIni.grupo,
    api: vPolIni,
    x: 146, z: 166.2, ry: Math.PI / 2,
    vel: 0, steer: 0, dist: 0,
    acel: 22, velMax: 48, velRe: 14, freio: 34, raio: 2.35,
    sirene: false, farois: false, ehPolicia: true,
    camDist: 7.4, camAlt: 2.7, capoY: 1.42, capoZ: 0.55,
  };
  veiculos.push(veiculoPolicia);

  function sincronizarViaturaPolicia(completa) {
    garantirViaturaPolicia(completa).then(novaApi => {
      if (veiculoPolicia.api === novaApi) return;
      veiculoPolicia.obj.visible = false;
      novaApi.grupo.position.set(veiculoPolicia.x, 0, veiculoPolicia.z);
      novaApi.grupo.rotation.set(0, veiculoPolicia.ry, 0, 'YXZ');
      novaApi.grupo.visible = true;
      veiculoPolicia.obj = novaApi.grupo;
      veiculoPolicia.api = novaApi;
      veiculoPolicia.nome = completa ? 'Viatura Crown Victoria P71' : 'Viatura Policial Hryz';
      if (novaApi.farois) novaApi.farois(veiculoPolicia.farois || ehNoite);
      if (jogador.veiculo === veiculoPolicia) elVeiculoNome.textContent = veiculoPolicia.nome;
    });
  }

  // 2. Frota extra dirigível (Kenney)
  atualizarProgresso(0.88, 'Estacionando frota dirigível…');
  const frotaExtra = [
    { nome: 'Esportivo Hryz',  arq: 'sedan-sports', x: 196, z: 166.2, ry: Math.PI / 2,  acel: 27, velMax: 55, raio: 1.9 },
    { nome: 'Táxi da Praça',   arq: 'taxi',         x: 218, z: 169.8, ry: -Math.PI / 2, acel: 19, velMax: 40, raio: 1.9 },
    { nome: 'Fórmula Hryz',    arq: 'race',         x: 242, z: 222,   ry: Math.PI,      acel: 34, velMax: 68, raio: 1.85 },
    { nome: 'Fórmula Pista',   arq: 'race-future',  x: 132, z: 567,   ry: Math.PI / 2,  acel: 36, velMax: 72, raio: 1.85 },
    { nome: 'SUV de Luxo',     arq: 'suv-luxury',   x: 256, z: 313.8, ry: -Math.PI / 2, acel: 20, velMax: 44, raio: 2.0 },
    { nome: 'Bombeiros',       arq: 'firetruck',    x: 130, z: 98,    ry: Math.PI / 2,  acel: 15, velMax: 34, raio: 2.3 },
    { nome: 'Ambulância',      arq: 'ambulance',    x: 148, z: 98,    ry: Math.PI / 2,  acel: 18, velMax: 40, raio: 2.1 },
  ];
  await Promise.all(frotaExtra.map(async f => {
    try {
      const g = await glbLoader.loadAsync(`${BASE_BIB}/veiculos/${f.arq}.glb`);
      const o = g.scene;
      o.scale.setScalar(ESCALA_VEICULO);
      converterParaLambert(o);
      o.traverse(m => {
        if (m.isMesh) {
          if (!qualAtual.pbr && m.userData.matLeve) m.material = m.userData.matLeve;
          m.castShadow = qualAtual.sombraPrincipal;
          m.receiveShadow = true;
        }
      });
      o.position.set(f.x, 0, f.z);
      o.rotation.y = f.ry;
      scene.add(o);
      veiculos.push({
        id: f.arq, nome: f.nome, obj: o, api: null,
        x: f.x, z: f.z, ry: f.ry,
        vel: 0, steer: 0, dist: 0,
        acel: f.acel, velMax: f.velMax, velRe: 13, freio: 32, raio: f.raio,
        sirene: false, farois: false, ehPolicia: false,
        camDist: 6.4, camAlt: 2.5, capoY: 1.55, capoZ: 0.4,
      });
    } catch (e) { console.warn('carro skip', f.arq, e); }
  }));

  // ---- Personagem Jogável (ultra-leve no modo Leve; elenco GLB completo em Médio/Alto ou ao trocar com C)
  atualizarProgresso(0.94, 'Preparando personagem jogável…');
  const cachePers = new Map();
  let persIdx = 0;
  let persAtual = null;
  let persAcao = 'Parado';
  let usandoPersLeve = false;

  const persLeveInst = criarPersonagemLeve();
  persLeveInst.obj.visible = false;
  scene.add(persLeveInst.obj);

  const jogador = {
    x: 147.2, y: CALCADA, z: 163.8,
    vy: 0, ry: -0.45,
    noChao: true,
    veiculo: null,
  };

  function ativarPersonagemLeve() {
    if (persAtual) persAtual.inst.obj.visible = false;
    usandoPersLeve = true;
    persAtual = { inst: persLeveInst, def: { id: 'policial-leve', nome: 'Policial (Leve)' } };
    persAtual.inst.obj.position.set(jogador.x, jogador.y, jogador.z);
    persAtual.inst.obj.rotation.y = jogador.ry;
    persAtual.inst.obj.visible = !jogador.veiculo;
    persAcao = '';
    tocarAcao('Parado');
    elPersNome.textContent = 'Policial';
  }

  async function carregarPersonagem(idx) {
    usandoPersLeve = false;
    const def = PERSONAGENS_DEF[idx % PERSONAGENS_DEF.length];
    if (!cachePers.has(def.id)) {
      let inst;
      if (def.tipo === 'elenco') {
        inst = await Personagem.carregar(def.url);
        inst.piscarAuto(true);
      } else {
        inst = await Corredor.carregar(def.url);
        if (def.tipo === 'silhueta') inst.silhueta();
      }
      inst.obj.traverse(m => { if (m.isMesh) { m.castShadow = qualAtual.sombraDetalhe; m.receiveShadow = true; } });
      inst.obj.visible = false;
      scene.add(inst.obj);
      cachePers.set(def.id, { inst, def });
    }
    if (persAtual) persAtual.inst.obj.visible = false;
    persIdx = idx % PERSONAGENS_DEF.length;
    persAtual = cachePers.get(def.id);
    persAtual.inst.obj.position.set(jogador.x, jogador.y, jogador.z);
    persAtual.inst.obj.rotation.y = jogador.ry;
    persAtual.inst.obj.visible = !jogador.veiculo;
    persAcao = '';
    tocarAcao('Parado');
    elPersNome.textContent = def.nome;
  }

  function tocarAcao(nome, fade = 0.18) {
    if (!persAtual || persAcao === nome) return;
    try {
      persAtual.inst.tocar(nome, { fade, loop: nome !== 'Pular' });
      persAcao = nome;
    } catch (_) {
      if (nome !== 'Parado') tocarAcao('Parado', fade);
    }
  }

  if (qualAtual.personagemCompleto) await carregarPersonagem(0);
  else ativarPersonagemLeve();

  // ---- Checkpoint Tour (anéis dourados nos marcos da cidade)
  let cpIdx = 0;
  let score = 0;
  let maxVelKmh = 0;
  const cpGrupo = new THREE.Group();
  const cpAnel = new THREE.Mesh(
    new THREE.TorusGeometry(3.4, 0.22, 16, 48),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.9 })
  );
  cpAnel.rotation.x = Math.PI / 2;
  cpAnel.position.y = 0.35;
  const cpFeixe = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 3.2, 22, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
  );
  cpFeixe.position.y = 11;
  cpGrupo.add(cpAnel, cpFeixe);
  scene.add(cpGrupo);

  function posicionarCheckpoint() {
    const cp = CHECKPOINTS[cpIdx];
    cpGrupo.position.set(cp.x, 0, cp.z);
    elAlvoNome.textContent = cp.nome;
  }
  posicionarCheckpoint();

  // ---- Colisão círculo vs AABB com deslizamento suave
  function resolverColisoes(x, z, raio) {
    let nx = Math.max(-90, Math.min(640, x));
    let nz = Math.max(-220, Math.min(680, z));
    let bateu = false;
    for (const b of cidade.colisores) {
      const cx = Math.max(b.minX, Math.min(nx, b.maxX));
      const cz = Math.max(b.minZ, Math.min(nz, b.maxZ));
      const dx = nx - cx, dz = nz - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 < raio * raio) {
        bateu = true;
        if (d2 > 1e-6) {
          const d = Math.sqrt(d2);
          nx = cx + (dx / d) * raio;
          nz = cz + (dz / d) * raio;
        } else {
          const dL = nx - b.minX, dR = b.maxX - nx, dT = nz - b.minZ, dB = b.maxZ - nz;
          const m = Math.min(dL, dR, dT, dB);
          if (m === dL) nx = b.minX - raio;
          else if (m === dR) nx = b.maxX + raio;
          else if (m === dT) nz = b.minZ - raio;
          else nz = b.maxZ + raio;
        }
      }
    }
    return { x: nx, z: nz, bateu };
  }

  // ---- Entradas (Teclado + Mouse + Touch)
  const teclas = new Set();
  const touch = { mx: 0, mz: 0, acelerar: false, freiar: false, pular: false };

  let camModo = 0; // 0 = 3ª pessoa, 1 = capô/1ª pessoa, 2 = aérea
  let camYaw = -0.35;
  let camPitch = 0.22;
  let camDist = 5.6;
  let snapCam = true;
  let arrastando = false;
  let ultimoX = 0, ultimoY = 0;
  let tempoSemMouse = 10;

  function acharVeiculoPerto() {
    let melhor = null, bestD = 5.4;
    for (const v of veiculos) {
      const d = Math.hypot(v.x - jogador.x, v.z - jogador.z);
      if (d < bestD) { bestD = d; melhor = v; }
    }
    return melhor;
  }

  function entrarOuSairVeiculo() {
    som.desbloquear();
    if (jogador.veiculo) {
      const v = jogador.veiculo;
      // Sai pela porta esquerda do carro
      const lx = Math.cos(v.ry) * (v.raio + 1.15);
      const lz = -Math.sin(v.ry) * (v.raio + 1.15);
      const res = resolverColisoes(v.x + lx, v.z + lz, 0.45);
      jogador.x = res.x; jogador.z = res.z; jogador.y = CALCADA; jogador.vy = 0; jogador.noChao = true;
      jogador.ry = v.ry;
      jogador.veiculo = null;
      if (v.api?.freio) v.api.freio(false);
      if (v.api?.re) v.api.re(false);
      persAtual.inst.obj.visible = true;
      persAtual.inst.obj.position.set(jogador.x, jogador.y, jogador.z);
      tocarAcao('Parado');
      som.tocarPorta();
      mostrarToast(`Saiu de: ${v.nome}`);
    } else {
      const perto = acharVeiculoPerto();
      if (!perto) return;
      jogador.veiculo = perto;
      persAtual.inst.obj.visible = false;
      camYaw = perto.ry;
      som.tocarPorta();
      mostrarToast(`Dirigindo: ${perto.nome}${perto.ehPolicia ? ' (L = Sirene)' : ''}`);
    }
    atualizarHudModo();
  }

  function atualizarHudModo() {
    const dir = !!jogador.veiculo;
    elVel.classList.toggle('oculto', !dir);
    elModoPe.classList.toggle('oculto', dir);
    if (dir) {
      elVeiculoNome.textContent = jogador.veiculo.nome;
      $('btn-sirene').classList.toggle('oculto', !jogador.veiculo.ehPolicia);
      $('btn-sirene').classList.toggle('ativo', !!jogador.veiculo.sirene);
    } else {
      $('btn-sirene').classList.add('oculto');
    }
  }

  function teleportar(pt) {
    if (jogador.veiculo) {
      const v = jogador.veiculo;
      v.x = pt.x; v.z = pt.z; v.ry = pt.ang; v.vel = 0; v.steer = 0;
      v.obj.position.set(v.x, 0, v.z);
      v.obj.rotation.set(0, v.ry, 0);
    } else {
      jogador.x = pt.x; jogador.z = pt.z; jogador.y = CALCADA; jogador.vy = 0; jogador.ry = pt.ang;
    }
    camYaw = pt.ang;
    snapCam = true;
    mostrarToast(`Teleportado para: ${pt.nome}`);
  }

  function aplicarQualidade(id, avisar = false) {
    const q = QUALIDADES[id] || QUALIDADES.leve;
    qualAtual = q;
    try { localStorage.setItem('hryz_qualidade_v2', q.id); } catch (_) {}

    renderer.setPixelRatio(Math.min(devicePixelRatio, q.pixelRatio));
    renderer.setSize(innerWidth, innerHeight);
    camera.far = q.camFar;
    camera.updateProjectionMatrix();

    sun.castShadow = q.sombras;
    const sr = q.sombraRaio;
    sun.shadow.camera.left = -sr;
    sun.shadow.camera.right = sr;
    sun.shadow.camera.top = sr;
    sun.shadow.camera.bottom = -sr;
    sun.shadow.camera.updateProjectionMatrix();

    sincronizarViaturaPolicia(q.viaturaCompleta);
    if (q.personagemCompleto && usandoPersLeve) carregarPersonagem(persIdx);
    else if (!q.personagemCompleto && !usandoPersLeve) ativarPersonagemLeve();

    for (const v of veiculos) {
      if (!v.ehPolicia) {
        v.obj.traverse(m => {
          if (m.isMesh) {
            m.castShadow = q.sombraPrincipal;
            if (m.userData.matPbr && m.userData.matLeve) {
              m.material = q.pbr ? m.userData.matPbr : m.userData.matLeve;
            }
          }
        });
      }
    }
    for (const entry of cachePers.values()) {
      entry.inst.obj.traverse(m => { if (m.isMesh) m.castShadow = q.sombraDetalhe; });
    }

    rainGeo.setDrawRange(0, Math.min(RAIN_N, q.rainN) * 2);
    cidade.aplicarQualidade(q);
    aplicarClima();

    const btnQ = $('btn-qualidade');
    if (btnQ) btnQ.textContent = `⚡ ${q.rotulo}`;
    if (avisar) mostrarToast(`Qualidade: ${q.rotulo}${q.id === 'leve' ? ' (Máximo FPS)' : ''}`);
  }

  function ciclarQualidade() {
    const i = ORDEM_QUAL.indexOf(qualAtual.id);
    aplicarQualidade(ORDEM_QUAL[(i + 1) % ORDEM_QUAL.length], true);
  }

  addEventListener('keydown', e => {
    const code = e.code;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) e.preventDefault();
    if (!teclas.has(code)) {
      if (code === 'KeyE') entrarOuSairVeiculo();
      else if (code === 'KeyQ') ciclarQualidade();
      else if (code === 'KeyN') { ehNoite = !ehNoite; aplicarClima(); mostrarToast(ehNoite ? 'Modo Noite ativado' : 'Modo Dia ativado'); }
      else if (code === 'KeyR') { ehChuva = !ehChuva; rainLines.visible = ehChuva; aplicarClima(); mostrarToast(ehChuva ? 'Chuva e pista molhada' : 'Tempo limpo'); }
      else if (code === 'KeyV') { camModo = (camModo + 1) % 3; mostrarToast(['Câmera: 3ª Pessoa', 'Câmera: Capô / 1ª Pessoa', 'Câmera: Aérea (Drone)'][camModo]); }
      else if (code === 'KeyC') { carregarPersonagem(persIdx + 1).then(() => mostrarToast(`Personagem: ${PERSONAGENS_DEF[persIdx].nome}`)); }
      else if (code === 'KeyL' && jogador.veiculo?.ehPolicia) {
        jogador.veiculo.sirene = !jogador.veiculo.sirene;
        $('btn-sirene').classList.toggle('ativo', jogador.veiculo.sirene);
        mostrarToast(jogador.veiculo.sirene ? 'Sirene e Giroflex LIGADOS' : 'Sirene desligada');
      }
      else if (code === 'KeyF' && jogador.veiculo?.api?.farois) {
        jogador.veiculo.farois = !jogador.veiculo.farois;
        jogador.veiculo.api.farois(jogador.veiculo.farois || ehNoite);
        mostrarToast(jogador.veiculo.farois ? 'Faróis acesos' : 'Faróis no automático');
      }
      else if (code === 'KeyM') {
        som.mudo = !som.mudo;
        $('btn-som').textContent = som.mudo ? '🔇' : '🔊';
        mostrarToast(som.mudo ? 'Som silenciado' : 'Som ligado');
      }
      else if (code === 'KeyH') $('modal-ajuda').classList.toggle('oculto');
    }
    teclas.add(code);
  });
  addEventListener('keyup', e => teclas.delete(e.code));

  renderer.domElement.addEventListener('pointerdown', e => {
    if (e.target !== renderer.domElement) return;
    arrastando = true; ultimoX = e.clientX; ultimoY = e.clientY;
  });
  addEventListener('pointermove', e => {
    if (!arrastando) return;
    const dx = e.clientX - ultimoX, dy = e.clientY - ultimoY;
    ultimoX = e.clientX; ultimoY = e.clientY;
    camYaw -= dx * 0.0055;
    camPitch = Math.max(0.06, Math.min(1.15, camPitch + dy * 0.0045));
    tempoSemMouse = 0;
  });
  addEventListener('pointerup', () => { arrastando = false; });
  renderer.domElement.addEventListener('wheel', e => {
    camDist = Math.max(3.5, Math.min(18, camDist + e.deltaY * 0.006));
  }, { passive: true });

  // Botões da HUD
  $('btn-qualidade').onclick = ciclarQualidade;
  $('btn-noite').onclick = () => { ehNoite = !ehNoite; aplicarClima(); };
  $('btn-chuva').onclick = () => { ehChuva = !ehChuva; rainLines.visible = ehChuva; aplicarClima(); };
  $('btn-cam').onclick = () => { camModo = (camModo + 1) % 3; mostrarToast(['Câmera: 3ª Pessoa', 'Câmera: Capô / 1ª Pessoa', 'Câmera: Aérea'][camModo]); };
  $('btn-pers').onclick = () => carregarPersonagem(persIdx + 1).then(() => mostrarToast(`Personagem: ${PERSONAGENS_DEF[persIdx].nome}`));
  $('btn-sirene').onclick = () => {
    if (!jogador.veiculo?.ehPolicia) return;
    jogador.veiculo.sirene = !jogador.veiculo.sirene;
    $('btn-sirene').classList.toggle('ativo', jogador.veiculo.sirene);
  };
  $('btn-som').onclick = () => { som.mudo = !som.mudo; $('btn-som').textContent = som.mudo ? '🔇' : '🔊'; };
  $('btn-ajuda').onclick = () => $('modal-ajuda').classList.toggle('oculto');
  $('fechar-ajuda').onclick = () => $('modal-ajuda').classList.add('oculto');

  const selTp = $('select-teleporte');
  for (const pt of PONTOS_TELEPORTE) {
    const opt = document.createElement('option');
    opt.value = pt.id; opt.textContent = `📍 ${pt.nome}`;
    selTp.appendChild(opt);
  }
  selTp.onchange = () => {
    const pt = PONTOS_TELEPORTE.find(p => p.id === selTp.value);
    if (pt) teleportar(pt);
    selTp.blur();
  };

  // Controles touch (celulares/tablets)
  const joyBase = $('joy-base'), joyKnob = $('joy-knob');
  let joyId = null, joyCx = 0, joyCy = 0;
  joyBase.addEventListener('pointerdown', e => {
    joyId = e.pointerId; joyBase.setPointerCapture(joyId);
    const r = joyBase.getBoundingClientRect();
    joyCx = r.left + r.width / 2; joyCy = r.top + r.height / 2;
  });
  joyBase.addEventListener('pointermove', e => {
    if (e.pointerId !== joyId) return;
    const maxR = 42;
    const dx = e.clientX - joyCx, dy = e.clientY - joyCy;
    const d = Math.hypot(dx, dy);
    const nx = d > maxR ? (dx / d) * maxR : dx;
    const ny = d > maxR ? (dy / d) * maxR : dy;
    joyKnob.style.transform = `translate(${nx}px, ${ny}px)`;
    touch.mx = nx / maxR; touch.mz = ny / maxR;
  });
  const resetJoy = () => { joyId = null; joyKnob.style.transform = 'translate(0,0)'; touch.mx = 0; touch.mz = 0; };
  joyBase.addEventListener('pointerup', resetJoy);
  joyBase.addEventListener('pointercancel', resetJoy);

  $('touch-entrar').onclick = entrarOuSairVeiculo;
  $('touch-pular').addEventListener('pointerdown', () => { touch.pular = true; });
  $('touch-pular').addEventListener('pointerup', () => { touch.pular = false; });

  // ---- Minimapa (Canvas 2D)
  function desenharMinimapa(px, pz, pyaw) {
    const W = elMinimap.width, H = elMinimap.height;
    mmCtx.clearRect(0, 0, W, H);
    mmCtx.fillStyle = ehNoite ? '#0f172a' : '#1e293b';
    mmCtx.fillRect(0, 0, W, H);

    // Mapeia área da cidade (-30..560 em X, -30..610 em Z) no canvas
    const esc = 0.25;
    const toMM = (wx, wz) => [W / 2 + (wx - px) * esc, H / 2 + (wz - pz) * esc];

    // Rodovia
    mmCtx.fillStyle = '#475569';
    const [rx0, rz0] = toMM(12 - 16, -260);
    mmCtx.fillRect(rx0, rz0, 32 * esc, 1020 * esc);

    // Grade de ruas
    mmCtx.fillStyle = '#64748b';
    for (const gx of cidade.mapaInfo.VX) {
      const [sx, sz] = toMM(gx * TILE - 4, 2 * TILE);
      mmCtx.fillRect(sx, sz, 8 * esc, 30 * TILE * esc);
    }
    for (const gz of cidade.mapaInfo.HZ) {
      const [sx, sz] = toMM(3 * TILE, gz * TILE - 4);
      mmCtx.fillRect(sx, sz, 30 * TILE * esc, 8 * esc);
    }

    // Pista do aeroporto
    mmCtx.fillStyle = '#94a3b8';
    const [ax, az] = toMM(60, 567 - 16);
    mmCtx.fillRect(ax, az, 480 * esc, 32 * esc);

    // Estádio
    mmCtx.fillStyle = '#22c55e';
    const [ex, ez] = toMM(40.5 * TILE - 48, 7 * TILE - 36);
    mmCtx.fillRect(ex, ez, 96 * esc, 72 * esc);

    // Veículos dirigíveis
    for (const v of veiculos) {
      const [vx, vz] = toMM(v.x, v.z);
      mmCtx.fillStyle = v.ehPolicia ? '#38bdf8' : '#f59e0b';
      mmCtx.beginPath();
      mmCtx.arc(vx, vz, v.ehPolicia ? 4 : 2.8, 0, Math.PI * 2);
      mmCtx.fill();
    }

    // Checkpoint ativo (pulsante)
    const cp = CHECKPOINTS[cpIdx];
    const [cpx, cpz] = toMM(cp.x, cp.z);
    const clampedX = Math.max(8, Math.min(W - 8, cpx));
    const clampedZ = Math.max(8, Math.min(H - 8, cpz));
    mmCtx.fillStyle = '#facc15';
    mmCtx.beginPath();
    mmCtx.arc(clampedX, clampedZ, 5, 0, Math.PI * 2);
    mmCtx.fill();

    // Seta do jogador no centro
    mmCtx.save();
    mmCtx.translate(W / 2, H / 2);
    mmCtx.rotate(-pyaw + Math.PI);
    mmCtx.fillStyle = '#ffffff';
    mmCtx.beginPath();
    mmCtx.moveTo(0, -7);
    mmCtx.lineTo(5, 6);
    mmCtx.lineTo(0, 3);
    mmCtx.lineTo(-5, 6);
    mmCtx.closePath();
    mmCtx.fill();
    mmCtx.restore();
  }

  // ---- Aplicar qualidade + clima inicial & esconder tela de carga
  aplicarQualidade(qualAtual.id, false);
  atualizarHudModo();
  atualizarProgresso(1, 'Cidade pronta!');
  setTimeout(() => elTelaCarga.classList.add('oculto'), 220);

  // ---- Loop principal (60 FPS)
  const relogio = new THREE.Clock();
  const alvoCam = new THREE.Vector3();
  const posCamDesejada = new THREE.Vector3();
  let tTotal = 0;
  let minimapTimer = 1;
  let fpsQuadros = 0;
  let fpsAcum = 0;
  let fpsAtual = 60;

  function anguloDiff(a, b) {
    let d = (b - a + Math.PI) % (Math.PI * 2) - Math.PI;
    return d < -Math.PI ? d + Math.PI * 2 : d;
  }

  addEventListener('resize', () => {
    renderer.setPixelRatio(Math.min(devicePixelRatio, qualAtual.pixelRatio));
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });

  let pausado = Q.has('pausa');
  function passo(dtFixo = null) {
    const dt = dtFixo ?? Math.min(relogio.getDelta(), 0.05);
    tTotal += dt;
    tempoSemMouse += dt;

    // Medidor de FPS (atualizado a cada 0,5 s)
    fpsQuadros++;
    fpsAcum += dt;
    if (fpsAcum >= 0.5) {
      fpsAtual = Math.round(fpsQuadros / fpsAcum);
      if (elFps) {
        elFps.textContent = `${fpsAtual} FPS`;
        elFps.style.color = fpsAtual >= 45 ? '#4ade80' : (fpsAtual >= 25 ? '#facc15' : '#f87171');
      }
      fpsQuadros = 0;
      fpsAcum = 0;
    }

    // Atualiza luzes da viatura P71 (mesmo quando você está a pé!)
    for (const v of veiculos) {
      if (v.api?.luzes) v.api.luzes(tTotal, v.sirene ? 'ligado' : 'off');
    }

    const frente = (teclas.has('KeyW') || teclas.has('ArrowUp') ? 1 : 0) - (teclas.has('KeyS') || teclas.has('ArrowDown') ? 1 : 0) - touch.mz;
    const lado = (teclas.has('KeyD') || teclas.has('ArrowRight') ? 1 : 0) - (teclas.has('KeyA') || teclas.has('ArrowLeft') ? 1 : 0) + touch.mx;
    const sprint = teclas.has('ShiftLeft') || teclas.has('ShiftRight');
    const espaco = teclas.has('Space') || touch.pular;

    let focoX, focoY, focoZ, focoYaw, velAbs = 0;

    if (jogador.veiculo) {
      // ==================== DIRIGINDO ====================
      const v = jogador.veiculo;
      const gas = Math.max(-1, Math.min(1, frente));
      const dirInput = Math.max(-1, Math.min(1, -lado)); // + = esquerda

      if (gas > 0.05) {
        if (v.vel < -0.5) v.vel += v.freio * dt;
        else v.vel = Math.min(v.velMax, v.vel + v.acel * gas * dt);
      } else if (gas < -0.05) {
        if (v.vel > 0.5) v.vel -= v.freio * dt;
        else v.vel = Math.max(-v.velRe, v.vel + v.acel * 0.65 * gas * dt);
      } else {
        // Atrito natural
        v.vel *= Math.exp(-1.55 * dt);
        if (Math.abs(v.vel) < 0.08) v.vel = 0;
      }

      // Freio de mão / drift
      if (espaco) {
        v.vel *= Math.exp(-3.8 * dt);
      }

      // Esterçamento suave dependente da velocidade
      const maxSteer = 0.56 / (1 + Math.abs(v.vel) * 0.032);
      const steerAlvo = dirInput * maxSteer;
      v.steer += (steerAlvo - v.steer) * Math.min(1, dt * 10);

      const fatorDrift = espaco && Math.abs(v.vel) > 8 ? 1.55 : 1.0;
      const entreeixos = 2.9;
      if (Math.abs(v.vel) > 0.1) {
        const omega = (v.vel / entreeixos) * Math.tan(v.steer) * fatorDrift;
        v.ry += omega * dt;
      }

      const dx = Math.sin(v.ry) * v.vel * dt;
      const dz = Math.cos(v.ry) * v.vel * dt;
      const col = resolverColisoes(v.x + dx, v.z + dz, v.raio);
      v.x = col.x; v.z = col.z;
      if (col.bateu) v.vel *= -0.25;

      v.dist += v.vel * dt;
      v.obj.position.set(v.x, 0, v.z);
      v.obj.rotation.set(0, v.ry, 0, 'YXZ');
      // Inclinação leve de suspensão na curva e na aceleração
      const roll = -v.steer * Math.min(Math.abs(v.vel) / 25, 1) * 0.08;
      const pitch = (gas > 0.1 ? -0.015 : (gas < -0.1 && v.vel > 2 ? 0.024 : 0));
      v.obj.rotation.z = roll;
      v.obj.rotation.x = pitch;

      if (v.api) {
        v.api.rodar(v.dist);
        v.api.esterco(v.steer);
        v.api.freio((gas < -0.05 && v.vel > 0.5) || espaco);
        v.api.re(v.vel < -0.2);
        v.api.seta(1, dirInput > 0.45 && Math.floor(tTotal * 2.6) % 2 === 0);
        v.api.seta(-1, dirInput < -0.45 && Math.floor(tTotal * 2.6) % 2 === 0);
      }

      jogador.x = v.x; jogador.z = v.z; jogador.ry = v.ry;
      focoX = v.x; focoY = 1.3; focoZ = v.z; focoYaw = v.ry;
      velAbs = Math.abs(v.vel);

      const kmh = Math.round(velAbs * 3.6);
      elVelNum.textContent = kmh;
      elMarcha.textContent = v.vel < -0.3 ? 'R' : (kmh < 2 ? 'P' : (kmh < 35 ? '1' : kmh < 70 ? '2' : kmh < 110 ? '3' : kmh < 150 ? '4' : '5'));
      if (kmh > maxVelKmh) { maxVelKmh = kmh; elMaxVel.textContent = `${maxVelKmh} km/h`; }

      // Auto-alinha câmera atrás do carro ao dirigir sem mexer no mouse
      if (!arrastando && tempoSemMouse > 1.2 && Math.abs(v.vel) > 1.2) {
        const alvoYaw = v.vel >= 0 ? v.ry : v.ry + Math.PI;
        camYaw += anguloDiff(camYaw, alvoYaw) * Math.min(1, dt * 3.2);
      }
      elPrompt.classList.add('oculto');
    } else {
      // ==================== A PÉ ====================
      const mag = Math.hypot(frente, lado);
      const movendo = mag > 0.08;
      if (movendo) {
        const dirMundo = Math.atan2(
          Math.sin(camYaw) * frente - Math.cos(camYaw) * lado,
          Math.cos(camYaw) * frente + Math.sin(camYaw) * lado
        );
        jogador.ry += anguloDiff(jogador.ry, dirMundo) * Math.min(1, dt * 11);
        const velBase = sprint ? 6.4 : 2.9;
        const passo = velBase * Math.min(1, mag) * dt;
        const col = resolverColisoes(jogador.x + Math.sin(dirMundo) * passo, jogador.z + Math.cos(dirMundo) * passo, 0.42);
        jogador.x = col.x; jogador.z = col.z;
        velAbs = velBase * Math.min(1, mag);
      }

      if (espaco && jogador.noChao) {
        jogador.vy = 6.2;
        jogador.noChao = false;
        tocarAcao('Pular', 0.08);
      }
      if (!jogador.noChao) {
        jogador.vy -= 17.5 * dt;
        jogador.y += jogador.vy * dt;
        if (jogador.y <= CALCADA) {
          jogador.y = CALCADA; jogador.vy = 0; jogador.noChao = true;
        }
      }
      if (jogador.noChao) {
        if (!movendo) tocarAcao('Parado');
        else tocarAcao(sprint ? 'Correr' : 'Andar');
      }

      persAtual.inst.obj.position.set(jogador.x, jogador.y, jogador.z);
      persAtual.inst.obj.rotation.y = jogador.ry;
      persAtual.inst.atualizar(dt);

      focoX = jogador.x; focoY = jogador.y + 1.45; focoZ = jogador.z; focoYaw = jogador.ry;

      const perto = acharVeiculoPerto();
      if (perto) {
        elPrompt.textContent = `[E] Entrar: ${perto.nome}`;
        elPrompt.classList.remove('oculto');
      } else {
        elPrompt.classList.add('oculto');
      }
    }

    // Atualiza setores visíveis, trânsito, frota distante e NPCs próximos ao jogador
    cidade.atualizar(dt, tTotal, focoX, focoZ);
    const vDist2 = (qualAtual.viewDist + 20) * (qualAtual.viewDist + 20);
    for (let i = 0; i < veiculos.length; i++) {
      const v = veiculos[i];
      if (v === jogador.veiculo) { v.obj.visible = true; continue; }
      const dx = v.x - focoX, dz = v.z - focoZ;
      v.obj.visible = (dx * dx + dz * dz) <= vDist2;
    }

    // ---- Som contínuo
    som.atualizar(tTotal, {
      dirigindo: !!jogador.veiculo,
      velAbs,
      sireneAtiva: !!jogador.veiculo?.sirene || veiculos.some(v => v.sirene && Math.hypot(v.x - focoX, v.z - focoZ) < 45),
    });

    // ---- Checkpoint
    cpAnel.rotation.z = tTotal * 1.4;
    cpFeixe.material.opacity = 0.13 + 0.06 * Math.sin(tTotal * 3.2);
    const cp = CHECKPOINTS[cpIdx];
    if (Math.hypot(focoX - cp.x, focoZ - cp.z) < 5.8) {
      score += 100;
      elScore.textContent = `${score} pts`;
      som.tocarBeep(660, 0.16, 0.09);
      setTimeout(() => som.tocarBeep(880, 0.18, 0.09), 90);
      mostrarToast(`⭐ Checkpoint: ${cp.nome} (+100 pts)`);
      cpIdx = (cpIdx + 1) % CHECKPOINTS.length;
      posicionarCheckpoint();
    }

    // ---- Chuva 3D acompanha o jogador
    if (ehChuva) {
      const arr = rainGeo.attributes.position.array;
      const nChuva = Math.min(RAIN_N, qualAtual.rainN);
      for (let i = 0; i < nChuva; i++) {
        const s = rainSeeds[i];
        s.y -= s.vel * dt;
        if (s.y < 0) s.y += 28;
        const x = focoX + s.dx, y = s.y, z = focoZ + s.dz;
        const j = i * 6;
        arr[j] = x; arr[j + 1] = y; arr[j + 2] = z;
        arr[j + 3] = x - 0.14; arr[j + 4] = y - 1.1; arr[j + 5] = z;
      }
      rainGeo.attributes.position.needsUpdate = true;
    }

    // ---- Câmera (3ª pessoa / Capô / Aérea)
    if (camModo === 0) {
      const d = jogador.veiculo ? Math.max(camDist, jogador.veiculo.camDist) : camDist;
      const h = (jogador.veiculo ? jogador.veiculo.camAlt : 1.7) + Math.sin(camPitch) * d * 0.72;
      const hDist = Math.cos(camPitch) * d;
      posCamDesejada.set(focoX - Math.sin(camYaw) * hDist, Math.max(0.8, focoY + h - 1.1), focoZ - Math.cos(camYaw) * hDist);
      if (snapCam) { camera.position.copy(posCamDesejada); snapCam = false; }
      else camera.position.lerp(posCamDesejada, Math.min(1, dt * 9));
      alvoCam.set(focoX, focoY + (jogador.veiculo ? 0.5 : 0.1), focoZ);
      camera.lookAt(alvoCam);
    } else if (camModo === 1) {
      snapCam = false;
      if (jogador.veiculo) {
        const v = jogador.veiculo;
        camera.position.set(v.x + Math.sin(v.ry) * v.capoZ, v.capoY, v.z + Math.cos(v.ry) * v.capoZ);
        camera.lookAt(v.x + Math.sin(v.ry) * 35, v.capoY - 0.25, v.z + Math.cos(v.ry) * 35);
      } else {
        camera.position.set(jogador.x - Math.sin(camYaw) * 1.1, jogador.y + 1.65, jogador.z - Math.cos(camYaw) * 1.1);
        camera.lookAt(jogador.x + Math.sin(camYaw) * 18, jogador.y + 1.55 - camPitch * 6, jogador.z + Math.cos(camYaw) * 18);
      }
    } else {
      posCamDesejada.set(focoX - Math.sin(camYaw) * 28, 48, focoZ - Math.cos(camYaw) * 28);
      if (snapCam) { camera.position.copy(posCamDesejada); snapCam = false; }
      else camera.position.lerp(posCamDesejada, Math.min(1, dt * 5));
      camera.lookAt(focoX, 0, focoZ);
    }

    // ---- Sombra dinâmica segue o jogador (somente quando sombras estão ligadas)
    if (qualAtual.sombras) {
      sun.target.position.set(focoX, 0, focoZ);
      sun.position.set(
        focoX + (ehNoite ? 55 : -75),
        ehNoite ? 110 : 130,
        focoZ + (ehNoite ? -65 : 60)
      );
    }

    // ---- Minimapa (atualizado em frequência reduzida) + Render
    minimapTimer += dt;
    if (minimapTimer >= qualAtual.minimapInterval) {
      minimapTimer = 0;
      desenharMinimapa(focoX, focoZ, focoYaw);
    }
    renderer.render(scene, camera);
  }

  function loop() {
    requestAnimationFrame(loop);
    if (!pausado) passo();
  }
  window.__jogo = {
    pausar: v => { pausado = v; },
    passo: dt => passo(dt),
    entrar: () => { entrarOuSairVeiculo(); snapCam = true; },
    teleportar: id => { const pt = PONTOS_TELEPORTE.find(p => p.id === id); if (pt) teleportar(pt); },
    noite: v => { ehNoite = v; aplicarClima(); },
    chuva: v => { ehChuva = v; rainLines.visible = ehChuva; aplicarClima(); },
    qualidade: id => aplicarQualidade(id, false),
    sirene: v => { if (jogador.veiculo?.ehPolicia) { jogador.veiculo.sirene = v; $('btn-sirene').classList.toggle('ativo', v); } },
    stats: () => ({
      fps: fpsAtual,
      qualidade: qualAtual.id,
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      ...cidade.getStats(),
    }),
  };
  passo(0.016);
  loop();
}
