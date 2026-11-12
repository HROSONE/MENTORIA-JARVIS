// Cenas: mundo seco, viagem no tempo, roubo da arma no futuro, encolhimento, cidade miniatura, banana, maçã.
import * as THREE from 'three';
import { clamp, lerp, suave, suave5, inv } from './util.js';
import { S, V, PI, plano, camara, lerpV } from './base.js';
import { OFF, MC, PC, MS } from './mundo.js';

const NX = OFF.nave[0], TX = OFF.tunel[0], FX = OFF.futuro[0], LX = OFF.lab[0];
function selo(txt, cor = '#ffd84a') {
  return (g, w, h) => { g.save(); g.textAlign = 'center'; g.font = `bold ${w * 0.05}px "DejaVu Sans", sans-serif`; const tw = g.measureText(txt).width + w * 0.07, x = w / 2 - tw / 2, y = h * 0.06, a = w * 0.08;
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.beginPath(); g.roundRect(x, y, tw, a, a / 2); g.fill(); g.strokeStyle = cor; g.lineWidth = 3; g.stroke(); g.fillStyle = cor; g.fillText(txt, w / 2, y + a * 0.7); g.restore(); };
}
function ano(u) { return (g, w, h) => { const a = Math.round(2026 + (2500 - 2026) * suave(clamp(u))); g.save(); g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, h * 0.80, w, w * 0.2); g.fillStyle = '#5ff0ff'; g.font = `bold ${w * 0.15}px "DejaVu Sans Mono", monospace`; g.fillText(String(a), w / 2, h * 0.80 + w * 0.16); g.restore(); }; }
function cartao(u) { const a = clamp(inv(0.5, 0.85, u)); return (g, w, h) => { if (a < 0.01) return; g.save(); g.globalAlpha = a; g.textAlign = 'center'; const gr = g.createLinearGradient(0, h * 0.62, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.7)'); g.fillStyle = gr; g.fillRect(0, h * 0.62, w, h * 0.38); g.fillStyle = '#e9e4cf'; g.font = `bold ${w * 0.09}px "DejaVu Sans", sans-serif`; g.fillText('HRYZ ANIMATION', w / 2, h * 0.865); g.fillStyle = '#e0b04a'; g.font = `bold ${w * 0.058}px "DejaVu Sans", sans-serif`; g.fillText('SE INSCREVE', w / 2, h * 0.925); g.restore(); }; }

export function montarPlanos() {
  const m = () => S.m, h = () => S.m.heroi;
  const heroi = (x, y, z, giro, clipe, tc, expr = 'neutro', fr = 0.4) => { const a = h(); a.grupo.visible = true; a.colocar(x, y, z, giro); a.anim(clipe, tc); a.rosto({ expressao: expr, forca: fr, piscar: 0 }); a.atualizarRosto(); a.grupo.updateMatrixWorld(true); return a; };
  const segurarArma = () => { const a = h(), g = m().arma; g.visible = true; a.grupo.updateMatrixWorld(true); const p = a.pos('MaoD', V()); g.position.copy(p); g.quaternion.copy(a.grupo.quaternion); g.translateZ(0.09); g.translateY(0.02); };
  const seca = (t, enc = 0, cam = 0) => { m().mostrar('seca'); m().multidao(enc, cam, t); m().naveS.visible = true; m().jarras.forEach(j => { j.visible = true; }); };

  // 1) mundo sem água: gente caída, jarras vazias
  plano('seca1', 3.5, 'seca', (u, t) => {
    seca(t); const k = suave(u / 3.5);
    camara({ pos: [lerp(5, 0.6, k), lerp(0.55, 0.9, k), lerp(2.5, 6.4, k)], alvo: [lerp(-1, 0, k), 0.35, lerp(7, 11, k)], fov: 46, t, tr: 0.15 });
  }, { efeito: () => ({ subs: 2, tintas: selo('FICÇÃO') }) });

  // 2) ele olha em volta e corre para a nave
  plano('seca2', 3.0, 'seca', (u, t) => {
    seca(t); const a = u < 1.1 ? 0 : clamp((u - 1.1) / 1.6), x = lerp(1.5, -6.2, suave(a)), z = lerp(6, 11.5, suave(a));
    heroi(x, 0, z, u < 1.1 ? PI : -1.9, u < 1.1 ? 'Parado' : 'Correr', u * 1.3, u < 1.1 ? 'triste' : 'medo', 0.5);
    const k = suave(u / 3.0);
    camara({ pos: [lerp(5, -1, k), lerp(1.4, 3.4, k), lerp(-3, 0, k)], alvo: [lerp(1.5, -6, k), 1.2, lerp(7, 11.5, k)], fov: 50, t, tr: 0.1 });
  }, { efeito: () => ({ subs: 3, obturador: 0.4 }) });

  // 3) dentro da nave: puxa a alavanca e o contador do tempo dispara
  plano('nave', 4.0, 'nave', (u, t) => {
    m().mostrar('nave'); const pux = suave((u - 1.2) / 0.5);
    m().alavanca.rotation.x = -0.9 * pux; m().ano(2026 + (u > 1.7 ? (u - 1.7) * 210 : 0), u > 1.5); m().janela(t, u > 1.5 ? 1 + (u - 1.5) * 3 : 0.1);
    const a = heroi(NX + 0.4, 0, 0.2, PI, 'Parado', t * 0.3, u < 1.6 ? 'neutro' : 'medo', 0.5);
    const topo = m().alavTopo(); topo.x += 0.0; a.ikBraco('D', topo.clone().add(V(0.05, -0.05, 0.05)), V(1, -0.5, 0.4)); m().luzNave.intensity = 22 + (u > 1.5 ? 20 * Math.sin(t * 20) : 0);
    const k = suave(u / 4.0);
    camara({ pos: [NX + lerp(2.6, 1.7, k), lerp(1.9, 1.7, k), lerp(3.4, 2.4, k)], alvo: [NX, lerp(1.2, 1.4, k), -2.4], fov: 46, t, tr: u > 1.7 ? 0.5 : 0.1 });
  }, { efeito: (u) => ({ subs: 2, flash: u > 1.3 && u < 1.5 ? 0.5 : 0 }) });

  // 4) túnel do tempo: anéis e a nave voando; o ano sobe até 2500
  plano('tunel', 4.0, 'tunel', (u, t) => {
    m().mostrar('tunel'); m().aneisT.forEach((r, i) => { r.position.z = -((i * 7 + t * 70) % 322) + 20; }); m().naveT.position.set(0, 0, 0); m().naveT.rotation.z = t * 0.4;
    const ang = lerp(0, 1.4, suave(u / 4.0));
    camara({ pos: [TX + Math.sin(ang) * 9, 1.5 + Math.sin(ang) * 2, Math.cos(ang) * 9], alvo: [TX, 0, -4], fov: 55, t, tr: 0.4 });
  }, { efeito: (u) => ({ subs: 4, obturador: 0.6, tintas: ano(u / 3.6) }) });

  // 5) o futuro: voo baixo entre prédios neon e carros voadores
  plano('futuro', 3.5, 'futuro', (u, t) => {
    m().mostrar('futuro'); m().carros.forEach(c => { const q = c.userData; c.position.set(FX + q.x0 + (q.v * t) % 220 - 110, q.y, q.z); c.rotation.y = q.v > 0 ? 0 : PI; });
    const k = suave(u / 3.5);
    camara({ pos: [FX + lerp(-24, 4, k), lerp(46, 9, k), lerp(-40, 18, k)], alvo: [FX + 8, lerp(10, 5, k), 34], fov: 58, t, tr: 0.2 });
  }, { efeito: () => ({ subs: 3, obturador: 0.45, flash: u => 0, tintas: selo('ANO 2500', '#5ff0ff') }) });

  // 6) laboratório: ele rouba a arma de encolhimento, alarme vermelho
  plano('lab', 4.5, 'lab', (u, t) => {
    m().mostrar('lab'); const dom = m().domo; dom.position.y = 1.1 + 1.2 * suave((u - 1.6) / 0.5);
    const al = u > 2.0; m().alarme.intensity = al ? 25 * (0.5 + 0.5 * Math.sin(t * 14)) : 0;
    const a = u < 1.6 ? heroi(LX + 0, 0, lerp(5, -2.4, suave(u / 1.6)), 0 + PI, 'Andar', u * 1.2, 'neutro', 0.3) : u < 2.4 ? heroi(LX, 0, -2.4, PI, 'Parado', t * 0.4, 'sorriso', 0.6) : heroi(LX, 0, lerp(-2.4, 5.5, suave((u - 2.4) / 1.6)), 0, 'Correr', u * 1.5, 'sorriso', 0.7);
    if (u < 1.9) { m().arma.visible = true; m().arma.position.set(LX, 1.35, -4); m().arma.rotation.set(0, 0, 0); } else { const mao = a.pos('MaoD', V()); if (u < 2.4) a.ikBraco('D', V(LX + 0.05, 1.3, -3.9), V(1, -0.5, 0.2)); segurarArma(); }
    const k = suave(u / 4.5);
    camara({ pos: [LX + lerp(3.5, -3.5, k), lerp(1.9, 2.4, k), lerp(1.5, 4.2, k)], alvo: [LX, 1.1, lerp(-3.4, -0.5, k)], fov: 52, t, tr: al ? 0.5 : 0.1 });
  }, { efeito: (u) => ({ subs: 3, flash: u > 1.95 && u < 2.1 ? 0.35 : 0 }) });

  // 7) de volta ao presente: a nave pousa e ele desce com a arma
  plano('volta', 2.5, 'seca', (u, t) => {
    seca(t); m().naveS.position.set(-8, lerp(36, 0, suave(u / 1.4)), 12); m().naveS.visible = true;
    const a = heroi(lerp(-5.5, -2.5, suave(inv(1.3, 2.5, u))), 0, 10.8, -1.2, u > 1.3 ? 'Andar' : 'Parado', u * 1.2, 'sorriso', 0.5); segurarArma();
    const k = suave(u / 2.5);
    camara({ pos: [lerp(-14, -4, k), lerp(1.2, 1.6, k), lerp(16, 5, k)], alvo: [-7, m().naveS.position.y * 0.6 + 1.2, 11], fov: 56, t, tr: u > 1.2 && u < 1.8 ? 1.5 : 0.1 });
  }, { efeito: (u) => ({ subs: 3, flash: u > 1.35 && u < 1.5 ? 0.35 : 0 }) });

  // 8) ele atira: o raio azul encolhe as pessoas até o tamanho de uma formiga
  plano('atira', 5.5, 'seca', (u, t) => {
    const enc = clamp((u - 0.9) / 4.2); seca(t, enc, 0);
    const alvoI = Math.min(m().N - 1, Math.floor(enc * m().N * 1.05)), alvo = m().posPessoa(alvoI, enc, 0).add(V(0, 0.3, 0));
    const a = heroi(-1.5, 0, -1.5, Math.atan2(alvo.x + 1.5, alvo.z + 1.5), 'Parado', t * 0.5, 'sorriso', 0.6);
    a.ikBraco('D', V(-1.5 + Math.sin(a.grupo.rotation.y) * 0.5, 1.35, -1.5 + Math.cos(a.grupo.rotation.y) * 0.5), V(1, -0.4, 0.3)); a.grupo.updateMatrixWorld(true); segurarArma();
    if (enc > 0 && enc < 1) { const bocal = m().arma.localToWorld(V(0, 0.02, 0.32)); const dir = alvo.clone().sub(bocal), L = dir.length(); const r = m().raio; r.visible = true; r.position.copy(bocal).addScaledVector(dir, 0.5); r.scale.set(1 + 0.5 * Math.sin(t * 60), L, 1 + 0.5 * Math.sin(t * 60)); r.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize());
      m().faiscas.forEach((f, i) => { const j = Math.max(0, alvoI - i); f.visible = true; f.position.copy(m().posPessoa(j, enc, 0)).add(V(0, 0.4 * (1 - i / 10), 0)); f.material.opacity = 0.9 * (1 - i / 10); f.scale.setScalar(1.6 - i * 0.1); }); }
    const k = suave(u / 5.5);
    camara({ pos: [lerp(-3.5, 6, k), lerp(1.5, 2.4, k), lerp(-4.5, 2, k)], alvo: [0, 0.6, lerp(8, 10, k)], fov: 48, t, tr: 0.2 });
  }, { efeito: (u) => ({ subs: 3, obturador: 0.4 }) });

  // 9) ele constrói a cidade miniatura e as pessoas caminham para lá
  plano('constroi', 4.5, 'seca', (u, t) => {
    seca(t, 1, suave(inv(1.5, 4.4, u))); m().constroi(clamp(u / 3.4));
    const a = heroi(MC[0] + 1.6, 0, MC[2] - 1.4, -2.2, 'Parado', t * 0.5, 'sorriso', 0.7);
    const ang = lerp(0.3, 3.2, suave(u / 4.5));
    camara({ pos: [MC[0] + Math.sin(ang) * 1.5, lerp(0.7, 0.45, u / 4.5), MC[2] + Math.cos(ang) * 1.5], alvo: [MC[0], 0.05, MC[2]], fov: 42, t, near: 0.01 });
  }, { efeito: () => ({ subs: 3, obturador: 0.4 }) });

  // 10) a banana cai no meio da cidade: gigante perto das pessoas
  plano('banana', 3.5, 'seca', (u, t) => {
    seca(t, 1, 1); m().constroi(1); const b = m().banana; b.visible = true; const q = suave(inv(0.3, 1.1, u)); b.position.set(MC[0] + 0.02, lerp(0.9, 0.018, q * q), MC[2]); b.rotation.y = 0.6; b.rotation.z = lerp(0.4, 0, q);
    const k = suave(u / 3.5);
    camara({ pos: [MC[0] - lerp(0.30, 0.20, k), lerp(0.04, 0.025, k), MC[2] + lerp(0.34, 0.22, k)], alvo: [MC[0], lerp(0.04, 0.05, k), MC[2]], fov: 52, t, near: 0.004, tr: u > 1.0 && u < 1.4 ? 1.2 : 0 });
  }, { efeito: () => ({ subs: 3, obturador: 0.4 }) });

  // 11) final: as pessoas olham para cima e veem ele sorrindo, com a arma numa mão e a maçã na outra; ele põe a maçã na cidade
  plano('final', 5.0, 'seca', (u, t) => {
    seca(t, 1, 1); m().constroi(1); m().banana.visible = true; m().banana.position.set(MC[0] + 0.02, 0.018, MC[2]); m().banana.rotation.set(0, 0.6, 0);
    const hx = MC[0] + 1.3, hz = MC[2] - 0.5, a = heroi(hx, 0, hz, -PI / 2 - 0.1, 'Parado', t * 0.4, 'sorriso', 1.0);
    const larga = suave(inv(2.8, 3.8, u)), pos = V(lerp(hx - 0.35, MC[0] - 0.35, larga), lerp(1.15, 0.05, larga), lerp(hz + 0.1, MC[2] + 0.15, larga));
    a.ikBraco('E', pos.clone().add(V(0, 0.05, 0)), V(0, -1, 0.6)); a.ikBraco('D', V(hx - 0.2, 1.1, hz - 0.15), V(1, -0.6, 0.2)); a.grupo.updateMatrixWorld(true); segurarArma();
    const mc = m().maca; mc.visible = true; mc.position.copy(pos).add(V(0, 0.04, 0)); mc.scale.setScalar(1);
    const k = suave(u / 5.0);
    camara({ pos: [MC[0] - lerp(0.05, 0.25, k), 0.035, MC[2] + lerp(0.28, 0.12, k)], alvo: [lerp(MC[0] + 0.9, MC[0] + 0.6, k), lerp(1.0, 0.5, k), lerp(MC[2] - 0.3, MC[2] - 0.15, k)], fov: lerp(46, 58, k), t, near: 0.004 });
  }, { efeito: (u) => ({ subs: 3, tintas: cartao(u / 5.0) }) });
}
