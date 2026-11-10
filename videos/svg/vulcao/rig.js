/* rig.js — personagem em 3D feito de elipsoides e cápsulas (unidade: cm).
   O mesmo esqueleto alimenta o desenho 2D (projeção em SVG com silhueta)
   e o 3D (Three.js). Eixos: x = esquerda do personagem (direita da tela
   quando ele olha para a câmera), y = para cima, z = para a frente dele.
   yaw 0 = olhando para a câmera; yaw 90 = perfil olhando para a direita. */
(function (G) {
  const D = Math.PI / 180;
  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: a => Math.hypot(a[0], a[1], a[2]),
    norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
  };
  // matrizes 3x3 em linhas
  const M = {
    I: () => [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    mul(A, B) { const R = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R[i][j] = A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j]; return R; },
    ap: (A, v) => [A[0][0] * v[0] + A[0][1] * v[1] + A[0][2] * v[2], A[1][0] * v[0] + A[1][1] * v[1] + A[1][2] * v[2], A[2][0] * v[0] + A[2][1] * v[1] + A[2][2] * v[2]],
    // inclinar para a frente (topo vai para +z)
    rx(a) { const c = Math.cos(a * D), s = Math.sin(a * D); return [[1, 0, 0], [0, c, -s], [0, s, c]]; },
    // girar: +z vai para +x
    ry(a) { const c = Math.cos(a * D), s = Math.sin(a * D); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; },
    // tombar de lado: topo vai para +x
    rz(a) { const c = Math.cos(a * D), s = Math.sin(a * D); return [[c, s, 0], [-s, c, 0], [0, 0, 1]]; },
    cols: (x, y, z) => [[x[0], y[0], z[0]], [x[1], y[1], z[1]], [x[2], y[2], z[2]]],
    // base com y ao longo de d e z o mais perto possível de hint
    alongY(d, hint) {
      const y = V.norm(d); let z = V.sub(hint, V.mul(y, V.dot(hint, y)));
      if (V.len(z) < 1e-4) z = Math.abs(y[0]) < .9 ? V.cross(y, [1, 0, 0]) : V.cross(y, [0, 0, 1]);
      z = V.norm(z); const x = V.cross(y, z); return M.cols(x, y, z);
    },
    // base com z ao longo de f e y o mais perto possível de up
    alongZ(f, up) {
      const z = V.norm(f); let y = V.sub(up, V.mul(z, V.dot(up, z)));
      if (V.len(y) < 1e-4) y = [0, 1, 0]; y = V.norm(y); const x = V.cross(y, z); return M.cols(x, y, z);
    },
  };

  // Tipos de corpo. Medidas reais de adulto (cm).
  const TIPOS = {
    // Mehran Karimi Nasseri: ~1,72 m, magro, cabelo penteado para trás até a gola, bigode cheio.
    nasseri: { alt: 172, larg: 1.0, barriga: 0, cabelo: 'nasseri', bigode: 1, cor: '#141a2c', rim: '#ffb46a' },
    // funcionário do aeroporto (coadjuvante laranja-terroso), quepe
    funcionario: { alt: 178, larg: 1.08, barriga: 0.6, cabelo: 'quepe', bigode: 0, cor: '#8a4a26', rim: '#ffd09a' },
    // funcionário da prefeitura / da imigração: terno, careca
    oficial: { alt: 175, larg: 1.05, barriga: 1, cabelo: 'careca', bigode: 0, cor: '#7c4424', rim: '#ffd09a', paleto: 1 },
    // produtor de cinema: óculos escuros, topete
    produtor: { alt: 180, larg: 1.0, barriga: 0.3, cabelo: 'topete', bigode: 0, cor: '#8a4a26', rim: '#ffd09a', oculos: 1, paleto: 1 },
    // passageira (multidão)
    passageira: { alt: 166, larg: 0.9, barriga: 0, cabelo: 'coque', bigode: 0, cor: '#4b5672', rim: '#d9e4ff', saia: 1 },
    passageiro: { alt: 180, larg: 1.04, barriga: 0.2, cabelo: 'curto', bigode: 0, cor: '#4b5672', rim: '#d9e4ff' },
  };

  Object.assign(TIPOS, {
    jensen: { alt: 174, larg: 1.0, barriga: 0, cabelo: 'topete', mangaCurta: 1, mochila: 1, cores: { skin: '#f2c49b', shirt: '#e23b2e', pants: '#2f5fa8', shoe: '#f4f4f0', hair: '#4a2c17', pack: '#3d8a4f', strap: '#2c6b3b' } },
    amigo: { alt: 178, larg: 1.04, barriga: 0.2, cabelo: 'bone', mochila: 1, bermuda: 1, cores: { skin: '#c98f62', shirt: '#f2b632', pants: '#3a3f4a', shoe: '#2b2b30', hair: '#1d1410', cap: '#2f6fd0', pack: '#8a5a2c', strap: '#6b431d' } },
    cobaia: { alt: 172, larg: 1.0, barriga: 0.3, cabelo: 'curto', mangaCurta: 1, cores: { skin: '#f0c7a0', shirt: '#45a36b', pants: '#6a6f7a', shoe: '#3a2c22', hair: '#2a1c12' } },
    cumpliceA: { alt: 168, larg: 0.94, barriga: 0, cabelo: 'longo', mangaCurta: 1, cores: { skin: '#f3cfae', shirt: '#b25fd0', pants: '#2c3350', shoe: '#f4f4f0', hair: '#7a2e1c' } },
    cumpliceB: { alt: 182, larg: 1.1, barriga: 0.9, cabelo: 'espetado', bermuda: 1, cores: { skin: '#8d5a3b', shirt: '#2aa7a0', pants: '#7a5a3a', shoe: '#e6e2d6', hair: '#141010' } },
    cumpliceC: { alt: 172, larg: 1.0, barriga: 0.2, cabelo: 'curto', mangaCurta: 1, bermuda: 1, cores: { skin: '#e9b98f', shirt: '#f08a2c', pants: '#35506a', shoe: '#2b2b30', hair: '#d9b25a' } },
  });
  TIPOS.jensenSem = Object.assign({}, TIPOS.jensen, { mochila: 0 }); TIPOS.amigoSem = Object.assign({}, TIPOS.amigo, { mochila: 0 });
  // Proporções de base para 172 cm (escala linear para outras alturas).
  const B = {
    tornoz: 7, canela: 41, coxa: 42, quadril: 8.6, // meia distância entre as articulações do quadril
    cintura: 12, peito: 21, // pelve -> cintura -> base do peito
    ombroX: 17.2, ombroY: 17.5, pescocoY: 20.5, pescoco: 8.5,
    braco: 30.5, antebraco: 25.5, mao: 18.5, pe: 25.5,
  };

  function ik2(A, T, l1, l2, pole) {
    let d = V.sub(T, A); let dl = V.len(d);
    const mx = (l1 + l2) * 0.9995, mn = Math.abs(l1 - l2) + 0.01;
    if (dl > mx) { d = V.mul(V.norm(d), mx); dl = mx; }
    if (dl < mn) { d = V.mul(V.norm(d), mn); dl = mn; }
    const dir = V.norm(d); const al = (l1 * l1 - l2 * l2 + dl * dl) / (2 * dl);
    const h = Math.sqrt(Math.max(0, l1 * l1 - al * al));
    let p = V.sub(pole, V.mul(dir, V.dot(pole, dir)));
    if (V.len(p) < 1e-4) p = Math.abs(dir[1]) < .9 ? [0, 1, 0] : [0, 0, 1];
    p = V.norm(p);
    const mid = V.add(V.add(A, V.mul(dir, al)), V.mul(p, h));
    return { mid, end: V.add(A, d) };
  }

  /* pose:
     pos   [x,y,z] posição no chão (pés) em coordenadas do mundo; a pelve é calculada
     yaw   rotação do corpo; lean, roll da pelve (graus)
     pelvisY  altura da pelve (padrão = em pé); sentar: use sit:{seat}
     spine [pitch, roll, twist], chest [...], neck [...], head [pitch, yaw, roll]
     armL/armR: { t:[x,y,z] alvo do pulso (local ao personagem), pole:[...], hand:'relax'|'fist'|'open'|'hold'|'pinch', hd:[dir da mão local] }
     legL/legR: { t:[x,y,z] alvo do tornozelo (local), pole, fwd:[dir do pé local] }
     Coordenadas locais: origem no chão sob a pelve, rodando com yaw. */
  function build(tipo, pose) {
    const T = typeof tipo === 'string' ? TIPOS[tipo] : tipo;
    const k = T.alt / 172, W = T.larg || 1;
    const b = {}; for (const key in B) b[key] = B[key] * k;
    const P = pose || {};
    const yaw = P.yaw || 0;
    const Ry = M.ry(yaw);
    const pos = P.pos || [0, 0, 0];
    const toW = v => V.add(pos, M.ap(Ry, v)); // local -> mundo
    const standY = b.tornoz + b.canela + b.coxa - 1.2 * k;
    const pel = P.pel || [0, P.pelvisY != null ? P.pelvisY : standY, 0];
    const Rp = M.mul(Ry, M.mul(M.rx(P.lean || 0), M.rz(P.roll || 0)));
    const pelW = V.add(pos, M.ap(Ry, pel));
    const sp = P.spine || [0, 0, 0], ch = P.chest || [0, 0, 0], nk = P.neck || [0, 0, 0], hd = P.head || [0, 0, 0];
    const rot3 = a => M.mul(M.ry(a[2] || 0), M.mul(M.rx(a[0] || 0), M.rz(a[1] || 0)));
    const waistW = V.add(pelW, M.ap(Rp, [0, b.cintura, 0]));
    const Rw = M.mul(Rp, rot3(sp));
    const chestW = V.add(waistW, M.ap(Rw, [0, b.peito * 0.35, 0]));
    const Rc = M.mul(Rw, rot3(ch));
    const atC = v => V.add(chestW, M.ap(Rc, v));
    const neckB = atC([0, b.pescocoY, -0.8 * k]);
    const Rn = M.mul(Rc, M.mul(M.ry(nk[2] || 0), M.mul(M.rx(-8 + (nk[0] || 0)), M.rz(nk[1] || 0))));
    const headP = V.add(neckB, M.ap(Rn, [0, b.pescoco, 0]));
    const Rh = M.mul(Rn, M.mul(M.ry(hd[1] || 0), M.mul(M.rx(8 + (hd[0] || 0)), M.rz(hd[2] || 0))));
    const atH = v => V.add(headP, M.ap(Rh, V.mul(v, k)));

    const prims = []; // {t:'e', c, A(3x3 colunas=semi-eixos), part} | {t:'c', a, b, ra, rb, part}
    let MAT = 'shirt';
    const E = (part, c, R, r) => prims.push({ t: 'e', part, m: MAT, c, A: M.mul(R, [[r[0], 0, 0], [0, r[1], 0], [0, 0, r[2]]]) });
    const C = (part, a, bb, ra, rb) => prims.push({ t: 'c', part, m: MAT, a, b: bb, ra, rb: rb == null ? ra : rb });
    const s = k * W;

    // ---- tronco ----
    const atP = v => V.add(pelW, M.ap(Rp, v));
    const atWst = v => V.add(waistW, M.ap(Rw, v));
    MAT = 'pants';
    E('body', atP([0, -1.5 * k, -0.6 * k]), Rp, [14.3 * s, 11 * k, 10.2 * k]);       // quadril
    E('body', atP([0, -4 * k, -3.2 * k]), Rp, [13.4 * s, 9 * k, 8.2 * k]);       // glúteos
    MAT = 'shirt';
    E('body', atWst([0, 1 * k, 0.4 * k + (T.barriga || 0) * 1.6 * k]), Rw, [13.4 * s, 13 * k, (9.4 + (T.barriga || 0) * 2.2) * k]); // cintura
    C('body', atP([0, 2 * k, -0.6 * k]), atC([0, 12 * k, 0]), 12.2 * s, 12.6 * s);     // tronco contínuo
    if (T.cores) C('body', atWst([-9.8 * s, -10 * k, -0.4 * k]), atWst([9.8 * s, -10 * k, -0.4 * k]), 6 * k);   // barra reta da camisa
    E('body', atC([0, 7.5 * k, 0.3 * k]), Rc, [14.6 * s, 13 * k, 10.4 * k]);          // costelas
    E('body', atC([0, 14.5 * k, 0.6 * k]), Rc, [15.6 * s, 6.8 * k, 10 * k]);          // peito alto
    E('body', atC([0, 15.5 * k, -4 * k]), Rc, [14 * s, 6.5 * k, 6.5 * k]);            // escápulas
    const shL = atC([b.ombroX * W, b.ombroY, -1.2 * k]), shR = atC([-b.ombroX * W, b.ombroY, -1.2 * k]);
    C('body', atC([0, b.pescocoY - 1.5 * k, -1 * k]), shL, 6 * k, 5.6 * k);           // trapézio
    C('body', atC([0, b.pescocoY - 1.5 * k, -1 * k]), shR, 6 * k, 5.6 * k);
    if (T.paleto) { // barra do paletó caindo sobre o quadril
      E('body', atWst([0, -6 * k, -0.5 * k]), Rw, [15.8 * s, 9 * k, 11.4 * k]);
    }
    if (T.saia) { // saia evasê
      C('body', atP([0, 2 * k, 0]), atP([0, -26 * k, 0]), 13.5 * s, 16 * s);
    }
    // gola
    E('body', V.add(neckB, M.ap(Rn, [0, 0.8 * k, 0.6 * k])), Rn, [7.6 * k, 2.6 * k, 7.2 * k]);
    // pescoço
    MAT = 'head';
    C('body', neckB, V.add(headP, M.ap(Rh, [0, 1.5 * k, 0])), 5.4 * k, 5 * k);

    // ---- cabeça ---- (origem no topo do pescoço)
    E('body', atH([0, 10.8, -0.6]), Rh, [7.5 * k, 9.6 * k, 9.4 * k]);            // crânio
    E('body', atH([0, 4.6, 3.4]), Rh, [6.1 * k, 6.6 * k, 6 * k]);                 // rosto/maxilar
    E('body', atH([0, 0.9, 6.6]), M.mul(Rh, M.rx(-20)), [3.6 * k, 2.4 * k, 2.8 * k]); // queixo
    E('body', atH([0, 10.6, 7.6]), Rh, [5.6 * k, 1.7 * k, 1.8 * k]);              // sobrancelha
    C('body', atH([0, 9.2, 8.6]), atH([0, 5.9, 11.1]), 1.05 * k, 1.35 * k);       // nariz
    E('body', atH([4.4 * 0 + 7.4, 7.6, -0.4]), Rh, [1.2 * k, 3 * k, 2.1 * k]);    // orelhas
    E('body', atH([-7.4, 7.6, -0.4]), Rh, [1.2 * k, 3 * k, 2.1 * k]);
    E('body', atH([0, 3.0, 8.4]), Rh, [3.5 * k, 1.6 * k, 2 * k]);                 // lábios
    if (T.bigode) {
      E('body', atH([0, 4.25, 9.7]), M.mul(Rh, M.rx(14)), [4.3 * k, 1.35 * k, 1.9 * k]);
      E('body', atH([2.9, 3.4, 9.1]), Rh, [1.5 * k, 1.5 * k, 1.5 * k]);
      E('body', atH([-2.9, 3.4, 9.1]), Rh, [1.5 * k, 1.5 * k, 1.5 * k]);
    }
    MAT = 'hair';
    const cab = T.cabelo;
    if (cab === 'nasseri') {
      E('body', atH([0, 16.8, 0.5]), M.mul(Rh, M.rx(-10)), [8.3 * k, 5.6 * k, 10.6 * k]); // volume no alto, penteado para trás
      E('body', atH([0, 18.2, 5.6]), M.mul(Rh, M.rx(-22)), [6.9 * k, 3.4 * k, 5 * k]);   // topete baixo na testa
      E('body', atH([0, 11.6, -6.6]), Rh, [8.4 * k, 8.8 * k, 5.4 * k]);                  // nuca
      E('body', atH([0, 4.6, -7.4]), M.mul(Rh, M.rx(14)), [7.6 * k, 6.4 * k, 4 * k]);    // até a gola
      E('body', atH([6.6, 9.5, -2.8]), Rh, [2.4 * k, 6.5 * k, 5.6 * k]);                  // laterais sobre as orelhas
      E('body', atH([-6.6, 9.5, -2.8]), Rh, [2.4 * k, 6.5 * k, 5.6 * k]);
    } else if (cab === 'curto') {
      MAT = 'hairB'; E('body', atH([0, 15.4, -2.4]), Rh, [8.1 * k, 7.4 * k, 8.9 * k]); E('body', atH([0, 9.5, -6.2]), Rh, [7.9 * k, 6.5 * k, 4.6 * k]); MAT = 'hair'; E('body', atH([0, 17.8, 3.2]), M.mul(Rh, M.rx(-15)), [7.7 * k, 3.4 * k, 6 * k]);
    } else if (cab === 'topete') {
      MAT = 'hairB'; E('body', atH([0, 15.4, -2.4]), Rh, [8.1 * k, 7.4 * k, 8.9 * k]); E('body', atH([0, 9.5, -6.2]), Rh, [7.9 * k, 6.5 * k, 4.6 * k]);
      MAT = 'hair'; E('body', atH([0, 17.8, 3.2]), M.mul(Rh, M.rx(-15)), [7.7 * k, 3.4 * k, 6 * k]); E('body', atH([0, 20, 4.6]), M.mul(Rh, M.rx(-32)), [6.2 * k, 3.6 * k, 6.2 * k]);
    } else if (cab === 'coque') {
      E('body', atH([0, 13.4, -0.8]), Rh, [8 * k, 8.4 * k, 9.9 * k]);
      E('body', atH([0, 18, -8]), Rh, [4.6 * k, 4.6 * k, 4.6 * k]);
    } else if (cab === 'quepe') {
      E('body', atH([0, 16.5, 0]), Rh, [8.4 * k, 4.6 * k, 9.6 * k]);
      C('body', atH([0, 17.5, 0]), atH([0, 21.5, 0.5]), 8.6 * k, 9 * k);
      E('body', atH([0, 15.3, 8.4]), M.mul(Rh, M.rx(-12)), [7 * k, 0.9 * k, 4.6 * k]); // aba
    }
    else if (cab === 'bone') { // boné
      MAT = 'hairB'; E('body', atH([0, 11, -4.6]), Rh, [8 * k, 7 * k, 6.2 * k]);                     // cabelo na nuca
      MAT = 'cap'; E('body', atH([0, 17.2, -0.8]), Rh, [8.5 * k, 5.2 * k, 9.6 * k]);
      E('body', atH([0, 15.6, 10.2]), M.mul(Rh, M.rx(-6)), [6.6 * k, 0.9 * k, 5.4 * k]);  // aba
    } else if (cab === 'espetado') {
      MAT = 'hairB'; E('body', atH([0, 15.4, -2.4]), Rh, [8.1 * k, 7.4 * k, 8.9 * k]); E('body', atH([0, 9.5, -6.2]), Rh, [7.9 * k, 6.5 * k, 4.6 * k]); MAT = 'hair'; E('body', atH([0, 17.8, 3.2]), M.mul(Rh, M.rx(-15)), [7.7 * k, 3.4 * k, 6 * k]);
      for (const [x, y, z, a] of [[0, 20.5, 3, -35], [-4, 20, 0, -10], [4, 20, 0, -10], [0, 20.5, -4, 20], [-5.5, 18, -5, 30], [5.5, 18, -5, 30]]) C('body', atH([x * .7, y - 4, z * .7]), atH([x, y + 1.5, z + Math.sin(a * D) * 3]), 3.2 * k, 0.9 * k);
    } else if (cab === 'longo') {
      MAT = 'hairB'; E('body', atH([0, 15.4, -2.4]), Rh, [8.2 * k, 7.5 * k, 8.9 * k]);
      E('body', atH([0, 4, -6.8]), Rh, [8.4 * k, 12 * k, 4.4 * k]);
      E('body', atH([7.4, 4, -3.6]), Rh, [1.8 * k, 9 * k, 3.6 * k]); E('body', atH([-7.4, 4, -3.6]), Rh, [1.8 * k, 9 * k, 3.6 * k]); MAT = 'hair'; E('body', atH([0, 17.8, 3.2]), M.mul(Rh, M.rx(-15)), [7.7 * k, 3.4 * k, 6 * k]);
    }
    if (T.oculos) { MAT = 'glass'; E('body', atH([0, 9.4, 8.6]), Rh, [7 * k, 1.9 * k, 1.4 * k]); }
    if (T.mochila) { // mochila nas costas + alças
      MAT = 'pack'; E('pack', atC([0, 5 * k, -15.5 * k]), Rc, [12.5 * k, 16 * k, 7.5 * k]); E('pack', atC([0, -2 * k, -19.5 * k]), Rc, [8.5 * k, 7 * k, 4.6 * k]);
      MAT = 'strap'; for (const sx of [1, -1]) { C('body', atC([sx * 9.5 * W, 19 * k, -4 * k]), atC([sx * 10.5 * W, 13 * k, 9 * k]), 1.7 * k); C('body', atC([sx * 10.5 * W, 13 * k, 9 * k]), atC([sx * 11.5 * W, 0, 6 * k]), 1.7 * k); }
    }

    // ---- pernas ----
    const legs = {};
    for (const side of ['L', 'R']) {
      const sg = side === 'L' ? 1 : -1;
      const hip = atP([sg * b.quadril * W, 0, 0]);
      const L = P['leg' + side] || {};
      const def = [sg * (b.quadril * W + 1), b.tornoz, 1.5 * k];
      const tl = L.t || def;
      const tgt = toW(tl);
      const pole = M.ap(Ry, L.pole || [sg * 0.15, 0, 1]);
      const r = ik2(hip, tgt, b.coxa, b.canela, pole);
      const knee = r.mid, ank = r.end;
      const part = 'leg' + side;
      MAT = 'pants'; C(part, hip, knee, 8.1 * s, 6.1 * k);         // coxa (calça)
      if (T.bermuda) MAT = 'skin';
      C(part, knee, ank, 6.0 * k, 5.4 * k);          // canela (calça reta)
      E(part, V.lerp(knee, ank, .02), M.alongY(V.sub(knee, ank), M.ap(Ry, [0, 0, 1])), [6.1 * k, 6 * k, 6.6 * k]);
      // sapato
      MAT = 'shoe';
      const fwd = V.norm(M.ap(Ry, L.fwd || [sg * 0.12, 0, 1]));
      const Rf = M.alongZ(fwd, [0, 1, 0]);
      const atF = v => V.add(ank, M.ap(Rf, V.mul(v, k)));
      E(part, atF([0, -1.2, 0]), Rf, [4.6 * k, 4.6 * k, 4.6 * k]);             // tornozelo/bainha
      E(part, atF([0, -3.6, -1.6]), Rf, [4.3 * k, 3.4 * k, 4.6 * k]);          // calcanhar
      E(part, atF([0, -3.9, 6.6]), Rf, [4.6 * k, 3.1 * k, 9.6 * k]);           // corpo do sapato
      E(part, atF([0, -4.6, 14.4]), M.mul(Rf, M.rx(6)), [4.1 * k, 2.4 * k, 5 * k]); // bico
      legs[side] = { hip, knee, ank, toe: atF([0, -7, 19]) };
    }

    // ---- braços ----
    const arms = {};
    for (const side of ['L', 'R']) {
      const sg = side === 'L' ? 1 : -1;
      const sh = side === 'L' ? shL : shR;
      const A = P['arm' + side] || {};
      const def = [sg * (b.ombroX * W + 3.5 * k), P.pelvisY != null ? (P.pelvisY + 4 * k) : standY - 5 * k, 0.5 * k];
      let tgt;
      if (A.w) tgt = A.w; // alvo já em coordenadas do mundo
      else if (A.t) tgt = toW(A.t);
      else tgt = V.add(sh, M.ap(Ry, [sg * 2.8 * k, -(b.braco + b.antebraco - 1.2 * k), 1.2 * k]));
      const pole = A.poleW || M.ap(Ry, A.pole || [sg * 0.5, -0.2, -1]);
      const r = ik2(sh, tgt, b.braco, b.antebraco, pole);
      const el = r.mid, wr = r.end;
      const part = 'arm' + side;
      MAT = 'shirt'; E('body', sh, Rc, [5.9 * k, 6 * k, 6.1 * k]);  // ombro (fica no corpo, sem bola aparente)
      const up = V.lerp(sh, el, 0.42);
      C('body', sh, up, 5.2 * k, 4.5 * k);
      C(part, up, V.lerp(sh, el, T.mangaCurta ? 0.62 : 1), 4.45 * k, T.mangaCurta ? 4.5 * k : 3.95 * k);          // braço (manga)
      if (T.mangaCurta) { MAT = 'skin'; C(part, V.lerp(sh, el, 0.5), el, 4.0 * k, 3.7 * k); }
      C(part, el, wr, 3.9 * k, 3.05 * k);           // antebraço
      if (!T.mangaCurta) E(part, V.lerp(el, wr, .82), M.alongY(V.sub(el, wr), [0, 0, 1]), [3.5 * k, 3.4 * k, 3.4 * k]); // punho da camisa
      MAT = 'skin';
      // mão
      let hdir = A.hd ? V.norm(M.ap(Ry, A.hd)) : (A.hdW ? V.norm(A.hdW) : V.norm(V.sub(wr, el)));
      const palmN = A.palm ? V.norm(M.ap(Ry, A.palm)) : (A.palmW ? V.norm(A.palmW) : V.norm(M.ap(Ry, [-sg, 0, 0.2])));
      const Rh2 = M.alongY(V.mul(hdir, -1), V.mul(palmN, 1)); // y aponta do dedo para o pulso, z = palma
      const hk = 1.12 * k; const atM = v => V.add(wr, M.ap(Rh2, V.mul(v, hk)));
      const shape = A.hand || 'relax';
      if (shape === 'fist' || shape === 'hold') {
        E(part, atM([0, -5.2, 0.6]), Rh2, [4.1 * k, 5.2 * k, 2.4 * k]);
        E(part, atM([0, -9.2, 1.6]), Rh2, [3.8 * k, 2.6 * k, 2.8 * k]);
        C(part, atM([sg * 0 + 2.6, -3.5, 1.8]), atM([2.0, -7.6, 3.3]), 1.25 * k, 1.05 * k); // polegar
      } else if (shape === 'open') {
        E(part, atM([0, -5.2, 0.2]), Rh2, [4.3 * k, 5.4 * k, 1.8 * k]);
        for (let i = 0; i < 4; i++) { const x = -2.9 + i * 1.95; C(part, atM([x, -9.5, 0.1]), atM([x * 1.1, -16.4 + Math.abs(i - 1.5) * 0.9, -0.4]), 0.98 * k, 0.8 * k); }
        C(part, atM([3.2, -3.5, 1.2]), atM([6.6, -8.4, 1.8]), 1.2 * k, 0.95 * k);
      } else if (shape === 'pinch') { // segurando algo fino (cachimbo, caneta)
        E(part, atM([0, -5.2, 0.6]), Rh2, [4.1 * k, 5.2 * k, 2.4 * k]);
        C(part, atM([-1.5, -9.2, 1.4]), atM([-1, -13, 3.4]), 1.0 * k, 0.85 * k);
        C(part, atM([0.6, -9.4, 1.6]), atM([0.5, -12.4, 4.2]), 1.0 * k, 0.85 * k);
        C(part, atM([2.6, -3.6, 1.8]), atM([1.6, -8.6, 4.4]), 1.2 * k, 1.0 * k);
        E(part, atM([-0.8, -9.6, 1.2]), Rh2, [3.2 * k, 2.4 * k, 2.4 * k]);
      } else { // relaxada
        E(part, atM([0, -5.2, 0.4]), Rh2, [4.1 * k, 5.4 * k, 2 * k]);
        C(part, atM([-0.4, -9.4, 0.6]), atM([-0.2, -15.2, 2.2]), 2.9 * k, 1.9 * k);
        C(part, atM([2.8, -3.4, 1.6]), atM([3.4, -8.2, 3.2]), 1.2 * k, 1.0 * k);
      }
      arms[side] = { sh, el, wr, grip: atM([0, -8.8, 2.6]), R: Rh2, hdir, palmN, pole };
    }

    const kf = T.cabeca || (T.cores ? 1.1 : 1);
    if (kf !== 1) for (const p of prims) if (['head', 'hair', 'hairB', 'cap', 'glass'].includes(p.m)) { const sc = v => V.add(headP, V.mul(V.sub(v, headP), kf)); if (p.t === 'e') { p.c = sc(p.c); p.A = p.A.map(r => r.map(x => x * kf)); } else { p.a = sc(p.a); p.b = sc(p.b); p.ra *= kf; p.rb *= kf; } }
    const atHf = v => V.add(headP, M.ap(Rh, V.mul(v, k * kf)));
    // pontos úteis
    const J = {
      pel: pelW, waist: waistW, chest: chestW, neck: neckB, head: headP,
      mouth: atHf([0, 3, 10.4]), eye: atHf([3, 8.4, 8]), top: atHf([0, 22.6, 0]), kh: k * kf,
      hipL: legs.L.hip, hipR: legs.R.hip, kneeL: legs.L.knee, kneeR: legs.R.knee, ankL: legs.L.ank, ankR: legs.R.ank,
      shL: arms.L.sh, shR: arms.R.sh, elL: arms.L.el, elR: arms.R.el, wrL: arms.L.wr, wrR: arms.R.wr,
      gripL: arms.L.grip, gripR: arms.R.grip, handRL: arms.L.R, handRR: arms.R.R, hdL: arms.L.hdir, hdR: arms.R.hdir, palmL: arms.L.palmN, palmR: arms.R.palmN, poleL: arms.L.pole, poleR: arms.R.pole,
      Rh, Rc, Rp, Ry, k,
    };
    return { prims, J, T, k };
  }

  // Altura da pelve para quem senta num assento de altura h (cm, topo do assento).
  function sitPose(tipo, seat, extra) {
    const T = TIPOS[tipo] || tipo; const k = T.alt / 172;
    const pelY = seat + 9.5 * k;
    const o = Object.assign({ pelvisY: pelY, pel: [0, pelY, -6 * k] }, extra || {});
    const sx = 10.5 * k;
    o.legL = Object.assign({ t: [sx, 7 * k, 36 * k], pole: [0.1, 0.3, 1] }, (extra && extra.legL) || {});
    o.legR = Object.assign({ t: [-sx, 7 * k, 36 * k], pole: [-0.1, 0.3, 1] }, (extra && extra.legR) || {});
    return o;
  }

  G.RIG = { V, M, D, TIPOS, build, sitPose, ik2, B };
})(typeof window !== 'undefined' ? window : globalThis);
