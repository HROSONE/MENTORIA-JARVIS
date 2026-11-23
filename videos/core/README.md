# Núcleo compartilhado (`videos/core/`)

Infraestrutura reutilizável dos Shorts 3D em Three.js, centralizada para evitar cópia manual entre pastas de vídeo.

## Módulos

| Arquivo | Papel |
|---|---|
| `motor.js` | `criarMotor({ exposicao, near, far, mundos })` + carregador GLB com cache (`glb`, `clonarGLB`), texturas procedurais (`canvasTex`, `texBrilho`, `texFumaca`), `brilho`, partículas determinísticas (`Rajada`) e `tremor`. |
| `util.js` | Matemática (`clamp`, `lerp`, `inv`, `suave`, `suave5`, `entra`, `sai`, `grau`, `v3`), PRNG (`mulberry32`), `ruido`, interpolação por `chaves` e curva `Caminho`. |
| `harness.js` | Servidor HTTP local sobre `videos/` + Playwright/Chromium (SwiftShader) com redirecionamento do CDN `three@0.160.0` para `videos/node_modules/three`. |
| `render.js` | Renderização paralela em quadros JPEG (`window.__total` / `window.__frame`). |
| `quadros.js` | Captura rápida de PNGs em instantes soltos (`window.__setTime`). |
| `tiro.js` | Captura de quadro único em páginas `dev.html` (`window.__tiro`). |
| `montar.sh` | Montagem final em MP4 com FFmpeg e acabamento (`bloom`, `padrao` ou `vivo`), mantendo o arquivo leve (~20 MB). |

## Como usar em um vídeo novo

Em `videos/<novo_short>/js/motor.js`:

```js
import { criarMotor, glb, clonarGLB, sombras, canvasTex, texBrilho, texFumaca, brilho, Rajada, tremor } from '../../core/motor.js';

export const { LARG, ALT, FPS, renderer, scene, cam, mundos, capturar, tela } = criarMotor({
  exposicao: 1.1,
  near: 0.2,
  far: 3200,
  mundos: ['V'],
});
export { glb, clonarGLB, sombras, canvasTex, texBrilho, texFumaca, brilho, Rajada, tremor };
```

Em `videos/<novo_short>/js/util.js`:

```js
export * from '../../core/util.js';
```

E nos scripts Node/Shell da pasta do vídeo:

```js
// harness.js
const { criarHarness } = require('../core/harness');
module.exports = criarHarness(__dirname);

// render.js
const { renderizar } = require('../core/render');
renderizar(__dirname);
```

```bash
# montar.sh
#!/usr/bin/env bash
exec bash "$(dirname "$0")/../core/montar.sh" --acabamento bloom "$@"
```
