// Abertura do Hryz City: um passeio de câmera pelos lugares da cidade antes da sala de escolha.
// Cada local tem 3 planos (geral → médio → detalhe, ou o inverso) com corte seco entre os planos e
// passagem pelo preto entre um local e outro. O nome do local aparece no canto, para o jogador
// saber para onde ir depois. Pula com o botão, Enter, Espaço, Esc ou um toque.
import * as THREE from 'three';

const suave = t => t * t * (3 - 2 * t);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/**
 * Plano: { dur, de: [pos, alvo], para: [pos, alvo], fov?, ease? ('suave' | 'linear'), dinamico?(estado) }
 * pos/alvo em metros do mundo (x leste, z sul). `dinamico` recalcula de/para no início do plano (T. rex).
 */
export const ROTEIRO = [
  {
    id: 'titulo', nome: 'HRYZ CITY', titulo: true,
    planos: [
      // abre no alto da praça central e desce devagar sobre a cidade
      { dur: 4.2, de: [V(216, 66, 112), V(206, 0, 182)], para: [V(214, 46, 124), V(206, 2, 180)], fov: 50 },
    ],
  },
  {
    id: 'entrada', nome: 'Entrada de Hryz City', dica: 'Pela rodovia, a oeste da cidade',
    planos: [
      // 1. rente ao asfalto, carros passando, em direção à cidade
      { dur: 2.6, de: [V(15.5, 1.3, -96), V(12, 1.5, 20)], para: [V(15.5, 1.3, -70), V(12, 1.5, 40)], fov: 46, ease: 'linear' },
      // 2. a placa de boas-vindas
      { dur: 2.4, de: [V(10, 2.2, -45), V(-5.6, 3.2, -24)], para: [V(7, 2.6, -40), V(-5.6, 3.4, -24)], fov: 38 },
      // 3. geral: a rodovia cortando a cidade
      { dur: 2.6, de: [V(-30, 30, -40), V(30, 0, 40)], para: [V(-24, 36, -10), V(40, 0, 70)], fov: 50 },
    ],
  },
  {
    id: 'delegacia', nome: 'Delegacia', dica: 'Viaturas, hospital e o centro',
    planos: [
      { dur: 2.6, de: [V(182, 26, 206), V(140, 4, 158)], para: [V(172, 20, 200), V(140, 4, 160)], fov: 48 },
      // viatura com o giroflex ligado, câmera baixa
      { dur: 2.4, de: [V(153.5, 0.7, 171.5), V(146, 1.0, 166.2)], para: [V(151.5, 0.8, 172.5), V(146, 1.1, 166.2)], fov: 40, sirene: true },
      { dur: 2.4, de: [V(133, 1.8, 173), V(138, 6, 156)], para: [V(137, 2.6, 170), V(138, 6.5, 156)], fov: 46, sirene: true },
    ],
  },
  {
    id: 'praca', nome: 'Praça Central', dica: 'Cinema, lojas e o táxi da praça',
    planos: [
      { dur: 2.6, de: [V(216, 3, 132), V(216, 1, 176)], para: [V(216, 26, 128), V(216, 0, 172)], fov: 50 },
      { dur: 2.4, de: [V(156, 1.8, 166), V(144, 6, 186)], para: [V(134, 2.2, 166), V(144, 6, 186)], fov: 44, ease: 'linear' },
      { dur: 2.4, de: [V(206, 0.7, 173.5), V(218, 1, 169.8)], para: [V(209, 0.8, 174), V(218, 1, 169.8)], fov: 40 },
    ],
  },
  {
    id: 'aeroporto', nome: 'Aeroporto', dica: 'Ao sul: jatos, hangar e a pista',
    planos: [
      { dur: 2.8, de: [V(140, 7, 540), V(180, 6, 498)], para: [V(220, 9, 540), V(180, 6, 498)], fov: 50, ease: 'linear' },
      { dur: 2.4, de: [V(298, 1.4, 541), V(330, 5, 519)], para: [V(305, 1.8, 537), V(330, 5.5, 519)], fov: 44 },
      { dur: 2.4, de: [V(92, 2, 474), V(60, 22, 441)], para: [V(88, 12, 470), V(60, 26, 441)], fov: 46 },
    ],
  },
  {
    id: 'estadio', nome: 'Estádio Hryz', dica: 'A leste, perto do parque',
    planos: [
      { dur: 2.8, de: [V(430, 42, 150), V(486, 4, 84)], para: [V(530, 42, 150), V(486, 4, 84)], fov: 50, ease: 'linear' },
      { dur: 2.4, de: [V(486, 1.7, 178), V(486, 12, 84)], para: [V(486, 1.7, 164), V(486, 14, 84)], fov: 48 },
      { dur: 2.4, de: [V(470, 46, 58), V(486, 0, 86)], para: [V(502, 46, 64), V(486, 0, 86)], fov: 50 },
    ],
  },
  {
    id: 'selva', nome: 'Selva Jurássica', dica: 'Cuidado: o T. rex mora aqui',
    planos: [
      // estrada de terra até o portal
      { dur: 2.6, de: [V(404, 1.8, 244), V(438, 5, 274)], para: [V(416, 2.2, 254), V(440, 5.5, 276)], fov: 44, ease: 'linear' },
      // por cima das árvores até a clareira
      { dur: 2.6, de: [V(444, 22, 238), V(520, 0, 280)], para: [V(476, 26, 244), V(520, 0, 280)], fov: 48 },
      // o T. rex ruge para a câmera e vem na nossa direção
      { dur: 3.2, fov: 42, trex: true, dinamico: ({ trex }) => {
        if (!trex) return { de: [V(500, 4, 300), V(520, 3, 280)], para: [V(504, 3.5, 296), V(520, 3, 280)] };
        const f = V(Math.cos(trex.rumo), 0, Math.sin(trex.rumo));
        const cab = V(trex.x, 4.2, trex.z).addScaledVector(f, 2.5);
        const lado = V(-f.z, 0, f.x);
        const c0 = cab.clone().addScaledVector(f, 11.5).addScaledVector(lado, 0.8).setY(1.6);
        return { de: [c0, cab], para: [c0.clone().addScaledVector(f, 3.5).setY(1.3), cab.clone().addScaledVector(f, 5).setY(4.8)] };   // a câmera recua enquanto ele avança
      } },
    ],
  },
];

const FADE = 0.38;   // passagem pelo preto entre locais (s)

export class Abertura {
  /**
   * camera: PerspectiveCamera do jogo; ganchos: { aoTerminar(), aoPlano(local, plano), estado() → { trex } }
   */
  constructor(camera, ganchos) {
    this.camera = camera; this.g = ganchos;
    this.el = document.getElementById('abertura');
    this.elPreto = document.getElementById('ab-preto');
    this.elTitulo = document.getElementById('ab-titulo');
    this.elLocal = document.getElementById('ab-local');
    this.elNum = document.getElementById('ab-num');
    this.elNome = document.getElementById('ab-nome');
    this.elDica = document.getElementById('ab-dica');
    this.elBarra = document.getElementById('ab-barra');
    // linha do tempo achatada
    this.linha = []; let t = 0;
    ROTEIRO.forEach((loc, li) => loc.planos.forEach((pl, pi) => {
      this.linha.push({ loc, li, pl, pi, t0: t, t1: t + pl.dur, primeiro: pi === 0, ultimo: pi === loc.planos.length - 1 });
      t += pl.dur;
    }));
    this.total = t;
    this.ativa = false;
    this.foco = { x: 216, z: 166 };
    this._pular = () => this.pular();
    this._tecla = e => { if (this.ativa && ['Enter', 'Space', 'Escape', 'NumpadEnter'].includes(e.code)) { e.preventDefault(); e.stopImmediatePropagation(); this.pular(); } };
    document.getElementById('ab-pular').addEventListener('click', this._pular);
    this.el.addEventListener('dblclick', this._pular);
  }

  get duracao() { return this.total; }

  iniciar() {
    this.t = 0; this.idx = -1; this.ativa = true; this.fov0 = this.camera.fov;
    this.el.classList.remove('oculto');
    document.body.classList.add('em-cine');
    addEventListener('keydown', this._tecla, true);
  }

  pular() { if (this.ativa) this._fim(); }

  /** salta a linha do tempo (para testes) */
  irPara(t) { this.t = Math.max(0, Math.min(this.total - 0.01, t)); this.idx = -1; }

  _fim() {
    this.ativa = false;
    removeEventListener('keydown', this._tecla, true);
    this.el.classList.add('oculto');
    this.camera.fov = this.fov0; this.camera.updateProjectionMatrix();
    this.g.aoTerminar?.();
  }

  atualizar(dt) {
    if (!this.ativa) return null;
    this.t += dt;
    if (this.t >= this.total) { this._fim(); return null; }
    let i = this.linha.findIndex(s => this.t < s.t1);
    const s = this.linha[i];
    if (i !== this.idx) {
      this.idx = i;
      if (s.pl.dinamico) Object.assign(s, s.pl.dinamico(this.g.estado?.() || {})); else { s.de = s.pl.de; s.para = s.pl.para; }
      this.g.aoPlano?.(s.loc, s.pl);
      // rótulos
      const titulo = !!s.loc.titulo;
      this.elTitulo.classList.toggle('visivel', titulo);
      this.elLocal.classList.toggle('visivel', !titulo);
      if (!titulo) {
        const n = ROTEIRO.filter(l => !l.titulo).indexOf(s.loc) + 1;
        this.elNum.textContent = String(n).padStart(2, '0');
        this.elNome.textContent = s.loc.nome;
        this.elDica.textContent = s.loc.dica || '';
      }
    }
    const k = (this.t - s.t0) / s.pl.dur;
    const e = s.pl.ease === 'linear' ? k : suave(k);
    const pos = s.de[0].clone().lerp(s.para[0], e), alvo = s.de[1].clone().lerp(s.para[1], e);
    this.camera.position.copy(pos);
    this.camera.lookAt(alvo);
    if (s.pl.fov && this.camera.fov !== s.pl.fov) { this.camera.fov = s.pl.fov; this.camera.updateProjectionMatrix(); }
    // preto entre locais (e no começo / fim)
    const locT0 = s.primeiro ? s.t0 : null, locT1 = s.ultimo ? s.t1 : null;
    let preto = 0;
    if (locT0 !== null) preto = Math.max(preto, 1 - (this.t - locT0) / FADE);
    if (locT1 !== null) preto = Math.max(preto, 1 - (locT1 - this.t) / FADE);
    this.elPreto.style.opacity = Math.max(0, Math.min(1, preto)).toFixed(3);
    this.elBarra.style.transform = `scaleX(${(this.t / this.total).toFixed(4)})`;
    this.foco.x = alvo.x * 0.6 + pos.x * 0.4; this.foco.z = alvo.z * 0.6 + pos.z * 0.4;
    return { pos, alvo, foco: this.foco, plano: s.pl, local: s.loc };
  }
}
