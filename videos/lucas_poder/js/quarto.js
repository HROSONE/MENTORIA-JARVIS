// O QUARTO do Lucas (gancho e final): piso de tábuas com relevo, paredes pintadas com rodapé, janela com chuva escorrendo e céu de tempestade com relâmpago,
// cama, escrivaninha com computador, estante de gibis, tapete empoeirado (sem pegadas), calendário de parede (contador dos dois anos), luminária de teto.
// Medidas reais em metros: piso em y = 0; o quarto vai de x -1,9 a 1,9 e de z -2,2 a 2,2; a janela fica na parede do fundo (z = -2,2).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvasTex, normalDeAltura, sombras, brilho } from './motor.js';
import { mulberry32, clamp, ruido } from './util.js';
import { materialPH, modeloPH, hdriPH } from '../../biblioteca3d/polyhaven/ph.js';

export const QX = 1.9, QZ = 2.2, QH = 2.65;
const mat = (cor, r = 0.7, m = 0, extra = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: r, metalness: m, ...extra });

// ------------------------------------------------------------------------------------------------ texturas
function texPiso() {
  const R = mulberry32(17), W = 2048, H = 2048, tabuas = 8, largT = W / tabuas;           // 8 tábuas de 15 cm em 1,2 m (repete)
  const cor = canvasTex(W, H, g => {
    for (let i = 0; i < tabuas; i++) {
      let y = 0; const x0 = i * largT;
      while (y < H) {
        const comp = 500 + R() * 900, base = [118 + R() * 30, 78 + R() * 22, 46 + R() * 16];
        const gr = g.createLinearGradient(x0, y, x0 + largT, y + comp); gr.addColorStop(0, `rgb(${base[0]},${base[1]},${base[2]})`); gr.addColorStop(1, `rgb(${base[0] * 0.86},${base[1] * 0.84},${base[2] * 0.82})`);
        g.fillStyle = gr; g.fillRect(x0, y, largT, comp);
        for (let k = 0; k < 70; k++) {                                                      // veios
          const xx = x0 + R() * largT, a = 0.04 + R() * 0.10; g.strokeStyle = `rgba(${R() < 0.5 ? '60,34,18' : '170,120,80'},${a})`; g.lineWidth = 0.6 + R() * 1.8;
          g.beginPath(); g.moveTo(xx, y); for (let s = 0; s <= 10; s++) g.lineTo(xx + Math.sin(s * 0.7 + k) * (2 + R() * 4), y + comp * s / 10); g.stroke();
        }
        if (R() < 0.35) { const nx = x0 + 20 + R() * (largT - 40), ny = y + 60 + R() * (comp - 120); for (let k = 0; k < 6; k++) { g.strokeStyle = `rgba(55,30,15,${0.25 - k * 0.03})`; g.lineWidth = 1.5; g.beginPath(); g.ellipse(nx, ny, 4 + k * 3, 10 + k * 7, 0, 0, Math.PI * 2); g.stroke(); } }
        g.fillStyle = 'rgba(20,10,5,0.85)'; g.fillRect(x0, y + comp - 2, largT, 3);           // topo da tábua
        y += comp;
      }
      g.fillStyle = 'rgba(20,10,5,0.9)'; g.fillRect(x0, 0, 3, H);                         // fresta entre tábuas
    }
    for (let k = 0; k < 2600; k++) { g.fillStyle = `rgba(${R() < 0.5 ? '255,240,220' : '30,20,10'},${0.03 + R() * 0.05})`; g.fillRect(R() * W, R() * H, 1 + R() * 3, 1 + R() * 3); }   // desgaste
  }, { repete: true });
  const alt = canvasTex(512, 512, g => {
    g.fillStyle = '#888'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 8; i++) { g.fillStyle = '#222'; g.fillRect(i * 64, 0, 2, 512); }
    const R2 = mulberry32(3); for (let k = 0; k < 400; k++) { g.fillStyle = `rgba(${R2() < 0.5 ? 255 : 0},${R2() < 0.5 ? 255 : 0},${R2() < 0.5 ? 255 : 0},0.05)`; g.fillRect(R2() * 512, R2() * 512, 2, 20 + R2() * 60); }
  }, { repete: true, srgb: false });
  return { cor, normal: normalDeAltura(alt, 3) };
}
function texParede() {
  const R = mulberry32(5);
  const cor = canvasTex(1024, 1024, g => {
    g.fillStyle = '#8fa3a6'; g.fillRect(0, 0, 1024, 1024);
    for (let k = 0; k < 9000; k++) { const v = R(); g.fillStyle = `rgba(${v < 0.5 ? '255,255,255' : '40,50,55'},${0.015 + R() * 0.03})`; g.fillRect(R() * 1024, R() * 1024, 2 + R() * 6, 2 + R() * 6); }
    for (let k = 0; k < 10; k++) { const x = R() * 1024; const gr = g.createLinearGradient(x, 0, x + 40, 0); gr.addColorStop(0, 'rgba(60,70,70,0)'); gr.addColorStop(0.5, 'rgba(60,70,70,0.05)'); gr.addColorStop(1, 'rgba(60,70,70,0)'); g.fillStyle = gr; g.fillRect(x, 0, 40, 1024); }
  }, { repete: true });
  const alt = canvasTex(256, 256, g => { g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256); const R2 = mulberry32(9); for (let k = 0; k < 3000; k++) { const v = Math.floor(100 + R2() * 60); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(R2() * 256, R2() * 256, 2, 2); } }, { repete: true, srgb: false });
  return { cor, normal: normalDeAltura(alt, 1.2) };
}
function texTapete() {
  return canvasTex(1024, 1024, g => {
    const R = mulberry32(21);
    g.fillStyle = '#7a3b34'; g.fillRect(0, 0, 1024, 1024);
    g.strokeStyle = '#d9b77a'; g.lineWidth = 26; g.strokeRect(60, 60, 904, 904); g.strokeStyle = '#2f4a62'; g.lineWidth = 14; g.strokeRect(110, 110, 804, 804);
    g.save(); g.translate(512, 512); for (let k = 0; k < 8; k++) { g.rotate(Math.PI / 4); g.fillStyle = k % 2 ? '#c99a52' : '#2f4a62'; g.beginPath(); g.ellipse(0, 150, 46, 130, 0, 0, Math.PI * 2); g.fill(); } g.restore();
    g.fillStyle = '#d9b77a'; g.beginPath(); g.arc(512, 512, 70, 0, Math.PI * 2); g.fill();
    for (let k = 0; k < 40000; k++) { g.fillStyle = `rgba(${R() < 0.5 ? '255,230,200' : '20,10,10'},${0.05 + R() * 0.08})`; g.fillRect(R() * 1024, R() * 1024, 1.5, 3); }      // fibras
    g.fillStyle = 'rgba(190,180,165,0.30)'; g.fillRect(0, 0, 1024, 1024);                                                                                          // poeira por igual: ninguém pisa
    for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(210,200,185,${0.08 + R() * 0.12})`; g.beginPath(); g.arc(R() * 1024, R() * 1024, 2 + R() * 10, 0, Math.PI * 2); g.fill(); }
  });
}
function texCalendario(mes) {
  const nomes = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
  return canvasTex(384, 512, g => {
    g.fillStyle = '#f4efe4'; g.fillRect(0, 0, 384, 512);
    g.fillStyle = '#2f4a62'; g.fillRect(0, 0, 384, 180);
    g.fillStyle = '#e7c46a'; g.beginPath(); g.arc(300, 70, 42, 0, Math.PI * 2); g.fill();                                     // ilustração: sol sobre montanhas
    g.fillStyle = '#4f7a5a'; g.beginPath(); g.moveTo(0, 180); g.lineTo(110, 70); g.lineTo(210, 180); g.fill(); g.fillStyle = '#3b6047'; g.beginPath(); g.moveTo(130, 180); g.lineTo(250, 90); g.lineTo(384, 180); g.fill();
    g.fillStyle = '#1b1b1b'; g.font = '900 40px "DejaVu Sans", Arial, sans-serif'; g.textAlign = 'center'; g.fillText(nomes[mes % 12], 192, 230);
    g.font = '700 22px "DejaVu Sans", Arial, sans-serif'; g.fillStyle = '#8a1f1f'; g.fillText(String(2024 + Math.floor(mes / 12)), 192, 258);
    g.font = '600 20px "DejaVu Sans", Arial, sans-serif'; g.fillStyle = '#333';
    for (let d = 0; d < 30; d++) g.fillText(String(d + 1), 40 + (d % 7) * 51, 300 + Math.floor(d / 7) * 44);
  });
}
function texGibi(titulo = 'HRYZ', cor = '#d8322a') {
  return canvasTex(512, 768, g => {
    g.fillStyle = cor; g.fillRect(0, 0, 512, 768);
    g.fillStyle = '#ffde3b'; g.fillRect(0, 0, 512, 150);
    g.fillStyle = '#1a1a1a'; g.font = '900 120px "DejaVu Sans", Arial Black, sans-serif'; g.textAlign = 'center'; g.fillText(titulo, 256, 125);
    g.font = '700 30px "DejaVu Sans", Arial, sans-serif'; g.fillText('COMICS · Nº 47', 256, 190);
    const gr = g.createRadialGradient(256, 470, 10, 256, 470, 260); gr.addColorStop(0, '#9ff0ff'); gr.addColorStop(1, '#1f5fb8'); g.fillStyle = gr; g.fillRect(30, 220, 452, 500);
    g.fillStyle = '#122';                                                                                                        // herói voando (silhueta)
    g.beginPath(); g.ellipse(256, 420, 40, 40, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(200, 470); g.lineTo(312, 470); g.lineTo(340, 640); g.lineTo(172, 640); g.fill();
    g.strokeStyle = '#122'; g.lineWidth = 30; g.lineCap = 'round'; g.beginPath(); g.moveTo(210, 480); g.lineTo(120, 330); g.moveTo(302, 480); g.lineTo(392, 330); g.stroke();
  });
}
function texCeu() {                                                                                    // céu de tempestade visto pela janela (grande, fora do quarto)
  return canvasTex(1024, 1024, g => {
    const gr = g.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, '#1d2633'); gr.addColorStop(0.55, '#4a5a6b'); gr.addColorStop(1, '#2a3038'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 1024);
    const R = mulberry32(31);
    for (let k = 0; k < 160; k++) { const x = R() * 1024, y = R() * 620, r = 40 + R() * 140; const c = g.createRadialGradient(x, y, 0, x, y, r); const v = 30 + R() * 50; c.addColorStop(0, `rgba(${v},${v + 8},${v + 18},0.35)`); c.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = c; g.fillRect(0, 0, 1024, 1024); }
    g.fillStyle = '#10161c';                                                                         // copas de árvores e telhados ao longe
    for (let x = 0; x < 1024; x += 6) { const h = 640 + 60 * Math.sin(x * 0.013) + 40 * Math.sin(x * 0.041 + 2) + 25 * Math.sin(x * 0.11); g.fillRect(x, h, 6, 1024 - h); }
    g.fillStyle = '#0c1116'; g.fillRect(120, 700, 260, 324); g.beginPath(); g.moveTo(100, 700); g.lineTo(250, 610); g.lineTo(400, 700); g.fill(); g.fillRect(620, 720, 300, 304);
    g.fillStyle = 'rgba(255,214,140,0.85)'; g.fillRect(180, 760, 30, 40); g.fillRect(700, 780, 26, 36);
  });
}
// gotas escorrendo no vidro: mapa de normal/opacidade animado por deslocamento de UV (o desenho é fixo, a textura corre)
function texChuvaVidro() {
  const R = mulberry32(44);
  return canvasTex(512, 1024, g => {
    g.clearRect(0, 0, 512, 1024);
    for (let k = 0; k < 900; k++) { const x = R() * 512, y = R() * 1024, r = 1 + R() * 3.5; g.fillStyle = `rgba(220,235,255,${0.25 + R() * 0.35})`; g.beginPath(); g.ellipse(x, y, r, r * 1.2, 0, 0, Math.PI * 2); g.fill(); }
    for (let k = 0; k < 70; k++) { const x = R() * 512, y = R() * 1024, l = 60 + R() * 220; g.strokeStyle = `rgba(220,235,255,${0.18 + R() * 0.25})`; g.lineWidth = 1.5 + R() * 2.5; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + (R() - 0.5) * 12, y + l * 0.3, x + (R() - 0.5) * 12, y + l * 0.7, x + (R() - 0.5) * 8, y + l); g.stroke(); }
  }, { repete: true });
}

// ------------------------------------------------------------------------------------------------ construção
export async function construirQuarto(pai, renderer) {
  const G = new THREE.Group(); G.name = 'quarto'; pai.add(G);
  const mPiso = materialPH('wood_floor_worn', { rep: [QX * 2 / 1.6, QZ * 2 / 1.6], normal: 1.0, extra: { color: 0xe8d8c8 } });
  const geoChao = new THREE.PlaneGeometry(QX * 2, QZ * 2); geoChao.setAttribute('uv2', geoChao.attributes.uv);
  const chao = new THREE.Mesh(geoChao, mPiso);
  chao.rotation.x = -Math.PI / 2; chao.receiveShadow = true; G.add(chao);
  const mPar = materialPH('painted_plaster_wall', { rep: [2.2, 1.6], normal: 0.8, ao: false, extra: { color: 0xa6bcc0 } });
  // paredes (a do fundo tem o vão da janela: 4 pedaços)
  const JX0 = -0.95, JX1 = 0.35, JY0 = 0.95, JY1 = 2.15;                                       // vão da janela
  const parede = (w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mPar); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; G.add(m); return m; };
  parede(JX0 + QX, QH, (-QX + JX0) / 2, QH / 2, -QZ, 0); parede(QX - JX1, QH, (JX1 + QX) / 2, QH / 2, -QZ, 0);
  parede(JX1 - JX0, JY0, (JX0 + JX1) / 2, JY0 / 2, -QZ, 0); parede(JX1 - JX0, QH - JY1, (JX0 + JX1) / 2, (QH + JY1) / 2, -QZ, 0);
  parede(QZ * 2, QH, -QX, QH / 2, 0, Math.PI / 2); parede(QZ * 2, QH, QX, QH / 2, 0, -Math.PI / 2); parede(QX * 2, QH, 0, QH / 2, QZ, Math.PI);
  const teto = new THREE.Mesh(new THREE.PlaneGeometry(QX * 2, QZ * 2), mat(0xe9e6df, 0.95)); teto.rotation.x = Math.PI / 2; teto.position.y = QH; G.add(teto);
  const mRod = mat(0xf2efe8, 0.5);                                                               // rodapé
  for (const [w, x, z, ry] of [[QX * 2, 0, -QZ + 0.008, 0], [QZ * 2, -QX + 0.008, 0, Math.PI / 2], [QZ * 2, QX - 0.008, 0, -Math.PI / 2], [QX * 2, 0, QZ - 0.008, Math.PI]]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(w, 0.10, 0.016), mRod); r.position.set(x, 0.05, z); r.rotation.y = ry; r.castShadow = r.receiveShadow = true; G.add(r);
  }
  // janela: marco, folhas, vidro com chuva, peitoril; lá fora, o céu de tempestade
  const mMarco = mat(0xeeeae2, 0.45);
  const caixa = (w, h, d, x, y, z, m = mMarco) => { const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.3), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; G.add(b); return b; };
  const jx = (JX0 + JX1) / 2, jy = (JY0 + JY1) / 2, jw = JX1 - JX0, jh = JY1 - JY0;
  caixa(jw + 0.12, 0.06, 0.16, jx, JY1 + 0.03, -QZ + 0.02); caixa(jw + 0.12, 0.06, 0.16, jx, JY0 - 0.03, -QZ + 0.02); caixa(0.06, jh, 0.16, JX0 - 0.03, jy, -QZ + 0.02); caixa(0.06, jh, 0.16, JX1 + 0.03, jy, -QZ + 0.02);
  caixa(0.045, jh, 0.06, jx, jy, -QZ); caixa(jw, 0.045, 0.06, jx, jy + 0.18, -QZ);
  caixa(jw + 0.30, 0.035, 0.24, jx, JY0 - 0.075, -QZ + 0.09);                                       // peitoril de dentro
  const chuvaTex = texChuvaVidro(); chuvaTex.repeat.set(1.4, 1.3);
  const vidro = new THREE.Mesh(new THREE.PlaneGeometry(jw, jh), new THREE.MeshPhysicalMaterial({ color: 0xbfd2e6, roughness: 0.06, transmission: 0, transparent: true, opacity: 0.16, map: chuvaTex, depthWrite: false }));
  vidro.position.set(jx, jy, -QZ - 0.01); vidro.renderOrder = 5; G.add(vidro);
  const hd = await hdriPH('approaching_storm', renderer);
  const ceuMat = new THREE.MeshBasicMaterial({ map: hd.fundo, fog: false, color: 0x5a6470, side: THREE.BackSide });
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(40, 48, 24), ceuMat); ceu.rotation.y = 2.2; ceu.position.set(jx, 1.0, -QZ); G.add(ceu);
  // cortinas (tecido ondulado), presas de lado
  const mCort = mat(0x3e5a7a, 0.95, 0, { side: THREE.DoubleSide });
  for (const [x0, s] of [[JX0 - 0.32, 1], [JX1 + 0.32, -1]]) {
    const geo = new THREE.PlaneGeometry(0.42, 2.3, 24, 30), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, 0.035 * Math.sin(x * 38 + y * 0.6) + 0.01 * Math.sin(y * 9)); p.setX(i, x * (0.85 + 0.15 * (y + 1.15) / 2.3)); }
    geo.computeVertexNormals(); const c = new THREE.Mesh(geo, mCort); c.position.set(x0, 1.38, -QZ + 0.07); c.castShadow = c.receiveShadow = true; G.add(c);
    const varao = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.0, 10), mat(0x2a2a2a, 0.4, 0.8)); varao.rotation.z = Math.PI / 2; varao.position.set(x0 + s * 0.15, 2.55, -QZ + 0.08); G.add(varao);
  }
  // cama encostada na parede da esquerda (x = -QX): estrado, colchão, lençol, cobertor amassado, travesseiro
  const mMad = mat(0x6b4a33, 0.55);
  caixa(0.98, 0.30, 2.02, -QX + 0.52, 0.22, -0.65, mMad);                                         // estrado
  caixa(1.04, 0.95, 0.06, -QX + 0.52, 0.48, -1.68, mMad);                                         // cabeceira
  caixa(0.92, 0.18, 1.94, -QX + 0.52, 0.46, -0.65, mat(0xe8e4dc, 0.9));                           // colchão
  const cob = new THREE.PlaneGeometry(1.0, 1.5, 40, 60), pc = cob.attributes.position;               // cobertor amassado
  for (let i = 0; i < pc.count; i++) { const x = pc.getX(i), y = pc.getY(i); const borda = Math.max(0, Math.abs(x) - 0.44) * 6; pc.setZ(i, 0.04 * Math.sin(x * 14 + y * 5) * Math.sin(y * 7 + 1) + 0.025 * Math.sin(x * 31 - y * 11) - borda * 0.12); }
  cob.computeVertexNormals(); const cobM = new THREE.Mesh(cob, materialPH('fabric_pattern_07', { res: '1k', rep: [2, 3], ao: false, extra: { side: THREE.DoubleSide } })); cobM.rotation.x = -Math.PI / 2; cobM.position.set(-QX + 0.52, 0.575, -0.30); cobM.castShadow = cobM.receiveShadow = true; G.add(cobM);
  const trav = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.13, 0.40, 4, 0.06), mat(0xf1eee8, 0.95)); trav.position.set(-QX + 0.52, 0.62, -1.40); trav.rotation.z = 0.05; trav.castShadow = trav.receiveShadow = true; G.add(trav);
  // escrivaninha na parede da direita com computador desligado, cadeira, luminária
  caixa(0.62, 0.035, 1.25, QX - 0.32, 0.74, -0.9, mat(0xd8d2c6, 0.5)); for (const dz of [-0.55, 0.55]) caixa(0.58, 0.72, 0.035, QX - 0.32, 0.36, -0.9 + dz, mat(0xd8d2c6, 0.5));
  const mPreto = mat(0x111214, 0.35, 0.2);
  caixa(0.05, 0.36, 0.60, QX - 0.18, 1.02, -0.9, mPreto); caixa(0.05, 0.16, 0.04, QX - 0.16, 0.82, -0.9, mPreto); caixa(0.18, 0.012, 0.22, QX - 0.16, 0.762, -0.9, mPreto);
  caixa(0.16, 0.02, 0.44, QX - 0.48, 0.768, -0.9, mat(0x2a2c30, 0.6));                               // teclado
  // estante gasta (Poly Haven) com gibis e uma bola; criado-mudo com despertador; almofadas na cama; luminária de mesa; cadeira
  const estante = await modeloPH('wooden_bookshelf_worn'); estante.position.set(1.18, 0, -QZ + 0.30); estante.scale.setScalar(0.92); G.add(estante);
  const R = mulberry32(8), cores = [0xd8322a, 0x2f6fd0, 0xf2c230, 0x3a9a5a, 0x8a3fb8, 0xe0782a, 0x1d1d1d, 0xf2f2f2];
  for (const y of [0.52, 0.98]) { let x = 0.62; while (x < 1.55) { const w = 0.012 + R() * 0.02, h = 0.22 + R() * 0.07; const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.17), mat(cores[Math.floor(R() * cores.length)], 0.6)); b.position.set(x + w / 2, y + h / 2, -QZ + 0.30); b.rotation.z = (R() - 0.5) * 0.06; b.castShadow = true; G.add(b); x += w + 0.002; } }
  const bola = new THREE.Mesh(new THREE.SphereGeometry(0.11, 32, 20), mat(0xe8e8e8, 0.5)); bola.position.set(0.95, 1.46, -QZ + 0.30); bola.castShadow = true; G.add(bola);
  const cm = await modeloPH('painted_wooden_nightstand'); cm.position.set(-QX + 1.33, 0, -1.85); G.add(cm);
  const relogio = await modeloPH('alarm_clock_01'); relogio.position.set(-QX + 1.30, 0.616, -1.82); relogio.rotation.y = 0.5; G.add(relogio);
  const alm = await modeloPH('throw_pillows_01'); alm.position.set(-QX + 0.52, 0.55, -1.42); alm.scale.setScalar(0.85); G.add(alm);
  const lmesa = await modeloPH('desk_lamp_arm_01'); lmesa.position.set(QX - 0.30, 0.758, -1.38); lmesa.rotation.y = -2.2; lmesa.scale.setScalar(0.8); G.add(lmesa);
  const cad = await modeloPH('painted_wooden_chair_01'); cad.position.set(QX - 0.78, 0, -0.75); cad.rotation.y = 1.9; G.add(cad);
  // tapete no meio do quarto (empoeirado e liso: ninguém pisa nele)
  const tap = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.25), mat(0xffffff, 1.0, 0, { map: texTapete() })); tap.rotation.x = -Math.PI / 2; tap.position.set(0.15, 0.006, 0.55); tap.receiveShadow = true; G.add(tap);
  // calendário de parede (contador dos dois anos): parede da direita
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.40), mat(0xffffff, 0.8, 0, { map: texCalendario(10) })); cal.position.set(QX - 0.005, 1.55, 0.15); cal.rotation.y = -Math.PI / 2; G.add(cal);
  cal.userData.mes = m => { cal.material.map = texCalendario(m); };
  // pôster na parede da esquerda
  const pos = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.72), mat(0xffffff, 0.7, 0, { map: texGibi('HRYZ', '#24324a') })); pos.position.set(-QX + 0.005, 1.6, 0.55); pos.rotation.y = Math.PI / 2; G.add(pos);
  // luminária de teto
  const lum = await modeloPH('modern_ceiling_lamp_01'); lum.position.set(0, QH - 1.173, 0.2); G.add(lum);
  const lumBrilho = brilho('255,214,160', 0.6, 0); lumBrilho.position.set(0, QH - 0.85, 0.2); G.add(lumBrilho); lum.material = { emissiveIntensity: 0 };
  const lampada = new THREE.PointLight(0xffc98a, 0, 7, 1.6); lampada.position.set(0, QH - 0.22, 0.2); lampada.castShadow = true; lampada.shadow.mapSize.set(1024, 1024); lampada.shadow.bias = -0.002; G.add(lampada);

  // ---- luz: tempestade de tarde entrando pela janela (fria, suave) + preenchimento + relâmpago
  const hemi = new THREE.HemisphereLight(0xa9bdd4, 0x4a382a, 1.25); G.add(hemi);
  const janela = new THREE.DirectionalLight(0xbcd0e8, 3.2); janela.position.set(jx - 0.8, 3.6, -QZ - 4.2); janela.target.position.set(0.2, 0, 0.6); janela.castShadow = true;
  janela.shadow.mapSize.set(2048, 2048); Object.assign(janela.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 14 }); janela.shadow.bias = -0.0006; janela.shadow.normalBias = 0.02; janela.shadow.radius = 6;
  G.add(janela, janela.target);
  const preench = new THREE.PointLight(0x8ea3c0, 2.2, 8, 2); preench.position.set(1.0, 1.6, 2.0); G.add(preench);
  const raio = new THREE.SpotLight(0xdfe8ff, 0, 18, 0.75, 0.6, 1.2); raio.position.set(jx - 0.5, 3.4, -QZ - 3.0); raio.target.position.set(0.2, 0, 0.8); raio.castShadow = true; raio.shadow.mapSize.set(1024, 1024); raio.shadow.bias = -0.001; G.add(raio, raio.target);

  sombras(G, true, true); chao.castShadow = false; teto.castShadow = false; vidro.castShadow = false; ceu.castShadow = false; tap.castShadow = false;
  return {
    g: G, cal, lampada, lum, raio, ambiente: hd.ambiente, janela, hemi, ceu, ceuMat, chuvaTex, preench,
    /** clima: t (s), relampago 0..1 (força extra), luzAcesa 0..1 */
    atualizar(t, { relampago = 0, luzAcesa = 0 } = {}) {
      chuvaTex.offset.y = -t * 0.35; chuvaTex.offset.x = 0.02 * Math.sin(t * 0.7);
      const r = clamp(relampago);
      raio.intensity = 120 * r; ceuMat.color.setRGB(0.35 + 2.5 * r, 0.39 + 2.5 * r, 0.44 + 2.5 * r); janela.intensity = 3.2 + 3 * r; hemi.intensity = 1.25 + 0.8 * r;
      lampada.intensity = 9 * luzAcesa; lumBrilho.material.opacity = 0.9 * luzAcesa; lumBrilho.visible = luzAcesa > 0.01;
    },
  };
}

/** relâmpago: 0..1 no instante t, com tremulação real (dois ou três clarões curtos) a partir de cada início em `inicios` */
export function relampago(t, inicios) {
  let v = 0;
  for (const t0 of inicios) {
    const u = t - t0; if (u < 0 || u > 0.9) continue;
    v = Math.max(v, Math.exp(-u * 9) + 0.7 * Math.exp(-Math.abs(u - 0.12) * 40) + 0.45 * Math.exp(-Math.abs(u - 0.26) * 30));
  }
  return clamp(v);
}

// ------------------------------------------------------------------------------------------------ objetos que flutuam e caem
export function criarLata() {
  const g = new THREE.Group();
  const tex = canvasTex(512, 256, (c) => {
    const gr = c.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#c4151f'); gr.addColorStop(1, '#8e0d14'); c.fillStyle = gr; c.fillRect(0, 0, 512, 256);
    c.strokeStyle = '#ffffff'; c.lineWidth = 16; c.beginPath(); for (let x = 0; x <= 512; x += 8) c.lineTo(x, 150 + 30 * Math.sin(x / 512 * Math.PI * 4)); c.stroke();
    c.fillStyle = '#fff'; c.font = '900 64px "DejaVu Sans", Arial Black, sans-serif'; c.textAlign = 'center'; c.fillText('GUARANÁ', 256, 100);
  });
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.11, 40, 1, true), mat(0xffffff, 0.28, 0.6, { map: tex }));
  const alu = mat(0xc9cdd2, 0.25, 1.0);
  const topo = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.033, 0.012, 40), alu); topo.position.y = 0.061;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.027, 0.012, 40), alu); base.position.y = -0.061;
  const canudo = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.17, 10), mat(0xf2f2f2, 0.4)); canudo.position.set(0.006, 0.12, 0); canudo.rotation.z = -0.15;
  g.add(corpo, topo, base, canudo); sombras(g); g.userData.canudo = canudo; return g;
}
export function criarGibi() {
  const g = new THREE.Group();
  const capa = mat(0xffffff, 0.55, 0, { map: texGibi() }), miolo = mat(0xf2ede0, 0.9);
  const folha = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.006, 0.26), [miolo, miolo, capa, miolo, miolo, miolo]);
  g.add(folha); sombras(g); return g;
}
