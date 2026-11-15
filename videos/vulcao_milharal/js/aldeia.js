// O povoado (casas e igreja do kit, em volta da igreja) que a lava vai enterrando; as árvores e as peças ficam em y do terreno ORIGINAL (a lava sobe por cima).
import * as THREE from 'three';
import { Kit } from '../../biblioteca3d/cidade/kit.js';
import { mulberry32 } from './util.js';
import { detalharKit } from './detalhe.js';
import { criarIgreja } from './igreja.js';
import { IGREJA } from './terreno.js';

export async function construirAldeia(g, { alturaEm = () => 0 } = {}) {
  const kit = await Kit.carregar(new URL('../../biblioteca3d/cidade/', import.meta.url).href, { detalhe: false }), r = mulberry32(17), obj = [];
  const igreja = criarIgreja(); igreja.scale.setScalar(1.35); igreja.position.set(IGREJA.x, alturaEm(IGREJA.x, IGREJA.z), IGREJA.z); igreja.rotation.y = -Math.PI / 2; g.add(igreja); obj.push(igreja);   // fachada para a cratera (-x)
  const cores = { ParedeAmarela: ['#f0cf6a', '#f2a94a'], ParedeRosa: ['#e8909f', '#e2688a'], ParedeBranca: ['#f2ecdc', '#dfe9e0'], ParedeVermelha: ['#d85a45'], ParedeCinza: ['#8fc6c9'] };
  const casas = [['casa-simples', -34, -14], ['casa-colonial', -30, 12], ['casa-simples', -12, -32], ['casa-simples', -8, 28], ['casa-colonial', 16, -30], ['casa-simples', 20, 26], ['casa-simples', 38, -6], ['casa-simples', 36, 18], ['casa-colonial', -52, 0]];
  for (const [nome, dx, dz] of casas) {
    const o = await kit.peca(nome), x = IGREJA.x + dx, z = IGREJA.z + dz; o.position.set(x, alturaEm(x, z) - 0.1, z); o.rotation.y = Math.atan2(-dx, -dz) + Math.PI;           // porta para a praça
    o.scale.setScalar(0.85); const tom = r();
    o.traverse(m => { if (!m.isMesh) return; const era = Array.isArray(m.material), arr = era ? m.material : [m.material]; const novo = arr.map(k => { const op = cores[k.name]; if (!op) return k; const c = k.clone(); c.color.set(op[Math.floor(tom * op.length) % op.length]); return c; }); m.material = era ? novo : novo[0]; });
    kit.luzEstado(o, false); g.add(o); obj.push(o);
  }
  detalharKit(g);
  // pinheiros ao redor do povoado e do campo (peça do kit) e arbustos
  const pinhos = [];
  for (let i = 0; i < 70; i++) { const a = r() * 6.28, d = 60 + r() * 330, x = Math.cos(a) * d + (r() - 0.5) * 20, z = Math.sin(a) * d; if (Math.hypot(x - IGREJA.x, z - IGREJA.z) < 70) continue; const p = await kit.peca(r() < 0.75 ? 'arvore-pinheiro' : 'arvore-redonda'); p.position.set(x, alturaEm(x, z), z); p.scale.setScalar(0.9 + 0.8 * r()); p.rotation.y = r() * 6.28; g.add(p); pinhos.push(p); }
  return { kit, igreja, casas: obj, pinhos };
}
