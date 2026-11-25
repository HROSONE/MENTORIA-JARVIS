// OTIMIZAÇÕES DE DESEMPENHO (celular esquentando): junta as peças paradas dos veículos procedurais por material.
// Os veículos do kit são montados com centenas de malhas pequenas (cada uma = uma chamada de desenho). As que são filhas diretas
// do grupo raiz não se mexem (carroceria, para-choques, grades, adesivos...): juntá-las por material reduz centenas de chamadas
// para dezenas. As peças que se mexem (rodas, ferramentas, portas, lâmpadas que acendem com material próprio) ficam em
// subgrupos e não são tocadas; lâmpadas diretas com material próprio continuam separadas porque cada uma tem o seu material.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function mesclarEstaticos(raiz) {
  // cada grupo junta só os seus filhos diretos (as peças que giram/andam são grupos e continuam separadas)
  const grupos = []; raiz.traverse(o => { if (!o.isMesh && o.children.length) grupos.push(o); });
  let antes = 0, depois = 0;
  for (const g of grupos) { const r = mesclarFilhos(g); antes += r.antes; depois += r.depois; }
  return { antes, depois };
}

function mesclarFilhos(raiz) {
  raiz.updateMatrix(); raiz.updateMatrixWorld(true);
  const porMat = new Map();
  for (const m of [...raiz.children]) {
    if (!m.isMesh || m.isInstancedMesh || m.isSkinnedMesh || Array.isArray(m.material) || m.children.length || m.userData.dinamico || !m.visible) continue;
    if (m.material.transparent && m.material.opacity < 1 && m.renderOrder) continue;          // decalques com ordem própria
    const lista = porMat.get(m.material) || []; lista.push(m); porMat.set(m.material, lista);
  }
  let antes = 0, depois = 0;
  for (const [mat, lista] of porMat) {
    antes += lista.length;
    if (lista.length < 2) { depois += lista.length; continue; }
    const geos = [];
    for (const m of lista) {
      m.updateMatrix();
      let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      g.applyMatrix4(m.matrix);
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
      if (!g.attributes.normal) g.computeVertexNormals();
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      g.morphAttributes = {}; geos.push(g);
    }
    const junta = mergeGeometries(geos, false);
    geos.forEach(g => g.dispose());
    if (!junta) { depois += lista.length; continue; }
    const nova = new THREE.Mesh(junta, mat);
    nova.castShadow = lista.some(m => m.castShadow); nova.receiveShadow = lista.some(m => m.receiveShadow);
    nova.name = 'mesclado';
    for (const m of lista) raiz.remove(m);
    raiz.add(nova); depois += 1;
  }
  return { antes, depois };
}
