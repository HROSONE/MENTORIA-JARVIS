// Controlador em tempo real do T. rex (GLB da biblioteca3d/animais/trex/trex.glb — CC BY 4.0 Marcel Schanz).
// Olha para +X do próprio grupo, Y para cima, lado esquerdo em -Z.
// Adaptado de videos/trex_corrida/js/trex.js para 60 FPS no Hryz City:
// - Materiais leves (MeshLambertMaterial em Leve/Médio, PBR em Alto) sem clearcoat pesado
// - Sombra de contato radial sob o corpo para manter o T. rex firme no chão mesmo sem shadowMap
// - Reuso de vetores/quaternions temporários no loop de IK/pose
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const clamp = (v, a, b) => (v < a ? a : (v > b ? b : v));
const lerp = (a, b, t) => a + (b - a) * t;

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _d = new THREE.Vector3();
const _p = new THREE.Vector3();
const _e = new THREE.Vector3();
const _t = new THREE.Vector3();
const _pa = new THREE.Vector3();
const _pb = new THREE.Vector3();
const _pc = new THREE.Vector3();
const _bola = new THREE.Vector3();
const _tornozelo = new THREE.Vector3();
const _polo = new THREE.Vector3();
const _origem = new THREE.Vector3();
const _frente = new THREE.Vector3();
const _alvo = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _q3 = new THREE.Quaternion();
const _pw = new THREE.Quaternion();
const _bw = new THREE.Quaternion();
const _idQ = new THREE.Quaternion();

function criarTexSombraTrex() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 4, 32, 32, 30);
  gr.addColorStop(0, 'rgba(0,0,0,0.52)');
  gr.addColorStop(0.55, 'rgba(0,0,0,0.24)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function acabamentoBocaLeve(o) {
  if (o.name === 'lingua') {
    let g = o.geometry.clone();
    g.deleteAttribute('normal');
    if (g.attributes.uv) g.deleteAttribute('uv');
    g = mergeVertices(g, 1e-4);
    g.computeVertexNormals();
    g.computeBoundingBox();
    const y0 = g.boundingBox.min.y;
    g.translate(0, -y0, 0);
    g.scale(1, 0.55, 1);
    g.translate(0, y0, 0);
    g.computeVertexNormals();
    o.geometry = g;
    o.material = new THREE.MeshPhongMaterial({ color: 0x6b1a1d, shininess: 42, specular: 0x442222 });
  } else if (o.name.startsWith('gengiva')) {
    o.material = new THREE.MeshPhongMaterial({ color: 0x3f1013, shininess: 30, specular: 0x331515 });
  } else if (o.name === 'boca_interna') {
    const lado = o.material.side;
    o.material = new THREE.MeshLambertMaterial({ color: 0x1c0508, side: lado });
  }
}

export async function criarTrex({
  url = './videos/biblioteca3d/animais/trex/trex.glb',
  pbr = false,
  sombra = false,
} = {}) {
  const g = await new GLTFLoader().loadAsync(url);
  const grupo = new THREE.Group();
  grupo.name = 'trex';
  grupo.add(g.scene);

  const ossos = {};
  const malhas = [];
  const paresMat = [];

  g.scene.traverse(o => {
    if (o.isBone) ossos[o.name] = o;
    if (o.isMesh) {
      o.castShadow = sombra;
      o.receiveShadow = true;
      o.frustumCulled = false;
      malhas.push(o);
      acabamentoBocaLeve(o);

      const m = o.material;
      if (m && !Array.isArray(m)) {
        if (m.map) {
          m.map.anisotropy = 4;
          if ('roughness' in m) m.roughness = 0.76;
          if ('envMapIntensity' in m) m.envMapIntensity = 0.75;
        }
        if (o.name.startsWith('olho')) {
          const mo = m.clone();
          if ('roughness' in mo) mo.roughness = 0.08;
          if ('metalness' in mo) mo.metalness = 0;
          o.material = mo;
        }
        // Versão Lambert super-leve para modo Leve/Médio mantendo a textura detalhada do T. rex
        if (o.material.isMeshStandardMaterial) {
          const matPbr = o.material;
          const matLeve = new THREE.MeshLambertMaterial({
            color: matPbr.color ? matPbr.color.clone() : 0xffffff,
            map: matPbr.map || null,
            side: matPbr.side,
          });
          paresMat.push({ mesh: o, matPbr, matLeve });
          if (!pbr) o.material = matLeve;
        }
      }
    }
  });

  // Sombra de contato oval sob o T. rex (mantém o dinossauro plantado no chão mesmo sem shadowMap)
  const sombraBlob = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 3.8),
    new THREE.MeshBasicMaterial({
      map: criarTexSombraTrex(),
      transparent: true,
      depthWrite: false,
      opacity: 0.72,
    })
  );
  sombraBlob.rotation.x = -Math.PI / 2;
  sombraBlob.position.set(0.3, 0.09, 0);
  grupo.add(sombraBlob);

  // Correção dos pesos da boca (evita que o lábio superior estique junto com a mandíbula ao rugir)
  g.scene.updateMatrixWorld(true);
  const linhaBoca = x => (x > 4.45 ? 3.30 - 0.22 * (x - 4.45) : 3.30 + 0.05 * (4.45 - x));
  g.scene.traverse(o => {
    if (!o.isSkinnedMesh || o.name !== 'trex') return;
    const nomes = o.skeleton.bones.map(b => b.name);
    const iC = nomes.indexOf('cabeca');
    const iM = nomes.indexOf('mandibula');
    if (iC < 0 || iM < 0) return;
    const P = o.geometry.attributes.position;
    const SI = o.geometry.attributes.skinIndex;
    const SW = o.geometry.attributes.skinWeight;
    const v = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld);
      if (v.x < 3.7) continue;
      const acima = v.y > linhaBoca(v.x) - 0.18;
      const km = acima ? 0 : clamp((v.x - 3.95) / 0.35, 0, 1);
      for (let k = 0; k < 4; k++) {
        SI.setComponent(i, k, k === 0 ? iC : (k === 1 ? iM : 0));
        SW.setComponent(i, k, k === 0 ? 1 - km : (k === 1 ? km : 0));
      }
    }
    SI.needsUpdate = SW.needsUpdate = true;
  });

  const repouso = {};
  for (const k in ossos) repouso[k] = ossos[k].quaternion.clone();
  grupo.updateMatrixWorld(true);
  const posRep = {};
  for (const k in ossos) posRep[k] = ossos[k].getWorldPosition(new THREE.Vector3());
  const raizY0 = ossos.quadril.position.y;
  const qRepInv = {};
  for (const k in ossos) qRepInv[k] = ossos[k].getWorldQuaternion(new THREE.Quaternion()).invert();

  const LmL = posRep.metatarso_l.distanceTo(posRep.dedos_l);
  const LmR = posRep.metatarso_r.distanceTo(posRep.dedos_r);

  function dirOsso(nome, vx, vy, vz, out) {
    ossos[nome].getWorldQuaternion(_q3);
    return out.set(vx, vy, vz).applyQuaternion(qRepInv[nome]).applyQuaternion(_q3);
  }

  function girar(nome, ex, ey, ez, ang) {
    const b = ossos[nome];
    if (!b || !ang) return;
    grupo.updateMatrixWorld(true);
    _a.set(ex, ey, ez).normalize().applyQuaternion(grupo.getWorldQuaternion(_q2));
    _q.setFromAxisAngle(_a, ang);
    b.parent.getWorldQuaternion(_pw);
    b.getWorldQuaternion(_bw);
    b.quaternion.copy(_pw.invert().multiply(_q.multiply(_bw)));
  }

  function apontar(nome, de, para) {
    const b = ossos[nome];
    _a.copy(de).normalize();
    _b.copy(para).normalize();
    _q.setFromUnitVectors(_a, _b);
    b.parent.getWorldQuaternion(_pw);
    b.getWorldQuaternion(_bw);
    b.quaternion.copy(_pw.invert().multiply(_q.multiply(_bw)));
    grupo.updateMatrixWorld(true);
  }

  function ik2(a, b, c, alvo, polo) {
    grupo.updateMatrixWorld(true);
    ossos[a].getWorldPosition(_pa);
    ossos[b].getWorldPosition(_pb);
    ossos[c].getWorldPosition(_pc);
    const l1 = _pa.distanceTo(_pb);
    const l2 = _pb.distanceTo(_pc);
    _d.copy(alvo).sub(_pa);
    const dist = clamp(_d.length(), Math.abs(l1 - l2) + 1e-4, (l1 + l2) * 0.999);
    _d.normalize();
    _p.copy(polo).addScaledVector(_d, -polo.dot(_d)).normalize();
    const ang = Math.acos(clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1));
    _e.copy(_pa).addScaledVector(_d, Math.cos(ang) * l1).addScaledVector(_p, Math.sin(ang) * l1);
    _t.copy(_pa).addScaledVector(_d, dist);
    apontar(a, _c.copy(_pb).sub(_pa), _e.sub(_pa));
    ossos[b].getWorldPosition(_pb);
    ossos[c].getWorldPosition(_pc);
    apontar(b, _c.copy(_pc).sub(_pb), _t.sub(_pb));
  }

  function posar({
    dist = 0,
    vel = 0,
    olhar = null,
    rugido = 0,
    mordida = 0,
    mastigar = 0,
    parado = 0,
    t = 0,
    inclina = 0,
    abaixa = 0,
    bocaK = 0.72,
  } = {}) {
    for (const k in ossos) ossos[k].quaternion.copy(repouso[k]);
    ossos.quadril.position.y = raizY0;

    const ciclo = 2.8 + 0.42 * vel;
    const fase = dist / ciclo;
    const beta = clamp(0.62 - 0.03 * vel, 0.5, 0.65);
    const anda = (1 - parado) * clamp(vel / 1.2, 0, 1);

    const bob = anda * (0.07 + 0.012 * vel) * Math.cos(4 * Math.PI * fase);
    const lat = anda * 0.05 * Math.sin(2 * Math.PI * fase);
    ossos.quadril.position.y += bob - abaixa;

    girar('quadril', 0, 0, 1, -0.04 * anda * Math.min(vel, 6) / 6 - 0.03 * mordida - inclina);
    girar('quadril', 1, 0, 0, lat * 0.6);
    girar('quadril', 0, 1, 0, 0.05 * anda * Math.sin(2 * Math.PI * fase));
    girar('coluna1', 0, 1, 0, -0.03 * anda * Math.sin(2 * Math.PI * fase));
    girar('peito', 0, 0, 1, 0.012 * Math.sin(t * 1.6));

    // Cauda contrabalançando em onda
    for (let k = 1; k <= 8; k++) {
      girar('cauda' + k, 0, 1, 0, -(0.045 + 0.01 * k) * (anda + 0.25) * Math.sin(2 * Math.PI * fase - k * 0.45 + t * 0.7 * (1 - anda)));
      girar('cauda' + k, 0, 0, 1, (0.015 + 0.03 * rugido) * Math.sin(4 * Math.PI * fase - k * 0.5) * anda + 0.012 * rugido);
    }

    // Pernas com cinemática inversa (pés firmes no apoio e arco no balanço)
    grupo.updateMatrixWorld(true);
    grupo.localToWorld(_origem.set(0, 0, 0));
    grupo.localToWorld(_polo.set(1, 0.1, 0)).sub(_origem);

    for (let side = 0; side < 2; side++) {
      const l = side === 0 ? 'l' : 'r';
      const desloc = side === 0 ? 0 : 0.5;
      const Lm = side === 0 ? LmL : LmR;
      const repD = posRep['dedos_' + l];
      const ph = ((fase + desloc) % 1 + 1) % 1;
      let x, y;
      if (ph < beta) {
        const u = ph / beta;
        x = lerp(0.5, -0.5, u);
        y = 0;
      } else {
        const u = (ph - beta) / (1 - beta);
        x = lerp(-0.5, 0.5, 0.5 - 0.5 * Math.cos(Math.PI * u));
        y = Math.sin(Math.PI * u) * (0.35 + 0.05 * vel);
      }
      x *= ciclo * beta * anda;
      y *= anda;

      _bola.set(repD.x + x, repD.y + y, repD.z);
      const levanta = ph < beta ? clamp((ph / beta - 0.7) / 0.3, 0, 1) : Math.sin(Math.PI * (ph - beta) / (1 - beta));
      const angM = lerp(0.60, 0.95, levanta * anda);
      _tornozelo.set(_bola.x - Math.cos(angM) * Lm, _bola.y + Math.sin(angM) * Lm, _bola.z);

      grupo.localToWorld(_tornozelo);
      ik2('coxa_' + l, 'canela_' + l, 'metatarso_' + l, _tornozelo, _polo);

      grupo.localToWorld(_bola);
      ossos['metatarso_' + l].getWorldPosition(_pa);
      ossos['dedos_' + l].getWorldPosition(_pb);
      apontar('metatarso_' + l, _c.copy(_pb).sub(_pa), _d.copy(_bola).sub(_pa));

      ossos['dedos_' + l].getWorldPosition(_pb);
      dirOsso('dedos_' + l, 1, -0.2, 0, _frente);
      _t.set(repD.x + x + 0.66, repD.y + y - 0.15 - y * 0.3, repD.z);
      grupo.localToWorld(_t);
      apontar('dedos_' + l, _frente, _t.sub(_pb));
    }

    // Braços curtos
    for (let side = 0; side < 2; side++) {
      const l = side === 0 ? 'l' : 'r';
      girar('braco_' + l, 0, 0, 1, 0.12 * anda * Math.sin(2 * Math.PI * fase + (side === 0 ? 0 : Math.PI)) - 0.2 * rugido);
      girar('antebraco_' + l, 0, 0, 1, -0.25 - 0.2 * rugido);
    }

    // Pescoço e cabeça
    girar('pescoco1', 0, 0, 1, -bob * 0.6 + 0.10 * rugido - 0.10 * mordida);
    girar('pescoco2', 0, 0, 1, 0.06 * rugido - 0.18 * mordida + 0.10 * mastigar);

    if (olhar) {
      grupo.updateMatrixWorld(true);
      ossos.cabeca.getWorldPosition(_pa);
      dirOsso('cabeca', 1, -0.1, 0, _frente).normalize();
      _alvo.copy(olhar).sub(_pa).normalize();
      // Só gira se o alvo não estiver completamente às costas
      if (_frente.dot(_alvo) > -0.35) {
        _q.setFromUnitVectors(_frente, _alvo);
        _q2.copy(_idQ).slerp(_q, 0.5);
        const b = ossos.pescoco2;
        b.parent.getWorldQuaternion(_pw);
        b.getWorldQuaternion(_bw);
        b.quaternion.copy(_pw.invert().multiply(_q2.multiply(_bw)));

        grupo.updateMatrixWorld(true);
        ossos.cabeca.getWorldPosition(_pa);
        dirOsso('cabeca', 1, -0.1, 0, _frente).normalize();
        _alvo.copy(olhar).sub(_pa).normalize();
        _q.setFromUnitVectors(_frente, _alvo);
        _q2.copy(_idQ).slerp(_q, 0.85);
        const c = ossos.cabeca;
        c.parent.getWorldQuaternion(_pw);
        c.getWorldQuaternion(_bw);
        c.quaternion.copy(_pw.invert().multiply(_q2.multiply(_bw)));
      }
    }

    const treme = rugido * (0.02 * Math.sin(t * 47) + 0.015 * Math.sin(t * 31));
    girar('cabeca', 0, 0, 1, 0.14 * rugido + treme - 0.12 * mordida + 0.08 * mastigar);
    girar('cabeca', 1, 0, 0, treme * 0.6);

    const boteAbre = mordida < 0.75 ? clamp(mordida / 0.4, 0, 1) : clamp(1 - (mordida - 0.75) / 0.12, 0, 1);
    const abre = Math.max(
      0.78 * rugido * (0.85 + 0.15 * Math.sin(t * 9)),
      0.85 * boteAbre,
      mastigar * (0.08 + 0.10 * Math.max(0, Math.sin(t * 9)))
    );
    girar('mandibula', 0, 0, 1, -abre * bocaK);
    grupo.updateMatrixWorld(true);
  }

  function definirQualidade({ pbr: usarPbr, sombra: usarSombra }) {
    for (let i = 0; i < paresMat.length; i++) {
      const it = paresMat[i];
      it.mesh.material = usarPbr ? it.matPbr : it.matLeve;
    }
    for (let i = 0; i < malhas.length; i++) {
      malhas[i].castShadow = !!usarSombra;
    }
    sombraBlob.visible = !usarSombra;
  }

  return { grupo, ossos, malhas, posar, definirQualidade };
}
