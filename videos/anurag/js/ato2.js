// Ato 2: a perseguição na estrada, as batidas e o impacto na árvore.
import * as THREE from 'three';
import { cam, mundos, Rajada, brilho, texFumaca, canvasTex } from './motor.js';
import { clamp, lerp, suave, suave5, entra, sai, inv, ruido, chaves, mulberry32 } from './util.js';
import { S, V, PI, plano, camara, mix3 } from './base.js';
import { construirHistoria, COMP_T, COMP_C } from './historia.js';
import { construirB, cortarB } from './mundoB.js';

const M = (cor, rug = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: rug, ...extra });
const loc = (carro, x, y, z) => carro.corpoGrupo.localToWorld(new THREE.Vector3(x, y, z));
const dirLoc = (carro, x, y, z) => loc(carro, x, y, z).sub(loc(carro, 0, 0, 0));
const aMundo = (est, lx, lz, y = 0.5) => [est.x + lx * Math.cos(est.yaw) + lz * Math.sin(est.yaw), y, est.z - lx * Math.sin(est.yaw) + lz * Math.cos(est.yaw)];
const XD = 0.55, Y0 = 0.18;           // banco do motorista (lado esquerdo = +X) e altura do piso dentro do carro

// ---------------------------------------------------------------------------------------------------- interior do carro (painel, volante, bancos, retrovisor, velocímetro)
function criarInterior(carro, comVelocimetro) {
  const g = new THREE.Group(); g.visible = false; carro.corpoGrupo.add(g);
  const preto = M(0x0d0e11, 0.75), cinza = M(0x24262d, 0.7), banco = M(0x1c1e24, 0.9), teto = M(0x15171c, 0.9);
  const cx = (w, h, d, mat, x, y, z, rx = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.x = rx; g.add(m); return m; };
  cx(2.2, 0.34, 0.60, cinza, 0, 0.92, 0.70); cx(2.1, 0.10, 0.40, preto, 0, 1.10, 0.62, -0.25);
  const vol = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.024, 10, 30), preto); vol.position.set(XD, 1.04, 0.36); vol.rotation.x = -1.18; g.add(vol);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 14), cinza); hub.position.copy(vol.position); hub.rotation.x = -1.18; g.add(hub);
  const bf = new THREE.Group(); g.add(bf);                                                  // bancos da frente (somem na vista de trás)
  const cf = (w, h, d, mat, x, y, z, rx = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.x = rx; bf.add(m); return m; };
  for (const x of [XD, -XD]) { cf(0.54, 0.16, 0.56, banco, x, 0.48, -0.12); cf(0.54, 0.78, 0.15, banco, x, 0.90, -0.46, -0.12); cf(0.24, 0.22, 0.11, banco, x, 1.40, -0.47); }
  for (const x of [0.66, 0, -0.66]) { cx(0.52, 0.16, 0.5, banco, x, 0.48, -0.98); cx(0.52, 0.74, 0.14, banco, x, 0.88, -1.26, -0.1); cx(0.22, 0.22, 0.1, banco, x, 1.36, -1.26); }
  for (const sg of [1, -1]) {                                  // colunas A, painéis de porta, teto
    cx(0.07, 0.9, 0.09, teto, sg * 1.02, 1.36, 0.45, 0.0).rotation.set(-0.7, 0, sg * 0.05);
    cx(0.05, 0.7, 2.2, cinza, sg * 1.09, 0.80, -0.1);
  }
  cx(2.2, 0.06, 2.6, teto, 0, 1.78, -0.2);
  const espelho = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.085, 0.03), new THREE.MeshStandardMaterial({ color: 0x9ea6b3, emissive: 0xb9c6d8, emissiveIntensity: 0.35, roughness: 0.2, metalness: 0.4 }));
  espelho.position.set(0.05, 1.52, 0.52); g.add(espelho);
  const luz = new THREE.PointLight(0xe8f0ff, 0, 5, 1.6); luz.position.set(0.05, 1.45, 0.3); g.add(luz);
  const painel = new THREE.PointLight(0x39d6ff, 0, 2.5, 1.8); painel.position.set(XD, 1.18, 0.35); g.add(painel);
  const frente = new THREE.PointLight(0xffb59a, 0, 4.5, 1.5); frente.position.set(XD - 0.35, 1.72, 0.30); g.add(frente);
  const I = { grupo: g, bf, espelho, luz, painel, frente, mph: -1 };
  if (comVelocimetro) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.40, 0.20), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    pl.position.set(XD, 1.14, 0.55); pl.rotation.set(0.45, PI, 0); g.add(pl);
    I.set = mph => {
      if (mph === I.mph) return; I.mph = mph;
      const x = c.getContext('2d');
      x.fillStyle = '#04070c'; x.fillRect(0, 0, 256, 128);
      x.strokeStyle = 'rgba(57,214,255,0.35)'; x.lineWidth = 3; x.strokeRect(6, 6, 244, 116);
      x.fillStyle = mph >= 95 ? '#ff4b3a' : '#7be8ff'; x.font = 'bold 84px "DejaVu Sans Mono", monospace'; x.textAlign = 'center'; x.shadowColor = x.fillStyle; x.shadowBlur = 14;
      x.fillText(String(mph), 118, 88);
      x.shadowBlur = 0; x.fillStyle = 'rgba(123,232,255,0.8)'; x.font = 'bold 24px sans-serif'; x.fillText('MPH', 214, 110);
      tex.needsUpdate = true;
    };
    I.set(60);
  }
  return I;
}

// ---------------------------------------------------------------------------------------------------- efeitos (faíscas, cacos, vidro, fumaça, folhas) – tudo determinístico em função do tempo da história
function criarFX(H) {
  const B = mundos.B, F = { lista: [] };
  const add = r => { F.lista.push(r); return r; };
  const geoF = new THREE.IcosahedronGeometry(1, 0), matF = new THREE.MeshBasicMaterial({ color: 0xffbb66, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false });
  const geoC = new THREE.BoxGeometry(1, 0.32, 0.7), matC = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.25 });
  const geoV = new THREE.PlaneGeometry(1, 1), matV = new THREE.MeshStandardMaterial({ color: 0xcfe8ff, roughness: 0.08, transparent: true, opacity: 0.8, side: THREE.DoubleSide, emissive: 0x24415f, emissiveIntensity: 0.6 });
  const geoS = new THREE.PlaneGeometry(1, 1), matS = new THREE.MeshBasicMaterial({ map: texFumaca(), transparent: true, depthWrite: false, color: 0xb4b8c0, opacity: 0.5 });
  const matP = new THREE.MeshBasicMaterial({ map: texFumaca(), transparent: true, depthWrite: false, color: 0x6f737b, opacity: 0.55 });
  const geoL = new THREE.PlaneGeometry(1, 0.7), matL = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide });
  const [s1, s2, sH] = H.taps, tb = H.tBatida;
  const T = s => H.T(s), vT = s => H.T(s).v;
  const cores = ['#c9ced6', '#8e95a3', '#1a1c21', '#d6342e', '#e8e8ec'];
  // toques leves
  for (const [s, n] of [[s1, 1], [s2, 2]]) {
    const o = aMundo(T(s), 0.8, -2.4, 0.55);
    add(new Rajada(B, { n: 16 * n, geo: geoF, mat: matF, t0: s, vida: 0.55, semente: 3 * n, origem: o, raio: 0.06, vel: [3, 8], dir: [0, 0.5, -1], v0: [0, 0, vT(s) * 0.85], grav: 9.8, arrasto: 0.7, tam: [0.018, 0.04] }));
    add(new Rajada(B, { n: 6 * n, geo: geoC, mat: matC, t0: s, vida: 1.5, semente: 5 * n, origem: o, raio: 0.1, vel: [2, 6], dir: [0, 0.6, -0.5], v0: [0, 0, vT(s) * 0.8], grav: 9.8, arrasto: 0.5, tam: [0.05, 0.12], cores, fim: 'fica' }));
  }
  // batida final: chuva de faíscas, cacos, vidro e fumaça de pneu
  const of = aMundo(T(sH), 0.8, -2.4, 0.55);
  add(new Rajada(B, { n: 110, geo: geoF, mat: matF, t0: sH, vida: 0.9, semente: 21, origem: of, raio: 0.1, vel: [4, 13], dir: [0, 0.4, -1], abre: 1.2, v0: [0, 0, vT(sH) * 0.8], grav: 9.8, arrasto: 0.6, tam: [0.02, 0.05] }));
  add(new Rajada(B, { n: 40, geo: geoC, mat: matC, t0: sH, vida: 2.5, semente: 22, origem: of, raio: 0.15, vel: [3, 10], dir: [0, 0.6, -0.4], abre: 1.1, v0: [0, 0, vT(sH) * 0.7], grav: 9.8, arrasto: 0.4, tam: [0.06, 0.18], cores, fim: 'fica' }));
  add(new Rajada(B, { n: 70, geo: geoV, mat: matV, t0: sH, vida: 2.0, semente: 23, origem: of, raio: 0.3, vel: [2, 9], dir: [0, 0.8, -0.3], abre: 1.2, v0: [0, 0, vT(sH) * 0.75], grav: 9.8, arrasto: 0.5, tam: [0.05, 0.13], gira: 14, fim: 'fica' }));
  add(new Rajada(B, { n: 14, geo: geoS, mat: matS, t0: sH, vida: 2.6, semente: 24, origem: of, raio: 0.3, vel: [1, 3], dir: [0, 0.5, 0], v0: [0, 0, vT(sH) * 0.6], grav: -0.4, arrasto: 1.2, tam: [0.8, 1.4], tam1: [3.2, 4.8], billboard: true, sobe: 0.5 }));
  // freada do carro de trás: fumaça de pneu ao longo da pista
  add(new Rajada(B, { n: 34, geo: geoS, mat: matS, t0: sH, vida: 2.2, semente: 25, origem: [0, 0.4, 0], raio: 0.2, vel: [0.2, 0.8], dir: [0, 1, 0], abre: 1.4, grav: -0.3, arrasto: 1.5, tam: [0.9, 1.5], tam1: [3.4, 5.2], billboard: true })
    .ajustar((i, q) => { const s = sH + 0.05 + i * (3.1 / 34); const c = H.C(s); q.nasce = s; q.p.set(c.x + (i % 2 ? 0.9 : -0.9), 0.35, c.z - 1.2); }));
  // a batida na árvore
  const t1 = T(tb), no = aMundo(t1, 0, 2.3, 0.7);
  add(new Rajada(B, { n: 90, geo: geoC, mat: matC, t0: tb, vida: 3, semente: 31, origem: no, raio: 0.3, vel: [2, 11], dir: [0.4, 0.5, 0.3], abre: 1.2, grav: 9.8, arrasto: 0.35, tam: [0.06, 0.2], cores, fim: 'fica' }));
  add(new Rajada(B, { n: 110, geo: geoV, mat: matV, t0: tb, vida: 3, semente: 32, origem: no, raio: 0.4, vel: [2, 10], dir: [0.3, 0.8, 0.2], abre: 1.3, grav: 9.8, arrasto: 0.4, tam: [0.05, 0.14], gira: 16, fim: 'fica' }));
  add(new Rajada(B, { n: 40, geo: geoF, mat: matF, t0: tb, vida: 0.8, semente: 33, origem: no, raio: 0.2, vel: [3, 9], dir: [0.3, 0.5, 0], abre: 1.3, grav: 9.8, arrasto: 0.6, tam: [0.02, 0.05] }));
  add(new Rajada(B, { n: 26, geo: geoS, mat: matS, t0: tb, vida: 3.2, semente: 34, origem: no, raio: 0.7, vel: [2, 6], dir: [0.3, 0.2, 0.2], abre: 1.5, grav: 0, arrasto: 1.6, tam: [1.0, 1.8], tam1: [4.0, 6.5], billboard: true, sobe: 0.6 }));
  add(new Rajada(B, { n: 90, geo: geoL, mat: matL, t0: tb, vida: 4.0, semente: 35, origem: [H.arvore.x, 5.0, H.arvore.z], raio: 2.4, vel: [0.5, 3], dir: [0, -0.2, 0], abre: 1.0, grav: 2.0, arrasto: 1.1, tam: [0.10, 0.20], gira: 7, cores: ['#2f6b34', '#3c8a42', '#274f2b', '#4f9a4a'], fim: 'fica' }));
  // fumaça constante do capô do carro batido (contínua)
  add(new Rajada(B, { n: 70, geo: geoS, mat: matP, t0: tb, vida: 4.4, semente: 36, origem: no, raio: 0.35, vel: [0.1, 0.8], dir: [0, 1, 0], abre: 0.8, grav: -0.5, arrasto: 0.9, tam: [0.55, 0.9], tam1: [2.6, 4.2], billboard: true, sobe: 0.9, nasce: 60 })
    .ajustar((i, q) => { q.nasce = tb + 0.1 + i * 0.32; }));
  F.atualizar = (s) => { for (const r of F.lista) r.atualizar(s, cam); };
  return F;
}

// ---------------------------------------------------------------------------------------------------- montagem
export async function prepararB() {
  S.H = construirHistoria();
  S.B = await construirB(S.H);
  mundos.B.add(S.hatch.grupo, S.sedan.grupo);
  S.hatch.preparar('tras', [{ centro: [0.35, 0.50, -1.40], raio: 1.0, dir: [-0.12, -0.05, 1], prof: 0.58 }]);
  S.hatch.preparar('frente', [{ centro: [0.15, 0.50, 1.36], raio: 1.15, dir: [0.04, -0.06, -1], prof: 0.82 }]);
  S.sedan.preparar('frente', [{ centro: [-0.30, 0.46, 1.25], raio: 0.85, dir: [0, 0, -1], prof: 0.45 }]);
  S.intT = criarInterior(S.hatch, false); S.intC = criarInterior(S.sedan, true);
  S.luzCam = new THREE.PointLight(0xdbe6ff, 0, 34, 1.5); mundos.B.add(S.luzCam); S.luzCamK = 0;
  S.aposCamera = () => { S.luzCam.position.copy(cam.position).add(new THREE.Vector3(0, 0.6, 0)); S.luzCam.intensity = S.luzCamK; S.luzCamK = 0; };
  S.fx = criarFX(S.H);
  // o poste da batida balança e solta um clarão
  S.clarao = brilho('190,215,255', 3.5, 0); S.clarao.position.set(-6.4, 6.6, S.H.arvore.z + 4.2); mundos.B.add(S.clarao);
  S.luzClarao = new THREE.PointLight(0xaad0ff, 0, 40, 1.6); S.luzClarao.position.copy(S.clarao.position); mundos.B.add(S.luzClarao);
  // carros: bancos e passageiros
  for (const a of [S.jA, S.jB, S.jC, S.jD, S.jE, S.homem]) mundos.B.add(a.grupo);
  montarAto2();
}

function danos(s) {
  const [s1, s2, sH] = S.H.taps, tb = S.H.tBatida;
  const k = (a, b, x) => suave(inv(a, b, x));
  S.hatch.amassar('tras', 0.12 * k(s1, s1 + 0.06, s) + 0.26 * k(s2, s2 + 0.06, s) + 0.62 * k(sH, sH + 0.08, s));
  S.hatch.amassar('frente', k(tb, tb + 0.10, s));
  S.sedan.amassar('frente', 0.12 * k(s1, s1 + 0.06, s) + 0.20 * k(s2, s2 + 0.06, s) + 0.55 * k(sH, sH + 0.08, s));
}

// põe os dois carros no instante s da história; luzes, danos, efeitos e corte de árvores
export function poeCarros(s, { visT = true, visC = true } = {}) {
  const H = S.H, t = H.T(s), c = H.C(s);
  S.intT.grupo.visible = false; S.intC.grupo.visible = false; S.intT.bf.visible = true; S.intC.bf.visible = true;
  S.hatch.corpo.visible = true; S.sedan.corpo.visible = true;
  mundos.B.add(S.hatch.grupo, S.sedan.grupo);
  S.hatch.grupo.visible = S.sedan.grupo.visible = true;
  S.hatch.colocar(t.x, 0, t.z, t.yaw, { pitch: t.pitch, roll: t.roll, dist: t.dist });
  S.sedan.colocar(c.x, 0, c.z, c.yaw, { pitch: c.pitch, roll: c.roll, dist: c.dist });
  S.hatch.farois(1); S.sedan.farois(1);
  S.hatch.cones.forEach(o => { o.visible = visT; }); S.hatch.glows.forEach(o => { o.visible = visT; });
  S.sedan.cones.forEach(o => { o.visible = visC; }); S.sedan.glows.forEach(o => { o.visible = visC; });
  const frenando = s > H.final && s < H.final + 3.6;
  S.hatch.lanternas(0.32); S.sedan.lanternas(frenando || (s > H.final + 3.6 && s < H.final + 6.5) ? 1 : 0.3);
  S.sedan.glows.forEach(g => g.scale.setScalar(2.2)); S.hatch.glows.forEach(g => g.scale.setScalar(2.2));
  danos(s);
  S.hatch.grupo.updateMatrixWorld(true); S.sedan.grupo.updateMatrixWorld(true);
  S.fx.atualizar(s);
  cortarB(S.B, t.z);
  S.B.ceu.position.copy(cam.position);
  // poste da batida: tremor e clarão logo depois do impacto
  const td = s - H.tBatida;
  S.B.posteBatida.rotation.z = td > 0 ? 0.045 * Math.exp(-td * 2) * Math.sin(td * 22) : 0;
  const cl = td > 0 && td < 0.5 ? Math.max(0, Math.sin(td * 70)) * Math.exp(-td * 5) : 0;
  S.clarao.material.opacity = cl; S.luzClarao.intensity = 900 * cl;
}

function sentarEm(ator, carro, x, z, giro = 0, { y = 0.52, coxa = -1.42 } = {}) {
  carro.corpoGrupo.add(ator.grupo);
  ator.grupo.visible = true; ator.grupo.scale.setScalar(ator.escala);
  ator.grupo.position.set(x, Y0, z); ator.grupo.rotation.set(0, giro, 0);
  ator.anim('Parado', 0);
  ator.sentar({ y, coxa });
}
function maosVolante(ator, carro, xv = XD) {
  const pole = e => dirLoc(carro, e * 0.55, -0.8, -0.2);
  ator.ikBraco('E', loc(carro, xv + 0.17, 1.04, 0.35), pole(1)); ator.ikBraco('D', loc(carro, xv - 0.17, 1.04, 0.35), pole(-1));
}

function montarAto2() {
  const H = S.H;
  // 1) vista de cima: os dois carros e os faróis na estrada
  plano('drone', 1.35, 'B', (u, t) => {
    const s = 3.4 + u; poeCarros(s);
    const T = H.T(s), C = H.C(s), mz = (T.z + C.z) / 2, ph = 0.7 + 1.2 * suave(u / 1.35);
    camara({ pos: [-0.9 + 5.5 * Math.sin(ph), 21, mz + 5.5 * Math.cos(ph)], alvo: [-0.9, 0, mz + 0.5], fov: 50, roll: 0.12 * suave(u / 1.35), tr: 0.9, t, semente: 11 });
  }, { efeito: () => ({ subs: 2, obturador: 0.6 }) });

  // 2) motorista do carro de cima olha o retrovisor: faróis cegam
  plano('motorista', 1.15, 'B', (u, t) => {
    const s = 3.2 + u; poeCarros(s);
    S.intT.grupo.visible = true; S.hatch.corpo.visible = false; S.intT.luz.intensity = 3.0 * (0.6 + 0.4 * suave(u / 0.5)); S.intT.espelho.material.emissiveIntensity = 1.6;
    const a = S.jC; sentarEm(a, S.hatch, XD, -0.12);
    maosVolante(a, S.hatch);
    a.somar('Peito', 0, 0, 0.01 * Math.sin(t * 9));
    a.olhar(loc(S.hatch, 0.05, 1.5, 0.5), { forca: 1.0 });
    a.rosto({ expressao: 'medo', forca: suave(inv(0.1, 0.55, u)), boca: 0.02 * suave(inv(0.3, 0.8, u)), olhar: [0, 0.25] }); a.atualizarRosto();
    const k = suave(u / 1.15);
    const p = loc(S.hatch, lerp(-0.18, -0.02, k), 1.34, lerp(0.58, 0.42, k)), al = loc(S.hatch, XD, 1.27, -0.12);
    camara({ pos: [p.x, p.y, p.z], alvo: [al.x, al.y, al.z], fov: lerp(34, 27, k), roll: 0.05 - 0.09 * k, tr: 2.2, t, semente: 12 });
  });

  // 3) banco de trás: a câmera vem da frente e vê os rostos de quem está atrás, com os faróis do perseguidor no vidro de trás
  plano('banco de trás', 1.0, 'B', (u, t) => {
    const s = 4.0 + u; poeCarros(s);
    S.sedan.glows.forEach(g => g.scale.setScalar(5.5)); S.sedan.cones.forEach(c => { c.material.opacity = 0.30; });
    S.intT.grupo.visible = true; S.hatch.corpo.visible = false; S.intT.bf.visible = false; S.intT.luz.intensity = 3.2; S.intT.luz.position.set(0.0, 1.45, 0.15); S.intT.espelho.material.emissiveIntensity = 0.3;
    const gv = 0.5 * (1 - suave(inv(0.0, 0.35, u)));
    sentarEm(S.jA, S.hatch, 0.66, -0.98, 0.35 * gv * 2.0 - 0.1); sentarEm(S.jE, S.hatch, 0.0, -0.98, 0.0); sentarEm(S.jB, S.hatch, -0.66, -0.98, -0.30 * gv * 2.0);
    const lista = [[S.jA, 'medo', 0.0], [S.jE, 'medo', 0.0], [S.jB, 'medo', 0.04]];
    lista.forEach(([a, ex, b], i) => {
      a.ikBraco('E', loc(S.hatch, a.grupo.position.x + 0.26, 0.82, -0.70), dirLoc(S.hatch, 0.5, -0.8, 0)); a.ikBraco('D', loc(S.hatch, a.grupo.position.x - 0.26, 0.82, -0.70), dirLoc(S.hatch, -0.5, -0.8, 0));
      a.somar('Peito', 0, 0.025 * Math.sin(t * 13 + i), 0.02 * Math.sin(t * 11 + i));
      a.olhar(loc(S.hatch, 0.0, 1.3, -6), { forca: 0.9 * gv * 2 });
      a.rosto({ expressao: ex, forca: suave(inv(0.0, 0.3, u)), boca: b, olhar: [0, 0] }); a.atualizarRosto();
    });
    const kx = suave(inv(0.05, 0.95, u)), xs = lerp(0.66, -0.66, kx);
    const p = loc(S.hatch, xs * 0.6 + 0.04 * Math.sin(t * 8), 1.33, 0.18 - 0.1 * u), al = loc(S.hatch, xs, 1.36, -1.0);
    camara({ pos: [p.x, p.y, p.z], alvo: [al.x, al.y, al.z], fov: 38, roll: 0.05 * Math.sin(t * 5), tr: 3.0, t, semente: 13 });
  }, { efeito: u => ({ subs: 8, obturador: 0.35 }) });

  // 4) vista de cima, rente: o focinho do perseguidor encosta na traseira (primeiro toque)
  plano('toque', 1.2, 'B', (u, t) => {
    const s = 4.55 + u; poeCarros(s);
    const T = H.T(s), zc = T.z - COMP_T / 2, ph = 0.35 + 0.7 * suave(u / 1.2);
    const depois = suave(inv(0.84, 0.95, u));
    S.hatch.lanternas(0.5 + 0.5 * depois);
    camara({ pos: [-1.0 + 3.0 * Math.sin(ph), 12.5, zc - 0.5 + 3.0 * Math.cos(ph)], alvo: [-1.0, 0, zc - 0.8], fov: 52, roll: 0.02 * Math.sin(t * 6) + 0.05 * depois * Math.sin(t * 40), tr: 1.4 + 6 * depois * Math.exp(-(u - 0.9) * 3), t, semente: 14 });
  }, { efeito: u => ({ subs: 2, obturador: 0.5, flash: 0.22 * Math.max(0, 1 - Math.abs(u - 0.87) / 0.05) }) });

  // 5) câmera no chão: eles passam voando
  plano('passando', 0.9, 'B', (u, t) => {
    const s = 6.85 + u; poeCarros(s);
    const zr = H.T(7.4).z;
    camara({ pos: [-3.6, 0.26, zr], alvo: [-1.8, 1.0, zr - 30], fov: 64, roll: 0.0, tr: 0.7, t, semente: 15 });
  }, { efeito: () => ({ subs: 8, obturador: 0.6 }) });

  // 6) velocímetro: 99 mph
  plano('velocímetro', 0.6, 'B', (u, t) => {
    const s = 9.35 + u * 0.6; poeCarros(s, { visC: false });
    S.intC.grupo.visible = true; S.sedan.corpo.visible = false; S.intC.painel.intensity = 0.5; S.intC.luz.intensity = 0.0;
    const mph = Math.min(99, Math.round(H.C(s).v * 2.237));
    S.intC.set(mph);
    sentarEm(S.homem, S.sedan, XD, -0.10); maosVolante(S.homem, S.sedan);
    const p = loc(S.sedan, XD + 0.02, 1.30 - 0.04 * u, -0.05), al = loc(S.sedan, XD, 1.12, 0.55);
    camara({ pos: [p.x, p.y, p.z], alvo: [al.x, al.y, al.z], fov: 38, roll: 0.0 + 0.05 * Math.sin(t * 20), tr: 3.2, t, semente: 16 });
  });

  // 7) o rosto dele, o painel ciano e o brilho vermelho do carro da frente
  plano('rosto Chandra', 0.85, 'B', (u, t) => {
    const s = 9.5 + u * 0.8; poeCarros(s, { visC: false });
    S.intC.grupo.visible = true; S.sedan.corpo.visible = false; S.intC.painel.intensity = 0.35; S.intC.luz.intensity = 0.0; S.intC.frente.intensity = 2.4; S.intC.set(99);
    const a = S.homem; sentarEm(a, S.sedan, XD, -0.10); maosVolante(a, S.sedan);
    a.olhar(loc(S.sedan, XD, 1.2, 6), { forca: 1 });
    a.rosto({ expressao: 'raiva', forca: 1, boca: 0.0, olhar: [0, 0] }); a.atualizarRosto();
    const hp = a.pos('Cabeca').add(new THREE.Vector3(0, 0.085, 0));
    const k = suave(u / 0.85);
    const dc = dirLoc(S.sedan, 0, 0, 1), dl = dirLoc(S.sedan, 1, 0, 0);
    const p = hp.clone().add(dc.clone().multiplyScalar(lerp(0.70, 0.52, k))).add(dl.clone().multiplyScalar(lerp(-0.34, -0.22, k))).add(new THREE.Vector3(0, 0.04, 0));
    camara({ pos: [p.x, p.y, p.z], alvo: [hp.x, hp.y + 0.01, hp.z], fov: lerp(26, 20, k), roll: -0.05 + 0.1 * k, tr: 3.4, t, semente: 17 });
  });

  // 8) vista de cima, câmera lenta: a batida final (o carro da frente roda para fora da pista)
  const mapa8 = [[0, 9.80], [0.42, 10.28], [0.90, 10.46], [1.50, 10.98]];
  plano('batida', 1.5, 'B', (u, t) => {
    const s = chaves(mapa8, u, suave); poeCarros(s);
    const sH = H.final, cz = H.T(sH).z + 30 * (s - sH) - 0.8, ph = 0.35 + 1.0 * suave(u / 1.5);
    const choque = Math.exp(-Math.max(0, s - sH) * 7) * (s > sH ? 1 : 0);
    camara({ pos: [-2.0 + 4.2 * Math.sin(ph), 14.5, cz + 4.2 * Math.cos(ph)], alvo: [-2.2, 0, cz + 1.0], fov: 52, roll: 0.03 * Math.sin(t * 3) + 0.05 * choque, tr: 1.2 + 6 * choque, t, semente: 18 });
  }, { efeito: u => ({ subs: u > 0.55 && u < 0.95 ? 3 : 1, obturador: 0.55, flash: 0.40 * Math.max(0, 1 - Math.abs(u - 0.714) / 0.045) }) });

  // 9) a árvore: o carro bate e o mundo para
  const mapa9 = [[0, 10.55], [0.45, 10.88], [0.80, 10.99], [1.40, 11.50]];
  plano('árvore', 1.4, 'B', (u, t) => {
    const s = chaves(mapa9, u, suave); poeCarros(s);
    const tr = H.arvore, td = Math.max(0, s - H.tBatida), choque = Math.exp(-td * 6) * (s > H.tBatida ? 1 : 0);
    S.luzCamK = 55;
    camara({ pos: [lerp(-12.6, -11.2, suave(u / 1.4)), 1.05, tr.z - 9.0], alvo: [tr.x + 1.6, 1.0, tr.z - 2.4], fov: 46, roll: -0.04 + 0.08 * choque, tr: 1.4 + 9 * choque, t, semente: 19 });
  }, { efeito: u => ({ subs: u > 0.6 && u < 0.95 ? 3 : 1, obturador: 0.55, flash: 0.9 * Math.max(0, 1 - Math.abs(u - 0.719) / 0.05) }) });

  // 10) silêncio: tela preta (o som some e fica só o zumbido)
  plano('silêncio', 0.55, 'Z', () => { cam.position.set(0, 0, 5); cam.lookAt(0, 0, 0); });
}
