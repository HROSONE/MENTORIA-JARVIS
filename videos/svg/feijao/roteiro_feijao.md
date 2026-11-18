# "Engoliu um feijão 🌱 (ficção)": Short 2D (SVG), comédia absurda

1080×1920, 30 fps, ~34 s. Um herói só: CARLOS (careca de topete penteado, nariz de batata, bigode, corpo de pera, camisa mostarda).
Fórmula: o absurdo no quadro 0 → cada cena piora → ele vira a própria planta → lá no alto o começo de novo (laço).
Sem legendas (texto só no mundo: o calendário "ONTEM", a placa da rua). Sem música, só gravações reais e estalos.
É ficção: engolir um feijão não faz brotar planta no corpo, e a legenda e o título dizem que é ficção.

## Falas para o dono narrar
| tempo | o que aparece | fala |
|---|---|---|
| 0,0–3,0 | Espelho do banheiro, de manhã. Carlos sonolento… PLIM: um broto sai da orelha. Ele congela, suando. | "O Carlos acordou com um probleminha." |
| 3,0–6,5 | Ontem à noite (calendário "ONTEM"): jantando, ele boceja; um feijão quica na colher e voa direto na boca. GULP. | "Ontem ele engoliu um feijão. Inteiro. Sem querer." |
| 6,5–10,5 | Espelho: ele puxa o broto; o broto estica feito elástico e estala de volta. Espirra… folhas saem do nariz. | "Ele tentou arrancar. Ele tentou espirrar. Piorou." |
| 10,5–15,0 | Na rua, de chapéu para disfarçar; o chapéu sobe sozinho em cima dos ramos; vagens penduradas; um pombo pousa e come uma. | "No trabalho ninguém percebeu. Quase ninguém." |
| 15,0–19,0 | Começa a chover. Ele olha para cima, desesperado. O sol sai. FUUU: ramos enrolam o corpo, os sapatos estouram em raízes. | "Aí choveu. E feijão adora chuva." |
| 19,0–25,5 | A câmera sobe junto: ele vira um pé de feijão gigante (o bigode e o nariz no caule), passa prédio, avião, passarinhos, fura as nuvens. | "Ele cresceu, cresceu… e furou as nuvens." |
| 25,5–30,5 | Em cima das nuvens, outro homem janta sentado numa nuvem e boceja; uma vagem do Carlos se abre, um feijão cai… direto na boca. GULP. | "Lá em cima, alguém estava jantando…" |
| 30,5–34,0 | O homem da nuvem, no espelho de manhã: PLIM, um broto na orelha (laço). | "…e amanhã ele vai acordar com um probleminha." |

Título: **Engoliu um feijão 🌱 (ficção)**.

## Decupagem (diretor)
| plano | função | tamanho / ângulo | lente | movimento (motivo) | luz | transição |
|---|---|---|---|---|---|---|
| P1 espelho | gancho: a imagem absurda no 1º segundo | close no reflexo, frontal à altura dos olhos (o espelho enquadra o rosto) | normal | push-in lento depois do PLIM (cresce a tensão) | manhã fria, janela atrás dele | corte seco no olhar dele para o broto |
| P2 ontem | causa: como aconteceu | plano médio, lateral, mesa de jantar | normal | câmera parada; o feijão faz a trajetória (os olhos seguem o feijão) | luz amarela de lâmpada (noite = cor diferente) | corte no GULP; whip de volta ao espelho |
| P3 puxa | 1ª piora | close médio, frontal no espelho | normal | tremidinha no estalo (impacto) | igual ao P1 (mesmo lugar) | corte no espirro |
| P4 rua | 2ª piora em público | plano geral, ligeiro contra-plongée (o chapéu subindo) | grande-angular | travelling lateral acompanhando ele andar | sol de dia | o pombo sai do quadro, corte |
| P5 chuva | a virada | plano americano, plongée (ele pequeno debaixo da chuva) | normal | quando o sol sai: zoom-out rápido (a planta explode) | cinza → sol forte | a câmera começa a subir (liga com o P6) |
| P6 cresce | escala absurda | plano geral vertical, a câmera sobe com o topo da planta | tele → grande-angular | tilt/pedestal subindo sem parar (a planta puxa a câmera) | dia → céu alto azul profundo | fura a nuvem (branco ocupa a tela) |
| P7 nuvem | a revelação | plano médio, frontal, o homem na nuvem | normal | parada; o feijão cai de cima para baixo no quadro | luz dourada acima das nuvens | corte no GULP |
| P8 laço | o fim que é o começo | igual ao P1 (mesma composição, outro homem) | normal | mesmo push-in | manhã | o último quadro casa com o primeiro |

## Arquivos
`carlos.js` (personagem com volume, a planta em estágios por `planta` 0..1, raízes por `raiz`), `cenas.js` (planos), `quadros.js` (render), `folha_carlos.js` (folha de design).
