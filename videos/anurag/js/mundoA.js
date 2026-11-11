// Mundo A: a rua do bairro à noite com a casa do homem (fachada própria, com porta, campainha, luz da varanda, garagem) e vizinhos do kit.
import * as THREE from 'three';
import { Kit } from '../../biblioteca3d/cidade/kit.js';
import { mundos, canvasTex, brilho, sombras, clonarGLB } from './motor.js';
import { mulberry32 } from './util.js';

const M = (cor, rug = 0.9, extra = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: rug, ...extra });
const caixa = (w, h, d, mat, x, y, z, pai) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; pai.add(m); return m; };

// posições importantes (a rua corre ao longo de X; a casa fica ao norte, z < 0)
export const POS = {
  paredeZ: -12.0, portaX: -3.2, campainha: new THREE.Vector3(-2.35, 1.30, -11.97), varandaZ: -10.6,
  garagemX: 4.6, calcadaNorte: -4.7, meioRua: 0,
};

function texturaGaragem() {
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#ddd8cd'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(80,76,68,0.55)'; g.lineWidth = 2;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); }
    g.fillStyle = 'rgba(40,46,60,0.9)'; for (let i = 0; i < 4; i++) g.fillRect(14 + i * 60, 8, 44, 14);
  }, { aniso: 8 });
}
function texturaPorta() {
  return canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = '#4b2f20'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(20,10,5,0.7)'; g.lineWidth = 3;
    for (const [x, y, ww, hh] of [[16, 18, 44, 70], [68, 18, 44, 70], [16, 100, 44, 130], [68, 100, 44, 130]]) g.strokeRect(x, y, ww, hh);
    g.strokeStyle = 'rgba(160,110,70,0.35)'; for (const [x, y, ww, hh] of [[19, 21, 38, 64], [71, 21, 38, 64], [19, 103, 38, 124], [71, 103, 38, 124]]) g.strokeRect(x, y, ww, hh);
  }, { aniso: 8 });
}
function texturaJanela() {
  return canvasTex(128, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffd89a'); gr.addColorStop(1, '#f2b46a');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,240,210,0.25)'; for (let i = 0; i < 9; i++) g.fillRect(i * 15, 0, 6, h);       // cortina
    g.fillStyle = 'rgba(70,40,20,0.35)'; g.fillRect(20, 70, 50, 58);                                         // um móvel
  });
}

export async function construirA() {
  const A = mundos.A;
  const kit = await Kit.carregar('../biblioteca3d/cidade/');
  const dados = { kit, luzes: {}, portaPivo: null, lampadaVaranda: null, janelas: [] };

  // ---- ruas e gramados do kit
  const trabalhos = [];
  for (let gx = -6; gx <= 6; gx++) {
    trabalhos.push(kit.ladrilho('rua-reta', gx, 0, 0, ['E', 'W']));
    trabalhos.push(kit.ladrilho('chao-grama', gx, -1));
    trabalhos.push(kit.ladrilho('chao-grama', gx, 1));
  }
  (await Promise.all(trabalhos)).forEach(o => A.add(o));
  const mato = new THREE.Mesh(new THREE.PlaneGeometry(500, 300), M(0x16241a, 1));
  mato.rotation.x = -Math.PI / 2; mato.position.set(0, 0.10, -150 - 18); mato.receiveShadow = true; A.add(mato);
  const mato2 = mato.clone(); mato2.position.set(0, 0.10, 150 + 18); A.add(mato2);

  // ---- casa: fachada própria
  const casa = new THREE.Group(); A.add(casa);
  const zp = POS.paredeZ, prof = 9.0;
  const reboco = M(0xd8c6a4, 0.95), telhaM = M(0x2a2622, 0.9), branco = M(0xe8e4dc, 0.7);
  caixa(17, 3.0, prof, reboco, 0, 1.5 + 0.15, zp - prof / 2, casa);
  // telhado de duas águas (prisma triangular), cumeeira paralela à rua
  const forma = new THREE.Shape(); forma.moveTo(-5.2, 0); forma.lineTo(5.2, 0); forma.lineTo(0, 2.1); forma.closePath();
  const geoT = new THREE.ExtrudeGeometry(forma, { depth: 19.0, bevelEnabled: false });
  geoT.rotateY(Math.PI / 2); geoT.translate(-9.5, 0, 0);
  const tel = new THREE.Mesh(geoT, telhaM); tel.position.set(0, 3.15, zp - prof / 2 + 0.2); tel.scale.set(1, 1, 1); tel.castShadow = true; tel.receiveShadow = true; casa.add(tel);
  // beiral
  caixa(19, 0.12, 1.2, telhaM, 0, 3.12, zp + 0.55, casa);

  // varanda: piso, degraus, teto e pilares
  caixa(2.8, 0.30, 1.5, M(0x9b968c), POS.portaX, 0.30, zp + 0.75, casa);
  caixa(3.4, 0.16, 1.9, M(0x8d8880), POS.portaX, 0.08 + 0.15, zp + 1.05, casa);
  caixa(3.2, 0.14, 1.7, telhaM, POS.portaX, 2.75, zp + 0.85, casa);
  for (const sg of [-1, 1]) caixa(0.14, 2.45, 0.14, branco, POS.portaX + sg * 1.45, 1.40, zp + 1.55, casa);
  // porta (pivô para abrir) e batente
  const pivo = new THREE.Group(); pivo.position.set(POS.portaX - 0.55, 0.45, zp + 0.01); casa.add(pivo); dados.portaPivo = pivo;
  const folha = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.15, 0.07), M(0xffffff, 0.55, { map: texturaPorta() })); folha.position.set(0.55, 1.075, 0.0); folha.castShadow = true; pivo.add(folha);
  const macaneta = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), M(0xc9a24a, 0.3, { metalness: 0.9 })); macaneta.position.set(0.98, 1.05, 0.07); pivo.add(macaneta);
  caixa(1.3, 0.1, 0.16, branco, POS.portaX, 2.62, zp + 0.03, casa);
  caixa(0.10, 2.2, 0.16, branco, POS.portaX - 0.66, 1.55, zp + 0.03, casa);
  caixa(0.10, 2.2, 0.16, branco, POS.portaX + 0.66, 1.55, zp + 0.03, casa);
  // vão iluminado atrás da porta (corredor)
  const vao = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.2), new THREE.MeshBasicMaterial({ color: 0xffd9a0 })); vao.position.set(POS.portaX, 1.55, zp - 0.5); casa.add(vao); dados.vao = vao;
  vao.visible = false;
  // campainha: placa preta com botão que acende, e a marca discreta no canto
  const placa = caixa(0.075, 0.15, 0.025, M(0x15161a, 0.4, { metalness: 0.5 }), POS.campainha.x, POS.campainha.y, zp + 0.012, casa);
  dados.botao = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.016, 20), new THREE.MeshStandardMaterial({ color: 0xffb25a, emissive: 0xff8a2a, emissiveIntensity: 1.2, roughness: 0.3 }));
  dados.botao.rotation.x = Math.PI / 2; dados.botao.position.set(POS.campainha.x, POS.campainha.y + 0.025, zp + 0.034); casa.add(dados.botao);
  const gl = brilho('255,170,80', 0.28, 0.9); gl.position.copy(dados.botao.position).add(new THREE.Vector3(0, 0, 0.03)); casa.add(gl); dados.botaoBrilho = gl;
  // plaquinha com a marca (diegética): "HRYZ" gravado na placa da campainha
  const nome = canvasTex(128, 64, (g, w, h) => { g.fillStyle = '#15161a'; g.fillRect(0, 0, w, h); g.fillStyle = '#c9a24a'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText('HRYZ', w / 2, 28); g.font = '11px sans-serif'; g.fillText('ANIMATION', w / 2, 50); }, { aniso: 8 });
  const etq = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.033), new THREE.MeshBasicMaterial({ map: nome })); etq.position.set(POS.campainha.x, POS.campainha.y - 0.05, zp + 0.026); casa.add(etq);

  // lâmpada da varanda
  const lamp = new THREE.Group(); lamp.position.set(POS.portaX + 1.05, 2.15, zp + 0.14); casa.add(lamp);
  const globo = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), new THREE.MeshStandardMaterial({ color: 0xffe6b0, emissive: 0xffc468, emissiveIntensity: 2.2 })); lamp.add(globo);
  caixa(0.09, 0.2, 0.08, M(0x1b1b1d), 0, 0.0, -0.08, lamp);
  const bl = brilho('255,196,110', 1.2, 0.8); lamp.add(bl); dados.brilhoVaranda = bl;
  const luzV = new THREE.PointLight(0xffc27a, 55, 14, 1.8); luzV.position.set(POS.portaX + 0.9, 2.3, zp + 1.0); luzV.castShadow = false; casa.add(luzV); dados.luzVaranda = luzV;
  dados.globoVaranda = globo;

  // janelas com luz quente e moldura
  const tex = texturaJanela();
  const janela = (x, larg, alt, y) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(larg, alt), new THREE.MeshBasicMaterial({ map: tex })); p.position.set(x, y, zp + 0.03); casa.add(p);
    caixa(larg + 0.2, 0.1, 0.12, branco, x, y + alt / 2 + 0.05, zp + 0.05, casa); caixa(larg + 0.2, 0.1, 0.14, branco, x, y - alt / 2 - 0.05, zp + 0.06, casa);
    caixa(0.1, alt, 0.12, branco, x - larg / 2 - 0.05, y, zp + 0.05, casa); caixa(0.1, alt, 0.12, branco, x + larg / 2 + 0.05, y, zp + 0.05, casa);
    caixa(0.06, alt, 0.1, branco, x, y, zp + 0.06, casa);
    dados.janelas.push(p);
  };
  janela(-7.0, 2.2, 1.35, 1.75); janela(0.2, 1.3, 1.1, 1.8);
  // garagem
  const gar = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.3, 0.1), new THREE.MeshStandardMaterial({ map: texturaGaragem(), roughness: 0.7, color: 0xffffff })); gar.position.set(POS.garagemX, 1.3, zp + 0.05); gar.castShadow = true; casa.add(gar);
  caixa(4.7, 0.12, 0.2, branco, POS.garagemX, 2.5, zp + 0.1, casa);
  // calçada de entrada, caminho e entrada de carros
  const concreto = M(0x8a867f, 1);
  caixa(5.0, 0.04, 8.2, concreto, POS.garagemX, 0.17, zp + 4.1 - 0.0, A);
  caixa(1.1, 0.04, 5.8, concreto, POS.portaX + 0.2, 0.17, zp + 3.0, A);
  // cerca-viva baixa e arbustos junto à casa
  for (const x of [-8.6, -5.4, -0.8, 1.6, 7.4]) { const a = await clonarGLB('../biblioteca3d/cidade/natureza/arbusto.glb'); a.position.set(x, 0.15, zp + 0.7); a.scale.setScalar(0.9); sombras(a); A.add(a); }
  // caixa de correio
  const cx = new THREE.Group(); cx.position.set(8.0, 0.15, -6.4); A.add(cx);
  caixa(0.12, 1.0, 0.12, M(0x3b2d22), 0, 0.5, 0, cx); caixa(0.22, 0.2, 0.46, M(0x1d2a45, 0.5), 0, 1.1, 0.0, cx);

  // ---- vizinhos e árvores (kit)
  const col = async (nome, x, z, giro, esc = 1) => { const o = await kit.peca(nome); o.position.set(x, 0.15, z); o.rotation.y = giro; o.scale.setScalar(esc); A.add(o); return o; };
  const viz = [
    await col('casa-moderna', -26, -12, 0), await col('casa-colonial', 24, -12, 0), await col('casa-simples', 40, -12, 0), await col('casa-sobrado', -42, -12, 0),
    await col('casa-simples', -22, 12, Math.PI), await col('casa-sobrado', -4, 12, Math.PI), await col('casa-moderna', 14, 12, Math.PI), await col('casa-colonial', 32, 12, Math.PI),
  ];
  viz.forEach(v => kit.luzEstado(v, true));
  const arvs = [['arvore-frondosa', -14, -8, 0.3, 1.0], ['arvore-redonda', 12.5, -8.4, 1.2, 0.95], ['arvore-frondosa', 30, -7.5, 2.0, 1.0], ['arvore-redonda', -32, -7.6, 0.6, 1.0],
                ['arvore-ipe-amarelo', -8, 7.8, 0.4, 0.9], ['arvore-frondosa', 8.5, 7.9, 1.8, 1.0], ['arvore-cipreste', 22, 7.7, 0, 1.0], ['arvore-frondosa', -30, 7.9, 0.9, 1.0]];
  for (const [n, x, z, g, e] of arvs) { const t = await col(n, x, z, g, e); sombras(t); }

  // ---- postes de luz com lâmpada de sódio (luz real só nos mais próximos da ação)
  const posteDefs = [[-16, -4.7, 0], [9.5, -4.7, 0], [34, -4.7, 0], [-4, 4.7, Math.PI], [20, 4.7, Math.PI], [-28, 4.7, Math.PI]];
  dados.postes = [];
  for (const [x, z, g] of posteDefs) {
    const p = await kit.prop('poste-luz', 0, 0, 0, 0); p.position.set(x, 0.15, z); p.rotation.y = g; kit.luzEstado(p, true); A.add(p); dados.postes.push(p);
  }
  for (const [i, [x, z]] of [[0, [-16, -4.7]], [1, [9.5, -4.7]], [3, [-4, 4.7]]]) {
    const luzes = kit.luzesDe(dados.postes[i]);
    for (const l of luzes) { const pl = new THREE.PointLight(0xffb85e, 95, 30, 1.7); pl.position.copy(l.pos); A.add(pl); }
    const bg = brilho('255,190,100', 2.2, 0.85); bg.position.copy(luzes[0] ? luzes[0].pos : new THREE.Vector3(x, 5.5, z)); A.add(bg);
  }
  // placa de rua com a marca (diegética)
  const placaRua = await kit.prop('placa-rua-hryz', 0, 0, 0, 0); placaRua.position.set(15.5, 0.15, -4.9); placaRua.rotation.y = 0; A.add(placaRua); sombras(placaRua);

  // ---- luz ambiente do mundo A
  const hemi = new THREE.HemisphereLight(0x6f86c4, 0x1c1710, 0.85); A.add(hemi);
  const lua = new THREE.DirectionalLight(0x9fb4ff, 1.1); lua.position.set(-14, 22, 12); lua.target.position.set(0, 0, -6);
  lua.castShadow = true; lua.shadow.mapSize.set(1024, 1024); Object.assign(lua.shadow.camera, { left: -16, right: 16, top: 14, bottom: -14, near: 1, far: 70 }); lua.shadow.bias = -0.0004; lua.shadow.normalBias = 0.04;
  A.add(lua); A.add(lua.target); dados.lua = lua;
  dados.hemi = hemi;
  return dados;
}
