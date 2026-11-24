// Linha do tempo do Short "Ele podia voar". Cada plano é uma função do tempo local u (s); o mundo inteiro é recalculado a cada quadro.
import * as THREE from 'three';
import { scene, cam, lente, renderer, Q, tela } from './motor.js';
import { clamp, lerp, suave, sai, entra, ruido } from './util.js';
import { construirQuarto, relampago, criarLata, criarGibi } from './quarto.js';
import { criarLucasReal, URL_REAL } from './lucasreal.js';
import { construirDesfiladeiro, estradaX, estradaDir, altura } from './desfiladeiro.js';
import { criarViatura } from '../../biblioteca3d/veiculos/policia/viatura.js';
import { modeloPH } from '../../biblioteca3d/polyhaven/ph.js';
import { criarFumaca } from './poeira.js';
import { criarBolha, criarFogo, criarOnda, criarDestrocos } from './efeitos.js';
import { construirCidade } from './cidade.js';
import { construirEscola } from './escola.js';
import { carregarMocap, aplicarMocap } from './mocap.js';

export const S = { planos: [], total: 0 };
const plano = (id, dur, fn, extra = {}) => { S.planos.push({ id, t0: S.total, dur, fn, ...extra }); S.total += dur; };
export function acharPlano(t) { for (let i = S.planos.length - 1; i >= 0; i--) if (t >= S.planos[i].t0 - 1e-6) return S.planos[i]; return S.planos[0]; }

const _a = new THREE.Vector3();
function camera(pos, alvo, fov, { roll = 0, tremor = 0, t = 0 } = {}) {
  if (Q.has('cam') && !Q.has('lado')) { pos = Q.get('cam').split(',').map(Number); alvo = Q.get('alvo').split(',').map(Number); fov = +(Q.get('fov') || 40); roll = 0; tremor = 0; }
  cam.position.set(...pos); cam.up.set(0, 1, 0); cam.lookAt(_a.set(...alvo));
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  if (roll) cam.rotateZ(roll);
  if (tremor) { cam.position.x += tremor * 0.010 * ruido(t * 6, 1); cam.position.y += tremor * 0.010 * ruido(t * 6.6, 2); cam.rotateX(tremor * 0.004 * ruido(t * 5.3, 3)); cam.rotateY(tremor * 0.004 * ruido(t * 4.7, 4)); cam.rotateZ(tremor * 0.005 * ruido(t * 4.1, 5)); }
  return Math.hypot(pos[0] - alvo[0], pos[1] - alvo[1], pos[2] - alvo[2]);
}

// queda livre com quique: altura y(t) partindo de y0 em repouso no instante 0 (chão em yc; e = restituição)
function queda(t, y0, yc, e = 0.3) {
  const g = 9.8; let h = y0 - yc, tt = t, v = 0, y = y0;
  if (tt <= 0) return { y: y0, parado: false, toque: -1 };
  const t1 = Math.sqrt(2 * h / g); if (tt < t1) return { y: y0 - 0.5 * g * tt * tt, parado: false, toque: -1 };
  tt -= t1; v = e * g * t1; let n = 0;
  while (v > 0.25 && n < 4) { const tb = 2 * v / g; if (tt < tb) return { y: yc + v * tt - 0.5 * g * tt * tt, parado: false, toque: n }; tt -= tb; v *= e; n++; }
  return { y: yc, parado: true, toque: n };
}

export async function construirTudo() {
  const quarto = await construirQuarto(scene, renderer); scene.environment = quarto.ambiente;
  const real = await criarLucasReal(); scene.add(real.grupo); real.grupo.visible = false;
  const desf = await construirDesfiladeiro(scene, renderer);
  const cidade = await construirCidade(scene, { origem: [3000, 0, 0] });
  const escola = await construirEscola(scene, { origem: [6000, 0, 0] });
  const mundos = { quarto: [quarto.g, real.grupo], desf: [desf.g], cidade: [cidade.g], escola: [escola.g] };
  const fundoNoite = new THREE.Color(0x0a1230), nevoaNoite = new THREE.FogExp2(0x101a33, 0.0065), fundoDia = new THREE.Color(0xa9c8ea), nevoaDia = new THREE.FogExp2(0xc4d8ec, 0.0035);
  const fundoQuarto = new THREE.Color(0x0b0e12);
  let noite_ = true;
  function mundo(nome, noite = true) { noite_ = noite;
    for (const k in mundos) for (const g of mundos[k]) g.visible = k === nome;
    if (nome === 'quarto') { scene.environment = quarto.ambiente; scene.fog = null; scene.background = fundoQuarto; }
    if (nome === 'desf') { scene.environment = desf.ambiente; scene.fog = desf.nevoa; scene.background = null; }
    if (nome === 'escola') { scene.environment = null; scene.fog = null; scene.background = fundoDia; }
    if (nome === 'cidade') { scene.environment = null; scene.fog = noite_ ? nevoaNoite : nevoaDia; scene.background = noite_ ? fundoNoite : fundoDia; cidade.noite(noite_); }
  }
  const clips = {}; for (const c of ['140_01', '140_02', '90_16', '13_05']) clips[c] = await carregarMocap('../biblioteca3d/mocap/cmu/' + c + '.json');
  const lata = criarLata(), gibi = criarGibi(); quarto.g.add(lata, gibi);
  scene.background = new THREE.Color(0x0b0e12);
  const LX = -0.15, LZ = 0.05;                                                                 // onde o Lucas cai (cabeça para +z, pés para a janela)

  // ================================================================================================ 1) GANCHO: o preço antes da causa (0-4 s)
  plano('P1 gancho: caído no chão', 4.0, (u, t) => {
    renderer.toneMappingExposure = 1.0;
    quarto.atualizar(t, { relampago: relampago(t, [1.55]), luzAcesa: 0 });
    // ele tenta duas vezes e os braços falham
    mundo('quarto'); lata.visible = gibi.visible = true; for (const A of [l10, mendes, rocha]) A.grupo.visible = false;
    {
      // captura real (CMU 140_01, levantar de bruços): tenta erguer o tronco, os braços tremem e cedem, tenta de novo mais fraco
      real.grupo.visible = true;
      const tc = u < 1.2 ? lerp(0.70, 1.45, sai(u / 1.2)) : u < 1.75 ? lerp(1.45, 0.30, entra((u - 1.2) / 0.55)) : lerp(0.30, 1.05, suave((u - 1.95) / 2.0));
      aplicarMocap(real, clips['140_01'], tc, { origem: [LX, 0, LZ], yaw: -Math.PI / 2, ossos: ['spine_01', 'spine_02', 'spine_03', 'neck_01', 'head', 'clavicle_l', 'upperarm_l', 'lowerarm_l', 'hand_l', 'clavicle_r', 'upperarm_r', 'lowerarm_r', 'hand_r'] });
      for (const l of ['l', 'r']) real.girar('foot_' + l, [1, 0, 0], 0.5);
      const forca = clamp((tc - 0.4) / 1.0), tr = (0.5 + forca) * (u < 1.2 ? 1 : u < 1.75 ? 0.3 : 1.4);
      for (const l of ['l', 'r']) { real.dobrar('upperarm_' + l, 3.5 * tr * ruido(t * 17, l === 'l' ? 1 : 2), 0, 2.5 * tr * ruido(t * 13, 3)); real.dobrar('lowerarm_' + l, 4 * tr * ruido(t * 21, l === 'l' ? 4 : 5), 0, 0); }
      real.olharPara(new THREE.Vector3(LX + 0.5, 0.9, LZ + 2.6), 0.55 + 0.4 * forca);             // ergue o rosto na direção da câmera (pernas ficam esticadas: atrofiadas)
      real.dobrar('head', 4 * tr * ruido(t * 9, 6), 3 * ruido(t * 3, 7), 0);
      const caiu = u > 1.2 && u < 2.3 ? suave((u - 1.2) / 0.3) * (1 - suave((u - 1.9) / 0.4)) : 0;
      real.rosto({ esforco: clamp(0.35 + 0.65 * forca) * (1 - caiu), triste: 0.5 + 0.5 * caiu, piscar: 0.6 * caiu, boca: 0.25 * caiu });
    }
    // a lata e o gibi estavam flutuando: caem no quadro 0 (ainda no ar) e batem no chão
    const ql = queda(u, 0.62, 0.033, 0.28), qg = queda(u - 0.05, 0.85, 0.004, 0.0);
    lata.position.set(LX + 0.62 + 0.20 * clamp(u - 0.36) * (1 - Math.exp(-(u - 0.36) * 2)), ql.y, LZ + 1.55); lata.rotation.set(ql.parado ? Math.PI / 2 : 0.4 + u * 3.5, 0.6, ql.parado ? 0 : u * 2.0);
    if (ql.parado) lata.position.y = 0.033;
    gibi.position.set(LX - 0.48, qg.y + 0.003, LZ + 1.05); gibi.rotation.set(qg.parado ? 0 : 0.5 - u * 1.4, 0.4, qg.parado ? 0.02 : 0.3 + u * 1.1);
    const e = suave(u / 4);
    const d = camera([lerp(0.70, 0.50, e), lerp(1.25, 1.00, e), lerp(2.55, 2.20, e)], [LX + 0.0, 0.30, LZ + 0.70], lerp(42, 36, e), { roll: lerp(0.06, 0.0, e), tremor: 1, t });
    lente({ foco: d - 0.35, abertura: 0.010, desfoque: 0.012, brilho: 0.45, limiar: 0.8 });
  });
  // ================================================================================================ 2) O CARRO (4-19 s): estrada na beira do desfiladeiro, humilhação, tristeza, raiva
  const carro = criarViatura({ livery: 'branco-azul', numero: '117', sujeira: 0.95 }); carro.grupo.rotation.order = 'YXZ'; desf.g.add(carro.grupo); carro.farois(false);
  const l10 = await criarLucasReal({ url: URL_REAL('lucas10') }), mendes = await criarLucasReal({ url: URL_REAL('mendes') }), rocha = await criarLucasReal({ url: URL_REAL('rocha') });
  carro.grupo.add(l10.grupo, mendes.grupo, rocha.grupo);
  if (Q.has('semteto')) for (let i = 0; i < 3; i++) carro.grupo.children[i].visible = false;
  const caixa = await modeloPH('metal_toolbox'); caixa.position.set(0.40, 0.52, -0.95); caixa.rotation.y = 1.4; carro.grupo.add(caixa);
  const garrafas = [];                                                                          // duas garrafas d'água no console
  for (const dx of [-0.05, 0.05]) {
    const g = new THREE.Group(), pet = new THREE.MeshPhysicalMaterial({ color: 0xcfe8ff, roughness: 0.05, transmission: 0.0, transparent: true, opacity: 0.45 });
    const corpoG = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.17, 20), pet); corpoG.position.y = 0.085; g.add(corpoG);
    const agua = new THREE.Mesh(new THREE.CylinderGeometry(0.029, 0.029, 0.12, 20), new THREE.MeshStandardMaterial({ color: 0x9fd0f0, roughness: 0.1, transparent: true, opacity: 0.5 })); agua.position.y = 0.062; g.add(agua);
    const tampa = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.02, 12), new THREE.MeshStandardMaterial({ color: 0x1f6fd0, roughness: 0.5 })); tampa.position.y = 0.205; g.add(tampa);
    const gargalo = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.032, 0.04, 16), pet); gargalo.position.y = 0.19; g.add(gargalo);
    g.position.set(dx, 0.645, -0.05); carro.grupo.add(g); garrafas.push(g);
  }
  const luzRaiva = new THREE.PointLight(0x4aa8ff, 0, 3.5, 2); luzRaiva.position.set(-0.25, 1.05, -0.75); carro.grupo.add(luzRaiva);
  const poeira = criarFumaca(scene, tela.alt);
  const Z0 = -120, VEL = 11.5, T0C = 4.0;                                                         // a viatura anda a ~41 km/h na faixa do lado do abismo
  const estado = T => { const z = Z0 + VEL * T, x = estradaX(z) - 1.4, yaw = estradaDir(z);
    return { x, z, yaw, dist: VEL * T, pitch: 0.006 * Math.sin(T * 9.1) + 0.004 * ruido(T * 3, 1), roll: 0.008 * ruido(T * 2.3, 2) + 0.004 * Math.sin(T * 11) }; };
  const L_ = (c, lx, ly, lz) => { const v = new THREE.Vector3(lx, ly, lz); return carro.grupo.localToWorld(v).toArray(); };   // ponto no carro -> mundo
  function posCarro(t, treme = 0) {
    const T = t - T0C, c = estado(T); carro.grupo.position.set(c.x, altura(c.x, c.z) + 0.01 + treme * 0.02 * ruido(t * 30, 9), c.z);
    carro.grupo.rotation.set(c.pitch + treme * 0.015 * ruido(t * 27, 3), c.yaw, c.roll + treme * 0.02 * ruido(t * 31, 4), 'YXZ'); carro.rodar(c.dist); carro.grupo.updateMatrixWorld(true);
    desf.iluminar(carro.grupo.position); return c;
  }
  const emPoeira = { inicio: -3, fim: 30, taxa: 34, vida: 2.6, tam0: 0.8, tam1: 4.2, alfa: 0.42, semente: 5, cor: [0.66, 0.42, 0.30] };
  const poeiraEm = (t, lado) => ({ ...emPoeira, semente: emPoeira.semente + (lado > 0 ? 0 : 9), pos: ti => { const c = estado(ti); const x = c.x + lado * 0.8 * Math.cos(c.yaw) - 1.2 * Math.sin(c.yaw), z = c.z - lado * 0.8 * Math.sin(c.yaw) - 1.2 * Math.cos(c.yaw); return [x, 0.1, z]; }, vel: () => [0, 0.5, -1.5] });
  function atores(t, { raiva = 0, aponta = 1, tristeza = 0 } = {}) {
    const T = t - T0C;
    // Rocha dirige (mãos no volante)
    rocha.sentar([0.37, 0.57, -0.17]); rocha.dobrar('neck_01', 4 * ruido(T * 0.7, 3), 6 * ruido(T * 0.5, 4), 0);
    rocha.ik('upperarm_l', 'lowerarm_l', 'hand_l', new THREE.Vector3(...L_(0, 0.53, 0.86, 0.27)), new THREE.Vector3(0, -1, 0)).ik('upperarm_r', 'lowerarm_r', 'hand_r', new THREE.Vector3(...L_(0, 0.23, 0.86, 0.27)), new THREE.Vector3(0, -1, 0));
    rocha.dedos('l', 0.8).dedos('r', 0.8); rocha.rosto({ triste: 0.0, esforco: 0.1 });
    // Mendes vira para trás, aponta o dedo para o Lucas e ri
    mendes.sentar([-0.37 + 0.10 * aponta, 0.57, -0.17]);
    const vira = aponta;
    mendes.dobrar('spine_01', 0, 24 * vira, -4 * vira).dobrar('spine_02', 0, 28 * vira, -4 * vira).dobrar('spine_03', 0, 30 * vira, 0).dobrar('neck_01', 0, 30 * vira, 0);
    mendes.olharPara(new THREE.Vector3(...L_(0, -0.2, 1.0, -1.0)), 0.9 * vira);
    const ri = 0.5 + 0.5 * Math.max(0, Math.sin(T * 9));
    mendes.ik('upperarm_l', 'lowerarm_l', 'hand_l', new THREE.Vector3(...L_(0, 0.11 + 0.03 * Math.sin(T * 6), 1.13 + 0.03 * Math.sin(T * 9), -0.47)), new THREE.Vector3(...L_(0, 0.5, -0.5, 0)).sub(carro.grupo.position)).dedos('l', 1, { indicador: 0, polegar: 0.6 });
    if (Q.has('dbg')) { const alvoM = new THREE.Vector3(...L_(0, -0.05, 1.02, -0.48)); window.__dbg = { mao: mendes.pos('hand_l').toArray().map(v => +v.toFixed(3)), alvo: alvoM.toArray().map(v => +v.toFixed(3)), ombro: mendes.pos('upperarm_l').toArray().map(v => +v.toFixed(3)), cab: mendes.pos('head').toArray().map(v => +v.toFixed(3)), carro: carro.grupo.position.toArray().map(v => +v.toFixed(2)) }; }
    mendes.rosto({ boca: 0.35 * ri * vira, esforco: 0.2 }).expressao({ 'mouth-corner-puller': 0.8 * vira, 'eyebrows-left-down': 0.6, 'eyebrows-right-down': 0.6, 'eye-left-slit': 0.4 * vira, 'eye-right-slit': 0.4 * vira });
    // Lucas no banco de trás: triste, depois os punhos fecham e a raiva sobe
    l10.sentar([-0.22, 0.55, -1.0], { recosto: -2 });
    l10.dobrar('spine_02', 10 * tristeza * (1 - raiva), 0, 0).dobrar('neck_01', 18 * tristeza * (1 - raiva) - 6 * raiva, 0, 0).dobrar('head', 12 * tristeza * (1 - raiva) - 4 * raiva, 0, 0);
    l10.ik('upperarm_l', 'lowerarm_l', 'hand_l', new THREE.Vector3(...L_(0, -0.13, 0.62, -0.62)), new THREE.Vector3(...L_(0, 1, 0, 0)).sub(carro.grupo.position))
       .ik('upperarm_r', 'lowerarm_r', 'hand_r', new THREE.Vector3(...L_(0, -0.31, 0.62, -0.62)), new THREE.Vector3(...L_(0, -1, 0, 0)).sub(carro.grupo.position));
    l10.dedos('l', 0.25 + 0.75 * raiva).dedos('r', 0.25 + 0.75 * raiva);
    l10.rosto({ triste: tristeza * (1 - raiva), piscar: 0.25 * tristeza * (1 - raiva) }).expressao({ 'eyebrows-left-down': raiva, 'eyebrows-right-down': raiva, 'eyebrows-left-inner-up': tristeza * (1 - raiva), 'eyebrows-right-inner-up': tristeza * (1 - raiva), 'mouth-compression': raiva * 0.8, 'nose-left-dilatation': raiva, 'nose-right-dilatation': raiva, 'eye-left-slit': 0.35 * raiva, 'eye-right-slit': 0.35 * raiva });
    l10.olhosBrilho(clamp((raiva - 0.55) / 0.45));
  }
  const prep = (t, opc = {}) => { mundo('desf'); if (typeof noCarroAtores === 'function') { noCarroAtores(); queimar(0); for (const b of [bolhaL, bolhaM, bolhaR]) b.userData.atualizar(t, 0); onda.visible = false; fogo.g.visible = false; fogoChao.g.visible = false; destrocos.atualizar(-1, [0, 0, 0]); for (const A of [mendes, rocha]) A.grupo.visible = true; } luzRaiva.intensity = 0; for (const g of garrafas) { g.position.y = 0.645; g.rotation.set(0, 0, 0); } lata.visible = gibi.visible = false; const c = posCarro(t, opc.treme || 0); atores(t, opc); poeira.atualizar(t - T0C, Q.has('sempoeira') || opc.semPoeira ? [] : [poeiraEm(t, 1), poeiraEm(t, -1)], cam, null); return c; };

  plano('P2 drone: a viatura na beira do abismo', 4.0, (u, t) => {
    renderer.toneMappingExposure = 1.05; prep(t, { aponta: 0 });
    const e = suave(u / 4), c = estado(t - T0C);
    const pos = L_(0, lerp(-17, -10.5, e), lerp(3.5, 2.2, e), lerp(-13, -7.5, e)), alvo = L_(0, -1.0, -0.6, 6);
    const d = camera(pos, alvo, lerp(48, 42, e), { roll: lerp(-0.05, 0.02, e), tremor: 0.6, t });
    lente({ foco: d, abertura: 0.0, brilho: 0.25, limiar: 0.9, ao: 0.6 });
  });
  plano('P3 interior: Mendes vira, aponta e ri', 2.8, (u, t) => {
    renderer.toneMappingExposure = 0.72; prep(t, { aponta: suave(u / 0.5), tristeza: 0.3 });
    const e = suave(u / 2.8);
    const d = Q.has('lado') ? (Q.get('lado') === 'cima' ? camera(L_(0, 0.0, 3.2, -0.45), L_(0, 0.0, 0.6, -0.4), 60) : camera(L_(0, -2.4, 1.2, -0.5), L_(0, -0.1, 0.95, -0.5), 50)) : camera(L_(0, lerp(0.02, -0.04, e), lerp(1.02, 1.0, e), lerp(-1.16, -1.06, e)), L_(0, -0.24, 1.1, -0.3), lerp(50, 44, e), { tremor: 1.2, t });
    lente({ foco: d, abertura: 0.008, desfoque: 0.010, brilho: 0.3, limiar: 0.88, ao: 0.8 });
  });
  plano('P4 Lucas entristece', 2.2, (u, t) => {
    renderer.toneMappingExposure = 0.72; prep(t, { aponta: 1, tristeza: suave(u / 1.2) });
    const e = suave(u / 2.2);
    const d = camera(L_(0, lerp(-0.05, -0.12, e), 0.95, lerp(-0.55, -0.62, e)), L_(0, -0.22, 0.98, -1.0), lerp(40, 34, e), { tremor: 1, t });
    lente({ foco: d, abertura: 0.012, desfoque: 0.012, brilho: 0.3, ao: 0.8 });
  });
  plano('P5a punhos fecham', 1.2, (u, t) => {
    renderer.toneMappingExposure = 0.72; prep(t, { aponta: 1, tristeza: 1, raiva: lerp(0.15, 0.55, u / 1.2) });
    const d = camera(L_(0, -0.02, 0.86, -0.62), L_(0, -0.22, 0.60, -0.72), 40, { tremor: 1.2, t });
    lente({ foco: d, abertura: 0.016, desfoque: 0.014, brilho: 0.3, ao: 0.8 });
  });
  plano('P5b garrafas tremem', 1.3, (u, t) => {
    renderer.toneMappingExposure = 0.72; prep(t, { aponta: 1, tristeza: 1, raiva: lerp(0.55, 0.7, u / 1.3) });
    for (const [i, g] of garrafas.entries()) { g.position.y = 0.645 + 0.006 * Math.abs(Math.sin(t * 40 + i)); g.rotation.set(0.05 * Math.sin(t * 37 + i), 0, 0.05 * Math.sin(t * 43 + i * 2)); }
    const d = camera(L_(0, 0.22, 0.92, -0.42), L_(0, 0.0, 0.72, -0.02), 40, { tremor: 1.6, t });
    lente({ foco: d, abertura: 0.018, desfoque: 0.014, brilho: 0.3, ao: 0.8 });
  });
  plano('P6 os olhos acendem', 2.0, (u, t) => {
    const r = lerp(0.7, 1.0, u / 2.0); renderer.toneMappingExposure = 0.72; prep(t, { aponta: 1, tristeza: 1, raiva: r, treme: 0.4 }); luzRaiva.intensity = 0.06 * clamp((r - 0.7) / 0.3);
    const e = suave(u / 2.0);
    const d = camera(L_(0, lerp(-0.06, -0.14, e), lerp(1.0, 1.04, e), lerp(-0.42, -0.58, e)), L_(0, -0.22, 1.05, -1.02), lerp(36, 28, e), { tremor: 1.5 + 2 * e, t });
    lente({ foco: d, abertura: 0.014, desfoque: 0.012, brilho: 0.35, limiar: 0.92, ao: 0.8 });
  });
  plano('P7 a viatura treme por fora', 1.5, (u, t) => {
    prep(t, { aponta: 1, tristeza: 1, raiva: 1, treme: lerp(0.6, 1.6, u / 1.5) }); luzRaiva.intensity = 0.6 + 0.3 * Math.sin(t * 40);
    const d = camera(L_(0, -6.0, 1.6, 3.0), L_(0, 0, 0.9, -0.4), 40, { tremor: 2.5, t });
    lente({ foco: d, abertura: 0.0, brilho: 0.7, limiar: 0.7, ao: 0.6 });
  });
  // ================================================================================================ 3) A QUEDA (19-29 s): explosão, queda no abismo, bolha e casulos de energia
  renderer.localClippingEnabled = false;
  const TE = 19.0, cE = estado(TE - T0C), yawE = cE.yaw;
  const F = new THREE.Vector3(Math.sin(yawE), 0, Math.cos(yawE)), C = new THREE.Vector3(-Math.cos(yawE), 0, Math.sin(yawE)), UP = new THREE.Vector3(0, 1, 0);
  const OE = new THREE.Vector3(cE.x, 0, cE.z);
  const em = (o, c, f, u) => o.clone().addScaledVector(C, c).addScaledVector(F, f).addScaledVector(UP, u);          // ponto no referencial da explosão
  const VP0 = em(OE, 26, 20, 0); const VP = new THREE.Vector3(VP0.x, altura(VP0.x, VP0.z), VP0.z);                       // onde o Lucas cai no vale
  const R1 = em(VP, -2.6, 3.4, 0), R2 = em(VP, 2.8, 5.0, 0); R1.y = altura(R1.x, R1.z); R2.y = altura(R2.x, R2.z);
  const VC = em(VP, 6, 9, 0); VC.y = altura(VC.x, VC.z);                                                                 // onde a viatura para, queimando
  const pedraA2 = await modeloPH('namaqualand_boulder_02', { leve: true }), arv2 = await modeloPH('island_tree_02', { leve: true });
  for (const [P_, m_, esc] of [[R1, pedraA2, 1.3], [R2, pedraA2, 1.1]]) { const o = m_.clone(); o.position.copy(P_).addScaledVector(UP, -0.25); o.scale.setScalar(esc); desf.g.add(o); }
  for (const [dc, df, esc] of [[-7.5, -2.0, 2.0], [8.5, -6.5, 1.7], [-9.0, 9.5, 1.9]]) { const o = arv2.clone(); const pp = em(VP, dc, df, 0); o.position.set(pp.x, altura(pp.x, pp.z), pp.z); o.scale.setScalar(esc); desf.g.add(o); }
  const onda = criarOnda(); desf.g.add(onda);
  const fogo = criarFogo(desf.g, { n: 46, semente: 4, vida: 1.4, tam: [1.0, 2.6], subida: 2.2, espalha: 1.0 }), fogoChao = criarFogo(desf.g, { n: 30, semente: 8, vida: 1.2, tam: [0.8, 2.0], subida: 2.6, espalha: 0.9 });
  const destrocos = criarDestrocos(desf.g, { n: 70 });
  const bolhaL = criarBolha(0.85), bolhaM = criarBolha(1.05), bolhaR = criarBolha(1.05); desf.g.add(bolhaL, bolhaM, bolhaR);
  const pinturaOrig = new Map(); carro.grupo.traverse(o => { if (o.isMesh && o.material && o.material.color) pinturaOrig.set(o.material, o.material.color.clone()); });
  function queimar(k) { for (const [m, c] of pinturaOrig) m.color.copy(c).multiplyScalar(1 - 0.78 * k); }
  // trajetórias (tempo de ação τ desde a explosão): o carro e os três são arremessados para o lado do abismo
  const TB = 2.4, TQ = 2.7;                                                                                              // Lucas chega às copas em TB; o carro bate no fundo em TQ
  const SL = em(OE, 0.22, -1.0, 1.0), SM = em(OE, 0.37, -0.2, 1.1), SR = em(OE, -0.37, -0.2, 1.1);                      // assentos no instante da explosão
  function arco(S0, alvo, tf, tau, vy = 5) {                                                                             // sai de S0 com vy para cima e chega em alvo em tf (gravidade ajustada)
    const k = clamp(tau / tf), g = 2 * (S0.y + vy * tf - alvo.y) / (tf * tf);
    return new THREE.Vector3(lerp(S0.x, alvo.x, 1 - Math.pow(1 - k, 1.6)), S0.y + vy * Math.min(tau, tf) - 0.5 * g * Math.min(tau, tf) ** 2, lerp(S0.z, alvo.z, 1 - Math.pow(1 - k, 1.6)));
  }
  const posL = tau => arco(SL, em(VP, 0, 0, 6.5), TB, tau, 4);
  const posM = tau => arco(SM, em(R1, 0, 0, 2.2), 3.3, tau, 3.5), posR = tau => arco(SR, em(R2, 0, 0, 2.2), 3.5, tau, 3.0);
  const posC = tau => arco(new THREE.Vector3(cE.x, 0.6, cE.z), em(VC, 0, 0, 0.9), TQ, tau, 6);
  function soltarAtores() { for (const A of [l10, mendes, rocha]) { if (A.grupo.parent !== desf.g) desf.g.add(A.grupo); A.grupo.visible = true; } }
  function noCarroAtores() { for (const A of [l10, mendes, rocha]) { if (A.grupo.parent !== carro.grupo) carro.grupo.add(A.grupo); A.grupo.visible = true; } }   // o gancho esconde os três: aqui voltam
  function rodopiar(A, P, tau, semente, { bracos = 1 } = {}) {                                                         // corpo girando no ar, braços e pernas se debatendo
    A.reset(); A.grupo.position.copy(P).addScaledVector(UP, -0.9); A.grupo.rotation.set(tau * (1.6 + semente * 0.3), yawE + tau * 0.7, tau * (0.9 - semente * 0.2));
    const s = k => Math.sin(tau * (7 + semente) + k);
    A.dobrar('upperarm_l', 30 * s(0), 0, (-60 - 50 * s(1)) * bracos).dobrar('upperarm_r', 30 * s(2), 0, (60 + 50 * s(3)) * bracos).dobrar('thigh_l', -35 * s(4), 0, 0).dobrar('thigh_r', 35 * s(4), 0, 0).dobrar('calf_l', 40 + 30 * s(5), 0, 0).dobrar('calf_r', 40 + 30 * s(6), 0, 0);
    A.rosto({ boca: 0.8, esforco: 0.6 }).expressao({ 'eyebrows-left-inner-up': 1, 'eyebrows-right-inner-up': 1 });
  }
  function deitadoNaBolha(A, P, tau, rot = 0) { A.reset(); A.grupo.position.copy(P).addScaledVector(UP, -0.15); A.grupo.rotation.set(-Math.PI / 2, yawE + rot, 0); A.dobrar('thigh_l', -20, 0, 0).dobrar('calf_l', 30, 0, 0).dobrar('upperarm_l', 0, 0, -40).dobrar('upperarm_r', 0, 0, 40); A.rosto({ piscar: 1 }); }
  const prepQ = (t, tau) => {
    mundo('desf'); lata.visible = gibi.visible = false; luzRaiva.intensity = 0; soltarAtores(); poeira.atualizar(0, [], cam, null);
    const pc = posC(tau); const caido = tau >= TQ;
    carro.grupo.position.copy(caido ? VC.clone().addScaledVector(UP, 0.05) : pc);
    carro.grupo.rotation.set(caido ? Math.PI * 0.92 : tau * 2.3, yawE + (caido ? 0.6 : tau * 0.5), caido ? 0.15 : tau * 1.4, 'YXZ'); carro.grupo.updateMatrixWorld(true);
    queimar(clamp(tau / 0.4)); carro.luzesManual({ v: 0, a: 0, forca: 0 });
    fogo.atualizar(tau, carro.grupo.localToWorld(new THREE.Vector3(0, 0.9, 1.6)).toArray(), clamp(1 - (tau - 2.0) / 1.0) * (tau >= 0 ? 1 : 0));
    fogoChao.atualizar(t, carro.grupo.localToWorld(new THREE.Vector3(0, 0.6, 0.5)).toArray(), caido ? 1 : 0, true);
    onda.userData.atualizar(tau, em(OE, 0, -0.5, 1.0).toArray(), 10, 0.55); destrocos.atualizar(tau, em(OE, 0, 0, 1.0).toArray(), [F.x * 9, 2, F.z * 9]);
    desf.iluminar(tau < 2 ? OE : VP); l10.olhosBrilho(clamp(1 - tau / 2.5));
  };
  plano('Q1 a explosão (câmera lenta)', 1.8, (u, t) => {
    const tau = 0.33 * u; renderer.toneMappingExposure = 1.05; prepQ(t, tau);
    rodopiar(l10, posL(tau), tau, 0); rodopiar(mendes, posM(tau), tau, 1); rodopiar(rocha, posR(tau), tau, 2);
    for (const b of [bolhaL, bolhaM, bolhaR]) b.userData.atualizar(t, 0);
    const d = camera(em(OE, lerp(-11, -12, u / 1.8), lerp(-2.5, -3, u / 1.8), lerp(2.0, 1.6, u / 1.8)).toArray(), em(OE, 3.5, 1.5, 0.8).toArray(), 50, { tremor: 3 * Math.exp(-u * 1.5), t });
    lente({ foco: d, abertura: 0.0, brilho: 0.5, limiar: 0.85, ao: 0.6 });
  }, { efeito: u => ({ flash: 0.85 * Math.max(0, 1 - u / 0.12), flashCor: '200,230,255', subs: 1 }) });
  plano('Q2 a queda: caindo junto com o Lucas', 2.4, (u, t) => {
    const tau = 0.6 + 0.62 * u; prepQ(t, tau);
    const PL = posL(tau); rodopiar(l10, PL, tau, 0, { bracos: 1.2 }); rodopiar(mendes, posM(tau), tau, 1); rodopiar(rocha, posR(tau), tau, 2);
    for (const b of [bolhaL, bolhaM, bolhaR]) b.userData.atualizar(t, 0);
    const d = camera(PL.clone().addScaledVector(F, -2.6).addScaledVector(C, -1.2).addScaledVector(UP, -1.6).toArray(), PL.clone().addScaledVector(UP, 0.4).toArray(), 54, { roll: 0.3 * Math.sin(u * 2), tremor: 2.5, t });
    lente({ foco: d, abertura: 0.006, brilho: 0.6, limiar: 0.8, ao: 0.6 });
  });
  plano('Q3 a bolha se forma nas copas', 2.0, (u, t) => {
    const tau = TB - 0.25 + 0.5 * u; prepQ(t, Math.max(tau, TQ + 0.1));
    const k = clamp((u - 0.25) / 0.5), quica = Math.sin(clamp((u - 0.5) / 1.2) * Math.PI) * 0.6 * (1 - clamp((u - 0.5) / 1.5));
    const PL = u < 0.5 ? posL(tau) : em(VP, 0, 0, 6.5 - 4.0 * suave((u - 0.5) / 1.4) + quica);
    if (u < 0.5) rodopiar(l10, PL, tau, 0); else { l10.reset(); l10.grupo.position.copy(PL).addScaledVector(UP, -0.75); l10.grupo.rotation.set(0.2, yawE + 2.6, 0); l10.dobrar('thigh_l', -70, 0, 0).dobrar('thigh_r', -60, 0, 0).dobrar('calf_l', 90, 0, 0).dobrar('calf_r', 80, 0, 0).dobrar('upperarm_l', -40, 0, -30).dobrar('upperarm_r', -40, 0, 30).dobrar('spine_02', 20, 0, 0); l10.rosto({ boca: 0.5, esforco: 0.3 }).expressao({ 'eyebrows-left-inner-up': 1, 'eyebrows-right-inner-up': 1 }); }
    bolhaL.position.copy(PL); bolhaL.scale.setScalar(0.2 + 0.85 * suave(k)); bolhaL.userData.atualizar(t, k);
    mendes.grupo.visible = rocha.grupo.visible = false; bolhaM.userData.atualizar(t, 0); bolhaR.userData.atualizar(t, 0);
    const d = camera(em(VP, 6.0, 4.5, 4.4).toArray(), em(VP, 0, 0, 5.0).toArray(), 46, { tremor: 1.2, t });
    lente({ foco: d, abertura: 0.006, brilho: 0.7, limiar: 0.75, ao: 0.7 });
  });
  plano('Q4 os casulos seguram os policiais', 2.4, (u, t) => {
    const tau = 2.55 + 0.38 * u; prepQ(t, TQ + 0.5);
    const PL = em(VP, 0, 0, 2.6 + 0.08 * Math.sin(t * 2)); bolhaL.position.copy(PL); bolhaL.scale.setScalar(1.05); bolhaL.userData.atualizar(t, 0.8);
    l10.reset(); l10.grupo.position.copy(PL).addScaledVector(UP, -0.8); l10.grupo.rotation.set(0, yawE + Math.atan2(4, 0.2) - Math.PI * 0.15, 0);
    l10.ik('upperarm_l', 'lowerarm_l', 'hand_l', em(R1, 0, 0, 2.6), UP.clone().negate()).ik('upperarm_r', 'lowerarm_r', 'hand_r', em(R2, 0, 0, 2.6), UP.clone().negate()).dedos('l', 0.1).dedos('r', 0.1);
    l10.olharPara(em(R1, 1, 1, 2.2), 0.8); l10.rosto({ esforco: 0.9 }); l10.olhosBrilho(0.8);
    for (const [A, pos, R_, b, sem] of [[mendes, posM, R1, bolhaM, 1], [rocha, posR, R2, bolhaR, 2]]) {
      const tq = sem === 1 ? 3.3 : 3.5, chegou = tau >= tq - 0.3, k = clamp((tau - (tq - 0.55)) / 0.3);
      const P = chegou ? em(R_, 0, 0, 2.2 + 0.25 * Math.sin(clamp((tau - tq + 0.3) / 0.6) * Math.PI) * (1 - clamp((tau - tq) / 0.8))) : pos(tau);
      A.grupo.visible = true; if (chegou) deitadoNaBolha(A, P, tau, sem); else rodopiar(A, P, tau, sem);
      b.position.copy(P); b.scale.setScalar(0.3 + 0.8 * suave(k)); b.userData.atualizar(t, k);
    }
    const d = camera(em(VP, -5.0, -3.5, 1.3).toArray(), em(VP, 0.5, 3.5, 2.6).toArray(), 50, { tremor: 1.2, t });
    lente({ foco: d, abertura: 0.0, brilho: 0.8, limiar: 0.75, ao: 0.7 });
  });
  plano('Q5 silêncio no vale', 1.4, (u, t) => {
    prepQ(t, TQ + 1);
    const PL = em(VP, 0, 0, 2.0 + 0.06 * Math.sin(t * 2)); bolhaL.position.copy(PL); bolhaL.userData.atualizar(t, 0.5 * (1 - u / 1.4));
    l10.reset(); l10.grupo.position.copy(PL).addScaledVector(UP, -0.8); l10.grupo.rotation.set(0, yawE + 2.5, 0); l10.olharPara(em(VP, 3, 4, 0.5), 0.6); l10.rosto({ triste: 0.6 }); l10.olhosBrilho(0);
    for (const [A, R_, b, sem] of [[mendes, R1, bolhaM, 1], [rocha, R2, bolhaR, 2]]) { const P = em(R_, 0, 0, 1.4); A.grupo.visible = true; deitadoNaBolha(A, P, 5, sem); b.position.copy(P); b.userData.atualizar(t, 0.6 * (1 - u / 1.4)); }
    const e = suave(u / 1.4); const d = camera(em(VP, lerp(-9, -12, e), lerp(-10, -13, e), lerp(4, 6, e)).toArray(), em(VP, 1, 3, 1.2).toArray(), 44, { tremor: 0.5, t });
    lente({ foco: d, abertura: 0.0, brilho: 0.6, ao: 0.7 });
  });
  // ================================================================================================ 4) A DELEGACIA (29-34 s): voo noturno levando os dois e entrega no banco dos fundos
  const O = cidade.origem, ptC = (x, y, z) => new THREE.Vector3(O.x + x, O.y + y, O.z + z);
  const BANCO = ptC(18, 0.15, -12.96 - 7.6);
  const voo = k => ptC(lerp(-70, 14, k), lerp(26, 9, k) + 2 * Math.sin(k * 3), lerp(50, -10, k));                    // trajetória do voo (k 0..1 nos dois planos)
  function voando(A, P, dir, inclina = 0.9, t = 0) {
    A.reset(); A.grupo.position.copy(P); A.grupo.rotation.set(inclina, Math.atan2(dir.x, dir.z), 0.05 * Math.sin(t * 2), 'YXZ');
    A.dobrar('upperarm_l', -150, 0, -10).dobrar('upperarm_r', -40, 0, 30).dobrar('lowerarm_r', -30, 0, 0).dobrar('thigh_l', 6 * Math.sin(t * 3), 0, 0).dobrar('thigh_r', -4 + 6 * Math.sin(t * 3 + 1), 0, 0).dobrar('calf_r', 25, 0, 0);
    A.olharPara(P.clone().add(dir.clone().multiplyScalar(10)), 0.7); A.rosto({ esforco: 0.3 }); A.olhosBrilho(0.25);
  }
  function inconsciente(A, P, yaw, k = 0) { A.reset(); A.grupo.position.copy(P); A.grupo.rotation.set(-Math.PI / 2 + 0.25 * Math.sin(k), yaw, 0.2); A.dobrar('thigh_l', -25, 0, 0).dobrar('calf_l', 40, 0, 0).dobrar('upperarm_l', 0, 0, -50).dobrar('upperarm_r', 0, 0, 45).dobrar('head', 0, 25, 0); A.rosto({ piscar: 1, boca: 0.15 }); }
  const prepD = t => { mundo('cidade', true); lata.visible = gibi.visible = false; for (const A of [l10, mendes, rocha]) { if (A.grupo.parent !== scene) scene.add(A.grupo); A.grupo.visible = true; } for (const b of [bolhaL, bolhaM, bolhaR]) { if (b.parent !== scene) scene.add(b); } };
  plano('D1 o voo sobre a cidade', 2.5, (u, t) => {
    prepD(t); const k = 0.55 * u / 2.5, P = voo(k), dir = voo(k + 0.01).sub(P).normalize();
    voando(l10, P, dir, 1.0, t);
    for (const [A, b, lado, sem] of [[mendes, bolhaM, 1, 1], [rocha, bolhaR, -1, 2]]) { const Q_ = voo(k - 0.012).addScaledVector(new THREE.Vector3(-dir.z, 0, dir.x), 1.6 * lado).add(new THREE.Vector3(0, -1.2, 0)); inconsciente(A, Q_, Math.atan2(dir.x, dir.z), t + sem); b.position.copy(Q_); b.scale.setScalar(1.0); b.userData.atualizar(t, 0.35); }
    bolhaL.userData.atualizar(t, 0);
    const d = camera(P.clone().addScaledVector(dir, -6.5).add(new THREE.Vector3(0, 3.2, 0)).toArray(), P.clone().addScaledVector(dir, 6).add(new THREE.Vector3(0, -2.5, 0)).toArray(), 52, { roll: 0.06 * Math.sin(u), tremor: 0.8, t });
    lente({ foco: d, abertura: 0.0, brilho: 0.8, limiar: 0.7, ao: 0.5 });
  });
  plano('D2 nos fundos da delegacia', 2.5, (u, t) => {
    prepD(t);
    const desce = suave(clamp(u / 1.3)), sobe = entra(clamp((u - 1.7) / 0.8));
    const PL = ptC(18 + 1.2, lerp(6, 1.6, desce) + 14 * sobe, -12.96 - 9.6);
    voando(l10, PL, new THREE.Vector3(0, 0, 1), lerp(0.15, 0.05, desce) - 0.3 * sobe, t); l10.dobrar('upperarm_l', 110, 0, 0).dobrar('upperarm_r', -60, 0, -20);
    for (const [A, b, dx] of [[mendes, bolhaM, -0.55], [rocha, bolhaR, 0.55]]) {
      const P = BANCO.clone().add(new THREE.Vector3(dx, lerp(3.0, 0.48, desce), -0.05));
      if (desce < 0.99) inconsciente(A, P.clone().add(new THREE.Vector3(0, 0.2, 0)), Math.PI, t); else { A.sentar([P.x, P.y, P.z], { yaw: Math.PI, recosto: 12 }); A.dobrar('neck_01', 30, 0, dx * 30).dobrar('head', 15, 0, 0).dobrar('upperarm_l', 0, 0, -10).dobrar('upperarm_r', 0, 0, 10); A.rosto({ piscar: 1 }); }
      b.position.copy(P).add(new THREE.Vector3(0, 0.4, 0)); b.userData.atualizar(t, 0.3 * (1 - clamp((u - 1.2) / 0.4)));
    }
    bolhaL.userData.atualizar(t, 0);
    const d = camera(ptC(18 - 5.5, 1.5, -12.96 - 11.5).toArray(), ptC(18, 1.2 + 2.5 * sobe, -12.96 - 8.2).toArray(), 46, { tremor: 0.8, t });
    lente({ foco: d, abertura: 0.004, brilho: 0.8, limiar: 0.7, ao: 0.7 });
  });
  // ================================================================================================ 5) OS PODERES (34-44 s): levanta um carro, vai para a escola levitando com a mochila, escreve HRYZ pela mão da professora
  const sedan = criarViatura({ livery: 'liso', civil: true, placa: 'HRYZ 204', sujeira: 0.4 }); sedan.grupo.rotation.order = 'YXZ'; scene.add(sedan.grupo); mundos.cidade.push(sedan.grupo); sedan.farois(false);
  const placaEscola = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.8), new THREE.MeshStandardMaterial({ map: canvasTexto('ESCOLA MUNICIPAL HRYZ', '#f4f1e6', '#1f3c6e'), roughness: 0.6 })); placaEscola.position.set(-24, 4.3, 7.1); placaEscola.rotation.y = Math.PI; cidade.g.add(placaEscola);
  const mochila = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({ color: 0x2f5fa8, roughness: 0.8 }), z = new THREE.MeshStandardMaterial({ color: 0x1b2f4f, roughness: 0.6 });
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.40, 0.15), m); c.geometry.translate(0, 0.2, 0); mochila.add(c); const bolso = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.05), m); bolso.position.set(0, 0.12, 0.095); mochila.add(bolso);
    for (const x of [-0.08, 0.08]) { const a = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.015, 6, 16, Math.PI), z); a.position.set(x, 0.28, -0.08); a.rotation.set(0, Math.PI / 2, Math.PI / 2); mochila.add(a); }
    mochila.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(mochila); mundos.cidade.push(mochila); }
  const prof = await criarLucasReal({ url: URL_REAL('professora') }); scene.add(prof.grupo); mundos.escola.push(prof.grupo);
  const giz = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 8), new THREE.MeshStandardMaterial({ color: 0xf6f6f2, roughness: 0.9 })); scene.add(giz); mundos.escola.push(giz);
  function levitando(A, P, yaw, t, { bracoD = null, olhar = null } = {}) {
    A.reset(); A.grupo.position.set(P.x, P.y + 0.04 * Math.sin(t * 2.2), P.z); A.grupo.rotation.set(0, yaw, 0);
    A.dobrar('thigh_l', -6, 0, 0).dobrar('thigh_r', 4, 0, 0).dobrar('calf_l', 14, 0, 0).dobrar('calf_r', 10, 0, 0).dobrar('foot_l', 30, 0, 0).dobrar('foot_r', 30, 0, 0);
    A.dobrar('upperarm_l', 0, 0, -48).dobrar('upperarm_r', 0, 0, 48).dobrar('lowerarm_l', -10, 0, 0).dobrar('lowerarm_r', -10, 0, 0);
    if (bracoD) A.ik('upperarm_r', 'lowerarm_r', 'hand_r', bracoD, new THREE.Vector3(0, -1, 0)).dedos('r', 0.1);
    if (olhar) A.olharPara(olhar, 0.7);
  }
  const C_ = (x, y, z) => new THREE.Vector3(cidade.origem.x + x, y, cidade.origem.z + z);
  const prepM = () => { mundo('cidade', false); real.grupo.visible = true; if (real.grupo.parent !== scene) scene.add(real.grupo); lata.visible = gibi.visible = false; for (const A of [l10, mendes, rocha]) A.grupo.visible = false; for (const b of [bolhaL, bolhaM, bolhaR]) b.userData.atualizar(0, 0); };
  plano('M1 levanta um carro com a mão', 2.5, (u, t) => {
    prepM(); const sobe = suave(clamp((u - 0.3) / 1.6));
    sedan.grupo.position.copy(C_(-20, 0.02 + 2.6 * sobe, -1.75)); sedan.grupo.rotation.set(0.05 * Math.sin(t * 1.7) * sobe, Math.PI / 2 + 0.25 * sobe, 0.08 * Math.sin(t * 1.3) * sobe, 'YXZ'); sedan.rodar(t * 3 * sobe);
    levitando(real, C_(-20.3, 0.35, 5.6), Math.PI, t, { bracoD: C_(-20.2, 1.55 + 0.4 * sobe, 4.6), olhar: C_(-20, 1.2 + 2.6 * sobe, -1.75) }); real.rosto({ esforco: 0.15 }); real.olhosBrilho(0.35 * sobe);
    mochila.visible = false; placaEscola.visible = true;
    const e = suave(u / 2.5); const d = camera(C_(lerp(-18.8, -19.2, e), lerp(0.55, 0.7, e), lerp(-6.6, -6.2, e)).toArray(), C_(-20.2, lerp(1.6, 2.1, e), 2.2).toArray(), 50, { tremor: 0.8, t });
    lente({ foco: d, abertura: 0.004, brilho: 0.35, limiar: 0.9, ao: 0.7 });
  });
  plano('M2 vai para a escola levitando, a mochila atrás', 3.5, (u, t) => {
    prepM(); sedan.grupo.position.copy(C_(-6, 0.02, -1.75)); sedan.grupo.rotation.set(0, Math.PI / 2, 0, 'YXZ');
    const x = lerp(-33, -25.2, suave(u / 3.5)), P = C_(x, 0.45, 5.8);
    levitando(real, P, Math.PI / 2, t, { olhar: C_(x + 6, 1.2, 6) }); real.dobrar('upperarm_l', 0, 0, 20).dobrar('upperarm_r', 0, 0, -20); real.rosto({}); real.olhosBrilho(0);
    mochila.visible = true; mochila.position.copy(P).add(new THREE.Vector3(-0.75, 0.75 + 0.06 * Math.sin(t * 3), 0.0)); mochila.rotation.set(0.08 * Math.sin(t * 2), Math.PI / 2 + 0.15 * Math.sin(t * 1.5), 0.06 * Math.sin(t * 2.6));
    const e = suave(u / 3.5); const d = camera(C_(x - lerp(2.6, 3.2, e), lerp(1.0, 1.25, e), 1.6).toArray(), C_(x + lerp(0.2, 1.4, e), lerp(1.1, 2.6, e), 6.4).toArray(), 46, { tremor: 0.6, t });
    lente({ foco: d, abertura: 0.006, brilho: 0.35, limiar: 0.9, ao: 0.7 });
  });
  const E_ = (x, y, z) => new THREE.Vector3(escola.origem.x + x, y, escola.origem.z + z);
  const kEscrita = t => clamp((t - 40.3) / 3.3);
  function sala(t) {
    mundo('escola'); real.grupo.visible = true; if (real.grupo.parent !== scene) scene.add(real.grupo); lata.visible = gibi.visible = false; for (const A of [l10, mendes, rocha]) A.grupo.visible = false; mochila.visible = false;
    const k = kEscrita(t); escola.escrever(k);
    const pen = escola.ponta(k), tr = 0.012 * (k > 0 && k < 1 ? 1 : 0);
    pen.x += tr * Math.sin(t * 31); pen.y += tr * Math.sin(t * 27 + 1);
    prof.reset(); prof.grupo.position.set(pen.x + 0.55, 0, escola.origem.z - 4.4 + 0.62); prof.grupo.rotation.set(0, Math.PI + 0.35, 0);
    prof.ik('upperarm_r', 'lowerarm_r', 'hand_r', pen.clone().add(new THREE.Vector3(0.02, -0.04, 0.05)), new THREE.Vector3(1, -0.4, 0.4)).dedos('r', 0.55);
    prof.dobrar('upperarm_l', 0, 0, -20).dobrar('lowerarm_l', -60, 0, 0);
    const choque = clamp((k - 0.25) / 0.3); prof.olharPara(prof.pos('hand_r').lerp(E_(0.75, 1.15, 2.0), 0.25 * (1 - choque)), 0.9);
    prof.rosto({}).expressao({ 'eyebrows-left-inner-up': choque, 'eyebrows-right-inner-up': choque, 'eyebrows-left-up': choque, 'mouth-open': 0.35 * choque, 'eye-left-closure': 0 });
    prof.dobrar('spine_02', 0, 0, -6 * choque);
    const mao = prof.ossos.hand_r; mao.updateMatrixWorld(true); giz.position.copy(pen).add(new THREE.Vector3(0.0, -0.01, 0.03)); giz.rotation.set(1.2, 0, 0.4);
    // Lucas na terceira fileira: sentado, o dedo indicador "escrevendo" no ar, olhos acesos de leve
    real.sentar([E_(0.75, 0, 0).x, 0.47, escola.origem.z + 2.0 + 0.45], { yaw: Math.PI, recosto: -4 }); real.grupo.rotation.y = Math.PI;
    const alvoDedo = E_(0.75 + 0.18 + (pen.x - escola.origem.x) * 0.05, 1.0 + (pen.y - 1.55) * 0.08, escola.origem.z + 1.55 - escola.origem.z);
    real.ik('upperarm_r', 'lowerarm_r', 'hand_r', alvoDedo, new THREE.Vector3(1, -1, 0)).dedos('r', 1, { indicador: 0, polegar: 0.6 });
    real.olharPara(E_(0, 1.6, -4.3), 0.8); real.rosto({ esforco: 0.25 }); real.olhosBrilho(0.4 * (k > 0 && k < 1 ? 1 : 0.3));
    return pen;
  }
  plano('M3a a lousa: o dedo do Lucas guia o giz', 2.0, (u, t) => {
    sala(t); const e = suave(u / 2);
    const d = Q.has('lado') ? camera(E_(3.8, 1.4, 2.2).toArray(), E_(0.75, 0.8, 2.3).toArray(), 50) : camera(E_(lerp(1.0, 0.95, e), 1.32, lerp(3.15, 3.0, e)).toArray(), E_(0.3, 1.35, -4.2).toArray(), 46, { tremor: 0.6, t });
    lente({ foco: d * 0.75, abertura: 0.008, desfoque: 0.010, brilho: 0.3, limiar: 0.9, ao: 0.8 });
  });
  plano('M3b a mão da professora escreve HRYZ sozinha', 2.0, (u, t) => {
    const pen = sala(t); const e = suave(u / 2);
    const d = camera(E_(lerp(2.0, 1.75, e), 1.5, lerp(-1.6, -2.0, e)).toArray(), pen.clone().lerp(prof.pos('head'), 0.45).toArray(), lerp(46, 40, e), { tremor: 0.8, t });
    lente({ foco: d, abertura: 0.006, brilho: 0.3, limiar: 0.9, ao: 0.8 });
  });

  // ================================================================================================ 6) O PREÇO (44-50 s): a luz acaba, ele pisa no chão e desaba (o último quadro é o quadro 0)
  const lataIni = () => { lata.position.set(LX + 0.62, 0.62, LZ + 1.55); lata.rotation.set(0.4, 0.6, 0); gibi.position.set(LX - 0.48, 0.853, LZ + 1.05); gibi.rotation.set(0.5, 0.4, 0.3); };
  plano('F1 flutuando, até a luz acabar', 2.5, (u, t) => {
    mundo('quarto'); lata.visible = gibi.visible = true; real.grupo.visible = true; if (real.grupo.parent !== scene) scene.add(real.grupo);
    for (const A of [l10, mendes, rocha]) A.grupo.visible = false;
    const apaga = u < 1.5 ? 1 : (u < 1.75 ? (Math.sin(u * 90) > 0 ? 1 : 0.1) : 0);
    quarto.atualizar(t, { relampago: relampago(t, [44 + 1.55]), luzAcesa: apaga });
    real.reset(); real.grupo.position.set(-1.25, 0.95 + 0.04 * Math.sin(t * 1.8), 0.55); real.grupo.rotation.set(-Math.PI / 2 + 0.25, 0, 0.0, 'YXZ');
    real.dobrar('thigh_l', -20, 0, 0).dobrar('calf_l', 30, 0, 0).dobrar('upperarm_l', -40, 0, -20).dobrar('upperarm_r', -50, 0, 25);
    real.olharPara(new THREE.Vector3(-1.25, 1.55, -0.5), 0.8); real.rosto({}); real.olhosBrilho(0);
    gibi.position.set(-1.25, 1.55, -0.45 + 0.02 * Math.sin(t)); gibi.rotation.set(-1.25 + Math.PI, 0, 0.1); lata.position.set(-0.9, 1.3 + 0.03 * Math.sin(t * 1.4), -0.25); lata.rotation.set(0.1, 0.6, 0.15);
    const e = suave(u / 2.5); const d = camera([lerp(-0.05, -0.2, e), lerp(1.6, 1.55, e), lerp(-1.35, -1.25, e)], [-1.25, 1.2, -0.45], 50, { tremor: 0.8, t });
    lente({ foco: d, abertura: 0.008, brilho: 0.4, limiar: 0.8, ao: 0.85 });
  });
  plano('F2 pisa no chão e desaba (volta ao quadro 0)', 3.5, (u, t) => {
    mundo('quarto'); lata.visible = gibi.visible = true; real.grupo.visible = true; for (const A of [l10, mendes, rocha]) A.grupo.visible = false;
    quarto.atualizar(t, { relampago: relampago(t, [44 + 2.9]), luzAcesa: 0 });
    // desce de pé (captura de pé, tc 6.5) e depois o "levantar de bruços" ao contrário, acelerado: os joelhos cedem e ele cai na pose do quadro 0
    const tc = u < 1.0 ? 6.5 : u < 3.1 ? lerp(6.5, 0.70, entra(clamp((u - 1.0) / 2.1)) ** 0.8) : 0.70;
    const desce = u < 1.0 ? lerp(0.55, 0, suave(u / 1.0)) : 0;
    const soCima = u > 3.1;
    aplicarMocap(real, clips['140_01'], tc, { origem: [LX, desce, LZ], yaw: -Math.PI / 2, ossos: soCima ? ['spine_01', 'spine_02', 'spine_03', 'neck_01', 'head', 'clavicle_l', 'upperarm_l', 'lowerarm_l', 'hand_l', 'clavicle_r', 'upperarm_r', 'lowerarm_r', 'hand_r'] : null });
    if (soCima) for (const l of ['l', 'r']) real.girar('foot_' + l, [1, 0, 0], 0.5);
    const tr = u > 3.1 ? 0.8 : 0.3; for (const l of ['l', 'r']) real.dobrar('lowerarm_' + l, 4 * tr * ruido(t * 21, l === 'l' ? 4 : 5), 0, 0);
    if (u > 2.6) real.olharPara(new THREE.Vector3(LX + 0.5, 0.9, LZ + 2.6), 0.55 + 0.4 * clamp((0.7 - 0.4) / 1.0) * clamp((u - 2.6) / 0.5));
    real.rosto({ esforco: u > 1.0 ? 0.5 : 0.1, triste: 0.5, boca: u > 1 && u < 2.5 ? 0.4 : 0 });
    lataIni();
    // câmera: de um plano médio até exatamente o enquadramento do quadro 0
    const e = suave(clamp((u - 0.2) / 3.2));
    const d = camera([lerp(-0.6, 0.70, e), lerp(1.55, 1.25, e), lerp(1.9, 2.55, e)], [lerp(LX, LX, e), lerp(0.75, 0.30, e), lerp(LZ + 0.4, LZ + 0.70, e)], lerp(46, 42, e), { roll: lerp(0, 0.06, e), tremor: lerp(1.5, 1, e), t });
    lente({ foco: d - 0.35, abertura: 0.010, desfoque: 0.012, brilho: 0.45, limiar: 0.8 });
  });
  return S;
}

function canvasTexto(txt, fundo, cor) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 196; const g = c.getContext('2d');
  g.fillStyle = fundo; g.fillRect(0, 0, 1024, 196); g.strokeStyle = cor; g.lineWidth = 10; g.strokeRect(8, 8, 1008, 180);
  g.fillStyle = cor; g.font = '900 86px "DejaVu Sans", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 512, 102);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function atualizar(t) { const p = acharPlano(t); p.fn(clamp(t - p.t0, 0, p.dur), t, p); }
export function efeitos(t) { const p = acharPlano(t), u = t - p.t0; return p.efeito ? p.efeito(u, t) : { subs: 1 }; }
