// Cenas do Short (parte 1): o gancho na guarita sob bombardeio e o atirador que perde a luta contra o sono.
import * as THREE from 'three';
import { cam, mundos, scene, renderer } from './motor.js';
import { clamp, lerp, suave, suave5, entra, sai, inv, ruido, mulberry32 } from './util.js';
import { S, Q, V, PI, plano, reset, mostrar, camara, mix3 } from './base.js';
import * as PZ from './poses.js';
import { montarCenas2 } from './cenas2.js';

// ---------------------------------------------------------------- ajudantes de cena (mundo F)
export function F0(t, { h = 1.0, foco = [0, -0.5], fogo = 1, holofotes = true, nevoa = null } = {}) {
  S.F.focar(foco[0], foco[1]); S.F.hora(h, { fogo });
  if (nevoa != null) scene.fog = new THREE.FogExp2(h < 6 || h > 19 ? 0x1a0e0c : 0xb8c0c4, nevoa);
  S.F.lanterna.intensity *= 0.86 + 0.14 * ruido(t * 11, 5);
  S.fx.atualizar(t, cam, { holofotes });
}
export const piscaFogo = t => 0.86 + 0.14 * ruido(t * 11, 5);
export const lerpV = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

// agenda global de explosões, mísseis, aviões e rastros (tempos absolutos do vídeo)
function agendarGuerra() {
  const fx = S.fx, E = fx.eventos, MI = fx.misseis, AV = fx.avioes, RA = fx.rastros;
  const ex = (t, x, z, tam = 2, y = 0) => E.push({ t, x, y, z, tam });
  const missil = (ti, de, para, dur = 0.9, tam = 2.2, arco = 7) => { MI.push({ t: ti - dur, de, para, dur, arco }); ex(ti, para[0], para[2], tam, para[1]); };
  const aviao = (t, de, para, dur, esc = 1.6) => AV.push({ t, de, para, dur, esc });
  const traca = (t, de, para, vel = 220) => RA.push({ t, de, para, vel });
  // ---- gancho (0 a 9 s), em torno da guarita (soldado em x≈0, campo de batalha para -z)
  ex(0.30, -26, -34, 2.4); missil(1.05, [-80, 46, -120], [16, 0, -44], 0.95, 3.0); ex(1.50, -7, -23, 1.5); missil(2.10, [90, 40, -110], [-33, 0, -38], 0.9, 2.6);
  ex(2.55, 32, -31, 2.2); ex(3.00, -44, -58, 3.4); missil(3.55, [-60, 50, -140], [7, 0, -30], 0.95, 2.4); ex(4.05, -17, -21, 1.7); ex(4.45, 27, -52, 3.2);
  missil(5.00, [100, 44, -130], [-3, 0, -28], 0.9, 2.2); ex(5.45, 46, -40, 2.6); ex(5.90, -31, -46, 2.8); missil(6.45, [-90, 40, -100], [13, 0, -27], 0.85, 2.0);
  ex(6.90, -12, -62, 3.6); ex(7.30, 30, -35, 2.2); ex(7.75, -37, -33, 2.4); missil(8.35, [70, 44, -130], [-2, 0, -33], 0.9, 2.6); ex(8.70, 20, -58, 3.2);
  aviao(2.7, [-110, 22, -34], [110, 19, -62], 2.0, 2.4); aviao(4.9, [120, 19, -52], [-120, 16, -30], 1.9, 2.2); aviao(7.7, [-110, 22, -44], [110, 18, -74], 2.2, 2.3);
  for (const [t, x] of [[0.6, -20], [0.66, -20], [1.3, 24], [1.36, 24], [1.42, 24], [3.1, -34], [3.16, -34], [4.6, 40], [4.66, 40], [4.72, 40], [6.0, 8], [6.06, 8], [7.2, -28], [7.26, -28], [8.0, 35], [8.06, 35]]) traca(t, [x, 0.5, -40], [x + 40 * Math.sign(x || 1) * 0.5, 60, -140]);
  // ---- ninho do atirador (9 a 18 s), em torno de x≈150
  ex(9.30, 118, -34, 2.6); ex(9.85, 176, -48, 3.2); ex(10.4, 133, -28, 1.8); ex(11.0, 170, -62, 3.4); ex(11.8, 120, -55, 3.0); ex(12.6, 182, -40, 2.4);
  ex(13.3, 138, -30, 1.6); ex(14.0, 168, -36, 2.0); ex(14.6, 126, -44, 2.4);
  traca(9.6, [135, 0.5, -30], [175, 60, -140]); traca(9.66, [135, 0.5, -30], [175, 60, -140]); traca(12.1, [170, 0.5, -40], [130, 60, -140]); traca(12.16, [170, 0.5, -40], [130, 60, -140]);
  // o tiro do atirador inimigo (janela da torre -> ninho)
  traca(15.45, S.F.janelaTorre.toArray(), [150.3, 0.5, -1.7], 650);
  ex(16.42, 150.6, -1.9, 0.26, 0.45);
  // ---- comprimidos (18 a 28 s), em torno de x≈-150
  ex(19.0, -190, -48, 2.8); ex(20.6, -121, -52, 3.0); ex(22.4, -176, -30, 2.0); ex(24.0, -124, -38, 2.2); ex(25.4, -183, -56, 3.0); ex(26.6, -117, -30, 1.6);
  // ---- fecho (53 a 57,5 s), de volta à guarita
  ex(53.20, -24, -33, 2.4); ex(53.75, 20, -45, 3.0); missil(54.3, [-80, 46, -120], [-5, 0, -40], 0.9, 2.8); ex(54.85, 36, -30, 2.2); ex(55.4, -40, -52, 3.4); ex(56.0, 8, -28, 1.8); missil(56.7, [90, 40, -110], [18, 0, -42], 0.9, 2.6);
  aviao(53.4, [-110, 23, -44], [110, 19, -74], 2.4, 2.3);
  E.sort((a, b) => a.t - b.t);
}

export function montarPlanos() {
  agendarGuerra();
  const so = () => S.soldado, at = () => S.atirador, ob = () => S.observador;
  const guarita = (t, p = {}) => {          // soldado dormindo (pose) + luz de rosto pulsando com as explosões
    PZ.dormirSentado(so(), t, p);
    const pu = S.fx.pulso(t);
    S.F.rostoLuz.position.set(0.55, 1.55, 0.25); S.F.rostoLuz.intensity = 1.0 + 7.0 * clamp(pu, 0, 2.2);
  };
  const pulso = t => S.fx.pulso(t);

  // ================================================================ A) GANCHO (0 a 9 s)
  // 1) close nos olhos fechados do soldado; os clarões das explosões pulsam nas pálpebras
  plano('olhos', 1.3, 'F', (u, t) => {
    guarita(t);
    const f = PZ.focoRosto(so(), { dist: 0.46 + 0.10 * suave(u / 1.3), lat: 0.045 - 0.05 * u / 1.3, alt: 0.02, alvoAlt: 0.0 });
    camara({ pos: f.pos, alvo: f.alvo, fov: 21 + 2 * u / 1.3, roll: -0.04, tr: 0.6 + 2.0 * clamp(pulso(t), 0, 1.2), t, semente: 21 });
    F0(t, { h: 1.0 });
  }, { efeito: (u, t) => ({ subs: 2, obturador: 0.35, flash: clamp(pulso(t) * 0.16, 0, 0.5), flashCor: '255,170,90' }) });

  // 2) a câmera recua e sobe: o corpo inteiro na guarita, o campo de batalha ao fundo
  plano('revela', 2.0, 'F', (u, t) => {
    guarita(t);
    const k = suave5(u / 2.0), f = PZ.focoRosto(so(), { dist: 0.62, lat: 0.03, alt: 0.0 });
    camara({ pos: lerpV(f.pos, [1.25, 1.55, 3.7], k), alvo: lerpV(f.alvo, [0.0, 1.12, -1.1], k), fov: lerp(23, 43, k), roll: lerp(-0.04, 0.0, k), tr: 0.7 + 2.2 * clamp(pulso(t), 0, 1.2), t, semente: 22 });
    F0(t, { h: 1.0 });
  }, { efeito: (u, t) => ({ subs: 3, obturador: 0.4, flash: clamp(pulso(t) * 0.10, 0, 0.35), flashCor: '255,170,90' }) });

  // 3) contra-plongée: aviões e mísseis cruzam o céu; a câmera desce até a silhueta dele dormindo
  plano('ceu', 2.5, 'F', (u, t) => {
    guarita(t);
    const k = suave5(u / 2.5);
    camara({ pos: [lerp(-3.0, -1.6, k), lerp(0.55, 1.05, k), lerp(6.2, 4.4, k)], alvo: lerpV([-4, 19, -50], [0.0, 1.05, -1.0], suave(inv(0.25, 1.0, u / 2.5))), fov: lerp(58, 38, k), roll: lerp(0.07, -0.01, k), tr: 0.8 + 2.0 * clamp(pulso(t), 0, 1.2), t, semente: 23 });
    F0(t, { h: 1.0 });
  }, { efeito: (u, t) => ({ subs: 3, obturador: 0.45, flash: clamp(pulso(t) * 0.10, 0, 0.35), flashCor: '255,170,90' }) });

  // 4) órbita lenta em torno do soldado; ele dorme enquanto tudo explode atrás
  plano('orbita', 3.2, 'F', (u, t) => {
    guarita(t, { fundo: 1 });
    const ang = lerp(-0.52, 0.52, suave(u / 3.2)), R = lerp(2.8, 2.3, u / 3.2);
    camara({ pos: [Math.sin(ang) * R, lerp(1.25, 1.55, u / 3.2), -1.1 + Math.cos(ang) * R], alvo: [0.0, 1.05, -1.1], fov: 34, roll: 0.02, tr: 0.8 + 2.4 * clamp(pulso(t), 0, 1.2), t, semente: 24 });
    F0(t, { h: 1.0 });
  }, { efeito: (u, t) => ({ subs: 3, obturador: 0.4, flash: clamp(pulso(t) * 0.10, 0, 0.35), flashCor: '255,170,90' }) });

  // ================================================================ B) O ATIRADOR (9 a 18 s)
  const FN = [150, -1];
  const ninho = (t, o = {}) => {
    PZ.atiradorPose(at(), S.fuzil, t, o); PZ.observadorPose(ob(), S.binoculo, t, { sono: 0 });
  };
  // 5) o ninho: atirador e observador de bruços atrás do parapeito; a torre inimiga ao longe
  plano('ninho', 2.0, 'F', (u, t) => {
    ninho(t, { sono: 0.15 });
    const k = suave(u / 2.0);
    camara({ pos: [lerp(146.4, 148.2, k), lerp(1.2, 0.85, k), lerp(3.6, 1.9, k)], alvo: [150.5, 0.45, -0.6], fov: lerp(42, 36, k), roll: lerp(-0.03, 0.02, k), tr: 0.9 + 2.0 * clamp(S.fx.pulso(t, 150, -1, 60), 0, 1), t, semente: 25 });
    F0(t, { h: 1.0, foco: FN });
    S.F.rostoLuz.distance = 9; S.F.rostoLuz.position.set(147.4, 1.9, 2.8); S.F.rostoLuz.intensity = 14 + 30 * clamp(S.fx.pulso(t, 150, -1, 60), 0, 1.2);
  }, { efeito: (u, t) => ({ subs: 3, obturador: 0.4, flash: clamp(S.fx.pulso(t, 150, -1, 60) * 0.08, 0, 0.3), flashCor: '255,170,90' }) });

  // 6) mira da luneta: a janela da torre balança; os olhos pesam (pálpebras fecham em piscadas cada vez mais longas)
  plano('mira', 2.4, 'F', (u, t) => {
    ninho(t, { sono: 1 });
    const eye = PZ.olhoMeio(at()).clone(), alvo = S.F.janelaTorre.clone();
    at().grupo.visible = false; S.fuzil.visible = false; ob().grupo.visible = false; S.binoculo.visible = false;
    const sway = V(0.5 * Math.sin(t * 1.7) + 0.2 * Math.sin(t * 4.1), 0.35 * Math.sin(t * 1.3 + 1) + 0.15 * Math.sin(t * 3.7), 0);
    const al = alvo.clone().add(sway).add(V(-4 * (1 - suave(u / 2.4)), -2 * (1 - suave(u / 2.4)), 0));
    camara({ pos: eye.toArray(), alvo: al.toArray(), fov: 8.5, tr: 0, t, semente: 26 });
    S.F.clarao.scale.setScalar(5); S.F.clarao.material.opacity = u > 1.0 && u < 1.14 ? 0.6 * (1 - Math.abs(u - 1.07) / 0.07) : 0;       // reflexo na janela: o inimigo está lá
    F0(t, { h: 1.0, foco: FN, nevoa: 0.0011 });
    renderer.toneMappingExposure = 3.0;                                       // a luneta amplifica a luz da noite
  }, { efeito: (u, t) => ({ subs: 2, obturador: 0.3, tintas: tintaLuneta(u / 2.4) }) });

  // 7) rosto do atirador: olhos pesados, fecha, esfrega o olho com a mão
  plano('olho', 1.6, 'F', (u, t) => {
    const rub = suave(inv(0.15, 0.55, u / 1.6)) * (1 - suave(inv(0.85, 1.0, u / 1.6)));
    ninho(t, { sono: 1.0, esfregar: rub });
    const eye = PZ.olhoMeio(at()), k = u / 1.6;
    camara({ pos: [eye.x - lerp(0.62, 0.48, k), eye.y - lerp(0.06, 0.10, k), eye.z - lerp(1.10, 0.92, k)], alvo: [eye.x + 0.0, eye.y + 0.0, eye.z], fov: 24, roll: -0.03, tr: 0.7 + 1.2 * clamp(S.fx.pulso(t, 150, -1, 60), 0, 1), t, semente: 27 });
    F0(t, { h: 1.0, foco: FN });
    S.F.rostoLuz.distance = 6; S.F.rostoLuz.position.set(eye.x + 0.9, eye.y + 0.6, eye.z - 0.9); S.F.rostoLuz.intensity = 9 + 12 * clamp(S.fx.pulso(t, 150, -1, 60), 0, 1.5);
  }, { efeito: (u, t) => ({ subs: 3, obturador: 0.4 }) });

  // 8) o clarão da janela da torre e o rastro vindo na direção do ninho
  plano('tiro', 1.2, 'F', (u, t) => {
    at().grupo.visible = false; S.fuzil.visible = false;
    const eye = V(149.4, 1.2, -0.6), alvo = V(190, 24, -162);
    camara({ pos: eye.toArray(), alvo: lerpV(alvo.toArray(), [189.2, 25.5, -162], u / 1.2), fov: lerp(9, 7, u / 1.2), tr: 0.0, t, semente: 28 });
    const age = u - 0.28;                                                 // o disparo acontece em u = 0,28 s
    S.F.clarao.material.opacity = age > 0 && age < 0.16 ? 1.0 - age / 0.16 : 0; S.F.clarao.scale.setScalar(age > 0 ? 10 + 34 * Math.exp(-age * 12) : 0.01);
    F0(t, { h: 1.0, foco: FN, nevoa: 0.0011 });
  }, { efeito: (u, t) => ({ subs: 2, obturador: 0.25, flash: u > 0.28 && u < 0.4 ? 0.35 * (1 - (u - 0.28) / 0.12) : 0, flashCor: '255,235,190' }) });

  // 9) os dois são atingidos: o parapeito solta poeira, cabeças caem, tudo estala em branco
  plano('atingidos', 1.8, 'F', (u, t) => {
    const hit = suave(inv(0.20, 0.50, u / 1.8 * 1.8 - 0.0)) ;
    PZ.atiradorPose(at(), S.fuzil, t, { sono: 1, hit }); PZ.observadorPose(ob(), S.binoculo, t, { hit });
    const k = suave(u / 1.8);
    camara({ pos: [lerp(152.4, 151.8, k), lerp(1.05, 0.95, k), lerp(-4.7, -3.8, k)], alvo: [150.5, 0.45, -0.7], fov: lerp(42, 38, k), roll: lerp(0.03, -0.02, k), tr: u < 0.45 ? 4.0 * suave(1 - Math.abs(u - 0.25) / 0.25) : 0.6, t, semente: 29 });
    F0(t, { h: 1.0, foco: FN });
    S.F.rostoLuz.distance = 8; S.F.rostoLuz.position.set(151.6, 1.5, -2.2); S.F.rostoLuz.intensity = 12 + (u > 0.2 && u < 0.5 ? 160 * Math.exp(-(u - 0.2) * 9) : 0.0);
  }, { efeito: (u, t) => ({ subs: 3, obturador: 0.45, flash: u > 0.2 && u < 0.36 ? 0.8 * (1 - (u - 0.2) / 0.16) : (u > 1.55 ? suave(inv(1.55, 1.78, u)) : 0), flashCor: '255,240,210' }) });

  montarCenas2();
}

// sobreposição da luneta: máscara circular, retículo, marcas de milésimos e pálpebras pesadas fechando (u = 0..1 do plano)
function tintaLuneta(u) {
  const piscada = (c, larg, alt) => alt * Math.exp(-Math.pow((u - c) / larg, 2));
  const fecha = clamp(piscada(0.28, 0.035, 1.0) + piscada(0.55, 0.06, 1.0) + piscada(0.76, 0.08, 1.0) + suave(inv(0.90, 1.0, u)));
  return (g, w, h) => {
    const cx = w / 2, cy = h / 2, R = w * 0.485;
    g.save();
    g.fillStyle = '#000'; g.beginPath(); g.rect(0, 0, w, h); g.arc(cx, cy, R, 0, Math.PI * 2, true); g.fill('evenodd');
    const gr = g.createRadialGradient(cx, cy, R * 0.80, cx, cy, R); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.65)'); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(8,8,8,0.92)'; g.lineWidth = w * 0.0030;
    g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx - R * 0.07, cy); g.moveTo(cx + R * 0.07, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy - R * 0.07); g.moveTo(cx, cy + R * 0.07); g.lineTo(cx, cy + R); g.stroke();
    g.lineWidth = w * 0.0075; g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx - R * 0.55, cy); g.moveTo(cx + R * 0.55, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy - R * 0.55); g.moveTo(cx, cy + R * 0.55); g.lineTo(cx, cy + R); g.stroke();
    g.fillStyle = 'rgba(8,8,8,0.9)'; for (let i = 1; i <= 4; i++) for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * R * 0.09 * i, cy, w * 0.0036, 0, 6.3); g.fill(); g.beginPath(); g.arc(cx, cy + s * R * 0.09 * i, w * 0.0036, 0, 6.3); g.fill(); }
    // pálpebras: duas cortinas escuras com borda macia
    if (fecha > 0.01) {
      const alt = h * 0.5 * fecha;
      for (const sg of [-1, 1]) {
        const y0 = sg < 0 ? 0 : h, y1 = sg < 0 ? alt : h - alt;
        const gg = g.createLinearGradient(0, y1, 0, y1 + sg * -h * 0.06); gg.addColorStop(0, 'rgba(6,4,4,1)'); gg.addColorStop(1, 'rgba(6,4,4,0)');
        g.fillStyle = 'rgba(6,4,4,1)'; g.fillRect(0, Math.min(y0, y1), w, Math.abs(y1 - y0));
        g.fillStyle = gg; g.fillRect(0, sg < 0 ? y1 : y1 - h * 0.06, w, h * 0.06);
      }
    }
    g.restore();
  };
}
