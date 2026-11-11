// Olhos fechados de perto: cílios (arco escuro na linha das pálpebras) e esclera pintada de pele quando fechados (some a fresta nos cantos).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTex } from './motor.js';

// parâmetros do olho do soldado/aviador (gerador): raio do olho, abertura da pálpebra (graus)
const PARAM = { soldado: { r: 0.0124, lid: 26 }, aviador: { r: 0.0126, lid: 28 } };

function arcoCilios(r, lidDeg, sg) {
  const rl = r * 1.13 * 1.012, h = THREE.MathUtils.degToRad((150 - lidDeg) / 2);
  const alfa = THREE.MathUtils.degToRad(lidDeg + (150 - lidDeg) / 2) - 1.2;           // polo da pálpebra superior depois de fechar (1,2 rad)
  const q = fi => new THREE.Vector3(Math.sin(h) * Math.cos(fi), Math.cos(h) * Math.sin(alfa) + Math.sin(h) * Math.sin(fi) * Math.cos(alfa), Math.cos(h) * Math.cos(alfa) - Math.sin(h) * Math.sin(fi) * Math.sin(alfa)).multiplyScalar(rl);
  const pts = []; const w = THREE.MathUtils.degToRad(62);
  for (let i = 0; i <= 14; i++) pts.push(q(-Math.PI / 2 - w + (2 * w) * i / 14));
  const curva = new THREE.CatmullRomCurve3(pts);
  const geos = [new THREE.TubeGeometry(curva, 28, r * 0.045, 5, false)];
  // cílios: fios curtos que descem e se abrem para fora
  const N = 13;
  for (let i = 0; i < N; i++) {
    const k = (i + 0.5) / N, p0 = curva.getPoint(k), tg = curva.getTangent(k);
    const fora = (k - 0.5) * 2 * sg;                                                   // + para fora do rosto (lado temporal)
    const dir = new THREE.Vector3(0.55 * fora * 0.9, -0.80, 0.30).normalize();
    const L = r * (0.24 + 0.13 * Math.sin(k * Math.PI));
    const c = new THREE.CatmullRomCurve3([p0, p0.clone().addScaledVector(dir, L * 0.55).addScaledVector(new THREE.Vector3(0, 0, 1), L * 0.10), p0.clone().addScaledVector(dir, L).addScaledVector(new THREE.Vector3(0, 0, 1), L * 0.06)]);
    geos.push(new THREE.TubeGeometry(c, 4, r * 0.020, 4, false));
  }
  return mergeGeometries(geos.map(g => g.toNonIndexed()));
}

export function prepararOlhos(a, tom = null) {
  const par = PARAM[a.nome] || PARAM.soldado;
  const cab = a.ossos['Cabeca'];
  const mat = new THREE.MeshStandardMaterial({ color: 0x140b08, roughness: 0.55 });
  const itens = [];
  for (const lado of 'ED') {
    const sg = lado === 'E' ? 1 : -1, olho = a.ossos['Olho' + lado];
    const g = arcoCilios(par.r, par.lid, sg);
    const m = new THREE.Mesh(g, mat); m.position.copy(olho.position); m.visible = false; m.frustumCulled = false; m.castShadow = false;
    if (sg < 0) { m.scale.x = 1; }
    cab.add(m); itens.push(m);
  }
  // esclera -> pele (clona o material do olho desta instância)
  const escleras = [];
  a.obj.traverse(o => {
    if (!o.isMesh) return;
    const arr = Array.isArray(o.material) ? o.material : [o.material];
    const novo = arr.map(mm => { if (mm.name !== 'M_olho') return mm; const n = mm.clone(); escleras.push(n); return n; });
    o.material = Array.isArray(o.material) ? novo : novo[0];
  });
  let pele = tom ? new THREE.Color(tom) : null;
  if (!pele) { a.obj.traverse(o => { if (!pele && o.isMesh) { const arr = Array.isArray(o.material) ? o.material : [o.material]; for (const mm of arr) if (mm.name === 'M_pele') pele = mm.color.clone(); } }); }
  const original = escleras.map(m => m.color.clone());
  a.fecharOlhos = (piscar) => {
    const f = piscar >= 0.95;
    for (const m of itens) m.visible = f;
    escleras.forEach((m, i) => m.color.copy(f ? (pele || original[i]) : original[i]));
  };
  return a;
}

// olheiras (sombras roxas sob os olhos): plano com gradiente radial colado à cabeça; k = 0..1 de intensidade
export function prepararOlheiras(a) {
  const cab = a.ossos['Cabeca'], itens = [];
  const tex = canvasTex(64, 32, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(62,30,48,0.95)'); g.addColorStop(0.55, 'rgba(62,30,48,0.55)'); g.addColorStop(1, 'rgba(62,30,48,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
  for (const lado of 'ED') {
    const sg = lado === 'E' ? 1 : -1, olho = a.ossos['Olho' + lado];
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.036, 0.0155), mat);
    m.position.set(olho.position.x + sg * 0.001, olho.position.y - 0.0195, olho.position.z + 0.0100); m.rotation.set(0.32, 0, sg * 0.10); m.frustumCulled = false; m.renderOrder = 3;
    cab.add(m); itens.push(m);
  }
  a.olheiras = k => { mat.opacity = 0.9 * k; for (const m of itens) m.visible = k > 0.01; };
  a.olheiras(0);
  return a;
}
