// CIDADE PEQUENA (kit da biblioteca): cruzamento de duas ruas, casas, a DELEGACIA com banco nos fundos, praça, postes. Serve à noite (voo até a delegacia,
// janelas e postes acesos) e de dia (o Lucas levanta um carro e vai para a escola). Ladrilhos de 12 m; norte = -z.
import * as THREE from 'three';
import { Kit, TILE } from '../../biblioteca3d/cidade/kit.js';
import { mulberry32 } from './util.js';

export async function construirCidade(pai, { origem = [0, 0, 0] } = {}) {
  const G = new THREE.Group(); G.name = 'cidade'; G.position.set(...origem); pai.add(G);
  const kit = await Kit.carregar(new URL('../../biblioteca3d/cidade/', import.meta.url).href, { detalhe: true });
  const acesos = [];
  const add = (o, luz = true) => { G.add(o); if (luz) acesos.push(o); return o; };
  const N = 4;
  for (let gx = -N; gx <= N; gx++) for (let gz = -N; gz <= N; gz++) {
    let nome = 'chao-grama', rot = 0;
    if (gx === 0 && gz === 0) nome = 'rua-cruzamento';
    else if (gx === 0) { nome = 'rua-reta'; rot = 0; }
    else if (gz === 0) { nome = 'rua-reta'; rot = 1; }
    else if (Math.abs(gx) === 1 || Math.abs(gz) === 1) nome = 'calcada-lisa';
    add(await kit.ladrilho(nome, gx, gz, rot), false);
  }
  const R = mulberry32(5), casas = ['casa-simples', 'casa-colonial', 'casa-sobrado', 'casa-moderna'];
  const predio = async (nome, x, z, rotY) => { const o = await kit.peca(nome); o.position.set(x, 0.15, z); o.rotation.y = rotY; return add(o); };
  // delegacia: ao norte do cruzamento, de frente para a rua (frente em +z), ocupando os ladrilhos gx 1..2
  const delegacia = await predio('delegacia', 1.5 * TILE, -1.08 * TILE, 0);
  // casas nas outras quadras, de frente para a rua mais próxima
  for (const [gx, gz] of [[-1, -1], [-2, -1], [-3, -1], [3, -1], [-1, 1], [-2, 1], [-3, 1], [1, 1], [2, 1], [3, 1]]) await predio(casas[Math.floor(R() * 4)], gx * TILE, gz * TILE + (gz < 0 ? -0.6 : 0.6), gz < 0 ? 0 : Math.PI);
  for (const [gx, gz] of [[-1, -2], [-1, -3], [1, 2], [1, 3], [-1, 2], [-1, 3], [1, -3]]) await predio(casas[Math.floor(R() * 4)], gx * TILE + (gx < 0 ? -0.6 : 0.6), gz * TILE, gx < 0 ? Math.PI / 2 : -Math.PI / 2);
  for (const [gx, gz] of [[-3, -3], [3, 3], [-3, 3], [2, -3], [3, -2]]) await predio('predio-loja-3', gx * TILE, gz * TILE, Math.floor(R() * 4) * Math.PI / 2);
  // árvores e postes
  for (let i = 0; i < 18; i++) { const o = await kit.peca(['arvore-redonda', 'arvore-frondosa', 'arvore-ipe-amarelo', 'arvore-palmeira'][i % 4]); const gx = (R() < 0.5 ? -1 : 1) * (2 + Math.floor(R() * 3)), gz = (R() < 0.5 ? -1 : 1) * (2 + Math.floor(R() * 3)); o.position.set(gx * TILE + (R() - 0.5) * 6, 0.15, gz * TILE + (R() - 0.5) * 6); o.rotation.y = R() * 6; G.add(o); }
  for (const s of [-3, -2, -1, 1, 2, 3]) {
    for (const [x, z, ry] of [[4.9, s * TILE, -Math.PI / 2], [s * TILE, 4.9, Math.PI]]) { const p = await kit.peca('poste-luz'); p.position.set(x, 0.15, z); p.rotation.y = ry; add(p); }
  }
  // fundos da delegacia: banco de cimento sob uma luz de parede
  const banco = await kit.peca('banco-praca'); banco.position.set(1.5 * TILE, 0.15, -1.08 * TILE - 7.6); banco.rotation.y = Math.PI; G.add(banco);
  const luzFundos = new THREE.PointLight(0xffc98a, 0, 12, 1.8); luzFundos.position.set(1.5 * TILE, 3.2, -1.08 * TILE - 6.6); G.add(luzFundos);
  // céu, lua e luzes
  const hemi = new THREE.HemisphereLight(0x6f86c4, 0x1a1410, 0.5), lua = new THREE.DirectionalLight(0xaabbff, 1.0); lua.position.set(-60, 80, 40); lua.target.position.set(0, 0, 0); lua.castShadow = true;
  lua.shadow.mapSize.set(2048, 2048); Object.assign(lua.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 260 }); lua.shadow.bias = -0.0005; G.add(hemi, lua, lua.target);
  const sol = new THREE.DirectionalLight(0xfff0d8, 0); sol.position.set(40, 70, 50); sol.target.position.set(0, 0, 0); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); Object.assign(sol.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 220 }); G.add(sol, sol.target);
  function noite(sim) {
    for (const o of acesos) kit.luzEstado(o, sim);
    hemi.intensity = sim ? 0.45 : 1.1; hemi.color.setHex(sim ? 0x6f86c4 : 0xcfe2ff); hemi.groundColor.setHex(sim ? 0x1a1410 : 0x6a5a48);
    lua.intensity = sim ? 0.9 : 0; sol.intensity = sim ? 0 : 3.0; luzFundos.intensity = sim ? 2.0 : 0;
    kit.ambiente(sim ? { ceuTopo: '#0b1430', ceuHorizonte: '#1c2b52' } : { ceuTopo: '#5f95d6', ceuHorizonte: '#cfe2f4', solDir: [0.4, 0.7, 0.5], solCor: '#fff2dc' });
  }
  return { g: G, kit, delegacia, banco, noite, luzFundos, sol, lua, origem: new THREE.Vector3(...origem) };
}
