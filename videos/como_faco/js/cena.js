// Short "Como eu faço um vídeo": motion design em canvas 2D + modelos reais do projeto (moto do Blender, Kael) desenhados pelo Three.js
// numa camada transparente. Tudo é função do tempo t; as batidas vêm das palavras da narração (tempos.json, gerado pelo voz.py).
// Camadas por quadro: fundo 2D → 3D (quando o plano usa) → elementos 2D → orbe-narrador → flash.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { clamp, lerp, inv, suave, ruido, mulberry32 } from '../../core/util.js';
import { glb } from '../../core/motor.js';
import * as MotoGLB from '../../biblioteca3d/veiculos/moto/motoGLB.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const W = 1080, H = 1920;
export const TOTAL = 73.0;
const Q = new URLSearchParams(location.search);
const ESC = +(Q.get('w') || W) / W;                       // prévias em 540×960 desenham tudo em escala

// ------------------------------------------------------------------------------------------------ paleta e tipografia
const COR = { fundo0: '#0a1230', fundo1: '#16306b', ciano: '#3ad6ff', vermelho: '#ff3b47', amarelo: '#ffd23f', verde: '#3dffa8', branco: '#f4f7ff', cinza: '#7c8bb3', papel: '#fdf6e3', tinta: '#1b2240' };
const F = (peso, tam, fam = 'Inter') => `${peso} ${tam}px "${fam}"`;
const MONO = (tam, peso = 600) => `${peso} ${tam}px "JetBrains Mono"`;

// ------------------------------------------------------------------------------------------------ tempos da narração
let TEMPOS, ENV;
const fala = id => TEMPOS.falas.find(f => f.id === id);
/** instante em que começa a n-ésima palavra que contém `p` depois de `depois` segundos */
function P(p, depois = 0) {
  const w = TEMPOS.palavras.find(w => w.t0 >= depois - 0.01 && w.p.toLowerCase().replace(/[.,!?]/g, '').includes(p.toLowerCase()));
  if (!w) { console.warn('palavra não achada', p, depois); return depois; }
  return w.t0;
}
const envelope = t => { const i = Math.floor(t * 60); return ENV[i] || 0; };
const envSuave = t => (envelope(t - 0.03) + envelope(t) * 2 + envelope(t + 0.03)) / 4;

// ------------------------------------------------------------------------------------------------ curvas
const voltaPassa = x => { x = clamp(x); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };  // ease-out com passada
const pop = (t, t0, d = 0.35) => voltaPassa(inv(t0, t0 + d, t));
const ent = (t, t0, d = 0.4) => suave(inv(t0, t0 + d, t));

// ------------------------------------------------------------------------------------------------ canvas principal
const C = document.createElement('canvas'); C.width = W * ESC; C.height = H * ESC;
C.style.width = '100vw'; C.style.height = '100vh'; C.style.objectFit = 'contain';
document.body.appendChild(C);
const g = C.getContext('2d');

// ------------------------------------------------------------------------------------------------ 3D (camada transparente)
const R = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
R.setPixelRatio(1); R.setSize(W * ESC, H * ESC);
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05; R.setClearColor(0x000000, 0);
const cena = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(34, W / H, 0.05, 100);
cena.environment = new THREE.PMREMGenerator(R).fromScene(new RoomEnvironment(), 0.04).texture;
const sol = new THREE.DirectionalLight(0xffffff, 2.2); sol.position.set(3, 5, 4); cena.add(sol);
const contra = new THREE.DirectionalLight(0x66ccff, 2.5); contra.position.set(-4, 2.5, -4); cena.add(contra);
cena.add(new THREE.HemisphereLight(0x8fb4ff, 0x1a2244, 0.6));

let moto, fantasma, kael, kaelMix, esqueleto, partes = [], chaoGrade, trilha;
const matArame = new THREE.MeshBasicMaterial({ color: 0x3ad6ff, wireframe: true, transparent: true, opacity: 0.55, depthWrite: false });
const matArameForte = new THREE.MeshBasicMaterial({ color: 0x7fe8ff, wireframe: true });

function contarTri(o) { let n = 0; o.traverse(m => { if (m.isMesh && m.visible) { const gm = m.geometry; n += (gm.index ? gm.index.count : gm.attributes.position.count) / 3; } }); return n; }
let TRI_MOTO = 0;

export async function construir() {
  await Promise.all([document.fonts.load(F(900, 40)), document.fonts.load(F(700, 40)), document.fonts.load(MONO(40)), document.fonts.load(F(900, 40, 'Inter Display'))]);
  TEMPOS = await (await fetch('tempos.json')).json();
  ENV = await (await fetch('envelope.json')).json();
  const base = await MotoGLB.carregar('../biblioteca3d/veiculos/moto/moto.glb');
  moto = MotoGLB.criar(base); cena.add(moto.grupo || moto);
  fantasma = MotoGLB.criar(base, { sombraChao: false }); cena.add(fantasma.grupo || fantasma);
  (fantasma.grupo || fantasma).traverse(m => { if (m.isMesh) m.material = matArame; });
  const gM = moto.grupo || moto;
  gM.traverse(m => { if (m.isMesh) { m.userData.mat0 = m.material; if (m.name !== 'sombraChao' && m.parent?.name !== 'sombraChao') partes.push(m); } });
  // ordem de montagem: de baixo para cima e de trás para frente (quadro e rodas primeiro, carenagem por último)
  const c = new THREE.Vector3(); gM.updateMatrixWorld(true);
  for (const m of partes) { new THREE.Box3().setFromObject(m).getCenter(c); m.userData.ordem = c.y * 1.6 + c.z * 0.25 + (mulberry32(partes.indexOf(m) + 7)() * 0.25); m.userData.p0 = m.position.clone(); m.userData.s0 = m.scale.clone(); }
  const ords = partes.map(m => m.userData.ordem).sort((a, b) => a - b);
  for (const m of partes) m.userData.k = ords.indexOf(m.userData.ordem) / (partes.length - 1);
  TRI_MOTO = contarTri(gM);

  const gk = await glb('../biblioteca3d/personagens/elenco/kael.glb');
  kael = SkeletonUtils.clone(gk.scene); cena.add(kael);
  kael.traverse(m => { if (m.isMesh) m.frustumCulled = false; });
  kaelMix = new THREE.AnimationMixer(kael);
  const clip = gk.animations.find(a => a.name === 'Parado'); kaelMix.clipAction(clip).play();
  esqueleto = new THREE.SkeletonHelper(kael); esqueleto.material.depthTest = false; esqueleto.material.transparent = true; esqueleto.material.linewidth = 2;
  esqueleto.material.vertexColors = false; esqueleto.material.color = new THREE.Color(0xffd23f); esqueleto.renderOrder = 999; cena.add(esqueleto);

  chaoGrade = new THREE.GridHelper(40, 80, 0x3ad6ff, 0x24407a); chaoGrade.material.transparent = true; chaoGrade.material.opacity = 0.5; cena.add(chaoGrade);
  console.log('triângulos da moto', TRI_MOTO);
  prepararMiniaturas();
}

function mostrar({ m = false, f = false, k = false, grade = false } = {}) {
  (moto.grupo || moto).visible = m; (fantasma.grupo || fantasma).visible = f; kael.visible = k; esqueleto.visible = k; chaoGrade.visible = grade;
}
function render3D() { R.render(cena, cam); g.drawImage(R.domElement, 0, 0, W, H); }
const gm = () => moto.grupo || moto;

// moto: modo sólido, arame (varredura) ou montagem
function motoSolida() { for (const m of partes) { m.material = m.userData.mat0; m.visible = true; m.position.copy(m.userData.p0); m.scale.copy(m.userData.s0); } }
function motoVarredura(k) {           // k 0..1: de trás para frente vira arame
  for (const m of partes) { m.visible = true; m.position.copy(m.userData.p0); m.scale.copy(m.userData.s0); m.material = (m.userData.k < k) ? matArameForte : m.userData.mat0; }
}
function motoMontagem(k) {            // k 0..1: peças caem no lugar em ordem
  for (const m of partes) {
    m.material = m.userData.mat0;
    const a = clamp((k - m.userData.k * 0.85) / 0.15);
    m.visible = a > 0.001;
    const e = voltaPassa(a);
    m.position.copy(m.userData.p0); m.position.y += (1 - suave(a)) * 0.6 / Math.max(1e-3, gm().scale.y);
    m.scale.copy(m.userData.s0).multiplyScalar(Math.max(0.001, e));
  }
}

// ------------------------------------------------------------------------------------------------ desenho 2D: utilidades
function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function texto(s, x, y, { f = F(800, 60), cor = COR.branco, al = 'center', base = 'middle', a = 1, sombra = 0 } = {}) {
  if (a <= 0) return; g.save(); g.globalAlpha *= a; g.font = f; g.fillStyle = cor; g.textAlign = al; g.textBaseline = base;
  if (sombra) { g.shadowColor = cor; g.shadowBlur = sombra; }
  g.fillText(s, x, y); g.restore();
}
function escalaEm(x, y, s, fn) { if (s <= 0.001) return; g.save(); g.translate(x, y); g.scale(s, s); g.translate(-x, -y); fn(); g.restore(); }
function brilhoCirc(x, y, r, cor, a = 1) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, cor); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.save(); g.globalAlpha *= a; g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore();
}

// fundo: degradê azul-noite + grade em perspectiva leve + pontos que sobem
function fundo(t, cor1 = COR.fundo1, intens = 1) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, COR.fundo0); gr.addColorStop(0.55, cor1); gr.addColorStop(1, COR.fundo0);
  g.fillStyle = gr; g.fillRect(-200, -200, W + 400, H + 400);
  g.save(); g.globalAlpha = 0.10 * intens; g.strokeStyle = COR.ciano; g.lineWidth = 2;
  const o = (t * 40) % 90;
  for (let x = -90; x < W + 90; x += 90) { g.beginPath(); g.moveTo(x, -200); g.lineTo(x, H + 200); g.stroke(); }
  for (let y = -90 + o; y < H + 90; y += 90) { g.beginPath(); g.moveTo(-200, y); g.lineTo(W + 200, y); g.stroke(); }
  g.restore();
  const rnd = mulberry32(3);
  g.save(); g.fillStyle = COR.ciano;
  for (let i = 0; i < 40; i++) {
    const x = rnd() * W, v = 20 + rnd() * 50, y = (rnd() * H * 1.2 - t * v) % (H * 1.2); const yy = y < 0 ? y + H * 1.2 : y;
    g.globalAlpha = (0.15 + rnd() * 0.35) * intens; g.beginPath(); g.arc(x, yy - 100, 2 + rnd() * 3, 0, 7); g.fill();
  }
  g.restore();
}

// código que rola (fundo do gancho)
const LINHAS = [
  'const moto = MotoGLB.criar(cena);', 'cam.position.set(1.9, 0.5, 2.4);', 'function atualizar(t) {', '  moto.rodar(t * 12);', '  cam.lookAt(0, 0.6, 0);', '}',
  'renderer.render(cena, cam);', 'for (const f of quadros)', '  await page.evaluate(__frame, f);', 'blender -b -P criar_moto.py', 'loft(secoes, fechar=True)',
  'ffmpeg -i f%05d.jpg -i voz.wav', 'export const TOTAL = 73.0;', '--use-gl=angle --use-angle=gl-egl', 'kokoro.create(fala, voz)', 'personagens7.kael()',
];
function codigoRolando(t, a = 1, x0 = 70) {
  g.save(); g.globalAlpha = a; g.font = MONO(34, 500);
  for (let i = 0; i < 34; i++) {
    const y = ((i * 62 - t * 70) % (34 * 62) + 34 * 62) % (34 * 62) - 60;
    const s = LINHAS[i % LINHAS.length];
    g.fillStyle = i % 5 === 0 ? 'rgba(255,210,63,0.30)' : i % 3 === 0 ? 'rgba(255,59,71,0.25)' : 'rgba(58,214,255,0.22)';
    g.fillText(s, x0 + (i % 4) * 30, y);
  }
  g.restore();
}

// ------------------------------------------------------------------------------------------------ orbe-narrador
function orbe(t, x, y, r, a = 1, { cor = COR.ciano, cor2 = COR.vermelho } = {}) {
  if (a <= 0) return;
  const e = envSuave(t);
  g.save(); g.globalAlpha = a;
  brilhoCirc(x, y, r * (2.6 + e * 0.8), 'rgba(58,214,255,0.35)');
  // raios da onda em volta
  const N = 64;
  g.lineCap = 'round'; g.lineWidth = Math.max(2, r * 0.06);
  for (let i = 0; i < N; i++) {
    const ang = i / N * Math.PI * 2 + t * 0.4;
    const amp = r * (0.12 + e * 0.75 * (0.45 + 0.55 * Math.abs(Math.sin(i * 1.7 + t * 9 + Math.sin(i * 0.6) * 2))));
    const r0 = r * 1.12, r1 = r0 + amp;
    g.strokeStyle = i % 2 ? cor : 'rgba(255,255,255,0.85)';
    g.beginPath(); g.moveTo(x + Math.cos(ang) * r0, y + Math.sin(ang) * r0); g.lineTo(x + Math.cos(ang) * r1, y + Math.sin(ang) * r1); g.stroke();
  }
  const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, cor); gr.addColorStop(1, '#1a3a9a');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * (1 + e * 0.06), 0, 7); g.fill();
  // "boca": linha que vibra com a voz
  g.strokeStyle = 'rgba(10,18,48,0.85)'; g.lineWidth = r * 0.07; g.beginPath();
  for (let i = 0; i <= 24; i++) { const u = i / 24, xx = x - r * 0.42 + u * r * 0.84, yy = y + r * 0.2 + Math.sin(u * Math.PI) * (r * 0.14 + Math.sin(u * 18 + t * 30) * r * 0.14 * e); i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
  g.stroke();
  // olhos que piscam
  const pis = (t % 3.7) < 0.12 ? 0.15 : 1;
  g.fillStyle = 'rgba(10,18,48,0.9)';
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * r * 0.28, y - r * 0.18, r * 0.09, r * 0.13 * pis, 0, 0, 7); g.fill(); }
  g.restore();
}

// ------------------------------------------------------------------------------------------------ ícones
function iconeCamera(x, y, s, cor = COR.branco) {
  g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = cor; g.lineWidth = 9; g.lineJoin = 'round';
  rr(-70, -40, 140, 90, 18); g.stroke(); rr(-28, -58, 56, 22, 6); g.stroke(); g.beginPath(); g.arc(0, 5, 28, 0, 7); g.stroke(); g.restore();
}
function iconeEditor(x, y, s, cor = COR.branco) {
  g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = cor; g.lineWidth = 9;
  rr(-75, -50, 150, 100, 12); g.stroke();
  g.fillStyle = cor; for (let i = 0; i < 3; i++) { g.fillRect(-55, -25 + i * 25, 40 + i * 30, 12); }
  g.beginPath(); g.moveTo(20, -40); g.lineTo(20, 40); g.stroke(); g.restore();
}
function iconePlaca(x, y, s, cor = COR.branco) {
  g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = cor; g.lineWidth = 9; g.lineJoin = 'round';
  rr(-80, -42, 160, 84, 10); g.stroke(); g.beginPath(); g.arc(-20, 0, 26, 0, 7); g.stroke(); g.beginPath(); g.arc(42, 0, 18, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(-60, 42); g.lineTo(-60, 60); g.moveTo(-30, 42); g.lineTo(-30, 60); g.moveTo(0, 42); g.lineTo(0, 60); g.moveTo(30, 42); g.lineTo(30, 60); g.stroke(); g.restore();
}
function risco(x, y, s, k) {      // X vermelho que se desenha
  if (k <= 0) return; g.save(); g.strokeStyle = COR.vermelho; g.lineWidth = 14 * s; g.lineCap = 'round'; g.shadowColor = COR.vermelho; g.shadowBlur = 20;
  const d = 95 * s, k1 = clamp(k * 2), k2 = clamp(k * 2 - 1);
  g.beginPath(); g.moveTo(x - d, y - d); g.lineTo(x - d + 2 * d * k1, y - d + 2 * d * k1); g.stroke();
  if (k2 > 0) { g.beginPath(); g.moveTo(x + d, y - d); g.lineTo(x + d - 2 * d * k2, y - d + 2 * d * k2); g.stroke(); }
  g.restore();
}
function janela(x, y, w, h, titulo = 'localhost:8080/como_faco', a = 1) {   // janela de navegador genérica
  g.save(); g.globalAlpha *= a;
  g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 40; g.fillStyle = '#0d1838'; rr(x, y, w, h, 28); g.fill(); g.shadowBlur = 0;
  g.fillStyle = '#22305e'; rr(x, y, w, 74, [28, 28, 0, 0]); g.fill();
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(x + 42 + i * 38, y + 37, 12, 0, 7); g.fill(); });
  g.fillStyle = '#0d1838'; rr(x + 170, y + 16, w - 200, 42, 21); g.fill();
  texto(titulo, x + 196, y + 38, { f: MONO(24, 500), cor: COR.cinza, al: 'left' });
  g.restore();
}
function arquivoMP4(x, y, s, a = 1) {
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s);
  g.fillStyle = COR.branco; g.beginPath(); g.moveTo(-110, -140); g.lineTo(50, -140); g.lineTo(110, -80); g.lineTo(110, 140); g.lineTo(-110, 140); g.closePath(); g.fill();
  g.fillStyle = '#c9d4ff'; g.beginPath(); g.moveTo(50, -140); g.lineTo(50, -80); g.lineTo(110, -80); g.closePath(); g.fill();
  g.fillStyle = COR.vermelho; g.beginPath(); g.moveTo(-30, -45); g.lineTo(40, 0); g.lineTo(-30, 45); g.closePath(); g.fill();
  texto('MP4', 0, 95, { f: F(900, 54), cor: COR.tinta });
  g.restore();
}

// miniaturas da moto (fita de filme e "mesma imagem"): renderizadas uma vez
let MINI = [];
function prepararMiniaturas() {
  mostrar({ m: true, grade: true }); motoSolida();
  for (let i = 0; i < 8; i++) {
    const z = posMotoPista(i * 0.9);
    cam.position.set(4.6, 1.5, z + 3.2); cam.lookAt(0, 0.5, z); cam.fov = 34; cam.updateProjectionMatrix();
    R.render(cena, cam);
    const c = document.createElement('canvas'); c.width = 300; c.height = 420; const cg = c.getContext('2d');
    const gr = cg.createLinearGradient(0, 0, 0, 420); gr.addColorStop(0, '#16306b'); gr.addColorStop(1, '#0a1230'); cg.fillStyle = gr; cg.fillRect(0, 0, 300, 420);
    const sw = R.domElement.width, sh = R.domElement.height;
    cg.drawImage(R.domElement, sw * 0.12, sh * 0.25, sw * 0.76, sh * 0.5, 0, 0, 300, 420 * 1.0);
    MINI.push(c);
  }
  gm().position.set(0, 0, 0); gm().rotation.set(0, 0, 0);
}
// moto andando na pista (cena do "função do tempo"): posição é função de s (segundos do vídeo-exemplo)
function posMotoPista(s) {
  const z = -2.2 + s * 1.1;
  gm().position.set(0, 0, z); gm().rotation.set(0, 0, 0);
  moto.rodar?.(z); chaoGrade.position.set(0, 0.001, 0);
  return z;
}

// ------------------------------------------------------------------------------------------------ câmera 2D (movimento e tremor)
function camera2D(t, { x = W / 2, y = H / 2, s = 1, r = 0, tremor = 1 } = {}) {
  const tx = ruido(t * 0.6, 1) * 6 * tremor, ty = ruido(t * 0.55, 2) * 6 * tremor, tr = ruido(t * 0.4, 3) * 0.004 * tremor;
  g.translate(W / 2 + tx, H / 2 + ty); g.rotate(r + tr); g.scale(s, s); g.translate(-x, -y);
}

// ------------------------------------------------------------------------------------------------ planos
// Cada plano: { id, t0, t1, des(t, u) } com u = tempo local. Os limites seguem as falas.
let PLANOS = null;
function planos() {
  if (PLANOS) return PLANOS;
  const f = id => fala(id);
  PLANOS = [
    { id: 'gancho', t0: 0, t1: f('mapa').t0 - 0.15, des: pGancho },
    { id: 'mapa', t0: f('mapa').t0 - 0.15, t1: f('roteiro').t0 - 0.2, des: pMapa },
    { id: 'roteiro', t0: f('roteiro').t0 - 0.2, t1: f('modelos').t0 - 0.2, des: pRoteiro },
    { id: 'modelos', t0: f('modelos').t0 - 0.2, t1: f('cena').t0 - 0.2, des: pModelos },
    { id: 'cena', t0: f('cena').t0 - 0.2, t1: f('render').t0 - 0.2, des: pCena },
    { id: 'render', t0: f('render').t0 - 0.2, t1: f('descoberta').t0 - 0.2, des: pRender },
    { id: 'descoberta', t0: f('descoberta').t0 - 0.2, t1: f('montagem').t0 - 0.2, des: pDescoberta },
    { id: 'montagem', t0: f('montagem').t0 - 0.2, t1: f('voz').t0 - 0.2, des: pMontagem },
    { id: 'voz', t0: f('voz').t0 - 0.2, t1: TOTAL + 1, des: pVoz },
  ];
  return PLANOS;
}
export const plano = t => planos().find(p => t >= p.t0 && t < p.t1) || PLANOS[PLANOS.length - 1];

// transição: flash curto e "zoom" do whip nos cortes
let FLASH = 0, CHOQUE = 0;
function corte(t, t0, d = 0.18) { return 1 - inv(t0, t0 + d, t); }

// ---- 1. Gancho: moto em close, código atrás, ícones riscados, vira arame em "só código"
function orbitaMoto(t, a0 = 0.62, va = 0.035) {
  const a = a0 + t * va, r = 4.7;
  cam.fov = 34; cam.updateProjectionMatrix();
  cam.position.set(Math.sin(a) * r, 0.32 + Math.sin(t * 0.5) * 0.03, Math.cos(a) * r);
  cam.lookAt(0, 0.66, 0.05);
}
function pGancho(t) {
  fundo(t);
  codigoRolando(t, 1);
  mostrar({ m: true }); gm().position.set(0, 0, 0); gm().rotation.set(0, 0, 0); moto.rodar?.(t * 0.4); moto.esterco?.(0.18);
  const tSo = P('Só', 4.5);
  motoVarredura(inv(tSo - 0.1, tSo + 0.7, t));
  orbitaMoto(t);
  g.save(); g.translate(70, -10); render3D(); g.restore();
  // brilho vermelho atrás da moto
  // três ícones em cima: câmera, editor, placa — cada um entra na palavra e é riscado logo depois
  const itens = [[iconeCamera, P('câmera', 1), 200], [iconeEditor, P('edição', 2.4), 540], [iconePlaca, P('placa', 3.6), 880]];
  for (const [fn, t0, x] of itens) {
    const s = pop(t, t0 - 0.12, 0.35) * 0.95;
    escalaEm(x, 330, s, () => { g.save(); g.globalAlpha = 0.95; fn(x, 330, 1); g.restore(); });
    risco(x, 330, s, inv(t0 + 0.25, t0 + 0.55, t));
  }
  // "SÓ CÓDIGO" em "Só código."
  const k = pop(t, tSo, 0.3);
  escalaEm(540, 1460, k, () => {
    g.save(); g.fillStyle = COR.amarelo; rr(170, 1385, 740, 150, 30); g.fill(); g.restore();
    texto('{ só código }', 540, 1462, { f: MONO(86, 800), cor: COR.tinta });
  });
}

// ---- 2. Mapa das 6 etapas (zigue-zague vertical); o orbe corre pela linha
const ETAPAS = [['Ideia', COR.amarelo], ['Roteiro', COR.branco], ['Modelos', COR.vermelho], ['Cena 3D', COR.ciano], ['Render', COR.verde], ['MP4', COR.amarelo]];
const posEtapa = i => [i % 2 ? 760 : 320, 380 + i * 210];
function pMapa(t) {
  const pl = plano(t), u = t - pl.t0;
  fundo(t);
  const s = lerp(1.25, 1.0, suave(u / 1.2)), tFim = pl.t1;
  const k = inv(tFim - 0.45, tFim, t);                               // mergulho na etapa "Roteiro"
  const [rx, ry] = posEtapa(1);
  g.save(); camera2D(t, { x: lerp(540, rx, suave(k)), y: lerp(960, ry, suave(k)), s: s * lerp(1, 5, suave(k) ** 2) });
  // linha
  const pts = ETAPAS.map((_, i) => posEtapa(i));
  const prog = inv(pl.t0 + 0.2, P('final', pl.t0) + 0.2, t);
  g.lineWidth = 12; g.lineCap = 'round'; g.strokeStyle = 'rgba(124,139,179,0.35)';
  g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
  // trecho percorrido
  const seg = prog * (pts.length - 1), si = Math.min(pts.length - 2, Math.floor(seg)), sf = seg - si;
  g.strokeStyle = COR.ciano; g.shadowColor = COR.ciano; g.shadowBlur = 25; g.beginPath(); g.moveTo(...pts[0]);
  for (let i = 1; i <= si; i++) g.lineTo(...pts[i]);
  const ox = lerp(pts[si][0], pts[si + 1][0], sf), oy = lerp(pts[si][1], pts[si + 1][1], sf);
  g.lineTo(ox, oy); g.stroke(); g.shadowBlur = 0;
  ETAPAS.forEach(([nome, cor], i) => {
    const [x, y] = pts[i]; const on = seg >= i - 0.05;
    const e = pop(t, pl.t0 + 0.05 + i * 0.08, 0.4);
    escalaEm(x, y, e, () => {
      g.save(); g.fillStyle = on ? cor : '#2a3a6a'; g.shadowColor = cor; g.shadowBlur = on ? 35 : 0; g.beginPath(); g.arc(x, y, 62, 0, 7); g.fill(); g.restore();
      texto(String(i + 1), x, y + 2, { f: F(900, 58), cor: on ? COR.tinta : COR.cinza });
      texto(nome, x + (i % 2 ? -95 : 95), y, { f: F(800, 62), al: i % 2 ? 'right' : 'left', cor: on ? COR.branco : COR.cinza });
    });
  });
  orbe(t, ox, oy - 95, 46, 1);
  g.restore();
}

// ---- 3. Roteiro com tempos → tabela da decupagem → claquete
function pRoteiro(t) {
  const pl = plano(t), u = t - pl.t0;
  fundo(t, '#1d2f66');
  const tDec = P('decupagem', pl.t0) - 0.15, tFilme = P('filme', pl.t0);
  const s = lerp(1.12, 1.0, suave(u / 0.6)) + Math.max(0, t - tDec) * 0.012;
  g.save(); camera2D(t, { s });
  // cartão do roteiro
  const kR = 1 - ent(t, tDec, 0.45);
  if (kR > 0) {
    g.save(); g.globalAlpha = kR; g.translate(-(1 - kR) * 300, 0);
    g.fillStyle = COR.papel; g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowBlur = 40; rr(110, 380, 860, 980, 30); g.fill(); g.shadowBlur = 0;
    texto('roteiro.md', 160, 460, { f: MONO(44, 800), cor: COR.tinta, al: 'left' });
    const L = [['0,0', 'Esse vídeo inteiro…'], ['6,3', 'E eu vou te mostrar…'], ['10,2', 'Primeiro, o roteiro…'], ['18,5', 'Os modelos também…'], ['30,3', 'Aí entra o Three.js…'], ['40,3', 'Um navegador…'], ['45,8', 'Só que aqui…']];
    L.forEach(([tt, fr], i) => {
      const a = ent(t, pl.t0 + 0.25 + i * 0.16, 0.3), y = 560 + i * 110;
      const at = P('tempo', pl.t0); const hl = i === 2 || (t > at && t < at + 1.2 && i < 3);
      g.save(); g.globalAlpha *= a;
      if (hl) { g.fillStyle = 'rgba(255,210,63,0.55)'; rr(140, y - 42, 800, 84, 14); g.fill(); }
      texto(tt + ' s', 165, y, { f: MONO(40, 800), cor: COR.vermelho, al: 'left' });
      texto(fr, 330, y, { f: F(600, 40), cor: COR.tinta, al: 'left' });
      g.restore();
    });
    g.restore();
  }
  // tabela da decupagem: colunas acendem com as palavras
  const kT = ent(t, tDec, 0.45);
  if (kT > 0) {
    g.save(); g.globalAlpha = kT; g.translate((1 - kT) * 300, 0);
    texto('DECUPAGEM', 540, 430, { f: F(900, 84, 'Inter Display'), cor: COR.amarelo });
    const cols = [['Plano', 'plano', 'close'], ['Ângulo', 'ângulo', 'de baixo'], ['Lente', 'lente', 'grande-angular'], ['Movimento', 'movimento', 'órbita']];
    cols.forEach(([nome, palavra, ex], i) => {
      const tp = palavra === 'lente' ? P('alente', tDec) : P(palavra, tDec);
      const y = 610 + i * 200, on = t >= tp - 0.05, k = pop(t, tp - 0.05, 0.3);
      g.save(); g.fillStyle = on ? 'rgba(58,214,255,0.18)' : 'rgba(255,255,255,0.06)'; g.strokeStyle = on ? COR.ciano : 'rgba(255,255,255,0.15)'; g.lineWidth = 5;
      rr(120, y - 75, 840, 150, 24); g.fill(); g.stroke(); g.restore();
      escalaEm(170, y, on ? 0.9 + 0.1 * k : 0.9, () => texto(nome, 170, y, { f: F(900, 64), cor: on ? COR.branco : COR.cinza, al: 'left' }));
      texto(ex, 920, y, { f: MONO(38, 600), cor: COR.amarelo, al: 'right', a: on ? clamp(k) : 0 });
    });
    g.restore();
  }
  // claquete fecha em "filme"
  const kc = ent(t, tFilme - 0.5, 0.3);
  if (kc > 0) {
    const fecha = inv(tFilme - 0.12, tFilme + 0.06, t);
    g.save(); g.translate(540, 1390 + (1 - kc) * 400); g.rotate(-0.05);
    g.fillStyle = '#111'; rr(-230, -10, 460, 190, 14); g.fill();
    texto('CENA 3 · PLANO 2', 0, 90, { f: MONO(34, 800), cor: COR.branco });
    g.save(); g.translate(-230, -10); g.rotate(-0.55 * (1 - fecha));
    g.fillStyle = '#111'; g.fillRect(0, -60, 460, 56);
    g.fillStyle = COR.branco; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(20 + i * 80, -60); g.lineTo(60 + i * 80, -60); g.lineTo(30 + i * 80, -4); g.lineTo(-10 + i * 80, -4); g.closePath(); g.fill(); }
    g.restore(); g.restore();
  }
  g.restore();
  orbe(t, 140, 220, 52, 1);
  FLASH = Math.max(FLASH, 0.5 * (1 - inv(tFilme + 0.05, tFilme + 0.25, t)) * (t > tFilme + 0.05 ? 1 : 0));
}

// ---- 4. Modelos: script → Blender monta a moto peça por peça (contador real de triângulos) → whip → Kael com esqueleto
function pModelos(t) {
  const pl = plano(t), u = t - pl.t0;
  fundo(t, '#3a1630', 1);
  const tScript = P('script', pl.t0), tMontar = P('montar', pl.t0), tTri = P('156', pl.t0), tPers = P('personagens', pl.t0), tEsq = P('esqueleto', pl.t0), tRosto = P('rosto', pl.t0);
  const tWhip = tPers - 0.25, kW = inv(tWhip - 0.18, tWhip + 0.18, t);
  if (t < tWhip) {
    // moto se montando
    mostrar({ m: true, f: true }); gm().position.set(0, 0, 0); fantasma.grupo ? 0 : 0;
    (fantasma.grupo || fantasma).position.set(0, 0, 0);
    const k = inv(tMontar - 0.1, tTri - 0.05, t);
    motoMontagem(t < tMontar - 0.1 ? 0 : k);
    const a = 1.2 + u * 0.32 + kW * 1.4, r = 5.6;
    cam.fov = 34; cam.updateProjectionMatrix(); cam.position.set(Math.sin(a) * r, 0.9, Math.cos(a) * r); cam.lookAt(0, 0.55, 0);
    g.save(); g.translate(-kW * 900, -40); render3D(); g.restore();
    // contador de triângulos (real: soma das peças já no lugar)
    const nTri = t < tMontar - 0.1 ? 0 : Math.round(TRI_MOTO * suave(k));
    const kc = ent(t, tMontar, 0.3);
    texto('triângulos', 540, 1330, { f: F(700, 44), cor: COR.cinza, a: kc });
    escalaEm(540, 1420, t > tTri ? 1 + 0.12 * (1 - inv(tTri, tTri + 0.4, t)) : 1, () =>
      texto(nTri.toLocaleString('pt-BR'), 540 - kW * 900, 1420, { f: F(900, 130, 'Inter Display'), cor: t > tTri ? COR.amarelo : COR.branco, a: kc, sombra: t > tTri ? 30 : 0 }));
  } else {
    // Kael com o esqueleto acendendo
    mostrar({ k: true, grade: false });
    kaelMix.setTime((t - tWhip) % 4);
    kael.position.set(0, 0, 0); kael.rotation.set(0, -0.35 + Math.sin(t * 0.6) * 0.15, 0);
    const kE = ent(t, tEsq - 0.1, 0.4);
    esqueleto.visible = kE > 0.01; esqueleto.material.opacity = kE;
    kael.traverse(m => { if (m.isMesh) { m.material.transparent = kE > 0.01; m.material.opacity = 1 - 0.55 * kE * (1 - inv(tRosto, tRosto + 0.4, t)); } });
    const ff = inv(tRosto - 0.1, tRosto + 0.6, t);                    // em "rosto" a câmera vai ao rosto
    cam.fov = lerp(30, 18, suave(ff)); cam.updateProjectionMatrix();
    const alvoY = lerp(1.0, 1.42, suave(ff));
    cam.position.set(0.6, lerp(1.2, 1.5, suave(ff)), lerp(5.2, 3.6, suave(ff)) - (t - tWhip) * 0.1); cam.lookAt(0, alvoY, 0);
    g.save(); g.translate((1 - kW) * 900, 0); render3D(); g.restore();
    if (kE > 0) { g.save(); g.globalAlpha = kE; g.fillStyle = 'rgba(8,12,30,0.85)'; rr(220, 1405, 640, 110, 55); g.fill(); g.restore(); }
    texto('esqueleto + rosto', 540, 1462, { f: F(800, 60), cor: COR.amarelo, a: kE });
  }
  // cartão do script (no início)
  const kS = ent(t, pl.t0 + 0.1, 0.35) * (1 - ent(t, tMontar + 0.6, 0.4));
  if (kS > 0) {
    g.save(); g.globalAlpha = kS; g.translate(0, (1 - kS) * -80);
    g.fillStyle = 'rgba(8,12,30,0.92)'; rr(80, 330, 920, 420, 28); g.fill(); g.strokeStyle = COR.vermelho; g.lineWidth = 4; g.stroke();
    texto('criar_moto.py', 120, 395, { f: MONO(36, 800), cor: COR.vermelho, al: 'left' });
    const cod = ['quadro = viga(caminho, 0.06)', 'roda  = revolucao(perfil_aro)', 'carenagem = loft(secoes)', '$ blender -b -P criar_moto.py'];
    cod.forEach((s, i) => {
      const n = Math.floor(s.length * inv(tScript - 0.3 + i * 0.35, tScript + 0.1 + i * 0.35, t));
      texto(s.slice(0, n) + (n < s.length && n > 0 ? '▌' : ''), 120, 470 + i * 72, { f: MONO(38, 600), cor: i === 3 ? COR.amarelo : COR.branco, al: 'left' });
    });
    g.restore();
  }
  orbe(t, 140, 220, 52, 1);
}

// ---- 5. Three.js: janela do navegador com a cena; o tempo t é arrastado e a moto anda e volta junto
function pCena(t) {
  const pl = plano(t), u = t - pl.t0;
  fundo(t, '#123a5c');
  const tSeg = P('segredo', pl.t0), tDigo = P('digo', pl.t0), tFun = P('função', pl.t0);
  const s = lerp(1.15, 1.0, suave(u / 0.8)) + (t > tFun ? 0.06 * suave(inv(tFun, tFun + 0.8, t)) : 0);
  g.save(); camera2D(t, { s, y: 960 + (t > tFun ? 60 * suave(inv(tFun, tFun + 0.8, t)) : 0) });
  const X = 70, Y = 330, Ww = 940, Hh = 980;
  janela(X, Y, Ww, Hh, 'localhost/como_faco/index.html');
  // tempo da cena-exemplo: anda sozinho, depois o cursor arrasta para frente e para trás
  let ts;
  if (t < tDigo) ts = (t - pl.t0) * 0.8;
  else { const v = t - tDigo; ts = (tDigo - pl.t0) * 0.8 + Math.sin(v * 2.2) * 2.6 - (v > 0 ? 0 : 0); }
  ts = clamp(ts, 0, 7.9);
  mostrar({ m: true, grade: true }); motoSolida();
  posMotoPista(ts);
  const zc = (ts * 1.1 - 2.2) * 0.8; cam.fov = 30; cam.updateProjectionMatrix(); cam.position.set(6.2, 2.4, zc + 3.2); cam.lookAt(0, 0.5, zc);
  g.save(); g.beginPath(); g.roundRect(X + 6, Y + 78, Ww - 12, Hh - 84, [0, 0, 24, 24]); g.clip();
  const gr = g.createLinearGradient(0, Y, 0, Y + Hh); gr.addColorStop(0, '#1a3a7a'); gr.addColorStop(1, '#0a1230'); g.fillStyle = gr; g.fillRect(X, Y, Ww, Hh);
  g.translate(X + Ww / 2 - W / 2, Y + 78 + (Hh - 78) / 2 - H / 2); render3D();
  g.restore();
  // "three.js" etiqueta
  texto('Three.js', X + 40, Y + 150, { f: F(900, 58), cor: COR.branco, al: 'left', a: ent(t, pl.t0 + 0.4, 0.3) });
  // código da função do tempo
  const kF = ent(t, tSeg - 0.1, 0.35);
  if (kF > 0) {
    g.save(); g.globalAlpha = kF; g.fillStyle = 'rgba(8,12,30,0.9)'; rr(X + 40, Y + 200, 640, 140, 20); g.fill();
    texto('function quadro(t) {', X + 70, Y + 245, { f: MONO(36, 700), cor: COR.ciano, al: 'left' });
    texto('  moto.z = 1.1 * t …', X + 70, Y + 300, { f: MONO(36, 600), cor: COR.branco, al: 'left' });
    g.restore();
  }
  // barra de tempo
  const by = Y + Hh + 110, bx0 = X + 40, bx1 = X + Ww - 40, kb = ent(t, pl.t0 + 0.3, 0.3);
  g.save(); g.globalAlpha = kb;
  g.fillStyle = 'rgba(255,255,255,0.15)'; rr(bx0, by - 10, bx1 - bx0, 20, 10); g.fill();
  const px = lerp(bx0, bx1, ts / 7.9); g.fillStyle = COR.vermelho; rr(bx0, by - 10, px - bx0, 20, 10); g.fill();
  g.fillStyle = COR.branco; g.beginPath(); g.arc(px, by, 26, 0, 7); g.fill();
  escalaEm(px, by - 90, t > tFun ? 1.15 : 1, () => texto('t = ' + ts.toFixed(1).replace('.', ',') + ' s', px, by - 85, { f: MONO(60, 800), cor: COR.amarelo, sombra: 18 }));
  // cursor (mão) arrastando
  if (t > tDigo - 0.4) { const ka = ent(t, tDigo - 0.4, 0.3); cursor(px + 18, by + 18 + (1 - ka) * 200, ka); }
  g.restore();
  g.restore();
  orbe(t, 140, 220, 52, 1);
}
function cursor(x, y, a = 1) {
  g.save(); g.globalAlpha *= a; g.translate(x, y); g.fillStyle = COR.branco; g.strokeStyle = COR.tinta; g.lineWidth = 5;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 70); g.lineTo(18, 54); g.lineTo(32, 84); g.lineTo(44, 78); g.lineTo(30, 49); g.lineTo(54, 49); g.closePath(); g.fill(); g.stroke(); g.restore();
}

// ---- 6. Render: o navegador fotografa cada quadro → fita de filme a 30 por segundo
function fita(t, y, vel, a = 1, alt = 300) {
  g.save(); g.globalAlpha *= a;
  const fw = alt * 300 / 420 + 30, off = (t * vel) % fw;
  g.fillStyle = '#0b0b10'; g.fillRect(-100, y - alt / 2 - 40, W + 200, alt + 80);
  for (let x = -fw - off; x < W + fw; x += fw) {
    const i = Math.floor((x + off + t * vel) / fw); const m = MINI[((i % 8) + 8) % 8];
    g.drawImage(m, x + 15, y - alt / 2, fw - 30, alt);
    g.fillStyle = '#f4f7ff'; for (let k = 0; k < 4; k++) { rr(x + 8 + k * (fw / 4), y - alt / 2 - 30, fw / 8, 18, 4); g.fill(); rr(x + 8 + k * (fw / 4), y + alt / 2 + 12, fw / 8, 18, 4); g.fill(); }
  }
  g.restore();
}
function pRender(t) {
  const pl = plano(t), u = t - pl.t0;
  fundo(t, '#123a5c');
  const tFoto = P('fotografa', pl.t0), t30 = P('30', pl.t0);
  // janela encolhe e vai para cima
  const k = suave(inv(pl.t0, pl.t0 + 0.7, t));
  const X = lerp(70, 250, k), Y = lerp(330, 300, k), Ww = lerp(940, 580, k), Hh = lerp(980, 600, k);
  janela(X, Y, Ww, Hh, 'chromium --headless');
  g.save(); g.beginPath(); g.roundRect(X + 6, Y + 78, Ww - 12, Hh - 84, 20); g.clip();
  const m = MINI[Math.floor(t * 6) % 8]; g.drawImage(m, X, Y + 78, Ww, Hh - 78); g.restore();
  texto('navegador invisível', 540, Y - 60, { f: F(800, 54), cor: COR.ciano, a: ent(t, pl.t0 + 0.3, 0.3) });
  // flash a cada "foto"
  const vel = lerp(1.5, 8, suave(inv(tFoto, t30 + 0.5, t)));
  if (t > tFoto) { const fase = ((t - tFoto) * vel) % 1; if (fase < 0.25) { g.save(); g.globalAlpha = 0.6 * (1 - fase / 0.25); g.fillStyle = '#fff'; rr(X, Y, Ww, Hh, 28); g.fill(); g.restore(); } }
  fita(t, 1200, t > tFoto ? lerp(200, 1500, suave(inv(tFoto, t30 + 0.4, t))) : 0, ent(t, tFoto - 0.2, 0.4));
  const kk = pop(t, t30 - 0.05, 0.35);
  escalaEm(540, 1480, kk, () => { texto('30 quadros / segundo', 540, 1480, { f: F(900, 70), cor: COR.amarelo, sombra: 20 }); });
  orbe(t, 140, 220, 52, 1);
}

// ---- 7. A descoberta: gráfico de barras (14,1 s → 2,2 s → 0,5 s) e o selo 20×
function relogio(x, y, r, giro, cor = COR.branco) {
  g.save(); g.strokeStyle = cor; g.lineWidth = r * 0.12; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
  g.fillStyle = cor; g.fillRect(x - r * 0.2, y - r * 1.35, r * 0.4, r * 0.25);
  g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(giro) * r * 0.75, y - Math.cos(giro) * r * 0.75); g.stroke(); g.restore();
}
function pDescoberta(t) {
  const pl = plano(t), u = t - pl.t0;
  const tPlaca = P('placa', pl.t0), tCada = P('Cada', pl.t0), t14 = P('14', pl.t0), tMedi = P('medi', pl.t0), tTroq = P('troquei', pl.t0), tLL = P('LLV', pl.t0),
    tCaiu = P('caiu', pl.t0), tDois = P('dois', pl.t0), tMeio = P('meio', pl.t0), tMesma = P('mesma', pl.t0), t20 = P('20', tMesma);
  fundo(t, t < tLL ? '#4a1424' : '#123a5c');
  const choque = t > t20 ? (1 - inv(t20, t20 + 0.6, t)) : 0;
  const s = lerp(1.1, 1.0, suave(u / 0.7)) + (t > t20 ? 0.12 * suave(inv(t20, t20 + 0.3, t)) : 0);
  g.save(); camera2D(t, { s, tremor: 1 + choque * 6 });
  // 1) placa de vídeo riscada
  const kP = pop(t, tPlaca - 0.2, 0.35) * (1 - ent(t, tCada - 0.1, 0.3));
  if (kP > 0) { escalaEm(540, 700, kP * 2.2, () => iconePlaca(540, 700, 1)); risco(540, 700, kP * 2.2, inv(tPlaca + 0.3, tPlaca + 0.7, t)); texto('sem placa de vídeo', 540, 1000, { f: F(900, 72), a: kP }); }
  // 2) gráfico
  const kG = ent(t, tCada - 0.15, 0.35);
  if (kG > 0) {
    g.save(); g.globalAlpha = kG;
    texto('segundos por quadro', 540, 420, { f: F(800, 56), cor: COR.cinza });
    const X0 = 120, X1 = 960, esc = (X1 - X0) / 14.1;
    const barras = [
      ['SwiftShader', 14.1, COR.vermelho, tCada, t14 + 0.5, 1],
      ['llvmpipe', 2.2, COR.ciano, tLL, tCaiu + 0.25, 1],
      ['llvmpipe ×2', 0.5, COR.verde, tDois, tMeio + 0.3, 2],
    ];
    barras.forEach(([nome, val, cor, ta, tb, nav], i) => {
      if (t < ta - 0.1) return;
      const y = 600 + i * 260, k = suave(inv(ta, tb, t)), v = val * k;
      const lento = i === 0 ? (t < t14 + 0.5 ? 0.25 + 0.75 * inv(ta, t14 + 0.5, t) : 1) : 1;
      texto(nome, X0, y - 70, { f: F(800, 52), cor: COR.branco, al: 'left', a: ent(t, ta - 0.1, 0.2) });
      if (nav === 2) { escalaEm(X0 + 520, y - 72, pop(t, tDois, 0.3), () => { for (const d of [0, 70]) { g.save(); g.strokeStyle = COR.verde; g.lineWidth = 6; rr(X0 + 470 + d, y - 100, 56, 46, 8); g.stroke(); g.restore(); } }); }
      g.save(); g.fillStyle = cor; g.shadowColor = cor; g.shadowBlur = 25; rr(X0, y - 30, Math.max(20, v * esc * lento), 70, 16); g.fill(); g.restore();
      const rot = (i === 0 ? 14.1 : val) * k;
      texto(rot.toFixed(1).replace('.', ',') + ' s', Math.max(X0 + 30, X0 + v * esc * lento) + (i === 0 ? -20 : 30), y + 5, { f: F(900, 60), cor: i === 0 ? COR.tinta : cor, al: i === 0 ? 'right' : 'left', a: k > 0.05 ? 1 : 0 });
    });
    // relógio girando na barra lenta; lupa em "medi tudo"
    if (t > tCada && t < tLL) relogio(880, 450, 46, (t - tCada) * 6, COR.vermelho);
    const kM = pop(t, tMedi - 0.1, 0.3) * (1 - ent(t, tTroq - 0.3, 0.25));
    if (kM > 0) escalaEm(820, 1420, kM, () => { g.save(); g.strokeStyle = COR.amarelo; g.lineWidth = 16; g.beginPath(); g.arc(800, 1400, 70, 0, 7); g.stroke(); g.lineCap = 'round'; g.beginPath(); g.moveTo(850, 1450); g.lineTo(920, 1520); g.stroke(); g.restore(); texto('medir o quadro inteiro', 380, 1400, { f: F(800, 44), cor: COR.amarelo }); });
    // troca do motor de desenho: cartão com a linha de comando
    const kC = ent(t, tTroq - 0.1, 0.3) * (1 - ent(t, tMesma - 0.3, 0.3));
    if (kC > 0) { g.save(); g.globalAlpha *= kC; g.fillStyle = 'rgba(8,12,30,0.92)'; rr(90, 1300, 900, 120, 20); g.fill(); texto('--use-angle=gl-egl', 540, 1362, { f: MONO(54, 800), cor: COR.verde }); g.restore(); }
    g.restore();
  }
  // 3) "mesma imagem": duas miniaturas iguais
  const kI = ent(t, tMesma - 0.2, 0.3);
  if (kI > 0) {
    g.save(); g.globalAlpha = kI;
    g.fillStyle = 'rgba(10,18,48,0.85)'; g.fillRect(-200, 1260, W + 400, 360);
    [[200, 'antes'], [700, 'agora']].forEach(([x, rot]) => { g.drawImage(MINI[2], x - 130, 1290, 260, 260 * 420 / 300 * 0.85); texto(rot, x, 1600, { f: F(700, 36), cor: COR.cinza }); });
    texto('=', 450, 1440, { f: F(900, 110), cor: COR.branco });
    g.restore();
  }
  g.restore();
  // selo 20×
  const kS = pop(t, t20 - 0.05, 0.35);
  if (kS > 0) {
    escalaEm(540, 980, kS * (1 + 0.04 * Math.sin(t * 12) * (1 - inv(t20, t20 + 1, t))), () => {
      g.save(); g.translate(540, 980); g.rotate(-0.12); g.fillStyle = COR.amarelo; g.shadowColor = COR.amarelo; g.shadowBlur = 60;
      g.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, r = i % 2 ? 230 : 270; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.restore();
      texto('20×', 540, 960, { f: F(900, 210, 'Inter Display'), cor: COR.tinta });
      texto('mais rápido', 540, 1090, { f: F(900, 52), cor: COR.tinta });
    });
  }
  FLASH = Math.max(FLASH, t > t20 ? 0.7 * (1 - inv(t20, t20 + 0.25, t)) : 0);
  orbe(t, 140, 220, 52, 1);
}

// ---- 8. Montagem: fita + onda de som entram no arquivo MP4
function pMontagem(t) {
  const pl = plano(t), u = t - pl.t0;
  fundo(t);
  const tFF = P('FF', pl.t0), tJunta = P('junta', pl.t0), tMp4 = P('mp4', pl.t0);
  const k = suave(inv(tJunta, tMp4, t));
  // fita vem da esquerda (em cima), onda da direita (embaixo), as duas convergem ao centro
  g.save(); g.translate(-k * 200, lerp(-200, 0, k)); g.globalAlpha = 1 - k * 0.9; fita(t, 960, 600, 1, 220); g.restore();
  g.save(); g.globalAlpha = 1 - k * 0.9; g.strokeStyle = COR.ciano; g.lineWidth = 8; g.beginPath();
  for (let x = 0; x <= W; x += 6) { const e = envelope(t - (W - x) / 900); const y = lerp(1300, 960, k) + Math.sin(x * 0.08 + t * 20) * (20 + e * 110) * (1 - k * 0.7); x ? g.lineTo(x + k * 200, y) : g.moveTo(x, y); }
  g.stroke(); g.restore();
  texto('FFmpeg', 540, 380, { f: F(900, 96, 'Inter Display'), cor: COR.branco, a: ent(t, tFF - 0.2, 0.3) });
  const kA = pop(t, tMp4 - 0.25, 0.35);
  escalaEm(540, 980, kA * 1.6, () => arquivoMP4(540, 980, 1));
  if (t > tMp4) brilhoCirc(540, 980, 500, 'rgba(255,210,63,0.4)', 1 - inv(tMp4, tMp4 + 0.6, t));
  orbe(t, 140, 220, 52, 1);
}

// ---- 9. A voz: duas ondas viram uma; o orbe se abre e revela a moto do começo (loop)
function pVoz(t) {
  const pl = plano(t), u = t - pl.t0;
  const tMist = P('Misturei', pl.t0), tAgora = P('Agora', pl.t0);
  const kAbre = suave(inv(tAgora, tAgora + 1.6, t));
  fundo(t);
  // orbe grande no centro, que se abre como uma íris
  const r = lerp(150, 1500, kAbre ** 1.6);
  const kOndas = suave(inv(tMist, tMist + 1.2, t));
  if (kAbre < 1) {
    // duas ondas (uma ciano, outra vermelha) que se juntam numa só
    for (const [cor, f, ph, dy] of [[COR.ciano, 0.045, 0, -170], [COR.vermelho, 0.06, 2, 170]]) {
      g.save(); g.strokeStyle = cor; g.lineWidth = 10; g.shadowColor = cor; g.shadowBlur = 20; g.globalAlpha = 1 - kAbre; g.beginPath();
      for (let x = 0; x <= W; x += 6) { const e = envSuave(t); const amp = 30 + e * 90; const y = 1350 + dy * (1 - kOndas) + Math.sin(x * lerp(f, 0.05, kOndas) + t * 8 + ph * (1 - kOndas)) * amp; x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke(); g.restore();
    }
    texto('70% + 30%', 540, 1640, { f: MONO(50, 800), cor: COR.amarelo, a: ent(t, tMist, 0.3) * (1 - kAbre) });
  }
  // revelação: moto do quadro 0 dentro do círculo que cresce
  if (kAbre > 0) {
    g.save(); g.beginPath(); g.arc(540, 700, r, 0, 7); g.clip();
    fundo(t); codigoRolando(t - TOTAL, 1);
    mostrar({ m: true }); motoSolida(); gm().position.set(0, 0, 0); gm().rotation.set(0, 0, 0); moto.rodar?.(0); moto.esterco?.(0.18);
    orbitaMoto((t - TOTAL) * 1.0 + 0);       // termina no ângulo do quadro 0
    g.translate(70, -10); render3D(); g.restore();
  }
  orbe(t, 540, 700, 150 * (1 - kAbre * 0.7), 1 - kAbre);
}

// ------------------------------------------------------------------------------------------------ quadro
export function desenhar(t) {
  FLASH = 0;
  g.setTransform(ESC, 0, 0, ESC, 0, 0);
  g.clearRect(0, 0, W, H);
  const pl = plano(t);
  g.save(); pl.des(t, t - pl.t0); g.restore();
  // flash curto em cada corte
  const dt = t - pl.t0; if (pl.t0 > 0 && dt < 0.12) FLASH = Math.max(FLASH, 0.35 * (1 - dt / 0.12));
  if (FLASH > 0) { g.fillStyle = `rgba(255,255,255,${FLASH})`; g.fillRect(0, 0, W, H); }
}
export function quadro(t, { jpeg = 0.92 } = {}) { desenhar(t); return C.toDataURL('image/jpeg', jpeg); }
window.__planos = null;
