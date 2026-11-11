// A casa em corte ("casa de bonecas"): sobrado de cinco andares sobre uma base escura, aberto na frente (+Z). O poço do elevador fica no centro-esquerda,
// a parede do poço do lado do corredor (+X) tem portas de correr em cada andar. A cabine fica entre o 2º e o 3º andar. Hora do dia, luzes, relógio de pé.
import * as THREE from 'three';
import { brilho, canvasTex } from './motor.js';
import { Lote, M } from './lote.js';
import * as T from './texturas.js';
import { mulberry32, clamp, lerp } from './util.js';
import { construirCabine } from './cabine.js';

export const H = 3.3, LAJE = 0.30, LX = 4.5, LZ = 8.0;
export const POCO = { cz: -0.80, xi: 0.74, xe: 0.94, zf: -1.60, largPorta: 0.90 };
export const Y_CAB = 5.6;                      // piso da cabine: entre o 2º (3,3 m) e o 3º andar (6,6 m)
export const NA = 5;                           // andares

const C = c => new THREE.Color(c);

export async function construirD(mundo) {
  const D = mundo;
  const d = { luzes: [], janelas: [], lustres: [], brilhos: [] };
  const raiz = new THREE.Group(); raiz.name = 'casa'; D.add(raiz); d.raiz = raiz;

  // ---------------------------------------------------------------- materiais
  const pedra = M(0xffffff, 0.92, { map: T.texPedra('#cfc2a2'), color: 0xe9e2d3 });
  const pedraEsc = M(0x8c8576, 0.95);
  const corte = M(0xf0e6d0, 0.9);                                                       // cor da face cortada das lajes
  const parquet = M(0xffffff, 0.55, { map: T.texMadeira('#8a5a35', '#4a2a14', '#b57e4e'), color: 0xdcc8b0 });
  const papeis = [T.texPapel('#2b4a3a', '#33574a'), T.texPapel('#5a1f2a', '#68303a', '#c8a85a'), T.texPapel('#27324f', '#2f3c5f', '#bda362'), T.texPapel('#4a3d34', '#55463b', '#c0a468'), T.texPapel('#2e4f4f', '#376060', '#c0a468')]
    .map(t => { t.repeat.set(1, 1); return M(0xffffff, 0.9, { map: t }); });
  const concreto = M(0xffffff, 1.0, { map: T.texConcreto('#9a9b9d') });
  const aco = M(0x4a4e55, 0.45, { metalness: 0.8 });
  const madEscura = M(0x3a2012, 0.5, { map: T.texMadeira('#4a2a16', '#241006', '#6a3e22'), metalness: 0.05 });
  const madMedia = M(0x7a4a2a, 0.5, { map: T.texMadeira('#7a4a2a', '#3a1c0c', '#a66f44'), metalness: 0.05 });
  const latao = M(0xc9a24a, 0.3, { metalness: 0.9 });
  const ouroFosco = M(0xb9923c, 0.45, { metalness: 0.85 });
  const branco = M(0xeee9df, 0.7);
  const marmore = M(0xe8e4da, 0.25, { metalness: 0.05 });
  const pretoBrilho = M(0x0b0b0d, 0.25, { metalness: 0.4 });
  const veludoVinho = M(0x6a1a2a, 0.95), veludoVerde = M(0x1e4a3a, 0.95), veludoAzul = M(0x22335e, 0.95), couro = M(0x3b2314, 0.5);
  const lencol = M(0xf2efe8, 0.9), cobertor = M(0x384a73, 0.9);
  const vidro = new THREE.MeshStandardMaterial({ color: 0xcfe4ee, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.28 });
  const feltro = M(0x1d5a3c, 0.95);
  const folha = M(0x2e5a32, 0.8), vaso = M(0xd9d2c2, 0.4);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xfff0d0, emissive: 0xffc27a, emissiveIntensity: 2.0, roughness: 0.6 });
  const chamaMat = new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xff9a40, emissiveIntensity: 3.0 });

  const L = new Lote(raiz);
  const Lp = new Lote(raiz, { emite: true, recebe: true });
  const yAndar = n => n * H;

  // ---------------------------------------------------------------- base escura (diorama), lajes, paredes
  L.caixa(13.5, 0.8, 12.5, M(0x15171d, 0.5, { metalness: 0.2 }), 0, -0.70, -4.1);
  L.caixa(13.9, 0.08, 12.9, M(0x2a2d36, 0.35, { metalness: 0.3 }), 0, -0.26, -4.1);
  for (let n = 0; n <= NA; n++) {
    const y = yAndar(n) - LAJE / 2;
    L.caixa(LX - 0.94, LAJE, LZ, parquet, -(LX + 0.94) / 2, y, -LZ / 2, { uv: 2.0 });
    L.caixa(LX - 0.94, LAJE, LZ, parquet, (LX + 0.94) / 2, y, -LZ / 2, { uv: 2.0 });
    L.caixa(1.88, LAJE, LZ - 1.60, parquet, 0, y, -(LZ + 1.60) / 2, { uv: 2.0 });
    L.caixa(LX - 0.94, LAJE * 0.9, 0.03, corte, -(LX + 0.94) / 2, y, 0.015); L.caixa(LX - 0.94, LAJE * 0.9, 0.03, corte, (LX + 0.94) / 2, y, 0.015);   // face cortada (frente)
  }
  // paredes externas: pedra por fora, papel por dentro (por andar)
  const alturaTotal = yAndar(NA) + 0.9;
  L.caixa(0.20, alturaTotal + 0.3, LZ, pedra, -LX + 0.10, (alturaTotal - 0.3) / 2, -LZ / 2, { uv: 3 });
  L.caixa(0.20, alturaTotal + 0.3, LZ, pedra, LX - 0.10, (alturaTotal - 0.3) / 2, -LZ / 2, { uv: 3 });
  L.caixa(2 * LX, alturaTotal + 0.3, 0.20, pedra, 0, (alturaTotal - 0.3) / 2, -LZ + 0.10, { uv: 3 });
  L.caixa(0.20, alturaTotal + 0.3, 0.03, corte, -LX + 0.10, (alturaTotal - 0.3) / 2, 0.015); L.caixa(0.20, alturaTotal + 0.3, 0.03, corte, LX - 0.10, (alturaTotal - 0.3) / 2, 0.015);
  for (let n = 0; n < NA; n++) {
    const hh = H - LAJE, yc = yAndar(n) + hh / 2;
    const p = papeis[n % papeis.length];
    L.caixa(0.10, hh, LZ, p, -LX + 0.25, yc, -LZ / 2, { uv: 1.0 }); L.caixa(0.10, hh, LZ, p, LX - 0.25, yc, -LZ / 2, { uv: 1.0 }); L.caixa(2 * LX - 0.4, hh, 0.10, p, 0, yc, -LZ + 0.25, { uv: 1.0 });
    // rodapé e friso de gesso
    L.caixa(2 * LX - 0.4, 0.14, 0.04, branco, 0, yAndar(n) + 0.07, -LZ + 0.32); L.caixa(0.04, 0.14, LZ - 0.4, branco, -LX + 0.32, yAndar(n) + 0.07, -LZ / 2); L.caixa(0.04, 0.14, LZ - 0.4, branco, LX - 0.32, yAndar(n) + 0.07, -LZ / 2);
    L.caixa(2 * LX - 0.4, 0.12, 0.08, branco, 0, yAndar(n) + hh - 0.06, -LZ + 0.34); L.caixa(0.08, 0.12, LZ - 0.4, branco, -LX + 0.34, yAndar(n) + hh - 0.06, -LZ / 2); L.caixa(0.08, 0.12, LZ - 0.4, branco, LX - 0.34, yAndar(n) + hh - 0.06, -LZ / 2);
  }
  // cornija e parapeito do telhado
  L.caixa(2 * LX + 0.5, 0.25, LZ + 0.4, pedra, 0, yAndar(NA) + 0.12, -LZ / 2 - 0.1, { uv: 3 });
  L.caixa(2 * LX + 0.2, 0.8, 0.2, pedra, 0, yAndar(NA) + 0.65, -LZ + 0.1, { uv: 3 });
  L.caixa(0.2, 0.8, LZ, pedra, -LX + 0.1, yAndar(NA) + 0.65, -LZ / 2, { uv: 3 }); L.caixa(0.2, 0.8, LZ, pedra, LX - 0.1, yAndar(NA) + 0.65, -LZ / 2, { uv: 3 });

  // ---------------------------------------------------------------- poço do elevador
  const pz0 = POCO.zf - 0.15, pz1 = 0.0, pzc = (pz0 + pz1) / 2, pl = pz1 - pz0;
  const yTopo = yAndar(NA) + 1.9;
  L.caixa(0.20, yTopo + 0.5, pl, concreto, -POCO.xe + 0.10, (yTopo - 0.5) / 2 + 0.0, pzc, { uv: 1.6 });                   // parede esquerda
  L.caixa(2 * POCO.xe, yTopo + 0.5, 0.15, concreto, 0, (yTopo - 0.5) / 2, POCO.zf - 0.075, { uv: 1.6 });                  // fundo
  L.caixa(2 * POCO.xe, 0.45, pl, concreto, 0, -0.52, pzc);                                                                 // fundo do poço
  const hall = M(0xffffff, 0.9, { map: T.texConcreto('#8b8579') });
  // parede do lado do corredor, com vãos de porta nos andares (grupo próprio: some no corte da casa de bonecas)
  const pw = new THREE.Group(); pw.name = 'paredePoco'; raiz.add(pw); d.paredePoco = pw;
  const Lw = new Lote(pw);
  const zA = POCO.cz - POCO.largPorta / 2, zB = POCO.cz + POCO.largPorta / 2;
  for (let n = 0; n < NA; n++) {
    const y0 = yAndar(n), alt = 2.1;
    const yb = n === 0 ? -0.5 : y0 - 0.5 * 0;                                          // a parede começa no piso (n = 0 desce até a base)
    Lw.caixa(0.20, alt, zA - pz0, concreto, POCO.xi + 0.10, y0 + alt / 2, (pz0 + zA) / 2, { uv: 1.6 });
    Lw.caixa(0.20, alt, pz1 - zB, concreto, POCO.xi + 0.10, y0 + alt / 2, (zB + pz1) / 2, { uv: 1.6 });
    Lw.caixa(0.20, H - alt, pl, concreto, POCO.xi + 0.10, y0 + alt + (H - alt) / 2, pzc, { uv: 1.6 });
    // soleira e batente de madeira
    Lw.caixa(0.30, 0.04, POCO.largPorta + 0.12, latao, POCO.xi + 0.10, y0 - 0.02 + 0.02, POCO.cz);
    Lw.caixa(0.22, alt + 0.06, 0.06, madEscura, POCO.xi + 0.10, y0 + alt / 2, zA - 0.03); Lw.caixa(0.22, alt + 0.06, 0.06, madEscura, POCO.xi + 0.10, y0 + alt / 2, zB + 0.03);
    Lw.caixa(0.22, 0.07, POCO.largPorta + 0.18, madEscura, POCO.xi + 0.10, y0 + alt + 0.02, POCO.cz);
  }
  Lw.fechar();
  // trilhos de guia (aço) e conduíte no fundo do poço
  for (const x of [-0.50, 0.50]) L.caixa(0.07, yTopo + 0.5, 0.05, aco, x, (yTopo - 0.5) / 2, POCO.zf + 0.025);
  L.cilindro(0.025, 0.025, yTopo + 0.5, M(0x6a6d72, 0.5, { metalness: 0.5 }), -0.66, (yTopo - 0.5) / 2, POCO.zf + 0.06, { seg: 8 });
  // lâmpadas de serviço no fundo do poço (um par por andar), só emissivas
  { const bm = new THREE.MeshStandardMaterial({ color: 0xfff0d0, emissive: 0xffc070, emissiveIntensity: 2.2 });
    for (let n = 0; n < NA; n++) for (const x of [-0.58, 0.58]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), bm); b.position.set(x, yAndar(n) + 2.75, POCO.zf + 0.12); raiz.add(b); const gl = brilho('255,196,120', 0.55, 0.55); gl.position.copy(b.position); raiz.add(gl); } }
  // casa de máquinas no topo do poço: caixa aberta na frente, motor e polia
  L.caixa(2 * POCO.xe, 0.2, pl, concreto, 0, yAndar(NA) + 1.9 + 0.1, pzc);
  L.cilindro(0.34, 0.34, 0.16, aco, 0.0, yAndar(NA) + 1.15, POCO.cz, { seg: 18, rx: Math.PI / 2 });
  L.caixa(0.7, 0.45, 0.5, M(0x2a5c8a, 0.5, { metalness: 0.4 }), -0.35, yAndar(NA) + 0.72, POCO.cz);
  d.motor = null;

  // portas de correr do poço (duas folhas por andar; z = zA..POCO.cz e POCO.cz..zB), do lado do corredor
  const matPorta = M(0xffffff, 0.45, { map: T.texLambri({ base: '#6a3d24', escuro: '#2c140a', claro: '#9a6240' }), bumpMap: T.texLambri({ bump: true }), bumpScale: 1.8 });
  d.portas = [];
  const lf = POCO.largPorta / 2;
  for (let n = 0; n < NA; n++) {
    const y0 = yAndar(n);
    const mk = (z0, z1) => {
      const gg = new THREE.Group(); gg.position.set(POCO.xe + 0.025, y0 + 1.05 + 0.01, 0);
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.045, 2.06, z1 - z0), matPorta); m.position.z = (z0 + z1) / 2; m.castShadow = true; m.receiveShadow = true; gg.add(m);
      // puxador de latão perto do centro
      const pux = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 8), latao); pux.position.set(0.04, -0.05, z0 < POCO.cz ? POCO.cz - 0.07 : POCO.cz + 0.07); pux.castShadow = true; gg.add(pux);
      pw.add(gg); return gg;
    };
    d.portas.push({ A: mk(zA, POCO.cz - 0.003), B: mk(POCO.cz + 0.003, zB), abertura: 0 });
  }
  d.abrirPorta = (n, s) => {                                                                   // s em metros de abertura (cada folha anda s / 2 para cada lado)
    const p = d.portas[n]; p.A.position.z = -s / 2; p.B.position.z = s / 2;
  };

  // ---------------------------------------------------------------- cabine, cabos, contrapeso
  const cab = construirCabine(); cab.grupo.position.set(0, Y_CAB, POCO.cz); raiz.add(cab.grupo); d.cab = cab;
  const cabos = [];
  for (const dz of [-0.35, -0.12, 0.12, 0.35]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 1, 6), aco); c.position.set(-0.10, 0, POCO.cz + dz); raiz.add(c); cabos.push(c); }
  d.cabos = cabos;
  const contra = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.7, 0.14), M(0x5a5d63, 0.6, { metalness: 0.6 })); contra.position.set(-0.10, 10, POCO.zf + 0.25); contra.castShadow = true; raiz.add(contra); d.contra = contra;
  d.cabinePos = y => {
    cab.grupo.position.y = y;
    const topoCab = y + 2.4, yPolia = yAndar(NA) + 1.15;
    cabos.forEach(c => { c.scale.y = yPolia - topoCab; c.position.y = topoCab + (yPolia - topoCab) / 2; });
    contra.position.y = (yPolia - 1.2) - (y - 1.0) * 0.55 - 3.6;
  };
  d.cabinePos(Y_CAB);

  // ---------------------------------------------------------------- janelas no fundo (luz do dia/noite; cortinas)
  const janMat = [];
  const janela = (n, x) => {
    const y0 = yAndar(n) + 0.55, w = 1.3, h = 2.1;
    const m = new THREE.MeshBasicMaterial({ color: 0x88aadd });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y0 + h / 2, -LZ + 0.305); raiz.add(p); janMat.push(m);
    // caixilho
    const e = 0.07;
    L.caixa(w + 2 * e, e, 0.07, branco, x, y0 + h + e / 2, -LZ + 0.33); L.caixa(w + 2 * e, e, 0.10, branco, x, y0 - e / 2, -LZ + 0.34);
    L.caixa(e, h, 0.07, branco, x - w / 2 - e / 2, y0 + h / 2, -LZ + 0.33); L.caixa(e, h, 0.07, branco, x + w / 2 + e / 2, y0 + h / 2, -LZ + 0.33);
    L.caixa(0.04, h, 0.05, branco, x, y0 + h / 2, -LZ + 0.33); L.caixa(w, 0.04, 0.05, branco, x, y0 + h * 0.62, -LZ + 0.33);
    // cortinas
    const cor = [veludoVinho, veludoAzul, veludoVerde][n % 3];
    L.caixa(0.36, h + 0.35, 0.16, cor, x - w / 2 - 0.30, y0 + h / 2 + 0.12, -LZ + 0.40); L.caixa(0.36, h + 0.35, 0.16, cor, x + w / 2 + 0.30, y0 + h / 2 + 0.12, -LZ + 0.40);
    L.caixa(w + 1.2, 0.07, 0.10, ouroFosco, x, y0 + h + 0.26, -LZ + 0.36);
  };
  for (let n = 0; n < NA; n++) { janela(n, -2.7); janela(n, 2.7); }
  d.janMat = janMat;

  // ---------------------------------------------------------------- ajudantes de mobília (coordenadas absolutas; y relativo ao piso do andar n)
  const caixaN = (n, w, h, dd, mat, x, y, z, o = {}) => L.caixa(w, h, dd, mat, x, yAndar(n) + y, z, o);
  const lustre = (n, x, z, raio = 0.5, velas = 8) => {
    const yt = yAndar(n) + H - LAJE;
    L.cilindro(0.02, 0.02, 0.9, ouroFosco, x, yt - 0.45, z, { seg: 8 });
    L.cilindro(raio, raio, 0.04, ouroFosco, x, yt - 0.95, z, { seg: 24 });
    L.cilindro(raio * 0.4, raio * 0.4, 0.28, ouroFosco, x, yt - 0.82, z, { seg: 14 });
    for (let i = 0; i < velas; i++) {
      const a = i / velas * Math.PI * 2, px = x + Math.cos(a) * raio, pz = z + Math.sin(a) * raio;
      L.cilindro(0.016, 0.016, 0.13, branco, px, yt - 0.86, pz, { seg: 6 });
      const ch = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), chamaMat); ch.position.set(px, yt - 0.76, pz); ch.scale.y = 1.5; raiz.add(ch); d.lustres.push(ch);
    }
    const gl = brilho('255,196,120', raio * 3.2, 0.0); gl.position.set(x, yt - 0.85, z); raiz.add(gl); d.brilhos.push(gl);
  };
  const cadeira = (n, x, z, ry, mat = veludoVinho) => {
    const y0 = yAndar(n);
    L.caixa(0.46, 0.06, 0.46, mat, x, y0 + 0.47, z, { ry });
    const c = Math.cos(ry), s = Math.sin(ry);
    L.caixa(0.46, 0.55, 0.05, madEscura, x - 0.215 * s, y0 + 0.78, z - 0.215 * c, { ry });
    for (const [lx, lz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) L.caixa(0.04, 0.44, 0.04, madEscura, x + lx * c + lz * s, y0 + 0.22, z - lx * s + lz * c);
  };
  const quadro = (n, x, y, z, w, h, seed, ry = 0) => {
    const y0 = yAndar(n) + y;
    L.caixa(w + 0.14, h + 0.14, 0.05, ouroFosco, x, y0, z, { ry });
    const q = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: T.texQuadro(seed), roughness: 0.7 }));
    q.position.set(x, y0, z); q.rotation.y = ry; q.translateZ(0.03); raiz.add(q);
  };
  const planta = (n, x, z, esc = 1) => {
    const y0 = yAndar(n);
    L.cilindro(0.2 * esc, 0.15 * esc, 0.4 * esc, vaso, x, y0 + 0.2 * esc, z, { seg: 12 });
    const r = mulberry32(Math.floor(x * 7 + z * 3 + n * 11) & 255);
    for (let i = 0; i < 9; i++) L.esfera((0.10 + r() * 0.1) * esc, folha, x + (r() - 0.5) * 0.4 * esc, y0 + (0.55 + r() * 0.65) * esc, z + (r() - 0.5) * 0.4 * esc, { seg: 7 });
  };
  const abajur = (n, x, y, z, esc = 1) => {
    const y0 = yAndar(n) + y;
    L.cilindro(0.04 * esc, 0.05 * esc, 0.22 * esc, ouroFosco, x, y0 + 0.11 * esc, z, { seg: 8 });
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * esc, 0.12 * esc, 0.18 * esc, 14, 1, true), lampMat); s.position.set(x, y0 + 0.30 * esc, z); raiz.add(s);
    const gl = brilho('255,196,120', 0.9 * esc, 0.0); gl.position.set(x, y0 + 0.30 * esc, z); raiz.add(gl); d.brilhos.push(gl);
  };

  // ---------------------------------------------------------------- andar 1 (n = 0): sala de jantar
  {
    const n = 0, y0 = 0;
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.0), new THREE.MeshStandardMaterial({ map: T.texTapete('#1f2a4a', '#c9a857', '#6b1f2a'), roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(-2.3, y0 + 0.012, -3.9); rug.receiveShadow = true; raiz.add(rug);
    caixaN(n, 2.8, 0.09, 1.15, madEscura, -2.3, 0.78, -3.9);
    for (const [lx, lz] of [[-1.2, -0.45], [1.2, -0.45], [-1.2, 0.45], [1.2, 0.45]]) caixaN(n, 0.12, 0.74, 0.12, madEscura, -2.3 + lx, 0.37, -3.9 + lz);
    for (const x of [-3.2, -2.3, -1.4]) { cadeira(n, x, -2.95, Math.PI); cadeira(n, x, -4.85, 0); }
    caixaN(n, 2.2, 0.95, 0.55, madEscura, 0.0, 0.475, -7.35);
    for (const x of [-0.6, 0.0, 0.6]) caixaN(n, 0.04, 0.12, 0.03, latao, x, 0.72, -7.06);
    quadro(n, 0.0, 1.95, -7.65, 1.5, 0.95, 1);
    lustre(n, -2.3, -3.9, 0.55, 8);
    planta(n, -4.0, -0.9, 1.1); planta(n, 3.8, -7.0, 1.2);
    abajur(n, -0.8, 0.95, -7.35, 1.0);
    // entrada: console + espelho
    caixaN(n, 1.5, 0.08, 0.38, marmore, 3.5, 0.82, -2.0); caixaN(n, 0.06, 0.8, 0.30, ouroFosco, 2.85, 0.4, -2.0); caixaN(n, 0.06, 0.8, 0.30, ouroFosco, 4.15, 0.4, -2.0);
  }
  // ---------------------------------------------------------------- andar 2 (n = 1): salão com piano, sofás, lareira e relógio de pé
  {
    const n = 1, y0 = yAndar(1);
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.0), new THREE.MeshStandardMaterial({ map: T.texTapete('#6b1f2a', '#c9a857', '#1f2a4a'), roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(2.2, y0 + 0.012, -3.6); rug.receiveShadow = true; raiz.add(rug);
    // sofás frente a frente e mesa de centro
    // sofá de costas para o fundo (olhando para a frente) e sofá de frente para ele, espaçados em Z
    L.caixa(2.1, 0.42, 0.92, veludoVerde, 2.2, y0 + 0.30, -2.55); L.caixa(2.1, 0.55, 0.22, veludoVerde, 2.2, y0 + 0.72, -2.2); L.caixa(0.22, 0.30, 0.92, veludoVerde, 3.15, y0 + 0.56, -2.55); L.caixa(0.22, 0.30, 0.92, veludoVerde, 1.25, y0 + 0.56, -2.55);
    L.caixa(2.1, 0.42, 0.92, veludoVerde, 2.2, y0 + 0.30, -4.75); L.caixa(2.1, 0.55, 0.22, veludoVerde, 2.2, y0 + 0.72, -5.10); L.caixa(0.22, 0.30, 0.92, veludoVerde, 3.15, y0 + 0.56, -4.75); L.caixa(0.22, 0.30, 0.92, veludoVerde, 1.25, y0 + 0.56, -4.75);
    L.caixa(1.1, 0.04, 0.7, vidro, 2.2, y0 + 0.43, -3.65); for (const [lx, lz] of [[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.3], [0.5, 0.3]]) L.caixa(0.04, 0.4, 0.04, ouroFosco, 2.2 + lx, y0 + 0.2, -3.65 + lz);
    // lareira com quadro por cima (parede direita)
    L.caixa(0.5, 1.15, 2.0, branco, 4.0, y0 + 0.575, -5.2); L.caixa(0.62, 0.10, 2.3, marmore, 3.95, y0 + 1.2, -5.2); L.caixa(0.1, 0.8, 1.2, M(0x120a06, 1), 3.72, y0 + 0.42, -5.2);
    const fogo = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), new THREE.MeshBasicMaterial({ color: 0xff7a22 })); fogo.rotation.y = -Math.PI / 2; fogo.position.set(3.76, y0 + 0.42, -5.2); raiz.add(fogo); d.fogo = fogo;
    quadro(n, 4.18, y0 + 2.0 - y0, -5.2, 1.6, 1.0, 3, -Math.PI / 2);
    // piano de cauda (esquerda)
    L.caixa(1.55, 0.34, 2.0, pretoBrilho, -2.8, y0 + 0.78, -4.6); L.caixa(1.4, 0.04, 0.05, branco, -2.8, y0 + 0.97, -3.6);
    L.caixa(1.55, 0.04, 0.9, pretoBrilho, -2.8, y0 + 0.98, -3.7);
    for (const [lx, lz] of [[-0.7, -0.9], [0.7, -0.9], [0, 0.95]]) L.caixa(0.1, 0.62, 0.1, pretoBrilho, -2.8 + lx, y0 + 0.31, -4.6 + lz);
    L.caixa(0.7, 0.05, 0.35, couro, -2.8, y0 + 0.50, -3.1);
    // relógio de pé (de frente, parede do fundo, ao lado do poço)
    d.relogioPos = new THREE.Vector3(1.4, y0, -7.48);
    L.caixa(0.62, 2.7, 0.36, madMedia, 1.4, y0 + 1.35, -7.50); L.caixa(0.72, 0.18, 0.44, madEscura, 1.4, y0 + 2.76, -7.48); L.caixa(0.70, 0.14, 0.44, madEscura, 1.4, y0 + 0.07, -7.48);
    L.caixa(0.38, 0.62, 0.03, vidro, 1.4, y0 + 0.98, -7.30);
    const mostrador = new THREE.Mesh(new THREE.CircleGeometry(0.24, 40), new THREE.MeshStandardMaterial({ map: T.texRelogio(), roughness: 0.6 })); mostrador.position.set(1.4, y0 + 2.0, -7.31); raiz.add(mostrador); d.mostrador = mostrador;
    const mkPonteiro = (len, larg, mat) => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(larg, len, 0.004), mat); m.position.y = len / 2 - 0.02; g.add(m); g.position.set(1.4, y0 + 2.0, -7.30); raiz.add(g); return g; };
    d.pHora = mkPonteiro(0.14, 0.018, pretoBrilho); d.pMin = mkPonteiro(0.21, 0.012, pretoBrilho); d.pHora.position.z += 0.003; d.pMin.position.z += 0.006;
    const pend = new THREE.Group(); pend.position.set(1.4, y0 + 1.30, -7.32); const haste = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.58, 0.01), latao); haste.position.y = -0.29; pend.add(haste);
    const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.012, 20), latao); disco.rotation.x = Math.PI / 2; disco.position.y = -0.60; pend.add(disco); raiz.add(pend); d.pendulo = pend;
    lustre(n, 2.2, -3.65, 0.6, 10);
    planta(n, -4.0, -7.0, 1.3); planta(n, 4.0, -1.0, 0.9);
    quadro(n, -0.3, 2.0, -7.65, 0.9, 1.2, 4);
    abajur(n, 3.0, 0.5, -2.0, 1.0);
  }
  // ---------------------------------------------------------------- andar 3 (n = 2): biblioteca e hall do elevador
  {
    const n = 2, y0 = yAndar(2);
    // estantes de livros (fundo, esquerda) com lombadas
    const livros = canvasTex(256, 128, (g, w, h) => {
      const r = mulberry32(5); g.fillStyle = '#1b0f08'; g.fillRect(0, 0, w, h);
      for (let j = 0; j < 4; j++) { let x = 3; while (x < w - 6) { const lw = 5 + r() * 9; g.fillStyle = ['#6a1a24', '#1e3a52', '#2d5a3a', '#7a5a2a', '#3a2a4a', '#8a7a5a', '#222'][Math.floor(r() * 7)]; g.fillRect(x, j * 32 + 3 + r() * 6, lw, 29 - r() * 6); x += lw + 1; } g.fillStyle = '#3a2412'; g.fillRect(0, j * 32 + 31, w, 2); }
    }, { aniso: 4 });
    for (const x of [-3.3, -1.1]) {
      L.caixa(2.1, 2.9, 0.38, madEscura, x, y0 + 1.45, -7.40);
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 2.7), new THREE.MeshStandardMaterial({ map: livros, roughness: 0.8 })); pl.position.set(x, y0 + 1.45, -7.205); raiz.add(pl);
    }
    caixaN(n, 1.9, 0.08, 0.9, couro, -2.2, 0.76, -4.6); for (const [lx, lz] of [[-0.85, -0.38], [0.85, -0.38], [-0.85, 0.38], [0.85, 0.38]]) caixaN(n, 0.1, 0.72, 0.1, madEscura, -2.2 + lx, 0.36, -4.6 + lz);
    cadeira(n, -2.2, -3.65, Math.PI, couro);
    const globo = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), M(0x3a6a8a, 0.5)); globo.position.set(-1.6, y0 + 1.03, -4.6); raiz.add(globo); L.cilindro(0.02, 0.02, 0.2, latao, -1.6, y0 + 0.9, -4.6, { seg: 6 });
    // hall do poço: tapete de passadeira, console com vaso, espelho dourado, arandelas
    const run = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.1), new THREE.MeshStandardMaterial({ map: T.texTapete('#7a1c2a', '#c9a857', '#14203d'), roughness: 1 })); run.rotation.x = -Math.PI / 2; run.position.set(2.5, y0 + 0.012, POCO.cz); run.receiveShadow = true; raiz.add(run);
    caixaN(n, 0.5, 0.08, 1.4, marmore, 4.0, 0.80, -3.3); caixaN(n, 0.40, 0.78, 0.08, ouroFosco, 4.0, 0.39, -2.65); caixaN(n, 0.40, 0.78, 0.08, ouroFosco, 4.0, 0.39, -3.95);
    L.cilindro(0.09, 0.07, 0.34, vaso, 4.0, y0 + 1.01, -3.3, { seg: 10 }); for (let i = 0; i < 6; i++) L.esfera(0.08, branco, 4.0 + (i % 3 - 1) * 0.07, y0 + 1.30 + (i % 2) * 0.1, -3.3 + (i - 2.5) * 0.04, { seg: 7 });
    L.caixa(0.06, 1.6, 0.95, ouroFosco, 4.15, y0 + 1.95, -3.3);
    const espelho = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.5), new THREE.MeshStandardMaterial({ color: 0x9fb0c0, metalness: 0.85, roughness: 0.18 })); espelho.rotation.y = -Math.PI / 2; espelho.position.set(4.11, y0 + 1.95, -3.3); raiz.add(espelho);
    for (const z of [-2.2, -4.4]) abajur(n, 4.0, 1.7, z, 0.0001);
    for (const z of [-0.85, -6.0]) { const arand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), lampMat); arand.position.set(4.15, y0 + 2.0, z); raiz.add(arand); L.caixa(0.06, 0.12, 0.1, ouroFosco, 4.18, y0 + 2.0, z); const gl = brilho('255,196,120', 0.8, 0); gl.position.copy(arand.position); raiz.add(gl); d.brilhos.push(gl); }
    quadro(n, 1.25, 2.0, -4.6, 1.2, 0.85, 6, Math.PI / 2 * 0 + Math.PI / 2 * 0);
    planta(n, 3.8, -0.5, 1.0);
    lustre(n, 2.4, -3.6, 0.45, 6);
  }
  // ---------------------------------------------------------------- andar 4 (n = 3): quarto principal
  {
    const n = 3, y0 = yAndar(3);
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 3.4), new THREE.MeshStandardMaterial({ map: T.texTapete('#2a3a5e', '#c9a857', '#6b1f2a'), roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0.0, y0 + 0.012, -4.2); rug.receiveShadow = true; raiz.add(rug);
    L.caixa(2.2, 0.50, 2.3, madEscura, 0.0, y0 + 0.25, -5.7); L.caixa(2.0, 0.28, 2.1, lencol, 0.0, y0 + 0.64, -5.7); L.caixa(2.0, 0.10, 1.2, cobertor, 0.0, y0 + 0.82, -5.15);
    L.caixa(2.3, 1.5, 0.12, madEscura, 0.0, y0 + 1.05, -6.85); for (const x of [-0.55, 0.0, 0.55]) L.caixa(0.5, 0.14, 0.32, lencol, x, y0 + 0.82, -6.4);
    for (const x of [-1.6, 1.6]) { L.caixa(0.5, 0.55, 0.45, madMedia, x, y0 + 0.275, -6.6); abajur(n, x, 0.55, -6.6, 1.0); }
    L.caixa(0.6, 2.4, 2.0, madMedia, -3.85, y0 + 1.2, -4.5); for (const dz of [-0.1, 0.1]) L.caixa(0.03, 0.5, 0.04, latao, -3.52, y0 + 1.2, -4.5 + dz);
    L.caixa(1.3, 0.45, 0.6, veludoAzul, 2.4, y0 + 0.28, -3.0);
    quadro(n, 0.0, 2.3, -7.66, 1.4, 0.9, 7);
    lustre(n, 0.0, -4.2, 0.45, 6);
    planta(n, 3.9, -0.7, 1.0);
  }
  // ---------------------------------------------------------------- andar 5 (n = 4): sala de bilhar
  {
    const n = 4, y0 = yAndar(4);
    L.caixa(2.6, 0.18, 1.5, madEscura, -2.0, y0 + 0.84, -4.2); L.caixa(2.3, 0.04, 1.25, feltro, -2.0, y0 + 0.94, -4.2);
    for (const [lx, lz] of [[-1.15, -0.6], [1.15, -0.6], [-1.15, 0.6], [1.15, 0.6]]) L.caixa(0.18, 0.78, 0.18, madEscura, -2.0 + lx, y0 + 0.39, -4.2 + lz);
    const bolas = ['#c0392b', '#f1c40f', '#2980b9', '#ecf0f1', '#8e44ad'];
    bolas.forEach((c, i) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), M(c, 0.3)); b.position.set(-2.4 + i * 0.28, y0 + 0.995, -4.2 + ((i * 37) % 5 - 2) * 0.12); raiz.add(b); });
    lustre(n, -2.0, -4.2, 0.4, 5);
    for (const dx of [0, 1]) { const lampB = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 0.2, 18, 1, true), M(0x1d6b46, 0.6, { side: THREE.DoubleSide })); lampB.position.set(-2.0 + dx * 0.0, y0 + H - LAJE - 0.9, -4.2); raiz.add(lampB); break; }
    L.caixa(2.4, 0.9, 0.5, madEscura, 0.0, y0 + 0.45, -7.4);
    L.caixa(0.06, 1.8, 0.04, madMedia, 3.9, y0 + 0.9, -3.0, { rz: 0.06 }); L.caixa(0.06, 1.8, 0.04, madMedia, 3.8, y0 + 0.9, -3.15, { rz: -0.05 });
    planta(n, 3.8, -0.8, 1.2);
    quadro(n, 0.0, 2.2, -7.66, 1.6, 1.0, 8);
  }
  L.fechar();

  // ---------------------------------------------------------------- céu (domo com gradiente por hora), sol e lua decorativos atrás da casa
  const cvs = document.createElement('canvas'); cvs.width = 512; cvs.height = 256; const g2 = cvs.getContext('2d');
  const texCeuD = new THREE.CanvasTexture(cvs); texCeuD.colorSpace = THREE.SRGBColorSpace;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(140, 24, 16), new THREE.MeshBasicMaterial({ map: texCeuD, side: THREE.BackSide, fog: false, depthWrite: false })); dome.renderOrder = -10; dome.frustumCulled = false; D.add(dome); d.dome = dome;
  const estrelas = []; { const r = mulberry32(77); for (let i = 0; i < 160; i++) estrelas.push([r() * 512, r() * 120, 0.4 + r() * 1.2, 0.3 + r() * 0.7]); }
  const sunS = brilho('255,214,150', 26, 1), moonS = brilho('190,205,255', 12, 1); D.add(sunS, moonS); d.sunS = sunS; d.moonS = moonS;
  const disco = (cor, r) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 28), new THREE.MeshBasicMaterial({ color: cor, fog: false })); D.add(m); return m; };
  d.sunD = disco(0xfff1c8, 3.2); d.moonD = disco(0xe8eeff, 2.2);
  d.ceu = (h, sol, alvaPoente) => {
    const keys = [[0, '#04060f', '#0b1226'], [4.5, '#0a1024', '#1a2444'], [6.2, '#2b3a68', '#e58a5a'], [8, '#5f85bd', '#d6e2ee'], [12, '#5e8fd0', '#cfe3f5'], [16.5, '#5a82c2', '#e1dcc8'], [18.0, '#252d58', '#e2784c'], [19.6, '#0c1330', '#3a2a48'], [24, '#04060f', '#0b1226']];
    let i = 0; while (i < keys.length - 2 && h > keys[i + 1][0]) i++;
    const a = keys[i], b = keys[i + 1], k = clamp((h - a[0]) / (b[0] - a[0]));
    const mix = (c1, c2) => { const x = new THREE.Color(c1).lerp(new THREE.Color(c2), k); return '#' + x.getHexString(); };
    const gr = g2.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, mix(a[1], b[1])); gr.addColorStop(0.18, mix(a[1], b[1])); gr.addColorStop(0.5, mix(a[2], b[2])); gr.addColorStop(1, mix(a[2], b[2]));
    g2.fillStyle = gr; g2.fillRect(0, 0, 512, 256);
    const noite = 1 - clamp(sol * 3.5);
    if (noite > 0.05) { for (const [x, y, r, a2] of estrelas) { g2.fillStyle = `rgba(255,255,255,${a2 * noite})`; g2.fillRect(x, y, r, r); } }
    texCeuD.needsUpdate = true;
  };

  // janela grande no corredor do 3º andar (só aparece no resgate: a luz do dia que inunda a cabine)
  { const jan = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.5), new THREE.MeshBasicMaterial({ color: 0xfff3dc })); jan.rotation.y = -Math.PI / 2; jan.position.set(4.17, yAndar(2) + 1.65, -1.3); raiz.add(jan);
    const gl = brilho('255,240,210', 7.5, 0.55); gl.position.set(4.0, yAndar(2) + 1.65, -1.3); raiz.add(gl);
    jan.visible = false; gl.visible = false;
    d.luzJanela = (v, k = 1) => { jan.visible = v; gl.visible = v; gl.material.opacity = 0.55 * k; jan.material.color.setRGB(1.0 * (0.6 + 0.4 * k), 0.95 * (0.6 + 0.4 * k), 0.86 * (0.6 + 0.4 * k)); }; }
  // ---------------------------------------------------------------- luzes: sol/lua, hemisfério, luzes dos andares, luz da fresta (spot do corredor)
  d.hemi = new THREE.HemisphereLight(0xaac0e0, 0x282018, 0.5); D.add(d.hemi);
  d.sol = new THREE.DirectionalLight(0xfff0d8, 2.0); d.sol.castShadow = true; d.sol.shadow.mapSize.set(1536, 1536);
  Object.assign(d.sol.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 90 }); d.sol.shadow.bias = -0.0004; d.sol.shadow.normalBias = 0.05; d.sol.shadow.radius = 3;
  d.sol.target.position.set(0, 6, -4); D.add(d.sol, d.sol.target);
  d.lua = new THREE.DirectionalLight(0x7f98d8, 0.5); d.lua.position.set(-8, 14, 16); d.lua.target.position.set(0, 6, -4); D.add(d.lua, d.lua.target);
  d.luzAndar = [];
  for (let n = 0; n < NA; n++) {
    const pl = new THREE.PointLight(0xffc27a, 0, 11, 1.7); pl.position.set(n === 2 ? 2.3 : (n === 3 ? -2.2 : 0.4), yAndar(n) + 2.5, -3.6); D.add(pl); d.luzAndar.push(pl);
  }
  // luz do corredor do 3º andar que entra pela fresta das portas (spot com sombra: as bordas da grade desenham sombras no rosto)
  d.fenda = new THREE.SpotLight(0xffe2b0, 0, 14, 0.72, 0.35, 1.2);
  d.fenda.position.set(3.0, yAndar(2) + 1.55, POCO.cz); d.fenda.target.position.set(0, yAndar(2) + 0.55, POCO.cz);
  d.fenda.castShadow = true; d.fenda.shadow.mapSize.set(1024, 1024); d.fenda.shadow.bias = -0.0003; d.fenda.shadow.normalBias = 0.01; d.fenda.shadow.radius = 1.5; d.fenda.shadow.camera.near = 0.5; d.fenda.shadow.camera.far = 8;
  D.add(d.fenda, d.fenda.target);

  // ---------------------------------------------------------------- hora do dia (h em horas 0..24, contínuo)
  const corNoite = C(0x070b17), corAlba = C(0x4a3a50), corDia = C(0x9fb2c8), corPoente = C(0x6b4a52);
  const lerpC = (a, b, k) => a.clone().lerp(b, clamp(k));
  d.hora = (h, { luzesLigadas = null } = {}) => {
    h = ((h % 24) + 24) % 24;
    const elev = Math.sin((h - 6) / 12 * Math.PI);                              // > 0 de 6 h às 18 h
    const sol = Math.max(0, elev);
    const alvaPoente = Math.max(0, 1 - Math.abs(elev) * 3.2) * (h > 4.5 && h < 19.5 ? 1 : 0);
    const ang = (h - 6) / 12 * Math.PI;                                          // 0 = nascente (x +), PI = poente (x -)
    d.sol.position.set(Math.cos(ang) * 22, 14 + Math.max(0.1, elev) * 14, 24 + Math.sin(ang) * 4); d.sol.target.position.set(0, 6, -4);
    const cSol = C(0xffe9cf).lerp(C(0xff9a58), alvaPoente);
    d.sol.color.copy(cSol); d.sol.intensity = 2.7 * Math.pow(sol, 0.7);
    d.lua.intensity = 0.55 * (1 - clamp(sol * 4));
    d.hemi.intensity = 0.28 + 1.15 * sol; d.hemi.color.copy(lerpC(C(0x6a82b8), C(0xbcd0ea), sol));
    const noite = 1 - clamp(sol * 3.5);
    const luz = luzesLigadas === null ? noite : luzesLigadas;
    d.luzAndar.forEach(l => { l.intensity = 20 * luz + 13 * sol * (1 - luz); l.color.copy(lerpC(C(0xffc27a), C(0xdfeaff), sol * (1 - luz))); });
    d.lampMat = lampMat; lampMat.emissiveIntensity = 0.4 + 2.2 * luz; chamaMat.emissiveIntensity = 0.5 + 3.0 * luz;
    d.brilhos.forEach(b => { b.material.opacity = 0.8 * luz; });
    d.fogo.material.color.setRGB(1.0, 0.45 + 0.1 * Math.sin(h * 40), 0.12);
    // janelas: azul-claro de dia, laranja no poente, azul-escuro à noite
    const cj = lerpC(lerpC(C(0x0a1428), C(0xcfe0f2), sol), C(0xff9a60), alvaPoente * 0.8);
    janMat.forEach(m => m.color.copy(cj));
    // fundo do diorama
    let fundo = lerpC(corNoite, corDia, sol); fundo = lerpC(fundo, C(0x8a5a58), alvaPoente * 0.75);
    d.fundo = fundo;
    d.ceu(h, sol, alvaPoente);
    { const aS = (h - 6) / 12 * Math.PI, aL = aS + Math.PI;                       // sol e lua atrás da casa, em arco
      const pS = new THREE.Vector3(-Math.cos(aS) * 70, 6 + Math.sin(aS) * 55, -110), pL = new THREE.Vector3(-Math.cos(aL) * 70, 6 + Math.sin(aL) * 55, -110);
      d.sunS.position.copy(pS); d.sunD.position.copy(pS); d.moonS.position.copy(pL); d.moonD.position.copy(pL);
      const vs = Math.max(0, Math.min(1, (pS.y + 4) / 12)), vl = Math.max(0, Math.min(1, (pL.y + 4) / 12));
      d.sunS.material.opacity = 0.9 * vs; d.sunD.visible = vs > 0.02; d.moonS.material.opacity = 0.7 * vl; d.moonD.visible = vl > 0.02;
      d.sunD.lookAt(0, 6, 24); d.moonD.lookAt(0, 6, 24); d.sunS.material.color.set(alvaPoente > 0.2 ? 0xffb070 : 0xffeed0); }
    // fresta do corredor (luz do dia que entra pelas portas): quente de dia, azulada e fraca à noite
    d.fenda.color.copy(lerpC(C(0x9fb8ff), lerpC(C(0xfff0d0), C(0xff9a58), alvaPoente), clamp(sol * 2.5)));
    d.fendaK = 0.04 + 0.96 * Math.pow(sol, 0.6);
    // relógio de pé
    const hh = h % 12, mm = h % 1;
    if (d.pHora) { d.pHora.rotation.z = -hh / 12 * Math.PI * 2; d.pMin.rotation.z = -mm * Math.PI * 2; }
  };
  // conjuntos de luzes por tipo de plano: menos luzes visíveis = renderização bem mais rápida (a luz invisível nem entra no shader)
  d.rig = nome => {
    const wide = nome === 'wide', cabine = nome === 'cabine', hall = nome === 'hall';
    d.sol.visible = wide; d.sol.castShadow = wide; d.lua.visible = wide;
    d.luzAndar.forEach((l, i) => { l.visible = wide || (hall && i === 2); });
    d.fenda.visible = cabine || hall; d.fenda.castShadow = cabine || hall;
    cab.emerg.visible = cabine;
    if (!wide) d.hemi.intensity = Math.min(d.hemi.intensity, hall ? 0.6 : 0.62);
  };
  d.balancarPendulo = t => { if (d.pendulo) d.pendulo.rotation.z = 0.20 * Math.sin(t * Math.PI * 2 / 2.0); };
  d.mostrarParedeCorte = (cortar) => { cab.partes.dir.visible = !cortar; };
  d.mostrarParedePoco = v => { pw.visible = v; };
  d.hora(18.0);
  return d;
}
