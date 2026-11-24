// HRYZ CITY — Jogo 3D de mundo aberto na Cidade Oficial do canal (Three.js r160)
// Controles: WASD/Setas, Shift (correr), Espaço (pular / freio de mão), E (entrar/sair do carro),
// L (sirene/giroflex), F (faróis), N (dia/noite), R (chuva), V (câmera), C (personagem), M (som), H (ajuda).
// Armas (a pé): 1 pistola, 2 metralhadora, 3 ou G guardar, clique esquerdo atira (segure para rajada na metralhadora), X recarregar.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TILE, CALCADA, ESCALA_VEICULO } from '../videos/biblioteca3d/cidade/kit.js';
import { Personagem } from '../videos/biblioteca3d/personagens/elenco/elenco.js';
import { Corredor } from '../videos/biblioteca3d/personagens/corredor/corredor.js';
import { criarViatura, criarAmbiente } from '../videos/biblioteca3d/veiculos/policia/viatura.js';
import { criarAmbulancia } from '../videos/biblioteca3d/veiculos/ambulancia/ambulancia.js';
import * as Hatch from '../videos/biblioteca3d/veiculos/hatch/hatch.js';
import * as Taxi from '../videos/biblioteca3d/veiculos/taxi/taxi.js';
import * as Picape from '../videos/biblioteca3d/veiculos/picape/picape.js';
import * as Onibus from '../videos/biblioteca3d/veiculos/onibus/onibus.js';
import * as Bombeiros from '../videos/biblioteca3d/veiculos/bombeiros/bombeiros.js';
import * as Escavadeira from '../videos/biblioteca3d/veiculos/escavadeira/escavadeira.js';
import * as Retro from '../videos/biblioteca3d/veiculos/retroescavadeira/retroescavadeira.js';
import * as Carregadeira from '../videos/biblioteca3d/veiculos/carregadeira/carregadeira.js';
import * as Rolo from '../videos/biblioteca3d/veiculos/rolo/rolo.js';
import * as Basculante from '../videos/biblioteca3d/veiculos/basculante/basculante.js';
import { construirCanteiro, monteDeTerra } from './canteiro.js';
import { TerrenoCavavel } from './terreno.js';
import { Efeitos, VidaJogador, danoVeiculo } from './dano.js';
import { construirCidade, PONTOS_TELEPORTE, SELVA_INFO } from './cidade.js';
import { criarTrex } from './trex.js';
import { Armas } from './armas.js';
import { Abertura } from './abertura.js';
import { Sala } from './sala.js';
import { Missao, TORRE } from './missao.js';
import { BalaCam } from './balacam.js';
import { Loja } from './loja.js';

const BASE_BIB = './videos/biblioteca3d';

const PERSONAGENS_DEF = [
  { id: 'policial',   nome: 'Policial',      tipo: 'elenco',   url: `${BASE_BIB}/personagens/elenco/policial.glb` },
  { id: 'jovem_a',    nome: 'Jovem A',       tipo: 'elenco',   url: `${BASE_BIB}/personagens/elenco/jovem_a.glb` },
  { id: 'bombeiro',   nome: 'Bombeiro',      tipo: 'elenco',   url: `${BASE_BIB}/personagens/elenco/bombeiro.glb` },
  { id: 'astronauta', nome: 'Astronauta',    tipo: 'elenco',   url: `${BASE_BIB}/personagens/elenco/astronauta.glb` },
  { id: 'operador',   nome: 'Operador',      tipo: 'elenco',   url: `${BASE_BIB}/personagens/elenco/operador.glb` },
  { id: 'corredor',   nome: 'Corredor',      tipo: 'corredor', url: `${BASE_BIB}/personagens/corredor/corredor-colorido.glb` },
  { id: 'silhueta',   nome: 'Silhueta Hryz', tipo: 'silhueta', url: `${BASE_BIB}/personagens/corredor/corredor.glb` },
];

const CHECKPOINTS = [
  { nome: 'Praça Central',      x: 216, z: 168 },
  { nome: '🦖 Selva do T. rex', x: 510, z: 280 },
  { nome: 'Rotatória Central',  x: 252, z: 222 },
  { nome: 'Entrada da Rodovia', x: 18,  z: 96  },
  { nome: 'Reta da Rodovia',    x: 18,  z: 360 },
  { nome: 'Pista do Aeroporto', x: 260, z: 567 },
  { nome: 'Jardim Hryz',        x: 248, z: 312 },
  { nome: 'Estádio Hryz',       x: 396, z: 84  },
  { nome: 'Delegacia Central',  x: 146, z: 168 },
];

// ====================================================================================================
// Áudio procedural leve (WebAudio): motor, sirene P71, porta, checkpoint e rugido do T. rex
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
  tocarRugidoTrex(intensidade = 1) {
    if (!this.ctx || this.mudo) return;
    const now = this.ctx.currentTime;
    const dur = 1.35;
    const vol = Math.max(0.02, Math.min(1, intensidade)) * 0.22;

    // Camada grave gutural (sawtooth modulado)
    const o1 = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    const filt = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    o1.type = 'sawtooth';
    o2.type = 'triangle';
    o1.frequency.setValueAtTime(142, now);
    o1.frequency.exponentialRampToValueAtTime(86, now + 0.35);
    o1.frequency.exponentialRampToValueAtTime(48, now + dur);
    o2.frequency.setValueAtTime(71, now);
    o2.frequency.exponentialRampToValueAtTime(34, now + dur);

    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(480, now);
    filt.frequency.exponentialRampToValueAtTime(160, now + dur);
    filt.Q.value = 3.2;

    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(vol, now + 0.12);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    o1.connect(filt); o2.connect(filt); filt.connect(g); g.connect(this.ctx.destination);
    o1.start(now); o2.start(now);
    o1.stop(now + dur + 0.04); o2.stop(now + dur + 0.04);
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

// Sombra de contato radial leve (evita que personagem/objetos pareçam flutuando mesmo com shadowMap desligado!)
let _texSombraBlob = null;
function obterTexSombraBlob() {
  if (_texSombraBlob) return _texSombraBlob;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 4, 32, 32, 30);
  gr.addColorStop(0, 'rgba(0,0,0,0.48)');
  gr.addColorStop(0.55, 'rgba(0,0,0,0.22)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  _texSombraBlob = new THREE.CanvasTexture(c);
  return _texSombraBlob;
}

// Céu leve com gradiente, sol/lua e horizonte suave (1 draw call, < 0,1 ms!)
function criarCeuLeve() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTopo: { value: new THREE.Color(0x2867c7) },
      uHor:  { value: new THREE.Color(0xbce0f7) },
      uChao: { value: new THREE.Color(0x526b5c) },
      uSolDir: { value: new THREE.Vector3(-0.55, 0.58, 0.45).normalize() },
      uSolCor: { value: new THREE.Color(0xfff5d6) },
      uSolForca: { value: 1.0 },
    },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      varying vec3 vD;
      uniform vec3 uTopo, uHor, uChao, uSolDir, uSolCor;
      uniform float uSolForca;
      void main() {
        vec3 d = normalize(vD);
        float h = d.y;
        vec3 c = h >= 0.0
          ? mix(uHor, uTopo, pow(clamp(h, 0.0, 1.0), 0.58))
          : mix(uHor, uChao, clamp(-h * 4.0, 0.0, 1.0));
        if (h > -0.02 && uSolForca > 0.01) {
          float s = max(dot(d, uSolDir), 0.0);
          c += uSolCor * (pow(s, 18.0) * 0.25 + pow(s, 360.0) * 1.8) * uSolForca;
        }
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  return {
    mesh,
    definir({ noite, chuva }) {
      if (noite) {
        mat.uniforms.uTopo.value.setHex(0x060b1c);
        mat.uniforms.uHor.value.setHex(0x162447);
        mat.uniforms.uChao.value.setHex(0x080d1a);
        mat.uniforms.uSolDir.value.set(0.45, 0.52, -0.55).normalize();
        mat.uniforms.uSolCor.value.setHex(0xcbdcff);
        mat.uniforms.uSolForca.value = 0.55;
      } else if (chuva) {
        mat.uniforms.uTopo.value.setHex(0x4c6073);
        mat.uniforms.uHor.value.setHex(0x8fa3b5);
        mat.uniforms.uChao.value.setHex(0x4a5966);
        mat.uniforms.uSolForca.value = 0.08;
      } else {
        mat.uniforms.uTopo.value.setHex(0x2867c7);
        mat.uniforms.uHor.value.setHex(0xbce0f7);
        mat.uniforms.uChao.value.setHex(0x526b5c);
        mat.uniforms.uSolDir.value.set(-0.55, 0.58, 0.45).normalize();
        mat.uniforms.uSolCor.value.setHex(0xfff5d6);
        mat.uniforms.uSolForca.value = 1.0;
      }
    },
  };
}

// Pool leve de fumaça de pneu para drift (16 partículas recicladas, zero alocação por frame)
function criarFumacaDrift(scene) {
  const N = 16;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  gr.addColorStop(0, 'rgba(235,240,248,0.65)');
  gr.addColorStop(0.5, 'rgba(210,220,232,0.30)');
  gr.addColorStop(1, 'rgba(200,210,225,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);

  const pool = [];
  for (let i = 0; i < N; i++) {
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false });
    const sp = new THREE.Sprite(mat);
    sp.visible = false;
    scene.add(sp);
    pool.push({ sp, mat, vida: 0, maxVida: 0.6, vx: 0, vy: 0, vz: 0 });
  }
  let idx = 0, cooldown = 0;
  return {
    emitir(x, z, ry, dt) {
      cooldown -= dt;
      if (cooldown > 0) return;
      cooldown = 0.045;
      for (const lado of [-0.72, 0.72]) {
        const p = pool[idx++ % N];
        const rx = x - Math.sin(ry) * 1.45 + Math.cos(ry) * lado;
        const rz = z - Math.cos(ry) * 1.45 - Math.sin(ry) * lado;
        p.sp.position.set(rx, 0.28, rz);
        p.sp.scale.setScalar(0.65);
        p.sp.visible = true;
        p.vida = 0.52;
        p.maxVida = 0.52;
        p.vx = (Math.random() - 0.5) * 0.8;
        p.vy = 0.9 + Math.random() * 0.5;
        p.vz = (Math.random() - 0.5) * 0.8;
      }
    },
    atualizar(dt) {
      for (let i = 0; i < N; i++) {
        const p = pool[i];
        if (p.vida <= 0) continue;
        p.vida -= dt;
        if (p.vida <= 0) { p.sp.visible = false; continue; }
        const u = 1 - p.vida / p.maxVida;
        p.sp.position.x += p.vx * dt;
        p.sp.position.y += p.vy * dt;
        p.sp.position.z += p.vz * dt;
        p.sp.scale.setScalar(0.65 + u * 1.85);
        p.mat.opacity = (1 - u) * 0.55;
      }
    },
  };
}

// Personagem policial estilizado e arredondado (~520 triângulos, zero skinning de GPU, com sombra no chão!)
function criarPersonagemLeve() {
  const g = new THREE.Group();
  g.name = 'PolicialLeve';

  const mCamisa = new THREE.MeshLambertMaterial({ color: 0x1f3d73 });
  const mColete = new THREE.MeshLambertMaterial({ color: 0x132038 });
  const mCalca  = new THREE.MeshLambertMaterial({ color: 0x101a2e });
  const mPele   = new THREE.MeshLambertMaterial({ color: 0xe8bc9e });
  const mCabelo = new THREE.MeshLambertMaterial({ color: 0x261d18 });
  const mPreto  = new THREE.MeshLambertMaterial({ color: 0x14171e });
  const mOuro   = new THREE.MeshPhongMaterial({ color: 0xfacc15, shininess: 90, specular: 0xfff0a0 });
  const mOculos = new THREE.MeshPhongMaterial({ color: 0x0b0f18, shininess: 120, specular: 0x6688aa });

  // Sombra de contato macia nos pés (nunca parece flutuando!)
  const sombra = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 1.15),
    new THREE.MeshBasicMaterial({ map: obterTexSombraBlob(), transparent: true, depthWrite: false })
  );
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.y = 0.025;
  g.add(sombra);

  const corpo = new THREE.Group();
  g.add(corpo);

  // Tronco com ombros arredondados + colete tático + gravata + cinto + distintivo
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.17, 0.56, 10), mCamisa);
  tronco.scale.set(1.18, 1, 0.72);
  tronco.position.y = 1.08;
  corpo.add(tronco);

  const colete = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.19, 0.42, 10), mColete);
  colete.scale.set(1.16, 1, 0.78);
  colete.position.y = 1.07;
  corpo.add(colete);

  const cinto = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.195, 0.075, 10), mPreto);
  cinto.scale.set(1.15, 1, 0.78);
  cinto.position.y = 0.81;
  corpo.add(cinto);

  const fivela = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.03), mOuro);
  fivela.position.set(0, 0.81, 0.155);
  corpo.add(fivela);

  const distintivo = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.015, 6), mOuro);
  distintivo.rotation.x = Math.PI / 2;
  distintivo.position.set(0.11, 1.19, 0.165);
  corpo.add(distintivo);

  const pescoco = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.11, 8), mPele);
  pescoco.position.y = 1.40;
  corpo.add(pescoco);

  // Cabeça arredondada, cabelo, óculos escuros e quepe policial detalhado
  const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 10), mPele);
  cabeca.scale.set(0.95, 1.08, 0.98);
  cabeca.position.y = 1.56;
  corpo.add(cabeca);

  const cabelo = new THREE.Mesh(new THREE.SphereGeometry(0.148, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), mCabelo);
  cabelo.position.set(0, 1.57, -0.015);
  corpo.add(cabelo);

  const oculos = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.055, 0.04), mOculos);
  oculos.position.set(0, 1.57, 0.13);
  corpo.add(oculos);

  const quepeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.148, 0.09, 12), mCamisa);
  quepeBase.position.set(0, 1.70, -0.005);
  corpo.add(quepeBase);
  const quepeFaixa = new THREE.Mesh(new THREE.CylinderGeometry(0.153, 0.152, 0.035, 12), mPreto);
  quepeFaixa.position.set(0, 1.66, -0.005);
  corpo.add(quepeFaixa);
  const quepeAba = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.018, 10, 1, false, -Math.PI * 0.42, Math.PI * 0.84), mPreto);
  quepeAba.position.set(0, 1.645, 0.065);
  quepeAba.rotation.x = 0.14;
  corpo.add(quepeAba);
  const quepeEmblema = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.015, 6), mOuro);
  quepeEmblema.rotation.x = Math.PI / 2;
  quepeEmblema.position.set(0, 1.70, 0.155);
  corpo.add(quepeEmblema);

  // Pernas articuladas com botas
  function fazerPerna(sx) {
    const pivo = new THREE.Group();
    pivo.position.set(sx * 0.115, 0.78, 0);
    const coxa = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.068, 0.66, 8), mCalca);
    coxa.position.y = -0.33;
    const bota = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.13, 0.22), mPreto);
    bota.position.set(0, -0.71, 0.035);
    pivo.add(coxa, bota);
    return pivo;
  }
  const pernaE = fazerPerna(-1);
  const pernaD = fazerPerna(1);
  corpo.add(pernaE, pernaD);

  // Braços articulados com ombro arredondado + manga + mão
  function fazerBraco(sx) {
    const pivo = new THREE.Group();
    pivo.position.set(sx * 0.285, 1.31, 0);
    const ombro = new THREE.Mesh(new THREE.SphereGeometry(0.072, 8, 6), mCamisa);
    const manga = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.052, 0.46, 8), mCamisa);
    manga.position.y = -0.24;
    const mao = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 6), mPele);
    mao.position.y = -0.50;
    pivo.add(ombro, manga, mao);
    return pivo;
  }
  const bracoE = fazerBraco(-1);
  const bracoD = fazerBraco(1);
  corpo.add(bracoE, bracoD);

  let acao = 'Parado';
  let fase = 0;
  return {
    obj: g,
    tocar(nome) { acao = nome; },
    atualizar(dt) {
      if (acao === 'Correr' || acao === 'Andar') {
        const vel = acao === 'Correr' ? 12.5 : 7.8;
        const amp = acao === 'Correr' ? 0.78 : 0.46;
        fase += dt * vel;
        const s = Math.sin(fase) * amp;
        pernaE.rotation.x = s;
        pernaD.rotation.x = -s;
        bracoE.rotation.x = -s * 0.85;
        bracoD.rotation.x = s * 0.85;
        corpo.position.y = Math.abs(Math.cos(fase)) * (acao === 'Correr' ? 0.065 : 0.03);
        corpo.rotation.x = acao === 'Correr' ? 0.12 : 0.04;
      } else if (acao === 'Pular') {
        pernaE.rotation.x = 0.35;
        pernaD.rotation.x = -0.35;
        bracoE.rotation.x = -0.85;
        bracoD.rotation.x = -0.85;
        corpo.position.y = 0;
        corpo.rotation.x = 0;
      } else {
        pernaE.rotation.x *= 0.8;
        pernaD.rotation.x *= 0.8;
        bracoE.rotation.x *= 0.8;
        bracoD.rotation.x *= 0.8;
        corpo.position.y = 0;
        corpo.rotation.x *= 0.8;
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

// Viatura Ford Crown Victoria P71 otimizada para tempo real:
// Mantém a carroceria, pintura "POLICE · HRYZ CITY 117", pushbar, giroflex e rodas que giram/esterçam,
// mas corta ~85.000 triângulos e ~80 draw calls (troca as 4 rodas de 18k tris por rodas leves, oculta interior invisível e troca clearcoat por Phong brilhoso).
function criarViaturaP71Otimizada(modoCompleto = false) {
  const p71 = criarViatura({
    livery: 'preto-branco',
    numero: '117',
    cidade: 'HRYZ CITY',
    placa: 'HRYZ 911',
    pushbar: true,
    sujeira: 0.25,
  });

  // 1. Oculta o interior (30 malhas / 14k triângulos invisíveis por trás do vidro fumê em 3ª pessoa)
  const interior = p71.grupo.getObjectByName('interior');
  if (interior) interior.visible = false;

  // 2. Troca as 4 rodas pesadas (72.416 triângulos / 56 malhas) por rodas P71 leves (4x2 = 8 malhas / ~1.100 tris)
  const geoPneu = new THREE.CylinderGeometry(0.355, 0.355, 0.235, 16);
  geoPneu.rotateZ(Math.PI / 2);
  const geoAro = new THREE.CylinderGeometry(0.215, 0.215, 0.245, 14);
  geoAro.rotateZ(Math.PI / 2);
  const geoCalota = new THREE.CylinderGeometry(0.085, 0.095, 0.258, 12);
  geoCalota.rotateZ(Math.PI / 2);
  const matPneu = new THREE.MeshLambertMaterial({ color: 0x16181c });
  const matAro  = new THREE.MeshPhongMaterial({ color: 0x14171c, shininess: 45, specular: 0x444c55 });
  const matCalota = new THREE.MeshPhongMaterial({ color: 0xd5dce4, shininess: 110, specular: 0xffffff });

  for (const r of p71.rodas) {
    // Limpa os 14 filhos pesados de cada pivô de roda e coloca o conjunto leve que continua girando e esterçando!
    while (r.pivo.children.length) r.pivo.remove(r.pivo.children[0]);
    const giroNovo = new THREE.Group();
    const pneuM = new THREE.Mesh(geoPneu, matPneu);
    const aroM = new THREE.Mesh(geoAro, matAro);
    const calM = new THREE.Mesh(geoCalota, matCalota);
    giroNovo.add(pneuM, aroM, calM);
    r.pivo.add(giroNovo);
    r.giro = giroNovo;
  }

  // 3. Preserva o material de pintura da P71 (ele usa onBeforeCompile para a pintura "POLICE · HRYZ CITY · 117" e os recortes das caixas de roda!)
  //    e só desliga o clearcoat pesado no modo Leve; demais materiais PBR viram Phong leve.
  const matPintura = p71.pintura?.material;
  const luzesDinamicas = [];
  p71.grupo.traverse(m => {
    if (m.isLight) {
      luzesDinamicas.push(m);
      return;
    }
    if (!m.isMesh || !m.material || Array.isArray(m.material)) return;
    const mat = m.material;
    if (mat === matPintura) return;
    if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
      m.userData.matPbr = mat;
      m.userData.matLeve = new THREE.MeshPhongMaterial({
        color: mat.color ? mat.color.clone() : 0xffffff,
        map: mat.map || null,
        emissive: mat.emissive ? mat.emissive.clone() : 0x000000,
        emissiveIntensity: mat.emissiveIntensity ?? 1,
        transparent: mat.transparent,
        opacity: mat.opacity,
        depthWrite: mat.depthWrite,
        side: mat.side,
        shininess: mat.clearcoat ? 95 : Math.round((1 - (mat.roughness ?? 0.5)) * 80),
        specular: new THREE.Color(mat.clearcoat ? 0x6b7c90 : 0x333c48),
      });
    }
  });

  // 4. Farol leve com gradiente suave no chão (usado no modo Leve para economizar os 2 SpotLights)
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
  const facho = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 15), fachoMat);
  facho.rotation.x = -Math.PI / 2;
  facho.position.set(0, 0.04, 9.5);
  p71.grupo.add(facho);

  let usandoPbr = modoCompleto;
  let faroisLigados = false;
  const faroisOrig = p71.farois.bind(p71);
  const luzesOrig = p71.luzes.bind(p71);

  p71.definirModo = (pbrAtivo, sombraAtiva) => {
    usandoPbr = pbrAtivo;
    if (matPintura) {
      matPintura.clearcoat = pbrAtivo ? 1.0 : 0.0;
      matPintura.roughness = pbrAtivo ? 0.30 : 0.42;
    }
    p71.grupo.traverse(m => {
      if (!m.isMesh) return;
      if (m.userData.matPbr && m.userData.matLeve) {
        m.material = pbrAtivo ? m.userData.matPbr : m.userData.matLeve;
      }
      if (m.name !== 'sombraChao' && m !== facho) {
        m.castShadow = sombraAtiva;
      }
    });
    for (const l of luzesDinamicas) l.visible = pbrAtivo;
    p71.farois(faroisLigados);
  };

  p71.farois = on => {
    faroisLigados = !!on;
    faroisOrig(usandoPbr && faroisLigados);
    fachoMat.opacity = (!usandoPbr && faroisLigados) ? 0.55 : 0;
  };
  p71.luzes = (t, modo) => {
    luzesOrig(t, modo);
    if (!usandoPbr) {
      for (const l of luzesDinamicas) l.visible = false;
    }
  };

  p71.definirModo(modoCompleto, modoCompleto);
  return p71;
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

  // ---- Renderer, Qualidade e Cena (padrão = Leve para rodar liso em qualquer PC ou celular!)
  const Q = new URLSearchParams(location.search);
  let ehNoite = Q.has('noite');
  let ehChuva = Q.has('chuva');
  if (Q.has('touch')) document.body.classList.add('modo-touch');

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
  const camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.4, qualAtual.camFar);

  // Céu gradiente leve com sol/lua (1 draw call)
  const ceu = criarCeuLeve();
  scene.add(ceu.mesh);

  // Fumaça leve de drift
  const fumacaDrift = criarFumacaDrift(scene);

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

  // ---- Construir Cidade Hryz (ultra-leve: Lambert texturizado + malhas mescladas + culling por setor)
  atualizarProgresso(0.05, 'Carregando Cidade Hryz…');
  const cidade = await construirCidade({
    scene,
    noiteInicial: ehNoite,
    qualidadeInicial: qualAtual,
    onProgresso: (f, txt) => atualizarProgresso(0.05 + f * 0.72, txt),
  });

  function aplicarClima() {
    const fundo = ehNoite ? 0x0e1833 : (ehChuva ? 0x7c92a6 : 0xbce0f7);
    scene.background = new THREE.Color(fundo);
    ceu.definir({ noite: ehNoite, chuva: ehChuva });
    const fNear = ehChuva ? Math.min(qualAtual.fogNear, 65) : qualAtual.fogNear;
    const fFar = ehChuva ? Math.min(qualAtual.fogFar, 220) : qualAtual.fogFar;
    scene.fog = new THREE.Fog(fundo, fNear, fFar);
    scene.environment = qualAtual.pbr ? obterAmbiente(ehNoite) : null;
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

  // ---- Veículos dirigíveis (Viatura Ford Crown Victoria P71 Game-Ready em todos os modos!)
  atualizarProgresso(0.80, 'Montando Viatura Crown Victoria P71…');
  const veiculos = [];
  const montes = [];                                                                // montes de terra despejados pelo basculante
  const glbLoader = new GLTFLoader();

  const p71 = criarViaturaP71Otimizada(qualAtual.pbr);
  p71.grupo.position.set(146, 0, 166.2);
  p71.grupo.rotation.y = Math.PI / 2;
  scene.add(p71.grupo);

  const veiculoPolicia = {
    id: 'p71',
    nome: 'Viatura Crown Victoria P71',
    obj: p71.grupo,
    api: p71,
    x: 146, z: 166.2, ry: Math.PI / 2,
    vel: 0, steer: 0, dist: 0,
    acel: 22, velMax: 48, velRe: 14, freio: 34, raio: 2.35,
    sirene: false, farois: false, ehPolicia: true, temSirene: true,
    camDist: 7.4, camAlt: 2.7, capoY: 1.42, capoZ: 0.55,
  };
  veiculos.push(veiculoPolicia);

  function sincronizarViaturaPolicia(pbrAtivo, sombraAtiva) {
    p71.definirModo(pbrAtivo, sombraAtiva);
  }

  // 2. Frota extra dirigível (Kenney)
  atualizarProgresso(0.88, 'Estacionando frota dirigível…');
  const frotaExtra = [
    { nome: 'Esportivo Hryz',  arq: 'sedan-sports', x: 196, z: 166.2, ry: Math.PI / 2,  acel: 27, velMax: 55, raio: 1.9 },
    { nome: 'Fórmula Hryz',    arq: 'race',         x: 290, z: 238.2, ry: -Math.PI / 2, acel: 34, velMax: 68, raio: 1.85 },   // (fora do cerco da missão na rotatória)
    { nome: 'Fórmula Pista',   arq: 'race-future',  x: 132, z: 567,   ry: Math.PI / 2,  acel: 36, velMax: 72, raio: 1.85 },
    { nome: 'SUV de Luxo',     arq: 'suv-luxury',   x: 256, z: 313.8, ry: -Math.PI / 2, acel: 20, velMax: 44, raio: 2.0 },
    { nome: 'Jipe da Selva',   arq: 'suv',          x: 454, z: 266.5, ry: Math.PI / 2 - 0.14, acel: 22, velMax: 46, raio: 2.0 },
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

  // 3. Frota própria do canal (biblioteca3d/veiculos: kit procedural em metros reais, com luzes, setas, freio, ré e rodas que giram)
  //    Os SpotLights/PointLights de cada carro são removidos no jogo (cada luz a mais encarece o shader de toda a cena);
  //    faróis, lanternas e giroflex continuam acendendo pelos materiais emissivos.
  atualizarProgresso(0.90, 'Estacionando a frota do canal…');
  const frotaCanal = [
    { id: 'hatch', nome: 'Hatch Hryz',        criar: () => Hatch.criar(),     x: 172, z: 166.2, ry: Math.PI / 2,  acel: 21, velMax: 44, raio: 2.0, camDist: 6.6, camAlt: 2.4, capoY: 1.30, capoZ: 0.3 },
    { id: 'taxi', nome: 'Táxi da Praça',     criar: () => Taxi.criar(),      x: 218, z: 169.8, ry: -Math.PI / 2, acel: 20, velMax: 42, raio: 2.2, camDist: 7.0, camAlt: 2.5, capoY: 1.32, capoZ: 0.4 },
    { id: 'picape', nome: 'Picape Cabine Dupla', criar: () => Picape.criar(),  x: 240, z: 169.8, ry: -Math.PI / 2, acel: 19, velMax: 42, raio: 2.6, camDist: 8.0, camAlt: 2.9, capoY: 1.75, capoZ: 0.6 },
    { id: 'onibus', nome: 'Ônibus Escolar',    criar: () => Onibus.criar(),    x: 292, z: 166.2, ry: Math.PI / 2,  acel: 11, velMax: 28, raio: 3.4, camDist: 13.5, camAlt: 4.6, capoY: 2.35, capoZ: 4.3 },
    { id: 'bombeiros', nome: 'Caminhão de Bombeiros', criar: () => Bombeiros.criar(), x: 128, z: 98, ry: Math.PI / 2, acel: 14, velMax: 34, raio: 3.1, camDist: 12.0, camAlt: 4.3, capoY: 2.40, capoZ: 3.3, sirene: true },
    { id: 'ambulancia', nome: 'Ambulância',        criar: () => criarAmbulancia(), x: 148, z: 98,    ry: Math.PI / 2,  acel: 17, velMax: 40, raio: 2.8, camDist: 9.5, camAlt: 3.6, capoY: 2.05, capoZ: 2.0, sirene: true },
    // máquinas de obra (canteiro ao norte): lentas, com ferramentas nos eixos 1–8
    { id: 'escavadeira', nome: 'Escavadeira',     criar: () => Escavadeira.criar(),  x: 158, z: -16, ry: 0.35, acel: 5, velMax: 7, velRe: 5, raio: 3.3, camDist: 13, camAlt: 5.2, capoY: 3.3, capoZ: 0.6, maquina: true },
    { id: 'retroescavadeira', nome: 'Retroescavadeira', criar: () => Retro.criar(), x: 176, z: -6, ry: 0, acel: 8, velMax: 11, velRe: 7, raio: 2.9, camDist: 10, camAlt: 4.0, capoY: 2.75, capoZ: -0.6, maquina: true },
    { id: 'carregadeira', nome: 'Pá Carregadeira', criar: () => Carregadeira.criar(), x: 196, z: -8, ry: -0.3, acel: 8, velMax: 11, velRe: 7, raio: 3.4, camDist: 11, camAlt: 4.4, capoY: 3.05, capoZ: -0.6, maquina: true },
    { id: 'rolo', nome: 'Rolo Compactador',      criar: () => Rolo.criar(),         x: 208, z: 4,   ry: Math.PI, acel: 5, velMax: 6, velRe: 5, raio: 2.6, camDist: 9, camAlt: 3.8, capoY: 2.85, capoZ: -0.8, maquina: true },
    { id: 'basculante', nome: 'Caminhão Basculante', criar: () => Basculante.criar(), x: 148, z: 3, ry: Math.PI / 2, acel: 13, velMax: 24, velRe: 9, raio: 3.6, camDist: 12, camAlt: 4.6, capoY: 2.75, capoZ: 3.3, maquina: true },
  ];
  for (const f of frotaCanal) {
    try {
      const api = f.criar(), o = api.grupo;
      const luzesRemover = [];
      o.traverse(m => {
        if (m.isLight) { luzesRemover.push(m); return; }
        if (!m.isMesh) return;
        m.castShadow = qualAtual.sombraPrincipal; m.receiveShadow = true;
        const mat = m.material;
        // versão leve (Lambert) só para o que não acende: lâmpadas, faróis e giroflex mantêm o material emissivo do modelo
        if (mat && !Array.isArray(mat) && mat.isMeshStandardMaterial && !(mat.emissive && mat.emissive.getHex() !== 0)) {
          m.userData.matPbr = mat;
          m.userData.matLeve = new THREE.MeshLambertMaterial({ color: mat.color.clone(), map: mat.map || null, transparent: mat.transparent, opacity: mat.opacity, side: mat.side, depthWrite: mat.depthWrite });
          if (!qualAtual.pbr) m.material = m.userData.matLeve;
        }
      });
      luzesRemover.forEach(l => l.parent.remove(l));
      if (api.luzes) api.luzes(0, 'off');
      o.position.set(f.x, 0, f.z);
      o.rotation.y = f.ry;
      scene.add(o);
      veiculos.push({
        id: f.id, nome: f.nome, obj: o, api,
        x: f.x, z: f.z, ry: f.ry,
        vel: 0, steer: 0, dist: 0,
        acel: f.acel, velMax: f.velMax, velRe: f.velRe ?? 12, freio: 30, raio: f.raio,
        sirene: false, farois: false, ehPolicia: false, temSirene: !!f.sirene, maquina: !!f.maquina,
        camDist: f.camDist, camAlt: f.camAlt, capoY: f.capoY, capoZ: f.capoZ,
      });
    } catch (e) { console.warn('veículo do canal não montou', f.nome, e); }
  }

  // canteiro de obras (terreno cercado ao norte, com o operador)
  let canteiro = null;
  try { canteiro = await construirCanteiro({ scene, colisores: cidade.colisores, base: BASE_BIB }); } catch (e) { console.warn('canteiro', e); }
  let terreno = null;
  if (canteiro) {                                                                  // o chão de dentro do tapume vira terreno cavável
    canteiro.chao.visible = false;
    terreno = new TerrenoCavavel(canteiro.grupo, { x0: 140.5, x1: 219.5, z0: -29.5, z1: 14.5 }, canteiro.materialTerra);
  }
  const alturaChao = (x, z) => terreno?.altura(x, z) ?? null;
  const efeitos = new Efeitos(scene);
  let entulho = 0;                                                                 // terra despejada fora do canteiro (vira monte a cada 3 m³)
  function despejarTerra(x, z, m3, r = 1.2) {
    if (terreno?.dentro(x, z)) { terreno.depositar(x, z, m3, r); return; }
    entulho += m3; if (entulho >= 3) { entulho = 0; montes.push(monteDeTerra(scene, x, z)); if (montes.length > 14) scene.remove(montes.shift()); }
  }

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

  // ---- Armas (pistola e metralhadora feitas no Blender)
  atualizarProgresso(0.97, 'Carregando armas…');
  const armas = new Armas({ scene, camera, som, alvos: () => [cidade.mundo, ...veiculos.map(v => v.obj), ...(trexState.inst && trexState.estado !== 'morto' ? [trexState.inst.grupo] : [])], chao: () => jogador.y,
    possui: Q.has('armas') ? ['pistola', 'metralhadora', 'sniper'] : [] });                       // as armas ficam espalhadas pelo mapa (missão)
  try { await armas.carregar(BASE_BIB); } catch (e) { console.warn('armas não carregaram', e); }
  window.__armas = armas;                                                            // (para testes automáticos)
  const elMira = $('mira'), elArma = $('hud-arma');
  function atualizarHudArma() {
    const inf = armas.info, armado = !!inf && !jogador.veiculo;
    elMira.classList.toggle('oculto', !armado || camModo === 2); elArma.classList.toggle('oculto', !inf);
    if (inf) elArma.textContent = `${{ pistola: '🔫', metralhadora: '🔫🔫', sniper: '🎯' }[inf.id]} ${inf.nome} · ${inf.recarregando ? 'recarregando…' : `${inf.municao}/${inf.pente}`} · reserva ${inf.reserva}`;
  }
  const NOMES_ARMA = { pistola: 'pistola', metralhadora: 'metralhadora', sniper: 'sniper' };
  function trocarArma(id) {
    if (jogador.veiculo) { mostrarToast('Saia do veículo para usar armas'); return; }
    if (id && !armas.possui.has(id)) { mostrarToast(`Você ainda não tem a ${NOMES_ARMA[id]}: procure o ícone dela no minimapa.`); return; }
    if (mira.ativa) sairMira(true);
    armas.equipar(armas.atual === id ? null : id);
    // o personagem ultra-leve (modo Leve) não tem esqueleto: para segurar a arma, troca pelo elenco completo
    if (armas.ativa && usandoPersLeve) carregarPersonagem(persIdx).then(() => mostrarToast(`${armas.info?.nome ?? 'Arma'} na mão · clique para atirar · X recarrega`));
    mostrarToast(armas.ativa ? `${armas.info.nome} na mão · clique para atirar · X recarrega` : 'Arma guardada');
    atualizarHudArma();
  }

  // ---- Plataformas (terraço da torre, interior da loja): o jogador anda num retângulo, numa altura própria
  function moverNaPlataforma(x, z, r) {
    const p = jogador.plataforma;
    let nx = Math.max(p.minX + r, Math.min(p.maxX - r, x)), nz = Math.max(p.minZ + r, Math.min(p.maxZ - r, z)), bateu = nx !== x || nz !== z;
    for (const b of p.obst || []) {
      const cx = Math.max(b.minX, Math.min(nx, b.maxX)), cz = Math.max(b.minZ, Math.min(nz, b.maxZ)), dx = nx - cx, dz = nz - cz, d2 = dx * dx + dz * dz;
      if (d2 < r * r) { bateu = true; if (d2 > 1e-6) { const d = Math.sqrt(d2); nx = cx + dx / d * r; nz = cz + dz / d * r; } else nz = b.maxZ + r; }
    }
    return { x: nx, z: nz, bateu };
  }
  function irPara(pos, plataforma, y) {
    jogador.plataforma = plataforma || null;
    jogador.x = pos.x; jogador.z = pos.z; jogador.y = y ?? (plataforma ? plataforma.y : CALCADA); jogador.vy = 0; jogador.noChao = true;
    if (pos.ry !== undefined) { jogador.ry = pos.ry; camYaw = pos.ry; }
    persAtual.inst.obj.position.set(jogador.x, jogador.y, jogador.z); persAtual.inst.obj.rotation.y = jogador.ry;
    snapCam = true; minimapTimer = 99;
  }
  const elPreto = $('tela-preta');
  function comFade(f) { elPreto.classList.add('visivel'); setTimeout(() => { f(); setTimeout(() => elPreto.classList.remove('visivel'), 120); }, 320); }

  // ---- Luneta da sniper
  const mira = { ativa: false, fixa: false, yaw: 0, pitch: -0.2, fov: 14 };
  const elLuneta = $('luneta');
  function entrarMira(fixa) {
    if (armas.atual !== 'sniper' || jogador.veiculo || balacam.ativa || modo !== 'jogo') {
      if (fixa && armas.possui.has('sniper') && !jogador.veiculo) { trocarArma('sniper'); } else return;
    }
    mira.ativa = true; mira.fixa = !!fixa; mira.yaw = jogador.plataforma === TORRE.terraco ? camYaw : camYaw; mira.pitch = jogador.plataforma === TORRE.terraco ? -0.45 : -0.04; mira.fov = jogador.plataforma === TORRE.terraco ? 7 : 14;
    armas.luneta = true; persAtual.inst.obj.visible = false; elLuneta.classList.remove('oculto'); document.body.classList.add('na-luneta');
  }
  function sairMira() {
    if (!mira.ativa) return;
    mira.ativa = false; armas.luneta = false; persAtual.inst.obj.visible = !jogador.veiculo;
    camera.fov = 56; camera.near = 0.4; camera.updateProjectionMatrix(); camYaw = mira.yaw; snapCam = true;
    elLuneta.classList.add('oculto'); document.body.classList.remove('na-luneta', 'respiracao');
  }

  // ---- Vida do jogador: desmaiou → acorda no hospital
  let travado = false;
  const vida = new VidaJogador({ aoMorrer: motivo => {
    sairMira(); armas.gatilho(false); armas.equipar(null);
    if (jogador.veiculo) sairSemAnimar();
    travado = true; persAtual.inst.obj.visible = true; persAtual.inst.obj.rotation.x = -1.4;
    mostrarToast(`Você desmaiou${motivo ? ' (' + motivo + ')' : ''}…`);
    setTimeout(() => comFade(() => {
      persAtual.inst.obj.rotation.x = 0; travado = false; vida.reviver();
      if (loja.dentro) { loja.dentro = false; loja.grupo.visible = false; }
      irPara({ x: 150, z: 100.6, ry: Math.PI }, null);
      mostrarToast('Você acordou no Hospital Hryz. Cuidado lá fora!');
    }), 2600);
  } });
  // dano por tiro: veículos (lataria) e o T. rex
  const DANO_TIRO = { pistola: 7, metralhadora: 5, sniper: 70 };
  function danoPorTiro(obj, ponto, id) {
    if (!obj) return;
    let o = obj; while (o && o.parent) { const v = veiculos.find(x => x.obj === o); if (v) { v.dano?.(DANO_TIRO[id] || 5, ponto); return; } if (trexState.inst && o === trexState.inst.grupo) { danoTrex(DANO_TIRO[id] || 5); return; } o = o.parent; }
  }
  function danoTrex(n) {
    const tr = trexState; if (tr.estado === 'morto') return;
    tr.hp -= n;
    if (tr.hp <= 0) { tr.estado = 'morto'; tr.tMorto = 0; som.tocarRugidoTrex(0.6); mostrarToast('🦖 O T. rex caiu! Ele volta daqui a pouco…'); return; }
    if (tr.estado === 'patrulha') { tr.estado = 'rugindo'; tr.timerEstado = 1.0; }
    if (tr.rugidoCooldown <= 0) { som.tocarRugidoTrex(0.9); tr.rugidoCooldown = 2.5; }
  }

  // ---- Missão do refém, câmera da bala e loja de munição
  atualizarProgresso(0.975, 'Preparando a missão…');
  const hudRot = $('hud-alvo-rot');
  const ganchos = {
    jogador: () => jogador, noTerraco: () => jogador.plataforma === TORRE.terraco, noVeiculo: () => !!jogador.veiculo,
    sireneLigada: () => !!jogador.veiculo?.sirene, toast: m => mostrarToast(m), noite: () => ehNoite,
    irTerraco: () => comFade(() => { irPara(TORRE.chegada, TORRE.terraco); mostrarToast('Terraço da torre, 38 m de altura. Sniper (3) e botão direito (ou Z) para a luneta.'); }),
    descerTerraco: () => comFade(() => { sairMira(); irPara({ x: TORRE.porta.x, z: TORRE.porta.z + 1.6, ry: 0 }, null); }),
    atingirJogador: () => { sairMira(); vida.dano(45, 'tiro da polícia'); travado = true; persAtual.inst.obj.rotation.x = -1.35; },
    // recomeçar a missão: o jogador volta longe da cena (perto da delegacia), a pé ou com o mesmo veículo e a sirene desligada
    reviver: () => {
      persAtual.inst.obj.rotation.x = 0; travado = false; sairMira(); armas.gatilho(false);
      if (loja.dentro) { loja.dentro = false; loja.grupo.visible = false; }
      const v = jogador.veiculo;
      if (v) {
        v.sirene = false; $('btn-sirene').classList.remove('ativo');
        colocarVeiculo(v, 200, 169.8, -Math.PI / 2); jogador.plataforma = null; jogador.x = v.x; jogador.z = v.z; jogador.ry = v.ry; camYaw = v.ry; snapCam = true; minimapTimer = 99;
      } else irPara({ x: 146, z: 163.8, ry: Math.PI / 2 }, null);
      mostrarToast('Missão reiniciada · você voltou para longe da rotatória');
    },
    hud: (rot, txt) => { hudRot.textContent = rot; elAlvoNome.textContent = txt; },
  };
  const missao = new Missao({ scene, camera, armas, som, base: BASE_BIB, jogo: ganchos });
  const balacam = new BalaCam({
    scene, camera, renderer, armas, som,
    alvosEspeciais: () => missao.alvosBala(),
    aoImpacto: res => { missao.aoImpacto(res); if (res.objeto) danoPorTiro(res.objeto, res.ponto, 'sniper'); },
    aoFim: () => { snapCam = true; if (missao.estado !== 'ativa') sairMira(); },
  });
  const loja = new Loja({ scene, camera, armas, base: BASE_BIB, jogo: {
    jogador: () => jogador, noVeiculo: () => !!jogador.veiculo, toast: m => mostrarToast(m),
    pers: () => (usandoPersLeve ? null : persAtual.inst),
    garantirCompleto: async () => { if (usandoPersLeve) await carregarPersonagem(persIdx); },
    entrar: (pos, plat) => comFade(() => { sairMira(); irPara(pos, plat); }),
    sair: pos => comFade(() => irPara(pos, null)),
    travar: v => { travado = v; if (v) { armas.gatilho(false); elPrompt.classList.add('oculto'); } snapCam = true; },
    posicionar: pos => irPara(pos, jogador.plataforma),
  } });
  try { await missao.carregar(); await loja.carregar(); } catch (e) { console.warn('missão/loja não carregaram', e); }
  armas.aoDisparoSniper = d => balacam.disparar(d);
  armas.aoAtirar = (ponto, id, obj) => { missao.aoTiroComum(ponto, id); danoPorTiro(obj, ponto, id); };
  armas.aoSemMunicao = id => mostrarToast(id === 'sniper' ? 'Sniper sem balas! Compre na Loja de Munição ($ no minimapa).' : 'Sem munição de reserva: compre na Loja ($ no minimapa).');
  const missaoEmCurso = () => ['ativa', 'percebeu', 'falha', 'vitoria'].includes(missao.estado);
  function interacaoAtual() {
    if (modo !== 'jogo' || travado || balacam.ativa) return null;
    return loja.interacao() || missao.interacao();
  }

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

  // ---- Entradas (Teclado + Mouse + Multi-Touch Mobile)
  const teclas = new Set();
  const touch = { mx: 0, mz: 0, acel: false, freio: false, esq: false, dir: false, drift: false, correr: false, pular: false };

  let camModo = 0; // 0 = 3ª pessoa, 1 = capô/1ª pessoa, 2 = aérea
  let camYaw = -0.35;
  let camPitch = 0.22;
  let camDist = 5.6;
  let snapCam = true;
  let arrastando = false;
  let camPointerId = null;
  let ultimoX = 0, ultimoY = 0;
  let tempoSemMouse = 10;

  function acharVeiculoPerto() {
    if (jogador.plataforma) return null;
    let melhor = null, bestD = 5.4;
    for (const v of veiculos) {
      if (v.queimado) continue;
      const d = Math.hypot(v.x - jogador.x, v.z - jogador.z);
      if (d < bestD) { bestD = d; melhor = v; }
    }
    return melhor;
  }

  function entrarOuSairVeiculo() {
    som.desbloquear();
    if (jogador.veiculo) {
      const v = jogador.veiculo;
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
      if (perto.api?.ferr) {
        const ex = perto.api.ferr.eixos;
        mostrarToast(`${perto.nome} · ` + (ex[0].id === 'vibracao' ? '1: liga/desliga a vibração' : ex.map((e, i) => `${2 * i + 1}/${2 * i + 2} ${e.nome}`).join(' · ')));
        touch.ferrEixo = 0; atualizarBotaoEixo();
      } else mostrarToast(`Dirigindo: ${perto.nome}${perto.temSirene ? ' (L = Sirene)' : ''}`);
    }
    touch.acel = touch.freio = touch.esq = touch.dir = touch.drift = touch.pular = false;
    atualizarHudModo();
  }

  function atualizarHudModo() {
    const dir = !!jogador.veiculo;
    elVel.classList.toggle('oculto', !dir);
    elModoPe.classList.toggle('oculto', dir);
    // Alterna controles touch entre modo a pé (joystick) e dirigindo (volante + pedais)
    $('touch-pe-esq')?.classList.toggle('oculto', dir);
    $('touch-pe-dir')?.classList.toggle('oculto', dir);
    $('touch-carro-esq')?.classList.toggle('oculto', !dir);
    $('touch-carro-dir')?.classList.toggle('oculto', !dir);
    $('touch-ferr')?.classList.toggle('oculto', !(dir && jogador.veiculo.api?.ferr));
    if (dir) {
      elVeiculoNome.textContent = jogador.veiculo.nome;
      $('btn-sirene').classList.toggle('oculto', !jogador.veiculo.temSirene);
      $('btn-sirene').classList.toggle('ativo', !!jogador.veiculo.sirene);
    } else {
      $('btn-sirene').classList.add('oculto');
    }
  }

  // ---- T. rex da Selva Jurássica (carregado em segundo plano sem travar o início do jogo!)
  const trexOlharAlvo = new THREE.Vector3();
  const trexState = {
    inst: null,
    carregando: false,
    carregado: false,
    erro: false,
    x: 494,
    z: 274,
    rumo: Math.PI * 0.85, // rad em atan2(dz, dx) — no GLB, +X é frente, logo rotation.y = -rumo
    vel: 3.4,
    dist: 0,
    estado: 'patrulha', // 'patrulha' | 'rugindo' | 'perseguindo' | 'mordendo' | 'morto'
    hp: 500, tMorto: 0,
    timerEstado: 0,
    patrulhaAng: 2.8,
    avisoCooldown: 0,
    rugidoCooldown: 0,
    quadroAnim: 0,
  };

  function sincronizarTrexQualidade() {
    if (!trexState.inst) return;
    trexState.inst.definirQualidade({
      pbr: qualAtual.pbr,
      sombra: qualAtual.sombras && qualAtual.id === 'alto',
    });
  }

  function garantirTrex(avisar = false) {
    if (trexState.carregado) return Promise.resolve(trexState.inst);
    if (trexState.carregando) {
      if (avisar) mostrarToast('🦖 Carregando T. rex na Selva…');
      return trexState._prom;
    }
    trexState.carregando = true;
    if (avisar) mostrarToast('🦖 Carregando T. rex na Selva…');
    trexState._prom = criarTrex({
      url: `${BASE_BIB}/animais/trex/trex.glb`,
      pbr: qualAtual.pbr,
      sombra: qualAtual.sombras && qualAtual.id === 'alto',
    }).then(inst => {
      trexState.inst = inst;
      trexState.carregado = true;
      trexState.carregando = false;
      inst.grupo.position.set(trexState.x, 0.05, trexState.z);
      inst.grupo.rotation.set(0, -trexState.rumo, 0);
      inst.posar({ dist: 0, vel: 3.2, t: 0, bocaK: 0.72 });
      inst.grupo.visible = false;
      scene.add(inst.grupo);
      if (Math.hypot(jogador.x - SELVA_INFO.cx, jogador.z - SELVA_INFO.cz) < 120) {
        mostrarToast('🦖 O T. rex apareceu na clareira!');
      }
      return inst;
    }).catch(err => {
      console.warn('T. rex load skip:', err);
      trexState.carregando = false;
      trexState.erro = true;
      return null;
    });
    return trexState._prom;
  }

  function atualizarTrex(dt, t, px, py, pz) {
    const tr = trexState;
    if (tr.estado === 'morto') {
      tr.tMorto += dt;
      if (tr.inst) { const u = Math.min(1, tr.tMorto / 1.2); tr.inst.grupo.rotation.set(0, -tr.rumo, 0); tr.inst.grupo.rotateX(u * u * 1.45); tr.inst.grupo.position.y = 0.05 + u * 0.2; }
      if (tr.tMorto > 90) { tr.estado = 'patrulha'; tr.hp = 500; tr.x = 494; tr.z = 274; if (tr.inst) tr.inst.grupo.rotation.set(0, -tr.rumo, 0); }
      return;
    }
    tr.avisoCooldown = Math.max(0, tr.avisoCooldown - dt);
    tr.rugidoCooldown = Math.max(0, tr.rugidoCooldown - dt);

    const { cx, cz, clareiraR, lagoX, lagoZ, lagoR } = SELVA_INFO;
    const distJog = Math.hypot(px - tr.x, pz - tr.z);
    const distJogCentro = Math.hypot(px - cx, pz - cz);
    const jogNaSelva = distJogCentro < 68;

    // Se o jogador se aproximar da selva, garante que o T. rex comece a baixar imediatamente
    if (!tr.carregado && !tr.carregando && !tr.erro && distJogCentro < 170) {
      garantirTrex(false);
    }

    // IA do T. rex (patrulha tranquila → rugido de alerta → perseguição na clareira → bote leve)
    let alvoX = tr.x, alvoZ = tr.z, velAlvo = 3.4;
    let rugido = 0, mordida = 0, parado = 0, usarOlhar = false;

    if (tr.estado === 'patrulha') {
      tr.patrulhaAng += dt * 0.16;
      const rPat = 21 + Math.sin(tr.patrulhaAng * 2) * 5;
      alvoX = cx + Math.cos(tr.patrulhaAng) * rPat;
      alvoZ = cz + Math.sin(tr.patrulhaAng) * (rPat * 0.85);
      velAlvo = 3.6;

      if (jogNaSelva && distJog < 44) {
        tr.estado = 'rugindo';
        tr.timerEstado = 1.35;
        if (tr.rugidoCooldown <= 0) {
          som.tocarRugidoTrex(Math.max(0.25, 1 - distJog / 65));
          tr.rugidoCooldown = 5.5;
        }
        if (tr.avisoCooldown <= 0) {
          mostrarToast('🦖 O T. rex viu você! CORRA!');
          tr.avisoCooldown = 14;
        }
      }
    } else if (tr.estado === 'rugindo') {
      tr.timerEstado -= dt;
      alvoX = px; alvoZ = pz;
      velAlvo = 0;
      parado = 1;
      usarOlhar = true;
      rugido = Math.sin(Math.max(0, Math.min(1, 1 - tr.timerEstado / 1.35)) * Math.PI);
      if (tr.timerEstado <= 0) {
        tr.estado = (jogNaSelva && distJog < 58) ? 'perseguindo' : 'patrulha';
      }
    } else if (tr.estado === 'perseguindo') {
      if (!jogNaSelva || distJog > 64) {
        tr.estado = 'patrulha';
      } else {
        alvoX = px; alvoZ = pz;
        velAlvo = 7.8; // mais rápido que corrida a pé (6.4 m/s), mas fácil de despistar de carro!
        usarOlhar = true;
        if (distJog < 7.2) {
          tr.estado = 'mordendo';
          tr.timerEstado = 1.15;
          if (tr.rugidoCooldown <= 0) {
            som.tocarRugidoTrex(1.0);
            tr.rugidoCooldown = 4.5;
          }
          // Empurrão brincalhão para dar emoção sem tela de game over
          const angEmp = Math.atan2(px - tr.x, pz - tr.z);
          if (jogador.veiculo) {
            const v = jogador.veiculo;
            v.vel = Math.max(v.vel, 10);
            v.dano?.(30, new THREE.Vector3(v.x, 1.2, v.z)); vida.dano(8, 'T. rex');
            if (tr.avisoCooldown <= 0) {
              mostrarToast('🦖 O T. rex bateu no carro! Acelere!');
              tr.avisoCooldown = 7;
            }
          } else {
            const empurrado = resolverColisoes(jogador.x + Math.sin(angEmp) * 7.5, jogador.z + Math.cos(angEmp) * 7.5, 0.45);
            jogador.x = empurrado.x;
            jogador.z = empurrado.z;
            jogador.vy = 4.5;
            jogador.noChao = false; jogador.yPico = jogador.y;
            vida.dano(35, 'T. rex');
            if (tr.avisoCooldown <= 0) {
              mostrarToast('🦖 Quase virou lanche do T. rex!');
              tr.avisoCooldown = 7;
            }
          }
        }
      }
    } else if (tr.estado === 'mordendo') {
      tr.timerEstado -= dt;
      alvoX = px; alvoZ = pz;
      velAlvo = 0.8;
      usarOlhar = true;
      const u = Math.max(0, Math.min(1, 1 - tr.timerEstado / 1.15));
      mordida = u < 0.7 ? u / 0.7 : (1 - (u - 0.7) / 0.3);
      rugido = u > 0.55 ? (u - 0.55) / 0.45 : 0;
      if (tr.timerEstado <= 0) {
        tr.estado = 'rugindo';
        tr.timerEstado = 1.0;
      }
    }

    // Movimento suave mantendo o T. rex dentro da clareira e fora do fundo da lagoa
    const dx = alvoX - tr.x, dz = alvoZ - tr.z;
    const distAlvo = Math.hypot(dx, dz);
    if (distAlvo > 0.5) {
      const rumoDesejado = Math.atan2(dz, dx);
      let diff = (rumoDesejado - tr.rumo + Math.PI) % (Math.PI * 2) - Math.PI;
      if (diff < -Math.PI) diff += Math.PI * 2;
      const maxTurn = (tr.estado === 'perseguindo' ? 2.4 : 1.55) * dt;
      tr.rumo += Math.max(-maxTurn, Math.min(maxTurn, diff));
    }
    tr.vel += (velAlvo - tr.vel) * Math.min(1, dt * 4.5);
    let nx = tr.x + Math.cos(tr.rumo) * tr.vel * dt;
    let nz = tr.z + Math.sin(tr.rumo) * tr.vel * dt;

    // Mantém o T. rex na reserva da selva (não invade o centro da cidade)
    const dCentro = Math.hypot(nx - cx, nz - cz);
    const maxRaio = clareiraR - 3;
    if (dCentro > maxRaio) {
      nx = cx + ((nx - cx) / dCentro) * maxRaio;
      nz = cz + ((nz - cz) / dCentro) * maxRaio;
    }
    // Contorna a lagoa
    const dLago = Math.hypot(nx - lagoX, nz - lagoZ);
    if (dLago < lagoR + 2.5 && dLago > 0.01) {
      nx = lagoX + ((nx - lagoX) / dLago) * (lagoR + 2.5);
      nz = lagoZ + ((nz - lagoZ) / dLago) * (lagoR + 2.5);
    }
    tr.dist += Math.hypot(nx - tr.x, nz - tr.z);
    tr.x = nx;
    tr.z = nz;

    if (!tr.inst) return;
    const visDist = qualAtual.viewDist + 45;
    const visivel = distJog <= visDist;
    tr.inst.grupo.visible = visivel;
    if (!visivel) return;

    tr.inst.grupo.position.set(tr.x, 0.05, tr.z);
    tr.inst.grupo.rotation.set(0, -tr.rumo, 0);

    // Atualiza IK/ossos a 60 Hz de perto e 30 Hz quando > 60 m (zero impacto no FPS!)
    tr.quadroAnim++;
    if (distJog > 60 && (tr.quadroAnim & 1) === 1) return;

    let olharVec = null;
    if (usarOlhar) {
      trexOlharAlvo.set(px, py + 0.4, pz);
      olharVec = trexOlharAlvo;
    }
    tr.inst.posar({
      dist: tr.dist,
      vel: tr.vel,
      olhar: olharVec,
      rugido,
      mordida,
      parado,
      t,
      bocaK: 0.72,
    });
  }

  function teleportar(pt) {
    sairMira(); jogador.plataforma = null;
    if (loja.dentro) { loja.dentro = false; loja.grupo.visible = false; }
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
    minimapTimer = 99;
    if (pt.id === 'selva' && !trexState.carregado) {
      garantirTrex(true);
    } else {
      mostrarToast(`Teleportado para: ${pt.nome}`);
    }
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

    sincronizarViaturaPolicia(q.pbr, q.sombras);
    sincronizarTrexQualidade();
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

  // Modo Tela Cheia + trava em Horizontal (landscape) no celular
  async function alternarTelaCheiaHorizontal() {
    try {
      if (!document.fullscreenElement) {
        const el = document.documentElement;
        if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        if (screen.orientation?.lock) {
          await screen.orientation.lock('landscape').catch(() => {});
        }
        mostrarToast('Modo Horizontal / Tela Cheia ativado');
      } else {
        if (screen.orientation?.unlock) {
          try { screen.orientation.unlock(); } catch (_) {}
        }
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    } catch (_) {
      mostrarToast('Gire o celular de lado para o modo horizontal');
    }
  }

  document.addEventListener('fullscreenchange', () => {
    const ativo = !!document.fullscreenElement;
    const btnT = $('btn-tela');
    if (btnT) {
      btnT.classList.toggle('ativo', ativo);
      btnT.textContent = ativo ? '⛶ Sair' : '⛶ Horizontal';
    }
    setTimeout(() => {
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    }, 120);
  });

  addEventListener('orientationchange', () => {
    setTimeout(() => {
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    }, 180);
  });

  addEventListener('keydown', e => {
    const code = e.code;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) e.preventDefault();
    if (!teclas.has(code)) {
      if (modo !== 'jogo') { /* abertura e sala tratam as próprias teclas */ }
      else if (code === 'KeyE') { const it = interacaoAtual(); if (it) it.fazer(); else entrarOuSairVeiculo(); }
      else if (code === 'KeyZ') { if (mira.ativa) sairMira(true); else entrarMira(true); }
      else if (code === 'Escape' && mira.ativa) sairMira(true);
      else if (code === 'KeyP') entrarSala();
      else if (code === 'KeyQ') ciclarQualidade();
      else if (jogador.veiculo?.api?.ferr && /^Digit[1-8]$/.test(code)) {
        const fe = jogador.veiculo.api.ferr, i = Math.floor((+code.slice(5) - 1) / 2);
        if (fe.eixos[i]?.id === 'vibracao' && code === 'Digit1') { fe.definir(i, fe.eixos[i].v > 0.5 ? 0 : 1); mostrarToast(fe.eixos[i].v > 0.5 ? 'Vibração LIGADA' : 'Vibração desligada'); }
      }
      else if (code === 'Digit1') trocarArma('pistola');
      else if (code === 'Digit2') trocarArma('metralhadora');
      else if (code === 'Digit3') trocarArma('sniper');
      else if (code === 'KeyG') trocarArma(null);
      else if (code === 'KeyX') armas.recarregar();
      else if (code === 'KeyN') { ehNoite = !ehNoite; aplicarClima(); mostrarToast(ehNoite ? 'Modo Noite ativado' : 'Modo Dia ativado'); }
      else if (code === 'KeyR') { ehChuva = !ehChuva; rainLines.visible = ehChuva; aplicarClima(); mostrarToast(ehChuva ? 'Chuva e pista molhada' : 'Tempo limpo'); }
      else if (code === 'KeyV') { camModo = (camModo + 1) % 3; mostrarToast(['Câmera: 3ª Pessoa', 'Câmera: Capô / 1ª Pessoa', 'Câmera: Aérea (Drone)'][camModo]); }
      else if (code === 'KeyC') { carregarPersonagem(persIdx + 1).then(() => mostrarToast(`Personagem: ${PERSONAGENS_DEF[persIdx].nome}`)); }
      else if (code === 'KeyL' && jogador.veiculo?.temSirene) {
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

  // Giro de câmera com suporte a multi-touch (não interfere no joystick nem nos pedais!)
  renderer.domElement.addEventListener('pointerdown', e => {
    if (e.target !== renderer.domElement || camPointerId !== null) return;
    camPointerId = e.pointerId;
    arrastando = true;
    ultimoX = e.clientX; ultimoY = e.clientY;
  });
  renderer.domElement.addEventListener('mousedown', e => {
    if (modo !== 'jogo' || travado || balacam.ativa) return;
    if (e.button === 2) entrarMira(false);
    if (e.button === 0 && armas.ativa && !jogador.veiculo) armas.gatilho(true);
  });
  addEventListener('mouseup', e => {
    if (e.button === 2 && mira.ativa && !mira.fixa) sairMira(false);
    if (e.button === 0) armas.gatilho(false);
  });
  renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('pointermove', e => {
    if (!arrastando || e.pointerId !== camPointerId) return;
    const dx = e.clientX - ultimoX, dy = e.clientY - ultimoY;
    ultimoX = e.clientX; ultimoY = e.clientY;
    if (mira.ativa) {                                                            // luneta: quanto mais zoom, mais fino o ajuste
      const k = mira.fov / 56 * 0.85;
      mira.yaw -= dx * 0.0055 * k; mira.pitch = Math.max(-1.2, Math.min(0.6, mira.pitch - dy * 0.0045 * k));
      return;
    }
    camYaw -= dx * 0.0055;
    camPitch = Math.max(0.06, Math.min(1.15, camPitch + dy * 0.0045));
    tempoSemMouse = 0;
  });
  const soltarCam = e => {
    if (e.pointerId !== camPointerId) return;
    arrastando = false;
    camPointerId = null;
    armas.gatilho(false);
  };
  addEventListener('pointerup', soltarCam);
  addEventListener('pointercancel', soltarCam);
  renderer.domElement.addEventListener('wheel', e => {
    if (mira.ativa) { mira.fov = Math.max(3.5, Math.min(30, mira.fov * (1 + e.deltaY * 0.0012))); return; }
    camDist = Math.max(3.5, Math.min(18, camDist + e.deltaY * 0.006));
  }, { passive: true });

  // Botões da HUD
  $('btn-qualidade').onclick = ciclarQualidade;
  $('btn-noite').onclick = () => { ehNoite = !ehNoite; aplicarClima(); };
  $('btn-chuva').onclick = () => { ehChuva = !ehChuva; rainLines.visible = ehChuva; aplicarClima(); };
  $('btn-cam').onclick = () => { camModo = (camModo + 1) % 3; mostrarToast(['Câmera: 3ª Pessoa', 'Câmera: Capô / 1ª Pessoa', 'Câmera: Aérea'][camModo]); };
  $('btn-pers').onclick = () => carregarPersonagem(persIdx + 1).then(() => mostrarToast(`Personagem: ${PERSONAGENS_DEF[persIdx].nome}`));
  $('btn-tela').onclick = alternarTelaCheiaHorizontal;
  $('btn-ativar-horizontal').onclick = () => { $('aviso-girar').classList.add('dispensado'); alternarTelaCheiaHorizontal(); };
  $('btn-fechar-girar').onclick = () => $('aviso-girar').classList.add('dispensado');
  $('btn-sirene').onclick = () => {
    if (!jogador.veiculo?.temSirene) return;
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

  // Controles touch (celulares/tablets em modo horizontal e vertical)
  const joyBase = $('joy-base'), joyKnob = $('joy-knob');
  let joyId = null, joyCx = 0, joyCy = 0;
  joyBase.addEventListener('pointerdown', e => {
    e.stopPropagation();
    joyId = e.pointerId; joyBase.setPointerCapture(joyId);
    const r = joyBase.getBoundingClientRect();
    joyCx = r.left + r.width / 2; joyCy = r.top + r.height / 2;
  });
  joyBase.addEventListener('pointermove', e => {
    if (e.pointerId !== joyId) return;
    const maxR = 40;
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

  function bindSegurar(id, onChange) {
    const el = $(id);
    if (!el) return;
    let pid = null;
    el.addEventListener('pointerdown', e => {
      e.stopPropagation(); e.preventDefault();
      pid = e.pointerId;
      try { el.setPointerCapture(pid); } catch (_) {}
      el.classList.add('ativo');
      onChange(true);
    });
    const soltar = e => {
      if (pid !== null && e.pointerId !== pid) return;
      pid = null;
      el.classList.remove('ativo');
      onChange(false);
    };
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
  }

  $('touch-entrar').onclick = () => { const it = interacaoAtual(); if (it) it.fazer(); else entrarOuSairVeiculo(); };
  $('touch-mirar').onclick = () => { if (mira.ativa) sairMira(true); else entrarMira(true); };
  $('touch-sair').onclick = entrarOuSairVeiculo;
  bindSegurar('touch-pular', v => { touch.pular = v; });
  bindSegurar('touch-correr', v => { touch.correr = v; });
  bindSegurar('touch-esq', v => { touch.esq = v; });
  bindSegurar('touch-dir', v => { touch.dir = v; });
  bindSegurar('touch-acel', v => { touch.acel = v; });
  bindSegurar('touch-freio', v => { touch.freio = v; });
  bindSegurar('touch-drift', v => { touch.drift = v; });
  bindSegurar('touch-ferr-mais', v => { touch.ferrMais = v; });
  bindSegurar('touch-ferr-menos', v => { touch.ferrMenos = v; });
  $('touch-ferr-eixo').onclick = () => {
    const fe = jogador.veiculo?.api?.ferr; if (!fe) return;
    if (fe.eixos[0].id === 'vibracao') { fe.definir(0, fe.eixos[0].v > 0.5 ? 0 : 1); mostrarToast(fe.eixos[0].v > 0.5 ? 'Vibração LIGADA' : 'Vibração desligada'); return; }
    touch.ferrEixo = ((touch.ferrEixo || 0) + 1) % fe.eixos.length; atualizarBotaoEixo();
  };
  function atualizarBotaoEixo() { const fe = jogador.veiculo?.api?.ferr; if (fe) $('touch-ferr-eixo').textContent = fe.eixos[0].id === 'vibracao' ? 'Vibrar' : fe.eixos[touch.ferrEixo || 0].nome; }
  $('touch-arma').onclick = () => {                                              // passa pelas armas que você já tem
    const ordem = [null, 'pistola', 'metralhadora', 'sniper'].filter(id => !id || armas.possui.has(id));
    if (ordem.length === 1) { mostrarToast('Você ainda não tem armas: procure os ícones P, M e S no minimapa.'); return; }
    trocarArma(ordem[(ordem.indexOf(armas.atual) + 1) % ordem.length] ?? armas.atual);
  };
  bindSegurar('touch-atirar', v => armas.gatilho(v));

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

    // Selva Jurássica (reserva verde-escura + clareira + lagoa + marcador do T. rex)
    if (cidade.mapaInfo.selva) {
      const sv = cidade.mapaInfo.selva;
      const [sx0, sz0] = toMM(sv.minX, sv.minZ);
      mmCtx.fillStyle = '#14532d';
      mmCtx.fillRect(sx0, sz0, (sv.maxX - sv.minX) * esc, (sv.maxZ - sv.minZ) * esc);
      const [scx, scz] = toMM(sv.cx, sv.cz);
      mmCtx.fillStyle = '#785c3e';
      mmCtx.beginPath();
      mmCtx.arc(scx, scz, 32 * esc, 0, Math.PI * 2);
      mmCtx.fill();
      const [slx, slz] = toMM(sv.lagoX, sv.lagoZ);
      mmCtx.fillStyle = '#0d9488';
      mmCtx.beginPath();
      mmCtx.arc(slx, slz, sv.lagoR * esc, 0, Math.PI * 2);
      mmCtx.fill();
    }

    // Canteiro de obras
    {
      const [kx, kz] = toMM(140, -30); mmCtx.fillStyle = '#8a6a48'; mmCtx.fillRect(kx, kz, 80 * esc, 45 * esc);
    }
    // Veículos dirigíveis
    for (const v of veiculos) {
      const [vx, vz] = toMM(v.x, v.z);
      mmCtx.fillStyle = v.ehPolicia ? '#38bdf8' : '#f59e0b';
      mmCtx.beginPath();
      mmCtx.arc(vx, vz, v.ehPolicia ? 4 : 2.8, 0, Math.PI * 2);
      mmCtx.fill();
    }

    // T. rex (ponto vermelho pulsante na selva)
    {
      const [tx, tz] = toMM(trexState.x, trexState.z);
      mmCtx.fillStyle = '#ef4444';
      mmCtx.beginPath();
      mmCtx.arc(tx, tz, 4.4, 0, Math.PI * 2);
      mmCtx.fill();
      mmCtx.strokeStyle = '#fecaca';
      mmCtx.lineWidth = 1.2;
      mmCtx.stroke();
    }

    missao.desenharMinimapa(mmCtx, toMM, W, H);
    // Checkpoint ativo (pulsante)
    const cp = CHECKPOINTS[cpIdx];
    if (!missaoEmCurso()) {
    const [cpx, cpz] = toMM(cp.x, cp.z);
    const clampedX = Math.max(8, Math.min(W - 8, cpx));
    const clampedZ = Math.max(8, Math.min(H - 8, cpz));
    mmCtx.fillStyle = '#facc15';
    mmCtx.beginPath();
    mmCtx.arc(clampedX, clampedZ, 5, 0, Math.PI * 2);
    mmCtx.fill();
    }

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

  // ---- Abertura (passeio pulável pela cidade) → Sala (personagem, veículo e local) → Jogo
  let modo = 'jogo';
  let camFixa = null;                                                       // câmera parada (miniaturas e testes)
  for (const v of veiculos) v.vaga = { x: v.x, z: v.z, ry: v.ry };          // vaga original de cada veículo
  for (const v of veiculos) {
    danoVeiculo(v, efeitos, { aoExplodir: q => {
      const dj = Math.hypot(jogador.x - q.x, jogador.z - q.z);
      if (jogador.veiculo === q) { sairSemAnimar(); persAtual.inst.obj.visible = true; vida.dano(55, 'explosão'); }
      else if (dj < 7) vida.dano(60 * (1 - dj / 7), 'explosão');
      for (const o of veiculos) if (o !== q && Math.hypot(o.x - q.x, o.z - q.z) < 6) o.dano?.(25);
      mostrarToast(`💥 ${q.nome} explodiu!`);
    } });
    v.aoVoltar = () => { if (jogador.veiculo === v) return false; colocarVeiculo(v, v.vaga.x, v.vaga.z, v.vaga.ry); return true; };
  }
  const abertura = new Abertura(camera, {
    aoTerminar: () => entrarSala(),
    aoPlano: (local, plano) => {
      veiculoPolicia.sirene = !!plano.sirene;
      if (plano.trex && trexState.carregado) {
        trexState.estado = 'rugindo'; trexState.timerEstado = 2.3;
        som.tocarRugidoTrex(0.8);
      }
    },
    estado: () => ({ trex: trexState.carregado ? { x: trexState.x, z: trexState.z, rumo: trexState.rumo } : null }),
  });
  const LONGE = [1e5, 0, 1e5];
  const _abAtualizar = abertura.atualizar.bind(abertura);
  abertura.atualizar = dt => {
    const r = _abAtualizar(dt);
    if (r) r.trexAlvo = r.plano.trex ? [camera.position.x, 0, camera.position.z] : LONGE;
    return r;
  };

  function colocarVeiculo(v, x, z, ry) {
    v.x = x; v.z = z; v.ry = ry; v.vel = 0; v.steer = 0; v.sirene = false;
    v.obj.position.set(x, 0, z); v.obj.rotation.set(0, ry, 0);
    v.api?.freio?.(false); v.api?.re?.(false);
  }
  function sairSemAnimar() {
    const v = jogador.veiculo; if (!v) return;
    jogador.veiculo = null; v.vel = 0; v.sirene = false;
    v.api?.freio?.(false); v.api?.re?.(false);
    atualizarHudModo();
  }
  // põe o veículo escolhido no ponto do local (os outros voltam às vagas; quem estiver no caminho troca de vaga com ele)
  // e o personagem ao lado da porta do motorista
  function posicionarEscolha(esc) {
    const pt = PONTOS_TELEPORTE.find(p => p.id === esc.local) || PONTOS_TELEPORTE[0];
    sairSemAnimar();
    for (const v of veiculos) colocarVeiculo(v, v.vaga.x, v.vaga.z, v.vaga.ry);
    const v = veiculos.find(o => o.id === esc.veic) || null;
    if (v) {
      for (const o of veiculos) if (o !== v && Math.hypot(o.vaga.x - pt.x, o.vaga.z - pt.z) < v.raio + o.raio + 5) colocarVeiculo(o, v.vaga.x, v.vaga.z, v.vaga.ry);
      colocarVeiculo(v, pt.x, pt.z, pt.ang);
      // personagem junto ao para-lama dianteiro esquerdo, de frente para a câmera (que fica à frente e à direita)
      const meio = v.api?.dims?.L ? v.api.dims.L / 2 : v.raio * 1.15, larg = v.api?.dims?.W ? v.api.dims.W / 2 : v.raio * 0.45;
      const fx = Math.sin(pt.ang), fz = Math.cos(pt.ang), ex = Math.cos(pt.ang), ez = -Math.sin(pt.ang);
      const res = resolverColisoes(pt.x + fx * meio * 0.55 + ex * (larg + 0.9), pt.z + fz * meio * 0.55 + ez * (larg + 0.9), 0.45);
      jogador.x = res.x; jogador.z = res.z;
    } else { jogador.x = pt.x; jogador.z = pt.z; }
    jogador.y = CALCADA; jogador.vy = 0; jogador.noChao = true; jogador.ry = pt.ang - 0.45;
    persAtual.inst.obj.position.set(jogador.x, jogador.y, jogador.z);
    persAtual.inst.obj.rotation.y = jogador.ry;
    if (pt.id === 'selva') garantirTrex(false);
    salaCentro.set(v ? (jogador.x + v.x) / 2 : jogador.x, 0, v ? (jogador.z + v.z) / 2 : jogador.z);
    salaRaio = v ? Math.max(7.5, v.raio * 2.4 + 3.5) : 5.2;
    salaAltura = v ? 2.2 + v.raio * 0.55 : 1.7;
    salaAlvoY = v ? 1.0 + v.raio * 0.1 : 1.0;
    salaBase = pt.ang - (v ? 0.62 : 0.25); tSala = 0;
  }

  let tokenSala = 0;
  async function aplicarEscolha(esc) {
    const token = ++tokenSala;
    sala.ocupado(true);
    try {
      const idx = Math.max(0, PERSONAGENS_DEF.findIndex(d => d.id === esc.pers));
      if (idx === 0 && !qualAtual.personagemCompleto) { if (!usandoPersLeve) ativarPersonagemLeve(); }
      else if (usandoPersLeve || persIdx !== idx || !persAtual) await carregarPersonagem(idx);
    } catch (e) { console.warn('personagem não carregou', e); }
    if (token !== tokenSala) return;
    persAtual.inst.obj.visible = true;
    posicionarEscolha(esc);
    sala.ocupado(false);
  }

  // câmera da sala: gira devagar em volta do personagem e do carro, com o assunto fora do painel
  const salaCentro = new THREE.Vector3(146, 0, 166);
  let salaRaio = 8, salaAltura = 2.6, salaAlvoY = 1, salaBase = 0, tSala = 0;
  const _dirS = new THREE.Vector3(), _dirR = new THREE.Vector3(), _alvoS = new THREE.Vector3(), CIMA = new THREE.Vector3(0, 1, 0);
  function atualizarCamSala(dt) {
    tSala += dt;
    const salaAng = salaBase + 0.42 * Math.sin(tSala * 0.28);                                   // balanço suave em 3/4 de frente
    camera.position.set(salaCentro.x + Math.sin(salaAng) * salaRaio, salaAltura, salaCentro.z + Math.cos(salaAng) * salaRaio);
    _alvoS.set(salaCentro.x, salaAlvoY, salaCentro.z);
    _dirS.subVectors(_alvoS, camera.position).normalize();
    _dirR.crossVectors(_dirS, CIMA).normalize();
    if (innerWidth > 760 && innerHeight > 520) _alvoS.addScaledVector(_dirR, -salaRaio * 0.3);   // painel à esquerda: assunto à direita
    else _alvoS.y -= salaRaio * 0.16;                                                          // painel embaixo: assunto mais para cima
    camera.lookAt(_alvoS);
    return { foco: { x: salaCentro.x, z: salaCentro.z }, trexAlvo: LONGE };
  }

  const MINI = './jogo/sala/miniaturas';
  const ICONE_PERS = { policial: '👮', jovem_a: '🧑', bombeiro: '🧑‍🚒', astronauta: '👩‍🚀', corredor: '🏃', silhueta: '👤' };
  const DESC_PERS = { policial: 'Patrulha da cidade', jovem_a: 'Morador de Hryz', bombeiro: 'Corpo de bombeiros', astronauta: 'Visitante espacial', corredor: 'Rápido e colorido', silhueta: 'O vulto do canal' };
  const sala = new Sala({
    pers: PERSONAGENS_DEF.map(d => ({ id: d.id, nome: d.nome, desc: DESC_PERS[d.id] || '', icone: ICONE_PERS[d.id] || '🧍', img: `${MINI}/pers-${d.id}.webp` })),
    veic: [{ id: 'nenhum', nome: 'A pé', desc: 'Começar andando', icone: '🚶' },
      ...veiculos.map(v => ({ id: v.id, nome: v.nome, desc: v.temSirene ? 'Com sirene (L)' : '', icone: '🚗', img: `${MINI}/veic-${v.id}.webp` }))],
    local: PONTOS_TELEPORTE.map(p => ({ id: p.id, nome: p.nome.replace(/^\S+\s(?=Selva)/, ''), icone: '📍', img: `${MINI}/local-${p.id}.webp` })),
  }, { pers: 'policial', veic: 'p71', local: 'delegacia' }, {
    aoMudar: esc => aplicarEscolha(esc),
    aoJogar: async esc => {
      await aplicarEscolha(esc);
      sala.fechar();
      modo = 'jogo';
      const v = veiculos.find(o => o.id === esc.veic);
      if (v) { jogador.veiculo = v; persAtual.inst.obj.visible = false; jogador.x = v.x; jogador.z = v.z; }
      camYaw = v ? v.ry : jogador.ry; camPitch = 0.32; snapCam = true; minimapTimer = 99;
      atualizarHudModo();
      som.desbloquear();
      const pt = PONTOS_TELEPORTE.find(p => p.id === esc.local);
      if (missao.estado === 'inativa') missao.iniciar();
      mostrarToast(v ? `Bem-vindo a Hryz City! ${v.nome} · ${pt?.nome ?? ''}${v.temSirene ? ' · L = sirene' : ''}` : `Bem-vindo a Hryz City! ${pt?.nome ?? ''}`);
    },
    aoRever: () => { sala.fechar(); iniciarAbertura(); },
  });

  function entrarSala() {
    sairMira(); jogador.plataforma = null; travado = false; persAtual.inst.obj.rotation.x = 0;
    if (loja.dentro) { loja.dentro = false; loja.grupo.visible = false; }
    sairSemAnimar();
    armas.equipar(null); atualizarHudArma();
    modo = 'sala';
    veiculoPolicia.sirene = false;
    sala.abrir();
    aplicarEscolha(sala.escolha);
  }
  function iniciarAbertura() {
    sairSemAnimar();
    for (const v of veiculos) colocarVeiculo(v, v.vaga.x, v.vaga.z, v.vaga.ry);
    persAtual.inst.obj.visible = false;
    modo = 'abertura';
    abertura.iniciar();
  }
  $('btn-sala').onclick = () => { if (modo === 'jogo') entrarSala(); };

  // ---- Aplicar qualidade + clima inicial & esconder tela de carga
  aplicarQualidade(qualAtual.id, false);
  atualizarHudModo();
  atualizarProgresso(1, 'Cidade pronta!');
  setTimeout(() => elTelaCarga.classList.add('oculto'), 220);
  if (Q.has('direto')) { modo = 'jogo'; if (!Q.has('semmissao')) missao.iniciar(); }   // (testes e desenvolvimento: pula abertura e sala)
  else if (Q.has('sala')) entrarSala();
  else iniciarAbertura();
  // Baixa o T. rex em segundo plano logo após o jogo abrir para estar pronto ao visitar a Selva
  setTimeout(() => garantirTrex(false), 900);

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
    const dtReal = dtFixo ?? Math.min(relogio.getDelta(), 0.05);
    // câmera da bala: o mundo anda em câmera lenta (escala) enquanto a câmera segue a bala no tempo real
    const rBala = balacam.ativa ? balacam.atualizar(dtReal) : null;
    const dt = dtReal * (rBala ? rBala.escala : 1);
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
      if (v.api?.luzes) v.api.luzes(tTotal, v.sirene || (v.maquina && v === jogador.veiculo) ? 'ligado' : 'off');   // máquina em uso: giroflex âmbar
    }

    const tFrente = (touch.acel ? 1 : 0) - (touch.freio ? 1 : 0) - touch.mz;
    const tLado = (touch.dir ? 1 : 0) - (touch.esq ? 1 : 0) + touch.mx;
    const jogando = modo === 'jogo' && !travado && !balacam.ativa && !['percebeu', 'intro'].includes(missao.estado);
    // abertura e sala: a câmera é da cena (cine.foco guia o que a cidade mostra); o jogador não se move
    let cine = null;
    if (modo === 'abertura') cine = abertura.atualizar(dt);
    if (modo === 'sala') cine = atualizarCamSala(dt);
    if (rBala) cine = { foco: rBala.foco, trexAlvo: [jogador.x, jogador.y, jogador.z] };
    const rLoja = loja.atualizar(dtReal, tTotal);
    if (rLoja) cine = { foco: rLoja.foco, trexAlvo: [1e5, 0, 1e5] };
    const rMis = modo === 'jogo' ? missao.camCena() : null;
    if (rMis) { if (mira.ativa) sairMira(); camera.position.copy(rMis.p); camera.lookAt(rMis.a); const fv = rMis.fov || 46; if (camera.fov !== fv) { camera.fov = fv; camera.updateProjectionMatrix(); } cine = { foco: { x: rMis.a.x, z: rMis.a.z }, trexAlvo: [jogador.x, jogador.y, jogador.z] }; }
    if (camFixa) { camera.position.copy(camFixa.p); camera.lookAt(camFixa.a); cine = { foco: { x: camFixa.a.x, z: camFixa.a.z }, trexAlvo: [1e5, 0, 1e5] }; }
    let frente = !jogando ? 0 : (teclas.has('KeyW') || teclas.has('ArrowUp') ? 1 : 0) - (teclas.has('KeyS') || teclas.has('ArrowDown') ? 1 : 0) + tFrente;
    let lado = !jogando ? 0 : (teclas.has('KeyD') || teclas.has('ArrowRight') ? 1 : 0) - (teclas.has('KeyA') || teclas.has('ArrowLeft') ? 1 : 0) + tLado;
    const joyMag = Math.hypot(touch.mx, touch.mz);
    const sprint = jogando && (teclas.has('ShiftLeft') || teclas.has('ShiftRight') || touch.correr || joyMag > 0.82);
    const espaco = jogando && !mira.ativa && (teclas.has('Space') || touch.pular || touch.drift);
    if (mira.ativa) {                                                            // na luneta, as setas/WASD ajustam a mira em vez de andar
      const k = mira.fov / 56;
      mira.yaw -= lado * dt * 0.55 * k; mira.pitch = Math.max(-1.2, Math.min(0.6, mira.pitch + frente * dt * 0.45 * k));
      frente = 0; lado = 0;
    }

    let focoX, focoY, focoZ, focoYaw, velAbs = 0;

    if (jogador.veiculo) {
      // ==================== DIRIGINDO ====================
      const v = jogador.veiculo;
      const gas = v.queimado ? 0 : Math.max(-1, Math.min(1, frente));
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

      // Freio de mão / drift + fumaça leve de pneu
      if (espaco) {
        v.vel *= Math.exp(-3.8 * dt);
        if (Math.abs(v.vel) > 7) fumacaDrift.emitir(v.x, v.z, v.ry, dt);
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
      if (col.bateu) {
        const imp = Math.abs(v.vel);
        if (imp > 6) { v.dano?.((imp - 6) * 2.4, v.obj.position.clone().add(new THREE.Vector3(Math.sin(v.ry) * v.raio, 1, Math.cos(v.ry) * v.raio))); if (imp > 10) vida.dano((imp - 10) * 1.6, 'batida'); som.tocarBeep?.(90, 0.12, 0.25); }
        v.vel *= -0.25;
      }
      // carro × carro: empurra o outro (mais leve anda mais), os dois amassam pela velocidade do impacto
      for (const o of veiculos) {
        if (o === v || !o.obj.visible) continue;
        const ddx = v.x - o.x, ddz = v.z - o.z, d = Math.hypot(ddx, ddz), min = (v.raio + o.raio) * 0.72;
        if (d >= min || d < 1e-3) continue;
        const nx = ddx / d, nz = ddz / d, sob = min - d, mv = v.raio * v.raio * (v.maquina ? 3 : 1), mo = o.raio * o.raio * (o.maquina ? 3 : 1);
        v.x += nx * sob * mo / (mv + mo); v.z += nz * sob * mo / (mv + mo);
        o.x -= nx * sob * mv / (mv + mo); o.z -= nz * sob * mv / (mv + mo); o.obj.position.x = o.x; o.obj.position.z = o.z;
        const imp = Math.abs(v.vel * (Math.sin(v.ry) * -nx + Math.cos(v.ry) * -nz));
        if (imp > 3) { v.dano?.(imp * 1.4); o.dano?.(imp * 1.8 * mv / (mv + mo) * 2); if (imp > 9) vida.dano((imp - 9) * 1.4, 'batida'); }
        v.vel *= imp > 3 ? -0.3 : 0.9;
      }

      v.dist += v.vel * dt;
      v.obj.position.set(v.x, (alturaChao(v.x, v.z) ?? 0.03) - 0.03, v.z);       // no canteiro a máquina desce no buraco / sobe no monte
      v.obj.rotation.set(0, v.ry, 0, 'YXZ');
      // Inclinação leve de suspensão na curva e na aceleração
      const roll = -v.steer * Math.min(Math.abs(v.vel) / 25, 1) * 0.08;
      const pitch = (gas > 0.1 ? -0.015 : (gas < -0.1 && v.vel > 2 ? 0.024 : 0));
      v.obj.rotation.z = roll;
      v.obj.rotation.x = pitch;

      // ferramentas da máquina de obra: 1/2 primeiro eixo, 3/4 segundo, 5/6 terceiro, 7/8 quarto (no celular: ▲ ▼ e o eixo escolhido)
      if (v.api?.ferr) {
        v.api.ferr.eixos.forEach((e, i) => {
          if (e.id === 'vibracao') return;
          const mais = (jogando && teclas.has('Digit' + (2 * i + 1))) || (touch.ferrEixo === i && touch.ferrMais);
          const menos = (jogando && teclas.has('Digit' + (2 * i + 2))) || (touch.ferrEixo === i && touch.ferrMenos);
          if (mais !== menos) v.api.ferr.mover(i, (mais ? 1 : -1) * dt);
        });
        if (v.api.vibrar) som.atualizarVibracao?.(v.api.vibrar(dt));
        // caçambas: a ponta abaixo do chão cava (tira terra e enche); virada para despejar, a terra cai (no basculante, se estiver embaixo)
        for (const c of v.api.cacambas || []) {
          const p = c.ponta(), h = alturaChao(p.x, p.z);
          if (h !== null && p.y < h - 0.04 && c.carga < c.cap) {
            const tirado = terreno.cavar(p.x, p.z, c.cap > 2 ? 1.3 : 0.8, Math.min(c.cap - c.carga, (c.cap > 2 ? 2.4 : 1.4) * dt));
            if (tirado > 0) { c.definirCarga(c.carga + tirado); if (Math.random() < dt * 14) efeitos.emitir('poeira', p, new THREE.Vector3((Math.random() - 0.5) * 1.5, 1.2, (Math.random() - 0.5) * 1.5), 1.2, 0.5, 1.2); }
          }
          if (c.carga > 0.001 && c.despejando()) {
            const q = Math.min(c.carga, 1.8 * dt * (c.cap > 2 ? 1.6 : 1)), ce = c.centro();
            const bas = veiculos.find(o => o.id === 'basculante' && !o.queimado && o.api?.caixaCacamba && (() => { const cx = o.api.caixaCacamba(), mid = cx.a.clone().lerp(cx.b, 0.5), L = cx.a.distanceTo(cx.b);
              const d = new THREE.Vector3(ce.x - mid.x, 0, ce.z - mid.z), ax = cx.b.clone().sub(cx.a).setY(0).normalize(), lo = d.dot(ax), la = Math.abs(d.x * ax.z - d.z * ax.x);
              return Math.abs(lo) < L / 2 + 0.3 && la < cx.larg / 2 + 0.3 && ce.y > mid.y - 0.3; })());
            if (bas) bas.api.adicionarCarga(q); else { const hc = alturaChao(ce.x, ce.z) ?? 0; despejarTerra(ce.x, ce.z, q, c.cap > 2 ? 1.6 : 1.0); if (hc < ce.y && Math.random() < dt * 10) efeitos.emitir('terra', ce, new THREE.Vector3(0, -2, 0), 0.6, 0.5, 0.4, 6); }
            if (Math.random() < dt * 16) efeitos.emitir('terra', ce, new THREE.Vector3((Math.random() - 0.5), -3, (Math.random() - 0.5)), 0.5, 0.45, 0.3, 8);
            c.definirCarga(c.carga - q);
          }
        }
        if (v.id === 'basculante' && v.api.cargaAtual() > 0.001 && v.api.ferr.valor('cacamba') > 0.5) {     // a caçamba levantada despeja a terra atrás
          const q = Math.min(v.api.cargaAtual(), 5 * dt), p = v.obj.localToWorld(new THREE.Vector3(0, 0, -5.6 - Math.random() * 0.8));
          v.api.adicionarCarga(-q); despejarTerra(p.x, p.z, q, 1.8);
          if (Math.random() < dt * 18) efeitos.emitir('terra', v.obj.localToWorld(new THREE.Vector3((Math.random() - 0.5) * 1.6, 1.4, -4.4)), new THREE.Vector3(0, -2, -1.5), 0.7, 0.55, 0.4, 6);
        }
      }
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
        const nx = jogador.x + Math.sin(dirMundo) * passo, nz = jogador.z + Math.cos(dirMundo) * passo;
        const pl = jogador.plataforma;
        // pulou por cima da mureta do terraço (no ar, acima dela, saindo do retângulo): cai do prédio
        if (pl && !pl.interior && !jogador.noChao && jogador.y > pl.y + 0.95 && (nx < pl.minX + 0.4 || nx > pl.maxX - 0.4 || nz < pl.minZ + 0.4 || nz > pl.maxZ - 0.4)) { jogador.plataforma = null; mostrarToast('Você pulou do terraço!'); }
        const col = jogador.plataforma ? moverNaPlataforma(nx, nz, 0.38) : resolverColisoes(nx, nz, 0.42);
        jogador.x = col.x; jogador.z = col.z;
        if (!jogador.plataforma) for (const o of veiculos) {                       // não atravessa os carros
          const ddx = jogador.x - o.x, ddz = jogador.z - o.z, d = Math.hypot(ddx, ddz), min = o.raio * 0.78 + 0.35;
          if (d < min && d > 1e-3) { jogador.x = o.x + ddx / d * min; jogador.z = o.z + ddz / d * min; }
        }
        velAbs = velBase * Math.min(1, mag);
      }

      const chaoAqui = jogador.plataforma ? jogador.plataforma.y : (alturaChao(jogador.x, jogador.z) ?? CALCADA);
      if (jogador.noChao) {
        if (chaoAqui < jogador.y - 0.6) { jogador.noChao = false; jogador.vy = 0; jogador.yPico = jogador.y; }     // saiu da beira (buraco, prédio)
        else jogador.y = chaoAqui;
      }
      if (espaco && jogador.noChao) {
        jogador.vy = 6.2;
        jogador.noChao = false; jogador.yPico = jogador.y;
        tocarAcao('Pular', 0.08);
      }
      if (!jogador.noChao) {
        jogador.vy -= 17.5 * dt;
        jogador.y += jogador.vy * dt;
        jogador.yPico = Math.max(jogador.yPico ?? jogador.y, jogador.y);
        const chao = jogador.plataforma ? jogador.plataforma.y : (alturaChao(jogador.x, jogador.z) ?? CALCADA);
        if (jogador.y <= chao) {
          const queda = (jogador.yPico ?? chao) - chao;                             // dano de queda: a partir de 3,5 m; ~15 m é fatal
          if (queda > 3.5) { vida.dano((queda - 3.5) * 9, 'queda'); if (queda < 14) mostrarToast(`Queda de ${queda.toFixed(0)} m!`); }
          jogador.y = chao; jogador.vy = 0; jogador.noChao = true; jogador.yPico = chao;
        }
      }
      if (jogador.noChao) {
        if (!movendo) tocarAcao('Parado');
        else tocarAcao(sprint ? 'Correr' : 'Andar');
      }

      if (mira.ativa) jogador.ry = mira.yaw;
      else if (armas.ativa) jogador.ry += anguloDiff(jogador.ry, camYaw) * Math.min(1, dt * 14);   // armado: o corpo vira para onde a câmera mira
      persAtual.inst.obj.position.set(jogador.x, jogador.y, jogador.z);
      persAtual.inst.obj.rotation.y = jogador.ry;
      persAtual.inst.atualizar(dt);
      armas.atualizar(dt, tTotal, persAtual.inst.obj, true);

      focoX = jogador.x; focoY = jogador.y + 1.45; focoZ = jogador.z; focoYaw = jogador.ry;

      const inter = jogando ? interacaoAtual() : null;
      const perto = jogando && !inter ? acharVeiculoPerto() : null;
      $('touch-entrar')?.classList.toggle('tbtn-destaque', !!perto || !!inter);
      if (inter) { elPrompt.textContent = inter.texto; elPrompt.classList.remove('oculto'); }
      else if (perto) {
        elPrompt.textContent = `[E] Entrar: ${perto.nome}`;
        elPrompt.classList.remove('oculto');
      } else {
        elPrompt.classList.add('oculto');
      }
    }

    if (jogador.veiculo) armas.atualizar(dt, tTotal, null, false);
    atualizarHudArma();
    missao.atualizar(dt, tTotal);
    balacam.atualizarEfeitos(dt);
    efeitos.atualizar(dt); vida.atualizar(dt); terreno?.atualizar(dt);
    for (const v of veiculos) v.atualizarDano?.(dt);

    // Atualiza setores visíveis, trânsito, frota distante, T. rex da Selva, fumaça de drift e NPCs próximos
    fumacaDrift.atualizar(dt);
    canteiro?.atualizar(dt, cine ? cine.foco.x : focoX, cine ? cine.foco.z : focoZ);
    if (cine) {
      const fx = cine.foco.x, fz = cine.foco.z;
      cidade.atualizar(dt, tTotal, fx, fz);
      const ta = cine.trexAlvo || [jogador.x, jogador.y, jogador.z];
      atualizarTrex(dt, tTotal, ta[0], ta[1], ta[2]);
      focoX = fx; focoZ = fz;
    } else {
      cidade.atualizar(dt, tTotal, focoX, focoZ);
      atualizarTrex(dt, tTotal, focoX, focoY, focoZ);
    }
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
      sireneAtiva: missao.sireneProxima(focoX, focoZ) || !!jogador.veiculo?.sirene || veiculos.some(v => v.sirene && Math.hypot(v.x - focoX, v.z - focoZ) < 45),
    });

    // ---- Checkpoint
    cpAnel.rotation.z = tTotal * 1.4;
    cpFeixe.material.opacity = 0.13 + 0.06 * Math.sin(tTotal * 3.2);
    const cp = CHECKPOINTS[cpIdx];
    cpGrupo.visible = jogando && !missaoEmCurso();
    if (jogando && !missaoEmCurso() && Math.hypot(focoX - cp.x, focoZ - cp.z) < 5.8) {
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

    // ---- Câmera (abertura/sala já posicionaram a câmera; senão 3ª pessoa / Capô / Aérea)
    if (!cine && !mira.ativa && (camera.fov !== 56 || camera.near !== 0.4)) { camera.fov = 56; camera.near = 0.4; camera.updateProjectionMatrix(); }
    if (cine) {
      // nada: a câmera da cena já foi posicionada
    } else if (mira.ativa) {
      // luneta: o olho do personagem, com a respiração mexendo de leve a mira
      // Shift: segura a respiração e a mira quase para
      const segura = teclas.has('ShiftLeft') || teclas.has('ShiftRight') || touch.correr;
      document.body.classList.toggle('respiracao', segura);
      const r = 0.0016 * (mira.fov / 14) * (segura ? 0.12 : 1), yaw = mira.yaw + Math.sin(tTotal * 0.9) * r + Math.sin(tTotal * 2.3) * r * 0.35, pit = mira.pitch + Math.sin(tTotal * 1.3 + 1) * r * 0.8;
      camera.position.set(jogador.x, jogador.y + 1.62, jogador.z);
      camera.lookAt(jogador.x + Math.sin(yaw) * Math.cos(pit) * 10, jogador.y + 1.62 + Math.sin(pit) * 10, jogador.z + Math.cos(yaw) * Math.cos(pit) * 10);
      // na luneta nada a menos de 2,5 m importa: corta a mureta e o que estiver colado no olho (a bala também ignora)
      if (camera.fov !== mira.fov || camera.near !== 2.5) { camera.fov = mira.fov; camera.near = 2.5; camera.updateProjectionMatrix(); }
      snapCam = true;
    } else if (camModo === 0) {
      let d = jogador.veiculo ? Math.max(camDist, jogador.veiculo.camDist) : camDist;
      if (jogador.plataforma?.interior) d = Math.min(d, 3.0);                   // dentro da loja a câmera fica perto (paredes)
      const h = (jogador.veiculo ? jogador.veiculo.camAlt : 1.7) + Math.sin(camPitch) * d * 0.72;
      const hDist = Math.cos(camPitch) * d;
      posCamDesejada.set(focoX - Math.sin(camYaw) * hDist, Math.max(0.8, focoY + h - 1.1), focoZ - Math.cos(camYaw) * hDist);
      const ombro = armas.ativa && !jogador.veiculo ? 0.62 : 0;                       // armado: câmera sobre o ombro direito
      if (ombro) posCamDesejada.add(new THREE.Vector3(-Math.cos(camYaw) * ombro, 0, Math.sin(camYaw) * ombro));
      if (snapCam) { camera.position.copy(posCamDesejada); snapCam = false; }
      else camera.position.lerp(posCamDesejada, Math.min(1, dt * 9));
      alvoCam.set(focoX, focoY + (jogador.veiculo ? 0.5 : 0.1), focoZ);
      if (ombro) alvoCam.add(new THREE.Vector3(-Math.cos(camYaw) * ombro + Math.sin(camYaw) * 3, 0.15, Math.sin(camYaw) * ombro + Math.cos(camYaw) * 3));
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

    // ---- Céu acompanha a câmera + Minimapa (em frequência reduzida) + Render
    ceu.mesh.position.copy(camera.position);
    ceu.mesh.scale.setScalar(camera.far * 0.92);

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
    modo: () => modo,
    fisica: () => ({ vida: vida.hp, terrenoMin: terreno ? Math.min(...terreno.h) : null, terrenoMax: terreno ? Math.max(...terreno.h) : null,
      cargas: veiculos.filter(v => v.api?.cacambas || v.api?.cargaAtual).map(v => [v.id, ...(v.api.cacambas || []).map(c => +c.carga.toFixed(2)), v.api.cargaAtual ? +v.api.cargaAtual().toFixed(2) : null]),
      queimados: veiculos.filter(v => v.queimado).map(v => v.id), hp: veiculos.filter(v => v.hp < 100).map(v => [v.id, Math.round(v.hp)]), trex: trexState.hp }),
    danoTrex: n => danoTrex(n),
    missao, loja, balacam, mira: () => ({ ...mira }),
    irParaPos: (x, z, ry = 0, terraco = false) => irPara({ x, z, ry }, terraco === 'manter' ? jogador.plataforma : terraco ? TORRE.terraco : null),
    mirar: (yaw, pitch, fov) => { if (!mira.ativa) entrarMira(true); mira.yaw = yaw; mira.pitch = pitch; if (fov) mira.fov = fov; },
    camFixa: (p, a) => { camFixa = p ? { p: new THREE.Vector3(...p), a: new THREE.Vector3(...a) } : null; },
    pose: () => ({ jogador: { x: jogador.x, z: jogador.z, ry: jogador.ry }, veiculos: veiculos.map(v => ({ id: v.id, x: v.x, z: v.z, ry: v.ry, raio: v.raio })) }),
    abertura: { duracao: abertura.duracao, marcos: () => abertura.linha.map(s => [s.t0, s.t1, s.loc.id]), irPara: t => abertura.irPara(t), pular: () => abertura.pular(), iniciar: () => iniciarAbertura() },
    sala: { escolher: (campo, id) => sala.escolher(campo, id), jogar: () => document.getElementById('sala-jogar').click(), abrir: () => entrarSala() },
    passo: dt => passo(dt),
    entrar: () => { entrarOuSairVeiculo(); snapCam = true; },
    teleportar: id => { const pt = PONTOS_TELEPORTE.find(p => p.id === id); if (pt) teleportar(pt); },
    irPara: (x, z, ang = 0) => teleportar({ id: 'custom', nome: 'Custom', x, z, ang }),
    noite: v => { ehNoite = v; aplicarClima(); },
    chuva: v => { ehChuva = v; rainLines.visible = ehChuva; aplicarClima(); },
    qualidade: id => aplicarQualidade(id, false),
    sirene: v => { if (jogador.veiculo?.temSirene) { jogador.veiculo.sirene = v; $('btn-sirene').classList.toggle('ativo', v); } },
    carregarTrex: () => garantirTrex(false),
    trex: () => ({
      carregado: trexState.carregado,
      estado: trexState.estado,
      x: trexState.x,
      z: trexState.z,
      visivel: !!trexState.inst?.grupo.visible,
    }),
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
