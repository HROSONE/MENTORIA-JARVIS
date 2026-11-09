/* poses.js — poses nomeadas. Coordenadas locais do personagem (cm):
   x = esquerda dele, y = cima, z = frente. Sentado: assento a 45 cm. */
(function (G) {
  const { sitPose, build, V, M } = G.RIG;
  const P = {};
  const SEAT = 45;
  const merge = (a, b) => Object.assign({}, a, b || {});

  // em pé, relaxado
  P.stand = o => merge({ armL: {}, armR: {}, chest: [3, 0, 0], neck: [2, 0, 0] }, o);

  // caminhada: phase 0..1 (um ciclo = dois passos)
  P.walk = (ph, o) => {
    o = o || {}; const half = o.half || 27, k = 1;
    const foot = (u) => {
      u = ((u % 1) + 1) % 1;
      if (u < 0.6) { const a = u / 0.6; return [half - a * 2 * half, 7, 0]; }
      const a = (u - 0.6) / 0.4; const e = 0.5 - 0.5 * Math.cos(a * Math.PI);
      return [-half + e * 2 * half, 7 + Math.sin(a * Math.PI) * 11, Math.sin(a * Math.PI) * 18];
    };
    const fl = foot(ph), fr = foot(ph + 0.5);
    const bob = 88.5 - 3.3 * Math.min(1, half / 27) + 1.3 * Math.min(1, half / 27) * Math.cos(ph * 4 * Math.PI); // passo curto = perna mais esticada
    const sw = Math.sin(ph * 2 * Math.PI);
    const pose = {
      pelvisY: bob, lean: 2, roll: sw * 2, spine: [2, 0, sw * 4], chest: [3, 0, -sw * 6], neck: [2, 0, 0],
      legL: { t: [9.6, fl[0] > 0 ? 7 + 0 : 7, 0], pole: [0.1, 0, 1], fwd: [0, -fl[2] / 60, 1] },
      legR: { t: [-9.6, 7, 0], pole: [-0.1, 0, 1], fwd: [0, -fr[2] / 60, 1] },
      armL: { t: [19, 82, -sw * 22 + 2], hand: 'relax' },
      armR: { t: [-19, 82, sw * 22 + 2], hand: 'relax' },
    };
    pose.legL.t = [9.6, fl[1], fl[0]]; pose.legR.t = [-9.6, fr[1], fr[0]];
    const rest = Object.assign({}, o); delete rest.half; return Object.assign(pose, rest);
  };

  // sentado (base)
  const sitBase = o => sitPose('nasseri', SEAT, merge({ lean: -4, spine: [10, 0, 0], chest: [8, 0, 0], neck: [6, 0, 0], head: [2, 0, 0],
    armL: { t: [13, SEAT + 13, 30], hand: 'relax', hd: [0.1, -0.5, 1], palm: [0, -1, 0] },
    armR: { t: [-13, SEAT + 13, 30], hand: 'relax', hd: [-0.1, -0.5, 1], palm: [0, -1, 0] } }, o));
  P.sit = (seat, o) => sitBase(o);

  // ajusta um alvo de mão relativo a uma junta (2 passos: monta, mede, posiciona)
  function handTo(tipo, pose, side, fn) {
    const r = build(tipo, pose); const w = fn(r.J);
    pose['arm' + side] = Object.assign({}, pose['arm' + side], { w });
    return pose;
  }
  // cachimbo na boca com a mão direita; puff 0..1 afasta um pouco
  P.sitPipe = (o, puff) => {
    const p = sitBase(merge({ head: [-2, 0, 0], armR: { hand: 'pinch', pole: [-1, -0.6, -0.2], hdW: null } }, o));
    const pf = puff || 0;
    return handTo('nasseri', p, 'R', J => {
      const fwd = M.ap(J.Rh, [0, 0, 1]), lft = M.ap(J.Rh, [1, 0, 0]);
      // pulso fica abaixo e à frente da boca, à direita
      p.armR.hdW = V.norm(V.add(V.mul(fwd, 0.55), V.add([0, 0.75, 0], V.mul(lft, 0.35))));
      p.armR.palmW = V.norm(V.add(V.mul(lft, 1), [0, 0, 0]));
      return V.add(J.mouth, V.add(V.mul(fwd, 5 + pf * 9), V.add([0, -13 - pf * 4, 0], V.mul(lft, -3.5))));
    });
  };
  // escrevendo no diário apoiado na coxa
  P.sitWrite = o => {
    const p = sitBase(merge({ spine: [16, 0, 0], chest: [12, 0, 0], neck: [12, 0, 0], head: [14, 0, 0],
      armL: { t: [8, SEAT + 15, 32], hand: 'open', hd: [-0.5, 0, 1], palm: [0, 1, 0] },
      armR: { t: [-4, SEAT + 17, 30], hand: 'pinch', hd: [0.3, -0.6, 1], palm: [0, -1, 0.2] } }, o));
    return p;
  };
  // braços cruzados (recusa)
  P.sitCross = o => sitBase(merge({ lean: -8, spine: [4, 0, 0], chest: [2, 0, 0], head: [-6, 0, 0],
    armL: { t: [-8, SEAT + 36, 16], hand: 'fist', pole: [1, -0.3, -0.4], hd: [-1, 0, 0] },
    armR: { t: [8, SEAT + 33, 19], hand: 'fist', pole: [-1, -0.3, -0.4], hd: [1, 0, 0] } }, o));
  // segurando papel na frente para ler (duas mãos)
  P.sitRead = o => sitBase(merge({ spine: [12, 0, 0], chest: [8, 0, 0], head: [10, 0, 0],
    armL: { t: [12, SEAT + 30, 36], hand: 'hold', hd: [0, 1, 0.3], palm: [-1, 0, 0] },
    armR: { t: [-12, SEAT + 30, 36], hand: 'hold', hd: [0, 1, 0.3], palm: [1, 0, 0] } }, o));
  // estendendo a mão para receber algo (direita)
  P.sitReach = o => sitBase(merge({ spine: [14, 0, 0], chest: [6, 0, 0], head: [4, 0, 0],
    armR: { t: [-12, SEAT + 40, 52], hand: 'open', hd: [0, 0.2, 1], palm: [0, 1, 0] } }, o));
  // comendo (mão direita na boca com o lanche)
  P.sitEat = o => {
    const p = sitBase(merge({ head: [4, 0, 0], armR: { hand: 'hold', pole: [-1, -0.6, -0.2] }, armL: { t: [10, SEAT + 22, 30], hand: 'hold', hd: [0, 1, 0.4] } }, o));
    return handTo('nasseri', p, 'R', J => { const fwd = M.ap(J.Rh, [0, 0, 1]); p.armR.hdW = V.norm(V.add(fwd, [0, 0.9, 0])); return V.add(J.mouth, V.add(V.mul(fwd, 9), [0, -12, 0])); });
  };
  // dormindo deitado no banco (de lado), cabeça sobre o braço — y do quadril sobre o assento
  P.lie = o => merge({ pelvisY: SEAT + 12, pel: [0, SEAT + 12, 0], lean: -90, spine: [0, 0, 0], chest: [0, 0, 0], neck: [-10, 0, 0], head: [-10, 0, 0],
    legL: { t: [9, SEAT + 13, -70], pole: [0, 1, 0.5] }, legR: { t: [-9, SEAT + 9, -72], pole: [0, 1, 0.5] },
    armL: { t: [16, SEAT + 25, 40], hand: 'relax' }, armR: { t: [-5, SEAT + 10, 30], hand: 'relax' } }, o);

  // em pé segurando maleta (mão esquerda) / mala
  P.standCase = o => merge(P.stand(), merge({ armL: { t: [20, 75, 2], hand: 'fist', hd: [0, -1, 0], palm: [-1, 0, 0] } }, o));
  // em pé mostrando as mãos vazias (palmas para cima, ombros levantados)
  P.standShrug = o => merge(P.stand(), merge({ chest: [-2, 0, 0], neck: [-2, 0, 0], head: [-4, 0, 6],
    armL: { t: [32, 100, 26], hand: 'open', hd: [0.5, 0, 1], palm: [0, 1, 0], pole: [1, -1, -0.5] },
    armR: { t: [-32, 100, 26], hand: 'open', hd: [-0.5, 0, 1], palm: [0, 1, 0], pole: [-1, -1, -0.5] } }, o));
  // em pé olhando o relógio de pulso (esquerdo)
  P.standWatch = o => merge(P.stand(), merge({ head: [22, 0, 0], neck: [8, 0, 0],
    armL: { t: [2, 112, 30], hand: 'fist', hd: [-1, 0, 0.3], palm: [0, -1, 0], pole: [1, -1, -0.3] } }, o));
  // em pé, mãos na cabeça (susto)
  P.standShock = o => merge(P.stand(), merge({ head: [-6, 0, 0],
    armL: { t: [16, 150, 6], hand: 'open', hd: [0, 1, 0], pole: [1, 0, 0] }, armR: { t: [-16, 150, 6], hand: 'open', hd: [0, 1, 0], pole: [-1, 0, 0] } }, o));

  // coadjuvantes
  P.offerR = (tipo, o) => merge(P.stand(), merge({ chest: [6, 0, 0], armR: { t: [-14, 115, 52], hand: 'hold', hd: [0, 0.1, 1], palm: [1, 0, 0] } }, o));
  P.pointBack = (tipo, o) => merge(P.stand(), merge({ armR: { t: [-55, 128, -10], hand: 'relax', hd: [-1, 0.1, -0.2], pole: [0, -1, -1] }, head: [0, -20, 0] }, o));
  P.handOut = (tipo, o) => merge(P.stand(), merge({ chest: [4, 0, 0], armR: { t: [-12, 110, 48], hand: 'open', hd: [0, 0, 1], palm: [0, 1, 0] } }, o));
  P.bow = (tipo, o) => merge(P.stand(), merge({ lean: 10, spine: [16, 0, 0], chest: [14, 0, 0], neck: [6, 0, 0],
    armR: { t: [-6, 112, 24], hand: 'relax', hd: [1, -0.2, 0.3], palm: [0, 0, 1], pole: [-1, -1, 0] }, armL: { t: [16, 86, -16], hand: 'relax' } }, o));
  P.push = (tipo, o) => merge(P.walk(o && o.ph || 0, { half: 20 }), merge({ lean: 6, spine: [8, 0, 0],
    armL: { t: [20, 96, 44], hand: 'fist', hd: [0, 0, 1] }, armR: { t: [-20, 96, 44], hand: 'fist', hd: [0, 0, 1] } }, o));

  G.POSES = P; P.SEAT = SEAT;
})(typeof window !== 'undefined' ? window : globalThis);
