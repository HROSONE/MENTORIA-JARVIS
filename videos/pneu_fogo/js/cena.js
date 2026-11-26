// Short "Encher pneu com fogo": por que o spray inflamável + fogo encaixa o talão do pneu no aro (e por que é perigoso).
// Estúdio azul neutro, o operador do elenco (captura real CMU + IK nas mãos), pneu 265/70 R16 procedural com corte transversal.
// Sem narração, sem tremor de câmera. Tudo é função do tempo t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { criarMotor } from '../../core/motor.js';
import { clamp, lerp, inv, suave } from '../../core/util.js';
import { criarRoda } from '../../biblioteca3d/veiculos/pneu/pneu.js';
import { carregarAtor, carregarClip } from './ator.js';
import { criarLata, criarIsqueiro, criarEfeitos, criarManometro, criarPlaca, ALTURA } from './fx.js';

export const { renderer, scene, cam, capturar, FPS } = criarMotor({ exposicao: 1.0, near: 0.01, far: 100, fov: 40 });
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ------------------------------------------------------------------------------------------------ linha do tempo
export const PLANOS = [
  { id: 'gancho', t0: 0, t1: 3 }, { id: 'premissa', t0: 3, t1: 8 }, { id: 'mistura', t0: 8, t1: 14 }, { id: 'acende', t0: 14, t1: 19 },
  { id: 'pressao', t0: 19, t1: 26 }, { id: 'esfria', t0: 26, t1: 32 }, { id: 'perigo', t0: 32, t1: 41 }, { id: 'loop', t0: 41, t1: 45 },
];
export const TOTAL = 45;
export const plano = t => PLANOS.find(p => t >= p.t0 && t < p.t1) || PLANOS[PLANOS.length - 1];
const T_UUF = 15.0, T_POP0 = 0.8, T_FLICK = 14.6, T_FRENTE = [15.8, 18.3], T_POP = 21.6, T_ESTOURO = 34.2, T_POP_LOOP = 41 + T_POP0 + 0.6;
const CORTE = 1.35;                                                                    // fatia aberta no corte (rad)
const Y_RODA = 0.14;

// ------------------------------------------------------------------------------------------------ estúdio azul
function estudio() {
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: { cima: { value: new THREE.Color(0x8fb0d8) }, baixo: { value: new THREE.Color(0x6f90bd) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 cima; uniform vec3 baixo; varying vec3 vP; void main(){ float k = smoothstep(-6.0, 14.0, vP.y); gl_FragColor = vec4(mix(baixo, cima, k), 1.0); }' })));
  scene.fog = new THREE.Fog(0x7193c0, 3, 12);
  const chao = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshStandardMaterial({ color: 0x5679a8, roughness: 0.95 })); chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; scene.add(chao);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.65;
  const sol = new THREE.DirectionalLight(0xfff1df, 2.3); sol.position.set(1.8, 3.6, 2.4); scene.add(sol.target);
  sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); Object.assign(sol.shadow.camera, { left: -1.6, right: 1.6, top: 1.6, bottom: -1.6, near: 0.5, far: 9 }); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02; scene.add(sol);
  scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x3a5578, 0.6));
  const contra = new THREE.DirectionalLight(0xbfd6ff, 1.2); contra.position.set(-2.5, 2.2, -2.5); scene.add(contra);
  return sol;
}

// ------------------------------------------------------------------------------------------------ carga
let mangueira, roda, fx, ator, clipAgachar, lata, isqueiro, mano, placa, vermelho, sol;
export async function construir() {
  sol = estudio();
  roda = criarRoda({ segs: 240 }); roda.grupo.position.y = Y_RODA; scene.add(roda.grupo);
  fx = criarEfeitos(roda); fx.janelaAng(CORTE);
  ator = await carregarAtor('../biblioteca3d/personagens/elenco/operador.glb'); scene.add(ator.obj);
  clipAgachar = await carregarClip('../biblioteca3d/mocap/cmu/69_70.json');
  lata = criarLata(); scene.add(lata.grupo);
  isqueiro = criarIsqueiro(); scene.add(isqueiro.grupo);
  mano = criarManometro(); scene.add(mano.grupo);
  mangueira = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, 0, 0), V(0.02, -0.06, 0.0), V(0.15, -0.08, 0.05), V(0.45, 0.02, 0.15), V(0.9, 0.35, 0.3), V(1.4, 0.8, 0.4)]), 80, 0.008, 12),
    new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: 0.55 })); mangueira.castShadow = true; scene.add(mangueira);
  placa = criarPlaca(); placa.position.set(0.55, 0, -0.75); placa.rotation.y = -0.35; scene.add(placa);
  // filtro vermelho da "simulação do que pode dar errado"
  vermelho = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ color: 0xff2010, transparent: true, opacity: 0, depthTest: false, blending: THREE.MultiplyBlending, premultipliedAlpha: true }));
  vermelho.renderOrder = 99; vermelho.position.z = -0.3; cam.add(vermelho);
  window.__dbg = { roda, fx, ator, cam, renderer, scene };
  return { total: TOTAL };
}

// ------------------------------------------------------------------------------------------------ helpers
function olhar(p, a, fov = 40) { cam.position.copy(p); cam.lookAt(a); if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); } }
function mover(t, t0, t1, p0, a0, p1, a1, fov0 = 40, fov1 = fov0, e = suave) { const k = e(inv(t0, t1, t)); olhar(p0.clone().lerp(p1, k), a0.clone().lerp(a1, k), lerp(fov0, fov1, k)); }
const W = v => roda.grupo.localToWorld(v.clone());
function frestaMundo(k = 0, a = Math.PI) { const f = roda.fresta(k); return W(V(f.r * Math.cos(a), f.y + 0.012, f.r * Math.sin(a))); }
// assentamento do talão ao longo do vídeo
function assento(t, pl) {
  if (pl.id === 'gancho') return suave(inv(T_POP0, T_POP0 + 0.09, t));
  if (pl.id === 'loop') return suave(inv(T_POP_LOOP, T_POP_LOOP + 0.09, t));
  if (pl.id === 'pressao') return suave(inv(T_POP - 0.5, T_POP, t)) ;
  if (pl.id === 'esfria' || pl.id === 'perigo') return 1;
  return 0;
}

// ------------------------------------------------------------------------------------------------ estado por instante
export function atualizar(t) {
  ALTURA.value = renderer.getDrawingBufferSize(new THREE.Vector2()).y;
  const pl = plano(t);
  const k = assento(t, pl);
  roda.assentar(k);
  const cortado = ['mistura', 'pressao', 'esfria'].includes(pl.id) || (pl.id === 'acende' && t > 15.5);
  roda.cortar(cortado ? CORTE : 0);
  roda.grupo.rotation.set(0, cortado ? -0.55 : 0, 0);
  const rx = pl.id === 'acende' ? suave(inv(15.5, 16.0, t)) * (1 - suave(inv(18.5, 18.95, t))) : 0;
  roda.pneu.material.transparent = rx > 0.001; roda.pneu.material.opacity = 1 - 0.72 * rx; roda.pneu.material.depthWrite = rx < 0.001;
  // pulo do pneu no estalo (gancho e loop) e o estouro na simulação
  let pulo = 0; for (const tp of [T_POP0, T_POP_LOOP]) if (t > tp && t < tp + 0.6) pulo = Math.max(pulo, 0.06 * Math.sin((t - tp) / 0.6 * Math.PI) * Math.exp(-(t - tp) * 3));
  roda.grupo.position.set(0, Y_RODA + pulo, 0);
  roda.grupo.updateMatrixWorld(true); camera(t, pl);                                   // câmera antes de virar o manômetro para ela
  // estouro (simulação): o aro e o disco saem voando girando, o pneu abre
  const est = pl.id === 'perigo' ? clamp((t - T_ESTOURO) / 1.6) : 0;
  roda.aro.position.set(0, est > 0 ? 2.2 * est - 1.4 * est * est : 0, 0); roda.disco.position.y = 0.035 + roda.aro.position.y; roda.aro.rotation.set(est * 4, 0, est * 2.5); roda.disco.rotation.copy(roda.aro.rotation);
  roda.pneu.scale.set(1 + 0.25 * suave(est * 3), 1 - 0.3 * suave(est * 3), 1 + 0.25 * suave(est * 3));
  const kv = pl.id === 'perigo' ? suave(inv(32, 32.6, t)) * (1 - suave(inv(36.2, 36.8, t))) : 0;   // filtro vermelho só na simulação
  vermelho.visible = kv > 0.001; vermelho.material.opacity = 1; vermelho.material.color.setRGB(1, lerp(1, 0.55, kv), lerp(1, 0.5, kv));
  // ---- operador: agachado junto ao pneu (captura real) com as mãos por IK; fora dos planos de corte
  const comAtor = ['premissa', 'acende'].includes(pl.id) && !cortado || pl.id === 'perigo' && t > 36.5;
  ator.obj.visible = comAtor; lata.grupo.visible = false; isqueiro.grupo.visible = false;
  if (comAtor) {
    const tc = pl.id === 'perigo' ? 1.2 : pl.id === 'acende' ? 3.0 : lerp(2.2, 3.0, suave(inv(pl.t0, pl.t0 + 1.0, t)));          // desce até agachar (ou em pé no fim)
    ator.corpo(clipAgachar, tc, V(-0.72, 0, 0.12), Math.PI / 2);
    if (pl.id === 'premissa') {
      const fr = frestaMundo(0), mao = fr.clone().add(V(-0.24, 0.10, 0.06));
      lata.grupo.visible = true; lata.grupo.position.copy(mao);
      { const bx = fr.clone().sub(mao).setY(0).normalize(), by = V(0, 1, 0).applyAxisAngle(V().crossVectors(V(0, 1, 0), bx).normalize(), -0.35), bz = V().crossVectors(bx, by).normalize(); bx.crossVectors(by, bz);   // de pé, bico virado para a fresta
        lata.grupo.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(bx, by, bz)); lata.grupo.position.addScaledVector(by, -0.06); }
      lata.grupo.updateMatrixWorld(true);
      ator.ik('D', mao.clone().add(V(-0.01, -0.03, 0)), V(0, -1, 1).normalize());
      ator.ik('E', W(V(-0.30, 0.10, -0.25)), V(0, -1, -1).normalize());                            // apoia no pneu
      const k2 = suave(inv(4.0, 4.3, t)) * (1 - suave(inv(7.4, 7.8, t)));
      fx.nevoa(t, k2, lata.ponta.getWorldPosition(V()));
    } else fx.nevoa(t, 0, V());
    if (pl.id === 'acende') {
      // o pulso vai até perto da fresta; o isqueiro fica na palma (preso à mão), a chama na boca da fresta
      const fr = frestaMundo(0), pulso = fr.clone().add(V(-0.085, 0.0, -0.04)).lerp(fr.clone().add(V(-0.30, 0.22, -0.12)), 1 - suave(inv(13.6, 14.3, t)));
      ator.ik('E', pulso, V(0, -1, -1).normalize());
      const pm = ator.pos('MaoE'), dirM = pm.clone().sub(ator.pos('AntebracoE')).setY(0).normalize();
      isqueiro.grupo.visible = true; isqueiro.grupo.position.copy(pm).addScaledVector(dirM, 0.045).add(V(0, 0.0, 0)); isqueiro.grupo.rotation.set(0, Math.atan2(-dirM.z, dirM.x), 0);
      isqueiro.acesa(t > T_FLICK ? 1 : 0, t);
      ator.ik('D', W(V(-0.30, 0.10, 0.25)), V(0, -1, 1).normalize());
    }
  } else fx.nevoa(t, 0, V());
  // ---- dentro do pneu: moléculas, chama, pressão
  const phi = CORTE;
  const mistura = pl.id === 'mistura' ? suave(inv(8.6, 12.5, t)) : 1;
  const calor = pl.id === 'acende' ? suave(inv(T_FRENTE[0], T_FRENTE[1], t)) : pl.id === 'pressao' ? 1 : pl.id === 'esfria' ? 1 - suave(inv(26.3, 28.5, t)) : 0;
  fx.moleculas(t, { vis: cortado ? 1 : 0, mistura, calor, cortePhi: phi });
  const frente = pl.id === 'acende' ? inv(T_FRENTE[0], T_FRENTE[1], t) : pl.id === 'pressao' ? 1 : 0;
  const queima = pl.id === 'acende' && cortado ? suave(inv(T_FRENTE[0], T_FRENTE[0] + 0.4, t)) : pl.id === 'pressao' ? 1 - suave(inv(T_POP, T_POP + 1.5, t)) : 0;
  fx.chama(t, { frente, queima, vis: cortado ? 1 : 0, kAssento: k });
  // labareda pela fresta: no gancho, no estalo principal (sem corte também), no estouro e no loop
  let lab = 0, tL = T_POP0;
  for (const [tp, ativo] of [[T_UUF, pl.id === 'acende' && t < 15.5], [T_POP0, pl.id === 'gancho'], [T_POP, pl.id === 'pressao'], [T_ESTOURO, pl.id === 'perigo'], [T_POP_LOOP, pl.id === 'loop']])
    if (ativo && t > tp - 0.15) { lab = (tp === T_UUF ? 0.6 : 1) * (1 - clamp((t - tp - 0.25) / 0.8)); tL = tp - 0.15; }
  fx.labareda(t, tL, { setor: pl.id === 'acende' ? 0.9 : 0, k: Math.max(0, lab), fumaca: ['gancho', 'pressao', 'perigo', 'loop'].includes(pl.id) ? clamp((t - tL) * 2) * (1 - clamp((t - tL - 2.5) / 2)) : 0 });
  if (lab > 0) fx.luzFogo.intensity = Math.max(fx.luzFogo.intensity, 3 * lab);
  const pres = pl.id === 'pressao' ? suave(inv(19.3, 20.8, t)) * (1 - suave(inv(T_POP + 0.3, T_POP + 2.5, t)) * 0.6) : pl.id === 'esfria' ? 0.4 * (1 - suave(inv(26.3, 28.5, t))) : 0;
  fx.pressao(pres, phi);
  // ---- manômetro preso na válvula (de pé, virado para a câmera) e a leitura
  const vMundo = roda.valvula.getWorldPosition(V());
  mano.grupo.position.copy(vMundo).add(V(0, 0.09, 0)); mano.grupo.lookAt(cam.position);
  mano.grupo.visible = ['pressao', 'esfria'].includes(pl.id);
  let leitura = 3;
  if (pl.id === 'pressao') leitura = lerp(3, 52, suave(inv(19.4, T_POP, t))) - 30 * suave(inv(T_POP + 0.2, 25.8, t));
  if (pl.id === 'esfria') leitura = lerp(22, 6, suave(inv(26.2, 28.3, t))) + 26 * suave(inv(29.2, 31.8, t));
  mano.ler(leitura + 0.4 * Math.sin(t * 20) * (pl.id === 'pressao' ? 1 : 0));
  placa.visible = pl.id === 'perigo' && t > 36.2;
  const km = pl.id === 'esfria' ? suave(inv(28.6, 29.2, t)) : 0;                                   // o compressor entra: a mangueira encaixa no calibrador
  const dM = mano.grupo.position.clone().sub(cam.position).setY(0).normalize();          // sai por trás do calibrador (não tampa o mostrador)
  mangueira.visible = km > 0.001; mangueira.rotation.set(0, Math.atan2(-dM.z, dM.x), 0);
  mangueira.position.copy(mano.grupo.position).add(V(0, -0.04, 0)).addScaledVector(dM, 0.015 + 0.6 * (1 - km)).add(V(0, 0.3 * (1 - km), 0));
  camera(t, pl);
}

// ------------------------------------------------------------------------------------------------ câmera (sem tremor)
function camera(t, pl) {
  const fr = frestaMundo(0);
  switch (pl.id) {
    case 'gancho': case 'loop': {                                                          // baixo, quase no chão, o pneu enche o quadro com a labareda
      const t0 = pl.t0, t1 = pl.t1;
      mover(t, t0, t1, V(1.05, 0.62, 1.45), V(0.0, 0.16, 0.0), V(0.86, 0.52, 1.18), V(0.0, 0.17, 0.0), 40, 40); break;
    }
    case 'premissa':
      if (t < 5.2) mover(t, 3, 5.2, V(0.55, 0.85, 1.75), V(-0.40, 0.40, 0.0), V(0.40, 0.78, 1.55), V(-0.40, 0.36, 0.0), 40, 40);   // geral: o operador agachado, a lata
      else mover(t, 5.2, 8, V(0.30, 0.98, 0.80), V(-0.40, 0.32, 0.0), V(0.18, 0.88, 0.66), V(-0.40, 0.30, 0.0), 40, 38);   // de dentro do aro, olhando o operador: a névoa vem para a câmera              // close na fresta: a névoa entrando
      break;
    case 'mistura':
      mover(t, 8, 14, V(0.85, 0.85, 0.95), V(0.0, 0.14, 0.05), V(0.62, 0.62, 0.78), V(0.0, 0.14, 0.05), 40, 38); break;               // o corte: vapor se espalhando
    case 'acende':
      if (t < 15.5) mover(t, 14, 15.5, V(0.30, 0.98, -0.80), V(-0.40, 0.32, 0.0), V(0.18, 0.88, -0.66), V(-0.40, 0.30, 0.0), 40, 38);    // o isqueiro na fresta
      else mover(t, 15.5, 19, V(0.0, 1.35, 0.55), V(0.0, 0.12, 0.0), V(0.05, 1.15, 0.45), V(0.0, 0.12, 0.0), 42, 42);                   // de cima: a frente de fogo dando a volta
      break;
    case 'pressao':
      if (t < 21.0) mover(t, 19, 21, V(0.70, 0.62, 0.72), V(0.0, 0.14, 0.05), V(0.55, 0.45, 0.60), V(0.0, 0.16, 0.08), 40, 38);         // moléculas quentes e as setas
      else mover(t, 21, 26, V(0.38, 0.40, 0.48), V(-0.02, 0.22, 0.20), V(0.42, 0.42, 0.55), V(-0.02, 0.22, 0.18), 36, 38);              // o talão subindo na aba: POP
      break;
    case 'esfria':
      mover(t, 26, 32, V(0.62, 0.55, 0.75), V(0.0, 0.16, 0.08), V(0.70, 0.50, 0.55), V(0.05, 0.20, 0.0), 40, 40); break;
    case 'perigo':
      if (t < 36.5) mover(t, 32, 36.5, V(1.6, 0.6, 2.0), V(0.0, 0.5, 0.0), V(1.8, 0.8, 2.4), V(0.0, 0.8, 0.0), 40, 40);                 // o estouro (simulação)
      else mover(t, 36.5, 41, V(0.6, 1.05, 1.9), V(0.4, 1.1, -0.6), V(0.58, 1.25, 1.35), V(0.5, 1.3, -0.7), 40, 36);                     // a placa
      break;
  }
}

export function efeitos(t) {
  let flash = 0;
  for (const tp of [T_POP0, T_POP, T_ESTOURO, T_POP_LOOP]) if (t > tp && t < tp + 0.18) flash = Math.max(flash, 0.6 * (1 - (t - tp) / 0.18));
  const corte = PLANOS.some(p => p.t0 > 0 && Math.abs(t - p.t0) < 0.08);
  return { flash, subs: corte ? 3 : 1 };
}
