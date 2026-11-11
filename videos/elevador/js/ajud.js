// Ajudantes das cenas: estado padrão dos mundos D (casa em corte) e R (rua), carros estacionados, pisca da lâmpada, cartela final.
import * as THREE from 'three';
import { mundos, scene, brilho, renderer } from './motor.js';
import { lerp, suave } from './util.js';
import { S, V, PI } from './base.js';
import { Y_CAB } from './casa.js';

// ---------------------------------------------------------------------------------------------------- ajudantes de estado
export const emD = (...as) => { for (const a of as) { if (a.grupo.parent !== mundos.D) mundos.D.add(a.grupo); a.grupo.visible = true; } };
export const emR = (...as) => { for (const a of as) { if (a.grupo.parent !== mundos.R) mundos.R.add(a.grupo); a.grupo.visible = true; } };
export const lerpV = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
export const piscada = (t, per = 3.2, fase = 0) => { const x = ((t + fase) % per + per) % per; return x < 0.16 ? Math.sin(x / 0.16 * PI) : 0; };

// estado padrão do mundo D (casa em corte); cada plano ajusta o que precisa depois
export function D0({ hora = 18, ycab = Y_CAB, luz = 1, emerg = null, corte = false, poco = true, grade = 0, t = 0, rig = 'wide' } = {}) {
  const D = S.D;
  D.hora(hora); D.rig(rig);
  if (rig === 'cabine') renderer.toneMappingExposure *= 1.3;
  scene.background = D.fundo;
  D.mostrarParedeCorte(corte); D.mostrarParedePoco(poco);
  D.cab.luz(luz, emerg ?? (rig === 'cabine' ? 2.2 : 0));
  D.cab.abrirGrade(grade); D.cab.grade.position.x = 0; D.cab.led.material.emissiveIntensity = 0;
  for (let n = 0; n < 5; n++) D.abrirPorta(n, 0);
  D.cabinePos(ycab);
  D.fenda.intensity = 0; D.luzJanela(false);
  D.cab.botoes.forEach((b, i) => D.cab.botao(i, 0));
  D.cab.led.material.emissiveIntensity = 0;
  D.cab.fone.position.copy(D.cab.foneRepouso); D.cab.fone.rotation.set(0, 0, 0); D.cab.cordao(D.cab.foneRepouso.clone());
  D.cab.indicador.material.map = D.cab.tSemSeta;
  D.balancarPendulo(t);
  S.poeira.visible = false; S.manta.visible = false; S.cesto.visible = false; S.barra.visible = false;
}
// estado padrão do mundo R (rua)
export function R0(modo, t = 0, fx = 0) {
  const R = S.R;
  R.hora(modo); R.rig(modo); R.focar(fx, -4); R.animarVapor(t); R.abrirPorta(0); R.campainha(0);
  scene.fog = new THREE.FogExp2(modo === 'crepusculo' ? 0x2a3350 : 0xb9c4d0, modo === 'crepusculo' ? 0.0055 : 0.0065);
  S.caixa.visible = false; S.cel.visible = false; S.manta.visible = false; R.luzEmerg.intensity = 0;
}
// carros estacionados nos dois modos (o carro dos donos e os da cena ficam por conta de cada plano)
export function estacionados(modo = 'crepusculo') {
  const pk = (c, x, z, g) => { c.grupo.visible = true; c.colocar(x, 0.0, z, g); c.farois(0); c.lanternas(0.2); };
  pk(S.taxi, -10.5, -2.3, PI / 2); pk(S.sedanA, 12.0, -2.3, -PI / 2); pk(S.sedanB, -24, 2.3, -PI / 2);
  if (modo === 'crepusculo') pk(S.van, 17.5, -2.3, PI / 2);
}
export function lampSintoma(u, ini) {                               // pisca da lâmpada da cabine (1 = acesa)
  if (u < ini) return 1;
  const x = u - ini, f = [1, 0.15, 1, 0.05, 0.6, 0.0, 0.9, 0.1, 1, 0.25, 0.85];
  return f[Math.min(f.length - 1, Math.floor(x * 24))] ?? 1;
}

// cartela final (tintas do capturar)
function cartela(k) {
  return (g, w, h) => {
    const q = w / 1080;
    g.save(); g.scale(q, q); w = 1080; h = h / q; g.globalAlpha = k; g.textAlign = 'center';
    g.fillStyle = '#e9e6df'; g.font = '500 44px "DejaVu Sans", sans-serif'; g.fillText('CASO REAL', w / 2, h * 0.355);
    g.fillStyle = '#cfcbc2'; g.font = '34px "DejaVu Sans", sans-serif';
    g.fillText('Nova York · 25 a 28 de janeiro de 2019', w / 2, h * 0.405);
    g.fillText('Marites Fortaliza sobreviveu', w / 2, h * 0.44);
    g.fillStyle = '#a7a39a'; g.font = '30px "DejaVu Sans", sans-serif'; g.fillText('Reconstituição ilustrativa', w / 2, h * 0.48);
    g.font = 'bold 56px "DejaVu Sans", sans-serif'; g.fillStyle = '#c9a24a'; g.fillText('HRYZ ANIMATION', w / 2, h * 0.60);
    g.font = '24px "DejaVu Sans", sans-serif'; g.fillStyle = '#8a867e';
    g.fillText('Tempo preso: relato dela à polícia; os bombeiros não confirmaram o horário exato.', w / 2, h * 0.895);
    g.fillStyle = '#9a968e'; g.fillText('Fontes: NBC News · AP · BuzzFeed News · Dept. de Edifícios de NY', w / 2, h * 0.93);
    g.restore();
  };
}
export { cartela };


// luzes de emergência (vermelho/azul/branco) no teto do carro; `pos` em unidades do modelo [x, y, z]; liga os brilhos e a luz de ambiente piscante
export function giroflex(c, t, pos, { luz = true, fase = 0, hz = 3.2 } = {}) {
  if (!c.gir) {
    c.gir = pos.map((p, i) => {
      const cores = i % 2 ? ['60,130,255', '255,255,255'] : ['255,40,24', '255,240,230'];
      const s = cores.map(cor => { const b = brilho(cor, 2.6, 0); b.position.set(p[0] * 1.7, p[1] * 1.7, p[2] * 1.7); c.corpoGrupo.add(b); return b; });
      return s;
    });
  }
  const ph = ((t * hz + fase) % 1 + 1) % 1;
  c.gir.forEach((s, i) => { const on = ((ph + (i % 2) * 0.5) % 1) < 0.5; s[0].material.opacity = on ? 1 : 0.0; s[1].material.opacity = on ? 0.0 : 0.85; });
  if (luz) { const R = S.R; R.luzEmerg.visible = true; const on = ph < 0.5; R.luzEmerg.color.set(on ? 0xff2a18 : 0x3a78ff); R.luzEmerg.intensity = 24; const w = c.grupo.position; R.luzEmerg.position.set(w.x, 3.2, w.z - 1.0); }
}
