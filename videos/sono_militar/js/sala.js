// Cenários internos do Short: a sala de aula da Escola de Pré-Voo (1942, quadro de giz, carteiras, janelas) e o quarto à noite (cama, janela com luar, criado-mudo com cronômetro).
import * as THREE from 'three';
import { brilho, canvasTex } from './motor.js';
import { Lote, M } from './lote.js';
import * as T from './texturas.js';
import * as X from './tex2.js';
import * as PR from './props.js';
import { mulberry32, clamp, lerp } from './util.js';

export const POS_S = { sala: [0, 0, 0], quarto: [100, 0, 0] };
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

function reboco(base = '#cbc2a8', seed = 3) {
  return canvasTex(256, 256, (g, w, h) => {
    const r = mulberry32(seed);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,250,235' : '70,60,40'},${0.02 + r() * 0.05})`; const s = 8 + r() * 40; g.beginPath(); g.ellipse(r() * w, r() * h, s, s * (0.4 + r() * 0.5), r() * 3, 0, 6.3); g.fill(); }
  }, { repete: true });
}

// ------------------------------------------------------------------------------------------------ sala de aula
export function construirSala(mundo) {
  const g = new THREE.Group(); g.name = 'sala'; mundo.add(g);
  const d = { g };
  const X0 = -4.2, X1 = 4.2, Z0 = -5.6, Z1 = 4.0, H = 3.5;
  const rb = reboco(); rb.repeat.set(3, 1.4);
  const mReb = M(0xffffff, 0.95, { map: rb });
  const tPiso = T.texMadeira('#7d5532', '#43281a', '#a97d4e'); tPiso.repeat.set(7, 8);
  const mPiso = M(0xffffff, 0.7, { map: tPiso });
  const mLambri = M(0xffffff, 0.8, { map: T.texMadeira('#4b3624', '#24160c', '#6d5035') });
  const escura = M(0x2a1d12, 0.8), ferro = M(0x23262a, 0.5, { metalness: 0.6 });
  const mTeto = M(0xd9d3c0, 1);

  const piso = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), mPiso); piso.rotation.x = -Math.PI / 2; piso.position.set(0, 0, (Z0 + Z1) / 2); piso.receiveShadow = true; g.add(piso);
  const teto = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), mTeto); teto.rotation.x = Math.PI / 2; teto.position.set(0, H, (Z0 + Z1) / 2); g.add(teto);
  const L = new Lote(g);
  // paredes: fundo (z=Z1), frente (z=Z0), esquerda (janelas) e direita
  L.caixa(X1 - X0, H, 0.12, mReb, 0, H / 2, Z1 + 0.06, { uv: 2.4 });
  L.caixa(X1 - X0, H, 0.12, mReb, 0, H / 2, Z0 - 0.06, { uv: 2.4 });
  L.caixa(0.12, H, Z1 - Z0, mReb, X1 + 0.06, H / 2, (Z0 + Z1) / 2, { uv: 2.4 });
  L.caixa(0.12, H, Z1 - Z0, mReb, X0 - 0.06, H / 2, (Z0 + Z1) / 2, { uv: 2.4 });
  // lambri (meia-parede de madeira) e rodapé
  for (const [w, dd, x, z] of [[X1 - X0, 0.04, 0, Z1 - 0.02], [X1 - X0, 0.04, 0, Z0 + 0.02], [0.04, Z1 - Z0, X1 - 0.02, (Z0 + Z1) / 2], [0.04, Z1 - Z0, X0 + 0.02, (Z0 + Z1) / 2]]) {
    L.caixa(w, 1.05, dd, mLambri, x, 0.525, z, { uv: 0.9 }); L.caixa(w + (dd > w ? 0 : 0.0), 0.06, dd + 0.02, escura, x, 1.07, z);
  }
  // janelas altas na parede esquerda (painéis claros com caixilho)
  const vidro = new THREE.MeshBasicMaterial({ color: 0xeaf1f8 });
  for (const z of [-3.9, -1.4, 1.1, 3.0]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.9), vidro); p.rotation.y = Math.PI / 2; p.position.set(X0 + 0.01, 2.05, z); g.add(p);
    L.caixa(0.05, 1.98, 0.07, escura, X0 + 0.04, 2.05, z - 0.69); L.caixa(0.05, 1.98, 0.07, escura, X0 + 0.04, 2.05, z + 0.69);
    L.caixa(0.05, 0.07, 1.42, escura, X0 + 0.04, 3.02, z); L.caixa(0.05, 0.07, 1.42, escura, X0 + 0.04, 1.08, z); L.caixa(0.05, 0.05, 1.35, escura, X0 + 0.04, 2.05, z); L.caixa(0.05, 1.9, 0.045, escura, X0 + 0.04, 2.05, z);
  }
  // quadro de giz na frente, com moldura e calha
  d.lousa = X.criarLousa(832, 480);
  const quadro = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.5), new THREE.MeshStandardMaterial({ map: d.lousa.tex, roughness: 0.9 })); quadro.position.set(0, 1.9, Z0 + 0.025); g.add(quadro);
  const mold = M(0x5a3d22, 0.7);
  L.caixa(2.78, 0.09, 0.07, mold, 0, 2.695, Z0 + 0.045); L.caixa(2.78, 0.09, 0.07, mold, 0, 1.105, Z0 + 0.045); L.caixa(0.09, 1.68, 0.07, mold, -1.345, 1.9, Z0 + 0.045); L.caixa(0.09, 1.68, 0.07, mold, 1.345, 1.9, Z0 + 0.045);
  L.caixa(2.5, 0.05, 0.12, mold, 0, 1.06, Z0 + 0.10);
  // mesa do instrutor
  L.caixa(1.5, 0.05, 0.7, mLambri, -3.0, 0.76, Z0 + 0.95, { uv: 0.8 }); for (const sx of [-1, 1]) for (const sz of [-1, 1]) L.caixa(0.06, 0.74, 0.06, escura, -3.0 + sx * 0.68, 0.37, Z0 + 0.95 + sz * 0.29);
  L.caixa(0.5, 0.01, 0.35, M(0xe4dfcf, 1), -2.6, 0.79, Z0 + 0.95, { ry: 0.2 });
  // carteiras com cadeira (3 fileiras x 3)
  const mTampo = M(0xffffff, 0.7, { map: T.texMadeira('#8b5e34', '#4a2c15', '#b38558') });
  const dx = [-2.3, 0, 2.3], dz = [-2.6, -1.1, 0.4];
  d.carteiras = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const x = dx[c], z = dz[r];
    L.caixa(0.66, 0.045, 0.48, mTampo, x, 0.74, z, { rx: 0.05, uv: 0.7 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) L.caixa(0.035, 0.72, 0.035, ferro, x + sx * 0.29, 0.36, z + sz * 0.2);
    L.caixa(0.60, 0.03, 0.28, ferro, x, 0.30, z + 0.02);
    // cadeira atrás da carteira
    const cz = z + 0.60;
    L.caixa(0.42, 0.04, 0.40, mTampo, x, 0.46, cz, { uv: 0.6 }); L.caixa(0.40, 0.34, 0.035, mTampo, x, 0.70, cz + 0.19, { rx: -0.08, uv: 0.6 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) L.caixa(0.03, 0.45, 0.03, ferro, x + sx * 0.18, 0.225, cz + sz * 0.17);
    d.carteiras.push({ x, z, cz });
  }
  L.fechar();
  // relógio de parede com a marca do canal e ponteiros que seguem o tempo (hora, minuto)
  const rel = new THREE.Group(); rel.position.set(3.1, 2.95, Z0 + 0.03); g.add(rel);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.30, 40), new THREE.MeshStandardMaterial({ map: T.texRelogio(), roughness: 0.5 })); rel.add(face);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.018, 8, 40), escura); aro.position.z = 0.005; rel.add(aro);
  const pH = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.15, 0.006), M(0x111111, 0.5)); pH.geometry.translate(0, 0.075, 0); pH.position.z = 0.012; rel.add(pH);
  const pM = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.23, 0.006), M(0x111111, 0.5)); pM.geometry.translate(0, 0.115, 0); pM.position.z = 0.016; rel.add(pM);
  d.relogio = (h, m) => { pM.rotation.z = -m / 60 * Math.PI * 2; pH.rotation.z = -((h % 12) + m / 60) / 12 * Math.PI * 2; };
  d.relogio(2, 0);
  // luminárias de pendente + luz de janela
  d.luzes = [];
  for (const z of [-3.2, -0.6, 1.9]) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.30, 0.20, 18, 1, true), new THREE.MeshStandardMaterial({ color: 0x2f4a3a, roughness: 0.5, side: THREE.DoubleSide })); cone.position.set(0, 2.78, z); g.add(cone);
    const fio = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.72, 5), ferro); fio.position.set(0, 3.14, z); g.add(fio);
    const bulbo = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff0c8 })); bulbo.position.set(0, 2.72, z); g.add(bulbo);
    const gl = brilho('255,226,160', 0.8, 0.55); gl.position.set(0, 2.70, z); g.add(gl);
    const pl = new THREE.PointLight(0xffe0ae, 5.5, 8.5, 1.7); pl.position.set(0, 2.55, z); g.add(pl); d.luzes.push(pl);
  }
  d.sol = new THREE.DirectionalLight(0xfff0d6, 1.35); d.sol.position.set(-9, 6, -2); d.sol.target.position.set(0, 0.6, -1.5); g.add(d.sol, d.sol.target);
  d.hemi = new THREE.HemisphereLight(0xdfe6f0, 0x6a4d32, 0.65); g.add(d.hemi);
  return d;
}

// ------------------------------------------------------------------------------------------------ quarto à noite
export function construirQuarto(mundo) {
  const [ox, , oz] = POS_S.quarto;
  const g = new THREE.Group(); g.name = 'quarto'; g.position.set(ox, 0, oz); mundo.add(g);
  const d = { g, ox, oz };
  const X0 = -2.3, X1 = 2.3, Z0 = -2.6, Z1 = 2.4, H = 2.7;
  const papel = T.texPapel('#2a3547', '#2f3b50', '#55667f'); papel.repeat.set(2.4, 1.2);
  const mParede = M(0xffffff, 0.95, { map: papel });
  const tPiso = T.texMadeira('#5d3f27', '#2b1a0e', '#7e5a3a'); tPiso.repeat.set(4, 4);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), M(0xffffff, 0.65, { map: tPiso })); piso.rotation.x = -Math.PI / 2; piso.position.set(0, 0, (Z0 + Z1) / 2); piso.receiveShadow = true; g.add(piso);
  const teto = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), M(0x9aa2b0, 1)); teto.rotation.x = Math.PI / 2; teto.position.set(0, H, (Z0 + Z1) / 2); g.add(teto);
  const L = new Lote(g);
  // paredes (esquerda com abertura da janela: x=X0, janela z∈[-1.0,0.4], y∈[0.9,2.3])
  L.caixa(X1 - X0, H, 0.1, mParede, 0, H / 2, Z0 - 0.05, { uv: 2.0 });
  L.caixa(X1 - X0, H, 0.1, mParede, 0, H / 2, Z1 + 0.05, { uv: 2.0 });
  L.caixa(0.1, H, Z1 - Z0, mParede, X1 + 0.05, H / 2, (Z0 + Z1) / 2, { uv: 2.0 });
  L.caixa(0.1, 0.9, Z1 - Z0, mParede, X0 - 0.05, 0.45, (Z0 + Z1) / 2, { uv: 2.0 });
  L.caixa(0.1, H - 2.3, Z1 - Z0, mParede, X0 - 0.05, 2.3 + (H - 2.3) / 2, (Z0 + Z1) / 2, { uv: 2.0 });
  L.caixa(0.1, 1.4, (-1.0 - Z0), mParede, X0 - 0.05, 1.6, (Z0 - 1.0) / 2, { uv: 2.0 });
  L.caixa(0.1, 1.4, (Z1 - 0.4), mParede, X0 - 0.05, 1.6, (0.4 + Z1) / 2, { uv: 2.0 });
  const rod = M(0x14161c, 0.8); L.caixa(X1 - X0, 0.09, 0.03, rod, 0, 0.045, Z0 + 0.015); L.caixa(0.03, 0.09, Z1 - Z0, rod, X1 - 0.015, 0.045, (Z0 + Z1) / 2);
  // caixilho da janela (cruz que projeta sombra no cobertor)
  const caix = M(0x1b1d24, 0.7);
  L.caixa(0.06, 1.4, 0.06, caix, X0 + 0.03, 1.6, -1.0); L.caixa(0.06, 1.4, 0.06, caix, X0 + 0.03, 1.6, 0.4); L.caixa(0.06, 0.06, 1.46, caix, X0 + 0.03, 2.3, -0.3); L.caixa(0.06, 0.06, 1.46, caix, X0 + 0.03, 0.9, -0.3);
  L.caixa(0.05, 1.4, 0.04, caix, X0 + 0.03, 1.6, -0.3); L.caixa(0.05, 0.04, 1.4, caix, X0 + 0.03, 1.6, -0.3);
  L.caixa(0.16, 0.05, 1.64, caix, X0 + 0.07, 0.88, -0.3);
  // cama: cabeceira na parede do fundo, colchão, lençol e travesseiro
  const madeira = M(0xffffff, 0.7, { map: T.texMadeira('#4b3220', '#24160c', '#6c4a2e') });
  L.caixa(1.12, 0.95, 0.07, madeira, 0.2, 0.62, Z0 + 0.06, { uv: 0.9 }); L.caixa(1.12, 0.55, 0.06, madeira, 0.2, 0.40, Z0 + 2.12, { uv: 0.9 });
  L.caixa(0.08, 0.30, 2.18, madeira, 0.2 - 0.52, 0.30, Z0 + 1.1, { uv: 0.9 }); L.caixa(0.08, 0.30, 2.18, madeira, 0.2 + 0.52, 0.30, Z0 + 1.1, { uv: 0.9 });
  L.caixa(1.0, 0.20, 2.05, M(0xa9b3c4, 0.95), 0.2, 0.42, Z0 + 1.1);                                       // colchão (cor azulada pela luz)
  L.caixa(1.0, 0.05, 2.07, M(0xd7dde8, 0.95), 0.2, 0.545, Z0 + 1.1);                                       // lençol esticado
  const trav = new THREE.Mesh(new THREE.SphereGeometry(0.30, 20, 12), M(0xe9edf3, 0.95)); trav.scale.set(1.0, 0.36, 0.66); trav.position.set(0.2, 0.62, Z0 + 0.42); trav.castShadow = true; trav.receiveShadow = true; g.add(trav);
  d.travesseiro = trav;
  // cobertor dobrado aos pés
  L.caixa(0.92, 0.12, 0.30, M(0x425a7e, 0.97), 0.2, 0.62, Z0 + 2.02);
  // criado-mudo com cronômetro, abajur e copo
  L.caixa(0.5, 0.52, 0.42, madeira, 1.18, 0.26, Z0 + 0.45, { uv: 0.8 }); L.caixa(0.52, 0.03, 0.44, madeira, 1.18, 0.535, Z0 + 0.45, { uv: 0.8 });
  L.caixa(0.46, 0.02, 0.01, caix, 1.18, 0.40, Z0 + 0.66);
  // tapete
  L.caixa(1.7, 0.012, 1.1, M(0xffffff, 1, { map: T.texTapete('#4a2230', '#9c7d42', '#1c2438') }), 0.2, 0.006, Z0 + 3.0, { uv: 1.1 });
  L.fechar();
  d.cron = PR.criarCronometro(); d.cron.position.set(1.18, 0.535 + 0.045, Z0 + 0.52); d.cron.rotation.set(-0.30, -0.32, 0); d.cron.scale.setScalar(1.35); g.add(d.cron);
  d.cron.children[1].material.emissive = new THREE.Color(0xffffff); d.cron.children[1].material.emissiveMap = d.cron.children[1].material.map; d.cron.children[1].material.emissiveIntensity = 0.55;
  const copo = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.026, 0.10, 14), new THREE.MeshStandardMaterial({ color: 0xcfe0f0, roughness: 0.1, transparent: true, opacity: 0.55 })); copo.position.set(1.06, 0.58, Z0 + 0.36); g.add(copo);
  const abaj = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.15, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0xcaa878, roughness: 0.9, side: THREE.DoubleSide, emissive: 0xff9a50, emissiveIntensity: 0.55 })); abaj.position.set(1.30, 0.80, Z0 + 0.34); g.add(abaj);
  const abajB = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.03, 0.22, 8), M(0x2b2b30, 0.5, { metalness: 0.5 })); abajB.position.set(1.30, 0.65, Z0 + 0.34); g.add(abajB);
  // céu e lua por trás da janela
  const cv = canvasTex(256, 256, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#060a1c'); gr.addColorStop(1, '#16223f'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    const r = mulberry32(5); for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`; c.fillRect(r() * w, r() * h * 0.9, 1 + r() * 1.6, 1 + r() * 1.6); }
    c.fillStyle = '#eef3ff'; c.beginPath(); c.arc(w * 0.62, h * 0.3, 15, 0, 6.3); c.fill();
  });
  const ceu = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.45), new THREE.MeshBasicMaterial({ map: cv })); ceu.rotation.y = Math.PI / 2; ceu.position.set(X0 - 0.12, 1.6, -0.3); g.add(ceu);
  // luar: luz direcional que atravessa o caixilho e desenha a janela na cama
  d.luar = new THREE.DirectionalLight(0x8fb0ff, 2.6); d.luar.position.set(X0 - 5, 4.6, -0.6); d.luar.target.position.set(0.2, 0.4, Z0 + 1.3); g.add(d.luar, d.luar.target);
  d.luar.castShadow = true; d.luar.shadow.mapSize.set(1024, 1024); Object.assign(d.luar.shadow.camera, { left: -2.6, right: 2.6, top: 2.6, bottom: -2.6, near: 1, far: 14 }); d.luar.shadow.bias = -0.0006; d.luar.shadow.normalBias = 0.03; d.luar.shadow.radius = 3;
  d.hemi = new THREE.HemisphereLight(0x6f84bd, 0x241c30, 1.15); g.add(d.hemi);
  d.abajur = new THREE.PointLight(0xffa860, 3.2, 5.0, 1.6); d.abajur.position.set(1.30, 0.86, Z0 + 0.42); g.add(d.abajur);
  const gl2 = brilho('255,170,90', 0.55, 0.75); gl2.position.set(1.30, 0.80, Z0 + 0.34); g.add(gl2); d.abajurGlow = gl2;
  d.fill = new THREE.PointLight(0xffc690, 0.0, 6, 1.8); d.fill.position.set(0.8, 1.7, 1.1); g.add(d.fill);   // luz de apoio quente (liga em closes)
  d.base = V(ox + 0.2, 0.545, oz + Z0 + 1.1);                                                                // centro da cama (topo do lençol) em coordenadas de mundo
  return d;
}
