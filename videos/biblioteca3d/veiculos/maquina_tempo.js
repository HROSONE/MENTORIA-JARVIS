// MÁQUINA DO TEMPO (procedural, sem GLB). Plataforma redonda com assento, console com tela do ano + relógio + alavanca, reator de plasma atrás,
// três anéis de giroscópio aninhados (giram em eixos diferentes), pilares de bobina com descargas elétricas, engrenagens de latão, antena e luzes de borda.
// Unidades em metros; origem no centro do chão; a frente é +z. Convés a 0,30 m; assento do piloto em (0, 0.30, -0.15).
//
//   const mq = construirMaquinaTempo();          // mq.grupo (THREE.Group)
//   mq.girar(fase);                              // fase em radianos (o chamador integra a velocidade ao longo do tempo)
//   mq.energia(k, t);                            // 0..1: brilho do núcleo, LEDs, bobinas e luz própria
//   mq.tela(ano, ativa);  mq.relogio(ang);  mq.alavanca(k);  mq.descargas(t, k);  mq.topoAlavanca(vec)
//   mq.assento   (THREE.Vector3 local onde fica o quadril do piloto)
import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const mat = (c, r = 0.5, m = 0.4, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...extra });
const glowMat = (c, k = 2) => new THREE.MeshStandardMaterial({ color: 0x101820, emissive: c, emissiveIntensity: k, roughness: 0.4 });

function texBrilho(cor) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, `rgba(${cor},1)`); r.addColorStop(0.2, `rgba(${cor},0.5)`); r.addColorStop(0.55, `rgba(${cor},0.1)`); r.addColorStop(1, `rgba(${cor},0)`);
  g.fillStyle = r; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function brilho(cor, tam, op = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texBrilho(cor), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: op, fog: false }));
  s.scale.setScalar(tam); s.renderOrder = 10; return s;
}
function engrenagem(R, dentes, esp, material) {
  const sh = new THREE.Shape(), n = dentes * 4;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, r = (i % 4) < 2 ? R : R * 0.8; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y); }
  sh.closePath(); const furo = new THREE.Path(); furo.absarc(0, 0, R * 0.22, 0, Math.PI * 2, true); sh.holes.push(furo);
  const g = new THREE.ExtrudeGeometry(sh, { depth: esp, bevelEnabled: false }); g.translate(0, 0, -esp / 2);
  const m = new THREE.Mesh(g, material); m.castShadow = true; return m;
}

export function construirMaquinaTempo() {
  const G = new THREE.Group(); G.name = 'maquinaDoTempo';
  const aco = mat(0x66788e, 0.4, 0.6), acoEscuro = mat(0x34425a, 0.45, 0.6), latao = mat(0xd9b050, 0.3, 0.8), cromo = mat(0xe8eef6, 0.2, 0.8), couro = mat(0x8a3a2c, 0.55, 0.05);
  const add = (m, pai = G) => { m.castShadow = true; m.receiveShadow = true; pai.add(m); return m; };

  // ---- base: dois degraus, anel de luz na borda, convés com listras de aviso
  add(new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.15, 0.22, 48), acoEscuro)).position.y = 0.11;
  const rimLuz = new THREE.Mesh(new THREE.TorusGeometry(2.07, 0.05, 8, 64), glowMat(0x36e6ff, 2.5)); rimLuz.rotation.x = Math.PI / 2; rimLuz.position.y = 0.2; G.add(rimLuz);
  add(new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.9, 0.1, 48), aco)).position.y = 0.27;
  const cvD = document.createElement('canvas'); cvD.width = cvD.height = 512; const gD = cvD.getContext('2d');
  gD.fillStyle = '#2a3140'; gD.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { gD.strokeStyle = 'rgba(0,0,0,0.5)'; gD.lineWidth = 3; gD.strokeRect(i * 85 + 3, j * 85 + 3, 80, 80); gD.fillStyle = 'rgba(255,255,255,0.05)'; gD.fillRect(i * 85 + 6, j * 85 + 6, 74, 36); }
  gD.save(); gD.beginPath(); gD.arc(256, 256, 250, 0, 6.3); gD.arc(256, 256, 215, 0, 6.3, true); gD.clip(); for (let k = -20; k < 40; k++) { gD.fillStyle = k % 2 ? '#e8b92a' : '#1a1a1a'; gD.beginPath(); gD.moveTo(k * 28, 0); gD.lineTo(k * 28 + 28, 0); gD.lineTo(k * 28 + 28 - 512, 512); gD.lineTo(k * 28 - 512, 512); gD.fill(); } gD.restore();
  const tD = new THREE.CanvasTexture(cvD); tD.colorSpace = THREE.SRGBColorSpace;
  const convés = new THREE.Mesh(new THREE.CircleGeometry(1.78, 48), new THREE.MeshStandardMaterial({ map: tD, roughness: 0.5, metalness: 0.4 })); convés.rotation.x = -Math.PI / 2; convés.position.y = 0.325; convés.receiveShadow = true; G.add(convés);
  // parafusos hexagonais e LEDs de borda
  const leds = []; const ledGeo = new THREE.BoxGeometry(0.1, 0.05, 0.05);
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; const m = new THREE.Mesh(ledGeo, glowMat(i % 3 === 0 ? 0xffb030 : 0x36e6ff, 2)); m.position.set(Math.cos(a) * 2.14, 0.13, Math.sin(a) * 2.14); m.rotation.y = -a + Math.PI / 2; G.add(m); leds.push(m); }

  const baixo = new THREE.Mesh(new THREE.CircleGeometry(1.7, 40), new THREE.MeshBasicMaterial({ color: 0x7fe8ff, toneMapped: false, side: THREE.DoubleSide })); baixo.rotation.x = Math.PI / 2; baixo.position.y = -0.005; G.add(baixo);
  const jatoB = brilho('120,230,255', 6, 0.55); jatoB.position.y = -0.4; G.add(jatoB);
  // ---- assento do piloto (almofada de couro, encosto alto, apoios de braço)
  const assento = new THREE.Group(); assento.position.set(0, 0.325, -0.15); G.add(assento);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 0.22, 16), aco), assento).position.y = 0.11;
  add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), couro), assento).position.y = 0.3;
  const enc = add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.78, 0.12), couro), assento); enc.position.set(0, 0.72, -0.27); enc.rotation.x = -0.12;
  const apoioEnc = add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.14), couro), assento); apoioEnc.position.set(0, 1.18, -0.3);
  for (const sx of [-1, 1]) { add(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.42), aco), assento).position.set(sx * 0.3, 0.5, 0.0); add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), cromo), assento).position.set(sx * 0.3, 0.4, -0.15); }

  // ---- console: corpo, painel inclinado com tela, relógio, mostradores, interruptores, LEDs, alavanca
  const con = new THREE.Group(); con.position.set(0, 0.325, 0.72); G.add(con);
  add(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 0.55), aco), con).position.y = 0.275;
  const tampo = add(new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.05, 0.46), acoEscuro), con); tampo.position.set(0, 0.6, -0.02); tampo.rotation.x = -0.5;   // painel inclinado
  const cvT = document.createElement('canvas'); cvT.width = 512; cvT.height = 256; const gT = cvT.getContext('2d'); const tT = new THREE.CanvasTexture(cvT); tT.colorSpace = THREE.SRGBColorSpace;
  const telaM = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), new THREE.MeshBasicMaterial({ map: tT, toneMapped: false, side: THREE.DoubleSide })); telaM.scale.x = -1; telaM.position.set(0.12, 0.646, -0.012); telaM.rotation.x = -0.5 - Math.PI / 2; con.add(telaM);
  const moldura = add(new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.02, 0.48), cromo), con); moldura.position.set(0.12, 0.63, -0.012); moldura.rotation.x = -0.5; moldura.scale.set(1, 1, 0.9);
  moldura.position.y -= 0.004;
  let anoAtual = 2026;
  const tela = (ano, ativa = false, t = 0) => {
    anoAtual = ano;
    gT.fillStyle = '#031017'; gT.fillRect(0, 0, 512, 256);
    gT.strokeStyle = ativa ? '#5ff0ff' : '#1e6a78'; gT.lineWidth = 3; gT.strokeRect(6, 6, 500, 244);
    gT.fillStyle = ativa ? '#5ff0ff' : '#2a8a98'; gT.textAlign = 'center'; gT.font = 'bold 28px "DejaVu Sans Mono", monospace'; gT.fillText('MÁQUINA DO TEMPO', 256, 44);
    gT.font = 'bold 118px "DejaVu Sans Mono", monospace'; gT.fillText(String(Math.round(ano)), 256, 168);
    gT.font = '22px "DejaVu Sans Mono", monospace'; gT.fillStyle = ativa ? '#ffb030' : '#1e5a66'; gT.fillText(ativa ? 'SALTO TEMPORAL ATIVO' : 'PRONTA · ANO DE DESTINO', 256, 214);
    for (let i = 0; i < 20; i++) { const v = ativa ? (0.5 + 0.5 * Math.sin(t * 9 + i * 0.7)) : 0.15; gT.fillStyle = `rgba(95,240,255,${0.2 + 0.8 * v})`; gT.fillRect(24 + i * 23.6, 226, 16, 10 * v + 3); }
    tT.needsUpdate = true;
  };
  tela(2026, false);
  // relógio analógico grande (lado esquerdo do painel)
  const cvR = document.createElement('canvas'); cvR.width = cvR.height = 256; const gR = cvR.getContext('2d');
  gR.fillStyle = '#e8e2d0'; gR.beginPath(); gR.arc(128, 128, 124, 0, 6.3); gR.fill(); gR.strokeStyle = '#2a2418'; gR.lineWidth = 8; gR.stroke();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; gR.strokeStyle = '#2a2418'; gR.lineWidth = i % 3 ? 4 : 8; gR.beginPath(); gR.moveTo(128 + Math.cos(a) * 100, 128 + Math.sin(a) * 100); gR.lineTo(128 + Math.cos(a) * 116, 128 + Math.sin(a) * 116); gR.stroke(); }
  const tR = new THREE.CanvasTexture(cvR); tR.colorSpace = THREE.SRGBColorSpace;
  const relG = new THREE.Group(); relG.position.set(-0.52, 0.605, 0.0); relG.rotation.x = -0.5; con.add(relG);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 28), latao), relG).position.y = 0.0;
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.18, 32), new THREE.MeshBasicMaterial({ map: tR, toneMapped: false })); face.rotation.x = -Math.PI / 2; face.position.y = 0.034; relG.add(face);
  const hMin = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.004, 0.15), mat(0x1a1a1a, 0.5, 0.2)); hMin.geometry.translate(0, 0, 0.06); hMin.position.y = 0.04; relG.add(hMin);
  const hHora = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.004, 0.1), mat(0x1a1a1a, 0.5, 0.2)); hHora.geometry.translate(0, 0, 0.04); hHora.position.y = 0.042; relG.add(hHora);
  const relogio = ang => { hMin.rotation.y = -ang * 12; hHora.rotation.y = -ang; };
  // mostradores pequenos e interruptores
  const dials = [];
  for (let i = 0; i < 4; i++) {
    const dg = new THREE.Group(); dg.position.set(-0.2 + i * 0.0, 0, 0); con.add(dg); dg.position.set(-0.28 + i * 0.17, 0.605, 0.12 - i * 0.0); dg.rotation.x = -0.5;
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.04, 16), cromo), dg);
    const f = new THREE.Mesh(new THREE.CircleGeometry(0.048, 20), new THREE.MeshBasicMaterial({ color: 0x0c1a20 })); f.rotation.x = -Math.PI / 2; f.position.y = 0.0215; dg.add(f);
    const ag = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.003, 0.042), glowMat(i % 2 ? 0xff5040 : 0x5ff0ff, 2)); ag.geometry.translate(0, 0, 0.02); ag.position.y = 0.024; dg.add(ag); dials.push(ag);
  }
  const chaves = [];
  for (let i = 0; i < 5; i++) { const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.07, 6), cromo); ch.position.set(-0.28 + i * 0.1, 0.55, 0.0 + 0.22); ch.position.set(-0.3 + i * 0.1, 0.5 + 0.0, 0.27); ch.rotation.x = -0.5 + (i % 2 ? 0.7 : -0.3); con.add(ch); chaves.push(ch); }
  const ledsC = []; for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, 0.035), glowMat(i % 3 === 0 ? 0xff4040 : i % 3 === 1 ? 0x40ff80 : 0xffb030, 2)); m.position.set(0.58 - (i % 6) * 0.065, 0.5 + 0.0, 0.0); m.position.set(-0.05 + (i % 6) * 0.07, 0.575 + (i < 6 ? 0 : 0.0), 0.2 - (i < 6 ? 0 : 0.07)); m.position.y = 0.56 + (i < 6 ? 0 : 0.045); m.position.z = 0.0 + (i < 6 ? 0.2 : 0.2); m.position.z = 0.215 - (i < 6 ? 0 : 0); m.rotation.x = -0.5; con.add(m); ledsC.push(m); }
  ledsC.forEach((m, i) => { m.position.set(0.12 + (i % 6) * 0.07 - 0.17, 0.52 + Math.floor(i / 6) * 0.045 + 0.0, 0.26 - Math.floor(i / 6) * 0.0); });
  // alavanca (lado direito do console)
  const alavG = new THREE.Group(); alavG.position.set(0.68, 0.62, 0.05); con.add(alavG);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.07, 16), latao), alavG);
  const haste = add(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.5, 10), cromo), alavG); haste.position.y = 0.28;
  const bola = add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), mat(0xe03030, 0.35, 0.2, { emissive: 0x600808, emissiveIntensity: 0.6 })), alavG); bola.position.y = 0.56;
  alavG.rotation.x = -0.45;
  const alavanca = k => { alavG.rotation.x = -0.45 + 1.0 * k; };      // 0 = recuada, 1 = puxada

  // ---- reator de plasma atrás do assento: tubo de vidro, núcleo brilhante, bobinas de latão, tampas e cabos
  const reator = new THREE.Group(); reator.position.set(0, 0.325, -1.05); G.add(reator);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.46, 0.18, 20), acoEscuro), reator).position.y = 0.09;
  const vidro = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 1.5, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false })); vidro.position.y = 0.95; reator.add(vidro);
  const nucleoMat = new THREE.MeshStandardMaterial({ color: 0x103040, emissive: 0x36e6ff, emissiveIntensity: 1.5, roughness: 0.3 });
  const nucleo = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.35, 16), nucleoMat); nucleo.position.y = 0.95; reator.add(nucleo);
  const bolas = []; for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), nucleoMat); b.position.y = 0.4 + i * 0.35; reator.add(b); bolas.push(b); }
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.16, 20), latao), reator).position.y = 1.78;
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 0.3, 14), aco), reator).position.y = 1.98;
  for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.03, 8, 24), latao); c.rotation.x = Math.PI / 2; c.position.y = 0.3 + i * 0.3; c.castShadow = true; reator.add(c); }
  const luzNucleo = brilho('90,230,255', 2.2, 0.9); luzNucleo.position.y = 0.95; reator.add(luzNucleo);
  // cabos grossos do reator ao console
  const cabo = (pts, r = 0.025) => { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, r, 6, false), mat(0x14181f, 0.6, 0.2)); m.castShadow = true; G.add(m); return m; };
  cabo([V(0.2, 0.45, -1.0), V(0.5, 0.35, -0.6), V(0.8, 0.34, 0.1), V(0.7, 0.5, 0.5)]); cabo([V(-0.2, 0.45, -1.0), V(-0.55, 0.36, -0.5), V(-0.85, 0.34, 0.2), V(-0.75, 0.5, 0.55)], 0.03);

  // ---- pilares de bobina nas laterais (topo brilhante) e engrenagens de latão
  const pilares = [];
  for (const sx of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(sx * 1.55, 0.325, -0.3); G.add(p);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.15, 14), acoEscuro), p).position.y = 0.075;
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.5, 12), aco), p).position.y = 0.85;
    for (let i = 0; i < 4; i++) add(new THREE.Mesh(new THREE.CylinderGeometry(0.2 - i * 0.025, 0.2 - i * 0.025, 0.04, 16), latao), p).position.y = 0.35 + i * 0.3;
    const topo = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), glowMat(0xb06cff, 2.2)); topo.position.y = 1.7; p.add(topo);
    const b = brilho('190,120,255', 1.1, 0.9); b.position.y = 1.7; p.add(b);
    pilares.push({ g: p, topo, b });
  }
  const engrens = [];
  [[-1.25, 0.9, 0.2, 0.42, 14, 1], [-0.95, 1.2, 0.2, 0.28, 10, -1], [1.2, 0.8, 0.3, 0.38, 13, -1]].forEach(([x, y, z, R, n, sg]) => {
    const e = engrenagem(R, n, 0.06, latao); e.position.set(x, y, z); e.rotation.y = Math.PI / 2; G.add(e); engrens.push({ e, sg });
  });
  // antena parabólica giratória atrás
  const antena = new THREE.Group(); antena.position.set(0.9, 0.325, -1.5); G.add(antena);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.6, 8), cromo), antena).position.y = 0.8;
  const prato = new THREE.Group(); prato.position.y = 1.65; antena.add(prato);
  const disco = add(new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 10, 0, Math.PI * 2, 0, 0.9), mat(0xdfe6ee, 0.25, 0.6, { side: THREE.DoubleSide })), prato); disco.rotation.x = Math.PI / 2 - 0.3;
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.3, 6), cromo), prato).position.set(0, 0.0, 0.15);
  const ponta = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), glowMat(0xff3030, 3)); ponta.position.set(0, 0, 0.3); prato.add(ponta);
  // escapamentos traseiros
  for (const sx of [-1, 1]) { add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.5, 14), aco)).position.set(sx * 0.7, 0.55, -1.75); const e = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 14), glowMat(0xff9040, 2)); e.rotation.x = Math.PI / 2; e.position.set(sx * 0.7, 0.55, -2.02); G.add(e); }
  // faróis frontais
  const farol = []; for (const sx of [-1, 1]) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), glowMat(0xfff4d0, 2.2)); f.position.set(sx * 0.9, 0.34, 1.9); G.add(f); const b = brilho('255,244,208', 0.9, 0.8); b.position.copy(f.position); G.add(b); farol.push(b); }

  // ---- três anéis de giroscópio aninhados; cada um com blocos luminosos para o movimento ser legível
  const giro = new THREE.Group(); giro.position.set(0, 2.15, -0.15); G.add(giro);
  const aneis = [];
  const fazAnel = (R, tubo, cor, orient) => {
    const g = new THREE.Group();
    const t = new THREE.Mesh(new THREE.TorusGeometry(R, tubo, 12, 72), mat(0x59677c, 0.3, 0.7)); t.castShadow = true; g.add(t);
    const ln = new THREE.Mesh(new THREE.TorusGeometry(R, tubo * 0.35, 8, 72), glowMat(cor, 2.2)); ln.position.z = tubo * 0.6; g.add(ln);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const b = new THREE.Mesh(new THREE.BoxGeometry(tubo * 1.9, tubo * 1.9, tubo * 2.3), i % 2 ? mat(0xc9a24a, 0.3, 0.75) : glowMat(cor, 2.5)); b.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); b.rotation.z = a; g.add(b); }
    if (orient === 'h') g.rotation.x = Math.PI / 2; else if (orient === 'yz') g.rotation.y = Math.PI / 2;
    return g;
  };
  const A = new THREE.Group(), B = new THREE.Group(), C = new THREE.Group();
  A.add(fazAnel(1.95, 0.075, 0x36e6ff, 'xy')); B.add(fazAnel(1.68, 0.065, 0xff4fd8, 'h')); C.add(fazAnel(1.42, 0.055, 0xffb030, 'yz'));
  giro.add(A); A.add(B); B.add(C);
  // eixos que sustentam o anel externo (dois braços até o convés)
  for (const sx of [-1, 1]) { const braco = add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.7, 10), aco)); braco.position.set(sx * 1.95, 1.2, -0.15); braco.rotation.z = 0; }
  const girar = f => { A.rotation.y = f; B.rotation.x = f * 1.37 + 0.6; C.rotation.z = f * 1.91 + 1.1; };
  girar(0);

  // ---- luz própria (ciano) e descargas elétricas entre os pilares e os anéis
  const luz = new THREE.PointLight(0x62e6ff, 0, 11, 1.7); luz.position.set(0, 1.6, 0.3); G.add(luz);
  const descMat = new THREE.MeshBasicMaterial({ color: 0xd8c0ff, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const descG = new THREE.Group(); G.add(descG); let descPas = -1;
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const descargas = (t, k) => {
    const passo = Math.floor(t * 18);
    if (passo === descPas && descG.userData.k === (k > 0.02)) return; descPas = passo; descG.userData.k = k > 0.02;
    while (descG.children.length) { const c = descG.children.pop(); c.geometry.dispose(); }
    if (k < 0.02) return;
    const n = 1 + Math.floor(k * 4);
    for (let j = 0; j < n; j++) {
      const sx = (j % 2) ? 1 : -1, a = V(sx * 1.55, 0.325 + 1.7, -0.3);
      const ang = hash(passo * 7 + j) * Math.PI * 2, R = 1.5 + 0.4 * hash(passo + j * 3);
      const b = V(Math.cos(ang) * R * 0.9, 2.15 + Math.sin(ang) * R * 0.9, -0.15 + Math.sin(ang * 2) * 0.5);
      const pts = [a]; const seg = 7;
      for (let s = 1; s < seg; s++) { const u = s / seg, p = a.clone().lerp(b, u); const o = (1 - Math.abs(u - 0.5) * 1.2) * 0.28; p.x += (hash(passo * 13 + j * 5 + s) - 0.5) * o; p.y += (hash(passo * 17 + j * 7 + s) - 0.5) * o; p.z += (hash(passo * 19 + j * 3 + s) - 0.5) * o; pts.push(p); }
      pts.push(b);
      descG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 18, 0.014 + 0.012 * k, 4, false), descMat));
    }
  };

  const energia = (k, t = 0) => {
    const pulso = 0.75 + 0.25 * Math.sin(t * 8);
    nucleoMat.emissiveIntensity = 0.5 + 1.6 * k * pulso; luzNucleo.material.opacity = 0.35 + 0.65 * k; luzNucleo.scale.setScalar(1.2 + 1.4 * k * pulso);
    leds.forEach((m, i) => { m.material.emissiveIntensity = 0.8 + 2.6 * k * (0.5 + 0.5 * Math.sin(t * 10 - i * 0.8)); });
    ledsC.forEach((m, i) => { m.material.emissiveIntensity = 0.5 + 2.5 * k * (0.5 + 0.5 * Math.sin(t * 7 + i * 1.7)); });
    pilares.forEach((p, i) => { p.topo.material.emissiveIntensity = 1.0 + 3 * k * (0.6 + 0.4 * Math.sin(t * 13 + i * 2)); p.b.material.opacity = 0.4 + 0.6 * k; p.b.scale.setScalar(0.9 + 1.0 * k); });
    rimLuz.material.emissiveIntensity = 1.2 + 2.8 * k; luz.intensity = 0.4 + 2.2 * k * pulso;
    bolas.forEach((b, i) => { b.position.y = 0.4 + ((i * 0.35 + t * (0.3 + 1.6 * k)) % 1.4); });
    dials.forEach((d, i) => { d.rotation.y = -0.9 + 1.8 * (0.5 + 0.5 * Math.sin(t * (1 + 5 * k) + i * 2)) * (0.2 + 0.8 * k); });
    engrens.forEach(({ e, sg }, i) => { e.rotation.z = sg * (t * (0.4 + 3 * k) + i); });
    prato.rotation.y = t * (0.8 + 4 * k); ponta.material.emissiveIntensity = 1 + 2.5 * (0.5 + 0.5 * Math.sin(t * 6));
  };
  energia(0, 0);

  return {
    grupo: G, girar, energia, tela, relogio, alavanca, descargas, luz, assento: V(0, 0.325, -0.15),
    topoAlavanca: (v = V()) => { v.set(0, 0.56, 0); alavG.localToWorld(v); return v; },
    leds, farol,
    // aplica um mapa de ambiente (PMREM) só nos materiais da máquina: o metal deixa de ficar escuro sem afetar o resto da cena
    ambiente(env, k = 1) { G.traverse(o => { if (o.isMesh && o.material && o.material.isMeshStandardMaterial && o.material.metalness > 0.3) { o.material.envMap = env; o.material.envMapIntensity = k; o.material.needsUpdate = true; } }); },
  };
}
