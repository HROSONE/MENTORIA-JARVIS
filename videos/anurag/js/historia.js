// Trajetórias da perseguição na estrada (tempo da história s em segundos). Calculadas uma vez, em passos de 1/240 s, e consultadas por interpolação.
// Convenção: a estrada corre ao longo de +Z; o carro vai em +Z (giro 0); a esquerda do carro é +X; giro positivo vira o nariz para +X.
import { clamp, lerp, suave, suave5, inv } from './util.js';

export const COMP_T = 2.84 * 1.7, COMP_C = 2.54 * 1.7;     // comprimentos dos carros (modelos do Kenney na escala 1,7)
export const TEMPOS = { tap1: 5.4, tap2: 8.0, final: 10.4 };
const H = 1 / 240;

export function construirHistoria() {
  const { tap1: s1, tap2: s2, final: sH } = TEMPOS;
  const N = Math.round(26 / H);
  const T = [], C = [];
  const vT = s => 25 + 1.1 * s;
  const peso = s => 0.30 * Math.sin(1.9 * s + 0.4);                           // balanço lateral do carro de cima
  const dpeso = s => 0.30 * 1.9 * Math.cos(1.9 * s + 0.4);
  const chute = (s, s0, a, f) => (s > s0 ? a * Math.exp(-(s - s0) * 5.5) * Math.sin((s - s0) * f) : 0);   // trepidação após uma batida
  const xLat = s => (s > s1 ? -0.16 * (1 - Math.exp(-(s - s1) * 9)) * Math.exp(-(s - s1) * 1.0) : 0) + (s > s2 ? -0.30 * (1 - Math.exp(-(s - s2) * 9)) * Math.exp(-(s - s2) * 0.9) : 0);

  // ---------------- T (carro dos adolescentes)
  let z = 0, dist = 0, x = -1.75;
  let estado = null;
  for (let i = 0; i <= N; i++) {
    const s = i * H;
    if (s <= sH) {
      const v = vT(s);
      x = -1.75 + peso(s) + xLat(s);
      const dxdz = (dpeso(s)) / v;
      const yaw = Math.atan(dxdz) + chute(s, s1, 0.06, 26) + chute(s, s2, 0.10, 24);
      T.push({ x, z, yaw, pitch: -0.012 * Math.sin(s * 3), roll: 0.02 * Math.sin(s * 2.2) + chute(s, s2, 0.03, 22), v, dist });
      if (s + H > sH) estado = { x, z, v, yaw };
      z += v * H; dist += v * H;
    } else {
      if (T.crashed === undefined) { T.crashed = null; T.pos = { x: estado.x, z: estado.z }; T.v = vT(sH); T.fase = 0; }
      const tp = s - sH;
      // depois da batida final: o carro gira para a direita (yaw < 0) e escorrega para fora da pista
      const yaw = -1.30 * suave5(tp / 0.78);
      const phi = -0.40 * suave(tp / 0.55);                                    // direção do deslize (menos que o giro do nariz)
      const vel = vT(sH) * (1 - 0.30 * tp);
      if (T.crashed === null) {
        T.pos.x += Math.sin(phi) * vel * H; T.pos.z += Math.cos(phi) * vel * H; dist += vel * H;
        const nx = T.pos.x + Math.sin(yaw) * COMP_T / 2, nz = T.pos.z + Math.cos(yaw) * COMP_T / 2;
        if (!T.arvore && nx < -7.45) {                                         // nariz toca o tronco: define a posição da árvore e o instante da batida
          T.arvore = { x: nx - 0.5 * 0.9, z: nz + 0.15, r: 0.55 }; T.tBatida = s; T.crashed = { x: T.pos.x, z: T.pos.z, yaw };
        }
        T.push({ x: T.pos.x, z: T.pos.z, yaw, pitch: 0.02 * suave(tp / 0.4), roll: 0.12 * Math.sin(tp * 6), v: vel, dist });
      } else {
        const c = T.crashed, td = s - T.tBatida;
        const rec = 0.60 * (1 - Math.exp(-td * 10)) * Math.exp(-td * 0.0);        // recuo ao longo do eixo do carro
        const yawF = c.yaw + 0.22 * (1 - Math.exp(-td * 7));
        T.push({ x: c.x - Math.sin(c.yaw) * rec, z: c.z - Math.cos(c.yaw) * rec, yaw: yawF, pitch: 0.05 * Math.exp(-td * 3), roll: 0.03 * Math.exp(-td * 2) * Math.sin(td * 20), v: 0, dist });
      }
    }
  }
  // ---------------- C (carro do homem)
  const gap = s => {
    if (s <= s1) return 26 * (1 - s / s1);
    if (s <= 6.3) return 5.5 * suave((s - s1) / 0.9);
    if (s <= s2) return 5.5 * (1 - (s - 6.3) / (s2 - 6.3));
    if (s <= 9.1) return 9.0 * suave((s - s2) / 0.9);
    if (s <= sH) return 9.0 * (1 - Math.pow((s - 9.1) / (sH - 9.1), 1.6));
    return 0;
  };
  let zC = 0, distC = 0, c0 = null;
  for (let i = 0; i <= N; i++) {
    const s = i * H;
    if (s <= sH) {
      const t = T[i];
      const zc = t.z - COMP_T / 2 - gap(s) - COMP_C / 2;
      const xc = t.x + (s < sH - 1.2 ? 1.85 : lerp(1.85, 1.70, suave((s - (sH - 1.2)) / 1.2))) + 0.12 * Math.sin(2.3 * s + 1.1);
      const prev = C[i - 1];
      const v = prev ? (zc - prev.z) / H : 33;
      const yaw = Math.atan2((prev ? xc - prev.x : 0), Math.max(zc - (prev ? prev.z : zc - 1), 1e-3)) * 0.8;
      distC += prev ? Math.hypot(zc - prev.z, xc - prev.x) : 0;
      const acc = prev ? (v - prev.v) / H : 0;
      C.push({ x: xc, z: zc, yaw: prev ? prev.yaw * 0.9 + yaw * 0.1 : 0, pitch: clamp(-0.0045 * acc, -0.05, 0.05), roll: 0.02 * Math.sin(s * 2.0), v, dist: distC });
      if (s + H > sH) c0 = { ...C[C.length - 1] };
    } else {
      C.push(null);                                  // preenchido abaixo
    }
  }
  // integração numérica do C depois da batida
  {
    let zz = c0.z, xx = c0.x, d = distC, prev = c0;
    const tfreia = 3.4, tparado = 1.4, tuturn = 2.5;
    const i0 = Math.round(sH / H) + 1;
    for (let i = i0; i <= N; i++) {
      const td = i * H - sH;
      let v, yaw = 0, pitch = 0;
      if (td < tfreia) {
        v = c0.v * (1 - suave(td / tfreia));
        pitch = 0.05 * Math.sin(Math.PI * clamp(td / tfreia));
        zz += v * H; xx += 0.10 * H * (1 - suave(td / tfreia)); d += v * H;
        C[i] = { x: xx, z: zz, yaw: 0.012 * Math.sin(td * 5), pitch, roll: 0.03 * Math.sin(td * 9), v, dist: d };
        prev = C[i];
      } else if (td < tfreia + tparado) {
        C[i] = { ...prev, v: 0, pitch: 0, roll: 0 };
      } else if (td < tfreia + tparado + tuturn) {
        const R = 5.0, ph = suave((td - tfreia - tparado) / tuturn) * Math.PI;
        if (!C.u0) C.u0 = { x: prev.x, z: prev.z, dist: prev.dist };
        C[i] = { x: C.u0.x + R - R * Math.cos(ph), z: C.u0.z + R * Math.sin(ph), yaw: ph, pitch: 0, roll: -0.04 * Math.sin(ph), v: 3.5, dist: C.u0.dist + R * ph };
        if (td + H >= tfreia + tparado + tuturn) { C.u1 = { ...C[i] }; }
      } else {
        const k = td - tfreia - tparado - tuturn, v = Math.min(8, 3 + k * 2.2);
        C.u1 = C.u1 || { ...C[i - 1] };
        C[i] = { x: C.u1.x, z: C.u1.z - 0.5 * k * (3 + v), yaw: Math.PI, pitch: 0, roll: 0, v, dist: C.u1.dist + 0.5 * k * (3 + v) };
      }
    }
  }
  const amostra = (arr, s) => {
    const f = clamp(s / H, 0, arr.length - 1.001), i = Math.floor(f), k = f - i, a = arr[i], b = arr[i + 1];
    const o = {};
    for (const key of ['x', 'z', 'yaw', 'pitch', 'roll', 'v', 'dist']) o[key] = lerp(a[key], b[key], k);
    return o;
  };
  const hist = {
    T: s => amostra(T, s), C: s => amostra(C, s), tBatida: T.tBatida, arvore: T.arvore, final: sH, taps: [s1, s2, sH],
    frenagem: { ini: sH, fim: sH + 3.4, uturn0: sH + 3.4 + 1.4, uturn1: sH + 3.4 + 1.4 + 2.5 },
    gap,
  };
  return hist;
}
