# Como Nasce um Raio ⚡

Short 2D (SVG), 1080×1920, 26,3 s, 9 planos. Quarto teste do formato dos virais (ESTILO.md, "O que aprendi lendo virais"): 75 palavras (2,85 por segundo), a primeira frase descreve o quadro 0 (a colisão com faísca), cada frase muda a tela, o raio é o clímax no meio, o vídeo termina quando o processo termina (o trovão) e o último plano volta ao quadro 0 (o macro rebobina até o clarão), então o loop fecha. Primeiro corte aos 2,4 s. **A marca HRYZ Animation está na caixa do medidor de campo elétrico**, que faz o papel de contador diegético (planos 4 a 7). Não confundir com o vídeo "O homem que levou 7 raios" (`svg/raio/`): aquele conta a história do Roy Sullivan; este explica como o raio nasce.

## Narração (narr.json)
| bloco | tempo | texto | o que muda na tela |
|---|---|---|---|
| b1 | 0,1–4,9 | Na nuvem de tempestade, cristais de gelo e granizo se chocam e trocam carga elétrica. | macro: cristal e granizo se chocam com faísca; os "−" saltam para o granizo; o cristal fica "+" |
| b2 | 5,0–7,8 | Os leves, positivos, sobem; os pesados, negativos, descem. | pull-out: cristais laranja (+) sobem, granizo azul (−) desce; a nuvem se divide em duas camadas |
| b3 | 7,9–11,7 | O chão responde com cargas positivas, que sobem pelas árvores e prédios. | a nuvem inteira, tilt até o chão; "+" sobem pela árvore e pela casa; medidor de campo sobe |
| b4 | 11,8–16,3 | Quando o campo vence o ar, um caminho de cargas desce em zigue-zague. | o líder desce em degraus, em zigue-zague e com ramos |
| b5 | 16,4–19,2 | Perto do chão, uma faísca sobe para encontrá-lo. | faíscas sobem da árvore e do telhado; uma delas encontra a ponta do líder |
| b6 | 19,3–23,5 | No encontro, uma corrente enorme esquenta o ar a uns 30 mil graus. | clarão único e suave; o raio sobe pelo canal; painel "30.000 °C" e, embaixo, "Sol 5.500 °C" |
| b7 | 23,6–25,7 | O trovão é esse ar explodindo. | anéis de choque se abrem em volta do canal; câmera treme |
| (sem fala) | 25,7–26,3 | — | o macro volta ao clarão do quadro 0 (loop) |

## Decupagem (diretor)
| # | Plano | Tempo | Tamanho e ângulo | Lente e movimento (motivo) | Luz, foco e transição |
|---|---|---|---|---|---|
| 1 | gelo | 0–2,4 | extremo close | macro; push-in lento com leve giro | faísca no quadro 0; fundo violeta e neve desfocados; cristais desfocados em 1º plano |
| 2 | troca | 2,4–4,9 | close, câmera lenta | tele; deriva e giro lentos | arcos de faísca no contato; os "−" brilham em ciano |
| 3 | separa | 4,9–7,8 | pull-out | recuo que revela as duas camadas | topo laranja (+) e base azul (−) |
| 4 | nuvem | 7,8–11,7 | grande plano geral, tilt para baixo | usa a altura do vertical, da nuvem ao chão | brilho laranja e azul por dentro da nuvem; chuva |
| 5 | lider | 11,7–16,3 | plano médio | a câmera acompanha a ponta, tilt para baixo | o líder é a única luz forte |
| 6 | faisca | 16,3–19,2 | close, de baixo | push-in no encontro | faíscas laranja sobem; faísca branca no encontro |
| 7 | raio | 19,2–23,5 | grande plano geral, tilt para cima | segue a corrente até a nuvem; tremor curto | clarão único e um segundo bem fraco (sem pisca-pisca); canal branco-azulado |
| 8 | trovao | 23,5–25,7 | plano médio | tremor decrescente | anéis de choque; o canal esfria |
| 9 | ciclo | 25,7–26,3 | close, igual ao quadro 0 | o macro rebobina até o clarão | match cut para o loop |

## Som (sfx_nasce_raio.py, tudo sintetizado, sem música)
Zumbido elétrico que cresce e tilintar de gelo dentro da nuvem; faíscas nas colisões e sinos suaves quando as cargas se separam; "tic" dos elétrons saltando e arcos; sopros subindo e descendo na separação; vento, chuva e trovões distantes fora da nuvem; zumbido eletrostático e estalinhos de corona quando o chão responde; um estalo curto a cada degrau do líder (mais forte conforme desce); bipes do medidor; zíper agudo da faísca que sobe; um instante de quase silêncio; o estalo do raio com um segundo estalo mais fraco; o trovão grave só depois (no plano 8), com um pulso grave a cada anel; no fim, a faísca do quadro 0 tocada ao contrário para emendar o loop.

## Fatos e fontes (conferidos em 12/11)
- **Carga na nuvem:** colisões entre granizo (graupel) e cristais de gelo menores separam carga; o gelo leve sobe nas correntes de ar e leva carga positiva para o alto; as partículas pesadas levam carga negativa para a base (modelo simples do NSSL/NOAA). O sinal da carga do granizo depende da temperatura e ainda há debate científico sobre os detalhes; também existe, em geral, uma região positiva menor abaixo da região negativa principal. A fala segue o modelo simples.
- **O chão responde** com carga positiva, que se concentra em objetos altos (árvores, prédios).
- **Líder em degraus:** cada degrau tem uns 50 m; quando um ramo chega a uns 50 m do chão ou de um objeto, uma faísca (streamer) sobe do objeto alto para encontrá-lo (NWS).
- **Temperatura:** o canal chega a cerca de 30 mil graus por milionésimos de segundo (NSSL: acima de 50 mil °F), uns 5 vezes a superfície do Sol (cerca de 5.500 °C). É um pico num canal estreito; uma página do NWS cita só uns 10 mil °C, por isso a fala diz "uns".
- **Trovão:** o ar aquecido se expande de uma vez, como onda de choque cilíndrica, e ela vira o som que ouvimos (NSSL).
- **Medidor:** o campo elétrico no chão é de uns 0,1 kV/m (100 V/m) com tempo bom e chega a uns 10 kV/m sob a tempestade; valores ilustrativos, de estudos de medição, e não um limite oficial de alerta.
- Licença poética: tudo em câmera lenta e ampliado; a "perna" do raio de retorno sobe em frações de segundo na vida real.
- Fontes:
  - https://www.nssl.noaa.gov/education/svrwx101/lightning/
  - https://www.noaa.gov/jetstream/lightning/how-lightning-is-created
  - https://www.weather.gov/safety/lightning-science-connection-ground
  - https://webarchive.library.unt.edu/web/20170119020933/http://www.nssl.noaa.gov/education/svrwx101/lightning/faq
  - https://weather.gov/safety/lightning-science-negative-charged-flash

## Título e descrição
- Título: **Como Nasce um Raio ⚡**
- Descrição: Dentro da nuvem, cristais de gelo e granizo se chocam e separam cargas elétricas. O chão responde com carga positiva, um caminho desce em zigue-zague, uma faísca sobe para encontrá-lo e o ar aquecido a uns 30 mil graus explode: é o trovão. #shorts #curiosidades #ciencia

## Gerar
```
python3 sfx_nasce_raio.py && python3 build.py
cd ../.. && PAGE=svg/nasce_raio/nasce_raio.html FR=<pasta> VW=1080 VH=1920 node render_svg.js <w> 4 30   # 4 workers
ffmpeg -framerate 30 -i <pasta>/f%05d.jpg -i svg/nasce_raio/nasce_raio_sfx.mp3 -c:v libx264 -b:v 3200k -pix_fmt yuv420p -c:a aac -b:a 160k -shortest svg/nasce_raio/nasce_raio.mp4
node quadros.js <prefixo> t1 t2 …   # quadros soltos (rodar de svg/nasce_raio, sem NODE_PATH)
```
