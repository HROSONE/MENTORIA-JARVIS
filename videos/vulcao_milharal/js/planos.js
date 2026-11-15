// Linha do tempo de "O vulcão do milharal" (Parícutin, 1943): constrói o mundo, os atores e comanda cada plano em função do tempo.
// Escala: o vulcão é desenhado a 1:4 (106 m no vídeo = 424 m reais); gente, plantas e casas em tamanho real.
import * as THREE from 'three';
import { scene, cam, mundos, renderer } from './motor.js';
import { clamp, lerp, suave, inv, mulberry32, chaves } from './util.js';
import { S, V, plano, acharPlano, mostrar, luzes, camara, lerpV, sol, ponto, hemi } from './base.js';
import { Ator } from './atores.js';
import { criarCeu } from './ceu.js';
import { UT } from './detalhe.js';
import { criarTerreno, IGREJA, K_BASE, noCaminho, COMP_LAVA } from './terreno.js';
import { criarRestolho, criarPilhas, criarSombrero, criarEnxada, criarPoncho, placaPulido, criarMedidor, criarMontanhas } from './campo.js';
import { criarColuna, criarBombas, criarCinza, criarRelampagos, criarFogueira, criarFissura } from './vulcao.js';
import { construirAldeia } from './aldeia.js';

export const X = {};
if (typeof window !== 'undefined') window.__X = X;
const easeIO = u => suave(clamp(u));
const F0 = { x: 0.35, z: -5.6 }, PILHA = { x: 7.6, z: -8.2 }, H_FIM = 106;

// ---------------------------------------------------------------- câmera por pontos-chave (spline cúbica) e proteção contra entrar no chão
function hermite(K, t) {
  const n = K.length; let i = 0; while (i < n - 2 && t > K[i + 1][0]) i++;
  const t0 = K[i][0], t1 = K[i + 1][0], h = t1 - t0, u = clamp((t - t0) / h);
  const m = j => { const a = K[Math.max(0, j - 1)], b = K[Math.min(n - 1, j + 1)]; return b[1].map((v, d) => (v - a[1][d]) / (b[0] - a[0])); };
  const m0 = m(i), m1 = m(i + 1), p0 = K[i][1], p1 = K[i + 1][1];
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  return p0.map((v, d) => h00 * v + h10 * h * m0[d] + h01 * p1[d] + h11 * h * m1[d]);
}
function camChaves(t, K, extra = {}) {
  const f = hermite(K.map(k => [k[0], [...k[1], ...k[2], k[3]]]), t);
  X.camReq = { f, extra, t };
  camara({ pos: [f[0], f[1], f[2]], alvo: [f[3], f[4], f[5]], fov: f[6], t, ...extra });
}
function camDireta(f, extra = {}) {                                                // câmera calculada à mão (também fica acima do chão depois do mundo atualizado)
  X.camReq = { f, extra, t: extra.t ?? 0 };
  camara({ pos: [f[0], f[1], f[2]], alvo: [f[3], f[4], f[5]], fov: f[6], ...extra });
}
function aplicarCamera() {                                                        // depois de aplicarMundo: o piso do terreno já é o do quadro
  const r = X.camReq; X.camReq = null; if (!r) return;
  const f = r.f.slice(), piso = X.alturaEm(f[0], f[2]) + 0.45; if (f[1] < piso) f[1] = piso;
  camara({ pos: [f[0], f[1], f[2]], alvo: [f[3], f[4], f[5]], fov: f[6], t: r.t, ...r.extra });
  if (typeof window !== 'undefined' && window.__camDbg) camara({ ...window.__camDbg, t: r.t });
}

// ---------------------------------------------------------------- céu e luz por hora do dia
const PAL = [[5.0, '#141a4a', '#4a3a80', '#ff8a5a'], [7.5, '#3d6ad8', '#9ab8f0', '#ffd8a8'], [12, '#2a62d8', '#6aa0f0', '#cfe6ff'], [16.5, '#3f7ae6', '#9cc2f2', '#ffd9b0'], [18.5, '#2a2f78', '#c8508a', '#ff8a4a'], [20.5, '#080d2c', '#1c2860', '#4a3a6a'], [29.0, '#141a4a', '#4a3a80', '#ff8a5a']];
const _c = [new THREE.Color(), new THREE.Color(), new THREE.Color()];
function ceuHora(h, { nuvens = 0.7, flash = 0, nuvemCor = null } = {}) {
  h = ((h - 5) % 24 + 24) % 24 + 5; let i = 0; while (i < PAL.length - 2 && h > PAL[i + 1][0]) i++;
  const a = PAL[i], b = PAL[i + 1], k = clamp((h - a[0]) / (b[0] - a[0]));
  const cor = j => _c[j - 1].set(a[j]).lerp(new THREE.Color(b[j]), k).getHexString();
  const u = X.ceu.mat.uniforms; u.top.value.set('#' + cor(1)); u.mid.value.set('#' + cor(2)); u.hor.value.set('#' + cor(3));
  const ang = Math.PI * (h - 6) / 12, el = Math.sin(ang); u.sunDir.value.set(Math.cos(ang), Math.max(el, 0.02), 0.3).normalize(); u.luzK.value = clamp(el * 2) * 0.9; u.nuv.value = nuvens; u.flash.value = flash;
  const noite = 1 - clamp(el * 4 + 0.15); u.nuvCor.value.set(nuvemCor || '#8f84b4').lerp(new THREE.Color('#10142a'), noite); return { ang, el, noite };
}
function luzHora(h, { sombra = false, foco = [0, 0, 0], caixa = 30, lava = null, lavaK = 0, lavaDecay = 2, extraPonto = null } = {}) {
  const DBG = (typeof window !== 'undefined' && window.__dbg) || {}; if (DBG.lavaK !== undefined) lavaK = DBG.lavaK;
  const ang = Math.PI * (h - 6) / 12, el = Math.sin(ang), dx = Math.cos(ang), dia = clamp(el * 3);
  let solK, solCor, dir;
  if (el > 0.02) { solK = 2.3 * dia; const q = Math.min(1, el * 2); solCor = new THREE.Color().setRGB(1, 0.58 + 0.38 * q, 0.28 + 0.6 * q).getHex(); dir = [dx, Math.max(el, 0.04), 0.38]; }
  else { solK = 0.5; solCor = 0x8fa8ff; dir = [0.35, 0.7, 0.5]; }
  const ceu = new THREE.Color(0x2a3a7a).lerp(new THREE.Color(0xcfd8ff), dia).getHex(), chao = new THREE.Color(0x15152a).lerp(new THREE.Color(0xb89270), dia).getHex();
  sol.target.position.set(...foco); sol.target.updateMatrixWorld();
  luzes({ solSombra: sombra && el > 0.02, solCaixa: caixa, hemiK: 0.28 + 0.75 * dia, ceu, chao, solK, solCor, solPos: [foco[0] + dir[0] * 100, foco[1] + dir[1] * 100, foco[2] + dir[2] * 100], spotK: 0,
    pontoK: lava ? lavaK : 0, pontoPos: lava || [0, 0, 0], pontoCor: 0xff7a2a });
  ponto.distance = 0; ponto.decay = lavaDecay;
  if (DBG.solK !== undefined) sol.intensity = DBG.solK; if (DBG.hemiK !== undefined) hemi.intensity = DBG.hemiK; if (DBG.exp !== undefined) renderer.toneMappingExposure = DBG.exp;
}

// ---------------------------------------------------------------- estados do mundo
const ESTADO_GANCHO = tl => ({ H: 1.1 + 0.35 * tl, inchaco: 1.2 + 0.3 * tl, cinza: 0.02, lava: 0, ativ: 0.55 + 0.1 * tl, ativB: 0.0, cb: 1, quente: 0.7, fenda: 1 });
const ESTADO_FIM = { H: H_FIM, inchaco: 0, cinza: 1, lava: 1, ativ: 0.05, ativB: 0, cb: 0.25, quente: 0.3, fenda: 0 };
const mezcla = (a, b, k) => { const o = {}; for (const c in a) o[c] = lerp(a[c], b[c] ?? a[c], k); return o; };
function aplicarMundo(est, t) {
  UT.value = t;
  X.terreno.atualizar({ H: est.H, cinza: est.cinza, lavaFrente: est.lava, lavaEsp: est.lavaEsp ?? 1, ativ: est.ativ, crateraBrilho: est.cb ?? 0, inchaco: est.inchaco ?? 0, fenda: est.fenda ?? 0 });
  X.restolho.atualizar(est.H > 0.2 ? K_BASE * est.H * 0.9 : 0, est.cinza);
  const yTopo = X.alturaEm(0, 0), esc = 0.14 + 1.0 * clamp(est.H / 60), larg = 0.45 + 0.55 * clamp(est.H / 14), camEsc = renderer.domElement.height / (2 * Math.tan(cam.fov * Math.PI / 360));
  X.coluna.atualizar(t, { topo: [0, yTopo, 0], ativ: est.ativ, alt: 30 + 190 * clamp(est.H / 70), esc, larg, noite: est.noite ?? 0, quente: est.quente ?? 0.5 });
  X.bombas.atualizar(t, { topo: [0, yTopo, 0], ativ: est.ativB ?? est.ativ, alturaEm: X.alturaEm, esc: 0.3 + 0.9 * clamp(est.H / 40), tamK: 0.22 + 0.78 * clamp(est.H / 14), camEsc });
  X.fissura.atualizar(t, { y: yTopo, k: est.fenda ?? 0, alturaEm: X.alturaEm }); X.mont.escurecer(est.noite ?? 0, est.cinza ?? 0);
  const DBG = (typeof window !== 'undefined' && window.__dbg) || {};
  if (DBG.hide) { const h = DBG.hide; if (h.includes('glow')) X.fissura.gl.visible = false; if (h.includes('chamas')) X.fissura.chamas.forEach(o => o.m.visible = false); if (h.includes('fag')) X.fissura.fag.visible = false; if (h.includes('fenda')) X.terreno.atualizar({ ...X.terreno.estado, fenda: 0 }); }
  X.cinzaFX.atualizar(t, [cam.position.x, cam.position.y, cam.position.z], { dens: clamp(est.cinza * 1.5), vento: [1.6, 0.3] });
  return { yTopo };
}
function medidor(tempo, alt) { const k = tempo + '|' + alt; if (X.medTxt !== k) { X.medTxt = k; X.medidor.redesenhar(tempo, alt); } }

// ---------------------------------------------------------------- atores
function ficar(a, x, z, yaw, clip, t, o = {}) {
  a.colocar(x, X.alturaEm(x, z), z, yaw); a.anim(clip, t * (o.rit ?? 1), {}); a.rosto({ expressao: o.expr ?? 'neutro', forca: o.f ?? 0.8, piscar: o.piscar ?? 0 }); a.grupo.updateMatrixWorld(true);
}
const loc2w = (a, x, y, z) => V(x, y, z).applyMatrix4(a.grupo.matrixWorld);
function segurarEnxada(a, baixa = true) {
  a.ikBraco('D', loc2w(a, -0.2, 0.98, 0.3), V(-0.3, -1, -0.2)); a.ikBraco('E', loc2w(a, 0.16, 0.8, 0.36), V(0.3, -1, 0)); a.grupo.updateMatrixWorld(true);
  const mao = a.pos('MaoD'), q = a.grupo.getWorldQuaternion(new THREE.Quaternion()).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI - 0.55, 0, 0)));
  X.enxada.visible = true; X.enxada.quaternion.copy(q); X.enxada.position.copy(mao).add(V(0, -0.5, 0).applyQuaternion(q));
}
function poseGancho(tl) {
  const a = X.dio; ficar(a, F0.x, F0.z, 0, 'Assustado', 0.25 + tl * 0.25, { expr: 'surpresa', f: 0.95 }); a.olhar(V(0.2, 0.9, 3.4), { forca: 0.9 }); a.grupo.updateMatrixWorld(true);
  X.enxada.visible = true; X.enxada.position.set(F0.x - 1.0, X.alturaEm(F0.x - 1, F0.z + 0.4) + 0.05, F0.z + 0.4); X.enxada.rotation.set(0, 0.6, Math.PI / 2);
  const p = X.paula; ficar(p, PILHA.x - 1.3, PILHA.z + 1.4, -0.74, 'Assustado', 0.4 + tl * 0.2, { expr: 'medo', f: 0.9 });
  X.fogueira.grupo.visible = true; X.fogueira.atualizar(tl, 1);
}
function poseCampo(tl) {
  const a = X.dio, zz = lerp(-13.0, -10.2, tl / 3.4); ficar(a, -3.4, zz, 0.2, 'Andar', tl, { rit: 0.5, expr: 'neutro', f: 0.5 }); segurarEnxada(a);
  const p = X.paula; ficar(p, PILHA.x - 1.1, PILHA.z + 1.1, -0.7, 'Parado', tl, { expr: 'neutro', f: 0.5 }); p.ikBraco('D', V(PILHA.x - 0.55, 0.85 + 0.05 * Math.sin(tl * 3), PILHA.z + 0.4), V(-0.3, -1, 0)); p.grupo.updateMatrixWorld(true);
  X.fogueira.grupo.visible = true; X.fogueira.atualizar(tl, 0.85);
}

// ---------------------------------------------------------------- construção
export async function construirTudo() {
  const g = mundos.V; cam.far = 3200; cam.near = 0.2; cam.updateProjectionMatrix();
  X.terreno = criarTerreno({ tam: 640, seg: 256 }); g.add(X.terreno.malha); X.alturaEm = X.terreno.alturaEm;
  X.ceu = criarCeu({ topo: '#3d6ad8', meio: '#f2a6c8', horiz: '#ffd098', sol: [-0.9, 0.4, 0.3], solCor: '#ffd9a8', nuvens: 0.7, nuvemCor: '#6a5a8a', nuvemLuz: '#ffc48e', luzK: 0.9 }); scene.add(X.ceu.mesh);
  X.mont = criarMontanhas(g);
  X.restolho = criarRestolho(g, { n: 9500, x0: -48, x1: 48, z0: -48, z1: 48, alturaEm: X.alturaEm, clareira: [[PILHA.x, PILHA.z, 2.8], [0, 0, 13]] }); X.restolho.atualizar(0, 0);
  X.pilhas = criarPilhas(g, [[PILHA.x, PILHA.z, 1.0], [-12, -18, 0.8], [16, 6, 0.9], [-20, 12, 0.9], [-6, -30, 0.8]], X.alturaEm);
  X.fogueira = criarFogueira(g, { pos: [PILHA.x, X.alturaEm(PILHA.x, PILHA.z), PILHA.z], escala: 1.15 });
  X.coluna = criarColuna(g); X.bombas = criarBombas(g); X.cinzaFX = criarCinza(g); X.relampagos = criarRelampagos(g); X.fissura = criarFissura(g);
  X.aldeia = await construirAldeia(g, { alturaEm: X.alturaEm });
  X.placaP = placaPulido(); X.placaP.grupo.position.set(-24, X.alturaEm(-24, 20), 20); X.placaP.grupo.rotation.y = 0.5; g.add(X.placaP.grupo);
  X.medidor = criarMedidor(); X.medidor.grupo.position.set(30, X.alturaEm(30, 46), 46); X.medidor.grupo.rotation.y = 0.55; g.add(X.medidor.grupo); X.medTxt = '';
  // gente: Dionisio (homem, roupa de algodão cru e sombrero), Paula (mãe, vestido azul e poncho) e o povo do povoado (tons de terra, trouxas nas costas)
  X.dio = await Ator.criar('homem'); X.dio.pintar({ M_camisa: '#f1ead8', M_camisa_gola: '#e4d8bc', M_camisa_manga: '#f1ead8', M_jeans_plano: '#d9cfb4', M_jeans: '#e2d8be', M_jeans_punho: '#cfc4a6', M_tenis: '#7a5230', M_tenis_det: '#5a3a20' });
  X.dio.obj.traverse(o => { if (!o.isMesh) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.name === 'M_jeans') { m.map = null; m.needsUpdate = true; } }); });
  { const s = criarSombrero(); s.position.set(0, 0.1, 0.0); X.dio.ossos.Cabeca.add(s); } g.add(X.dio.grupo);
  X.paula = await Ator.criar('mae'); X.paula.pintar({ M_vestido: '#2f5fbf' }); { const p = criarPoncho(0xe0405a); p.position.set(0, 0.0, 0); X.paula.ossos.Peito.add(p); } g.add(X.paula.grupo);
  X.enxada = criarEnxada(); g.add(X.enxada);
  X.povo = [];
  for (const nome of ['velha', 'faxineira', 'davi', 'lia', 'teo', 'jovem_b']) {
    const a = await Ator.criar(nome); a.tingir('#c0a88a'); const sc = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), new THREE.MeshStandardMaterial({ color: 0x8a6a44, roughness: 1 })); sc.scale.set(1, 1.15, 0.8); sc.position.set(0, 0.0, -0.2); a.ossos.Peito.add(sc);
    a.grupo.visible = false; g.add(a.grupo); X.povo.push(a);
  }
  montarPlanos();
  return S;
}

// ---------------------------------------------------------------- planos
const props = (med, placa) => { X.medidor.grupo.visible = med; X.placaP.grupo.visible = placa; };
function montarPlanos() {
  // 1. O gancho (0 a 3,4 s): por trás do fazendeiro, de baixo para cima; o morro recém-aberto brilha, solta fagulhas e a fumaça sobe (o quadro 0 já é o fenômeno)
  const K1 = [[0.0, [-0.9, 0.55, -10.2], [0.5, 3.4, -0.5], 48], [3.4, [-0.3, 0.8, -8.4], [0.55, 3.8, -0.5], 46]];
  plano('gancho', 3.4, 'V', (u, t, pl) => {
    const tl = t - pl.t0; X.povo.forEach(a => a.grupo.visible = false); props(false, false);
    camChaves(tl, K1, { tr: 0.9 }); mostrar('V', 0xffc8a0, [0xf6c8a8, 0.0013]);
    const e = ESTADO_GANCHO(tl); const w = aplicarMundo(e, tl); ceuHora(16.8, { nuvens: 0.65 }); X.ceu.seguir(cam);
    luzHora(16.8, { sombra: true, foco: [0, 0, -2], caixa: 26, lava: [0, w.yTopo + 2.2, 0], lavaK: 3.6, lavaDecay: 1 });
    poseGancho(tl);
  });
  // 2. O campo (3,4 a 6,8 s): antes de tudo, o milharal seco ao pôr do sol; Paula na pilha de galhos acesa (em primeiro plano) e Dionísio ao fundo com a enxada
  const K2 = [[0.0, [12.5, 1.25, -5.4], [-3.4, 1.4, -12.0], 38], [3.4, [10.4, 1.45, -6.5], [-3.2, 1.5, -11.0], 34]];
  plano('campo', 3.4, 'V', (u, t, pl) => {
    const tl = t - pl.t0; X.povo.forEach(a => a.grupo.visible = false); props(false, false);
    camChaves(tl, K2, { tr: 0.45 }); mostrar('V', 0xffc8a0, [0xf6c8a8, 0.0012]);
    aplicarMundo({ H: 0, inchaco: 0, cinza: 0, lava: 0, ativ: 0, ativB: 0, cb: 0, quente: 0, fenda: 0 }, tl); ceuHora(16.4, { nuvens: 0.7 }); X.ceu.seguir(cam);
    luzHora(16.4, { sombra: true, foco: [0, 0, -8], caixa: 30 }); poseCampo(tl);
  });
  // 3. O chão incha (6,8 a 10,4 s): rente ao solo, entre os talos secos; o morro sobe e racha no fim
  const K3 = [[0.0, [-1.0, 1.3, 9.0], [-1.5, 1.25, 0.0], 48], [3.6, [-0.6, 1.2, 7.6], [-1.3, 1.3, 0.0], 44]];
  plano('incha', 3.6, 'V', (u, t, pl) => {
    const tl = t - pl.t0; X.povo.forEach(a => a.grupo.visible = false); props(false, false);
    camChaves(tl, K3, { tr: 0.7 }); mostrar('V', 0xffc8a0, [0xf6c8a8, 0.0012]);
    const k = suave(inv(0.0, 3.1, tl)); const e = { H: 0.5 * suave(inv(2.6, 3.6, tl)), inchaco: 2.2 * Math.pow(k, 1.2), cinza: 0.0, lava: 0, ativ: 0.5 * suave(inv(2.5, 3.6, tl)), ativB: 0, cb: suave(inv(2.8, 3.6, tl)), quente: 0.7 * suave(inv(2.8, 3.6, tl)), fenda: suave(inv(2.6, 3.5, tl)) };
    const w = aplicarMundo(e, tl); ceuHora(16.6, { nuvens: 0.7 }); X.ceu.seguir(cam);
    luzHora(16.6, { sombra: true, foco: [0, 0, 0], caixa: 20, lava: [0, w.yTopo + 1.5, 0], lavaK: 1.4 * e.cb, lavaDecay: 1 });
    ficar(X.dio, -2.2 - 0.6 * suave(inv(0.6, 3.4, tl)), 0.5, 1.0, 'Assustado', 0.3 + tl * 0.2, { expr: 'surpresa', f: 0.9 }); X.dio.olhar(V(0, 0.8, 0), { forca: 0.9 }); X.enxada.visible = false;
    X.paula.grupo.visible = false; X.fogueira.grupo.visible = false;
  });
  // 4. O buraco abre (10,4 a 13,6 s): a coluna sobe; ele corre para a câmera
  const K4 = [[0.0, [-6.5, 0.9, 13.0], [-2.0, 3.2, 3.0], 50], [3.2, [-6.0, 1.2, 10.5], [-1.0, 4.8, 2.0], 54]];
  plano('abre', 3.2, 'V', (u, t, pl) => {
    const tl = t - pl.t0; X.povo.forEach(a => a.grupo.visible = false); props(false, false);
    camChaves(tl, K4, { tr: 1.2 }); mostrar('V', 0xffc8a0, [0xf6c8a8, 0.0013]);
    const e = { H: 2.6 + 3.8 * u, inchaco: 1.0 * (1 - u), cinza: 0.03 * u, lava: 0, ativ: 0.8, ativB: 0.25 + 0.25 * u, cb: 1, quente: 0.8, fenda: 1 - 0.8 * u };
    const w = aplicarMundo(e, tl + 4); ceuHora(16.9, { nuvens: 0.7 }); X.ceu.seguir(cam);
    luzHora(16.9, { sombra: true, foco: [0, 0, 2], caixa: 26, lava: [0, w.yTopo + 3, 0], lavaK: 7, lavaDecay: 1 });
    const x = lerp(-1.6, -6.0, u), z = lerp(3.4, 8.2, u); ficar(X.dio, x, z, Math.atan2(-4.4, 4.8), 'Correr', tl, { rit: 0.8, expr: 'grito', f: 0.9 }); X.enxada.visible = false;
    X.paula.grupo.visible = false; X.fogueira.grupo.visible = false;
  });
  // 5. A primeira noite (13,6 a 17,2 s): bombas de lava desenhando arcos no escuro
  const K5 = [[0.0, [52, 5, 62], [0, 14, 0], 40], [3.6, [76, 6, 42], [0, 14, 0], 40]];
  plano('noite1', 3.6, 'V', (u, t, pl) => {
    const tl = t - pl.t0; X.povo.forEach(a => a.grupo.visible = false); X.enxada.visible = false; X.fogueira.grupo.visible = false; props(false, false);
    camChaves(tl, K5, { tr: 0.5 }); mostrar('V', 0x080a1c, [0x120f26, 0.0016]);
    const e = { H: 12 + 0.8 * u, inchaco: 0, cinza: 0.12, lava: 0.06, ativ: 1, ativB: 0.85, cb: 1, quente: 1, noite: 1, fenda: 0 };
    const w = aplicarMundo(e, tl + 11); ceuHora(22.0, { nuvens: 0.5 }); X.ceu.seguir(cam);
    luzHora(22.0, { foco: [0, 0, 0], lava: [0, w.yTopo + 4, 0], lavaK: 3200 * (0.85 + 0.15 * Math.sin(tl * 9)) });
    X.dio.grupo.visible = false; X.paula.grupo.visible = false;
  });
  // 6. O morro cresce (17,2 a 21,2 s): lapso de tempo atrás da placa de medição da HRYZ; o sol passa, a cinza cobre o campo
  const MED = { x: 150, z: 125 }, medN = Math.atan2(MED.x, MED.z);
  const K6 = [[0.0, [MED.x + Math.sin(medN + 0.6) * 10.5, 1.6, MED.z + Math.cos(medN + 0.6) * 10.5], [MED.x, 4.4, MED.z], 44], [4.0, [MED.x + Math.sin(medN - 0.5) * 9.0, 1.9, MED.z + Math.cos(medN - 0.5) * 9.0], [MED.x - 1.0, 4.6, MED.z - 0.8], 44]];
  plano('lapso', 4.0, 'V', (u, t, pl) => {
    const tl = t - pl.t0; X.povo.forEach(a => a.grupo.visible = false); X.dio.grupo.visible = false; X.paula.grupo.visible = false; X.enxada.visible = false; X.fogueira.grupo.visible = false; props(true, false);
    camChaves(tl, K6, { tr: 0.3 }); mostrar('V', 0xa8a0c0, [0x9a96b8, 0.0014]);
    const k = Math.pow(easeIO(u), 0.85), hora = 7 + 34 * easeIO(u);
    const e = { H: lerp(12, 84, k), inchaco: 0, cinza: lerp(0.12, 0.9, k), lava: lerp(0.0, 0.3, k), ativ: 1, ativB: 0.7, cb: 0.7, quente: 0.9, noite: 0, fenda: 0 };
    const c = ceuHora(hora, { nuvens: 0.85 }); e.noite = c.noite; const w = aplicarMundo(e, tl + 15); X.ceu.seguir(cam);
    X.medidor.grupo.scale.setScalar(2.2); X.medidor.grupo.position.set(MED.x, X.alturaEm(MED.x, MED.z), MED.z); X.medidor.grupo.rotation.y = medN;
    luzHora(hora, { foco: [MED.x * 0.5, 20, MED.z * 0.5], lava: [0, w.yTopo + 5, 0], lavaK: 2600 * c.noite + 300 });
    medidor(u < 0.3 ? 'DIA 1' : u < 0.62 ? '1 SEMANA' : '1 ANO', u < 0.3 ? '30–50 m' : u < 0.62 ? '> 100 m' : '> 300 m');
  });
  // 7. A lava vem (21,2 a 25,2 s): voo por cima do rio de lava, seguindo a frente que avança em direção ao povoado
  plano('lava', 4.0, 'V', (u, t, pl) => {
    const tl = t - pl.t0; X.dio.grupo.visible = false; X.paula.grupo.visible = false; X.enxada.visible = false; X.fogueira.grupo.visible = false; props(false, false);
    mostrar('V', 0xd89a80, [0xc88a78, 0.0013]);
    const lavaF = lerp(0.5, 0.86, easeIO(u)), fr = noCaminho(lavaF * COMP_LAVA);
    camDireta([fr[0] - 55, lerp(62, 46, u), fr[1] + 4, fr[0] + 30, 5, fr[1] - 8, lerp(52, 46, u)], { tr: 0.5, t: tl });
    const e = { H: 86 + 6 * u, inchaco: 0, cinza: 0.9, lava: lavaF, ativ: 0.8, ativB: 0.5, cb: 0.7, quente: 1, noite: 0.75, fenda: 0 };
    const w = aplicarMundo(e, tl + 20); ceuHora(17.7, { nuvens: 0.8 }); X.ceu.seguir(cam);
    const sf = e.lava * 235; luzHora(17.7, { foco: [180, 8, -50], lava: [Math.min(206, sf * 0.86), 10, Math.max(-62, -sf * 0.27)], lavaK: 700 });
    X.povo.forEach((a, i) => { a.grupo.visible = true; const x = 214 + i * 2.1 + 1.0 * tl, z = -34 + (i % 2) * 2.2 + 0.8 * tl; ficar(a, x, z, Math.PI / 2 - 0.5, 'Andar', tl + i * 0.2, { rit: 0.85 }); });
  });
  // 8. A torre (25,2 a 29,2 s): só o alto da igreja fica de fora
  plano('torre', 4.0, 'V', (u, t, pl) => {
    const tl = t - pl.t0; X.povo.forEach(a => a.grupo.visible = false); X.dio.grupo.visible = false; X.paula.grupo.visible = false; X.enxada.visible = false; X.fogueira.grupo.visible = false; props(false, false);
    const az = lerp(3.45, 2.55, easeIO(u)), rr = 46 - 10 * u; camChaves(tl, [[0, [IGREJA.x + Math.cos(az) * rr, 9, IGREJA.z + Math.sin(az) * rr], [IGREJA.x, 10, IGREJA.z], 40], [4.0, [IGREJA.x + Math.cos(az) * rr, 11, IGREJA.z + Math.sin(az) * rr], [IGREJA.x, 12, IGREJA.z], 36]], { tr: 0.5 });
    mostrar('V', 0x8a4a4a, [0x7a4a50, 0.0016]);
    const e = { H: 92 + 4 * u, inchaco: 0, cinza: 0.95, lava: lerp(0.9, 1.0, easeIO(u)), ativ: 0.7, ativB: 0.4, cb: 0.7, quente: 1, noite: 0.7, fenda: 0 };
    const w = aplicarMundo(e, tl + 24); ceuHora(18.9, { nuvens: 0.8 }); X.ceu.seguir(cam);
    luzHora(18.9, { foco: [IGREJA.x, 8, IGREJA.z], lava: [IGREJA.x - 13, 13, IGREJA.z + 5], lavaK: 190 });
  });
  // 9. O ápice (29,2 a 33,2 s): noite, cinzas e relâmpagos, vistos de fora do cone
  plano('apice', 4.0, 'V', (u, t, pl) => {
    const tl = t - pl.t0; X.povo.forEach(a => a.grupo.visible = false); X.dio.grupo.visible = false; X.paula.grupo.visible = false; X.enxada.visible = false; X.fogueira.grupo.visible = false; props(false, false);
    camChaves(tl, [[0, [196, 10, 268], [0, 96, 0], 58], [4.0, [150, 16, 292], [0, 118, 0], 58]], { tr: 0.7 });
    mostrar('V', 0x080a1c, [0x120f26, 0.0012]);
    const raios = [0.5, 1.5, 2.2, 2.9, 3.5].map(c => Math.exp(-Math.pow((tl - c) / 0.07, 2)) + 0.6 * Math.exp(-Math.pow((tl - c - 0.13) / 0.09, 2)));
    const e = { H: 100 + 6 * u, inchaco: 0, cinza: 1, lava: 1, ativ: 1, ativB: 1, cb: 1, quente: 1, noite: 1, fenda: 0 };
    const w = aplicarMundo(e, tl + 30); ceuHora(23.0, { nuvens: 0.9, flash: 0.5 * Math.max(...raios) }); X.ceu.seguir(cam);
    X.relampagos.atualizar(raios, [0, w.yTopo + 190, 0]);
    luzHora(23.0, { foco: [0, 60, 0], lava: [0, w.yTopo + 8, 0], lavaK: 5200 + 6000 * Math.max(...raios) });
  });
  // 10. O fim (33,2 a 37,2 s): 1952, o amanhecer sobre o vulcão apagado
  plano('fim', 4.0, 'V', (u, t, pl) => {
    const tl = t - pl.t0; X.povo.forEach(a => a.grupo.visible = false); X.dio.grupo.visible = false; X.paula.grupo.visible = false; X.enxada.visible = false; X.fogueira.grupo.visible = false; props(false, false);
    camChaves(tl, [[0, [252, 38, -192], [0, 54, 0], 50], [4.0, [216, 30, -160], [0, 56, 0], 46]], { tr: 0.35 });
    mostrar('V', 0xe8c0b0, [0xd8b8b4, 0.0013]);
    const e = { ...ESTADO_FIM, ativ: 0.1 * (1 - u), cb: 0.2 * (1 - u), noite: 0.2 }; const w = aplicarMundo(e, tl + 34); ceuHora(5.8 + 0.9 * u, { nuvens: 0.55 }); X.ceu.seguir(cam);
    luzHora(5.8 + 0.9 * u, { foco: [40, 30, -20] });
  });
  // 11. A placa (37,2 a 41,0 s): "este vulcão é do Dionisio Pulido", com o morro enorme ao fundo
  const PL = { x: -176, z: 14 };
  const K11 = [[0, [PL.x - 10.5, 1.4, PL.z + 3.5], [PL.x, 4.0, PL.z], 50], [3.8, [PL.x - 7.5, 1.6, PL.z + 2.0], [PL.x, 3.4, PL.z], 42]];
  {                                                                                   // árvores no caminho do voo da rebobina (da placa ao quadro 0) saem de cena: nada atravessa a câmera
    const A = K11[1][1], B = K1[0][1], dx = B[0] - A[0], dz = B[2] - A[2];
    for (const p of X.aldeia.pinhos) { const t = clamp(((p.position.x - A[0]) * dx + (p.position.z - A[2]) * dz) / (dx * dx + dz * dz)); if (Math.hypot(p.position.x - (A[0] + dx * t), p.position.z - (A[2] + dz * t)) < 14) p.userData.fora = true; }
  }
  plano('placa', 3.8, 'V', (u, t, pl) => {
    const tl = t - pl.t0; X.povo.forEach(a => a.grupo.visible = false); X.dio.grupo.visible = false; X.paula.grupo.visible = false; X.enxada.visible = false; X.fogueira.grupo.visible = false; props(false, true);
    camChaves(tl, K11, { tr: 0.35 });
    mostrar('V', 0xffc8a0, [0xf6c8a8, 0.0011]);
    const e = { ...ESTADO_FIM, ativ: 0.05, cb: 0.1, noite: 0 }; aplicarMundo(e, tl + 38); ceuHora(16.6, { nuvens: 0.65 }); X.ceu.seguir(cam);
    X.placaP.grupo.position.set(PL.x, X.alturaEm(PL.x, PL.z), PL.z); X.placaP.grupo.rotation.y = -Math.PI / 2 + 0.12; X.placaP.grupo.scale.setScalar(1.5);
    luzHora(16.6, { sombra: true, foco: [PL.x, 1, PL.z], caixa: 24 });
  });
  // 12. Rebobina (41,0 a 43,6 s): o vulcão volta para dentro da terra e o último quadro é o quadro 0 (loop)
  plano('rebobina', 2.6, 'V', (u, t, pl) => {
    const tl = t - pl.t0, e1 = easeIO(u), q = 1 - e1;
    X.povo.forEach(a => a.grupo.visible = false); props(false, false);
    const camFim = K11[1][1], camIni = K1[0][1], alIni = K1[0][2], alFim = K11[1][2];
    const hCone = 3 + 0.7 * H_FIM * Math.pow(q, 1.7), alvoRb = lerpV(lerpV(alFim, alIni, e1), [0, hCone, 0], Math.sin(Math.PI * e1) * 0.85);   // no meio do voo a câmera olha o cone encolhendo
    camara({ pos: lerpV(camFim, camIni, e1), alvo: alvoRb, fov: lerp(K11[1][3], K1[0][3], e1), tr: 0.9, t: -(1 - e1) * 5 });
    mostrar('V', 0xffc8a0, [0xf6c8a8, 0.0013]);
    const tfx = (1 - u) * 3.4; const alvo0 = ESTADO_GANCHO(0), e = mezcla(alvo0, ESTADO_FIM, Math.pow(q, 1.7)); e.lava = Math.pow(q, 0.8) * 1; e.cinza = Math.pow(q, 0.8); e.noite = 0;
    if (q < 1e-6) Object.assign(e, alvo0);
    const w = aplicarMundo(e, tfx); ceuHora(16.8, { nuvens: 0.65 }); X.ceu.seguir(cam);
    luzHora(16.8, { sombra: e.H < 9, foco: [0, 0, -2], caixa: 26, lava: [0, w.yTopo + 2.2, 0], lavaK: 3.6 * Math.pow(1 - q, 0.5), lavaDecay: 1 + (1 - Math.pow(1 - q, 0.5)) });
    X.dio.grupo.visible = X.paula.grupo.visible = u > 0.86; X.fogueira.grupo.visible = u > 0.86;
    if (u > 0.86) poseGancho(tfx); else { X.enxada.visible = false; }
  });
}

// ---------------------------------------------------------------- atualização e efeitos de quadro
function afastarArvores() {                                                                 // árvores coladas na câmera (voo da rebobina) somem em vez de tapar o quadro
  for (const p of X.aldeia.pinhos) p.visible = !p.userData.fora && Math.hypot(p.position.x - cam.position.x, p.position.z - cam.position.z) > 9;
}
export function atualizar(t) { const pl = acharPlano(t); X.camReq = null; X.relampagos.atualizar([0, 0, 0, 0, 0], [0, 0, 0]); pl.fn((t - pl.t0) / pl.dur, t, pl); aplicarCamera(); afastarArvores(); }
export function efeitos(t) {
  const e = { subs: 1, obturador: 0.5, fade: 0, flash: 0, flashCor: '255,236,210', tintas: null };
  for (const [tc, a] of [[3.4, 0.55], [13.6, 0.45], [41.0, 0.5]]) { const d = t - tc; if (d >= 0 && d < 0.3) e.flash = Math.max(e.flash, a * Math.exp(-d / 0.07)); }
  if (t > 11.9 && t < 13.6) { e.subs = 2; e.obturador = 0.5; }
  return e;
}
