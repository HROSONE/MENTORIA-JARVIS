// TERRENO CAVÁVEL do canteiro: uma malha de alturas (0,5 m) por cima do chão de terra. As caçambas das máquinas cavam
// (tiram volume e abrem buraco com borda suave), carregam a terra e despejam (montes com o ângulo de repouso da terra solta ~35°).
// altura(x, z) devolve a altura do chão ali (ou null fora do canteiro) para o jogador e as máquinas andarem por cima e por dentro.
import * as THREE from 'three';

export class TerrenoCavavel {
  /** area: { x0, x1, z0, z1 } · passo em metros · material (com a textura da terra) */
  constructor(scene, area, material, passo = 0.5) {
    this.a = area; this.p = passo;
    this.nx = Math.round((area.x1 - area.x0) / passo) + 1; this.nz = Math.round((area.z1 - area.z0) / passo) + 1;
    this.h = new Float32Array(this.nx * this.nz);                     // altura acima do chão (0 = chão original)
    const g = new THREE.PlaneGeometry(area.x1 - area.x0, area.z1 - area.z0, this.nx - 1, this.nz - 1);
    g.rotateX(-Math.PI / 2); g.translate((area.x0 + area.x1) / 2, 0.03, (area.z0 + area.z1) / 2);
    this.geo = g; this.pos = g.attributes.position;
    // a PlaneGeometry gira com as linhas de -z para +z? Confere qual vértice é qual (x, z) para mapear a grade
    this.idx = new Int32Array(this.nx * this.nz);
    for (let v = 0; v < this.pos.count; v++) {
      const i = Math.round((this.pos.getX(v) - area.x0) / passo), j = Math.round((this.pos.getZ(v) - area.z0) / passo);
      this.idx[j * this.nx + i] = v;
    }
    this.malha = new THREE.Mesh(g, material); this.malha.receiveShadow = true; this.malha.name = 'terrenoCavavel';
    scene.add(this.malha);
    this.sujo = false; this.tSujo = 0;
    this.yBase = 0.03;
  }

  dentro(x, z) { const a = this.a; return x > a.x0 && x < a.x1 && z > a.z0 && z < a.z1; }

  /** altura do chão (y no mundo) com interpolação bilinear; null fora da área */
  altura(x, z) {
    if (!this.dentro(x, z)) return null;
    const fx = (x - this.a.x0) / this.p, fz = (z - this.a.z0) / this.p, i = Math.min(this.nx - 2, Math.floor(fx)), j = Math.min(this.nz - 2, Math.floor(fz)), u = fx - i, w = fz - j;
    const H = (a, b) => this.h[b * this.nx + a];
    return this.yBase + (H(i, j) * (1 - u) + H(i + 1, j) * u) * (1 - w) + (H(i, j + 1) * (1 - u) + H(i + 1, j + 1) * u) * w;
  }

  /** tira até `vol` m³ num círculo de raio r em volta de (x, z), sem passar de prof m abaixo do chão; devolve o volume tirado */
  cavar(x, z, r, vol, prof = 3.5) {
    if (!this.dentro(x, z)) return 0;
    const cel = this.p * this.p, pesos = [];
    let soma = 0;
    this.#vizinhos(x, z, r, (k, d) => { const w = Math.cos(Math.min(1, d / r) * Math.PI / 2) ** 2; pesos.push([k, w]); soma += w; });
    if (!soma) return 0;
    let tirado = 0;
    for (const [k, w] of pesos) {
      const quer = vol * w / soma / cel, pode = Math.max(0, this.h[k] + prof), dh = Math.min(quer, pode);
      this.h[k] -= dh; tirado += dh * cel;
    }
    this.sujo = true; return tirado;
  }

  /** despeja `vol` m³ em (x, z) formando um monte que escorrega até o ângulo de repouso */
  depositar(x, z, vol, r = 1.2) {
    if (!this.dentro(x, z)) return false;
    const cel = this.p * this.p, pesos = [];
    let soma = 0;
    this.#vizinhos(x, z, r, (k, d) => { const w = 1 - d / r; pesos.push([k, w]); soma += w; });
    for (const [k, w] of pesos) this.h[k] += vol * w / soma / cel;
    this.#acomodar(x, z, r + 3);
    this.sujo = true; return true;
  }

  #vizinhos(x, z, r, f) {
    const i0 = Math.max(0, Math.floor((x - r - this.a.x0) / this.p)), i1 = Math.min(this.nx - 1, Math.ceil((x + r - this.a.x0) / this.p));
    const j0 = Math.max(0, Math.floor((z - r - this.a.z0) / this.p)), j1 = Math.min(this.nz - 1, Math.ceil((z + r - this.a.z0) / this.p));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const d = Math.hypot(this.a.x0 + i * this.p - x, this.a.z0 + j * this.p - z);
      if (d <= r) f(j * this.nx + i, d);
    }
  }

  // terra solta escorrega: nenhum degrau maior que tan(35°) · passo entre vizinhos (algumas passadas locais)
  #acomodar(x, z, r) {
    const lim = Math.tan(35 * Math.PI / 180) * this.p;
    const i0 = Math.max(1, Math.floor((x - r - this.a.x0) / this.p)), i1 = Math.min(this.nx - 2, Math.ceil((x + r - this.a.x0) / this.p));
    const j0 = Math.max(1, Math.floor((z - r - this.a.z0) / this.p)), j1 = Math.min(this.nz - 2, Math.ceil((z + r - this.a.z0) / this.p));
    for (let it = 0; it < 6; it++) for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const k = j * this.nx + i;
      for (const n of [k + 1, k - 1, k + this.nx, k - this.nx]) {
        const d = this.h[k] - this.h[n];
        if (d > lim) { const m = (d - lim) * 0.25; this.h[k] -= m; this.h[n] += m; }
      }
    }
  }

  /** aplica as alturas na malha (no máximo ~12 vezes por segundo) */
  atualizar(dt) {
    this.tSujo += dt;
    if (!this.sujo || this.tSujo < 0.08) return;
    this.tSujo = 0; this.sujo = false;
    for (let k = 0; k < this.h.length; k++) this.pos.setY(this.idx[k], this.yBase + this.h[k]);
    this.pos.needsUpdate = true; this.geo.computeVertexNormals(); this.geo.computeBoundingSphere();
  }
}
