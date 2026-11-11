// Linha do tempo do Short: constrói os mundos e comanda cada plano (câmera, atores, carros, efeitos) em função do tempo.
import * as THREE from 'three';
import { cam, mundos, scene } from './motor.js';
import { clamp, lerp, suave, suave5, entra, sai, inv, ruido, mulberry32 } from './util.js';
import { S, Q, V, PI, plano, acharPlano, reset, mostrar, camara, ambiente, mix3 } from './base.js';
import { construirD, Y_CAB, POCO, H } from './casa.js';
import { construirR, ZF, PORTA, CAMP } from './rua.js';
import { Ator } from './atores.js';
import { Carro } from './carros.js';
import { criarCesto, criarCaixaEntrega, criarBarra, criarManta, criarPoeira, criarCelular } from './props.js';
import * as P from './poses.js';
import { montarPlanos } from './cenas.js';

export async function construirTudo() {
  S.D = await construirD(mundos.D);
  S.R = await construirR(mundos.R);
  S.marites = await Ator.criar('faxineira'); S.marites.criarLagrimas(3);
  S.entregador = await Ator.criar('entregador');
  S.b1 = await Ator.criar('bombeiro'); S.b2 = await Ator.criar('bombeiro', { escala: 1.03 }); S.b2.pintar({ M_capacete: '#f1efe8' });
  S.b3 = await Ator.criar('bombeiro', { escala: 0.98 });
  S.atores = [S.marites, S.entregador, S.b1, S.b2, S.b3];
  for (const a of S.atores) mundos.D.add(a.grupo);
  S.manta = criarManta(S.marites);
  S.cesto = criarCesto(); mundos.D.add(S.cesto);
  S.caixa = criarCaixaEntrega(); mundos.R.add(S.caixa);
  S.barra = criarBarra(); mundos.D.add(S.barra);
  S.cel = criarCelular(); mundos.R.add(S.cel);
  S.poeira = criarPoeira(40, [0.9, 1.7, 0.9], 4); S.D.cab.grupo.add(S.poeira);
  // carros da rua
  S.suv = await Carro.criar('suv-luxury');
  S.fire = await Carro.criar('firetruck'); S.amb = await Carro.criar('ambulance');
  S.taxi = await Carro.criar('taxi'); S.sedanA = await Carro.criar('sedan', { pintura: ['#4d5563', '#1b1f27'] }); S.van = await Carro.criar('delivery');
  S.sedanB = await Carro.criar('sedan', { pintura: ['#7a2f2f', '#2a1010'] });
  S.suv.mats.forEach(m => m.color.set(0x2a2e3a));                       // o SUV dos donos: preto
  S.carros = [S.suv, S.fire, S.amb, S.taxi, S.sedanA, S.sedanB, S.van];
  for (const c of S.carros) mundos.R.add(c.grupo);
  montarPlanos();
  return S;
}

const num = (s, d) => s ? s.split(',').map(Number) : d;
// modo de depuração: câmera livre por parâmetros de URL
function depurar() {
  const D = S.D;
  const mundo = Q.get('mundo') || 'D';
  mostrar(mundo, Q.get('amb') || null);
  const h = +(Q.get('hora') ?? 18); D.hora(h);
  if (mundo === 'D') scene.background = D.fundo.clone();
  if (mundo === 'R') { S.R.hora(Q.get('modo') || 'crepusculo'); S.R.focar(+(Q.get('fx') ?? 0), -4); S.R.animarVapor(+(Q.get('tt') ?? 1)); S.R.abrirPorta(+(Q.get('porta') ?? 0)); S.R.campainha(+(Q.get('camp') ?? 0)); scene.fog = new THREE.FogExp2(S.R.modo === 'crepusculo' ? 0x2a3350 : 0xb9c4d0, S.R.modo === 'crepusculo' ? 0.006 : 0.007); }
  D.mostrarParedeCorte(Q.get('corte') === '1');
  D.mostrarParedePoco(Q.get('poco') !== '0');
  D.cab.luz(+(Q.get('luz') ?? 1), +(Q.get('emerg') ?? 0));
  D.fenda.intensity = 60 * D.fendaK * +(Q.get('fenda') ?? 0);
  D.cab.abrirGrade(+(Q.get('grade') ?? 0));
  for (let n = 0; n < 5; n++) D.abrirPorta(n, n === 2 ? +(Q.get('porta') ?? 0) : 0);
  D.cabinePos(+(Q.get('ycab') ?? Y_CAB));
  D.balancarPendulo(0.3);
  const pose = Q.get('pose'), a = S.marites;
  if (pose) {
    const tt = +(Q.get('tt') ?? 0.4);
    a.grupo.visible = true;
    if (pose === 'grade') P.poseGrade(a, tt, { medo: +(Q.get('medo') ?? 0.8) });
    else if (pose === 'botao') P.poseBotao(a, tt, +(Q.get('i') ?? 0), { press: +(Q.get('press') ?? 0) });
    else if (pose === 'fone') { const alvo = P.poseFone(a, tt, +(Q.get('k') ?? 1)); const fone = D.cab.fone; fone.position.copy(D.cab.grupo.worldToLocal(alvo.clone())); fone.rotation.set(0, 0.4, Math.PI / 2); D.cab.cordao(fone.position); }
    else if (pose === 'sentada') P.poseSentada(a, tt, {});
    else if (pose === 'parada') { P.colocarCab(a, 0.1, 0, Math.PI / 2); a.anim('Parado', tt); a.rosto({ expressao: 'neutro' }); a.atualizarRosto(); }
  }
  camara({ pos: num(Q.get('cam'), [0, 8, 24]), alvo: num(Q.get('alvo'), [0, 8, -4]), fov: +(Q.get('fov') ?? 40), tr: 0 });
}

export function atualizar(t) {
  if (Q.has('cam')) { depurar(); return; }
  const p = acharPlano(t);
  reset();
  mostrar(p.mundo);
  p.fn(clamp(t - p.t0, 0, p.dur), t, p);
}
export function efeitos(t) {
  const e = { subs: 1, obturador: 0.5, fade: 0, flash: 0, flashCor: '255,255,255', tintas: null };
  if (S.planos.length) {
    const p = acharPlano(t), u = t - p.t0;
    if (p.efeito) Object.assign(e, p.efeito(u, t, p));
    e.subs = Math.max(1, Math.round(e.subs * 0.6));                          // custo: ~1,7 s por amostra em D e ~3 s em R
    if (t > S.total - 1.0) e.fade = Math.max(e.fade, suave(inv(S.total - 1.0, S.total - 0.15, t)));
  }
  return e;
}
