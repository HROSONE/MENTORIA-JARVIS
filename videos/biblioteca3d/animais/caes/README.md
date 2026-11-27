# Matilha de Cães 3D (Blender 4.0 + Three.js)

4 raças completas, riggadas com o mesmo esqueleto canino de **22 ossos** e prontas para jogos e vídeos em Three.js (`+Z` para frente, patas no chão em `Y = 0`):

- **`caramelo.glb`** — Vira-lata Caramelo (pelagem dourada, orelha dobrada, coleira azul)
- **`pastor.glb`** — Pastor Alemão (porte atlético, orelhas pontudas eretas, manto preto no dorso, coleira vermelha)
- **`dalmata.glb`** — Dálmata (branco com manchas orgânicas escuras, orelhas caídas, coleira vermelha)
- **`pug.glb`** — Pug (compacto, focinho achatado escuro, rabo enrolado em espiral, coleira verde)
- **`caes_matilha.blend`** — Cena-fonte no Blender com as 4 raças e iluminação de estúdio

## Uso em Three.js (`cao.js`)

```js
import { carregarCao } from './cao.js';

const cao = await carregarCao('caramelo'); // 'caramelo' | 'pastor' | 'dalmata' | 'pug'
scene.add(cao.obj);
cao.tocar('farejar'); // parado, andar, trotar, correr, farejar, cheirarTraseiro, serCheirado, reverencia, marcar, cavar, sentar, pular, rolar, latir
cao.atualizar(dt);
```

## Regenerar no Blender

```bash
blender -b --python videos/biblioteca3d/animais/caes/criar_caes.py
```
