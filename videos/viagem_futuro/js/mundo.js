// Elementos do Short "A viagem ao futuro" (v2): cidade seca, máquina do tempo, vórtice de relógios, cidade neon, laboratório, arma de encolhimento,
// elenco magro (pessoas de verdade, com esqueleto), cidade miniatura, banana em fatias, ferramentas, maçã.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { canvasTex, brilho, renderer } from './motor.js';
import { M } from './lote.js';
import { Ator } from './atores.js';
import { dimensionar } from './gente.js';
import { Kit } from '../../biblioteca3d/cidade/kit.js';
import { construirMaquinaTempo } from '../../biblioteca3d/veiculos/maquina_tempo.js';
import { mulberry32, clamp, lerp, suave } from './util.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const OFF = { seca: [0, 0, 0], tunel: [2000, 0, 0], futuro: [3000, 0, 0], lab: [4000, 0, 0] };
export const MS = 0.012;                       // escala da cidade miniatura (pessoa de 1,7 m vira ~2 cm)
export const MC = [7, 0.1715, 9];                // centro da cidade miniatura (em cima da ilha da rotatória, a 0,17 m)
export const PLAZA = [0, 12];                  // centro da rotatória (praça)
export const ELENCO = ['homem', 'mae', 'pai', 'velha', 'faxineira', 'entregador', 'bombeiro', 'terno2', 'terno3', 'policial', 'jovem_b', 'jovem_c', 'homem', 'mae', 'faxineira', 'entregador'];

export async function construirMundo(mundo) {
  const d = {}, grupos = {};
  for (const k of Object.keys(OFF)) { const g = new THREE.Group(); g.name = k; g.position.set(...OFF[k]); mundo.add(g); grupos[k] = g; }
  d.grupos = grupos; d.esconderTudo = () => { for (const k in grupos) grupos[k].visible = false; };
  d.mostrar = k => { grupos[k].visible = true; };
  const kit = await Kit.carregar('../biblioteca3d/cidade/'); d.kit = kit;
  const peca = async (G, nome, x, z, ry = 0, esc = 1, y = 0) => { const o = await kit.peca(nome); o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(esc); G.add(o); return o; };
  const luzes = (G, c1, c2, sol, inten) => { G.add(new THREE.HemisphereLight(c1, c2, 1.1)); const s = new THREE.DirectionalLight(sol, inten); s.position.set(60, 120, 40); G.add(s, s.target); return s; };
  const pm = new THREE.PMREMGenerator(renderer); const env = pm.fromScene(new RoomEnvironment(), 0.04).texture; d.env = env;

  // ------------------------------------------------------------------ CIDADE SECA: terra rachada, prédios do kit, jarras vazias
  const S = grupos.seca;
  d.solS = luzes(S, 0xffe0b8, 0x8a6a48, 0xffd8a0, 2.4); d.solS.castShadow = true; d.solS.shadow.mapSize.set(2048, 2048); d.solS.shadow.bias = -0.0003;
  d.sombraLonge = () => { const s = d.solS; s.position.set(64, 120, 52); s.target.position.set(4, 0, 10); Object.assign(s.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 10, far: 300 }); s.shadow.camera.updateProjectionMatrix(); s.shadow.normalBias = 0.02; };
  d.sombraPerto = (cx, cz, r = 0.9) => { const s = d.solS; s.target.position.set(cx, 0.17, cz); s.position.set(cx + 6, 17, cz + 4.5); Object.assign(s.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 8, far: 40 }); s.shadow.camera.updateProjectionMatrix(); s.shadow.normalBias = 0.0004; };
  d.sombraLonge();
  const texSeca = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#b8895a'; g.fillRect(0, 0, w, h); const r = mulberry32(3); g.strokeStyle = 'rgba(60,35,20,0.7)'; for (let k = 0; k < 55; k++) { let x = r() * w, y = r() * h; g.lineWidth = 1 + r() * 2.5; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 8; s++) { x += (r() - 0.5) * 90; y += (r() - 0.5) * 90; g.lineTo(x, y); } g.stroke(); } for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '80,50,30' : '220,180,130'},0.12)`; g.fillRect(r() * w, r() * h, 6, 6); } }, { repete: true, aniso: 8 }); texSeca.repeat.set(60, 60);
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.MeshStandardMaterial({ map: texSeca, roughness: 1 })); chao.rotation.x = -Math.PI / 2; chao.position.y = -0.02; chao.receiveShadow = true; S.add(chao);
  for (const gz of [-1, 0, 2, 3]) S.add(await kit.ladrilho('rua-reta', 0, gz, 0, ['N', 'S']));
  S.add(await kit.ladrilho('rotatoria', 0, 1)); for (const gx of [-2, -1, 1, 2]) S.add(await kit.ladrilho('rua-reta', gx, 1, 0, ['E', 'W']));
  const nomes = ['predio-residencial-12', 'predio-residencial-6', 'predio-comercial-10', 'predio-loja-3', 'casa-sobrado', 'casa-moderna', 'casa-colonial', 'casa-simples'];
  const rc = mulberry32(21);
  for (let gx = -9; gx <= 9; gx++) for (let gz = -4; gz <= 10; gz++) { const x = gx * 12, z = gz * 12, r = Math.hypot(x, z - 12); if (r < 60 || r > 150 || rc() < 0.3 || (gx === 0 && gz < 5)) continue; await peca(S, nomes[(rc() * nomes.length) | 0], x, z, Math.atan2(-x, 12 - z) + Math.PI); }
  const ilha = new THREE.Mesh(new THREE.CircleGeometry(9.5, 40), new THREE.MeshStandardMaterial({ map: texSeca, roughness: 1, color: 0xcaa07a })); ilha.rotation.x = -Math.PI / 2; ilha.position.set(0, 0.17, 12); ilha.receiveShadow = true; S.add(ilha);
  const jar = new THREE.CylinderGeometry(0.22, 0.28, 0.6, 14), jarM = M(0x8a6a4a, 0.8);
  const rj = mulberry32(9); d.jarras = [];
  for (let i = 0; i < 0; i++) { const j = new THREE.Mesh(jar, jarM); const a = rj() * 6.28, r = 2 + rj() * 6; j.position.set(Math.cos(a) * r + PLAZA[0], 0.17 + 0.3, PLAZA[1] + Math.sin(a) * r * 0.9); j.rotation.z = rj() < 0.5 ? 1.4 : 0; j.castShadow = true; S.add(j); d.jarras.push(j); }

  // ------------------------------------------------------------------ MÁQUINA DO TEMPO (uma só; troca de cenário conforme o plano)
  d.maq = construirMaquinaTempo(); d.maq.ambiente(env, 1.0);
  d.maqEm = (grupo, x, y, z, giro = 0, esc = 1) => { const G = d.maq.grupo; if (G.parent !== grupos[grupo]) grupos[grupo].add(G); G.visible = true; G.position.set(x, y, z); G.rotation.set(0, giro, 0); G.scale.setScalar(esc); G.updateMatrixWorld(true); return G; };
  d.maqFase = 0;
  d.brilhoChegada = brilho('150,230,255', 9, 0.0); d.maq.grupo.add(d.brilhoChegada); d.brilhoChegada.position.y = 1.8;

  // ------------------------------------------------------------------ ELENCO: pessoas de verdade (esqueleto + rosto), magras e desbotadas
  d.pool = [];
  const tons = [0xd8cfc0, 0xcfc4b4, 0xe0d6c6, 0xc8bdae];
  for (let i = 0; i < ELENCO.length; i++) {
    const a = await Ator.criar(ELENCO[i]); a.tingir(tons[i % tons.length]); dimensionar(a, 1); mundo.add(a.grupo); a.grupo.visible = false; a.id = i; d.pool.push(a);
  }
  // heroi: o garoto de camisa vermelha e calça azul (jovem_a repintado; o teen.glb não tem esqueleto)
  d.heroi = await Ator.criar('jovem_a'); d.heroi.pintar({ M_moletom: '#d4262e', M_mol_barra: '#b81e26', M_cordao: '#f2f2f2', M_jeans: '#2a5fb0', M_jeans_plano: '#2a5fb0', M_jeans_punho: '#244f94' }); mundo.add(d.heroi.grupo);
  d.heroi.criarLagrimas(3);

  // anéis de choque de encolhimento (um por pessoa) e brilhos
  const ringG = new THREE.RingGeometry(0.85, 1.0, 40); d.aneisEnc = [];
  for (let i = 0; i < ELENCO.length; i++) { const r = new THREE.Mesh(ringG, new THREE.MeshBasicMaterial({ color: 0x7cc8ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); r.rotation.x = -Math.PI / 2; r.visible = false; r.frustumCulled = false; mundo.add(r); d.aneisEnc.push(r); }
  d.flashEnc = []; for (let i = 0; i < ELENCO.length; i++) { const b = brilho('140,210,255', 1, 0); b.visible = false; mundo.add(b); d.flashEnc.push(b); }

  // ------------------------------------------------------------------ CIDADE MINIATURA (escala MS): chão verde, ruas, casas e prédios do kit; construída aos poucos
  const mini = new THREE.Group(); mini.position.set(...MC); S.add(mini); d.mini = mini;
  const MW = 8 * 12 * MS, MD = 6 * 12 * MS; d.MW = MW; d.MD = MD;
  const tapete = new THREE.Mesh(new THREE.PlaneGeometry(MW + 0.3, MD + 0.3), M(0x4f7a3e, 1)); tapete.rotation.x = -Math.PI / 2; tapete.position.y = -0.0003; tapete.receiveShadow = true; mini.add(tapete);
  d.partes = []; const rm = mulberry32(5);
  const mp = async (nome, gx, gz, ry = 0, y = 0.15) => { const o = await kit.peca(nome); o.position.set((gx - 3.5) * 12 * MS, y * MS, (gz - 2.5) * 12 * MS); o.rotation.y = ry; o.scale.setScalar(MS); o.traverse(q => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); mini.add(o); d.partes.push({ o, k: MS, atraso: d.partes.length * 0.011 }); return o; };
  const lista = ['casa-simples', 'casa-moderna', 'casa-colonial', 'casa-sobrado', 'predio-residencial-6', 'predio-loja-3', 'arvore-frondosa'];
  for (let gx = 0; gx < 8; gx++) for (let gz = 0; gz < 6; gz++) {
    if (gz === 2 || gz === 3) await mp(gx === 3 || gx === 4 ? 'rua-cruzamento' : 'rua-reta', gx, gz, 0, 0);
    else if (gx === 3 || gx === 4) await mp('rua-reta', gx, gz, Math.PI / 2, 0);
    else if (gx === 5 && gz === 1) { d.casaRef = await mp('casa-simples', gx, gz, 0); }
    else if (rm() < 0.85) await mp(lista[(rm() * lista.length) | 0], gx, gz, gz < 2 ? 0 : Math.PI);
  }
  d.constroi = p => { d.partes.forEach(({ o, k, atraso }) => { const u = clamp((p * (1 + 0.011 * d.partes.length * 1.4) - atraso * 1.4) / 0.12); const b = u < 1 ? suave(u) * (1 + 0.25 * Math.sin(u * 3.14)) : 1; o.scale.setScalar(Math.max(1e-5, k * b)); o.visible = u > 0; }); tapete.visible = p > 0.02; };
  d.constroi(0);
  d.miniLocal = (gx, gz) => V((gx - 3.5) * 12 * MS, 0, (gz - 2.5) * 12 * MS);               // posição local de um ladrilho
  d.miniMundo = (lx, lz) => mini.localToWorld(V(lx, 0, lz));

  // ------------------------------------------------------------------ BANANA (tamanho real, 21 cm: gigante para quem tem 2 cm) em 12 fatias que podem ser cortadas
  const curva = new THREE.CatmullRomCurve3([V(-0.1, 0, 0), V(-0.05, 0.034, 0), V(0.05, 0.044, 0), V(0.1, 0.018, 0)]);
  const banana = new THREE.Group(); banana.visible = false; S.add(banana); d.banana = banana; d.bananaSeg = []; d.NSEG = 12;
  const R0 = 0.0215, casca = M(0xf3d324, 0.45), polpa = M(0xf6efc2, 0.8, { side: THREE.DoubleSide }), talo = M(0x7a8a30, 0.8), ponta = M(0x2c2214, 0.8);
  const raio = u => R0 * (0.45 + 0.55 * Math.sin(Math.PI * (0.06 + 0.88 * u)) ** 0.6);
  for (let j = 0; j < d.NSEG; j++) {
    const u0 = j / d.NSEG, u1 = (j + 1) / d.NSEG, ts = 4, rs = 14;
    const pts = []; for (let s = 0; s <= ts; s++) pts.push(curva.getPointAt(u0 + (u1 - u0) * s / ts));
    const sub = new THREE.CatmullRomCurve3(pts); const geo = new THREE.TubeGeometry(sub, ts, 1, rs, false); const pos = geo.attributes.position;
    for (let s = 0; s <= ts; s++) { const c = pts[s], r = raio(u0 + (u1 - u0) * s / ts); for (let q = 0; q <= rs; q++) { const i = s * (rs + 1) + q; pos.setXYZ(i, c.x + (pos.getX(i) - c.x) * r, c.y + (pos.getY(i) - c.y) * r, c.z + (pos.getZ(i) - c.z) * r); } }
    geo.computeVertexNormals();
    const centro = curva.getPointAt((u0 + u1) / 2); geo.translate(-centro.x, -centro.y, -centro.z);
    const g = new THREE.Group(); g.position.copy(centro); banana.add(g);
    const mm = new THREE.Mesh(geo, j === 0 ? talo : j === d.NSEG - 1 ? ponta : casca); mm.castShadow = true; mm.receiveShadow = true; g.add(mm);
    for (const [uu, sg] of [[u0, -1], [u1, 1]]) { const c = curva.getPointAt(uu).sub(centro), tg = curva.getTangentAt(uu); const cap = new THREE.Mesh(new THREE.CircleGeometry(raio(uu) * 0.96, 16), polpa); cap.position.copy(c); cap.quaternion.setFromUnitVectors(V(0, 0, 1), tg.clone().multiplyScalar(sg)); g.add(cap); }
    d.bananaSeg.push({ g, centro: centro.clone(), j });
  }
  banana.scale.setScalar(1.0);
  d.bananaReset = () => { d.bananaSeg.forEach(s => { s.g.position.copy(s.centro); s.g.rotation.set(0, 0, 0); s.g.visible = true; }); };

  // ------------------------------------------------------------------ MAÇÃ (torneada, com gradiente, cabinho e folha; raio 5 cm = maçã grande, bem maior que uma casinha de 7 cm)
  const maca = new THREE.Group(); maca.visible = false; mundo.add(maca); d.maca = maca; d.RMACA = 0.062;
  const perfil = [[0, 0.70], [0.18, 0.78], [0.45, 0.92], [0.78, 0.88], [0.98, 0.62], [1.0, 0.25], [0.92, -0.2], [0.72, -0.62], [0.4, -0.88], [0.15, -0.9], [0]].map((p, i, a) => (p.length === 1 ? new THREE.Vector2(0, -0.84) : new THREE.Vector2(p[0], p[1])));
  const texMaca = canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9cb83a'); gr.addColorStop(0.22, '#d8a02a'); gr.addColorStop(0.42, '#d02a22'); gr.addColorStop(1, '#8a1010'); g.fillStyle = gr; g.fillRect(0, 0, w, h); const r = mulberry32(8); for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(80,0,0,${0.12 + r() * 0.1})`; g.fillRect(r() * w, h * 0.3, 2 + r() * 3, h * 0.7); } });
  const corpoM = new THREE.Mesh(new THREE.LatheGeometry(perfil, 40), new THREE.MeshStandardMaterial({ map: texMaca, roughness: 0.3, metalness: 0.0 })); corpoM.scale.setScalar(d.RMACA); corpoM.castShadow = true; corpoM.receiveShadow = true; maca.add(corpoM);
  const hast = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.003, 0.03, 8), M(0x4a3020, 0.9)); hast.position.y = d.RMACA * 0.72 + 0.008; hast.rotation.z = 0.15; maca.add(hast);
  const fol = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 8), M(0x3f9a2c, 0.6)); fol.scale.set(2.3, 0.22, 1); fol.position.set(0.016, d.RMACA * 0.72 + 0.02, 0); fol.rotation.z = 0.35; maca.add(fol);

  // ------------------------------------------------------------------ FERRAMENTAS de miniatura: machados/serras e pedacinhos de banana
  d.ferr = [];
  for (let i = 0; i < 8; i++) { const g = new THREE.Group(); const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.0007, 0.0007, 0.013, 6), M(0x6a4a2a, 0.8)); cabo.rotation.x = Math.PI / 2; cabo.position.z = 0.004; g.add(cabo); const lamina = new THREE.Mesh(new THREE.BoxGeometry(0.0012, 0.0055, 0.0045), M(0xdfe6ee, 0.25, { metalness: 0.8, envMap: env })); lamina.position.set(0, -0.0018, 0.0105); g.add(lamina); g.visible = false; mundo.add(g); d.ferr.push(g); }
  d.pedacinhos = []; const pedG = new THREE.BoxGeometry(0.004, 0.004, 0.004); for (let i = 0; i < 24; i++) { const m = new THREE.Mesh(pedG, M(i % 2 ? 0xf6efc2 : 0xf3d324, 0.7)); m.visible = false; m.castShadow = true; mundo.add(m); d.pedacinhos.push(m); }

  // ------------------------------------------------------------------ VÓRTICE DO TEMPO: anéis finos, relógios gigantes, folhas de calendário, riscos de luz, poeira de tempo
  const Tu = grupos.tunel; d.aneisT = [];
  for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(10, 0.12, 6, 56), new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(i / 40, 0.9, 0.58), toneMapped: false })); Tu.add(m); d.aneisT.push(m); }
  const texRel = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#e8e0c8'; g.beginPath(); g.arc(128, 128, 124, 0, 6.3); g.fill(); g.strokeStyle = '#7a5a20'; g.lineWidth = 10; g.stroke(); g.fillStyle = '#2a2010'; g.font = 'bold 34px "DejaVu Serif", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2 - Math.PI / 2; g.fillText(String(i), 128 + Math.cos(a) * 92, 128 + Math.sin(a) * 92); } });
  d.relogios = []; const rr = mulberry32(17), maoM = M(0x1a1408, 0.5), discoG = new THREE.CircleGeometry(1, 36);
  for (let i = 0; i < 34; i++) {
    const g = new THREE.Group(), th = rr() * 6.283, R = 6 + rr() * 6, tam = 1.4 + rr() * 2.2;
    const face = new THREE.Mesh(discoG, new THREE.MeshBasicMaterial({ map: texRel, side: THREE.DoubleSide, toneMapped: false })); face.scale.setScalar(tam); g.add(face);
    const hm = new THREE.Mesh(new THREE.BoxGeometry(0.06 * tam, 0.78 * tam, 0.02), maoM); hm.geometry.translate(0, 0.34 * tam, 0.02); g.add(hm);
    const hh = new THREE.Mesh(new THREE.BoxGeometry(0.09 * tam, 0.5 * tam, 0.02), maoM); hh.geometry.translate(0, 0.2 * tam, 0.03); g.add(hh);
    g.quaternion.setFromUnitVectors(V(0, 0, 1), V(-Math.cos(th), -Math.sin(th), 0)); g.userData = { th, R, z0: rr() * 240, v: 40 + rr() * 30, hm, hh, w: (rr() < 0.5 ? -1 : 1) * (2 + rr() * 6) };
    Tu.add(g); d.relogios.push(g);
  }
  const texPag = canvasTex(128, 160, (g, w, h) => { g.fillStyle = '#f4f0e0'; g.fillRect(0, 0, w, h); g.fillStyle = '#c03030'; g.fillRect(0, 0, w, 30); g.fillStyle = '#2a2a2a'; g.font = 'bold 70px "DejaVu Sans", sans-serif'; g.textAlign = 'center'; g.fillText('17', w / 2, 110); });
  d.NPAG = 120; d.paginas = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.9, 1.1), new THREE.MeshBasicMaterial({ map: texPag, side: THREE.DoubleSide, toneMapped: false }), d.NPAG); d.paginas.frustumCulled = false; Tu.add(d.paginas);
  d.NRISCO = 160; d.riscos = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.05, 9), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), d.NRISCO); d.riscos.frustumCulled = false; Tu.add(d.riscos);
  { const c = new THREE.Color(), r = mulberry32(5); for (let i = 0; i < d.NRISCO; i++) d.riscos.setColorAt(i, c.setHSL(r(), 0.9, 0.65)); }
  d.vortice = (t, vel = 1) => {
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
    d.aneisT.forEach((r, i) => { r.position.z = -(((i * 8 - t * 60 * vel) % 320) + 320) % 320 + 30; r.scale.setScalar(1 + 0.03 * Math.sin(t * 3 + i)); });
    d.relogios.forEach(g => { const u = g.userData; const z = ((u.z0 + t * u.v * vel) % 260) - 200; g.position.set(Math.cos(u.th) * u.R, Math.sin(u.th) * u.R, z); u.hm.rotation.z = -(t * u.w * 3); u.hh.rotation.z = -(t * u.w * 0.25); });
    const r = mulberry32(99);
    for (let i = 0; i < d.NPAG; i++) { const th = r() * 6.283, R = 3.5 + r() * 8, z0 = r() * 240, v = 30 + r() * 30, w = (r() - 0.5) * 10; const z = ((z0 + t * v * vel) % 260) - 200; p.set(Math.cos(th) * R, Math.sin(th) * R, z); e.set(t * w + i, t * w * 0.7, t * w * 0.4); q.setFromEuler(e); m4.compose(p, q, s); d.paginas.setMatrixAt(i, m4); }
    d.paginas.instanceMatrix.needsUpdate = true;
    const r2 = mulberry32(7);
    for (let i = 0; i < d.NRISCO; i++) { const th = r2() * 6.283, R = 2.5 + r2() * 12, z0 = r2() * 300, v = 120 + r2() * 90; const z = ((z0 + t * v * vel) % 320) - 230; p.set(Math.cos(th) * R, Math.sin(th) * R, z); q.identity(); s.set(1, 1, 0.6 + r2() * 1.4); m4.compose(p, q, s); d.riscos.setMatrixAt(i, m4); }
    d.riscos.instanceMatrix.needsUpdate = true;
  };
  const poeira = new THREE.Points((() => { const g = new THREE.BufferGeometry(), a = [], r = mulberry32(2); for (let i = 0; i < 700; i++) a.push((r() - 0.5) * 26, (r() - 0.5) * 26, -r() * 300 + 40); g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); return g; })(), new THREE.PointsMaterial({ color: 0xaad0ff, size: 0.22 })); Tu.add(poeira);
  const fim = brilho('255,240,255', 120, 0.9); fim.position.set(0, 0, -200); Tu.add(fim);
  Tu.add(new THREE.AmbientLight(0x8890c0, 1.1)); const luzT = new THREE.DirectionalLight(0xffffff, 1.2); luzT.position.set(5, 8, 10); Tu.add(luzT);

  // ------------------------------------------------------------------ FUTURO: cidade neon com letreiros e carros voadores
  const Fu = grupos.futuro; Fu.add(new THREE.HemisphereLight(0x5a78d0, 0x201840, 1.0)); const sf = new THREE.DirectionalLight(0x9ab0ff, 1.4); sf.position.set(-40, 80, 30); Fu.add(sf);
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), M(0x0e1230, 0.35, { metalness: 0.4 })); sol.rotation.x = -Math.PI / 2; Fu.add(sol);
  const rf = mulberry32(31); d.carros = [];
  for (let gx = -8; gx <= 8; gx++) for (let gz = -3; gz <= 10; gz++) { if (Math.abs(gx) <= 1 && gz < 4) continue; if (rf() < 0.25) continue; const o = await peca(Fu, ['predio-residencial-12', 'predio-comercial-10', 'predio-residencial-12', 'predio-loja-3'][(rf() * 4) | 0], gx * 16, gz * 16, Math.atan2(-gx, 4 - gz) + Math.PI, 1 + rf() * 1.4); kit.luzEstado(o, true); }
  for (let i = 0; i < 30; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 1.2), M(0x10141c, 0.3, { emissive: new THREE.Color().setHSL(rf(), 1, 0.5), emissiveIntensity: 1.8 })); c.userData = { y: 12 + rf() * 40, z: -20 + rf() * 150, v: (rf() < 0.5 ? -1 : 1) * (10 + rf() * 18), x0: (rf() - 0.5) * 200 }; Fu.add(c); d.carros.push(c); }
  for (let i = 0; i < 16; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(3 + rf() * 4, 0.12, 8, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(rf() < 0.5 ? 0.85 : 0.5, 1, 0.6), toneMapped: false })); t.position.set((rf() - 0.5) * 160, 20 + rf() * 50, 20 + rf() * 100); t.rotation.set(rf() * 3, rf() * 3, 0); Fu.add(t); }
  for (let i = 0; i < 6; i++) { const hue = rf() < 0.5 ? 0.88 : 0.5; const hol = new THREE.Mesh(new THREE.PlaneGeometry(6 + rf() * 6, 3 + rf() * 4), new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(hue, 1, 0.55), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); hol.position.set(30 + rf() * 60 * (rf() < 0.5 ? 1 : -1), 14 + rf() * 40, 50 + rf() * 60); hol.rotation.y = rf() * 3; Fu.add(hol); }

  // ------------------------------------------------------------------ LABORATÓRIO (escuro e azulado, com faixas de luz; pedestal com a arma sob a cúpula)
  const Lb = grupos.lab; Lb.add(new THREE.AmbientLight(0x3a4a70, 1.0)); d.luzLab = new THREE.PointLight(0xaad8ff, 22, 18, 1.6); d.luzLab.position.set(0, 4.2, -2); Lb.add(d.luzLab);
  const sal = new THREE.Mesh(new THREE.BoxGeometry(16, 6.5, 16), M(0x2a3550, 0.55, { side: THREE.BackSide })); sal.position.y = 3.25; sal.receiveShadow = true; Lb.add(sal);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), M(0x141a28, 0.25, { metalness: 0.5, envMap: env })); piso.rotation.x = -Math.PI / 2; piso.position.y = 0.01; piso.receiveShadow = true; Lb.add(piso);
  for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 15.6), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x36e6ff : 0x7a6cff, toneMapped: false })); f.position.set(-6.5 + i * 2.6, 6.2, 0); Lb.add(f); }
  for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(15.6, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0x36e6ff, toneMapped: false })); f.position.set(0, 0.4 + (i % 2) * 0.1, i < 3 ? -7.9 : 7.9); Lb.add(f); }
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 1.05, 28), M(0x3a4a62, 0.3, { metalness: 0.7, envMap: env })); ped.position.set(0, 0.52, -4); ped.castShadow = true; Lb.add(ped);
  const anelPed = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.04, 8, 40), new THREE.MeshBasicMaterial({ color: 0x36e6ff, toneMapped: false })); anelPed.rotation.x = Math.PI / 2; anelPed.position.set(0, 1.06, -4); Lb.add(anelPed);
  const dom = new THREE.Mesh(new THREE.SphereGeometry(0.78, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xaad8ff, transparent: true, opacity: 0.22, roughness: 0.05, depthWrite: false })); dom.position.set(0, 1.08, -4); Lb.add(dom); d.domo = dom;
  d.alarme = new THREE.PointLight(0xff2030, 0, 30, 1.4); d.alarme.position.set(0, 5.4, 0); Lb.add(d.alarme);
  d.sirene = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshBasicMaterial({ color: 0xff3040, toneMapped: false })); d.sirene.position.set(0, 6.0, -3); Lb.add(d.sirene);
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.6, 0.8), M(0x232d44, 0.4, { metalness: 0.5, envMap: env })); m.position.set(-6 + i * 4, 1.3, 7.3); m.castShadow = true; Lb.add(m); const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x40d0ff : 0xff5fd8, toneMapped: false })); sc.position.set(-6 + i * 4, 1.8, 6.88); sc.rotation.y = Math.PI; Lb.add(sc); }
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3.4, 18), new THREE.MeshStandardMaterial({ color: 0x40ffb0, emissive: new THREE.Color().setHSL(0.4 + i * 0.12, 0.9, 0.4), emissiveIntensity: 1.2, transparent: true, opacity: 0.55, roughness: 0.1 })); t.position.set(sx * 7, 1.8, -5 + i * 3); Lb.add(t); }

  // ------------------------------------------------------------------ ARMA DE ENCOLHIMENTO e raio
  const arma = new THREE.Group(); mundo.add(arma); d.arma = arma;
  const metal = M(0xe8eef6, 0.25, { metalness: 0.7, envMap: env }), azul = M(0x2a8aff, 0.3, { emissive: 0x1860ff, emissiveIntensity: 2.2 });
  const corpoA = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 0.26), metal); arma.add(corpoA);
  const topoA = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.2), M(0x2a3040, 0.4, { metalness: 0.6, envMap: env })); topoA.position.set(0, 0.07, 0.0); arma.add(topoA);
  const tanque = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.14, 14), azul); tanque.rotation.x = Math.PI / 2; tanque.position.set(0, 0.098, -0.02); arma.add(tanque);
  const canoA = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.22, 16), azul); canoA.rotation.x = Math.PI / 2; canoA.position.set(0, 0.02, 0.2); arma.add(canoA);
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 8, 20), metal); b.position.set(0, 0.02, 0.15 + i * 0.05); arma.add(b); }
  const bocal = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.05, 16, 1, true), azul); bocal.rotation.x = -Math.PI / 2; bocal.position.set(0, 0.02, 0.33); arma.add(bocal);
  const cabo = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.06), M(0x20242c, 0.5)); cabo.position.set(0, -0.1, -0.06); cabo.rotation.x = 0.2; arma.add(cabo);
  d.armaBrilho = brilho('90,170,255', 0.35, 0.9); d.armaBrilho.position.set(0, 0.02, 0.35); arma.add(d.armaBrilho); arma.visible = false;
  d.armaCarga = k => { azul.emissiveIntensity = 1.6 + 5 * k; d.armaBrilho.material.opacity = 0.5 + 0.5 * k; d.armaBrilho.scale.setScalar(0.3 + 0.45 * k); };
  const feixe = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0x66bbff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); feixe.visible = false; feixe.frustumCulled = false; mundo.add(feixe); d.raio = feixe;
  const nucleoF = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 1, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); feixe.add(nucleoF);
  d.impacto = brilho('160,215,255', 0.5, 0); d.impacto.visible = false; mundo.add(d.impacto);
  d.faiscas = []; for (let i = 0; i < 10; i++) { const b = brilho('120,200,255', 1.2, 0); b.visible = false; mundo.add(b); d.faiscas.push(b); }
  return d;
}
