# Mestres da Gravidade 🐐

Short 3D (Three.js), 1080×1920, 30 s, 5 planos, estilo documentário (câmera lenta nas escaladas e no salto, luz dourada do pôr do sol). Refeito do zero em 3D a partir do vídeo 2D "Por Que as Cabras Escalam Tudo?" e do roteiro que você mandou. A cabra é um **bode-montês modelado em código** (corpo, pernas com cinemática inversa, cascos fendidos que abrem, chifres anelados, olho âmbar de pupila horizontal e **pelo de verdade**: ~15 mil fios por animal que balançam com o vento). **Marca HRYZ** na placa amarela da orelha (visível no close da arganeira e nos closes do rosto no fim). Cores vivas: céu azul-violeta com horizonte dourado, rocha com veios de ferrugem e líquen, folhas verdes, casas coloridas.

## Cenas (seu roteiro, sem mudar palavra) e o que aparece
| tempo | cena | o que aparece | som |
|---|---|---|---|
| 0:00–0:05 | O Desafio Impossível (montanha) | plano aberto do paredão; **zoom rápido** (1,2 s) revela o bode parado numa saliência mínima; o vento balança o pelo; ele firma o casco (a pedrinha cai) | vento grave cortando as rochas, silêncio tenso, estalo seco do casco (4,7 s) |
| 0:05–0:12 | A Escalada Vertical (montanha → transição) | **contra-plongée** acompanhando os saltos de saliência em saliência em câmera lenta; **macro dos cascos fendidos** (os dedos abrem) pousando na rocha; no ápice do salto entre as duas pontas, **match cut** (silhueta do bode contra o sol) | batida grave de tambor/coração sincronizada com cada decolagem e pouso |
| 0:12–0:20 | O Pomar nas Alturas (árvores) | arganeira retorcida numa paisagem árida; a câmera sobe pelo tronco e revela **cinco cabras** nos galhos altos e finos mastigando folhas; uma olha direto para a lente, mastigando sem pressa | farfalhar, mastigar, cordas em **pizzicato** leve e curiosa |
| 0:20–0:26 | O Telhado Urbano (casas) | corte seco para o vilarejo de pedra e telhas; o bode caminha pela cumeeira contra o céu do fim de tarde, para na ponta e olha a rua | latidos distantes, brisa, cascos nas telhas (um por apoio) |
| 0:26–0:30 | O Salto Final (encerramento) | plano detalhe do rosto iluminado pelo sol poente; o bode salta do telhado para o muro alto e para em equilíbrio perfeito; **corte seco para preto** (29,72 s) | um acorde de violoncelo (ré maior) e o som seco da aterrissagem (28,8 s) |

## Narração / legenda (suas falas)
| tempo | fala |
|---|---|
| 0:01 | "Para eles, a gravidade é apenas uma sugestão." |
| 0:14 | "De paredões verticais..." |
| 0:21 | "...a galhos e telhados." |
| 0:27 | "Onde houver um apoio, eles chegam." |

O vídeo principal sai **sem legendas** (regra do canal); a versão `mestres_da_gravidade_legendas.mp4` tem as quatro falas na tela, nos mesmos tempos.

## Decupagem (diretor)
| # | Plano | Tempo | Tamanho e ângulo | Lente e movimento (motivo) | Luz, foco e transição |
|---|---|---|---|---|---|
| 1 | desafio | 0–5 | do grande plano geral ao plano geral do bode, altura dos olhos | **dolly-in rápido** (de 17 m a 4 m em 1,2 s) revelando o herói; depois push-in lento com órbita leve (tensão) | luz rasante dourada pela esquerda, sombra comprida do bode na rocha; vento no pelo |
| 2 | escalada | 5–12 | contra-plongée (de baixo, poder e vertigem); macro dos cascos; ápice em silhueta | câmera sobe com o animal; no macro, segue o casco até o pouso; no fim, câmera de baixo para o céu | câmera lenta (movimento a 30% da velocidade, como 120 fps); **match cut** no ápice: bode contra o disco do sol → tronco da arganeira com o sol atrás |
| 3 | pomar | 12–20 | grande plano geral rente ao chão → crane subindo pelo tronco → close | tilt up e subida em espiral (revelação das cinco cabras); push-in final até a cabra que encara a lente | contraluz dourado, copa translúcida, frutos amarelo-esverdeados |
| 4 | telhado | 20–26 | plano geral de baixo (recorte contra o céu), depois 3/4 mais próximo | travelling lateral acompanhando o bode; a câmera sobe para o 3/4 quando ele para | céu violeta→laranja, sol baixo; telhas terracota |
| 5 | salto | 26–30 | close do rosto → plano geral lateral → plano médio | pull-out que acompanha o salto; trava no equilíbrio; corte seco para preto | sol poente no rosto; fim seco |

## Som (sfx_mestres.py, tudo sintetizado)
Pedido seu: trilha leve (cordas em pizzicato) e acorde de violoncelo, então este vídeo **tem música sintetizada** (exceção à regra "sem música"): pizzicato em ré maior pentatônico a 100 bpm (12,2–20 s) e um acorde de violoncelo em ré maior na aterrissagem. Efeitos: vento grave, whoosh do zoom, estalo de casco, pedrinha, batida de tambor/coração em cada decolagem e pouso (5,3 / 6,65 / 6,8 / 8,15 / 8,3 / 9,8 / 10,0 / 10,8 / 10,9 s), farfalhar e mastigar, latidos longe, cascos na telha.

## Fatos, fontes e ressalvas (conferidos em 15/11)
- **Casco fendido: parede dura e sola macia, dedos que se movem de forma independente e abrem para agarrar pequenos relevos** (descrição comum sobre o íbex; divulgação, não estudo de bancada): https://www.discoverwildlife.com/mammals/alpine-ibex-climbing · https://gizmodo.com/an-ode-to-the-magnificent-feet-of-mountain-goats-1749232371 · https://en.wikipedia.org/wiki/Cloven_hoof
- **Cabras sobem em arganeiras no Marrocos** (estação seca, atrás de folhas e frutos; os pastores ajudam podando e ensinando os cabritos; o estudo citado em reportagens fala em até 74% do tempo de forrageio nas copas no outono seco): https://www.atlasobscura.com/articles/8603 · https://phys.org/news/2017-05-tree-climbing-goats-disperse-seeds.pdf
- **Encenação, não registro:** a "saliência de menos de cinco centímetros", o caminho de saliências até o topo e o salto entre as duas pontas são **dramatização** (íbex sobem paredões muito íngremes, mas não há medida de 5 cm que eu tenha conferido). **Cinco cabras no mesmo galho alto** e **um bode andando na cumeeira de um telhado de vilarejo** também são encenação (cabras em telhados e árvores aparecem em vídeos e reportagens, mas aqui é ficção visual). O vilarejo é inventado (uma das casas de fundo vem da biblioteca, CC0 drummyfish, com a caixa de correio Hryz).
- **"120 fps":** o vídeo sai a 30 fps; a câmera lenta é feita **desacelerando o movimento** (o bode e o vento a ~30–50% da velocidade), que dá o mesmo efeito de tela.
- O bode é desenho 3D estilizado (íbex-ibérico/alpino): proporções realistas, mas não é um modelo científico.

## Arquivos e como gerar
`index.html` (página do vídeo), `js/cabra.js` (cabra 3D com pelo), `js/mundoP.js` (paredão), `js/mundoA.js` (arganeira), `js/mundoV.js` (vilarejo), `js/planos.js` (câmeras e movimento), `js/base.js` (luz, céu, texturas), `js/motor.js` e `js/util.js`, `harness.js` (servidor + navegador sem GPU), `render.js`, `montar.sh`, `sfx_mestres.py`, `quadros.js` (quadros soltos), `dev.html`/`dev2.html`/`tiro.js` (testes).
```
cd videos/mestres_gravidade
python3 sfx_mestres.py                                               # mestres_sfx.mp3
node render.js --trabalhadores 4 --saida <pasta>                     # 900 quadros (~20 min em 4 núcleos)
bash montar.sh <pasta> mestres_sfx.mp3 mestres_da_gravidade.mp4      # acabamento de cor, vinheta e grão
node quadros.js <prefixo> t1 t2 …                                    # quadros soltos
```

## Título e descrição (sugestão)
**Mestres da Gravidade 🐐** — Bodes e cabras escalam paredões, árvores e até telhados. Para eles, a gravidade é apenas uma sugestão. #cabras #natureza #curiosidades
