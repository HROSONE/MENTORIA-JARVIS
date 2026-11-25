# Carros procedurais da biblioteca (kit)

Além da viatura (`policia/`) e da ambulância (`ambulancia/`), cinco veículos feitos com o **kit comum** `kit/kit.js`
(perfil lateral extrudado com bevel, estufa mais estreita, vidros, rodas, lâmpadas, decalques em canvas, sombra de contato e a mesma API):

| pasta | veículo | medidas usadas (C × L × A, entre-eixos) |
|---|---|---|
| `hatch/` | hatch compacto 5 portas, azul | 4,257 × 1,798 × 1,478 m, 2,637 m (proporções de um Golf Mk7) |
| `taxi/` | táxi amarelo, sedã médio com luminoso TAXI e faixa quadriculada | 4,885 × 1,840 × 1,445 m, 2,825 m (proporções de um Camry 2020) |
| `picape/` | picape grande de cabine dupla, vinho | 5,89 × 2,01 × 1,90 m, 3,68 m (proporções de uma F-150 SuperCrew 5,5') |
| `onibus/` | ônibus escolar Type C amarelo, SCHOOL BUS, braço de STOP, luzes de advertência | ~11,0 × 2,44 × 3,15 m, 6,40 m (Blue Bird Vision de 252") |
| `bombeiros/` | autobomba de cabine custom, escada, mangueiras, portas de enrolar, barra de luzes | ~9,40 × 2,54 × 3,0 m, 4,70 m (pumper de 185") |

Todos genéricos (sem marca); cidade, escola e corpo de bombeiros fictícios ("HRYZ CITY").

```js
const { criar } = await import('./biblioteca3d/veiculos/onibus/onibus.js');
const v = criar({ numero: '12' }); scene.add(v.grupo);
v.farois(true); v.freio(true); v.re(false); v.seta(1, true); v.posicao(true);
v.luzes(t, 'ligado');                  // advertência/emergência (ônibus e bombeiros)
v.rodar(metros); v.esterco(-0.3);      // v.dims = { L, W, H }
```
Opções: `cor`, `placa`, `numero`, e por veículo `escola` (ônibus), `depto` (bombeiros), `sombraChao: false`.

- `bancada.html?v=<pasta>&cam=tq|tqt|tq2|lado|lado2|frente|tras|topo` (+ `noite`, `luzes=ligado&t=..`, `farois`, `freio`, `posicao`).
- `node fotos.js <pasta> [saida] [cams] [extra]` tira as fotos; `<pasta>/previews/*.webp` são as de referência.
- `garagem.html` põe todos (com a viatura e a ambulância) lado a lado (`?noite` com as luzes); `garagem.webp`.

## Máquinas de obra (`escavadeira/`, `retroescavadeira/`, `carregadeira/`, `rolo/`, `basculante/` + `obra/comum.js`)

Genéricas e fictícias ("HRYZ OBRAS"), sem marca, com as **proporções tiradas de fichas técnicas reais** de cada classe:

| Máquina | Referência de classe | Medidas usadas |
|---|---|---|
| Escavadeira hidráulica | esteiras, ~22 t | transporte 9,53 x 2,98 x 2,96 m; esteiras de 4,45 m, sapatas de 0,60 m, bitola 2,38 m; lança 5,7 m, braço 2,9 m, caçamba ~1,2 m³; contrapeso com raio de ~2,8 m |
| Retroescavadeira | ~8–11 t | ~7,2 x 2,31 x 3,6 m; entre-eixos 2,21 m; pneus traseiros 19,5L-24 (~1,49 m), dianteiros ~0,97 m; pá de ~2,3 m; retro ~3 m + 2,2 m |
| Pá carregadeira | articulada, ~18 t | entre-eixos 3,30 m (articulação no meio); 3,46 m no topo da cabine, 2,67 m no capô; 2,745 m nos pneus 23.5R25 (~1,62 m); caçamba de ~2,95 m |
| Rolo compactador | ~11 t, cilindro liso | cilindro 2,134 x 1,534 m; 5,86 x 2,30 x 3,11 m; entre-eixos 2,90 m |
| Caminhão basculante | 6x4 rodoviário | ~8,2 x 2,55 x 3,2 m; tandem traseiro com rodado duplo; pneus ~1,04 m; caçamba de ~12 m³ (5,0 x 2,3 x 1,05 m) que bascula num pino atrás, tampa que abre por cima, carga de terra |

Peças animadas: cilindros hidráulicos que esticam entre os pinos, esteiras com sapatas que andam de verdade (`InstancedMesh`), direção articulada
(pá carregadeira e rolo), vibração do cilindro do rolo, giroflex âmbar. Além da API dos carros, cada máquina tem `v.ferr`:

```js
const v = (await import('./escavadeira/escavadeira.js')).criar();
v.ferr.eixos;                 // [{ id: 'lanca', nome: 'Lança', v, min, max, vel }, 'braco', 'cacamba', 'giro']
v.ferr.mover(0, +dt);         // levanta a lança (taxa de vel por segundo)
v.ferr.definir(2, 1.4);       // caçamba fechada
```
Eixos: escavadeira (Lança, Braço, Caçamba, Giro) · retroescavadeira (Pá, Caçamba da pá, Lança da retro, Braço da retro, Giro da retro;
as sapatas descem sozinhas quando a retro abre) · pá carregadeira (Braços, Caçamba; o ligamento mantém a caçamba nivelada) · rolo (Vibração;
chame `v.vibrar(dt)` a cada quadro) · basculante (Caçamba; `v.carregar()` repõe a terra). Bancada: `bancada.html?v=escavadeira&ferr=0.55,0.2,0.3,0.6`.

No jogo elas ficam no **Canteiro de Obras** (campo ao norte, `jogo/canteiro.js`), dirigíveis; as teclas 1–8 mexem os eixos (no celular: Eixo, ▲, ▼).
