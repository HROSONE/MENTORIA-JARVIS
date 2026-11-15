// Céu em cúpula com gradiente (topo, meio, horizonte), brilho do sol e nuvens em ruído; acompanha a câmera.
import * as THREE from 'three';

export function criarCeu({ topo = '#2a3f9a', meio = '#8a6fc8', horiz = '#ffb07a', sol = [-0.5, 0.12, -1], solCor = '#ffd2a0', nuvens = 0.6, nuvemCor = '#6a5fa0', nuvemLuz = '#ffb48a', luzK = 0.6 } = {}) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(topo) }, mid: { value: new THREE.Color(meio) }, hor: { value: new THREE.Color(horiz) }, sunDir: { value: new THREE.Vector3(...sol).normalize() }, sunCol: { value: new THREE.Color(solCor) },
      nuv: { value: nuvens }, nuvCor: { value: new THREE.Color(nuvemCor) }, nuvLuz: { value: new THREE.Color(nuvemLuz) }, tempo: { value: 0 }, luzK: { value: luzK }, flash: { value: 0 } },
    vertexShader: 'varying vec3 vd; void main(){ vd = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vd; uniform vec3 top, mid, hor, sunDir, sunCol, nuvCor, nuvLuz; uniform float nuv, tempo, luzK, flash;
      float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h2(i), h2(i+vec2(1,0)), f.x), mix(h2(i+vec2(0,1)), h2(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float a = 0.5, s = 0.0; for(int i=0;i<5;i++){ s += a*vn(p); p = p*2.03 + 7.1; a *= 0.5; } return s; }
      void main(){
        vec3 d = normalize(vd); float y = max(d.y, 0.0);
        vec3 c = mix(hor, mid, smoothstep(0.0, 0.42, y)); c = mix(c, top, smoothstep(0.30, 1.0, y));
        float s = max(dot(d, normalize(sunDir)), 0.0); c += sunCol * (pow(s, 8.0) * 0.22 + pow(s, 80.0) * 0.55) * luzK;
        vec2 uv = d.xz / (d.y + 0.22) * 1.15 + vec2(tempo * 0.012, 0.0);
        float n = fbm(uv * 1.3), cl = smoothstep(0.40, 0.75, n) * nuv * smoothstep(0.0, 0.12, d.y);
        vec3 cc = mix(nuvCor, nuvLuz, clamp(pow(s, 3.0) * 1.6 + (1.0 - n) * 0.25, 0.0, 1.0) * luzK);
        c = mix(c, cc, cl * 0.85);
        c += vec3(0.7, 0.8, 1.0) * flash * (0.35 + 0.65 * cl);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), m); mesh.frustumCulled = false; mesh.renderOrder = -10;
  return { mesh, mat: m, seguir: cam => mesh.position.copy(cam.position), cor: (t, mi, h) => { m.uniforms.top.value.set(t); m.uniforms.mid.value.set(mi); m.uniforms.hor.value.set(h); } };
}
