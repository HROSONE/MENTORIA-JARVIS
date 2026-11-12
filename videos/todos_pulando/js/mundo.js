// Elementos do Short "todo mundo pulando": a Terra (inteira, empurrada, amassada), o celular com o alerta, a cidade com a multidão, o relógio de meio-dia e um átomo.
import * as THREE from 'three';
import { canvasTex, brilho } from './motor.js';
import { Lote, M } from './lote.js';
import { Ator } from './atores.js';
import { mulberry32, clamp, lerp, suave } from './util.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const OFF = { espaco: [1000, 0, 0], celular: [3000, 0, 0], atomo: [2000, 0, 0], cidade: [0, 0, 0] };

function texTerra() {
  return canvasTex(1024, 512, (g, w, h) => {
    const r = mulberry32(5);
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#12467a'); gr.addColorStop(0.5, '#1b69b0'); gr.addColorStop(1, '#12467a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const cont = (cx, cy, rx, ry, n) => { for (let i = 0; i < n; i++) { const a = r() * 6.28, d = Math.sqrt(r()); g.fillStyle = r() < 0.7 ? '#3f8f3a' : '#9a8a4a'; g.beginPath(); g.ellipse(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, 20 + r() * 50, 14 + r() * 36, r() * 3, 0, 6.3); g.fill(); } };
    cont(250, 190, 120, 80, 70); cont(300, 360, 50, 90, 40); cont(560, 170, 80, 60, 50); cont(600, 320, 60, 90, 45); cont(790, 190, 130, 70, 60); cont(850, 380, 50, 30, 20);
    g.fillStyle = '#f2f6fa'; g.fillRect(0, 0, w, 30); g.fillRect(0, h - 36, w, 36);
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${0.12 + r() * 0.28})`; g.beginPath(); g.ellipse(r() * w, r() * h, 30 + r() * 90, 8 + r() * 22, 0, 0, 6.3); g.fill(); }
  }, { aniso: 8 });
}
function texRachaduras() {
  return canvasTex(1024, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h); const r = mulberry32(9);
    for (let k = 0; k < 28; k++) { let x = r() * w, y = r() * h; g.strokeStyle = 'rgba(255,150,40,0.95)'; g.lineWidth = 2 + r() * 4; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 14; s++) { x += (r() - 0.5) * 90; y += (r() - 0.5) * 60; g.lineTo(x, y); } g.stroke(); }
  });
}

export async function construirMundo(mundo) {
  const d = {};
  const grupos = {};
  for (const k of Object.keys(OFF)) { const g = new THREE.Group(); g.name = k; g.position.set(...OFF[k]); mundo.add(g); grupos[k] = g; }
  d.esconderTudo = () => { for (const k in grupos) grupos[k].visible = false; };
  d.mostrar = k => { grupos[k].visible = true; };
  d.grupos = grupos;

  // ------------------------------------------------------------------ ESPAÇO: a Terra
  const E = grupos.espaco;
  const cvE = document.createElement('canvas'); cvE.width = 2048; cvE.height = 1024; const ge = cvE.getContext('2d'); { const q = mulberry32(3); for (let i = 0; i < 1400; i++) { ge.fillStyle = `rgba(255,255,${225 + (q() * 30 | 0)},${0.2 + q() * 0.8})`; ge.beginPath(); ge.arc(q() * 2048, q() * 1024, q() < 0.05 ? 1.8 : 0.6 + q() * 0.7, 0, 6.3); ge.fill(); } }
  const tE = new THREE.CanvasTexture(cvE); tE.colorSpace = THREE.SRGBColorSpace;
  const domo = new THREE.Mesh(new THREE.SphereGeometry(450, 32, 20), new THREE.MeshBasicMaterial({ map: tE, side: THREE.BackSide, depthWrite: false, fog: false })); domo.frustumCulled = false; E.add(domo);
  const terraG = new THREE.Group(); E.add(terraG); d.terra = terraG;
  const globo = new THREE.Mesh(new THREE.SphereGeometry(5, 64, 48), new THREE.MeshStandardMaterial({ map: texTerra(), roughness: 0.85 })); terraG.add(globo); d.globo = globo;
  const rach = new THREE.Mesh(new THREE.SphereGeometry(5.03, 64, 48), new THREE.MeshBasicMaterial({ map: texRachaduras(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); rach.visible = false; terraG.add(rach); d.rachaduras = rach;
  const atm = brilho('110,170,255', 15.5, 0.55); terraG.add(atm); d.atm = atm;
  d.sol = new THREE.DirectionalLight(0xfff2dc, 3.2); d.sol.position.set(40, 22, 30); E.add(d.sol);
  E.add(new THREE.AmbientLight(0x4a62a8, 1.1));
  const orb = new THREE.Mesh(new THREE.TorusGeometry(40, 0.05, 6, 160), new THREE.MeshBasicMaterial({ color: 0x9fc4ff, transparent: true, opacity: 0.55 })); orb.rotation.x = Math.PI / 2; orb.position.set(-40, 0, 0); E.add(orb); d.orbita = orb;
  d.estrelaSol = brilho('255,230,170', 60, 0.9); d.estrelaSol.position.set(160, 70, 120); E.add(d.estrelaSol);
  // pontinho: a pessoa no ar, em primeiro plano (quadro 0 e fecho)
  const pessoa = new THREE.Group(); const corpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.12, 4, 8), M(0xf2b04a, 0.7)); const cab = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), M(0xe8b898, 0.8)); cab.position.y = 0.15; pessoa.add(corpo, cab); E.add(pessoa); d.pessoaEspaco = pessoa;

  // ------------------------------------------------------------------ ÁTOMO
  const A = grupos.atomo;
  A.add(new THREE.PointLight(0xaed0ff, 40, 30, 1.6)); A.add(new THREE.AmbientLight(0x334466, 0.8));
  const nucleo = new THREE.Group(); A.add(nucleo);
  const rr = mulberry32(2);
  for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 14), M(i % 2 ? 0xe04a3a : 0x4a6fe0, 0.4, { emissive: i % 2 ? 0x400a06 : 0x0a1440, emissiveIntensity: 1 })); m.position.set((rr() - 0.5) * 0.7, (rr() - 0.5) * 0.7, (rr() - 0.5) * 0.7); nucleo.add(m); }
  nucleo.add(brilho('255,200,160', 3.2, 0.7));
  d.eletrons = [];
  for (let i = 0; i < 3; i++) { const anel = new THREE.Mesh(new THREE.TorusGeometry(2.4 + i * 0.9, 0.012, 6, 120), new THREE.MeshBasicMaterial({ color: 0x8fb4ff, transparent: true, opacity: 0.5 })); anel.rotation.set(i * 1.05, i * 0.6, 0); A.add(anel); const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), new THREE.MeshBasicMaterial({ color: 0xdff0ff })); const brl = brilho('170,210,255', 0.9, 0.9); e.add(brl); anel.add(e); d.eletrons.push({ e, anel, raio: 2.4 + i * 0.9, vel: 1.4 - i * 0.3, fase: i * 2 }); }

  // ------------------------------------------------------------------ CELULAR
  const C = grupos.celular;
  C.add(new THREE.AmbientLight(0x555566, 0.8)); const lc = new THREE.PointLight(0xff3040, 0, 12, 1.5); lc.position.set(0, 0, 2.5); C.add(lc); d.luzAlerta = lc;
  const tel = document.createElement('canvas'); tel.width = 360; tel.height = 740; const gt = tel.getContext('2d');
  const tT = new THREE.CanvasTexture(tel); tT.colorSpace = THREE.SRGBColorSpace; tT.anisotropy = 8;
  d.cel = new THREE.Group(); C.add(d.cel);
  const corpoC = new THREE.Mesh(new THREE.BoxGeometry(0.80, 1.64, 0.09), M(0x14151a, 0.35, { metalness: 0.7 })); d.cel.add(corpoC);
  const telaC = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 1.54), new THREE.MeshBasicMaterial({ map: tT })); telaC.position.z = 0.047; d.cel.add(telaC);
  d.telaCel = (t, rev) => {                                   // desenha o alerta (pisca em vermelho); rev = 0..1 revela o texto linha a linha
    const pisca = 0.5 + 0.5 * Math.sin(t * 9);
    gt.fillStyle = `rgb(${90 + 110 * pisca | 0},8,16)`; gt.fillRect(0, 0, 360, 740);
    gt.fillStyle = '#fff'; gt.textAlign = 'center';
    gt.font = 'bold 36px "DejaVu Sans", sans-serif'; gt.fillText('⚠ ALERTA', 180, 120); gt.font = 'bold 34px "DejaVu Sans", sans-serif'; gt.fillText('GLOBAL', 180, 168);
    const L = [['HOJE ÀS 12:00', 270, 38, '#ffe27a'], ['TODOS DEVEM PULAR', 340, 26, '#fff'], ['QUEM NÃO PULAR:', 450, 24, '#fff'], ['BANIDO DA SOCIEDADE', 505, 25, '#ffb0b0'], ['OU PRISÃO PERPÉTUA', 555, 25, '#ffb0b0']];
    L.forEach(([tx, y, s, c], i) => { gt.globalAlpha = clamp(rev * 5 - i); gt.fillStyle = c; gt.font = `bold ${s}px "DejaVu Sans", sans-serif`; gt.fillText(tx, 180, y); }); gt.globalAlpha = 1;
    tT.needsUpdate = true; lc.intensity = 3 + 14 * pisca;
  };
  d.telaCel(0, 0);

  // ------------------------------------------------------------------ CIDADE
  const Ci = grupos.cidade;
  Ci.add(new THREE.HemisphereLight(0xcfe6ff, 0x6a7a5a, 1.1));
  d.solC = new THREE.DirectionalLight(0xfff4e0, 2.6); d.solC.position.set(60, 120, 40); d.solC.castShadow = true; d.solC.shadow.mapSize.set(2048, 2048); Object.assign(d.solC.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 10, far: 300 }); Ci.add(d.solC, d.solC.target);
  const asf = new THREE.Mesh(new THREE.CircleGeometry(200, 64), M(0x5a5d62, 0.95)); asf.rotation.x = -Math.PI / 2; asf.receiveShadow = true; Ci.add(asf);
  const grama = new THREE.Mesh(new THREE.RingGeometry(200, 1500, 64), M(0x58824a, 1)); grama.rotation.x = -Math.PI / 2; grama.position.y = -0.02; Ci.add(grama);
  
  // casa (porta de onde saem) em z = 0, fachada voltada para +z
  const L = new Lote(Ci);
  L.caixa(10, 6, 7, M(0xe8d9bd, 0.9), 0, 3, -3.6); L.caixa(10.8, 0.5, 7.8, M(0x8a3a2a, 0.8), 0, 6.3, -3.6);
  L.caixa(1.5, 2.5, 0.12, M(0x5a3a22, 0.7), 0, 1.25, 0.02); L.caixa(1.2, 0.2, 1.4, M(0x9a9a98, 1), 0, 0.1, 0.9);
  for (const sx of [-3.2, 3.2]) L.caixa(1.6, 1.4, 0.1, M(0x8fb8e0, 0.2, { emissive: 0x203040, emissiveIntensity: 0.5 }), sx, 3.2, 0.02);
  const rc = mulberry32(12);
  for (let i = 0; i < 70; i++) { const a = rc() * 6.28, ra = 60 + rc() * 160; const w = 6 + rc() * 12, h = 6 + rc() * 24; L.caixa(w, h, w, M(new THREE.Color().setHSL(0.08 + rc() * 0.1, 0.12, 0.55 + rc() * 0.25), 0.9), Math.cos(a) * ra, h / 2, -Math.abs(Math.sin(a)) * ra - 25); }
  L.fechar();
  // relógio digital gigante
  const cvR = document.createElement('canvas'); cvR.width = 512; cvR.height = 200; const gR = cvR.getContext('2d'); const tR = new THREE.CanvasTexture(cvR); tR.colorSpace = THREE.SRGBColorSpace;
  d.relogio = new THREE.Group(); d.relogio.position.set(0, 14, -42); Ci.add(d.relogio);
  d.relogio.add(new THREE.Mesh(new THREE.BoxGeometry(24, 9.4, 1.4), M(0x15161a, 0.5, { metalness: 0.5 })));
  const telaR = new THREE.Mesh(new THREE.PlaneGeometry(22.6, 8.4), new THREE.MeshBasicMaterial({ map: tR })); telaR.position.z = 0.72; d.relogio.add(telaR);
  d.horaRelogio = (txt, brilhoK = 1) => { gR.fillStyle = '#05060a'; gR.fillRect(0, 0, 512, 200); gR.fillStyle = `rgba(255,${70 + 40 * brilhoK | 0},50,1)`; gR.font = 'bold 150px "DejaVu Sans Mono", monospace'; gR.textAlign = 'center'; gR.fillText(txt, 256, 150); tR.needsUpdate = true; };
  d.horaRelogio('11:59');
  // multidão instanciada
  const N = 1100;
  const gc = new THREE.CapsuleGeometry(0.28, 0.9, 3, 8); gc.translate(0, 0.75, 0);
  const gcab = new THREE.SphereGeometry(0.24, 10, 8); gcab.translate(0, 1.55, 0);
  const merged = (await import('three/addons/utils/BufferGeometryUtils.js')).mergeGeometries([gc, gcab]);
  const im = new THREE.InstancedMesh(merged, new THREE.MeshStandardMaterial({ roughness: 0.8 }), N); im.castShadow = true; im.frustumCulled = false; Ci.add(im);
  const pos0 = [], pos1 = [], dly = [], fase = []; const rp = mulberry32(33); const col = new THREE.Color();
  for (let i = 0; i < N; i++) {
    let a, ra, px, pz; do { a = rp() * 6.28; ra = Math.sqrt(rp()) * 75 + 4; px = Math.cos(a) * ra; pz = 2 + Math.abs(Math.sin(a)) * ra * 0.9 + 4; } while (Math.hypot(px, pz - 18) < 12); pos1.push([px, pz]);
    pos0.push([(rp() - 0.5) * 2.4, 1.5]); dly.push(rp() * 0.6); fase.push(rp() * 6.28);
    col.setHSL(rp(), 0.55, 0.45 + rp() * 0.2); im.setColorAt(i, col);
  }
  const mm = new THREE.Matrix4(), qq = new THREE.Quaternion(), ee = new THREE.Euler();
  d.multidao = (cheia, tp) => {                              // cheia 0..1: saem de casa e se espalham; tp: segundos desde o pulo (<0 = ainda sem pular)
    for (let i = 0; i < N; i++) {
      const k = suave((cheia - dly[i] * 0.6) / 0.4);
      const x = lerp(pos0[i][0], pos1[i][0], k), z = lerp(pos0[i][1], pos1[i][1], k);
      let y = 0;
      if (tp >= 0) { const u = tp - (fase[i] % 0.18) * 0.1; if (u > 0 && u < 0.7) y = 3.4 * 4 * u / 0.7 * (1 - u / 0.7); }
      else y = 0.04 * Math.abs(Math.sin(cheia * 40 + fase[i])) * (k > 0.05 && k < 0.95 ? 1 : 0);
      ee.set(0, Math.PI + Math.atan2(x, z) * 0.0, 0); qq.setFromEuler(ee);
      mm.compose(V(x, y, z), qq, V(1, 1, 1)); im.setMatrixAt(i, mm);
    }
    im.instanceMatrix.needsUpdate = true;
  };
  d.multidao(0, -1);
  // ondas de choque no chão (anéis que se expandem) + cúpula translúcida
  d.aneis = []; const mat = () => new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.RingGeometry(0.84, 1, 128), mat()); r.rotation.x = -Math.PI / 2; r.position.set(0, 0.2 + i * 0.01, 18); r.visible = false; r.frustumCulled = false; Ci.add(r); d.aneis.push(r); }
  d.cupula = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), mat()); d.cupula.position.set(0, 0, 18); d.cupula.visible = false; d.cupula.frustumCulled = false; Ci.add(d.cupula);
  d.ondas = tp => {                                                // tp = segundos desde o pulo; anéis a ~70 m/s, a cada 0,22 s
    d.aneis.forEach((r, i) => { const u = tp - i * 0.22; r.visible = u > 0 && u < 2.6; if (!r.visible) return; const R = 3 + u * 75; r.scale.set(R, R, R); r.material.opacity = Math.min(1, 1.6 * Math.exp(-u * 1.3)); });
    const u = tp; d.cupula.visible = u > 0 && u < 1.6; if (d.cupula.visible) { const R = 3 + u * 90; d.cupula.scale.set(R, R * 0.28, R); d.cupula.material.opacity = 0.5 * Math.exp(-u * 2.2); }
  };
  d.ondas(-1);
  // personagens de verdade (herói do pulo e quem sai de casa)
  d.heroi = await Ator.criar('jovem_b'); Ci.add(d.heroi.grupo);
  d.saindo = [await Ator.criar('homem'), await Ator.criar('mae'), await Ator.criar('jovem_a')]; for (const a of d.saindo) Ci.add(a.grupo);
  return d;
}
