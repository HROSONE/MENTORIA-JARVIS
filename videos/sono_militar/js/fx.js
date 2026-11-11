// Efeitos de guerra, todos função do tempo: explosões (bola de fogo, clarão, onda de choque, fumaça, poeira, estilhaços), rastros de tiro, mísseis com fumaça, aviões, holofotes, fogueiras.
import * as THREE from 'three';
import { brilho, Rajada, texFumaca, canvasTex } from './motor.js';
import { clamp, lerp, mulberry32, ruido } from './util.js';

const M = (c, r = 0.9, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...x });

export function criarCaca(esc = 1) {
  const g = new THREE.Group();
  const corpo = M(0x2a2e33, 0.5, { metalness: 0.3 });
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, 7.5, 12), corpo); fus.rotation.x = Math.PI / 2; g.add(fus);
  const nariz = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.2, 12), corpo); nariz.rotation.x = Math.PI / 2; nariz.position.z = 4.8; g.add(nariz);
  const asa = new THREE.Shape(); asa.moveTo(0, 0); asa.lineTo(5.6, -1.8); asa.lineTo(5.6, -3.0); asa.lineTo(0, -3.4); asa.closePath();
  for (const sx of [-1, 1]) { const m = new THREE.Mesh(new THREE.ExtrudeGeometry(asa, { depth: 0.12, bevelEnabled: false }), corpo); m.rotation.x = Math.PI / 2; m.scale.x = sx; m.position.set(0, -0.05, 0.9); g.add(m); }
  const cauda = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 1.8), corpo); cauda.position.set(0, 0.95, -3.2); cauda.rotation.x = -0.3; g.add(cauda);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.1), corpo); e.position.set(sx * 1.3, 0.1, -3.4); g.add(e); }
  const glow = brilho('255,150,70', 3.0, 0.9); glow.position.set(0, 0, -4.2); g.add(glow);
  const verm = brilho('255,40,30', 0.9, 0.9); verm.position.set(5.5, 0, -2.4); g.add(verm);
  const verd = brilho('50,255,90', 0.9, 0.9); verd.position.set(-5.5, 0, -2.4); g.add(verd);
  g.scale.setScalar(esc);
  g.userData.glow = glow;
  return g;
}

export function criarFX(mundo) {
  const d = { eventos: [], rastros: [], misseis: [], avioes: [], luzFlash: null };
  const raiz = new THREE.Group(); mundo.add(raiz); d.raiz = raiz;
  const tf = texFumaca();
  const tmp = new THREE.Vector3();

  // ---------------------------------------------------------------- explosões (pool)
  const N = 28, exps = [];
  const geoCaco = new THREE.BoxGeometry(0.1, 0.07, 0.1);
  const matCaco = M(0x4a3f33, 1);
  for (let i = 0; i < N; i++) {
    const g = new THREE.Group(); g.visible = false; raiz.add(g);
    const r = mulberry32(100 + i);
    const nucleo = brilho('255,196,110', 1, 0), clar = brilho('255,255,235', 1, 0);
    const anel = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.0, 48), new THREE.MeshBasicMaterial({ color: 0xffc888, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false, fog: false }));
    anel.rotation.x = -Math.PI / 2; anel.position.y = 0.08;
    const fumacas = [], poeira = [];
    for (let k = 0; k < 9; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tf, color: 0x2b2724, transparent: true, opacity: 0, depthWrite: false })); s.renderOrder = 5; g.add(s); fumacas.push({ s, jx: r() - 0.5, jz: r() - 0.5, v: 1.3 + r() * 1.4 }); }
    for (let k = 0; k < 6; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tf, color: 0x7a6a56, transparent: true, opacity: 0, depthWrite: false })); s.renderOrder = 4; g.add(s); poeira.push({ s, a: r() * 6.28 }); }
    g.add(nucleo, clar, anel);
    const caco = new Rajada(g, { n: 24, geo: geoCaco, mat: matCaco, t0: 0, vida: 3.4, semente: 200 + i, origem: [0, 0.2, 0], raio: 0.3, vel: [5, 16], dir: [0, 1, 0], abre: 1.3, grav: 9.8, arrasto: 0.15, tam: [0.5, 1.6], gira: 9, chao: 0.0, quica: 0.2 });
    exps.push({ g, nucleo, clar, anel, fumacas, poeira, caco });
  }
  d.luzFlash = new THREE.PointLight(0xffa860, 0, 140, 1.5); raiz.add(d.luzFlash);

  // ---------------------------------------------------------------- rastros de tiro (pool)
  const NR = 48, rastros = [];
  const matRas = new THREE.MeshBasicMaterial({ color: 0xffd36a, fog: false });
  for (let i = 0; i < NR; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 3.5), matRas); m.visible = false; raiz.add(m);
    const h = brilho('255,210,120', 1.4, 0.9); h.visible = false; raiz.add(h);
    rastros.push({ m, h });
  }

  // ---------------------------------------------------------------- mísseis (pool)
  const NM = 6, misseis = [];
  for (let i = 0; i < NM; i++) {
    const g = new THREE.Group(); g.visible = false; raiz.add(g);
    const corpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 2.4, 4, 10), M(0x8a8f94, 0.4, { metalness: 0.5 })); corpo.rotation.x = Math.PI / 2; g.add(corpo);
    for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.5), M(0x555a5e)); f.position.z = -1.0; f.rotation.z = k * Math.PI / 2; g.add(f); }
    const fogo = brilho('255,170,70', 3.2, 1.0); fogo.position.z = -1.6; g.add(fogo);
    const rabo = [];
    for (let k = 0; k < 16; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tf, color: 0xc9c4bc, transparent: true, opacity: 0, depthWrite: false })); s.renderOrder = 5; raiz.add(s); rabo.push(s); }
    misseis.push({ g, rabo });
  }

  // ---------------------------------------------------------------- aviões (pool)
  const NA = 4, avioes = [];
  for (let i = 0; i < NA; i++) { const a = criarCaca(1.0); a.visible = false; raiz.add(a); avioes.push(a); }

  // ---------------------------------------------------------------- holofotes
  d.holofotes = [];
  const gradCone = canvasTex(8, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,250,225,0.55)'); gr.addColorStop(1, 'rgba(255,250,225,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  d.addHolofote = (x, z, fase, vel) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); raiz.add(g);
    const geo = new THREE.CylinderGeometry(0.2, 6.0, 140, 20, 1, true); geo.translate(0, -70, 0);
    const cone = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: gradCone, transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    cone.rotation.x = Math.PI;                                                       // ponta embaixo, abre para cima
    cone.frustumCulled = false;
    g.add(cone);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.7, 14), M(0x3a3f44, 0.5, { metalness: 0.5 })); b.position.y = 0.35; g.add(b);
    d.holofotes.push({ g, cone, fase, vel });
  };

  // ---------------------------------------------------------------- fogueiras e chamas
  d.fogos = [];
  d.addFogo = (x, y, z, tam = 1) => {
    const gl = brilho('255,150,60', 4 * tam, 0.9); gl.position.set(x, y + 1.0 * tam, z); raiz.add(gl);
    const nu = brilho('255,220,140', 1.6 * tam, 0.9); nu.position.set(x, y + 0.6 * tam, z); raiz.add(nu);
    const col = [];
    for (let k = 0; k < 6; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tf, color: 0x2a2624, transparent: true, opacity: 0, depthWrite: false, fog: true })); s.renderOrder = 3; raiz.add(s); col.push(s); }
    d.fogos.push({ gl, nu, col, x, y, z, tam, fase: Math.random() * 6 });
  };

  // intensidade (0..~3) dos clarões recentes, com ou sem queda pela distância: serve para luz de rosto, tremor de câmera e clarão de tela
  d.pulso = (t, px = null, pz = 0, raio = 30) => {
    let a = 0;
    for (const e of d.eventos) { const age = t - e.t; if (age < 0 || age > 1.4) continue; const dist = px == null ? 0 : Math.hypot(e.x - px, e.z - pz); a += (e.tam ?? 1) * Math.exp(-age * 9) / (1 + (dist / raio) ** 2); }
    return a;
  };
  // ---------------------------------------------------------------- atualização
  d.atualizar = (t, camera, { holofotes = true } = {}) => {
    let melhor = 0, mpos = null, mcor = null;
    // desliga todo o pool e liga só os eventos ativos
    exps.forEach(x => { x.g.visible = false; });
    d.eventos.forEach((e, idx) => {
      const x = exps[idx % N];
      const age = t - e.t, tam = e.tam ?? 1;
      if (age < 0 || age > 4.6) return;
      x.g.visible = true; x.g.position.set(e.x, e.y ?? 0, e.z);
      const sc = tam;
      const core = sc * (1.6 + 7.5 * (1 - Math.exp(-age * 9)) + 0.9 * age);
      x.nucleo.scale.setScalar(core); x.nucleo.position.y = sc * (0.9 + 1.6 * (1 - Math.exp(-age * 6))); x.nucleo.material.opacity = Math.exp(-age * 2.6) * (age < 2 ? 1 : 0);
      x.clar.scale.setScalar(sc * (4 + 13 * Math.exp(-age * 12))); x.clar.position.y = x.nucleo.position.y * 0.7; x.clar.material.opacity = Math.exp(-age * 15);
      x.anel.scale.setScalar(sc * (0.8 + age * 32)); x.anel.material.opacity = 0.55 * Math.exp(-age * 5) * (age < 1.2 ? 1 : 0);
      x.fumacas.forEach((f, k) => {
        const u = age - (0.06 + k * 0.08);
        if (u <= 0) { f.s.material.opacity = 0; return; }
        f.s.position.set(f.jx * u * 2.2 * sc, sc * (0.8 + u * f.v * 1.4), f.jz * u * 2.2 * sc);
        f.s.scale.setScalar(sc * (1.8 + u * 2.6)); f.s.material.opacity = clamp(1 - u / 3.9) * 0.62 * Math.min(u * 5, 1);
      });
      x.poeira.forEach(p => {
        const u = age - 0.03; if (u <= 0) { p.s.material.opacity = 0; return; }
        p.s.position.set(Math.cos(p.a) * u * 4.2 * sc, 0.5 * sc, Math.sin(p.a) * u * 4.2 * sc);
        p.s.scale.setScalar(sc * (1.6 + u * 2.2)); p.s.material.opacity = clamp(1 - u / 2.6) * 0.34;
      });
      x.g.scale.setScalar(1);
      x.caco.mesh.scale.setScalar(sc);
      x.caco.atualizar(age, camera);
      const dist = camera ? camera.position.distanceTo(x.g.position) : 20;
      const I = sc * Math.exp(-age * 7.5) * 1.0 / (1 + (dist / 28) ** 2);
      if (I > melhor) { melhor = I; mpos = x.g.position; }
    });
    if (mpos) { d.luzFlash.position.set(mpos.x, 2.5, mpos.z); d.luzFlash.intensity = 2600 * melhor; d.luzFlash.color.setHex(0xffa05a); } else d.luzFlash.intensity = 0;
    // rastros
    rastros.forEach(r => { r.m.visible = false; r.h.visible = false; });
    d.rastros.forEach((e, idx) => {
      const r = rastros[idx % NR]; if (!r) return;
      const de = new THREE.Vector3(...e.de), para = new THREE.Vector3(...e.para), dir = para.clone().sub(de), L = dir.length(); dir.normalize();
      const age = t - e.t, v = e.vel ?? 160;
      if (age < 0 || age * v > L + 4) return;
      tmp.copy(de).addScaledVector(dir, Math.min(age * v, L));
      r.m.visible = true; r.m.position.copy(tmp); r.m.lookAt(tmp.clone().add(dir)); r.h.visible = true; r.h.position.copy(tmp);
    });
    // mísseis
    misseis.forEach(m => { m.g.visible = false; m.rabo.forEach(s => { s.material.opacity = 0; }); });
    d.misseis.forEach((e, idx) => {
      const m = misseis[idx % NM]; if (!m) return;
      const de = new THREE.Vector3(...e.de), para = new THREE.Vector3(...e.para);
      const age = t - e.t, dur = e.dur;
      const pos = u => { const p = de.clone().lerp(para, u); p.y += Math.sin(Math.PI * u) * (e.arco ?? 6); return p; };
      if (age < 0 || age > dur + 2.5) return;
      const u = clamp(age / dur);
      if (age <= dur) { m.g.visible = true; const p = pos(u), q = pos(Math.min(1, u + 0.01)); m.g.position.copy(p); m.g.lookAt(q); }
      m.rabo.forEach((s, k) => {
        const ua = clamp((age - k * 0.045) / dur); const back = age - k * 0.045; if (back < 0) return;
        const p = pos(ua); s.position.copy(p); s.scale.setScalar(1.2 + k * 0.45); s.material.opacity = clamp(1 - k / 16) * 0.5 * clamp((dur + 2.5 - age) / 2.5);
      });
    });
    // aviões
    avioes.forEach(a => { a.visible = false; });
    d.avioes.forEach((e, idx) => {
      const a = avioes[idx % NA]; if (!a) return;
      const age = t - e.t; if (age < 0 || age > e.dur) return;
      const u = age / e.dur, de = new THREE.Vector3(...e.de), para = new THREE.Vector3(...e.para);
      a.visible = true; a.scale.setScalar(e.esc ?? 1);
      a.position.copy(de).lerp(para, u); a.lookAt(para); a.rotateZ(0.25 * Math.sin(u * 5 + idx));
      a.userData.glow.material.opacity = 0.8 + 0.2 * Math.sin(t * 40);
    });
    // holofotes: varrem o céu
    d.holofotes.forEach(h => {
      h.cone.visible = holofotes;
      h.g.rotation.z = 0.55 * Math.sin(t * h.vel + h.fase);
      h.g.rotation.x = 0.35 * Math.sin(t * h.vel * 0.7 + h.fase * 1.7);
    });
    // fogueiras
    d.fogos.forEach(f => {
      const fl = 0.8 + 0.2 * ruido(t * 9, f.fase) + 0.1 * Math.sin(t * 23 + f.fase);
      f.gl.material.opacity = 0.85 * fl; f.gl.scale.setScalar(4 * f.tam * (0.9 + 0.2 * fl)); f.nu.scale.setScalar(1.6 * f.tam * fl);
      f.col.forEach((s, k) => {
        const u = (((t * 0.22 + k / f.col.length + f.fase) % 1) + 1) % 1;
        s.position.set(f.x + Math.sin(u * 4 + k) * 0.6 * f.tam, f.y + 1.2 * f.tam + u * 8 * f.tam, f.z);
        s.scale.setScalar((1.2 + u * 3.5) * f.tam); s.material.opacity = Math.sin(u * Math.PI) * 0.5;
      });
    });
  };
  return d;
}
