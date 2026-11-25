// BIBLIOTECA UNIVERSAL DE ANIMAÇÕES PROFISSIONAIS (85 clipes CC0 Quaternius UAL 1 & 2 + Capturas Ópticas CMU)
// Funciona em TODOS os personagens do projeto:
//   - Elenco (21 personagens: policial, bombeiro, soldado, astronauta, jovem_a..c, davi, lia, nina, teo, velha, maniaco, pai, mae...)
//   - Corredor (corredor, corredor-colorido)
//   - Realistas (lucas10, lucas12, maratonista, mendes, rocha, professora, trilheiro e qualquer novo MakeHuman/Unreal)
//
// Uso de 1 linha em qualquer personagem:
//   import { instalarAnimacoesUniversal, listarAnimacoesUniversal } from '../biblioteca3d/animacoes/universal.js';
//   await instalarAnimacoesUniversal(ator);
//   ator.tocar('Sprint_Loop');        // ou apelido em PT-BR: ator.tocar('CorrerSprint'), ator.tocar('MirarPistola'), ator.tocar('cmu:120_09')
//   // no laço: ator.atualizar(dt);   // ou quadro exato p/ vídeo: ator.pose('AcrobaciaRolar', t)

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const BASE_DIR = new URL('./', import.meta.url).href;
const BASE_CMU = new URL('../mocap/cmu/', import.meta.url).href;

// Apelidos em Português -> nome oficial do clipe (aceita tanto o apelido PT-BR quanto o nome original em inglês ou 'cmu:XX_YY'!)
export const APELIDOS = {
  // Locomoção & Parkour
  ParadoPro: 'Idle_Loop',
  BracosCruzados: 'Idle_FoldArms_Loop',
  NegandoCabeca: 'Idle_No_Loop',
  ConfirmandoCabeca: 'Yes',
  AndarPro: 'Walk_Loop',
  AndarFormal: 'Walk_Formal_Loop',
  CarregarAndando: 'Walk_Carry_Loop',
  Trotar: 'Jog_Fwd_Loop',
  CorrerSprint: 'Sprint_Loop',
  AgacharParado: 'Crouch_Idle_Loop',
  AgacharAndar: 'Crouch_Fwd_Loop',
  PularInicio: 'Jump_Start',
  PularAr: 'Jump_Loop',
  PularPouso: 'Jump_Land',
  PuloNinja: 'NinjaJump_Start',
  AcrobaciaRolar: 'Roll',
  EscorregarInicio: 'Slide_Start',
  EscorregarLoop: 'Slide_Loop',
  EscorregarFim: 'Slide_Exit',
  Escalar1m: 'ClimbUp_1m',
  NadarParado: 'Swim_Idle_Loop',
  NadarFrente: 'Swim_Fwd_Loop',
  Empurrar: 'Push_Loop',

  // Cotidiano, Atuação & Interação
  ConversarEmPe: 'Idle_Talking_Loop',
  ConversarCelular: 'Idle_TalkingPhone_Loop',
  ChamarNaGrade: 'Idle_Rail_Call',
  ApoiarNaGrade: 'Idle_Rail_Loop',
  SegurarLanterna: 'Idle_Lantern_Loop',
  SegurarTocha: 'Idle_Torch_Loop',
  SentarEntrar: 'Sitting_Enter',
  SentadoParado: 'Sitting_Idle_Loop',
  ConversarSentado: 'Sitting_Talking_Loop',
  SentarSair: 'Sitting_Exit',
  Dirigir: 'Driving_Loop',
  Interagir: 'Interact',
  PegarNaMesa: 'PickUp_Table',
  AbrirBau: 'Chest_Open',
  ComerBeber: 'Consume',
  ConsertarAjoelhado: 'Fixing_Kneeling',
  LevantarDoChao: 'LayToIdle',
  Dancar: 'Dance_Loop',
  Colher: 'Farm_Harvest',
  Plantar: 'Farm_PlantSeed',
  Regar: 'Farm_Watering',
  CortarLenha: 'TreeChopping_Loop',

  // Ação, Tiro, Luta & Reações
  PistolaParado: 'Pistol_Idle_Loop',
  MirarPistola: 'Pistol_Aim_Neutral',
  MirarPistolaAlto: 'Pistol_Aim_Up',
  MirarPistolaBaixo: 'Pistol_Aim_Down',
  AtirarPistola: 'Pistol_Shoot',
  RecarregarPistola: 'Pistol_Reload',
  SocoJab: 'Punch_Jab',
  SocoDireto: 'Punch_Cross',
  SocoGancho: 'Melee_Hook',
  Arremessar: 'OverhandThrow',
  DanoPeito: 'Hit_Chest',
  DanoCabeca: 'Hit_Head',
  DanoEmpurrao: 'Hit_Knockback',
  CairMorto: 'Death01',
  EspadaParado: 'Sword_Idle',
  EspadaAtaque: 'Sword_Attack',
  EspadaDefesa: 'Sword_Block',
  EspadaCombo: 'Sword_Regular_Combo',
  EspadaComboPesado: 'Sword_Heavy_Combo',
  ZumbiParado: 'Zombie_Idle_Loop',
  ZumbiAndar: 'Zombie_Walk_Fwd_Loop',
  ZumbiAtaque: 'Zombie_Scratch',

  // Capturas Ópticas Reais CMU complementares (já baixadas em mocap/cmu/)
  AndarDeCostas: 'cmu:69_34',
  AndarFurtivo: 'cmu:120_09',
  Mancar: 'cmu:77_19',
  Rir: 'cmu:13_14',
  Chorar: 'cmu:79_72',
  AcenarApontar: 'cmu:13_27',
  SubirEscada: 'cmu:13_33',
  Comemorar: 'cmu:142_09',
  CarregarMala: 'cmu:70_03',
  PegarNoChao: 'cmu:69_69',
  EsquivarAbaixando: 'cmu:77_09',
  AndarTriste: 'cmu:91_14',
};

let _promPacotes = null;
const _cacheCMU = new Map();
const _cacheRetarget = new Map();

/** Carrega uma única vez os pacotes CC0 UAL1 e UAL2 (In-Place e Root-Motion sob demanda) */
async function carregarFonteUAL(rootMotion = false) {
  const chave = rootMotion ? 'rm' : 'std';
  if (!_promPacotes) _promPacotes = {};
  if (!_promPacotes[chave]) {
    _promPacotes[chave] = (async () => {
      const loader = new GLTFLoader();
      const sufixo = rootMotion ? '_RM.glb' : '.glb';
      const [g1, g2] = await Promise.all([
        loader.loadAsync(`${BASE_DIR}UAL1_Standard${sufixo}`),
        loader.loadAsync(`${BASE_DIR}UAL2_Standard${sufixo}`),
      ]);
      const clipes = new Map();
      for (const c of g1.animations) clipes.set(c.name, { clip: c, cena: g1.scene });
      for (const c of g2.animations) if (!clipes.has(c.name) || c.name !== 'A_TPose') clipes.set(c.name, { clip: c, cena: g2.scene });
      return { g1, g2, clipes };
    })();
  }
  return _promPacotes[chave];
}

/** Lista todos os nomes de animações disponíveis (originais + apelidos PT-BR) */
export async function listarAnimacoesUniversal() {
  const f = await carregarFonteUAL(false);
  return {
    clipesUAL: [...f.clipes.keys()].filter(n => n !== 'A_TPose').sort(),
    apelidosPT: Object.keys(APELIDOS).sort(),
  };
}

/** Detecta automaticamente o esquema de ossos de QUALQUER personagem do projeto */
function detectarPerfil(raizObj) {
  if (raizObj.getObjectByName('Quadril') && raizObj.getObjectByName('BracoE')) {
    return {
      tipo: 'elenco',
      pelvis: 'Quadril',
      hipL: 'CoxaE', hipR: 'CoxaD', spine1: 'Coluna',
      clavL: 'OmbroE', clavR: 'OmbroD', neck: 'Pescoco', chest: 'Peito', head: 'Cabeca',
      cadeias: [
        // [ossoAlvo, filhoAlvo, ossoFonte, filhoFonte, dicaEixoDobradicaMundo]
        ['Coluna', 'Coluna2', 'pelvis', 'spine_01', [1, 0, 0]],
        ['Coluna2', 'Peito', 'spine_01', 'spine_02', [1, 0, 0]],
        ['Peito', 'Pescoco', 'spine_02', 'neck_01', [1, 0, 0]],
        ['Pescoco', 'Cabeca', 'neck_01', 'Head', [1, 0, 0]],
        ['OmbroE', 'BracoE', 'clavicle_l', 'upperarm_l', [0, 0, 1]],
        ['BracoE', 'AntebracoE', 'upperarm_l', 'lowerarm_l', [0, 0, 1]],
        ['AntebracoE', 'MaoE', 'lowerarm_l', 'hand_l', [0, 1, 0]],
        ['OmbroD', 'BracoD', 'clavicle_r', 'upperarm_r', [0, 0, 1]],
        ['BracoD', 'AntebracoD', 'upperarm_r', 'lowerarm_r', [0, 0, 1]],
        ['AntebracoD', 'MaoD', 'lowerarm_r', 'hand_r', [0, 1, 0]],
        ['CoxaE', 'CanelaE', 'thigh_l', 'calf_l', [1, 0, 0]],
        ['CanelaE', 'PeE', 'calf_l', 'foot_l', [1, 0, 0]],
        ['PeE', 'PonteiraE', 'foot_l', 'ball_l', [1, 0, 0]],
        ['CoxaD', 'CanelaD', 'thigh_r', 'calf_r', [1, 0, 0]],
        ['CanelaD', 'PeD', 'calf_r', 'foot_r', [1, 0, 0]],
        ['PeD', 'PonteiraD', 'foot_r', 'ball_r', [1, 0, 0]],
      ],
      maos: [
        ['MaoE', 'AntebracoE', 'hand_l', 'middle_02_l'],
        ['MaoD', 'AntebracoD', 'hand_r', 'middle_02_r'],
      ],
      dedos: [],
      solas: ['PonteiraE', 'PonteiraD', 'PeE', 'PeD'],
    };
  }

  // Perfil Realista / Unreal / Quaternius (lucas10, lucas12, mendes, rocha, professora, maratonista, trilheiro...)
  const nomeCabeca = raizObj.getObjectByName('head') ? 'head' : 'Head';
  const dedos = [];
  for (const lado of ['l', 'r']) {
    for (const f of ['index', 'middle', 'ring', 'pinky', 'thumb']) {
      dedos.push([`${f}_01_${lado}`, `${f}_02_${lado}`, `${f}_01_${lado}`, `${f}_02_${lado}`]);
      dedos.push([`${f}_02_${lado}`, `${f}_03_${lado}`, `${f}_02_${lado}`, `${f}_03_${lado}`]);
    }
  }
  return {
    tipo: 'realista',
    pelvis: 'pelvis',
    hipL: 'thigh_l', hipR: 'thigh_r', spine1: 'spine_01',
    clavL: 'clavicle_l', clavR: 'clavicle_r', neck: 'neck_01', chest: 'spine_03', head: nomeCabeca,
    cadeias: [
      ['spine_01', 'spine_02', 'spine_01', 'spine_02', [1, 0, 0]],
      ['spine_02', 'spine_03', 'spine_02', 'spine_03', [1, 0, 0]],
      ['spine_03', 'neck_01', 'spine_03', 'neck_01', [1, 0, 0]],
      ['neck_01', nomeCabeca, 'neck_01', 'Head', [1, 0, 0]],
      ['clavicle_l', 'upperarm_l', 'clavicle_l', 'upperarm_l', [0, 0, 1]],
      ['upperarm_l', 'lowerarm_l', 'upperarm_l', 'lowerarm_l', [0, 0, 1]],
      ['lowerarm_l', 'hand_l', 'lowerarm_l', 'hand_l', [0, 1, 0]],
      ['clavicle_r', 'upperarm_r', 'clavicle_r', 'upperarm_r', [0, 0, 1]],
      ['upperarm_r', 'lowerarm_r', 'upperarm_r', 'lowerarm_r', [0, 0, 1]],
      ['lowerarm_r', 'hand_r', 'lowerarm_r', 'hand_r', [0, 1, 0]],
      ['thigh_l', 'calf_l', 'thigh_l', 'calf_l', [1, 0, 0]],
      ['calf_l', 'foot_l', 'calf_l', 'foot_l', [1, 0, 0]],
      ['foot_l', 'ball_l', 'foot_l', 'ball_l', [1, 0, 0]],
      ['thigh_r', 'calf_r', 'thigh_r', 'calf_r', [1, 0, 0]],
      ['calf_r', 'foot_r', 'calf_r', 'foot_r', [1, 0, 0]],
      ['foot_r', 'ball_r', 'foot_r', 'ball_r', [1, 0, 0]],
    ],
    maos: [
      ['hand_l', 'lowerarm_l', 'hand_l', 'middle_01_l'],
      ['hand_r', 'lowerarm_r', 'hand_r', 'middle_01_r'],
    ],
    dedos,
    solas: ['ball_l', 'ball_r', 'foot_l', 'foot_r'],
  };
}

function baseOrtonormal(eixoX, eixoY) {
  const x = eixoX.clone().normalize();
  const y = eixoY.clone().sub(x.clone().multiplyScalar(eixoY.dot(x)));
  if (y.lengthSq() < 1e-8) y.set(0, 1, 0).sub(x.clone().multiplyScalar(x.y));
  y.normalize();
  const z = new THREE.Vector3().crossVectors(x, y).normalize();
  return new THREE.Matrix4().makeBasis(x, y, z);
}

function girarSegmentoMundo(osso, deMundo, paraMundo) {
  if (deMundo.lengthSq() < 1e-10 || paraMundo.lengthSq() < 1e-10) return;
  const qDelta = new THREE.Quaternion().setFromUnitVectors(deMundo.clone().normalize(), paraMundo.clone().normalize());
  const qPai = osso.parent.getWorldQuaternion(new THREE.Quaternion());
  const qOsso = osso.getWorldQuaternion(new THREE.Quaternion());
  osso.quaternion.copy(qPai.invert().multiply(qDelta.multiply(qOsso)));
  osso.updateMatrixWorld(true);
}

function capturarEstadoOssos(raizObj) {
  const mapa = new Map();
  raizObj.traverse(o => {
    if (o.isBone) mapa.set(o, { p: o.position.clone(), q: o.quaternion.clone() });
  });
  return {
    posRaiz: raizObj.position.clone(),
    rotRaiz: raizObj.rotation.clone(),
    ossos: mapa,
  };
}

function restaurarEstadoOssos(raizObj, est) {
  raizObj.position.copy(est.posRaiz);
  raizObj.rotation.copy(est.rotRaiz);
  for (const [o, tr] of est.ossos) {
    o.position.copy(tr.p);
    o.quaternion.copy(tr.q);
  }
  raizObj.updateMatrixWorld(true);
}

function porEmBindPose(raizObj) {
  raizObj.position.set(0, 0, 0);
  raizObj.rotation.set(0, 0, 0);
  raizObj.traverse(o => {
    if (o.isSkinnedMesh && o.skeleton) {
      o.skeleton.pose();
    }
  });
  raizObj.updateMatrixWorld(true);
}

/** Constrói um THREE.AnimationClip nativo calibrado para o esqueleto de `raizAlvo` a partir de um clipe UAL */
async function assarClipeUAL(raizAlvo, nomeClipe, { rootMotion = false } = {}) {
  const fonte = await carregarFonteUAL(rootMotion);
  const entrada = fonte.clipes.get(nomeClipe);
  if (!entrada) throw new Error(`Animação profissional "${nomeClipe}" não encontrada.`);

  const srcScene = entrada.cena;
  const clipSrc = entrada.clip;
  const clipTPose = fonte.g1.animations.find(a => a.name === 'A_TPose');
  const perfil = detectarPerfil(raizAlvo);

  // Salva estado atual do personagem alvo e coloca ambos em bind pose limpa
  const salvoAlvo = capturarEstadoOssos(raizAlvo);
  porEmBindPose(raizAlvo);
  porEmBindPose(srcScene);

  // Aplica quadro 0 da T-Pose na fonte para medir a referência neutra exata da fonte
  const mixerSrc = new THREE.AnimationMixer(srcScene);
  if (clipTPose) {
    const actT = mixerSrc.clipAction(clipTPose);
    actT.reset().play();
    mixerSrc.setTime(0);
    srcScene.updateMatrixWorld(true);
    mixerSrc.stopAllAction();
  }

  const S = n => srcScene.getObjectByName(n);
  const T = n => raizAlvo.getObjectByName(n);
  const wPos = o => o.getWorldPosition(new THREE.Vector3());
  const wQuat = o => o.getWorldQuaternion(new THREE.Quaternion());

  // Comprimento da perna para escalar deslocamentos do quadril sem escorregar nem flutuar!
  const pernaSrc = wPos(S('thigh_l')).distanceTo(wPos(S('calf_l'))) + wPos(S('calf_l')).distanceTo(wPos(S('foot_l')));
  const pernaTgt = wPos(T(perfil.hipL)).distanceTo(wPos(T(perfil.cadeias[10][1]))) +
                   wPos(T(perfil.cadeias[10][1])).distanceTo(wPos(T(perfil.cadeias[11][1])));
  const escPerna = pernaTgt / Math.max(pernaSrc, 1e-4);

  // Referências de bind pose (quadril, peito e cabeça)
  const qPelSrc0 = new THREE.Quaternion().setFromRotationMatrix(
    baseOrtonormal(wPos(S('thigh_l')).sub(wPos(S('thigh_r'))), wPos(S('spine_01')).sub(wPos(S('pelvis'))))
  );
  const qPelTgt0 = wQuat(T(perfil.pelvis));
  const posPelSrc0 = wPos(S('pelvis'));
  const posPelTgt0 = wPos(T(perfil.pelvis));

  const qHeadSrc0 = wQuat(S('Head'));
  const qHeadTgt0 = wQuat(T(perfil.head));

  const qChestSrc0 = new THREE.Quaternion().setFromRotationMatrix(
    baseOrtonormal(wPos(S('clavicle_l')).sub(wPos(S('clavicle_r'))), wPos(S('neck_01')).sub(wPos(S('spine_02'))))
  );
  const qChestTgt0 = wQuat(T(perfil.chest));

  // Direção de repouso da mão no alvo (do pulso na direção em que o antebraço aponta em bind pose)
  const dirMaoRepouso = {};
  for (const [maoT, anteT] of perfil.maos) {
    const bMao = T(maoT), bAnte = T(anteT);
    if (bMao && bAnte) {
      const dirMundo = wPos(bMao).sub(wPos(bAnte)).normalize();
      dirMaoRepouso[maoT] = dirMundo.applyQuaternion(wQuat(bMao).invert()).normalize();
    }
  }

  // Guarda a pose local de repouso do alvo para reiniciar antes de cada quadro amostrado
  const bindAlvo = capturarEstadoOssos(raizAlvo);

  const FPS = 30;
  const dur = Math.max(clipSrc.duration, 1 / FPS);
  const N = Math.max(2, Math.round(dur * FPS) + 1);
  const tempos = new Float32Array(N);
  for (let i = 0; i < N; i++) tempos[i] = Math.min(i / FPS, dur);

  // Lista de todos os ossos do alvo que receberão trilhas de rotação
  const nomesOssosRot = [
    perfil.pelvis,
    ...perfil.cadeias.map(c => c[0]),
    perfil.head,
    ...perfil.maos.map(m => m[0]),
    ...perfil.dedos.map(d => d[0]),
  ].filter((v, idx, arr) => v && arr.indexOf(v) === idx && T(v));

  const trilhaPosPelvis = new Float32Array(N * 3);
  const trilhasQuat = new Map();
  for (const nm of nomesOssosRot) trilhasQuat.set(nm, new Float32Array(N * 4));

  const act = mixerSrc.clipAction(clipSrc);
  act.reset().play();

  const vA = new THREE.Vector3(), vB = new THREE.Vector3();
  const qTmp = new THREE.Quaternion(), qPai = new THREE.Quaternion();

  for (let k = 0; k < N; k++) {
    mixerSrc.setTime(tempos[k]);
    srcScene.updateMatrixWorld(true);
    restaurarEstadoOssos(raizAlvo, bindAlvo);

    // 1) Orientação 3D completa do quadril (pelvis / Quadril)
    const qPelSrc = new THREE.Quaternion().setFromRotationMatrix(
      baseOrtonormal(wPos(S('thigh_l')).sub(wPos(S('thigh_r'))), wPos(S('spine_01')).sub(wPos(S('pelvis'))))
    );
    const qDeltaPel = qPelSrc.multiply(qPelSrc0.clone().invert());
    const bPel = T(perfil.pelvis);
    bPel.parent.getWorldQuaternion(qPai);
    bPel.quaternion.copy(qPai.invert().multiply(qDeltaPel.multiply(qPelTgt0)));
    bPel.updateMatrixWorld(true);

    // Posição escalada do quadril (mantém contato dos pés proporcional à perna do personagem!)
    const dPel = wPos(S('pelvis')).sub(posPelSrc0).multiplyScalar(escPerna);
    if (!rootMotion) { dPel.x = 0; dPel.z = 0; }
    const alvoPelMundo = posPelTgt0.clone().add(dPel);
    const pelLocal = bPel.parent.worldToLocal(alvoPelMundo);
    bPel.position.copy(pelLocal);
    bPel.updateMatrixWorld(true);

    // 2) Coluna, membros e pés (de pai para filho!)
    for (const [ossoT, filhoT, ossoS, filhoS] of perfil.cadeias) {
      const bT = T(ossoT), fT = T(filhoT), bS = S(ossoS), fS = S(filhoS);
      if (!bT || !fT || !bS || !fS) continue;

      if (ossoT === perfil.chest) {
        // Torção completa de 3 eixos no peito (ombros + pescoço)!
        const qChestSrc = new THREE.Quaternion().setFromRotationMatrix(
          baseOrtonormal(wPos(S('clavicle_l')).sub(wPos(S('clavicle_r'))), wPos(S('neck_01')).sub(wPos(S('spine_02'))))
        );
        const qDeltaC = qChestSrc.multiply(qChestSrc0.clone().invert());
        bT.parent.getWorldQuaternion(qPai);
        bT.quaternion.copy(qPai.invert().multiply(qDeltaC.multiply(qChestTgt0)));
        bT.updateMatrixWorld(true);
      } else {
        vA.copy(wPos(fT)).sub(wPos(bT));
        vB.copy(wPos(fS)).sub(wPos(bS));
        girarSegmentoMundo(bT, vA, vB);
      }
    }

    // 3) Cabeça com rotação 3D integral (sim, não, olhar lateral, impacto)
    const bHead = T(perfil.head);
    if (bHead && S('Head')) {
      const qDeltaH = wQuat(S('Head')).multiply(qHeadSrc0.clone().invert());
      bHead.parent.getWorldQuaternion(qPai);
      bHead.quaternion.copy(qPai.invert().multiply(qDeltaH.multiply(qHeadTgt0)));
      bHead.updateMatrixWorld(true);
    }

    // 4) Mãos apontando ao longo da palma real da animação
    for (const [maoT, , maoS, pontaS] of perfil.maos) {
      const bM = T(maoT), sM = S(maoS), sP = S(pontaS);
      if (!bM || !sM || !sP || !dirMaoRepouso[maoT]) continue;
      vA.copy(dirMaoRepouso[maoT]).applyQuaternion(wQuat(bM));
      vB.copy(wPos(sP)).sub(wPos(sM));
      girarSegmentoMundo(bM, vA, vB);
    }

    // 5) Dedos completos nos personagens realistas (punho cerrado no soco/pistola, mão aberta na fala!)
    for (const [dT, dfT, dS, dfS] of perfil.dedos) {
      const bT = T(dT), fT = T(dfT), bS = S(dS), fS = S(dfS);
      if (!bT || !fT || !bS || !fS) continue;
      vA.copy(wPos(fT)).sub(wPos(bT));
      vB.copy(wPos(fS)).sub(wPos(bS));
      girarSegmentoMundo(bT, vA, vB);
    }

    // Grava quadro nas trilhas garantindo continuidade de sinal nos quatérnios (dot >= 0)
    trilhaPosPelvis[k * 3] = bPel.position.x;
    trilhaPosPelvis[k * 3 + 1] = bPel.position.y;
    trilhaPosPelvis[k * 3 + 2] = bPel.position.z;

    for (const nm of nomesOssosRot) {
      const q = T(nm).quaternion;
      const arr = trilhasQuat.get(nm);
      const o = k * 4;
      let sx = q.x, sy = q.y, sz = q.z, sw = q.w;
      if (k > 0 && (arr[o - 4] * sx + arr[o - 3] * sy + arr[o - 2] * sz + arr[o - 1] * sw) < 0) {
        sx = -sx; sy = -sy; sz = -sz; sw = -sw;
      }
      arr[o] = sx; arr[o + 1] = sy; arr[o + 2] = sz; arr[o + 3] = sw;
    }
  }

  mixerSrc.stopAllAction();
  restaurarEstadoOssos(raizAlvo, salvoAlvo);

  const tracks = [
    new THREE.VectorKeyframeTrack(`${perfil.pelvis}.position`, tempos, trilhaPosPelvis),
  ];
  for (const [nm, arr] of trilhasQuat) {
    tracks.push(new THREE.QuaternionKeyframeTrack(`${nm}.quaternion`, tempos, arr));
  }
  return new THREE.AnimationClip(nomeClipe, dur, tracks);
}

/** Constrói um THREE.AnimationClip nativo a partir de uma captura óptica CMU ('cmu:120_09', 'cmu:69_34', etc.) para QUALQUER personagem! */
async function assarClipeCMU(raizAlvo, codCMU, { rootMotion = false } = {}) {
  if (!_cacheCMU.has(codCMU)) {
    _cacheCMU.set(codCMU, fetch(`${BASE_CMU}${codCMU}.json`).then(r => r.json()));
  }
  const d = await _cacheCMU.get(codCMU);
  const J = {};
  d.juntas.forEach((j, i) => { J[j] = i; });
  const Q = d.quadros, fps = d.fps || 30, N = Q.length, dur = (N - 1) / fps;
  const posJ = (k, nome, out = new THREE.Vector3()) => {
    const i = J[nome] * 3;
    return out.set(Q[k][i], Q[k][i + 1], Q[k][i + 2]);
  };

  const perfil = detectarPerfil(raizAlvo);
  const salvoAlvo = capturarEstadoOssos(raizAlvo);
  porEmBindPose(raizAlvo);
  const bindAlvo = capturarEstadoOssos(raizAlvo);

  const T = n => raizAlvo.getObjectByName(n);
  const wPos = o => o.getWorldPosition(new THREE.Vector3());
  const wQuat = o => o.getWorldQuaternion(new THREE.Quaternion());

  const pernaCMU = posJ(0, 'lhipjoint').distanceTo(posJ(0, 'lfemur')) + posJ(0, 'lfemur').distanceTo(posJ(0, 'ltibia'));
  const pernaTgt = wPos(T(perfil.hipL)).distanceTo(wPos(T(perfil.cadeias[10][1]))) +
                   wPos(T(perfil.cadeias[10][1])).distanceTo(wPos(T(perfil.cadeias[11][1])));
  const esc = pernaTgt / Math.max(pernaCMU, 1e-4);

  const bFootTgt = T(perfil.tipo === 'elenco' ? 'PeE' : 'foot_l');
  const altTornozeloTgt = bFootTgt ? wPos(bFootTgt).y : 0.08;
  // Acha o nível do chão na captura CMU pelo ponto mais baixo do tornozelo ('ltibia'/'rtibia') ao longo do clipe!
  let minAnkleCMU = Infinity;
  for (let k = 0; k < N; k++) {
    minAnkleCMU = Math.min(minAnkleCMU, posJ(k, 'ltibia').y, posJ(k, 'rtibia').y);
  }

  // Em bind pose ambos os rigs (elenco e realistas) olham para +Z com quadril alinhado aos eixos do mundo (I)
  const qPelNeutroTgt = wQuat(T(perfil.pelvis));
  // Remove leve inclinação lombar estática de repouso para alinhar com a base ortonormal (hipL-hipR x coluna) da CMU
  const qBaseBindTgt = new THREE.Quaternion().setFromRotationMatrix(
    baseOrtonormal(wPos(T(perfil.hipL)).sub(wPos(T(perfil.hipR))), wPos(T(perfil.spine1)).sub(wPos(T(perfil.pelvis))))
  );
  const qCorrPel = qBaseBindTgt.clone().invert().multiply(qPelNeutroTgt);
  const r0 = posJ(0, 'root');

  const MAPA_CMU = perfil.tipo === 'elenco' ? [
    ['Coluna', 'Coluna2', 'root', 'lowerback'],
    ['Coluna2', 'Peito', 'lowerback', 'upperback'],
    ['Peito', 'Pescoco', 'upperback', 'thorax'],
    ['Pescoco', 'Cabeca', 'thorax', 'upperneck'],
    ['OmbroE', 'BracoE', 'thorax', 'lclavicle'],
    ['BracoE', 'AntebracoE', 'lclavicle', 'lhumerus'],
    ['AntebracoE', 'MaoE', 'lhumerus', 'lradius'],
    ['OmbroD', 'BracoD', 'thorax', 'rclavicle'],
    ['BracoD', 'AntebracoD', 'rclavicle', 'rhumerus'],
    ['AntebracoD', 'MaoD', 'rhumerus', 'rradius'],
    ['CoxaE', 'CanelaE', 'lhipjoint', 'lfemur'],
    ['CanelaE', 'PeE', 'lfemur', 'ltibia'],
    ['PeE', 'PonteiraE', 'ltibia', 'lfoot'],
    ['CoxaD', 'CanelaD', 'rhipjoint', 'rfemur'],
    ['CanelaD', 'PeD', 'rfemur', 'rtibia'],
    ['PeD', 'PonteiraD', 'rtibia', 'rfoot'],
  ] : [
    ['spine_01', 'spine_02', 'root', 'lowerback'],
    ['spine_02', 'spine_03', 'lowerback', 'upperback'],
    ['spine_03', 'neck_01', 'upperback', 'thorax'],
    ['neck_01', perfil.head, 'thorax', 'upperneck'],
    ['clavicle_l', 'upperarm_l', 'thorax', 'lclavicle'],
    ['upperarm_l', 'lowerarm_l', 'lclavicle', 'lhumerus'],
    ['lowerarm_l', 'hand_l', 'lhumerus', 'lradius'],
    ['clavicle_r', 'upperarm_r', 'thorax', 'rclavicle'],
    ['upperarm_r', 'lowerarm_r', 'rclavicle', 'rhumerus'],
    ['lowerarm_r', 'hand_r', 'rhumerus', 'rradius'],
    ['thigh_l', 'calf_l', 'lhipjoint', 'lfemur'],
    ['calf_l', 'foot_l', 'lfemur', 'ltibia'],
    ['foot_l', 'ball_l', 'ltibia', 'lfoot'],
    ['thigh_r', 'calf_r', 'rhipjoint', 'rfemur'],
    ['calf_r', 'foot_r', 'rfemur', 'rtibia'],
    ['foot_r', 'ball_r', 'rtibia', 'rfoot'],
  ];

  const nomesOssosRot = [perfil.pelvis, ...MAPA_CMU.map(m => m[0])].filter(n => T(n));
  const tempos = new Float32Array(N);
  const trilhaPosPelvis = new Float32Array(N * 3);
  const trilhasQuat = new Map();
  for (const nm of nomesOssosRot) trilhasQuat.set(nm, new Float32Array(N * 4));

  const qPai = new THREE.Quaternion(), vA = new THREE.Vector3(), vB = new THREE.Vector3();
  for (let k = 0; k < N; k++) {
    tempos[k] = k / fps;
    restaurarEstadoOssos(raizAlvo, bindAlvo);

    const rk = posJ(k, 'root');
    const P = nome => {
      const p = posJ(k, nome);
      const dx = rootMotion ? (p.x - r0.x) : (p.x - rk.x);
      const dz = rootMotion ? (p.z - r0.z) : (p.z - rk.z);
      return new THREE.Vector3(dx * esc, (p.y - minAnkleCMU) * esc + altTornozeloTgt, dz * esc);
    };

    const qPel = new THREE.Quaternion().setFromRotationMatrix(
      baseOrtonormal(P('lhipjoint').sub(P('rhipjoint')), P('lowerback').sub(P('root')))
    );
    const bPel = T(perfil.pelvis);
    bPel.parent.getWorldQuaternion(qPai);
    bPel.quaternion.copy(qPai.invert().multiply(qPel.multiply(qCorrPel)));
    bPel.updateMatrixWorld(true);

    const pRaiz = P('root');
    bPel.position.copy(bPel.parent.worldToLocal(pRaiz));
    bPel.updateMatrixWorld(true);

    for (const [ossoT, filhoT, deC, paraC] of MAPA_CMU) {
      const bT = T(ossoT), fT = T(filhoT);
      if (!bT || !fT) continue;
      vA.copy(wPos(fT)).sub(wPos(bT));
      vB.copy(P(paraC)).sub(P(deC));
      girarSegmentoMundo(bT, vA, vB);
    }

    trilhaPosPelvis[k * 3] = bPel.position.x;
    trilhaPosPelvis[k * 3 + 1] = bPel.position.y;
    trilhaPosPelvis[k * 3 + 2] = bPel.position.z;

    for (const nm of nomesOssosRot) {
      const q = T(nm).quaternion;
      const arr = trilhasQuat.get(nm);
      const o = k * 4;
      let sx = q.x, sy = q.y, sz = q.z, sw = q.w;
      if (k > 0 && (arr[o - 4] * sx + arr[o - 3] * sy + arr[o - 2] * sz + arr[o - 1] * sw) < 0) {
        sx = -sx; sy = -sy; sz = -sz; sw = -sw;
      }
      arr[o] = sx; arr[o + 1] = sy; arr[o + 2] = sz; arr[o + 3] = sw;
    }
  }

  restaurarEstadoOssos(raizAlvo, salvoAlvo);
  const tracks = [new THREE.VectorKeyframeTrack(`${perfil.pelvis}.position`, tempos, trilhaPosPelvis)];
  for (const [nm, arr] of trilhasQuat) tracks.push(new THREE.QuaternionKeyframeTrack(`${nm}.quaternion`, tempos, arr));
  return new THREE.AnimationClip(`cmu:${codCMU}`, dur, tracks);
}

/** Obtém (com cache por assinatura de proporção do personagem) um THREE.AnimationClip pronto para `atorOuObj` */
export async function obterClipeUniversal(atorOuObj, nomeOuApelido, { rootMotion = false } = {}) {
  const raiz = atorOuObj.obj || atorOuObj.grupo || atorOuObj;
  const resolvido = APELIDOS[nomeOuApelido] || nomeOuApelido;

  // Assinatura única da estrutura/tamanho do personagem (ex.: davi 1.31m vs policial 1.83m vs lucas10)
  if (!raiz.userData.__assinaturaRig) {
    const perfil = detectarPerfil(raiz);
    const bPel = raiz.getObjectByName(perfil.pelvis);
    const yPel = bPel ? bPel.getWorldPosition(new THREE.Vector3()).y.toFixed(3) : '1.000';
    raiz.userData.__assinaturaRig = `${perfil.tipo}_${yPel}`;
  }
  const chaveCache = `${raiz.userData.__assinaturaRig}|${resolvido}|${rootMotion ? 'rm' : 'ip'}`;

  if (!_cacheRetarget.has(chaveCache)) {
    if (resolvido.startsWith('cmu:')) {
      _cacheRetarget.set(chaveCache, assarClipeCMU(raiz, resolvido.slice(4), { rootMotion }));
    } else {
      _cacheRetarget.set(chaveCache, assarClipeUAL(raiz, resolvido, { rootMotion }));
    }
  }
  const clip = await _cacheRetarget.get(chaveCache);
  // Clona com o nome pedido pelo usuário para que `ator.clipes.find(c => c.name === nome)` encontre sempre!
  if (clip.name !== nomeOuApelido) {
    const copia = clip.clone();
    copia.name = nomeOuApelido;
    return copia;
  }
  return clip;
}

/**
 * Equipa QUALQUER personagem do projeto (`Personagem` do elenco, `Corredor`, `LucasReal` ou `THREE.Object3D`)
 * com métodos `.tocar(nome, opc)`, `.pose(nome, t, opc)` e `.atualizar(dt)` compatíveis com todas as 115+ animações!
 */
export async function instalarAnimacoesUniversal(ator, { preCarregar = [] } = {}) {
  await carregarFonteUAL(false);
  const raiz = ator.obj || ator.grupo || ator;

  // Se for LucasReal (que não tinha AnimationMixer nem clipes nativos), adiciona mixer, clipes, tocar, pose e atualizar!
  if (!ator.mixer) {
    ator.mixer = new THREE.AnimationMixer(raiz);
    ator.clipes = ator.clipes || [];
    ator.acao = null;
  }

  const garantirClipe = async (nome, rootMotion = false) => {
    const idClipe = rootMotion ? `${nome}__RM` : nome;
    let c = ator.clipes.find(x => x.name === idClipe);
    if (!c) {
      const base = await obterClipeUniversal(raiz, nome, { rootMotion });
      c = base.name === idClipe ? base : base.clone();
      c.name = idClipe;
      ator.clipes.push(c);
    }
    return c;
  };

  // Pré-assa os clipes pedidos (opcional, útil para uso síncrono imediato no loop)
  for (const nm of preCarregar) await garantirClipe(nm, false);

  const tocarOriginal = ator.tocar ? ator.tocar.bind(ator) : null;
  const poseOriginal = ator.pose ? ator.pose.bind(ator) : null;

  ator.tocar = async function (nome, { fade = 0.25, velocidade = 1, loop = true, rootMotion = false } = {}) {
    // Se já for um clipe embutido nativo do próprio GLB (ex.: 'Parado', 'Assustado' do elenco) e não pedir RM, usa direto!
    if (!rootMotion && ator.clipes.some(c => c.name === nome) && tocarOriginal) {
      return tocarOriginal(nome, { fade, velocidade, loop });
    }
    const clip = await garantirClipe(nome, rootMotion);
    const nova = ator.mixer.clipAction(clip);
    nova.reset();
    nova.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    nova.clampWhenFinished = !loop;
    nova.timeScale = velocidade;
    if (ator.acao && ator.acao !== nova) nova.crossFadeFrom(ator.acao, fade, false);
    nova.play();
    ator.acao = nova;
    ator.ultimo = clip.name;
    return nova;
  };

  ator.pose = async function (nome, t, { rootMotion = false } = {}) {
    if (!rootMotion && ator.clipes.some(c => c.name === nome) && poseOriginal) {
      poseOriginal(nome, t);
      return ator;
    }
    const clip = await garantirClipe(nome, rootMotion);
    ator.mixer.stopAllAction();
    const a = ator.mixer.clipAction(clip);
    a.reset().play();
    ator.mixer.setTime(0);
    ator.mixer.setTime(t);
    ator.acao = a;
    ator.mixer.update(0);
    raiz.updateMatrixWorld(true);
    return ator;
  };

  if (!ator.atualizar) {
    ator.atualizar = dt => {
      ator.mixer.update(dt);
      raiz.updateMatrixWorld(true);
    };
  }

  return ator;
}
