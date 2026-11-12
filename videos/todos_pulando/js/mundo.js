// Elementos do Short "todo mundo pulando": a Terra (inteira, empurrada, amassada), o celular com o alerta, a cidade com a multidão, o relógio de meio-dia e um átomo.
import * as THREE from 'three';
import { canvasTex, brilho } from './motor.js';
import { Lote, M } from './lote.js';
import { Ator } from './atores.js';
import { Kit } from '../../biblioteca3d/cidade/kit.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32, clamp, lerp, suave } from './util.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const OFF = { espaco: [1000, 0, 0], celular: [3000, 0, 0], atomo: [2000, 0, 0], cidade: [0, 0, 0], africa: [4000, 0, 0], brasil: [5000, 0, 0], china: [6000, 0, 0] };
export const CZ = 12;                                              // centro da praça (onde o herói pula e nascem as ondas)

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
  const tel = document.createElement('canvas'); tel.width = 540; tel.height = 1110; const gt = tel.getContext('2d');
  const tT = new THREE.CanvasTexture(tel); tT.colorSpace = THREE.SRGBColorSpace; tT.anisotropy = 8;
  d.cel = new THREE.Group(); C.add(d.cel);
  const rr_ = (w, h, r) => { const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0); s.lineTo(w / 2, h / 2 - r); s.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2); s.lineTo(-w / 2 + r, h / 2); s.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI); s.lineTo(-w / 2, -h / 2 + r); s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5); return s; };
  const corpoC = new THREE.Mesh(new THREE.ExtrudeGeometry(rr_(0.80, 1.66, 0.11), { depth: 0.07, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 4, curveSegments: 20 }), M(0x2a2c34, 0.3, { metalness: 0.85 })); corpoC.position.z = -0.035; d.cel.add(corpoC);
  const telaC = new THREE.Mesh(new THREE.ShapeGeometry(rr_(0.75, 1.60, 0.085), 20), new THREE.MeshBasicMaterial({ map: tT })); telaC.position.z = 0.0505;
  { const uv = telaC.geometry.attributes.uv, p = telaC.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 0.75 + 0.5, p.getY(i) / 1.60 + 0.5); }
  d.cel.add(telaC);
  for (const [y, h] of [[0.35, 0.16], [0.12, 0.10], [-0.04, 0.10]]) { const bt = new THREE.Mesh(new THREE.BoxGeometry(0.014, h, 0.03), M(0x3a3c44, 0.4, { metalness: 0.8 })); bt.position.set(0.41, y, 0); d.cel.add(bt); }
  d.telaCel = (t, rev) => {                                   // tela de bloqueio com a notificação de alerta; rev = 0..1 revela as linhas
    const pisca = 0.5 + 0.5 * Math.sin(t * 6), W = 540, H = 1110;
    const gr = gt.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#12182e'); gr.addColorStop(1, '#0a0d1a'); gt.fillStyle = gr; gt.fillRect(0, 0, W, H);
    gt.fillStyle = '#fff'; gt.textAlign = 'left'; gt.font = '600 26px "DejaVu Sans", sans-serif'; gt.fillText('11:58', 44, 60);
    gt.textAlign = 'right'; gt.fillText('5G ▮▮▮ ▭', W - 44, 60); gt.fillStyle = '#000'; gt.beginPath(); gt.arc(W / 2, 44, 16, 0, 6.3); gt.fill();
    gt.textAlign = 'center'; gt.fillStyle = '#e8eefc'; gt.font = '200 150px "DejaVu Sans", sans-serif'; gt.fillText('11:58', W / 2, 250); gt.font = '28px "DejaVu Sans", sans-serif'; gt.fillStyle = '#9fb0d8'; gt.fillText('quinta-feira, 12 de novembro', W / 2, 300);
    const x = 30, y = 360, w = W - 60, h = 520;                  // cartão da notificação
    gt.fillStyle = `rgba(${150 + 90 * pisca | 0},20,34,0.97)`; gt.beginPath(); gt.roundRect(x, y, w, h, 34); gt.fill();
    gt.fillStyle = 'rgba(255,255,255,0.18)'; gt.beginPath(); gt.roundRect(x + 24, y + 22, 44, 44, 12); gt.fill(); gt.fillStyle = '#fff'; gt.font = 'bold 34px "DejaVu Sans", sans-serif'; gt.textAlign = 'center'; gt.fillText('!', x + 46, y + 56);
    gt.textAlign = 'left'; gt.font = '600 24px "DejaVu Sans", sans-serif'; gt.fillStyle = '#ffd7d7'; gt.fillText('ALERTA GLOBAL · agora', x + 82, y + 52);
    const L = [['HOJE ÀS 12:00', 150, 56, '#ffe27a'], ['TODOS DEVEM PULAR', 215, 38, '#fff'], ['Quem não pular:', 300, 30, '#ffd7d7'], ['BANIDO DA SOCIEDADE', 360, 34, '#fff'], ['OU PRISÃO PERPÉTUA', 415, 34, '#fff']];
    gt.textAlign = 'center'; L.forEach(([tx, yy, s, c], i) => { gt.globalAlpha = clamp(rev * 5 - i); gt.fillStyle = c; gt.font = `bold ${s}px "DejaVu Sans", sans-serif`; gt.fillText(tx, W / 2, y + yy); }); gt.globalAlpha = 1;
    gt.fillStyle = 'rgba(255,255,255,0.12)'; gt.beginPath(); gt.roundRect(W / 2 - 70, H - 36, 140, 8, 4); gt.fill();
    tT.needsUpdate = true; lc.intensity = 2 + 8 * pisca;
  };
  d.telaCel(0, 0);

  // ------------------------------------------------------------------ CIDADES (kit da cidade) E MULTIDÕES
  const kit = await Kit.carregar('../biblioteca3d/cidade/'); d.kit = kit;
  const PALETAS = {
    cidade: { pele: ['#f1c9a5', '#d9a07a', '#b57a52', '#8a5638', '#5a3a28'], roupa: [0xf2d13a, 0x2e9a4f, 0x2a62c8, 0xf4f4f0, 0xd24a3a, 0x333a44] },
    brasil: { pele: ['#f1c9a5', '#d9a07a', '#b57a52', '#8a5638', '#5a3a28'], roupa: [0xf2d13a, 0x2e9a4f, 0x2a62c8, 0xf4f4f0, 0xff7a2a, 0x18a0a8] },
    africa: { pele: ['#5a3a28', '#3f2a1e', '#7a5238', '#2e1f16', '#6a4630'], roupa: [0xe8731a, 0xd0262e, 0xf2c21a, 0x1f6fc8, 0x1f9a4a, 0x8a2a8a] },
    china: { pele: ['#f0cfa8', '#e6bd92', '#d9ad82', '#efc9a0'], roupa: [0xd0202a, 0xd0202a, 0x22252c, 0x6a6e78, 0xf2f2ee, 0xe8b020] },
  };
  const corpoG = new THREE.CapsuleGeometry(0.28, 0.9, 3, 8); corpoG.translate(0, 0.75, 0);
  const cabG = new THREE.SphereGeometry(0.24, 10, 8); cabG.translate(0, 1.55, 0);
  const mm = new THREE.Matrix4(), qq = new THREE.Quaternion(), ee = new THREE.Euler();
  function fabMultidao(G, tipo, N = 1000, raio = 72) {
    const P = PALETAS[tipo], rp = mulberry32(33 + tipo.length * 7), col = new THREE.Color();
    const ib = new THREE.InstancedMesh(corpoG, new THREE.MeshStandardMaterial({ roughness: 0.85 }), N), ih = new THREE.InstancedMesh(cabG, new THREE.MeshStandardMaterial({ roughness: 0.7 }), N);
    ib.castShadow = ih.castShadow = true; ib.frustumCulled = ih.frustumCulled = false; G.add(ib, ih);
    const pos0 = [], pos1 = [], dly = [], fase = [];
    for (let i = 0; i < N; i++) {
      let px, pz; do { const a = rp() * 6.28, ra = Math.sqrt(rp()) * raio + 4; px = Math.cos(a) * ra; pz = CZ + Math.sin(a) * ra * 0.9; } while (Math.hypot(px, pz - CZ) < 12 || pz < 3 || (Math.abs(px) < 7 && pz > CZ));
      pos1.push([px, pz]); pos0.push([(rp() - 0.5) * 2.4, 1.5]); dly.push(rp() * 0.6); fase.push(rp() * 6.28);
      col.setHex(P.roupa[(rp() * P.roupa.length) | 0]).offsetHSL(0, 0, (rp() - 0.5) * 0.12); ib.setColorAt(i, col); ih.setColorAt(i, col.set(P.pele[(rp() * P.pele.length) | 0]));
    }
    return (cheia, tp) => {                                            // cheia 0..1: saem de casa e se espalham; tp: s desde o pulo (<0 = ainda sem pular)
      for (let i = 0; i < N; i++) {
        const k = suave((cheia - dly[i] * 0.6) / 0.4), x = lerp(pos0[i][0], pos1[i][0], k), z = lerp(pos0[i][1], pos1[i][1], k);
        let y = 0; if (tp >= 0) { const u = tp - (fase[i] % 0.18) * 0.1; if (u > 0 && u < 0.7) y = 3.4 * 4 * u / 0.7 * (1 - u / 0.7); } else y = 0.04 * Math.abs(Math.sin(cheia * 40 + fase[i])) * (k > 0.05 && k < 0.95 ? 1 : 0);
        ee.set(0, 0, 0); qq.setFromEuler(ee); mm.compose(V(x, y, z), qq, V(1, 1, 1)); ib.setMatrixAt(i, mm); ih.setMatrixAt(i, mm);
      }
      ib.instanceMatrix.needsUpdate = ih.instanceMatrix.needsUpdate = true;
    };
  }
  // ondas de choque: anéis no chão, parede de ar brilhante e cúpula; velocidade VON m/s (lenta o bastante para ver a câmera sendo atingida)
  const VON = 28;
  d.VON = VON;
  const gradV = canvasTex(8, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(255,225,170,0.55)'); gr.addColorStop(1, 'rgba(255,240,210,1)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  function fabOndas(G) {
    const aneis = [], mat = () => new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.RingGeometry(0.84, 1, 128), mat()); r.rotation.x = -Math.PI / 2; r.position.set(0, 0.2 + i * 0.01, CZ); r.visible = false; r.frustumCulled = false; G.add(r); aneis.push(r); }
    const parede = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 128, 1, true), new THREE.MeshBasicMaterial({ map: gradV, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); parede.position.set(0, 0, CZ); parede.visible = false; parede.frustumCulled = false; G.add(parede);
    const cup = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), mat()); cup.position.set(0, 0, CZ); cup.visible = false; cup.frustumCulled = false; G.add(cup);
    return tp => {                                                     // tp = s desde o POUSO
      aneis.forEach((r, i) => { const u = tp - i * 0.25; r.visible = u > 0 && u < 3.4; if (!r.visible) return; const R = 3 + u * VON; r.scale.set(R, R, R); r.material.opacity = Math.min(1, 1.7 * Math.exp(-u * 0.9)); });
      parede.visible = tp > 0 && tp < 3.0; if (parede.visible) { const R = 3 + tp * VON, hh = Math.min(14, 2 + tp * 9); parede.scale.set(R, hh, R); parede.position.y = hh / 2; parede.material.opacity = 0.55 * Math.exp(-tp * 0.8); }
      cup.visible = tp > 0 && tp < 1.8; if (cup.visible) { const R = 3 + tp * VON * 1.1; cup.scale.set(R, R * 0.3, R); cup.material.opacity = 0.35 * Math.exp(-tp * 1.6); }
    };
  }
  const luz = (G, cor, sol) => { G.add(new THREE.HemisphereLight(cor[0], cor[1], 1.1)); const s = new THREE.DirectionalLight(sol[0], sol[1]); s.position.set(60, 120, 40); G.add(s, s.target); return s; };
  const peca = async (G, nome, x, z, ry = 0, esc = 1) => { const o = await kit.peca(nome); o.position.set(x, 0, z); o.rotation.y = ry; o.scale.setScalar(esc); G.add(o); return o; };
  const ChoseCentro = (x, z) => Math.atan2(-x, CZ - z) + Math.PI;     // olha para o centro da praça

  // ---- CIDADE (bairro com o kit): rotatória no centro da praça, ruas, casas e prédios em volta
  const Ci = grupos.cidade;
  d.solC = luz(Ci, [0xcfe6ff, 0x6a7a5a], [0xfff4e0, 2.6]); d.solC.castShadow = true; d.solC.shadow.mapSize.set(2048, 2048); Object.assign(d.solC.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 10, far: 300 });
  const asf = new THREE.Mesh(new THREE.CircleGeometry(95, 64), M(0x5e6166, 0.95)); asf.rotation.x = -Math.PI / 2; asf.position.set(0, -0.01, CZ); asf.receiveShadow = true; Ci.add(asf);
  const grama = new THREE.Mesh(new THREE.RingGeometry(95, 1500, 64), M(0x5f8a4e, 1)); grama.rotation.x = -Math.PI / 2; grama.position.set(0, -0.02, CZ); Ci.add(grama);
  Ci.add(await kit.ladrilho('rotatoria', 0, 1));
  for (let gz = -1; gz <= 6; gz++) for (const gx of [-2, -1, 1, 2, 3, -3]) if (gz !== 1 || Math.abs(gx) > 2) { /* faixas de rua só nos eixos */ }
  for (const gz of [-1, 0, 2, 3]) Ci.add(await kit.ladrilho('rua-reta', 0, gz, 0, ['N', 'S']));
  for (const gx of [-2, -1, 1, 2]) Ci.add(await kit.ladrilho('rua-reta', gx, 1, 0, ['E', 'W']));
  const nomesC = ['predio-residencial-12', 'predio-residencial-6', 'predio-comercial-10', 'predio-loja-3', 'casa-sobrado', 'casa-moderna', 'casa-colonial', 'casa-simples', 'predio-residencial-6'];
  const rc = mulberry32(21); const ocup = new Set();
  for (let gx = -12; gx <= 12; gx++) for (let gz = -6; gz <= 12; gz++) {
    const x = gx * 12, z = gz * 12; const r = Math.hypot(x, z - CZ); if (r < 88 || r > 190 || rc() < 0.25 || (gx === 0 && gz < 4)) continue;
    await peca(Ci, nomesC[(rc() * nomesC.length) | 0], x, z, ChoseCentro(x, z));
  }
  // a casa de onde todo mundo sai (frente voltada para +Z), na faixa da rua
  d.casa = await peca(Ci, 'casa-sobrado', 0, -2, 0, 1.0);
  d.relogio = new THREE.Group(); d.relogio.position.set(0, 14, -42); Ci.add(d.relogio);
  const cvR = document.createElement('canvas'); cvR.width = 512; cvR.height = 200; const gR = cvR.getContext('2d'); const tR = new THREE.CanvasTexture(cvR); tR.colorSpace = THREE.SRGBColorSpace;
  d.relogio.add(new THREE.Mesh(new THREE.BoxGeometry(24, 9.4, 1.4), M(0x15161a, 0.5, { metalness: 0.5 })));
  const telaR = new THREE.Mesh(new THREE.PlaneGeometry(22.6, 8.4), new THREE.MeshBasicMaterial({ map: tR })); telaR.position.z = 0.72; d.relogio.add(telaR);
  d.horaRelogio = (txt, brilhoK = 1) => { gR.fillStyle = '#05060a'; gR.fillRect(0, 0, 512, 200); gR.fillStyle = `rgba(255,${70 + 40 * brilhoK | 0},50,1)`; gR.font = 'bold 150px "DejaVu Sans Mono", monospace'; gR.textAlign = 'center'; gR.fillText(txt, 256, 150); tR.needsUpdate = true; };
  d.horaRelogio('11:59');
  d.multidao = fabMultidao(Ci, 'cidade', 1150); d.multidao(0, -1); d.ondas = fabOndas(Ci); d.ondas(-1);

  // ---- BRASIL: praia, palmeiras, prédios e o Cristo ao fundo
  const Br = grupos.brasil; luz(Br, [0xd8f0ff, 0xcaa870], [0xfff2d8, 2.8]);
  const areia = new THREE.Mesh(new THREE.CircleGeometry(160, 64), M(0xe6cf9a, 1)); areia.rotation.x = -Math.PI / 2; areia.position.set(0, -0.01, CZ); Br.add(areia);
  const mar = new THREE.Mesh(new THREE.PlaneGeometry(1600, 800), M(0x1e9ad0, 0.25, { metalness: 0.1 })); mar.rotation.x = -Math.PI / 2; mar.position.set(0, -0.2, -420); Br.add(mar);
  const rb = mulberry32(8);
  for (let i = 0; i < 26; i++) { const a = rb() * 6.28, r = 85 + rb() * 40; await peca(Br, 'arvore-palmeira', Math.cos(a) * r, CZ + Math.sin(a) * r * 0.9, rb() * 6, 1.2); }
  for (let i = 0; i < 16; i++) { const x = -150 + i * 20; await peca(Br, i % 3 ? 'predio-residencial-12' : 'predio-comercial-10', x, 150 + rb() * 25, Math.PI); }
  const morro = new THREE.Mesh(new THREE.ConeGeometry(70, 80, 24), M(0x3d7a3a, 1)); morro.position.set(-40, 40, 230); Br.add(morro);
  const cristo = new THREE.Group(); cristo.position.set(-40, 80, 230); const bra = M(0xf0efe8, 0.8);
  [[0, 12, 0, 3, 24, 3], [0, 19, 0, 30, 2.4, 2.4], [0, 8, 0, 6, 14, 5]].forEach(([x, y, z, w, h, dd]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), bra); b.position.set(x, y, z); cristo.add(b); }); const cabC = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 10), bra); cabC.position.y = 25; cristo.add(cabC); Br.add(cristo);
  d.multidaoBR = fabMultidao(Br, 'brasil', 950); d.multidaoBR(1, -1); d.ondasBR = fabOndas(Br);

  // ---- ÁFRICA: savana, acácias, cabanas e montanha ao fundo
  const Af = grupos.africa; luz(Af, [0xffe0b0, 0x9a6a3a], [0xffc888, 2.6]);
  const solo = new THREE.Mesh(new THREE.CircleGeometry(900, 64), M(0xc58a46, 1)); solo.rotation.x = -Math.PI / 2; solo.position.set(0, -0.01, CZ); Af.add(solo);
  const ra = mulberry32(14);
  for (let i = 0; i < 24; i++) { const a = ra() * 6.28, r = 82 + ra() * 90, x = Math.cos(a) * r, z = CZ + Math.sin(a) * r * 0.9; const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, 8, 8), M(0x4a3626, 1)); tr.position.set(x, 4, z); const co = new THREE.Mesh(new THREE.SphereGeometry(7, 14, 8), M(0x5c7a2c, 1)); co.scale.set(1.5, 0.35, 1.5); co.position.set(x, 9, z); Af.add(tr, co); }
  for (let i = 0; i < 18; i++) { const a = ra() * 6.28, r = 90 + ra() * 70, x = Math.cos(a) * r, z = CZ + Math.sin(a) * r * 0.9; const ca = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 2.6, 14), M(0xb8864e, 1)); ca.position.set(x, 1.3, z); const te = new THREE.Mesh(new THREE.ConeGeometry(3.2, 2.4, 14), M(0xc9a85a, 1)); te.position.set(x, 3.8, z); Af.add(ca, te); }
  const mont = new THREE.Mesh(new THREE.ConeGeometry(140, 150, 28), M(0x6a5a6a, 1)); mont.position.set(60, 75, 420); Af.add(mont); const neve = new THREE.Mesh(new THREE.ConeGeometry(30, 32, 28), M(0xf4f4f6, 1)); neve.position.set(60, 134, 420); Af.add(neve);
  d.multidaoAF = fabMultidao(Af, 'africa', 950); d.multidaoAF(1, -1); d.ondasAF = fabOndas(Af);

  // ---- CHINA: praça de pedra, pagode vermelho, lanternas e arranha-céus do kit
  const Ch = grupos.china; luz(Ch, [0xe6e0ea, 0x70686a], [0xfff0e8, 2.2]);
  const pedra = new THREE.Mesh(new THREE.CircleGeometry(900, 64), M(0x9a9690, 0.95)); pedra.rotation.x = -Math.PI / 2; pedra.position.set(0, -0.01, CZ); Ch.add(pedra);
  const pag = new THREE.Group(); pag.position.set(0, 0, 150); const verm = M(0xb82a2a, 0.7), telh = M(0x2a2a30, 0.7);
  for (let i = 0; i < 5; i++) { const w = 26 - i * 3.6; const c = new THREE.Mesh(new THREE.BoxGeometry(w, 7, w), verm); c.position.y = 3.5 + i * 11; const t = new THREE.Mesh(new THREE.ConeGeometry(w * 0.95, 4, 4), telh); t.rotation.y = Math.PI / 4; t.position.y = 8.5 + i * 11; pag.add(c, t); } Ch.add(pag);
  const rch = mulberry32(5);
  for (let i = 0; i < 44; i++) { const a = rch() * 6.28, r = 80 + rch() * 40, l = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), M(0xe02828, 0.5, { emissive: 0xaa1010, emissiveIntensity: 0.8 })); l.position.set(Math.cos(a) * r, 5 + rch() * 3, CZ + Math.sin(a) * r * 0.9); Ch.add(l); }
  for (let i = 0; i < 22; i++) { const x = -190 + i * 18; await peca(Ch, i % 2 ? 'predio-residencial-12' : 'predio-comercial-10', x, 200 + rch() * 40, Math.PI, 1.0 + rch() * 0.5); }
  d.multidaoCH = fabMultidao(Ch, 'china', 950); d.multidaoCH(1, -1); d.ondasCH = fabOndas(Ch);

  // personagens de verdade (herói do pulo e quem sai de casa)
  d.heroi = await Ator.criar('jovem_b'); Ci.add(d.heroi.grupo);
  d.saindo = [await Ator.criar('homem'), await Ator.criar('mae'), await Ator.criar('jovem_a')]; for (const a of d.saindo) Ci.add(a.grupo);
  return d;
}
