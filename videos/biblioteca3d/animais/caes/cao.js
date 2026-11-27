// CONTROLADOR DE CÃES 3D (Biblioteca 3D + Hryz City "Vida de Cachorro")
// Carrega qualquer uma das 4 raças riggadas no Blender (caramelo, pastor, dalmata, pug) com 22 ossos:
//   Quadril -> Coluna -> Peito -> Pescoco -> Cabeca -> (Mandibula, OrelhaE, OrelhaD)
//   Quadril -> Rabo1 -> Rabo2 -> Rabo3
//   Peito   -> PataFE1/2/3, PataFD1/2/3
//   Quadril -> PataTE1/2/3, PataTD1/2/3
//
// Uso:
//   const cao = await carregarCao('caramelo');
//   scene.add(cao.obj);
//   cao.tocar('farejar');   // ou 'parado', 'andar', 'correr', 'cheirarTraseiro', 'serCheirado', 'reverencia', 'marcar', 'cavar', 'sentar', 'latir', 'pular', 'rolar'
//   cao.atualizar(dt);

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const BASE_DIR = new URL('./', import.meta.url).href;
const _cacheGLTF = new Map();
const _qTmp = new THREE.Quaternion();
const _eTmp = new THREE.Euler(0, 0, 0, 'XYZ');
const _vTmp = new THREE.Vector3();

export const RACAS_CAES = {
  caramelo: { id: 'caramelo', nome: 'Caramelo',      desc: 'O lendário vira-lata brasileiro', icone: '🐕', arq: 'caramelo.glb', freqLatido: 410, velMult: 1.18, puloVy: 6.4 },
  pastor:   { id: 'pastor',   nome: 'Pastor Alemão', desc: 'Rápido, forte e farejador nato',   icone: '🐕‍🦺', arq: 'pastor.glb',   freqLatido: 255, velMult: 1.32, puloVy: 7.2 },
  dalmata:  { id: 'dalmata',  nome: 'Dálmata',       desc: 'Ágil, simpático e cheio de pintas', icone: '🐾', arq: 'dalmata.glb',  freqLatido: 360, velMult: 1.26, puloVy: 6.8 },
  pug:      { id: 'pug',      nome: 'Pug',           desc: 'Baixinho, fofo e bom de faro',      icone: '🐶', arq: 'pug.glb',      freqLatido: 540, velMult: 0.96, puloVy: 5.4 },
};

// Mapeia ações do Hryz City (universal.js / jogo.js) -> ações caninas nativas
const MAPA_ACOES = {
  ParadoPro: 'parado', Parado: 'parado',
  AndarPro: 'andar', Andar: 'andar',
  Trotar: 'trotar',
  CorrerSprint: 'correr', Correr: 'correr',
  AgacharParado: 'sentar',
  AgacharAndar: 'farejar',
  PularAr: 'pular', PuloNinja: 'pular', Pular: 'pular',
  AcrobaciaRolar: 'rolar',
  SocoJab: 'latir', SocoDireto: 'latir', SocoGancho: 'latir',
};

export class Cao {
  constructor(obj, raca = 'caramelo') {
    this.obj = obj;
    this.raca = raca;
    this.def = RACAS_CAES[raca] || RACAS_CAES.caramelo;
    this.ehCao = true;
    this.clipes = [];
    this.ossos = {};
    this.q0 = {};
    this.p0 = {};
    this.acao = 'parado';
    this.velAcao = 1;
    this.t = Math.random() * 10;
    this.tAcao = 0;
    this.alegria = 0.6;      // 0..1 (controla velocidade/amplitude do abanar de rabo)
    this.farejando = 0;      // 0..1 mistura de modo faro enquanto anda
    this.latindo = 0;        // temporizador de latido
    this.itemBoca = null;

    obj.traverse(o => {
      if (o.isBone) {
        this.ossos[o.name] = o;
        this.q0[o.name] = o.quaternion.clone();
        this.p0[o.name] = o.position.clone();
      }
      if (o.isMesh) {
        o.frustumCulled = false;
      }
    });

    // Nó de encaixe na boca para carregar ossos e bolinha de tênis!
    this.bocaNode = new THREE.Group();
    this.bocaNode.name = 'BocaCao';
    if (this.ossos.Cabeca) {
      this.bocaNode.position.set(0, 0.14, 0.02);
      this.ossos.Cabeca.add(this.bocaNode);
    } else {
      this.bocaNode.position.set(0, 0.45, 0.45);
      obj.add(this.bocaNode);
    }
  }

  tocar(nome, { velocidade = 1 } = {}) {
    const alvo = MAPA_ACOES[nome] || nome;
    if (this.acao !== alvo) {
      this.acao = alvo;
      this.tAcao = 0;
    }
    this.velAcao = velocidade || 1;
    if (alvo === 'latir') this.latindo = 0.36;
    return this;
  }

  latir(dur = 0.36) {
    this.latindo = Math.max(this.latindo, dur);
  }

  segurar(mesh) {
    this.soltar();
    if (!mesh) return;
    this.itemBoca = mesh;
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    this.bocaNode.add(mesh);
  }

  soltar() {
    if (!this.itemBoca) return null;
    const it = this.itemBoca;
    this.bocaNode.remove(it);
    this.itemBoca = null;
    return it;
  }

  bocaMundo(out = new THREE.Vector3()) {
    this.obj.updateMatrixWorld(true);
    return this.bocaNode.getWorldPosition(out);
  }

  traseiroMundo(out = new THREE.Vector3()) {
    this.obj.updateMatrixWorld(true);
    if (this.ossos.Rabo1) {
      this.ossos.Rabo1.getWorldPosition(out);
      out.y -= 0.055;
      return out;
    }
    return this.obj.localToWorld(out.set(0, 0.40, -0.35));
  }

  _rot(nome, rx, ry, rz, peso = 1) {
    const b = this.ossos[nome];
    const base = this.q0[nome];
    if (!b || !base) return;
    _eTmp.set(rx, ry, rz);
    _qTmp.setFromEuler(_eTmp);
    const alvo = base.clone().multiply(_qTmp);
    if (peso >= 0.999) b.quaternion.copy(alvo);
    else b.quaternion.slerp(alvo, peso);
  }

  _pos(nome, dx, dy, dz, peso = 1) {
    const b = this.ossos[nome];
    const base = this.p0[nome];
    if (!b || !base) return;
    _vTmp.set(base.x + dx, base.y + dy, base.z + dz);
    if (peso >= 0.999) b.position.copy(_vTmp);
    else b.position.lerp(_vTmp, peso);
  }

  atualizar(dt) {
    const d = Math.min(dt, 0.05);
    this.t += d * this.velAcao;
    this.tAcao += d;
    if (this.latindo > 0) this.latindo = Math.max(0, this.latindo - d);

    const t = this.t;
    const a = this.acao;
    const kLerp = Math.min(1, d * 12);

    // Valores alvo de cada junta
    let qRx = 0, qRy = 0, qRz = 0, qDy = 0, qDz = 0;
    let colRx = 0, colRy = 0;
    let peitoRx = 0, pescRx = 0, pescRy = 0, cabRx = 0, cabRy = 0, cabRz = 0;
    let mandRx = 0, orlE = 0, orlD = 0;
    let raboLift = 0.15, raboWagFreq = 5.5 + this.alegria * 5.0, raboWagAmp = 0.25 + this.alegria * 0.32;

    // Ângulos das 4 patas: [coxa/ombro, joelho/cotovelo, pata, abdução Z]
    const FE = [0, 0, 0, 0];
    const FD = [0, 0, 0, 0];
    const TE = [0, 0, 0, 0];
    const TD = [0, 0, 0, 0];

    if (a === 'parado' || a === 'latir') {
      const resp = Math.sin(t * 2.4);
      qDy = resp * 0.008;
      pescRx = resp * 0.04;
      cabRy = Math.sin(t * 0.85) * 0.16;
      cabRz = Math.sin(t * 0.62) * 0.06;
      mandRx = 0.08 + Math.max(0, Math.sin(t * 6.5)) * 0.12; // ofegando feliz!
      orlE = Math.sin(t * 1.4) * 0.06;
      orlD = -orlE;
    } else if (a === 'andar' || a === 'trotar' || a === 'correr') {
      const freq = a === 'correr' ? 13.5 : (a === 'trotar' ? 9.5 : 6.4);
      const amp = a === 'correr' ? 0.62 : (a === 'trotar' ? 0.44 : 0.30);
      const ph = t * freq;
      if (a === 'correr') {
        // Galope canino dinâmico (dianteiras juntas, traseiras juntas!)
        const sF = Math.sin(ph), sT = Math.sin(ph + 2.35);
        FE[0] = sF * amp; FE[1] = Math.max(0, -sF) * 0.72;
        FD[0] = Math.sin(ph + 0.35) * amp; FD[1] = Math.max(0, -Math.sin(ph + 0.35)) * 0.72;
        TE[0] = sT * amp * 1.05; TE[1] = Math.max(0, sT) * 0.62;
        TD[0] = Math.sin(ph + 2.65) * amp * 1.05; TD[1] = Math.max(0, Math.sin(ph + 2.65)) * 0.62;
        colRx = Math.sin(ph + 1.1) * 0.22;
        qDy = Math.abs(Math.sin(ph)) * 0.048;
        qRx = Math.sin(ph + 1.2) * 0.14;
        pescRx = -0.15 - colRx * 0.5;
        orlE = -0.22 + Math.sin(ph) * 0.18;
        orlD = -0.22 + Math.sin(ph) * 0.18;
        raboWagFreq = 12; raboWagAmp = 0.22; raboLift = 0.28;
      } else {
        // Trote diagonal natural (FE+TD juntos, FD+TE juntos)
        const s1 = Math.sin(ph), s2 = Math.sin(ph + Math.PI);
        FE[0] = s1 * amp; FE[1] = Math.max(0, -s1) * 0.48;
        TD[0] = s1 * amp; TD[1] = Math.max(0, s1) * 0.42;
        FD[0] = s2 * amp; FD[1] = Math.max(0, -s2) * 0.48;
        TE[0] = s2 * amp; TE[1] = Math.max(0, s2) * 0.42;
        qDy = Math.abs(Math.sin(ph)) * 0.022;
        colRy = Math.sin(ph) * 0.07;
        pescRx = -0.05 + Math.sin(ph * 2) * 0.05;
        orlE = Math.sin(ph * 2) * 0.08;
        orlD = orlE;
      }
      // Se estiver farejando andando (modo faro ligado!)
      if (this.farejando > 0.05) {
        const fk = this.farejando;
        pescRx += 0.55 * fk;
        cabRx += 0.22 * fk + Math.sin(t * 14) * 0.06 * fk;
        cabRy += Math.sin(t * 5.2) * 0.28 * fk;
      }
    } else if (a === 'farejar') {
      // Focinho bem baixo no chão rastreando o cheiro!
      const ph = t * 5.2;
      qDy = -0.04;
      qRx = 0.12;
      pescRx = 0.72;
      cabRx = 0.28 + Math.sin(t * 16) * 0.08;
      cabRy = Math.sin(t * 4.5) * 0.34;
      orlE = 0.22; orlD = 0.22;
      raboLift = 0.30; raboWagFreq = 4.2; raboWagAmp = 0.18;
      FE[0] = Math.sin(ph) * 0.16; FD[0] = -FE[0];
      TE[0] = -FE[0] * 0.8; TD[0] = FE[0] * 0.8;
    } else if (a === 'cheirarTraseiro') {
      // Cena de socialização canina: focado no traseiro/base do rabo do outro cão, farejando rápido e abanando o rabo!
      const snf = Math.sin(t * 17.5);
      qDy = -0.02 + snf * 0.008;
      qDz = 0.04 + Math.max(0, snf) * 0.025;
      colRx = 0.08;
      pescRx = 0.36 + snf * 0.08;
      cabRx = 0.12 + snf * 0.11;
      cabRy = Math.sin(t * 6.0) * 0.18;
      orlE = 0.26; orlD = 0.26;
      raboLift = 0.52; raboWagFreq = 11.5; raboWagAmp = 0.52;
      FE[0] = 0.18; FD[0] = 0.14;
      TE[0] = -0.10; TD[0] = -0.12;
    } else if (a === 'serCheirado') {
      // Outro cão parado, rabo bem erguido abanando alegre, olhando curioso para trás por cima do ombro!
      qDy = Math.sin(t * 4.5) * 0.008;
      colRy = 0.18;
      pescRy = 0.42;
      cabRy = 0.36;
      cabRz = -0.12;
      orlE = 0.18; orlD = 0.18;
      raboLift = 0.72; raboWagFreq = 13.0; raboWagAmp = 0.55;
      mandRx = 0.18;
    } else if (a === 'reverencia') {
      // Play-bow! Peito rente ao chão, patas dianteiras estendidas p/ frente, bumbum alto abanando muito!
      qDy = -0.02 + Math.sin(t * 10) * 0.015;
      qRx = 0.46;
      colRx = -0.16;
      peitoRx = -0.18;
      pescRx = -0.45;
      cabRx = -0.15;
      cabRy = Math.sin(t * 5) * 0.15;
      mandRx = 0.24;
      FE[0] = -0.78; FE[1] = 0.32;
      FD[0] = -0.78; FD[1] = 0.32;
      TE[0] = -0.25; TD[0] = -0.25;
      raboLift = 0.65; raboWagFreq = 16.0; raboWagAmp = 0.62;
    } else if (a === 'marcar') {
      // Levanta bem a pata traseira esquerda para marcar o hidrante/árvore!
      const sub = Math.min(1, this.tAcao / 0.35);
      qRz = -0.18 * sub;
      qRy = -0.10 * sub;
      TE[0] = -0.45 * sub;
      TE[1] = 0.55 * sub;
      TE[3] = 1.28 * sub; // abdução lateral bem clara!
      TD[0] = 0.08 * sub;
      pescRy = 0.24 * sub;
      cabRy = 0.20 * sub;
      raboLift = 0.45; raboWagFreq = 5.0; raboWagAmp = 0.16;
    } else if (a === 'cavar') {
      // Cavando terra freneticamente com as patas dianteiras!
      const ph = t * 18.0;
      qDy = -0.06;
      qRx = 0.34;
      pescRx = 0.42;
      cabRx = 0.20;
      FE[0] = -0.35 + Math.sin(ph) * 0.65; FE[1] = 0.45 + Math.max(0, Math.cos(ph)) * 0.55;
      FD[0] = -0.35 + Math.sin(ph + Math.PI) * 0.65; FD[1] = 0.45 + Math.max(0, Math.cos(ph + Math.PI)) * 0.55;
      TE[0] = -0.22; TD[0] = -0.22;
      raboLift = 0.55; raboWagFreq = 14.0; raboWagAmp = 0.48;
    } else if (a === 'sentar') {
      // Sentadinho fofo esperando carinho ou descansando!
      qDy = -0.14;
      qRx = -0.58;
      colRx = 0.18;
      peitoRx = 0.15;
      pescRx = 0.20;
      cabRx = 0.06;
      cabRy = Math.sin(t * 1.1) * 0.20;
      mandRx = 0.10 + Math.max(0, Math.sin(t * 6)) * 0.10;
      TE[0] = -0.78; TE[1] = 0.95;
      TD[0] = -0.78; TD[1] = 0.95;
      FE[0] = 0.36; FE[1] = -0.05;
      FD[0] = 0.36; FD[1] = -0.05;
      raboLift = -0.15; raboWagFreq = 6.5; raboWagAmp = 0.36;
    } else if (a === 'pular') {
      qRx = -0.28;
      colRx = 0.22;
      pescRx = -0.18;
      FE[0] = -0.75; FE[1] = 0.62;
      FD[0] = -0.75; FD[1] = 0.62;
      TE[0] = 0.72; TE[1] = 0.25;
      TD[0] = 0.72; TD[1] = 0.25;
      raboLift = 0.35; raboWagFreq = 10; raboWagAmp = 0.25;
    } else if (a === 'rolar') {
      // Cambalhota / rolamento canino fofo
      const u = Math.min(1, this.tAcao / 0.55);
      qRz = u * Math.PI * 2;
      qDy = -0.12 * Math.sin(u * Math.PI);
      FE[0] = -0.65; FD[0] = -0.65; TE[0] = 0.65; TD[0] = 0.65;
    }

    // Sobreposição do latido (abre a mandíbula e inclina a cabeça p/ cima!)
    if (this.latindo > 0) {
      const lk = Math.sin((this.latindo / 0.36) * Math.PI);
      mandRx = Math.max(mandRx, lk * 0.52);
      cabRx -= lk * 0.22;
      pescRx -= lk * 0.14;
      qDy += lk * 0.025;
      raboWagFreq = 14;
      raboWagAmp = 0.52;
    }

    // Se estiver carregando osso ou bolinha na boca, segura firme com a mandíbula!
    if (this.itemBoca) mandRx = 0.24;

    // Aplica nos 22 ossos
    this._pos('Quadril', 0, qDy, qDz, kLerp);
    this._rot('Quadril', qRx, qRy, qRz, kLerp);
    this._rot('Coluna', colRx, colRy, 0, kLerp);
    this._rot('Peito', peitoRx, -colRy * 0.5, 0, kLerp);
    this._rot('Pescoco', pescRx, pescRy, 0, kLerp);
    this._rot('Cabeca', cabRx, cabRy, cabRz, kLerp);
    this._rot('Mandibula', mandRx, 0, 0, Math.min(1, d * 24));
    this._rot('OrelhaE', orlE, 0, 0, kLerp);
    this._rot('OrelhaD', orlD, 0, 0, kLerp);

    // Cauda com onda em 3 segmentos (alegria pura!)
    const wag1 = Math.sin(t * raboWagFreq) * raboWagAmp;
    const wag2 = Math.sin(t * raboWagFreq - 0.7) * raboWagAmp * 0.85;
    const wag3 = Math.sin(t * raboWagFreq - 1.4) * raboWagAmp * 0.70;
    this._rot('Rabo1', raboLift, 0, wag1, kLerp);
    this._rot('Rabo2', raboLift * 0.25, 0, wag2, kLerp);
    this._rot('Rabo3', raboLift * 0.15, 0, wag3, kLerp);

    // 4 Patas
    this._rot('PataFE1', FE[0], 0, FE[3], kLerp); this._rot('PataFE2', FE[1], 0, 0, kLerp); this._rot('PataFE3', FE[2], 0, 0, kLerp);
    this._rot('PataFD1', FD[0], 0, FD[3], kLerp); this._rot('PataFD2', FD[1], 0, 0, kLerp); this._rot('PataFD3', FD[2], 0, 0, kLerp);
    this._rot('PataTE1', TE[0], 0, TE[3], kLerp); this._rot('PataTE2', TE[1], 0, 0, kLerp); this._rot('PataTE3', TE[2], 0, 0, kLerp);
    this._rot('PataTD1', TD[0], 0, TD[3], kLerp); this._rot('PataTD2', TD[1], 0, 0, kLerp); this._rot('PataTD3', TD[2], 0, 0, kLerp);
  }
}

export async function carregarCao(raca = 'caramelo', { url = null, sombra = true } = {}) {
  const def = RACAS_CAES[raca] || RACAS_CAES.caramelo;
  const arqUrl = url || new URL(def.arq, BASE_DIR).href;
  let gltf = _cacheGLTF.get(arqUrl);
  if (!gltf) {
    gltf = await new GLTFLoader().loadAsync(arqUrl);
    _cacheGLTF.set(arqUrl, gltf);
  }
  const clone = SkeletonUtils.clone(gltf.scene);
  clone.traverse(m => {
    if (m.isMesh) {
      m.castShadow = sombra;
      m.receiveShadow = true;
    }
  });
  return new Cao(clone, def.id);
}
