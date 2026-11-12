// Cenas (v2): 1) pessoas magras morrendo de fome e o herói triste · 2) máquina do tempo · 3) viagem · 4) futuro e laboratório · 5) volta (um dia antes),
// tiros que encolhem pessoas VIVAS · 6) cidade miniatura, banana gigante cortada pelo povo · 7) maçã maior que a casa.
import * as THREE from 'three';
import { clamp, lerp, suave, suave5, inv, mulberry32 } from './util.js';
import { S, V, PI, plano, camara } from './base.js';
import { OFF, MC, MS, PLAZA } from './mundo.js';
import { andarFraco, emPeFraco, cair, deitado, dimensionar } from './gente.js';

const TX = OFF.tunel[0], FX = OFF.futuro[0], LX = OFF.lab[0];
const Y0 = 0.17;                                              // topo da ilha da rotatória
const e3 = k => 1 - Math.pow(1 - clamp(k), 3), ent = k => Math.pow(clamp(k), 2);

// ----------------------------------------------------------------------------------------------------------- sobreposições 2D
function selo(txt, cor = '#ffd84a', y = 0.06) {
  return (g, w, h) => { g.save(); g.textAlign = 'center'; g.font = `bold ${w * 0.05}px "DejaVu Sans", sans-serif`; const tw = g.measureText(txt).width + w * 0.07, x = w / 2 - tw / 2, yy = h * y, a = w * 0.08;
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.beginPath(); g.roundRect(x, yy, tw, a, a / 2); g.fill(); g.strokeStyle = cor; g.lineWidth = 3; g.stroke(); g.fillStyle = cor; g.fillText(txt, w / 2, yy + a * 0.7); g.restore(); };
}
function juntar(...fs) { return (g, w, h) => fs.forEach(f => f && f(g, w, h)); }
function anoTxt(a, alfa = 1) { return (g, w, h) => { g.save(); g.globalAlpha = alfa; g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, h * 0.80, w, w * 0.2); g.fillStyle = '#5ff0ff'; g.font = `bold ${w * 0.15}px "DejaVu Sans Mono", monospace`; g.fillText(String(Math.round(a)), w / 2, h * 0.80 + w * 0.16); g.restore(); }; }
function cartao(u) { const a = clamp(inv(0.45, 0.8, u)); return (g, w, h) => { if (a < 0.01) return; g.save(); g.globalAlpha = a; g.textAlign = 'center'; const gr = g.createLinearGradient(0, h * 0.62, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.7)'); g.fillStyle = gr; g.fillRect(0, h * 0.62, w, h * 0.38); g.fillStyle = '#e9e4cf'; g.font = `bold ${w * 0.09}px "DejaVu Sans", sans-serif`; g.fillText('HRYZ ANIMATION', w / 2, h * 0.865); g.fillStyle = '#e0b04a'; g.font = `bold ${w * 0.058}px "DejaVu Sans", sans-serif`; g.fillText('SE INSCREVE', w / 2, h * 0.925); g.restore(); }; }

// ----------------------------------------------------------------------------------------------------------- dados da cena
// Fase 1 (tempo global, em s): 10 pessoas andam fracas e caem uma a uma; 6 já estão caídas. Posições sobre a ilha (praça).
const W = [                       // x0, z0, giro, tf (instante da queda), tipo  (concentrados num cone estreito: o vídeo é vertical)
  [-0.3, 7.7, PI + 0.15, 2.3, 'costas'], [0.9, 8.6, PI - 0.3, 2.8, 'frente'], [-1.3, 9.1, PI + 0.4, 3.5, 'lado'], [0.0, 10.0, PI + 0.1, 3.9, 'costas'], [1.5, 10.7, PI - 0.2, 4.5, 'frente'],
  [-0.9, 11.4, PI + 0.3, 4.9, 'costas'], [1.9, 12.0, PI - 0.4, 5.4, 'lado'], [-1.9, 12.7, PI + 0.2, 6.6, 'frente'], [0.6, 13.6, PI - 0.1, 7.4, 'costas'], [-0.5, 14.8, PI + 0.5, 8.3, 'lado']];
const VEL = 0.30, TQ = 1.15;
const L = [[-0.9, 8.9, 0.5, 'costas'], [1.0, 9.6, 2.2, 'lado'], [-1.7, 10.4, 4.0, 'frente'], [2.1, 11.2, 1.0, 'costas'], [-0.4, 12.6, 3.1, 'lado'], [1.1, 13.5, 5.5, 'frente']];
const HE = [0.3, Y0, 11.3];                                   // onde o herói está ao ver tudo
const posW = (i, t) => { const w = W[i], tt = Math.min(t, w[3]); return [w[0] + Math.sin(w[2]) * VEL * tt, w[1] + Math.cos(w[2]) * VEL * tt]; };

// Fase 2: a máquina e o ponto de pouso (um dia antes) e a multidão VIVA (magra, de pé, assustada)
const MQ = [-7.5, Y0, 12.5], MQY = 0.6;
const LV = [];                                                // 16 pessoas vivas espalhadas na praça: x, z, giro de reação
{ const r = mulberry32(11); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + r() * 0.3, R = 1.6 + r() * 3.8; LV.push([1.4 + Math.cos(a) * R * 1.35, 11.4 + Math.sin(a) * R * 0.85, r() * 6.283]); } }
const POUSO = [-3.2, Y0, 10.2];                               // onde a máquina pousa na volta
const HT = [-1.2, Y0, 5.4];                                   // posição do herói ao atirar (de frente para a multidão)
const ORDEM = [...Array(16).keys()].sort((a, b) => LV[a][0] - LV[b][0]);           // ordem do encolhimento: da esquerda para a direita
const TS = new Array(16); ORDEM.forEach((p, k) => { TS[p] = 35.75 + k * 0.095; }); TS[ORDEM[5]] = 33.95;  // um deles encolhe no plano 'atira2'
const ALVO2 = ORDEM[5];

// Fase 3: cidade miniatura. Pistas (coord. locais da miniatura) onde as pessoas caminham; 12 ladrilhos de 0,144 m
const PISTAS = [];
{ const r = mulberry32(3); for (let i = 0; i < 16; i++) { const h = i % 2 === 0, c = (i % 4 < 2 ? -1 : 1) * 0.072 + (r() - 0.5) * 0.03; PISTAS.push(h ? { ax: -0.45 + r() * 0.2, az: c, dx: 1, dz: 0, len: 0.55 + r() * 0.2, f: r() } : { ax: c, az: -0.33 + r() * 0.1, dx: 0, dz: 1, len: 0.4 + r() * 0.1, f: r() }); } }

export function montarPlanos() {
  const m = () => S.m, hero = () => S.m.heroi, pool = i => S.m.pool[i];
  const mundoW = (lx, ly, lz) => m().mini.localToWorld(V(lx, ly, lz));
  const sentarHeroi = () => { const a = hero(), G = m().maq.grupo; G.updateMatrixWorld(true); const p = G.localToWorld(V(0, 0.325, -0.15)); a.grupo.visible = true; a.colocar(p.x, p.y, p.z, G.rotation.y); a.anim('Parado', 0); a.sentar({ y: 0.45 }); return a; };
  const camMaq = (pos, alvo) => { const G = m().maq.grupo; G.updateMatrixWorld(true); return { pos: G.localToWorld(V(...pos)).toArray(), alvo: G.localToWorld(V(...alvo)).toArray() }; };
  const heroi = (x, y, z, giro, clipe, tc, expr = 'neutro', fr = 0.4) => { const a = hero(); a.grupo.visible = true; a.colocar(x, y, z, giro); a.anim(clipe, tc); a.rosto({ expressao: expr, forca: fr, piscar: 0 }); a.atualizarRosto(); a.grupo.updateMatrixWorld(true); return a; };
  const secoBase = (esc) => { m().mostrar('seca'); m().jarras.forEach(j => { j.visible = true; }); m().sombraLonge(); };
  const faseMaq = tt => 1 * tt + 6.5 * tt * tt;                // giro dos anéis (integral da velocidade)

  // ---- a simulação da fome (função do tempo global): vale para os 3 primeiros planos
  const fome = (t, { ocultar = [] } = {}) => {
    secoBase();
    for (let i = 0; i < 10; i++) {
      const w = W[i], a = pool(i); if (ocultar.includes(i)) continue;
      const [x, z] = posW(i, t);
      if (t < w[3]) andarFraco(a, x, Y0, z, w[2], t + i * 0.37, 0.5 + 0.05 * (i % 3));
      else if (t < w[3] + TQ) cair(a, x, Y0, z, w[2], (t - w[3]) / TQ, w[4], t);
      else deitado(a, x, Y0, z, w[2], w[4], t, i * 1.7 + 1, 0);
    }
    L.forEach(([x, z, yaw, tp], k) => deitado(pool(10 + k), x, Y0, z, yaw, tp, t, k * 1.3 + 0.5, 0));
  };
  const heroiTriste = (t, chora = 1, fr = 0.9, olha = null) => {
    const a = hero(); a.grupo.visible = true; a.colocar(HE[0], HE[1], HE[2], PI + 0.3); a.anim('Parado', t * 0.5);
    a.somar('Coluna', 0.08 * chora, 0, 0); a.somar('Cabeca', 0.28 * chora, 0, 0); a.somar('Pescoco', 0.12 * chora, 0, 0);
    if (chora > 0.01) a.soluco(t, 0.7 * chora);
    if (olha) a.olhar(olha, { forca: 1, max: 1.0 });
    a.rosto({ expressao: 'triste', forca: fr, piscar: 0 }); a.atualizarRosto(); a.lagrimaAt(t, chora > 0.5); a.grupo.updateMatrixWorld(true); return a;
  };

  // ============================================================================================================= 1) FOME
  // 1a: pés arrastando na terra rachada → sobe e revela a praça com gente cambaleando; a primeira cai
  plano('fome1', 3.0, 'seca', (u, t) => {
    fome(t); heroiTriste(t, 0.3, 0.5);
    const k = suave(u / 3.0), k2 = suave5(inv(0.0, 1.0, u / 3.0));
    camara({ pos: [lerp(-0.1, -0.3, k), lerp(0.25, 1.9, k2), lerp(5.5, 1.2, k)], alvo: [lerp(-0.3, 0.15, k), lerp(0.25, 1.0, k2), lerp(7.4, 11.0, k)], fov: lerp(40, 56, k), t, tr: 0.08 });
  }, { efeito: () => ({ subs: 2, tintas: selo('FICÇÃO') }) });

  // 1b: 120° em volta de um homem que desaba
  plano('fome2', 3.0, 'seca', (u, t) => {
    fome(t); heroiTriste(t, 0.3, 0.5);
    const [px, pz] = posW(3, W[3][3]), a = lerp(0.35, 2.7, suave(u / 3.0)), r = lerp(3.1, 2.4, suave(u / 3.0));
    camara({ pos: [px + Math.sin(a) * r, lerp(1.3, 0.55, suave(u / 3.0)), pz + Math.cos(a) * r], alvo: [px, 0.55, pz], fov: 52, t, tr: 0.06 });
  }, { efeito: () => ({ subs: 2, obturador: 0.3 }) });

  // 1c: o herói vê tudo: close no rosto com lágrimas e zoom-out revelando os corpos
  plano('triste', 3.0, 'seca', (u, t) => {
    fome(t);
    const fim = inv(2.2, 3.0, u), chora = 1 - suave(fim), olha = fim > 0 ? V(HE[0] - 1, 6, HE[2] - 6) : null;
    heroiTriste(t, chora, lerp(0.95, 0.3, fim), olha);
    const k = suave5(u / 3.0), dir = V(Math.sin(PI + 0.3), 0, Math.cos(PI + 0.3));
    const d = lerp(1.05, 5.5, k), alt = lerp(1.6, 2.8, k);
    camara({ pos: [HE[0] + dir.x * d + 0.12, alt, HE[2] + dir.z * d], alvo: [HE[0], lerp(1.55, 1.05, k), HE[2]], fov: lerp(30, 58, k), t, tr: 0.05 });
  }, { efeito: () => ({ subs: 2 }) });

  // ============================================================================================================= 2) MÁQUINA
  // 2a: a máquina (giro 150° em volta, subindo) e ele chega decidido
  plano('maq1', 3.0, 'seca', (u, t) => {
    secoBase(); m().maqEm('seca', MQ[0], MQ[1], MQ[2], MQY); m().maq.energia(0.25, t); m().maq.girar(0.3 * t); m().maq.descargas(t, 0.15); m().maq.tela(2026, false, t); m().maq.relogio(t * 0.4);
    const hx = lerp(-1.4, -4.6, suave(u / 3.0)), hz = lerp(9.4, 10.8, suave(u / 3.0)); heroi(hx, Y0, hz, -1.35, 'Andar', t * 1.0, 'neutro', 0.5);
    const k = suave(u / 3.0), a = lerp(0.2, 2.9, k);
    camara({ pos: [MQ[0] + Math.sin(a) * 6.8, lerp(0.9, 3.2, k), MQ[2] + Math.cos(a) * 6.8], alvo: [MQ[0], 1.5, MQ[2]], fov: lerp(46, 40, k), t, tr: 0.05 });
  }, { efeito: () => ({ subs: 2, obturador: 0.3 }) });

  // 2b: cabine: ele puxa a alavanca; a tela do console acende
  plano('maq2', 2.5, 'seca', (u, t) => {
    secoBase(); m().maqEm('seca', MQ[0], MQ[1], MQ[2], MQY);
    const pux = suave((u - 0.9) / 0.5), at = u > 1.3;
    m().maq.alavanca(pux); m().maq.energia(0.25 + 0.5 * pux, t); m().maq.girar(0.3 * t + pux * 2); m().maq.descargas(t, pux * 0.5); m().maq.tela(2026 + (u > 1.5 ? (u - 1.5) * 90 : 0), at, t); m().maq.relogio(t * 0.5);
    const a = sentarHeroi(); m().maq.topoAlavanca(S.tmp = S.tmp || V());
    const topo = S.tmp.clone(); a.ikBraco('E', topo.clone().add(V(0, -0.02, 0)), V(0.3, -1, 0.1)); a.grupo.updateMatrixWorld(true);
    a.rosto({ expressao: u < 1.2 ? 'neutro' : 'raiva', forca: 0.6, piscar: 0 }); a.atualizarRosto();
    const k = suave(u / 2.5), c = camMaq([lerp(-1.3, -0.6, k), lerp(2.0, 1.55, k), lerp(1.5, 0.8, k)], [lerp(0.1, 0.0, k), lerp(1.2, 1.42, k), lerp(0.0, -0.15, k)]);
    camara({ pos: c.pos, alvo: c.alvo, fov: lerp(40, 34, k), t, tr: at ? 0.15 : 0.03, near: 0.03 });
  }, { efeito: (u) => ({ subs: 2, flash: u > 1.4 && u < 1.55 ? 0.4 : 0, flashCor: '120,230,255' }) });

  // 2c: de fora: os anéis disparam, descargas, onda no chão, clarão e a máquina some
  plano('ativa', 2.0, 'seca', (u, t) => {
    secoBase(); const k = suave(u / 2.0), tt = u;
    if (u < 1.75) { m().maqEm('seca', MQ[0], MQ[1] + (u > 1.4 ? (u - 1.4) * 2 : 0), MQ[2], MQY); m().maq.energia(0.4 + 0.6 * k, t); m().maq.girar(faseMaq(tt)); m().maq.descargas(t, 0.4 + 0.6 * k); m().maq.tela(2026 + u * 200, true, t); m().maq.relogio(t * 5); sentarHeroi(); }
    const ar = m().aneisEnc[0]; ar.visible = u > 0.5; const q = inv(0.5, 1.9, u); ar.position.set(MQ[0], Y0 + 0.05, MQ[2]); ar.scale.setScalar(0.5 + q * 11); ar.material.opacity = 0.9 * (1 - q) * suave(inv(0.5, 0.7, u));
    const a = lerp(0.6, 1.6, k);
    camara({ pos: [MQ[0] + Math.sin(a) * lerp(7.5, 4.8, k), lerp(1.0, 1.7, k), MQ[2] + Math.cos(a) * lerp(7.5, 4.8, k)], alvo: [MQ[0], lerp(1.9, 2.2, k), MQ[2]], fov: lerp(44, 52, k), t, tr: 0.1 + 0.5 * inv(0.8, 2.0, u) });
  }, { efeito: (u) => ({ subs: 3, obturador: 0.5, flash: u > 1.6 ? clamp((u - 1.6) / 0.25) : 0, flashCor: '200,240,255' }) });

  // ============================================================================================================= 3) VIAGEM NO TEMPO
  // 3a: vórtice de relógios e folhas de calendário; a máquina voa e a câmera gira
  plano('viag1', 3.0, 'tunel', (u, t) => {
    m().mostrar('tunel'); m().vortice(t, 1.0); const G = m().maqEm('tunel', 0, 0, 0, PI);
    m().maq.energia(1, t); m().maq.girar(faseMaq(2.0) + 16 * u); m().maq.descargas(t, 1); m().maq.tela(2026 + u * 150, true, t); m().maq.relogio(t * 8); sentarHeroi(); G.position.y = Math.sin(t * 2) * 0.1;
    const k = suave(u / 3.0), a = lerp(0.7, 2.6, k);
    camara({ pos: [TX + Math.sin(a) * lerp(8.8, 6.4, k), lerp(2.0, 3.4, k), -Math.cos(a) * lerp(8.8, 6.4, k)], alvo: [TX, 1.5, 0], fov: lerp(52, 60, k), t, tr: 0.25 });
  }, { efeito: (u) => ({ subs: 3, obturador: 0.7, tintas: anoTxt(2026 + (2500 - 2026) * suave(u / 5.0) * 0.55) }) });

  // 3b: dentro da cabine: o rosto do piloto de frente, o vórtice atrás e o contador do ano disparando
  plano('viag2', 2.5, 'tunel', (u, t) => {
    m().mostrar('tunel'); m().vortice(t, 1.15); m().maqEm('tunel', 0, 0, 0, PI);
    m().maq.energia(1, t); m().maq.girar(faseMaq(2.0) + 16 * (3 + u)); m().maq.descargas(t, 1); m().maq.tela(2026 + 150 + u * 330, true, t); m().maq.relogio(t * 12);
    const a = sentarHeroi(); a.rosto({ expressao: 'medo', forca: 0.5 + 0.3 * Math.sin(t * 8), piscar: 0 }); a.atualizarRosto(); m().maq.topoAlavanca(S.tmp = S.tmp || V()); a.ikBraco('E', S.tmp.clone().add(V(0, -0.02, 0)), V(0.3, -1, 0.1)); a.grupo.updateMatrixWorld(true);
    const k = suave(u / 2.5), c = camMaq([lerp(0.5, -0.2, k), lerp(1.75, 1.7, k), lerp(0.95, 0.85, k)], [0, 1.42, -0.15]);
    camara({ pos: c.pos, alvo: c.alvo, fov: lerp(40, 34, k), t, tr: 0.4, near: 0.03 });
  }, { efeito: (u) => ({ subs: 3, obturador: 0.7, tintas: anoTxt(2026 + (2500 - 2026) * (0.55 + 0.45 * suave(u / 2.5))) }) });

  // 3c: o futuro: a máquina surge num clarão sobre a cidade neon e desce entre os carros voadores
  plano('chega', 2.5, 'futuro', (u, t) => {
    m().mostrar('futuro'); m().carros.forEach(c => { const q = c.userData; c.position.set(FX + q.x0 + (q.v * t) % 220 - 110 - OFF.futuro[0] + OFF.futuro[0], q.y, q.z); c.position.x = q.x0 + ((q.v * t) % 220) - 110; c.rotation.y = q.v > 0 ? 0 : PI; });
    const q = suave(u / 2.5), y = lerp(24, 10, q);
    const G = m().maqEm('futuro', 6, y, 28, 2.6 - q * 0.5); m().maq.energia(1 - 0.5 * q, t); m().maq.girar(faseMaq(2.0) + 16 * 4 + u * 8); m().maq.descargas(t, 1 - q); m().maq.tela(2500, true, t); m().maq.relogio(t * 3); sentarHeroi();
    m().brilhoChegada.material.opacity = 0.9 * (1 - inv(0, 0.5, u)); m().brilhoChegada.scale.setScalar(14 * (1 + u));
    const a = lerp(-0.4, 1.2, q);
    camara({ pos: [FX + 6 + Math.sin(a) * lerp(16, 9, q), lerp(20, 8, q), 28 + Math.cos(a) * lerp(16, 9, q)], alvo: [FX + 6, y + 1.2, 28], fov: 55, t, tr: 0.15 });
  }, { efeito: (u) => ({ subs: 3, obturador: 0.5, flash: 0.9 * (1 - inv(0, 0.35, u)), flashCor: '230,245,255', tintas: selo('ANO 2500', '#5ff0ff') }) });

  // ============================================================================================================= 4) LABORATÓRIO
  const dispararLab = (u) => { m().luzLab.intensity = 22; const al = u > 0.0; return al; };
  // 4a: a arma sob a cúpula (macro com giro e zoom)
  plano('lab1', 1.8, 'lab', (u, t) => {
    m().mostrar('lab'); const dom = m().domo; dom.position.y = 1.08 + 0.9 * suave(inv(1.1, 1.6, u));
    const g = m().arma; g.visible = true; g.position.set(LX, 1.5 + 0.05 * Math.sin(t * 3), -4); g.rotation.set(0.2, t * 0.9, 0); m().armaCarga(0.3);
    const k = suave(u / 1.8), a = lerp(0.4, 1.9, k);
    camara({ pos: [LX + Math.sin(a) * lerp(1.7, 0.95, k), lerp(1.7, 1.55, k), -4 + Math.cos(a) * lerp(1.7, 0.95, k)], alvo: [LX, 1.45, -4], fov: lerp(40, 32, k), t, near: 0.03 });
  }, { efeito: () => ({ subs: 2 }) });

  // 4b: ele pega, o alarme dispara e ele sai correndo
  plano('lab2', 2.2, 'lab', (u, t) => {
    m().mostrar('lab'); const dom = m().domo; dom.position.y = 1.98;
    const alar = u > 0.7; m().alarme.intensity = alar ? 26 * (0.5 + 0.5 * Math.sin(t * 14)) : 0; m().sirene.material.color.setHex(alar && Math.sin(t * 14) > 0 ? 0xff3040 : 0x401018);
    const pegou = u > 0.55, a = u < 0.9 ? heroi(LX, 0, -2.75, PI, 'Parado', t * 0.4, 'sorriso', 0.7) : heroi(LX + Math.sin(0) * 0, 0, lerp(-2.75, 3.6, suave((u - 0.9) / 1.3)), 0, 'Correr', u * 1.5, 'sorriso', 0.8);
    const g = m().arma; g.visible = true;
    if (!pegou) { a.ikBraco('D', V(LX - 0.1, 1.3, -3.75), V(-1, -0.5, 0)); g.position.set(LX, 1.5, -4); g.rotation.set(0.2, t * 0.9, 0); }
    else { const alvo = a.grupo.position.clone().add(V(-0.12 * Math.cos(a.grupo.rotation.y), 1.2, 0.42 * Math.cos(a.grupo.rotation.y))); if (u < 0.9) alvo.set(LX - 0.1, 1.28, -3.8 + (u - 0.55) * 1.2); a.ikBraco('D', alvo, V(-1, -0.6, 0)); a.grupo.updateMatrixWorld(true); const p = a.pos('MaoD', V()); g.position.copy(p).add(V(0.0, 0.02, 0.08 * Math.cos(a.grupo.rotation.y))); g.quaternion.copy(a.grupo.quaternion); }
    const k = suave(u / 2.2);
    camara({ pos: [LX + lerp(2.6, -2.2, k), lerp(1.5, 1.7, k), lerp(-0.6, 2.6, k)], alvo: [LX, 1.2, lerp(-3.4, 1.0, k)], fov: lerp(46, 50, k), t, tr: alar ? 0.25 : 0.05 });
  }, { efeito: () => ({ subs: 2, obturador: 0.4 }) });

  // ============================================================================================================= 5) VOLTA E ENCOLHIMENTO
  // 5a: um dia antes: a máquina pousa na praça sobre os sobreviventes (vivos, magros e assustados); ele desce com a arma
  const vivos = (t, { reage = 0, ocultar = [] } = {}) => {
    for (let i = 0; i < 16; i++) {
      if (ocultar.includes(i)) continue;
      const [x, z, yaw] = LV[i], a = pool(i), s = clamp((t - TS[i]) / 0.5);
      if (t >= TS[i]) continue;                                             // já encolhido: tratado à parte
      emPeFraco(a, x, Y0, z, yaw, t, i * 0.9, reage > 0.5 && i % 3 === 0 ? 'medo' : 'triste', 0.6);
      if (reage > 0) { const alvo = V(POUSO[0], 3, POUSO[2]); a.olhar(alvo, { forca: reage }); a.atualizarRosto(); }
    }
  };
  plano('volta', 2.5, 'seca', (u, t) => {
    secoBase(); const q = suave(u / 1.1), y = lerp(26, Y0, q * q * (3 - 2 * q) * 0 + q), aterrisa = inv(1.0, 1.25, u);
    m().maqEm('seca', POUSO[0], Math.max(Y0, lerp(30, Y0, ent(inv(0.0, 1.1, u)) * 0 + e3(inv(0.0, 1.1, u)))), POUSO[2], -0.5); m().maq.energia(1 - 0.8 * inv(1.0, 1.8, u), t); m().maq.girar(40 + u * 4); m().maq.descargas(t, (1 - inv(1.0, 1.6, u)) * 0.8); m().maq.tela(2025, false, t);
    vivos(t, { reage: inv(0.2, 0.8, u) });
    const ar = m().aneisEnc[0]; ar.visible = u > 1.05; const q2 = inv(1.05, 2.3, u); ar.position.set(POUSO[0], Y0 + 0.05, POUSO[2]); ar.scale.setScalar(0.5 + q2 * 9); ar.material.opacity = 0.8 * (1 - q2);
    if (u < 1.2) sentarHeroi(); else { const sai = inv(1.3, 2.5, u); heroi(lerp(POUSO[0] + 1.8, HT[0] - 1.2, suave(sai)), Y0, lerp(POUSO[2] - 0.2, HT[2] + 0.2, suave(sai)), lerp(-1.6, 0.0, suave(sai)), 'Andar', u * 1.1, 'sorriso', 0.5); m().arma.visible = true; const a = hero(); a.ikBraco('D', a.grupo.position.clone().add(V(0, 1.15, 0.0)).add(V(Math.sin(a.grupo.rotation.y) * 0.3 - 0.1, 0, Math.cos(a.grupo.rotation.y) * 0.3)), V(1, -0.6, 0)); a.grupo.updateMatrixWorld(true); const p = a.pos('MaoD', V()); m().arma.position.copy(p).add(V(0, 0.02, 0.06)); m().arma.quaternion.copy(a.grupo.quaternion); }
    const k = suave(u / 2.5);
    camara({ pos: [lerp(-9, -6.5, k), lerp(0.7, 1.5, k), lerp(3.5, 5.6, k)], alvo: [POUSO[0], lerp(5, 1.8, Math.min(1, k * 2)), POUSO[2]], fov: lerp(60, 50, k), t, tr: u > 1.0 && u < 1.5 ? 0.9 : 0.05 });
  }, { efeito: (u) => ({ subs: 3, obturador: 0.45, flash: u > 1.05 && u < 1.2 ? 0.5 : 0, flashCor: '220,240,255', tintas: selo('UM DIA ANTES', '#ffd84a') }) });

  // ---- encolhimento: cada pessoa viva é atingida em TS[i]: reage, brilha, anel azul e vira formiguinha (olhando para cima)
  const encolher = (t, { ocultar = [], olharPara = null } = {}) => {
    for (let i = 0; i < 16; i++) {
      if (ocultar.includes(i)) continue;
      const [x, z, yaw] = LV[i], a = pool(i), ts = TS[i], s = clamp((t - ts) / 0.55), es = lerp(1, MS, suave(s)), anel = m().aneisEnc[i + 0], fl = m().flashEnc[i];
      if (t < ts - 0.3) { emPeFraco(a, x, Y0, z, yaw, t, i * 0.9, 'medo', 0.7); }
      else if (t < ts + 0.55) { a.grupo.visible = true; a.colocar(x, Y0, z, yaw); a.anim('Assustado', (t - ts + 0.3) * 1.2); a.rosto({ expressao: 'grito', forca: 0.7, piscar: 0 }); a.atualizarRosto(); dimensionar(a, es); }
      else { a.grupo.visible = true; a.colocar(x, Y0, z, yaw); a.anim('Parado', t + i); a.rosto({ expressao: 'surpresa', forca: 0.8, piscar: 0 }); a.atualizarRosto(); dimensionar(a, MS); if (olharPara) { a.olhar(olharPara, { forca: 1 }); a.atualizarRosto(); } }
      if (t >= ts - 0.05 && t < ts + 1.0) { const q = inv(ts - 0.05, ts + 1.0, t); anel.visible = true; anel.position.set(x, Y0 + 0.02, z); anel.scale.setScalar(0.3 + q * 1.8); anel.material.opacity = 0.9 * (1 - q); fl.visible = true; fl.position.set(x, Y0 + 0.9 * (1 - s) + 0.01, z); fl.scale.setScalar(2.6 * (1 - 0.6 * q)); fl.material.opacity = 0.95 * (1 - q); }
      if (t < ts - 0.3 || t >= ts + 0.55) dimensionar(a, t < ts ? 1 : MS);
      if (t < ts - 0.3) dimensionar(a, 1);
    }
  };
  const heroiAtira = (t, alvoP, carga) => {
    const a = hero(); a.grupo.visible = true; const dx = alvoP.x - HT[0], dz = alvoP.z - HT[2], yaw = Math.atan2(dx, dz);
    a.colocar(HT[0], HT[1], HT[2], yaw); a.anim('Parado', t * 0.5); a.rosto({ expressao: 'sorriso', forca: 0.7, piscar: 0 }); a.atualizarRosto(); a.grupo.updateMatrixWorld(true);
    const ombro = a.pos('BracoD', V()), dir = alvoP.clone().setY(1.25).sub(ombro).normalize(); a.ikBraco('D', ombro.clone().addScaledVector(dir, 0.5), V(1, -0.7, 0)); a.grupo.updateMatrixWorld(true);
    const mao = a.pos('MaoD', V()), g = m().arma; g.visible = true; g.position.copy(mao).addScaledVector(dir, 0.07).add(V(0, -0.02, 0)); g.lookAt(g.position.clone().add(dir)); m().armaCarga(carga);
    return { dir, boca: g.localToWorld(V(0, 0.02, 0.36)) };
  };
  const feixe = (boca, alvo, t, ligado) => { const r = m().raio, im = m().impacto; r.visible = ligado; im.visible = ligado; if (!ligado) return; const dir = alvo.clone().sub(boca), Lg = dir.length(); r.position.copy(boca).addScaledVector(dir, 0.5); const w = 1 + 0.35 * Math.sin(t * 70); r.scale.set(w, Lg, w); r.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize()); im.position.copy(alvo); im.scale.setScalar(0.9 + 0.3 * Math.sin(t * 60)); im.material.opacity = 0.95; };

  // câmera "over the shoulder": atrás e ao lado do ombro da arma (direito), olhando por cima dele para a multidão; o corpo e a arma ficam à vista
  const ots = (dir0, { lado = 0.62, atras = 1.2, alto = 0.3, mira = 4.5, dy = -0.12, ao = -0.15 } = {}) => {
    const cab = hero().pos('Cabeca', V()), d = dir0.clone().setY(0).normalize(), dr = V(-d.z, 0, d.x);
    return { pos: [cab.x - d.x * atras + dr.x * lado, cab.y + alto, cab.z - d.z * atras + dr.z * lado], alvo: [cab.x + d.x * mira + dr.x * ao, cab.y + dy, cab.z + d.z * mira + dr.z * ao] };
  };
  // 5b: macro no cano da arma carregando e disparando (câmera atrás do braço, olhando ao longo do cano)
  plano('atira1', 2.0, 'seca', (u, t) => {
    secoBase(); const alvoP = V(LV[ALVO2][0], 1.0, LV[ALVO2][1]);
    vivos(t, { ocultar: [] });
    const r = heroiAtira(t, alvoP, suave(u / 1.2)); const disp = u > 1.15;
    feixe(r.boca, alvoP, t, disp);
    const k = suave(u / 2.0), c = ots(r.dir, { lado: lerp(0.85, 1.0, k), atras: lerp(1.9, 2.3, k), alto: lerp(0.45, 0.55, k), mira: 4.0, dy: -0.35, ao: -0.7 });
    camara({ pos: c.pos, alvo: c.alvo, fov: lerp(48, 52, k), t, near: 0.03, tr: disp ? 0.25 : 0.04 });
  }, { efeito: (u) => ({ subs: 2, flash: u > 1.15 && u < 1.28 ? 0.35 : 0, flashCor: '150,210,255' }) });

  // 5c: o raio atinge uma pessoa: ela vira formiguinha; a câmera desce junto até o nível do chão, olhando para ela e o gigante atrás
  plano('atira2', 2.5, 'seca', (u, t) => {
    secoBase(); const [px, pz] = [LV[ALVO2][0], LV[ALVO2][1]], alvoP = V(px, 1.0, pz);
    encolher(t, { olharPara: V(HT[0], 1.6, HT[2]) });
    const r = heroiAtira(t, alvoP, 1), fogo = t > TS[ALVO2] - 0.5 && t < TS[ALVO2] + 0.45; feixe(r.boca, alvoP.clone().setY(lerp(1.0, 0.35, suave(inv(TS[ALVO2], TS[ALVO2] + 0.55, t)))), t, fogo);
    const q = suave5(inv(TS[ALVO2] - 33 + 0.05, 2.45, u)), dist = lerp(2.5, 0.28, q), alt = lerp(1.25, Y0 + 0.035, q), ang = lerp(-0.7, -0.35, q);
    camara({ pos: [px + Math.sin(ang) * dist, alt, pz - Math.cos(ang) * dist], alvo: [px, lerp(1.0, Y0 + 0.022, q), pz], fov: lerp(46, 40, q), t, near: 0.008, tr: fogo ? 0.2 : 0.04 });
  }, { efeito: () => ({ subs: 3, obturador: 0.45 }) });

  // 5d: o raio varre a multidão: todos encolhem em cascata; a câmera sobe revelando a praça com formiguinhas
  plano('atira3', 2.5, 'seca', (u, t) => {
    secoBase(); encolher(t, { olharPara: V(HT[0], 1.6, HT[2]) });
    const idx = ORDEM.findIndex(p => t < TS[p] + 0.3), cur = idx < 0 ? null : ORDEM[idx], alvoP = cur === null ? V(LV[ORDEM[15]][0], 1, LV[ORDEM[15]][1]) : V(LV[cur][0], 1.0, LV[cur][1]);
    const r = heroiAtira(t, alvoP, 1), fogo = cur !== null && t > TS[ORDEM[0]] - 0.3 && t < TS[ORDEM[15]] + 0.3; feixe(r.boca, alvoP.clone().setY(0.6), t, fogo);
    const k = suave(u / 2.5), base = V(1.4 - HT[0], 0, 11.4 - HT[2]), c = ots(base, { lado: lerp(1.0, 0.7, k), atras: lerp(2.2, 2.6, k), alto: lerp(0.5, 0.8, k), mira: 5.0, dy: lerp(-0.35, -0.55, k), ao: -0.45 });
    camara({ pos: c.pos, alvo: c.alvo, fov: lerp(52, 56, k), t, tr: 0.1, near: 0.03 });
  }, { efeito: () => ({ subs: 3, obturador: 0.45 }) });

  // ============================================================================================================= 6) CIDADE MINIATURA
  const pistaPos = (i, t, vel = 0.05) => { const p = PISTAS[i], per = p.len * 2, s = ((t * vel + p.f * per) % per), ida = s < p.len, d = ida ? s : per - s; const lx = p.ax + p.dx * d, lz = p.az + p.dz * d; const w = m().mini.localToWorld(V(lx, 0, lz)); const dirx = (ida ? 1 : -1) * p.dx, dirz = (ida ? 1 : -1) * p.dz; return { x: w.x, z: w.z, yaw: Math.atan2(dirx, dirz), dist: t * vel + p.f * per }; };
  const miniAndar = (i, t, vel = 0.05) => { const a = pool(i), q = pistaPos(i, t, vel); dimensionar(a, MS); a.grupo.visible = true; a.colocar(q.x, MC[1], q.z, q.yaw); a.anim('Andar', q.dist / Math.max(1e-6, a.velocidade('Andar'))); a.rosto({ expressao: 'sorriso', forca: 0.5, piscar: 0 }); a.atualizarRosto(); a.grupo.updateMatrixWorld(true); return a; };
  const macro = (cx = MC[0], cz = MC[2]) => { m().sombraPerto(cx, cz, 0.9); };
  const miniBase = () => { m().mostrar('seca'); macro(); };

  // 6a: ele constrói a cidade (peças surgem com brilho); as pessoas já caminham pelas ruas; câmera em órbita rasa
  plano('constroi', 3.5, 'seca', (u, t) => {
    miniBase(); m().constroi(clamp(u / 2.6));
    for (let i = 0; i < 16; i++) { const q = pistaPos(i, t); const on = inv(0.4 + i * 0.1, 0.9 + i * 0.1, u); if (on > 0.01) { miniAndar(i, t); pool(i).grupo.visible = true; dimensionar(pool(i), MS * on); } else pool(i).grupo.visible = false; }
    heroi(MC[0] + 1.5, Y0, MC[2] - 1.3, -2.3, 'Parado', t * 0.5, 'sorriso', 0.8);
    const a = lerp(0.4, 3.0, suave(u / 3.5));
    camara({ pos: [MC[0] + Math.sin(a) * 0.95, MC[1] + lerp(0.55, 0.22, suave(u / 3.5)), MC[2] + Math.cos(a) * 0.95], alvo: [MC[0], MC[1] + 0.03, MC[2]], fov: 42, t, near: 0.01, tr: 0.04 });
  }, { efeito: () => ({ subs: 2, obturador: 0.3 }) });

  // ---- banana
  const R0 = 0.0215, BY = MC[1] + R0 * 0.99, BYAW = 0.35;
  const bananaPoe = (y = BY, giroExtra = 0) => { const b = m().banana; b.visible = true; b.position.set(MC[0], y, MC[2]); b.rotation.order = 'YXZ'; b.rotation.set(PI / 2, BYAW, giroExtra); b.updateMatrixWorld(true); };
  const bw = (x, y = 0, z = 0) => m().banana.localToWorld(V(x, y, z));
  const curvaBanana = u => { const c = new THREE.CatmullRomCurve3([V(-0.1, 0, 0), V(-0.05, 0.034, 0), V(0.05, 0.044, 0), V(0.1, 0.018, 0)]); return { p: c.getPointAt(u), t: c.getTangentAt(u) }; };
  const pontoCorte = j => { const c = curvaBanana((j + 1) / m().NSEG), w = bw(c.p.x, c.p.y, 0), tw = m().banana.localToWorld(c.p.clone().add(c.t)).sub(w).setY(0).normalize(); return { w, t: tw, n: V(-tw.z, 0, tw.x) }; };
  // fatia j: estado 0 = no lugar, 1 = destacada/rolando/carregada (posição de mundo explícita)
  const fatia = (j, pos = null, yaw = 0) => { const s = m().bananaSeg[j], b = m().banana, mundo = m().heroi.grupo.parent; if (!pos) { if (s.g.parent !== b) b.add(s.g); s.g.position.copy(s.centro); s.g.rotation.set(0, 0, 0); s.g.visible = true; } else { if (s.g.parent !== mundo) mundo.add(s.g); s.g.position.copy(pos); s.g.rotation.set(PI / 2, 0, 0, 'YXZ'); s.g.rotation.y = yaw - PI / 2; s.g.visible = true; } };

  // 6b: a banana gigante cai no cruzamento; as pessoas olham para cima, de queixo caído
  plano('banana', 2.5, 'seca', (u, t) => {
    miniBase(); m().constroi(1); m().bananaReset(); const q = inv(0.2, 1.0, u), y = BY + 0.9 * (1 - q) * (1 - q) * (1 - q), rebote = q >= 1 ? 0.004 * Math.exp(-(u - 1.0) * 8) * Math.abs(Math.sin((u - 1.0) * 22)) : 0;
    bananaPoe(y + rebote, (1 - q) * 0.9);
    for (let i = 0; i < 16; i++) { const ang = i / 16 * 6.283 + 0.4, R = 0.17 + 0.1 * ((i * 7) % 5) / 4, a = pool(i); dimensionar(a, MS); a.grupo.visible = true; a.colocar(MC[0] + Math.cos(ang) * R * 1.2, MC[1], MC[2] + Math.sin(ang) * R * 0.9, Math.atan2(-Math.cos(ang), -Math.sin(ang))); a.anim('Parado', t * 0.4 + i); a.olhar(V(MC[0], 0.3, MC[2]), { forca: 1.0 }); a.rosto({ expressao: 'surpresa', forca: 0.9, piscar: 0 }); a.atualizarRosto(); a.grupo.updateMatrixWorld(true); }
    const k = suave(u / 2.5);
    camara({ pos: [MC[0] - lerp(0.36, 0.2, k), MC[1] + lerp(0.03, 0.04, k), MC[2] + 0.06], alvo: [MC[0], MC[1] + lerp(0.05, 0.04, k) + (u < 0.9 ? 0.1 * (1 - q) : 0), MC[2]], fov: lerp(54, 50, k), t, near: 0.006, tr: u > 0.95 && u < 1.4 ? 0.9 : 0.02 });
  }, { efeito: (u) => ({ subs: 3, obturador: 0.45, flash: u > 0.98 && u < 1.06 ? 0.25 : 0 }) });

  // ---- corte: 3 cortadores, 3 duplas carregando, comilões
  const T_CORTE = [45.7, 47.9, 49.0];                       // instantes em que as fatias 11, 10, 9 se soltam
  const DEST = [[-0.2, 0.0], [0.05, -0.13], [0.15, 0.16]];  // destinos (local da miniatura)
  const ferramenta = (k, a, alvo, t, bate) => { const f = m().ferr[k]; f.visible = true; const mao = a.pos('MaoD', V()); f.position.copy(mao); const dir = alvo.clone().sub(mao).normalize(); f.lookAt(mao.clone().add(dir)); };
  const corteCena = (t, { cameraFn }) => {
    miniBase(); m().constroi(1); bananaPoe(); m().bananaReset();
    // fatias: antes do corte no lugar; depois: caem (0,45 s), esperam, e são carregadas
    for (let c = 0; c < 3; c++) {
      const j = m().NSEG - 1 - c, tc = T_CORTE[c], pc = pontoCorte(j), cairT = clamp((t - tc) / 0.45), fica = pc.w.clone().addScaledVector(pc.t, 0.0).add(V(0, 0, 0));
      if (t < tc) { fatia(j); continue; }
      const sai = pc.w.clone().addScaledVector(pc.t, -0.0);      // posição do centro da fatia (centro entre cortes)
      const centro = m().banana.localToWorld(m().bananaSeg[j].centro.clone());
      const chegam = tc + 0.9, carrega = t > chegam;
      const dst = mundoW(DEST[c][0], 0, DEST[c][1]);
      const yawT = Math.atan2(dst.x - centro.x, dst.z - centro.z);
      const p0 = centro.clone(); p0.y = MC[1] + R0;
      const queda = lerp(centro.y, MC[1] + R0, e3(cairT));
      if (!carrega) { fatia(j, V(centro.x + 0.0, queda, centro.z), BYAW); }
      else { const q = clamp((t - chegam) / 3.2), pos = p0.clone().lerp(dst, suave(q)); pos.y = MC[1] + R0 + 0.006 * Math.sin(Math.min(1, (t - chegam) / 0.4) * PI / 2); fatia(j, pos, yawT); }
    }
    // cortadores 0,1,2 em torno do ponto de corte da fatia em corte atual
    const cur = t < T_CORTE[0] ? 0 : t < T_CORTE[1] ? 1 : 2, jc = m().NSEG - 1 - cur, pc = pontoCorte(jc);
    for (let i = 0; i < 3; i++) {
      const a = pool(i); dimensionar(a, MS); a.grupo.visible = true; const sg = i === 1 ? -1 : 1, desl = (i - 1) * 0.015;
      const pos = pc.w.clone().addScaledVector(pc.n, sg * 0.032).addScaledVector(pc.t, -desl * 1.3 + 0.02); pos.y = MC[1];
      const face = pc.w.clone().addScaledVector(pc.t, 0.0); a.colocar(pos.x, pos.y, pos.z, Math.atan2(face.x - pos.x, face.z - pos.z)); a.anim('Parado', t * 0.5 + i); a.rosto({ expressao: 'raiva', forca: 0.5, piscar: 0 }); a.atualizarRosto(); a.grupo.updateMatrixWorld(true);
      const ph = t * 6.5 + i * 2.1, bate = 0.5 + 0.5 * Math.sin(ph), alvo = pc.w.clone().addScaledVector(pc.n, sg * 0.015).addScaledVector(pc.t, -desl); alvo.y = MC[1] + 0.006 + 0.014 * (0.15 + 0.85 * (bate > 0.5 ? 1 : bate * 2) * 0.8);
      const ombroD = a.pos('BracoD', V()); a.ikBraco('D', alvo.clone().addScaledVector(pc.n, sg * 0.004), V(0, 1, 0)); a.ikBraco('E', alvo.clone().add(V(0, -0.002, 0)).addScaledVector(pc.n, sg * 0.002), V(0, 1, 0)); a.grupo.updateMatrixWorld(true);
      ferramenta(i, a, pc.w.clone().setY(MC[1] + 0.01), t, bate);
    }
    // duplas: 3,4 / 5,6 / 7,8 pegam a fatia (c) e levam até o destino
    for (let c = 0; c < 3; c++) {
      const j = m().NSEG - 1 - c, tc = T_CORTE[c], centro = m().banana.localToWorld(m().bananaSeg[j].centro.clone()), dst = mundoW(DEST[c][0], 0, DEST[c][1]), chegam = tc + 0.9;
      const q = clamp((t - chegam) / 3.2), ida = t > chegam, yawT = Math.atan2(dst.x - centro.x, dst.z - centro.z), dir = V(Math.sin(yawT), 0, Math.cos(yawT)), perp = V(dir.z, 0, -dir.x);
      const base = centro.clone().lerp(dst, suave(ida ? q : 0)); base.y = MC[1];
      const prep = clamp(inv(tc - 1.0, chegam, t));                         // chegam correndo até o ponto de corte
      for (let s = 0; s < 2; s++) {
        const a = pool(3 + c * 2 + s), sg = s === 0 ? 1 : -1; dimensionar(a, MS); a.grupo.visible = true;
        const origem = centro.clone().addScaledVector(perp, sg * 0.15).addScaledVector(dir, -0.18); origem.y = MC[1];
        const alvoPos = base.clone().addScaledVector(perp, sg * (R0 + 0.006)); alvoPos.y = MC[1];
        const pos = ida || prep >= 1 ? alvoPos : origem.clone().lerp(alvoPos, suave(prep)); const mov = ida ? q < 1 : prep < 1;
        const vel = (ida ? (centro.distanceTo(dst) / 3.2) : origem.distanceTo(alvoPos) / Math.max(0.1, chegam - (tc - 1.0)));
        a.colocar(pos.x, MC[1], pos.z, ida ? yawT : Math.atan2(alvoPos.x - origem.x, alvoPos.z - origem.z)); if (!ida && prep >= 1) a.grupo.rotation.y = Math.atan2(-sg * perp.x, -sg * perp.z);
        a.anim(mov ? 'Andar' : 'Parado', mov ? (t * vel) / Math.max(1e-6, a.velocidade('Andar')) : t * 0.4); a.rosto({ expressao: 'sorriso', forca: 0.6, piscar: 0 }); a.atualizarRosto(); a.grupo.updateMatrixWorld(true);
        if (ida || prep >= 1) { const alt = MC[1] + R0 + 0.004; const alvoMao = V(pos.x - sg * perp.x * 0.006, alt, pos.z - sg * perp.z * 0.006); a.ikBraco('D', alvoMao, V(0, 1, 0)); a.ikBraco('E', alvoMao.clone().addScaledVector(dir, 0.004), V(0, 1, 0)); a.grupo.updateMatrixWorld(true); }
      }
    }
    // comilões 9..12 de frente para a banana, pedacinho na mão que sobe à boca
    for (let i = 9; i < 13; i++) {
      const ang = 0.4 + (i - 9) * 1.4 + 3.2, R = 0.09 + 0.012 * (i - 9), a = pool(i); dimensionar(a, MS); a.grupo.visible = true;
      const px = MC[0] + Math.cos(ang) * R * 1.3, pz = MC[2] + Math.sin(ang) * R; a.colocar(px, MC[1], pz, Math.atan2(-Math.cos(ang), -Math.sin(ang)) + 0.4 * Math.sin(i)); a.anim('Parado', t * 0.5 + i); a.rosto({ expressao: 'sorriso', forca: 0.9, piscar: 0 }); a.atualizarRosto(); a.grupo.updateMatrixWorld(true);
      const cab = a.pos('Cabeca', V()), fr = V(Math.sin(a.grupo.rotation.y), 0, Math.cos(a.grupo.rotation.y)), cic = (t * 1.6 + i * 0.37) % 1, sobe = suave(cic < 0.5 ? cic * 2 : 2 - cic * 2);
      const boca = cab.clone().addScaledVector(fr, 0.0032).add(V(0, -0.0012, 0)), peito = a.pos('Peito', V()).addScaledVector(fr, 0.005);
      const mao = peito.clone().lerp(boca, sobe); a.ikBraco('D', mao, V(0, -1, 0.2)); a.grupo.updateMatrixWorld(true);
      const pd = m().pedacinhos[i - 9]; pd.visible = true; pd.position.copy(a.pos('MaoD', V())).add(V(0, 0.001, 0)); pd.scale.setScalar(cic > 0.45 && cic < 0.55 ? 0.5 : 1);
    }
    // alegres 13..15 pulando ao fundo
    for (let i = 13; i < 16; i++) { const a = pool(i); dimensionar(a, MS); a.grupo.visible = true; const ang = 1.0 + (i - 13) * 2.0, R = 0.2; a.colocar(MC[0] + Math.cos(ang) * R * 1.3, MC[1] + 0.003 * Math.abs(Math.sin(t * 7 + i)), MC[2] + Math.sin(ang) * R, Math.atan2(-Math.cos(ang), -Math.sin(ang))); a.anim('Pular', t * 0.8 + i * 0.3); a.rosto({ expressao: 'sorriso', forca: 1, piscar: 0 }); a.atualizarRosto(); }
    cameraFn();
  };
  // 6c: câmera macro rodando em volta do ponto de corte: os machados batem na banana
  plano('corta1', 3.0, 'seca', (u, t) => {
    corteCena(t, { cameraFn: () => { const pc = pontoCorte(m().NSEG - 1), a = lerp(2.2, 0.4, suave(u / 3.0)); camara({ pos: [pc.w.x + Math.sin(a) * 0.17, lerp(0.17 + 0.03, 0.17 + 0.075, suave(u / 3.0)), pc.w.z + Math.cos(a) * 0.17], alvo: [pc.w.x, MC[1] + 0.012, pc.w.z], fov: 42, t, near: 0.008, tr: 0.02 }); } });
  }, { efeito: () => ({ subs: 3, obturador: 0.4 }) });
  // 6d: plano mais aberto e baixo: as duplas saem carregando as fatias entre as casas
  plano('corta2', 3.0, 'seca', (u, t) => {
    corteCena(t, { cameraFn: () => { const k = suave(u / 3.0); camara({ pos: [MC[0] - lerp(0.5, 0.28, k), MC[1] + lerp(0.035, 0.06, k), MC[2] + lerp(0.05, 0.1, k)], alvo: [MC[0] + lerp(0.0, -0.05, k), MC[1] + 0.025, MC[2] - 0.02], fov: 52, t, near: 0.008, tr: 0.02 }); } });
  }, { efeito: () => ({ subs: 3, obturador: 0.4 }) });

  // ============================================================================================================= 7) FINAL: A MAÇÃ
  const fundoFinal = (t) => {
    miniBase(); m().constroi(1); bananaPoe(); m().bananaReset();
    for (let c = 0; c < 3; c++) { const j = m().NSEG - 1 - c; fatia(j, mundoW(DEST[c][0], 0, DEST[c][1]).setY(MC[1] + R0), c); }
  };
  const HF = [MC[0] - 1.9, Y0, MC[2] - 1.7], CF = [MC[0] + 0.1, MC[2] + 0.1];   // o gigante fica "a noroeste" para a luz bater de frente nele
  // 7a: de baixo, entre as pessoinhas: o gigante sorri com a arma numa mão e a maçã na outra
  plano('final1', 3.0, 'seca', (u, t) => {
    fundoFinal(t);
    for (let i = 0; i < 16; i++) { const a = pool(i), ang = 0.9 + i * 0.37, R = 0.06 + 0.05 * ((i * 5) % 4), px = CF[0] + 0.12 + Math.cos(ang) * R, pz = CF[1] + 0.12 + Math.sin(ang) * R * 0.7; dimensionar(a, MS); a.grupo.visible = true; a.colocar(px, MC[1], pz, Math.atan2(HF[0] - px, HF[2] - pz)); a.anim('Parado', t * 0.5 + i); a.olhar(V(HF[0], 1.6, HF[2]), { forca: 1.0 }); a.rosto({ expressao: i % 3 === 0 ? 'surpresa' : 'sorriso', forca: 0.8, piscar: 0 }); a.atualizarRosto(); }
    const yaw = Math.atan2(CF[0] - HF[0], CF[1] - HF[1]), a = heroi(HF[0], HF[1], HF[2], yaw, 'Parado', t * 0.4, 'sorriso', 1.0);
    const fr = V(Math.sin(yaw), 0, Math.cos(yaw)), dr = V(fr.z, 0, -fr.x), ombroE = a.pos('BracoE', V()), ombroD = a.pos('BracoD', V());
    const alvoE = ombroE.clone().addScaledVector(fr, 0.5).add(V(0, -0.22 + 0.03 * Math.sin(t * 1.5), 0)).addScaledVector(dr, 0.36), alvoD = ombroD.clone().addScaledVector(fr, 0.3).add(V(0, -0.3, 0)).addScaledVector(dr, -0.12);
    a.ikBraco('E', alvoE, V(0.3, -1, -0.2)); a.ikBraco('D', alvoD, V(-0.3, -1, 0)); a.grupo.updateMatrixWorld(true);
    const mE = a.pos('MaoE', V()), mD = a.pos('MaoD', V()), mc = m().maca; mc.visible = true; mc.position.copy(mE).add(V(0, m().RMACA * 0.85, 0)).addScaledVector(fr, 0.02); mc.rotation.set(0, t * 0.5, 0);
    const g = m().arma; g.visible = true; g.position.copy(mD).add(V(0, 0.03, 0)); g.quaternion.setFromUnitVectors(V(0, 0, 1), fr.clone().multiplyScalar(0.5).add(V(0, 1, 0)).normalize()); m().armaCarga(0.5);
    const k = suave(u / 3.0), tg = V(HF[0], lerp(0.85, 1.25, k), HF[2]);
    camara({ pos: [CF[0] - 0.03 * k, MC[1] + lerp(0.3, 0.4, k), CF[1] - 0.03 * k], alvo: tg.toArray(), fov: lerp(60, 54, k), t, near: 0.01, tr: 0.02 });
  }, { efeito: (u) => ({ subs: 3 }) });

  // 7b: ele baixa a maçã ao lado da casinha: a maçã é maior que a casa. Plano lateral, pessoas ao lado para escala
  plano('final2', 3.5, 'seca', (u, t) => {
    fundoFinal(t);
    const casa = m().casaRef, pc = m().miniLocal(5, 1), aloc = V(0.216, 0, -0.095), rm = m().RMACA;
    const alvoMac = mundoW(aloc.x, 0, aloc.z); alvoMac.y = MC[1] + rm * 0.9; const descer = suave5(inv(0.2, 1.7, u));
    const mac = m().maca; mac.visible = true; mac.position.set(alvoMac.x, lerp(alvoMac.y + 0.55, alvoMac.y, descer), alvoMac.z); mac.rotation.set(0, 0.5 + (1 - descer) * 1.5, 0);
    const ycasa = mundoW(pc.x, 0, pc.z);
    for (let i = 0; i < 16; i++) { const a = pool(i), cf = i % 4, cl = [[-0.18, 0.12], [-0.12, 0.17], [0.26, 0.15], [0.32, 0.12]][cf], px = mundoW(aloc.x, 0, aloc.z).x + cl[0] + 0.02 * (i >> 2), pz = mundoW(aloc.x, 0, aloc.z).z + cl[1] * 0 + 0.05 + 0.02 * (i >> 2); dimensionar(a, MS); a.grupo.visible = true; a.colocar(px, MC[1], pz, Math.atan2(alvoMac.x - px, alvoMac.z - pz)); a.anim('Parado', t * 0.5 + i); a.olhar(V(alvoMac.x, alvoMac.y + 0.05, alvoMac.z), { forca: 1 }); a.rosto({ expressao: 'surpresa', forca: 0.9, piscar: 0 }); a.atualizarRosto(); }
    // mãos do gigante largando a maçã (só uma sombra do braço entra de cima: não precisa do corpo)
    const centro = mundoW(aloc.x, 0, aloc.z);
    const k = suave(u / 3.5);
    camara({ pos: [centro.x - lerp(0.72, 0.56, k), MC[1] + lerp(0.065, 0.05, k), centro.z + 0.03], alvo: [centro.x, MC[1] + lerp(0.055, 0.05, k), centro.z - 0.055], fov: lerp(50, 46, k), t, near: 0.008, tr: 0.02 });
  }, { efeito: (u) => ({ subs: 3, tintas: cartao(u / 3.5) }) });
}
