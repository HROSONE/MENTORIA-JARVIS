// Short "A carne que ainda se mexe": boi Nelore pastando → o capim vira energia (raio-x do rúmen) → mitocôndrias guardam ATP →
// abate (pistola de dardo cativo, discreto) → açougueiro corta → a carne fervilha enquanto há ATP → rigor mortis (~12 h) → loop.
// Sem narração (o dono narra): roteiro com tempos em roteiro.md. Tudo é função do tempo t.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { criarMotor, tremor } from '../../core/motor.js';
import { clamp, lerp, inv, suave, suave5 } from '../../core/util.js';
import { Boi } from './boi.js';
import { criarPasto } from './pasto.js';
import { criarMicro } from './micro.js';
import { criarAcougue, TABUA_Y } from './acougue.js';

export const { renderer, scene, cam, capturar, FPS } = criarMotor({ exposicao: 1.0, near: 0.01, far: 200, fov: 40, mundos: ['A', 'M', 'C'] });
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ------------------------------------------------------------------------------------------------ linha do tempo
export const PLANOS = [
  { id: 'gancho', t0: 0, t1: 3.5 }, { id: 'pasto', t0: 3.5, t1: 9.5 }, { id: 'digestao', t0: 9.5, t1: 16 }, { id: 'celulas', t0: 16, t1: 22 },
  { id: 'abate', t0: 22, t1: 26.5 }, { id: 'acougue', t0: 26.5, t1: 34 }, { id: 'fervilha', t0: 34, t1: 47 }, { id: 'rigor', t0: 47, t1: 55 },
];
export const TOTAL = 55;
export const plano = t => PLANOS.find(p => t >= p.t0 && t < p.t1) || PLANOS[PLANOS.length - 1];
const T_TIRO = 23.6;
const GOLPES = [28.0, 29.0, 30.0, 31.0, 32.0, 33.0];
// relógio (minutos desde o abate) em função do tempo do vídeo; o gancho mostra 7 min
function minutos(t) {
  if (t < 3.5) return 7 + t * 0.02;
  if (t < 34) return lerp(0.5, 6, inv(26.5, 34, t));
  if (t < 47) return 6 + 54 * Math.pow(inv(34, 47, t), 1.6);
  return 60 + 660 * Math.pow(inv(47, 53, t), 1.8);
}
// tremor visível da carne: forte no começo, some perto de 1 hora
const tremorCarne = min => Math.max(0, (Math.exp(-min / 16) - Math.exp(-60 / 16)) / (1 - Math.exp(-60 / 16)));
// energia guardada (ATP) nas células: cai até ~25% em 1 h e acaba em ~12 h (rigor mortis)
const atp = min => min < 60 ? 1 - 0.75 * (min / 60) : Math.max(0, 0.25 * (1 - (min - 60) / 640));

// ------------------------------------------------------------------------------------------------ estúdio azul
function estudio(mundo) {
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { cima: { value: new THREE.Color(0x86a8d2) }, baixo: { value: new THREE.Color(0x4a6f9f) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 cima; uniform vec3 baixo; varying vec3 vP; void main(){ float k = smoothstep(-6.0, 14.0, vP.y); gl_FragColor = vec4(mix(baixo, cima, k), 1.0); }' }));
  mundo.add(ceu);
  const chao = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.MeshStandardMaterial({ color: 0x5679a8, roughness: 0.95 }));
  chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; mundo.add(chao);
  return ceu;
}
function luzes(mundo, alvo, raio) {
  const sol = new THREE.DirectionalLight(0xfff1df, 2.4); sol.position.copy(alvo).add(V(2.5, 4.5, 3.2)); sol.target.position.copy(alvo); mundo.add(sol.target);
  sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); Object.assign(sol.shadow.camera, { left: -raio, right: raio, top: raio, bottom: -raio, near: 0.5, far: 14 });
  sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02; mundo.add(sol);
  mundo.add(new THREE.HemisphereLight(0xdfe9ff, 0x3a5578, 0.6));
  const contra = new THREE.DirectionalLight(0xbfd6ff, 1.3); contra.position.copy(alvo).add(V(-3, 2.5, -3)); mundo.add(contra);
  return sol;
}

// ------------------------------------------------------------------------------------------------ carga
let boi, pasto, micro, acougue, solA;
const mA = () => scene.getObjectByName('mundoA'), mM = () => scene.getObjectByName('mundoM'), mC = () => scene.getObjectByName('mundoC');
export async function construir() {
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.6;
  // A: pasto + boi
  estudio(mA()); solA = luzes(mA(), V(0.3, 0.6, 0), 3.2);
  pasto = criarPasto(); pasto.grupo.position.set(0.6, 0, 0); mA().add(pasto.grupo);
  boi = await new Boi().carregar('../biblioteca3d/animais/boi/boi.glb'); mA().add(boi.grupo);
  // M: dentro do músculo
  micro = criarMicro(); mM().add(micro.grupo); micro.prenderMedidor(cam);
  const lm = new THREE.PointLight(0xffd9b0, 400, 60); lm.position.set(4, 8, 10); mM().add(lm); mM().add(new THREE.AmbientLight(0x803040, 1.2));
  const lm2 = new THREE.DirectionalLight(0xff9aa0, 1.2); lm2.position.set(-5, -3, 6); mM().add(lm2);
  // C: açougue
  estudio(mC()); luzes(mC(), V(0, 1.0, 0), 2.2);
  acougue = await criarAcougue(); mC().add(acougue.grupo);
  window.__dbg = { acougue, boi, micro, cam, renderer, scene };
  return { total: TOTAL };
}

// ------------------------------------------------------------------------------------------------ câmera
function olhar(p, a, fov = 40) { cam.position.copy(p); cam.lookAt(a); if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); } }
function mover(t, t0, t1, p0, a0, p1, a1, fov0 = 40, fov1 = fov0, e = suave) {
  const k = e(inv(t0, t1, t)); olhar(p0.clone().lerp(p1, k), a0.clone().lerp(a1, k), lerp(fov0, fov1, k));
}

// ------------------------------------------------------------------------------------------------ estado por instante
export function atualizar(t) {
  const pl = plano(t);
  const mundo = { gancho: 'C', pasto: 'A', digestao: 'A', celulas: 'M', abate: 'A', acougue: 'C', fervilha: (t > 39 && t < 43) ? 'M' : 'C', rigor: (t > 49.5 && t < 52) ? 'M' : 'C' }[pl.id];
  mA().visible = mundo === 'A'; mM().visible = mundo === 'M'; mC().visible = mundo === 'C'; micro.medidor.visible = mundo === 'M';
  const min = minutos(t);
  if (mundo === 'A') {
    const vivo = t < T_TIRO + 0.05;
    const queda = clamp(inv(T_TIRO + 0.15, T_TIRO + 1.9, t));
    const pastar = pl.id === 'abate' ? lerp(0.25, 0.0, suave(inv(22, 22.6, t))) : 1;
    const mordida = pl.id === 'pasto' ? Math.max(0, Math.sin(t * 2 * Math.PI * 0.45)) ** 4 : 0;
    boi.colocar(0, 0, 0, queda);
    boi.pose(t, { pastar, mastigar: pl.id === 'abate' ? (vivo ? 0.5 : 0) : 1, cauda: vivo ? 1 : 0, orelha: vivo ? 1 : 0, queda, morto: vivo ? 0 : 1 });
    pasto.atualizar(t, boi.boca().sub(pasto.grupo.position), mordida);
    // raio-x na digestão
    const kx = pl.id === 'digestao' ? suave(inv(9.6, 10.4, t)) * (1 - suave(inv(15.6, 16, t)) * 0) : 0;
    boi.raioX(t, kx, { u: inv(10.4, 12.9, t), dig: suave(inv(12.6, 13.4, t)) * (1 - suave(inv(15.2, 16, t)) * 0.3), en: suave(inv(13.8, 14.6, t)) });
    acougue.pistola.visible = false;
    if (pl.id === 'abate') {
      // pistola de dardo cativo: entra pela direita e encosta na testa
      const pist = acougue.pistola; mA().add(pist); pist.visible = t < T_TIRO + 0.05;
      const testa = boi.ossos.cabeca.localToWorld(V(0, 0.12, 0.0)).add(V(0.05, 0.06, 0));
      const dir = V(0.55, 0.75, 0.35).normalize();
      const k = suave(inv(22.3, T_TIRO - 0.25, t));
      const p = testa.clone().addScaledVector(dir, 0.20 + 0.6 * (1 - k));
      pist.position.copy(p); pist.quaternion.setFromUnitVectors(V(1, 0, 0), dir.clone().negate());
      if (t > T_TIRO && t < T_TIRO + 0.05) pist.position.addScaledVector(dir, 0.03);
    }
  } else if (mundo === 'M') {
    let energia = 1, contr = 0.4;
    let carga = 0, estoque;
    if (pl.id === 'celulas') { carga = suave(inv(16.4, 17.2, t)) * (1 - suave(inv(21.2, 22, t))); energia = lerp(0.05, 1, suave(inv(17.4, 20.2, t))); estoque = lerp(0.0, 1, suave(inv(18.6, 21.6, t))); contr = 0.2; }
    else { energia = atp(min); estoque = energia; contr = tremorCarne(min) * 1.2; }
    micro.atualizar(t, { energia, contr, carga, estoque, med: pl.id === 'celulas' ? suave(inv(16.8, 17.4, t)) : 1 });
  } else {
    const en = pl.id === 'gancho' ? 1.0 : tremorCarne(min);
    const rigor = suave(inv(360, 720, min));
    acougue.relogio(min);
    const golpes = pl.id === 'acougue' ? GOLPES : GOLPES.map(x => x - 1000);       // fora do açougue: tudo já cortado
    acougue.atualizar(t, { golpes, en: en * (pl.id === 'acougue' ? Math.max(0.8, en) : 1), rigor, comCutelo: pl.id === 'acougue', homemVisivel: pl.id === 'acougue' });
    // fora da cena do corte, o cutelo fica cravado na tábua ao lado da carne
    if (pl.id !== 'acougue') { const c = acougue.cutelo; c.rotation.set(0.12, -Math.PI / 2 + 0.5, 0, 'YXZ'); c.position.set(0.24, TABUA_Y + 0.09, -0.07); }
  }
  camera(t, pl);
}

const BOI_C = V(0.3, 0.85, 0);
function camera(t, pl) {
  const u = t - pl.t0;
  switch (pl.id) {
    case 'gancho':   // o bife herói de frente, o cronômetro logo à frente (push-in lento)
      mover(t, 0, 3.5, V(-0.25, 1.27, 0.40), V(-0.25, 0.925, 0.155), V(-0.25, 1.23, 0.36), V(-0.25, 0.925, 0.150), 40, 38); break;
    case 'pasto':
      if (t < 6.6) mover(t, 3.5, 6.6, V(3.9, 0.75, 3.1), V(0.3, 0.75, 0), V(3.5, 0.65, 1.8), V(0.45, 0.7, 0), 38);         // contra-plongée, órbita
      else mover(t, 6.6, 9.5, V(2.2, 0.85, 1.2), V(0.95, 0.42, 0.0), V(1.65, 0.68, 0.68), V(0.96, 0.38, 0.0), 38, 34);      // push-in na boca
      break;
    case 'digestao': {
      if (t < 15.0) {
        const foco = boi.bolo.visible ? boi.bolo.getWorldPosition(V()) : V(0, 0.95, -0.1);
        const a = V(0.15, 0.92, -0.05).lerp(foco, 0.35 * (1 - suave(inv(12.6, 13.4, t))));
        mover(t, 9.5, 15.0, V(3.4, 2.2, -5.6), a, V(2.4, 1.9, -5.0), a, 40, 40);
      } else mover(t, 15.0, 16, V(2.4, 1.9, -5.0), V(0.0, 0.95, -0.1), V(-0.55, 1.0, -0.75), V(-0.75, 0.98, -0.25), 40, 28, x => x * x);   // mergulho no músculo
      break;
    }
    case 'celulas':  // capilar → glicose entrando → mitocôndrias acendendo → glicogênio (estoque) enchendo
      if (t < 18.2) mover(t, 16, 18.2, V(26, 4, 14), V(8, -1.0, -3), V(19.5, 2.0, 8.5), V(8.5, -0.9, -3), 40, 40, x => 1 - (1 - x) ** 2);
      else mover(t, 18.2, 22, V(19.5, 2.0, 8.5), V(8.5, -0.9, -3), V(13.6, 1.0, 1.4), V(9, -0.3, -3.6), 40, 40);
      break;
    case 'abate':
      if (t < T_TIRO) mover(t, 22, T_TIRO, V(0.85, 1.95, 1.05), V(1.22, 1.22, 0), V(0.95, 1.85, 0.85), V(1.22, 1.22, 0), 40, 36);   // por cima e por trás da cabeça (testa, chifres e a pistola)
      else { const q = suave(inv(T_TIRO + 0.15, T_TIRO + 1.9, t));                 // a câmera acompanha o corpo do boi em pé até ele no chão
        olhar(V(4.4, 1.7, 3.8).lerp(V(3.7, 1.5, 3.4), suave(inv(T_TIRO, 26.5, t))), V(0.35, 0.85, 0.1).lerp(V(0.0, 0.35, 1.05), q), 40); }
      break;
    case 'acougue':
      if (t < 30.4) mover(t, 26.5, 30.4, V(0.55, 1.0, 2.1), V(0.0, 1.2, -0.3), V(0.45, 1.05, 1.7), V(0.0, 1.15, -0.25), 40, 40);
      else mover(t, 30.4, 34, V(-0.50, 1.14, 0.36), V(-0.03, 1.0, -0.02), V(-0.42, 1.10, 0.30), V(-0.03, 0.99, -0.02), 40, 38);   // de lado (o lado do cutelo): a lâmina cai entre as fatias
      break;
    case 'fervilha':
      if (t < 39) mover(t, 34, 39, V(-0.25, 1.14, 0.22), V(-0.25, 0.935, 0.07), V(-0.25, 1.10, 0.19), V(-0.25, 0.935, 0.07), 40, 38);       // macro: a face de corte fervilhando
      else if (t < 43) mover(t, 39, 43, V(13.2, 1.0, 1.2), V(9, -0.2, -3.6), V(15.5, 1.8, 3.2), V(9, -0.4, -3.8), 40, 40);                 // células apagando
      else mover(t, 43, 47, V(-0.25, 1.25, 0.38), V(-0.25, 0.925, 0.15), V(-0.25, 1.23, 0.36), V(-0.25, 0.925, 0.15), 40, 39);
      break;
    case 'rigor':
      if (t < 49.5) mover(t, 47, 49.5, V(-0.25, 1.12, 0.50), V(-0.25, 0.975, 0.225), V(-0.25, 1.11, 0.48), V(-0.25, 0.975, 0.225), 40, 38);    // o cronômetro correndo até 12 h
      else if (t < 52) mover(t, 49.5, 52, V(15.5, 1.8, 3.2), V(9, -0.4, -3.8), V(13.6, 1.1, 1.6), V(9, -0.2, -3.6), 40, 40);             // a última mitocôndria apaga
      else mover(t, 52, 55, V(-0.25, 1.15, 0.26), V(-0.25, 0.93, 0.10), V(-0.25, 1.27, 0.40), V(-0.25, 0.925, 0.155), 38, 40);              // volta ao quadro 0
      break;
  }
  // sem tremor de câmera (pedido do dono, 26/11): só movimentos suaves
}

export function efeitos(t) {
  const pl = plano(t);
  let flash = 0;
  if (t > T_TIRO && t < T_TIRO + 0.25) flash = 1 - (t - T_TIRO) / 0.25;            // o tiro: clarão branco e corte
  if (Math.abs(t - 16) < 0.18) flash = Math.max(flash, 0.7 * (1 - Math.abs(t - 16) / 0.18));   // entrada no músculo
  for (const c of [39, 43, 49.5, 52]) if (Math.abs(t - c) < 0.1) flash = Math.max(flash, 0.35 * (1 - Math.abs(t - c) / 0.1));
  const corte = PLANOS.some(p => p.t0 > 0 && Math.abs(t - p.t0) < 0.12);
  return { flash, subs: corte ? 3 : 1 };
}
