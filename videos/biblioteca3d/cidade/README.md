# Kit cidade: ruas, casas, prédios, hospital, estádio, árvores, cercas, móveis e mais

Peças 3D modulares, geradas em código, para montar qualquer cenário urbano nos vídeos (Three.js r160) e também em Blender, Unity ou Godot (formato glTF binário, `.glb`).

![catálogo: ruas, rotatórias, calçadas, faixas, placas, semáforos, hidrantes e postes de luz](previews/catalogo-ruas.webp)
![catálogo: árvores, gramados, cercas, rede elétrica e móveis](previews/catalogo-natureza.webp)
![catálogo: casas, prédios, hospital, delegacia, supermercado, cinema e estádio](previews/catalogo-edificios.webp)

## Cenas de demonstração

Cinco mapas montados só com peças do kit, de dia e de noite (`demo_cidade.html`):

| | |
|---|---|
| **cidade** ![cidade de dia](previews/demo-aereo.webp) | **cidade à noite** ![cidade à noite, nível da rua](previews/demo-noite-rua.webp) |
| **rotatória** ![rotatória de dia](previews/demo-rotatoria.webp) | **rotatória à noite** ![rotatória à noite](previews/demo-rotatoria-noite.webp) |
| **bairro** ![bairro de casas com cercas e árvores](previews/demo-bairro.webp) | **bairro, nível da rua** ![casas, cercas e árvores](previews/demo-bairro-rua.webp) |
| **bairro à noite** ![bairro à noite com janelas acesas](previews/demo-bairro-noite.webp) | **centro** ![centro com hospital, prédios e delegacia](previews/demo-centro.webp) |
| **centro à noite** ![centro à noite com janelas acesas](previews/demo-centro-noite.webp) | **hospital** ![entrada de emergência do hospital](previews/demo-centro-hospital.webp) |
| **cinema à noite** ![cinema com marquise e letreiros acesos](previews/demo-cinema-noite.webp) | **estádio** ![estádio de futebol com rua e estacionamento](previews/demo-estadio.webp) |
| **estádio à noite** ![estádio com refletores](previews/demo-estadio-noite.webp) | **dentro do estádio** ![campo, arquibancadas e placar](previews/demo-estadio-campo.webp) |

- **111 peças** em 18 categorias (com rodovia, aeroporto e condomínio); a lista completa, com medidas e triângulos, está em [`PECAS.md`](PECAS.md):

| Categoria | Peças |
|---|---|
| `ruas` (6) | reta, curva, T, cruzamento, fim de rua e chão de grama (ladrilhos de 12 x 12 m) |
| `rotatorias` (2) | rotatória de 36 x 36 m e mini-rotatória de 12 x 12 m |
| `calcadas` (6) | praça de lajes e caminhos de pedestres (reta, curva, T, cruzamento, fim) |
| `gramados` (3) | gramado detalhado (chão facetado em 3 tons e 330 tufos), com flores e listrado |
| `natureza` (10) | árvore redonda, frondosa (mangueira), pinheiro, cipreste, ipê amarelo e rosa, palmeira, 2 arbustos e tufos de capim |
| `cercas` (8) | cerca de ripas (e com portão), cerca rural, alambrado, muro (e com portão), cerca viva e grade de ferro, em trechos de 12 m |
| `energia` (5) | poste de concreto (e com transformador) e vãos de fio de 12, 24 e 36 m |
| `casas` (4) | térrea, sobrado, moderna e colonial |
| `predios` (4) | residencial de 6 e de 12 andares, torre comercial de vidro e loja de 3 andares |
| `equipamentos` (5) | hospital, delegacia, supermercado, cinema e estacionamento |
| `esporte` (2) | estádio de futebol de 144 x 108 m e campo de várzea de 72 x 48 m |
| `moveis` (11) | mesas (madeira, redonda, piquenique, escrivaninha), cadeiras (madeira, plástico, escritório), banqueta, banco de praça, sofá, mesa com 4 cadeiras |
| `faixas` (6) | tracejado, linha dupla, bordas, faixa de pedestres, linha de retenção, seta |
| `placas` (10) | 8 placas de trânsito e 2 placas de rua |
| `mobiliario` (12) | 6 semáforos, 2 hidrantes e 4 postes de luz |

- Medidas em **metros reais**, cores chapadas em estilo low poly, no mesmo visual dos veículos do Kenney em `../veiculos/`.
- Cada arquivo tem nós com nome (`Asfalto`, `Paredes`, `Telhado`, `Vidro`, `VidroLuz`, `Letreiro`, `Copa`, `Tronco`, `Luz`...), então dá para esconder ou recolorir as partes.
- Todas as peças passaram no validador oficial do glTF (Khronos), com 0 erros e 0 avisos.

## Cidade oficial (`cidade_oficial.html`)

O mapa oficial do canal: **uma cidade inteira com tudo o que a biblioteca tem**, montada em código. Cerca de 600 x 600 m de cidade
(25 quadras de 60 x 60 m), mais a rodovia, o aeroporto e o estádio.

![cidade vista do alto](previews/oficial-aereo.webp)

| | |
|---|---|
| **centro** ![centro](previews/oficial-centro.webp) | **rua** ![rua do centro](previews/oficial-rua.webp) |
| **aeroporto** ![aeroporto](previews/oficial-aeroporto.webp) | **pista** ![decolagem](previews/oficial-pista.webp) |
| **condomínio** ![condomínio Jardim Hryz](previews/oficial-condominio.webp) | **rodovia** ![rodovia](previews/oficial-rodovia.webp) |
| **parque e estádio** ![parque](previews/oficial-parque.webp) | **bairro** ![bairro](previews/oficial-bairro.webp) |
| **à noite** ![noite](previews/oficial-noite.webp) | |

| Região | Onde | O que tem |
|---|---|---|
| Ruas | grade com ruas nos ladrilhos gx = 3, 9, 15, 21, 27, 33 e gz = 2, 8, 14, 20, 26, 32 | a rede é gerada sozinha (reta, curva, T, cruzamento, fim); rotatória em (21, 20); postes, semáforos no centro, placas, hidrantes e carros |
| Rodovia | oeste, x = 12, de ponta a ponta | 3 faixas por sentido, canteiro com mureta, postes de 12 m, placas verdes, trânsito; saídas para a cidade (gz = 8) e para o aeroporto (gz = 34) |
| Centro | quadras do meio | hospital com ambulância, delegacia, praça com palmeiras, torres comerciais, supermercado com estacionamento, cinema e lojas |
| Bairros | oeste, sul e leste | casas do kit (com cercas) e as casas texturizadas da pasta `casas/` (com a caixa de correio Hryz) |
| Condomínio de prédios | quadra (0, 2) | quatro torres, piscina, palmeiras e muro com portão |
| Condomínio de casas "Jardim Hryz" | quadras (3, 3) e (3, 4) | rua interna com portaria (guarita e cancelas), casas, piscina, área verde e muro |
| Parque | quadras (4, 0) e (4, 1) | campo de várzea, árvores, bancos e mesas |
| Estádio | leste | estádio de futebol com estacionamento |
| Aeroporto | sul | avenida com estacionamento, terminal com três jatos Hryz nos fingers, pista de táxi, pista de 480 m com cabeceiras, torre, hangar, biruta, um avião taxiando e outro decolando |
| Pessoas | praça, hospital, terminal | oito personagens do elenco (desligue com `?pessoas=0`) |

Câmeras prontas: `?cam=aereo|topo|centro|rua|aeroporto|pista|rodovia|condominio|predios|estadio|parque|bairro`, ou livre com `?pos=x,y,z&alvo=x,y,z&fov=45&raio=200`
(`raio` = área da sombra). `?noite` acende janelas, postes e letreiros. Norte = -Z, leste = +X; o ladrilho (gx, gz) tem o centro em (12 gx, 12 gz).

### Peças novas do kit (rodovia, aeroporto e condomínio)

![rodovia](previews/catalogo-rodovias.webp)
![aeroporto](previews/catalogo-aeroporto.webp)

| Categoria | Peças |
|---|---|
| `rodovias` (6) | `rodovia-reta` e `rodovia-acesso` (36 x 12 m, 3 faixas por sentido; o acesso liga uma rua no lado +X), `poste-rodovia`, `placa-rodovia-saida`, `placa-rodovia-aeroporto`, `placa-rodovia-cidade` |
| `aeroporto` (9) | `pista-reta` e `pista-cabeceira` (48 x 48 m), `pista-taxi` (24 x 12 m), `patio` (24 x 24 m), `patio-posicao` (48 x 48 m, o avião para com o nariz na barra e a porta no finger), `terminal-aeroporto` (120 x 36 m, letreiro AEROPORTO HRYZ e três fingers), `torre-controle`, `hangar` (letreiro HANGAR HRYZ), `biruta` |
| `condominio` (2) | `guarita` (portaria para pôr em cima de um `rua-reta`: cobertura, guarita, cancelas e letreiro CONDOMÍNIO JARDIM HRYZ) e `piscina` (24 x 12 m, deque elevado, espreguiçadeiras e guarda-sóis) |

Pavimentos do aeroporto têm o topo em y = 0,16 (coloque em y = 0); a rodovia segue as ruas (asfalto em y = 0). Geradas por `gerador/transporte.py`.

## Convenções

| Item | Valor |
|---|---|
| Unidade e eixos | metro; Y para cima |
| Ladrilho de rua | 12 x 12 m, origem no centro, encaixe em grade |
| Pista | mão dupla: 2 faixas de 3,5 m = 7 m de asfalto; calçada de 2,5 m em cada lado |
| Alturas | topo do asfalto em y = 0; topo da calçada, dos caminhos, dos gramados e do `chao-grama` em y = 0,15; tinta 0,012 m acima do asfalto |
| Rua reta | corre ao longo de **Z**, a mesma direção da frente dos carros do Kenney; gire 90° em Y para ir em X |
| Conexões | no meio de cada borda: N = −Z, S = +Z, E = +X, W = −X. Girar 90° em Y leva S para E, depois N, depois W |
| Trânsito | **mão direita**: quem anda para +Z usa a faixa x = −1,75; quem anda para −Z usa x = +1,75 |
| Ladrilhos grandes | `rotatoria` (36 m, centro no centro de um ladrilho), `estadio-futebol` (144 x 108 m: 12 x 9 casas; o centro cai na divisa entre dois ladrilhos em X e no meio de um ladrilho em Z) e `campo-futebol` (72 x 48 m): coloque em y = 0; o chão deles já fica em y = 0,15 |
| Edifícios e casas | **props**: origem no centro da pegada (lote de 12 m ou múltiplos: `kit.pecas[nome].pegada`), pé em y = 0 e **frente (porta, vitrine, letreiro) em +Z**; coloque em y = 0,15 sobre a grama ou a calçada e gire 180° para a frente olhar para −Z |
| Árvores, arbustos, móveis | origem no pé (y = 0); coloque em y = 0,15 sobre a grama ou a calçada; frente dos móveis em +Z (o assento das cadeiras, o lado das gavetas) |
| Cercas e muros | trechos de 12 m ao longo de X, origem no centro, face de fora em +Z; os postes das pontas se sobrepõem, então os trechos se emendam; gire 90° em Y para correr ao longo de Z |
| Rede elétrica | postes com a linha ao longo de X; `fio-vao-N` começa no poste (x = 0) e termina no isolador do poste seguinte, N metros adiante |
| Pedestres e frente dos props | semáforos, hidrantes, placas e postes de luz: **+Z** (lentes, bocal, face da placa, braço do poste). Para olhar para um carro que anda para +Z, gire 180° em Y |
| Luzes da noite | postes, marquises e refletores têm o nó `Luz`; casas, prédios e hospital têm janelas sorteadas no nó `VidroLuz` (cerca de 45 %); letreiros têm o nó `Letreiro`. `kit.luzEstado(objeto, true)` acende tudo; `extras.luzes` diz onde pôr luzes reais |
| Veículos do Kenney | escala **1,7** (ficam com 2,55 m de largura numa faixa de 3,5 m) |

As mesmas convenções estão em `manifest.json` (campo `convencoes`), junto com o tamanho, a pegada, a quantidade de triângulos e as conexões de cada peça.

## Usar no Three.js

```js
import * as THREE from 'three';
import { Kit } from './kit.js';                              // as páginas do canal já usam o importmap do three r160
const kit = await Kit.carregar();                            // lê manifest.json

// ladrilhos na grade (cada casa tem 12 m); `lados` escolhe a rotação pelas conexões desejadas
scene.add(await kit.ladrilho('rua-cruzamento', 0, 0));
scene.add(await kit.ladrilho('rua-reta', 0, 1, 0, ['N', 'S']));
scene.add(await kit.ladrilho('rua-curva', 1, 1, 0, ['W', 'N']));
scene.add(await kit.ladrilho('gramado-detalhado', 1, 0));
scene.add(await kit.ladrilho('calcada-curva', 2, 0, 0, ['W', 'S']));   // caminho de pedestres na grama
scene.add(await kit.ladrilho('rotatoria', 5, 5));                      // rotatória de 36 m: ocupa 3 x 3 casas em volta de (5, 5)

// props em coordenadas locais do ladrilho (x, z); ficam na calçada (y = 0,15)
const sem = await kit.prop('semaforo-apagado', 0, 0, 4.7, 4.7);    // esquina SE, olhando para quem chega do sul
kit.semaforoEstado(sem, 'vermelho');                               // 'vermelho' | 'amarelo' | 'verde' | 'apagado'
scene.add(sem);
scene.add(await kit.prop('hidrante', 0, 1, 4.8, 0));
scene.add(await kit.prop('placa-pare', 0, 1, -4.8, 3, { rotY: Math.PI }));

// casa no lote de um ladrilho de grama: a frente (+Z) olha para a rua ao sul; cerca na frente e árvore no canto
scene.add(await kit.prop('casa-sobrado', 1, 0, 0, 0));
scene.add(await kit.prop('cerca-madeira-portao', 1, 0, 0, 5.85));
scene.add(await kit.prop('arvore-ipe-amarelo', 1, 0, 4.7, 4.5));

// em coordenadas do mundo, com `peca`: o poste de luz, o prédio, o estádio...
const poste = await kit.peca('poste-luz');
poste.position.set(4.8, 0.15, 3); poste.rotation.y = -Math.PI / 2;   // na calçada leste, braço para -X
kit.luzEstado(poste, true);                                          // acende a lâmpada (false apaga); nos prédios acende as janelas e os letreiros
scene.add(poste);
for (const l of kit.luzesDe(poste)) {                                // à noite, uma luz real por lâmpada (luz.foco: use um SpotLight, como nos refletores)
  const luz = new THREE.PointLight(l.cor, l.alcance ** 2 * 1.1, l.alcance * 1.5, 2);
  luz.position.copy(l.pos); scene.add(luz);
}
```

Outras funções do `Kit`: `peca(nome)` (instância solta), `rotacaoPara(nome, lados)` e `naPista(gx, gz, rot, sentido, s)`, que dá a posição de um carro numa faixa. Passe `espelho: true` a `prop()` para o braço do semáforo sair para o outro lado.

Veja as cenas completas em `demo_cidade.html` e o catálogo em `catalogo.html`. As duas páginas precisam de um servidor HTTP na pasta `videos/`:

```bash
cd videos && python3 -m http.server 8777
# cidade (grade 5 x 4: semáforos, placas, hidrantes, postes, caminhos, praça e sete veículos)
#   http://127.0.0.1:8777/biblioteca3d/cidade/demo_cidade.html?cam=aereo|rua|topo|canto|poste
# rotatória (grade 5 x 5: rotatória de 36 m, quatro braços, caminhos nos cantos e seis veículos)
#   ...demo_cidade.html?mapa=rotatoria&cam=aereo|rua|topo|canto|poste
# bairro (grade 8 x 5: 14 casas com cerca, árvores e gramado, parque com mesas, rede elétrica com fios)
#   ...demo_cidade.html?mapa=bairro&cam=aereo|rua|topo|casa|praca|poste
# centro (grade 10 x 6: avenida com dois cruzamentos, hospital, supermercado, cinema, delegacia, prédios e estacionamento)
#   ...demo_cidade.html?mapa=centro&cam=aereo|norte|topo|rua|hospital|cinema|super
# estádio (grade 16 x 11: estádio de 144 x 108 m com rua em volta, estacionamento e carros)
#   ...demo_cidade.html?mapa=estadio&cam=aereo|topo|torre|campo|entrada
# acrescente &noite para a versão noturna (lâmpadas, janelas e letreiros acesos, luzes reais nos postes e refletores); &still esconde o texto
# câmera livre: &pos=x,y,z&alvo=x,y,z&fov=graus
#   http://127.0.0.1:8777/biblioteca3d/cidade/catalogo.html?cat=ruas|rotatorias|calcadas|gramados|natureza|cercas|casas|predios|equipamentos|esporte|moveis|energia|faixas|placas|mobiliario&cam=obl|topo|baixo&cols=4
```

## Veículos do Kenney

Os `.glb` de `../veiculos/` apontam para `Textures/colormap.png`, mas esse PNG **não está no repositório** (o `.gitignore` ignora `*.png`), e por isso os carros aparecem brancos. As demonstrações pintam cada carro com uma cor chapada quando a textura não existe e usam a textura original quando ela está presente.

## Regerar e editar

Precisa de Python 3 com `numpy` e `Pillow`.

```bash
python3 biblioteca3d/cidade/gerador/gerar.py      # recria os .glb, o manifest.json e o PECAS.md
python3 biblioteca3d/cidade/gerador/validar.py    # confere faces, normais, medidas dos ladrilhos, pegadas e tinta
node biblioteca3d/cidade/gerador/captura.js "demo_cidade.html?still&mapa=bairro&cam=aereo" saida.png 1600 1000   # foto de uma página (com o servidor ligado; usa Playwright e o three de node_modules, como os outros scripts de render)
```

| Arquivo | O que faz |
|---|---|
| `gerador/glb.py` | escritor de glTF 2.0 binário (materiais PBR, textura PNG embutida, transparência, nós com nome e `extras`) |
| `gerador/malha.py` | construtor de malhas: caixas, polígonos (côncavos também), prismas, sólidos de revolução, tubos, esferas facetadas |
| `gerador/paleta.py` | cores e materiais do kit |
| `gerador/ruas.py`, `rotatoria.py`, `calcadas.py`, `faixas.py` | ruas (as medidas da pista ficam no topo de `ruas.py`), rotatórias, praça e caminhos, tinta |
| `gerador/placas.py` + `texturas.py` | placas: poste, chapa e a face desenhada com Pillow |
| `gerador/mobiliario.py`, `iluminacao.py` | semáforos, hidrante e postes de luz com a lista de luzes de cada um |
| `gerador/natureza.py` | árvores, arbustos e gramados (tufos e flores sorteados com semente fixa) |
| `gerador/cercas.py`, `energia.py`, `moveis.py` | cercas e muros, rede elétrica, mesas e cadeiras |
| `gerador/edificio.py` | ferramentas de construção: paredes, telhados, janelas (VidroLuz), portas, sacadas, degraus, letreiros |
| `gerador/casas.py`, `predios.py`, `equipamentos.py`, `esporte.py` | as casas, os prédios, o hospital e companhia, o estádio e o campo |
| `gerador/letreiros.py` | letreiros, cartazes, placar e helipoliporto desenhados com Pillow |
| `gerador/gerar.py` | gera tudo e escreve o manifest |

**Para criar uma peça nova:** escreva uma função que devolva uma `Malha` (ou uma lista de `(nome_do_nó, Malha)`), registre-a no dicionário `PECAS` do módulo, rode `gerar.py` e depois `validar.py`. Edifícios novos usam a classe `Obra` de `edificio.py` (`piso`, `caixa`, `janela`, `porta`, `sacada`, `letreiro`, `telhado_duas_aguas`...). Para mudar a largura da pista ou da calçada, altere `H`, `S` e `TILE` no topo de `ruas.py` e rode `gerar.py` de novo.

## O que ainda não tem

Rampa de garagem, lombada e faixa elevada, pista de 4 faixas e avenida com canteiro, rotatória de duas faixas, ônibus e ponto de ônibus, escola, igreja, posto de gasolina, ponte e viaduto, parquinho e piscina, trânsito pela esquerda, faixas e setas curvas. O cone está em `../veiculos/cone.glb` e as pessoas em `../personagens/`.

## Licença

Gerado em código para o canal Hryz Animation: uso livre nos vídeos, sem precisar dar crédito. O desenho das placas segue o padrão brasileiro de sinalização (CONTRAN) de forma simplificada; "Hryz" aparece como nome do supermercado, do estádio e da rua dentro do cenário (marca do canal).
