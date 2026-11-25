// MOTO DO BLENDER no Three.js: carrega moto.glb (criar_moto.py) e devolve a mesma API do kit de veículos (rodar, esterco, luzes...),
// com os extras da moto: suspensao(rad), descanso(baixo) e pontos (Assento, PeE/PeD, MaoE/MaoD) para montar o piloto.
// Nós do GLB: Direcao (gira em volta da coluna), RodaDianteira/RodaTraseira (giram em X), Balanca (X no pivô), Descanso.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as K from '../kit/kit.js';

export const M = { L: 2.03, W: 0.72, H: 1.12, RF: 0.300, RT: 0.315 };
let _cache = null;
/** carrega o GLB uma vez (as motos criadas depois são cópias) */
export async function carregar(url) { if (!_cache) _cache = (await new GLTFLoader().loadAsync(url)).scene; return _cache; }

export function criar(cena, opc = {}) {
  const G = new THREE.Group(); G.name = 'moto-blender';
  const raiz = cena.clone(true); G.add(raiz);
  const no = n => raiz.getObjectByName(n);
  const dir = no('Direcao'), rd = no('RodaDianteira'), rt = no('RodaTraseira'), bal = no('Balanca'), desc = no('Descanso');
  G.updateMatrixWorld(true);
  // eixo local da direção que coincide com a coluna (24° para trás): o exportador pode trocar os eixos, então procura o que bate
  const coluna = new THREE.Vector3(0, Math.cos(24 * Math.PI / 180), -Math.sin(24 * Math.PI / 180));
  const qd = dir.getWorldQuaternion(new THREE.Quaternion());
  let eixoDir = null, melhor = -2;
  for (const e of [[1, 0, 0], [0, 1, 0], [0, 0, 1], [-1, 0, 0], [0, -1, 0], [0, 0, -1]].map(a => new THREE.Vector3(...a))) {
    const d = e.clone().applyQuaternion(qd).dot(coluna); if (d > melhor) { melhor = d; eixoDir = e; }
  }
  const q0 = { dir: dir.quaternion.clone(), rd: rd.quaternion.clone(), rt: rt.quaternion.clone(), bal: bal.quaternion.clone(), desc: desc.quaternion.clone() };
  const qx = (a) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), a);

  // luzes: materiais emissivos do GLB (cada moto com os seus)
  const luzes = { farol: [], freio: [], re: [], setaE: [], setaD: [], posicao: [] };
  raiz.traverse(m => {
    if (!m.isMesh) return;
    m.castShadow = true; m.receiveShadow = true;
    const nome = m.material?.name || '';
    if (/led_branco|lanterna_vermelha|pisca_ambar|tela_painel/.test(nome)) {
      m.material = m.material.clone(); const mt = m.material; mt.emissiveIntensity = 0;
      if (nome.includes('led_branco')) { luzes.farol.push(mt); luzes.posicao.push(mt); }
      else if (nome.includes('lanterna')) { luzes.freio.push(mt); luzes.posicao.push(mt); }
      else if (nome.includes('pisca')) { luzes.setaE.push(mt); luzes.setaD.push(mt); }
      else mt.emissiveIntensity = 0.8;                                    // painel sempre aceso
    }
  });
  if (opc.sombraChao !== false) { const sc = K.sombraChao(M.L * 0.9, 0.55); sc.name = 'sombraChao'; G.add(sc); }
  const pontos = { assento: no('Assento'), peE: no('PeE'), peD: no('PeD'), maoE: no('MaoE'), maoD: no('MaoD') };
  dir.attach(pontos.maoE); dir.attach(pontos.maoD);                     // as mãos acompanham o guidão
  return K.api(G, { L: M.L, W: M.W, H: M.H, R: M.RF, luzes, rodas: [], extra: {
    moto: true, pontos,
    rodar(metros, extraTras = 0) { rd.quaternion.copy(q0.rd).multiply(qx(metros / M.RF)); rt.quaternion.copy(q0.rt).multiply(qx(metros / M.RT + extraTras)); },
    esterco(rad) { dir.quaternion.copy(q0.dir).multiply(new THREE.Quaternion().setFromAxisAngle(eixoDir, THREE.MathUtils.clamp(rad, -0.6, 0.6))); },
    suspensao(rad) { bal.quaternion.copy(q0.bal).multiply(qx(rad)); },
    descanso(baixo) { desc.quaternion.copy(q0.desc); if (baixo) desc.quaternion.premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.15, 0, -0.35))); },
  } });
}
