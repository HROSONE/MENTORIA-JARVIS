// Cenas das hipóteses: (1) tromba-d'água no mar sugando peixes (e a placa "YORO 72 km"); (2) corte do chão com rio subterrâneo que sobe pelo poço e cospe peixes na rua.
// Ilustrações: os peixes aparecem maiores que o real para serem lidos de longe.
import * as THREE from 'three';
import { mulberry32, clamp, lerp, suave, inv } from './util.js';
import { criarCardume } from './cardume.js';
import { criarChuva } from './chuva.js';

const rot = (a, b) => ((a % b) + b) % b;

// ------------------------------------------------------------------------------------------ tromba-d'água
export function construirMar(g, { env = null } = {}) {
  const G = new THREE.Group(); g.add(G);
  // mar com ondas (vértices animados)
  const N = 110, geo = new THREE.PlaneGeometry(420, 420, N, N); geo.rotateX(-Math.PI / 2);
  const P = geo.attributes.position, base = Float32Array.from(P.array);
  const mar = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x0d5a78, roughness: 0.22, metalness: 0.25, envMap: env, envMapIntensity: 1.3, flatShading: false })); mar.receiveShadow = true; G.add(mar);
  const onda = (x, z, t) => 0.55 * Math.sin(x * 0.22 + t * 1.3) * Math.cos(z * 0.17 - t * 0.9) + 0.3 * Math.sin((x + z) * 0.41 + t * 2.1) + 0.12 * Math.sin(x * 0.9 - t * 3.1);
  // praia de areia e estrada para dentro do continente (z negativo é o mar? usamos z>0 = terra)
  const areia = new THREE.Mesh(new THREE.PlaneGeometry(420, 60), new THREE.MeshStandardMaterial({ color: 0xe6c98a, roughness: 1 })); areia.rotation.x = -Math.PI / 2; areia.position.set(0, 0.2, 90); G.add(areia);
  const verde = new THREE.Mesh(new THREE.PlaneGeometry(420, 400), new THREE.MeshStandardMaterial({ color: 0x4d9a4a, roughness: 1 })); verde.rotation.x = -Math.PI / 2; verde.position.set(0, 0.25, 320); G.add(verde);
  const estrada = new THREE.Mesh(new THREE.PlaneGeometry(7, 400), new THREE.MeshStandardMaterial({ color: 0x3a3a46, roughness: 0.7 })); estrada.rotation.x = -Math.PI / 2; estrada.position.set(9, 0.3, 300); G.add(estrada);
  for (let i = 0; i < 40; i++) { const tr = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 3), new THREE.MeshBasicMaterial({ color: 0xffd23a })); tr.rotation.x = -Math.PI / 2; tr.position.set(9, 0.32, 120 + i * 9); G.add(tr); }
  // montanhas ao fundo da estrada
  for (let k = 0; k < 2; k++) { const w = 420, seg = 80, mg = new THREE.PlaneGeometry(w, 60, seg, 1), Q = mg.attributes.position; for (let i = 0; i <= seg; i++) { const x = Q.getX(i); Q.setY(i, 26 + 22 * Math.sin(x * 0.03 + k * 2) + 10 * Math.sin(x * 0.09 + k) ); Q.setY(i + seg + 1, -2); } const m = new THREE.Mesh(mg, new THREE.MeshBasicMaterial({ color: [0x2f7a52, 0x5b6fb8][k], side: THREE.DoubleSide })); m.position.set(0, 0, 420 + k * 60); G.add(m); }
  // placa YORO 72 km
  const cv = document.createElement('canvas'); cv.width = 768; cv.height = 384; const c = cv.getContext('2d');
  c.fillStyle = '#0d5fb0'; c.fillRect(0, 0, 768, 384); c.strokeStyle = '#fff'; c.lineWidth = 14; c.strokeRect(14, 14, 740, 356);
  c.fillStyle = '#fff'; c.font = 'bold 150px Arial, sans-serif'; c.textAlign = 'center'; c.fillText('YORO', 330, 175); c.font = 'bold 190px Arial, sans-serif'; c.fillText('72 km', 384, 335);
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(600, 120); c.lineTo(700, 120); c.lineTo(700, 90); c.lineTo(755, 150); c.lineTo(700, 210); c.lineTo(700, 180); c.lineTo(600, 180); c.fill();
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const placa = new THREE.Group(), face = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.0, 0.12), [0x777777, 0x777777, 0x777777, 0x777777, 0xffffff, 0x777777].map((cor, i) => i === 4 ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.55 }) : new THREE.MeshStandardMaterial({ color: cor, roughness: 0.6 })));
  face.position.y = 3.1; face.castShadow = true; placa.add(face); for (const sx of [-1.4, 1.4]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.4, 8), new THREE.MeshStandardMaterial({ color: 0x888c94, metalness: 0.5, roughness: 0.4 })); p.position.set(sx, 1.8, 0); p.castShadow = true; placa.add(p); }
  placa.position.set(2.0, 0.55, 12); placa.rotation.y = -0.25; G.add(placa);
  const ilha = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 6.2, 0.9, 28), new THREE.MeshStandardMaterial({ color: 0xe6c98a, roughness: 1 })); ilha.position.set(2.0, 0.0, 12); G.add(ilha);
  // nuvem de tempestade (esferas escuras) e funil
  const nuvem = new THREE.Group(), rn = mulberry32(4);
  for (let i = 0; i < 34; i++) { const e = new THREE.Mesh(new THREE.SphereGeometry(12 + 14 * rn(), 14, 10), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.74, 0.32, 0.24 + 0.16 * rn()), emissive: 0x241a50, emissiveIntensity: 0.8, roughness: 1 })); e.position.set((rn() - 0.5) * 80, 46 + rn() * 14, (rn() - 0.5) * 60); e.scale.y = 0.5; nuvem.add(e); }
  nuvem.position.set(-14, 0, -12); G.add(nuvem);
  const H = 44, pf = []; for (let i = 0; i <= 40; i++) { const y = i / 40 * H, u = y / H; pf.push(new THREE.Vector2(2.2 + 13 * Math.pow(u, 2.0) + 0.9 * Math.sin(u * 14) * u, y)); }
  const cvf = document.createElement('canvas'); cvf.width = 256; cvf.height = 256; const cf = cvf.getContext('2d'); cf.fillStyle = '#000'; cf.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) { const x = Math.random() * 256; cf.fillStyle = `rgba(255,255,255,${0.15 + Math.random() * 0.5})`; cf.fillRect(x, 0, 2 + Math.random() * 6, 256); }
  const tf = new THREE.CanvasTexture(cvf); tf.wrapS = tf.wrapT = THREE.RepeatWrapping; tf.repeat.set(2, 3);
  const funil = new THREE.Mesh(new THREE.LatheGeometry(pf, 48), new THREE.MeshBasicMaterial({ map: tf, color: 0xd8d0f0, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide, blending: THREE.NormalBlending }));
  funil.position.set(-14, 0, -12); G.add(funil);
  const respingo = new THREE.Mesh(new THREE.TorusGeometry(5.5, 1.4, 8, 40), new THREE.MeshBasicMaterial({ color: 0xeef6ff, transparent: true, opacity: 0.55, depthWrite: false })); respingo.rotation.x = Math.PI / 2; respingo.position.set(-14, 0.9, -12); G.add(respingo);
  const card = criarCardume(G, 170, { env }), rf = mulberry32(12), F = [];
  for (let i = 0; i < 170; i++) F.push({ h0: rf() * H, v: 4 + 3 * rf(), th: rf() * 6.283, w: 1.0 + 1.2 * rf(), roll: rf() * 6.283, e: 6 + 3.5 * rf() });
  const rr = h => 2.2 + 13 * Math.pow(h / H, 2.0);
  const atualizar = t => {
    for (let i = 0; i <= N; i++) for (let k = 0; k <= N; k++) { const j = (i * (N + 1) + k) * 3; P.array[j + 1] = onda(base[j], base[j + 2], t) * (1 + 1.4 * Math.exp(-((base[j] + 14) ** 2 + (base[j + 2] + 12) ** 2) / 260)); }
    P.needsUpdate = true; geo.computeVertexNormals();
    tf.offset.x = t * 0.9; tf.offset.y = -t * 0.5; funil.rotation.y = t * 1.4; funil.position.x = -14 + Math.sin(t * 0.3) * 0.8; respingo.scale.setScalar(1 + 0.08 * Math.sin(t * 5)); respingo.position.x = funil.position.x;
    F.forEach((f, i) => { const h = rot(f.h0 + f.v * t, H), a = f.th + t * (f.w + 5 / (1 + h / 7)), r = rr(h) * (0.35 + 0.5 * ((i * 0.37) % 1)), x = funil.position.x + Math.cos(a) * r, z = -12 + Math.sin(a) * r;
      const vx = -Math.sin(a), vz = Math.cos(a); card.set(i, x, 1.2 + h, z, Math.atan2(-vz, vx), f.roll + t * 3, 0.5 * Math.sin(a * 3 + i), f.e); });
    card.fim();
  };
  return { grupo: G, atualizar, funil, placa };
}

// ------------------------------------------------------------------------------------------ corte do chão: rio subterrâneo sobe pelo poço
export async function construirCorte(g, { env = null, kit = null } = {}) {
  const G = new THREE.Group(); g.add(G);
  const W = 9, D = 6;
  // contorno do bloco com a galeria (cavidade) e o poço que sobe até a rua
  const sh = new THREE.Shape();
  [[-W, -9], [W, -9], [W, 0], [3.6, 0], [3.6, -4.2], [8, -4.2], [8, -7.2], [-8, -7.2], [-8, -4.2], [2.2, -4.2], [2.2, 0], [-W, 0]].forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y));
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512; const c = cv.getContext('2d');
  const cam = [['#5a3a22', 0, 0.12], ['#8a5a32', 0.12, 0.38], ['#a87a46', 0.38, 0.62], ['#6a6a78', 0.62, 1.0]]; // faixas: terra escura, argila, areia, rocha
  for (const [cor, a, b] of cam) { c.fillStyle = cor; c.fillRect(0, a * 512, 512, (b - a) * 512 + 1); }
  const rs = mulberry32(3); for (let i = 0; i < 900; i++) { const y = rs() * 512, x = rs() * 512, t = y / 512; c.fillStyle = `rgba(${t > 0.6 ? '25,25,38' : '50,26,12'},${0.12 + 0.2 * rs()})`; c.beginPath(); c.ellipse(x, y, 1.2 + 3.2 * rs(), 0.9 + 1.8 * rs(), rs() * 3, 0, 7); c.fill(); }
  for (let i = 0; i < 26; i++) { c.strokeStyle = `rgba(255,255,255,${0.04 + 0.05 * rs()})`; c.lineWidth = 1 + 2 * rs(); c.beginPath(); const y0 = rs() * 512; c.moveTo(0, y0); c.bezierCurveTo(170, y0 + 8 * (rs() - 0.5), 340, y0 + 8 * (rs() - 0.5), 512, y0); c.stroke(); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1 / (2 * W), 1 / 9); tex.offset.set(0.5, 1);
  const bloco = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: D, bevelEnabled: false }), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })); bloco.position.z = -D; bloco.castShadow = bloco.receiveShadow = true; G.add(bloco);
  // fundo da galeria e do poço (parede de trás) para não ver através
  const fundo = new THREE.Mesh(new THREE.PlaneGeometry(2 * W, 9), new THREE.MeshStandardMaterial({ color: 0x30241c, roughness: 1 })); fundo.position.set(0, -4.5, -D + 0.02); G.add(fundo);
  // rua em cima (asfalto + calçada) e boca do poço
  const rua = new THREE.Mesh(new THREE.BoxGeometry(2 * W, 0.12, D), [0x555568, 0x555568, 0x6a6a7a, 0x3a3a48, 0x555568, 0x555568].map(co => new THREE.MeshStandardMaterial({ color: co, roughness: 0.4, metalness: 0.1, envMap: env, envMapIntensity: 0.5 }))); rua.position.set(0, 0.06, -D / 2); G.add(rua);
  // a rua não cobre o poço: dois pedaços
  rua.visible = false;
  for (const [x0, x1] of [[-W, 2.2], [3.6, W]]) { const r = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.14, D), new THREE.MeshStandardMaterial({ color: 0x6a6a80, roughness: 0.4, metalness: 0.1, envMap: env, envMapIntensity: 0.5 })); r.position.set((x0 + x1) / 2, 0.07, -D / 2); r.receiveShadow = true; G.add(r); }
  for (const x of [-6, -2.5, 6.5]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.14), new THREE.MeshBasicMaterial({ color: 0xffd23a })); f.rotation.x = -Math.PI / 2; f.position.set(x, 0.145, -D / 2); G.add(f); }
  // casas e palmeira no fundo da rua (peças do kit)
  if (kit) { for (const [nome, x, z, ry, esc] of [['casa-colonial', -4.6, -13, 0, 0.6], ['casa-simples', 4.6, -13, 0, 0.6]]) { const o = await kit.peca(nome); o.position.set(x, 0.14, z); o.rotation.y = ry; o.scale.setScalar(esc); G.add(o); } const pa = await kit.peca('arvore-palmeira'); pa.position.set(8.3, 0.14, -7); pa.scale.setScalar(0.8); G.add(pa); }
  // água: galeria (translúcida) e poço (sobe com o tempo)
  const mAgua = new THREE.MeshStandardMaterial({ color: 0x1f8fe8, emissive: 0x0a4aa8, emissiveIntensity: 0.9, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.0, envMap: env, envMapIntensity: 1.0 });
  const gal = new THREE.Mesh(new THREE.BoxGeometry(16 - 0.02, 2.0, D - 0.4), mAgua); gal.position.set(0, -7.2 + 1.0, -D / 2); G.add(gal);
  const poco = new THREE.Mesh(new THREE.BoxGeometry(1.4 - 0.04, 1, D - 0.4), mAgua); poco.position.set(2.9, -4.2, -D / 2); G.add(poco);
  // peixes (maiores que o real, para ler de longe)
  const nF = 16, card = criarCardume(G, nF, { env }), rp = mulberry32(31), F = [];
  for (let i = 0; i < nF; i++) F.push({ y0: -6.3 + 0.9 * rp(), v: 1.4 + 1.2 * rp(), t0: -rp() * 8, fase: rp() * 6.28, e: 3.8 + rp() * 1.6, z: -D / 2 + (rp() - 0.5) * 3.0, sai: 3.7 + 0.17 * i });
  const chuva = criarChuva(G, { n: 5500, caixa: [22, 9, 7] });
  const atualizar = (t, camPos) => {
    const sobe = suave(inv(1.0, 3.7, t));                                        // nível da água no poço (0..1)
    const alt = 0.1 + sobe * 4.4; poco.scale.y = alt; poco.position.y = -4.2 + alt / 2;
    gal.scale.y = 1 + 0.08 * Math.sin(t * 3); gal.position.y = -7.2 + gal.scale.y;
    F.forEach((f, i) => {
      // nada para a direita na galeria; quando a água sobe, entra no poço e sobe; depois é cuspido na rua
      const s = t - f.t0, xg = -7.5 + f.v * s, naG = xg < 2.9;
      const ts = f.sai;                                                           // instante de saída pela boca do poço
      let x, y, yaw, roll = f.fase * 0.2, pit = 0;
      if (t < ts - 0.0 || t < 0) {
        if (naG) { x = xg; y = f.y0 + 0.18 * Math.sin(s * 3 + f.fase); yaw = Math.atan2(-0.18 * 3 * Math.cos(s * 3 + f.fase), f.v) * -1; }
        else { x = 2.9 - 0.45 + 0.9 * ((i * 0.37) % 1); const q = clamp((xg - 2.9) / 1.5); y = lerp(f.y0, -4.2 + alt - 0.3, q); yaw = Math.PI / 2; pit = 0; if (xg > 2.9 + 1.5) { x = 2.9 + 0.2 * Math.sin(s * 5 + i); y = -4.2 + alt - 0.35 - 0.1 * (i % 4); } }
      } else {
        const u = t - ts, vx = (i % 2 ? 1 : -1) * (0.9 + 0.5 * ((i * 0.37) % 1)), vy = 5.0 + 1.2 * ((i * 0.53) % 1);   // arremessado para cima e para o lado
        x = 2.9 + vx * u; y = 0.2 + vy * u - 0.5 * 9.8 * u * u; roll = f.fase + u * 9; yaw = vx > 0 ? 0 : Math.PI; pit = 0.6 * Math.sin(u * 8);
        if (y < 0.18) { y = 0.18 + 0.12 * Math.abs(Math.sin((u - 0.9) * 6)) * Math.exp(-(u - 0.9) * 1.5); roll = -Math.PI / 2 + 0.3 * Math.sin(u * 11); pit = 0; x = 2.9 + vx * Math.min(u, 0.95); }
      }
      card.set(i, x, y, f.z, yaw, roll, pit, f.e);
    });
    card.fim();
    chuva.atualizar(t, [0, 0, -D / 2], { v: 9, vento: 0.1, comp: 0.5, camPos });
  };
  return { grupo: G, atualizar };
}
