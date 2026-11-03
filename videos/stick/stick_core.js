/* ---------------- o stickman (com esqueleto de juntas) ---------------- */
// medidas (altura ~1.8)
const M = { hip: .95, spine: .28, chest: .2, neck: .07, head: .135, shoulderW: .2, upper: .3, fore: .27, hipW: .1, thigh: .42, shin: .42, limbR: .042 };
function makeStickman(color) {
  const mat = new THREE.MeshPhysicalMaterial({ color, roughness: .32, metalness: 0, clearcoat: .7, clearcoatRoughness: .25, sheen: .3, sheenColor: new THREE.Color(0xffffff) });
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
    const mesh = new THREE.SkinnedMesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
    root.add(mesh); root.updateMatrixWorld(true);
    mesh.bind(new THREE.Skeleton(Object.values(J)));
    J.shoulderL.rotation.z = 0; J.shoulderR.rotation.z = 0;
  }
  return { root, J, mat };
}
const A_POSE = THREE.MathUtils.degToRad(35);
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
      ['hips', W('hips'), off('hips', 0, .06, 0)], ['spine', off('spine', 0, .05, 0), W('chest')], ['chest', off('chest', -.17, .045, 0), off('chest', .17, .045, 0)],
      ['neck', W('neck'), W('head')], ['head', W('head'), off('head', 0, .26, 0)],
    ];
    for (const k of ['L', 'R']) {
      segs.push(['shoulder' + k, W('shoulder' + k), W('elbow' + k)], ['elbow' + k, W('elbow' + k), W('wrist' + k)], ['wrist' + k, W('wrist' + k), dirTo('elbow' + k, 'wrist' + k, 1.35)]);
      segs.push(['hip' + k, W('hip' + k), W('knee' + k)], ['knee' + k, W('knee' + k), W('ankle' + k)], ['ankle' + k, W('ankle' + k), off('ankle' + k, 0, -.05, .13)]);
    }
    const n = pos.length / 3, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    const p = new THREE.Vector3(), seg = new THREE.Line3(), cp = new THREE.Vector3();
    const segIdx = segs.map(([b]) => names.indexOf(b));
    for (let i = 0; i < n; i++) {
      p.fromArray(pos, i * 3);
      const ws = segs.map(([nm, a, b], j) => {
        seg.set(a, b); const tt = seg.closestPointToPointParameter(p, true); seg.at(tt, cp);
        const d = Math.max(cp.distanceTo(p), .008);
        let w = Math.pow(1 / d, 8);
        if (/shoulder|hip[LR]/.test(nm)) { const lim = nm.startsWith('hip') ? .1 : .075; if (tt < .02) w *= .02; if (d > lim) w *= .02; }   // não puxar o tronco junto com o membro
        return [segIdx[j], w]; });
      ws.sort((a, b) => b[1] - a[1]);
      const top = ws.slice(0, 4), sum = top.reduce((s, w) => s + w[1], 0);
      top.forEach(([bi, w], k) => { si[i * 4 + k] = bi; sw[i * 4 + k] = w / sum; });
    }
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    SKIN_BASE = g;
  }
  return SKIN_BASE;
}

