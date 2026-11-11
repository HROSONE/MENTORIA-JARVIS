// Cenas do Short (parte 2): dentro da cabine (grade, botão, subida, parada, botões, telefone, batidas), silêncio, relógio e o tempo passando.
import * as THREE from 'three';
import { mundos, scene } from './motor.js';
import { clamp, lerp, suave, suave5, entra, sai, inv, ruido } from './util.js';
import { S, V, PI, plano, camara } from './base.js';
import { Y_CAB, POCO, H } from './casa.js';
import * as P from './poses.js';
import { emD, lerpV, piscada, D0, lampSintoma } from './ajud.js';
import { montarCenas3 } from './cenas3.js';

export const cw = (x, y, z, ycab = Y_CAB) => P.cabW(x, y, z, ycab).toArray();
let tTL0 = 22.4;
export const horaTL = t => 24 + 7.0 * (t - tTL0);                      // hora absoluta no tempo-lapso (24 = sábado 0h; chega a 80 = segunda 8h em 8 s)

export function montarCenas2() {
  const D = () => S.D, m = () => S.marites;

  // 6a) ela fecha a grade de latão com a mão (vista do corredor do 2º andar, com a porta do poço aberta)
  plano('porta_grade', 1.4, 'D', (u, t) => {
    const yc = H; D0({ hora: 17.95, ycab: yc, t });
    D().abrirPorta(1, 0.9);
    const a = m(); emD(a);
    const s = 1 - suave(inv(0.15, 1.1, u));
    D().cab.abrirGrade(s);
    P.colocarCab(a, 0.20, 0.0, PI / 2, yc);
    a.anim('Parado', t * 0.6);
    a.ikBraco('D', P.cabW(0.64, 1.08, -0.45 + s * 0.95, yc), V(0.1, -1, 0.5));
    a.ikBraco('E', P.cabW(0.30, 0.95, -0.40, yc), V(-0.3, -1, -0.5));
    a.rosto({ expressao: 'neutro', forca: 0.5, olhar: [0, -0.05], piscar: piscada(t, 2.2, 0.3) }); a.atualizarRosto();
    const k = suave(u / 1.4);
    camara({ pos: [lerp(2.9, 2.3, k), yc + 1.55, lerp(0.7, 0.2, k)], alvo: cw(0.35, 1.18, lerp(-0.25, -0.62, k), yc), fov: lerp(40, 34, k), roll: lerp(0.04, -0.02, k), tr: 1.2, t, semente: 21 });
  }, { efeito: () => ({ subs: 3, obturador: 0.35 }) });

  // 6b) o dedo no botão "3": o botão acende
  plano('botao', 0.9, 'D', (u, t) => {
    const yc = H; D0({ hora: 17.95, ycab: yc, t, rig: 'cabine' });
    D().abrirPorta(1, 0.9);
    const a = m(); emD(a);
    const press = suave(inv(0.25, 0.42, u)) * (1 - suave(inv(0.52, 0.72, u)));
    P.poseBotao(a, t, 2, { ycab: yc, press, x: 0.10, medo: 0.35 });
    D().cab.botao(2, suave(inv(0.40, 0.55, u)));
    camara({ pos: cw(lerp(0.60, 0.50, u), 1.52, 0.26, yc), alvo: cw(0.22, 1.43, -0.38, yc), fov: 48, roll: 0.02, tr: 1.4, t, semente: 22 });
  }, { efeito: () => ({ subs: 3, obturador: 0.35 }) });

  // 7) a subida: por dentro da cabine, o poço passa; parada seca, a lâmpada pisca e ela se segura
  plano('sobe', 1.8, 'D', (u0, t) => {
    const u = u0 * 1.6 / 1.8;
    const f = clamp(u / 1.18), yc = H + (Y_CAB - H) * (f * f * (3 - 2 * f * 0.2) * 0.9 + f * 0.1);
    const ycab = u < 1.18 ? H + (Y_CAB - H) * (0.12 * f + 0.88 * f * f) : Y_CAB;
    D0({ hora: 17.95, ycab, t, rig: 'cabine' });
    D().abrirPorta(1, 0.9 * (1 - suave(u / 0.3)));
    D().cab.abrirGrade(0);
    D().cab.botao(2, 1);
    D().cab.luz(lampSintoma(u, 1.18), 2.2);
    const a = m(); emD(a);
    const jolt = u > 1.18 ? Math.exp(-(u - 1.18) * 8) * Math.sin((u - 1.18) * 46) : 0;
    P.colocarCab(a, 0.16, 0.0, PI / 2, ycab);
    a.anim('Parado', t * 0.6);
    a.somar('Peito', 0.16 * jolt - 0.02, 0, 0.10 * jolt);
    a.ikBraco('D', P.cabW(0.0, 0.93, 0.50, ycab), V(0, -1, 0.5)); a.ikBraco('E', P.cabW(0.0, 0.93, -0.50, ycab), V(0, -1, -0.5));
    a.rosto({ expressao: u > 1.18 ? 'medo' : 'neutro', forca: u > 1.18 ? 0.45 : 0.3, olhar: [0, 0], piscar: piscada(t) }); a.atualizarRosto();
    const sh = (u < 1.18 ? 0.5 + 0.5 * u : 0.0) + 3.0 * Math.abs(jolt);
    camara({ pos: cw(-0.54, 1.56 + 0.03 * jolt, -0.40, ycab), alvo: cw(0.60, 1.42 - 0.12 * jolt, 0.10, ycab), fov: 62, roll: 0.06 * jolt, tr: sh, t, semente: 23 });
  }, { efeito: () => ({ subs: 3, obturador: 0.35 }) });

  // 8) parada entre o 2º e o 3º andar: a câmera sobe da laje do 2º até a do 3º, com a cabine no meio
  plano('parado', 2.4, 'D', (u, t) => {
    D0({ hora: 17.95, poco: false, corte: true, t });
    D().cab.luz(0.92 + 0.08 * Math.sin(t * 31), 0);
    const a = m(); emD(a);
    P.poseGrade(a, t, { medo: 0.55, vao: 0.2, hy: 1.35 });
    a.rosto({ expressao: 'medo', forca: 0.55, olhar: [0.1, 0], piscar: piscada(t, 2.5) }); a.atualizarRosto();
    const k = suave(u / 2.4);
    camara({ pos: [lerp(5.2, 3.4, k), lerp(3.6, 6.7, k), lerp(14.0, 9.5, k)], alvo: [0.0, lerp(3.9, 6.9, k), -0.8], fov: lerp(46, 34, k), roll: lerp(0.03, -0.02, k), tr: 0.6, t, semente: 24 });
  }, { efeito: () => ({ subs: 3, obturador: 0.35 }) });

  // 9) botões: ela aperta vários, inclusive o do alarme; nada responde
  plano('botoes', 1.2, 'D', (u, t) => {
    D0({ hora: 17.95, t, rig: 'cabine' });
    const a = m(); emD(a);
    const seq = [2, 3, 0, 1, 4, 5], idx = Math.min(5, Math.floor(u / 1.2 * 6));
    const ciclo = ((u / 1.2 * 6) % 1), press = Math.sin(clamp(ciclo * 1.6) * PI) ** 2;
    P.poseBotao(a, t, idx === 5 ? 5.5 : seq[idx], { press, x: 0.10, medo: 0.7 });
    D().cab.botoes.forEach((b, i) => { if (i < 5) D().cab.botao(i, i === seq[idx] && ciclo < 0.6 ? 1 : (i === 2 ? 0.5 : 0.0)); });
    D().cab.botao(5, idx === 5 ? 1 : 0);
    const cpos = cw(lerp(0.12, 0.26, u), 1.50, 0.50, Y_CAB);
    a.olhar(V(...cpos), { forca: 0.9 * suave(inv(0.25, 0.8, u)), max: 1.4 });
    camara({ pos: cpos, alvo: cw(0.24, 1.42, -0.32), fov: lerp(52, 46, u), roll: -0.02 + 0.03 * u, tr: 2.0, t, semente: 25 });
  }, { efeito: () => ({ subs: 4, obturador: 0.5 }) });

  // 10) telefone de emergência: ela tira o monofone do gancho, escuta... silêncio. Ele não funciona.
  plano('telefone', 1.6, 'D', (u, t) => {
    D0({ hora: 17.95, t, rig: 'cabine' });
    const a = m(); emD(a);
    const k = suave(inv(0.0, 0.55, u)) * (1 - 0.65 * suave(inv(1.15, 1.6, u)));
    const alvo = P.poseFone(a, t, k, { medo: 0.55 });
    D().cab.fone.position.copy(D().cab.grupo.worldToLocal(alvo.clone())); D().cab.fone.rotation.set(0, 0.4 * k, (PI / 2) * k); D().cab.cordao(D().cab.fone.position);
    const esp = suave(inv(0.7, 1.3, u));                                                       // esperança que se apaga
    a.rosto({ expressao: esp < 0.5 ? 'surpresa' : 'triste', forca: esp < 0.5 ? 0.35 : 0.75, olhar: [0.0, 0.0], piscar: piscada(t, 1.7, 0.2) }); a.atualizarRosto();
    const cpos = cw(lerp(0.12, 0.22, u), 1.52, 0.50, Y_CAB);
    a.olhar(V(...cpos), { forca: 0.7, max: 1.2 });
    camara({ pos: cpos, alvo: cw(0.30, 1.47, -0.28), fov: lerp(48, 40, u), roll: 0.03, tr: 1.2, t, semente: 26 });
  }, { efeito: () => ({ subs: 3, obturador: 0.35 }) });

  // 11) ela bate na grade e chama (reconstituição): vista de fora, pelo corte da casa de bonecas
  plano('bate', 1.3, 'D', (u, t) => {
    D0({ hora: 17.95, poco: false, t, rig: 'cabine' });
    D().fenda.color.set(0xffdcb0); D().fenda.intensity = 26;
    const a = m(); emD(a);
    const bate = Math.sin(t * 22), ox = 0.035 * Math.max(0, bate);
    P.colocarCab(a, 0.24, 0.0, PI / 2);
    a.anim('Assustado', t * 0.5);
    a.ikBraco('D', P.cabW(0.60 + 0.02 - ox, 1.40 + 0.03 * Math.sin(t * 11), 0.17), V(-0.3, -1, 0.5));
    a.ikBraco('E', P.cabW(0.60, 1.30, -0.16), V(-0.3, -1, -0.5));
    D().cab.grade.position.x = 0.012 * Math.max(0, bate);
    a.rosto({ expressao: 'grito', forca: 0.5 + 0.12 * Math.max(0, Math.sin(t * 7)), olhar: [0.0, 0.05], piscar: 0.15 }); a.atualizarRosto();
    a.lagrimaAt(t * 1.4);
    const k = suave(u / 1.3);
    camara({ pos: cw(lerp(1.75, 1.35, k), lerp(1.22, 1.36, k), lerp(-0.10, -0.32, k)), alvo: cw(0.24, 1.38, 0.0), fov: lerp(34, 30, k), roll: 0.04 - 0.08 * k, tr: 3.2, t, semente: 27 });
  }, { efeito: () => ({ subs: 4, obturador: 0.5 }) });

  // 12) silêncio: a casa inteira à noite e a cabine acesa lá no meio
  plano('silencio', 1.6, 'D', (u, t) => {
    D0({ hora: 23.4 + 0.4 * u / 1.6, poco: false, corte: true, t });
    const a = m(); emD(a);
    P.poseSentada(a, t, { cansaco: 0.7 });
    const k = suave(u / 1.6);
    camara({ pos: lerpV([2.5, 8.2, 24], [5.5, 9.6, 41], k), alvo: [0.0, lerp(7.4, 8.0, k), -1.0], fov: lerp(34, 36, k), roll: 0.0, tr: 0.35, t, semente: 28 });
  }, { efeito: () => ({ subs: 1 }) });

  // 13) o relógio de pé: o pêndulo, e os ponteiros começam a correr
  plano('relogio', 1.2, 'D', (u, t) => {
    const h = 23.4 + 0.6 * suave(u / 1.2) * 0.9 + 0.0;
    D0({ hora: 23.8 + 0.2 * entra(u / 1.2), poco: false, corte: true, ycab: Y_CAB, t });
    D().balancarPendulo(t);
    const dir = D().relogioPos;
    const k = suave(u / 1.2);
    camara({ pos: [lerp(1.45, 1.55, k), lerp(H + 2.02, H + 2.15, k), lerp(-5.95, -4.7, k)], alvo: [1.4, lerp(H + 1.98, H + 1.8, k), -7.32], fov: lerp(26, 34, k), roll: 0.02 - 0.03 * k, tr: 0.8, t, semente: 29 });
    D().pMin.rotation.z = -(((24.0 - 0.45 * (1 - u / 1.2)) * 1) % 1) * PI * 2 * (1 + 6 * entra(u / 1.2));
  }, { efeito: () => ({ subs: 3, obturador: 0.35 }) });

  // 14) tempo-lapso 1: sexta à noite até sábado à tarde (a casa por fora, o sol e a lua cruzando o céu)
  const tlCasa = (id, dur, c0, c1, f0, f1, sem) => plano(id, dur, 'D', (u, t) => {
    D0({ hora: horaTL(t), poco: false, corte: true, t });
    D().balancarPendulo(t);
    const a = m(); emD(a); P.poseSentada(a, t, { cansaco: 0.8 });
    const k = suave(u / dur);
    camara({ pos: lerpV(c0.pos, c1.pos, k), alvo: lerpV(c0.alvo, c1.alvo, k), fov: lerp(f0, f1, k), roll: lerp(c0.roll || 0, c1.roll || 0, k), tr: 0.4, t, semente: sem });
  }, { efeito: () => ({ subs: 1, obturador: 0.35 }) });
  tTL0 = S.total;
  tlCasa('tempo_1', 2.6, { pos: [-4.5, 6.4, 27], alvo: [0, 7.6, -1.0], roll: 0.03 }, { pos: [1.0, 7.4, 21], alvo: [0, 7.0, -0.8], roll: -0.01 }, 36, 30, 31);

  // 15) dentro da cabine, sábado: a fresta de luz muda de cor; ela sentada, encostada na parede
  const dentro = (id, dur, cam0, cam1, opc) => plano(id, dur, 'D', (u, t) => {
    const h = horaTL(t);
    D0({ hora: h, t, rig: 'cabine' });
    D().fenda.intensity = 60 * D().fendaK;
    D().cab.luz(0.9 + 0.1 * Math.sin(t * 13) * (Math.sin(t * 2.1) > 0.8 ? 1 : 0.2), 2.2);
    S.poeira.visible = true; S.poeira.userData.atualizar(t, D().fendaK, V(0.0, Y_CAB + 0.2, 0.0));
    const a = m(); emD(a);
    P.poseSentada(a, t, { cansaco: opc.cansaco, x: opc.x ?? -0.40, z: opc.z ?? 0.0, cabeca: opc.cabeca ?? 0 });
    if (opc.chora) a.lagrimaAt(t);
    const k = suave(u / dur);
    camara({ pos: cw(...lerpV(cam0.pos, cam1.pos, k)), alvo: cw(...lerpV(cam0.alvo, cam1.alvo, k)), fov: lerp(cam0.fov, cam1.fov, k), roll: lerp(cam0.roll || 0, cam1.roll || 0, k), tr: 0.9, t, semente: opc.sem });
  }, { efeito: () => ({ subs: 2, obturador: 0.35 }) });
  dentro('dentro_1', 1.0, { pos: [0.50, 0.80, 0.40], alvo: [-0.30, 0.78, 0.0], fov: 40, roll: 0.05 }, { pos: [0.40, 0.78, 0.30], alvo: [-0.32, 0.80, 0.0], fov: 34, roll: -0.03 }, { cansaco: 0.8, sem: 32 });

  tlCasa('tempo_2', 1.8, { pos: [4.8, 8.6, 24], alvo: [0, 7.4, -0.8], roll: -0.02 }, { pos: [-1.5, 6.9, 18.5], alvo: [0, 6.9, -0.8], roll: 0.02 }, 34, 30, 33);
  dentro('dentro_2', 1.0, { pos: [0.42, 0.42, 0.34], alvo: [-0.40, 0.62, 0.0], fov: 36, roll: -0.04 }, { pos: [0.34, 0.46, 0.26], alvo: [-0.40, 0.62, 0.0], fov: 30, roll: 0.03 }, { cansaco: 1.0, cabeca: 0.05, sem: 34, chora: true });
  tlCasa('tempo_3', 1.6, { pos: [-2.0, 7.2, 20], alvo: [0, 7.0, -0.8], roll: 0.0 }, { pos: [3.5, 9.5, 36], alvo: [0, 8.0, -1.0], roll: -0.02 }, 31, 37, 35);

  montarCenas3();
}
