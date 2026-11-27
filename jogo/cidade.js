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
import { instalarAnimacoesUniversal } from '../videos/biblioteca3d/animacoes/universal.js';

const BASE_BIB = './videos/biblioteca3d';
const CHUNK_TAM = 64;

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

// Texturas procedurais HD (512x512, geradas 1x): albedo + mapa de relevo (bumpMap) com anisotropia p/ nitidez à distância
function criarTexturaPadrao(tipo) {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const rng = aleatorio(tipo === 'asfalto' ? 101 : (tipo === 'grama' ? 202 : 303));

  if (tipo === 'asfalto') {
    g.fillStyle = '#dde0e6';
    g.fillRect(0, 0, S, S);
    for (let i = 0; i < 12000; i++) {
      const v = 166 + Math.floor(rng() * 78);
      g.fillStyle = `rgb(${v},${v},${v + 3})`;
      const sz = rng() < 0.72 ? 2 : 3;
      g.fillRect(rng() * S, rng() * S, sz, sz);
    }
    for (let i = 0; i < 12; i++) {                                                     // remendos de asfalto e manchas sutis
      const x = rng() * S, y = rng() * S, r = 16 + rng() * 52;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(76,80,88,${0.18 + rng() * 0.18})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    // Micro-trincas e marcas leves de rodagem
    g.strokeStyle = 'rgba(92,98,108,0.34)';
    g.lineWidth = 1.3;
    for (let i = 0; i < 11; i++) {
      g.beginPath();
      let x = rng() * S, y = rng() * S;
      g.moveTo(x, y);
      for (let s = 0; s < 7; s++) { x += (rng() - 0.5) * 65; y += (rng() - 0.5) * 65; g.lineTo(x, y); }
      g.stroke();
    }
  } else if (tipo === 'grama') {
    g.fillStyle = '#dfe9d6';
    g.fillRect(0, 0, S, S);
    for (let i = 0; i < 42; i++) {                                                     // variação orgânica de solo/capim
      const x = rng() * S, y = rng() * S, r = 20 + rng() * 68, seca = rng() < 0.45;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, seca ? 'rgba(246,232,174,0.34)' : 'rgba(132,184,104,0.32)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    for (let i = 0; i < 14000; i++) {                                                  // folhas de capim com luz e sombra
      const v = 158 + Math.floor(rng() * 94), x = rng() * S, y = rng() * S;
      g.strokeStyle = `rgba(${v - 24},${v},${v - 42},0.78)`;
      g.lineWidth = rng() < 0.7 ? 1 : 1.5;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rng() - 0.5) * 4.5, y - 3 - rng() * 6); g.stroke();
    }
    for (let i = 0; i < 360; i++) {
      g.fillStyle = `rgba(138,110,72,${0.24 + rng() * 0.25})`;
      g.fillRect(rng() * S, rng() * S, 1.5 + rng() * 2.5, 1.5 + rng() * 2.5);
    }
  } else {
    // Superfície (calçada, concreto arquitetônico, reboco de fachadas): juntas nítidas + granulação realista
    g.fillStyle = '#eff1f4';
    g.fillRect(0, 0, S, S);
    for (let i = 0; i < 7500; i++) {
      const v = 212 + Math.floor(rng() * 40);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(rng() * S, rng() * S, 2, 2);
    }
    for (let i = 0; i < 18; i++) {                                                     // leve envelhecimento de fachada
      const x = rng() * S, y = rng() * S, r = 24 + rng() * 64;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(155,162,172,0.12)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    g.strokeStyle = 'rgba(138,146,158,0.28)';
    g.lineWidth = 1.5;
    for (let p = 0; p < S; p += 128) {
      g.beginPath(); g.moveTo(p, 0); g.lineTo(p, S); g.stroke();
      g.beginPath(); g.moveTo(0, p); g.lineTo(S, p); g.stroke();
    }
    g.strokeStyle = 'rgba(255,255,255,0.26)';
    g.lineWidth = 1;
    for (let p = 2; p < S; p += 128) {
      g.beginPath(); g.moveTo(p, 0); g.lineTo(p, S); g.stroke();
      g.beginPath(); g.moveTo(0, p); g.lineTo(S, p); g.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;

  const bump = new THREE.CanvasTexture(c);
  bump.colorSpace = THREE.NoColorSpace;
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.anisotropy = 4;

  return { map: tex, bump };
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

export const SELVA_INFO = {
  minX: 426, maxX: 610,
  minZ: 185, maxZ: 375,
  cx: 520, cz: 280,
  clareiraR: 42,
  gateX: 432, gateZ: 268,
  lagoX: 556, lagoZ: 254, lagoR: 13.5,
};

export const PONTOS_TELEPORTE = [
  { id: 'delegacia',  nome: 'Delegacia',        x: 146,   z: 166.2, ang: Math.PI / 2 },
  { id: 'selva',      nome: '🦖 Selva (T. rex)', x: 446,   z: 270,   ang: Math.PI / 2 - 0.10 },
  { id: 'praca',      nome: 'Praça Central',    x: 216,   z: 166.2, ang: 0 },
  { id: 'rotatoria',  nome: 'Rotatória',        x: 252,   z: 222,   ang: Math.PI },
  { id: 'rodovia',    nome: 'Rodovia',          x: 17.75, z: 240,   ang: Math.PI },
  { id: 'aeroporto',  nome: 'Aeroporto',        x: 120,   z: 567,   ang: Math.PI / 2 },
  { id: 'estadio',    nome: 'Estádio',          x: 396,   z: 84,    ang: 0 },
  { id: 'condominio', nome: 'Jardim Hryz',      x: 246,   z: 312,   ang: Math.PI / 2 },
  { id: 'parque',     nome: 'Parque',           x: 336,   z: 166.2, ang: Math.PI },
  { id: 'canteiro',   nome: 'Canteiro de Obras', x: 180,   z: 22.2,  ang: Math.PI / 2 },
  { id: 'foguete',    nome: '🚀 Base de Lançamento', x: 580, z: 520, ang: Math.PI / 2 },
];

const NPCS_DEFS = [
  { arq: 'homem',      acao: 'AndarPro',         vel: 1.5, cx: 18 * TILE, cz: 11 * TILE, raio: 12, fase: 0.0 },
  { arq: 'policial',   acao: 'BracosCruzados',   x: 132.5, z: 163.5, ang: 0.2, estatico: true },
  { arq: 'mae',        acao: 'AndarPro',         vel: 1.4, cx: 18 * TILE, cz: 11 * TILE, raio: 15, fase: 2.1 },
  { arq: 'davi',       acao: 'Trotar',           vel: 3.1, cx: 18 * TILE, cz: 11 * TILE, raio: 10, fase: 4.0 },
  { arq: 'jovem_b',    acao: 'AndarPro',         vel: 1.55, cx: 18 * TILE, cz: 11 * TILE, raio: 19, fase: 1.1 },
  { arq: 'entregador', acao: 'ConversarCelular', x: 17 * TILE, z: 14 * TILE + 4.8, ang: -Math.PI / 2, estatico: true },
  { arq: 'velha',      acao: 'ConversarEmPe',    x: 18 * TILE + 6, z: 11 * TILE + 7, ang: 2.8, estatico: true },
  { arq: 'lia',        acao: 'ParadoPro',        x: 15 * TILE - 10, z: 441 - 22, ang: Math.PI, estatico: true },
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

  const { map: texAsfalto, bump: bumpAsfalto } = criarTexturaPadrao('asfalto');
  const { map: texSuperficie, bump: bumpSuperficie } = criarTexturaPadrao('superficie');
  const { map: texGrama, bump: bumpGrama } = criarTexturaPadrao('grama');
  const { map: texSelva } = criarTexturaPadrao('grama');
  // ruído suave de baixa frequência para quebrar a repetição das texturas no chão (grama, calçada e asfalto)
  const texMacro = (() => {
    const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); const rng = aleatorio(909);
    g.fillStyle = 'rgb(128,128,128)'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 220; i++) {
      const x = rng() * S, y = rng() * S, r = 8 + rng() * 46, v = rng() < 0.5 ? 255 : 0;
      for (const dx of [0, -S, S]) for (const dy of [0, -S, S]) { const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r); gr.addColorStop(0, `rgba(${v},${v},${v},0.34)`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r); }
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; return t;
  })();
  function variacaoNoChao(mat, forca = 1, aoVertical = true) {
    const antigo = mat.onBeforeCompile;
    const chave = 'macro2_' + forca + '_' + (aoVertical ? 1 : 0) + (antigo ? antigo.toString().length + antigo.toString().slice(0, 60) : '');
    mat.customProgramCacheKey = () => chave;                                          // (senão o Three reaproveita o shader de outro material)
    mat.onBeforeCompile = (sh, r) => {
      antigo?.call(mat, sh, r);
      sh.uniforms.tMacro = { value: texMacro };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMacroP; varying float vMacroN;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvMacroP = (modelMatrix * vec4(transformed, 1.0)).xyz; vMacroN = normalize(mat3(modelMatrix) * objectNormal).y;');
      const blocoAO = aoVertical ? `
  else if (abs(vMacroN) < 0.72) {
    // Oclusão de contato com o solo (base dos prédios/muros) + ganho suave de luz do céu no topo
    float aoBase = mix(0.74, 1.0, smoothstep(0.0, 2.6, vMacroP.y));
    float luzTopo = mix(0.95, 1.08, smoothstep(2.5, 28.0, vMacroP.y));
    float macW = texture2D(tMacro, vec2((vMacroP.x + vMacroP.z) * 0.018, vMacroP.y * 0.032)).r;
    diffuseColor.rgb *= aoBase * luzTopo * mix(0.93, 1.05, macW);
  }` : '';
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tMacro; varying vec3 vMacroP; varying float vMacroN;')
        .replace('#include <color_fragment>', `#include <color_fragment>
  if (vMacroN > 0.85 && vMacroP.y < 0.6) {
    float mac = texture2D(tMacro, vMacroP.xz * 0.0075).r * 0.62 + texture2D(tMacro, vMacroP.xz * 0.043).r * 0.38;
    diffuseColor.rgb *= mix(1.0, mix(0.70, 1.20, mac), ${forca.toFixed(2)});
    float lumC = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
    diffuseColor.rgb *= mix(1.0, 0.84, smoothstep(0.62, 0.92, lumC));               // concreto claro envelhecido (sem ofuscar)
  }${blocoAO}`);
    };
  }

  // Materiais Lambert (Leve) e PBR com bumpMap + reflexo IBL real (Médio / Alto)
  const MAT_LAMBERT = {
    fosco:     new THREE.MeshLambertMaterial({ vertexColors: true, map: texSuperficie }),
    metal:     new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 75, specular: 0x66788c }),
    asfalto:   new THREE.MeshLambertMaterial({ vertexColors: true, map: texAsfalto, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    luz:       new THREE.MeshLambertMaterial({ vertexColors: true }),
    vidro:     new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 110, specular: 0x88b0d8 }),
    semaforoLuz: new THREE.MeshBasicMaterial({ vertexColors: true }),
    selvaChao: new THREE.MeshLambertMaterial({ vertexColors: true, map: texSelva, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    selvaVeg:  new THREE.MeshLambertMaterial({ vertexColors: true, map: texSelva }),
    agua:      new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 120, specular: 0x8ae6e0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  };
  const MAT_PBR = {
    fosco:     new THREE.MeshStandardMaterial({ vertexColors: true, map: texSuperficie, bumpMap: bumpSuperficie, bumpScale: 0.045, roughness: 0.82, metalness: 0.04, envMapIntensity: 0.95 }),
    metal:     new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.26, metalness: 0.78, envMapIntensity: 1.45 }),
    asfalto:   new THREE.MeshStandardMaterial({ vertexColors: true, map: texAsfalto, bumpMap: bumpAsfalto, bumpScale: 0.06, roughness: 0.82, metalness: 0.04, envMapIntensity: 0.9, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    luz:       new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.05 }),
    vidro:     new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.08, metalness: 0.74, envMapIntensity: 1.85 }),
    semaforoLuz: new THREE.MeshBasicMaterial({ vertexColors: true }),
    selvaChao: new THREE.MeshStandardMaterial({ vertexColors: true, map: texSelva, bumpMap: bumpGrama, bumpScale: 0.05, roughness: 0.90, metalness: 0.0, envMapIntensity: 0.8, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    selvaVeg:  new THREE.MeshStandardMaterial({ vertexColors: true, map: texSelva, roughness: 0.82, metalness: 0.0, envMapIntensity: 0.85 }),
    agua:      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.08, metalness: 0.32, envMapIntensity: 1.75, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  };

  for (const m of [MAT_LAMBERT.fosco, MAT_LAMBERT.asfalto, MAT_PBR.fosco, MAT_PBR.asfalto]) variacaoNoChao(m, 1, true);
  for (const m of [MAT_LAMBERT.selvaChao, MAT_PBR.selvaChao]) variacaoNoChao(m, 0.8, false);
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
    MAT_PBR.asfalto.color.setHex(molhado ? 0x9ca6b2 : 0xffffff);
    MAT_PBR.asfalto.roughness = molhado ? 0.16 : 0.82;
    MAT_PBR.asfalto.metalness = molhado ? 0.22 : 0.04;
    MAT_PBR.asfalto.envMapIntensity = molhado ? 1.55 : 0.9;
  }

  // Chão base de grama dividido em grade espacial (tiles de 128 m) p/ frustum culling real pela câmera!
  texGrama.repeat.set(12, 12);
  bumpGrama.repeat.set(12, 12);
  const aplicarRecorteCanteiro = mat => {
    mat.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vMundoXZ;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvMundoXZ = (modelMatrix * vec4(transformed, 1.0)).xz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vMundoXZ;').replace('void main() {', 'void main() {\n  if (vMundoXZ.x > 140.7 && vMundoXZ.x < 219.3 && vMundoXZ.y > -29.3 && vMundoXZ.y < 14.3) discard;');
    };
    variacaoNoChao(mat, 1.2, false);
  };
  const chaoMatLeve = new THREE.MeshLambertMaterial({
    color: noiteInicial ? 0x2c4a2a : 0x6ca64a,
    map: texGrama,
    polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2,
  });
  const chaoMatPbr = new THREE.MeshStandardMaterial({
    color: noiteInicial ? 0x2c4a2a : 0x6ba649,
    map: texGrama,
    bumpMap: bumpGrama, bumpScale: 0.055,
    roughness: 0.90, metalness: 0.0, envMapIntensity: 0.72,
    polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2,
  });
  aplicarRecorteCanteiro(chaoMatLeve);
  aplicarRecorteCanteiro(chaoMatPbr);

  const chaoTiles = [];
  const TILE_CHAO = 128;
  const geoTileChao = new THREE.PlaneGeometry(TILE_CHAO + 0.2, TILE_CHAO + 0.2, 2, 2);
  geoTileChao.rotateX(-Math.PI / 2);
  for (let gx = -468; gx <= 1068; gx += TILE_CHAO) {
    for (let gz = -468; gz <= 1068; gz += TILE_CHAO) {
      const m = new THREE.Mesh(geoTileChao, chaoMatLeve);
      m.position.set(gx, -0.18, gz);
      m.receiveShadow = true;
      m.matrixAutoUpdate = false;
      m.updateMatrix();
      mundo.add(m);
      const half = TILE_CHAO * 0.5 + 1;
      chaoTiles.push({
        mesh: m,
        cx: gx, cz: gz,
        minX: gx - half, maxX: gx + half,
        minZ: gz - half, maxZ: gz + half,
        box: new THREE.Box3(new THREE.Vector3(gx - half, -2, gz - half), new THREE.Vector3(gx + half, 2, gz + half)),
      });
    }
  }

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

  // Rede elétrica: postes de concreto de 9 m a cada 24 m numa das calçadas, com fiação entre eles (bem de rua brasileira)
  {
    const lado = 5.35, vao = 24;
    for (const gz of [2, 8, 20, 26, 32]) {                                            // ruas leste-oeste (a avenida do meio fica com árvores)
      const z = gz * TILE + lado * (gz % 4 === 0 ? 1 : -1), xs = [];
      for (let x = 3 * TILE + 6; x <= 33 * TILE - 6; x += vao) if (!naRot(Math.round(x / TILE), gz)) xs.push(x);
      xs.forEach((x, i) => { colocar(i % 5 === 2 ? 'poste-energia-transformador' : 'poste-energia', x, z, 0, CALCADA, { colisor: true, folga: 0.2 }); if (i < xs.length - 1 && xs[i + 1] - x === vao) colocar('fio-vao-24', x, z, 0, CALCADA, { colisor: false, sombra: 'nunca' }); });
    }
    for (const gx of [3, 15, 27, 33]) {                                               // ruas norte-sul
      const x = gx * TILE + lado * (gx % 2 ? -1 : 1), zs = [];
      for (let z = 32 * TILE - 6; z >= 2 * TILE + 6; z -= vao) if (!naRot(gx, Math.round(z / TILE))) zs.push(z);
      zs.forEach((z, i) => { colocar(i % 5 === 2 ? 'poste-energia-transformador' : 'poste-energia', x, z, Math.PI / 2, CALCADA, { colisor: true, folga: 0.2 }); if (i < zs.length - 1 && z - zs[i + 1] === vao) colocar('fio-vao-24', x, z, Math.PI / 2, CALCADA, { colisor: false, sombra: 'nunca' }); });
    }
  }
  // Avenida do meio (z = 168) arborizada dos dois lados, entre os postes de luz
  for (let x = 3 * TILE + 6; x <= 33 * TILE - 6; x += 24) {
    const gx = Math.round(x / TILE); if (naRot(gx, 14)) continue;
    for (const s of [1, -1]) if (R() < 0.85) colocar('arvore-frondosa', x, 14 * TILE + 5.4 * s, R() * 6.28, CALCADA, { escala: 0.42 + R() * 0.12, colisor: false });
  }

  // Carros estacionados (camada decorativa)
  for (const [c, t] of Object.entries(TIPO)) {
    const [gx, gz] = c.split(',').map(Number);
    if (t.nome !== 'rua-reta' || gz === 14 || R() > 0.26) continue;                  // (mais carros parados: rua de cidade de verdade)
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

  // ====================================================================================================
  // 5.5 Selva Jurássica (leste — palmeiras tropicais do kit mescladas nos setores)
  // ====================================================================================================
  {
    const rngP = aleatorio(7741);
    const { cx, cz, lagoX, lagoZ, lagoR } = SELVA_INFO;
    // Palmeiras emoldurando a entrada da selva, a borda da clareira e a lagoa
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 + (rngP() - 0.5) * 0.16;
      const rr = 38 + rngP() * 24;
      const px = cx + Math.cos(a) * rr;
      const pz = cz + Math.sin(a) * rr;
      // Mantém corredor da estrada livre até a clareira
      if (px < 500 && Math.abs(pz - 274) < 16) continue;
      if (Math.hypot(px - lagoX, pz - lagoZ) < lagoR + 2.5) continue;
      colocar('arvore-palmeira', px, pz, rngP() * 6.28, 0.02, { escala: 1.05 + rngP() * 0.45, colisor: false });
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.4;
      const px = lagoX + Math.cos(a) * (lagoR + 3.2 + rngP() * 2.5);
      const pz = lagoZ + Math.sin(a) * (lagoR + 3.2 + rngP() * 2.5);
      colocar('arvore-palmeira', px, pz, rngP() * 6.28, 0.02, { escala: 1.15 + rngP() * 0.35, colisor: false });
    }
  }

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
        maxY: tmpBox.max.y,                                                       // topo (telhado onde o super pulo pode pousar)
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

  // ====================================================================================================
  // 7.5 Selva Jurássica (leste — 100% mesclada por setor: chão musgoso, trilha, lagoa, portal, árvores e samambaias)
  // ====================================================================================================
  {
    const rngS = aleatorio(9917);
    const { minX, maxX, minZ, maxZ, cx, cz, clareiraR, gateX, gateZ, lagoX, lagoZ, lagoR } = SELVA_INFO;
    const tmpEuler = new THREE.Euler();
    const tmpCor = new THREE.Color();

    function addSelvaGeo(srcGeo, x, y, z, rx, ry, rz, sx, sy, sz, corHex, balde = 'selvaVeg', sombra = 'detalhe') {
      const ch = obterChunk(x, z);
      tmpPos.set(x, y, z);
      tmpEuler.set(rx, ry, rz, 'YXZ');
      tmpQuat.setFromEuler(tmpEuler);
      tmpEsc.set(sx, sy, sz);
      tmpWorldMat.compose(tmpPos, tmpQuat, tmpEsc);
      const sTag = (balde === 'selvaChao' || balde === 'agua' || balde === 'luz') ? 'nunca' : sombra;
      const mKey = `0#${balde}#${sTag}`;
      let bucket = ch.mesclas.get(mKey);
      if (!bucket) {
        bucket = { decor: false, balde, sombra: sTag, geos: [] };
        ch.mesclas.set(mKey, bucket);
      }
      tmpCor.setHex(corHex);
      bucket.geos.push(prepararGeoMesclavel(srcGeo, tmpWorldMat, tmpCor));
    }

    // Geometrias-base ultra-leves (reutilizadas e descartadas no fim do bloco)
    const gPisoTile = new THREE.PlaneGeometry(24, 24);
    gPisoTile.rotateX(-Math.PI / 2);
    const gTrilha = new THREE.PlaneGeometry(11.5, 11.5);
    gTrilha.rotateX(-Math.PI / 2);
    const gDisco = new THREE.CircleGeometry(1, 20);
    gDisco.rotateX(-Math.PI / 2);
    const gTronco = new THREE.CylinderGeometry(0.32, 0.58, 1, 5);
    gTronco.translate(0, 0.5, 0);
    const gCopa = new THREE.DodecahedronGeometry(1, 0);
    const gFolha = new THREE.ConeGeometry(0.55, 2.2, 4);
    gFolha.scale(1.0, 1.0, 0.22);
    gFolha.translate(0, 1.1, 0);
    const gRocha = new THREE.DodecahedronGeometry(1, 0);
    const gPoste = new THREE.BoxGeometry(1, 1, 1);

    // 1. Chão musgoso da selva dividido em blocos de 24m (culling exato por setor, zero z-fighting)
    for (let x = minX + 10; x <= maxX - 10; x += 22) {
      for (let z = minZ + 10; z <= maxZ - 10; z += 22) {
        const dCentro = Math.hypot((x - cx) / 96, (z - cz) / 96);
        if (dCentro > 1.08) continue;
        const corPiso = ((Math.floor(x / 22) + Math.floor(z / 22)) % 2 === 0) ? 0x2a5223 : 0x24481e;
        addSelvaGeo(gPisoTile, x, 0.025, z, 0, 0, 0, 1.02, 1, 1.02, corPiso, 'selvaChao', 'nunca');
      }
    }

    // 2. Estrada de terra ligando a rua leste (x=400, z=240) ao portal (432, 268) e à clareira central (520, 280)
    const rotaSelva = [
      [402, 240], [412, 248], [422, 258], [432, 268],
      [444, 271], [456, 274], [468, 276], [480, 278], [492, 279],
    ];
    for (let i = 0; i < rotaSelva.length - 1; i++) {
      const [x0, z0] = rotaSelva[i], [x1, z1] = rotaSelva[i + 1];
      const ang = Math.atan2(x1 - x0, z1 - z0);
      const segs = 2;
      for (let s = 0; s < segs; s++) {
        const u = (s + 0.5) / segs;
        const px = x0 + (x1 - x0) * u;
        const pz = z0 + (z1 - z0) * u;
        addSelvaGeo(gTrilha, px, 0.052, pz, 0, ang, 0, 0.88, 1, 0.95, 0x76583b, 'selvaChao', 'nunca');
      }
    }
    // Clareira central de terra batida onde o T. rex patrulha (em 4 quadrantes para culling perfeito)
    addSelvaGeo(gDisco, cx, 0.048, cz, 0, 0, 0, 34, 1, 31, 0x6f5438, 'selvaChao', 'nunca');
    addSelvaGeo(gDisco, cx - 12, 0.052, cz + 6, 0, 0, 0, 20, 1, 18, 0x7b5f40, 'selvaChao', 'nunca');
    addSelvaGeo(gDisco, cx + 10, 0.052, cz - 8, 0, 0, 0, 19, 1, 17, 0x674e34, 'selvaChao', 'nunca');

    // 3. Lagoa tropical com margem de lama na borda leste da clareira
    addSelvaGeo(gDisco, lagoX, 0.046, lagoZ, 0, 0, 0, lagoR + 3.2, 1, lagoR + 2.4, 0x56412b, 'selvaChao', 'nunca');
    addSelvaGeo(gDisco, lagoX, 0.068, lagoZ, 0, 0, 0, lagoR, 1, lagoR * 0.88, 0x1a7f78, 'agua', 'nunca');

    // Função de proteção de corredor livre (estrada + portal + clareira + lagoa)
    function noCorredorLivre(x, z, margem = 0) {
      if (Math.hypot(x - cx, z - cz) < clareiraR - 4 + margem) return true;
      if (Math.hypot(x - lagoX, z - lagoZ) < lagoR + 2 + margem) return true;
      for (let i = 0; i < rotaSelva.length; i++) {
        if (Math.hypot(x - rotaSelva[i][0], z - rotaSelva[i][1]) < 11.5 + margem) return true;
      }
      return false;
    }

    // 4. Portal "SELVA JURÁSSICA · T. REX" na entrada (432, 268) + cerca rústica de madeira
    {
      const gAng = Math.atan2(444 - 422, 271 - 258); // direção entrando na selva
      const fx = Math.sin(gAng), fz = Math.cos(gAng);
      const lx = fz, lz = -fx; // lateral perpendicular ao caminho
      for (const s of [-1, 1]) {
        const px = gateX + lx * 6.0 * s;
        const pz = gateZ + lz * 6.0 * s;
        // Base de pedra + torre de madeira
        addSelvaGeo(gPoste, px, 0.9, pz, 0, gAng, 0, 1.9, 1.8, 1.9, 0x5c6358, 'selvaVeg', 'principal');
        addSelvaGeo(gPoste, px, 4.9, pz, 0, gAng, 0, 1.15, 7.2, 1.15, 0x4f3520, 'selvaVeg', 'principal');
        // Tocha/lanterna quente no topo da torre
        addSelvaGeo(gPoste, px, 8.75, pz, 0, gAng, 0, 0.9, 0.7, 0.9, 0xffaa33, 'luz', 'nunca');
        haloCoords.push(px, 8.85, pz);
        // Colisor da torre (deixa vão livre de ~10m para carros passarem fácil!)
        colisores.push({ minX: px - 1.1, maxX: px + 1.1, minZ: pz - 1.1, maxZ: pz + 1.1 });
      }
      // Viga superior do portal (altura livre de 6,6 m)
      addSelvaGeo(gPoste, gateX, 7.1, gateZ, 0, gAng, 0, 13.6, 0.85, 1.0, 0x452d1a, 'selvaVeg', 'principal');
      addSelvaGeo(gPoste, gateX, 7.85, gateZ, 0, gAng, 0, 12.2, 0.45, 0.65, 0x5c3c22, 'selvaVeg', 'principal');

      // Placa rústica legível de ambos os lados ("SELVA JURÁSSICA • CUIDADO T. REX")
      const pCan = document.createElement('canvas');
      pCan.width = 512; pCan.height = 128;
      const pg = pCan.getContext('2d');
      pg.fillStyle = '#2d1c0f';
      pg.fillRect(0, 0, 512, 128);
      pg.strokeStyle = '#d97706';
      pg.lineWidth = 8;
      pg.strokeRect(8, 8, 496, 112);
      pg.fillStyle = '#fde047';
      pg.font = '900 40px system-ui, sans-serif';
      pg.textAlign = 'center';
      pg.textBaseline = 'middle';
      pg.fillText('SELVA JURÁSSICA', 256, 48);
      pg.fillStyle = '#f87171';
      pg.font = '800 24px system-ui, sans-serif';
      pg.fillText('⚠ CUIDADO: T. REX SOLTO ⚠', 256, 92);
      const pTex = new THREE.CanvasTexture(pCan);
      pTex.colorSpace = THREE.SRGBColorSpace;
      const pMat = new THREE.MeshBasicMaterial({ map: pTex });
      const pGeo = new THREE.PlaneGeometry(8.6, 2.15);
      for (const lado of [-1, 1]) {
        const placa = new THREE.Mesh(pGeo, pMat);
        placa.position.set(gateX + fx * 0.56 * lado, 7.15, gateZ + fz * 0.56 * lado);
        placa.rotation.y = lado > 0 ? gAng : gAng + Math.PI;
        placa.matrixAutoUpdate = false;
        placa.updateMatrix();
        obterChunk(gateX, gateZ).group.add(placa);
      }

      // Cerca rústica de troncos flanqueando a entrada
      for (const s of [-1, 1]) {
        for (let k = 1; k <= 5; k++) {
          const px = gateX + lx * (6.2 + k * 4.2) * s;
          const pz = gateZ + lz * (6.2 + k * 4.2) * s;
          addSelvaGeo(gPoste, px, 1.1, pz, 0, gAng, 0, 0.35, 2.2, 0.35, 0x4f3520, 'selvaVeg', 'detalhe');
          const mx = gateX + lx * (6.2 + (k - 0.5) * 4.2) * s;
          const mz = gateZ + lz * (6.2 + (k - 0.5) * 4.2) * s;
          addSelvaGeo(gPoste, mx, 1.55, mz, 0, gAng, 0, 4.2, 0.18, 0.16, 0x5c3e26, 'selvaVeg', 'detalhe');
          addSelvaGeo(gPoste, mx, 0.85, mz, 0, gAng, 0, 4.2, 0.18, 0.16, 0x5c3e26, 'selvaVeg', 'detalhe');
        }
      }
    }

    // 5. Árvores tropicais altas com copas em camadas (~92 árvores, só ~13k triângulos no total!)
    const tonsCopa = [0x1c5922, 0x236a28, 0x2b7a2f, 0x184b1e, 0x317f31];
    const tonsTronco = [0x58402a, 0x4a3522, 0x624730];
    let arvCriadas = 0;
    for (let tent = 0; tent < 420 && arvCriadas < 92; tent++) {
      const a = rngS() * Math.PI * 2;
      const rr = clareiraR - 1 + rngS() * 48;
      const tx = cx + Math.cos(a) * rr;
      const tz = cz + Math.sin(a) * rr;
      if (tx < minX + 4 || tx > maxX - 4 || tz < minZ + 4 || tz > maxZ - 4) continue;
      if (noCorredorLivre(tx, tz, 1.5)) continue;

      const h = 8.5 + rngS() * 7.0;
      const esp = 0.85 + rngS() * 0.55;
      const corT = tonsTronco[Math.floor(rngS() * tonsTronco.length)];
      const corC1 = tonsCopa[Math.floor(rngS() * tonsCopa.length)];
      const corC2 = tonsCopa[Math.floor(rngS() * tonsCopa.length)];
      const tiltX = (rngS() - 0.5) * 0.12;
      const tiltZ = (rngS() - 0.5) * 0.12;

      addSelvaGeo(gTronco, tx, 0, tz, tiltX, rngS() * 6.28, tiltZ, esp, h, esp, corT, 'selvaVeg', 'detalhe');
      const rCopa = 3.2 + rngS() * 2.4;
      addSelvaGeo(gCopa, tx, h + 0.5, tz, 0, rngS() * 6.28, 0, rCopa, rCopa * 0.52, rCopa, corC1, 'selvaVeg', 'detalhe');
      addSelvaGeo(
        gCopa,
        tx + (rngS() - 0.5) * 2.6,
        h - 1.0 + rngS() * 1.4,
        tz + (rngS() - 0.5) * 2.6,
        0, rngS() * 6.28, 0,
        rCopa * 0.78, rCopa * 0.44, rCopa * 0.78,
        corC2, 'selvaVeg', 'detalhe'
      );
      if (rr > clareiraR + 4) {
        colisores.push({ minX: tx - 0.75, maxX: tx + 0.75, minZ: tz - 0.75, maxZ: tz + 0.75 });
      }
      arvCriadas++;
    }

    // 6. Samambaias gigantes pré-históricas e arbustos tropicais (~160 moitas mescladas)
    const tonsSam = [0x2e7d32, 0x3b8e38, 0x246928, 0x45993b];
    let samCriadas = 0;
    for (let tent = 0; tent < 500 && samCriadas < 160; tent++) {
      const a = rngS() * Math.PI * 2;
      const rr = 30 + rngS() * 58;
      const fx = cx + Math.cos(a) * rr;
      const fz = cz + Math.sin(a) * rr;
      if (fx < minX + 2 || fx > maxX - 2 || fz < minZ + 2 || fz > maxZ - 2) continue;
      if (Math.hypot(fx - cx, fz - cz) < 31) continue;
      if (Math.hypot(fx - lagoX, fz - lagoZ) < lagoR + 0.5) continue;
      let naEstrada = false;
      for (let i = 0; i < rotaSelva.length; i++) {
        if (Math.hypot(fx - rotaSelva[i][0], fz - rotaSelva[i][1]) < 7.6) { naEstrada = true; break; }
      }
      if (naEstrada) continue;

      const esc = 0.85 + rngS() * 0.95;
      const corF = tonsSam[Math.floor(rngS() * tonsSam.length)];
      const baseRot = rngS() * 6.28;
      const nFolhas = 5;
      for (let f = 0; f < nFolhas; f++) {
        const fa = baseRot + (f / nFolhas) * Math.PI * 2 + (rngS() - 0.5) * 0.25;
        addSelvaGeo(gFolha, fx, 0.04, fz, 0.85 + rngS() * 0.3, fa, 0, esc, esc, esc, corF, 'selvaVeg', 'nunca');
      }
      samCriadas++;
    }

    // 7. Rochas musgosas (na margem da lagoa e ao redor da clareira) + troncos caídos
    const tonsRocha = [0x596454, 0x4c5747, 0x646c5c];
    for (let i = 0; i < 28; i++) {
      const pertoLago = i < 10;
      const a = pertoLago ? (i / 10) * Math.PI * 2 + rngS() * 0.3 : rngS() * Math.PI * 2;
      const rr = pertoLago ? (lagoR + 0.6 + rngS() * 2.5) : (38 + rngS() * 42);
      const rx = (pertoLago ? lagoX : cx) + Math.cos(a) * rr;
      const rz = (pertoLago ? lagoZ : cz) + Math.sin(a) * rr;
      if (!pertoLago && noCorredorLivre(rx, rz, 0)) continue;
      const sx = 1.4 + rngS() * 2.4;
      const sy = 0.9 + rngS() * 1.5;
      const sz = 1.4 + rngS() * 2.4;
      const corR = tonsRocha[Math.floor(rngS() * tonsRocha.length)];
      addSelvaGeo(gRocha, rx, sy * 0.35, rz, rngS() * 0.4, rngS() * 6.28, rngS() * 0.4, sx, sy, sz, corR, 'selvaVeg', 'detalhe');
      if (sx > 2.2) {
        colisores.push({ minX: rx - sx * 0.7, maxX: rx + sx * 0.7, minZ: rz - sz * 0.7, maxZ: rz + sz * 0.7 });
      }
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.35;
      const rr = 41 + rngS() * 18;
      const lx = cx + Math.cos(a) * rr;
      const lz = cz + Math.sin(a) * rr;
      if (noCorredorLivre(lx, lz, 0)) continue;
      addSelvaGeo(gTronco, lx, 0.35, lz, Math.PI / 2, rngS() * 6.28, 0, 0.9, 5.5 + rngS() * 3.5, 0.9, 0x4b3826, 'selvaVeg', 'detalhe');
    }

    gPisoTile.dispose(); gTrilha.dispose(); gDisco.dispose();
    gTronco.dispose(); gCopa.dispose(); gFolha.dispose();
    gRocha.dispose(); gPoste.dispose();
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

  // Materializa malhas mescladas e InstancedMeshes de cada setor com AABB 3D exata p/ Frustum Culling
  const chunks = [];
  for (const ch of chunksMap.values()) {
    const box = new THREE.Box3();
    for (const bucket of ch.mesclas.values()) {
      if (!bucket.geos.length) continue;
      const merged = mergeGeometries(bucket.geos, false);
      for (let i = 0; i < bucket.geos.length; i++) bucket.geos[i].dispose();
      if (!merged) continue;
      merged.computeBoundingSphere();
      merged.computeBoundingBox();
      if (merged.boundingBox) box.union(merged.boundingBox);
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
      inst.computeBoundingBox();
      if (inst.boundingBox) box.union(inst.boundingBox);
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

    if (box.isEmpty()) {
      box.set(new THREE.Vector3(ch.minX - 6, -2, ch.minZ - 6), new THREE.Vector3(ch.maxX + 6, 18, ch.maxZ + 6));
    } else {
      box.expandByScalar(1.8);
      box.min.y = Math.min(box.min.y, -1.5);
      box.max.y = Math.max(box.max.y, 4.0);
    }

    chunks.push({
      group: ch.group,
      decorGroup: ch.decorGroup,
      minX: box.min.x, maxX: box.max.x,
      minZ: box.min.z, maxZ: box.max.z,
      box,
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
    trafego.push({ o, x: td.x, sent: td.sent, vel: td.vel, va: td.vel, parado: 0, min: -280, max: 760 });
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
          try { await instalarAnimacoesUniversal(p, { preCarregar: [d.acao] }); } catch (_) {}
          p.tocar(d.acao);
          p.piscarAuto(true);
          if (d.estatico) {
            p.obj.position.set(d.x, CALCADA, d.z);
            p.obj.rotation.y = d.ang;
          }
          p.obj.visible = false;
          mundo.add(p.obj);
          const vel = d.vel || (p.info(d.acao).velocidade || (d.acao.includes('Correr') || d.acao === 'Trotar' ? 3.2 : 1.45));
          npcs.push({ idx: i, p, ...d, vel });
        } catch (e) {
          console.warn('NPC skip:', d.arq, e);
        }
      }
    })();
  }

  let ultCullX = 1e9, ultCullZ = 1e9;
  let chunksVisiveis = chunks.length;
  let chaoVisiveis = chaoTiles.length;
  let trafegoVisivel = 0;
  let npcsVisiveis = 0;

  const _frustum = new THREE.Frustum();
  const _projScreen = new THREE.Matrix4();
  const _sph = new THREE.Sphere();
  let frustumValido = false;

  /** Culling exato pelo cone de visão (Frustum) da câmera + distância: renderiza SOMENTE o que está visível na câmera! */
  function cullarCamera(camera, fx, fz) {
    if (!camera) return null;
    camera.updateMatrixWorld();
    _projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    _frustum.setFromProjectionMatrix(_projScreen);
    frustumValido = true;

    const cx = camera.position.x, cz = camera.position.z;
    const vd = cfgQual.viewDist;
    const vd2 = vd * vd;
    const vdChao2 = (vd + 110) * (vd + 110);
    const showDec = !!cfgQual.mostrarDecor;

    let vis = 0;
    for (let i = 0; i < chunks.length; i++) {
      const ch = chunks[i];
      const dx = cx < ch.minX ? ch.minX - cx : (cx > ch.maxX ? cx - ch.maxX : 0);
      const dz = cz < ch.minZ ? ch.minZ - cz : (cz > ch.maxZ ? cz - ch.maxZ : 0);
      const mostrar = (dx * dx + dz * dz) <= vd2 && _frustum.intersectsBox(ch.box);
      ch.group.visible = mostrar;
      ch.decorGroup.visible = mostrar && showDec;
      if (mostrar) vis++;
    }
    chunksVisiveis = vis;

    let visChao = 0;
    for (let i = 0; i < chaoTiles.length; i++) {
      const t = chaoTiles[i];
      const dx = cx < t.minX ? t.minX - cx : (cx > t.maxX ? cx - t.maxX : 0);
      const dz = cz < t.minZ ? t.minZ - cz : (cz > t.maxZ ? cz - t.maxZ : 0);
      const mostrar = (dx * dx + dz * dz) <= vdChao2 && _frustum.intersectsBox(t.box);
      t.mesh.visible = mostrar;
      if (mostrar) visChao++;
    }
    chaoVisiveis = visChao;

    const maxT = Math.min(cfgQual.trafegoMax, trafego.length);
    let visT = 0;
    for (let i = 0; i < trafego.length; i++) {
      const c = trafego[i];
      if (i >= maxT) { c.o.visible = false; continue; }
      const dx = c.x - cx, dz = c.o.position.z - cz;
      let mostrar = (dx * dx + dz * dz) <= vd2;
      if (mostrar) {
        _sph.center.set(c.x, 1.2, c.o.position.z);
        _sph.radius = 4.2;
        mostrar = _frustum.intersectsSphere(_sph);
      }
      c.o.visible = mostrar;
      if (mostrar) visT++;
    }
    trafegoVisivel = visT;

    const npcDist2 = cfgQual.npcDist * cfgQual.npcDist;
    let visN = 0;
    for (let i = 0; i < npcs.length; i++) {
      const n = npcs[i];
      if (n.idx >= cfgQual.npcsMax) { n.p.obj.visible = false; continue; }
      const px = n.p.obj.position.x, pz = n.p.obj.position.z;
      const dx = px - fx, dz = pz - fz;
      let mostrar = (dx * dx + dz * dz) <= npcDist2;
      if (mostrar) {
        _sph.center.set(px, CALCADA + 1.0, pz);
        _sph.radius = 1.8;
        mostrar = _frustum.intersectsSphere(_sph);
      }
      n.p.obj.visible = mostrar;
      if (mostrar) visN++;
    }
    npcsVisiveis = visN;

    if (jatoVoando) {
      _sph.center.copy(jatoVoando.position);
      _sph.radius = 24;
      jatoVoando.visible = _frustum.intersectsSphere(_sph);
    }

    ultCullX = fx; ultCullZ = fz;
    return _frustum;
  }

  function atualizarChunks(fx, fz, forcar = false) {
    if (frustumValido && !forcar) return;
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
    const matChao = cfgQual.pbr ? chaoMatPbr : chaoMatLeve;
    for (let i = 0; i < chaoTiles.length; i++) chaoTiles[i].mesh.material = matChao;

    const aniso = cfgQual.anisotropy || (cfgQual.pbr ? 8 : 2);
    for (const tx of [texAsfalto, texSuperficie, texGrama, texSelva]) {
      tx.anisotropy = aniso;
      tx.needsUpdate = true;
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
    const cor = ligada ? 0x2c4a2a : 0x6ba649;
    chaoMatLeve.color.setHex(cor);
    chaoMatPbr.color.setHex(cor);
    aplicarEstadoLuzes(ligada);
    if (halosPoints) halosPoints.visible = ligada;
  }

  // ---- pedestres atingidos (poderes do Kael): o 1º acerto assusta e empurra, o 2º derruba
  function atingirNpc(n, golpes = 1) {
    if (n.morto) return false;
    n.acertos = (n.acertos || 0) + golpes;
    if (n.acertos >= 2) {
      n.morto = true; n.tMorto = 0; n.mx = n.p.obj.position.x; n.mz = n.p.obj.position.z;
      n.p.obj.rotation.order = 'YXZ'; n.p.piscarAuto(false); n.p.rosto?.({ expressao: 'grito', forca: 0.7, piscar: 1 });
      return true;
    }
    n.susto = 0.5; n.p.rosto?.({ expressao: 'surpresa', forca: 1 });
    return false;
  }
  function reviverNpc(n) {
    n.morto = false; n.acertos = 0; n.susto = 0; n.p.obj.rotation.x = 0; n.p.obj.rotation.order = 'XYZ'; n.p.obj.position.y = CALCADA;
    n.p.piscarAuto(true); n.p.rosto?.({ expressao: 'neutro', forca: 1, piscar: 0 }); n.p.tocar(n.acao);
  }

  let obstaculos = [];                                                           // {x, z, r}: o jogo informa a cada quadro (jogador, veículo dele)
  function atualizar(dt, t, focoX = 146, focoZ = 166, obs = null) {
    if (obs) obstaculos = obs;
    atualizarChunks(focoX, focoZ, false);

    const maxT = Math.min(cfgQual.trafegoMax, trafego.length);
    for (let i = 0; i < trafego.length; i++) {
      const c = trafego[i];
      if (i >= maxT) { c.o.visible = false; continue; }
      // segue a faixa mantendo distância: freia para o carro da frente e para obstáculos (jogador, veículos) na faixa
      const cz = c.o.position.z; let livre = 1e9;
      for (let j = 0; j < maxT; j++) {
        if (j === i) continue; const o = trafego[j];
        if (Math.abs(o.x - c.x) > 1.5) continue;
        const d = (o.o.position.z - cz) * c.sent; if (d > 0 && d < livre) livre = d;
      }
      let porObs = false;
      for (const ob of obstaculos) {
        if (Math.abs(ob.x - c.x) > 1.3 + ob.r) continue;
        const d = (ob.z - cz) * c.sent - ob.r; if (d > -2.5 && d < livre) { livre = Math.max(0, d); porObs = true; }
      }
      c.parado = Math.max(0, c.parado - dt);
      // distância de parada ~ v²/(2·7 m/s²) + 7 m de folga
      const alvo = c.parado > 0 ? 0 : Math.max(0, Math.min(c.vel, Math.sqrt(Math.max(0, livre - 7) * 2 * 7)));
      c.va += Math.max(-14 * dt, Math.min(4 * dt, alvo - c.va));
      c.buzina = porObs && livre < 16;                                              // parado ou freando por causa do jogador: buzina
      c.o.position.z += c.sent * c.va * dt;
      if (c.sent > 0 && c.o.position.z > c.max) c.o.position.z = c.min;
      if (c.sent < 0 && c.o.position.z < c.min) c.o.position.z = c.max;
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
      if (n.morto) {                                                               // caído (rajada/arremesso): fica no chão e volta depois de 30 s
        n.tMorto += dt;
        const k = Math.min(1, n.tMorto * 1.8), e = k * k * (3 - 2 * k);
        n.p.obj.rotation.x = -e * (Math.PI / 2 - 0.08); n.p.obj.position.y = CALCADA + 0.12 * e;
        if (n.tMorto < 0.6) n.p.atualizar(dt);
        if (n.tMorto > 30) reviverNpc(n);
        continue;
      }
      if (n.susto > 0) n.susto = Math.max(0, n.susto - dt);
      const dx = nx - focoX, dz = nz - focoZ;
      const perto = (dx * dx + dz * dz) <= npcDist2;
      if (perto) {
        if (!n.estatico) {
          n.p.obj.position.set(nx, CALCADA, nz);
          n.p.obj.rotation.y = -ang;
        }
        if (n.susto > 0) n.p.obj.rotation.x = -0.35 * Math.sin(Math.PI * n.susto / 0.5);
        else if (n.p.obj.rotation.x) n.p.obj.rotation.x = 0;
        // Só anima esqueleto se estiver visível na câmera!
        if (!frustumValido || n.p.obj.visible) n.p.atualizar(dt);
      } else {
        n.p.obj.visible = false;
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
    cullarCamera,
    npcs,
    trafego,
    atingirNpc,
    getStats: () => ({
      chunksVisiveis,
      chunksTotal: chunks.length,
      chaoVisiveis,
      chaoTotal: chaoTiles.length,
      npcsCarregados: npcs.length,
      npcsVisiveis,
      trafegoVisivel,
    }),
    mapaInfo: { RUA, VX, HZ, ROT, RX, TX, TZ, PISTA, selva: SELVA_INFO },
  };
}
