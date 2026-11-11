// Cenas do Short (parte 2): comprimidos, escola de pré-voo, o teste na cama, a canoa e o fecho.
import * as THREE from 'three';
import { cam, mundos, scene } from './motor.js';
import { clamp, lerp, suave, suave5, inv, ruido } from './util.js';
import { S, V, PI, plano, camara, ambiente } from './base.js';
import * as PZ from './poses.js';
import { deitadoCanoa } from './lago.js';
import { F0, lerpV } from './cenas.js';

const MX = PZ.MESA.x, MZ = PZ.MESA.z;
// quadro de giz: coordenadas do canvas (832 x 480) -> mundo (quadro 2,6 x 1,5 m centrado em (0, 1,9, Z0))
const GZ = { z: -5.6 + 0.03 };
const lousaMundo = (px, py) => V((px / 832 - 0.5) * 2.6, 1.9 + (0.5 - py / 480) * 1.5, GZ.z);

// linhas do quadro (giz) com o instante em que começam a ser escritas (s, relativo ao início da sala, 28,2 s): o título e RELAXE antes do cadete; o 96% junto da fala do 96%
const QUADRO = [
  { t: 'PRÉ-VOO · MARINHA', x: 416, y: 62, tam: 30, ini: 0.0, dur: 0.8 },
  { t: 'RELAXE', x: 416, y: 168, tam: 70, ini: 1.3, dur: 0.9 },
  { t: '96%', x: 416, y: 300, tam: 120, ini: 7.6, dur: 0.8, cor: '#ffe9a8' },
  { t: 'EM 6 SEMANAS', x: 416, y: 364, tam: 38, ini: 8.4, dur: 0.7 },
  { t: '(SEGUNDO O TREINADOR)', x: 416, y: 410, tam: 24, ini: 9.1, dur: 0.6, cor: '#cfd6c8' },
];
function desenharQuadro(tl) {                                // tl: segundos desde o começo da escola
  const linhas = QUADRO.map(L => ({ ...L, al: 'center', a: clamp((tl - L.ini) / L.dur) })).filter(L => L.a > 0.01);
  S.sala.lousa.desenhar(linhas);
  // posição da mão do instrutor: a linha que está sendo escrita
  let ativa = null; for (const L of QUADRO) if (tl >= L.ini && tl < L.ini + L.dur + 0.5) ativa = L;
  return ativa;
}

function S0(qual) {
  S.sala.g.visible = qual === 'sala'; S.quarto.g.visible = qual === 'quarto'; S.lago.g.visible = qual === 'lago';
}
const tel = (t, inicio, fim) => clamp((t - inicio) / (fim - inicio));

export function montarCenas2() {
  const so = () => S.soldado;
  const pulso = t => S.fx.pulso(t);
  const props = () => ({ pilulas: S.pilulasMao, cantil: S.cantilProp });
  const MESA_LUZ = (t, k = 6) => { S.F.mesaLuz.intensity = k * (0.9 + 0.1 * ruido(t * 7, 3)); };
  const pulsoM = t => S.fx.pulso(t, MX, MZ, 60);

  // ================================================================ C) OS COMPRIMIDOS (18,0 a 28,2 s)
  // 10) macro na lata de comprimidos: a mão alcança, pega alguns e sobe
  plano('lata', 2.0, 'F', (u, t) => {
    PZ.mesaPose(so(), t, { fase: 'pegar', u: u / 2.0, props: props(), tremor: 0.6 });
    const k = suave(u / 2.0);
    camara({ pos: [MX + lerp(-0.02, -0.10, k), lerp(1.50, 1.38, k), MZ + lerp(0.60, 0.46, k)], alvo: [MX - 0.17, lerp(0.99, 1.05, k), MZ - 0.27], fov: lerp(30, 27, k), roll: lerp(-0.03, 0.02, k), tr: 0.5 + 1.2 * clamp(pulsoM(t), 0, 1), t, semente: 31 });
    F0(t, { h: 17.6, foco: [MX, MZ], fogo: 1 }); MESA_LUZ(t, 9);
    S.F.rostoLuz.distance = 5; S.F.rostoLuz.position.set(MX + 0.5, 1.5, MZ + 1.2); S.F.rostoLuz.intensity = 2.5;
  }, { efeito: () => ({ subs: 3, obturador: 0.4 }) });

  // 11) ele engole os comprimidos com um gole do cantil
  plano('engole', 2.2, 'F', (u, t) => {
    PZ.mesaPose(so(), t, { fase: 'engolir', u: u / 2.2, props: props(), tremor: 0.5 });
    const k = suave(u / 2.2);
    camara({ pos: [MX + lerp(-0.55, -0.35, k), lerp(1.55, 1.52, k), MZ + lerp(1.45, 1.20, k)], alvo: [MX - 0.03, 1.48, MZ - 0.62], fov: lerp(36, 30, k), roll: lerp(0.03, -0.01, k), tr: 0.6 + 1.2 * clamp(pulsoM(t), 0, 1), t, semente: 32 });
    F0(t, { h: 17.9, foco: [MX, MZ], fogo: 1 }); MESA_LUZ(t, 8);
    S.F.rostoLuz.distance = 5; S.F.rostoLuz.position.set(MX - 0.4, 1.7, MZ + 1.1); S.F.rostoLuz.intensity = 3.5;
  }, { efeito: () => ({ subs: 3, obturador: 0.4 }) });

  // 12) dias e noites sem dormir: o céu corre, o quadro marca os dias, ele continua de pé, trêmulo
  plano('dias', 3.6, 'F', (u, t) => {
    const h = 6 + 72 * (u / 3.6), dia = Math.min(3, 1 + Math.floor((h - 6) / 24));
    S.dias.desenhar([{ t: 'SEM DORMIR', x: 256, y: 62, tam: 46, cor: '#e8e6d8', al: 'center' }, { t: 'DIA ' + dia, x: 256, y: 178, tam: 104, cor: '#ffe9a8', al: 'center' }, { t: 'I'.repeat(dia) , x: 256, y: 238, tam: 56, cor: '#e8e6d8', al: 'center' }]);
    PZ.mesaPose(so(), t, { fase: 'alerta', tremor: 0.4 + 0.6 * u / 3.6 });
    const k = suave(u / 3.6);
    camara({ pos: [MX + lerp(-0.7, -0.15, k), lerp(1.42, 1.38, k), MZ + lerp(2.9, 2.35, k)], alvo: [MX + 0.15, 1.3, MZ - 0.7], fov: 40, roll: lerp(0.02, -0.02, k), tr: 0.5, t, semente: 33 });
    F0(t, { h, foco: [MX, MZ], fogo: 1 }); MESA_LUZ(t, 3 + 5 * clamp(1 - Math.abs(Math.sin((h - 6) / 24 * PI * 2)) , 0, 1));
    S.F.rostoLuz.intensity = 0;
  }, { efeito: () => ({ subs: 2, obturador: 0.5 }) });

  // 13) close nos olhos arregalados, com olheiras: a conta chega
  plano('olheiras', 2.4, 'F', (u, t) => {
    PZ.mesaPose(so(), t, { fase: 'alerta', tremor: 1.0 });
    so().olheiras && so().olheiras(clamp(u / 0.6, 0, 1));
    so().rosto({ expressao: 'neutro', forca: 0.0, olhar: [0.12 * Math.sin(t * 9.1), 0.07 * Math.sin(t * 6.3)], piscar: -0.34, boca: 0.0 }); so().atualizarRosto();
    const f = PZ.focoRosto(so(), { dist: lerp(0.85, 0.62, suave(u / 2.4)), lat: 0.03, alt: 0.01 });
    camara({ pos: f.pos, alvo: f.alvo, fov: 22, roll: 0.02, tr: 0.9, t, semente: 34 });
    F0(t, { h: 3.2, foco: [MX, MZ], fogo: 1 }); MESA_LUZ(t, 6);
    S.F.rostoLuz.distance = 4; S.F.rostoLuz.position.set(f.pos[0] + 0.25, f.pos[1] + 0.15, f.pos[2] + 0.05); S.F.rostoLuz.intensity = 1.6 + 5 * clamp(pulsoM(t), 0, 1.2);
  }, { efeito: (u, t) => ({ subs: 3, obturador: 0.4, flash: clamp(pulsoM(t) * 0.08, 0, 0.3), flashCor: '255,170,90' }) });

  // ================================================================ D) A ESCOLA DE PRÉ-VOO (28,2 a 38,0 s)
  const T_ESC = 28.2;
  const cadetes = () => S.cadetes, car = () => S.sala.carteiras;
  const sala = (t, { r = [0, 0, 0] } = {}) => {
    S0('sala'); ambiente('sala');
    const tl = t - T_ESC, ativa = desenharQuadro(tl);
    PZ.sentarCarteira(cadetes()[0], car()[0 * 3 + 0], t, { r: r[0], lado: 1 });
    PZ.sentarCarteira(cadetes()[1], car()[0 * 3 + 2], t, { r: r[1], lado: -1 });
    PZ.sentarCarteira(cadetes()[2], car()[1 * 3 + 1], t, { r: r[2], lado: 1 });
    const alvoMao = ativa ? lousaMundo(ativa.x + (ativa.t.length * ativa.tam * 0.30) * clamp((tl - ativa.ini) / ativa.dur, 0, 1) - ativa.t.length * ativa.tam * 0.30, ativa.y - ativa.tam * 0.35) : lousaMundo(520, 300);
    PZ.instrutorPose(S.instrutor, t, S.giz, { x: -0.62, z: -5.14, mao: alvoMao, escrevendo: ativa ? 1 : 0.2 });
    S.sala.relogio(2, 0);
  };
  // 14) a sala de aula de 1942: o instrutor escreve no quadro, os cadetes tensos nas carteiras
  plano('sala', 2.6, 'S', (u, t) => {
    sala(t);
    const k = suave(u / 2.6);
    camara({ pos: [lerp(0.5, 0.15, k), lerp(1.65, 1.5, k), lerp(3.3, 1.6, k)], alvo: [lerp(-0.1, -0.2, k), 1.85, -5.5], fov: lerp(56, 46, k), roll: lerp(0.02, -0.01, k), tr: 0.5, t, semente: 35 });
  }, { efeito: () => ({ subs: 2, obturador: 0.35 }) });

  // 15) o cadete na carteira: ombros caem, a cabeça pesa, os olhos fecham (o método funcionando)
  plano('cadete', 3.6, 'S', (u, t) => {
    const r = suave(inv(0.2, 3.0, u));
    sala(t, { r: [r, 0.15, 0.1] });
    const c = car()[0], f = V(c.x, 1.10, c.cz);
    const k = suave(u / 3.6);
    camara({ pos: [lerp(-0.55, -0.30, k), lerp(1.30, 1.20, k), lerp(-4.3, -3.9, k)], alvo: [c.x - 0.02, 1.12, c.cz - 0.02], fov: lerp(32, 26, k), roll: lerp(0.03, -0.01, k), tr: 0.35, t, semente: 37 });
  }, { efeito: () => ({ subs: 2, obturador: 0.35 }) });

  // 16) o quadro de giz: RELAXE, 96% em 6 semanas (segundo o treinador), dormir em 2 min
  plano('quadro', 3.6, 'S', (u, t) => {
    sala(t);
    const k = suave(u / 3.6);
    camara({ pos: [lerp(-0.05, 0.1, k), lerp(1.95, 1.9, k), lerp(-1.7, -2.1, k)], alvo: [0.0, 1.85, -5.55], fov: 33, roll: lerp(-0.02, 0.015, k), tr: 0.4, t, semente: 36 });
  }, { efeito: () => ({ subs: 2, obturador: 0.35 }) });

  // ================================================================ E) O TESTE NA CAMA (38,0 a 53,2 s)
  const T_CAMA = 38.0, T_FIM_CAMA = 51.4 + 1.8;
  const fillQ = (pos, inten, cor = 0xffc690) => { S.quarto.fill.position.set(pos[0], pos[1], pos[2]); S.quarto.fill.intensity = inten; S.quarto.fill.color.set(cor); S.quarto.fill.distance = 4; };
  const cama = (t, k) => {
    S0('quarto'); ambiente('quarto');
    PZ.deitadoCama(S.pessoa, t, k);
    S.quarto.cron.userData.mostrar(clamp((t - T_CAMA) / (T_FIM_CAMA - T_CAMA), 0, 1) * 108);          // cronômetro em "câmera acelerada": 0:00 a 1:48
    S.quarto.abajur.intensity = 3.2 * (0.95 + 0.05 * ruido(t * 3, 2));
    S.quarto.fill.intensity = 0;
  };
  // 17) o quarto à noite: a pessoa deitada, tensa, e o cronômetro começa a correr
  plano('cama', 2.4, 'S', (u, t) => {
    cama(t, { rosto: 0, ombros: 0, peito: 0, pernas: 0, mente: 0 });
    const k = suave(u / 2.4);
    camara({ pos: [lerp(101.9, 101.35, k), lerp(2.2, 1.7, k), lerp(0.8, 0.35, k)], alvo: [100.15, 0.62, lerp(-1.3, -1.45, k)], fov: lerp(52, 46, k), roll: lerp(0.03, -0.02, k), tr: 0.4, t, semente: 41 });
    fillQ([101.0, 1.7, 0.4], 2.4);
  }, { efeito: () => ({ subs: 2, obturador: 0.35 }) });

  // 18) 1: o rosto — testa, olhos, mandíbula e língua soltam
  plano('rosto', 2.6, 'S', (u, t) => {
    const r = suave(inv(0.15, 2.2, u));
    cama(t, { rosto: r, ombros: 0, peito: 0, pernas: 0, mente: 0 });
    const f = PZ.focoRosto(S.pessoa, { dist: lerp(0.78, 0.60, suave(u / 2.6)), lat: 0.0, alt: lerp(-0.10, -0.04, u / 2.6) });
    camara({ pos: f.pos, alvo: f.alvo, fov: 28, roll: lerp(-0.05, 0.02, u / 2.6), tr: 0.35, t, semente: 42 });
    fillQ([f.pos[0] - 0.45, f.pos[1] - 0.05, f.pos[2] + 0.10], 4.2, 0xb7c8ff);
  }, { efeito: () => ({ subs: 2, obturador: 0.35 }) });

  // 19) 2 e 3: ombros afundam no colchão, expira e solta o peito
  plano('tronco', 2.4, 'S', (u, t) => {
    const r = suave(inv(0.1, 1.9, u));
    cama(t, { rosto: 1, ombros: r, peito: r, pernas: 0, mente: 0.2 });
    const k = suave(u / 2.4);
    camara({ pos: [lerp(101.25, 101.05, k), lerp(1.50, 1.38, k), lerp(-1.25, -1.45, k)], alvo: [100.2, 0.74, lerp(-2.15, -2.20, k)], fov: lerp(46, 40, k), roll: lerp(0.03, -0.02, k), tr: 0.35, t, semente: 43 });
    fillQ([101.1, 1.7, -0.6], 3.2);
  }, { efeito: () => ({ subs: 2, obturador: 0.35 }) });

  // 20) 4: as pernas ficam pesadas, os pés abrem para fora
  plano('pernas', 2.2, 'S', (u, t) => {
    const r = suave(inv(0.1, 1.8, u));
    cama(t, { rosto: 1, ombros: 1, peito: 1, pernas: r, mente: 0.5 });
    const k = suave(u / 2.2);
    camara({ pos: [lerp(100.55, 100.30, k), lerp(1.12, 0.92, k), lerp(0.75, 0.40, k)], alvo: [100.2, 0.66, -0.95], fov: lerp(44, 38, k), roll: lerp(-0.03, 0.02, k), tr: 0.35, t, semente: 44 });
    fillQ([101.0, 1.5, 0.5], 3.0);
  }, { efeito: () => ({ subs: 2, obturador: 0.35 }) });

  // 21) 5: dez segundos de mente vazia — uma canoa num lago calmo, sob a lua
  plano('canoa', 3.8, 'S', (u, t) => {
    S0('lago'); ambiente('lago');
    S.lago.atualizar(t);
    deitadoCanoa(S.pessoa, S.lago, t);
    const k = suave(u / 3.8), ox = S.lago.ox;
    camara({ pos: [ox + lerp(0.9, -0.5, k), lerp(0.85, 1.45, k), lerp(4.2, 3.2, k)], alvo: [ox + lerp(0.0, 0.2, k), lerp(0.55, 3.2, k), lerp(-1.0, -40, k)], fov: lerp(52, 56, k), roll: lerp(0.03, -0.015, k), tr: 0.25, t, semente: 45 });
    S.lago.fill.position.set(ox + 1.0, 1.3, 1.9); S.lago.fill.intensity = 2.2;
  }, { efeito: (u) => ({ subs: 3, obturador: 0.35, flash: u < 0.35 ? 0.9 * (1 - u / 0.35) : 0, flashCor: '170,200,255' }) });

  // 22) o cronômetro marca 1:48 e a pessoa já dormiu
  plano('cronometro', 1.8, 'S', (u, t) => {
    cama(t, { rosto: 1, ombros: 1, peito: 1, pernas: 1, mente: 1 });
    const k = suave(u / 1.8);
    camara({ pos: [lerp(101.05, 100.92, k), lerp(0.74, 0.72, k), lerp(-1.45, -1.58, k)], alvo: [101.15, 0.60, -2.10], fov: lerp(30, 24, k), roll: lerp(0.02, -0.02, k), tr: 0.25, t, semente: 46 });
    fillQ([100.9, 1.2, -1.2], 2.2);
  }, { efeito: () => ({ subs: 2, obturador: 0.35 }) });

  // ================================================================ F) O FECHO (53,2 a 57,8 s)
  const guarita = (t) => {
    PZ.dormirSentado(so(), t, {});
    S.F.rostoLuz.distance = 5; S.F.rostoLuz.position.set(0.55, 1.55, 0.25); S.F.rostoLuz.intensity = 1.0 + 7.0 * clamp(pulso(t), 0, 2.2);
  };
  // 23) de volta à guarita: a câmera se aproxima do rosto dele até o mesmo close do começo
  plano('volta', 2.8, 'F', (u, t) => {
    guarita(t);
    const k = suave5(u / 2.8), f = PZ.focoRosto(so(), { dist: 0.46, lat: 0.045 - 0.05, alt: 0.02 });
    camara({ pos: lerpV([1.1, 1.5, 3.3], f.pos, k), alvo: lerpV([0.0, 1.1, -1.1], f.alvo, k), fov: lerp(44, 22.9, k), roll: lerp(0.0, -0.04, k), tr: 0.7 + 2.0 * clamp(pulso(t), 0, 1.2), t, semente: 51 });
    F0(t, { h: 1.0 });
  }, { efeito: (u, t) => ({ subs: 3, obturador: 0.4, flash: clamp(pulso(t) * 0.10, 0, 0.35), flashCor: '255,170,90' }) });

  // 24) o mesmo close dos olhos fechados; a marca e o convite aparecem; fade
  plano('fim', 1.8, 'F', (u, t) => {
    guarita(t);
    const f = PZ.focoRosto(so(), { dist: 0.46 + 0.05 * suave(u / 1.8), lat: -0.005, alt: 0.02 });
    camara({ pos: f.pos, alvo: f.alvo, fov: 22.9, roll: -0.04, tr: 0.5 + 1.4 * clamp(pulso(t), 0, 1.2), t, semente: 52 });
    F0(t, { h: 1.0 });
  }, { efeito: (u, t) => ({ subs: 2, obturador: 0.35, flash: clamp(pulso(t) * 0.14, 0, 0.5), flashCor: '255,170,90', tintas: cartaoFinal(u / 1.8) }) });
}

// cartão final: marca "Hryz Animation" (diegética, sem espelhar) e o convite, em letras de estêncil sobre o escuro
function cartaoFinal(u) {
  const a = clamp(inv(0.18, 0.55, u));
  return (g, w, h) => {
    if (a <= 0.01) return;
    g.save(); g.globalAlpha = a; g.textAlign = 'center';
    const gr = g.createLinearGradient(0, h * 0.60, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.65)'); g.fillStyle = gr; g.fillRect(0, h * 0.60, w, h * 0.40);
    g.fillStyle = '#e9e4cf'; g.font = `bold ${w * 0.090}px "DejaVu Sans", sans-serif`; g.fillText('HRYZ ANIMATION', w / 2, h * 0.865);
    g.fillStyle = '#e0b04a'; g.font = `bold ${w * 0.058}px "DejaVu Sans", sans-serif`; g.fillText('SE INSCREVE', w / 2, h * 0.925);
    g.restore();
  };
}
