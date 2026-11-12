# A arma de madeira (John Dillinger, 1934): roteiro para narrar

Short vertical de 40,5 s em animação SVG, no mesmo formato do vídeo do xadrez. Não tem legenda nem música, só efeitos sonoros.
São 9 cenas, uma ação por cena, e a história se entende mesmo sem som. O último quadro emenda no primeiro, então o vídeo faz loop.
A marca **Hryz** aparece na lata de graxa.

| Tempo | Fala | Cena |
|---|---|---|
| 0:00,1 – 0:04,5 | Essa arma nunca disparou um único tiro… e mesmo assim tirou um homem da cadeia. | Close na arma preta apontada; atrás, o guarda de mãos para cima. No fim, uma lasca da graxa cai e aparece a madeira. |
| 0:04,6 – 0:11,3 | Em 1934, as autoridades juravam que a cadeia de Crown Point era à prova de fuga. Lá dentro estava John Dillinger, o assaltante de bancos mais famoso dos Estados Unidos. | Fachada de tijolo com a faixa "À PROVA DE FUGA" e "1934"; zoom até a janela gradeada com o preso. |
| 0:11,4 – 0:16,9 | Ele contou depois que entalhou um bloco de madeira com uma lâmina de barbear e pintou tudo com graxa de sapato. | O bloco vira pistola com a lâmina (lascas voando); depois o pincel de graxa pinta tudo de preto. |
| 0:17,0 – 0:20,9 | Numa manhã de março, apontou aquele pedaço de madeira pro guarda. E funcionou. | A mão entra com a arma; o guarda levanta as mãos. |
| 0:21,0 – 0:27,7 | Um por um, trancou os guardas nas celas, trocou a arma de mentira por metralhadoras de verdade e fugiu no carro da própria xerife. | A grade fecha com os guardas dentro; a arma de madeira cai no chão; o Ford preto "XERIFE" arranca. |
| 0:27,8 – 0:32,5 | Só que, ao cruzar a divisa do estado com aquele carro, ele colocou o FBI atrás dele. | O carro passa pela placa ILLINOIS; a ficha do FBI ganha o carimbo PROCURADO. |
| 0:32,6 – 0:35,7 | Quatro meses depois, foi morto na saída de um cinema. | Letreiro BIOGRAPH à noite, flashes; o chapéu cai na calçada (sem mostrar violência). |
| 0:35,8 – 0:40,4 | E até hoje ninguém sabe se essa arma foi mesmo entalhada por ele… ou entregue escondida. | A arma sozinha sob um foco de luz, girando até voltar ao enquadramento do começo. |

146 palavras, cerca de 3,6 palavras por segundo: dá para falar sem correr. Corte o áudio exatamente em "escondida" para o loop ficar limpo.

## Por que essa história (o que já funcionou no canal)
- **Mesma fórmula do xadrez (80 mil):** fuga de prisão, um objeto em close, um truque engenhoso e a resposta só no fim.
- **Quadro 0 é a imagem-recompensa:** a arma apontada e o guarda rendido, claro e quente, com o assunto grande no centro.
- **Primeira fala em 0,1 s com mistério:** "nunca disparou um tiro… e tirou um homem da cadeia" faz a pergunta "como?".
- **Final aberto que volta ao começo:** a dúvida sobre quem fez a arma emenda no quadro 0 e incentiva assistir de novo.

## Fatos e fontes
- **Confirmados:** fuga da cadeia do condado de Lake, em Crown Point (Indiana), em 3/3/1934. As autoridades se gabavam de que era à prova de fuga. Ele usou uma pistola falsa, trancou os guardas nas celas, pegou metralhadoras de verdade e fugiu no Ford da xerife Lillian Holley. Ao cruzar para Illinois com o carro roubado, o FBI entrou na caçada. Morreu em 22/7/1934, na saída do cinema Biograph, em Chicago.
- **Contestado, por isso o "ele contou" e a dúvida no fim:** Dillinger disse que entalhou a arma sozinho, com madeira, lâmina de barbear e graxa de sapato. Outras versões dizem que um investigador do advogado dele comprou a arma de um marceneiro e a entregou na manhã da fuga.
- **Fontes:** [The Mob Museum](https://themobmuseum.org/blog/john-dillingers-wooden-gun-and-death-mask-preserve-notorious-moments-in-his-life), [History.com](https://www.history.com/news/10-things-you-may-not-know-about-john-dillinger).

## Arquivos
- **Animação:** `dillinger_src.html` (cenas); `build.py` monta `dillinger.html` com a narração e o áudio embutidos.
- **Sons:** `sfx_dillinger.py` gera os efeitos, todos sintetizados em Python.
- **Render:** a partir de `videos/`, rode `PAGE=svg/dillinger/dillinger.html FR=<pasta> VW=1080 VH=1920 node render_svg.js <i> 4 30` em 4 processos e depois o ffmpeg (H.264 de 3,2 Mbps + AAC de 160 kbps, cerca de 17 MB).
