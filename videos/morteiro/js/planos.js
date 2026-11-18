// LINHA DO TEMPO da animação "Morteiro 60 mm": a caixa de munição gira 360° e abre, a tampa de um tubo de fibra salta, a granada M49A2 sai sozinha,
// voa até o morteiro M2, desce pelo tubo (cauda primeiro), e o disparo: clarão, fumaça, poeira, recuo, a granada sobe e a câmera vai junto.
// Tudo é função do tempo absoluto t (s): qualquer quadro sai igual em qualquer ordem. Metros, y para cima.
import * as THREE from 'three';
import { scene, cam, renderer, lente, brilho, texFumaca, Rajada, sombras } from '../../trex_corrida/js/motor.js';
import { clamp, lerp, suave, suave5, inv, entra, sai, ruido } from '../../trex_corrida/js/util.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export const S = { planos: [], total: 0 };
const plano = (id, dur) => { S.planos.push({ id, t0: S.total, dur }); S.total += dur; };
plano('P1 caixa gira e abre', 4.5); plano('P2 a granada sai', 2.5); plano('P3 o voo', 2.9); plano('P4 entra no tubo', 1.3); plano('P5 disparo', 4.3);
const T = { gira: [0.2, 4.0], abre: [2.5, 4.4], tampaPula: 4.85, desliza: [5.0, 5.9], sobe: [5.9, 6.95], voo: [6.95, 9.4], paira: [9.4, 9.9], cai: [9.9, 10.3], tiro: 11.2, fim: 15.5 };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
let O = {};

const PH = '../biblioteca3d/polyhaven/';
function ceu() {          // cúpula com degradê: azul no alto, claro no horizonte (a HDRI fica só para a luz e os reflexos)
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: {},
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vP; void main(){ float h = clamp(vP.y, 0.0, 1.0); vec3 alto = vec3(0.16,0.36,0.70), meio = vec3(0.45,0.62,0.82), hor = vec3(0.77,0.81,0.82); vec3 c = mix(hor, meio, smoothstep(0.0, 0.25, h)); c = mix(c, alto, smoothstep(0.25, 0.9, h)); gl_FragColor = vec4(c, 1.0); }' });
  const d = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), m); d.frustumCulled = false; scene.add(d);
}
async function chao() {
  const tl = new THREE.TextureLoader(), d = PH + 'textura/dry_ground_rocks/dry_ground_rocks_';
  const ld = (f, srgb) => { const t = tl.load(d + f + '_2k.jpg'); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(240, 240); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const m = new THREE.MeshStandardMaterial({ map: ld('diff', true), normalMap: ld('nor_gl'), roughnessMap: ld('rough'), roughness: 1 });
  const g = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), m); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
  await new Promise(r => setTimeout(r, 50));
}
export async function construirTudo() {
  const hdr = await new RGBELoader().loadAsync(PH + 'hdri/mossy_forest_2k.hdr'); hdr.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(hdr).texture; scene.background = null; ceu();
  scene.environmentIntensity = 0.8; scene.fog = new THREE.Fog(0xc4cfd2, 15, 110);
  const sol = new THREE.DirectionalLight(0xfff0d8, 2.6); sol.position.set(4, 7, 3); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 20 }); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02; scene.add(sol); scene.add(sol.target);
  await chao();
  const gl = new GLTFLoader();
  // a caixa (tira as peças "de vitrine" que ficam fora dela)
  const cx = await gl.loadAsync('../biblioteca3d/objetos/caixa_morteiro/caixa_morteiro.glb');
  const caixa = cx.scene; scene.add(caixa); sombras(caixa);
  const no = n => caixa.getObjectByName(n);
  const granadaModelo = no('granada_saindo');
  for (const n of ['granada_chao1', 'granada_chao2', 'granada_em_pe', 'tubo_vazio', 'tampa_solta', 'tubo_aberto', 'granada_saindo']) { const o = no(n); if (o) o.parent.remove(o); }
  const raizCaixa = no('CaixaMorteiro60mm'), t0 = no('tubo10'), t1 = no('tubo11');
  const passo = t1.position.clone().sub(t0.position), tubos = [];
  for (let i = 2; i < 5; i++) { const c = t0.clone(true); c.position.copy(t0.position).addScaledVector(passo, i); raizCaixa.add(c); tubos.push(c); }
  const tuboG = tubos[1];                                           // o tubo de onde sai a granada (3º de cima: i = 3)
  const tampaTubo = tuboG.children.reduce((a, c) => (!a || c.position.y > a.position.y ? c : a), null);    // a tampa da ponta +x (eixo local y do cilindro)
  const tampa = no('tampa'); O.tampaAberta = tampa.quaternion.clone(); O.tampaFechada = new THREE.Quaternion();
  // a granada (eixo local +y, cauda na origem)
  const granada = granadaModelo; granada.position.set(0, 0, 0); granada.quaternion.identity(); scene.add(granada); sombras(granada);
  // o morteiro
  const mt = await gl.loadAsync('../biblioteca3d/objetos/morteiro_m2/morteiro_m2.glb');
  const mort = mt.scene; mort.position.set(1.45, 0, 0.2); scene.add(mort); sombras(mort); mort.updateMatrixWorld(true);
  const tuboM = mort.getObjectByName('Tubo'), boca = mort.getObjectByName('boca');
  const base = tuboM.getWorldPosition(V()), muzzle = boca.getWorldPosition(V()), eixo = muzzle.clone().sub(base).normalize();
  caixa.updateMatrixWorld(true);
  // fumaça, poeira, clarão
  const fum = new THREE.MeshBasicMaterial({ map: texFumaca(), transparent: true, depthWrite: false, color: 0xd9d4c8, opacity: 0.55 });
  const poe = new THREE.MeshBasicMaterial({ map: texFumaca(), transparent: true, depthWrite: false, color: 0xa08868, opacity: 0.8 });
  const pl = new THREE.PlaneGeometry(1, 1);
  const fumaca = new Rajada(scene, { n: 40, geo: pl, mat: fum, t0: T.tiro, vida: 3.5, semente: 3, origem: muzzle.toArray(), raio: 0.03, vel: [0.8, 3.5], dir: eixo.toArray(), abre: 0.5, grav: -0.25, arrasto: 1.6, tam: [0.12, 0.25], tam1: [0.6, 1.1], billboard: true, chao: -5, nasce: 0.12 });
  const poeira = new Rajada(scene, { n: 40, geo: pl, mat: poe, t0: T.tiro, vida: 2.6, semente: 5, origem: [base.x, 0.05, base.z], raio: 0.15, vel: [0.6, 1.8], dir: [0, 0.4, 0], abre: 2.2, grav: -0.1, arrasto: 1.8, tam: [0.1, 0.2], tam1: [0.4, 0.7], billboard: true, chao: -5, nasce: 0.05 });
  const faisca = new Rajada(scene, { n: 30, geo: new THREE.SphereGeometry(1, 6, 4), mat: new THREE.MeshBasicMaterial({ color: 0xffc070 }), t0: T.tiro, vida: 0.5, semente: 7, origem: muzzle.toArray(), raio: 0.02, vel: [4, 9], dir: eixo.toArray(), abre: 0.5, grav: 9.8, arrasto: 0.5, tam: [0.006, 0.012], chao: -5 });
  const clarao = brilho('255,214,150', 1.4, 1); clarao.position.copy(muzzle).addScaledVector(eixo, 0.1); scene.add(clarao);
  const luzTiro = new THREE.PointLight(0xffb060, 0, 6, 2); luzTiro.position.copy(clarao.position); scene.add(luzTiro);
  const rastro = []; for (let i = 0; i < 90; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFumaca(), transparent: true, depthWrite: false, color: 0xe8e4dc })); s.visible = false; scene.add(s); rastro.push(s); }
  O = { ...O, caixa: raizCaixa, tampa, tuboG, tampaTubo, tampaTubo0: tampaTubo.position.clone(), granada, mort, tuboM, tubo0: tuboM.position.clone(), base, muzzle, eixo, fumaca, poeira, faisca, clarao, luzTiro, rastro };
  // ponto de partida da granada: dentro do tubo escolhido, no mundo (com a caixa já de volta à rotação zero)
  O.saida = tuboG.getWorldPosition(V());
  return S;
}

// ------------------------------------------------------------------ a granada no tempo: posição e direção do nariz
const qDe = d => new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize());
function bezier(a, b, c, u) { return a.clone().multiplyScalar((1 - u) ** 2).addScaledVector(b, 2 * u * (1 - u)).addScaledVector(c, u * u); }
function granadaEm(t) {
  const X = V(1, 0, 0), s = O.saida, ini = s.clone().add(V(-0.13, 0, 0)), fora = s.clone().add(V(0.26, 0.02, 0));
  const alto = fora.clone().add(V(0.05, 0.62, 0)), paira = O.muzzle.clone().addScaledVector(O.eixo, 0.42), dentro = O.muzzle.clone().addScaledVector(O.eixo, -0.55);
  const ctrl = V((alto.x + paira.x) / 2 - 0.1, Math.max(alto.y, paira.y) + 0.7, (alto.z + paira.z) / 2 + 0.25);
  if (t < T.desliza[0]) return { p: ini, d: X, vis: true };
  if (t < T.desliza[1]) { const u = suave(inv(...T.desliza, t)); return { p: ini.clone().lerp(fora, u), d: X, vis: true }; }
  if (t < T.sobe[1]) { const u = suave(inv(...T.sobe, t)); const p = fora.clone().lerp(alto, u); p.x += Math.sin(u * Math.PI) * 0.06; return { p, d: X.clone().lerp(UP, suave(inv(0.1, 0.8, u))).normalize(), vis: true }; }
  if (t < T.voo[1]) {
    const u = suave(inv(...T.voo, t)), p = bezier(alto, ctrl, paira, u), tg = bezier(alto, ctrl, paira, Math.min(1, u + 0.02)).sub(bezier(alto, ctrl, paira, Math.max(0, u - 0.02))).normalize();
    const k1 = suave(inv(0, 0.18, u)), k2 = suave(inv(0.72, 1.0, u));
    let d = UP.clone().lerp(tg, k1).normalize(); d = d.lerp(O.eixo, k2).normalize();
    return { p, d, vis: true };
  }
  if (t < T.paira[1]) { const p = paira.clone(); p.y += Math.sin((t - T.paira[0]) * 9) * 0.01; return { p, d: O.eixo, vis: true }; }
  if (t < T.tiro) { const u = entra(inv(...T.cai, t)); return { p: paira.clone().lerp(dentro, u), d: O.eixo, vis: t < T.cai[1] + 0.05 }; }
  const tt = t - T.tiro, dist = tt < 0.05 ? -0.55 + tt * 11 : 0 + (tt - 0.05) * 7.5 + 2.2 * (tt - 0.05) ** 2;
  return { p: O.muzzle.clone().addScaledVector(O.eixo, dist), d: O.eixo, vis: true };
}

// ------------------------------------------------------------------ câmera por plano
const suav = (a, b, k) => a.clone().lerp(b, k);
function camera(t) {
  const g = granadaEm(t).p, caixaC = V(0, 0.12, 0), mz = O.muzzle;
  let pos, alvo, fov = 38, foco = null;
  if (t < 4.5) {                       // a caixa gira na frente da câmera; a câmera desce e chega perto quando a tampa abre
    const a = 0.25 - 0.25 * suave(inv(0, 4.5, t)), r = lerp(1.5, 1.0, suave(inv(0, 4.5, t)));
    pos = V(Math.sin(a) * r, lerp(0.5, 0.78, suave(inv(2.5, 4.5, t))), Math.cos(a) * r); alvo = V(0, lerp(0.16, 0.12, suave(inv(2.5, 4.5, t))), 0);
  } else if (t < 7.0) {                // a granada sai do tubo e sobe
    const k = suave(inv(4.5, 7.0, t));
    pos = V(lerp(0.25, 0.55, k), lerp(0.62, 0.95, k), lerp(0.85, 1.0, k)); alvo = suav(V(0.12, 0.2, -0.05), g, suave(inv(5.0, 6.2, t))); fov = 34;
  } else if (t < 9.9) {                // perseguição: a câmera vai ao lado da granada; no fim enquadra também o tubo
    const k = suave(inv(7.0, 9.9, t));
    pos = g.clone().add(V(lerp(-0.5, 0.45, k), lerp(0.05, -0.2, k), lerp(1.25, 1.75, k))); alvo = suav(g, g.clone().lerp(mz, 0.6), suave(inv(8.4, 9.6, t)));
    const ini = V(0.55, 0.95, 1.0); pos = suav(ini, pos, suave(inv(7.0, 7.6, t)));
  } else if (t < T.tiro) {             // a granada entra no tubo; empurrão lento
    const k = suave(inv(9.9, T.tiro, t));
    pos = V(lerp(2.35, 2.2, k), lerp(0.85, 0.72, k), lerp(1.45, 1.3, k)); alvo = suav(mz.clone().add(V(0, -0.1, 0)), V(1.45, 0.42, 0.18), suave(inv(10.3, 11.1, t)));
    pos = suav(camera._ult || pos, pos, suave(inv(9.9, 10.2, t)));
  } else {                              // o disparo: a câmera treme, olha para cima e sobe acompanhando a granada
    const tt = t - T.tiro, perto = V(2.2, 0.72, 1.3), olhaBoca = mz.clone().addScaledVector(O.eixo, 0.5);
    const chase = q => granadaEm(T.tiro + q).p.add(V(1.3, -0.8, 2.1));
    const gq = Math.min(tt, 3.6);
    const pc = chase(gq), ac = granadaEm(T.tiro + Math.min(tt, 4.3)).p;
    const k = suave(inv(0.7, 1.6, tt));
    pos = perto.clone().lerp(pc, k); alvo = suav(V(1.45, 0.42, 0.18).lerp(olhaBoca, suave(inv(0, 0.5, tt))), ac, suave(inv(0.6, 1.3, tt)));
    const tr = Math.exp(-5 * tt) * 0.04; pos.x += ruido(t * 40, 1) * tr; pos.y += ruido(t * 40, 2) * tr;
    fov = lerp(38, 34, suave(inv(1.0, 2.0, tt)));
  }
  if (t >= 9.6 && t < 9.9) camera._ult = pos.clone();
  cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(alvo); cam.fov = fov; cam.updateProjectionMatrix();
  const dist = cam.position.distanceTo(alvo);
  const fumacaNaTela = t >= T.tiro - 0.03;      // (o AO e o foco leem a profundidade das placas de fumaça e desenham quadrados: desligados no tiro)
  lente({ foco: dist, abertura: fumacaNaTela ? 0 : 0.0025, desfoque: 0.006, brilho: 0.4, limiar: 0.82, ao: fumacaNaTela ? 0 : 0.85 });
}

export function efeitos(t) {
  const tt = t - T.tiro;
  return { subs: (t > 6.9 && t < 9.5) || (tt > -0.1 && tt < 1.5) ? 3 : 1, flash: tt > 0 && tt < 0.1 ? 0.18 * (1 - tt / 0.1) : 0, fade: inv(T.fim - 0.5, T.fim, t) };
}

export function atualizar(t) {
  // caixa: gira 360° e abre a tampa
  O.caixa.rotation.y = Math.PI * 2 * suave5(inv(...T.gira, t));
  O.tampa.quaternion.copy(O.tampaFechada).slerp(O.tampaAberta, suave(inv(...T.abre, t)));
  // a tampa do tubo pula (sobe girando e cai do lado)
  const tp = t - T.tampaPula;
  if (tp < 0) { O.tampaTubo.position.copy(O.tampaTubo0); O.tampaTubo.rotation.set(0, 0, 0); }
  else { const tt = Math.min(tp, 0.62); O.tampaTubo.position.copy(O.tampaTubo0).add(V(0.15 * tt * 3, 1.6 * tt - 4.9 * tt * tt * 0.9 + 0, 0.25 * tt)); O.tampaTubo.rotation.set(tt * 9, 0, tt * 5); }
  // a granada
  const G = granadaEm(t); O.granada.visible = G.vis; O.granada.position.copy(G.p); O.granada.quaternion.copy(qDe(G.d));
  // recuo do tubo
  const tt = t - T.tiro, rec = tt > 0 ? 0.035 * Math.exp(-7 * tt) * Math.cos(18 * tt) : 0;
  O.tuboM.position.copy(O.tubo0).addScaledVector(O.eixo, -rec);
  // clarão, luz, partículas, rastro
  const fl = tt > 0 && tt < 0.18 ? 1 - tt / 0.18 : 0; O.clarao.visible = fl > 0; O.clarao.material.opacity = fl; O.clarao.scale.setScalar(0.6 + 1.6 * fl); O.luzTiro.intensity = 8 * fl;
  O.fumaca.atualizar(t, cam); O.poeira.atualizar(t, cam); O.faisca.atualizar(t, cam);
  O.rastro.forEach((s, i) => {
    const ts = T.tiro + 0.08 + i * 0.045, idade = t - ts;
    if (idade < 0) { s.visible = false; return; }
    s.visible = true; s.position.copy(granadaEm(ts).p); const k = clamp(idade / 3);
    s.scale.setScalar(0.18 + 1.1 * Math.sqrt(k)); s.material.opacity = 0.4 * (1 - k); s.position.y += idade * 0.15;
  });
  camera(t);
}
