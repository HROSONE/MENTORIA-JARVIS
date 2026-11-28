// ====================================================================================================
// MISSÃO MARTE COMPLETA (Hryz City):
// - Nave espacial HD modelada em Blender (nave_marte.glb) estacionada na Lua (esconde astronauta ao embarcar!)
// - Cutscene 1: decolagem da Lua + câmera DENTRO DA CABINE mostrando o painel holográfico "DESTINO: MARTE"
// - Travessia de ~3 MINUTOS pelo Cinturão de Asteroides (dificuldade crescente em 3 ondas + perda progressiva
//   de força, velocidade de manobra, propulsão e cadência/dano das armas se bater em muitos asteroides!)
// - 4 Ângulos de Câmera + Visão/Giro 360° Espacial (3ª Pessoa, Cabine 1ª Pessoa, Asa Cinematográfica, Órbita 360°)
//   + Manobra Evasiva Giro 360° (Q/E ou botão 🌀 360°) + Panorama Cósmico 360° (Sol, Terra/Lua, Nebulosas, Gigante Gasoso)
// - Cutscene do Portal Interdimensional abrindo na frente de Marte + Batalha contra Nave Inimiga (nave_inimiga.glb)
//   que atira rajadas de plasma rubro/violeta e bloqueia a entrada no planeta até ser destruída!
// - Cutscene Final: enquadramento 100% do Planeta Marte inteiro na tela com movimento suave lateral da câmera,
//   nave indo direto para dentro do planeta e frase final "Nos veremos lá"
// ====================================================================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const ORIGEM_MARTE = new THREE.Vector3(60000, 0, 60000);
const DURACAO_TRAVESSIA = 180; // 3 minutos (180 s) voando pelo Cinturão de Asteroides!
const DIST_INICIAL = 100;      // 100% (225M km) -> 0%
const CHEFE_HP_MAX = 180;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const suave = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

const NOMES_CAM_ESPACO = [
  '🎥 3ª Pessoa Dinâmica (arraste p/ 360°)',
  '🕹️ Cabine 1ª Pessoa (Cockpit)',
  '🎬 Câmera de Asa Cinematográfica',
  '🌌 Órbita 360° Espacial Livre',
];
const CURTOS_CAM = ['3ª PESS', 'CABINE', 'ASA', '360°'];

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

  function desenhar(t, alerta = false, telemetria = null) {
    g.save();
    g.scale(2, 2);

    const bg = g.createRadialGradient(256, 128, 20, 256, 128, 300);
    bg.addColorStop(0, '#09192f');
    bg.addColorStop(1, '#020814');
    g.fillStyle = bg;
    g.fillRect(0, 0, 512, 256);

    g.strokeStyle = 'rgba(56, 189, 248, 0.14)';
    g.lineWidth = 1;
    for (let x = 0; x < 512; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
    for (let y = 0; y < 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }

    g.strokeStyle = alerta ? '#f97316' : '#38bdf8';
    g.lineWidth = 3.5;
    g.strokeRect(8, 8, 496, 240);
    g.strokeStyle = alerta ? 'rgba(249,115,22,0.35)' : 'rgba(56,189,248,0.3)';
    g.lineWidth = 1.5;
    g.strokeRect(14, 14, 484, 228);

    g.fillStyle = '#7dd3fc';
    g.font = '900 13px monospace';
    g.fillText('HRYZ-NAV // COMPUTADOR DE BORDO · SETOR SOL-4', 24, 34);
    g.fillStyle = '#fb923c';
    g.font = '900 25px system-ui, sans-serif';
    g.fillText('DESTINO ESPACIAL: MARTE', 24, 66);

    g.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(24, 78); g.lineTo(340, 78); g.stroke();

    const yR = 132;
    g.strokeStyle = 'rgba(148, 163, 184, 0.42)';
    g.setLineDash([6, 6]);
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(54, yR); g.lineTo(328, yR); g.stroke();
    g.setLineDash([]);

    const prog = telemetria ? clamp(1 - telemetria.distancia / 100, 0.05, 1) : (0.25 + ((t * 0.16) % 0.72));
    const px = 54 + prog * (328 - 54);
    g.strokeStyle = '#38bdf8';
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(54, yR); g.lineTo(px, yR); g.stroke();

    g.fillStyle = '#e2e8f0';
    g.beginPath(); g.arc(54, yR, 14, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#94a3b8';
    g.beginPath(); g.arc(50, yR - 4, 3.5, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(59, yR + 4, 2.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#cbd5e1';
    g.font = '800 12px monospace';
    g.fillText('LUA', 42, yR + 30);

    g.fillStyle = '#e0f2fe';
    g.beginPath(); g.moveTo(px + 11, yR); g.lineTo(px - 7, yR - 6); g.lineTo(px - 7, yR + 6); g.closePath(); g.fill();

    const mx = 418, my = 128, mr = 52;
    const gr = g.createRadialGradient(mx - 15, my - 15, 6, mx, my, mr);
    gr.addColorStop(0, '#fdba74');
    gr.addColorStop(0.45, '#ea580c');
    gr.addColorStop(0.85, '#9a3412');
    gr.addColorStop(1, '#431407');
    g.fillStyle = gr;
    g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.fill();

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

    g.fillStyle = '#cbd5e1';
    g.font = '700 12.5px monospace';
    const distKm = telemetria ? `${Math.round(telemetria.distancia * 2.25)}M KM` : '225.000.000 KM';
    const forcaPct = telemetria ? `${Math.round(telemetria.forca)}%` : '100%';
    g.fillText(`DISTÂNCIA: ${distKm}  ·  FORÇA MOTOR: ${forcaPct}`, 24, 194);

    if (telemetria?.chefe) {
      g.fillStyle = 'rgba(192, 38, 211, 0.32)';
      g.fillRect(22, 204, 336, 30);
      g.strokeStyle = '#e879f9';
      g.lineWidth = 1.5;
      g.strokeRect(22, 204, 336, 30);
      g.fillStyle = '#fae8ff';
      g.font = '900 13px monospace';
      g.fillText('🌀 ALERTA: NAVE INTERDIMENSIONAL À FRENTE!', 28, 224);
    } else if (alerta) {
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

/** Áudio sci-fi procedural (WebAudio): laser, plasma, tiro inimigo, portal interdimensional, explosão e reparo. */
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
  laser(fraco = 1) {
    const ctx = this._garantir(); if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(980 + 260 * fraco, now);
    o.frequency.exponentialRampToValueAtTime(210, now + 0.11);
    g.gain.setValueAtTime(0.075, now);
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
  tiroInimigo() {
    const ctx = this._garantir(); if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(520, now);
    o.frequency.exponentialRampToValueAtTime(135, now + 0.16);
    g.gain.setValueAtTime(0.055, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    o.connect(g); g.connect(ctx.destination);
    o.start(now); o.stop(now + 0.18);
  }
  portal() {
    const ctx = this._garantir(); if (!ctx) return;
    const now = ctx.currentTime;
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o1.type = 'sawtooth'; o2.type = 'sine';
    o1.frequency.setValueAtTime(55, now); o1.frequency.exponentialRampToValueAtTime(195, now + 1.4);
    o2.frequency.setValueAtTime(110, now); o2.frequency.exponentialRampToValueAtTime(390, now + 1.4);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.4);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
    o1.connect(g); o2.connect(g); g.connect(ctx.destination);
    o1.start(now); o2.start(now); o1.stop(now + 1.65); o2.stop(now + 1.65);
  }
  explosao(grande = false) {
    const ctx = this._garantir(); if (!ctx) return;
    const now = ctx.currentTime;
    const dur = grande ? 0.58 : 0.32;
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
    f.frequency.exponentialRampToValueAtTime(70, now + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(grande ? 0.25 : 0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    src.connect(f); f.connect(g); g.connect(ctx.destination);
    src.start(now);
  }
  dano() {
    const ctx = this._garantir(); if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(160, now); o.frequency.linearRampToValueAtTime(75, now + 0.26);
    g.gain.setValueAtTime(0.14, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    o.connect(g); g.connect(ctx.destination);
    o.start(now); o.stop(now + 0.29);
  }
  reparo() {
    const ctx = this._garantir(); if (!ctx) return;
    const now = ctx.currentTime;
    [523, 659, 880].forEach((fr, idx) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(fr, now + idx * 0.06);
      g.gain.setValueAtTime(0.08, now + idx * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.16);
      o.connect(g); g.connect(ctx.destination);
      o.start(now + idx * 0.06); o.stop(now + idx * 0.06 + 0.17);
    });
  }
}

export class MissaoMarte {
  constructor({ scene, camera, lua, base, toast, aoSairParaSala, definirVisibilidadeJogador }) {
    this.scene = scene;
    this.camera = camera;
    this.lua = lua;
    this.base = base;
    this.toast = toast;
    this.aoSairParaSala = aoSairParaSala;
    this.definirVisibilidadeJogador = definirVisibilidadeJogador;

    this.loader = new GLTFLoader();
    this.som = new SomEspacial();

    // Estados:
    // 'inativa' | 'cine_decolagem' | 'cine_painel' | 'voo' | 'cine_portal' | 'chefe' | 'cine_chefe_fim' | 'cine_chegada' | 'fim'
    this.estado = 'inativa';
    this.t = 0;
    this.tempoVoo = 0;
    this.carregado = false;
    this.carregando = null;

    // Nave estacionada na Lua
    this.naveLuaPos = new THREE.Vector3(14.5, 0, 8.5);
    this.naveLua = null;
    this.marcNave = null;

    // Grupo do Espaço Profundo
    this.raiz = new THREE.Group();
    this.raiz.name = 'MissaoMarte';
    this.raiz.position.copy(ORIGEM_MARTE);
    this.raiz.visible = false;
    this.scene.add(this.raiz);

    this.tplNave = null;
    this.tplNaveInimiga = null;
    this.tplAsteroides = [];
    this.tplMarte = null;

    this.naveVoo = null;
    this.tremPousoVoo = null;
    this.chamasVoo = [];
    this.painelCanvas = criarTelaPainelDinamica();
    this.cabineGrupo = null;

    this.marteGrupo = null;
    this.marteMalha = null;
    this.portalGrupo = null;
    this.portalMat = null;
    this.portalAneis = [];
    this.naveInimiga = null;
    this.estrelasWarp = null;
    this.luzSolMarte = null;
    this.luzAmbMarte = null;

    // Estado de voo, degradação mecânica e câmeras 360°
    this.shipPos = new THREE.Vector3(0, 0, 0);
    this.shipVel = new THREE.Vector2(0, 0);
    this.escudo = 100;
    this.forcaNave = 100;      // 100% -> 25%: reduz velocidade, manobrabilidade, propulsão e armas ao bater!
    this.batidas = 0;
    this.tempoSemDano = 0;
    this.destruidos = 0;
    this.distancia = DIST_INICIAL;
    this.coolLaser = 0;
    this.coolPlasma = 0;
    this.spawnTimer = 0;
    this.faiscaTimer = 0;
    this.tremor = 0;
    this.danoFlash = 0;
    this.laserAtivo = false;
    this.plasmaAtivo = false;

    // Manobra evasiva 360° (barrel roll) + 4 ângulos de câmera + visão 360° livre
    this.giro360 = 0;          // >0 em rotação 360°
    this.giroDir = 1;
    this.coolGiro = 0;
    this.camModoEspaco = 0;    // 0 = 3ª pessoa, 1 = Cabine, 2 = Asa, 3 = Órbita 360°
    this.orbitYaw = 0;
    this.orbitPitch = 0.16;
    this.orbitDist = 16.5;
    this.tempoSemOlhar = 99;

    // Chefe Interdimensional
    this.chefeHp = CHEFE_HP_MAX;
    this.chefePos = new THREE.Vector3(0, 2, 74);
    this.chefeCoolTiro = 1.0;
    this.chefePadrao = 0;
    this.chefeFlash = 0;

    // Listas dinâmicas
    this.tiros = [];
    this.tirosInimigos = [];
    this.asteroides = [];
    this.reparos = [];
    this.explosoes = [];
    this.faiscasMotor = [];

    this.texLaser = criarTexBrilho('rgba(224,242,254,1)', 'rgba(56,189,248,0.85)');
    this.texPlasma = criarTexBrilho('rgba(255,240,255,1)', 'rgba(217,70,239,0.85)');
    this.texInimigo = criarTexBrilho('rgba(255,228,235,1)', 'rgba(244,63,94,0.90)');
    this.texFogo = criarTexBrilho('rgba(255,248,200,1)', 'rgba(249,115,22,0.85)');
    this.texRoxo = criarTexBrilho('rgba(250,232,255,1)', 'rgba(168,85,247,0.88)');
    this.texReparo = criarTexBrilho('rgba(220,252,231,1)', 'rgba(34,197,94,0.85)');

    // Referências HUD/DOM
    this.elHud = document.getElementById('hud-marte');
    this.elDist = document.getElementById('marte-dist');
    this.elTempo = document.getElementById('marte-tempo');
    this.elAst = document.getElementById('marte-ast');
    this.elEscudo = document.getElementById('marte-escudo-barra');
    this.elEscudoTxt = document.getElementById('marte-escudo-txt');
    this.elForca = document.getElementById('marte-forca-barra');
    this.elForcaTxt = document.getElementById('marte-forca-txt');
    this.elForcaRot = document.getElementById('marte-forca-rot');
    this.elBossBox = document.getElementById('marte-boss-box');
    this.elBossBarra = document.getElementById('marte-boss-barra');
    this.elBossTxt = document.getElementById('marte-boss-txt');
    this.elCine = document.getElementById('cine-marte');
    this.elCineLeg = document.getElementById('cine-marte-legenda');
    this.elCinePular = document.getElementById('cine-marte-pular');
    this.elFinal = document.getElementById('marte-final');
    this.elTouchMarte = document.getElementById('touch-marte');
    this.elTouchCamTxt = document.getElementById('touch-cam-txt');
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
    document.getElementById('touch-cam-marte')?.addEventListener('click', e => {
      e.preventDefault();
      this.ciclarCamera();
    });
    document.getElementById('touch-giro360')?.addEventListener('click', e => {
      e.preventDefault();
      this.iniciarGiro360(1);
    });

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
  get emVoo() { return this.estado === 'voo' || this.estado === 'chefe'; }
  get emCutscene() {
    return ['cine_decolagem', 'cine_painel', 'cine_portal', 'cine_chefe_fim', 'cine_chegada', 'fim'].includes(this.estado);
  }

  ciclarCamera() {
    this.camModoEspaco = (this.camModoEspaco + 1) % 4;
    if (this.camModoEspaco === 3 && Math.abs(this.orbitYaw) < 0.05) {
      this.orbitYaw = 0.65; // inicia num belo ângulo 3/4 espacial no modo 360°!
    }
    if (this.elTouchCamTxt) this.elTouchCamTxt.textContent = CURTOS_CAM[this.camModoEspaco];
    this.toast?.(NOMES_CAM_ESPACO[this.camModoEspaco]);
  }

  girarOlhar360(dx, dy) {
    if (!this.emVoo) return;
    this.orbitYaw -= dx * 0.0065;
    this.orbitPitch = clamp(this.orbitPitch + dy * 0.0055, -1.15, 1.15);
    this.tempoSemOlhar = 0;
  }

  zoomOlhar360(deltaY) {
    if (!this.emVoo) return;
    this.orbitDist = clamp(this.orbitDist + deltaY * 0.012, 9.5, 34);
  }

  iniciarGiro360(dir = 1) {
    if (!this.emVoo || this.giro360 > 0 || this.coolGiro > 0) return;
    this.giro360 = 0.58;
    this.giroDir = dir >= 0 ? 1 : -1;
    this.coolGiro = 0.85;
    const mult = 0.5 + 0.5 * (this.forcaNave / 100);
    this.shipVel.x += -this.giroDir * 24 * mult;
    this.som.laser(1.25);
  }

  /** Carrega nave_marte.glb (V2 HD), nave_inimiga.glb, marte.glb e os 3 asteroides esculpidos em Blender. */
  async carregar() {
    if (this.carregado) return;
    if (this.carregando) return this.carregando;
    this.carregando = (async () => {
      const B = this.base;
      const [gNave, gInimiga, gMarte, gA1, gA2, gA3] = await Promise.all([
        this.loader.loadAsync(`${B}/veiculos/nave_marte/nave_marte.glb`),
        this.loader.loadAsync(`${B}/cenarios/marte/nave_inimiga.glb`),
        this.loader.loadAsync(`${B}/cenarios/marte/marte.glb`),
        this.loader.loadAsync(`${B}/cenarios/marte/asteroide_1.glb`),
        this.loader.loadAsync(`${B}/cenarios/marte/asteroide_2.glb`),
        this.loader.loadAsync(`${B}/cenarios/marte/asteroide_3.glb`),
      ]);
      this.tplNave = gNave.scene;
      this.tplNaveInimiga = gInimiga.scene;
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
    const chamas = [];
    const geoC = new THREE.ConeGeometry(0.48, 3.8, 16, 1, true);
    geoC.rotateX(-Math.PI / 2);
    geoC.translate(0, 0, -1.9);
    const geoN = new THREE.ConeGeometry(0.25, 2.1, 12, 1, true);
    geoN.rotateX(-Math.PI / 2);
    geoN.translate(0, 0, -1.05);

    for (const sx of [-1.24, 1.24]) {
      const matC = new THREE.MeshBasicMaterial({
        color: 0x38bdf8, transparent: true, opacity: 0.80,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      });
      const matN = new THREE.MeshBasicMaterial({
        color: 0xffedd5, transparent: true, opacity: 0.94,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      });
      const g = new THREE.Group();
      g.position.set(sx, 1.38, -4.40);
      const mExt = new THREE.Mesh(geoC, matC);
      const mInt = new THREE.Mesh(geoN, matN);
      g.add(mExt, mInt);
      g.userData.matExt = matC;
      g.visible = false;
      clone.add(g);
      chamas.push(g);
    }
    const trem = clone.getObjectByName('TremPouso') || null;
    return { obj: clone, chamas, trem };
  }

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
    // 1. Iluminação cinematográfica espacial (com target dentro de this.raiz para iluminar Marte de frente!)
    this.luzAmbMarte = new THREE.HemisphereLight(0xfff0dc, 0x4a1f12, 0.95);
    this.raiz.add(this.luzAmbMarte);

    const solPos = new THREE.Vector3(-210, 130, -180);
    const marteAlvo = new THREE.Vector3(0, 4, 265);
    const dirSolMarte = solPos.clone().sub(marteAlvo).normalize();

    this.luzSolMarte = new THREE.DirectionalLight(0xfff4e2, 3.85);
    this.luzSolMarte.position.copy(solPos);
    this.luzSolMarte.target.position.copy(marteAlvo);
    this.raiz.add(this.luzSolMarte, this.luzSolMarte.target);

    const luzRim = new THREE.DirectionalLight(0xfb923c, 0.95);
    luzRim.position.set(220, -35, 340);
    luzRim.target.position.copy(marteAlvo);
    this.raiz.add(luzRim, luzRim.target);

    // 2. Panorama Cósmico 360° Completo (4.200 estrelas em esfera 360°, Nebulosas coloridas, Sol 3D, Terra/Lua atrás e Gigante Gasoso!)
    const N_EST = 4200;
    const ePos = new Float32Array(N_EST * 3), eCor = new Float32Array(N_EST * 3);
    let s = 1337;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < N_EST; i++) {
      const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - u * u);
      const dist = 1600 + rnd() * 1500;
      ePos.set([r * Math.cos(a) * dist, u * dist, r * Math.sin(a) * dist], i * 3);
      const b = 0.42 + 0.58 * rnd() ** 2, tom = rnd();
      eCor.set([b * (0.85 + 0.25 * tom), b * 0.92, b * (1.12 - 0.25 * tom)], i * 3);
    }
    const eGeo = new THREE.BufferGeometry();
    eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
    eGeo.setAttribute('color', new THREE.BufferAttribute(eCor, 3));
    const est = new THREE.Points(eGeo, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false }));
    est.frustumCulled = false;
    this.raiz.add(est);

    // Nebulosas 360° ao redor do horizonte espacial (dão sensação de profundidade ao girar a câmera em 360°!)
    const coresNeb = [
      ['rgba(168,85,247,0.22)', 'rgba(59,130,246,0.08)'],
      ['rgba(249,115,22,0.18)', 'rgba(225,29,72,0.06)'],
      ['rgba(14,165,233,0.20)', 'rgba(99,102,241,0.07)'],
    ];
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2;
      const [c1, c2] = coresNeb[i % coresNeb.length];
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: criarTexBrilho(c1, c2), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
      }));
      const rNeb = 1350;
      sp.position.set(Math.cos(ang) * rNeb, (rnd() - 0.5) * 520, Math.sin(ang) * rNeb);
      sp.scale.setScalar(580 + rnd() * 380);
      this.raiz.add(sp);
    }

    // Sol brilhante à esquerda-trás + Terra azul e Lua ao fundo-trás + Gigante Gasoso com anéis à direita!
    const solSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: criarTexBrilho('rgba(255,255,240,1)', 'rgba(251,191,36,0.55)'), blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    solSprite.position.set(-1050, 420, -820);
    solSprite.scale.setScalar(260);
    this.raiz.add(solSprite);

    const terraLonge = new THREE.Group();
    terraLonge.position.set(220, -75, -980);
    const mTerra = new THREE.Mesh(new THREE.SphereGeometry(24, 24, 18), new THREE.MeshBasicMaterial({ color: 0x2563eb }));
    const mLua = new THREE.Mesh(new THREE.SphereGeometry(7.5, 16, 12), new THREE.MeshBasicMaterial({ color: 0xcbd5e1 }));
    mLua.position.set(-44, 14, 28);
    terraLonge.add(mTerra, mLua);
    this.raiz.add(terraLonge);

    const gasoso = new THREE.Group();
    gasoso.position.set(1120, 165, 160);
    const mGas = new THREE.Mesh(new THREE.SphereGeometry(46, 28, 20), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.75 }));
    const mAnelGas = new THREE.Mesh(
      new THREE.RingGeometry(62, 98, 48),
      new THREE.MeshBasicMaterial({ color: 0xfde68a, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
    );
    mAnelGas.rotation.set(1.18, 0.35, 0);
    gasoso.add(mGas, mAnelGas);
    this.raiz.add(gasoso);

    // 3. Linhas de velocidade estelar (warp streaks)
    const N_WARP = 280;
    const wPos = new Float32Array(N_WARP * 6);
    this.warpSeeds = [];
    for (let i = 0; i < N_WARP; i++) {
      this.warpSeeds.push({
        x: (Math.random() - 0.5) * 150,
        y: (Math.random() - 0.5) * 95,
        z: Math.random() * 290 - 65,
        vel: 95 + Math.random() * 115,
      });
    }
    const wGeo = new THREE.BufferGeometry();
    wGeo.setAttribute('position', new THREE.BufferAttribute(wPos, 3));
    this.estrelasWarp = new THREE.LineSegments(
      wGeo,
      new THREE.LineBasicMaterial({ color: 0xbbe8ff, transparent: true, opacity: 0.42 })
    );
    this.estrelasWarp.frustumCulled = false;
    this.raiz.add(this.estrelasWarp);

    // 4. Planeta MARTE (modelo Blender + atmosfera Fresnel)
    this.marteGrupo = new THREE.Group();
    this.marteGrupo.position.set(0, 8, 560);
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

    const matAtmo = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide,
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
          float fres = pow(1.0 - max(dot(vN, vV), 0.0), 3.0);
          float dia = smoothstep(-0.25, 0.55, dot(vWorldN, uSol));
          vec3 cor = mix(vec3(0.96, 0.42, 0.16), vec3(1.0, 0.76, 0.52), fres);
          gl_FragColor = vec4(cor * fres * (0.24 + 0.96 * dia), fres * 0.88);
        }`,
    });
    this.marteGrupo.add(new THREE.Mesh(new THREE.SphereGeometry(107.2, 48, 32), matAtmo));

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
    this.marteGrupo.add(new THREE.Mesh(new THREE.SphereGeometry(118, 48, 32), matHalo));
    this.raiz.add(this.marteGrupo);

    // 5. PORTAL INTERDIMENSIONAL GIGANTE + NAVE INIMIGA (Chefe que bloqueia Marte!)
    this._construirPortalEChefe();

    // 6. Nave do Jogador HD
    const prepVoo = this._prepararNave(this.tplNave.clone(true));
    this.naveVoo = prepVoo.obj;
    this.tremPousoVoo = prepVoo.trem;
    this.chamasVoo = prepVoo.chamas;
    if (this.tremPousoVoo) this.tremPousoVoo.visible = false;
    this.raiz.add(this.naveVoo);

    // 7. Interior detalhado da Cabine (usado na Cutscene 1B E no modo de câmera 1ª Pessoa!)
    this.cabineGrupo = this._construirCabineInterior();
    this.cabineGrupo.visible = false;
    this.raiz.add(this.cabineGrupo);
  }

  _construirPortalEChefe() {
    this.portalGrupo = new THREE.Group();
    this.portalGrupo.position.set(0, 4, 118);
    this.portalGrupo.visible = false;

    // Vórtice espiral GLSL interdimensional (roxo/ciano/magenta)
    this.portalMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv * 2.0 - 1.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          float r = length(vUv);
          if (r > 1.0) discard;
          float ang = atan(vUv.y, vUv.x);
          float esp1 = sin(ang * 6.0 - r * 14.0 + uTime * 4.5);
          float esp2 = cos(ang * 4.0 + r * 10.0 - uTime * 3.2);
          float ondas = 0.5 + 0.5 * (esp1 * 0.6 + esp2 * 0.4);
          float anel = smoothstep(0.98, 0.72, r) * smoothstep(0.03, 0.28, r);
          float borda = smoothstep(0.62, 0.88, r) * smoothstep(1.0, 0.86, r);
          vec3 cVoid = vec3(0.14, 0.02, 0.28);
          vec3 cRoxo = vec3(0.76, 0.18, 0.98);
          vec3 cCiano = vec3(0.22, 0.86, 1.0);
          vec3 cor = mix(cVoid, cRoxo, ondas);
          cor = mix(cor, cCiano, borda * (0.65 + 0.35 * sin(ang * 10.0 - uTime * 7.0)));
          float nucleoEscuro = smoothstep(0.0, 0.26, r);
          cor *= mix(0.25, 1.35, nucleoEscuro);
          float alpha = (anel * (0.55 + 0.45 * ondas) + borda * 0.95) * smoothstep(1.0, 0.90, r);
          gl_FragColor = vec4(cor, clamp(alpha, 0.0, 1.0));
        }`,
    });
    const disco = new THREE.Mesh(new THREE.PlaneGeometry(74, 74), this.portalMat);
    this.portalGrupo.add(disco);

    // Anéis energéticos contra-rotativos ao redor da fenda dimensional
    this.portalAneis = [];
    for (const [raio, tubo, cor] of [[33.5, 0.55, 0xa855f7], [36.2, 0.35, 0x38bdf8], [28.0, 0.32, 0xf43f5e]]) {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(raio, tubo, 10, 48),
        new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      this.portalGrupo.add(m);
      this.portalAneis.push(m);
    }
    this.raiz.add(this.portalGrupo);

    // Nave Inimiga Interdimensional (Chefe modelado no Blender!)
    this.naveInimiga = this.tplNaveInimiga.clone(true);
    this.naveInimiga.scale.setScalar(2.25);
    this.naveInimiga.visible = false;
    this.naveInimiga.traverse(m => {
      if (m.isMesh && m.material) m.material = m.material.clone();
    });
    this.raiz.add(this.naveInimiga);
  }

  _construirCabineInterior() {
    const g = new THREE.Group();
    const mGraf = new THREE.MeshStandardMaterial({ color: 0x1e2530, roughness: 0.45, metalness: 0.55 });
    const mEsc = new THREE.MeshStandardMaterial({ color: 0x0d121a, roughness: 0.55, metalness: 0.45 });
    const mBranco = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.4, metalness: 0.25 });
    const mLar = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.38, metalness: 0.28 });
    const mCiano = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const mLedVerd = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
    const mLedLar = new THREE.MeshBasicMaterial({ color: 0xfb923c });

    const consoleBase = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.72, 1.35), mEsc);
    consoleBase.position.set(0, 0.72, 2.22);
    g.add(consoleBase);

    const capota = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.11, 0.76), mGraf);
    capota.position.set(0, 1.09, 2.38);
    g.add(capota);
    const friso = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.035, 0.06), mLar);
    friso.position.set(0, 1.15, 2.02);
    g.add(friso);

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

    const criarTelaLateral = (titulo, linhas, corHex) => {
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 192;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#040c18'; ctx.fillRect(0, 0, 256, 192);
      ctx.strokeStyle = corHex; ctx.lineWidth = 4; ctx.strokeRect(6, 6, 244, 180);
      ctx.fillStyle = corHex; ctx.font = '900 18px monospace'; ctx.fillText(titulo, 18, 36);
      ctx.fillStyle = '#e2e8f0'; ctx.font = '700 14px monospace';
      linhas.forEach((l, idx) => ctx.fillText(l, 18, 70 + idx * 28));
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

    for (let i = -5; i <= 5; i++) {
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.035, 0.05), i % 3 === 0 ? mLedLar : (i % 2 === 0 ? mCiano : mLedVerd));
      led.position.set(i * 0.14, 1.07, 1.92);
      g.add(led);
    }

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

    const luzPainel = new THREE.PointLight(0x38bdf8, 2.6, 8);
    luzPainel.position.set(0, 1.82, 1.55);
    const luzQuente = new THREE.PointLight(0xf97316, 1.2, 6);
    luzQuente.position.set(0, 1.25, 1.15);
    g.add(luzPainel, luzQuente);

    return g;
  }

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

  /** Inicia a Missão Marte — esconde imediatamente o Astronauta na Lua para não ficar duplicado na decolagem! */
  async iniciarDaLua(comDecolagem = true) {
    await this.carregar();
    this._limparEntidades();

    // Esconde o modelo do astronauta na Lua assim que ele entra na nave!
    this.definirVisibilidadeJogador?.(false);

    this.t = 0;
    this.tempoVoo = 0;
    this.escudo = 100;
    this.forcaNave = 100;
    this.batidas = 0;
    this.tempoSemDano = 0;
    this.destruidos = 0;
    this.distancia = DIST_INICIAL;
    this.shipPos.set(0, 0, 0);
    this.shipVel.set(0, 0);
    this.coolLaser = 0;
    this.coolPlasma = 0;
    this.spawnTimer = 0.25;
    this.tremor = 0;
    this.danoFlash = 0;
    this.laserAtivo = false;
    this.plasmaAtivo = false;
    this.giro360 = 0;
    this.coolGiro = 0;
    this.orbitYaw = 0;
    this.orbitPitch = 0.16;
    this.tempoSemOlhar = 99;
    this.chefeHp = CHEFE_HP_MAX;

    this.naveVoo.visible = true;
    this.naveVoo.position.set(0, 0, 0);
    this.naveVoo.rotation.set(0, 0, 0);
    this.naveVoo.scale.setScalar(1);
    for (const c of this.chamasVoo) {
      c.visible = true;
      c.userData.matExt?.color.setHex(0x38bdf8);
    }
    if (this.cabineGrupo) this.cabineGrupo.visible = false;
    if (this.portalGrupo) this.portalGrupo.visible = false;
    if (this.naveInimiga) this.naveInimiga.visible = false;

    this.marteGrupo.position.set(0, 8, 560);
    this.marteGrupo.scale.setScalar(0.50);

    this.elFinal?.classList.add('oculto');
    this.elHud?.classList.add('oculto');
    this.elBossBox?.classList.add('oculto');
    this.elTouchMarte?.classList.add('oculto');

    if (comDecolagem && this.naveLua) {
      this.estado = 'cine_decolagem';
      this.raiz.visible = false;
      this.naveLua.obj.position.set(this.naveLuaPos.x, this.naveLuaPos.y, this.naveLuaPos.z);
      this.naveLua.obj.rotation.set(0, -0.65, 0);
      if (this.naveLua.trem) this.naveLua.trem.visible = true;
      for (const c of this.naveLua.chamas) c.visible = true;
      if (this.marcNave) this.marcNave.visible = false;
      this._mostrarCine(true, '👩‍🚀 ASTRONAUTA A BORDO · DECOLANDO DA LUA RUMO A MARTE');
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
    this.naveVoo.visible = false;
    if (this.cabineGrupo) {
      this.cabineGrupo.visible = true;
      this.cabineGrupo.position.set(0, 0, 0);
      this.cabineGrupo.rotation.set(0, 0, 0);
    }
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
    if (this.portalGrupo) this.portalGrupo.visible = false;
    if (this.naveInimiga) this.naveInimiga.visible = false;
    this.marteGrupo.position.set(0, 8, 560);
    this.marteGrupo.scale.setScalar(0.50);
    this._mostrarCine(false);
    this.elHud?.classList.remove('oculto');
    this.elBossBox?.classList.add('oculto');
    this.elTouchMarte?.classList.remove('oculto');
    this._atualizarHud();
    for (let i = 0; i < 9; i++) this._spawnAsteroide(95 + i * 24);
    this.toast?.('☄️ CINTURÃO DE ASTEROIDES (3 MIN)! Cuidado: bater reduz a FORÇA, VELOCIDADE e ARMAS da nave!');
  }

  /** Cutscene do Portal Interdimensional abrindo na frente de Marte e liberando a Nave Inimiga! */
  _iniciarCutscenePortal() {
    this.estado = 'cine_portal';
    this.t = 0;
    this._limparEntidades();
    this.elHud?.classList.add('oculto');
    this.elTouchMarte?.classList.add('oculto');
    this.elDanoMarte && (this.elDanoMarte.style.opacity = '0');
    if (this.cabineGrupo) this.cabineGrupo.visible = false;

    this.naveVoo.visible = true;
    this.naveVoo.position.set(0, -1.5, 0);
    this.naveVoo.rotation.set(0, 0, 0);
    this.naveVoo.scale.setScalar(1);

    // Marte ao fundo 100% visível + Portal se rasgando bem na frente dele!
    this.marteGrupo.position.set(0, 4, 265);
    this.marteGrupo.scale.setScalar(0.70);

    this.portalGrupo.visible = true;
    this.portalGrupo.position.set(0, 4, 118);
    this.portalGrupo.scale.setScalar(0.01);

    this.naveInimiga.visible = false;
    this.naveInimiga.position.set(0, 4, 122);
    this.naveInimiga.rotation.set(0, Math.PI, 0); // olha para -Z (direto para a nossa nave!)

    this.som.portal();
    this._mostrarCine(true, '🌀 ANOMALIA DETECTADA: PORTAL INTERDIMENSIONAL ABRINDO NA FRENTE DE MARTE!');
  }

  /** Batalha contra a Nave Inimiga Interdimensional na frente do portal e de Marte! */
  _iniciarBatalhaChefe() {
    this.estado = 'chefe';
    this.t = 0;
    this.chefeHp = CHEFE_HP_MAX;
    this.chefePos.set(0, 3.5, 74);
    this.chefeCoolTiro = 0.85;
    this.chefePadrao = 0;

    this._mostrarCine(false);
    this.naveVoo.visible = true;
    this.shipPos.set(0, -1, 0);
    this.shipVel.set(0, 0);

    this.marteGrupo.position.set(0, 4, 265);
    this.marteGrupo.scale.setScalar(0.70);

    this.portalGrupo.visible = true;
    this.portalGrupo.position.set(0, 4, 118);
    this.portalGrupo.scale.setScalar(1.0);

    this.naveInimiga.visible = true;
    this.naveInimiga.position.copy(this.chefePos);
    this.naveInimiga.rotation.set(0, Math.PI, 0);

    this.elHud?.classList.remove('oculto');
    this.elBossBox?.classList.remove('oculto');
    this.elTouchMarte?.classList.remove('oculto');
    this._atualizarHud();
    this.toast?.('👾 NAVE INIMIGA BLOQUEANDO MARTE! Desvie dos tiros (WASD / Q·E 360°) e destrua-a com Laser e Plasma!');
  }

  _iniciarDestruicaoChefe() {
    this.estado = 'cine_chefe_fim';
    this.t = 0;
    for (const ti of this.tirosInimigos) this.raiz.remove(ti.obj);
    this.tirosInimigos.length = 0;
    this.elHud?.classList.add('oculto');
    this.elBossBox?.classList.add('oculto');
    this.elTouchMarte?.classList.add('oculto');
    if (this.cabineGrupo) this.cabineGrupo.visible = false;
    this.naveVoo.visible = true;
    this._explodir(this.chefePos, true, true);
    this._mostrarCine(true, '💥 NAVE INIMIGA DESTRUÍDA · FECHANDO PORTAL INTERDIMENSIONAL!');
  }

  _iniciarChegadaMarte() {
    this.estado = 'cine_chegada';
    this.t = 0;
    this._limparEntidades();
    this.elHud?.classList.add('oculto');
    this.elBossBox?.classList.add('oculto');
    this.elTouchMarte?.classList.add('oculto');
    this.elDanoMarte && (this.elDanoMarte.style.opacity = '0');
    if (this.cabineGrupo) this.cabineGrupo.visible = false;
    if (this.portalGrupo) this.portalGrupo.visible = false;
    if (this.naveInimiga) this.naveInimiga.visible = false;

    // ENQUADRAMENTO 100% DE MARTE NA TELA:
    // Em z=265 com escala 0.70 (raio=73.5, halo=82.6) e câmera em z=-36 (dist=301, fov=46),
    // o globo inteiro de Marte + atmosfera ficam 100% visíveis na tela com margem estrelada!
    this.marteGrupo.position.set(0, 4, 265);
    this.marteGrupo.scale.setScalar(0.70);

    this.naveVoo.visible = true;
    this.naveVoo.position.set(-7.5, -2.5, -14);
    this.naveVoo.rotation.set(0, 0, 0);
    this.naveVoo.scale.setScalar(1);
    for (const c of this.chamasVoo) {
      c.visible = true;
      c.userData.matExt?.color.setHex(0x38bdf8);
    }
    this._mostrarCine(true, '🪐 CAMINHO LIVRE · ÓRBITA DE MARTE ALCANÇADA');
  }

  pularCutscene() {
    if (this.estado === 'cine_decolagem') this._entrarPainelCabine();
    else if (this.estado === 'cine_painel') this._iniciarCombate();
    else if (this.estado === 'cine_portal') this._iniciarBatalhaChefe();
    else if (this.estado === 'cine_chefe_fim') this._iniciarChegadaMarte();
    else if (this.estado === 'cine_chegada') this._mostrarFinal();
  }

  _mostrarCine(on, texto = '') {
    document.body.classList.toggle('em-cine', on);
    if (this.elCine) this.elCine.classList.toggle('oculto', !on);
    if (this.elCineLeg) this.elCineLeg.textContent = texto;
  }

  _mostrarFinal() {
    this.estado = 'fim';
    if (this.naveVoo) this.naveVoo.visible = false;
    this._mostrarCine(true, '');
    if (this.elCinePular) this.elCinePular.classList.add('oculto');
    this.elFinal?.classList.remove('oculto');
  }

  encerrar() {
    this._limparEntidades();
    this.estado = 'inativa';
    this.raiz.visible = false;
    if (this.cabineGrupo) this.cabineGrupo.visible = false;
    if (this.portalGrupo) this.portalGrupo.visible = false;
    if (this.naveInimiga) this.naveInimiga.visible = false;
    this._mostrarCine(false);
    if (this.elCinePular) this.elCinePular.classList.remove('oculto');
    this.elHud?.classList.add('oculto');
    this.elBossBox?.classList.add('oculto');
    this.elTouchMarte?.classList.add('oculto');
    this.elFinal?.classList.add('oculto');
    if (this.elDanoMarte) this.elDanoMarte.style.opacity = '0';
    document.body.classList.remove('modo-marte');
    this.definirVisibilidadeJogador?.(true);

    if (this.naveLua) {
      this.naveLua.obj.position.set(this.naveLuaPos.x, this.naveLuaPos.y, this.naveLuaPos.z);
      this.naveLua.obj.rotation.set(0, -0.65, 0);
      if (this.naveLua.trem) this.naveLua.trem.visible = true;
      for (const c of this.naveLua.chamas) c.visible = false;
      if (this.marcNave) this.marcNave.visible = true;
    }
  }

  _limparEntidades() {
    for (const t of this.tiros) this.raiz.remove(t.obj);
    for (const ti of this.tirosInimigos) this.raiz.remove(ti.obj);
    for (const a of this.asteroides) this.raiz.remove(a.obj);
    for (const r of this.reparos) this.raiz.remove(r.obj);
    for (const e of this.explosoes) this.raiz.remove(e.grupo);
    for (const f of this.faiscasMotor) this.raiz.remove(f.m);
    this.tiros.length = 0;
    this.tirosInimigos.length = 0;
    this.asteroides.length = 0;
    this.reparos.length = 0;
    this.explosoes.length = 0;
    this.faiscasMotor.length = 0;
  }

  // ---- Armas do Jogador (escalam com a FORÇA atual da nave!) ---------------------------------------
  dispararLaser() {
    if (!this.emVoo || this.coolLaser > 0) return;
    const fK = this.forcaNave / 100;
    this.coolLaser = 0.13 + (1 - fK) * 0.17; // nave avariada atira mais devagar!
    this.som.laser(fK);
    const dano = 0.55 + 0.55 * fK;
    for (const sx of [-2.12, 2.12]) {
      const g = new THREE.Group();
      const feixe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 4.6, 8),
        new THREE.MeshBasicMaterial({ color: fK < 0.5 ? 0xfb923c : 0x38bdf8 })
      );
      feixe.rotation.x = Math.PI / 2;
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texLaser, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.scale.set(1.65, 1.65, 1);
      g.add(feixe, halo);
      g.position.set(this.shipPos.x + sx, this.shipPos.y + 1.14, this.shipPos.z + 1.6);
      this.raiz.add(g);
      this.tiros.push({ tipo: 'laser', obj: g, vel: 140 + 40 * fK, dano, raio: 1.55, vida: 2.2 });
    }
  }

  dispararPlasma() {
    if (!this.emVoo || this.coolPlasma > 0) return;
    const fK = this.forcaNave / 100;
    this.coolPlasma = 0.48 + (1 - fK) * 0.62;
    this.som.plasma();
    this.tremor = Math.max(this.tremor, 0.22);

    const g = new THREE.Group();
    const esc = 0.72 + 0.35 * fK;
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.68 * esc, 14, 12),
      new THREE.MeshBasicMaterial({ color: 0xf5d0fe })
    );
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texPlasma, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo.scale.setScalar(4.8 * esc);
    g.add(core, halo);
    g.position.set(this.shipPos.x, this.shipPos.y + 1.1, this.shipPos.z + 4.4);
    this.raiz.add(g);
    this.tiros.push({ tipo: 'plasma', obj: g, vel: 105 + 25 * fK, dano: 2.4 + 2.2 * fK, raio: 3.4 + 1.4 * fK, vida: 2.8 });
  }

  // ---- Disparos da Nave Inimiga Interdimensional ---------------------------------------------------
  _dispararAtaqueChefe() {
    const furia = this.chefeHp < CHEFE_HP_MAX * 0.52;
    this.chefePadrao = (this.chefePadrao + 1) % 3;
    this.som.tiroInimigo();

    const origem = this.chefePos.clone().add(new THREE.Vector3(0, -0.3, -4.5));
    // Predição suave da posição da nossa nave
    const alvo = new THREE.Vector3(
      this.shipPos.x + this.shipVel.x * 0.35,
      this.shipPos.y + 1.1 + this.shipVel.y * 0.35,
      this.shipPos.z
    );

    const criarTiroInimigo = (pos, dir, vel, raio, dano, roxo = false) => {
      const g = new THREE.Group();
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(raio * 0.52, 10, 8),
        new THREE.MeshBasicMaterial({ color: roxo ? 0xe879f9 : 0xfb7185 })
      );
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: roxo ? this.texRoxo : this.texInimigo, blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      sp.scale.setScalar(raio * 3.4);
      g.add(m, sp);
      g.position.copy(pos);
      this.raiz.add(g);
      this.tirosInimigos.push({ obj: g, v: dir.clone().normalize().multiplyScalar(vel), raio, dano, vida: 3.5 });
    };

    if (this.chefePadrao === 0) {
      // Rajada dupla de canhões das asas mirando no jogador
      for (const sx of [-5.2, 5.2]) {
        const p = origem.clone().add(new THREE.Vector3(sx, 0, 1.5));
        const dir = alvo.clone().sub(p);
        criarTiroInimigo(p, dir, furia ? 112 : 96, 0.95, furia ? 16 : 12, false);
      }
      this.chefeCoolTiro = furia ? 0.62 : 0.88;
    } else if (this.chefePadrao === 1) {
      // Leque interdimensional de 5 esferas púrpura/rubras (obriga desvio espacial!)
      const baseDir = alvo.clone().sub(origem).normalize();
      for (let k = -2; k <= 2; k++) {
        const d = baseDir.clone();
        d.x += k * 0.13;
        d.y += (Math.abs(k) === 1 ? 0.05 : -0.03);
        criarTiroInimigo(origem, d, furia ? 92 : 80, 0.85, 11, true);
      }
      this.chefeCoolTiro = furia ? 0.95 : 1.25;
    } else {
      // Torpedo pesado de Plasma Rubro do olho central
      const dir = alvo.clone().sub(origem);
      criarTiroInimigo(origem, dir, furia ? 88 : 76, 1.55, 22, false);
      this.chefeCoolTiro = furia ? 0.78 : 1.05;
    }
  }

  _spawnAsteroide(zInicial = 245) {
    if (!this.tplAsteroides.length) return;
    const prog = clamp(1 - this.distancia / DIST_INICIAL, 0, 1); // 0 -> 1 ao longo dos 3 minutos!
    const tpl = this.tplAsteroides[Math.floor(Math.random() * this.tplAsteroides.length)];
    const obj = tpl.clone(true);
    obj.traverse(m => {
      if (m.isMesh && m.material) {
        m.material = m.material.clone();
        if (m.material.emissive) m.material.emissive.setHex(0x000000);
      }
    });

    const rnd = Math.random();
    const colosso = rnd < (0.14 + prog * 0.16);
    const medio = !colosso && rnd < 0.58;
    const escala = colosso
      ? (4.2 + Math.random() * 2.2)
      : (medio ? (2.4 + Math.random() * 1.35) : (1.35 + Math.random() * 0.95));
    obj.scale.setScalar(escala);

    // Alta pressão: 58% mira próximo da trajetória predita da nave!
    const naRota = Math.random() < (0.52 + prog * 0.14);
    const leadX = this.shipPos.x + this.shipVel.x * 0.45;
    const leadY = this.shipPos.y + this.shipVel.y * 0.45;
    const ax = naRota ? clamp(leadX + (Math.random() - 0.5) * 11, -22, 22) : (Math.random() - 0.5) * 48;
    const ay = naRota ? clamp(leadY + (Math.random() - 0.5) * 7.5, -11, 12) : (Math.random() - 0.5) * 26;
    obj.position.set(ax, ay, zInicial);
    obj.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    this.raiz.add(obj);

    const velBase = (68 + prog * 46) + Math.random() * (34 + prog * 22);
    this.asteroides.push({
      obj,
      raio: escala * 1.06,
      hp: colosso ? 7 : (medio ? 3 : 1.5),
      grande: colosso || medio,
      colosso,
      vel: velBase,
      vx: (Math.random() - 0.5) * (4 + prog * 8),
      vy: (Math.random() - 0.5) * (3 + prog * 6),
      rot: new THREE.Vector3((Math.random() - 0.5) * 2.6, (Math.random() - 0.5) * 2.6, (Math.random() - 0.5) * 2.6),
      flash: 0,
    });
  }

  _spawnCapsulaReparo(pos) {
    const g = new THREE.Group();
    g.position.copy(pos);
    const oct = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.95, 0),
      new THREE.MeshBasicMaterial({ color: 0x4ade80 })
    );
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texReparo, blending: THREE.AdditiveBlending, depthWrite: false }));
    sp.scale.setScalar(4.2);
    g.add(oct, sp);
    this.raiz.add(g);
    this.reparos.push({ obj: g, oct, vel: 42 });
  }

  _aplicarImpactoNaNave(danoEscudo, perdaForca, msgExtra = '') {
    // Durante o Giro 360° evasivo, a nave desvia parte do impacto!
    const multGiro = this.giro360 > 0 ? 0.35 : 1.0;
    this.escudo = Math.max(0, this.escudo - danoEscudo * multGiro);
    this.forcaNave = Math.max(25, this.forcaNave - perdaForca * multGiro);
    this.batidas++;
    this.tempoSemDano = 0;
    this.danoFlash = 1.0;
    this.tremor = Math.max(this.tremor, 0.72);
    this.som.dano();

    if (perdaForca * multGiro >= 4 && this.batidas % 2 === 1) {
      this.toast?.(`⚠️ Impacto! Força e velocidade da nave caíram para ${Math.round(this.forcaNave)}%${msgExtra}`);
    }

    if (this.escudo <= 0) {
      this.som.explosao(true);
      this.escudo = 75;
      this.forcaNave = Math.max(35, this.forcaNave - 8);
      if (this.estado === 'voo') {
        this.distancia = Math.min(DIST_INICIAL, this.distancia + 10);
        for (const a of this.asteroides) this.raiz.remove(a.obj);
        this.asteroides.length = 0;
        this.toast?.('🛠️ Escudos sobrecarregados! Reiniciando sub-setor com motores avariados…');
      } else if (this.estado === 'chefe') {
        this.chefeHp = Math.min(CHEFE_HP_MAX, this.chefeHp + 25);
        this.toast?.('🛠️ Escudo de emergência ativado! Continue atirando na Nave Inimiga!');
      }
    }
    this._atualizarHud();
  }

  _explodir(pos, grande, roxo = false) {
    this.som.explosao(grande);
    this.tremor = Math.max(this.tremor, grande ? 0.62 : 0.28);

    const grupo = new THREE.Group();
    grupo.position.copy(pos);

    const bola = new THREE.Sprite(new THREE.SpriteMaterial({
      map: roxo ? this.texRoxo : this.texFogo, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
    }));
    bola.scale.setScalar(grande ? 16 : 8.0);
    const anel = new THREE.Mesh(
      new THREE.RingGeometry(0.7, 1.5, 28),
      new THREE.MeshBasicMaterial({
        color: roxo ? 0xd946ef : 0xfb923c, transparent: true, opacity: 0.92,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    grupo.add(bola, anel);

    const pedacos = [];
    const nPed = grande ? 16 : 8;
    const geoP = new THREE.DodecahedronGeometry(grande ? 0.72 : 0.40, 0);
    const matP = new THREE.MeshStandardMaterial({
      color: roxo ? 0x3b0764 : 0x7c4a32,
      emissive: roxo ? 0xc026d3 : 0xf97316,
      emissiveIntensity: 0.95, roughness: 0.8,
    });
    for (let i = 0; i < nPed; i++) {
      const m = new THREE.Mesh(geoP, matP);
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const v = dir.multiplyScalar((grande ? 20 : 13) + Math.random() * 15);
      grupo.add(m);
      pedacos.push({ m, v });
    }
    this.raiz.add(grupo);
    this.explosoes.push({ grupo, bola, anel, pedacos, idade: 0, dur: grande ? 1.05 : 0.68, grande });
  }

  _emitirFaiscaAvaria() {
    const m = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.16, 0),
      new THREE.MeshBasicMaterial({ color: Math.random() < 0.5 ? 0xf97316 : 0xfacc15 })
    );
    const sx = Math.random() < 0.5 ? -1.24 : 1.24;
    m.position.set(this.shipPos.x + sx + (Math.random() - 0.5) * 0.4, this.shipPos.y + 1.35, this.shipPos.z - 4.3);
    const v = new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 5, -24 - Math.random() * 12);
    this.raiz.add(m);
    this.faiscasMotor.push({ m, v, vida: 0.45 });
  }

  _atualizarHud() {
    if (this.elDist) {
      this.elDist.textContent = this.estado === 'chefe' ? 'BLOQUEADO!' : `${Math.max(0, Math.round(this.distancia * 2.25))}M km`;
    }
    if (this.elTempo) {
      if (this.estado === 'chefe') {
        this.elTempo.textContent = 'CHEFE!';
      } else {
        const segRest = Math.max(0, Math.ceil((this.distancia / DIST_INICIAL) * DURACAO_TRAVESSIA));
        const mm = String(Math.floor(segRest / 60)).padStart(2, '0');
        const ss = String(segRest % 60).padStart(2, '0');
        this.elTempo.textContent = `${mm}:${ss}`;
      }
    }
    if (this.elAst) this.elAst.textContent = `${this.destruidos}`;
    if (this.elEscudo) this.elEscudo.style.transform = `scaleX(${clamp(this.escudo / 100, 0, 1).toFixed(3)})`;
    if (this.elEscudoTxt) this.elEscudoTxt.textContent = `${Math.max(0, Math.round(this.escudo))}%`;
    if (this.elForca) this.elForca.style.transform = `scaleX(${clamp(this.forcaNave / 100, 0, 1).toFixed(3)})`;
    if (this.elForcaTxt) this.elForcaTxt.textContent = `${Math.round(this.forcaNave)}%`;
    if (this.elForcaRot) {
      this.elForcaRot.style.color = this.forcaNave < 50 ? '#f87171' : (this.forcaNave < 80 ? '#fde047' : '#86efac');
    }
    if (this.estado === 'chefe') {
      const kB = clamp(this.chefeHp / CHEFE_HP_MAX, 0, 1);
      if (this.elBossBarra) this.elBossBarra.style.transform = `scaleX(${kB.toFixed(3)})`;
      if (this.elBossTxt) this.elBossTxt.textContent = `${Math.ceil(kB * 100)}%`;
    }
  }

  _atualizarWarp(dt, velMult = 1) {
    if (!this.estrelasWarp) return;
    const arr = this.estrelasWarp.geometry.attributes.position.array;
    for (let i = 0; i < this.warpSeeds.length; i++) {
      const w = this.warpSeeds[i];
      w.z -= w.vel * velMult * dt;
      if (w.z < -45) {
        w.z = 245 + Math.random() * 45;
        w.x = (Math.random() - 0.5) * 150;
        w.y = (Math.random() - 0.5) * 95;
      }
      const j = i * 6;
      arr[j] = w.x; arr[j + 1] = w.y; arr[j + 2] = w.z;
      arr[j + 3] = w.x; arr[j + 4] = w.y; arr[j + 5] = w.z + 4.8 * velMult;
    }
    this.estrelasWarp.geometry.attributes.position.needsUpdate = true;
  }

  _atualizarExplosoesEFaiscas(dt) {
    for (let i = this.explosoes.length - 1; i >= 0; i--) {
      const e = this.explosoes[i];
      e.idade += dt;
      const k = e.idade / e.dur;
      if (k >= 1) { this.raiz.remove(e.grupo); this.explosoes.splice(i, 1); continue; }
      e.bola.material.opacity = (1 - k) * (1 - k);
      e.bola.scale.setScalar((e.grande ? 16 : 8.0) * (0.7 + k * 1.45));
      e.anel.scale.setScalar(1 + k * (e.grande ? 15 : 8.5));
      e.anel.material.opacity = (1 - k) * 0.85;
      for (const p of e.pedacos) {
        p.m.position.addScaledVector(p.v, dt);
        p.m.rotation.x += dt * 4; p.m.rotation.y += dt * 3;
        p.m.scale.setScalar(Math.max(0.05, 1 - k));
      }
    }
    for (let i = this.faiscasMotor.length - 1; i >= 0; i--) {
      const f = this.faiscasMotor[i];
      f.vida -= dt;
      if (f.vida <= 0) { this.raiz.remove(f.m); this.faiscasMotor.splice(i, 1); continue; }
      f.m.position.addScaledVector(f.v, dt);
      f.m.scale.setScalar(Math.max(0.1, f.vida / 0.45));
    }
  }

  /** Calcula a câmera espacial ativa (4 modos + suporte a giro 360° livre!). */
  _calcularCameraVoo(dt) {
    const tx = (Math.random() - 0.5) * this.tremor;
    const ty = (Math.random() - 0.5) * this.tremor;
    this.tempoSemOlhar += dt;

    // Modo 1: DENTRO DA CABINE (1ª Pessoa — acompanha a posição e inclinação da nave!)
    if (this.camModoEspaco === 1) {
      this.naveVoo.visible = false;
      if (this.cabineGrupo) {
        this.cabineGrupo.visible = true;
        this.cabineGrupo.position.copy(this.shipPos);
        this.cabineGrupo.rotation.set(this.naveVoo.rotation.x * 0.5, this.naveVoo.rotation.y * 0.5, this.naveVoo.rotation.z * 0.35);
      }
      this.painelCanvas.desenhar(this.t, true, {
        distancia: this.distancia,
        forca: this.forcaNave,
        chefe: this.estado === 'chefe',
      });
      const pCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(
        this.shipPos.x + tx * 0.3,
        this.shipPos.y + 1.98 + ty * 0.3,
        this.shipPos.z + 0.15
      ));
      const aCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(
        this.shipPos.x + this.shipVel.x * 0.18,
        this.shipPos.y + 2.02 + this.shipVel.y * 0.12,
        this.shipPos.z + 48
      ));
      return { p: pCam, a: aCam, fov: 58 };
    }

    // Nos modos externos (0, 2, 3), a nave externa fica visível e a cabine interna oculta
    this.naveVoo.visible = true;
    if (this.cabineGrupo) this.cabineGrupo.visible = false;

    // Modo 2: CÂMERA DE ASA / AÇÃO CINEMATOGRÁFICA (sobre o pod de armas direito!)
    if (this.camModoEspaco === 2) {
      const pCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(
        this.shipPos.x - 3.35 + tx,
        this.shipPos.y + 2.35 + ty,
        this.shipPos.z - 6.6
      ));
      const aCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(
        this.shipPos.x + 0.6,
        this.shipPos.y + 1.35,
        this.shipPos.z + 65
      ));
      return { p: pCam, a: aCam, fov: 62 };
    }

    // Modo 3: ÓRBITA 360° ESPACIAL LIVRE (gira suavemente 360° ou obedece o mouse/toque em qualquer direção!)
    if (this.camModoEspaco === 3) {
      if (this.tempoSemOlhar > 2.5) {
        this.orbitYaw += dt * 0.28; // rotação panorâmica suave 360° ao redor da nave!
      }
      const r = this.orbitDist;
      const cp = Math.cos(this.orbitPitch), sp = Math.sin(this.orbitPitch);
      const pCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(
        this.shipPos.x - Math.sin(this.orbitYaw) * cp * r + tx,
        this.shipPos.y + 1.6 + sp * r + ty,
        this.shipPos.z - Math.cos(this.orbitYaw) * cp * r
      ));
      const aCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(
        this.shipPos.x,
        this.shipPos.y + 1.4,
        this.shipPos.z + 2.0
      ));
      return { p: pCam, a: aCam, fov: 60 };
    }

    // Modo 0 (Padrão): 3ª Pessoa Dinâmica + toque 360° (arrastar mouse olha em 360° e volta suavemente após soltar!)
    if (this.tempoSemOlhar > 2.2) {
      this.orbitYaw += (0 - this.orbitYaw) * Math.min(1, dt * 3.5);
      this.orbitPitch += (0.18 - this.orbitPitch) * Math.min(1, dt * 3.5);
    }
    if (Math.abs(this.orbitYaw) > 0.02 || Math.abs(this.orbitPitch - 0.18) > 0.02) {
      const r = 15.2;
      const cp = Math.cos(this.orbitPitch), sp = Math.sin(this.orbitPitch);
      const pCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(
        this.shipPos.x - Math.sin(this.orbitYaw) * cp * r + tx,
        this.shipPos.y + 1.6 + sp * r + ty,
        this.shipPos.z - Math.cos(this.orbitYaw) * cp * r
      ));
      const aCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(this.shipPos.x, this.shipPos.y + 1.5, this.shipPos.z + 18));
      return { p: pCam, a: aCam, fov: 60 };
    }

    const pCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(this.shipPos.x * 0.74 + tx, this.shipPos.y * 0.74 + 4.4 + ty, -14.8));
    const aCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(this.shipPos.x * 0.85, this.shipPos.y * 0.85 + 1.5, 46));
    return { p: pCam, a: aCam, fov: 60 };
  }

  /** Atualização comum do controle da nave e chamas (com efeitos de perda de força/avaria e giro 360°!). */
  _atualizarControleNave(dt, entrada) {
    const fK = this.forcaNave / 100; // 1.0 (100%) -> 0.25 (25%)
    const velMult = 0.36 + 0.64 * fK;
    const acelMult = 0.32 + 0.68 * fK;

    this.coolLaser = Math.max(0, this.coolLaser - dt);
    this.coolPlasma = Math.max(0, this.coolPlasma - dt);
    this.coolGiro = Math.max(0, this.coolGiro - dt);
    this.tempoSemDano += dt;

    // Regeneração bem sutil de escudo após 6 s sem bater (mas a perda de FORÇA exige cápsula de reparo!)
    if (this.tempoSemDano > 6.0 && this.escudo < 100) {
      this.escudo = Math.min(100, this.escudo + dt * 2.5);
    }

    if (entrada.giroEsq) this.iniciarGiro360(-1);
    if (entrada.giroDir) this.iniciarGiro360(1);

    const inpX = clamp(-(entrada.lado || 0), -1, 1);
    const inpY = clamp(entrada.frente || 0, -1, 1);
    this.shipVel.x += (inpX * 27 * velMult - this.shipVel.x) * Math.min(1, dt * 8.5 * acelMult);
    this.shipVel.y += (inpY * 19 * velMult - this.shipVel.y) * Math.min(1, dt * 8.5 * acelMult);

    // Instabilidade mecânica leve se a nave estiver muito avariada (< 50% força)
    if (this.forcaNave < 50) {
      this.shipVel.x += Math.sin(this.t * 9.5) * (1 - fK) * 8 * dt;
      this.shipVel.y += Math.cos(this.t * 7.2) * (1 - fK) * 5 * dt;
    }

    this.shipPos.x = clamp(this.shipPos.x + this.shipVel.x * dt, -19.5, 19.5);
    this.shipPos.y = clamp(this.shipPos.y + this.shipVel.y * dt, -10.0, 11.0);
    this.naveVoo.position.copy(this.shipPos);

    let rollExtra = 0;
    if (this.giro360 > 0) {
      this.giro360 = Math.max(0, this.giro360 - dt);
      const uG = 1 - this.giro360 / 0.58;
      rollExtra = this.giroDir * uG * Math.PI * 2;
    }
    this.naveVoo.rotation.z = -this.shipVel.x * 0.025 + rollExtra;
    this.naveVoo.rotation.x = -this.shipVel.y * 0.018;
    this.naveVoo.rotation.y = this.shipVel.x * 0.008;

    // Chamas dos propulsores reagem à força da nave (engasgam e soltam faíscas quando avariada!)
    this.chamasVoo.forEach((c, idx) => {
      c.visible = true;
      const falha = this.forcaNave < 75 && idx === 0 ? (0.45 + 0.55 * Math.abs(Math.sin(this.t * 34))) : 1.0;
      const comp = (0.55 + 0.65 * fK) * falha * (1.0 + 0.2 * Math.sin(this.t * 50 + idx));
      c.scale.set(1, 1, comp);
      if (c.userData.matExt) {
        c.userData.matExt.color.setHex(this.forcaNave < 55 && idx === 0 ? 0xf97316 : 0x38bdf8);
      }
    });

    if (this.forcaNave < 72) {
      this.faiscaTimer -= dt;
      if (this.faiscaTimer <= 0) {
        this._emitirFaiscaAvaria();
        this.faiscaTimer = 0.06 + (fK * 0.22);
      }
    }

    if (entrada.laser || this.laserAtivo) this.dispararLaser();
    if (entrada.plasma || this.plasmaAtivo) this.dispararPlasma();
  }

  /** Atualização principal chamada a cada quadro. */
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

    if (this.marteMalha && this.raiz.visible) this.marteMalha.rotation.y += dt * 0.055;
    if (this.portalGrupo?.visible && this.portalMat) {
      this.portalMat.uniforms.uTime.value += dt;
      this.portalAneis.forEach((an, idx) => {
        an.rotation.z += dt * (idx % 2 === 0 ? 1.1 : -1.4);
      });
    }

    // -------------------------------------------------------- CUTSCENE 1A: DECOLAGEM DA LUA (sem astronauta parado no chão!)
    if (this.estado === 'cine_decolagem') {
      this.definirVisibilidadeJogador?.(false);
      const u = clamp(this.t / 2.8, 0, 1);
      const ign = clamp((this.t - 0.35) / 2.45, 0, 1);
      const elev = 36 * ign * ign;
      const O = this.lua.ORIGEM;
      const nx = this.naveLuaPos.x, ny = this.naveLuaPos.y + elev, nz = this.naveLuaPos.z;
      this.naveLua.obj.position.set(nx, ny, nz);
      this.naveLua.obj.rotation.x = -0.24 * suave(ign);
      if (ign > 0.28 && this.naveLua.trem) this.naveLua.trem.visible = false;
      for (const c of this.naveLua.chamas) {
        c.visible = true;
        const f = 1 + 0.25 * Math.sin(this.t * 48);
        c.scale.set(1, 1, (0.45 + 1.25 * u) * f);
      }
      const angCam = 0.78 - u * 0.45;
      const pCam = new THREE.Vector3(O.x + nx + Math.cos(angCam) * 14, ny + 3.4 - elev * 0.38, O.z + nz + Math.sin(angCam) * 14);
      const aCam = new THREE.Vector3(O.x + nx, ny + 1.6, O.z + nz);
      if (this.t >= 2.8) this._entrarPainelCabine();
      return { p: pCam, a: aCam, fov: 50 };
    }

    // -------------------------------------------------------- CUTSCENE 1B: PAINEL DENTRO DA CABINE -> DESTINO: MARTE
    if (this.estado === 'cine_painel') {
      const alerta = this.t > 3.2;
      this.painelCanvas.desenhar(this.t, alerta);
      this._atualizarWarp(dt, 1.35);

      if (alerta && this.elCineLeg) {
        this.elCineLeg.textContent = '⚠️ ALERTA: CINTURÃO DE ASTEROIDES DENSO (3 MIN DE VOO) · ARMAS ATIVADAS!';
      }

      const swayX = Math.sin(this.t * 1.05) * 0.06;
      const swayY = Math.cos(this.t * 0.85) * 0.03;
      const zoom = suave(clamp(this.t / 2.2, 0, 1));
      const pCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(swayX, 1.86 + swayY, -0.32 + zoom * 0.28));
      const aCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(0, 1.66 + (alerta ? 0.14 : 0.0), 2.35));

      if (this.t >= 5.6) this._iniciarCombate();
      return { p: pCam, a: aCam, fov: 46 };
    }

    // -------------------------------------------------------- FASE 1 ESPACIAL: TRAVESSIA DE 3 MINUTOS PELOS ASTEROIDES
    if (this.estado === 'voo') {
      this.tempoVoo += dt;
      const fK = this.forcaNave / 100;
      const propMult = 0.45 + 0.55 * fK; // se bater muito, até o avanço até Marte fica mais lento!
      const prog = clamp(1 - this.distancia / DIST_INICIAL, 0, 1);

      this._atualizarWarp(dt, (1.2 + prog * 0.7) * propMult);
      this._atualizarControleNave(dt, entrada);

      // Spawn intenso e escalonado em 3 ondas ao longo dos 3 minutos!
      this.spawnTimer -= dt;
      const maxAst = Math.round(26 + prog * 16);
      if (this.spawnTimer <= 0 && this.asteroides.length < maxAst) {
        this._spawnAsteroide(225 + Math.random() * 60);
        if (prog > 0.35 && Math.random() < 0.45) this._spawnAsteroide(240 + Math.random() * 50);
        this.spawnTimer = (0.28 - prog * 0.14) + Math.random() * 0.14;
      }

      // Tiros do jogador x Asteroides
      for (let i = this.tiros.length - 1; i >= 0; i--) {
        const ti = this.tiros[i];
        ti.vida -= dt;
        ti.obj.position.z += ti.vel * dt;
        let acertou = false;
        for (let j = this.asteroides.length - 1; j >= 0; j--) {
          const a = this.asteroides[j];
          if (ti.obj.position.distanceTo(a.obj.position) < a.raio + ti.raio) {
            a.hp -= ti.dano;
            a.flash = 0.14;
            acertou = true;
            if (ti.tipo === 'plasma') {
              for (let k = this.asteroides.length - 1; k >= 0; k--) {
                if (k === j) continue;
                const a2 = this.asteroides[k];
                if (a2.obj.position.distanceTo(ti.obj.position) < a2.raio + ti.raio * 2.4) {
                  a2.hp -= ti.dano * 0.75;
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

      // Asteroides x Nave
      for (let i = this.asteroides.length - 1; i >= 0; i--) {
        const a = this.asteroides[i];
        a.obj.position.z -= a.vel * dt;
        a.obj.position.x += a.vx * dt;
        a.obj.position.y += a.vy * dt;
        a.obj.rotation.x += a.rot.x * dt;
        a.obj.rotation.y += a.rot.y * dt;
        a.obj.rotation.z += a.rot.z * dt;

        if (a.flash > 0) {
          a.flash -= dt;
          a.obj.traverse(m => { if (m.isMesh && m.material?.emissive) m.material.emissive.setHex(a.flash > 0 ? 0xf97316 : 0x000000); });
        }

        if (a.hp <= 0) {
          const posMorte = a.obj.position.clone();
          this._explodir(posMorte, a.grande, false);
          if (a.colosso && Math.random() < 0.48) this._spawnCapsulaReparo(posMorte);
          this.raiz.remove(a.obj);
          this.asteroides.splice(i, 1);
          this.destruidos++;
          // Pequeno bônus de rota (~0.16%), mantendo a viagem de ~3 minutos!
          this.distancia = Math.max(0, this.distancia - (a.colosso ? 0.30 : 0.14));
          this._atualizarHud();
          continue;
        }

        const dNave = Math.hypot(
          a.obj.position.x - this.shipPos.x,
          a.obj.position.y - (this.shipPos.y + 1.2),
          a.obj.position.z - this.shipPos.z
        );
        if (dNave < a.raio + 2.3) {
          this._explodir(a.obj.position, true, false);
          this.raiz.remove(a.obj);
          this.asteroides.splice(i, 1);
          this._aplicarImpactoNaNave(a.colosso ? 32 : (a.grande ? 24 : 16), a.colosso ? 14 : (a.grande ? 10 : 7));
          continue;
        }

        if (a.obj.position.z < -38) {
          this.raiz.remove(a.obj);
          this.asteroides.splice(i, 1);
        }
      }

      // Cápsulas de Nano-Reparo (recuperam parte da força/velocidade perdida!)
      for (let i = this.reparos.length - 1; i >= 0; i--) {
        const r = this.reparos[i];
        r.obj.position.z -= r.vel * dt;
        r.oct.rotation.y += dt * 3.2;
        const d = Math.hypot(r.obj.position.x - this.shipPos.x, r.obj.position.y - (this.shipPos.y + 1.2), r.obj.position.z - this.shipPos.z);
        if (d < 4.2) {
          this.escudo = Math.min(100, this.escudo + 18);
          this.forcaNave = Math.min(100, this.forcaNave + 12);
          this.som.reparo();
          this.toast?.(`🔧 Nano-Reparo coletado! Força da nave subiu para ${Math.round(this.forcaNave)}%!`);
          this.raiz.remove(r.obj);
          this.reparos.splice(i, 1);
          this._atualizarHud();
          continue;
        }
        if (r.obj.position.z < -30) {
          this.raiz.remove(r.obj);
          this.reparos.splice(i, 1);
        }
      }

      this._atualizarExplosoesEFaiscas(dt);

      // Avanço de 3 minutos (100 / 180 s = 0.5556%/s * propMult)
      const taxaBase = DIST_INICIAL / DURACAO_TRAVESSIA;
      this.distancia = Math.max(0, this.distancia - taxaBase * propMult * dt);
      const prox = 1 - this.distancia / DIST_INICIAL;
      this.marteGrupo.position.set(0, 8 - prox * 4, 560 - prox * 285);
      this.marteGrupo.scale.setScalar(0.50 + prox * 0.22);
      this._atualizarHud();

      // Ao vencer o cinturão de asteroides -> Cutscene do Portal Interdimensional + Nave Inimiga!
      if (this.distancia <= 0) {
        this._iniciarCutscenePortal();
        return this._calcularCameraVoo(dt);
      }

      return this._calcularCameraVoo(dt);
    }

    // -------------------------------------------------------- CUTSCENE: PORTAL INTERDIMENSIONAL + NAVE INIMIGA
    if (this.estado === 'cine_portal') {
      this._atualizarWarp(dt, 0.45);
      const dur = 6.2;

      // 0..2.5s: o portal rasga o espaço e cresce na frente de Marte!
      const kPortal = suave(clamp(this.t / 2.2, 0, 1));
      this.portalGrupo.scale.setScalar(Math.max(0.02, kPortal));

      // 2.0..5.2s: a Nave Inimiga emerge de dentro do vórtice interdimensional!
      if (this.t > 1.8) {
        this.naveInimiga.visible = true;
        const kBoss = suave(clamp((this.t - 1.8) / 2.8, 0, 1));
        this.naveInimiga.position.set(0, 4 + Math.sin(this.t * 2.5) * 0.6, 122 - kBoss * 48);
        this.naveInimiga.rotation.set(0.06 * (1 - kBoss), Math.PI, Math.sin(this.t * 2) * 0.08);
        if (this.elCineLeg) {
          this.elCineLeg.textContent = '👾 NAVE INIMIGA EMERGIU DO PORTAL · DERROTE-A PARA ENTRAR EM MARTE!';
        }
      }

      const pCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(-12 + suave(this.t / dur) * 18, 5.5, -18));
      const aCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(0, 4, 118));
      if (this.t >= dur) this._iniciarBatalhaChefe();
      return { p: pCam, a: aCam, fov: 50 };
    }

    // -------------------------------------------------------- FASE 2 ESPACIAL: BATALHA CONTRA A NAVE INIMIGA
    if (this.estado === 'chefe') {
      this._atualizarWarp(dt, 0.65);
      this._atualizarControleNave(dt, entrada);

      // Movimentação evasiva 3D da Nave Inimiga na frente do portal e de Marte!
      const furia = this.chefeHp < CHEFE_HP_MAX * 0.52;
      const velB = furia ? 1.35 : 0.92;
      const alvoBx = Math.sin(this.t * velB) * 16.5 + Math.cos(this.t * velB * 2.1) * 4.0;
      const alvoBy = 2.8 + Math.cos(this.t * velB * 1.4) * 6.5;
      const alvoBz = 72 + Math.sin(this.t * 0.8) * 7.0;
      const vxB = (alvoBx - this.chefePos.x) * 3.5;
      this.chefePos.x += vxB * dt;
      this.chefePos.y += (alvoBy - this.chefePos.y) * 3.5 * dt;
      this.chefePos.z += (alvoBz - this.chefePos.z) * 3.0 * dt;

      this.naveInimiga.position.copy(this.chefePos);
      // Aponta a frente da nave inimiga para o jogador com inclinação dinâmica nas curvas!
      const dxJ = this.shipPos.x - this.chefePos.x;
      const dyJ = (this.shipPos.y + 1.2) - this.chefePos.y;
      const dzJ = this.shipPos.z - this.chefePos.z;
      this.naveInimiga.rotation.order = 'YXZ';
      this.naveInimiga.rotation.y = Math.atan2(dxJ, dzJ);
      this.naveInimiga.rotation.x = -Math.atan2(dyJ, Math.abs(dzJ)) * 0.65;
      this.naveInimiga.rotation.z = clamp(-vxB * 0.022, -0.48, 0.48);

      if (this.chefeFlash > 0) {
        this.chefeFlash -= dt;
        const emCor = this.chefeFlash > 0 ? 0xffffff : 0x000000;
        this.naveInimiga.traverse(m => {
          if (m.isMesh && m.name === 'CascoObsidiana' && m.material?.emissive) {
            m.material.emissive.setHex(emCor);
            m.material.emissiveIntensity = this.chefeFlash > 0 ? 0.85 : 0.0;
          }
        });
      }

      // Ataques da Nave Inimiga contra nós!
      this.chefeCoolTiro -= dt;
      if (this.chefeCoolTiro <= 0) this._dispararAtaqueChefe();

      // Tiros do Jogador x Nave Inimiga
      for (let i = this.tiros.length - 1; i >= 0; i--) {
        const ti = this.tiros[i];
        ti.vida -= dt;
        ti.obj.position.z += ti.vel * dt;
        // Caixa de colisão generosa para as asas e casco da nave inimiga (~15m de envergadura)
        const dx = Math.abs(ti.obj.position.x - this.chefePos.x);
        const dy = Math.abs(ti.obj.position.y - this.chefePos.y);
        const dz = Math.abs(ti.obj.position.z - this.chefePos.z);
        if (dx < 11.5 + ti.raio && dy < 4.5 + ti.raio && dz < 8.5 + ti.raio) {
          this.chefeHp = Math.max(0, this.chefeHp - ti.dano);
          this.chefeFlash = 0.10;
          this._explodir(ti.obj.position, ti.tipo === 'plasma', true);
          this.raiz.remove(ti.obj);
          this.tiros.splice(i, 1);
          this._atualizarHud();
          if (this.chefeHp <= 0) {
            this._iniciarDestruicaoChefe();
            return this._calcularCameraVoo(dt);
          }
          continue;
        }
        if (ti.vida <= 0) {
          this.raiz.remove(ti.obj);
          this.tiros.splice(i, 1);
        }
      }

      // Tiros da Nave Inimiga x Nossa Nave
      for (let i = this.tirosInimigos.length - 1; i >= 0; i--) {
        const ti = this.tirosInimigos[i];
        ti.vida -= dt;
        ti.obj.position.addScaledVector(ti.v, dt);
        const dJog = Math.hypot(
          ti.obj.position.x - this.shipPos.x,
          ti.obj.position.y - (this.shipPos.y + 1.2),
          ti.obj.position.z - this.shipPos.z
        );
        if (dJog < ti.raio + 2.15) {
          this._explodir(ti.obj.position, false, true);
          this.raiz.remove(ti.obj);
          this.tirosInimigos.splice(i, 1);
          this._aplicarImpactoNaNave(ti.dano, 4.5, ' (fogo inimigo!)');
          continue;
        }
        if (ti.vida <= 0 || ti.obj.position.z < -35) {
          this.raiz.remove(ti.obj);
          this.tirosInimigos.splice(i, 1);
        }
      }

      this._atualizarExplosoesEFaiscas(dt);
      this._atualizarHud();
      return this._calcularCameraVoo(dt);
    }

    // -------------------------------------------------------- CUTSCENE: DESTRUIÇÃO DA NAVE INIMIGA + COLAPSO DO PORTAL
    if (this.estado === 'cine_chefe_fim') {
      this._atualizarWarp(dt, 0.35);
      this._atualizarExplosoesEFaiscas(dt);

      if (this.t < 1.9 && Math.random() < dt * 9) {
        const pExp = this.chefePos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 8));
        this._explodir(pExp, true, Math.random() < 0.5);
      }
      if (this.t >= 1.9 && this.naveInimiga.visible) {
        this.naveInimiga.visible = false;
        this._explodir(this.chefePos, true, true);
      }
      // Portal implodindo até desaparecer e liberar Marte!
      const kColapso = 1 - suave(clamp((this.t - 1.4) / 1.6, 0, 1));
      this.portalGrupo.scale.setScalar(Math.max(0.001, kColapso));
      if (kColapso <= 0.02) this.portalGrupo.visible = false;

      const pCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(6, 5, -16));
      const aCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(0, 4, 110));
      if (this.t >= 3.3) this._iniciarChegadaMarte();
      return { p: pCam, a: aCam, fov: 48 };
    }

    // -------------------------------------------------------- CUTSCENE FINAL: MARTE 100% NA TELA + CÂMERA MEXENDO POUCO PRO LADO
    if (this.estado === 'cine_chegada') {
      this._atualizarWarp(dt, 0.28);
      const dur = 9.0;
      const u = clamp(this.t / dur, 0, 1);

      // A nave voa direto para dentro de Marte e diminui suavemente até sumir na atmosfera!
      const kVoo = suave(clamp((this.t - 0.8) / 7.4, 0, 1));
      const sx = -6.5 * (1 - kVoo) + Math.sin(kVoo * Math.PI) * 2.2;
      const sy = -2.2 * (1 - kVoo) + 4.0 * kVoo;
      const sz = -14 + kVoo * 204; // de z=-14 até z=190 (superfície frontal de Marte em 265 - 73.5 = 191.5!)
      this.naveVoo.position.set(sx, sy, sz);
      this.naveVoo.rotation.set(-0.035, 0.05 * (1 - kVoo), -0.14 * Math.sin(kVoo * Math.PI));
      const escNave = Math.max(0.02, 1.0 - Math.pow(kVoo, 2.1) * 0.97);
      this.naveVoo.scale.setScalar(escNave);
      this.naveVoo.visible = kVoo < 0.96;
      for (const c of this.chamasVoo) {
        c.visible = true;
        c.scale.set(1, 1, 1.2 + 0.2 * Math.sin(this.t * 45));
      }

      // Câmera mexe POUCO para o lado (-4.2 -> +4.2), mantendo o Planeta Marte 100% inteiro no quadro!
      const panX = -4.2 + suave(u) * 8.4;
      const panY = 4.2 - suave(u) * 0.3;
      const panZ = -36 + suave(u) * 3.0;
      const pCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(panX, panY, panZ));
      const aCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(0, 4, 265));

      if (this.t > 4.0 && this.elCineLeg) {
        this.elCineLeg.textContent = '🚀 ENTRANDO NA ATMOSFERA DE MARTE…';
      }
      if (this.t >= dur) this._mostrarFinal();
      return { p: pCam, a: aCam, fov: 46 };
    }

    // -------------------------------------------------------- TELA FINAL: "Nos veremos lá" (Marte 100% na tela!)
    if (this.estado === 'fim') {
      const pCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(4.2, 3.9, -33));
      const aCam = ORIGEM_MARTE.clone().add(new THREE.Vector3(0, 4, 265));
      return { p: pCam, a: aCam, fov: 46 };
    }

    return null;
  }

  /** Atalhos de inspeção e testes E2E */
  avancarParaPortal() {
    if (this.ativa) this._iniciarCutscenePortal();
  }

  causarDanoChefe(valor = 200) {
    if (this.estado !== 'chefe') return;
    this.chefeHp = Math.max(0, this.chefeHp - valor);
    this._atualizarHud();
    if (this.chefeHp <= 0) this._iniciarDestruicaoChefe();
  }

  info() {
    return {
      estado: this.estado,
      carregado: this.carregado,
      escudo: Math.round(this.escudo),
      forcaNave: Math.round(this.forcaNave),
      batidas: this.batidas,
      destruidos: this.destruidos,
      distancia: +this.distancia.toFixed(2),
      tempoVoo: +this.tempoVoo.toFixed(1),
      camModoEspaco: this.camModoEspaco,
      chefeHp: Math.round(this.chefeHp),
      asteroidesAtivos: this.asteroides.length,
      tirosAtivos: this.tiros.length,
      tirosInimigosAtivos: this.tirosInimigos.length,
      explosoesAtivas: this.explosoes.length,
      naveNaLua: !!this.naveLua,
    };
  }
}
