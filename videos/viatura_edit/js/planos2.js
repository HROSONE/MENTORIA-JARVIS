// DECUPAGEM v2 do edit "Perseguição" (143 BPM, vertical 9:16, 43 batidas ≈ 18 s). Mesma viatura e mesma rua da v1; a estrutura muda para segurar a atenção DEPOIS do gancho:
// pergunta rastreável (alerta no MDT + contador de distância) → laço aberto (o carro preto à vista) → escalada → impasse (virada no meio) → cerco (clímax) → alvo parado → "NOVO ALERTA" (volta ao quadro 0).
// Planos de ação já renderizados na v1 são reaproveitados (`reuso`: batida de início na v1, deslocamento em batidas inteiras para manter a fase das luzes e do soco de zoom); os demais são novos.
export const BPM = 143, B = 60 / BPM, TOTAL_B = 43, TOTAL = TOTAL_B * B;
export const Z0 = -30;

const { sin, cos, exp, PI } = Math;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const sm = (a, b, x) => ease((x - a) / (b - a));
const ZT = -1.1915, ZF = 1.7225;
export const loc = (c, lx, ly, lz) => [c.x + lx * cos(c.yaw) + lz * sin(c.yaw), ly, c.z - lx * sin(c.yaw) + lz * cos(c.yaw)];
const roda = (c, lado, eixo) => { const p = loc(c, lado * 0.80, 0, eixo); return [p[0], p[2]]; };
const cam = (pos, alvo, fov, roll = 0, up = null) => ({ pos, alvo, fov, roll, up });
const base = { x: 0, z: Z0, yaw: 0, rumo: 0, dist: 0, steer: 0, roll: 0, pitch: 0, freio: 0 };
const parado = (x, z, yaw, extra) => u => ({ ...base, x, z, yaw, roll: 0.0035 * sin(u * 61), pitch: 0.0025 * sin(u * 47 + 1), ...(extra ? extra(u) : {}) });
const reta = (x, z0, v, extra) => u => ({ ...base, x, z: z0 + v * u, dist: v * u, pitch: -0.006, ...(extra ? extra(u) : {}) });
export const rampa = (v0, v1) => (tau, dur) => v0 * tau + (v1 - v0) * tau * tau / (2 * dur);
const fumo = (car, rodas, o) => rodas.map(([lado, eixo], i) => ({
  inicio: o.de, fim: o.ate, taxa: o.taxa, vida: o.vida ?? 1.8, tam0: o.t0 ?? 0.6, tam1: o.t1 ?? 2.6, alfa: o.alfa ?? 0.6, semente: (o.semente ?? 1) + i * 17,
  pos: ti => { const p = roda(car(ti), lado, eixo); return [p[0], 0.05, p[1]]; }, vel: ti => (o.vel ? o.vel(ti, car(ti), lado) : [0, 0, 0]),
}));

export const EDL = [];
const R = (nome, b0, b1, deB, extra = {}) => EDL.push({ nome, b0, b1, reuso: { b0: deB }, ...extra });                          // reaproveita quadros da v1 (início na v1 = deB)
const N = (nome, b0, b1, d) => EDL.push({ nome, b0, b1, reuso: null, mb: 1, tremor: 0.003, soco: 0, luz: 'oitavo', fumaca: [], marcas: null, alvo: null, ...d });

// ---- MDT (computador de bordo): a pergunta rastreável. Câmera dentro do carro, grande-angular, empurrando para a tela.
const camMDT = (u, c, dur, ang = 0) => { const e = ease(u / dur), d = lerp(0.66, 0.60, e);                  // eixo da tela (normal): sobe 0,199 e recua 0,98; a câmera fica no eixo, um pouco acima e à direita
  return cam(loc(c, 0.07 * (1 - e), 0.9928 + 0.199 * d + 0.02, 0.1988 - 0.98 * d), loc(c, 0, 0.993, 0.199), lerp(56, 52, e), lerp(-2, 2, e) + ang); };

// ================================================================================================ A: gancho e preparação (planos 1-4 reaproveitados da v1)
R('A1 herói: grade e luzes de frente', 0, 2, 0); R('A2 roda dianteira girando', 2, 3, 2); R('A3 barra de luzes de baixo', 3, 4, 3); R('A4 retrovisor e holofote', 4, 5, 4);
N('N1 ALERTA no MDT: "fugitivo, 600 m"', 5, 7, {
  luz: 'bar', carro: parado(0, Z0, 0), soco: 0.04, tremor: 0.004,
  mdt: (u, t) => ({ cabecalho: 'ALERTA', cor: '#e5251f', piscar: (Math.floor(u * 9) % 2) ? 1 : 0.35, linhas: ['VEÍCULO PRETO EM FUGA', 'AV. HRYZ · SENTIDO NORTE'], numero: '600 m', barra: 1 }),
  cam: (u, c) => camMDT(u, c, 2 * B) });
R('A6 porta POLICE (travelling)', 7, 8, 6);
{ const z0 = Z0 + 32, alvo = u => ({ ...base, x: -1.8, z: z0 + 3 * u + 22 * u * u, dist: 3 * u + 22 * u * u, freio: u < 0.34 ? 1 : 0, pitch: -0.02 * sm(0.3, 0.8, u) });
  N('N2 o alvo à vista: arranca e some na rua', 8, 10, {
    luz: 'bar', carro: parado(0, Z0, 0), alvo, soco: 0.04, tremor: 0.004, mb: 2,
    fumaca: fumo(alvo, [[1, ZT], [-1, ZT]], { de: 0.30, ate: 1.7, taxa: 80, vida: 1.6, t0: 0.7, t1: 2.4, alfa: 0.38, semente: 201, vel: () => [0, 0.25, -0.8] }),
    cam: (u, c) => { const e = ease(u / (2 * B)), a = alvo(u); return cam(loc(c, 0.37, 1.24, -0.12), [a.x, 1.1, a.z], lerp(34, 20, e), lerp(1, -1, e)); } }); }
R('B2 roda traseira: fumaça começa', 10, 12, 10); R('B4 frontal baixo: o carro acelera parado', 12, 14, 14);

// ================================================================================================ B: perseguição (planos de ação da v1 + contador de distância)
R('C1 arrancada: pneu queima', 14, 15.5, 16);
N('N3 contador: 520 m', 15.5, 16.5, { carro: reta(-1.8, 40, 34, () => ({ roll: 0.01 * sin(8) })), mb: 3, tremor: 0.010, soco: 0.05,
  mdt: () => ({ cabecalho: 'PERSEGUIÇÃO', cor: '#ff7a00', linhas: ['DISTÂNCIA AO ALVO'], numero: '520 m', barra: 0.87 }), cam: (u, c) => camMDT(u, c, B, 1.5) });
R('C2 passagem a 115 km/h', 16.5, 18.5, 17.5); R('C3 roda a toda: asfalto em fuga', 18.5, 19.5, 19.5); R('C4 drift: câmera de drone', 19.5, 21, 20.5);
N('N4 contador: 260 m', 21, 22, { carro: reta(-1.8, 90, 34, () => ({ roll: 0.01 * sin(9) })), mb: 3, tremor: 0.010, soco: 0.05,
  mdt: () => ({ cabecalho: 'PERSEGUIÇÃO', cor: '#ff4a00', linhas: ['DISTÂNCIA AO ALVO'], numero: '260 m', barra: 0.43 }), cam: (u, c) => camMDT(u, c, B, -1.5) });
R('C5 deslize em câmera lenta', 22, 24, 22);
{ const pol = reta(-1.8, 80, 33), alvo = u => { const p = pol(u); return { ...base, x: -1.8 + 0.5 * sin(u * 6), z: p.z + lerp(26, 10, clamp(u / B)), yaw: -0.05 * cos(u * 6), dist: p.dist * 0.95, freio: (Math.floor(u / (B / 2)) % 2) ? 0 : 1 }; };
  N('N5 câmera no para-choque: o alvo cresce à frente', 24, 25, { carro: pol, alvo, mb: 4, tremor: 0.012, soco: 0.06,
    cam: (u, c) => cam(loc(c, 0, 0.62, 3.0), loc(c, 0, 0.62, 16), 44, lerp(-2, 2, u / B)) }); }
R('D6 perseguição: lanternas piscam na batida', 25, 27, 30); R('D7 o carro cruza o letreiro HRYZ', 27, 29, 32);

// ================================================================================================ C: impasse (a virada do meio), cerco (clímax), alvo parado, volta ao começo
const Ct = { x: 1.4, z: -14 };                                                                  // o alvo para aqui, de frente para a viatura
const alvoParado = yaw => u => ({ ...base, x: Ct.x, z: Ct.z, yaw, freio: 1, roll: 0.002 * sin(u * 50) });
N('N7 impasse: travelling baixo pelo flanco da viatura, o alvo de faróis acesos ao fundo', 29, 31, { luz: 'meio', tremor: 0.004, soco: 0.02, mb: 1, calmo: true,
  carro: u => ({ ...base, x: -1.4, z: Z0 - 1.5 * (1 - ease(u / 0.5)), pitch: 0.045 * (1 - sm(0.15, 0.7, u)), freio: u < 0.6 ? 1 : 0, dist: 0 }), alvo: alvoParado(PI), foco: () => [Ct.x, 0.7, Ct.z - 6],
  cam: (u, c) => { const e = ease(u / (2 * B)); return cam(loc(c, lerp(2.7, 2.4, e), lerp(0.62, 0.58, e), lerp(-4.6, 0.4, e)), [Ct.x, 0.85, Ct.z + 1.0], lerp(32, 27, e), lerp(2, -1, e)); } });
const Rr = 6.4, th0 = 0.2, w = 2.3, cerco = u => { const th = th0 + w * u; return { ...base, x: Ct.x + Rr * cos(th), z: Ct.z + Rr * sin(th), yaw: -th - 1.1, rumo: -th, dist: Rr * th * 1.5, steer: 0.7, roll: -0.045, pitch: 0.012 }; };
const fumoCerco = c => fumo(c, [[1, ZT], [-1, ZT]], { de: -1.4, ate: 3.2, taxa: 100, vida: 1.8, t0: 0.9, t1: 2.6, alfa: 0.45, semente: 301, vel: (ti, cc) => [-sin(cc.rumo) * 1.8, 0.3, -cos(cc.rumo) * 1.8] });
const marcasCerco = c => ({ inicio: -1.6, fim: 3.4, larg: 0.22, passo: 1 / 40, rodas: ti => { const cc = c(ti); return [roda(cc, 1, ZT), roda(cc, -1, ZT)]; } });
N('N8 cerco: a câmera acompanha a viatura por fora do círculo, o alvo no centro', 31, 34, { mb: 3, tremor: 0.006, soco: 0.06, carro: cerco, alvo: alvoParado(PI), fumaca: fumoCerco(cerco), marcas: marcasCerco(cerco), foco: () => [Ct.x, 0.7, Ct.z],
  cam: (u, c) => { const th = Math.atan2(c.z - Ct.z, c.x - Ct.x), phi = th - 0.75, R2 = 12.5, e = u / (3 * B); return cam([Ct.x + R2 * cos(phi), lerp(1.5, 2.3, e), Ct.z + R2 * sin(phi)], [Ct.x + (c.x - Ct.x) * 0.55, 0.85, Ct.z + (c.z - Ct.z) * 0.55], 48, lerp(0, 4, e)); } });
{ const c4 = u => cerco(u + 3 * B);
  N('N9 plongée: a roda de fumaça em volta do alvo', 34, 35, { mb: 3, tremor: 0.004, soco: 0.05, carro: c4, alvo: alvoParado(PI), fumaca: fumoCerco(c4), marcas: { ...marcasCerco(c4), inicio: -1.6 - 3 * B },
    cam: u => { const a = u * 2.4; return cam([Ct.x, 17.5, Ct.z + 0.001], [Ct.x, 0, Ct.z], 52, 0, [sin(a), 0, cos(a)]); } });
  const c5 = u => cerco(u + 4 * B);
  N('N10 do rabo do alvo: a viatura gira ao fundo', 35, 37, { mb: 3, tremor: 0.008, soco: 0.05, carro: c5, alvo: alvoParado(PI), fumaca: fumoCerco(c5), marcas: { ...marcasCerco(c5), inicio: -1.6 - 4 * B },
    cam: (u, c) => cam([Ct.x + 1.7, 0.55, Ct.z + 5.4], [c.x, 0.8, c.z], 46, lerp(2, -2, u / (2 * B))) }); }
{ const pol = u => { const e = ease(u / 0.42); return { ...base, x: lerp(-0.4, -2.3, e), z: lerp(-24.6, -22.2, e), yaw: lerp(0.22, 0.08, e), pitch: 0.045 * (1 - e), freio: 1, dist: 0 }; };
  N('N11 alvo parado: a viatura freia de frente para ele, a fumaça baixa em câmera lenta', 37, 39, { luz: 'meio', tremor: 0.003, soco: 0.02, mb: 1, rampa: rampa(0.5, 0.5), carro: pol, alvo: alvoParado(PI), foco: () => [Ct.x, 0.7, Ct.z - 4],
    fumaca: fumoCerco(u => cerco(u + 6 * B)).map(e => ({ ...e, inicio: -2.0, fim: 0.2, taxa: 70, alfa: 0.4, vida: 2.6 })),
    cam: (u, c) => { const e = ease(u / (2 * B * 0.5)); return cam(loc(c, lerp(0.6, 1.2, e), lerp(1.3, 2.4, e), lerp(-24, -28, e)), [(Ct.x + c.x) / 2, 1.0, (Ct.z + c.z) / 2], lerp(24, 20, e), lerp(1.5, -1, e)); } }); }   // teleobjetiva: a viatura embaixo, o alvo empilhado acima
N('N12 MDT: "suspeito parado"', 39, 40, { luz: 'meio', carro: parado(-4.0, -19.5, 0.6), mb: 1, soco: 0.04,
  mdt: u => ({ cabecalho: 'SUSPEITO PARADO', cor: '#14b86f', linhas: ['VEÍCULO PRETO DETIDO'], numero: '0 m', barra: 0, piscar: 1 }), cam: (u, c) => camMDT(u, c, B, 0) });
{ const orb = (e, az0, az1, r0, r1, h0, h1, c) => { const az = (lerp(az0, az1, e)) * PI / 180, r = lerp(r0, r1, e); return loc(c, r * sin(az), lerp(h0, h1, e), r * cos(az)); };
  N('N13 volta ao quadro 0: gira e pousa de frente', 40, 42, { luz: 'bar', carro: parado(0, Z0, 0), alvo: alvoParado(PI), tremor: 0.003, soco: 0.04,
    cam: (u, c) => { const e = ease(u / (2 * B)); return cam(orb(e, -250, -364.7, 7.6, 7.6, 1.5, 0.30, c), loc(c, 0, lerp(0.85, 0.60, e), lerp(0.2, 2.6, e)), lerp(46, 46, e), lerp(3, 2.5, e)); } }); }
N('N14 MDT: "novo alerta" (fecha o laço)', 42, 43, { luz: 'bar', carro: parado(0, Z0, 0), mb: 1, soco: 0.04,
  mdt: u => ({ cabecalho: 'NOVO ALERTA', cor: '#e5251f', piscar: (Math.floor(u * 9) % 2) ? 1 : 0.35, linhas: ['UNIDADE 117 · CENTRO', 'CHAMADA 613'], numero: '600 m', barra: 1 }), cam: (u, c) => camMDT(u, c, B, 0) });

// efeitos de pós (em batidas): clarões, vidro quebrado de glitch, varridas, escurecidas
export const FX = {
  clarao: [[14, 1.0, 5.5], [31, 0.9, 6.5], [37, 0.55, 8], [39, 0.45, 9], [24, 0.3, 12], [16.5, 0.3, 14], [22, 0.3, 14], [8, 0.2, 14], [5, 0.25, 12]],
  glitch: [14, 31, 5, 39],
  varridas: [8, 10, 12, 16.5, 21, 24, 25, 27, 29, 34, 35, 40],
  preto: [[13.5, 14]],                                   // escurece antes da queda
  calmo: [[28.6, 31]],                                   // impasse: dessatura e escurece (a "respirada" antes da segunda queda)
  forte: [[14, 29], [31, 39]],                           // trechos de aberração e soco de zoom nas batidas
};
export const planoEm = t => { const b = t / B + 1e-7; for (const p of EDL) if (b >= p.b0 && b < p.b1) return p; return EDL[EDL.length - 1]; };
