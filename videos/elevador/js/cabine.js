// A cabine do elevador (origem no centro do piso; +X é o lado da porta/grade, Y para cima, Z para os lados): lambri de mogno, piso xadrez, corrimão de latão,
// painel com botões e telefone de emergência, indicador de andar, grade pantográfica de latão que desliza, luz do teto, luz de emergência.
import * as THREE from 'three';
import { brilho } from './motor.js';
import { Lote, M } from './lote.js';
import { texLambri, texXadrez, texIndicador } from './texturas.js';

export const CAB = { x: 0.60, z: 0.55, alt: 2.30, vao: 0.45 };          // meia profundidade, meia largura, altura, meia abertura da porta

export function construirCabine() {
  const g = new THREE.Group(); g.name = 'cabine';
  const d = { grupo: g, botoes: [], partes: {} };
  const mad = M(0xffffff, 0.42, { map: texLambri(), bumpMap: texLambri({ bump: true }), bumpScale: 2.2, metalness: 0.05 });
  const madEsc = M(0x2b1409, 0.5);
  const latao = M(0xc9a24a, 0.28, { metalness: 0.9 });
  const laoEsc = M(0x8f6f2c, 0.35, { metalness: 0.85 });
  const preto = M(0x0c0c0e, 0.35, { metalness: 0.2 });
  const L = new Lote(g);

  // ---- piso (xadrez) e teto
  L.caixa(1.30, 0.10, 1.20, madEsc, 0.0, -0.05, 0.0);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.1), M(0xffffff, 0.22, { map: texXadrez(), metalness: 0.05 })); piso.rotation.x = -Math.PI / 2; piso.position.y = 0.002; piso.receiveShadow = true; g.add(piso);
  L.caixa(1.30, 0.10, 1.20, madEsc, 0.0, CAB.alt + 0.05, 0.0);
  for (const sz of [-1, 1]) L.caixa(1.2, 0.02, 0.025, latao, 0.0, 0.012, sz * 0.545);          // rodapé de latão
  L.caixa(0.025, 0.02, 1.1, latao, -0.585, 0.012, 0.0);

  // ---- paredes de lambri: fundo (x = -0,6), esquerda (z = -0,55) e direita (z = +0,55; some nos cortes da casa de bonecas)
  const fundo = new THREE.Mesh(new THREE.BoxGeometry(0.05, CAB.alt, 1.1), mad); fundo.position.set(-0.625, CAB.alt / 2, 0); g.add(fundo);
  const esq = new THREE.Mesh(new THREE.BoxGeometry(1.2, CAB.alt, 0.05), mad); esq.position.set(0, CAB.alt / 2, -0.575); g.add(esq);
  const dir = new THREE.Mesh(new THREE.BoxGeometry(1.2, CAB.alt, 0.05), mad); dir.position.set(0, CAB.alt / 2, 0.575); g.add(dir);
  for (const m of [fundo, esq, dir]) { m.castShadow = true; m.receiveShadow = true; }
  d.partes.fundo = fundo; d.partes.esq = esq; d.partes.dir = dir;
  // batentes da porta e verga
  L.caixa(0.06, CAB.alt, 0.10, madEsc, 0.60, CAB.alt / 2, -0.50);
  L.caixa(0.06, CAB.alt, 0.10, madEsc, 0.60, CAB.alt / 2, 0.50);
  L.caixa(0.06, 0.25, 1.1, madEsc, 0.60, CAB.alt - 0.125, 0.0);
  L.caixa(0.008, CAB.alt, 0.016, latao, 0.632, CAB.alt / 2, -0.452); L.caixa(0.008, CAB.alt, 0.016, latao, 0.632, CAB.alt / 2, 0.452);

  // ---- corrimão de latão (fundo e laterais) com suportes
  const trilho = (x, y, z, len, eixo) => {
    L.cilindro(0.016, 0.016, len, latao, x, y, z, { seg: 10, rx: eixo === 'z' ? Math.PI / 2 : 0, rz: eixo === 'x' ? Math.PI / 2 : 0 });
  };
  trilho(-0.575, 0.92, 0.0, 0.95, 'z');
  trilho(-0.05, 0.92, -0.525, 1.0, 'x'); trilho(-0.05, 0.92, 0.525, 1.0, 'x');
  for (const [x, z] of [[-0.575, -0.38], [-0.575, 0.38], [-0.35, -0.525], [-0.35, 0.525], [0.25, -0.525], [0.25, 0.525]]) {
    const lat = Math.abs(z) > 0.5;
    L.cilindro(0.01, 0.01, 0.06, latao, x + (lat ? 0 : 0.0), 0.92, lat ? z * 0.985 : z, { seg: 8, rx: lat ? Math.PI / 2 : 0, rz: lat ? 0 : Math.PI / 2 });
  }
  // moldura de teto
  L.caixa(1.2, 0.05, 0.05, laoEsc, 0.0, CAB.alt - 0.025, -0.525); L.caixa(1.2, 0.05, 0.05, laoEsc, 0.0, CAB.alt - 0.025, 0.525); L.caixa(0.05, 0.05, 1.1, laoEsc, -0.575, CAB.alt - 0.025, 0.0);
  // painel de luz (vidro fosco com moldura)
  L.caixa(0.78, 0.012, 0.66, laoEsc, 0.0, CAB.alt - 0.006, 0.0);
  const vidroLuz = new THREE.Mesh(new THREE.PlaneGeometry(0.70, 0.58), new THREE.MeshBasicMaterial({ color: 0xffe3b0 })); vidroLuz.rotation.x = Math.PI / 2; vidroLuz.position.set(0, CAB.alt - 0.013, 0); g.add(vidroLuz);
  d.partes.vidroLuz = vidroLuz;

  // ---- painel de botões (parede esquerda, perto da porta) e telefone de emergência
  const px = 0.36, pz = -0.543;
  L.caixa(0.20, 0.78, 0.016, latao, px, 1.28, pz);
  const matBotao = new THREE.MeshStandardMaterial({ color: 0x3a3226, roughness: 0.3, metalness: 0.6, emissive: 0xff8a2a, emissiveIntensity: 0 });
  for (let i = 0; i < 5; i++) {
    const m = matBotao.clone();
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.016, 18), m); b.rotation.x = Math.PI / 2; b.position.set(px, 1.58 - i * 0.065, pz + 0.014); b.castShadow = true; g.add(b);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(0.023, 0.003, 6, 20), laoEsc); aro.position.copy(b.position); aro.position.z += 0.003; g.add(aro);
    d.botoes.push({ m, b });
  }
  const mAlarme = new THREE.MeshStandardMaterial({ color: 0x7a1010, roughness: 0.3, metalness: 0.3, emissive: 0xff2010, emissiveIntensity: 0 });
  const alarme = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.016, 18), mAlarme); alarme.rotation.x = Math.PI / 2; alarme.position.set(px, 1.22, pz + 0.014); g.add(alarme);
  d.botoes.push({ m: mAlarme, b: alarme, alarme: true });
  // caixa do telefone: porta aberta com o monofone no gancho
  L.caixa(0.15, 0.20, 0.03, laoEsc, px, 1.00, pz + 0.01);
  L.caixa(0.11, 0.15, 0.012, preto, px, 1.00, pz + 0.027);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), new THREE.MeshStandardMaterial({ color: 0x331000, emissive: 0xff2200, emissiveIntensity: 0 })); led.position.set(px + 0.04, 1.075, pz + 0.037); g.add(led); d.partes.led = led;
  const fone = new THREE.Group(); fone.name = 'monofone';
  const fp = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.12, 4, 10), preto); fp.rotation.z = Math.PI / 2; fone.add(fp);
  for (const sx of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.02, 0.026, 12), preto); c.position.set(sx * 0.075, 0.004, 0); c.rotation.x = Math.PI / 2; fone.add(c); }
  for (const m of fone.children) { m.castShadow = true; }
  fone.position.set(px, 1.0, pz + 0.042); g.add(fone);
  d.fone = fone; d.foneRepouso = fone.position.clone();
  // fio espiral do telefone: 7 trechos de uma curva entre a caixa e o monofone
  const fio = []; const matFio = M(0x070708, 0.5);
  for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 1, 5), matFio); s.visible = true; g.add(s); fio.push(s); }
  d.fio = fio; d.fioOrigem = new THREE.Vector3(px - 0.05, 0.93, pz + 0.03);

  // ---- indicador de andar sobre a porta (travado em "2", seta piscando)
  d.indicador = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.11), new THREE.MeshBasicMaterial({ map: texIndicador('2', '▲') }));
  d.indicador.position.set(0.572, CAB.alt - 0.14, 0.0); d.indicador.rotation.y = Math.PI / 2; g.add(d.indicador);
  L.caixa(0.012, 0.13, 0.24, preto, 0.568, CAB.alt - 0.14, 0.0);
  d.tSeta = texIndicador('2', '▲'); d.tSemSeta = texIndicador('2', '');

  // ---- grade pantográfica de latão (um grupo rígido que desliza em Z): 5 x 6 casas em X; hastes cruzadas em dois planos
  const grade = new THREE.Group(); grade.name = 'grade'; g.add(grade); d.grade = grade;
  const Lg = new Lote(grade);
  const nC = 5, nL = 6, a = 0.9 / nC, b = 2.02 / nL, z0 = -0.45, y0 = 0.03;
  for (let i = 0; i < nC; i++) for (let j = 0; j < nL; j++) {
    const xa = z0 + i * a, ya = y0 + j * b, len = Math.hypot(a, b), ang = Math.atan2(b, a);
    // haste que sobe para +z (plano x = 0,626) e haste que desce (x = 0,640)
    Lg.caixa(0.010, 0.016, len, latao, 0.626, ya + b / 2, xa + a / 2, { rx: -ang });
    Lg.caixa(0.010, 0.016, len, latao, 0.640, ya + b / 2, xa + a / 2, { rx: ang });
  }
  for (let i = 0; i <= nC; i++) for (let j = 0; j <= nL; j++) Lg.esfera(0.0105, latao, 0.633, y0 + j * b, z0 + i * a, { seg: 8 });
  for (const sz of [-1, 1]) Lg.cilindro(0.017, 0.017, 2.1, latao, 0.645, 1.05, sz * 0.46, { seg: 10 });
  Lg.caixa(0.04, 0.04, 0.96, latao, 0.645, 2.06, 0.0); Lg.caixa(0.03, 0.04, 0.96, latao, 0.645, 0.01, 0.0);
  Lg.fechar();
  // trilho da grade no teto e no piso
  L.caixa(0.05, 0.03, 1.5, laoEsc, 0.64, CAB.alt - 0.2, 0.0);

  // ---- luzes: lâmpada do teto (quente) e luz de emergência (bateria, fria e fraca)
  d.lampada = new THREE.PointLight(0xffc88a, 5.5, 4.5, 1.6); d.lampada.position.set(0.0, CAB.alt - 0.25, 0.0); g.add(d.lampada);
  d.emerg = new THREE.PointLight(0xdfe9ff, 0.0, 3.4, 1.6); d.emerg.position.set(0.30, 1.35, 0.40); g.add(d.emerg);
  const ledE = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.012, 0.012), new THREE.MeshStandardMaterial({ color: 0x223, emissive: 0xdde8ff, emissiveIntensity: 0 })); ledE.position.set(-0.35, CAB.alt - 0.02, 0.3); g.add(ledE); d.ledE = ledE;
  L.fechar();
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  piso.castShadow = false;
  vidroLuz.castShadow = false; vidroLuz.receiveShadow = false;

  // estado da luz: modo 'normal' | 'pisca' (k = 0..1) | 'emergencia'
  d.luz = (k, emerg = 0) => {
    d.lampada.intensity = 5.5 * k;
    d.vidroLuz = vidroLuz; vidroLuz.material.color.setRGB(1.0 * (0.12 + 0.88 * k), 0.89 * (0.10 + 0.9 * k), 0.69 * (0.08 + 0.92 * k));
    d.emerg.intensity = 0.8 * emerg; ledE.material.emissiveIntensity = 2.4 * emerg;
  };
  d.led = led;
  d.botao = (i, k) => { const bt = d.botoes[i]; if (bt) bt.m.emissiveIntensity = 2.0 * k; };
  d.abrirGrade = s => { grade.position.z = s * 0.95; grade.visible = s < 0.995; };
  d.cordao = (alvoMundo) => {                                                      // alvoMundo: posição do monofone em coordenadas do grupo da cabine
    const A = d.fioOrigem, B = alvoMundo, n = d.fio.length;
    const pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n; const p = A.clone().lerp(B, t); p.y -= Math.sin(t * Math.PI) * 0.16 * Math.min(1, A.distanceTo(B) * 2.5); pts.push(p); }
    d.fio.forEach((m, i) => {
      const p0 = pts[i], p1 = pts[i + 1], dir = p1.clone().sub(p0), len = dir.length();
      m.position.copy(p0).addScaledVector(dir, 0.5); m.scale.set(1, Math.max(len, 1e-4), 1);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    });
  };
  d.cordao(d.foneRepouso.clone().add(new THREE.Vector3(-0.0, -0.012, 0.0)));
  d.luz(1, 0);
  return d;
}
