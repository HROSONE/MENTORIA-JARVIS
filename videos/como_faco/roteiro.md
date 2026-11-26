# "Como eu faço um vídeo": motion design com narração sintética

- **Formato:** Short vertical 1080×1920, 30 qps, cerca de 72 s.
- **Visual:** motion design (formas chapadas, cartões de código, gráficos) com os modelos 3D reais do projeto (moto do Blender e Kael) renderizados ao vivo no Three.js.
- **Voz:** criada aqui, rodando no próprio computador, sem serviço externo.
  - Modelo Kokoro-82M (licença Apache 2.0).
  - Mistura de 70% da voz `pm_alex` com 30% da `pm_santa`, a 1,08× de velocidade.
  - Conferida com o Whisper: a transcrição sai igual ao texto.
- **Som:** sem música. Woosh e cliques curtos da biblioteca (`biblioteca3d/sons`), baixos.
- **Narrador na tela:** um orbe com uma onda que pulsa com a voz. É "eu" falando: nada de rosto nem de marca real.

## Fatos (todos medidos neste projeto)
- A moto do Blender tem cerca de 156 mil triângulos (`criar_moto.py` → `moto.glb`).
- **Render de um quadro 1080×1920, medido em 25/11:**

  | Motor de desenho | Tempo por quadro |
  |---|---|
  | SwiftShader | 14,1 s |
  | llvmpipe, 1 navegador | 2,2 s |
  | llvmpipe, 2 navegadores em paralelo | ~0,5 s |

  A imagem sai igual: diferença média < 1/255 (DIRETRIZES §9a).

## Falas e decupagem
| t (s) | Fala | Plano / ângulo / lente | Movimento e motivo | Herói e luz | Transição |
|---|---|---|---|---|---|
| 0,0–6,0 | "Esse vídeo inteiro foi feito sem câmera, sem programa de edição e sem placa de vídeo. Só código." | **Quadro 0:** close 3/4 da moto vermelha, de baixo; grande-angular. Linhas de código passam atrás, ao fundo. | Órbita rápida. Em "só código", a moto vira malha de arame e volta a ser sólida. | A moto com borda de luz, fundo azul-noite. Os três ícones (câmera, editor, placa) entram e são riscados. | Pull-out |
| 6,0–10,0 | "E eu vou te mostrar o caminho todo, da ideia até o arquivo final." | Plano geral: o mapa de 6 etapas (Ideia → Roteiro → Modelos → Cena → Render → MP4) | Pull-out que revela o mapa; o orbe-narrador corre pela linha | O orbe aceso; as etapas em cinza | A câmera mergulha na etapa 2 (match cut) |
| 10,0–18,0 | "Primeiro, o roteiro… a decupagem… o ângulo, a lente e o movimento… Como num filme." | Plano médio: cartão de roteiro com tempos, depois a tabela da decupagem | Push-in em cada coluna citada; uma claquete fecha em "como num filme" | A coluna citada acende | Corte na batida da claquete |
| 18,2–29,5 | "Os modelos também são código… peça por peça… 156 mil triângulos… gerador… esqueleto e rosto." | Plano detalhe: script → a moto se montando (quadro, rodas, carenagem); contador. Depois o Kael com o esqueleto visível. | Órbita de 360° na moto. Pan até o Kael, com o esqueleto acendendo. | Peça nova com brilho; contador diegético de triângulos | Whip pan |
| 29,9–39,5 | "Aí entra o Three.js… o vídeo é uma função do tempo… a cena se monta sozinha naquele instante." | Plano médio: janela do navegador com a cena e uma barra de tempo `t` | Uma mão-cursor arrasta o `t` para frente e para trás, e a moto anda e volta junto | O número `t = 12,4 s` grande | Zoom na janela |
| 39,9–45,0 | "Um navegador invisível… fotografa cada quadro. Trinta por segundo." | Plano geral: a página → um flash → os quadros saem numa fita de filme | Travelling pela fita, cada vez mais rápido | Contador "30 / s" | A fita vira barra de gráfico (match cut) |
| 45,2–60,0 | **Descoberta:** "não tem placa de vídeo… 14 s… medi tudo… llvmpipe… 2… meio segundo… vinte vezes mais rápido." | Plano médio: gráfico de barras com um relógio | A barra vermelha de 14,1 s se arrasta. Corte seco para a barra de 2,2 s; depois 2 navegadores e 0,5 s. Punch-in no "20×". | Selo "20×" com flash, a única sacudida do vídeo | Pull-out |
| 60,4–64,0 | "No fim, o FFmpeg junta os quadros e o som num MP4." | Plano geral: fita de quadros + onda de som entrando num ícone de arquivo MP4 | Os dois se fundem; o arquivo "carimba" | O ícone MP4 | Zoom no orbe |
| 64,3–71,8 | "E essa voz? Também é código… duas vozes… Agora você sabe como esse vídeo foi feito." | Close do orbe-narrador: duas ondas se juntam em uma | O orbe se abre e revela de novo a moto do quadro 0, em órbita (**loop**) | O orbe, depois a moto | Corte para o quadro 0 |

## Pipeline de produção
- Página `index.html` com uma camada 3D (Three.js: `moto.glb`, `kael.glb`) e uma camada 2D (canvas) por cima. As duas são compostas no `__frame(t)`.
- **Render:** `node render.js --trabalhadores 2` (llvmpipe).
- **Voz:** `voz.py` (Kokoro) gera `narracao.wav` e `tempos.json`, que guiam as batidas da animação.
- **Montagem:** `montar.sh` junta tudo, com os efeitos de som.
