// EFEITOS do Short "Ele podia voar": bolha/casulo de energia ("vidro líquido" azul com borda brilhante e ondas), bola de fogo e fumaça (sprites
// em forma fechada no tempo), onda de choque (esfera e anel), destroços (pedaços de lata e vidro). Tudo é função do tempo: qualquer quadro sai igual.
import * as THREE from 'three';
import { canvasTex, texFumaca } from './motor.js';
import { mulberry32, clamp, lerp } from './util.js';

// ------------------------------------------------------------------------------------------------ bolha de energia
export function criarBolha(raio = 1) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { t: { value: 0 }, forca: { value: 1 }, cor: { value: new THREE.Color(0.30, 0.65, 1.0) } },
    vertexShader: `uniform float t; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main() { vec3 p = position + normal * 0.025 * sin(position.y * 9.0 + t * 7.0) * sin(position.x * 7.0 - t * 5.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vP = position; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float t, forca; uniform vec3 cor; varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main() { float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        float ondas = 0.5 + 0.5 * sin(vP.y * 18.0 - t * 9.0 + sin(vP.x * 11.0 + t * 3.0) * 1.5);
        float a = (0.06 + 0.85 * f + 0.10 * ondas * f) * forca;
        gl_FragColor = vec4(cor * (0.6 + 1.6 * f) + vec3(0.6, 0.85, 1.0) * pow(f, 6.0), a); }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(raio, 48, 32), mat); m.renderOrder = 30; m.frustumCulled = false;
  m.userData.atualizar = (t, forca = 1) => { mat.uniforms.t.value = t; mat.uniforms.forca.value = forca; m.visible = forca > 0.001; };
  return m;
}

// ------------------------------------------------------------------------------------------------ fogo e fumaça (sprites)
let _texFogo = null;
function texFogo() {
  if (_texFogo) return _texFogo;
  const R = mulberry32(9);
  return _texFogo = canvasTex(256, 256, (g, w, h) => {
    for (let i = 0; i < 30; i++) {
      const x = w / 2 + (R() - 0.5) * w * 0.4, y = h / 2 + (R() - 0.5) * h * 0.4, r = w * (0.12 + R() * 0.22);
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,240,200,0.55)'); gr.addColorStop(0.35, 'rgba(255,150,40,0.35)'); gr.addColorStop(1, 'rgba(120,20,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
  });
}
/** bola de fogo / chamas: n sprites que nascem em t0 num ponto (função do tempo `origem(t)`), sobem, crescem e escurecem em fumaça */
export function criarFogo(pai, { n = 40, semente = 3, vida = 1.6, tam = [0.8, 2.2], subida = 2.5, espalha = 1.2, fumaca = true } = {}) {
  const R = mulberry32(semente), G = new THREE.Group(); pai.add(G); const P = [];
  const mFogo = () => new THREE.SpriteMaterial({ map: texFogo(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false });
  const mFum = () => new THREE.SpriteMaterial({ map: texFumaca(), color: 0x2a2420, transparent: true, depthWrite: false, opacity: 0.8 });
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(mFogo()); s.renderOrder = 25; G.add(s);
    const f = fumaca ? new THREE.Sprite(mFum()) : null; if (f) { f.renderOrder = 24; G.add(f); }
    P.push({ s, f, dx: (R() - 0.5) * 2, dy: R(), dz: (R() - 0.5) * 2, fase: R(), tam: lerp(tam[0], tam[1], R()), rot: R() * 6 });
  }
  return {
    g: G,
    /** t: tempo desde o início; origem: [x,y,z]; intensidade 0..1; continuo: as partículas renascem em laço (chamas que ficam) */
    atualizar(t, origem, intensidade = 1, continuo = false) {
      G.visible = intensidade > 0.001 && t >= 0;
      for (const p of P) {
        let u = continuo ? ((t / vida + p.fase) % 1) : clamp(t / vida - p.fase * 0.3);
        const k = continuo ? u : clamp(u);
        const x = origem[0] + p.dx * espalha * (0.3 + k), y = origem[1] + p.dy * 0.3 + subida * k * (0.5 + p.dy), z = origem[2] + p.dz * espalha * (0.3 + k);
        p.s.position.set(x, y, z); p.s.scale.setScalar(p.tam * (0.4 + 1.2 * k)); p.s.material.opacity = intensidade * (1 - k) * (k < 0.08 ? k / 0.08 : 1); p.s.material.rotation = p.rot + k;
        if (p.f) { p.f.position.set(x, y + 0.6 + subida * 0.6 * k, z); p.f.scale.setScalar(p.tam * (0.8 + 2.4 * k)); p.f.material.opacity = intensidade * 0.75 * Math.sin(Math.PI * k); }
      }
    },
  };
}

// ------------------------------------------------------------------------------------------------ onda de choque (esfera que expande e some) e clarão
export function criarOnda() {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { a: { value: 0 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float a; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 3.0); gl_FragColor = vec4(vec3(0.55, 0.8, 1.0) * (0.4 + 2.0 * f), a * (0.15 + 0.85 * f)); }',
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), mat); m.renderOrder = 28; m.frustumCulled = false;
  m.userData.atualizar = (t, centro, raioMax = 9, dur = 0.6) => { const k = clamp(t / dur); m.visible = t >= 0 && k < 1; m.position.set(...centro); m.scale.setScalar(0.3 + raioMax * Math.pow(k, 0.5)); mat.uniforms.a.value = (1 - k) * 0.4; };
  return m;
}

// ------------------------------------------------------------------------------------------------ destroços (pedaços de lata branca/azul e vidro) com gravidade
export function criarDestrocos(pai, { n = 60, semente = 11 } = {}) {
  const R = mulberry32(semente), geo = new THREE.BoxGeometry(1, 0.02, 1);
  const mats = [new THREE.MeshStandardMaterial({ color: 0xf2f3f4, roughness: 0.35, metalness: 0.3 }), new THREE.MeshStandardMaterial({ color: 0x1b3c92, roughness: 0.35, metalness: 0.3 }),
    new THREE.MeshStandardMaterial({ color: 0x9cc4dc, roughness: 0.05, transparent: true, opacity: 0.6 }), new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.8 })];
  const P = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, mats[Math.floor(R() * mats.length)]); m.castShadow = true; pai.add(m);
    const dir = new THREE.Vector3(R() - 0.5, R() * 0.9 + 0.1, R() - 0.5).normalize();
    P.push({ m, v: dir.multiplyScalar(6 + R() * 14), s: [0.06 + R() * 0.45, 1, 0.05 + R() * 0.35], w: new THREE.Vector3(R() - 0.5, R() - 0.5, R() - 0.5).multiplyScalar(14), o: new THREE.Vector3((R() - 0.5) * 1.6, R() * 1.2, (R() - 0.5) * 3) });
  }
  return {
    atualizar(t, origem, vel = [0, 0, 0]) {
      for (const p of P) {
        p.m.visible = t >= 0;
        if (t < 0) continue;
        const arr = 0.25, f = (1 - Math.exp(-arr * t)) / arr;
        p.m.position.set(origem[0] + p.o.x + (p.v.x + vel[0]) * f, origem[1] + p.o.y + (p.v.y + vel[1]) * f - 4.9 * t * t, origem[2] + p.o.z + (p.v.z + vel[2]) * f);
        p.m.scale.set(...p.s); p.m.rotation.set(p.w.x * t, p.w.y * t, p.w.z * t);
      }
    },
  };
}
