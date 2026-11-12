// Elementos do Short "A viagem ao futuro": cidade seca, nave, túnel do tempo, cidade futurista, laboratório, multidão que encolhe, cidade miniatura, banana e maçã.
import * as THREE from 'three';
import { canvasTex, brilho } from './motor.js';
import { M } from './lote.js';
import { Ator } from './atores.js';
import { Kit } from '../../biblioteca3d/cidade/kit.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32, clamp, lerp, suave } from './util.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const OFF = { seca: [0, 0, 0], nave: [1000, 0, 0], tunel: [2000, 0, 0], futuro: [3000, 0, 0], lab: [4000, 0, 0] };
export const MS = 0.012;                       // escala da cidade miniatura (pessoa de 1,7 m vira ~2 cm)
export const MC = [7, 0, 9];                   // centro da cidade miniatura na praça
export const PC = [0, 0, 10];                  // centro da praça onde as pessoas estão

export async function construirMundo(mundo) {
  const d = {}, grupos = {};
  for (const k of Object.keys(OFF)) { const g = new THREE.Group(); g.name = k; g.position.set(...OFF[k]); mundo.add(g); grupos[k] = g; }
  d.grupos = grupos; d.esconderTudo = () => { for (const k in grupos) grupos[k].visible = false; };
  d.mostrar = k => { grupos[k].visible = true; };
  const kit = await Kit.carregar('../biblioteca3d/cidade/'); d.kit = kit;
  const peca = async (G, nome, x, z, ry = 0, esc = 1, y = 0) => { const o = await kit.peca(nome); o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(esc); G.add(o); return o; };
  const luzes = (G, c1, c2, sol, inten) => { G.add(new THREE.HemisphereLight(c1, c2, 1.1)); const s = new THREE.DirectionalLight(sol, inten); s.position.set(60, 120, 40); G.add(s, s.target); return s; };

  // ------------------------------------------------------------------ CIDADE SECA (presente): terra rachada, prédios, jarras vazias, nave
  const S = grupos.seca;
  d.solS = luzes(S, 0xffe0b8, 0x8a6a48, 0xffd8a0, 2.4); d.solS.castShadow = true; d.solS.shadow.mapSize.set(2048, 2048); Object.assign(d.solS.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 10, far: 300 }); d.solS.target.position.set(4, 0, 10);
  const texSeca = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#b8895a'; g.fillRect(0, 0, w, h); const r = mulberry32(3); g.strokeStyle = 'rgba(60,35,20,0.7)'; for (let k = 0; k < 55; k++) { let x = r() * w, y = r() * h; g.lineWidth = 1 + r() * 2.5; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 8; s++) { x += (r() - 0.5) * 90; y += (r() - 0.5) * 90; g.lineTo(x, y); } g.stroke(); } for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '80,50,30' : '220,180,130'},0.12)`; g.fillRect(r() * w, r() * h, 6, 6); } }, { repete: true, aniso: 8 }); texSeca.repeat.set(60, 60);
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.MeshStandardMaterial({ map: texSeca, roughness: 1 })); chao.rotation.x = -Math.PI / 2; chao.position.y = -0.02; chao.receiveShadow = true; S.add(chao);
  for (const gz of [-1, 0, 2, 3]) S.add(await kit.ladrilho('rua-reta', 0, gz, 0, ['N', 'S']));
  S.add(await kit.ladrilho('rotatoria', 0, 1)); for (const gx of [-2, -1, 1, 2]) S.add(await kit.ladrilho('rua-reta', gx, 1, 0, ['E', 'W']));
  const nomes = ['predio-residencial-12', 'predio-residencial-6', 'predio-comercial-10', 'predio-loja-3', 'casa-sobrado', 'casa-moderna', 'casa-colonial', 'casa-simples'];
  const rc = mulberry32(21);
  for (let gx = -9; gx <= 9; gx++) for (let gz = -4; gz <= 10; gz++) { const x = gx * 12, z = gz * 12, r = Math.hypot(x, z - 12); if (r < 60 || r > 150 || rc() < 0.3 || (gx === 0 && gz < 5)) continue; await peca(S, nomes[(rc() * nomes.length) | 0], x, z, Math.atan2(-x, 12 - z) + Math.PI); }
  const ilha = new THREE.Mesh(new THREE.CircleGeometry(9.5, 40), new THREE.MeshStandardMaterial({ map: texSeca, roughness: 1, color: 0xcaa07a })); ilha.rotation.x = -Math.PI / 2; ilha.position.set(0, 0.17, 12); ilha.receiveShadow = true; S.add(ilha);
  // jarras e baldes vazios espalhados
  const jar = new THREE.CylinderGeometry(0.22, 0.28, 0.6, 14), jarM = M(0x8a6a4a, 0.8);
  const rj = mulberry32(9); d.jarras = [];
  for (let i = 0; i < 9; i++) { const j = new THREE.Mesh(jar, jarM); const a = rj() * 6.28, r = 2 + rj() * 9; j.position.set(Math.cos(a) * r + PC[0], 0.3, PC[2] + Math.sin(a) * r * 0.8); j.rotation.z = rj() < 0.4 ? 1.4 : 0; j.castShadow = true; S.add(j); d.jarras.push(j); }
  d.jarraClose = V(-1.2, 0.3, 5.5); const jj = new THREE.Mesh(jar, M(0x9a7a56, 0.8)); jj.position.copy(d.jarraClose); jj.rotation.z = 1.35; jj.scale.setScalar(1.3); jj.castShadow = true; S.add(jj);
  // a nave (cápsula prateada com anel e janela)
  const nave = new THREE.Group(); nave.position.set(-8, 0, 12); S.add(nave); d.naveS = nave;
  const casco = new THREE.Mesh(new THREE.SphereGeometry(2.1, 32, 20), M(0xcfd6e0, 0.35, { metalness: 0.5, emissive: 0x39445a, emissiveIntensity: 1.0 })); casco.scale.set(1.3, 1, 1.3); casco.position.y = 2.2; casco.castShadow = true; nave.add(casco);
  const anel = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.18, 10, 40), M(0x2a8aff, 0.4, { emissive: 0x1450c0, emissiveIntensity: 1.5 })); anel.rotation.x = Math.PI / 2; anel.position.y = 2.2; nave.add(anel);
  const jan = new THREE.Mesh(new THREE.SphereGeometry(1.0, 20, 14, 0, Math.PI), M(0x7fd0ff, 0.1, { emissive: 0x3070a0, emissiveIntensity: 0.9 })); jan.position.set(0, 2.5, 2.2); nave.add(jan);
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 8), M(0x8a909a, 0.5, { metalness: 0.6 })); p.position.set(sx * 2.4, 1.1, 0); p.rotation.z = sx * 0.4; nave.add(p); }
  d.naveBrilho = brilho('90,170,255', 9, 0.8); d.naveBrilho.position.y = 0.3; nave.add(d.naveBrilho);

  // ---- multidão da seca: pessoas deitadas/caídas que depois encolhem e caminham para a cidade miniatura
  const N = 64; d.N = N;
  const corpoG = new THREE.CapsuleGeometry(0.26, 0.85, 3, 8); corpoG.translate(0, 0.7, 0); const cabG = new THREE.SphereGeometry(0.28, 12, 10); cabG.translate(0, 1.58, 0);
  const ib = new THREE.InstancedMesh(corpoG, new THREE.MeshStandardMaterial({ roughness: 0.9 }), N), ih = new THREE.InstancedMesh(cabG, new THREE.MeshStandardMaterial({ roughness: 0.7 }), N);
  ib.castShadow = ih.castShadow = true; ib.frustumCulled = ih.frustumCulled = false; S.add(ib, ih);
  const rp = mulberry32(44), col = new THREE.Color(), pele = ['#e0b896', '#c58a60', '#8a5a3a', '#5a3a28', '#f0cfa8'], roupa = [0x8a7a5a, 0x6a5a4a, 0x9a8a6a, 0x7a6a56, 0x5a5a4a, 0xa89a7a];
  const P0 = [], P1 = [], dl = [], yaw = []; const MW = 8 * 12 * MS, MD = 6 * 12 * MS;
  for (let i = 0; i < N; i++) {
    let x, z; do { x = PC[0] + (rp() - 0.5) * 22; z = PC[2] + (rp() - 0.5) * 14; } while (Math.hypot(x - 0, z - 0) < 4 || Math.hypot(x - MC[0], z - MC[2]) < 3.2);
    P0.push([x, z]); P1.push([MC[0] - MW / 2 + 0.1 + rp() * (MW - 0.2), MC[2] - MD / 2 + 0.1 + rp() * (MD - 0.2)]); dl.push(rp()); yaw.push(rp() * 6.28);
    ib.setColorAt(i, col.setHex(roupa[(rp() * roupa.length) | 0])); ih.setColorAt(i, col.set(pele[(rp() * pele.length) | 0]));
  }
  const mm = new THREE.Matrix4(), qa = new THREE.Quaternion(), ea = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  d.p0 = P0;
  // enc 0..1: quando cada um encolhe (escalonado); cam 0..1: caminhada até a cidade; fraco 0..1: o quanto estão caídos
  d.multidao = (enc, cam, t, vivo = 0) => {
    for (let i = 0; i < N; i++) {
      const e = clamp((enc * 1.6 - dl[i] * 0.6) / 0.4), s = lerp(1, MS, suave(e)), w = suave(clamp((cam * 1.4 - dl[i] * 0.4)));
      const x = lerp(P0[i][0], P1[i][0], w), z = lerp(P0[i][1], P1[i][1], w);
      const caido = e < 0.2 ? 1 - e / 0.2 : 0;
      ea.set(-Math.PI / 2 * caido * (1 - vivo * 0), yaw[i] + (e > 0.2 ? Math.atan2(P1[i][0] - P0[i][0], P1[i][1] - P0[i][1]) : 0), 0, 'YXZ'); qa.setFromEuler(ea);
      const bob = e > 0.3 && w > 0 && w < 1 ? Math.abs(Math.sin(t * 10 + i)) * 0.15 * s : (e < 0.2 ? 0.02 * Math.sin(t * 2 + i) : 0);
      ps.set(x, caido * 0.22 * s + bob, z); sc.setScalar(s); mm.compose(ps, qa, sc); ib.setMatrixAt(i, mm); ih.setMatrixAt(i, mm);
    }
    ib.instanceMatrix.needsUpdate = ih.instanceMatrix.needsUpdate = true;
  };
  d.multidao(0, 0, 0);
  d.posPessoa = (i, enc, cam) => { const e = clamp((enc * 1.6 - dl[i] * 0.6) / 0.4), w = suave(clamp((cam * 1.4 - dl[i] * 0.4))); return V(lerp(P0[i][0], P1[i][0], w), 0, lerp(P0[i][1], P1[i][1], w)); };

  // ---- cidade miniatura (escala MS): chão verde, ruas, casas, prédios e árvores; construída aos poucos
  const mini = new THREE.Group(); mini.position.set(...MC); S.add(mini); d.mini = mini;
  const tapete = new THREE.Mesh(new THREE.PlaneGeometry(MW + 0.3, MD + 0.3), M(0x4f7a3e, 1)); tapete.rotation.x = -Math.PI / 2; tapete.position.y = 0.002; tapete.receiveShadow = true; mini.add(tapete);
  d.partes = []; const rm = mulberry32(5);
  const mp = async (nome, gx, gz, ry = 0, y = 0.15) => { const o = await kit.peca(nome); o.position.set((gx - 3.5) * 12 * MS, y * MS, (gz - 2.5) * 12 * MS); o.rotation.y = ry; o.scale.setScalar(MS); mini.add(o); d.partes.push({ o, k: MS, atraso: d.partes.length * 0.011 }); return o; };
  for (let gx = 0; gx < 8; gx++) for (let gz = 0; gz < 6; gz++) {
    if (gz === 2 || gz === 3) await mp(gx === 3 || gx === 4 ? 'rua-cruzamento' : 'rua-reta', gx, gz, 0, 0);
    else if (gx === 3 || gx === 4) await mp('rua-reta', gx, gz, Math.PI / 2, 0);
    else if (rm() < 0.8) await mp(['casa-simples', 'casa-moderna', 'casa-colonial', 'casa-sobrado', 'predio-residencial-6', 'predio-loja-3', 'arvore-frondosa'][(rm() * 7) | 0], gx, gz, (gz < 2 ? 0 : Math.PI) + (rm() < 0.5 ? 0 : 0));
  }
  d.constroi = p => { d.partes.forEach(({ o, k, atraso }, i) => { const u = clamp((p * (1 + 0.011 * d.partes.length * 1.4) - atraso * 1.4) / 0.12); const b = u < 1 ? suave(u) * (1 + 0.25 * Math.sin(u * 3.14)) : 1; o.scale.setScalar(Math.max(1e-5, k * b)); o.visible = u > 0; }); tapete.visible = p > 0.02; };
  d.constroi(0);

  // ---- banana e maçã (tamanho real: 18 cm e 8 cm — gigantes perto das pessoas de 2 cm)
  const curva = new THREE.CatmullRomCurve3([V(-0.1, 0, 0), V(-0.05, 0.035, 0), V(0.05, 0.045, 0), V(0.1, 0.02, 0)]);
  const banana = new THREE.Group(); const tub = new THREE.Mesh(new THREE.TubeGeometry(curva, 30, 0.017, 10, false), M(0xf3d324, 0.5)); tub.castShadow = true; banana.add(tub);
  const ponta = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), M(0x3a2a14, 0.8)); ponta.position.copy(curva.getPoint(1)); banana.add(ponta); const talo = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.01, 0.025, 8), M(0x6a7a2a, 0.8)); talo.position.copy(curva.getPoint(0)).add(V(-0.012, -0.004, 0)); talo.rotation.z = 1.2; banana.add(talo);
  banana.scale.setScalar(1.15); banana.visible = false; S.add(banana); d.banana = banana;
  const maca = new THREE.Group(); const mc = new THREE.Mesh(new THREE.SphereGeometry(0.045, 24, 18), M(0xd02a2a, 0.35)); mc.scale.set(1, 0.92, 1); mc.castShadow = true; maca.add(mc);
  const hast = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.025, 6), M(0x4a3020, 0.9)); hast.position.y = 0.045; maca.add(hast); const fol = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), M(0x3a8a2a, 0.7)); fol.scale.set(1.8, 0.3, 1); fol.position.set(0.012, 0.05, 0); maca.add(fol);
  maca.visible = false; S.add(maca); d.maca = maca;

  // ------------------------------------------------------------------ NAVE (cabine por dentro)
  const Nv = grupos.nave;
  Nv.add(new THREE.AmbientLight(0x4a5a80, 0.9)); const lp = new THREE.PointLight(0x80b0ff, 22, 14, 1.6); lp.position.set(0, 3, 1); Nv.add(lp); d.luzNave = lp;
  const sala = new THREE.Mesh(new THREE.BoxGeometry(8, 4.4, 8), M(0x1a2030, 0.6, { metalness: 0.5, side: THREE.BackSide })); sala.position.y = 2.2; Nv.add(sala);
  const cvJ = document.createElement('canvas'); cvJ.width = 256; cvJ.height = 256; const gJ = cvJ.getContext('2d'); const tJ = new THREE.CanvasTexture(cvJ);
  const janela = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.6), new THREE.MeshBasicMaterial({ map: tJ })); janela.position.set(0, 2.5, -3.95); Nv.add(janela); d.janela = (t, mod) => { gJ.fillStyle = '#02030a'; gJ.fillRect(0, 0, 256, 256); for (let r = 0; r < 14; r++) { const k = (((t * 0.8 * (mod || 1) + r / 14) % 1) + 1) % 1; gJ.strokeStyle = `hsl(${(r * 40 + t * 90) % 360},90%,${40 + 30 * k}%)`; gJ.lineWidth = 2 + k * 14; gJ.beginPath(); gJ.arc(128, 128, 4 + k * k * 190, 0, 6.3); gJ.stroke(); } tJ.needsUpdate = true; };
  const painel = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.1, 1.2), M(0x232b3c, 0.4, { metalness: 0.6 })); painel.position.set(0, 0.55, -2.6); Nv.add(painel);
  const cvP = document.createElement('canvas'); cvP.width = 512; cvP.height = 160; const gP = cvP.getContext('2d'); const tP = new THREE.CanvasTexture(cvP); tP.colorSpace = THREE.SRGBColorSpace;
  const telaP = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.0), new THREE.MeshBasicMaterial({ map: tP })); telaP.position.set(0, 1.35, -2.0); telaP.rotation.x = -0.5; Nv.add(telaP);
  d.ano = (ano, ativa) => { gP.fillStyle = '#04141c'; gP.fillRect(0, 0, 512, 160); gP.fillStyle = ativa ? '#5ff0ff' : '#2a7a88'; gP.textAlign = 'center'; gP.font = 'bold 26px "DejaVu Sans Mono", monospace'; gP.fillText('MÁQUINA DO TEMPO', 256, 38); gP.font = 'bold 84px "DejaVu Sans Mono", monospace'; gP.fillText(String(Math.round(ano)), 256, 128); tP.needsUpdate = true; }; d.ano(2026, false);
  const alav = new THREE.Group(); alav.position.set(-1.4, 1.1, -2.2); Nv.add(alav); const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.8, 10), M(0xc0c6d0, 0.3, { metalness: 0.8 })); haste.position.y = 0.4; alav.add(haste); const bola = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), M(0xe03030, 0.4)); bola.position.y = 0.85; alav.add(bola); d.alavanca = alav; d.alavTopo = () => { const v = V(0, 0.85, 0); alav.localToWorld(v); return v; };

  // ------------------------------------------------------------------ TÚNEL DO TEMPO
  const Tu = grupos.tunel; d.aneisT = [];
  for (let i = 0; i < 46; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(9, 0.28, 8, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(i / 46, 0.9, 0.55) })); m.position.z = -i * 7; Tu.add(m); d.aneisT.push(m); }
  d.naveT = d.naveS.clone(); d.naveT.position.set(0, 0, 0); d.naveT.scale.setScalar(0.5); Tu.add(d.naveT);
  const poeira = new THREE.Points((() => { const g = new THREE.BufferGeometry(), a = [], r = mulberry32(2); for (let i = 0; i < 500; i++) a.push((r() - 0.5) * 24, (r() - 0.5) * 24, -r() * 320); g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); return g; })(), new THREE.PointsMaterial({ color: 0xaad0ff, size: 0.25 })); Tu.add(poeira);

  // ------------------------------------------------------------------ FUTURO: cidade neon e laboratório
  const Fu = grupos.futuro; Fu.add(new THREE.HemisphereLight(0x5a78d0, 0x201840, 1.0)); const sf = new THREE.DirectionalLight(0x9ab0ff, 1.4); sf.position.set(-40, 80, 30); Fu.add(sf);
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), M(0x0e1230, 0.4, { metalness: 0.4 })); sol.rotation.x = -Math.PI / 2; Fu.add(sol);
  const rf = mulberry32(31); d.carros = [];
  for (let gx = -8; gx <= 8; gx++) for (let gz = -3; gz <= 10; gz++) { if (Math.abs(gx) <= 1 && gz < 4) continue; if (rf() < 0.25) continue; const o = await peca(Fu, ['predio-residencial-12', 'predio-comercial-10', 'predio-residencial-12', 'predio-loja-3'][(rf() * 4) | 0], gx * 16, gz * 16, Math.atan2(-gx, 4 - gz) + Math.PI, 1 + rf() * 1.4); kit.luzEstado(o, true); }
  for (let i = 0; i < 26; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 1.2), M(0x10141c, 0.3, { emissive: new THREE.Color().setHSL(rf(), 1, 0.5), emissiveIntensity: 1.6 })); c.userData = { y: 12 + rf() * 40, z: -20 + rf() * 150, v: (rf() < 0.5 ? -1 : 1) * (10 + rf() * 18), x0: (rf() - 0.5) * 200 }; Fu.add(c); d.carros.push(c); }
  for (let i = 0; i < 14; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(3 + rf() * 4, 0.12, 8, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(rf() < 0.5 ? 0.85 : 0.5, 1, 0.6) })); t.position.set((rf() - 0.5) * 160, 20 + rf() * 50, 20 + rf() * 100); t.rotation.set(rf() * 3, rf() * 3, 0); Fu.add(t); }
  d.naveF = d.naveS.clone(); d.naveF.position.set(10, 0, 30); Fu.add(d.naveF);
  const Lb = grupos.lab; Lb.add(new THREE.AmbientLight(0x8aa0c8, 0.9)); const ll = new THREE.PointLight(0xbfe0ff, 40, 24, 1.5); ll.position.set(0, 4, 0); Lb.add(ll);
  const sal = new THREE.Mesh(new THREE.BoxGeometry(14, 6, 14), M(0xe8eef6, 0.5, { side: THREE.BackSide })); sal.position.y = 3; Lb.add(sal);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.1, 24), M(0x2a3040, 0.3, { metalness: 0.7 })); ped.position.set(0, 0.55, -4); Lb.add(ped);
  const dom = new THREE.Mesh(new THREE.SphereGeometry(0.75, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xaad8ff, transparent: true, opacity: 0.25, roughness: 0.05 })); dom.position.set(0, 1.1, -4); Lb.add(dom); d.domo = dom;
  d.alarme = new THREE.PointLight(0xff2030, 0, 30, 1.4); d.alarme.position.set(0, 5, 0); Lb.add(d.alarme);
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.6, 0.8), M(0x1a2030, 0.5, { metalness: 0.5 })); m.position.set(-6 + i * 4, 1.3, 6.4); Lb.add(m); const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1), new THREE.MeshBasicMaterial({ color: 0x40d0ff })); sc.position.set(-6 + i * 4, 1.8, 6.0); sc.rotation.y = Math.PI; Lb.add(sc); }

  // ------------------------------------------------------------------ ARMA DE ENCOLHIMENTO e raio
  const arma = new THREE.Group(); mundo.add(arma); d.arma = arma;
  const corpoA = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 0.26), M(0xe8eef6, 0.25, { metalness: 0.6 })); arma.add(corpoA);
  const canoA = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.22, 14), M(0x2a8aff, 0.3, { emissive: 0x1860ff, emissiveIntensity: 2 })); canoA.rotation.x = Math.PI / 2; canoA.position.set(0, 0.02, 0.2); arma.add(canoA);
  const cabo = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.06), M(0x20242c, 0.5)); cabo.position.set(0, -0.1, -0.06); cabo.rotation.x = 0.2; arma.add(cabo);
  d.armaBrilho = brilho('90,170,255', 0.35, 0.9); d.armaBrilho.position.set(0, 0.02, 0.32); arma.add(d.armaBrilho); arma.visible = false;
  const raio = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0x66bbff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })); raio.visible = false; raio.frustumCulled = false; mundo.add(raio); d.raio = raio;
  d.faiscas = []; for (let i = 0; i < 10; i++) { const b = brilho('120,200,255', 1.2, 0); b.visible = false; mundo.add(b); d.faiscas.push(b); }
  d.maca_mao = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 14), M(0xd02a2a, 0.35)); d.maca_mao.visible = false; mundo.add(d.maca_mao);

  // herói: o garoto de camisa vermelha e calça azul (jovem_a repintado; o teen.glb não tem esqueleto)
  d.heroi = await Ator.criar('jovem_a'); d.heroi.pintar({ M_moletom: '#d4262e', M_mol_barra: '#b81e26', M_cordao: '#f2f2f2', M_jeans: '#2a5fb0', M_jeans_plano: '#2a5fb0', M_jeans_punho: '#244f94' }); mundo.add(d.heroi.grupo);
  return d;
}
