// Mundo microscópico do músculo (ilustração científica em 3D):
//  · fibra muscular aberta em corte: membrana (sarcolema) translúcida com borda de luz, miofibrilas em feixe hexagonal com as faixas dos
//    sarcômeros (A escura, I clara, linha Z), retículo sarcoplasmático (rede fina em volta das miofibrilas);
//  · mitocôndrias entre as miofibrilas: membrana externa de vidro + interior laranja com cristas (lâminas) que acendem com a energia e
//    apagam uma a uma quando ela acaba; ATP (pontos dourados com brilho) indo para as miofibrilas; grânulos de glicogênio;
//  · fibras vizinhas ao fundo, partículas em suspensão e um medidor "ATP" diegético.
import * as THREE from 'three';
import { mulberry32, clamp } from '../../core/util.js';
import { canvasTex, texBrilho } from '../../core/motor.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const CENTRO = V(0, 0, -4), RFIB = 2.6;

function matMiofibrila(cor) {
  const uni = { uT: { value: 0 }, uContr: { value: 0 } };
  const m = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.42, emissive: cor, emissiveIntensity: 0.06 });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT; uniform float uContr; varying vec3 vP;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vP = position;
        vec4 b = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float onda = sin(position.x * 0.8 - uT * 10.0 + b.y * 3.0 + b.z * 2.0) * 0.5 + 0.5;
        transformed.x *= 1.0 - 0.05 * uContr * onda;                    // contração: o sarcômero encurta
        transformed.yz *= 1.0 + 0.07 * uContr * onda;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vP;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float s = fract(vP.x * 0.4);                                      // um sarcômero a cada 2,5 µm
        float A = smoothstep(0.18, 0.24, s) * (1.0 - smoothstep(0.76, 0.82, s));   // banda A (escura)
        float H = smoothstep(0.44, 0.47, s) * (1.0 - smoothstep(0.53, 0.56, s));   // zona H (mais clara no meio da A)
        float Z = 1.0 - smoothstep(0.0, 0.025, min(s, 1.0 - s));                    // linha Z
        diffuseColor.rgb *= mix(1.15, 0.62, A) * (1.0 + 0.25 * H) * (1.0 - 0.55 * Z);`);
  };
  m.userData.uni = uni; return m;
}

function matVidro(cor, op = 0.18, borda = 1.2) {
  const m = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.15, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide });
  m.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      float fr = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 2.5);
      gl_FragColor.rgb += vec3(${(cor >> 16 & 255) / 255}, ${(cor >> 8 & 255) / 255}, ${(cor & 255) / 255}) * fr * ${borda.toFixed(2)};
      gl_FragColor.a = clamp(gl_FragColor.a + fr * 0.6, 0.0, 1.0);`);
  };
  return m;
}

export function criarMicro() {
  const g = new THREE.Group(); const r = mulberry32(11);
  // fundo: degradê vinho escuro
  g.add(new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vP; void main(){ float k = smoothstep(-50.0, 60.0, vP.y); gl_FragColor = vec4(mix(vec3(0.05,0.008,0.016), vec3(0.20,0.035,0.06), k), 1.0); }' })));
  // fibras vizinhas ao fundo (cilindros com estrias), atrás da fibra aberta
  const mViz = matMiofibrila(0xa8323c);
  const geoViz = new THREE.CylinderGeometry(1, 1, 24, 40, 1, false).rotateZ(Math.PI / 2);
  const viz = new THREE.InstancedMesh(geoViz, mViz, 16); viz.frustumCulled = false; g.add(viz);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), C = new THREE.Color();
  let k = 0;
  for (let i = 0; i < 60 && k < 16; i++) {
    const a = r() * Math.PI * 2, d = 6 + r() * 10, y = Math.sin(a) * d, z = -4 + Math.cos(a) * d;
    if (z > -7.5 || Math.abs(y) < 4) continue;
    const s = 2.2 + r() * 1.0; M.compose(V(-3 + (r() - 0.5) * 6, y, z), Q.identity(), V(1, s, s)); viz.setMatrixAt(k++, M);
  }
  viz.count = k;
  // a fibra aberta: membrana (só a metade de trás + bordas do corte) e o feixe de miofibrilas
  const memb = new THREE.Mesh(new THREE.CylinderGeometry(RFIB, RFIB, 24, 72, 1, true, Math.PI * 0.2, Math.PI * 1.6).rotateZ(Math.PI / 2), matVidro(0xff8a8a, 0.22, 1.6));
  memb.position.copy(CENTRO); g.add(memb);
  const mMio = matMiofibrila(0xd24a4e);
  const geoM = new THREE.CylinderGeometry(0.27, 0.27, 24, 18, 1, false).rotateZ(Math.PI / 2);
  const posM = [];
  for (let q = -6; q <= 6; q++) for (let p = -6; p <= 6; p++) {                    // empacotamento hexagonal
    const y = (p + (q % 2) * 0.5) * 1.0, z = q * 0.866; if (Math.hypot(y, z) > RFIB - 0.40) continue; posM.push([y, z]);
  }
  const mio = new THREE.InstancedMesh(geoM, mMio, posM.length); mio.frustumCulled = false; g.add(mio);
  posM.forEach(([y, z], i) => { M.compose(V((r() - 0.5) * 0.5, y + CENTRO.y, z + CENTRO.z), Q.identity(), V(1, 1, 1)); mio.setMatrixAt(i, M); });
  // retículo sarcoplasmático: anéis finos em volta de algumas miofibrilas, na altura das linhas Z
  const geoRet = new THREE.TorusGeometry(0.36, 0.025, 6, 24).rotateY(Math.PI / 2);
  const ret = new THREE.InstancedMesh(geoRet, new THREE.MeshStandardMaterial({ color: 0xf2c6b8, roughness: 0.4, emissive: 0x803020, emissiveIntensity: 0.2 }), 400);
  ret.frustumCulled = false; g.add(ret); let kr = 0;
  for (const [y, z] of posM) for (let x = -11; x <= 11 && kr < 400; x += 2.5) { if (r() < 0.55) continue; M.compose(V(x, y + CENTRO.y, z + CENTRO.z), Q.identity(), V(1, 1, 1)); ret.setMatrixAt(kr++, M); }
  ret.count = kr;
  // mitocôndrias: casca de vidro + interior laranja + cristas (lâminas atravessadas)
  const NMI = 34, MI = [];
  for (let i = 0; i < NMI; i++) {
    // metade entre as miofibrilas (nos vãos do arranjo), metade logo abaixo da membrana
    let y, z;
    if (i % 2 === 0) { const q = Math.floor(r() * 5) - 2, pp = Math.floor(r() * 5) - 2; y = (pp + (q % 2) * 0.5) * 1.0 + 0.5; z = q * 0.866 + 0.29; }
    else { const a = Math.PI * (0.25 + r() * 1.5) + Math.PI / 2; y = Math.sin(a) * (RFIB - 0.32); z = Math.cos(a) * (RFIB - 0.32); }
    const x = 2 + (i / NMI) * 9.4 + (r() - 0.5) * 0.8;
    MI.push({ p: V(x, CENTRO.y + y, CENTRO.z + z), rot: new THREE.Euler((r() - 0.5) * 0.3, (r() - 0.5) * 0.3, (r() - 0.5) * 0.3), s: 0.62 + r() * 0.25, limiar: (i * 0.618034) % 1 });
  }
  const geoCasca = new THREE.CapsuleGeometry(0.40, 1.25, 10, 24).rotateZ(Math.PI / 2);
  const casca = new THREE.InstancedMesh(geoCasca, matVidro(0xffc890, 0.22, 1.4), NMI); casca.frustumCulled = false; g.add(casca);
  const geoMiolo = new THREE.CapsuleGeometry(0.33, 1.15, 8, 20).rotateZ(Math.PI / 2);
  const matMiolo = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, emissive: 0xff6a18, emissiveIntensity: 0.3, transparent: true, opacity: 0.6, depthWrite: false });
  const miolo = new THREE.InstancedMesh(geoMiolo, matMiolo, NMI); miolo.frustumCulled = false; g.add(miolo);
  const NCR = 9, geoCr = new THREE.CylinderGeometry(0.29, 0.29, 0.035, 20).rotateZ(Math.PI / 2);   // lâminas (cristas)
  const matCr = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, emissive: 0xff7a20, emissiveIntensity: 1 });
  const cristas = new THREE.InstancedMesh(geoCr, matCr, NMI * NCR); cristas.frustumCulled = false; g.add(cristas);
  // glicogênio (grânulos escuros em rosetas) e partículas em suspensão
  const NG = 160, glic = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.07, 1), new THREE.MeshStandardMaterial({ color: 0x5a1a20, roughness: 0.6 }), NG); glic.frustumCulled = false; g.add(glic);
  const G = []; for (let i = 0; i < NG; i++) { const a = r() * Math.PI * 2, d = r() * (RFIB - 0.3); G.push(V((r() - 0.5) * 22, CENTRO.y + Math.sin(a) * d, CENTRO.z + Math.cos(a) * d)); }
  // tampa do corte: disco escuro levemente translúcido (citoplasma) na ponta da fibra
  const tampa = new THREE.Mesh(new THREE.CircleGeometry(RFIB, 64).rotateY(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5a1520, roughness: 0.6, transparent: true, opacity: 0.55, depthWrite: false })); tampa.position.set(11.95, CENTRO.y, CENTRO.z); g.add(tampa);
  const NP = 120, poeira = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffb0a0, transparent: true, opacity: 0.35 }), NP); poeira.frustumCulled = false; g.add(poeira);
  const PP = []; for (let i = 0; i < NP; i++) PP.push(V((r() - 0.5) * 30, (r() - 0.5) * 16, -2 + r() * 10));
  // ATP: pontos dourados com brilho (sprites aditivos instanciados por pontos)
  const NA = 260, posA = new Float32Array(NA * 3), tamA = new Float32Array(NA);
  const geoA = new THREE.BufferGeometry(); geoA.setAttribute('position', new THREE.BufferAttribute(posA, 3)); geoA.setAttribute('tam', new THREE.BufferAttribute(tamA, 1));
  const matA = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { mapa: { value: texBrilho('255,214,90') } },
    vertexShader: 'attribute float tam; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = tam * 900.0 / -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform sampler2D mapa; void main(){ vec4 c = texture2D(mapa, gl_PointCoord); gl_FragColor = vec4(c.rgb * 1.6, c.a); }' });
  const atp = new THREE.Points(geoA, matA); atp.frustumCulled = false; g.add(atp);
  // medidor de ATP (diegético)
  const med = new THREE.Group(); g.add(med); med.position.set(6.5, 4.2, -9); med.rotation.y = 0.75; med.scale.setScalar(0.8);
  med.add(new THREE.Mesh(new THREE.BoxGeometry(1.2, 7.2, 0.3), new THREE.MeshStandardMaterial({ color: 0x0b1020, roughness: 0.4, transparent: true, opacity: 0.85 })));
  const barra = new THREE.Mesh(new THREE.BoxGeometry(0.9, 6.8, 0.32), new THREE.MeshBasicMaterial({ color: 0xffd23f })); med.add(barra);
  const rot = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.1), new THREE.MeshBasicMaterial({ map: canvasTex(256, 120, (c, w, h) => { c.fillStyle = '#ffd23f'; c.font = '900 92px Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ATP', w / 2, h / 2 + 4); }), transparent: true }));
  rot.position.set(0, 4.4, 0.2); med.add(rot);
  return {
    grupo: g, medidor: med,
    atualizar(t, { energia = 1, contr = 0, med: mv = 1 } = {}) {
      for (const m of [mViz, mMio]) { m.userData.uni.uT.value = t; m.userData.uni.uContr.value = contr; }
      const lig = MI.map(o => clamp((energia - o.limiar * 0.98) / 0.04));
      for (let i = 0; i < NMI; i++) {
        const o = MI[i], l = lig[i], pul = 1 + 0.035 * Math.sin(t * 3 + i) * l;
        Q.setFromEuler(o.rot); const s = o.s * pul;
        M.compose(o.p, Q, V(s, s, s)); casca.setMatrixAt(i, M); miolo.setMatrixAt(i, M);
        C.setRGB(0.35 + 0.65 * l, 0.16 + 0.32 * l, 0.12 + 0.02 * l); miolo.setColorAt(i, C);
        for (let c = 0; c < NCR; c++) {
          const off = V((c / (NCR - 1) - 0.5) * 1.2, 0, 0).multiplyScalar(s).applyQuaternion(Q);
          const ondula = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.25 * Math.sin(c * 1.7 + i), 0.2 * Math.cos(c * 2.3 + i)));
          M.compose(o.p.clone().add(off), Q.clone().multiply(ondula), V(s, s * (0.85 + 0.15 * Math.sin(c * 3.1)), s)); cristas.setMatrixAt(i * NCR + c, M);
          C.setRGB(0.3 + 0.9 * l, 0.12 + 0.48 * l, 0.06 + 0.06 * l); cristas.setColorAt(i * NCR + c, C);
        }
      }
      for (const im of [casca, miolo, cristas]) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
      const media = lig.reduce((a, b) => a + b, 0) / NMI; matCr.emissiveIntensity = 1.4 * media; matMiolo.emissiveIntensity = 0.35 * media;
      for (let i = 0; i < NG; i++) { const p = G[i]; M.compose(V(p.x + 0.05 * Math.sin(t + i), p.y, p.z), Q.identity(), V(1, 1, 1).multiplyScalar(0.6 + energia * 0.5)); glic.setMatrixAt(i, M); }
      glic.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < NP; i++) { const p = PP[i]; M.compose(V(p.x + Math.sin(t * 0.2 + i) * 0.4, p.y + Math.sin(t * 0.3 + i * 1.3) * 0.3, p.z), Q.identity(), V(1, 1, 1)); poeira.setMatrixAt(i, M); }
      poeira.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < NA; i++) {
        const o = MI[i % NMI], l = lig[i % NMI], fase = (i * 0.618034) % 1, c = (t * 0.8 + fase) % 1;
        const [y, z] = posM[(i * 7) % posM.length];
        const alvo = V(o.p.x + (c - 0.5) * 3, y + CENTRO.y, z + CENTRO.z);
        const p = o.p.clone().lerp(alvo, c); p.y += Math.sin(c * Math.PI) * 0.3;
        posA[i * 3] = p.x; posA[i * 3 + 1] = p.y; posA[i * 3 + 2] = p.z; tamA[i] = 0.5 * l * Math.sin(c * Math.PI);
      }
      geoA.attributes.position.needsUpdate = true; geoA.attributes.tam.needsUpdate = true;
      barra.scale.y = Math.max(0.001, energia); barra.position.y = -3.4 + 3.4 * energia; barra.material.color.setHSL(0.13 * clamp(energia * 1.4), 0.95, 0.55);
      med.visible = mv > 0.01; med.scale.setScalar(Math.max(0.001, mv) * 0.8);
    },
  };
}
