// ====================================================================================================
// FASES EXCLUSIVAS POR PERSONAGEM (Hryz City)
// Cada personagem joga sua própria fase / campanha:
//   - Policial    → Resgate da Refém (jogo/missao.js — exclusivo do Policial)
//   - Astronauta  → Expedição Lunar HRYZ-1 (na Lua: amostras lunares, sensores sísmicos, bandeira)
//   - Cães (4)    → Vida de Cachorro (jogo/caes.js — faro, lixo, socializar, xixi, parceira e filhotes)
//   - Ciber-Herói → Corrida Supersônica (portais de energia na Rodovia, 200 km/h, Mach 1, 2.000 km/h)
//   - Kael        → Caçada ao T. rex (super pulo, rajada de energia, derrotar o T. rex na Selva)
//   - Bombeiro    → Combate a Incêndios (4 focos de fogo 3D na cidade para apagar)
//   - Operador    → Grande Obra no Canteiro (operar escavadeira/máquinas e movimentar cargas)
//   - Exploradores (Jovem A, Corredor, Silhueta) → Circuito Turístico de Hryz City
// ====================================================================================================
import * as THREE from 'three';

export const FASES_PERSONAGEM = {
  policial: {
    id: 'policial',
    badge: '🚔 Resgate da Refém',
    titulo: 'Resgate na Rotatória',
    desc: 'Única fase com a missão do refém: pegue a Sniper, suba na torre e salve a vítima.',
    localPadrao: 'delegacia',
    veicPadrao: 'p71',
    permiteVeic: true,
    apenasLua: false,
  },
  astronauta: {
    id: 'astronauta',
    badge: '🌙 Missão na Lua',
    titulo: 'Expedição Lunar HRYZ-1',
    desc: 'Exclusiva na Lua (gravidade 1/6): colete cristais lunares, ative sensores e finque a bandeira.',
    localPadrao: 'lua',
    veicPadrao: 'nenhum',
    permiteVeic: false,
    apenasLua: true,
  },
  caramelo: {
    id: 'cao',
    badge: '🐾 Vida de Cachorro',
    titulo: 'Vida de Cachorro',
    desc: 'Faro 3D, comida no lixo, socializar com cães, marcar território, parceira Luna e filhotes.',
    localPadrao: 'praca',
    veicPadrao: 'nenhum',
    permiteVeic: false,
    apenasLua: false,
  },
  pastor: {
    id: 'cao',
    badge: '🐾 Vida de Cachorro',
    titulo: 'Vida de Cachorro',
    desc: 'Cão farejador ágil e forte: comida no lixo, matilha, território e família.',
    localPadrao: 'praca',
    veicPadrao: 'nenhum',
    permiteVeic: false,
    apenasLua: false,
  },
  dalmata: {
    id: 'cao',
    badge: '🐾 Vida de Cachorro',
    titulo: 'Vida de Cachorro',
    desc: 'Cão veloz e sociável: faro 3D, socialização canina, território e filhotes.',
    localPadrao: 'praca',
    veicPadrao: 'nenhum',
    permiteVeic: false,
    apenasLua: false,
  },
  pug: {
    id: 'cao',
    badge: '🐾 Vida de Cachorro',
    titulo: 'Vida de Cachorro',
    desc: 'Pug farejador: revire lixeiras, faça amigos na praça, marque território e forme família.',
    localPadrao: 'praca',
    veicPadrao: 'nenhum',
    permiteVeic: false,
    apenasLua: false,
  },
  ciber_heroi: {
    id: 'velocista',
    badge: '⚡ Corrida 2.000 km/h',
    titulo: 'Circuito Supersônico',
    desc: 'Atinge 200 km/h em 1s até 2.000 km/h: cruze os 5 portais de energia e quebre Mach 1!',
    localPadrao: 'rodovia',
    veicPadrao: 'nenhum',
    permiteVeic: true,
    apenasLua: false,
  },
  kael: {
    id: 'heroi',
    badge: '🦖 Caçada ao T. rex',
    titulo: 'Patrulha Titânica',
    desc: 'Use super pulo, super força e rajada de energia para vencer o T. rex na Selva Jurássica!',
    localPadrao: 'selva',
    veicPadrao: 'nenhum',
    permiteVeic: true,
    apenasLua: false,
  },
  bombeiro: {
    id: 'bombeiro',
    badge: '🚒 Combate a Incêndios',
    titulo: 'Emergência em Hryz',
    desc: 'Localize e apague os 4 focos de incêndio ativos espalhados pela cidade.',
    localPadrao: 'delegacia',
    veicPadrao: 'nenhum',
    permiteVeic: true,
    apenasLua: false,
  },
  operador: {
    id: 'operador',
    badge: '🏗️ Canteiro de Obras',
    titulo: 'Grande Obra Hryz',
    desc: 'Assuma as máquinas pesadas no canteiro, escave terra e opere a obra.',
    localPadrao: 'canteiro',
    veicPadrao: 'nenhum',
    permiteVeic: true,
    apenasLua: false,
  },
  jovem_a: {
    id: 'explorador',
    badge: '🏁 Tour Hryz City',
    titulo: 'Circuito Urbano',
    desc: 'Explore a cidade livremente, visite os marcos turísticos e bata recordes de velocidade.',
    localPadrao: 'praca',
    veicPadrao: 'nenhum',
    permiteVeic: true,
    apenasLua: false,
  },
  corredor: {
    id: 'explorador',
    badge: '🏁 Circuito Urbano',
    titulo: 'Maratona Hryz',
    desc: 'Percorra os pontos de controle da cidade a pé ou em alta velocidade.',
    localPadrao: 'praca',
    veicPadrao: 'nenhum',
    permiteVeic: true,
    apenasLua: false,
  },
  silhueta: {
    id: 'explorador',
    badge: '👤 Circuito Noturno',
    titulo: 'Vulto da Cidade',
    desc: 'Explore Hryz City pelos pontos secretos e complete o circuito urbano.',
    localPadrao: 'praca',
    veicPadrao: 'nenhum',
    permiteVeic: true,
    apenasLua: false,
  },
};

export function obterFaseDef(persId) {
  return FASES_PERSONAGEM[persId] || FASES_PERSONAGEM.jovem_a;
}

export class GerenciadorFases {
  constructor({ scene, lua, som, toast, onPontos }) {
    this.scene = scene;
    this.lua = lua;
    this.som = som;
    this.toast = toast;
    this.onPontos = onPontos;

    this.grupo = new THREE.Group();
    this.grupo.name = 'ObjetosFase';
    this.scene.add(this.grupo);

    this.ativa = null;          // 'astronauta' | 'velocista' | 'heroi' | 'bombeiro' | 'operador' | 'explorador' | null
    this.itens = [];            // objetos 3D interativos/coletáveis da fase ativa
    this.objs = [];             // lista de objetivos { id, icone, texto, atual, meta, feito }
    this.concluida = false;
    this.t = 0;

    this.elCard = document.getElementById('hud-fase');
    this.elTitulo = document.getElementById('fase-titulo');
    this.elProg = document.getElementById('fase-prog');
    this.elLista = document.getElementById('fase-objs');
  }

  limpar() {
    while (this.grupo.children.length) {
      const ch = this.grupo.children[0];
      this.grupo.remove(ch);
      ch.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
          else o.material.dispose();
        }
      });
    }
    this.itens = [];
    this.objs = [];
    this.ativa = null;
    this.concluida = false;
    if (this.elCard) this.elCard.classList.add('oculto');
  }

  iniciar(persId) {
    this.limpar();
    const def = obterFaseDef(persId);
    // Policial usa jogo/missao.js; Cães usam jogo/caes.js
    if (def.id === 'policial' || def.id === 'cao') return;

    this.ativa = def.id;
    this.concluida = false;
    this.t = 0;

    if (this.ativa === 'astronauta') this._montarFaseLua();
    else if (this.ativa === 'velocista') this._montarFaseVelocista();
    else if (this.ativa === 'heroi') this._montarFaseHeroi();
    else if (this.ativa === 'bombeiro') this._montarFaseBombeiro();
    else if (this.ativa === 'operador') this._montarFaseOperador();
    else this._montarFaseExplorador();

    if (this.elTitulo) this.elTitulo.textContent = def.badge;
    if (this.elCard) this.elCard.classList.remove('oculto');
    this._renderHud();
  }

  // ---- FASE LUNAR (Astronauta) ----------------------------------------------------------------------
  _montarFaseLua() {
    const O = this.lua.ORIGEM;
    const alt = (lx, lz) => this.lua.altura(O.x + lx, O.z + lz);

    this.objs = [
      { id: 'cristais', icone: '💎', texto: 'Coletar amostras lunares', atual: 0, meta: 4 },
      { id: 'sensores', icone: '📡', texto: 'Ativar sensores sísmicos', atual: 0, meta: 2 },
      { id: 'bandeira', icone: '🚩', texto: 'Fincar Bandeira Hryz no cume', atual: 0, meta: 1 },
    ];

    // 4 cristais brilhantes em crateras ao redor do foguete
    const posCristais = [[18, 22], [-26, 16], [34, -24], [-18, -32]];
    const geoC = new THREE.OctahedronGeometry(0.55, 0);
    const matC = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, emissiveIntensity: 1.4, roughness: 0.15, metalness: 0.35 });
    const geoAnel = new THREE.RingGeometry(0.95, 1.25, 28);
    const matAnel = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
    for (const [lx, lz] of posCristais) {
      const g = new THREE.Group();
      const y = alt(lx, lz);
      g.position.set(O.x + lx, y, O.z + lz);
      const cr = new THREE.Mesh(geoC.clone(), matC.clone());
      cr.position.y = 0.9;
      const an = new THREE.Mesh(geoAnel.clone(), matAnel.clone());
      an.rotation.x = -Math.PI / 2; an.position.y = 0.08;
      g.add(cr, an);
      this.grupo.add(g);
      this.itens.push({ tipo: 'cristal', x: O.x + lx, z: O.z + lz, g, anim: cr, feito: false, raio: 2.8 });
    }
    geoC.dispose(); matC.dispose(); geoAnel.dispose(); matAnel.dispose();

    // 2 sensores sísmicos para ativar com [E]
    const posSensores = [[46, 8], [-44, -8]];
    for (const [lx, lz] of posSensores) {
      const g = new THREE.Group();
      const y = alt(lx, lz);
      g.position.set(O.x + lx, y, O.z + lz);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 0.65, 10), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6, roughness: 0.3 }));
      base.position.y = 0.32;
      const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.7, 8), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.25 }));
      haste.position.y = 1.4;
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 1.5 }));
      led.position.y = 2.3;
      const an = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.4, 28), new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide, transparent: true, opacity: 0.7 }));
      an.rotation.x = -Math.PI / 2; an.position.y = 0.08;
      g.add(base, haste, led, an);
      this.grupo.add(g);
      this.itens.push({ tipo: 'sensor', x: O.x + lx, z: O.z + lz, g, led, anel: an, feito: false, raio: 3.4, prompt: '[E] 📡 Ativar Sensor Sísmico Lunar' });
    }

    // 1 ponto de Bandeira Hryz no mirante da cratera
    const [bx, bz] = [6, 56];
    const gb = new THREE.Group();
    gb.position.set(O.x + bx, alt(bx, bz), O.z + bz);
    const anB = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.7, 32), new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
    anB.rotation.x = -Math.PI / 2; anB.position.y = 0.08;
    const feixeB = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 14, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    feixeB.position.y = 7;
    const mastro = new THREE.Group();
    mastro.visible = false;
    const pau = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.8, 8), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 }));
    pau.position.y = 1.4;
    const pano = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.75, 0.04), new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x15803d, emissiveIntensity: 0.4, roughness: 0.5 }));
    pano.position.set(0.64, 2.38, 0);
    mastro.add(pau, pano);
    gb.add(anB, feixeB, mastro);
    this.grupo.add(gb);
    this.itens.push({ tipo: 'bandeira', x: O.x + bx, z: O.z + bz, g: gb, mastro, feixe: feixeB, anel: anB, feito: false, raio: 3.6, prompt: '[E] 🚩 Fincar Bandeira Hryz na Lua' });
  }

  // ---- FASE VELOCISTA (Ciber-Herói) -----------------------------------------------------------------
  _montarFaseVelocista() {
    this.objs = [
      { id: 'v200', icone: '⚡', texto: 'Atingir 200 km/h no arranque', atual: 0, meta: 1 },
      { id: 'portais', icone: '🌀', texto: 'Cruzar Portais de Energia na Rodovia', atual: 0, meta: 5 },
      { id: 'mach1', icone: '💥', texto: 'Quebrar a Barreira do Som (1.235 km/h)', atual: 0, meta: 1 },
      { id: 'v2000', icone: '🔥', texto: 'Atingir Velocidade Máxima (2.000 km/h)', atual: 0, meta: 1 },
    ];

    // 5 portais luminosos gigantes ao longo da reta da Rodovia (x = 18)
    const zPortais = [0, 120, 250, 380, 500];
    for (let i = 0; i < zPortais.length; i++) {
      const z = zPortais[i];
      const g = new THREE.Group();
      g.position.set(18, 0, z);
      const cor = i === zPortais.length - 1 ? 0xf43f5e : 0x38bdf8;
      const arco = new THREE.Mesh(
        new THREE.TorusGeometry(4.4, 0.28, 12, 36),
        new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.92 })
      );
      arco.position.y = 4.2;
      const brilho = new THREE.Mesh(
        new THREE.CircleGeometry(4.1, 28),
        new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
      );
      brilho.position.y = 4.2;
      g.add(arco, brilho);
      this.grupo.add(g);
      this.itens.push({ tipo: 'portal', x: 18, z, g, anim: arco, feito: false, raio: 6.5 });
    }
  }

  // ---- FASE HERÓI (Kael) ----------------------------------------------------------------------------
  _montarFaseHeroi() {
    this.objs = [
      { id: 'pulo', icone: '🦘', texto: 'Executar Super Pulo alto (segure Espaço)', atual: 0, meta: 1 },
      { id: 'selva', icone: '🌿', texto: 'Chegar à Selva Jurássica', atual: 0, meta: 1 },
      { id: 'trex', icone: '🦖', texto: 'Derrotar o T. rex com seus poderes', atual: 0, meta: 1 },
    ];
  }

  // ---- FASE BOMBEIRO --------------------------------------------------------------------------------
  _montarFaseBombeiro() {
    this.objs = [
      { id: 'fogos', icone: '🔥', texto: 'Apagar focos de incêndio na cidade', atual: 0, meta: 4 },
    ];
    const locais = [
      { nome: 'Praça Central', x: 205, z: 162 },
      { nome: 'Avenida Comercial', x: 148, z: 210 },
      { nome: 'Estádio Hryz', x: 378, z: 98 },
      { nome: 'Jardim Hryz', x: 256, z: 302 },
    ];
    for (const loc of locais) {
      const g = new THREE.Group();
      g.position.set(loc.x, 0.08, loc.z);
      const chamaExt = new THREE.Mesh(
        new THREE.ConeGeometry(1.15, 2.8, 10),
        new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      chamaExt.position.y = 1.4;
      const chamaInt = new THREE.Mesh(
        new THREE.ConeGeometry(0.65, 1.9, 8),
        new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      chamaInt.position.y = 1.0;
      const fumaca = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 1.4, 9, 10, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false })
      );
      fumaca.position.y = 5.2;
      const anel = new THREE.Mesh(
        new THREE.RingGeometry(1.6, 2.0, 28),
        new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
      );
      anel.rotation.x = -Math.PI / 2; anel.position.y = 0.05;
      g.add(chamaExt, chamaInt, fumaca, anel);
      this.grupo.add(g);
      this.itens.push({ tipo: 'fogo', nome: loc.nome, x: loc.x, z: loc.z, g, chamaExt, chamaInt, feito: false, raio: 5.5, prompt: `[E] 🧯 Apagar Incêndio (${loc.nome})` });
    }
  }

  // ---- FASE OPERADOR (Canteiro de Obras) ------------------------------------------------------------
  _montarFaseOperador() {
    this.objs = [
      { id: 'maquina', icone: '🚜', texto: 'Entrar em uma máquina de obra', atual: 0, meta: 1 },
      { id: 'cavar', icone: '⛏️', texto: 'Operar ferramenta / movimentar carga no canteiro', atual: 0, meta: 1 },
      { id: 'canteiro', icone: '🏗️', texto: 'Visitar o Canteiro de Obras', atual: 0, meta: 1 },
    ];
  }

  // ---- FASE EXPLORADOR (Jovem A, Corredor, Silhueta) ------------------------------------------------
  _montarFaseExplorador() {
    this.objs = [
      { id: 'cp', icone: '⭐', texto: 'Completar Checkpoints Turísticos', atual: 0, meta: 4 },
      { id: 'vel', icone: '🏎️', texto: 'Atingir 100 km/h em qualquer veículo', atual: 0, meta: 1 },
    ];
  }

  _progresso(id, valor, somar = false) {
    const o = this.objs.find(x => x.id === id);
    if (!o || o.atual >= o.meta) return false;
    o.atual = Math.min(o.meta, somar ? o.atual + valor : Math.max(o.atual, valor));
    this._renderHud();
    if (o.atual >= o.meta) {
      this.som?.tocarBeep?.(880, 0.16, 0.08);
      this.onPontos?.(150);
      this._verificarVitoria();
      return true;
    }
    return false;
  }

  _verificarVitoria() {
    if (this.concluida || !this.objs.length) return;
    if (this.objs.every(o => o.atual >= o.meta)) {
      this.concluida = true;
      this.som?.tocarBeep?.(1046, 0.35, 0.11);
      this.onPontos?.(500);
      this.toast?.(`🏆 FASE CONCLUÍDA! +500 pts · Volte à Sala (P) para jogar outras fases!`);
      this._renderHud();
    }
  }

  _renderHud() {
    if (!this.elCard || !this.ativa) return;
    const feitos = this.objs.filter(o => o.atual >= o.meta).length;
    if (this.elProg) this.elProg.textContent = this.concluida ? '🏆 Completa!' : `${feitos}/${this.objs.length}`;
    if (this.elLista) {
      this.elLista.innerHTML = this.objs.map(o => {
        const ok = o.atual >= o.meta;
        const cont = o.meta > 1 ? ` (${o.atual}/${o.meta})` : '';
        return `<div class="fase-obj${ok ? ' feito' : ''}">${ok ? '✅' : '⬜'} ${o.icone} ${o.texto}${cont}</div>`;
      }).join('');
    }
  }

  registrarCheckpoint() {
    if (this.ativa === 'explorador') this._progresso('cp', 1, true);
  }

  obterInteracao(jx, jz) {
    if (!this.ativa) return null;
    for (const it of this.itens) {
      if (it.feito || !it.prompt) continue;
      if (Math.hypot(jx - it.x, jz - it.z) <= it.raio) {
        return {
          texto: it.prompt,
          fazer: () => this._executarInteracao(it),
        };
      }
    }
    return null;
  }

  _executarInteracao(it) {
    if (it.feito) return;
    it.feito = true;
    if (it.tipo === 'sensor') {
      it.led.material.color.setHex(0x22c55e);
      it.led.material.emissive.setHex(0x22c55e);
      it.anel.material.color.setHex(0x22c55e);
      this.som?.tocarBeep?.(780, 0.18, 0.08);
      this.toast?.('📡 Sensor Sísmico Lunar ativado! Dados enviados à Terra.');
      this._progresso('sensores', 1, true);
    } else if (it.tipo === 'bandeira') {
      it.mastro.visible = true;
      it.feixe.visible = false;
      it.anel.visible = false;
      this.som?.tocarBeep?.(940, 0.25, 0.09);
      this.toast?.('🚩 Bandeira Hryz fincada com sucesso na superfície lunar!');
      this._progresso('bandeira', 1, true);
    } else if (it.tipo === 'fogo') {
      it.g.visible = false;
      this.som?.tocarBeep?.(640, 0.2, 0.08);
      this.toast?.(`🧯 Incêndio controlado em ${it.nome}!`);
      this._progresso('fogos', 1, true);
    }
  }

  atualizar(dt, ctx) {
    if (!this.ativa) return;
    this.t += dt;
    const { jogador, velCiberKmh, trexHp, maxVelKmh, frustum } = ctx;
    const jx = jogador.veiculo ? jogador.veiculo.x : jogador.x;
    const jz = jogador.veiculo ? jogador.veiculo.z : jogador.z;

    // Animação + frustum culling + coleta por proximidade dos itens 3D da fase
    const sph = _sphFase;
    for (const it of this.itens) {
      if (it.tipo === 'cristal' && !it.feito) {
        it.anim.rotation.y += dt * 1.8;
        it.anim.position.y = 0.9 + Math.sin(this.t * 3 + it.x) * 0.18;
        if (Math.hypot(jx - it.x, jz - it.z) < it.raio) {
          it.feito = true;
          it.g.visible = false;
          this.som?.tocarBeep?.(820, 0.14, 0.08);
          this.toast?.('💎 Amostra lunar coletada!');
          this._progresso('cristais', 1, true);
          continue;
        }
      } else if (it.tipo === 'portal' && !it.feito) {
        it.anim.rotation.z += dt * 1.5;
        if (Math.hypot(jx - it.x, jz - it.z) < it.raio) {
          it.feito = true;
          it.g.visible = false;
          this.som?.tocarBeep?.(980, 0.14, 0.09);
          this.toast?.('🌀 Portal de Energia atravessado! +150 pts');
          this._progresso('portais', 1, true);
          continue;
        }
      } else if (it.tipo === 'fogo' && !it.feito) {
        const s = 0.9 + 0.18 * Math.sin(this.t * 14 + it.x);
        it.chamaExt.scale.set(1, s, 1);
        it.chamaInt.scale.set(1, 1.15 - (s - 0.9), 1);
      }

      // Frustum culling dos objetos 3D da fase (renderiza só o visível na câmera!)
      if (!it.feito && frustum && it.g) {
        sph.center.set(it.x, it.g.position.y + 3, it.z);
        sph.radius = 9;
        it.g.visible = frustum.intersectsSphere(sph);
      }
    }

    // Objetivos por estado do jogador
    if (this.ativa === 'velocista') {
      if (velCiberKmh >= 200) this._progresso('v200', 1);
      if (velCiberKmh >= 1235) this._progresso('mach1', 1);
      if (velCiberKmh >= 1980) this._progresso('v2000', 1);
    } else if (this.ativa === 'heroi') {
      if (jogador.y > 7.5) this._progresso('pulo', 1);
      if (jx > 430 && jz > 190) this._progresso('selva', 1);
      if (trexHp <= 0) this._progresso('trex', 1);
    } else if (this.ativa === 'operador') {
      if (jx > 130 && jx < 230 && jz > -45 && jz < 30) this._progresso('canteiro', 1);
      if (jogador.veiculo?.api?.eixos) {
        this._progresso('maquina', 1);
        const carga = jogador.veiculo.api.cargaAtual?.() || 0;
        if (carga > 0.15) this._progresso('cavar', 1);
      }
    } else if (this.ativa === 'explorador') {
      if (maxVelKmh >= 100) this._progresso('vel', 1);
    }
  }

  desenharMinimapa(ctx, toMM, W, H) {
    if (!this.ativa || this.ativa === 'astronauta') return;
    for (const it of this.itens) {
      if (it.feito) continue;
      const [rx, ry] = toMM(it.x, it.z);
      const x = Math.max(8, Math.min(W - 8, rx));
      const y = Math.max(8, Math.min(H - 8, ry));
      ctx.fillStyle = it.tipo === 'fogo' ? '#f97316' : '#38bdf8';
      ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }

  estado() {
    return {
      ativa: this.ativa,
      concluida: this.concluida,
      objetivos: this.objs.map(o => ({ ...o })),
    };
  }
}

const _sphFase = new THREE.Sphere();
