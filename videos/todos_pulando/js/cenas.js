// Cenas: pergunta, as duas suposições (planeta empurrado / amassado), alerta no celular, multidão, meio-dia, pulo, o que realmente acontece, átomo e fecho.
import * as THREE from 'three';
import { clamp, lerp, suave, suave5, inv } from './util.js';
import { S, V, PI, plano, camara, lerpV } from './base.js';
import { OFF } from './mundo.js';

const EX = OFF.espaco[0], AX = OFF.atomo[0], CX = OFF.celular[0];
const CZ = 12;
S.VONC = 28;
function selo(txt, cor = '#ffd84a') {
  return (g, w, h) => { g.save(); g.textAlign = 'center'; g.font = `bold ${w * 0.062}px "DejaVu Sans", sans-serif`; const tw = g.measureText(txt).width + w * 0.08, x = w / 2 - tw / 2, y = h * 0.075, a = w * 0.095;
    g.fillStyle = 'rgba(0,0,0,0.62)'; g.beginPath(); g.roundRect(x, y, tw, a, a / 2); g.fill(); g.strokeStyle = cor; g.lineWidth = 4; g.stroke(); g.fillStyle = cor; g.fillText(txt, w / 2, y + a * 0.72); g.restore(); };
}
function legenda(txt, a = 1) { return (g, w, h) => { g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.font = `bold ${w * 0.04}px "DejaVu Sans", sans-serif`; g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, h * 0.80, w, w * 0.12); g.fillStyle = '#fff'; g.fillText(txt, w / 2, h * 0.80 + w * 0.08); g.restore(); }; }
function cartao(u) { const a = clamp(inv(0.4, 0.8, u)); return (g, w, h) => { if (a < 0.01) return; g.save(); g.globalAlpha = a; g.textAlign = 'center'; const gr = g.createLinearGradient(0, h * 0.62, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.7)'); g.fillStyle = gr; g.fillRect(0, h * 0.62, w, h * 0.38); g.fillStyle = '#e9e4cf'; g.font = `bold ${w * 0.09}px "DejaVu Sans", sans-serif`; g.fillText('HRYZ ANIMATION', w / 2, h * 0.865); g.fillStyle = '#e0b04a'; g.font = `bold ${w * 0.058}px "DejaVu Sans", sans-serif`; g.fillText('SE INSCREVE', w / 2, h * 0.925); g.restore(); }; }

export function montarPlanos() {
  const m = () => S.m;
  const espaco = (t, spin = 0.05) => { m().mostrar('espaco'); m().terra.visible = true; m().globo.rotation.y = t * spin; m().rachaduras.visible = false; m().terra.position.set(0, 0, 0); m().terra.scale.set(1, 1, 1); m().terra.rotation.set(0, 0, 0.1); m().atm.visible = true; m().pessoaEspaco.visible = true; m().orbita.visible = true; };
  const pessoa = t => { const p = m().pessoaEspaco; p.position.set(EX + 1.4, 0.4 + 0.12 * Math.sin(t * 1.6), 14); p.rotation.set(0.3 * Math.sin(t * 0.9), t * 0.5, 0.2); p.scale.setScalar(9); };

  // 0) gancho: a multidão pulando, câmera sobe atrás do herói; as ondas nascem no pouso
  plano('abertura', 3.5, 'cidade', (u, t) => {
    m().mostrar('cidade'); const h = m().heroi; h.grupo.visible = true; const tp = u - 0.5; m().multidao(1, tp); m().ondas(u - 1.2);
    const d = h.duracao('Pular'); h.colocar(0, 0, CZ, 0); h.anim('Pular', clamp(tp / 1.2, 0, 1) * d * 0.98, { laco: false });
    const k = suave(u / 3.5), pouso = u - 1.2;
    camara({ pos: [lerp(-1.2, 0, k), lerp(1.4, 14, k), lerp(6.5, -8, k)], alvo: [0, lerp(3.2, 2, k), lerp(30, 42, k)], fov: lerp(50, 56, k), t, tr: pouso > 0 && pouso < 0.6 ? 2.0 * Math.exp(-pouso * 4) : 0.2 });
  }, { efeito: (u) => ({ subs: 3, obturador: 0.4, flash: u > 1.2 && u < 1.4 ? 0.45 * (1 - (u - 1.2) / 0.2) : 0 }) });

  // 1) a pergunta: push-in na Terra com a pessoa no ar em primeiro plano
  plano('terra', 2.8, 'espaco', (u, t) => {
    espaco(t); pessoa(t);
    const k = suave(u / 2.8);
    camara({ pos: [EX + lerp(-2.0, -0.6, k), lerp(2.2, 1.0, k), lerp(30, 21, k)], alvo: [EX + 0.2, 0.2, 0], fov: 38, roll: lerp(0.05, 0, k), t });
  }, { efeito: () => ({ subs: 2 }) });

  // 2) suposição 1: o planeta sai do lugar (empurrado para fora da órbita)
  plano('empurrada', 2.6, 'espaco', (u, t) => {
    espaco(t, 0.35); m().pessoaEspaco.visible = false;
    const k = u / 2.6, p = k * k * 1.0; m().terra.position.set(p * 30, p * 3, -p * 52); m().globo.rotation.y = t * 0.9;
    const ang = lerp(-0.7, 0.9, suave(k));
    camara({ pos: [EX + Math.sin(ang) * 26 + 6, 7, Math.cos(ang) * 26 + 6], alvo: [EX + p * 30 * 0.7, p * 2, -p * 52 * 0.7], fov: 40, t });
  }, { efeito: () => ({ subs: 3, obturador: 0.4, tintas: selo('SUPOSIÇÃO 1') }) });

  // 3) suposição 2: o planeta fica amassado
  plano('amassada', 2.6, 'espaco', (u, t) => {
    espaco(t, 0.1); m().pessoaEspaco.visible = false; m().orbita.visible = false;
    const k = suave(u / 1.3), w = Math.sin(u * 14) * 0.03 * Math.exp(-u * 1.2);
    m().terra.scale.set(lerp(1, 1.25, k) + w, lerp(1, 0.52, k) - w, lerp(1, 1.25, k) + w); m().rachaduras.visible = u > 0.5; m().rachaduras.material.opacity = clamp((u - 0.5) * 2);
    const ang = lerp(0.9, -0.5, suave(u / 3));
    camara({ pos: [EX + Math.sin(ang) * 17, lerp(1, 6, u / 3), Math.cos(ang) * 17], alvo: [EX, 0, 0], fov: 40, t });
  }, { efeito: () => ({ subs: 3, tintas: selo('SUPOSIÇÃO 2') }) });

  // 3b) reinicia: a cena volta no tempo (rebobinar) até o motivo
  plano('reinicia', 2.0, 'cidade', (u, t) => {
    m().mostrar('cidade'); m().heroi.grupo.visible = false; m().ondas(-1); m().multidao(1 - suave(u / 1.8), -1);
    const k = suave5(u / 2.0);
    camara({ pos: lerpV([0, 80, 150], [0.5, 1.7, 7], k), alvo: lerpV([0, 0, 28], [0, 1.5, 2], k), fov: lerp(55, 45, k), t, tr: 0.6 });
  }, { efeito: (u) => ({ subs: 3, obturador: 0.7, flash: u < 0.15 ? 0.7 : 0, tintas: (g, w, h) => { g.save(); g.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 2); g.globalAlpha = 1; g.textAlign = 'center'; g.font = `bold ${w * 0.075}px "DejaVu Sans", sans-serif`; g.fillStyle = '#fff'; g.fillText('⟲ VOLTANDO', w / 2, h * 0.70); g.font = `bold ${w * 0.045}px "DejaVu Sans", sans-serif`; g.fillStyle = '#ffd84a'; g.fillText('POR QUE TODO MUNDO PULOU?', w / 2, h * 0.75); g.restore(); } }) });

  // 4) alerta no celular
  plano('alerta', 4.0, 'celular', (u, t) => {
    m().mostrar('celular'); S.m.telaCel(t, inv(0.5, 2.8, u));
    const vib = Math.max(0, Math.sin(t * 5.2)) ** 6; m().cel.rotation.set(0.04 * Math.sin(t * 1.1), 0.22 * Math.sin(t * 0.6), 0.012 * Math.sin(t * 41) * vib); m().cel.position.set(0.005 * Math.sin(t * 47) * vib, 0.004 * Math.sin(t * 43) * vib, 0);
    const k = suave5(u / 4.0);
    camara({ pos: [CX + lerp(-0.3, 0.0, k), lerp(0.55, 0, k), lerp(1.9, 3.3, k)], alvo: [CX, lerp(0.35, 0, k), 0], fov: 36, t, tr: 0.08 });
  }, { efeito: (u) => ({ subs: 2, tintas: selo('E SE…') }) });

  // 5) todo mundo sai de casa e se prepara: da porta até a multidão cobrindo a praça
  plano('saem', 4.5, 'cidade', (u, t) => {
    m().mostrar('cidade'); m().heroi.grupo.visible = false;
    const cheia = suave(u / 4.1); m().multidao(cheia, -1);
    m().saindo.forEach((a, i) => { a.grupo.visible = true; const z = clamp((u - i * 0.45) * 3.2, 0, 40) + 0.6; a.colocar(-1.2 + i * 1.2, 0, z, 0); a.anim('Correr', (u - i * 0.45) * 1.4); a.rosto({ expressao: 'medo', forca: 0.4 }); a.atualizarRosto(); });
    const k = suave5(u / 4.5);
    camara({ pos: lerpV([0.5, 1.7, 7], [0, 80, 150], k), alvo: lerpV([0, 1.5, 2], [0, 0, 28], k), fov: lerp(45, 55, k), t });
    m().relogio.visible = true;
  }, { efeito: () => ({ subs: 3, tintas: selo('E SE…') }) });

  // 6) chega meio-dia: relógio gigante 11:59 -> 12:00
  plano('meiodia', 3.5, 'cidade', (u, t) => {
    m().mostrar('cidade'); m().heroi.grupo.visible = false; m().multidao(1, -1);
    const dep = u > 2.7; m().horaRelogio(dep ? '12:00' : (Math.floor(u * 2) % 2 ? '11:59' : '11 59'), dep ? 1.0 : 0.4);
    const k = suave(u / 3.5);
    camara({ pos: [lerp(-8, 0, k), lerp(10, 14, k), lerp(14, 8, k)], alvo: [0, 14, -42], fov: lerp(46, 38, k), t });
  }, { efeito: (u) => ({ subs: 2, flash: u > 2.7 && u < 3.0 ? 0.6 * (1 - (u - 2.7) / 0.3) : 0, tintas: selo('E SE…') }) });

  // 7a) o mundo pula: África, Brasil e China (multidões diferentes, câmera atravessando cada uma)
  const pais = (id, chave, grupo, amb, nome, cam0, cam1, alvo) => plano(id, 2.2, amb, (u, t) => {
    m().mostrar(grupo); m()['multidao' + chave](1, u - 0.35); m()['ondas' + chave](u - 1.05);
    const k = suave(u / 2.2), pouso = u - 1.05;
    const ox = OFF[grupo][0]; camara({ pos: lerpV([cam0[0] + ox, cam0[1], cam0[2]], [cam1[0] + ox, cam1[1], cam1[2]], k), alvo: [alvo[0] + ox, alvo[1], alvo[2]], fov: 50, t, tr: pouso > 0 && pouso < 0.5 ? 1.6 * Math.exp(-pouso * 5) : 0.15 });
  }, { efeito: (u) => ({ subs: 3, obturador: 0.4, flash: u > 1.05 && u < 1.2 ? 0.35 * (1 - (u - 1.05) / 0.15) : 0, tintas: (g, w, h) => { selo(nome)(g, w, h); } }) });
  pais('africa', 'AF', 'africa', 'africa', 'ÁFRICA', [-5, 1.5, 1], [4, 2.4, 10], [0, 4, 40]);
  pais('brasil', 'BR', 'brasil', 'brasil', 'BRASIL', [7, 1.5, 2], [-5, 2.6, 11], [0, 4, 40]);
  pais('china', 'CH', 'china', 'china', 'CHINA', [-4, 1.6, 0], [5, 2.6, 9], [0, 4, 40]);

  // 7b) o pulo, ângulo 1 — DE BAIXO PARA CIMA: câmera rente ao chão; a onda de choque vem na direção dela e a atinge no instante exato (tremor + clarão)
  const DB = 17, T_POUSO = 1.2, T_ATINGE = T_POUSO + (DB - 3) / S.VONC;
  plano('pulo_baixo', 3.2, 'cidade', (u, t) => {
    m().mostrar('cidade'); const h = m().heroi; h.grupo.visible = true; m().multidao(1, u - 0.5); m().ondas(u - T_POUSO);
    const d = h.duracao('Pular'); h.colocar(0, 0, CZ, 0); h.anim('Pular', clamp((u - 0.5) / 1.2, 0, 1) * d * 0.98, { laco: false });
    const k = suave(u / 3.2), hit = u - T_ATINGE;
    camara({ pos: [lerp(-1.2, 1.0, k), 0.5 + (hit > 0 ? 0.15 * Math.exp(-hit * 6) * Math.sin(hit * 40) : 0), CZ + DB - 3 * k], alvo: [0, lerp(3.4, 7, k), CZ - 4], fov: 62 - (hit > 0 && hit < 0.25 ? 10 * (1 - hit / 0.25) : 0), t, tr: hit > 0 && hit < 0.7 ? 3.2 * Math.exp(-hit * 4) : 0.15 });
  }, { efeito: (u) => ({ subs: 3, obturador: 0.45, flash: (u > T_POUSO && u < T_POUSO + 0.12) ? 0.35 : (u > T_ATINGE && u < T_ATINGE + 0.2 ? 0.55 * (1 - (u - T_ATINGE) / 0.2) : 0), tintas: selo('E SE…') }) });

  // 7c) o pulo, ângulo 2 — DE CIMA PARA BAIXO: câmera alta olhando para o chão; os anéis se abrem a partir do herói e a multidão ondula
  plano('pulo_alto', 3.2, 'cidade', (u, t) => {
    m().mostrar('cidade'); const h = m().heroi; h.grupo.visible = true; m().multidao(1, u - 0.5); m().ondas(u - T_POUSO);
    const d = h.duracao('Pular'); h.colocar(0, 0, CZ, PI); h.anim('Pular', clamp((u - 0.5) / 1.2, 0, 1) * d * 0.98, { laco: false });
    const k = suave(u / 3.2);
    camara({ pos: [Math.sin(k * 1.2) * 10, lerp(46, 92, k), CZ - Math.cos(k * 1.2) * 10 - 8], alvo: [0, 0, CZ + 6], fov: 52, t, tr: u > T_POUSO && u < T_POUSO + 0.6 ? 2.0 * Math.exp(-(u - T_POUSO) * 4) : 0.1 });
  }, { efeito: (u) => ({ subs: 3, obturador: 0.4, flash: (u > T_POUSO && u < T_POUSO + 0.15) ? 0.4 * (1 - (u - T_POUSO) / 0.15) : 0, tintas: selo('E SE…') }) });

  // 8) o que realmente acontece: nada (a Terra continua parada), zoom out
  plano('real', 2.8, 'espaco', (u, t) => {
    espaco(t, 0.04); m().pessoaEspaco.visible = false; m().orbita.visible = false;
    const k = suave(u / 2.8);
    camara({ pos: [EX + lerp(0, -3, k), lerp(1, 3, k), lerp(20, 36, k)], alvo: [EX, 0, 0], fov: 38, t });
  }, { efeito: () => ({ subs: 2, tintas: selo('REAL', '#5be37a') }) });

  // 9) escala: push-in até um átomo (a Terra se mexeria menos que a largura dele)
  plano('atomo', 3.0, 'atomo', (u, t) => {
    m().mostrar('atomo');
    m().eletrons.forEach(e => { const a = t * e.vel * 2 + e.fase; e.e.position.set(Math.cos(a) * e.raio, Math.sin(a) * e.raio, 0); });
    const k = suave(u / 3.0);
    camara({ pos: [AX + lerp(-2, 1.2, k), lerp(1.5, 0.4, k), lerp(24, 7.5, k)], alvo: [AX, 0, 0], fov: 38, t });
  }, { efeito: () => ({ subs: 3, tintas: (g, w, h) => { selo('REAL', '#5be37a')(g, w, h); legenda('MENOS QUE A LARGURA DE UM ÁTOMO')(g, w, h); } }) });

  // 10) fecho: volta ao quadro 0 (Terra e pessoa no ar) e cartão
  plano('fim', 3.5, 'espaco', (u, t) => {
    espaco(t); pessoa(t); m().orbita.visible = true;
    const k = suave(u / 3.5);
    camara({ pos: [EX + lerp(-0.6, -2.0, k), lerp(1.0, 2.2, k), lerp(21, 30, k)], alvo: [EX + 0.2, 0.2, 0], fov: 38, roll: lerp(0, 0.05, k), t });
  }, { efeito: (u) => ({ subs: 2, tintas: cartao(u / 3.5) }) });
}
