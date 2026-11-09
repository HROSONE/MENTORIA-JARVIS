# Diretrizes do canal Hryz Animation

Regras de estrutura, visual e produção tiradas do que deu certo e errado nos vídeos.
Complementa o `ESTILO.md`. Ler antes de começar qualquer vídeo novo.

## 1. Números que guiam as regras

| Vídeo | Resultado | Lição |
|---|---|---|
| Xadrez (café e peça) | 39 mil | close de objeto, mistério, sem texto explicativo |
| Alcatraz "OLHANDO." | 27 mil | personagem fixo, tensão visível, uma palavra que faz pergunta |
| Pegada "38-42" | 17 mil | um objeto + um número sem explicação |
| Mike, a galinha sem cabeça | bom | absurdo no quadro 0 + contador diegético |
| Zeptoverso | gostaram | — |
| Polvo, dentadura, mosca | os melhores da fase 3D | criatura em close no primeiro segundo |
| Gêmeos | 45% ignorado, 2,7 mil | o título entregou a surpresa |
| Elefantes | CTR 10× menor; saíram na parte da matriarca | virou aula/documentário lento |
| Alcatraz v1 e v2 | "não entendi nada", "objeto sem forma", "efeito sem som" | cenas confusas, sem uma ação clara |
| Bananeira até a Ferrari | ~60% arrastaram; quem ficou viu 23 de 27 s | o meio prende; a abertura calma e escura perdeu gente |
| Cavalo de madeira | 2,1 mil | capa escura e confusa |
| Avião (Lotito) v1 | o dono não gostou | personagem distante e parado, cortes demais |
| Avião (Lotito, pica) v3 | foi bem | coisa absurda que uma pessoa FAZ com o corpo, repetida e escalando (come vidro → bicicleta → avião) |
| Onoda (29 anos na guerra) | foi mal | conto histórico dramático, guerra, datas, tristeza: não viraliza |

## 2. Que tipo de história escolher

- **Sim:** absurdo real e quase inacreditável, de preferência algo que uma pessoa faz com o próprio corpo ou um feito bizarro, com uma ação visual que se repete e vai escalando. Reação esperada: "não acredito", "que nojo", "que maluco". Tom de comédia.
- **Não:** conto histórico dramático (guerra, tragédia, datas, política), narrativa triste ou que precisa de muito contexto. Mesmo bem feito, não viraliza no canal.

## 2b. Estrutura do vídeo (Shorts)

1. **Quadro 0 = a imagem mais absurda do vídeo** (o momento-recompensa), clara, colorida e com o assunto grande no centro. Nada de abrir por cima do ombro, no escuro ou com frase de contexto.
2. **Primeira fala em até 0,3 s** e fazendo uma pergunta ("Esse homem disse que comeu um avião inteiro").
3. **História, não aula**: Premissa, Previsão, Tragédia, Concerto. Um personagem recorrente; causa e efeito visíveis.
4. **Uma ação clara por cena.** Quem olha sem som tem que entender a história.
5. **Contador ou placar diegético** quando a história tem progresso (anos, raios, % comido, população).
6. **A resposta só no fim**, e o último plano volta para a imagem do começo, para incentivar a repetição.
7. **Duração**: 40–65 s. Cortar o que é explicação sem imagem.
8. Fechar com "Se inscreve" ligado à história ("…mas de longe", "não tenta em casa").

## 3. Visual

- **Câmera sempre em movimento**: tremor leve, punch-in nas batidas, dolly, panorâmica.
- **Poucos cortes, planos contínuos**: preferir 3–5 planos longos em que a câmera se aproxima, recua e passeia, em vez de muitos cortes curtos.
- **Mostrar a mudança, não narrar**: quando a história lista coisas (o que ele comeu, lugares, anos), cada item precisa de uma ação visível própria (alguém traz, apresenta, serve). Mesmo enquadramento com o personagem parado faz o público não perceber que o objeto mudou.
- **Perto do personagem**: quando a história é o que ele faz (comer, reagir), mostrar de perto, de frente, com expressão (mastigando, piscando, careta). Personagem distante e parado não prende.
- **Personagens**: o dono prefere a **silhueta escura sem rosto**, como no vídeo do xadrez: corpo inteiro numa cor sólida (protagonista azul-marinho quase preto, coadjuvante laranja-terroso) com uma borda de luz quente. No `man()`: `faceless: 1` + `sil: '<cor>'` (filtro `sil_<tipo>`); objetos segurados continuam coloridos e legíveis. O estilo "boneco" com rosto não chamou atenção no canal.
- **Proibido deformar**: nada de membros afinando demais, corpos esticados, cabeça flutuando, pescoço comprido, mãos minúsculas. Proporção natural. (As tentativas de "corpo triângulo" e corpos anime longos foram rejeitadas.)
- **Tamanho dos objetos** coerente com o personagem: um casaco na mão tem o tamanho de um casaco. Objetos segurados pela mão (`held`) já estão na escala do boneco; não encolher de novo.
- **Texto nunca espelhado**: quando o boneco está virado (`flip: -1`), desvirar o que ele segura que tem texto.
- **Marca "Hryz Animation"** aparece em todo vídeo de forma diegética (placa, carro, cartaz, letreiro), nunca espelhada em reflexo nem duplicada por dentro e por fora.
- Sem logotipo de marca real (usar a marca do canal no lugar).
- **Lógica física**: se a chuva parou, não pode chover; água de 30 cm não cobre a calçada; reflexo só dentro da água.
- **Cena clara no começo**; cenas escuras só no meio da história e com o assunto bem iluminado.
- Objetos com forma reconhecível (o espectador tem que saber o que é sem explicação).

## 4. Som

- **Sem música.** Só efeitos sonoros reais de bibliotecas livres: BigSoundBank (licença livre) e Kenney (CC0), mais síntese em Python.
- **Todo movimento importante tem som** (golpe, passo, respingo, porta, motor, mordida).
- Ambiente coerente com a cena (sem chuva se não chove).

## 5. Texto e narração

- **Sem legendas.** Só texto diegético curto (placa, contador, etiqueta "2 m", "30 cm").
- O dono do canal narra: entregar sempre o **roteiro com tempos** (`roteiro_*.md`) e a tabela "tempo · o que aparece · fala".
- Quando o usuário manda o roteiro, **não mudar nenhuma palavra**; só animar.

## 6. Fatos e segurança

- Checar fatos com fonte e citar no roteiro. **Nunca apresentar ficção como fato.**
- Quando a fonte é fraca ou contestada, a narração diz isso ("ele disse que…", "ninguém nunca provou").
- Não mostrar método que funcione para crime (ex.: abrir carro sem chave): a técnica falha e nada ensina.
- Assunto que pode ser imitado e é perigoso: avisar "não tenta isso em casa".

## 7. Formato e entrega

- Shorts: 1080×1920, 30 fps. Longos: 1920×1080.
- **Arquivo até ~20 MB** (MP4 de 70 MB não baixou no celular): H.264 ~2–3,5 Mbps + AAC 128–160 kbps.
- **Revisar quadro por quadro** (folha de contato) antes de entregar: proporção, enquadramento, nada cortado, nada espelhado, nada flutuando.
- Commit dos arquivos de projeto em `videos/svg/<nome>/` (sem MP4).
- Trabalhar sem pedir "continua": terminar o pedido inteiro.

## 8. Assets prontos primeiro

- Antes de modelar qualquer coisa, procurar asset pronto **CC0** (OpenGameArt filtrando CC0; Kenney; Quaternius). Só criar em código o que não existir.
- Tudo o que for baixado vai para `videos/biblioteca3d/` com a licença e a fonte no README, para reutilizar nos próximos vídeos.
- Em 3D: abertura em até 3 s mostrando tudo de uma vez, câmera sempre em movimento e uma volta de 360° de vez em quando.

## 9. Pipeline técnico (resumo)

- Página SVG por vídeo: `_head.html` + `_shared.js` + `_helpers.js` + `_man.js` + `_objs.js` + `_scenes.js` + `_render.js`, montada por `build.py`.
- Linha do tempo em `narr.json` (`k`, `txt`, `t0`, `t1`, `a`, `b`); cada cena é uma função `sN(t)`.
- Render: `PAGE=… FR=… VW=… VH=… node render_svg.js <worker> 4 30` (4 processos, um por worker).
- Som: `sfx_<nome>.py` (numpy + BigSoundBank em `sons/bsb` + Kenney) com limitador tanh.
- Stills: `shotf.js`; folhas: `sheet.py` (vertical) e `sheet169b.py` (16:9).
