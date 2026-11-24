// Construtor ultra-leve da Cidade Hryz para 60 FPS mesmo em PCs fracos / vídeo integrado:
// - Kit sem shaders offline de vídeo (detalhe: false)
// - Mesclagem de ~95% das malhas do kit (incluindo semáforos!) por setor de 110 m com vertexColors
// - Materiais MeshLambertMaterial em Leve/Médio (zero PBR/IBL por pixel) e MeshStandardMaterial no Alto
// - Separação de camada base vs props decorativos (cercas, móveis, carros estacionados) para modo Leve ultra-rápido
// - Culling exato por AABB de setor + matrixAutoUpdate = false + halos noturnos em 1 draw call (THREE.Points)
// - NPCs carregados em segundo plano sob demanda e animados apenas quando próximos do jogador
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Kit, TILE, CALCADA, ESCALA_VEICULO } from '../videos/biblioteca3d/cidade/kit.js';
import { Personagem } from '../videos/biblioteca3d/personagens/elenco/elenco.js';

const BASE_BIB = './videos/biblioteca3d';
const CHUNK_TAM = 110;

function aleatorio(semente) {
  let a = semente;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function criarHaloTextura() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,238,200,1)');
  r.addColorStop(0.25, 'rgba(255,217,138,0.55)');
  r.addColorStop(1, 'rgba(255,217,138,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const SOLIDOS = new Set([
  'casa-simples', 'casa-sobrado', 'casa-moderna', 'casa-colonial',
  'predio-comercial-10', 'predio-loja-3', 'predio-residencial-6', 'predio-residencial-12',
  'hospital', 'delegacia', 'supermercado', 'cinema',
  'terminal-aeroporto', 'torre-controle', 'hangar', 'estadio-futebol', 'muro',
]);

const SOMBRA_PRINCIPAL = new Set([
  'casa-simples', 'casa-sobrado', 'casa-moderna', 'casa-colonial',
  'predio-comercial-10', 'predio-loja-3', 'predio-residencial-6', 'predio-residencial-12',
  'hospital', 'delegacia', 'supermercado', 'cinema',
  'terminal-aeroporto', 'torre-controle', 'hangar', 'estadio-futebol',
]);

const SOMBRA_DETALHE = new Set([
  'arvore-redonda', 'arvore-frondosa', 'arvore-ipe-amarelo', 'arvore-ipe-rosa',
  'arvore-pinheiro', 'arvore-cipreste', 'arvore-palmeira',
  'poste-luz', 'poste-luz-duplo', 'poste-luz-pedestre', 'poste-rodovia',
  'muro', 'muro-portao', 'guarita',
]);

// Peças decorativas pesadas em triângulos que ficam ocultas no modo Leve (visíveis em Médio/Alto)
const PROPS_DECOR = new Set([
  'grade-ferro', 'cerca-madeira', 'cerca-madeira-portao',
  'banco-praca', 'mesa-redonda', 'mesa-piquenique', 'cadeira-plastica',
  'hidrante', 'hidrante-amarelo',
  'placa-velocidade-40', 'placa-proibido-estacionar', 'placa-pedestres', 'placa-pare',
]);

function nivelSombraPeca(nome) {
  if (SOMBRA_PRINCIPAL.has(nome)) return 'principal';
  if (SOMBRA_DETALHE.has(nome)) return 'detalhe';
  return 'nunca';
}

const SEM_FORTE = { vermelho: new THREE.Color(0xff2a22), amarelo: new THREE.Color(0xffc61a), verde: new THREE.Color(0x27e05a) };
const SEM_FRACA = { vermelho: new THREE.Color(0x4b1311), amarelo: new THREE.Color(0x4a3a0a), verde: new THREE.Color(0x0d3a1b) };

// Texturas procedurais leves (256x256, geradas 1x na inicialização): dão granulação e profundidade real com custo ~0 de FPS!
function criarTexturaPadrao(tipo) {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const rng = aleatorio(tipo === 'asfalto' ? 101 : (tipo === 'grama' ? 202 : 303));

  if (tipo === 'asfalto') {
    g.fillStyle = '#e8eaee';
    g.fillRect(0, 0, S, S);
    for (let i = 0; i < 4200; i++) {
      const v = 192 + Math.floor(rng() * 58);
      g.fillStyle = `rgb(${v},${v},${v + 2})`;
      const sz = rng() < 0.78 ? 2 : 3;
      g.fillRect(rng() * S, rng() * S, sz, sz);
    }
    // Faixas sutis de desgaste de pneu e micro-trincas leves
    g.strokeStyle = 'rgba(130,136,146,0.22)';
    g.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      let x = rng() * S, y = rng() * S;
      g.moveTo(x, y);
      for (let s = 0; s < 5; s++) { x += (rng() - 0.5) * 40; y += (rng() - 0.5) * 40; g.lineTo(x, y); }
      g.stroke();
    }
  } else if (tipo === 'grama') {
    g.fillStyle = '#edf3ea';
    g.fillRect(0, 0, S, S);
    for (let i = 0; i < 3200; i++) {
      const v = 212 + Math.floor(rng() * 40);
      g.fillStyle = `rgb(${v - 8},${v + 3},${v - 12})`;
      g.fillRect(rng() * S, rng() * S, 2 + rng() * 3, 2 + rng() * 3);
    }
  } else {
    // Superfície (calçada, concreto, reboco de paredes): granulação fina + juntas sutis
    g.fillStyle = '#f2f3f5';
    g.fillRect(0, 0, S, S);
    for (let i = 0; i < 2400; i++) {
      const v = 224 + Math.floor(rng() * 30);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(rng() * S, rng() * S, 2, 2);
    }
    g.strokeStyle = 'rgba(155,162,172,0.20)';
    g.lineWidth = 1;
    for (let p = 0; p < S; p += 64) {
      g.beginPath(); g.moveTo(p, 0); g.lineTo(p, S); g.stroke();
      g.beginPath(); g.moveTo(0, p); g.lineTo(S, p); g.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

// Prepara cópia não-indexada de `geo` com (position, normal, uv, color) em espaço de mundo
function prepararGeoMesclavel(srcGeo, worldMat, corOverride) {
  const g = srcGeo.index ? srcGeo.toNonIndexed() : srcGeo.clone();
  for (const attr of Object.keys(g.attributes)) {
    if (attr !== 'position' && attr !== 'normal' && attr !== 'color') g.deleteAttribute(attr);
  }
  g.applyMatrix4(worldMat);
  if (!g.attributes.normal) g.computeVertexNormals();

  const pos = g.attributes.position;
  const nrm = g.attributes.normal;
  const count = pos.count;
  const cr = corOverride ? corOverride.r : 1;
  const cg = corOverride ? corOverride.g : 1;
  const cb = corOverride ? corOverride.b : 1;

  // UVs planares em coordenadas de mundo (para texturas leves de asfalto/calçada/paredes)
  const uvs = new Float32Array(count * 2);
  const uvEsc = 0.22;
  for (let i = 0; i < count; i++) {
    const px = pos.getX(i), py = pos.getY(i), pz = pos.getZ(i);
    const ny = Math.abs(nrm.getY(i));
    if (ny > 0.65) {
      uvs[i * 2] = px * uvEsc;
      uvs[i * 2 + 1] = pz * uvEsc;
    } else {
      const nx = Math.abs(nrm.getX(i));
      uvs[i * 2] = (nx > 0.5 ? pz : px) * uvEsc;
      uvs[i * 2 + 1] = py * uvEsc;
    }
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

  const prevCor = g.attributes.color;
  const cores = new Float32Array(count * 3);
  if (prevCor) {
    for (let i = 0; i < count; i++) {
      cores[i * 3] = prevCor.getX(i) * cr;
      cores[i * 3 + 1] = prevCor.getY(i) * cg;
      cores[i * 3 + 2] = prevCor.getZ(i) * cb;
    }
  } else {
    for (let i = 0; i < count; i++) {
      cores[i * 3] = cr;
      cores[i * 3 + 1] = cg;
      cores[i * 3 + 2] = cb;
    }
  }
  g.setAttribute('color', new THREE.BufferAttribute(cores, 3));
  return g;
}

export const PONTOS_TELEPORTE = [
  { id: 'delegacia',  nome: 'Delegacia',     x: 146,   z: 166.2, ang: Math.PI / 2 },
  { id: 'praca',      nome: 'Praça Central', x: 216,   z: 166.2, ang: 0 },
  { id: 'rotatoria',  nome: 'Rotatória',     x: 252,   z: 222,   ang: Math.PI },
  { id: 'rodovia',    nome: 'Rodovia',       x: 17.75, z: 240,   ang: Math.PI },
  { id: 'aeroporto',  nome: 'Aeroporto',     x: 120,   z: 567,   ang: Math.PI / 2 },
  { id: 'estadio',    nome: 'Estádio',       x: 396,   z: 84,    ang: 0 },
  { id: 'condominio', nome: 'Jardim Hryz',   x: 246,   z: 312,   ang: Math.PI / 2 },
  { id: 'parque',     nome: 'Parque',        x: 336,   z: 166.2, ang: Math.PI },
];

const NPCS_DEFS = [
  { arq: 'homem',      acao: 'Andar',  cx: 18 * TILE, cz: 11 * TILE, raio: 12, fase: 0.0 },
  { arq: 'policial',   acao: 'Parado', x: 132.5, z: 163.5, ang: 0.2, estatico: true },
  { arq: 'mae',        acao: 'Andar',  cx: 18 * TILE, cz: 11 * TILE, raio: 15, fase: 2.1 },
  { arq: 'davi',       acao: 'Correr', cx: 18 * TILE, cz: 11 * TILE, raio: 10, fase: 4.0 },
  { arq: 'jovem_b',    acao: 'Andar',  cx: 18 * TILE, cz: 11 * TILE, raio: 19, fase: 1.1 },
  { arq: 'entregador', acao: 'Andar',  x: 17 * TILE, z: 14 * TILE + 4.8, ang: -Math.PI / 2, estatico: true },
  { arq: 'velha',      acao: 'Parado', x: 18 * TILE + 6, z: 11 * TILE + 7, ang: 2.8, estatico: true },
  { arq: 'lia',        acao: 'Parado', x: 15 * TILE - 10, z: 441 - 22, ang: Math.PI, estatico: true },
];

export async function construirCidade({
  scene,
  noiteInicial = false,
  qualidadeInicial = null,
  onProgresso = () => {},
}) {
  const kit = await Kit.carregar(undefined, { detalhe: false });
  const mundo = new THREE.Group();
  mundo.name = 'CidadeHryz';
  mundo.matrixAutoUpdate = false;
  mundo.updateMatrix();
  scene.add(mundo);

  const colisores = [];

  const texAsfalto = criarTexturaPadrao('asfalto');
  const texSuperficie = criarTexturaPadrao('superficie');
  const texGrama = criarTexturaPadrao('grama');
  texGrama.repeat.set(320, 320);

  // Materiais Lambert texturizados (5x mais rápidos por pixel em Leve/Médio) e PBR (Alto)
  const MAT_LAMBERT = {
    fosco:   new THREE.MeshLambertMaterial({ vertexColors: true, map: texSuperficie }),
    metal:   new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 65, specular: 0x556677 }),
    asfalto: new THREE.MeshLambertMaterial({ vertexColors: true, map: texAsfalto, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    luz:     new THREE.MeshLambertMaterial({ vertexColors: true }),
    vidro:   new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 90, specular: 0x7799bb }),
    semaforoLuz: new THREE.MeshBasicMaterial({ vertexColors: true }),
  };
  const MAT_PBR = {
    fosco:   new THREE.MeshStandardMaterial({ vertexColors: true, map: texSuperficie, roughness: 0.84, metalness: 0.04 }),
    metal:   new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.34, metalness: 0.62 }),
    asfalto: new THREE.MeshStandardMaterial({ vertexColors: true, map: texAsfalto, roughness: 0.88, metalness: 0.02, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    luz:     new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4,  metalness: 0.0 }),
    vidro:   new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.22, metalness: 0.25 }),
    semaforoLuz: new THREE.MeshBasicMaterial({ vertexColors: true }),
  };

  const matsLetreiro = new Set();
  let estadoNoite = noiteInicial;
  let estadoChuva = false;

  function aplicarEstadoLuzes(ligada) {
    estadoNoite = ligada;
    for (const M of [MAT_LAMBERT, MAT_PBR]) {
      M.luz.emissive.setHex(ligada ? 0xffd98a : 0x000000);
      M.luz.emissiveIntensity = ligada ? 1.5 : 0;
      M.vidro.emissive.setHex(ligada ? 0xffc866 : 0x000000);
      M.vidro.emissiveIntensity = ligada ? 1.15 : 0;
    }
    for (const mat of matsLetreiro) {
      mat.emissive.setHex(ligada ? 0xffffff : 0x000000);
      mat.emissiveIntensity = ligada ? 0.9 : 0;
    }
  }

  function alternarChuva(molhado) {
    estadoChuva = molhado;
    MAT_LAMBERT.asfalto.color.setHex(molhado ? 0x9aa4b0 : 0xffffff);
    MAT_PBR.asfalto.color.setHex(molhado ? 0xa6aeb8 : 0xffffff);
    MAT_PBR.asfalto.roughness = molhado ? 0.24 : 0.88;
  }

  // Chão base de grama texturizado (subdividido + polygonOffset positivo: zero z-fighting em GPUs mobile 16-bit!)
  const chaoMat = new THREE.MeshLambertMaterial({
    color: noiteInicial ? 0x2c4a2a : 0x6fa94c,
    map: texGrama,
    polygonOffset: true,
    polygonOffsetFactor: 2,
    polygonOffsetUnits: 2,
  });
  texGrama.repeat.set(140, 140);
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600, 32, 32), chaoMat);
  chao.rotation.x = -Math.PI / 2;
  chao.position.set(300, -0.18, 300);
  chao.receiveShadow = true;
  chao.matrixAutoUpdate = false;
  chao.updateMatrix();
  scene.add(chao);

  // ---- Carregador e cache de templates (cada GLB baixado 1 vez)
  const loader = new GLTFLoader();
  const templatePromises = new Map();
  const templates = new Map();

  function classificarSub(name, mat) {
    if (!mat || Array.isArray(mat) || mat.map || mat.transparent || mat.alphaMap) {
      if (mat && !Array.isArray(mat) && /^Letreiro(_\d+)?$/.test(name) && mat.map) {
        if (!mat.emissiveMap) { mat.emissiveMap = mat.map; mat.needsUpdate = true; }
        matsLetreiro.add(mat);
      }
      return null;
    }
    if (/^Luz(_\d+)?$/.test(name)) return 'luz';
    if (/^VidroLuz(_\d+)?$/.test(name)) return 'vidro';
    if (mat.name && /^Asfalto/.test(mat.name)) return 'asfalto';
    if ((mat.metalness ?? 0) > 0.35) return 'metal';
    return 'fosco';
  }

  function extrairTemplate(root) {
    root.updateMatrixWorld(true);
    const subs = [];
    root.traverse(m => {
      if (!m.isMesh || !m.geometry) return;
      const mat = m.material;
      const localMatrix = m.matrixWorld.clone();
      const detPos = localMatrix.determinant() > 0;
      const balde = detPos ? classificarSub(m.name || '', mat) : null;
      // Para peças texturizadas (Drummy / Kenney), prepara versão Lambert leve para modo Leve
      let matLeve = mat;
      if (!balde && mat && !Array.isArray(mat) && mat.isMeshStandardMaterial) {
        matLeve = new THREE.MeshLambertMaterial({
          color: mat.color ? mat.color.clone() : 0xffffff,
          map: mat.map || null,
          transparent: mat.transparent,
          opacity: mat.opacity,
          alphaTest: mat.alphaTest,
          side: mat.side,
        });
        if (mat.emissiveMap) {
          matLeve.emissiveMap = mat.emissiveMap;
          matsLetreiro.add(matLeve);
        }
      }
      subs.push({
        geometry: m.geometry,
        material: mat,
        matLeve,
        localMatrix,
        name: m.name || '',
        balde,
      });
    });
    const localBox = new THREE.Box3().setFromObject(root);
    const raiz = root.children[0];
    const luzes = (raiz && raiz.userData && raiz.userData.luzes) || root.userData.luzes || [];
    return { subs, localBox, luzes, scene: root };
  }

  function solicitarTemplateKit(nome) {
    const key = 'kit:' + nome;
    if (!templatePromises.has(key)) {
      const p = kit.pecas[nome];
      if (!p) throw new Error('peça desconhecida: ' + nome);
      const prom = kit.loader.loadAsync(kit.base + p.arquivo).then(gltf => {
        const tpl = extrairTemplate(gltf.scene);
        templates.set(key, tpl);
        return tpl;
      });
      templatePromises.set(key, prom);
    }
    return key;
  }

  function solicitarTemplateGlb(url) {
    const key = 'glb:' + url;
    if (!templatePromises.has(key)) {
      const prom = loader.loadAsync(url).then(gltf => {
        const tpl = extrairTemplate(gltf.scene);
        templates.set(key, tpl);
        return tpl;
      });
      templatePromises.set(key, prom);
    }
    return key;
  }

  const itensEstaticos = [];
  const avioesParados = [];
  const trafegoDefs = [];

  const R = aleatorio(2026);
  const escolha = l => l[Math.floor(R() * l.length)];

  function colocar(nome, x, z, ang = 0, y = CALCADA, {
    escala = 1,
    halo = false,
    colisor = SOLIDOS.has(nome),
    folga = nome === 'muro' ? 0.15 : 0.45,
    sombra = nivelSombraPeca(nome),
    decor = PROPS_DECOR.has(nome),
    semaforo = null,
  } = {}) {
    const key = solicitarTemplateKit(nome);
    itensEstaticos.push({ key, x, y, z, ang, escala, halo, colisor, folga, sombra, decor, semaforo, recebeSombra: true });
  }

  const OCUPADO = new Set();
  function ladrilho(nome, gx, gz, rot = 0, lados = null) {
    OCUPADO.add(gx + ',' + gz);
    // Troca gramados de 1.8k–3.2k triângulos por grama leve na camada base e mantém florido só como decor
    const ehFlor = (nome === 'gramado-flores' || nome === 'gramado-detalhado');
    const nomeBase = ehFlor ? 'chao-grama' : nome;
    const key = solicitarTemplateKit(nomeBase);
    if (lados) rot = kit.rotacaoPara(nomeBase, lados);
    itensEstaticos.push({
      key,
      x: gx * TILE, y: 0, z: gz * TILE,
      ang: rot * Math.PI / 2,
      escala: 1, halo: false, colisor: false, folga: 0,
      sombra: 'nunca', decor: false, semaforo: null, recebeSombra: true,
    });
  }

  function modelo(url, x, z, ang = 0, y = CALCADA, escala = 1, { colisor = false, sombra = 'detalhe', decor = false } = {}) {
    const key = solicitarTemplateGlb(url);
    itensEstaticos.push({
      key, x, y, z, ang, escala,
      halo: false, colisor, folga: 0.4, sombra, decor, semaforo: null, recebeSombra: true,
    });
  }

  // 3 tipos de carros estacionados decorativos (reduz 3x os InstancedMeshes)
  const CARROS_ESTAC = ['sedan', 'suv', 'taxi'];
  const CARROS_TRAF = ['sedan', 'sedan-sports', 'suv', 'taxi', 'van', 'delivery'];
  const PESADOS = ['truck', 'delivery', 'van'];
  const carro = (nome, x, z, ry, y = 0) =>
    modelo(`${BASE_BIB}/veiculos/${nome}.glb`, x, z, ry, y, ESCALA_VEICULO, { colisor: false, sombra: 'detalhe', decor: true });

  // ====================================================================================================
  // 1. Rede de Ruas
  // ====================================================================================================
  const k = (x, z) => x + ',' + z;
  const RUA = new Set();
  const VX = [3, 9, 15, 21, 27, 33], HZ = [2, 8, 14, 20, 26, 32];
  for (const gx of VX) for (let gz = 2; gz <= 32; gz++) RUA.add(k(gx, gz));
  for (const gz of HZ) for (let gx = 3; gx <= 33; gx++) RUA.add(k(gx, gz));
  for (let gx = 28; gx <= 32; gx++) RUA.delete(k(gx, 8));
  for (let gx = 34; gx <= 47; gx++) RUA.add(k(gx, 2));
  RUA.add(k(3, 33));
  for (let gx = 3; gx <= 25; gx++) RUA.add(k(gx, 34));
  const ROT = [21, 20];
  const naRot = (gx, gz) => Math.abs(gx - ROT[0]) <= 1 && Math.abs(gz - ROT[1]) <= 1;
  for (const c of [...RUA]) { const [x, z] = c.split(',').map(Number); if (naRot(x, z)) RUA.delete(c); }
  const BLOQUEIO = new Set([k(26, 26) + '|' + k(27, 26)]);
  const SAIDAS = new Set([k(3, 8) + 'W', k(3, 34) + 'W']);
  const DIR = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

  function liga(gx, gz, d) {
    const [dx, dz] = DIR[d], nx = gx + dx, nz = gz + dz;
    if (BLOQUEIO.has(k(gx, gz) + '|' + k(nx, nz)) || BLOQUEIO.has(k(nx, nz) + '|' + k(gx, gz))) return false;
    if (SAIDAS.has(k(gx, gz) + d)) return true;
    if (RUA.has(k(nx, nz))) return true;
    return naRot(nx, nz) && (nx === ROT[0] || nz === ROT[1]);
  }

  const TIPO = {};
  for (const c of RUA) {
    const [gx, gz] = c.split(',').map(Number);
    const l = ['N', 'S', 'E', 'W'].filter(d => liga(gx, gz, d));
    let nome;
    if (l.length === 4) nome = 'rua-cruzamento';
    else if (l.length === 3) nome = 'rua-t';
    else if (l.length === 2) nome = (l.includes('N') && l.includes('S')) || (l.includes('E') && l.includes('W')) ? 'rua-reta' : 'rua-curva';
    else if (l.length === 1) nome = 'rua-fim';
    else continue;
    TIPO[c] = { nome, l };
    ladrilho(nome, gx, gz, 0, nome === 'rua-cruzamento' ? null : l);
  }
  ladrilho('rotatoria', ROT[0], ROT[1]);
  colocar('poste-luz-duplo', ROT[0] * TILE, ROT[1] * TILE, Math.PI / 2, CALCADA, { halo: true });
  colocar('arvore-palmeira', ROT[0] * TILE + 2.2, ROT[1] * TILE + 1.5, 0.4);
  colocar('arvore-palmeira', ROT[0] * TILE - 2.0, ROT[1] * TILE - 1.8, 1.9);

  for (const [c, t] of Object.entries(TIPO)) {
    const [gx, gz] = c.split(',').map(Number);
    if (t.nome === 'rua-reta' && (gx + gz) % 2 === 0) {
      const lado = (gx + gz) % 4 === 0 ? 1 : -1;
      if (t.l.includes('N')) colocar('poste-luz', gx * TILE + 4.85 * lado, gz * TILE, lado > 0 ? -Math.PI / 2 : Math.PI / 2, CALCADA, { halo: true });
      else colocar('poste-luz', gx * TILE, gz * TILE + 4.85 * lado, lado > 0 ? Math.PI : 0, CALCADA, { halo: true });
    }
    if (t.nome === 'rua-cruzamento' && gx >= 9 && gx <= 27 && gz >= 8 && gz <= 20) {
      const ns = (gx + gz) % 2 ? 'vermelho' : 'verde', lo = ns === 'verde' ? 'vermelho' : 'verde';
      for (const [x, z, a, e] of [[4.7, 4.7, 0, ns], [-4.7, -4.7, Math.PI, ns], [-4.7, 4.7, -Math.PI / 2, lo], [4.7, -4.7, Math.PI / 2, lo]]) {
        // Semáforo entra direto na mesclagem do setor (0 draw calls extras!)
        colocar('semaforo-apagado', gx * TILE + x, gz * TILE + z, a, CALCADA, { colisor: false, sombra: 'nunca', semaforo: e });
      }
    }
    if (t.nome === 'rua-t' && R() < 0.5) {
      colocar('placa-pare', gx * TILE - 4.8, gz * TILE + 4.7, -Math.PI / 2, CALCADA, { colisor: false });
    }
  }
  for (const [c, t] of Object.entries(TIPO)) {
    const [gx, gz] = c.split(',').map(Number);
    if (t.nome !== 'rua-reta' || R() > 0.16) continue;
    const vert = t.l.includes('N'), s = R() < 0.5 ? 1 : -1;
    const nome = escolha(['hidrante', 'hidrante-amarelo', 'placa-velocidade-40', 'placa-proibido-estacionar', 'placa-pedestres']);
    colocar(nome, gx * TILE + (vert ? 4.8 * s : 2.5), gz * TILE + (vert ? 2.5 : 4.8 * s), vert ? (s > 0 ? -Math.PI / 2 : Math.PI / 2) : (s > 0 ? Math.PI : 0));
  }
  colocar('placa-rua-hryz', 9 * TILE + 4.8, 14 * TILE + 4.8, Math.PI / 4);

  // Carros estacionados (camada decorativa)
  for (const [c, t] of Object.entries(TIPO)) {
    const [gx, gz] = c.split(',').map(Number);
    if (t.nome !== 'rua-reta' || gz === 14 || R() > 0.14) continue;
    const vert = t.l.includes('N'), sentido = R() < 0.5 ? 1 : -1;
    const p = kit.naPista(gx, gz, vert ? 0 : 1, sentido, (R() - 0.5) * 6);
    carro(escolha(CARROS_ESTAC), p.x, p.z, p.ry);
  }

  // ====================================================================================================
  // 2. Quadras
  // ====================================================================================================
  const quadra = (c, r) => ({ x0: 4 + 6 * c, x1: 8 + 6 * c, z0: 3 + 6 * r, z1: 7 + 6 * r });
  const livre = (gx, gz) => !RUA.has(k(gx, gz)) && !naRot(gx, gz);
  const PISOS = [];
  function piso(gx0, gx1, gz0, gz1, nome) {
    for (let gx = gx0; gx <= gx1; gx++) for (let gz = gz0; gz <= gz1; gz++) if (livre(gx, gz)) PISOS.push([nome, gx, gz]);
  }
  const ARVORES = ['arvore-redonda', 'arvore-ipe-amarelo', 'arvore-ipe-rosa', 'arvore-pinheiro', 'arvore-cipreste'];
  const arvore = (x, z, esc = 0.85 + R() * 0.3) => colocar(escolha(ARVORES), x, z, R() * 6.28, CALCADA, { escala: esc, colisor: false });
  const CASAS_KIT = ['casa-simples', 'casa-sobrado', 'casa-moderna', 'casa-colonial'];
  const CERCAS = ['cerca-madeira-portao', 'muro-portao', 'grade-ferro', 'cerca-madeira'];
  // 3 modelos variados de casas Drummy (menos download e 5x menos InstancedMeshes!)
  const CASAS_DRUMMY = ['casa2-a', 'casa3-b', 'casa5-c'];
  const casaDrummy = () => `${BASE_BIB}/casas/${escolha(CASAS_DRUMMY)}.glb`;

  function bairro(c, r, estilo) {
    const q = quadra(c, r);
    piso(q.x0, q.x1, q.z0, q.z1, 'chao-grama');
    const lotes = [];
    for (let gx = q.x0; gx <= q.x1; gx++) { lotes.push([gx, q.z0, Math.PI]); lotes.push([gx, q.z1, 0]); }
    for (let gz = q.z0 + 1; gz < q.z1; gz++) { lotes.push([q.x0, gz, -Math.PI / 2]); lotes.push([q.x1, gz, Math.PI / 2]); }
    for (const [gx, gz, ang] of lotes) {
      if (!livre(gx, gz)) continue;
      const x = gx * TILE, z = gz * TILE, fx = Math.sin(ang), fz = Math.cos(ang);
      const drummy = estilo === 'drummy' || (estilo === 'misto' && R() < 0.5);
      if (drummy) modelo(casaDrummy(), x, z, ang, CALCADA, 1, { colisor: true, sombra: 'principal', decor: false });
      else {
        colocar(escolha(CASAS_KIT), x, z, ang);
        colocar(escolha(CERCAS), x + fx * 5.85, z + fz * 5.85, ang, CALCADA, { colisor: false, decor: true });
      }
      if (R() < 0.45) arvore(x - fz * 4.6 + fx * 4.2, z + fx * 4.6 + fz * 4.2, 0.7 + R() * 0.2);
    }
    for (let gx = q.x0 + 1; gx < q.x1; gx++) for (let gz = q.z0 + 1; gz < q.z1; gz++) {
      if (!livre(gx, gz)) continue;
      if (R() < 0.65) arvore(gx * TILE + (R() - 0.5) * 8, gz * TILE + (R() - 0.5) * 8);
    }
  }

  function muro(gx0, gx1, gz0, gz1, portao = null, pular = []) {
    const ix = 0.4;
    for (let gx = gx0; gx <= gx1; gx++) {
      for (const [gz, z, ang] of [[gz0, (gz0 - 0.5) * TILE + ix, Math.PI], [gz1, (gz1 + 0.5) * TILE - ix, 0]]) {
        if (pular.includes(k(gx, gz))) continue;
        const ehPortao = portao === k(gx, gz) + (ang ? 'N' : 'S');
        colocar(ehPortao ? 'muro-portao' : 'muro', gx * TILE, z, ang, CALCADA, { colisor: !ehPortao });
      }
    }
    for (let gz = gz0; gz <= gz1; gz++) {
      for (const [gx, x, ang] of [[gx0, (gx0 - 0.5) * TILE + ix, -Math.PI / 2], [gx1, (gx1 + 0.5) * TILE - ix, Math.PI / 2]]) {
        if (pular.includes(k(gx, gz))) continue;
        const ehPortao = portao === k(gx, gz) + (ang < 0 ? 'W' : 'E');
        colocar(ehPortao ? 'muro-portao' : 'muro', x, gz * TILE, ang, CALCADA, { colisor: !ehPortao });
      }
    }
  }

  bairro(0, 0, 'kit'); bairro(1, 0, 'drummy'); bairro(0, 1, 'misto'); bairro(0, 3, 'kit'); bairro(1, 3, 'drummy');
  bairro(0, 4, 'drummy'); bairro(1, 4, 'kit'); bairro(4, 2, 'misto'); bairro(4, 3, 'kit'); bairro(4, 4, 'drummy');

  // Centro: hospital e delegacia (quadra 1,1)
  {
    const q = quadra(1, 1);
    piso(q.x0, q.x1, q.z0, q.z1, 'calcada-lisa');
    colocar('hospital', 12 * 12, 12 * 9.5, Math.PI);
    colocar('delegacia', 12 * 11.5, 12 * 13, 0);
    colocar('predio-loja-3', 12 * 10, 12 * 13, 0);
    colocar('predio-loja-3', 12 * 13.5 + 6, 12 * 13, 0);
    for (const gx of [10, 14]) ladrilho('estacionamento', gx, 11, 0);
  }
  // Praça central (quadra 2,1)
  {
    const q = quadra(2, 1);
    for (let gx = q.x0; gx <= q.x1; gx++) for (let gz = q.z0; gz <= q.z1; gz++) {
      ladrilho((gx + gz) % 2 ? 'calcada-lisa' : (gx === 18 && gz === 11 ? 'calcada-cruzamento' : 'gramado-flores'), gx, gz);
    }
    const cx = 18 * TILE, cz = 11 * TILE;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; colocar('arvore-palmeira', cx + Math.cos(a) * 16, cz + Math.sin(a) * 16, a); }
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.3; colocar('banco-praca', cx + Math.cos(a) * 9, cz + Math.sin(a) * 9, -a + Math.PI / 2); }
    for (const [dx, dz] of [[-22, -22], [22, -22], [-22, 22], [22, 22]]) {
      colocar('mesa-redonda', cx + dx, cz + dz, 0);
      for (let c = 0; c < 4; c++) { const a = c * Math.PI / 2 + 0.4; colocar('cadeira-plastica', cx + dx + Math.sin(a) * 0.72, cz + dz + Math.cos(a) * 0.72, a + Math.PI); }
    }
    for (const [dx, dz] of [[-12, -12], [12, -12], [-12, 12], [12, 12], [0, -24], [0, 24], [-24, 0], [24, 0]]) {
      colocar('poste-luz-pedestre', cx + dx, cz + dz, 0, CALCADA, { halo: true });
    }
    colocar('arvore-ipe-amarelo', cx - 26, cz - 4, 0.3);
    colocar('arvore-ipe-rosa', cx + 26, cz + 4, 1.2);
  }
  // Torres comerciais (quadra 3,1)
  {
    const q = quadra(3, 1);
    piso(q.x0, q.x1, q.z0, q.z1, 'calcada-lisa');
    colocar('predio-comercial-10', 12 * 22.5 + 6, 12 * 9, Math.PI);
    colocar('predio-comercial-10', 12 * 25 + 6, 12 * 9, Math.PI);
    colocar('predio-residencial-12', 12 * 22, 12 * 13, 0);
    colocar('predio-comercial-10', 12 * 23.5 + 6, 12 * 13, 0);
    colocar('predio-residencial-12', 12 * 26, 12 * 13, 0);
    for (let gz = 10; gz <= 12; gz++) for (let gx = 22; gx <= 26; gx += 2) arvore(gx * TILE, gz * TILE, 0.7);
  }
  // Supermercado (quadra 2,0)
  {
    const q = quadra(2, 0);
    piso(q.x0, q.x1, q.z0, q.z1, 'calcada-lisa');
    colocar('supermercado', 12 * 18, 12 * 3.5, Math.PI);
    for (let gx = q.x0; gx <= q.x1; gx++) for (const gz of [6, 7]) {
      ladrilho('estacionamento', gx, gz, gz === 6 ? 2 : 0);
      for (const bx of [-4.5, -1.5, 1.5, 4.5]) if (R() < 0.4) carro(escolha(CARROS_ESTAC), gx * TILE + bx, gz * TILE + (gz === 6 ? 3.5 : -3.5), gz === 6 ? 0 : Math.PI, CALCADA);
    }
  }
  // Prédios residenciais (quadra 3,0)
  {
    const q = quadra(3, 0);
    piso(q.x0, q.x1, q.z0, q.z1, 'chao-grama');
    for (const [gx, gz, a, n] of [[22, 3, Math.PI, 6], [24, 3, Math.PI, 12], [26, 3, Math.PI, 6], [22, 7, 0, 12], [24, 7, 0, 6], [26, 7, 0, 12]]) {
      colocar(`predio-residencial-${n}`, gx * TILE, gz * TILE, a);
    }
    for (let gx = 22; gx <= 26; gx++) arvore(gx * TILE, 5 * TILE);
  }
  // Cinema e lojas (quadra 1,2)
  {
    const q = quadra(1, 2);
    piso(q.x0, q.x1, q.z0, q.z1, 'calcada-lisa');
    colocar('cinema', 12 * 12, 12 * 15.5, Math.PI);
    for (const gx of [10, 14]) colocar('predio-loja-3', gx * TILE, 12 * 15, Math.PI);
    for (const gx of [10, 12, 14]) colocar(gx === 12 ? 'predio-residencial-6' : 'predio-loja-3', gx * TILE, 12 * 19, 0);
    for (const gx of [11, 13]) arvore(gx * TILE, 12 * 17.5, 0.75);
  }
  // Comércio e moradia
  for (const [c, r] of [[2, 2], [2, 3], [2, 4], [3, 2]]) {
    const q = quadra(c, r);
    piso(q.x0, q.x1, q.z0, q.z1, 'calcada-lisa');
    for (let gx = q.x0; gx <= q.x1; gx += 2) {
      if (livre(gx, q.z0)) colocar(escolha(['predio-loja-3', 'predio-residencial-6', 'predio-residencial-6']), gx * TILE, q.z0 * TILE, Math.PI);
      if (livre(gx, q.z1)) colocar(escolha(['predio-loja-3', 'predio-residencial-6', 'predio-residencial-12']), gx * TILE, q.z1 * TILE, 0);
    }
    for (let gz = q.z0 + 1; gz < q.z1; gz++) for (let gx = q.x0; gx <= q.x1; gx++) {
      if (!livre(gx, gz)) continue;
      if (gz === q.z0 + 2) {
        ladrilho('estacionamento', gx, gz, 0);
        if (R() < 0.4) carro(escolha(CARROS_ESTAC), gx * TILE + escolha([-4.5, -1.5, 1.5, 4.5]), gz * TILE - 3.5, Math.PI, CALCADA);
      } else if (R() < 0.35) arvore(gx * TILE, gz * TILE, 0.7);
    }
  }
  // Condomínio de prédios (quadra 0,2)
  {
    const q = quadra(0, 2);
    piso(q.x0, q.x1, q.z0, q.z1, 'gramado-detalhado');
    for (const [gx, gz, a] of [[4, 15, Math.PI], [8, 15, Math.PI], [4, 19, 0], [8, 19, 0]]) colocar('predio-residencial-12', gx * TILE, gz * TILE, a);
    colocar('predio-residencial-6', 6 * TILE, 15 * TILE, Math.PI);
    colocar('piscina', 6 * TILE, 17 * TILE, 0);
    for (const [x, z] of [[5, 16], [7, 16], [5, 18.2], [7, 18.2]]) colocar('arvore-palmeira', x * TILE, z * TILE, R() * 6);
    colocar('banco-praca', 6 * TILE - 5, 18.2 * TILE, 0); colocar('banco-praca', 6 * TILE + 5, 18.2 * TILE, 0);
    muro(q.x0, q.x1, q.z0, q.z1, k(6, 19) + 'S');
  }
  // Condomínio Jardim Hryz (quadras 3,3 e 3,4)
  {
    const gx0 = 22, gx1 = 26, gz0 = 22, gz1 = 31;
    piso(gx0, gx1, 21, gz1, 'chao-grama');
    ladrilho('gramado-flores', 23, 21); ladrilho('gramado-flores', 25, 21);
    for (let gx = 23; gx <= 26; gx++) arvore(gx * TILE, 21 * TILE, 0.8);
    colocar('guarita', 22 * TILE, 26 * TILE, Math.PI / 2, 0, { colisor: false });
    for (let gx = 22; gx <= 26; gx++) {
      for (const [gz, ang] of [[25, 0], [27, Math.PI]]) {
        if (gx === 22) continue;
        modelo(casaDrummy(), gx * TILE, gz * TILE, ang, CALCADA, 1, { colisor: true, sombra: 'principal', decor: false });
        arvore(gx * TILE + 4.5, gz * TILE + (ang ? 4.2 : -4.2), 0.7);
      }
    }
    for (let gx = 23; gx <= 26; gx++) for (const gz of [29, 31]) {
      modelo(casaDrummy(), gx * TILE, gz * TILE, gz === 29 ? Math.PI : 0, CALCADA, 1, { colisor: true, sombra: 'principal', decor: false });
    }
    colocar('piscina', 24.5 * TILE, 23 * TILE, 0);
    for (const gx of [22, 26]) for (const gz of [23, 24]) arvore(gx * TILE, gz * TILE);
    for (let gx = 23; gx <= 26; gx++) arvore(gx * TILE, 30 * TILE + (R() - 0.5) * 3, 0.8);
    colocar('mesa-piquenique', 23 * TILE, 24 * TILE + 3, 0.3);
    colocar('mesa-piquenique', 26 * TILE, 24 * TILE + 3, -0.3);
    muro(gx0, gx1, gz0, gz1, null, [k(22, 26)]);
  }
  // Parque com campo de várzea
  {
    piso(28, 32, 3, 13, 'chao-grama');
    colocar('campo-futebol', 29.5 * TILE, 8.5 * TILE, Math.PI / 2, 0, { colisor: false, sombra: 'nunca' });
    for (let gx = 28; gx <= 31; gx++) for (let gz = 6; gz <= 11; gz++) OCUPADO.add(k(gx, gz));
    for (let gz = 3; gz <= 13; gz++) {
      if (R() < 0.7) arvore(32 * TILE + (R() - 0.5) * 4, gz * TILE + (R() - 0.5) * 4);
      if ((gz < 6 || gz > 11) && R() < 0.7) for (let gx = 28; gx <= 31; gx++) if (R() < 0.3) arvore(gx * TILE + (R() - 0.5) * 6, gz * TILE + (R() - 0.5) * 6);
    }
    for (const gz of [3, 13]) for (let gx = 29; gx <= 31; gx++) colocar('banco-praca', gx * TILE, gz * TILE + (gz === 3 ? 2 : -2), gz === 3 ? 0 : Math.PI);
    colocar('mesa-piquenique', 28 * TILE + 2, 3 * TILE + 2, 0.4);
    colocar('mesa-piquenique', 32 * TILE - 2, 13 * TILE - 2, -0.4);
    for (const gz of [5, 12]) for (const gx of [28, 31]) colocar('poste-luz-pedestre', gx * TILE, gz * TILE, 0, CALCADA, { halo: true });
  }

  // ====================================================================================================
  // 3. Rodovia (oeste, x = 12) + Trânsito vivo na rodovia
  // ====================================================================================================
  const RX = TILE;
  for (let gz = -24; gz <= 64; gz++) ladrilho(gz === 8 || gz === 34 ? 'rodovia-acesso' : 'rodovia-reta', 1, gz);
  for (let gz = -24; gz <= 64; gz += 3) colocar('poste-rodovia', RX, gz * TILE, 0, CALCADA, { halo: true });
  colocar('placa-rodovia-saida', RX + 17.6, 11 * TILE, 0, CALCADA);
  colocar('placa-rodovia-aeroporto', RX + 17.6, 39 * TILE, 0, CALCADA);
  colocar('placa-rodovia-cidade', RX - 17.6, -2 * TILE, Math.PI, CALCADA);
  colocar('placa-rodovia-saida', RX - 17.6, 30 * TILE, Math.PI, CALCADA);

  for (let i = 0; i < 20; i++) {
    const faixa = escolha([[-5.75, 1, 20], [-9.25, 1, 26], [-12.75, 1, 15], [5.75, -1, 20], [9.25, -1, 26], [12.75, -1, 15]]);
    const [lx, sent, vel] = faixa;
    const nome = Math.abs(lx) > 12 ? escolha(PESADOS) : escolha(CARROS_TRAF);
    const z0 = -260 + R() * 980;
    const url = `${BASE_BIB}/veiculos/${nome}.glb`;
    solicitarTemplateGlb(url);
    trafegoDefs.push({ url, x: RX + lx, z: z0, ry: sent > 0 ? 0 : Math.PI, sent, vel: vel * (0.85 + R() * 0.3) });
  }

  // ====================================================================================================
  // 4. Aeroporto (sul) + Jatos Hryz
  // ====================================================================================================
  const TX = 15 * TILE, TZ = 441, AP = TZ + 42, TAXI = 519, PISTA = 567;
  for (let gx = 9; gx <= 21; gx++) {
    ladrilho('estacionamento', gx, 33, 0);
    for (const bx of [-4.5, -1.5, 1.5, 4.5]) if (R() < 0.4) carro(escolha(CARROS_ESTAC), gx * TILE + bx, 33 * TILE - 3.5, Math.PI, CALCADA);
  }
  colocar('terminal-aeroporto', TX, TZ, Math.PI, CALCADA, { halo: true });
  for (const dx of [-48, 0, 48]) colocar('patio-posicao', TX + dx, AP, 0, 0);
  for (const x of [TX - 96, TX + 96, TX + 120, TX + 144]) for (const z of [AP - 12, AP + 12]) colocar('patio', x, z, 0, 0);
  for (let x = 84; x <= 516; x += 12) colocar('pista-taxi', x, TAXI, Math.PI / 2, 0);
  for (const x of [96, 504]) colocar('pista-taxi', x, (TAXI + PISTA) / 2, 0, 0);
  for (let i = 0; i < 10; i++) {
    const x = 84 + 48 * i;
    colocar(i === 0 || i === 9 ? 'pista-cabeceira' : 'pista-reta', x, PISTA, i === 9 ? -Math.PI / 2 : Math.PI / 2, 0);
  }
  colocar('torre-controle', TX - 120, TZ, Math.PI, CALCADA, { halo: true });
  colocar('hangar', TX + 168, AP, 0, 0.16, { halo: true });
  colocar('biruta', 520, PISTA - 36, 0, CALCADA);

  const URL_JATO = `${BASE_BIB}/aviao/jato-hryz.glb`;
  solicitarTemplateGlb(URL_JATO);
  const YA = 0.16 + 6.0;
  for (const dx of [-48, 0, 48]) avioesParados.push({ x: TX + dx, y: YA, z: AP - 12 + 20, ang: Math.PI, rodas: true });
  avioesParados.push({ x: 330, y: YA, z: TAXI, ang: -Math.PI / 2, rodas: true });

  // ====================================================================================================
  // 5. Estádio (leste)
  // ====================================================================================================
  colocar('estadio-futebol', 40.5 * TILE, 7 * TILE, 0, 0, { colisor: true, folga: 1.5, sombra: 'principal' });
  for (let gz = 3; gz <= 11; gz++) {
    ladrilho('estacionamento', 34, gz, 1);
    for (const bz of [-4.5, -1.5, 1.5, 4.5]) if (R() < 0.4) carro(escolha(CARROS_ESTAC), 34 * TILE + 3.5, gz * TILE + bz, -Math.PI / 2, CALCADA);
  }
  for (let gx = 36; gx <= 46; gx += 2) colocar('arvore-palmeira', gx * TILE, 1 * TILE - 1.5, R() * 6);

  for (const [nome, gx, gz] of PISOS) if (!OCUPADO.has(k(gx, gz))) ladrilho(nome, gx, gz);

  // ====================================================================================================
  // 6. Baixar todos os templates únicos em paralelo
  // ====================================================================================================
  const listaPromessas = [...templatePromises.values()];
  let carregados = 0;
  const totalTpls = listaPromessas.length;
  listaPromessas.forEach(p => p.then(() => {
    carregados++;
    if (carregados % 4 === 0 || carregados === totalTpls) {
      onProgresso((carregados / totalTpls) * 0.85, `Baixando modelos (${carregados}/${totalTpls})…`);
    }
  }));
  await Promise.all(listaPromessas);
  onProgresso(0.90, 'Mesclando cidade em malhas ultra-leves…');

  // ====================================================================================================
  // 7. Construir Setores (Chunks de 110 m) com camada Base + camada Decorativa
  // ====================================================================================================
  const chunksMap = new Map();
  function obterChunk(x, z) {
    const cx = Math.floor(x / CHUNK_TAM);
    const cz = Math.floor(z / CHUNK_TAM);
    const ck = cx + ',' + cz;
    let ch = chunksMap.get(ck);
    if (!ch) {
      const group = new THREE.Group();
      group.name = 'Chunk_' + ck;
      group.matrixAutoUpdate = false;
      group.updateMatrix();
      const decorGroup = new THREE.Group();
      decorGroup.name = 'Decor_' + ck;
      decorGroup.matrixAutoUpdate = false;
      decorGroup.updateMatrix();
      group.add(decorGroup);
      mundo.add(group);
      ch = {
        ck, group, decorGroup,
        minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity,
        mesclas: new Map(),
        instancias: new Map(),
      };
      chunksMap.set(ck, ch);
    }
    if (x < ch.minX) ch.minX = x;
    if (x > ch.maxX) ch.maxX = x;
    if (z < ch.minZ) ch.minZ = z;
    if (z > ch.maxZ) ch.maxZ = z;
    return ch;
  }

  const tmpPos = new THREE.Vector3();
  const tmpQuat = new THREE.Quaternion();
  const tmpEsc = new THREE.Vector3();
  const tmpAxis = new THREE.Vector3(0, 1, 0);
  const tmpInstMat = new THREE.Matrix4();
  const tmpWorldMat = new THREE.Matrix4();
  const tmpBox = new THREE.Box3();
  const tmpVec = new THREE.Vector3();
  const haloCoords = [];

  for (const item of itensEstaticos) {
    const tpl = templates.get(item.key);
    if (!tpl) continue;

    tmpPos.set(item.x, item.y, item.z);
    tmpQuat.setFromAxisAngle(tmpAxis, item.ang);
    tmpEsc.setScalar(item.escala);
    tmpInstMat.compose(tmpPos, tmpQuat, tmpEsc);

    if (item.colisor && !tpl.localBox.isEmpty()) {
      tmpBox.copy(tpl.localBox).applyMatrix4(tmpInstMat);
      const w = tmpBox.max.x - tmpBox.min.x;
      const d = tmpBox.max.z - tmpBox.min.z;
      const fx = Math.min(item.folga, w * 0.2);
      const fz = Math.min(item.folga, d * 0.2);
      colisores.push({
        minX: tmpBox.min.x + fx, maxX: tmpBox.max.x - fx,
        minZ: tmpBox.min.z + fz, maxZ: tmpBox.max.z - fz,
      });
    }

    if (item.halo && tpl.luzes.length) {
      const limite = Math.min(2, tpl.luzes.length);
      for (let i = 0; i < limite; i++) {
        const lp = tpl.luzes[i].pos;
        tmpVec.set(lp[0], lp[1], lp[2]).applyMatrix4(tmpInstMat);
        haloCoords.push(tmpVec.x, tmpVec.y, tmpVec.z);
      }
    }

    const ch = obterChunk(item.x, item.z);
    const dTag = item.decor ? '1' : '0';

    for (let si = 0; si < tpl.subs.length; si++) {
      const sub = tpl.subs[si];
      tmpWorldMat.multiplyMatrices(tmpInstMat, sub.localMatrix);

      let balde = sub.balde;
      let corOverride = sub.material?.color || null;

      // Semáforo mesclado diretamente com cor ligada/apagada da lente!
      if (item.semaforo && sub.name.startsWith('Luz_')) {
        const corNome = sub.name.slice(4).toLowerCase();
        if (corNome in SEM_FORTE) {
          const ativa = corNome === item.semaforo;
          corOverride = ativa ? SEM_FORTE[corNome] : SEM_FRACA[corNome];
          balde = ativa ? 'semaforoLuz' : 'fosco';
        }
      }

      if (balde) {
        const sTag = (balde === 'asfalto' || balde === 'luz' || balde === 'vidro' || balde === 'semaforoLuz') ? 'nunca' : item.sombra;
        const mKey = `${dTag}#${balde}#${sTag}`;
        let bucket = ch.mesclas.get(mKey);
        if (!bucket) {
          bucket = { decor: item.decor, balde, sombra: sTag, geos: [] };
          ch.mesclas.set(mKey, bucket);
        }
        bucket.geos.push(prepararGeoMesclavel(sub.geometry, tmpWorldMat, corOverride));
      } else {
        const bKey = `${dTag}#${item.key}#${si}#${item.sombra}`;
        let batch = ch.instancias.get(bKey);
        if (!batch) {
          batch = { decor: item.decor, sub, sombra: item.sombra, recebeSombra: item.recebeSombra, matrices: [] };
          ch.instancias.set(bKey, batch);
        }
        batch.matrices.push(tmpWorldMat.clone());
      }
    }
  }

  // Aviões parados + jato voando
  const RODA = new THREE.MeshLambertMaterial({ color: 0x1d1f23 });
  const PERNA = new THREE.MeshLambertMaterial({ color: 0xb8bec6 });
  const GEO_PERNA = new THREE.CylinderGeometry(0.18, 0.18, 4.2, 6);
  const GEO_RODA = new THREE.CylinderGeometry(0.62, 0.62, 0.42, 10);
  const tplJato = templates.get('glb:' + URL_JATO);
  const malhasSombraPrincipal = [];
  const malhasSombraDetalhe = [];
  const malhasMescladas = []; // { mesh, balde }
  const malhasInstanciadas = []; // { inst, matPbr, matLeve }

  function montarAviaoObj({ x, y, z, ang, rodas = true }) {
    const g = new THREE.Group();
    if (tplJato) {
      const o = tplJato.scene.clone(true);
      o.traverse(m => {
        if (m.isMesh) {
          m.castShadow = false;
          m.receiveShadow = true;
          if (rodas) malhasSombraPrincipal.push(m);
        }
      });
      g.add(o);
    }
    if (rodas) {
      for (const [px, pz] of [[0, 15.5], [-3.2, -1.5], [3.2, -1.5]]) {
        const perna = new THREE.Mesh(GEO_PERNA, PERNA);
        perna.position.set(px, -3.5, pz);
        g.add(perna);
        for (const dx of [-0.45, 0.45]) {
          const r = new THREE.Mesh(GEO_RODA, RODA);
          r.rotation.z = Math.PI / 2;
          r.position.set(px + dx, -5.4, pz);
          g.add(r);
        }
      }
    }
    g.position.set(x, y, z);
    g.rotation.set(0, ang, 0, 'YXZ');
    return g;
  }

  for (const av of avioesParados) {
    const g = montarAviaoObj(av);
    g.traverse(m => { m.matrixAutoUpdate = false; m.updateMatrix(); });
    obterChunk(av.x, av.z).group.add(g);
  }
  const jatoVoando = montarAviaoObj({ x: 120, y: YA, z: PISTA - 4, ang: Math.PI / 2, rodas: false });
  mundo.add(jatoVoando);

  // Materializa malhas mescladas e InstancedMeshes de cada setor
  const chunks = [];
  for (const ch of chunksMap.values()) {
    for (const bucket of ch.mesclas.values()) {
      if (!bucket.geos.length) continue;
      const merged = mergeGeometries(bucket.geos, false);
      for (let i = 0; i < bucket.geos.length; i++) bucket.geos[i].dispose();
      if (!merged) continue;
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, MAT_LAMBERT[bucket.balde]);
      mesh.receiveShadow = true;
      mesh.castShadow = false;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      (bucket.decor ? ch.decorGroup : ch.group).add(mesh);
      malhasMescladas.push({ mesh, balde: bucket.balde });

      if (bucket.sombra === 'principal') malhasSombraPrincipal.push(mesh);
      else if (bucket.sombra === 'detalhe') malhasSombraDetalhe.push(mesh);
    }
    ch.mesclas.clear();

    for (const batch of ch.instancias.values()) {
      const count = batch.matrices.length;
      const inst = new THREE.InstancedMesh(batch.sub.geometry, batch.sub.matLeve, count);
      for (let i = 0; i < count; i++) inst.setMatrixAt(i, batch.matrices[i]);
      inst.instanceMatrix.needsUpdate = true;
      inst.computeBoundingSphere();
      inst.frustumCulled = true;
      inst.receiveShadow = batch.recebeSombra;
      inst.castShadow = false;
      inst.matrixAutoUpdate = false;
      inst.updateMatrix();
      (batch.decor ? ch.decorGroup : ch.group).add(inst);
      malhasInstanciadas.push({ inst, matPbr: batch.sub.material, matLeve: batch.sub.matLeve });

      if (batch.sombra === 'principal') malhasSombraPrincipal.push(inst);
      else if (batch.sombra === 'detalhe') malhasSombraDetalhe.push(inst);
    }
    ch.instancias.clear();

    chunks.push({
      group: ch.group,
      decorGroup: ch.decorGroup,
      minX: ch.minX - 14, maxX: ch.maxX + 14,
      minZ: ch.minZ - 14, maxZ: ch.maxZ + 14,
    });
  }

  // Halos noturnos em 1 única draw call
  let halosPoints = null;
  if (haloCoords.length) {
    const hGeo = new THREE.BufferGeometry();
    hGeo.setAttribute('position', new THREE.Float32BufferAttribute(haloCoords, 3));
    const hMat = new THREE.PointsMaterial({
      map: criarHaloTextura(),
      size: 4.2,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.9,
    });
    halosPoints = new THREE.Points(hGeo, hMat);
    halosPoints.visible = noiteInicial;
    halosPoints.matrixAutoUpdate = false;
    halosPoints.updateMatrix();
    mundo.add(halosPoints);
  }

  // Trânsito vivo na rodovia
  const trafego = [];
  for (const td of trafegoDefs) {
    const tpl = templates.get('glb:' + td.url);
    if (!tpl) continue;
    const o = tpl.scene.clone(true);
    o.scale.setScalar(ESCALA_VEICULO);
    o.position.set(td.x, 0, td.z);
    o.rotation.y = td.ry;
    o.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });
    mundo.add(o);
    trafego.push({ o, x: td.x, sent: td.sent, vel: td.vel, min: -280, max: 760 });
  }

  // ====================================================================================================
  // 8. Qualidade dinâmica e NPCs em segundo plano
  // ====================================================================================================
  let cfgQual = qualidadeInicial || {
    viewDist: 125,
    pbr: false,
    mostrarDecor: false,
    sombraPrincipal: false,
    sombraDetalhe: false,
    npcsMax: 0,
    npcDist: 40,
    trafegoMax: 8,
  };

  const npcs = [];
  let npcsCarregandoAte = 0;

  function garantirNpcs(alvoMax) {
    const limite = Math.min(alvoMax, NPCS_DEFS.length);
    if (limite <= npcsCarregandoAte) return;
    const inicio = npcsCarregandoAte;
    npcsCarregandoAte = limite;
    (async () => {
      for (let i = inicio; i < limite; i++) {
        const d = NPCS_DEFS[i];
        try {
          const p = await Personagem.carregar(`${BASE_BIB}/personagens/elenco/${d.arq}.glb`);
          p.obj.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = true; } });
          p.tocar(d.acao);
          p.piscarAuto(true);
          if (d.estatico) {
            p.obj.position.set(d.x, CALCADA, d.z);
            p.obj.rotation.y = d.ang;
          }
          p.obj.visible = false;
          mundo.add(p.obj);
          const vel = (p.info(d.acao).velocidade || (d.acao === 'Correr' ? 4.2 : 1.4));
          npcs.push({ idx: i, p, ...d, vel });
        } catch (e) {
          console.warn('NPC skip:', d.arq, e);
        }
      }
    })();
  }

  let ultCullX = 1e9, ultCullZ = 1e9;
  let chunksVisiveis = chunks.length;

  function atualizarChunks(fx, fz, forcar = false) {
    if (!forcar && (fx - ultCullX) * (fx - ultCullX) + (fz - ultCullZ) * (fz - ultCullZ) < 64) return;
    ultCullX = fx;
    ultCullZ = fz;
    const vd2 = cfgQual.viewDist * cfgQual.viewDist;
    const showDec = !!cfgQual.mostrarDecor;
    let vis = 0;
    for (let i = 0; i < chunks.length; i++) {
      const ch = chunks[i];
      const dx = fx < ch.minX ? ch.minX - fx : (fx > ch.maxX ? fx - ch.maxX : 0);
      const dz = fz < ch.minZ ? ch.minZ - fz : (fz > ch.maxZ ? fz - ch.maxZ : 0);
      const mostrar = (dx * dx + dz * dz) <= vd2;
      ch.group.visible = mostrar;
      ch.decorGroup.visible = mostrar && showDec;
      if (mostrar) vis++;
    }
    chunksVisiveis = vis;
  }

  function aplicarQualidade(q) {
    cfgQual = { ...cfgQual, ...q };
    const mats = cfgQual.pbr ? MAT_PBR : MAT_LAMBERT;
    for (let i = 0; i < malhasMescladas.length; i++) {
      const m = malhasMescladas[i];
      m.mesh.material = mats[m.balde];
    }
    for (let i = 0; i < malhasInstanciadas.length; i++) {
      const it = malhasInstanciadas[i];
      it.inst.material = cfgQual.pbr ? it.matPbr : it.matLeve;
    }
    for (let i = 0; i < malhasSombraPrincipal.length; i++) malhasSombraPrincipal[i].castShadow = !!cfgQual.sombraPrincipal;
    for (let i = 0; i < malhasSombraDetalhe.length; i++) malhasSombraDetalhe[i].castShadow = !!cfgQual.sombraDetalhe;
    for (let i = 0; i < trafego.length; i++) trafego[i].o.visible = i < cfgQual.trafegoMax;
    aplicarEstadoLuzes(estadoNoite);
    alternarChuva(estadoChuva);
    atualizarChunks(ultCullX === 1e9 ? 146 : ultCullX, ultCullZ === 1e9 ? 166 : ultCullZ, true);
    garantirNpcs(cfgQual.npcsMax);
  }

  aplicarEstadoLuzes(noiteInicial);
  aplicarQualidade(cfgQual);
  onProgresso(1, 'Cidade pronta!');

  function alternarNoite(ligada) {
    chaoMat.color.setHex(ligada ? 0x2c4a2a : 0x6fa94c);
    aplicarEstadoLuzes(ligada);
    if (halosPoints) halosPoints.visible = ligada;
  }

  function atualizar(dt, t, focoX = 146, focoZ = 166) {
    atualizarChunks(focoX, focoZ, false);

    const maxT = Math.min(cfgQual.trafegoMax, trafego.length);
    const tDist2 = cfgQual.viewDist * cfgQual.viewDist;
    for (let i = 0; i < trafego.length; i++) {
      const c = trafego[i];
      if (i >= maxT) { c.o.visible = false; continue; }
      c.o.position.z += c.sent * c.vel * dt;
      if (c.sent > 0 && c.o.position.z > c.max) c.o.position.z = c.min;
      if (c.sent < 0 && c.o.position.z < c.min) c.o.position.z = c.max;
      const dx = c.x - focoX, dz = c.o.position.z - focoZ;
      c.o.visible = (dx * dx + dz * dz) <= tDist2;
    }

    const npcDist2 = cfgQual.npcDist * cfgQual.npcDist;
    for (let i = 0; i < npcs.length; i++) {
      const n = npcs[i];
      if (n.idx >= cfgQual.npcsMax) { n.p.obj.visible = false; continue; }
      let nx, nz, ang;
      if (n.estatico) {
        nx = n.x; nz = n.z;
      } else {
        ang = n.fase + (t * n.vel) / n.raio;
        nx = n.cx + Math.cos(ang) * n.raio;
        nz = n.cz + Math.sin(ang) * n.raio;
      }
      const dx = nx - focoX, dz = nz - focoZ;
      const perto = (dx * dx + dz * dz) <= npcDist2;
      n.p.obj.visible = perto;
      if (perto) {
        if (!n.estatico) {
          n.p.obj.position.set(nx, CALCADA, nz);
          n.p.obj.rotation.y = -ang;
        }
        n.p.atualizar(dt);
      }
    }

    if (jatoVoando) {
      const ciclo = (t * 0.045) % 1;
      if (ciclo < 0.35) {
        const u = ciclo / 0.35;
        const x = 100 + u * 440;
        const sobe = Math.max(0, (u - 0.45) / 0.55);
        const y = YA + sobe * sobe * 130;
        jatoVoando.position.set(x, y, PISTA - 4);
        jatoVoando.rotation.set(-sobe * 0.24, Math.PI / 2, 0, 'YXZ');
      } else {
        const u = (ciclo - 0.35) / 0.65;
        const ang = -Math.PI / 2 + u * Math.PI * 2;
        const rx = 280 + Math.cos(ang) * 420;
        const rz = 290 + Math.sin(ang) * 320;
        jatoVoando.position.set(rx, 145 + Math.sin(u * Math.PI) * 35, rz);
        jatoVoando.rotation.set(0, Math.atan2(-Math.sin(ang) * 420, Math.cos(ang) * 320), -0.25, 'YXZ');
      }
    }
  }

  return {
    kit,
    mundo,
    colisores,
    alternarNoite,
    alternarChuva,
    aplicarQualidade,
    atualizar,
    getStats: () => ({ chunksVisiveis, chunksTotal: chunks.length, npcsCarregados: npcs.length }),
    mapaInfo: { RUA, VX, HZ, ROT, RX, TX, TZ, PISTA },
  };
}
