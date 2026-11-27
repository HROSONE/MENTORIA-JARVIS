// Boi Nelore do canal (biblioteca3d/animais/boi/boi.glb) no vídeo: poses por ossos (pastar, mastigar, cauda, orelhas, queda),
// pelo curto no shader (ruído fino na normal), modo raio-x (pele de vidro) com os 4 estômagos e o bolo de capim descendo.
// Coordenadas do boi (Three): frente +X, cima +Y, lado esquerdo do boi = -Z. Origem no chão, no meio do corpo.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clamp, lerp, inv, suave } from '../../core/util.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const EZ = V(0, 0, 1), EY = V(0, 1, 0), EX = V(1, 0, 0);

// pelo curto: ruído fino somado à normal (o pelo do Nelore é curto e brilha de leve), sem textura
function pelo(mat) {
  mat.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vPosL;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvPosL = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vPosL;
      float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
        return mix(mix(mix(h3(i), h3(i+vec3(1,0,0)), f.x), mix(h3(i+vec3(0,1,0)), h3(i+vec3(1,1,0)), f.x), f.y),
                   mix(mix(h3(i+vec3(0,0,1)), h3(i+vec3(1,0,1)), f.x), mix(h3(i+vec3(0,1,1)), h3(i+vec3(1,1,1)), f.x), f.y), f.z); }`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { vec3 q = vPosL * vec3(260.0, 90.0, 260.0);                       // fios curtos deitados para trás e para baixo
          float a = n3(q), b = n3(q + 17.3), c = n3(vPosL * 22.0);
          normal = normalize(normal + vec3(a - 0.5, b - 0.5, (a - b)) * 0.16 + vec3(c - 0.5) * 0.08); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb *= 0.92 + 0.16 * n3(vPosL * 140.0) - 0.06 * n3(vPosL * 6.0);`);
  };
  mat.customProgramCacheKey = () => 'pelo';
}

export class Boi {
  async carregar(url) {
    const g = await new GLTFLoader().loadAsync(url);
    this.grupo = new THREE.Group(); this.grupo.add(g.scene);
    this.ossos = {}; this.rest = {}; this.malhas = [];
    g.scene.traverse(o => {
      if (o.isBone) { this.ossos[o.name] = o; this.rest[o.name] = o.quaternion.clone(); }
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
        if (o.material.name === 'pelo_nelore') { o.material.roughness = 0.68; o.material.sheen = 0.4; pelo(o.material); }
        o.userData.mat0 = o.material; this.malhas.push(o);
      }
    });
    this.ordem = [];                                                   // ossos na ordem pai → filho
    g.scene.traverse(o => { if (o.isBone) this.ordem.push(o.name); });
    this._construirRaioX();
    return this;
  }
  /** gira um osso em volta de um eixo dado no espaço do BOI (não do osso), sobre a pose atual */
  girar(nome, eixo, ang) {
    const b = this.ossos[nome]; if (!b || !ang) return;
    const qp = new THREE.Quaternion(); b.parent.getWorldQuaternion(qp);
    const qb = new THREE.Quaternion(); this.grupo.getWorldQuaternion(qb);
    const eixoMundo = eixo.clone().applyQuaternion(qb);
    const local = eixoMundo.applyQuaternion(qp.invert());
    b.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(local.normalize(), ang));
    b.updateMatrixWorld(true);
  }
  /** pose a partir do estado (tudo função do tempo, sem acúmulo) */
  pose(t, { pastar = 0, mastigar = 0, cauda = 1, orelha = 1, queda = 0, respira = 1, morto = 0 } = {}) {
    for (const n of this.ordem) this.ossos[n].quaternion.copy(this.rest[n]);
    this.grupo.updateMatrixWorld(true);
    const vivo = 1 - morto;
    // respiração: o peito sobe e desce de leve
    this.girar('coluna', EZ, Math.sin(t * 1.6) * 0.008 * respira * vivo);
    // pastar: pescoço desce, cabeça vira para o capim, balança um pouco procurando
    const p = suave(pastar);
    const A = [-0.9, -0.1, 0.2, -0.08];                                // boca no capim (~0,35 m)
    this.girar('peito', EZ, A[3] * p);
    this.girar('pescoco1', EZ, A[0] * p + 0.04 * Math.sin(t * 0.7) * p * vivo);
    this.girar('pescoco2', EZ, A[1] * p);
    this.girar('cabeca', EZ, A[2] * p + 0.06 * Math.sin(t * 1.3) * p * vivo);
    this.girar('pescoco1', EY, 0.10 * Math.sin(t * 0.45) * p * vivo);
    // mastigar: ruminante mói de lado (a mandíbula vai e volta e desliza para o lado)
    const m = mastigar * vivo, f = t * 2 * Math.PI * 1.35;
    this.girar('mandibula', EZ, -(0.05 + 0.05 * Math.sin(f)) * m);
    this.girar('mandibula', EY, 0.05 * Math.sin(f + 1.2) * m);
    // cauda espantando mosca e orelhas mexendo
    const c = cauda * vivo;
    for (let k = 1; k <= 4; k++) this.girar('cauda' + k, EX, (0.10 + 0.06 * k) * Math.sin(t * 2.1 - k * 0.6) * c * Math.max(0, Math.sin(t * 0.55)));
    for (const [l, s] of [['l', 1], ['r', -1]]) {
      this.girar('orelha_' + l, EX, s * 0.25 * orelha * vivo * Math.max(0, Math.sin(t * 1.7 + s)) ** 6);
    }
    // queda (abate): os joelhos cedem e o corpo tomba de lado, cabeça e pescoço soltos
    if (queda > 0) {
      const k1 = suave(inv(0, 0.4, queda)), k2 = suave(inv(0.3, 1, queda));
      for (const l of ['l', 'r']) {
        this.girar('ombro_' + l, EZ, 0.55 * k1); this.girar('antebraco_' + l, EZ, -1.6 * k1); this.girar('canela_d_' + l, EZ, 0.9 * k1);
        this.girar('coxa_' + l, EZ, -0.55 * k1); this.girar('perna_' + l, EZ, 1.1 * k1); this.girar('canela_t_' + l, EZ, -0.7 * k1);
      }
      this.girar('pescoco1', EZ, -0.25 * k2); this.girar('cabeca', EZ, -0.2 * k2);
      for (let k = 1; k <= 4; k++) this.girar('cauda' + k, EZ, -0.15 * k2);
    }
  }
  /** posição do corpo na queda: desce (joelhos cedem) e tomba para o lado direito do boi (+Z) */
  colocar(x, z, ry, queda = 0) {
    const k1 = suave(inv(0, 0.4, queda)), k2 = suave(inv(0.3, 1, queda)) ** 1.3;
    const g = this.grupo; g.position.set(x, 0, z); g.rotation.set(0, ry, 0);
    if (queda > 0) {
      g.position.y = -0.38 * k1;
      // tomba em volta de uma aresta no chão do lado direito (z = +0.30 no boi)
      const piv = V(0, 0, 0.30).applyAxisAngle(EY, ry);
      const rot = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0).applyAxisAngle(EY, ry), 1.35 * k2);
      const off = g.position.clone().sub(g.position.clone().add(piv)).applyQuaternion(rot).add(g.position.clone().add(piv));
      g.quaternion.premultiply(rot); g.position.copy(off); g.position.y += 0.12 * k2;
    }
    g.updateMatrixWorld(true);
  }
  /** ponto da boca no mundo (para o capim e o bolo alimentar) */
  boca() { const b = this.ossos.mandibula; return b.localToWorld(V(0, 0.25, 0)); }
  // ---------------------------------------------------------------------------------------------- raio-x: pele de vidro e estômagos
  _construirRaioX() {
    this.vidro = new THREE.MeshStandardMaterial({ color: 0xcfe6ff, roughness: 0.2, metalness: 0, transparent: true, opacity: 0.22, depthWrite: false, emissive: 0x6fa8ff, emissiveIntensity: 0.3 });
    this.vidro.onBeforeCompile = sh => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
        float fr = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 2.2);
        gl_FragColor.rgb += vec3(0.55, 0.8, 1.0) * fr * 1.1; gl_FragColor.a = clamp(gl_FragColor.a + fr * 0.75, 0.0, 1.0);`);
    };
    const R = this.org = new THREE.Group(); R.visible = false; this.grupo.add(R);
    // órgão: relevo (papilas e dobras) por ruído no vértice, cor manchada e borda de luz
    const matOrgao = (cor, papila) => {
      const m = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.5, emissive: cor, emissiveIntensity: 0.25, transparent: true, opacity: 0.8 });
      m.onBeforeCompile = sh => {
        const R = 'float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); } float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f); return mix(mix(mix(h3(i), h3(i+vec3(1,0,0)), f.x), mix(h3(i+vec3(0,1,0)), h3(i+vec3(1,1,0)), f.x), f.y), mix(mix(h3(i+vec3(0,0,1)), h3(i+vec3(1,0,1)), f.x), mix(h3(i+vec3(0,1,1)), h3(i+vec3(1,1,1)), f.x), f.y), f.z); }';
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vO; ' + R).replace('#include <begin_vertex>', `#include <begin_vertex>
          vO = position; transformed += normal * (n3(position * 6.0) - 0.5) * 0.12 + normal * (n3(position * ${papila.toFixed(1)}) - 0.5) * 0.05;`);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vO; ' + R).replace('#include <color_fragment>', `#include <color_fragment>
          diffuseColor.rgb *= 0.75 + 0.45 * n3(vO * 5.0) - 0.25 * smoothstep(0.6, 0.9, n3(vO * ${papila.toFixed(1)}));`)
          .replace('#include <dithering_fragment>', `#include <dithering_fragment>
          float fr = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 2.0); gl_FragColor.rgb += vec3(1.0, 0.9, 0.7) * fr * 0.35;`);
      };
      return m;
    };
    const org = (geo, cor, pos, esc = [1, 1, 1], rot = [0, 0, 0], papila = 30) => {
      const m = new THREE.Mesh(geo, matOrgao(cor, papila));
      m.position.set(...pos); m.scale.set(...esc); m.rotation.set(...rot); R.add(m); return m;
    };
    const esf = new THREE.SphereGeometry(1, 96, 64);
    // rúmen (o maior, do lado esquerdo), retículo, omaso e abomaso (o estômago "verdadeiro"); intestino enrolado atrás
    this.rumen = org(esf, 0x7d8f4a, [-0.05, 0.95, -0.10], [0.36, 0.24, 0.18], [0, 0, 0], 55);   // rúmen: parede com papilas
    this.reticulo = org(esf, 0x8e9a58, [0.30, 0.86, -0.04], [0.12, 0.11, 0.11], [0, 0, 0], 90);   // retículo: 'favo de mel'
    this.omaso = org(esf, 0xc9a35a, [0.30, 0.80, 0.12], [0.12, 0.11, 0.11]);
    this.abomaso = org(esf, 0xe08a7a, [0.10, 0.74, 0.16], [0.26, 0.085, 0.09], [0, 0, 0.25]);
    const pts = []; for (let i = 0; i <= 160; i++) { const u = i / 160, a = u * Math.PI * 14; pts.push(V(-0.25 - 0.32 * u + 0.08 * Math.sin(a), 0.92 + 0.14 * Math.cos(a * 0.5), 0.13 + 0.09 * Math.cos(a))); }
    this.intestino = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.028, 10), new THREE.MeshStandardMaterial({ color: 0xe6a39a, roughness: 0.5, emissive: 0xe6a39a, emissiveIntensity: 0.3 }));
    R.add(this.intestino);
    // esôfago (tubo) e o bolo de capim: a curva é refeita a cada quadro (a cabeça mexe)
    this.esofagoMat = new THREE.MeshStandardMaterial({ color: 0xf0b0a0, roughness: 0.5, emissive: 0xf0b0a0, emissiveIntensity: 0.4, transparent: true, opacity: 0.85 });
    this.esofago = new THREE.Mesh(new THREE.BufferGeometry(), this.esofagoMat); this.grupo.add(this.esofago); this.esofago.visible = false;
    this.bolo = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 14), new THREE.MeshStandardMaterial({ color: 0x8bd14a, emissive: 0x6fd12a, emissiveIntensity: 1.2, roughness: 0.6 }));
    this.bolo.visible = false; this.grupo.add(this.bolo);
    // bolhas da fermentação no rúmen e faíscas de energia indo para os músculos
    const nb = 60; this.bolhas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: 0xe6ffb0, transparent: true, opacity: 0.8 }), nb);
    this.bolhas.frustumCulled = false; R.add(this.bolhas);
    const ne = 90; this.energia = new THREE.InstancedMesh(new THREE.SphereGeometry(0.014, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }), ne);
    this.energia.frustumCulled = false; R.add(this.energia);
    // destinos da energia: músculos do quarto traseiro, da paleta e do lombo
    this.musculos = [V(-0.75, 1.0, 0.18), V(-0.70, 0.85, -0.18), V(0.50, 0.95, 0.18), V(0.50, 0.9, -0.18), V(-0.25, 1.25, 0.1), V(0.1, 1.25, -0.1)];
  }
  /** curva do alimento: boca → esôfago (ao longo do pescoço) → rúmen, no espaço do boi */
  curvaAlimento() {
    const inv_ = this.grupo.matrixWorld.clone().invert();
    const loc = o => o.getWorldPosition(V()).applyMatrix4(inv_);
    const P = [this.boca().applyMatrix4(inv_), loc(this.ossos.cabeca).add(V(0, -0.08, 0)), loc(this.ossos.pescoco2).add(V(0, -0.10, 0)), loc(this.ossos.pescoco1).add(V(0, -0.12, 0)),
               V(0.55, 1.02, -0.06), V(0.38, 1.0, -0.08), V(0.15, 1.0, -0.10)];
    return new THREE.CatmullRomCurve3(P, false, 'centripetal');
  }
  /** raio-x ligado (0..1) e o caminho do alimento (u: 0 boca → 1 rúmen; dig: 0..1 digestão; en: 0..1 energia indo para os músculos) */
  raioX(t, k, { u = 0, dig = 0, en = 0 } = {}) {
    const on = k > 0.01;
    for (const m of this.malhas) {
      if (!on) { m.material = m.userData.mat0; m.castShadow = true; continue; }
      m.material = this.vidro; m.castShadow = false;
    }
    this.vidro.opacity = 0.22 * k;
    this.org.visible = on; this.esofago.visible = on; this.bolo.visible = on && u > 0 && u < 1.02;
    if (!on) return;
    for (const o of this.org.children) if (o.material) { o.material.opacity = 0.82 * k; o.material.transparent = true; }
    const cur = this.curvaAlimento();
    this.esofago.geometry.dispose(); this.esofago.geometry = new THREE.TubeGeometry(cur, 80, 0.032, 10);
    this.esofagoMat.opacity = 0.85 * k;
    if (u > 0 && u < 1.02) { const p = cur.getPointAt(clamp(u)); this.bolo.position.copy(p); this.bolo.scale.setScalar(1 + 0.25 * Math.sin(t * 9)); }
    // rúmen pulsando (contrações que misturam o capim) e bolhas subindo durante a digestão
    const pul = 1 + 0.03 * Math.sin(t * 5) * dig;
    this.rumen.scale.set(0.36 * pul, 0.24 * pul, 0.18 * pul);
    this.rumen.material.emissiveIntensity = 0.35 + 0.5 * dig * (0.5 + 0.5 * Math.sin(t * 6));
    const M = new THREE.Matrix4();
    for (let i = 0; i < this.bolhas.count; i++) {
      const fase = (i * 0.618) % 1, c = ((t * 0.35 + fase) % 1);
      const x = -0.05 + (((i * 37) % 100) / 100 - 0.5) * 0.7, z = -0.10 + (((i * 53) % 100) / 100 - 0.5) * 0.3;
      const y = 0.75 + c * 0.42, s = dig * Math.sin(c * Math.PI);
      M.makeScale(s, s, s).setPosition(x, y, z); this.bolhas.setMatrixAt(i, M);
    }
    this.bolhas.instanceMatrix.needsUpdate = true;
    // energia: pontos dourados saindo do abomaso/intestino pelos vasos até os músculos
    const orig = V(0.0, 0.8, 0.12);
    for (let i = 0; i < this.energia.count; i++) {
      const alvo = this.musculos[i % this.musculos.length], fase = (i * 0.381966) % 1, c = (t * 0.6 + fase) % 1;
      const p = orig.clone().lerp(alvo, c); p.y += Math.sin(c * Math.PI) * 0.08;
      const s = en * (c < 0.9 ? 1 : (1 - c) * 10);
      M.makeScale(s, s, s).setPosition(p.x, p.y, p.z); this.energia.setMatrixAt(i, M);
    }
    this.energia.instanceMatrix.needsUpdate = true;
  }
}
