// Poses do Short: soldado dormindo sentado, atirador e observador deitados, engolir comprimidos, cadetes relaxando, pessoa na cama.
import * as THREE from 'three';
import { S, V, PI, Q as Q_ } from './base.js';
import { clamp, lerp, suave, ruido } from './util.js';

export function respira(t, f = 0.28) { return Math.sin(t * 2 * PI * f); }

// soldado dormindo sentado no caixote, encostado nos sacos de areia (de frente para +Z): cabeça caída para o lado e um pouco para trás, boca entreaberta
export function dormirSentado(a, t, { x = 0, z = -1.14, y = 0.0, giro = 0, fundo = 1.0, lado = 1, cabeca = 1 } = {}) {
  a.grupo.visible = true; a.colocar(x, y, z, giro);
  a.anim('Parado', t * 0.2);
  a.sentar({ y: 0.60 + y, coxa: -1.46, canela: 1.55, tronco: -0.20 });
  const b = respira(t, 0.24), r = ruido(t * 0.4, 4);
  a.somar('Peito', -0.04 + 0.012 * b, 0, 0.02 * lado);
  a.somar('Pescoco', -0.06, 0.04 * lado, 0.10 * lado * cabeca);
  a.somar('Cabeca', -0.20 * cabeca + 0.012 * b, 0.12 * lado * cabeca, 0.26 * lado * cabeca + 0.02 * r);
  // braços pesados, mãos sobre as coxas
  const coxaE = a.pos('CoxaE', V()), coxaD = a.pos('CoxaD', V());
  const jo = a.grupo.localToWorld(V(0, 0, 0)); // origem do grupo no mundo
  a.ikBraco('E', V(coxaE.x + 0.06, coxaE.y + 0.04, coxaE.z + 0.30), V(0.5, -0.4, -1));
  a.ikBraco('D', V(coxaD.x - 0.06, coxaD.y + 0.04, coxaD.z + 0.30), V(-0.5, -0.4, -1));
  a.rosto({ expressao: 'neutro', forca: 0.2, piscar: 1.0, boca: 0.0 }); a.atualizarRosto();
}

// enquadra o rosto: câmera no eixo "para frente" da cabeça (acompanha qualquer pose), mirando o meio dos olhos
const _m = new THREE.Matrix4();
export function focoRosto(a, { dist = 0.45, lat = 0, alt = 0, alvoAlt = 0 } = {}) {
  a.grupo.updateMatrixWorld(true);
  const cab = a.ossos['Cabeca'];
  const e1 = a.pos('OlhoE', V()), e2 = a.pos('OlhoD', V());
  const mid = e1.clone().add(e2).multiplyScalar(0.5);
  _m.extractRotation(cab.matrixWorld);
  const fw = V(0, 0, 1).applyMatrix4(_m).normalize(), up = V(0, 1, 0).applyMatrix4(_m).normalize(), rt = V(1, 0, 0).applyMatrix4(_m).normalize();
  const pos = mid.clone().addScaledVector(fw, dist).addScaledVector(rt, lat).addScaledVector(up, alt);
  const alvo = mid.clone().addScaledVector(up, alvoAlt);
  return { pos: pos.toArray(), alvo: alvo.toArray(), fw, up, rt, mid };
}
// ------------------------------------------------------------------------------------------------ deitado na cama (de costas, cabeça no travesseiro, pés para +Z)
// k = { rosto, ombros, peito, pernas, mente } em 0..1 (0 = tenso, 1 = solto)
export function deitadoCama(a, t, k = {}, { cx = 100.2, zc = -0.74, y = 0.69, giro = 0 } = {}) {
  const f = (n) => clamp(k[n] ?? 0, 0, 1);
  a.grupo.visible = true; a.grupo.rotation.order = 'YXZ'; a.grupo.position.set(cx, y, zc); a.grupo.rotation.set(-PI / 2, giro, 0);
  a.anim('Parado', t * 0.15);
  const b = respira(t, 0.2 - 0.07 * f('peito')), am = 0.012 + 0.014 * f('peito');
  // pescoço/cabeça sobre o travesseiro; solta de lado com o relaxamento
  a.somar('Pescoco', 0.16, 0, 0); a.somar('Cabeca', 0.10 - 0.02 * f('rosto'), 0.10 * f('mente'), 0.06 * f('mente'));
  a.somar('Peito', am * b, 0, 0);
  // ombros: tensos (para cima) -> soltos (para baixo e para trás)
  for (const l of 'ED') { const sg = l === 'E' ? 1 : -1; a.somar('Ombro' + l, 0, 0, sg * (0.14 - 0.26 * f('ombros'))); }
  // pernas: rotação externa (pés abrem) e joelhos soltos
  a.somar('CoxaE', 0.0, 0.07 + 0.30 * f('pernas'), 0); a.somar('CoxaD', 0.0, -0.07 - 0.30 * f('pernas'), 0);
  a.somar('CanelaE', 0.02 * f('pernas'), 0, 0); a.somar('CanelaD', 0.02 * f('pernas'), 0, 0);
  // rosto: testa franzida -> lisa, olhos abertos -> fechados, mandíbula solta
  const tens = 1 - f('rosto');
  a.rosto({ expressao: tens > 0.05 ? 'triste' : 'neutro', forca: 0.34 * tens, olhar: [0, 0.35 * (1 - f('mente'))], piscar: clamp(f('rosto') * 1.7 - 0.1, 0, 1), boca: 0.0 }); a.atualizarRosto();
  // braços ao lado do corpo (IK até o colchão)
  a.grupo.updateMatrixWorld(true);
  const abre = 0.30 + 0.12 * f('ombros');
  for (const l of 'ED') { const sg = l === 'E' ? 1 : -1; const ombro = a.pos('Braco' + l, V()); a.ikBraco(l, V(cx + sg * (0.40 + 0.06 * f('ombros')), 0.62, ombro.z + 0.62), V(sg * 1, 0.2, 0.2)); }
}

// ------------------------------------------------------------------------------------------------ atirador e observador deitados de bruços atrás do parapeito
export const NINHO = { x: 150, z: 0, topo: 0.175 };
export const YAW_NINHO = Math.PI - 0.25;                                      // cabeça para -Z, um pouco para +X (rumo à janela da torre)
function deitarBarriga(a, x, z, yaw, { cabeca = 0.9, alt = 0.02, drop = 0 } = {}) {
  a.grupo.visible = true; a.grupo.rotation.order = 'YXZ';
  a.grupo.position.set(x, NINHO.topo + 0.135 + alt, z); a.grupo.rotation.set(PI / 2 - 0.085 * (1 - drop), yaw, 0);
  a.anim('Parado', 0);
  // coluna estendida para levantar o peito e a cabeça; pernas afastadas e esticadas para trás
  a.somar('Coluna', -0.14 * (1 - drop), 0, 0); a.somar('Peito', -0.14 * (1 - drop), 0, 0);
  a.somar('Pescoco', -0.26 * cabeca, 0, 0); a.somar('Cabeca', -0.30 * cabeca, 0, 0);
  a.somar('CoxaE', 0, 0.22, 0.03); a.somar('CoxaD', 0, -0.22, -0.03);
  a.somar('CanelaD', 0.10, 0, 0);
}
export const olhoMeio = a => a.pos('OlhoE', V()).add(a.pos('OlhoD', V())).multiplyScalar(0.5);
// apoia o fuzil com a luneta na posição do olho de referência e devolve onde ficam as mãos (empunhadura e guarda-mão)
function apoiarFuzil(fuzil, olhoRef, yawMira, elev) {
  fuzil.rotation.order = 'YXZ'; fuzil.rotation.set(-elev, yawMira, 0); fuzil.updateMatrixWorld(true);
  const loc = fuzil.userData.olho.clone().applyQuaternion(fuzil.quaternion);
  fuzil.position.copy(olhoRef).sub(loc); fuzil.updateMatrixWorld(true);
  return { m1: fuzil.localToWorld(fuzil.userData.mao1.clone()), m2: fuzil.localToWorld(fuzil.userData.mao2.clone()) };
}
// esfregar = 0..1 leva a mão esquerda ao olho; sono = 0..1 pálpebras pesadas; hit = 0..1 tombou
export function atiradorPose(a, fuzil, t, { x = 149.9, z = 0.2, esfregar = 0, sono = 0, hit = 0, cabeca = 1.9, alt = 0.02 } = {}) {
  deitarBarriga(a, x, z, YAW_NINHO, { cabeca, alt }); a.grupo.updateMatrixWorld(true);
  const ref = olhoMeio(a), { m1, m2 } = apoiarFuzil(fuzil, ref, YAW_NINHO, 0.17);
  fuzil.visible = true;
  if (hit > 0) { deitarBarriga(a, x, z, YAW_NINHO, { cabeca: cabeca * (1 - hit), alt: alt - 0.02 * hit, drop: hit }); a.somar('Pescoco', 0.55 * hit, 0.0, 0.12 * hit); a.somar('Cabeca', 0.45 * hit, 0, 0.10 * hit); fuzil.position.y -= 0.03 * hit; fuzil.rotation.x += 0.12 * hit; fuzil.updateMatrixWorld(true); }
  a.grupo.updateMatrixWorld(true);
  const b = respira(t, 0.3);
  a.somar('Peito', 0.01 * b * (1 - hit), 0, 0);
  const queda = V(0, -0.14 * hit, 0.12 * hit);
  let alvoE = m2.clone().add(queda);
  if (esfregar > 0) {
    const e = olhoMeio(a); const fw = V(0, 0, 1).applyQuaternion(a.ossos['Cabeca'].getWorldQuaternion(new THREE.Quaternion()));
    const maoOlho = e.clone().addScaledVector(fw, 0.045).add(V(0.02 * Math.sin(t * 17), 0.012 * Math.sin(t * 13), 0)).add(V(0.02, 0.0, 0.0));
    alvoE = alvoE.clone().lerp(maoOlho, esfregar);
  }
  a.ikBraco('D', m1.clone().add(queda), V(1, -0.6, 0.2)); a.ikBraco('E', alvoE, V(-0.8, -0.8, 0.2));
  const pisca = clamp(0.35 * sono + 0.65 * sono * (0.5 + 0.5 * Math.sin(t * 5.5)) + esfregar, 0, 1);
  a.rosto({ expressao: esfregar > 0.2 ? 'triste' : 'neutro', forca: 0.35 * esfregar + 0.2, olhar: [0, 0], piscar: hit > 0.3 ? 1 : pisca, boca: 0.0 }); a.atualizarRosto();
}
export function observadorPose(a, bino, t, { x = 151.1, z = 0.35, sono = 0, hit = 0 } = {}) {
  deitarBarriga(a, x, z, YAW_NINHO + 0.04, { cabeca: 1.8 * (1 - 0.6 * hit), alt: 0.02 - 0.02 * hit, drop: hit });
  if (hit > 0) { a.somar('Pescoco', 0.5 * hit, 0, -0.12 * hit); a.somar('Cabeca', 0.4 * hit, 0, -0.10 * hit); }
  a.grupo.updateMatrixWorld(true);
  const olho = olhoMeio(a);
  bino.visible = true; bino.rotation.order = 'YXZ'; bino.rotation.set(-0.14, YAW_NINHO + 0.04, 0); bino.updateMatrixWorld(true);
  const fr = V(0, 0, 1).applyQuaternion(bino.quaternion);
  bino.position.copy(olho).addScaledVector(fr, 0.07);
  bino.position.y -= 0.16 * hit; bino.position.z += 0.02 * hit; bino.rotation.x += 0.5 * hit;
  bino.updateMatrixWorld(true);
  a.ikBraco('E', bino.localToWorld(bino.userData.maoE.clone()), V(-1, -0.4, 0.3)); a.ikBraco('D', bino.localToWorld(bino.userData.maoD.clone()), V(1, -0.4, 0.3));
  a.rosto({ expressao: 'neutro', forca: 0.4, olhar: [0, 0], piscar: hit > 0.3 ? 1 : 0, boca: 0.0 }); a.atualizarRosto();
}

// ------------------------------------------------------------------------------------------------ mesa dos comprimidos (soldado de pé atrás da mesa, de frente para +Z)
export const MESA = { x: -150, z: 0, topo: 0.92 };
const _qq = new THREE.Quaternion();
const boca = a => a.ossos['Cabeca'].localToWorld(V(0, 0.012, 0.098));
// fase 'pegar' (u 0..1): mão direita alcança a lata e sobe com os comprimidos; fase 'engolir': comprimidos na boca, depois o cantil; fase 'alerta': mãos trêmulas na beira da mesa
export function mesaPose(a, t, { fase = 'alerta', u = 0, tremor = 0.4, props = null, x = MESA.x - 0.04, z = MESA.z - 0.64 } = {}) {
  a.grupo.visible = true; a.colocar(x, 0, z, 0);
  a.anim('Parado', t * 0.3);
  a.grupo.updateMatrixWorld(true);
  const tr = (f, ph, am) => am * Math.sin(t * f + ph);
  const lata = V(MESA.x - 0.16, MESA.topo + 0.04, MESA.z - 0.27);
  let maoD = null, maoE = null, pil = false, cantil = false, cabecaTras = 0, piscar = 0, expr = 'surpresa', forca = 0.25, boc = 0.0;
  if (fase === 'alerta') {
    maoD = V(MESA.x - 0.36 + tr(23, 1, 0.006 * tremor), MESA.topo + 0.04 + tr(31, 2, 0.004 * tremor), MESA.z - 0.34);
    maoE = V(MESA.x + 0.30 + tr(27, 3, 0.006 * tremor), MESA.topo + 0.04 + tr(29, 4, 0.004 * tremor), MESA.z - 0.34);
    a.somar('OmbroE', 0, 0, 0.10); a.somar('OmbroD', 0, 0, -0.10); a.somar('Cabeca', 0.02 + 0.015 * tr(9, 0, 1) * tremor, 0.02 * tr(5.3, 1, 1) * tremor, 0.02 * tr(7.1, 2, 1) * tremor);
    expr = 'neutro'; forca = 0.0; boc = 0.0; piscar = -0.28;
  } else if (fase === 'pegar') {
    const k = suave(u / 0.42), l = suave((u - 0.5) / 0.5);
    maoE = V(MESA.x + 0.30, MESA.topo + 0.04, MESA.z - 0.34);
    const alto = V(MESA.x - 0.10, MESA.topo + 0.34, MESA.z - 0.20);
    maoD = u < 0.5 ? lata.clone().lerp(V(lata.x, lata.y + 0.01, lata.z), 0).add(V(0, 0.12 * (1 - k), 0.0)) : lata.clone().lerp(alto, l);
    a.somar('Cabeca', 0.24 * suave(u), 0, 0); a.somar('Pescoco', 0.10 * suave(u), 0, 0);
    pil = u > 0.5; expr = 'neutro'; forca = 0.2; piscar = 0.0;
  } else if (fase === 'engolir') {
    const alto = V(MESA.x - 0.10, MESA.topo + 0.34, MESA.z - 0.20);
    const aoBoca = suave(u / 0.30), volta = suave((u - 0.34) / 0.12);
    const bc = boca(a);
    maoD = alto.clone().lerp(bc.clone().add(V(0.0, -0.02, 0.05)), aoBoca);
    if (u > 0.34) maoD = bc.clone().add(V(-0.02, -0.02, 0.06)).lerp(V(MESA.x - 0.30, MESA.topo + 0.20, MESA.z - 0.30), volta);
    pil = u < 0.34;
    const beber = suave((u - 0.46) / 0.14) * (1 - suave((u - 0.80) / 0.14));
    maoE = V(MESA.x + 0.30, MESA.topo + 0.04, MESA.z - 0.34).lerp(bc.clone().add(V(0.02, -0.03, 0.09)), beber);
    cantil = beber > 0.02; cabecaTras = beber;
    a.somar('Pescoco', -0.18 * beber, 0, 0); a.somar('Cabeca', -0.34 * beber, 0, 0);
    expr = 'neutro'; forca = 0.2; piscar = beber * 0.8; boc = 0.05 * aoBoca * (1 - volta) + 0.02 * beber;
  }
  a.grupo.updateMatrixWorld(true);
  if (maoD) a.ikBraco('D', maoD, V(1.0, -0.5, -0.1));
  if (maoE) a.ikBraco('E', maoE, V(-1.0, -0.5, -0.1));
  a.rosto({ expressao: expr, forca, olhar: [0.10 * tr(7.3, 0, 1) * tremor, 0.05 * tr(5.1, 1, 1) * tremor], piscar, boca: boc }); a.atualizarRosto();
  if (props) {
    props.pilulas.visible = pil; if (pil && maoD) { props.pilulas.position.copy(a.pos('MaoD', V())).add(V(0.0, 0.035, 0.03)); props.pilulas.updateMatrixWorld(true); }
    props.cantil.visible = cantil;
    if (cantil) { a.grupo.updateMatrixWorld(true); const mE = a.pos('MaoE', V()); props.cantil.position.copy(mE).add(V(0.0, 0.0, 0.03)); props.cantil.rotation.set(-1.15 - 0.3 * cabecaTras, 0, 0.1); }
  }
}

// ------------------------------------------------------------------------------------------------ cadete sentado na carteira (de frente para -Z), com relaxamento progressivo r = 0..1
export function sentarCarteira(a, c, t, { r = 0, giro = Math.PI, lado = 1 } = {}) {
  a.grupo.visible = true; a.colocar(c.x, 0, c.cz, giro);
  a.anim('Parado', t * 0.2);
  a.sentar({ y: 0.56, coxa: -1.46, canela: 1.55, tronco: -0.02 + 0.10 * r });
  const b = respira(t, 0.22 - 0.06 * r);
  a.somar('Peito', 0.02 * b, 0, 0);
  a.somar('OmbroE', 0, 0, (0.11 - 0.24 * r)); a.somar('OmbroD', 0, 0, -(0.11 - 0.24 * r));
  a.somar('Pescoco', 0.18 * r, 0, 0.06 * r * lado); a.somar('Cabeca', 0.30 * r, 0.04 * r * lado, 0.10 * r * lado);
  a.grupo.updateMatrixWorld(true);
  const sg = giro > 1.5 ? -1 : 1;
  a.ikBraco('E', V(c.x + sg * 0.17, 0.80, c.z + 0.02 - 0.05 * r), V(sg * 1, -0.4, 0.2)); a.ikBraco('D', V(c.x - sg * 0.17, 0.80, c.z + 0.02 - 0.05 * r), V(-sg * 1, -0.4, 0.2));
  const tens = 1 - r;
  a.rosto({ expressao: tens > 0.1 ? 'raiva' : 'neutro', forca: 0.22 * tens, olhar: [0.06 * Math.sin(t * 0.8) * tens, -0.10], piscar: clamp(r * 1.7 - 0.25, 0, 1), boca: 0.02 + 0.07 * r }); a.atualizarRosto();
}

// ------------------------------------------------------------------------------------------------ instrutor escrevendo no quadro
export function instrutorPose(a, t, giz, { x = 0.9, z = -5.18, mao = V(0.5, 1.9, -5.56), escrevendo = 1 } = {}) {
  a.grupo.visible = true; a.colocar(x, 0, z, Math.PI + 0.30);
  a.anim('Parado', t * 0.25);
  a.grupo.updateMatrixWorld(true);
  const w = escrevendo * 0.06;
  const alvo = mao.clone().add(V(w * Math.sin(t * 5.0), w * 0.6 * Math.sin(t * 6.3), 0));
  a.ikBraco('D', alvo, V(0.7, -0.5, 0.5));
  a.ikBraco('E', V(x - 0.30, 0.95, z + 0.12), V(-1, -0.4, 0.2));
  a.somar('Cabeca', 0.0, -0.45, 0); a.somar('Pescoco', 0.0, -0.20, 0);
  a.rosto({ expressao: 'neutro', forca: 0.2, olhar: [0.2, 0.1], piscar: 0, boca: 0.0 }); a.atualizarRosto();
  if (giz) { giz.visible = true; giz.position.copy(a.pos('MaoD', V())).add(V(0, 0, -0.02)); }
}

export function depurarPose(nome, t) {
  const a = S.soldado;
  if (nome === 'dormir') { dormirSentado(a, t); }
  if (nome === 'ninho') { atiradorPose(S.atirador, S.fuzil, t, { sono: +(Q_.get('sono') ?? 0), cabeca: +(Q_.get('cab') ?? 1.9), alt: +(Q_.get('alt') ?? 0.02) }); observadorPose(S.observador, S.binoculo, t); }
  if (nome === 'cama') { deitadoCama(S.pessoa, t, { rosto: +(Q_.get('rel') ?? 0), ombros: +(Q_.get('rel') ?? 0), peito: +(Q_.get('rel') ?? 0), pernas: +(Q_.get('rel') ?? 0), mente: +(Q_.get('rel') ?? 0) }); }
}
