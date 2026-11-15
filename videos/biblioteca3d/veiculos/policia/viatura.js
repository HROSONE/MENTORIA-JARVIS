// Viatura Ford Crown Victoria Police Interceptor (P71, 2006-2011), modelada em código a partir de medidas reais e fotos de referência.
import * as THREE from 'three';
import { M, ZN, ZF, ZT, YE, criarCorpoGeo, criarCabineGeo } from './forma.js';
import { criarPintura } from './pintura.js';
import { criarRoda, criarVaoRoda, definirMaterialFriso, posicoesRodas } from './rodas.js';
import { criarFrenteTraseira } from './frente.js';
import { criarInterior } from './interior.js';
import { criarRetrovisores, criarMacanetas, criarHolofote, criarAntenas, criarLimpadores, criarBarra, criarBaixo, criarLedsExtras, criarPushBar } from './acessorios.js';

export function criarViatura(opc = {}) {
  const G = new THREE.Group(); G.name = 'viaturaCrownVic';
  const pint = criarPintura(opc);
  const vidro = new THREE.MeshPhysicalMaterial({ color: 0x0c1218, roughness: 0.04, metalness: 0.0, transparent: true, opacity: 0.30, envMapIntensity: 2.2, side: THREE.DoubleSide, depthWrite: false });
  const corpo = new THREE.Mesh(criarCorpoGeo(), pint.material); corpo.castShadow = corpo.receiveShadow = true; G.add(corpo);
  const cabine = new THREE.Mesh(criarCabineGeo(), pint.material); cabine.castShadow = cabine.receiveShadow = true; G.add(cabine);
  const vid = new THREE.Mesh(criarCabineGeo(0.012), vidro); vid.renderOrder = 5; G.add(vid);
  corpo.updateMatrixWorld(true);
  // friso do arco com o material do corpo (sem os recortes do arco)
  const friso = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(opc.corFriso ?? pint.livery.base), roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.04 }); definirMaterialFriso(friso);
  const rodas = [];
  for (const p of posicoesRodas()) {
    const pivo = new THREE.Group(); pivo.position.set(p.lado * (p.dianteira ? 0.7975 : 0.804), YE, p.z); G.add(pivo);
    const r = criarRoda(opc); if (p.lado < 0) r.grupo.rotation.y = Math.PI; pivo.add(r.grupo);
    rodas.push({ ...p, pivo, giro: r.giro, pneu: r.pneu });
    G.add(criarVaoRoda(corpo, p.z, p.lado));
  }
  const ft = criarFrenteTraseira(corpo, opc); G.add(ft.grupo);
  G.add(criarRetrovisores(), criarMacanetas(corpo), criarHolofote(opc), criarAntenas(), criarLimpadores(), criarBaixo());
  G.add(criarInterior(opc));
  if (opc.pushbar) G.add(criarPushBar());
  const extras = criarLedsExtras(corpo); G.add(extras.grupo);
  const barra = opc.barra === false ? null : criarBarra(opc); if (barra) G.add(barra.grupo);
  // sombra de contato (AO falso) sob a carroceria e os pneus: assenta o carro no chão em qualquer cena
  if (opc.sombraChao !== false) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 576; const g = cv.getContext('2d'), px = (x, z) => [(x + 1.4) / 2.8 * 256, (3.2 - z) / 6.4 * 576];
    g.clearRect(0, 0, 256, 576);
    for (let i = 0; i < 14; i++) {                                                                       // retângulo arredondado com bordas macias
      const grow = 0.02 + i * 0.045, a = 0.075 * (1 - i / 16), [x0, z0] = px(-0.88 - grow, ZN - 0.25 + grow), [x1, z1] = px(0.88 + grow, -ZN + 0.30 - grow); g.fillStyle = `rgba(0,0,0,${a})`;
      const r = 34 + i * 8; g.beginPath(); if (g.roundRect) g.roundRect(x0, z0, x1 - x0, z1 - z0, r); else g.rect(x0, z0, x1 - x0, z1 - z0); g.fill();
    }
    for (const z of [ZF, ZT]) for (const s of [1, -1]) { const [cx, cy] = px(s * 0.80, z); const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 30); gr.addColorStop(0, 'rgba(0,0,0,0.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, 30, 34, 0, 0, Math.PI * 2); g.fill(); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const plano = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 6.4), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    plano.rotation.x = -Math.PI / 2; plano.position.y = 0.004; plano.renderOrder = -1; plano.name = 'sombraChao'; G.add(plano);
  }
  const fachos = [];
  for (const s of [1, -1]) { const f = new THREE.SpotLight(0xfff2dc, 0, 50, 0.40, 1.0, 1.7); f.position.set(s * 0.58, 0.72, ZN - 0.1); f.target.position.set(s * 0.5, 0.0, ZN + 16); G.add(f, f.target); fachos.push(f); }
  const api = {
    grupo: G, pintura: pint, rodas, barra,
    /** luzes de emergência: t em segundos; modo 'off' | 'ligado' | 'fixo' | 'busca' */
    /** luzes de emergência com controle direto: { v, a, ambar, busca, forca, t } (v = vermelho, a = azul, 0..1); forca = intensidade da luz colorida na cena (padrão 5) */
    luzesManual({ v = 0, a = 0, ambar = 0, busca = 0, forca = 5, t = 0 } = {}) { if (barra) barra.definir(v, a, ambar, busca, t, forca); extras.atualizar(v, a); },
    luzes(t, modo = 'ligado') { if (barra) { barra.atualizar(t, modo); const u = barra.ultimo || { v: 0, a: 0 }; extras.atualizar(u.v, u.a); } else extras.atualizar(0, 0); },
    /** gira as rodas conforme a distância percorrida (m) */
    /** farois(ligado, intensidade) / freio(ligado) / re(ligado) / seta(lado: 1 esquerda | -1 direita, ligado) */
    farois(on, forca = 70) { ft.luzes.definir('farol', on ? 0.85 : 0); for (const f of fachos) f.intensity = on ? forca : 0; },
    freio(on) { ft.luzes.definir('freio', on ? 0.5 : 0); },
    re(on) { ft.luzes.definir('re', on ? 0.9 : 0); },
    seta(lado, on) { const m = ft.luzes.materiais['seta' + (lado > 0 ? 'E' : 'D')]; if (m) m.opacity = on ? 0.9 : 0; },
    rodar(metros) { for (const r of rodas) r.giro.rotation.x = (metros / M.RP) * r.lado; },
    /** esterça as rodas dianteiras (rad, positivo = para a esquerda do carro) */
    esterco(rad) { for (const r of rodas) if (r.dianteira) r.pivo.rotation.y = rad; },
  };
  return api;
}

/** malha de céu (esfera com gradiente, sol opcional) para usar como fundo; os mesmos parâmetros de criarAmbiente */
export function criarCeuMalha({ sol = [-0.45, 0.62, 0.65], zenite = [0.20, 0.42, 0.85], horizonte = [0.86, 0.91, 0.96], chao = [0.30, 0.31, 0.32], raio = 50 } = {}) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { zen: { value: new THREE.Vector3(...zenite) }, hor: { value: new THREE.Vector3(...horizonte) }, cha: { value: new THREE.Vector3(...chao) }, sol: { value: new THREE.Vector3(...sol).normalize() } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vD; uniform vec3 zen, hor, cha, sol;
      void main(){ vec3 d = normalize(vD); float h = d.y; vec3 c;
        if (h >= 0.0) { c = mix(hor, zen, pow(h, 0.55)); float s = max(dot(d, sol), 0.0); c += vec3(1.0, 0.93, 0.8) * (pow(s, 600.0) * 30.0 + pow(s, 24.0) * 0.5); }
        else { c = mix(hor * 0.75, cha, clamp(-h * 3.0, 0.0, 1.0)); }
        gl_FragColor = vec4(c, 1.0); }`,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(raio, 48, 24), mat);
}

/** ambiente de reflexos (céu com sol, horizonte e chão) para a pintura e os vidros; use como scene.environment */
export function criarAmbiente(renderer, { sol, zenite, horizonte, chao, paineis = [] } = {}) {
  const sc = new THREE.Scene(); sc.add(criarCeuMalha({ sol, zenite, horizonte, chao }));
  for (const p of paineis) {                                                                                        // painéis luminosos (postes, softboxes) que aparecem como faixas de reflexo na pintura
    const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...p.cor).multiplyScalar(p.k ?? 1), side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(...p.pos); m.lookAt(0, 0, 0); sc.add(m);
  }
  const pm = new THREE.PMREMGenerator(renderer), tex = pm.fromScene(sc, 0.0).texture; pm.dispose(); return tex;
}
