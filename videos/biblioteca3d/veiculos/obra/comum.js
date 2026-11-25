// PEÇAS COMUNS DAS MÁQUINAS DE OBRA (escavadeira, retroescavadeira, pá carregadeira, rolo compactador, caminhão basculante).
// Genéricas e fictícias ("HRYZ OBRAS"), sem marca nem cópia de modelo real. Mesma convenção do kit: metros, frente em +Z,
// +X = lado do motorista (esquerda), origem no meio do comprimento, chão em y = 0.
//
// ferramentas(): cada máquina expõe api.ferr = { eixos: [{ id, nome, v, min, max, vel }], mover(i, delta), definir(i, v) } e
// o jogo (ou a bancada) mexe nos eixos; a pose é aplicada na hora.
import * as THREE from 'three';
import * as K from '../kit/kit.js';

export { K };
export const AMARELO = 0xf2b20c;

export function materiais(cor = AMARELO) {
  const m = K.materiais(cor);
  m.pintura = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.45, metalness: 0.1 });          // tinta industrial (sem verniz de carro)
  m.chassi = new THREE.MeshStandardMaterial({ color: 0x24262a, roughness: 0.6, metalness: 0.35 });
  m.aco = new THREE.MeshStandardMaterial({ color: 0x5a5e64, roughness: 0.45, metalness: 0.8 });
  m.haste = new THREE.MeshStandardMaterial({ color: 0xe8ecf0, roughness: 0.08, metalness: 1.0 });        // haste cromada do cilindro hidráulico
  m.desgaste = new THREE.MeshStandardMaterial({ color: 0x6d6a63, roughness: 0.75, metalness: 0.5 });    // aço gasto (dentes, lâmina)
  m.sapata = new THREE.MeshStandardMaterial({ color: 0x2c2c2e, roughness: 0.85, metalness: 0.4 });
  m.terra = new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 1.0 });
  m.cabine = new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.5, metalness: 0.3 });
  m.vidroCab = new THREE.MeshPhysicalMaterial({ color: 0x1b2a33, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  m.assento = new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.8 });
  m.preto = new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.7 });
  return m;
}

/** caixa entre dois pontos (viga): seção sx × sy, comprimento = distância de a até b */
export function viga(a, b, sx, sy, mat, r = 0.02) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B);
  const m = K.caixa(sx, sy, L, mat, r); m.position.copy(A).lerp(B, 0.5); m.lookAt(B); return m;
}

/** cilindro hidráulico: camisa (grossa) presa em A, haste cromada presa em B; atualizar(A, B) estica/encolhe */
export function cilindroHidraulico(rCam, rHaste, comp, mats) {
  const g = new THREE.Group();
  const cam = new THREE.Mesh(new THREE.CylinderGeometry(rCam, rCam, comp, 16), mats.pintura); cam.geometry.rotateX(Math.PI / 2); cam.geometry.translate(0, 0, comp / 2); cam.castShadow = true; g.add(cam);
  const fundo = new THREE.Mesh(new THREE.SphereGeometry(rCam * 1.05, 12, 8), mats.pintura); g.add(fundo);
  const haste = new THREE.Mesh(new THREE.CylinderGeometry(rHaste, rHaste, 1, 12), mats.haste); haste.geometry.rotateX(Math.PI / 2); haste.geometry.translate(0, 0, 0.5); g.add(haste);
  const olhal = new THREE.Mesh(new THREE.TorusGeometry(rHaste * 1.3, rHaste * 0.5, 8, 14), mats.aco); g.add(olhal);
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), Z = new THREE.Vector3(0, 0, 1);
  haste.userData.dinamico = olhal.userData.dinamico = true;                    // mudam de tamanho/posição: não mesclar
  g.atualizar = (A, B) => {
    vA.copy(A); vB.copy(B); const d = vA.distanceTo(vB);
    g.position.copy(vA); g.quaternion.setFromUnitVectors(Z, vB.clone().sub(vA).normalize());
    const ini = Math.max(comp * 0.6, d - comp * 0.98);            // a haste sai da camisa e vai até B
    haste.position.z = ini; haste.scale.z = Math.max(0.01, d - ini); olhal.position.z = d; olhal.rotation.y = Math.PI / 2;
  };
  return g;
}

/** pino (articulação) ao longo de x */
export function pino(r, comp, mats, pos) { return K.cilX(r, comp, mats.aco, pos, 14); }

/**
 * Esteira: sapatas em volta de um estádio (roda motriz atrás, roda guia na frente), roletes, quadro.
 * comp = distância entre os centros das rodas das pontas; R = raio das rodas das pontas; larg = largura da sapata.
 * mover(metros) faz as sapatas andarem (o jogo chama no rodar).
 */
export function esteira(comp, R, larg, mats, { nSap = 0 } = {}) {
  const g = new THREE.Group();
  const perim = 2 * comp + 2 * Math.PI * R, passo = 0.19, n = nSap || Math.round(perim / passo), dp = perim / n;
  const geoS = new THREE.BoxGeometry(larg, 0.05, dp * 0.92); const garra = new THREE.BoxGeometry(larg, 0.04, 0.035); garra.translate(0, -0.04, 0);
  const sap = new THREE.InstancedMesh(geoS, mats.sapata, n), gar = new THREE.InstancedMesh(garra, mats.sapata, n);
  sap.castShadow = gar.castShadow = true; sap.frustumCulled = gar.frustumCulled = false; g.add(sap, gar);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s1 = new THREE.Vector3(1, 1, 1), X = new THREE.Vector3(1, 0, 0);
  // ponto do estádio no parâmetro u (0..perim): começa embaixo, na roda de trás, indo para a frente
  const ponto = u => {
    u = ((u % perim) + perim) % perim; const z0 = -comp / 2, z1 = comp / 2;
    if (u < comp) return [z0 + u, -R, 0];                                       // embaixo, para a frente (normal para baixo)
    u -= comp; if (u < Math.PI * R) { const a = -Math.PI / 2 + u / R; return [z1 + Math.cos(a) * R, Math.sin(a) * R, a + Math.PI / 2]; }
    u -= Math.PI * R; if (u < comp) return [z1 - u, R, Math.PI];               // em cima, para trás
    u -= comp; const a = Math.PI / 2 + u / R; return [z0 + Math.cos(a) * R, Math.sin(a) * R, a + Math.PI / 2];
  };
  g.mover = metros => {
    for (let i = 0; i < n; i++) {
      const [z, y, ang] = ponto(i * dp - metros);
      p.set(0, y, z); q.setFromAxisAngle(X, -ang); M.compose(p, q, s1); sap.setMatrixAt(i, M); gar.setMatrixAt(i, M);
    }
    sap.instanceMatrix.needsUpdate = gar.instanceMatrix.needsUpdate = true;
  };
  g.mover(0);
  // rodas das pontas (dentada atrás), roletes e quadro
  const motriz = K.cilX(R * 0.92, larg * 0.6, mats.aco, [0, 0, -comp / 2], 20); g.add(motriz);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, d = K.caixa(larg * 0.5, 0.07, 0.09, mats.aco, 0, [0, Math.sin(a) * R * 0.93, -comp / 2 + Math.cos(a) * R * 0.93]); d.rotation.x = -a; g.add(d); }
  g.add(K.cilX(R * 0.88, larg * 0.6, mats.aco, [0, 0, comp / 2], 20));
  const nr = Math.max(4, Math.round(comp / 0.6));
  for (let i = 1; i < nr; i++) g.add(K.cilX(R * 0.42, larg * 0.55, mats.aco, [0, -R + R * 0.42 + 0.03, -comp / 2 + comp * i / nr], 12));
  for (const z of [-comp * 0.2, comp * 0.2]) g.add(K.cilX(R * 0.28, larg * 0.4, mats.aco, [0, R - 0.28 * R - 0.02, z], 10));
  g.add(K.caixa(larg * 0.55, R * 1.1, comp * 0.92, mats.chassi, 0.03, [0, -R * 0.1, 0]));
  g.motriz = motriz;
  return g;
}

/** cabine de máquina (estrutura ROPS: colunas, teto, vidros) com o assento e o painel; origem no piso, centro; frente em +z */
export function cabine(w, d, h, mats, { vidroTras = true, portaX = 1 } = {}) {
  const g = new THREE.Group(), c = 0.07;
  for (const x of [-w / 2 + c / 2, w / 2 - c / 2]) for (const z of [-d / 2 + c / 2, d / 2 - c / 2]) g.add(K.caixa(c, h, c, mats.cabine, 0.015, [x, h / 2, z]));
  g.add(K.caixa(w + 0.08, 0.09, d + 0.10, mats.pintura, 0.03, [0, h + 0.03, 0]));
  g.add(K.caixa(w - 0.05, 0.05, d - 0.05, mats.cabine, 0.01, [0, 0.025, 0]));
  const vidro = (sx, sy, sz, pos) => { const v = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mats.vidroCab); v.position.set(...pos); g.add(v); };
  vidro(w - c * 2, h - 0.15, 0.015, [0, h / 2 + 0.05, d / 2 - 0.02]);
  if (vidroTras) vidro(w - c * 2, h * 0.55, 0.015, [0, h * 0.62, -d / 2 + 0.02]);
  for (const s of [-1, 1]) vidro(0.015, h - 0.15, d - c * 2, [s * (w / 2 - 0.02), h / 2 + 0.05, 0]);
  g.add(K.caixa(w * 0.45, 0.12, 0.45, mats.assento, 0.04, [0, 0.45, -d * 0.12]));          // assento
  g.add(K.caixa(w * 0.45, 0.55, 0.10, mats.assento, 0.04, [0, 0.78, -d * 0.12 - 0.24]));
  g.add(K.caixa(w * 0.7, 0.32, 0.18, mats.preto, 0.03, [0, 0.62, d / 2 - 0.25]));            // painel
  g.add(K.caixa(0.05, 0.25, 0.05, mats.preto, 0, [w * 0.18, 0.62, -d * 0.02]));             // alavancas
  g.add(K.caixa(0.05, 0.25, 0.05, mats.preto, 0, [-w * 0.18, 0.62, -d * 0.02]));
  g.add(K.caixa(0.03, 0.45, 0.03, mats.cabine, 0, [portaX * (w / 2 + 0.02), h * 0.5, d * 0.1]));   // maçaneta/corrimão da porta
  return g;
}

/** giroflex âmbar (cúpula) para o teto; devolve { grupo, mat } */
export function giroflex(pos, mats) {
  const g = new THREE.Group(); g.position.set(...pos);
  g.add(K.cilX(0.07, 0.02, mats.preto, [0, 0, 0]).rotateZ(Math.PI / 2));
  const mat = new THREE.MeshStandardMaterial({ color: 0x8a5200, emissive: 0xffa000, emissiveIntensity: 0, roughness: 0.2, transparent: true, opacity: 0.92 });
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.14, 16), mat); c.position.y = 0.08; g.add(c);
  return { grupo: g, mat };
}

/** adesivo lateral "HRYZ OBRAS" + número (fictício) */
export function adesivo(texto, sub, larg, alt, cor = '#1a1a1a') {
  const t = K.tela(Math.round(larg * 220), Math.round(alt * 220), (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = cor; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = `900 ${Math.round(h * 0.58)}px ${K.FONTE}`; g.fillText(texto, 4, h * 0.42);
    if (sub) { g.font = `700 ${Math.round(h * 0.26)}px ${K.FONTE}`; g.fillText(sub, 6, h * 0.86); }
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(larg, alt), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }));
}
export function adesivoLados(texto, sub, larg, alt, x, y, z, cor) {
  const g = new THREE.Group();
  for (const s of [1, -1]) { const a = adesivo(texto, sub, larg, alt, cor); a.position.set(s * x, y, z); a.rotation.y = s * Math.PI / 2; g.add(a); }
  return g;
}

/** faixas zebradas amarelo/preto de segurança */
export function zebrado(larg, alt) {
  const t = K.tela(256, 64, (g, w, h) => { g.fillStyle = '#f2b20c'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; for (let i = -4; i < 12; i++) { g.beginPath(); g.moveTo(i * 32, h); g.lineTo(i * 32 + 16, h); g.lineTo(i * 32 + 32, 0); g.lineTo(i * 32 + 16, 0); g.fill(); } });
  t.wrapS = THREE.RepeatWrapping; t.repeat.set(larg / 0.5, 1);
  return new THREE.Mesh(new THREE.PlaneGeometry(larg, alt), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }));
}

/** controle dos eixos da ferramenta */
export function ferramentas(eixos, aplicar) {
  const f = {
    eixos,
    mover(i, delta) { const e = eixos[i]; if (!e) return; e.v = THREE.MathUtils.clamp(e.v + delta * e.vel, e.min, e.max); aplicar(); },
    definir(i, v) { const e = eixos[i]; if (!e) return; e.v = THREE.MathUtils.clamp(v, e.min, e.max); aplicar(); },
    valor(id) { return eixos.find(e => e.id === id)?.v ?? 0; },
  };
  aplicar(); return f;
}

/** luzes de trabalho e as luzes comuns (faróis, lanternas) de uma máquina */
export function luzesBasicas(G, mats, { frente, tras, yF, yT, xs, giros = [] }) {
  const luzes = { farol: [], freio: [], re: [], setaE: [], setaD: [], posicao: [], emergencia: [] };
  for (const s of [1, -1]) {
    const f = K.lampada(0.20, 0.14, 0.06, 0xfff4dc, [s * xs, yF, frente], 0.02, 0.9); G.add(f.malha); luzes.farol.push(f.mat);
    const fr = K.lampada(0.12, 0.10, 0.05, 0xff1a1a, [s * xs, yT, tras], 0.02); G.add(fr.malha); luzes.freio.push(fr.mat);
    const st = K.lampada(0.10, 0.08, 0.05, 0xffa020, [s * (xs - 0.16), yT, tras], 0.02); G.add(st.malha); luzes[s > 0 ? 'setaE' : 'setaD'].push(st.mat);
    const rr = K.lampada(0.10, 0.08, 0.05, 0xffffff, [s * (xs - 0.30), yT, tras], 0.02); G.add(rr.malha); luzes.re.push(rr.mat);
  }
  for (const gr of giros) luzes.emergencia.push({ mat: gr.mat, lado: 0, pisca: false, cor: 0xffa000 });
  return luzes;
}

/** terra dentro de uma caçamba: meia esfera achatada; nivel(0..1) mostra o quanto está cheia */
export function terraNaCacamba(pai, pos, rx, ry, rz, mats) {
  const g = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const m = new THREE.Mesh(g, mats.terra); m.position.set(...pos); m.scale.set(rx, 0.001, rz); m.visible = false; m.castShadow = true; m.userData.dinamico = true; pai.add(m);
  m.nivel = n => { m.visible = n > 0.02; m.scale.set(rx * (0.6 + 0.4 * n), ry * n, rz * (0.6 + 0.4 * n)); };
  return m;
}
/** descrição de uma caçamba para a física do jogo (cavar, carregar, despejar) */
export function cacamba({ nome, cap, obj, ponta, centro, despejando, terra }) {
  const c = { nome, cap, carga: 0, obj, despejando,
    ponta: () => obj.localToWorld(new THREE.Vector3(...ponta)), centro: () => obj.localToWorld(new THREE.Vector3(...centro)),
    definirCarga(v) { c.carga = Math.max(0, Math.min(cap, v)); terra?.nivel(c.carga / cap); } };
  return c;
}
