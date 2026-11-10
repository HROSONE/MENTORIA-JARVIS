// Kit cidade — ajudante para montar cenas em Three.js (r160) com as peças de manifest.json.
//
//   import { Kit } from './kit.js';
//   const kit = await Kit.carregar();                       // lê manifest.json ao lado deste arquivo
//   scene.add(await kit.ladrilho('rua-cruzamento', 0, 0));  // ladrilho na grade (gx, gz), 12 m por casa
//   scene.add(await kit.ladrilho('rua-reta', 0, 1));        // sul do cruzamento
//   scene.add(await kit.prop('hidrante', 0, 1, 4.8, 2));    // prop na calçada (x,z locais do ladrilho)
//   kit.semaforoEstado(semaforo, 'vermelho');               // troca a luz ligada em tempo de execução
//
//   kit.luzEstado(poste, true);                             // acende a lâmpada de um poste de luz
//   for (const l of kit.luzesDe(poste)) { /* l.pos, l.cor, l.alcance: ponha um PointLight aqui em cenas noturnas */ }
//   scene.add(await kit.ladrilho('rotatoria', 2, 2));       // rotatória de 36 m: o centro cai no centro de um ladrilho (ocupa 3 x 3)
//
// Convenções: metros, Y para cima. Ladrilho de 12 x 12 m com a origem no centro; topo do asfalto em y = 0 e da calçada em y = 0,15.
// Girar um ladrilho 90° em Y leva a conexão S para E, depois N, depois W (sentido horário visto de cima).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const TILE = 12;
export const FAIXA = 3.5;            // largura de cada faixa (meia pista)
export const CALCADA = 0.15;         // altura do topo da calçada
export const CICLO = ['S', 'E', 'N', 'W'];
export const ESCALA_VEICULO = 1.7;   // veículos do Kenney (biblioteca3d/veiculos) nesta escala ficam em proporção com as ruas

export class Kit {
  constructor(base, manifest) {
    this.base = base;
    this.manifest = manifest;
    this.pecas = Object.fromEntries(manifest.pecas.map(p => [p.nome, p]));
    this.loader = new GLTFLoader();
    this.cache = new Map();
  }

  static async carregar(base = new URL('./', import.meta.url).href) {
    const manifest = await (await fetch(base + 'manifest.json')).json();
    return new Kit(base, manifest);
  }

  /** instância nova (clone) da peça `nome` */
  async peca(nome) {
    const p = this.pecas[nome];
    if (!p) throw new Error('peça desconhecida: ' + nome);
    if (!this.cache.has(nome)) this.cache.set(nome, this.loader.loadAsync(this.base + p.arquivo));
    const gltf = await this.cache.get(nome);
    const o = gltf.scene.clone(true);
    o.name = nome;
    const raiz = o.children[0];                       // nó raiz do .glb: seus `extras` (conexoes, luzes...) vão para o objeto
    if (raiz) Object.assign(o.userData, raiz.userData);
    o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    return o;
  }

  /** quantos quartos de volta (0..3) girar a peça para que suas conexões fiquem em `lados` (ex.: ['E','S']) */
  rotacaoPara(nome, lados) {
    const base = this.pecas[nome].conexoes.map(c => c.lado);
    const alvo = [...lados].sort().join('');
    for (let k = 0; k < 4; k++) {
      const girado = base.map(l => CICLO[(CICLO.indexOf(l) + k) % 4]).sort().join('');
      if (girado === alvo) return k;
    }
    throw new Error(`${nome} não tem a forma ${lados}`);
  }

  /** ladrilho da grade: (gx, gz) são casas de 12 m; `rot` em quartos de volta; ou `lados` para escolher pelas conexões */
  async ladrilho(nome, gx, gz, rot = 0, lados = null) {
    const o = await this.peca(nome);
    if (lados) rot = this.rotacaoPara(nome, lados);
    o.position.set(gx * TILE, 0, gz * TILE);
    o.rotation.y = rot * Math.PI / 2;
    o.userData.rot = rot;
    return o;
  }

  /** prop (placa, semáforo, hidrante) em coordenadas locais (x, z) de um ladrilho (gx, gz, rot); fica na calçada (y = 0,15) */
  async prop(nome, gx, gz, x, z, { rotY = 0, calcada = true, escala = 1, rot = 0, espelho = false } = {}) {
    const o = await this.peca(nome);
    const t = rot * Math.PI / 2, c = Math.cos(t), s = Math.sin(t);
    o.position.set(gx * TILE + x * c + z * s, calcada ? CALCADA : 0, gz * TILE - x * s + z * c);
    o.rotation.y = t + rotY;
    o.scale.set(escala * (espelho ? -1 : 1), escala, escala);   // espelho: braço do semáforo para o outro lado (as lentes continuam em +Z)
    return o;
  }

  /** posição/direção de um carro numa reta: `sentido` +1 anda para +Z local, -1 para -Z; `s` = metros ao longo do ladrilho (-6..6)
   *  mão direita: quem anda para +Z fica na faixa x = -1,75 */
  naPista(gx, gz, rot, sentido, s) {
    const t = rot * Math.PI / 2, lx = sentido > 0 ? -FAIXA / 2 : FAIXA / 2;
    return { x: gx * TILE + lx * Math.cos(t) + s * Math.sin(t), z: gz * TILE - lx * Math.sin(t) + s * Math.cos(t), ry: t + (sentido > 0 ? 0 : Math.PI) };
  }

  /** acende ou apaga a lâmpada de um poste de luz (nó `Luz`); funciona em qualquer poste-luz-*.glb */
  luzEstado(obj, ligada) {
    obj.traverse(m => {
      if (!m.isMesh || !/^Luz(_\d+)?$/.test(m.name)) return;
      if (!m.userData.matProprio) { m.material = m.material.clone(); m.userData.matProprio = true; }
      m.material.color.setHex(ligada ? 0xfff2cc : 0xcdd3d8);
      m.material.emissive.setHex(ligada ? 0xffd98a : 0x000000);
      m.material.emissiveIntensity = ligada ? 1.6 : 0;
    });
  }

  /** onde pôr luzes reais (PointLight/SpotLight) de um poste, em coordenadas do mundo: [{ pos: Vector3, dir, cor, alcance }] */
  luzesDe(obj) {
    obj.updateMatrixWorld(true);
    return (obj.userData.luzes || []).map(l => ({ pos: obj.localToWorld(new THREE.Vector3(...l.pos)), dir: l.dir, cor: l.cor, alcance: l.alcance }));
  }

  /** liga uma luz do semáforo ('vermelho' | 'amarelo' | 'verde' | 'apagado'); funciona em qualquer semaforo-*.glb */
  semaforoEstado(obj, estado) {
    const FORTE = { vermelho: 0xff2a22, amarelo: 0xffc61a, verde: 0x27e05a };
    const FRACA = { vermelho: 0x4b1311, amarelo: 0x4a3a0a, verde: 0x0d3a1b };
    obj.traverse(m => {
      if (!m.isMesh || !m.name.startsWith('Luz_')) return;
      const cor = m.name.slice(4).toLowerCase();
      if (!(cor in FORTE)) return;
      if (!m.userData.matProprio) { m.material = m.material.clone(); m.userData.matProprio = true; }
      const liga = cor === estado;
      m.material.color.setHex(liga ? FORTE[cor] : FRACA[cor]);
      m.material.emissive.setHex(liga ? FORTE[cor] : 0x000000);
      m.material.emissiveIntensity = liga ? 1.6 : 0;
    });
  }
}
