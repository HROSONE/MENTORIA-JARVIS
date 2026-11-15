// ACESSÓRIOS da viatura: retrovisores, maçanetas, holofote da coluna A, antenas, limpadores, barra de luzes (com luzes animáveis).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ZN, Y_CINTURA } from './forma.js';
import { xDoFlanco } from './rodas.js';

const zDeD = d => ZN - d;
const preto = () => new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.45, metalness: 0.1 });
const plastico = () => new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.6, metalness: 0.0 });
const cromo = () => new THREE.MeshStandardMaterial({ color: 0xdfe3e8, roughness: 0.16, metalness: 1.0 });
const sombra = m => { m.castShadow = true; m.receiveShadow = true; return m; };

// ------------------------------------------------------------------------------------------------ retrovisores e maçanetas
export function criarRetrovisores() {
  const G = new THREE.Group(), matC = plastico(), matE = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: 0.05, metalness: 1.0 });
  for (const s of [1, -1]) {
    const g = new THREE.Group(); g.position.set(s * 1.065, 1.075, zDeD(1.835));
    const casca = sombra(new THREE.Mesh(new RoundedBoxGeometry(0.085, 0.135, 0.175, 4, 0.032), matC)); g.add(casca);
    const espelho = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.108), matE); espelho.position.set(0, 0, -0.0885); espelho.rotation.y = Math.PI; espelho.rotation.x = 0.0; g.add(espelho);
    const braco = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.018, 0.12, 12), matC)); braco.rotation.z = Math.PI / 2; braco.position.set(-s * 0.095, -0.03, 0.03); g.add(braco);
    const base = sombra(new THREE.Mesh(new RoundedBoxGeometry(0.035, 0.07, 0.11, 2, 0.01), matC)); base.position.set(-s * 0.15, -0.035, 0.035); g.add(base);
    g.rotation.y = s * 0.0; G.add(g);
  }
  return G;
}

export function criarMacanetas(corpo) {
  const G = new THREE.Group(), mat = plastico();
  for (const s of [1, -1]) for (const [d0, d1] of [[2.42, 2.60], [3.30, 3.48]]) {
    const dc = (d0 + d1) / 2, y = 0.915, z = zDeD(dc), x = xDoFlanco(corpo, z, y);
    const h = sombra(new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.03, d1 - d0, 2, 0.01), mat)); h.position.set(s * (x + 0.004), y, z); G.add(h);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.045, d1 - d0 + 0.04), mat); base.position.set(s * (x - 0.001), y, z); G.add(base);
  }
  return G;
}

// ------------------------------------------------------------------------------------------------ holofote da coluna A (lado do motorista) e antenas e limpadores
export function criarHolofote(opc = {}) {
  const G = new THREE.Group(), c = cromo();
  const g = new THREE.Group(); g.position.set(0.945, 1.125, zDeD(1.985)); g.rotation.y = 0.55;                              // aponta para frente e levemente para fora
  const corpo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.115, 28), c)); corpo.rotation.x = Math.PI / 2; g.add(corpo);
  const lente = new THREE.Mesh(new THREE.CircleGeometry(0.047, 28), new THREE.MeshStandardMaterial({ color: 0xf3f6fa, emissive: 0xfff4d8, emissiveIntensity: opc.holofoteLigado ? 3 : 0.0, roughness: 0.05, metalness: 0.2 })); lente.position.z = 0.0585; g.add(lente);
  const aro = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.049, 0.004, 8, 28), c)); aro.position.z = 0.0585; g.add(aro);
  const cabo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 8), preto())); cabo.rotation.x = Math.PI / 2; cabo.position.z = -0.14; g.add(cabo);
  const bola = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), preto())); bola.position.z = -0.24; g.add(bola);
  G.add(g); return G;
}

export function criarAntenas() {
  const G = new THREE.Group(), mat = preto();
  const antena = (x, y, d, alt, r = 0.0025) => {
    const base = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.025, 16), mat)); base.position.set(x, y + 0.012, zDeD(d)); G.add(base);
    const f = sombra(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r, alt, 6), mat)); f.position.set(x, y + 0.025 + alt / 2, zDeD(d)); G.add(f);
    const pt = new THREE.Mesh(new THREE.SphereGeometry(r * 1.6, 6, 6), mat); pt.position.set(x, y + 0.025 + alt, zDeD(d)); G.add(pt);
  };
  antena(-0.28, 1.438, 3.62, 0.55); antena(0.34, 1.438, 3.55, 0.42, 0.003); antena(0.0, 1.052, 4.62, 0.36, 0.0022);
  return G;
}

export function criarLimpadores() {
  const G = new THREE.Group(), mat = preto();
  for (const [x, comp] of [[0.50, 0.58], [-0.12, 0.52]]) {
    const g = new THREE.Group(); g.position.set(x, 1.047, zDeD(1.86)); g.rotation.x = -Math.atan2(0.40, 0.78) * 0.0; g.rotation.x = -0.46;               // deitado no vidro (inclinação do para-brisa)
    const lamina = sombra(new THREE.Mesh(new THREE.BoxGeometry(comp, 0.008, 0.016), mat)); lamina.position.x = -comp / 2; g.add(lamina);
    const braco = sombra(new THREE.Mesh(new THREE.BoxGeometry(comp * 0.9, 0.006, 0.01), mat)); braco.position.set(-comp * 0.5, 0.012, 0.02); g.add(braco);
    G.add(g);
  }
  return G;
}

// ------------------------------------------------------------------------------------------------ barra de luzes (azul e vermelha, faróis de busca brancos, setas âmbar atrás)
function glow(cor, tam) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, cor); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0, fog: false })); s.scale.setScalar(tam); s.renderOrder = 20; return s;
}

export function criarBarra(opc = {}) {
  const G = new THREE.Group(); G.name = 'barraDeLuzes'; G.position.set(0, 1.443, zDeD(2.98));
  const L = 1.22, W = 0.285;
  const metal = new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.4, metalness: 0.75 });
  const base = sombra(new THREE.Mesh(new RoundedBoxGeometry(L, 0.036, W, 3, 0.016), metal)); base.position.y = 0.045; G.add(base);
  for (const x of [-0.46, 0.46]) for (const z of [-0.09, 0.09]) { const p = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.035), plastico())); p.position.set(x, 0.015, z); G.add(p); }   // pés de fixação
  const modulos = [], N = 5, comp = 0.19, vao = 0.005;
  const mkLente = (cor, emis) => new THREE.MeshPhysicalMaterial({ color: cor, emissive: emis, emissiveIntensity: 0.0, roughness: 0.12, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.92 });
  const lado = (s, cor, emis) => {                                                                                          // s = +1: lado do motorista (esquerda do carro)
    for (let i = 0; i < N; i++) {
      const x = s * (0.14 + comp / 2 + i * (comp + vao)), mat = mkLente(cor, emis);
      const m = sombra(new THREE.Mesh(new RoundedBoxGeometry(comp, 0.052, W - 0.03, 3, 0.02), mat)); m.position.set(x, 0.087, 0); G.add(m);
      const g = glow(`#${new THREE.Color(emis).getHexString()}`, 0.5); g.position.set(x, 0.1, 0.0); G.add(g);
      modulos.push({ mat, glow: g, lado: s, idx: i });
    }
  };
  lado(1, 0xb01018, 0xff1010); lado(-1, 0x102a9a, 0x1a4dff);
  // faróis de busca (brancos) no centro, virados para a frente, e luzes de beco nas pontas
  const branco = () => new THREE.MeshPhysicalMaterial({ color: 0xdfe6ee, emissive: 0xffffff, emissiveIntensity: 0.0, roughness: 0.1, clearcoat: 1 });
  const brancos = [];
  for (const x of [-0.07, 0.07]) { const mt = branco(), m = sombra(new THREE.Mesh(new RoundedBoxGeometry(0.115, 0.05, W - 0.03, 3, 0.02), mt)); m.position.set(x, 0.087, 0); G.add(m); brancos.push(mt); }
  const ambar = [];
  for (let i = 0; i < 6; i++) { const mt = new THREE.MeshPhysicalMaterial({ color: 0xc87a10, emissive: 0xff8a00, emissiveIntensity: 0.0, roughness: 0.15, clearcoat: 1 }); const m = new THREE.Mesh(new RoundedBoxGeometry(0.075, 0.028, 0.02, 2, 0.008), mt); m.position.set((i - 2.5) * 0.095, 0.058, W / 2 - 0.003); G.add(m); ambar.push(mt); }
  // luz acompanha: duas luzes pontuais coloridas
  const luzV = new THREE.PointLight(0xff1a1a, 0, 9, 1.6), luzA = new THREE.PointLight(0x2a55ff, 0, 9, 1.6); luzV.position.set(0.5, 0.35, 0); luzA.position.set(-0.5, 0.35, 0); G.add(luzV, luzA);
  const api = {
    grupo: G, modulos,
    /** t em segundos; modo: 'off' | 'ligado' (alterna vermelho/azul, duplo clarão) | 'fixo' (tudo aceso) | 'busca' (faróis brancos acesos) */
    atualizar(t, modo = 'ligado') {
      const pat = (fase, per, tt) => { const ph = (((tt / per) + fase) % 1 + 1) % 1; return (ph < 0.10 ? 1 : 0) + (ph > 0.20 && ph < 0.30 ? 1 : 0) + (ph > 0.40 && ph < 0.50 ? 0.0 : 0) > 0 ? 1 : 0; };
      let v = 0, a = 0, amb = 0, br = 0;
      if (modo === 'fixo') { v = 1; a = 1; amb = 1; } else if (modo === 'busca') { br = 1; v = 0.25; a = 0.25; } else if (modo === 'ligado') { v = pat(0, 0.62, t); a = pat(0.5, 0.62, t); amb = (Math.floor(t * 4) % 2) ? 1 : 0.15; br = 0; }
      api.definir(v, a, amb, br, t, 5.0);
    },
    /** controle direto (0..1) de cada cor: v = vermelho (lado do motorista), a = azul, amb = setas âmbar, br = faróis de busca; forca = intensidade da luz que ilumina a cena */
    definir(v, a, amb = 0, br = 0, t = 0, forca = 5.0) {
      for (const m of modulos) { const k = m.lado > 0 ? v : a, jit = 0.85 + 0.15 * Math.sin(m.idx * 2.1 + t * 40); m.mat.emissiveIntensity = k * 7 * jit; m.glow.material.opacity = k * 0.9 * jit; m.glow.scale.setScalar(0.34 + 0.5 * k); }
      for (const m of brancos) m.emissiveIntensity = br * 6; for (const m of ambar) m.emissiveIntensity = amb * 4;
      luzV.intensity = v * forca; luzA.intensity = a * forca; api.ultimo = { v, a };
    },
  };
  api.atualizar(0, opc.luzes || 'off');
  return api;
}

// ------------------------------------------------------------------------------------------------ escapamento e parte de baixo (visíveis em ângulos baixos)
export function criarBaixo() {
  const G = new THREE.Group(), aco = new THREE.MeshStandardMaterial({ color: 0x3a3c40, roughness: 0.45, metalness: 0.9 }), escuro = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: 0.9 });
  const tubo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 2.5, 14), aco)); tubo.rotation.x = Math.PI / 2; tubo.position.set(-0.40, 0.205, zDeD(3.95)); G.add(tubo);
  const silencioso = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.62, 18), aco)); silencioso.rotation.x = Math.PI / 2; silencioso.scale.x = 1.4; silencioso.position.set(-0.40, 0.235, zDeD(4.55)); G.add(silencioso);
  const ponta = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.03, 0.12, 16), new THREE.MeshStandardMaterial({ color: 0xcfd3d8, roughness: 0.2, metalness: 1.0 }))); ponta.rotation.x = Math.PI / 2; ponta.position.set(-0.40, 0.235, zDeD(5.28)); G.add(ponta);
  for (const x of [-0.5, 0.5]) { const eixo = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.08), escuro)); eixo.position.set(x * 0.2, 0.2, zDeD(1.6)); G.add(eixo); }
  return G;
}

// ------------------------------------------------------------------------------------------------ LEDs extras de emergência: grade, retrovisores, deck traseiro (acompanham a barra)
export function criarLedsExtras(corpo) {
  const G = new THREE.Group(), itens = [];
  const led = (cor, emis, w, h, p, pos, rotY = 0) => {
    const mat = new THREE.MeshPhysicalMaterial({ color: cor, emissive: emis, emissiveIntensity: 0, roughness: 0.15, clearcoat: 1 });
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, p, 2, Math.min(w, h, p) * 0.3), mat); m.position.copy(pos); m.rotation.y = rotY; G.add(m);
    const g = glow(`#${new THREE.Color(emis).getHexString()}`, 0.28); g.position.copy(pos); g.position.z += Math.cos(rotY) * 0.03; g.position.x += Math.sin(rotY) * 0.03; G.add(g);
    itens.push({ mat, glow: g, cor: emis === 0xff1010 ? 'v' : 'a' }); return m;
  };
  // grade: um vermelho (lado do motorista, +x) e um azul
  led(0x8a0d12, 0xff1010, 0.12, 0.04, 0.02, new THREE.Vector3(0.30, 0.715, ZN - 0.075)); led(0x0d2288, 0x1a4dff, 0.12, 0.04, 0.02, new THREE.Vector3(-0.30, 0.715, ZN - 0.075));
  // retrovisores: faixa vermelha / azul na face traseira externa
  led(0x8a0d12, 0xff1010, 0.012, 0.035, 0.1, new THREE.Vector3(1.113, 1.085, zDeD(1.84)), 0.0); led(0x0d2288, 0x1a4dff, 0.012, 0.035, 0.1, new THREE.Vector3(-1.113, 1.085, zDeD(1.84)), 0.0);
  // deck traseiro (atrás do vidro): vermelho e azul
  led(0x8a0d12, 0xff1010, 0.34, 0.03, 0.02, new THREE.Vector3(0.32, 1.035, zDeD(4.02))); led(0x0d2288, 0x1a4dff, 0.34, 0.03, 0.02, new THREE.Vector3(-0.32, 1.035, zDeD(4.02)));
  return {
    grupo: G,
    atualizar(v, a) { for (const i of itens) { const k = i.cor === 'v' ? v : a; i.mat.emissiveIntensity = k * 6; i.glow.material.opacity = k * 0.85; i.glow.scale.setScalar(0.12 + 0.2 * k); } },
  };
}

// ------------------------------------------------------------------------------------------------ para-choque de proteção (push bar), opcional: opc.pushbar = true
export function criarPushBar() {
  const G = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.42, metalness: 0.65 }), z0 = ZN + 0.115, r = 0.0225;
  const tubo = (pts, rad = r) => { const m = sombra(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'centripetal'), 24, rad, 10, false), mat)); G.add(m); return m; };
  const arco = (xs, y0, y1, yb) => {                                                                             // quadro retangular com cantos arredondados no plano XY, frente do carro
    const rr = 0.06;
    for (const s of [1, -1]) tubo([[s * xs, y0 + rr, z0], [s * xs, (y0 + y1) / 2, z0], [s * xs, y1 - rr, z0], [s * (xs - rr * 0.6), y1 - rr * 0.2, z0], [s * (xs - rr), y1, z0]]);
    tubo([[-(xs - rr), y1, z0], [0, y1, z0 + 0.012], [xs - rr, y1, z0]]); tubo([[-(xs - rr), y0, z0], [0, y0, z0 + 0.012], [xs - rr, y0, z0]]);
    for (const s of [1, -1]) tubo([[s * (xs - rr), y0, z0], [s * (xs - rr * 0.6), y0 + rr * 0.2, z0], [s * xs, y0 + rr, z0]]);
    for (const x of [-0.22, 0, 0.22]) tubo([[x, y0, z0], [x, y1, z0]], r * 0.7);                                // travessas verticais
    tubo([[-xs, (y0 + y1) / 2, z0], [xs, (y0 + y1) / 2, z0]], r * 0.6);
  };
  arco(0.47, 0.405, 0.80, 0);
  for (const s of [1, -1]) {                                                                                     // abas laterais e fixações no para-choque
    tubo([[s * 0.47, 0.80, z0], [s * 0.57, 0.78, z0 - 0.07], [s * 0.64, 0.70, z0 - 0.15], [s * 0.66, 0.55, ZN - 0.02]]);
    tubo([[s * 0.47, 0.405, z0], [s * 0.57, 0.42, z0 - 0.07], [s * 0.64, 0.46, z0 - 0.14], [s * 0.66, 0.50, ZN - 0.02]]);
    for (const y of [0.53, 0.72]) tubo([[s * 0.30, y, z0], [s * 0.30, y, ZN - 0.03]], r * 0.8);
  }
  return G;
}
