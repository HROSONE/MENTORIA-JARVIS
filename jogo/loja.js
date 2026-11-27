// LOJA DE MUNIÇÃO do Hryz City ("Hryz Armas & Munição"). Por fora: letreiro e porta num prédio de loja perto da delegacia.
// Por dentro: uma sala fechada montada longe da cidade (o jogo leva o jogador para lá ao entrar), com balcão, prateleiras de caixas,
// armas expostas na parede, luminárias e o vendedor. O jogador anda à vontade; quando chega ao balcão começa a CONVERSA:
// cortes de câmera (geral, sobre o ombro, close, detalhe), balões de fala e gestos (aceno, cabeça, apontar, pegar a caixa),
// e ao fim ele já está com 5 balas de sniper e os pentes repostos.
import * as THREE from 'three';
import { Personagem } from '../videos/biblioteca3d/personagens/elenco/elenco.js';
import { instalarAnimacoesUniversal } from '../videos/biblioteca3d/animacoes/universal.js';
import { ik2 } from './armas.js';
import { LOJA_PORTA } from './missao.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const CIMA = V(0, 1, 0);
const suave = t => t * t * (3 - 2 * t);
export const O = { x: -330, z: -330 };                 // centro da sala (fora da cidade)
const SALA = { L: 12, P: 10, H: 3.6 };

function texto(w, h, desenhar) { const c = document.createElement('canvas'); c.width = w; c.height = h; desenhar(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function caixa(sx, sy, sz, mat, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; }

// roteiro da conversa: quem fala, o texto, o plano de câmera e o gesto
const CONVERSA = [
  { quem: 'v', txt: 'Opa! Bem-vindo à Hryz Armas. Em que posso ajudar?', plano: 'geral', gesto: 'acenar', dur: 3.2 },
  { quem: 'j', txt: 'Preciso de munição pra sniper. Calibre .308.', plano: 'ombroJ', gesto: 'falar', dur: 3.0 },
  { quem: 'v', txt: '.308, é? Tá com pressa, hein…', plano: 'closeV', gesto: 'cabeca', dur: 2.6 },
  { quem: 'j', txt: 'Tem uma refém lá na rotatória.', plano: 'ombroV', gesto: 'falar', dur: 2.6 },
  { quem: 'v', txt: 'Então leva cinco. E pente cheio pra pistola e pra metralhadora.', plano: 'prateleira', gesto: 'pegar', dur: 4.2 },
  { quem: 'j', txt: 'Valeu!', plano: 'detalhe', gesto: 'entregar', dur: 2.4 },
  { quem: 'v', txt: 'Boa sorte. Respira fundo, mira com calma… e só então atira.', plano: 'geral2', gesto: 'apontar', dur: 3.4 },
];

export class Loja {
  /** opc: { scene, camera, armas, base, jogo: { jogador(), pers() → Personagem do jogador, entrar(pos), sair(pos), toast(msg), garantirCompleto() } } */
  constructor(opc) {
    Object.assign(this, opc);
    this.dentro = false; this.cena = null; this.compras = 0;
    this.elBaloes = document.getElementById('baloes');
  }

  async carregar() {
    const g = this.grupo = new THREE.Group(); g.position.set(O.x, 0, O.z); this.scene.add(g);
    const { L, P, H } = SALA;
    const piso = new THREE.MeshStandardMaterial({ map: texto(512, 512, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#6b4a2e' : '#7a5636'; c.fillRect(0, i * h / 8, w, h / 8); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, i * h / 8, w, 2); } }), roughness: 0.8 });
    piso.map.wrapS = piso.map.wrapT = THREE.RepeatWrapping; piso.map.repeat.set(3, 3);
    const parede = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.9 }), parede2 = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.85 });
    const madeira = new THREE.MeshStandardMaterial({ color: 0x5b3a22, roughness: 0.6 }), metal = new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.4, metalness: 0.7 });
    const vidro = new THREE.MeshStandardMaterial({ color: 0x9ec9e0, roughness: 0.05, transparent: true, opacity: 0.25 });
    g.add(caixa(L, 0.1, P, piso, 0, -0.05, 0));
    g.add(caixa(L, 0.1, P, new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 1 }), 0, H + 0.05, 0));
    g.add(caixa(L, H, 0.2, parede2, 0, H / 2, -P / 2));                                             // fundo (atrás do balcão)
    g.add(caixa(0.2, H, P, parede, -L / 2, H / 2, 0)); g.add(caixa(0.2, H, P, parede, L / 2, H / 2, 0));
    g.add(caixa(L / 2 - 1, H, 0.2, parede, -(L / 4 + 0.5), H / 2, P / 2)); g.add(caixa(L / 2 - 1, H, 0.2, parede, L / 4 + 0.5, H / 2, P / 2));
    g.add(caixa(2, H - 2.4, 0.2, parede, 0, 2.4 + (H - 2.4) / 2, P / 2));
    const porta = caixa(1.9, 2.4, 0.06, vidro, 0, 1.2, P / 2); g.add(porta);
    // balcão com tampo de madeira e vitrine
    g.add(caixa(6, 1.0, 0.8, madeira, 0, 0.5, -2.2)); g.add(caixa(6.2, 0.06, 0.95, new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: 0.35 }), 0, 1.03, -2.2));
    g.add(caixa(5.6, 0.5, 0.02, vidro, 0, 0.62, -1.79));
    // prateleiras com caixas de munição
    const rot = (cor, a, b) => new THREE.MeshStandardMaterial({ map: texto(128, 96, (c, w, h) => { c.fillStyle = cor; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.9)'; c.font = '900 30px system-ui'; c.textAlign = 'center'; c.fillText(a, w / 2, 44); c.font = '700 18px system-ui'; c.fillText(b, w / 2, 74); }), roughness: 0.6 });
    const tipos = [rot('#14532d', '.308', 'SNIPER'), rot('#1e3a8a', '9mm', 'PISTOLA'), rot('#7f1d1d', '5.56', 'CARABINA'), rot('#78350f', '12', 'ESPINGARDA')];
    this.caixas308 = [];
    for (let n = 0; n < 3; n++) {
      const y = 0.9 + n * 0.62; g.add(caixa(7, 0.05, 0.5, madeira, 0, y, -P / 2 + 0.35));
      for (let i = 0; i < 12; i++) { const tp = (i + n) % 4, c = caixa(0.34, 0.24, 0.3, tipos[tp], -3.1 + i * 0.56, y + 0.15, -P / 2 + 0.36); g.add(c); if (tp === 0) this.caixas308.push(c); }
    }
    // armas expostas nas paredes laterais (cópias dos modelos do jogo)
    for (const [id, x, y, z, ry, esc] of [['sniper', -5.85, 2.3, -1.2, Math.PI / 2, 1.3], ['metralhadora', -5.85, 1.6, -1.0, Math.PI / 2, 1.3], ['sniper', 5.85, 2.3, -1.4, -Math.PI / 2, 1.3], ['metralhadora', 5.85, 1.6, -1.3, -Math.PI / 2, 1.3], ['pistola', -5.85, 1.1, 0.8, Math.PI / 2, 1.6], ['pistola', 5.85, 1.1, 0.6, -Math.PI / 2, 1.6]]) {
      const m = this.armas.modelos[id].raiz.clone(true); m.visible = true; m.scale.setScalar(esc); m.position.set(x, y, z); m.rotation.set(0, ry, Math.PI / 2 * 0); g.add(m);
      g.add(caixa(0.05, 0.08, 0.8, metal, x + Math.sign(-x) * -0.05, y - 0.08, z));
    }
    // letreiro interno, alvo de papel e luminárias
    const placa = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.7), new THREE.MeshBasicMaterial({ map: texto(840, 140, (c, w, h) => { c.fillStyle = '#111827'; c.fillRect(0, 0, w, h); c.fillStyle = '#facc15'; c.font = '900 70px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('HRYZ ARMAS & MUNIÇÃO', w / 2, h / 2 + 4); }) }));
    placa.position.set(0, 3.05, -P / 2 + 0.12); g.add(placa);
    const alvo = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.2), new THREE.MeshBasicMaterial({ map: texto(180, 240, (c, w, h) => { c.fillStyle = '#f5f5f4'; c.fillRect(0, 0, w, h); for (let r = 6; r > 0; r--) { c.fillStyle = r % 2 ? '#111' : '#f5f5f4'; c.beginPath(); c.arc(w / 2, h / 2 - 10, r * 13, 0, 7); c.fill(); } c.fillStyle = '#dc2626'; c.beginPath(); c.arc(w / 2, h / 2 - 10, 8, 0, 7); c.fill(); }) }));
    alvo.position.set(4.0, 1.9, P / 2 - 0.12); alvo.rotation.y = Math.PI; g.add(alvo);
    const lamp = new THREE.MeshStandardMaterial({ color: 0xfff1c9, emissive: 0xffe2a0, emissiveIntensity: 1.6 });
    for (const [x, z] of [[-3, -1], [3, -1], [-3, 2.5], [3, 2.5]]) g.add(caixa(1.4, 0.06, 0.35, lamp, x, H - 0.05, z));
    this.luz = new THREE.PointLight(0xffe2b0, 18, 14, 1.6); this.luz.position.set(0, H - 0.5, -0.5); g.add(this.luz);
    this.luz2 = new THREE.PointLight(0xffe2b0, 10, 12, 1.6); this.luz2.position.set(0, H - 0.5, 3); g.add(this.luz2);
    this.luz.visible = this.luz2.visible = false;
    // caixa que o vendedor entrega
    this.caixaEntrega = caixa(0.34, 0.24, 0.3, tipos[0], 0, 1.18, -2.2); this.caixaEntrega.visible = false; g.add(this.caixaEntrega);
    // marcador da saída
    const sai = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.6, 32), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
    sai.rotation.x = -Math.PI / 2; sai.position.set(0, 0.03, P / 2 - 0.9); g.add(sai); this.marcSaida = sai;
    // vendedor
    this.vend = await Personagem.carregar(`${this.base}/personagens/elenco/homem.glb`);
    this.vend.obj.position.set(0, 0, -3.3); this.vend.obj.traverse(m => { if (m.isMesh) m.castShadow = true; });
    try { await instalarAnimacoesUniversal(this.vend, { preCarregar: ['ParadoPro'] }); } catch (_) {}
    g.add(this.vend.obj); this.vend.tocar('ParadoPro'); this.vend.piscarAuto(true); this.vend.rosto({ expressao: 'sorriso', forca: 0.6 });
    // fachada na cidade: letreiro sobre a porta
    const fach = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.0), new THREE.MeshBasicMaterial({ map: texto(1040, 200, (c, w, h) => { c.fillStyle = '#111827'; c.fillRect(0, 0, w, h); c.strokeStyle = '#facc15'; c.lineWidth = 10; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#facc15'; c.font = '900 84px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ARMAS & MUNIÇÃO', w / 2, h / 2 + 4); }) }));
    fach.position.set(LOJA_PORTA.x, 4.6, LOJA_PORTA.z - 0.95); this.scene.add(fach);
    this.grupo.visible = false;
  }

  /** limites da sala para o movimento do jogador (plataforma do jogo) */
  get plataforma() {
    const { L, P } = SALA;
    return { y: 0, minX: O.x - L / 2 + 0.5, maxX: O.x + L / 2 - 0.5, minZ: O.z - P / 2 + 0.5, maxZ: O.z + P / 2 - 0.5, interior: true,
      obst: [{ minX: O.x - 3.1, maxX: O.x + 3.1, minZ: O.z - 2.65, maxZ: O.z - 1.75 }, { minX: O.x - 6, maxX: O.x + 6, minZ: O.z - 5, maxZ: O.z - 4.35 }] };
  }

  interacao() {
    const j = this.jogo.jogador();
    if (this.cena) return null;
    if (this.dentro) {
      if (Math.hypot(j.x - O.x, j.z - (O.z + SALA.P / 2 - 0.9)) < 1.3) return { texto: '[E] Sair da loja', fazer: () => this.sair() };
    } else if (!this.jogo.noVeiculo() && Math.hypot(j.x - LOJA_PORTA.x, j.z - LOJA_PORTA.z) < 2.2) {
      return { texto: '[E] Entrar na Loja de Munição', fazer: () => this.entrar() };
    }
    return null;
  }

  async entrar() {
    await this.jogo.garantirCompleto();
    this.dentro = true; this.grupo.visible = true; this.luz.visible = this.luz2.visible = true; this.conversou = false;
    this.jogo.entrar({ x: O.x, z: O.z + SALA.P / 2 - 1.4, ry: Math.PI }, this.plataforma);
    this.jogo.toast('Hryz Armas & Munição · fale com o vendedor no balcão');
  }
  sair() {
    this.dentro = false; this.grupo.visible = false; this.luz.visible = this.luz2.visible = false;
    this.jogo.sair({ x: LOJA_PORTA.x, z: LOJA_PORTA.z + 1.6, ry: 0 });
  }

  // ------------------------------------------------------------------------------------------- conversa
  atualizar(dt, t) {
    if (!this.dentro) return null;
    this.marcSaida.rotation.z += dt;
    const j = this.jogo.jogador();
    if (!this.cena) {
      this.vend.obj.rotation.y = THREE.MathUtils.lerp(this.vend.obj.rotation.y, Math.atan2(j.x - O.x, j.z - (O.z - 3.3)) * 0.6, Math.min(1, dt * 3));
      this.vend.atualizar(dt);
      if (!this.conversou && Math.abs(j.x - O.x) < 2.6 && j.z < O.z - 0.2 && j.z > O.z - 1.75 - 0.9) this._comecar();
      return null;
    }
    return this._cena(dt, t);
  }

  _comecar() {
    this.cena = { i: -1, t: 0, ti: 0 }; this.conversou = true;
    const p = this.jogo.pers();
    this.jogo.travar(true);
    this.jogo.posicionar({ x: O.x + 0.2, z: O.z - 1.15, ry: Math.PI });   // de frente para o vendedor
    this.caixaEntrega.visible = false; this.caixaEntrega.position.set(0, 1.18, -2.2);
    this.fovCena0 = this.camera.fov;
    document.body.classList.add('em-cine');
    this._proxima();
  }

  _proxima() {
    const c = this.cena; c.i++; c.ti = 0;
    if (c.i >= CONVERSA.length) return this._fim();
    const f = CONVERSA[c.i];
    this._balao(f);
  }

  _balao(f) {
    this.elBaloes.innerHTML = `<div class="balao ${f.quem === 'v' ? 'b-vend' : 'b-jog'}"><span class="b-nome">${f.quem === 'v' ? 'Vendedor' : 'Você'}</span><span class="b-txt"></span></div>`;
    this.elBalao = this.elBaloes.firstElementChild; this.elTxt = this.elBalao.querySelector('.b-txt'); this.txtAlvo = f.txt;
  }

  _cena(dt, t) {
    const c = this.cena, f = CONVERSA[c.i]; c.ti += dt;
    const k = Math.min(1, c.ti / f.dur);
    const vend = this.vend, pj = this.jogo.pers();
    const G = (x, y, z) => V(O.x + x, y, O.z + z);
    const MAPA_J = { Cabeca: 'head', BracoD: 'upperarm_r', AntebracoD: 'lowerarm_r', MaoD: 'hand_r', BracoE: 'upperarm_l', AntebracoE: 'lowerarm_l', MaoE: 'hand_l' };
    const ossoJ = n => pj?.obj.getObjectByName(n) || (MAPA_J[n] && pj?.obj.getObjectByName(MAPA_J[n]));
    const cabV = vend.obj.getObjectByName('Cabeca').getWorldPosition(V()).add(V(0, 0.08, 0));
    const cabJ = ossoJ('Cabeca')?.getWorldPosition(V()).add(V(0, 0.08, 0)) || G(0.2, 1.62, -1.15);
    // planos de câmera (cortes secos entre falas, com leve movimento dentro de cada uma)
    const cam = this.camera, P = {
      geral: [G(4.2, 2.1, -1.0), G(-0.2, 1.35, -2.3), 44, G(3.8, 2.0, -1.4)],
      geral2: [G(-4.0, 2.0, -0.6), G(0.2, 1.35, -2.2), 44, G(-3.6, 1.95, -0.9)],
      ombroJ: [G(-0.55, 1.78, -4.2), cabJ, 36, G(-0.45, 1.74, -4.0)],
      closeV: [G(0.35, 1.68, -1.6), cabV, 30, G(0.3, 1.66, -1.85)],
      ombroV: [G(0.7, 1.82, 0.05), cabV, 38, G(0.55, 1.78, -0.15)],
      prateleira: [G(-2.6, 1.75, -1.4), G(0.2, 1.35, -4.4), 42, G(-2.3, 1.7, -1.7)],
      detalhe: [G(2.0, 1.65, -0.7), G(0.1, 1.12, -1.9), 34, G(1.8, 1.58, -0.95)],
    }[f.plano];
    cam.position.copy(P[0]).lerp(P[3], suave(k)); cam.lookAt(P[1]);
    if (cam.fov !== P[2]) { cam.fov = P[2]; cam.updateProjectionMatrix(); }
    // gestos do vendedor
    vend.obj.rotation.y = THREE.MathUtils.lerp(vend.obj.rotation.y, f.gesto === 'pegar' && k > 0.15 && k < 0.6 ? Math.PI : 0, Math.min(1, dt * 5));
    vend.atualizar(dt);
    const falandoV = f.quem === 'v' && k < 0.85, falandoJ = f.quem === 'j' && k < 0.85;
    vend.rosto({ boca: falandoV ? Math.abs(Math.sin(t * 15)) * 0.5 : 0, expressao: f.gesto === 'cabeca' ? 'surpresa' : 'sorriso', forca: 0.7 });
    const nv = n => vend.obj.getObjectByName(n);
    vend.obj.updateWorldMatrix(true, true);
    const frV = V(Math.sin(vend.obj.rotation.y), 0, Math.cos(vend.obj.rotation.y)), dirV = V().crossVectors(frV, CIMA).normalize();
    if (f.gesto === 'acenar' && k < 0.7) {
      const om = nv('BracoD').getWorldPosition(V());
      ik2(nv('BracoD'), nv('AntebracoD'), nv('MaoD'), om.clone().add(V(0, 0.42, 0)).addScaledVector(dirV, 0.32 + Math.sin(t * 9) * 0.12).addScaledVector(frV, 0.12), dirV.clone().addScaledVector(CIMA, -0.6));
    } else if (f.gesto === 'cabeca') {
      nv('Cabeca').rotation.x += Math.sin(c.ti * 7) * 0.18 * (1 - k);
      nv('Cabeca').rotation.z += 0.12;
    } else if (f.gesto === 'pegar') {
      const cx = this.caixas308[1];                                       // a caixa da prateleira de baixo
      const pCaixa = cx.getWorldPosition(V());
      if (k > 0.2 && k < 0.45) ik2(nv('BracoD'), nv('AntebracoD'), nv('MaoD'), pCaixa, dirV.clone().addScaledVector(CIMA, -1));
      if (k >= 0.38 && !this.caixaEntrega.visible) { this.caixaEntrega.visible = true; }
      if (this.caixaEntrega.visible) {
        const mao = nv('MaoD').getWorldPosition(V());
        if (k < 0.75) this.caixaEntrega.position.copy(this.grupo.worldToLocal(mao.clone().add(V(0, 0.08, 0))));
        else this.caixaEntrega.position.lerp(V(0.1, 1.18, -2.2), Math.min(1, dt * 6));
        if (k > 0.5 && k < 0.8) ik2(nv('BracoD'), nv('AntebracoD'), nv('MaoD'), G(0.1, 1.15, -2.3), dirV.clone().addScaledVector(CIMA, -1));
      }
    } else if (f.gesto === 'entregar') {
      this.caixaEntrega.position.lerp(V(0.2, 1.2, -1.7), Math.min(1, dt * 4));
    } else if (f.gesto === 'apontar' && k < 0.8) {
      const om = nv('BracoD').getWorldPosition(V());
      ik2(nv('BracoD'), nv('AntebracoD'), nv('MaoD'), om.clone().addScaledVector(frV, 0.55).add(V(0, 0.05, 0)).addScaledVector(dirV, 0.1), dirV.clone().addScaledVector(CIMA, -1));
    }
    // jogador: cabeça e mãos acompanham a fala
    if (pj) {
      pj.atualizar?.(dt);
      const nj = ossoJ;
      if (pj.rosto) pj.rosto({ boca: falandoJ ? Math.abs(Math.sin(t * 14)) * 0.5 : 0 });
      if (nj('Cabeca') && falandoJ) nj('Cabeca').rotation.x += Math.sin(c.ti * 5) * 0.08;
      if (f.gesto === 'entregar' && nj('MaoD')) {
        pj.obj.updateWorldMatrix(true, true);
        const frJ = V(Math.sin(pj.obj.rotation.y), 0, Math.cos(pj.obj.rotation.y)), dJ = V().crossVectors(frJ, CIMA).normalize();
        ik2(nj('BracoD'), nj('AntebracoD'), nj('MaoD'), this.grupo.localToWorld(this.caixaEntrega.position.clone()).add(V(0, -0.05, 0)), dJ.clone().addScaledVector(CIMA, -1));
        if (k > 0.6) this.caixaEntrega.visible = false;
      }
      if (falandoJ && f.gesto === 'falar' && nj('MaoE')) {
        pj.obj.updateWorldMatrix(true, true);
        const om = nj('BracoE').getWorldPosition(V()), frJ = V(Math.sin(pj.obj.rotation.y), 0, Math.cos(pj.obj.rotation.y)), dJ = V().crossVectors(frJ, CIMA).normalize();
        ik2(nj('BracoE'), nj('AntebracoE'), nj('MaoE'), om.clone().add(V(0, -0.22 + Math.sin(t * 4) * 0.04, 0)).addScaledVector(frJ, 0.35).addScaledVector(dJ, -0.05), dJ.clone().multiplyScalar(-1).addScaledVector(CIMA, -1));
      }
    }
    // balão: segue a cabeça de quem fala, com o texto aparecendo letra a letra
    if (this.elBalao) {
      const n = Math.min(this.txtAlvo.length, Math.floor(c.ti * 34));
      this.elTxt.textContent = this.txtAlvo.slice(0, n);
      const pt = (f.quem === 'v' ? cabV : cabJ).clone().add(V(0, 0.32, 0)).project(cam);
      const on = pt.z < 1 && Math.abs(pt.x) < 1.1 && Math.abs(pt.y) < 1.1;
      // quem fala fora do quadro: o balão fica embaixo, no centro (com a cauda apontando para o lado dele)
      const x = on ? (pt.x * 0.5 + 0.5) * innerWidth : innerWidth / 2, y = on ? (-pt.y * 0.5 + 0.5) * innerHeight : innerHeight - 40;
      this.elBalao.style.transform = `translate(${Math.max(130, Math.min(innerWidth - 130, x)).toFixed(0)}px, ${Math.max(70, Math.min(innerHeight - 40, y)).toFixed(0)}px) translate(-50%, -100%)`;
    }
    if (k >= 1) this._proxima();
    return { foco: { x: O.x, z: O.z } };
  }

  pularConversa() { if (this.cena) { this.cena.i = CONVERSA.length - 1; this.cena.ti = 0; this._fim(); } }

  _fim() {
    this.cena = null; this.elBaloes.innerHTML = ''; this.elBalao = null;
    document.body.classList.remove('em-cine');
    this.camera.fov = this.fovCena0 || 60; this.camera.updateProjectionMatrix();
    this.armas.comprar(5); this.compras++;
    this.caixaEntrega.visible = false;
    this.jogo.travar(false);
    this.jogo.toast('+5 balas de sniper · pentes da pistola e da metralhadora cheios');
  }
}
