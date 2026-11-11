// A frente de guerra: terreno, guarita de sacos de areia, ruínas ao fundo, ninho do atirador, mesa dos comprimidos, céu com hora do dia, sol/lua e lanterna.
import * as THREE from 'three';
import { brilho, canvasTex } from './motor.js';
import { Lote, M } from './lote.js';
import * as T from './texturas.js';
import * as X from './tex2.js';
import { mulberry32, clamp, lerp } from './util.js';

export const POS = { guarita: [0, 0, 0], ninho: [150, 0, 0], mesa: [-150, 0, 0] };
const C = c => new THREE.Color(c);

export async function construirF(mundo) {
  const F = mundo;
  const d = { fogos: [] };
  const raiz = new THREE.Group(); raiz.name = 'frente'; F.add(raiz); d.raiz = raiz;

  // ---------------------------------------------------------------- terreno e crateras
  const terra = X.texTerra(); terra.repeat.set(220, 220);
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ map: terra, roughness: 1, color: 0x8a8a8a })); chao.rotation.x = -Math.PI / 2; chao.position.set(50, 0, -170); chao.receiveShadow = true; raiz.add(chao);
  const r = mulberry32(21);
  const matCrat = M(0x2b241c, 1);
  for (let i = 0; i < 46; i++) {
    const x = (r() - 0.5) * 300 + 40, z = -r() * 90 + 12, e = 1.5 + r() * 4;
    if (Math.abs(x) < 7 && z > -8 && z < 12) continue;
    if (Math.abs(x - 150) < 9 && z > -8) continue;
    const c = new THREE.Mesh(new THREE.CircleGeometry(e, 20), matCrat); c.rotation.x = -Math.PI / 2; c.position.set(x, 0.02, z); c.receiveShadow = true; raiz.add(c);
    const ar = new THREE.Mesh(new THREE.RingGeometry(e, e * 1.35, 20), M(0x6b5d4a, 1)); ar.rotation.x = -Math.PI / 2; ar.position.set(x, 0.03, z); raiz.add(ar);
  }

  // ---------------------------------------------------------------- sacos de areia (parede em "tijolo corrido")
  const sacos = ['#9a8c6a', '#8a7e5e', '#a39574'].map(c => M(0xffffff, 1, { map: X.texSaco(c) }));
  const madeira = M(0xffffff, 0.8, { map: T.texMadeira('#7a6244', '#3a2c18', '#a68a5e') });
  const madEsc = M(0xffffff, 0.85, { map: T.texMadeira('#4b3a24', '#241a0e', '#6c5434') });
  const chapa = M(0xffffff, 0.6, { map: X.texChapa(), metalness: 0.3 });
  const metal = M(0x3a3f44, 0.5, { metalness: 0.6 });
  const rr = mulberry32(5);
  function paredeSacos(L, x0, z0, x1, z1, linhas, ox = 0, oz = 0, oy = 0) {
    const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz), ang = Math.atan2(dx, dz);
    const w = 0.46, h = 0.17, p = 0.28;
    for (let row = 0; row < linhas; row++) {
      const off = (row % 2) * w / 2;
      for (let s = off; s < len - 0.05; s += w) {
        const k = Math.min(s + w / 2, len), cx = x0 + dx * (k / len) + ox, cz = z0 + dz * (k / len) + oz;
        const m = sacos[Math.floor(rr() * 3)];
        L.saco(w * (1.0 + rr() * 0.10), h * (1.05 + rr() * 0.15), p * (1.1 + rr() * 0.15), m, cx, h / 2 + row * h * 0.90 + oy, cz, { ry: ang + (rr() - 0.5) * 0.14, rz: (rr() - 0.5) * 0.07 });
      }
    }
  }
  function guarita(L, ox, oz) {
    paredeSacos(L, -1.45, -1.55, 1.45, -1.55, 8, ox, oz);                 // fundo
    paredeSacos(L, -1.40, -1.40, -1.40, 0.35, 7, ox, oz);                 // lado esquerdo
    paredeSacos(L, 1.40, -1.40, 1.40, 0.35, 7, ox, oz);                   // lado direito
    paredeSacos(L, -1.40, 0.55, -0.62, 0.55, 3, ox, oz);                  // frente baixa (abertura no meio)
    paredeSacos(L, 0.62, 0.55, 1.40, 0.55, 3, ox, oz);
    L.caixa(2.9, 0.08, 2.15, madeira, ox, 0.04, oz - 0.55, { uv: 1.0 });                                   // assoalho de tábuas
    for (const [px, pz] of [[-1.38, 0.52], [1.38, 0.52], [-1.38, -1.52], [1.38, -1.52]]) L.caixa(0.11, 2.25, 0.11, madEsc, ox + px, 1.12, oz + pz);
    L.caixa(3.3, 0.06, 2.5, chapa, ox, 2.27, oz - 0.5, { rx: -0.10, uv: 1.2 });                           // telhado de chapa (inclinado para trás)
    L.caixa(3.3, 0.14, 0.12, madEsc, ox, 2.18, oz + 0.58);                                                 // viga da frente
    L.caixa(0.66, 0.46, 0.44, madeira, ox, 0.31, oz - 1.12, { uv: 0.8 });                                  // caixote-banco (encostado nos sacos do fundo)
    L.caixa(0.6, 0.40, 0.34, M(0x4a5030, 0.7), ox + 0.95, 0.28, oz - 0.95);                                // caixa de munição verde
    L.caixa(0.30, 0.30, 0.30, madeira, ox - 0.95, 0.23, oz - 0.95, { ry: 0.4 });
  }
  const Lg = new Lote(raiz);
  guarita(Lg, 0, 0);
  // arame farpado à frente da guarita
  const arame = M(0x8a8f92, 0.4, { metalness: 0.8 });
  for (let x = -26; x <= 26; x += 2.6) {
    Lg.caixa(0.1, 1.5, 0.1, madEsc, x, 0.75, 9.0 + Math.sin(x * 0.7) * 0.2);
    for (const hy of [0.45, 0.85, 1.25]) Lg.cilindro(0.012, 0.012, 2.7, arame, x + 1.3, hy + 0.04 * Math.sin(x), 9.0 + Math.sin(x * 0.7) * 0.2, { seg: 5, rz: Math.PI / 2 });
    for (let k = 0; k < 4; k++) Lg.esfera(0.045, arame, x + 0.3 + k * 0.6, 0.85, 9.0 + Math.sin(x * 0.7) * 0.2, { seg: 5 });
  }
  // caixas e restos de combate espalhados
  for (let i = 0; i < 26; i++) {
    const x = (r() - 0.5) * 60, z = r() * 10 + 1.5;
    if (Math.abs(x) < 3 && z < 5) continue;
    Lg.caixa(0.3 + r() * 0.5, 0.15 + r() * 0.3, 0.3 + r() * 0.5, r() < 0.5 ? madEsc : metal, x, 0.12, z, { ry: r() * 3, rz: (r() - 0.5) * 0.5 });
  }
  Lg.fechar();
  // placa "POSTO 7" e caixote com a marca do canal (estêncil na frente do banco)
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.34), new THREE.MeshStandardMaterial({ map: X.texPlaca('POSTO 7'), roughness: 0.8 })); placa.position.set(-0.8, 2.0, 0.66); raiz.add(placa);
  const est = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.36), new THREE.MeshStandardMaterial({ map: X.texCaixaEstencil('HRYZ ANIMATION', 'MUNIÇÃO · CX 7'), roughness: 0.9 })); est.position.set(0.95, 0.30, -0.775); raiz.add(est);
  const est2 = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.36), new THREE.MeshStandardMaterial({ map: X.texCaixaEstencil('HRYZ ANIMATION', 'POSTO 7'), roughness: 0.9 })); est2.position.set(0, 0.31, -0.896); raiz.add(est2); d.est2 = est2;
  // lanterna pendurada
  const lan = new THREE.Group(); lan.position.set(0.55, 1.95, -0.25); raiz.add(lan);
  const vidro = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.2, 12), new THREE.MeshStandardMaterial({ color: 0xffe3a8, emissive: 0xffa84a, emissiveIntensity: 2.2 })); lan.add(vidro);
  const topo = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.07, 12), metal); topo.position.y = 0.13; lan.add(topo);
  const gl = brilho('255,190,110', 1.4, 0.8); lan.add(gl); d.lanternaGlow = gl;
  d.lanterna = new THREE.PointLight(0xffb86a, 7, 9, 1.6); d.lanterna.position.set(0.55, 1.9, -0.25); raiz.add(d.lanterna);

  // ---------------------------------------------------------------- ruínas ao fundo (silhuetas com brasas dentro)
  const Lr = new THREE.Group(); raiz.add(Lr);
  for (let i = 0; i < 20; i++) {
    const x = -190 + i * 24 + (r() - 0.5) * 12, z = -78 - r() * 40, w = 12 + r() * 14, h = 10 + r() * 22, tx = X.texRuina(1 + (i % 4));
    if (x > 138 && x < 232) continue;                                                                     // corredor de visada do ninho até a torre inimiga
    const mat = new THREE.MeshStandardMaterial({ map: tx.map, emissiveMap: tx.emi, emissive: 0xffffff, emissiveIntensity: 1.2, roughness: 1 });
    const lado = M(0x2c2a28, 1);
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 14), [lado, lado, lado, lado, mat, lado]); b.position.set(x, h / 2, z); b.castShadow = false; Lr.add(b);
    for (let k = 0; k < 3; k++) { const q = new THREE.Mesh(new THREE.BoxGeometry(2 + r() * 5, 1.5 + r() * 4, 3 + r() * 6), lado); q.position.set(x + (r() - 0.5) * w * 0.8, h + 0.5, z + (r() - 0.5) * 6); q.rotation.set((r() - 0.5) * 0.6, r() * 3, (r() - 0.5) * 0.6); Lr.add(q); }
  }
  // torre do atirador inimigo (ao fundo do ninho) com uma janela escura
  const torre = new THREE.Group(); torre.position.set(190, 0, -165); raiz.add(torre);
  const tm = M(0x3a3734, 1, { emissive: 0x1a1816, emissiveIntensity: 1.0 });
  const corpoT = new THREE.Mesh(new THREE.BoxGeometry(9, 34, 9), tm); corpoT.position.y = 17; torre.add(corpoT);
  const topoT = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 5), tm); topoT.position.set(1.4, 35.5, 0); topoT.rotation.z = 0.15; torre.add(topoT);
  for (const [jx, jy] of [[-2.8, 27], [2.8, 27], [-2.8, 21], [0, 21], [2.8, 21], [-2.8, 15], [0, 15], [2.8, 15], [-2.8, 9], [2.8, 9]]) { const jj = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.6), new THREE.MeshBasicMaterial({ color: 0x0b0a09 })); jj.position.set(jx, jy, 4.52); torre.add(jj); }
  const bordaT = M(0x2a2826, 1); for (const jy of [27.0]) { const mb = new THREE.Mesh(new THREE.BoxGeometry(2.9, 2.5, 0.12), bordaT); mb.position.set(0, jy, 4.50); torre.add(mb); }
  const janT = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.0), new THREE.MeshBasicMaterial({ color: 0x050403 })); janT.position.set(0, 27, 4.55); torre.add(janT); d.janelaTorre = janT.position.clone().add(torre.position);
  d.clarao = brilho('255,230,170', 5, 0); d.clarao.position.copy(d.janelaTorre).add(new THREE.Vector3(0, 0, 0.5)); raiz.add(d.clarao);

  // ---------------------------------------------------------------- ninho do atirador (ruína com parapeito de sacos)
  const [nx, , nz] = POS.ninho;
  const Ln = new Lote(raiz);
  const concreto = M(0xffffff, 1, { map: T.texConcreto('#7a7874') });
  Ln.caixa(8.0, 0.35, 6.5, concreto, nx, 0.0, nz + 1.4, { uv: 1.5 });                                         // laje do último andar
  Ln.caixa(0.5, 3.4, 6.0, concreto, nx - 3.8, 1.7, nz + 1.4, { uv: 1.5 });                                    // parede esquerda
  Ln.caixa(0.5, 2.2, 6.0, concreto, nx + 3.8, 1.1, nz + 1.4, { uv: 1.5 });                                    // parede direita (quebrada)
  Ln.caixa(2.5, 3.0, 0.5, concreto, nx - 2.5, 1.5, nz + 4.3, { uv: 1.5 });                                    // parede de trás (aberta ao meio)
  for (let i = 0; i < 14; i++) { const bx = nx + (r() - 0.5) * 7, bz = nz + 1.4 + (r() - 0.5) * 5, w_ = 0.3 + r() * 0.7, h_ = 0.2 + r() * 0.4, d_ = 0.3 + r() * 0.7, a_ = r() * 3, b_ = (r() - 0.5) * 0.7; if (Math.abs(bx - nx - 0.6) < 2.6 && bz > nz - 2.0 && bz < nz + 2.8) continue; Ln.caixa(w_, h_, d_, concreto, bx, 0.3, bz, { ry: a_, rz: b_ }); }
  paredeSacos(Ln, nx - 2.0, nz - 1.6, nx + 1.6, nz - 1.6, 1, 0, 0, 0.175);
  paredeSacos(Ln, nx - 2.0, nz - 1.6, nx - 2.0, nz - 0.2, 2, 0, 0, 0.175);
  Ln.fechar();
  d.ninhoPos = new THREE.Vector3(nx, 0, nz);

  // ---------------------------------------------------------------- mesa dos comprimidos (microcenário)
  const [mx, , mz] = POS.mesa;
  const Lm = new Lote(raiz);
  Lm.caixa(1.6, 0.85, 1.0, madeira, mx, 0.425, mz, { uv: 0.9 });
  Lm.caixa(1.7, 0.06, 1.1, madEsc, mx, 0.88, mz, { uv: 0.9 });
  paredeSacos(Lm, mx - 2.2, mz - 1.6, mx + 2.2, mz - 1.6, 7);
  Lm.fechar();
  const pano = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.95), M(0x4b5232, 1)); pano.rotation.x = -Math.PI / 2; pano.position.set(mx, 0.915, mz); pano.receiveShadow = true; raiz.add(pano);
  d.mesaTopo = new THREE.Vector3(mx, 0.92, mz);
  d.mesaLuz = new THREE.PointLight(0xffb870, 6, 6, 1.7); d.mesaLuz.position.set(mx - 0.6, 1.9, mz + 0.7); raiz.add(d.mesaLuz);

  // ---------------------------------------------------------------- céu, sol e lua, luzes
  const cvs = document.createElement('canvas'); cvs.width = 512; cvs.height = 256; const g2 = cvs.getContext('2d');
  const texCeu = new THREE.CanvasTexture(cvs); texCeu.colorSpace = THREE.SRGBColorSpace;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(420, 24, 16), new THREE.MeshBasicMaterial({ map: texCeu, side: THREE.BackSide, fog: false, depthWrite: false })); dome.renderOrder = -10; dome.frustumCulled = false; F.add(dome); d.dome = dome;
  // estrelas: cúpula separada (desenhada uma vez, nítida); a opacidade acompanha a noite
  const cvE = document.createElement('canvas'); cvE.width = 2048; cvE.height = 1024; const ge = cvE.getContext('2d');
  { const q = mulberry32(77); for (let i = 0; i < 1100; i++) { const y = Math.pow(q(), 1.5) * 470; ge.fillStyle = `rgba(255,255,${225 + (q() * 30 | 0)},${0.25 + q() * 0.75})`; const sz = q() < 0.05 ? 1.8 : 0.6 + q() * 0.7; ge.beginPath(); ge.arc(q() * 2048, y, sz, 0, 6.3); ge.fill(); } }
  const texE = new THREE.CanvasTexture(cvE); texE.colorSpace = THREE.SRGBColorSpace;
  const domeE = new THREE.Mesh(new THREE.SphereGeometry(415, 32, 20), new THREE.MeshBasicMaterial({ map: texE, side: THREE.BackSide, transparent: true, depthWrite: false, fog: false, opacity: 0 })); domeE.renderOrder = -9; domeE.frustumCulled = false; F.add(domeE); d.domeE = domeE;
  const sunS = brilho('255,214,150', 60, 1), moonS = brilho('190,205,255', 28, 1); F.add(sunS, moonS);
  const sunD = new THREE.Mesh(new THREE.CircleGeometry(7, 28), new THREE.MeshBasicMaterial({ color: 0xfff1c8, fog: false })); F.add(sunD);
  const moonD = new THREE.Mesh(new THREE.CircleGeometry(5, 28), new THREE.MeshBasicMaterial({ color: 0xe8eeff, fog: false })); F.add(moonD);
  d.hemi = new THREE.HemisphereLight(0x6c7fb0, 0x2a2018, 0.5); F.add(d.hemi);
  d.rostoLuz = new THREE.PointLight(0xff9a58, 0, 5, 1.7); F.add(d.rostoLuz);                    // luz de apoio no rosto (pulsa com as explosões)
  d.sol = new THREE.DirectionalLight(0xfff0d8, 1.0); d.sol.castShadow = true; d.sol.shadow.mapSize.set(1024, 1024);
  Object.assign(d.sol.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 90 }); d.sol.shadow.bias = -0.0005; d.sol.shadow.normalBias = 0.04; d.sol.shadow.radius = 3;
  F.add(d.sol, d.sol.target);
  d.focar = (x, z) => { d.cx = x; d.cz = z; d.sol.target.position.set(x, 0.8, z); d.sol.target.updateMatrixWorld(); };
  d.focar(0, -0.5);
  const keys = [[0, '#04060f', '#0b1226'], [4.5, '#0a1024', '#1a2444'], [6.2, '#2b3a68', '#e58a5a'], [8, '#5f85bd', '#d6e2ee'], [12, '#5e8fd0', '#cfe3f5'], [16.5, '#5a82c2', '#e1dcc8'], [18.0, '#252d58', '#e2784c'], [19.6, '#0c1330', '#3a2a48'], [24, '#04060f', '#0b1226']];
  d.hora = (h, { fogo = 0, scale = 1 } = {}) => {
    h = ((h % 24) + 24) % 24;
    const elev = Math.sin((h - 6) / 12 * Math.PI), sol = Math.max(0, elev);
    const alva = Math.max(0, 1 - Math.abs(elev) * 3.2) * (h > 4.5 && h < 19.5 ? 1 : 0);
    const aS = (h - 6) / 12 * Math.PI, aL = aS + Math.PI;
    const cx = d.cx ?? 0, cz = d.cz ?? 0;
    // sol/lua como luz: de frente e do lado, nunca tapada pela guarita
    d.sol.position.set(cx + Math.cos(aS) * 20 * -1, 14 + Math.max(0.12, elev) * 24, cz + 16);
    const noite = 1 - clamp(sol * 3.5);
    d.sol.color.copy(C(0xffe9cf).lerp(C(0xff9a58), alva).lerp(C(0x8aa0e0), noite));
    d.sol.intensity = 2.5 * Math.pow(sol, 0.7) + 1.25 * noite;
    d.hemi.intensity = 0.55 + 0.7 * sol; d.hemi.color.copy(C(0x41558f).lerp(C(0xbcd0ea), sol)); d.hemi.groundColor.set(0x2a2018);
    d.lanterna.intensity = 4.2 * noite; d.lanternaGlow.material.opacity = 0.8 * noite;
    // céu
    let i = 0; while (i < keys.length - 2 && h > keys[i + 1][0]) i++;
    const a = keys[i], b = keys[i + 1], k = clamp((h - a[0]) / (b[0] - a[0]));
    const mix = (c1, c2) => '#' + C(c1).lerp(C(c2), k).getHexString();
    const gr = g2.createLinearGradient(0, 0, 0, 256); const topo_ = C(mix(a[1], b[1]));
    gr.addColorStop(0, '#' + topo_.getHexString()); gr.addColorStop(0.22, '#' + topo_.getHexString());
    const hz = C(mix(a[2], b[2])).lerp(C(0xc2481c), fogo * 0.34 * (0.4 + 0.6 * noite));
    gr.addColorStop(0.38, '#' + topo_.clone().lerp(hz, 0.06).getHexString()); gr.addColorStop(0.46, '#' + topo_.clone().lerp(hz, 0.45).getHexString());
    gr.addColorStop(0.5, '#' + hz.getHexString()); gr.addColorStop(1, '#' + hz.getHexString());
    g2.fillStyle = gr; g2.fillRect(0, 0, 512, 256);
    d.domeE.material.opacity = 0.95 * noite;
    texCeu.needsUpdate = true;
    const pS = new THREE.Vector3(cx - Math.cos(aS) * 200, 8 + Math.sin(aS) * 150, cz - 330), pL = new THREE.Vector3(cx - Math.cos(aL) * 200, 8 + Math.sin(aL) * 150, cz - 330);
    sunS.position.copy(pS); sunD.position.copy(pS); moonS.position.copy(pL); moonD.position.copy(pL);
    const vs = clamp((pS.y + 6) / 22), vl = clamp((pL.y + 6) / 22);
    sunS.material.opacity = 0.9 * vs; sunD.visible = vs > 0.02; moonS.material.opacity = 0.7 * vl; moonD.visible = vl > 0.02; sunS.material.color.set(alva > 0.2 ? 0xffb070 : 0xffeed0);
    sunD.lookAt(cx, 5, cz + 50); moonD.lookAt(cx, 5, cz + 50);
    d.fundo = hz;
    return { sol, noite, alva };
  };
  d.hora(1.0, { fogo: 1 });
  return d;
}
