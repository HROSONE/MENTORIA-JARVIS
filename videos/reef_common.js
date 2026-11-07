/* ---------------- utilidades ---------------- */
const TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const range = (t, a, b) => clamp((t - a) / (b - a));
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeInOut = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
const lerp = (a, b, k) => a + (b - a) * k;
const pulse = (t, a, b, f = .25) => Math.min(range(t, a, a + f), 1 - range(t, b - f, b));
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UPV = V(0, 1, 0), ZV = V(0, 0, 1);
let seed = 13; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const curveOf = (pts) => (t) => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return lerp(va, vb, smooth((t - a) / (b - a))); }
  return pts[pts.length - 1][1];
};
const bez = (a, b, c, k) => a.clone().multiplyScalar((1 - k) ** 2).addScaledVector(b, 2 * k * (1 - k)).addScaledVector(c, k * k);

/* ---------------- renderer + pós-processamento ---------------- */
const W = 1080, H = 1920;
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const MAXANI = renderer.capabilities.getMaxAnisotropy();

const WATER = new THREE.Color(0x0b4f6c);
const scene = new THREE.Scene();
scene.background = WATER.clone();
scene.fog = new THREE.FogExp2(WATER.getHex(), .16);
const overlay = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, W / H, 0.01, 120);

const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));
const bokeh = new BokehPass(scene, camera, { focus: 1, aperture: .018, maxblur: .018 });
composer.addPass(bokeh);
const overPass = new RenderPass(overlay, camera); overPass.clear = false; overPass.clearDepth = true;
composer.addPass(overPass);
const gradePass = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uVig: { value: .45 }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(W, H) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uVig,uTime; uniform vec2 uRes; varying vec2 vUv;
    void main(){ vec2 uv=vUv; uv.x += sin(uv.y*40.+uTime*2.)*0.0006; vec4 c=texture2D(tDiffuse,uv); float v=length((vUv-.5)*vec2(1.,1.15));
      c.rgb*=1.-uVig*smoothstep(.3,.95,v);
      float g=fract(sin(dot(vUv*uRes+uTime*61.,vec2(12.9898,78.233)))*43758.5453); c.rgb+=(g-.5)*.01; gl_FragColor=c; }`
});
composer.addPass(gradePass);
composer.addPass(new OutputPass());

/* ---------------- água, luz e ambiente ---------------- */
const waterSky = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vW; void main(){ vW=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `varying vec3 vW; void main(){ float h=vW.y;
    vec3 deep=vec3(.01,.08,.14), mid=vec3(.03,.28,.38), top=vec3(.35,.8,.9);
    vec3 c = h>0. ? mix(mid, top, pow(h,1.6)) : mix(mid, deep, pow(-h,.5));
    c += vec3(.8,1.,1.)*pow(max(h,0.),14.)*1.5;
    gl_FragColor=vec4(c,1.); }`
});
{
  const envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), waterSky));
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(envScene, .03).texture;
}
const sun = new THREE.DirectionalLight(0xd6f6ff, 3.0);
sun.position.set(1.5, 8, 2.5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -3, right: 3.5, top: 3, bottom: -3, near: 1, far: 20 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = .01; sun.shadow.radius = 5; scene.add(sun);
scene.add(new THREE.HemisphereLight(0x8fe0ff, 0x0b2a35, .55));
// cáusticas (a luz ondulando no fundo)
const causticU = { uTime: { value: 0 } };
const CAUSTIC_GLSL = `
uniform float uTime; varying vec3 vWP;
float caustic(vec2 uv, float time){
  vec2 p = mod(uv*6.28318, 6.28318) - 250.0; vec2 i = p; float c = 1.0; float inten = .005;
  for (int n = 0; n < 4; n++) { float t = time * (1.0 - (3.5 / float(n+1)));
    i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
    c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten), p.y / (cos(i.y+t)/inten))); }
  c /= 4.0; c = 1.17 - pow(c, 1.4); return clamp(pow(abs(c), 8.0), 0., 2.);
}`;
function addCaustics(mat, k = .8) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = causticU.uTime;
    sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = CAUSTIC_GLSL + '\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
       float cz = caustic(vWP.xz * .55 + vec2(vWP.y*.2), uTime * .5);
       totalEmissiveRadiance += vec3(.6, .95, 1.) * cz * ${k.toFixed(2)} * diffuseColor.rgb * smoothstep(-1.0, 0.6, vWP.y);`);
  };
  return mat;
}
// raios de luz
const rayMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
  uniforms: { uO: { value: .07 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float uO; varying vec2 vUv; void main(){ float a = uO * smoothstep(0.,.6,vUv.y) * (0.6+0.4*sin(vUv.x*40.)); gl_FragColor=vec4(vec3(.7,.95,1.)*a, 1.); }`
});
const rays = [];
for (let i = 0; i < 7; i++) {
  const r = new THREE.Mesh(new THREE.ConeGeometry(.35 + rnd() * .5, 9, 24, 1, true), rayMat);
  r.position.set(-2.5 + i * .9 + rnd() * .4, 4.2, -2.4 + rnd() * 1.6); r.userData.p = rnd() * 6; scene.add(r); rays.push(r);
}

/* ---------------- texturas ---------------- */
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = MAXANI; return t;
}
const sandTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#c9b48a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26000; i++) { const v = rnd(); g.fillStyle = v > .5 ? `rgba(240,225,190,${.25 + rnd() * .3})` : `rgba(120,100,70,${.15 + rnd() * .25})`; g.fillRect(rnd() * w, rnd() * h, 1.5, 1.5); }
});
sandTex.repeat.set(26, 26);
function octoSkin(underside) {
  return canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#b25131'; g.fillRect(0, 0, w, h);
    g.filter = 'blur(10px)';
    for (let i = 0; i < 110; i++) { g.fillStyle = `rgba(100,30,18,${.5 + rnd() * .35})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 20 + rnd() * 50, 12 + rnd() * 30, rnd() * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(230,140,95,${.3 + rnd() * .3})`; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 8 + rnd() * 22, 6 + rnd() * 14, rnd() * 3, 0, TAU); g.fill(); }
    g.filter = 'none';
    for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${rnd() > .5 ? '245,190,150' : '80,25,15'},${.25 + rnd() * .3})`; g.beginPath(); g.arc(rnd() * w, rnd() * h, 1 + rnd() * 2.5, 0, TAU); g.fill(); }
    if (underside) {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(.08, 'rgba(245,205,180,0)'); gr.addColorStop(.17, 'rgba(245,205,180,.92)'); gr.addColorStop(.33, 'rgba(245,205,180,.92)'); gr.addColorStop(.42, 'rgba(245,205,180,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
  });
}
const bumpTex = canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const x = rnd() * w, y = rnd() * h, r = 1.5 + rnd() * 4; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, 'rgba(128,128,128,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
}, false);
const irisTex = canvasTex(256, 128, (g, w, h) => {
  g.fillStyle = '#7a5a1e'; g.fillRect(0, 0, w, h);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5a3a12'); gr.addColorStop(.5, '#e0b04a'); gr.addColorStop(1, '#5a3a12'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${rnd() > .5 ? '255,220,140' : '60,35,10'},.25)`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 6); }
});
const crabTex = canvasTex(512, 256, (g, w, h) => {
  g.fillStyle = '#c4532a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${rnd() > .5 ? '120,30,15' : '235,140,80'},.35)`; g.beginPath(); g.arc(rnd() * w, rnd() * h, 2 + rnd() * 6, 0, TAU); g.fill(); }
});

/* ---------------- geometria "esculpida" (loft) ---------------- */
function loft(pts, segs, radial, prof, shapeFn, uScale = 1) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const P = [], UV = [], I = [];
  let side = null;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, p = curve.getPointAt(t), T = curve.getTangentAt(t).normalize();
    if (!side) { side = V().crossVectors(T, UPV); if (side.lengthSq() < 1e-4) side.set(1, 0, 0); side.normalize(); }
    else side.addScaledVector(T, -side.dot(T)).normalize();
    const up = V().crossVectors(side, T).normalize();
    const { w, h } = prof(t);
    for (let j = 0; j <= radial; j++) {
      const a = j / radial * TAU, c = Math.cos(a), s = Math.sin(a), m = shapeFn ? shapeFn(t, a) : 1;
      const q = p.clone().addScaledVector(side, c * w * m).addScaledVector(up, s * h * m);
      P.push(q.x, q.y, q.z); UV.push(t * uScale, j / radial);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  g.setIndex(I); g.computeVertexNormals();
  return g;
}
const limbGeo = new THREE.CylinderGeometry(1, 1, 1, 10);
function placeLimb(m, a, b, r) { const d = b.clone().sub(a), len = d.length(); m.position.copy(a).addScaledVector(d, .5); m.scale.set(r, Math.max(len, 1e-4), r); m.quaternion.setFromUnitVectors(UPV, d.normalize()); }
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .8, ...o });
function noisyRock(r, s) {
  let g = new THREE.IcosahedronGeometry(r, 5); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g); const p = g.attributes.position; const col = [];
  const a = rnd() * 9, b = rnd() * 9;
  for (let i = 0; i < p.count; i++) {
    const v = V().fromBufferAttribute(p, i), n = v.clone().normalize();
    const d = 1 + .18 * Math.sin(n.x * 3 + a) * Math.cos(n.y * 4 + b) + .08 * Math.sin(n.z * 9 + a * 2) + .04 * Math.sin(n.x * 19 + n.y * 13);
    v.copy(n).multiplyScalar(r * d); v.multiply(s); p.setXYZ(i, v.x, v.y, v.z);
    const k = .75 + .25 * Math.sin(n.y * 6 + a) ; col.push(.42 * k, .4 * k, .36 * k);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
}

/* ---------------- fundo do mar ---------------- */
scene.add(new THREE.Mesh(new THREE.SphereGeometry(60, 48, 24), waterSky));
const FLAT_C = V(.5, 0, 0);
{
  const sg = new THREE.PlaneGeometry(60, 60, 220, 220).rotateX(-Math.PI / 2); const p = sg.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x - FLAT_C.x, z - FLAT_C.z);
    const dune = .25 * Math.sin(x * .7) * Math.cos(z * .55) + .08 * Math.sin(x * 2.3 + z * 1.7);
    p.setY(i, dune * smooth(range(d, 2.6, 6.5)) + .012 * Math.sin(x * 9 + z * 3) + .01 * Math.sin(z * 11));
  }
  sg.computeVertexNormals();
  const sand = new THREE.Mesh(sg, addCaustics(std(0xffffff, { map: sandTex, roughness: 1 }), 1.1)); sand.receiveShadow = true; scene.add(sand);
}
// rochas e a toca
const rockMat = addCaustics(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 }), .9);
const rocks = [];
for (const [x, y, z, r, sx, sy, sz] of [
  [-.78, .22, -.86, .42, 1.1, .9, 1], [.36, .2, -.9, .38, 1, .85, 1], [-.22, .62, -1.0, .52, 1.4, .55, 1], [-.2, .3, -1.42, .55, 1.6, 1, .8],
  [-1.3, .12, -.5, .25, 1, .7, 1], [1.05, .1, -.75, .22, 1.2, .7, 1], [1.7, .1, .9, .2, 1.1, .6, 1], [2.35, .16, .25, .28, 1, .7, 1.1], [-1.6, .3, -1.6, .5, 1, .9, 1],
  [2.6, .5, -1.4, .7, 1.2, 1, 1], [-2.6, .4, -.2, .6, 1, .9, 1.2], [.5, .06, 1.35, .13, 1, .7, 1]]) {
  const m = new THREE.Mesh(noisyRock(r, V(sx, sy, sz)), rockMat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; scene.add(m); rocks.push(m);
}
// algas
const grassGeo = (() => { const g = new THREE.PlaneGeometry(.035, .55, 1, 8).translate(0, .275, 0); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, y * y * .35); p.setX(i, p.getX(i) * (1 - y * 1.2)); } g.computeVertexNormals(); return g; })();
const grass = new THREE.InstancedMesh(grassGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .6, side: THREE.DoubleSide }), 260);
const grassData = [];
{
  const col = new THREE.Color();
  for (let i = 0; i < 260; i++) {
    let x, z; do { x = -3.5 + rnd() * 7.5; z = -2.8 + rnd() * 4.5; } while (Math.hypot(x - .5, z - .1) < 1.25 || (x > -1 && x < .6 && z > -1.2 && z < -.3));
    grassData.push({ p: V(x, 0, z), h: .6 + rnd() * .9, rot: rnd() * TAU, ph: rnd() * 6 });
    grass.setColorAt(i, col.setHSL(.27 + rnd() * .1, .55, .22 + rnd() * .15));
  }
  scene.add(grass);
}
// corais, estrela-do-mar, conchas
const corals = new THREE.Group(); scene.add(corals);
function branchCoral(pos, color, depth = 3, len = .22, dir = V(0, 1, 0), r = .03) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: .55 });
  const grow = (p, d, l, rr, k) => {
    const e = p.clone().addScaledVector(d, l);
    const seg = new THREE.Mesh(limbGeo, m); placeLimb(seg, p, e, rr); corals.add(seg);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(rr, 10, 8), m); tip.position.copy(e); corals.add(tip);
    if (k > 0) for (let i = 0; i < 2 + (rnd() > .5 ? 1 : 0); i++) {
      const nd = d.clone().add(V((rnd() - .5) * 1.2, .3, (rnd() - .5) * 1.2)).normalize();
      grow(e, nd, l * .78, rr * .75, k - 1);
    }
  };
  grow(pos, dir, len, r, depth);
}
branchCoral(V(1.5, 0, -1.0), 0xff6f61); branchCoral(V(-1.05, 0, .25), 0xf2a541, 3, .18); branchCoral(V(2.0, 0, -.2), 0xd65db1, 3, .2); branchCoral(V(-1.9, 0, -.9), 0xff8a5c, 3, .25);
{
  const bc = new THREE.Mesh(new THREE.SphereGeometry(.26, 64, 32, 0, TAU, 0, Math.PI * .55), new THREE.MeshStandardMaterial({ color: 0xc9b05a, roughness: .7 }));
  const p = bc.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const v = V().fromBufferAttribute(p, i), n = v.clone().normalize(); v.addScaledVector(n, .015 * Math.sin(n.x * 40 + Math.sin(n.z * 30) * 2)); p.setXYZ(i, v.x, v.y, v.z); }
  bc.geometry.computeVertexNormals(); bc.position.set(1.25, -.04, -.35); bc.castShadow = true; corals.add(bc);
  // estrela-do-mar
  const star = new THREE.Group(); const sm = new THREE.MeshStandardMaterial({ color: 0xff7b2e, roughness: .6 });
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; const arm = new THREE.Mesh(new THREE.ConeGeometry(.045, .2, 12).rotateZ(-Math.PI / 2).translate(.1, 0, 0), sm); arm.scale.y = .45; arm.rotation.y = a; star.add(arm); }
  star.add(new THREE.Mesh(new THREE.SphereGeometry(.05, 16, 8), sm)); star.children.at(-1).scale.y = .45;
  star.position.set(-.7, .02, .55); star.rotation.y = .4; corals.add(star);
}
const shellMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .3, clearcoat: .8 });
function makeShell(pos, s, rotY) {
  const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; const r = t < .22 ? lerp(.18, .42, Math.sin(t / .22 * Math.PI / 2)) : .42 * Math.pow(1 - (t - .22) / .78, 1.25); pts.push(new THREE.Vector2(r + .005, t * 1.1)); }
  const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), shellMat);
  const p = body.geometry.attributes.position; const col = [];
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); const a = Math.atan2(p.getZ(i), p.getX(i)); const sp = Math.sin(y * 34 + a); const k = 1 + .07 * Math.max(0, sp); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k);
    const band = .5 + .5 * Math.sin(y * 34 + a); col.push(lerp(.97, .5, band), lerp(.86, .27, band), lerp(.7, .14, band)); }
  body.geometry.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  body.geometry.computeVertexNormals(); body.rotation.z = Math.PI / 2 - .25; g.add(body);
  g.scale.setScalar(s); g.position.copy(pos); g.rotation.y = rotY; scene.add(g); return g;
}
const shells = [makeShell(V(1.35, .035, .85), .14, .5), makeShell(V(.2, .03, .95), .11, 2.2), makeShell(V(-.55, .03, .2), .12, 1.0)];
shells.forEach(sh => { sh.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(sh); sh.userData.c = bb.getCenter(V()); sh.userData.top = bb.max.y; });
// peixinhos ao fundo
const fishes = [];
{
  const fm = [0xffd23f, 0x3fa7ff, 0xffffff, 0xff7a3d];
  for (let i = 0; i < 9; i++) {
    const f = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: fm[i % 4], roughness: .4, metalness: .2 });
    const b = new THREE.Mesh(new THREE.SphereGeometry(.06, 16, 10), m); b.scale.set(1.8, 1, .55); f.add(b);
    const t = new THREE.Mesh(new THREE.ConeGeometry(.05, .08, 4).rotateZ(Math.PI / 2), m); t.position.x = -.13; t.scale.z = .3; f.add(t);
    f.userData = { c: V(-3 + rnd() * 6, .8 + rnd() * 1.6, -3.5 - rnd() * 2.5), r: .6 + rnd() * 1.2, s: .3 + rnd() * .3, p: rnd() * 6 };
    scene.add(f); fishes.push(f);
  }
}
// partículas em suspensão
const snow = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0xcff6ff, size: .012, transparent: true, opacity: .55, depthWrite: false }));
{ const a = []; for (let i = 0; i < 1400; i++) a.push(-4 + rnd() * 8, rnd() * 3.2, -4 + rnd() * 6.5); snow.geometry.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); scene.add(snow); }
const bubbles = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .45, roughness: 0, clearcoat: 1 }), 40);
bubbles.count = 0; bubbles.frustumCulled = false; scene.add(bubbles);

