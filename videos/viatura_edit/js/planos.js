// DECUPAGEM do edit "Viatura" (vertical 9:16), em batidas. 143 BPM (andamento da faixa segundo uma fonte de terceiros; ajustável: BPM abaixo).
// Cada plano: tamanho de plano, ângulo, lente e movimento escolhidos pela emoção; o carro e a câmera são funções do tempo de ação u (segundos) — fórmula fechada,
// então câmera lenta, rampas de velocidade e fumaça saem exatas em qualquer quadro. Cortes caem nas batidas (b = número da batida).
//   estrutura:  A intro (b0-8) · B subida (b8-16) · C/D queda (b16-40) · E fecho e loop (b40-50)
export const BPM = 143, B = 60 / BPM, TOTAL_B = 50, TOTAL = TOTAL_B * B;
export const Z0 = -30;                                                   // onde o carro fica parado (perto do letreiro HRYZ, parede direita)

const { sin, cos, atan2, exp, PI } = Math;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const sm = (a, b, x) => ease((x - a) / (b - a));
const rad = g => g * PI / 180;
const ZT = -1.1915, ZF = 1.7225;                                         // eixos (referencial do carro; +z frente, +x esquerda)

/** ponto no referencial do carro -> mundo */
export const loc = (c, lx, ly, lz) => [c.x + lx * cos(c.yaw) + lz * sin(c.yaw), ly, c.z - lx * sin(c.yaw) + lz * cos(c.yaw)];
const roda = (c, lado, eixo) => { const p = loc(c, lado * 0.80, 0, eixo); return [p[0], p[2]]; };
const cam = (pos, alvo, fov, roll = 0, up = null) => ({ pos, alvo, fov, roll, up });
const base = { x: 0, z: Z0, yaw: 0, rumo: 0, dist: 0, steer: 0, roll: 0, pitch: 0, freio: 0 };
const parado = extra => u => ({ ...base, roll: 0.0035 * sin(u * 61), pitch: 0.0025 * sin(u * 47 + 1), ...(extra ? extra(u) : {}) });
const reta = (x, z0, v, extra) => u => ({ ...base, x, z: z0 + v * u, dist: v * u, pitch: -0.006, ...(extra ? extra(u) : {}) });

// rampa de velocidade (câmera lenta): velocidade v0 -> v1 ao longo da duração do plano
const rampa = (v0, v1) => (tau, dur) => v0 * tau + (v1 - v0) * tau * tau / (2 * dur);

const PLANOS = [];
const S = (nome, b0, b1, d) => PLANOS.push({ nome, b0, b1, mb: 1, tremor: 0.003, soco: 0, luz: 'bar', fumaca: [], marcas: null, ...d });

// emissor de fumaça de pneu: rodas = [lado, eixo] (ex.: [[1, ZT], [-1, ZT]]); estado do carro por `car(u)`
const fumo = (car, rodas, o) => rodas.map(([lado, eixo], i) => ({
  inicio: o.de, fim: o.ate, taxa: o.taxa, vida: o.vida ?? 1.8, tam0: o.t0 ?? 0.6, tam1: o.t1 ?? 2.6, alfa: o.alfa ?? 0.6, semente: (o.semente ?? 1) + i * 17,
  pos: ti => { const p = roda(car(ti), lado, eixo); return [p[0], 0.05, p[1]]; },
  vel: ti => { const c = car(ti), v = o.vel ? o.vel(ti, c, lado) : [0, 0, 0]; return v; },
}));

// ================================================================================================ A: INTRO (b0-8): detalhes em plano curto, câmera sempre em movimento
S('A1 herói: grade e luzes de frente', 0, 2, {                           // contra-plongée, grande-angular, push-in: a imagem mais forte no quadro 0 (e é a que fecha o loop)
  carro: parado(), soco: 0.05,
  cam: (u, c) => { const e = ease(u / (2 * B)); return cam(loc(c, lerp(-0.62, -0.22, e), lerp(0.30, 0.38, e), lerp(7.6, 4.2, e)), loc(c, 0, lerp(0.60, 0.68, e), 2.6), lerp(46, 42, e), lerp(2.5, -1.5, e)); },
});
S('A2 roda dianteira girando', 2, 3, {
  carro: parado(u => ({ dist: u * 22 })), soco: 0.04,
  cam: (u, c) => { const e = ease(u / B); return cam(loc(c, 2.1, lerp(0.45, 0.40, e), lerp(3.3, 3.0, e)), loc(c, 0.85, 0.36, 1.72), lerp(46, 41, e), -3); },
});
S('A3 barra de luzes de baixo', 3, 4, {
  carro: parado(), soco: 0.04,
  cam: (u, c) => { const e = ease(u / B); return cam(loc(c, lerp(-3.6, -3.2, e), lerp(0.40, 0.55, e), lerp(1.2, 0.5, e)), loc(c, 0.2, 1.62, -0.3), lerp(58, 52, e), lerp(4, -3, e)); },
});
S('A4 retrovisor e holofote', 4, 5, {
  carro: parado(), soco: 0.04,
  cam: (u, c) => { const e = ease(u / B); return cam(loc(c, lerp(1.9, 1.5, e), lerp(1.12, 1.2, e), lerp(2.1, 1.7, e)), loc(c, 1.02, 1.1, 0.82), 40, 5); },
});
S('A5 placa HRYZ e para-choque', 5, 6, {
  carro: parado(), soco: 0.04,
  cam: (u, c) => { const e = ease(u / B); return cam(loc(c, lerp(0.7, 0.35, e), 0.50, lerp(3.9, 3.55, e)), loc(c, 0, 0.45, 2.69), 42, -5); },
});
S('A6 porta POLICE (travelling)', 6, 7, {
  carro: parado(), soco: 0.04,
  cam: (u, c) => { const e = ease(u / B); return cam(loc(c, -3.0, 0.80, lerp(1.7, -0.8, e)), loc(c, -1.0, 0.72, lerp(0.8, -0.1, e)), 42, 1.5); },
});
S('A7 lanterna e escapamento', 7, 8, {
  carro: parado(() => ({ freio: 1 })), soco: 0.04,
  cam: (u, c) => { const e = ease(u / B); return cam(loc(c, lerp(-1.0, -0.55, e), lerp(0.62, 0.58, e), lerp(-4.3, -3.8, e)), loc(c, -0.1, 0.62, -2.69), 42, 4); },
});

// ================================================================================================ B: SUBIDA (b8-16): tensão
S('B1 grua: a rua e o carro parado', 8, 10, {
  carro: parado(),
  cam: (u, c) => { const e = ease(u / (2 * B)); return cam(loc(c, 0.4, lerp(0.7, 3.6, e), lerp(-7.5, -11.5, e)), loc(c, 0, lerp(0.95, 1.7, e), lerp(1.5, 7, e)), lerp(42, 48, e), lerp(-2, 2, e)); },
});
{ const car = parado(u => ({ dist: 6 * u + 38 * u * u, roll: 0.012 * sin(u * 57) * sm(0, 0.8, u), pitch: 0.008 * sin(u * 43) * sm(0, 0.8, u) }));
  S('B2 roda traseira: fumaça começa', 10, 12, { carro: car, tremor: 0.006, fumaca: fumo(car, [[1, ZT], [-1, ZT]], { de: -0.6, ate: 2, taxa: 90, vida: 1.8, t0: 0.5, t1: 2.4, alfa: 0.55, semente: 3, vel: () => [0, 0.2, -3.2] }),
    cam: (u, c) => { const e = ease(u / (2 * B)); return cam(loc(c, -2.0, 0.42, lerp(-3.7, -3.0, e)), loc(c, -0.8, 0.45, -1.3), lerp(48, 42, e), lerp(-3, 3, e)); } }); }
{ const car = u => ({ ...base, z: Z0 + 2.4 * u + 3.2 * u * u, dist: 2.4 * u + 3.2 * u * u, pitch: -0.012 * u, roll: 0.004 * sin(u * 30) });
  S('B3 travelling lateral: o carro começa a andar', 12, 14, { carro: car, tremor: 0.005, luz: 'oitavo',
    cam: (u, c) => cam(loc(c, -4.3, 0.78, 0.3), loc(c, -0.9, 0.72, 0.0), 40, lerp(1, -2, u / (2 * B))) }); }
{ const car = parado(u => ({ dist: 30 * u + 18 * u * u, roll: 0.014 * sin(u * 62), pitch: 0.010 * sin(u * 53) }));
  S('B4 frontal baixo: o carro acelera parado', 14, 16, { carro: car, tremor: 0.007, luz: 'oitavo', soco: 0.04, fumaca: fumo(car, [[1, ZT], [-1, ZT]], { de: -1.4, ate: 2, taxa: 100, vida: 2.0, t0: 0.7, t1: 3.0, alfa: 0.6, semente: 8, vel: () => [0, 0.25, -3.6] }),
    cam: (u, c) => { const e = ease(u / (2 * B)); return cam(loc(c, 0.25, 0.30, lerp(7.2, 5.3, e)), loc(c, 0, 0.7, 2.0), lerp(50, 46, e), lerp(2, -3, e)); } }); }

// ================================================================================================ C: QUEDA 1 (b16-24): arrancada, passagem, drift
{ const Z1 = -36, car = u => ({ ...base, z: Z1 + 0.5 * 16 * u * u, dist: 1.9 * 0.5 * 16 * u * u, pitch: -0.07 * sm(0, 0.3, u), roll: 0.01 * sin(u * 40), freio: 0 });
  S('C1 arrancada: pneu queima', 16, 17.5, { carro: car, luz: 'oitavo', mb: 5, tremor: 0.012, soco: 0.07, fumaca: fumo(car, [[1, ZT], [-1, ZT]], { de: -0.2, ate: 1.2, taxa: 160, vida: 1.6, t0: 0.9, t1: 3.6, alfa: 0.8, semente: 21, vel: (ti, c, l) => [l * 1.2, 0.3, -4.8] }),
    marcas: { inicio: -0.2, fim: 1.2, larg: 0.22, rodas: ti => { const c = car(ti); return [roda(c, 1, ZT), roda(c, -1, ZT)]; } },
    cam: (u, c) => cam([-4.4, 0.55, Z1 - 5.0], loc(c, -0.2, 0.6, 0.2), lerp(36, 46, ease(u / (1.5 * B))), lerp(-4, 3, u / (1.5 * B))) }); }
{ const zA = -2.4, car = reta(-1.8, zA, 32);
  S('C2 passagem a 115 km/h', 17.5, 19.5, { carro: car, luz: 'oitavo', mb: 6, tremor: 0.010, soco: 0.05,
    cam: (u, c) => { const e = ease(u / (2 * B)); return cam([-5.3, 0.75, zA + 32 * 0.42], loc(c, 0, 0.7, 0.4), lerp(36, 52, e), lerp(3, -4, e)); } }); }
{ const car = reta(-1.8, -20, 30);
  S('C3 roda a toda: asfalto em fuga', 19.5, 20.5, { carro: car, luz: 'oitavo', mb: 6, tremor: 0.012, soco: 0.05,
    cam: (u, c) => { const e = ease(u / B); return cam(loc(c, -2.15, lerp(0.48, 0.40, e), lerp(2.7, 2.3, e)), loc(c, -0.85, 0.36, 1.72), 44, lerp(-6, 2, e)); } }); }
{ const Rr = 9, cx = -1.8 - Rr, cz = 20, v = 20, w = v / Rr, bet = u => lerp(0.05, 0.62, ease((u + 0.1) / 0.45));
  const car = u => { const th = w * u; return { ...base, x: cx + Rr * cos(th), z: cz + Rr * sin(th), yaw: -th - bet(u), rumo: -th, dist: Rr * th * 1.6, steer: 0.9 * bet(u), roll: -0.05 * ease(u / 0.4), pitch: 0.01 }; };
  S('C4 drift: câmera de drone atrás e acima', 20.5, 22, { carro: car, luz: 'oitavo', mb: 4, tremor: 0.008, soco: 0.05,
    fumaca: fumo(car, [[1, ZT], [-1, ZT]], { de: -0.4, ate: 1.2, taxa: 130, vida: 1.8, t0: 0.9, t1: 3.4, alfa: 0.75, semente: 41, vel: (ti, c) => [-sin(c.rumo) * 1.5, 0.3, -cos(c.rumo) * 1.5] }),
    marcas: { inicio: -0.4, fim: 1.2, larg: 0.22, rodas: ti => { const c = car(ti); return [roda(c, 1, ZT), roda(c, -1, ZT)]; } },
    cam: (u, c) => { const fx = sin(c.rumo), fz = cos(c.rumo), lx = cos(c.rumo), lz = -sin(c.rumo); return cam([c.x - fx * 6.5 + lx * 2.6, 3.3, c.z - fz * 6.5 + lz * 2.6], [c.x + fx * 2.2, 0.5, c.z + fz * 2.2], 56, lerp(3, -6, u / (1.5 * B))); } }); }
{ const v = 21, zC = -6, bet = u => 0.15 + 0.6 * sm(-0.1, 0.35, u) - 0.4 * sm(0.5, 1.0, u),
    car = u => ({ ...base, x: -1.4, z: zC + v * u, yaw: -bet(u), dist: 1.5 * v * u, steer: 0.8 * bet(u), roll: 0.04 * sm(0, 0.4, u), pitch: 0.01 });
  S('C5 deslize em câmera lenta', 22, 24, { carro: car, luz: 'oitavo', mb: 2, tremor: 0.006, soco: 0.05, rampa: rampa(0.30, 0.70),
    fumaca: fumo(car, [[1, ZT], [-1, ZT]], { de: -0.5, ate: 1.1, taxa: 110, vida: 1.8, t0: 0.9, t1: 3.2, alfa: 0.75, semente: 55, vel: () => [-0.6, 0.3, -2.0] }),
    marcas: { inicio: -0.5, fim: 1.1, larg: 0.22, rodas: ti => { const c = car(ti); return [roda(c, 1, ZT), roda(c, -1, ZT)]; } },
    cam: (u, c) => cam([-6.3, 0.55, zC + v * 0.42], loc(c, 0, 0.65, 0.3), 38, 2) }); }

// ================================================================================================ D: QUEDA 2 (b24-40): perspectivas de assalto
{ const car = reta(0.0, -80, 34);
  S('D1 câmera no para-choque', 24, 25, { carro: car, luz: 'oitavo', mb: 6, tremor: 0.012, soco: 0.06,
    cam: (u, c) => cam(loc(c, 0, 0.60, 3.0), loc(c, 0, 0.52, 14), 74, lerp(-2, 2, u / B)) }); }
{ const zE = 10, car = reta(-0.9, zE, 34), tp = 0.36;
  S('D2 de frente: passa rente à lente', 25, 26, { carro: car, luz: 'oitavo', mb: 6, tremor: 0.010, soco: 0.07,
    cam: (u, c) => cam([0.45, 0.36, zE + 34 * tp], [-0.35, 0.55, zE + 34 * tp - 20], 52, lerp(5, -3, u / B)) }); }
{ const Rr = 5.2, cx = -0.5, cz = 38, w = 2.4, car = u => { const th = 1.0 + w * u; return { ...base, x: cx + Rr * cos(th), z: cz + Rr * sin(th), yaw: -th - 1.1, rumo: -th, dist: Rr * th * 1.5, steer: 0.7, roll: -0.04, pitch: 0.012 }; };
  const marcas = { inicio: -1.6, fim: 3.0, larg: 0.22, passo: 1 / 40, rodas: ti => { const c = car(ti); return [roda(c, 1, ZT), roda(c, -1, ZT)]; } };
  S('D3 rosca: órbita em volta do carro', 26, 28, { carro: car, luz: 'oitavo', mb: 3, tremor: 0.006, soco: 0.05,
    fumaca: fumo(car, [[1, ZT], [-1, ZT]], { de: -1.4, ate: 3, taxa: 100, vida: 1.8, t0: 0.9, t1: 2.5, alfa: 0.42, semente: 77, vel: (ti, c) => [-sin(c.rumo) * 1.8, 0.3, -cos(c.rumo) * 1.8] }), marcas,
    cam: (u, c) => { const phi = 0.55 - 0.85 * u, R2 = 12.0; return cam([cx + R2 * cos(phi), 2.6, cz + R2 * sin(phi)], [cx + (c.x - cx) * 0.55, 0.8, cz + (c.z - cz) * 0.55], 54, lerp(0, 4, u / (2 * B))); } });
  const car4 = u => car(u + 2 * B);
  S('D4 plongée: marcas da rosca no asfalto', 28, 29, { carro: car4, luz: 'oitavo', mb: 3, tremor: 0.004, soco: 0.05,
    fumaca: fumo(car4, [[1, ZT], [-1, ZT]], { de: -1.4, ate: 3, taxa: 100, vida: 1.8, t0: 0.9, t1: 2.5, alfa: 0.42, semente: 77, vel: (ti, c) => [-sin(c.rumo) * 1.8, 0.3, -cos(c.rumo) * 1.8] }),
    marcas: { ...marcas, rodas: ti => { const c = car4(ti); return [roda(c, 1, ZT), roda(c, -1, ZT)]; }, inicio: -1.6 - 2 * B },
    cam: (u) => { const a = u * 2.4; return cam([cx, 17.5, cz + 0.001], [cx, 0, cz], 52, 0, [sin(a), 0, cos(a)]); } }); }
{ const car = reta(0.0, 30, 30, u => ({ steer: 0.12 * sin(u * 9) }));
  S('D5 ponto de vista do motorista', 29, 30, { carro: car, luz: 'oitavo', mb: 6, tremor: 0.014, soco: 0.05,
    cam: (u, c) => cam(loc(c, 0.37, 1.19, -0.10), loc(c, 0.37, 1.12, 10), 72, lerp(-2, 2, u / B)) }); }
{ const car = u => ({ ...base, x: -1.8 + 0.8 * sin(u * 5), z: 60 + 26 * u, yaw: 0.10 * cos(u * 5), rumo: 0, dist: 26 * u, steer: -0.04 * cos(u * 5), roll: 0.02 * sin(u * 5), freio: (Math.floor(u / (B / 2)) % 2) ? 0 : 1 });
  S('D6 perseguição: lanternas piscam na batida', 30, 32, { carro: car, luz: 'oitavo', mb: 5, tremor: 0.010, soco: 0.05,
    fumaca: fumo(car, [[1, ZT], [-1, ZT]], { de: -0.3, ate: 2, taxa: 60, vida: 1.2, t0: 0.5, t1: 2.2, alfa: 0.35, semente: 91, vel: () => [0, 0.2, -2] }),
    cam: (u, c) => { const e = ease(u / (2 * B)); return cam(loc(c, 0, lerp(0.5, 0.9, e), lerp(-6.2, -5.0, e)), loc(c, 0, 0.7, -1.0), 46, lerp(2, -3, e)); } }); }
{ const car = u => ({ ...base, x: 2.0, z: Z0 - 6 + 14 * u, dist: 14 * u, pitch: -0.008 });
  S('D7 o carro cruza o letreiro HRYZ', 32, 34, { carro: car, luz: 'oitavo', mb: 4, tremor: 0.006, soco: 0.04,
    cam: (u) => cam([-5.2, 0.75, Z0 - 1], [4.0, 3.6, Z0 - 1], 54, lerp(3, -2, u / (2 * B))) }); }
{ const v0 = 20, a = 28, tS = v0 / a, ds = v0 * v0 / (2 * a), zIni = Z0 - ds,
    dsl = u => u < tS ? v0 * u - 0.5 * a * u * u : ds, car = u => { const k = clamp(u / tS); return { ...base, z: zIni + dsl(u), yaw: 0.28 * sin(u * 9) * exp(-3 * u), dist: dsl(u) * 1.0, pitch: 0.06 * sm(0, 0.15, u) * (1 - sm(0.5, 0.9, u)), freio: 1, roll: 0.03 * sin(u * 8) * (1 - k) }; };
  S('D8 freada: desliza e para de frente', 34, 36, { carro: car, luz: 'oitavo', mb: 4, tremor: 0.008, soco: 0.05,
    fumaca: fumo(car, [[1, ZT], [-1, ZT], [1, ZF], [-1, ZF]], { de: 0, ate: 0.9, taxa: 70, vida: 1.8, t0: 0.7, t1: 3.0, alfa: 0.7, semente: 105, vel: (ti, c) => [0, 0.25, 7] }),
    marcas: { inicio: 0, fim: 1.2, larg: 0.22, rodas: ti => { const c = car(ti); return [roda(c, 1, ZT), roda(c, -1, ZT)]; } },
    cam: (u, c) => cam([0.25, 0.32, Z0 + 7.3], [-0.2, 0.75, Z0 - 0.5], 46, lerp(-3, 3, u / (2 * B))) }); }

// D9: oito detalhes rápidos nas colcheias (b36-40), carro parado depois da freada
{ const detalhes = [
    (e, c) => cam(loc(c, lerp(0.9, 0.5, e), 0.62, lerp(4.2, 3.6, e)), loc(c, 0, 0.70, 2.65), 40, 3),
    (e, c) => cam(loc(c, -2.3, lerp(0.45, 0.4, e), lerp(3.0, 2.7, e)), loc(c, -0.86, 0.36, 1.72), 42, -4),
    (e, c) => cam(loc(c, lerp(0.9, 0.5, e), lerp(2.1, 2.0, e), lerp(-3.6, -3.1, e)), loc(c, 0, 1.5, -0.3), 48, 5),
    (e, c) => cam(loc(c, 2.5, 0.9, lerp(-1.0, -0.6, e)), loc(c, 1.0, 0.7, -0.5), 42, -3),
    (e, c) => cam(loc(c, lerp(-2.0, -1.7, e), 1.3, lerp(2.5, 2.2, e)), loc(c, -1.07, 1.08, 0.86), 40, 4),
    (e, c) => cam(loc(c, lerp(0.7, 0.45, e), 0.5, lerp(-4.0, -3.5, e)), loc(c, 0.3, 0.55, -2.69), 44, -5),
    (e, c) => cam(loc(c, lerp(-0.3, -0.1, e), 0.55, lerp(3.6, 3.2, e)), loc(c, 0, 0.44, 2.69), 38, 3),
    (e, c) => cam(loc(c, lerp(0.8, 0.6, e), 0.55, lerp(3.6, 3.2, e)), loc(c, 0.62, 0.74, 2.65), 36, -2)];
  detalhes.forEach((f, k) => S('D9.' + (k + 1) + ' detalhe rápido', 36 + k / 2, 36 + (k + 1) / 2, { carro: parado(), luz: 'oitavo', soco: 0.04, tremor: 0.005, cam: (u, c) => f(ease(u / (B / 2)), c) })); }

// ================================================================================================ E: FECHO (b40-50): revelação, órbita e retorno ao quadro 0 (loop)
{ const car = parado(u => ({ freio: 0 }));
  S('E1 revelação em câmera lenta', 40, 44, { carro: car, luz: 'meio', tremor: 0.003, rampa: rampa(0.55, 0.55),
    fumaca: fumo(car, [[1, ZT], [-1, ZT], [1, ZF], [-1, ZF]], { de: -1.8, ate: 0.4, taxa: 60, vida: 3.0, t0: 0.9, t1: 2.6, alfa: 0.24, semente: 120, vel: () => [0, 0.15, 0.3] }),
    cam: (u, c) => { const e = ease(u / (4 * B * 0.55)); return cam(loc(c, lerp(0.15, -2.7, e), lerp(0.55, 1.2, e), lerp(3.5, 5.9, e)), loc(c, 0, lerp(0.7, 0.8, e), lerp(2.2, 0.8, e)), lerp(44, 40, e), lerp(2, -1, e)); } });
  const orb = (e, az0, az1, r0, r1, h0, h1, c) => { const az = rad(lerp(az0, az1, e)), r = lerp(r0, r1, e); return loc(c, r * sin(az), lerp(h0, h1, e), r * cos(az)); };
  S('E2 órbita: o letreiro HRYZ ao fundo', 44, 47, { carro: car, luz: 'meio', tremor: 0.003, soco: 0.03,
    cam: (u, c) => { const e = u / (3 * B); return cam(orb(e, -25, -165, 6.5, 7.5, 1.2, 1.7, c), loc(c, 0, 0.85, 0.2), lerp(44, 46, e), lerp(-1, 3, e)); } });
  S('E3 fecha o giro e volta ao quadro 0', 47, 50, { carro: car, luz: 'bar', tremor: 0.003, soco: 0.04,
    cam: (u, c) => { const e = ease(u / (3 * B)), f = loc(c, 0, 0, 0); void f; return cam(orb(e, -165, -364.7, 7.5, 7.6, 1.7, 0.30, c), loc(c, 0, lerp(0.85, 0.60, e), lerp(0.2, 2.6, e)), lerp(46, 46, e), lerp(3, 2.5, e)); } }); }

export { PLANOS, rampa };
export const planoEm = t => { const b = t / B + 1e-7; for (const p of PLANOS) if (b >= p.b0 && b < p.b1) return p; return PLANOS[PLANOS.length - 1]; };
export { roda };
