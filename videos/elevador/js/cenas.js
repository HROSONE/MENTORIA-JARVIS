// Cenas do Short (parte 1): gancho, casa em corte, fachada, faxina, partida dos donos, a subida e a parada do elevador.
import * as THREE from 'three';
import { cam, mundos, scene } from './motor.js';
import { clamp, lerp, suave, suave5, entra, sai, inv, ruido, mulberry32, chaves } from './util.js';
import { S, Q, V, PI, plano, reset, mostrar, camara, mix3 } from './base.js';
import { Y_CAB, POCO, H } from './casa.js';
import { ZF, PORTA, CAMP } from './rua.js';
import * as P from './poses.js';
import { emD, emR, lerpV, piscada, D0, R0, estacionados, lampSintoma, cartela } from './ajud.js';
import { montarCenas2 } from './cenas2.js';

export function montarPlanos() {
  const D = () => S.D, R = () => S.R;
  const m = () => S.marites;

  // 1) GANCHO: o rosto dela atrás da grade de latão; a lâmpada pisca e corta para a casa
  plano('grade', 1.6, 'D', (u, t) => {
    D0({ hora: 17.6, poco: false, t, rig: 'cabine' });
    D().cab.luz(lampSintoma(u, 1.22), 0.9);
    D().fenda.color.set(0xffdcb0); D().fenda.intensity = 30;                     // luz do corredor de frente para o rosto (sombras da grade)
    emD(m());
    P.poseGrade(m(), t + 1.0, { medo: 0.5, olhar: [0.10, 0.04], tr: 1.4, ycab: Y_CAB });
    m().rosto({ expressao: 'medo', forca: 0.5 + 0.12 * suave(u / 1.6), olhar: [0.10 + 0.05 * ruido(t * 1.3, 2), 0.04], piscar: piscada(t, 2.6, 0.9) }); m().atualizarRosto();
    const k = suave(u / 1.6);
    camara({ pos: [lerp(2.10, 1.50, k), lerp(7.14, 7.10, k), lerp(-0.98, -0.74, k)], alvo: [0.30, 7.08, -0.80], fov: lerp(27, 24, k), roll: lerp(-0.03, 0.02, k), tr: 1.4, t, semente: 11 });
  }, { efeito: () => ({ subs: 1 }) });

  // 2) a casa em corte ao entardecer: câmera sobe e abre, mostrando a cabine acesa entre dois andares
  plano('casa', 3.6, 'D', (u, t) => {
    D0({ hora: lerp(17.55, 17.85, u / 3.6), poco: false, corte: true, t });
    emD(m()); P.poseGrade(m(), t, { medo: 0.8 }); m().rosto({ expressao: 'medo', forca: 0.8, olhar: [0.1, 0], piscar: piscada(t) }); m().atualizarRosto();
    const k = suave5(u / 3.6);
    camara({ pos: lerpV([-6.5, 3.2, 16.0], [5.0, 10.8, 35.0], k), alvo: lerpV([0.0, 6.6, -0.8], [0.0, 8.2, -1.5], k), fov: lerp(46, 36, k), roll: lerp(0.05, -0.01, k), tr: 0.5, t, semente: 12 });
  }, { efeito: () => ({ subs: 4, obturador: 0.35 }) });

  // 3) fachada ao entardecer: câmera sobe pela pedra até a cornija e o céu
  plano('fachada', 2.2, 'R', (u, t) => {
    R0('crepusculo', t, 0);
    estacionados('crepusculo'); S.suv.grupo.visible = true; S.suv.colocar(3.2, 0, -2.3, PI / 2); S.suv.farois(0); S.suv.lanternas(0.2);
    const k = suave(u / 2.2);
    camara({ pos: [lerp(-2.2, 0.8, k), lerp(1.25, 11.5, k), lerp(1.2, -2.0, k)], alvo: [lerp(0.4, 0.0, k), lerp(2.3, 15.2, k), ZF], fov: lerp(54, 58, k), roll: lerp(0.06, -0.03, k), tr: 0.7, t, semente: 13 });
  }, { efeito: () => ({ subs: 4, obturador: 0.35 }) });

  // 4) faxina: ela atravessa o salão com o cesto de roupa em direção à porta do elevador (que está parado no 2º andar)
  plano('faxina', 2.4, 'D', (u, t) => {
    const y0 = H;                                                     // piso do 2º andar
    D0({ hora: 17.9, ycab: y0, poco: true, t });
    D().abrirPorta(1, 0.0);
    const a = m(); emD(a);
    const vel = a.velocidade('Andar') || 1.1, rate = 1.05 / Math.max(vel, 0.4);
    const x = lerp(3.9, 1.55, suave(u / 2.4) * 0.4 + u / 2.4 * 0.6), z = lerp(-1.9, -0.82, suave(u / 2.4));
    a.colocar(x, y0, z, -PI / 2 + 0.12 * (1 - u / 2.4)); a.anim('Andar', t * rate + 0.2);
    a.rosto({ expressao: 'neutro', forca: 0.4, olhar: [0, -0.05], piscar: piscada(t, 2.4) }); a.atualizarRosto();
    a.grupo.updateMatrixWorld(true);
    S.cesto.visible = true;
    const frente = a.grupo.localToWorld(new THREE.Vector3(0, 0.80 / a.escala, 0.34 / a.escala));
    S.cesto.position.copy(frente).add(V(0, -0.14 + 0.01 * Math.sin(t * 7), 0)); S.cesto.rotation.set(0, a.grupo.rotation.y, 0);
    const alcaE = S.cesto.localToWorld(S.cesto.userData.alcas[0].clone()), alcaD = S.cesto.localToWorld(S.cesto.userData.alcas[1].clone());
    S.cesto.updateMatrixWorld(true);
    a.ikBraco('E', S.cesto.localToWorld(S.cesto.userData.alcas[1].clone()), V(-0.2, -1, 0.4)); a.ikBraco('D', S.cesto.localToWorld(S.cesto.userData.alcas[0].clone()), V(-0.2, -1, -0.4));
    const k = suave(u / 2.4);
    camara({ pos: [lerp(0.2, 0.9, k), y0 + lerp(1.3, 1.55, k), lerp(5.6, 4.2, k)], alvo: [lerp(2.9, 1.7, k), y0 + 1.15, -0.9], fov: lerp(44, 40, k), roll: lerp(0.03, -0.02, k), tr: 0.9, t, semente: 14 });
  }, { efeito: () => ({ subs: 3, obturador: 0.35 }) });

  // 5) os donos viajam: o SUV sai de frente da casa (lanternas vermelhas) e a rua fica vazia
  plano('donos', 1.8, 'R', (u0, t) => {
    const u = u0 * 1.6 / 1.8;
    R0('crepusculo', t, 0);
    estacionados('crepusculo');
    const x = 3.2 + 1.2 * u + 7.0 * u * u * u;
    S.suv.grupo.visible = true; S.suv.colocar(x, 0, -2.25 + 0.5 * suave(inv(0.4, 1.6, u)), PI / 2 - 0.06 * suave(inv(0.4, 1.6, u)), { dist: x });
    S.suv.farois(1, 0.6); S.suv.lanternas(0.35 + 0.9 * (1 - inv(0.0, 0.8, u)));
    camara({ pos: [lerp(-5.2, -4.2, u), lerp(1.05, 1.25, u), -3.6], alvo: [lerp(5.0, 10, u), 1.9, -4.0], fov: 38, roll: -0.02, tr: 0.8, t, semente: 15 });
  }, { efeito: () => ({ subs: 3, obturador: 0.35 }) });

  montarCenas2();
}
