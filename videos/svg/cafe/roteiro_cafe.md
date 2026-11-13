# Por Que o Café Te Acorda? ☕

Short 2D (SVG), 1080×1920, 26 s, 8 planos. Quinto teste do formato dos virais (ESTILO.md, "O que aprendi lendo virais"): 70 palavras (2,7 por segundo), a primeira frase descreve o quadro 0 (a adenosina encaixando nos receptores), cada frase muda a tela, a virada é "o café não cria energia, só bloqueia o aviso de sono" e o vídeo termina no bocejo. Primeiro corte aos 2,4 s. **A marca HRYZ Animation aparece no relógio digital (contador diegético, o mesmo estilo do termômetro da pipoca) e impressa na caneca.** Tema do dia a dia, no espírito do vídeo do xadrez (café e peça).

## Narração (narr.json)
| bloco | tempo | texto | o que muda na tela |
|---|---|---|---|
| b1 | 0,1–4,8 | Quanto mais tempo você fica acordado, mais adenosina se acumula no seu cérebro. | peças laranja (adenosina) encaixam nos receptores; o relógio corre de 07:00 a 15:00; a barra de sono sobe; câmera recua e mostra dezenas de peças |
| b2 | 4,9–9,1 | Ela encaixa nos receptores dos neurônios e manda o aviso: hora de dormir. | extremo close, câmera lenta: a chave entra, a alavanca gira, a luz fica rosa, o aviso "Z" entra na célula e o neurônio escurece |
| b3 | 9,2–12,4 | O café traz a cafeína, que tem um formato parecido. | a caneca com a marca; a cafeína (marrom) sobe do café; diagrama com as duas peças lado a lado e o encaixe destacado ("≈") |
| b4 | 12,5–16,3 | Ela ocupa os receptores primeiro e não manda aviso nenhum. | a cafeína encaixa primeiro (as luzes ficam verdes); a adenosina bate e volta; o neurônio acende; o "sono sentido" cai |
| b5 | 16,4–20,4 | O café não cria energia: só bloqueia o aviso de sono. | plano geral: a adenosina se acumula do lado de fora; barras grandes "sono real" (sobe) e "sono sentido" (baixo); o relógio corre até 20:30 |
| b6 | 20,5–24,9 | Quando a cafeína sai, a adenosina acumulada pode encaixar toda de uma vez. | a cafeína se solta, a adenosina encaixa em onda, o neurônio apaga, o "sono sentido" pula para o real; zoom-out até a cabeça, que boceja |

## Decupagem (diretor)
| # | Plano | Tempo | Tamanho e ângulo | Lente e movimento (motivo) | Luz, foco e transição |
|---|---|---|---|---|---|
| 1 | sono | 0–2,4 | macro (quadro 0) | push-in lento, leve giro | neurônio aceso (verde-amarelo); chaves brilham; peças desfocadas ao fundo |
| 2 | acumula | 2,4–4,8 | pull-out | recuo que revela o enxame e as 7 fechaduras | o neurônio vai escurecendo |
| 3 | encaixe | 4,8–9,1 | extremo close, câmera lenta | deriva e giro lentos | luz rosa e ondas do aviso; "Z" entrando na célula |
| 4 | cafe | 9,1–12,4 | close na caneca, depois diagrama | push-in no café; peças entram pelos lados | luz quente da cozinha; fundo escuro de diagrama |
| 5 | bloqueio | 12,4–16,3 | macro | deriva lateral | o neurônio se acende; anéis brancos a cada batida da adenosina |
| 6 | tapa | 16,3–20,4 | plano geral | recuo e leve inclinação | barras grandes em primeiro plano; o fundo escurece |
| 7 | baque | 20,4–24,0 | macro | tremor curto no encaixe | ondas rosa; o neurônio apaga |
| 8 | bocejo | 24,0–26,0 | zoom-out até a silhueta | do cérebro à cabeça inteira | silhueta com borda de luz quente; lua pela janela; caneca vazia |

## Som (sfx_cafe.py, tudo sintetizado, sem música)
Zumbido grave da célula, borbulhas e brilhos suaves; o "clack" de cada chave entrando na fechadura (mais agudo para a adenosina, mais grave e seco para a cafeína); bipes do relógio a cada hora; subida de tensão antes do encaixe; "pong" de sonar para o aviso entrando na célula; o clink da caneca, o vapor e uma escada de brilhos quando a cafeína sobe; "bonk" de borracha quando a adenosina bate e volta; multidão de estalinhos quando as peças se acumulam; o estrondo grave do encaixe em massa com o neurônio apagando; e, no fim, um bocejo sintetizado (sopro com formantes) com três "zzz" suaves.

## Fatos e fontes (conferidos em 13/11)
- **A adenosina se acumula com a vigília:** no prosencéfalo basal ela sobe enquanto se está acordado e cai no sono de recuperação; numa meta-análise ela subiu cerca de 75% acima do normal durante a privação de sono. É o sinal da "pressão de sono".
- **Receptores:** a adenosina age em receptores (principalmente A1 e A2A) e reduz a atividade de neurônios que mantêm a vigília. Qual subtipo faz o trabalho principal ainda é debatido; por isso a fala diz só "receptores".
- **Cafeína:** é um antagonista (não seletivo) dos receptores de adenosina: ocupa o lugar e não dispara o sinal. **Não reduz a adenosina**, que continua se acumulando. A forma parecida com a adenosina é a explicação usual de por que ela se encaixa.
- **"O café não cria energia":** simplificação aceita para "bloqueia o aviso de sono"; a cafeína também age em outros sistemas, por isso a fala diz "só bloqueia o aviso", e não "não faz mais nada". Efeito varia de pessoa para pessoa.
- **O "baque":** a explicação usual é que, quando a cafeína sai (meia-vida de uns 5 h, de 3 a 7 h conforme a pessoa), a adenosina acumulada encontra os receptores livres. As fontes tratam isso como explicação plausível e não como regra, por isso a fala diz "**pode** encaixar".
- Licença poética: o receptor aparece como fechadura e as moléculas como chaves; a haste da adenosina representa a parte que dispara o sinal; relógio, barras e "Z" são ilustrações. A hora do relógio é de exemplo.
- Fontes:
  - https://pubmed.ncbi.nlm.nih.gov/15313333/ (Adenosine and sleep-wake regulation)
  - https://pubmed.ncbi.nlm.nih.gov/21401496/ (The role of adenosine in the regulation of sleep)
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC6196573/ (Intracerebral adenosine during sleep deprivation: meta-análise)
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC3687201/ (Adenosina inibe neurônios do prosencéfalo basal)
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC3463109/ (Jacobson e Gao: receptores de adenosina e cafeína)
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC13119445/ (Cafeína e EEG do sono: revisão mecanística)

## Título e descrição
- Título: **Por Que o Café Te Acorda? ☕**
- Descrição: Quanto mais tempo você fica acordado, mais adenosina se acumula no cérebro e avisa que é hora de dormir. A cafeína tem forma parecida, ocupa os mesmos receptores e bloqueia o aviso: o café não cria energia. Quando ela sai, o sono acumulado pode chegar de uma vez. #shorts #curiosidades #ciencia

## Gerar
```
python3 sfx_cafe.py && python3 build.py
cd ../.. && PAGE=svg/cafe/cafe.html FR=<pasta> VW=1080 VH=1920 node render_svg.js <w> 4 30   # 4 workers
ffmpeg -framerate 30 -i <pasta>/f%05d.jpg -i svg/cafe/cafe_sfx.mp3 -c:v libx264 -b:v 3200k -pix_fmt yuv420p -c:a aac -b:a 160k -shortest svg/cafe/cafe.mp4
node quadros.js <prefixo> t1 t2 …   # quadros soltos (rodar de svg/cafe, sem NODE_PATH)
```
