// Construtor jogável da Cidade Hryz (mapa oficial completo com colisores AABB, dia/noite dinâmico, trânsito e pedestres animados).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Kit, TILE, CALCADA, ESCALA_VEICULO, materialDetalhado } from '../videos/biblioteca3d/cidade/kit.js';
import { Personagem } from '../videos/biblioteca3d/personagens/elenco/elenco.js';

const BASE_BIB = './videos/biblioteca3d';

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
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,238,200,1)');
  r.addColorStop(0.22, 'rgba(255,217,138,0.5)');
  r.addColorStop(1, 'rgba(255,217,138,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.SpriteMaterial({ map: t, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
}

const SOLIDOS = new Set([
  'casa-simples', 'casa-sobrado', 'casa-moderna', 'casa-colonial',
  'predio-comercial-10', 'predio-loja-3', 'predio-residencial-6', 'predio-residencial-12',
  'hospital', 'delegacia', 'supermercado', 'cinema',
  'terminal-aeroporto', 'torre-controle', 'hangar', 'estadio-futebol', 'muro',
]);

export const PONTOS_TELEPORTE = [
  { id: 'delegacia',  nome: 'Delegacia',    x: 146, z: 166.2, ang: Math.PI / 2 },
  { id: 'praca',      nome: 'Praça Central', x: 216, z: 166.2, ang: 0 },
  { id: 'rotatoria',  nome: 'Rotatória',    x: 252, z: 222,   ang: Math.PI },
  { id: 'rodovia',    nome: 'Rodovia',      x: 17.75, z: 240, ang: Math.PI },
  { id: 'aeroporto',  nome: 'Aeroporto',    x: 120, z: 567,   ang: Math.PI / 2 },
  { id: 'estadio',    nome: 'Estádio',      x: 396, z: 84,    ang: 0 },
  { id: 'condominio', nome: 'Jardim Hryz',  x: 246, z: 312,   ang: Math.PI / 2 },
  { id: 'parque',     nome: 'Parque',       x: 336, z: 166.2, ang: Math.PI },
];

export async function construirCidade({ scene, noiteInicial = false, onProgresso = () => {} }) {
  const kit = await Kit.carregar();
  const mundo = new THREE.Group();
  mundo.name = 'CidadeHryz';
  scene.add(mundo);

  const P = [];
  const colisores = []; // { minX, maxX, minZ, maxZ }
  const matsLuz = new Set();
  const matsJanela = new Set();
  const matsLetreiro = new Set();
  const halos = [];
  const HALO = criarHaloTextura();

  function registrarLuzes(obj) {
    obj.traverse(m => {
      if (!m.isMesh || !m.material) return;
      const mat = m.material;
      if (/^Luz(_\d+)?$/.test(m.name)) {
        matsLuz.add(mat);
      } else if (/^VidroLuz(_\d+)?$/.test(m.name)) {
        if (mat.userData.corDia === undefined) mat.userData.corDia = mat.color.getHex();
        matsJanela.add(mat);
      } else if (/^Letreiro(_\d+)?$/.test(m.name) && mat.map) {
        if (!mat.emissiveMap) { mat.emissiveMap = mat.map; mat.needsUpdate = true; }
        matsLetreiro.add(mat);
      }
    });
  }

  function aplicarEstadoLuzes(ligada) {
    for (const mat of matsLuz) {
      mat.color.setHex(ligada ? 0xfff2cc : 0xcdd3d8);
      mat.emissive.setHex(ligada ? 0xffd98a : 0x000000);
      mat.emissiveIntensity = ligada ? 1.6 : 0;
    }
    for (const mat of matsJanela) {
      mat.color.setHex(ligada ? 0xffe3a8 : (mat.userData.corDia ?? 0x4b6a88));
      mat.emissive.setHex(ligada ? 0xffc866 : 0x000000);
      mat.emissiveIntensity = ligada ? 1.2 : 0;
    }
    for (const mat of matsLetreiro) {
      mat.emissive.setHex(ligada ? 0xffffff : 0x000000);
      mat.emissiveIntensity = ligada ? 0.9 : 0;
    }
  }

  // Chão base de grama
  const chaoMat = materialDetalhado(noiteInicial ? 0x2c4a2a : 0x6fa94c, 'grama');
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), chaoMat);
  chao.rotation.x = -Math.PI / 2;
  chao.position.set(300, -0.03, 300);
  chao.receiveShadow = true;
  scene.add(chao);

  // Cache de GLB externos ao kit (casas Drummy, veículos Kenney, jato)
  const loader = new GLTFLoader();
  const cache = new Map();
  async function glb(url) {
    if (!cache.has(url)) cache.set(url, loader.loadAsync(url));
    const o = (await cache.get(url)).scene.clone(true);
    o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    return o;
  }

  const R = aleatorio(2026);
  const escolha = l => l[Math.floor(R() * l.length)];

  function registrarColisor(obj, folga = 0.4) {
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj);
    if (box.isEmpty()) return;
    const w = box.max.x - box.min.x, d = box.max.z - box.min.z;
    const fx = Math.min(folga, w * 0.2), fz = Math.min(folga, d * 0.2);
    colisores.push({ minX: box.min.x + fx, maxX: box.max.x - fx, minZ: box.min.z + fz, maxZ: box.max.z - fz });
  }

  function colocar(nome, x, z, ang = 0, y = CALCADA, { escala = 1, halo = false, colisor = SOLIDOS.has(nome) } = {}) {
    P.push((async () => {
      const o = await kit.peca(nome);
      o.position.set(x, y, z);
      o.rotation.y = ang;
      if (escala !== 1) o.scale.setScalar(escala);
      registrarLuzes(o);
      if (halo) {
        for (const l of kit.luzesDe(o).slice(0, 2)) {
          const h = new THREE.Sprite(HALO);
          h.position.copy(l.pos);
          h.scale.setScalar(l.alcance > 20 ? 5 : 3);
          h.visible = noiteInicial;
          mundo.add(h);
          halos.push(h);
        }
      }
      mundo.add(o);
      if (colisor) registrarColisor(o, nome === 'muro' ? 0.15 : 0.45);
    })());
  }

  const OCUPADO = new Set();
  const ladrilho = (nome, gx, gz, rot = 0, lados = null) => {
    OCUPADO.add(gx + ',' + gz);
    P.push(kit.ladrilho(nome, gx, gz, rot, lados).then(o => {
      o.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = true; } });
      registrarLuzes(o);
      mundo.add(o);
    }));
  };

  function modelo(url, x, z, ang = 0, y = CALCADA, escala = 1, { colisor = false } = {}) {
    P.push(glb(url).then(o => {
      o.position.set(x, y, z);
      o.rotation.y = ang;
      if (escala !== 1) o.scale.setScalar(escala);
      mundo.add(o);
      if (colisor) registrarColisor(o, 0.4);
      return o;
    }));
  }

  const CARROS = ['sedan', 'sedan-sports', 'hatchback-sports', 'suv', 'suv-luxury', 'taxi', 'van', 'police', 'delivery'];
  const PESADOS = ['truck', 'truck-flat', 'delivery', 'delivery-flat', 'van', 'garbage-truck'];
  const carro = (nome, x, z, ry, y = 0) => modelo(`${BASE_BIB}/veiculos/${nome}.glb`, x, z, ry, y, ESCALA_VEICULO);

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
        P.push(kit.prop('semaforo-apagado', gx, gz, x, z, { rotY: a }).then(o => { kit.semaforoEstado(o, e); mundo.add(o); }));
      }
    }
    if (t.nome === 'rua-t' && R() < 0.5) {
      P.push(kit.prop('placa-pare', gx, gz, -4.8, 4.7, { rotY: -Math.PI / 2 }).then(o => mundo.add(o)));
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

  // Carros estacionados em algumas ruas (deixando a avenida principal gz=14 livre para dirigir à vontade!)
  for (const [c, t] of Object.entries(TIPO)) {
    const [gx, gz] = c.split(',').map(Number);
    if (t.nome !== 'rua-reta' || gz === 14 || R() > 0.14) continue;
    const vert = t.l.includes('N'), sentido = R() < 0.5 ? 1 : -1;
    const p = kit.naPista(gx, gz, vert ? 0 : 1, sentido, (R() - 0.5) * 6);
    carro(escolha(CARROS), p.x, p.z, p.ry);
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
  const ARVORES = ['arvore-redonda', 'arvore-frondosa', 'arvore-ipe-amarelo', 'arvore-ipe-rosa', 'arvore-pinheiro', 'arvore-cipreste'];
  const arvore = (x, z, esc = 0.85 + R() * 0.3) => colocar(escolha(ARVORES), x, z, R() * 6.28, CALCADA, { escala: esc, colisor: false });
  const CASAS_KIT = ['casa-simples', 'casa-sobrado', 'casa-moderna', 'casa-colonial'];
  const CERCAS = ['cerca-madeira-portao', 'muro-portao', 'grade-ferro', 'cerca-madeira'];
  const casaDrummy = () => `${BASE_BIB}/casas/casa${2 + Math.floor(R() * 5)}-${escolha(['a', 'b', 'c'])}.glb`;

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
      if (drummy) modelo(casaDrummy(), x, z, ang, CALCADA, 1, { colisor: true });
      else {
        colocar(escolha(CASAS_KIT), x, z, ang);
        colocar(escolha(CERCAS), x + fx * 5.85, z + fz * 5.85, ang, CALCADA, { colisor: false });
      }
      if (R() < 0.6) arvore(x - fz * 4.6 + fx * 4.2, z + fx * 4.6 + fz * 4.2, 0.7 + R() * 0.2);
    }
    for (let gx = q.x0 + 1; gx < q.x1; gx++) for (let gz = q.z0 + 1; gz < q.z1; gz++) {
      if (!livre(gx, gz)) continue;
      arvore(gx * TILE + (R() - 0.5) * 8, gz * TILE + (R() - 0.5) * 8);
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
      for (const bx of [-4.5, -1.5, 1.5, 4.5]) if (R() < 0.45) carro(escolha(CARROS), gx * TILE + bx, gz * TILE + (gz === 6 ? 3.5 : -3.5), gz === 6 ? 0 : Math.PI, CALCADA);
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
        if (R() < 0.45) carro(escolha(CARROS), gx * TILE + escolha([-4.5, -1.5, 1.5, 4.5]), gz * TILE - 3.5, Math.PI, CALCADA);
      } else if (R() < 0.4) arvore(gx * TILE, gz * TILE, 0.7);
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
        modelo(casaDrummy(), gx * TILE, gz * TILE, ang, CALCADA, 1, { colisor: true });
        arvore(gx * TILE + 4.5, gz * TILE + (ang ? 4.2 : -4.2), 0.7);
      }
    }
    for (let gx = 23; gx <= 26; gx++) for (const gz of [29, 31]) modelo(casaDrummy(), gx * TILE, gz * TILE, gz === 29 ? Math.PI : 0, CALCADA, 1, { colisor: true });
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
    P.push(kit.peca('campo-futebol').then(o => { o.position.set(29.5 * TILE, 0, 8.5 * TILE); o.rotation.y = Math.PI / 2; mundo.add(o); }));
    for (let gx = 28; gx <= 31; gx++) for (let gz = 6; gz <= 11; gz++) OCUPADO.add(k(gx, gz));
    for (let gz = 3; gz <= 13; gz++) {
      if (R() < 0.85) arvore(32 * TILE + (R() - 0.5) * 4, gz * TILE + (R() - 0.5) * 4);
      if ((gz < 6 || gz > 11) && R() < 0.85) for (let gx = 28; gx <= 31; gx++) if (R() < 0.35) arvore(gx * TILE + (R() - 0.5) * 6, gz * TILE + (R() - 0.5) * 6);
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

  const trafego = [];
  for (let i = 0; i < 24; i++) {
    const faixa = escolha([[-5.75, 1, 20], [-9.25, 1, 26], [-12.75, 1, 15], [5.75, -1, 20], [9.25, -1, 26], [12.75, -1, 15]]);
    const [lx, sent, vel] = faixa;
    const nome = Math.abs(lx) > 12 ? escolha(PESADOS) : escolha(CARROS);
    const z0 = -260 + R() * 980;
    P.push(glb(`${BASE_BIB}/veiculos/${nome}.glb`).then(o => {
      o.scale.setScalar(ESCALA_VEICULO);
      o.position.set(RX + lx, 0, z0);
      o.rotation.y = sent > 0 ? 0 : Math.PI;
      mundo.add(o);
      trafego.push({ o, eixo: 'z', sent, vel: vel * (0.85 + R() * 0.3), min: -280, max: 760 });
    }));
  }

  // ====================================================================================================
  // 4. Aeroporto (sul) + Jatos Hryz (um decolando em loop!)
  // ====================================================================================================
  const TX = 15 * TILE, TZ = 441, AP = TZ + 42, TAXI = 519, PISTA = 567;
  for (let gx = 9; gx <= 21; gx++) {
    ladrilho('estacionamento', gx, 33, 0);
    for (const bx of [-4.5, -1.5, 1.5, 4.5]) if (R() < 0.5) carro(escolha(CARROS), gx * TILE + bx, 33 * TILE - 3.5, Math.PI, CALCADA);
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

  const RODA = new THREE.MeshStandardMaterial({ color: 0x1d1f23, roughness: 0.8 });
  const PERNA = new THREE.MeshStandardMaterial({ color: 0xb8bec6, metalness: 0.5, roughness: 0.4 });
  let jatoVoando = null;
  function aviao(x, y, z, ang, { pitch = 0, rodas = true, animado = false } = {}) {
    P.push(glb(`${BASE_BIB}/aviao/jato-hryz.glb`).then(o => {
      const g = new THREE.Group();
      g.add(o);
      if (rodas) {
        for (const [px, pz] of [[0, 15.5], [-3.2, -1.5], [3.2, -1.5]]) {
          const perna = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 4.2, 8), PERNA);
          perna.position.set(px, -3.5, pz); g.add(perna);
          for (const dx of [-0.45, 0.45]) {
            const r = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.42, 14), RODA);
            r.rotation.z = Math.PI / 2; r.position.set(px + dx, -5.4, pz); r.castShadow = true; g.add(r);
          }
        }
      }
      g.position.set(x, y, z); g.rotation.set(0, ang, 0, 'YXZ'); g.rotateX(-pitch);
      mundo.add(g);
      if (animado) jatoVoando = g;
    }));
  }
  const YA = 0.16 + 6.0;
  for (const dx of [-48, 0, 48]) aviao(TX + dx, YA, AP - 12 + 20, Math.PI);
  aviao(330, YA, TAXI, -Math.PI / 2);
  aviao(120, YA, PISTA - 4, Math.PI / 2, { rodas: false, animado: true });

  // ====================================================================================================
  // 5. Estádio (leste)
  // ====================================================================================================
  P.push(kit.peca('estadio-futebol').then(o => {
    o.position.set(40.5 * TILE, 0, 7 * TILE);
    registrarLuzes(o);
    mundo.add(o);
    registrarColisor(o, 1.5);
  }));
  for (let gz = 3; gz <= 11; gz++) {
    ladrilho('estacionamento', 34, gz, 1);
    for (const bz of [-4.5, -1.5, 1.5, 4.5]) if (R() < 0.5) carro(escolha(CARROS), 34 * TILE + 3.5, gz * TILE + bz, -Math.PI / 2, CALCADA);
  }
  for (let gx = 36; gx <= 46; gx += 2) colocar('arvore-palmeira', gx * TILE, 1 * TILE - 1.5, R() * 6);

  // ====================================================================================================
  // 6. Pedestres animados do Elenco (caminhando na praça, hospital e aeroporto)
  // ====================================================================================================
  const npcs = [];
  P.push((async () => {
    const defs = [
      { arq: 'homem',      acao: 'Andar',  cx: 18 * TILE, cz: 11 * TILE, raio: 12, fase: 0.0 },
      { arq: 'mae',        acao: 'Andar',  cx: 18 * TILE, cz: 11 * TILE, raio: 15, fase: 2.1 },
      { arq: 'davi',       acao: 'Correr', cx: 18 * TILE, cz: 11 * TILE, raio: 10, fase: 4.0 },
      { arq: 'jovem_b',    acao: 'Andar',  cx: 18 * TILE, cz: 11 * TILE, raio: 19, fase: 1.1 },
      { arq: 'entregador', acao: 'Andar',  x: 17 * TILE, z: 14 * TILE + 4.8, ang: -Math.PI / 2, estatico: true },
      { arq: 'velha',      acao: 'Parado', x: 18 * TILE + 6, z: 11 * TILE + 7, ang: 2.8, estatico: true },
      { arq: 'policial',   acao: 'Parado', x: 132.5, z: 163.5, ang: 0.2, estatico: true },
      { arq: 'lia',        acao: 'Parado', x: TX - 10, z: TZ - 22, ang: Math.PI, estatico: true },
    ];
    for (const d of defs) {
      try {
        const p = await Personagem.carregar(`${BASE_BIB}/personagens/elenco/${d.arq}.glb`);
        p.obj.traverse(m => { if (m.isMesh) m.castShadow = true; });
        p.tocar(d.acao);
        p.piscarAuto(true);
        if (d.estatico) {
          p.obj.position.set(d.x, CALCADA, d.z);
          p.obj.rotation.y = d.ang;
        }
        mundo.add(p.obj);
        const vel = (p.info(d.acao).velocidade || (d.acao === 'Correr' ? 4.2 : 1.4));
        npcs.push({ p, ...d, vel });
      } catch (e) {
        console.warn('NPC skip:', d.arq, e);
      }
    }
  })());

  // Pisos restantes das quadras
  for (const [nome, gx, gz] of PISOS) if (!OCUPADO.has(k(gx, gz))) ladrilho(nome, gx, gz);

  let feitos = 0;
  const total = P.length;
  P.forEach(p => p.then(() => {
    feitos++;
    if (feitos % 25 === 0 || feitos === total) onProgresso(feitos / total, `Carregando cidade (${feitos}/${total})…`);
  }));
  await Promise.all(P);
  aplicarEstadoLuzes(noiteInicial);

  function alternarNoite(ligada) {
    chaoMat.color.setHex(ligada ? 0x2c4a2a : 0x6fa94c);
    aplicarEstadoLuzes(ligada);
    for (const h of halos) h.visible = ligada;
  }

  function atualizar(dt, t) {
    kit.tempo(t);
    for (const c of trafego) {
      c.o.position.z += c.sent * c.vel * dt;
      if (c.sent > 0 && c.o.position.z > c.max) c.o.position.z = c.min;
      if (c.sent < 0 && c.o.position.z < c.min) c.o.position.z = c.max;
    }
    for (const n of npcs) {
      n.p.atualizar(dt);
      if (!n.estatico) {
        const ang = n.fase + (t * n.vel) / n.raio;
        n.p.obj.position.set(n.cx + Math.cos(ang) * n.raio, CALCADA, n.cz + Math.sin(ang) * n.raio);
        n.p.obj.rotation.y = -ang;
      }
    }
    if (jatoVoando) {
      // Jato Hryz decolando periodicamente e sobrevoando a cidade em grande círculo
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
    atualizar,
    mapaInfo: { RUA, VX, HZ, ROT, RX, TX, TZ, PISTA },
  };
}
