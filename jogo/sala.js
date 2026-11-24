// Sala de entrada do Hryz City: o jogador escolhe personagem, veículo e local antes de começar.
// O fundo é o próprio mundo 3D: a câmera gira em volta do personagem escolhido, ao lado do carro escolhido,
// no lugar escolhido. Só a interface (abas, cartões e botão Jogar) mora aqui.

const ABAS = [
  { id: 'pers', rotulo: 'Personagem', icone: '🧍' },
  { id: 'veic', rotulo: 'Veículo', icone: '🚗' },
  { id: 'local', rotulo: 'Local', icone: '📍' },
];

export class Sala {
  /**
   * opcoes: { pers: [{ id, nome, desc, img, icone }], veic: [...], local: [...] }
   * escolha: { pers, veic, local } (ids); ganchos: { aoMudar(escolha, campo), aoJogar(escolha), aoRever() }
   */
  constructor(opcoes, escolha, ganchos) {
    this.op = opcoes; this.escolha = { ...escolha }; this.g = ganchos; this.aba = 'pers';
    this.el = document.getElementById('sala');
    this.elAbas = document.getElementById('sala-abas');
    this.elGrade = document.getElementById('sala-grade');
    this.elResumo = document.getElementById('sala-resumo');
    this.elJogar = document.getElementById('sala-jogar');
    this.elAbas.innerHTML = ABAS.map(a => `<button data-aba="${a.id}"><span>${a.icone}</span> ${a.rotulo}</button>`).join('');
    this.elAbas.addEventListener('click', e => { const b = e.target.closest('button[data-aba]'); if (b) this.mostrarAba(b.dataset.aba); });
    this.elGrade.addEventListener('click', e => {
      const c = e.target.closest('.sala-cartao'); if (!c) return;
      this.escolher(this.aba, c.dataset.id);
    });
    this.elJogar.addEventListener('click', () => this.g.aoJogar?.({ ...this.escolha }));
    document.getElementById('sala-rever').addEventListener('click', () => this.g.aoRever?.());
    this._tecla = e => {
      if (!this.aberta) return;
      if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); e.stopImmediatePropagation(); this.elJogar.click(); }
      else if (e.code === 'Tab') { e.preventDefault(); e.stopImmediatePropagation(); const i = ABAS.findIndex(a => a.id === this.aba); this.mostrarAba(ABAS[(i + (e.shiftKey ? 2 : 1)) % 3].id); }
      else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(e.code)) {
        e.preventDefault(); e.stopImmediatePropagation();
        const lista = this.op[this.aba], i = lista.findIndex(o => o.id === this.escolha[this.aba]);
        const passo = ['ArrowLeft', 'ArrowUp', 'KeyA', 'KeyW'].includes(e.code) ? -1 : 1;
        this.escolher(this.aba, lista[(i + passo + lista.length) % lista.length].id);
      } else e.stopImmediatePropagation();   // nenhuma outra tecla do jogo vale na sala
    };
    this.aberta = false;
  }

  abrir() {
    this.aberta = true;
    this.el.classList.remove('oculto');
    document.body.classList.add('em-cine');
    addEventListener('keydown', this._tecla, true);
    this.mostrarAba(this.aba);
    this._resumo();
  }

  fechar() {
    this.aberta = false;
    this.el.classList.add('oculto');
    document.body.classList.remove('em-cine');
    removeEventListener('keydown', this._tecla, true);
  }

  mostrarAba(id) {
    this.aba = id;
    for (const b of this.elAbas.children) b.classList.toggle('ativa', b.dataset.aba === id);
    const atual = this.escolha[id];
    this.elGrade.innerHTML = this.op[id].map(o => `
      <button class="sala-cartao${o.id === atual ? ' ativo' : ''}" data-id="${o.id}">
        <div class="sala-img">${o.img ? `<img src="${o.img}" alt="" loading="lazy" onerror="this.remove()">` : ''}<span class="sala-icone">${o.icone || ''}</span></div>
        <div class="sala-nome">${o.nome}</div>
        ${o.desc ? `<div class="sala-desc">${o.desc}</div>` : ''}
      </button>`).join('');
    this.elGrade.querySelector('.ativo')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  escolher(campo, id) {
    if (this.escolha[campo] === id) return;
    this.escolha[campo] = id;
    for (const c of this.elGrade.children) c.classList.toggle('ativo', c.dataset.id === id);
    this.elGrade.querySelector('.ativo')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    this._resumo();
    this.g.aoMudar?.({ ...this.escolha }, campo);
  }

  _resumo() {
    const nome = (c) => this.op[c].find(o => o.id === this.escolha[c])?.nome ?? '';
    this.elResumo.innerHTML = `<b>${nome('pers')}</b> · ${nome('veic')} · <span>${nome('local')}</span>`;
  }

  ocupado(sim) { this.elJogar.disabled = !!sim; this.elJogar.textContent = sim ? 'Carregando…' : 'JOGAR ▶'; }
}
