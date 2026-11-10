# Peças do kit cidade

Arquivo gerado por `gerador/gerar.py`; não edite à mão. Medidas em metros (largura x altura x profundidade).

## Ruas e chão

| Peça | O que é | Tamanho (m) | Triângulos | KB | Conexões |
|---|---|---|---|---|---|
| `ruas/rua-reta.glb` | Reta de 12 m, mão dupla, com tracejado central e linhas de borda | 12.00 x 0.15 x 12.00 | 26 | 6.8 | N S |
| `ruas/rua-curva.glb` | Curva de 90° ligando as bordas S e E | 12.00 x 0.15 x 12.00 | 332 | 30.2 | S E |
| `ruas/rua-t.glb` | Entroncamento em T com braços W, E e S, faixas de pedestres e linhas de retenção | 12.00 x 0.15 x 12.00 | 176 | 17.6 | W E S |
| `ruas/rua-cruzamento.glb` | Cruzamento de 4 braços com faixas de pedestres e linhas de retenção | 12.00 x 0.15 x 12.00 | 306 | 26.9 | N E S W |
| `ruas/rua-fim.glb` | Fim de rua (sem saída) com braço vindo do sul | 12.00 x 0.15 x 12.00 | 42 | 7.9 | S |
| `ruas/chao-grama.glb` | Ladrilho de grama 12 x 12 m na altura da calçada (preenche os quarteirões) | 12.00 x 0.00 x 12.00 | 2 | 1.2 | — |

## Rotatórias

| Peça | O que é | Tamanho (m) | Triângulos | KB | Conexões |
|---|---|---|---|---|---|
| `rotatorias/rotatoria.glb` | Rotatória de 36 x 36 m (3 x 3 ladrilhos): ilha central, anel de mão única anti-horário, 4 braços de mão dupla e cantos de grama | 36.00 x 0.15 x 36.00 | 1066 | 86.8 | N E S W |
| `rotatorias/rotatoria-mini.glb` | Mini-rotatória de 12 x 12 m (1 ladrilho): cruzamento com ilha central e setas | 12.00 x 0.15 x 12.00 | 500 | 41.7 | N E S W |

## Calçadas e caminhos de pedestres

| Peça | O que é | Tamanho (m) | Triângulos | KB | Conexões |
|---|---|---|---|---|---|
| `calcadas/calcada-lisa.glb` | Praça/calçadão: ladrilho pavimentado com lajes de 2 m em dois tons | 12.00 x 0.00 x 12.00 | 72 | 7.2 | — |
| `calcadas/calcada-reta.glb` | Caminho de pedestres reto (2,5 m) sobre grama | 12.00 x 0.00 x 12.00 | 20 | 4.1 | N S |
| `calcadas/calcada-curva.glb` | Caminho de pedestres em curva de 90° (ligando S e E) | 12.00 x 0.00 x 12.00 | 50 | 6.5 | S E |
| `calcadas/calcada-t.glb` | Caminho de pedestres em T (braços W, E e S) | 12.00 x 0.00 x 12.00 | 26 | 4.7 | W E S |
| `calcadas/calcada-cruzamento.glb` | Cruzamento de caminhos de pedestres (4 braços) | 12.00 x 0.00 x 12.00 | 34 | 5.4 | N E S W |
| `calcadas/calcada-fim.glb` | Caminho de pedestres que termina numa pracinha redonda (vindo do sul) | 12.00 x 0.00 x 12.00 | 68 | 7.8 | S |

## Faixas pintadas (decalques)

| Peça | O que é | Tamanho (m) | Triângulos | KB | Conexões |
|---|---|---|---|---|---|
| `faixas/faixa-central-tracejada.glb` | Linha central amarela tracejada (3 m de traço, 3 m de vão), 12 m | 0.15 x 0.00 x 9.00 | 4 | 1.4 | — |
| `faixas/faixa-central-dupla.glb` | Linha central amarela dupla contínua (proibido ultrapassar), 12 m | 0.38 x 0.00 x 12.00 | 4 | 1.4 | — |
| `faixas/faixa-borda.glb` | Linhas de borda brancas dos dois lados da pista, 12 m | 6.52 x 0.00 x 12.00 | 4 | 1.4 | — |
| `faixas/faixa-pedestres.glb` | Faixa de pedestres (zebra) de 7 m x 3 m | 6.50 x 0.00 x 3.00 | 14 | 2.1 | — |
| `faixas/linha-retencao.glb` | Linha de retenção (PARE) de uma faixa | 3.20 x 0.00 x 0.40 | 2 | 1.2 | — |
| `faixas/seta-frente.glb` | Seta de seguir em frente, 3 m, aponta para +Z | 0.90 x 0.00 x 3.00 | 3 | 1.3 | — |

## Placas

| Peça | O que é | Tamanho (m) | Triângulos | KB | Conexões |
|---|---|---|---|---|---|
| `placas/placa-pare.glb` | Placa PARE (R-1): octógono vermelho | 0.80 x 2.65 x 0.16 | 172 | 33.5 | — |
| `placas/placa-de-a-preferencia.glb` | Placa Dê a preferência (R-2): triângulo invertido | 0.95 x 2.67 x 0.16 | 152 | 21.4 | — |
| `placas/placa-velocidade-40.glb` | Velocidade máxima 40 km/h (R-19) | 0.75 x 2.63 x 0.16 | 252 | 65.0 | — |
| `placas/placa-velocidade-60.glb` | Velocidade máxima 60 km/h (R-19) | 0.75 x 2.63 x 0.16 | 252 | 70.5 | — |
| `placas/placa-sentido-proibido.glb` | Sentido proibido (R-3): círculo vermelho com barra branca | 0.75 x 2.63 x 0.16 | 252 | 42.8 | — |
| `placas/placa-proibido-estacionar.glb` | Proibido estacionar (R-6a) | 0.75 x 2.63 x 0.16 | 252 | 56.9 | — |
| `placas/placa-pedestres.glb` | Passagem de pedestres (A-32b): losango amarelo | 0.90 x 2.70 x 0.16 | 156 | 33.0 | — |
| `placas/placa-sentido-obrigatorio.glb` | Siga em frente (sentido obrigatório): círculo azul com seta | 0.75 x 2.63 x 0.16 | 252 | 45.9 | — |
| `placas/placa-rua.glb` | Placa de nome de rua (verde, texto "RUA EXEMPLO"; troque o texto em placas.p_rua) | 1.10 x 2.63 x 0.16 | 156 | 46.3 | — |
| `placas/placa-rua-hryz.glb` | Placa de rua azul com "RUA HRYZ" (marca do canal dentro do cenário) | 1.10 x 2.63 x 0.16 | 156 | 44.5 | — |

## Semáforos, postes de luz e hidrantes

| Peça | O que é | Tamanho (m) | Triângulos | KB | Conexões |
|---|---|---|---|---|---|
| `mobiliario/semaforo-apagado.glb` | Semáforo de poste com as três luzes apagadas | 0.36 x 3.74 x 0.86 | 624 | 54.0 | — |
| `mobiliario/semaforo-vermelho.glb` | Semáforo de poste com a luz vermelha ligada | 0.36 x 3.74 x 0.86 | 624 | 54.0 | — |
| `mobiliario/semaforo-amarelo.glb` | Semáforo de poste com a luz amarela ligada | 0.36 x 3.74 x 0.86 | 624 | 54.0 | — |
| `mobiliario/semaforo-verde.glb` | Semáforo de poste com a luz verde ligada | 0.36 x 3.74 x 0.86 | 624 | 54.0 | — |
| `mobiliario/semaforo-braco-vermelho.glb` | Semáforo de braço projetado (2 cabeças) com luz vermelha | 5.42 x 6.00 x 0.54 | 1084 | 92.5 | — |
| `mobiliario/semaforo-braco-verde.glb` | Semáforo de braço projetado (2 cabeças) com luz verde | 5.42 x 6.00 x 0.54 | 1084 | 92.6 | — |
| `mobiliario/hidrante.glb` | Hidrante de coluna vermelho | 0.53 x 0.81 x 0.45 | 796 | 62.5 | — |
| `mobiliario/hidrante-amarelo.glb` | Hidrante de coluna amarelo | 0.53 x 0.81 x 0.45 | 796 | 62.6 | — |
| `mobiliario/poste-luz.glb` | Poste de luz urbano de 8 m, braço único, lâmpada acesa | 0.40 x 8.10 x 2.57 | 742 | 60.8 | — |
| `mobiliario/poste-luz-apagado.glb` | Poste de luz urbano de 8 m, braço único, lâmpada apagada | 0.40 x 8.10 x 2.57 | 742 | 60.8 | — |
| `mobiliario/poste-luz-duplo.glb` | Poste de luz de 8 m com dois braços opostos (canteiro central), acesa | 0.40 x 8.10 x 4.76 | 1194 | 95.3 | — |
| `mobiliario/poste-luz-pedestre.glb` | Poste ornamental de pedestre (4,4 m) com globo aceso, para calçadas e praças | 0.62 x 4.52 x 0.60 | 514 | 42.8 | — |

Total: 42 peças, 14251 triângulos, 1.5 MB.
