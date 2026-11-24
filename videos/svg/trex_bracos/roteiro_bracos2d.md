# "Ele não alcança a própria boca 🦖" — Short 2D (SVG), comédia, bracinhos de perfil

1080×1920, 30 fps, 34 s. Dia de fim de tarde no Cretáceo (araucárias, vulcão, névoa dourada), um herói só: REX, de perfil, com volume
(sombra própria e luz de recorte em cada parte), escamas, pintas e sobrancelha óssea que faz a expressão.
Fórmula: o absurdo no quadro 0 → a falha se repete e escala → a virada (é forte!) → a pergunta → a hipótese → o "e se" → a resposta → laço.
Sem legendas (só texto no mundo: réguas "1 m", fita "12 m", etiqueta "~200 kg"). Sem música: só gravações reais (sfx_bracos2d.py).

## Falas para o dono narrar (tempos = os planos de cenas.js)
| tempo | o que aparece | fala |
|---|---|---|
| 0,0–3,2 | De perfil: a carne no bracinho; o braço sobe tudo que pode, a cabeça desce, a boca abre… sobra o vão. A carne cai e quica. | "Esse é um dos maiores caçadores que já existiram… e ele não consegue levar comida à boca." |
| 3,2–6,4 | Um mosquito pousa na ponta do focinho; o bracinho sobe tremendo e não chega; ele vai até uma araucária e esfrega o focinho. | "Nem coçar o nariz. A mão simplesmente não chega." |
| 6,4–9,6 | Uma paleontóloga numa pedra estica o braço ao lado do dele: as duas réguas dão 1 m. A câmera abre e a fita mostra 12 m. | "O braço tinha um metro, igual ao seu. Num bicho de doze." |
| 9,6–13,0 | Ele faz rosca bíceps com uma tora; o músculo incha; a etiqueta "~200 kg" balança; cara de orgulho. | "Mas não era fraco: só o bíceps puxava uns duzentos quilos." |
| 13,0–15,0 | Olha os bracinhos e dá de ombros, duas vezes. | "Então por que ficou tão curto?" |
| 15,0–20,5 | Uma carcaça; os T. rex pulam em cima e vira uma nuvem de briga com estrelinhas e pedaços de carne voando. | "Uma ideia de 2022: e se eles comessem em grupo? Cabeças gigantes mordendo pra todo lado." |
| 20,5–25,0 | "E se?": o braço dele cresce, entra na nuvem… NHAC. Pulinho, estrelinhas, braço enfaixado. | "Braço comprido ali… virava petisco." |
| 25,0–29,5 | Ele come tranquilo com os bracinhos encolhidos; mordidas dos vizinhos passam raspando e erram. | "Curtinho, ficava longe dos dentes." |
| 29,5–34,0 | De volta ao começo, um pouco mais lento: a carne, o vão, a carne cai (laço). | "É só uma hipótese. Mas explicaria por que ele nunca alcança a comida." |

Título: **Ele não alcança a própria boca 🦖** (ou "O T. rex não alcança a boca 🦖").

## Fatos e fontes
- Um dos maiores carnívoros terrestres; adulto de ~12–13 m (Sue, FMNH PR 2081, ~12,3 m: Field Museum).
- As mãos não alcançavam a boca: Padian 2022 (Acta Palaeontologica Polonica 67(1):63–76); Field Museum (Sue).
- Braço de ~1 m, mais ou menos o alcance de um braço humano: Binghamton University; Discover Magazine.
- Só o bíceps: estimativa de ~1.955 N, uns 200 kg por braço (Carpenter & Smith 2001). É estimativa.
- Hipótese de 2022: os braços encolheram para não serem mordidos em carcaças disputadas por vários tiranossauros (Padian 2022). Comer em grupo também é hipótese (há fósseis de vários tiranossauros juntos: Titus et al. 2021), por isso a fala diz "e se".
- O REX é desenho de comédia: as gags exageram (ninguém viu um T. rex coçando o nariz).

## Arquivos
`rex.js` (personagem de perfil articulado, volume automático), `cenas.js` (9 planos), `quadros.js` (render), `sfx_bracos2d.py` (som), `folha_rex.js` (folha de design).
Montar: `node quadros.js pasta` → `ffmpeg -framerate 30 -i pasta/f%05d.jpg -i som.wav ... saida.mp4`.
