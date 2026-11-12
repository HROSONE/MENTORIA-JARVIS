# E se você acordasse com 2 centímetros de altura? Roteiro para narrar

Short vertical de 43,2 s em animação SVG, sem legenda e sem música, só com efeitos sonoros. São 8 cenas e o último plano emenda no primeiro (loop).
Você aparece em silhueta azul-marinho sem rosto. O gato é o mesmo do Short da CIA (`svg/gato`).
É uma hipótese ("e se…"), mas a física por trás de cada perigo é real e tem fonte (veja abaixo).

| Tempo | Fala |
|---|---|
| 0:00,1 – 0:03,9 | E se você acordasse amanhã com dois centímetros de altura? |
| 0:04,0 – 0:08,9 | A primeira coisa que você ia ver era essa: o seu gato… achando que você é um brinquedo. |
| 0:09,0 – 0:13,6 | Você pula da cama pra fugir, e aqui vem a parte estranha: a queda não te machuca. |
| 0:13,7 – 0:20,6 | Um ratinho pode cair no fundo de um poço de mina de quase um quilômetro, levar um susto e sair andando. No seu tamanho, o ar te segura. |
| 0:20,7 – 0:26,8 | Mas aí bate a sede. E uma gota d’água vira uma armadilha: a água que gruda no seu corpo pesa tanto quanto você. |
| 0:26,9 – 0:32,8 | E você vai sentir frio e fome o tempo todo. Um rato come um quarto do próprio peso por dia só pra se manter quente. |
| 0:32,9 – 0:37,4 | Então você vai até a cozinha… e uma migalha de pão vira o banquete da sua vida. |
| 0:37,5 – 0:42,9 | Até que você escuta um ronronado bem atrás de você. Se inscreve… antes que ele te ache. |

São 155 palavras, cerca de 3,6 por segundo. Corte o áudio em "ache" para o loop ficar limpo.

## Decupagem (direção de cena)

| # | Cena | Plano e ângulo | Movimento e motivo | Luz e foco |
|---|---|---|---|---|
| 1 | Gancho: o gato olhando | Contra-plongée do travesseiro, grande-angular: você no terço de baixo, o rosto do gato ocupando o alto (o gato vira um gigante) | Push-in lento; as pupilas dilatam (interesse do gato) | Sol da manhã pela janela, poeira brilhando; quarto desfocado |
| 2 | A pata | Plongée, ponto de vista do gato: você pequeno e indefeso | A sombra chega antes da pata; tremor no impacto; você foge | Luz clara e difusa no travesseiro |
| 3 | O pulo da cama | Plano geral lateral: a beira do colchão vira um penhasco, o gato observa ao fundo | Você corre e pula; a câmera desce junto (usa a altura do vertical) | Fundo desfocado, gato fora de foco |
| 4 | A queda que não machuca | Travelling vertical: os móveis passam para cima; um ratinho cai ao lado | Linhas de vento; no fim, pouso fofo no tapete e o rato sai correndo | Tapete em close, fios balançando |
| 5 | A gota | Macro na altura dos olhos, fundo de banheiro desfocado | Push-in quando você toca a água; a água sobe pelo braço e te puxa | Luz fria e reflexos na gota |
| 6 | Frio e fome | Plano médio que fecha no visor "0,1 g" e volta para você tremendo | Zoom no número, zoom de volta; bafo de frio; barriga roncando | Luz azul de manhã fria |
| 7 | A migalha | Travelling lateral baixo, junto ao chão | Você empurra a migalha, que rola; uma formiga passa ao fundo | Luz quente da cozinha |
| 8 | O ronronado | Plano médio: uma sombra enorme cobre você, você vira; corta para o contra-plongée do gancho | A sombra escurece o quadro; volta ao gato (loop) | Quadro escurecendo |

Nada importante fica nos 20% de baixo do quadro nem na faixa da direita, que o app do Shorts cobre.

## Fatos e fonte
Todos os perigos vêm do ensaio *On Being the Right Size*, de J. B. S. Haldane (1926): [texto no marxists.org](https://www.marxists.org/archive/haldane/works/1920s/right-size.htm).
- **Queda:** "You can drop a mouse down a thousand-yard mine shaft; and, on arriving at the bottom, it gets a slight shock and walks away" (desde que o chão seja macio). Mil jardas são cerca de 914 m, por isso "quase um quilômetro". O motivo é que a resistência do ar cresce com a superfície do corpo, e o peso cai muito mais rápido que a superfície quando você encolhe.
- **Água:** "A wet mouse has to carry about its own weight of water", e um inseto que vai beber está "in as great danger as a man leaning out over a precipice". Com 2 cm você pesa cerca de 0,1 g, e uma película de água sobre o corpo pesa mais ou menos isso.
- **Comida e frio:** "a mouse eats about one quarter its own weight of food every day, which is mainly used in keeping it warm".
- **Peso na balança:** um adulto de 70 kg reduzido para 2 cm pesa cerca de 0,1 g (70 kg × (2/175)³), por isso o visor mostra "0,1 g".

## Arquivos
- **Animação:** `acordasse_src.html` (cenas e decupagem nos comentários); `_gato.js` (o gato do Short da CIA); `build.py` monta `acordasse.html`.
- **Sons:** `sfx_acordasse.py`, todos sintetizados.
- **Render:** a partir de `videos/`, rode `PAGE=svg/acordasse/acordasse.html FR=<pasta> VW=1080 VH=1920 node render_svg.js <i> 4 30` em 4 processos e depois o ffmpeg (cerca de 18 MB).
