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
| Cadeira voadora em 3D (Three.js) | fracasso | boneco low poly sem vida, flutuando em vez de sentado, física estranha, muita coisa parada |
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
- **Lição do "Mestres da Gravidade" (15/11, o dono reprovou o som):** o vento sintetizado (ruído filtrado contínuo) e a trilha que o dono pediu e eu sintetizei (pizzicato e violoncelo) irritaram e estragaram o vídeo. Regras novas:
  - **Nada de cama de ruído contínuo sintetizada** (vento, chiado, "ambiente"). Ambiente só de gravação real de biblioteca livre, bem baixo e com agudos cortados, ou nenhum: silêncio limpo é melhor que ruído chato.
  - **Síntese só para impactos curtos** (estalo, batida, pedrinha, mordida), um por ação visível, com volume contido. Sem zumbido, drone ou tom sustentado.
  - **Música:** mesmo quando o dono pede, não entregar trilha sintetizada às cegas. Preferir faixa livre de biblioteca, bem baixa, ou avisar que não consigo ouvir e mandar primeiro um teste de áudio de 5 a 10 s para aprovação.
- **Lição do "Ele podia voar" (16/11, o dono achou o som simples):** um arquivo por ação, colado no quadro, com volume fixo, soa "efeito de biblioteca". Regras para o próximo, todas prontas em `biblioteca3d/sons/mesa.py`:
  - **Camadas em todo evento importante:** transiente (estalo, 0–30 ms) + corpo (estrondo, motor, impacto) + cauda (detritos, eco, vidro caindo) + reforço grave curto. Explosão, queda, batida e poder nunca saem de um arquivo só (`Mesa.evento`).
  - **Espaço e perspectiva:** cada ambiente tem sua reverberação (`espaco='quarto'|'carro'|'sala'|'rua'|'vale'|'corredor'`); dentro do carro ou de outro cômodo o som fica abafado (`lp`); de longe fica fino e com mais eco (`hp` + espaço).
  - **O som se move com a imagem:** o que atravessa o quadro atravessa o estéreo, com Doppler (`passagem`); quem está à esquerda soa à esquerda (`pan`).
  - **Foley do personagem:** roupa roçando, passos e pés descalços, mão agarrando, respiração (calma, ofegante, choro contido) nos planos fechados. Personagem perto e mudo parece boneco.
  - **Dinâmica e corte:** silêncio curto antes do impacto (`silencio`), subida feita de som real invertido até o corte ou estouro (`riser`), ouvido "abafado" depois de explosão (`abafar`), e o som do próximo plano entrando 0,2–0,5 s antes do corte (J-cut).
  - **Ambiente que muda com o plano:** cada lugar com o seu leito real (chuva, rodagem, grilos, pátio), trocado no corte e não um leito único arrastado.
  - **Variedade:** a mesma ação repetida usa gravações ou trechos diferentes (passos, gotas, batidas), nunca o mesmo arquivo em laço audível.
  - **Antes de entregar:** conferir no espectro que não há energia constante em frequências agudas (chiado), que o som não passa de ~-18 dB de média e que cada efeito cai no quadro da ação; se houver dúvida, tirar o som em vez de enfeitar. Não consigo ouvir o resultado, então a checagem é por análise e por teste aprovado pelo dono.

## 4b. Movimento de personagem (lição do "Ele podia voar", 16/11: o dono achou os movimentos simples)
- **Captura real primeiro, e várias:** procurar a ação em `biblioteca3d/mocap/catalogo_cmu.tsv` (2379 capturas da CMU com descrição: andar triste, sentar, rir, apontar, discutir com raiva, levantar peso, cair...) e baixar com `python3 baixar.py <código>`. No "Ele podia voar" usei uma captura só (levantar de bruços) e o resto foi pose parada com tremor: ficou duro.
- **Toda ação tem preparação, ação e acomodação:** o corpo pega impulso antes (antecipação), o movimento acelera e desacelera (nunca velocidade constante), e depois balança e assenta (continuidade). Cabeça, mãos e cabelo chegam um pouco depois do tronco.
- **Transições misturadas, nunca coladas:** de uma captura para outra com `misturarClipes` (lucas_poder/js/mocap.js; `yawB` alinha capturas viradas para lados diferentes); capturas ao contrário ou mais rápidas com `retimar`.
- **Camada de vida por cima de tudo:** respiração no peito e nos ombros, troca de peso, cabeça que nunca fica cravada (`vida(L, t, {ofegante})`), fases diferentes por personagem. Personagem parado esperando a fala é proibido.
- **Contato com o mundo:** pés plantados no chão (sem escorregar), mãos que realmente seguram (IK + dedos fechando), peso visível quando levanta algo, corpo que afunda no banco quando senta.
- **Atuação no rosto em plano fechado:** piscar, olhar que procura, boca que respira; a emoção sobe aos poucos (tristeza → raiva em 2–3 etapas visíveis), não liga de uma vez.
- **Conferir em movimento, não em foto:** antes do render final, renderizar a bancada `lucas_poder/teste_mocap.html` (ou um trecho do plano) em vídeo curto e olhar a sequência; folha de quadros parados esconde movimento duro.

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

## 7b. Lições do 3D (cadeira voadora)

- Personagem 3D tem que ter vida: expressão, olhar, peso e movimento contínuo. Boneco low poly genérico com pose travada não serve.
- Contato físico correto é obrigatório: sentado é sentado no assento, pé no chão, mão segurando de verdade. Nada flutuando ou atravessando objetos.
- Física crível: o que sobe acelera e balança coerente com o vento; o que cai cai com gravidade; nada para do nada.
- Nenhum plano parado: se não há ação, há movimento de câmera e de personagem ao mesmo tempo.
- Antes de renderizar o vídeo inteiro, mostrar 3 a 5 segundos de teste ao dono para aprovar o visual.

## 7c. 3D que funcionou (aeroporto, 18 anos)

- Personagem como **silhueta chapada com borda de luz** também no 3D (material sem sombreamento + casca invertida): as juntas somem e o estilo do xadrez se mantém.
- O mesmo esqueleto (`videos/svg/terminal/rig.js`) serve para 2D e 3D; poses por alvo de mão e pé, com proporção real em centímetros.
- Fazer **storyboard em 2D e em 3D** antes e deixar o dono escolher.
- Transições pelo cenário: subir a câmera até o painel e descer em outro lugar, giro rápido, nuvem. Contador diegético = painel de partidas.
- Visitantes nunca passam entre a câmera e o personagem; conferir texto espelhado em tudo que é segurado.

## 7d. Detalhe de cenário já vem na biblioteca (15/11)

- O dono pediu para **não aumentar o nível de detalhe vídeo a vídeo**: a cidade do kit (`biblioteca3d/cidade/kit.js`) já aplica sozinha o detalhe procedural em ruas, calçadas, grama, paredes, telhas, janelas e água (ver o README da cidade). Em vídeo novo, carregue `Kit.carregar()` e use `kit.ambiente({ molhado, chuva })` e `kit.tempo(t)`; **não copiar** `detalhe.js` para o projeto.
- Se uma cena ainda parecer "lisa", melhorar a receita **na biblioteca** (`detalhe.js`/`extras.js`), conferir na bancada `detalhe.html` (antes/depois com `?detalhe=0`) e registrar no inventário.
- Vídeos já entregues usam `{ detalhe: false }` para o visual não mudar se forem renderizados de novo.

## 8. Assets prontos primeiro

- Antes de modelar qualquer coisa, procurar asset pronto **CC0** (OpenGameArt filtrando CC0; Kenney; Quaternius). Só criar em código o que não existir.
- Tudo o que for baixado vai para `videos/biblioteca3d/` com a licença e a fonte no README, para reutilizar nos próximos vídeos.
- Em 3D: abertura em até 3 s mostrando tudo de uma vez, câmera sempre em movimento e uma volta de 360° de vez em quando.

## 9. Pipeline técnico (resumo)

- Página SVG por vídeo: `_head.html` + `_shared.js` + `_helpers.js` + `_man.js` + `_objs.js` + `_scenes.js` + `_render.js`, montada por `build.py`.
- Linha do tempo em `narr.json` (`k`, `txt`, `t0`, `t1`, `a`, `b`); cada cena é uma função `sN(t)`.
- Render: `PAGE=… FR=… VW=… VH=… node render_svg.js <worker> 4 30` (4 processos, um por worker).
- Som: `sfx_<nome>.py` usando a mesa `biblioteca3d/sons/mesa.py` (gravações BigSoundBank em `biblioteca3d/sons/bsb` + Kenney; camadas, espaço, pan, limitador e checagens).
- Stills: `shotf.js`; folhas: `sheet.py` (vertical) e `sheet169b.py` (16:9).

## 9b. Custo de render em Three.js sem placa de vídeo (17/11, T. rex corrida)

- **Medir antes de prometer tempo.** O Chromium aqui renderiza por CPU (SwiftShader, 4 núcleos). Com a mata (~2000 plantas instanciadas, 58 milhões de triângulos por passe) um quadro de 720×1280 levava ~57 s: os pós (AO, desfoque, brilho) somavam só ~4 s; **93% do custo era a vegetação**, desenhada 4 vezes por quadro (sombra, imagem, normais do AO, profundidade do desfoque). Perfil: abrir a página uma vez e medir o mesmo quadro ligando e desligando partes (`?ao=0 &dof=0 &sombra=0 &msaa=0 &corte=0 &lod=0 &dofrapido=0`).
- `InstancedMesh` com `frustumCulled = false` processa **todas** as cópias em **todos** os passes. A solução está em `trex_corrida/js/corte.js` (copiar para outro vídeo com mata): a cada quadro, só ficam as cópias que cruzam o campo de visão (ou cuja sombra cai nele), as distantes (> 45 m) trocam para o modelo leve (`biblioteca3d/polyhaven/gerar_lod.py` gera `<id>_lod.glb`, só geometria; o material é o do modelo cheio, achado pelo nome), nada passa de 100 m (a névoa exp² já engoliu) e só entra no mapa de sombra o que cai na janela da câmera da luz. O desfoque lê a profundidade que o AO já desenhou (um passe a menos). Resultado: **~57 s → ~7 s por quadro** (540×960), imagem quase idêntica (diferença média 0,5/255 sem o modelo leve; o modelo leve só deixa os tufos distantes um pouco mais "em blocos").
- Os modelos `_lod.glb` ficam fora do git (a pasta `modelo/` é baixada): rodar `gerar_lod.py` de novo ao clonar (comando no cabeçalho do script e em `trex_corrida/roteiro.md`).
- Não prometer ganho de GPU para Three.js sem ter testado: o Blender/Cycles no Colab (T4) levou ~3 h para 1080 quadros de 720p e chegou com defeitos; o caminho local com o corte acima custa bem menos.


## Antes de criar um vídeo: checar a biblioteca (obrigatório)
1. Ler `biblioteca3d/INVENTARIO.md` (cidade, veículos, personagens, módulos de cena e som já feitos).
2. Listar o que o roteiro precisa (cenário, paisagem, personagens, objetos, efeitos) e marcar, item por item, **o que já existe** e o que falta.
3. **Reutilizar** o que existe (copiar a pasta `js/` do Short mais parecido e trocar só o mundo e as cenas); criar do zero **só o que falta**.
4. Fazer a **decupagem como diretor de cinema** (tamanho do plano, ângulo, lente, movimento com motivo, luz e transição de cada plano; regras em `ESTILO.md`, seção "Direção de cena") e mostrar ao dono do canal junto com essa lista, antes de renderizar.
5. Ao terminar, **registrar no inventário** tudo o que foi criado de novo (e salvar modelos `.glb` na biblioteca), para o próximo vídeo.
6. Personagem pedido pelo dono ("camisa vermelha, calça azul") se acha no inventário; se o modelo existente não tem esqueleto, avisar e usar o mais próximo animado, repintado.
