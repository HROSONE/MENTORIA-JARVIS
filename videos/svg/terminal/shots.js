/* shots.js — lista de planos do storyboard (a mesma para 2D e 3D) */
(function (G) {
  G.SHOTS = [
    { n: 1, t: '0,0–3,5', cam: 'push-in frontal', acao: 'QUADRO 0: ele no banco vermelho no meio de uma montanha de caixas. Painel: 18 ANOS.', fala: '"Esse homem morou 18 anos dentro de um aeroporto."', som: 'ambiente do terminal, flap do painel' },
    { n: 2, t: '3,5–6,5', cam: 'close (fim do push-in)', acao: 'Traga o cachimbo dourado e solta a fumaça.', fala: '"E ele podia ter ido embora."', som: 'tragada, sopro' },
    { n: 3, t: '6,5–9', cam: 'travelling lateral (sépia)', acao: '1988, estação de Paris: põe a maleta no chão e olha o relógio.', fala: '"Em 1988, ele disse que roubaram…"', som: 'trem, relógio' },
    { n: 4, t: '9–11', cam: 'mesmo plano', acao: 'Olha de volta: a maleta sumiu. Mãos na cabeça.', fala: '"…a maleta com os documentos dele."', som: '"puf" seco' },
    { n: 5, t: '11–13,5', cam: 'a câmera corre para a direita', acao: 'Londres, imigração: o agente estende a mão pedindo o passaporte. Ele mostra as mãos vazias.', fala: '"Sem passaporte…"', som: 'carimbo batendo na mesa' },
    { n: 6, t: '13,5–16', cam: 'mesmo plano', acao: 'O agente aponta para trás.', fala: '"…Londres mandou ele de volta pra Paris."', som: 'apito curto' },
    { n: 7, t: '16–18', cam: 'avião passa (panorâmica)', acao: 'O avião "Hryz Animation" volta para Paris.', fala: '"Na França, sem documento…"', som: 'turbina passando' },
    { n: 8, t: '18–20', cam: 'plano aberto, Terminal 1', acao: 'Ele entra no terminal; os tubos de escada rolante cruzam o vão.', fala: '"…ele não podia entrar no país…"', som: 'aviso "ding-dong", passos' },
    { n: 9, t: '20–23', cam: 'dolly-in', acao: 'Vê o banco vermelho e senta. Painel: 1988.', fala: '"…então ele sentou num banco vermelho."', som: 'rangido do plástico, flap' },
    { n: 10, t: '23–26', cam: 'órbita lenta (plano longo)', acao: 'Funcionário entrega uma toalha. Painel: 1991. Primeiras caixas.', fala: '"Tomava banho no banheiro dos funcionários."', som: 'flap, porta' },
    { n: 11, t: '26–29', cam: 'órbita continua', acao: 'Um estranho entrega um saco de lanche; ele come. Painel: 1994.', fala: '"Comia lanche que estranhos pagavam."', som: 'saco de papel, mordida' },
    { n: 12, t: '29–34', cam: 'órbita continua', acao: 'Ele escreve no diário; um funcionário faz reverência. Painel: 1997. A pilha cresce.', fala: '"Escrevia diário… e o pessoal chamava ele de Lorde Alfred."', som: 'caneta, flap' },
    { n: 13, t: '34–38', cam: 'perfil, dolly', acao: '1999: o funcionário do governo estende o documento carimbado.', fala: '"Em 1999, a França finalmente deu os papéis pra ele sair."', som: 'carimbo forte' },
    { n: 14, t: '38–41', cam: 'mesmo plano, punch-in', acao: 'Ele devolve o papel e cruza os braços.', fala: '"Ele recusou."', som: 'papel, "hmpf"' },
    { n: 15, t: '41–46', cam: 'inserto: close no papel', acao: 'NOME: Mehran Karimi Nasseri, iraniano. A caneta risca e escreve "Sir, Alfred Mehran", com a vírgula enorme.', fala: '"Porque o papel não tinha o nome que ele escolheu: Sir, Alfred Mehran. Com vírgula e tudo."', som: 'caneta riscando' },
    { n: 16, t: '46–50', cam: 'frontal, push-in', acao: 'Um produtor de óculos escuros entrega um cheque de US$ 250.000. O cartaz do filme está na mala. Painel: 2004.', fala: '"Dizem que Hollywood pagou 250 mil dólares pela história dele…"', som: 'papel, caixa registradora' },
    { n: 17, t: '50–57', cam: 'recuo lento', acao: 'Painel: 2006. Um funcionário empurra a cadeira de rodas até a saída; o banco fica vazio.', fala: '"…e ele continuou no banco. Só saiu em 2006, quando ficou doente."', som: 'rodinhas, flap' },
    { n: 18, t: '57–61', cam: 'recuo até o quadro 0', acao: 'Painel: 2022. Ele volta com a mala e senta de novo; a imagem fecha igual ao começo.', fala: '"E em 2022… ele voltou pro aeroporto. Se inscreve — e confere teu passaporte antes de viajar."', som: 'flap, rangido do banco' },
  ];
})(typeof window !== 'undefined' ? window : globalThis);
