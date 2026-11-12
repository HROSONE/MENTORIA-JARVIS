# Inventário do que já existe (consultar ANTES de criar qualquer vídeo)

Regra do canal: **antes de modelar qualquer coisa, procure aqui.** Se já existe, reutilize; se não existe, crie uma vez, **guarde na biblioteca e registre neste arquivo** para o próximo vídeo.

## Cidade (kit `biblioteca3d/cidade`, 12 m por ladrilho; ver `PECAS.md` e `catalogo.html`)
- **ruas** (6): chao-grama, rua-cruzamento, rua-curva, rua-fim, rua-reta, rua-t
- **rotatorias** (2): rotatoria, rotatoria-mini
- **calcadas** (6): calcada-cruzamento, calcada-curva, calcada-fim, calcada-lisa, calcada-reta, calcada-t
- **faixas** (6): faixa-borda, faixa-central-dupla, faixa-central-tracejada, faixa-pedestres, linha-retencao, seta-frente
- **placas** (10): placa-de-a-preferencia, placa-pare, placa-pedestres, placa-proibido-estacionar, placa-rua, placa-rua-hryz, placa-sentido-obrigatorio, placa-sentido-proibido, placa-velocidade-40, placa-velocidade-60
- **mobiliario** (12): hidrante, hidrante-amarelo, poste-luz, poste-luz-apagado, poste-luz-duplo, poste-luz-pedestre, semaforo-amarelo, semaforo-apagado, semaforo-braco-verde, semaforo-braco-vermelho, semaforo-verde, semaforo-vermelho
- **natureza** (10): arbusto, arbusto-flores, arvore-cipreste, arvore-frondosa, arvore-ipe-amarelo, arvore-ipe-rosa, arvore-palmeira, arvore-pinheiro, arvore-redonda, tufos-capim
- **gramados** (3): gramado-detalhado, gramado-flores, gramado-listrado
- **cercas** (8): alambrado, cerca-madeira, cerca-madeira-portao, cerca-rural, cerca-viva, grade-ferro, muro, muro-portao
- **energia** (5): fio-vao-12, fio-vao-24, fio-vao-36, poste-energia, poste-energia-transformador
- **moveis** (11): banco-praca, banqueta, cadeira-escritorio, cadeira-madeira, cadeira-plastica, conjunto-jantar, mesa-escritorio, mesa-madeira, mesa-piquenique, mesa-redonda, sofa
- **casas** (4): casa-colonial, casa-moderna, casa-simples, casa-sobrado
- **predios** (4): predio-comercial-10, predio-loja-3, predio-residencial-12, predio-residencial-6
- **equipamentos** (5): cinema, delegacia, estacionamento, hospital, supermercado
- **esporte** (2): campo-futebol, estadio-futebol

## Veículos (`biblioteca3d/veiculos`, Kenney CC0; escala 1,7 no kit)
- ambulance, box, cone, cone-flat, delivery, delivery-flat, firetruck, garbage-truck, hatchback-sports, kart-oobi, kart-oodi, kart-ooli, kart-oopi, kart-oozi, police, race, race-future, sedan, sedan-sports, suv, suv-luxury, taxi, tractor, tractor-police, tractor-shovel, truck, truck-flat, van, wheel-dark, wheel-default, wheel-racing, wheel-tractor-back, wheel-tractor-dark-back, wheel-tractor-dark-front, wheel-tractor-front, wheel-truck

## Personagens (`biblioteca3d/personagens/elenco`, com esqueleto, rosto que mexe e clipes Parado/Andar/Correr/Pular/Assustado)
- aviador, bombeiro, davi, entregador, faxineira, homem, jovem_a, jovem_b, jovem_c, lia, mae, maniaco, nina, pai, policial, soldado, teo, terno2, terno3, velha, velha_luto
- `corredor` (silhueta e colorido, `biblioteca3d/personagens/corredor`); `teen/teen.glb` (garoto de camisa vermelha, **sem esqueleto**: só pose fixa); `assets/RobotExpressive.glb` (robô CC0).
- Repintar com `ator.pintar({M_<material>: cor})` (ex.: `jovem_a` de camisa vermelha e calça azul). Novos personagens: `biblioteca3d/personagens/elenco/gerador/` (`personagens*.py`, `gerar.py`).

## Módulos de cena reutilizáveis (copiar a pasta `js/` de um Short e trocar só `mundo.js`/`cenas.js`)
- **Motor e câmera:** `motor.js`, `base.js`, `util.js`, `atores.js` (IK de braço, sentar, olhar), `lote.js` (caixas fundidas e sacos de areia), render: `render.js`, `render_tempos.js`, `render_folha.js`, `montar.sh`.
- **Efeitos de guerra:** `sono_militar/js/fx.js` (explosões, mísseis, caças, rastros, holofotes, fogueiras, pulso de luz).
- **Ondas de choque e multidão instanciada:** `todos_pulando/js/mundo.js` (anéis, parede de ar, cúpula; multidões da África, Brasil e China).
- **Espaço e escala:** Terra (inteira, empurrada, amassada), átomo, estrelas — `todos_pulando/js/mundo.js`.
- **Celular com tela de alerta**, relógio digital gigante — `todos_pulando/js/mundo.js`.
- **Máquina do tempo (3 anéis de giroscópio, reator, console com tela do ano, alavanca, descargas)** — `biblioteca3d/veiculos/maquina_tempo.js` (visualizador `maquina_tempo.html`).
- **Cidade seca, vórtice de relógios, cidade neon, laboratório, arma de encolhimento, cidade miniatura (kit a 1:83), banana em 12 fatias cortáveis, maçã torneada, machados de miniatura** — `viagem_futuro/js/mundo.js`.
- **Gente de verdade (elenco) em cena dramática:** andar fraco, desabar, ficar deitado, de pé fraco, magros por escala (`FINO`) — `viagem_futuro/js/gente.js`. Câmera só desenha quem está no quadro (corte por frustum em `planos.js`).
- **Guarita de sacos de areia, ninho de atirador, sala de aula de 1942, quarto, lago com canoa, luneta, olhos fechados com cílios** — `sono_militar/js/`.
- **Casa em corte, cabine de elevador, rua nevada** — `elevador/js/`.
- **SVG 2D, natureza e criaturas (Short "A lagarta vira sopa")** — `svg/lagarta/_arte.js`: céu com hora do dia (`ceu(k)`), galho com almofada de seda, folhas de erva-leiteira (`folha`), folhagem desfocada em camadas com paralaxe (`ext`), **lagarta-monarca** em J com pele que sobe e cai (`lagarta`), **crisálida** jade com pontinhos dourados que fica transparente e racha (`crisalida`), interior em corte com sopa, enzimas, discos imaginais e borboleta dobrada (`barril`, `interior`), **borboleta-monarca** de cima com asas que inflam, abrem e batem (`borboleta`), etiqueta de dias pendurada (`etiquetaDia`). Som: `svg/lagarta/sfx_lagarta.py`.
- **Som:** toolkit em `sono_militar/sfx_sono.py` e `elevador/sfx_elevador.py` (explosões, passos, respiração, reverbs por espaço).

## Como registrar algo novo
Depois de criar um elemento 3D novo (cenário, prop, personagem), mova o código para um módulo claro, cite o arquivo aqui e, se for modelo, salve o `.glb` na biblioteca com descrição no `README` da pasta.
