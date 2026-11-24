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
