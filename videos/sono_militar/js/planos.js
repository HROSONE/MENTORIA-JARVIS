// Linha do tempo do Short: constrói os mundos e comanda cada plano (câmera, atores, efeitos) em função do tempo.
import * as THREE from 'three';
import { cam, mundos, scene, renderer } from './motor.js';
import { clamp, lerp, suave, suave5, entra, sai, inv, ruido, mulberry32 } from './util.js';
import { S, Q, V, PI, plano, acharPlano, reset, mostrar, camara, ambiente, mix3 } from './base.js';
import { construirF, POS } from './frente.js';
import { criarFX } from './fx.js';
import { Ator } from './atores.js';
import * as PR from './props.js';
import * as X from './tex2.js';
import * as PZ from './poses.js';
import { prepararOlhos, prepararOlheiras } from './rosto.js';
import { construirSala, construirQuarto, POS_S } from './sala.js';
import { construirLago, deitadoCanoa } from './lago.js';
import { montarPlanos } from './cenas.js';

export async function construirTudo() {
  S.F = await construirF(mundos.F);
  S.fx = criarFX(mundos.F);
  const fx = S.fx;
  // holofotes e fogueiras do campo de batalha (ao fundo da guarita)
  fx.addHolofote(-45, -60, 0.0, 0.50); fx.addHolofote(38, -70, 2.1, 0.43); fx.addHolofote(-100, -55, 4.0, 0.38); fx.addHolofote(100, -65, 1.0, 0.45);
  for (const [x, z, t] of [[-30, -50, 1.4], [26, -62, 1.8], [-62, -72, 2.2], [58, -76, 2.0], [-8, -86, 2.6], [86, -64, 1.5]]) fx.addFogo(x, 0, z, t);
  S.sala = construirSala(mundos.S); S.quarto = construirQuarto(mundos.S); S.lago = construirLago(mundos.S);
  // atores
  S.soldado = await Ator.criar('soldado');
  S.atirador = await Ator.criar('soldado'); S.atirador.pintar({ M_farda: '#565c3c', M_capacete: '#4a5132' });
  S.observador = await Ator.criar('soldado', { escala: 1.02 }); S.observador.pintar({ M_farda: '#5f6340', M_capacete: '#555c38' });
  // elenco do mundo S: cadetes (aviadores), instrutor e a pessoa na cama
  S.cadetes = [];
  for (let i = 0; i < 3; i++) { const c = await Ator.criar('aviador', { escala: 0.98 + 0.03 * i }); if (i === 1) c.pintar({ M_jaqueta: '#6b4a2c', M_jaq_barra: '#5a3c22' }); if (i === 2) c.pintar({ M_jaqueta: '#4e3a26', M_jaq_barra: '#3f2e1d', M_calca: '#8a7a56' }); S.cadetes.push(c); }
  S.instrutor = await Ator.criar('pai', { escala: 1.0 }); S.instrutor.pintar({ M_terno: '#8b7a56', M_terno_manga: '#8b7a56', M_calca: '#7a6b4a', M_gola_camisa: '#e6e0cc', M_sapato: '#2b1d12' });
  S.pessoa = await Ator.criar('homem'); S.pessoa.pintar({ M_camisa: '#6f82a8', M_camisa_manga: '#6f82a8', M_camisa_gola: '#6f82a8', M_jeans: '#8fa0c4', M_jeans_plano: '#8fa0c4', M_jeans_punho: '#8fa0c4' });
  for (const a of [S.soldado, S.atirador, S.observador]) prepararOlhos(a);
  for (const a of [...S.cadetes, S.pessoa, S.instrutor]) prepararOlhos(a);
  S.fuzil = PR.criarFuzil(true); S.fuzil.visible = false; mundos.F.add(S.fuzil); S.fuzilDorme = PR.criarFuzil(false); S.fuzilDorme.visible = false; mundos.F.add(S.fuzilDorme);
  S.binoculo = PR.criarBinoculo(); S.binoculo.visible = false; mundos.F.add(S.binoculo);
  prepararOlheiras(S.soldado);
  S.lata = PR.criarLata(); S.lata.position.set(PZ.MESA.x - 0.16, PZ.MESA.topo, PZ.MESA.z - 0.27); mundos.F.add(S.lata);
  S.cantilProp = PR.criarCantil(); S.cantilProp.visible = false; mundos.F.add(S.cantilProp); S.pilulasMao = PR.criarComprimidos(4); S.pilulasMao.visible = false; mundos.F.add(S.pilulasMao);
  S.giz = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 8), new THREE.MeshStandardMaterial({ color: 0xf2f2ea, roughness: 0.9 })); S.giz.rotation.z = 1.2; S.giz.visible = false; mundos.S.add(S.giz);
  S.dias = X.criarLousa(512, 256); { const q = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.49), new THREE.MeshStandardMaterial({ map: S.dias.tex, roughness: 0.9 })); q.position.set(PZ.MESA.x + 0.44, 1.72, PZ.MESA.z - 1.44); q.rotation.y = -0.12; mundos.F.add(q); }
  S.atores = [S.soldado, S.atirador, S.observador, ...S.cadetes, S.instrutor, S.pessoa];
  for (const a of S.atores) { (S.cadetes.includes(a) || a === S.instrutor || a === S.pessoa ? mundos.S : mundos.F).add(a.grupo); a.grupo.rotation.order = 'YXZ'; }
  montarPlanos();
  return S;
}

const num = (s, d) => s ? s.split(',').map(Number) : d;
function depurar() {
  const F = S.F;
  const mundo = Q.get('mundo') || 'F';
  mostrar(mundo, Q.get('amb') || null);
  const vis = Q.get('vis'); if (vis) { S.sala.g.visible = vis === 'sala'; S.quarto.g.visible = vis === 'quarto'; S.lago.g.visible = vis === 'lago'; }
  const t = +(Q.get('tt') ?? 0.4);
  const h = +(Q.get('hora') ?? 1.0);
  const foco = num(Q.get('foco'), [0, -0.5]); F.focar(foco[0], foco[1]);
  F.hora(h, { fogo: +(Q.get('fogo') ?? 1) });
  scene.fog = new THREE.FogExp2(h < 6 || h > 19 ? 0x1a0e0c : 0xb8c0c4, +(Q.get('nevoa') ?? 0.006));
  S.fx.eventos = [{ t: 0.2, x: -9, z: -26, tam: 2.2 }, { t: 0.45, x: 14, z: -42, tam: 3.2 }, { t: 0.7, x: -3, z: -18, tam: 1.4 }, { t: 0.9, x: 24, z: -30, tam: 2.4 }];
  S.fx.rastros = [{ t: 0.3, de: [-30, 0.5, -30], para: [30, 8, -60] }, { t: 0.37, de: [-30, 0.5, -30], para: [30, 8, -60] }];
  S.fx.misseis = [{ t: 0, de: [-60, 40, -90], para: [-9, 0, -26], dur: 0.62 }];
  S.fx.avioes = [{ t: 0, de: [-80, 28, -40], para: [80, 22, -60], dur: 3 }];
  S.fx.atualizar(t, cam);
  reset();
  const pose = Q.get('pose');
  if (pose === 'canoa') { S.lago.atualizar(t); deitadoCanoa(S.pessoa, S.lago, t); } else if (pose) PZ.depurarPose(pose, t);
  let pos = num(Q.get('cam'), [0, 3, 12]), alvo = num(Q.get('alvo'), [0, 1.2, -1]);
  if (Q.get('rosto')) { const [dist, lat, alt] = num(Q.get('rosto'), [0.5, 0, 0]); const f = PZ.focoRosto(S[Q.get('quem') || 'soldado'], { dist, lat, alt }); pos = f.pos; alvo = f.alvo; }
  camara({ pos, alvo, fov: +(Q.get('fov') ?? 40), tr: 0 });
}
export function atualizar(t) {
  if (Q.has('cam')) { depurar(); return; }
  const p = acharPlano(t);
  reset();
  mostrar(p.mundo);
  p.fn(clamp(t - p.t0, 0, p.dur), t, p);
}
export function efeitos(t) {
  const e = { subs: 1, obturador: 0.35, fade: 0, flash: 0, flashCor: '255,255,255', tintas: null };
  if (S.planos.length) {
    const p = acharPlano(t), u = t - p.t0;
    if (p.efeito) Object.assign(e, p.efeito(u, t, p));
    e.subs = Math.max(1, Math.round(e.subs * 0.6));
    if (t > S.total - 1.0) e.fade = Math.max(e.fade, suave(inv(S.total - 1.0, S.total - 0.15, t)));
  }
  return e;
}
