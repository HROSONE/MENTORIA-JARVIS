# "A carne que ainda se mexe": Short 3D

- **Formato:** vertical 1080×1920, 30 qps, ~55 s.
- **Cenário:** fundo azul neutro de estúdio (o mesmo do vídeo da câmara de ar), com uma ilha de pasto e depois a mesa do açougueiro.
- **Texto na tela:** só o diegético. Um relógio de parede (o tempo depois do abate) e um medidor de energia (ATP) nas células.

## Fatos (com fonte)
- **A carne se mexe mesmo.** Depois do abate, o sangue para de chegar ao músculo e ele gasta a energia que restou, o que aparece como músculos se contraindo. Fonte: [AHDB](https://ahdb.org.uk/knowledge-library/post-slaughter-factors-affecting-red-meat-quality).
  - Também pode ser estímulo nas terminações nervosas da carne muito fresca. Fonte: [Gazeta SP](https://www.gazetasp.com.br/gazeta-mais/video-de-carne-se-mexendo-viraliza-e-assusta-internautas/).
- **Energia = ATP.** Sem oxigênio, o músculo ainda faz ATP pela glicólise até o glicogênio acabar. Quando o ATP some, a miosina trava na actina e vem o rigor mortis. Fontes: [Swatland, Guelph](https://animalbiosciences.uoguelph.ca/~swatland/ch5_1.htm), [CSIRO](https://www.publish.csiro.au/AN/fulltext/AN13088).
- **Quanto tempo:**
  - As contrações visíveis duram pouco: minutos. O bife que viralizou na China ainda pulsava cerca de 1 hora depois de sair do açougue. Fonte: [Foodbeast](https://foodbeast.com/news/chinese-womans-raw-steaks-still-twitches-before-she-cooks-it).
  - A energia acaba de vez no rigor mortis, que no boi começa entre 6 e 24 horas, em geral perto de 12 h, conforme a temperatura e o tamanho da carcaça. Fontes: [Meat Cutting (eCampus Ontario)](https://ecampusontario.pressbooks.pub/meatcutting/chapter/chemical-changes-associated-with-slaughter/), [Texas A&M](https://meat.tamu.edu/?p=5074).
  - Não achei fonte com um número exato para "quanto tempo a carne treme". O vídeo diz "minutos, às vezes perto de 1 hora", e não promete mais que isso.
- **O abate no frigorífico:**
  - O boi é insensibilizado com uma **pistola de dardo cativo** (o "tiro"), que atinge o cérebro. Fontes: [Temple Grandin](https://www.grandin.com/humane/cap.bolt.tips.html), [GOV.UK](https://www.gov.uk/guidance/red-meat-slaughterhouses-restraining-stunning-killing-animals).
  - Depois vem a sangria e o boi é **esfolado**, ou seja, o couro é tirado.
  - A **água quente para soltar os pelos é do porco**, não do boi. Fonte: [tese SLU](https://pub.epsilon.slu.se/id/document/12497450).

## Decupagem (diretor)
| t (s) | Plano | Função | Tamanho / ângulo / lente | Movimento e motivo | Luz e herói | Transição |
|---|---|---|---|---|---|---|
| 0–3 | **Quadro 0:** a carne cortada na mesa, com as fibras pulsando, o cutelo cravado ao lado e o relógio "00:07" | Gancho absurdo | Plano detalhe, de cima a 3/4, grande-angular perto | Push-in lento na carne que pulsa | Carne com brilho úmido e borda de luz; o resto em penumbra azul | Rebobina em whip pan (volta no tempo) |
| 3–9 | Boi Nelore no pasto, arrancando e mastigando o capim | Premissa | Plano médio baixo (contra-plongée) → close da boca | Órbita lenta, depois push-in na mastigação | Boi branco iluminado, capim verde, fundo azul | Corpo do boi vira raio-x |
| 9–15 | Raio-x: o bolo de capim desce pelo esôfago até o rúmen (estômago de 4 partes), que fermenta e borbulha | Mostrar o caminho do alimento | Plano geral do corpo translúcido | Travelling acompanhando o bolo | Bolo e estômagos acesos, o corpo vidro | Mergulho no músculo (zoom contínuo) |
| 15–21 | Dentro do músculo: células e mitocôndrias acendendo, enchendo de ATP (pontos de luz), com o medidor de energia subindo | A energia guardada | Close macro | Zoom contínuo de célula para mitocôndria | Mitocôndrias laranja brilhando | Pull-out rápido até o boi |
| 21–25 | O abate: a pistola de dardo cativo encosta na testa, flash e o boi cai de lado | Tragédia | Plano geral lateral, câmera baixa | Câmera na mão e o único tremor forte do vídeo | Corte no flash; **sem sangue explícito** | Corte seco para o açougue |
| 25–33 | O açougueiro corta a peça na mesa com o cutelo (**ou** passa na água quente e raspa: decisão sua) | Concerto | Plano médio, contra-plongée → close do cutelo | Push-in a cada golpe | Açougueiro bem iluminado, mesa de inox | Corte no golpe do cutelo |
| 33–46 | A carne cortada pulsa e se contrai. Raio-x: as mitocôndrias apagam uma a uma, o ATP cai e o relógio acelera (5 min → 30 min → ~1 h). O tremor fica cada vez mais fraco até parar | O tempo | Close, depois micro dentro da fibra | Push-in; o relógio gira mais rápido | Luz das células morrendo | Match cut de volta à carne |
| 46–55 | Time-lapse: a carne fica parada e firme, e o relógio chega a ~12 h (rigor mortis, a energia acabou de vez). Volta à imagem do começo | Resposta + loop | Plano detalhe igual ao quadro 0 | Pull-out leve | Última mitocôndria apaga | Loop para o quadro 0 |

## O que preciso construir (a biblioteca não tem)
- **Boi Nelore detalhado** no Blender, por script, com esqueleto e animações: pastar (cabeça baixa, mandíbula mastigando, rabo), cair. Tem cupim, barbela, chifres curtos e pelagem branco-acinzentada. Procurei um boi pronto CC0: só achei o do Quaternius, low-poly demais para "muito bem feito".
- **Açougueiro** no gerador do elenco:
  - roupa: jaleco branco, avental de borracha, touca, botas brancas, luva de malha de aço na mão do apoio, chaira na cintura;
  - ação: golpe de cutelo.
- **Cutelo, mesa de inox e tábua de polietileno, peças de carne** com fibras, gordura entremeada e brilho úmido, e uma superfície que pulsa com shader de contração.
- **Células e mitocôndrias** procedurais (cristas internas), com o ATP como pontos de luz.
- **Já existem:** fundo azul de estúdio (`camara_ar`), capim (`tufos-capim` e gramados da cidade), mesa-madeira (base), núcleo de render rápido (llvmpipe) e a voz Hryz (`como_faco/voz.py`).

## Versão final (55 s, sem narração): tempos para o dono narrar
| t (s) | O que aparece | Fala sugerida |
|---|---|---|
| 0,0–3,5 | Bifes de contra-filé na tábua; o cronômetro marca 07:00 desde o abate | "Essa carne foi cortada há 7 minutos... e ainda está viva por dentro." |
| 3,5–9,5 | O Nelore pastando; o close mostra a boca arrancando o capim | "Tudo começa no pasto." |
| 9,5–16 | Raio-x: o capim desce pelo esôfago até o rúmen, que fermenta, e a energia vai para os músculos | "O capim fermenta no rúmen e vira combustível para cada músculo." |
| 16–22 | Dentro da fibra: as mitocôndrias acendem e o medidor de ATP enche | "As mitocôndrias guardam essa energia em forma de ATP." |
| 22–26,5 | A pistola de dardo cativo encosta na testa; clarão; o boi cai | "Depois do abate, o sangue para..." |
| 26,5–34 | O açougueiro corta os bifes com o cutelo | "...mas as células ainda têm ATP." |
| 34–47 | A carne treme e se contrai; as mitocôndrias apagam uma a uma; o cronômetro chega a ~1 h | "Enquanto sobra energia, o músculo se contrai sozinho: minutos, às vezes perto de uma hora." |
| 47–55 | O cronômetro vai a 12 h; a carne para e escurece (rigor mortis); volta à imagem do começo | "Quando o ATP acaba de vez, umas 12 horas depois, vem o rigor mortis. E a carne para." |

## Como foi feito
- **Boi:** `biblioteca3d/animais/boi/criar_boi.py` (Blender, por script) gera o `boi.glb`, com 90 mil faces, 31 ossos, pelo curto no shader e cor por vértice. As poses são feitas no `js/boi.js`.
- **Açougueiro:** `biblioteca3d/personagens/elenco/gerador/personagens8.py` gera o `acougueiro.glb`.
  - O corpo usa uma captura real da CMU (62_08, "martelando"), aplicada por retarget.
  - O braço do cutelo e a mão da luva usam IK (`js/acougue.js`).
- **Carne:** texturas geradas por `biblioteca3d/objetos/carne/gerar_texturas.py`.
  - Face de corte: feixes de fibra, tecido conjuntivo e marmoreio.
  - Lateral: grão das fibras.
  - O tremor é um relevo animado no shader, com amplitude igual ao ATP que resta.
- **Células:** `js/micro.js` (fibra aberta, miofibrilas com sarcômeros, mitocôndrias com cristas, ATP, glicogênio).
- **Som:** `sfx.py`, só com gravações CC0 do BigSoundBank (mugido 2383, quedas e impactos) e estalos curtos.
