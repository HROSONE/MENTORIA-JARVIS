// Ato 3: depois da batida: os destroços, ele que foge sem ajudar, a polícia, a prisão e a sentença.
import * as THREE from 'three';
import { cam, mundos, brilho, canvasTex } from './motor.js';
import { clamp, lerp, suave, suave5, entra, sai, inv, ruido, chaves } from './util.js';
import { POS } from './mundoA.js';
import { S, V, PI, plano, camara, mix3 } from './base.js';
import { Ator } from './atores.js';
import { Carro } from './carros.js';
import { cortarB } from './mundoB.js';
import { poeCarros } from './ato2.js';

const loc = (carro, x, y, z) => carro.corpoGrupo.localToWorld(new THREE.Vector3(x, y, z));
const M = (cor, rug = 0.7, extra = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: rug, ...extra });

// luzes da viatura: vermelho e azul alternando
function giroflex(carro, t, k = 1) {
  const ciclo = Math.floor(t * 9) % 2;
  carro.luzV.intensity = (ciclo ? 0 : 300) * k; carro.luzA.intensity = (ciclo ? 300 : 0) * k;
  carro.brV.material.opacity = ciclo ? 0.05 : 0.95 * k; carro.brA.material.opacity = ciclo ? 0.95 * k : 0.05;
}
function algemas() {
  const g = new THREE.Group(); const metal = M(0xd0d5dc, 0.22, { metalness: 0.95 });
  const aneis = [];
  for (let i = 0; i < 2; i++) { const a = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.0095, 8, 22), metal); a.castShadow = true; g.add(a); aneis.push(a); const tr = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.026, 0.02), metal); a.add(tr); tr.position.set(0, 0.046, 0); }
  const corr = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 6), metal); g.add(corr);
  g.userData = { aneis, corr };
  return g;
}
function posAlgemas(g, p1, p2, k = 1) {
  const [a, b] = g.userData.aneis;
  a.position.copy(p1); b.position.copy(p2);
  const d = p2.clone().sub(p1), len = d.length();
  for (const an of [a, b]) an.lookAt(an.position.clone().add(d.clone().normalize()));
  const c = g.userData.corr; c.position.copy(p1).add(p2).multiplyScalar(0.5); c.scale.set(1, Math.max(len - 0.09, 0.01), 1); c.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
  g.scale.setScalar(k);
}

export async function prepararAto3() {
  S.viatura = await Carro.criar('police', { pintura: null });
  S.viatura.luzV = new THREE.PointLight(0xff2a18, 0, 24, 1.6); S.viatura.luzA = new THREE.PointLight(0x2a50ff, 0, 24, 1.6);
  S.viatura.luzV.position.set(-0.5, 2.3, 0.2); S.viatura.luzA.position.set(0.5, 2.3, 0.2);
  S.viatura.corpoGrupo.add(S.viatura.luzV, S.viatura.luzA);
  S.viatura.brV = brilho('255,50,40', 2.6, 0); S.viatura.brA = brilho('60,110,255', 2.6, 0);
  S.viatura.brV.position.set(-0.5, 2.1, 0.2); S.viatura.brA.position.set(0.5, 2.1, 0.2); S.viatura.corpoGrupo.add(S.viatura.brV, S.viatura.brA);
  S.carros.push(S.viatura);
  S.pol1 = await Ator.criar('policial'); S.pol2 = await Ator.criar('policial', { escala: 1.03 }); S.pol2.pintar({ M_camisa: '#243656', M_pele: '#b98a64' });
  S.atores.push(S.pol1, S.pol2);
  S.algemas = algemas(); S.algemas.visible = false; mundos.A.add(S.algemas);
  // martelo e papel (mundo N)
  const N = mundos.N;
  const mesa = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 2), M(0x4a2c18, 0.55)); mesa.position.set(0, -0.05, 0); N.add(mesa);
  const bloco = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.05, 24), M(0x3a2112, 0.5)); bloco.position.set(0.0, 0.025, 0.22); N.add(bloco);
  const mart = new THREE.Group(); N.add(mart);
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.017, 0.28, 12), M(0x5b3a1f, 0.5)); cabo.rotation.z = PI / 2; cabo.position.x = -0.14; mart.add(cabo);
  const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.19, 20), M(0x3b2312, 0.45)); cab.rotation.x = PI / 2; cab.position.x = -0.28; mart.add(cab);
  for (const sz of [-1, 1]) { const anel = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.056, 0.014, 20), M(0xb38a3c, 0.3, { metalness: 0.8 })); anel.rotation.x = PI / 2; anel.position.set(-0.28, 0, sz * 0.082); mart.add(anel); }
  mart.traverse(o => { if (o.isMesh) o.castShadow = true; });
  mart.position.set(0.0 + 0.28, 0.102, 0.22); S.martelo = mart;
  const tex = canvasTex(512, 640, (g, w, h) => {
    g.fillStyle = '#efe9da'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a2622'; g.textAlign = 'center';
    g.font = 'bold 38px serif'; g.fillText('SENTENÇA', w / 2, 90);
    g.fillRect(70, 112, w - 140, 3);
    g.font = '24px serif'; g.fillText('Tribunal do Condado de Riverside', w / 2, 160); g.fillText('Califórnia · 14 de julho de 2023', w / 2, 196);
    g.font = 'bold 46px serif'; g.fillStyle = '#7a1212'; g.fillText('PRISÃO PERPÉTUA', w / 2, 330);
    g.font = 'bold 34px serif'; g.fillText('SEM DIREITO A', w / 2, 384); g.fillText('LIBERDADE CONDICIONAL', w / 2, 428);
    g.fillStyle = '#2a2622'; g.font = '22px serif'; g.fillText('3 assassinatos em primeiro grau', w / 2, 520); g.fillText('3 tentativas de assassinato', w / 2, 552);
  }, { aniso: 8 });
  const papel = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.78), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })); papel.rotation.x = -PI / 2; papel.position.set(0.0, 0.003, -0.34); papel.rotation.z = 0.0; N.add(papel);
  const lamp = new THREE.SpotLight(0xffd9a0, 120, 12, 0.7, 0.6, 1.4); lamp.position.set(-0.9, 1.6, 0.9); lamp.target.position.set(0, 0, 0); N.add(lamp); N.add(lamp.target);
  N.add(new THREE.HemisphereLight(0x405070, 0x1a1008, 0.5));
  montarAto3();
}

function giraPolicia(t) { /* luzes alternando (chamado em cada plano com viatura) */ giroflex(S.viatura, t, 1); }

function montarAto3() {
  const H = S.H;
  const wz = H.arvore.z;                    // altura (z) do local da batida
  // 1) os destroços: fumaça, folhas, os faróis tortos e, lá no fundo, o carro dele freando
  plano('destroços', 1.7, 'B', (u, t) => {
    const s = 11.7 + 0.8 * u; S.luzCamK = 18;
    poeCarros(s);
    const k = suave(u / 1.7);
    camara({ pos: [lerp(-0.6, -2.2, k), lerp(1.0, 0.95, k), wz - lerp(15.5, 11.0, k)], alvo: [H.arvore.x + 2.6, 1.1, wz - 0.5], fov: 40, roll: 0.02 * Math.sin(t * 1.3), tr: 0.9, t, semente: 21 });
  }, { efeito: u => ({ subs: 1 }) });

  // 2) ele para lá na frente, luzes de freio, fumaça de pneu
  plano('ele para', 1.3, 'B', (u, t) => {
    const s = 13.0 + 1.0 * u; S.luzCamK = 14;
    poeCarros(s);
    const C = H.C(s);
    camara({ pos: [lerp(3.8, 2.6, suave(u / 1.3)), 0.55, C.z - lerp(11.5, 8.5, suave(u / 1.3))], alvo: [C.x - 0.4, 0.95, C.z - 1.0], fov: 42, roll: -0.03, tr: 1.1, t, semente: 22 });
  });

  // 3) meia-volta: os faróis giram na pista (vista de cima)
  plano('meia-volta', 1.4, 'B', (u, t) => {
    const s = 15.5 + 1.3 * u; poeCarros(s);
    const C = H.C(s), ph = 0.5 + 0.8 * suave(u / 1.4);
    camara({ pos: [C.x + 6.0 + 2.0 * Math.sin(ph), 17, C.z + 2.0 * Math.cos(ph)], alvo: [C.x + 3.5, 0, C.z + 1.5], fov: 50, roll: 0.0 + 0.10 * suave(u / 1.4), tr: 0.8, t, semente: 23 });
  }, { efeito: () => ({ subs: 2, obturador: 0.5 }) });

  // 4) ele passa devagar pelos destroços e segue em frente
  plano('ele passa', 1.6, 'B', (u, t) => {
    const s = 12.4 + 0.6 * u; S.luzCamK = 10;
    poeCarros(s);
    const c = S.sedan, z = wz + 7.0 - 7.2 * u;
    c.colocar(1.75, 0, z, PI, { dist: 100 + (wz + 7 - z) }); c.farois(1, 0.45); c.lanternas(0.3);
    c.glows.forEach(g => g.scale.setScalar(0.9)); c.cones.forEach(k => { k.material.opacity = 0.06; });
    c.grupo.updateMatrixWorld(true);
    camara({ pos: [5.2, 0.55, wz + 0.8], alvo: [-4.6, 0.95, wz - 0.4], fov: 48, roll: 0.02, tr: 1.2, t, semente: 24 });
  }, { efeito: () => ({ subs: 2, obturador: 0.6 }) });

  // 5) a viatura chega: luzes vermelhas e azuis sobre as árvores
  plano('polícia chega', 1.3, 'B', (u, t) => {
    const s = 13.2 + 1.0 * u; poeCarros(s); S.luzCamK = 6;
    const v = S.viatura; mundos.B.add(v.grupo); v.grupo.visible = true;
    const z = wz - 70 + 44 * (1 - Math.exp(-u * 1.6)) / (1 - Math.exp(-1.6 * 1.3)) + 22 * u;
    v.colocar(-1.75, 0, z, 0, { dist: z * 1.0, pitch: -0.015 }); v.farois(1); v.lanternas(0.4); giroflex(v, t, 1);
    v.grupo.updateMatrixWorld(true);
    camara({ pos: [3.8, 0.7, wz - 26], alvo: [-1.5, 1.2, z + 3 < wz - 14 ? z + 3 : wz - 14], fov: 56, roll: 0.04, tr: 1.6, t, semente: 25 });
  }, { efeito: () => ({ subs: 2, obturador: 0.6 }) });

  // ---- a prisão (mundo A, noite, giroflex)
  const luzPorta = () => { S.A.portaPivo.rotation.y = 1.55; S.A.vao.visible = true; };
  const cena = (t, k = 1) => {
    S.pol1.grupo.visible = S.pol2.grupo.visible = S.homem.grupo.visible = true;
    mundos.A.add(S.pol1.grupo, S.pol2.grupo, S.homem.grupo, S.viatura.grupo);
    S.viatura.grupo.visible = true; S.viatura.colocar(3.2, 0.15, -2.35, PI / 2); S.viatura.farois(0); S.viatura.lanternas(0.3); giroflex(S.viatura, t, k);
    S.viatura.grupo.updateMatrixWorld(true);
    S.sedan.grupo.visible = true; mundos.A.add(S.sedan.grupo); S.sedan.colocar(POS.garagemX, 0.17, -9.6, 0); S.sedan.farois(0); S.sedan.lanternas(0.2);
    S.sedan.amassar('frente', 0.85); S.sedan.corpo.visible = true; S.hatch.grupo.visible = false;
    S.A.luzVaranda.intensity = 14; luzPorta();
  };
  // garante que o carro dele volta sem amassado e que os faróis do carro dele estão apagados em A
  // 6) viatura e prisão: plano geral
  plano('viatura', 1.15, 'A', (u, t) => {
    cena(t);
    const h = S.homem, p1 = S.pol1, p2 = S.pol2;
    h.colocar(1.2, 0.17, -6.2, PI); h.anim('Parado', u);
    p1.colocar(1.5, 0.17, -7.2, PI + 0.0); p1.anim('Parado', u + 0.3);
    p2.colocar(4.0, 0.17, -4.6, -2.2); p2.anim('Parado', u + 0.6);
    posteDetido(h, p1, t, 0.0);
    h.rosto({ expressao: 'raiva', forca: 0.6, boca: 0.0 }); h.atualizarRosto();
    camara({ pos: mix3([-5.0, 1.0, 3.2], [-1.6, 1.3, 1.2], suave(u / 1.15)), alvo: [1.8, 1.4, -6.2], fov: 46, roll: 0.05, tr: 1.8, t, semente: 26 });
  }, { efeito: () => ({ subs: 2 }) });

  // 7) as algemas fecham (close)
  plano('algemas', 1.3, 'A', (u, t) => {
    cena(t);
    const h = S.homem, p1 = S.pol1;
    h.colocar(1.2, 0.17, -6.2, PI); h.anim('Parado', 0.5); p1.colocar(1.45, 0.17, -7.1, PI); p1.anim('Parado', 0.2);
    const fecha = suave(inv(0.40, 0.52, u));
    const par = posteDetido(h, p1, t, fecha);
    h.rosto({ expressao: 'raiva', forca: 0.5, boca: 0.0 }); h.atualizarRosto();
    const mid = par.p1.clone().add(par.p2).multiplyScalar(0.5);
    camara({ pos: [mid.x + lerp(0.9, 0.55, suave(u / 1.3)), mid.y + 0.25, mid.z - lerp(0.9, 0.55, suave(u / 1.3))], alvo: [mid.x, mid.y, mid.z], fov: 26, roll: 0.08 - 0.12 * suave(u / 1.3), tr: 2.6, t, semente: 27 });
  }, { efeito: u => ({ subs: 2, flash: 0.5 * Math.max(0, 1 - Math.abs(u - 0.45) / 0.05), flashCor: '255,235,220' }) });

  // 8) levado até a viatura
  plano('levado', 1.5, 'A', (u, t) => {
    cena(t);
    const a = [0.2, -6.0], b = [2.6, -3.3], d = Math.hypot(b[0] - a[0], b[1] - a[1]), dir = [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
    const sp = 1.15, s = Math.min(d, sp * (u + 0.2)), g = Math.atan2(dir[0], dir[1]);
    const px = a[0] + dir[0] * s, pz = a[1] + dir[1] * s, lat = [dir[1], -dir[0]];
    const h = S.homem, p1 = S.pol1, p2 = S.pol2;
    h.colocar(px, 0.17, pz, g); h.anim('Andar', (u + 0.2) * 0.55);
    p1.colocar(px + lat[0] * 0.75 * -1, 0.17, pz + lat[1] * 0.75 * -1, g); p1.anim('Andar', (u + 0.2) * 0.62 + 0.2);
    p2.colocar(px + lat[0] * 0.75, 0.17, pz + lat[1] * 0.75, g); p2.anim('Andar', (u + 0.2) * 0.62 + 0.5);
    posteDetido(h, p1, t, 1, true, p2);
    h.somar('Cabeca', 0.30, 0, 0); h.rosto({ expressao: 'triste', forca: 0.4, boca: 0.0, olhar: [0, -0.3] }); h.atualizarRosto();
    const c = V(px, 1.15, pz), fr = V(dir[0], 0, dir[1]);
    const pos = c.clone().add(V(fr.z, 0, -fr.x).multiplyScalar(3.4 - 0.4 * u)).add(fr.clone().multiplyScalar(0.6 + 0.4 * u));
    camara({ pos: [pos.x, 0.72, pos.z], alvo: [c.x, 1.18, c.z], fov: 46, roll: -0.06 + 0.04 * Math.sin(t * 3), tr: 2.2, t, semente: 28 });
  }, { efeito: () => ({ subs: 2 }) });

  // 9) o rosto dele, aceso e apagado pelas luzes da viatura
  plano('rosto preso', 1.15, 'A', (u, t) => {
    cena(t);
    const h = S.homem; h.colocar(2.0, 0.17, -4.6, PI * 0.5 + 0.15); h.anim('Parado', u * 0.4);
    posteDetido(h, S.pol1, t, 1, false);
    h.somar('Cabeca', 0.22, -0.2, 0.06);
    h.rosto({ expressao: 'triste', forca: 0.55, boca: 0.0, olhar: [0.1, -0.25], piscar: Math.max(0, Math.sin(u * 3.2 - 1.2)) > 0.97 ? 1 : 0 }); h.atualizarRosto();
    const hp = h.pos('Cabeca').add(V(0, 0.09, 0));
    const f = V(Math.sin(PI * 0.5 + 0.15), 0, Math.cos(PI * 0.5 + 0.15));
    const k = suave(u / 1.15);
    const pos = hp.clone().add(f.clone().multiplyScalar(lerp(0.95, 0.70, k))).add(V(-f.z, 0, f.x).multiplyScalar(lerp(0.30, 0.18, k))).add(V(0, 0.02, 0));
    camara({ pos: [pos.x, pos.y, pos.z], alvo: [hp.x, hp.y, hp.z], fov: lerp(28, 22, k), roll: 0.05 - 0.06 * k, tr: 1.6, t, semente: 29 });
  }, { efeito: () => ({ subs: 1 }) });

  // 10) a sentença: martelo e papel
  plano('sentença', 1.3, 'N', (u, t) => {
    const m = S.martelo;
    let a;
    if (u < 0.30) a = suave(u / 0.30); else if (u < 0.32) a = 1; else if (u < 0.345) a = 1 - suave((u - 0.32) / 0.025);
    else if (u < 0.40) a = 0.06 * Math.sin((u - 0.345) / 0.055 * Math.PI); else a = 0;
    m.rotation.z = -0.95 * a;
    const k = suave(u / 1.3);
    camara({ pos: [lerp(0.16, 0.04, k), lerp(0.46, 0.36, k), lerp(1.05, 0.85, k)], alvo: [0.02, 0.05, lerp(-0.02, -0.06, k)], fov: 50, roll: 0.05 - 0.07 * k, tr: u > 0.33 && u < 0.5 ? 6 : 1.4, t, semente: 30 });
  }, { efeito: u => ({ subs: 2, flash: 0.35 * Math.max(0, 1 - Math.abs(u - 0.345) / 0.03) }) });
}

// braços do detido para trás (IK) + algemas; `fecha` 0..1; com `levado`, os policiais seguram os braços dele
function posteDetido(h, p1, t, fecha, mostra = true, p2 = null) {
  const lado = (x, y, z) => h.grupo.localToWorld(new THREE.Vector3(x, y, z));
  const wy = 0.98 * h.escala;
  const pE = lado(0.075, wy, -0.20), pD = lado(-0.075, wy, -0.20);
  const polo = h.grupo.localToWorld(new THREE.Vector3(0, -0.2, -1)).sub(h.grupo.position);
  h.ikBraco('E', pE, polo); h.ikBraco('D', pD, polo);
  S.algemas.visible = mostra && fecha > 0.01;
  if (S.algemas.visible) posAlgemas(S.algemas, h.pos('MaoD').add(V(0, 0, 0)).lerp(pD, 0.0), h.pos('MaoE').add(V(0, 0, 0)).lerp(pE, 0.0), 0.6 + 0.4 * fecha);
  // o policial 1 segura os pulsos dele
  if (p1 && p1 !== S.homem) {
    const mE = h.pos('MaoE'), mD = h.pos('MaoD');
    p1.ikBraco('E', mE.clone().add(V(0, 0.02, 0)), V(0.4, -0.6, 0.2)); p1.ikBraco('D', mD.clone().add(V(0, 0.02, 0)), V(-0.4, -0.6, 0.2));
    p1.rosto({ expressao: 'neutro' }); p1.atualizarRosto();
  }
  if (p2) { p2.ikBraco('E', h.pos('BracoE').add(V(0.0, -0.18, 0.02)), V(0.4, -0.6, 0.2)); p2.rosto({ expressao: 'neutro' }); p2.atualizarRosto(); }
  return { p1: h.pos('MaoD'), p2: h.pos('MaoE') };
}
