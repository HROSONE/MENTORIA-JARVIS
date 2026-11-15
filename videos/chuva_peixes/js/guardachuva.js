// Guarda-chuva azul com copa de tecido deformável: o peixe empurra o tecido, rasga um buraco de borda irregular e as bordas pendem.
// Referencial: origem no centro do plano da copa (aro em y=0, ápice em y=H); cabo desce até y=-0,85; punho em forma de gancho.
// A copa tem 8 gomos com costuras e a marca HRYZ em branco na barra da borda (textura gerada em canvas).
import * as THREE from 'three';
import { mulberry32 } from './util.js';

// mapa de relevo do tecido: trama diagonal fina + gotas de chuva (alturas -> normais por Sobel)
function normalGotas() {
  const W = 1024, H = 512, h = new Float32Array(W * H), r = mulberry32(77);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) h[y * W + x] = 0.10 * (Math.sin((x + y) * 1.3) * 0.5 + 0.5) + 0.06 * (Math.sin((x - y) * 1.3) * 0.5 + 0.5);
  for (let i = 0; i < 520; i++) { const cx = r() * W, cy = r() * H, rad = 2 + 7 * r() * r(), x0 = Math.floor(cx - rad - 1), x1 = Math.ceil(cx + rad + 1); for (let yy = Math.floor(cy - rad - 1); yy <= Math.ceil(cy + rad + 1); yy++) for (let xx = x0; xx <= x1; xx++) { const d = Math.hypot(xx - cx, (yy - cy) * 1.0) / rad; if (d < 1) { const k = ((xx % W) + W) % W, j = ((yy % H) + H) % H; h[j * W + k] = Math.max(h[j * W + k], 0.9 * Math.sqrt(1 - d * d)); } } }
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), im = g.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const l = h[y * W + (x + W - 1) % W], rr = h[y * W + (x + 1) % W], u = h[((y + H - 1) % H) * W + x], d = h[((y + 1) % H) * W + x], nx = (l - rr) * 2.2, ny = (u - d) * 2.2, nz = 1, n = Math.hypot(nx, ny, nz), i = (y * W + x) * 4; im.data[i] = (nx / n * 0.5 + 0.5) * 255; im.data[i + 1] = (ny / n * 0.5 + 0.5) * 255; im.data[i + 2] = (nz / n * 0.5 + 0.5) * 255; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

export function criarGuardaChuva({ R = 0.54, H = 0.25, P = [0.2, 0.09], env = null } = {}) {
  const g = new THREE.Group();
  const NR = 34, NP = 96, NC = NP + 1, np = (NR + 1) * NC;
  const base = new Float32Array(np * 3), pos = new Float32Array(np * 3), nrm = new Float32Array(np * 3);
  for (let j = 0; j <= NR; j++) for (let k = 0; k <= NP; k++) {
    const u = j / NR, ph = k / NP * Math.PI * 2, gore = 1 - Math.abs(Math.cos(4 * ph)), r = R * u * (1 - 0.05 * u * u * gore), y = H * (1 - Math.pow(u, 2.2)) - 0.02 * Math.pow(u, 10) - 0.03 * Math.pow(u, 7) * gore;
    const i = (j * NC + k) * 3; base[i] = r * Math.cos(ph); base[i + 1] = y; base[i + 2] = r * Math.sin(ph);
  }
  // textura da copa: 8 gomos (azul cobalto, costuras claras) e a marca HRYZ na barra da borda (4 vezes)
  const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 256; const cx = cv.getContext('2d');
  for (let k = 0; k < 8; k++) { const g2 = cx.createLinearGradient(0, 0, 0, 256); g2.addColorStop(0, k % 2 ? '#1a4dff' : '#2263ff'); g2.addColorStop(1, k % 2 ? '#1546e0' : '#1b55f5'); cx.fillStyle = g2; cx.fillRect(k * 256, 0, 256, 256); cx.fillStyle = 'rgba(190,215,255,0.5)'; cx.fillRect(k * 256 - 2, 0, 4, 256); }
  cx.fillStyle = '#f2f6ff'; cx.fillRect(0, 206, 2048, 5); cx.fillRect(0, 246, 2048, 3);
  cx.font = 'bold 36px Arial Black, Arial, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#ffffff';
  for (let k = 0; k < 4; k++) cx.fillText('H R Y Z', k * 512 + 128, 228);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping; tex.anisotropy = 8;
  const uv = new Float32Array(np * 2); for (let j = 0; j <= NR; j++) for (let k = 0; k <= NP; k++) { const i = j * NC + k; uv[i * 2] = 1 - k / NP; uv[i * 2 + 1] = 1 - j / NR; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(new THREE.BufferAttribute(new Uint32Array(NR * NP * 6), 1)); geo.index.usage = THREE.DynamicDrawUsage;
  // os triângulos olham para baixo: FrontSide = face de dentro (azul liso, mais escuro); BackSide = face de fora (textura com a marca)
  const matFora = new THREE.MeshPhysicalMaterial({ map: tex, color: 0xffffff, roughness: 0.46, metalness: 0.0, side: THREE.BackSide, envMap: env, envMapIntensity: 0.6, normalMap: normalGotas(), normalScale: new THREE.Vector2(0.9, 0.9), clearcoat: 0.3, clearcoatRoughness: 0.35 });
  const matDentro = new THREE.MeshStandardMaterial({ color: 0x1a3fc0, roughness: 0.6, metalness: 0.0, side: THREE.FrontSide, envMap: env, envMapIntensity: 0.25, emissive: 0x0a1c66, emissiveIntensity: 0.6 });
  const fora = new THREE.Mesh(geo, matFora), dentro = new THREE.Mesh(geo, matDentro);
  fora.castShadow = false; dentro.castShadow = true; fora.receiveShadow = dentro.receiveShadow = false; fora.frustumCulled = dentro.frustumCulled = false; g.add(fora, dentro);
  // varetas, cabo, ponteira e gancho
  const metal = new THREE.MeshStandardMaterial({ color: 0x23262e, roughness: 0.35, metalness: 0.7 });
  for (let k = 0; k < 8; k++) {
    const ph = k * Math.PI / 4, pts = [];
    for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push(new THREE.Vector3(R * u * Math.cos(ph), H * (1 - Math.pow(u, 2.2)) - 0.02 * Math.pow(u, 10) - 0.006, R * u * Math.sin(ph))); }
    const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.0042, 6), metal); t.castShadow = true; g.add(t);
    const ponta = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), metal); ponta.position.set(R * Math.cos(ph), -0.012, R * Math.sin(ph)); g.add(ponta);
  }
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.9, 10), metal); cabo.position.y = -0.4; g.add(cabo);
  const ponteira = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.005, 0.06, 8), metal); ponteira.position.y = H + 0.025; g.add(ponteira);
  const gancho = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.0095, 8, 18, Math.PI), new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.5 })); gancho.position.set(0.034, -0.85, 0); gancho.rotation.z = Math.PI; g.add(gancho);
  const idxA = geo.index.array;
  // P: ponto de impacto (x, z) no plano da copa. dent (m, para baixo), hole (raio do buraco), flap (m, bordas pendendo)
  function atualizar({ dent = 0, hole = 0, flap = 0, balanco = 0 } = {}) {
    const [px, pz] = P, SIG = 0.105, FL = 0.075; let ni = 0; const dentro = new Uint8Array(np);
    for (let j = 0; j <= NR; j++) for (let k = 0; k <= NP; k++) {
      const v = j * NC + k, i = v * 3; let x = base[i], y = base[i + 1], z = base[i + 2];
      const dx = x - px, dz = z - pz, d = Math.hypot(dx, dz), ang = Math.atan2(dz, dx), rr = hole * (1 + 0.32 * Math.sin(5 * ang + 1.3) + 0.16 * Math.sin(11 * ang + 0.4) + 0.1 * Math.sin(17 * ang));
      y -= dent * Math.exp(-(d / SIG) * (d / SIG));
      if (hole > 0 && d >= rr && d < rr + FL) { const w = 1 - (d - rr) / FL; y -= flap * w * w; x += dx / (d + 1e-6) * 0.25 * flap * w; z += dz / (d + 1e-6) * 0.25 * flap * w; }
      y += balanco * 0.012 * (x / R);
      pos[i] = x; pos[i + 1] = y; pos[i + 2] = z; dentro[v] = hole > 0 && d < rr ? 1 : 0;
    }
    for (let j = 0; j < NR; j++) for (let k = 0; k < NP; k++) {
      const a = j * NC + k, b = a + 1, c = a + NC, d = b + NC;
      if (dentro[a] || dentro[b] || dentro[c] || dentro[d]) continue;
      idxA[ni++] = a; idxA[ni++] = c; idxA[ni++] = b; idxA[ni++] = b; idxA[ni++] = c; idxA[ni++] = d;
    }
    geo.setDrawRange(0, ni); geo.index.needsUpdate = true; geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
  }
  // altura da copa (sem deformação) no ponto local (x, z); usada para achar onde a reta do peixe cruza o tecido
  const alturaCopa = (x, z) => { const u = Math.min(1, Math.hypot(x, z) / R); return H * (1 - Math.pow(u, 2.2)) - 0.02 * Math.pow(u, 10); };
  // pingos que escorrem das pontas das 8 varetas (instanciados): ficam parados no ar no "bullet time" porque dependem do tempo físico
  const nD = 8 * 3, gotas = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshStandardMaterial({ color: 0xd8ecff, emissive: 0x3d6ba8, emissiveIntensity: 0.9, roughness: 0.05, transparent: true, opacity: 0.8 }), nD);
  gotas.frustumCulled = false; const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Pp = new THREE.Vector3(), Sc = new THREE.Vector3(), rg = mulberry32(5), fase = Array.from({ length: nD }, () => rg());
  const pingos = (tau, mundo, deriva = [0, 0, 0]) => {
    for (let i = 0; i < nD; i++) {
      const k = i % 8, ph = k * Math.PI / 4, ciclo = 0.85, tt = (((tau / ciclo + fase[i]) % 1) + 1) % 1 * ciclo, cresce = Math.min(1, tt / 0.45), cai = Math.max(0, tt - 0.45);
      const yq = -0.5 * 9.8 * cai * cai, vy = -9.8 * cai;
      Pp.set(R * 0.97 * Math.cos(ph), -0.02 + yq, R * 0.97 * Math.sin(ph)); Pp.applyMatrix4(mundo);
      Pp.x += deriva[0] * (cai); Pp.z += deriva[2] * (cai);
      const r = 0.0045 * (0.3 + 0.7 * cresce) * (cai > 0 ? 1 : 1.25); Sc.set(r, r * (1 + Math.min(3, Math.abs(vy) * 0.5)), r); M.compose(Pp, Q, Sc); gotas.setMatrixAt(i, M);
    }
    gotas.instanceMatrix.needsUpdate = true;
  };
  // as gotas ficam em coordenadas de mundo: o chamador faz mundo.add(guarda.gotas)
  atualizar();
  return { grupo: g, atualizar, alturaCopa, R, H, P, gotas, pingos };
}
