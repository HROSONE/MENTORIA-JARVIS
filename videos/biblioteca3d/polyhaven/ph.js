// Carrega assets CC0 do Poly Haven baixados por baixar.py: materiais PBR (texturaPH), modelos glTF (modeloPH) e céus HDRI (hdriPH).
//   import { materialPH, modeloPH, hdriPH } from '../biblioteca3d/polyhaven/ph.js';
//   const piso = materialPH('wood_floor_worn', { rep: [3, 3] });                 // MeshStandardMaterial com cor, normal, rugosidade e AO
//   const cama = await modeloPH('painted_wooden_nightstand');                     // THREE.Group (sombras ligadas), escala real em metros
//   const { fundo, ambiente } = await hdriPH('approaching_storm', renderer);      // fundo = equiretangular; ambiente = PMREM para reflexos
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const BASE = new URL('./', import.meta.url).href;
const tl = new THREE.TextureLoader(), cacheTex = new Map(), cacheMod = new Map();
function tex(url, srgb, rep, aniso = 8) {
  const k = url + rep.join(',');
  if (!cacheTex.has(k)) { const t = tl.load(url); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = aniso; if (srgb) t.colorSpace = THREE.SRGBColorSpace; cacheTex.set(k, t); }
  return cacheTex.get(k);
}
/** material PBR de uma textura baixada (res '2k' ou '1k'); rep = repetições [u, v]; extra = propriedades do material */
export function materialPH(id, { res = '2k', rep = [1, 1], ao = true, normal = 1, extra = {} } = {}) {
  const p = `${BASE}textura/${id}/${id}_`, s = `_${res}.jpg`;
  const m = new THREE.MeshStandardMaterial({ map: tex(p + 'diff' + s, true, rep), normalMap: tex(p + 'nor_gl' + s, false, rep), roughnessMap: tex(p + 'rough' + s, false, rep), roughness: 1, metalness: 0, ...extra });
  m.normalScale.set(normal, normal);
  m.userData.ph = { id, rep, res };                                   // (para exportar: o Blender refaz o material com a mesma textura)
  if (ao) { m.aoMap = tex(p + 'ao' + s, false, rep); m.aoMapIntensity = 0.8; }
  return m;
}
/** modelo glTF (clonado a cada chamada); sombras ligadas */
export async function modeloPH(id, { res = '1k', sombra = true, leve = false } = {}) {
  const url = leve ? `${BASE}modelo/${id}/${id}_leve.glb` : `${BASE}modelo/${id}/${id}_${res}.gltf`;            // leve: versão simplificada por decimar.py (para muitas cópias)
  if (!cacheMod.has(url)) cacheMod.set(url, new GLTFLoader().loadAsync(url));
  const g = (await cacheMod.get(url)).scene.clone(true);
  g.userData.ph = id;                                                     // (para exportar: o Blender usa o modelo original pelo id)
  g.traverse(o => { if (o.isMesh) { o.castShadow = sombra; o.receiveShadow = true; } });
  return g;
}
/** céu HDRI: fundo (textura equiretangular) e ambiente (PMREM) para iluminar/refletir */
export async function hdriPH(id, renderer, { res = '1k' } = {}) {
  const t = await new RGBELoader().loadAsync(`${BASE}hdri/${id}_${res}.hdr`);
  t.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer), amb = pm.fromEquirectangular(t).texture; pm.dispose();
  return { fundo: t, ambiente: amb };
}
