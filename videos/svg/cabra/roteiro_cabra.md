# Por Que as Cabras Escalam Tudo? 🐐

Short 2D (SVG), 1080×1920, 27,8 s, 8 planos, 73 palavras (2,6 por segundo). **Primeiro segundo = o ponto principal:** o quadro 0 já é o close da cabra mastigando ao pôr do sol (olho âmbar de pupila horizontal, que **não pisca**, e a placa HRYZ na orelha) e, de imediato, a câmera recua rápido (em ~1,5 s) e revela que ela está na ponta de um precipício. O último plano repete o recuo ao contrário e termina **exatamente no quadro 0** (loop). A marca HRYZ Animation está na **placa amarela da orelha** (planos 1, 6, 7 e 8) e no **microscópio** (plano 4, canto da tela). Sem legendas na tela; só rótulos curtos dentro da cena (DURA, MACIA, TUBOS, QUERATINA) e o painel do microscópio. Câmera sempre em movimento.

## Narração (narr.json) — a gravação é sua
| bloco | tempo | texto | o que muda na tela |
|---|---|---|---|
| b1 | 0,1–2,9 | Essa cabra come tranquila, na beira de um precipício. | close da cabra mastigando uma folha, contraluz do pôr do sol; a câmera recua rápido e mostra a rocha despencando; uma pedrinha cai da borda (3 toques) |
| b2 | 3,25–6,95 | O segredo é o casco: duas metades que abrem e agarram. | corte para o casco de frente, pousando numa quina de pedra; os dois dedos se abrem, encaixam nas encostas e apertam |
| b3 | 7,1–10,25 | A borda é dura; a sola, macia, molda-se à rocha. | corte lateral do casco: parede escura (DURA), sola rosada (MACIA) que se amolda aos relevos conforme a pressão sobe |
| b4 | 10,5–13,4 | Ao microscópio, é um feixe de tubinhos de queratina. | lente do microscópio: tubos paralelos, depois o feixe visto de ponta (TUBOS) e, por fim, um tubo com lamelas e filamentos (QUERATINA); a barra de escala e a ampliação acompanham o zoom |
| b5 | 13,7–16,3 | Pernas fortes e equilíbrio fazem o resto. | silhueta em contraluz: a cabra toma impulso, voa sobre o vão em câmera lenta no ponto mais alto, pousa com os quatro cascos num pináculo e se equilibra |
| b6 | 16,6–20,2 | Lá em cima, poucos predadores chegam, e elas acham comida e sal. | o lobo no pé do paredão salta, arranha a rocha e cai; a câmera sobe passando por cabras nos patamares até o bode (chifres grandes e barba) no topo; corte para a cabra lambendo a crosta de sal |
| b7 | 20,5–24,7 | No Marrocos, na seca, cabras sobem em arganeiras atrás dos frutos. | plano geral da arganeira com cabras nos galhos; a câmera sobe e entra na copa até a cabra que come os frutos |
| b8 | 25,0–26,6 | E ela continua comendo. | volta ao penhasco e a câmera entra de novo no close do quadro 0 (loop) |

## Decupagem (diretor)
| # | Plano | Tempo | Tamanho e ângulo | Lente e movimento (motivo) | Luz, foco e transição |
|---|---|---|---|---|---|
| 1 | abre | 0–3,2 | do close extremo (perfil) ao plano geral alto | **dolly-out rápido** com paralaxe (o céu e o sol não mudam, a cabra encolhe: sente-se o vazio atrás dela), depois descida lenta mostrando a queda; folhas desfocadas cruzam a lente | contraluz quente, sol baixo atrás do focinho, luz de recorte no pelo; poeira dourada flutuando |
| 2 | casco | 3,2–7,0 | macro de frente, levemente plongée | descida da câmera com a pata, push-in até os dedos; tremor curto só no pouso e no aperto (motivo: peso e pressão) | luz do sol à direita (brilho no casco), fundo desfocado em bokeh, poeira no pouso e no aperto |
| 3 | sola | 7,0–10,35 | corte lateral, plano médio | varredura (scanner) revela o corte; push-in lento e giro leve; a câmera acompanha a sola | palco escuro, rótulos DURA e MACIA com realce de cor; a rocha é o chão do palco |
| 4 | micro | 10,35–13,55 | circular de microscópio | **zoom contínuo (~36×)**: tubos longitudinais, corte transversal, tubo único; giro lento (motivo: mergulho na estrutura) | falsa cor ciano (estilo MEV), moldura com graduação, ampliação e barra de escala; marca HRYZ no canto |
| 5 | salto | 13,55–16,45 | plano geral baixo, silhueta | câmera acompanha o arco; rampa de velocidade (rápido no impulso, **lento no alto**, rápido no pouso) | sol enorme atrás do vão, luz de recorte no contorno da cabra |
| 6 | alto | 16,45–20,35 | de baixo para cima; fecha em close | **tilt/crane vertical** do pé do paredão ao topo (motivo: do perigo para o refúgio); corte para close do sal com push-in | rocha iluminada pela direita; o bode contra o sol; no close, brilho dos cristais |
| 7 | arganeira | 20,35–24,85 | plano geral, sobe até close médio | push-in com subida e giro leve até a cabra da copa | contraluz quente, copa verde translúcida, frutos amarelo-esverdeados |
| 8 | final | 24,85–27,8 | geral → close do quadro 0 | recuo do plano 1 ao contrário: **o último quadro é igual ao primeiro** | mesma luz; emenda direto no loop |

## Som (sfx_cabra.py, tudo sintetizado, sem música)
Vento por trecho (forte no penhasco e no paredão, fraco no chão, folhas e grilos na arganeira); mordidas de folha/fruto a 1,7 por segundo, sincronizadas com a mandíbula; whoosh do recuo rápido; a pedrinha quicando 3 vezes (e a terceira, distante); o casco batendo na quina, os dedos raspando e abrindo, o aperto com poeira; varredura do scanner, pancada seca em DURA e som úmido que enche em MACIA; zumbido de vácuo do microscópio com tiques na barra de escala; impulso, ar e quatro batidas de casco no pouso do salto; rosnado, respiração e garras do lobo, subida da câmera, balidos da cabra e do bode; lambidas no sal com cristais; balidos e cascos nos galhos; e o vento emendando o fim ao começo.

## Fatos e fontes (conferidos em 14/11) — com ressalvas honestas
- **Casco fendido, parede dura e sola macia.** Fontes populares descrevem o casco do íbex como duas metades, com uma parede externa dura e uma sola macia e flexível que se molda à rocha; as duas metades se movem de forma independente, como pinças, e se abrem para agarrar pequenos relevos. Não achei estudo revisado por pares que meça isso em cabras; os textos são divulgação, por isso a fala diz só o que é descrito: "borda dura, sola macia, duas metades que abrem e agarram".
  - https://www.discoverwildlife.com/mammals/alpine-ibex-climbing
  - https://gizmodo.com/an-ode-to-the-magnificent-feet-of-mountain-goats-1749232371
  - https://en.wikipedia.org/wiki/Cloven_hoof
- **Tubinhos de queratina.** A parede do casco dos ungulados é feita de túbulos de queratina (cilindros microscópicos, com um oco no centro) embutidos numa matriz de queratina entre os túbulos; os diâmetros citados são de uns 40 a 100 µm. **Esses dados são principalmente de cavalo, boi e ovelha**: para a cabra, é uma extrapolação de anatomia comparada. A escala do vídeo (1 unidade = 1,5 µm) e os valores da barra são ilustrativos.
  - https://en.wikivet.net/Hoof_-_Anatomy_&_Physiology
  - https://www2.lbl.gov/ritchie/Library/PDF/2019_Huang-EquineHoof%20ActaBio.pdf (parede do casco equino: túbulos e matriz)
- **Predadores.** A ideia de que o terreno íngreme protege é comum nas divulgações sobre íbex, mas **não achei estudo testando isso como motivo**; por isso a fala é "poucos predadores chegam", não "fogem de todos". O lobo do vídeo é um predador genérico de montanha.
- **Sal e comida.** Íbex-dos-alpes sobem a parede quase vertical da barragem de Cingino (Itália) para lamber sais minerais da pedra; vários relatos citam a falta de sal na dieta vegetariana como motivo. A crosta de sal do plano 6 é ilustração.
  - https://en.wikipedia.org/wiki/Cingino_Dam
  - https://mentalfloss.com/article/80269/see-how-alpine-ibex-defies-gravity-all-lick-salt
  - https://assets.atlasobscura.com/places/goats-of-the-cingino-dam
- **Arganeira no Marrocos.** No sudoeste do Marrocos, na estação seca, cabras sobem nas arganeiras para comer folhas e frutos; um estudo reportado pela imprensa (*Frontiers in Ecology and the Environment*, 2017) diz que no outono seco um rebanho pode passar até 74% do tempo de forrageio nas copas, e que as cabras cospem os caroços (71,5% viáveis). **Ressalva:** os pastores ajudam (podam, ensinam os cabritos), então não é só instinto; por isso a fala diz "sobem", sem "sozinhas".
  - https://www.atlasobscura.com/articles/8603
  - https://phys.org/news/2017-05-tree-climbing-goats-disperse-seeds.pdf
  - https://www.discovermagazine.com/tree-climbing-goats-keep-the-desert-gold-growing-297
- **Licença poética e arte.** A cabra é um desenho inspirado em fotos reais (cabra-alpina e íbex-ibérico, referência enviada pelo dono): pelo fio a fio, chifre anelado, olho âmbar de pupila horizontal, placa HRYZ na orelha; **o pescoço foi refeito mais fino e longo depois do seu aviso** (a primeira versão estava grossa e sem forma). **Cabras piscam**: o olho aberto o tempo todo é direção de arte ("ela nem pisca"), a fala não afirma o contrário. O bode do plano 6 tem chifres exagerados para ler de longe. O salto, o vão e o pináculo são dramatização.

## Arquivos
`_base.js` (ferramentas: splines, **gerador de pelo `pelo()`**, tubos), `_cabra.js` (cabeça: crânio, mandíbula que mastiga, orelha com placa, chifre anelado, olho, bigodes, tufos ao vento, língua; corpo: tronco+pescoço por pose `alerta/comer/lamber`, pernas, rabo, versão bode; `cabraCorpo`, `cabeca`, `ptCab`), `_cenario.js` (céu, sol, serras, penhasco, arbusto, aves, poeira), `_casco.js` (casco de frente, corte com sola deformável, microscópio), `_salto.js` (silhueta com poses por ângulos), `_alto.js` (lobo, paredão, sal), `_arganeira.js` (árvore), `_cenas.js` (linha do tempo e câmeras), `_dev.js` (teste da arte), `sfx_cabra.py`, `narr.json`.

## Gerar
```
python3 sfx_cabra.py && python3 build.py            # cabra_sfx.mp3 e cabra.html
cd ../.. && PAGE=svg/cabra/cabra.html FR=<pasta> VW=1080 VH=1920 node render_svg.js <w> 4 30     # 4 workers (w=0..3); 835 quadros
ffmpeg -framerate 30 -i <pasta>/f%05d.jpg -i svg/cabra/cabra_sfx.mp3 -c:v libx264 -b:v 3200k -pix_fmt yuv420p -c:a aac -b:a 160k -shortest -movflags +faststart svg/cabra/cabras_escalam_tudo.mp4
cd svg/cabra && node quadros.js [pagina.html] <prefixo> t1 t2 …     # quadros soltos
```

## Título e descrição (sugestão)
**Por Que as Cabras Escalam Tudo? 🐐** — Cabras e bodes sobem penhascos e até árvores. O segredo está no casco: duas metades que abrem e agarram, borda dura, sola macia e, de perto, um feixe de tubinhos de queratina. #cabras #ciencia #natureza #curiosidades
