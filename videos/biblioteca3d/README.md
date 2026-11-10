# Biblioteca 3D do canal (reutilizável)

Os modelos baixados aqui são **CC0 (domínio público)**: podem ser usados em qualquer vídeo, sem precisar dar crédito (o crédito é cortesia). A pasta `cidade/` foi gerada em código para o canal e também é de uso livre.

| Pasta | Conteúdo | Autor | Fonte |
|---|---|---|---|
| `personagens/` | `human.fbx`: humano com esqueleto e animações (Idle, Walk, Run, Jump, Punch, Working, Death). Paletas de cor em `*.png` (32×32): trocar as cores da paleta muda roupa, pele e cabelo | Quaternius | https://opengameart.org/content/animated-human-low-poly |
| `personagens/corredor/` | **Corredor**: personagem original com esqueleto de 29 ossos e animações **Parado, Andar, Correr e Pular** (pés sem escorregar, cachecol simulado). Duas versões: silhueta escura (`corredor.glb`, com borda de luz quente) e colorida (`corredor-colorido.glb`). Ajudante `corredor.js`, visualizador `corredor.html` | gerado em código (Hryz Animation) | `personagens/corredor/gerador/`; veja `personagens/corredor/README.md` |
| `personagens/elenco/` | **Elenco** de uma cena de susto: maníaco, Dona Lurdes (velha com bengala) e quatro crianças (Davi, Théo, Lia e Nina), com esqueleto, **rosto que mexe** (expressões, piscar, olhar, boca) e animações Parado, Andar, Correr, Fugir, Pular e Assustado (pés sem escorregar, cabelos simulados). Ajudante `elenco.js`, visualizador `elenco.html`, cena de teste `cena-susto.html` | gerado em código (Hryz Animation) | `personagens/elenco/gerador/`; veja `personagens/elenco/README.md` |
| `personagens/soldado/` | soldado tático (GLB estático, sem esqueleto), modelo do dono do canal guardado como base para melhorias | dono do canal | veja `personagens/soldado/README.md` |
| `veiculos/` | ~50 veículos em `.glb` (sedan, suv, taxi, police, ambulance, firetruck, truck, delivery, van, tractor, kart, peças) + `Textures/colormap.png` | Kenney (Car Kit) | https://opengameart.org/content/car-kit |
| `casas/` | 6 casas em `.obj` com texturas assadas (`house_a/b/c_bake.png`, `ao_house*.png`) | drummyfish | https://opengameart.org/content/family-house-collection |
| `aviao/` | `Jetliner.obj`: jato comercial (partes: Fusalage, Wings, Tail, TurboFans) | NuclearOsmosis | https://opengameart.org/content/jumbo-jetwide-body |
| `cidade/` | kit urbano em `.glb` (94 peças): ruas, rotatórias, calçadas, faixas, placas, semáforos, hidrantes, postes de luz e de energia; casas, prédios, hospital, delegacia, supermercado, cinema, estacionamento, estádio e campo de futebol; árvores, arbustos, gramados detalhados, cercas e muros; mesas, cadeiras, bancos e sofá. Metros reais, mão direita, encaixe em grade; luzes, janelas e letreiros acendem à noite | gerado em código (Hryz Animation) | `cidade/gerador/`; veja `cidade/README.md` |

## Como usar no Three.js (r160)
- Personagem: `FBXLoader` → escala `1.78 / altura` → `SkeletonUtils.clone` para várias pessoas → `AnimationMixer`. Recolorir a paleta com canvas (ver `../larry3d/larry3d.html`, função `paletteTex`).
  - Sentar: `LeftUpLeg/RightUpLeg` x −82°, `LeftLeg/RightLeg` x −84°.
  - Acenar: `RightArm` x −140°, `RightForeArm` z −40° ± 25°.
  - Braços para cima: `RightArm` e `LeftArm` x −150°. Mirar para a frente: `RightArm` [−60, 0, −85], `LeftArm` [−60, 0, 85].
  - Acessórios (boné, tênis, logo) seguem o osso em coordenadas de mundo a cada quadro (`updAcc`).
- Corredor (esqueleto próprio, sem retarget): `import { Corredor } from './personagens/corredor/corredor.js'` → `Corredor.carregar('.../corredor.glb')` → `eu.tocar('Correr')` + `eu.atualizar(dt)`; clipes no lugar, `eu.info('Correr').velocidade` (m/s) para mover o objeto. Veja o README dele.
- Elenco (maníaco, velha, crianças): `import { Personagem } from './personagens/elenco/elenco.js'` → `Personagem.carregar('.../maniaco.glb')` → `m.tocar('Andar')`, `m.rosto({ expressao: 'maldoso' })`, `m.atualizar(dt)`; clipes no lugar, `m.info('Andar').velocidade` (m/s) para mover o objeto. Veja o README dele.
- Veículos: `GLTFLoader`, escala ~1,6–1,9 para ficar na proporção do personagem.
- Casas: `OBJLoader` + `MeshStandardMaterial({ map: house_X_bake.png })`, centralizar a geometria e escalar para ~8 m.
- Cidade: `cidade/kit.js` monta os ladrilhos em grade (12 m por casa; a rotatória grande ocupa 3 x 3 e o estádio 12 x 9), põe placas, semáforos, hidrantes, postes, casas, prédios, árvores, cercas e móveis (`kit.prop` sobre a calçada ou a grama, em y = 0,15), troca a luz do semáforo (`kit.semaforoEstado`) e acende as lâmpadas, janelas e letreiros (`kit.luzEstado`; `kit.luzesDe` dá as luzes reais da noite). Os veículos do Kenney em escala 1,7 ficam em proporção com a pista de 3,5 m. Cinco cenas completas em `cidade/demo_cidade.html` (`?mapa=cidade|rotatoria|bairro|centro|estadio`, `?noite`).
- Avião: `OBJLoader`, nariz no +Z do arquivo (girar 90° em Y para voar em +X).
- Render: servir por HTTP (`python3 -m http.server`) e usar `render3h.js`/Playwright com SwiftShader.

## O que ainda não tem asset pronto (feito em código em `../larry3d/`; ruas, edifícios, árvores, cercas, móveis, postes e o resto da cidade estão em `cidade/`)
Cadeira de praia, balões, cerca, postes/fio, tanque de hélio, caixas, céu (shader) e nuvens.
