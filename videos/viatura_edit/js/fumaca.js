// FUMAÇA de pneu (partículas em forma fechada no tempo: cada uma nasce num instante fixo, então qualquer quadro e câmera lenta saem certos) e MARCAS de pneu no asfalto.
import * as THREE from 'three';

const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

function texFumaca() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 128);
  for (let i = 0; i < 46; i++) {
    const a = hash(i * 3.1) * Math.PI * 2, r = Math.sqrt(hash(i * 5.7)) * 34, x = 64 + Math.cos(a) * r, y = 64 + Math.sin(a) * r, rad = 14 + hash(i * 9.3) * 26;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(255,255,255,0.20)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  }
  const fade = g.createRadialGradient(64, 64, 20, 64, 64, 64); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = fade; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function criarFumaca(scene, altura) {
  const MAX = 700, geo = new THREE.BufferGeometry();
  const pos = new Float32Array(MAX * 3), tam = new Float32Array(MAX), alfa = new Float32Array(MAX), cor = new Float32Array(MAX * 3), rot = new Float32Array(MAX);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('tam', new THREE.BufferAttribute(tam, 1)); geo.setAttribute('alfa', new THREE.BufferAttribute(alfa, 1));
  geo.setAttribute('cor', new THREE.BufferAttribute(cor, 3)); geo.setAttribute('rot', new THREE.BufferAttribute(rot, 1)); geo.setDrawRange(0, 0);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { mapa: { value: texFumaca() }, escala: { value: 600 } },
    vertexShader: `attribute float tam; attribute float alfa; attribute vec3 cor; attribute float rot; varying float vA; varying vec3 vC; varying float vR; uniform float escala;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = min(tam * escala / max(-mv.z, 0.05), 900.0); vA = alfa; vC = cor; vR = rot; }`,
    fragmentShader: `uniform sampler2D mapa; varying float vA; varying vec3 vC; varying float vR;
      void main(){ vec2 p = gl_PointCoord - 0.5; float c = cos(vR), s = sin(vR); p = mat2(c, -s, s, c) * p + 0.5; vec4 t = texture2D(mapa, p); gl_FragColor = vec4(vC, t.a * vA); }`,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 15; scene.add(pts);
  const v3 = new THREE.Vector3(), cam = new THREE.Vector3();
  /**
   * emissores: [{ inicio, fim, taxa, vida, tam0, tam1, alfa, semente, pos(ti)->[x,y,z], vel(ti)->[vx,vy,vz] }] (tempos em segundos da linha do tempo)
   * luz: { v, a, pos:[x,y,z] } intensidade das luzes vermelha/azul e posição da barra, para tingir a fumaça
   */
  function atualizar(t, emissores, camera, luz) {
    camera.getWorldPosition(cam); mat.uniforms.escala.value = altura / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    const L = [];
    for (const e of emissores) {
      if (t < e.inicio || t - e.fim > e.vida) continue;
      const kmax = Math.floor((Math.min(t, e.fim) - e.inicio) * e.taxa), k0 = Math.max(0, Math.floor((t - e.vida - e.inicio) * e.taxa));
      for (let k = k0; k <= kmax; k++) {
        const ti = e.inicio + k / e.taxa, age = t - ti; if (age < 0 || age > e.vida) continue;
        const r1 = hash(k * 1.37 + e.semente), r2 = hash(k * 2.91 + e.semente + 4.2), r3 = hash(k * 4.13 + e.semente + 9.9), u = age / e.vida;
        const p0 = e.pos(ti), v0 = e.vel(ti), dr = 1.6, f = (1 - Math.exp(-dr * age)) / dr;                           // arrasto: a velocidade inicial se esgota
        const x = p0[0] + (v0[0] + (r1 - 0.5) * 2.2) * f + Math.sin(age * 1.7 + r2 * 6) * 0.18 * u;
        const y = p0[1] + 0.12 + (v0[1] + 0.5 + r3 * 0.9) * f + age * (0.25 + r2 * 0.3) * 0.6;
        const z = p0[2] + (v0[2] + (r3 - 0.5) * 2.2) * f;
        v3.set(x, y, z);
        L.push({ x, y, z, d: v3.distanceToSquared(cam), tam: (e.tam0 + (e.tam1 - e.tam0) * Math.pow(u, 0.6)) * (0.7 + r1 * 0.7), a: e.alfa * Math.min(1, age / 0.1) * Math.pow(1 - u, 1.5), rot: r2 * 6.283 + age * (r3 - 0.5) * 1.1 });
      }
    }
    L.sort((p, q) => q.d - p.d); const n = Math.min(L.length, MAX);
    for (let i = 0; i < n; i++) {
      const p = L[i]; pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; tam[i] = p.tam; alfa[i] = p.a; rot[i] = p.rot;
      let r = 0.30, g = 0.31, b = 0.36;                                                                             // fumaça cinza-azulada sob a lua
      if (luz) { const dx = p.x - luz.pos[0], dy = p.y - luz.pos[1], dz = p.z - luz.pos[2], k = 1 / (1 + 0.16 * (dx * dx + dy * dy + dz * dz)); r += luz.v * k * 1.9 + luz.a * k * 0.08; g += luz.v * k * 0.12 + luz.a * k * 0.32; b += luz.v * k * 0.12 + luz.a * k * 1.7; }
      cor[i * 3] = r; cor[i * 3 + 1] = g; cor[i * 3 + 2] = b;
    }
    geo.setDrawRange(0, n);
    for (const k of ['position', 'tam', 'alfa', 'cor', 'rot']) geo.attributes[k].needsUpdate = true;
  }
  return { atualizar, pts };
}

/** Marcas de pneu: fitas pretas no asfalto seguindo os pontos por onde a roda passou entre `inicio` e `fim` (até o instante t). */
export function criarMarcas(scene) {
  const MAX = 2 * 2 * 420, geo = new THREE.BufferGeometry(), pos = new Float32Array(MAX * 3), col = new Float32Array(MAX * 4);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 4)); geo.setIndex(new THREE.BufferAttribute(new Uint32Array(MAX * 3), 1)); geo.setDrawRange(0, 0);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, fog: true })); mesh.frustumCulled = false; mesh.renderOrder = 2; scene.add(mesh);
  const idx = geo.index.array;
  /** m: { inicio, fim, larg, rodas: ti -> [[x,z],[x,z]] , passo, forca } */
  function atualizar(t, m) {
    if (!m || t <= m.inicio) { geo.setDrawRange(0, 0); return; }
    const passo = m.passo || 1 / 40, N = Math.min(Math.floor((Math.min(t, m.fim) - m.inicio) / passo), 205); let nv = 0, ni = 0;
    for (let j = 0; j < 2; j++) {
      let prev = null, base = nv;
      for (let k = 0; k <= N; k++) {
        const ti = m.inicio + k * passo, P = m.rodas(ti)[j], Q = m.rodas(ti + 0.02)[j];
        let tx = Q[0] - P[0], tz = Q[1] - P[1], l = Math.hypot(tx, tz); if (l < 1e-6) { if (!prev) continue; tx = prev.tx; tz = prev.tz; l = 1; } tx /= l; tz /= l;
        const nx = -tz * (m.larg / 2), nz = tx * (m.larg / 2), a = (m.forca || 0.55) * Math.min(1, k / 6) * (0.75 + 0.25 * hash(k * 1.3 + j));
        pos.set([P[0] + nx, 0.012, P[1] + nz, P[0] - nx, 0.012, P[1] - nz], nv * 3); col.set([0.02, 0.02, 0.025, a, 0.02, 0.02, 0.025, a], nv * 4);
        if (prev) { const s = prev.i; idx[ni++] = s; idx[ni++] = s + 1; idx[ni++] = nv; idx[ni++] = s + 1; idx[ni++] = nv + 1; idx[ni++] = nv; }
        prev = { i: nv, tx, tz }; nv += 2;
      }
      void base;
    }
    geo.setDrawRange(0, ni); geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.index.needsUpdate = true;
  }
  return { atualizar, mesh };
}
