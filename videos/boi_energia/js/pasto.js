// Ilha de pasto no estúdio azul: disco de terra com borda irregular e capim instanciado (folhas finas que curvam e balançam no vento).
// O capim perto da boca do boi é "arrancado": as folhas dentro do raio da boca encurtam quando ele morde.
import * as THREE from 'three';
import { mulberry32 } from '../../core/util.js';

export function criarPasto({ raio = 3.2, n = 14000, semente = 7 } = {}) {
  const g = new THREE.Group();
  const r = mulberry32(semente);
  // terra: disco com borda irregular e espessura (vista de lado parece um torrão)
  const forma = new THREE.Shape(); const NB = 90;
  for (let i = 0; i <= NB; i++) { const a = i / NB * Math.PI * 2, rr = raio * (1 + 0.05 * Math.sin(a * 5) + 0.03 * Math.sin(a * 11 + 1)); const x = Math.cos(a) * rr, y = Math.sin(a) * rr; i ? forma.lineTo(x, y) : forma.moveTo(x, y); }
  const terra = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.06, bevelSegments: 3, curveSegments: 4 }),
    new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 0.95 }));
  terra.rotation.x = -Math.PI / 2; terra.position.y = -0.16; terra.receiveShadow = true; terra.castShadow = true; g.add(terra);
  const tapete = new THREE.Mesh(new THREE.CircleGeometry(raio * 1.02, 96), new THREE.MeshStandardMaterial({ color: 0x3f6b23, roughness: 0.95 }));
  tapete.rotation.x = -Math.PI / 2; tapete.position.y = 0.045; tapete.receiveShadow = true; g.add(tapete);
  // folha de capim: tira afinando, 5 segmentos, base na origem, sobe em +Y
  const folha = new THREE.BufferGeometry(); const P = [], I = [], H = [];
  const S = 5;
  for (let i = 0; i <= S; i++) { const v = i / S, w = 0.005 * (1 - v * 0.92); P.push(-w, v, 0, w, v, 0); H.push(v, v); }
  for (let i = 0; i < S; i++) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  folha.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); folha.setAttribute('alt', new THREE.Float32BufferAttribute(H, 1)); folha.setIndex(I); folha.computeVertexNormals();
  const uni = { uT: { value: 0 }, uBoca: { value: new THREE.Vector4(0, -10, 0, 0.0) } };
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, side: THREE.DoubleSide });
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
      attribute float alt; uniform float uT; uniform vec4 uBoca; varying float vAlt;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vAlt = alt;
        vec3 base = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        float ph = base.x * 1.7 + base.z * 2.3;
        float vento = sin(uT * 1.6 + ph) * 0.5 + sin(uT * 3.7 + ph * 2.1) * 0.25;
        // mordida: dentro do raio da boca a folha fica curta (o boi arrancou)
        float dB = distance(base.xz, uBoca.xz); float corte = mix(1.0, 0.25, uBoca.w * (1.0 - smoothstep(0.08, 0.20, dB)));
        transformed.y *= corte;
        float cur = alt * alt;
        transformed.x += cur * (0.10 + 0.06 * vento);
        transformed.z += cur * 0.03 * vento;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vAlt;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb *= mix(vec3(0.20, 0.32, 0.10), vec3(0.62, 0.80, 0.30), vAlt);`);
  };
  const capim = new THREE.InstancedMesh(folha, mat, n); capim.frustumCulled = false; capim.castShadow = false; capim.receiveShadow = true;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), cor = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = raio * Math.sqrt(r()) * 0.98;
    const x = Math.cos(a) * d, z = Math.sin(a) * d, h = 0.22 + r() * 0.20;            // braquiária: 22–42 cm
    E.set((r() - 0.5) * 0.4, r() * Math.PI * 2, (r() - 0.5) * 0.4); Q.setFromEuler(E);
    M.compose(new THREE.Vector3(x, 0.04, z), Q, new THREE.Vector3(1 + r() * 0.6, h, 1)); capim.setMatrixAt(i, M);
    cor.setHSL(0.24 + r() * 0.06, 0.55 + r() * 0.2, 0.45 + r() * 0.2); capim.setColorAt(i, cor);
  }
  g.add(capim);
  return { grupo: g, atualizar(t, boca = null, mordida = 0) { uni.uT.value = t; if (boca) uni.uBoca.value.set(boca.x, boca.y, boca.z, mordida); else uni.uBoca.value.w = 0; } };
}
