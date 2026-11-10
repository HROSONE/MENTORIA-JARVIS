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

## Gramados (ladrilhos de 12 x 12 m)

| Peça | O que é | Tamanho (m) | Triângulos | KB | Conexões |
|---|---|---|---|---|---|
| `gramados/gramado-detalhado.glb` | Gramado de 12 x 12 m: chão facetado em três tons de verde e 330 tufos de capim; topo em y = 0,15 | 12.00 x 0.37 x 12.00 | 1778 | 139.5 | — |
| `gramados/gramado-flores.glb` | Gramado detalhado com cerca de 70 flores brancas, amarelas, rosas, roxas e vermelhas | 12.00 x 0.43 x 12.00 | 3248 | 255.9 | — |
| `gramados/gramado-listrado.glb` | Gramado liso de 12 x 12 m com faixas de corte claras e escuras (jardim, campo) | 12.00 x 0.00 x 12.00 | 12 | 2.7 | — |

## Árvores e arbustos

| Peça | O que é | Tamanho (m) | Triângulos | KB | Conexões |
|---|---|---|---|---|---|
| `natureza/arvore-redonda.glb` | Árvore redonda de 6 m (copa facetada em quatro tons de verde) | 4.95 x 6.67 x 4.64 | 648 | 52.8 | — |
| `natureza/arvore-frondosa.glb` | Árvore grande de sombra (mangueira) de 10 m, copa de 9 m de largura | 10.02 x 10.34 x 9.53 | 1024 | 82.2 | — |
| `natureza/arvore-pinheiro.glb` | Pinheiro de 8,5 m em seis andares de cone | 4.30 x 9.45 x 4.30 | 236 | 20.7 | — |
| `natureza/arvore-cipreste.glb` | Cipreste alto e estreito de 8 m | 1.62 x 8.12 x 1.63 | 536 | 43.5 | — |
| `natureza/arvore-ipe-amarelo.glb` | Ipê amarelo em flor, 6 m | 6.33 x 6.51 x 5.74 | 864 | 69.3 | — |
| `natureza/arvore-ipe-rosa.glb` | Ipê rosa em flor, 6 m | 6.30 x 6.59 x 5.81 | 864 | 69.3 | — |
| `natureza/arvore-palmeira.glb` | Palmeira de coco de 9 m com folhas caídas e cocos | 7.08 x 8.95 x 6.93 | 1072 | 86.0 | — |
| `natureza/arbusto.glb` | Arbusto baixo de 1,1 m | 1.85 x 1.22 x 1.81 | 480 | 39.2 | — |
| `natureza/arbusto-flores.glb` | Arbusto de 1,1 m com flores cor-de-rosa | 1.92 x 1.21 x 1.83 | 920 | 73.6 | — |
| `natureza/tufos-capim.glb` | Punhado de capim e flores soltos (1 m) para espalhar à mão; pé em y = 0 | 0.92 x 0.42 x 0.96 | 180 | 20.0 | — |

## Cercas, muros e portões (trechos de 12 m)

| Peça | O que é | Tamanho (m) | Triângulos | KB | Conexões |
|---|---|---|---|---|---|
| `cercas/cerca-madeira.glb` | Cerca de ripas brancas de 1,2 m, trecho de 12 m ao longo de X, frente +Z | 12.14 x 1.25 x 0.14 | 1284 | 100.4 | — |
| `cercas/cerca-madeira-portao.glb` | Cerca de ripas brancas com portão de duas folhas de 3,6 m no meio | 12.14 x 1.51 x 0.21 | 1452 | 114.4 | — |
| `cercas/cerca-rural.glb` | Cerca de fazenda: postes de madeira e três tábuas, 1,3 m | 12.18 x 1.34 x 0.22 | 220 | 18.7 | — |
| `cercas/alambrado.glb` | Alambrado de 2,4 m (postes de metal e tela de losangos translúcida) para quadras, campos e terrenos | 12.16 x 2.51 x 0.15 | 674 | 56.3 | — |
| `cercas/muro.glb` | Muro de 1,3 m com pilares de 1,65 m a cada 3 m e capeamento | 12.58 x 1.78 x 0.58 | 180 | 17.7 | — |
| `cercas/muro-portao.glb` | Muro com portão de ferro de duas folhas de 4 m e pilares altos | 12.58 x 2.46 x 0.72 | 768 | 64.0 | — |
| `cercas/cerca-viva.glb` | Cerca viva (sebe) de 1,1 m de altura e 1 m de largura | 12.00 x 1.18 x 0.96 | 288 | 25.3 | — |
| `cercas/grade-ferro.glb` | Grade de ferro de 1,9 m com lanças e pilares de concreto (hospital, delegacia, praça) | 12.42 x 2.49 x 0.42 | 1512 | 118.5 | — |

## Rede elétrica

| Peça | O que é | Tamanho (m) | Triângulos | KB | Conexões |
|---|---|---|---|---|---|
| `energia/poste-energia.glb` | Poste de concreto de 9 m com cruzeta, três isoladores e cabo de telefonia; a linha corre ao longo de X | 0.40 x 9.00 x 2.30 | 676 | 57.2 | — |
| `energia/poste-energia-transformador.glb` | Poste de energia com transformador de distribuição | 0.58 x 9.00 x 2.30 | 1046 | 88.0 | — |
| `energia/fio-vao-12.glb` | Fios entre dois postes a 12 m (começa no poste em x = 0 e termina em x = 12) | 12.00 x 1.88 x 1.72 | 320 | 25.6 | — |
| `energia/fio-vao-24.glb` | Fios entre dois postes a 24 m | 24.00 x 2.06 x 1.72 | 640 | 49.9 | — |
| `energia/fio-vao-36.glb` | Fios entre dois postes a 36 m | 36.00 x 2.23 x 1.72 | 960 | 74.3 | — |

## Mesas, cadeiras e móveis

| Peça | O que é | Tamanho (m) | Triângulos | KB | Conexões |
|---|---|---|---|---|---|
| `moveis/mesa-madeira.glb` | Mesa de jantar de madeira, 1,6 x 0,9 m, altura 0,75 m | 1.60 x 0.75 x 0.90 | 76 | 8.5 | — |
| `moveis/mesa-redonda.glb` | Mesa redonda de café, 0,8 m de diâmetro, altura 0,73 m | 0.80 x 0.73 x 0.80 | 336 | 28.3 | — |
| `moveis/mesa-piquenique.glb` | Mesa de piquenique de madeira com dois bancos, 1,8 x 2,3 m | 1.80 x 0.82 x 1.97 | 204 | 18.1 | — |
| `moveis/mesa-escritorio.glb` | Escrivaninha 1,4 x 0,7 m com três gavetas (o lado das gavetas é +Z) | 1.40 x 0.76 x 0.70 | 102 | 11.9 | — |
| `moveis/cadeira-madeira.glb` | Cadeira de madeira com encosto de ripas, assento a 0,46 m | 0.44 x 0.92 x 0.42 | 116 | 11.4 | — |
| `moveis/cadeira-plastica.glb` | Cadeira de plástico branca (monobloco), assento a 0,46 m | 0.50 x 0.92 x 0.56 | 170 | 15.4 | — |
| `moveis/cadeira-escritorio.glb` | Cadeira giratória de escritório com rodinhas e braços | 0.62 x 1.03 x 0.64 | 386 | 34.5 | — |
| `moveis/banqueta.glb` | Banqueta redonda de bar, assento a 0,67 m | 0.43 x 0.67 x 0.44 | 260 | 22.4 | — |
| `moveis/banco-praca.glb` | Banco de praça de ferro e madeira, 1,8 m | 1.80 x 0.89 x 0.62 | 196 | 17.5 | — |
| `moveis/sofa.glb` | Sofá de três lugares, 2,0 x 0,9 m | 2.00 x 0.86 x 0.91 | 230 | 20.2 | — |
| `moveis/conjunto-jantar.glb` | Mesa de jantar com quatro cadeiras (duas de cada lado), 1,6 x 2,2 m | 1.60 x 0.92 x 1.66 | 540 | 45.8 | — |

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
| `placas/placa-de-a-preferencia.glb` | Placa Dê a preferência (R-2): triângulo invertido | 0.95 x 2.67 x 0.16 | 152 | 21.5 | — |
| `placas/placa-velocidade-40.glb` | Velocidade máxima 40 km/h (R-19) | 0.75 x 2.63 x 0.16 | 252 | 65.1 | — |
| `placas/placa-velocidade-60.glb` | Velocidade máxima 60 km/h (R-19) | 0.75 x 2.63 x 0.16 | 252 | 70.6 | — |
| `placas/placa-sentido-proibido.glb` | Sentido proibido (R-3): círculo vermelho com barra branca | 0.75 x 2.63 x 0.16 | 252 | 42.9 | — |
| `placas/placa-proibido-estacionar.glb` | Proibido estacionar (R-6a) | 0.75 x 2.63 x 0.16 | 252 | 56.9 | — |
| `placas/placa-pedestres.glb` | Passagem de pedestres (A-32b): losango amarelo | 0.90 x 2.70 x 0.16 | 156 | 33.0 | — |
| `placas/placa-sentido-obrigatorio.glb` | Siga em frente (sentido obrigatório): círculo azul com seta | 0.75 x 2.63 x 0.16 | 252 | 46.0 | — |
| `placas/placa-rua.glb` | Placa de nome de rua (verde, texto "RUA EXEMPLO"; troque o texto em placas.p_rua) | 1.10 x 2.63 x 0.16 | 156 | 46.3 | — |
| `placas/placa-rua-hryz.glb` | Placa de rua azul com "RUA HRYZ" (marca do canal dentro do cenário) | 1.10 x 2.63 x 0.16 | 156 | 44.6 | — |

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

Total: 79 peças, 38749 triângulos, 3.4 MB.
