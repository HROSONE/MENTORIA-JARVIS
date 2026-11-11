// Cenas do Short (parte 3): segunda de manhã — o entregador, o eco da campainha, os bombeiros, a porta forçada, a luz, o resgate e a cartela.
import * as THREE from 'three';
import { mundos, scene } from './motor.js';
import { clamp, lerp, suave, suave5, entra, sai, inv, ruido } from './util.js';
import { S, V, PI, plano, camara } from './base.js';
import { Y_CAB, POCO, H } from './casa.js';
import { ZF, PORTA, CAMP } from './rua.js';
import * as P from './poses.js';
import { emD, emR, lerpV, piscada, D0, R0, estacionados, giroflex, cartela } from './ajud.js';
import { cw } from './cenas2.js';

const H_SEG = 80.0;                                                    // segunda, 8 h (hora absoluta do tempo-lapso)
const step = (zEdge, z) => suave(clamp((zEdge - z) / 0.16 + 0.5));
export const yDeg = z => 0.15 + 0.18 * (step(ZF + 1.55, z) + step(ZF + 1.25, z) + step(ZF + 0.95, z));   // altura do chão na escada da frente
const GIRO = (dx, dz) => Math.atan2(dx, dz);

export function montarCenas3() {
  const D = () => S.D, R = () => S.R, m = () => S.marites;

  // 19) segunda de manhã, dentro da cabine: a fresta fica dourada e ela levanta a cabeça devagar
  plano('segunda_cab', 1.2, 'D', (u, t) => {
    D0({ hora: H_SEG - 0.3 + 0.3 * u / 1.2, t, rig: 'cabine' });
    D().fenda.intensity = 60 * D().fendaK * (0.7 + 0.3 * u / 1.2);
    D().cab.luz(0.85, 2.2);
    S.poeira.visible = true; S.poeira.userData.atualizar(t, D().fendaK, V(0.0, Y_CAB + 0.2, 0.0));
    const a = m(); emD(a);
    const lev = suave(inv(0.25, 0.9, u));
    P.poseSentada(a, t, { cansaco: 1.0 - 0.4 * lev, cabeca: 0.42 - 0.60 * lev, x: -0.40 });
    a.rosto({ expressao: 'triste', forca: 0.8 - 0.4 * lev, olhar: [0.0, 0.1 + 0.2 * lev], piscar: 0.5 * (1 - lev) + 0.3 * piscada(t, 1.5) }); a.atualizarRosto();
    const k = suave(u / 1.2);
    camara({ pos: cw(lerp(0.52, 0.42, k), lerp(0.62, 0.78, k), lerp(0.34, 0.26, k)), alvo: cw(-0.30, lerp(0.58, 0.74, k), 0.0), fov: lerp(36, 30, k), roll: lerp(0.05, -0.02, k), tr: 0.7, t, semente: 41 });
  }, { efeito: () => ({ subs: 2, obturador: 0.35 }) });

  // 20) o entregador sobe os degraus com a caixa e toca a campainha (o botão acende)
  plano('campainha', 1.7, 'R', (u, t) => {
    R0('manha', t, 0);
    estacionados('manha');
    const e = S.entregador; emR(e);
    const A = [0.45, ZF + 3.0], B = [1.0, ZF + 0.58], L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const dist = Math.min(L, 1.25 * u), f = dist / L;
    const x = lerp(A[0], B[0], f), z = lerp(A[1], B[1], f);
    const andando = dist < L - 0.01;
    const giro = andando ? GIRO(B[0] - A[0], B[1] - A[1]) : PI;
    e.colocar(x, yDeg(z), z, giro);
    const rate = 1.2 / Math.max(e.velocidade('Andar') || 1.2, 0.4);
    if (andando) e.anim('Andar', u * rate + 0.15); else e.anim('Parado', t * 0.8);
    S.caixa.visible = true;
    e.grupo.updateMatrixWorld(true);
    S.caixa.position.copy(e.grupo.localToWorld(V(0.20, 0.82, 0.27))); S.caixa.rotation.set(0, giro, 0.0);
    S.caixa.updateMatrixWorld(true);
    e.ikBraco('E', S.caixa.localToWorld(S.caixa.userData.alcas[1].clone()), V(0.6, -1, 0.0));
    const press = suave(inv(1.20, 1.34, u)) * (1 - suave(inv(1.42, 1.58, u)));
    const alvo = V(CAMP.x - 0.02, CAMP.y + 0.04, ZF + 0.075 - 0.016 * press);
    const alc = suave(inv(0.95, 1.20, u));
    if (alc > 0.001) { e.grupo.updateMatrixWorld(true); const pos0 = e.pos('MaoD'); e.ikBraco('D', pos0.clone().lerp(alvo, alc), V(-0.5, -0.9, 0.3)); }
    R().campainha(suave(inv(1.30, 1.38, u)) * (1 - suave(inv(1.62, 1.7, u))));
    e.rosto({ expressao: 'neutro', forca: 0.3, olhar: [0.1, 0.05], piscar: piscada(t, 2.3, 0.2) }); e.atualizarRosto();
    const k = suave(u / 1.7);
    camara({ pos: [lerp(-1.6, 1.95, k), lerp(1.25, 2.12, k), lerp(ZF + 5.4, ZF + 1.15, k)], alvo: [lerp(0.5, CAMP.x - 0.05, k), lerp(1.3, CAMP.y + 0.02, k), lerp(ZF + 1.2, ZF, k)], fov: lerp(44, 30, k), roll: lerp(0.04, -0.02, k), tr: 1.0, t, semente: 42 });
  }, { efeito: () => ({ subs: 5, obturador: 0.4 }) });

  // 21) o eco da campainha lá dentro: ela levanta o rosto e escuta
  plano('eco', 1.0, 'D', (u, t) => {
    D0({ hora: H_SEG, t, rig: 'cabine' });
    D().fenda.intensity = 60 * D().fendaK;
    S.poeira.visible = true; S.poeira.userData.atualizar(t, D().fendaK, V(0.0, Y_CAB + 0.2, 0.0));
    D().cab.luz(0.85, 2.2);
    const a = m(); emD(a);
    P.poseSentada(a, t, { cansaco: 0.5, cabeca: -0.22 * suave(u / 0.4), x: -0.40 });
    a.rosto({ expressao: 'surpresa', forca: 0.55 * suave(inv(0.05, 0.5, u)), olhar: [0.25, 0.25], piscar: 0.0 }); a.atualizarRosto();
    a.lagrimaAt(t * 1.1);
    const k = suave(u / 1.0);
    camara({ pos: cw(lerp(0.46, 0.38, k), 0.66, lerp(0.24, 0.20, k)), alvo: cw(-0.38, 0.70, 0.0), fov: lerp(34, 28, k), roll: -0.02 + 0.03 * k, tr: 0.8, t, semente: 43 });
  }, { efeito: () => ({ subs: 2, obturador: 0.35 }) });

  // 22) ele espera, olha as janelas, se vira e liga para pedir ajuda
  plano('entregador', 1.8, 'R', (u, t) => {
    R0('manha', t, 0);
    estacionados('manha');
    const e = S.entregador; emR(e);
    const giro = lerp(PI, PI * 2 + 0.25, suave(inv(0.35, 1.05, u)));
    e.colocar(1.0, 0.69, ZF + 0.62, giro);
    e.anim('Parado', t * 0.9);
    if (u < 0.6) e.olhar(V(0.4, 8.0, ZF + 0.2), { forca: 0.8, max: 1.0 });
    else e.olhar(V(0.5, 1.7, ZF + 4), { forca: 0.4 });
    e.grupo.updateMatrixWorld(true);
    S.caixa.visible = true; S.caixa.position.copy(e.grupo.localToWorld(V(0.20, 0.82, 0.27))); S.caixa.rotation.set(0, giro, 0); S.caixa.updateMatrixWorld(true);
    e.ikBraco('E', S.caixa.localToWorld(S.caixa.userData.alcas[1].clone()), V(0.6, -1, 0.0));
    const ao = suave(inv(0.75, 1.2, u));                                                      // celular na orelha
    const hq = e.ossos['Cabeca'].getWorldQuaternion(new THREE.Quaternion());
    const orelha = e.pos('Cabeca').add(V(-0.09, 0.075, 0.0).applyQuaternion(hq));
    const alvo = e.pos('MaoD').lerp(orelha, ao);
    e.ikBraco('D', alvo, V(-0.7, -0.9, 0.2));
    S.cel.visible = ao > 0.05; S.cel.position.copy(alvo).add(V(0, 0.0, 0)); S.cel.quaternion.copy(hq); S.cel.rotateY(PI / 2 * 0.9); S.cel.rotateZ(0.12);
    e.rosto({ expressao: u < 0.9 ? 'neutro' : 'medo', forca: u < 0.9 ? 0.3 : 0.25, boca: ao > 0.5 ? 0.05 + 0.04 * Math.sin(t * 15) : 0.0, olhar: [0.0, 0.0], piscar: piscada(t, 1.9, 0.5) }); e.atualizarRosto();
    const k = suave(u / 1.8);
    camara({ pos: [lerp(-1.6, 3.0, k), lerp(1.55, 1.75, k), lerp(ZF + 3.3, ZF + 3.0, k)], alvo: [1.0, 0.69 + 1.50, ZF + 0.6], fov: lerp(38, 34, k), roll: lerp(0.04, -0.03, k), tr: 0.9, t, semente: 44 });
  }, { efeito: () => ({ subs: 3, obturador: 0.35 }) });

  // 23) o caminhão dos bombeiros chega (luzes piscando) e a equipe corre para a escada
  plano('chegam', 1.8, 'R', (u, t) => {
    R0('manha', t, 0);
    estacionados('manha');
    const fx = u < 1.15 ? -1.0 - 24 * Math.pow(1 - u / 1.15, 2.0) : -1.0;
    S.fire.grupo.visible = true; S.fire.colocar(fx, 0, -1.45, PI / 2, { dist: fx, pitch: u > 0.85 && u < 1.15 ? -0.012 : 0 });
    S.fire.farois(0); S.fire.lanternas(u > 0.85 ? 1.0 : 0.3);
    giroflex(S.fire, t, [[0.38, 1.36, 0.62], [-0.38, 1.36, 0.62], [0.42, 1.0, -1.5], [-0.42, 1.0, -1.5]]);
    const equipe = [S.b1, S.b2, S.b3];
    equipe.forEach((b, i) => {
      emR(b);
      const t0 = 0.85 + i * 0.12, uu = u - t0;
      if (uu < 0) { b.grupo.visible = false; return; }
      const A = [1.2 - 0.25 * i, -3.1 + 0.15 * i], B = [0.4 + 0.5 * i, ZF + 1.8], Ls = Math.hypot(B[0] - A[0], B[1] - A[1]);
      const d = Math.min(Ls, 3.5 * uu), f = d / Ls;
      const x = lerp(A[0], B[0], f), z = lerp(A[1], B[1], f);
      b.colocar(x, yDeg(z), z, GIRO(B[0] - A[0], B[1] - A[1]));
      const rate = 3.4 / Math.max(b.velocidade('Correr') || 3.4, 0.5);
      b.anim('Correr', uu * rate + i * 0.2);
      b.rosto({ expressao: 'neutro', forca: 0.3 }); b.atualizarRosto();
    });
    const k = suave(u / 1.8);
    camara({ pos: [lerp(6.5, 4.2, k), lerp(0.9, 1.5, k), lerp(-3.9, -3.7, k)], alvo: [lerp(-9, 0.4, k), lerp(1.6, 1.3, k), lerp(-1.6, -5.0, k)], fov: lerp(46, 52, k), roll: lerp(-0.04, 0.03, k), tr: 1.4, t, semente: 45 });
  }, { efeito: () => ({ subs: 4, obturador: 0.35 }) });

  // 24) no corredor do 3º andar: o pé-de-cabra na fresta e a porta que cede
  plano('forcam', 1.5, 'D', (u, t) => {
    D0({ hora: H_SEG, t, rig: 'hall' });
    const s = 0.52 * suave(inv(0.35, 1.25, u));
    D().abrirPorta(2, s);
    D().fenda.intensity = 60 * D().fendaK * (0.55 + 1.2 * suave(inv(0.7, 1.25, u)));
    D().cab.luz(0.8, 0);
    const y0 = 2 * H, k = suave(inv(0.3, 1.25, u));
    const tip = V(0.995, y0 + 1.12, POCO.cz);
    const dir = V(1.0, -0.10, lerp(-0.45, -0.85, k)).normalize();
    S.barra.visible = true; S.barra.position.copy(tip);
    S.barra.quaternion.setFromUnitVectors(V(0, 1, 0), dir);
    const A = S.b1, B = S.b2; emD(A, B);
    A.colocar(1.95 + 0.2 * k, y0, -1.55 - 0.1 * k, -PI / 2 + 0.25); A.anim('Parado', t * 1.1);
    B.colocar(1.80, y0, -0.20, -PI / 2 - 0.30); B.anim('Parado', t * 1.1 + 0.4);
    A.somar('Peito', 0.10 + 0.20 * k, 0, 0);
    A.grupo.updateMatrixWorld(true); B.grupo.updateMatrixWorld(true);
    A.ikBraco('D', tip.clone().addScaledVector(dir, 0.60), V(0.3, -1, 0.3)); A.ikBraco('E', tip.clone().addScaledVector(dir, 0.80), V(0.3, -1, -0.3));
    B.ikBraco('D', V(0.995, y0 + 1.25, POCO.cz + s / 2 + 0.05), V(0.2, -0.8, 0.6)); B.ikBraco('E', V(0.995, y0 + 1.55, POCO.cz + s / 2 + 0.03), V(0.3, -0.5, 0.4));
    B.somar('Peito', 0.08 + 0.15 * k, 0, 0);
    for (const b of [A, B]) { b.rosto({ expressao: 'raiva', forca: 0.35, boca: 0.0 }); b.atualizarRosto(); }
    camara({ pos: [lerp(3.9, 3.2, k), y0 + lerp(1.50, 1.42, k), lerp(-0.55, -0.80, k)], alvo: [1.0, y0 + 1.12, POCO.cz], fov: lerp(48, 42, k), roll: lerp(0.05, -0.03, k), tr: 2.2, t, semente: 46 });
  }, { efeito: () => ({ subs: 3, obturador: 0.35 }) });

  // 25) de dentro da cabine: as portas cedem e a luz do corredor inunda tudo; silhuetas de capacete
  plano('luz', 1.4, 'D', (u, t) => {
    D0({ hora: H_SEG, t, rig: 'hall' });
    D().luzJanela(true, suave(inv(0.0, 0.7, u)));
    const s = lerp(0.18, 0.9, suave(inv(0.05, 0.85, u)));
    D().abrirPorta(2, s);
    const k = suave(inv(0.0, 0.8, u));
    D().fenda.intensity = 60 * D().fendaK * (1 + 5 * k);
    D().cab.luz(0.35, 0);
    S.poeira.visible = true; S.poeira.userData.atualizar(t, D().fendaK, V(0.0, Y_CAB + 0.2, 0.0));
    const a = m(); emD(a);
    P.poseSentada(a, t, { cansaco: 0.6, cabeca: -0.5, x: 0.06 });
    a.rosto({ expressao: 'surpresa', forca: 0.5, olhar: [0.0, 0.3], piscar: 0.0 }); a.atualizarRosto();
    const y0 = 2 * H;
    const A = S.b1, B = S.b2; emD(A, B);
    A.colocar(1.70, y0, -1.10 + 0.05 * Math.sin(t * 3), -PI / 2 + 0.2); A.anim('Parado', t); A.somar('Peito', 0.25, 0, 0); A.somar('Cabeca', 0.1, 0, 0);
    B.colocar(1.55, y0, -0.45, -PI / 2 - 0.25); B.anim('Parado', t + 0.5); B.somar('Peito', 0.25, 0, 0); B.somar('Cabeca', 0.1, 0, 0);
    for (const b of [A, B]) { b.rosto({ expressao: 'neutro', forca: 0.3 }); b.atualizarRosto(); }
    const kk = suave(u / 1.4);
    camara({ pos: cw(lerp(-0.52, -0.40, kk), lerp(0.90, 1.0, kk), lerp(0.30, 0.22, kk)), alvo: cw(0.95, lerp(1.45, 1.55, kk), -0.08), fov: lerp(60, 52, kk), roll: lerp(0.05, -0.02, kk), tr: 1.2, t, semente: 47 });
  }, { efeito: u => ({ subs: 3, obturador: 0.35, flash: 0.55 * (1 - suave(inv(0.0, 0.5, u))) * suave(inv(0.0, 0.12, u)), flashCor: '255,246,226' }) });

  // 26) o rosto dela na luz, a grade deslizando e a luva que entra no quadro
  plano('mao', 1.2, 'D', (u, t) => {
    D0({ hora: H_SEG, t, rig: 'hall' });
    D().luzJanela(true);
    D().abrirPorta(2, 0.9);
    D().fenda.intensity = 60 * D().fendaK * 2.0;
    D().cab.luz(0.8, 0);
    const y0 = 2 * H;
    const g = suave(inv(0.35, 0.95, u));
    D().cab.abrirGrade(g);
    const a = m(); emD(a);
    P.poseGrade(a, t, { medo: 0.0, x: 0.34, hy: 1.20 + 0.05 * u });
    a.rosto({ expressao: u < 0.5 ? 'surpresa' : 'triste', forca: u < 0.5 ? 0.45 : 0.8, olhar: [0.15, 0.1], piscar: 0.1 }); a.atualizarRosto();
    a.lagrimaAt(t * 1.3);
    const A = S.b1; emD(A);
    A.colocar(1.45, y0, -1.35, -PI / 2 + 0.55); A.anim('Parado', t);
    A.somar('Peito', 0.35, 0, 0);
    A.ikBraco('D', P.cabW(0.64, 1.40 - 0.18 * g, -0.20 + 0.50 * g), V(0.2, -1, -0.4));
    A.rosto({ expressao: 'neutro', forca: 0.3 }); A.atualizarRosto();
    const k = suave(u / 1.2);
    camara({ pos: [lerp(1.75, 1.45, k), 6.95 + lerp(0.55, 0.40, k), lerp(-0.20, -0.52, k)], alvo: [0.30, 7.05, POCO.cz + lerp(0.0, 0.05, k)], fov: lerp(30, 24, k), roll: lerp(-0.04, 0.03, k), tr: 1.4, t, semente: 48 });
  }, { efeito: () => ({ subs: 3, obturador: 0.35 }) });

  // 27) eles a puxam para fora, por cima da soleira; a manta térmica nos ombros
  plano('tira', 1.8, 'D', (u, t) => {
    D0({ hora: H_SEG, t, rig: 'hall' });
    D().luzJanela(true);
    D().abrirPorta(2, 0.9); D().cab.abrirGrade(1);
    D().fenda.intensity = 60 * D().fendaK * 2.0;
    D().cab.luz(0.8, 0);
    const y0 = 2 * H, k = suave(u / 1.8);
    const x = lerp(0.36, 2.0, k), yy = 1.0 * suave(inv(0.50, 1.08, x));
    const a = m(); emD(a);
    a.colocar(x, Y_CAB + yy, POCO.cz, PI / 2);
    a.anim('Andar', u * 0.55);
    a.somar('Peito', 0.12 * (1 - k), 0, 0);
    a.rosto({ expressao: 'triste', forca: 0.55, olhar: [0.0, 0.1], piscar: 0.15 }); a.atualizarRosto(); a.lagrimaAt(t);
    S.manta.visible = u > 0.55;
    a.grupo.updateMatrixWorld(true);
    const A = S.b1, B = S.b2; emD(A, B);
    const fxA = Math.max(1.30, x + 0.05), gF = lerp(-PI / 2 + 0.30, PI / 2 - 0.30, suave(inv(0.45, 0.92, u)));
    A.colocar(fxA, y0, -1.40, gF); A.anim('Parado', t); B.colocar(fxA - 0.04, y0, -0.20, gF); B.anim('Parado', t + 0.6);
    A.somar('Peito', 0.16, 0, 0); B.somar('Peito', 0.16, 0, 0);
    A.grupo.updateMatrixWorld(true); B.grupo.updateMatrixWorld(true); a.grupo.updateMatrixWorld(true);
    a.ikBraco('E', a.pos('OmbroE').clone().add(V(0.38, -0.12, -0.10)), V(0, -1, -0.5));
    a.ikBraco('D', a.pos('OmbroD').clone().add(V(0.38, -0.12, 0.10)), V(0, -1, 0.5));
    A.ikBraco('D', a.pos('MaoE'), V(0, -0.8, -0.5)); B.ikBraco('E', a.pos('MaoD'), V(0, -0.8, 0.5));
    for (const b of [A, B]) { b.rosto({ expressao: 'neutro', forca: 0.3 }); b.atualizarRosto(); }
    camara({ pos: [lerp(3.7, 3.5, k), y0 + lerp(1.60, 1.50, k), lerp(1.5, 1.3, k)], alvo: [lerp(1.0, 1.8, k), y0 + 1.15, POCO.cz - 0.25], fov: lerp(46, 42, k), roll: lerp(0.04, -0.03, k), tr: 1.6, t, semente: 49 });
  }, { efeito: () => ({ subs: 3, obturador: 0.35 }) });

  // 28) na rua: a porta abre, ela sai amparada, com a manta, rumo à ambulância (luzes piscando)
  plano('rua_final', 2.4, 'R', (u, t) => {
    R0('manha', t, 0);
    estacionados('manha');
    S.fire.grupo.visible = true; S.fire.colocar(-1.0, 0, -1.45, PI / 2); S.fire.farois(0); S.fire.lanternas(0.3);
    giroflex(S.fire, t, [[0.38, 1.36, 0.62], [-0.38, 1.36, 0.62], [0.42, 1.0, -1.5], [-0.42, 1.0, -1.5]], { luz: false });
    S.amb.grupo.visible = true; S.amb.colocar(5.6, 0, -1.7, PI / 2); S.amb.farois(0); S.amb.lanternas(0.3);
    giroflex(S.amb, t, [[0.40, 1.62, 0.2], [-0.40, 1.62, 0.2], [0.45, 1.05, -1.6], [-0.45, 1.05, -1.6]], { luz: true, fase: 0.3 });
    R().abrirPorta(suave(inv(0.0, 0.5, u)));
    const a = m(); emR(a);
    const f = clamp((u - 0.35) / 2.0), zA = ZF + 0.30, zB = -4.9;
    const px = lerp(0.1, 2.9, suave(f)), pz = lerp(zA, zB, f);
    const giroA = GIRO(2.9 - 0.1, zB - zA) * 0.85 + 0.35;
    a.colocar(px, yDeg(pz), pz, giroA);
    a.anim('Andar', u * 0.42 + 0.3);
    a.rosto({ expressao: 'triste', forca: 0.4, olhar: [0.0, 0.1], piscar: 0.2 }); a.atualizarRosto();
    S.manta.visible = true;
    a.grupo.updateMatrixWorld(true);
    const b = S.b2; emR(b);
    b.colocar(px + 0.50, yDeg(pz), pz + 0.12, giroA); b.anim('Andar', u * 0.42 + 0.35);
    b.rosto({ expressao: 'neutro', forca: 0.3 }); b.atualizarRosto();
    b.grupo.updateMatrixWorld(true);
    b.ikBraco('E', a.pos('OmbroD').clone().add(V(0.0, 0.02, 0.0)), V(0.2, -1, 0.0));
    const k = suave(u / 2.4);
    camara({ pos: [lerp(-3.8, 3.4, k), lerp(1.35, 1.55, k), -3.55], alvo: [lerp(0.4, 2.8, k), lerp(1.55, 1.25, k), lerp(ZF + 1.2, -4.9, k)], fov: lerp(46, 44, k), roll: lerp(0.03, -0.04, k), tr: 1.1, t, semente: 50 });
  }, { efeito: () => ({ subs: 3, obturador: 0.35 }) });

  // 29) o rosto dela em close, de dia: alívio
  plano('rosto_final', 1.5, 'R', (u, t) => {
    R0('manha', t, 0);
    estacionados('manha');
    S.amb.grupo.visible = true; S.amb.colocar(5.6, 0, -1.7, PI / 2); S.amb.farois(0); S.amb.lanternas(0.3);
    giroflex(S.amb, t, [[0.40, 1.62, 0.2], [-0.40, 1.62, 0.2], [0.45, 1.05, -1.6], [-0.45, 1.05, -1.6]], { luz: false, fase: 0.3 });
    const a = m(); emR(a);
    a.colocar(3.0, 0.15, -5.0, -0.9); a.anim('Parado', t * 0.7);
    a.rosto({ expressao: 'sorriso', forca: 0.25 + 0.15 * suave(inv(0.3, 1.2, u)), olhar: [0.1, 0.35], piscar: piscada(t, 2.0, 0.4) }); a.atualizarRosto();
    a.lagrimaAt(t);
    S.manta.visible = true;
    a.grupo.updateMatrixWorld(true);
    const hp = a.pos('Cabeca').add(V(0, 0.07, 0));
    const f = V(Math.sin(-0.9), 0, Math.cos(-0.9)), l = V(f.z, 0, -f.x);
    const k = suave(u / 1.5), d = lerp(0.95, 0.70, k);
    const cp = hp.clone().add(f.clone().multiplyScalar(d)).add(l.clone().multiplyScalar(lerp(0.22, 0.10, k))).add(V(0, lerp(0.02, 0.0, k), 0));
    camara({ pos: [cp.x, cp.y, cp.z], alvo: [hp.x, hp.y, hp.z], fov: lerp(28, 22, k), roll: lerp(-0.04, 0.03, k), tr: 1.4, t, semente: 51 });
  }, { efeito: () => ({ subs: 3, obturador: 0.35 }) });

  // 30) cartela final
  plano('cartela', 3.0, 'Z', () => { cam_(); }, { efeito: u => ({ tintas: cartela(suave(inv(0.15, 0.75, u)) * (1 - suave(inv(2.5, 3.0, u)))) }) });
}
import { cam } from './motor.js';
function cam_() { cam.position.set(0, 0, 5); cam.lookAt(0, 0, 0); }
