// Objetos de cena que dão vida e detalhe: feixes de luz na chuva, fios e postes, bandeirolas e faixa de festa, gaivotas, vapor de bueiro, flores, boné e celular.
import * as THREE from 'three';
import { mulberry32, clamp, lerp, suave } from './util.js';
import { texFumaca } from './motor.js';

// ---------------------------------------------------------------- feixe de luz (cone aditivo com listras de chuva)
export function feixeLuz({ de = [0, 8, 0], altura = 8, raio = 3.2, cor = [1.0, 0.72, 0.42], forca = 0.16 } = {}) {
  const geo = new THREE.CylinderGeometry(0.18, raio, altura, 36, 1, true); geo.translate(0, -altura / 2, 0);
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { cor: { value: new THREE.Vector3(...cor) }, k: { value: forca }, t: { value: 0 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying float vY; varying vec3 vL; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vY = position.y; vL = position; gl_Position = projectionMatrix * mv; }',
    fragmentShader: `uniform vec3 cor; uniform float k, t; varying vec3 vN; varying vec3 vV; varying float vY; varying vec3 vL;
      float h(float x){ return fract(sin(x * 91.3) * 437.5); }
      void main(){ float c = pow(abs(dot(normalize(vN), normalize(vV))), 1.6); float f = smoothstep(${(-altura).toFixed(1)}, 0.0, vY); f = pow(f, 1.4);
        float ang = atan(vL.z, vL.x), s = 0.55 + 0.45 * h(floor(ang * 18.0)); float fl = 0.5 + 0.5 * sin(t * 40.0 + floor(ang * 18.0) * 2.0);
        gl_FragColor = vec4(cor * k * c * f * s * (0.8 + 0.2 * fl), 1.0); }`,
  });
  const mesh = new THREE.Mesh(geo, m); mesh.position.set(...de); mesh.frustumCulled = false; mesh.renderOrder = 5; return mesh;
}

// ---------------------------------------------------------------- fios com catenária entre dois pontos
export function fio(p0, p1, { sag = 0.5, raio = 0.014, cor = 0x16171c, n = 24 } = {}) {
  const pts = []; for (let i = 0; i <= n; i++) { const u = i / n; pts.push(new THREE.Vector3(lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u) - 4 * sag * u * (1 - u), lerp(p0[2], p1[2], u))); }
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, raio, 5), new THREE.MeshStandardMaterial({ color: cor, roughness: 0.6, metalness: 0.2 })); m.castShadow = true; return m;
}
export function linhaDeFios(g, pontos, alturas, { x = [-0.7, 0, 0.7], sag = 0.45 } = {}) {
  for (let i = 0; i < pontos.length - 1; i++) for (const dx of x) g.add(fio([pontos[i][0] + dx, alturas, pontos[i][1]], [pontos[i + 1][0] + dx, alturas, pontos[i + 1][1]], { sag }));
}

// ---------------------------------------------------------------- bandeirolas de festa (triângulos coloridos pendurados em catenária que balançam)
export function bandeirolas(pai, p0, p1, { n = 34, sag = 0.7, cores = [0xe8353a, 0xffc61a, 0x2f7de8, 0x2fb85a, 0xffffff, 0xff7a2a, 0xc43fd8], tam = 0.34, semente = 3 } = {}) {
  const r = mulberry32(semente), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([-tam / 2, 0, 0, tam / 2, 0, 0, 0, -tam * 1.15, 0], 3)); geo.computeVertexNormals();
  const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.8 }), n); im.frustumCulled = false; im.castShadow = true; pai.add(im);
  const c = new THREE.Color(), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1), eixo = new THREE.Vector3(p1[0] - p0[0], 0, p1[2] - p0[2]).normalize();
  const yaw = Math.atan2(eixo.x, eixo.z), F = [];
  for (let i = 0; i < n; i++) { im.setColorAt(i, c.set(cores[Math.floor(r() * cores.length)])); F.push({ u: (i + 0.5) / n, fase: r() * 6.28 }); }
  im.instanceColor.needsUpdate = true;
  const fiom = fio(p0, p1, { sag, raio: 0.012, cor: 0x222222, n: 30 }); pai.add(fiom);
  const atualizar = t => { F.forEach((f, i) => { const u = f.u; P.set(lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u) - 4 * sag * u * (1 - u), lerp(p0[2], p1[2], u)); E.set(0.25 * Math.sin(t * 2.3 + f.fase), yaw + Math.PI / 2, 0.18 * Math.sin(t * 1.7 + f.fase * 2), 'YXZ'); Q.setFromEuler(E); M.compose(P, Q, S); im.setMatrixAt(i, M); }); im.instanceMatrix.needsUpdate = true; };
  return { atualizar, malha: im };
}
// faixa de festa com texto (pano que balança suavemente)
export function faixa(pai, { texto = 'LLUVIA DE PECES', sub = 'HRYZ', pos = [0, 5, 8], larg = 5.2, alt = 1.1, cor = '#c42a2a', yaw = 0 } = {}) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 216; const c = cv.getContext('2d');
  c.fillStyle = cor; c.fillRect(0, 0, 1024, 216); c.strokeStyle = '#ffe9a8'; c.lineWidth = 10; c.strokeRect(10, 10, 1004, 196);
  c.fillStyle = '#fff6e0'; c.font = 'bold 118px Arial Black, Arial, sans-serif'; c.textAlign = 'center'; c.fillText(texto, 512, 128); c.font = 'bold 40px Arial, sans-serif'; c.fillStyle = '#ffd24a'; c.fillText(sub + ' · FESTIVAL', 512, 188);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const geo = new THREE.PlaneGeometry(larg, alt, 30, 4), P = geo.attributes.position, base = Float32Array.from(P.array);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, side: THREE.DoubleSide })); m.position.set(...pos); m.rotation.y = yaw; m.castShadow = true; pai.add(m);
  for (const sx of [-1, 1]) pai.add(fio([pos[0] + sx * larg / 2 * Math.cos(yaw), pos[1] + alt / 2, pos[2] - sx * larg / 2 * Math.sin(yaw)], [pos[0] + sx * larg / 2 * Math.cos(yaw), pos[1] + alt / 2 + 0.01, pos[2] - sx * larg / 2 * Math.sin(yaw)], { raio: 0.02, sag: 0 }));
  const atualizar = t => { for (let i = 0; i < P.count; i++) { const x = base[i * 3], y = base[i * 3 + 1]; P.setZ(i, 0.07 * Math.sin(x * 1.7 + t * 2.2) * (0.5 + 0.5 * (y / alt + 0.5)) + 0.04 * Math.sin(x * 4 + t * 3.1)); } P.needsUpdate = true; geo.computeVertexNormals(); };
  return { malha: m, atualizar };
}

// ---------------------------------------------------------------- gaivotas (corpo, cabeça, bico e asas que batem), em voo circular
export function criarGaivotas(pai, n = 7, { centro = [0, 7, 6], raio = 8, semente = 9 } = {}) {
  const r = mulberry32(semente), G = [], branco = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.7 }), cinza = new THREE.MeshStandardMaterial({ color: 0x8a909c, roughness: 0.8, side: THREE.DoubleSide }), bico = new THREE.MeshStandardMaterial({ color: 0xffb020, roughness: 0.6 });
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group(), corpo = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), branco); corpo.scale.set(1.9, 0.75, 0.8); g.add(corpo);
    const cab = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), branco); cab.position.set(0.38, 0.06, 0); g.add(cab); const b = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.14, 6), bico); b.rotation.z = -Math.PI / 2; b.position.set(0.5, 0.04, 0); g.add(b);
    const rabo = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 4), branco); rabo.rotation.z = Math.PI / 2; rabo.position.set(-0.46, 0, 0); rabo.scale.set(1, 1, 0.25); g.add(rabo);
    const asas = [-1, 1].map(sz => { const pivo = new THREE.Group(); const a = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.95), cinza); a.rotation.x = -Math.PI / 2; a.position.set(-0.04, 0, sz * 0.48); pivo.add(a); const pt = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.3), new THREE.MeshStandardMaterial({ color: 0x23262e, side: THREE.DoubleSide })); pt.rotation.x = -Math.PI / 2; pt.position.set(-0.1, 0, sz * 1.1); pivo.add(pt); pivo.position.set(0.02, 0.05, 0); g.add(pivo); return pivo; });
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); pai.add(g); G.push({ g, asas, f: r() * 6.28, w: (0.45 + 0.3 * r()) * (r() < 0.5 ? 1 : -1), rr: raio * (0.55 + 0.7 * r()), h: centro[1] + (r() - 0.5) * 4, bat: 5 + 3 * r() });
  }
  const atualizar = t => G.forEach(o => { const a = o.f + t * o.w, x = centro[0] + Math.cos(a) * o.rr, z = centro[2] + Math.sin(a) * o.rr * 0.7, y = o.h + 0.5 * Math.sin(t * 0.9 + o.f), dx = -Math.sin(a) * Math.sign(o.w), dz = Math.cos(a) * 0.7 * Math.sign(o.w); o.g.position.set(x, y, z); o.g.rotation.set(0.18 * Math.sin(t + o.f), Math.atan2(-dz, dx), 0, 'YXZ'); const flap = Math.sin(t * o.bat + o.f) * 0.7; o.asas[0].rotation.x = flap; o.asas[1].rotation.x = -flap; });
  return { atualizar };
}

// ---------------------------------------------------------------- vapor de bueiro (sprites que sobem e se dissolvem; função fechada do tempo)
export function criarVapor(pai, { pos = [0, 0.05, 0], n = 12, altura = 2.2, periodo = 5, cor = 0xc8d0e8 } = {}) {
  const r = mulberry32(2), S = [];
  for (let i = 0; i < n; i++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFumaca(), color: cor, transparent: true, opacity: 0, depthWrite: false })); m.renderOrder = 6; pai.add(m); S.push({ m, f: i / n, dx: (r() - 0.5) * 0.6, dz: (r() - 0.5) * 0.6, e: 0.9 + r() * 0.8 }); }
  return t => S.forEach(o => { const u = ((t / periodo + o.f) % 1 + 1) % 1; o.m.position.set(pos[0] + o.dx * u * 1.6 + 0.3 * Math.sin(u * 5 + o.f * 9), pos[1] + u * altura, pos[2] + o.dz * u * 1.6); const s = o.e * (0.6 + 2.2 * u); o.m.scale.set(s, s, 1); o.m.material.opacity = 0.42 * Math.sin(Math.PI * Math.min(1, u * 1.1)) * (1 - u * 0.5); });
}

// ---------------------------------------------------------------- flores e arbustos em canteiro (instanciados)
export function canteiro(pai, { x0, x1, z0, z1, y = 0.15, n = 70, semente = 4 } = {}) {
  const r = mulberry32(semente), cores = [0xe8353a, 0xffc61a, 0xff7ab8, 0xffffff, 0xc43fd8, 0xff8a2a];
  const folhas = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0x3d8a3c, roughness: 0.9 }), Math.floor(n / 4)), flores = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 0.6 }), n);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(), c = new THREE.Color();
  for (let i = 0; i < folhas.count; i++) { const e = 0.28 + 0.22 * r(); P.set(lerp(x0, x1, r()), y + e * 0.7, lerp(z0, z1, r())); S.set(e * 1.3, e * 0.9, e * 1.3); M.compose(P, Q, S); folhas.setMatrixAt(i, M); }
  for (let i = 0; i < n; i++) { const e = 0.045 + 0.03 * r(); P.set(lerp(x0, x1, r()), y + 0.22 + 0.5 * r(), lerp(z0, z1, r())); S.setScalar(e); M.compose(P, Q, S); flores.setMatrixAt(i, M); flores.setColorAt(i, c.set(cores[Math.floor(r() * cores.length)])); }
  for (const m of [folhas, flores]) { m.castShadow = true; pai.add(m); }
}

// ---------------------------------------------------------------- boné e celular
export function criarBone(cor = 0xd8202c) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.8 });
  const copa = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), m); copa.scale.set(1, 0.9, 1.08); g.add(copa);
  const aba = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.012, 20, 1, false, -0.9, 1.8), m); aba.scale.set(1.2, 1, 1.5); aba.position.set(0, 0.005, 0.09); g.add(aba);
  const bot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff })); bot.position.set(0, 0.105, 0); g.add(bot); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g;
}
export function criarCelular() {
  const g = new THREE.Group(), corpo = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.145, 0.009), new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.3, metalness: 0.5 }));
  const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.064, 0.136), new THREE.MeshStandardMaterial({ color: 0x0a2a4a, emissive: 0x6ab4ff, emissiveIntensity: 1.1 })); tela.position.z = 0.0052; g.add(corpo, tela); return g;
}
