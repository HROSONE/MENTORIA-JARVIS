// Carregador Three.js do Ciber-Herói (esqueleto game_engine de 53 ossos + 10 dedos articulados)
// Já vem integrado à Biblioteca Universal de Animações Profissionais (117+ clipes CC0 + CMU)!
//
// Exemplo de uso:
//   import { carregarCiberHeroi } from './ciber_heroi.js';
//   const heroi = await carregarCiberHeroi();
//   scene.add(heroi.obj);
//   await heroi.tocar('CorrerSprint');
//   // no loop: heroi.atualizar(dt);

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { instalarAnimacoesUniversal } from '../../animacoes/universal.js';

const URL_PADRAO = new URL('./ciber_heroi.glb', import.meta.url).href;
const URL_JOGO = new URL('./ciber_heroi_jogo.glb', import.meta.url).href;

export async function carregarCiberHeroi({
  leve = false,
  url = leve ? URL_JOGO : URL_PADRAO,
  sombra = true,
  preCarregar = ['ParadoPro', 'AndarPro', 'CorrerSprint'],
} = {}) {
  const gltf = await new GLTFLoader().loadAsync(url);
  const obj = gltf.scene;
  obj.traverse(m => {
    if (m.isMesh) {
      m.castShadow = sombra;
      m.receiveShadow = true;
    }
  });
  const ator = { obj, gltf, clipes: [] };
  await instalarAnimacoesUniversal(ator, { preCarregar });
  return ator;
}
