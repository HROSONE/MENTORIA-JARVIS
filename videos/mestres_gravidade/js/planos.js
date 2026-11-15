// Linha do tempo: constrói os mundos, os atores e comanda cada plano em função do tempo.
import * as THREE from 'three';
import { mundos, cam, Rajada } from './motor.js';
import { clamp, lerp, suave, inv, ruido, mulberry32 } from './util.js';
import { S, plano, acharPlano, mostrar, luzSol, luzFrente, fill, camara, lerpV } from './base.js';
import { criarCabra, ventoU, ventoF, passoAndar, passoSalto } from './cabra.js';
import { construirP, CAMINHO, PONTA_E, PONTA_D } from './mundoP.js';
import { construirA, POUSOS, pontoGalho } from './mundoA.js';
import { construirV, CUME, MURO } from './mundoV.js';

export const X = {};                                   // estado compartilhado (mundos e atores)
const easeOut = u => 1 - Math.pow(1 - clamp(u), 3), easeIO = u => suave(clamp(u));

// ---------------------------------------------------------------- utilidades de movimento
// salto entre dois pontos (a, b: {x,y,z}) com altura de arco h; u 0..1. Posiciona o grupo e devolve a pose de pernas
function pular(C, a, b, u, h, { dirX = 1, lado = 0.2, incl0 = 0 } = {}) {
  const s = u, p = passoSalto(u), y = lerp(a.y, b.y, s) + 4 * h * s * (1 - s);
  C.grupo.position.set(lerp(a.x, b.x, s), y, lerp(a.z, b.z, s)); C.grupo.rotation.set(0, dirX > 0 ? 0 : Math.PI, 0);
  const sl = Math.atan2(b.y - a.y, Math.abs(b.x - a.x)) * 0.45;
  C.pose({ pes: p.pes, alt: p.alt, incl: p.incl + sl * Math.sin(Math.PI * u), pesc: p.pesc, cabeca: 0.1 * Math.sin(Math.PI * u), pesO: [0, 1, 2, 3].map(i => ({ lat: (lado + (i % 2 ? 0.1 : -0.1)) * (1 - 0.6 * Math.sin(Math.PI * u)), abre: p.abre })), lado });
  return p;
}
// parado em uma saliência: respira, vira a cabeça, mastiga; pés alinhados na linha da pedra (corpo afastado da parede)
function parado(C, pt, t, { lado = 0.2, cab = 0, vira = 0, mast = 0, orelha = 0, rabo = 0, dirX = 1, pesc = 0.1 } = {}) {
  C.grupo.position.set(pt.x, pt.y, pt.z); C.grupo.rotation.set(0, dirX > 0 ? 0 : Math.PI, 0);
  C.pose({ pes: [[0.3, 0], [0.26, 0], [-0.3, 0], [-0.26, 0]], alt: 0.003 * Math.sin(t * 2.2), pesc: pesc + 0.01 * Math.sin(t * 2.2), cabeca: cab, vira, mast, orelha, rabo: rabo + 0.1 * Math.sin(t * 1.3),
    pesO: [{ lat: lado - 0.1 }, { lat: lado + 0.1 }, { lat: lado - 0.1 }, { lat: lado + 0.1 }], lado });
}

export async function construirTudo() {
  X.P = construirP(mundos.P);
  X.bode = criarCabra({ bode: true, dens: 1, semente: 3 });
  mundos.P.add(X.bode.grupo);
  X.ledges = X.P.ledges;
  X.A = construirA(mundos.A);
  X.cabras = POUSOS.map((P, i) => { const C = criarCabra({ bode: i % 2 === 0, dens: i === 2 ? 0.9 : 0.45, semente: 10 + i, placa: i === 2 }); mundos.A.add(C.grupo); return C; });
  X.V = await construirV(mundos.V);
  montarPlanos();
  return S;
}

// ---------------------------------------------------------------- partículas (pedrinhas e poeira), reaproveitadas
function rajadaPedras(pai, t0, origem, n = 30, vida = 2.2) {
  const r = new Rajada(pai, { n, geo: new THREE.IcosahedronGeometry(1, 0), mat: new THREE.MeshStandardMaterial({ color: 0x8a6a52, roughness: 1 }), t0, vida, semente: Math.floor(t0 * 100), origem, raio: 0.04, vel: [0.1, 0.8], dir: [0, 1, 0.4], abre: 1.2, grav: 4.5, arrasto: 0.3, tam: [0.006, 0.02], gira: 6, chao: -50, fim: 'some' });
  return r;
}
const ledgePt = i => { const l = X.ledges[i]; return { x: l.x, y: l.y, z: l.z }; };

function montarPlanos() {
  const bode = X.bode, ped = [];
  // ======================================================= 1. O desafio impossível (0–5 s)
  plano('desafio', 5, 'P', (u, t) => {
    mundos.P.add(bode.grupo);
    mostrar('P', 0xb8c8f0, [0xd8c8e8, 0.0045]); ventoF.value = 1.4; ventoU.value = t * 0.55;
    const L0 = ledgePt(0);
    parado(bode, L0, t, { vira: 0.12 * Math.sin(t * 0.5), cab: 0.06 * Math.sin(t * 0.7) - 0.03, orelha: 0.3 * Math.exp(-Math.pow((t - 2.4) / 0.08, 2)), mast: 0 });
    // o casco de trás bate seco na pedra (4,35 s): a pata dianteira levanta e firma
    const k = clamp((t - 4.2) / 0.5); const pe = bode.pernas.FD; bode.pose({ ...bode._ult, pes: [[0.3, 0], [0.26 + 0.1 * Math.sin(Math.PI * k) , 0.07 * Math.sin(Math.PI * k)], [-0.3, 0], [-0.26, 0]] });
    // câmera: plano aberto do paredão -> zoom rápido revela o bode -> empurra devagar com órbita leve
    const d0 = 17, d1 = 4.0, d2 = 3.1, e = easeOut(inv(0.05, 1.25, u * 5)), e2 = easeIO(inv(1.25, 5, u * 5));
    const dist = u * 5 < 1.25 ? lerp(d0, d1, e) : lerp(d1, d2, e2), az = lerp(0.06, -0.3, easeIO(u)), fov = lerp(40, 30, e);
    const alvo = [L0.x + 0.2, L0.y + 0.7, L0.z], pos = [alvo[0] + Math.sin(az) * dist, alvo[1] + 0.25 + 0.35 * (1 - e), alvo[2] + Math.cos(az) * dist];
    camara({ pos, alvo, fov, t, tr: 0.7, roll: 0.01 * Math.sin(t * 0.6) });
    luzSol([L0.x - 7, L0.y + 3, 5], [L0.x, L0.y, 0], { caixa: 4.5, k: 3.6, hemiK: 0.55 });
  });
  // ======================================================= 2. A escalada vertical (5–12 s)
  plano('escalada', 7, 'P', (u, t, p) => {
    mundos.P.add(bode.grupo);
    mostrar('P', 0xb8c8f0, [0xd8c8e8, 0.006]); ventoF.value = 1.0;
    const L = u * 7;                                      // tempo local em segundos
    const sl = 0.3;                                       // câmera lenta: o pelo e o vento seguem devagar
    ventoU.value = t * sl;
    const Hop = (i, j, t0, dur, h = 0.45) => ({ a: ledgePt(i), b: ledgePt(j), t0, dur, h });
    let cenario;
    if (L < 3.3) {                                        // a) contra-plongée, ledges 0 -> 1 -> 2
      const hops = [Hop(0, 1, 0.3, 1.35), Hop(1, 2, 1.8, 1.35)];
      let est = null; for (const h of hops) if (L >= h.t0 && L < h.t0 + h.dur) est = h;
      let ref;
      if (est) { const uu = (L - est.t0) / est.dur; pular(bode, est.a, est.b, uu, est.h); ref = lerpV([est.a.x, est.a.y, est.a.z], [est.b.x, est.b.y, est.b.z], uu); }
      else { const i = L < 0.3 ? 0 : L < 1.8 ? 1 : 2; parado(bode, ledgePt(i), t, { mast: 0 }); ref = [ledgePt(i).x, ledgePt(i).y, ledgePt(i).z]; }
      const sub = easeIO(L / 3.3);
      camara({ pos: [ref[0] - 3.4 + 0.8 * sub, ref[1] - 5.2 + 0.8 * sub, ref[2] + 6.2 - 1.4 * sub], alvo: [ref[0] + 0.3, ref[1] + 0.7, ref[2]], fov: 38, t, tr: 0.8 });
      luzSol([ref[0] - 6, ref[1] + 4, 6], [ref[0], ref[1], 0], { caixa: 5, k: 3.6, hemiK: 0.55 });
    } else if (L < 4.9) {                                 // b) macro: o casco fendido pousa e agarra a microfissura
      const lp = L - 3.3, A = ledgePt(2), B = ledgePt(3), dur = 1.5, uu = clamp(lp / dur);
      pular(bode, A, B, uu, 0.5);
      bode.grupo.updateMatrixWorld(true);
      const hoof = new THREE.Vector3(); bode.pernas.FD.pe.getWorldPosition(hoof);
      const sm = easeIO(lp / 1.6), dc = 0.95 - 0.2 * sm;
      camara({ pos: [hoof.x + 0.3, hoof.y + 0.22, hoof.z + dc], alvo: [hoof.x + 0.04, hoof.y + 0.05, hoof.z], fov: 28, t, tr: 0.3 });
      luzSol([B.x - 3, B.y + 1.5, B.z + 3], [B.x, B.y, B.z], { caixa: 2.2, k: 4, hemiK: 0.7 });
      fill.position.set(hoof.x + 0.3, hoof.y + 0.35, hoof.z + 0.7); fill.intensity = 5;
    } else {                                              // c) topo: ledges 5 -> 6 -> 7 -> ponta E -> salto sobre o entalhe (corta no ápice)
      const lp = L - 4.9, pts = [ledgePt(7), { x: PONTA_E.x, y: PONTA_E.y, z: 0.45 }];
      const hops = [{ a: pts[0], b: pts[1], t0: 0.1, dur: 0.8, h: 0.35 }];
      const salto = { a: pts[1], b: { x: PONTA_D.x, y: PONTA_D.y, z: 0.45 }, t0: 1.0, dur: 2.2, h: 0.9 };      // o ápice cai exatamente no corte (2,1 s)
      let est = null; for (const h of [...hops, salto]) if (lp >= h.t0 && lp < h.t0 + h.dur) est = h;
      let ref;
      if (est) { const uu = (lp - est.t0) / est.dur; pular(bode, est.a, est.b, uu, est.h); ref = lerpV([est.a.x, est.a.y, est.a.z], [est.b.x, est.b.y, est.b.z], uu); ref[1] += 4 * est.h * uu * (1 - uu); }
      else { const i = lp < 0.1 ? 0 : 1; parado(bode, pts[i], t, {}); ref = [pts[i].x, pts[i].y, pts[i].z]; }
      const k = easeIO(lp / 2.1);
      camara({ pos: [ref[0] + 1.2 - 0.8 * k, ref[1] - 5.6 + 2.0 * k, ref[2] + 6.5 - 1.5 * k], alvo: [ref[0] + 0.1, ref[1] + 0.9, ref[2]], fov: lerp(40, 34, k), t, tr: 0.6 });
      luzSol([ref[0] - 6, ref[1] + 4, 6], [ref[0], ref[1], 0], { caixa: 5, k: 3.6, hemiK: 0.55 });
    }
  });
  // ======================================================= 3. O pomar nas alturas (12–20 s): arganeira, cinco cabras nos galhos finos
  plano('pomar', 8, 'A', (u, t) => {
    mostrar('A', 0xb8c8f0, [0xe8d0c8, 0.008]); ventoF.value = 1.0; ventoU.value = t * 0.4;
    const L = u * 8;
    X.cabras.forEach((C, i) => {
      const P = POUSOS[i], gp = pontoGalho(i), hd = new THREE.Vector2(Math.cos(P.yaw), -Math.sin(P.yaw)), hz = new THREE.Vector2(gp.tg.x, gp.tg.z), horiz = hz.length() || 1, sgn = Math.sign(hd.dot(hz)) || 1;
      const incl = Math.atan2(gp.tg.y * sgn, horiz);
      C.grupo.position.set(gp.p.x, gp.p.y + 0.052, gp.p.z); C.grupo.rotation.set(0, P.yaw, 0);
      const ms = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * (1.5 + 0.1 * i) + i * 2), ear = 0.35 * Math.exp(-Math.pow(((t + i * 0.7) % 3.1 - 1.3) / 0.08, 2));
      const lookC = i === 2;
      C.pose({ pes: [[0.2, 0], [0.18, 0], [-0.2, 0], [-0.18, 0]], alt: 0.004 * Math.sin(t * 2 + i), incl, pesc: lookC ? 0.05 : 0.18 + 0.1 * Math.sin(t * 0.8 + i), cabeca: lookC ? 0.02 : 0.25 * Math.sin(t * 0.9 + i) - 0.1,
        vira: lookC ? 0.05 * Math.sin(t * 0.7) : 0.3 * Math.sin(t * 0.5 + i), mast: ms * (0.55 + 0.35 * (i === 2 ? 1 : 0)), orelha: ear, rabo: 0.3 * Math.sin(t * 2.2 + i),
        pesO: [{ lat: -0.1 }, { lat: 0.1 }, { lat: -0.1 }, { lat: 0.1 }], lado: 0 });
    });
    // câmera: começa rente ao chão olhando o tronco retorcido, sobe pelo tronco e termina no close da cabra que olha a lente
    const C3 = X.cabras[2]; C3.grupo.updateMatrixWorld(true); const h3 = new THREE.Vector3(); C3.cab.getWorldPosition(h3);
    const e1 = easeIO(inv(0, 2.6, L)), e2 = easeIO(inv(2.4, 6.0, L)), e3 = easeIO(inv(5.4, 8, L));
    let pos = lerpV([3.8, 0.5, 6.2], [3.0, 1.4, 5.8], e1), alvo = lerpV([0, 1.6, 0], [0, 2.4, 0], e1);
    pos = lerpV(pos, [2.8, 4.4, 5.6], e2); alvo = lerpV(alvo, [0.2, 4.7, 0.6], e2);
    pos = lerpV(pos, [h3.x + 0.8, h3.y + 0.1, h3.z + 2.3], e3); alvo = lerpV(alvo, [h3.x, h3.y + 0.02, h3.z], e3);
    camara({ pos, alvo, fov: lerp(42, 24, e3), t, tr: 0.55, roll: 0.012 * Math.sin(t * 0.5) });
    luzSol([9, 5, 7], [0, 3.5, 0], { caixa: 7, k: 3.6, hemiK: 1.0 }); luzFrente([2, 3, 12], [0, 4, 0], 0.7);
  });
  // ======================================================= 4. O telhado urbano (20–26 s): o bode caminha pela cumeeira e para na ponta
  plano('telhado', 6, 'V', (u, t) => {
    mundos.V.add(bode.grupo);
    mostrar('V', 0xb8c8f0, [0xf8d8b8, 0.005]); ventoF.value = 1.2; ventoU.value = t * 0.5;
    const L = u * 6, ch = bode, ya = CUME.y + 0.02, x0 = -3.0, x1 = 3.9, k = easeIO(inv(0.2, 4.0, L)), x = lerp(x0, x1, k), andando = L > 0.2 && L < 4.1;
    const fase = (L * 1.1) % 1, w = passoAndar(fase, 0.46, 0.06);
    ch.grupo.position.set(x, ya, 0); ch.grupo.rotation.set(0, 0, 0);
    const vel = Math.sin(Math.PI * clamp((L - 0.2) / 3.9));
    const olha = easeIO(inv(4.2, 5.2, L));
    ch.pose({ pes: andando ? w.pes.map((f, i) => [f[0] * (0.2 + 0.8 * vel) + (i % 2 ? 0.02 : 0), f[1] * vel]) : [[0.3, 0], [0.26, 0], [-0.3, 0], [-0.26, 0]], alt: andando ? w.alt : 0.003 * Math.sin(t * 2), pesc: 0.12, cabeca: lerp(w.cabeca, -0.55, olha), vira: -1.15 * olha, mast: 0, orelha: 0.3 * Math.exp(-Math.pow((L - 5.0) / 0.1, 2)), rabo: 0.25 * Math.sin(t * 2.6),
      pesO: [{ lat: -0.1 }, { lat: 0.1 }, { lat: -0.1 }, { lat: 0.1 }], lado: 0 });
    fumaca(L);
    const a = easeIO(inv(0, 3.8, L)), b = easeIO(inv(3.8, 6, L));
    let pos = lerpV([-5.2, 2.2, 10.2], [2.0, 2.5, 9.4], a), alvo = [x + 0.3, 6.3, 0];
    pos = lerpV(pos, [7.2, 5.6, 6.4], b); alvo = lerpV(alvo, [x + 0.2, 6.1, 0.2], b);
    camara({ pos, alvo, fov: lerp(27, 28, b), t, tr: 0.6, roll: 0.012 * Math.sin(t * 0.7) });
    luzSol([16, 7, -10], [2, 5, 0], { caixa: 9, k: 3.8, hemiK: 1.0 }); luzFrente([0, 6, 22], [2, 5.5, 0], 0.8);
  });
  // ======================================================= 5. O salto final (26–30 s): close do rosto, salto do telhado para o muro, equilíbrio perfeito, corte seco para o preto
  plano('salto', 4, 'V', (u, t) => {
    mundos.V.add(bode.grupo);
    mostrar('V', 0xb8c8f0, [0xf8d8b8, 0.005]); ventoF.value = 1.3; ventoU.value = t * 0.5;
    const L = u * 4, ch = bode, ya = CUME.y + 0.02, A = { x: 3.95, y: ya, z: 0 }, B = { x: 7.2, y: MURO.y + 0.12, z: 0 };
    const tj = 1.65, dur = 1.15;                                      // salto começa em L=1,65 (27,65 s) e dura 1,15 s
    let ref;
    if (L < tj) {                                                     // close do rosto: ele encara a câmera, vira e se agacha
      const ag = easeIO(inv(1.2, tj, L));
      parado(ch, A, t, { vira: lerp(-1.1, 0, easeIO(inv(0.8, 1.4, L))), cab: lerp(-0.1, 0.05, ag), mast: 0, orelha: 0.3 * Math.exp(-Math.pow((L - 0.6) / 0.08, 2)), lado: 0 });
      ch.pose({ ...ch._ult, alt: -0.08 * ag, pesc: 0.1 - 0.1 * ag });
      ref = [A.x, A.y, A.z];
    } else if (L < tj + dur) { const uu = (L - tj) / dur; pular(ch, A, B, uu, 0.95, { lado: 0 }); ref = lerpV([A.x, A.y, A.z], [B.x, B.y, B.z], uu); ref[1] += 4 * 0.95 * uu * (1 - uu); }
    else { const s = L - tj - dur, wob = 0.012 * Math.exp(-s * 5) * Math.sin(s * 22); parado(ch, B, t, { rabo: 0.5 * Math.exp(-s * 3) * Math.sin(s * 18), lado: 0 }); ch.pose({ ...ch._ult, incl: wob }); ref = [B.x, B.y, B.z]; }
    // câmera: close do rosto (3/4) -> recua e acompanha o salto lateralmente -> trava no equilíbrio
    ch.grupo.updateMatrixWorld(true); const hd = new THREE.Vector3(); ch.cab.getWorldPosition(hd);
    const cf = easeIO(inv(1.0, 1.9, L)), cs = easeIO(inv(tj, tj + dur + 0.4, L));
    let pos = lerpV([hd.x + 1.35, hd.y + 0.1, hd.z + 1.25], [A.x + 2.2, A.y + 0.9, 5.6], cf), alvo = lerpV([hd.x, hd.y, hd.z], [ref[0] + 0.5, ref[1] + 0.7, 0], cf);
    pos = lerpV(pos, [ref[0] + 0.7, ref[1] + 0.9, 5.4], cs); alvo = lerpV(alvo, [ref[0] + 0.3, ref[1] + 0.75, 0], cs);
    camara({ pos, alvo, fov: lerp(24, 34, cf), t, tr: 0.45 });
    luzSol([16, 7, -9], [5, 5, 0], { caixa: 9, k: 3.8, hemiK: 1.0 }); luzFrente([5, 6, 22], [5, 5.5, 0], 0.9);
  }, { efeito: u => ({ fade: u >= 3.72 ? 1 : 0 }) });
}

function fumaca(L) {
  const bs = X.V.bolas; bs.forEach((b, i) => { const ph = ((L * 0.35 + i / bs.length) % 1), s = 0.18 + 0.7 * ph; b.position.set(-10.4 + 1.6 * ph + 0.2 * Math.sin(i), 4.7 + 3.2 * ph, -1.2); b.scale.setScalar(s); b.material.opacity = 0.4 * (1 - ph) * Math.min(1, ph * 6); });
}

// ---------------------------------------------------------------- avanço do vídeo
export function atualizar(t) {
  const p = acharPlano(t);
  p.fn(clamp((t - p.t0) / p.dur, 0, 1), t, p);
}
export function efeitos(t) {
  const e = { subs: 1, obturador: 0.35, fade: 0, flash: 0, flashCor: '255,255,255', tintas: null };
  const p = acharPlano(t); if (p.efeito) Object.assign(e, p.efeito(t - p.t0, t, p));
  return e;
}
