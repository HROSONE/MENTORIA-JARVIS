// =====================================================================
// VÍDEO 3D — "O homem que morou 18 anos no aeroporto" (61,6 s)
// Cenas: T (Terminal 1), P (passado: estação de Paris + imigração de Londres), K (céu)
// window.__seek(t) desenha o quadro do instante t.
// =====================================================================
const TOTAL = 62.0; window.__total = TOTAL;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x)); const ease = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const seg = (t, a, b) => ease((t - a) / (b - a)); const lin = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const lerp = (a, b, k) => a + (b - a) * k; const L3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
function mixV(a, b, k) {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * k;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => mixV(v, b[i] == null ? v : b[i], k));
  if (a && b && typeof a === 'object' && typeof b === 'object') { const o = {}; for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) o[key] = a[key] === undefined ? b[key] : b[key] === undefined ? a[key] : mixV(a[key], b[key], k); return o; }
  return k < .5 ? a : b;
}
const DEF = () => ({ yaw: 0, pos: [0, 0, 0], lean: 0, roll: 0, spine: [0, 0, 0], chest: [0, 0, 0], neck: [0, 0, 0], head: [0, 0, 0] });
// pose "normalizada": tudo explícito (mãos em coordenadas do mundo) para poder misturar duas poses sem saltos
function norm(tipo, pose) {
  const p = Object.assign(DEF(), pose); const J = RIG.build(tipo, p).J; const inv = M.ry(-p.yaw); const loc = v => M.ap(inv, V.sub(v, p.pos));
  p.pel = loc(J.pel); delete p.pelvisY;
  for (const s of ['L', 'R']) { const A = p['arm' + s] || {}; p['arm' + s] = { w: J['wr' + s], hdW: J['hd' + s], palmW: J['palm' + s], poleW: J['pole' + s], hand: A.hand || 'relax' };
    const G = p['leg' + s] || {}, sg = s === 'L' ? 1 : -1; p['leg' + s] = { t: loc(J['ank' + s]), pole: G.pole || [sg * .15, 0, 1], fwd: G.fwd || [sg * .12, 0, 1] }; }
  return p;
}
function poseAt(keys, t) { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) return mixV(keys[i - 1][1], keys[i][1], seg(t, keys[i - 1][0], keys[i][0])); return keys[keys.length - 1][1]; }
const yawTo = (a, b) => Math.atan2(b[0] - a[0], b[2] - a[2]) * 180 / Math.PI;
const dist2 = (a, b) => Math.hypot(b[0] - a[0], b[2] - a[2]);
const wrapA = a => ((a + 540) % 360) - 180;
// caminhada entre dois pontos do chão
function walkSeg(from, to, t0, sp, t, extra) { const d = dist2(from, to), T = d / sp, u = clamp((t - t0) / T, 0, 1); const pos = [lerp(from[0], to[0], u), 0, lerp(from[2], to[2], u)];
  return { pose: PO.walk(u * d / 90, Object.assign({ yaw: yawTo(from, to), pos }, extra || {})), pos, yaw: yawTo(from, to), tEnd: t0 + T, u }; }

// ---------------------------------------------------------------- cenas
const sceneT = new THREE.Scene(), sceneP = new THREE.Scene(), sceneK = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 8, 20000);
const fadeM = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false, fog: false });
const fadeQ = new THREE.Mesh(new THREE.PlaneGeometry(4, 8), fadeM); fadeQ.position.z = -9; fadeQ.renderOrder = 999; camera.add(fadeQ);
const dyn = { T: new THREE.Group(), P: new THREE.Group(), K: new THREE.Group() }; sceneT.add(dyn.T, camera); sceneP.add(dyn.P); sceneK.add(dyn.K);
const BTEX = {}; const btex = s => BTEX[s] || (BTEX[s] = boardTex(s));
function boardDyn() { const g = new THREE.Group(); g.add(rbox(376, 206, 22, 4, std('#2a2d33', { roughness: .5 }), 0, 0, 0)); const m = unlit(btex('1988')); g.add(plane(360, 190, m, 0, 0, 11.4)); for (const x of [-120, 120]) g.add(mesh(new THREE.CylinderGeometry(1.5, 1.5, 700, 8), std('#555'), x, 453, 0)); g.userData.m = m; return g; }
function mkLights(scene, o) { o = o || {}; scene.add(new THREE.HemisphereLight(o.sky || '#fff3dc', o.ground || '#b9a98c', o.hemi == null ? 1.05 : o.hemi));
  const key = new THREE.DirectionalLight(o.keyC || '#ffe2b8', 2.2); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); const c = key.shadow.camera, R = o.sr || 620; c.left = -R; c.right = R; c.top = R; c.bottom = -R; c.near = 50; c.far = 2600; key.shadow.bias = -0.0006; key.shadow.normalBias = 1.2; key.shadow.radius = 6; scene.add(key, key.target);
  const back = new THREE.DirectionalLight('#ffb878', 1.6); back.position.set(-400, 420, -600); scene.add(back);
  const at = (x, y, z) => { key.position.set(x + 320, y + 620, z + 380); key.target.position.set(x, y, z); }; at(0, 0, 0); return at; }

// ---- Terminal 1
const TS = { boards: [], pile: [], tube: [] };
(function buildTerminal() {
  const scene = sceneT; scene.background = new THREE.Color('#d9cfbd'); scene.fog = new THREE.Fog('#e6dccb', 2600, 9000);
  const ft = floorTex(); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(70, 70);
  const fl = plane(8400, 8400, std('#fff', { map: ft, roughness: .22, envMapIntensity: .9 })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  const shopT = svgTex(svgWrap(SET.shopRow(), '-1500 -440 3000 440', 3000, 440), 3000, 440); const wallM = std('#fff', { map: shopT, roughness: .9, envMapIntensity: .1 });
  const at = svgTex(svgWrap(SET.atrium(0), '-6000 -5200 12000 5200', 3000, 1300), 3000, 1300); const atM = unlit(at, { fog: true });
  for (let i = 0; i < 4; i++) { const g = new THREE.Group(); g.add(plane(3200, 440, wallM, 0, 220, -1500)); g.add(plane(12000, 5200, atM, 0, 2600, -4200)); const b = brand3d(250); b.position.set(-60, 352, -1492); g.add(b);
    const bd = boardDyn(); bd.position.set(i === 0 ? 110 : 0, 400, -640); g.add(bd); TS.boards.push(bd); g.rotation.y = i * Math.PI / 2; scene.add(g); }
  const glass = new THREE.MeshPhysicalMaterial({ color: '#e8f3f8', roughness: .08, transparent: true, opacity: .32, envMap: ENV, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false });
  const ringM = std('#aeb6bd', { metalness: .7, roughness: .35 }), pm = std('#3e4a63');
  const tube = (a, b, r, dir) => { const A = v3(a), B = v3(b), d = B.clone().sub(A), Ln = d.length(); const g = new THREE.Group(); g.position.copy(A).addScaledVector(d, .5); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    g.add(mesh(new THREE.CylinderGeometry(r, r, Ln, 28, 1, true), glass, 0, 0, 0, { noCast: 1 }));
    for (let u = -Ln / 2; u <= Ln / 2; u += r * 1.1) { const ring = mesh(new THREE.TorusGeometry(r, 7, 8, 32), ringM, 0, u, 0, { noCast: 1 }); ring.rotation.x = Math.PI / 2; g.add(ring); }
    g.add(mesh(new THREE.BoxGeometry(r * 1.2, Ln, r * .25), std('#6f7780'), 0, 0, 0, { noCast: 1 })); scene.add(g);
    for (let i = 0; i < 8; i++) { const m = mesh(new THREE.CapsuleGeometry(16, 100, 4, 10), pm, 0, 0, 0, { noCast: 1 }); scene.add(m); TS.tube.push({ m, A, d, i, dir }); } };
  tube([-2400, 420, -2500], [700, 2100, -3300], 125, 1); tube([2500, 900, -2700], [-600, 2900, -3500], 125, -1); tube([-2000, 2000, -3000], [1600, 3900, -3700], 125, 1);
  scene.add(bench3d(3));
  const it = [[-150, -95, 70, 55, 50, .1, { label: 'JORNAIS' }, 0, .08], [150, -92, 64, 50, 48, .2, {}, 0, -.1], [-150, -95, 60, 46, 44, .35, { papers: 1 }, 55, -.12], [-62, -110, 66, 58, 50, .3, { label: '1993' }, 0, .05], [72, -108, 72, 62, 52, .45, { label: 'REVISTAS' }, 0, -.04],
    [150, -92, 58, 44, 42, .5, {}, 50, .15], [-62, -110, 60, 48, 44, .6, { label: 'DIÁRIO' }, 58, -.1], [72, -108, 64, 46, 46, .7, { papers: 1 }, 62, .1], [-245, -60, 76, 64, 56, .65, {}, 0, .3], [248, -55, 70, 60, 54, .75, { label: 'LIVROS' }, 0, -.3], [-245, -60, 62, 50, 46, .85, {}, 64, .45],
    [-150, -95, 52, 40, 40, .8, {}, 101, .2], [248, -55, 60, 48, 46, .92, { papers: 1 }, 60, -.2], [4, -150, 70, 60, 50, .88, {}, 0, 0], [4, -150, 60, 50, 44, .95, { label: '2004' }, 60, .1]];
  const addP = (m, x, z, y, ry, thr) => { m.position.set(x, y || 0, z); m.rotation.y = ry || 0; scene.add(m); TS.pile.push({ m, y: y || 0, at: 23.6 + thr * 10.2 }); };
  it.forEach(a => addP(carton(a[2], a[3], a[4], a[6]), a[0], a[1], a[7], a[8], a[5]));
  addP(suitcase3d(40, 60, 24, '#7a5f49'), 196, -28, 0, -.3, .4); addP(papers3d(34, 30, 26), -182, 40, 0, .3, .55); addP(papers3d(36, 42, 26), 188, 40, 0, -.2, .75); addP(papers3d(32, 22, 24), 230, 56, 0, .3, .78); addP(suitcase3d(46, 56, 26, '#3e8a66'), 300, 24, 0, -.5, .9);
  TS.blue = suitcase3d(44, 70, 26, '#3f79ad'); scene.add(TS.blue);
  const pt = svgTex(svgWrap(PR.poster(0, 0, 30, 42, 0), '-16 -22 32 44', 320, 440), 320, 440); TS.poster = plane(30, 42, std('#fff', { map: pt, roughness: .6 }), 0, 36, 13.5); TS.poster.rotation.z = -.05; TS.blue.add(TS.poster);
  TS.light = mkLights(scene);
})();
// ---- passado: estação (origem) e Londres (x = LX)
const LX = 5000; const N0 = [130, 0, -260]; const PS = {};
(function buildPast() {
  const scene = sceneP; scene.background = new THREE.Color('#e9d5b0'); scene.fog = new THREE.Fog('#ecd9b6', 900, 3200);
  const fl = plane(4000, 6000, std('#c9ac80', { roughness: .8 })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  const tr = new THREE.Group(); tr.add(rbox(2600, 330, 260, 40, std('#5f6f5c', { roughness: .5 }), 0, 215, 0)); const win = unlit(canvasTex(8, 8, c => { c.fillStyle = '#f2deb0'; c.fillRect(0, 0, 8, 8); }));
  for (let i = -6; i <= 6; i++) { tr.add(plane(140, 110, win, i * 200, 270, 131)); const wh = mesh(new THREE.CylinderGeometry(38, 38, 20, 20), std('#2e2a24'), i * 200 + 60, 38, 120); wh.rotation.x = Math.PI / 2; tr.add(wh); } tr.position.set(0, 0, -900); scene.add(tr);
  for (let i = -5; i <= 5; i++) { scene.add(mesh(new THREE.CylinderGeometry(9, 9, 900, 10), std('#6b5435'), i * 420, 450, -1180)); scene.add(mesh(new THREE.TorusGeometry(210, 8, 8, 24, Math.PI), std('#6b5435'), i * 420 + 210, 900, -1180)); }
  scene.add(plane(5000, 3000, unlit(canvasTex(8, 64, c => { const g = c.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, '#f1dfbd'); g.addColorStop(1, '#cfae7c'); c.fillStyle = g; c.fillRect(0, 0, 8, 64); }), { fog: true }), 0, 1200, -1800));
  const ck = new THREE.Group(); const rim = mesh(new THREE.CylinderGeometry(62, 62, 14, 40), std('#3a2c1c')); rim.rotation.x = Math.PI / 2; ck.add(rim);
  const face = canvasTex(512, 512, c => { c.fillStyle = '#f7efdc'; c.beginPath(); c.arc(256, 256, 250, 0, 7); c.fill(); c.translate(256, 256); c.fillStyle = '#3a2c1c'; for (let i = 0; i < 12; i++) { c.fillRect(-7, -236, 14, 40); c.rotate(Math.PI / 6); } c.font = '48px Georgia'; c.textAlign = 'center'; c.fillText('PARIS', 0, 120); c.rotate(1.05); c.fillStyle = '#111'; c.fillRect(-9, -190, 18, 200); c.rotate(4); c.fillRect(-13, -130, 26, 140); });
  ck.add(plane(112, 112, unlit(face, { transparent: true }), 0, 0, 7.4)); ck.add(mesh(new THREE.CylinderGeometry(2.5, 2.5, 600, 8), std('#3a2c1c'), 0, 362, 0)); ck.position.set(380, 300, -520); scene.add(ck);
  const bd = boardDyn(); bd.position.set(110, 400, -640); scene.add(bd); bd.userData.m.map = btex('1988');
  PS.case = briefcase3d(); scene.add(PS.case);
  PS.q = plane(84, 42, unlit(canvasTex(260, 130, c => { c.setLineDash([16, 12]); c.strokeStyle = '#7a5a30'; c.lineWidth = 8; c.strokeRect(8, 8, 244, 114); c.fillStyle = '#7a5a30'; c.font = '900 84px Arial'; c.textAlign = 'center'; c.fillText('?', 130, 96); }), { transparent: true })); PS.q.rotation.x = -Math.PI / 2; scene.add(PS.q);
  // Londres
  const g = new THREE.Group(); g.position.x = LX; scene.add(g); const ft = floorTex(); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(40, 40);
  const lf = plane(4800, 4800, std('#eef0f2', { map: ft, roughness: .25, envMapIntensity: .9 }), 0, .5, 0); lf.rotation.x = -Math.PI / 2; g.add(lf);
  const wt = canvasTex(2048, 512, (c, w, h) => { c.fillStyle = '#d9dde3'; c.fillRect(0, 0, w, h); c.fillStyle = '#c3c8cf'; for (let i = 0; i < 12; i++) c.fillRect(i * 180, 60, 8, h); c.fillStyle = '#1f3c6e'; c.fillRect(0, 0, w, 64); c.fillStyle = '#fff'; c.font = '700 40px Arial'; c.textAlign = 'center'; c.fillText('L O N D O N   ·   I M M I G R A T I O N', w / 2, 46); });
  g.add(plane(2400, 600, std('#fff', { map: wt, roughness: .9 }), 60, 300, -420)); g.add(plane(6000, 3000, unlit(canvasTex(4, 4, c => { c.fillStyle = '#dfe3e8'; c.fillRect(0, 0, 4, 4); })), 0, 1500, -430)); const sw = plane(4000, 3000, unlit(canvasTex(4, 4, c => { c.fillStyle = '#d3d8de'; c.fillRect(0, 0, 4, 4); })), -1400, 1500, 0); sw.rotation.y = Math.PI / 2; g.add(sw);
  const dk = new THREE.Group(); dk.add(rbox(70, 104, 190, 3, std('#e9ecef', { roughness: .5 }), 0, 52, 0)); dk.add(rbox(80, 8, 200, 2, std('#9aa3ac', { roughness: .4 }), 0, 108, 0)); dk.add(box(71, 6, 191, std('#1f3c6e'), 0, 46, 0));
  const pt = canvasTex(512, 128, c => { c.fillStyle = '#e9ecef'; c.fillRect(0, 0, 512, 128); c.fillStyle = '#1f3c6e'; c.font = '700 76px Arial'; c.textAlign = 'center'; c.fillText('PASSPORTS', 256, 92); }); const pl = plane(150, 37, std('#fff', { map: pt, roughness: .6 }), -35.6, 78, 0); pl.rotation.y = -Math.PI / 2; dk.add(pl); dk.add(plane(60, 15, std('#fff', { map: pt, roughness: .6 }), 0, 80, 95.6)); dk.position.set(95, 0, 0); g.add(dk);
  PS.light = mkLights(scene, { sky: '#fff3e0', ground: '#c9b190', sr: 420 });
})();
// ---- céu
const KS = {};
async function buildSky() {
  const scene = sceneK; scene.background = svgTex(svgWrap(`<rect width="1080" height="1920" fill="url(#gSky)"/>`, '0 0 1080 1920', 270, 480), 270, 480);
  const cl = canvasTex(256, 128, c => { for (const [x, y, r] of [[80, 80, 44], [128, 64, 56], [176, 82, 42], [128, 92, 60]]) { const g = c.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 128); } });
  for (let i = 0; i < 26; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cl, transparent: true, depthWrite: false, opacity: .95 })); const r = n => { const v = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return v - Math.floor(v); }; s.position.set((r(1) - .5) * 14000, -2600 + r(2) * 3600, -7000 + r(3) * 9000); const k = 1800 + r(4) * 2600; s.scale.set(k, k * .45, 1); scene.add(s); }
  const obj = await new OBJLoader().loadAsync('../../biblioteca3d/aviao/Jetliner.obj'); const white = std('#f4f5f7', { roughness: .35, envMapIntensity: 1 }), red = std('#d8261c', { roughness: .4 }), grey = std('#8f98a3', { roughness: .4, metalness: .6 });
  let fus = null, tail = null; obj.traverse(o => { if (o.isMesh) { o.material = /Tail/.test(o.name) ? red : /Turbo/.test(o.name) ? grey : white; if (/Fus/.test(o.name)) fus = new THREE.Box3().setFromObject(o); if (/Tail/.test(o.name)) tail = new THREE.Box3().setFromObject(o); } });
  const bb = new THREE.Box3().setFromObject(obj), sz = bb.getSize(new THREE.Vector3()), ctr = bb.getCenter(new THREE.Vector3()); const fs = fus.getSize(new THREE.Vector3()), fc = fus.getCenter(new THREE.Vector3()).sub(ctr); const tailZ = tail.getCenter(new THREE.Vector3()).z - ctr.z;
  const g = new THREE.Group(); obj.position.sub(ctr); g.add(obj); const k = 3800 / sz.z; g.scale.setScalar(k);
  const bt = canvasTex(1024, 160, c => { c.fillStyle = '#1b2240'; c.font = '120px Anton'; c.textAlign = 'center'; c.fillText('Hryz Animation', 512, 125); });
  const inner = new THREE.Group(); inner.add(g); for (const side of [1, -1]) { const p = plane(1150, 180, new THREE.MeshBasicMaterial({ map: bt, transparent: true, toneMapped: false }), side * (fs.x / 2 * k * 0.93), (fc.y + fs.y * 0.2) * k, fc.z * k); p.rotation.y = side * Math.PI / 2; inner.add(p); }
  if (tailZ > 0) inner.rotation.y = Math.PI; // o nariz passa a apontar para +z
  KS.piv = new THREE.Group(); KS.piv.add(inner); scene.add(KS.piv); scene.environment = ENV;
  scene.add(new THREE.HemisphereLight('#dff0ff', '#9fc2e0', 1.4)); const key = new THREE.DirectionalLight('#fff1d8', 2.4); key.position.set(800, 2500, 1800); scene.add(key);
}
await buildSky();

// ---------------------------------------------------------------- acessórios dinâmicos
const mk = { towel: () => { const g = new THREE.Group(); g.add(rbox(30, 9, 22, 2.5, std('#f7f7f2', { roughness: .95 }), 0, 0, 0)); g.add(box(30.4, 1.6, 22.4, std('#7fb3d9'), 0, -2, 0)); return g; },
  bag: () => { const m = mesh(new THREE.CylinderGeometry(9, 7.5, 22, 4), std('#c9905a', { roughness: .9 })); m.rotation.y = Math.PI / 4; const g = new THREE.Group(); g.add(m); return g; },
  bun: () => { const g = new THREE.Group(); g.add(mesh(new THREE.SphereGeometry(6, 16, 10, 0, 7, 0, Math.PI / 2), std('#d79a4e', { roughness: .7 }), 0, 1, 0)); g.add(mesh(new THREE.CylinderGeometry(6.2, 6.2, 2, 16), std('#6b3d1e'), 0, 0, 0)); g.add(mesh(new THREE.CylinderGeometry(6, 5.4, 2.4, 16), std('#e3b064'), 0, -2.2, 0)); return g; },
  diary: () => { const d = new THREE.Group(); const pg = std('#fbf6e6', { roughness: .9 }); const l = box(13, .8, 18, pg, -6.6, 0, 0); l.rotation.z = .12; const r = box(13, .8, 18, pg, 6.6, 0, 0); r.rotation.z = -.12; d.add(l, r, box(28, .8, 19, std('#5a2e17'), 0, -1, 0)); return d; },
  pen: () => { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(.6, .6, 13, 10), std('#1f3c6e', { roughness: .3 }), 0, 7.6, 0)); const tip = mesh(new THREE.ConeGeometry(.6, 2.2, 10), std('#e3b23c', { metalness: 1, roughness: .3 }), 0, 1.1, 0); tip.rotation.z = Math.PI; g.add(tip); return g; } };
const PROP = { towel: mk.towel(), bag: mk.bag(), bun: mk.bun(), diary: mk.diary(), pen: mk.pen(), pipe: pipe3d(), cheque: cheque3d(), wc: wheelchair3d(), vcase: suitcase3d(36, 60, 22, '#3e8a66'), ocase: briefcase3d(), ncase: briefcase3d() };
for (const k in PROP) { PROP[k].visible = false; sceneT.add(PROP[k]); }
const PIPE2 = pipe3d(); // não usado no passado
// documento com textura viva (o risco e a assinatura aparecem aos poucos)
const DOCC = document.createElement('canvas'); DOCC.width = 840; DOCC.height = 1188; const DOCT = new THREE.CanvasTexture(DOCC); DOCT.colorSpace = THREE.SRGBColorSpace; DOCT.anisotropy = 8;
const DOCM = plane(21, 29.7, std('#fff', { map: DOCT, roughness: .85, side: THREE.DoubleSide })); DOCM.castShadow = true; DOCM.visible = false; sceneT.add(DOCM);
const HAND = 'Sir,  Alfred Mehran';
function penPath(p) { // ponto da caneta (px do canvas) para o progresso p
  if (p < .16) return [70 + (p / .16) * 640, 372 + Math.sin(p * 90) * 6];
  if (p < .22) { const k = (p - .16) / .06; return [lerp(710, 70, k), lerp(372, 560, k) - Math.sin(k * Math.PI) * 60]; }
  if (p < .84) { const k = (p - .22) / .62; return [70 + k * 700, 548 + Math.sin(k * 70) * 16 - k * 30]; }
  if (p < .9) { const k = (p - .84) / .06; return [lerp(770, 70, k), lerp(520, 836, k) - Math.sin(k * Math.PI) * 60]; }
  const k = (p - .9) / .1; return [70 + k * 330, 836 + Math.sin(k * 40) * 5];
}
let docP = -1;
function drawDoc(p) { p = Math.round(p * 400) / 400; if (p === docP) return; docP = p; const c = DOCC.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#fffdf6'; c.fillRect(0, 0, 840, 1188);
  c.fillStyle = '#1f3c6e'; c.textAlign = 'center'; c.font = '700 44px Georgia'; c.fillText('RÉPUBLIQUE FRANÇAISE', 420, 110); c.font = '27px Georgia'; c.fillText('TITRE DE SÉJOUR · AUTORIZAÇÃO DE RESIDÊNCIA', 420, 162); c.fillRect(50, 186, 740, 4);
  c.textAlign = 'left'; c.fillStyle = '#666'; c.font = '700 28px Arial'; c.fillText('NOME', 60, 300); c.fillText('NACIONALIDADE', 60, 760); c.fillStyle = '#222'; c.font = '700 50px Courier New'; c.fillText('Mehran Karimi Nasseri', 60, 388); c.fillText('iraniana', 60, 850);
  c.fillStyle = '#8e877a'; c.globalAlpha = .5; for (let i = 0; i < 3; i++) c.fillRect(60, 930 + i * 44, i === 2 ? 400 : 720, 9); c.globalAlpha = .75; c.strokeStyle = '#2a54c9'; c.lineWidth = 9; c.beginPath(); c.arc(650, 1040, 96, 0, 7); c.stroke(); c.fillStyle = '#2a54c9'; c.font = '700 40px Arial'; c.textAlign = 'center'; c.fillText('1999', 650, 1054); c.globalAlpha = 1; c.textAlign = 'left';
  const stroke = (a, b) => { if (p <= a) return; c.strokeStyle = '#c62828'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); const n = 40; for (let i = 0; i <= n; i++) { const q = a + (Math.min(p, b) - a) * i / n; const [x, y] = penPath(q); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); };
  stroke(0, .16); stroke(.9, 1);
  if (p > .22) { const k = clamp((p - .22) / .62, 0, 1); c.save(); c.beginPath(); c.rect(0, 430, 70 + k * 715, 200); c.clip(); c.translate(64, 580); c.rotate(-.045); c.fillStyle = '#16327a'; c.font = 'italic 78px "Brush Script MT","Segoe Script","URW Chancery L","Z003",cursive'; c.fillText('Sir', 0, 0); const w1 = c.measureText('Sir').width; c.fillStyle = '#c62828'; c.font = 'italic 190px Georgia'; c.fillText(',', w1 + 4, 26); c.fillStyle = '#16327a'; c.font = 'italic 78px "Brush Script MT","Segoe Script","URW Chancery L","Z003",cursive'; c.fillText('Alfred Mehran', w1 + 78, 0); c.restore(); }
  DOCT.needsUpdate = true; }
drawDoc(0);

// ---------------------------------------------------------------- poses-chave do Nasseri sentado (pos 0, yaw 0)
const Nn = p => norm('nasseri', p);
const K = { SIT: Nn(PO.sit(45, {})), PIPE0: Nn(PO.sitPipe({}, 0)), PIPE1: Nn(PO.sitPipe({ head: [-6, 0, 0] }, 1.5)), REACH: Nn(PO.sitReach({})), REACHR: Nn(PO.sitReach({ armR: { t: [6, 88, 50], hand: 'open', hd: [0.3, 0.2, 1], palm: [0, 1, 0] }, head: [0, 14, 0] })),
  EAT: Nn(PO.sitEat({})), WRITE: Nn(PO.sitWrite({})), READ: Nn(PO.sitRead({})), CROSS: Nn(PO.sitCross({ head: [-6, 0, 0] })),
  WRITEP: Nn(PO.sit(45, { spine: [10, 0, 0], chest: [8, 0, 0], neck: [12, 0, 0], head: [26, 0, 0], armL: { t: [17, 63.5, 22], hand: 'fist', hd: [-0.5, 0, 1], palm: [0, -1, 0], pole: [1, 0.2, -0.4] }, armR: { t: [-12, 70, 26], hand: 'pinch', hd: [0.3, -0.5, 1], palm: [0.3, -1, 0], pole: [-1, 0.3, -0.4] } })),
  PRESIT: Nn({ pel: [0, 84.8, 34], legL: { t: [10.5, 7, 38] }, legR: { t: [-10.5, 7, 38] }, chest: [3, 0, 0], neck: [2, 0, 0] }) };
// o cachimbo acompanha a mão: guarda a posição dele em relação à mão direita
const PIPEREL = (() => { const J = RIG.build('nasseri', K.PIPE0).J; const Rt = [[J.handRR[0][0], J.handRR[1][0], J.handRR[2][0]], [J.handRR[0][1], J.handRR[1][1], J.handRR[2][1]], [J.handRR[0][2], J.handRR[1][2], J.handRR[2][2]]]; return { off: M.ap(Rt, V.sub(J.mouth, J.gripR)), fwd: M.ap(Rt, M.ap(J.Rh, [0, 0, 1])) }; })();
function pipeInHand(J) { const p = PROP.pipe; const pos = V.add(J.gripR, M.ap(J.handRR, PIPEREL.off)), f = M.ap(J.handRR, PIPEREL.fwd); p.visible = true; p.position.set(...pos); p.lookAt(pos[0] + f[0], pos[1] + f[1], pos[2] + f[2]); return { pos, f }; }
function life(p, t, s) { p = Object.assign({}, p); const b = Math.sin(t * 1.9 + (s || 0)); p.chest = [(p.chest || [0, 0, 0])[0] + b * 1.3, (p.chest || [0, 0, 0])[1], (p.chest || [0, 0, 0])[2]]; const h = p.head || [0, 0, 0]; p.head = [h[0] + Math.sin(t * .9 + 1 + (s || 0)) * 1.6, h[1] + Math.sin(t * .6 + (s || 0)) * 3, h[2]]; return p; }
const addHead = (p, d) => { p = Object.assign({}, p); const h = p.head || [0, 0, 0]; p.head = [h[0] + d[0], h[1] + d[1], h[2] + (d[2] || 0)]; return p; };
const put = (o, pos, ry) => { o.visible = true; o.position.set(pos[0], pos[1], pos[2]); if (ry != null) o.rotation.set(0, ry, 0); };
const SMK = []; function smokeAt(group, pos, t, amt, big) { const n = 10; for (let i = 0; i < n; i++) { const a = ((t * .45 + i / n) % 1); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: SMOKE, transparent: true, color: '#eef0f6', opacity: Math.min(1, .8 * amt * (1 - a)), depthWrite: false })); s.position.set(pos[0] + Math.sin(a * 6 + i) * 6 * a, pos[1] + a * (big ? 34 : 60), pos[2] + Math.cos(a * 5 + i) * 5 * a + (big ? a * 40 : 0)); s.scale.setScalar((big ? 10 : 5) + a * (big ? 44 : 26)); group.add(s); SMK.push(s.material); } }
function fig(group, tipo, pose, o) { const f = figure(tipo, pose, o); group.add(f); return f.userData.J; }
const SUPC = { funcionario: '#8a4a26', oficial: '#7c4424', produtor: '#8a4a26', passageiro: '#4b5672', passageira: '#4b5672' }, SUPR = { passageiro: '#dfe8ff', passageira: '#dfe8ff' };
const sfig = (group, tipo, pose) => fig(group, tipo, pose, { cor: SUPC[tipo], rim: SUPR[tipo] || '#ffd9a6' });

// visitante: anda até um ponto, vira para o Nasseri, faz o gesto g(t) (0..1) e vai embora
function visitor(group, t, o) {
  const sp = o.sp || 135, tArr = o.t0 + dist2(o.from, o.to) / sp; if (t < o.t0) return null;
  const face = o.face == null ? yawTo(o.to, [0, 0, 0]) : o.face; let pose, pos, yaw;
  if (t < tArr) { const w = walkSeg(o.from, o.to, o.t0, sp, t, o.carry); pose = w.pose; pos = w.pos; yaw = w.yaw; }
  else if (t < o.tLeave) { const yw = yawTo(o.from, o.to), k = seg(t, tArr, tArr + .35); yaw = yw + wrapA(face - yw) * k; pos = o.to; const base = { yaw, pos };
    const st = norm(o.tipo, Object.assign({}, PO.stand(), o.carry || {}, base)), ge = norm(o.tipo, Object.assign({}, o.gesture, base)); pose = life(mixV(st, ge, o.g(t)), t, o.t0); }
  else { const tT = o.tLeave + .35, yw = yawTo(o.to, o.exit); if (t < tT) { yaw = face + wrapA(yw - face) * seg(t, o.tLeave, tT); pos = o.to; pose = PO.walk((t - o.tLeave) * 1.2, Object.assign({ yaw, pos, half: 6 }, o.carry2 || o.carry || {})); } else { const w = walkSeg(o.to, o.exit, tT, sp, t, o.carry2 || o.carry); if (w.u >= 1) return null; pose = w.pose; pos = w.pos; yaw = w.yaw; } }
  const J = sfig(group, o.tipo, pose); return { J, pos, yaw, tArr, here: t >= tArr && t < o.tLeave };
}

// ---------------------------------------------------------------- linha do tempo
function yearAt(t) { if (t < 6.25) return '18 ANOS'; if (t < 18) return '1988'; if (t < 23.4) return '1988'; if (t < 34.2) return String(Math.min(1998, 1989 + Math.floor((t - 23.4) / 1.05)));
  if (t < 45.4) return '1999'; if (t < 46.2) return String(2000 + Math.min(3, Math.floor((t - 45.4) / .2))); if (t < 53.45) return '2004'; if (t < 53.7) return '2005'; if (t < 57.2) return '2006'; if (t < 57.9) return String(2007 + Math.floor((t - 57.2) / .7 * 15)); return '2022'; }
const orb = (az, r, h, c) => { c = c || [0, 0, 20]; const a = az * Math.PI / 180; return [c[0] + r * Math.sin(a), h, c[2] + r * Math.cos(a)]; };
const CK = { // chaves de câmera por cena
  A: [{ t: 0, p: [-60, 165, 430], g: [10, 172, -60], f: 42 }, { t: 1.8, p: [215, 150, 330], g: [5, 138, 0], f: 36, lin: 1 }, { t: 3.4, p: [250, 128, 60], g: [0, 116, 16], f: 30 }, { t: 5.9, p: [236, 131, 84], g: [0, 117, 16], f: 30 }, { t: 6.5, p: [250, 128, 60], g: [110, 425, -640], f: 28 }, { t: 6.6, p: [250, 128, 60], g: [110, 425, -640], f: 28 }],
  B: [{ t: 6.6, p: [250, 128, 60], g: [110, 425, -640], f: 28 }, { t: 7.5, p: [330, 120, 170], g: [130, 105, -262], f: 38 }, { t: 8.4, p: [305, 105, 150], g: [128, 92, -275], f: 38 }, { t: 9.1, p: [262, 140, -60], g: [132, 128, -262], f: 30 }, { t: 9.8, p: [255, 141, -66], g: [132, 128, -262], f: 30 }, { t: 10.35, p: [320, 125, 170], g: [128, 92, -275], f: 40 }, { t: 10.9, p: [330, 125, 180], g: [130, 105, -262], f: 40 }, { t: 11.12, p: [340, 125, 180], g: [1100, 110, -262], f: 40 }],
  C: [{ t: 11.12, p: [LX + 70, 125, 520], g: [LX - 900, 108, 0], f: 46 }, { t: 11.45, p: [LX + 70, 125, 520], g: [LX + 72, 108, 0], f: 46 }, { t: 13.4, p: [LX + 74, 125, 468], g: [LX + 72, 108, 0], f: 46 }, { t: 14.6, p: [LX + 150, 140, 500], g: [LX + 75, 108, 0], f: 46 }, { t: 15.6, p: [LX + 120, 140, 510], g: [LX + 30, 108, 0], f: 46 }, { t: 16.0, p: [LX + 120, 140, 510], g: [LX - 500, 1500, -300], f: 46 }],
  T: [{ t: 18.2, p: [-420, 900, 620], g: [100, 1500, -2900], f: 50 }, { t: 19.5, p: [-430, 330, 760], g: [-110, 150, 120], f: 46 }, { t: 20.7, p: [-330, 160, 600], g: [-60, 105, 150], f: 42 }, { t: 21.9, p: [-360, 140, 330], g: [0, 105, 20], f: 40 },
    { t: 23.0, az: -25, r: 520, h: 165, g: [5, 150, 10], f: 42 }, { t: 26.0, az: -62, r: 520, h: 150, g: [0, 125, 80], f: 44, lin: 1 }, { t: 29.0, az: -95, r: 480, h: 150, g: [0, 122, 70], f: 42, lin: 1 }, { t: 31.6, az: -58, r: 420, h: 250, g: [12, 96, 72], f: 46 }, { t: 34.4, az: -88, r: 460, h: 150, g: [0, 124, 70], f: 42 },
    { t: 37.5, az: -80, r: 400, h: 138, g: [0, 120, 72], f: 40 }, { t: 40.4, az: -76, r: 350, h: 134, g: [0, 116, 62], f: 38 }, { t: 41.3, p: [0, 136, 44], g: [0, 62, 35], f: 36, up: [0, 0, 1] }, { t: 45.0, p: [0, 131, 44], g: [0, 62, 35], f: 35, up: [0, 0, 1] },
    { t: 46.0, az: -30, r: 450, h: 150, g: [20, 122, 60], f: 40 }, { t: 48.6, az: -50, r: 410, h: 140, g: [30, 120, 70], f: 40 }, { t: 50.2, az: -44, r: 420, h: 140, g: [40, 118, 60], f: 40 }, { t: 52.6, az: -10, r: 600, h: 185, g: [70, 150, 0], f: 42 },
    { t: 53.5, p: [60, 180, 560], g: [110, 425, -640], f: 30 }, { t: 54.0, p: [60, 180, 560], g: [110, 425, -640], f: 30 }, { t: 54.9, p: [-150, 165, 650], g: [200, 110, 150], f: 44 }, { t: 56.6, p: [-120, 165, 640], g: [330, 115, 170], f: 44 }, { t: 57.3, p: [-60, 170, 560], g: [110, 425, -640], f: 30 }, { t: 57.9, p: [-60, 170, 560], g: [110, 425, -640], f: 30 },
    { t: 58.8, p: [-80, 165, 520], g: [190, 115, 110], f: 44 }, { t: 60.4, p: [-60, 165, 430], g: [10, 150, -40], f: 42 }, { t: 62.0, p: [-60, 165, 430], g: [10, 172, -60], f: 42 }] };
function camAt(keys, t) {
  let a = keys[0], b = keys[0]; for (let i = 1; i < keys.length; i++) { if (t < keys[i].t) { a = keys[i - 1]; b = keys[i]; break; } a = b = keys[i]; }
  const u = a === b ? 0 : (t - a.t) / (b.t - a.t), k = b.lin ? (a.lin ? u : u * u * (2 - u) * .5 + u * .5) : ease(u);
  const P = x => x.p || orb(x.az, x.r, x.h); let p; if (a.az != null && b.az != null) p = orb(lerp(a.az, b.az, k), lerp(a.r, b.r, k), lerp(a.h, b.h, k)); else p = L3(P(a), P(b), k);
  const g = L3(a.g, b.g, k), up = L3(a.up || [0, 1, 0], b.up || [0, 1, 0], k); const n = (s, f) => Math.sin(t * f + s) * .5 + Math.sin(t * f * 2.3 + s * 2) * .25;
  camera.up.set(up[0], up[1], up[2]).normalize(); camera.fov = lerp(a.f, b.f, k); camera.position.set(p[0] + n(1, 1.3) * .8, p[1] + n(2, 1.7) * .6, p[2] + n(3, 1.1) * .8); camera.lookAt(g[0] + n(4, 1.5) * .5, g[1] + n(5, 1.9) * .4, g[2]); camera.near = 8; camera.far = 20000; }

function clearDyn() { for (const k in dyn) { dyn[k].clear(); } for (const g of (window.__geo || [])) g.dispose(); window.__geo = []; for (const m of SMK) m.dispose(); SMK.length = 0; for (const k in PROP) PROP[k].visible = false; DOCM.visible = false; }
const seatPos = side => [side * 54, 50.5, 4];

// ----- Terminal
function frameT(t) {
  const G = dyn.T; const present = t < 7; // abertura: a pilha completa
  const yr = yearAt(t); for (const b of TS.boards) b.userData.m.map = btex(yr);
  for (const it of TS.pile) { const k = present || t > 52 ? 1 : seg(t, it.at, it.at + .35); it.m.visible = k > 0; it.m.position.y = it.y + (1 - k) * 46; it.m.scale.setScalar(.6 + .4 * k); }
  for (const tb of TS.tube) { const u = ((tb.i + .5) / 8 + tb.dir * t * .012 + 10) % 1; tb.m.position.copy(tb.A).addScaledVector(tb.d, u); tb.m.position.y += 75; }
  TS.poster.visible = present || t >= 49.7; TS.light(0, 0, 0);
  // gente passando ao fundo
  for (const [i, z, sp, tipo] of [[0, -700, 120, 'passageiro'], [1, -980, -105, 'passageira'], [2, 780, 110, 'passageiro'], [3, -520, -125, 'passageiro']]) { const span = 3000, x = ((((t + 40) * sp + i * 900) % span) + span) % span - span / 2; sfig(G, tipo, PO.walk(((t + 40) * Math.abs(sp) + i * 37) / 90, { yaw: sp > 0 ? 90 : -90, pos: [x, 0, z] })); }
  let bluePos = [128, 0, 12], blueRy = -.15, J = null;
  // ---------- Nasseri
  if (present) { const p = poseAt([[0, K.PIPE0], [4.5, K.PIPE0], [5.0, K.PIPE1], [6.6, K.PIPE1]], t); J = fig(G, 'nasseri', life(p, t)); const pp = pipeInHand(J); const bowl = V.add(pp.pos, V.add(V.mul(pp.f, 12.4), [0, 6, 0])); smokeAt(G, bowl, t, .8); const ex = Math.sin(Math.PI * lin(t, 4.9, 6.5)); if (ex > 0) smokeAt(G, V.add(J.mouth, V.mul(M.ap(J.Rh, [0, 0, 1]), 4)), t * 1.6, ex * 1.5, 1); }
  else if (t < 22.0) { // chega andando com a mala, vira e fica de frente para a câmera
    const A = [-210, 0, 470], B = [0, 0, 34]; const w = walkSeg(A, B, 18.3, 150, t, { armR: { t: [-27, 76, -4], hand: 'fist' } }); let pose = w.pose, yaw = w.yaw;
    if (t >= w.tEnd) { yaw = w.yaw + wrapA(0 - w.yaw) * seg(t, w.tEnd, 22.0); pose = PO.walk((t - w.tEnd) * 1.6, { yaw, pos: B, half: 5 }); }
    J = fig(G, 'nasseri', pose); const kk = seg(t, w.tEnd, 22.0); const rel = M.ap(M.ry(yaw), [-34, 0, -6]); bluePos = L3([w.pos[0] + rel[0], 0, w.pos[2] + rel[2]], [128, 0, 12], kk); blueRy = lerp(yaw * Math.PI / 180, -.15, kk); }
  else if (t < 53.8) {
    const keys = [[22.0, K.PRESIT], [22.8, K.SIT], [24.5, K.SIT], [24.9, K.REACH], [25.2, K.REACH], [25.9, K.SIT], [27.2, K.SIT], [27.6, K.REACH], [27.9, K.REACH], [28.5, K.EAT], [29.5, K.EAT], [30.1, K.WRITE], [33.6, K.WRITE], [34.4, K.SIT], [35.8, K.SIT], [36.3, K.REACH], [36.6, K.REACH], [37.3, K.READ], [40.4, K.READ], [41.1, K.WRITEP], [45.1, K.WRITEP], [45.8, K.REACH], [46.2, K.REACH], [46.9, K.CROSS], [48.2, K.CROSS], [48.7, K.REACHR], [49.0, K.REACHR], [49.7, K.SIT], [50.6, K.SIT], [51.4, K.PIPE0], [52.0, K.PIPE0], [52.5, K.PIPE1], [53.8, K.PIPE1]];
    let p = poseAt(keys, t);
    if (t > 28.5 && t < 29.5) p = addHead(p, [Math.sin((t - 28.5) * 14) * 3, 0]);                     // mastiga
    if (t > 30.2 && t < 33.5) { p = Object.assign({}, p); const a = Object.assign({}, p.armR); a.w = [a.w[0] + Math.sin(t * 9) * 1.6, a.w[1], a.w[2] + Math.sin(t * 13) * .8]; p.armR = a; } // escreve no diário
    if (t > 38.8 && t < 40.3) p = addHead(p, [0, Math.sin((t - 38.8) * 11) * 16 * Math.sin(Math.PI * lin(t, 38.8, 40.3))]); // faz que não
    if (t > 46.9 && t < 48.2) p = addHead(p, [0, Math.sin((t - 46.9) * 5) * 8]);
    // olha para quem chega
    const look = (a, b, yw) => { const k = seg(t, a, a + .5) * (1 - seg(t, b, b + .5)); if (k > 0) p = addHead(p, [-4 * k, yw * k]); }; look(23.4, 24.4, -24); look(26.0, 27.0, 26); look(34.3, 35.6, 28); look(47.0, 48.0, 30); look(50.3, 51.6, 34);
    // a caneta no documento
    if (t > 40.5 && t < 45.6) { const kq = lin(t, 41.6, 44.8); drawDoc(kq); const [cx, cy] = penPath(kq); DOCM.updateMatrixWorld(true); const tip = DOCM.localToWorld(new THREE.Vector3((cx - 420) / 40, (594 - cy) / 40, .3)); window.__tip = tip; const on = seg(t, 41.0, 41.5) * (1 - seg(t, 44.9, 45.3)); p = Object.assign({}, p); const a = Object.assign({}, p.armR); a.w = L3(a.w, [tip.x - 7, tip.y + 6, tip.z - 11.5], on); p.armR = a; }
    J = fig(G, 'nasseri', life(p, t), t > 41.0 && t < 45.4 ? { only: ['armL', 'armR'] } : null);
  } else if (t < 57.35) { // sai na cadeira de rodas
    const x = lerp(120, 560, lin(t, 53.9, 57.6)), z = 210; put(PROP.wc, [x, 0, z], 0);
    J = fig(G, 'nasseri', life(RIG.sitPose('nasseri', 50, { yaw: 90, pos: [x + 6, 0, z], lean: -6, spine: [14, 0, 0], chest: [10, 0, 0], neck: [10, 0, 0], head: [8, 0, 0], armL: { t: [13, 62, 28], hand: 'relax' }, armR: { t: [-13, 62, 28], hand: 'relax' } }), t));
    sfig(G, 'funcionario', PO.walk((x - 120) / 90, { yaw: 90, pos: [x - 72, 0, z], half: 22, lean: 5, armL: { t: [24, 98, 36], hand: 'fist', hd: [0, 0, 1] }, armR: { t: [-24, 98, 36], hand: 'fist', hd: [0, 0, 1] } })); J = null;
  } else { // 2022: volta e senta de novo
    const A = [330, 0, 170], B = [0, 0, 34]; const w = walkSeg(A, B, 57.35, 150, t, { armL: { t: [20, 75, 2], hand: 'fist', hd: [0, -1, 0] }, spine: [8, 0, 0] }); let pose, yaw = w.yaw;
    if (t < w.tEnd) pose = w.pose; else if (t < w.tEnd + .45) { yaw = w.yaw + wrapA(0 - w.yaw) * seg(t, w.tEnd, w.tEnd + .45); pose = PO.walk((t - w.tEnd) * 1.6, { yaw, pos: B, half: 5, armL: { t: [20, 75, 2], hand: 'fist', hd: [0, -1, 0] } }); }
    else pose = life(poseAt([[w.tEnd + .45, K.PRESIT], [w.tEnd + 1.1, K.SIT], [w.tEnd + 1.15, K.SIT], [w.tEnd + 1.6, K.PIPE0]], t), t);
    J = fig(G, 'nasseri', pose); const tS = w.tEnd + .45; const g = J.gripL; const kk = seg(t, tS, tS + .5); put(PROP.ncase, L3([g[0], g[1] - 35, g[2]], [-52, 0, 62], kk), lerp((yaw + 90) * Math.PI / 180, .5, kk));
    if (t > w.tEnd + 1.15) { const pp = pipeInHand(J); if (t > w.tEnd + 1.5) smokeAt(G, V.add(pp.pos, V.add(V.mul(pp.f, 12.4), [0, 6, 0])), t, .8); }
  }
  TS.blue.visible = true; TS.blue.position.set(bluePos[0], 0, bluePos[2]); TS.blue.rotation.y = blueRy;
  if (t >= 18 && t < 57.3) { // cachimbo descansando no banco quando não está na mão
    if (t > 22.8 && t < 51.0) { put(PROP.pipe, [-40, 52, 6]); PROP.pipe.rotation.set(0, 1.2, 1.3); } else if (t >= 51.0 && t < 53.8 && J) { const pp = pipeInHand(J); if (t > 52.0) smokeAt(G, V.add(J.mouth, [0, 0, 5]), t * 1.6, Math.sin(Math.PI * lin(t, 52.2, 53.8)) * 1.3, 1); }
  }
  if (t < 18 || !J && t < 53.8) return;
  // ---------- visitantes
  const up = (a, b, c, d) => seg(t, a, b) * (1 - seg(t, c, d));
  // 1) funcionário com a toalha
  { const v = visitor(G, t, { tipo: 'funcionario', from: [600, 0, 160], to: [-6, 0, 132], t0: 19.9, tLeave: 25.6, exit: [700, 0, 60], carry: { armR: { t: [-14, 100, 30], hand: 'hold', hd: [0, 0, 1], palm: [0, 1, 0] } }, carry2: {}, gesture: PO.offerR('funcionario', { armR: { t: [-12, 108, 52], hand: 'hold', hd: [0, 0, 1], palm: [0, 1, 0] } }), g: tt => up(24.4, 24.8, 25.15, 25.6) });
    if (t >= 19.9 && t < 25.0 && v) { const g = v.J.gripR; put(PROP.towel, [g[0], g[1] + 6, g[2]], v.yaw * Math.PI / 180); } else if (t >= 25.0 && J) { const g = J.gripR, k = seg(t, 25.25, 25.9); put(PROP.towel, L3([g[0], g[1] + 6, g[2]], seatPos(1), k), 0); } }
  // 2) passageiro com o lanche
  { const v = visitor(G, t, { tipo: 'passageiro', from: [600, 0, 330], to: [14, 0, 140], t0: 23.0, tLeave: 28.3, exit: [-720, 0, 430], carry: { armR: { t: [-14, 100, 28], hand: 'hold', hd: [0, 0.4, 1] }, armL: { t: [26, 76, -4], hand: 'fist' } }, carry2: { armL: { t: [26, 76, -4], hand: 'fist' } }, gesture: PO.stand({ chest: [6, 0, 0], armR: { t: [-12, 104, 54], hand: 'hold', hd: [0, 0.3, 1], palm: [1, 0, 0] }, armL: { t: [26, 76, -4], hand: 'fist' } }), g: tt => up(27.2, 27.6, 28.0, 28.3) });
    if (v) { const rel = M.ap(M.ry(v.yaw), [33, 0, -8]); put(PROP.vcase, [v.pos[0] + rel[0], 0, v.pos[2] + rel[2]], v.yaw * Math.PI / 180); }
    if (t >= 23.0 && t < 27.8 && v) { const g = v.J.gripR; put(PROP.bag, [g[0], g[1] - 6, g[2]]); } else if (t >= 27.8 && J) { const gl = J.gripL, gr = J.gripR; const k1 = seg(t, 28.0, 28.4), k2 = seg(t, 29.6, 30.0); put(PROP.bag, L3(L3([gr[0], gr[1] - 6, gr[2]], [gl[0], gl[1] - 9, gl[2] + 3], k1), [-70, 61, -2], k2));
      if (t > 28.3 && t < 29.75) { put(PROP.bun, [gr[0], gr[1] + 2, gr[2] + 2]); PROP.bun.scale.setScalar(1 - .7 * seg(t, 29.0, 29.75)); } } }
  // diário e caneta
  if (J && t >= 22.8) { if (t > 30.0 && t < 34.0) { const g = J.gripL; put(PROP.diary, [g[0] - 4, g[1] - 2, g[2]]); const r = J.gripR; put(PROP.pen, [r[0], r[1] - 3, r[2] + 1]); PROP.pen.rotation.set(.5, 0, .35); } else if (t <= 30.0 || t >= 34.0) { put(PROP.diary, [-44, 51.6, 12], .3); } }
  // 3) funcionário que faz reverência
  visitor(G, t, { tipo: 'funcionario', from: [640, 0, 400], to: [20, 0, 158], t0: 26.9, tLeave: 33.0, exit: [700, 0, 300], carry: {}, gesture: PO.bow('funcionario', {}), g: tt => up(31.7, 32.2, 32.6, 33.0) });
  // 4) o homem do governo com o documento
  { const v = visitor(G, t, { tipo: 'oficial', from: [620, 0, 340], to: [-4, 0, 138], t0: 30.5, tLeave: 47.3, exit: [720, 0, 440], carry: { armR: { t: [-15, 104, 26], hand: 'hold', hd: [0, 0.4, 1], palm: [1, 0, 0] }, armL: { t: [20, 78, 4], hand: 'fist' } },
      gesture: t < 40 ? PO.offerR('oficial', { armR: { t: [-12, 110, 54], hand: 'hold', hd: [0, 0.2, 1], palm: [1, 0, 0] }, armL: { t: [20, 78, 4], hand: 'fist' } }) : PO.standShrug({ head: [2, 0, 8], armL: { t: [20, 78, 4], hand: 'fist' }, armR: { t: [-30, 102, 30], hand: 'hold', hd: [-0.4, 0.2, 1], palm: [0, 1, 0], pole: [-1, -1, -0.5] } }), g: tt => t < 40 ? up(35.3, 35.8, 36.7, 37.2) : up(46.3, 46.8, 47.1, 47.3) });
    if (v) { const l = v.J.gripL; put(PROP.ocase, [l[0], l[1] - 35, l[2]], (v.yaw + 90) * Math.PI / 180); }
    // o documento passa de mão em mão
    if (t >= 30.5 && t < 49) { const O = new THREE.Object3D(), Q = new THREE.Object3D(); const inOff = () => { if (!v) return false; const g = v.J.gripR; O.position.set(g[0], g[1] + 13, g[2]); O.rotation.set(0, (v.yaw + 90) * Math.PI / 180 + (t < 40 ? -.56 : 1.04), 0); return true; };
      const inRead = () => { const a = J.gripL, b = J.gripR; Q.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 9, (a[2] + b[2]) / 2); Q.lookAt(0, 150, -40); }; const inLap = () => { Q.position.set(0, 62.2, 32); Q.rotation.set(-Math.PI / 2 + .1, 0, Math.PI); }; const inReach = () => { const g = J.gripR; Q.position.set(g[0], g[1] + 12, g[2]); Q.lookAt(g[0], g[1] + 12, 400); };
      let ok = true; DOCM.visible = true;
      if (t < 36.5) { ok = inOff(); Q.copy(O); } else if (t < 37.3) { inOff(); inRead(); const k = seg(t, 36.5, 37.3); Q.position.lerpVectors(O.position, Q.position, k); Q.quaternion.slerpQuaternions(O.quaternion, Q.quaternion, k); }
      else if (t < 40.4) inRead(); else if (t < 41.1) { inRead(); O.copy(Q); inLap(); const k = seg(t, 40.4, 41.1); Q.position.lerpVectors(O.position, Q.position, k); Q.quaternion.slerpQuaternions(O.quaternion, Q.quaternion, k); }
      else if (t < 45.1) inLap(); else if (t < 45.8) { inLap(); O.copy(Q); inReach(); const k = seg(t, 45.1, 45.8); Q.position.lerpVectors(O.position, Q.position, k); Q.quaternion.slerpQuaternions(O.quaternion, Q.quaternion, k); }
      else if (t < 46.2) inReach(); else { ok = inOff(); Q.copy(O); }
      DOCM.visible = ok; DOCM.position.copy(Q.position); DOCM.quaternion.copy(Q.quaternion); DOCM.updateMatrixWorld(true);
      if (t > 40.9 && t < 45.4 && window.__tip) { const tp = window.__tip; put(PROP.pen, [tp.x, tp.y, tp.z]); PROP.pen.rotation.set(-.5, 0, .35); } } }
  // 5) o produtor de cinema com o cheque
  { const v = visitor(G, t, { tipo: 'produtor', from: [640, 0, 280], to: [64, 0, 122], t0: 43.6, tLeave: 51.2, exit: [700, 0, 320], carry: { armR: { t: [-15, 104, 26], hand: 'hold', hd: [0, 0.4, 1] } }, carry2: {},
      gesture: t < 49.25 ? PO.offerR('produtor', { lean: 8, spine: [12, 0, 0], armR: { t: [-12, 100, 58], hand: 'hold', hd: [0, 0, 1], palm: [0, 1, 0] } }) : t < 50.2 ? PO.stand({ lean: 16, spine: [22, 0, 20], armR: { t: [-40, 66, 44], hand: 'open', hd: [-0.4, -0.5, 1], pole: [-1, 0.2, -0.5] } }) : PO.stand({ head: [-4, 0, 0], armR: { t: [-34, 150, 20], hand: 'open', hd: [0, 1, 0], palm: [0, 0, 1], pole: [-1, -0.5, 0] } }),
      g: tt => t < 49.25 ? up(47.9, 48.3, 49.0, 49.25) : t < 50.2 ? up(49.25, 49.6, 49.95, 50.2) : up(50.2, 50.5, 51.0, 51.2) });
    if (t >= 43.6 && t < 48.9 && v) { const g = v.J.gripR; put(PROP.cheque, [g[0], g[1] + 10, g[2]]); PROP.cheque.rotation.set(0, -.64, 0); PROP.cheque.scale.setScalar(1); }
    else if (t >= 48.9 && t < 49.9 && J) { const g = J.gripR; put(PROP.cheque, [g[0], g[1] + 8, g[2]]); PROP.cheque.rotation.set(0, -.5, 0); PROP.cheque.scale.setScalar(1 - seg(t, 49.4, 49.9)); } }
}
// ----- passado
function frameP(t) {
  const G = dyn.P; PS.case.visible = false; PS.q.visible = false;
  if (t < 11.12) { sceneP.background.set('#e9d5b0'); sceneP.fog.color.set('#ecd9b6'); PS.light(N0[0], 0, N0[2]); const base = { pos: N0, yaw: 60 }; const n = p => norm('nasseri', Object.assign({}, p, base));
    const CASE = n(PO.standCase({})), BEND = n({ pelvisY: 76, lean: 30, spine: [24, 0, 10], neck: [-10, 0, 0], legL: { t: [10, 7, 4], pole: [.2, 0, 1] }, legR: { t: [-10, 7, 0], pole: [-.2, 0, 1] }, armL: { t: [28, 37, -14], hand: 'fist', hd: [0, -1, 0] } }), WATCH = n(PO.standWatch({})), LOOK = n(PO.stand({ head: [20, 62, 0], spine: [4, 0, 14] })),
      SHOCK = n(PO.stand({ head: [12, 40, 0], spine: [6, 0, 10], armL: { t: [16, 151, 4], hand: 'open', hd: [-0.75, 0.65, 0], palm: [-0.6, -0.8, 0], pole: [1, -0.2, 0.3] }, armR: { t: [-16, 151, 4], hand: 'open', hd: [0.75, 0.65, 0], palm: [0.6, -0.8, 0], pole: [-1, -0.2, 0.3] } }));
    const p = poseAt([[6.6, CASE], [7.7, CASE], [8.25, BEND], [8.45, BEND], [9.0, WATCH], [9.9, WATCH], [10.2, LOOK], [10.45, LOOK], [10.75, SHOCK], [11.2, SHOCK]], t); const J = fig(G, 'nasseri', life(p, t));
    const spot = [N0[0] - 4, 0, N0[2] - 34];
    if (t < 8.3) { const g = J.gripL; put(PS.case, [g[0], Math.max(0, g[1] - 35), g[2]], (60 + 90) * Math.PI / 180); } else if (t < 9.3) put(PS.case, spot, 150 * Math.PI / 180); else { PS.q.visible = true; PS.q.position.set(spot[0], 1, spot[2]); PS.q.rotation.z = 150 * Math.PI / 180; }
  } else { sceneP.background.set('#dfe3e8'); sceneP.fog.color.set('#e3e6ea'); PS.light(LX + 60, 0, 0);
    const ab = { pos: [LX + 165, 0, 0], yaw: -90 }, an = p => norm('oficial', Object.assign({}, p, ab));
    const AS = an(PO.stand({})), AH = an(PO.handOut('oficial', { armR: { t: [-14, 122, 60], hand: 'open', hd: [0, 0, 1], palm: [0, 1, 0] } })), AP = an(PO.stand({ chest: [4, 0, -10], armR: { t: [-10, 144, 62], hand: 'relax', hd: [0, 0.05, 1], palm: [1, 0, 0], pole: [-1, -1, 0] }, armL: { t: [26, 100, 6], hand: 'fist', pole: [1, 0, -1] } }));
    sfig(G, 'oficial', life(poseAt([[11.1, AS], [11.5, AS], [11.95, AH], [13.4, AH], [13.9, AP], [16.1, AP]], t), t, 2));
    const nb = { pos: [LX - 15, 0, 10], yaw: 78 }, nn = p => norm('nasseri', Object.assign({}, p, nb));
    const NS = nn(PO.stand({})), NH = nn(PO.standShrug({})), ND = nn(PO.stand({ spine: [8, 0, 0], chest: [10, 0, 0], neck: [10, 0, 0], head: [18, 0, 0] }));
    if (t < 15.0) fig(G, 'nasseri', life(poseAt([[11.1, NS], [12.1, NS], [12.6, NH], [13.6, NH], [14.3, ND], [15.0, ND]], t), t));
    else { const k = seg(t, 15.0, 15.45), yaw = 78 + (-90 - 78) * k; const x = LX - 15 - Math.max(0, t - 15.3) * 95; fig(G, 'nasseri', PO.walk((t - 15) * 1.25, { yaw, pos: [x, 0, 10], half: 6 + 12 * k, spine: [5, 0, 0], chest: [8, 0, 0], neck: [8, 0, 0], head: [14, 0, 0] })); }
  }
}
// ----- céu
function frameK(t) { const u = lin(t, 16.0, 18.3); const A = [3000, 700, -6200], B = [-2600, -500, 3200]; const p = L3(A, B, u); KS.piv.position.set(...p); KS.piv.lookAt(p[0] + (B[0] - A[0]), p[1] + (B[1] - A[1]) + 300, p[2] + (B[2] - A[2])); KS.piv.rotateZ(-.18);
  const k0 = 1 - seg(t, 16.0, 16.4), k1 = seg(t, 17.6, 18.2); camera.up.set(0, 1, 0); camera.fov = 44; camera.position.set(-200 + Math.sin(t * 9) * 3, -300, 4300); camera.lookAt(p[0] * .8, p[1] * .8 + k0 * 2600 - k1 * 1800, p[2] * .5); camera.near = 20; camera.far = 40000; }

window.__seek = t => { t = clamp(t, 0, TOTAL); clearDyn(); let scene; fadeM.opacity = 0;
  if (t < 6.6) { scene = sceneT; frameT(t); camAt(CK.A, t); }
  else if (t < 11.12) { scene = sceneP; frameP(t); camAt(CK.B, t); }
  else if (t < 16.0) { scene = sceneP; frameP(t); camAt(CK.C, t); }
  else if (t < 18.2) { scene = sceneK; frameK(t); fadeM.color.set('#ffffff'); fadeM.opacity = seg(t, 17.85, 18.2); }
  else { scene = sceneT; frameT(t); camAt(CK.T, t); fadeM.opacity = 1 - seg(t, 18.2, 18.6); if (t > 41.0 && t < 45.4) camera.near = 30; }
  if (camera.parent !== scene) scene.add(camera); camera.updateProjectionMatrix(); renderer.render(scene, camera); };
await Promise.all(pending);
renderer.domElement.id = 'stage'; window.__seek(0); window.__ready = true;
</script></body></html>
