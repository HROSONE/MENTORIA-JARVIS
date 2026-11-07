/* ---------------- o stickman (com esqueleto de juntas) ---------------- */
// medidas (altura ~1.8)
const M = { hip: .95, spine: .28, chest: .2, neck: .07, head: .135, shoulderW: .2, upper: .3, fore: .27, hipW: .1, thigh: .42, shin: .42, limbR: .042 };
function makeStickman(color) {
  const mat = new THREE.MeshPhysicalMaterial({ color, roughness: .38, metalness: 0, clearcoat: .6, clearcoatRoughness: .3, sheen: .6, sheenColor: new THREE.Color(color).lerp(new THREE.Color(0xffffff), .6) });
  const rimCol = new THREE.Color(color).lerp(new THREE.Color(0xffffff), .35).multiplyScalar(1.6);
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uRim = { value: rimCol };
    sh.fragmentShader = 'uniform vec3 uRim;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n float fr = 1.0 - max(dot(normal, normalize(vViewPosition)), 0.0);\n totalEmissiveRadiance += uRim * pow(fr, 3.0) * .75;');
  };
  const SHOW_BONES = params.has('bones');
  const add = (parent, geo, y = 0) => { const m = new THREE.Mesh(geo, mat); m.position.y = y; m.castShadow = true; m.receiveShadow = true; m.visible = SHOW_BONES; parent.add(m); return m; };
  const joint = (parent, x, y, z = 0) => { const g = new THREE.Bone(); g.position.set(x, y, z); parent.add(g); return g; };
  const bone = (len, r0, r1 = r0) => { // osso arredondado que desce a partir da junta (eixo -y)
    const pts = [];
    for (let i = 0; i <= 24; i++) { const t = i / 24, r = r0 + (r1 - r0) * t; pts.push(new THREE.Vector2(r, -t * len)); }
    const g = new THREE.LatheGeometry(pts, 32); return g;
  };
  const ball = (r) => new THREE.SphereGeometry(r, 32, 20);
  const J = {};
  const root = new THREE.Group();
  J.hips = joint(root, 0, M.hip);
  add(J.hips, ball(.075));
  // coluna (cresce para cima)
  J.spine = joint(J.hips, 0, 0);
  const sp = add(J.spine, bone(M.spine, .05, .06)); sp.rotation.z = Math.PI;
  J.chest = joint(J.spine, 0, M.spine);
  add(J.chest, ball(.07));
  const sh = add(J.chest, new THREE.CapsuleGeometry(.045, M.shoulderW * 2 - .09, 8, 24)); sh.rotation.z = Math.PI / 2; sh.position.y = .05;
  J.neck = joint(J.chest, 0, .05);
  const nk = add(J.neck, bone(M.neck + .03, .032, .03)); nk.rotation.z = Math.PI;
  J.head = joint(J.neck, 0, M.neck);
  const hd = add(J.head, ball(M.head), M.head * .95); hd.scale.set(.94, 1.04, .98);
  // braços
  for (const s of [1, -1]) {
    const k = s > 0 ? 'L' : 'R';
    const sho = joint(J.chest, s * M.shoulderW, .05); J['shoulder' + k] = sho;
    add(sho, ball(.052));
    add(sho, bone(M.upper, M.limbR + .004, M.limbR));
    const el = joint(sho, 0, -M.upper); J['elbow' + k] = el;
    add(el, ball(M.limbR + .002));
    add(el, bone(M.fore, M.limbR, M.limbR - .006));
    const wr = joint(el, 0, -M.fore); J['wrist' + k] = wr;
    const hand = add(wr, ball(.058), -.045); hand.scale.set(.8, 1, .62);
    // pernas
    const hp = joint(J.hips, s * M.hipW, -.02); J['hip' + k] = hp;
    add(hp, ball(.058));
    add(hp, bone(M.thigh, M.limbR + .01, M.limbR + .002));
    const kn = joint(hp, 0, -M.thigh); J['knee' + k] = kn;
    add(kn, ball(M.limbR + .004));
    add(kn, bone(M.shin, M.limbR + .002, M.limbR - .004));
    const an = joint(kn, 0, -M.shin); J['ankle' + k] = an;
    const foot = add(an, new THREE.CapsuleGeometry(.045, .1, 8, 20), -.035); foot.rotation.x = Math.PI / 2; foot.position.z = .045; foot.scale.set(1, 1, .75);
  }
  // ---- pele contínua (malha com skinning) ----
  if (!params.has('bones')) {
    J.shoulderL.rotation.z = A_POSE; J.shoulderR.rotation.z = -A_POSE;
    root.updateMatrixWorld(true);
    const geo = skinGeometry(J);
    const mesh = new THREE.SkinnedMesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = false; mesh.frustumCulled = false;
    root.add(mesh); root.updateMatrixWorld(true);
    mesh.bind(new THREE.Skeleton(Object.values(J)));
    J.shoulderL.rotation.z = 0; J.shoulderR.rotation.z = 0;
  }
  // olhos grandes e verticais (filhos do osso da cabeça)
  const eyeMat = new THREE.MeshPhysicalMaterial({ color: 0x06070a, roughness: .08, clearcoat: 1, clearcoatRoughness: .05 });
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyes = [];
  for (const s of [1, -1]) {
    const e = new THREE.Group(); e.position.set(s * .056, .17, .142); e.rotation.set(-.08, s * .32, 0); J.head.add(e);
    const ball = new THREE.Mesh(new THREE.CapsuleGeometry(.026, .05, 8, 24), eyeMat); ball.scale.z = .45; e.add(ball);
    const g1 = new THREE.Mesh(new THREE.SphereGeometry(.009, 12, 8), glintMat); g1.position.set(s * -.006, .028, .011); e.add(g1);
    const g2 = new THREE.Mesh(new THREE.SphereGeometry(.0045, 10, 6), glintMat); g2.position.set(s * .008, -.012, .011); e.add(g2);
    eyes.push(e);
  }
  // aura: halo suave atrás + partículas subindo
  const haloTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.35, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(cv); return t; })();
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color: new THREE.Color(color).multiplyScalar(1.2), transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(1.5, 2.3, 1); halo.position.y = .95; halo.renderOrder = -1; root.add(halo);
  const NP = 26, pp = new Float32Array(NP * 3), pseed = Array.from({ length: NP }, () => [Math.random() * 6.28, .25 + Math.random() * .3, Math.random(), .3 + Math.random() * .5]);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const motes = new THREE.Points(pg, new THREE.PointsMaterial({ color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), .5), map: haloTex, size: .05, transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending }));
  motes.frustumCulled = false; motes.visible = false; root.add(motes);   // partículas desligadas
  const aura = (t, k = 1) => {
    halo.material.opacity = (.45 + .12 * Math.sin(t * 2.2)) * k; halo.scale.set(1.5 + .06 * Math.sin(t * 1.7), 2.3 + .08 * Math.sin(t * 1.7), 1);
    pseed.forEach(([a, r, ph, sp], i) => { const u = (t * sp * .35 + ph) % 1; pp[i * 3] = Math.cos(a + t * .4) * r; pp[i * 3 + 1] = .1 + u * 1.7; pp[i * 3 + 2] = Math.sin(a + t * .4) * r * .7; });
    pg.attributes.position.needsUpdate = true; motes.material.opacity = .9 * k;
  };
  return { root, J, mat, eyes, aura, halo, motes };
}
const A_POSE = THREE.MathUtils.degToRad(45);
let SKIN_BASE = null;
function skinGeometry(J) {
  if (!SKIN_BASE) {
    const b64 = (s, T) => { const bin = Uint8Array.from(atob(s), c => c.charCodeAt(0)); return new T(bin.buffer); };
    const pos = b64(window.SKIN.pos, Float32Array), idx = b64(window.SKIN.idx, Uint32Array);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
    // segmentos dos ossos na pose de ligação
    const names = Object.keys(J), W = (b) => J[b].getWorldPosition(new THREE.Vector3());
    const off = (b, x, y, z) => W(b).add(new THREE.Vector3(x, y, z));
    const dirTo = (b, c, k) => W(b).add(W(c).sub(W(b)).multiplyScalar(k));
    const segs = [
      ['hips', W('hips'), off('hips', 0, .06, 0)], ['spine', off('spine', 0, .05, 0), W('chest')], ['chest', off('chest', -.15, .0, 0), off('chest', .15, .0, 0)],
      ['neck', W('neck'), W('head')], ['head', W('head'), off('head', 0, .3, 0)],
    ];
    for (const k of ['L', 'R']) {
      segs.push(['shoulder' + k, W('shoulder' + k), W('elbow' + k)], ['elbow' + k, W('elbow' + k), W('wrist' + k)], ['wrist' + k, W('wrist' + k), dirTo('elbow' + k, 'wrist' + k, 1.35)]);
      segs.push(['hip' + k, W('hip' + k), W('knee' + k)], ['knee' + k, W('knee' + k), W('ankle' + k)], ['ankle' + k, W('ankle' + k), off('ankle' + k, 0, -.05, .13)]);
    }
    const n = pos.length / 3, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    const NB = names.length, full = new Float32Array(n * NB);
    const p = new THREE.Vector3(), seg = new THREE.Line3(), cp = new THREE.Vector3();
    const segIdx = segs.map(([b]) => names.indexOf(b));
    for (let i = 0; i < n; i++) {
      p.fromArray(pos, i * 3);
      const ws = segs.map(([nm, a, b], j) => {
        seg.set(a, b); const tt = seg.closestPointToPointParameter(p, true); seg.at(tt, cp);
        const d = Math.max(cp.distanceTo(p), .008);
        let w = Math.pow(1 / d, 6);
        if (/shoulder|hip[LR]/.test(nm)) { const lim = nm.startsWith('hip') ? .11 : .1; if (tt < .06) w *= .005; if (d > lim) w *= .02; }   // não puxar o tronco junto com o membro
        return [segIdx[j], w]; });
      const sum = ws.reduce((s, w) => s + w[1], 0);
      ws.forEach(([bi, w]) => { full[i * NB + bi] += w / sum; });
    }
    // suaviza os pesos ao longo da superfície (juntas sem vincos)
    const nb = Array.from({ length: n }, () => []);
    for (let f = 0; f < idx.length; f += 3) { const a = idx[f], b = idx[f + 1], cc = idx[f + 2]; nb[a].push(b, cc); nb[b].push(a, cc); nb[cc].push(a, b); }
    let cur = full, nxt = new Float32Array(n * NB);
    for (let it = 0; it < 8; it++) {
      for (let i = 0; i < n; i++) {
        const L = nb[i]; const o = i * NB;
        for (let k = 0; k < NB; k++) { let s = cur[o + k] * L.length; for (const j of L) s += cur[j * NB + k]; nxt[o + k] = s / (2 * L.length); }
      }
      [cur, nxt] = [nxt, cur];
    }
    for (let i = 0; i < n; i++) {
      const o = i * NB, arr = [];
      for (let k = 0; k < NB; k++) if (cur[o + k] > 1e-4) arr.push([k, cur[o + k]]);
      arr.sort((a, b) => b[1] - a[1]);
      const top = arr.slice(0, 4), sum = top.reduce((s, w) => s + w[1], 0);
      top.forEach(([bi, w], k) => { si[i * 4 + k] = bi; sw[i * 4 + k] = w / sum; });
    }
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    SKIN_BASE = g;
  }
  return SKIN_BASE;
}

