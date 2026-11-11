// A rua (Nova York, inverno): sobrado de pedra com escada e porta dupla, fileiras de casas, calçadas e ruas do kit, árvores secas, hidrantes, lixo, vapor do bueiro.
// Hora: 'crepusculo' (sexta, fim de tarde) ou 'manha' (segunda). Eixo X ao longo da rua; a casa fica ao norte (z < 0), olhando para +Z.
import * as THREE from 'three';
import { Kit } from '../../biblioteca3d/cidade/kit.js';
import { mundos, canvasTex, brilho, sombras, texFumaca } from './motor.js';
import { Lote, M } from './lote.js';
import * as T from './texturas.js';
import { mulberry32, clamp, lerp, suave, inv } from './util.js';

export const ZF = -7.6;                         // plano da fachada
export const PORTA = { x: 0, y: 0.69, larg: 1.6, alt: 2.5 };
export const ALT_ANDAR = 3.3;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const CAMP = V(1.30, 2.0, ZF + 0.05);     // botão da campainha

// textura da fachada de uma casa da fileira (cor + máscara de janelas acesas); n = número de andares
function texFileira(base, junta, seed, { pedra = false, andares = 5, acesas = 0.35 } = {}) {
  const W = 256, Hh = 768;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = Hh; return c; };
  const cm = mk(), ce = mk(), gm = cm.getContext('2d'), ge = ce.getContext('2d');
  const r = mulberry32(seed);
  gm.fillStyle = base; gm.fillRect(0, 0, W, Hh);
  if (pedra) { for (let y = 0; y < Hh; y += 24) { gm.fillStyle = junta; gm.globalAlpha = 0.55; gm.fillRect(0, y, W, 2); gm.globalAlpha = 1; for (let x = (y / 24 % 2) * 40; x < W; x += 80 + r() * 20) { gm.fillStyle = junta; gm.globalAlpha = 0.5; gm.fillRect(x, y, 2, 24); gm.globalAlpha = 1; } } }
  else { for (let y = 0; y < Hh; y += 8) for (let x = -(y / 8 % 2) * 12; x < W; x += 24) { const v = (r() - 0.5) * 26; gm.fillStyle = shade(base, v); gm.fillRect(x + 1, y + 1, 22, 6); } }
  ge.fillStyle = '#000'; ge.fillRect(0, 0, W, Hh);
  const fh = (Hh - 56) / andares;
  for (let f = 0; f < andares; f++) {
    const yb = Hh - 40 - f * fh;                                          // chão do andar
    // friso entre andares
    gm.fillStyle = '#d9d2c2'; gm.fillRect(0, yb + 6, W, 6);
    for (const cx of [44, 128, 212]) {
      if (f === 0 && cx === 128) continue;
      const w = 46, h = fh * 0.58, x0 = cx - w / 2, y0 = yb - fh * 0.82;
      gm.fillStyle = '#e8e2d2'; gm.fillRect(x0 - 5, y0 - 8, w + 10, h + 14);                                            // moldura
      const lit = r() < acesas;
      const gr = gm.createLinearGradient(0, y0, 0, y0 + h); gr.addColorStop(0, lit ? '#6a5a40' : '#1a2230'); gr.addColorStop(1, lit ? '#8a6a40' : '#2a3548');
      gm.fillStyle = gr; gm.fillRect(x0, y0, w, h);
      gm.fillStyle = '#e8e2d2'; gm.fillRect(x0 + w / 2 - 1.5, y0, 3, h); gm.fillRect(x0, y0 + h * 0.4, w, 3);       // caixilho
      gm.fillStyle = '#cfc7b4'; gm.fillRect(x0 - 8, y0 + h + 6, w + 16, 5);                                              // soleira
      if (lit) { const g2 = ge.createLinearGradient(0, y0, 0, y0 + h); g2.addColorStop(0, '#ffcf8a'); g2.addColorStop(1, '#ff9d4a'); ge.fillStyle = g2; ge.fillRect(x0, y0, w, h); ge.fillStyle = '#000'; ge.fillRect(x0 + w / 2 - 1.5, y0, 3, h); ge.fillRect(x0, y0 + h * 0.4, w, 3); }
    }
  }
  gm.fillStyle = '#cdc5b3'; gm.fillRect(0, 0, W, 34); gm.fillStyle = '#9d9684'; gm.fillRect(0, 34, W, 6); gm.fillRect(0, 22, W, 3);        // cornija
  const map = new THREE.CanvasTexture(cm); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  const emi = new THREE.CanvasTexture(ce); emi.colorSpace = THREE.SRGBColorSpace;
  return { map, emi };
}
function shade(hex, v) { const n = parseInt(hex.slice(1), 16), c = x => Math.max(0, Math.min(255, x + v)); return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`; }

// vitral da bandeira (leque) sobre a porta: raios dourados
function texLeque() {
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#ffcf8a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#3a2a18'; g.lineWidth = 4; for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8; g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w / 2 + Math.cos(a) * w, h - Math.sin(a) * w); g.stroke(); }
    g.beginPath(); g.arc(w / 2, h, h * 0.45, Math.PI, 0); g.stroke();
  });
}
function texVidroPorta() {
  return canvasTex(64, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffc27a'); gr.addColorStop(1, '#e89a52'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(120,70,30,0.35)'; for (let i = 0; i < 6; i++) g.fillRect(i * 11, 0, 4, h);
  });
}

export async function construirR(mundo) {
  const R = mundo;
  const kit = await Kit.carregar('../biblioteca3d/cidade/');
  const d = { kit, luzes: [], janHeroi: [] };
  const raiz = new THREE.Group(); R.add(raiz); d.raiz = raiz;

  // ---------------------------------------------------------------- rua e calçadas do kit
  const trab = [];
  for (let gx = -8; gx <= 8; gx++) trab.push(kit.ladrilho('rua-reta', gx, 0, 0, ['E', 'W']));
  (await Promise.all(trab)).forEach(o => raiz.add(o));
  const asfaltoFora = new THREE.Mesh(new THREE.PlaneGeometry(400, 80), M(0x4a4b4e, 1)); asfaltoFora.rotation.x = -Math.PI / 2; asfaltoFora.position.set(0, -0.02, 0); asfaltoFora.receiveShadow = true; raiz.add(asfaltoFora);
  const cal = M(0x8d8a84, 0.95, { map: T.texConcreto('#8f8c86') }); cal.map.repeat.set(60, 3);
  for (const sz of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(400, 0.15, 2.6), cal); p.position.set(0, 0.075, sz * 7.3); p.receiveShadow = true; raiz.add(p); }       // calçada além do ladrilho: já coberta pelo kit até |z| = 6

  // ---------------------------------------------------------------- fileiras de casas
  const tipos = [
    ['#8a4a34', '#bdb3a4', false], ['#cfc2a2', '#8d8068', true], ['#6e3b2c', '#a99f90', false], ['#b9ae92', '#7b705a', true], ['#7a4636', '#b0a698', false], ['#a8a090', '#6c6558', true],
  ];
  const texs = tipos.map((t, i) => texFileira(t[0], t[1], 11 + i * 7, { pedra: t[2], acesas: 0.35 }));
  d.matsFileira = [];
  const fileira = (x, w, h, k, z, ry) => {
    const t = texs[k % texs.length];
    const m = new THREE.MeshStandardMaterial({ map: t.map, emissiveMap: t.emi, emissive: 0xffffff, emissiveIntensity: 1.0, roughness: 0.95 });
    const lado = M(0x6d675c, 1);
    const mats = [lado, lado, lado, lado, m, lado];
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 9), mats); b.position.set(x, h / 2, z + (ry ? 4.5 : -4.5)); if (ry) b.rotation.y = Math.PI; b.castShadow = true; b.receiveShadow = true; raiz.add(b);
    d.matsFileira.push(m);
    return b;
  };
  const rr = mulberry32(5);
  let xl = -3.2, xr = 3.2, k = 1;
  for (let i = 0; i < 9; i++) { const w = 5.6 + rr() * 1.4; fileira(xl - w / 2, w, 14.5 + rr() * 3.5, k++, ZF, 0); xl -= w; }
  for (let i = 0; i < 9; i++) { const w = 5.6 + rr() * 1.4; fileira(xr + w / 2, w, 14.5 + rr() * 3.5, k++, ZF, 0); xr += w; }
  // do outro lado da rua (viradas para o norte): fachada em z = +7,6
  let xs = -60;
  for (let i = 0; i < 20; i++) { const w = 5.6 + rr() * 1.4; fileira(xs + w / 2, w, 13 + rr() * 4.5, k++, -ZF, 1); xs += w; }

  // ---------------------------------------------------------------- a casa: pedra, janelas, porta dupla, escada com grade, campainha
  const casa = new THREE.Group(); raiz.add(casa); d.casa = casa;
  const L = new Lote(casa);
  const pedra = M(0xffffff, 0.9, { map: T.texPedra('#cfc2a2'), color: 0xeee6d4 });
  const pedraEsc = M(0xffffff, 0.92, { map: T.texPedra('#aaa08a', '#6b6252'), color: 0xdad2c0 });
  const branco = M(0xece7dc, 0.7), ferro = M(0x15171a, 0.4, { metalness: 0.6 }), latao = M(0xc9a24a, 0.28, { metalness: 0.9 });
  const lado = 3.2, alturaCasa = 5 * ALT_ANDAR + PORTA.y;
  L.caixa(2 * lado, alturaCasa + 0.3, 8.0, pedra, 0, (alturaCasa - 0.3) / 2 + 0.15, ZF - 4.0, { uv: 3 });
  // faixa de base mais escura e cornijas entre andares
  L.caixa(2 * lado + 0.2, 0.9, 0.18, pedraEsc, 0, 0.15 + 0.45, ZF + 0.09, { uv: 3 });
  for (let n = 1; n <= 5; n++) L.caixa(2 * lado + 0.14, 0.12, 0.16, branco, 0, PORTA.y + n * ALT_ANDAR - 0.06, ZF + 0.08);
  // cornija do topo e parapeito
  L.caixa(2 * lado + 0.5, 0.35, 0.7, branco, 0, PORTA.y + 5 * ALT_ANDAR + 0.15, ZF + 0.25);
  L.caixa(2 * lado + 0.3, 0.7, 0.3, pedra, 0, PORTA.y + 5 * ALT_ANDAR + 0.65, ZF + 0.10, { uv: 3 });
  // janelas
  const janelaX = [-2.1, 0.0, 2.1];
  const luzJan = new THREE.MeshStandardMaterial({ color: 0xffffff, map: texVidroPorta(), emissive: 0xffffff, emissiveMap: texVidroPorta(), emissiveIntensity: 0, roughness: 0.4 });
  const janela = (x, y0, w, h, k) => {
    const mat = new THREE.MeshStandardMaterial({ color: 0x2a3b57, roughness: 0.18, metalness: 0.05, emissive: 0xffffff, emissiveMap: luzJan.map, emissiveIntensity: 0 });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); p.position.set(x, y0 + h / 2, ZF + 0.03); casa.add(p); d.janHeroi.push({ mat, k });
    const e = 0.08;
    L.caixa(w + 2 * e, e, 0.10, branco, x, y0 + h + e / 2, ZF + 0.05); L.caixa(w + 2 * e + 0.12, 0.09, 0.22, branco, x, y0 - 0.045, ZF + 0.11);
    L.caixa(e, h, 0.10, branco, x - w / 2 - e / 2, y0 + h / 2, ZF + 0.05); L.caixa(e, h, 0.10, branco, x + w / 2 + e / 2, y0 + h / 2, ZF + 0.05);
    L.caixa(0.05, h, 0.06, branco, x, y0 + h / 2, ZF + 0.05); L.caixa(w, 0.05, 0.06, branco, x, y0 + h * 0.58, ZF + 0.05);
    L.caixa(w + 0.5, 0.14, 0.2, branco, x, y0 + h + e + 0.07, ZF + 0.1);                    // verga saliente
  };
  let kj = 0;
  for (let n = 0; n < 5; n++) {
    const yy = PORTA.y + n * ALT_ANDAR + 0.7;
    for (const x of janelaX) { if (n === 0 && x === 0) continue; janela(x, yy, 1.1, n === 0 ? 1.9 : 2.1, kj++); }
  }
  // grades de ferro nas janelas do térreo
  for (const x of [-2.1, 2.1]) for (let i = -2; i <= 2; i++) L.caixa(0.03, 1.8, 0.03, ferro, x + i * 0.22, PORTA.y + 0.7 + 0.95, ZF + 0.18);
  // porta dupla: batente, folhas giratórias, leque e vidro iluminado
  const porta = M(0x14231c, 0.45, { metalness: 0.1 });
  L.caixa(PORTA.larg + 0.36, 0.14, 0.24, branco, PORTA.x, PORTA.y + PORTA.alt + 0.07, ZF + 0.10);
  L.caixa(0.18, PORTA.alt + 0.4, 0.22, branco, PORTA.x - PORTA.larg / 2 - 0.09, PORTA.y + (PORTA.alt + 0.4) / 2 - 0.2, ZF + 0.10); L.caixa(0.18, PORTA.alt + 0.4, 0.22, branco, PORTA.x + PORTA.larg / 2 + 0.09, PORTA.y + (PORTA.alt + 0.4) / 2 - 0.2, ZF + 0.10);
  for (const sx of [-1, 1]) L.cilindro(0.09, 0.09, PORTA.alt + 0.3, branco, sx * (PORTA.larg / 2 + 0.28), PORTA.y + (PORTA.alt + 0.3) / 2, ZF + 0.13, { seg: 12 });
  L.caixa(PORTA.larg + 0.9, 0.18, 0.34, branco, PORTA.x, PORTA.y + PORTA.alt + 0.35, ZF + 0.14);
  const leque = new THREE.Mesh(new THREE.PlaneGeometry(PORTA.larg, 0.46), new THREE.MeshBasicMaterial({ map: texLeque() })); leque.position.set(PORTA.x, PORTA.y + PORTA.alt + 0.25, ZF + 0.02); casa.add(leque); d.leque = leque;
  const luzHall = new THREE.Mesh(new THREE.PlaneGeometry(PORTA.larg, PORTA.alt), new THREE.MeshBasicMaterial({ color: 0xffb870 })); luzHall.position.set(PORTA.x, PORTA.y + PORTA.alt / 2, ZF + 0.012); casa.add(luzHall); d.luzHall = luzHall;
  d.folhas = [];
  for (const sx of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(PORTA.x + sx * PORTA.larg / 2, PORTA.y, ZF + 0.04); casa.add(piv);
    const f = new THREE.Mesh(new THREE.BoxGeometry(PORTA.larg / 2 - 0.01, PORTA.alt - 0.02, 0.06), porta); f.position.set(-sx * (PORTA.larg / 4 - 0.005), PORTA.alt / 2, 0); f.castShadow = true; piv.add(f);
    const vid = new THREE.Mesh(new THREE.PlaneGeometry(PORTA.larg / 2 - 0.30, 1.0), new THREE.MeshBasicMaterial({ map: texVidroPorta() })); vid.position.set(-sx * (PORTA.larg / 4 - 0.005), PORTA.alt * 0.64, 0.032); piv.add(vid);
    for (const [py, ph] of [[0.55, 0.62], [1.38, 0.0]]) if (ph) { const pn = new THREE.Mesh(new THREE.BoxGeometry(PORTA.larg / 2 - 0.30, ph, 0.012), porta); pn.position.set(-sx * (PORTA.larg / 4 - 0.005), py, 0.034); piv.add(pn); }
    const man = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), latao); man.position.set(-sx * (PORTA.larg / 2 - 0.12), PORTA.alt * 0.45, 0.07); piv.add(man);
    d.folhas.push({ piv, sx });
  }
  d.abrirPorta = k => { d.folhas.forEach(f => { f.piv.rotation.y = f.sx * k * 1.7; }); };           // k = 0 fechada, 1 aberta (para fora)
  // plataforma e degraus (3) com bordas, mais corrimão de ferro dos dois lados
  const stone = M(0xffffff, 0.9, { map: T.texConcreto('#a9a69f'), color: 0xdcd8ce });
  L.caixa(3.9, 0.54, 0.95, stone, 0, 0.15 + 0.27, ZF + 0.475);                                    // plataforma (topo em 0,69)
  for (let i = 0; i < 2; i++) { const h = 0.36 - 0.18 * i; L.caixa(3.4, h, 0.30, stone, 0, 0.15 + h / 2, ZF + 1.10 + i * 0.30); }          // dois degraus (topos 0,51 e 0,33)
  for (const sx of [-1, 1]) {
    const x = sx * 1.78;
    for (const [z, yb] of [[ZF + 0.12, 0.69], [ZF + 0.55, 0.69], [ZF + 0.92, 0.69], [ZF + 1.25, 0.51], [ZF + 1.55, 0.33]]) L.caixa(0.035, 0.95, 0.035, ferro, x, yb + 0.475, z);
    L.caixa(0.04, 0.04, 0.85, ferro, x, 0.69 + 0.95, ZF + 0.55);
    L.haste([x, 0.69 + 0.95, ZF + 0.92], [x, 0.33 + 0.95, ZF + 1.55], 0.022, 0.022, ferro, { seg: 6 });
    L.caixa(0.03, 0.03, 0.85, ferro, x, 0.69 + 0.55, ZF + 0.55);
  }
  // placa de metal junto à porta e campainha com botão luminoso
  L.caixa(0.20, 0.34, 0.03, latao, CAMP.x, CAMP.y - 0.02, ZF + 0.03);
  d.botao = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 20), new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffa040, emissiveIntensity: 0.7, roughness: 0.3, metalness: 0.4 }));
  d.botao.rotation.x = Math.PI / 2; d.botao.position.set(CAMP.x, CAMP.y + 0.04, ZF + 0.055); casa.add(d.botao);
  d.botaoGlow = brilho('255,170,80', 0.35, 0.9); d.botaoGlow.position.copy(d.botao.position).add(V(0, 0, 0.04)); casa.add(d.botaoGlow);
  const grelha = new THREE.Mesh(new THREE.CircleGeometry(0.05, 14), new THREE.MeshStandardMaterial({ color: 0x2a2418, roughness: 0.6 })); grelha.position.set(CAMP.x, CAMP.y - 0.10, ZF + 0.05); casa.add(grelha);
  // lampiões ao lado da porta
  d.lampioes = [];
  for (const sx of [-1, 1]) {
    const lp = new THREE.Group(); lp.position.set(PORTA.x + sx * 1.35, PORTA.y + 2.25, ZF + 0.22); casa.add(lp);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), new THREE.MeshStandardMaterial({ color: 0xffeccc, emissive: 0xffbe6a, emissiveIntensity: 0 })); lp.add(gl);
    L.caixa(0.08, 0.24, 0.10, ferro, PORTA.x + sx * 1.35, PORTA.y + 2.25, ZF + 0.12);
    const b = brilho('255,196,110', 1.1, 0); b.position.set(0, 0, 0.05); lp.add(b); d.lampioes.push({ gl, b });
  }
  L.fechar();
  // luz que cai sobre a escada e a porta no crepúsculo
  d.luzPorta = new THREE.PointLight(0xffc27a, 0, 12, 1.6); d.luzPorta.position.set(0, PORTA.y + 2.6, ZF + 1.6); casa.add(d.luzPorta);

  // ---------------------------------------------------------------- árvores secas, hidrantes, postes de luz, sacos de lixo, vapor
  const Ar = new Lote(raiz); const tronco = M(0x2a211a, 1);
  const arv = (x, z, esc, seed) => {
    const r = mulberry32(seed);
    Ar.cilindro(0.11 * esc, 0.17 * esc, 3.4 * esc, tronco, x, 0.15 + 1.7 * esc, z, { seg: 7 });
    const ramo = (px, py, pz, comp, ang, dir, g) => {
      const ex = px + Math.cos(dir) * Math.sin(ang) * comp, ey = py + Math.cos(ang) * comp, ez = pz + Math.sin(dir) * Math.sin(ang) * comp;
      Ar.haste([px, py, pz], [ex, ey, ez], 0.034 * esc * (3 - g) * 0.5, 0.020 * esc * (3 - g) * 0.5, tronco, { seg: 5 });
      if (g < 2) for (let j = 0; j < 3; j++) ramo(ex, ey, ez, comp * (0.55 + r() * 0.25), 0.4 + r() * 0.8, r() * 6.28, g + 1);
    };
    for (let i = 0; i < 6; i++) ramo(x, 0.15 + (2.6 + r() * 0.8) * esc, z, (1.1 + r() * 0.6) * esc, 0.5 + r() * 0.7, r() * 6.28, 0);
  };
  for (const [x, z, e, s] of [[-9.0, -4.6, 1.15, 1], [-20, -4.6, 1.1, 2], [8.5, -4.6, 1.2, 3], [20, -4.6, 1.05, 4], [-14, 4.8, 1.1, 5], [4, 4.8, 1.2, 6], [17, 4.8, 1.1, 7], [-28, -4.6, 1.1, 8]]) arv(x, z, e, s);
  Ar.fechar();
  const postes = [];
  for (const [x, z, g] of [[-14, -4.7, 0], [11, -4.7, 0], [-4, 4.7, Math.PI], [22, 4.7, Math.PI], [-26, -4.7, 0]]) {
    const p = await kit.prop('poste-luz', 0, 0, 0, 0); p.position.set(x, 0.15, z); p.rotation.y = g; raiz.add(p); postes.push(p);
  }
  d.postes = postes;
  for (const x of [-6.2, 5.8]) { const h = await kit.prop('hidrante', 0, 0, 0, 0); h.position.set(x, 0.15, -4.6); sombras(h); raiz.add(h); }
  // sacos de lixo na calçada (típico da cidade)
  const saco = M(0x0d0d10, 0.55, { metalness: 0.1 }); const Lx = new Lote(raiz); const rs = mulberry32(12);
  for (const [x, z] of [[-5.1, -5.2], [-4.7, -5.5], [-5.4, -5.6], [6.4, -5.3], [6.8, -5.6], [14, -5.4]]) for (let i = 0; i < 3; i++) Lx.esfera(0.26 + rs() * 0.1, saco, x + (rs() - 0.5) * 0.5, 0.15 + 0.22, z + (rs() - 0.5) * 0.4, { seg: 9, sy: 0.9 });
  Lx.fechar();
  // chaminé de vapor (laranja e branca) sobre um bueiro e vapor animado
  const vap = new THREE.Group(); vap.position.set(-8.0, 0, 1.6); raiz.add(vap);
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.0, 12), M(0xe8631f, 0.6)); cone.position.y = 0.5; cone.castShadow = true; vap.add(cone);
  const faixa = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.12, 12), M(0xf4efe6, 0.6)); faixa.position.y = 0.52; vap.add(faixa);
  d.vapor = []; const tf = texFumaca();
  for (let i = 0; i < 14; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tf, transparent: true, opacity: 0, depthWrite: false, color: 0xe6e9ef, fog: true })); s.renderOrder = 9; vap.add(s); d.vapor.push({ s, f: i / 14 }); }
  d.animarVapor = t => { for (const v of d.vapor) { const u = (((t * 0.22 + v.f) % 1) + 1) % 1; v.s.position.set(Math.sin(v.f * 40 + t * 0.4) * 0.12 + u * 0.25, 1.0 + u * 3.4, Math.cos(v.f * 30) * 0.1); v.s.scale.setScalar(0.5 + u * 2.4); v.s.material.opacity = 0.5 * Math.sin(u * Math.PI) * d.vaporK; } };
  d.vaporK = 1;

  // ---------------------------------------------------------------- céu (domos), luzes
  const ceus = { crepusculo: T.texCeu('crepusculo'), manha: T.texCeu('manha') };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(300, 20, 14), new THREE.MeshBasicMaterial({ map: ceus.manha, side: THREE.BackSide, fog: false, depthWrite: false })); dome.renderOrder = -10; dome.frustumCulled = false; R.add(dome); d.dome = dome;
  d.hemi = new THREE.HemisphereLight(0xcad6e6, 0x5e5a50, 1.2); R.add(d.hemi);
  d.sol = new THREE.DirectionalLight(0xfff2e0, 1.0); d.sol.castShadow = true; d.sol.shadow.mapSize.set(1024, 1024);
  Object.assign(d.sol.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 90 }); d.sol.shadow.bias = -0.0004; d.sol.shadow.normalBias = 0.04; d.sol.shadow.radius = 3;
  R.add(d.sol, d.sol.target);
  d.focar = (x, z) => { d.sol.position.set(x - 10, 30, z + 18); d.sol.target.position.set(x, 0, z); d.sol.target.updateMatrixWorld(); };
  d.luzesPoste = [];
  for (const i of [0, 1, 2]) { const ls = kit.luzesDe(postes[i]); for (const l of ls) { const pl = new THREE.PointLight(0xffb85e, 0, 26, 1.7); pl.position.copy(l.pos); R.add(pl); d.luzesPoste.push(pl); } }
  d.brilhosPoste = postes.map(p => { const ls = kit.luzesDe(p); const b = brilho('255,190,100', 2.2, 0); b.position.copy(ls[0] ? ls[0].pos : V(p.position.x, 5.5, p.position.z)); R.add(b); return b; });

  d.luzEmerg = new THREE.PointLight(0xff2010, 0, 24, 1.3); R.add(d.luzEmerg);
  // modo do dia: 'crepusculo' (sexta, fim da tarde) | 'manha' (segunda de manhã, nublado)
  d.hora = modo => {
    const cre = modo === 'crepusculo';
    d.dome.material.map = ceus[modo]; d.dome.material.needsUpdate = true;
    d.hemi.color.set(cre ? 0x5a70b0 : 0xd2dcea); d.hemi.groundColor.set(cre ? 0x1d1812 : 0x66625a); d.hemi.intensity = cre ? 1.0 : 1.35;
    d.sol.color.set(cre ? 0x8aa0e0 : 0xfff3e2); d.sol.intensity = cre ? 0.85 : 1.15;
    d.luzesPoste.forEach(l => { l.intensity = cre ? 95 : 0; });
    d.brilhosPoste.forEach(b => { b.material.opacity = cre ? 0.85 : 0; });
    postes.forEach(p => kit.luzEstado(p, cre));
    d.matsFileira.forEach(m => { m.emissiveIntensity = cre ? 1.0 : 0.0; });
    d.janHeroi.forEach(({ mat, k }) => { mat.emissiveIntensity = cre ? ([1, 4, 5, 10, 11, 14].includes(k) ? 1.1 : 0) : 0; });
    d.lampioes.forEach(l => { l.gl.material.emissiveIntensity = cre ? 2.4 : 0; l.b.material.opacity = cre ? 0.85 : 0; });
    d.luzPorta.intensity = cre ? 36 : 0;
    d.luzHall.material.color.set(cre ? 0xffb870 : 0xd9a366); d.leque.material.color.set(cre ? 0xffffff : 0xbfa070);
    d.vaporK = cre ? 0.8 : 1.0;
    d.modo = modo;
  };
  d.rig = modo => {
    const cre = modo === 'crepusculo';
    d.luzesPoste.forEach((l, i) => { l.visible = cre && i < 3; });
    d.luzPorta.visible = cre;
    d.luzEmerg.visible = false;
    d.sol.castShadow = !cre;
  };
  d.hora('crepusculo');
  d.campainha = (k) => { d.botao.material.emissiveIntensity = 0.7 + 2.6 * k; d.botaoGlow.material.opacity = 0.6 + 0.4 * k; d.botao.position.z = ZF + 0.055 - 0.012 * k; };
  d.campainha(0);
  d.abrirPorta(0);
  return d;
}
