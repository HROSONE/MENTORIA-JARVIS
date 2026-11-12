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

## Casas

| Peça | O que é | Tamanho (m) | Triângulos | KB | Conexões |
|---|---|---|---|---|---|
| `casas/casa-simples.glb` | Casa térrea amarela de duas águas, com varanda de entrada e chaminé (8 x 8 m) | 9.10 x 6.20 x 10.54 | 548 | 52.5 | — |
| `casas/casa-sobrado.glb` | Sobrado branco de dois andares com garagem, sacada de vidro e telhado de quatro águas (9 x 8 m) | 10.20 x 8.13 x 10.19 | 956 | 85.9 | — |
| `casas/casa-moderna.glb` | Casa moderna de cubos brancos e grafite, vidro, ripado de madeira, garagem e terraço (10 x 8 m) | 10.62 x 6.80 x 8.67 | 588 | 56.2 | — |
| `casas/casa-colonial.glb` | Casa colonial azul (10,4 x 7,7 m) com varanda de seis colunas, venezianas verdes e telhado de quatro águas | 11.60 x 6.77 x 10.19 | 924 | 81.3 | — |

## Prédios

| Peça | O que é | Tamanho (m) | Triângulos | KB | Conexões |
|---|---|---|---|---|---|
| `predios/predio-residencial-6.glb` | Prédio residencial de 6 andares (cantos de tijolo, sacadas de vidro, portaria com marquise e caixa-d'água) | 10.20 x 21.92 x 11.10 | 2778 | 226.4 | — |
| `predios/predio-residencial-12.glb` | Prédio residencial de 12 andares com duas coberturas recuadas, caixa-d'água e antena | 10.24 x 44.60 x 11.02 | 2724 | 219.8 | — |
| `predios/predio-comercial-10.glb` | Torre comercial de vidro de 10 andares (24 x 12 m) com lobby de dois andares e marquise | 20.24 x 48.60 x 11.52 | 1314 | 111.3 | — |
| `predios/predio-loja-3.glb` | Prédio de 3 andares com loja no térreo (vitrines, toldo listrado, letreiro) e apartamentos com sacadinhas de ferro | 11.50 x 12.77 x 10.65 | 2626 | 231.6 | — |

## Hospital, delegacia, supermercado, cinema e estacionamento

| Peça | O que é | Tamanho (m) | Triângulos | KB | Conexões |
|---|---|---|---|---|---|
| `equipamentos/hospital.glb` | Hospital de 36 x 24 m: torre de 7 andares com átrio de vidro, duas alas de 4 andares, cobertura de emergência, cruzes e helipoliporto | 35.94 x 30.25 x 19.69 | 4144 | 459.8 | — |
| `equipamentos/delegacia.glb` | Delegacia de polícia de 24 x 12 m: dois andares azul e cinza, pórtico de colunas com escada, sirenes e bandeiras | 20.38 x 9.30 x 11.27 | 1318 | 253.9 | — |
| `equipamentos/supermercado.glb` | Supermercado de 36 x 24 m: vitrine corrida, entrada de vidro, letreiro SUPERMERCADO, totem, abrigos com carrinhos e portões de carga | 34.40 x 11.20 x 20.77 | 2486 | 476.9 | — |
| `equipamentos/cinema.glb` | Cinema de 24 x 24 m: marquise com lâmpadas, letreiro CINEMA, cartazes, bilheteria, placa vertical e sala alta nos fundos | 20.67 x 14.65 x 19.96 | 1544 | 418.4 | — |
| `equipamentos/estacionamento.glb` | Ladrilho de estacionamento de 12 x 12 m (topo em y = 0,15): quatro vagas de 3 x 5 m com calços e corredor de 7 m; emenda lado a lado | 12.00 x 0.12 x 12.00 | 54 | 6.9 | — |

## Esporte (ladrilhos grandes: coloque em y = 0)

| Peça | O que é | Tamanho (m) | Triângulos | KB | Conexões |
|---|---|---|---|---|---|
| `esporte/estadio-futebol.glb` | Estádio de futebol de 144 x 108 m: campo 100 x 64 m com marcações e traves, quatro arquibancadas cobertas, quatro torres de refletores, placar e letreiro ESTÁDIO HRYZ | 144.00 x 40.60 x 107.60 | 7376 | 749.1 | — |
| `esporte/campo-futebol.glb` | Campo de várzea de 72 x 48 m (campo 64 x 40 m): gramado listrado, terra batida nos gols, traves com rede, bancos e quatro postes de luz | 72.00 x 11.60 x 48.00 | 1254 | 109.4 | — |

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

## Rodovia (peças de 36 x 12 m, coloque em y = 0)

| Peça | O que é | Tamanho (m) | Triângulos | KB | Conexões |
|---|---|---|---|---|---|
| `rodovias/rodovia-reta.glb` | Rodovia de 36 x 12 m ao longo de Z: 3 faixas por sentido, acostamentos, canteiro de grama com mureta de concreto | 36.00 x 0.96 x 12.00 | 56 | 9.8 | N S |
| `rodovias/rodovia-acesso.glb` | Rodovia com a saída para uma rua comum no lado +X (encaixa num ladrilho de rua em x = +18 m), com zebrado no acostamento | 36.00 x 0.96 x 12.00 | 90 | 12.5 | N S E |
| `rodovias/poste-rodovia.glb` | Poste de 12 m para o canteiro central, com dois braços e duas luminárias | 7.60 x 12.40 x 0.56 | 156 | 15.5 | — |
| `rodovias/placa-rodovia-saida.glb` | Placa verde de rodovia (6 x 3 m em dois postes): SAÍDA / CENTRO | 6.00 x 5.60 x 0.17 | 52 | 67.3 | — |
| `rodovias/placa-rodovia-aeroporto.glb` | Placa verde de rodovia: AEROPORTO / PRÓXIMA SAÍDA | 6.00 x 5.60 x 0.17 | 52 | 82.9 | — |
| `rodovias/placa-rodovia-cidade.glb` | Placa verde de rodovia: HRYZ / BEM-VINDO | 6.00 x 5.60 x 0.17 | 52 | 58.9 | — |

## Aeroporto (pavimentos em y = 0; edifícios em y = 0,15)

| Peça | O que é | Tamanho (m) | Triângulos | KB | Conexões |
|---|---|---|---|---|---|
| `aeroporto/pista-reta.glb` | Trecho de 48 x 48 m da pista de pouso (45 m de pavimento): bordas brancas, eixo tracejado e luzes de borda | 48.00 x 0.35 x 48.00 | 268 | 24.6 | — |
| `aeroporto/pista-cabeceira.glb` | Cabeceira da pista (48 x 48 m): barras brancas, número 09, linha e luzes verdes no fim (-Z) | 48.00 x 0.35 x 48.00 | 1262 | 130.9 | — |
| `aeroporto/pista-taxi.glb` | Pista de táxi de 24 x 12 m: eixo e bordas amarelas, luzes azuis | 24.00 x 0.35 x 12.00 | 144 | 15.2 | — |
| `aeroporto/patio.glb` | Pátio de concreto de 24 x 24 m com juntas a cada 6 m | 24.00 x 0.00 x 24.00 | 14 | 2.9 | — |
| `aeroporto/patio-posicao.glb` | Posição de estacionamento de avião (48 x 48 m): linha de entrada amarela, barra de parada e limites das asas | 48.00 x 0.01 x 48.00 | 38 | 7.0 | — |
| `aeroporto/terminal-aeroporto.glb` | Terminal de 120 x 36 m: dois andares de vidro, marquise de embarque, letreiro AEROPORTO HRYZ e três fingers nos fundos (posições de avião a x = -48, 0, 48, centro 51 m atrás) | 123.00 x 21.30 x 63.00 | 850 | 139.6 | — |
| `aeroporto/torre-controle.glb` | Torre de controle de 39 m: prédio de base, fuste, cabine de vidro escuro com sacada, antenas e luz vermelha | 10.60 x 39.58 x 10.60 | 1138 | 96.6 | — |
| `aeroporto/hangar.glb` | Hangar de 48 x 36 m com teto em arco, portão de folhas metálicas e letreiro HANGAR HRYZ | 48.00 x 11.00 x 36.53 | 212 | 60.1 | — |
| `aeroporto/biruta.glb` | Biruta de 6 m: cone listrado laranja e branco apontando para +X | 4.17 x 6.45 x 0.88 | 168 | 15.5 | — |

## Condomínio

| Peça | O que é | Tamanho (m) | Triângulos | KB | Conexões |
|---|---|---|---|---|---|
| `condominio/guarita.glb` | Portaria de condomínio para um ladrilho de rua: cobertura, guarita de vidro, ilha, duas cancelas e letreiro CONDOMÍNIO JARDIM HRYZ | 12.00 x 7.92 x 6.00 | 284 | 79.9 | — |
| `condominio/piscina.glb` | Área de piscina de 24 x 12 m: deque, piscina de 14 x 6 m com escada, quatro espreguiçadeiras e dois guarda-sóis | 24.00 x 3.05 x 12.00 | 376 | 34.2 | — |

Total: 111 peças, 74595 triângulos, 7.7 MB.
