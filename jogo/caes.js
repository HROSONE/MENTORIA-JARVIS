// VIDA DE CACHORRO — Sistema completo de olfato (faro 3D), lixo com comida,
// socialização canina (cheirar o traseiro/ânus + reverência + matilha),
// marcação de território em hidrantes, escavação de ossos e bolinha de tênis!

import * as THREE from 'three';
import { CALCADA } from '../videos/biblioteca3d/cidade/kit.js';
import { carregarCao } from '../videos/biblioteca3d/animais/caes/cao.js';

const COR_CHEIRO = {
  lixo: 0x4ade80,     // verde-dourado: comida no lixo
  cao: 0xf472b6,      // rosa: outros cães para socializar
  parceira: 0xf43f5e, // vermelho-rosa apaixonado: parceira (Luna)
  hidrante: 0xfacc15, // amarelo: território (xixi)
  osso: 0xfb923c,     // laranja: osso enterrado
};

function angDiff(a, b) {
  let d = (b - a + Math.PI) % (Math.PI * 2) - Math.PI;
  return d < -Math.PI ? d + Math.PI * 2 : d;
}

function criarTexSombraCao() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 4, 32, 32, 30);
  gr.addColorStop(0, 'rgba(0,0,0,0.44)');
  gr.addColorStop(0.6, 'rgba(0,0,0,0.18)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

function criarTexPuff() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  gr.addColorStop(0, 'rgba(255,255,255,0.92)');
  gr.addColorStop(0.45, 'rgba(255,255,255,0.45)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function criarTexCoracao() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#fb7185';
  g.beginPath();
  g.moveTo(32, 54);
  g.bezierCurveTo(10, 38, 6, 22, 18, 13);
  g.bezierCurveTo(26, 7, 32, 16, 32, 20);
  g.bezierCurveTo(32, 16, 38, 7, 46, 13);
  g.bezierCurveTo(58, 22, 54, 38, 32, 54);
  g.closePath();
  g.fill();
  g.strokeStyle = '#fff1f2';
  g.lineWidth = 2.5;
  g.stroke();
  return new THREE.CanvasTexture(c);
}

function criarLacoParceira() {
  const g = new THREE.Group();
  const matRosa = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.35, metalness: 0.08 });
  const matPerola = new THREE.MeshStandardMaterial({ color: 0xffe4e6, roughness: 0.25, metalness: 0.2 });
  for (const sgn of [-1, 1]) {
    const aba = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.062, 10), matRosa);
    aba.rotation.z = sgn * (Math.PI / 2 - 0.18);
    aba.position.set(sgn * 0.032, 0, 0);
    aba.scale.set(1, 1, 0.55);
    g.add(aba);
  }
  const no = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), matPerola);
  g.add(no);
  return g;
}

function criarJatoXixi() {
  // Arco parabólico dourado translúcido de xixi (estendido ao longo de +X local!)
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const u = i / 14;
    pts.push(new THREE.Vector3(u * 0.58, 0.28 + Math.sin(u * Math.PI * 0.65) * 0.07 - u * u * 0.33, 0));
  }
  const curva = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curva, 16, 0.011, 8, false);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xfde047, emissive: 0xeab308, emissiveIntensity: 0.35,
    transparent: true, opacity: 0.88, roughness: 0.18,
  });
  const m = new THREE.Mesh(geo, mat);
  m.visible = false;
  return m;
}

function criarPocaXixi(x, z) {
  const grp = new THREE.Group();
  grp.position.set(x, CALCADA + 0.018, z);
  const poca = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 20),
    new THREE.MeshStandardMaterial({
      color: 0xfacc15, emissive: 0xca8a04, emissiveIntensity: 0.22,
      roughness: 0.12, metalness: 0.15, transparent: true, opacity: 0.78, depthWrite: false,
    })
  );
  poca.rotation.x = -Math.PI / 2;
  poca.scale.set(1.18, 0.88, 1);
  grp.add(poca);
  const anel = new THREE.Mesh(
    new THREE.RingGeometry(0.36, 0.44, 24),
    new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })
  );
  anel.rotation.x = -Math.PI / 2;
  anel.position.y = 0.005;
  grp.add(anel);
  return { grp, poca, anel, x, z };
}

function criarMalhaOsso(escala = 1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xf8f0dc, roughness: 0.45, metalness: 0.05 });
  const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.24, 10), mat);
  haste.rotation.z = Math.PI / 2;
  g.add(haste);
  const sph = new THREE.SphereGeometry(0.048, 10, 8);
  for (const sx of [-0.12, 0.12]) {
    for (const sz of [-0.036, 0.036]) {
      const m = new THREE.Mesh(sph, mat);
      m.position.set(sx, 0, sz);
      g.add(m);
    }
  }
  g.scale.setScalar(escala);
  return g;
}

function criarLixeira3D(x, z) {
  const grp = new THREE.Group();
  grp.position.set(x, CALCADA, z);

  const matCorpo = new THREE.MeshStandardMaterial({ color: 0x3f4f5c, roughness: 0.52, metalness: 0.42 });
  const matBorda = new THREE.MeshStandardMaterial({ color: 0x222c34, roughness: 0.45, metalness: 0.55 });
  const matSaco = new THREE.MeshStandardMaterial({ color: 0x161b22, roughness: 0.72, metalness: 0.06 });

  // Corpo cilíndrico com frisos
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.29, 0.82, 16), matCorpo);
  corpo.position.y = 0.41;
  grp.add(corpo);

  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.355, 0.028, 8, 18), matBorda);
  aro.rotation.x = Math.PI / 2;
  aro.position.y = 0.82;
  grp.add(aro);

  // Saco de lixo interno saindo um pouco
  const saco = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 1), matSaco);
  saco.position.set(0.02, 0.78, -0.02);
  saco.scale.set(1.0, 0.72, 1.0);
  grp.add(saco);

  // Pivô da tampa articulada
  const pivoTampa = new THREE.Group();
  pivoTampa.position.set(0, 0.84, -0.34);
  const tampa = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.06, 16), matBorda);
  tampa.position.set(0, 0.03, 0.34);
  pivoTampa.add(tampa);
  const alca = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 6, 12, Math.PI), matBorda);
  alca.position.set(0, 0.07, 0.34);
  pivoTampa.add(alca);
  grp.add(pivoTampa);

  // Comidinhas (pizza, osso e salsicha) que saltam ao revirar!
  const restos = new THREE.Group();
  restos.visible = false;

  // Fatia de pizza
  const pizza = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.03, 3),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 })
  );
  pizza.rotation.y = 0.4;
  pizza.position.set(-0.18, 0.05, 0.56);
  restos.add(pizza);

  // Osso suculento
  const osso = criarMalhaOsso(0.95);
  osso.position.set(0.22, 0.06, 0.62);
  osso.rotation.y = 0.8;
  restos.add(osso);

  // Salsicha
  const salsicha = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.036, 0.14, 6, 10),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.42 })
  );
  salsicha.rotation.z = Math.PI / 2;
  salsicha.rotation.y = -0.5;
  salsicha.position.set(0.02, 0.05, 0.72);
  restos.add(salsicha);

  grp.add(restos);

  // Anel luminoso de comida fresca (visível no modo faro)
  const anel = new THREE.Mesh(
    new THREE.RingGeometry(0.46, 0.62, 24),
    new THREE.MeshBasicMaterial({ color: COR_CHEIRO.lixo, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false })
  );
  anel.rotation.x = -Math.PI / 2;
  anel.position.y = 0.03;
  grp.add(anel);

  return { grp, pivoTampa, restos, anel, x, z, revirada: false, tampaAng: 0, sacudir: 0, respawnaEm: 0 };
}

function criarHidrante3D(x, z) {
  const grp = new THREE.Group();
  grp.position.set(x, CALCADA, z);

  const matVerm = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.36, metalness: 0.35 });
  const matPrata = new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.28, metalness: 0.75 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.14, 12), matVerm);
  base.position.y = 0.07;
  grp.add(base);

  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.52, 12), matVerm);
  corpo.position.y = 0.38;
  grp.add(corpo);

  const cupula = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), matVerm);
  cupula.position.y = 0.64;
  grp.add(cupula);

  const pino = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.09, 8), matPrata);
  pino.position.y = 0.80;
  grp.add(pino);

  for (const sx of [-0.17, 0.17]) {
    const bico = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.09, 10), matPrata);
    bico.rotation.z = Math.PI / 2;
    bico.position.set(sx, 0.48, 0);
    grp.add(bico);
  }

  // Marca de território no chão (aparece depois de marcar!)
  const marca = new THREE.Mesh(
    new THREE.CircleGeometry(0.56, 24),
    new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.0, depthWrite: false })
  );
  marca.rotation.x = -Math.PI / 2;
  marca.position.y = 0.025;
  grp.add(marca);

  return { grp, marca, x, z, marcado: false };
}

function criarMonteOsso3D(x, z) {
  const grp = new THREE.Group();
  grp.position.set(x, CALCADA, z);

  const matTerra = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.92 });
  const monte = new THREE.Mesh(new THREE.SphereGeometry(0.52, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), matTerra);
  monte.scale.set(1.15, 0.45, 1.0);
  grp.add(monte);

  // Pedrinhas ao redor
  for (let i = 0; i < 5; i++) {
    const a = i * 1.26;
    const ped = new THREE.Mesh(new THREE.DodecahedronGeometry(0.075, 0), matTerra);
    ped.position.set(Math.cos(a) * 0.46, 0.04, Math.sin(a) * 0.40);
    grp.add(ped);
  }

  // Pontinha do osso aparecendo levemente
  const osso = criarMalhaOsso(1.1);
  osso.position.set(0.06, 0.14, 0.04);
  osso.rotation.set(0.35, 0.4, 0.65);
  grp.add(osso);

  return { grp, monte, osso, x, z, cavado: false, ossoVoando: 0 };
}

function criarBolinha3D(x, z) {
  const grp = new THREE.Group();
  const bola = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xd9f99d, emissive: 0x65a30d, emissiveIntensity: 0.25, roughness: 0.65 })
  );
  grp.add(bola);
  const faixa = new THREE.Mesh(
    new THREE.TorusGeometry(0.111, 0.011, 6, 20),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  faixa.rotation.x = 0.65;
  grp.add(faixa);
  grp.position.set(x, CALCADA + 0.11, z);
  return {
    grp, x, y: CALCADA + 0.11, z,
    vx: 0, vy: 0, vz: 0,
    naBoca: false,
    brincou: false,
  };
}

export class VidaCachorro {
  constructor({ scene, som, efeitos, mostrarToast, darPontos, resolverColisoes, alturaChao, baloesEl }) {
    this.scene = scene;
    this.som = som;
    this.efeitos = efeitos;
    this.mostrarToast = mostrarToast;
    this.darPontos = darPontos;
    this.resolverColisoes = resolverColisoes;
    this.alturaChao = alturaChao;
    this.baloesEl = baloesEl;

    this.raiz = new THREE.Group();
    this.raiz.name = 'VidaCachorroMundo';
    this.scene.add(this.raiz);

    this.texSombra = criarTexSombraCao();
    this.texPuff = criarTexPuff();
    this.texCoracao = criarTexCoracao();

    // Estado do jogador canino
    this.ativo = false;
    this.faroAtivo = false;
    this.fome = 82;          // 0..100
    this.felicidade = 100;
    this.lixoRevirado = 0;
    this.caesSocializados = 0;
    this.territoriosMarcados = 0;
    this.ossosCavados = 0;
    this.carinhosEBolinha = 0;
    this.parceira = null;        // NPC Luna conquistada!
    this.gestacao = 0;           // segundos até nascerem os filhotes
    this.filhotes = [];          // 3 filhotinhos 3D que seguem a família
    this.filhotesNascidos = false;
    this._nascendo = false;
    this.pocasXixi = [];         // poças amarelas permanentes de território
    this.todosConcluidos = false;

    // Jato 3D parabólico de xixi reutilizável
    this.jatoXixi = criarJatoXixi();
    this.raiz.add(this.jatoXixi);

    // Cena ativa (cheirar traseiro / parceira / nascimento / revirar lixo / marcar território / cavar osso)
    this.cena = null;
    this._camP = new THREE.Vector3();
    this._camA = new THREE.Vector3();
    this._vTmp = new THREE.Vector3();

    // Cooldowns de extras
    this._cdCarinho = 0;
    this._cdPerseguir = 0;
    this._tParticula = 0;

    // Elementos do mundo interativo (próximos à Delegacia e Praça Central para descoberta imediata!)
    this.lixeiras = [
      criarLixeira3D(142.2, 162.8),
      criarLixeira3D(161.0, 162.8),
      criarLixeira3D(150.5, 173.4),
      criarLixeira3D(194.5, 162.2),
      criarLixeira3D(216.0, 159.5),
      criarLixeira3D(232.0, 145.0),
    ];
    for (const l of this.lixeiras) this.raiz.add(l.grp);

    this.hidrantes = [
      criarHidrante3D(152.0, 163.0),
      criarHidrante3D(168.5, 163.0),
      criarHidrante3D(185.0, 163.0),
      criarHidrante3D(207.5, 162.8),
      criarHidrante3D(228.0, 162.8),
      criarHidrante3D(136.5, 173.2),
    ];
    for (const h of this.hidrantes) this.raiz.add(h.grp);

    this.ossos = [
      criarMonteOsso3D(164.5, 159.8),
      criarMonteOsso3D(198.0, 146.5),
      criarMonteOsso3D(223.0, 141.5),
      criarMonteOsso3D(209.5, 123.5),
    ];
    for (const o of this.ossos) this.raiz.add(o.grp);

    this.bolinha = criarBolinha3D(149.4, 163.7);
    this.raiz.add(this.bolinha.grp);

    // 6 cães NPC autônomos (incluindo Luna, a Parceira romântica com lacinho rosa!)
    this.caesNpc = [];
    this._definicoesNpc = [
      { nome: 'Pipoca',  raca: 'caramelo', x: 156.2, z: 163.4, ry: -1.35, raio: 6.5 },
      { nome: 'Luna',    raca: 'caramelo', x: 164.0, z: 163.5, ry: -1.60, raio: 5.5, ehParceira: true },
      { nome: 'Rex',     raca: 'pastor',   x: 204.0, z: 152.0, ry: 0.7,   raio: 9.0 },
      { nome: 'Toby',    raca: 'dalmata',  x: 219.5, z: 136.0, ry: -2.1,  raio: 10.0 },
      { nome: 'Bolinha', raca: 'pug',      x: 199.0, z: 137.0, ry: 1.4,   raio: 8.0 },
      { nome: 'Mel',     raca: 'caramelo', x: 153.0, z: 173.4, ry: 2.8,   raio: 7.5 },
    ];
    this._carregouNpcs = false;

    // Pool de partículas de cheiro / xixi / terra / corações (sprites leves)
    this.particulas = [];
    this.faroRastro = [];
    this._criarRastroFaro();

    // Balão de cena flutuante para a socialização canina
    this.balaoCena = document.createElement('div');
    this.balaoCena.className = 'balao oculto';
    this.balaoCena.style.zIndex = '26';
    if (this.baloesEl) this.baloesEl.appendChild(this.balaoCena);

    // Referências HUD
    this.elHud = document.getElementById('hud-cao');
    this.elFomeBarra = document.getElementById('cao-fome-barra');
    this.elFomeVal = document.getElementById('cao-fome-val');
    this.elMatilha = document.getElementById('cao-matilha');
    this.elFamilia = document.getElementById('cao-familia');
    this.elObjLixo = document.getElementById('obj-cao-lixo');
    this.elObjSocial = document.getElementById('obj-cao-social');
    this.elObjTerr = document.getElementById('obj-cao-terr');
    this.elObjParceira = document.getElementById('obj-cao-parceira');
    this.elObjOsso = document.getElementById('obj-cao-osso');
    this.elObjExtra = document.getElementById('obj-cao-extra');
    this.elBtnFaro = document.getElementById('touch-faro');
    this.elCine = document.getElementById('cine-cao');
    this.elCineTag = document.getElementById('cine-cao-tag');
    this.elCineLeg = document.getElementById('cine-cao-legenda');
    this.elCinePular = document.getElementById('cine-cao-pular');
    this._pAnusTmp = new THREE.Vector3();
    this._pFocTmp = new THREE.Vector3();
    this._pMidTmp = new THREE.Vector3();
    if (this.elCinePular) {
      this.elCinePular.onclick = () => {
        if (this.cena && ['socializar', 'parceira', 'nascimento'].includes(this.cena.tipo)) this.cena.t = this.cena.dur;
      };
    }

    this._atualizarHud();
  }

  _mostrarCine(visivel, tag = '', legenda = '') {
    document.body.classList.toggle('cine-cao', !!visivel);
    if (this.elCine) this.elCine.classList.toggle('oculto', !visivel);
    if (visivel && this.elCineTag && tag) this.elCineTag.textContent = tag;
    if (visivel && this.elCineLeg && legenda) this.elCineLeg.textContent = legenda;
  }

  _criarRastroFaro() {
    // 14 bolhas flutuantes formando uma trilha olfativa do focinho até o objetivo mais próximo!
    for (let i = 0; i < 14; i++) {
      const mat = new THREE.SpriteMaterial({
        map: this.texPuff,
        color: COR_CHEIRO.lixo,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const sp = new THREE.Sprite(mat);
      sp.scale.setScalar(0.32);
      sp.visible = false;
      this.raiz.add(sp);
      this.faroRastro.push(sp);
    }
  }

  carregarNpcs() {
    if (this._promNpcs) return this._promNpcs;
    this._promNpcs = (async () => {
      for (const def of this._definicoesNpc) {
        try {
          const inst = await carregarCao(def.raca);
          // Sombra de contato sob o cão NPC
          const sombra = new THREE.Mesh(
            new THREE.PlaneGeometry(0.95, 0.95),
            new THREE.MeshBasicMaterial({ map: this.texSombra, transparent: true, depthWrite: false })
          );
          sombra.rotation.x = -Math.PI / 2;
          sombra.position.y = 0.015;
          inst.obj.add(sombra);

          let coracaoTopo = null;
          if (def.ehParceira) {
            // Lacinho rosa fofo na cabeça da Luna + coraçãozinho flutuante!
            const laco = criarLacoParceira();
            inst.obj.updateMatrixWorld(true);
            laco.position.set(0, 0.675, 0.40);
            inst.obj.add(laco);
            if (inst.ossos.Cabeca) inst.ossos.Cabeca.attach(laco);

            coracaoTopo = new THREE.Sprite(new THREE.SpriteMaterial({
              map: this.texCoracao, transparent: true, opacity: 0.92, depthWrite: false,
            }));
            coracaoTopo.position.set(0, 0.96, 0.12);
            coracaoTopo.scale.setScalar(0.24);
            inst.obj.add(coracaoTopo);
          }

          inst.obj.position.set(def.x, CALCADA, def.z);
          inst.obj.rotation.y = def.ry;
          this.raiz.add(inst.obj);
          this.caesNpc.push({
            nome: def.nome,
            raca: def.raca,
            ehParceira: !!def.ehParceira,
            coracaoTopo,
            inst,
            homeX: def.x,
            homeZ: def.z,
            raio: def.raio,
            x: def.x,
            y: CALCADA,
            z: def.z,
            ry: def.ry,
            alvoX: def.x,
            alvoZ: def.z,
            espera: 1 + Math.random() * 2.5,
            socializado: false,
            naMatilha: false,
            emCena: false,
          });
        } catch (e) {
          console.warn('Falha ao carregar cão NPC', def.nome, e);
        }
      }
    })();
    return this._promNpcs;
  }

  definirAtivo(ativo, racaNome = '') {
    this.ativo = !!ativo;
    document.body.classList.toggle('pers-cao', this.ativo);
    if (!this.ativo) {
      this.faroAtivo = false;
      this.cena = null;
      this.jatoXixi.visible = false;
      this.balaoCena.classList.add('oculto');
      this._mostrarCine(false);
      document.body.classList.remove('modo-faro');
    } else {
      this.carregarNpcs();
      if (racaNome) {
        this.mostrarToast(`🐾 Vida de Cachorro (${racaNome})! F = Faro · T = Xixi · E = Cheirar cães, Luna (💕), lixo e hidrantes`);
      }
    }
    this._atualizarHud();
  }

  alternarFaro(forcar = null) {
    if (!this.ativo) return false;
    this.faroAtivo = forcar === null ? !this.faroAtivo : !!forcar;
    document.body.classList.toggle('modo-faro', this.faroAtivo);
    if (this.elBtnFaro) this.elBtnFaro.classList.toggle('ativo', this.faroAtivo);
    this.som?.tocarFarejo?.();
    this.mostrarToast(
      this.faroAtivo
        ? '👃 Modo Faro ATIVO! 🟢 Lixo · 🩷 Cães · ❤️ Parceira (Luna) · 🟡 Hidrantes · 🟠 Ossos'
        : 'Modo Faro desligado'
    );
    return this.faroAtivo;
  }

  emitirParticula(x, y, z, vx, vy, vz, cor, tam = 0.28, vida = 1.1, coracao = false) {
    if (this.particulas.length > 105) return;
    const mat = new THREE.SpriteMaterial({
      map: coracao ? this.texCoracao : this.texPuff,
      color: coracao ? 0xffffff : cor,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    const sp = new THREE.Sprite(mat);
    sp.position.set(x, y, z);
    sp.scale.setScalar(tam);
    this.raiz.add(sp);
    this.particulas.push({ sp, vx, vy, vz, tam, vida, vidaMax: vida });
  }

  _objetivoMaisProximo(jx, jz) {
    let melhor = null;
    let dMin = Infinity;
    const testar = (x, z, tipo, rotulo) => {
      const d = Math.hypot(x - jx, z - jz);
      if (d < dMin) {
        dMin = d;
        melhor = { x, z, tipo, rotulo, dist: d, cor: COR_CHEIRO[tipo] };
      }
    };
    if (!this.parceira) {
      const luna = this.caesNpc.find(c => c.ehParceira);
      if (luna) testar(luna.x, luna.z, 'parceira', 'Parceira Luna');
    }
    if (this.lixoRevirado < 3) {
      for (const l of this.lixeiras) if (!l.revirada) testar(l.x, l.z, 'lixo', 'Comida no lixo');
    }
    if (this.caesSocializados < 2) {
      for (const c of this.caesNpc) if (!c.socializado && !c.ehParceira) testar(c.x, c.z, 'cao', `Cheirar ${c.nome}`);
    }
    if (this.territoriosMarcados < 3) {
      for (const h of this.hidrantes) if (!h.marcado) testar(h.x, h.z, 'hidrante', 'Hidrante (Xixi)');
    }
    if (this.ossosCavados < 2) {
      for (const o of this.ossos) if (!o.cavado) testar(o.x, o.z, 'osso', 'Osso enterrado');
    }
    if (!melhor) {
      for (const l of this.lixeiras) if (!l.revirada) testar(l.x, l.z, 'lixo', 'Lixo');
      for (const c of this.caesNpc) if (!c.socializado) testar(c.x, c.z, 'cao', c.nome);
    }
    return melhor;
  }

  interacao(jogador, caoInst) {
    if (!this.ativo || this.cena || jogador.veiculo) return null;
    const jx = jogador.x, jz = jogador.z;

    // 1) Socializar com outro cão ou conquistar a Parceira (Luna)!
    let caoPerto = null, dCao = 2.8;
    for (const npc of this.caesNpc) {
      const d = Math.hypot(npc.x - jx, npc.z - jz);
      if (d < dCao) { dCao = d; caoPerto = npc; }
    }
    if (caoPerto) {
      if (caoPerto.ehParceira && !this.parceira) {
        return {
          texto: `[E] 💕 Conquistar ${caoPerto.nome} (Encontrar Parceira!)`,
          fazer: () => this.iniciarConquistaParceira(jogador, caoInst, caoPerto),
        };
      }
      const tag = caoPerto.ehParceira ? 'Parceira 💕' : (caoPerto.socializado ? 'Cumprimentar de novo' : 'Socializar · Matilha');
      return {
        texto: `[E] 🐕 Cheirar traseiro de ${caoPerto.nome} (${tag})`,
        fazer: () => this.iniciarSocializacao(jogador, caoInst, caoPerto),
      };
    }

    // 2) Revirar lixeira com comida (encontrada pelo faro!)
    for (const l of this.lixeiras) {
      if (!l.revirada && Math.hypot(l.x - jx, l.z - jz) < 2.2) {
        return {
          texto: `[E] 🗑️ Revirar lixo (Comida fresca!)`,
          fazer: () => this.iniciarRevirarLixo(jogador, caoInst, l),
        };
      }
    }

    // 3) Fazer xixi / Marcar território no hidrante
    for (const h of this.hidrantes) {
      if (!h.marcado && Math.hypot(h.x - jx, h.z - jz) < 2.2) {
        return {
          texto: `[E] 💦 Fazer xixi no hidrante (Marcar território)`,
          fazer: () => this.iniciarMarcarTerritorio(jogador, caoInst, h),
        };
      }
    }

    // 4) Cavar osso enterrado
    for (const o of this.ossos) {
      if (!o.cavado && Math.hypot(o.x - jx, o.z - jz) < 2.2) {
        return {
          texto: `[E] 🦴 Cavar osso enterrado`,
          fazer: () => this.iniciarCavarOsso(jogador, caoInst, o),
        };
      }
    }

    // 5) Pegar ou lançar bolinha de tênis
    if (this.bolinha.naBoca) {
      return {
        texto: `[E] 🎾 Lançar bolinha de tênis`,
        fazer: () => this.lancarBolinha(jogador, caoInst),
      };
    }
    if (Math.hypot(this.bolinha.x - jx, this.bolinha.z - jz) < 1.9) {
      return {
        texto: `[E] 🎾 Pegar bolinha com a boca`,
        fazer: () => this.pegarBolinha(caoInst),
      };
    }

    return null;
  }

  // ==================== CENA 1: CUTSCENE CINEMATOGRÁFICA — CHEIRAR O ORIFÍCIO ANAL DO OUTRO CACHORRO ====================
  iniciarSocializacao(jogador, caoInst, npc) {
    if (this.cena || !npc) return;
    this.som?.desbloquear?.();
    this.som?.tocarFarejo?.();

    // Posiciona o NPC de perfil firme e calcula a distância exata entre o focinho do jogador e o orifício anal do NPC!
    const angNpc = Math.atan2(npc.x - jogador.x, npc.z - jogador.z);
    npc.ry = angNpc;
    npc.emCena = true;

    const [, syNpc, szNpc] = npc.inst.def?.esc || [1, 1, 1];
    const [, syJog, szJog] = caoInst.def?.esc || [1, 1, 1];
    const flJog = caoInst.def?.fl ?? 0.115;
    // Deixa ~9 cm nítidos entre a ponta do focinho preto e o orifício anal sob o rabo erguido!
    const distClose = 0.354 * syNpc + (0.512 + flJog) * syJog + 0.085;
    caoInst.pitchFaro = THREE.MathUtils.clamp((0.525 * szJog - 0.406 * szNpc) * 1.4 - 0.24, -0.45, 0.35);

    const fx = Math.sin(angNpc), fz = Math.cos(angNpc);
    jogador.x = npc.x - fx * (distClose + 0.25);
    jogador.z = npc.z - fz * (distClose + 0.25);
    jogador.ry = angNpc;
    jogador.agachado = false;

    this.cena = {
      tipo: 'socializar',
      t: 0,
      dur: 5.4,
      jogador,
      caoInst,
      npc,
      angBase: angNpc,
      distClose,
      latiuFinal: false,
      farejou2: false,
      farejou3: false,
    };
    this._mostrarCine(true, '🎬 CUTSCENE · SOCIALIZAÇÃO CANINA', `🐕 ${npc.nome} levantou o rabo para se apresentar…`);
  }

  // ==================== CENA 2: REVIRAR LIXO E COMER ====================
  iniciarRevirarLixo(jogador, caoInst, lixeira) {
    if (this.cena) return;
    this.som?.desbloquear?.();
    this.som?.tocarFarejo?.();
    const ang = Math.atan2(lixeira.x - jogador.x, lixeira.z - jogador.z);
    jogador.ry = ang;
    jogador.x = lixeira.x - Math.sin(ang) * 0.92;
    jogador.z = lixeira.z - Math.cos(ang) * 0.92;
    this.cena = {
      tipo: 'lixo',
      t: 0,
      dur: 2.2,
      jogador,
      caoInst,
      lixeira,
      abriu: false,
    };
  }

  // ==================== CENA 3: FAZER XIXI / MARCAR TERRITÓRIO (HIDRANTE OU QUALQUER LUGAR!) ====================
  iniciarMarcarTerritorio(jogador, caoInst, hidrante = null) {
    if (this.cena || !caoInst) return;
    this.som?.desbloquear?.();
    let alvoX, alvoZ;
    if (hidrante) {
      const angH = Math.atan2(hidrante.x - jogador.x, hidrante.z - jogador.z);
      const dirX = Math.sin(angH), dirZ = Math.cos(angH);
      jogador.x = hidrante.x - dirX * 0.68;
      jogador.z = hidrante.z - dirZ * 0.68;
      jogador.ry = angH - Math.PI / 2;
      alvoX = hidrante.x; alvoZ = hidrante.z;
    } else {
      // Xixi livre para a esquerda do cão (lado da pata traseira erguida!)
      const esqX = Math.cos(jogador.ry), esqZ = -Math.sin(jogador.ry);
      alvoX = jogador.x + esqX * 0.56;
      alvoZ = jogador.z + esqZ * 0.56;
    }
    this.cena = {
      tipo: 'marcar',
      t: 0,
      dur: 2.3,
      jogador,
      caoInst,
      hidrante,
      alvoX,
      alvoZ,
      tocouSom: false,
      poca: null,
    };
  }

  fazerXixiLivre(jogador, caoInst) {
    if (!this.ativo || this.cena || jogador.veiculo || !caoInst) return;
    // Se tiver um hidrante não marcado por perto, usa ele!
    for (const h of this.hidrantes) {
      if (!h.marcado && Math.hypot(h.x - jogador.x, h.z - jogador.z) < 2.8) {
        this.iniciarMarcarTerritorio(jogador, caoInst, h);
        return;
      }
    }
    this.iniciarMarcarTerritorio(jogador, caoInst, null);
  }

  // ==================== CENA 5: CONQUISTAR PARCEIRA (LUNA) → GESTAÇÃO → FILHOTES ====================
  iniciarConquistaParceira(jogador, caoInst, luna) {
    if (this.cena || !luna || !caoInst) return;
    this.som?.desbloquear?.();
    this.som?.tocarFarejo?.();

    const ang = Math.atan2(luna.x - jogador.x, luna.z - jogador.z);
    luna.emCena = true;
    luna.ry = ang + Math.PI; // frente a frente com o jogador!
    const fx = Math.sin(ang), fz = Math.cos(ang);
    jogador.x = luna.x - fx * 1.12;
    jogador.z = luna.z - fz * 1.12;
    jogador.ry = ang;
    jogador.agachado = false;

    this.cena = {
      tipo: 'parceira',
      t: 0,
      dur: 4.8,
      jogador,
      caoInst,
      luna,
      angBase: ang,
      chimeTocado: false,
      latiuFinal: false,
    };
    this._mostrarCine(true, '💕 CUTSCENE · ENCONTRO ROMÂNTICO', `💕 ${luna.nome} adorou você! Os focinhos estão se encontrando…`);
  }

  async iniciarNascimentoFilhotes(jogador, caoInst) {
    if (this._nascendo || this.filhotesNascidos || !this.parceira || !caoInst) return;
    this._nascendo = true;
    const luna = this.parceira;
    const nomes = ['Biscoito', 'Pingo', 'Amora'];
    const racaPai = caoInst.raca || 'caramelo';
    const racasFilhotes = [racaPai, luna.raca || 'caramelo', racaPai === 'dalmata' ? 'pug' : 'dalmata'];

    // Posiciona Luna ao lado do pai em terreno aberto
    const ang = jogador.ry;
    const dirX = Math.cos(ang), dirZ = -Math.sin(ang);
    const fx = Math.sin(ang), fz = Math.cos(ang);
    luna.emCena = true;
    luna.x = jogador.x + dirX * 1.05;
    luna.z = jogador.z + dirZ * 1.05;
    luna.ry = ang;

    const nascidos = [];
    for (let i = 0; i < 3; i++) {
      try {
        const inst = await carregarCao(racasFilhotes[i]);
        inst.obj.scale.setScalar(0.44);
        const sombra = new THREE.Mesh(
          new THREE.PlaneGeometry(0.85, 0.85),
          new THREE.MeshBasicMaterial({ map: this.texSombra, transparent: true, depthWrite: false })
        );
        sombra.rotation.x = -Math.PI / 2;
        sombra.position.y = 0.02;
        inst.obj.add(sombra);

        const lat = (i - 1) * 0.52;
        const px = (jogador.x + luna.x) * 0.5 + fx * 0.72 + dirX * lat;
        const pz = (jogador.z + luna.z) * 0.5 + fz * 0.72 + dirZ * lat;
        inst.obj.position.set(px, CALCADA, pz);
        inst.obj.rotation.y = ang + Math.PI;
        this.raiz.add(inst.obj);
        nascidos.push({
          nome: nomes[i],
          raca: racasFilhotes[i],
          inst,
          x: px, y: CALCADA, z: pz,
          ry: ang + Math.PI,
        });
      } catch (e) {
        console.warn('Falha ao criar filhote:', e);
      }
    }
    this.filhotes = nascidos;
    this.filhotesNascidos = true;
    this.gestacao = 0;
    if (luna.inst.ossos.Coluna) luna.inst.ossos.Coluna.scale.set(1, 1, 1);

    this.som?.desbloquear?.();
    this.som?.tocarChimeFamilia?.();
    this.cena = {
      tipo: 'nascimento',
      t: 0,
      dur: 4.6,
      jogador,
      caoInst,
      luna,
      angBase: ang,
      latidosFilhote: 0,
    };
    this._mostrarCine(true, '🍼 NASCIMENTO DOS FILHOTES!', `🐶 Parabéns! ${luna.nome} teve 3 filhotinhos: Biscoito, Pingo e Amora!`);
  }

  async acelerarNascimento(jogador, caoInst) {
    if (!this.parceira) {
      const luna = this.caesNpc.find(c => c.ehParceira);
      if (luna) {
        this.parceira = luna;
        luna.socializado = true;
        luna.naMatilha = true;
        if (luna.coracaoTopo) luna.coracaoTopo.visible = false;
      }
    }
    if (this.cena) {
      if (this.cena.npc) this.cena.npc.emCena = false;
      if (this.cena.luna) this.cena.luna.emCena = false;
      this.cena = null;
      this._mostrarCine(false);
    }
    await this.iniciarNascimentoFilhotes(jogador, caoInst);
  }

  // ==================== CENA 4: CAVAR OSSO ENTERRADO ====================
  iniciarCavarOsso(jogador, caoInst, monte) {
    if (this.cena) return;
    this.som?.desbloquear?.();
    const ang = Math.atan2(monte.x - jogador.x, monte.z - jogador.z);
    jogador.ry = ang;
    jogador.x = monte.x - Math.sin(ang) * 0.82;
    jogador.z = monte.z - Math.cos(ang) * 0.82;
    this.cena = {
      tipo: 'cavar',
      t: 0,
      dur: 2.3,
      jogador,
      caoInst,
      monte,
      achou: false,
    };
  }

  // ==================== BOLINHA DE TÊNIS ====================
  pegarBolinha(caoInst) {
    if (!caoInst || this.bolinha.naBoca) return;
    this.bolinha.naBoca = true;
    this.bolinha.vx = this.bolinha.vy = this.bolinha.vz = 0;
    this.raiz.remove(this.bolinha.grp);
    caoInst.segurar(this.bolinha.grp);
    this.som?.tocarBeep?.(740, 0.1, 0.08);
    if (!this.bolinha.brincou) {
      this.bolinha.brincou = true;
      this.carinhosEBolinha++;
      this.darPontos?.(120);
      this._verificarVitoria();
      this._atualizarHud();
    }
    this.mostrarToast('🎾 Pegou a bolinha! Aperte Latir ou [E] para jogar e correr atrás!');
  }

  lancarBolinha(jogador, caoInst) {
    if (!this.bolinha.naBoca) return;
    const posBoca = caoInst.bocaMundo(new THREE.Vector3());
    caoInst.soltar();
    this.raiz.add(this.bolinha.grp);
    this.bolinha.naBoca = false;
    this.bolinha.x = posBoca.x;
    this.bolinha.y = Math.max(CALCADA + 0.15, posBoca.y);
    this.bolinha.z = posBoca.z;
    const fx = Math.sin(jogador.ry), fz = Math.cos(jogador.ry);
    this.bolinha.vx = fx * 11.5;
    this.bolinha.vy = 5.2;
    this.bolinha.vz = fz * 11.5;
    this.bolinha.grp.position.set(this.bolinha.x, this.bolinha.y, this.bolinha.z);
    this.som?.tocarBeep?.(520, 0.12, 0.08);
    this.mostrarToast('🎾 Bolinha lançada! Vai buscar!');
  }

  // ==================== LATIR (+ CARINHO DE PEDESTRES + PERSEGUIR CARROS + RESPOSTA DA MATILHA) ====================
  latir(jogador, caoInst, { npcsPedestres = [], veiculos = [], trafego = [] } = {}) {
    if (!this.ativo || !caoInst) return;
    if (this.bolinha.naBoca) {
      this.lancarBolinha(jogador, caoInst);
      return;
    }
    const freq = caoInst.def?.freqLatido || 400;
    caoInst.latir(0.38);
    this.som?.tocarLatido?.(freq);

    // Partículas sonoras perto do focinho
    const boca = caoInst.bocaMundo(new THREE.Vector3());
    for (let i = 0; i < 4; i++) {
      this.emitirParticula(
        boca.x, boca.y, boca.z,
        Math.sin(jogador.ry) * (1.8 + Math.random()) + (Math.random() - 0.5) * 0.8,
        0.9 + Math.random() * 0.6,
        Math.cos(jogador.ry) * (1.8 + Math.random()) + (Math.random() - 0.5) * 0.8,
        0x38bdf8, 0.22, 0.45
      );
    }

    // Outros cães próximos e filhotes respondem o latido com sons reais!
    for (const npc of this.caesNpc) {
      const d = Math.hypot(npc.x - jogador.x, npc.z - jogador.z);
      if (d < 22) {
        setTimeout(() => {
          npc.inst.latir(0.34);
          this.som?.tocarLatido?.((npc.inst.def?.freqLatido || 380) * 0.98, 0.55);
        }, 160 + Math.random() * 240);
      }
    }
    for (let i = 0; i < this.filhotes.length; i++) {
      const f = this.filhotes[i];
      setTimeout(() => {
        f.inst.latir(0.32);
        this.som?.tocarLatido?.('filhote', 0.62);
      }, 210 + i * 130);
    }

    // Extra 1: Latir perto de um pedestre ganha carinho + petisco!
    if (this._cdCarinho <= 0 && npcsPedestres.length) {
      for (const ped of npcsPedestres) {
        const p = ped.p?.obj?.position;
        if (!p || !ped.p.obj.visible || ped.morto) continue;
        if (Math.hypot(p.x - jogador.x, p.z - jogador.z) < 4.5) {
          this._cdCarinho = 8;
          this.fome = Math.min(100, this.fome + 18);
          this.carinhosEBolinha++;
          this.darPontos?.(80);
          this.mostrarToast('🥰 Morador adorou seu latido! Ganhou carinho e petisco (+18 Fome, +80 pts)');
          this._verificarVitoria();
          this._atualizarHud();
          return;
        }
      }
    }

    // Extra 2: Latir perseguindo um carro em movimento!
    if (this._cdPerseguir <= 0) {
      const carros = [...veiculos, ...trafego];
      for (const c of carros) {
        const cx = c.x ?? c.obj?.position?.x;
        const cz = c.z ?? c.obj?.position?.z;
        const vel = Math.abs(c.vel ?? c.v ?? 0);
        if (cx !== undefined && vel > 2.5 && Math.hypot(cx - jogador.x, cz - jogador.z) < 8.5) {
          this._cdPerseguir = 6;
          this.darPontos?.(50);
          this.mostrarToast('🚗💨 Au-au! Perseguição Canina (+50 pts)');
          return;
        }
      }
    }
  }

  emCena() {
    return !!this.cena;
  }

  camCena() {
    if (!this.cena) return null;
    if (this.cena.tipo === 'socializar') {
      const { npc, jogador, caoInst, t, angBase } = this.cena;
      const pAnus = npc.inst.anusMundo(this._pAnusTmp);
      const pFoc = caoInst.focinhoMundo(this._pFocTmp);
      const mid = this._pMidTmp.copy(pAnus).lerp(pFoc, 0.48);

      if (t < 1.0) {
        const a = angBase + Math.PI * 0.56 - t * 0.14;
        const dist = 1.95 - t * 0.35;
        this._camP.set(mid.x + Math.sin(a) * dist, CALCADA + 0.72, mid.z + Math.cos(a) * dist);
        this._camA.set(mid.x, CALCADA + 0.44, mid.z);
        return { p: this._camP, a: this._camA, fov: 40, near: 0.12, foco: { x: mid.x, z: mid.z } };
      }
      if (t < 3.2) {
        const u = (t - 1.0) / 2.2;
        const aMacro = angBase + Math.PI * 0.71 + Math.sin(u * Math.PI) * 0.12;
        const distMacro = 0.80 - Math.sin(u * Math.PI) * 0.06;
        this._camP.set(
          mid.x + Math.sin(aMacro) * distMacro,
          mid.y + 0.05 + Math.sin(u * Math.PI * 2) * 0.02,
          mid.z + Math.cos(aMacro) * distMacro
        );
        this._camA.set(mid.x, mid.y + 0.03, mid.z);
        return { p: this._camP, a: this._camA, fov: 34, near: 0.05, foco: { x: mid.x, z: mid.z } };
      }
      if (t < 4.15) {
        const u = (t - 3.2) / 0.95;
        const a = angBase + Math.PI * 0.42 + u * 0.55;
        this._camP.set(npc.x + Math.sin(a) * 1.35, CALCADA + 0.72, npc.z + Math.cos(a) * 1.35);
        this._camA.set((npc.x + jogador.x) * 0.5, CALCADA + 0.46, (npc.z + jogador.z) * 0.5);
        return { p: this._camP, a: this._camA, fov: 38, near: 0.10, foco: { x: npc.x, z: npc.z } };
      }
      const mx = (npc.x + jogador.x) * 0.5, mz = (npc.z + jogador.z) * 0.5;
      const a = angBase + Math.PI * 0.50 + (t - 4.15) * 0.28;
      this._camP.set(mx + Math.sin(a) * 2.35, CALCADA + 0.88, mz + Math.cos(a) * 2.35);
      this._camA.set(mx, CALCADA + 0.42, mz);
      return { p: this._camP, a: this._camA, fov: 44, near: 0.15, foco: { x: mx, z: mz } };
    }
    if (this.cena.tipo === 'parceira') {
      const { luna, jogador, t, angBase } = this.cena;
      const mx = (luna.x + jogador.x) * 0.5, mz = (luna.z + jogador.z) * 0.5;
      const a = angBase + Math.PI * 0.52 + Math.sin(t * 0.65) * 0.22;
      const dist = t < 3.2 ? 1.55 : 2.15;
      this._camP.set(mx + Math.sin(a) * dist, CALCADA + 0.76, mz + Math.cos(a) * dist);
      this._camA.set(mx, CALCADA + 0.50, mz);
      return { p: this._camP, a: this._camA, fov: t < 3.2 ? 36 : 44, near: 0.08, foco: { x: mx, z: mz } };
    }
    if (this.cena.tipo === 'nascimento') {
      const { luna, jogador, t, angBase } = this.cena;
      const fx = Math.sin(angBase), fz = Math.cos(angBase);
      const mx = (luna.x + jogador.x) * 0.5 + fx * 0.42;
      const mz = (luna.z + jogador.z) * 0.5 + fz * 0.42;
      // Câmera frontal acolhedora mostrando Pai + Mãe Luna + 3 filhotinhos saltitando!
      const a = angBase + Math.sin(t * 0.55) * 0.34;
      const dist = 2.35 - Math.min(0.35, t * 0.12);
      this._camP.set(mx + Math.sin(a) * dist, CALCADA + 0.86, mz + Math.cos(a) * dist);
      this._camA.set(mx, CALCADA + 0.36, mz);
      return { p: this._camP, a: this._camA, fov: 42, near: 0.10, foco: { x: mx, z: mz } };
    }
    if (this.cena.tipo === 'marcar') {
      const { jogador, alvoX, alvoZ, t } = this.cena;
      // Enquadramento lateral baixo perfeito para ver a pata levantada, o arco de xixi dourado e a poça!
      const mx = (jogador.x + alvoX) * 0.5, mz = (jogador.z + alvoZ) * 0.5;
      const a = jogador.ry + 0.55 + Math.sin(t * 0.8) * 0.12;
      this._camP.set(mx + Math.sin(a) * 1.85, CALCADA + 0.68, mz + Math.cos(a) * 1.85);
      this._camA.set(mx, CALCADA + 0.32, mz);
      return { p: this._camP, a: this._camA, fov: 42, near: 0.10, foco: { x: mx, z: mz } };
    }
    if (this.cena.tipo === 'lixo' || this.cena.tipo === 'cavar') {
      const { jogador, t } = this.cena;
      const a = jogador.ry + 1.15 + Math.sin(t * 0.8) * 0.15;
      this._camP.set(jogador.x + Math.sin(a) * 2.4, CALCADA + 1.05, jogador.z + Math.cos(a) * 2.4);
      this._camA.set(jogador.x + Math.sin(jogador.ry) * 0.35, CALCADA + 0.48, jogador.z + Math.cos(jogador.ry) * 0.35);
      return { p: this._camP, a: this._camA, fov: 46, foco: { x: jogador.x, z: jogador.z } };
    }
    return null;
  }

  atualizar(dt, tTotal, jogador, caoInst, camera) {
    if (this._cdCarinho > 0) this._cdCarinho -= dt;
    if (this._cdPerseguir > 0) this._cdPerseguir -= dt;

    // 1) Atualiza cães NPC (vagueiam ou seguem na matilha!) e filhotes
    this._atualizarNpcs(dt, tTotal, jogador);
    this._atualizarFilhotes(dt, tTotal, jogador);

    // Gestação da Parceira (Luna): depois do tempo, ganha 3 filhotinhos automaticamente!
    if (this.ativo && this.parceira && !this.filhotesNascidos && this.gestacao > 0 && !this.cena && !jogador.veiculo) {
      this.gestacao = Math.max(0, this.gestacao - dt);
      // Barriguinha da Luna arredonda suavemente enquanto espera os filhotes!
      if (this.parceira.inst.ossos.Coluna) {
        const prog = 1 - this.gestacao / 25;
        this.parceira.inst.ossos.Coluna.scale.set(1 + prog * 0.22, 1, 1 + prog * 0.14);
      }
      if (this.gestacao <= 0 && caoInst) {
        this.iniciarNascimentoFilhotes(jogador, caoInst);
      }
    }

    // 2) Atualiza bolinha de tênis física
    this._atualizarBolinha(dt, jogador, caoInst);

    // 3) Atualiza lixeiras (tampa + sacudida + respawn suave)
    for (const l of this.lixeiras) {
      if (l.sacudir > 0) {
        l.sacudir = Math.max(0, l.sacudir - dt);
        l.grp.rotation.z = Math.sin(tTotal * 45) * 0.11 * (l.sacudir / 0.9);
      } else {
        l.grp.rotation.z *= 0.85;
      }
      const alvoT = l.revirada ? -2.05 : 0;
      l.tampaAng += (alvoT - l.tampaAng) * Math.min(1, dt * 8);
      l.pivoTampa.rotation.x = l.tampaAng;
      l.anel.material.opacity = (!l.revirada && this.faroAtivo) ? (0.45 + 0.25 * Math.sin(tTotal * 4.2)) : 0;
    }

    // 4) Atualiza ossos cavados
    for (const o of this.ossos) {
      if (o.ossoVoando > 0) {
        o.ossoVoando = Math.max(0, o.ossoVoando - dt);
        o.osso.position.y = 0.22 + Math.sin((1 - o.ossoVoando) * Math.PI) * 0.95;
        o.osso.rotation.y += dt * 7;
      }
    }

    // 5) Cena ativa (socialização / lixo / marcar / cavar)
    if (this.cena) {
      this._atualizarCena(dt, tTotal, camera);
    } else if (this.ativo && !jogador.veiculo) {
      // Fome cai devagarinho enquanto explora
      this.fome = Math.max(8, this.fome - dt * 0.28);
      if (caoInst) caoInst.farejando = this.faroAtivo ? 0.92 : 0;
      this.balaoCena.classList.add('oculto');
    }

    // 6) Emite partículas de cheiro 3D (Modo Faro ou proximidade de alvos)
    this._atualizarFaro3D(dt, tTotal, jogador);

    // 7) Atualiza partículas
    for (let i = this.particulas.length - 1; i >= 0; i--) {
      const p = this.particulas[i];
      p.vida -= dt;
      if (p.vida <= 0) {
        this.raiz.remove(p.sp);
        p.sp.material.dispose();
        this.particulas.splice(i, 1);
        continue;
      }
      p.sp.position.x += p.vx * dt;
      p.sp.position.y += p.vy * dt;
      p.sp.position.z += p.vz * dt;
      const k = p.vida / p.vidaMax;
      p.sp.material.opacity = Math.min(0.88, k * 1.15);
      p.sp.scale.setScalar(p.tam * (1.25 - k * 0.35));
    }

    if (this.ativo) this._atualizarHud();
  }

  _atualizarCena(dt, tTotal, camera) {
    const c = this.cena;
    c.t += dt;
    const { jogador, caoInst } = c;

    if (c.tipo === 'socializar') {
      const { npc, angBase, distClose } = c;
      const fx = Math.sin(angBase), fz = Math.cos(angBase);
      this.balaoCena.classList.add('oculto');

      if (c.t < 1.0) {
        // PLANO 1: Aproximação + outro cão ergue bem o rabo!
        const k = Math.min(1, c.t / 1.0);
        const d = distClose + 0.25 * (1 - k);
        npc.inst.tocar('serCheirado');
        caoInst.tocar(k < 0.72 ? 'andar' : 'cheirarTraseiro');
        jogador.x = npc.x - fx * d;
        jogador.z = npc.z - fz * d;
        jogador.ry = angBase;
        this._mostrarCine(true, '🎬 CUTSCENE · SOCIALIZAÇÃO CANINA', `🐕 ${npc.nome} ergueu o rabo — hora do cumprimento canino!`);
      } else if (c.t < 3.2) {
        // PLANO 2: MACRO CLOSE-UP EXTREMO — Focinho cheirando bem de perto o orifício anal!
        npc.inst.tocar('serCheirado');
        caoInst.tocar('cheirarTraseiro');
        // Pequeno vai-e-vem sutil do focinho ao farejar
        const pulso = Math.sin((c.t - 1.0) * 9.5) * 0.018;
        jogador.x = npc.x - fx * (distClose - pulso);
        jogador.z = npc.z - fz * (distClose - pulso);
        jogador.ry = angBase;
        if (!c.farejou2 && c.t > 1.25) { c.farejou2 = true; this.som?.tocarFarejo?.(); }
        if (!c.farejou3 && c.t > 2.25) { c.farejou3 = true; this.som?.tocarFarejo?.(); }

        // Fumaças sutis de cheiro saindo do orifício anal e indo direto para a ponta do focinho preto!
        if (Math.random() < dt * 16) {
          const pA = npc.inst.anusMundo(this._pAnusTmp);
          const pF = caoInst.focinhoMundo(this._pFocTmp);
          const vx = (pF.x - pA.x) * 2.2 + (Math.random() - 0.5) * 0.06;
          const vy = (pF.y - pA.y) * 2.2 + 0.06 + Math.random() * 0.05;
          const vz = (pF.z - pA.z) * 2.2 + (Math.random() - 0.5) * 0.06;
          this.emitirParticula(
            pA.x + (Math.random() - 0.5) * 0.015, pA.y + (Math.random() - 0.5) * 0.015, pA.z + (Math.random() - 0.5) * 0.015,
            vx, vy, vz,
            Math.random() < 0.65 ? COR_CHEIRO.cao : 0xfde047, 0.065, 0.42
          );
        }
        this._mostrarCine(true, '🔍 CLOSE-UP DO FARO', `👃 Cheirando de perto o traseiro de ${npc.nome}… (snif, snif!)`);
      } else if (c.t < 4.15) {
        // PLANO 3: Rodopio amigável / Cheiro aprovado!
        const k = (c.t - 3.2) / 0.95;
        const a = angBase + Math.PI + k * 1.45;
        jogador.x = npc.x + Math.sin(a) * 0.98;
        jogador.z = npc.z + Math.cos(a) * 0.98;
        jogador.ry = Math.atan2(npc.x - jogador.x, npc.z - jogador.z);
        npc.ry = Math.atan2(jogador.x - npc.x, jogador.z - npc.z);
        caoInst.tocar('andar');
        npc.inst.tocar('parado');
        npc.inst.alegria = 1;
        this._mostrarCine(true, '💛 CHEIRO APROVADO!', `🐾 ${npc.nome} reconheceu você! Viraram melhores amigos!`);
      } else {
        // PLANO 4: Reverência de brincadeira (play-bow) + latido alegre + Matilha!
        jogador.ry = Math.atan2(npc.x - jogador.x, npc.z - jogador.z);
        npc.ry = Math.atan2(jogador.x - npc.x, jogador.z - npc.z);
        caoInst.tocar('reverencia');
        npc.inst.tocar('reverencia');
        if (!c.latiuFinal) {
          c.latiuFinal = true;
          caoInst.latir(0.35);
          npc.inst.latir(0.35);
          this.som?.tocarLatido?.(caoInst.def?.freqLatido || 400);
          setTimeout(() => this.som?.tocarLatido?.(npc.inst.def?.freqLatido || 360, 0.8), 180);
          for (let i = 0; i < 8; i++) {
            this.emitirParticula(
              (npc.x + jogador.x) * 0.5 + (Math.random() - 0.5) * 0.6, CALCADA + 0.7, (npc.z + jogador.z) * 0.5 + (Math.random() - 0.5) * 0.6,
              (Math.random() - 0.5) * 0.6, 1.1 + Math.random() * 0.5, (Math.random() - 0.5) * 0.6,
              0xf43f5e, 0.24, 0.95
            );
          }
        }
        this._mostrarCine(true, '🐾 NOVA MATILHA!', `🎉 ${npc.nome} entrou na sua Matilha e vai te seguir pela cidade!`);
      }

      npc.inst.obj.position.set(npc.x, npc.y, npc.z);
      npc.inst.obj.rotation.y = npc.ry;
      jogador.y = CALCADA;
      caoInst.obj.position.set(jogador.x, jogador.y, jogador.z);
      caoInst.obj.rotation.y = jogador.ry;
      caoInst.atualizar(dt);

      if (c.t >= c.dur) {
        npc.emCena = false;
        caoInst.pitchFaro = 0;
        this.balaoCena.classList.add('oculto');
        this._mostrarCine(false);
        if (!npc.socializado) {
          npc.socializado = true;
          npc.naMatilha = true;
          this.caesSocializados++;
          this.darPontos?.(200);
          this.mostrarToast(`🐾 ${npc.nome} agora faz parte da sua Matilha! (+200 pts)`);
          this._verificarVitoria();
        } else {
          this.mostrarToast(`🐕 ${npc.nome} abanou o rabo feliz!`);
        }
        this.cena = null;
        this._atualizarHud();
      }
      return;
    }

    if (c.tipo === 'lixo') {
      const { lixeira } = c;
      caoInst.tocar(c.t < 1.25 ? 'cavar' : 'farejar');
      lixeira.sacudir = Math.max(lixeira.sacudir, 0.4);
      if (!c.abriu && c.t > 0.7) {
        c.abriu = true;
        lixeira.revirada = true;
        lixeira.restos.visible = true;
        this.som?.tocarPorta?.();
        for (let i = 0; i < 10; i++) {
          this.emitirParticula(
            lixeira.x, CALCADA + 0.85, lixeira.z,
            (Math.random() - 0.5) * 2.2, 1.5 + Math.random() * 1.4, (Math.random() - 0.5) * 2.2,
            i % 2 ? 0xf59e0b : 0x4ade80, 0.25, 0.85
          );
        }
      }
      caoInst.obj.position.set(jogador.x, jogador.y, jogador.z);
      caoInst.obj.rotation.y = jogador.ry;
      caoInst.atualizar(dt);
      if (c.t >= c.dur) {
        this.lixoRevirado++;
        this.fome = Math.min(100, this.fome + 35);
        this.darPontos?.(150);
        this.mostrarToast('🍕🦴 Achou pizza e osso no lixo! (+35 Fome · +150 pts)');
        this.cena = null;
        this._verificarVitoria();
        this._atualizarHud();
      }
      return;
    }

    if (c.tipo === 'parceira') {
      const { luna, angBase } = c;
      const fx = Math.sin(angBase), fz = Math.cos(angBase);
      if (c.t < 1.35) {
        // Plano 1: Aproximação romântica — encostando os focinhos!
        const k = Math.min(1, c.t / 1.35);
        const dist = 1.12 - k * 0.24;
        jogador.x = luna.x - fx * dist;
        jogador.z = luna.z - fz * dist;
        jogador.ry = angBase;
        luna.ry = angBase + Math.PI;
        caoInst.tocar(k < 0.7 ? 'andar' : 'parado');
        luna.inst.tocar('parado');
        caoInst.alegria = 1; luna.inst.alegria = 1;
        this._mostrarCine(true, '💕 ENCONTRO ROMÂNTICO', `🐕 ${luna.nome} gostou de você! Chegando pertinho…`);
      } else if (c.t < 3.25) {
        // Plano 2: Beijinho de focinho + chuva de corações flutuando!
        jogador.ry = angBase;
        luna.ry = angBase + Math.PI;
        caoInst.tocar('parado');
        luna.inst.tocar('parado');
        caoInst.alegria = 1; luna.inst.alegria = 1;
        if (!c.chimeTocado) {
          c.chimeTocado = true;
          this.som?.tocarChimeFamilia?.();
        }
        if (Math.random() < dt * 12) {
          const mx = (luna.x + jogador.x) * 0.5, mz = (luna.z + jogador.z) * 0.5;
          this.emitirParticula(
            mx + (Math.random() - 0.5) * 0.55, CALCADA + 0.58 + Math.random() * 0.18, mz + (Math.random() - 0.5) * 0.55,
            (Math.random() - 0.5) * 0.35, 0.75 + Math.random() * 0.45, (Math.random() - 0.5) * 0.35,
            0xf43f5e, 0.24, 1.15, true
          );
        }
        this._mostrarCine(true, '❤️ AMOR CANINO!', `💕 Você conquistou ${luna.nome}! Logo ela terá filhotinhos!`);
      } else {
        // Plano 3: Reverência de brincadeira sincronizada + latidos reais felizes!
        caoInst.tocar('reverencia');
        luna.inst.tocar('reverencia');
        if (!c.latiuFinal) {
          c.latiuFinal = true;
          caoInst.latir(0.36); luna.inst.latir(0.36);
          this.som?.tocarLatido?.(caoInst.def?.freqLatido || 400);
          setTimeout(() => this.som?.tocarLatido?.('medio', 0.82), 200);
        }
        this._mostrarCine(true, '🤰 FAMÍLIA A CAMINHO!', `💕 ${luna.nome} agora é sua parceira! Em breve nascerão filhotes!`);
      }

      luna.inst.obj.position.set(luna.x, luna.y, luna.z);
      luna.inst.obj.rotation.y = luna.ry;
      jogador.y = CALCADA;
      caoInst.obj.position.set(jogador.x, jogador.y, jogador.z);
      caoInst.obj.rotation.y = jogador.ry;
      caoInst.atualizar(dt);

      if (c.t >= c.dur) {
        luna.emCena = false;
        luna.socializado = true;
        luna.naMatilha = true;
        if (luna.coracaoTopo) luna.coracaoTopo.visible = false;
        this.parceira = luna;
        this.gestacao = 25; // 25 segundos explorando juntos até os filhotes nascerem!
        this._mostrarCine(false);
        this.darPontos?.(300);
        this.mostrarToast(`💕 ${luna.nome} é sua parceira! Em ~25s ela ganhará filhotes! (+300 pts)`);
        this.cena = null;
        this._atualizarHud();
      }
      return;
    }

    if (c.tipo === 'nascimento') {
      const { luna } = c;
      caoInst.tocar(c.t > 2.2 ? 'reverencia' : 'parado');
      luna.inst.tocar('parado');
      caoInst.alegria = 1; luna.inst.alegria = 1;

      // Filhotinhos saltitando alegres e latindo agudinho!
      for (let i = 0; i < this.filhotes.length; i++) {
        const f = this.filhotes[i];
        f.inst.alegria = 1;
        f.inst.tocar(Math.sin(tTotal * 4 + i * 2) > 0.25 ? 'reverencia' : 'parado');
        const pulo = Math.abs(Math.sin(tTotal * 5.2 + i * 1.4)) * 0.12;
        f.inst.obj.position.set(f.x, CALCADA + pulo, f.z);
        f.inst.atualizar(dt);
      }

      if (c.latidosFilhote < 3 && c.t > 0.65 + c.latidosFilhote * 1.05) {
        const f = this.filhotes[c.latidosFilhote % Math.max(1, this.filhotes.length)];
        c.latidosFilhote++;
        if (f) f.inst.latir(0.35);
        this.som?.tocarLatido?.('filhote', 0.85);
      }
      if (Math.random() < dt * 11) {
        const mx = (luna.x + jogador.x) * 0.5, mz = (luna.z + jogador.z) * 0.5;
        this.emitirParticula(
          mx + (Math.random() - 0.5) * 1.2, CALCADA + 0.55 + Math.random() * 0.25, mz + (Math.random() - 0.5) * 1.2,
          (Math.random() - 0.5) * 0.4, 0.85 + Math.random() * 0.45, (Math.random() - 0.5) * 0.4,
          0xf43f5e, 0.22, 1.1, true
        );
      }

      luna.inst.obj.position.set(luna.x, luna.y, luna.z);
      luna.inst.obj.rotation.y = luna.ry;
      jogador.y = CALCADA;
      caoInst.obj.position.set(jogador.x, jogador.y, jogador.z);
      caoInst.obj.rotation.y = jogador.ry;
      caoInst.atualizar(dt);

      if (c.t >= c.dur) {
        luna.emCena = false;
        this._mostrarCine(false);
        this.darPontos?.(500);
        this.mostrarToast('🍼🐶 Nasceram 3 filhotes (Biscoito, Pingo e Amora)! Sua família te segue pela cidade! (+500 pts)');
        this.cena = null;
        this._verificarVitoria();
        this._atualizarHud();
      }
      return;
    }

    if (c.tipo === 'marcar') {
      const { hidrante, alvoX, alvoZ } = c;
      caoInst.tocar('marcar');
      const jorrando = c.t > 0.36 && c.t < 1.95;

      if (jorrando && !c.tocouSom) {
        c.tocouSom = true;
        this.som?.tocarXixi?.(1.60);
      }

      // Jato parabólico 3D dourado saindo do cão até o hidrante / poça no chão!
      if (jorrando) {
        const dx = alvoX - jogador.x, dz = alvoZ - jogador.z;
        const angAlvo = Math.atan2(dx, dz);
        const distAlvo = Math.max(0.45, Math.min(0.85, Math.hypot(dx, dz)));
        this.jatoXixi.visible = true;
        this.jatoXixi.position.set(jogador.x, CALCADA + 0.02, jogador.z);
        // Alinha o eixo +X do tubo para a direção (dx, dz)
        this.jatoXixi.rotation.y = Math.atan2(-dz, dx);
        const pulsar = 0.94 + Math.sin(tTotal * 26) * 0.06;
        this.jatoXixi.scale.set((distAlvo / 0.58) * pulsar, 1.0, 1.0);

        if (!c.poca) {
          c.poca = criarPocaXixi(alvoX, alvoZ);
          c.poca.poca.scale.setScalar(0.05);
          this.raiz.add(c.poca.grp);
          this.pocasXixi.push(c.poca);
        }
        const cresce = Math.min(1, (c.t - 0.36) / 1.45);
        c.poca.poca.scale.set(1.18 * cresce, 0.88 * cresce, 1);

        if (Math.random() < dt * 26) {
          const n = Math.hypot(dx, dz) || 1;
          this.emitirParticula(
            alvoX + (Math.random() - 0.5) * 0.14, CALCADA + 0.08 + (hidrante ? 0.16 : 0), alvoZ + (Math.random() - 0.5) * 0.14,
            (Math.random() - 0.5) * 0.9 + (dx / n) * 0.3, 0.55 + Math.random() * 0.45, (Math.random() - 0.5) * 0.9 + (dz / n) * 0.3,
            0xfde047, 0.11, 0.32
          );
        }
      } else {
        this.jatoXixi.visible = false;
      }

      if (hidrante) hidrante.marca.material.opacity = Math.min(0.62, c.t * 0.35);
      caoInst.obj.position.set(jogador.x, jogador.y, jogador.z);
      caoInst.obj.rotation.y = jogador.ry;
      caoInst.atualizar(dt);

      if (c.t >= c.dur) {
        this.jatoXixi.visible = false;
        let contouNovo = false;
        if (hidrante && !hidrante.marcado) {
          hidrante.marcado = true;
          hidrante.marca.material.opacity = 0.58;
          contouNovo = true;
        } else if (!hidrante) {
          // Marcação livre conta se estiver longe (>4m) de outra poça antiga
          const pertoAntiga = this.pocasXixi.some(p => p !== c.poca && Math.hypot(p.x - alvoX, p.z - alvoZ) < 4.0);
          if (!pertoAntiga) contouNovo = true;
        }
        if (contouNovo) {
          this.territoriosMarcados++;
          this.darPontos?.(100);
          this.mostrarToast(hidrante ? '💦 Território marcado no hidrante! (+100 pts)' : '💦 Território marcado com xixi! (+100 pts)');
        } else {
          this.mostrarToast('💦 Xixi feito! Território reforçado!');
        }
        this.cena = null;
        this._verificarVitoria();
        this._atualizarHud();
      }
      return;
    }

    if (c.tipo === 'cavar') {
      const { monte } = c;
      caoInst.tocar('cavar');
      if (Math.random() < dt * 16) {
        const bx = -Math.sin(jogador.ry), bz = -Math.cos(jogador.ry);
        this.emitirParticula(
          monte.x, CALCADA + 0.18, monte.z,
          bx * (1.8 + Math.random()) + (Math.random() - 0.5) * 0.9, 1.3 + Math.random() * 0.9, bz * (1.8 + Math.random()) + (Math.random() - 0.5) * 0.9,
          0x854d0e, 0.24, 0.65
        );
      }
      if (!c.achou && c.t > 1.3) {
        c.achou = true;
        monte.cavado = true;
        monte.ossoVoando = 1.0;
        monte.monte.scale.set(1.3, 0.16, 1.15);
        this.som?.tocarBeep?.(880, 0.15, 0.09);
      }
      caoInst.obj.position.set(jogador.x, jogador.y, jogador.z);
      caoInst.obj.rotation.y = jogador.ry;
      caoInst.atualizar(dt);
      if (c.t >= c.dur) {
        monte.osso.visible = false;
        this.ossosCavados++;
        this.fome = Math.min(100, this.fome + 25);
        this.darPontos?.(200);
        this.mostrarToast('🦴 Desenterrou um osso dourado! (+25 Fome · +200 pts)');
        this.cena = null;
        this._verificarVitoria();
        this._atualizarHud();
      }
    }
  }

  _posicionarBalao(camera, wx, wy, wz, titulo, texto) {
    if (!camera || !this.balaoCena) return;
    const v = this._vTmp.set(wx, wy, wz).project(camera);
    if (v.z > 1) { this.balaoCena.classList.add('oculto'); return; }
    const sx = Math.max(150, Math.min(window.innerWidth - 150, (v.x * 0.5 + 0.5) * window.innerWidth));
    const sy = Math.max(118, (-v.y * 0.5 + 0.5) * window.innerHeight);
    this.balaoCena.classList.remove('oculto');
    this.balaoCena.innerHTML = `<span class="b-nome">${titulo}</span>${texto}`;
    this.balaoCena.style.transform = `translate(${Math.round(sx)}px, ${Math.round(sy)}px) translate(-50%, -100%)`;
  }

  _atualizarNpcs(dt, tTotal, jogador) {
    let idxMatilha = 0;
    for (const npc of this.caesNpc) {
      if (npc.coracaoTopo && npc.coracaoTopo.visible) {
        npc.coracaoTopo.position.y = 0.96 + Math.sin(tTotal * 3.8) * 0.06;
        const sc = 0.23 + Math.sin(tTotal * 5.2) * 0.03;
        npc.coracaoTopo.scale.setScalar(sc);
      }
      if (npc.emCena) {
        npc.inst.atualizar(dt);
        continue;
      }

      if (npc.naMatilha && this.ativo && !jogador.veiculo) {
        // Segue o jogador em formação de matilha!
        const angForm = jogador.ry + Math.PI + (idxMatilha % 2 ? 0.55 : -0.55) * (1 + Math.floor(idxMatilha / 2) * 0.5);
        idxMatilha++;
        const tx = jogador.x + Math.sin(angForm) * 2.1;
        const tz = jogador.z + Math.cos(angForm) * 2.1;
        const dx = tx - npc.x, dz = tz - npc.z, d = Math.hypot(dx, dz);
        if (d > 24) {
          npc.x = tx; npc.z = tz;
        } else if (d > 0.75) {
          const vel = d > 5 ? 6.2 : (d > 2.2 ? 3.8 : 2.1);
          const ang = Math.atan2(dx, dz);
          npc.ry += angDiff(npc.ry, ang) * Math.min(1, dt * 8);
          npc.x += (dx / d) * vel * dt;
          npc.z += (dz / d) * vel * dt;
          npc.inst.tocar(d > 5 ? 'correr' : (d > 2.2 ? 'trotar' : 'andar'));
        } else {
          npc.inst.tocar(jogador.agachado ? 'sentar' : 'parado');
        }
        npc.inst.alegria = 0.95;
      } else {
        const dx = npc.alvoX - npc.x, dz = npc.alvoZ - npc.z, d = Math.hypot(dx, dz);
        if (d < 0.6) {
          npc.espera -= dt;
          npc.inst.tocar(npc.espera > 1.2 ? 'farejar' : 'parado');
          if (npc.espera <= 0) {
            const a = Math.random() * Math.PI * 2;
            const r = 1.5 + Math.random() * (npc.raio - 1.5);
            npc.alvoX = npc.homeX + Math.cos(a) * r;
            npc.alvoZ = npc.homeZ + Math.sin(a) * r;
            npc.espera = 2.0 + Math.random() * 3.5;
          }
        } else {
          const vel = 1.65;
          const ang = Math.atan2(dx, dz);
          npc.ry += angDiff(npc.ry, ang) * Math.min(1, dt * 5);
          npc.x += (dx / d) * vel * dt;
          npc.z += (dz / d) * vel * dt;
          npc.inst.tocar('andar');
        }
        npc.inst.alegria = npc.ehParceira ? 0.9 : 0.55;
      }

      npc.y = this.alturaChao ? (this.alturaChao(npc.x, npc.z) ?? CALCADA) : CALCADA;
      npc.inst.obj.position.set(npc.x, npc.y, npc.z);
      npc.inst.obj.rotation.y = npc.ry;
      npc.inst.atualizar(dt);
    }
  }

  _atualizarFilhotes(dt, tTotal, jogador) {
    if (!this.filhotes.length || this.cena?.tipo === 'nascimento') return;
    const lider = this.parceira || jogador;
    for (let i = 0; i < this.filhotes.length; i++) {
      const f = this.filhotes[i];
      const angForm = (lider.ry || 0) + Math.PI + (i - 1) * 0.62;
      const distForm = 1.25 + (i % 2) * 0.35;
      const tx = lider.x + Math.sin(angForm) * distForm;
      const tz = lider.z + Math.cos(angForm) * distForm;
      const dx = tx - f.x, dz = tz - f.z, d = Math.hypot(dx, dz);
      if (d > 22) {
        f.x = tx; f.z = tz;
      } else if (d > 0.48) {
        const vel = d > 4 ? 5.8 : (d > 1.6 ? 3.5 : 1.95);
        const ang = Math.atan2(dx, dz);
        f.ry += angDiff(f.ry, ang) * Math.min(1, dt * 9);
        f.x += (dx / d) * vel * dt;
        f.z += (dz / d) * vel * dt;
        f.inst.tocar(d > 3.5 ? 'correr' : 'trotar', { velocidade: 1.35 });
      } else {
        f.inst.tocar(jogador.agachado ? 'sentar' : 'parado');
      }
      f.inst.alegria = 1.0;
      f.y = this.alturaChao ? (this.alturaChao(f.x, f.z) ?? CALCADA) : CALCADA;
      f.inst.obj.position.set(f.x, f.y, f.z);
      f.inst.obj.rotation.y = f.ry;
      f.inst.atualizar(dt);
    }
  }

  _atualizarBolinha(dt, jogador, caoInst) {
    const b = this.bolinha;
    if (b.naBoca) return;
    if (Math.hypot(b.vx, b.vz) > 0.05 || b.y > CALCADA + 0.12 || Math.abs(b.vy) > 0.05) {
      b.vy -= 14.5 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.z += b.vz * dt;
      const chao = (this.alturaChao ? (this.alturaChao(b.x, b.z) ?? CALCADA) : CALCADA) + 0.11;
      if (b.y <= chao) {
        b.y = chao;
        b.vy = Math.abs(b.vy) > 0.9 ? -b.vy * 0.62 : 0;
        b.vx *= Math.exp(-2.8 * dt);
        b.vz *= Math.exp(-2.8 * dt);
      }
      b.grp.position.set(b.x, b.y, b.z);
      b.grp.rotation.x += b.vz * dt * 4;
      b.grp.rotation.z -= b.vx * dt * 4;
    }
    if (this.ativo && !jogador.veiculo && !this.cena && caoInst && Math.hypot(b.x - jogador.x, b.z - jogador.z) < 0.72) {
      if (Math.hypot(b.vx, b.vz) < 2.2) this.pegarBolinha(caoInst);
    }
  }

  _atualizarFaro3D(dt, tTotal, jogador) {
    if (!this.ativo || jogador.veiculo) {
      for (const sp of this.faroRastro) sp.visible = false;
      return;
    }

    const alvo = this._objetivoMaisProximo(jogador.x, jogador.z);

    if (this.faroAtivo && alvo) {
      const dx = alvo.x - jogador.x, dz = alvo.z - jogador.z;
      const dist = Math.min(28, Math.hypot(dx, dz));
      const nx = dx / (Math.hypot(dx, dz) || 1), nz = dz / (Math.hypot(dx, dz) || 1);
      const px = -nz, pz = nx;
      for (let i = 0; i < this.faroRastro.length; i++) {
        const sp = this.faroRastro[i];
        const u = ((i / this.faroRastro.length) + tTotal * 0.24) % 1;
        const d = 1.2 + u * Math.max(1.5, dist - 1.2);
        const onda = Math.sin(u * 9.5 + tTotal * 3.8 + i) * 0.42;
        sp.visible = true;
        sp.position.set(
          jogador.x + nx * d + px * onda,
          CALCADA + 0.55 + Math.sin(u * Math.PI) * 0.85 + Math.cos(tTotal * 3 + i) * 0.14,
          jogador.z + nz * d + pz * onda
        );
        sp.material.color.setHex(alvo.cor);
        sp.material.opacity = Math.sin(u * Math.PI) * 0.78;
        sp.scale.setScalar(0.32 + Math.sin(u * Math.PI) * 0.28);
      }
    } else {
      for (const sp of this.faroRastro) sp.visible = false;
    }

    this._tParticula += dt;
    const freq = this.faroAtivo ? 0.14 : 0.42;
    if (this._tParticula >= freq) {
      this._tParticula = 0;
      const raio = this.faroAtivo ? 42 : 16;
      const emitirSePerto = (x, y, z, cor, coracao = false) => {
        if (Math.hypot(x - jogador.x, z - jogador.z) < raio) {
          this.emitirParticula(
            x + (Math.random() - 0.5) * 0.35, y, z + (Math.random() - 0.5) * 0.35,
            (Math.random() - 0.5) * 0.35, 0.75 + Math.random() * 0.45, (Math.random() - 0.5) * 0.35,
            cor, this.faroAtivo ? 0.38 : 0.24, 1.35, coracao
          );
        }
      };
      for (const l of this.lixeiras) if (!l.revirada) emitirSePerto(l.x, CALCADA + 0.85, l.z, COR_CHEIRO.lixo);
      for (const c of this.caesNpc) {
        if (c.ehParceira && !this.parceira) emitirSePerto(c.x, CALCADA + 0.78, c.z, COR_CHEIRO.parceira, true);
        else if (!c.socializado) emitirSePerto(c.x, CALCADA + 0.65, c.z, COR_CHEIRO.cao);
      }
      if (this.faroAtivo) {
        for (const h of this.hidrantes) if (!h.marcado) emitirSePerto(h.x, CALCADA + 0.72, h.z, COR_CHEIRO.hidrante);
        for (const o of this.ossos) if (!o.cavado) emitirSePerto(o.x, CALCADA + 0.25, o.z, COR_CHEIRO.osso);
      }
    }
  }

  _verificarVitoria() {
    if (this.todosConcluidos) return;
    if (
      this.lixoRevirado >= 3 &&
      this.caesSocializados >= 2 &&
      this.territoriosMarcados >= 3 &&
      this.filhotesNascidos &&
      this.ossosCavados >= 2 &&
      this.carinhosEBolinha >= 1
    ) {
      this.todosConcluidos = true;
      this.darPontos?.(1000);
      this.mostrarToast('🏆 REI DO BAIRRO! Todos os objetivos da Vida de Cachorro completos (+1000 pts)!');
    }
  }

  _atualizarHud() {
    if (!this.elHud) return;
    if (this.elFomeBarra) {
      this.elFomeBarra.style.transform = `scaleX(${(this.fome / 100).toFixed(3)})`;
      this.elFomeBarra.style.background = this.fome > 40 ? '#22c55e' : (this.fome > 20 ? '#facc15' : '#ef4444');
    }
    if (this.elFomeVal) this.elFomeVal.textContent = `${Math.round(this.fome)}%`;
    const totalMatilha = this.caesNpc.filter(c => c.naMatilha).length + this.filhotes.length;
    if (this.elMatilha) this.elMatilha.textContent = `${totalMatilha}/${this._definicoesNpc.length + this.filhotes.length}`;

    if (this.elFamilia) {
      if (this.filhotesNascidos) {
        this.elFamilia.classList.remove('oculto');
        this.elFamilia.textContent = `🐶 Família: ${this.parceira?.nome || 'Luna'} + ${this.filhotes.length} filhotes!`;
      } else if (this.parceira && this.gestacao > 0) {
        this.elFamilia.classList.remove('oculto');
        this.elFamilia.textContent = `🤰 ${this.parceira.nome} esperando filhotes: ${Math.ceil(this.gestacao)}s…`;
      } else {
        this.elFamilia.classList.add('oculto');
      }
    }

    const setObj = (el, atual, meta, texto) => {
      if (!el) return;
      const ok = atual >= meta;
      el.classList.toggle('feito', ok);
      el.textContent = `${ok ? '✅' : '⬜'} ${texto} (${Math.min(atual, meta)}/${meta})`;
    };
    setObj(this.elObjLixo, this.lixoRevirado, 3, '🗑️ Comida no lixo (faro)');
    setObj(this.elObjSocial, this.caesSocializados, 2, '🐕 Cheirar cães (socializar)');
    setObj(this.elObjTerr, this.territoriosMarcados, 3, '💦 Marcar território c/ xixi');
    if (this.elObjParceira) {
      const ok = this.filhotesNascidos;
      this.elObjParceira.classList.toggle('feito', ok);
      this.elObjParceira.textContent = ok
        ? '✅ 💕 Parceira e 3 filhotes! (1/1)'
        : (this.parceira ? `⏳ 🤰 ${this.parceira.nome} esperando filhotes (${Math.ceil(this.gestacao)}s)` : '⬜ 💕 Encontrar parceira Luna (0/1)');
    }
    setObj(this.elObjOsso, this.ossosCavados, 2, '🦴 Desenterrar ossos');
    setObj(this.elObjExtra, this.carinhosEBolinha, 1, '🎾 Bolinha / Carinho');
  }

  // Desenha marcadores da Vida de Cachorro no minimapa quando jogando com um cão!
  desenharMinimapa(ctx, toMM, W, H, s) {
    if (!this.ativo) return;
    const ponto = (wx, wz, cor, r = 3.5) => {
      const [x, y] = toMM(wx, wz);
      if (x < 4 || x > W - 4 || y < 4 || y > H - 4) return;
      ctx.fillStyle = cor;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.arc(x, y, r * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };
    for (const l of this.lixeiras) if (!l.revirada) ponto(l.x, l.z, '#4ade80', 3.4);
    for (const c of this.caesNpc) {
      if (c.ehParceira) {
        const [x, y] = toMM(c.x, c.z);
        if (x > 6 && x < W - 6 && y > 6 && y < H - 6) {
          ctx.font = `${Math.round(11 * s)}px system-ui`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('❤️', x, y);
        }
      } else {
        ponto(c.x, c.z, c.naMatilha ? '#38bdf8' : '#f472b6', 4.0);
      }
    }
    for (const f of this.filhotes) ponto(f.x, f.z, '#fda4af', 2.6);
    for (const h of this.hidrantes) if (!h.marcado) ponto(h.x, h.z, '#facc15', 2.8);
    for (const o of this.ossos) if (!o.cavado) ponto(o.x, o.z, '#fb923c', 3.2);
  }

  // Helpers para testes automatizados
  obterAlvo(tipo) {
    if (tipo === 'parceira') return this.caesNpc.find(c => c.ehParceira);
    if (tipo === 'cao') return this.caesNpc.find(c => !c.socializado && !c.ehParceira) || this.caesNpc[0];
    if (tipo === 'lixo') return this.lixeiras.find(l => !l.revirada) || this.lixeiras[0];
    if (tipo === 'hidrante') return this.hidrantes.find(h => !h.marcado) || this.hidrantes[0];
    if (tipo === 'osso') return this.ossos.find(o => !o.cavado) || this.ossos[0];
    if (tipo === 'bolinha') return this.bolinha;
    return null;
  }

  estado() {
    return {
      ativo: this.ativo,
      faroAtivo: this.faroAtivo,
      fome: Math.round(this.fome),
      emCena: this.cena?.tipo || null,
      matilha: this.caesNpc.filter(c => c.naMatilha).map(c => c.nome),
      parceira: this.parceira?.nome || null,
      gestacao: Math.ceil(this.gestacao),
      filhotes: this.filhotes.map(f => f.nome),
      pocasXixi: this.pocasXixi.length,
      npcsCarregados: this.caesNpc.length,
      lixoRevirado: this.lixoRevirado,
      caesSocializados: this.caesSocializados,
      territoriosMarcados: this.territoriosMarcados,
      ossosCavados: this.ossosCavados,
      carinhosEBolinha: this.carinhosEBolinha,
    };
  }
}

