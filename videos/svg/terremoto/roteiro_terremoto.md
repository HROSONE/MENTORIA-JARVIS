# Como Nasce um Terremoto 🌍

Short 2D (SVG), 1080×1920, 25,4 s, 9 planos. Sexto teste do formato dos virais (ESTILO.md, "O que aprendi lendo virais"): 69 palavras (2,7 por segundo), cada frase muda a tela. **Regra do dono: o primeiro segundo é o ponto principal.** O quadro 0 já é a estrada esticada em "S" por uma falha travada e, em 0,12 s, ela arrebenta e o chão desliza 6 m (cota "6 m" na tela). Só depois a história rebobina e desenrola o processo, do começo ao fim. O último plano volta a esticar a estrada até o mesmo "S" do quadro 0, então o loop fecha: o fim é a tensão que vira o estalo do começo. **A marca HRYZ Animation está no contador de anos** (contador diegético, planos 2 a 5 e 9) **e no sismógrafo** (plano 8).

## Narração (narr.json)
| bloco | tempo | texto | o que muda na tela |
|---|---|---|---|
| b1 | 0,1–2,55 | Em segundos, o chão deslizou seis metros. | a estrada, a cerca e o riacho estão em "S" sobre a falha que brilha; em 0,12 s tudo estala, os dois lados deslizam, anéis de choque e poeira; aparece a cota "6 m" |
| b2 | 2,85–6,55 | Antes, duas placas de rocha se arrastavam, poucos centímetros por ano. | a imagem rebobina (ícone ⏪, contador de 200 a 0) e abre num plano geral: setas em sentidos opostos, o chão se arrasta, "3 cm/ano" |
| b3 | 6,85–10,50 | Mas a falha travou, e a rocha esticou como um elástico. | push-in até o macro da falha (faíscas de atrito, etiqueta TRAVADA); pull-out revela os campos e a estrada se curvando em "S" e esquentando |
| b4 | 10,75–12,95 | Por séculos, a energia só cresceu. | o contador dispara até o ano 200; a barra de tensão sobe ao vermelho; a falha brilha; mergulho na fenda |
| b5 | 13,15–15,75 | Até que a rocha cedeu, lá no fundo. | plano da falha visto de frente, tilt até o foco; a parte travada pulsa, clarão no foco (etiqueta FOCO) |
| b6 | 15,95–19,00 | A ruptura correu pela falha, e os dois lados escorregaram. | a frente de ruptura cresce até a superfície (EPICENTRO), com setas de escorregão atrás dela; corte para o mapa: a frente corre pela falha e cada linha estala e fica deslocada |
| b7 | 19,20–22,60 | Parte da energia saiu em ondas: o terremoto que sentimos. | anéis P (rápido, claro) e S (lento, laranja); o chão ondula, a cidade balança; o sismógrafo registra P pequena e S grande |
| b8 | 22,80–24,90 | E as placas continuam se arrastando. | whip para a estrada refeita, ano 0; o contador sobe, a estrada se curva e a câmera avança até o "S" do quadro 0 (loop) |

## Decupagem (diretor)
| # | Plano | Tempo | Tamanho e ângulo | Lente e movimento (motivo) | Luz, foco e transição |
|---|---|---|---|---|---|
| 1 | snap | 0–2,6 | close, plongée total (de cima) | pull-out lento; punch-in e tremor forte só no estalo (0,12 s); cota "6 m" | cor forte e clara; a falha brilha em laranja; clarão curto no estalo |
| 2 | rebobina | 2,6–3,3 | do close ao grande plano geral | pull-out rápido, giro leve (a imagem volta no tempo) | linhas de fita e ícone ⏪; o contador corre de trás para frente |
| 3 | placas | 3,3–6,7 | grande plano geral de cima | deriva lenta para cima, leve giro | setas em sentidos opostos; "3 cm/ano"; ano 0 a 60 |
| 4 | trava | 6,7–10,6 | plano detalhe (macro) e depois plano médio | push-in até a falha travada, pull-out revelando o "S" (a trava explica o esticar) | faíscas de atrito; a estrada esquenta (vermelho) |
| 5 | anos | 10,6–13,1 | plano médio | push-in lento; tremor leve de tensão antes do mergulho | contador até 200; barra de tensão no vermelho; mergulho na fenda escurece o quadro |
| 6 | foco | 13,1–17,0 | plano geral frontal (a parede da falha) | tilt para baixo até o foco; pull-out acompanhando a frente de ruptura | fundo escuro azul, parede de rocha, brilho no foco; clarão ao chegar na superfície |
| 7 | ruptura | 17,0–19,0 | grande plano geral de cima | replay em câmera lenta; tremor forte que decai | a frente corre pela falha e cada linha estala; poeira; anéis |
| 8 | ondas | 19,0–22,6 | grande plano geral que avança até a cidade | travelling lateral e push-in lento rumo à cidade | anéis P e S; o chão ondula; sismógrafo com a marca |
| 9 | ciclo | 22,6–25,4 | plano geral que fecha no enquadramento do quadro 0 | whip de entrada; push-in até o close do quadro 0 (match cut com o loop) | ano 0 a 200; a estrada volta ao "S" do começo |

## Som (sfx_terremoto.py, tudo sintetizado, sem música)
Um rangido de tensão logo antes do estalo; o estalo seco da rocha (0,12 s) com uma pancada grave, chuva de pedaços de asfalto, poeira e um pulso de sonar para o anel de choque; "tick-tick" da cota; no rebobinar, um zumbido de fita que desce e a catraca do contador; ronco grave e rocha raspando nos planos de acúmulo; uma batida seca quando a falha trava e rangidos que sobem; um tique do contador a cada 5 anos, acelerando junto com ele; uma varredura de tensão e microfissuras antes do mergulho; no plano da falha, um coração de pulsos graves, o estrondo no foco, rumor crescente com estalinhos até a superfície; no mapa, a cascata de estalos linha a linha e um ronco longo; a pancada seca da onda P e o balanço grave da S com as casas chacoalhando; a pena do sismógrafo; e, no fim, a tensão sobe até o corte, de modo que o estalo do começo emenda o loop.

## Fatos e fontes (conferidos em 14/11)
- **Rebote elástico:** depois do terremoto de São Francisco (1906), Harry Fielding Reid concluiu que o terremoto foi a liberação de tensão elástica guardada. A falha fica travada pelo atrito até a deformação acumulada nas rochas dos dois lados vencê-lo; aí cada lado "volta" de uma vez.
- **Seis metros:** no terremoto de 1906, o maior deslocamento horizontal medido foi de 6,4 m (quase 21 pés) perto de Point Reyes Station; deslocamentos de cercas e estradas de 3 a 4,5 m foram comuns (USGS). O "seis metros" do vídeo é esse valor máximo, usado como exemplo; terremotos maiores passam disso e muitos não chegam à superfície.
- **"Em segundos":** num mesmo ponto da falha, o deslizamento de 1906 (uns 4 m, com velocidade máxima de uns 1 m/s) durou só alguns segundos (livro-texto *Understanding Earth*). A ruptura inteira leva mais tempo, porque corre ao longo da falha.
- **Placas: poucos centímetros por ano.** O movimento relativo Pacífico–América do Norte é de uns 4,7 cm/ano e a falha de San Andreas absorve cerca de 2 a 3,5 cm/ano (USGS). O vídeo usa 3 cm/ano: 3 cm/ano × 200 anos = 6 m. Valores ilustrativos: o intervalo real entre terremotos grandes varia muito.
- **Foco e epicentro:** o hipocentro (foco) é o ponto no fundo onde a ruptura começa; o epicentro é o ponto da superfície logo acima (USGS). A ruptura não para no foco: ela corre ao longo da falha (em 1906 foram uns 480 km).
- **Ondas:** a onda P é a mais rápida e chega primeiro; a S tem cerca de 60% da velocidade da P e chega depois, sacudindo de lado (USGS). No vídeo as ondas foram desaceleradas para dar para ver a P chegar antes da S.
- **"Parte da energia":** só uma parte da energia vira ondas sísmicas (estimativas citadas pelo USGS falam de uns 10% ou menos); o resto vira fratura e calor. Por isso a fala diz "parte da energia".
- Licença poética: mapa visto de cima em escala de 1 m = 36 px; a deformação da estrada é exagerada (na vida real ela se espalha por muitos quilômetros e só aparece com GPS, segundo o USGS); a falha é do tipo em que os blocos se arrastam em sentidos opostos (como a San Andreas), em outras (subducção) o movimento muda mas o princípio do rebote elástico é o mesmo; os anos, as barras e a cidade são ilustrações; o plano da falha visto de frente (foco, frente de ruptura) é um esquema.
- Fontes:
  - https://earthquake.usgs.gov/earthquakes/events/1906calif/18april/reid.php (Reid e o rebote elástico)
  - https://www.usgs.gov/media/videos/elastic-rebound (vídeo do USGS: elastic rebound)
  - https://earthquake.usgs.gov/earthquakes/events/1906calif/18april/historical.php (deslocamento máximo de 6,4 m em 1906)
  - https://pubs.usgs.gov/gip/earthq3/move.html (estradas e cercas deslocadas em 1906)
  - https://earthquake.usgs.gov/earthquakes/events/1906calif/18april/earthwaves.php (ondas P e S)
  - https://www.usgs.gov/publications/velocity-field-along-san-andreas-fault-central-and-southern-california (velocidade das placas e da falha)
  - https://digfir-published.macmillanusa.com/understandingearth7e/understandingearth7e_ch13_2.html (duração do deslizamento em 1906)
  - https://www.usgs.gov/faqs/what-depth-do-earthquakes-occur-what-significance-depth (hipocentro e epicentro)
  - https://www.usgs.gov/publications/gravitational-potential-source-earthquake-energy (fração da energia que vira ondas; fonte secundária)

## Título e descrição
- Título: **Como Nasce um Terremoto 🌍**
- Descrição: Um terremoto começa quando duas placas de rocha se arrastam, a falha trava e a rocha estica como um elástico por séculos. Quando ela cede num ponto, a ruptura corre pela falha, os dois lados escorregam metros em segundos e parte da energia sai em ondas que sacodem tudo. #shorts #curiosidades #ciencia

## Gerar
```
python3 sfx_terremoto.py && python3 build.py
cd ../.. && PAGE=svg/terremoto/terremoto.html FR=<pasta> VW=1080 VH=1920 node render_svg.js <w> 4 30   # 4 workers
ffmpeg -framerate 30 -i <pasta>/f%05d.jpg -i svg/terremoto/terremoto_sfx.mp3 -c:v libx264 -b:v 3200k -pix_fmt yuv420p -c:a aac -b:a 160k -shortest svg/terremoto/terremoto.mp4
node quadros.js <prefixo> t1 t2 …   # quadros soltos (rodar de svg/terremoto, sem NODE_PATH)
```
