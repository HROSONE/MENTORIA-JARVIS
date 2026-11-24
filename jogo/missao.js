// MISSÃO "Refém na Rotatória" do Hryz City.
// Um assaltante faz uma mulher de refém na rua que chega à rotatória, cercado pela polícia. O jogador precisa achar uma arma no mapa,
// mas só a SNIPER salva a refém: subir no terraço da torre residencial e acertar o bandido (qualquer parte do corpo ou a arma dele).
// Se o jogador chegar perto (menos de RAIO_ALERTA no chão), atirar com outra arma por perto ou ligar a sirene perto, o bandido percebe:
// atira na refém, a polícia atira nele e também em quem estiver perto. O tiro de sniper vira a câmera da bala (balacam.js).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Personagem } from '../videos/biblioteca3d/personagens/elenco/elenco.js';
import { ik2 } from './armas.js';

export const RAIO_ALERTA = 38;
export const CENA = { x: 252, z: 212 };                         // onde o bandido está (rua que chega à rotatória pelo norte)
// torre residencial de 12 andares (264, 156): porta ao sul; terraço da cobertura a 37,8 m com mureta de 0,9 m (medido por raio)
export const TORRE = {
  porta: { x: 264, z: 163.2 },
  terraco: { y: 37.8, minX: 260.7, maxX: 267.3, minZ: 152.7, maxZ: 158.4, obst: [{ minX: 264.6, maxX: 266.7, minZ: 155.6, maxZ: 158.9 }] },
  chegada: { x: 262.4, z: 158.0, ry: 0.0 },
  alcapao: { x: 261.6, z: 153.6 },
};
export const PONTOS_ARMA = [
  { id: 'pistola', nome: 'Pistola', letra: 'P', cor: '#60a5fa', x: 214, z: 150 },
  { id: 'metralhadora', nome: 'Metralhadora', letra: 'M', cor: '#c084fc', x: 352, z: 150 },
  { id: 'sniper', nome: 'Sniper', letra: 'S', cor: '#4ade80', x: 414, z: 252 },
];
export const LOJA_PORTA = { x: 120, z: 162.6 };

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
// falas da cena (balões sobre a cabeça de quem fala)
const FALAS = {
  bandido: ['Ninguém chega perto ou ela morre!', 'Para trás! PARA TRÁS!', 'Eu quero um carro e ninguém me seguindo!', 'Tira esse helicóptero daqui!', 'Eu não tô brincando!'],
  refem: ['Socorro! Por favor!', 'Eu tenho filhos… por favor…', 'Me ajuda…', 'Não atira, por favor!'],
  policia: ['Calma! Ninguém precisa se machucar.', 'Solta ela e a gente conversa.', 'Atiradores em posição… aguardem.', 'Abaixa a arma! Agora!'],
};
const CIMA = V(0, 1, 0);
const suave = t => t * t * (3 - 2 * t);

function texBrilho(cor) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, cor); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
/** marcador de chão: anel girando + feixe de luz vertical */
function criarMarcador(cor, raio = 1.6, altura = 26) {
  const g = new THREE.Group();
  const anel = new THREE.Mesh(new THREE.RingGeometry(raio * 0.78, raio, 40), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
  anel.rotation.x = -Math.PI / 2; anel.position.y = 0.08; g.add(anel);
  const feixe = new THREE.Mesh(new THREE.CylinderGeometry(raio * 0.55, raio * 0.75, altura, 20, 1, true), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  feixe.position.y = altura / 2; g.add(feixe);
  g.userData = { anel, feixe };
  return g;
}
/** segura uma pistola com as duas mãos mirando `alvo` (mesma pose da pistola do jogador) */
function segurarPistola(obj, pistola, alvo, tremor = 0, t = 0) {
  const osso = n => obj.getObjectByName(n);
  obj.updateWorldMatrix(true, true);
  const peito = osso('Peito'), OD = osso('BracoD').getWorldPosition(V()), OE = osso('BracoE').getWorldPosition(V());
  const P = peito.getWorldPosition(V());
  const frente = alvo.clone().sub(P).setY(0).normalize(), direita = V().crossVectors(frente, CIMA).normalize();
  const cabo = OD.clone().lerp(OE, 0.45).addScaledVector(frente, 0.48).addScaledVector(CIMA, -0.02);
  if (tremor) cabo.add(V(Math.sin(t * 23) * tremor, Math.sin(t * 17 + 1) * tremor, 0));
  const dir = alvo.clone().sub(cabo).normalize();
  pistola.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(V(), dir.clone().negate(), CIMA));
  pistola.position.copy(cabo); pistola.updateMatrixWorld(true);
  ik2(osso('BracoD'), osso('AntebracoD'), osso('MaoD'), cabo.clone().addScaledVector(CIMA, -0.02), direita.clone().multiplyScalar(0.6).addScaledVector(CIMA, -1));
  ik2(osso('BracoE'), osso('AntebracoE'), osso('MaoE'), pistola.localToWorld(V(-0.012, -0.045, 0)), direita.clone().multiplyScalar(-0.6).addScaledVector(CIMA, -1));
}

export class Missao {
  /**
   * opc: { scene, camera, armas, som, base (biblioteca3d), jogo: { jogador(), noTerraco(), noVeiculo(), sireneLigada(), toast(msg), irTerraco(), descerTerraco(),
   *        atingirJogador(), reviver(), hud(objetivo, detalhe) } }
   */
  constructor(opc) {
    Object.assign(this, opc);
    this.estado = 'inativa';            // inativa | ativa | percebeu | vitoria | falha | concluida
    this.t = 0; this.seq = 0; this.acoes = [];
    this.efeitos = [];
    this.el = {
      card: document.getElementById('missao-card'), titulo: document.getElementById('mc-titulo'), texto: document.getElementById('mc-texto'),
      botao: document.getElementById('mc-botao'), dano: document.getElementById('tela-dano'),
    };
    this.el.botao.addEventListener('click', () => this._botaoCard?.());
  }

  async carregar() {
    const gl = new GLTFLoader(), B = this.base, E = `${B}/personagens/elenco`;
    const [band, refem, pol] = await Promise.all([Personagem.carregar(`${E}/maniaco.glb`), Personagem.carregar(`${E}/mae.glb`), Personagem.carregar(`${E}/policial.glb`)]);
    this.bandido = band; this.refem = refem; this.policiais = [pol, pol.clonar(), pol.clonar(), pol.clonar(), pol.clonar()];
    for (const p of [band, refem, ...this.policiais]) { p.obj.rotation.order = 'YXZ'; p.obj.traverse(m => { if (m.isMesh) { m.castShadow = true; m.frustumCulled = false; } }); this.scene.add(p.obj); p.piscarAuto(true); }
    const pistolaBase = this.armas.modelos.pistola.raiz;
    const copiaPistola = () => { const c = pistolaBase.clone(true); c.visible = true; this.scene.add(c); return c; };
    this.armaBandido = copiaPistola();
    this.armasPol = this.policiais.map(copiaPistola);
    // viaturas, cones e faixa de isolamento
    try {
      const pc = (await gl.loadAsync(`${B}/veiculos/police.glb`)).scene, cone = (await gl.loadAsync(`${B}/veiculos/cone.glb`)).scene;
      // cerco: 8 viaturas fechando a rua dos dois lados (sul, perto da rotatória, e norte, atrás do bandido)
      const POS_VIAT = [[246.2, 227, -2.5], [258.2, 226, 2.45], [240.6, 233.6, -1.9], [263.6, 234.2, 2.0], [252.2, 231.5, 3.05], [245.4, 195.6, 0.7], [258.6, 195.2, -0.75], [252, 190.4, 0.05]];
      this.viaturas = POS_VIAT.map(([x, z, ry]) => { const o = pc.clone(true); o.scale.setScalar(1.7); o.position.set(x, 0, z); o.rotation.y = ry; this.scene.add(o); return o; });
      const amb = (await gl.loadAsync(`${B}/veiculos/ambulance.glb`)).scene; amb.scale.setScalar(1.7); amb.position.set(268.5, 0, 236.5); amb.rotation.y = 2.5; this.scene.add(amb); this.viaturas.push(amb);
      this.cones = [];
      for (const [x, z] of [[244, 204], [247, 203.5], [250, 203.2], [253, 203.2], [256, 203.5], [259.5, 204], [243.5, 219.8], [260.5, 219.6]]) { const o = cone.clone(true); o.scale.setScalar(1.7); o.position.set(x, 0, z); this.scene.add(o); this.cones.push(o); }
    } catch (e) { console.warn('viaturas da missão', e); }
    // faixa de isolamento (listras e "POLÍCIA · NÃO ULTRAPASSE")
    const cf = document.createElement('canvas'); cf.width = 512; cf.height = 32; const gf = cf.getContext('2d');
    gf.fillStyle = '#facc15'; gf.fillRect(0, 0, 512, 32); gf.fillStyle = '#111'; gf.font = '900 20px system-ui'; gf.textBaseline = 'middle';
    for (let i = 0; i < 2; i++) gf.fillText('POLÍCIA · NÃO ULTRAPASSE ·', 6 + i * 256, 17);
    const texF = new THREE.CanvasTexture(cf); texF.wrapS = THREE.RepeatWrapping; texF.colorSpace = THREE.SRGBColorSpace;
    this.faixas = [];
    for (const [x0, z0, x1, z1] of [[243.5, 203.9, 260.5, 203.9], [242.5, 219.7, 261.5, 219.7]]) {
      const L = Math.hypot(x1 - x0, z1 - z0), t = texF.clone(); t.needsUpdate = true; t.repeat.set(L / 9, 1);
      const f = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.14), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }));
      f.position.set((x0 + x1) / 2, 0.95, (z0 + z1) / 2); f.rotation.y = -Math.atan2(z1 - z0, x1 - x0); this.scene.add(f); this.faixas.push(f);
    }
    // helicóptero da polícia circulando com holofote sobre a cena
    this.heli = this._criarHeli(); this.scene.add(this.heli);
    // giroflex das viaturas (sprites piscando)
    this.giros = [];
    for (const v of (this.viaturas || []).slice(0, 8)) for (const [dx, cor] of [[-0.35, '#ff2a2a'], [0.35, '#2a6bff']]) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrilho(cor), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      s.scale.setScalar(1.6); s.position.copy(v.localToWorld(V(dx / 1.7, 1.25, 0))); this.scene.add(s); this.giros.push(s);
    }
    // pontos de arma: a arma girando sobre um anel colorido
    this.pegaveis = PONTOS_ARMA.map(p => {
      const g = criarMarcador(p.cor, 1.4, 18); g.position.set(p.x, 0.15, p.z);
      const m = this.armas.modelos[p.id].raiz.clone(true); m.visible = true; m.scale.setScalar(p.id === 'pistola' ? 3.2 : 1.8); m.position.y = 1.2; m.rotation.x = -Math.PI / 2;
      const giro = new THREE.Group(); giro.add(m); g.add(giro); g.userData.giro = giro;
      this.scene.add(g); return { ...p, g };
    });
    this.marcTorre = criarMarcador('#38bdf8', 1.5, 60); this.marcTorre.position.set(TORRE.porta.x, 0.15, TORRE.porta.z); this.scene.add(this.marcTorre);
    this.marcAlcapao = criarMarcador('#38bdf8', 0.6, 2.2); this.marcAlcapao.position.set(TORRE.alcapao.x, TORRE.terraco.y + 0.02, TORRE.alcapao.z); this.scene.add(this.marcAlcapao);
    this.marcLoja = criarMarcador('#facc15', 1.2, 14); this.marcLoja.position.set(LOJA_PORTA.x, 0.15, LOJA_PORTA.z); this.scene.add(this.marcLoja);
    this.texClarao = texBrilho('rgba(255,220,140,1)');
    this._montarCena();
    this._mostrar(false);
  }

  _criarHeli() {
    const g = new THREE.Group(), azul = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.45, metalness: 0.3 }), preto = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 }),
      branco = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 }), vidro = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.05, metalness: 0.4 });
    const corpo = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), azul); corpo.scale.set(1.25, 1.15, 2.4); g.add(corpo);
    const faixa = new THREE.Mesh(new THREE.SphereGeometry(1.01, 20, 14, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.12), branco); faixa.scale.copy(corpo.scale); g.add(faixa);
    const cab = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), vidro); cab.scale.set(1.05, 0.9, 1.3); cab.position.set(0, 0.15, 1.15); cab.rotation.x = 0.35; g.add(cab);
    const cauda = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.32, 5.2, 10), azul); cauda.rotation.x = Math.PI / 2; cauda.position.set(0, 0.35, -4.4); g.add(cauda);
    const der = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.8), azul); der.position.set(0, 0.9, -6.8); g.add(der);
    for (const s of [1, -1]) { const sk = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 3.6), preto); sk.position.set(s * 0.95, -1.35, 0.1); g.add(sk); for (const z of [-0.8, 0.9]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), preto); p.position.set(s * 0.85, -1.1, z); g.add(p); } }
    const rotor = new THREE.Group(); rotor.position.y = 1.35; g.add(rotor);
    for (let i = 0; i < 4; i++) { const pa = new THREE.Mesh(new THREE.BoxGeometry(10, 0.05, 0.32), preto); pa.rotation.y = i * Math.PI / 4 * 2 / 2 + i * Math.PI / 4; rotor.add(pa); }
    const disco = new THREE.Mesh(new THREE.CircleGeometry(5, 32), new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
    disco.rotation.x = -Math.PI / 2; rotor.add(disco);
    const rc = new THREE.Group(); rc.position.set(0.18, 0.9, -6.9); g.add(rc); const pc = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 0.12), preto); rc.add(pc);
    // holofote: cone de luz aditivo apontado para baixo (orientado no laço)
    const cone = new THREE.Mesh(new THREE.ConeGeometry(4.5, 1, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff7d6, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    cone.geometry.translate(0, -0.5, 0); this.holofote = cone; this.scene.add(cone);
    g.userData = { rotor, rc }; g.scale.setScalar(0.9);
    return g;
  }

  _mostrar(v) {
    for (const o of [this.bandido.obj, this.refem.obj, ...this.policiais.map(p => p.obj), this.armaBandido, ...this.armasPol, ...(this.viaturas || []), ...this.giros, ...(this.cones || []), ...(this.faixas || []), this.heli, this.holofote]) if (o) o.visible = v;
    for (const p of this.pegaveis) p.g.visible = v && !this.armas.possui.has(p.id);
    this.marcTorre.visible = this.marcAlcapao.visible = v;
  }

  /** posições e poses iniciais (também usado para tentar de novo) */
  _montarCena() {
    const b = this.bandido, r = this.refem;
    b.obj.position.set(CENA.x, 0, CENA.z); b.obj.rotation.set(0, 0, 0);
    r.obj.position.set(CENA.x - 0.08, 0, CENA.z + 0.42); r.obj.rotation.set(0, 0.05, 0);
    b.tocar('Parado'); r.tocar('Assustado');
    b.rosto({ expressao: 'raiva', forca: 0.9 }); r.rosto({ expressao: 'medo', forca: 1 });
    const posPol = [[248.8, 223.4], [252.6, 222.8], [256.4, 223.6], [247.6, 198.6], [256.8, 198.2]];
    this.policiais.forEach((p, i) => { p.obj.position.set(...[posPol[i][0], 0, posPol[i][1]]); p.obj.rotation.set(0, Math.atan2(CENA.x - posPol[i][0], CENA.z - posPol[i][1]), 0); p.tocar('Parado'); p.rosto({ expressao: 'neutro' }); p._caido = 0; p._anda = null; });
    b._caido = 0; r._caido = 0; b._maosAlto = 0; b._miraPolicia = false; b._arma = null; r._anda = null;
    for (const p of [b, r]) { p.obj.rotation.x = 0; p.obj.position.y = 0; p.piscarAuto(true); }
    for (const p of this.policiais) { p.obj.rotation.x = 0; p.obj.position.y = 0; }
    this.armaBandido.visible = true;
    this.nervoso = 0;
  }

  iniciar(comIntro = true) {
    if (this.estado !== 'inativa' && this.estado !== 'falha') return;
    this.t = 0; this.acoes = []; this.tFala = 2; this.iFala = 0;
    this._montarCena(); this._mostrar(true);
    if (comIntro) return this._intro();
    this.estado = 'ativa';
    this._cardInicio();
  }

  // abertura da missão: noticiário de urgência com cortes para o cerco, o bandido, a refém e o negociador
  _intro() {
    this.estado = 'intro'; this.tIntro = 0; this.iPlanoIntro = -1;
    document.body.classList.add('em-cine'); document.getElementById('mi-intro').classList.remove('oculto');
    this._pularIntro = e => { if (['Enter', 'Space', 'Escape', 'NumpadEnter'].includes(e.code)) { e.preventDefault(); e.stopImmediatePropagation(); this.pularIntro(); } };
    addEventListener('keydown', this._pularIntro, true);
    document.getElementById('mi-pular').onclick = () => this.pularIntro();
  }
  pularIntro() {
    if (this.estado !== 'intro') return;
    removeEventListener('keydown', this._pularIntro, true);
    document.body.classList.remove('em-cine'); document.getElementById('mi-intro').classList.add('oculto');
    this._limparFalas(); this.estado = 'ativa'; this._cardInicio();
  }
  _cardInicio() {
    this._card('MISSÃO: REFÉM NA ROTATÓRIA',
      `Um assaltante faz uma mulher de <b>refém</b> na rua que chega à <b>Rotatória</b>. A polícia cercou, mas não tem ângulo de tiro.<br><br>
       Só um tiro de longe salva a refém: pegue a <b class="c-s">SNIPER (S)</b>, suba no <b class="c-t">terraço da torre (▲)</b> e acerte o bandido: no corpo ou na arma dele.<br><br>
       ⚠️ Chegou a menos de ${RAIO_ALERTA} m dele, atirou com outra arma ou ligou a sirene por perto? Ele percebe, atira na refém e a polícia atira em todo mundo que estiver perto.<br><br>
       A sniper vem com <b>1 bala</b>. Mais balas só na <b class="c-l">Loja de Munição ($)</b>. Pistola (P) e metralhadora (M) também estão no mapa.`,
      'Entendi', () => this._fecharCard());
  }

  get ativa() { return this.estado === 'ativa'; }

  /** câmera das cenas da missão: a abertura de urgência e o desfecho ruim (vistos de perto, do lado da polícia) */
  camCena() {
    if (this.estado === 'intro') {
      const PL = [
        [0, 3.4, [224, 36, 182], [232, 29, 190], [252, 0, 213], [252, 0, 213], null],
        [3.4, 6.4, [250.6, 1.25, 230.2], [251.0, 1.3, 228.2], [252, 1.45, 212.6], [252, 1.5, 212.6], ['bandido', 'Ninguém chega perto ou ela morre!']],
        [6.4, 8.9, [252.7, 1.62, 215.6], [252.4, 1.6, 214.6], [251.95, 1.55, 212.7], [251.95, 1.55, 212.7], ['refem', 'Socorro! Por favor!']],
        [8.9, 11.6, [253.9, 1.85, 225.6], [253.5, 1.8, 224.6], [252, 1.5, 212.6], [252, 1.5, 212.6], ['policia', 'Calma! Ninguém precisa se machucar.']],
      ];
      const tt = this.tIntro, i = PL.findIndex(p => tt < p[1]);
      if (i < 0) { this.pularIntro(); return null; }
      const pl = PL[i], u = suave((tt - pl[0]) / (pl[1] - pl[0]));
      if (i !== this.iPlanoIntro) { this.iPlanoIntro = i; if (pl[6]) this._falar(pl[6][0], pl[6][1], pl[1] - pl[0] - 0.2); }
      return { p: V(...pl[2]).lerp(V(...pl[3]), u), a: V(...pl[4]).lerp(V(...pl[5]), u), fov: i === 0 ? 50 : 42 };
    }
    if (this.estado !== 'percebeu') return null;
    const u = Math.min(1, (this.t - this.tFalha) / 3.5);
    return { p: V(247.2 + u * 0.9, 1.95 - u * 0.25, 218.6 - u * 1.6), a: V(252, 1.0, 212.6) };
  }

  /** alvos esféricos para a câmera da bala: { tipo: 'bandido' | 'arma' | 'refem', parte, centro, raio } */
  alvosBala() {
    if (this.estado !== 'ativa') return [];
    const lista = [];
    const partes = (pers, tipo) => {
      const o = pers.obj; o.updateWorldMatrix(true, true); const n = k => o.getObjectByName(k), w = k => n(k).getWorldPosition(V());
      lista.push({ tipo, parte: 'cabeça', centro: w('Cabeca').add(V(0, 0.09, 0)), raio: 0.13 });
      lista.push({ tipo, parte: 'peito', centro: w('Peito'), raio: 0.2 });
      lista.push({ tipo, parte: 'barriga', centro: w('Coluna'), raio: 0.18 });
      lista.push({ tipo, parte: 'quadril', centro: w('Quadril'), raio: 0.17 });
      for (const l of ['D', 'E']) {
        lista.push({ tipo, parte: 'braço', centro: w('Braco' + l).lerp(w('Antebraco' + l), 0.5), raio: 0.07 });
        lista.push({ tipo, parte: 'braço', centro: w('Antebraco' + l).lerp(w('Mao' + l), 0.5), raio: 0.06 });
        lista.push({ tipo, parte: 'perna', centro: w('Coxa' + l).lerp(w('Canela' + l), 0.5), raio: 0.1 });
        lista.push({ tipo, parte: 'perna', centro: w('Canela' + l).lerp(w('Pe' + l), 0.5), raio: 0.075 });
      }
    };
    partes(this.bandido, 'bandido'); partes(this.refem, 'refem');
    lista.push({ tipo: 'arma', parte: 'arma', centro: this.armaBandido.localToWorld(V(0, 0.0, -0.06)), raio: 0.1 });
    return lista;
  }

  /** a bala chegou (chamado pela câmera da bala no instante do impacto) */
  aoImpacto(res) {
    if (this.estado !== 'ativa') return;
    if (res.tipo === 'bandido' || res.tipo === 'arma') this._vitoria(res);
    else if (res.tipo === 'refem') this._falhar('Você acertou a refém.', { refemAtingida: true });
    else {
      this.nervoso = 6;
      this.bandido.rosto({ expressao: 'medo', forca: 1 });
      this.jogo.toast(this.armas.reserva.sniper > 0 ? 'Errou! O bandido se assustou, mas não sabe de onde veio o tiro. Tente de novo.' : 'Errou! E a sniper está sem balas: compre na Loja de Munição ($).');
    }
  }

  /** tiros de pistola/metralhadora (gancho do Armas.aoAtirar) */
  aoTiroComum(ponto, id) {
    if (!this.ativa || id === 'sniper') return;
    const j = this.jogo.jogador();
    if (Math.hypot(j.x - CENA.x, j.z - CENA.z) < 140 || (ponto && Math.hypot(ponto.x - CENA.x, ponto.z - CENA.z) < 30)) this._falhar('O bandido ouviu os tiros.');
  }

  /** interação com E: subir/descer da torre (a loja é tratada pela própria loja) */
  interacao() {
    const j = this.jogo.jogador();
    if (this.jogo.noTerraco()) {
      if (Math.hypot(j.x - TORRE.alcapao.x, j.z - TORRE.alcapao.z) < 1.4) return { texto: '[E] Descer do terraço', fazer: () => this.jogo.descerTerraco() };
    } else if (!this.jogo.noVeiculo() && Math.hypot(j.x - TORRE.porta.x, j.z - TORRE.porta.z) < 2.4) {
      return { texto: '[E] Subir ao terraço da torre', fazer: () => this.jogo.irTerraco() };
    }
    return null;
  }

  // ------------------------------------------------------------------------------------------- laço
  atualizar(dt, t) {
    this.t += dt;
    for (const s of this.giros) { const k = (Math.sin(t * 9 + s.position.x) > 0) ? 1 : 0.15; s.material.opacity = k; }
    for (const p of this.pegaveis) {
      if (!p.g.visible) continue;
      p.g.userData.giro.rotation.y += dt * 1.6; p.g.userData.giro.position.y = Math.sin(t * 2.4) * 0.15;
      p.g.userData.anel.rotation.z += dt;
    }
    for (const m of [this.marcTorre, this.marcAlcapao, this.marcLoja]) m.userData.anel.rotation.z += dt * 0.8;
    this._efeitos(dt);
    if (this.estado === 'inativa') return;
    const j = this.jogo.jogador();
    if (this.estado === 'intro') this.tIntro += dt;
    this._animarHeli(dt, t);
    // falas de tempos em tempos (bandido, refém e negociador) enquanto o jogador está por perto ou olhando pela luneta
    if (this.estado === 'ativa') {
      this.tFala -= dt;
      const perto = Math.hypot(j.x - CENA.x, j.z - CENA.z) < 170 || this.camera.fov < 25;
      if (this.tFala <= 0 && perto) {
        const ordem = ['bandido', 'refem', 'bandido', 'policia'], quem = ordem[this.iFala % 4], lista = FALAS[quem];
        this._falar(quem, lista[Math.floor(this.iFala / 4) % lista.length], 3.2); this.iFala++; this.tFala = 4.5 + Math.random() * 2.5;
      }
    }
    this._atualizarFalas(dt);
    // pegar armas: basta passar por cima (a pé ou de carro)
    for (const p of this.pegaveis) {
      if (!p.g.visible) continue;
      if (Math.hypot(j.x - p.x, j.z - p.z) < (this.jogo.noVeiculo() ? 3.2 : 1.9)) {
        this.armas.pegar(p.id); p.g.visible = false; this.armas._som('engatilhar');
        this.jogo.toast(p.id === 'sniper' ? 'Você pegou a SNIPER (tecla 3) · 1 bala. Agora suba no terraço da torre (▲).' : `Você pegou a ${p.nome.toUpperCase()} (tecla ${p.id === 'pistola' ? 1 : 2}). Mas com ela não dá para salvar a refém.`);
      }
    }
    // atores
    this._animarAtores(dt, t);
    if (this.estado === 'ativa') {
      this.nervoso = Math.max(0, this.nervoso - dt);
      if (this.nervoso <= 0 && this.bandido._estadoRosto !== 'raiva') { this.bandido.rosto({ expressao: 'raiva', forca: 0.9 }); this.bandido._estadoRosto = 'raiva'; }
      const d = Math.hypot(j.x - CENA.x, j.z - CENA.z);
      if (!this.jogo.noTerraco() && d < RAIO_ALERTA) this._falhar(this.jogo.noVeiculo() ? 'O bandido viu o carro chegando.' : 'O bandido viu você chegando.');
      else if (this.jogo.sireneLigada() && d < 90) this._falhar('A sirene assustou o bandido.');
    }
    // ações programadas (sequências de vitória/derrota)
    this.acoes = this.acoes.filter(a => { if (this.t >= a.t) { a.f(); return false; } return true; });
    this._hud(j);
  }

  /** sirenes tocando perto do cerco */
  sireneProxima(x, z) { return ['intro', 'ativa', 'percebeu'].includes(this.estado) && Math.hypot(x - CENA.x, z - CENA.z) < 120; }

  _animarHeli(dt, t) {
    const h = this.heli; if (!h?.visible) return;
    const a = t * 0.11, R = 42;
    h.position.set(CENA.x + Math.cos(a) * R, 34 + Math.sin(t * 0.4) * 1.2, CENA.z + Math.sin(a) * R);
    h.rotation.set(0.08, -a, -0.12);                                                     // de lado, inclinado para dentro da curva
    h.userData.rotor.rotation.y += dt * 38; h.userData.rc.rotation.x += dt * 60;
    const alvo = V(CENA.x + Math.sin(t * 0.7) * 1.5, 0, CENA.z + Math.cos(t * 0.5) * 1.5), de = h.position.clone().add(V(0, -1.2, 0));
    const L = de.distanceTo(alvo);
    this.holofote.position.copy(de); this.holofote.scale.set(1, L, 1);
    this.holofote.quaternion.setFromUnitVectors(V(0, -1, 0), alvo.clone().sub(de).normalize());
    this.holofote.material.opacity = this.jogo.noite?.() ? 0.2 : 0.09;
  }

  _falar(quem, texto, dur = 3) {
    const el = document.getElementById('baloes-missao'); if (!el) return;
    const ator = quem === 'bandido' ? this.bandido : quem === 'refem' ? this.refem : this.policiais[1];
    if (ator._caido) return;
    for (const f of this.falas || []) if (f.quem === quem) f.vida = 0;
    const d = document.createElement('div'); d.className = `balao b-${quem}`;
    d.innerHTML = `<span class="b-nome">${{ bandido: 'Bandido', refem: 'Refém', policia: 'Negociador' }[quem]}</span><span class="b-txt"></span>`;
    el.appendChild(d);
    (this.falas ||= []).push({ quem, ator, el: d, txt: texto, t: 0, vida: dur });
  }
  _atualizarFalas(dt) {
    if (!this.falas?.length) return;
    const cam = this.camera;
    this.falas = this.falas.filter(f => {
      f.t += dt; f.vida -= dt;
      if (f.vida <= 0) { f.el.remove(); return false; }
      f.el.querySelector('.b-txt').textContent = f.txt.slice(0, Math.floor(f.t * 32));
      const cab = f.ator.obj.getObjectByName('Cabeca').getWorldPosition(V()).add(V(0, 0.42, 0)), pt = cab.clone().project(cam);
      const dist = cam.position.distanceTo(cab), on = pt.z < 1 && Math.abs(pt.x) < 1.05 && Math.abs(pt.y) < 1.05 && dist * cam.fov / 56 < 95;
      f.el.style.opacity = on ? 1 : 0;
      if (on) f.el.style.transform = `translate(${((pt.x * 0.5 + 0.5) * innerWidth).toFixed(0)}px, ${((-pt.y * 0.5 + 0.5) * innerHeight).toFixed(0)}px) translate(-50%, -100%)`;
      return true;
    });
  }
  _limparFalas() { for (const f of this.falas || []) f.el.remove(); this.falas = []; }

  _hud(j) {
    if (this.estado === 'ativa') {
      const temS = this.armas.possui.has('sniper'), balas = temS ? this.armas.estado.sniper.municao + this.armas.reserva.sniper : 0;
      let alvo, txt;
      if (!temS) { alvo = PONTOS_ARMA[2]; txt = 'Pegue a SNIPER (S no mapa)'; }
      else if (balas <= 0) { alvo = LOJA_PORTA; txt = 'Sem balas: vá à Loja de Munição ($)'; }
      else if (!this.jogo.noTerraco()) { alvo = TORRE.porta; txt = 'Suba no terraço da torre (▲)'; }
      else { alvo = CENA; txt = 'Botão direito (ou Z / Mirar): luneta · clique: atirar'; }
      const d = Math.round(Math.hypot(j.x - alvo.x, j.z - alvo.z));
      this.jogo.hud('MISSÃO · REFÉM NA ROTATÓRIA', `${txt}${this.jogo.noTerraco() && temS && balas > 0 ? '' : ` · ${d} m`}`);
    } else if (this.estado === 'vitoria' || this.estado === 'concluida') this.jogo.hud('MISSÃO CUMPRIDA', 'Refém salva! Explore Hryz City.');
    else if (this.estado === 'percebeu' || this.estado === 'falha') this.jogo.hud('MISSÃO FRACASSADA', 'O bandido percebeu você.');
  }

  _animarAtores(dt, t) {
    const b = this.bandido, r = this.refem;
    for (const p of [b, r, ...this.policiais]) {
      if (p._caido > 0) { p._caido = Math.min(1, p._caido + dt * 1.6); const k = suave(p._caido); p.obj.rotation.x = p._lado * k * (Math.PI / 2 - 0.08); p.obj.position.y = 0.12 * k; continue; }
      if (p._anda) {                                                                           // anda/corre até um ponto
        const a = p._anda, dx = a.x - p.obj.position.x, dz = a.z - p.obj.position.z, dist = Math.hypot(dx, dz);
        if (dist < 0.3) { p._anda = null; p.tocar(a.fim || 'Parado'); }
        else { const vel = a.vel * dt; p.obj.position.x += dx / dist * Math.min(vel, dist); p.obj.position.z += dz / dist * Math.min(vel, dist); p.obj.rotation.y = Math.atan2(dx, dz); }
      }
      p.atualizar(dt);
    }
    // bandido: braço esquerdo prende a refém, a pistola encostada na cabeça dela (ou apontada para a polícia se percebeu)
    if (!b._caido && r.obj.visible) {
      b.obj.updateWorldMatrix(true, true); r.obj.updateWorldMatrix(true, true);
      const cabR = r.obj.getObjectByName('Cabeca').getWorldPosition(V()).add(V(0, 0.06, 0)), peitoR = r.obj.getObjectByName('Peito').getWorldPosition(V());
      const frente = V(Math.sin(b.obj.rotation.y), 0, Math.cos(b.obj.rotation.y)), direita = V().crossVectors(frente, CIMA).normalize();
      const n = k => b.obj.getObjectByName(k);
      if (b._maosAlto > 0) {                                                                    // rendido: mãos para o alto
        b._maosAlto = Math.min(1, b._maosAlto + dt * 2);
        for (const [l, s] of [['D', 1], ['E', -1]]) { const om = n('Braco' + l).getWorldPosition(V()); ik2(n('Braco' + l), n('Antebraco' + l), n('Mao' + l), om.clone().add(V(0, 0.55 * b._maosAlto + 0.05, 0)).addScaledVector(direita, s * 0.28).addScaledVector(frente, 0.05), direita.clone().multiplyScalar(s).addScaledVector(CIMA, -0.3)); }
      } else if (!b._arma) {
        const mira = b._miraPolicia ? this.policiais[1].obj.position.clone().add(V(0, 1.4, 0)) : cabR.clone().addScaledVector(direita, -0.3);
        const tremor = this.nervoso > 0 ? 0.012 : 0.004;
        let cabo;
        if (b._miraPolicia) { segurarPistola(b.obj, this.armaBandido, mira, tremor, t); }
        else {
          cabo = cabR.clone().addScaledVector(direita, 0.17).addScaledVector(frente, -0.02).add(V(Math.sin(t * 21) * tremor, Math.sin(t * 15) * tremor, 0));
          const dirC = cabR.clone().sub(cabo).normalize();
          this.armaBandido.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(V(), dirC.clone().negate(), CIMA));
          this.armaBandido.position.copy(cabo); this.armaBandido.updateMatrixWorld(true);
          ik2(n('BracoD'), n('AntebracoD'), n('MaoD'), cabo.clone().addScaledVector(CIMA, -0.02), direita.clone().multiplyScalar(0.7).addScaledVector(CIMA, -1));
          ik2(n('BracoE'), n('AntebracoE'), n('MaoE'), peitoR.clone().add(V(0, 0.16, 0)).addScaledVector(direita, 0.12).addScaledVector(frente, 0.08), direita.clone().multiplyScalar(-1).addScaledVector(CIMA, -0.4));
        }
      }
    }
    // policiais mirando no bandido
    const alvoPol = b.obj.getObjectByName('Cabeca').getWorldPosition(V());
    this.policiais.forEach((p, i) => { if (!p._caido && !p._anda) segurarPistola(p.obj, this.armasPol[i], alvoPol, 0.003, t + i); });
    // arma do bandido voando (tiro na arma) ou caindo
    if (b._arma) {
      const a = b._arma; a.v.y -= 9.8 * dt; this.armaBandido.position.addScaledVector(a.v, dt); this.armaBandido.rotation.x += a.w * dt; this.armaBandido.rotation.z += a.w * 0.6 * dt;
      if (this.armaBandido.position.y < 0.03) { this.armaBandido.position.y = 0.03; a.v.multiplyScalar(0.3); a.v.y = Math.abs(a.v.y) * 0.25; a.w *= 0.4; }
    }
  }

  _cair(p, paraTras = true) { if (p._caido) return; p._caido = 0.001; p._lado = paraTras ? -1 : 1; p._anda = null; p.rosto({ expressao: 'grito', forca: 0.6, piscar: 1 }); p.piscarAuto(false); }

  _tiroNPC(origem, alvo) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.texClarao, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.position.copy(origem); s.scale.setScalar(0.6); this.scene.add(s); this.efeitos.push({ o: s, vida: 0.06 });
    const dist = origem.distanceTo(alvo), r = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, dist), new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    r.position.copy(origem).lerp(alvo, 0.5); r.lookAt(alvo); this.scene.add(r); this.efeitos.push({ o: r, vida: 0.07 });
    const sAtual = this.armas.atual; this.armas.atual = 'pistola'; this.armas._som('tiro', 0.45); this.armas.atual = sAtual;
  }
  _efeitos(dt) { this.efeitos = this.efeitos.filter(e => { e.vida -= dt; if (e.vida <= 0) { this.scene.remove(e.o); e.o.material.dispose(); e.o.geometry?.dispose(); return false; } return true; }); }
  _depois(seg, f) { this.acoes.push({ t: this.t + seg, f }); }
  _boca(arma) { return arma.localToWorld(V(0, 0.032, -0.16)); }

  // ------------------------------------------------------------------------------------------- desfechos
  _falhar(motivo, { refemAtingida = false } = {}) {
    if (this.estado !== 'ativa') return;
    this.estado = 'percebeu'; this.tFalha = this.t; document.body.classList.add('em-cine');
    this.jogo.toast('⚠️ ' + motivo);
    const b = this.bandido, r = this.refem, j0 = this.jogo.jogador();
    const perto = !this.jogo.noTerraco() && Math.hypot(j0.x - CENA.x, j0.z - CENA.z) < 50;
    b.rosto({ expressao: 'grito', forca: 1 }); this._falar('bandido', 'EU AVISEI!!', 1.6);
    if (refemAtingida) { this._cair(r, false); }
    else this._depois(0.9, () => { this._tiroNPC(this._boca(this.armaBandido), r.obj.getObjectByName('Cabeca').getWorldPosition(V())); this._cair(r, false); });
    this._depois(1.3, () => { b._miraPolicia = true; });
    [1.55, 1.75, 2.0].forEach((s, i) => this._depois(s, () => { this._tiroNPC(this._boca(this.armasPol[i]), b.obj.getObjectByName('Peito').getWorldPosition(V())); if (i === 1) this._cair(b, true); }));
    if (perto) [2.5, 2.7].forEach((s, i) => this._depois(s, () => {
      const j = this.jogo.jogador(); this._tiroNPC(this._boca(this.armasPol[i * 2]), V(j.x, 1.2, j.z));
      if (i === 1) { this.el.dano.classList.add('visivel'); this.jogo.atingirJogador(); }
    }));
    this._depois(perto ? 4.2 : 3.6, () => {
      this.estado = 'falha'; document.body.classList.remove('em-cine');
      this._card('MISSÃO FRACASSADA', `${motivo}<br><br>${refemAtingida ? 'Mire com calma: a cabeça do bandido fica logo atrás da dela.' : 'O bandido atirou na refém e a polícia abriu fogo.'}${perto ? '<br><b>Você estava perto demais e também foi atingido.</b>' : ''}<br><br>Lembre: só a <b class="c-s">sniper</b>, de cima do <b class="c-t">terraço da torre</b>, sem chegar a menos de ${RAIO_ALERTA} m.`,
        'Tentar de novo', () => { this._fecharCard(); this.el.dano.classList.remove('visivel'); if (perto) this.jogo.reviver(); this.iniciar(false); this._fecharCard(); });
    });
  }

  _vitoria(res) {
    this.estado = 'vitoria';
    const b = this.bandido, r = this.refem;
    if (res.tipo === 'arma') {
      const dir = res.dir.clone().setY(0).normalize();
      b._arma = { v: dir.multiplyScalar(6).add(V(0, 3.5, 0)), w: 18 }; b._maosAlto = 0.001;
      b.rosto({ expressao: 'surpresa', forca: 1 });
    } else {
      this._cair(b, true);
      b._arma = { v: V(0.6, 1.2, -0.8), w: 6 };
    }
    // a refém corre para trás das viaturas; os policiais avançam
    if (res.tipo === 'arma') this._depois(0.5, () => this._falar('bandido', 'Tá bom, tá bom! Eu me rendo!', 2.6));
    this._depois(1.1, () => this._falar('policia', res.tipo === 'arma' ? 'Mãos na cabeça! Refém segura!' : 'Suspeito no chão! Refém segura!', 2.6));
    this._depois(2.4, () => this._falar('refem', 'Obrigada… obrigada!', 2.4));
    this._depois(0.7, () => { r.rosto({ expressao: 'surpresa', forca: 1 }); r._anda = { x: 252, z: 233, vel: 3.0, fim: 'Assustado' }; r.tocar('Correr'); r.obj.rotation.x = 0; });
    this.policiais.forEach((p, i) => this._depois(1.0 + i * 0.25, () => {
      if (i === 1) return;
      p._anda = { x: CENA.x + (i - 1) * 1.6, z: CENA.z + 2.2, vel: 2.2, fim: 'Parado' }; p.tocar('Correr');
    }));
    const parte = res.tipo === 'arma' ? 'na ARMA do bandido: ele largou a pistola e se rendeu' : `no ${res.parte === 'cabeça' ? 'na cabeça' : res.parte} do bandido`.replace('no na', 'na');
    this._depois(4.2, () => {
      this.estado = 'concluida';
      this._card('MISSÃO CUMPRIDA!', `Tiro de <b>${res.dist.toFixed(0)} m</b>, acertou ${parte}.<br><br>A refém está salva e a polícia assumiu a ocorrência. 👏<br><br>Agora a cidade é sua: dirija, explore a Selva ou volte à loja.`,
        'Continuar', () => this._fecharCard());
    });
  }

  _card(titulo, html, botao, aoClicar) {
    this.el.titulo.textContent = titulo; this.el.texto.innerHTML = html; this.el.botao.textContent = botao; this._botaoCard = aoClicar;
    this.el.card.classList.remove('oculto');
  }
  _fecharCard() { this.el.card.classList.add('oculto'); }
  get cardAberto() { return !this.el.card.classList.contains('oculto'); }

  /** desenha os marcadores no minimapa (toMM: mundo → canvas) */
  desenharMinimapa(ctx, toMM, W, H) {
    if (this.estado === 'inativa') return;
    const borda = (x, y) => [Math.max(9, Math.min(W - 9, x)), Math.max(9, Math.min(H - 9, y))];
    const icone = (wx, wz, cor, letra, r = 7) => {
      const [x, y] = borda(...toMM(wx, wz));
      ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#0b1220'; ctx.font = `900 ${r + 3}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(letra, x, y + 0.5);
    };
    if (this.estado === 'ativa' || this.estado === 'percebeu') {
      const [cx, cy] = toMM(CENA.x, CENA.z), esc = toMM(CENA.x + 1, CENA.z)[0] - cx;
      ctx.fillStyle = 'rgba(239,68,68,0.18)'; ctx.strokeStyle = 'rgba(239,68,68,0.8)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx, cy, RAIO_ALERTA * esc, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
    }
    for (const p of this.pegaveis) if (p.g.visible) icone(p.x, p.z, p.cor, p.letra);
    icone(LOJA_PORTA.x, LOJA_PORTA.z, '#facc15', '$');
    icone(TORRE.porta.x, TORRE.porta.z, '#38bdf8', '▲', 7);
    if (this.estado === 'ativa' || this.estado === 'percebeu') icone(CENA.x, CENA.z, '#ef4444', '✖', 7 + Math.sin(performance.now() / 180) * 1.2);
  }
}
