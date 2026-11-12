// Cenas: pergunta, as duas suposições (planeta empurrado / amassado), alerta no celular, multidão, meio-dia, pulo, o que realmente acontece, átomo e fecho.
import * as THREE from 'three';
import { clamp, lerp, suave, suave5, inv } from './util.js';
import { S, V, PI, plano, camara, lerpV } from './base.js';
import { OFF } from './mundo.js';

const EX = OFF.espaco[0], AX = OFF.atomo[0], CX = OFF.celular[0];
function selo(txt, cor = '#ffd84a') {
  return (g, w, h) => { g.save(); g.textAlign = 'center'; g.font = `bold ${w * 0.062}px "DejaVu Sans", sans-serif`; const tw = g.measureText(txt).width + w * 0.08, x = w / 2 - tw / 2, y = h * 0.075, a = w * 0.095;
    g.fillStyle = 'rgba(0,0,0,0.62)'; g.beginPath(); g.roundRect(x, y, tw, a, a / 2); g.fill(); g.strokeStyle = cor; g.lineWidth = 4; g.stroke(); g.fillStyle = cor; g.fillText(txt, w / 2, y + a * 0.72); g.restore(); };
}
function legenda(txt, a = 1) { return (g, w, h) => { g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.font = `bold ${w * 0.04}px "DejaVu Sans", sans-serif`; g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, h * 0.80, w, w * 0.12); g.fillStyle = '#fff'; g.fillText(txt, w / 2, h * 0.80 + w * 0.08); g.restore(); }; }
function cartao(u) { const a = clamp(inv(0.4, 0.8, u)); return (g, w, h) => { if (a < 0.01) return; g.save(); g.globalAlpha = a; g.textAlign = 'center'; const gr = g.createLinearGradient(0, h * 0.62, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.7)'); g.fillStyle = gr; g.fillRect(0, h * 0.62, w, h * 0.38); g.fillStyle = '#e9e4cf'; g.font = `bold ${w * 0.09}px "DejaVu Sans", sans-serif`; g.fillText('HRYZ ANIMATION', w / 2, h * 0.865); g.fillStyle = '#e0b04a'; g.font = `bold ${w * 0.058}px "DejaVu Sans", sans-serif`; g.fillText('SE INSCREVE', w / 2, h * 0.925); g.restore(); }; }

export function montarPlanos() {
  const m = () => S.m;
  const espaco = (t, spin = 0.05) => { m().mostrar('espaco'); m().terra.visible = true; m().globo.rotation.y = t * spin; m().rachaduras.visible = false; m().terra.position.set(0, 0, 0); m().terra.scale.set(1, 1, 1); m().terra.rotation.set(0, 0, 0.1); m().atm.visible = true; m().pessoaEspaco.visible = true; m().orbita.visible = true; };
  const pessoa = t => { const p = m().pessoaEspaco; p.position.set(EX + 1.4, 0.4 + 0.12 * Math.sin(t * 1.6), 14); p.rotation.set(0.3 * Math.sin(t * 0.9), t * 0.5, 0.2); p.scale.setScalar(6); };

  // 1) a pergunta: push-in na Terra com a pessoa no ar em primeiro plano (quadro 0 e fecho)
  plano('terra', 5.0, 'espaco', (u, t) => {
    espaco(t); pessoa(t);
    const k = suave(u / 5.0);
    camara({ pos: [EX + lerp(-2.0, -0.6, k), lerp(2.2, 1.0, k), lerp(30, 21, k)], alvo: [EX + 0.2, 0.2, 0], fov: 38, roll: lerp(0.05, 0, k), t });
  }, { efeito: () => ({ subs: 2 }) });

  // 2) suposição 1: o planeta sai do lugar (empurrado para fora da órbita)
  plano('empurrada', 3.0, 'espaco', (u, t) => {
    espaco(t, 0.35); m().pessoaEspaco.visible = false;
    const k = u / 3.0, p = k * k * 1.0; m().terra.position.set(p * 30, p * 3, -p * 52); m().globo.rotation.y = t * 0.9;
    const ang = lerp(-0.7, 0.9, suave(k));
    camara({ pos: [EX + Math.sin(ang) * 26 + 6, 7, Math.cos(ang) * 26 + 6], alvo: [EX + p * 30 * 0.7, p * 2, -p * 52 * 0.7], fov: 40, t });
  }, { efeito: () => ({ subs: 3, obturador: 0.4, tintas: selo('SUPOSIÇÃO 1') }) });

  // 3) suposição 2: o planeta fica amassado
  plano('amassada', 3.0, 'espaco', (u, t) => {
    espaco(t, 0.1); m().pessoaEspaco.visible = false; m().orbita.visible = false;
    const k = suave(u / 1.3), w = Math.sin(u * 14) * 0.03 * Math.exp(-u * 1.2);
    m().terra.scale.set(lerp(1, 1.25, k) + w, lerp(1, 0.52, k) - w, lerp(1, 1.25, k) + w); m().rachaduras.visible = u > 0.5; m().rachaduras.material.opacity = clamp((u - 0.5) * 2);
    const ang = lerp(0.9, -0.5, suave(u / 3));
    camara({ pos: [EX + Math.sin(ang) * 17, lerp(1, 6, u / 3), Math.cos(ang) * 17], alvo: [EX, 0, 0], fov: 40, t });
  }, { efeito: () => ({ subs: 3, tintas: selo('SUPOSIÇÃO 2') }) });

  // 4) alerta no celular
  plano('alerta', 5.0, 'celular', (u, t) => {
    m().mostrar('celular'); S.m.telaCel(t, inv(0.6, 3.4, u));
    m().cel.rotation.set(0.05 * Math.sin(t * 1.3), 0.3 * Math.sin(t * 0.7), 0.03 * Math.sin(t * 2));
    const k = suave5(u / 5.0);
    camara({ pos: [CX + lerp(-0.3, 0.0, k), lerp(0.55, 0, k), lerp(1.9, 3.3, k)], alvo: [CX, lerp(0.35, 0, k), 0], fov: 36, t, tr: 0.3 });
  }, { efeito: (u) => ({ subs: 2, tintas: selo('E SE…') }) });

  // 5) todo mundo sai de casa e se prepara: da porta até a multidão cobrindo a praça
  plano('saem', 6.0, 'cidade', (u, t) => {
    m().mostrar('cidade'); m().heroi.grupo.visible = false;
    const cheia = suave(u / 5.4); m().multidao(cheia, -1);
    m().saindo.forEach((a, i) => { a.grupo.visible = true; const z = clamp((u - i * 0.45) * 3.2, 0, 40) + 0.6; a.colocar(-1.2 + i * 1.2, 0, z, 0); a.anim('Correr', (u - i * 0.45) * 1.4); a.rosto({ expressao: 'medo', forca: 0.4 }); a.atualizarRosto(); });
    const k = suave5(u / 6.0);
    camara({ pos: lerpV([0.5, 1.7, 7], [0, 80, 150], k), alvo: lerpV([0, 1.5, 2], [0, 0, 28], k), fov: lerp(45, 55, k), t });
    m().relogio.visible = true;
  }, { efeito: () => ({ subs: 3, tintas: selo('E SE…') }) });

  // 6) chega meio-dia: relógio gigante 11:59 -> 12:00
  plano('meiodia', 5.0, 'cidade', (u, t) => {
    m().mostrar('cidade'); m().heroi.grupo.visible = false; m().multidao(1, -1);
    const dep = u > 3.6; m().horaRelogio(dep ? '12:00' : (Math.floor(u * 2) % 2 ? '11:59' : '11 59'), dep ? 1.0 : 0.4);
    const k = suave(u / 5.0);
    camara({ pos: [lerp(-8, 0, k), lerp(10, 14, k), lerp(14, 8, k)], alvo: [0, 14, -42], fov: lerp(46, 38, k), t });
  }, { efeito: (u) => ({ subs: 2, flash: u > 3.6 && u < 3.9 ? 0.6 * (1 - (u - 3.6) / 0.3) : 0, tintas: selo('E SE…') }) });

  // 7) todo mundo pula: órbita de 360° no herói e a multidão saltando
  plano('pulo', 4.0, 'cidade', (u, t) => {
    m().mostrar('cidade'); const h = m().heroi; h.grupo.visible = true; m().multidao(1, u - 0.9);
    const d = h.duracao('Pular'); h.colocar(0, 0, 18, PI); h.anim('Pular', clamp((u - 0.9) / 1.2, 0, 1) * d * 0.98, { laco: false }); h.rosto({ expressao: 'sorriso', forca: 0.5 }); h.atualizarRosto();
    const ang = lerp(0, 2 * PI, suave(u / 4.0));
    camara({ pos: [Math.sin(ang) * 6, lerp(1.4, 3, u / 4), 18 + Math.cos(ang) * 6], alvo: [0, 1.2 + clamp((u - 0.9) * 0.4, 0, 0.6), 18], fov: 42, t });
  }, { efeito: (u) => ({ subs: 3, obturador: 0.4, tintas: selo('E SE…') }) });

  // 8) o que realmente acontece: nada (a Terra continua parada), zoom out
  plano('real', 3.4, 'espaco', (u, t) => {
    espaco(t, 0.04); m().pessoaEspaco.visible = false; m().orbita.visible = false;
    const k = suave(u / 3.4);
    camara({ pos: [EX + lerp(0, -3, k), lerp(1, 3, k), lerp(20, 36, k)], alvo: [EX, 0, 0], fov: 38, t });
  }, { efeito: () => ({ subs: 2, tintas: selo('REAL', '#5be37a') }) });

  // 9) escala: push-in até um átomo (a Terra se mexeria menos que a largura dele)
  plano('atomo', 3.6, 'atomo', (u, t) => {
    m().mostrar('atomo');
    m().eletrons.forEach(e => { const a = t * e.vel * 2 + e.fase; e.e.position.set(Math.cos(a) * e.raio, Math.sin(a) * e.raio, 0); });
    const k = suave(u / 3.6);
    camara({ pos: [AX + lerp(-2, 1.2, k), lerp(1.5, 0.4, k), lerp(24, 7.5, k)], alvo: [AX, 0, 0], fov: 38, t });
  }, { efeito: () => ({ subs: 3, tintas: (g, w, h) => { selo('REAL', '#5be37a')(g, w, h); legenda('MENOS QUE A LARGURA DE UM ÁTOMO')(g, w, h); } }) });

  // 10) fecho: volta ao quadro 0 (Terra e pessoa no ar) e cartão
  plano('fim', 4.0, 'espaco', (u, t) => {
    espaco(t); pessoa(t); m().orbita.visible = true;
    const k = suave(u / 4.0);
    camara({ pos: [EX + lerp(-0.6, -2.0, k), lerp(1.0, 2.2, k), lerp(21, 30, k)], alvo: [EX + 0.2, 0.2, 0], fov: 38, roll: lerp(0, 0.05, k), t });
  }, { efeito: (u) => ({ subs: 2, tintas: cartao(u / 4.0) }) });
}
