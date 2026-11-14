# Terremoto: as duas cenas do carro (primeira pessoa)

Duas cenas curtas para encaixar no vídeo "Como Nasce um Terremoto" (o vídeo principal **não foi alterado**). 1080×1920, 30 fps, sem narração, só efeitos sonoros sintetizados. Mesmo carro e mesmo motorista nas duas: câmera no olho do motorista, mãos e antebraços em silhueta escura com borda de luz quente, **marca HRYZ Animation no centro do volante**. Sem texto na tela (regra do canal); a narração diz qual é qual. Na ordem pedida: a primeira mostra o que **não** acontece, a segunda mostra como acontece.

## Cena 1: o que NÃO aconteceu (cratera) — `terremoto_cena1_nao_aconteceu.mp4`, 5,8 s
A versão de cinema: a pista racha, abre numa cratera e o carro fica preso lá no fundo.

| tempo | o que acontece |
|---|---|
| 0 – 1,0 | já no quadro 0 o chão treme e a pista racha logo à frente (linha escura cortando a estrada e o campo, poeira subindo); o lado de lá sai do alinhamento. O motorista freia |
| 1,0 – 1,6 | a borda desaba para cima do carro e abre a cratera (parede em camadas: asfalto, base, solo, pedras); pneus cantando |
| 1,6 – 2,4 | o carro passa da borda e despenca; primeira batida na parede (2,05 s) e segunda no fundo (2,4 s); o para-brisa trinca; as luzes do painel acendem |
| 2,4 – 5,8 | preso no fundo: o céu e a borda lá em cima, poeira, torrões caindo, vapor, o motor falha e morre, o painel apaga e uma luz de alerta fica piscando |

## Cena 2: como acontece (a ponte quebra) — `terremoto_cena2_ponte_quebra.mp4`, 5,4 s
Sem cratera. O chão do outro lado da falha desliza de lado (até 6 m, o mesmo valor do vídeo) e a ponte, que é reta, dura e rígida, não acompanha: quebra no meio do vão.

| tempo | o que acontece |
|---|---|
| 0 – 0,9 | o carro já está sobre a ponte (guarda-corpos, postes de luz, rio embaixo); a falha passa por baixo do meio do vão; em 0,12 s o tabuleiro estala, a metade de lá desliza para a esquerda e **gira** (o ângulo da ponte muda), os trilhos entortam, poeira e pedaços caem no rio |
| 0,9 – 2,05 | o motorista freia; a abertura cresce na frente do carro: a pista de lá deixou de se encontrar com a de cá, há um degrau e a faixa de rolamento termina no vazio |
| 2,05 – 5,4 | o carro para a uns 5 m da quebra; o motorista olha para baixo; poeira, pedaços de concreto caindo, o tabuleiro ainda cede um pouco, pisca-alerta |

## Decupagem (diretor)
| Cena | Tamanho e ângulo | Lente e movimento (motivo) | Luz, foco e transição |
|---|---|---|---|
| 1 | primeira pessoa, altura dos olhos do motorista | grande-angular (exagera a velocidade); avanço contínuo, freada (a câmera afunda), queda da câmera na cratera, duas batidas e assentamento torto | dia claro que escurece com a poeira; corte seco de entrada e de saída |
| 2 | primeira pessoa, sobre o tabuleiro | grande-angular; avanço, freada, sacudida forte só no estalo, depois a câmera baixa o olhar para a beira da quebra | dia claro; a poeira é leve para a quebra continuar legível |

## Som (`sfx_carro.py`, sintetizado)
Motor com ignição que sobe e desce com a velocidade; ronco do chão e a lataria chacoalhando; estalo da rocha ou do tabuleiro; freada com pneus cantando e pulsos do ABS; na cena 1, a borda desabando, a queda, as duas batidas (metal e vidro), torrões, vapor e o motor morrendo; na cena 2, ranger do aço dos guarda-corpos, concreto caindo com respingos no rio, a estrutura rangendo depois que o carro para e o pisca-alerta (tic-tac).

## Fatos e cuidados (conferidos em 14/11)
- **A cena 1 é ficção (a versão do cinema).** O que os registros do USGS sobre o terremoto de 1906 destacam é o deslocamento lateral: estradas e cercas deslocadas de 3 a 6,4 m. Por isso a narração deve dizer que isso **não** aconteceu.
- **A cena 2 é uma dramatização do que acontece com uma ponte sobre uma falha, não um caso registrado de 1906.** Procurei e **não achei** um registro de uma ponte específica quebrando em 1906 (só deslocamentos de cercas, estradas e casas). Por isso o texto fala "como acontece", não "como aconteceu em 1906".
- **O princípio é real.** No terremoto de Düzce (Turquia, 12/11/1999) a falha cruzou o viaduto de Bolu: o deslocamento foi de cerca de 1,5 m, um pilar girou uns 12° e o tabuleiro teve grandes deslocamentos permanentes (sem desabar). O relatório da FHWA registra que pontes sobre a ruptura de superfície nos terremotos de 1999 em Taiwan e na Turquia foram muito afetadas pela deformação permanente do chão.
- Licença poética: com 6 m de deslocamento e uma ponte rígida, o tabuleiro quebra mais do que no caso de Bolu; o carro, a ponte e o vale são desenho; a cena 2 mostra só a ruptura (o desenho não indica vítimas).
- Fontes:
  - https://geerassociation.org/components/com_geer_reports/geerfiles/Duzce_1999/tunnel.htm (viaduto de Bolu, terremoto de Düzce)
  - https://www.fhwa.dot.gov/publications/research/infrastructure/structures/00146.pdf (FHWA: pontes na ruptura de superfície, Taiwan e Turquia, 1999)
  - https://earthquake.usgs.gov/earthquakes/events/1906calif/18april/historical.php (deslocamentos de 1906)
  - https://pubs.usgs.gov/gip/earthq3/move.html (estradas e cercas deslocadas em 1906)

## Sugestão de uso (você decide)
Cena 1 logo depois do estalo do plano 1 ("é assim que o cinema mostra...") e cena 2 em seguida ("...mas de verdade o chão desliza de lado e quebra o que é rígido"). Falas opcionais: "No cinema, a pista abre e engole o carro." / "Na vida real, o chão desliza de lado, e a ponte rígida quebra."

## Gerar
```
python3 sfx_carro.py cratera && python3 build.py cratera      # idem para: ponte
cd ../.. && PAGE=svg/terremoto_carro/cena_cratera.html FR=<pasta> VW=1080 VH=1920 node render_svg.js <w> 4 30   # 4 workers
ffmpeg -framerate 30 -i <pasta>/f%05d.jpg -i svg/terremoto_carro/cena_cratera_sfx.mp3 -c:v libx264 -b:v 3200k -pix_fmt yuv420p -c:a aac -b:a 160k -shortest svg/terremoto_carro/carro_cratera.mp4
node quadros.js cena_cratera.html <prefixo> t1 t2 …   # quadros soltos (rodar de svg/terremoto_carro, sem NODE_PATH)
```
